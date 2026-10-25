"""Deterministic synthetic bureau data.

Only the 120-case fixture is committed. The same generator can produce 1,000
cases on demand; no wall-clock time or unordered data is used.
"""
from __future__ import annotations

import hashlib
import random
from datetime import date, datetime, time, timedelta, timezone

from decision_engine.schemas.bureau import (
    AccountStatus,
    AccountType,
    BureauReport,
    CreditAccount,
    DataQualityIssue,
    DataQualitySummary,
    Enquiry,
    IdentityCheck,
    IssueSeverity,
    IssueSource,
    PaymentStatus,
    Provenance,
    SyntheticScore,
)
from synthetic_bureau.scoring import MIN_HISTORY_MONTHS, score_history

BASE_PLAN = (
    ["VALID_PASS"] * 16
    + ["FAIL_INCOME"] * 8
    + ["FAIL_FOIR"] * 10
    + ["FAIL_SCORE"] * 12
    + ["FAIL_EMPLOYMENT"] * 8
    + ["BOUNDARY"] * 12
    + ["NO_HIT"] * 8
    + ["THIN_HISTORY"] * 6
    + ["STALE_REPORT"] * 6
    + ["IDENTITY_MISMATCH"] * 5
    + ["INCONSISTENT_INCOME_OBLIGATIONS"] * 6
    + ["MISSING_REQUIRED_FIELDS"] * 6
    + ["MULTI_ISSUE"] * 5
    + ["BACKWARD_COMPAT"] * 4
    + ["RATE_LIMIT"] * 2
    + ["UNAVAILABLE"] * 2
    + ["TIMEOUT"] * 2
    + ["MALFORMED_RESPONSE"] * 2
)

PROVIDER_SCENARIOS = {"RATE_LIMIT", "UNAVAILABLE", "TIMEOUT", "MALFORMED_RESPONSE"}


def _rng(seed: int, key: str) -> random.Random:
    digest = hashlib.sha256(f"{seed}:{key}".encode()).digest()[:8]
    return random.Random(int.from_bytes(digest, "big"))


def _months_ago(as_of: date, months: int) -> date:
    total = as_of.year * 12 + (as_of.month - 1) - months
    year, month = divmod(total, 12)
    month += 1
    day = min(as_of.day, 28)
    return date(year, month, day)


def _history(months: int) -> list[PaymentStatus]:
    return [PaymentStatus.ON_TIME] * min(months, 24)


def _balance_for_util_points(points: int, limit: int = 100_000) -> int:
    target = max(0, min(130, points))
    estimate = round(limit * (1 - target / 130))
    for delta in range(-10, 11):
        balance = max(0, min(limit, estimate + delta))
        if round(130 * (1 - balance / limit)) == target:
            return balance
    raise ValueError(f"cannot realize utilization points {points}")


def _revolving(opened: date, months: int, balance: int, *, worst_dpd: int = 0) -> CreditAccount:
    history = _history(months)
    if worst_dpd >= 30 and history:
        history[-1] = PaymentStatus.DPD_30
    return CreditAccount(
        account_id="ACC-CARD",
        account_type=AccountType.CREDIT_CARD,
        status=AccountStatus.ACTIVE,
        opened_on=opened,
        credit_limit=100_000,
        current_balance=balance,
        monthly_obligation=0,
        months_reviewed=months,
        worst_delinquency_days=worst_dpd,
        payment_history=history,
        last_payment_date=opened + timedelta(days=15),
    )


def _installment(
    account_id: str,
    kind: AccountType,
    opened: date,
    months: int,
    original: int,
    balance: int,
    obligation: int,
) -> CreditAccount:
    return CreditAccount(
        account_id=account_id,
        account_type=kind,
        status=AccountStatus.ACTIVE,
        opened_on=opened,
        original_amount=original,
        current_balance=balance,
        monthly_obligation=obligation,
        months_reviewed=months,
        worst_delinquency_days=0,
        payment_history=_history(months),
        last_payment_date=opened + timedelta(days=15),
    )


