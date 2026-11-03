"""Saral's normalised bureau view (saral-bureau-report/1).

This is the shape ZEN and the agent read. It is derived from the synthetic bureau's
provider contract ``bureau-report/1`` (decision_engine/schemas/bureau.py), which this
package does not modify. Mapping, field by field, is in docs/saral/ZEN_DESIGN.md §2.3.

Synthetic only: the score is the synthetic bureau's heuristic score, not CIBIL.
"""
from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import Literal

from pydantic import Field, model_validator

from contracts.common import SYNTHETIC_ID_PATTERN, StrictModel, SyntheticMarker

BUREAU_VIEW_SCHEMA = "saral-bureau-report/1"

# The provider reports delinquency in buckets (ON_TIME / DPD_30 / DPD_60 / DPD_90_PLUS),
# so DPD values in this view are bucket floors.
DPD_BUCKETS = (0, 30, 60, 90)


class ScoreStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    NO_HIT = "NO_HIT"
    INSUFFICIENT_HISTORY = "INSUFFICIENT_HISTORY"


class TradelineType(str, Enum):
    CREDIT_CARD = "CREDIT_CARD"
    PERSONAL_LOAN = "PERSONAL_LOAN"
    AUTO_LOAN = "AUTO_LOAN"
    HOME_LOAN = "HOME_LOAN"
    OVERDRAFT = "OVERDRAFT"


REVOLVING = frozenset({TradelineType.CREDIT_CARD, TradelineType.OVERDRAFT})


class TradelineStatus(str, Enum):
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"
    DEFAULT = "DEFAULT"
    WRITTEN_OFF = "WRITTEN_OFF"
    SETTLED = "SETTLED"


class Score(StrictModel):
    value: int | None = Field(default=None, ge=300, le=900)
    status: ScoreStatus
    type: Literal["SYNTHETIC"] = "SYNTHETIC"

    @model_validator(mode="after")
    def _value_matches_status(self):
        if self.status == ScoreStatus.AVAILABLE and self.value is None:
            raise ValueError("AVAILABLE score requires a value")
        if self.status != ScoreStatus.AVAILABLE and self.value is not None:
            raise ValueError("an unavailable score is null, never 0 or -1")
        return self


class Tradeline(StrictModel):
    tradeline_id: str = Field(pattern=SYNTHETIC_ID_PATTERN)
    type: TradelineType
    status: TradelineStatus
    opened_on: date
    closed_on: date | None = None
    sanctioned_amount: int | None = Field(default=None, ge=0, description="original amount or credit limit")
    current_balance: int = Field(ge=0)
    emi: int = Field(ge=0, description="reported monthly obligation (provider monthly_obligation)")
    max_dpd_12m: int = Field(ge=0)
    max_dpd_24m: int = Field(ge=0)
    status_changed_on: date | None = Field(default=None, description="date of write-off / settlement, when known")

    @model_validator(mode="after")
    def _consistent(self):
        for v in (self.max_dpd_12m, self.max_dpd_24m):
            if v not in DPD_BUCKETS:
                raise ValueError(f"DPD must be a provider bucket floor {DPD_BUCKETS}")
        if self.max_dpd_24m < self.max_dpd_12m:
            raise ValueError("max_dpd_24m covers the 12m window, so it cannot be lower")
        if self.closed_on is not None and self.closed_on < self.opened_on:
            raise ValueError("closed_on before opened_on")
        if self.status in (TradelineStatus.WRITTEN_OFF, TradelineStatus.SETTLED) and self.status_changed_on is None:
            raise ValueError("write-off / settlement needs status_changed_on so the lookback can be applied")
        if self.status == TradelineStatus.CLOSED and self.emi:
            raise ValueError("a closed tradeline carries no EMI")
        return self


class Enquiry(StrictModel):
    enquiry_id: str = Field(pattern=SYNTHETIC_ID_PATTERN)
    enquired_on: date
    purpose: str = Field(min_length=1, max_length=80)
    amount: int = Field(ge=0)


class BureauAggregates(StrictModel):
    """Derived from tradelines/enquiries; the validator recomputes and must agree."""

    active_emi_total: int = Field(ge=0)
    max_dpd_12m: int = Field(ge=0)
    max_dpd_24m: int = Field(ge=0)
    enquiries_6m: int = Field(ge=0)
    writeoff_or_settlement_24m: bool
    writeoff_or_settlement_ever: bool


def _months_before(d: date, months: int) -> date:
    y, m = divmod(d.year * 12 + (d.month - 1) - months, 12)
    day = min(d.day, 28)
    return date(y, m + 1, day)


class BureauReport(StrictModel):
    schema_version: Literal["saral-bureau-report/1"] = BUREAU_VIEW_SCHEMA
    report_id: str = Field(pattern=SYNTHETIC_ID_PATTERN)
    applicant_id: str = Field(pattern=SYNTHETIC_ID_PATTERN)
    provider_schema: Literal["bureau-report/1"] = "bureau-report/1"
    provider_report_id: str = Field(min_length=3, max_length=80)
    report_date: date
    generated_at: datetime
    identity_match: bool
    score: Score
    tradelines: list[Tradeline] = Field(default_factory=list)
    enquiries: list[Enquiry] = Field(default_factory=list)
    aggregates: BureauAggregates
    data_quality_valid: bool
    marker: SyntheticMarker = Field(default_factory=SyntheticMarker)

    @model_validator(mode="after")
    def _aggregates_agree(self):
        ids = [t.tradeline_id for t in self.tradelines]
        if len(ids) != len(set(ids)):
            raise ValueError("duplicate tradeline_id")
        six = _months_before(self.report_date, 6)
        two_years = _months_before(self.report_date, 24)
        bad = [t for t in self.tradelines if t.status in (TradelineStatus.WRITTEN_OFF, TradelineStatus.SETTLED)]
        expected = BureauAggregates(
            active_emi_total=sum(t.emi for t in self.tradelines if t.status == TradelineStatus.ACTIVE),
            max_dpd_12m=max((t.max_dpd_12m for t in self.tradelines), default=0),
            max_dpd_24m=max((t.max_dpd_24m for t in self.tradelines), default=0),
            enquiries_6m=sum(1 for e in self.enquiries if six <= e.enquired_on <= self.report_date),
            writeoff_or_settlement_24m=any(t.status_changed_on >= two_years for t in bad),
            writeoff_or_settlement_ever=bool(bad),
        )
        if expected != self.aggregates:
            raise ValueError(
                f"aggregates disagree with tradelines/enquiries: expected {expected.model_dump()}, "
                f"got {self.aggregates.model_dump()}")
        if any(e.enquired_on > self.report_date for e in self.enquiries):
            raise ValueError("enquiry dated after the report")
        if self.score.status == ScoreStatus.NO_HIT and self.tradelines:
            raise ValueError("NO_HIT means no tradelines")
        return self

    @property
    def new_to_credit(self) -> bool:
        return self.score.status != ScoreStatus.AVAILABLE
