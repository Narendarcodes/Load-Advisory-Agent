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
from loan_advisory.agent.prompts import CORE_RULES, DECISION_AUTHORITY, DISCLOSURE, PLAIN_LANGUAGE

TOOL_SCHEMAS = [
    {"type": "function", "function": {
        "name": "get_applicant_profile",
        "description": "The applicant's OWN record: name, applicant reference, application reference, loan amount, "
                       "loan period, product and status. Call it when they ask who they are, their name, or their "
                       "loan details.",
        "parameters": {"type": "object", "properties": {}}}},
    {"type": "function", "function": {
        "name": "get_decision_evidence",
        "description": "The recorded decision for the applicant's application: the outcome in plain words, the one "
                       "reason category and any offer. Call it when they ask what happened, why, or their status.",
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
            "changes": {"type": "object", "description": "field -> {set: number} or {delta: number}"}},
            "required": ["changes"]}}},
    {"type": "function", "function": {
        "name": "create_human_handoff",
        "description": "Ask a person to review the application. Call it when the applicant asks for a human, a "
                       "review, a recheck or a call back.",
        "parameters": {"type": "object", "properties": {"message": {"type": "string"}},
                       "required": ["message"]}}},
]

AGENT_TASK = CORE_RULES + DECISION_AUTHORITY + DISCLOSURE + PLAIN_LANGUAGE + """
You are a real assistant talking to one loan applicant. The applicant's message is the last user turn.
Work it out, do not pattern-match it:
1. If the answer needs the applicant's OWN details (name, references, loan amount, loan period, status) or the
   recorded decision, call get_applicant_profile or get_decision_evidence and wait for the result.
2. If it is a general question about a rule, fee, charge, document or process, call search_policy and answer from
   the passages, citing them.
3. If it is a hypothetical change ("what if I earn more", "if I close an EMI"), call run_what_if.
4. If they ask for a person, a review or a call back, call create_human_handoff.
5. Otherwise answer directly and briefly.
Never invent a value or a rule: if no tool result covers it, say so and offer a human review. Answer in the
applicant's language, in at most 60 words, plain text only. The applicant has already been told the application
reference; do not repeat it unless they ask.
"""

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
    if rec is None:
        return {"decision": None, "note": "no recorded decision yet"}
    out = {"decision": rec.get("decision"), "outcome_plain": F.outcome_plain(rec, locale),
           "application_ref": rec.get("application_ref")}
    reason = F.main_reason(rec, locale)
    if reason:
        out["main_reason"] = reason["plain"]
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
            w = agent.tools.run_what_if(req.application_ref, sess, changes, record=rec)
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


def run_agent(agent, s):
    """The tool-calling loop. Returns (draft, tool_names_used, record, profile)."""
    req, sess = agent._req(s), agent._session(s)
    history = [{"role": h["role"], "content": h["text"]} for h in (s.get("history") or [])[-6:]]
    messages = [{"role": "system", "content": AGENT_TASK}] + history + [{"role": "user", "content": req.message}]
    used = []
    draft = None
    for _ in range(MAX_STEPS):
        tc = agent.llm.chat_tools(AGENT_TASK, req.message, TOOL_SCHEMAS, max_tokens=1100, tag="agent",
                                  deadline=s.get("deadline"), messages=messages)
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
        break
    return draft, used, s.get("record"), s.get("profile")
