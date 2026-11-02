"""Structured extraction results.

Deliberately dataclasses rather than pydantic models: this package runs inside the
Frappe site (whose environment does not install pydantic for the portal) and inside the
root pytest suite, and the result is handed to the browser as plain JSON either way.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class DocumentKind(str, Enum):
    """A supported document family, independent of whatever label a site uses for it."""

    SALARY_SLIP = "salary_slip"
    BANK_STATEMENT = "bank_statement"
    EMPLOYMENT_LETTER = "employment_letter"
    PAN_CARD = "pan_card"
    AADHAAR_CARD = "aadhaar_card"
    UNKNOWN = "unknown"


class FieldStatus(str, Enum):
    FOUND = "found"
    LOW_CONFIDENCE = "low_confidence"
    MISSING = "missing"
    INVALID = "invalid"


@dataclass(frozen=True)
class TextLine:
    """One recognised line. `confidence` is Tesseract's mean word confidence (0..100)."""

    text: str
    confidence: float = 100.0


@dataclass
class ExtractedField:
    key: str
    label: str
    value: Any = None
    status: FieldStatus = FieldStatus.MISSING
    confidence: float | None = None
    note: str | None = None

    @property
    def needs_review(self) -> bool:
        return self.status in (FieldStatus.MISSING, FieldStatus.LOW_CONFIDENCE, FieldStatus.INVALID)

    def as_dict(self) -> dict:
        return {
            "key": self.key,
            "label": self.label,
            "value": self.value,
            "status": self.status.value,
            "confidence": self.confidence,
            "note": self.note,
            "needs_review": self.needs_review,
        }


@dataclass
class ExtractionResult:
    document_type: str
    kind: DocumentKind
    engine: str
    engine_version: str
    pages: int
    fields: dict[str, ExtractedField] = field(default_factory=dict)
    warnings: list[str] = field(default_factory=list)
    used_text_layer: bool = False

    @property
    def requires_review(self) -> bool:
        """True when at least one field must be looked at before it is used."""
        return any(f.needs_review for f in self.fields.values()) or not self.fields

    @property
    def review_count(self) -> int:
        return sum(1 for f in self.fields.values() if f.needs_review)

    def as_dict(self) -> dict:
        """Browser-safe shape. Contains no raw document text, by construction."""
        return {
            "document_type": self.document_type,
            "kind": self.kind.value,
            "engine": self.engine,
            "engine_version": self.engine_version,
            "pages": self.pages,
            "used_text_layer": self.used_text_layer,
            "fields": {key: value.as_dict() for key, value in self.fields.items()},
            "warnings": list(self.warnings),
            "requires_review": self.requires_review,
            "review_count": self.review_count,
        }
