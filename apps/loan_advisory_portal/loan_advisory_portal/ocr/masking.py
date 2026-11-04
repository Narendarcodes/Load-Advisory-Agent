"""Masking for identifiers that must never be stored or logged in full.

An Aadhaar number and a PAN are the two identifiers a salary slip or a KYC upload can
carry. The parsers call these functions before a value ever reaches a dataclass, so the
unmasked form lives only in a local variable.
"""

import re

# Up to three spaces or tabs between groups (cards print wide gaps that OCR keeps:
# "1234   5678   9012"), but never a line break, so a date ending in a year cannot be
# glued to the next line's digits.
AADHAAR_RE = re.compile(r"(?<!\d)(\d{4})[ \t]{0,3}(\d{4})[ \t]{0,3}(\d{4})(?!\d)")
PAN_RE = re.compile(
    r"(?<![A-Z0-9])([A-Z]{5})\s?(\d{4})\s?([A-Z])(?![A-Z0-9])",
    re.IGNORECASE,
)
ACCOUNT_RE = re.compile(r"(?<!\d)(\d{9,18})(?!\d)")


def mask_aadhaar(value: str) -> str:
    """`1234 5678 9012` -> `XXXX XXXX 9012`. Anything unrecognised is masked completely."""
    if re.fullmatch(r"(?i)X{4}\s?X{4}\s?\d{4}", (value or "").strip()):
        digits = re.sub(r"\D", "", value)
        return f"XXXX XXXX {digits[-4:]}"
    digits = re.sub(r"\D", "", value or "")
    if len(digits) == 12:
        return f"XXXX XXXX {digits[-4:]}"
    return "XXXX XXXX XXXX"


def mask_pan(value: str) -> str:
    """`ABCDE1234F` -> `XXXXX1234X`. Non-matching input is masked completely."""
    cleaned = re.sub(r"[^A-Z0-9]", "", (value or "").upper())
    if re.fullmatch(r"X{5}\d{4}X", cleaned):
        return cleaned
    if PAN_RE.fullmatch(cleaned):
        return f"XXXXX{cleaned[5:9]}X"
    return "XXXXXXXXXX"


def mask_account(value: str) -> str:
    """Keep the last four digits of an account number; mask the rest."""
    digits = re.sub(r"\D", "", value or "")
    if 9 <= len(digits) <= 18:
        return "X" * (len(digits) - 4) + digits[-4:]
    return ""


def mask_sensitive_text(text: str) -> str:
    """Mask identifiers wherever they occur inside an extracted string field."""
    if not text:
        return ""
    text = AADHAAR_RE.sub(lambda m: f"XXXX XXXX {m.group(3)[-4:]}", text)
    text = PAN_RE.sub(lambda m: f"XXXXX{m.group(2)}X", text)
    return ACCOUNT_RE.sub(lambda m: mask_account(m.group(0)), text)


def redact_for_log(text: str) -> str:
    """Defence in depth for callers that might expose OCR text or account identifiers."""
    return mask_sensitive_text(text)
