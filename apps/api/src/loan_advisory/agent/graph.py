"""The advisory agent: ONE controlled LangGraph StateGraph (no multi-agent).

    receive -> authenticate -> classify ─┬─ boundary ───────────────────────────────┐
                                          ├─ load_evidence ─┬─ explain ─┐             │
                                          │                 ├─ plan ────┤             │
                                          │                 ├─ what_if ─┼─ compose ⇄ validate ─┐
                                          │                 └─ status ──┼─────────────────────┤
                                          ├─ retrieve_policy ───────────┘                      │
                                          └─ simple (greeting/other) ──────────────────────────┴─ finalize (persist_turn)

Only the nodes a request needs run: a general policy question never loads an application, and an
identity failure stops before any application data is read. The LLM phrases facts; ZEN decides
(earlier, in the conventional workflow); deterministic guards check every draft and fall back to a
template built from the same facts if a draft fails twice.
"""
import hashlib
import json
import operator
import re
import time
import uuid
from typing import Annotated, TypedDict

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph

from loan_advisory.agent import facts as F
from loan_advisory.agent import observability as obs
from loan_advisory.agent import guards as G
from loan_advisory.agent import prompts as P
from loan_advisory.agent.intent_router import build_routers, first_route
from loan_advisory.agent.settings import AgentSettings
from loan_advisory.agent.streaming import JSONFieldStreamer, SentenceGate, remainder, split_sentences
from loan_advisory.agent.citations import labels_of as _labels_of, verify_citations
from loan_advisory.agent.contracts import AgentRequest, AgentResponse, Session
from loan_advisory.agent.llm import LLMError
from loan_advisory.agent.progress import PUBLIC_STAGES
from loan_advisory.agent.tools import (FrappeUnavailable, InvalidWhatIf, NotAuthorized, UnknownApplication)
from loan_advisory.state_paths import AUDIT_LOG, append_private, resolve


_COUNTER_FALLBACK = "We can offer {amount}, with an EMI of {emi} a month for {tenure} months."  # prompts.FALLBACK_EXPLAIN localises it (PR #46)


def _sanitize(text: str, locale: str = "en") -> str:
    """guards.sanitize_answer (PR #46) when it is available; a no-op on a base without it."""
    fn = getattr(G, "sanitize_answer", None)
    if fn is None:
        return text
    try:
        return fn(text, locale)
    except TypeError:  # an older sanitize_answer(text) without the locale argument
        return fn(text)

INTENTS = ("explain", "improve", "what_if", "policy", "greeting", "other", "status", "vague", "human_review", "distress",
           "misrepresentation")
DECISION_INTENTS = ("explain", "status", "distress", "improve", "what_if")  # the only turns that read the decision
EXPLAIN_LIKE = ("explain", "status", "distress")
WHAT_IF_FIELDS_DEFAULT = ("loan_amount", "tenure_months", "monthly_obligations", "monthly_income")
_FIELD_ALIASES = {"existing_emis": "monthly_obligations", "emis": "monthly_obligations", "income": "monthly_income",
                  "tenure": "tenure_months", "amount": "loan_amount", "requested_amount": "loan_amount"}


def _what_if_config() -> dict:
    """config/saral_what_if.json (catalogue v2, ADR-0005/0010): editable fields and the per-session cap. The env
    SARAL_WHAT_IF_SESSION_CAP overrides the cap. Missing file -> the approved defaults (4 fields, cap 3)."""
    import os
    from pathlib import Path
    cfg = {"per_session_cap": 3, "editable_fields": list(WHAT_IF_FIELDS_DEFAULT)}
    try:
        from decision_engine.paths import repo_root
        raw = json.loads((Path(repo_root()) / "config" / "saral_what_if.json").read_text(encoding="utf-8"))
        cfg["per_session_cap"] = int(raw.get("per_session_cap") or 3)
        cfg["editable_fields"] = [_FIELD_ALIASES.get(f, f) for f in raw.get("editable_fields") or WHAT_IF_FIELDS_DEFAULT]
    except (OSError, ValueError, TypeError, ImportError):
        pass
    env_cap = os.environ.get("SARAL_WHAT_IF_SESSION_CAP")
    if env_cap not in (None, ""):
        try:
            cfg["per_session_cap"] = max(0, int(env_cap))
        except ValueError:
            pass
    return cfg


# English safety net for templates added with the agent-eval fixes. prompts.TEMPLATES (PR #46) carries them in EN/HI/TE;
# these are used only on a base without that PR, so the graph never fails on a missing key.
_DEFAULT_TEMPLATES = {
    "human_review": ("I've asked a person on our team to review your application (reference {ref}). They will look at "
                     "it and get back to you. I can't predict what they will decide."),
    "human_review_distress": ("I'm sorry this has been so hard. I've asked a person on our team to review your "
                              "application (reference {ref}). They will look at it and get back to you."),
    "bureau_request": ("I can't start a credit check or a new assessment. A person reviewing your application, or a new "
                       "application, handles that. I can ask a person to review your case if you like."),
    "what_if_cap": ("You've reached the limit of estimates for this session, so I can't run another one. Your application "
                    "is unchanged. I can explain your decision or ask a person to review it."),
    "what_if_error": ("I couldn't estimate that change, so I won't guess. Your application is unchanged. I can explain "
                      "your decision or ask a person to review it."),
    "what_if_line": "Estimate only, your application is unchanged: with these numbers you {result} our checks.",
    "what_if_area": "The area that would still not meet them: {area}.",
    "clarify_charges": ("Do you mean all the charges on the loan, or one charge, like the processing fee, a late payment "
                        "or closing the loan early?"),
    "clarify_documents": ("Do you mean the documents needed to apply, or the documents we still need from you for this "
                          "application?"),
    "clarify_rates": "Do you mean the interest rate on the loan, or another charge, like the processing fee?",
    "clarify_generic": ("Could you tell me a little more? Is this about your own application, or a general question about "
                        "loan rules or charges?"),
    "distress_kind": "I understand this is worrying, and I'm sorry you're going through this.",
    "distress_review_offer": "If you'd like, I can ask a person on our team to review your application.",
}
_LEGACY_INTENT_OUT = {"vague": "clarify", "misrepresentation": "boundary", "bureau_request": "boundary"}


def _tmpl(key: str, locale: str = "en", **kw) -> str:
    """prompts.template when it has the key; else the English safety net above."""
    if key in (getattr(P, "TEMPLATES", {}).get("en") or {}):
        return P.template(key, locale, **kw)
    t = _DEFAULT_TEMPLATES[key]
    return t.format(**kw) if kw else t


def _prompt(name: str, default: str) -> str:
    return getattr(P, name, None) or default


_DISTRESS_ADDON = ("\nThe applicant is upset or worried. Start with ONE short, calm, kind sentence that acknowledges how "
                   "they feel, with no blame. If they feel accused, say plainly that this is not an accusation. Then "
                   "answer their question as above. End by offering a human review of their application.")
_CLARIFY_DEFAULT = """The applicant's latest message to a personal-loan assistant is too vague to answer. Write ONE short
clarifying question in {lang} that offers the 2 or 3 most likely meanings as options (for example: "Do you mean the
processing fee, or the charge for closing the loan early?"). Use simple everyday words. Do not answer the question, do
not mention internal systems, and do not use any number.
Recent conversation: {history}
Latest message: {message}
Return JSON only: {{"question": "..."}}"""
DISPUTE = re.compile(r"\b(wrong|incorrect|mistake|error in|not correct|not mine|is false|dispute|outdated|old (data|salary|income))\b|"
                     r"గలత్|తప్పు|ग़लत|गलत", re.I)
TEMPORAL = re.compile(r"\b(previous|prior|earlier|older|superseded|withdrawn|repealed|historical|used to be)\b|"
                      r"\bbefore (the )?(\w+ )?(20\d\d|consolidation|amendment|revision)\b|\b(ver\.?|version)\s*\d|"
                      r"\b(19|20)(0\d|1\d|2[0-4])\b", re.I)
