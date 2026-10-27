"""Versioned contract for the synthetic credit-bureau service.

This is a development simulation. It is not a CIBIL/FICO contract, does not
contain real identity data, and must not be used for production lending.
"""
from datetime import date, datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

REPORT_SCHEMA = "bureau-report/1"
ERROR_SCHEMA = "bureau-error/1"
PROVIDER_NAME = "synthetic-bureau"
PROVIDER_VERSION = "1.0"
GENERATION_VERSION = "bureau-cases-v1"
SCORE_VERSION = "synthetic-score-v1"
SCORE_MIN = 300
SCORE_MAX = 900
SYNTHETIC_WARNING = (
    "SYNTHETIC DEVELOPMENT DATA. Not a CIBIL report or score. "
    "Never use for a real lending decision."
)
SCORE_DISCLAIMER = (
    "Heuristic score derived from synthetic history. Not CIBIL, FICO, "
    "or a validated risk model."
)


class BureauScenario(str, Enum):
    SUCCESS = "SUCCESS"
    NO_HIT = "NO_HIT"
    THIN_HISTORY = "THIN_HISTORY"
    STALE = "STALE"
    IDENTITY_MISMATCH = "IDENTITY_MISMATCH"
    INCOMPLETE = "INCOMPLETE"
    RATE_LIMIT = "RATE_LIMIT"
    UNAVAILABLE = "UNAVAILABLE"
    TIMEOUT = "TIMEOUT"
    MALFORMED = "MALFORMED_RESPONSE"


class ScoreStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    NO_HIT = "NO_HIT"
    INSUFFICIENT_HISTORY = "INSUFFICIENT_HISTORY"


class AccountType(str, Enum):
    CREDIT_CARD = "CREDIT_CARD"
    PERSONAL_LOAN = "PERSONAL_LOAN"
    AUTO_LOAN = "AUTO_LOAN"
    HOME_LOAN = "HOME_LOAN"
    OVERDRAFT = "OVERDRAFT"


class AccountStatus(str, Enum):
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"
    DEFAULT = "DEFAULT"
    WRITTEN_OFF = "WRITTEN_OFF"
    SETTLED = "SETTLED"


class PaymentStatus(str, Enum):
    ON_TIME = "ON_TIME"
    DPD_30 = "DPD_30"
    DPD_60 = "DPD_60"
    DPD_90_PLUS = "DPD_90_PLUS"


class IssueSource(str, Enum):
    APPLICATION = "APPLICATION"
    BUREAU = "BUREAU"
    PROVIDER = "PROVIDER"


class IssueSeverity(str, Enum):
    INFO = "INFO"
    WARN = "WARN"
    BLOCK = "BLOCK"


class BureauReportRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    application_id: str = Field(min_length=3, max_length=64, pattern=r"^[A-Za-z0-9][A-Za-z0-9_-]*$")
    applicant_id: str = Field(min_length=3, max_length=64, pattern=r"^[A-Za-z0-9][A-Za-z0-9_-]*$")
    scenario: BureauScenario | None = None


class CreditAccount(BaseModel):
    model_config = ConfigDict(extra="forbid")

    account_id: str = Field(min_length=1, max_length=64)
    account_type: AccountType
    status: AccountStatus
    opened_on: date
    closed_on: date | None = None
    credit_limit: int | None = Field(default=None, ge=0)
    original_amount: int | None = Field(default=None, ge=0)
    current_balance: int = Field(ge=0)
    monthly_obligation: int = Field(default=0, ge=0)
    months_reviewed: int = Field(ge=0, le=120)
    worst_delinquency_days: int = Field(default=0, ge=0)
    payment_history: list[PaymentStatus] = Field(default_factory=list)
    last_payment_date: date | None = None
    synthetic: Literal[True] = True

    @model_validator(mode="after")
    def _consistent(self):
        if self.closed_on is not None and self.closed_on < self.opened_on:
            raise ValueError("closed_on must not be before opened_on")
        if self.last_payment_date is not None and self.last_payment_date < self.opened_on:
            raise ValueError("last_payment_date must not be before opened_on")
        if len(self.payment_history) > self.months_reviewed:
            raise ValueError("payment_history cannot exceed months_reviewed")
        if self.account_type in (AccountType.CREDIT_CARD, AccountType.OVERDRAFT):
            if self.credit_limit is None:
                raise ValueError("revolving accounts require credit_limit")
            if self.current_balance > self.credit_limit:
                raise ValueError("current_balance cannot exceed credit_limit")
        if self.account_type in (
            AccountType.PERSONAL_LOAN,
            AccountType.AUTO_LOAN,
            AccountType.HOME_LOAN,
        ):
            if self.original_amount is None:
                raise ValueError("installment accounts require original_amount")
            if self.current_balance > self.original_amount:
                raise ValueError("current_balance cannot exceed original_amount")
        return self


