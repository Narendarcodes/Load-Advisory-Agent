"""Deterministic field extraction from recognised text.

No LLM, no probabilistic model: every field is a labelled pattern or a document-specific
structure. When a pattern does not match, the field is reported as missing — the parser
never fills a gap with a plausible-looking value.

The document type comes from the site's `Loan Document Type` label when that label is
unambiguous, and from the document's own content when it is not (a site may name the same
file "Identity Proof", "Aadhaar" or "KYC Document").
"""

import re

from .masking import AADHAAR_RE, PAN_RE, mask_aadhaar, mask_pan
from .schemas import DocumentKind, ExtractedField, FieldStatus, TextLine
from .synthetic import aadhaar_rejection, pan_rejection, synthetic_mode
from .validator import (
    confidence_of,
    field,
    money_field,
    months_between,
    parse_date,
    review_amounts,
    verhoeff_checksum_ok,
)

# A card printed masked (UIDAI "masked Aadhaar", or a SPECIMEN): only the last four digits exist.
# OCR often reads the printed hyphen as "=", "_" or "." with stray spaces, so allow a short
# separator run.
MASKED_AADHAAR_RE = re.compile(r"(?i)(?<![A-Z0-9])X{4}[\s\-=_.]{0,3}X{4}[\s\-=_.]{0,3}(\d{4})(?!\d)")

# --------------------------------------------------------------------------- classification

_LABEL_HINTS = (
    ("salary_slip", ("salary slip", "payslip", "pay slip", "salary statement", "pay stub")),
    ("bank_statement", ("bank statement", "statement of account", "account statement")),
    ("employment_letter", ("employment letter", "experience letter", "offer letter", "bonafide")),
    ("pan_card", ("pan",)),
    ("aadhaar_card", ("aadhaar", "aadhar", "uidai")),
)

_CONTENT_HINTS = (
    ("salary_slip", ("gross salary", "net salary", "basic salary", "deductions", "payslip", "pay slip")),
    ("bank_statement", ("statement of account", "opening balance", "closing balance", "withdrawal", "deposit")),
    ("employment_letter", ("date of joining", "designation", "employment", "we certify", "appointment")),
    ("aadhaar_card", ("government of india", "aadhaar", "आधार", "unique identification")),
)

FIELD_ORDER: dict[DocumentKind, tuple[str, ...]] = {
    DocumentKind.SALARY_SLIP: (
        "employee_name", "employer_name", "pay_period", "salary_date",
        "basic_salary", "gross_salary", "total_deductions", "net_salary",
    ),
    DocumentKind.BANK_STATEMENT: (
        "account_holder", "statement_period", "salary_credits", "salary_credit_months",
        "total_credits", "total_debits", "closing_balance", "transaction_count",
    ),
    DocumentKind.EMPLOYMENT_LETTER: (
        "employee_name", "employer_name", "designation", "employment_start_date",
        "employment_months", "monthly_gross",
    ),
    DocumentKind.PAN_CARD: ("pan_number", "name", "date_of_birth"),
    DocumentKind.AADHAAR_CARD: ("aadhaar_number", "name", "date_of_birth", "gender", "address"),
}

_LABELS = {
    "employee_name": "Employee name",
    "employer_name": "Employer",
    "pay_period": "Pay period",
    "salary_date": "Salary date",
    "basic_salary": "Basic salary",
    "gross_salary": "Gross monthly salary",
    "total_deductions": "Total deductions",
    "net_salary": "Net monthly salary",
    "account_holder": "Account holder",
    "statement_period": "Statement period",
    "salary_credits": "Salary credits",
    "salary_credit_months": "Months with a salary credit",
    "total_credits": "Total credits",
    "total_debits": "Total debits",
    "closing_balance": "Closing balance",
    "transaction_count": "Transactions read",
    "designation": "Designation",
    "employment_start_date": "Employment start",
    "employment_months": "Employment (months)",
    "monthly_gross": "Monthly gross",
    "pan_number": "PAN",
    "name": "Name",
    "date_of_birth": "Date of birth",
    "aadhaar_number": "Aadhaar",
    "gender": "Gender",
    "address": "Address",
}


