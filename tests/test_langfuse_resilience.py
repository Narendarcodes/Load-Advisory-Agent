"""Langfuse is optional: bad config, a missing SDK, a dead collector or failed exports never change behaviour.

These tests use the real observability facade and the offline graph. None of them needs Docker or a live Langfuse,
except the explicit end-to-end unreachable-endpoint case, which talks to a closed localhost port on purpose.
"""
import pytest

from loan_advisory.agent import observability as obs
from tests.test_agent_graph import ScriptedLLM, agent_for, ask

ENV_KEYS = ("AGENT_TRACING", "LANGFUSE_ENABLED", "LANGFUSE_PUBLIC_KEY", "LANGFUSE_SECRET_KEY", "LANGFUSE_BASE_URL",
            "LANGFUSE_HOST", "LANGFUSE_ALLOW_REMOTE", "LANGFUSE_TRACING_ENABLED", "LANGFUSE_CAPTURE_CONTENT",
            "LANGFUSE_SAMPLE_RATE", "LANGFUSE_TIMEOUT")


def _clear(monkeypatch):
    for key in ENV_KEYS:
        monkeypatch.delenv(key, raising=False)


def _active(monkeypatch, base="http://127.0.0.1:3000"):
    monkeypatch.setenv("AGENT_TRACING", "0")
    monkeypatch.setenv("LANGFUSE_ENABLED", "1")
    monkeypatch.setenv("LANGFUSE_PUBLIC_KEY", "pk-lf-synthetic")
    monkeypatch.setenv("LANGFUSE_SECRET_KEY", "sk-lf-synthetic")
    monkeypatch.setenv("LANGFUSE_BASE_URL", base)
    monkeypatch.setenv("LANGFUSE_TIMEOUT", "1")


def _what_if(monkeypatch, tmp_path):
    ag, store, _ = agent_for(ScriptedLLM(intent="what_if", changes={"credit_score": {"set": 720}}), tmp_path=tmp_path)
    resp = ask(ag, "what if my score was 720")
    return resp, store


def test_sdk_init_failure_disables_tracing_and_the_turn_still_runs(monkeypatch, tmp_path):
    _clear(monkeypatch)
    _active(monkeypatch)
    obs.reset()
    monkeypatch.setattr("langfuse.Langfuse", lambda **kw: (_ for _ in ()).throw(RuntimeError("sdk init failed")))

    assert obs.tracer() is None
    resp, store = _what_if(monkeypatch, tmp_path)
    assert resp.what_if["simulated_decision"] == "REJECTED"
    assert resp.what_if["original_record_unchanged"] is True
    assert store.get("APP-TEST-005")["custom_monthly_obligations"] == 18500
    obs.flush(50)
    obs.reset()


def test_malformed_endpoint_is_rejected_without_raising(monkeypatch):
    _clear(monkeypatch)
    _active(monkeypatch, base="not-a-url")
    obs.reset()

    cfg = obs.lf_config()
    assert cfg.active is False and cfg.problems and "invalid_base_url" in cfg.problems
    assert obs.enabled() is False and obs.tracer() is None
    with obs.span("s") as sp:
        assert sp is None
    obs.flush(50)
    obs.reset()


def test_config_loader_crash_is_contained(monkeypatch):
    _clear(monkeypatch)
    obs.reset()
    monkeypatch.setattr(obs.langfuse_config, "load",
                        lambda: (_ for _ in ()).throw(RuntimeError("bad env")))
    cfg = obs.lf_config()
    assert cfg.active is False and cfg.problems == ("config_error",)
    with obs.span("s") as sp:
        assert sp is None
    obs.reset()


def test_tracer_provider_construction_failure_is_contained(monkeypatch):
    _clear(monkeypatch)
    _active(monkeypatch)
    obs.reset()
    import opentelemetry.sdk.trace as sdk
    monkeypatch.setattr(sdk, "TracerProvider", lambda *a, **k: (_ for _ in ()).throw(RuntimeError("no sdk")))
    assert obs.tracer() is None
    with obs.span("s") as sp:
        assert sp is None
    obs.reset()


def test_flush_swallows_a_dead_collector(monkeypatch):
    _clear(monkeypatch)
    obs.reset()
    monkeypatch.setattr(obs, "_TRACER", object())
    import opentelemetry.trace as T

    class _Broken:
        def force_flush(self, timeout_millis=None):
            raise RuntimeError("collector down")

    monkeypatch.setattr(T, "get_tracer_provider", lambda: _Broken())
    obs.flush(50)  # must not raise
    obs.reset()


def test_unreachable_endpoint_does_not_break_a_turn(monkeypatch, tmp_path):
    pytest.importorskip("langfuse")
    _clear(monkeypatch)
    _active(monkeypatch, base="http://127.0.0.1:9")  # closed port
    obs.reset()
    try:
        resp, _ = _what_if(monkeypatch, tmp_path)
        assert resp.what_if["simulated_decision"] == "REJECTED"
        obs.flush(1000)  # bounded; the exporter cannot connect and logs, it does not raise
    finally:
        client = obs._LANGFUSE
        obs.reset()
        if client is not None:
            client.shutdown()


def test_tracing_on_and_off_produce_the_same_decision(monkeypatch, tmp_path):
    _clear(monkeypatch)
    obs.reset()
    baseline, _ = _what_if(monkeypatch, tmp_path)

    _active(monkeypatch)
    obs.reset()
    monkeypatch.setattr("langfuse.Langfuse", lambda **kw: (_ for _ in ()).throw(RuntimeError("sdk init failed")))
    traced, _ = _what_if(monkeypatch, tmp_path)
    obs.reset()

    assert traced.what_if["simulated_decision"] == baseline.what_if["simulated_decision"]
    assert traced.what_if["changes"] == baseline.what_if["changes"]
    assert traced.what_if["rule_results"] == baseline.what_if["rule_results"]
    assert traced.what_if["original_record_unchanged"] is True


def test_bureau_outcome_is_unchanged_when_telemetry_fails(monkeypatch):
    from fastapi.testclient import TestClient
    from loan_advisory.application.bureau_intake import run_bureau_evaluation
    from loan_advisory.infrastructure.bureau_client import BureauClient
    from loan_advisory.infrastructure.evidence_store import InMemoryEvidenceSink
    from synthetic_bureau.app import create_app
    from tests.test_bureau_entry import FIXTURE, _Store

    _clear(monkeypatch)
    obs.reset()
    case = next(c for c in FIXTURE["cases"] if c["scenario"] == "VALID_PASS")
    ref = case["application"]["application_id"]

    def evaluate():
        http = TestClient(create_app())
        try:
            return run_bureau_evaluation(ref, store=_Store([case]), sink=InMemoryEvidenceSink(),
                                         bureau_client=BureauClient(client=http))
        finally:
            http.close()

    baseline = evaluate()

    _active(monkeypatch)
    obs.reset()
    monkeypatch.setattr("langfuse.Langfuse", lambda **kw: (_ for _ in ()).throw(RuntimeError("sdk init failed")))
    observed = evaluate()
    obs.reset()

    assert (observed.outcome, observed.decision, observed.lifecycle_state, observed.score_source) == \
           (baseline.outcome, baseline.decision, baseline.lifecycle_state, baseline.score_source)
    assert (observed.provider_error, observed.retryable) == (baseline.provider_error, baseline.retryable)
