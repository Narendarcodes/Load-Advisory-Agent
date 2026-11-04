"""Deterministic facts the LLM is allowed to phrase — built ONLY from a Decision Evidence record.

Nothing here decides anything: reasons are the record's FAIL rule evaluations, thresholds are the
pinned (SYNTHETIC) policy's own values, and improvement targets are plain arithmetic on those
thresholds, re-checked through the unchanged ZEN path by tools.run_what_if.
"""
import math
import re

SYNTHETIC_LABEL = ("synthetic prototype policy (example rules used for this demo, not any real lender's policy)")
SCORED = ("monthly_income", "monthly_obligations", "credit_score", "employment_months")

RULE_PLAIN = {
    "MIN_MONTHLY_INCOME": {"name": "Monthly income",
                           "low": "how much money you earn each month",
                           "high": "minimum net monthly income"},
    "FOIR_MAX_45": {"name": "Existing EMIs vs income (FOIR)",
                    "low": "the part of your monthly income already going to loan EMIs and other fixed payments",
                    "high": "fixed-obligation-to-income ratio (FOIR = monthly obligations / monthly income)"},
    "MIN_CREDIT_SCORE": {"name": "Credit score",
                         "low": "your credit score (a number from 300 to 900 that shows how well you have repaid loans and cards)",
                         "high": "bureau credit score (300-900)"},
    "MIN_EMPLOYMENT_TENURE": {"name": "Time in current job",
                              "low": "how many months you have worked continuously",
                              "high": "continuous employment tenure"},
}

BUREAU_REASON_PLAIN = {  # data-quality reason codes -> what the applicant would notice, no thresholds
    "DQ_MISSING_REQUIRED_FIELD": "some required details are missing",
    "DQ_INVALID_APPLICATION_VALUE": "some details did not pass validation",
    "DQ_CREDIT_SCORE_CONFLICT": "the score recorded on your application and the bureau score do not match",
    "DQ_BUREAU_NO_HIT": "the bureau has no record that matches you",
    "DQ_BUREAU_INSUFFICIENT_HISTORY": "your bureau record is too thin to verify",
    "DQ_BUREAU_REPORT_STALE": "the bureau report is too old to use",
    "DQ_BUREAU_IDENTITY_MISMATCH": "the bureau report does not match your identity details",
    "DQ_BUREAU_INCOMPLETE_REPORT": "the bureau report is incomplete",
    "DQ_INCOME_OBLIGATION_INCONSISTENT": "your recorded income and existing obligations do not add up",
    "BUREAU_TIMEOUT": "the bureau did not respond in time",
    "BUREAU_RATE_LIMITED": "the bureau is temporarily rate-limiting requests",
    "BUREAU_UNAVAILABLE": "the bureau service is unavailable",
    "BUREAU_MALFORMED_RESPONSE": "the bureau response could not be read",
    "BUREAU_UNSAFE_NON_SYNTHETIC": "the report did not come from the approved synthetic provider",
}

GENERAL_TASKS = {  # general financial guidance — NOT taken from any lender policy; labelled as such
    "MIN_MONTHLY_INCOME": "Make sure every regular income you have is documented (salary slips, bank statements, ITR) when you apply.",
    "FOIR_MAX_45": "Close or prepay a small loan or card balance, and avoid taking any new loan or EMI before reapplying.",
    "MIN_CREDIT_SCORE": "Pay every EMI and card bill on time, keep card usage low, and check your credit report for mistakes (you can dispute errors with the credit bureau).",
    "MIN_EMPLOYMENT_TENURE": "Stay in your current job; keep your offer letter and recent salary slips ready as proof of tenure.",
}


def inr(x: float) -> str:
    """₹ with Indian digit grouping (₹1,25,000)."""
    n = int(round(float(x)))
    s = str(abs(n))
    if len(s) > 3:
        head, tail = s[:-3], s[-3:]
        groups = []
        while len(head) > 2:
            groups.insert(0, head[-2:]); head = head[:-2]
        if head:
            groups.insert(0, head)
        s = ",".join(groups + [tail])
    return ("-" if n < 0 else "") + "₹" + s


def pct(x: float, digits: int = 1) -> str:
    return f"{float(x) * 100:.{digits}f}%"


def _display(rule_id: str, v):
    if v is None:
        return "not available"
    if rule_id == "MIN_MONTHLY_INCOME":
        return inr(v)
    if rule_id == "FOIR_MAX_45":
        return pct(v)
    if rule_id == "MIN_EMPLOYMENT_TENURE":
        return f"{int(v)} months"
    return str(int(v))


SCORE_SOURCE_PLAIN = {
    "SYNTHETIC_BUREAU": "the synthetic bureau",
    "SYNTHETIC_BUREAU_MATCH": "the synthetic bureau, which matched the score already on the application",
    "SYNTHETIC_BUREAU_REPLACED_PLACEHOLDER": "the synthetic bureau, replacing a placeholder score on the application",
    "NO_BUREAU_SCORE": "no bureau score",
    "INVALID_LOCAL_SCORE": "an invalid score on the application",
    "CONFLICT": "two scores that did not match",
}


