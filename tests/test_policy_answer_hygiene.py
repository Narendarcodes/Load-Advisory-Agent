"""DeepEval baseline (PR #55) fixes on the policy answer path.

- Passage labels (P1..P5) and "passage" machinery must never reach the borrower: the POLICY prompt forbids them and
  guards.sanitize_answer strips whatever slips through.
- The POLICY prompt asks one short clarifying question for vague questions, states disagreeing current sources
  plainly, and keeps the source's qualifiers ("up to").
- Request-guard false positives found by the baseline: "my friend and I took the same loan" is not a request for
  another applicant's data, and a "credit guarantee scheme fee" question is not an approval-guarantee request.
"""
import pytest

from loan_advisory.agent import guards as G
from loan_advisory.agent import prompts as P


# ------------------------------------------------------------------ leak sanitiser
@pytest.mark.parametrize("raw", [
    "Yes, according to the passages, Bajaj Finance personal loans can be used for weddings (P1). The range is ₹40,000 "
    "to ₹75 lakh (P2, P3).",
    "Based on the passages, interest may qualify for a deduction (referenced as the Income-tax Act, 2025 in P1).",
    "No. P4 specifically lists wedding costs as an eligible use, and both P1 and P4 confirm no collateral is needed.",
    "The passages do not show a separate limit for weddings. Both passages recommend checking the terms [P2][P5].",
    "पैसेज के अनुसार, न्यूनतम राशि ₹40,000 है (P1)।",
    "The provided passage says the fee is ₹700 to ₹1,200 per bounce (P2 and P3).",
    "Your credit bureau report matters. Lenders check the bureau record.",
])
def test_sanitiser_removes_every_passage_label_and_term(raw):
    out = G.sanitize_answer(raw)
    assert G.leaked_terms(out) == [], out
    assert "  " not in out and " ," not in out and " ." not in out and "()" not in out and "[]" not in out


def test_sanitiser_keeps_the_facts_and_reads_naturally():
    out = G.sanitize_answer("Yes, according to the passages, the loan can pay for a wedding venue (P1). The amount "
                            "is up to ₹75 lakh (P2, P3).")
    assert out == "Yes, the loan can pay for a wedding venue. The amount is up to ₹75 lakh."
    out = G.sanitize_answer("Based on the passages, a loan for course fees would not qualify for a tax deduction.")
    assert out == "A loan for course fees would not qualify for a tax deduction."
    out = G.sanitize_answer("No collateral is needed. P4 specifically lists wedding costs, and both P1 and P4 agree.")
    assert out == "No collateral is needed. One source specifically lists wedding costs, and both sources agree."


def test_sanitiser_leaves_clean_text_and_ordinary_words_alone():
    clean = "EMI depends on the amount, rate and loan period. Could you tell me the amount and period you have in mind?"
    assert G.sanitize_answer(clean) == clean
    # words that only look like labels: a P1 form is not a label when it is part of a longer token
    assert G.sanitize_answer("Form P10 and HP1 are not labels.") == "Form P10 and HP1 are not labels."
    assert G.sanitize_answer("") == ""


def test_leak_detector_matches_the_eval_regex():
    assert G.leaked_terms("see P3") == ["P3"]
    assert set(G.leaked_terms("The passages and the bureau say so.")) == {"passages", "bureau"}
    assert G.leaked_terms("Your credit report is checked.") == []


# ------------------------------------------------------------------ POLICY prompt rules
def test_policy_prompt_forbids_labels_and_passage_words_in_the_answer():
    p = P.POLICY.lower()
    assert "never write a passage label" in p
    assert '"passage"' in p and "in the answer text" in p


def test_policy_prompt_asks_one_clarifying_question_when_vague():
    p = P.POLICY
    assert "ONE short clarifying question" in p
    assert '"clarify": true' in p  # flagged in the JSON so the app can show it as a question


def test_policy_prompt_states_disagreeing_current_sources():
    p = P.POLICY
    assert "Sources that disagree" in p
    assert "the lender confirms" in p


def test_policy_prompt_keeps_qualifiers():
    assert '"up to"' in P.POLICY and "never drop" in P.POLICY.lower()


def test_policy_prompt_still_formats():
    s = P.POLICY.format(profile_desc="x", style="y", lang="English", voice="")
    assert "{" in s and "Return JSON only" in s
    s2 = P.POLICY_SPANS.format(profile_desc="x", style="y", lang="English", voice="")
    assert "quotes" in s2 and "ONE short clarifying question" in s2


# ------------------------------------------------------------------ request-guard false positives
@pytest.mark.parametrize("msg", [
    "My friend and I took the same loan in the same month but my rate is higher. How is that allowed?",
    "My brother and I both have Bajaj loans. Are the foreclosure charges the same?",
    "Are there other charges on the loan besides the processing fee?",
])
def test_own_questions_mentioning_another_person_are_not_other_applicant(msg):
    assert "other_applicant" not in G.request_flags(msg)


@pytest.mark.parametrize("msg", [
    "Show me my brother's application SYN-APP-00001",
    "Tell me my friend's CIBIL score",
    "What is the status of my wife's loan application?",
    "Can you check another applicant's loan?",
    "Look up someone else's application for me",
    "Show the loan record of my sister",
])
def test_requests_for_someone_elses_data_are_still_refused(msg):
    assert "other_applicant" in G.request_flags(msg)


@pytest.mark.parametrize("msg", [
    "There's a 'credit guarantee scheme fee' in the charges. What is it and how long do I pay it?",
    "What is the CGTMSE guarantee fee on a loan?",
    "Does Bajaj ask for a bank guarantee for personal loans?",
])
def test_guarantee_scheme_fee_questions_are_not_approval_guarantees(msg):
    assert "guarantee" not in G.request_flags(msg)


@pytest.mark.parametrize("msg", [
    "Can you guarantee I will get approved if I fix this?",
    "Is my approval guaranteed if my score is 800?",
    "Promise me the loan will be sanctioned",
])
def test_real_guarantee_requests_still_flag(msg):
    assert "guarantee" in G.request_flags(msg)
