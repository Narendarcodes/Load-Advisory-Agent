"""Phase 1.5 — live integration verification. Every test here talks to a real service or skips.

Nothing in this module is mocked. A test that cannot reach its service is reported as skipped with the
reason, never as a pass: an offline fake proves the unit, it does not prove the integration.

Environment (see reports/phase1-live-integration-plan.md for the exact bring-up):

    FRAPPE_URL / FRAPPE_API_KEY / FRAPPE_API_SECRET      the read-only agent identity on a dev site
    P15_VICTIM_APP, P15_OTHER_APP                        two synthetic applications, different borrowers
    P15_BUREAU_APP                                       a synthetic application whose stored evidence is
                                                       bureau-backed (tests/e2e/seed_bureau_evidence.py)
    AGENT_CHECKPOINT_REDIS_URL (or ASSERTION_REPLAY_REDIS_URL)
    P15_REDIS_PREFIX                                     dedicated key prefix for this run
    LANGFUSE_*                                           the self-hosted stack, via infra/langfuse/.env
"""
import json
import os
import subprocess
import sys
import time

import pytest
import redis as redis_lib

from loan_advisory.agent import checkpoint as checkpoint_module
from loan_advisory.agent import runtime
from loan_advisory.agent.server import App
from loan_advisory.agent.contracts import AgentRequest, Session
from loan_advisory.application.ports import assert_reader
from loan_advisory.infrastructure.evidence_store import FrappeEvidenceReader
from loan_advisory.infrastructure.frappe_adapter import READ_FIELDS, FrappeUnavailable, ReadOnlyFrappeApplication, UnknownApplication

FRAPPE = all(os.environ.get(k) for k in ("FRAPPE_URL", "FRAPPE_API_KEY", "FRAPPE_API_SECRET"))
APPS = all(os.environ.get(k) for k in ("P15_VICTIM_APP", "P15_OTHER_APP"))
REDIS_URL = os.environ.get("AGENT_CHECKPOINT_REDIS_URL") or os.environ.get("ASSERTION_REPLAY_REDIS_URL") or ""
PREFIX = os.environ.get("P15_REDIS_PREFIX", "p15-live:")

frappe_required = pytest.mark.skipif(not (FRAPPE and APPS), reason="no live Frappe env/applications for this run")
redis_required = pytest.mark.skipif(not REDIS_URL, reason="no live Redis URL configured for this run")


def _reader():
    return ReadOnlyFrappeApplication()


# ============================================================== Service A — live Frappe
@frappe_required
def test_a1_connectivity_authentication_and_the_objects_the_agent_needs():
    reader = _reader()
    doc = reader.get(os.environ["P15_VICTIM_APP"])
    assert doc["name"] == os.environ["P15_VICTIM_APP"]
    assert "custom_lifecycle_state" in doc                       # the DocType the agent reads exists as expected
    public = {n for n in dir(reader) if not n.startswith("_")}
    assert public == {"base_url", "get"}, f"the live read view exposes more than one GET: {sorted(public)}"


@frappe_required
def test_a1_the_read_identity_is_not_administrator_and_cannot_see_credential_material():
    """Privilege measured on the live site, by read attempts only — never by attempting a write."""
    import requests
    reader = _reader()
    for doctype, expected in (("Loan Application", 200), ("Loan Decision Evidence", 200),
                              ("API Key", 403), ("DocPerm", 403), ("Has Role", 403), ("DocType", 403)):
        r = requests.get(f"{reader.base_url}/api/resource/{doctype}", headers=reader._headers(), timeout=20,
                         params={"fields": json.dumps(["name"]), "limit_page_length": "2"})
        assert r.status_code == expected, f"{doctype}: HTTP {r.status_code}, expected {expected}"


@frappe_required
def test_a2_the_live_read_returns_only_the_projected_fields_and_no_applicant_pii():
    doc = _reader().get(os.environ["P15_VICTIM_APP"])
    assert sorted(doc) == sorted(READ_FIELDS), sorted(set(doc) - set(READ_FIELDS))
    for pii in ("applicant_name", "applicant_email_address", "applicant_phone_number", "zip_code",
                "customer_name", "mobile_number", "email_id", "documents", "owner", "modified_by"):
        assert pii not in doc, f"{pii} reached the agent"
    assert doc["applicant"], "the ownership key must survive the projection"
    assert doc["custom_credit_score"] is not None or doc["custom_monthly_income"] is not None


@frappe_required
def test_a2_ownership_is_enforced_and_another_borrowers_application_is_separate():
    from loan_advisory.agent.tools import DecisionTools, NotAuthorized
    from loan_advisory.infrastructure.evidence_store import InMemoryEvidenceSink
    from loan_advisory.agent.tools import InMemoryEvidenceSource

    victim, other = os.environ["P15_VICTIM_APP"], os.environ["P15_OTHER_APP"]
    tools = DecisionTools(_reader(), InMemoryEvidenceSource(InMemoryEvidenceSink()))
    victim_owner = tools.owned_doc(victim, Session(applicant_ref=_reader().get(victim)["applicant"]))["applicant"]
    other_owner = _reader().get(other)["applicant"]
    assert victim_owner != other_owner, "the two fixtures must belong to different borrowers"
    with pytest.raises(NotAuthorized):
        tools.owned_doc(victim, Session(applicant_ref=other_owner))     # cross-borrower read refused
    with pytest.raises(NotAuthorized):
        tools.owned_doc(other, Session(applicant_ref=victim_owner))


