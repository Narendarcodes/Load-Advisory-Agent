"""Local, free tracing with OpenTelemetry -> self-hosted Arize Phoenix and/or self-hosted Langfuse.

Lightweight by design: plain OpenTelemetry SDK + manual spans using OpenInference attribute names (so Phoenix
renders LLM / TOOL / CHAIN spans natively) plus Langfuse semantic attributes on the same spans (so Langfuse shows
nested agent/retrieval/citation observations). No auto-instrumentation, no SaaS, no LangChain callbacks.

    AGENT_TRACING=1                      enable Phoenix export (default off)
    OTEL_EXPORTER_OTLP_ENDPOINT          default http://127.0.0.1:6006  (Phoenix; spans go to <endpoint>/v1/traces)
    AGENT_TRACE_PROJECT                  Phoenix project name (default "loan-advisory-agent")
    AGENT_TRACE_CONTENT=1                also record message/answer text in Phoenix spans (default off)
    LANGFUSE_ENABLED=1                   enable the self-hosted Langfuse exporter (see langfuse_config.py)
    LANGFUSE_CAPTURE_CONTENT=1           opt-in: include message/answer text in Langfuse spans (default off)

Both exporters share one TracerProvider and one span tree, so nothing is traced twice. Langfuse is optional:
missing/invalid settings, an unavailable SDK or a down collector never raise into an advisory request.

What is traced: one CHAIN span per agent turn (`advisor.turn`), one span per LangGraph node (`node.<name>`), one
TOOL span per tool call (Frappe/ZEN/what-if/retrieval/handoff), one LLM span per gpt-oss-120b call (prompt and
completion tokens, TTFT, latency), and on the voice side one span per voice turn with STT / graph / TTS timings.
W3C `traceparent` is propagated from the voice worker to the chat server, so a voice turn and the graph run it
triggered form one trace.
"""
import contextlib
import functools
import json
import logging
import os
import threading

from loan_advisory.agent import langfuse_config

_TRACER = None
_LANGFUSE = None
_LF_CONFIG = None
_LOCK = threading.Lock()
CONTENT = os.environ.get("AGENT_TRACE_CONTENT") == "1"
_LOG = logging.getLogger(__name__)

# OpenInference kind -> Langfuse observation type (Langfuse defaults unknown OTel spans to "span").
_LF_KIND = {"CHAIN": "chain", "LLM": "generation", "TOOL": "tool", "RETRIEVER": "retriever",
            "AGENT": "agent", "GUARDRAIL": "guardrail"}

# Free-text attributes that must never reach Langfuse (they may contain messages, prompts, policy excerpts or
# applicant data). They stay available to the local Phoenix exporter only.
_LF_DROP_ATTRS = ("input.value", "output.value", "llm.system", "llm.error")


def lf_config():
    """Validated Langfuse configuration (cached; never raises)."""
    global _LF_CONFIG
    if _LF_CONFIG is None:
        try:
            _LF_CONFIG = langfuse_config.load()
        except Exception:  # malformed env must not break tracing or requests
            _LF_CONFIG = langfuse_config.LangfuseConfig(problems=("config_error",))
    return _LF_CONFIG


def reset():
    """Drop cached config/client state (tests; a process sets the global tracer provider once)."""
    global _TRACER, _LANGFUSE, _LF_CONFIG
    with _LOCK:
        _TRACER = _LANGFUSE = _LF_CONFIG = None


def _phoenix_enabled() -> bool:
    return os.environ.get("AGENT_TRACING") == "1"


def enabled() -> bool:
    return _phoenix_enabled() or lf_config().active


def _langfuse_span_filter(span) -> bool:
    scope = getattr(span, "instrumentation_scope", None)
    return scope is not None and scope.name == "loan_advisory.agent"


def tracer():
    """Lazily configure the exporters once per process; None when tracing is off/unavailable."""
    global _TRACER, _LANGFUSE
    if _TRACER is not None:
        return _TRACER
    cfg = lf_config()
    phoenix = _phoenix_enabled()
    if not (phoenix or cfg.active):
        return None
    with _LOCK:
        if _TRACER is not None:
            return _TRACER
        try:
            from opentelemetry import trace
            from opentelemetry.sdk.resources import Resource
            from opentelemetry.sdk.trace import TracerProvider
        except ImportError:
            return None
        try:
            res = Resource.create({"service.name": os.environ.get("OTEL_SERVICE_NAME", "loan-advisory-agent"),
                                   "openinference.project.name": os.environ.get("AGENT_TRACE_PROJECT", "loan-advisory-agent")})
            prov = TracerProvider(resource=res)
            if phoenix:
                try:
                    from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
                    from opentelemetry.sdk.trace.export import BatchSpanProcessor
                    ep = os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT", "http://127.0.0.1:6006").rstrip("/")
                    prov.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(endpoint=f"{ep}/v1/traces"),
                                                               schedule_delay_millis=1000))
                except Exception as e:
                    _LOG.warning("phoenix exporter unavailable (%s); continuing", type(e).__name__)
            lf_ok = False
            if cfg.active:
                try:
                    from langfuse import Langfuse
                    _LANGFUSE = Langfuse(public_key=cfg.public_key, secret_key=cfg.secret_key, base_url=cfg.base_url,
                                         environment=cfg.environment, release=cfg.release, sample_rate=cfg.sample_rate,
                                         timeout=cfg.timeout_s, should_export_span=_langfuse_span_filter,
                                         mask_otel_spans=_langfuse_mask_spans, tracer_provider=prov)
                    lf_ok = True
                except Exception as e:  # SDK missing, bad endpoint, version drift: observability is optional
                    _LOG.warning("langfuse exporter unavailable (%s); continuing", type(e).__name__)
            if not phoenix and not lf_ok:
                return None
            trace.set_tracer_provider(prov)
            _TRACER = trace.get_tracer("loan_advisory.agent")
            return _TRACER
        except Exception as e:  # provider construction must never break an advisory request
            _LOG.warning("tracing unavailable (%s); continuing", type(e).__name__)
            return None


