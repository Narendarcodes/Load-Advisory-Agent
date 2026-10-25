"""Normalized decision evidence — the minimal object a future AI layer consumes."""
import json


def build_evidence(canonical, zen_result: dict, zen_trace: dict, policy_path) -> dict:
    policy = json.loads(policy_path.read_text())
    by_id = {r["rule_id"]: r for r in policy["rules"]}
    foir = float(zen_result["foir"])
    passed = {
        "MIN_MONTHLY_INCOME": bool(zen_result["income_pass"]),
        "FOIR_MAX_45": bool(zen_result["foir_pass"]),
        "MIN_CREDIT_SCORE": bool(zen_result["credit_pass"]),
        "MIN_EMPLOYMENT_TENURE": bool(zen_result["employment_pass"]),
    }
    actuals = {
        "MIN_MONTHLY_INCOME": canonical.monthly_income,
        "FOIR_MAX_45": round(foir, 4),
        "MIN_CREDIT_SCORE": canonical.credit_score,
        "MIN_EMPLOYMENT_TENURE": canonical.employment_months,
    }
    evaluations = [
        {
            "rule_id": rid,
            "reason_code": by_id[rid]["reason_code"],
            "actual_value": actuals[rid],
            "threshold": by_id[rid]["threshold"],
            "result": "PASS" if passed[rid] else "FAIL",
        }
        for rid in ["MIN_MONTHLY_INCOME", "FOIR_MAX_45", "MIN_CREDIT_SCORE", "MIN_EMPLOYMENT_TENURE"]
    ]
    return {
        "application_id": canonical.application_id,
        "decision": zen_result["decision"],
        "policy": {"id": policy["policy_id"], "version": policy["policy_version"]},
        "rule_evaluations": evaluations,
        "zen_trace": zen_trace,
    }


def bureau_outcome(gate, report=None, *, fetch_error: dict | None = None) -> dict:
    """Additive evidence blocks for a bureau-backed evaluation.

    ``outcome`` is REVIEW for a data-quality hold and ERROR for a provider
    failure; None means "use the credit decision". ``decision`` stays ZEN's and
    remains the legacy APPROVED/REJECTED/ERROR value.
    """
    review = {**gate.to_dict(), "provider_error": fetch_error} if gate.review_required else None
    bureau = {
        "fetched": report is not None,
        "report_schema": report.schema_version if report else None,
        "report_id": report.report_id if report else None,
        "report_date": report.report_date.isoformat() if report else None,
        "score": gate.score.to_dict() if gate.score else None,
        "data_quality": gate.to_dict(),
        "provider_error": fetch_error,
    }
    if gate.category == "PROVIDER_FAILURE":
        outcome = "ERROR"
    elif gate.review_required:
        outcome = "REVIEW"
    else:
        outcome = None
    return {"outcome": outcome, "review": review, "bureau": bureau}