@frappe_required
def test_a3_stored_evidence_is_readable_on_the_read_identity_alone():
    for slot in ("EVIDENCE_FRAPPE_URL", "EVIDENCE_FRAPPE_API_KEY", "EVIDENCE_FRAPPE_API_SECRET"):
        assert not os.environ.get(slot), "this test must not have an ingest credential available"
    doc = _reader().get(os.environ["P15_VICTIM_APP"])
    rid = doc["custom_latest_evidence"]
    if not rid:
        pytest.skip("the dev-site fixture has no stored evidence pointer — seed one with tests/e2e/seed_evidence.py")
    record = FrappeEvidenceReader().get_record(rid)
    assert record["record_id"] == rid
    assert record["application_ref"] == os.environ["P15_VICTIM_APP"]
    assert record["decision"] in ("APPROVED", "REJECTED", "ERROR")
    assert record["rule_evaluations"], "a canonical record carries rule-level evidence"
    assert "inputs" in record and "policy" in record
    assert record["is_simulation"] is False


@frappe_required
def test_a3_bureau_backed_evidence_still_explains_through_the_agent():
    """Only runs when the site holds a bureau-backed record; the agent reads, never starts, an evaluation."""
    reader = _reader()
    found = None
    for name in [x for x in (os.environ.get("P15_BUREAU_APP"), os.environ["P15_VICTIM_APP"],
                             os.environ["P15_OTHER_APP"]) if x]:
        pointer = reader.get(name).get("custom_latest_evidence")
        if not pointer:
            continue
        record = FrappeEvidenceReader().get_record(pointer)
        if record.get("bureau"):
            found = (name, record)
            break
    if not found:
        pytest.skip("no bureau-backed evidence on this site; provision one through the bureau pipeline process")
    name, record = found
    from loan_advisory.agent.facts import bureau_facts
    facts = bureau_facts(record)
    assert facts and facts["outcome_kind"], "the explanation layer needs its bureau projection intact"


@frappe_required
def test_a4_an_agent_turn_changes_nothing_on_the_live_site(tmp_path):
    victim = os.environ["P15_VICTIM_APP"]
    reader = _reader()
    before_doc = reader.get(victim)
    before_modified = _full_field(victim, "modified")
    evidence_before = _evidence_count(reader)

    agent, _view = runtime.build_live_agent(llm=_SilentLLM())
    agent.audit_path = tmp_path / "turns.jsonl"
    agent.handoff.path = tmp_path / "handoffs.jsonl"
    response = agent.run(AgentRequest(request_id="p15-a4", conversation_id="p15-a4", message="why was I rejected?",
                                      application_ref=victim), Session(applicant_ref=before_doc["applicant"]))
    assert response.answer, "the turn did not complete against the live site"

    after_doc = reader.get(victim)
    assert after_doc == before_doc, "a projected application field changed during an agent turn"
    assert _full_field(victim, "modified") == before_modified, "Frappe's own modified stamp moved: something wrote"
    assert _evidence_count(reader) == evidence_before, "an agent turn created Decision Evidence"
    assert [k for k in ("custom_lifecycle_state", "status", "custom_latest_evidence")
            if after_doc.get(k) != before_doc.get(k)] == []


def _full_field(app, field):
    """Read one column outside READ_FIELDS straight from the site, to prove `modified` did not move."""
    import requests
    reader = _reader()
    r = requests.get(f"{reader.base_url}/api/resource/Loan Application/{app}", headers=reader._headers(), timeout=20)
    return (r.json().get("data") or {}).get(field)


def _evidence_count(reader):
    """Count evidence rows through the same read-only identity, by asking for the pointer of a known record."""
    import requests
    r = requests.get(f"{reader.base_url}/api/resource/Loan Decision Evidence", headers=reader._headers(), timeout=25,
                     params={"fields": json.dumps(["name"]), "limit_page_length": "200"})
    if not r.ok:
        pytest.skip(f"the read identity cannot enumerate evidence rows (HTTP {r.status_code}); "
                    "compare the two known pointers instead")
    return len(r.json().get("data") or [])


@frappe_required
def test_a4_the_live_graph_holds_no_writer_and_the_read_identity_has_no_write_grant():
    agent, reader = runtime.build_live_agent(llm=_SilentLLM())
    assert_reader(agent.tools.store, role="live store")
    assert_reader(agent.tools.evidence, role="live evidence")
    assert isinstance(agent.tools.store, ReadOnlyFrappeApplication)
    for writer in ("create", "set_status", "persist", "call_method", "put", "post", "delete"):
        assert not hasattr(agent.tools.store, writer), writer
        assert not hasattr(agent.tools.evidence, writer), writer
        assert not hasattr(agent.tools.evidence.reader, writer), writer


