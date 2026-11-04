"""Run the compiled catalogue-v2 JDM and size the offer (PL-129). SYNTHETIC prototype policy only.

decide_v2(data_points) -> {"decision", "outcome", "rule_evaluations", "reason_categories", "offer", ...}

decision is one of DECLINE / MANUAL_REVIEW / MORE_INFORMATION_REQUIRED / ELIGIBILITY_CONDITIONS_MET /
COUNTER_OFFER (the Saral outcome values the LMS evidence ingest accepts). Precedence:
DECLINE > MANUAL_REVIEW > MORE_INFORMATION_REQUIRED > CONDITIONS_MET. When ZEN finds the conditions met, the
amount-dependent rules are applied by the sizing at the largest passing amount: a request above any of them,
including above the Rs. 25 lakh ceiling, becomes COUNTER_OFFER at that amount (ADR-0007 #2), never a refusal;
no passing amount at all is a DECLINE for affordability (PL-064).
"""
from __future__ import annotations

import json
import math
from datetime import date
from functools import lru_cache

from decision_engine.catalogue_v2.compile import JDM_PATH, POLICY_PATH

REQUIRED_CONSENTS = ("bureau_pull", "terms", "privacy")
# PL-127: the purpose date each product's window is measured on (catalogue purpose_windows).
PURPOSE_DATE = {"wedding": "wedding_date", "higher_education": "course_start_date", "medical_emergency": "treatment_date"}


@lru_cache(maxsize=1)
def policy() -> dict:
    return json.loads(POLICY_PATH.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def _decision():
    import zen

    return zen.ZenEngine().create_decision(JDM_PATH.read_text(encoding="utf-8"))


# ------------------------------------------------------------------ preprocessing (PREPROCESS_THEN_ZEN)
def _num(v):
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) else None


def _gap(a, b):
    a, b = _num(a), _num(b)
    return None if a is None or not b else abs(a - b) / b


def _days(a, b):
    try:
        return (date.fromisoformat(str(a)[:10]) - date.fromisoformat(str(b)[:10])).days
    except (TypeError, ValueError):
        return None


def _count(v):
    return len(v) if isinstance(v, (list, tuple, dict)) else None


def preprocess(dp: dict) -> dict:
    """Derived data points the catalogue defines as preprocessing (ages, gaps, counts). Pure; never invents a value."""
    x = dict(dp)
    tenure = _num(x.get("tenure_months"))
    age = _num(x.get("age_at_assessment"))
    x["age_at_maturity"] = age + math.ceil(tenure / 12) if age is not None and tenure is not None else None
    x["salary_gap"] = _gap(x.get("declared_salary"), x.get("bank_salary_credit_avg"))
    x["declared_vs_verified_gap"] = _gap(x.get("declared_income"), x.get("verified_income"))
    x["declared_vs_ocr_gap"] = _gap(x.get("declared_income"), x.get("ocr_extracted_income"))
    x["bureau_report_age_days"] = _days(x.get("assessment_date"), x.get("bureau_report_date"))
    x["bureau_dq_flag_count"] = _count(x.get("bureau_data_quality_flags"))
    x["statement_flag_count"] = _count(x.get("statement_validation_flags"))
    x["conflict_flag_count"] = _count(x.get("conflict_flags"))
    flags = [x.get(k) for k in ("review_flags", "unresolved_conflicts", "fraud_indicators")]
    x["risk_flag_count"] = sum(len(f) for f in flags if isinstance(f, list)) if any(isinstance(f, list) for f in flags) else None
    req, sub = x.get("required_documents"), x.get("submitted_documents")
    x["missing_document_count"] = len(set(req) - set(sub)) if isinstance(req, list) and isinstance(sub, list) else None
    rc = x.get("recorded_consents")
    x["missing_consent_count"] = len(set(REQUIRED_CONSENTS) - set(rc)) if isinstance(rc, list) else None
    conf = x.get("ocr_field_confidence")
    x["min_ocr_confidence"] = min(conf.values()) if isinstance(conf, dict) and conf else None
    dsl = x.get("days_since_last_decline")
    x["days_since_last_decline_or_never"] = 100000 if dsl is None and "days_since_last_decline" in dp else _num(dsl)
    # D-15: a blank signature box (signature_present false) leaves the signed document (NACH mandate / application
    # form) incomplete, so PL-088 asks for it. PL-104 stays a screening signal: nothing to screen, no effect.
    if x.get("signature_present") is False:
        x["missing_document_count"] = (x["missing_document_count"] or 0) + 1
    # D-14 / PL-082: expected EMI debits (bureau active EMIs, by month) not observed in the bank.
    x["missing_emi_debit_count"] = _missing_emi_debits(x.get("expected_emi_debits"), x.get("actual_emi_debits"))
    # PL-074 / PL-075: the engine recomputes the supplied EMI (calculated_emi) on the same principal, rate and tenure
    # the supplier used (PL-061 formula); a request changed since then does not make the supplied figure wrong.
    purpose = x.get("loan_purpose")
    if _num(x.get("interest_rate")) is None:
        x["interest_rate"] = _num(x.get("assessment_rate")) or (
            policy()["sizing"]["flat_rate_by_purpose"].get(purpose) if isinstance(purpose, str) else None)
    principal = _num(x.get("principal")) or _num(x.get("requested_amount"))
    rate, n = _num(x.get("interest_rate")), _num(x.get("loan_tenure_months")) or _num(x.get("tenure_months"))
    if principal and rate and n:
        x["independently_calculated_emi"] = _emi(principal, rate, int(n))
    # PL-099: the policy version the rules run under; evidence references come with the data points.
    x["policy_version"] = policy()["policy_version"]
    # PL-127: offset in days from the assessment date to the purpose date.
    key = PURPOSE_DATE.get(purpose) if isinstance(purpose, str) else None
    x["purpose_date_offset_days"] = _days(x.get(key), x.get("assessment_date")) if key and x.get(key) else None
    return x


