"""Invalid what-if input values must never reach persisted audit rows, traces, answers or logs."""
import json

import pytest

from loan_advisory.agent.contracts import Session
from loan_advisory.agent.tools import InvalidWhatIf
from tests.test_agent_graph import ScriptedLLM, agent_for, ask

SENTINEL = "987654321"  # recognizable and far outside every allowed what-if range


def test_out_of_range_what_if_value_is_not_persisted(tmp_path, caplog):
    llm = ScriptedLLM(intent="what_if", changes={"credit_score": {"set": int(SENTINEL)}})
    ag, _, _ = agent_for(llm, tmp_path=tmp_path)
    r = ask(ag, f"what if my score were {SENTINEL}")

    assert r.action == "clarify"
    raw = ag.audit_path.read_text(encoding="utf-8")
    assert SENTINEL not in raw
    assert SENTINEL not in r.answer
    assert SENTINEL not in caplog.text
    event = [e for e in json.loads(raw.strip().splitlines()[-1])["events"] if e["node"] == "run_what_if"][-1]
    assert "credit_score" in event["error"] and "outside the allowed range" in event["error"]


def test_tool_error_keeps_field_and_category_without_the_value():
    ag, _, _ = agent_for(ScriptedLLM())
    with pytest.raises(InvalidWhatIf) as e:
        ag.tools.run_what_if("APP-TEST-005", Session(applicant_ref="CUS-TEST-005"), {"credit_score": SENTINEL})
    assert "credit_score" in str(e.value) and "outside the allowed range" in str(e.value)
    assert SENTINEL not in str(e.value)


def test_unreadable_delta_value_is_not_persisted(tmp_path):
    llm = ScriptedLLM(intent="what_if", changes={"monthly_income": {"delta": SENTINEL + "x"}})
    ag, _, _ = agent_for(llm, tmp_path=tmp_path)
    r = ask(ag, f"what if my income changed by {SENTINEL}x")

    assert r.action == "clarify"
    raw = ag.audit_path.read_text(encoding="utf-8")
    assert SENTINEL not in raw
    event = [e for e in json.loads(raw.strip().splitlines()[-1])["events"] if e["node"] == "run_what_if"][-1]
    assert "monthly_income" in event["error"]
