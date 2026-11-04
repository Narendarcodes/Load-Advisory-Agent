"""Client for the Laya System-1 router service (fast intent pre-route + input-guard signals).

Laya (convaiinnovations/laya, Apache-2.0) is a non-generative classifier. Saral runs a small CPU HTTP service around it
(see laya_service.py) and asks it for the applicant's intent before the LLM classifier runs:

* above the per-intent confidence threshold, the agent may use Laya's route and skip the LLM classifier;
* below it, or on any error/timeout, the route is ``None`` and the existing LLM classifier decides (unchanged path);
* Laya NEVER touches loan decisions, never answers the applicant, and never overrides the deterministic guards:
  ``guards.request_flags`` still runs first, and the deterministic leak checks remain the final guard on every answer.

Off by default: nothing happens unless ``SARAL_LAYA_ROUTER_URL`` is set.

    SARAL_LAYA_ROUTER_URL        base URL of the service, e.g. http://127.0.0.1:18097 (unset = router off)
    SARAL_LAYA_TIMEOUT_S         HTTP timeout per call (default 1.5 s); a timeout falls back to the LLM classifier
    SARAL_LAYA_MIN_PROB          default confidence threshold (top-choice probability) for accepting a route
    SARAL_LAYA_FLAG_THRESHOLD    probability above which a guard flag is reported (default 0.9). Flags are signals for
                                 logging/spans only: zero-shot they are not precise enough to refuse or hand off on.
"""
from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field

from .laya_questions import INTENTS

# Per-intent acceptance thresholds on the top-choice probability, chosen on the dev benchmark with the published
# zero-shot checkpoint (project-management/LAYA_ROUTER.md). Only three intents are precise enough zero-shot to skip the
# LLM classifier (explain_decision 22/24, policy_question 20/22, greeting 6/6 correct at >= 0.90). Every other intent is
# None: Laya never auto-routes it, and the LLM classifier plus the deterministic guards keep deciding. Raise an intent
# from None only after a fine-tuned checkpoint is measured on dev (refusal-type routes need >= 0.97, because a wrong
# refusal hurts the applicant more than a slower LLM classification).
DEFAULT_THRESHOLDS: dict[str, float | None] = {
    "explain_decision": 0.90,
    "application_status": None,
    "what_if": None,
    "improve": None,
    "policy_question": 0.90,
    "vague": None,
    "human_review": None,
    "distress": None,
    "misrepresentation": None,
    "other_applicant": None,
    "injection": None,
    "off_topic": None,
    "greeting": 0.90,
}

# Laya intent -> the agent graph's route. Intents the current graph has no node for yet (vague, human_review, distress)
# map to the names proposed in the agent-eval fix plan; the graph wiring decides what to do with them.
GRAPH_ROUTE = {
    "explain_decision": "explain",
    "application_status": "explain",
    "what_if": "what_if",
    "improve": "improve",
    "policy_question": "policy",
    "greeting": "greeting",
    "vague": "clarify",
    "human_review": "human_review",
    "distress": "distress",
    "misrepresentation": "boundary",
    "other_applicant": "boundary",
    "injection": "boundary",
    "off_topic": "other",
}
NEEDS_DECISION = frozenset({"explain_decision", "application_status", "what_if", "improve"})
FLAG_NAMES = ("injection", "misrepresentation", "distress", "wants_human")


@dataclass(frozen=True)
class LayaRouterSettings:
    url: str | None = None
    timeout_s: float = 1.5
    thresholds: dict = field(default_factory=lambda: dict(DEFAULT_THRESHOLDS))
    flag_threshold: float = 0.9

    @property
    def enabled(self) -> bool:
        return bool(self.url)

    @classmethod
    def from_env(cls, env=None) -> "LayaRouterSettings":
        env = os.environ if env is None else env
        url = (env.get("SARAL_LAYA_ROUTER_URL") or "").strip().rstrip("/") or None
        th = dict(DEFAULT_THRESHOLDS)
        if env.get("SARAL_LAYA_MIN_PROB"):
            base = float(env["SARAL_LAYA_MIN_PROB"])
            th = {k: (None if v is None else max(v, base)) for k, v in th.items()}
        return cls(url=url, timeout_s=float(env.get("SARAL_LAYA_TIMEOUT_S") or 1.5), thresholds=th,
                   flag_threshold=float(env.get("SARAL_LAYA_FLAG_THRESHOLD") or 0.9))


