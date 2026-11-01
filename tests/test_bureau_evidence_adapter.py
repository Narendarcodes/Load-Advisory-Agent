"""Evidence records survive the trusted Frappe ingestion method (record_json round trip).

The FastAPI sink no longer holds Document permissions: it calls
`loan_advisory_portal.api.evidence.ingest` with a dedicated `Evidence Service`
credential. These tests use a fake transport that mirrors the method contract:
application linkage, immutable record id, and a review/outcome/bureau payload that
travels whole inside `record_json`.
"""
import json
from datetime import datetime, timezone
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from loan_advisory.application.lifecycle import process_application, process_bureau_application
from loan_advisory.infrastructure.bureau_client import BureauClient
from loan_advisory.infrastructure.evidence_store import (
    EVIDENCE_GET_METHOD,
    EVIDENCE_METHOD,
    EvidenceRejected,
    FrappeEvidenceSink,
    InMemoryEvidenceSink,
)
from loan_advisory.infrastructure.frappe_adapter import FrappeClient, FrappeUnavailable, MockStore
from synthetic_bureau.app import create_app
from synthetic_bureau.labeling import to_frappe_doc

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = json.loads((ROOT / "data/synthetic/bureau/cases_120.json").read_text(encoding="utf-8"))
NOW = datetime(2026, 10, 24, tzinfo=timezone.utc)


def _case(scenario: str, position: int = 0) -> dict:
    return [c for c in FIXTURE["cases"] if c["scenario"] == scenario][position]


class _Store:
    def __init__(self, case: dict):
        self._doc = to_frappe_doc(case)

    def get(self, _application_id: str) -> dict:
        return dict(self._doc)


class _EvidenceClient:
    """Fake Frappe transport for the two whitelisted evidence methods."""

    base_url = "http://127.0.0.1:8080"

    def __init__(self, docstatus: int = 0):
        self.calls = []
        self.stored = {}
        self.docstatus = docstatus

    def call_method(self, method, payload):
        self.calls.append((method, payload))
        if method == EVIDENCE_GET_METHOD:
            rid = payload["record_id"]
            if rid not in self.stored:
                raise FrappeUnavailable("evidence not found")
            return self.stored[rid]
        if method != EVIDENCE_METHOD:
            raise AssertionError(f"unexpected method {method}")
        record = payload["record"]
        assert payload["expected_application"] == record["application_ref"]
        rid = record["record_id"]
        action = "unchanged" if rid in self.stored else "created"
        self.stored.setdefault(rid, record)
        wrote_native = self.docstatus == 0
        return {
            "record_id": rid, "application": record["application_ref"], "action": action,
            "lifecycle_state": record["lifecycle_state"], "docstatus": self.docstatus,
            "wrote_native_status": wrote_native,
        }


@pytest.fixture
def frappe(tmp_path):
    client = _EvidenceClient()
    sink = FrappeEvidenceSink(client=client, trace_dir=str(tmp_path / "traces"))
    return sink, client, tmp_path


def _persist(sink, record, native_status="Open", trace=None):
    return sink.persist(record, native_status=native_status, trace=trace or {},
                        expected_application=record["application_ref"])


def _bureau_record(case: dict, scenario: str | None = None) -> dict:
    http = TestClient(create_app())
    try:
        out = process_bureau_application(
            case["application"]["application_id"], _Store(case), InMemoryEvidenceSink(),
            BureauClient(client=http), scenario=scenario, now=NOW)
    finally:
        http.close()
    return out.record


def test_review_record_round_trips_through_record_json(frappe):
    sink, client, _ = frappe
    rec = _bureau_record(_case("NO_HIT"))
    assert rec["decision"] == "ERROR" and rec["outcome"] == "REVIEW"  # legacy Select untouched

    _persist(sink, rec, trace={"node": "zen"})
    assert [m for m, _ in client.calls] == [EVIDENCE_METHOD]  # no REST DocType writes
    sent = client.calls[0][1]["record"]
    assert sent["decision"] == "ERROR"
    assert sent["review"]["reason_codes"] == ["DQ_BUREAU_NO_HIT"]
    assert sent["bureau"]["data_quality"]["category"] == "DATA_QUALITY"

    back = sink.get_record(rec["record_id"])
    assert back["outcome"] == "REVIEW"
    assert back["review"]["required"] is True
    assert back["bureau"]["score"]["source"] == rec["bureau"]["score"]["source"]
    assert back == client.stored[rec["record_id"]]


def test_provider_failure_round_trips_as_error_with_retryable_flag(frappe):
    sink, _, _ = frappe
    rec = _bureau_record(_case("VALID_PASS"), scenario="TIMEOUT")
    _persist(sink, rec, trace={"node": "zen"})
    back = sink.get_record(rec["record_id"])
    assert back["outcome"] == back["decision"] == "ERROR"
    assert back["review"] is None
    assert back["bureau"]["provider_error"]["code"] == "BUREAU_TIMEOUT"
    assert back["bureau"]["provider_error"]["retryable"] is True


def test_plain_lifecycle_record_stays_additive_and_legacy_compatible(frappe):
    sink, _, _ = frappe
    rec = process_application("APP-TEST-001", MockStore(), InMemoryEvidenceSink(), now=NOW).record
    assert rec["outcome"] == rec["decision"]
    assert rec["review"] is None and rec["bureau"] is None
    _persist(sink, rec, trace={"node": "zen"})
    back = sink.get_record(rec["record_id"])
    assert back["schema"] == "decision-evidence/1"
    assert back["decision"] == rec["decision"] and back["outcome"] == rec["decision"]
    assert set(("record_id", "policy", "inputs", "rule_evaluations", "failed_reason_codes")) <= set(back)


