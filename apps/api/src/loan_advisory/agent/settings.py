"""Typed runtime settings of the advisory agent (env-driven; no hard-coded budgets in the graph).

    AGENT_VOICE_DEADLINE_S   per-turn deadline for voice turns (s). Must stay well under the voice worker's HTTP timeout.
    AGENT_TEXT_DEADLINE_S    per-turn deadline for text turns (s).
    AGENT_CLASSIFY_BUDGET_S  max time the LLM intent classifier may take before the deterministic rules decide.
    AGENT_MIN_COMPOSE_S      minimum time left in the turn to start (or retry) an LLM compose; otherwise the
                             deterministic template is used straight away.
    AGENT_FAST_CLASSIFY      off | voice | all — high-precision regex intents skip the LLM classifier.
    AGENT_CITATION_MODE      how policy citations are produced and checked (see graph.CITATION_MODES).
    AGENT_STREAM_BRIDGE      phrase spoken before a corrected answer when a streamed draft was replaced.
"""
import os
from dataclasses import dataclass, fields

FAST_CLASSIFY = ("off", "voice", "all")
CITATION_MODES = ("labels", "verify", "spans", "spans_verify")


@dataclass(frozen=True)
class AgentSettings:
    voice_deadline_s: float = 25.0
    text_deadline_s: float = 75.0
    classify_budget_s: float = 6.0
    min_compose_s: float = 4.0
    fast_classify: str = "voice"
    citation_mode: str = "labels"
    stream_bridge: str = "To be precise:"

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
