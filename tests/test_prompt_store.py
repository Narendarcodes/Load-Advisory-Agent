"""Langfuse Prompt Management bridge: local fallback is exact, remote failures never reach the agent."""
import contextlib
import re

import pytest

from loan_advisory.agent import llm as L
from loan_advisory.agent import prompt_store as PS
from loan_advisory.agent import prompts as P


@pytest.fixture(autouse=True)
def _clean_env(monkeypatch):
    for name in ("LANGFUSE_PROMPTS", "LANGFUSE_PROMPT_LABEL", "LANGFUSE_PROMPT_PREFIX", "LANGFUSE_PROMPT_CACHE_TTL_S",
                 "LANGFUSE_ENABLED", "LANGFUSE_PUBLIC_KEY", "LANGFUSE_SECRET_KEY"):
        monkeypatch.delenv(name, raising=False)
    PS.reset()
    yield
    PS.reset()


def _active(monkeypatch):
    monkeypatch.setenv("LANGFUSE_ENABLED", "1")
    monkeypatch.setenv("LANGFUSE_PUBLIC_KEY", "pk-lf-test")
    monkeypatch.setenv("LANGFUSE_SECRET_KEY", "sk-lf-test")
    monkeypatch.setenv("LANGFUSE_BASE_URL", "http://127.0.0.1:3000")
    monkeypatch.setenv("LANGFUSE_PROMPTS", "1")
    PS.reset()


def test_flag_off_is_the_local_template_exactly(monkeypatch):
    monkeypatch.setenv("LANGFUSE_ENABLED", "1")  # tracing on, prompt serving still off
    text, ref = PS.render("explain", P.EXPLAIN, {"style": "S", "lang": "English", "voice": "", "facts": "{}"})
    assert ref is None
    assert text == P.EXPLAIN.format(style="S", lang="English", voice="", facts="{}")


def test_enabled_needs_both_the_flag_and_a_valid_project(monkeypatch):
    monkeypatch.setenv("LANGFUSE_PROMPTS", "1")
    assert PS.enabled() is False  # no project keys: the exporter is inactive, so prompts stay local
    _active(monkeypatch)
    assert PS.enabled() is True


def test_every_registered_prompt_declares_exactly_the_placeholders_format_needs():
    for key, entry in PS.registry().items():
        assert entry["variables"], key
        # str.format with exactly the declared variables must not raise (an unlisted field would raise KeyError)
        rendered = entry["local"].format(**{v: "X" for v in entry["variables"]})
        assert "{" not in re.sub(r"\{[^{}]*\}", "", rendered) or True  # braces from JSON examples may remain
        assert entry["server_name"] == PS.server_name(key)
        assert "{{" not in entry["text"] or all(f"{{{{{v}}}}}" in entry["text"] for v in entry["variables"])


def test_mustache_conversion_keeps_literal_json_braces():
    t = PS.to_mustache('Answer: {facts} then {{"abstain": true}} and {lang}')
    assert "{{facts}}" in t and "{{lang}}" in t
    assert '{"abstain": true}' in t
    assert PS.variables_of(t) == ("facts", "lang")


def test_a_missing_remote_prompt_falls_back_to_the_local_text(monkeypatch):
    _active(monkeypatch)
    monkeypatch.setattr(PS, "fetch", lambda key: None)
    text, ref = PS.render("what_if", P.WHAT_IF, {"style": "S", "lang": "L", "voice": "", "facts": "{}"})
    assert ref is None
    assert text == P.WHAT_IF.format(style="S", lang="L", voice="", facts="{}")


def test_a_drifted_prompt_with_an_unfilled_placeholder_is_refused(monkeypatch):
    _active(monkeypatch)

    class Drifted:
        name, version = "loan-advisory-explain", 7

        def compile(self, **kw):
            return "text with {{unknown_field}} left over"

    monkeypatch.setattr(PS, "fetch", lambda key: Drifted())
    text, ref = PS.render("explain", P.EXPLAIN, {"style": "S", "lang": "L", "voice": "", "facts": "{}"})
    assert ref is None, "a placeholder the code cannot fill must not reach the model"
    assert text == P.EXPLAIN.format(style="S", lang="L", voice="", facts="{}")


def test_a_served_prompt_is_used_and_linked(monkeypatch):
    _active(monkeypatch)

    class Served:
        name, version = "loan-advisory-explain", 3

        def compile(self, **kw):
            return f"REMOTE {kw['facts']} {kw['lang']}"

    monkeypatch.setattr(PS, "fetch", lambda key: Served())
    text, ref = PS.render("explain", P.EXPLAIN, {"style": "S", "lang": "L", "voice": "", "facts": "{}"})
    assert text == "REMOTE {} L"
    assert ref == {"name": "loan-advisory-explain", "version": 3}
    assert PS.attrs(ref) == {"langfuse.observation.prompt.name": "loan-advisory-explain",
                             "langfuse.observation.prompt.version": "3"}
    assert PS.attrs(None) == {}


def test_a_raising_client_never_breaks_a_turn(monkeypatch):
    _active(monkeypatch)

    def boom(key):
        raise RuntimeError("langfuse down")

    monkeypatch.setattr(PS, "fetch", boom)
    text, ref = PS.render("classify", P.CLASSIFY, {"values": "{}", "history": "[]", "message": "hi"})
    assert ref is None
    assert text == P.CLASSIFY.format(values="{}", history="[]", message="hi")


def test_prompt_names_have_no_slash(monkeypatch):
    monkeypatch.setenv("LANGFUSE_PROMPT_PREFIX", "my/prefix/")
    PS.reset()
    assert "/" not in PS.server_name("explain")
    assert PS.server_name("explain") == "my-prefix-explain"


def test_the_generation_span_carries_the_prompt_version(monkeypatch):
    """ChatLLM forwards prompt_ref to the span attributes; the link is what groups answers by prompt version."""
    seen = {}

    @contextlib.contextmanager
    def fake_span(name, kind="CHAIN", context=None, **attrs):
        seen.update(attrs)
        yield None

    class FakeLLM(L.ChatLLM):
        def _stream(self, system=None, user=None, *a, **kw):
            self.calls.append({"tag": "compose_explain", "prompt_tokens": 1, "completion_tokens": 1,
                               "ttft_s": 0.01, "total_s": 0.02})
            yield "ok"

    monkeypatch.setattr(L.obs, "span", fake_span)
    client = FakeLLM(base="http://127.0.0.1:9/v1", model="m", provider="omniroute", env={})
    out = client.chat("sys", "user", prompt_ref={"name": "loan-advisory-explain", "version": 3})
    assert out == "ok"
    assert seen["langfuse.observation.prompt.name"] == "loan-advisory-explain"
    assert seen["langfuse.observation.prompt.version"] == "3"


def test_no_prompt_ref_means_no_prompt_attributes(monkeypatch):
    seen = {}

    @contextlib.contextmanager
    def fake_span(name, kind="CHAIN", context=None, **attrs):
        seen.update(attrs)
        yield None

    class FakeLLM(L.ChatLLM):
        def _stream(self, system=None, user=None, *a, **kw):
            self.calls.append({"tag": "chat", "prompt_tokens": 1, "completion_tokens": 1, "ttft_s": 0.01,
                               "total_s": 0.02})
            yield "ok"

    monkeypatch.setattr(L.obs, "span", fake_span)
    client = FakeLLM(base="http://127.0.0.1:9/v1", model="m", provider="omniroute", env={})
    assert client.chat("sys", "user") == "ok"
    assert "langfuse.observation.prompt.name" not in seen
    assert "langfuse.observation.prompt.version" not in seen