def kind_for(document_type: str, text: str = "") -> DocumentKind:
    """Label first, content second, unknown last. Never guesses beyond the two signals."""
    label = (document_type or "").strip().lower()
    for kind, hints in _LABEL_HINTS:
        if any(hint in label for hint in hints):
            return DocumentKind(kind)
    lowered = (text or "").lower()
    for kind, hints in _CONTENT_HINTS:
        if any(hint in lowered for hint in hints):
            return DocumentKind(kind)
    return DocumentKind.UNKNOWN


# --------------------------------------------------------------------------- helpers

def _lines(lines: list[TextLine]) -> list[TextLine]:
    return [line for line in lines if line.text and line.text.strip()]


def _search(lines: list[TextLine], *patterns: str) -> tuple[re.Match | None, TextLine | None]:
    for pattern in patterns:
        compiled = re.compile(pattern, re.IGNORECASE)
        for line in _lines(lines):
            match = compiled.search(line.text)
            if match:
                return match, line
    return None, None


def _capture(lines: list[TextLine], *patterns: str) -> tuple[str | None, float | None]:
    match, line = _search(lines, *patterns)
    if not match:
        return None, None
    value = next((group for group in match.groups() if group), None)
    if value is None:
        return None, None
    return value.strip(" :\t-"), confidence_of(line)


def _capture_context(lines: list[TextLine], *patterns: str) -> tuple[str | None, float | None, str]:
    """Like `_capture`, but also returns the matched line so the caller can read its wording."""
    match, line = _search(lines, *patterns)
    if not match:
        return None, None, ""
    value = next((group for group in match.groups() if group), None)
    return (value.strip(" :\t-") if value else None), confidence_of(line), (line.text if line else "")


_DATE_TOKEN_RE = re.compile(r"(?<!\d)(\d{1,2})\s*([./-])\s*(\d{1,2})\s*[./-]\s*(\d{2,4})(?!\d)")
_STANDALONE_DATE_RE = re.compile(r"^\s*\d{1,2}\s*[./-]\s*\d{1,2}\s*[./-]\s*\d{4}\s*$")


def _find_date(raw: str | None) -> str | None:
    """First exact date in a string, tolerating OCR spaces around separators (`14 / 01 / 1975`)."""
    if not raw:
        return None
    for match in _DATE_TOKEN_RE.finditer(raw):
        sep = match.group(2)
        parsed = parse_date(f"{match.group(1)}{sep}{match.group(3)}{sep}{match.group(4)}")
        if parsed:
            return parsed
    return parse_date(raw.split(" ")[0])


# Labels that start another field: a stacked value is never taken from one of these lines.
_FIELD_LABEL_RE = re.compile(
    r"(?i)^\s*(?:[\u0900-\u097F\s/]*)(?:father|date\s*of\s*birth|d\s*o\s*b|year\s*of\s*birth|"
    r"gender|sex|male\b|female\b|address|permanent\s*account|pan\b|signature|name\b|"
    r"income\s*tax|govt|government|आयकर|पिता|जन्म|पता|लिंग)"
)


def _stacked_value(lines: list[TextLine], label: str) -> tuple[str | None, float | None]:
    """Value after a label on the same line, else on the next line (stacked card layouts).

    ``label`` is matched at the start of a line. The next line is used only when it is not
    itself another field's label, so "Name" followed by "Father's Name" stays missing.
    """
    compiled = re.compile(label + r"\s*[:\-]?\s*(.*)$", re.IGNORECASE)
    usable = _lines(lines)
    for index, line in enumerate(usable):
        match = compiled.match(line.text)
        if not match:
            continue
        value = (match.group(match.lastindex or 1) or "").strip(" :\t-/|")
        if value:
            return value, confidence_of(line)
        if index + 1 < len(usable) and not _FIELD_LABEL_RE.match(usable[index + 1].text):
            return usable[index + 1].text.strip(" :\t-/|"), confidence_of(usable[index + 1])
        return None, None
    return None, None


