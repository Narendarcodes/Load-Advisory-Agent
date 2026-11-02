"""One call: bytes in, reviewed extraction out.

    result = extract_document("Salary Slip", content, "slip.png")
    result.as_dict()

The pipeline is the only place that sees raw recognised text, and it drops it before
returning. Callers get structured fields, statuses and warnings — never the document text,
never an unmasked PAN or Aadhaar number.
"""

from .document_parser import parse
from .extractor import (
    ExtractionFailed,
    OcrError,
    OcrUnavailable,
    extract_lines,
    tesseract_version,
)
from .schemas import DocumentKind, ExtractionResult, FieldStatus

ENGINE = "tesseract"

# Salary slip -> the existing underwriting fields. `custom_monthly_income` is the one the
# ZEN adapter reads (`monthly_income` in UnderwritingInput).
_SALARY_MAP = (
    ("net_salary", "custom_monthly_income"),
    ("gross_salary", "custom_monthly_income"),
)
_BANK_MAP = (("salary_credits", "custom_monthly_income"),)


def extract_document(document_type: str, content: bytes, filename: str) -> ExtractionResult:
    """Run extraction for one document.

    Raises `UnsupportedDocument`, `ExtractionFailed` or `OcrUnavailable`; those are the
    three conditions a borrower can act on (choose another file, re-scan, install the
    engine). A readable document always returns a result, even when every field is missing.
    """
    lines, pages, used_text_layer = extract_lines(content, filename)

    if not lines:
        raise ExtractionFailed(
            "No text could be recognised in this document. Try a clearer scan or photo."
        )

    text = "\n".join(line.text for line in lines)
    fields, warnings, kind = parse(document_type, lines, text)

    if kind is DocumentKind.UNKNOWN:
        warnings.insert(
            0,
            "This document could not be matched to a supported type; no fields were read.",
        )

    result = ExtractionResult(
        document_type=document_type or "Unknown",
        kind=kind,
        engine=ENGINE,
        engine_version=_engine_version(used_text_layer),
        pages=pages,
        fields=fields,
        warnings=warnings,
        used_text_layer=used_text_layer,
    )
    # Never return raw text by accident: `text` goes out of scope here.
    del text
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


__all__ = ["ENGINE", "OcrError", "extract_document", "suggested_application_values"]
