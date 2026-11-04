"""Every ZEN input, resolved per applicant from the synthetic records, plus a validator.

``attach_zen_inputs(universe)`` adds to each applicant:

* ``zen_inputs``: a flat ``{input_name: value}`` for every applicant-data input named in
  ``zen_input_catalogue.CATALOGUE_INPUTS`` (rule catalogue PL-001..PL-128 + ZenInput data points).
* ``zen_data_points``: the 30 contract data points in the ``contracts/zen.py`` DataPoint shape
  (value, source, fallback_used, low_confidence, source_document_ids).

Values are a *reference preprocessing* of synthetic data so a ZEN harness can run without the
OCR/bureau/bank services; they are not production preprocessing. No full PAN or Aadhaar ever
appears in these blocks (hashes, masked forms and last 4 only).

``validate(applicant)`` returns the inputs that are missing: absent, or null where the
scenario does not explain the null. A test fails if any applicant has one.
"""
from __future__ import annotations

import base64
import hashlib
import json
import re
from datetime import date, timedelta
from difflib import SequenceMatcher
from statistics import mean, median, pstdev

from . import product
from .bank import statement_content_hash
from .zen_input_catalogue import CATALOGUE_INPUTS, INPUT_CLASS, ZEN_DATA_POINTS

# The vendored data dictionary decides the class of every input (contracts_snapshot @ cc202ae):
# POLICY_PARAMETER lives in the catalogue, ZEN_PRODUCED is written by ZEN, APPLICANT is carried here.
POLICY_PARAMETERS = {n for n, c in INPUT_CLASS.items() if c == "POLICY_PARAMETER"}
ZEN_PRODUCED = {n for n, c in INPUT_CLASS.items() if c == "ZEN_PRODUCED"}
APPLICANT_INPUTS = sorted(n for n, c in INPUT_CLASS.items() if c == "APPLICANT")
OCR_FLOOR = 60  # PL-089 minimum_confidence (A-16)

# Null means "none happened", which is a valid value, not missing data.
NULL_MEANS_NONE = {"last_decline_date", "days_since_last_decline", "last_dpd_date", "days_since_last_dpd",
                   "wedding_date", "course_start_date", "property_ownership", "treatment_date"}
BUREAU_INPUTS = {
    "active_account_count", "active_credit_accounts", "active_personal_loan_count", "bureau_accounts",
    "bureau_address", "bureau_data_quality_flags", "bureau_dob", "bureau_enquiries", "bureau_identity",
    "bureau_name", "bureau_report_date", "bureau_score", "closed_account_count", "credit_card_balance",
    "credit_card_balances", "credit_card_payment_history", "credit_history_months", "credit_score",
    "current_default_count", "current_exposure", "current_score", "dpd_history", "dpd_occurrence_count",
    "duplicate_tradeline_count", "enquiries_6m", "enquiries_last_30_days", "enquiries_last_6_months",
    "enquiries_last_90_days", "enquiry_count", "exposure_growth_percentage", "historical_exposure",
    "historical_scores", "max_dpd_12m", "max_dpd_24m", "missed_payment_count", "oldest_account_date",
    "payment_regularity_indicator", "recent_loan_application_count", "recent_open_account_count",
    "recent_unsecured_account_count", "recently_opened_account_count", "repayment_history",
    "restructured_account_count", "risk_grade", "score_trend", "secured_account_count", "settled_account_count",
    "settled_within_lookback", "suit_filed_status", "total_credit_limits", "total_unsecured_exposure",
    "unsecured_account_count", "utilisation_ratio", "writeoff_settlement_24m", "writeoff_settlement_older",
    "written_off_account_count", "written_off_within_lookback", "total_overdue_amount", "reported_card_emi",
    "total_existing_exposure", "address_similarity",
}
SCORE_INPUTS = {"bureau_score", "credit_score", "current_score", "historical_scores", "score_trend", "risk_grade"}
NO_ACCOUNT_NULLS = {"credit_card_balance", "credit_card_balances", "credit_card_payment_history", "credit_history_months",
                    "oldest_account_date", "total_credit_limits", "utilisation_ratio", "historical_exposure",
                    "exposure_growth_percentage", "bureau_name", "bureau_dob", "bureau_address", "bureau_identity",
                    "reported_card_emi", "payment_regularity_indicator"}


def designed_nulls(app: dict) -> set[str]:
    """Inputs whose null is the point of the scenario (no bureau, no score, YOB-only e-KYC, ...)."""
    sc = app["scenario"]["id"]
    out = set(NULL_MEANS_NONE)
    rep_missing = app["bureau_link"]["report_id"] is None
    if rep_missing:
        out |= BUREAU_INPUTS
    if sc in ("BUREAU_NO_HIT", "BUREAU_THIN_FILE", "BUREAU_UNAVAILABLE"):
        out |= SCORE_INPUTS
    if sc in ("BUREAU_NO_HIT", "BUREAU_UNAVAILABLE", "BUREAU_THIN_FILE"):
        out |= NO_ACCOUNT_NULLS
    if app["bureau_link"]["identity_on_file"] is None:
        out |= {"bureau_name", "bureau_dob", "bureau_address", "bureau_identity", "address_similarity"}
    if sc == "IDENTITY_INCOMPLETE":
        out |= {"applicant_dob", "kyc_dob_match"}
    if sc == "SIG_MISSING":
        out |= {"signature_similarity", "signature_anomaly_score", "signature_crop_sha256"}
    if app["product"]["purpose_evidence_amount"] is None:
        out.add("purpose_evidence_amount")
    if app["loan_request"]["product_id"] is None:
        out |= {"product_purpose"}
    return out


