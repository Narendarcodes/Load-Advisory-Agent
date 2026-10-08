"""ZEN smoke: import, load, evaluate, structured output, trace, perf."""
import json
from pathlib import Path

import zen

JDM = Path(__file__).resolve().parents[1] / "decision_engine" / "decisions" / "personal_loan_v1.json"


def test_zen_smoke():
    engine = zen.ZenEngine()
    decision = engine.create_decision(JDM.read_text())
    ctx = {"monthly_income": 60000, "monthly_obligations": 15000,
           "credit_score": 780, "employment_months": 36}
    resp = decision.evaluate(ctx, {"trace": True})
    assert resp["result"]["decision"] == "APPROVED"
    assert all(resp["result"][k] is True for k in
               ("income_pass", "foir_pass", "credit_pass", "employment_pass"))
    assert isinstance(resp["result"]["foir"], float)
    assert set(resp["trace"]) >= {"in1", "uw1", "out1"}  # node in/out + timing
    assert resp["trace"]["uw1"]["input"] == ctx
    assert "performance" in resp and resp["performance"]
