"""Minimal OpenAI-compatible chat client.

No LiteLLM / SDK wrapper: plain `requests` against /v1/chat/completions. Streaming is used so the
time-to-first-token (TTFT) of every call is measured and reported in the turn trace.

Provider selection is explicit and env-driven (see `provider_from_env`). SARAL_LLM_* wins over the generic LLM_*:

    SARAL_LLM_PROVIDER / LLM_PROVIDER   river (default) | omniroute | groq
        river      https://api.river.ai/v1 (RIVER_BASE_URL overrides), key RIVER_API_KEY,
                   default model deepseek-ai/DeepSeek-V4.1-Flash
        omniroute  http://127.0.0.1:20128/v1 (OMNIROUTE_BASE_URL overrides), key OMNIROUTE_API_KEY if required
        groq       https://api.groq.com/openai/v1, key GROQ_API_KEY
    SARAL_LLM_BASE_URL / LLM_BASE       endpoint override for the primary
    SARAL_LLM_MODEL / LLM_MODEL         model id (required for omniroute/groq; river has a default)
    SARAL_LLM_FALLBACK_MODEL            comma list of `model[@river|omniroute|groq|URL]` tried in order when the
                                        primary fails (a bare model uses the primary's provider). Default with the
                                        river provider: GLM-5.3@river,antigravity/claude-sonnet-4-6@omniroute.
                                        Set it empty for no fallback.
    SARAL_LLM_REASONING_EFFORT / LLM_REASONING_EFFORT   empty omits the parameter. Default `low`, except DeepSeek
                                        on River (sending it switches reasoning on and slows the answer).

Why River is the default: on 2026-11-04 the OmniRoute gateway (owner's laptop) was unreachable, so the answer
generator moved to River AI; OmniRoute claude-sonnet-4-6 stays supported (primary via SARAL_LLM_PROVIDER=omniroute,
and the last fallback by default). There is deliberately no fallback to a local vLLM server: an unconfigured
provider fails loudly at startup, and an exhausted chain raises LLMError so the graph uses its safe template.
"""
import json
import os
import re
import threading
import time
from dataclasses import dataclass

import requests

from loan_advisory.agent import observability as obs

DEFAULT_PROVIDER = "river"
PROVIDERS = {
    "river": {"base": "https://api.river.ai/v1", "key_env": "RIVER_API_KEY", "base_env": "RIVER_BASE_URL",
              "model": "deepseek-ai/DeepSeek-V4.1-Flash"},
    "groq": {"base": "https://api.groq.com/openai/v1", "key_env": "GROQ_API_KEY", "base_env": None},
    "omniroute": {"base": "http://127.0.0.1:20128/v1", "key_env": "OMNIROUTE_API_KEY", "base_env": "OMNIROUTE_BASE_URL"},
}
# Answer-generator fallback chain per primary provider (SARAL_LLM_FALLBACK_MODEL overrides; empty = none).
DEFAULT_FALLBACKS = {"river": "GLM-5.3@river,antigravity/claude-sonnet-4-6@omniroute"}
DEFAULT_BASE = PROVIDERS[DEFAULT_PROVIDER]["base"]
DEFAULT_MODEL = os.environ.get("LLM_MODEL") or "llm"  # lenient default for ad-hoc clients only


class LLMConfigError(ValueError):
    """The provider configuration is missing or invalid; the service must not start."""


@dataclass(frozen=True)
class ProviderConfig:
    provider: str
    base: str
    model: str
    api_key: str
    reasoning_effort: str | None


def _env(env, *names):
    """First of `names` present in env (present-but-empty counts, so an empty value can switch a default off)."""
    for n in names:
        if n in env:
            return env[n]
    return None


def default_reasoning_effort(provider: str, model: str) -> str | None:
    # DeepSeek-V4.1-Flash on River answers without reasoning unless reasoning_effort is sent (then it reasons and is
    # ~1.5x slower); GLM-5.3 cannot disable reasoning and is fastest on `low` (probe 2026-11-04).
    if provider == "river" and "deepseek" in model.lower():
        return None
    return "low"


