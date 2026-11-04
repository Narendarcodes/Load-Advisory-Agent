"""Tesseract OCR for borrower documents.

Pure Python: no `frappe` import anywhere in this package, so the parsing rules can be
unit-tested without a bench and reused by any caller that holds the document bytes.

    from loan_advisory_portal.ocr import extract_document
    result = extract_document("Salary Slip", content, "slip.png")

`extract_document` never returns raw recognised text, never writes a temporary file and
never masks after the fact: PAN and Aadhaar values are masked inside the parser so the
unmasked form exists only in local variables.
"""

from .extractor import (
    ALLOWED_EXTENSIONS,
    MAX_BYTES,
    ExtractionFailed,
    OcrError,
    OcrUnavailable,
    UnsupportedDocument,
    is_available,
    tesseract_version,
    validate_document,
)
from .pipeline import extract_document, suggested_application_values
from .schemas import DocumentKind, ExtractedField, ExtractionResult, FieldStatus, TextLine

__all__ = [
    "ALLOWED_EXTENSIONS",
    "MAX_BYTES",
    "DocumentKind",
    "ExtractedField",
    "ExtractionFailed",
    "ExtractionResult",
    "FieldStatus",
    "OcrError",
    "OcrUnavailable",
    "TextLine",
    "UnsupportedDocument",
    "extract_document",
    "is_available",
    "suggested_application_values",
    "tesseract_version",
    "validate_document",
]
