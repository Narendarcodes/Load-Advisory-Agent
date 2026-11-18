"""A tool-calling agent core.

The agent is not a fixed intent router: it reads the applicant's message, decides which read it
needs, calls that tool against the live data (Frappe via DecisionTools / the policy retriever),
and answers from what came back. The graph keeps only the deterministic safety guards and the
final output check; the "what do I need to know" decision belongs to the model.

Tool results are data, never instructions: the system prompt says so, and every tool re-checks
ownership server-side, so a hallucinated application reference cannot read anything.
"""
import json

from loan_advisory.agent import facts as F
from loan_advisory.agent.prompts import CORE_RULES, disclosure_block
from loan_advisory.agent.streaming import SentenceGate

TOOL_SCHEMAS = [
    {"type": "function", "function": {
        "name": "get_applicant_profile",
        "description": "The applicant's OWN record: name, applicant reference, application reference, loan amount, "
                       "loan period, product and status. Call it when they ask who they are, their name, or their "
                       "loan details.",
        "parameters": {"type": "object", "properties": {}}}},
    {"type": "function", "function": {
        "name": "get_decision_evidence",
        "description": "The recorded assessment of the applicant's application: the outcome in plain words, the "
                       "applicant's own recorded values (income, monthly EMIs, credit score, months in the job), EVERY "
                       "check with its result, the applicant's value and the requirement it was measured against, and "
                       "any offer. Call it whenever the question is about the decision, the reason, their numbers, a "
                       "check, the EMI or what to do next.",
        "parameters": {"type": "object", "properties": {}}}},
    {"type": "function", "function": {
        "name": "search_policy",
        "description": "Search the lender's policy documents for a rule, fee, charge, document, process or timeline. "
                       "Returns numbered passages you must cite.",
        "parameters": {"type": "object", "properties": {"query": {"type": "string", "description": "what to look up"}},
                       "required": ["query"]}}},
    {"type": "function", "function": {
        "name": "run_what_if",
        "description": "Re-check the applicant's details under a HYPOTHETICAL change (monthly income, monthly EMIs, "
                       "loan amount or loan period). This is a practice check, not a new decision.",
        "parameters": {"type": "object", "properties": {
            "changes": {"type": "object", "description": "field -> a number. Use {\"set\": value} for an absolute "
                                                          "value, or {\"delta\": number} for a change from the recorded "
                                                          "value (negative = decrease)."}},
            "required": ["changes"]}}},
    {"type": "function", "function": {
        "name": "create_human_handoff",
        "description": "Ask a person to review the application. Call it when the applicant asks for a human, a "
                       "review, a recheck or a call back.",
        "parameters": {"type": "object", "properties": {"message": {"type": "string"}},
                       "required": ["message"]}}},
]

AGENT_BODY = """You are Saral, the adviser on one applicant's own loan application.
The applicant's basic record (name, references, loan amount, loan period, product and status) has ALREADY been
retrieved for you and is in the conversation. Use it directly: never say you cannot see it, and never ask the
applicant to repeat something you already hold.
Decide what else you need and call a tool for it:
1. A question about the recorded decision, the reason, their numbers, a check, the EMI, or what to do next ->
   call get_decision_evidence. It returns their own values and EVERY check with its result, their value and the
   requirement. Answer from it: name each failed check, then the ones that passed, with the two numbers.
2. A question about a rate, fee, charge, document, process, complaint or another lender's terms -> call search_policy
   and answer from the passages, citing them.
3. A hypothetical change ("what if I earn more", "if I close an EMI") -> call run_what_if.
4. They ask for a person, a review, a recheck or a call back -> call create_human_handoff.
5. Anything else -> answer directly and briefly.
When you report a check: say in everyday words what was checked, give their value and the requirement, and say
whether it passed. Do not hide a limit that is in the tool result and do not invent one that is not. Never ask the
applicant to restate what you already hold. When you call a tool, send ONLY the tool call — no prose, no preamble;
write the whole answer in the next turn. Answer in the applicant's language, in plain text only.
"""
AGENT_TASK = CORE_RULES + disclosure_block() + AGENT_BODY