_RULES = [  # regex fallback when the LLM classifier is unavailable
    ("what_if", re.compile(r"\bwhat if\b|\bsuppose\b|\bif (my|i)\b.*\d|\bhypothetical", re.I)),
    ("improve", re.compile(r"improv|what (can|should) i do|next step|re-?apply|\bfix\b|\bplan\b|become eligible|qualify next", re.I)),
    ("policy", re.compile(r"\b(rbi|policy|policies|fee|charges?|interest|kfs|key fact|grievance|complain|ombudsman|foreclos|"
                          r"prepay|penal|kyc|cooling|recovery|privacy|bajaj|nbfc|bank|written|documents?)\b", re.I)),
    ("explain", re.compile(r"why|reason|reject|declin|denied|turned down|explain|what happened|my decision|status|mean|"
                           r"\bmy\s+(recorded\s+)?(credit score|cibil score|monthly income|income|salary|emis?|foir|job tenure)\b", re.I)),
    ("greeting", re.compile(r"^\s*(hi|hello|hey|namaste|namaskar|thanks|thank you|ok|okay)\b", re.I)),
]
# High-precision intents that skip the LLM classifier (AGENT_FAST_CLASSIFY). Used only when exactly ONE matches;
# anything ambiguous still goes to the LLM. English + Hindi + Telugu.
_FAST = [
    ("explain", re.compile(r"\bwhy\b.{0,40}\b(reject\w*|declin\w*|denied|turned down|refused|not approved)\b|"
                           r"क्यों.{0,30}(रिजेक्ट|अस्वीकार|नामंज़ूर|नामंजूर|ख़ारिज|खारिज)|(रिजेक्ट|अस्वीकार|नामंज़ूर|नामंजूर|ख़ारिज|खारिज).{0,30}क्यों|"
                           r"ఎందుకు.{0,30}(తిరస్కర|రిజెక్ట్)|(తిరస్కర|రిజెక్ట్).{0,30}ఎందుకు|"
                           r"\b(what(?:'s| is| was)|tell me|show me)\s+my\s+(recorded\s+)?(credit score|cibil score|"
                           r"monthly income|income|salary|emis?|foir|job tenure)\b", re.I)),
    ("improve", re.compile(r"\b(what (can|should) i do|how (can|do) i improve|improve (my|before|so)|before i re-?apply|"
                           r"steps to improve)\b|सुधार|మెరుగుపర", re.I)),
    ("policy", re.compile(r"\b(complain\w*|grievance|ombudsman|key fact statement|kfs)\b|शिकायत|ఫిర్యాదు", re.I)),
    ("what_if", re.compile(r"^\s*(what if|suppose)\b", re.I)),
]
_QUESTION = re.compile(r"\?|^\s*(can|could|is|are|do|does|how|what|when|where|which|who|why|will|should|must)\b|"
                       r"क्या|कैसे|कब|कौन|क्यों|ఎలా|ఏమి|ఎప్పుడు|ఎవరు|ఎందుకు", re.I)
_FAST_NOT = re.compile(r"\b(rate|fee|fees|charges?|interest|offer|bajaj|bank|lender|nbfc|rbi)\b", re.I)


class AgentState(TypedDict, total=False):
    request: dict
    session: dict | None
    turn_key: str | None  # unique per run(): keys the streaming sink and the trace context (never client-supplied)
    history: Annotated[list, operator.add]
    t0: float
    trace: list
    status: str | None
    flags: list
    intent: str | None
    wi_changes: dict | None
    record: dict | None
    what_if: dict | None
    plan: dict | None
    passages: list
    retrieval: dict | None
    draft: str | None
    abstained: bool
    cited: list
    guard_flags: list
    attempts: int
    fallback_used: bool
    action: str | None
    handoff_ref: str | None
    response: dict | None
    deadline: float
    prefetched: dict | None
    voice_lead: str | None
    decision_cache: dict | None   # {"application_ref", "stamp", "record"}: kept across turns of the conversation
    what_if_count: int            # simulations run in this conversation (per-session cap, ADR-0005)
    route: dict | None            # {"intent", "source", "flags"} from the pre-router
    clarify: bool