@frappe_required
def test_a5_live_failures_fail_closed_and_leak_nothing():
    reader = _reader()
    with pytest.raises(UnknownApplication):
        reader.get("ACC-LOAP-9999-99999")
    with pytest.raises(FrappeUnavailable):
        ReadOnlyFrappeApplication(os.environ["FRAPPE_URL"], "not-a-key", "not-a-secret").get(
            os.environ["P15_VICTIM_APP"])
    with pytest.raises(FrappeUnavailable):
        ReadOnlyFrappeApplication("http://127.0.0.1:1", "k", "s").get(os.environ["P15_VICTIM_APP"])
    # the unknown-reference error text carries no other applicant's data
    try:
        reader.get("ACC-LOAP-9999-99999")
    except UnknownApplication as e:
        assert "applicant" not in str(e).lower() and "@" not in str(e)


# ================================================= Phase 1.6 §B — live bureau-backed evidence
BUREAU_APP = os.environ.get("P15_BUREAU_APP", "")
bureau_required = pytest.mark.skipif(
    not (FRAPPE and BUREAU_APP),
    reason="no bureau-backed fixture application for this run (tests/e2e/seed_bureau_evidence.py)")


def _bureau_record() -> dict:
    """The stored bureau record, read on the agent's own read-only identity — or a skip that says why."""
    pointer = _reader().get(BUREAU_APP).get("custom_latest_evidence")
    if not pointer:
        pytest.skip(f"{BUREAU_APP} carries no evidence pointer — provision the fixture first")
    record = FrappeEvidenceReader().get_record(pointer)
    if not record.get("bureau"):
        pytest.skip(f"{BUREAU_APP}'s stored record has no bureau block — it was not a bureau run")
    return record


def _bureau_turn(llm, tmp_path, tag: str):
    """One live agent turn on the bureau-backed application, as its own borrower."""
    agent, _view = runtime.build_live_agent(llm=llm)
    agent.audit_path = tmp_path / f"{tag}-turns.jsonl"
    agent.handoff.path = tmp_path / f"{tag}-handoffs.jsonl"
    owner = _reader().get(BUREAU_APP)["applicant"]
    response = agent.run(AgentRequest(request_id=tag, conversation_id=tag,
                                      message="how was my credit score worked out?",
                                      application_ref=BUREAU_APP), Session(applicant_ref=owner))
    return agent, response


@bureau_required
def test_a6_the_stored_bureau_evidence_is_readable_on_the_read_identity_alone():
    for slot in ("EVIDENCE_FRAPPE_URL", "EVIDENCE_FRAPPE_API_KEY", "EVIDENCE_FRAPPE_API_SECRET"):
        assert not os.environ.get(slot), "explaining a bureau record must not need an ingest credential"
    record = _bureau_record()
    assert record["application_ref"] == BUREAU_APP
    assert record["is_simulation"] is False, "a bureau run that was persisted is not a simulation"
    assert record["decision"] in ("APPROVED", "REJECTED", "ERROR")
    bureau = record["bureau"]
    assert bureau["fetched"] is True and bureau["report_id"] and bureau["report_schema"] == "bureau-report/1"
    assert bureau["score"]["source"].startswith("SYNTHETIC_BUREAU"), bureau["score"]
    assert bureau["provider_error"] is None
    assert record["rule_evaluations"], "a bureau-backed credit decision still carries rule-level evidence"
    assert record["inputs"]["values"]["credit_score"] == bureau["score"]["value"], \
        "the score the record claims was evaluated is the score in the inputs"


@bureau_required
def test_a6_bureau_facts_project_the_stored_record_without_deciding_anything():
    from loan_advisory.agent.facts import bureau_facts
    record = _bureau_record()
    facts = bureau_facts(record)
    assert facts["recorded_outcome"] == (record.get("outcome") or record["decision"])
    assert facts["legacy_decision"] == record["decision"]
    assert facts["score_source"] == record["bureau"]["score"]["source"]
    assert "synthetic" in facts["score_source_plain"], facts["score_source_plain"]
    assert facts["synthetic_report"] is True
    assert facts["is_provider_failure"] is False and facts["is_data_quality_hold"] is False
    assert facts["is_credit_rejection"] == (facts["outcome_kind"] == "CREDIT_REJECTION")
    # describing is not inventing: strip the blocks and the projection is empty, not a guess
    assert bureau_facts({**record, "bureau": None, "review": None}) is None


@bureau_required
def test_a6_the_bureau_fields_reach_the_explanation_layer(tmp_path):
    """Asserted on the prompt the composer actually received, not on what an LLM might have said."""
    from loan_advisory.agent import facts as F
    from loan_advisory.agent.facts import bureau_facts
    record = _bureau_record()
    llm = _RecordingLLM()
    _agent, response = _bureau_turn(llm, tmp_path, "p16-a6-prompt")
    assert response.answer and response.abstained is False
    compose = [p for tag, p in llm.prompts if tag.startswith("compose_")]
    assert compose, "the turn never reached the composer"
    system = compose[-1]
    bf = bureau_facts(record)
    assert '"bureau"' in system, "the composer was not shown the bureau block at all"
    assert bf["score_source"] in system and bf["score_source_plain"] in system
    assert F.SYNTHETIC_LABEL in system, "the policy the explanation quotes must arrive labelled synthetic"
    assert record["record_id"] in (response.evidence_refs or []), "the answer is not tied to the stored record"