def test_persisting_the_same_record_twice_is_idempotent(frappe):
    sink, client, _ = frappe
    rec = _bureau_record(_case("VALID_PASS", 0))
    first = _persist(sink, rec, native_status="Approved", trace={"node": "zen"})
    second = _persist(sink, rec, native_status="Approved", trace={"node": "zen"})
    assert first["action"] == "created" and second["action"] == "unchanged"
    assert list(client.stored) == [rec["record_id"]]
    assert sum(1 for m, _ in client.calls if m == EVIDENCE_METHOD) == 2


def test_native_status_is_decided_server_side(frappe):
    """Portal applications are submitted before evaluation; the method, not the sink, decides."""
    sink, client, _ = frappe
    client.docstatus = 1
    rec = process_application("APP-TEST-001", MockStore(), InMemoryEvidenceSink(), now=NOW).record
    result = _persist(sink, rec, native_status="Rejected")
    assert result["wrote_native_status"] is False and result["docstatus"] == 1
    assert client.calls[0][1]["native_status"] == "Rejected"  # forwarded, not applied by the sink


def test_expected_application_is_required_and_must_match(frappe):
    sink, client, _ = frappe
    rec = _bureau_record(_case("VALID_PASS", 0))
    with pytest.raises(EvidenceRejected):
        sink.persist(rec, native_status="Open", trace={})
    with pytest.raises(EvidenceRejected):
        sink.persist(rec, native_status="Open", trace={}, expected_application="APP-OTHER-999")
    assert client.calls == [] and client.stored == {}


def test_trace_is_written_as_utf8_alongside_the_record(frappe):
    sink, client, tmp_path = frappe
    rec = _bureau_record(_case("VALID_PASS", 0))
    _persist(sink, rec, native_status="Approved", trace={"note": "₹ synthetic"})
    path = tmp_path / "traces" / f"{rec['trace_ref']['sha256']}.json"
    assert path.exists()
    assert json.loads(path.read_text(encoding="utf-8"))["note"] == "₹ synthetic"
    assert client.calls[0][1]["trace_store"] == str(tmp_path / "traces")


def test_utf8_is_stored_literally_in_the_record(frappe):
    sink, client, _ = frappe
    rec = dict(_bureau_record(_case("VALID_PASS", 0)))
    rec["flags"] = ["UTF8_₹_राम_తెలుగు"]
    rec["review"] = {"notes": "₹1,00,000 — हिन्दी पाठ / తెలుగు పాఠం", "reason_codes": [], "required": True}
    _persist(sink, rec, native_status="Approved")
    sent = client.calls[0][1]["record"]
    assert sent["flags"] == rec["flags"]
    assert sent["review"]["notes"] == rec["review"]["notes"]


def test_bureau_hold_over_legacy_inputs_gets_its_own_evidence_record(frappe):
    """Live-Frappe validation found this: a hold over the same application/inputs as an earlier
    plain credit decision used to reuse its record_id, and the idempotent sink then kept the stale
    legacy record_json while the application pointed at it. Different evidence must mean a new id."""
    sink, client, _ = frappe
    case = _case("NO_HIT")
    app = case["application"]["application_id"]
    legacy = process_application(app, _Store(case), InMemoryEvidenceSink(), now=NOW).record
    hold = _bureau_record(case)
    assert hold["application_ref"] == legacy["application_ref"]
    assert hold["inputs"]["input_sha256"] == legacy["inputs"]["input_sha256"]
    assert hold["decision"] == "ERROR" and hold["outcome"] == "REVIEW"
    assert hold["record_id"] != legacy["record_id"]

    _persist(sink, legacy)
    _persist(sink, hold)
    assert set(client.stored) == {legacy["record_id"], hold["record_id"]}
    assert client.stored[legacy["record_id"]]["bureau"] is None
    back = sink.get_record(hold["record_id"])
    assert back["outcome"] == "REVIEW"
    assert back["bureau"]["data_quality"]["category"] == "DATA_QUALITY"


def test_get_record_uses_the_trusted_read_method(frappe):
    sink, client, _ = frappe
    rec = _bureau_record(_case("VALID_PASS", 0))
    _persist(sink, rec)
    sink.get_record(rec["record_id"])
    assert [m for m, _ in client.calls][-1] == EVIDENCE_GET_METHOD
    assert client.calls[-1][1] == {"record_id": rec["record_id"]}


def test_for_evidence_never_falls_back_to_the_read_credential():
    read_only = {"FRAPPE_URL": "http://frappe", "FRAPPE_API_KEY": "k", "FRAPPE_API_SECRET": "s"}
    with pytest.raises(FrappeUnavailable):
        FrappeClient.for_evidence(read_only)
    with pytest.raises(FrappeUnavailable):
        FrappeClient.for_evidence({"EVIDENCE_FRAPPE_API_KEY": "k", "EVIDENCE_FRAPPE_API_SECRET": "s"})
    client = FrappeClient.for_evidence({
        "EVIDENCE_FRAPPE_URL": "http://frappe", "EVIDENCE_FRAPPE_API_KEY": "ek",
        "EVIDENCE_FRAPPE_API_SECRET": "es",
    })
    assert client.base_url == "http://frappe" and client.api_key == "ek"
