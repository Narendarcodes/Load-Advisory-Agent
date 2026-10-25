"""Phase 3: bureau-backed lifecycle keeps ZEN's decision and the legacy schema."""
import json
from datetime import datetime, timezone
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from loan_advisory.application.lifecycle import process_application, process_bureau_application
from loan_advisory.infrastructure.bureau_client import BureauClient
from loan_advisory.infrastructure.evidence_store import InMemoryEvidenceSink
from loan_advisory.infrastructure.frappe_adapter import MockStore, UnknownApplication
from synthetic_bureau.app import create_app
from synthetic_bureau.labeling import to_frappe_doc

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = json.loads(
    (ROOT / "data" / "synthetic" / "bureau" / "cases_120.json").read_text(encoding="utf-8")
)
CASES = {c["case_id"]: c for c in FIXTURE["cases"]}
NOW = datetime(2026, 10, 24, tzinfo=timezone.utc)


def _case(scenario: str, position: int = 0) -> dict:
    return [c for c in FIXTURE["cases"] if c["scenario"] == scenario][position]


class _Store:
    def __init__(self, docs: dict):
        self._docs = docs

    def get(self, application_id: str) -> dict:
        if application_id not in self._docs:
            raise UnknownApplication(application_id)
        return dict(self._docs[application_id])


@pytest.fixture
def http():
    client = TestClient(create_app())
    yield client
    client.close()


@pytest.fixture
def client(http):
    return BureauClient(client=http)


def _run(case: dict, client, *, scenario=None):
    store = _Store({case["application"]["application_id"]: to_frappe_doc(case)})
    sink = InMemoryEvidenceSink()
    out = process_bureau_application(
        case["application"]["application_id"], store, sink, client, scenario=scenario, now=NOW
    )
    return out, sink


def test_placeholder_score_is_replaced_and_credit_decision_is_unchanged(client):
    case = _case("VALID_PASS", 0)
    assert case["application"]["credit_score_origin"] == "SYNTHETIC_PLACEHOLDER"
    out, sink = _run(case, client)
    rec = out.record
    assert out.to_state == "APPROVED"
    assert rec["decision"] == rec["outcome"] == "APPROVED"
    assert rec["bureau"]["score"]["source"] == "SYNTHETIC_BUREAU_REPLACED_PLACEHOLDER"
    assert rec["bureau"]["score"]["placeholder_used"] is True
    assert len(rec["rule_evaluations"]) == 4
    assert sink.status[out.application_ref] == ("APPROVED", "Approved")


def test_bureau_score_feeds_the_unchanged_zen_rules(client):
    case = _case("FAIL_SCORE")
    out, _ = _run(case, client)
    assert out.to_state == "REJECTED"
    failed = {r["rule_id"] for r in out.record["rule_evaluations"] if r["result"] == "FAIL"}
    assert "MIN_CREDIT_SCORE" in failed
    assert out.record["outcome"] == "REJECTED"


def test_no_hit_is_review_with_legacy_error_decision(client):
    case = _case("NO_HIT")
    out, sink = _run(case, client)
    rec = out.record
    assert out.to_state == "MANUAL_REVIEW"
    assert rec["outcome"] == "REVIEW"
    assert rec["decision"] == "ERROR"  # legacy Select value, no Frappe change
    assert rec["review"]["required"] is True
    assert rec["review"]["reason_codes"] == ["DQ_BUREAU_NO_HIT"]
    assert rec["bureau"]["data_quality"]["category"] == "DATA_QUALITY"
    assert rec["error"].startswith("BUREAU_REVIEW")
    assert sink.status[out.application_ref] == ("MANUAL_REVIEW", "Open")


def test_missing_application_field_requests_information(client):
    case = _case("MISSING_REQUIRED_FIELDS")
    out, _ = _run(case, client)
    assert out.to_state == "INFO_REQUESTED"
    assert out.record["review"]["info_requested"] is True
    assert out.record["inputs"]["missing_fields"]


def test_provider_failure_is_error_with_retryable_code(client):
    case = _case("VALID_PASS")
    out, sink = _run(case, client, scenario="TIMEOUT")
    rec = out.record
    assert out.to_state == "MANUAL_REVIEW"
    assert rec["outcome"] == rec["decision"] == "ERROR"
    assert rec["review"] is None
    assert rec["bureau"]["provider_error"]["code"] == "BUREAU_TIMEOUT"
    assert rec["bureau"]["provider_error"]["retryable"] is True
    assert "BUREAU_PROVIDER_ERROR" in out.flags
    assert sink.status[out.application_ref] == ("MANUAL_REVIEW", "Open")


def test_local_bureau_score_conflict_never_reaches_zen(client):
    case = _case("MULTI_ISSUE", 0)
    out, _ = _run(case, client)
    rec = out.record
    assert out.to_state == "MANUAL_REVIEW"
    assert "DQ_CREDIT_SCORE_CONFLICT" in rec["review"]["reason_codes"]
    assert all(r["result"] == "NOT_EVALUABLE" for r in rec["rule_evaluations"])


def test_bureau_record_stays_decision_evidence_v1_and_deterministic(client):
    case = _case("VALID_PASS", 2)
    first, _ = _run(case, client)
    second, _ = _run(case, client)
    assert first.record["schema"] == "decision-evidence/1"
    assert first.record["record_id"] == second.record["record_id"]


def test_plain_lifecycle_record_gains_only_null_bureau_fields():
    sink = InMemoryEvidenceSink()
    out = process_application("APP-TEST-001", MockStore(), sink, now=NOW)
    assert out.record["outcome"] == out.record["decision"]
    assert out.record["review"] is None and out.record["bureau"] is None
    assert out.record["schema"] == "decision-evidence/1"


def test_all_120_fixture_cases_reproduce_their_labels(client):
    for case in FIXTURE["cases"]:
        cid, expected = case["case_id"], case["expected"]
        out, _ = _run(case, client)
        rec = out.record
        assert rec["outcome"] == expected["outcome"], cid
        assert rec["decision"] == expected["decision"], cid
        assert rec["failed_reason_codes"] == [] or expected["failed_rule_ids"], cid
        failed = [r["rule_id"] for r in rec["rule_evaluations"] if r["result"] == "FAIL"]
        assert failed == expected["failed_rule_ids"], cid
        if expected["outcome"] == "REVIEW":
            assert rec["review"]["reason_codes"] == expected["review_reason_codes"], cid
            assert rec["review"]["info_requested"] is expected["info_requested"], cid
            assert out.to_state == (
                "INFO_REQUESTED" if expected["info_requested"] else "MANUAL_REVIEW"
            ), cid
        if expected["outcome"] == "ERROR":
            assert rec["bureau"]["provider_error"]["code"] == expected["error_code"], cid
            assert out.to_state == "MANUAL_REVIEW", cid
        if expected["score_source"] is not None:
            assert rec["bureau"]["score"]["source"] == expected["score_source"], cid
