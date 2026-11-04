"""The intent classifier's own LLM client. Intent classification ONLY: the answer generator keeps its own client.

Why: on 2026-11-04 the answer model behind OmniRoute took 10-13 s per call, so 88 of 90 classifier calls missed the
6 s budget and fell to the regex rules. A small fast model is enough to pick one of a dozen intents.

    SARAL_INTENT_PROVIDER        groq | omniroute | "" (auto: groq when GROQ_API_KEY is set, else the answer gateway)
    SARAL_INTENT_MODEL           model id on that provider ("" = openai/gpt-oss-120b on groq, else the fallback model)
    SARAL_INTENT_GROQ_BACKUP     second Groq model tried on a primary error/429 (own rate-limit bucket; "" = none)
    SARAL_INTENT_FALLBACK_MODEL  fast model on the answer gateway, tried on any primary error or 429 ("" = none)

Order inside one classify call: primary -> Groq backup -> fallback (same overall classifier budget) -> the graph's regex/rules."""
import os

from loan_advisory.agent.llm import ChatLLM, FallbackChatLLM, LLMError

DEFAULT_GROQ_INTENT_MODEL = "openai/gpt-oss-120b"  # 135/140 dev agent turns, 0 timeouts (2026-11-04)
DEFAULT_GROQ_BACKUP_MODEL = "openai/gpt-oss-20b"  # its own Groq rate-limit bucket; 124/140
DEFAULT_INTENT_FALLBACK_MODEL = "antigravity/gemini-3.5-flash-lite"


class FallbackLLM:
    """chat_json on `primary`; on any LLMError (429, 5xx, deadline, bad JSON) the same call on `fallback`."""

    supports_deadline = True

    def __init__(self, primary, fallback):
        self.primary, self.fallback = primary, fallback
        self.model = getattr(primary, "model", None)

    @property
    def calls(self) -> list:
        return list(getattr(self.primary, "calls", [])) + list(getattr(self.fallback, "calls", []))

    def clear_calls(self):
        for c in (self.primary, self.fallback):
            if hasattr(c, "calls"):
                c.calls.clear()

    def chat_json(self, system, user, max_tokens=900, tag="", deadline=None):
        try:
            return self.primary.chat_json(system, user, max_tokens=max_tokens, tag=tag, deadline=deadline)
        except LLMError:
            return self.fallback.chat_json(system, user, max_tokens=max_tokens, tag=f"{tag}_fallback", deadline=deadline)


def _gateway(llm: ChatLLM, model: str, chain=None) -> ChatLLM:
    """`model` on the answer client's gateway. The default fast model is an OmniRoute route id: when the answer
    generator is not on OmniRoute (River default since 2026-11-04) it goes to the chain's OmniRoute client, else to
    OmniRoute's own endpoint (OMNIROUTE_BASE_URL), never to a provider that does not serve it."""
    if model == llm.model:
        return llm
    if model == DEFAULT_INTENT_FALLBACK_MODEL and llm.provider != "omniroute":
        omni = next((c for c in (chain or []) if c.provider == "omniroute"), None)
        if omni is not None:
            return ChatLLM(base=omni.base, model=model, provider="omniroute", api_key=omni._secret,
                           reasoning_effort=omni.reasoning_effort or "", timeout=llm.timeout, retries=llm.retries)
        return ChatLLM(model=model, provider="omniroute", timeout=llm.timeout, retries=llm.retries)
    return ChatLLM(base=llm.base, model=model, provider=llm.provider, api_key=llm._secret,
                   reasoning_effort=llm.reasoning_effort, timeout=llm.timeout, retries=llm.retries)


def build_intent_llm(llm, settings, env=None):
    """The classifier client for answer client `llm` (a ChatLLM or the SARAL_LLM_* FallbackChatLLM chain). Anything
    else (test doubles) is used as is."""
    chain = None
    if isinstance(llm, FallbackChatLLM):
        chain, llm = llm.clients, llm.primary
    if not isinstance(llm, ChatLLM):
        return llm
    env = os.environ if env is None else env
    provider = (getattr(settings, "intent_provider", "") or "").strip().lower()
    model = (getattr(settings, "intent_model", "") or "").strip()
    fb_model = (getattr(settings, "intent_fallback_model", DEFAULT_INTENT_FALLBACK_MODEL) or "").strip()
    has_groq = bool(env.get("GROQ_API_KEY"))
    if provider in ("", "groq") and has_groq and llm.provider != "groq":
        # one attempt: a 429 or error goes straight to the fallback instead of sleeping inside the classifier budget
        def groq(m):
            return ChatLLM(model=m, provider="groq", api_key=env.get("GROQ_API_KEY"), reasoning_effort="low", retries=1,
                           timeout=llm.timeout, env=env)
        primary = groq(model or DEFAULT_GROQ_INTENT_MODEL)
        backup = (getattr(settings, "intent_groq_backup", DEFAULT_GROQ_BACKUP_MODEL) or "").strip()
        if backup and backup != primary.model:
            primary = FallbackLLM(primary, groq(backup))
        return FallbackLLM(primary, _gateway(llm, fb_model, chain)) if fb_model else primary
    if provider in ("", "groq"):  # no Groq key here (e.g. the hark-2 containers): the gateway's fast model
        model = fb_model if (provider == "groq" or not model) else model
    return _gateway(llm, model, chain) if model else llm
