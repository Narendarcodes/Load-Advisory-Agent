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
import os
import re
import time
import uuid
from pathlib import Path
from typing import Annotated, TypedDict

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph

from loan_advisory.agent import facts as F
from loan_advisory.agent import observability as obs
from loan_advisory.agent import guards as G
from loan_advisory.agent import prompts as P
from loan_advisory.agent.settings import AgentSettings
from loan_advisory.agent.streaming import JSONFieldStreamer, SentenceGate, remainder, split_sentences
from loan_advisory.agent.citations import labels_of as _labels_of, verify_citations
from loan_advisory.agent.contracts import AgentRequest, AgentResponse, Session
from loan_advisory.agent.llm import LLMError
from loan_advisory.agent.tools import (FrappeUnavailable, InvalidWhatIf, NotAuthorized, UnknownApplication)

INTENTS = ("explain", "improve", "what_if", "policy", "greeting", "other")
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
    ("explain", re.compile(r"why|reason|reject|declin|denied|turned down|explain|what happened|my decision|status|mean", re.I)),
    ("greeting", re.compile(r"^\s*(hi|hello|hey|namaste|namaskar|thanks|thank you|ok|okay)\b", re.I)),
]
# High-precision intents that skip the LLM classifier (AGENT_FAST_CLASSIFY). Used only when exactly ONE matches;
# anything ambiguous still goes to the LLM. English + Hindi + Telugu.
_FAST = [
    ("explain", re.compile(r"\bwhy\b.{0,40}\b(reject\w*|declin\w*|denied|turned down|refused|not approved)\b|"
                           r"क्यों.{0,30}(रिजेक्ट|अस्वीकार|नामंज़ूर|नामंजूर|ख़ारिज|खारिज)|(रिजेक्ट|अस्वीकार|नामंज़ूर|नामंजूर|ख़ारिज|खारिज).{0,30}क्यों|"
                           r"ఎందుకు.{0,30}(తిరస్కర|రిజెక్ట్)|(తిరస్కర|రిజెక్ట్).{0,30}ఎందుకు", re.I)),
    ("improve", re.compile(r"\b(what (can|should) i do|how (can|do) i improve|improve (my|before|so)|before i re-?apply|"
                           r"steps to improve)\b|सुधार|మెరుగుపర", re.I)),
    ("policy", re.compile(r"\b(complain\w*|grievance|ombudsman|key fact statement|kfs)\b|शिकायत|ఫిర్యాదు", re.I)),
    ("what_if", re.compile(r"^\s*(what if|suppose)\b", re.I)),
]
_FAST_NOT = re.compile(r"\b(rate|fee|fees|charges?|interest|offer|bajaj|bank|lender|nbfc|rbi)\b", re.I)


class AgentState(TypedDict, total=False):
    request: dict
    session: dict | None
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