class AdvisoryAgent:
    def __init__(self, decision_tools, llm, policy_tools=None, handoff=None, profile=None, audit_path=None,
                 checkpointer=None, settings: AgentSettings | None = None):
        self.tools, self.llm, self.policy, self.handoff = decision_tools, llm, policy_tools, handoff
        self.settings = settings or AgentSettings.from_env()
        self._streams: dict = {}  # turn_key -> {"emit", "spoken", "first_ms"} for sentence streaming (not graph state)
        self._stages: dict = {}  # turn_key -> on_stage listener for public progress (not graph state)
        self.profile = profile or {}
        self.audit_path = resolve(audit_path, "AGENT_AUDIT_LOG", AUDIT_LOG, "agent_out/turns.jsonl",
                                  legacy="agent_out/turns.jsonl")
        self._trace_ctx: dict = {}  # turn_key -> OTel context of the turn's root span (not stored in graph state)
        self.routers = build_routers()
        self.what_if_cfg = _what_if_config()
        self.graph = self._build().compile(checkpointer=checkpointer or MemorySaver())

    # ------------------------------------------------------------------ public API
    def run(self, request: AgentRequest, session: Session | None, trace_context=None, on_sentence=None,
            on_stage=None) -> AgentResponse:
        """Run one turn. `on_sentence(text)` (optional) receives the answer sentence by sentence as soon as each one
        has passed the deterministic guards; together the sentences are exactly the final answer to speak.
        `on_stage(stage)` (optional) receives the name of each allowlisted graph node as it starts."""
        thread = f"{session.applicant_ref if session else 'anon'}::{request.conversation_id}"  # scoped per applicant
        sess_hash = hashlib.sha256(thread.encode()).hexdigest()[:16]
        corr_hash = hashlib.sha256(str(request.request_id).encode()).hexdigest()[:16]
        with obs.span("advisor.turn", kind="CHAIN", context=trace_context,
                      **{"session.id": sess_hash, "channel": request.channel, "locale": request.locale,
                         "literacy": request.literacy, "input.value": obs.content(request.message),
                         "langfuse.trace.name": "advisory.turn",
                         "langfuse.trace.tags": ["loan-advisory", request.channel, request.locale],
                         "langfuse.trace.metadata.correlation_id": json.dumps(corr_hash),
                         "langfuse.trace.metadata.channel": json.dumps(request.channel),
                         "langfuse.observation.input": obs.lf_content(request.message)}) as root:
            # A client may repeat request_id (retries, double submits). Neither the streaming sink nor the trace context
            # may be keyed by it, or one turn's sentences would be spoken into another turn's session.
            turn_key = uuid.uuid4().hex
            if root is not None:
                self._trace_ctx[turn_key] = obs.current_context()
            if on_sentence is not None:
                self._streams[turn_key] = {"emit": on_sentence, "spoken": [], "first_ms": None, "t0": time.perf_counter()}
            if on_stage is not None:
                self._stages[turn_key] = on_stage
            try:
                out = self.graph.invoke({"request": request.model_dump(), "session": session.model_dump() if session else None,
                                         "turn_key": turn_key},
                                        config={"configurable": {"thread_id": thread}})
            finally:
                self._trace_ctx.pop(turn_key, None)
                self._streams.pop(turn_key, None)
                self._stages.pop(turn_key, None)
            resp = AgentResponse(**out["response"])
            if root is not None:
                resp.trace_id = format(root.get_span_context().trace_id, "032x")  # = Phoenix trace id
                obs.set_attrs(root, **{"agent.intent": resp.intent, "agent.action": resp.action, "agent.abstained": resp.abstained,
                                       "agent.guard_flags": resp.guard_flags, "agent.citations": [c.document_id for c in resp.citations],
                                       "agent.evidence_refs": resp.evidence_refs, "agent.total_ms": resp.timings.get("total_ms"),
                                       "output.value": obs.content(resp.answer),
                                       "langfuse.trace.tags": ["loan-advisory", request.channel, request.locale, resp.intent or "unknown"],
                                       "langfuse.observation.output": obs.lf_content(resp.answer)},
                              **obs.lf_meta(intent=resp.intent, action=resp.action, abstained=resp.abstained,
                                            guard_flags=resp.guard_flags,
                                            citation_document_ids=[c.document_id for c in resp.citations],
                                            evidence_refs=resp.evidence_refs, total_ms=resp.timings.get("total_ms"),
                                            outcome=("abstained" if resp.abstained else "answered")))
            return resp

    def _node(self, name, fn):
        """Wrap a graph node in an OTel span parented to the turn's root span."""
        def wrapped(s):
            self._stage(s.get("turn_key"), name)
            ctx = self._trace_ctx.get(s.get("turn_key"))
            with obs.span(f"node.{name}", kind="CHAIN", context=ctx, **{"graph.node": name}) as sp:
                out = fn(s)
                if sp is not None and isinstance(out, dict):
                    lf = obs.lf_meta(node=name, status=out.get("status"), intent=out.get("intent"),
                                     action=out.get("action"), abstained=out.get("abstained"),
                                     guard_flags=out.get("guard_flags") or None, attempts=out.get("attempts"),
                                     citation_labels=out.get("cited"),
                                     retrieval_count=len(out["passages"]) if isinstance(out.get("passages"), list) else None,
                                     retrieval_mode=(out.get("retrieval") or {}).get("mode") if isinstance(out.get("retrieval"), dict) else None,
                                     retrieval_failed=bool((out.get("retrieval") or {}).get("error")) if isinstance(out.get("retrieval"), dict) else None)
                    obs.set_attrs(sp, **{f"graph.{k}": out[k] for k in ("status", "intent", "action", "attempts", "abstained") if k in out},
                                  **({"graph.guard_flags": out["guard_flags"]} if out.get("guard_flags") else {}),
                                  **({"graph.request_flags": out["flags"]} if out.get("flags") else {}), **lf)
                return out
        wrapped.__name__ = name
        return wrapped

    # ------------------------------------------------------------------ helpers
    def _ev(self, s, node, **kw):
        s.setdefault("trace", []).append({"node": node, "t_ms": round((time.perf_counter() - s["t0"]) * 1000, 1), **kw})

    def _req(self, s) -> AgentRequest:
        return AgentRequest(**s["request"])

    def _session(self, s):
        return Session(**s["session"]) if s.get("session") else None

    def _left(self, s) -> float:
        return s.get("deadline", float("inf")) - time.perf_counter()

    def _llm_kw(self, s, budget: float | None = None) -> dict:
        """Deadline kwarg for LLM calls (absolute perf_counter time), when the client supports it."""
        if not getattr(self.llm, "supports_deadline", False):
            return {}
        d = s.get("deadline", float("inf"))
        if budget is not None:
            d = min(d, time.perf_counter() + budget)
        return {"deadline": d} if d != float("inf") else {}

    def _stream(self, s):
        return self._streams.get(s.get("turn_key"))

    def _stage(self, turn_key, name):
        """Announce a node that just started, if it is in the public allowlist. Never its data."""
        listener = self._stages.get(turn_key)
        if listener is None or name not in PUBLIC_STAGES:
            return
        try:
            listener(name)
        except Exception:  # a broken listener must never break the turn
            pass

    def _emit(self, s, text: str):
        st = self._stream(s)
        if st is None or not text.strip():
            return
        text = _sanitize(text, self._req(s).locale)
        if st.get("blocked"):
            return
        if self._violations(s, text):  # never stream a sentence the final output check would block
            st["blocked"] = True
            return
        st["spoken"].append(text)
        if st["first_ms"] is None:
            st["first_ms"] = round((time.perf_counter() - st["t0"]) * 1000, 1)
        try:
            st["emit"](text)
        except Exception:  # a broken listener must never break the turn
            pass

    def _voice_lead(self, s, req, intent):
        """English voice only: one deterministic sentence built from the recorded evidence (never from the LLM)."""
        if s.get("voice_lead"):
            return s["voice_lead"]
        if req.channel != "voice" or req.locale != "en" or intent not in ("explain", "improve") or not s.get("record"):
            return None
        reason = F.main_reason(s["record"], "en")
        if not reason:
            return None
        if intent == "explain":
            plain = F.outcome_plain(s["record"], "en")
            return f"{plain[0].upper() + plain[1:]}, mainly because {reason['plain']}."
        return f"The main thing to work on: {reason['plain']}."

    def _allowed(self, s) -> set:
        req, intent = self._req(s), s.get("intent")
        allowed = F.grounded_numbers(s.get("record"), extra=G.numbers_in(req.message))
        if intent == "what_if" and s.get("what_if") and "record" in s["what_if"]:
            allowed |= F.grounded_numbers(None, extra=list(s["what_if"]["changes"].values()))
            o = s["what_if"].get("offer") or {}
            allowed |= F.grounded_numbers(None, extra=[o.get(k) for k in ("amount", "emi", "tenure_months")])
        if intent == "policy":
            for p in s.get("passages") or []:
                allowed |= set(G.numbers_in(p["text"] + " " + p["citation"]["title"] + " " + str(p["citation"].get("section"))))
        return allowed

    def _style(self, req: AgentRequest):
        return (P.LITERACY_STYLE.get(req.literacy, P.LITERACY_STYLE["medium"]), P.LANG.get(req.locale, "English"),
                P.VOICE if req.channel == "voice" else "")

    # ------------------------------------------------------------------ nodes
    def receive(self, s):
        t0 = time.perf_counter()
        return {"t0": t0, "deadline": t0 + self.settings.deadline_for(self._req(s).channel), "prefetched": None, "voice_lead": None,
                "trace": [{"node": "receive", "t_ms": 0.0}], "status": None, "flags": [],
                "intent": None, "wi_changes": None, "record": None, "what_if": None, "plan": None, "passages": [],
                "retrieval": None, "draft": None, "abstained": False, "cited": [], "guard_flags": [], "attempts": 0,
                "fallback_used": False, "action": None, "handoff_ref": None, "response": None,
                "route": None, "clarify": False, "decision_cache": s.get("decision_cache"),
                "what_if_count": int(s.get("what_if_count") or 0)}

    def authenticate(self, s):
        req, sess = self._req(s), self._session(s)
        status = None
        if req.application_ref:
            try:
                self.tools.authorize(req.application_ref, sess)
            except NotAuthorized:
                status = "not_authorized"
            except UnknownApplication:
                status = "not_authorized"  # do not reveal whether another applicant's ref exists
            except FrappeUnavailable:
                status = "unavailable"
        self._ev(s, "authenticate", status=status or "ok")
        return {"status": status, "trace": s["trace"]}

    def classify(self, s):
        out = self._classify(s)
        if out.get("intent") == "what_if" and self._cap_left(s) <= 0:  # 4th estimate: refused before any read
            out["status"] = "what_if_cap"
        return out

    def _classify(self, s):
        """Route first. Deterministic request guards, then the pre-routers (keyword; Laya behind a flag), then the
        fast regex intents, then the LLM classifier. Classifying never reads the decision: only the intents that need
        it fetch it, once, in load_evidence."""
        req = self._req(s)
        flags = G.request_flags(req.message, req.application_ref)
        if req.application_ref and DISPUTE.search(req.message) and not G.is_informational_question(req.message) \
                and not {"injection", "other_applicant", "misrepresentation"} & set(flags):
            flags = ["dispute"]  # a claim that the recorded data is wrong goes to a person, even with "update/approve it"
        if req.application_ref and _foreign_ref(req.message, req.application_ref) and "other_applicant" not in flags:
            flags = ["other_applicant"] + flags
        route = first_route(self.routers, req.message, req.locale, _last_assistant(s))
        if route is not None and route.intent in ("misrepresentation", "bureau_request", "other_applicant", "injection",
                                                  "guarantee") and not flags:
            flags = [route.intent]
        if flags:
            if "misrepresentation" not in flags and route is not None and route.intent == "misrepresentation":
                flags = ["misrepresentation"] + flags
            self._ev(s, "classify", intent="boundary", flags=flags, by="guard")
            return {"intent": "boundary", "flags": flags, "route": _route_dict(route), "trace": s["trace"]}
        if route is not None:
            intent = route.intent
            changes = _regex_changes(req.message) if intent == "what_if" else None
            self._ev(s, "classify", intent=intent, by=route.source)
            return {"intent": intent, "wi_changes": changes, "route": _route_dict(route), "trace": s["trace"]}
        if self.settings.fast_classify_for(req.channel) or req.locale in ("hi", "te"):
            fast = _fast_intent(req.message)
            if fast is not None:
                intent, changes = fast
                self._ev(s, "classify", intent=intent, by="fast")
                return {"intent": intent, "wi_changes": changes, "trace": s["trace"]}
        cache = s.get("decision_cache") or {}
        values = ((cache.get("record") or {}).get("inputs") or {}).get("values") or {} \
            if cache.get("application_ref") == req.application_ref else {}
        hist = [f"{h['role']}: {h['text'][:200]}" for h in (s.get("history") or [])[-4:]]
        intent, changes, by = None, None, "llm"
        try:
            j = self.llm.chat_json("You are a precise intent classifier. Output JSON only.",
                                   P.CLASSIFY.format(values=json.dumps(values), history=json.dumps(hist, ensure_ascii=False),
                                                     message=req.message), max_tokens=400, tag="classify",
                                   **self._llm_kw(s, self._classify_budget(req)))
            intent = j.get("intent") if j.get("intent") in INTENTS else None
            changes = j.get("what_if_changes") or None
        except (LLMError, AttributeError):
            intent = None
        if intent == "status":  # "status" is only taken from the keyword router; the LLM's status reads as explain
            intent = "explain"
        if intent == "misrepresentation":
            self._ev(s, "classify", intent="boundary", flags=["misrepresentation"], by="llm")
            return {"intent": "boundary", "flags": ["misrepresentation"], "trace": s["trace"]}
        if intent is None:
            by = "rules"
            intent = next((name for name, rx in _RULES if rx.search(req.message)), "other")
            if intent == "other" and _QUESTION.search(req.message):
                intent, by = "policy", "rules_question_default"  # cite-or-abstain path, never a guess
            changes = _regex_changes(req.message) if intent == "what_if" else None
        self._ev(s, "classify", intent=intent, by=by)
        return {"intent": intent, "wi_changes": changes, "trace": s["trace"]}

    def _classify_budget(self, req) -> float:
        """Hindi / Telugu prompts are longer in tokens and slower: they get a larger classifier budget (fix 6)."""
        fn = getattr(self.settings, "classify_budget_for", None)
        return fn(req.locale) if fn else self.settings.classify_budget_s

    def _cap_left(self, s) -> int:
        return max(0, int(self.what_if_cfg.get("per_session_cap", 3)) - int(s.get("what_if_count") or 0))

    def load_evidence(self, s):
        req, sess = self._req(s), self._session(s)
        if not req.application_ref:
            return {"status": "no_app"}
        cache_status, new_cache = "none", s.get("decision_cache")
        try:
            if s.get("intent") == "status":
                self.tools.get_application_summary(req.application_ref, sess)
            pre = s.get("prefetched")  # fetched (authorized) earlier in this same turn
            if pre:
                rec = pre["record"]
            else:
                rec, stamp, cache_status = self._decision(req, sess, s.get("decision_cache"))
                if stamp and rec is not None:
                    new_cache = {"application_ref": req.application_ref, "stamp": stamp, "record": rec}
        except NotAuthorized:
            return {"status": "not_authorized"}
        except UnknownApplication:
            return {"status": "not_authorized"}
        except FrappeUnavailable:
            return {"status": "unavailable"}
        bf = F.bureau_facts(rec)
        if rec is None:
            st = "no_decision"
        elif bf and bf["outcome_kind"] == "PROVIDER_FAILURE":
            st = "bureau_provider_error"
        elif bf and bf["outcome_kind"] == "DATA_QUALITY_HOLD":
            st = "bureau_review"
        elif bf and bf["outcome_kind"] == "EVALUATION_ERROR":
            st = "manual_review"
        elif rec.get("lifecycle_state") == "INFO_REQUESTED" or rec.get("decision") == "ERROR" and rec.get("lifecycle_state") != "MANUAL_REVIEW":
            st = "info_requested"
        elif rec.get("lifecycle_state") == "MANUAL_REVIEW":
            st = "manual_review"
        elif rec.get("decision") == "APPROVED":
            st = "approved" if s["intent"] != "what_if" else "ok"
        else:
            st = "ok"
        self._ev(s, "get_decision_evidence", status=st, record_id=(rec or {}).get("record_id"), cache=cache_status)
        obs.set_attrs(obs.current_span(), **{"decision.cache": cache_status},
                      **obs.lf_meta(decision_cache=cache_status,
                                    reason_categories=[c["key"] for c in F.reason_categories(rec)] if rec else None))
        return {"record": rec, "status": st, "trace": s["trace"], "decision_cache": new_cache}

    def _decision(self, req, sess, cache):
        """(record, stamp, hit|miss|none). The tool re-checks ownership every call and re-reads the evidence only when
        its version stamp changed. A tools object without cache support is called the plain way."""
        try:
            return self.tools.get_decision_evidence(req.application_ref, sess, cached=cache, with_stamp=True)
        except TypeError:
            return self.tools.get_decision_evidence(req.application_ref, sess), None, "none"

    def plan(self, s):
        req = self._req(s)
        p = self.tools.improvement_plan(req.application_ref, self._session(s), s["record"])
        self._ev(s, "run_what_if", kind="improvement_plan", steps=len(p["steps"]))
        return {"plan": p, "trace": s["trace"]}

    def what_if(self, s):
        req = self._req(s)
        cap, used = int(self.what_if_cfg.get("per_session_cap", 3)), int(s.get("what_if_count") or 0)
        sp = obs.current_span()
        if used >= cap:  # normally caught before the decision is read; kept here as the last line
            self._ev(s, "run_what_if", capped=True, count=used, cap=cap)
            obs.set_attrs(sp, **{"what_if.count": used, "what_if.cap": cap, "what_if.status": "capped"})
            return {"status": "what_if_cap", "what_if": None, "trace": s["trace"]}
        vals = (s["record"].get("inputs") or {}).get("values") or {}
        try:
            changes = _absolute_changes(s.get("wi_changes") or {}, vals, self.what_if_cfg.get("editable_fields"))
            w = self.tools.run_what_if(req.application_ref, self._session(s), changes, record=s["record"])
        except InvalidWhatIf as e:
            self._ev(s, "run_what_if", error=str(e))
            obs.set_attrs(sp, **{"what_if.count": used, "what_if.cap": cap, "what_if.status": "invalid"})
            return {"status": "bad_what_if", "what_if": {"error": _plain_wi_error(str(e), req.locale)}, "trace": s["trace"]}
        res = F.what_if_result(w)
        count = used + (0 if res == "COULD_NOT_ESTIMATE" else 1)  # a failed estimate reveals nothing; not counted
        w = {**w, "remaining_this_session": max(0, cap - count)}
        self._ev(s, "run_what_if", simulated=True, fields=sorted(w["changes"]),
                 simulated_decision=w["simulated_decision"], sim_status=w.get("sim_status"), count=count, cap=cap,
                 policy_version=w.get("policy_version"), original_unchanged=w["original_record_unchanged"])
        obs.set_attrs(sp, **{"what_if.count": count, "what_if.cap": cap, "what_if.remaining": max(0, cap - count),
                             "what_if.status": "error" if res == "COULD_NOT_ESTIMATE" else "ok",
                             "what_if.result": res, "what_if.policy_version": w.get("policy_version")},
                      **obs.lf_meta(what_if_count=count, what_if_cap=cap, what_if_result=res,
                                    sim_status=w.get("sim_status"), policy_version=w.get("policy_version")))
        if res == "COULD_NOT_ESTIMATE":
            return {"status": "what_if_error", "what_if": w, "what_if_count": count, "trace": s["trace"]}
        return {"what_if": w, "what_if_count": count, "trace": s["trace"]}

    def retrieve_policy(self, s):
        req = self._req(s)
        if self.policy is None:
            return {"passages": [], "retrieval": {"error": "policy retrieval not configured"}}
        q = req.message
        hist = [h["text"] for h in (s.get("history") or []) if h["role"] == "user"]
        if len(q.split()) < 6 and hist:
            q = hist[-1] + " " + q  # short follow-up ("and for banks?") inherits the previous question
        try:
            passages, meta = self.policy.search(q, historical=bool(TEMPORAL.search(req.message)))
        except Exception as e:  # retrieval down: fail safe (abstain), never guess
            passages, meta = [], {"error": f"{type(e).__name__}: {str(e)[:200]}"}
        self._ev(s, "retrieve_policy", n=len(passages), **{k: v for k, v in meta.items() if k != "error"})
        return {"passages": passages, "retrieval": meta, "trace": s["trace"]}

    def compose(self, s):
        req, intent = self._req(s), s["intent"]
        style, lang, voice = self._style(req)
        retry = P.RETRY.format(flags=", ".join(s["guard_flags"])) if s.get("attempts") else ""
        attempts = s.get("attempts", 0) + 1
        if intent == "policy" and not s["passages"]:
            return {"draft": P.template("policy_abstain", req.locale), "abstained": True, "cited": [],
                    "attempts": attempts, "action": "answer"}
        if self._left(s) < self.settings.min_compose_s:  # per-turn deadline: no time for an LLM draft -> template
            self._ev(s, "compose", skipped="deadline", left_s=round(self._left(s), 2))
            return {"draft": None, "attempts": 99, "guard_flags": ["deadline"]}
        stream = self._stream(s) if attempts == 1 else None  # only the first draft is streamed
        gate = SentenceGate(self._allowed(s), lambda t: self._emit(s, t)) if stream is not None else None
        try:
            if intent == "policy":
                return self._compose_policy(s, req, style, lang, voice, retry, attempts, gate)
            facts = self._facts(s)
            tmpl = {"explain": P.EXPLAIN, "status": P.EXPLAIN, "distress": P.EXPLAIN, "improve": P.IMPROVE,
                    "what_if": P.WHAT_IF}[intent]
            facts_json = json.dumps(facts, ensure_ascii=False, indent=1)
            system = tmpl.format(style=style, lang=lang, voice=voice, facts=facts_json) + retry
            if intent == "distress" or (s.get("route") or {}).get("flags", {}).get("distress"):
                system += _prompt("DISTRESS_ADDON", _DISTRESS_ADDON)
            # Langfuse gap 5: what the LLM was given. Field names always; the values only with content capture on.
            obs.set_attrs(obs.current_span(), **{"llm.facts_keys": sorted(facts)},
                          **obs.lf_meta(facts_keys=sorted(facts), facts=obs.lf_content(facts_json)))
            lead = self._voice_lead(s, req, intent) if (stream is not None or s.get("voice_lead")) else None
            if lead:
                s["voice_lead"] = lead
                if stream is not None:
                    self._emit(s, lead)  # deterministic, grounded first sentence: spoken while the LLM starts
                system += P.VOICE_LEAD_CONTINUE.format(lead=lead)
            elif req.channel == "voice":
                system += P.VOICE_FIRST_SENTENCE
            kw = dict(max_tokens=1100, tag=f"compose_{intent}", **self._llm_kw(s))
            if gate is not None and hasattr(self.llm, "chat_stream"):
                parts = []
                for d in self.llm.chat_stream(system, req.message, **kw):
                    parts.append(d)
                    gate.push(d)
                txt = "".join(parts).strip()
            else:
                txt = self.llm.chat(system, req.message, **kw)
                if gate is not None:
                    gate.push(txt)
            if gate is not None:
                gate.close()
            if lead:
                txt = f"{lead} {txt}".strip()
            return {"draft": txt, "attempts": attempts, "action": "simulate" if intent == "what_if" else "answer",
                    "voice_lead": lead}
        except LLMError as e:
            self._ev(s, "compose", error=str(e)[:200])
            return {"draft": None, "attempts": 99, "guard_flags": ["deadline" if "deadline" in str(e) else "llm_error"]}

    def _compose_policy(self, s, req, style, lang, voice, retry, attempts, gate):
        prof = self.profile
        desc = f"{prof.get('legal_name', 'lender-neutral')} ({prof.get('entity_type', 'any')}; {prof.get('relationship', '')})"
        user = "\n\n".join(f"[{p['label']}]{' [historical]' if p['citation'].get('approval_status') == 'approved_historical' else ''} "
                           f"{p['citation']['title']} — {p['citation'].get('section') or ''}\n{p['text'][:1800]}"
                           for p in s["passages"]) + f"\n\nQuestion: {req.message}"
        mode = self.settings.citation_mode
        system = (P.POLICY_SPANS if mode in ("spans", "spans_verify") else P.POLICY).format(
            profile_desc=desc, style=style, lang=lang, voice=voice) + retry
        if mode in ("one_source", "one_source_soft"):
            system = system.replace("\nStyle:", P.ONE_SOURCE_RULE + "\nStyle:", 1)
        if req.channel == "voice":
            system += P.VOICE_FIRST_SENTENCE
        labels = [p["label"] for p in s["passages"]]
        kw = dict(max_tokens=1400 if mode.startswith("spans") else 1200, tag="compose_policy", **self._llm_kw(s))
        if gate is not None and hasattr(self.llm, "chat_stream"):
            fs, parts = JSONFieldStreamer("answer"), []

            def pre():
                h = fs.head()
                ab = bool(h.get("abstain"))
                return G.citation_flags(_labels_of(h, mode), labels, ab) if not ab else []
            gate.precheck = pre
            for d in self.llm.chat_stream(system, user, **kw):
                parts.append(d)
                gate.push(fs.feed(d))
            gate.close()
            j = _parse_json("".join(parts))
        else:
            j = self.llm.chat_json(system, user, **kw)
            if gate is not None:
                ab0 = bool(j.get("abstain"))
                gate.precheck = (lambda: G.citation_flags(_labels_of(j, mode), labels, ab0)) if not ab0 else None
                gate.push(str(j.get("answer") or ""))
                gate.close()
        ab = bool(j.get("abstain"))
        ans = str(j.get("answer") or "").strip() or P.template("policy_abstain", req.locale)
        cited = [] if ab else _labels_of(j, mode)
        if not ab and mode in ("verify", "spans", "spans_verify", "primary_source", "one_source"):
            cited, dropped = verify_citations(ans, j, s["passages"], mode)
            if dropped:
                self._ev(s, "verify_citations", kept=cited, dropped=dropped)
        if not ab and mode == "llm_verify" and cited and self._left(s) >= self.settings.verify_min_left_s:
            cited = self._llm_verify_citations(s, req, ans, cited)
        # Q-16: a clarifying question is surfaced as a question (action clarify), not as an abstention
        clar = bool(j.get("clarify")) and ab and ans.rstrip().endswith(("?", "？", "।?")) and len(ans.split()) <= 40
        return {"draft": ans, "abstained": ab, "cited": cited, "attempts": attempts,
                "action": "clarify" if clar else "answer", "clarify": clar}

    def _llm_verify_citations(self, s, req, ans, cited):
        """Post-hoc citation verification by a focused LLM call: of the passages the answer cites, keep those the
        verifier confirms directly state its facts. Never adds a passage; keeps the model's own labels when the
        verifier confirms none of them or fails. (On dev, pruning beat replace/union: see the upgrade RESULTS.)"""
        labels = [p["label"] for p in s["passages"]]
        ps = "\n\n".join(f"[{p['label']}] {p['citation']['title']} — {p['citation'].get('section') or ''}\n{p['text'][:1500]}"
                          for p in s["passages"])
        try:
            j = self.llm.chat_json("You are a precise source checker. Output JSON only.",
                                   P.VERIFY_CITATIONS.format(question=req.message, answer=ans, passages=ps),
                                   max_tokens=500, tag="verify_citations", **self._llm_kw(s))
            got = [c for c in (j.get("supporting") or []) if isinstance(c, str) and c in labels]
        except (LLMError, AttributeError):
            got = []
        out = [c for c in cited if c in got] or cited  # prune only: never adds a passage the answer did not cite (dev-tuned)
        self._ev(s, "verify_citations", by="llm", claimed=cited, kept=out)
        return out

    def validate(self, s):
        intent, draft = s["intent"], s.get("draft")
        if draft is None:
            return {"guard_flags": s.get("guard_flags") or ["llm_error"]}
        flags = G.answer_flags(draft)
        if intent == "policy":
            flags += G.citation_flags(s.get("cited") or [], [p["label"] for p in s.get("passages") or []], s.get("abstained"))
            flags = [f for f in flags if not (f == "answer_without_citation" and not s.get("passages"))]
        bad_nums = G.ungrounded_numbers(draft, self._allowed(s))
        if bad_nums:
            flags.append("ungrounded_numbers:" + ",".join(bad_nums[:5]))
        if not (intent == "policy" and s.get("clarify")):
            flags += [f for f in self._violations(s, draft) if f not in flags]
        self._ev(s, "validate", flags=flags, attempt=s.get("attempts"))
        checks = ["answer_language", "grounded_numbers", "output_check"] + (["citations"] if intent == "policy" else [])
        obs.set_attrs(obs.current_span(), **{"guard.pass": not flags, "guard.flags": flags, "guard.checks": checks},
                      **obs.lf_meta(guard_pass=not flags, guard_checks=checks, guard_flags_all=flags))
        return {"guard_flags": flags, "trace": s["trace"]}

    def _violations(self, s, text: str) -> list[str]:
        """Final deterministic output check (fix 2): outcome codes, rule ids / internal codes, passage labels, internal
        system names, and on decision turns hidden-flag words, a credit-score number that is not the applicant's own,
        and any cut-off. guards.output_violations (PR #46) does the matching; a local minimum runs without it."""
        intent = s.get("intent")
        rec = s.get("record") or {}
        own = set()
        sc = F.own_score(rec)
        if sc is not None:
            own.add(F._norm(sc))
        limits = set()
        if rec and intent != "policy":
            limits = {F._norm(e["threshold"]) for e in rec.get("rule_evaluations") or []
                      if isinstance(e.get("threshold"), (int, float)) and not isinstance(e.get("threshold"), bool)}
            limits -= F.grounded_numbers(rec, extra=G.numbers_in(self._req(s).message))
        fn = getattr(G, "output_violations", None)
        decision_turn = intent in DECISION_INTENTS
        if fn is not None:
            try:
                return fn(text, decision_turn=decision_turn, own_numbers=own, limit_numbers=limits)
            except TypeError:
                pass
        return _local_violations(text, decision_turn, own, limits)

    def _after_validate(self, s):
        if s.get("guard_flags") and s.get("attempts", 0) < 2:
            if self._left(s) >= self.settings.min_compose_s:
                return "compose"
        return "finalize"  # finalize marks "deadline" when a rewrite was skipped for lack of time

    def boundary(self, s):
        req = self._req(s)
        flags = s["flags"]
        key = next(k for k in ("injection", "misrepresentation", "other_applicant", "dispute", "data_deletion", "override",
                               "edit_record", "auto_submit", "bureau_request", "not_available", "guarantee")
                   if k in flags)
        out = {"action": "refuse", "abstained": key in ("guarantee", "not_available")}
        if key in ("dispute", "data_deletion"):
            category = "data_dispute" if key == "dispute" else "data_deletion"
            ref = self.handoff.create(category, [req.application_ref], req.message, req.request_id) if self.handoff else None
            out.update(action="handoff", handoff_ref=ref, draft=P.template(key, req.locale, ref=ref or "pending"))
        else:
            out["draft"] = _tmpl(key, req.locale)
        # A guarantee request never reads the decision (fixed tool plan per intent; Golden B expects authorize only).
        self._ev(s, "boundary", kind=key)
        return {**out, "trace": s["trace"]}

    def human_review(self, s):
        """The applicant asked for a person: create a real review ticket through the handoff tool and say so plainly.
        No decision is read and no outcome is predicted."""
        req = self._req(s)
        ref = None
        if self.handoff is not None:
            try:
                ref = self.handoff.create("human_review", [req.application_ref] if req.application_ref else [], req.message,
                                          req.request_id)
            except Exception:  # a queue that cannot be written gives no reference; the answer says it is pending
                ref = None
        distress = bool((s.get("route") or {}).get("flags", {}).get("distress"))
        txt = _tmpl("human_review_distress" if distress else "human_review", req.locale, ref=ref or "pending")
        self._ev(s, "human_review", created=bool(ref))
        return {"draft": txt, "action": "handoff", "handoff_ref": ref, "abstained": False, "trace": s["trace"]}

    def clarify(self, s):
        """A vague question: ONE short clarifying question in the applicant's language offering 2-3 likely meanings.
        No decision and no policy search; not an abstention. The next turn is answered once it is clear."""
        req = self._req(s)
        hist = [f"{h['role']}: {h['text'][:200]}" for h in (s.get("history") or [])[-4:]]
        q = None
        if self._left(s) >= self.settings.min_compose_s:
            try:
                j = self.llm.chat_json("You write one short clarifying question. Output JSON only.",
                                       _prompt("CLARIFY", _CLARIFY_DEFAULT).format(
                                           lang=P.LANG.get(req.locale, "English"), message=req.message,
                                           history=json.dumps(hist, ensure_ascii=False)),
                                       max_tokens=200, tag="clarify", **self._llm_kw(s, self._classify_budget(req)))
                q = str(j.get("question") or "").strip()
            except (LLMError, AttributeError, ValueError):
                q = None
        ok = bool(q) and q.rstrip().endswith(("?", "？")) and len(q.split()) <= 40 and not G.numbers_in(q) \
            and not self._violations(s, q)
        if not ok:
            q = _tmpl(_clarify_key(req.message), req.locale)
        self._ev(s, "clarify", by="llm" if ok else "template")
        return {"draft": q, "action": "clarify", "abstained": False, "clarify": True, "trace": s["trace"]}

    def simple(self, s):
        req = self._req(s)
        st = s.get("status")
        rec = s.get("record") or {}
        action = "answer"
        if st == "no_app":
            txt, action = P.template("no_app"), "clarify"
        elif st == "not_authorized":
            txt, action = P.template("not_authorized"), "refuse"
        elif st == "unavailable":
            txt, action = P.template("unavailable"), "handoff"
        elif st == "no_decision":
            txt, action = P.template("no_decision"), "clarify"
        elif st == "info_requested":
            fields = F.borrower_missing_fields(rec)  # E2E D-17: plain words, never a rule id, in the borrower's language
            missing = F.missing_field_words(fields or ["documents"], req.locale)
            txt, action = P.template("info_requested", req.locale, missing=missing), "clarify"
        elif st == "bureau_review":
            bf = F.bureau_facts(rec) or {}
            if bf.get("info_requested"):
                missing = bf.get("info_requested_fields") or ["details flagged as invalid"]
                txt, action = P.template("bureau_info", req.locale,
                                         missing=", ".join(m.replace("_", " ") for m in missing)), "clarify"
            else:
                reasons = "; ".join(bf.get("review_reasons_plain") or ["the bureau data could not be verified"])
                txt, action = P.template("bureau_review", req.locale, reasons=reasons), "handoff"
        elif st == "bureau_provider_error":
            bf = F.bureau_facts(rec) or {}
            pe = bf.get("provider_error") or {}
            retryable = bool(pe.get("retryable"))
            txt = P.template("bureau_provider_retry" if retryable else "bureau_provider_manual", req.locale,
                             reason=P.bureau_reason(pe.get("code"), req.locale))
            action = "clarify" if retryable else "handoff"
        elif st == "manual_review":
            txt, action = P.template("manual_review", flags=", ".join(rec.get("flags") or ["flagged for review"])), "handoff"
        elif st == "approved":
            txt = P.template("approved")
        elif st == "bad_what_if":
            txt, action = P.template("bad_what_if", req.locale, why=s["what_if"]["error"]), "clarify"
        elif st == "what_if_cap":
            txt, action = _tmpl("what_if_cap", req.locale), "refuse"
        elif st == "what_if_error":
            txt, action = _tmpl("what_if_error", req.locale), "answer"
        else:
            txt = P.template("greeting" if s.get("intent") == "greeting" else "other", req.locale)
        declined = st in ("no_decision", "unavailable", "bureau_provider_error") or (st in (None, "ok") and s.get("intent") == "other")
        return {"draft": txt, "action": action, "abstained": declined,
                "trace": s["trace"], "plan": s.get("plan")}

    def finalize(self, s):
        req = self._req(s)
        intent = s.get("intent") or "other"
        gflags = list(s.get("guard_flags") or [])
        draft = s.get("draft")
        fallback = False
        if draft is not None and gflags and s.get("attempts", 0) < 2 and "deadline" not in gflags:
            gflags.append("deadline")  # a flagged draft was not rewritten because the turn ran out of time
        decision_turn = intent in DECISION_INTENTS or intent == "policy"
        if decision_turn and s.get("status") in (None, "ok") and (draft is None or gflags):
            s["guard_flags"] = gflags
            draft, fallback = self._fallback(s), True
            if intent == "policy":
                s["abstained"], s["cited"] = True, []
        if draft:  # Q-15 / D-16: passage labels, retrieval words and outcome codes never reach the borrower
            clean = _sanitize(draft, req.locale)
            if clean != draft:
                gflags.append("sanitised")
                draft = clean
        if draft and ((decision_turn and s.get("status") in (None, "ok")) or intent == "vague"):  # fix 2: final output check on
            # generated text (the fixed templates of the other paths are checked by their tests)
            bad = self._violations(s, draft)
            if bad:
                gflags.append("output_blocked:" + ",".join(sorted({b.split(":")[0] for b in bad})))
                if decision_turn and s.get("status") in (None, "ok") and s.get("record") is not None or intent == "policy":
                    s["guard_flags"] = gflags
                    draft, fallback = _sanitize(self._fallback(s), req.locale), True
                    if intent == "policy":
                        s["abstained"], s["cited"] = True, []
                if self._violations(s, draft):  # last resort: a template that carries no data at all
                    draft = _tmpl("what_if_error", req.locale) if intent == "what_if" else P.template("other", req.locale)
        if draft and intent in ("explain", "improve", "what_if", "status", "distress") and s.get("status") in (None, "ok") \
                and not re.search(P.SYNTHETIC_MARK, draft, re.I):
            draft = draft.rstrip() + "\n\n" + P.SYNTHETIC_NOTE.get(req.locale, P.SYNTHETIC_NOTE["en"])
            gflags.append("synthetic_label_appended")
        st = self._stream(s)
        if st is not None and draft:  # stream whatever has not been spoken yet (template, synthetic note, boundary text)
            rest = remainder(st["spoken"], draft, P.STREAM_BRIDGE.get(req.locale, self.settings.stream_bridge) if req.locale != "en" else self.settings.stream_bridge)
            if rest:
                done, tail = split_sentences(rest + " ")
                for snt in done + ([tail] if tail.strip() else []):
                    self._emit(s, snt)
        card = F.decision_card_borrower(s["record"]) if s.get("record") else None  # Q-07: never the officer card
        cites = []
        if intent == "policy" and not s.get("abstained"):
            by_label = {p["label"]: p for p in s.get("passages") or []}
            cites = [by_label[c]["citation"] for c in s.get("cited") or [] if c in by_label]
        missing = []
        if s.get("status") in ("info_requested", "bureau_review"):
            missing = F.borrower_missing_fields(s.get("record") or {})
        plan_steps = (s.get("plan") or {}).get("steps") or []
        timings = {"total_ms": round((time.perf_counter() - s["t0"]) * 1000, 1), "llm_calls": list(self.llm.calls[-6:]) if hasattr(self.llm, "calls") else []}
        if s.get("retrieval"):
            timings["retrieval_ms"] = s["retrieval"].get("latency_ms")
        if st is not None:
            timings["first_sentence_ms"] = st["first_ms"]
            timings["streamed_sentences"] = len(st["spoken"])
        trace_id = str(uuid.uuid4())  # replaced by the OTel trace id in run() when tracing is on
        wi = s.get("what_if")
        resp = AgentResponse(
            request_id=req.request_id, trace_id=trace_id, intent=_out_intent(intent),
            action=s.get("action") or "answer", answer=draft or "", abstained=bool(s.get("abstained")) and not s.get("clarify"),
            citations=cites,
            evidence_refs=[x for x in [(s.get("record") or {}).get("record_id"), (wi or {}).get("record", {}).get("record_id") if wi and "record" in wi else None] if x],
            missing_information=missing, handoff_ref=s.get("handoff_ref"), decision_card=card,
            improvement_plan=[F.borrower_plan_step(st) for st in plan_steps],
            what_if=(F.borrower_what_if(wi, req.locale) if wi and "error" not in wi else None),
            guard_flags=gflags + (["fallback_template"] if fallback else []), timings=timings)
        self._audit(s, resp)
        hist = [{"role": "user", "text": req.message}, {"role": "assistant", "text": resp.answer[:600]}]
        if hasattr(self.llm, "calls"):
            self.llm.calls.clear()
        return {"response": resp.model_dump(), "history": hist}

    # ------------------------------------------------------------------ facts / fallback / audit
    def _facts(self, s):
        """What the LLM may phrase. Plain outcome words, ONE plain reason category, the offer; never a rule name, rule
        id, outcome code, threshold, target or gap (agent eval fix 2, Langfuse case B)."""
        rec, locale, intent = s["record"], self._req(s).locale, s["intent"]
        base = {"application_ref": rec["application_ref"], "policy": F.SYNTHETIC_LABEL,
                "outcome_plain": F.outcome_plain(rec, locale)}
        reason = F.main_reason(rec, locale)
        if reason:
            base["main_reason"] = reason["plain"]
        offer = F.offer_plain(rec)
        if offer:
            base["offer"] = offer
        bf = F.bureau_facts(rec)
        if bf:  # what kind of outcome it is and where the score came from; never the data-quality or provider codes
            base["bureau"] = {k: bf[k] for k in ("is_credit_rejection", "is_data_quality_hold", "is_provider_failure",
                                                 "score_source_plain")}
        if intent in EXPLAIN_LIKE:
            if (s.get("route") or {}).get("flags", {}).get("leak_probe"):
                base["applicant_asked_for_a_limit_or_hidden_detail"] = True
            if intent == "status":
                base["question_is_about_status"] = True
        if intent == "improve":
            base["tasks"] = F.guidance_for(rec, locale)
            p = s.get("plan") or {}
            c = p.get("all_changes_together")
            if c and c.get("simulated_decision") in ("APPROVED", "ELIGIBILITY_CONDITIONS_MET"):
                base["all_changes_together"] = {"would_meet_the_example_rules_in_a_practice_check": True,
                                                "label": c.get("label")}
        if intent == "what_if":
            w = s["what_if"]
            res = F.what_if_result(w)
            area = F.what_if_area(w)
            base["what_if"] = {"hypothetical_changes": {k: (F.inr(v) if k in ("monthly_income", "monthly_obligations", "loan_amount") else v)
                                                        for k, v in w["changes"].items()},
                               "estimate_result": F.WHAT_IF_TEXT[res]["en"],
                               "area_still_not_met": F.reason_plain(area, locale) if area else None,
                               "original_application_unchanged": w["original_record_unchanged"],
                               "label": "Estimate only, your application is unchanged"}
            wo = w.get("offer") or {}
            if res == "WOULD_NOT_MEET" and wo.get("amount") and wo.get("counter_offer"):
                base["what_if"]["smaller_amount_possible"] = {"amount": F.inr(wo["amount"]),
                                                              "emi": F.inr(wo["emi"]) if wo.get("emi") else None,
                                                              "loan_period_months": wo.get("tenure_months")}
        return base

    def _fallback(self, s):
        """Deterministic answer from the same facts: plain outcome, one plain reason, the offer, general guidance.
        Never a code, rule name, threshold, target or gap (Q-09)."""
        req, intent = self._req(s), s["intent"]
        loc = req.locale
        if intent == "policy":
            busy = "deadline" in (s.get("guard_flags") or []) or "llm_error" in (s.get("guard_flags") or [])
            return P.template("policy_busy" if busy else "policy_abstain", loc)
        rec = s["record"]
        end = "।" if loc == "hi" else "."
        lines = []
        if intent in EXPLAIN_LIKE:
            fx = P.FALLBACK_EXPLAIN.get(loc, P.FALLBACK_EXPLAIN["en"])
            if intent == "distress" or (s.get("route") or {}).get("flags", {}).get("distress"):
                lines.append(_tmpl("distress_kind", loc))
            plain = F.outcome_plain(rec, loc)
            lines.append(plain[0].upper() + plain[1:] + end)
            offer = F.offer_plain(rec)
            if offer and offer["is_counter_offer"] and offer["amount"]:
                frame = fx.get("counter") or _COUNTER_FALLBACK
                lines.append(frame.format(amount=offer["amount"], emi=offer["emi"] or "", tenure=offer["loan_period_months"] or ""))
            reason = F.main_reason(rec, loc)
            if reason:
                lines.append(reason["plain"][0].upper() + reason["plain"][1:] + end)
            bf = F.bureau_facts(rec)
            if bf and bf.get("score_source_plain"):
                lines.append(fx["bureau"].format(src=bf["score_source_plain"]))
            lines.append(_tmpl("distress_review_offer", loc) if intent == "distress" else fx["offer"])
        elif intent == "improve":
            for i, t in enumerate(F.guidance_for(rec, loc), 1):
                lines.append(f"{i}. {t['general_guidance']}")
            lines.append(_fx_offer(loc))
        elif intent == "what_if":
            w = s["what_if"]
            res = F.what_if_result(w)
            lines.append(_tmpl("what_if_line", loc, result=F.WHAT_IF_TEXT[res].get(loc) or F.WHAT_IF_TEXT[res]["en"]))
            area = F.what_if_area(w)
            if area:
                lines.append(_tmpl("what_if_area", loc, area=F.reason_plain(area, loc)))
        return "\n".join(lines)

    def _audit(self, s, resp: AgentResponse):
        """persist_turn: trace events and outcomes only — no message text, no financial values."""
        req = self._req(s)
        sess = s.get("session") or {}
        row = {"trace_id": resp.trace_id, "request_id": req.request_id, "conversation_id": req.conversation_id,
               "applicant_hash": hashlib.sha256((sess.get("applicant_ref") or "").encode()).hexdigest()[:16],
               "channel": req.channel, "locale": req.locale, "literacy": req.literacy, "message_chars": len(req.message),
               "intent": resp.intent, "action": resp.action, "abstained": resp.abstained,
               "citations": [c.document_id for c in resp.citations], "evidence_refs": resp.evidence_refs,
               "guard_flags": resp.guard_flags, "handoff_ref": resp.handoff_ref, "events": s.get("trace"), "timings": resp.timings}
        try:
            with append_private(self.audit_path) as f:
                f.write(json.dumps(row, default=str) + "\n")
        except OSError:
            pass

    # ------------------------------------------------------------------ wiring
    def _build(self):
        g = StateGraph(AgentState)
        for name in ("receive", "authenticate", "classify", "load_evidence", "plan", "what_if", "retrieve_policy",
                     "compose", "validate", "boundary", "human_review", "clarify", "simple", "finalize"):
            g.add_node(name, self._node(name, getattr(self, name)))
        g.add_edge(START, "receive")
        g.add_edge("receive", "authenticate")
        g.add_conditional_edges("authenticate", lambda s: "simple" if s.get("status") in ("not_authorized", "unavailable") else "classify",
                                ["simple", "classify"])
        g.add_conditional_edges("classify", _after_classify,
                                ["boundary", "human_review", "clarify", "load_evidence", "retrieve_policy", "simple"])
        g.add_conditional_edges("load_evidence", _after_evidence, ["compose", "plan", "what_if", "simple"])
        g.add_edge("plan", "compose")
        g.add_conditional_edges("what_if", lambda s: "simple" if s.get("status") in ("bad_what_if", "what_if_cap", "what_if_error")
                                else "compose", ["simple", "compose"])
        g.add_edge("retrieve_policy", "compose")
        g.add_edge("compose", "validate")
        g.add_conditional_edges("validate", self._after_validate, ["compose", "finalize"])
        g.add_edge("boundary", "finalize")
        g.add_edge("human_review", "finalize")
        g.add_edge("clarify", "finalize")
        g.add_edge("simple", "finalize")
        g.add_edge("finalize", END)
        return g



