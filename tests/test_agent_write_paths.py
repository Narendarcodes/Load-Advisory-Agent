"""Phase 1 security boundaries C and D: what the agent writes, and proof that it is only its own logs.

C says the ZEN evaluation and the what-if never persist. D is the inventory of every write that does
happen in this process — two operational JSONL logs — each with a bound and a failure mode that does
not fall on the borrower.
"""
import inspect
import json
from pathlib import Path

import pytest

from loan_advisory.agent import checkpoint, graph as graph_module, runtime, tools as tools_module
from loan_advisory.agent.contracts import AgentRequest, Session
from loan_advisory.agent.tools import HandoffQueue
from loan_advisory.application.lifecycle import simulate
from loan_advisory.infrastructure.frappe_adapter import MockStore
from loan_advisory.state_paths import DEFAULT_LOG_MAX_BYTES, append_line, log_max_bytes
from tests.test_agent_graph import FakePolicy, ScriptedLLM


def _ask(agent, message, app="APP-TEST-005", who="CUS-TEST-005"):
    return agent.run(AgentRequest(request_id="r1", conversation_id="c1", message=message,
                                  application_ref=app), Session(applicant_ref=who))


class _RecordingStore(MockStore):
    """MockStore, counting every write so a turn cannot write quietly."""

    def __init__(self):
        super().__init__()
        self.writes = []

    def create(self, fields):
        self.writes.append("create")
        return super().create(fields)

    def set_status(self, application_id, lifecycle_state, native_status):
        self.writes.append("set_status")
        return super().set_status(application_id, lifecycle_state, native_status)


# ------------------------------------------------------------------ C: nothing is persisted
def test_simulate_takes_no_sink_and_no_way_to_persist():
    """What-if cannot write: the function is not handed anything to write with."""
    params = inspect.signature(simulate).parameters
    assert set(params) == {"application_ref", "store", "overrides", "now", "base"}
    assert not any(name in params for name in ("sink", "client", "store_writer"))


def test_a_what_if_turn_writes_nothing_anywhere(tmp_path):
    store = _RecordingStore()
    agent, _store, sink = runtime.build_offline_agent(store=store, llm=ScriptedLLM(intent="what_if"),
                                                     policy_tools=FakePolicy())
    agent.audit_path = tmp_path / "turns.jsonl"
    agent.handoff.path = tmp_path / "handoffs.jsonl"
    before = dict(store.get("APP-TEST-005"))
    evidence_before = len(sink.records)
    store.writes.clear()                      # the offline fixtures are decided before the agent exists

    response = _ask(agent, "what if my income were 200000 more?")

    assert store.writes == []
    assert response.answer
    assert len(sink.records) == evidence_before
    assert store.get("APP-TEST-005") == before
    assert not (tmp_path / "handoffs.jsonl").exists()


def test_no_agent_turn_writes_whatever_the_intent_is(tmp_path):
    """Explain, improve, what-if, policy and a refusal: the store never sees a write call."""
    for intent in ("explain", "improve", "what_if", "policy", "other"):
        store = _RecordingStore()
        agent, _s, sink = runtime.build_offline_agent(store=store, llm=ScriptedLLM(intent=intent),
                                                     policy_tools=FakePolicy())
        agent.audit_path = tmp_path / f"turns-{intent}.jsonl"
        agent.handoff.path = tmp_path / f"handoffs-{intent}.jsonl"
        store.writes.clear()
        evidence_before = len(sink.records)
        _ask(agent, "tell me about my application")
        assert store.writes == [], intent
        assert len(sink.records) == evidence_before, intent


def test_the_agent_code_never_calls_a_decision_writer():
    """Not merely unused: the conventional writers are not even imported by the graph or the tools."""
    for module in (graph_module, tools_module):
        text = Path(module.__file__).read_text(encoding="utf-8")
        for writer in ("process_application", "process_bureau_application", "run_bureau_evaluation",
                       "FrappeEvidenceSink", "set_status"):
            assert writer not in text, f"{module.__name__} mentions {writer}"


def test_what_if_reports_that_it_changed_nothing():
    store = MockStore()
    agent, _s, _sink = runtime.build_offline_agent(store=store, llm=ScriptedLLM(intent="what_if"),
                                                  policy_tools=FakePolicy())
    result = agent.tools.run_what_if("APP-TEST-005", Session(applicant_ref="CUS-TEST-005"), {"credit_score": 850})
    assert result["is_simulation"] is True
    assert result["original_record_unchanged"] is True
    assert "not a decision" in result["label"]


