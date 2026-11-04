"""Synthetic source schemas: the coverage target for every ZEN input.

SYNTHETIC_BUREAU is the BUILT provider contract bureau-report/1 (decision_engine/schemas/bureau.py
@ 716db49, owned by Qoder). SYNTHETIC_BUREAU_V2 is a DESIGN proposal of additive optional fields.
SYNTHETIC_PAN / SYNTHETIC_AADHAAR / SYNTHETIC_BANK are PROPOSED shapes for the
feat/saral-synthetic-kyc-bank stream, which had no committed schema when this was written
(wt-synth held only an untracked synthetic_data/saral_kyc_bank/ids.py). OCR keys are PR #41's
document_parser keys (contracts.document_extraction.FIELD_KEYS) plus the Paddle chain and
signature-screening outputs on feat/saral-ocr-paddle-signature @ 0b5dede.
"""
from contracts.document_extraction import FIELD_KEYS

BUREAU_V1_PATHS = [
    "schema_version", "correlation_id", "provider.name", "provider.version", "provider.synthetic", "provider.warning",
    "report_id", "application_id", "applicant_id", "generated_at", "report_date",
    "identity.match", "identity.checked_on", "identity.method",
    "score.value", "score.type", "score.version", "score.status", "score.range_min", "score.range_max", "score.components",
    "score.disclaimer",
    "accounts[].account_id", "accounts[].account_type", "accounts[].status", "accounts[].opened_on", "accounts[].closed_on",
    "accounts[].credit_limit", "accounts[].original_amount", "accounts[].current_balance", "accounts[].monthly_obligation",
    "accounts[].months_reviewed", "accounts[].worst_delinquency_days", "accounts[].payment_history",
    "accounts[].last_payment_date", "accounts[].synthetic",
    "enquiries[].enquiry_id", "enquiries[].enquired_on", "enquiries[].purpose", "enquiries[].amount", "enquiries[].synthetic",
    "data_quality.valid", "data_quality.issues[].code", "data_quality.issues[].message", "data_quality.issues[].field",
    "data_quality.issues[].source", "data_quality.issues[].severity",
    "provenance.synthetic", "provenance.source_system", "provenance.seed", "provenance.generation_version",
    "provenance.scenario_id", "provenance.fixture_id", "provenance.record_origin", "provenance.correlation_id",
]

# Proposed bureau-report/2: every field optional and additive. DESIGN ONLY; Qoder owns the bureau code.
BUREAU_V2_PROPOSED = {
    "subject.name": "Name on the bureau record (synthetic). Feeds PL-021.",
    "subject.dob": "Date of birth on the record. Feeds PL-022.",
    "subject.pan_masked": "XXXXX1234X; lets the DQ gate confirm the subject without the full PAN.",
    "subject.addresses[].city": "Reported city. Feeds PL-023.",
    "subject.addresses[].pincode": "Reported PIN. Feeds PL-023.",
    "subject.addresses[].reported_on": "Date the address was reported.",
    "score_history[].as_of": "Score history date. Feeds PL-030.",
    "score_history[].value": "Score history value. Feeds PL-030.",
    "accounts[].ownership": "INDIVIDUAL | JOINT | GUARANTOR (exposure attribution).",
    "accounts[].amount_overdue": "Current overdue amount. Feeds PL-039.",
    "accounts[].suit_filed": "Suit filed / wilful default indicator. Feeds PL-049.",
    "accounts[].restructured": "Restructured flag. Feeds PL-050.",
    "accounts[].status_changed_on": "Date of write-off / settlement / closure. Replaces the closed_on/last_payment_date proxy in PL-047/PL-048.",
    "accounts[].written_off_amount": "Amount written off.",
    "accounts[].settlement_amount": "Amount settled.",
    "accounts[].reported_on": "Date the lender last reported the account.",
    "accounts[].payment_history_months": "YYYY-MM label per payment_history entry, oldest first; fixes the open order question and feeds PL-045.",
    "accounts[].balance_history[].month": "Balance history month. Feeds PL-056.",
    "accounts[].balance_history[].balance": "Balance history value. Feeds PL-056.",
    "enquiries[].enquiry_type": "Enum (PERSONAL_LOAN, CREDIT_CARD, HOME_LOAN, AUTO_LOAN, OTHER) replacing free-text purpose for PL-054.",
}