def _after_classify(s):
    """Fixed tool plan per intent: only explain / status / distress / improve / what-if read the decision. An unknown
    intent gets a template, never a tool."""
    i = s.get("intent")
    if i == "boundary":
        return "boundary"
    if i == "human_review":
        return "human_review"
    if i == "vague":
        return "clarify"
    if i == "what_if" and s.get("status") == "what_if_cap":
        return "simple"
    if i in DECISION_INTENTS:
        return "load_evidence"
    if i == "policy":
        return "retrieve_policy"
    return "simple"


def _after_evidence(s):
    if s.get("status") != "ok":
        return "simple"
    return {"explain": "compose", "status": "compose", "distress": "compose", "improve": "plan",
            "what_if": "what_if"}[s["intent"]]


_NOT_EDITABLE_WORDS = {"credit_score": "your credit score", "employment_months": "your time in your job"}
_VALUE_KEYS = {"monthly_income": ("monthly_income", "monthly_net_income"),
               "monthly_obligations": ("monthly_obligations", "existing_monthly_obligations"),
               "loan_amount": ("loan_amount", "requested_amount"), "tenure_months": ("tenure_months",)}


def _absolute_changes(raw: dict, values: dict, editable=None) -> dict:
    """Borrower what-if changes as absolute values. Only the four editable fields (config/saral_what_if.json); the
    credit score and job months are never editable (cut-off probing, ADR-0005 / Q-03)."""
    editable = list(editable or WHAT_IF_FIELDS_DEFAULT)
    out = {}
    for k, spec in (raw or {}).items():
        k = _FIELD_ALIASES.get(k, k)
        if k in _NOT_EDITABLE_WORDS:
            raise InvalidWhatIf(f"{_NOT_EDITABLE_WORDS[k]} can't be changed in an estimate")
        if k not in editable:
            raise InvalidWhatIf("I can only estimate a change to your monthly income, your EMIs, the loan amount or the loan period")
        if isinstance(spec, (int, float)):
            out[k] = spec
        elif isinstance(spec, dict) and "set" in spec:
            out[k] = spec["set"]
        elif isinstance(spec, dict) and "delta" in spec:
            cur = next((values[v] for v in _VALUE_KEYS.get(k, (k,)) if values.get(v) is not None), None)
            if cur is None:
                raise InvalidWhatIf(f"no recorded value for {k} to change")
            try:
                out[k] = float(cur) + float(spec["delta"])
            except (TypeError, ValueError):
                raise InvalidWhatIf(f"could not read the change for {k}") from None
        else:
            raise InvalidWhatIf(f"could not read the change for {k}")
    if not out:
        raise InvalidWhatIf("I couldn't tell which number to change")
    return out


