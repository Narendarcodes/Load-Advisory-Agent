"""Decision trace (saral-decision-trace/1).

One row per rule ZEN evaluated. The row keeps the PR #38 field names the assistant's
meters read (``actual_value``, ``threshold_value``, ``operator``, commit 9af3a71) and
adds what the explanation needs: the outcome effect, the threshold basis, and a source
citation (BAJAJ-SOURCED) or an assumption id (ASSUMPTION).

Row semantics
-------------
``result`` is what the comparison said: PASS, FAIL or NOT_EVALUATED (an input was missing).
``outcome`` is what that does to the decision:

* PASS                      -> PASS
* FAIL                      -> ``on_fail`` (DECLINE or REFER), except a DECLINE whose
                               actual value rests on low-confidence OCR is downgraded to REFER
* NOT_EVALUATED, required   -> REFER (missing data never declines)
* NOT_EVALUATED, optional   -> NO_EFFECT

SCREENING rows (OCR confidence, signature similarity) can only ever REFER.
"""
from __future__ import annotations

import math
from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import Field, model_validator

from contracts.common import (
    SYNTHETIC_ID_PATTERN,
    ApprovalStatus,
    Citation,
    StrictModel,
    ThresholdBasis,
)

TRACE_SCHEMA = "saral-decision-trace/1"


class RuleCategory(str, Enum):
    ELIGIBILITY = "ELIGIBILITY"      # age, nationality, amount, tenure, employer category
    INCOME = "INCOME"
    AFFORDABILITY = "AFFORDABILITY"  # FOIR
    CREDIT = "CREDIT"                # score, DPD, enquiries, write-off / settlement
    VERIFICATION = "VERIFICATION"    # income cross-check, bank health, KYC consistency, docs
    PRODUCT = "PRODUCT"              # per-purpose caps and purpose match
    SCREENING = "SCREENING"          # OCR confidence, signature similarity


class Operator(str, Enum):
    GE = ">="
    LE = "<="
    GT = ">"
    LT = "<"
    EQ = "=="
    NE = "!="
    IN = "in"


# Operators the PR #38 decision card renders today; any other operator shows no meter.
PR38_CARD_OPERATORS = frozenset({Operator.GE, Operator.LE})


class RuleResult(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    NOT_EVALUATED = "NOT_EVALUATED"


class OnFail(str, Enum):
    DECLINE = "DECLINE"
    REFER = "REFER"


class RowOutcome(str, Enum):
    PASS = "PASS"
    REFER = "REFER"
    DECLINE = "DECLINE"
    NO_EFFECT = "NO_EFFECT"


class ActualSource(str, Enum):
    BUREAU = "BUREAU"
    OCR = "OCR"
    DECLARED = "DECLARED"
    COMPUTED = "COMPUTED"            # formula over other data points
    APPLICANT_RECORD = "APPLICANT_RECORD"
    EXISTING_KYC = "EXISTING_KYC"
    SIGNATURE_CHECK = "SIGNATURE_CHECK"


Scalar = float | int | bool | str | None


def compare(actual, op: Operator, threshold) -> bool:
    """The comparison a row claims. Raises on types that cannot be compared."""
    if op == Operator.IN:
        if not isinstance(threshold, list):
            raise ValueError("operator 'in' needs a list threshold")
        return actual in threshold
    if op in (Operator.EQ, Operator.NE):
        return (actual == threshold) if op == Operator.EQ else (actual != threshold)
    for v in (actual, threshold):
        if isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v):
            raise ValueError(f"operator {op.value} needs finite numbers")
    return {Operator.GE: actual >= threshold, Operator.LE: actual <= threshold,
            Operator.GT: actual > threshold, Operator.LT: actual < threshold}[op]