_NAME_LIKE_RE = re.compile(r"^[A-Za-z][A-Za-z.' ]{1,58}[A-Za-z.]$")
_NOT_A_NAME_RE = re.compile(
    r"(?i)\b(government|govt|india|income|tax|department|permanent|account|number|card|signature|"
    r"aadhaar|aadhar|uidai|unique|identification|authority|male|female|dob|birth|address|enrol|"
    r"issue|download|vid|help|www)\b"
)


def _name_like(text: str) -> bool:
    words = text.split()
    return (1 <= len(words) <= 5 and bool(_NAME_LIKE_RE.match(text.strip()))
            and not _NOT_A_NAME_RE.search(text))


# Name labels: "Name", "नाम / Name", "नाम" -- anchored at the line start so "Father's Name"
# and "पिता का नाम" never match.
_NAME_LABEL = r"^\s*(?:नाम\s*/?\s*)?(?:name|नाम)\b"


_COMPANY_RE = re.compile(
    r"\b(pvt|private|ltd|limited|llp|inc|corp|corporation|technologies|solutions|"
    r"services|industries|enterprises|consulting|systems|labs|bank)\b",
    re.IGNORECASE,
)


def _employer_from_header(lines: list[TextLine]) -> tuple[str | None, float | None]:
    """A payslip usually prints the company as a header with no label.

    Only the first five lines are considered and the line must carry a company word, so a
    random heading is not promoted to an employer.
    """
    for line in _lines(lines)[:5]:
        if _COMPANY_RE.search(line.text) and not re.search(
            r"(employee|designation|department|salary|pay\s*period)", line.text, re.I
        ):
            return _clean_name(line.text), confidence_of(line)
    return None, None


def _clean_name(raw: str | None) -> str | None:
    if not raw:
        return None
    value = re.sub(r"\s{2,}", " ", raw).strip(" :\t-")
    value = re.sub(r"\s*(employee\s*(id|code)|emp\s*(id|code)|designation).*$", "", value, flags=re.I)
    if not value or len(value) > 80 or not re.search(r"[A-Za-z\u0900-\u097F]", value):
        return None
    return value


def _normalise_period(raw: str | None) -> str | None:
    if not raw:
        return None
    text = raw.strip(" :\t-")
    dates = re.findall(r"\b(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})\b", text)
    if len(dates) >= 2:
        start, end = parse_date(dates[0]), parse_date(dates[1])
        if start and end:
            return f"{start} to {end}"
    month = re.search(r"\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s,/-]+(\d{4})\b", text, re.I)
    if month:
        return f"{month.group(1).title()} {month.group(2)}"
    if dates:
        parsed = parse_date(dates[0])
        if parsed:
            return parsed[:7]
    numeric = re.search(r"\b(\d{1,2})[/-](\d{4})\b", text)
    if numeric:
        return f"{int(numeric.group(1)):02d}/{numeric.group(2)}"
    return text[:40] or None


# --------------------------------------------------------------------------- salary slip