def _missing_emi_debits(expected, actual):
    """How many expected EMI debits are not in the bank. Expected: {account: {amount, months_due}} (or a count);
    actual: [{month, amount}] (or a count). Each observed debit matches one expected debit of the same month and amount."""
    if isinstance(expected, (int, float)) and isinstance(actual, (int, float)) and not isinstance(expected, bool):
        return max(0, int(expected) - int(actual))
    if not isinstance(expected, dict) or not isinstance(actual, list):
        return None
    seen = {}
    for d in actual:
        if isinstance(d, dict) and d.get("month") is not None and _num(d.get("amount")) is not None:
            k = (str(d["month"]), round(float(d["amount"]), 2))
            seen[k] = seen.get(k, 0) + 1
    missing = 0
    for acc in expected.values():
        amt = _num((acc or {}).get("amount"))
        for month in (acc or {}).get("months_due") or []:
            k = (str(month), round(float(amt), 2) if amt is not None else None)
            if seen.get(k):
                seen[k] -= 1
            else:
                missing += 1
    return missing


# ------------------------------------------------------------------ PL-129 sizing
def _emi(p, rate, n):
    r = rate / 12
    return p * r * (1 + r) ** n / ((1 + r) ** n - 1)


def _principal(max_emi, rate, n):
    if max_emi <= 0:
        return 0.0
    r = rate / 12
    return max_emi * ((1 + r) ** n - 1) / (r * (1 + r) ** n)


def _band_cap(sz, score, months, category):
    best = None
    for band in ("B1", "B2", "B3"):
        ok = (score is not None and score >= sz["band_minimum_score"][band]
              and (months is None or months >= sz["band_min_employment_months"][band])
              and (category is None or not sz.get("band_employer_categories")
                   or category in sz["band_employer_categories"][band]))
        if ok:
            best = sz["amount_bands"][band][1]
    return best


def size_offer(requested: float, tenure: int, purpose: str, income: float, obligations: float = 0, *,
               score=None, ntc=False, employment_months=None, employment_category=None, evidence_amount=None) -> dict:
    """The largest passing amount at one flat rate (PL-129); every amount-dependent rule applied at the offer."""
    sz = policy()["sizing"]
    rate = sz["flat_rate_by_purpose"][purpose]
    max_tenure = sz["purpose_tenure_cap"][purpose]
    t = min(tenure, max_tenure)
    max_emi = min(sz["approved_maximum_foir"] * income - obligations, income - obligations - sz["min_residual_income"])
    caps = {"requested": requested, "product_cap": min(sz["purpose_amount_cap"][purpose], sz["mvp_amount_ceiling"]),
            "income_cap": sz["max_amount_income_multiple"] * income}
    if ntc:
        caps["ntc_cap"] = sz["ntc_indicative_cap"]
    else:
        bc = _band_cap(sz, score, employment_months, employment_category)
        caps["band_cap"] = bc if bc is not None else 0
    if purpose != "wedding" and evidence_amount:
        caps["evidence_cap"] = sz["evidence_tolerance"] * evidence_amount
    b2_upper = sz["amount_bands"]["B2"][1]
    max_emi_b3 = min(sz["band_review_foir"]["B3"] * income - obligations, max_emi)

    def best(months):
        c = dict(caps, foir_principal=_principal(max_emi, rate, months))
        amt, bind = math.floor(min(c.values()) / 1000) * 1000, min(c, key=c.get)
        if amt > b2_upper:  # PL-123: above Rs. 10 lakh size at the B3 review FOIR so the offer needs no review
            amt3 = math.floor(min(dict(c, foir_principal=_principal(max_emi_b3, rate, months)).values()) / 1000) * 1000
            if amt3 < amt:
                amt, bind = max(amt3, b2_upper), "b3_review_foir"
        return amt, bind

    amount, binding = best(t)
    offer_t = t
    if amount < requested and t < max_tenure:
        a2, b2 = best(max_tenure)
        if a2 > amount:
            amount, binding, offer_t = a2, b2, max_tenure
    if amount >= requested:
        amount, outcome = requested, ("APPROVED" if offer_t == tenure else "COUNTER_OFFER")
    elif amount >= sz["minimum_amount"]:
        outcome = "COUNTER_OFFER"
    else:
        outcome, amount = "DECLINE", 0
    return {"offer_outcome": outcome, "amount": amount, "tenure_months": offer_t if amount else None,
            "emi": round(_emi(amount, rate, offer_t)) if amount else None, "binding_cap": binding,
            "request_outside_mvp_range": requested > sz["mvp_amount_ceiling"]}