def bureau_facts(record: dict | None) -> dict | None:
    """Additive projection of the bureau/review evidence blocks, or None for a non-bureau record.

    ``decision`` stays the legacy evidence value (a data-quality hold is still the legacy
    ``ERROR``); ``recorded_outcome`` is the operational outcome (APPROVED/REJECTED/REVIEW/ERROR).
    This module never resolves a score or a gate; it only describes what was recorded.
    """
    if not record:
        return None
    bureau = record.get("bureau")
    review = record.get("review")
    if not bureau and not review:
        return None
    outcome = record.get("outcome") or record.get("decision")
    dq = (bureau or {}).get("data_quality") or (review or {})
    score = (bureau or {}).get("score") or {}
    provider_error = (bureau or {}).get("provider_error")
    if outcome == "REVIEW":
        kind = "DATA_QUALITY_HOLD"
    elif outcome == "ERROR":
        kind = "PROVIDER_FAILURE" if provider_error else "EVALUATION_ERROR"
    elif outcome == "REJECTED":
        kind = "CREDIT_REJECTION"
    elif outcome == "APPROVED":
        kind = "APPROVED"
    else:
        kind = "OTHER"
    codes = [str(c) for c in dq.get("reason_codes") or []]
    missing = [str(m) for m in ((record.get("inputs") or {}).get("missing_fields") or [])]
    return {
        "recorded_outcome": outcome,
        "legacy_decision": record.get("decision"),
        "outcome_kind": kind,
        "is_credit_rejection": kind == "CREDIT_REJECTION",
        "is_data_quality_hold": kind == "DATA_QUALITY_HOLD",
        "is_provider_failure": kind == "PROVIDER_FAILURE",
        "is_non_rejected": kind != "CREDIT_REJECTION",
        "review_required": bool(dq.get("required")),
        "info_requested": bool(dq.get("info_requested")),
        "review_reason_codes": codes,
        "review_reasons_plain": [BUREAU_REASON_PLAIN.get(c, c.replace("_", " ").lower()) for c in codes],
        "info_requested_fields": missing,
        "data_quality_category": dq.get("category"),
        "score_source": score.get("source"),
        "score_source_plain": SCORE_SOURCE_PLAIN.get(score.get("source"), score.get("source")),
        "score_conflict": bool(score.get("conflict")),
        "provider_error": provider_error,
        "retryable": bool(provider_error and provider_error.get("retryable")),
        "synthetic_report": bool((bureau or {}).get("fetched")) and (bureau or {}).get("report_schema") == "bureau-report/1",
    }


_RULE_INPUTS = {"MIN_MONTHLY_INCOME": ("monthly_income",), "FOIR_MAX_45": ("monthly_income", "monthly_obligations"),
                "MIN_CREDIT_SCORE": ("credit_score",), "MIN_EMPLOYMENT_TENURE": ("employment_months",)}


def _unchecked_display(rule_id: str, inputs: dict) -> str:
    """'Yours' for a rule the engine did not evaluate: never a value it did not check, never 'not available'
    for a value that is on file. 'missing' when a needed input is missing, 'not checked' when all are recorded."""
    needed = _RULE_INPUTS.get(rule_id)
    if not needed:
        return "not available"
    values, missing = inputs.get("values") or {}, set(inputs.get("missing_fields") or [])
    if any(f in missing or values.get(f) is None for f in needed):
        return "missing"
    return "not checked"


def decision_card(record: dict) -> dict:
    """UI/voice decision card: recorded outcome + per-rule table. Pure projection of the record."""
    pol = record.get("policy") or {}
    rules = []
    inputs = record.get("inputs")
    for e in record.get("rule_evaluations", []):
        actual_disp, _ = _display_vs(e["rule_id"], e.get("actual_value"), e["threshold"])
        if e.get("actual_value") is None and e.get("result") == "NOT_EVALUABLE" and inputs:
            actual_disp = _unchecked_display(e["rule_id"], inputs)
        rules.append({"rule_id": e["rule_id"], "name": RULE_PLAIN.get(e["rule_id"], {}).get("name", e.get("rule_name")),
                      "reason_code": e["reason_code"], "result": e["result"],
                      "actual": actual_disp,
                      "threshold": ("≥ " if e["operator"] == ">=" else "≤ ") + _display(e["rule_id"], e["threshold"]),
                      "threshold_source": "synthetic" if pol.get("synthetic") else e.get("threshold_source")})
    card = {"application_ref": record.get("application_ref"), "decision": record.get("decision"),
            "recorded_outcome": record.get("outcome") or record.get("decision"),
            "lifecycle_state": record.get("lifecycle_state"), "record_id": record.get("record_id"),
            "policy_version": pol.get("version"), "policy_synthetic": bool(pol.get("synthetic")),
            "policy_label": SYNTHETIC_LABEL if pol.get("synthetic") else pol.get("threshold_source"),
            "evaluated_at": record.get("evaluated_at"), "rules": rules,
            "failed_reason_codes": record.get("failed_reason_codes", []),
            "missing_fields": (record.get("inputs") or {}).get("missing_fields", []), "flags": record.get("flags", [])}
    bf = bureau_facts(record)
    if bf:
        card["bureau"] = {k: bf[k] for k in ("outcome_kind", "review_required", "info_requested", "review_reason_codes",
                                             "info_requested_fields", "data_quality_category", "score_source",
                                             "score_conflict", "provider_error", "retryable", "synthetic_report")}
    return card


