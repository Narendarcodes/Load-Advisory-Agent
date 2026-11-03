"""Engine-independent validation run after parsing. EXPERIMENTAL (bake-off branch).

PR #41 already validates inside the parser (PAN pattern match, Aadhaar Verhoeff, amount
ranges, salary-slip arithmetic). This module adds the checks the bake-off showed were
missing and records every check it ran, so a reviewer (and ZEN) can see *why* a field
was downgraded:

* ``pan_regex``      - the full PAN read from the page matches ``[A-Z]{5}[0-9]{4}[A-Z]`` and its
                       4th character is a valid holder-type letter. Run on the raw candidate
                       *before* masking, by `check_raw_identifiers`.
* ``aadhaar_verhoeff`` - 12 digits, first digit not 0/1, Verhoeff checksum passes.
* ``date_sanity``    - DOB gives an age of 18..100 and is not in the future; an employment
                       start is not in the future and not before the applicant turned 14
                       (when a DOB is known); a salary date is within the last 400 days.

A failed check sets the field to INVALID with a note. Nothing here ever fills a value in.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date, timedelta

from .schemas import DocumentKind, ExtractionResult, FieldStatus
from .validator import pan_format_valid, verhoeff_valid

# 4th PAN character: holder type (P person, C company, H HUF, F firm, A AOP, T trust,
# B BOI, L local authority, J artificial juridical person, G government).
PAN_HOLDER_TYPES = set("PCHFATBLJG")
PAN_STRICT_RE = re.compile(r"^[A-Z]{3}[PCHFATBLJG][A-Z]\d{4}[A-Z]$")


@dataclass
class Check:
    field: str
    check: str
    passed: bool
    note: str = ""

    def as_dict(self) -> dict:
        return {"field": self.field, "check": self.check, "passed": self.passed, "note": self.note}


def pan_ok(value: str) -> bool:
    cleaned = re.sub(r"[^A-Z0-9]", "", (value or "").upper())
    return pan_format_valid(cleaned) and bool(PAN_STRICT_RE.match(cleaned))


def aadhaar_ok(value: str) -> bool:
    return verhoeff_valid(value)


def _iso(value) -> date | None:
    try:
        return date.fromisoformat(str(value))
    except (TypeError, ValueError):
        return None


def _age(dob: date, today: date) -> int:
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def check_raw_identifiers(text: str) -> list[Check]:
    """Checks on raw candidates in recognised text. Call before the text is discarded."""
    checks = []
    for token in re.findall(r"(?<![A-Z0-9])[A-Z0-9]{10}(?![A-Z0-9])", (text or "").upper()):
        if token.startswith("XXXX"):
            continue  # an already-masked account or PAN, not a PAN candidate
        if sum(c.isdigit() for c in token) == 4 and sum(c.isalpha() for c in token) == 6:
            checks.append(Check("pan_number", "pan_regex", pan_ok(token),
                                "" if pan_ok(token) else "PAN shape or holder-type letter is wrong"))
    for match in re.finditer(r"(?<!\d)(\d{4})\s?(\d{4})\s?(\d{4})(?!\d)", text or ""):
        digits = "".join(match.groups())
        checks.append(Check("aadhaar_number", "aadhaar_verhoeff", aadhaar_ok(digits),
                            "" if aadhaar_ok(digits) else "fails the Verhoeff checksum"))
    return checks


def apply_field_checks(result: ExtractionResult, *, today: date | None = None) -> list[Check]:
    """Date sanity on parsed fields; downgrades failing fields to INVALID in place."""
    today = today or date.today()
    checks: list[Check] = []
    fields = result.fields

    def fail(key: str, check: str, note: str) -> None:
        item = fields[key]
        item.status = FieldStatus.INVALID
        item.note = note
        checks.append(Check(key, check, False, note))

    dob = None
    item = fields.get("date_of_birth")
    if item is not None and item.value:
        dob = _iso(item.value)
        if dob is None:
            fail("date_of_birth", "date_sanity", "date of birth is not a calendar date")
        elif dob > today:
            fail("date_of_birth", "date_sanity", "date of birth is in the future")
        elif not 18 <= _age(dob, today) <= 100:
            fail("date_of_birth", "date_sanity", f"implied age {_age(dob, today)} is outside 18-100")
        else:
            checks.append(Check("date_of_birth", "date_sanity", True))

    item = fields.get("employment_start_date")
    if item is not None and item.value:
        start = _iso(item.value)
        if start is None or start > today:
            fail("employment_start_date", "date_sanity", "employment start is missing or in the future")
        elif dob is not None and start < date(dob.year + 14, dob.month, min(dob.day, 28)):
            fail("employment_start_date", "date_sanity", "employment start is before age 14")
        elif start < today - timedelta(days=365 * 50):
            fail("employment_start_date", "date_sanity", "employment start is more than 50 years ago")
        else:
            checks.append(Check("employment_start_date", "date_sanity", True))

    item = fields.get("salary_date")
    if item is not None and item.value:
        paid = _iso(item.value)
        if paid is None or paid > today + timedelta(days=31) or paid < today - timedelta(days=400):
            fail("salary_date", "date_sanity", "salary date is not within the last 400 days")
        else:
            checks.append(Check("salary_date", "date_sanity", True))

    if result.kind is DocumentKind.PAN_CARD:
        pan = fields.get("pan_number")
        if pan is not None and pan.status is not FieldStatus.MISSING:
            checks.append(Check("pan_number", "pan_masked_shape",
                                bool(re.fullmatch(r"X{5}\d{4}X", str(pan.value or ""))),
                                "masked value keeps digits 6-9 only"))
    return checks


__all__ = ["Check", "PAN_HOLDER_TYPES", "aadhaar_ok", "apply_field_checks", "check_raw_identifiers", "pan_ok"]
