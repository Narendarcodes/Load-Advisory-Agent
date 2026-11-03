"""Link applicants to the synthetic bureau, read-only.

Reports are produced by calling ``synthetic_bureau.generator.build_report`` (Qoder-owned,
imported, never modified). Scenarios the bureau generator cannot express (60/90 DPD,
write-off, settlement, enquiry burst, stacking, duplicate tradelines, aged history) take
the native report and apply a documented overlay here, then re-score it with
``synthetic_bureau.scoring.score_history`` and re-validate it against ``BureauReport``.
Every overlay report carries ``provenance.scenario_id = "SARAL-OVERLAY:<kind>"`` and a
``BUR-OVL-`` report id, so it can never be mistaken for native generator output.

The bureau-report/1 schema has no name, DOB or address fields, so the bureau's view of
the applicant's identity is emitted beside the report as ``identity_on_file`` (a sidecar
in this dataset, not part of the bureau contract).
"""
from __future__ import annotations

import hashlib
import sys
from datetime import date, timedelta
from pathlib import Path

_REPO = Path(__file__).resolve().parents[2]
for _p in (_REPO, _REPO / "apps" / "bureau" / "src"):
    if str(_p) not in sys.path:
        sys.path.insert(0, str(_p))

from decision_engine.schemas.bureau import (  # noqa: E402
    AccountStatus,
    AccountType,
    BureauReport,
    BureauReportRequest,
    CreditAccount,
    Enquiry,
    PaymentStatus,
    SyntheticScore,
)
from synthetic_bureau.generator import _months_ago, build_report  # noqa: E402
from synthetic_bureau.scoring import score_history  # noqa: E402
from synthetic_bureau.settings import DEFAULT_AS_OF, DEFAULT_SEED  # noqa: E402

BUREAU_AS_OF: date = DEFAULT_AS_OF
BUREAU_SEED: int = DEFAULT_SEED
INSTALLMENT_TYPES = {"PERSONAL_LOAN", "AUTO_LOAN", "HOME_LOAN"}


def request_for(application_id: str, applicant_id: str) -> dict:
    """A request that passes the bureau's own BureauReportRequest validation."""
    req = BureauReportRequest(application_id=application_id, applicant_id=applicant_id, scenario=None)
    return req.model_dump(mode="json")


def _acc(a: CreditAccount, **update) -> CreditAccount:
    data = a.model_dump()
    data.update(update)
    return CreditAccount(**data)


def _aged(accounts: list[CreditAccount], months: int, as_of: date) -> list[CreditAccount]:
    opened = _months_ago(as_of, months)
    out = []
    for a in accounts:
        reviewed = min(months, 120)
        # payment_history is oldest-first; older on-time months are prepended.
        hist = ([PaymentStatus.ON_TIME] * 24 + list(a.payment_history))[-min(24, reviewed):]
        out.append(_acc(a, opened_on=opened, months_reviewed=reviewed,
                        payment_history=hist,
                        last_payment_date=as_of - timedelta(days=20)))
    return out


def _with_dpd(a: CreditAccount, status: PaymentStatus, days: int, months_back: int) -> CreditAccount:
    hist = list(a.payment_history)
    # payment_history is oldest-first (bureau generator marks the latest month with [-1]).
    hist[-months_back] = status
    return _acc(a, payment_history=hist, worst_delinquency_days=days)


def _closed_loan(kind: str, as_of: date, status: AccountStatus, closed_months: int) -> CreditAccount:
    opened = _months_ago(as_of, 40)
    closed = _months_ago(as_of, closed_months)
    return CreditAccount(
        account_id=f"ACC-PL-OLD-{kind}", account_type=AccountType.PERSONAL_LOAN, status=status,
        opened_on=opened, closed_on=closed, original_amount=150_000,
        current_balance=0 if status == AccountStatus.SETTLED else 62_000,
        monthly_obligation=0, months_reviewed=24, worst_delinquency_days=120,
        payment_history=[PaymentStatus.ON_TIME] * 14 + [PaymentStatus.DPD_30, PaymentStatus.DPD_60]
        + [PaymentStatus.DPD_90_PLUS] * 8,
        last_payment_date=closed,
    )


