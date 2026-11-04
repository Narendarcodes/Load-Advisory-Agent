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

# Everything the conversational agent reads, and nothing else. A full Loan Application also carries the
# applicant's name, contact details and document links: the agent has no use for them, so it never receives
# them. Used by `ReadOnlyFrappeApplication.get` only — the pipeline's `FrappeClient.get` reads the whole
# document, because its field set is its own business (see `read_full_application`).
#
# Every name here must be a field Frappe actually has on Loan Application, because a `fields` list naming a
# missing field is an error, not a null. The plain `monthly_income`-style fallbacks in `from_frappe_doc` and the
# synthetic-only `credit_score_origin` are therefore deliberately absent: on a live document they were already
# missing, and on a synthetic one no projection is applied.
READ_FIELDS = ("name", "applicant", "loan_product", "loan_amount", "repayment_periods", "status",
               "custom_lifecycle_state", "custom_latest_evidence",
               "custom_monthly_income", "custom_monthly_obligations", "custom_credit_score",
               "custom_employment_months")

# Real Frappe Lending fields; tests/test_agent_read_boundary.py checks the custom_* half against the portal install.
STANDARD_LOAN_FIELDS = {"name", "applicant", "loan_product", "loan_amount", "repayment_periods", "status"}

RESOLVE_FIELDS = ("name", "applicant", "custom_external_ref", "custom_lifecycle_state")


class FrappeUnavailable(Exception):
    pass


class UnknownApplication(Exception):
    pass


def _credentials(base_url, api_key, api_secret):
    """Resolve and check one Frappe identity from arguments or environment; never a silent fallback."""
    base_url = (base_url or os.environ.get("FRAPPE_URL", "")).rstrip("/")
    api_key = api_key or os.environ.get("FRAPPE_API_KEY", "")
    api_secret = api_secret or os.environ.get("FRAPPE_API_SECRET", "")
    if not (base_url and api_key and api_secret):
        raise FrappeUnavailable("FRAPPE_URL / FRAPPE_API_KEY / FRAPPE_API_SECRET not set")
    return base_url, api_key, api_secret


def read_application(base_url: str, headers: dict, application_id: str) -> dict:
    """Read one Loan Application, projected to READ_FIELDS. This is the agent's read.

    This is a list read filtered on `name`, not `GET /api/resource/<doctype>/<name>`, and that is not
    a style choice: measured against Frappe 16.51 on 2026-11-03, the single-document endpoint ignores a
    `fields` parameter and returns all 41 columns — including `applicant_name`, `applicant_email_address`,
    `applicant_phone_number` and `zip_code`. The list endpoint honours `fields` and returned exactly the
    twelve decision fields with no PII. Projecting the request without checking the response is how the
    first attempt at this boundary passed every offline test and failed live.
    """
    try:
        r = requests.get(f"{base_url}/api/resource/{DOCTYPE}", headers=headers, timeout=15,
                         params={"filters": json.dumps([["name", "=", application_id]]),
                                 "fields": json.dumps(list(READ_FIELDS)),
                                 "limit_page_length": "1"})
    except requests.RequestException as e:
        raise FrappeUnavailable(f"frappe unreachable: {e}")
    if r.status_code == 404:
        raise UnknownApplication(f"unknown application: {application_id}")
    if not r.ok:
        raise FrappeUnavailable(f"frappe HTTP {r.status_code}: {r.text[:200]}")
    rows = r.json().get("data") or []
    if not rows:
        raise UnknownApplication(f"unknown application: {application_id}")
    return rows[0]


