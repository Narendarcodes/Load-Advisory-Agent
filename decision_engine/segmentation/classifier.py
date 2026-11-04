"""Rule-based customer segmentation classifier for persona-based communication.

Derives borrowing experience and credit indicators from applicant data and assigns
one of four persona communication segments:
  1. Guided Explanation Required
  2. Simple Explanation Required
  3. Standard Explanation Required
  4. Technical Explanation Required

Privacy Notice:
  The response returned by `classify_applicant` contains ONLY:
    - segment
    - how_to_explain
  No PII (Personally Identifiable Information), demographics, or sensitive financial
  details are exposed in the output.
"""

from typing import Any
from .guidance import GUIDANCE


def _safe_int(value: Any, default: int = 0) -> int:
    """Safely convert a value to int, handling 'N/A', floats, and non-numeric strings."""
    if value is None:
        return default
    try:
        return int(float(str(value).strip()))
    except (ValueError, TypeError):
        return default


def derive_features(applicant: dict[str, Any]) -> dict[str, Any]:
    """Derive non-sensitive borrowing features from applicant credit report data.

    Supports credit fields inside 'cibil_report', 'bureau_report', 'bureau', or at root level.
    """
    report = (
        applicant.get("cibil_report")
        or applicant.get("bureau_report")
        or applicant.get("bureau")
        or {}
    )

    # Support accounts either inside report or directly at root level
    accounts = report.get("accounts") or applicant.get("accounts") or []

    # Separate loan accounts from credit cards and overdrafts
    loan_accounts = [
        account for account in accounts
        if str(account.get("account_type", "")).strip().lower() not in ["credit card", "overdraft"]
    ]

    loan_count = len(loan_accounts)

    distinct_loan_types = len({
        str(account.get("account_type")).strip().lower()
        for account in loan_accounts
        if str(account.get("account_type", "")).strip()
    })

    active_accounts = sum(
        1 for account in accounts
        if str(account.get("status", "")).strip().lower() == "active"
    )

    closed_accounts = sum(
        1 for account in accounts
        if str(account.get("status", "")).strip().lower() == "closed"
    )

    late_payments = sum(
        _safe_int(account.get("late_payments_12m"))
        for account in accounts
    )

    raw_score = (
        report.get("cibil_score")
        if report.get("cibil_score") is not None
        else (applicant.get("cibil_score") if applicant.get("cibil_score") is not None else applicant.get("credit_score"))
    )
    if raw_score is None and isinstance(report.get("score"), dict):
        raw_score = report.get("score", {}).get("value")
    if raw_score is None and isinstance(applicant.get("score"), dict):
        raw_score = applicant.get("score", {}).get("value")

    try:
        cibil_score = float(raw_score) if raw_score is not None else None
    except (ValueError, TypeError):
        cibil_score = None

    if cibil_score in (None, 0, -1):
        score_band = "Unavailable"
    elif not 300 <= cibil_score <= 900:
        score_band = "Unavailable"
    elif cibil_score >= 750:
        score_band = "High"
    elif cibil_score >= 700:
        score_band = "Good"
    elif cibil_score >= 650:
        score_band = "Moderate"
    else:
        score_band = "Low"

    history_months = _safe_int(
        report.get("credit_history_months")
        if report.get("credit_history_months") is not None
        else applicant.get("credit_history_months")
    )
    raw_util = (
        report.get("credit_card_utilization_percent")
        if report.get("credit_card_utilization_percent") is not None
        else applicant.get("credit_card_utilization_percent")
    )
    try:
        utilization = float(raw_util) if raw_util is not None else None
    except (ValueError, TypeError):
        utilization = None

    enquiries = _safe_int(
        report.get("enquiries_last_6_months")
        if report.get("enquiries_last_6_months") is not None
        else applicant.get("enquiries_last_6_months")
    )

    if loan_count == 0 and history_months == 0:
        loan_experience = "No recorded experience"
    elif loan_count <= 3:
        loan_experience = "Limited experience"
    elif loan_count <= 10:
        loan_experience = "Experienced"
    else:
        loan_experience = "Extensive experience"

    return {
        "loan_count": loan_count,
        "distinct_loan_types": distinct_loan_types,
        "active_accounts": active_accounts,
        "closed_accounts": closed_accounts,
        "late_payments_12m": late_payments,
        "cibil_score_band": score_band,
        "credit_history_months": history_months,
        "credit_card_utilization": utilization,
        "recent_enquiries": enquiries,
        "loan_experience": loan_experience,
        "has_credit_history": (history_months > 0 or len(accounts) > 0)
    }


def classify_applicant(applicant: dict[str, Any]) -> dict[str, Any]:
    """Classify applicant into communication persona segment.

    Guarantees that ONLY 'segment' and 'how_to_explain' are returned,
    ensuring no sensitive personal information is leaked to downstream
    AI agents or users.
    """
    features = derive_features(applicant)

    loan_count = features["loan_count"]
    product_types = features["distinct_loan_types"]
    history_months = features["credit_history_months"]
    has_history = features["has_credit_history"]

    # 1. Guided: No credit history or zero previous loans
    if not has_history or loan_count == 0:
        segment = "Guided Explanation Required"

    # 2. Technical: Experienced borrower with diverse portfolio or 10+ loans
    elif (
        loan_count > 10
        or (
            loan_count >= 4
            and product_types >= 2
            and history_months >= 36
        )
    ):
        segment = "Technical Explanation Required"

    # 3. Simple: Limited borrowing experience (<=3 loans, <=2 types)
    elif loan_count <= 3 and product_types <= 2:
        segment = "Simple Explanation Required"

    # 4. Standard: Established borrower with standard profile
    else:
        segment = "Standard Explanation Required"

    return {
        "segment": segment,
        "how_to_explain": list(GUIDANCE[segment])
    }
