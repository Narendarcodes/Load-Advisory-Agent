"""Phase 1 security boundary B: the agent can read the system of record and nothing else.

Three things are proved here, each in the way that actually hurts to break:

1. **Construction refuses.** `DecisionTools` rejects a write-capable store or evidence object, so a
   regression that wires `MockStore`, `FrappeClient` or `FrappeEvidenceSink` back in fails at startup
   rather than on the first write.
2. **The shipped wiring holds no writer.** The offline and live graphs are built from read-only views,
   and nothing reachable from `agent.tools` exposes `create`, `set_status`, `persist` or `call_method`.
3. **The read is projected.** A Loan Application arrives as the fields the decision path uses, never as
   the whole document.
"""
import json
import re
from pathlib import Path

import pytest

from loan_advisory.agent import runtime
from loan_advisory.agent.contracts import Session
from loan_advisory.agent.tools import DecisionTools, FrappeEvidenceSource, InMemoryEvidenceSource
from loan_advisory.application.ports import ReadOnlyBoundaryViolation, assert_reader
from loan_advisory.infrastructure import evidence_store, frappe_adapter
from loan_advisory.infrastructure.evidence_store import (FrappeEvidenceReader, FrappeEvidenceSink,
                                                         InMemoryEvidenceSink)
from loan_advisory.infrastructure.frappe_adapter import (MockStore, ReadOnlyDocumentStore, ReadOnlyFrappeApplication,
                                                         READ_FIELDS, FrappeClient, read_only_view)
from tests.test_agent_graph import FakePolicy, ScriptedLLM

OWNED = {"name": "APP-TEST-005", "applicant": "CUS-TEST-005"}


# ------------------------------------------------------------------ 1. construction refuses
def test_decision_tools_refuses_a_write_capable_store():
    sink = InMemoryEvidenceSink()
    with pytest.raises(ReadOnlyBoundaryViolation, match="application store"):
        DecisionTools(MockStore(), InMemoryEvidenceSource(sink))


def test_decision_tools_refuses_a_write_capable_evidence_source():
    """The old shape — an evidence source holding the ingest sink — is refused, not merely discouraged."""
    store = MockStore().reader()
    with pytest.raises(ReadOnlyBoundaryViolation, match="evidence source"):
        DecisionTools(store, FrappeEvidenceSource(FrappeEvidenceSink(client=object())))


def test_assert_reader_sees_through_a_reader_that_holds_a_client():
    """A class named like a reader but keeping the client inside it is still a writer."""
    class FakeReader:
        def __init__(self, client):
            self.client = client

        def get(self, ref):
            return {}

    with pytest.raises(ReadOnlyBoundaryViolation):
        assert_reader(FakeReader(FrappeClient("https://x.invalid", "k", "s")), role="a wrapper")


def test_the_read_only_views_pass_the_same_guard():
    assert_reader(MockStore().reader(), role="mock reader")
    assert_reader(ReadOnlyFrappeApplication("https://x.invalid", "k", "s"), role="live reader")
    assert_reader(ReadOnlyDocumentStore({"A": OWNED}), role="document view")


# ------------------------------------------------------------------ 2. the shipped wiring
def test_the_offline_agent_holds_no_write_capable_object():
    agent, store, _ = runtime.build_offline_agent(llm=ScriptedLLM(intent="explain"), policy_tools=FakePolicy())
    assert not hasattr(agent.tools.store, "create")
    assert not hasattr(agent.tools.evidence, "persist")
    # the raw store still writes, for the conventional workflow that decided the fixtures
    assert hasattr(store, "create") and hasattr(store, "set_status")


