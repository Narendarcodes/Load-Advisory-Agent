"""Document extraction result (saral-document-extraction/1).

Aligned with PR #41 (``loan_advisory_portal.ocr.schemas.ExtractionResult``, commit
dd45a2f): the same document kinds, the same field keys and the same field statuses,
with OCR confidence on Tesseract's 0..100 scale. This contract adds what ZEN needs and
PR #41 does not carry: a source reference on every field (document id, page) and the
applicant / document ids that tie the extraction to the applicant record.

``signature_specimen`` is listed for the experimental signature check; PR #41 has no
signature handling.
"""
from __future__ import annotations

import re
from datetime import date, datetime
from enum import Enum
from typing import Literal

from pydantic import Field, model_validator

from contracts.common import (
    MASKED_AADHAAR_PATTERN,
    MASKED_PAN_PATTERN,
    SYNTHETIC_ID_PATTERN,
    NoRawIdentifiers,
    StrictModel,
    SyntheticMarker,
)

EXTRACTION_SCHEMA = "saral-document-extraction/1"

# PR #41 validator.LOW_CONFIDENCE: Tesseract confidence below this marks a field
# LOW_CONFIDENCE. It is an OCR engineering constant, not a lending threshold. The ZEN
# screening floor is a separate, approval-pending value (THRESHOLD_APPROVALS A-18).
PR41_LOW_CONFIDENCE = 60.0


class DocumentKind(str, Enum):
    SALARY_SLIP = "salary_slip"
    BANK_STATEMENT = "bank_statement"
    EMPLOYMENT_LETTER = "employment_letter"
    PAN_CARD = "pan_card"
    AADHAAR_CARD = "aadhaar_card"
    SIGNATURE_SPECIMEN = "signature_specimen"   # experimental; not in PR #41
    UNKNOWN = "unknown"


class FieldStatus(str, Enum):
    FOUND = "found"
    LOW_CONFIDENCE = "low_confidence"
    MISSING = "missing"
    INVALID = "invalid"


# Field keys per kind, as produced by PR #41's document_parser.
FIELD_KEYS: dict[DocumentKind, frozenset[str]] = {
    DocumentKind.SALARY_SLIP: frozenset({
        "employee_name", "employer_name", "pay_period", "salary_date", "basic_salary",
        "gross_salary", "total_deductions", "net_salary"}),
    DocumentKind.BANK_STATEMENT: frozenset({
        "account_holder", "statement_period", "salary_credits", "salary_credit_months",
        "total_credits", "total_debits", "closing_balance", "transaction_count"}),
    DocumentKind.EMPLOYMENT_LETTER: frozenset({
        "employee_name", "employer_name", "designation", "employment_start_date",
        "employment_months", "monthly_gross"}),
    DocumentKind.PAN_CARD: frozenset({"pan_number", "name", "date_of_birth"}),
    DocumentKind.AADHAAR_CARD: frozenset({"aadhaar_number", "name", "date_of_birth", "gender", "address"}),
    DocumentKind.SIGNATURE_SPECIMEN: frozenset({"signature_present"}),
    DocumentKind.UNKNOWN: frozenset(),
}


class SourceRef(StrictModel):
    """Where on which document a value was read."""

    document_id: str = Field(pattern=SYNTHETIC_ID_PATTERN)
    kind: DocumentKind
    page: int = Field(ge=1, le=500)
    line_index: int | None = Field(default=None, ge=0)


Value = float | int | bool | date | str | None


