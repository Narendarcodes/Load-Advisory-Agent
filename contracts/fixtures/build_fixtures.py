"""Regenerate the Saral contract fixtures and the draft rule catalogue.

    python contracts/fixtures/build_fixtures.py

Writes contracts/fixtures/*.json and docs/saral/rule_catalogue.draft.json. Every id is
synthetic (SYN-...), every person is invented, and every threshold marked ASSUMPTION is
a PROPOSAL pending the owner's approval (docs/saral/THRESHOLD_APPROVALS.md). Nothing
here is wired into ZEN.

Excerpts are verbatim, whitespace-collapsed substrings of corpus_v3 chunks
(saral_nbfc_policy, branch feat/saral-corpus-collections @ 3de95b0).
"""
from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FIX = ROOT / "contracts" / "fixtures"
CATALOGUE = ROOT / "docs" / "saral" / "rule_catalogue.draft.json"
REL = "public reference lender, not a partner"
POLICY_VERSION = "saral-pl-draft-0.1"


def sha(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


# --------------------------------------------------------------------------- citations

EXCERPTS = {
    "BFL-PL-ELIG-DOCS#007": "Nationality: Indian Age: 21 years to 80 years*. Employed with: Public, private, or MNC. "
                            "CIBIL Score: 650 or higher. Customer profile: Self-employed or Salaried *You should be "
                            "80 years* or younger, at the end of the loan tenure.",
    "BFL-PL-ELIG-DOCS#008": "The maximum personal loan tenure you can apply for is 108 months. *You must be 80 years "
                            "or younger, at the end of the loan tenure.",
    "BFL-PL-OVERVIEW#003": "High loan amount Borrow from Rs. 40,000 to Rs. 75 lakh to meet small or large expenses.",
    "BFL-PL-OVERVIEW#017": "Loan amount ranging from Rs. 40,000 -to Rs. 75 lakh Flexible tenures ranging from 12 "
                           "months to 108 months",
    "BFL-PL-SALARIED#004": "Monthly salary: Starting Rs. 25,001, based on the city you live in. "
                           "Documents required KYC documents: "
                           "Aadhaar/ passport/ voter’s ID/ driving license/ Letter of National Population Register/ "
                           "NREGA job card PAN card Employee ID card Salary slips of the last 3 months Bank account "
                           "statements of the previous 3 months",
    "BFL-PL-SALARIED#012": "The minimum salary criteria for a personal loan from Bajaj Finance depends on your city "
                           "of residence. For instance, your minimum monthly salary should be Rs. 40,000 if you "
                           "reside in Pune, Bangalore, Mumbai, or Delhi.",
    "BFL-PL-OVERVIEW#018": "A few common reasons for personal loan rejection include: CIBIL Score below 650 High FOIR "
                           "(as per lender criteria) Being on probation at a new job Document mismatched Multiple "
                           "recent loan applications Past loan settlements or write-offs",
    "BFL-PL-DETAILED-TNC#020": "d) The usage of the loan amount shall be for the purpose as mentioned in the "
                               "Application Form/request only and shall not be diverted/ utilized for investment in "
                               "capital market",
}


def cite(chunk: str) -> dict:
    return {"doc_id": chunk.split("#")[0], "chunk_id": chunk, "collection": "saral_nbfc_policy",
            "excerpt": " ".join(EXCERPTS[chunk].split()), "relationship": REL}


# --------------------------------------------------------------------------- rule catalogue (DRAFT)
# basis "B" = BAJAJ-SOURCED (chunk), "A" = ASSUMPTION (id). context = Bajaj chunk that names the
# criterion without a number, when there is one.

def rule(rid, name, cat, field, op, thr, on_fail, code, basis, ref, *, required=True, context=None, note=""):
    return {"rule_id": rid, "rule_name": name, "category": cat, "field": field, "operator": op,
            "threshold_value": thr, "on_fail": on_fail, "required": required, "reason_code": code,
            "threshold_basis": "BAJAJ-SOURCED" if basis == "B" else "ASSUMPTION",
            "source_chunk": ref if basis == "B" else None,
            "assumption_id": ref if basis == "A" else None,
            "context_chunk": context, "note": note}


BASE_RULES = [
    rule("B01_AGE_MIN", "Minimum age at application", "ELIGIBILITY", "age_at_application", ">=", 21,
         "DECLINE", "ERR_AGE_BELOW_MINIMUM", "B", "BFL-PL-ELIG-DOCS#007"),
    rule("B02_AGE_MAX_AT_MATURITY", "Maximum age at end of tenure", "ELIGIBILITY", "age_at_maturity", "<=", 80,
         "DECLINE", "ERR_AGE_AT_MATURITY_ABOVE_MAXIMUM", "B", "BFL-PL-ELIG-DOCS#007"),
    rule("B03_NATIONALITY", "Indian nationality", "ELIGIBILITY", "nationality", "==", "IN",
         "DECLINE", "ERR_NATIONALITY_NOT_ELIGIBLE", "B", "BFL-PL-ELIG-DOCS#007"),
    rule("B04_AMOUNT_MIN", "Minimum loan amount", "ELIGIBILITY", "loan_amount", ">=", 40000,
         "DECLINE", "ERR_AMOUNT_BELOW_MINIMUM", "B", "BFL-PL-OVERVIEW#003"),
    rule("B05_AMOUNT_MAX", "Maximum loan amount", "ELIGIBILITY", "loan_amount", "<=", 7500000,
         "DECLINE", "ERR_AMOUNT_ABOVE_MAXIMUM", "B", "BFL-PL-OVERVIEW#003",
         note="Conflict C1: rate tables (BFL-PL-RATES-FEES#011) stop at Rs. 55 lakh. Owner to confirm."),
    rule("B06_TENURE_MIN", "Minimum tenure", "ELIGIBILITY", "tenure_months", ">=", 12,
         "DECLINE", "ERR_TENURE_BELOW_MINIMUM", "B", "BFL-PL-OVERVIEW#017"),
    rule("B07_TENURE_MAX", "Maximum tenure", "ELIGIBILITY", "tenure_months", "<=", 108,
         "DECLINE", "ERR_TENURE_ABOVE_MAXIMUM", "B", "BFL-PL-ELIG-DOCS#008"),
    rule("B08_EMPLOYER_CATEGORY", "Employer is public, private or MNC", "ELIGIBILITY", "employer_category", "in",
         ["PUBLIC", "PRIVATE", "MNC"], "REFER", "ERR_EMPLOYER_CATEGORY_UNVERIFIED", "B", "BFL-PL-ELIG-DOCS#007",
         note="Effect REFER (not DECLINE) is A-19."),
    rule("B09_CREDIT_SCORE_MIN", "Minimum credit score", "CREDIT", "credit_score", ">=", 650,
         "DECLINE", "ERR_CREDIT_SCORE_BELOW_MINIMUM", "B", "BFL-PL-ELIG-DOCS#007",
         note="Conflict C2: BFL-INSIGHT-REJECTION says 685/750. No score (new to credit) -> A-22."),
    rule("B10_MIN_NET_INCOME", "Minimum monthly income (city-based)", "INCOME", "net_monthly_income", ">=", 25001,
         "DECLINE", "ERR_INCOME_BELOW_MINIMUM", "B", "BFL-PL-SALARIED#004",
         note="40,000 for SALARIED_METRO (BFL-PL-SALARIED#012). Net vs gross is A-01; metro list is A-03."),
    rule("B11_FOIR_MAX", "Maximum FOIR including the new EMI", "AFFORDABILITY", "foir", "<=", 0.50,
         "DECLINE", "ERR_FOIR_EXCEEDED", "A", "A-04", context="BFL-PL-OVERVIEW#018"),
    rule("B12_EMPLOYMENT_MIN", "Minimum months with current employer", "INCOME", "employment_months", ">=", 6,
         "REFER", "ERR_EMPLOYMENT_TENURE_SHORT", "A", "A-07", context="BFL-PL-OVERVIEW#018"),
    rule("B13_DPD_12M_SEVERE", "No 60+ days past due in 12 months", "CREDIT", "max_dpd_12m", "<=", 30,
         "DECLINE", "ERR_RECENT_SERIOUS_DELINQUENCY", "A", "A-08"),
    rule("B14_DPD_12M_ANY", "No missed payment in 12 months", "CREDIT", "max_dpd_12m", "==", 0,
         "REFER", "ERR_RECENT_LATE_PAYMENT", "A", "A-08"),
    rule("B15_DPD_24M_SEVERE", "No 90+ days past due in 24 months", "CREDIT", "max_dpd_24m", "<=", 60,
         "DECLINE", "ERR_SERIOUS_DELINQUENCY_24M", "A", "A-08"),
    rule("B16_ENQUIRIES_6M", "Credit enquiries in 6 months", "CREDIT", "enquiries_6m", "<=", 4,
         "REFER", "ERR_MANY_RECENT_ENQUIRIES", "A", "A-09", context="BFL-PL-OVERVIEW#018"),
    rule("B17_WRITEOFF_SETTLEMENT_24M", "No write-off or settlement in 24 months", "CREDIT",
         "writeoff_settlement_24m", "==", False, "DECLINE", "ERR_WRITEOFF_OR_SETTLEMENT_RECENT", "A", "A-10",
         context="BFL-PL-OVERVIEW#018"),
    rule("B18_WRITEOFF_SETTLEMENT_OLDER", "No older write-off or settlement", "CREDIT",
         "writeoff_settlement_older", "==", False, "REFER", "ERR_WRITEOFF_OR_SETTLEMENT_PAST", "A", "A-10",
         context="BFL-PL-OVERVIEW#018"),
    rule("B19_INCOME_CROSS_CHECK", "Payslip net vs bank salary credit", "VERIFICATION", "income_variance_ratio",
         "<=", 0.10, "REFER", "ERR_INCOME_MISMATCH", "A", "A-11"),
    rule("B20_SALARY_CREDIT_MONTHS", "Salary credited in each statement month", "VERIFICATION",
         "salary_credit_months", ">=", 3, "REFER", "ERR_SALARY_CREDITS_IRREGULAR", "A", "A-12",
         context="BFL-PL-SALARIED#004"),
    rule("B21_DEBIT_CREDIT_RATIO", "Debits do not exceed credits", "VERIFICATION", "debit_credit_ratio", "<=", 1.0,
         "REFER", "ERR_BANK_OUTFLOW_EXCEEDS_INFLOW", "A", "A-13"),
    rule("B22_KYC_NAME_MATCH", "Name matches across documents", "VERIFICATION", "kyc_name_match_score", ">=", 0.85,
         "REFER", "ERR_DOCUMENT_NAME_MISMATCH", "A", "A-14", context="BFL-PL-OVERVIEW#018"),
    rule("B23_KYC_DOB_MATCH", "Date of birth matches across documents", "VERIFICATION", "kyc_dob_match", "==",
         True, "REFER", "ERR_DOCUMENT_DOB_MISMATCH", "A", "A-15", context="BFL-PL-OVERVIEW#018"),
    rule("B24_KYC_ID_LAST4_MATCH", "PAN / Aadhaar last digits match the record", "VERIFICATION",
         "kyc_id_last4_match", "==", True, "REFER", "ERR_DOCUMENT_ID_MISMATCH", "A", "A-15",
         context="BFL-PL-OVERVIEW#018"),
    rule("B25_REQUIRED_DOCS", "KYC, PAN, 3 salary slips, 3 months of bank statements", "VERIFICATION",
         "required_docs_present", "==", True, "REFER", "ERR_DOCUMENTS_MISSING", "B", "BFL-PL-SALARIED#004"),
    rule("S01_OCR_CONFIDENCE", "OCR confidence of every field a rule used", "SCREENING", "min_ocr_confidence",
         ">=", 60, "REFER", "ERR_DOCUMENT_UNCLEAR", "A", "A-16"),
    rule("S02_SIGNATURE_SIMILARITY", "Signature similarity (experimental)", "SCREENING", "signature_similarity",
         ">=", 0.80, "REFER", "ERR_SIGNATURE_REVIEW", "A", "A-17", required=False),
]

PRODUCTS = {
    "PL_WEDDING": ("wedding", 1500000, 60, "A-25"),
    "PL_HIGHER_EDUCATION": ("higher_education", 2000000, 84, "A-26"),
    "PL_HOME_RENOVATION": ("home_renovation", 2500000, 84, "A-27"),
    "PL_MEDICAL_EMERGENCY": ("medical_emergency", 1000000, 60, "A-28"),
}


def product_rules(pid: str) -> list[dict]:
    purpose, cap, tenure, aid = PRODUCTS[pid]
    return [
        rule("P01_PURPOSE_MATCH", "Declared purpose matches the product", "PRODUCT", "purpose", "==", purpose,
             "REFER", "ERR_PURPOSE_MISMATCH", "B", "BFL-PL-DETAILED-TNC#020"),
        rule("P02_PRODUCT_AMOUNT_MAX", "Purpose amount cap", "PRODUCT", "loan_amount", "<=", cap,
             "REFER", "ERR_PURPOSE_AMOUNT_CAP", "A", aid, note="Breach REFERs, never DECLINEs (A-29)."),
        rule("P03_PRODUCT_TENURE_MAX", "Purpose tenure cap", "PRODUCT", "tenure_months", "<=", tenure,
             "REFER", "ERR_PURPOSE_TENURE_CAP", "A", aid, note="Breach REFERs, never DECLINEs (A-29)."),
    ]


SEGMENTS = [
    {"segment_id": "SALARIED_METRO", "dimension": "EMPLOYMENT_GEO", "approval_status": "PENDING",
     "assignment_rule": "employment_type=SALARIED and residence_city in {Pune, Bengaluru, Mumbai, Delhi} (A-03)",
     "effects": [{"rule_id": "B10_MIN_NET_INCOME", "change": "SET_THRESHOLD", "value": 40000,
                  "basis": "BAJAJ-SOURCED", "source_chunk": "BFL-PL-SALARIED#012"}]},
    {"segment_id": "SALARIED_NON_METRO", "dimension": "EMPLOYMENT_GEO", "approval_status": "APPROVED",
     "assignment_rule": "employment_type=SALARIED and residence_city not in the metro list",
     "effects": [{"rule_id": "B10_MIN_NET_INCOME", "change": "SET_THRESHOLD", "value": 25001,
                  "basis": "BAJAJ-SOURCED", "source_chunk": "BFL-PL-SALARIED#004"}]},
    {"segment_id": "SELF_EMPLOYED", "dimension": "EMPLOYMENT_GEO", "approval_status": "PENDING",
     "assignment_rule": "employment_type=SELF_EMPLOYED (Bajaj lists the profile: BFL-PL-ELIG-DOCS#007)",
     "effects": [
         {"rule_id": "B10_MIN_NET_INCOME", "change": "SET_SOURCE", "value": "avg monthly bank credits",
          "basis": "ASSUMPTION", "assumption_id": "A-23"},
         {"rule_id": "B10_MIN_NET_INCOME", "change": "SET_THRESHOLD", "value": 25001,
          "basis": "ASSUMPTION", "assumption_id": "A-23"},
         {"rule_id": "B08_EMPLOYER_CATEGORY", "change": "SKIP_RULE", "basis": "ASSUMPTION", "assumption_id": "A-23"},
         {"rule_id": "B12_EMPLOYMENT_MIN", "change": "SKIP_RULE", "basis": "ASSUMPTION", "assumption_id": "A-23"},
         {"rule_id": "B19_INCOME_CROSS_CHECK", "change": "SKIP_RULE", "basis": "ASSUMPTION", "assumption_id": "A-23"},
         {"rule_id": "B20_SALARY_CREDIT_MONTHS", "change": "SKIP_RULE", "basis": "ASSUMPTION",
          "assumption_id": "A-23"},
         {"rule_id": "SE01_MANUAL_INCOME_REVIEW", "change": "ADD_RULE", "value": "always REFER",
          "basis": "ASSUMPTION", "assumption_id": "A-23"}]},
    {"segment_id": "NEW_TO_CREDIT", "dimension": "CREDIT", "approval_status": "PENDING",
     "assignment_rule": "bureau score status NO_HIT or INSUFFICIENT_HISTORY",
     "effects": [
         {"rule_id": "B09_CREDIT_SCORE_MIN", "change": "SET_EFFECT", "value": "NOT_EVALUATED -> REFER",
          "basis": "ASSUMPTION", "assumption_id": "A-22"},
         {"rule_id": "B11_FOIR_MAX", "change": "SET_THRESHOLD", "value": 0.40,
          "basis": "ASSUMPTION", "assumption_id": "A-22"},
         {"rule_id": "NTC01_INDICATIVE_AMOUNT_CAP", "change": "ADD_RULE", "value": 200000,
          "basis": "ASSUMPTION", "assumption_id": "A-22"}]},
    {"segment_id": "PRIME", "dimension": "CREDIT", "approval_status": "PENDING",
     "assignment_rule": "credit_score >= 750 (A-20)",
     "effects": [{"rule_id": "B11_FOIR_MAX", "change": "SET_THRESHOLD", "value": 0.55,
                  "basis": "ASSUMPTION", "assumption_id": "A-21"}]},
    {"segment_id": "NEAR_PRIME", "dimension": "CREDIT", "approval_status": "PENDING",
     "assignment_rule": "650 <= credit_score <= 749 (A-20); base thresholds apply unchanged",
     "effects": []},
    {"segment_id": "EXISTING_CUSTOMER", "dimension": "RELATIONSHIP", "approval_status": "PENDING",
     "assignment_rule": "existing_customer=true on the synthetic applicant record (BFL-APP-TNC-2023#012)",
     "effects": [
         {"rule_id": "B22_KYC_NAME_MATCH", "change": "SET_SOURCE", "value": "existing KYC",
          "basis": "ASSUMPTION", "assumption_id": "A-24"},
         {"rule_id": "B23_KYC_DOB_MATCH", "change": "SET_SOURCE", "value": "existing KYC",
          "basis": "ASSUMPTION", "assumption_id": "A-24"},
         {"rule_id": "B24_KYC_ID_LAST4_MATCH", "change": "SET_SOURCE", "value": "existing KYC",
          "basis": "ASSUMPTION", "assumption_id": "A-24"}]},
]

# --------------------------------------------------------------------------- trace builder

OPS = {">=": lambda a, t: a >= t, "<=": lambda a, t: a <= t, "==": lambda a, t: a == t,
       "in": lambda a, t: a in t}


def row(r: dict, actual, *, source=None, low=False, override=None, threshold=None) -> dict:
    thr = r["threshold_value"] if threshold is None else threshold
    if actual is None:
        result = "NOT_EVALUATED"
        outcome = "REFER" if r["required"] else "NO_EFFECT"
        down = None
    else:
        result = "PASS" if OPS[r["operator"]](actual, thr) else "FAIL"
        down = None
        if result == "PASS":
            outcome = "PASS"
        elif r["on_fail"] == "DECLINE" and low:
            outcome, down = "REFER", "DECLINE"
        else:
            outcome = r["on_fail"]
    sourced = r["threshold_basis"] == "BAJAJ-SOURCED"
    return {
        "rule_id": r["rule_id"], "rule_name": r["rule_name"], "category": r["category"], "field": r["field"],
        "actual_value": actual, "threshold_value": thr, "operator": r["operator"], "result": result,
        "on_fail": r["on_fail"], "required": r["required"], "outcome": outcome, "reason_code": r["reason_code"],
        "actual_source": source, "actual_low_confidence": low, "downgraded_from": down,
        "threshold_basis": r["threshold_basis"],
        "citation": cite(r["source_chunk"]) if sourced else None,
        "assumption_id": r["assumption_id"],
        "approval_status": "APPROVED" if sourced else "PENDING",
        "segment_override": override,
    }


def emi(principal: float, annual_rate: float, months: int) -> float:
    """Bajaj's own EMI formula (BFL-PL-OVERVIEW#017): P x R x (1+R)^n / ((1+R)^n - 1)."""
    r = annual_rate / 12
    f = (1 + r) ** months
    return principal * r * f / (f - 1)


ASSESSMENT_RATE = 0.20   # A-05, proposal


def trace(trace_id, app_id, pid, rows, evaluated_at):
    return {"schema_version": "saral-decision-trace/1", "trace_id": trace_id, "application_id": app_id,
            "evaluated_at": evaluated_at,
            "policy": {"policy_id": "SARAL_PL_" + pid[3:], "policy_version": POLICY_VERSION, "status": "DRAFT",
                       "lender": "Bajaj Finance Ltd", "lender_relationship": REL},
            "engine": {"name": "zen", "version": "2.1.2", "decision_model": f"saral/{pid.lower()}.draft.json",
                       "decision_model_sha256": sha(f"draft model {pid}")},
            "rows": rows}


def output(app_id, pid, tr, missing=()):
    outs = [r["outcome"] for r in tr["rows"]]
    decision = "DECLINE" if "DECLINE" in outs else "REFER" if "REFER" in outs else "APPROVE"
    return {"schema_version": "saral-zen-output/1", "application_id": app_id, "product_id": pid,
            "decision": decision,
            "decline_reason_codes": sorted({r["reason_code"] for r in tr["rows"] if r["outcome"] == "DECLINE"}),
            "refer_reason_codes": sorted({r["reason_code"] for r in tr["rows"] if r["outcome"] == "REFER"}),
            "missing_fields": list(missing), "not_for_live_use": True, "trace": tr}


def rules_by_id(pid):
    return {r["rule_id"]: r for r in BASE_RULES + product_rules(pid)}


# ---- Scenario A: salaried metro, prime, wedding, all clean -> APPROVE (on DRAFT policy)

def scenario_a():
    pid, app = "PL_WEDDING", "SYN-APL-000101"
    amount, tenure = 600000, 48
    payslip, bank, existing = 92000.0, 91500.0, 14000
    income = min(payslip, bank)
    new_emi = round(emi(amount, ASSESSMENT_RATE, tenure), 2)
    foir = round((existing + new_emi) / income, 4)
    variance = round(abs(payslip - bank) / payslip, 4)
    docs = {"slip": "SYN-DOC-SLIP0101", "bank": "SYN-DOC-BANK0101", "pan": "SYN-DOC-PAN0101",
            "aad": "SYN-DOC-AAD0101", "emp": "SYN-DOC-EMP0101", "sig": "SYN-DOC-SIG0101"}
    dp = {
        "loan_amount": (amount, "APPLICATION"), "tenure_months": (tenure, "APPLICATION"),
        "purpose": ("wedding", "APPLICATION"), "age_at_application": (31, "APPLICANT_RECORD"),
        "age_at_maturity": (35, "COMPUTED"), "nationality": ("IN", "APPLICANT_RECORD"),
        "employer_category": ("MNC", "APPLICANT_RECORD"),
        "employment_months": (40, "OCR_EMPLOYMENT_LETTER", [docs["emp"]]),
        "payslip_net_avg": (payslip, "OCR_SALARY_SLIP", [docs["slip"]]),
        "bank_salary_credit_avg": (bank, "OCR_BANK_STATEMENT", [docs["bank"]]),
        "net_monthly_income": (income, "COMPUTED"), "income_variance_ratio": (variance, "COMPUTED"),
        "existing_emi_total": (existing, "BUREAU"), "proposed_emi": (new_emi, "COMPUTED"),
        "foir": (foir, "COMPUTED"), "credit_score": (772, "BUREAU"), "max_dpd_12m": (0, "BUREAU"),
        "max_dpd_24m": (0, "BUREAU"), "enquiries_6m": (1, "BUREAU"),
        "writeoff_settlement_24m": (False, "BUREAU"), "writeoff_settlement_older": (False, "BUREAU"),
        "salary_credit_months": (3, "OCR_BANK_STATEMENT", [docs["bank"]]),
        "debit_credit_ratio": (0.82, "OCR_BANK_STATEMENT", [docs["bank"]]),
        "kyc_name_match_score": (0.97, "OCR_MULTI", [docs["pan"], docs["aad"], docs["slip"], docs["bank"]]),
        "kyc_dob_match": (True, "OCR_MULTI", [docs["pan"], docs["aad"]]),
        "kyc_id_last4_match": (True, "OCR_MULTI", [docs["pan"], docs["aad"]]),
        "required_docs_present": (True, "COMPUTED"),
        "min_ocr_confidence": (88.4, "COMPUTED"),
        "signature_similarity": (0.91, "SIGNATURE_CHECK"),
    }
    zin = zen_input(app, "SYN-APP-000101", pid, "SYN-BUR-000101", list(docs.values()),
                    ["SALARIED_METRO", "PRIME"],
                    {"SALARIED_METRO": "salaried, lives in Pune", "PRIME": "synthetic score 772 >= 750"}, dp)
    R = rules_by_id(pid)
    src = {"BUREAU": "BUREAU", "APPLICATION": "DECLARED", "APPLICANT_RECORD": "APPLICANT_RECORD",
           "COMPUTED": "COMPUTED", "SIGNATURE_CHECK": "SIGNATURE_CHECK"}
    rows = []
    for rid, r in R.items():
        val, s = dp[r["field"]][0], dp[r["field"]][1]
        override, thr = None, None
        if rid == "B10_MIN_NET_INCOME":
            override, thr = "SALARIED_METRO", 40000
        if rid == "B11_FOIR_MAX":
            override, thr = "PRIME", 0.55
        rows.append(row(r, val, source=src.get(s, "OCR"), override=override, threshold=thr))
    tr = trace("SYN-TRC-000101", app, pid, rows, "2026-11-03T16:10:00Z")
    return zin, output(app, pid, tr)


# ---- Scenario B: salaried non-metro, near prime, higher education; income from one
# low-confidence payslip, bank salary unreadable, weak signature -> REFER (FOIR DECLINE downgraded)

def scenario_b():
    pid, app = "PL_HIGHER_EDUCATION", "SYN-APL-000202"
    amount, tenure = 800000, 60
    payslip, existing = 30000.0, 9000
    new_emi = round(emi(amount, ASSESSMENT_RATE, tenure), 2)
    foir = round((existing + new_emi) / payslip, 4)
    R = rules_by_id(pid)
    actual = {
        "age_at_application": (26, "APPLICANT_RECORD", False), "age_at_maturity": (31, "COMPUTED", False),
        "nationality": ("IN", "APPLICANT_RECORD", False), "loan_amount": (amount, "DECLARED", False),
        "tenure_months": (tenure, "DECLARED", False), "employer_category": ("PRIVATE", "APPLICANT_RECORD", False),
        "credit_score": (688, "BUREAU", False), "net_monthly_income": (payslip, "OCR", True),
        "foir": (foir, "COMPUTED", True), "employment_months": (18, "OCR", False),
        "max_dpd_12m": (0, "BUREAU", False), "max_dpd_24m": (30, "BUREAU", False),
        "enquiries_6m": (3, "BUREAU", False), "writeoff_settlement_24m": (False, "BUREAU", False),
        "writeoff_settlement_older": (False, "BUREAU", False), "income_variance_ratio": (None, None, False),
        "salary_credit_months": (None, None, False), "debit_credit_ratio": (0.95, "OCR", False),
        "kyc_name_match_score": (0.91, "OCR", False), "kyc_dob_match": (True, "OCR", False),
        "kyc_id_last4_match": (True, "OCR", False), "required_docs_present": (True, "COMPUTED", False),
        "min_ocr_confidence": (55.0, "COMPUTED", False), "signature_similarity": (0.62, "SIGNATURE_CHECK", False),
        "purpose": ("higher_education", "DECLARED", False),
    }
    rows = []
    for rid, r in R.items():
        val, s, low = actual[r["field"]]
        thr = 25001 if rid == "B10_MIN_NET_INCOME" else None
        override = "SALARIED_NON_METRO" if rid == "B10_MIN_NET_INCOME" else None
        rows.append(row(r, val, source=s, low=low, override=override, threshold=thr))
    tr = trace("SYN-TRC-000202", app, pid, rows, "2026-11-03T16:20:00Z")
    return output(app, pid, tr, missing=["bank_salary_credit_avg", "income_variance_ratio", "salary_credit_months"])


# ---- Scenario C: score below 650 and a recent write-off -> DECLINE

def scenario_c():
    pid, app = "PL_MEDICAL_EMERGENCY", "SYN-APL-000303"
    R = rules_by_id(pid)
    actual = {
        "age_at_application": (44, "APPLICANT_RECORD"), "age_at_maturity": (47, "COMPUTED"),
        "nationality": ("IN", "APPLICANT_RECORD"), "loan_amount": (300000, "DECLARED"),
        "tenure_months": (36, "DECLARED"), "employer_category": ("PUBLIC", "APPLICANT_RECORD"),
        "credit_score": (610, "BUREAU"), "net_monthly_income": (58000.0, "COMPUTED"),
        "foir": (0.41, "COMPUTED"), "employment_months": (96, "OCR"), "max_dpd_12m": (30, "BUREAU"),
        "max_dpd_24m": (90, "BUREAU"), "enquiries_6m": (2, "BUREAU"),
        "writeoff_settlement_24m": (True, "BUREAU"), "writeoff_settlement_older": (False, "BUREAU"),
        "income_variance_ratio": (0.03, "COMPUTED"), "salary_credit_months": (3, "OCR"),
        "debit_credit_ratio": (0.9, "OCR"), "kyc_name_match_score": (0.95, "OCR"),
        "kyc_dob_match": (True, "OCR"), "kyc_id_last4_match": (True, "OCR"),
        "required_docs_present": (True, "COMPUTED"), "min_ocr_confidence": (81.0, "COMPUTED"),
        "signature_similarity": (None, None), "purpose": ("medical_emergency", "DECLARED"),
    }
    rows = []
    for rid, r in R.items():
        val, s = actual[r["field"]]
        thr = 25001 if rid == "B10_MIN_NET_INCOME" else None
        override = "SALARIED_NON_METRO" if rid == "B10_MIN_NET_INCOME" else None
        rows.append(row(r, val, source=s, override=override, threshold=thr))
    tr = trace("SYN-TRC-000303", app, pid, rows, "2026-11-03T16:30:00Z")
    return output(app, pid, tr, missing=["signature_similarity"])


def zen_input(app, applicant, pid, bureau, docs, segments, basis, dp):
    points = {}
    for name, spec in dp.items():
        value, source = spec[0], spec[1]
        ids = spec[2] if len(spec) > 2 else []
        points[name] = {"value": value, "source": source, "fallback_used": False, "low_confidence": False,
                        "source_document_ids": ids}
    return {"schema_version": "saral-zen-input/1", "application_id": app, "applicant_id": applicant,
            "product_id": pid, "policy_version": POLICY_VERSION, "bureau_report_id": bureau,
            "extraction_ids": [d.replace("DOC", "EXT") for d in docs],
            "segments": {"applicant_id": applicant, "segments": segments, "basis": basis},
            "data_points": points, "prepared_at": "2026-11-03T16:09:30Z"}


# --------------------------------------------------------------------------- other fixtures

def applicant():
    return {"schema_version": "saral-applicant/1", "applicant_id": "SYN-APP-000101",
            "full_name": "Ananya Synthetic Rao", "date_of_birth": "1995-02-14", "nationality": "IN",
            "pan_masked": "XXXXX4821X", "aadhaar_last4": "7316", "residence_city": "Pune",
            "employment_type": "SALARIED", "employer_category": "MNC", "declared_monthly_income": 92000,
            "declared_monthly_obligations": 14000, "existing_customer": False,
            "consents": {"bureau_pull_at": "2026-11-03T15:58:00Z", "document_processing_at": "2026-11-03T15:58:00Z"},
            "bureau_snapshot": {"report_id": "SYN-BUR-000101", "provider_schema": "bureau-report/1",
                                "report_date": "2026-11-03", "fetched_at": "2026-11-03T15:59:10Z",
                                "snapshot_sha256": sha("SYN-BUR-000101 snapshot")},
            "created_at": "2026-11-03T15:55:00Z"}


def applicant_self_employed():
    return {"schema_version": "saral-applicant/1", "applicant_id": "SYN-APP-000404",
            "full_name": "Kiran Synthetic Das", "date_of_birth": "1988-09-01", "nationality": "IN",
            "pan_masked": "XXXXX1180X", "aadhaar_last4": "0457", "residence_city": "Warangal",
            "employment_type": "SELF_EMPLOYED", "employer_category": "NOT_APPLICABLE",
            "declared_monthly_income": 55000, "existing_customer": True,
            "consents": {"bureau_pull_at": None, "document_processing_at": "2026-11-03T12:00:00Z"},
            "bureau_snapshot": None, "created_at": "2026-11-03T11:50:00Z"}


def fld(key, value, status, conf, doc, kind, page=1, line=None, note=None):
    return {"key": key, "value": value, "status": status, "ocr_confidence": conf,
            "source": {"document_id": doc, "kind": kind, "page": page, "line_index": line}, "note": note}


def extraction(ext_id, doc_id, kind, pages, fields):
    return {"schema_version": "saral-document-extraction/1", "extraction_id": ext_id,
            "applicant_id": "SYN-APP-000101",
            "document": {"document_id": doc_id, "kind": kind, "uploaded_at": "2026-11-03T16:00:00Z",
                         "pages": pages, "sha256": sha(doc_id)},
            "engine": {"name": "synthetic-fixture", "version": "1"}, "extracted_at": "2026-11-03T16:02:00Z",
            "fields": {f["key"]: f for f in fields}, "warnings": []}


def extractions():
    d, k = "SYN-DOC-SLIP0101", "salary_slip"
    slip = extraction("SYN-EXT-SLIP0101", d, k, 1, [
        fld("employee_name", "Ananya Synthetic Rao", "found", 91.2, d, k, line=3),
        fld("employer_name", "Synthetic Systems Pvt Ltd", "found", 89.0, d, k, line=0),
        fld("pay_period", "2026-10", "found", 93.5, d, k, line=2),
        fld("gross_salary", 118000.0, "found", 90.1, d, k, line=11),
        fld("net_salary", 92000.0, "found", 92.7, d, k, line=15),
        fld("total_deductions", None, "missing", None, d, k, note="no deductions line recognised"),
    ])
    d, k = "SYN-DOC-BANK0101", "bank_statement"
    bank = extraction("SYN-EXT-BANK0101", d, k, 3, [
        fld("account_holder", "Ananya S Rao", "found", 88.4, d, k, line=1),
        fld("statement_period", "2026-08-01 to 2026-10-31", "found", 90.0, d, k, line=2),
        fld("salary_credits", 274500.0, "found", 89.9, d, k, page=2, line=40),
        fld("salary_credit_months", 3, "found", 89.9, d, k, page=2),
        fld("total_credits", 301000.0, "found", 90.3, d, k, page=3, line=12),
        fld("total_debits", 246800.0, "found", 90.3, d, k, page=3, line=13),
        fld("closing_balance", 54200.0, "low_confidence", 57.5, d, k, page=3, line=14,
            note="Tesseract confidence below 60"),
    ])
    d, k = "SYN-DOC-PAN0101", "pan_card"
    pan = extraction("SYN-EXT-PAN0101", d, k, 1, [
        fld("pan_number", "XXXXX4821X", "found", 95.0, d, k, line=4, note="masked; the full number is not stored"),
        fld("name", "Ananya Synthetic Rao", "found", 93.1, d, k, line=2),
        fld("date_of_birth", "1995-02-14", "found", 92.0, d, k, line=3),
    ])
    d, k = "SYN-DOC-AAD0101", "aadhaar_card"
    aad = extraction("SYN-EXT-AAD0101", d, k, 1, [
        fld("aadhaar_number", "XXXX XXXX 7316", "found", 94.0, d, k, line=6,
            note="masked; the full number is not stored"),
        fld("name", "Ananya Synthetic Rao", "found", 90.5, d, k, line=2),
        fld("date_of_birth", "1995-02-14", "found", 91.0, d, k, line=3),
        fld("address", None, "invalid", None, d, k, note="address could not be read"),
    ])
    return {"extraction_salary_slip": slip, "extraction_bank_statement": bank,
            "extraction_pan_card": pan, "extraction_aadhaar_card": aad}


def bureau_prime():
    return {"schema_version": "saral-bureau-report/1", "report_id": "SYN-BUR-000101",
            "applicant_id": "SYN-APP-000101", "provider_schema": "bureau-report/1",
            "provider_report_id": "rpt-synthetic-000101", "report_date": "2026-11-03",
            "generated_at": "2026-11-03T15:59:09Z", "identity_match": True,
            "score": {"value": 772, "status": "AVAILABLE", "type": "SYNTHETIC"},
            "tradelines": [
                {"tradeline_id": "SYN-TL-0101A", "type": "PERSONAL_LOAN", "status": "ACTIVE",
                 "opened_on": "2024-06-10", "closed_on": None, "sanctioned_amount": 500000,
                 "current_balance": 310000, "emi": 14000, "max_dpd_12m": 0, "max_dpd_24m": 0,
                 "status_changed_on": None},
                {"tradeline_id": "SYN-TL-0101B", "type": "CREDIT_CARD", "status": "ACTIVE",
                 "opened_on": "2021-01-05", "closed_on": None, "sanctioned_amount": 150000,
                 "current_balance": 0, "emi": 0, "max_dpd_12m": 0, "max_dpd_24m": 0, "status_changed_on": None},
                {"tradeline_id": "SYN-TL-0101C", "type": "AUTO_LOAN", "status": "CLOSED",
                 "opened_on": "2019-03-01", "closed_on": "2023-03-01", "sanctioned_amount": 400000,
                 "current_balance": 0, "emi": 0, "max_dpd_12m": 0, "max_dpd_24m": 0, "status_changed_on": None}],
            "enquiries": [{"enquiry_id": "SYN-ENQ-0101A", "enquired_on": "2026-09-20",
                           "purpose": "PERSONAL_LOAN", "amount": 600000},
                          {"enquiry_id": "SYN-ENQ-0101B", "enquired_on": "2025-12-01",
                           "purpose": "CREDIT_CARD", "amount": 0}],
            "aggregates": {"active_emi_total": 14000, "max_dpd_12m": 0, "max_dpd_24m": 0, "enquiries_6m": 1,
                           "writeoff_or_settlement_24m": False, "writeoff_or_settlement_ever": False},
            "data_quality_valid": True}


def bureau_writeoff():
    return {"schema_version": "saral-bureau-report/1", "report_id": "SYN-BUR-000303",
            "applicant_id": "SYN-APP-000303", "provider_schema": "bureau-report/1",
            "provider_report_id": "rpt-synthetic-000303", "report_date": "2026-11-03",
            "generated_at": "2026-11-03T16:28:00Z", "identity_match": True,
            "score": {"value": 610, "status": "AVAILABLE", "type": "SYNTHETIC"},
            "tradelines": [
                {"tradeline_id": "SYN-TL-0303A", "type": "PERSONAL_LOAN", "status": "WRITTEN_OFF",
                 "opened_on": "2023-01-15", "closed_on": None, "sanctioned_amount": 200000,
                 "current_balance": 85000, "emi": 0, "max_dpd_12m": 30, "max_dpd_24m": 90,
                 "status_changed_on": "2026-03-31"},
                {"tradeline_id": "SYN-TL-0303B", "type": "CREDIT_CARD", "status": "ACTIVE",
                 "opened_on": "2020-07-01", "closed_on": None, "sanctioned_amount": 60000,
                 "current_balance": 22000, "emi": 1100, "max_dpd_12m": 0, "max_dpd_24m": 30,
                 "status_changed_on": None}],
            "enquiries": [{"enquiry_id": "SYN-ENQ-0303A", "enquired_on": "2026-10-02", "purpose": "PERSONAL_LOAN",
                           "amount": 300000},
                          {"enquiry_id": "SYN-ENQ-0303B", "enquired_on": "2026-08-14", "purpose": "PERSONAL_LOAN",
                           "amount": 250000}],
            "aggregates": {"active_emi_total": 1100, "max_dpd_12m": 30, "max_dpd_24m": 90, "enquiries_6m": 2,
                           "writeoff_or_settlement_24m": True, "writeoff_or_settlement_ever": True},
            "data_quality_valid": True}


def bureau_ntc():
    return {"schema_version": "saral-bureau-report/1", "report_id": "SYN-BUR-000505",
            "applicant_id": "SYN-APP-000505", "provider_schema": "bureau-report/1",
            "provider_report_id": "rpt-synthetic-000505", "report_date": "2026-11-03",
            "generated_at": "2026-11-03T16:40:00Z", "identity_match": True,
            "score": {"value": None, "status": "NO_HIT", "type": "SYNTHETIC"},
            "tradelines": [], "enquiries": [],
            "aggregates": {"active_emi_total": 0, "max_dpd_12m": 0, "max_dpd_24m": 0, "enquiries_6m": 0,
                           "writeoff_or_settlement_24m": False, "writeoff_or_settlement_ever": False},
            "data_quality_valid": True}


def signature_check():
    return {"reference_document_id": "SYN-DOC-PAN0101", "candidate_document_id": "SYN-DOC-SIG0101",
            "similarity": 0.91, "method": "synthetic-fixture", "experimental": True}


def main():
    zin_a, out_a = scenario_a()
    files = {
        "applicant_salaried_metro": applicant(),
        "applicant_self_employed": applicant_self_employed(),
        **extractions(),
        "signature_check": signature_check(),
        "bureau_report_prime": bureau_prime(),
        "bureau_report_writeoff": bureau_writeoff(),
        "bureau_report_new_to_credit": bureau_ntc(),
        "segments_catalogue": [{"schema_version": "saral-segment/1", **s} for s in SEGMENTS],
        "zen_input_wedding_prime": zin_a,
        "zen_output_approve_draft": out_a,
        "zen_output_refer_low_confidence": scenario_b(),
        "zen_output_decline_writeoff": scenario_c(),
    }
    for name, data in files.items():
        (FIX / f"{name}.json").write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    catalogue = {
        "status": "DRAFT - not wired into ZEN; ASSUMPTION rows need owner approval",
        "policy_version": POLICY_VERSION, "lender": "Bajaj Finance Ltd", "lender_relationship": REL,
        "corpus": "corpus_v3 saral_nbfc_policy (feat/saral-corpus-collections @ 3de95b0)",
        "assessment_rate_for_new_emi": {"value": ASSESSMENT_RATE, "assumption_id": "A-05"},
        "base_rules": BASE_RULES,
        "product_rules": {pid: product_rules(pid) for pid in PRODUCTS},
        "segments": SEGMENTS,
        "excerpts": EXCERPTS,
    }
    CATALOGUE.write_text(json.dumps(catalogue, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    assert math.isclose(emi(100000, 0.10, 12), 8791.59, abs_tol=0.01)   # Bajaj example, BFL-PL-RATES-FEES#005
    print(f"wrote {len(files)} fixtures and {CATALOGUE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
