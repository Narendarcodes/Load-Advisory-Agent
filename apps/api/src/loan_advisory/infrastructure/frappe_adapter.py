"""Frappe adapter: Loan Application -> canonical UnderwritingInput.

Two backends, one mapping:
- MockStore: in-memory synthetic applications. Tests and demos only, and only
  when explicitly selected with `AGENT_STORE=mock`.
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
import uuid
from datetime import date, datetime, timezone

import requests

from decision_engine.paths import repo_root
from decision_engine.schemas.underwriting import UnderwritingInput

DATA_DIR = repo_root() / "data" / "synthetic"
DOCTYPE = "Loan Application"
DEFAULT_COMPANY = "Loan Rangers Test NBFC"   # ids seeded by infra/frappe/bootstrap/seed_site.py
DEFAULT_PRODUCT = "SYN-PERSONAL-001"
LIST_FIELDS = ("name", "loan_amount", "repayment_periods", "custom_lifecycle_state", "status",
               "creation", "modified", "custom_loan_purpose")


class FrappeUnavailable(Exception):
    pass


class UnknownApplication(Exception):
    pass


class MockStore:
    """In-memory stand-in for Frappe Loan Application records (synthetic only)."""

    def __init__(self):
        fixtures = json.loads((DATA_DIR / "applicants.json").read_text(encoding="utf-8"))["cases"]
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

    def create(self, fields: dict) -> dict:
        """Offline/test write path. Never reachable unless `AGENT_STORE=mock` or --offline."""
        ref = fields.get("name") or f"APP-LCL-{uuid.uuid4().hex[:8].upper()}"
        now = datetime.now(timezone.utc).isoformat()
        doc = {"status": "Open", "custom_lifecycle_state": "SUBMITTED", **fields,
               "name": ref, "created_at": now, "modified_at": now}
        doc.setdefault("custom_external_ref", ref)
        self._apps[ref] = doc
        return dict(doc)

    def set_status(self, application_id: str, lifecycle_state: str, native_status: str) -> None:
        doc = self._apps.get(application_id)
        if doc is None:
            raise UnknownApplication(f"unknown application: {application_id}")
        doc.update(custom_lifecycle_state=lifecycle_state, status=native_status,
                   modified_at=datetime.now(timezone.utc).isoformat())

    def list_for(self, applicant_ref: str) -> list[dict]:
        rows = [dict(d) for d in self._apps.values() if d.get("applicant") == applicant_ref]
        rows.sort(key=lambda d: d.get("created_at") or "", reverse=True)
        return rows


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
    """Minimal Frappe REST client for borrower reads and the trusted evidence method.

    The default identity reads applications for the agent. Evidence writes use
    `FrappeClient.for_evidence()`, which requires a separate `Evidence Service` credential.
    """

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
                f"{self.base_url}/api/resource/{DOCTYPE}/{application_id}",
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

    def create(self, fields: dict) -> dict:
        """Create a Loan Application. Raises on any failure: the caller must not report success."""
        body = {
            "doctype": DOCTYPE, "applicant_type": "Customer",
            "company": os.environ.get("FRAPPE_LOAN_COMPANY") or DEFAULT_COMPANY,
            "loan_product": os.environ.get("FRAPPE_LOAN_PRODUCT") or DEFAULT_PRODUCT,
            "posting_date": date.today().isoformat(), "is_term_loan": 1,
            "repayment_method": "Repay Over Number of Periods",
            "status": "Open", "custom_lifecycle_state": "SUBMITTED", **fields,
        }
        try:
            r = requests.post(f"{self.base_url}/api/resource/{DOCTYPE}", headers=self._headers(),
                              json=body, timeout=20)
        except requests.RequestException as e:
            raise FrappeUnavailable(f"frappe unreachable: {e}")
        if not r.ok:
            raise FrappeUnavailable(f"application create HTTP {r.status_code}: {r.text[:200]}")
        doc = r.json().get("data") or {}
        if not doc.get("name"):
            raise FrappeUnavailable("frappe accepted the application but returned no name")
        return doc

    def list_for(self, applicant_ref: str, limit: int = 50) -> list[dict]:
        """Only the signed-in applicant's records: the filter is server-side, never a body field."""
        params = {"filters": json.dumps([["applicant", "=", applicant_ref]]),
                  "fields": json.dumps(list(LIST_FIELDS)),
                  "order_by": "modified desc", "limit_page_length": str(limit)}
        try:
            r = requests.get(f"{self.base_url}/api/resource/{DOCTYPE}", headers=self._headers(),
                             params=params, timeout=15)
        except requests.RequestException as e:
            raise FrappeUnavailable(f"frappe unreachable: {e}")
        if not r.ok:
            raise FrappeUnavailable(f"frappe HTTP {r.status_code}: {r.text[:200]}")
        return r.json().get("data") or []

    def call_method(self, method: str, payload: dict):
        """Call a whitelisted Frappe method; the method itself owns authorization."""
        try:
            r = requests.post(f"{self.base_url}/api/method/{method}", headers=self._headers(),
                              json=payload, timeout=20)
        except requests.RequestException as e:
            raise FrappeUnavailable(f"frappe unreachable: {e}")
        if not r.ok:
            raise FrappeUnavailable(f"frappe method {method} HTTP {r.status_code}: {r.text[:200]}")
        try:
            return r.json().get("message")
        except ValueError:
            raise FrappeUnavailable(f"frappe method {method} returned a non-JSON body") from None

    @classmethod
    def for_evidence(cls, env=None) -> "FrappeClient":
        """Dedicated least-privilege identity; it never falls back to the read credential."""
        env = os.environ if env is None else env
        url = (env.get("EVIDENCE_FRAPPE_URL") or env.get("FRAPPE_URL") or "").rstrip("/")
        key = env.get("EVIDENCE_FRAPPE_API_KEY") or ""
        secret = env.get("EVIDENCE_FRAPPE_API_SECRET") or ""
        if not (url and key and secret):
            raise FrappeUnavailable("EVIDENCE_FRAPPE_API_KEY / EVIDENCE_FRAPPE_API_SECRET not set")
        return cls(base_url=url, api_key=key, api_secret=secret)


def get_store():
    """Live client when configured; synthetic data only on an explicit `AGENT_STORE=mock` opt-in.

    A live configuration that cannot be built raises instead of falling back to synthetic records.
    """
    if os.environ.get("AGENT_STORE") == "mock":
        return MockStore()
    return FrappeClient()
