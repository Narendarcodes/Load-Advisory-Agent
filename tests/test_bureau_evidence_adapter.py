"""Bureau evidence survives the existing Frappe evidence adapter (record_json round trip).

The adapter writes only the legacy top-level columns; the additive outcome/review/bureau
blocks live inside `record_json`, so the DocType and decision-evidence/1 contract do not
change. A live site is not available in this environment: these tests use a mock transport.
"""
import json
from datetime import datetime, timezone
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from loan_advisory.application.lifecycle import process_application, process_bureau_application
from loan_advisory.infrastructure.bureau_client import BureauClient
from loan_advisory.infrastructure.evidence_store import FrappeEvidenceSink, InMemoryEvidenceSink
from loan_advisory.infrastructure.frappe_adapter import MockStore
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


class _Resp:
    def __init__(self, status_code: int, payload: dict | None = None):
        self.status_code = status_code
        self._payload = payload or {}
        self.text = json.dumps(self._payload)

    @property
    def ok(self) -> bool:
        return 200 <= self.status_code < 300

    def json(self) -> dict:
        return self._payload


class _Frappe:
    base_url = "http://127.0.0.1:8080"

    def _headers(self) -> dict:
        return {}


@pytest.fixture
def frappe(monkeypatch, tmp_path):
    calls, stored = [], {}

    def request(method, url, headers=None, timeout=None, **kw):
        payload = kw.get("json")
        calls.append((method, url, payload))
        if method == "GET" and "/Loan Decision Evidence/" in url:
            rid = url.rsplit("/", 1)[-1]
            if rid in stored:
                return _Resp(200, {"data": {"record_json": json.dumps(stored[rid])}})
            return _Resp(404, {})
        if method == "POST" and "/Loan Decision Evidence" in url:
            stored[payload["record_id"]] = json.loads(payload["record_json"])
            return _Resp(200, {"data": {"name": payload["record_id"]}})
        if method == "PUT" and "/Loan Application/" in url:
            return _Resp(200, {"data": {}})
        return _Resp(500, {})

    monkeypatch.setattr("loan_advisory.infrastructure.evidence_store.requests.request", request)
    sink = FrappeEvidenceSink(client=_Frappe(), trace_dir=str(tmp_path / "traces"))
    return sink, calls, stored, tmp_path


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
    sink, calls, stored, _ = frappe
    rec = _bureau_record(_case("NO_HIT"))
    assert rec["decision"] == "ERROR" and rec["outcome"] == "REVIEW"  # legacy Select untouched

    sink.persist(rec, native_status="Open", trace={"node": "zen"})
    post = next(p for m, _, p in calls if m == "POST")
    assert post["decision"] == "ERROR"  # top-level column stays legacy
    assert "outcome" not in post and "review" not in post and "bureau" not in post
    assert "review" in json.loads(post["record_json"])

    back = sink.get_record(rec["record_id"])
    assert back["outcome"] == "REVIEW"
    assert back["review"]["reason_codes"] == ["DQ_BUREAU_NO_HIT"]
    assert back["review"]["required"] is True
    assert back["bureau"]["data_quality"]["category"] == "DATA_QUALITY"
    assert back["bureau"]["score"]["source"] == rec["bureau"]["score"]["source"]
    assert back == stored[rec["record_id"]]


def test_provider_failure_round_trips_as_error_with_retryable_flag(frappe):
    sink, calls, _, _ = frappe
    rec = _bureau_record(_case("VALID_PASS"), scenario="TIMEOUT")
    sink.persist(rec, native_status="Open", trace={"node": "zen"})
    back = sink.get_record(rec["record_id"])
    assert back["outcome"] == back["decision"] == "ERROR"
    assert back["review"] is None
    assert back["bureau"]["provider_error"]["code"] == "BUREAU_TIMEOUT"
    assert back["bureau"]["provider_error"]["retryable"] is True


def test_plain_lifecycle_record_stays_additive_and_legacy_compatible(frappe):
    sink, calls, _, _ = frappe
    rec = process_application("APP-TEST-001", MockStore(), InMemoryEvidenceSink(), now=NOW).record
    assert rec["outcome"] == rec["decision"]
    assert rec["review"] is None and rec["bureau"] is None
    sink.persist(rec, native_status="Open", trace={"node": "zen"})
    back = sink.get_record(rec["record_id"])
    assert back["schema"] == "decision-evidence/1"
    assert back["decision"] == rec["decision"] and back["outcome"] == rec["decision"]
    assert set(("record_id", "policy", "inputs", "rule_evaluations", "failed_reason_codes")) <= set(back)


def test_persisting_the_same_record_id_twice_does_not_insert_twice(frappe):
    sink, calls, _, _ = frappe
    rec = _bureau_record(_case("VALID_PASS", 0))
    sink.persist(rec, native_status="Approved", trace={"node": "zen"})
    sink.persist(rec, native_status="Approved", trace={"node": "zen"})
    assert sum(1 for m, u, _ in calls if m == "POST") == 1
    assert sum(1 for m, u, _ in calls if m == "PUT") == 2


def test_trace_is_written_as_utf8_alongside_the_record(frappe):
    sink, _, _, tmp_path = frappe
    rec = _bureau_record(_case("VALID_PASS", 0))
    sink.persist(rec, native_status="Approved", trace={"note": "₹ synthetic"})
    path = tmp_path / "traces" / f"{rec['trace_ref']['sha256']}.json"
    assert path.exists()
    assert json.loads(path.read_text(encoding="utf-8"))["note"] == "₹ synthetic"