@bureau_required
def test_a6_the_explanation_distinguishes_synthetic_bureau_evidence_from_a_real_report(tmp_path):
    """Composer down: the borrower still gets wording that names the score's origin as synthetic."""
    from loan_advisory.agent.facts import bureau_facts
    from loan_advisory.agent.llm import LLMError

    class _NoComposer(_SilentLLM):
        def chat(self, system, user, **kw):
            raise LLMError("composer down")

    record = _bureau_record()
    _agent, response = _bureau_turn(_NoComposer(), tmp_path, "p16-a6-fallback")
    assert "fallback_template" in response.guard_flags, response.guard_flags
    text = response.answer.lower()
    assert "not a real credit bureau report" in text, response.answer
    assert bureau_facts(record)["score_source_plain"] in response.answer, response.answer
    assert "synthetic" in text


@bureau_required
def test_a6_nothing_the_borrower_can_send_reaches_a_bureau_client():
    """The live surface and the live object graph, not just the source text."""
    import types

    from fastapi.testclient import TestClient

    from loan_advisory.api.app import create_app
    agent, _view = runtime.build_live_agent(llm=_SilentLLM())
    service = App(agent)
    client = TestClient(create_app(service))
    paths = set(client.app.openapi()["paths"])
    assert "/api/chat" in paths, f"the live service serves no chat route: {sorted(paths)}"
    assert "/api/bureau/run" not in paths, sorted(paths)
    assert client.post("/api/bureau/run", json={"application_ref": BUREAU_APP}).status_code == 404
    assert vars(service) == {"agent": agent}

    bureau_names = {"fetch_report", "run_bureau_evaluation", "bureau_run", "bureau_client"}
    seen, frontier, reached = set(), [(agent, 0)], []
    while frontier:
        current, depth = frontier.pop()
        if id(current) in seen or depth >= 4:
            continue
        seen.add(id(current))
        for name in dir(current):
            if name in bureau_names:
                reached.append(f"{type(current).__name__}.{name}")
        for value in list(getattr(current, "__dict__", {}).values()):
            if isinstance(value, (str, bytes, bool, int, float, dict, list, tuple, set, frozenset, types.ModuleType)) \
                    or callable(value):
                continue
            frontier.append((value, depth + 1))
    assert reached == [], f"the live agent can still reach a bureau entry point: {reached}"


@bureau_required
def test_a6_an_agent_turn_on_the_bureau_record_mutates_nothing(tmp_path):
    reader = _reader()
    before_doc = reader.get(BUREAU_APP)
    before_modified = _full_field(BUREAU_APP, "modified")
    evidence_before = _evidence_count(reader)
    record_before = FrappeEvidenceReader().get_record(before_doc["custom_latest_evidence"])

    _agent, response = _bureau_turn(_SilentLLM(), tmp_path, "p16-a6-mutation")
    assert response.answer

    after_doc = reader.get(BUREAU_APP)
    assert after_doc == before_doc, "a projected application field changed during a bureau explanation turn"
    assert _full_field(BUREAU_APP, "modified") == before_modified, "Frappe's own modified stamp moved: something wrote"
    assert _evidence_count(reader) == evidence_before, "an agent turn created Decision Evidence"
    assert FrappeEvidenceReader().get_record(before_doc["custom_latest_evidence"]) == record_before, \
        "the stored bureau record itself changed"


# ============================================================== Service B — live Redis
@redis_required
def test_b1_connectivity_and_the_expected_database():
    client = redis_lib.Redis.from_url(REDIS_URL, socket_connect_timeout=2.0, socket_timeout=2.0)
    assert client.ping()
    info = client.info("server")
    assert info.get("redis_version"), "no version came back"
    # the URL itself is never printed; the test only asserts connectivity
    assert not os.environ.get("P15_NEVER_PRINT"), "credential material leaked into the environment"


@redis_required
def test_b2_a_checkpoint_written_by_one_saver_is_restored_by_another():
    saver_a = _saver()
    saver_b = _saver()
    thread = f"{PREFIX}thread-{time.time_ns()}"
    config = {"configurable": {"thread_id": thread, "checkpoint_ns": "", "checkpoint_id": "c1"}}
    meta = {"step": 1, "source": "input"}
    checkpoint = {"id": "c1", "ts": "2026-11-03T00:00:00Z", "channel_values": {"intent": "explain"},
                  "versions_seen": {}, "parent_id": None}
    saved = saver_a.put(config, checkpoint, meta, {})
    restored = saver_b.get_tuple({"configurable": saved["configurable"]})
    assert restored is not None and restored.checkpoint["id"] == "c1"
    assert restored.checkpoint["channel_values"]["intent"] == "explain"
    assert restored.metadata["step"] == 1
    saver_a.put_writes(saved, [("answer", {"text": "x"})], "task-1")
    again = saver_b.get_tuple({"configurable": saved["configurable"]})
    assert again.pending_writes, "ordered writes did not come back"
    _purge([f"{saver_a._prefix}*"])