BINDING_CATEGORY = {"requested": None, "product_cap": "REQUEST_OUTSIDE_OFFER", "income_cap": "INCOME_NOT_VERIFIED_OR_INSUFFICIENT",
                    "foir_principal": "REPAYMENTS_TOO_HIGH", "b3_review_foir": "REPAYMENTS_TOO_HIGH",
                    "band_cap": "CREDIT_HISTORY", "ntc_cap": "CREDIT_HISTORY", "evidence_cap": "DOCUMENTS_INCOMPLETE_OR_UNCLEAR"}


# ------------------------------------------------------------------ decision
def _offer_emi(x: dict):
    """PL-079 compares the average balance with the EMI of the amount Saral would offer (PL-129), not the request:
    an over-cap or unaffordable request is sized down before the balance check. None when it cannot be sized."""
    try:
        s = size_offer(float(x["requested_amount"]), int(x["tenure_months"]), x["loan_purpose"],
                       float(x["monthly_net_income"]),
                       float(x.get("existing_monthly_obligations") or 0) + float(x.get("other_monthly_obligations") or 0),
                       score=x.get("bureau_score"), ntc=x.get("bureau_match_status") == "NO_HIT",
                       employment_months=x.get("employment_months"), employment_category=x.get("employment_category"),
                       evidence_amount=x.get("purpose_evidence_amount"))
    except (KeyError, TypeError, ValueError):
        return None
    return s["emi"]


def decide_v2(data_points: dict) -> dict:
    pol = policy()
    x = preprocess(data_points)
    offer_emi = _offer_emi(x)
    if offer_emi is not None:
        x["proposed_emi"] = offer_emi
    raw = _decision().evaluate(x, {"trace": True})
    trace = raw.get("trace") or {}
    outcomes = (trace.get("rule_outcomes") or {}).get("output") or {}
    zen_decision = raw["result"]["decision"]
    evals, cats = [], []
    for rid, meta in pol["rules"].items():
        res = outcomes.get("o_" + rid.replace("-", "_"), "NOT_EVALUABLE")
        eff = meta["effects"].get(res, "NONE") if res != "PASS" else "NONE"
        evals.append({"rule_id": rid, "rule_name": meta["name"], "result": res, "effect": eff})
    # PL-099 (trace completeness), second half: every compiled rule must have a result from ZEN.
    unevaluated = [e["rule_id"] for e in evals if e["result"] == "NOT_EVALUABLE"]
    if unevaluated and "PL-099" in pol["rules"]:
        for e in evals:
            if e["rule_id"] == "PL-099":
                e["result"], e["effect"], e["unevaluated"] = "REVIEW", "MANUAL_REVIEW", unevaluated
        if zen_decision in ("MORE_INFORMATION_REQUIRED", "ELIGIBILITY_CONDITIONS_MET"):
            zen_decision = "MANUAL_REVIEW"
    rank = {e: i for i, e in enumerate(("DECLINE", "MANUAL_REVIEW", "MORE_INFORMATION_REQUIRED"))}
    if zen_decision in rank:
        for e in evals:
            if e["effect"] == zen_decision:
                meta = pol["rules"][e["rule_id"]]
                cats.append(meta["missing_category"] if e["result"] == "INSUFFICIENT_DATA" else meta["reason_category"])
    decision, offer = zen_decision, None
    if zen_decision == "ELIGIBILITY_CONDITIONS_MET" and x.get("bureau_score") is None and x.get("bureau_match_status") != "NO_HIT":
        # Sizing needs the score for the band rules (PL-120); a missing input is never a decline.
        decision, cats = "MORE_INFORMATION_REQUIRED", ["DETAILS_NOT_VERIFIED"]
    elif zen_decision == "ELIGIBILITY_CONDITIONS_MET":
        s = size_offer(float(x["requested_amount"]), int(x["tenure_months"]), x["loan_purpose"],
                       float(x["monthly_net_income"]),
                       float(x.get("existing_monthly_obligations") or 0) + float(x.get("other_monthly_obligations") or 0),
                       score=x.get("bureau_score"), ntc=x.get("bureau_match_status") == "NO_HIT",
                       employment_months=x.get("employment_months"), employment_category=x.get("employment_category"),
                       evidence_amount=x.get("purpose_evidence_amount"))
        evals.append({"rule_id": "PL-129", "rule_name": "MVP offer sizing", "result": s["offer_outcome"],
                      "effect": "NONE", "binding_cap": s["binding_cap"]})
        if s["offer_outcome"] == "DECLINE":
            decision, cats = "DECLINE", ["REPAYMENTS_TOO_HIGH"]
        else:
            counter = s["offer_outcome"] == "COUNTER_OFFER"
            decision = "COUNTER_OFFER" if counter else "ELIGIBILITY_CONDITIONS_MET"
            offer = {"amount": s["amount"], "emi": s["emi"], "tenure_months": s["tenure_months"], "counter_offer": counter,
                     "request_outside_mvp_range": s["request_outside_mvp_range"]}
            if counter:
                cats = ["REQUEST_OUTSIDE_OFFER" if s["request_outside_mvp_range"] else
                        (BINDING_CATEGORY.get(s["binding_cap"]) or "REQUEST_OUTSIDE_OFFER")]
    seen = []
    for c in cats:
        if c not in seen:
            seen.append(c)
    return {"decision": decision, "zen_decision": zen_decision, "rule_evaluations": evals, "reason_categories": seen,
            "offer": offer, "policy": {"id": pol["policy_id"], "version": pol["policy_version"],
                                       "catalogue_version": pol["catalogue_version"], "synthetic": True},
            "zen_trace": trace}