_WI = [("credit_score", re.compile(r"(?:credit\s*score|cibil|score)\D{0,20}(\d{3})", re.I)),  # refused downstream
       ("monthly_obligations", re.compile(r"(?:emi|emis|obligations?)\D{0,25}(?:₹\s?)?(\d[\d,]*)", re.I)),
       ("monthly_income", re.compile(r"(?:income|salary|earn)\D{0,25}(?:₹\s?)?(\d[\d,]*)", re.I)),
       ("tenure_months", re.compile(r"(\d{2,3})\s*months?\b(?![^.]{0,20}\b(job|work|employ))", re.I)),
       ("loan_amount", re.compile(r"(?:loan\s+amount|borrow(?:ed)?|ask(?:ed)?\s+for|apply\s+for|get(?:\s+the\s+full)?|take)\s*"
                                  r"(?:of\s+)?(?:₹\s?)?(\d[\d,.]*)\s*(lakh|lac|l\b)?", re.I))]


_CLOSE_LOAN = re.compile(r"\b(close|clear|pay\s+off|repay|prepay|foreclose)\s+(my\s+|one\s+|the\s+|a\s+)?(\w+\s+)?(loan|emi|card)\b"
                         r"[^.?\d]{0,30}(?:₹\s?)?(\d[\d,]*)\s*(?:a|per|/)\s*month", re.I)


