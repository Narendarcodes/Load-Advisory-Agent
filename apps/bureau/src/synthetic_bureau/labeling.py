"""Label generated bureau cases with the unchanged decision pipeline.

Labels are computed with the default (unapproved) DQ policy. Staleness and
variance cases therefore record their proposed code separately and do not
become REVIEW until the policy is approved.
"""
from __future__ import annotations

from datetime import date

from decision_engine.bureau.gates import (
    DQ_BUREAU_REPORT_STALE,
    DQ_INCOME_OBLIGATION_INCONSISTENT,
    GateConfig,
    evaluate_data_quality,
)
from decision_engine.schemas.bureau import BureauReport
from loan_advisory.application.decision_orchestrator import decide

PROVIDER_CODES = {
    "RATE_LIMIT": "BUREAU_RATE_LIMITED",
    "UNAVAILABLE": "BUREAU_UNAVAILABLE",
    "TIMEOUT": "BUREAU_TIMEOUT",
    "MALFORMED_RESPONSE": "BUREAU_MALFORMED_RESPONSE",
}


class _DocStore:
    def __init__(self, doc: dict):
        self._doc = doc

    def get(self, _application_id: str) -> dict:
        return dict(self._doc)


def to_frappe_doc(case: dict) -> dict:
    app = case["application"]
    return {
        "name": app["application_id"],
        "applicant": app["applicant_id"],
        "custom_monthly_income": app["monthly_income"],
        "custom_monthly_obligations": app["monthly_obligations"],
        "custom_credit_score": app["credit_score"],
        "credit_score_origin": app.get("credit_score_origin"),
        "custom_employment_months": app["employment_months"],
        "loan_amount": app["loan_amount"],
        "repayment_periods": app["loan_tenure_months"],
    }


def _pending_policy_codes(case: dict) -> list[str]:
    scenario = case["scenario"]
    codes: list[str] = []
    if scenario == "STALE_REPORT":
        codes.append(DQ_BUREAU_REPORT_STALE)
    if scenario == "INCONSISTENT_INCOME_OBLIGATIONS":
        codes.append(DQ_INCOME_OBLIGATION_INCONSISTENT)
    return codes


def label_case(case: dict, as_of: date, config: GateConfig | None = None) -> dict:
    """Attach deterministic expected outcomes to a case."""
    case = dict(case)
    report = BureauReport.model_validate(case["report"]) if case.get("report") else None
    app = case["application"]
    gate = evaluate_data_quality(app, report, config=config or GateConfig(), as_of=as_of)
    pending = _pending_policy_codes(case)

    if report is None:
        code = PROVIDER_CODES[case["scenario"]]
        expected = {
            "outcome": "ERROR",
            "decision": "ERROR",
            "review_reason_codes": [],
            "pending_policy_reason_codes": pending,
            "failed_rule_ids": [],
            "info_requested": False,
            "score_value": None,
            "score_status": None,
            "score_source": None,
            "error_code": code,
        }
    elif gate.review_required:
        expected = {
            "outcome": "REVIEW",
            "decision": "ERROR",
            "review_reason_codes": gate.reason_codes,
            "pending_policy_reason_codes": pending,
            "failed_rule_ids": [],
            "info_requested": gate.info_requested,
            "score_value": report.score.value,
            "score_status": report.score.status.value,
            "score_source": gate.score.source if gate.score else None,
            "error_code": None,
        }
    else:
        resolution = gate.score
        if resolution is None or resolution.value is None:
            raise ValueError(f"case {case['case_id']} has no usable score")
        doc = to_frappe_doc(case)
        doc["custom_credit_score"] = resolution.value
        evidence = decide(case["application"]["application_id"], store=_DocStore(doc))
        if evidence["decision"] not in ("APPROVED", "REJECTED"):
            raise ValueError(f"case {case['case_id']} did not produce a credit decision: {evidence}")
        expected = {
            "outcome": evidence["decision"],
            "decision": evidence["decision"],
            "review_reason_codes": [],
            "pending_policy_reason_codes": pending,
            "failed_rule_ids": [
                r["rule_id"] for r in evidence["rule_evaluations"] if r["result"] == "FAIL"
            ],
            "info_requested": False,
            "score_value": resolution.value,
            "score_status": report.score.status.value,
            "score_source": resolution.source,
            "error_code": None,
        }

    case["expected"] = expected
    return case


def label_cases(cases: list[dict], as_of: date, config: GateConfig | None = None) -> list[dict]:
    return [label_case(c, as_of, config=config) for c in cases]
