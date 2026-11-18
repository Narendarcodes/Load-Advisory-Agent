"""Langfuse Prompt Management for the advisory agent (optional, fail-open, off by default).

    LANGFUSE_PROMPTS=1               serve prompts from Langfuse Prompt Management (default off: use prompts.py)
    LANGFUSE_PROMPT_LABEL            the version label served at runtime (default "production")
    LANGFUSE_PROMPT_PREFIX           Langfuse prompt-name prefix (default "loan-advisory-")
    LANGFUSE_PROMPT_CACHE_TTL_S      client-side cache TTL in seconds (default 60)

Prompt names are flat on purpose (`loan-advisory-explain`, not `loan-advisory/explain`): the v4 REST path
`/api/public/v2/prompts/{name}` does not URL-encode a `/`, so a namespaced name 404s for every API client even though
the SDK's `get_prompt` resolves it. Keep the prefix free of `/`.

The templates in `prompts.py` are the source of truth for a fresh install and the only fallback: with the flag off
every rendered prompt is byte-identical to `template.format(**variables)`, and every failure mode (Langfuse down,
prompt missing, renamed variable, drifted placeholder, SDK import error) also returns that exact local text. Nothing
here can change an answer, raise into a request or break startup.

A managed prompt is one Langfuse prompt (name `loan-advisory/<key>`, type `text`) whose `{{variable}}` placeholders
mirror the `{variable}` fields of the local template. `scripts/development/langfuse_prompts.py` publishes and promotes
them; the answer path only reads. The rendered prompt is linked to its generation span
(`langfuse.observation.prompt.name` / `.version`), so the UI can group answer quality and latency by prompt version.

Prompt registry (keys are the Langfuse prompt names without the prefix):

    explain, improve, what_if      CORE_RULES + DISCLOSURE + task, rendered with style/lang/voice/facts
    policy, policy_spans           the citation-grounded policy composer, rendered with profile_desc/style/lang/voice
    classify                       the intent classifier, rendered with values/history/message
    verify_citations(_quote)       the citation verifier, rendered with question/answer/passages
"""
from __future__ import annotations

import logging
import os
import re
import threading

from loan_advisory.agent import langfuse_config
from loan_advisory.agent import prompts as P

_LOG = logging.getLogger(__name__)
_LOCK = threading.Lock()
_OFF = object()
_CLIENT: object | None = None

# key -> (module attribute of the local template, human label). The local text is always the fallback.
REGISTRY: dict[str, str] = {
    "explain": "EXPLAIN",
    "improve": "IMPROVE",
    "what_if": "WHAT_IF",
    "policy": "POLICY",
    "policy_spans": "POLICY_SPANS",
    "classify": "CLASSIFY",
    "verify_citations": "VERIFY_CITATIONS",
    "verify_citations_quote": "VERIFY_CITATIONS_QUOTE",
}
_ROLES = {
    "explain": "Composes the plain-language explanation of a recorded decision.",
    "improve": "Writes the short improvement plan for the checks that failed.",
    "what_if": "Explains a hypothetical what-if estimate without changing the decision.",
    "policy": "Answers a general policy question only from the numbered passages, with citations.",
    "policy_spans": "Policy composer that grounds every claim in a verbatim quote before writing.",
    "classify": "Classifies the applicant's message into one intent and extracts what-if changes.",
    "verify_citations": "Checks which passages directly support an answer.",
    "verify_citations_quote": "Checks citation support and copies the supporting span verbatim.",
}
_VAR = re.compile(r"\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}")
_OSENT, _CSENT = "\x00", "\x01"


def _truthy(raw: str | None) -> bool:
    return (raw or "").strip().lower() in ("1", "true", "yes", "on")


def prefix() -> str:
    p = (os.environ.get("LANGFUSE_PROMPT_PREFIX") or "loan-advisory-").strip()
    return p.replace("/", "-")  # a "/" in the name 404s the v4 REST prompt path; see the module docstring


def server_name(key: str) -> str:
    return f"{prefix()}{key}"


def label() -> str:
    return (os.environ.get("LANGFUSE_PROMPT_LABEL") or "production").strip() or "production"


def _ttl() -> int:
    try:
        return max(0, int(float(os.environ.get("LANGFUSE_PROMPT_CACHE_TTL_S") or 60)))
    except ValueError:
        return 60


def enabled() -> bool:
    """Remote prompts need the Langfuse project to be configured as well as the explicit prompt flag."""
    if not _truthy(os.environ.get("LANGFUSE_PROMPTS")):
        return False
    try:
        return langfuse_config.load().active
    except Exception:  # a malformed environment must degrade to the local templates, never raise
        return False


