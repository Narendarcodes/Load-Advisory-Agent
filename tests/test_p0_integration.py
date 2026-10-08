"""P0 end-to-end: Frappe retrieve -> canonical -> ZEN -> evidence + trace."""
import json
from pathlib import Path

from loan_advisory.application.decision_orchestrator import decide
from loan_advisory.infrastructure.frappe_adapter import MockStore

FIXTURES = json.loads(
    (Path(__file__).resolve().parents[1] / "data" / "synthetic" / "applicants.json").read_text()
)["cases"]


def test_full_matrix():
    store = MockStore()
    for c in FIXTURES:
        ev = decide(c["application_id"], store=store)
        assert ev["decision"] == c["expected_decision"], (c["case_id"], ev)
        if ev["decision"] in ("APPROVED", "REJECTED"):
            assert len(ev["rule_evaluations"]) == 4
            assert ev["_log"]["trace_available"] is True
            assert ev["_log"]["error"] is None
        else:
            assert ev["decision"] == "ERROR" and ev["_log"]["error"]


def test_spec_example_app005_rejected_with_3_fails():
    ev = decide("APP-TEST-005", store=MockStore())
    by_id = {r["rule_id"]: r for r in ev["rule_evaluations"]}
    assert ev["decision"] == "REJECTED"
    assert by_id["FOIR_MAX_45"]["result"] == "FAIL"
    assert abs(by_id["FOIR_MAX_45"]["actual_value"] - 0.5781) < 0.001
    assert by_id["MIN_CREDIT_SCORE"]["result"] == "FAIL"
    assert by_id["MIN_EMPLOYMENT_TENURE"]["result"] == "FAIL"
    assert by_id["MIN_MONTHLY_INCOME"]["result"] == "PASS"


def test_determinism():
    assert decide("APP-TEST-005", store=MockStore())["decision"] == \
        decide("APP-TEST-005", store=MockStore())["decision"] == "REJECTED"


def test_what_if_does_not_mutate():
    store = MockStore()
    sim = decide("APP-TEST-005", store=store,
                 overrides={"custom_monthly_obligations": 14000})
    foir = {r["rule_id"]: r for r in sim["rule_evaluations"]}["FOIR_MAX_45"]
    assert foir["result"] == "PASS" and abs(foir["actual_value"] - 0.4375) < 0.001
    assert store.get("APP-TEST-005")["custom_monthly_obligations"] == 18500


def test_unknown_app_fails_safe():
    ev = decide("APP-NOPE-999", store=MockStore())
    assert ev["decision"] == "ERROR" and "UnknownApplication" in ev["_log"]["error"]
