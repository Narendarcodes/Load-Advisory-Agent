"""Minimal OpenAI-compatible chat client for the self-hosted gpt-oss-120b (vLLM, model "llm").

No LiteLLM / SDK wrapper: plain `requests` against /v1/chat/completions. Streaming is used so the
time-to-first-token (TTFT) of every call is measured and reported in the turn trace.
"""
import json
import os
import re
import threading
import time

import requests

from loan_advisory.agent import observability as obs

DEFAULT_BASE = os.environ.get("LLM_BASE", "http://127.0.0.1:8001/v1")
DEFAULT_MODEL = os.environ.get("LLM_MODEL", "llm")


STATS = {"calls": 0, "prompt_tokens": 0, "completion_tokens": 0}  # process-wide counters (throughput reporting)
_STATS_LOCK = threading.Lock()


class LLMError(Exception):
    pass


class _Deadline(Exception):
    pass


class ChatLLM:
    def __init__(self, base: str | None = None, model: str | None = None, timeout: float | None = None,
                 reasoning_effort: str = "low", retries: int | None = None):
        self.base = (base or DEFAULT_BASE).rstrip("/")
        self.retries = retries if retries is not None else int(os.environ.get("LLM_RETRIES", "3"))
        self.model = model or DEFAULT_MODEL
        self.timeout = timeout if timeout is not None else float(os.environ.get("LLM_TIMEOUT_S", "120"))
        self.reasoning_effort = reasoning_effort
        self._local = threading.local()
        # Same precedence as the policy eval scripts: LLM_API_KEY wins, GROQ_API_KEY is the fallback.
        self._secret = (os.environ.get("LLM_API_KEY") or os.environ.get("GROQ_API_KEY") or "").strip()
        self._headers = {"Authorization": f"Bearer {self._secret}"} if self._secret else {}

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
        with obs.span(f"llm.{tag or 'chat'}", kind="LLM", **{"llm.model_name": self.model, "llm.provider": "vllm-self-hosted",
                                                              "llm.invocation_parameters": json.dumps({"max_tokens": max_tokens, "temperature": temperature,
                                                                                                       "reasoning_effort": self.reasoning_effort}),
                                                              "input.value": obs.content(user), "llm.system": obs.content(system)}) as sp:
            parts = []
            try:
                for d in self._stream(system, user, max_tokens, temperature, tag, deadline):
                    parts.append(d)
                    yield d
            finally:
                c = self.calls[-1] if self.calls else {}
                obs.set_attrs(sp, **{"llm.token_count.prompt": c.get("prompt_tokens"), "llm.token_count.completion": c.get("completion_tokens"),
                                     "llm.token_count.total": (c.get("prompt_tokens") or 0) + (c.get("completion_tokens") or 0),
                                     "llm.ttft_ms": round(c["ttft_s"] * 1000, 1) if c.get("ttft_s") is not None else None,
                                     "llm.latency_ms": round(c.get("total_s", 0) * 1000, 1), "llm.error": c.get("error"),
                                     "output.value": obs.content("".join(parts))})

    def _stream(self, system: str, user: str, max_tokens: int, temperature: float, tag: str, deadline: float | None):
        body = {"model": self.model, "messages": [{"role": "system", "content": system},
                                                  {"role": "user", "content": user}],
                "max_tokens": max_tokens, "temperature": temperature, "stream": True,
                "stream_options": {"include_usage": True},
                "reasoning_effort": self.reasoning_effort}
        t0 = time.perf_counter()
        ttft = first_any = None
        usage = {}
        last_err = None
        yielded = False
        rec = {"tag": tag}

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
                            raise LLMError(f"HTTP {r.status_code}: {self._redact(r.text[:200])}")
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
                except (requests.RequestException, LLMError) as e:
                    last_err = e
                    rem = left()
                    if rem is not None and rem <= 1.5 * (attempt + 1):
                        raise LLMError(f"deadline exceeded ({type(e).__name__})")  # no time left for a retry
                    if yielded:
                        raise LLMError(str(e))  # cannot un-say streamed text
                    ttft = first_any = None
                    time.sleep(1.5 * (attempt + 1))
            else:
                raise LLMError(str(last_err))
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


def parse_json(txt: str) -> dict:
    txt = txt.strip()
    m = re.search(r"\{.*\}", txt, re.S)
    if not m:
        raise LLMError(f"no JSON object in LLM output: {txt[:120]!r}")
    try:
        return json.loads(m.group(0))
    except ValueError as e:
        raise LLMError(f"bad JSON from LLM: {e}")
