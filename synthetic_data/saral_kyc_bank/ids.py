"""Synthetic identifiers that are valid in *format* but can never be real.

* Aadhaar: 12 digits whose first digit is 0 or 1. UIDAI never issues an Aadhaar
  number starting with 0 or 1, so no value produced here can belong to a person.
  The last digit is a correct Verhoeff check digit so checksum code paths work.
* PAN: AAAPA9999A with the reserved-by-convention series ``ZZ`` as the first two
  letters (same convention as feat/saral-ocr-paddle-signature). The Income Tax
  Department publishes no reserved test series, so the ``synthetic`` flag on every
  record, not the prefix, is the authoritative marker.
* IFSC-like code: ``XSYN`` + ``S`` + 6 digits. A real IFSC always has ``0`` as the
  5th character; ours never does, so it fails the real-IFSC pattern by construction.
  ("SYNB0" was rejected: SYNB was Syndicate Bank's real IFSC bank code.)
* Pincode: starts with ``0``. Indian PIN codes start with 1-9, so ours are non-real.
* Phone: ``+91`` followed by ``0000`` and six digits. Indian mobile numbers start
  with 6-9, so ours are non-real.
"""
from __future__ import annotations

import random
import re

_D = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5], [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
      [3, 4, 0, 1, 2, 8, 9, 5, 6, 7], [4, 0, 1, 2, 3, 9, 5, 6, 7, 8], [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
      [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3], [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
      [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]]
_P = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4], [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
      [8, 9, 1, 6, 0, 4, 3, 5, 2, 7], [9, 4, 5, 3, 1, 2, 6, 8, 7, 0], [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
      [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]]
_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]

LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

SYNTHETIC_AADHAAR_RE = re.compile(r"^[01]\d{11}$")
PAN_FORMAT_RE = re.compile(r"^[A-Z]{3}P[A-Z]\d{4}[A-Z]$")
SYNTHETIC_PAN_PREFIX = "ZZ"
SYNTHETIC_PAN_RE = re.compile(r"^ZZ[A-Z]P[A-Z]\d{4}[A-Z]$")
REAL_IFSC_RE = re.compile(r"^[A-Z]{4}0[A-Z0-9]{6}$")
SYNTHETIC_IFSC_PREFIX = "XSYNS"
SYNTHETIC_IFSC_RE = re.compile(r"^XSYNS\d{6}$")
SYNTHETIC_PINCODE_RE = re.compile(r"^0\d{5}$")
SYNTHETIC_PHONE_RE = re.compile(r"^\+910000\d{6}$")


def verhoeff_check_digit(number: str) -> str:
    c = 0
    for i, ch in enumerate(reversed(number)):
        c = _D[c][_P[(i + 1) % 8][int(ch)]]
    return str(_INV[c])


def verhoeff_ok(number: str) -> bool:
    if not number.isdigit():
        return False
    c = 0
    for i, ch in enumerate(reversed(number)):
        c = _D[c][_P[i % 8][int(ch)]]
    return c == 0


def synthetic_aadhaar(rng: random.Random) -> str:
    """12 digits, first digit 0 or 1 (never issued by UIDAI), Verhoeff-valid."""
    body = rng.choice("01") + "".join(str(rng.randint(0, 9)) for _ in range(10))
    full = body + verhoeff_check_digit(body)
    if not (SYNTHETIC_AADHAAR_RE.match(full) and verhoeff_ok(full)):  # pragma: no cover
        raise AssertionError("synthetic Aadhaar construction failed")
    return full


def mask_aadhaar(number: str) -> str:
    return f"XXXX-XXXX-{number[-4:]}"


def mask_aadhaar_contract(number: str) -> str:
    """Contract form (contracts/common.py MASKED_AADHAAR_PATTERN): XXXX XXXX 1234."""
    return f"XXXX XXXX {number[-4:]}"


def synthetic_pan(rng: random.Random, surname: str) -> str:
    """ZZ + letter + P (individual) + surname initial + 4 digits + letter."""
    initial = surname[0].upper()
    if initial not in LETTERS:  # pragma: no cover - our name pool is ASCII
        raise ValueError("surname must start with A-Z")
    return (SYNTHETIC_PAN_PREFIX + rng.choice(LETTERS) + "P" + initial
            + f"{rng.randint(0, 9999):04d}" + rng.choice(LETTERS))


def mask_pan(pan: str) -> str:
    """Contract form (contracts/common.py MASKED_PAN_PATTERN): XXXXX1234X."""
    return "XXXXX" + pan[5:9] + "X"


def synthetic_ifsc(rng: random.Random) -> str:
    code = SYNTHETIC_IFSC_PREFIX + f"{rng.randint(0, 999999):06d}"
    if REAL_IFSC_RE.match(code):  # pragma: no cover - 5th char is 'S'
        raise AssertionError("synthetic IFSC must never match the real IFSC pattern")
    return code


def synthetic_account_number(rng: random.Random) -> str:
    return "0000" + "".join(str(rng.randint(0, 9)) for _ in range(10))


def mask_account(number: str) -> str:
    return "X" * (len(number) - 4) + number[-4:]


def synthetic_pincode(rng: random.Random) -> str:
    return "0" + f"{rng.randint(0, 99999):05d}"


def synthetic_phone(rng: random.Random) -> str:
    return "+910000" + f"{rng.randint(0, 999999):06d}"