@redis_required
def test_b3_the_configured_ttl_is_applied_to_the_keys_this_run_wrote():
    ttl = int(os.environ.get("AGENT_CHECKPOINT_TTL_S") or 0)
    if not ttl:
        pytest.skip("run with AGENT_CHECKPOINT_TTL_S set to verify expiry against the live server")
    saver = _saver(ttl_s=ttl)
    thread = f"{PREFIX}ttl-{time.time_ns()}"
    config = {"configurable": {"thread_id": thread, "checkpoint_ns": "", "checkpoint_id": "c1"}}
    saved = saver.put(config, {"id": "c1", "ts": "x", "channel_values": {}, "versions_seen": {}, "parent_id": None},
                      {"step": 1, "source": "input"}, {})
    client = _client()
    assert saved["configurable"]["checkpoint_id"] == "c1"
    live = [k.decode() for k in client.scan_iter(match=f"{saver._prefix}*", count=500)]
    assert live, "the saver wrote no keys under its own prefix"
    with_ttl = [k for k in live if client.ttl(k) and client.ttl(k) > 0]
    assert len(with_ttl) == len(live), f"keys without a TTL: {[k for k in live if client.ttl(k) <= 0]}"
    _purge([f"{saver._prefix}*"])
    assert not list(client.scan_iter(match=f"{saver._prefix}*", count=500))


