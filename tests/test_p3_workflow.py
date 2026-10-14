"""Phase-3 conventional workflow: policy registry, evidence contract, lifecycle (no live env needed)."""
import json
import shutil
from datetime import datetime, timezone

import pytest

from decision_engine.policies.registry import PolicyIntegrityError, UnknownPolicyVersion, load_policy
from loan_advisory.application.lifecycle import (
    IllegalTransition, check_transition, process_application, simulate)
from loan_advisory.infrastructure.evidence_store import InMemoryEvidenceSink
from loan_advisory.infrastructure.frappe_adapter import MockStore, UnknownApplication

NOW = datetime(2026, 10, 14, tzinfo=timezone.utc)


def test_registry_loads_pinned_active_version():
    pv = load_policy("PERSONAL_LOAN")
    assert pv.version == "synthetic-v1" and pv.synthetic is True and pv.status == "active"
    assert len(pv.policy["rules"]) == 4


def test_registry_fails_closed_on_tampered_policy(tmp_path):
    src = load_policy().policy_path.parent
    d = tmp_path / "policies"; (tmp_path / "decisions").mkdir()
    shutil.copytree(src, d)
    shutil.copy(src.parent / "decisions" / "personal_loan_v1.json", tmp_path / "decisions")
    p = d / "personal_loan_synthetic_v1.json"
    pol = json.loads(p.read_text()); pol["rules"][2]["threshold"] = 650  # silent threshold change
    p.write_text(json.dumps(pol, indent=2))
    with pytest.raises(PolicyIntegrityError):
        load_policy(registry_path=d / "registry.json")
    with pytest.raises(UnknownPolicyVersion):
        load_policy(version="synthetic-v9")


@pytest.mark.parametrize("app,state,native", [
    ("APP-TEST-001", "APPROVED", "Approved"), ("APP-TEST-002", "REJECTED", "Rejected"),
    ("APP-TEST-005", "REJECTED", "Rejected"), ("APP-TEST-006", "APPROVED", "Approved"),
    ("APP-TEST-007", "INFO_REQUESTED", "Open"), ("APP-TEST-008", "INFO_REQUESTED", "Open"),
])
def test_lifecycle_routes_fixtures(app, state, native):
    sink = InMemoryEvidenceSink()
    out = process_application(app, MockStore(), sink, now=NOW)
    assert out.to_state == state and sink.status[app] == (state, native)
    rec = out.record
    assert rec["schema"] == "decision-evidence/1" and rec["policy"]["synthetic"] is True
    assert {r["rule_id"] for r in rec["rule_evaluations"]} == {
        "MIN_MONTHLY_INCOME", "FOIR_MAX_45", "MIN_CREDIT_SCORE", "MIN_EMPLOYMENT_TENURE"}
    if state in ("APPROVED", "REJECTED"):
        assert all(r["result"] in ("PASS", "FAIL") for r in rec["rule_evaluations"])
        assert rec["trace_ref"]["sha256"] in sink.traces
    else:
        assert all(r["result"] == "NOT_EVALUABLE" for r in rec["rule_evaluations"])
        assert rec["decision"] == "ERROR"


def test_missing_fields_are_named():
    out = process_application("APP-TEST-007", MockStore(), InMemoryEvidenceSink(), now=NOW)
    assert out.missing_information == ["credit_score", "employment_months"]


def test_evidence_reproducible_same_record_id():
    a = process_application("APP-TEST-005", MockStore(), InMemoryEvidenceSink(), now=NOW).record
    b = process_application("APP-TEST-005", MockStore(), InMemoryEvidenceSink(), now=NOW).record
    assert a == b
    assert a["failed_reason_codes"] == ["ERR_FOIR_EXCEEDED", "ERR_CREDIT_SCORE_BELOW_MINIMUM", "ERR_EMPLOYMENT_TENURE_SHORT"]


def test_simulation_never_persists_or_mutates():
    store = MockStore()
    sim = simulate("APP-TEST-005", store, {"custom_monthly_obligations": 14000}, now=NOW)
    real = process_application("APP-TEST-005", store, InMemoryEvidenceSink(), now=NOW).record
    assert sim["is_simulation"] and sim["record_id"] != real["record_id"]
    assert store.get("APP-TEST-005")["custom_monthly_obligations"] == 18500
    foir = {r["rule_id"]: r for r in sim["rule_evaluations"]}["FOIR_MAX_45"]
    assert foir["result"] == "PASS"


def test_contradictory_data_goes_to_manual_review():
    class S(MockStore):
        def get(self, app):
            d = super().get("APP-TEST-002"); d["name"] = app; d["custom_monthly_obligations"] = 40000
            return d
    out = process_application("APP-X", S(), InMemoryEvidenceSink(), now=NOW)
    assert out.to_state == "MANUAL_REVIEW" and "CONTRADICTION_OBLIGATIONS_EXCEED_INCOME" in out.flags


def test_illegal_transitions_rejected():
    for src, dst in [("APPROVED", "REJECTED"), ("WITHDRAWN", "SUBMITTED"), ("SUBMITTED", "APPROVED"), ("REJECTED", "APPROVED")]:
        with pytest.raises(IllegalTransition):
            check_transition(src, dst)
    with pytest.raises(IllegalTransition):
        process_application("APP-TEST-001", MockStore(), InMemoryEvidenceSink(), current_state="APPROVED")


def test_unknown_application_changes_nothing():
    sink = InMemoryEvidenceSink()
    with pytest.raises(UnknownApplication):
        process_application("APP-NOPE-999", MockStore(), sink)
    assert sink.records == {} and sink.status == {}
