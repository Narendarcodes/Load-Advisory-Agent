"""Langfuse instrumentation: observation types, metadata, and the hard privacy boundary.

Spans are captured with an in-memory OTel exporter, which sees exactly what the shared TracerProvider would hand
to the Langfuse processor. The export-stage mask is exercised directly (it runs inside the Langfuse processor).
"""
import json
from types import SimpleNamespace

import pytest

from loan_advisory.agent import llm as L
from loan_advisory.agent import observability as obs
from loan_advisory.agent.langfuse_config import LangfuseConfig
from loan_advisory.agent.tools import PolicyTools
from rag.retrieve import RetrievalFilter
from tests.test_agent_graph import ScriptedLLM, agent_for, ask

SENSITIVE = ("Ravi Kumar", "9876543210", "ravi.kumar@example.com", "ABCDE1234F", "12 MG Road")
SENSITIVE_MESSAGE = ("Why was my loan rejected? My name is Ravi Kumar, phone 9876543210, "
                     "email ravi.kumar@example.com, PAN ABCDE1234F, address 12 MG Road, Bengaluru.")


@pytest.fixture
def traced(monkeypatch):
    pytest.importorskip("opentelemetry.sdk.trace")
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import SimpleSpanProcessor
    from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter

    exporter = InMemorySpanExporter()
    provider = TracerProvider()
    provider.add_span_processor(SimpleSpanProcessor(exporter))
    obs.reset()
    monkeypatch.setattr(obs, "_TRACER", provider.get_tracer("loan_advisory.agent"))
    monkeypatch.setattr(obs, "_LF_CONFIG", LangfuseConfig(enabled=True, public_key="pk-lf-test",
                                                          secret_key="sk-lf-test"))
    monkeypatch.delenv("AGENT_TRACE_CONTENT", raising=False)
    yield SimpleNamespace(exported=exporter.get_finished_spans, exporter=exporter)
    obs.reset()


@pytest.mark.parametrize("kind,expected", [("CHAIN", "chain"), ("LLM", "generation"), ("TOOL", "tool"),
                                           ("RETRIEVER", "retriever"), ("AGENT", "agent"), ("GUARDRAIL", "guardrail"),
                                           ("UNKNOWN", "span")])
def test_observation_types_and_environment(traced, kind, expected):
    with obs.span("s", kind=kind):
        pass
    sp = traced.exported()[-1]
    assert sp.attributes["langfuse.observation.type"] == expected
    assert sp.attributes["langfuse.environment"] == "local"
    assert sp.attributes["openinference.span.kind"] == kind


def test_release_is_exported_when_configured(traced, monkeypatch):
    monkeypatch.setattr(obs, "_LF_CONFIG", LangfuseConfig(enabled=True, public_key="pk", secret_key="sk", release="abc123"))
    with obs.span("s", kind="CHAIN"):
        pass
    assert traced.exported()[-1].attributes["langfuse.release"] == "abc123"


def test_metadata_is_json_encoded_and_none_is_skipped():
    meta = obs.lf_meta(intent="policy", count=3, ok=True, missing=None, citations=["A", "B"])
    assert set(meta) == {"langfuse.observation.metadata.intent", "langfuse.observation.metadata.count",
                         "langfuse.observation.metadata.ok", "langfuse.observation.metadata.citations"}
    assert json.loads(meta["langfuse.observation.metadata.citations"]) == ["A", "B"]
    assert json.loads(meta["langfuse.observation.metadata.ok"]) is True
    trace_meta = obs.lf_trace_meta(correlation_id="abc")
    assert trace_meta == {"langfuse.trace.metadata.correlation_id": '"abc"'}


def test_content_capture_is_off_by_default(traced):
    assert obs.capture_content() is False
    assert obs.lf_content("secret message") is None
    with obs.span("s", kind="CHAIN", **{"langfuse.observation.input": obs.lf_content("secret message")}):
        pass
    assert "langfuse.observation.input" not in traced.exported()[-1].attributes


def test_content_capture_is_explicit_opt_in_and_truncated(traced, monkeypatch):
    monkeypatch.setattr(obs, "_LF_CONFIG", LangfuseConfig(enabled=True, public_key="pk", secret_key="sk",
                                                          capture_content=True))
    assert obs.capture_content() is True
    assert obs.lf_content("x" * 5000) == "x" * 4000
    with obs.span("s", kind="CHAIN", **{"langfuse.observation.input": obs.lf_content("hello")}):
        pass
    assert traced.exported()[-1].attributes["langfuse.observation.input"] == "hello"


def test_export_mask_removes_free_text_but_keeps_structured_attributes():
    span = SimpleNamespace(attributes={"input.value": "applicant text", "output.value": "answer text",
                                       "llm.system": "prompt", "llm.error": "HTTP 500: body",
                                       "langfuse.observation.model.name": "llm"})
    result = obs._langfuse_mask_spans(params=SimpleNamespace(spans={"s1": span}))
    patch = result.span_patches["s1"]
    assert set(patch.delete_attributes) == set(obs._LF_DROP_ATTRS)
    assert patch.set_attributes == {}
    assert obs._langfuse_mask_spans(params=SimpleNamespace(spans={"s1": SimpleNamespace(attributes={"ok": 1})})) is None


