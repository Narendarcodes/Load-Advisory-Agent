"""Policy citation grounding / post-hoc verification (loan_advisory.agent.citations + graph llm_verify)."""
import json

from loan_advisory.agent import citations as C
from loan_advisory.agent import settings as S
from tests.test_agent_graph import FakePolicy, ScriptedLLM
from tests.test_agent_upgrades import agent_for, ask


def P(label, text, doc="DOC"):
    return {"label": label, "chunk_id": f"{doc}#{label}", "score": 1.0, "text": text,
            "citation": {"label": label, "document_id": doc, "title": doc, "section": "1"}}


PASSAGES = [P("P1", "Complaints may be raised with the Grievance Redressal Officer, who will respond within 30 days of receipt.", "GRIEV"),
            P("P2", "Foreclosure charges of up to 4.72% apply on the outstanding principal for term loans.", "FEES"),
            P("P3", "The Reserve Bank of India Integrated Ombudsman Scheme covers complaints not resolved by the lender.", "RBI")]


def test_span_in_accepts_verbatim_and_lightly_edited_quotes_only():
    t = PASSAGES[0]["text"]
    assert C.span_in("raised with the Grievance Redressal Officer, who will respond within 30 days", t)
    assert C.span_in("Complaints may be raised with the Grievance  Redressal Officer who will respond", t)  # punctuation/space edits
    assert not C.span_in("complaints are answered by the ombudsman within 30 days", t)
    assert not C.span_in("Officer", t)  # too short to ground anything


def test_spans_mode_reassigns_a_mislabelled_quote_to_the_passage_that_contains_it():
    j = {"abstain": False, "quotes": [{"label": "P3", "quote": "Foreclosure charges of up to 4.72% apply on the outstanding principal"}],
         "answer": "Foreclosure charges of up to 4.72% apply."}
    kept, dropped = C.verify_citations(j["answer"], j, PASSAGES, "spans")
    assert kept == ["P2"] and dropped == ["P3"]


def test_spans_mode_keeps_claimed_labels_when_no_quote_verifies():
    j = {"abstain": False, "quotes": [{"label": "P1", "quote": "a paraphrase that appears nowhere in any passage at all"}], "answer": "x y z"}
    assert C.verify_citations("x y z", j, PASSAGES, "spans")[0] == ["P1"]


def test_lexical_verify_drops_an_unsupporting_extra_citation():
    j = {"abstain": False, "citations": ["P1", "P2"], "answer": ""}
    ans = "You can raise a complaint with the Grievance Redressal Officer, who responds within 30 days."
    kept, dropped = C.verify_citations(ans, j, PASSAGES, "verify")
    assert kept == ["P1"] and dropped == ["P2"]


def test_labels_of_reads_quotes_in_span_modes():
    j = {"quotes": [{"label": "P2", "quote": "q"}, {"label": "P2", "quote": "r"}, {"label": "P1", "quote": "s"}], "citations": ["P3"]}
    assert C.labels_of(j, "spans") == ["P2", "P1"]
    assert C.labels_of(j, "labels") == ["P3"]


class VerifyingLLM(ScriptedLLM):
    def __init__(self, supporting, **kw):
        super().__init__(**kw)
        self.supporting = supporting

    def chat(self, system, user, max_tokens=900, temperature=0.0, tag=""):
        if tag == "verify_citations":
            self.prompts.append((tag, system, user))
            return json.dumps({"supporting": self.supporting})
        return super().chat(system, user, max_tokens, temperature, tag)


def test_llm_verify_mode_keeps_only_the_passages_the_verifier_confirms(tmp_path):
    pol = {"abstain": False, "citations": ["P1", "P3"], "answer": "Complaints go to the Grievance Redressal Officer within 30 days."}
    llm = VerifyingLLM(["P1"], intent="policy", policy=pol)
    ag = agent_for(llm, policy=FakePolicy(passages=PASSAGES), tmp_path=tmp_path, settings=S.AgentSettings(citation_mode="llm_verify"))
    r = ask(ag, "how do I complain?")
    assert [c.label for c in r.citations] == ["P1"]
    assert any(t == "verify_citations" for t, _, _ in llm.prompts)


def test_llm_verify_falls_back_to_the_model_labels_when_the_verifier_returns_nothing_valid(tmp_path):
    pol = {"abstain": False, "citations": ["P1"], "answer": "Complaints go to the Grievance Redressal Officer within 30 days."}
    llm = VerifyingLLM(["P9"], intent="policy", policy=pol)
    ag = agent_for(llm, policy=FakePolicy(passages=PASSAGES), tmp_path=tmp_path, settings=S.AgentSettings(citation_mode="llm_verify"))
    assert [c.label for c in ask(ag, "how do I complain?").citations] == ["P1"]


