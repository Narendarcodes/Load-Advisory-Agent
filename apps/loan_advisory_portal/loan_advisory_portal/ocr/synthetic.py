"""Synthetic mode: the one switch that lets SPECIMEN test identifiers through validation.

The Saral synthetic datasets (feat/saral-synthetic-kyc-bank, docs/saral/SYNTHETIC_DATASETS.md
section 2) use identifiers that are valid in *format* but can never belong to a person:

* Aadhaar: 12 digits, first digit **0 or 1** (UIDAI never issues these), Verhoeff-valid.
* PAN: ``ZZ`` + letter + ``P`` + letter + 4 digits + letter (the shared ``ZZ`` convention).
* IFSC-like bank code: ``XSYNS`` + 6 digits (a real IFSC has ``0`` as its 5th character).

The two modes are a strict partition, so neither can launder the other's values:

=================  ===============================  ===============================
                   normal mode (default)            synthetic mode
=================  ===============================  ===============================
Aadhaar            first digit 2-9 + Verhoeff        first digit 0/1 + Verhoeff
PAN                AAAPA9999A shape, not ``ZZ``      ``ZZ?P?9999?`` only
IFSC               ``AAAA0XXXXXX``                   ``XSYNS999999`` only
=================  ===============================  ===============================

Synthetic mode is on only when the caller flags the document or request as synthetic
(``synthetic=True``) or when the ``SARAL_SYNTHETIC_MODE`` setting is on. Callers must take the
flag from server-side state (the dataset record, site config, env), never from a value the
borrower's browser sends.
"""

from __future__ import annotations

import os
import re

SETTING = "SARAL_SYNTHETIC_MODE"
_TRUE = {"1", "true", "yes", "on"}

SYNTHETIC_AADHAAR_RE = re.compile(r"^[01]\d{11}$")
REAL_AADHAAR_RE = re.compile(r"^[2-9]\d{11}$")
PAN_SHAPE_RE = re.compile(r"^[A-Z]{5}\d{4}[A-Z]$")
SYNTHETIC_PAN_PREFIX = "ZZ"
SYNTHETIC_PAN_RE = re.compile(r"^ZZ[A-Z]P[A-Z]\d{4}[A-Z]$")
REAL_IFSC_RE = re.compile(r"^[A-Z]{4}0[A-Z0-9]{6}$")
SYNTHETIC_IFSC_RE = re.compile(r"^XSYNS\d{6}$")


def setting_enabled() -> bool:
    """True when the deployment-wide ``SARAL_SYNTHETIC_MODE`` setting is on."""
    return os.environ.get(SETTING, "").strip().lower() in _TRUE


def synthetic_mode(flag: bool | None = None) -> bool:
    """Resolve the mode: an explicit document/request flag, else the setting."""
    return bool(flag) or setting_enabled()


def _digits(value: str) -> str:
    return re.sub(r"\D", "", value or "")


def _compact(value: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", (value or "").upper())


def looks_synthetic_aadhaar(value: str) -> bool:
    return bool(SYNTHETIC_AADHAAR_RE.match(_digits(value)))


def looks_synthetic_pan(value: str) -> bool:
    return _compact(value).startswith(SYNTHETIC_PAN_PREFIX)


def looks_synthetic_ifsc(value: str) -> bool:
    return bool(SYNTHETIC_IFSC_RE.match(_compact(value)))


def ifsc_valid(value: str, *, synthetic: bool = False) -> bool:
    code = _compact(value)
    if synthetic:
        return bool(SYNTHETIC_IFSC_RE.match(code))
    return bool(REAL_IFSC_RE.match(code)) and not code.startswith("XSYN")


def aadhaar_rejection(value: str, *, synthetic: bool) -> str | None:
    """Why an Aadhaar-shaped value is wrong for this mode, or None when the prefix fits.

    Only the prefix rule lives here; the Verhoeff checksum is checked by the caller.
    """
    digits = _digits(value)
    if len(digits) != 12:
        return "an Aadhaar number has 12 digits"
    if synthetic and not SYNTHETIC_AADHAAR_RE.match(digits):
        return "a real-format Aadhaar number is not accepted on a synthetic document"
    if not synthetic and not REAL_AADHAAR_RE.match(digits):
        return "Aadhaar numbers never start with 0 or 1 (that range is synthetic test data)"
    return None


def pan_rejection(value: str, *, synthetic: bool) -> str | None:
    """Why a PAN-shaped value is wrong for this mode, or None when it fits."""
    pan = _compact(value)
    if not PAN_SHAPE_RE.match(pan):
        return "the characters do not form a valid PAN"
    if synthetic and not SYNTHETIC_PAN_RE.match(pan):
        return "a real-format PAN is not accepted on a synthetic document"
    if not synthetic and pan.startswith(SYNTHETIC_PAN_PREFIX):
        return "ZZ-series PANs are synthetic test data and are not accepted here"
    return None


__all__ = [
    "SETTING",
    "aadhaar_rejection",
    "ifsc_valid",
    "looks_synthetic_aadhaar",
    "looks_synthetic_ifsc",
    "looks_synthetic_pan",
    "pan_rejection",
    "setting_enabled",
    "synthetic_mode",
]