def _b32(data: bytes) -> str:
    """Hashes inside ZEN blocks are base32, not hex: a hex digest can contain a 12-digit run, which
    the contracts' NoRawIdentifiers Aadhaar pattern (contracts/common.py) would reject."""
    return "b32:" + base64.b32encode(hashlib.sha256(data).digest()).decode().rstrip("=")[:32]


def _h(value: str) -> str:
    return _b32(f"saral-synthetic:{value}".encode())


def _sim(a: str | None, b: str | None) -> float | None:
    if not a or not b:
        return None
    return round(SequenceMatcher(None, a.upper(), b.upper()).ratio(), 3)


def _age(dob: date, on: date) -> int:
    return on.year - dob.year - ((on.month, on.day) < (dob.month, dob.day))


def _months(a: date, b: date) -> int:
    m = (b.year - a.year) * 12 + b.month - a.month
    return max(0, m - (1 if b.day < a.day else 0))


DPD_DAYS = {"ON_TIME": 0, "DPD_30": 30, "DPD_60": 60, "DPD_90_PLUS": 90}


def derive(app: dict, stmt: dict, report: dict | None, universe: dict) -> dict:
    as_of = date.fromisoformat(app["as_of"])
    ident, ek, pan, emp = app["identity"], app["aadhaar_ekyc"], app["pan"], app["employment"]
    pan_number = app["specimen_truth"]["pan_number"]  # only ever hashed here
    d, lr, prod, sig = app["declared"], app["loan_request"], app["product"], app["signature"]
    tx = stmt["transactions"]
    # Preprocessing reads the categoriser's ``category`` and amounts, never ``synthetic_truth_tag`` (test ground truth).
    bureau_emis = {a["monthly_obligation"] for a in (report or {}).get("accounts", [])
                   if a["status"] == "ACTIVE" and a["monthly_obligation"] and a["account_type"] != "CREDIT_CARD"}
    returned = {(t["date"], t["amount"]) for t in tx if t["category"] in ("NACH_RETURN", "CHEQUE_RETURN")}

    def is_bureau_emi(t):
        return t["category"] == "EMI" and t["type"] == "DEBIT" and t["amount"] in bureau_emis and (t["date"], t["amount"]) not in returned

    def is_other_emi(t):
        return t["category"] == "EMI" and t["type"] == "DEBIT" and t["amount"] not in bureau_emis and (t["date"], t["amount"]) not in returned
    f: dict = {}
    # ---- request / product
    f.update(loan_amount=lr["amount"], requested_amount=lr["amount"], principal=lr["amount"],
             tenure_months=lr["tenure_months"], loan_tenure_months=lr["tenure_months"],
             purpose=lr["purpose"], loan_purpose=lr["purpose"], declared_purpose=lr["purpose"],
             product_purpose=lr["product_purpose"], amount_band=lr["amount_band"],
             assessment_rate=lr["assessment_rate_pa"], purpose_evidence_status=prod["purpose_evidence_status"],
             purpose_evidence_amount=prod["purpose_evidence_amount"],
             payee_account_present=prod["payee_account_present"],
             wedding_date=prod["fields"].get("wedding_date"), course_start_date=prod["fields"].get("course_start_date"),
             property_ownership=prod["fields"].get("property_ownership"),
             treatment_date=prod["fields"].get("treatment_date"))
    # ---- applicant
    dob = date.fromisoformat(ident["date_of_birth"])
    age = _age(dob, as_of)
    f.update(date_of_birth=ident["date_of_birth"], applicant_dob=ek["dob"], assessment_date=app["as_of"],
             age_at_assessment=age, age_at_application=age,
             age_at_maturity=round(age + lr["tenure_months"] / 12, 2), nationality=d["nationality"],
             employment_type="SALARIED", employment_status=d["employment_type"],
             employment_category=d["employer_category"], employer_category=d["employer_category"],
             employer_name=d["employer_name"], employment_start_date=emp["employment_start_date"],
             employment_months=d["months_with_current_employer"], total_experience_months=d["total_experience_months"],
             employment_gap_months=max(emp["employment_gap_months"], default=0),
             employment_history=emp["history"], employer_history=emp["history"],
             employer_changes_24m=emp["employer_changes_24m"],
             employer_stability_indicator="UNSTABLE" if emp["employer_changes_24m"] >= 3 else "STABLE",
             months_at_current_address=ident["months_at_address"], applicant_city=ident["city"],
             applicant_identifier=app["applicant_id"], applicant_name=ek["name"],
             applicant_address={"city": ident["city"], "pincode": ident["address"]["pincode"],
                                "state": ident["state"]})
    f["applicant_identity"] = {"name": ek["name"], "dob": ek["dob"], "pan_masked": pan["pan_masked"],
                               "aadhaar_last4": ek["aadhaar_last4"]}
    supplied = [k for k, v in (("full_name", ek["name"]), ("date_of_birth", ek["dob"]),
                               ("pan_masked", pan["pan_masked"]), ("kyc_document", ek["record_id"])) if v]
    f["supplied_identity_fields"] = supplied
    f["identity_verification_status"] = "COMPLETE" if len(supplied) == 4 and ek["address"]["line_masked"] else "PARTIAL"
    # ---- income
    salary = [t for t in tx if t["category"] == "SALARY"]
    reversed_amt = {t["date"][:7]: t["amount"] for t in tx if t["category"] == "SALARY_REVERSAL"}
    months = sorted({t["date"][:7] for t in tx})
    by_month = {m: 0.0 for m in months}
    for t in salary:
        by_month[t["date"][:7]] += t["amount"]
    for m, a in reversed_amt.items():
        by_month[m] -= a
    series = [round(by_month[m], 2) for m in months]
    last3 = series[-3:]
    slips = emp["payslips"]
    payslip_avg = round(mean(s["net"] for s in slips), 2)
    bank_avg = round(mean(last3), 2) if last3 else 0.0
    ocr_slips = [e for e in app["ocr_extractions"] if e["document_kind"] == "salary_slip"]
    ocr_income = ocr_slips[-1]["fields"]["net_salary"]["value"] if ocr_slips else None
    verified = round(median(last3), 2) if last3 else 0.0
    net_income = min(d["monthly_net_income"], verified) if verified > 0 else d["monthly_net_income"]
    f.update(declared_income=d["monthly_net_income"], declared_salary=d["monthly_net_income"],
             gross_income=slips[-1]["gross"], deductions=slips[-1]["total_deductions"],
             payslip_net_avg=payslip_avg, payslip_count=len(slips), bank_salary_credit_avg=bank_avg,
             observed_salary_credits=[t["amount"] for t in salary], verified_income=verified,
             ocr_extracted_income=ocr_income, monthly_net_income=net_income, net_monthly_income=net_income,
             monthly_income_history=series, average_monthly_income=round(mean(series), 2) if series else 0.0,
             assessment_period=f"{stmt['summary']['months']}M", assessment_window="12M",
             statement_months=stmt["summary"]["months"])
    var = round(pstdev(series) / mean(series), 4) if series and mean(series) else 0.0
    f.update(income_variation=var, income_variance_ratio=var, monthly_income_variance=var)
    hist = series[:-3] or series
    f.update(historical_income=round(mean(hist), 2), recent_income=round(mean(last3), 2) if last3 else 0.0)
    f["income_reduction_percentage"] = round(max(0.0, 1 - f["recent_income"] / f["historical_income"]) * 100, 2) \
        if f["historical_income"] else 0.0
    gap = abs(payslip_avg - bank_avg) / bank_avg if bank_avg else 1.0
    f["salary_match_status"] = "MATCH" if gap <= 0.10 else "MISMATCH"
    f["income_match_status"] = "MATCH" if abs(d["monthly_net_income"] - verified) <= 0.10 * max(verified, 1) else "MISMATCH"
    narr = emp["employer_narration"]
    f["salary_credit_employer"] = salary[-1]["narration"].replace("NEFT CR SAL ", "").rsplit(" ", 1)[0] if salary else None
    f["employer_name_similarity"] = _sim(f["salary_credit_employer"], narr) or 0.0
    f["salary_credit_months"] = sum(1 for m in months[-3:] if by_month[m] > 0)
    f["salary_credit_consistency"] = "CONSISTENT" if f["salary_credit_months"] == 3 and var <= 0.25 else "INCONSISTENT"
    f["salary_reversal_indicator"] = bool(reversed_amt)
    # ---- KYC consistency
    pan_ocr = next(e for e in app["ocr_extractions"] if e["document_kind"] == "pan_card")
    pan_read = pan_ocr["fields"]["pan_number"]["value"]
    names = [ek["name"], pan["name_on_pan"], stmt["account"]["holder_name"]]
    score = min(_sim(names[0], n) for n in names[1:])
    f.update(kyc_name_match_score=score, name_similarity=score,
             kyc_dob_match=(ek["dob"] == pan["dob_on_pan"]) if ek["dob"] else None,
             kyc_id_last4_match=pan_read == pan["pan_masked"],
             pan_format_valid=bool(re.fullmatch(r"XXXXX\d{4}X", pan_read or "")))
    f["identity_fields"] = f["applicant_identity"]
    f["extracted_identity_fields"] = {"pan_name": pan_ocr["fields"]["name"]["value"],
                                      "pan_dob": pan_ocr["fields"]["date_of_birth"]["value"],
                                      "pan_masked": pan_read,
                                      "bank_holder_name": stmt["account"]["holder_name"]}
    f["identity_match_status"] = "MATCH" if score >= 0.85 and f["kyc_dob_match"] is not False else "MISMATCH"
    # ---- bureau
    bl = app["bureau_link"]
    on_file = bl["identity_on_file"]
    f["bureau_report_status"] = "UNAVAILABLE" if report is None else (
        "NO_HIT" if not report["accounts"] else "RECEIVED")
    f["bureau_match_status"] = ("UNAVAILABLE" if report is None else "NO_HIT" if not report["accounts"]
                                else "MATCH" if report["identity"]["match"] else "MISMATCH")
    f.update(bureau_name=on_file and on_file["name"], bureau_dob=on_file and on_file["dob"],
             bureau_address=on_file and {"city": on_file["address_city"], "pincode": on_file["address_pincode"]},
             bureau_identity=on_file)
    f["name_match_status"] = "MATCH" if on_file and on_file["name"].upper() == ek["name"].upper() else (
        "MISMATCH" if on_file else "NOT_AVAILABLE")
    f["dob_match_status"] = "MATCH" if on_file and on_file["dob"] == ident["date_of_birth"] else (
        "MISMATCH" if on_file else "NOT_AVAILABLE")
    f["address_similarity"] = (1.0 if on_file["address_city"] == ident["city"] else 0.0) if on_file else None
    f["address_match_status"] = ("MATCH" if f["address_similarity"] == 1.0 else "MISMATCH") if on_file else "NOT_AVAILABLE"
    if report is not None:
        accts, enq = report["accounts"], report["enquiries"]
        f["bureau_report_date"] = report["report_date"]
        f["report_age_days"] = (as_of - date.fromisoformat(report["report_date"])).days
        f["bureau_data_quality_flags"] = [i["code"] for i in report["data_quality"]["issues"]]
        sv = report["score"]["value"]
        f.update(bureau_score=sv, credit_score=sv, current_score=sv)
        f["bureau_accounts"] = [a["account_id"] for a in accts]
        active = [a for a in accts if a["status"] == "ACTIVE"]
        f["active_credit_accounts"] = [a["account_id"] for a in active]
        f["active_account_count"] = len(active)
        f["active_personal_loan_count"] = sum(1 for a in active if a["account_type"] == "PERSONAL_LOAN")
        f["closed_account_count"] = sum(1 for a in accts if a["status"] != "ACTIVE" and a["status"] != "DEFAULT")
        f["current_default_count"] = sum(1 for a in accts if a["status"] == "DEFAULT")
        keys = [(a["account_type"], a["opened_on"], a["original_amount"], a["current_balance"]) for a in accts]
        f["duplicate_tradeline_count"] = len(keys) - len(set(keys))
        opened = [date.fromisoformat(a["opened_on"]) for a in accts]
        f["oldest_account_date"] = min(opened).isoformat() if opened else None
        f["credit_history_months"] = _months(min(opened), as_of) if opened else None
        secured = {"AUTO_LOAN", "HOME_LOAN"}
        f["secured_account_count"] = sum(1 for a in accts if a["account_type"] in secured)
        f["unsecured_account_count"] = sum(1 for a in accts if a["account_type"] not in secured)
        six = as_of - timedelta(days=182)
        recent = [a for a in accts if date.fromisoformat(a["opened_on"]) > six]
        f["recent_open_account_count"] = f["recently_opened_account_count"] = len(recent)
        f["recent_unsecured_account_count"] = sum(1 for a in recent if a["account_type"] not in secured)
        cards = [a for a in accts if a["account_type"] in ("CREDIT_CARD", "OVERDRAFT")]
        f["credit_card_balances"] = [a["current_balance"] for a in cards] if cards else None
        f["credit_card_balance"] = sum(a["current_balance"] for a in cards) if cards else None
        f["total_credit_limits"] = sum(a["credit_limit"] or 0 for a in cards) if cards else None
        f["utilisation_ratio"] = round(f["credit_card_balance"] / f["total_credit_limits"], 4) if cards else None
        f["reported_card_emi"] = sum(a["monthly_obligation"] for a in cards) if cards else None
        f["credit_card_payment_history"] = [p for a in cards for p in a["payment_history"]] if cards else None
        f["total_unsecured_exposure"] = sum(a["current_balance"] for a in accts if a["account_type"] not in secured)
        f["current_exposure"] = sum(a["current_balance"] for a in accts)
        f["total_existing_exposure"] = f["current_exposure"]
        f["dpd_history"] = {a["account_id"]: a["payment_history"] for a in accts}
        f["repayment_history"] = f["dpd_history"]
        days12 = [DPD_DAYS[p] for a in accts for p in a["payment_history"][-12:]]
        days24 = [DPD_DAYS[p] for a in accts for p in a["payment_history"][-24:]]
        f["max_dpd_12m"] = max(days12, default=0)
        f["max_dpd_24m"] = max(days24, default=0)
        f["dpd_occurrence_count"] = sum(1 for x in days24 if x > 0)
        f["missed_payment_count"] = sum(1 for p in (f["credit_card_payment_history"] or []) if p != "ON_TIME")
        allp = [p for a in accts for p in a["payment_history"][-24:]]
        f["payment_regularity_indicator"] = round(sum(1 for p in allp if p == "ON_TIME") / len(allp), 4) if allp else None
        last_dpd_back = None
        for a in accts:
            h = a["payment_history"]
            for back, p in enumerate(reversed(h)):
                if p != "ON_TIME":
                    last_dpd_back = back if last_dpd_back is None else min(last_dpd_back, back)
                    break
        f["last_dpd_date"] = (as_of - timedelta(days=30 * last_dpd_back)).isoformat() if last_dpd_back is not None else None
        f["days_since_last_dpd"] = 30 * last_dpd_back if last_dpd_back is not None else None
        f["total_overdue_amount"] = sum(a["monthly_obligation"] * 3 or a["current_balance"] // 10
                                        for a in accts if a["status"] == "DEFAULT")
        wo = [a for a in accts if a["status"] == "WRITTEN_OFF"]
        st = [a for a in accts if a["status"] == "SETTLED"]

        def within(lst, days=730):
            return sum(1 for a in lst if a["closed_on"] and (as_of - date.fromisoformat(a["closed_on"])).days <= days)

        f.update(written_off_account_count=len(wo), settled_account_count=len(st),
                 written_off_within_lookback=within(wo) > 0, settled_within_lookback=within(st) > 0,
                 writeoff_settlement_24m=within(wo) + within(st) > 0,
                 writeoff_settlement_older=(len(wo) + len(st)) > within(wo) + within(st))
        f["suit_filed_status"] = False         # not representable in bureau-report/1 (see doc)
        f["restructured_account_count"] = 0   # not representable in bureau-report/1 (see doc)
        f["bureau_enquiries"] = [{"enquired_on": e["enquired_on"], "purpose": e["purpose"]} for e in enq]
        age_d = [(as_of - date.fromisoformat(e["enquired_on"])).days for e in enq]
        f["enquiries_last_30_days"] = sum(1 for x in age_d if x <= 30)
        f["enquiries_last_90_days"] = sum(1 for x in age_d if x <= 90)
        f["enquiries_last_6_months"] = f["enquiries_6m"] = sum(1 for x in age_d if x <= 182)
        f["enquiry_count"] = len(enq)
        f["recent_loan_application_count"] = sum(1 for e, x in zip(enq, age_d) if e["purpose"] == "PERSONAL_LOAN" and x <= 90)
        side = bl["history_sidecar"]
        f["historical_scores"] = [s["value"] for s in side["scores"]] if side else None
        if side and sv is not None:
            first = side["scores"][0]["value"]
            f["score_trend"] = "DECLINING" if sv < first - 20 else ("IMPROVING" if sv > first + 20 else "STABLE")
        else:
            f["score_trend"] = None
        f["historical_exposure"] = side["exposure_12m_ago"] if side else None
        f["exposure_growth_percentage"] = round((f["current_exposure"] / f["historical_exposure"] - 1) * 100, 2) \
            if side and side["exposure_12m_ago"] else None
        if sv is None:
            f["risk_grade"] = "NTC" if not accts or report["score"]["status"] != "AVAILABLE" else None
        elif sv >= 750 and f["max_dpd_24m"] == 0:
            f["risk_grade"] = "A"
        elif sv >= 700 and f["max_dpd_12m"] == 0:
            f["risk_grade"] = "B"
        elif sv >= 650 and f["max_dpd_12m"] <= 30:
            f["risk_grade"] = "C"
        else:
            f["risk_grade"] = "INELIGIBLE"
        if not accts:
            f["risk_grade"] = "NTC"
    else:
        f["report_age_days"] = None
        for k in BUREAU_INPUTS:
            f.setdefault(k, None)
    # One flat prototype rate per product; no risk-grade pricing in the MVP (ADR-0007 #3).
    f["applicant_pricing_band"] = "FLAT_PER_PRODUCT"
    f["interest_rate"] = product.FLAT_RATE.get(lr["product_id"], product.ASSESSMENT_RATE)
    # ---- obligations and affordability
    bureau_emi = bl["installment_obligation_total"]
    existing = max(bureau_emi, d["monthly_obligations"])
    proposed = lr["proposed_emi_at_assessment_rate"]
    undeclared = sum(t["amount"] for t in tx if is_other_emi(t) and t["date"][:7] == months[-1])
    f.update(existing_monthly_obligations=bureau_emi, existing_obligations=existing, existing_emi_total=existing,
             declared_obligations=d["monthly_obligations"], other_monthly_obligations=round(undeclared, 2),
             proposed_emi=proposed, calculated_emi=proposed,
             independently_calculated_emi=product.emi(lr["amount"], lr["tenure_months"]))
    total = existing + undeclared + proposed
    f["total_monthly_obligations"] = round(total, 2)
    f["foir"] = round(total / net_income, 4) if net_income else None
    f["residual_income"] = round(net_income - total, 2)
    f["maximum_affordable_emi"] = round(max(0.0, min(product.MAX_FOIR * net_income, net_income - product.MIN_RESIDUAL)
                                            - existing - undeclared), 2)
    f["_offer"] = offer_for(lr, f, prod)
    f["eligible_amount"] = f["_offer"]["eligible_amount"] if f["_offer"] else 0
    # ---- bank
    bals = [t["balance_after"] for t in tx]
    f["bank_transactions"] = {"statement_id": stmt["statement_id"], "txn_count": len(tx),
                              "content_hash": _b32(stmt["integrity"]["content_sha256"].encode())}
    f["average_monthly_balance"] = round(mean(bals), 2) if bals else 0.0
    f["negative_balance_count"] = sum(1 for b in bals if b < 0)
    f["return_count"] = sum(1 for t in tx if t["category"] in ("NACH_RETURN", "CHEQUE_RETURN")
                            and t["date"][:7] in months[-3:])
    credits = [t for t in tx if t["type"] == "CREDIT" and t["category"] not in ("NACH_RETURN", "CHEQUE_RETURN")]
    total_cr = sum(t["amount"] for t in credits)
    total_dr = sum(t["amount"] for t in tx if t["type"] == "DEBIT" and (t["date"], t["amount"]) not in returned)
    f.update(total_credits=round(total_cr, 2), total_debits=round(total_dr, 2),
             debit_credit_ratio=round(total_dr / total_cr, 4) if total_cr else None,
             cash_deposit_percentage=round(100 * sum(t["amount"] for t in credits if t["mode"] == "CASH") / total_cr, 2)
             if total_cr else 0.0)
    exp = {}
    for a in (report or {}).get("accounts", []):
        if a["status"] == "ACTIVE" and a["monthly_obligation"] and a["account_type"] != "CREDIT_CARD":
            first_due = (date.fromisoformat(a["opened_on"]) + timedelta(days=31)).isoformat()[:7]
            exp[a["account_id"]] = {"amount": a["monthly_obligation"], "months_due": [m for m in months[-3:] if m > first_due]}
    f["expected_emi_debits"] = exp
    f["actual_emi_debits"] = sorted({(t["date"][:7], t["amount"]) for t in tx if is_bureau_emi(t)})
    f["actual_emi_debits"] = [{"month": m, "amount": a} for m, a in f["actual_emi_debits"]]
    rec = {}
    for t in tx:
        if t["type"] == "DEBIT" and t["mode"] in ("NACH", "ECS") and "REPRESENT" not in t["narration"]:
            rec.setdefault(t["narration"], set()).add(t["date"][:7])
    f["observed_recurring_debits"] = sorted(n for n, ms in rec.items() if len(ms) >= 3)
    f["debt_mismatch"] = bool(undeclared) or d["monthly_obligations"] < bureau_emi
    f["anomaly_indicators"] = sorted({"SALARY_REVERSAL"} if f["salary_reversal_indicator"] else set())
    # ---- documents, integrity, fraud
    docs = app["documents"]
    f.update(submitted_documents=docs["submitted"], required_documents=docs["required"],
             required_docs_present=set(docs["required"]) <= set(docs["submitted"]),
             recorded_consents=[k for k in ("bureau_pull", "aa_data_fetch", "terms", "privacy") if app["consents"][k]])
    conf = {f"{e['document_kind']}.{k}": v["confidence"] for e in app["ocr_extractions"] for k, v in e["fields"].items()}
    f["ocr_field_confidence"] = conf
    f["min_ocr_confidence"] = min(conf.values())
    f["low_confidence"] = f["min_ocr_confidence"] < OCR_FLOOR
    latest = slips[-1]
    f.update(document_kind="SALARY_SLIP", document_date=latest["document_date"],
             document_age_days=(as_of - date.fromisoformat(latest["document_date"])).days)
    f["document_hash"] = {s["document_id"]: _b32(json.dumps(s, sort_keys=True).encode()) for s in slips}
    others = [a for a in universe["applicants"] if a["applicant_id"] < app["applicant_id"]]
    my_slips = {s["record_id"] for s in slips}
    f["duplicate_document_result"] = "DUPLICATE" if any(my_slips & {s["record_id"] for s in a["employment"]["payslips"]}
                                                        for a in others) else "UNIQUE"
    recomputed = statement_content_hash(stmt) == stmt["integrity"]["content_sha256"]
    prev, breaks = round(stmt["summary"]["opening_balance"] * 100), 0
    for t in tx:
        amt = round(t["amount"] * 100)
        if round(t["balance_after"] * 100) != prev + (amt if t["type"] == "CREDIT" else -amt):
            breaks += 1
        prev = round(t["balance_after"] * 100)
    flags = (["CONTENT_HASH_MISMATCH"] if not recomputed else []) + (["BALANCE_ARITHMETIC_BREAK"] if breaks else [])
    f.update(statement_integrity_result="FAIL" if flags else "PASS", statement_validation_flags=flags,
             tampering_flags=flags, document_integrity_result="FAIL" if flags else "PASS")
    dup = next((a for a in others if a["specimen_truth"]["pan_number"] == pan_number), None)
    f["duplicate_match_result"] = f"MATCH:{dup['applicant_id']}" if dup else "NO_MATCH"
    f["pan_hash"], f["phone_hash"], f["email_hash"] = _h(pan_number), _h(ident["phone"]), _h(ident["email"])
    # Only earlier applicants: a prefix of the universe must resolve to the same inputs.
    f["shared_contact_pan_count"] = len({a["specimen_truth"]["pan_number"] for a in others
                                         if a["identity"]["phone"] == ident["phone"] and a["specimen_truth"]["pan_number"] != pan_number})
    lists = universe["internal_lists"]
    f["negative_list_hit"] = any(n["pan"] == pan_number for n in lists["negative_list"])
    f["employer_caution_list_hit"] = any(c["employer_name"] == d["employer_name"] for c in lists["employer_caution_list"])
    f["last_decline_date"] = app["application_history"]["last_decline_date"]
    f["days_since_last_decline"] = (as_of - date.fromisoformat(f["last_decline_date"])).days if f["last_decline_date"] else None
    scr = sig["screening"]
    f.update(signature_present=scr["present"], signature_similarity=scr["similarity"],
             signature_anomaly_score=scr["anomaly_score"], signature_crop_sha256=scr["crop_sha256"])
    comparisons = {"kyc_name": f["identity_match_status"], "kyc_dob": f["kyc_dob_match"],
                   "bureau_name": f["name_match_status"], "bureau_dob": f["dob_match_status"],
                   "bureau_address": f["address_match_status"], "income": f["income_match_status"],
                   "salary": f["salary_match_status"]}
    f["evidence_comparison_results"] = comparisons
    f["conflict_flags"] = sorted(k for k, v in comparisons.items() if v in ("MISMATCH", False))
    fraud = [k for k, v in (("NEGATIVE_LIST", f["negative_list_hit"]), ("EMPLOYER_CAUTION", f["employer_caution_list_hit"]),
                            ("DUPLICATE_APPLICANT", dup is not None), ("SHARED_CONTACT", f["shared_contact_pan_count"] > 0),
                            ("DUPLICATE_DOCUMENT", f["duplicate_document_result"] == "DUPLICATE"),
                            ("STATEMENT_TAMPERED", bool(flags))) if v]
    f["fraud_indicators"] = fraud
    f["unresolved_conflicts"] = f["conflict_flags"]
    f["review_flags"] = sorted(set(f["conflict_flags"]) | set(fraud))
    f["evidence_references"] = sorted({e["document_id"] for e in app["ocr_extractions"]}
                                      | {x["document_id"] for x in prod["documents"]}
                                      | ({bl["report_ref_contract"]} if bl["report_ref_contract"] else set()))
    return f