def pass_history(target: int, as_of: date) -> tuple[list[CreditAccount], list[Enquiry]]:
    """History with no delinquency, three account types, and a tunable score."""
    oldest = 6
    age_points = (oldest * 3) // 2
    util_points = target - (300 + 250 + 60 + 70 + age_points)
    if not 0 <= util_points <= 130:
        raise ValueError(f"target {target} is outside the pass-history range")
    opened = _months_ago(as_of, oldest)
    accounts = [
        _revolving(opened, oldest, _balance_for_util_points(util_points)),
        _installment("ACC-PL", AccountType.PERSONAL_LOAN, opened, oldest, 200_000, 150_000, 5_000),
        _installment("ACC-AUTO", AccountType.AUTO_LOAN, opened, oldest, 300_000, 200_000, 6_000),
    ]
    return accounts, []


def fail_history(target: int, as_of: date) -> tuple[list[CreditAccount], list[Enquiry]]:
    """A weaker but internally consistent history, tuned to a sub-700 score."""
    oldest = 12
    age_points = (oldest * 3) // 2
    util_points = target - (300 + 180 + 30 + 50 + age_points)
    if not 0 <= util_points <= 130:
        raise ValueError(f"target {target} is outside the fail-history range")
    opened = _months_ago(as_of, oldest)
    accounts = [
        _revolving(opened, oldest, _balance_for_util_points(util_points), worst_dpd=30),
        _installment("ACC-PL", AccountType.PERSONAL_LOAN, opened, oldest, 200_000, 150_000, 5_000),
    ]
    enquiries = [
        Enquiry(
            enquiry_id="ENQ-1",
            enquired_on=as_of - timedelta(days=20),
            purpose="PERSONAL_LOAN",
            amount=300_000,
        ),
        Enquiry(
            enquiry_id="ENQ-2",
            enquired_on=as_of - timedelta(days=70),
            purpose="CREDIT_CARD",
            amount=50_000,
        ),
    ]
    return accounts, enquiries


def thin_history(as_of: date) -> tuple[list[CreditAccount], list[Enquiry]]:
    opened = _months_ago(as_of, MIN_HISTORY_MONTHS - 3)
    return [
        _revolving(opened, MIN_HISTORY_MONTHS - 3, 20_000),
    ], []


def _score(accounts: list[CreditAccount], enquiries: list[Enquiry], as_of: date) -> SyntheticScore:
    result = score_history(accounts, enquiries, as_of)
    return SyntheticScore(value=result.value, status=result.status, components=result.components)


def _report_date(as_of: date, scenario: str) -> date:
    if scenario == "STALE_REPORT":
        return as_of - timedelta(days=145)
    return as_of - timedelta(days=10)


