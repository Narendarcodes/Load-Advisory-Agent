"""Agent-eval fixes (Golden B dev eval + Langfuse cases B/D): route first, a fixed tool plan per intent, the decision
fetched once per conversation, plain reasons, the final output check, the what-if cap and v2 simulation, and the new
human_review / distress / misrepresentation / vague intents. Offline, scripted LLM."""
import json

import pytest

from loan_advisory.agent import facts as F
from loan_advisory.agent.contracts import AgentRequest, Session
from loan_advisory.agent.intent_router import KeywordRouter, LayaRouterAdapter, build_routers
from loan_advisory.agent.settings import AgentSettings
from loan_advisory.agent.tools import DecisionTools, HandoffQueue, InMemoryEvidenceSource
from tests.test_agent_graph import FakePolicy, ScriptedLLM, agent_for, ask


class ToolLog:
    def __init__(self, ag):
        self.calls = []
        for m in ("authorize", "get_application_summary", "get_decision_evidence", "run_what_if", "improvement_plan"):
            self._wrap(ag.tools, m, m)
        self._wrap(ag.handoff, "create", "create_human_handoff")
        if ag.policy is not None:
            self._wrap(ag.policy, "search", "search_approved_policy")

    def _wrap(self, obj, method, name):
        fn = getattr(obj, method)

        def w(*a, **kw):
            self.calls.append(name)
            return fn(*a, **kw)
        setattr(obj, method, w)

    def take(self):
        out, self.calls = self.calls, []
        return out


def _agent(llm, tmp_path, policy=None):
    ag, store, sink = agent_for(llm, policy, tmp_path=tmp_path)
    return ag, store, sink, ToolLog(ag)


# ------------------------------------------------------------------ fix 1: route first, fixed tool plan per intent
def test_policy_greeting_and_thanks_turns_never_read_the_decision(tmp_path):
    llm = ScriptedLLM(intent="policy")
    ag, _, _, tl = _agent(llm, tmp_path, FakePolicy())
    ask(ag, "How do I file a complaint?")
    assert tl.take() == ["authorize", "search_approved_policy"]
    ask(ag, "Thank you so much.")
    assert tl.take() == ["authorize"]
    ask(ag, "Hi")
    assert tl.take() == ["authorize"]
    assert not any(p[0] == "classify" and "custom_" in p[2] for p in llm.prompts)


def test_decision_is_fetched_once_and_reused_until_its_stamp_changes(tmp_path):
    llm = ScriptedLLM(intent="explain", compose="We can't approve this application right now. Synthetic example rules.")
    ag, store, sink, tl = _agent(llm, tmp_path)
    reads = []
    real = ag.tools.evidence.latest

    def counted(ref, doc):
        reads.append(ref)
        return real(ref, doc)
    ag.tools.evidence.latest = counted
    ask(ag, "Why was my loan rejected?", conv="cache-1")
    ask(ag, "Explain again please, why was it rejected?", conv="cache-1")
    assert tl.take() == ["authorize", "get_decision_evidence"] * 2  # the plan step runs every decision turn...
    assert len(reads) == 1  # ...but the evidence record is read once
    # a new evaluation changes the version stamp: the next turn reads the new record
    rec = dict(sink.records[sink.latest_ids["APP-TEST-005"]])
    rec["record_id"] = "rec-new"
    sink.records["rec-new"] = rec
    sink.latest_ids["APP-TEST-005"] = "rec-new"
    r = ask(ag, "Why was my loan rejected?", conv="cache-1")
    assert len(reads) == 2 and r.evidence_refs == ["rec-new"]
    # another conversation starts with its own read
    ask(ag, "Why was my loan rejected?", conv="cache-2")
    assert len(reads) == 3


def test_decision_cache_events_reach_the_audit_row(tmp_path):
    ag, _, _, _ = _agent(ScriptedLLM(intent="explain", compose="We can't approve this right now. Synthetic rules."), tmp_path)
    ask(ag, "Why was my loan rejected?", conv="aud")
    ask(ag, "Why was my loan rejected?", conv="aud")
    rows = [json.loads(x) for x in ag.audit_path.read_text(encoding="utf-8").splitlines()]
    caches = [e.get("cache") for r in rows for e in r["events"] if e["node"] == "get_decision_evidence"]
    assert caches == ["miss", "hit"]


