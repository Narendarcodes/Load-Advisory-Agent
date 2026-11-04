"""Rule-based explanation-tone classifier over a synthetic bureau record.

Input: one synthetic bureau record in the provider contract ``bureau-report/1``
(decision_engine/schemas/bureau.py; path list in contracts/synthetic_sources.json,
``sources.SYNTHETIC_BUREAU``). The classifier reads only these paths:

  accounts[].account_type, accounts[].months_reviewed

Borrowing experience alone picks the tone. The score, repayment history, income,
gender, marital status and family details are never inputs, so the tone cannot track
credit quality or a protected attribute.

Output: ONLY ``segment`` (one of Guided, Simple, Standard, Detailed) and
``how_to_explain`` (the plain-language tone lines). The tone changes how the agent
explains, never the decision or which facts are shown.

The experience cut points below are internal to this module and are never shown to
the borrower or put in a prompt.
"""
from __future__ import annotations

from typing import Any

from .guidance import GUIDANCE

BUREAU_SCHEMA = "bureau-report/1"
_REVOLVING = frozenset({"CREDIT_CARD", "OVERDRAFT"})


def _accounts(report: dict[str, Any]) -> list[dict[str, Any]]:
    accounts = report.get("accounts") or []
    return [a for a in accounts if isinstance(a, dict)]


def derive_features(report: dict[str, Any]) -> dict[str, Any]:
    """Borrowing-experience features from a ``bureau-report/1`` record (no PII, no score)."""
    accounts = _accounts(report)
    kinds = [str(a.get("account_type") or "").upper() for a in accounts]
    loans = [k for k in kinds if k and k not in _REVOLVING]
    months = [a.get("months_reviewed") for a in accounts]
    history = max((int(m) for m in months if isinstance(m, int) and not isinstance(m, bool) and m >= 0), default=0)
    return {
        "loan_count": len(loans),
        "distinct_loan_types": len(set(loans)),
        "revolving_accounts": sum(1 for k in kinds if k in _REVOLVING),
        "credit_history_months": history,
        "has_credit_history": bool(accounts),
    }


def _segment(features: dict[str, Any]) -> str:
    loans, types, history = features["loan_count"], features["distinct_loan_types"], features["credit_history_months"]
    if not features["has_credit_history"] or loans == 0:
        return "Guided"
    if loans > 10 or (loans >= 4 and types >= 2 and history >= 36):
        return "Detailed"
    if loans <= 3 and types <= 2:
        return "Simple"
    return "Standard"


def classify_bureau_report(report: dict[str, Any]) -> dict[str, Any]:
    """Pick the explanation tone. Returns ONLY ``segment`` and ``how_to_explain``."""
    segment = _segment(derive_features(report))
    return {"segment": segment, "how_to_explain": list(GUIDANCE[segment])}