def to_mustache(text: str) -> str:
    """A `str.format` template as a Langfuse/Mustache template: `{facts}` -> `{{facts}}`, literal `{{` -> `{`."""
    t = (text or "").replace("{{", _OSENT).replace("}}", _CSENT)
    t = re.sub(r"\{([a-zA-Z_][a-zA-Z0-9_]*)\}", lambda m: "{{" + m.group(1) + "}}", t)
    return t.replace(_OSENT, "{").replace(_CSENT, "}")


def variables_of(template: str) -> tuple[str, ...]:
    return tuple(dict.fromkeys(_VAR.findall(template or "")))


def local_templates() -> dict[str, str]:
    """key -> local `str.format` template (the fallback text)."""
    return {key: getattr(P, attr) for key, attr in REGISTRY.items() if getattr(P, attr, None)}


def registry() -> dict[str, dict]:
    """key -> {server_name, local, text (mustache), variables, role} for the publisher and for tests."""
    out: dict[str, dict] = {}
    for key, local in local_templates().items():
        text = to_mustache(local)
        out[key] = {"server_name": server_name(key), "local": local, "text": text,
                    "variables": list(variables_of(text)), "role": _ROLES.get(key, "")}
    return out


def reset() -> None:
    """Drop the cached client/config (tests; a process picks up new env values)."""
    global _CLIENT
    with _LOCK:
        _CLIENT = None


def _client():
    """A Langfuse client for prompt reads: the exporter's client when tracing is on, else a tracing-free one."""
    global _CLIENT
    if _CLIENT is not None:
        return None if _CLIENT is _OFF else _CLIENT
    with _LOCK:
        if _CLIENT is not None:
            return None if _CLIENT is _OFF else _CLIENT
        try:
            from loan_advisory.agent import observability as obs
            shared = getattr(obs, "_LANGFUSE", None)  # reuse the exporter: one client, no second TracerProvider
            if shared is not None:
                _CLIENT = shared
                return _CLIENT
            from langfuse import Langfuse
            cfg = langfuse_config.load()
            _CLIENT = Langfuse(public_key=cfg.public_key, secret_key=cfg.secret_key, base_url=cfg.base_url,
                               environment=cfg.environment, release=cfg.release, timeout=cfg.timeout_s,
                               tracing_enabled=False)  # prompt reads only; observability.py owns tracing
        except Exception as e:
            _LOG.warning("langfuse prompt client unavailable (%s); using local prompts", type(e).__name__)
            _CLIENT = _OFF
        return None if _CLIENT is _OFF else _CLIENT


def fetch(key: str):
    """The Langfuse prompt object for `key` at the served label/version, or None (never raises)."""
    c = _client()
    if c is None:
        return None
    try:
        return c.get_prompt(server_name(key), label=label(), type="text", cache_ttl_seconds=_ttl())
    except Exception as e:  # not found, auth, drift, timeout: the caller uses the local template
        _LOG.warning("langfuse prompt %s unavailable (%s); using the local template", server_name(key),
                     type(e).__name__)
        return None


def render(key: str, default: str, variables: dict) -> tuple[str, dict | None]:
    """Return (prompt text, prompt_ref). `prompt_ref` is {"name","version"} only when the remote text was used."""
    local = default.format(**variables)
    if not enabled():
        return local, None
    try:
        p = fetch(key)
    except Exception as e:  # an unexpected client/transport error is still only a lost remote prompt
        _LOG.warning("langfuse prompt %s fetch failed (%s); using the local template", key, type(e).__name__)
        p = None
    if p is None:
        return local, None
    try:
        text = p.compile(**variables)
    except Exception as e:
        _LOG.warning("langfuse prompt %s did not compile (%s); using the local template", p.name, type(e).__name__)
        return local, None
    if not text or "{{" in text:  # a placeholder the code cannot fill: the remote version drifted; stay local
        _LOG.warning("langfuse prompt %s v%s left a placeholder unrendered; using the local template",
                     getattr(p, "name", server_name(key)), getattr(p, "version", "?"))
        return local, None
    return text, {"name": p.name, "version": p.version}


def attrs(prompt_ref: dict | None) -> dict:
    """Span attributes that link an observation to the prompt version that produced it (empty when unlinked)."""
    if not prompt_ref:
        return {}
    out = {}
    if prompt_ref.get("name"):
        out["langfuse.observation.prompt.name"] = str(prompt_ref["name"])
    if prompt_ref.get("version") is not None:
        out["langfuse.observation.prompt.version"] = str(prompt_ref["version"])
    return out