# ------------------------------------------------------------------ D: the two logs, bounded
def test_a_failed_handoff_write_does_not_break_the_turn(tmp_path, monkeypatch):
    """A full disk is an operations problem; the borrower still gets an answer and no invented reference."""
    agent, _s, _sink = runtime.build_offline_agent(llm=ScriptedLLM(intent="improve"), policy_tools=FakePolicy())
    agent.audit_path = tmp_path / "turns.jsonl"
    agent.handoff.path = tmp_path / "handoffs.jsonl"

    def refuse(path, line, max_bytes=None):
        raise OSError(28, "No space left on device")

    monkeypatch.setattr(tools_module, "append_line", refuse)
    response = _ask(agent, "Please delete the recorded call")
    assert response.action == "handoff"
    assert response.handoff_ref is None                 # never a reference to a row that was not stored
    assert "HO-" not in response.answer                 # and no invented one in the text either
    assert response.answer
    assert not (tmp_path / "handoffs.jsonl").exists()   # nothing was claimed to exist


def test_a_failed_audit_write_still_answers(tmp_path, monkeypatch):
    agent, _s, _sink = runtime.build_offline_agent(llm=ScriptedLLM(intent="explain"), policy_tools=FakePolicy())
    agent.audit_path = tmp_path / "turns.jsonl"
    monkeypatch.setattr(graph_module, "append_line", lambda path, line, max_bytes=None: (_ for _ in ()).throw(OSError(13, "denied")))
    assert _ask(agent, "why?").answer


def test_the_handoff_log_rotates_instead_of_growing_without_bound(tmp_path, monkeypatch):
    monkeypatch.setenv("AGENT_LOG_MAX_BYTES", "300")
    queue = HandoffQueue(str(tmp_path / "handoffs.jsonl"))
    for i in range(6):
        assert queue.create("data_dispute", [f"APP-{i}"], f"message {i}", f"req-{i}")
    rotated = [p for p in tmp_path.iterdir() if p.name.startswith("handoffs-")]
    assert rotated, "the active log never moved aside"
    kept = [json.loads(line) for line in (tmp_path / "handoffs.jsonl").read_text(encoding="utf-8").splitlines()]
    archived = [json.loads(line) for p in rotated for line in p.read_text(encoding="utf-8").splitlines()]
    assert len(kept) + len(archived) == 6               # rotation renames, it does not delete
    assert len(set(r["handoff_ref"] for r in kept + archived)) == 6
    assert all(set(r) == {"handoff_ref", "category", "refs", "request_id", "message_sha256",
                          "message_chars", "created_at"} for r in kept + archived)


def test_rotation_is_configurable_and_can_be_switched_off(tmp_path, monkeypatch):
    monkeypatch.setenv("AGENT_LOG_MAX_BYTES", "0")
    assert log_max_bytes() == 0
    target = tmp_path / "turns.jsonl"
    for _ in range(20):
        append_line(target, json.dumps({"row": "x" * 40}) + "\n")
    assert not [p for p in tmp_path.iterdir() if p.name != "turns.jsonl"]
    monkeypatch.delenv("AGENT_LOG_MAX_BYTES")
    assert log_max_bytes() == DEFAULT_LOG_MAX_BYTES


# ------------------------------------------------------------------ D: checkpoint retention
def test_production_refuses_a_checkpoint_store_that_never_expires(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("AGENT_CHECKPOINT_BACKEND", "redis")
    monkeypatch.setenv("AGENT_CHECKPOINT_REDIS_URL", "redis://127.0.0.1:1")
    monkeypatch.delenv("AGENT_CHECKPOINT_TTL_S", raising=False)
    with pytest.raises(checkpoint.CheckpointUnavailable, match="AGENT_CHECKPOINT_TTL_S"):
        checkpoint.build_checkpointer()


class _FakeRedis:
    """Only enough of `redis.Redis` to reach the retention decision, never a socket."""

    @classmethod
    def from_url(cls, url, **kwargs):
        return cls()

    def ping(self):
        return True


def test_production_keeps_a_ttl_it_was_given(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("AGENT_CHECKPOINT_BACKEND", "redis")
    monkeypatch.setenv("AGENT_CHECKPOINT_REDIS_URL", "redis://127.0.0.1:1")
    monkeypatch.setenv("AGENT_CHECKPOINT_TTL_S", "86400")
    monkeypatch.setattr(checkpoint.redis, "Redis", _FakeRedis)
    assert checkpoint.build_checkpointer()._ttl == 86400


def test_development_still_allows_an_unbounded_ttl(monkeypatch):
    """The refusal is a production rule; a local run does not need to choose a retention period."""
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("AGENT_CHECKPOINT_BACKEND", "redis")
    monkeypatch.setenv("AGENT_CHECKPOINT_REDIS_URL", "redis://127.0.0.1:1")
    monkeypatch.delenv("AGENT_CHECKPOINT_TTL_S", raising=False)
    monkeypatch.setattr(checkpoint.redis, "Redis", _FakeRedis)
    assert checkpoint.build_checkpointer()._ttl == 0
