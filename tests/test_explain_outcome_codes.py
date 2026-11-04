"""E2E D-16 (A5 live, 2026-11-04): explain answers echoed the recorded outcome code ("ELIGIBILITY_CONDITIONS_MET",
"COUNTER_OFFER", "DECLINE") or translated it word for word ("met the eligibility conditions"), and a counter-offer
explanation said "no failed check is recorded" instead of the offer.

The EXPLAIN prompt now forbids outcome codes, tells the model to use the plain outcome words from the facts, and for a
counter-offer to state the offered amount, EMI and loan period and why, in plain words. sanitize_answer() is the
deterministic backstop: it replaces any code that still slips through with plain words in the answer's language.
"""
import pytest

from loan_advisory.agent import guards as G
from loan_advisory.agent import prompts as P

CODES = ["ELIGIBILITY_CONDITIONS_MET", "COUNTER_OFFER", "MANUAL_REVIEW", "MORE_INFORMATION_REQUIRED", "DECLINE"]


def _explain() -> str:
    return P.EXPLAIN.format(style=P.LITERACY_STYLE["medium"], lang="English", voice="", facts="{}")


def test_explain_forbids_outcome_codes_and_word_for_word_translations():
    p = _explain()
    assert "outcome code" in p.lower()
    assert "ELIGIBILITY_CONDITIONS_MET" in p and "COUNTER_OFFER" in p  # named as examples of what never to write
    assert "outcome_plain" in p
    assert "word for word" in p.lower()


def test_explain_counter_offer_states_amount_emi_period_and_why():
    p = _explain()
    low = p.lower()
    assert "counter-offer" in low
    for k in ("amount", "emi", "loan period"):
        assert k in low
    assert '"offer"' in p and "reason_categories" in p
    assert "no failed check" in low  # told not to say "no failed check is recorded" on a non-decline


@pytest.mark.parametrize("code", CODES)
def test_leaked_terms_flags_outcome_codes(code):
    assert code in G.leaked_terms(f"Your decision is {code}.")


@pytest.mark.parametrize("code", CODES)
@pytest.mark.parametrize("locale", ["en", "hi", "te"])
def test_sanitize_answer_replaces_outcome_codes_with_plain_words(code, locale):
    out = G.sanitize_answer(f"{code}\n\nThis demo uses example rules.", locale)
    assert code not in out
    assert out.strip()
    assert out.split("\n")[0].strip() == G.OUTCOME_WORDS[locale][code]


def test_bare_decline_is_replaced_but_ordinary_words_are_kept():
    assert G.sanitize_answer("DECLINE") == G.OUTCOME_WORDS["en"]["DECLINE"]
    keep = "You can decline the offer if it does not suit you."
    assert G.sanitize_answer(keep) == keep


def test_sanitize_answer_default_locale_is_backwards_compatible():
    assert G.sanitize_answer("Clean answer.") == "Clean answer."
    assert G.sanitize_answer("Per the passages, X.") == "X."


def test_fallback_explain_has_a_counter_offer_frame_in_every_language():
    for loc in ("en", "hi", "te"):
        fx = P.FALLBACK_EXPLAIN[loc]
        line = fx["counter"].format(amount="₹3,00,000", emi="₹10,000", tenure=36)
        assert "₹3,00,000" in line and "₹10,000" in line and "36" in line


def test_legacy_v1_words_and_padded_codes():
    assert G.sanitize_answer("Your recorded decision is REJECTED.") == "Your recorded decision is REJECTED."
    assert G.sanitize_answer("  COUNTER  \nok").startswith(G.OUTCOME_WORDS["en"]["COUNTER_OFFER"])
