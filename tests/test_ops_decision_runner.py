"""ops/decision_runner.py drives the unchanged pipeline over SUBMITTED applications."""
import json
from types import SimpleNamespace

from ops import decision_runner


def test_run_pass_processes_each_submitted_and_survives_one_failure(monkeypatch):
    seen, logs = [], []
    monkeypatch.setattr(decision_runner, "submitted", lambda store: ["A1", "A2"])

    def fake(name, store, sink, bureau):
        seen.append(name)
        if name == "A1":
            raise RuntimeError("boom")
        return SimpleNamespace(to_state="APPROVED", record={"outcome": "APPROVED"}, flags=[])

    monkeypatch.setattr(decision_runner, "process_bureau_application", fake)
    assert decision_runner.run_pass(object(), object(), object(), log=logs.append) == 2
    assert seen == ["A1", "A2"]
    assert '"error"' in logs[0] and '"APPROVED"' in logs[1]


def test_unfetched_zero_score_is_read_as_missing_q17():
    class Store:
        def get(self, name):
            return {"name": name, "custom_credit_score": 0, "custom_credit_score_origin": "NOT_FETCHED", "x": 1}

    doc = decision_runner.UnfetchedScoreAsMissing(Store()).get("A1")
    assert doc["custom_credit_score"] is None and doc["x"] == 1


def test_real_or_bureau_scores_are_untouched():
    class Store:
        def get(self, name):
            return {"custom_credit_score": 836, "custom_credit_score_origin": "BUREAU"}

    assert decision_runner.UnfetchedScoreAsMissing(Store()).get("A")["custom_credit_score"] == 836


# E2E defect D-04 (2026-11-04 live run): the runner stored evidence but never a Decision Snapshot, so the
# Loan Application queue columns (outcome, offer amount/EMI/tenure) stayed empty in Frappe desk.
REC = {"decision": "COUNTER_OFFER", "outcome": "COUNTER_OFFER", "reason_categories": ["REQUEST_OUTSIDE_OFFER"],
       "offer": {"amount": 2500000.0, "emi": 55515, "tenure_months": 84, "counter_offer": True},
       "policy": {"version": "synthetic-v2", "policy_sha256": "a" * 64},
       "inputs": {"values": {"requested_amount": 3540000, "assessment_rate": 0.2, "amount_band": "B4", "foir": 0.31,
                             "proposed_emi": 55515, "assessment_date": "2026-10-24"}},
       "rule_evaluations": [{"rule_id": "PL-001", "rule_name": "Age", "result": "PASS"},
                            {"rule_id": "PL-110", "rule_name": "Purpose cap", "result": "FAIL"}]}


def test_snapshot_from_record_maps_outcome_offer_and_categories():
    s = decision_runner.snapshot_from_record(REC, "EV-1")
    assert s["outcome"] == "COUNTER_OFFER" and s["offer_outcome"] == "COUNTER_OFFER"
    assert (s["offer_amount"], s["offer_emi"], s["offer_tenure_months"]) == (2500000.0, 55515, 84)
    assert s["borrower_categories"] == ["REQUEST_OUTSIDE_OFFER"] and s["loan_decision_evidence"] == "EV-1"
    assert s["profile"] == "prototype_synthetic" and s["not_for_live_use"] == 1
    assert s["catalogue_version"] == "synthetic-v2" and s["catalogue_sha256"] == "a" * 64
    assert s["zen_input_json"]["requested_amount"] == 3540000 and s["assessment_date"] == "2026-10-24"
    assert json.loads(s["internal_reasons"]) == ["PL-110 Purpose cap: FAIL"]  # Long Text: JSON string, not a list


def test_snapshot_offer_outcome_for_approve_and_decline():
    ok = dict(REC, decision="ELIGIBILITY_CONDITIONS_MET", offer={"amount": 1, "emi": 1, "tenure_months": 12, "counter_offer": False})
    assert decision_runner.snapshot_from_record(ok, None)["offer_outcome"] == "APPROVED"
    no = dict(REC, decision="DECLINE", offer=None)
    s = decision_runner.snapshot_from_record(no, None)
    assert s["offer_outcome"] == "NO_OFFER" and s["outcome"] == "DECLINE" and "offer_amount" not in s


def test_run_pass_records_a_snapshot_and_survives_a_snapshot_failure(monkeypatch):
    logs, snaps = [], []
    monkeypatch.setattr(decision_runner, "submitted", lambda store: ["A1", "A2"])
    monkeypatch.setattr(decision_runner, "process_bureau_application",
                        lambda name, store, sink, bureau: SimpleNamespace(to_state="APPROVED", record=REC, flags=[]))

    def snap(name, rec):
        snaps.append(name)
        if name == "A1":
            raise RuntimeError("frappe down")
    assert decision_runner.run_pass(object(), object(), object(), log=logs.append, snap=snap) == 2
    assert snaps == ["A1", "A2"]
    assert '"snapshot_error"' in logs[0] and '"snapshot_error"' not in logs[1]