def agent_task(strict: bool | None = None) -> str:
    from loan_advisory.agent.prompts import disclosure_mode
    return CORE_RULES + disclosure_block(strict if strict is not None
                                         else disclosure_mode() == "strict") + AGENT_BODY

MAX_STEPS = 4


def _profile(agent, req, sess):
    doc = agent.tools.owned_doc(req.application_ref, sess)
    return {
        "applicant_name": doc.get("applicant_name") or (sess.applicant_name if sess else None),
        "applicant_ref": doc.get("applicant"),
        "application_ref": req.application_ref,
        "loan_amount": doc.get("loan_amount"),
        "tenure_months": doc.get("repayment_periods") or doc.get("loan_tenure_months"),
        "product": doc.get("loan_product"),
        "status": doc.get("status"),
    }


def _evidence(rec, locale):
    """Everything recorded about this applicant's own assessment: their values, every check with its result, the
    requirement it was measured against, the offer. Their data is theirs; nothing here is withheld from them."""
    if rec is None:
        return {"decision": None, "note": "no recorded decision yet"}
    out = {"decision": rec.get("decision"), "outcome_plain": F.outcome_plain(rec, locale),
           "application_ref": rec.get("application_ref")}
    reason = F.main_reason(rec, locale)
    if reason:
        out["main_reason"] = reason["plain"]
    details = {k: v for k, v in F.application_details(rec).items() if v is not None}
    details.update(F.your_values(rec))
    if details:
        out["your_values"] = details
    failed = [{k: v for k, v in f.items()
               if k in ("name", "what_it_measures_simple", "your_value", "required")}
              for f in F.reason_facts(rec)]
    passed = [{"name": p.get("name"), "your_value": p.get("your_value")} for p in F.passed_facts(rec)]
    if failed:
        out["checks_failed"] = failed
    if passed:
        out["checks_passed"] = passed
    not_checked = [e for e in rec.get("rule_evaluations") or [] if e.get("result") not in ("PASS", "FAIL")]
    if not_checked:
        out["checks_not_run"] = [F.RULE_PLAIN.get(e.get("rule_id"), {}).get("name", e.get("rule_name"))
                                 for e in not_checked]
    offer = F.offer_plain(rec)
    if offer:
        out["offer"] = offer
    return out


def run_tool(agent, name, args, req, sess, s):
    """Execute one tool call. Every read re-checks ownership; the application is the authorised one."""
    args = args or {}
    try:
        if name == "get_applicant_profile":
            if not req.application_ref:
                return {"error": "no application is open in this conversation"}
            out = _profile(agent, req, sess)
            s["profile"] = out
            return out
        if name == "get_decision_evidence":
            if not req.application_ref:
                return {"error": "no application is open in this conversation"}
            rec, _, _ = agent._decision(req, sess, s.get("decision_cache"))
            s["record"] = rec
            return _evidence(rec, req.locale)
        if name == "search_policy":
            if agent.policy is None:
                return {"error": "policy search is unavailable in this mode"}
            passages, meta = agent.policy.search(args.get("query", ""), historical=False)
            return {"passages": [{"label": p["label"], "text": p["text"],
                                  "title": (p.get("citation") or {}).get("title"),
                                  "section": (p.get("citation") or {}).get("section")}
                                 for p in passages]}
        if name == "run_what_if":
            if not req.application_ref:
                return {"error": "no application is open in this conversation"}
            rec = s.get("record")
            if rec is None:
                rec, _, _ = agent._decision(req, sess, s.get("decision_cache"))
            changes = args.get("changes") or {}
            if not changes:
                return {"error": "no hypothetical change given"}
            # the model sometimes adds a "reason" note or uses a synonym; map and ignore both
            aliases = {"monthly_emis": "monthly_obligations", "emis": "monthly_obligations",
                       "income": "monthly_income", "salary": "monthly_income", "amount": "loan_amount",
                       "tenure": "tenure_months", "loan_period": "tenure_months", "period": "tenure_months"}
            ignore = {"reason", "note", "explanation", "comment", "why"}
            base = (((rec or {}).get("inputs") or {}).get("values") or {})
            clean = {}
            for k, v in changes.items():
                if k in ignore:
                    continue
                key = aliases.get(k, k)
                if isinstance(v, dict):
                    if "set" in v:
                        clean[key] = v["set"]
                    elif "delta" in v:
                        if base.get(key) is None:
                            return {"error": f"cannot apply a relative change to {key} without a recorded value"}
                        clean[key] = float(base[key]) + float(v["delta"])
                    else:
                        return {"error": f"{k} must use set or delta"}
                else:
                    clean[key] = v
            if not clean:
                return {"error": "no hypothetical change given"}
            w = agent.tools.run_what_if(req.application_ref, sess, clean, record=rec)
            s["what_if"] = w
            out = {"changes": w.get("changes"), "simulated_decision": w.get("simulated_decision"),
                   "is_simulation": True, "label": w.get("label")}
            if w.get("reason_categories"):
                out["reason_categories"] = list(w["reason_categories"])
            if w.get("offer"):
                out["offer"] = w["offer"]
            return out
        if name == "create_human_handoff":
            refs = [req.application_ref] if req.application_ref else []
            ref = agent.handoff.create("human_review", refs, args.get("message", ""), req.request_id)
            return {"handoff_ref": ref, "category": "human_review"}
        return {"error": f"unknown tool {name}"}
    except Exception as e:  # a tool failure is data for the model, never a crash
        return {"error": f"{type(e).__name__}: {str(e)[:200]}"}


