"""Phase 1 security boundary B: the agent can read the system of record and nothing else.

Three things are proved here, each in the way that actually hurts to break:

1. **Construction refuses.** `DecisionTools` rejects a write-capable store or evidence object, so a
   regression that wires `MockStore`, `FrappeClient` or `FrappeEvidenceSink` back in fails at startup
   rather than on the first write.
2. **The shipped wiring holds no writer.** The offline and live graphs are built from read-only views,
   and nothing reachable from `agent.tools` exposes `create`, `set_status`, `persist` or `call_method`.
3. **The agent's read is projected.** A Loan Application reaches the turn as the fields the decision path
   uses, never as the whole document — and the full-document read the pipeline still uses belongs to an
   object the agent is refused at construction.
"""
import json
import re
from pathlib import Path

import pytest

from loan_advisory.agent import runtime
from loan_advisory.agent.contracts import Session
from loan_advisory.agent.tools import DecisionTools, FrappeEvidenceSource, InMemoryEvidenceSource
from loan_advisory.application.ports import ReadOnlyBoundaryViolation, assert_reader
from loan_advisory.infrastructure import evidence_store, frappe_adapter
from loan_advisory.infrastructure.evidence_store import (FrappeEvidenceReader, FrappeEvidenceSink,
                                                         InMemoryEvidenceSink)
from loan_advisory.infrastructure.frappe_adapter import (MockStore, ReadOnlyDocumentStore, ReadOnlyFrappeApplication,
                                                         READ_FIELDS, FrappeClient, read_only_view)
from tests.test_agent_graph import FakePolicy, ScriptedLLM

OWNED = {"name": "APP-TEST-005", "applicant": "CUS-TEST-005"}


# ------------------------------------------------------------------ 1. construction refuses
def test_decision_tools_refuses_a_write_capable_store():
    sink = InMemoryEvidenceSink()
    with pytest.raises(ReadOnlyBoundaryViolation, match="application store"):
        DecisionTools(MockStore(), InMemoryEvidenceSource(sink))


def test_decision_tools_refuses_a_write_capable_evidence_source():
    """The old shape — an evidence source holding the ingest sink — is refused, not merely discouraged."""
    store = MockStore().reader()
    with pytest.raises(ReadOnlyBoundaryViolation, match="evidence source"):
        DecisionTools(store, FrappeEvidenceSource(FrappeEvidenceSink(client=object())))


def test_assert_reader_sees_through_a_reader_that_holds_a_client():
    """A class named like a reader but keeping the client inside it is still a writer."""
    class FakeReader:
        def __init__(self, client):
            self.client = client

        def get(self, ref):
            return {}

    with pytest.raises(ReadOnlyBoundaryViolation):
        assert_reader(FakeReader(FrappeClient("https://x.invalid", "k", "s")), role="a wrapper")


def test_the_read_only_views_pass_the_same_guard():
    assert_reader(MockStore().reader(), role="mock reader")
    assert_reader(ReadOnlyFrappeApplication("https://x.invalid", "k", "s"), role="live reader")
    assert_reader(ReadOnlyDocumentStore({"A": OWNED}), role="document view")


def test_a_model_objects_homonym_is_not_mistaken_for_a_write_to_the_record():
    """The real retriever holds a cross-encoder, and that library spells "persist the weights" `save`.

    Found live, not in review: the guard matched the name everywhere, so the serving object with a reranker
    loaded was refused while every fake retriever in the suite passed. Names count on project adapters only;
    the walk itself still goes through third-party state.
    """
    class ThirdPartyModel:
        def save(self, *a, **kw):
            raise AssertionError("not called")

        def insert(self, *a, **kw):
            raise AssertionError("not called")

    class Retriever:
        def __init__(self):
            self.reranker = ThirdPartyModel()

    assert_reader(Retriever(), role="the agent's retriever")


def test_a_project_writer_nested_inside_a_third_party_object_is_still_refused():
    """The exemption is about names on foreign classes, not about hiding writers inside them."""
    class Holder:
        def __init__(self, inner):
            self.inner = inner

    with pytest.raises(ReadOnlyBoundaryViolation, match="FrappeClient exposes call_method, create"):
        assert_reader(Holder(FrappeClient("https://x.invalid", "k", "s")), role="a retriever")


# ------------------------------------------------------------------ 2. the shipped wiring
def test_the_offline_agent_holds_no_write_capable_object():
    agent, store, _ = runtime.build_offline_agent(llm=ScriptedLLM(intent="explain"), policy_tools=FakePolicy())
    assert not hasattr(agent.tools.store, "create")
    assert not hasattr(agent.tools.evidence, "persist")
    # the raw store still writes, for the conventional workflow that decided the fixtures
    assert hasattr(store, "create") and hasattr(store, "set_status")


