import pytest
from pydantic import ValidationError

from contracts.common import LENDER_RELATIONSHIP
from contracts.decision_trace import Decision, DecisionTrace, RowOutcome, TraceRow

OUTPUTS = ["zen_output_approve_draft", "zen_output_refer_low_confidence", "zen_output_decline_writeoff"]


def _rows(fx, name):
    return fx(name)["trace"]["rows"]


def _row(fx, rule_id, name="zen_output_approve_draft"):
    return next(r for r in _rows(fx, name) if r["rule_id"] == rule_id)


@pytest.mark.parametrize("name,decision", list(zip(OUTPUTS, [Decision.APPROVE, Decision.REFER, Decision.DECLINE])))
def test_traces_validate_and_decide(fx, name, decision):
    t = DecisionTrace.model_validate(fx(name)["trace"])
    assert t.decision == decision
    assert t.policy.status == "DRAFT" and t.policy.lender_relationship == LENDER_RELATIONSHIP


def test_every_row_is_tagged(fx):
    t = DecisionTrace.model_validate(fx("zen_output_approve_draft")["trace"])
    for r in t.rows:
        if r.threshold_basis.value == "BAJAJ-SOURCED":
            assert r.citation and r.citation.chunk_id.startswith("BFL-")
            assert r.citation.relationship == LENDER_RELATIONSHIP
        else:
            assert r.assumption_id and r.approval_status.value == "PENDING"


def test_pr38_fields_present_and_meter_rendering(fx):
    t = DecisionTrace.model_validate(fx("zen_output_approve_draft")["trace"])
    foir = next(r for r in t.rows if r.rule_id == "B11_FOIR_MAX")
    assert foir.operator.value == "<=" and foir.threshold_value == 0.55 and foir.segment_override == "PRIME"
    assert foir.renders_meter
    nat = next(r for r in t.rows if r.rule_id == "B03_NATIONALITY")
    assert not nat.renders_meter              # '==' rows show no PR #38 meter today


def test_result_must_match_numbers(fx):
    r = _row(fx, "B09_CREDIT_SCORE_MIN")
    r["actual_value"] = 600                   # result still PASS
    with pytest.raises(ValidationError, match="result is PASS"):
        TraceRow.model_validate(r)


def test_outcome_must_follow_on_fail(fx):
    r = _row(fx, "B09_CREDIT_SCORE_MIN", "zen_output_decline_writeoff")
    r["outcome"] = "REFER"
    with pytest.raises(ValidationError, match="outcome must be DECLINE"):
        TraceRow.model_validate(r)


def test_screening_can_never_decline(fx):
    r = _row(fx, "S02_SIGNATURE_SIMILARITY", "zen_output_refer_low_confidence")
    assert r["outcome"] == "REFER"
    r["on_fail"], r["outcome"] = "DECLINE", "DECLINE"
    with pytest.raises(ValidationError, match="never DECLINE"):
        TraceRow.model_validate(r)


def test_missing_signature_has_no_effect(fx):
    r = TraceRow.model_validate(_row(fx, "S02_SIGNATURE_SIMILARITY", "zen_output_decline_writeoff"))
    assert r.result.value == "NOT_EVALUATED" and r.outcome == RowOutcome.NO_EFFECT


def test_missing_required_data_refers(fx):
    r = TraceRow.model_validate(_row(fx, "B20_SALARY_CREDIT_MONTHS", "zen_output_refer_low_confidence"))
    assert r.outcome == RowOutcome.REFER
    bad = _row(fx, "B20_SALARY_CREDIT_MONTHS", "zen_output_refer_low_confidence")
    bad["outcome"] = "DECLINE"
    with pytest.raises(ValidationError):
        TraceRow.model_validate(bad)


def test_low_confidence_decline_is_downgraded(fx):
    r = TraceRow.model_validate(_row(fx, "B11_FOIR_MAX", "zen_output_refer_low_confidence"))
    assert r.result.value == "FAIL" and r.outcome == RowOutcome.REFER and r.downgraded_from.value == "DECLINE"
    bad = _row(fx, "B11_FOIR_MAX", "zen_output_refer_low_confidence")
    bad["outcome"], bad["downgraded_from"] = "DECLINE", None
    with pytest.raises(ValidationError, match="outcome must be REFER"):
        TraceRow.model_validate(bad)


def test_bureau_values_cannot_be_low_confidence(fx):
    r = _row(fx, "B09_CREDIT_SCORE_MIN")
    r["actual_low_confidence"] = True
    with pytest.raises(ValidationError, match="OCR-derived"):
        TraceRow.model_validate(r)


def test_sourced_row_needs_citation_and_assumption_needs_id(fx):
    r = _row(fx, "B01_AGE_MIN")
    r["citation"] = None
    with pytest.raises(ValidationError, match="Bajaj citation"):
        TraceRow.model_validate(r)
    r = _row(fx, "B11_FOIR_MAX")
    r["assumption_id"] = None
    with pytest.raises(ValidationError, match="assumption_id"):
        TraceRow.model_validate(r)


def test_citation_must_carry_relationship_label(fx):
    r = _row(fx, "B01_AGE_MIN")
    r["citation"]["relationship"] = "partner"
    with pytest.raises(ValidationError, match="relationship"):
        TraceRow.model_validate(r)
    r = _row(fx, "B01_AGE_MIN")
    r["citation"]["excerpt"] = "x" * 321
    with pytest.raises(ValidationError):
        TraceRow.model_validate(r)


def test_policy_cannot_be_approved_with_pending_assumptions(fx):
    t = fx("zen_output_approve_draft")["trace"]
    t["policy"]["status"] = "APPROVED"
    with pytest.raises(ValidationError, match="assumptions are pending"):
        DecisionTrace.model_validate(t)


def test_duplicate_rule_ids_rejected(fx):
    t = fx("zen_output_approve_draft")["trace"]
    t["rows"].append(t["rows"][0])
    with pytest.raises(ValidationError, match="unique"):
        DecisionTrace.model_validate(t)