def test_the_live_agent_is_wired_without_an_evidence_sink(monkeypatch):
    monkeypatch.setenv("FRAPPE_URL", "https://p1loan.invalid")
    monkeypatch.setenv("FRAPPE_API_KEY", "k")
    monkeypatch.setenv("FRAPPE_API_SECRET", "s")
    monkeypatch.setenv("EVIDENCE_FRAPPE_URL", "https://p1loan.invalid")
    monkeypatch.setenv("EVIDENCE_FRAPPE_API_KEY", "ek")
    monkeypatch.setenv("EVIDENCE_FRAPPE_API_SECRET", "es")
    monkeypatch.setattr(frappe_adapter.requests, "get",
                        lambda url, headers=None, timeout=None, params=None, **kw:
                        _Response({"data": dict(OWNED, custom_latest_evidence="EV-1")}))
    monkeypatch.setattr(evidence_store.requests, "post",
                        lambda url, headers=None, json=None, timeout=None, **kw:
                        _Response({"message": None}))
    agent, _reader = runtime.build_live_agent(llm=object())
    assert_reader(agent.tools.store, role="live store")
    assert_reader(agent.tools.evidence, role="live evidence")
    assert not hasattr(agent.tools.store, "create")
    assert not hasattr(agent.tools.evidence, "persist")
    assert not hasattr(agent.tools.evidence.reader, "persist")


def test_no_live_writer_is_constructed_or_imported_in_the_agent_wiring():
    """runtime.py builds readers only. Prose may name the sink; code may not import or call it."""
    text = Path(runtime.__file__).read_text(encoding="utf-8")
    for writer in ("FrappeEvidenceSink", "FrappeClient", "BureauClient", "run_bureau_evaluation"):
        assert f"{writer}(" not in text, writer
        assert not re.search(rf"^\s*(from\s+\S+\s+)?import\s+.*\b{writer}\b", text, re.M), writer
    assert not re.search(r"^\s*from\s+\S*bureau\S*\s+import", text, re.M)


# ------------------------------------------------------------------ 3. the read is projected
class _Response:
    def __init__(self, payload, status_code=200):
        self._payload, self.status_code = payload, status_code
        self.ok = status_code < 400
        self.text = ""

    def json(self):
        return self._payload


def _recorded_get(monkeypatch):
    calls = []

    def fake_get(url, headers=None, timeout=None, params=None, **kwargs):
        calls.append({"url": url, "params": params})
        return _Response({"data": {k: None for k in json.loads(params["fields"])}} if params else {"data": dict(OWNED)})

    monkeypatch.setattr(frappe_adapter.requests, "get", fake_get)
    return calls


@pytest.mark.parametrize("reader_factory", [
    lambda: FrappeClient("https://p1loan.invalid", "k", "s"),
    lambda: ReadOnlyFrappeApplication("https://p1loan.invalid", "k", "s"),
])
def test_an_application_read_is_projected_to_the_decision_fields(monkeypatch, reader_factory):
    calls = _recorded_get(monkeypatch)
    reader_factory().get("APP-TEST-005")
    requested = json.loads(calls[0]["params"]["fields"])
    assert requested == list(READ_FIELDS)
    assert "applicant_name" not in requested and "mobile_number" not in requested
    assert "custom_monthly_income" in requested  # scored, so it must stay readable


def test_the_projection_covers_every_field_the_agent_reads():
    """The field list is not a guess: each consumer's inputs are named here."""
    from loan_advisory.agent.facts import SCORED
    from loan_advisory.infrastructure.frappe_adapter import from_frappe_doc

    needed = {"name", "applicant", "loan_product", "status", "custom_lifecycle_state",
              "custom_latest_evidence", "repayment_periods", "loan_amount"}
    needed |= {f"custom_{k}" for k in SCORED}
    assert needed <= set(READ_FIELDS), sorted(needed - set(READ_FIELDS))
    doc = {"name": "APP-1", "applicant": "CUS-1", "custom_monthly_income": 90000,
           "custom_monthly_obligations": 12000, "custom_credit_score": 780, "custom_employment_months": 48,
           "loan_amount": 300000, "repayment_periods": 36}
    assert from_frappe_doc(doc).application_id == "APP-1"


