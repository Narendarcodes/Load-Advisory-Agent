"""Generation self-check: does each scenario actually produce the signal it targets?

This is NOT the ZEN decision and NOT preprocessing for production. It recomputes a few
metrics from the generated records with the DRAFT ZEN proposal v2 thresholds, so tests can
prove that a CLEAN_PRIME applicant raises no flag and every failure scenario raises its
target flag. It reads ``synthetic_truth_tag`` (generation ground truth), which real
preprocessing must never do.
"""
from __future__ import annotations

from datetime import date, timedelta
from statistics import mean, median, pstdev

from .bank import statement_content_hash
from .catalogue import ELIGIBLE_EMPLOYER_CATEGORIES
from .product import PRODUCTS as PURPOSES
from .product import income_floor

T = {  # DRAFT thresholds from ZEN_RULES_PROPOSAL_v2.md; none is approved policy.
    "min_age": 21, "max_age_at_maturity": 80, "min_amount": 40_000, "max_amount": 7_500_000,
    "min_tenure": 12, "max_tenure": 108, "min_income": 25_001, "min_months_employer": 6,
    "min_total_experience": 12, "min_score": 700, "max_report_age": 30, "max_enq_6m": 4,
    "max_enq_30d": 2, "max_pl_enq_90d": 2, "max_new_acc_6m": 2, "max_active_pl": 3, "max_util": 0.80,
    "max_foir": 0.50, "min_residual": 15_000, "max_payslip_gap": 0.10, "max_cash_share": 0.50,
}
INCOME_TAGS = {"SALARY", "GIG_INCOME", "BUSINESS_INCOME", "CASH_DEPOSIT", "PROFESSIONAL_INCOME"}

# Flag each scenario must raise (ZEN proposal v2 id, or a PL id where v2 has no row).
EXPECTED = {
    "UNDER_21": {"E01"}, "OVER_AGE_AT_MATURITY": {"E02"}, "NON_RESIDENT": {"E03"},
    "SALARY_IRREGULAR": {"PL-084"}, "INELIGIBLE_EMPLOYER_CATEGORY": {"E07"},
    "IDENTITY_INCOMPLETE": {"G06"}, "DUPLICATE_APPLICANT": {"X03"}, "SHARED_CONTACT": {"X04"},
    "LOW_INCOME": {"E08"}, "PAYSLIP_BANK_MISMATCH": {"I01"}, "INCOME_DROP": {"PL-018"},
    "SALARY_MISSING_MONTH": {"I02"}, "EMPLOYER_NAME_MISMATCH": {"I03"}, "PROBATION_SHORT_TENURE": {"E09"},
    "CONTRACT_EMPLOYMENT": {"PL-016"}, "EMPLOYMENT_GAP": {"E10", "PL-015"},
    "BUREAU_NO_HIT": {"C02"}, "BUREAU_THIN_FILE": {"C02"}, "BUREAU_STALE_REPORT": {"G03"},
    "BUREAU_IDENTITY_MISMATCH": {"G04"}, "BUREAU_INCOMPLETE": {"G05"}, "BUREAU_UNAVAILABLE": {"G02"},
    "NAME_MISMATCH_PAN": {"K02"}, "NAME_MISMATCH_BUREAU": {"PL-021"}, "NAME_MISMATCH_BANK": {"K02"},
    "DOB_MISMATCH_PAN": {"K03"}, "DOB_MISMATCH_BUREAU": {"PL-022"}, "ADDRESS_MISMATCH_BUREAU": {"PL-023"},
    "DUPLICATE_TRADELINE": {"PL-025"}, "LOW_SCORE": {"C01"}, "HIGH_UTILISATION": {"C16"},
    "NEW_ACCOUNTS_STACKING": {"C14"}, "DPD_30": {"C04"}, "DPD_60": {"C05"}, "DPD_90": {"C06"},
    "WRITTEN_OFF": {"C09"}, "SETTLED": {"C09"}, "ENQUIRY_BURST": {"C11", "C12", "C13"},
    "FOIR_BREACH": {"A01"}, "RESIDUAL_INCOME_LOW": {"A03"}, "OBLIGATION_UNDERDECLARED": {"PL-060"},
    "PURPOSE_NOT_OFFERED": {"P06"}, "PURPOSE_OVER_CAP": {"P05"}, "AMOUNT_BELOW_MIN": {"E04"},
    "TENURE_OUT_OF_RANGE": {"E06"}, "BOUNCE_HEAVY": {"I05_DECLINE"}, "CASH_HEAVY": {"I07"},
    "NEGATIVE_BALANCE": {"PL-080"}, "UNDECLARED_DEBT": {"I08"}, "SALARY_REVERSAL": {"PL-087"},
    "EMI_DEBIT_MISSING": {"PL-082"}, "MISSING_DOCUMENTS": {"K05"}, "CONSENT_MISSING": {"G01"},
    "STATEMENT_TAMPERED": {"PL-093"}, "DUPLICATE_DOCUMENT": {"PL-091"}, "NEGATIVE_LIST_HIT": {"X01"},
    "EMPLOYER_CAUTION_LIST": {"X05"}, "SIG_SKILLED_FORGERY": {"K08"}, "SIG_RANDOM_FORGERY": {"K08"},
    "SIG_MISSING": {"K08"},
    "OCR_LOW_CONFIDENCE": {"K07"}, "PAN_FORMAT_INVALID": {"K01"}, "DOCUMENT_STALE": {"K06"},
    "COOLING_OFF_RECENT_DECLINE": {"X02"}, "SHORT_ADDRESS_TENURE": {"E11"}, "EMPLOYER_CHURN": {"PL-013"},
    "CURRENT_DEFAULT": {"C08"}, "SPEND_EXCEEDS_INFLOW": {"I04"}, "PURPOSE_PRODUCT_MISMATCH": {"PL-112"},
    "HOME_QUOTE_BELOW_AMOUNT": {"P03"}, "EDU_ADMISSION_MISSING": {"P02"},
}


