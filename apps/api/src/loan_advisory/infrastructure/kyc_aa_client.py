"""KYC / AA consumer for the catalogue-v2 decision path (synthetic test bed).

Fetches the applicant's preprocessed data points (KYC match, AA bank analytics, OCR, signature) from the
loopback synthetic KYC + AA service (`SARAL_KYC_AA_URL`, e.g. http://127.0.0.1:8012). Fails closed: any error
returns `None` plus a reason, and the caller records missing information instead of guessing values.
"""
from __future__ import annotations

import os
import re
from dataclasses import dataclass

import requests

SYNTHETIC_APPLICANT = re.compile(r"^SYN-APP-\d{4}$")


@dataclass
class KycAaResult:
    data_points: dict | None
    error: str | None = None


class KycAaClient:
    def __init__(self, base_url: str | None = None, timeout: float = 10.0):
        self.base_url = (base_url or os.environ.get("SARAL_KYC_AA_URL") or "").rstrip("/")
        self.timeout = timeout
        self._s = requests.Session()
        self._s.trust_env = False  # loopback only; never through a proxy

    @property
    def configured(self) -> bool:
        return bool(self.base_url)

    def data_points(self, applicant_id: str | None) -> KycAaResult:
        if not self.configured:
            return KycAaResult(None, "KYC_AA_NOT_CONFIGURED")
        if not applicant_id or not SYNTHETIC_APPLICANT.match(applicant_id):
            return KycAaResult(None, "KYC_AA_UNKNOWN_APPLICANT")
        try:
            r = self._s.post(f"{self.base_url}/v1/zen/data-points", json={"applicant_id": applicant_id}, timeout=self.timeout)
        except requests.RequestException:
            return KycAaResult(None, "KYC_AA_UNREACHABLE")
        if r.status_code == 403:
            return KycAaResult(None, "AA_CONSENT_MISSING")
        if not r.ok:
            return KycAaResult(None, f"KYC_AA_HTTP_{r.status_code}")
        body = r.json()
        if body.get("synthetic") is not True or not isinstance(body.get("data_points"), dict):
            return KycAaResult(None, "KYC_AA_BAD_RESPONSE")
        return KycAaResult(body["data_points"])