def _regex_changes(msg: str) -> dict | None:
    out = {}
    m = _CLOSE_LOAN.search(msg)
    if m:  # "if I close my bike loan, which is 4,000 a month" -> EMIs down by that amount
        out["monthly_obligations"] = {"delta": -float(m.group(5).replace(",", ""))}
    for field, rx in _WI:
        if field in out:
            continue
        m = rx.search(msg)
        if m:
            try:
                v = float(m.group(1).replace(",", "").rstrip("."))
            except ValueError:
                continue
            if field == "loan_amount" and (m.lastindex or 0) >= 2 and m.group(2):
                v *= 100_000
            if field == "loan_amount" and v < 10_000:
                continue
            out[field] = {"set": v}
    return out or None


def _parse_json(txt: str) -> dict:
    from loan_advisory.agent.llm import parse_json
    return parse_json(txt)


def _fast_intent(msg: str):
    """(intent, what_if_changes) when exactly one high-precision pattern matches; else None (ask the LLM)."""
    hits = [name for name, rx in _FAST if rx.search(msg)]
    if len(hits) != 1:
        return None
    intent = hits[0]
    if intent == "what_if":
        ch = _regex_changes(msg)
        if not ch or _FAST_NOT.search(msg):
            return None
        return intent, ch
    if intent in ("explain", "improve") and (re.search(r"\d", msg) or _FAST_NOT.search(msg)):
        return None
    return intent, None