def _age(dob: date, on: date) -> int:
    return on.year - dob.year - ((on.month, on.day) < (dob.month, dob.day))


def _month(d: str) -> str:
    return d[:7]


def balance_breaks(stmt: dict) -> list[str]:
    """txn_ids whose running balance does not follow from the previous balance and amount."""
    bad = []
    prev = round(stmt["summary"]["opening_balance"] * 100)
    for t in stmt["transactions"]:
        amt = round(t["amount"] * 100)
        expect = prev + (amt if t["type"] == "CREDIT" else -amt)
        if round(t["balance_after"] * 100) != expect:
            bad.append(t["txn_id"])
        prev = round(t["balance_after"] * 100)
    return bad


def flags(app: dict, stmt: dict, report: dict | None, universe: dict) -> set[str]:
    f: set[str] = set()
    as_of = date.fromisoformat(app["as_of"])
    d = app["declared"]
    loan = app["loan_request"]
    ident = app["identity"]
    # ---- eligibility (A, H)
    age = _age(date.fromisoformat(ident["date_of_birth"]), as_of)
    if age < T["min_age"]:
        f.add("E01")
    if age + loan["tenure_months"] / 12 > T["max_age_at_maturity"]:
        f.add("E02")
    if d["nationality"] != "IN" or d["residency_status"] != "RESIDENT":
        f.add("E03")
    if loan["amount"] < T["min_amount"]:
        f.add("E04")
    if not T["min_tenure"] <= loan["tenure_months"] <= T["max_tenure"]:
        f.add("E06")
    if d["applicant_profile"] == "SALARIED" and d["employer_category"] not in ELIGIBLE_EMPLOYER_CATEGORIES:
        f.add("E07")
    if d["monthly_net_income"] < income_floor(d["residence_city"]):
        f.add("E08")
    if d["months_at_address"] < 12:
        f.add("E11")
    if app["employment"]["employer_changes_24m"] >= 3:
        f.add("PL-013")
    if d["applicant_profile"] == "SALARIED" and d["months_with_current_employer"] < T["min_months_employer"]:
        f.add("E09")
    if d["total_experience_months"] < T["min_total_experience"]:
        f.add("E10")
    if any(g >= 3 for g in app["employment"]["employment_gap_months"]):
        f.add("PL-015")
    if d["employment_type"] != "PERMANENT":
        f.add("PL-016")
    purpose = loan["product_purpose"]
    if purpose is None:
        f.add("P06")
    elif loan["amount"] > PURPOSES[purpose]["max_amount"] or loan["tenure_months"] > PURPOSES[purpose]["max_tenure"]:
        f.add("P05")
    if purpose and loan["purpose"] != purpose:
        f.add("PL-112")
    if loan["amount_band"] == "B4":
        f.add("PL-123")
    prod = app["product"]
    if purpose == "home_renovation" and prod["purpose_evidence_status"] == "INSUFFICIENT":
        f.add("P03")
    if purpose == "higher_education" and prod["purpose_evidence_status"] == "MISSING":
        f.add("P02")
    zi = app["zen_inputs"]
    if app["zen_data_points"]["min_ocr_confidence"]["value"] < 60:
        f.add("K07")
    if not zi["pan_format_valid"]:
        f.add("K01")
    if zi["document_age_days"] > 60:
        f.add("K06")
    if zi["days_since_last_decline"] is not None and zi["days_since_last_decline"] <= 30:
        f.add("X02")
    if zi["debit_credit_ratio"] is not None and zi["debit_credit_ratio"] > 1.0:
        f.add("I04")
    if not zi["kyc_id_last4_match"]:
        f.add("K04")
    # ---- identity / KYC (A, C, J)
    ek, pan = app["aadhaar_ekyc"], app["pan"]
    if ek["dob"] is None or not ek["address"]["line_masked"]:
        f.add("G06")
    names = {ek["name"].upper(), pan["name_on_pan"].upper(), stmt["account"]["holder_name"].upper()}
    if len(names) > 1:
        f.add("K02")
    if ek["dob"] and ek["dob"] != pan["dob_on_pan"]:
        f.add("K03")
    on_file = app["bureau_link"]["identity_on_file"]
    if on_file:
        if on_file["name"].upper() != ek["name"].upper():
            f.add("PL-021")
        if on_file["dob"] != ident["date_of_birth"]:
            f.add("PL-022")
        if on_file["address_city"] != ident["city"]:
            f.add("PL-023")
    if not app["consents"]["bureau_pull"]:
        f.add("G01")
    if set(app["documents"]["required"]) - set(app["documents"]["submitted"]):
        f.add("K05")
    if app["signature"]["label"] != "GENUINE_MATCH":
        f.add("K08")
    others = [a for a in universe["applicants"] if a["applicant_id"] != app["applicant_id"]]
    earlier = [a for a in others if a["applicant_id"] < app["applicant_id"]]
    if any(a["specimen_truth"]["pan_number"] == app["specimen_truth"]["pan_number"] for a in earlier):
        f.add("X03")
    if any(a["identity"]["phone"] == ident["phone"] and a["specimen_truth"]["pan_number"] != app["specimen_truth"]["pan_number"] for a in earlier):
        f.add("X04")
    if any(n["pan"] == app["specimen_truth"]["pan_number"] for n in universe["internal_lists"]["negative_list"]):
        f.add("X01")
    if any(c["employer_name"] == d["employer_name"] for c in universe["internal_lists"]["employer_caution_list"]):
        f.add("X05")
    slip_ids = {s["record_id"] for s in app["employment"]["payslips"]}
    if slip_ids and any(slip_ids & {s["record_id"] for s in a["employment"]["payslips"]} for a in earlier):
        f.add("PL-091")
    if statement_content_hash(stmt) != stmt["integrity"]["content_sha256"] or balance_breaks(stmt):
        f.add("PL-093")
    # ---- bureau (C, D, E, F)
    if report is None:
        f.add("G02")
    else:
        if (as_of - date.fromisoformat(report["report_date"])).days > T["max_report_age"]:
            f.add("G03")
        if not report["identity"]["match"]:
            f.add("G04")
        if any(i["severity"] == "BLOCK" for i in report["data_quality"]["issues"]):
            f.add("G05")
        score = report["score"]
        if score["status"] != "AVAILABLE":
            f.add("C02")
        elif score["value"] < T["min_score"]:
            f.add("C01")
        accts = report["accounts"]
        keys = [(a["account_type"], a["opened_on"], a["original_amount"], a["current_balance"]) for a in accts]
        if len(keys) != len(set(keys)):
            f.add("PL-025")
        if any(a["status"] == "DEFAULT" for a in accts):
            f.add("C08")
        for a in accts:
            hist = a["payment_history"]
            if a["worst_delinquency_days"] >= 30 and "DPD_30" in hist[-12:]:
                f.add("C04")
            if "DPD_60" in hist[-12:] or "DPD_90_PLUS" in hist[-12:]:
                f.add("C05")
            if "DPD_90_PLUS" in hist[-24:] and a["status"] == "ACTIVE":
                f.add("C06")
            if a["status"] in ("WRITTEN_OFF", "SETTLED"):
                closed = date.fromisoformat(a["closed_on"]) if a["closed_on"] else as_of
                f.add("C09" if (as_of - closed).days <= 730 else "C10")
        six = as_of - timedelta(days=182)
        if sum(1 for a in accts if date.fromisoformat(a["opened_on"]) > six) > T["max_new_acc_6m"]:
            f.add("C14")
        enq = report["enquiries"]
        if sum(1 for e in enq if date.fromisoformat(e["enquired_on"]) > six) > T["max_enq_6m"]:
            f.add("C11")
        if sum(1 for e in enq if (as_of - date.fromisoformat(e["enquired_on"])).days <= 30) > T["max_enq_30d"]:
            f.add("C12")
        if sum(1 for e in enq if e["purpose"] == "PERSONAL_LOAN"
               and (as_of - date.fromisoformat(e["enquired_on"])).days <= 90) > T["max_pl_enq_90d"]:
            f.add("C13")
        cards = [a for a in accts if a["account_type"] == "CREDIT_CARD" and a["credit_limit"]]
        if cards and sum(a["current_balance"] for a in cards) / sum(a["credit_limit"] for a in cards) > T["max_util"]:
            f.add("C16")
    # ---- bank (I) and affordability (G)
    tx = stmt["transactions"]
    months = sorted({_month(t["date"]) for t in tx})
    last3 = months[-3:]
    inc_by_month = {m: 0.0 for m in months}
    for t in tx:
        if t["type"] == "CREDIT" and t["synthetic_truth_tag"] in INCOME_TAGS:
            inc_by_month[_month(t["date"])] += t["amount"]
        if t["synthetic_truth_tag"] == "SALARY_REVERSAL":
            inc_by_month[_month(t["date"])] -= t["amount"]
    salary = [t for t in tx if t["synthetic_truth_tag"] == "SALARY"]
    sal_months = {_month(t["date"]) for t in salary}
    salaried = d["applicant_profile"] == "SALARIED"
    if salaried and (len([m for m in last3 if m in sal_months]) < 3
                     or any(t["synthetic_truth_tag"] == "SALARY_REVERSAL" for t in tx)):
        f.add("I02")
    if any(t["synthetic_truth_tag"] == "SALARY_REVERSAL" for t in tx):
        f.add("PL-087")
    narr = app["employment"]["employer_narration"]
    if salary and narr and not all(narr in t["narration"] for t in salary):
        f.add("I03")
    series = [inc_by_month[m] for m in months]
    if len(series) >= 6:
        if mean(series[-3:]) < 0.8 * mean(series[:-3]):
            f.add("PL-018")
        if mean(series) and pstdev(series) / mean(series) > 0.25:
            f.add("PL-084")
    verified = median(series[-3:]) if series else 0
    slips = app["employment"]["payslips"]
    if slips and salary:
        if abs(slips[-1]["net"] - salary[-1]["amount"]) / salary[-1]["amount"] > T["max_payslip_gap"]:
            f.add("I01")
    returns = sum(1 for t in tx if t["synthetic_truth_tag"] in ("EMI_RETURN", "CHEQUE_RETURN")
                  and _month(t["date"]) in last3)
    if returns >= 3:
        f.add("I05_DECLINE")
    elif returns:
        f.add("I05_REFER")
    credits = sum(t["amount"] for t in tx if t["type"] == "CREDIT" and t["synthetic_truth_tag"] in INCOME_TAGS)
    cash = sum(t["amount"] for t in tx if t["synthetic_truth_tag"] == "CASH_DEPOSIT")
    if credits and cash / credits > T["max_cash_share"]:
        f.add("I07")
    if any(t["balance_after"] < 0 for t in tx):
        f.add("PL-080")
    if any(t["synthetic_truth_tag"] == "EMI_UNDECLARED" for t in tx):
        f.add("I08")
    bureau_emi = app["bureau_link"]["installment_obligation_total"]
    if d["monthly_obligations"] < bureau_emi:
        f.add("PL-060")
    if report:
        for a in report["accounts"]:
            if a["account_type"] in ("PERSONAL_LOAN", "AUTO_LOAN", "HOME_LOAN") and a["status"] == "ACTIVE" \
                    and a["monthly_obligation"]:
                first_due = (date.fromisoformat(a["opened_on"]) + timedelta(days=31)).isoformat()[:7]
                due = [m for m in last3 if m > first_due]
                seen = {_month(t["date"]) for t in tx if t["synthetic_truth_tag"] == "EMI_BUREAU"
                        and t["amount"] == a["monthly_obligation"] and t["type"] == "DEBIT"}
                if any(m not in seen for m in due):
                    f.add("PL-082")
    income_used = min(d["monthly_net_income"], verified) if verified else d["monthly_net_income"]
    total = max(bureau_emi, d["monthly_obligations"]) + loan["proposed_emi_at_assessment_rate"]
    if income_used > 0:
        if total / income_used > T["max_foir"]:
            f.add("A01")
        if income_used - total < T["min_residual"]:
            f.add("A03")
    return f