class TraceRow(StrictModel):
    rule_id: str = Field(pattern=r"^[A-Z][A-Z0-9_]+$")
    rule_name: str = Field(min_length=3, max_length=120)
    category: RuleCategory
    field: str = Field(pattern=r"^[a-z][a-z0-9_]*$", description="ZenInput data point the rule reads")
    actual_value: Scalar = None
    threshold_value: float | int | bool | str | list[str]
    operator: Operator
    result: RuleResult
    on_fail: OnFail
    required: bool = True
    outcome: RowOutcome
    reason_code: str = Field(pattern=r"^ERR_[A-Z0-9_]+$")
    actual_source: ActualSource | None = None
    actual_low_confidence: bool = False
    downgraded_from: OnFail | None = None
    threshold_basis: ThresholdBasis
    citation: Citation | None = None
    assumption_id: str | None = Field(default=None, pattern=r"^A-[0-9]{2}$")
    approval_status: ApprovalStatus
    segment_override: str | None = Field(default=None, description="segment that set this threshold, if any")

    @model_validator(mode="after")
    def _row_is_honest(self):
        # basis tagging
        if self.threshold_basis == ThresholdBasis.BAJAJ_SOURCED:
            if self.citation is None or not self.citation.doc_id.startswith("BFL-"):
                raise ValueError(f"{self.rule_id}: BAJAJ-SOURCED needs a Bajaj citation (doc id + chunk)")
            if self.assumption_id is not None:
                raise ValueError(f"{self.rule_id}: BAJAJ-SOURCED rows carry no assumption_id")
            if self.approval_status != ApprovalStatus.APPROVED:
                raise ValueError(f"{self.rule_id}: a sourced threshold is APPROVED by its source")
        else:
            if not self.assumption_id:
                raise ValueError(f"{self.rule_id}: ASSUMPTION needs assumption_id")
        # screening never declines
        if self.category == RuleCategory.SCREENING and self.on_fail != OnFail.REFER:
            raise ValueError(f"{self.rule_id}: SCREENING rules can only REFER, never DECLINE")
        # result agrees with the numbers
        if self.result == RuleResult.NOT_EVALUATED:
            if self.actual_value is not None:
                raise ValueError(f"{self.rule_id}: NOT_EVALUATED has actual_value=null")
        else:
            if self.actual_value is None:
                raise ValueError(f"{self.rule_id}: {self.result.value} needs an actual_value")
            passed = compare(self.actual_value, self.operator, self.threshold_value)
            if passed != (self.result == RuleResult.PASS):
                raise ValueError(
                    f"{self.rule_id}: {self.actual_value!r} {self.operator.value} {self.threshold_value!r} "
                    f"is {passed}, but result is {self.result.value}")
        if self.actual_low_confidence and self.actual_source not in (ActualSource.OCR, ActualSource.COMPUTED):
            raise ValueError(f"{self.rule_id}: only OCR-derived values can be low confidence")
        # outcome agrees with result
        expected, downgraded = self._expected_outcome()
        if self.outcome != expected:
            raise ValueError(f"{self.rule_id}: outcome must be {expected.value}, got {self.outcome.value}")
        if self.downgraded_from != downgraded:
            raise ValueError(f"{self.rule_id}: downgraded_from must be {downgraded}")
        return self

    def _expected_outcome(self) -> tuple[RowOutcome, OnFail | None]:
        if self.result == RuleResult.PASS:
            return RowOutcome.PASS, None
        if self.result == RuleResult.NOT_EVALUATED:
            return (RowOutcome.REFER if self.required else RowOutcome.NO_EFFECT), None
        if self.on_fail == OnFail.DECLINE and self.actual_low_confidence:
            return RowOutcome.REFER, OnFail.DECLINE
        return RowOutcome(self.on_fail.value), None

    @property
    def renders_meter(self) -> bool:
        """True when the PR #38 card can draw a meter for this row today."""
        return (self.operator in PR38_CARD_OPERATORS
                and isinstance(self.actual_value, (int, float)) and not isinstance(self.actual_value, bool)
                and isinstance(self.threshold_value, (int, float)) and not isinstance(self.threshold_value, bool))


class Decision(str, Enum):
    APPROVE = "APPROVE"
    REFER = "REFER"
    DECLINE = "DECLINE"


def decision_from_rows(rows: list[TraceRow]) -> Decision:
    outcomes = {r.outcome for r in rows}
    if RowOutcome.DECLINE in outcomes:
        return Decision.DECLINE
    if RowOutcome.REFER in outcomes:
        return Decision.REFER
    return Decision.APPROVE


class PolicyRef(StrictModel):
    policy_id: str = Field(pattern=r"^SARAL_PL_[A-Z_]+$")
    policy_version: str = Field(min_length=1, max_length=40)
    status: Literal["DRAFT", "APPROVED"]
    lender: Literal["Bajaj Finance Ltd"] = "Bajaj Finance Ltd"
    lender_relationship: Literal["public reference lender, not a partner"] = "public reference lender, not a partner"


class EngineRef(StrictModel):
    name: Literal["zen"] = "zen"
    version: str = Field(min_length=1, max_length=20)
    decision_model: str = Field(min_length=1, max_length=120)
    decision_model_sha256: str = Field(pattern=r"^[0-9a-f]{64}$")


class DecisionTrace(StrictModel):
    schema_version: Literal["saral-decision-trace/1"] = TRACE_SCHEMA
    trace_id: str = Field(pattern=SYNTHETIC_ID_PATTERN)
    application_id: str = Field(pattern=SYNTHETIC_ID_PATTERN)
    evaluated_at: datetime
    policy: PolicyRef
    engine: EngineRef
    rows: list[TraceRow] = Field(min_length=1)

    @model_validator(mode="after")
    def _trace_rules(self):
        ids = [r.rule_id for r in self.rows]
        if len(ids) != len(set(ids)):
            raise ValueError("rule_id must be unique within a trace")
        pending = [r.rule_id for r in self.rows
                   if r.threshold_basis == ThresholdBasis.ASSUMPTION and r.approval_status != ApprovalStatus.APPROVED]
        if pending and self.policy.status != "DRAFT":
            raise ValueError(f"policy cannot be APPROVED while assumptions are pending: {pending}")
        return self

    @property
    def decision(self) -> Decision:
        return decision_from_rows(self.rows)
