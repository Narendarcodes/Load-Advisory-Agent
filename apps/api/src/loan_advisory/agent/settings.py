"""Typed runtime settings of the advisory agent (env-driven; no hard-coded budgets in the graph).

    AGENT_VOICE_DEADLINE_S   per-turn deadline for voice turns (s). Must stay well under the voice worker's HTTP timeout.
    AGENT_TEXT_DEADLINE_S    per-turn deadline for text turns (s).
    AGENT_CLASSIFY_BUDGET_S  max time the LLM intent classifier may take before the deterministic rules decide.
    AGENT_MIN_COMPOSE_S      minimum time left in the turn to start (or retry) an LLM compose; otherwise the
                             deterministic template is used straight away.
    AGENT_FAST_CLASSIFY      off | voice | all — high-precision regex intents skip the LLM classifier.
    AGENT_CITATION_MODE      how policy citations are produced and checked (see loan_advisory.agent.citations).
    AGENT_VERIFY_MIN_LEFT_S  llm_verify only: minimum time left in the turn to run the citation-verifier call.
    AGENT_STREAM_BRIDGE      phrase spoken before a corrected answer when a streamed draft was replaced.
"""
import os
from dataclasses import dataclass, fields

FAST_CLASSIFY = ("off", "voice", "all")
CITATION_MODES = ("labels", "verify", "spans", "spans_verify", "llm_verify")


@dataclass(frozen=True)
class AgentSettings:
    voice_deadline_s: float = 25.0
    text_deadline_s: float = 75.0
    classify_budget_s: float = 6.0
    min_compose_s: float = 4.0
    fast_classify: str = "voice"
    citation_mode: str = "labels"
    stream_bridge: str = "To be precise:"
    verify_min_left_s: float = 3.0

    def __post_init__(self):
        if self.fast_classify not in FAST_CLASSIFY:
            raise ValueError(f"AGENT_FAST_CLASSIFY must be one of {FAST_CLASSIFY}, got {self.fast_classify!r}")
        if self.citation_mode not in CITATION_MODES:
            raise ValueError(f"AGENT_CITATION_MODE must be one of {CITATION_MODES}, got {self.citation_mode!r}")
        if not (0 < self.voice_deadline_s <= self.text_deadline_s):
            raise ValueError("need 0 < AGENT_VOICE_DEADLINE_S <= AGENT_TEXT_DEADLINE_S")

    def deadline_for(self, channel: str) -> float:
        return self.voice_deadline_s if channel == "voice" else self.text_deadline_s

    def fast_classify_for(self, channel: str) -> bool:
        return self.fast_classify == "all" or (self.fast_classify == "voice" and channel == "voice")

    @classmethod
    def from_env(cls, env=None) -> "AgentSettings":
        env = os.environ if env is None else env
        kw = {}
        for f in fields(cls):
            raw = env.get(f"AGENT_{f.name.upper()}")
            if raw is None or raw == "":
                continue
            kw[f.name] = float(raw) if f.type in (float, "float") else raw
        return cls(**kw)


def _f(env, key, default):
    raw = env.get(key)
    return float(raw) if raw not in (None, "") else default


@dataclass(frozen=True)
class VoiceSettings:
    """LiveKit voice worker settings (env). The worker's HTTP timeout must exceed the graph's voice deadline, so the
    graph's own template fallback always answers first and the worker never waits out its timeout."""
    agent_http: str = "http://127.0.0.1:8095"
    stt_http: str = "http://127.0.0.1:8791"
    tts_http: str = "http://127.0.0.1:8793"
    turn_log: str = "/root/hx/loan/voice/turns.jsonl"
    http_timeout_s: float = 40.0
    filler_after_s: float = 4.0          # say "one moment" if no guarded sentence has arrived by then
    stream: bool = True                  # use /api/chat/stream (sentence streaming) instead of /api/chat
    min_endpointing_s: float = 0.5       # LiveKit AgentSession end-of-turn delay after VAD silence (library default 0.5)
    vad_min_silence_s: float = 0.55      # Silero VAD silence that ends speech (library default 0.55)
    tts_gender: str = "Female"
    filler: dict = None
    unreachable: dict = None

    def __post_init__(self):
        object.__setattr__(self, "filler", self.filler or {
            "en": "One moment, please.", "hi": "एक पल रुकिए।", "te": "ఒక్క క్షణం ఆగండి."})
        object.__setattr__(self, "unreachable", self.unreachable or {
            "en": "Sorry, I couldn't reach the advisory service just now. Please ask again in a moment.",
            "hi": "माफ़ कीजिए, अभी सलाह सेवा से जुड़ नहीं पाया। कृपया एक पल बाद फिर पूछें।",
            "te": "క్షమించండి, ఇప్పుడు సలహా సేవను చేరుకోలేకపోయాను. దయచేసి ఒక్క క్షణం తర్వాత మళ్ళీ అడగండి."})

    @classmethod
    def from_env(cls, env=None) -> "VoiceSettings":
        env = os.environ if env is None else env
        d = cls()
        return cls(agent_http=env.get("AGENT_HTTP", d.agent_http), stt_http=env.get("STT_HTTP", d.stt_http),
                   tts_http=env.get("TTS_HTTP", d.tts_http), turn_log=env.get("VOICE_TURN_LOG", d.turn_log),
                   http_timeout_s=_f(env, "VOICE_HTTP_TIMEOUT_S", d.http_timeout_s),
                   filler_after_s=_f(env, "VOICE_FILLER_AFTER_S", d.filler_after_s),
                   stream=env.get("VOICE_STREAM", "1") not in ("0", "false", "no"),
                   min_endpointing_s=_f(env, "VOICE_MIN_ENDPOINTING_S", d.min_endpointing_s),
                   vad_min_silence_s=_f(env, "VOICE_VAD_MIN_SILENCE_S", d.vad_min_silence_s),
                   tts_gender=env.get("VOICE_TTS_GENDER", d.tts_gender))
