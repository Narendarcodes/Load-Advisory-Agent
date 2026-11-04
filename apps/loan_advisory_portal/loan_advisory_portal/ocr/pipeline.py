"""One call: bytes in, reviewed extraction out.

    result = extract_document("Salary Slip", content, "slip.png")
    result.as_dict()

The pipeline is the only place that sees raw recognised text, and it drops it before
returning. Callers get structured fields, statuses and warnings — never the document text,
never an unmasked PAN or Aadhaar number.
"""

from .chain import engine_order, extract_document_chain
from .extractor import (
    ExtractionFailed,
    OcrError,
    OcrUnavailable,
    tesseract_version,
    validate_document,
)
from .schemas import DocumentKind, ExtractionResult, FieldStatus

# The default engine. PaddleOCR PP-OCRv5 mobile reads first; Tesseract takes over when Paddle
# is not installed, fails, or reads a critical field with low confidence (see `chain`).
# `SARAL_OCR_ENGINES=tesseract` restores the Tesseract-only path.
ENGINE = "paddle"

REVIEW_WARNING = ("Some details on this document could not be read clearly. "
                  "They will be checked by a person before they are used.")

# Salary slip -> the existing underwriting fields. `custom_monthly_income` is the one the
# ZEN adapter reads (`monthly_income` in UnderwritingInput).
_SALARY_MAP = (
    ("net_salary", "custom_monthly_income"),
    ("gross_salary", "custom_monthly_income"),
)
_BANK_MAP = (("salary_credits", "custom_monthly_income"),)


def extract_document(document_type: str, content: bytes, filename: str, *,
                     synthetic: bool | None = None,
                     engines: tuple[str, ...] | None = None) -> ExtractionResult:
    """Run extraction for one document: Paddle first, Tesseract as the automatic fallback.

    ``synthetic`` is True only for a document or request flagged synthetic (server-side
    state, never a browser value); None follows the SARAL_SYNTHETIC_MODE setting. See
    `ocr.synthetic` for what synthetic mode accepts. ``engines`` overrides
    ``SARAL_OCR_ENGINES`` for one call.

    Raises `UnsupportedDocument`, `ExtractionFailed` or `OcrUnavailable`; those are the
    three conditions a borrower can act on (choose another file, re-scan, install the
    engine). A readable document always returns a result, even when every field is missing.
    """
    validate_document(content, filename)  # refuse a bad file once, before any engine runs
    outcome = extract_document_chain(document_type, content, filename, engines or engine_order(),
                                     synthetic=synthetic)
    result = outcome.result
    if result is None:
        errors = {attempt.error for attempt in outcome.attempts}
        if errors and errors <= {"OcrUnavailable"}:
            # The last engine is the fallback (Tesseract): its message says what to install.
            raise OcrUnavailable(outcome.attempts[-1].message or "No OCR engine is available on this machine.")
        raise ExtractionFailed(
            "No text could be recognised in this document. Try a clearer scan or photo."
        )

    if result.kind is DocumentKind.UNKNOWN:
        result.warnings.insert(
            0,
            "This document could not be matched to a supported type; no fields were read.",
        )
    elif outcome.route == "manual_review" and REVIEW_WARNING not in result.warnings:
        result.warnings.append(REVIEW_WARNING)
    # Raw recognised text never leaves the chain; only structured, masked fields are here.
    return result


def _engine_version(used_text_layer: bool) -> str:
    """A text-layer PDF needs no OCR, so a missing Tesseract is not an error for it."""
    try:
        return tesseract_version()
    except OcrUnavailable:
        return "text layer only" if used_text_layer else "unknown"


def suggested_application_values(result: ExtractionResult) -> dict[str, dict]:
    """Values offered as *prefill* for the existing apply/resubmit form.

    Nothing here writes to a Loan Application. The applicant confirms in the UI and the
    existing endpoint stays the only writer of scored fields.

    Each entry is ``{"value", "source", "status"}``; only fields that were read are offered.
    """
    suggestions: dict[str, dict] = {}
    mapping = {
        DocumentKind.SALARY_SLIP: _SALARY_MAP,
        DocumentKind.BANK_STATEMENT: _BANK_MAP,
    }.get(result.kind, ())

    for source_key, target_field in mapping:
        item = result.fields.get(source_key)
        if item is None or item.status not in (FieldStatus.FOUND, FieldStatus.LOW_CONFIDENCE):
            continue
        if item.value in (None, ""):
            continue
        if target_field in suggestions:
            continue  # net salary wins over gross
        suggestions[target_field] = {
            "value": item.value,
            "source": source_key,
            "status": item.status.value,
            "needs_review": item.needs_review,
        }

    if result.kind is DocumentKind.EMPLOYMENT_LETTER:
        months = result.fields.get("employment_months")
        if months and months.status in (FieldStatus.FOUND, FieldStatus.LOW_CONFIDENCE):
            suggestions["custom_employment_months"] = {
                "value": months.value,
                "source": "employment_months",
                "status": months.status.value,
                "needs_review": months.needs_review,
            }

    return suggestions


__all__ = ["ENGINE", "REVIEW_WARNING", "OcrError", "engine_order", "extract_document",
           "suggested_application_values"]