def offer_for(lr: dict, f: dict, prod: dict) -> dict | None:
    """PL-129 on this applicant's resolved inputs (None when no product applies)."""
    if not lr["product_purpose"] or not f["monthly_net_income"]:
        return None
    return product.pl129_offer(lr["amount"], lr["tenure_months"], lr["product_purpose"], f["monthly_net_income"],
                               f["existing_monthly_obligations"] or 0, f["other_monthly_obligations"] or 0,
                               f.get("bureau_score"), f["bureau_match_status"], f["employment_months"],
                               f["employment_category"], prod["purpose_evidence_amount"])


# ------------------------------------------------------------------ contract data points

def data_points(app: dict, f: dict) -> dict:
    """The 30 contracts/zen.py DataPointName values in the DataPoint shape."""
    slip_ids = [s["document_id"] for s in app["employment"]["payslips"]]
    stmt_doc = next(e["document_id"] for e in app["ocr_extractions"] if e["document_kind"] == "bank_statement")
    kyc_docs = [e["document_id"] for e in app["ocr_extractions"] if e["document_kind"] in ("pan_card", "aadhaar_card")]
    low = f["low_confidence"]

    def dp(value, source, docs=(), low_conf=False):
        if value is None:
            return {"value": None, "source": "NONE", "fallback_used": False, "low_confidence": False,
                    "source_document_ids": []}
        return {"value": value, "source": source, "fallback_used": False, "low_confidence": low_conf,
                "source_document_ids": list(docs)}

    bureau = "BUREAU"
    return {
        "loan_amount": dp(f["loan_amount"], "APPLICATION"),
        "tenure_months": dp(f["tenure_months"], "APPLICATION"),
        "purpose": dp(f["product_purpose"] or f["purpose"], "APPLICATION"),
        "age_at_application": dp(f["age_at_application"], "COMPUTED"),
        "age_at_maturity": dp(f["age_at_maturity"], "COMPUTED"),
        "nationality": dp(f["nationality"], "DECLARED"),
        "employer_category": dp(f["employer_category"], "DECLARED"),
        "employment_months": dp(f["employment_months"], "DECLARED"),
        "payslip_net_avg": dp(f["payslip_net_avg"], "OCR_SALARY_SLIP", slip_ids, low),
        "bank_salary_credit_avg": dp(f["bank_salary_credit_avg"], "OCR_BANK_STATEMENT", [stmt_doc]),
        "net_monthly_income": dp(f["net_monthly_income"], "COMPUTED", low_conf=low),
        "income_variance_ratio": dp(f["income_variance_ratio"], "COMPUTED"),
        "existing_emi_total": dp(f["existing_emi_total"], bureau if f["bureau_report_status"] == "RECEIVED" else "DECLARED"),
        "proposed_emi": dp(f["proposed_emi"], "COMPUTED"),
        "foir": dp(f["foir"], "COMPUTED", low_conf=low),
        "credit_score": dp(f["credit_score"], bureau),
        "max_dpd_12m": dp(f["max_dpd_12m"], bureau),
        "max_dpd_24m": dp(f["max_dpd_24m"], bureau),
        "enquiries_6m": dp(f["enquiries_6m"], bureau),
        "writeoff_settlement_24m": dp(f["writeoff_settlement_24m"], bureau),
        "writeoff_settlement_older": dp(f["writeoff_settlement_older"], bureau),
        "salary_credit_months": dp(f["salary_credit_months"], "OCR_BANK_STATEMENT", [stmt_doc]),
        "debit_credit_ratio": dp(f["debit_credit_ratio"], "OCR_BANK_STATEMENT", [stmt_doc]),
        "kyc_name_match_score": dp(f["kyc_name_match_score"], "OCR_MULTI", kyc_docs),
        "kyc_dob_match": dp(f["kyc_dob_match"], "OCR_MULTI", kyc_docs),
        "kyc_id_last4_match": dp(f["kyc_id_last4_match"], "OCR_MULTI", kyc_docs),
        "required_docs_present": dp(f["required_docs_present"], "COMPUTED"),
        "min_ocr_confidence": dp(f["min_ocr_confidence"], "OCR_MULTI", kyc_docs + slip_ids + [stmt_doc]),
        "signature_similarity": dp(f["signature_similarity"], "SIGNATURE_CHECK"),
    }


