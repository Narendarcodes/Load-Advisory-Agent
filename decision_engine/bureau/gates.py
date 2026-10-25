"""Data-quality gates and score-source precedence for the synthetic bureau.

No credit rule or credit threshold lives here. A gate produces REVIEW or a
provider ERROR; credit pass/fail always remains ZEN's job.
"""
from dataclasses import dataclass, field
from datetime import date
from typing import Any

from decision_engine.schemas.bureau import (
    BureauReport,
    IssueSeverity,
    IssueSource,
    ScoreStatus,
)

DQ_MISSING_REQUIRED_FIELD = "DQ_MISSING_REQUIRED_FIELD"
DQ_INVALID_APPLICATION_VALUE = "DQ_INVALID_APPLICATION_VALUE"
DQ_CREDIT_SCORE_CONFLICT = "DQ_CREDIT_SCORE_CONFLICT"
DQ_BUREAU_NO_HIT = "DQ_BUREAU_NO_HIT"
DQ_BUREAU_INSUFFICIENT_HISTORY = "DQ_BUREAU_INSUFFICIENT_HISTORY"
DQ_BUREAU_REPORT_STALE = "DQ_BUREAU_REPORT_STALE"
DQ_BUREAU_IDENTITY_MISMATCH = "DQ_BUREAU_IDENTITY_MISMATCH"
DQ_BUREAU_INCOMPLETE_REPORT = "DQ_BUREAU_INCOMPLETE_REPORT"
DQ_INCOME_OBLIGATION_INCONSISTENT = "DQ_INCOME_OBLIGATION_INCONSISTENT"

BUREAU_TIMEOUT = "BUREAU_TIMEOUT"
BUREAU_RATE_LIMITED = "BUREAU_RATE_LIMITED"
BUREAU_UNAVAILABLE = "BUREAU_UNAVAILABLE"
BUREAU_MALFORMED_RESPONSE = "BUREAU_MALFORMED_RESPONSE"
BUREAU_UNSAFE_NON_SYNTHETIC = "BUREAU_UNSAFE_NON_SYNTHETIC"

INFO_CODES = {DQ_MISSING_REQUIRED_FIELD, DQ_INVALID_APPLICATION_VALUE}

REQUIRED_APPLICATION_FIELDS = (
    "monthly_income",
    "monthly_obligations",
    "employment_months",
    "loan_amount",
    "loan_tenure_months",
)

PRIORITY = {
    DQ_MISSING_REQUIRED_FIELD: 10,
    DQ_INVALID_APPLICATION_VALUE: 11,
    BUREAU_UNSAFE_NON_SYNTHETIC: 20,
    DQ_BUREAU_NO_HIT: 30,
    DQ_BUREAU_INSUFFICIENT_HISTORY: 31,
    DQ_BUREAU_IDENTITY_MISMATCH: 40,
    DQ_BUREAU_INCOMPLETE_REPORT: 41,
    DQ_BUREAU_REPORT_STALE: 50,
    DQ_INCOME_OBLIGATION_INCONSISTENT: 51,
    DQ_CREDIT_SCORE_CONFLICT: 60,
}


@dataclass(frozen=True)
class GateConfig:
    """Approved data-quality policy. Defaults are deliberately disabled."""

    approved: bool = False
    stale_after_days: int | None = None
    obligation_variance_pct: float | None = None
    obligation_variance_abs_inr: int | None = None


@dataclass(frozen=True)
class ScoreResolution:
    value: int | None
    source: str
    local_value: int | None
    bureau_value: int | None
    placeholder_used: bool = False
    conflict: bool = False
    precedence: str = "NONE"

    def to_dict(self) -> dict:
        return {
            "value": self.value,
            "source": self.source,
            "local_value": self.local_value,
            "bureau_value": self.bureau_value,
            "placeholder_used": self.placeholder_used,
            "conflict": self.conflict,
            "precedence": self.precedence,
        }


@dataclass(frozen=True)
class GateIssue:
    code: str
    message: str
    source: IssueSource
    field: str | None = None
    severity: IssueSeverity = IssueSeverity.BLOCK

    def to_dict(self) -> dict:
        return {
            "code": self.code,
            "message": self.message,
            "field": self.field,
            "source": self.source.value,
            "severity": self.severity.value,
        }