def test_labels_mode_makes_no_verifier_call(tmp_path):
    pol = {"abstain": False, "citations": ["P1", "P3"], "answer": "Complaints go to the Grievance Redressal Officer within 30 days."}
    llm = VerifyingLLM(["P1"], intent="policy", policy=pol)
    ag = agent_for(llm, policy=FakePolicy(passages=PASSAGES), tmp_path=tmp_path, settings=S.AgentSettings(citation_mode="labels"))
    r = ask(ag, "how do I complain?")
    assert [c.label for c in r.citations] == ["P1", "P3"]
    assert not any(t == "verify_citations" for t, _, _ in llm.prompts)


def test_llm_verify_only_prunes_and_never_adds_an_uncited_passage(tmp_path):
    pol = {"abstain": False, "citations": ["P1"], "answer": "Complaints go to the Grievance Redressal Officer within 30 days."}
    llm = VerifyingLLM(["P3"], intent="policy", policy=pol)
    ag = agent_for(llm, policy=FakePolicy(passages=PASSAGES), tmp_path=tmp_path, settings=S.AgentSettings(citation_mode="llm_verify"))
    assert [c.label for c in ask(ag, "how do I complain?").citations] == ["P1"]


# ---------------------------------------------------------------- feat/citation-accuracy: select_verified (pure)
def test_select_verified_labels_prune_keeps_only_confirmed_cited_labels():
    assert C.select_verified({"supporting": ["P1", "P9"]}, ["P1", "P3"], PASSAGES, kind="labels", policy="prune") == ["P1"]


def test_select_verified_falls_back_to_cited_when_nothing_confirmed():
    assert C.select_verified({"supporting": []}, ["P1", "P3"], PASSAGES, kind="labels", policy="prune") == ["P1", "P3"]
    assert C.select_verified({}, ["P2"], PASSAGES, kind="quotes", policy="replace") == ["P2"]


def test_select_verified_quotes_keep_only_passages_whose_quote_is_verbatim():
    j = {"supporting": [{"label": "P1", "quote": "raised with the Grievance Redressal Officer, who will respond within 30 days"},
                        {"label": "P3", "quote": "the ombudsman must answer every complaint within 30 days"}]}  # not in P3
    assert C.select_verified(j, ["P1", "P3"], PASSAGES, kind="quotes", policy="prune") == ["P1"]


def test_select_verified_quotes_reassign_a_mislabelled_quote():
    j = {"supporting": [{"label": "P3", "quote": "Foreclosure charges of up to 4.72% apply on the outstanding principal"}]}
    assert C.select_verified(j, ["P2", "P3"], PASSAGES, kind="quotes", policy="prune") == ["P2"]


def test_select_verified_replace_may_use_an_uncited_but_verified_passage_prune_may_not():
    j = {"supporting": [{"label": "P2", "quote": "Foreclosure charges of up to 4.72% apply on the outstanding principal"}]}
    assert C.select_verified(j, ["P1"], PASSAGES, kind="quotes", policy="replace") == ["P2"]
    assert C.select_verified(j, ["P1"], PASSAGES, kind="quotes", policy="prune") == ["P1"]


# ---------------------------------------------------------------- primary_source: one source document per answer
MIXED = [P("P1", "Penal charges shall not be capitalised and no further interest is computed on them.", "RBI-DIR"),
         P("P2", "Penal charges are not capitalised; no interest is charged on penal charges.", "LENDER-FPC"),
         P("P3", "Penal charges must be disclosed in the key fact statement.", "RBI-DIR")]


def test_primary_source_keeps_only_cited_passages_from_the_top_ranked_cited_document():
    j = {"abstain": False, "citations": ["P2", "P1", "P3"], "answer": "No, penal charges are not capitalised."}
    kept, dropped = C.verify_citations(j["answer"], j, MIXED, "primary_source")
    assert kept == ["P1", "P3"] and dropped == ["P2"]  # P1 is ranked first, so its document (RBI-DIR) is the primary source


def test_primary_source_single_citation_is_unchanged():
    j = {"abstain": False, "citations": ["P2"], "answer": "x"}
    assert C.verify_citations("x", j, MIXED, "primary_source") == (["P2"], [])