def lf_meta(**kw) -> dict:
    """Langfuse observation metadata (values JSON-encoded as the server expects); skips None."""
    return {f"langfuse.observation.metadata.{k}": json.dumps(v, ensure_ascii=False, default=str)
            for k, v in kw.items() if v is not None}


def lf_trace_meta(**kw) -> dict:
    return {f"langfuse.trace.metadata.{k}": json.dumps(v, ensure_ascii=False, default=str)
            for k, v in kw.items() if v is not None}


def capture_content() -> bool:
    return lf_config().active and lf_config().capture_content


def lf_content(text: str | None) -> str | None:
    """Free text for Langfuse only when LANGFUSE_CAPTURE_CONTENT=1 (default off)."""
    return (text or "")[:4000] if (text and capture_content()) else None


def _langfuse_mask_spans(*, params):
    """Export-stage guard for raw OTel attributes (a second line of defence behind the allowlist)."""
    from langfuse.types import MaskOtelSpansResult, OtelSpanPatch
    patches = {}
    for ident, span in params.spans.items():
        present = tuple(k for k in _LF_DROP_ATTRS if k in (span.attributes or {}))
        if present:
            patches[ident] = OtelSpanPatch(delete_attributes=present)
    return MaskOtelSpansResult(span_patches=patches) if patches else None


def _lf_span_attrs(kind: str) -> dict:
    cfg = lf_config()
    if not cfg.active:
        return {}
    out = {"langfuse.observation.type": _LF_KIND.get(kind, "span"), "langfuse.environment": cfg.environment}
    if cfg.release:
        out["langfuse.release"] = cfg.release
    return out


def _clean(attrs: dict) -> dict:
    out = {}
    for k, v in attrs.items():
        if v is None:
            continue
        if isinstance(v, (str, bool, int, float)):
            out[k] = v
        elif isinstance(v, (list, tuple)) and all(isinstance(x, (str, int, float, bool)) for x in v):
            out[k] = list(v)
        else:
            out[k] = str(v)[:1000]
    return out


@contextlib.contextmanager
def span(name: str, kind: str = "CHAIN", context=None, **attrs):
    """Start a span (current in this thread). Yields the span, or None when tracing is off."""
    try:
        t = tracer()
    except Exception as e:  # telemetry setup must never break the request it is observing
        _LOG.warning("tracing disabled for this span (%s)", type(e).__name__)
        t = None
    if t is None:
        yield None
        return
    # Default OTel behaviour records an "exception" event with the raw message/stacktrace; that text can carry
    # applicant values or credentials, so the exception class is the only thing exported.
    with t.start_as_current_span(name, context=context, record_exception=False,
                                 set_status_on_exception=False) as sp:
        set_attrs(sp, **{"openinference.span.kind": kind, **_lf_span_attrs(kind), **attrs})
        try:
            yield sp
        except Exception as e:
            # Never export the raw message or stack: it can carry applicant values or credentials. The exception
            # class is safe and enough to triage; details stay in the local process/logs.
            from opentelemetry.trace import Status, StatusCode
            sp.set_attribute("error.type", type(e).__name__)
            sp.set_status(Status(StatusCode.ERROR, type(e).__name__))
            raise


def set_attrs(sp, **attrs):
    if sp is not None:
        try:
            sp.set_attributes(_clean(attrs))
        except Exception as e:  # an attribute the SDK rejects must not fail the turn
            _LOG.warning("dropped span attributes (%s)", type(e).__name__)


def content(text: str | None) -> str | None:
    """Only export free text when AGENT_TRACE_CONTENT=1."""
    return (text or "")[:4000] if CONTENT else None


def tool(name: str):
    """Decorator: wrap a tool method in a TOOL span named `tool.<name>`."""
    def deco(fn):
        @functools.wraps(fn)
        def wrapper(*a, **kw):
            with span(f"tool.{name}", kind="TOOL", **{"tool.name": name}) as sp:
                out = fn(*a, **kw)
                if sp is not None and isinstance(out, dict):
                    set_attrs(sp, **{f"tool.result.{k}": v for k, v in out.items()
                                     if k in ("simulated_decision", "original_record_unchanged", "decision", "record_id")})
                return out
        return wrapper
    return deco


def current_span():
    if tracer() is None:
        return None
    from opentelemetry import trace
    return trace.get_current_span()


def current_context():
    if tracer() is None:
        return None
    from opentelemetry import context
    return context.get_current()


def inject_headers(headers: dict) -> dict:
    if tracer() is None:
        return headers
    from opentelemetry.propagate import inject
    inject(headers)
    return headers


def extract_context(headers) -> object | None:
    if tracer() is None:
        return None
    from opentelemetry.propagate import extract
    return extract({k.lower(): v for k, v in dict(headers).items()})


def flush(timeout_millis: int = 5000):
    """Bounded flush; telemetry failures never surface to the caller."""
    try:
        if tracer() is None:
            return
        from opentelemetry import trace
        p = trace.get_tracer_provider()
        if hasattr(p, "force_flush"):
            p.force_flush(timeout_millis)
    except Exception as e:  # a down collector must not break shutdown or a request
        _LOG.warning("trace flush failed (%s)", type(e).__name__)
