"""Invalid what-if input values must never reach persisted audit rows, traces, answers or logs."""
import json
import traceback

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


def test_unknown_field_key_is_not_echoed_or_persisted(tmp_path):
    key = f"ssn_{SENTINEL}"
    llm = ScriptedLLM(intent="what_if", changes={key: {"set": 1}})
    ag, _, _ = agent_for(llm, tmp_path=tmp_path)
    r = ask(ag, "what if something about my record changed?")

    assert r.action == "clarify"
    raw = ag.audit_path.read_text(encoding="utf-8")
    assert SENTINEL not in raw and SENTINEL not in r.answer
    event = [e for e in json.loads(raw.strip().splitlines()[-1])["events"] if e["node"] == "run_what_if"][-1]
    assert "unsupported what-if field" in event["error"] and "credit_score" in event["error"]


def test_unknown_field_key_is_not_echoed_by_the_tool():
    ag, _, _ = agent_for(ScriptedLLM())
    with pytest.raises(InvalidWhatIf) as e:
        ag.tools.run_what_if("APP-TEST-005", Session(applicant_ref="CUS-TEST-005"), {f"ssn_{SENTINEL}": 1})
    assert "unsupported what-if field" in str(e.value) and SENTINEL not in str(e.value)


def test_unknown_field_key_is_not_echoed_by_the_graph():
    from loan_advisory.agent.graph import _absolute_changes
    with pytest.raises(InvalidWhatIf) as e:
        _absolute_changes({f"ssn_{SENTINEL}": 1}, {})
    assert SENTINEL not in str(e.value)


def test_unreadable_tool_value_does_not_chain_the_raw_input():
    ag, _, _ = agent_for(ScriptedLLM())
    with pytest.raises(InvalidWhatIf) as e:
        ag.tools.run_what_if("APP-TEST-005", Session(applicant_ref="CUS-TEST-005"), {"credit_score": SENTINEL + "x"})
    assert SENTINEL not in "".join(traceback.format_exception(e.value))


def test_unreadable_delta_does_not_chain_the_raw_input():
    from loan_advisory.agent.graph import _absolute_changes
    with pytest.raises(InvalidWhatIf) as e:
        _absolute_changes({"monthly_income": {"delta": SENTINEL + "x"}}, {"monthly_income": 50000})
    assert SENTINEL not in "".join(traceback.format_exception(e.value))
    assert e.value.__suppress_context__