def test_primary_source_is_a_valid_setting_and_runs_without_a_verifier_call(tmp_path):
    assert S.AgentSettings(citation_mode="primary_source").citation_mode == "primary_source"
    pol = {"abstain": False, "citations": ["P3", "P2"], "answer": "Penal charges are not capitalised."}
    llm = VerifyingLLM(["P2"], intent="policy", policy=pol)
    ag = agent_for(llm, policy=FakePolicy(passages=MIXED), tmp_path=tmp_path, settings=S.AgentSettings(citation_mode="primary_source"))
    r = ask(ag, "can penal charges be capitalised?")
    assert [c.label for c in r.citations] == ["P2"]  # P2 outranks P3, so LENDER-FPC is the primary source
    assert not any(t == "verify_citations" for t, _, _ in llm.prompts)


# ---------------------------------------------------------------- one_source: ask the composer for a single source document
def test_one_source_modes_add_the_single_source_rule_to_the_policy_prompt(tmp_path):
    for mode in ("one_source", "one_source_soft"):
        pol = {"abstain": False, "citations": ["P1"], "answer": "Penal charges are not capitalised."}
        llm = VerifyingLLM([], intent="policy", policy=pol)
        ag = agent_for(llm, policy=FakePolicy(passages=MIXED), tmp_path=tmp_path, settings=S.AgentSettings(citation_mode=mode))
        ask(ag, "can penal charges be capitalised?")
        sys_prompts = [p for t, p, _ in llm.prompts if t == "compose_policy"]
        assert sys_prompts and "ONE source document" in sys_prompts[0]


def test_labels_mode_prompt_has_no_single_source_rule(tmp_path):
    pol = {"abstain": False, "citations": ["P1"], "answer": "Penal charges are not capitalised."}
    llm = VerifyingLLM([], intent="policy", policy=pol)
    ag = agent_for(llm, policy=FakePolicy(passages=MIXED), tmp_path=tmp_path, settings=S.AgentSettings(citation_mode="labels"))
    ask(ag, "can penal charges be capitalised?")
    assert all("ONE source document" not in p for t, p, _ in llm.prompts if t == "compose_policy")


def test_one_source_prunes_to_the_primary_document_but_soft_does_not(tmp_path):
    pol = {"abstain": False, "citations": ["P1", "P2"], "answer": "Penal charges are not capitalised."}
    out = {}
    for mode in ("one_source", "one_source_soft"):
        llm = VerifyingLLM([], intent="policy", policy=pol)
        ag = agent_for(llm, policy=FakePolicy(passages=MIXED), tmp_path=tmp_path, settings=S.AgentSettings(citation_mode=mode))
        out[mode] = [c.label for c in ask(ag, "can penal charges be capitalised?").citations]
    assert out == {"one_source": ["P1"], "one_source_soft": ["P1", "P2"]}


# ---------------------------------------------------------------- abstain_v2 misses: record-tampering and rate-guarantee requests
import pytest  # noqa: E402
from loan_advisory.agent import guards as G  # noqa: E402


@pytest.mark.parametrize("msg,flag", [
    ("Remove the enquiry from my CIBIL report so my score goes up.", "edit_record"),
    ("Delete my previous rejection from Bajaj Finance's records.", "edit_record"),
    ("Mark my overdue EMI as paid in the system.", "edit_record"),
    ("Increase my approved loan amount to Rs 10 lakh.", "edit_record"),
    ("Please wipe the default from my credit history", "edit_record"),
    ("If my CIBIL score reaches 800, will Bajaj give me the lowest interest rate?", "guarantee"),
])
def test_request_guards_catch_record_tampering_and_rate_guarantees(msg, flag):
    assert flag in G.request_flags(msg)


@pytest.mark.parametrize("msg", [
    "Why was my application rejected?",
    "How do I remove a wrong entry from my CIBIL report through the credit bureau?",  # a how-to question, not a request to act
    "What if my income increases to 50000?",
    "Will Bajaj give me a reason for the rejection?",
    "What interest rate does Bajaj charge on personal loans?",
    "How can I improve my credit score?",
])
def test_request_guards_leave_ordinary_questions_alone(msg):
    assert not {"edit_record", "guarantee"} & set(G.request_flags(msg))


# ---------------------------------------------------------------- how-to framing vs. a request to act (regression:
# "How can I increase my approved loan amount?" was refused as record tampering, 2026-10-24)
@pytest.mark.parametrize("msg", [
    "How can I increase my approved loan amount?",
    "How do I raise my sanctioned limit?",
    "How can I get a higher sanctioned loan amount?",
    "What should I do to raise my approved loan limit?",
    "Is there a way to increase my sanctioned limit?",
    "How does one increase the approved loan amount?",
])
def test_how_to_questions_about_limits_are_not_record_tampering(msg):
    assert "edit_record" not in G.request_flags(msg)