def provider_from_env(env=None, *, base=None, model=None, api_key=None, provider=None,
                      require_model: bool = False) -> ProviderConfig:
    """Resolve one active provider. Explicit arguments win over env; SARAL_LLM_* wins over LLM_*; env over defaults."""
    env = os.environ if env is None else env
    name = (provider or _env(env, "SARAL_LLM_PROVIDER") or env.get("LLM_PROVIDER") or DEFAULT_PROVIDER).strip().lower()
    if name not in PROVIDERS:
        raise LLMConfigError(f"SARAL_LLM_PROVIDER / LLM_PROVIDER must be one of {sorted(PROVIDERS)}, got {name!r}")
    spec = PROVIDERS[name]
    base_url = (base or env.get("SARAL_LLM_BASE_URL") or (env.get(spec["base_env"]) if spec["base_env"] else "")
                or env.get("LLM_BASE") or spec["base"]).strip().rstrip("/")
    model_id = (model or env.get("SARAL_LLM_MODEL") or env.get("LLM_MODEL")
                or ("" if base else spec.get("model")) or "").strip()  # an ad-hoc client on its own base: no default
    if not model_id:
        if require_model:
            raise LLMConfigError(
                f"SARAL_LLM_MODEL / LLM_MODEL is not set; configure the model ID exposed by the {name} provider")
        model_id = DEFAULT_MODEL
    key = (api_key if api_key is not None else env.get("LLM_API_KEY") or env.get(spec["key_env"]) or "").strip()
    effort = _env(env, "SARAL_LLM_REASONING_EFFORT", "LLM_REASONING_EFFORT")
    effort = default_reasoning_effort(name, model_id) if effort is None else effort
    effort = (effort or "").strip() or None
    return ProviderConfig(provider=name, base=base_url, model=model_id, api_key=key, reasoning_effort=effort)


def parse_fallbacks(spec: str, primary: ProviderConfig, env) -> list[ProviderConfig]:
    """`model[@river|omniroute|groq|URL]` entries. A bare model uses the primary's provider and endpoint. A provider
    alias uses that provider's own endpoint and key; a URL entry sends no key (never leak one provider's key)."""
    out = []
    for item in (spec or "").split(","):
        item = item.strip()
        if not item:
            continue
        model_id, _, where = item.rpartition("@") if "@" in item else (item, "", "")
        where = where.strip()
        if not where:
            out.append(ProviderConfig(primary.provider, primary.base, model_id.strip(), primary.api_key,
                                      default_reasoning_effort(primary.provider, model_id)))
        elif where.lower() in PROVIDERS:
            p = where.lower()
            pspec = PROVIDERS[p]
            b = ((env.get(pspec["base_env"]) if pspec["base_env"] else "") or pspec["base"]).strip().rstrip("/")
            out.append(ProviderConfig(p, b, model_id.strip(), (env.get(pspec["key_env"]) or "").strip(),
                                      default_reasoning_effort(p, model_id)))
        elif where.startswith(("http://", "https://")):
            out.append(ProviderConfig(primary.provider, where.rstrip("/"), model_id.strip(), "",
                                      default_reasoning_effort(primary.provider, model_id)))
        else:
            raise LLMConfigError(f"SARAL_LLM_FALLBACK_MODEL entry {item!r}: endpoint must be a provider or a URL")
    return out


def _retryable_status(status: int) -> bool:
    """Client errors are deterministic: retrying a 401/404 only delays the safe fallback."""
    return status in (408, 409, 425, 429) or status >= 500


STATS = {"calls": 0, "prompt_tokens": 0, "completion_tokens": 0}  # process-wide counters (throughput reporting)
_STATS_LOCK = threading.Lock()


class LLMError(Exception):
    pass


class _Deadline(Exception):
    pass