# ------------------------------------------------------------------ borrower projection (Q-07 / Q-14)
BORROWER_LABEL = "Synthetic prototype policy, not any real lender's policy. Not a loan sanction."
REASON_LABELS = {  # catalogue v2 borrower_reason_categories (keys only reach the client, never values)
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
V1_REASON_CATEGORY = {"MIN_MONTHLY_INCOME": "INCOME_NOT_VERIFIED_OR_INSUFFICIENT", "FOIR_MAX_45": "REPAYMENTS_TOO_HIGH",
                      "MIN_CREDIT_SCORE": "CREDIT_HISTORY", "MIN_EMPLOYMENT_TENURE": "EMPLOYMENT_STABILITY"}


def reason_categories(record: dict) -> list[dict]:
    """Borrower-safe reason themes: catalogue-v2 categories stored on the record, else mapped from failed v1 rules."""
    keys = list(record.get("reason_categories") or [])
    if not keys:
        for e in record.get("rule_evaluations", []):
            if e.get("result") == "FAIL":
                keys.append(V1_REASON_CATEGORY.get(e.get("rule_id"), "OTHER"))
        bf = bureau_facts(record)
        if bf and (bf.get("review_required") or bf.get("info_requested")):
            keys.append("DETAILS_NOT_VERIFIED")
    out, seen = [], set()
    for k in keys:
        k = k if k in REASON_LABELS else "OTHER"
        if k not in seen:
            seen.add(k)
            out.append({"key": k, "label": REASON_LABELS[k]})
    return out


def borrower_offer(record: dict) -> dict | None:
    """{amount, emi, tenure_months} from the stored offer (catalogue v2), else None. Never a cut-off."""
    o = record.get("offer") or {}
    if not o.get("amount"):
        return None
    return {"amount": _finite(o.get("amount")), "emi": _finite(o.get("emi")), "tenure_months": _finite(o.get("tenure_months")),
            "counter_offer": bool(o.get("counter_offer"))}


def _finite(v):
    if isinstance(v, bool) or not isinstance(v, (int, float)):
        return None
    return v if v == v and v not in (float("inf"), float("-inf")) else None


# E2E D-16: the borrower never sees a recorded outcome code. The card speaks the assistant UI's vocabulary (genui
# catalog / plain.ts) and the explain facts carry plain words in the borrower's language.
BORROWER_OUTCOME = {"ELIGIBILITY_CONDITIONS_MET": "APPROVED", "COUNTER_OFFER": "COUNTER", "MANUAL_REVIEW": "REVIEW",
                    "MORE_INFORMATION_REQUIRED": "INFO_REQUESTED", "DECLINE": "REJECTED"}
OUTCOME_PLAIN = {
    "APPROVED": {"en": "your application met our conditions in this demo check (not a final loan sanction)",
                 "hi": "इस डेमो जाँच में आपका आवेदन हमारी शर्तें पूरी करता है (यह अंतिम लोन मंज़ूरी नहीं है)",
                 "te": "ఈ డెమో తనిఖీలో మీ దరఖాస్తు మా షరతులను నెరవేర్చింది (ఇది తుది లోన్ మంజూరు కాదు)"},
    "COUNTER": {"en": "we can't offer the full amount you asked for, but we can offer a smaller loan",
                "hi": "हम आपकी माँगी गई पूरी राशि नहीं दे सकते, पर कम राशि का लोन दे सकते हैं",
                "te": "మీరు అడిగిన పూర్తి మొత్తం ఇవ్వలేము, కానీ తక్కువ మొత్తంలో లోన్ ఇవ్వగలము"},
    "REVIEW": {"en": "a person on our team will look at your application",
               "hi": "हमारी टीम का एक व्यक्ति आपका आवेदन देखेगा",
               "te": "మా బృందంలోని ఒక వ్యక్తి మీ దరఖాస్తును చూస్తారు"},
    "INFO_REQUESTED": {"en": "we need a few more details from you before we can finish",
                       "hi": "जाँच पूरी करने से पहले हमें आपसे कुछ और जानकारी चाहिए",
                       "te": "తనిఖీ పూర్తి చేయడానికి ముందు మాకు మీ నుండి మరికొన్ని వివరాలు కావాలి"},
    "REJECTED": {"en": "we can't approve this application right now",
                 "hi": "हम अभी यह आवेदन स्वीकृत नहीं कर सकते",
                 "te": "ప్రస్తుతం ఈ దరఖాస్తును మేము ఆమోదించలేము"},
    "ERROR": {"en": "we couldn't finish checking your application yet",
              "hi": "हम अभी आपके आवेदन की जाँच पूरी नहीं कर सके",
              "te": "మేము ఇంకా మీ దరఖాస్తు తనిఖీ పూర్తి చేయలేకపోయాము"},
}


def borrower_outcome(code: str | None) -> str | None:
    """A recorded outcome in the borrower UI's vocabulary (v2 codes mapped; v1 values unchanged)."""
    if not code:
        return code
    return BORROWER_OUTCOME.get(code, code)


def outcome_plain(record: dict, locale: str = "en") -> str:
    """The recorded outcome in plain words for the borrower, never the code."""
    key = borrower_outcome(record.get("outcome") or record.get("decision")) or ""
    words = OUTCOME_PLAIN.get(key) or OUTCOME_PLAIN["REVIEW" if key in ("MANUAL_REVIEW", "REFER") else "ERROR"]
    return words.get(locale) or words["en"]


def offer_plain(record: dict) -> dict | None:
    """The stored offer as display strings (₹ amounts, months) for the explain facts and fallback."""
    o = borrower_offer(record)
    if not o:
        return None
    return {"amount": inr(o["amount"]) if o.get("amount") else None, "emi": inr(o["emi"]) if o.get("emi") else None,
            "loan_period_months": int(o["tenure_months"]) if o.get("tenure_months") else None,
            "is_counter_offer": bool(o.get("counter_offer"))}


# E2E D-17: catalogue-v2 rule ids never reach the borrower as a missing item. Same map as the portal API (D-07,
# loan_advisory_portal/api/applications.py RULE_FIELD); an unknown rule id becomes the generic "documents".
RULE_FIELD = {
    "PL-001": "date_of_birth", "PL-002": "date_of_birth", "PL-073": "date_of_birth", "PL-003": "nationality",
    "PL-004": "employment_type", "PL-005": "employment_type", "PL-006": "identity_verification",
    "PL-008": "monthly_income", "PL-012": "salary_credits", "PL-078": "salary_credits",
    "PL-014": "employment_months", "PL-019": "credit_history_details", "PL-020": "credit_history_details",
    "PL-024": "credit_history_details", "PL-028": "credit_history_details", "PL-069": "loan_amount",
    "PL-070": "loan_amount", "PL-071": "tenure", "PL-072": "tenure", "PL-076": "loan_purpose",
    "PL-088": "documents", "PL-094": "identity_documents", "PL-095": "consents", "PL-102": "pan",
    "PL-111": "purpose_documents", "PL-112": "loan_purpose", "PL-121": "income_documents",
}
FIELD_WORDS = {
    "date_of_birth": ("your date of birth", "आपकी जन्म तिथि", "మీ పుట్టిన తేదీ"),
    "nationality": ("your nationality", "आपकी नागरिकता", "మీ పౌరసత్వం"),
    "employment_type": ("your type of job", "आपकी नौकरी का प्रकार", "మీ ఉద్యోగ రకం"),
    "identity_verification": ("a check of your identity", "आपकी पहचान की जाँच", "మీ గుర్తింపు తనిఖీ"),
    "monthly_income": ("your monthly income", "आपकी मासिक आय", "మీ నెలవారీ ఆదాయం"),
    "monthly_obligations": ("your current monthly EMIs", "आपकी अभी की मासिक EMI", "మీ ప్రస్తుత నెలవారీ EMIలు"),
    "salary_credits": ("your salary credits in your bank statement", "बैंक स्टेटमेंट में आपकी सैलरी", "బ్యాంక్ స్టేట్‌మెంట్‌లో మీ జీతం జమలు"),
    "employment_months": ("how long you have been in your current job", "मौजूदा नौकरी में आपका समय", "ప్రస్తుత ఉద్యోగంలో మీరు ఉన్న కాలం"),
    "credit_history_details": ("your credit history details", "आपके क्रेडिट इतिहास की जानकारी", "మీ క్రెడిట్ చరిత్ర వివరాలు"),
    "credit_score": ("your credit history details", "आपके क्रेडिट इतिहास की जानकारी", "మీ క్రెడిట్ చరిత్ర వివరాలు"),
    "loan_amount": ("the loan amount", "लोन राशि", "లోన్ మొత్తం"),
    "tenure": ("the loan period", "लोन की अवधि", "లోన్ వ్యవధి"),
    "loan_purpose": ("the purpose of the loan", "लोन का उद्देश्य", "లోన్ ఉద్దేశ్యం"),
    "documents": ("some documents", "कुछ दस्तावेज़", "కొన్ని పత్రాలు"),
    "identity_documents": ("your identity documents", "आपके पहचान दस्तावेज़", "మీ గుర్తింపు పత్రాలు"),
    "consents": ("your consent to the loan terms and privacy notice", "लोन शर्तों और गोपनीयता सूचना पर आपकी सहमति",
                 "లోన్ నిబంధనలు, గోప్యతా నోటీసుకు మీ అంగీకారం"),
    "pan": ("your PAN", "आपका PAN", "మీ PAN"),
    "purpose_documents": ("documents for the loan purpose", "लोन के उद्देश्य से जुड़े दस्तावेज़", "లోన్ ఉద్దేశ్యానికి సంబంధించిన పత్రాలు"),
    "income_documents": ("your income documents, such as salary slips", "आपके आय दस्तावेज़, जैसे सैलरी स्लिप",
                         "మీ ఆదాయ పత్రాలు, ఉదా. జీతం స్లిప్‌లు"),
    "applicant_id": ("an identity detail", "पहचान की एक जानकारी", "ఒక గుర్తింపు వివరం"),
}
_RULE_ID = re.compile(r"^[A-Z]{2,4}-\d{3}$")


def borrower_missing_fields(record: dict) -> list[str]:
    """Missing items as plain field keys: rule ids mapped (unknown ones to "documents"), duplicates dropped."""
    out: list[str] = []
    for m in (record.get("inputs") or {}).get("missing_fields") or []:
        m = str(m)
        key = RULE_FIELD.get(m, "documents") if _RULE_ID.match(m) else m
        if key not in out:
            out.append(key)
    return out


def missing_field_words(fields: list[str], locale: str = "en") -> str:
    """The missing items in plain words in the borrower's language."""
    i = {"en": 0, "hi": 1, "te": 2}.get(locale, 0)
    words = [FIELD_WORDS[f][i] if f in FIELD_WORDS else f.replace("_", " ") for f in fields]
    return ", ".join(words)


def decision_card_borrower(record: dict) -> dict:
    """What the borrower API sends (ADR-0004/0006): outcome, offer, reason categories. No rule rows, cut-offs,
    gaps, reason codes or bureau data-quality codes; the full card stays behind the Loan Officer role."""
    pol = record.get("policy") or {}
    card = {"application_ref": record.get("application_ref"), "decision": borrower_outcome(record.get("decision")),
            "recorded_outcome": borrower_outcome(record.get("outcome") or record.get("decision")),
            "lifecycle_state": record.get("lifecycle_state"), "record_id": record.get("record_id"),
            "policy_version": pol.get("version"), "policy_synthetic": bool(pol.get("synthetic")),
            "policy_label": BORROWER_LABEL, "evaluated_at": record.get("evaluated_at"),
            "reason_categories": reason_categories(record), "offer": borrower_offer(record),
            "missing_fields": borrower_missing_fields(record)}
    bf = bureau_facts(record)
    if bf:
        card["bureau"] = {k: bf[k] for k in ("outcome_kind", "review_required", "info_requested", "retryable",
                                             "synthetic_report")}
    return card


def borrower_plan_step(step: dict) -> dict:
    """An improvement step without its target, gap or rule id: general guidance only."""
    g = step.get("general_guidance") or ""
    return {"task": g, "general_guidance": g, "guidance_source": step.get("guidance_source"),
            "reason_category": V1_REASON_CATEGORY.get(step.get("rule_id"), "OTHER")}


WHAT_IF_TEXT = {  # Q-03 two-phrase vocabulary, plus the honest third case: the estimate could not be made
    "WOULD_LIKELY_MEET": {"en": "would likely meet", "hi": "शायद पूरी हो जाएँगी", "te": "బహుశా నెరవేరతాయి"},
    "WOULD_NOT_MEET": {"en": "wouldn't meet", "hi": "पूरी नहीं होंगी", "te": "నెరవేరవు"},
    "COULD_NOT_ESTIMATE": {"en": "couldn't be estimated", "hi": "अनुमान नहीं लगाया जा सका", "te": "అంచనా వేయలేకపోయాము"},
}
_SIM_MEETS = ("APPROVED", "ELIGIBILITY_CONDITIONS_MET")
_SIM_NOT_ESTIMABLE = ("ERROR", "MANUAL_REVIEW", "MORE_INFORMATION_REQUIRED", "REVIEW", None, "")


def what_if_result(wi: dict) -> str:
    """WOULD_LIKELY_MEET | WOULD_NOT_MEET | COULD_NOT_ESTIMATE. A simulation ERROR is never "would not meet"."""
    d = wi.get("simulated_decision")
    if d in _SIM_MEETS:
        return "WOULD_LIKELY_MEET"
    if d in _SIM_NOT_ESTIMABLE or wi.get("sim_status") == "error":
        return "COULD_NOT_ESTIMATE"
    return "WOULD_NOT_MEET"


def borrower_what_if(wi: dict, locale: str = "en") -> dict:
    """Q-03 shape: one estimate line, never per-rule results or a simulated decision."""
    res = what_if_result(wi)
    out = {"result": res, "text": WHAT_IF_TEXT[res].get(locale) or WHAT_IF_TEXT[res]["en"], "changes": wi.get("changes"),
           "label": "Estimate only, your application is unchanged", "is_simulation": True,
           "original_record_unchanged": wi.get("original_record_unchanged")}
    if "remaining_this_session" in wi:
        out["remaining_this_session"] = wi["remaining_this_session"]
    return out


def what_if_area(wi: dict) -> str | None:
    """The ONE plain category still not met in a hypothetical, or None."""
    if what_if_result(wi) != "WOULD_NOT_MEET":
        return None
    cats = list(wi.get("reason_categories") or [])
    if not cats:
        for rid, res in (wi.get("rule_results") or {}).items():
            if res == "FAIL":
                cats.append(V1_REASON_CATEGORY.get(rid, "OTHER"))
    return cats[0] if cats else None


# ------------------------------------------------------------------ one plain reason (agent eval fix 2)
# The borrower hears ONE reason, as a plain category, never a rule name: v2 rule names reveal hidden flags
# ("Settlement or write-off in 24 months", "Negative list match") and v1 names invite listing several checks.
REASON_PLAIN = {
    "EMPLOYMENT_STABILITY": {"en": "your employment history didn't meet our stability requirement",
                             "hi": "आपकी नौकरी की स्थिरता हमारी ज़रूरत पूरी नहीं करती",
                             "te": "మీ ఉద్యోగ స్థిరత్వం మా అవసరాన్ని తీర్చలేదు"},
    "INCOME_NOT_VERIFIED_OR_INSUFFICIENT": {"en": "your income didn't meet our requirement for this amount",
                                            "hi": "इस राशि के लिए आपकी आय हमारी ज़रूरत पूरी नहीं करती",
                                            "te": "ఈ మొత్తానికి మీ ఆదాయం మా అవసరాన్ని తీర్చలేదు"},
    "REPAYMENTS_TOO_HIGH": {"en": "your existing EMIs are high for this loan amount",
                            "hi": "इस लोन राशि के लिए आपकी मौजूदा EMI ज़्यादा हैं",
                            "te": "ఈ లోన్ మొత్తానికి మీ ప్రస్తుత EMIలు ఎక్కువగా ఉన్నాయి"},
    "CREDIT_HISTORY": {"en": "your credit history didn't meet our requirement",
                       "hi": "आपका क्रेडिट इतिहास हमारी ज़रूरत पूरी नहीं करता",
                       "te": "మీ క్రెడిట్ చరిత్ర మా అవసరాన్ని తీర్చలేదు"},
    "RECENT_CREDIT_APPLICATIONS": {"en": "you have applied for credit several times recently",
                                   "hi": "आपने हाल में कई बार लोन या कार्ड के लिए आवेदन किया है",
                                   "te": "మీరు ఇటీవల చాలాసార్లు లోన్ లేదా కార్డుల కోసం దరఖాస్తు చేశారు"},
    "DETAILS_NOT_VERIFIED": {"en": "we couldn't verify some details",
                             "hi": "हम कुछ जानकारी की पुष्टि नहीं कर सके",
                             "te": "కొన్ని వివరాలను మేము నిర్ధారించలేకపోయాము"},
    "DOCUMENTS_INCOMPLETE_OR_UNCLEAR": {"en": "some documents were incomplete or unclear",
                                        "hi": "कुछ दस्तावेज़ अधूरे या साफ़ नहीं थे",
                                        "te": "కొన్ని పత్రాలు అసంపూర్తిగా లేదా స్పష్టంగా లేవు"},
    "REQUEST_OUTSIDE_OFFER": {"en": "the amount or loan period you asked for is more than we can offer",
                              "hi": "आपकी माँगी गई राशि या अवधि हमारी पेशकश से ज़्यादा है",
                              "te": "మీరు అడిగిన మొత్తం లేదా వ్యవధి మేము ఇవ్వగలిగే దానికంటే ఎక్కువ"},
    "OTHER": {"en": "part of your application didn't meet our requirements",
              "hi": "आपके आवेदन का एक हिस्सा हमारी ज़रूरतें पूरी नहीं करता",
              "te": "మీ దరఖాస్తులోని ఒక భాగం మా అవసరాలను తీర్చలేదు"},
}
GUIDANCE_BY_CATEGORY = {  # general financial guidance, not lender policy; never a target or a number
    "EMPLOYMENT_STABILITY": {"en": "Staying steadily in your job helps; keep your offer letter and recent salary slips ready.",
                             "hi": "नौकरी में लगातार बने रहना मदद करता है; ऑफ़र लेटर और हाल की सैलरी स्लिप तैयार रखें।",
                             "te": "ఉద్యోగంలో స్థిరంగా కొనసాగడం సహాయపడుతుంది; ఆఫర్ లెటర్, ఇటీవలి జీతం స్లిప్‌లు సిద్ధంగా ఉంచండి."},
    "INCOME_NOT_VERIFIED_OR_INSUFFICIENT": {"en": "Make sure all your regular income is documented, such as salary slips and bank statements.",
                                            "hi": "अपनी हर नियमित आय के कागज़ तैयार रखें, जैसे सैलरी स्लिप और बैंक स्टेटमेंट।",
                                            "te": "మీ నెలవారీ ఆదాయం అంతటికీ పత్రాలు ఉంచండి, ఉదా. జీతం స్లిప్‌లు, బ్యాంక్ స్టేట్‌మెంట్లు."},
    "REPAYMENTS_TOO_HIGH": {"en": "Paying off a small loan or card balance lowers what goes to EMIs each month; avoid new EMIs before reapplying.",
                            "hi": "कोई छोटा लोन या कार्ड बकाया चुकाने से हर महीने की EMI घटती है; दोबारा आवेदन से पहले नई EMI न लें।",
                            "te": "చిన్న లోన్ లేదా కార్డ్ బాకీ తీర్చితే నెలవారీ EMI తగ్గుతుంది; మళ్లీ దరఖాస్తు చేసే ముందు కొత్త EMIలు తీసుకోకండి."},
    "CREDIT_HISTORY": {"en": "Paying every EMI and card bill on time helps; you can also check your credit report for mistakes.",
                       "hi": "हर EMI और कार्ड बिल समय पर चुकाना मदद करता है; अपनी क्रेडिट रिपोर्ट में गलतियाँ भी जाँच सकते हैं।",
                       "te": "ప్రతి EMI, కార్డ్ బిల్లు సమయానికి కట్టడం సహాయపడుతుంది; మీ క్రెడిట్ రిపోర్ట్‌లో తప్పులు ఉన్నాయో చూడవచ్చు."},
    "RECENT_CREDIT_APPLICATIONS": {"en": "Giving it some time before applying for more credit helps.",
                                   "hi": "और लोन या कार्ड के लिए आवेदन करने से पहले कुछ समय रुकना मदद करता है।",
                                   "te": "మరో లోన్ లేదా కార్డ్ కోసం దరఖాస్తు చేసే ముందు కొంత సమయం ఆగడం సహాయపడుతుంది."},
    "DETAILS_NOT_VERIFIED": {"en": "A person can review your details; keep your documents ready.",
                             "hi": "एक व्यक्ति आपकी जानकारी देख सकता है; अपने दस्तावेज़ तैयार रखें।",
                             "te": "ఒక వ్యక్తి మీ వివరాలను పరిశీలించగలరు; మీ పత్రాలు సిద్ధంగా ఉంచండి."},
    "DOCUMENTS_INCOMPLETE_OR_UNCLEAR": {"en": "Clear, complete documents help the check go through.",
                                        "hi": "साफ़ और पूरे दस्तावेज़ जाँच में मदद करते हैं।",
                                        "te": "స్పష్టమైన, పూర్తి పత్రాలు తనిఖీకి సహాయపడతాయి."},
    "REQUEST_OUTSIDE_OFFER": {"en": "A smaller amount or a different loan period may fit better.",
                              "hi": "कम राशि या अलग अवधि बेहतर हो सकती है।",
                              "te": "తక్కువ మొత్తం లేదా వేరే వ్యవధి సరిపోవచ్చు."},
    "OTHER": {"en": "A person can review your application and explain what would help.",
              "hi": "एक व्यक्ति आपका आवेदन देखकर बता सकता है कि क्या मदद करेगा।",
              "te": "ఒక వ్యక్తి మీ దరఖాస్తును చూసి ఏది సహాయపడుతుందో చెప్పగలరు."},
}


def _loc(table: dict, key: str, locale: str) -> str:
    row = table.get(key) or table["OTHER"]
    return row.get(locale) or row["en"]


def main_reason(record: dict, locale: str = "en") -> dict | None:
    """The single borrower-safe reason: the first stored catalogue-v2 category, else the first failed v1 rule's
    category. None when nothing failed (approved, or a full offer)."""
    cats = reason_categories(record or {})
    if not cats:
        return None
    key = cats[0]["key"]
    return {"key": key, "plain": _loc(REASON_PLAIN, key, locale)}


def reason_plain(key: str, locale: str = "en") -> str:
    return _loc(REASON_PLAIN, key, locale)


def guidance_for(record: dict, locale: str = "en", limit: int = 2) -> list[dict]:
    """General guidance (never a target or gap) for the record's reason categories, at most `limit` items."""
    out = []
    for c in reason_categories(record or {})[:limit]:
        out.append({"reason": _loc(REASON_PLAIN, c["key"], locale), "general_guidance": _loc(GUIDANCE_BY_CATEGORY, c["key"], locale),
                    "guidance_source": "general financial guidance, not lender policy", "reason_category": c["key"]})
    return out


def own_score(record: dict | None) -> float | None:
    vals = ((record or {}).get("inputs") or {}).get("values") or {}
    v = vals.get("credit_score", vals.get("bureau_score"))
    return float(v) if isinstance(v, (int, float)) and not isinstance(v, bool) else None


def _display_vs(rule_id, actual, threshold):
    """Display actual and threshold with enough precision that a FAIL never looks equal (45.04% vs 45%)."""
    a, t = _display(rule_id, actual), _display(rule_id, threshold)
    if rule_id == "FOIR_MAX_45" and actual is not None and a == t and float(actual) != float(threshold):
        a = pct(actual, 2)
    return a, t


def reason_facts(record: dict) -> list[dict]:
    """One fact per FAILED rule, in policy order. Passed rules are never reasons."""
    out = []
    for e in record.get("rule_evaluations", []):
        if e["result"] != "FAIL":
            continue
        rp = RULE_PLAIN.get(e["rule_id"], {})
        yours, req = _display_vs(e["rule_id"], e["actual_value"], e["threshold"])
        out.append({"rule_id": e["rule_id"], "reason_code": e["reason_code"], "name": rp.get("name", e["rule_name"]),
                    "what_it_measures_simple": rp.get("low"), "what_it_measures_technical": rp.get("high"),
                    "your_value": yours,
                    "required": ("at least " if e["operator"] == ">=" else "at most ") + req,
                    "threshold_is_synthetic": True})
    return out


def passed_facts(record: dict) -> list[dict]:
    return [{"rule_id": e["rule_id"], "name": RULE_PLAIN.get(e["rule_id"], {}).get("name", e["rule_name"]),
             "your_value": _display(e["rule_id"], e["actual_value"])}
            for e in record.get("rule_evaluations", []) if e["result"] == "PASS"]


def counterfactual_targets(record: dict) -> list[dict]:
    """Smallest single-field change that makes each FAILED rule pass under the pinned thresholds."""
    vals = (record.get("inputs") or {}).get("values") or {}
    by = {e["rule_id"]: e for e in record.get("rule_evaluations", [])}
    out = []
    for rid, e in by.items():
        if e["result"] != "FAIL":
            continue
        thr = e["threshold"]
        if rid == "MIN_MONTHLY_INCOME":
            tgt = float(thr); gap = tgt - float(vals["monthly_income"])
            out.append({"rule_id": rid, "field": "monthly_income", "target": tgt, "gap": gap,
                        "target_display": inr(tgt), "gap_display": inr(gap),
                        "task": f"Show documented monthly income of at least {inr(tgt)} (about {inr(gap)} more than now)."})
        elif rid == "FOIR_MAX_45":
            inc, obl = float(vals["monthly_income"]), float(vals["monthly_obligations"])
            at_most = math.floor(thr * inc)
            reduce_by = obl - at_most
            income_needed = math.ceil(obl / thr)
            out.append({"rule_id": rid, "field": "monthly_obligations", "target": at_most, "gap": reduce_by,
                        "target_display": inr(at_most), "gap_display": inr(reduce_by),
                        "alt": {"field": "monthly_income", "target": income_needed, "target_display": inr(income_needed)},
                        "task": f"Bring your total monthly EMIs/fixed payments down to {inr(at_most)} or less "
                                f"(cut about {inr(reduce_by)} a month), or show income of at least {inr(income_needed)} with the same EMIs."})
        elif rid == "MIN_CREDIT_SCORE":
            tgt = int(thr); gap = tgt - int(vals["credit_score"])
            out.append({"rule_id": rid, "field": "credit_score", "target": tgt, "gap": gap,
                        "target_display": str(tgt), "gap_display": f"{gap} points",
                        "task": f"Raise your credit score from {int(vals['credit_score'])} to at least {tgt} ({gap} points)."})
        elif rid == "MIN_EMPLOYMENT_TENURE":
            tgt = int(thr); gap = tgt - int(vals["employment_months"])
            out.append({"rule_id": rid, "field": "employment_months", "target": tgt, "gap": gap,
                        "target_display": f"{tgt} months", "gap_display": f"{gap} months",
                        "task": f"Complete {tgt} months in continuous employment ({gap} more months from your recorded {int(vals['employment_months'])})."})
    for t in out:
        t["general_guidance"] = GENERAL_TASKS[t["rule_id"]]
        t["guidance_source"] = "general financial guidance, not lender policy"
        t["threshold_is_synthetic"] = True
    return out


def grounded_numbers(record: dict | None, extra: list | None = None, include_limits: bool = False) -> set[str]:
    """Every number the agent may state about this application (normalised strings).

    Q-08: thresholds, improvement targets and gaps are NOT grounded for the borrower by default (they are cut-offs);
    `include_limits=True` keeps the old behaviour for officer/internal use."""
    nums: set[str] = set()

    def add(v):
        if v is None:
            return
        try:
            f = float(v)
        except (TypeError, ValueError):
            return
        for form in (f, round(f), round(f, 1), round(f, 2)):
            nums.add(_norm(form))
        if 0 < f < 1.5:  # ratios also appear as percentages
            for form in (f * 100, round(f * 100), round(f * 100, 1), round(f * 100, 2)):
                nums.add(_norm(form))

    if record:
        for v in ((record.get("inputs") or {}).get("values") or {}).values():
            add(v)
        for e in record.get("rule_evaluations", []):
            add(e.get("actual_value"))
            if include_limits:
                add(e.get("threshold"))
        o = record.get("offer") or {}
        for k in ("amount", "emi", "tenure_months"):
            add(o.get(k))
        if include_limits:
            for t in counterfactual_targets(record):
                add(t["target"]); add(t["gap"])
                if t.get("alt"):
                    add(t["alt"]["target"])
    for v in extra or []:
        add(v)
    for v in ("300", "900", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"):
        nums.add(v)
    return nums


def _norm(f) -> str:
    f = float(f)
    return str(int(f)) if f.is_integer() else f"{f:.2f}".rstrip("0").rstrip(".")
