"""Fallback chain: PaddleOCR -> Tesseract -> manual review. EXPERIMENTAL (bake-off branch).

Proposed integration, not wired into the API. It keeps PR #41's contract intact:

* `pipeline.extract_document` (Tesseract) is untouched and remains the default.
* Both engines feed the *same* `document_parser.parse`, so field rules live in one place.
* Each attempt is scored on the document's critical fields; the first attempt that clears
  the gate is used, otherwise the better attempt is returned with ``route="manual_review"``.
* `zen_inputs` turns per-field status/confidence into flat values a ZEN rule can read
  (e.g. ``ocr_net_salary_confidence``); ZEN decides, OCR never does.

    from loan_advisory_portal.ocr.chain import extract_document_chain
    outcome = extract_document_chain("Salary Slip", content, "slip.jpg")
    outcome.route            # "paddle" | "tesseract" | "manual_review"
    outcome.result.as_dict() # same browser-safe shape as PR #41
    outcome.zen_inputs()     # {"ocr_engine": ..., "ocr_net_salary_confidence": 0.97, ...}
"""

from __future__ import annotations

import os
import time
from dataclasses import dataclass, field

from .document_parser import parse
from .extractor import ExtractionFailed, OcrUnavailable, extract_lines, tesseract_version
from .field_checks import Check, apply_field_checks, check_raw_identifiers
from .schemas import DocumentKind, ExtractionResult, FieldStatus

# Fields that must be FOUND (not missing, invalid or low-confidence) for an attempt to pass.
CRITICAL_FIELDS: dict[DocumentKind, tuple[str, ...]] = {
    DocumentKind.PAN_CARD: ("pan_number", "date_of_birth"),
    DocumentKind.AADHAAR_CARD: ("date_of_birth",),
    DocumentKind.SALARY_SLIP: ("net_salary", "employee_name"),
    DocumentKind.BANK_STATEMENT: ("salary_credits", "account_holder"),
    DocumentKind.EMPLOYMENT_LETTER: ("employer_name", "employment_start_date"),
}
DEFAULT_ORDER = tuple(e.strip() for e in os.environ.get("SARAL_OCR_ENGINES", "paddle,tesseract").split(",") if e.strip())


@dataclass
class Attempt:
    engine: str
    result: ExtractionResult | None
    seconds: float
    error: str | None = None
    checks: list[Check] = field(default_factory=list)

    @property
    def critical_found(self) -> int:
        if self.result is None:
            return -1
        keys = CRITICAL_FIELDS.get(self.result.kind, ())
        return sum(1 for k in keys if k in self.result.fields and self.result.fields[k].status is FieldStatus.FOUND)

    @property
    def passes(self) -> bool:
        if self.result is None:
            return False
        return self.critical_found == len(CRITICAL_FIELDS.get(self.result.kind, ("_",)))


@dataclass
class ChainOutcome:
    result: ExtractionResult | None
    route: str
    attempts: list[Attempt]

    def zen_inputs(self) -> dict:
        """Flat, numeric, no raw values: what a ZEN rule may read about OCR quality."""
        out: dict = {"ocr_route": self.route, "ocr_needs_manual_review": self.route == "manual_review"}
        if self.result is None:
            return out
        out["ocr_engine"] = self.result.engine
        for key, item in self.result.fields.items():
            out[f"ocr_{key}_status"] = item.status.value
            out[f"ocr_{key}_confidence"] = (round(item.confidence / 100, 3)
                                            if item.confidence is not None else None)
        return out


def _run(engine: str, document_type: str, content: bytes, filename: str,
         synthetic: bool | None = None) -> Attempt:
    started = time.perf_counter()
    try:
        if engine == "paddle":
            from .paddle_engine import engine_version, extract_lines_paddle  # noqa: PLC0415
            lines, pages, used_text_layer = extract_lines_paddle(content, filename)
            version = engine_version()
        elif engine == "tesseract":
            lines, pages, used_text_layer = extract_lines(content, filename)
            try:
                version = tesseract_version()
            except OcrUnavailable:
                version = "text layer only" if used_text_layer else "unknown"
        else:
            raise ValueError(f"unknown OCR engine {engine!r}")
        if not lines:
            raise ExtractionFailed("No text could be recognised in this document.")
        text = "\n".join(line.text for line in lines)
        raw_checks = check_raw_identifiers(text, synthetic=synthetic)
        fields, warnings, kind = parse(document_type, lines, text, synthetic=synthetic)
        del text  # raw text never leaves this function
        result = ExtractionResult(document_type=document_type or "Unknown", kind=kind, engine=engine,
                                  engine_version=version, pages=pages, fields=fields, warnings=warnings,
                                  used_text_layer=used_text_layer)
        checks = raw_checks + apply_field_checks(result)
        for check in raw_checks:
            item = result.fields.get(check.field)
            if not check.passed and item is not None and item.status is FieldStatus.FOUND:
                item.status = FieldStatus.INVALID
                item.note = check.note
        return Attempt(engine, result, time.perf_counter() - started, checks=checks)
    except (OcrUnavailable, ExtractionFailed) as exc:
        return Attempt(engine, None, time.perf_counter() - started, error=type(exc).__name__)


def extract_document_chain(document_type: str, content: bytes, filename: str,
                           engines: tuple[str, ...] = DEFAULT_ORDER, *,
                           synthetic: bool | None = None) -> ChainOutcome:
    attempts: list[Attempt] = []
    for engine in engines:
        attempt = _run(engine, document_type, content, filename, synthetic=synthetic)
        attempts.append(attempt)
        if attempt.passes:
            return ChainOutcome(attempt.result, engine, attempts)
    best = max(attempts, key=lambda a: a.critical_found, default=None)
    return ChainOutcome(best.result if best else None, "manual_review", attempts)


__all__ = ["CRITICAL_FIELDS", "ChainOutcome", "extract_document_chain"]