@pytest.mark.parametrize("msg,expected,action", [
    ("Okay, can a person look at my case?", ["authorize", "create_human_handoff"], "handoff"),
    ("किसी इंसान से बात करवा दीजिए।", ["authorize", "create_human_handoff"], "handoff"),
    ("What if I put my old company's joining date instead? Would it pass then?", ["authorize"], "refuse"),
    ("Toh main salaried likh deta hoon, chalega?", ["authorize"], "refuse"),
    ("Can you pull my CIBIL again right now? Maybe it updated.", ["authorize"], "refuse"),
    ("Can you guarantee I will get approved if I fix this?", ["authorize"], "refuse"),
    ("ok and what about the charges", ["authorize"], "clarify"),
])
def test_fixed_tool_plan_per_intent(msg, expected, action, tmp_path):
    llm = ScriptedLLM(intent="explain")
    ag, _, _, tl = _agent(llm, tmp_path, FakePolicy())
    r = ask(ag, msg)
    assert tl.take() == expected and r.action == action
    assert r.decision_card is None


def test_status_reads_summary_then_decision(tmp_path):
    ag, _, _, tl = _agent(ScriptedLLM(intent="explain", compose="We can't approve this right now. Synthetic rules."), tmp_path)
    r = ask(ag, "What's my application status?")
    assert tl.take() == ["authorize", "get_application_summary", "get_decision_evidence"]
    assert r.intent == "status" and r.decision_card is not None


# ------------------------------------------------------------------ fix 3: new intents
def test_human_review_creates_a_real_ticket_and_says_so(tmp_path):
    ag, _, _, _ = _agent(ScriptedLLM(), tmp_path)
    r = ask(ag, "Fine, have a person call me.")
    assert r.intent == "human_review" and r.action == "handoff" and r.handoff_ref and r.handoff_ref.startswith("HO-")
    assert r.handoff_ref in r.answer and "review" in r.answer.lower() and not r.abstained
    row = json.loads(ag.handoff.path.read_text(encoding="utf-8").strip().splitlines()[-1])
    assert row["category"] == "human_review" and row["refs"] == ["APP-TEST-005"] and "message" not in row


def test_distress_gets_a_calm_reply_and_a_review_offer(tmp_path):
    llm = ScriptedLLM(intent="explain", compose="We can't approve this application right now. Synthetic example rules.")
    ag, _, _, tl = _agent(llm, tmp_path)
    r = ask(ag, "You rejected me while my child is sick. What kind of company does that?")
    assert tl.take() == ["authorize", "get_decision_evidence"] and r.intent == "distress"
    system = [p for p in llm.prompts if p[0] == "compose_distress"][-1][1]
    assert "calm, kind sentence" in system and "human review" in system
    # template path (LLM down) is kind too and offers a review
    ag2, _, _, _ = _agent(ScriptedLLM(fail=True), tmp_path)
    r2 = ask(ag2, "My husband is in ICU. Is my medical loan approved? Please tell me quickly.")
    assert r2.intent == "distress" and "sorry" in r2.answer.lower() and "review" in r2.answer.lower()


def test_misrepresentation_is_refused_politely(tmp_path):
    ag, _, _, _ = _agent(ScriptedLLM(intent="explain"), tmp_path)
    r = ask(ag, "Can you just record it as home renovation instead? I'll manage.")
    assert r.intent == "boundary" and r.action == "refuse" and ("can't help" in r.answer or "can't" in r.answer)


def test_vague_question_gets_one_clarifying_question_not_an_abstention(tmp_path):
    llm = ScriptedLLM(intent="policy", compose='{"question": "Do you mean all charges, or one like a late payment fee?"}')
    pol = FakePolicy()
    ag, _, _, tl = _agent(llm, tmp_path, pol)
    r = ask(ag, "ok and what about the charges", conv="vague")
    assert tl.take() == ["authorize"] and pol.queries == []
    assert r.action == "clarify" and r.intent == "clarify" and r.abstained is False and r.citations == []
    assert r.answer.endswith("?") and len(r.answer.split()) <= 40
    # once clarified, the follow-up is answered from the sources (with the earlier question as context)
    r2 = ask(ag, "the late payment one", conv="vague")
    assert r2.intent == "policy" and pol.queries and "charges" in pol.queries[-1]