_SALARY_PATTERNS = {
    "employee_name": (r"employee\s*name\s*[:\-]?\s*(.+)", r"name\s*of\s*(?:the\s*)?employee\s*[:\-]?\s*(.+)"),
    "employer_name": (r"(?:employer|company|organisation|organization|firm)\s*(?:name)?\s*[:\-]\s*(.+)",),
    "basic_salary": (r"basic\s*(?:salary|pay)?\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)",),
    "gross_salary": (
        r"gross\s*(?:salary|pay|earnings|monthly)\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)",
        r"total\s*earnings\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)",
    ),
    "net_salary": (
        r"net\s*(?:salary|pay|amount|monthly)\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)",
        r"take\s*home\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)",
    ),
    "total_deductions": (r"(?:total\s*)?deductions?\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)",),
    "pay_period": (
        r"(?:pay\s*(?:period|month|cycle)|salary\s*(?:month|period)|for\s*the\s*(?:month|period))\s*[:\-]?\s*(.+)",
    ),
    "salary_date": (
        r"(?:pay\s*date|salary\s*date|date\s*of\s*(?:payment|credit)|paid\s*on)\s*[:\-]?\s*(.+)",
    ),
}


def _parse_salary_slip(lines: list[TextLine]) -> tuple[dict[str, ExtractedField], list[str]]:
    fields: dict[str, ExtractedField] = {}
    name, confidence = _capture(lines, *_SALARY_PATTERNS["employee_name"])
    fields["employee_name"] = field("employee_name", _LABELS["employee_name"], _clean_name(name), confidence=confidence)

    employer, confidence = _capture(lines, *_SALARY_PATTERNS["employer_name"])
    if not employer:
        employer, confidence = _employer_from_header(lines)
    fields["employer_name"] = field("employer_name", _LABELS["employer_name"], _clean_name(employer), confidence=confidence)

    for key in ("basic_salary", "gross_salary", "net_salary", "total_deductions"):
        raw, confidence = _capture(lines, *_SALARY_PATTERNS[key])
        fields[key] = money_field(key, _LABELS[key], raw, confidence=confidence, minimum=1.0)

    period, confidence = _capture(lines, *_SALARY_PATTERNS["pay_period"])
    fields["pay_period"] = field("pay_period", _LABELS["pay_period"], _normalise_period(period), confidence=confidence)

    raw_date, confidence = _capture(lines, *_SALARY_PATTERNS["salary_date"])
    parsed = parse_date((raw_date or "").split(" ")[0]) if raw_date else None
    fields["salary_date"] = field("salary_date", _LABELS["salary_date"], parsed, confidence=confidence,
                                  note=None if parsed else ("could not read the date" if raw_date else None))

    return fields, review_amounts(fields)


# --------------------------------------------------------------------------- bank statement

_BANK_PATTERNS = {
    "account_holder": (
        r"(?:account\s*holders?(?:['\u2019]s)?\s*(?:name)?|account\s*name|name\s*of\s*(?:the\s*)?account\s*holder)"
        r"\s*[:\-]?\s*(.+)",
    ),
    "statement_period": (r"(?:statement|account)\s*period\s*[:\-]?\s*(.+)",),
    "closing_balance": (
        r"(?:closing|available|current)\s*balance\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)",
    ),
    "total_credits": (r"total\s*credits?\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)",),
    "total_debits": (r"total\s*debits?\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)",),
}

_TRANSACTION_RE = re.compile(
    r"^\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})\b.*?([\d,]+\.\d{2})\s*(cr|dr)?\s*$", re.IGNORECASE
)
# No word boundaries: OCR often merges narration words ("CRSALARYDECCAN").
_SALARY_LINE_RE = re.compile(r"salary|payroll|wages", re.IGNORECASE)
_SALARY_AMOUNT_RE = re.compile(r"\d[\d,]*(?:\.\d{1,2})?")
_LEADING_DATE_RE = re.compile(r"^\s*\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\s*")


