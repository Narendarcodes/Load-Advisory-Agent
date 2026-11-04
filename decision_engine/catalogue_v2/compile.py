"""Compile catalogue v2 into a ZEN JDM decision graph (Q-15).

    PYTHONPATH=. python -m decision_engine.catalogue_v2.compile [--catalogue docs/saral/rule_catalogue.v2.json] [--check]

Thresholds, outcomes, decision effects, reason categories and the sizing parameters are read from the catalogue;
only the comparison for each rule (which data point, which operator) is written here, in RULE_SPECS, because the
catalogue states conditions as prose. Every ACTIVE, non-amount-dependent rule is compiled; a rule whose input the
live pipeline does not supply evaluates to INSUFFICIENT_DATA and takes the catalogue's on_missing effect.

Graph: input -> "rule_outcomes" (expression node: PASS / FAIL / REVIEW / INSUFFICIENT_DATA per rule) ->
"effects" (expression node: one boolean per effect, built from each rule's catalogue decision_effect) ->
"aggregate" (decision table, hit policy first: DECLINE > MANUAL_REVIEW > MORE_INFORMATION_REQUIRED >
ELIGIBILITY_CONDITIONS_MET) -> output. Amount-dependent rules (PL-064, 065, 108, 109, 110, 118, 120, 122, 123,
126) are applied by the PL-129 sizing in engine.py at the offered amount (ADR-0007 #2), so a breach at the
requested amount alone becomes a counter-offer, never a refusal.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

from decision_engine.paths import repo_root

CATALOGUE_PATH = repo_root() / "docs" / "saral" / "rule_catalogue.v2.json"
JDM_PATH = repo_root() / "decision_engine" / "decisions" / "personal_loan_v2.json"
POLICY_PATH = repo_root() / "decision_engine" / "policies" / "personal_loan_synthetic_v2.json"
POLICY_VERSION = "synthetic-v2"
PURPOSES = ("wedding", "higher_education", "home_renovation", "medical_emergency")

# rule_id -> (inputs that must be present, pass expression with {param} placeholders[, full outcome expression])
# A third element is a complete outcome expression for rules with a PASS / REVIEW / FAIL ladder.
RULE_SPECS: dict[str, tuple] = {
    "PL-001": (["age_at_assessment"], "age_at_assessment >= {minimum_age}"),
    "PL-002": (["age_at_maturity"], "age_at_maturity <= {maximum_age_at_maturity}"),
    "PL-003": (["nationality"], "nationality in {eligible_nationalities}"),
    "PL-004": (["employment_type"], "employment_type in {supported_employment_types}"),
    "PL-005": (["employment_category"], "employment_category in {eligible_employment_categories}"),
    "PL-006": (["identity_verification_status"], "identity_verification_status == 'COMPLETE'"),
    "PL-007": (["duplicate_match_result"], "duplicate_match_result == 'NO_MATCH'"),
    "PL-008": (["monthly_net_income"], "monthly_net_income >= {minimum_income}"),
    "PL-011": (["income_variation"], "income_variation <= {max_income_variation}"),
    "PL-012": (["salary_gap"], "salary_gap <= {max_salary_gap}"),
    "PL-014": (["employment_months"], "employment_months >= {minimum_employment_months}"),
    "PL-017": (["declared_vs_verified_gap"], "declared_vs_verified_gap <= {max_declared_vs_verified_gap}"),
    "PL-018": (["income_reduction_percentage"], "income_reduction_percentage <= {max_income_reduction}"),
    "PL-019": (["bureau_report_status"], "bureau_report_status in ['RECEIVED', 'RECEIVED_VALID']"),
    "PL-020": (["identity_match_status"], "identity_match_status == 'MATCH'"),
    "PL-024": (["bureau_report_age_days"], "bureau_report_age_days <= {maximum_report_age_days}"),
    "PL-025": (["duplicate_tradeline_count"], "duplicate_tradeline_count <= {max_duplicate_tradelines}"),
    "PL-026": (["credit_history_months", "active_account_count"],
               "credit_history_months >= {min_history_months} and active_account_count >= 1"),
    "PL-027": (["bureau_match_status"], "bureau_match_status != 'NO_HIT'"),
    "PL-028": (["bureau_dq_flag_count"], "bureau_dq_flag_count == 0"),
    "PL-029": (["bureau_score"], "bureau_score >= {approved_minimum_score}"),
    "PL-031": (["credit_history_months"], "credit_history_months >= {min_credit_vintage_months}"),
    "PL-033": (["active_personal_loan_count"], "active_personal_loan_count <= {max_active_personal_loans}"),
    "PL-035": (["recent_open_account_count"], "recent_open_account_count <= {max_new_accounts_6m}"),
    "PL-037": (["utilisation_ratio"], "utilisation_ratio <= {approved_utilisation_threshold}"),
    "PL-040": (["current_default_count"], "current_default_count == 0"),
    "PL-041": (["max_dpd_12m"], "max_dpd_12m == 0"),
    "PL-042": (["max_dpd_12m"], "max_dpd_12m < {dpd_bucket}"),
    "PL-043": (["max_dpd_24m"], "max_dpd_24m < {dpd_bucket}"),
    "PL-044": (["dpd_occurrence_count"], "dpd_occurrence_count <= {max_dpd_occurrences}"),
    "PL-046": (["payment_regularity_indicator"], "payment_regularity_indicator >= {min_on_time_ratio}"),
    "PL-047": (["settled_within_lookback", "settled_account_count"], None,
               "settled_within_lookback ? 'FAIL' : (settled_account_count > 0 ? 'REVIEW' : 'PASS')"),
    "PL-048": (["written_off_within_lookback", "written_off_account_count"], None,
               "written_off_within_lookback ? 'FAIL' : (written_off_account_count > 0 ? 'REVIEW' : 'PASS')"),
    "PL-051": (["missed_payment_count"], "missed_payment_count <= {max_card_missed_payments_12m}"),
    "PL-052": (["enquiries_last_30_days"], "enquiries_last_30_days <= {max_enquiries_30d}"),
    "PL-053": (["enquiries_last_6_months"], "enquiries_last_6_months <= {approved_enquiry_threshold}"),
    "PL-055": (["recent_unsecured_account_count"], "recent_unsecured_account_count <= {max_recent_unsecured}"),
    "PL-069": (["requested_amount"], "requested_amount >= {minimum_loan_amount}"),
    "PL-070": (["requested_amount"], "requested_amount <= {maximum_loan_amount}"),
    "PL-071": (["tenure_months"], "tenure_months >= {minimum_tenure_months}"),
    "PL-072": (["tenure_months"], "tenure_months <= {maximum_tenure_months}"),
    "PL-073": (["age_at_maturity"], "age_at_maturity <= {maximum_age_at_maturity}"),
    "PL-076": (["loan_purpose"], "loan_purpose in {eligible_loan_purposes}"),
    "PL-077": (["total_unsecured_exposure", "monthly_net_income"],
               "total_unsecured_exposure <= {exposure_income_multiple} * monthly_net_income"),
    "PL-078": (["salary_credit_months"], "salary_credit_months >= {min_salary_credit_months}"),
    "PL-080": (["negative_balance_count"], "negative_balance_count <= {max_negative_balance_days}"),
    "PL-081": (["return_count"], None,
               "return_count >= {decline_at} ? 'FAIL' : (return_count >= {review_from} ? 'REVIEW' : 'PASS')"),
    "PL-083": (["cash_deposit_percentage"], "cash_deposit_percentage <= {max_cash_share}"),
    "PL-084": (["monthly_income_variance"], "monthly_income_variance <= {max_credit_cv}"),
    "PL-086": (["debt_mismatch"], "debt_mismatch == false"),
    "PL-087": (["salary_reversal_indicator"], "salary_reversal_indicator == false"),
    "PL-088": (["missing_document_count"], "missing_document_count == 0"),
    "PL-089": (["min_ocr_confidence"], "min_ocr_confidence >= {minimum_confidence}"),
    "PL-091": (["duplicate_document_result"], "duplicate_document_result == 'UNIQUE'"),
    "PL-092": (["declared_vs_ocr_gap"], "declared_vs_ocr_gap <= {max_declared_vs_ocr_gap}"),
    "PL-093": (["statement_integrity_result", "statement_flag_count"],
               "statement_integrity_result in ['PASS', 'VALID'] and statement_flag_count == 0"),
    "PL-094": (["kyc_name_match_score", "kyc_dob_match", "kyc_id_last4_match"],
               "kyc_name_match_score >= {min_name_similarity} and kyc_dob_match == true and kyc_id_last4_match == true"),
    "PL-095": (["missing_consent_count"], "missing_consent_count == 0"),
    "PL-097": (["conflict_flag_count"], "conflict_flag_count == 0"),
    "PL-098": (["risk_flag_count"], "risk_flag_count == 0"),
    "PL-100": (["total_experience_months"], "total_experience_months >= {min_total_experience_months}"),
    "PL-101": (["months_at_current_address"], "months_at_current_address >= {min_months_at_address}"),
    "PL-102": (["pan_format_valid"], "pan_format_valid == true"),
    "PL-103": (["document_age_days"], "document_age_days <= {max_payslip_age_days}"),
    "PL-104": (["signature_present", "signature_similarity"],
               "signature_present == true and signature_similarity >= {min_signature_similarity}"),
    "PL-105": (["employer_name_similarity"], "employer_name_similarity >= {min_employer_name_similarity}"),
    "PL-106": (["debit_credit_ratio"], "debit_credit_ratio <= {max_debit_credit_ratio}"),
    "PL-111": (["purpose_evidence_status"], "purpose_evidence_status in ['PROVIDED', 'NOT_REQUIRED', 'INSUFFICIENT']"),
    "PL-112": (["declared_purpose", "product_purpose"], "declared_purpose == product_purpose"),
    "PL-114": (["days_since_last_decline_or_never"], "days_since_last_decline_or_never >= {cool_down_days}"),
    "PL-115": (["shared_contact_pan_count"], "shared_contact_pan_count <= {max_other_pans_per_contact}"),
    "PL-121": (["payslip_count", "statement_months"], "payslip_count >= 3 and statement_months >= 3"),
    # ZEN gap fixes (user OK 2026-11-04 09:36 IST). D-12: PL-013 / PL-016 read the KYC/AA employer history and status.
    "PL-013": (["employer_changes_24m"], "employer_changes_24m <= {max_employer_changes_24m}"),
    "PL-016": (["employment_status"], "employment_status in {accepted_employment_statuses}"),
    # D-13: residency gate (PL-130, catalogue 2.1 on #49).
    "PL-130": (["residency_status"], "residency_status in {eligible_residency_statuses}"),
    # The six left out of the first compile. Each reads a data point the KYC/AA consumer or engine.preprocess supplies;
    # a missing input is INSUFFICIENT_DATA with the catalogue's on_missing effect.
    "PL-074": (["calculated_emi", "independently_calculated_emi"],
               "abs(calculated_emi - independently_calculated_emi) <= {emi_tolerance}"),
    "PL-075": (["interest_rate"],
               "interest_rate >= {approved_interest_rate_range_lo} and interest_rate <= {approved_interest_rate_range_hi}"),
    "PL-079": (["average_monthly_balance", "proposed_emi"], "average_monthly_balance >= {amb_emi_multiple} * proposed_emi"),
    "PL-082": (["missing_emi_debit_count"], "missing_emi_debit_count <= {max_missing_emi_debits}"),
    "PL-099": (["evidence_references", "policy_version"], "len(evidence_references) > 0 and policy_version != ''"),
    "PL-127": (["loan_purpose"], None, lambda raw: _purpose_window_expr(raw["purpose_windows"])),
}

# Amount-dependent rules: applied by the PL-129 sizing (engine.size_offer) at the offered amount.
SIZED_RULES = ("PL-064", "PL-065", "PL-108", "PL-109", "PL-110", "PL-118", "PL-120", "PL-122", "PL-123", "PL-126")
# Every catalogue rule that is ACTIVE and not amount-dependent is compiled (ZEN gap fixes, 2026-11-04). PL-099's
# "every applicable rule has a result" half is checked after ZEN by engine.decide_v2 (a rule ZEN did not evaluate
# turns PL-099 into REVIEW).
NOT_COMPILED: dict[str, str] = {}
EFFECTS = ("DECLINE", "MANUAL_REVIEW", "MORE_INFORMATION_REQUIRED")


def _purpose_window_expr(w: dict) -> str:
    """PL-127 outcome: home renovation reads property ownership; the other purposes read the offset in days from the
    assessment date to their purpose date (engine.preprocess: purpose_date_offset_days)."""
    d = "purpose_date_offset_days"
    win = " or ".join(f"(loan_purpose == '{p}' and {d} >= {w[k][0]} and {d} <= {w[k][1]})"
                      for p, k in (("wedding", "wedding_date_days"), ("higher_education", "course_start_days"),
                                   ("medical_emergency", "treatment_date_days")))
    own = _lit(w["renovation_property_ownership"])
    return (f"loan_purpose == 'home_renovation' ? (property_ownership == null ? 'INSUFFICIENT_DATA' : "
            f"(property_ownership in {own} ? 'PASS' : 'REVIEW')) : ({d} == null ? 'INSUFFICIENT_DATA' : "
            f"(({win}) ? 'PASS' : 'REVIEW'))")


def _param_values(rule: dict) -> dict:
    return {p["name"]: p["value"] for p in rule.get("parameters") or []}


def _lit(v) -> str:
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (list, tuple)):
        return "[" + ", ".join(_lit(x) for x in v) + "]"
    if isinstance(v, str):
        return "'" + v.replace("'", "") + "'"
    return json.dumps(v)


def _key(rule_id: str) -> str:
    return "o_" + rule_id.replace("-", "_")


_SCOPE_EQ = re.compile(r"^\s*loan_purpose\s*==\s*'?(\w+)'?\s*$")
_SCOPE_IN = re.compile(r"^\s*loan_purpose\s+in\s+\[([^\]]*)\]\s*$")


def product_scope(rule: dict) -> tuple[str, ...] | None:
    """The purposes a rule is limited to, from its catalogue applies_when ("loan_purpose == home_renovation" or
    "loan_purpose in [a, b]"); None when it applies to every product. PL-130 is home renovation only (owner decision
    2026-11-04 10:15 IST)."""
    cond = rule.get("applies_when") or "ALL"
    m = _SCOPE_EQ.match(cond)
    if m:
        found = (m.group(1),)
    else:
        m = _SCOPE_IN.match(cond)
        if not m:
            return None
        found = tuple(x.strip().strip("'\"") for x in m.group(1).split(",") if x.strip())
    unknown = [p for p in found if p not in PURPOSES]
    if unknown:
        raise ValueError(f"{rule['rule_id']} applies_when names unknown purposes {unknown}")
    return found


def rule_effects(rule: dict) -> dict:
    """outcome -> effect for one rule, from its catalogue decision_effect (risk signals never decline)."""
    de = rule.get("decision_effect") or {}
    on_fail = de.get("on_fail") or "MANUAL_REVIEW"
    if rule.get("risk_signal") and on_fail == "DECLINE":
        on_fail = "MANUAL_REVIEW"
    on_missing = de.get("on_missing") or "NO_EFFECT"
    return {"FAIL": on_fail, "REVIEW": "MANUAL_REVIEW", "INSUFFICIENT_DATA": on_missing}


def compile_catalogue(cat: dict) -> tuple[dict, dict]:
    """(jdm, policy snapshot). Raises if a spec names a parameter the catalogue does not have."""
    rules = {r["rule_id"]: r for r in cat["rules"]}
    exprs, meta = [], {}
    for rid, spec in RULE_SPECS.items():
        rule = rules[rid]
        if not rule.get("enabled", True) or rule.get("mvp_status") == "DEFERRED":
            continue
        inputs, pass_expr = spec[0], spec[1]
        raw = _param_values(rule)
        params = {k: _lit(v) for k, v in raw.items()}
        for k, v in raw.items():  # a [low, high] range is also usable as {name_lo} / {name_hi}
            if isinstance(v, (list, tuple)) and len(v) == 2 and all(isinstance(i, (int, float)) for i in v):
                params[k + "_lo"], params[k + "_hi"] = _lit(v[0]), _lit(v[1])
        on_false = (rule.get("outcome") or {}).get("when_condition_false") or "FAIL"
        if len(spec) > 2:
            body = spec[2](raw) if callable(spec[2]) else spec[2].format(**params)
        else:
            body = f"({pass_expr.format(**params)}) ? 'PASS' : '{on_false}'"
        missing = " or ".join(f"{i} == null" for i in inputs)
        value = f"({missing}) ? 'INSUFFICIENT_DATA' : ({body})"
        scope = product_scope(rule)
        if scope is not None:  # a product-scoped rule: the other products never evaluate it (NOT_APPLICABLE, no effect)
            value = f"(loan_purpose in {_lit(list(scope))}) ? ({value}) : 'NOT_APPLICABLE'"
        exprs.append({"id": _key(rid), "key": _key(rid), "value": value})
        meta[rid] = {"name": rule["rule_name"], "effects": rule_effects(rule),
                     **({"applies_to_purposes": list(scope)} if scope is not None else {}),
                     "reason_category": rule.get("borrower_reason_category") or "OTHER",
                     "missing_category": rule.get("borrower_message_when_missing_category") or "DOCUMENTS_INCOMPLETE_OR_UNCLEAR",
                     "inputs": inputs}
    effect_exprs = []
    for eff in EFFECTS:
        terms = [f"{_key(rid)} == '{o}'" for rid, m in meta.items() for o, e in m["effects"].items() if e == eff]
        effect_exprs.append({"id": "any_" + eff.lower(), "key": "any_" + eff.lower(), "value": " or ".join(terms) or "false"})
    rows = [{"_id": "r_decline", "c_d": "true", "c_r": "", "c_m": "", "o_dec": "'DECLINE'"},
            {"_id": "r_review", "c_d": "", "c_r": "true", "c_m": "", "o_dec": "'MANUAL_REVIEW'"},
            {"_id": "r_info", "c_d": "", "c_r": "", "c_m": "true", "o_dec": "'MORE_INFORMATION_REQUIRED'"},
            {"_id": "r_met", "c_d": "", "c_r": "", "c_m": "", "o_dec": "'ELIGIBILITY_CONDITIONS_MET'"}]
    jdm = {
        "_comment": (f"GENERATED by decision_engine/catalogue_v2/compile.py from {cat.get('catalogue_version')} "
                     "- do not hand-edit. SYNTHETIC prototype policy (ADR-0011, prototype_synthetic only); not lender policy."),
        "nodes": [
            {"id": "in", "type": "inputNode", "name": "Request"},
            {"id": "rule_outcomes", "type": "expressionNode", "name": "rule_outcomes", "content": {"expressions": exprs}},
            {"id": "effects", "type": "expressionNode", "name": "effects", "content": {"expressions": effect_exprs}},
            {"id": "aggregate", "type": "decisionTableNode", "name": "aggregate", "content": {
                "hitPolicy": "first",
                "inputs": [{"id": "c_d", "name": "any decline", "field": "any_decline"},
                           {"id": "c_r", "name": "any manual review", "field": "any_manual_review"},
                           {"id": "c_m", "name": "any more information", "field": "any_more_information_required"}],
                "outputs": [{"id": "o_dec", "name": "decision", "field": "decision"}],
                "rules": rows}},
            {"id": "out", "type": "outputNode", "name": "Response"},
        ],
        "edges": [{"id": "e1", "type": "edge", "sourceId": "in", "targetId": "rule_outcomes"},
                  {"id": "e2", "type": "edge", "sourceId": "rule_outcomes", "targetId": "effects"},
                  {"id": "e3", "type": "edge", "sourceId": "effects", "targetId": "aggregate"},
                  {"id": "e4", "type": "edge", "sourceId": "aggregate", "targetId": "out"}],
    }
    sz = cat.get("offer_sizing") or {}
    p = {rid: _param_values(rules[rid]) for rid in SIZED_RULES + ("PL-069", "PL-070", "PL-076", "PL-119")}
    policy = {
        "policy_id": "PERSONAL_LOAN", "policy_version": POLICY_VERSION, "synthetic": True,
        "catalogue_version": cat.get("catalogue_version"),
        "threshold_source": "catalogue v2 (ADR-0011 OWNER_APPROVED for prototype_synthetic only); NOT a lender policy",
        "precedence": list((cat.get("decision_aggregation") or {}).get("precedence") or []),
        "rules": meta, "sized_rules": list(SIZED_RULES), "not_compiled": NOT_COMPILED,
        "sizing": {
            "flat_rate_by_purpose": {pu: sz.get("flat_rate_by_product", {}).get("PL_" + pu.upper(), 0.2) for pu in PURPOSES},
            "minimum_amount": p["PL-069"]["minimum_loan_amount"],
            "maximum_amount": p["PL-070"]["maximum_loan_amount"],
            "mvp_amount_ceiling": p["PL-109"]["mvp_amount_ceiling"],
            "purpose_amount_cap": p["PL-109"]["purpose_amount_cap"],
            "purpose_tenure_cap": p["PL-110"]["purpose_tenure_cap"],
            "approved_maximum_foir": p["PL-064"]["approved_maximum_foir"],
            "min_residual_income": p["PL-065"]["min_residual_income"],
            "max_amount_income_multiple": p["PL-108"]["max_amount_income_multiple"],
            "ntc_indicative_cap": p["PL-118"]["ntc_indicative_cap"],
            "band_minimum_score": p["PL-120"]["band_minimum_score"],
            "band_min_employment_months": p["PL-122"]["band_min_employment_months"],
            "band_employer_categories": p["PL-122"].get("band_employer_categories"),
            "band_review_foir": p["PL-123"]["band_review_foir"],
            "evidence_tolerance": p["PL-126"]["evidence_tolerance"],
            "amount_bands": p["PL-119"]["amount_bands"],
            "eligible_loan_purposes": p["PL-076"]["eligible_loan_purposes"],
        },
    }
    return jdm, policy


def _dump(obj) -> str:
    return json.dumps(obj, indent=1, ensure_ascii=False, sort_keys=False) + "\n"


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.replace("\r\n", "\n").encode("utf-8")).hexdigest()


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--catalogue", default=str(CATALOGUE_PATH))
    ap.add_argument("--check", action="store_true", help="fail if the committed artefacts differ from a fresh compile")
    a = ap.parse_args(argv)
    jdm, policy = compile_catalogue(json.loads(Path(a.catalogue).read_text(encoding="utf-8")))
    out = {JDM_PATH: _dump(jdm), POLICY_PATH: _dump(policy)}
    if a.check:
        stale = [p.name for p, t in out.items() if not p.exists() or p.read_text(encoding="utf-8") != t]
        print("stale: " + ", ".join(stale) if stale else "up to date")
        return 1 if stale else 0
    for p, t in out.items():
        p.write_text(t, encoding="utf-8")
        print(f"wrote {p.relative_to(repo_root())} sha256={sha256_text(t)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