@redis_required
def test_b3_production_refuses_an_unbounded_checkpoint_store_against_the_live_server(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("AGENT_CHECKPOINT_BACKEND", "redis")
    monkeypatch.setenv("AGENT_CHECKPOINT_REDIS_URL", REDIS_URL)
    monkeypatch.delenv("AGENT_CHECKPOINT_TTL_S", raising=False)
    with pytest.raises(checkpoint_module.CheckpointUnavailable, match="AGENT_CHECKPOINT_TTL_S"):
        checkpoint_module.build_checkpointer()
    monkeypatch.setenv("AGENT_CHECKPOINT_TTL_S", "3600")
    saver = checkpoint_module.build_checkpointer()
    assert saver._ttl == 3600
    assert saver._client.ping() is True, "the refused/accepted decision must be made against the real server"


@redis_required
def test_b4_budget_counters_are_borrower_scoped_and_expire():
    from loan_advisory.api import limits

    store = limits.RedisBudgetStore(REDIS_URL, prefix=f"{PREFIX}budget:")
    limits.budget._store = store
    try:
        identity_a, identity_b = f"{PREFIX}sub-a", f"{PREFIX}sub-b"
        for _ in range(3):
            limits.enforce("agent-turn", identity_a, 2, 60)          # third call is over the limit
    except limits.BudgetExceeded as exc:
        assert exc.retry_after > 0
    else:
        pytest.fail("the live counter did not refuse the call over the limit")
    limits.enforce("agent-turn", identity_b, 2, 60)                  # another borrower still has room
    keys = list(store._client.scan_iter(match=f"{store._prefix}*", count=500))
    assert keys, "no counter key was written"
    for k in keys:
        assert store._client.ttl(k) > 0, f"{k.decode()} has no expiry"
    _purge([f"{store._prefix}*"])
    assert not list(store._client.scan_iter(match=f"{store._prefix}*", count=500))


@redis_required
def test_b4_assertion_replay_protection_uses_the_live_server():
    from loan_advisory.api import assertion

    store = assertion.RedisReplayStore(REDIS_URL, prefix=f"{PREFIX}replay:")
    jti = f"{PREFIX}jti-{time.time_ns()}"
    ttl = 60 + assertion.REPLAY_WINDOW_SECONDS
    assert store.claim(jti, ttl) is True, "the first use of a fresh jti must be accepted"
    assert store.claim(jti, ttl) is False, "the same jti was accepted twice: replay is not single-use"
    key = assertion.RedisReplayStore._key(store._prefix, jti)
    assert store._client.ttl(key) > 0, "a replay claim without an expiry would grow the shared keyspace forever"
    store.reset()
    assert not list(store._client.scan_iter(match=f"{store._prefix}*", count=500))
    # the guard facade turns a second claim into the same refusal a forged assertion gets
    guard = assertion.ReplayGuard(store)
    guard.claim(f"{PREFIX}jti-two", int(time.time()) + 60, int(time.time()))
    with pytest.raises(assertion.AssertionRejected):
        guard.claim(f"{PREFIX}jti-two", int(time.time()) + 60, int(time.time()))
    store.reset()


@redis_required
def test_b5_only_this_runs_keys_are_touched():
    client = redis_lib.Redis.from_url(REDIS_URL, socket_connect_timeout=2.0, socket_timeout=2.0)
    foreign_before = {k.decode() for k in client.scan_iter(match="*", count=2000)
                      if not k.decode().startswith(PREFIX)}
    saver = _saver()
    thread = f"{PREFIX}isolation-{time.time_ns()}"
    saved = saver.put({"configurable": {"thread_id": thread, "checkpoint_ns": "", "checkpoint_id": "c1"}},
                      {"id": "c1", "ts": "x", "channel_values": {}, "versions_seen": {}, "parent_id": None},
                      {"step": 1, "source": "input"}, {})
    saver.put_writes(saved, [("answer", {"text": "x"})], "task-1")
    written = {k.decode() for k in client.scan_iter(match="*", count=2000)}
    outside = {k for k in written - foreign_before if not k.startswith(PREFIX)}
    assert not outside, f"this run wrote keys outside its own prefix: {outside}"
    assert any(k.startswith(saver._prefix) for k in written), "nothing was written under the run prefix"
    # clean up only what this run created, by prefix; never FLUSHDB/FLUSHALL
    for pattern in (f"{saver._prefix}*", f"{PREFIX}budget:*", f"{PREFIX}replay:*"):
        keys = list(client.scan_iter(match=pattern, count=1000))
        if keys:
            client.delete(*keys)
    foreign_after = {k.decode() for k in client.scan_iter(match="*", count=2000) if not k.decode().startswith(PREFIX)}
    assert foreign_after == foreign_before, "this run changed keys that belong to something else"


# ============================================================== helpers
def _client():
    return redis_lib.Redis.from_url(REDIS_URL, socket_connect_timeout=2.0, socket_timeout=2.0)


def _saver(ttl_s=None, prefix=None):
    return checkpoint_module.RedisCheckpointSaver(
        _client(), prefix=prefix or f"{PREFIX}graph:",
        ttl_s=ttl_s if ttl_s is not None else int(os.environ.get("AGENT_CHECKPOINT_TTL_S") or 0))


def _purge(patterns):
    """Delete only what this run wrote, by its own prefixes. Never FLUSHDB or FLUSHALL."""
    client = _client()
    for pattern in patterns:
        keys = list(client.scan_iter(match=pattern, count=1000))
        if keys:
            client.delete(*keys)


class _SilentLLM:
    """A deterministic stand-in for the composer, so a live failure is never blamed on a provider."""

    def chat(self, system, user, max_tokens=900, temperature=0.0, tag="", **kw):
        return json.dumps({"abstain": False, "answer": "The recorded decision stands as stored.", "citations": []})

    def chat_json(self, system, user, max_tokens=900, tag="", **kw):
        if tag == "classify":
            return {"intent": "explain", "what_if_changes": {}}
        return {"abstain": False, "answer": "The recorded decision stands as stored.", "citations": []}


class _RecordingLLM(_SilentLLM):
    """The same deterministic composer, keeping the prompts it was handed, so a claim about what the
    explanation was built from is checked against the composer's actual input rather than its output."""

    def __init__(self):
        self.prompts = []

    def chat(self, system, user, **kw):
        self.prompts.append((kw.get("tag", "chat"), system))
        return super().chat(system, user, **kw)

    def chat_json(self, system, user, max_tokens=900, tag="", **kw):
        self.prompts.append((tag, system))
        return super().chat_json(system, user, max_tokens=max_tokens, tag=tag, **kw)


# ============================================================== Service D — live Langfuse
def _langfuse_env():
    if not all(os.environ.get(k) for k in ("LANGFUSE_PUBLIC_KEY", "LANGFUSE_SECRET_KEY")):
        pytest.skip("no Langfuse keys in the environment (see the plan: source infra/langfuse/.env)")
    return os.environ["LANGFUSE_BASE_URL"] or "http://127.0.0.1:3000"


@redis_required
def test_d1_d2_d3_a_real_turn_produces_a_readable_trace_with_its_observations():
    """One live agent turn, read back from Langfuse's own API by trace id."""
    import requests

    from loan_advisory.agent import langfuse_config, observability as obs
    base = _langfuse_env()
    key, secret = os.environ["LANGFUSE_PUBLIC_KEY"], os.environ["LANGFUSE_SECRET_KEY"]
    auth = (key, secret)
    assert requests.get(f"{base}/api/public/health", timeout=10).json()["status"] == "OK"
    projects = requests.get(f"{base}/api/public/projects", auth=auth, timeout=10).json().get("data", [])
    assert projects, "the project the agent writes to does not exist"
    assert not langfuse_config.load().capture_content, "content capture must be off for this proof"

    marker = f"phase15-d3-{time.time_ns()}"
    obs.reset()                                              # build the exporter from this test's environment
    agent, _view = runtime.build_live_agent(llm=_SilentLLM())
    victim = os.environ["P15_VICTIM_APP"]
    doc = agent.tools.store.get(victim)
    agent.audit_path = os.path.join(os.environ.get("TEMP", "/tmp"), "p15-d3-turns.jsonl")
    agent.handoff.path = os.path.join(os.environ.get("TEMP", "/tmp"), "p15-d3-handoffs.jsonl")
    with obs.span("phase15.live.turn", kind="CHAIN",
                  **{"langfuse.trace.name": "phase15.live.turn",
                     "langfuse.trace.tags": ["loan-advisory", "synthetic", "phase15"],
                     "langfuse.trace.metadata.case_id": marker}) as root:
        trace_id = format(root.get_span_context().trace_id, "032x") if root is not None else None
        agent.run(AgentRequest(request_id=marker, conversation_id=marker, message="why was I rejected?",
                               application_ref=victim), Session(applicant_ref=doc["applicant"]))
    assert trace_id and trace_id != "0" * 32
    obs.flush(5000)                                          # the batch exporter is asynchronous by design

    found = []
    for _ in range(15):                                      # ingestion lags; the worker batches too
        rows = requests.get(f"{base}/api/public/v2/observations", auth=auth,
                            params={"limit": 200}, timeout=15).json().get("data", [])
        found = [o for o in rows if o.get("name") == "phase15.live.turn"]
        if found:
            trace_id = found[0].get("trace_id") or trace_id
            siblings = requests.get(f"{base}/api/public/v2/observations", auth=auth,
                                    params={"limit": 200, "traceId": trace_id}, timeout=15).json().get("data", [])
            found = [o for o in siblings if o.get("trace_id") == trace_id] or found
            break
        time.sleep(2)
    assert found, f"no observation named phase15.live.turn arrived in {base} (trace {trace_id}, marker {marker})"
    observation_names = {o.get("name") for o in found}
    assert "phase15.live.turn" in observation_names, observation_names
    timings = [o.get("latency") for o in found if o.get("latency") is not None]
    assert timings, "no observation carried a latency"
    # D4: with content capture off, no borrower sentence may be present in anything that arrived
    blob = json.dumps(found).lower()
    assert "why was i rejected?" not in blob, "telemetry carried the borrower's message text"
    for o in found:
        for field in ("input", "output"):
            value = o.get(field)
            assert value in (None, "") or "rejected" not in str(value).lower(), f"{field} carried content"


@redis_required
def test_d5_langfuse_being_down_does_not_change_the_borrowers_answer(tmp_path):
    """A fresh process pointed at a dead telemetry endpoint, so the exporter really is unreachable.

    The exporter is initialised once per process, so mutating the environment mid-suite would prove
    nothing; this runs the same live agent in its own interpreter with the base URL refused.
    """
    _langfuse_env()
    audit = tmp_path / "child-turns.jsonl"
    child = subprocess.run(
        [sys.executable, "-c", """
import json, os, sys
sys.path.insert(0, "apps/api/src"); sys.path.insert(0, ".")
from loan_advisory.agent import runtime
from loan_advisory.agent.contracts import AgentRequest, Session
from tests.test_phase1_live_integration import _SilentLLM
os.environ["LANGFUSE_BASE_URL"] = "http://127.0.0.1:1"
agent, _v = runtime.build_live_agent(llm=_SilentLLM())
agent.audit_path = os.environ["P15_CHILD_AUDIT"]
agent.handoff.path = str(agent.audit_path).replace("turns", "handoffs")
doc = agent.tools.store.get(os.environ["P15_VICTIM_APP"])
r = agent.run(AgentRequest(request_id="p15-d5", conversation_id="p15-d5", message="why was I rejected?",
                           application_ref=doc["name"]), Session(applicant_ref=doc["applicant"]))
print(json.dumps({"answered": bool(r.answer), "error": r.error, "intent": r.intent}))
"""], capture_output=True, text=True, timeout=180,
        env={**os.environ, "PYTHONPATH": ".;apps/api/src", "P15_CHILD_AUDIT": str(audit)})
    assert child.returncode == 0, child.stderr[-400:]
    out = json.loads(child.stdout.strip().splitlines()[-1])
    assert out["answered"] is True and out["error"] is None, out
    assert audit.exists(), "the answer worked but its own audit row did not"
    row = json.loads(audit.read_text(encoding="utf-8").splitlines()[-1])
    assert "why was I rejected?" not in json.dumps(row), "a failed exporter fell back to writing content locally"


# ============================================================== §7 — cross-service journey
@frappe_required
def test_journey_the_full_borrower_path_over_live_services(tmp_path):
    """Portal-minted assertion -> agent HTTP -> live Frappe reads -> live Redis state -> no business writes."""
    import requests

    from loan_advisory.api.app import create_app
    from fastapi.testclient import TestClient

    base = os.environ["FRAPPE_URL"]
    fx = _fixture()
    session = requests.Session()
    login = session.post(f"{base}/api/method/login", data={"usr": fx["victim"]["user"],
                                                           "pwd": fx["victim"]["password"]}, timeout=25)
    if login.status_code != 200 or session.cookies.get("sid") in (None, "Guest"):
        pytest.skip("the synthetic borrower cannot sign in on this site — the journey needs a portal login")
    thread = f"p15-j-{time.time_ns()}"
    minted = session.post(f"{base}/api/method/loan_advisory_portal.api.agent.mint_assertion",
                          data={"application": os.environ["P15_VICTIM_APP"], "thread_id": thread}, timeout=25)
    assert minted.status_code == 200, f"portal mint failed: HTTP {minted.status_code} {minted.text[:120]}"
    mint = minted.json()["message"]
    token = mint["assertion"]
    assert mint["thread_id"] == thread, "the mint did not bind the thread the caller named"
    assert mint["application"] == os.environ["P15_VICTIM_APP"] and mint["customer"] == fx["victim"]["customer"]

    victim_before = _reader().get(os.environ["P15_VICTIM_APP"])
    evidence_before = _evidence_count(_reader())

    agent, _view = runtime.build_live_agent(llm=_SilentLLM())
    agent.audit_path = tmp_path / "turns.jsonl"
    agent.handoff.path = tmp_path / "handoffs.jsonl"
    client = TestClient(create_app(App(agent)))
    answer = client.post("/api/chat", json={"request_id": "p15-j", "conversation_id": thread,
                                            "message": "why was I rejected?"},
                         headers={"Authorization": f"Bearer {token}"})
    assert answer.status_code == 200, answer.text[:200]
    body = answer.json()
    assert body["answer"], "the journey produced no answer"
    assert not [f for f in ("applicant_name", "applicant_email_address", "zip_code") if f in body], "PII in the response"

    # service-side evidence, not just the HTTP response
    assert _reader().get(os.environ["P15_VICTIM_APP"]) == victim_before
    assert _evidence_count(_reader()) == evidence_before
    assert (tmp_path / "turns.jsonl").exists(), "the operational audit row was not written"
    client_keys = redis_lib.Redis.from_url(REDIS_URL, socket_connect_timeout=2.0, socket_timeout=2.0)
    assert list(client_keys.scan_iter(match=f"{PREFIX}*", count=500)), "no live Redis state was touched"
    _purge([f"{PREFIX}*"])

    replay_used = client.post("/api/chat", json={"request_id": "p15-j2", "conversation_id": thread,
                                                 "message": "again?"},
                              headers={"Authorization": f"Bearer {token}"})
    assert replay_used.status_code == 401, "a replayed assertion was accepted by the live store"
    assert (tmp_path / "turns.jsonl").read_text(encoding="utf-8").count("\n") == 1, "the refused call was still audited"


@frappe_required
def test_journey_a_borrower_cannot_mint_or_drive_onto_another_applicants_file(tmp_path):
    """Measured, not assumed: the portal refuses the cross-borrower mint, and the agent resolves only the caller.

    On the live dev site the other borrower asking for the victim's application gets HTTP 404 — the same
    answer as a reference that does not exist, so nothing is confirmed either way — while minting for
    their own application succeeds with their own customer claim.
    """
    import requests

    from fastapi.testclient import TestClient
    from loan_advisory.api.app import create_app

    base = os.environ["FRAPPE_URL"]
    fx = _fixture()
    victim, other = os.environ["P15_VICTIM_APP"], os.environ["P15_OTHER_APP"]

    session = requests.Session()
    if session.post(f"{base}/api/method/login", data={"usr": fx["other"]["user"], "pwd": fx["other"]["password"]},
                    timeout=25).status_code != 200:
        pytest.skip("the second synthetic borrower cannot sign in on this site")
    refused = session.post(f"{base}/api/method/loan_advisory_portal.api.agent.mint_assertion",
                           data={"application": victim, "thread_id": f"p15-x-{time.time_ns()}"}, timeout=25)
    assert refused.status_code == 404, f"cross-borrower mint returned {refused.status_code}, expected 404"
    assert "assertion" not in json.dumps(refused.json()).lower(), "a token was issued for a file the caller does not own"

    own_thread = f"p15-x-{time.time_ns()}"
    own = session.post(f"{base}/api/method/loan_advisory_portal.api.agent.mint_assertion",
                       data={"application": other, "thread_id": own_thread}, timeout=25)
    assert own.status_code == 200, own.text[:160]
    mint = own.json()["message"]
    assert mint["application"] == other and mint["customer"] == fx["other"]["customer"]

    agent, _view = runtime.build_live_agent(llm=_SilentLLM())
    agent.audit_path = tmp_path / "turns.jsonl"
    agent.handoff.path = tmp_path / "handoffs.jsonl"
    response = TestClient(create_app(App(agent))).post(
        "/api/chat", json={"request_id": "p15-x", "conversation_id": own_thread,
                           "message": "why was I rejected?", "application_ref": victim},
        headers={"Authorization": f"Bearer {mint['assertion']}"})
    assert response.status_code == 200, response.text[:200]
    # the body cannot retarget the asserted application, and the victim's reference never appears
    assert victim not in response.text, "the other borrower's turn echoed the victim's application reference"


def _fixture():
    tag = os.environ.get("P15_FIXTURE_TAG")
    if not tag:
        pytest.skip("set P15_FIXTURE_TAG to the e2e_seed tag holding the synthetic borrower credentials")
    path = os.environ.get("P15_FIXTURE_PATH", f"/tmp/loanportal-e2e/{tag}.json")
    container = os.environ.get("P15_FRAPPE_CONTAINER", "loanrangers-backend-1")
    raw = subprocess.run(["docker", "exec", container, "cat", path],
                         capture_output=True, text=True, check=True).stdout
    return json.loads(raw)