def test_the_live_agent_is_wired_without_an_evidence_sink(monkeypatch):
    monkeypatch.setenv("FRAPPE_URL", "https://p1loan.invalid")
    monkeypatch.setenv("FRAPPE_API_KEY", "k")
    monkeypatch.setenv("FRAPPE_API_SECRET", "s")
    monkeypatch.setenv("EVIDENCE_FRAPPE_URL", "https://p1loan.invalid")
    monkeypatch.setenv("EVIDENCE_FRAPPE_API_KEY", "ek")
    monkeypatch.setenv("EVIDENCE_FRAPPE_API_SECRET", "es")
    monkeypatch.setattr(frappe_adapter.requests, "get",
                        lambda url, headers=None, timeout=None, params=None, **kw:
                        _Response({"data": [dict(OWNED, custom_latest_evidence="EV-1")]}))
    monkeypatch.setattr(evidence_store.requests, "get",
                        lambda url, headers=None, timeout=None, params=None, **kw:
                        _Response({"data": [{"record_json": "{}"}]}))
    agent, _reader = runtime.build_live_agent(llm=object())
    assert_reader(agent.tools.store, role="live store")
    assert_reader(agent.tools.evidence, role="live evidence")
    assert not hasattr(agent.tools.store, "create")
    assert not hasattr(agent.tools.evidence, "persist")
    assert not hasattr(agent.tools.evidence.reader, "persist")


def test_no_live_writer_is_constructed_or_imported_in_the_agent_wiring():
    """runtime.py builds readers only. Prose may name the sink; code may not import or call it."""
    text = Path(runtime.__file__).read_text(encoding="utf-8")
    for writer in ("FrappeEvidenceSink", "FrappeClient", "BureauClient", "run_bureau_evaluation"):
        assert f"{writer}(" not in text, writer
        assert not re.search(rf"^\s*(from\s+\S+\s+)?import\s+.*\b{writer}\b", text, re.M), writer
    assert not re.search(r"^\s*from\s+\S*bureau\S*\s+import", text, re.M)


# ------------------------------------------------------------------ 3. the read is projected
# The full column set a live Loan Application returns. Measured against Frappe 16.51 on 2026-11-03,
# where the single-document endpoint ignored `fields` and handed back all 41 of these, including
# applicant_name / applicant_email_address / applicant_phone_number / zip_code.
FULL_APPLICATION_DOC = {
    "name": "APP-TEST-005", "owner": "Administrator", "creation": "2026-01-01 00:00:00",
    "modified": "2026-01-02 00:00:00", "modified_by": "Administrator", "docstatus": 1, "idx": 0,
    "applicant": "CUS-TEST-005", "applicant_type": "Customer", "applicant_name": "Synthetic Borrower",
    "applicant_email_address": "borrower@example.invalid", "applicant_phone_number": "9000000000",
    "zip_code": "500001", "company": "Loan Rangers Test NBFC", "loan_product": "SYN-PERSONAL-001",
    "loan_amount": 300000, "repayment_method": "Repay Over Number of Periods", "repayment_periods": 36,
    "repayment_amount": 9000, "rate_of_interest": 14.5, "posting_date": "2026-01-01",
    "is_term_loan": 1, "is_secured_loan": 0, "maximum_loan_amount": 2000000,
    "total_payable_amount": 324000, "total_payable_interest": 24000, "proposed_pledges": [],
    "co_applicants": [], "documents": [], "status": "Rejected",
    "custom_external_ref": "REF-5", "custom_loan_purpose": "travel", "custom_submitted_at": "2026-01-01 00:00:00",
    "custom_policy_version": "synthetic-v1", "custom_lifecycle_state": "REJECTED",
    "custom_latest_evidence": "EV-1", "custom_monthly_income": 90000, "custom_monthly_obligations": 12000,
    "custom_credit_score": 690, "custom_employment_months": 18,
}


class _Response:
    def __init__(self, payload, status_code=200):
        self._payload, self.status_code = payload, status_code
        self.ok = status_code < 400
        self.text = ""

    def json(self):
        return self._payload


def _frappe_like_server(monkeypatch):
    """A fake that behaves like the real endpoint, not like the one we wish we had.

    `GET /api/resource/<doctype>/<name>` returns the whole document whatever `fields` says;
    `GET /api/resource/<doctype>?fields=[...]` projects. A read implementation that picks the first
    form therefore fails here even though its request looks correct.
    """
    calls = []

    def fake_get(url, headers=None, timeout=None, params=None, **kwargs):
        calls.append({"url": url, "params": params or {}})
        if url.rstrip("/").endswith("/Loan Application"):
            wanted = json.loads(params["fields"]) if params and "fields" in params else sorted(FULL_APPLICATION_DOC)
            return _Response({"data": [{k: FULL_APPLICATION_DOC.get(k) for k in wanted}]})
        return _Response({"data": dict(FULL_APPLICATION_DOC)})        # single-doc GET: ignores `fields`

    monkeypatch.setattr(frappe_adapter.requests, "get", fake_get)
    return calls