class _HTTPStatus(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status


class ChatLLM:
    def __init__(self, base: str | None = None, model: str | None = None, timeout: float | None = None,
                 reasoning_effort: str | None = None, retries: int | None = None, api_key: str | None = None,
                 provider: str | None = None, env=None):
        cfg = provider_from_env(env, base=base, model=model, api_key=api_key, provider=provider)
        env = os.environ if env is None else env
        self.provider = cfg.provider
        self.base = cfg.base
        self.model = cfg.model
        self.retries = retries if retries is not None else int(env.get("LLM_RETRIES", "3"))
        self.timeout = timeout if timeout is not None else float(env.get("LLM_TIMEOUT_S", "120"))
        self.reasoning_effort = (reasoning_effort or None) if reasoning_effort is not None else cfg.reasoning_effort
        self.stream_usage = env.get("LLM_STREAM_USAGE", "1") not in ("0", "false", "no")
        self._local = threading.local()
        self._secret = cfg.api_key
        self._headers = {"Authorization": f"Bearer {self._secret}"} if self._secret else {}

    @classmethod
    def from_env(cls, *, env=None, **kw) -> "ChatLLM":
        """The runtime wiring: a known provider and a model (explicit, or the provider's default). Returns a
        FallbackChatLLM when a fallback chain is configured (SARAL_LLM_FALLBACK_MODEL or the provider default)."""
        env = os.environ if env is None else env
        cfg = provider_from_env(env, require_model=True)
        primary = cls(base=cfg.base, model=cfg.model, api_key=cfg.api_key, provider=cfg.provider,
                      reasoning_effort=cfg.reasoning_effort or "", env=env, **kw)
        fb_spec = _env(env, "SARAL_LLM_FALLBACK_MODEL")
        fb_spec = DEFAULT_FALLBACKS.get(cfg.provider, "") if fb_spec is None else fb_spec
        fbs = [c for c in parse_fallbacks(fb_spec, cfg, env) if (c.provider, c.base, c.model) != (cfg.provider, cfg.base, cfg.model)]
        if not fbs:
            return primary
        return FallbackChatLLM([primary] + [cls(base=c.base, model=c.model, api_key=c.api_key, provider=c.provider,
                                                reasoning_effort=c.reasoning_effort or "", env=env, **kw) for c in fbs])

    @property
    def api_key_set(self) -> bool:
        return bool(self._secret)

    def _redact(self, text: str) -> str:
        return text.replace(self._secret, "***") if self._secret else text

    @property
    def calls(self) -> list[dict]:
        """Per-thread call timing log (one graph turn runs in one thread; cleared by the graph per turn)."""
        if not hasattr(self._local, "calls"):
            self._local.calls = []
        return self._local.calls

    supports_deadline = True  # the graph passes an absolute perf_counter() deadline to every call

    def chat(self, system: str, user: str, max_tokens: int = 900, temperature: float = 0.0, tag: str = "",
             deadline: float | None = None) -> str:
        return "".join(self.chat_stream(system, user, max_tokens=max_tokens, temperature=temperature, tag=tag,
                                        deadline=deadline)).strip()

    def chat_stream(self, system: str, user: str, max_tokens: int = 900, temperature: float = 0.0, tag: str = "",
                    deadline: float | None = None):
        """Yield content deltas as they arrive. Raises LLMError on failure or when `deadline` passes."""
        params = {"max_tokens": max_tokens, "temperature": temperature}
        if self.reasoning_effort:
            params["reasoning_effort"] = self.reasoning_effort
        with obs.span(f"llm.{tag or 'chat'}", kind="LLM", **{"llm.model_name": self.model, "llm.provider": self.provider,
                                                              "llm.invocation_parameters": json.dumps(params),
                                                              "langfuse.observation.model.name": self.model,
                                                              "langfuse.observation.model.parameters": json.dumps(params),
                                                              "langfuse.observation.input": obs.lf_content(user),
                                                              "input.value": obs.content(user), "llm.system": obs.content(system)}) as sp:
            parts = []
            try:
                for d in self._stream(system, user, max_tokens, temperature, tag, deadline):
                    parts.append(d)
                    yield d
            finally:
                c = self.calls[-1] if self.calls else {}
                prompt_tokens, completion_tokens = c.get("prompt_tokens"), c.get("completion_tokens")
                err = c.get("error")
                category = None if not err else ("deadline" if err == "deadline" else "http" if str(err).startswith("HTTP") else "llm_error")
                usage = None if prompt_tokens is None and completion_tokens is None else {
                    "input": prompt_tokens or 0, "output": completion_tokens or 0,
                    "total": (prompt_tokens or 0) + (completion_tokens or 0)}
                obs.set_attrs(sp, **{"llm.token_count.prompt": prompt_tokens, "llm.token_count.completion": completion_tokens,
                                     "llm.token_count.total": (prompt_tokens or 0) + (completion_tokens or 0),
                                     "llm.ttft_ms": round(c["ttft_s"] * 1000, 1) if c.get("ttft_s") is not None else None,
                                     "llm.latency_ms": round(c.get("total_s", 0) * 1000, 1), "llm.error": err,
                                     "llm.error_category": category,
                                     "langfuse.observation.usage_details": json.dumps(usage) if usage else None,
                                     "langfuse.observation.output": obs.lf_content("".join(parts)),
                                     "output.value": obs.content("".join(parts))})

    def _stream(self, system: str, user: str, max_tokens: int, temperature: float, tag: str, deadline: float | None):
        body = {"model": self.model, "messages": [{"role": "system", "content": system},
                                                  {"role": "user", "content": user}],
                "max_tokens": max_tokens, "temperature": temperature, "stream": True}
        if self.stream_usage:
            body["stream_options"] = {"include_usage": True}
        if self.reasoning_effort:  # optional: routed gateways may not accept it
            body["reasoning_effort"] = self.reasoning_effort
        t0 = time.perf_counter()
        ttft = first_any = None
        usage = {}
        last_err = None
        yielded = False
        rec = {"tag": tag, "model": self.model}

        def left():
            return None if deadline is None else deadline - time.perf_counter()

        try:
            for attempt in range(self.retries):
                rem = left()
                if rem is not None and rem <= 0.05:
                    raise LLMError("deadline exceeded before the LLM answered")
                read_to = self.timeout if rem is None else max(0.05, min(self.timeout, rem))
                try:
                    with requests.post(f"{self.base}/chat/completions", json=body, stream=True,
                                       timeout=(min(5.0, read_to), read_to), headers=self._headers) as r:
                        if r.status_code >= 400:
                            raise _HTTPStatus(r.status_code, f"HTTP {r.status_code}: {self._redact(r.text[:200])}")
                        # OpenAI-compatible SSE is UTF-8; with no charset on text/event-stream requests falls back to
                        # ISO-8859-1, which mangles the rupee sign and Indic text.
                        r.encoding = "utf-8"
                        for line in r.iter_lines(decode_unicode=True):
                            rem = left()
                            if rem is not None and rem <= 0:
                                raise _Deadline()
                            if not line or not line.startswith("data:"):
                                continue
                            data = line[5:].strip()
                            if data == "[DONE]":
                                break
                            try:
                                obj = json.loads(data)
                            except ValueError:
                                continue
                            if obj.get("usage"):
                                usage = obj["usage"]
                            if not obj.get("choices"):
                                continue
                            delta = obj["choices"][0].get("delta", {})
                            if first_any is None and (delta.get("reasoning") or delta.get("reasoning_content") or delta.get("content")):
                                first_any = time.perf_counter() - t0
                            c = delta.get("content")
                            if c:
                                if ttft is None:
                                    ttft = time.perf_counter() - t0
                                yielded = True
                                yield c
                    break
                except _Deadline:
                    raise LLMError("deadline exceeded while the LLM was answering")
                except (_HTTPStatus, requests.RequestException, LLMError) as e:
                    last_err = e
                    if isinstance(e, _HTTPStatus) and not _retryable_status(e.status):
                        raise LLMError(str(e))  # 401/404/... will not change on a retry
                    rem = left()
                    if rem is not None and rem <= 1.5 * (attempt + 1):
                        raise LLMError(f"deadline exceeded ({type(e).__name__})")  # no time left for a retry
                    if yielded:
                        raise LLMError(str(e))  # cannot un-say streamed text
                    ttft = first_any = None
                    time.sleep(1.5 * (attempt + 1))
            else:
                raise LLMError(str(last_err))
            if not yielded:
                raise LLMError("LLM returned no content")  # e.g. a filtered or non-SSE response
        except LLMError as e:
            rec["error"] = "deadline" if "deadline" in str(e) else str(e)[:120]
            raise
        finally:
            rec.update({"ttft_s": round(ttft, 3) if ttft is not None else None,
                        "first_token_any_s": round(first_any, 3) if first_any is not None else None,
                        "total_s": round(time.perf_counter() - t0, 3), "prompt_tokens": usage.get("prompt_tokens"),
                        "completion_tokens": usage.get("completion_tokens")})
            self.calls.append(rec)
            with _STATS_LOCK:
                STATS["calls"] += 1
                STATS["prompt_tokens"] += usage.get("prompt_tokens") or 0
                STATS["completion_tokens"] += usage.get("completion_tokens") or 0

    def chat_json(self, system: str, user: str, max_tokens: int = 900, tag: str = "", deadline: float | None = None) -> dict:
        txt = self.chat(system, user, max_tokens=max_tokens, tag=tag, deadline=deadline)
        return parse_json(txt)


class FallbackChatLLM:
    """The answer generator's provider chain: each call goes to the first client; on LLMError before any text was
    streamed, the same call goes to the next one. Deadline errors are not retried elsewhere (no time left).
    Fallback use is counted per model in `fallback_uses` and every attempt lands in the shared per-thread `calls`."""

    supports_deadline = True

    def __init__(self, clients: list[ChatLLM]):
        if not clients:
            raise LLMConfigError("FallbackChatLLM needs at least one client")
        self.clients = clients
        self.primary = clients[0]
        self.fallback_uses: dict[str, int] = {}
        self._lock = threading.Lock()

    # the primary's identity, so tracing/intent wiring that reads these keeps working
    def __getattr__(self, name):
        if name in ("model", "provider", "base", "timeout", "retries", "reasoning_effort", "stream_usage", "_secret",
                    "api_key_set"):
            return getattr(self.primary, name)
        raise AttributeError(name)

    @property
    def calls(self) -> list[dict]:
        return self.primary.calls

    def chat_stream(self, system: str, user: str, max_tokens: int = 900, temperature: float = 0.0, tag: str = "",
                    deadline: float | None = None):
        last = None
        for i, c in enumerate(self.clients):
            yielded = False
            try:
                for d in c.chat_stream(system, user, max_tokens=max_tokens, temperature=temperature, tag=tag,
                                       deadline=deadline):
                    yielded = True
                    yield d
                if i:
                    with self._lock:
                        self.fallback_uses[c.model] = self.fallback_uses.get(c.model, 0) + 1
                    if c.calls:
                        self.primary.calls.append(c.calls.pop())
                return
            except LLMError as e:
                last = e
                if c is not self.primary and c.calls:
                    self.primary.calls.append(c.calls.pop())
                if yielded or "deadline" in str(e):
                    raise
        raise last

    def chat(self, system: str, user: str, max_tokens: int = 900, temperature: float = 0.0, tag: str = "",
             deadline: float | None = None) -> str:
        return "".join(self.chat_stream(system, user, max_tokens=max_tokens, temperature=temperature, tag=tag,
                                        deadline=deadline)).strip()

    def chat_json(self, system: str, user: str, max_tokens: int = 900, tag: str = "", deadline: float | None = None) -> dict:
        return parse_json(self.chat(system, user, max_tokens=max_tokens, tag=tag, deadline=deadline))


def parse_json(txt: str) -> dict:
    txt = txt.strip()
    m = re.search(r"\{.*\}", txt, re.S)
    if not m:
        raise LLMError(f"no JSON object in LLM output: {txt[:120]!r}")
    try:
        return json.loads(m.group(0))
    except ValueError as e:
        raise LLMError(f"bad JSON from LLM: {e}")
