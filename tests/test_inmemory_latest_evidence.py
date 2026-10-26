"""Regression (QA 2026-10-26, D4): offline evidence must follow the latest run, like Frappe's custom_latest_evidence.

Record ids are deterministic (uuid5 over application, inputs, policy and bureau outcome), so re-running a scenario
that happened before reproduces an existing id. InMemoryEvidenceSink kept the first insertion position and
InMemoryEvidenceSource.latest() returned the last *inserted* record, so after NO_HIT -> clean run -> NO_HIT the
offline UI and agent still showed the clean run's REJECTED decision instead of the current REVIEW hold."""
from fastapi.testclient import TestClient

from loan_advisory.agent.contracts import Session
from loan_advisory.agent.tools import DecisionTools, InMemoryEvidenceSource
from loan_advisory.application.bureau_intake import run_bureau_evaluation
from loan_advisory.infrastructure.bureau_client import BureauClient
from loan_advisory.infrastructure.evidence_store import InMemoryEvidenceSink
from loan_advisory.infrastructure.frappe_adapter import MockStore
from synthetic_bureau.app import create_app


def _latest(sink, store, ref):
    doc = store.get(ref)
    return DecisionTools(store, InMemoryEvidenceSource(sink)).get_decision_evidence(ref, Session(applicant_ref=doc["applicant"]))


def test_rerun_of_an_earlier_scenario_becomes_the_latest_evidence_again():
    store, sink, ref = MockStore(), InMemoryEvidenceSink(), "APP-TEST-002"
    http = TestClient(create_app())
    client = BureauClient(client=http)
    try:
        first = run_bureau_evaluation(ref, store=store, sink=sink, bureau_client=client, scenario="NO_HIT")
        clean = run_bureau_evaluation(ref, store=store, sink=sink, bureau_client=client)
        again = run_bureau_evaluation(ref, store=store, sink=sink, bureau_client=client, scenario="NO_HIT")
    finally:
        http.close()
    assert first.outcome == again.outcome == "REVIEW" and clean.outcome == "REJECTED"
    assert again.record_id == first.record_id  # deterministic ids are by design; the pointer must still move
    latest = _latest(sink, store, ref)
    assert latest["record_id"] == again.record_id
    assert latest["outcome"] == "REVIEW" and latest["lifecycle_state"] == "MANUAL_REVIEW"
    assert len([r for r in sink.records.values() if r["application_ref"] == ref]) == 2  # still idempotent: no duplicate


def test_simulation_records_never_become_the_latest_decision():
    sink = InMemoryEvidenceSink()
    base = {"application_ref": "APP-X", "lifecycle_state": "REJECTED", "trace_ref": {"sha256": None}}
    sink.persist({**base, "record_id": "real", "is_simulation": False}, "Rejected", {})
    sink.persist({**base, "record_id": "sim", "is_simulation": True, "lifecycle_state": "APPROVED"}, "Approved", {})
    assert InMemoryEvidenceSource(sink).latest("APP-X", {})["record_id"] == "real"