def _gate(agent, s):
    """Sentence-level streaming behind the answer guards, or None when this turn is not being streamed.

    Rebuilt on every model step so the numbers the gate treats as grounded include the ones the tool results just
    brought in (the applicant's own values and the limits they were measured against).
    """
    try:
        if agent._stream(s) is None:
            return None
        return SentenceGate(agent._allowed(s), lambda t: agent._emit(s, t))
    except Exception:  # streaming is optional: a failure here must not stop the answer
        return None


def run_agent(agent, s):
    """The tool-calling loop. Returns (draft, tool_names_used, record, profile).

    The applicant's basic record is read once up front (so the model never asks for what it already has); anything
    else is fetched on demand by a tool. The final answer streams sentence by sentence through the graph's guarded
    emitter as the model writes it.
    """
    req, sess = agent._req(s), agent._session(s)
    history = [{"role": h["role"], "content": h["text"]} for h in (s.get("history") or [])[-6:]]
    if req.application_ref and s.get("profile") is None:
        try:
            s["profile"] = _profile(agent, req, sess)
        except Exception:  # a failed pre-read is not fatal: the model can call the tool for it
            s["profile"] = None
    system = agent_task()
    if s.get("profile"):
        system += ("\nAPPLICANT RECORD (already retrieved — use these values, never ask for them again):\n"
                   + json.dumps(s["profile"], ensure_ascii=False, default=str))
    messages = [{"role": "system", "content": system}] + history + [{"role": "user", "content": req.message}]
    used = []
    draft = None
    for _ in range(MAX_STEPS):
        gate = _gate(agent, s)
        tc = agent.llm.chat_tools(system, req.message, TOOL_SCHEMAS, max_tokens=1400, tag="agent",
                                  deadline=s.get("deadline"), messages=messages,
                                  on_delta=gate.push if gate is not None else None)
        if tc.has_calls:
            # the model asked for data: record the calls and their results, then let it continue
            messages.append({"role": "assistant", "content": tc.text or None,
                             "tool_calls": [{"id": c["id"] or f"call_{i}", "type": "function",
                                            "function": {"name": c["name"], "arguments": c["arguments"]}}
                                           for i, c in enumerate(tc.calls)]})
            for i, call in enumerate(tc.calls):
                used.append(call["name"])
                try:
                    args = json.loads(call["arguments"]) if call["arguments"] else {}
                except ValueError:
                    args = {}
                result = run_tool(agent, call["name"], args, req, sess, s)
                messages.append({"role": "tool", "tool_call_id": call["id"] or f"call_{i}",
                                 "content": json.dumps(result, ensure_ascii=False, default=str)})
            continue
        draft = tc.text
        if gate is not None:
            gate.close()  # release the tail sentence
        break
    return draft, used, s.get("record"), s.get("profile")
