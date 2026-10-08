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