def _parse_bank_statement(lines: list[TextLine]) -> tuple[dict[str, ExtractedField], list[str]]:
    fields: dict[str, ExtractedField] = {}
    warnings: list[str] = []
    holder, confidence = _capture(lines, *_BANK_PATTERNS["account_holder"])
    fields["account_holder"] = field("account_holder", _LABELS["account_holder"], _clean_name(holder), confidence=confidence)

    period, confidence = _capture(lines, *_BANK_PATTERNS["statement_period"])
    fields["statement_period"] = field("statement_period", _LABELS["statement_period"],
                                       _normalise_period(period) if period else None, confidence=confidence)

    for key in ("closing_balance", "total_credits", "total_debits"):
        raw, confidence = _capture(lines, *_BANK_PATTERNS[key])
        fields[key] = money_field(key, _LABELS[key], raw, confidence=confidence)

    # Transactions: date + amount + direction only. Descriptions are never stored.
    transactions = []
    salary_total = 0.0
    salary_months: set[str] = set()
    for line in _lines(lines):
        match = _TRANSACTION_RE.match(line.text)
        if match:
            when = parse_date(match.group(1))
            amount = float(match.group(2).replace(",", ""))
            direction = (match.group(3) or "").lower()
            if when:
                transactions.append({"date": when, "amount": amount, "direction": direction or None})
        if _SALARY_LINE_RE.search(line.text):
            if re.search(r"(?<![a-z])(cr|credit|deposit)", line.text, re.I):
                rest = _LEADING_DATE_RE.sub("", line.text)
                amounts = [
                    amount
                    for amount in _SALARY_AMOUNT_RE.findall(rest)
                    if len(re.sub(r"\D", "", amount)) >= 3
                ]
                if amounts:
                    salary_total += float(amounts[0].replace(",", ""))
                    month = re.search(r"\b(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\b", line.text)
                    if month:
                        salary_months.add(f"{int(month.group(2)):02d}/{month.group(3)}")

    transactions = transactions[:50]
    if transactions:
        fields["transaction_count"] = field("transaction_count", _LABELS["transaction_count"], len(transactions))
        if not fields["statement_period"].value:
            dates = sorted(t["date"] for t in transactions)
            fields["statement_period"] = field(
                "statement_period", _LABELS["statement_period"], f"{dates[0]} to {dates[-1]}",
                note="derived from the transaction dates on the statement",
            )
    if salary_total:
        fields["salary_credits"] = field("salary_credits", _LABELS["salary_credits"], round(salary_total, 2),
                                         note="sum of salary-looking credit lines")
        fields["salary_credit_months"] = field("salary_credit_months", _LABELS["salary_credit_months"], len(salary_months))
        if len(salary_months) < 2:
            warnings.append("Fewer than two salary credits were recognised; check the salary lines manually.")
    else:
        fields["salary_credits"] = field("salary_credits", _LABELS["salary_credits"],
                                         note="no salary credit line was recognised")
    return fields, warnings


# --------------------------------------------------------------------------- employment letter

_EMPLOYMENT_PATTERNS = {
    "employee_name": (r"employee\s*name\s*[:\-]?\s*(.+)", r"name\s*of\s*(?:the\s*)?employee\s*[:\-]?\s*(.+)"),
    "employer_name": (r"(?:employer|company|organisation|organization)\s*(?:name)?\s*[:\-]\s*(.+)",),
    "designation": (r"designation\s*[:\-]?\s*(.+)", r"working\s*as\s*[:\-]?\s*(.+)"),
    "employment_start_date": (
        r"(?:date\s*of\s*joining|joining\s*date|employed\s*(?:from|since)|start\s*date)\s*[:\-]?\s*(.+)",
    ),
    "monthly_gross": (
        r"(?:gross|monthly)\s*(?:salary|pay)\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)",
        r"annual\s*(?:ctc|compensation|salary)\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)",
    ),
}

_INITIALS_RE = re.compile(r"\b(?:mr|ms|mrs|dr)\.?\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){1,3})")


