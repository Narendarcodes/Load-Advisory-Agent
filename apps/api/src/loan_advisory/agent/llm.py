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

DEFAULT_BASE = os.environ.get("LLM_BASE", "http://127.0.0.1:8001/v1")
DEFAULT_MODEL = os.environ.get("LLM_MODEL", "llm")


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
        body = {"model": self.model, "messages": [{"role": "system", "content": system},
                                                  {"role": "user", "content": user}],
                "max_tokens": max_tokens, "temperature": temperature, "stream": True,
                "reasoning_effort": self.reasoning_effort}
        t0 = time.perf_counter()
        ttft = None
        first_any = None
        parts: list[str] = []
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
                            delta = json.loads(data)["choices"][0].get("delta", {})
                        except (ValueError, KeyError, IndexError):
                            continue
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
                           "total_s": round(total, 3)})
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
