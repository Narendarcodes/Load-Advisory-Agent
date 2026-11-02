"""Value validation and cross-field checks.

Deterministic only: a checksum, a format, a range and a few accounting identities. The
module never guesses a value it did not read, and never turns a suspicious value into a
plausible one.
"""

import re
from datetime import date, datetime

from .masking import mask_sensitive_text
from .schemas import ExtractedField, FieldStatus, TextLine

# Tesseract word confidence below this is reported as "low confidence" for the whole line.
LOW_CONFIDENCE = 60.0
MAX_AMOUNT = 100_000_000.0  # same ceiling as UnderwritingInput / the what-if form

_MONTHS = {
    "jan": 1, "january": 1, "feb": 2, "february": 2, "mar": 3, "march": 3,
    "apr": 4, "april": 4, "may": 5, "jun": 6, "june": 6, "jul": 7, "july": 7,
    "aug": 8, "august": 8, "sep": 9, "sept": 9, "september": 9, "oct": 10, "october": 10,
    "nov": 11, "november": 11, "dec": 12, "december": 12,
}

_DATE_FORMATS = ("%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y", "%Y-%m-%d", "%d/%m/%y", "%d-%m-%y")

# --------------------------------------------------------------------------- checksums

_D = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6], [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8], [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4], [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
]
_P = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2], [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0], [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
]


def verhoeff_valid(number: str) -> bool:
    """Aadhaar's check digit. Rejects misread digits instead of accepting a plausible 12-digit number."""
    digits = re.sub(r"\D", "", number or "")
    if len(digits) != 12 or digits[0] in "01":
        return False
    checksum = 0
    for index, character in enumerate(reversed(digits)):
        checksum = _D[checksum][_P[index % 8][int(character)]]
    return checksum == 0


def pan_format_valid(value: str) -> bool:
    cleaned = re.sub(r"[^A-Z0-9]", "", (value or "").upper())
    return bool(re.fullmatch(r"[A-Z]{5}\d{4}[A-Z]", cleaned))


# --------------------------------------------------------------------------- value parsers

_AMOUNT_RE = re.compile(r"(?:rs|inr|₹)?\.?\s*(\d[\d,]*(?:\.\d{1,2})?)\s*(lakh|lac|lakhs|crore|cr|k|thousand)?", re.I)


def parse_amount(raw: str) -> float | None:
    """`Rs. 1,20,000.00` -> 120000.0; `1.2 lakh` -> 120000.0; anything else -> None."""
    if not raw:
        return None
    match = _AMOUNT_RE.search(raw)
    if not match:
        return None
    try:
        value = float(match.group(1).replace(",", ""))
    except ValueError:
        return None
    unit = (match.group(2) or "").lower()
    if unit in ("lakh", "lac", "lakhs"):
        value *= 100_000
    elif unit in ("crore", "cr"):
        value *= 10_000_000
    elif unit in ("k", "thousand"):
        value *= 1_000
    return round(value, 2)


def parse_date(raw: str, *, today: date | None = None) -> str | None:
    """Normalise a date to ISO `YYYY-MM-DD`, or None when it cannot be read exactly."""
    text = (raw or "").strip().rstrip(".")
    if not text:
        return None
    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(text, fmt).date().isoformat()
        except ValueError:
            continue
    match = re.fullmatch(r"(\d{1,2})[\s-]+([A-Za-z]{3,9})[,\s-]+(\d{4})", text)
    if match and match.group(2).lower()[:3] in _MONTHS:
        try:
            return date(int(match.group(3)), _MONTHS[match.group(2).lower()[:3]], int(match.group(1))).isoformat()
        except ValueError:
            return None
    return None


def months_between(start_iso: str, end: date | None = None) -> int | None:
    """Whole months between two dates; used for employment tenure, never guessed."""
    try:
        start = date.fromisoformat(start_iso)
    except (TypeError, ValueError):
        return None
    end = end or date.today()
    if start > end:
        return None
    months = (end.year - start.year) * 12 + (end.month - start.month)
    if end.day < start.day:
        months -= 1
    return max(months, 0)


# --------------------------------------------------------------------------- field helpers

def field(key: str, label: str, value=None, *, confidence: float | None = None,
          note: str | None = None) -> ExtractedField:
    """Build a field, marking an unread value as missing rather than inventing one."""
    if value in (None, ""):
        return ExtractedField(key=key, label=label, value=None, status=FieldStatus.MISSING,
                              confidence=None, note=note)
    if isinstance(value, str):
        value = mask_sensitive_text(value)
    status = FieldStatus.LOW_CONFIDENCE if confidence is not None and confidence < LOW_CONFIDENCE else FieldStatus.FOUND
    return ExtractedField(key=key, label=label, value=value, status=status, confidence=confidence, note=note)


def money_field(key: str, label: str, raw: str | None, *, confidence: float | None = None,
                minimum: float = 0.0) -> ExtractedField:
    if not raw:
        return field(key, label)
    amount = parse_amount(raw)
    if amount is None:
        return ExtractedField(key=key, label=label, value=None, status=FieldStatus.INVALID,
                              confidence=confidence, note="could not read this amount")
    if amount < minimum or amount > MAX_AMOUNT:
        return ExtractedField(key=key, label=label, value=amount, status=FieldStatus.INVALID,
                              confidence=confidence, note="amount is outside a plausible range")
    return field(key, label, amount, confidence=confidence)


def confidence_of(line: TextLine | None) -> float | None:
    return round(float(line.confidence), 1) if line is not None else None


# --------------------------------------------------------------------------- cross checks

def review_amounts(fields: dict[str, ExtractedField]) -> list[str]:
    """Accounting identities that a salary slip must satisfy. Returns human-readable warnings."""
    warnings = []
    gross = _value(fields, "gross_salary")
    net = _value(fields, "net_salary")
    basic = _value(fields, "basic_salary")
    deductions = _value(fields, "total_deductions")

    if basic and gross and basic > gross:
        _invalidate(fields, "basic_salary", "basic salary is higher than gross salary")
        warnings.append("Basic salary is higher than gross salary; check both values.")
    if net and gross and net > gross:
        _invalidate(fields, "net_salary", "net salary is higher than gross salary")
        warnings.append("Net salary is higher than gross salary; check both values.")
    if gross and net and deductions:
        expected = round(gross - deductions, 2)
        if abs(expected - net) > max(1.0, gross * 0.02):
            warnings.append("Gross, deductions and net do not add up; check the three values.")
    if gross and deductions and deductions > gross:
        _invalidate(fields, "total_deductions", "deductions exceed gross salary")
        warnings.append("Total deductions are higher than gross salary; check both values.")
    return warnings


def _value(fields: dict[str, ExtractedField], key: str):
    item = fields.get(key)
    return item.value if item and item.status != FieldStatus.INVALID else None


def _invalidate(fields: dict[str, ExtractedField], key: str, note: str) -> None:
    item = fields.get(key)
    if item is None:
        return
    item.status = FieldStatus.INVALID
    item.note = note
