"""The tool-calling agent core (SARAL_AGENT_CORE=tools).

The model decides which live read it needs; the graph only applies the deterministic safety guards
and the final output check. These tests script the model's tool decisions and assert the loop.
"""
import json

import pytest

from loan_advisory.agent.contracts import AgentRequest, Session
from loan_advisory.agent.llm import ToolCalls
from loan_advisory.agent.runtime import build_offline_agent


class ToolLLM:
    """Scripts the model: each step is {"tool": name, "args": {...}} or {"text": "..."}."""

    def __init__(self, script, fail=False):
        self.script = list(script)
        self.fail = fail
        self.prompts = []

    def chat_tools(self, system, user, tools, max_tokens=900, tag="", deadline=None, on_delta=None, messages=None):
        self.prompts.append((system, user, [t["function"]["name"] for t in tools]))
        if self.fail:
            from loan_advisory.agent.llm import LLMError
            raise LLMError("down")
        tc = ToolCalls()
        step = self.script.pop(0)
        if "tool" in step:
            tc.calls.append({"id": step["tool"], "name": step["tool"],
                             "arguments": json.dumps(step.get("args") or {})})
        else:
            tc.content.append(step["text"])
        return tc


def ask(ag, msg, app="APP-TEST-005", who="CUS-TEST-005"):
    return ag.run(AgentRequest(request_id="r1", conversation_id="c1", message=msg, application_ref=app),
                  Session(applicant_ref=who))


@pytest.fixture
def agent_core(monkeypatch):
    monkeypatch.setenv("SARAL_AGENT_CORE", "tools")


def test_name_question_reads_the_profile(agent_core, tmp_path):
    llm = ToolLLM([{"tool": "get_applicant_profile"}, {"text": "Your name is Synthetic Test Applicant."}])
    ag, _, _ = build_offline_agent(llm=llm)
    r = ask(ag, "what is my name?")
    assert r.answer == "Your name is Synthetic Test Applicant."
    assert llm.prompts[0][2] == ["get_applicant_profile", "get_decision_evidence", "search_policy",
                                 "run_what_if", "create_human_handoff"]


def test_decision_question_reads_the_evidence(agent_core, tmp_path):
    llm = ToolLLM([{"tool": "get_decision_evidence"},
                   {"text": "We can't approve this application right now. Synthetic example rules."}])
    ag, _, _ = build_offline_agent(llm=llm)
    r = ask(ag, "why was I rejected?")
    assert r.answer.startswith("We can't approve this application right now.")
    assert r.decision_card is not None  # the record the tool read is carried into the response


def test_two_reads_in_one_turn(agent_core, tmp_path):
    llm = ToolLLM([{"tool": "get_applicant_profile"}, {"tool": "get_decision_evidence"},
                   {"text": "You asked for a loan. The recorded decision is a decline."}])
    ag, _, _ = build_offline_agent(llm=llm)
    r = ask(ag, "what is my loan and why was it rejected?")
    assert "recorded decision" in r.answer


def test_boundary_is_checked_before_the_agent(agent_core, tmp_path):
    llm = ToolLLM([{"text": "You will definitely be approved."}])
    ag, _, _ = build_offline_agent(llm=llm)
    r = ask(ag, "Can you guarantee I will get approved if I fix this?")
    assert r.action == "refuse" and llm.prompts == []  # the model is never asked


def test_tool_failure_is_data_not_a_crash(agent_core, tmp_path):
    llm = ToolLLM([{"tool": "search_policy"}, {"text": "I could not check the policy just now."}])
    ag, _, _ = build_offline_agent(llm=llm, policy_tools=None)
    r = ask(ag, "what is the prepayment fee?")
    assert r.answer == "I could not check the policy just now."


def test_llm_outage_falls_back_to_a_template(agent_core, tmp_path):
    llm = ToolLLM([], fail=True)
    ag, _, _ = build_offline_agent(llm=llm)
    r = ask(ag, "why was I rejected?")
    assert "fallback_template" in r.guard_flags and r.answer
