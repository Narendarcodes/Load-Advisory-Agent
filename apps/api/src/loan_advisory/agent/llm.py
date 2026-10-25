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


class ChatLLM:
    def __init__(self, base: str | None = None, model: str | None = None, timeout: float = 120.0,
                 reasoning_effort: str = "low"):
        self.base = (base or DEFAULT_BASE).rstrip("/")
        self.model = model or DEFAULT_MODEL
        self.timeout = timeout
        self.reasoning_effort = reasoning_effort
        self._local = threading.local()

    @property
    def calls(self) -> list[dict]:
        """Per-thread call timing log (one graph turn runs in one thread; cleared by the graph per turn)."""
        if not hasattr(self._local, "calls"):
            self._local.calls = []
        return self._local.calls

    def chat(self, system: str, user: str, max_tokens: int = 900, temperature: float = 0.0, tag: str = "") -> str:
        with obs.span(f"llm.{tag or 'chat'}", kind="LLM", **{"llm.model_name": self.model, "llm.provider": "vllm-self-hosted",
                                                              "llm.invocation_parameters": json.dumps({"max_tokens": max_tokens, "temperature": temperature,
                                                                                                       "reasoning_effort": self.reasoning_effort}),
                                                              "input.value": obs.content(user), "llm.system": obs.content(system)}) as sp:
            out = self._chat(system, user, max_tokens, temperature, tag)
            c = self.calls[-1]
            obs.set_attrs(sp, **{"llm.token_count.prompt": c.get("prompt_tokens"), "llm.token_count.completion": c.get("completion_tokens"),
                                 "llm.token_count.total": (c.get("prompt_tokens") or 0) + (c.get("completion_tokens") or 0),
                                 "llm.ttft_ms": round(c["ttft_s"] * 1000, 1) if c.get("ttft_s") is not None else None,
                                 "llm.latency_ms": round(c["total_s"] * 1000, 1), "output.value": obs.content(out)})
            return out

    def _chat(self, system: str, user: str, max_tokens: int, temperature: float, tag: str) -> str:
        body = {"model": self.model, "messages": [{"role": "system", "content": system},
                                                  {"role": "user", "content": user}],
                "max_tokens": max_tokens, "temperature": temperature, "stream": True,
                "stream_options": {"include_usage": True},
                "reasoning_effort": self.reasoning_effort}
        t0 = time.perf_counter()
        ttft = None
        first_any = None
        parts: list[str] = []
        usage = {}
        last_err = None
        for attempt in range(3):
            try:
                with requests.post(f"{self.base}/chat/completions", json=body, stream=True, timeout=self.timeout) as r:
                    if r.status_code >= 400:
                        raise LLMError(f"HTTP {r.status_code}: {r.text[:200]}")
                    for line in r.iter_lines(decode_unicode=True):
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
                            parts.append(c)
                break
            except (requests.RequestException, LLMError) as e:
                last_err = e
                parts, ttft, first_any = [], None, None
                time.sleep(1.5 * (attempt + 1))
        else:
            raise LLMError(str(last_err))
        total = time.perf_counter() - t0
        self.calls.append({"tag": tag, "ttft_s": round(ttft, 3) if ttft is not None else None,
                           "first_token_any_s": round(first_any, 3) if first_any is not None else None,
                           "total_s": round(total, 3), "prompt_tokens": usage.get("prompt_tokens"),
                           "completion_tokens": usage.get("completion_tokens")})
        with _STATS_LOCK:
            STATS["calls"] += 1
            STATS["prompt_tokens"] += usage.get("prompt_tokens") or 0
            STATS["completion_tokens"] += usage.get("completion_tokens") or 0
        return "".join(parts).strip()

    def chat_json(self, system: str, user: str, max_tokens: int = 900, tag: str = "") -> dict:
        txt = self.chat(system, user, max_tokens=max_tokens, tag=tag)
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
