"""SARAL_LLM_* answer-generator selection and the cross-provider fallback chain (offline: requests.post is patched).

River AI chain (SARAL_LLM_PROVIDER=river): deepseek-ai/DeepSeek-V4.1-Flash, then GLM-5.3 on River, then OmniRoute
claude-sonnet-4-6. Since 2026-11-04 13:42 IST the default is OmniRoute antigravity/gemini-3.8-flash with OmniRoute
claude-sonnet-4-6 as its fallback (owner decision; River returned 402), covered at the end of this file.
"""
import json

import pytest

from loan_advisory.agent import llm as L

KEY = "synthetic-river-key-not-a-real-credential"


def _sse(*contents):
    return [f"data: {json.dumps({'choices': [{'delta': {'content': c}}]})}" for c in contents] + ["data: [DONE]"]


class _Resp:
    def __init__(self, lines, status=200, text=""):
        self.lines, self.status_code, self.text = lines, status, text

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False

    def iter_lines(self, decode_unicode=True):
        return iter(self.lines)


def _patch(monkeypatch, route):
    seen = []

    def post(url, json=None, stream=None, timeout=None, headers=None):
        seen.append({"url": url, "model": json["model"], "body": json, "headers": headers})
        return route(url, json["model"])
    monkeypatch.setattr(L.requests, "post", post)
    monkeypatch.setattr(L.time, "sleep", lambda _s: None)
    return seen


# ------------------------------------------------------------------ selection
def test_river_is_selectable_with_a_default_model():
    cfg = L.provider_from_env({"SARAL_LLM_PROVIDER": "river", "RIVER_API_KEY": KEY}, require_model=True)
    assert (cfg.provider, cfg.base, cfg.model, cfg.api_key) == (
        "river", "https://api.river.ai/v1", "deepseek-ai/DeepSeek-V4.1-Flash", KEY)


def test_deepseek_on_river_omits_reasoning_effort_and_glm_keeps_low():
    # DeepSeek-V4.1-Flash starts reasoning when reasoning_effort is sent; GLM-5.3 cannot disable it, low is fastest.
    assert L.provider_from_env({"SARAL_LLM_PROVIDER": "river"}, require_model=True).reasoning_effort is None
    assert L.provider_from_env({"SARAL_LLM_MODEL": "GLM-5.3"}).reasoning_effort == "low"
    assert L.provider_from_env({"SARAL_LLM_MODEL": "GLM-5.3", "SARAL_LLM_REASONING_EFFORT": "high"}).reasoning_effort == "high"


def test_saral_llm_env_wins_over_the_generic_llm_env():
    env = {"LLM_PROVIDER": "groq", "LLM_MODEL": "openai/gpt-oss-120b", "SARAL_LLM_PROVIDER": "omniroute",
           "SARAL_LLM_MODEL": "antigravity/claude-sonnet-4-6", "SARAL_LLM_BASE_URL": "https://gw.example/v1/"}
    cfg = L.provider_from_env(env, require_model=True)
    assert (cfg.provider, cfg.model, cfg.base) == ("omniroute", "antigravity/claude-sonnet-4-6", "https://gw.example/v1")


def test_omniroute_sonnet_is_still_a_supported_primary():
    llm = L.ChatLLM.from_env(env={"SARAL_LLM_PROVIDER": "omniroute", "SARAL_LLM_MODEL": "antigravity/claude-sonnet-4-6",
                                  "SARAL_LLM_FALLBACK_MODEL": ""})
    assert isinstance(llm, L.ChatLLM) and (llm.provider, llm.model) == ("omniroute", "antigravity/claude-sonnet-4-6")


def test_river_chain_is_deepseek_then_glm_then_omniroute_sonnet():
    llm = L.ChatLLM.from_env(env={"SARAL_LLM_PROVIDER": "river", "RIVER_API_KEY": KEY})
    assert isinstance(llm, L.FallbackChatLLM)
    assert [(c.provider, c.model) for c in llm.clients] == [
        ("river", "deepseek-ai/DeepSeek-V4.1-Flash"), ("river", "GLM-5.3"), ("omniroute", "antigravity/claude-sonnet-4-6")]
    assert llm.model == "deepseek-ai/DeepSeek-V4.1-Flash" and llm.provider == "river"
    assert llm.clients[2].api_key_set is False  # the River key is never sent to another provider


def test_fallback_spec_parsing_accepts_provider_alias_or_url():
    env = {"SARAL_LLM_PROVIDER": "river", "SARAL_LLM_FALLBACK_MODEL": "GLM-5.3, m2@groq , m3@https://other.example/v1", "GROQ_API_KEY": "g"}
    llm = L.ChatLLM.from_env(env=env)
    assert [(c.provider, c.model, c.base) for c in llm.clients[1:]] == [
        ("river", "GLM-5.3", "https://api.river.ai/v1"), ("groq", "m2", "https://api.groq.com/openai/v1"),
        ("river", "m3", "https://other.example/v1")]


def test_unknown_provider_still_fails_loudly():
    with pytest.raises(L.LLMConfigError):
        L.provider_from_env({"SARAL_LLM_PROVIDER": "vllm"})