def build_report(
    application_id: str,
    applicant_id: str,
    scenario: str,
    *,
    seed: int,
    as_of: date,
    correlation_id: str,
    record_origin: str = "generated_on_demand",
    fixture_id: str | None = None,
    target_score: int = 760,
) -> BureauReport | None:
    """Build one deterministic report, or None for a provider-failure scenario."""
    if scenario in PROVIDER_SCENARIOS:
        return None

    accounts: list[CreditAccount] = []
    enquiries: list[Enquiry] = []
    identity = True
    data_quality = DataQualitySummary(valid=True)
    report_applicant = applicant_id

    if scenario == "NO_HIT":
        pass
    elif scenario == "THIN_HISTORY":
        accounts, enquiries = thin_history(as_of)
    elif scenario in ("STALE_REPORT", "INCONSISTENT_INCOME_OBLIGATIONS"):
        accounts, enquiries = pass_history(target_score, as_of)
    elif scenario == "IDENTITY_MISMATCH":
        accounts, enquiries = pass_history(target_score, as_of)
        identity = False
        report_applicant = f"{applicant_id}-X"
    elif scenario == "INCOMPLETE":
        accounts, enquiries = pass_history(target_score, as_of)
        data_quality = DataQualitySummary(
            valid=False,
            issues=[
                DataQualityIssue(
                    code="DQ_BUREAU_INCOMPLETE_REPORT",
                    message="synthetic report is missing a required segment",
                    field="accounts",
                    source=IssueSource.BUREAU,
                    severity=IssueSeverity.BLOCK,
                )
            ],
        )
    elif scenario == "MULTI_ISSUE":
        identity = False
        report_applicant = f"{applicant_id}-X"
        data_quality = DataQualitySummary(
            valid=False,
            issues=[
                DataQualityIssue(
                    code="DQ_BUREAU_INCOMPLETE_REPORT",
                    message="synthetic report is incomplete",
                    source=IssueSource.BUREAU,
                )
            ],
        )
    elif target_score < 700:
        accounts, enquiries = fail_history(target_score, as_of)
    else:
        accounts, enquiries = pass_history(target_score, as_of)

    score = _score(accounts, enquiries, as_of)
    report_date = _report_date(as_of, scenario)
    generated_at = datetime.combine(as_of, time(0, 0), tzinfo=timezone.utc)
    report_id = "BUR-" + hashlib.sha256(
        f"{seed}:{application_id}:{scenario}".encode()
    ).hexdigest()[:12].upper()

    return BureauReport(
        correlation_id=correlation_id,
        report_id=report_id,
        application_id=application_id,
        applicant_id=report_applicant,
        generated_at=generated_at,
        report_date=report_date,
        identity=IdentityCheck(match=identity, checked_on=as_of),
        score=score,
        accounts=accounts,
        enquiries=enquiries,
        data_quality=data_quality,
        provenance=Provenance(
            seed=seed,
            scenario_id=scenario,
            fixture_id=fixture_id,
            record_origin=record_origin,  # type: ignore[arg-type]
            correlation_id=correlation_id,
        ),
    )


def _base_application(application_id: str, applicant_id: str) -> dict:
    return {
        "application_id": application_id,
        "applicant_id": applicant_id,
        "monthly_income": 60_000,
        "monthly_obligations": 15_000,
        "credit_score": None,
        "credit_score_origin": None,
        "employment_months": 36,
        "loan_amount": 300_000,
        "loan_tenure_months": 36,
    }