def test_the_agent_read_returns_only_the_decision_fields(monkeypatch):
    """Asserted on the RESPONSE: the borrower's name, e-mail, phone and zip never reach the agent."""
    calls = _frappe_like_server(monkeypatch)
    doc = ReadOnlyFrappeApplication("https://p1loan.invalid", "k", "s").get("APP-TEST-005")
    assert sorted(doc) == sorted(READ_FIELDS)
    for pii in ("applicant_name", "applicant_email_address", "applicant_phone_number", "zip_code",
                "customer_name", "owner", "modified_by", "documents"):
        assert pii not in doc, pii
    assert doc["applicant"] == "CUS-TEST-005" and doc["custom_credit_score"] == 690
    assert calls[0]["url"].endswith("/api/resource/Loan Application"), "read must use the projecting endpoint"
    assert json.loads(calls[0]["params"]["filters"]) == [["name", "=", "APP-TEST-005"]]


def test_the_pipeline_read_is_the_whole_document_and_cannot_be_the_agents_store(monkeypatch):
    """The split is deliberate: the underwriting pipeline keeps its full document, the agent never gets it.

    `read_full_application` is not projected because the pipeline's field set is its own business —
    `resolve_credit_score` needs `credit_score_origin`, which is not a decision input, so projecting it
    would have changed underwriting by accident. What makes that safe is the same object also exposing
    `create` and `call_method`: `DecisionTools` refuses it before a turn can run.
    """
    calls = _frappe_like_server(monkeypatch)
    doc = FrappeClient("https://p1loan.invalid", "k", "s").get("APP-TEST-005")
    assert calls[0]["url"].endswith("/api/resource/Loan Application/APP-TEST-005")
    assert doc == FULL_APPLICATION_DOC
    assert "credit_score_origin" not in READ_FIELDS
    with pytest.raises(ReadOnlyBoundaryViolation, match="FrappeClient exposes call_method, create"):
        assert_reader(FrappeClient("https://p1loan.invalid", "k", "s"), role="the agent's application store")


def test_a_missing_application_is_unknown_not_empty(monkeypatch):
    calls = []

    def fake_get(url, headers=None, timeout=None, params=None, **kwargs):
        calls.append(url)
        return _Response({"data": []})

    monkeypatch.setattr(frappe_adapter.requests, "get", fake_get)
    from loan_advisory.infrastructure.frappe_adapter import UnknownApplication
    with pytest.raises(UnknownApplication):
        ReadOnlyFrappeApplication("https://p1loan.invalid", "k", "s").get("ACC-LOAP-9999-99999")


def test_the_projection_covers_every_field_the_agent_reads():
    """The field list is not a guess: each consumer's inputs are named here."""
    from loan_advisory.agent.facts import SCORED
    from loan_advisory.infrastructure.frappe_adapter import from_frappe_doc

    needed = {"name", "applicant", "loan_product", "status", "custom_lifecycle_state",
              "custom_latest_evidence", "repayment_periods", "loan_amount"}
    needed |= {f"custom_{k}" for k in SCORED}
    assert needed <= set(READ_FIELDS), sorted(needed - set(READ_FIELDS))
    doc = {"name": "APP-1", "applicant": "CUS-1", "custom_monthly_income": 90000,
           "custom_monthly_obligations": 12000, "custom_credit_score": 780, "custom_employment_months": 48,
           "loan_amount": 300000, "repayment_periods": 36}
    assert from_frappe_doc(doc).application_id == "APP-1"


def test_every_projected_field_is_a_field_frappe_actually_has():
    """A `fields` list naming a missing DocType field is an error, not a null, so this is load-bearing.

    The custom half is checked against the portal's own installer; the standard half against the fields
    `FrappeClient.create` already posts. Anything else in READ_FIELDS is a bug waiting for a live site.
    The installer's field list lives in `install.py`, or in `custom_fields.py` (pure data that
    `install.py` imports) once the Saral LMS doctypes (PR #48) are in; both are read.
    """
    app = Path(__file__).resolve().parents[1] / "apps/loan_advisory_portal/loan_advisory_portal"
    created = set()
    for name in ("install.py", "custom_fields.py"):
        if (app / name).exists():
            # install.py spells fields as dicts ("fieldname": "x"); custom_fields.py as _f("x", ...).
            source = (app / name).read_text(encoding="utf-8")
            created |= set(re.findall(r'(?:"fieldname":\s*|\b_f\(\s*)"([^"]+)"', source))
    custom = {f for f in READ_FIELDS if f.startswith("custom_")}
    assert custom <= created, sorted(custom - created)
    assert set(READ_FIELDS) - custom == frappe_adapter.STANDARD_LOAN_FIELDS