class AdvisoryAgent:
    def __init__(self, decision_tools, llm, policy_tools=None, handoff=None, profile=None, audit_path=None,
                 checkpointer=None, settings: AgentSettings | None = None):
        self.tools, self.llm, self.policy, self.handoff = decision_tools, llm, policy_tools, handoff
        self.settings = settings or AgentSettings.from_env()
        self._streams: dict = {}  # request_id -> {"emit", "spoken", "first_ms"} for sentence streaming (not graph state)
        self.profile = profile or {}
        self.audit_path = Path(audit_path or os.environ.get("AGENT_AUDIT_LOG", "agent_out/turns.jsonl"))
        self._trace_ctx: dict = {}  # request_id -> OTel context of the turn's root span (not stored in graph state)
        self.graph = self._build().compile(checkpointer=checkpointer or MemorySaver())

    # ------------------------------------------------------------------ public API
    def run(self, request: AgentRequest, session: Session | None, trace_context=None, on_sentence=None) -> AgentResponse:
        """Run one turn. `on_sentence(text)` (optional) receives the answer sentence by sentence as soon as each one
        has passed the deterministic guards; together the sentences are exactly the final answer to speak."""
        thread = f"{session.applicant_ref if session else 'anon'}::{request.conversation_id}"  # scoped per applicant
        sess_hash = hashlib.sha256(thread.encode()).hexdigest()[:16]
        with obs.span("advisor.turn", kind="CHAIN", context=trace_context,
                      **{"session.id": sess_hash, "channel": request.channel, "locale": request.locale,
                         "literacy": request.literacy, "input.value": obs.content(request.message)}) as root:
            if root is not None:
                self._trace_ctx[request.request_id] = obs.current_context()
            if on_sentence is not None:
                self._streams[request.request_id] = {"emit": on_sentence, "spoken": [], "first_ms": None, "t0": time.perf_counter()}
            try:
                out = self.graph.invoke({"request": request.model_dump(), "session": session.model_dump() if session else None},
                                        config={"configurable": {"thread_id": thread}})
            finally:
                self._trace_ctx.pop(request.request_id, None)
                self._streams.pop(request.request_id, None)
            resp = AgentResponse(**out["response"])
            if root is not None:
                resp.trace_id = format(root.get_span_context().trace_id, "032x")  # = Phoenix trace id
                obs.set_attrs(root, **{"agent.intent": resp.intent, "agent.action": resp.action, "agent.abstained": resp.abstained,
                                       "agent.guard_flags": resp.guard_flags, "agent.citations": [c.document_id for c in resp.citations],
                                       "agent.evidence_refs": resp.evidence_refs, "agent.total_ms": resp.timings.get("total_ms"),
                                       "output.value": obs.content(resp.answer)})
            return resp

    def _node(self, name, fn):
        """Wrap a graph node in an OTel span parented to the turn's root span."""
        def wrapped(s):
            ctx = self._trace_ctx.get((s.get("request") or {}).get("request_id"))
            with obs.span(f"node.{name}", kind="CHAIN", context=ctx, **{"graph.node": name}) as sp:
                out = fn(s)
                if sp is not None and isinstance(out, dict):
                    obs.set_attrs(sp, **{f"graph.{k}": out[k] for k in ("status", "intent", "action", "attempts", "abstained") if k in out},
                                  **({"graph.guard_flags": out["guard_flags"]} if out.get("guard_flags") else {}),
                                  **({"graph.request_flags": out["flags"]} if out.get("flags") else {}))
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
        return self._streams.get((s.get("request") or {}).get("request_id"))

    def _emit(self, s, text: str):
        st = self._stream(s)
        if st is None or not text.strip():
            return
        st["spoken"].append(text)
        if st["first_ms"] is None:
            st["first_ms"] = round((time.perf_counter() - st["t0"]) * 1000, 1)
        try:
            st["emit"](text)
        except Exception:  # a broken listener must never break the turn
            pass

    def _allowed(self, s) -> set:
        req, intent = self._req(s), s.get("intent")
        allowed = F.grounded_numbers(s.get("record"), extra=G.numbers_in(req.message))
        if intent == "what_if" and s.get("what_if") and "record" in s["what_if"]:
            allowed |= F.grounded_numbers(s["what_if"]["record"], extra=list(s["what_if"]["changes"].values()))
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
        return {"t0": t0, "deadline": t0 + self.settings.deadline_for(self._req(s).channel), "prefetched": None,
                "trace": [{"node": "receive", "t_ms": 0.0}], "status": None, "flags": [],
                "intent": None, "wi_changes": None, "record": None, "what_if": None, "plan": None, "passages": [],
                "retrieval": None, "draft": None, "abstained": False, "cited": [], "guard_flags": [], "attempts": 0,
                "fallback_used": False, "action": None, "handoff_ref": None, "response": None}

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
        req = self._req(s)
        flags = G.request_flags(req.message, req.application_ref)
        if req.application_ref and DISPUTE.search(req.message) and not flags:
            flags = ["dispute"]
        if flags:
            self._ev(s, "classify", intent="boundary", flags=flags, by="guard")
            return {"intent": "boundary", "flags": flags, "trace": s["trace"]}
        if self.settings.fast_classify_for(req.channel):
            fast = _fast_intent(req.message)
            if fast is not None:
                intent, changes = fast
                self._ev(s, "classify", intent=intent, by="fast")
                return {"intent": intent, "wi_changes": changes, "trace": s["trace"]}
        values, pre = {}, None
        if req.application_ref:
            try:
                rec = self.tools.get_decision_evidence(req.application_ref, self._session(s))
                pre = {"record": rec}
                values = ((rec or {}).get("inputs") or {}).get("values") or {}
            except Exception:
                values = {}
        hist = [f"{h['role']}: {h['text'][:200]}" for h in (s.get("history") or [])[-4:]]
        intent, changes, by = None, None, "llm"
        try:
            j = self.llm.chat_json("You are a precise intent classifier. Output JSON only.",
                                   P.CLASSIFY.format(values=json.dumps(values), history=json.dumps(hist, ensure_ascii=False),
                                                     message=req.message), max_tokens=400, tag="classify",
                                   **self._llm_kw(s, self.settings.classify_budget_s))
            intent = j.get("intent") if j.get("intent") in INTENTS else None
            changes = j.get("what_if_changes") or None
        except (LLMError, AttributeError):
            intent = None
        if intent is None:
            by = "rules"
            intent = next((name for name, rx in _RULES if rx.search(req.message)), "other")
            changes = _regex_changes(req.message) if intent == "what_if" else None
        self._ev(s, "classify", intent=intent, by=by)
        return {"intent": intent, "wi_changes": changes, "prefetched": pre, "trace": s["trace"]}

    def load_evidence(self, s):
        req, sess = self._req(s), self._session(s)
        if not req.application_ref:
            return {"status": "no_app"}
        try:
            pre = s.get("prefetched")  # fetched (authorized) by classify earlier in this same turn
            rec = pre["record"] if pre else self.tools.get_decision_evidence(req.application_ref, sess)
        except NotAuthorized:
            return {"status": "not_authorized"}
        except UnknownApplication:
            return {"status": "not_authorized"}
        except FrappeUnavailable:
            return {"status": "unavailable"}
        if rec is None:
            st = "no_decision"
        elif rec.get("lifecycle_state") == "INFO_REQUESTED" or rec.get("decision") == "ERROR" and rec.get("lifecycle_state") != "MANUAL_REVIEW":
            st = "info_requested"
        elif rec.get("lifecycle_state") == "MANUAL_REVIEW":
            st = "manual_review"
        elif rec.get("decision") == "APPROVED":
            st = "approved" if s["intent"] != "what_if" else "ok"
        else:
            st = "ok"
        self._ev(s, "get_decision_evidence", status=st, record_id=(rec or {}).get("record_id"))
        return {"record": rec, "status": st, "trace": s["trace"]}

    def plan(self, s):
        req = self._req(s)
        p = self.tools.improvement_plan(req.application_ref, self._session(s), s["record"])
        self._ev(s, "run_what_if", kind="improvement_plan", steps=len(p["steps"]))
        return {"plan": p, "trace": s["trace"]}

    def what_if(self, s):
        req = self._req(s)
        vals = (s["record"].get("inputs") or {}).get("values") or {}
        try:
            changes = _absolute_changes(s.get("wi_changes") or {}, vals)
            w = self.tools.run_what_if(req.application_ref, self._session(s), changes)
        except InvalidWhatIf as e:
            self._ev(s, "run_what_if", error=str(e))
            return {"status": "bad_what_if", "what_if": {"error": str(e)}, "trace": s["trace"]}
        self._ev(s, "run_what_if", changes=w["changes"], simulated=w["simulated_decision"],
                 original_unchanged=w["original_record_unchanged"])
        return {"what_if": w, "trace": s["trace"]}

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
            tmpl = {"explain": P.EXPLAIN, "improve": P.IMPROVE, "what_if": P.WHAT_IF}[intent]
            system = tmpl.format(style=style, lang=lang, voice=voice, facts=json.dumps(facts, ensure_ascii=False, indent=1)) + retry
            if req.channel == "voice":
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
            return {"draft": txt, "attempts": attempts, "action": "simulate" if intent == "what_if" else "answer"}
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
        if not ab and mode in ("verify", "spans", "spans_verify"):
            cited, dropped = verify_citations(ans, j, s["passages"], mode)
            if dropped:
                self._ev(s, "verify_citations", kept=cited, dropped=dropped)
        if not ab and mode == "llm_verify" and cited and self._left(s) >= self.settings.verify_min_left_s:
            cited = self._llm_verify_citations(s, req, ans, cited)
        return {"draft": ans, "abstained": ab, "cited": cited, "attempts": attempts, "action": "answer"}

    def _llm_verify_citations(self, s, req, ans, cited):
        """Post-hoc citation verification by a focused LLM call: keep the passages that directly state the answer's
        facts (may add an uncited passage that states them). Falls back to the model's own labels on any failure."""
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
        out = list(dict.fromkeys(got)) or cited
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
        self._ev(s, "validate", flags=flags, attempt=s.get("attempts"))
        return {"guard_flags": flags, "trace": s["trace"]}

    def _after_validate(self, s):
        if s.get("guard_flags") and s.get("attempts", 0) < 2:
            if self._left(s) >= self.settings.min_compose_s:
                return "compose"
        return "finalize"  # finalize marks "deadline" when a rewrite was skipped for lack of time

    def boundary(self, s):
        req, sess = self._req(s), self._session(s)
        flags = s["flags"]
        key = next(k for k in ("injection", "other_applicant", "dispute", "override", "edit_record", "auto_submit", "guarantee")
                   if k in flags)
        out = {"action": "refuse", "abstained": key in ("guarantee",)}
        if key == "dispute":
            ref = self.handoff.create("data_dispute", [req.application_ref], req.message) if self.handoff else None
            out.update(action="handoff", handoff_ref=ref, draft=P.template("dispute", req.locale, ref=ref or "pending"))
        else:
            out["draft"] = P.template(key, req.locale)
        if key == "guarantee" and req.application_ref:
            try:  # still useful: attach the deterministic improvement plan (hypothetical, labelled)
                rec = self.tools.get_decision_evidence(req.application_ref, sess)
                if rec and rec.get("decision") == "REJECTED":
                    out["record"] = rec
                    out["plan"] = self.tools.improvement_plan(req.application_ref, sess, rec)
            except Exception:
                pass
        self._ev(s, "boundary", kind=key)
        return {**out, "trace": s["trace"]}

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
            missing = (rec.get("inputs") or {}).get("missing_fields") or ["details flagged as invalid"]
            txt, action = P.template("info_requested", missing=", ".join(m.replace("_", " ") for m in missing)), "clarify"
        elif st == "manual_review":
            txt, action = P.template("manual_review", flags=", ".join(rec.get("flags") or ["flagged for review"])), "handoff"
        elif st == "approved":
            txt = P.template("approved")
        elif st == "bad_what_if":
            txt, action = P.template("bad_what_if", why=s["what_if"]["error"]), "clarify"
        else:
            txt = P.template("greeting" if s.get("intent") == "greeting" else "other", req.locale)
        declined = st in ("no_decision", "unavailable") or (st in (None, "ok") and s.get("intent") == "other")
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
        if intent in ("explain", "improve", "what_if", "policy") and s.get("status") in (None, "ok") and (draft is None or gflags):
            s["guard_flags"] = gflags
            draft, fallback = self._fallback(s), True
            if intent == "policy":
                s["abstained"], s["cited"] = True, []
        if draft and intent in ("explain", "improve", "what_if") and s.get("status") in (None, "ok") \
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
        card = F.decision_card(s["record"]) if s.get("record") else None
        cites = []
        if intent == "policy" and not s.get("abstained"):
            by_label = {p["label"]: p for p in s.get("passages") or []}
            cites = [by_label[c]["citation"] for c in s.get("cited") or [] if c in by_label]
        missing = []
        if s.get("status") == "info_requested":
            missing = ((s.get("record") or {}).get("inputs") or {}).get("missing_fields") or []
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
            request_id=req.request_id, trace_id=trace_id, intent=intent if intent in ("explain", "improve", "what_if", "policy", "boundary", "greeting") else "other",
            action=s.get("action") or "answer", answer=draft or "", abstained=bool(s.get("abstained")), citations=cites,
            evidence_refs=[x for x in [(s.get("record") or {}).get("record_id"), (wi or {}).get("record", {}).get("record_id") if wi and "record" in wi else None] if x],
            missing_information=missing, handoff_ref=s.get("handoff_ref"), decision_card=card,
            improvement_plan=[{k: v for k, v in st.items() if k in ("rule_id", "task", "target_display", "gap_display", "general_guidance",
                                                                      "guidance_source", "rule_passes_after_change")} for st in plan_steps],
            what_if=({k: v for k, v in wi.items() if k != "record"} if wi else None),
            guard_flags=gflags + (["fallback_template"] if fallback else []), timings=timings)
        self._audit(s, resp)
        hist = [{"role": "user", "text": req.message}, {"role": "assistant", "text": resp.answer[:600]}]
        if hasattr(self.llm, "calls"):
            self.llm.calls.clear()
        return {"response": resp.model_dump(), "history": hist}

    # ------------------------------------------------------------------ facts / fallback / audit
    def _facts(self, s):
        rec = s["record"]
        base = {"recorded_decision": rec["decision"], "application_ref": rec["application_ref"],
                "policy": F.SYNTHETIC_LABEL, "failed_rules_the_only_reasons": F.reason_facts(rec),
                "passed_rules_not_reasons": F.passed_facts(rec)}
        if s["intent"] == "improve":
            p = s["plan"]
            base["tasks"] = [{k: v for k, v in t.items() if k in ("name", "rule_id", "task", "target_display", "gap_display", "general_guidance", "alt")}
                             for t in p["steps"]]
            if p.get("all_changes_together") and p["all_changes_together"]["simulated_decision"] == "APPROVED":
                base["all_changes_together"] = {"would_pass_all_checks_in_simulation": True, "label": p["all_changes_together"]["label"]}
        if s["intent"] == "what_if":
            w = s["what_if"]
            before = {e["rule_id"]: e["result"] for e in rec["rule_evaluations"]}
            after_vals = {e["rule_id"]: F._display(e["rule_id"], e["actual_value"]) for e in w["record"]["rule_evaluations"]}
            base["what_if"] = {"hypothetical_changes": {k: (F.inr(v) if k in ("monthly_income", "monthly_obligations") else v) for k, v in w["changes"].items()},
                               "checks": [{"rule": F.RULE_PLAIN[r]["name"], "recorded_result": before.get(r), "hypothetical_result": res,
                                           "hypothetical_value": after_vals.get(r)} for r, res in w["rule_results"].items()],
                               "hypothetical_outcome_under_synthetic_policy": "would pass all checks" if w["simulated_decision"] == "APPROVED" else "would still fail at least one check",
                               "original_application_unchanged": w["original_record_unchanged"], "label": w["label"]}
        return base

    def _fallback(self, s):
        req, intent = self._req(s), s["intent"]
        if intent == "policy":
            busy = "deadline" in (s.get("guard_flags") or []) or "llm_error" in (s.get("guard_flags") or [])
            return P.template("policy_busy" if busy else "policy_abstain", req.locale)
        rec = s["record"]
        lines = []
        if intent == "explain":
            lines.append(f"Your application's recorded decision is {rec['decision']} under a {F.SYNTHETIC_LABEL}.")
            for r in F.reason_facts(rec):
                lines.append(f"- {r['name']}: yours is {r['your_value']}; the policy needs {r['required']}.")
            if F.passed_facts(rec):
                lines.append("The other checks were met.")
            lines.append("I can show what would need to change, or answer questions.")
        elif intent == "improve":
            lines.append(f"Under the {F.SYNTHETIC_LABEL}:")
            for i, t in enumerate(s["plan"]["steps"], 1):
                lines.append(f"{i}. {t['task']} General guidance (not lender policy): {t['general_guidance']}")
            c = s["plan"].get("all_changes_together")
            if c and c["simulated_decision"] == "APPROVED":
                lines.append("In a what-if simulation, these changes together would pass all four checks. This is a simulation, not a guarantee; a lender decides on a fresh application.")
            lines.append("Come back with your new numbers and I'll re-run the what-if.")
        elif intent == "what_if":
            w = s["what_if"]
            lines.append(f"What-if only (your application and decision are unchanged), under the {F.SYNTHETIC_LABEL}:")
            for r, res in w["rule_results"].items():
                lines.append(f"- {F.RULE_PLAIN[r]['name']}: {res}")
            lines.append("With these numbers the simulation " + ("passes all checks" if w["simulated_decision"] == "APPROVED" else "still fails at least one check") + ". This is not a decision or a guarantee.")
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
            self.audit_path.parent.mkdir(parents=True, exist_ok=True)
            with self.audit_path.open("a") as f:
                f.write(json.dumps(row, default=str) + "\n")
        except OSError:
            pass

    # ------------------------------------------------------------------ wiring
    def _build(self):
        g = StateGraph(AgentState)
        for name in ("receive", "authenticate", "classify", "load_evidence", "plan", "what_if", "retrieve_policy",
                     "compose", "validate", "boundary", "simple", "finalize"):
            g.add_node(name, self._node(name, getattr(self, name)))
        g.add_edge(START, "receive")
        g.add_edge("receive", "authenticate")
        g.add_conditional_edges("authenticate", lambda s: "simple" if s.get("status") in ("not_authorized", "unavailable") else "classify",
                                ["simple", "classify"])
        g.add_conditional_edges("classify", _after_classify, ["boundary", "load_evidence", "retrieve_policy", "simple"])
        g.add_conditional_edges("load_evidence", _after_evidence, ["compose", "plan", "what_if", "simple"])
        g.add_edge("plan", "compose")
        g.add_conditional_edges("what_if", lambda s: "simple" if s.get("status") == "bad_what_if" else "compose", ["simple", "compose"])
        g.add_edge("retrieve_policy", "compose")
        g.add_edge("compose", "validate")
        g.add_conditional_edges("validate", self._after_validate, ["compose", "finalize"])
        g.add_edge("boundary", "finalize")
        g.add_edge("simple", "finalize")
        g.add_edge("finalize", END)
        return g


