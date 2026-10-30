"""Groq / OmniRoute provider configuration for ChatLLM.

Everything here is offline: `requests.post` is patched, so the tests prove URL, model, headers,
streaming, retry and failure classification without a live provider or a local inference server.
"""
import json

import pytest

from loan_advisory.agent import llm as L

SECRET = "synthetic-provider-key-not-a-real-credential"


def _sse(*contents, usage=None):
    out = [f"data: {json.dumps({'choices': [{'delta': {'content': c}}]})}" for c in contents]
    if usage:
        out.append(f"data: {json.dumps({'choices': [], 'usage': usage})}")
    out.append("data: [DONE]")
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


class _Calls:
    def __init__(self, responses):
        self.responses = list(responses)
        self.seen = []

    def __call__(self, url, json=None, stream=None, timeout=None, headers=None):
        self.seen.append({"url": url, "body": json, "headers": headers})
        item = self.responses[min(len(self.seen) - 1, len(self.responses) - 1)]
        if isinstance(item, Exception):
            raise item
        return item


def _patch(monkeypatch, *responses):
    calls = _Calls(responses)
    monkeypatch.setattr(L.requests, "post", calls)
    monkeypatch.setattr(L.time, "sleep", lambda _s: None)
    return calls


# ------------------------------------------------------------------ selection
def test_groq_is_selected_from_the_environment():
    cfg = L.provider_from_env({"LLM_PROVIDER": "groq", "LLM_MODEL": "openai/gpt-oss-120b",
                               "GROQ_API_KEY": SECRET})
    assert (cfg.provider, cfg.base, cfg.model, cfg.api_key) == (
        "groq", "https://api.groq.com/openai/v1", "openai/gpt-oss-120b", SECRET)


def test_omniroute_is_the_default_and_keeps_its_gateway_url():
    cfg = L.provider_from_env({"LLM_MODEL": "gpt-oss-120b"})
    assert (cfg.provider, cfg.base) == ("omniroute", "http://127.0.0.1:20128/v1")
    assert cfg.api_key == ""


def test_omniroute_base_url_override_and_generic_base_override():
    assert L.provider_from_env({"LLM_MODEL": "m", "OMNIROUTE_BASE_URL": "http://127.0.0.1:9000/v1"}).base == \
        "http://127.0.0.1:9000/v1"
    # The generic override still lets an existing deployment keep pointing at any compatible endpoint.
    assert L.provider_from_env({"LLM_MODEL": "m", "LLM_PROVIDER": "groq",
                                "LLM_BASE": "https://gateway.internal/v1"}).base == "https://gateway.internal/v1"


def test_provider_name_is_case_insensitive_and_validated():
    assert L.provider_from_env({"LLM_PROVIDER": "  GROQ ", "LLM_MODEL": "m"}).provider == "groq"
    with pytest.raises(L.LLMConfigError, match="LLM_PROVIDER"):
        L.provider_from_env({"LLM_PROVIDER": "vllm", "LLM_MODEL": "m"})


def test_runtime_wiring_requires_an_explicit_model():
    with pytest.raises(L.LLMConfigError, match="LLM_MODEL"):
        L.ChatLLM.from_env(env={"LLM_PROVIDER": "groq", "GROQ_API_KEY": SECRET})


def test_ad_hoc_client_keeps_a_lenient_model_default():
    # Scripts/tests that pass their own base must not be forced through the runtime gate.
    assert L.ChatLLM(base="http://x/v1", env={}).model == "llm"


def test_key_precedence_is_generic_then_provider():
    assert L.provider_from_env({"LLM_MODEL": "m", "LLM_API_KEY": "generic",
                                "OMNIROUTE_API_KEY": "provider"}).api_key == "generic"
    assert L.provider_from_env({"LLM_MODEL": "m", "OMNIROUTE_API_KEY": "provider"}).api_key == "provider"
    # A Groq key is never sent to the OmniRoute gateway.
    assert L.provider_from_env({"LLM_MODEL": "m", "GROQ_API_KEY": "groq-only"}).api_key == ""