def validate(app: dict) -> list[str]:
    """Inputs missing for this applicant (absent, or null without a designed reason)."""
    zi = app.get("zen_inputs") or {}
    allowed_null = designed_nulls(app)
    missing = [n for n in APPLICANT_INPUTS if n not in zi or (zi[n] is None and n not in allowed_null)]
    dps = app.get("zen_data_points") or {}
    missing += [f"zen_data_points.{n}" for n in ZEN_DATA_POINTS if n not in dps]
    return missing


def attach_zen_inputs(universe: dict) -> None:
    for app, stmt, case in zip(universe["applicants"], universe["statements"], universe["bureau_cases"]["cases"]):
        f = derive(app, stmt, case["report"], universe)
        f["supplied_fields"] = sorted(k for k in APPLICANT_INPUTS if k != "supplied_fields" and f.get(k) is not None)
        # Exactly the dictionary's APPLICANT fields, one-to-one; nothing else (a test asserts the key set).
        app["zen_inputs"] = {k: f.get(k) for k in APPLICANT_INPUTS}
        app["zen_inputs_meta"] = {"synthetic": True, "note": "reference preprocessing of synthetic data; not a ZEN result",
                                  "dictionary": "contracts_snapshot/data_dictionary.json @ cc202ae",
                                  "report_age_days": f.get("report_age_days")}
        app["zen_data_points"] = data_points(app, f)
        app["expected_outcome_hint"]["expected_offer"] = f["_offer"]