class ExtractedFieldValue(StrictModel):
    key: str = Field(pattern=r"^[a-z][a-z0-9_]*$")
    value: Value = None
    status: FieldStatus
    ocr_confidence: float | None = Field(default=None, ge=0, le=100)
    source: SourceRef
    note: str | None = Field(default=None, max_length=200)

    @model_validator(mode="after")
    def _status_rules(self):
        if self.status == FieldStatus.MISSING and self.value is not None:
            raise ValueError(f"{self.key}: a MISSING field has value=null")
        if self.status == FieldStatus.INVALID and self.value is not None:
            raise ValueError(f"{self.key}: an INVALID field has value=null (PR #41 behaviour)")
        if self.status in (FieldStatus.FOUND, FieldStatus.LOW_CONFIDENCE) and self.value is None:
            raise ValueError(f"{self.key}: a FOUND/LOW_CONFIDENCE field needs a value")
        if self.ocr_confidence is not None:
            low = self.ocr_confidence < PR41_LOW_CONFIDENCE
            if self.status == FieldStatus.FOUND and low:
                raise ValueError(
                    f"{self.key}: confidence {self.ocr_confidence} < {PR41_LOW_CONFIDENCE} must be LOW_CONFIDENCE")
            if self.status == FieldStatus.LOW_CONFIDENCE and not low:
                raise ValueError(f"{self.key}: LOW_CONFIDENCE needs confidence < {PR41_LOW_CONFIDENCE}")
        if self.key == "pan_number" and self.value is not None:
            if not isinstance(self.value, str) or not re.fullmatch(MASKED_PAN_PATTERN, self.value):
                raise ValueError("pan_number must be masked as XXXXX1234X")
        if self.key == "aadhaar_number" and self.value is not None:
            if not isinstance(self.value, str) or not re.fullmatch(MASKED_AADHAAR_PATTERN, self.value):
                raise ValueError("aadhaar_number must be masked as 'XXXX XXXX 1234'")
        return self

    @property
    def needs_review(self) -> bool:
        return self.status != FieldStatus.FOUND


class DocumentRef(StrictModel):
    document_id: str = Field(pattern=SYNTHETIC_ID_PATTERN)
    kind: DocumentKind
    uploaded_at: datetime
    pages: int = Field(ge=1, le=500)
    sha256: str = Field(pattern=r"^[0-9a-f]{64}$")


class EngineInfo(StrictModel):
    name: Literal["tesseract", "text-layer", "synthetic-fixture"]
    version: str = Field(min_length=1, max_length=40)


class DocumentExtraction(NoRawIdentifiers):
    schema_version: Literal["saral-document-extraction/1"] = EXTRACTION_SCHEMA
    extraction_id: str = Field(pattern=SYNTHETIC_ID_PATTERN)
    applicant_id: str = Field(pattern=SYNTHETIC_ID_PATTERN)
    document: DocumentRef
    engine: EngineInfo
    extracted_at: datetime
    fields: dict[str, ExtractedFieldValue]
    warnings: list[str] = Field(default_factory=list)
    marker: SyntheticMarker = Field(default_factory=SyntheticMarker)

    @model_validator(mode="after")
    def _fields_match_document(self):
        allowed = FIELD_KEYS[self.document.kind]
        for key, fv in self.fields.items():
            if key != fv.key:
                raise ValueError(f"fields[{key!r}] carries key {fv.key!r}")
            if key not in allowed:
                raise ValueError(f"{key!r} is not a field of {self.document.kind.value}")
            if fv.source.document_id != self.document.document_id or fv.source.kind != self.document.kind:
                raise ValueError(f"{key}: source must be this extraction's document")
            if fv.source.page > self.document.pages:
                raise ValueError(f"{key}: page {fv.source.page} beyond the document's {self.document.pages} pages")
        if self.extracted_at < self.document.uploaded_at:
            raise ValueError("extracted_at is before the upload")
        return self

    @property
    def requires_review(self) -> bool:
        return not self.fields or any(f.needs_review for f in self.fields.values())

    @property
    def min_confidence(self) -> float | None:
        values = [f.ocr_confidence for f in self.fields.values() if f.ocr_confidence is not None]
        return min(values) if values else None


class SignatureCheck(StrictModel):
    """Experimental signature similarity (no module exists yet). Screening input only."""

    reference_document_id: str = Field(pattern=SYNTHETIC_ID_PATTERN)
    candidate_document_id: str = Field(pattern=SYNTHETIC_ID_PATTERN)
    similarity: float = Field(ge=0.0, le=1.0)
    method: str = Field(min_length=1, max_length=60)
    experimental: Literal[True] = True

    @model_validator(mode="after")
    def _distinct(self):
        if self.reference_document_id == self.candidate_document_id:
            raise ValueError("a signature cannot be compared with itself")
        return self
