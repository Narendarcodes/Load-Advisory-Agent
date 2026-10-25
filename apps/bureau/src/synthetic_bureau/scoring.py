"""History-driven synthetic score.

This is an explicit heuristic for demo data. It is NOT a CIBIL/FICO formula,
has no predictive validation, and must never be used for a real decision.
"""
from dataclasses import dataclass
from datetime import date, timedelta

from decision_engine.schemas.bureau import (
    AccountStatus,
    AccountType,
    CreditAccount,
    Enquiry,
    ScoreStatus,
    SyntheticScore,
)

MIN_HISTORY_MONTHS = 6
ENQUIRY_LOOKBACK_DAYS = 183


@dataclass(frozen=True)
class ScoreResult:
    status: ScoreStatus
    value: int | None
    components: dict[str, int]


def months_between(start: date, end: date) -> int:
    """Whole calendar months, never negative."""
    months = (end.year - start.year) * 12 + (end.month - start.month)
    if end.day < start.day:
        months -= 1
    return max(0, months)


def _payment_points(accounts: list[CreditAccount]) -> int:
    worst = max((a.worst_delinquency_days for a in accounts), default=0)
    if worst >= 90:
        return 0
    if worst >= 60:
        return 100
    if worst >= 30:
        return 180
    return 250


def _utilization_points(accounts: list[CreditAccount]) -> int:
    revolving = [
        a for a in accounts
        if a.account_type in (AccountType.CREDIT_CARD, AccountType.OVERDRAFT)
        and a.credit_limit
    ]
    if not revolving:
        return 65  # neutral when there is no revolving history
    limit = sum(a.credit_limit or 0 for a in revolving)
    balance = sum(a.current_balance for a in revolving)
    utilization = min(1.0, balance / limit) if limit else 1.0
    return max(0, min(130, round(130 * (1 - utilization))))


def _age_points(accounts: list[CreditAccount], as_of: date) -> int:
    oldest = max((months_between(a.opened_on, as_of) for a in accounts), default=0)
    return min(90, (oldest * 3) // 2)


def _mix_points(accounts: list[CreditAccount]) -> int:
    types = len({a.account_type for a in accounts})
    if types <= 1:
        return 0
    return 30 if types == 2 else 60


def _enquiry_points(enquiries: list[Enquiry], as_of: date) -> int:
    cutoff = as_of - timedelta(days=ENQUIRY_LOOKBACK_DAYS)
    count = sum(1 for e in enquiries if cutoff <= e.enquired_on <= as_of)
    return max(0, 70 - 10 * count)


def _adverse_points(accounts: list[CreditAccount]) -> int:
    if any(a.status in (AccountStatus.DEFAULT, AccountStatus.WRITTEN_OFF) for a in accounts):
        return -180
    if any(a.status == AccountStatus.SETTLED for a in accounts):
        return -90
    return 0


def score_history(
    accounts: list[CreditAccount], enquiries: list[Enquiry], as_of: date
) -> ScoreResult:
    """Return an available score, or a null score when history is insufficient."""
    if not accounts:
        return ScoreResult(ScoreStatus.NO_HIT, None, {})
    reviewed = sum(a.months_reviewed for a in accounts)
    if reviewed < MIN_HISTORY_MONTHS:
        return ScoreResult(
            ScoreStatus.INSUFFICIENT_HISTORY,
            None,
            {"months_reviewed": reviewed},
        )

    components = {
        "repayment": _payment_points(accounts),
        "utilization": _utilization_points(accounts),
        "age": _age_points(accounts, as_of),
        "mix": _mix_points(accounts),
        "enquiries": _enquiry_points(enquiries, as_of),
        "adverse": _adverse_points(accounts),
    }
    value = 300 + sum(components.values())
    value = max(300, min(900, value))
    return ScoreResult(ScoreStatus.AVAILABLE, value, components)


def to_contract(result: ScoreResult) -> SyntheticScore:
    return SyntheticScore(
        value=result.value,
        status=result.status,
        components=result.components,
    )
