"""What-if sandbox contract (ADR-0005, ADR-0007 #4). DESIGN ONLY; the agent owns the runtime.

A what-if re-sizes a hypothetical request in memory. It never writes, never approves and never
shows a threshold, a gap or a rule. The borrower can change four things only; the credit score
and months with the employer are never editable (cut-off probing). The answer is one of two
phrases, and every answer carries the "Estimate only" label.
"""
from contracts.catalogue_v2 import products as PR

# Editable field -> (data dictionary name, current ZenInput data point, LMS doc field, plain label)
EDITABLE_FIELDS = {
    "loan_amount": {"dictionary_field": "requested_amount", "zen_data_point": "loan_amount", "label": "loan amount",
                    "range": [PR.BAJAJ_MIN_AMOUNT, PR.MVP_AMOUNT_CEILING]},
    "tenure_months": {"dictionary_field": "tenure_months", "zen_data_point": "tenure_months", "label": "repayment period",
                      "range": [12, PR.PROTOTYPE_TENURE_CEILING]},
    "existing_emis": {"dictionary_field": "existing_monthly_obligations", "zen_data_point": "existing_emi_total",
                      "label": "existing monthly repayments", "range": [0, 10_000_000]},
    "monthly_income": {"dictionary_field": "monthly_net_income", "zen_data_point": "net_monthly_income", "label": "monthly income",
                       "range": [1, 10_000_000]},
}
# Never editable, named so a test and the agent can refuse them explicitly.
FORBIDDEN_FIELDS = ["credit_score", "bureau_score", "employment_months", "employment_start_date", "risk_grade",
                    "employment_category", "loan_purpose"]
RESULTS = {"WOULD_LIKELY_MEET": "would likely meet", "WOULD_NOT_MEET": "wouldn't meet"}
UI_LABEL = "Estimate only, your application is unchanged"
PER_SESSION_CAP = 3  # owner decision ADR-0010 #1 (2026-11-03 23:58 IST)
# Words a what-if answer must never contain (approval language, thresholds, internals).
FORBIDDEN_WORDS = ("approved", "approve", "sanction", "offer", "guarantee", "eligible amount", "threshold", "cut-off", "cutoff",
                   "minimum", "maximum", "limit", "foir", "score", "rule", "gap", "target", "pl-")

CONTRACT = {
    "status": "DRAFT - design only; the agent owner implements it",
    "decisions": ["ADR-0005 (2026-11-03 22:58 IST)", "ADR-0007 #4 (2026-11-03 23:18 IST)", "ADR-0010 #1 (2026-11-03 23:58 IST)"],
    "editable_fields": EDITABLE_FIELDS,
    "forbidden_fields": FORBIDDEN_FIELDS,
    "result_vocabulary": RESULTS,
    "result_shape": {"result": "WOULD_LIKELY_MEET | WOULD_NOT_MEET", "text": "would likely meet | wouldn't meet",
                     "hypothetical_amount": "the loan amount the borrower typed (echo only)", "label": UI_LABEL,
                     "remaining_this_session": "int"},
    "never_returned": ["rule_id", "threshold", "gap", "target", "binding cap", "offered amount", "decision", "rule results"],
    "per_session_cap": {"value": PER_SESSION_CAP, "approval_status": "OWNER_APPROVED",
                        "note": "ADR-0010 #1: three what-ifs per session.", "config_key": "SARAL_WHAT_IF_SESSION_CAP"},
    "side_effects": {"in_memory_only": True, "writes": "none", "record_hash_unchanged": True,
                     "ingest_refuses_is_simulation": True},
    "evaluation": "WOULD_LIKELY_MEET when PL-129 sizing of the hypothetical request returns APPROVED in full at the asked tenure; "
                  "otherwise WOULD_NOT_MEET. Request-independent gates keep their recorded result.",
    "forbidden_words_in_answer": list(FORBIDDEN_WORDS),
}


class WhatIfRefused(ValueError):
    pass


def evaluate(base, changes, used_this_session):
    """Reference what-if. ``base`` holds the PL-129 inputs of the recorded application (never mutated)."""
    if used_this_session >= PER_SESSION_CAP:
        raise WhatIfRefused("what-if limit for this session reached")
    if not changes:
        raise WhatIfRefused("no change given")
    bad = sorted(set(changes) - set(EDITABLE_FIELDS))
    if bad:
        raise WhatIfRefused(f"not editable in a what-if: {', '.join(bad)}")
    hypo = dict(base)
    for k, v in changes.items():
        lo, hi = EDITABLE_FIELDS[k]["range"]
        if not isinstance(v, (int, float)) or not lo <= v <= hi:
            raise WhatIfRefused(f"{EDITABLE_FIELDS[k]['label']} is out of range")
        hypo[{"loan_amount": "requested_amount", "tenure_months": "tenure_months", "existing_emis": "existing_monthly_obligations",
              "monthly_income": "monthly_net_income"}[k]] = v
    res = PR.size_offer_flat(**hypo)
    key = "WOULD_LIKELY_MEET" if res["offer_outcome"] == "APPROVED" else "WOULD_NOT_MEET"
    return {"result": key, "text": RESULTS[key], "hypothetical_amount": hypo["requested_amount"], "label": UI_LABEL,
            "remaining_this_session": PER_SESSION_CAP - used_this_session - 1}