@dataclass(frozen=True)
class GateResult:
    category: str
    issues: list[GateIssue] = field(default_factory=list)
    score: ScoreResolution | None = None
    missing_fields: list[str] = field(default_factory=list)

    @property
    def review_required(self) -> bool:
        return self.category == "DATA_QUALITY"

    @property
    def info_requested(self) -> bool:
        return bool(self.issues) and all(i.code in INFO_CODES for i in self.issues)

    @property
    def reason_codes(self) -> list[str]:
        return [i.code for i in self.issues]

    def to_dict(self) -> dict:
        return {
            "required": self.review_required,
            "category": self.category,
            "info_requested": self.info_requested,
            "reason_codes": self.reason_codes,
            "reasons": [i.to_dict() for i in self.issues],
        }


def _issue(code: str, message: str, source: IssueSource, field: str | None = None) -> GateIssue:
    return GateIssue(code=code, message=message, source=source, field=field)


def provider_failure(code: str, message: str) -> GateResult:
    return GateResult(
        category="PROVIDER_FAILURE",
        issues=[_issue(code, message, IssueSource.PROVIDER)],
    )


def _is_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _validate_application(application: dict) -> tuple[list[GateIssue], list[str]]:
    issues: list[GateIssue] = []
    missing: list[str] = []
    for name in REQUIRED_APPLICATION_FIELDS:
        value = application.get(name)
        if value is None or value == "":
            missing.append(name)
            issues.append(
                _issue(
                    DQ_MISSING_REQUIRED_FIELD,
                    f"{name} is required before underwriting",
                    IssueSource.APPLICATION,
                    name,
                )
            )
    checks = {
        "monthly_income": lambda v: _is_number(v) and v > 0,
        "monthly_obligations": lambda v: _is_number(v) and v >= 0,
        "employment_months": lambda v: _is_number(v) and 0 <= v <= 600,
        "loan_amount": lambda v: _is_number(v) and v > 0,
        "loan_tenure_months": lambda v: _is_number(v) and 1 <= v <= 360,
    }
    for name, check in checks.items():
        value = application.get(name)
        if value is None or value == "" or name in missing:
            continue
        if not check(value):
            issues.append(
                _issue(
                    DQ_INVALID_APPLICATION_VALUE,
                    f"{name} has an invalid value",
                    IssueSource.APPLICATION,
                    name,
                )
            )
    return issues, missing


def resolve_credit_score(application: dict, report: BureauReport) -> ScoreResolution:
    """Resolve local vs bureau score without silently overwriting a real value."""
    local = application.get("credit_score")
    origin = application.get("credit_score_origin")
    placeholder = origin == "SYNTHETIC_PLACEHOLDER"
    bureau = report.score.value if report.score.status == ScoreStatus.AVAILABLE else None
    local_valid = local is None or (isinstance(local, int) and 300 <= local <= 900)

    if local is None:
        if bureau is not None:
            return ScoreResolution(
                value=bureau,
                source="SYNTHETIC_BUREAU",
                local_value=None,
                bureau_value=bureau,
                precedence="MISSING_LOCAL_USE_BUREAU",
            )
        return ScoreResolution(
            value=None,
            source="NO_BUREAU_SCORE",
            local_value=None,
            bureau_value=None,
            precedence="MISSING_LOCAL_NO_BUREAU",
        )

    if placeholder:
        if bureau is not None:
            return ScoreResolution(
                value=bureau,
                source="SYNTHETIC_BUREAU_REPLACED_PLACEHOLDER",
                local_value=local,
                bureau_value=bureau,
                placeholder_used=True,
                precedence="PLACEHOLDER_REPLACED",
            )
        return ScoreResolution(
            value=None,
            source="NO_BUREAU_SCORE",
            local_value=local,
            bureau_value=None,
            placeholder_used=True,
            precedence="PLACEHOLDER_NO_BUREAU",
        )

    if not local_valid:
        return ScoreResolution(
            value=None,
            source="INVALID_LOCAL_SCORE",
            local_value=local,
            bureau_value=bureau,
            conflict=True,
            precedence="INVALID_LOCAL_SCORE",
        )

    if bureau is None:
        return ScoreResolution(
            value=None,
            source="NO_BUREAU_SCORE",
            local_value=local,
            bureau_value=None,
            precedence="LOCAL_PRESENT_NO_BUREAU",
        )

    if local == bureau:
        return ScoreResolution(
            value=bureau,
            source="SYNTHETIC_BUREAU_MATCH",
            local_value=local,
            bureau_value=bureau,
            precedence="VALUES_MATCH",
        )

    return ScoreResolution(
        value=None,
        source="CONFLICT",
        local_value=local,
        bureau_value=bureau,
        conflict=True,
        precedence="GENUINE_SOURCE_CONFLICT",
    )