def test_span_filter_accepts_only_the_project_scope():
    assert obs._langfuse_span_filter(SimpleNamespace(instrumentation_scope=SimpleNamespace(name="loan_advisory.agent")))
    assert not obs._langfuse_span_filter(SimpleNamespace(instrumentation_scope=SimpleNamespace(name="httpx")))
    assert not obs._langfuse_span_filter(SimpleNamespace(instrumentation_scope=None))


def test_exception_exports_only_the_class_never_the_message(traced):
    with pytest.raises(RuntimeError, match="boom"):
        with obs.span("s", kind="TOOL"):
            raise RuntimeError("boom ABCDE1234F ravi.kumar@example.com")
    sp = traced.exported()[-1]
    assert sp.attributes["error.type"] == "RuntimeError"
    assert sp.status.status_code.name == "ERROR" and sp.status.description == "RuntimeError"
    assert list(sp.events) == []  # no exception event / stacktrace
    blob = json.dumps({k: str(v) for k, v in sp.attributes.items()})
    assert "boom" not in blob and "ABCDE1234F" not in blob


def test_turn_span_is_private_and_carries_useful_metadata(traced, tmp_path):
    ag, _, _ = agent_for(ScriptedLLM(intent="explain"), tmp_path=tmp_path)
    resp = ask(ag, SENSITIVE_MESSAGE)
    assert resp.answer  # the request still completed normally

    spans = traced.exported()
    root = next(s for s in spans if s.name == "advisor.turn")
    assert root.attributes["langfuse.trace.name"] == "advisory.turn"
    assert "loan-advisory" in root.attributes["langfuse.trace.tags"]
    assert "explain" in root.attributes["langfuse.trace.tags"]
    corr = json.loads(root.attributes["langfuse.trace.metadata.correlation_id"])
    assert len(corr) == 16 and corr != "r1"  # correlation id is hashed, not the raw request id
    assert json.loads(root.attributes["langfuse.observation.metadata.citation_document_ids"]) == []
    assert json.loads(root.attributes["langfuse.observation.metadata.outcome"]) == "answered"
    classify = next(s for s in spans if s.name == "node.classify")
    assert classify.attributes["langfuse.observation.type"] == "chain"
    assert json.loads(classify.attributes["langfuse.observation.metadata.intent"]) == "explain"
    assert next(s for s in spans if s.name == "tool.get_decision_evidence").attributes["langfuse.observation.type"] == "tool"

    blob = json.dumps([{k: str(v) for k, v in s.attributes.items()} for s in spans])
    for needle in SENSITIVE:
        assert needle not in blob
    for sp in spans:
        assert "input.value" not in sp.attributes and "output.value" not in sp.attributes
        assert "langfuse.observation.input" not in sp.attributes


class _FakeRetriever:
    def search(self, query, flt, k=5):
        return {"results": [("chunk-1", 0.93), ("chunk-2", 0.81)], "latency_ms": 7.5, "top_rerank_score": 0.93}


def _chunks():
    return {"chunk-1": {"chunk_id": "chunk-1", "document_id": "BFL-GRIEVANCE", "text": "Complaints go to the GRO.",
                        "title": "Grievance redressal", "approval_status": "approved"},
            "chunk-2": {"chunk_id": "chunk-2", "document_id": "BFL-COOLING", "text": "Cooling-off is 3 days.",
                        "title": "Cooling off", "approval_status": "approved"}}


def test_retriever_span_reports_safe_ids_counts_and_timings(traced):
    tools = PolicyTools(_FakeRetriever(), _chunks(),
                        {"legal_name": "Synthetic Reference Lender", "entity_type": "nbfc", "lender_id": "SYNTH",
                         "relationship": "team-authored synthetic prototype policy"},
                        RetrievalFilter(mode="current", lender_id="SYNTH", entity_type="nbfc"), k=5)
    passages, meta = tools.search("what is the complaint window?")
    assert len(passages) == 2 and meta["latency_ms"] == 7.5

    sp = next(s for s in traced.exported() if s.name == "tool.search_approved_policy")
    assert sp.attributes["langfuse.observation.type"] == "retriever"
    assert json.loads(sp.attributes["langfuse.observation.metadata.count"]) == 2
    assert json.loads(sp.attributes["langfuse.observation.metadata.document_ids"]) == ["BFL-GRIEVANCE", "BFL-COOLING"]
    assert json.loads(sp.attributes["langfuse.observation.metadata.chunk_ids"]) == ["chunk-1", "chunk-2"]
    assert json.loads(sp.attributes["langfuse.observation.metadata.historical"]) is False
    assert list(sp.attributes["retrieval.chunk_ids"]) == ["chunk-1", "chunk-2"]
    assert "langfuse.observation.input" not in sp.attributes  # query text stays out by default


class _Resp:
    def __init__(self, lines, status=200, text=""):
        self.lines, self.status_code, self.text, self.encoding = lines, status, text, "utf-8"

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False

    def iter_lines(self, decode_unicode=True):
        return iter(self.lines)