def _fx_offer(loc: str) -> str:
    return P.FALLBACK_EXPLAIN.get(loc, P.FALLBACK_EXPLAIN["en"])["offer"]


def _out_intent(intent: str | None) -> str:
    """Response intent: the graph's own label, legacy-mapped for the boundary-type routes."""
    i = _LEGACY_INTENT_OUT.get(intent or "", intent or "other")
    return i if i in ("explain", "improve", "what_if", "policy", "boundary", "greeting", "status", "human_review",
                      "distress", "clarify") else "other"


def _route_dict(route) -> dict | None:
    return None if route is None else {"intent": route.intent, "source": route.source, "flags": dict(route.flags or {})}


def _last_assistant(s) -> str:
    for h in reversed(s.get("history") or []):
        if h.get("role") == "assistant":
            return h.get("text") or ""
    return ""


def _clarify_key(msg: str) -> str:
    m = msg.lower()
    if re.search(r"charge|fee|शुल्क|चार्ज|फीस|ఛార్జ|ఫీజు", m):
        return "clarify_charges"
    if re.search(r"document|paper|दस्तावेज़|पत्र|పత్రా", m):
        return "clarify_documents"
    if re.search(r"rate|interest|ब्याज|వడ్డీ", m):
        return "clarify_rates"
    return "clarify_generic"