# ------------------------------------------------------------------ authorization survives the view
def test_ownership_is_still_checked_through_the_read_only_view():
    store = MockStore()
    doc = store.get("APP-TEST-005")
    tools = DecisionTools(read_only_view(store), InMemoryEvidenceSource(InMemoryEvidenceSink()))
    tools.owned_doc("APP-TEST-005", Session(applicant_ref=doc["applicant"]))          # owner: allowed
    with pytest.raises(Exception):
        tools.owned_doc("APP-TEST-005", Session(applicant_ref="CUS-SOMEONE-ELSE"))    # not the owner


def test_what_if_still_cannot_reach_a_writer(monkeypatch, tmp_path):
    """The one in-memory ZEN path keeps its guarantee after the store became a view."""
    agent, store, sink = runtime.build_offline_agent(llm=ScriptedLLM(intent="what_if"), policy_tools=FakePolicy())
    before = store.get("APP-TEST-005")
    changes = {"credit_score": 850}
    result = agent.tools.run_what_if("APP-TEST-005", Session(applicant_ref="CUS-TEST-005"), changes)
    assert result["original_record_unchanged"] is True
    assert result["is_simulation"] is True
    assert store.get("APP-TEST-005") == before
    assert agent.tools.evidence.records is sink.records        # the source reads the live view, not a copy
    assert not [r for r in sink.records.values() if r["is_simulation"]]   # and nothing was persisted


def test_the_service_object_holds_only_the_agent():
    from loan_advisory.agent.server import App
    agent, store, _ = runtime.build_offline_agent(llm=ScriptedLLM(intent="explain"), policy_tools=FakePolicy())
    service = App(agent)
    assert vars(service) == {"agent": agent}


# ------------------------------------------------------------------ the evidence read itself
def test_the_evidence_reader_uses_the_read_identity_and_no_writer(monkeypatch):
    """It reads the stored document, so the ingest credential stays outside the agent process entirely."""
    calls = []
    record = {"record_id": "EV-1", "application_ref": "APP-TEST-005", "decision": "REJECTED"}

    def fake_get(url, headers=None, timeout=None, params=None, json_body=None, **kwargs):
        calls.append({"url": url, "headers": headers, "params": params})
        return _Response({"data": [{"name": "EV-1", "loan_application": "APP-TEST-005",
                                    "record_json": json.dumps(record)}]})

    monkeypatch.setattr(evidence_store.requests, "get", fake_get)
    monkeypatch.setenv("FRAPPE_URL", "https://p1loan.invalid")
    monkeypatch.setenv("FRAPPE_API_KEY", "rk")
    monkeypatch.setenv("FRAPPE_API_SECRET", "rs")
    monkeypatch.delenv("EVIDENCE_FRAPPE_API_KEY", raising=False)      # no ingest credential exists
    reader = FrappeEvidenceReader()
    assert reader.get_record("EV-1") == record
    assert calls[0]["url"].endswith("/api/resource/Loan Decision Evidence")
    assert json.loads(calls[0]["params"]["filters"]) == [["name", "=", "EV-1"]]
    assert json.loads(calls[0]["params"]["fields"]) == list(FrappeEvidenceReader.FIELDS)
    assert calls[0]["headers"]["Authorization"].startswith("token rk:rs")
    for writer in ("persist", "call_method", "create", "set_status", "put", "post"):
        assert not hasattr(reader, writer), writer


def test_the_evidence_reader_fails_closed_on_an_unreadable_record(monkeypatch):
    monkeypatch.setattr(evidence_store.requests, "get",
                        lambda url, **kw: _Response({"data": [{"name": "EV-1", "record_json": "{not json"}]}))
    from loan_advisory.infrastructure.frappe_adapter import FrappeUnavailable
    reader = FrappeEvidenceReader("https://p1loan.invalid", "k", "s")
    with pytest.raises(FrappeUnavailable):
        reader.get_record("EV-1")
    monkeypatch.setattr(evidence_store.requests, "get", lambda url, **kw: _Response({"data": []}))
    with pytest.raises(FrappeUnavailable):
        reader.get_record("EV-1")


def test_the_evidence_source_reads_through_that_reader(monkeypatch):
    record = {"record_id": "EV-9", "decision": "APPROVED"}
    monkeypatch.setattr(evidence_store.requests, "get",
                        lambda url, **kw: _Response({"data": [{"record_json": json.dumps(record)}]}))
    source = FrappeEvidenceSource(FrappeEvidenceReader("https://p1loan.invalid", "k", "s"))
    assert source.latest("APP-1", {"custom_latest_evidence": "EV-9"})["record_id"] == "EV-9"
    assert source.latest("APP-1", {}) is None            # no pointer: nothing is fetched
    assert_reader(source, role="evidence source")