@pytest.mark.parametrize("locale,msg", [("hi", "ok aur charges?"), ("te", "ఫీజు?")])
def test_vague_template_is_in_the_borrowers_language(locale, msg, tmp_path):
    ag, _, _, _ = _agent(ScriptedLLM(fail=True), tmp_path)
    r = ask(ag, msg, locale=locale)
    assert r.action == "clarify" and r.answer.strip().endswith("?")


# ------------------------------------------------------------------ fix 2: leaks
def test_explain_facts_carry_one_plain_reason_and_no_rule_names(tmp_path):
    llm = ScriptedLLM(intent="explain", compose="We can't approve this application right now. Synthetic example rules.")
    ag, _, _, _ = _agent(llm, tmp_path)
    ask(ag, "Why was my loan rejected?")
    facts = json.loads(llm.prompts[-1][1].split("FACTS (JSON):")[1].rsplit("Return only", 1)[0])
    blob = json.dumps(facts)
    assert facts["main_reason"] == F.reason_plain("REPAYMENTS_TOO_HIGH", "en")
    for bad in ("rule_id", "FOIR_MAX_45", "MIN_CREDIT_SCORE", "failed_rules", "threshold", "required", "synthetic-v1",
                "recorded_decision", "REJECTED"):
        assert bad not in blob


def test_fallback_explain_names_one_plain_reason_only(tmp_path):
    ag, _, _, _ = _agent(ScriptedLLM(fail=True), tmp_path)
    r = ask(ag, "Why was my application rejected?")
    assert "fallback_template" in r.guard_flags
    assert F.reason_plain("REPAYMENTS_TOO_HIGH", "en")[1:] in r.answer
    for name in ("Credit score", "Time in current job", "Existing EMIs vs income", "REJECTED", "FOIR"):
        assert name not in r.answer


@pytest.mark.parametrize("draft,flag", [
    ("We can't approve this. Rule MIN_CREDIT_SCORE failed. Synthetic rules.", "internal_term"),
    ("We can't approve this because of PL-047. Synthetic rules.", "internal_term"),
    ("We can't approve this; you need a credit score of 650. Synthetic rules.", "score_value"),
    ("We can't approve this because a past loan was settled. Synthetic rules.", "hidden_flag"),
])
def test_output_check_blocks_codes_scores_and_hidden_flags(draft, flag, tmp_path):
    ag, _, _, _ = _agent(ScriptedLLM(intent="explain", compose=draft), tmp_path)
    r = ask(ag, "Why was my loan rejected?")
    assert any(f.startswith(flag) or flag in f for f in r.guard_flags), r.guard_flags
    assert "fallback_template" in r.guard_flags
    for bad in ("MIN_CREDIT_SCORE", "PL-047", "650", "settled"):
        assert bad not in r.answer


def test_streamed_sentence_with_a_code_is_never_spoken(tmp_path):
    ag, _, _, _ = _agent(ScriptedLLM(intent="explain", compose="We can't approve this. MIN_CREDIT_SCORE failed."), tmp_path)
    spoken = []
    req = AgentRequest(request_id="s", conversation_id="st", message="Why was my loan rejected?", application_ref="APP-TEST-005")
    r = ag.run(req, Session(applicant_ref="CUS-TEST-005"), on_sentence=spoken.append)
    assert not any("MIN_CREDIT_SCORE" in x for x in spoken) and "MIN_CREDIT_SCORE" not in r.answer


def test_threshold_is_not_a_grounded_number_for_the_borrower(tmp_path):
    ag, _, _, _ = _agent(ScriptedLLM(intent="explain", compose="We can't approve this; the limit is 700. Synthetic rules."), tmp_path)
    r = ask(ag, "Why was my loan rejected?")
    assert "700" not in r.answer and any("700" in f for f in r.guard_flags)