# Minimum output check used only on a base without guards.output_violations (PR #46).
_CODE_RX = re.compile(r"\b[A-Z]{2,}(?:_[A-Z0-9]{2,})+\b|\b(?:PL|DQ|BFL)-\d{2,3}\b|\b(?:ZEN|RAG|LLM|JDM)\b|\bP[1-5]\b|"
                      r"\bpassages?\b|\bsynthetic-v\d\b", re.I)
_HIDDEN_RX = re.compile(r"\b(settle(d|ment)|write-?off|written[- ]off|fraud|black-?list\w*|negative list|duplicate|tamper\w*|"
                        r"forg(ed|ery)|signature (mismatch|did not match|didn't match))\b|धोखाधड़ी|ब्लैकलिस्ट|సెటిల్మెంట్|మోసం", re.I)
_SCORE_RX = re.compile(r"(?:score|cibil|स्कोर|స్కోర్)\D{0,20}?\b([3-9]\d\d)\b|\b([3-9]\d\d)\b\s*(?:\+\s*)?(?:credit\s+)?(?:score|cibil)", re.I)


def _local_violations(text: str, decision_turn: bool, own: set, limits: set) -> list[str]:
    out = []
    for m in _CODE_RX.finditer(text or ""):
        tok = m.group(0)
        if tok.isupper() or "-" in tok or tok.lower().startswith("passage") or re.fullmatch(r"P[1-5]", tok):
            out.append("internal_term:" + tok)
    if decision_turn:
        if _HIDDEN_RX.search(text or ""):
            out.append("hidden_flag")
        for m in _SCORE_RX.finditer(text or ""):
            n = m.group(1) or m.group(2)
            if n not in own:
                out.append("score_value:" + n)
        for n in G.numbers_in(text or ""):
            if n in limits:
                out.append("limit_value:" + n)
    return sorted(set(out))


_WI_WORDS = {
    "en": {"monthly_income": "monthly income", "monthly_obligations": "monthly EMIs", "loan_amount": "loan amount",
           "tenure_months": "loan period", "credit_score": "credit score", "employment_months": "time in your job"},
    "hi": {"monthly_income": "मासिक आय", "monthly_obligations": "मासिक EMI", "loan_amount": "लोन राशि",
           "tenure_months": "लोन की अवधि", "credit_score": "क्रेडिट स्कोर", "employment_months": "नौकरी की अवधि"},
    "te": {"monthly_income": "నెలవారీ ఆదాయం", "monthly_obligations": "నెలవారీ EMIలు", "loan_amount": "లోన్ మొత్తం",
           "tenure_months": "లోన్ వ్యవధి", "credit_score": "క్రెడిట్ స్కోర్", "employment_months": "ఉద్యోగంలో ఉన్న కాలం"},
}
_WI_PHRASES = {
    "en": ("that {w} is outside what I can estimate", "I couldn't read the {w} as a number", "number",
           "that change isn't one I can estimate"),
    "hi": ("यह {w} उस दायरे से बाहर है जिसका मैं अनुमान लगा सकता हूँ", "मैं {w} को संख्या के रूप में नहीं पढ़ सका", "संख्या",
           "इस बदलाव का अनुमान मैं नहीं लगा सकता"),
    "te": ("ఆ {w} నేను అంచనా వేయగల పరిధికి బయట ఉంది", "{w}ను సంఖ్యగా చదవలేకపోయాను", "సంఖ్య",
           "ఆ మార్పుకు నేను అంచనా వేయలేను"),
}


def _plain_wi_error(msg: str, locale: str = "en") -> str:
    """An InvalidWhatIf message in plain words: field names as words, never an allowed range or limit."""
    words, (out_of_range, not_number, generic_word, generic) = (_WI_WORDS.get(locale) or _WI_WORDS["en"],
                                                              _WI_PHRASES.get(locale) or _WI_PHRASES["en"])
    m = re.match(r"(\w+) is outside the allowed range", msg)
    if m:
        return out_of_range.format(w=words.get(m.group(1), generic_word))
    m = re.match(r"(\w+) must be a number", msg)
    if m:
        return not_number.format(w=words.get(m.group(1), generic_word))
    if locale in ("hi", "te"):  # the remaining messages are English sentences; say it plainly in the borrower's language
        return generic
    for k, w in words.items():
        msg = msg.replace(k, w)
    return msg


_APP_REF = re.compile(r"\b(?:SYN-LA|APP-TEST|ACC-LOAP-\d{4})-\d+\b|\bSYN-LA-\d+\b", re.I)


def _foreign_ref(msg: str, own: str) -> bool:
    """An application reference in the message that is not the signed-in applicant's own."""
    return any(m.group(0).upper() != (own or "").upper() for m in _APP_REF.finditer(msg or ""))