def _parse_employment_letter(lines: list[TextLine]) -> tuple[dict[str, ExtractedField], list[str]]:
    fields: dict[str, ExtractedField] = {}
    warnings: list[str] = []

    name, confidence = _capture(lines, *_EMPLOYMENT_PATTERNS["employee_name"])
    if not name:
        for line in _lines(lines):
            match = _INITIALS_RE.search(line.text)
            if match:
                name, confidence = match.group(1), confidence_of(line)
                break
    fields["employee_name"] = field("employee_name", _LABELS["employee_name"], _clean_name(name), confidence=confidence)

    employer, confidence = _capture(lines, *_EMPLOYMENT_PATTERNS["employer_name"])
    if not employer:
        employer, confidence = _employer_from_header(lines)
    fields["employer_name"] = field("employer_name", _LABELS["employer_name"], _clean_name(employer), confidence=confidence)

    designation, confidence = _capture(lines, *_EMPLOYMENT_PATTERNS["designation"])
    fields["designation"] = field("designation", _LABELS["designation"], _clean_name(designation), confidence=confidence)

    raw_start, confidence = _capture(lines, *_EMPLOYMENT_PATTERNS["employment_start_date"])
    start = parse_date((raw_start or "").split(" ")[0]) if raw_start else None
    fields["employment_start_date"] = field("employment_start_date", _LABELS["employment_start_date"], start,
                                            confidence=confidence,
                                            note=None if start else ("could not read the date" if raw_start else None))
    months = months_between(start) if start else None
    fields["employment_months"] = field("employment_months", _LABELS["employment_months"], months,
                                        note="derived from the employment start date" if months is not None else None)
    if months is not None and months > 600:
        fields["employment_months"].status = FieldStatus.INVALID
        fields["employment_months"].note = "implausible tenure for a stated start date"

    raw_gross, confidence, context = _capture_context(lines, *_EMPLOYMENT_PATTERNS["monthly_gross"])
    monthly = money_field("monthly_gross", _LABELS["monthly_gross"], raw_gross, confidence=confidence, minimum=1.0)
    if monthly.value and re.search(r"\bannual\b|\bctc\b|per\s+annum", context, re.I):
        # The letter quoted a yearly figure; show a monthly one, and say that we did.
        monthly.value = round(monthly.value / 12, 2)
        monthly.note = "annual figure divided by 12"
    fields["monthly_gross"] = monthly
    if not start:
        warnings.append("No employment start date was recognised, so tenure cannot be derived.")
    return fields, warnings


# --------------------------------------------------------------------------- PAN card

def _pan_unlabelled_name(lines: list[TextLine]) -> tuple[str | None, float | None]:
    """Old PAN design: holder name is the first name-like line after the department header."""
    usable = _lines(lines)
    start = next((i for i, line in enumerate(usable)
                  if re.search(r"income\s*tax|govt|government", line.text, re.I)), None)
    if start is None:
        return None, None
    for line in usable[start + 1:start + 4]:
        if _FIELD_LABEL_RE.match(line.text) or _STANDALONE_DATE_RE.match(line.text):
            return None, None
        if _name_like(line.text):
            return line.text.strip(), confidence_of(line)
    return None, None


