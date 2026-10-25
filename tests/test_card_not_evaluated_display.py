"""Decision card 'Yours' column for rules the engine did not evaluate (found in GUI test C-12).

APP-TEST-007 records a monthly income of 40,000 but no credit score or tenure, so the engine evaluates
no rule. The card used to print "not available" for every row, telling the applicant their income was
unavailable when it was on file. The card must not show a value the engine did not check, and must not
claim a recorded value is absent: a missing field reads "missing", a recorded but unchecked one reads
"not checked". Evaluated rows are unchanged.
"""
from loan_advisory.agent.facts import decision_card


def _eval(rule_id, field, op, threshold, result="NOT_EVALUABLE", actual=None):
    return {"rule_id": rule_id, "rule_name": rule_id, "reason_code": "ERR_" + rule_id, "field": field,
            "operator": op, "threshold": threshold, "result": result, "actual_value": actual,
            "threshold_source": "synthetic"}


def _record(evals, values, missing):
    return {"application_ref": "APP-TEST-007", "decision": "ERROR", "lifecycle_state": "INFO_REQUESTED",
            "record_id": "r1", "policy": {"version": "synthetic-v1", "synthetic": True},
            "rule_evaluations": evals, "failed_reason_codes": [], "flags": [],
            "inputs": {"values": values, "missing_fields": missing}}


VALUES_007 = {"monthly_income": 40000, "monthly_obligations": 10000, "credit_score": None, "employment_months": None}
EVALS = [_eval("MIN_MONTHLY_INCOME", "monthly_income", ">=", 25000),
         _eval("FOIR_MAX_45", "foir", "<=", 0.45),
         _eval("MIN_CREDIT_SCORE", "credit_score", ">=", 700),
         _eval("MIN_EMPLOYMENT_TENURE", "employment_months", ">=", 12)]


def _yours(card):
    return {r["rule_id"]: r["actual"] for r in card["rules"]}


def test_recorded_but_unchecked_value_is_not_called_unavailable():
    y = _yours(decision_card(_record(EVALS, VALUES_007, ["credit_score", "employment_months"])))
    assert y["MIN_MONTHLY_INCOME"] == "not checked"
    assert y["FOIR_MAX_45"] == "not checked"  # income and EMIs are both on file
    assert y["MIN_CREDIT_SCORE"] == "missing" and y["MIN_EMPLOYMENT_TENURE"] == "missing"
    assert "40,000" not in str(y)  # never shows a value the engine did not check


def test_result_column_and_evaluated_rows_are_unchanged():
    evals = [_eval("MIN_MONTHLY_INCOME", "monthly_income", ">=", 25000, result="PASS", actual=40000)] + EVALS[1:]
    card = decision_card(_record(evals, VALUES_007, ["credit_score", "employment_months"]))
    assert _yours(card)["MIN_MONTHLY_INCOME"] == "₹40,000"
    assert [r["result"] for r in card["rules"]] == ["PASS", "NOT_EVALUABLE", "NOT_EVALUABLE", "NOT_EVALUABLE"]


def test_record_without_inputs_keeps_not_available():
    rec = _record(EVALS, {}, [])
    rec.pop("inputs")
    assert set(_yours(decision_card(rec)).values()) == {"not available"}
