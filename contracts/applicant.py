"""Applicant record (saral-applicant/1).

The applicant record is where the synthetic bureau pull is *stored* (as a pointer and
digest, not the full report) before OCR and ZEN run. Identity numbers are never held
in full: PAN masked as ``XXXXX1234X`` and Aadhaar as its last four digits.
"""
from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import Literal

from pydantic import Field, model_validator

from contracts.common import (
    AADHAAR_LAST4_PATTERN,
    MASKED_PAN_PATTERN,
    SYNTHETIC_ID_PATTERN,
    NoRawIdentifiers,
    StrictModel,
    SyntheticMarker,
)

APPLICANT_SCHEMA = "saral-applicant/1"


class EmploymentType(str, Enum):
    SALARIED = "SALARIED"
    SELF_EMPLOYED = "SELF_EMPLOYED"


class EmployerCategory(str, Enum):
    """Bajaj lists "Employed with: Public, private, or MNC" (BFL-PL-SALARIED#004)."""

    PUBLIC = "PUBLIC"
    PRIVATE = "PRIVATE"
    MNC = "MNC"
    OTHER = "OTHER"
    NOT_APPLICABLE = "NOT_APPLICABLE"   # self-employed


class Consents(StrictModel):
    """Time-stamped consents. A bureau pull without ``bureau_pull_at`` is a contract error."""

    bureau_pull_at: datetime | None = None
    document_processing_at: datetime | None = None


class BureauSnapshotRef(StrictModel):
    """The bureau report as stored on the applicant record: a pointer plus a digest.

    The full report lives in the bureau store; ZEN reads it through ``BureauReport``.
    """

    report_id: str = Field(pattern=SYNTHETIC_ID_PATTERN)
    provider_schema: Literal["bureau-report/1"] = "bureau-report/1"
    report_date: date
    fetched_at: datetime
    snapshot_sha256: str = Field(pattern=r"^[0-9a-f]{64}$")


class Applicant(NoRawIdentifiers):
    schema_version: Literal["saral-applicant/1"] = APPLICANT_SCHEMA
    applicant_id: str = Field(pattern=SYNTHETIC_ID_PATTERN)
    full_name: str = Field(min_length=2, max_length=120, description="Synthetic name")
    date_of_birth: date
    nationality: str = Field(pattern=r"^[A-Z]{2}$", description="ISO 3166-1 alpha-2, e.g. IN")
    pan_masked: str = Field(pattern=MASKED_PAN_PATTERN, description="XXXXX + 4 digits + X; never the full PAN")
    aadhaar_last4: str = Field(pattern=AADHAAR_LAST4_PATTERN, description="Last four Aadhaar digits only")
    residence_city: str = Field(min_length=2, max_length=60)
    employment_type: EmploymentType
    employer_category: EmployerCategory
    declared_monthly_income: float | None = Field(default=None, gt=0, le=100_000_000)
    declared_monthly_obligations: float | None = Field(default=None, ge=0, le=100_000_000)
    existing_customer: bool = False
    consents: Consents = Field(default_factory=Consents)
    bureau_snapshot: BureauSnapshotRef | None = None
    created_at: datetime
    marker: SyntheticMarker = Field(default_factory=SyntheticMarker)

    @model_validator(mode="after")
    def _consistency(self):
        if self.bureau_snapshot is not None and self.consents.bureau_pull_at is None:
            raise ValueError("a bureau snapshot requires a recorded bureau_pull consent")
        if self.bureau_snapshot is not None and self.consents.bureau_pull_at is not None:
            if self.bureau_snapshot.fetched_at < self.consents.bureau_pull_at:
                raise ValueError("bureau was fetched before consent was recorded")
        if self.employment_type == EmploymentType.SELF_EMPLOYED and \
                self.employer_category != EmployerCategory.NOT_APPLICABLE:
            raise ValueError("self-employed applicants use employer_category=NOT_APPLICABLE")
        if self.employment_type == EmploymentType.SALARIED and \
                self.employer_category == EmployerCategory.NOT_APPLICABLE:
            raise ValueError("salaried applicants need an employer_category")
        if self.date_of_birth >= self.created_at.date():
            raise ValueError("date_of_birth must be before the record was created")
        return self

    def age_on(self, on: date) -> int:
        """Completed years on a date."""
        years = on.year - self.date_of_birth.year
        if (on.month, on.day) < (self.date_of_birth.month, self.date_of_birth.day):
            years -= 1
        return years
