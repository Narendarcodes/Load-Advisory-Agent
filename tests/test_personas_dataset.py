"""Synthetic personas: labels must equal what the unchanged P0/P1 pipeline says today."""
import json
from pathlib import Path

import pytest

from loan_advisory.application.decision_orchestrator import decide

ROOT = Path(__file__).resolve().parents[1]
P = ROOT / "data" / "synthetic" / "personas" / "personas_v1.jsonl"
ROWS = [json.loads(l) for l in P.open(encoding="utf-8")] if P.exists() else []


class _Store:
    def __init__(self, rows):
        self.d = {r["application_id"]: r for r in rows}

    def get(self, a):
        r = self.d[a]
        return {"name": a, "applicant": r["applicant_id"], "loan_amount": r["loan_amount"],
                "repayment_periods": r["loan_tenure_months"],
                "custom_monthly_income": r["monthly_income"], "custom_monthly_obligations": r["monthly_obligations"],
                "custom_credit_score": r["credit_score"], "custom_employment_months": r["employment_months"]}


@pytest.mark.skipif(not ROWS, reason="personas file absent")
def test_size_and_coverage():
    assert len(ROWS) >= 2000
    assert {r["loan_literacy"] for r in ROWS} == {"low", "medium", "high"}
    assert {r["label"]["decision"] for r in ROWS} == {"APPROVED", "REJECTED", "ERROR"}
    assert all(r["label"]["policy_is_synthetic"] and r["label"]["policy_version"] == "synthetic-v1" for r in ROWS)


@pytest.mark.skipif(not ROWS, reason="personas file absent")
def test_labels_reproduce_through_pipeline():
    store = _Store(ROWS)
    for r in ROWS[::7] + [r for r in ROWS if r["scenario"].startswith("boundary")]:
        ev = decide(r["application_id"], store=store)
        assert ev["decision"] == r["label"]["decision"], r["persona_id"]
        assert [e["rule_id"] for e in ev["rule_evaluations"] if e["result"] == "FAIL"] == r["label"]["failed_rules"]


@pytest.mark.skipif(not ROWS, reason="personas file absent")
def test_counterfactuals_flip_only_their_rule():
    for r in ROWS:
        for cf in r["counterfactuals"]:
            assert cf["rule_passes_after_change"] is True
            assert "not a guarantee" in cf["note"]
