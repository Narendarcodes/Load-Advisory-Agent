"""Borrower-safe reason categories and messages (closed sets).

Rules for every message here (enforced by contracts/tests/test_rule_catalogue_v2.py):
no digits, no rule ids, no thresholds or values, no check logic, and no word that tells
a borrower they were flagged (fraud, list, duplicate, tamper, signature, ...).
"""

# The closed set of borrower reason categories (user instruction, 2026-11-03 22:32 IST).
CATEGORIES = {
    "EMPLOYMENT_STABILITY": "Employment stability",
    "INCOME_NOT_VERIFIED_OR_INSUFFICIENT": "Income could not be verified / not sufficient",
    "REPAYMENTS_TOO_HIGH": "Existing repayments too high for this amount",
    "CREDIT_HISTORY": "Credit history / repayment track",
    "RECENT_CREDIT_APPLICATIONS": "Recent credit applications",
    "DETAILS_NOT_VERIFIED": "Details could not be verified",
    "DOCUMENTS_INCOMPLETE_OR_UNCLEAR": "Documents incomplete or unclear",
    "REQUEST_OUTSIDE_OFFER": "Loan request outside what we offer",
    "OTHER": "Other",
}

# Closed set of messages. A rule picks one key for its non-pass outcome and one for
# INSUFFICIENT_DATA. Keys are prefixed with their category so the mapping is checkable.
MESSAGES = {
    "EMPLOYMENT_STABILITY.history": (
        "EMPLOYMENT_STABILITY",
        "Your employment history did not meet our stability requirement for this loan."),
    "EMPLOYMENT_STABILITY.profile": (
        "EMPLOYMENT_STABILITY",
        "Your employment details did not meet our requirements for this loan."),
    "EMPLOYMENT_STABILITY.missing": (
        "EMPLOYMENT_STABILITY",
        "We need a few more details about your employment to complete the assessment."),
    "INCOME_NOT_VERIFIED_OR_INSUFFICIENT.insufficient": (
        "INCOME_NOT_VERIFIED_OR_INSUFFICIENT",
        "Your income did not meet our requirement for this loan."),
    "INCOME_NOT_VERIFIED_OR_INSUFFICIENT.unverified": (
        "INCOME_NOT_VERIFIED_OR_INSUFFICIENT",
        "We could not verify your income from the information provided. Our team will review it."),
    "INCOME_NOT_VERIFIED_OR_INSUFFICIENT.missing": (
        "INCOME_NOT_VERIFIED_OR_INSUFFICIENT",
        "We need more information about your income to complete the assessment."),
    "REPAYMENTS_TOO_HIGH.foir": (
        "REPAYMENTS_TOO_HIGH",
        "Your existing repayments are too high for the amount requested. A smaller amount may be possible."),
    "REPAYMENTS_TOO_HIGH.review": (
        "REPAYMENTS_TOO_HIGH",
        "We need to review whether this amount is affordable alongside your existing repayments."),
    "REPAYMENTS_TOO_HIGH.missing": (
        "REPAYMENTS_TOO_HIGH",
        "We need more information about your existing repayments to complete the assessment."),
    "CREDIT_HISTORY.decline": (
        "CREDIT_HISTORY",
        "Your credit history or repayment track record did not meet our requirements for this loan."),
    "CREDIT_HISTORY.review": (
        "CREDIT_HISTORY",
        "Our team needs to review your credit history before we can continue."),
    "CREDIT_HISTORY.missing": (
        "CREDIT_HISTORY",
        "We could not complete the credit history check yet. We will contact you if we need anything."),
    "RECENT_CREDIT_APPLICATIONS.review": (
        "RECENT_CREDIT_APPLICATIONS",
        "There has been recent credit application activity on your profile, so our team will review your application."),
    "DETAILS_NOT_VERIFIED.generic": (
        "DETAILS_NOT_VERIFIED",
        "We couldn't verify some details in your application. Our team will review it and may contact you."),
    "DOCUMENTS_INCOMPLETE_OR_UNCLEAR.missing": (
        "DOCUMENTS_INCOMPLETE_OR_UNCLEAR",
        "Some required documents or details are missing. Please provide them to continue."),
    "DOCUMENTS_INCOMPLETE_OR_UNCLEAR.unclear": (
        "DOCUMENTS_INCOMPLETE_OR_UNCLEAR",
        "Some documents were unclear or not recent enough. Please upload clearer or more recent copies."),
    "REQUEST_OUTSIDE_OFFER.decline": (
        "REQUEST_OUTSIDE_OFFER",
        "The loan amount, tenure or purpose requested is outside what we currently offer."),
    "REQUEST_OUTSIDE_OFFER.review": (
        "REQUEST_OUTSIDE_OFFER",
        "We need to review the loan amount, tenure or purpose you requested. We may suggest a different option."),
    "REQUEST_OUTSIDE_OFFER.counter_offer": (
        "REQUEST_OUTSIDE_OFFER",
        "The amount or repayment period you asked for is more than we can offer for this loan. We have shown the most we can offer instead."),
    "REQUEST_OUTSIDE_OFFER.outside_range": (
        "REQUEST_OUTSIDE_OFFER",
        "The amount you asked for is outside what we offer. We have shown the most we can offer instead."),
    "REPAYMENTS_TOO_HIGH.counter_offer": (
        "REPAYMENTS_TOO_HIGH",
        "A smaller amount fits better alongside your income and existing repayments. We have shown the amount we can offer."),
    "CREDIT_HISTORY.counter_offer": (
        "CREDIT_HISTORY",
        "Based on your credit history, we can offer a smaller amount than you asked for."),
    "EMPLOYMENT_STABILITY.counter_offer": (
        "EMPLOYMENT_STABILITY",
        "Based on your time with your current employer, we can offer a smaller amount than you asked for."),
    "OTHER.eligibility": (
        "OTHER",
        "Your application did not meet our basic eligibility criteria for this loan."),
    "OTHER.consent": (
        "OTHER",
        "We need your consent to continue with your application."),
    "OTHER.processing": (
        "OTHER",
        "We need a little more time to complete our checks. We will be in touch."),
    "OTHER.review": (
        "OTHER",
        "Our team needs to review some details of your application."),
    "OTHER.none": (
        "OTHER",
        "Not shown to the borrower: this step only computes a value used elsewhere."),
}

# Words that must never appear in a borrower message.
FORBIDDEN_WORDS = (
    "fraud", "flag", "list", "blacklist", "negative", "duplicate", "tamper", "forg", "signature",
    "suspicious", "threshold", "minimum", "maximum", "limit", "score", "foir", "dpd", "rule",
    "percent", "lakh", "rs.", "rupee", "months", "days", "years", "bureau", "cibil", "ratio",
)