def _after_classify(s):
    i = s["intent"]
    if i == "boundary":
        return "boundary"
    if i in ("explain", "improve", "what_if"):
        return "load_evidence"
    if i == "policy":
        return "retrieve_policy"
    return "simple"


def _after_evidence(s):
    if s.get("status") != "ok":
        return "simple"
    return {"explain": "compose", "improve": "plan", "what_if": "what_if"}[s["intent"]]


def _absolute_changes(raw: dict, values: dict) -> dict:
    out = {}
    for k, spec in (raw or {}).items():
        if k not in F.SCORED:
            raise InvalidWhatIf(f"{k} cannot be simulated")
        if isinstance(spec, (int, float)):
            out[k] = spec
        elif isinstance(spec, dict) and "set" in spec:
            out[k] = spec["set"]
        elif isinstance(spec, dict) and "delta" in spec:
            if values.get(k) is None:
                raise InvalidWhatIf(f"no recorded value for {k} to change")
            out[k] = float(values[k]) + float(spec["delta"])
        else:
            raise InvalidWhatIf(f"could not read the change for {k}")
    if not out:
        raise InvalidWhatIf("I couldn't tell which number to change")
    return out


_WI = [("credit_score", re.compile(r"(?:credit\s*score|cibil|score)\D{0,20}(\d{3})", re.I)),
       ("employment_months", re.compile(r"(\d{1,3})\s*months?", re.I)),
       ("monthly_obligations", re.compile(r"(?:emi|emis|obligations?)\D{0,25}(?:₹\s?)?(\d[\d,]*)", re.I)),
       ("monthly_income", re.compile(r"(?:income|salary|earn)\D{0,25}(?:₹\s?)?(\d[\d,]*)", re.I))]


def _regex_changes(msg: str) -> dict | None:
    out = {}
    for field, rx in _WI:
        m = rx.search(msg)
        if m:
            out[field] = {"set": float(m.group(1).replace(",", ""))}
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
