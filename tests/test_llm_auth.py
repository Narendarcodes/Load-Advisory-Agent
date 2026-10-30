"""ChatLLM bearer auth: LLM_API_KEY (or the selected provider's key) is sent to OpenAI-compatible endpoints."""
import json

import pytest

from loan_advisory.agent import llm as L
from loan_advisory.agent.llm import LLMError

SECRET = "synthetic-test-key-not-a-real-credential"


def _sse(*contents):
    out = [f"data: {json.dumps({'choices': [{'delta': {'content': c}}]})}" for c in contents]
    out += ["data: [DONE]"]
    return out


class _Resp:
    def __init__(self, lines, status=200, text=""):
        self.lines, self.status_code, self.text = lines, status, text

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False

    def iter_lines(self, decode_unicode=True):
        return iter(self.lines)


def _capture(monkeypatch, resp):
    seen = {}

    def fake_post(url, json=None, stream=None, timeout=None, headers=None):
        seen.update(url=url, headers=headers, body=json)
        return resp
    monkeypatch.setattr(L.requests, "post", fake_post)
    return seen


def _clear(monkeypatch):
    for name in ("LLM_API_KEY", "GROQ_API_KEY", "OMNIROUTE_API_KEY", "LLM_PROVIDER"):
        monkeypatch.delenv(name, raising=False)


def test_llm_api_key_is_sent_as_bearer(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setenv("LLM_API_KEY", SECRET)
    seen = _capture(monkeypatch, _Resp(_sse("ok")))
    c = L.ChatLLM(base="https://api.groq.com/openai/v1", model="openai/gpt-oss-120b")
    assert c.chat("s", "u") == "ok"
    assert seen["headers"] == {"Authorization": f"Bearer {SECRET}"}
    assert seen["body"]["model"] == "openai/gpt-oss-120b"
    assert SECRET not in json.dumps(c.calls)


def test_provider_key_is_the_fallback(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setenv("LLM_PROVIDER", "groq")
    monkeypatch.setenv("GROQ_API_KEY", SECRET)
    seen = _capture(monkeypatch, _Resp(_sse("ok")))
    assert L.ChatLLM(base="http://x/v1").chat("s", "u") == "ok"
    assert seen["headers"] == {"Authorization": f"Bearer {SECRET}"}


def test_omniroute_key_is_used_for_the_local_gateway(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setenv("OMNIROUTE_API_KEY", SECRET)
    seen = _capture(monkeypatch, _Resp(_sse("ok")))
    L.ChatLLM().chat("s", "u")
    assert seen["headers"] == {"Authorization": f"Bearer {SECRET}"}


def test_llm_api_key_takes_precedence(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setenv("LLM_API_KEY", "primary")
    monkeypatch.setenv("GROQ_API_KEY", "fallback")
    seen = _capture(monkeypatch, _Resp(_sse("ok")))
    L.ChatLLM(base="http://x/v1").chat("s", "u")
    assert seen["headers"] == {"Authorization": "Bearer primary"}


def test_missing_credentials_send_no_authorization_header(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setenv("LLM_API_KEY", "")
    monkeypatch.setenv("GROQ_API_KEY", "")
    seen = _capture(monkeypatch, _Resp(_sse("ok")))
    assert L.ChatLLM(base="http://127.0.0.1:8001/v1").chat("s", "u") == "ok"
    assert seen["headers"] == {}


def test_authentication_failure_raises_and_redacts_the_key(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setenv("LLM_PROVIDER", "groq")
    monkeypatch.setenv("GROQ_API_KEY", SECRET)
    monkeypatch.setattr(L.time, "sleep", lambda _s: None)
    _capture(monkeypatch, _Resp([], status=401, text=f"invalid api key: {SECRET}"))
    c = L.ChatLLM(base="https://api.groq.com/openai/v1", retries=1)
    with pytest.raises(LLMError) as exc:
        c.chat("s", "u")
    assert "HTTP 401" in str(exc.value)
    assert SECRET not in str(exc.value) and "***" in str(exc.value)
    assert SECRET not in json.dumps(c.calls)


def test_api_error_raises_llm_error_without_the_key(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setenv("LLM_API_KEY", SECRET)
    monkeypatch.setattr(L.time, "sleep", lambda _s: None)
    _capture(monkeypatch, _Resp([], status=500, text="upstream failure"))
    c = L.ChatLLM(base="http://x/v1", retries=1)
    with pytest.raises(LLMError, match="HTTP 500"):
        c.chat("s", "u")
    assert SECRET not in json.dumps(c.calls)