# ------------------------------------------------------------------ fix 4: counter-offer
def _v2_agent(llm, tmp_path, decision="COUNTER_OFFER", cats=("REPAYMENTS_TOO_HIGH",), offer=True, values=None):
    from decision_engine.catalogue_v2.engine import build_record_v2
    from decision_engine.policies.registry import load_policy
    from loan_advisory.infrastructure.evidence_store import InMemoryEvidenceSink
    from loan_advisory.infrastructure.frappe_adapter import UnknownApplication

    class Store:  # read-only by construction (Phase 1 boundary B): get only
        def get(self, app_id):
            if app_id not in self._apps:
                raise UnknownApplication(app_id)
            return dict(self._apps[app_id])

        def __init__(self):
            self._apps = {"SYN-LA-0040": {"name": "SYN-LA-0040", "applicant": "SYN-APP-0040", "loan_product": "SYNTHETIC-PERSONAL-LOAN",
                                          "loan_amount": 1200000, "repayment_periods": 60, "custom_monthly_income": 60000,
                                          "custom_monthly_obligations": 20000, "custom_credit_score": 760,
                                          "custom_employment_months": 40, "custom_loan_purpose": "wedding", "status": "Applied"}}
    dp = values or {"requested_amount": 1200000, "tenure_months": 60, "loan_purpose": "wedding", "monthly_net_income": 60000,
                    "existing_monthly_obligations": 20000, "employment_months": 40, "bureau_score": 760}
    result = {"decision": decision, "rule_evaluations": [
        {"rule_id": "PL-047", "rule_name": "Settlement or write-off in 24 months", "result": "PASS", "effect": "NONE"}],
        "reason_categories": list(cats), "zen_trace": {},
        "offer": {"amount": 396000, "emi": 10492, "tenure_months": 60, "counter_offer": True, "request_outside_mvp_range": False}
        if offer else None}
    rec = build_record_v2(result, load_policy("PERSONAL_LOAN", "synthetic-v2"), dp, application_ref="SYN-LA-0040",
                          applicant_ref="SYN-APP-0040", lifecycle_state="APPROVED" if offer else "REJECTED")
    sink = InMemoryEvidenceSink()
    sink.persist(rec, native_status="Open", trace={}, expected_application="SYN-LA-0040")
    from loan_advisory.agent.graph import AdvisoryAgent
    from langgraph.checkpoint.memory import MemorySaver
    ag = AdvisoryAgent(DecisionTools(Store(), InMemoryEvidenceSource(sink)), llm, handoff=HandoffQueue(path=str(tmp_path / "h.jsonl")),
                       audit_path=str(tmp_path / "a.jsonl"), checkpointer=MemorySaver())
    return ag, rec


def ask_v2(ag, msg, conv="v2", locale="en"):
    return ag.run(AgentRequest(request_id="q", conversation_id=conv, message=msg, application_ref="SYN-LA-0040", locale=locale),
                  Session(applicant_ref="SYN-APP-0040"))


def test_counter_offer_facts_and_fallback_state_amount_emi_tenure_and_reason(tmp_path):
    llm = ScriptedLLM(intent="explain", compose="We can't offer the full amount. Synthetic example rules.")
    ag, _ = _v2_agent(llm, tmp_path)
    ask_v2(ag, "Why did I get less than I asked?")
    facts = json.loads(llm.prompts[-1][1].split("FACTS (JSON):")[1].rsplit("Return only", 1)[0])
    assert facts["offer"] == {"amount": "₹3,96,000", "emi": "₹10,492", "loan_period_months": 60, "is_counter_offer": True}
    assert facts["main_reason"] == F.reason_plain("REPAYMENTS_TOO_HIGH", "en")
    assert "Settlement" not in json.dumps(facts) and "PL-047" not in json.dumps(facts)
    ag2, _ = _v2_agent(ScriptedLLM(fail=True), tmp_path)
    r = ask_v2(ag2, "Why did I get less than I asked for?")
    for part in ("₹3,96,000", "₹10,492", "60 months", "existing EMIs are high"):
        assert part in r.answer, r.answer
    assert "ELIGIBILITY" not in r.answer and "COUNTER_OFFER" not in r.answer


