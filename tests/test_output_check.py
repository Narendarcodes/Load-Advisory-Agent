"""Final deterministic output check and the agent-eval templates/prompts (agent eval fixes 2, 3, 5, 8)."""
import pytest

from loan_advisory.agent import guards as G
from loan_advisory.agent import prompts as P


@pytest.mark.parametrize("text,kind", [
    ("Your decision is COUNTER_OFFER.", "outcome_code"),
    ("The MIN_CREDIT_SCORE check failed.", "internal_term"),
    ("Rule PL-047 applied.", "internal_term"),
    ("This uses synthetic-v1 rules.", "internal_term"),
    ("See P2 for details.", "passage_label"),
    ("According to the passages, the fee is ₹500.", "passage_label"),
    ("A past loan was settled.", "hidden_flag"),
    ("Your name is on a blacklist.", "hidden_flag"),
    ("कोई ब्लैकलिस्ट नहीं है।", "hidden_flag"),
    ("You need a credit score of 750.", "score_value"),
    ("A 700+ score helps.", "score_value"),
])
def test_output_check_flags_internal_detail(text, kind):
    assert any(v.startswith(kind) for v in G.output_violations(text)), G.output_violations(text)


def test_output_check_allows_plain_answers_and_own_values():
    assert G.output_violations("We can't approve this application right now. Your existing EMIs are high for this "
                               "loan amount. We can offer ₹3,96,000 at ₹10,492 a month for 60 months.") == []
    assert G.output_violations("Your credit score on file is 690.", own_numbers={"690"}) == []
    assert G.output_violations("The cut-off is 25001.", limit_numbers={"25001"}) == ["limit_value:25001"]
    # policy turns may name settlement as a general topic; codes and labels are still blocked
    assert G.output_violations("A settlement is shown on your credit report as such.", decision_turn=False) == []


@pytest.mark.parametrize("key", ["human_review", "human_review_distress", "bureau_request", "what_if_cap", "what_if_error",
                                 "clarify_charges", "clarify_documents", "clarify_rates", "clarify_generic",
                                 "distress_kind", "distress_review_offer", "what_if_line", "what_if_area"])
@pytest.mark.parametrize("loc", ["en", "hi", "te"])
def test_new_templates_exist_in_three_languages_and_are_clean(key, loc):
    assert key in P.TEMPLATES[loc]
    txt = P.template(key, loc, ref="HO-1", result="x", area="y")
    assert G.output_violations(txt) == [] and G.answer_flags(txt) == []
    if key.startswith("clarify_"):
        assert txt.rstrip().endswith("?") and not G.numbers_in(txt)


def test_classify_prompt_has_new_intents_and_no_score_what_if():
    for label in ("status", "human_review", "distress", "misrepresentation", "vague"):
        assert f"- {label}:" in P.CLASSIFY
    assert "credit_score, employment_months" not in P.CLASSIFY and "can't be\nchanged in an estimate" in P.CLASSIFY
    assert "credit score or months in your job" not in P.TEMPLATES["en"]["bad_what_if"]


def test_explain_prompt_asks_for_one_reason_only():
    assert "ONLY the one reason" in P.EXPLAIN and "Never add a second reason" in P.EXPLAIN
    assert "{lang}" in P.CLARIFY and "calm, kind sentence" in P.DISTRESS_ADDON
