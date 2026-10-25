"""Deterministic facts the LLM is allowed to phrase — built ONLY from a Decision Evidence record.

Nothing here decides anything: reasons are the record's FAIL rule evaluations, thresholds are the
pinned (SYNTHETIC) policy's own values, and improvement targets are plain arithmetic on those
thresholds, re-checked through the unchanged ZEN path by tools.run_what_if.
"""
import math

SYNTHETIC_LABEL = ("synthetic prototype policy (synthetic-v1) — the four thresholds are team assumptions, "
                   "not any real lender's policy")
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


def decision_card(record: dict) -> dict:
    """UI/voice decision card: recorded outcome + per-rule table. Pure projection of the record."""
    pol = record.get("policy") or {}
    rules = []
    for e in record.get("rule_evaluations", []):
        actual_disp, _ = _display_vs(e["rule_id"], e.get("actual_value"), e["threshold"])
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


def grounded_numbers(record: dict | None, extra: list | None = None) -> set[str]:
    """Every number the agent may state about this application (normalised strings)."""
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
            add(e.get("actual_value")); add(e.get("threshold"))
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
