"""ZEN input and output (saral-zen-input/1, saral-zen-output/1).

ZenInput is the only thing ZEN sees. Every value is a catalogued data point (see
``DataPointName`` and docs/saral/ZEN_DESIGN.md §2) carrying where it came from, whether
a fallback was used, and whether it rests on low-confidence OCR. Raw documents, raw
bureau JSON and identity numbers never reach ZEN.

ZenOutput is ZEN's answer plus its full trace. ZEN decides; the agent only explains.
While any assumption is unapproved, the policy is DRAFT and the output is stamped
``not_for_live_use``.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import Field, model_validator

from contracts.common import SYNTHETIC_ID_PATTERN, NoRawIdentifiers, StrictModel, SyntheticMarker
from contracts.decision_trace import Decision, DecisionTrace, RowOutcome
from contracts.segment import SegmentAssignment

ZEN_INPUT_SCHEMA = "saral-zen-input/1"
ZEN_OUTPUT_SCHEMA = "saral-zen-output/1"


class ProductId(str, Enum):
    """The four personal-loan subcategories, by purpose (owner decision, 2026-11-03)."""

    PL_WEDDING = "PL_WEDDING"
    PL_HIGHER_EDUCATION = "PL_HIGHER_EDUCATION"
    PL_HOME_RENOVATION = "PL_HOME_RENOVATION"
    PL_MEDICAL_EMERGENCY = "PL_MEDICAL_EMERGENCY"


PURPOSE_OF: dict[ProductId, str] = {
    ProductId.PL_WEDDING: "wedding",
    ProductId.PL_HIGHER_EDUCATION: "higher_education",
    ProductId.PL_HOME_RENOVATION: "home_renovation",
    ProductId.PL_MEDICAL_EMERGENCY: "medical_emergency",
}


class DataPointName(str, Enum):
    # request
    LOAN_AMOUNT = "loan_amount"
    TENURE_MONTHS = "tenure_months"
    PURPOSE = "purpose"
    # applicant
    AGE_AT_APPLICATION = "age_at_application"
    AGE_AT_MATURITY = "age_at_maturity"
    NATIONALITY = "nationality"
    EMPLOYER_CATEGORY = "employer_category"
    EMPLOYMENT_MONTHS = "employment_months"
    # income and affordability
    PAYSLIP_NET_AVG = "payslip_net_avg"
    BANK_SALARY_CREDIT_AVG = "bank_salary_credit_avg"
    NET_MONTHLY_INCOME = "net_monthly_income"
    INCOME_VARIANCE_RATIO = "income_variance_ratio"
    EXISTING_EMI_TOTAL = "existing_emi_total"
    PROPOSED_EMI = "proposed_emi"
    FOIR = "foir"
    # bureau
    CREDIT_SCORE = "credit_score"
    MAX_DPD_12M = "max_dpd_12m"
    MAX_DPD_24M = "max_dpd_24m"
    ENQUIRIES_6M = "enquiries_6m"
    WRITEOFF_SETTLEMENT_24M = "writeoff_settlement_24m"
    WRITEOFF_SETTLEMENT_OLDER = "writeoff_settlement_older"
    # bank health
    SALARY_CREDIT_MONTHS = "salary_credit_months"
    DEBIT_CREDIT_RATIO = "debit_credit_ratio"
    # KYC consistency and documents
    KYC_NAME_MATCH_SCORE = "kyc_name_match_score"
    KYC_DOB_MATCH = "kyc_dob_match"
    KYC_ID_LAST4_MATCH = "kyc_id_last4_match"
    REQUIRED_DOCS_PRESENT = "required_docs_present"
    # screening
    MIN_OCR_CONFIDENCE = "min_ocr_confidence"
    SIGNATURE_SIMILARITY = "signature_similarity"


class DataSource(str, Enum):
    APPLICATION = "APPLICATION"
    APPLICANT_RECORD = "APPLICANT_RECORD"
    BUREAU = "BUREAU"
    OCR_SALARY_SLIP = "OCR_SALARY_SLIP"
    OCR_BANK_STATEMENT = "OCR_BANK_STATEMENT"
    OCR_EMPLOYMENT_LETTER = "OCR_EMPLOYMENT_LETTER"
    OCR_PAN = "OCR_PAN"
    OCR_AADHAAR = "OCR_AADHAAR"
    OCR_MULTI = "OCR_MULTI"          # combines several OCR documents (e.g. KYC name match)
    DECLARED = "DECLARED"
    COMPUTED = "COMPUTED"
    EXISTING_KYC = "EXISTING_KYC"
    SIGNATURE_CHECK = "SIGNATURE_CHECK"
    NONE = "NONE"                    # missing; value is null


OCR_SOURCES = frozenset({DataSource.OCR_SALARY_SLIP, DataSource.OCR_BANK_STATEMENT,
                         DataSource.OCR_EMPLOYMENT_LETTER, DataSource.OCR_PAN,
                         DataSource.OCR_AADHAAR, DataSource.OCR_MULTI})


class DataPoint(StrictModel):
    value: float | int | bool | str | None = None
    source: DataSource
    fallback_used: bool = False
    low_confidence: bool = False
    source_document_ids: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def _consistent(self):
        if (self.value is None) != (self.source == DataSource.NONE):
            raise ValueError("value is null exactly when source is NONE")
        if self.low_confidence and self.source not in OCR_SOURCES | {DataSource.COMPUTED}:
            raise ValueError("only OCR-derived (or computed from OCR) values can be low confidence")
        if self.source in OCR_SOURCES and not self.source_document_ids:
            raise ValueError("an OCR value must name the documents it was read from")
        for doc in self.source_document_ids:
            if not doc.startswith("SYN-"):
                raise ValueError("source documents use synthetic ids")
        return self


class ZenInput(NoRawIdentifiers):
    schema_version: Literal["saral-zen-input/1"] = ZEN_INPUT_SCHEMA
    application_id: str = Field(pattern=SYNTHETIC_ID_PATTERN)
    applicant_id: str = Field(pattern=SYNTHETIC_ID_PATTERN)
    product_id: ProductId
    policy_version: str = Field(min_length=1, max_length=40)
    bureau_report_id: str | None = Field(default=None, pattern=SYNTHETIC_ID_PATTERN)
    extraction_ids: list[str] = Field(default_factory=list)
    segments: SegmentAssignment
    data_points: dict[DataPointName, DataPoint]
    prepared_at: datetime
    marker: SyntheticMarker = Field(default_factory=SyntheticMarker)

    @model_validator(mode="after")
    def _complete(self):
        missing = [n.value for n in DataPointName if n not in self.data_points]
        if missing:
            raise ValueError(f"every catalogued data point must be present (null when missing): {missing}")
        if self.segments.applicant_id != self.applicant_id:
            raise ValueError("segment assignment is for a different applicant")
        purpose = self.data_points[DataPointName.PURPOSE].value
        if purpose is not None and purpose != PURPOSE_OF[self.product_id]:
            raise ValueError(f"purpose {purpose!r} does not match product {self.product_id.value}")
        for e in self.extraction_ids:
            if not e.startswith("SYN-"):
                raise ValueError("extraction ids are synthetic")
        return self

    @property
    def missing_fields(self) -> list[str]:
        return [n.value for n, dp in self.data_points.items() if dp.value is None]

    def zen_context(self) -> dict:
        """Flat context for the JDM model: data point name -> value (null when missing)."""
        ctx = {n.value: dp.value for n, dp in self.data_points.items()}
        ctx["low_confidence_fields"] = sorted(n.value for n, dp in self.data_points.items() if dp.low_confidence)
        ctx["segments"] = [s.value for s in self.segments.segments]
        ctx["product_id"] = self.product_id.value
        return ctx


class ZenOutput(StrictModel):
    schema_version: Literal["saral-zen-output/1"] = ZEN_OUTPUT_SCHEMA
    application_id: str = Field(pattern=SYNTHETIC_ID_PATTERN)
    product_id: ProductId
    decision: Decision
    decline_reason_codes: list[str] = Field(default_factory=list)
    refer_reason_codes: list[str] = Field(default_factory=list)
    missing_fields: list[str] = Field(default_factory=list)
    not_for_live_use: bool
    trace: DecisionTrace
    marker: SyntheticMarker = Field(default_factory=SyntheticMarker)

    @model_validator(mode="after")
    def _agrees_with_trace(self):
        if self.trace.application_id != self.application_id:
            raise ValueError("trace belongs to another application")
        if self.decision != self.trace.decision:
            raise ValueError(f"decision {self.decision.value} disagrees with the trace ({self.trace.decision.value})")
        declines = sorted({r.reason_code for r in self.trace.rows if r.outcome == RowOutcome.DECLINE})
        refers = sorted({r.reason_code for r in self.trace.rows if r.outcome == RowOutcome.REFER})
        if sorted(set(self.decline_reason_codes)) != declines:
            raise ValueError(f"decline_reason_codes must be {declines}")
        if sorted(set(self.refer_reason_codes)) != refers:
            raise ValueError(f"refer_reason_codes must be {refers}")
        if self.trace.policy.status == "DRAFT" and not self.not_for_live_use:
            raise ValueError("a DRAFT policy's output must be stamped not_for_live_use")
        return self