# ------------------------------------------------------------------ requests
def test_groq_request_carries_its_url_model_and_bearer(monkeypatch):
    calls = _patch(monkeypatch, _Resp(_sse("hello", usage={"prompt_tokens": 4, "completion_tokens": 2})))
    c = L.ChatLLM(env={"LLM_PROVIDER": "groq", "LLM_MODEL": "openai/gpt-oss-120b", "GROQ_API_KEY": SECRET})
    assert c.chat("system", "user") == "hello"
    call = calls.seen[0]
    assert call["url"] == "https://api.groq.com/openai/v1/chat/completions"
    assert call["headers"] == {"Authorization": f"Bearer {SECRET}"}
    assert call["body"]["model"] == "openai/gpt-oss-120b"
    assert call["body"]["stream"] is True
    assert c.calls[-1]["completion_tokens"] == 2
    assert SECRET not in json.dumps(c.calls)


def test_omniroute_request_uses_the_gateway_without_a_key(monkeypatch):
    calls = _patch(monkeypatch, _Resp(_sse("hi")))
    c = L.ChatLLM(env={"LLM_MODEL": "route/default"})
    assert c.chat("s", "u") == "hi"
    assert calls.seen[0]["url"] == "http://127.0.0.1:20128/v1/chat/completions"
    assert calls.seen[0]["headers"] == {}
    assert calls.seen[0]["body"]["model"] == "route/default"


def test_reasoning_effort_and_stream_usage_can_be_omitted_for_routed_models(monkeypatch):
    calls = _patch(monkeypatch, _Resp(_sse("ok")))
    c = L.ChatLLM(env={"LLM_MODEL": "m", "LLM_REASONING_EFFORT": "", "LLM_STREAM_USAGE": "0"})
    c.chat("s", "u")
    body = calls.seen[0]["body"]
    assert "reasoning_effort" not in body and "stream_options" not in body


def test_streaming_yields_every_delta_in_order(monkeypatch):
    _patch(monkeypatch, _Resp(_sse("one ", "two ", "three")))
    c = L.ChatLLM(env={"LLM_MODEL": "m"})
    assert list(c.chat_stream("s", "u", tag="compose_explain")) == ["one ", "two ", "three"]
    assert c.calls[-1]["tag"] == "compose_explain" and c.calls[-1]["ttft_s"] is not None


def test_json_mode_still_parses_a_streamed_object(monkeypatch):
    _patch(monkeypatch, _Resp(_sse('{"intent": ', '"policy"}')))
    c = L.ChatLLM(env={"LLM_MODEL": "m"})
    assert c.chat_json("s", "u") == {"intent": "policy"}


# ------------------------------------------------------------------ failures
def test_unauthorized_is_not_retried_and_redacts_the_key(monkeypatch):
    calls = _patch(monkeypatch, _Resp([], status=401, text=f"invalid api key {SECRET}"))
    c = L.ChatLLM(env={"LLM_PROVIDER": "groq", "LLM_MODEL": "m", "GROQ_API_KEY": SECRET})
    with pytest.raises(L.LLMError, match="HTTP 401"):
        c.chat("s", "u")
    assert len(calls.seen) == 1
    assert SECRET not in c.calls[-1]["error"] and "***" in c.calls[-1]["error"]


def test_rate_limit_is_retried_then_reported(monkeypatch):
    calls = _patch(monkeypatch, _Resp([], status=429, text="slow down"), _Resp(_sse("recovered")))
    c = L.ChatLLM(env={"LLM_MODEL": "m"}, retries=3)
    assert c.chat("s", "u") == "recovered"
    assert len(calls.seen) == 2


def test_unavailable_provider_becomes_a_classified_llm_error(monkeypatch):
    calls = _patch(monkeypatch, L.requests.ConnectionError("connection refused"))
    c = L.ChatLLM(env={"LLM_MODEL": "m"}, retries=2)
    with pytest.raises(L.LLMError, match="connection refused"):
        c.chat("s", "u")
    assert len(calls.seen) == 2
    assert c.calls[-1]["error"]


def test_malformed_lines_are_skipped_but_empty_completions_fail(monkeypatch):
    _patch(monkeypatch, _Resp(["data: not-json", "event: ping", "data: [DONE]"]))
    c = L.ChatLLM(env={"LLM_MODEL": "m"})
    with pytest.raises(L.LLMError, match="no content"):
        c.chat("s", "u")


def test_no_request_ever_goes_to_a_local_vllm_default(monkeypatch):
    calls = _patch(monkeypatch, _Resp(_sse("ok")))
    L.ChatLLM(env={"LLM_PROVIDER": "groq", "LLM_MODEL": "m", "GROQ_API_KEY": SECRET}).chat("s", "u")
    assert [s["url"] for s in calls.seen] == ["https://api.groq.com/openai/v1/chat/completions"]
    assert not any(":8001" in s["url"] for s in calls.seen)