def _apply(kind: str, accounts: list, enquiries: list, as_of: date) -> tuple[list, list, str]:
    if kind == "DROP_AUTO":
        accounts = [a for a in accounts if a.account_type != AccountType.AUTO_LOAN]
        return accounts, enquiries, "DROP_AUTO: auto loan removed"
    if kind == "DUPLICATE_TRADELINE":
        pl = next(a for a in accounts if a.account_type == AccountType.PERSONAL_LOAN)
        accounts.append(_acc(pl, account_id="ACC-PL-DUP"))
        return accounts, enquiries, "DUPLICATE_TRADELINE: ACC-PL reported twice as ACC-PL-DUP"
    if kind == "STACKING":
        for i, (m, amt, emi) in enumerate(((1, 150_000, 5_600), (2, 120_000, 4_500), (4, 100_000, 3_800))):
            opened = _months_ago(as_of, m)
            accounts.append(CreditAccount(
                account_id=f"ACC-PL-NEW{i + 1}", account_type=AccountType.PERSONAL_LOAN,
                status=AccountStatus.ACTIVE, opened_on=opened, original_amount=amt,
                current_balance=amt - emi * (m - 1) // 2, monthly_obligation=emi, months_reviewed=m,
                payment_history=[PaymentStatus.ON_TIME] * m, last_payment_date=opened + timedelta(days=10)))
        return accounts, enquiries, "STACKING: 3 personal loans opened 1, 2 and 4 months ago"
    if kind == "DPD_30":
        accounts = [_with_dpd(a, PaymentStatus.DPD_30, 30, 4) if a.account_type == AccountType.CREDIT_CARD
                    else a for a in accounts]
        return accounts, enquiries, ("DPD_30: card payment 4 months ago at DPD_30 on a passing history (the native "
                                     "30-DPD history scores below the 700 ZEN floor, ADR-0009 #2)")
    if kind == "DPD_60":
        accounts = [_with_dpd(a, PaymentStatus.DPD_60, 60, 5) if a.account_type == AccountType.PERSONAL_LOAN
                    else a for a in accounts]
        return accounts, enquiries, "DPD_60: PL payment 5 months ago at DPD_60"
    if kind == "DPD_90":
        accounts = [_with_dpd(a, PaymentStatus.DPD_90_PLUS, 95, 14) if a.account_type == AccountType.AUTO_LOAN
                    else a for a in accounts]
        return accounts, enquiries, "DPD_90: auto-loan payment 14 months ago at DPD_90_PLUS"
    if kind == "WRITTEN_OFF":
        accounts.append(_closed_loan("WO", as_of, AccountStatus.WRITTEN_OFF, 10))
        return accounts, enquiries, "WRITTEN_OFF: closed PL written off 10 months ago"
    if kind == "SETTLED":
        accounts.append(_closed_loan("ST", as_of, AccountStatus.SETTLED, 8))
        return accounts, enquiries, "SETTLED: closed PL settled 8 months ago"
    if kind == "ENQUIRY_BURST":
        days = [(3, "PERSONAL_LOAN"), (8, "PERSONAL_LOAN"), (15, "PERSONAL_LOAN"), (26, "PERSONAL_LOAN"),
                (40, "CREDIT_CARD"), (55, "PERSONAL_LOAN"), (80, "AUTO_LOAN")]
        for i, (d, purpose) in enumerate(days):
            enquiries.append(Enquiry(enquiry_id=f"ENQ-B{i + 1}", enquired_on=as_of - timedelta(days=d),
                                     purpose=purpose, amount=200_000 + 25_000 * i))
        return accounts, enquiries, "ENQUIRY_BURST: 7 enquiries in 90 days"
    if kind == "DEFAULT":
        pl = [a for a in accounts if a.account_type == AccountType.PERSONAL_LOAN]
        hist = list(pl[0].payment_history)
        hist[-3:] = [PaymentStatus.DPD_30, PaymentStatus.DPD_60, PaymentStatus.DPD_90_PLUS]
        accounts = [_acc(a, status=AccountStatus.DEFAULT, worst_delinquency_days=95, payment_history=hist)
                    if a is pl[0] else a for a in accounts]
        return accounts, enquiries, "DEFAULT: PL now in DEFAULT after 30/60/90+ DPD in the last 3 months"
    raise ValueError(f"unknown overlay {kind}")