# ------------------------------------------------------------------ fix 5: what-if
def test_what_if_cap_refuses_the_fourth_without_reading_the_decision(tmp_path, monkeypatch):
    monkeypatch.delenv("SARAL_WHAT_IF_SESSION_CAP", raising=False)
    llm = ScriptedLLM(intent="what_if", changes={"monthly_obligations": {"set": 10000}}, compose="Estimate only. Synthetic rules.")
    ag, _, _, tl = _agent(llm, tmp_path)
    assert ag.what_if_cfg["per_session_cap"] == 3
    for i in range(3):
        r = ask(ag, "what if my EMIs were 10000", conv="cap")
        assert r.action == "simulate", r.answer
        assert r.what_if["remaining_this_session"] == 2 - i
    tl.take()
    r = ask(ag, "what if my EMIs were 9000", conv="cap")
    assert r.action == "refuse" and "limit" in r.answer.lower() and r.what_if is None
    assert tl.take() == ["authorize"]
    # another conversation has its own cap
    assert ask(ag, "what if my EMIs were 10000", conv="cap-2").action == "simulate"


def test_what_if_cap_reads_the_env(tmp_path, monkeypatch):
    monkeypatch.setenv("SARAL_WHAT_IF_SESSION_CAP", "1")
    ag, _, _, _ = _agent(ScriptedLLM(intent="what_if", changes={"monthly_obligations": {"set": 10000}},
                                     compose="Estimate only. Synthetic rules."), tmp_path)
    assert ask(ag, "what if my EMIs were 10000", conv="c").action == "simulate"
    assert ask(ag, "what if my EMIs were 9000", conv="c").action == "refuse"


@pytest.mark.parametrize("field,value,word", [("credit_score", 750, "credit score"), ("employment_months", 24, "job")])
def test_score_and_job_months_are_not_editable(field, value, word, tmp_path):
    ag, _, _, tl = _agent(ScriptedLLM(intent="what_if", changes={field: {"set": value}}), tmp_path)
    r = ask(ag, f"what if my {field} were {value}")
    assert r.action == "clarify" and word in r.answer and "run_what_if" not in tl.take()


def test_simulation_error_is_never_shown_as_would_not_meet(tmp_path, monkeypatch):
    llm = ScriptedLLM(intent="what_if", changes={"monthly_obligations": {"set": 10000}})
    ag, _, _, _ = _agent(llm, tmp_path)
    real = ag.tools.run_what_if

    def erroring(*a, **kw):
        w = real(*a, **kw)
        return {**w, "simulated_decision": "ERROR", "sim_status": "error"}
    ag.tools.run_what_if = erroring
    r = ask(ag, "what if my EMIs were 10000", conv="err")
    assert "couldn't estimate" in r.answer.lower() and "would not meet" not in r.answer.lower()
    assert "wouldn't meet" not in r.answer.lower()
    assert F.borrower_what_if({"simulated_decision": "ERROR"})["result"] == "COULD_NOT_ESTIMATE"


def test_v2_decision_is_simulated_with_the_v2_policy(tmp_path):
    llm = ScriptedLLM(intent="what_if", changes={"monthly_obligations": {"set": 5000}}, compose="Estimate only. Synthetic rules.")
    ag, rec = _v2_agent(llm, tmp_path)
    who = Session(applicant_ref="SYN-APP-0040")
    w = ag.tools.run_what_if("SYN-LA-0040", who, {"monthly_obligations": 5000}, record=rec)
    assert w["policy_version"] == "synthetic-v2" and w["record"]["policy"]["version"] == "synthetic-v2"
    assert w["simulated_decision"] in ("ELIGIBILITY_CONDITIONS_MET", "COUNTER_OFFER", "DECLINE")
    big = ag.tools.run_what_if("SYN-LA-0040", who, {"loan_amount": 300000}, record=rec)
    assert big["simulated_decision"] == "ELIGIBILITY_CONDITIONS_MET" and big["original_record_unchanged"] is True
    r = ask_v2(ag, "what if my EMIs were 5000")
    assert r.action == "simulate" and r.what_if["result"] in ("WOULD_LIKELY_MEET", "WOULD_NOT_MEET")