# ------------------------------------------------------------------ coverage table

_ORIGIN_RULES = [
    (BUREAU_INPUTS, "bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file`"),
    ({"bank_transactions", "average_monthly_balance", "negative_balance_count", "return_count", "total_credits",
      "total_debits", "debit_credit_ratio", "cash_deposit_percentage", "expected_emi_debits", "actual_emi_debits",
      "observed_recurring_debits", "debt_mismatch", "anomaly_indicators", "observed_salary_credits",
      "bank_salary_credit_avg", "salary_credit_months", "salary_credit_consistency", "salary_reversal_indicator",
      "salary_credit_employer", "employer_name_similarity", "monthly_income_history", "monthly_income_variance",
      "income_variation", "income_variance_ratio", "historical_income", "recent_income", "income_reduction_percentage",
      "average_monthly_income", "verified_income", "statement_months", "statement_integrity_result",
      "statement_validation_flags", "other_monthly_obligations"}, "bank statement (`bank_statements.jsonl`)"),
    ({"payslip_net_avg", "payslip_count", "gross_income", "deductions", "ocr_extracted_income", "ocr_field_confidence",
      "min_ocr_confidence", "document_kind", "document_date", "document_age_days", "document_hash",
      "duplicate_document_result", "pan_format_valid", "extracted_identity_fields", "kyc_name_match_score",
      "kyc_dob_match", "kyc_id_last4_match", "tampering_flags", "document_integrity_result"},
     "payslips + simulated OCR (`employment.payslips`, `ocr_extractions`)"),
    ({"signature_present", "signature_similarity", "signature_anomaly_score", "signature_crop_sha256"},
     "signature specimens + simulated screening (`signature`)"),
    ({"purpose_evidence_status", "purpose_evidence_amount", "payee_account_present", "wedding_date",
      "course_start_date", "property_ownership", "treatment_date"}, "product details and documents (`product`)"),
    ({"negative_list_hit", "employer_caution_list_hit", "pan_hash", "phone_hash", "email_hash",
      "shared_contact_pan_count", "duplicate_match_result", "last_decline_date", "days_since_last_decline",
      "fraud_indicators"}, "internal lists, universe cross-check, `application_history`"),
    ({"submitted_documents", "required_documents", "required_docs_present", "recorded_consents", "supplied_fields",
      "evidence_references"}, "`documents`, `consents`, all evidence ids"),
]