def _parse_pan_card(lines: list[TextLine], text: str, *,
                    synthetic: bool = False) -> tuple[dict[str, ExtractedField], list[str]]:
    fields: dict[str, ExtractedField] = {}
    warnings: list[str] = []

    number = PAN_RE.search(text.upper())
    if number:
        raw = number.group(0)
        compact_raw = re.sub(r"\s", "", raw)
        confidence = confidence_of(
            next(
                (
                    line
                    for line in _lines(lines)
                    if compact_raw in re.sub(r"\s", "", line.text.upper())
                ),
                None,
            )
        )
        rejection = pan_rejection(compact_raw, synthetic=synthetic)
        if rejection is None:
            fields["pan_number"] = field("pan_number", _LABELS["pan_number"], mask_pan(raw), confidence=confidence,
                                         note="masked; the full number is not stored")
        else:
            fields["pan_number"] = ExtractedField(key="pan_number", label=_LABELS["pan_number"], value=None,
                                                  status=FieldStatus.INVALID, confidence=confidence,
                                                  note=rejection)
    else:
        # A ten-character token with letters and digits in the wrong order is a misread
        # PAN, not an absent one -- say so instead of silently reporting "missing".
        candidate = next(
            (
                token
                for token in re.findall(r"(?<![A-Z0-9])[A-Z0-9]{10}(?![A-Z0-9])", text.upper())
                if sum(character.isdigit() for character in token) >= 4
                and sum(character.isalpha() for character in token) >= 4
            ),
            None,
        )
        if candidate:
            fields["pan_number"] = ExtractedField(key="pan_number", label=_LABELS["pan_number"], value=None,
                                                  status=FieldStatus.INVALID, confidence=None,
                                                  note="the characters do not form a valid PAN")
        else:
            fields["pan_number"] = field("pan_number", _LABELS["pan_number"],
                                         note="no PAN number was recognised")

    name, confidence = _stacked_value(lines, _NAME_LABEL)
    if not name:
        name, confidence = _pan_unlabelled_name(lines)
    fields["name"] = field("name", _LABELS["name"], _clean_name(name), confidence=confidence)

    raw_dob, confidence = _stacked_value(
        lines, r"^\s*(?:[\u0900-\u097F\s]*/\s*)?(?:date\s*of\s*birth|d\s*o\s*b|जन्म\s*(?:की\s*)?(?:तिथि|तारीख|दिनांक)?)")
    if not raw_dob:
        raw_dob, confidence = _capture(lines, r"(?:date\s*of\s*birth|\bdob)\s*[:\-]?\s*(.+)")
    if not raw_dob:
        # Old PAN design: the date of birth is printed alone on its line, with no label.
        line = next((item for item in _lines(lines) if _STANDALONE_DATE_RE.match(item.text)), None)
        raw_dob, confidence = (line.text, confidence_of(line)) if line else (None, None)
    dob = _find_date(raw_dob)
    fields["date_of_birth"] = field("date_of_birth", _LABELS["date_of_birth"], dob, confidence=confidence,
                                    note=None if dob else ("could not read the date" if raw_dob else None))
    if not number:
        warnings.append("No PAN number was recognised; check that the document is a PAN card.")
    return fields, warnings


# --------------------------------------------------------------------------- Aadhaar card

_AADHAAR_DOB_LINE_RE = re.compile(r"(?i)date\s*of\s*birth|\bd\s*o\s*b|year\s*of\s*birth|\byob|जन्म")


def _aadhaar_unlabelled_name(lines: list[TextLine]) -> tuple[str | None, float | None]:
    """e-Aadhaar and PVC cards print the name with no label, on the line above the DOB."""
    usable = _lines(lines)
    for index, line in enumerate(usable):
        if _AADHAAR_DOB_LINE_RE.search(line.text):
            for previous in reversed(usable[max(0, index - 2):index]):
                if _name_like(previous.text):
                    return previous.text.strip(), confidence_of(previous)
            return None, None
    return None, None