# ------------------------------------------------------------------ chain behaviour
def test_primary_answers_without_touching_the_fallbacks(monkeypatch):
    seen = _patch(monkeypatch, lambda url, m: _Resp(_sse("नमस्ते")))
    llm = L.ChatLLM.from_env(env={"SARAL_LLM_PROVIDER": "river", "RIVER_API_KEY": KEY})
    assert llm.chat("s", "u", tag="compose") == "नमस्ते"
    assert [s["model"] for s in seen] == ["deepseek-ai/DeepSeek-V4.1-Flash"]
    assert "reasoning_effort" not in seen[0]["body"]
    assert seen[0]["headers"] == {"Authorization": f"Bearer {KEY}"}
    assert llm.fallback_uses == {}


def test_a_failing_primary_falls_back_in_order_and_is_counted(monkeypatch):
    def route(url, m):
        return _Resp([], 502, "bad gateway") if m != "GLM-5.3" else _Resp(_sse("ok"))
    seen = _patch(monkeypatch, route)
    llm = L.ChatLLM.from_env(env={"SARAL_LLM_PROVIDER": "river", "RIVER_API_KEY": KEY, "LLM_RETRIES": "1"})
    assert llm.chat("s", "u", tag="compose") == "ok"
    assert [s["model"] for s in seen] == ["deepseek-ai/DeepSeek-V4.1-Flash", "GLM-5.3"]
    assert seen[1]["body"]["reasoning_effort"] == "low"
    assert llm.fallback_uses == {"GLM-5.3": 1}
    assert [c.get("model") for c in llm.calls[-2:]] == ["deepseek-ai/DeepSeek-V4.1-Flash", "GLM-5.3"]


def test_last_fallback_is_omniroute_sonnet_and_all_down_raises(monkeypatch):
    seen = _patch(monkeypatch, lambda url, m: _Resp([], 503, "down"))
    llm = L.ChatLLM.from_env(env={"SARAL_LLM_PROVIDER": "river", "RIVER_API_KEY": KEY, "LLM_RETRIES": "1"})
    with pytest.raises(L.LLMError):
        llm.chat("s", "u")
    assert seen[-1]["model"] == "antigravity/claude-sonnet-4-6"
    assert seen[-1]["url"].startswith("http://127.0.0.1:20128/v1")
    assert KEY not in json.dumps(seen[-1]["headers"] or {})


def test_deadline_errors_do_not_fall_back(monkeypatch):
    seen = _patch(monkeypatch, lambda url, m: _Resp(_sse("late")))
    llm = L.ChatLLM.from_env(env={"SARAL_LLM_PROVIDER": "river", "RIVER_API_KEY": KEY})
    with pytest.raises(L.LLMError, match="deadline"):
        llm.chat("s", "u", deadline=0.0)
    assert seen == []


def test_chat_json_goes_through_the_chain(monkeypatch):
    def route(url, m):
        return _Resp([], 500, "x") if m.startswith("deepseek") else _Resp(_sse('{"intent": "policy"}'))
    _patch(monkeypatch, route)
    llm = L.ChatLLM.from_env(env={"SARAL_LLM_PROVIDER": "river", "RIVER_API_KEY": KEY, "LLM_RETRIES": "1"})
    assert llm.chat_json("s", "u") == {"intent": "policy"}


# ------------------------------------------------------------------ default (OmniRoute Gemini 3.8 Flash)
def test_default_is_omniroute_gemini_flash_then_omniroute_sonnet():
    cfg = L.provider_from_env({}, require_model=True)
    assert (cfg.provider, cfg.base, cfg.model) == ("omniroute", "http://127.0.0.1:20128/v1", "antigravity/gemini-3.8-flash")
    llm = L.ChatLLM.from_env(env={"OMNIROUTE_BASE_URL": "https://gw.example/v1", "RIVER_API_KEY": KEY})
    assert isinstance(llm, L.FallbackChatLLM)
    assert [(c.provider, c.model, c.base) for c in llm.clients] == [
        ("omniroute", "antigravity/gemini-3.8-flash", "https://gw.example/v1"),
        ("omniroute", "antigravity/claude-sonnet-4-6", "https://gw.example/v1")]
    assert not any(c.api_key_set for c in llm.clients)  # the River key never goes to OmniRoute


def test_default_chain_falls_back_to_sonnet_and_is_counted(monkeypatch):
    seen = _patch(monkeypatch, lambda url, m: _Resp([], 502, "x") if "gemini" in m else _Resp(_sse("ok")))
    llm = L.ChatLLM.from_env(env={"LLM_RETRIES": "1"})
    assert llm.chat("s", "u", tag="compose") == "ok"
    assert [s["model"] for s in seen] == ["antigravity/gemini-3.8-flash", "antigravity/claude-sonnet-4-6"]
    assert llm.fallback_uses == {"antigravity/claude-sonnet-4-6": 1}


def test_explicit_omniroute_model_without_fallback_env_dedups_the_default_chain():
    llm = L.ChatLLM.from_env(env={"SARAL_LLM_PROVIDER": "omniroute", "SARAL_LLM_MODEL": "antigravity/claude-sonnet-4-6"})
    assert isinstance(llm, L.ChatLLM) and llm.model == "antigravity/claude-sonnet-4-6"
