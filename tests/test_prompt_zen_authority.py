"""The recorded decision is the single authority; lender-page numbers are indicative only (2026-11-03).

Retrieved lender pages carry published eligibility numbers (minimum credit score, income, age, amount range, loan
period, rates, fees). They are general guidance: never Saral's rule, never compared with the applicant's own numbers,
never used to say the applicant qualifies or not. Where one seems to conflict with the recorded decision, the recorded
decision wins, the conflict and cut-offs are not mentioned, and a human review is offered.
"""
import re

import pytest

from loan_advisory.agent import prompts as P

DECISION_PROMPTS = {"core_rules": P.CORE_RULES, "explain": P.EXPLAIN, "improve": P.IMPROVE, "what_if": P.WHAT_IF}
POLICY_PROMPTS = {"policy": P.POLICY, "policy_spans": P.POLICY_SPANS}
ALL = {**DECISION_PROMPTS, **POLICY_PROMPTS}


def _render(t: str) -> str:
    return t.format(style=P.LITERACY_STYLE["medium"], lang="English", voice="", facts="{}", profile_desc="x")


def _flat(t: str) -> str:
    return re.sub(r"\s+", " ", t)


@pytest.mark.parametrize("name", sorted(ALL))
def test_decision_authority_block_is_in_every_borrower_prompt(name):
    p = _flat(ALL[name])
    assert "Decision authority" in p
    assert "ONLY from their recorded assessment" in p or "is the ONLY source for whether they qualify" in p
    assert "what amount, EMI and loan period they get" in p


@pytest.mark.parametrize("name", sorted(ALL))
def test_published_numbers_are_general_guidance_only(name):
    p = _flat(ALL[name])
    assert "general published guidance only" in p
    for k in ("minimum credit score", "income", "age", "loan amount range", "loan period", "interest rates", "fees"):
        assert k in p, k
    assert "never Saral's rule" in p
    assert "Bajaj Finance's public pages mention ..., as general guidance." in p


@pytest.mark.parametrize("name", sorted(ALL))
def test_no_qualify_judgement_or_comparison_from_published_numbers(name):
    p = _flat(ALL[name])
    assert "to tell the applicant they qualify or don't" in p
    assert "Never compare the applicant's own numbers" in p
    assert "Never invent a number" in p
    assert 'Never say "you qualify" or suggest it' in p


@pytest.mark.parametrize("name", sorted(ALL))
def test_conflict_rule_recorded_decision_wins_silently(name):
    p = _flat(ALL[name])
    assert "conflict with the applicant's recorded decision, the recorded decision wins" in p
    assert "Do not mention the conflict, any cut-off or any internal check" in p
    assert "the decision comes from a full check of their application" in p
    assert "offer a human review" in p


def test_policy_prompt_answers_what_do_i_need_with_caveat_and_no_internal_thresholds():
    for t in POLICY_PROMPTS.values():
        p = _flat(t)
        assert "If asked what credit score or income is needed: give the published general guidance" in p
        assert "eligibility depends on a full check of the application" in p
        assert "Never give internal thresholds or cut-offs" in p
        assert "do not repeat the applicant's numbers" in p


def test_decision_prompts_answer_what_do_i_need_from_the_recorded_decision_only():
    for t in DECISION_PROMPTS.values():
        p = _flat(t)
        assert "explain it through their recorded decision only" in p
        assert "Never give a published number or an internal cut-off as their target" in p


def _block(rendered: str) -> str:
    b = rendered.split("Decision authority", 1)[1]
    for stop in ("How to write", "- Market-wide"):
        b = b.split(stop, 1)[0]
    return b


@pytest.mark.parametrize("name", sorted(ALL))
def test_block_renders_and_adds_no_numbers_or_internal_names(name):
    block = _block(_render(ALL[name]))
    assert 300 < len(block) < 2500
    assert not re.search(r"\d", block), block
    for internal in ("ZEN", "RAG", "Qdrant", "rule ID", "threshold register"):
        assert internal not in block, internal


def test_existing_rules_kept():
    assert "Use ONLY the facts given below" in P.CORE_RULES and "SYNTHETIC prototype policy" in P.CORE_RULES
    assert P.CORE_RULES.rstrip().endswith(P.PLAIN_LANGUAGE.rstrip())
    assert '"citations"' in P.POLICY and '"quotes"' in P.POLICY_SPANS
    assert "Answer only if the passages state the answer" in P.POLICY
    assert P.SYNTHETIC_NOTE["en"].startswith("(These limits come from a synthetic prototype policy")
    for t in (P.EXPLAIN, P.IMPROVE, P.WHAT_IF):
        assert P.DISCLOSURE in t
