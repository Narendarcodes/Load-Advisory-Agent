"""Phase F: replay the committed 120-case synthetic bureau fixture through the real lifecycle.

Each case is served by the in-process synthetic service (no network, no live bureau) and persisted to an
in-memory sink. The replay pins the intended outcome classes: credit decisions stay ZEN's, data-quality
holds are REVIEW (never a rejection), provider failures are ERROR, and unapproved DQ gates change nothing.
"""
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from loan_advisory.application.lifecycle import process_bureau_application
from loan_advisory.infrastructure.bureau_client import BureauClient
from loan_advisory.infrastructure.evidence_store import InMemoryEvidenceSink
from loan_advisory.infrastructure.frappe_adapter import UnknownApplication
from synthetic_bureau.app import create_app
from synthetic_bureau.labeling import to_frappe_doc

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = json.loads((ROOT / "data" / "synthetic" / "bureau" / "cases_120.json").read_text(encoding="utf-8"))
PROVIDER_SCENARIOS = {"RATE_LIMIT", "UNAVAILABLE", "TIMEOUT", "MALFORMED_RESPONSE"}
HOLD_SCENARIOS = {"NO_HIT", "THIN_HISTORY", "IDENTITY_MISMATCH", "MISSING_REQUIRED_FIELDS", "MULTI_ISSUE"}


class _Store:
    def __init__(self, case: dict):
        self.doc = to_frappe_doc(case)

    def get(self, application_id: str) -> dict:
        if application_id != self.doc["name"]:
            raise UnknownApplication(application_id)
        return dict(self.doc)


@pytest.fixture(scope="module")
def replayed():
    http = TestClient(create_app())
    client = BureauClient(client=http)
    rows = []
    try:
        for case in FIXTURE["cases"]:
            sink = InMemoryEvidenceSink()
            out = process_bureau_application(case["application"]["application_id"], _Store(case), sink,
                                             client, scenario=case["request"]["scenario"])
            rows.append((case, out, sink))
    finally:
        http.close()
    return rows


def test_every_fixture_case_is_replayed_and_persisted(replayed):
    assert len(replayed) == FIXTURE["count"] == 120
    for case, out, sink in replayed:
        rec = out.record
        assert rec["schema"] == "decision-evidence/1"
        assert rec["application_ref"] == case["application"]["application_id"]
        assert rec["outcome"] in ("APPROVED", "REJECTED", "REVIEW", "ERROR")
        assert rec["bureau"]["fetched"] is (case["report"] is not None)
        assert rec["policy"]["synthetic"] is True
        assert sink.records[rec["record_id"]] is rec


def test_provider_failures_record_no_credit_decision(replayed):
    rows = [(c, o) for c, o, _ in replayed if c["scenario"] in PROVIDER_SCENARIOS]
    assert len(rows) == 8
    for case, out in rows:
        rec = out.record
        assert rec["outcome"] == rec["decision"] == "ERROR"
        assert rec["bureau"]["data_quality"]["category"] == "PROVIDER_FAILURE"
        assert rec["bureau"]["provider_error"]["code"].startswith("BUREAU_")
        assert {e["result"] for e in rec["rule_evaluations"]} == {"NOT_EVALUABLE"}
        assert rec["failed_reason_codes"] == []
        assert out.to_state == "MANUAL_REVIEW" and "BUREAU_PROVIDER_ERROR" in out.flags


def test_data_quality_holds_are_reviews_not_rejections(replayed):
    rows = [(c, o) for c, o, _ in replayed if c["scenario"] in HOLD_SCENARIOS]
    assert len(rows) == 30
    for case, out in rows:
        rec = out.record
        assert rec["outcome"] == "REVIEW" and rec["decision"] == "ERROR"
        assert rec["bureau"]["data_quality"]["category"] == "DATA_QUALITY"
        assert rec["review"]["required"] is True and rec["review"]["reason_codes"]
        assert "BUREAU_REVIEW" in out.flags
        assert {e["result"] for e in rec["rule_evaluations"]} == {"NOT_EVALUABLE"}
        assert rec["failed_reason_codes"] == []  # a hold is not a credit rejection


def test_credit_scenarios_stay_zen_decisions(replayed):
    rows = [(c, o) for c, o, _ in replayed if c["scenario"] not in PROVIDER_SCENARIOS | HOLD_SCENARIOS]
    assert len(rows) == 82
    for case, out in rows:
        rec = out.record
        assert rec["outcome"] == rec["decision"] and rec["decision"] in ("APPROVED", "REJECTED")
        assert rec["bureau"]["data_quality"]["category"] == "NONE" and rec["review"] is None
        assert len(rec["rule_evaluations"]) == 4 and rec["bureau"]["score"]["source"]
        if rec["decision"] == "REJECTED":
            assert rec["failed_reason_codes"]


def test_unapproved_dq_gates_do_not_change_any_outcome(replayed):
    # Staleness and obligation variance are proposed-only and disabled; these scenarios must reach ZEN.
    for case, out, _ in replayed:
        if case["scenario"] in ("STALE_REPORT", "INCONSISTENT_INCOME_OBLIGATIONS"):
            assert out.record["bureau"]["data_quality"]["category"] == "NONE"
            assert out.record["outcome"] in ("APPROVED", "REJECTED")
            assert "DQ_BUREAU_REPORT_STALE" not in out.record["bureau"]["data_quality"]["reason_codes"]
            assert "DQ_INCOME_OBLIGATION_INCONSISTENT" not in out.record["bureau"]["data_quality"]["reason_codes"]


def test_no_hit_and_thin_history_never_invent_a_score(replayed):
    for case, out, _ in replayed:
        if case["scenario"] in ("NO_HIT", "THIN_HISTORY"):
            assert out.record["bureau"]["score"]["value"] is None