def _parse_aadhaar_card(lines: list[TextLine], text: str, *,
                        synthetic: bool = False) -> tuple[dict[str, ExtractedField], list[str]]:
    fields: dict[str, ExtractedField] = {}
    warnings: list[str] = []

    match = AADHAAR_RE.search(text)
    masked = None if match else MASKED_AADHAAR_RE.search(text)
    if match:
        raw = "".join(match.groups())
        confidence = None
        for line in _lines(lines):
            found = AADHAAR_RE.search(line.text)
            if found and "".join(found.groups()) == raw:
                confidence = confidence_of(line)
                break
        if not verhoeff_checksum_ok(raw):
            note = "the number fails the Aadhaar checksum; re-scan the card"
        else:
            note = aadhaar_rejection(raw, synthetic=synthetic)
        if note is None:
            # Stored as the last four digits only; the full number exists only in `raw`.
            fields["aadhaar_number"] = field("aadhaar_number", _LABELS["aadhaar_number"], mask_aadhaar(raw),
                                             confidence=confidence, note="masked; only the last 4 digits are kept")
        else:
            fields["aadhaar_number"] = ExtractedField(key="aadhaar_number", label=_LABELS["aadhaar_number"],
                                                      value=None, status=FieldStatus.INVALID, confidence=confidence,
                                                      note=note)
        del raw
    elif masked:
        confidence = confidence_of(next((line for line in _lines(lines) if MASKED_AADHAAR_RE.search(line.text)), None))
        fields["aadhaar_number"] = field("aadhaar_number", _LABELS["aadhaar_number"],
                                         f"XXXX XXXX {masked.group(1)}", confidence=confidence,
                                         note="printed masked; only the last 4 digits exist, so the checksum "
                                              "cannot be verified")
    else:
        fields["aadhaar_number"] = field("aadhaar_number", _LABELS["aadhaar_number"],
                                         note="no Aadhaar number was recognised")

    name, confidence = _stacked_value(lines, _NAME_LABEL)
    if not name:
        name, confidence = _aadhaar_unlabelled_name(lines)
    fields["name"] = field("name", _LABELS["name"], _clean_name(name), confidence=confidence)

    raw_dob, confidence = _capture(
        lines, r"(?:date\s*of\s*birth|\bd\s*o\s*b|year\s*of\s*birth|\byob)\s*[:\-]?\s*(.+)")
    dob = _find_date(raw_dob)
    fields["date_of_birth"] = field("date_of_birth", _LABELS["date_of_birth"], dob, confidence=confidence,
                                    note=None if dob else ("only a year was printed" if raw_dob else None))

    gender, confidence = _capture(lines, r"\b(male|female|transgender|पुरुष|महिला)\b")
    fields["gender"] = field("gender", _LABELS["gender"],
                             {"पुरुष": "Male", "महिला": "Female"}.get(gender, (gender or "").title() or None),
                             confidence=confidence)

    address, confidence = _capture(lines, r"^\s*(?:address|पता)\s*[:\-]?\s*(.+)$")
    fields["address"] = field("address", _LABELS["address"],
                              re.sub(r"\s{2,}", " ", address).strip(" :,-") if address else None, confidence=confidence)

    if not match and not masked:
        warnings.append("No Aadhaar number was recognised; check that the document is an Aadhaar card.")
    return fields, warnings


# --------------------------------------------------------------------------- entry point

def parse(document_type: str, lines: list[TextLine], text: str, *,
          synthetic: bool | None = None) -> tuple[dict[str, ExtractedField], list[str], DocumentKind]:
    """Parse recognised lines for one document. Returns (fields, warnings, kind).

    ``synthetic`` is the document/request flag; None follows the SARAL_SYNTHETIC_MODE setting.
    """
    kind = kind_for(document_type, text)
    mode = synthetic_mode(synthetic)
    if kind is DocumentKind.SALARY_SLIP:
        fields, warnings = _parse_salary_slip(lines)
    elif kind is DocumentKind.BANK_STATEMENT:
        fields, warnings = _parse_bank_statement(lines)
    elif kind is DocumentKind.EMPLOYMENT_LETTER:
        fields, warnings = _parse_employment_letter(lines)
    elif kind is DocumentKind.PAN_CARD:
        fields, warnings = _parse_pan_card(lines, text, synthetic=mode)
    elif kind is DocumentKind.AADHAAR_CARD:
        fields, warnings = _parse_aadhaar_card(lines, text, synthetic=mode)
    else:
        fields, warnings = {}, ["This document type is not supported for automatic reading yet."]

    ordered = {key: fields[key] for key in FIELD_ORDER.get(kind, ()) if key in fields}
    ordered.update({key: value for key, value in fields.items() if key not in ordered})
    return ordered, warnings, kind