def test_every_projected_field_is_a_field_frappe_actually_has():
    """A `fields` list naming a missing DocType field is an error, not a null, so this is load-bearing.

    The custom half is checked against the portal's own installer; the standard half against the fields
    `FrappeClient.create` already posts. Anything else in READ_FIELDS is a bug waiting for a live site.
    """
    install = (Path(__file__).resolve().parents[1] / "apps/loan_advisory_portal/loan_advisory_portal/install.py")
    created = set(re.findall(r'"fieldname":\s*"([^"]+)"', install.read_text(encoding="utf-8")))
    custom = {f for f in READ_FIELDS if f.startswith("custom_")}
    assert custom <= created, sorted(custom - created)
    assert set(READ_FIELDS) - custom == frappe_adapter.STANDARD_LOAN_FIELDS


# ------------------------------------------------------------------ authorization survives the view
def test_ownership_is_still_checked_through_the_read_only_view():
    store = MockStore()
    doc = store.get("APP-TEST-005")
    tools = DecisionTools(read_only_view(store), InMemoryEvidenceSource(InMemoryEvidenceSink()))
    tools.owned_doc("APP-TEST-005", Session(applicant_ref=doc["applicant"]))          # owner: allowed
    with pytest.raises(Exception):
        tools.owned_doc("APP-TEST-005", Session(applicant_ref="CUS-SOMEONE-ELSE"))    # not the owner


def test_what_if_still_cannot_reach_a_writer(monkeypatch, tmp_path):
    """The one in-memory ZEN path keeps its guarantee after the store became a view."""
    agent, store, sink = runtime.build_offline_agent(llm=ScriptedLLM(intent="what_if"), policy_tools=FakePolicy())
    before = store.get("APP-TEST-005")
    changes = {"credit_score": 850}
    result = agent.tools.run_what_if("APP-TEST-005", Session(applicant_ref="CUS-TEST-005"), changes)
    assert result["original_record_unchanged"] is True
    assert result["is_simulation"] is True
    assert store.get("APP-TEST-005") == before
    assert agent.tools.evidence.records is sink.records        # the source reads the live view, not a copy
    assert not [r for r in sink.records.values() if r["is_simulation"]]   # and nothing was persisted


def test_the_service_object_holds_only_the_agent():
    from loan_advisory.agent.server import App
    agent, store, _ = runtime.build_offline_agent(llm=ScriptedLLM(intent="explain"), policy_tools=FakePolicy())
    service = App(agent)
    assert vars(service) == {"agent": agent}


# ------------------------------------------------------------------ the evidence read itself
def test_the_evidence_reader_calls_only_its_one_allowlisted_method(monkeypatch):
    calls = []

    def fake_post(url, headers=None, json=None, timeout=None, **kwargs):
        calls.append((url, json))
        return _Response({"message": {"record_id": "EV-1"}})

    monkeypatch.setattr(evidence_store.requests, "post", fake_post)
    reader = FrappeEvidenceReader("https://p1loan.invalid", "k", "s")
    assert reader.get_record("EV-1") == {"record_id": "EV-1"}
    assert calls == [("https://p1loan.invalid/api/method/loan_advisory_portal.api.evidence.get_record",
                      {"record_id": "EV-1"})]
    for writer in ("persist", "call_method", "create", "set_status"):
        assert not hasattr(reader, writer), writer


def test_the_evidence_source_reads_through_that_reader(monkeypatch):
    monkeypatch.setattr(evidence_store.requests, "post",
                        lambda url, headers=None, json=None, timeout=None, **kw: _Response({"message": {"record_id": "EV-9"}}))
    source = FrappeEvidenceSource(FrappeEvidenceReader("https://p1loan.invalid", "k", "s"))
    assert source.latest("APP-1", {"custom_latest_evidence": "EV-9"})["record_id"] == "EV-9"
    assert source.latest("APP-1", {}) is None            # no pointer: nothing is fetched
    assert_reader(source, role="evidence source")