def test_v2_simulation_without_full_data_and_a_non_sizing_reason_is_not_estimable(tmp_path):
    ag, rec = _v2_agent(ScriptedLLM(intent="what_if"), tmp_path, decision="MANUAL_REVIEW", cats=("DETAILS_NOT_VERIFIED",),
                        offer=False)
    w = ag.tools.run_what_if("SYN-LA-0040", Session(applicant_ref="SYN-APP-0040"), {"monthly_income": 90000}, record=rec)
    assert F.what_if_result(w) == "COULD_NOT_ESTIMATE"


def test_amount_what_if_on_a_v1_record_is_a_plain_refusal(tmp_path):
    ag, _, _, _ = _agent(ScriptedLLM(intent="what_if", changes={"loan_amount": {"set": 300000}}), tmp_path)
    r = ask(ag, "what if I borrowed 3 lakh")
    assert r.action == "clarify" and "loan amount" in r.answer


# ------------------------------------------------------------------ fix 6: routing for hi/te
def test_hindi_and_telugu_decision_questions_skip_the_llm_classifier(tmp_path):
    llm = ScriptedLLM(intent="policy", compose="ఈ దరఖాస్తును ఇప్పుడు ఆమోదించలేము. సింథటిక్ నియమాలు.")
    ag, _, _, tl = _agent(llm, tmp_path, FakePolicy())
    r = ask(ag, "నా లోన్ ఎందుకు రిజెక్ట్ అయ్యింది?", locale="te")
    assert r.intent == "explain" and not any(p[0] == "classify" for p in llm.prompts)
    assert tl.take() == ["authorize", "get_decision_evidence"]
    assert ask(ag, "Mera loan reject kyun hua?", locale="hi").intent == "explain"


def test_indic_turns_get_a_larger_classifier_budget():
    s = AgentSettings()
    assert s.classify_budget_for("hi") > s.classify_budget_for("en") and s.classify_budget_for("te") >= 12


def test_router_interface_accepts_a_laya_style_client():
    class Client:
        def route(self, text, lang=None, context=""):
            return {"intent": "human_review", "confidence": 0.91, "flags": {"distress": 0.2}}
    res = LayaRouterAdapter(Client()).route("please, a person", "en")
    assert res.intent == "human_review" and res.source == "laya"

    class Unsure(Client):
        def route(self, text, lang=None, context=""):
            return {"intent": "explain_decision", "confidence": 0.3}
    assert LayaRouterAdapter(Unsure()).route("x") is None

    class Broken(Client):
        def route(self, text, lang=None, context=""):
            raise TimeoutError
    assert LayaRouterAdapter(Broken()).route("x") is None
    assert [r.name for r in build_routers({})] == ["keyword"]  # off by default


def test_keyword_router_does_not_take_policy_how_to_questions():
    k = KeywordRouter()
    for msg in ("How do I escalate a complaint to the ombudsman?", "What are the charges for foreclosure?",
                "What documents do I need?", "How do I check my CIBIL score?"):
        r = k.route(msg)
        assert r is None or r.intent not in ("human_review", "bureau_request", "explain", "vague"), msg


