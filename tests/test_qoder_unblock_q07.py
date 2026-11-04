"""Q-07: the borrower API never carries rule ids, cut-offs, gaps or reason codes."""
import json
import re

from tests.test_agent_graph import ScriptedLLM, agent_for, ask

FORBIDDEN_KEYS = {"rule_id", "threshold", "threshold_value", "target_display", "gap_display", "reason_code",
                  "rule_results", "failed_reason_codes", "simulated_decision", "rules", "review_reason_codes"}
LEAK = re.compile(r"\b(700|650|0\.45|0\.5|45%|50%|FOIR|cut-?off|threshold)\b", re.I)


def _keys(o, out=None):
    out = set() if out is None else out
    if isinstance(o, dict):
        for k, v in o.items():
            out.add(k)
            _keys(v, out)
    elif isinstance(o, list):
        for v in o:
            _keys(v, out)
    return out


def _structured(r):
    d = r.model_dump()
    return {k: d[k] for k in ("decision_card", "improvement_plan", "what_if")}


def test_explain_card_has_reason_categories_and_no_cutoffs(tmp_path):
    ag, _, _ = agent_for(ScriptedLLM(intent="explain"), tmp_path=tmp_path)
    r = ask(ag, "Why was my loan rejected?")
    body = _structured(r)
    assert not (_keys(body) & FORBIDDEN_KEYS), _keys(body) & FORBIDDEN_KEYS
    assert not LEAK.findall(json.dumps(body, ensure_ascii=False))
    cats = {c["key"] for c in r.decision_card["reason_categories"]}
    assert cats == {"REPAYMENTS_TOO_HIGH", "CREDIT_HISTORY", "EMPLOYMENT_STABILITY"}
    assert r.decision_card["decision"] == "REJECTED"


def test_improvement_plan_is_general_guidance_only(tmp_path):
    ag, _, _ = agent_for(ScriptedLLM(intent="improve"), tmp_path=tmp_path)
    r = ask(ag, "How can I improve?")
    assert r.improvement_plan
    body = _structured(r)
    assert not (_keys(body) & FORBIDDEN_KEYS)
    assert not re.search(r"₹|\d", json.dumps(r.improvement_plan, ensure_ascii=False))


def test_what_if_is_one_estimate_line(tmp_path):
    ag, _, _ = agent_for(ScriptedLLM(intent="what_if", changes={"monthly_obligations": 10000}), tmp_path=tmp_path)
    r = ask(ag, "What if my EMIs were 10000?")
    if r.what_if:
        assert set(r.what_if) >= {"result", "text", "label"}
        assert not (_keys(r.what_if) & FORBIDDEN_KEYS)


def test_borrower_offer_and_v2_categories_come_from_the_record():
    from loan_advisory.agent import facts as F

    rec = {"decision": "APPROVED", "outcome": "APPROVED", "reason_categories": ["REQUEST_OUTSIDE_OFFER"],
           "offer": {"amount": 2500000, "emi": 60000, "tenure_months": 84, "counter_offer": True},
           "rule_evaluations": [{"rule_id": "PL-109", "result": "FAIL", "threshold": 2500000}]}
    card = F.decision_card_borrower(rec)
    assert card["offer"] == {"amount": 2500000, "emi": 60000, "tenure_months": 84, "counter_offer": True}
    assert card["reason_categories"] == [{"key": "REQUEST_OUTSIDE_OFFER", "label": "Loan request outside what we offer"}]
    assert "rules" not in card
