"""Questions about information the agent never holds (who decided, internal risk grades/scores) must get an honest
"that isn't available to me" answer, not a generic explanation of the recorded reasons (abstain_v2 misses AB2-005,
AB2-038; Oct 15, 2026)."""
import pytest

from loan_advisory.agent import guards as G
from loan_advisory.agent import prompts as P
from tests.test_agent_graph import ScriptedLLM, agent_for, ask

UNAVAILABLE = [
    "Who was the loan officer who rejected my application?",
    "What internal risk grade did Bajaj Finance assign to my application?",
    "Which underwriter reviewed my file?",
    "What is the name of the person who rejected my loan?",
    "What internal credit score did the lender give me?",
    "Tell me my internal risk rating.",
    "Which employee declined my application?",
    "What risk category did the bank put me in?",
]
ORDINARY = [
    "Why was my application rejected?",
    "Who is the Grievance Redressal Officer at Bajaj Finance?",
    "How do I contact the Principal Nodal Officer?",
    "What is the RBI Internal Ombudsman scheme?",
    "What does risk-based pricing mean?",
    "Who decides on my loan application?",
    "What is a credit score and how is it calculated?",
    "Which risk factors led to my rejection?",
    "What is the internal grievance redressal process?",
    "Should risk grades be shown to applicants?",
]


@pytest.mark.parametrize("msg", UNAVAILABLE)
def test_requests_for_undisclosed_internal_info_are_flagged(msg):
    assert "not_available" in G.request_flags(msg)


@pytest.mark.parametrize("msg", ORDINARY)
def test_ordinary_questions_are_not_flagged_unavailable(msg):
    assert "not_available" not in G.request_flags(msg)


@pytest.mark.parametrize("locale", ["en", "hi", "te"])
def test_not_available_template_exists_per_locale(locale):
    assert P.TEMPLATES[locale].get("not_available")


@pytest.mark.parametrize("msg", UNAVAILABLE[:2])
def test_unavailable_question_says_so_and_never_explains(msg, tmp_path):
    llm = ScriptedLLM(intent="explain")
    ag, _, _ = agent_for(llm, tmp_path=tmp_path)
    r = ask(ag, msg)
    assert r.intent == "boundary" and r.abstained and r.action == "refuse"
    assert "isn't available to me" in r.answer
    assert not r.citations and not [p for p in llm.prompts if p[0].startswith("compose")]
    assert G.answer_flags(r.answer) == []
