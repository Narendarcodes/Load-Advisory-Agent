"""Saral v2 assistant visuals need two small, additive fields in the public state.

1. Decision-card rule rows carry the engine's own numbers (``actual_value``, ``threshold_value``,
   ``operator``) so the island can draw a meter without parsing display strings. A rule the engine did
   not evaluate carries no number: the card never shows a value the engine did not check.
2. A citation carries a short plain-text ``excerpt`` of the passage it points to, so a source chip can
   show what the policy says. It is trimmed, whitespace-collapsed and bounded; no markup is added.
"""
import json

from loan_advisory.agent.contracts import Citation
from loan_advisory.agent.facts import decision_card
from loan_advisory.agent.graph import citation_excerpt, EXCERPT_MAX_CHARS
from tests.test_agent_graph import FakePolicy, ScriptedLLM
from tests.test_agent_upgrades import agent_for, ask


def _eval(rule_id, op, threshold, result, actual):
    return {"rule_id": rule_id, "rule_name": rule_id, "reason_code": "R_" + rule_id, "field": rule_id.lower(),
            "operator": op, "threshold": threshold, "result": result, "actual_value": actual,
            "threshold_source": "synthetic"}


def _record(evals):
    return {"application_ref": "APP-V2", "decision": "REJECTED", "lifecycle_state": "REJECTED", "record_id": "r-v2",
            "policy": {"version": "synthetic-v1", "synthetic": True}, "rule_evaluations": evals,
            "failed_reason_codes": [], "flags": [], "inputs": {"values": {}, "missing_fields": []}}


def test_evaluated_rules_carry_the_engine_numbers_and_operator():
    card = decision_card(_record([_eval("FOIR_MAX_45", "<=", 0.45, "FAIL", 0.5),
                                  _eval("MIN_CREDIT_SCORE", ">=", 650, "FAIL", 612)]))
    foir, score = card["rules"]
    assert (foir["actual_value"], foir["threshold_value"], foir["operator"]) == (0.5, 0.45, "<=")
    assert (score["actual_value"], score["threshold_value"], score["operator"]) == (612, 650, ">=")
    # The display strings are unchanged: the numbers are additive.
    assert foir["actual"] == "50.0%" and foir["threshold"] == "≤ 45.0%"


def test_an_unevaluated_rule_has_no_number():
    card = decision_card(_record([_eval("MIN_CREDIT_SCORE", ">=", 650, "NOT_EVALUABLE", None)]))
    rule = card["rules"][0]
    assert rule["actual_value"] is None
    assert rule["threshold_value"] == 650


def test_non_numeric_engine_values_are_not_passed_through():
    # Only finite ints/floats pass through; a bool or an operator outside >= / <= is dropped.
    card = decision_card(_record([_eval("MIN_CREDIT_SCORE", ">=", 650, "FAIL", True)]))
    assert card["rules"][0]["actual_value"] is None
    card = decision_card(_record([_eval("MIN_CREDIT_SCORE", "==", 650, "FAIL", 612)]))
    assert card["rules"][0]["operator"] is None


def test_citation_excerpt_is_plain_bounded_text():
    text = "  Complaints may be raised\n\nwith the   Grievance Officer. " + "x" * 2000
    out = citation_excerpt(text)
    assert "\n" not in out and "  " not in out
    assert out.startswith("Complaints may be raised with the Grievance Officer.")
    assert len(out) <= EXCERPT_MAX_CHARS + 1 and out.endswith("…")
    assert citation_excerpt("Short rule.") == "Short rule."
    assert citation_excerpt("") is None and citation_excerpt(None) is None


def test_citation_model_accepts_an_optional_excerpt():
    assert Citation(label="P1", document_id="D", title="T").excerpt is None
    assert Citation(label="P1", document_id="D", title="T", excerpt="Rule text").excerpt == "Rule text"


def test_policy_answers_carry_the_excerpt_of_each_cited_passage(tmp_path):
    pol = {"abstain": False, "citations": ["P1"], "answer": "Complaints go to the Grievance Redressal Officer within 30 days."}
    ag = agent_for(ScriptedLLM(intent="policy", policy=pol), policy=FakePolicy(), tmp_path=tmp_path)
    r = ask(ag, "how do I complain?")
    assert [c.label for c in r.citations] == ["P1"]
    assert r.citations[0].excerpt == "Complaints may be raised with the Grievance Redressal Officer within 30 days."
    # The audit row keeps document ids only; the excerpt is a display field, not logged.
    row = json.loads(ag.audit_path.read_text(encoding="utf-8").strip().splitlines()[-1])
    assert "Grievance Redressal Officer within 30 days." not in json.dumps(row.get("citations"))