@dataclass(frozen=True)
class LayaRoute:
    """What Laya proposed. ``route`` is set only when the proposal clears its threshold; otherwise the caller must use
    the existing LLM classifier. ``flags`` are guard signals (names whose probability cleared the flag threshold)."""
    intent: str | None
    prob: float
    route: str | None
    graph_intent: str | None
    needs_decision: bool
    flags: tuple = ()
    flag_probs: dict = field(default_factory=dict)
    probs: dict = field(default_factory=dict)
    latency_ms: float = 0.0
    reason: str = "disabled"   # accepted | below_threshold | not_auto_routed | disabled | error:<kind>

    @property
    def accepted(self) -> bool:
        return self.route is not None

    def span_attrs(self) -> dict:
        """Flat attributes for an observability span (no message text)."""
        return {"laya.intent": self.intent or "", "laya.prob": round(self.prob, 4), "laya.reason": self.reason,
                "laya.accepted": self.accepted, "laya.flags": ",".join(self.flags), "laya.latency_ms": self.latency_ms}


def _off(reason: str, ms: float = 0.0) -> LayaRoute:
    return LayaRoute(intent=None, prob=0.0, route=None, graph_intent=None, needs_decision=False, reason=reason,
                     latency_ms=round(ms, 1))


class LayaRouter:
    """Thin HTTP client; safe to call on every turn. Any failure returns a non-accepted route (fail-open to the LLM)."""

    def __init__(self, settings: LayaRouterSettings | None = None, opener=None):
        self.settings = settings or LayaRouterSettings.from_env()
        self._open = opener or urllib.request.urlopen

    @property
    def enabled(self) -> bool:
        return self.settings.enabled

    def route(self, text: str, lang: str | None = None, context: str = "") -> LayaRoute:
        if not self.enabled:
            return _off("disabled")
        if not isinstance(text, str) or not text.strip():
            return _off("error:empty")
        body = json.dumps({"text": text, "lang": lang, "context": context or ""}).encode()
        req = urllib.request.Request(self.settings.url + "/route", data=body, method="POST",
                                     headers={"Content-Type": "application/json"})
        t0 = time.perf_counter()
        try:
            with self._open(req, timeout=self.settings.timeout_s) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except (TimeoutError, OSError, urllib.error.URLError) as exc:
            kind = "timeout" if "timed out" in str(exc).lower() or isinstance(exc, TimeoutError) else "unreachable"
            return _off(f"error:{kind}", (time.perf_counter() - t0) * 1000)
        except (ValueError, json.JSONDecodeError):
            return _off("error:bad_response", (time.perf_counter() - t0) * 1000)
        return self.interpret(data, (time.perf_counter() - t0) * 1000)

    def interpret(self, data: dict, wall_ms: float = 0.0) -> LayaRoute:
        """Apply thresholds to a service response. Pure function of the response and the settings."""
        intent = data.get("intent")
        probs = data.get("probs") or {}
        if intent not in INTENTS or not isinstance(probs, dict):
            return _off("error:bad_response", wall_ms)
        try:
            prob = float(probs.get(intent, 0.0))
            fprobs = {k: float(v) for k, v in (data.get("flags") or {}).items() if k in FLAG_NAMES}
        except (TypeError, ValueError):
            return _off("error:bad_response", wall_ms)
        flags = tuple(k for k in FLAG_NAMES if fprobs.get(k, 0.0) >= self.settings.flag_threshold)
        th = self.settings.thresholds.get(intent)
        if th is None:
            route, reason = None, "not_auto_routed"
        elif prob >= th:
            route, reason = intent, "accepted"
        else:
            route, reason = None, "below_threshold"
        return LayaRoute(intent=intent, prob=prob, route=route, graph_intent=GRAPH_ROUTE[intent] if route else None,
                         needs_decision=bool(route) and intent in NEEDS_DECISION, flags=flags, flag_probs=fprobs,
                         probs={k: float(v) for k, v in probs.items()}, latency_ms=round(float(data.get("latency_ms") or wall_ms), 1),
                         reason=reason)