def origin_of(name: str) -> str:
    if name in POLICY_PARAMETERS:
        return "rule catalogue parameter (not per applicant)"
    if name in ZEN_PRODUCED:
        return "produced by ZEN (decision trace)"
    for names, origin in _ORIGIN_RULES:
        if name in names:
            return origin
    return "application, declared data, identity/e-KYC/PAN, or computed from them"


def null_rule(name: str) -> str:
    if name in NULL_MEANS_NONE:
        return "null = none / not applicable to the product"
    bits = []
    if name in BUREAU_INPUTS:
        bits.append("BUREAU_UNAVAILABLE")
    if name in SCORE_INPUTS:
        bits.append("NO_HIT/THIN_FILE")
    elif name in NO_ACCOUNT_NULLS:
        bits.append("NO_HIT/THIN_FILE (no accounts)")
    special = {"applicant_dob": "IDENTITY_INCOMPLETE", "kyc_dob_match": "IDENTITY_INCOMPLETE",
               "signature_similarity": "SIG_MISSING", "signature_anomaly_score": "SIG_MISSING",
               "signature_crop_sha256": "SIG_MISSING", "purpose_evidence_amount": "no product document",
               "product_purpose": "PURPOSE_NOT_OFFERED", "bureau_name": "no bureau identity on file",
               "bureau_dob": "no bureau identity on file", "bureau_address": "no bureau identity on file",
               "bureau_identity": "no bureau identity on file", "address_similarity": "no bureau identity on file"}
    if name in special:
        bits.append(special[name])
    return "; ".join(dict.fromkeys(bits)) if bits else "never"