def _sse(*, usage=None, text="ok"):
    lines = [f"data: {json.dumps({'choices': [{'delta': {'content': text}}]})}"]
    if usage:
        lines.append(f"data: {json.dumps({'choices': [], 'usage': usage})}")
    lines.append("data: [DONE]")
    return lines


def _install(monkeypatch, lines, status=200):
    monkeypatch.setattr(L.requests, "post", lambda *a, **k: _Resp(lines, status=status, text="upstream body"))


def test_generation_span_has_model_tokens_and_category_but_no_text(traced, monkeypatch):
    _install(monkeypatch, _sse(usage={"prompt_tokens": 11, "completion_tokens": 3, "total_tokens": 14}))
    assert L.ChatLLM(base="http://127.0.0.1:9/v1").chat("SYSTEM SECRET", "USER SECRET") == "ok"

    sp = next(s for s in traced.exported() if s.name == "llm.chat")
    assert sp.attributes["langfuse.observation.type"] == "generation"
    assert sp.attributes["langfuse.observation.model.name"] == "llm"
    assert json.loads(sp.attributes["langfuse.observation.usage_details"]) == {"input": 11, "output": 3, "total": 14}
    assert sp.attributes["llm.token_count.total"] == 14
    assert "llm.error_category" not in sp.attributes
    assert "input.value" not in sp.attributes and "llm.system" not in sp.attributes
    assert "langfuse.observation.input" not in sp.attributes


def test_generation_failure_exports_a_category_and_masks_the_provider_body(traced, monkeypatch):
    monkeypatch.setattr(L.time, "sleep", lambda _s: None)
    _install(monkeypatch, [], status=500)
    with pytest.raises(L.LLMError):
        L.ChatLLM(base="http://127.0.0.1:9/v1", retries=1).chat("system", "user")
    sp = next(s for s in traced.exported() if s.name == "llm.chat")
    assert sp.attributes["llm.error_category"] == "http"
    masked = obs._langfuse_mask_spans(params=SimpleNamespace(spans={"s": sp}))
    assert "llm.error" in masked.span_patches["s"].delete_attributes


def test_generation_text_is_opt_in_and_still_masked_for_langfuse(traced, monkeypatch):
    monkeypatch.setattr(obs, "_LF_CONFIG", LangfuseConfig(enabled=True, public_key="pk", secret_key="sk",
                                                          capture_content=True))
    monkeypatch.setenv("AGENT_TRACE_CONTENT", "1")  # Phoenix-style free text also on, to exercise the export mask
    _install(monkeypatch, _sse())
    L.ChatLLM(base="http://127.0.0.1:9/v1").chat("SYSTEM SECRET", "USER SECRET")
    sp = next(s for s in traced.exported() if s.name == "llm.chat")
    assert sp.attributes["langfuse.observation.input"] == "USER SECRET"
    assert sp.attributes["langfuse.observation.output"] == "ok"
    assert sp.attributes["input.value"] == "USER SECRET" and sp.attributes["llm.system"] == "SYSTEM SECRET"
    masked = obs._langfuse_mask_spans(params=SimpleNamespace(spans={"s": sp}))
    assert set(masked.span_patches["s"].delete_attributes) == {"input.value", "output.value", "llm.system"}
    assert "langfuse.observation.input" not in masked.span_patches["s"].delete_attributes


def test_bureau_span_reports_outcome_with_a_hashed_reference(traced):
    from fastapi.testclient import TestClient
    from loan_advisory.application.bureau_intake import run_bureau_evaluation
    from loan_advisory.infrastructure.bureau_client import BureauClient
    from loan_advisory.infrastructure.evidence_store import InMemoryEvidenceSink
    from synthetic_bureau.app import create_app
    from tests.test_bureau_entry import FIXTURE, _Store

    case = next(c for c in FIXTURE["cases"] if c["scenario"] == "VALID_PASS")
    ref = case["application"]["application_id"]
    http = TestClient(create_app())
    try:
        result = run_bureau_evaluation(ref, store=_Store([case]), sink=InMemoryEvidenceSink(),
                                       bureau_client=BureauClient(client=http))
    finally:
        http.close()
    assert result.outcome == "APPROVED" and result.status == 200

    sp = next(s for s in traced.exported() if s.name == "bureau.evaluation")
    assert sp.attributes["langfuse.observation.type"] == "chain"
    assert "bureau" in sp.attributes["langfuse.trace.tags"]
    assert json.loads(sp.attributes["langfuse.observation.metadata.outcome"]) == "APPROVED"
    assert json.loads(sp.attributes["langfuse.observation.metadata.lifecycle_state"]) == "APPROVED"
    ref_hash = sp.attributes["application.ref_hash"]
    assert len(ref_hash) == 16 and ref_hash != ref
    blob = json.dumps({k: str(v) for k, v in sp.attributes.items()})
    assert ref not in blob and "applicant" not in blob.lower()
    assert "langfuse.observation.input" not in sp.attributes