class Enquiry(BaseModel):
    model_config = ConfigDict(extra="forbid")

    enquiry_id: str = Field(min_length=1, max_length=64)
    enquired_on: date
    purpose: str = Field(min_length=1, max_length=80)
    amount: int = Field(ge=0)
    synthetic: Literal[True] = True


class IdentityCheck(BaseModel):
    model_config = ConfigDict(extra="forbid")

    match: bool
    checked_on: date
    method: Literal["SYNTHETIC_ID_MATCH"] = "SYNTHETIC_ID_MATCH"


class SyntheticScore(BaseModel):
    model_config = ConfigDict(extra="forbid")

    value: int | None = Field(default=None, ge=SCORE_MIN, le=SCORE_MAX)
    type: Literal["SYNTHETIC"] = "SYNTHETIC"
    version: str = SCORE_VERSION
    status: ScoreStatus
    range_min: Literal[300] = SCORE_MIN
    range_max: Literal[900] = SCORE_MAX
    components: dict[str, int] = Field(default_factory=dict)
    disclaimer: str = SCORE_DISCLAIMER

    @model_validator(mode="after")
    def _status_matches_value(self):
        if self.status == ScoreStatus.AVAILABLE and self.value is None:
            raise ValueError("AVAILABLE score requires a value")
        if self.status != ScoreStatus.AVAILABLE and self.value is not None:
            raise ValueError("unavailable score must use value=null, never 0 or -1")
        return self


class DataQualityIssue(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=1, max_length=80)
    message: str = Field(min_length=1, max_length=300)
    field: str | None = None
    source: IssueSource
    severity: IssueSeverity = IssueSeverity.BLOCK


class DataQualitySummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    valid: bool
    issues: list[DataQualityIssue] = Field(default_factory=list)


class ProviderInfo(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: Literal["synthetic-bureau"] = PROVIDER_NAME
    version: str = PROVIDER_VERSION
    synthetic: Literal[True] = True
    warning: str = SYNTHETIC_WARNING


class Provenance(BaseModel):
    model_config = ConfigDict(extra="forbid")

    synthetic: Literal[True] = True
    source_system: Literal["synthetic-bureau-fastapi"] = "synthetic-bureau-fastapi"
    seed: int
    generation_version: str = GENERATION_VERSION
    scenario_id: str
    fixture_id: str | None = None
    record_origin: Literal["golden_fixture", "generated_on_demand"]
    correlation_id: str


class BureauReport(BaseModel):
    model_config = ConfigDict(extra="forbid")

    schema_version: Literal["bureau-report/1"] = REPORT_SCHEMA
    correlation_id: str
    provider: ProviderInfo = Field(default_factory=ProviderInfo)
    report_id: str
    application_id: str
    applicant_id: str
    generated_at: datetime
    report_date: date
    identity: IdentityCheck
    score: SyntheticScore
    accounts: list[CreditAccount] = Field(default_factory=list)
    enquiries: list[Enquiry] = Field(default_factory=list)
    data_quality: DataQualitySummary
    provenance: Provenance


class BureauErrorDetail(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str
    message: str
    retryable: bool = False
    correlation_id: str


class BureauErrorResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    schema_version: Literal["bureau-error/1"] = ERROR_SCHEMA
    error: BureauErrorDetail