def build_linked_report(*, application_id: str, applicant_id: str, bureau_spec: str, seed: int,
                        target_score: int, aged_months: int,
                        as_of: date = BUREAU_AS_OF) -> dict:
    """Return {report (json or None), origin, overlay_changes, native_scenario, http_error}."""
    mode, _, rest = bureau_spec.partition(":")
    native, _, tgt = rest.partition("@")
    if mode == "native":
        target = int(tgt) if tgt else target_score
    else:
        native, target = "SUCCESS", target_score
    correlation_id = f"SARAL-{application_id}"
    report = build_report(application_id, applicant_id, native, seed=seed, as_of=as_of,
                          correlation_id=correlation_id, target_score=target)
    if report is None:
        return {"report": None, "origin": "native_generator", "native_scenario": native,
                "overlay_changes": [], "http_error": {"status": 503, "code": "BUREAU_UNAVAILABLE"}}
    if mode == "native":
        return {"report": report.model_dump(mode="json"), "origin": "native_generator",
                "native_scenario": native, "overlay_changes": [], "http_error": None}

    kinds = rest.split("+")
    accounts = _aged(list(report.accounts), aged_months, as_of)
    enquiries = list(report.enquiries)
    changes = [f"AGED: opened_on moved to {aged_months} months before as_of (native pass history "
               "opens every account exactly 6 months back, on the C03/C14 boundary)"]
    for kind in kinds:
        if kind == "AGED":
            continue
        accounts, enquiries, note = _apply(kind, accounts, enquiries, as_of)
        changes.append(note)
    result = score_history(accounts, enquiries, as_of)
    data = report.model_dump(mode="json")
    data["accounts"] = [a.model_dump(mode="json") for a in accounts]
    data["enquiries"] = [e.model_dump(mode="json") for e in enquiries]
    data["score"] = SyntheticScore(value=result.value, status=result.status,
                                   components=result.components).model_dump(mode="json")
    data["report_id"] = "BUR-OVL-" + hashlib.sha256(
        f"{seed}:{application_id}:{rest}".encode()).hexdigest()[:12].upper()
    data["provenance"]["scenario_id"] = f"SARAL-OVERLAY:{rest}"
    validated = BureauReport.model_validate(data)
    return {"report": validated.model_dump(mode="json"), "origin": "derived_overlay",
            "native_scenario": native, "overlay_changes": changes, "http_error": None}


def installment_obligations(report: dict | None) -> list[dict]:
    """Active installment accounts with a monthly obligation (what the bank must show)."""
    if not report:
        return []
    return [a for a in report["accounts"]
            if a["account_type"] in INSTALLMENT_TYPES and a["status"] == "ACTIVE" and a["monthly_obligation"] > 0]


def bureau_case(applicant: dict, linked: dict, scenario_id: str) -> dict:
    """One case in the bureau's own fixture shape (bureau-cases/1), so
    ``synthetic_bureau.app.create_app(fixture_path=...)`` serves these exact reports."""
    req = linked["request"]
    return {
        "case_id": f"SARAL-{applicant['applicant_id']}",
        "scenario": "UNAVAILABLE" if linked["report"] is None else scenario_id,
        "application": {"application_id": req["application_id"], "applicant_id": req["applicant_id"]},
        "request": req,
        "report": linked["report"],
        "provenance": {"synthetic": True, "origin": linked["origin"], "source_system": "saral-synthetic-kyc-bank",
                       "scenario_id": scenario_id},
    }
