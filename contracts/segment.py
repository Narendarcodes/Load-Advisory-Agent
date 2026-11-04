"""Segments (saral-segment/1).

A segment never decides anything on its own. It selects which threshold a rule uses,
adds or skips a rule, or changes a rule's effect. Every change is tagged with its basis
(BAJAJ-SOURCED or ASSUMPTION) exactly like a rule row.

Three independent dimensions; an applicant gets at most one segment per dimension:

* EMPLOYMENT_GEO: SALARIED_METRO | SALARIED_NON_METRO | SELF_EMPLOYED (exactly one)
* CREDIT: PRIME | NEAR_PRIME | NEW_TO_CREDIT (at most one; none when the score is
  below the Bajaj 650 floor, which the base rule declines)
* RELATIONSHIP: EXISTING_CUSTOMER (optional)
"""
from __future__ import annotations

from enum import Enum
from typing import Literal

from pydantic import Field, model_validator

from contracts.common import SYNTHETIC_ID_PATTERN, ApprovalStatus, StrictModel, ThresholdBasis


class SegmentId(str, Enum):
    SALARIED_METRO = "SALARIED_METRO"
    SALARIED_NON_METRO = "SALARIED_NON_METRO"
    SELF_EMPLOYED = "SELF_EMPLOYED"
    NEW_TO_CREDIT = "NEW_TO_CREDIT"
    PRIME = "PRIME"
    NEAR_PRIME = "NEAR_PRIME"
    EXISTING_CUSTOMER = "EXISTING_CUSTOMER"


class Dimension(str, Enum):
    EMPLOYMENT_GEO = "EMPLOYMENT_GEO"
    CREDIT = "CREDIT"
    RELATIONSHIP = "RELATIONSHIP"


DIMENSION_OF: dict[SegmentId, Dimension] = {
    SegmentId.SALARIED_METRO: Dimension.EMPLOYMENT_GEO,
    SegmentId.SALARIED_NON_METRO: Dimension.EMPLOYMENT_GEO,
    SegmentId.SELF_EMPLOYED: Dimension.EMPLOYMENT_GEO,
    SegmentId.PRIME: Dimension.CREDIT,
    SegmentId.NEAR_PRIME: Dimension.CREDIT,
    SegmentId.NEW_TO_CREDIT: Dimension.CREDIT,
    SegmentId.EXISTING_CUSTOMER: Dimension.RELATIONSHIP,
}


class ChangeKind(str, Enum):
    SET_THRESHOLD = "SET_THRESHOLD"    # rule keeps its operator, takes this threshold
    ADD_RULE = "ADD_RULE"              # rule only runs in this segment
    SKIP_RULE = "SKIP_RULE"            # rule is not run (row is NOT_EVALUATED, NO_EFFECT)
    SET_EFFECT = "SET_EFFECT"          # rule's on-fail / on-missing effect changes
    SET_SOURCE = "SET_SOURCE"          # data point is read from a different source


class SegmentEffect(StrictModel):
    rule_id: str = Field(pattern=r"^[A-Z][A-Z0-9_]+$")
    change: ChangeKind
    value: float | int | str | bool | list[str] | None = None
    basis: ThresholdBasis
    assumption_id: str | None = Field(default=None, pattern=r"^A-[0-9]{2}$")
    source_chunk: str | None = Field(default=None, pattern=r"^BFL-[A-Z0-9-]+#[0-9]{3}$")

    @model_validator(mode="after")
    def _tagged(self):
        if self.basis == ThresholdBasis.ASSUMPTION and not self.assumption_id:
            raise ValueError(f"{self.rule_id}: an ASSUMPTION effect needs assumption_id")
        if self.basis == ThresholdBasis.BAJAJ_SOURCED and not self.source_chunk:
            raise ValueError(f"{self.rule_id}: a BAJAJ-SOURCED effect needs source_chunk")
        if self.change == ChangeKind.SET_THRESHOLD and self.value is None:
            raise ValueError(f"{self.rule_id}: SET_THRESHOLD needs a value")
        return self


class Segment(StrictModel):
    """A segment definition (catalogue entry)."""

    schema_version: Literal["saral-segment/1"] = "saral-segment/1"
    segment_id: SegmentId
    dimension: Dimension
    assignment_rule: str = Field(min_length=5, max_length=400)
    effects: list[SegmentEffect] = Field(default_factory=list)
    approval_status: ApprovalStatus

    @model_validator(mode="after")
    def _dimension(self):
        if DIMENSION_OF[self.segment_id] != self.dimension:
            raise ValueError(f"{self.segment_id.value} belongs to {DIMENSION_OF[self.segment_id].value}")
        return self

    @property
    def uses_assumptions(self) -> bool:
        return any(e.basis == ThresholdBasis.ASSUMPTION for e in self.effects)


class SegmentAssignment(StrictModel):
    """The segments one application landed in, with the facts that put it there."""

    applicant_id: str = Field(pattern=SYNTHETIC_ID_PATTERN)
    segments: list[SegmentId] = Field(min_length=1)
    basis: dict[str, str] = Field(default_factory=dict, description="segment id -> why, in plain words")

    @model_validator(mode="after")
    def _one_per_dimension(self):
        if len(set(self.segments)) != len(self.segments):
            raise ValueError("duplicate segment")
        dims = [DIMENSION_OF[s] for s in self.segments]
        for d in Dimension:
            if dims.count(d) > 1:
                raise ValueError(f"more than one {d.value} segment")
        if Dimension.EMPLOYMENT_GEO not in dims:
            raise ValueError("exactly one EMPLOYMENT_GEO segment is required")
        missing = [s.value for s in self.segments if s.value not in self.basis]
        if missing:
            raise ValueError(f"no basis given for {missing}")
        return self