# ------------------------------------------------------------------ stored evidence (decision-evidence/1, additive)
LIFECYCLE_FOR = {"DECLINE": "REJECTED", "MANUAL_REVIEW": "MANUAL_REVIEW", "MORE_INFORMATION_REQUIRED": "INFO_REQUESTED",
                 "ELIGIBILITY_CONDITIONS_MET": "APPROVED", "COUNTER_OFFER": "APPROVED"}


def build_record_v2(result: dict, policy_version, data_points: dict, *, application_ref: str, applicant_ref,
                    lifecycle_state: str, missing_fields=None, flags=None, now=None, bureau=None, review=None) -> dict:
    """The v2 decision as a decision-evidence/1 record. Rule rows carry the rule id, result and effect only
    (thresholds live in the pinned policy file, by hash); reason categories and the offer are what the borrower sees."""
    import hashlib
    import uuid
    from datetime import datetime, timezone

    from decision_engine.evidence.evidence_record import ENGINE, NS, SCHEMA, _sha, stable_trace

    used = {k: v for k, v in sorted(data_points.items()) if isinstance(v, (int, float, str, bool)) or v is None}
    input_sha = _sha(used)
    rec_key = [application_ref, input_sha, policy_version.policy_sha256, policy_version.jdm_sha256, "False",
               "v2=" + _sha({"decision": result["decision"], "offer": result["offer"], "bureau": bureau, "review": review})]
    trace_bytes = json.dumps(stable_trace(result.get("zen_trace") or {}), sort_keys=True).encode()
    evals = [{"rule_id": e["rule_id"], "rule_name": e["rule_name"], "reason_code": e["rule_id"], "result": e["result"],
              "effect": e["effect"], "operator": None, "threshold": None, "actual_value": None,
              "threshold_source": policy_version.threshold_source} for e in result["rule_evaluations"]]
    return {
        "schema": SCHEMA, "record_id": str(uuid.uuid5(NS, "|".join(rec_key))),
        "application_ref": application_ref, "applicant_ref": applicant_ref,
        "decision": result["decision"], "lifecycle_state": lifecycle_state, "is_simulation": False,
        "policy": policy_version.meta(),
        "inputs": {"values": {k: used.get(k) for k in ("requested_amount", "tenure_months", "loan_purpose",
                                                       "monthly_net_income", "existing_monthly_obligations",
                                                       "employment_months", "bureau_score")},
                   "input_sha256": input_sha, "missing_fields": missing_fields or []},
        "rule_evaluations": evals,
        "failed_reason_codes": [e["rule_id"] for e in evals if e["effect"] not in ("NONE", "NO_EFFECT")],
        "reason_categories": result["reason_categories"], "offer": result["offer"],
        "outcome": result["decision"], "review": review, "bureau": bureau, "flags": list(flags or []),
        "engine": ENGINE, "evaluated_at": (now or datetime.now(timezone.utc)).isoformat(),
        "trace_ref": {"sha256": hashlib.sha256(trace_bytes).hexdigest(), "bytes": len(trace_bytes)},
        "error": None,
    }
