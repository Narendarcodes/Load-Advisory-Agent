"""'What is my credit score?' is about the applicant's own record, not a policy question (GUI test B-07b).

With a small local model the LLM classifier labelled it `policy`, so the applicant got a policy abstention
("couldn't find this in the approved policy sources") instead of their recorded value. The fast path now
routes own-value questions to `explain`, and the classifier prompt says so for the LLM path. Lender-terms
questions that mention a score stay with the LLM / policy path.
"""
import pytest

from loan_advisory.agent import prompts as P
from loan_advisory.agent.graph import _fast_intent


@pytest.mark.parametrize("msg", ["What is my credit score?", "what's my CIBIL score", "Tell me my monthly income",
                                 "show me my EMIs"])
def test_own_value_questions_fast_route_to_explain(msg):
    assert _fast_intent(msg) == ("explain", None)


@pytest.mark.parametrize("msg", ["What interest rate does a bank give for my credit score?",
                                 "What credit score does Bajaj need?", "What if my credit score was 720?"])
def test_lender_and_what_if_questions_are_not_captured(msg):
    r = _fast_intent(msg)
    assert r is None or r[0] != "explain"


def test_classifier_prompt_names_own_values_under_explain():
    line = next(l for l in P.CLASSIFY.splitlines() if l.startswith("- explain"))
    nxt = P.CLASSIFY.split(line, 1)[1].splitlines()[1]
    assert "credit score" in line + nxt


def test_regex_fallback_routes_own_value_to_explain_when_classifier_times_out():
    """On CPU the 6 s classify budget expires and the regex fallback runs; before the fix any question
    defaulted to policy (`rules_question_default`)."""
    from loan_advisory.agent.graph import _RULES
    assert next(name for name, rx in _RULES if rx.search("What is my credit score?")) == "explain"
    assert next(name for name, rx in _RULES if rx.search("What fee does the bank charge on my income?")) == "policy"