def read_full_application(base_url: str, headers: dict, application_id: str) -> dict:
    """Read one whole Loan Application, for the underwriting pipeline.

    Deliberately *not* projected, unlike `read_application`. The pipeline reads fields that are not
    decision inputs — `credit_score_origin`, which `resolve_credit_score` uses to tell a placeholder
    score from a recorded one — so narrowing this list would change underwriting behaviour rather than
    shrink a view. The agent cannot reach this function through its object graph: it is a method of
    `FrappeClient`, which also exposes `create` and `call_method` and so fails `assert_reader`.
    """
    try:
        r = requests.get(f"{base_url}/api/resource/{DOCTYPE}/{application_id}", headers=headers, timeout=15)
    except requests.RequestException as e:
        raise FrappeUnavailable(f"frappe unreachable: {e}")
    if r.status_code == 404:
        raise UnknownApplication(f"unknown application: {application_id}")
    if not r.ok:
        raise FrappeUnavailable(f"frappe HTTP {r.status_code}: {r.text[:200]}")
    return r.json().get("data", {})


def resolve_application(base_url: str, headers: dict, external_ref: str) -> dict | None:
    """Map the borrower-visible reference to a Loan Application, or None. Server-side filter, never a body field."""
    try:
        r = requests.get(f"{base_url}/api/resource/{DOCTYPE}", headers=headers, timeout=15,
                         params={"filters": json.dumps([["custom_external_ref", "=", external_ref]]),
                                 "fields": json.dumps(list(RESOLVE_FIELDS))})
    except requests.RequestException as e:
        raise FrappeUnavailable(f"frappe unreachable: {e}")
    rows = r.json().get("data", []) if r.ok else []
    return rows[0] if rows else None


class ReadOnlyFrappeApplication:
    """The agent's entire view of the system of record: one projected GET per application.

    Built from configuration strings, not from a `FrappeClient`, so there is no create/set_status/call_method
    behind it to reach. `application/ports.assert_reader` refuses anything that has one.
    """

    def __init__(self, base_url=None, api_key=None, api_secret=None):
        self.base_url, self._api_key, self._api_secret = _credentials(base_url, api_key, api_secret)

    def _headers(self) -> dict:
        return {"Authorization": f"token {self._api_key}:{self._api_secret}"}

    def get(self, application_id: str) -> dict:
        return read_application(self.base_url, self._headers(), application_id)


class ReadOnlyDocumentStore:
    """The agent's view of an in-memory store: read one document, never add or change one.

    Holds the document mapping itself, not the store object, so the synthetic store's write helpers
    (`MockStore.create`, `set_status`) are not reachable from the agent graph at all.
    """

    def __init__(self, docs: dict):
        self._docs = docs

    def get(self, application_id: str) -> dict:
        try:
            return dict(self._docs[application_id])
        except KeyError:
            raise UnknownApplication(f"unknown application: {application_id}")


class ReadOnlyFetchStore:
    """Read-only view over a store that ships no reader of its own: one bound `get`, nothing else named.

    The bound method still points at its store, so this is the weaker of the two views — the same
    caveat `application/ports.py` documents for `assert_reader`. Stores that can hand over their
    document mapping (`MockStore`, `PersonaStore`) use `ReadOnlyDocumentStore` instead.
    """

    def __init__(self, fetch):
        self._fetch = fetch

    def get(self, application_id: str) -> dict:
        return self._fetch(application_id)


def read_only_view(store) -> ReadOnlyDocumentStore | ReadOnlyFetchStore:
    """The narrowest view of `store` the agent may hold."""
    reader = getattr(store, "reader", None)
    return reader() if reader else ReadOnlyFetchStore(store.get)


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

    def reader(self) -> ReadOnlyDocumentStore:
        """The read-only view the agent is built against; this object keeps the write helpers."""
        return ReadOnlyDocumentStore(self._apps)

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
        self.base_url, self.api_key, self.api_secret = _credentials(base_url, api_key, api_secret)

    def _headers(self):
        return {"Authorization": f"token {self.api_key}:{self.api_secret}"}

    def get(self, application_id: str) -> dict:
        """The pipeline's read: the whole document. The agent's read is `ReadOnlyFrappeApplication.get`."""
        return read_full_application(self.base_url, self._headers(), application_id)

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
