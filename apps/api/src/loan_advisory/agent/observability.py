"""Local, free tracing with OpenTelemetry -> self-hosted Arize Phoenix (OTLP/HTTP).

Lightweight by design: plain OpenTelemetry SDK + manual spans using OpenInference attribute names (so Phoenix
renders LLM / TOOL / CHAIN spans natively). No auto-instrumentation, no SaaS, no LangChain callbacks.

    AGENT_TRACING=1                      enable (default off; everything below is a no-op when off or when the
                                         opentelemetry packages are not installed)
    OTEL_EXPORTER_OTLP_ENDPOINT          default http://127.0.0.1:6006  (Phoenix; spans go to <endpoint>/v1/traces)
    AGENT_TRACE_PROJECT                  Phoenix project name (default "loan-advisory-agent")
    AGENT_TRACE_CONTENT=1                also record message/answer text (default off: PII minimisation — spans
                                         carry ids, intents, flags, token counts and timings only)

What is traced: one CHAIN span per agent turn (`advisor.turn`), one span per LangGraph node (`node.<name>`), one
TOOL span per tool call (Frappe/ZEN/what-if/retrieval/handoff), one LLM span per gpt-oss-120b call (prompt and
completion tokens, TTFT, latency), and on the voice side one span per voice turn with STT / graph / TTS timings.
W3C `traceparent` is propagated from the voice worker to the chat server, so a voice turn and the graph run it
triggered form one trace.
"""
import contextlib
import functools
import os
import threading

_TRACER = None
_LOCK = threading.Lock()
CONTENT = os.environ.get("AGENT_TRACE_CONTENT") == "1"


def enabled() -> bool:
    return os.environ.get("AGENT_TRACING") == "1"


def tracer():
    """Lazily configure the OTLP exporter once per process; None when tracing is off/unavailable."""
    global _TRACER
    if _TRACER is not None or not enabled():
        return _TRACER or None
    with _LOCK:
        if _TRACER is not None:
            return _TRACER
        try:
            from opentelemetry import trace
            from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
            from opentelemetry.sdk.resources import Resource
            from opentelemetry.sdk.trace import TracerProvider
            from opentelemetry.sdk.trace.export import BatchSpanProcessor
        except ImportError:
            return None
        ep = os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT", "http://127.0.0.1:6006").rstrip("/")
        res = Resource.create({"service.name": os.environ.get("OTEL_SERVICE_NAME", "loan-advisory-agent"),
                               "openinference.project.name": os.environ.get("AGENT_TRACE_PROJECT", "loan-advisory-agent")})
        prov = TracerProvider(resource=res)
        prov.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(endpoint=f"{ep}/v1/traces"), schedule_delay_millis=1000))
        trace.set_tracer_provider(prov)
        _TRACER = trace.get_tracer("loan_advisory.agent")
        return _TRACER


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
    t = tracer()
    if t is None:
        yield None
        return
    with t.start_as_current_span(name, context=context) as sp:
        sp.set_attributes(_clean({"openinference.span.kind": kind, **attrs}))
        try:
            yield sp
        except Exception as e:
            sp.record_exception(e)
            from opentelemetry.trace import Status, StatusCode
            sp.set_status(Status(StatusCode.ERROR, str(e)[:200]))
            raise


def set_attrs(sp, **attrs):
    if sp is not None:
        sp.set_attributes(_clean(attrs))


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


def flush():
    if tracer() is None:
        return
    from opentelemetry import trace
    p = trace.get_tracer_provider()
    if hasattr(p, "force_flush"):
        p.force_flush(5000)