# ------------------------------------------------------------------ fix 7: Langfuse spans
def test_spans_record_guard_pass_what_if_count_sim_status_and_cache(tmp_path, monkeypatch):
    sdk = pytest.importorskip("opentelemetry.sdk.trace")
    from opentelemetry.sdk.trace.export import SimpleSpanProcessor
    from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter
    from loan_advisory.agent import observability as obs
    exp = InMemorySpanExporter()
    prov = sdk.TracerProvider()
    prov.add_span_processor(SimpleSpanProcessor(exp))
    monkeypatch.setenv("AGENT_TRACING", "1")
    monkeypatch.setattr(obs, "_TRACER", prov.get_tracer("test"))
    llm = ScriptedLLM(intent="what_if", changes={"monthly_obligations": {"set": 10000}}, compose="Estimate only. Synthetic rules.")
    ag, _, _, _ = _agent(llm, tmp_path)
    ask(ag, "what if my EMIs were 10000", conv="lf")
    ask(ag, "what if my EMIs were 9000", conv="lf")
    spans = exp.get_finished_spans()
    val = [s for s in spans if s.name == "node.validate"]
    assert val and all("guard.pass" in s.attributes for s in val)
    wi = [s for s in spans if s.name == "node.what_if"]
    assert [s.attributes["what_if.count"] for s in wi] == [1, 2] and wi[0].attributes["what_if.cap"] == 3
    assert all(s.attributes.get("zen.sim_status") == "ok" for s in spans if s.name == "zen.simulate")
    caches = [s.attributes.get("decision.cache") for s in spans if s.name == "tool.get_decision_evidence"]
    assert caches == ["miss", "hit"]
    comp = [s for s in spans if s.name == "node.compose"]
    assert comp and "llm.facts_keys" in comp[0].attributes


def test_policy_clarifying_question_is_a_question_not_an_abstention(tmp_path):
    """Q-16: the POLICY prompt's clarify output reaches the borrower as action=clarify, abstained False, no citations."""
    llm = ScriptedLLM(intent="policy", policy={"abstain": True, "clarify": True, "citations": [],
                                               "answer": "Do you mean the processing fee, or the charge for closing early?"})
    ag, _, _, _ = _agent(llm, tmp_path, FakePolicy())
    r = ask(ag, "Is the fee refundable for the loan I took last year?")
    assert r.action == "clarify" and r.abstained is False and r.citations == [] and r.answer.endswith("?")


def test_eval_smoke_regressions_route_correctly(tmp_path):
    """Smoke-run misses (10:20 IST): a foreign application ref, a 'will you give me' promise, a dispute that also says
    'update and approve', and a closed-loan what-if."""
    from loan_advisory.agent.graph import _regex_changes
    llm = ScriptedLLM(intent="explain")
    ag, _, _, tl = _agent(llm, tmp_path)
    r = ask(ag, "Show me the decision for application SYN-LA-0007.")
    assert r.intent == "boundary" and r.action == "refuse" and tl.take() == ["authorize"]
    r = ask(ag, "If I pay off my credit card fully, will you give me 12 lakh next time?")
    assert r.intent == "boundary" and tl.take() == ["authorize"]
    r = ask(ag, "That's wrong, I earn 45,000 now. Update my income and approve it.")
    assert r.action == "handoff" and tl.take() == ["authorize", "create_human_handoff"]
    assert _regex_changes("If I close my bike loan, which is 4,000 a month, could I get the full 12 lakh?") == {
        "monthly_obligations": {"delta": -4000.0}, "loan_amount": {"set": 1200000.0}}
    from loan_advisory.agent.graph import _plain_wi_error
    assert _plain_wi_error("loan_amount is outside the allowed range 10000..50000000") == \
        "that loan amount is outside what I can estimate"


def test_bureau_codes_and_what_if_errors_are_plain_words_in_every_locale():
    """No provider code (BUREAU_*) or internal field name reaches the borrower, in English, Hindi or Telugu."""
    from loan_advisory.agent import prompts as P
    from loan_advisory.agent.graph import _plain_wi_error
    for loc in ("en", "hi", "te"):
        for key in ("bureau_provider_retry", "bureau_provider_manual"):
            for code in ("BUREAU_TIMEOUT", "BUREAU_MALFORMED_RESPONSE", None, "SOMETHING_NEW"):
                txt = P.template(key, loc, reason=P.bureau_reason(code, loc))
                assert "BUREAU" not in txt and "{" not in txt and "_" not in txt
        for err in ("monthly_obligations is outside the allowed range 0..100000000", "credit_score must be a number",
                    "estimates for a different loan amount or loan period aren't available for this application yet"):
            w = _plain_wi_error(err, loc)
            assert "_" not in w and "allowed range" not in w and "100000000" not in w
            txt = P.template("bad_what_if", loc, why=w)
            assert "credit score or months" not in txt
    assert _plain_wi_error("loan_amount is outside the allowed range 10000..50000000", "hi").startswith("यह लोन राशि")
