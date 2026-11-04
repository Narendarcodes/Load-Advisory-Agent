"""Intent classification has its own fast client (SARAL_INTENT_PROVIDER / SARAL_INTENT_MODEL), with an automatic fallback
to a fast model on the answer gateway (SARAL_INTENT_FALLBACK_MODEL) on any error or 429, then the deterministic rules.
The answer model is untouched; the English classifier budget is 8 s, Hindi/Telugu unchanged."""
import pytest

from loan_advisory.agent import settings as S
from loan_advisory.agent.graph import AdvisoryAgent
from loan_advisory.agent.intent_llm import (DEFAULT_GROQ_BACKUP_MODEL, DEFAULT_GROQ_INTENT_MODEL, DEFAULT_INTENT_FALLBACK_MODEL, FallbackLLM,
                                            build_intent_llm)
from loan_advisory.agent.llm import ChatLLM, LLMError
from tests.test_agent_graph import ScriptedLLM, agent_for, ask

GW = "http://gw.invalid/v1"


def _main():
    return ChatLLM(base=GW, model="answer/model", provider="omniroute", api_key="k")


def test_budgets_english_8s_indic_unchanged():
    s = S.AgentSettings()
    assert s.classify_budget_for("en") == 8.0
    assert s.classify_budget_for("hi") == 14.0 and s.classify_budget_for("te") == 14.0


def test_intent_settings_from_env():
    s = S.AgentSettings.from_env({"SARAL_INTENT_PROVIDER": "groq", "SARAL_INTENT_MODEL": "x/fast",
                                  "SARAL_INTENT_FALLBACK_MODEL": ""})
    assert (s.intent_provider, s.intent_model, s.intent_fallback_model) == ("groq", "x/fast", "")
    d = S.AgentSettings.from_env({})
    assert S.AgentSettings.from_env({"SARAL_INTENT_GROQ_BACKUP": ""}).intent_groq_backup == ""
    assert d.intent_provider == "" and d.intent_model == "" and d.intent_fallback_model == DEFAULT_INTENT_FALLBACK_MODEL


def test_groq_when_its_key_is_present_with_gateway_fallback():
    il = build_intent_llm(_main(), S.AgentSettings(), env={"GROQ_API_KEY": "g"})
    assert isinstance(il, FallbackLLM) and isinstance(il.primary, FallbackLLM)
    assert DEFAULT_GROQ_INTENT_MODEL == "openai/gpt-oss-120b"
    assert il.primary.primary.provider == "groq" and il.primary.primary.model == DEFAULT_GROQ_INTENT_MODEL
    assert il.primary.fallback.provider == "groq" and il.primary.fallback.model == DEFAULT_GROQ_BACKUP_MODEL
    assert il.fallback.provider == "omniroute" and il.fallback.base == GW
    assert il.fallback.model == DEFAULT_INTENT_FALLBACK_MODEL


def test_groq_backup_can_be_disabled():
    il = build_intent_llm(_main(), S.AgentSettings(intent_groq_backup=""), env={"GROQ_API_KEY": "g"})
    assert il.primary.provider == "groq" and il.primary.model == DEFAULT_GROQ_INTENT_MODEL


def test_no_groq_key_uses_the_gateway_fast_model():
    main = _main()
    il = build_intent_llm(main, S.AgentSettings(), env={})
    assert isinstance(il, ChatLLM) and il.base == GW and il.model == DEFAULT_INTENT_FALLBACK_MODEL
    assert main.model == "answer/model"  # the answer generator is unchanged
    il = build_intent_llm(main, S.AgentSettings(intent_provider="groq"), env={})  # asked for groq, no key
    assert il.provider == "omniroute" and il.model == DEFAULT_INTENT_FALLBACK_MODEL


def test_explicit_gateway_model_and_reuse_of_the_answer_client():
    main = _main()
    il = build_intent_llm(main, S.AgentSettings(intent_provider="omniroute", intent_model="fast/x"), env={"GROQ_API_KEY": "g"})
    assert il.model == "fast/x" and il.base == GW
    assert build_intent_llm(main, S.AgentSettings(intent_provider="omniroute", intent_model="answer/model",
                                                  intent_fallback_model=""), env={}) is main
    assert build_intent_llm(main, S.AgentSettings(intent_fallback_model=""), env={}) is main


def test_test_doubles_are_used_as_they_are(tmp_path):
    llm = ScriptedLLM(intent="policy")
    ag, _, _ = agent_for(llm, tmp_path=tmp_path)
    assert ag.intent_llm is llm


class _Rec(ScriptedLLM):
    supports_deadline = True

    def __init__(self, fail=None, **kw):
        super().__init__(**kw)
        self.err = fail

    def chat_json(self, system, user, max_tokens=900, tag="", deadline=None):
        self.prompts.append((tag, system, user))
        if self.err:
            raise LLMError(self.err)
        return {"intent": self.intent}


@pytest.mark.parametrize("err", ["HTTP 429: rate limit", "deadline exceeded", "HTTP 500"])
def test_fallback_on_error_or_429(err):
    p, f = _Rec(fail=err, intent="explain"), _Rec(intent="policy")
    assert FallbackLLM(p, f).chat_json("s", "u", tag="classify", deadline=1e18) == {"intent": "policy"}
    assert len(p.prompts) == 1 and len(f.prompts) == 1


def test_both_down_raises_so_the_rules_decide():
    with pytest.raises(LLMError):
        FallbackLLM(_Rec(fail="HTTP 429"), _Rec(fail="HTTP 502")).chat_json("s", "u", tag="classify")


def test_classify_goes_to_the_intent_client_and_answers_to_the_main_one(tmp_path):
    main, fast = ScriptedLLM(intent="other"), ScriptedLLM(intent="policy")
    ag, _, _ = agent_for(main, tmp_path=tmp_path)
    ag.intent_llm = fast
    ask(ag, "Hmm, what does foreclosure mean for someone like me in general terms please?")
    assert [p[0] for p in fast.prompts] == ["classify"]
    assert "classify" not in [p[0] for p in main.prompts]


def test_intent_client_failure_falls_back_to_rules(tmp_path):
    class Down(ScriptedLLM):
        def chat(self, *a, **k):
            raise LLMError("timeout")
    ag, _, _ = agent_for(ScriptedLLM(intent="other"), tmp_path=tmp_path)
    ag.intent_llm = Down()
    r = ask(ag, "Hmm, what does foreclosure mean for someone like me in general terms please?")
    assert r.answer


def test_agent_builds_its_intent_client(monkeypatch):
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    ag = object.__new__(AdvisoryAgent)
    ag.llm, ag.settings = _main(), S.AgentSettings()
    assert ag._make_intent_llm().model == DEFAULT_INTENT_FALLBACK_MODEL