def coverage_table(universe: dict | None = None) -> str:
    apps = (universe or {}).get("applicants", [])
    rows = ["| Input | Class | Rules / data point | Dataset origin | Null allowed | Present |",
            "|---|---|---|---|---|---|"]
    for name in sorted(CATALOGUE_INPUTS):
        cls = "POLICY" if name in POLICY_PARAMETERS else ("ZEN" if name in ZEN_PRODUCED else "APPLICANT")
        rules = ", ".join(r.replace("ZenInput.DataPointName", "ZenInput") for r in CATALOGUE_INPUTS[name])
        if cls == "APPLICANT" and apps:
            ok = sum(1 for a in apps if name in a["zen_inputs"]
                     and (a["zen_inputs"][name] is not None or name in designed_nulls(a)))
            present = f"{ok}/{len(apps)}"
        else:
            present = "n/a"
        rows.append(f"| `{name}` | {cls} | {rules} | {origin_of(name)} | {null_rule(name) if cls == 'APPLICANT' else '-'} "
                    f"| {present} |")
    return "\n".join(rows) + "\n"


def zen_input_envelope(app: dict, policy_version: str = "saral-pl-v2-DRAFT") -> dict | None:
    """A saral-zen-input/1 document (contracts/zen.py ZenInput shape) for this applicant, or
    None when no product applies (PURPOSE_NOT_OFFERED never reaches ZEN as a product).
    Segment choice here (risk grade A -> PRIME, NTC -> NEW_TO_CREDIT, else NEAR_PRIME) is an
    assumption of this dataset, not the contracts' segmentation rule."""
    lr, zi = app["loan_request"], app["zen_inputs"]
    if not lr["product_id"]:
        return None
    geo = "SALARIED_METRO" if app["identity"]["metro_city"] else "SALARIED_NON_METRO"
    grade = zi.get("risk_grade")
    credit = "PRIME" if grade == "A" else ("NEW_TO_CREDIT" if grade in (None, "NTC") else "NEAR_PRIME")
    return {
        "schema_version": "saral-zen-input/1",
        "application_id": app["application_id"],
        "applicant_id": app["applicant_id"],
        "product_id": lr["product_id"],
        "policy_version": policy_version,
        "bureau_report_id": app["bureau_link"]["report_ref_contract"],
        "extraction_ids": [e["extraction_id"] for e in app["ocr_extractions"]],
        "segments": {"applicant_id": app["applicant_id"], "segments": [geo, credit],
                     "basis": {geo: f"salaried, residence {app['identity']['city']}",
                               credit: f"risk grade {grade or 'NTC'} (dataset assumption)"}},
        "data_points": app["zen_data_points"],
        "prepared_at": f"{app['as_of']}T12:00:00+05:30",
    }