PAN_PROPOSED = ["pan_masked", "pan_status", "name_on_pan", "dob_on_pan", "father_name_on_pan", "pan_aadhaar_linked",
                "verified_at", "provider.synthetic"]
AADHAAR_PROPOSED = ["aadhaar_last4", "verification_status", "name", "dob", "year_of_birth", "gender", "care_of",
                    "address.line_masked", "address.locality", "address.city", "address.state", "address.pincode",
                    "verified_at", "provider.synthetic"]
BANK_PROPOSED = ["consent_id", "fip_id", "account.masked_number", "account.ifsc", "account.holder_name", "account.type",
                 "period.from", "period.to", "summary.opening_balance", "summary.closing_balance",
                 "transactions[].txn_id", "transactions[].date", "transactions[].amount", "transactions[].type",
                 "transactions[].mode", "transactions[].narration", "transactions[].balance_after", "transactions[].category",
                 "fetched_at", "provider.synthetic"]
BANK_CATEGORIES = ["SALARY", "SALARY_REVERSAL", "EMI", "NACH_RETURN", "CHEQUE_RETURN", "CASH_DEPOSIT", "UPI", "TRANSFER",
                   "RENT", "UTILITY", "OTHER"]

OCR_KEYS = sorted(f"{kind.value}.{key}" for kind, keys in FIELD_KEYS.items() for key in keys) + [
    "chain.ocr_route", "chain.ocr_needs_manual_review", "chain.field_confidence",
    "signature.present", "signature.crop_sha256", "signature.anomaly_score", "signature.similarity", "signature.method",
    "document.sha256", "document.date", "document.pages",
]

SOURCES = {
    "SYNTHETIC_BUREAU": {"schema": "bureau-report/1", "status": "BUILT", "owner": "Qoder",
                         "where": "decision_engine/schemas/bureau.py @ 716db49", "paths": BUREAU_V1_PATHS},
    "SYNTHETIC_BUREAU_V2": {"schema": "bureau-report/2", "status": "PROPOSED (design only)", "owner": "Qoder",
                            "where": "this design", "paths": sorted(BUREAU_V2_PROPOSED)},
    "SYNTHETIC_PAN": {"schema": "saral-kyc-pan/1", "status": "PROPOSED for feat/saral-synthetic-kyc-bank", "owner": "synthetic-kyc-bank",
                      "where": "not committed", "paths": PAN_PROPOSED},
    "SYNTHETIC_AADHAAR": {"schema": "saral-kyc-aadhaar/1", "status": "PROPOSED for feat/saral-synthetic-kyc-bank",
                          "owner": "synthetic-kyc-bank", "where": "not committed", "paths": AADHAAR_PROPOSED,
                          "note": "Never returns or accepts a full Aadhaar number; last 4 digits and verification status only."},
    "SYNTHETIC_BANK": {"schema": "saral-bank-statement-aa/1", "status": "PROPOSED for feat/saral-synthetic-kyc-bank (AA-style)",
                       "owner": "synthetic-kyc-bank", "where": "not committed", "paths": BANK_PROPOSED,
                       "categories": BANK_CATEGORIES},
    "OCR": {"schema": "saral-document-extraction/1 + Paddle chain", "status": "PR #41 open; Paddle chain prototype @ 0b5dede",
            "owner": "OCR stream", "where": "contracts/document_extraction.py FIELD_KEYS; apps/.../ocr/chain.py @ 0b5dede",
            "paths": OCR_KEYS},
}
MVP_SOURCES = {"SYNTHETIC_BUREAU", "SYNTHETIC_PAN", "SYNTHETIC_AADHAAR", "SYNTHETIC_BANK", "OCR"}


def has_path(source, path):
    return source in SOURCES and path in SOURCES[source]["paths"]