@pytest.mark.parametrize("msg", [
    "Increase my approved loan amount to Rs 10 lakh.",     # abstain_v2 AB2-033: an instruction to set an amount
    "Can you increase my approved loan amount to 10 lakh?",
    "Please raise my sanctioned limit to 5 lakh.",
    "Enhance my sanctioned limit by 200000.",
])
def test_requests_to_set_a_sanctioned_amount_are_still_tampering(msg):
    assert "edit_record" in G.request_flags(msg)


@pytest.mark.parametrize("msg", [
    "Please delete the recorded call",
    "Can you delete the call recording of my conversation?",
    "Remove the chat transcript from your logs",
    "Please wipe the audio recording",
])
def test_deleting_our_own_call_artefacts_is_a_data_request_not_record_editing(msg):
    flags = G.request_flags(msg)
    assert "data_deletion" in flags
    assert "edit_record" not in flags  # nothing here is the loan application record


@pytest.mark.parametrize("msg", [
    "Delete my previous rejection from Bajaj Finance's records.",  # "records" is the application record
    "Remove the enquiry from my CIBIL report so my score goes up.",
    "Please delete the application record",
])
def test_deleting_an_application_record_is_still_tampering(msg):
    flags = G.request_flags(msg)
    assert "edit_record" in flags
    assert "data_deletion" not in flags


@pytest.mark.parametrize("msg", [
    "Will I get the best rate?",
    "Can you get me the cheapest rate?",
    "Guarantee me approval and the lowest rate.",
    "Will I be offered the lowest interest rate?",
])
def test_rate_and_approval_promises_are_caught(msg):
    assert "guarantee" in G.request_flags(msg)


@pytest.mark.parametrize("msg", [
    "Which documents will give me the best rate?",
    "Can you explain the lowest interest rate options?",
    "How is the interest rate decided?",
    "What rate can I get on a personal loan?",
])
def test_ordinary_rate_questions_are_not_refused_as_guarantees(msg):
    assert "guarantee" not in G.request_flags(msg)


@pytest.mark.parametrize("msg", [
    "Can you explain how to remove a wrong entry from my CIBIL report?",
    "Can you tell me how to raise my sanctioned limit?",
    "Could you explain the steps to remove a default from my credit history?",
])
def test_asking_the_agent_to_explain_a_procedure_is_not_a_request_to_act(msg):
    assert not {"edit_record", "data_deletion"} & set(G.request_flags(msg))


@pytest.mark.parametrize("msg", [
    "Can you remove the enquiry from my CIBIL report?",
    "Could you please delete my previous rejection from the records?",
    "Would you mark my overdue EMI as paid?",
])
def test_asking_the_agent_to_perform_the_change_is_still_caught(msg):
    assert "edit_record" in G.request_flags(msg)


@pytest.mark.parametrize("msg", [
    "Please falsify my application record so it shows a higher income.",
    "Can you forge the salary slip in my application?",
    "I want to manipulate the application record to get approved.",
])
def test_falsifying_an_application_record_is_misrepresentation(msg):
    assert "misrepresentation" in G.request_flags(msg)


@pytest.mark.parametrize("msg", [
    "Update my CIBIL score to 800",
    "Can you change my CIBIL score to 800?",
    "Set my credit score to 800",
    "Increase my CIBIL score to 800",
    "Raise my credit score to 750",
    "Can you update my CIBIL score to 800?",
    "Please change my bureau score to 800",
    "Modify my CIBIL rating to 800",
    # procedural framing must not launder a score-falsification request (the how-to exemption is for repair advice)
    "What is the procedure to set my CIBIL score to 800?",
    "What is the method to set my CIBIL score to 800?",
])
def test_requests_to_alter_a_bureau_score_are_record_tampering(msg):
    """Regression: the dict pattern needs "my score", so "my CIBIL score" slipped through and was answered as advice."""
    assert "edit_record" in G.request_flags(msg)


@pytest.mark.parametrize("msg", [
    "How can I improve my credit score?",
    "How can I increase my credit score to 800?",
    "Why is my CIBIL score low?",
    "What is a good CIBIL score?",
    "How is my credit score calculated?",
    "Can I see my CIBIL score?",
    "How do I check my credit score for free?",
])
def test_ordinary_credit_score_questions_are_not_record_tampering(msg):
    assert "edit_record" not in G.request_flags(msg)
