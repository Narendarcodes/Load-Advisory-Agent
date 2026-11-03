"""Q-01 (one shared tenure bound) and Q-17 (an unfetched 0 score is missing, not invalid)."""
import re
from pathlib import Path

import pytest
from pydantic import ValidationError

from decision_engine.bureau import gates
from decision_engine.schemas.underwriting import MAX_TENURE_MONTHS, MIN_TENURE_MONTHS, UnderwritingInput

ROOT = Path(__file__).resolve().parents[1]
BASE = dict(application_id="A", applicant_id="B", monthly_income=50000, monthly_obligations=0,
            credit_score=750, employment_months=24, loan_amount=100000)


def test_shared_tenure_bounds_are_12_to_108():
    assert (MIN_TENURE_MONTHS, MAX_TENURE_MONTHS) == (12, 108)


@pytest.mark.parametrize("months", [11, 109, 360, 1])
def test_schema_rejects_out_of_range_tenure(months):
    with pytest.raises(ValidationError, match="12..108"):
        UnderwritingInput(**BASE, loan_tenure_months=months)


@pytest.mark.parametrize("months", [12, 60, 108])
def test_schema_accepts_in_range_tenure(months):
    assert UnderwritingInput(**BASE, loan_tenure_months=months).loan_tenure_months == months


def test_gate_uses_the_same_constant():
    src = (ROOT / "decision_engine/bureau/gates.py").read_text(encoding="utf-8")
    assert "MIN_TENURE_MONTHS <= v <= MAX_TENURE_MONTHS" in src and "360" not in src
    assert gates.MAX_TENURE_MONTHS == MAX_TENURE_MONTHS


def test_portal_copy_matches_the_shared_constant():
    """The Frappe app cannot import decision_engine; its copy is pinned to the shared constant here."""
    src = (ROOT / "apps/loan_advisory_portal/loan_advisory_portal/api/applications.py").read_text(encoding="utf-8")
    m = re.search(r"^MIN_TENURE, MAX_TENURE = (\d+), (\d+)$", src, re.M)
    assert m and (int(m[1]), int(m[2])) == (MIN_TENURE_MONTHS, MAX_TENURE_MONTHS)


# ---------------------------------------------------------------- Q-17
def test_unfetched_zero_score_is_missing_not_invalid():
    from loan_advisory.application.lifecycle import _bureau_application, _scored_inputs

    doc = {"custom_monthly_income": 50000, "custom_monthly_obligations": 0, "custom_employment_months": 24,
           "custom_credit_score": 0, "custom_credit_score_origin": "NOT_FETCHED"}
    inputs = _scored_inputs(doc)
    assert inputs["credit_score"] is None
    assert _bureau_application(doc, inputs, "SYN-APP-0001")["credit_score_origin"] == "NOT_FETCHED"


def test_a_recorded_score_is_kept():
    from loan_advisory.application.lifecycle import _scored_inputs

    assert _scored_inputs({"custom_credit_score": 760, "custom_credit_score_origin": "BUREAU"})["credit_score"] == 760
    assert _scored_inputs({"credit_score": 0})["credit_score"] == 0  # no origin: unchanged (the gate judges it)