def _apply_scenario(application: dict, scenario: str, position: int) -> tuple[str, int]:
    """Set application values and return (report scenario, target score).

    ``position`` is the occurrence of this scenario in the generation plan, so
    boundary and cycle cases do not accidentally depend on the global index.
    """
    if scenario == "FAIL_INCOME":
        application["monthly_income"] = 24_000
        application["monthly_obligations"] = 5_000
        return "SUCCESS", 760
    if scenario == "FAIL_FOIR":
        application["monthly_income"] = 32_000
        application["monthly_obligations"] = 18_500
        application["employment_months"] = 24
        return "SUCCESS", 760
    if scenario == "FAIL_SCORE":
        application["monthly_income"] = 55_000
        application["monthly_obligations"] = 10_000
        application["employment_months"] = 30
        return "SUCCESS", 650
    if scenario == "FAIL_EMPLOYMENT":
        application["monthly_income"] = 50_000
        application["monthly_obligations"] = 12_000
        application["employment_months"] = 5
        return "SUCCESS", 760
    if scenario == "BOUNDARY":
        group, offset = divmod(position, 3)
        if group == 0:
            application["monthly_income"] = [24_999, 25_000, 25_001][offset]
            application["monthly_obligations"] = 10_000
        elif group == 1:
            application["monthly_income"] = 100_000
            application["monthly_obligations"] = [44_990, 45_000, 45_010][offset]
        elif group == 2:
            return "SUCCESS", [699, 700, 701][offset]
        else:
            application["monthly_income"] = 50_000
            application["monthly_obligations"] = 12_000
            application["employment_months"] = [11, 12, 13][offset]
        return "SUCCESS", 760
    if scenario == "NO_HIT":
        return "NO_HIT", 0
    if scenario == "THIN_HISTORY":
        return "THIN_HISTORY", 0
    if scenario == "STALE_REPORT":
        return "STALE_REPORT", 760
    if scenario == "IDENTITY_MISMATCH":
        return "IDENTITY_MISMATCH", 760
    if scenario == "INCONSISTENT_INCOME_OBLIGATIONS":
        application["monthly_obligations"] = 15_000
        return "INCONSISTENT_INCOME_OBLIGATIONS", 760
    if scenario == "MISSING_REQUIRED_FIELDS":
        field = ["monthly_income", "monthly_obligations", "employment_months", "loan_amount", "loan_tenure_months"][position % 5]
        application[field] = None
        return "SUCCESS", 760
    if scenario == "MULTI_ISSUE":
        if position % 3 == 0:
            application["credit_score"] = 650
            application["credit_score_origin"] = "APPLICATION"
            return "IDENTITY_MISMATCH", 760
        return "MULTI_ISSUE", 0
    if scenario == "BACKWARD_COMPAT":
        rows = [
            (60_000, 15_000, 780, 36, 300_000, 36),
            (32_000, 18_500, 760, 24, 300_000, 36),
            (32_000, 18_500, 690, 8, 300_000, 36),
            (25_000, 11_250, 700, 12, 200_000, 24),
        ]
        income, obligations, score, employment, amount, tenure = rows[position % 4]
        application.update(
            monthly_income=income,
            monthly_obligations=obligations,
            credit_score=score,
            credit_score_origin="APPLICATION",
            employment_months=employment,
            loan_amount=amount,
            loan_tenure_months=tenure,
        )
        return "SUCCESS", score
    if scenario == "VALID_PASS" and position % 7 == 0:
        application["credit_score"] = 650
        application["credit_score_origin"] = "SYNTHETIC_PLACEHOLDER"
        return "SUCCESS", 760
    if scenario in PROVIDER_SCENARIOS:
        return scenario, 0
    return "SUCCESS", 760


def generate_case(
    index: int,
    *,
    seed: int,
    as_of: date,
    record_origin: str = "golden_fixture",
) -> dict:
    case_no = index + 1
    scenario = BASE_PLAN[index % len(BASE_PLAN)]
    scenario_position = sum(1 for s in BASE_PLAN[: index % len(BASE_PLAN)] if s == scenario)
    application_id = f"SYN-BUR-{case_no:06d}"
    applicant_id = f"SYN-CUS-{case_no:06d}"
    application = _base_application(application_id, applicant_id)
    report_scenario, target_score = _apply_scenario(application, scenario, scenario_position)
    case_id = f"BUR-{case_no:06d}"
    report = build_report(
        application_id,
        applicant_id,
        report_scenario,
        seed=seed,
        as_of=as_of,
        correlation_id=f"FIXTURE-{case_id}",
        record_origin=record_origin,
        fixture_id=case_id,
        target_score=target_score or 760,
    )
    return {
        "case_id": case_id,
        "scenario": scenario,
        "application": application,
        # No scenario: a fixture request replays through the golden-fixture lookup
        # and returns this exact report (or provider error). On-demand generation
        # would lose the case's tuned score, so the scenario lives in `scenario` above.
        "request": {
            "application_id": application_id,
            "applicant_id": applicant_id,
            "scenario": None,
        },
        "report": report.model_dump(mode="json") if report else None,
        "provenance": {
            "synthetic": True,
            "origin": record_origin,
            "source_system": "synthetic-bureau-fastapi",
            "generation_version": "bureau-cases-v1",
            "seed": seed,
            "scenario_id": scenario,
            "fixture_id": case_id,
        },
    }


def build_cases(
    count: int,
    *,
    seed: int,
    as_of: date,
    record_origin: str = "golden_fixture",
) -> list[dict]:
    if count < 1:
        raise ValueError("count must be >= 1")
    return [
        generate_case(i, seed=seed, as_of=as_of, record_origin=record_origin)
        for i in range(count)
    ]