def evaluate_data_quality(
    application: dict,
    report: BureauReport | None,
    *,
    config: GateConfig | None = None,
    as_of: date | None = None,
) -> GateResult:
    """Evaluate only data quality and score-source consistency.

    Staleness and variance are ignored unless config.approved is True and the
    corresponding value was explicitly supplied.
    """
    config = config or GateConfig()
    issues, missing = _validate_application(application)

    if report is None:
        issues.append(
            _issue(
                BUREAU_MALFORMED_RESPONSE,
                "bureau report is missing",
                IssueSource.PROVIDER,
            )
        )
        return _result(issues, None, missing, provider=True)

    if not report.provider.synthetic or report.score.type != "SYNTHETIC":
        issues.append(
            _issue(
                BUREAU_UNSAFE_NON_SYNTHETIC,
                "bureau response is not explicitly synthetic",
                IssueSource.PROVIDER,
            )
        )
        return _result(issues, None, missing, provider=True)

    if report.score.status == ScoreStatus.NO_HIT:
        issues.append(
            _issue(
                DQ_BUREAU_NO_HIT,
                "bureau returned no credit history",
                IssueSource.BUREAU,
                "score",
            )
        )
    elif report.score.status == ScoreStatus.INSUFFICIENT_HISTORY:
        issues.append(
            _issue(
                DQ_BUREAU_INSUFFICIENT_HISTORY,
                "bureau history is insufficient for a synthetic score",
                IssueSource.BUREAU,
                "score",
            )
        )

    app_id = application.get("applicant_id")
    if not report.identity.match or report.applicant_id != app_id:
        issues.append(
            _issue(
                DQ_BUREAU_IDENTITY_MISMATCH,
                "bureau identity does not match the application",
                IssueSource.BUREAU,
                "applicant_id",
            )
        )

    if not report.data_quality.valid or report.data_quality.issues:
        issues.append(
            _issue(
                DQ_BUREAU_INCOMPLETE_REPORT,
                "bureau report is incomplete or flagged invalid",
                IssueSource.BUREAU,
                "data_quality",
            )
        )

    check_date = as_of or report.generated_at.date()
    if config.approved and config.stale_after_days is not None:
        age = (check_date - report.report_date).days
        if age > config.stale_after_days:
            issues.append(
                _issue(
                    DQ_BUREAU_REPORT_STALE,
                    f"bureau report is {age} days old",
                    IssueSource.BUREAU,
                    "report_date",
                )
            )

    if config.approved and config.obligation_variance_pct is not None:
        reported = sum(a.monthly_obligation for a in report.accounts)
        local = application.get("monthly_obligations")
        if _is_number(local):
            tolerance = max(
                abs(reported) * config.obligation_variance_pct / 100,
                config.obligation_variance_abs_inr or 0,
            )
            if abs(local - reported) > tolerance:
                issues.append(
                    _issue(
                        DQ_INCOME_OBLIGATION_INCONSISTENT,
                        "local obligations differ from bureau-reported obligations",
                        IssueSource.BUREAU,
                        "monthly_obligations",
                    )
                )

    resolution = resolve_credit_score(application, report)
    if resolution.conflict:
        if resolution.source == "INVALID_LOCAL_SCORE":
            issues.append(
                _issue(
                    DQ_INVALID_APPLICATION_VALUE,
                    "credit_score has an invalid value",
                    IssueSource.APPLICATION,
                    "credit_score",
                )
            )
        else:
            issues.append(
                _issue(
                    DQ_CREDIT_SCORE_CONFLICT,
                    "local and bureau credit scores differ",
                    IssueSource.APPLICATION,
                    "credit_score",
                )
            )

    return _result(issues, resolution, missing)


def _result(
    issues: list[GateIssue],
    resolution: ScoreResolution | None,
    missing: list[str],
    *,
    provider: bool = False,
) -> GateResult:
    issues = sorted(issues, key=lambda i: PRIORITY.get(i.code, 999))
    if provider:
        return GateResult("PROVIDER_FAILURE", issues, resolution, missing)
    return GateResult("DATA_QUALITY" if issues else "NONE", issues, resolution, missing)
