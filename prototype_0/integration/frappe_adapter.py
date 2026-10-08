"""Frappe adapter: Loan Application -> canonical UnderwritingInput.

Two backends, one mapping:
- MockStore (default): in-memory synthetic applications. Used by tests and
  until a live Frappe site is available.
- FrappeClient: real Frappe REST API (`/api/resource/Loan Application/<name>`),
  enabled when FRAPPE_URL + FRAPPE_API_KEY + FRAPPE_API_SECRET are set.

Mapping (Frappe field -> canonical field -> ZEN input field):
  applicant_id/custom_applicant_id -> applicant_id      -> (id only)
  monthly_income/custom_monthly_income -> monthly_income -> monthly_income
  monthly_obligations/custom_monthly_obligations -> monthly_obligations -> monthly_obligations
  credit_score/custom_credit_score -> credit_score     -> credit_score
  employment_months/custom_employment_months -> employment_months -> employment_months
  loan_amount -> loan_amount                           -> (not scored, carried)
  repayment_periods/custom_tenure_months -> loan_tenure_months -> (not scored, carried)
"""
import json
import os
from pathlib import Path

import requests

from prototype_0.contracts.underwriting import UnderwritingInput

DATA_DIR = Path(__file__).resolve().parents[1] / "data"


class FrappeUnavailable(Exception):
    pass


class UnknownApplication(Exception):
    pass


class MockStore:
    """In-memory stand-in for Frappe Loan Application records (synthetic only)."""

    def __init__(self):
        fixtures = json.loads((DATA_DIR / "applicants.json").read_text())["cases"]
        self._apps = {}
        for c in fixtures:
            # Every fixture gets a record — even missing/invalid ones — so the
            # orchestrator proves it fails safely at validation, not retrieval.
            self._apps[c["application_id"]] = {
                "name": c["application_id"],
                "applicant": c["applicant_id"],
                "applicant_name": "Synthetic Test Applicant",
                "loan_product": "SYNTHETIC-PERSONAL-LOAN",
                "loan_amount": c["loan_amount"],
                "repayment_periods": c["loan_tenure_months"],
                "custom_monthly_income": c["monthly_income"],
                "custom_monthly_obligations": c["monthly_obligations"],
                "custom_credit_score": c["credit_score"],
                "custom_employment_months": c["employment_months"],
                "status": "Applied",
            }

    def get(self, application_id: str) -> dict:
        try:
            return dict(self._apps[application_id])
        except KeyError:
            raise UnknownApplication(f"unknown application: {application_id}")


def from_frappe_doc(doc: dict) -> UnderwritingInput:
    """Explicit field mapping; raises pydantic ValidationError on bad data."""
    return UnderwritingInput(
        application_id=doc.get("name") or doc.get("application_id", ""),
        applicant_id=doc.get("applicant") or doc.get("applicant_id", ""),
        monthly_income=doc.get("custom_monthly_income", doc.get("monthly_income")),
        monthly_obligations=doc.get("custom_monthly_obligations", doc.get("monthly_obligations")),
        credit_score=doc.get("custom_credit_score", doc.get("credit_score")),
        employment_months=doc.get("custom_employment_months", doc.get("employment_months")),
        loan_amount=doc.get("loan_amount"),
        loan_tenure_months=doc.get("repayment_periods", doc.get("loan_tenure_months")),
    )


class FrappeClient:
    """Minimal live-Frappe REST client (read-only for P0)."""

    def __init__(self, base_url=None, api_key=None, api_secret=None):
        self.base_url = (base_url or os.environ.get("FRAPPE_URL", "")).rstrip("/")
        self.api_key = api_key or os.environ.get("FRAPPE_API_KEY", "")
        self.api_secret = api_secret or os.environ.get("FRAPPE_API_SECRET", "")
        if not (self.base_url and self.api_key and self.api_secret):
            raise FrappeUnavailable("FRAPPE_URL / FRAPPE_API_KEY / FRAPPE_API_SECRET not set")

    def _headers(self):
        return {"Authorization": f"token {self.api_key}:{self.api_secret}"}

    def get(self, application_id: str) -> dict:
        try:
            r = requests.get(
                f"{self.base_url}/api/resource/Loan Application/{application_id}",
                headers=self._headers(),
                timeout=15,
            )
        except requests.RequestException as e:
            raise FrappeUnavailable(f"frappe unreachable: {e}")
        if r.status_code == 404:
            raise UnknownApplication(f"unknown application: {application_id}")
        if not r.ok:
            raise FrappeUnavailable(f"frappe HTTP {r.status_code}: {r.text[:200]}")
        return r.json().get("data", {})


def get_store():
    """Live client when env is configured, else the synthetic mock store."""
    try:
        return FrappeClient()
    except FrappeUnavailable:
        return MockStore()  # ponytail: mock fallback keeps P0 runnable without a live site
