"""Evidence-based abstention: the agent declines when there is no citable evidence, when the retrieved evidence does
not support the answer, when the answer invents a threshold or cites a passage that was never retrieved, and when
wrong-lender or superseded content is filtered out. It still answers when the evidence is adequate — including
under `labels`, `verify` and `primary_source` — so abstention is tied to evidence, not to a low-confidence phrase.

Offline and deterministic (scripted LLM, fixed passages); these are not production-retrieval measurements."""
import pytest

from loan_advisory.agent import settings as S
from rag.retrieve import profile_filter
from tests.test_agent_graph import FakePolicy, ScriptedLLM
from tests.test_agent_upgrades import agent_for, ask


def P(label, text, doc="DOC", **citation):
    c = {"label": label, "document_id": doc, "title": doc, "section": "1"}
    c.update(citation)
    return {"label": label, "chunk_id": f"{doc}#{label}", "score": 1.0, "text": text, "citation": c}


GREV = P("P1", "Complaints may be raised with the Grievance Redressal Officer, who will respond within 30 days of receipt.", "GRIEV")
FEES = P("P2", "Foreclosure charges of up to 4.72% apply on the outstanding principal for term loans.", "FEES")
GREV_ANSWER = "Complaints may be raised with the Grievance Redressal Officer, who will respond within 30 days of receipt."
ABSTAIN_TEXT = "couldn't find this in the approved policy sources"


def policy_agent(llm, passages=None, *, mode="labels", tmp_path=None, fail=False):
    return agent_for(llm, policy=FakePolicy(passages=passages, fail=fail), tmp_path=tmp_path,
                     settings=S.AgentSettings(citation_mode=mode))


# ---------------------------------------------------------------- (a) no relevant passages / retrieval failure
@pytest.mark.parametrize("mode", ["labels", "verify", "primary_source"])
def test_no_evidence_abstains_before_any_composition(mode, tmp_path):
    llm = ScriptedLLM(intent="policy")
    r = ask(policy_agent(llm, [], mode=mode, tmp_path=tmp_path), "What is the foreclosure fee of another bank?")
    assert r.intent == "policy" and r.action == "answer"
    assert r.abstained is True and r.citations == []
    assert ABSTAIN_TEXT in r.answer
    assert not [p for p in llm.prompts if p[0] == "compose_policy"]  # abstains without asking the model to guess
    assert r.guard_flags == []


def test_retriever_failure_abstains_instead_of_guessing(tmp_path):
    r = ask(policy_agent(ScriptedLLM(intent="policy"), fail=True, tmp_path=tmp_path), "How do I complain?")
    assert r.abstained is True and r.citations == [] and ABSTAIN_TEXT in r.answer


# ---------------------------------------------------------------- (b) evidence present but insufficient
def test_model_abstains_when_retrieved_passages_do_not_answer_the_question(tmp_path):
    llm = ScriptedLLM(intent="policy", policy={"abstain": True, "answer": "", "citations": []})
    r = ask(policy_agent(llm, [FEES], tmp_path=tmp_path), "How long does the lender take to answer a complaint?")
    assert r.abstained is True and r.citations == [] and ABSTAIN_TEXT in r.answer
    assert [p[0] for p in llm.prompts if p[0] == "compose_policy"] == ["compose_policy"]  # one chance, no retry


def test_answer_citing_evidence_that_was_never_retrieved_abstains(tmp_path):
    llm = ScriptedLLM(intent="policy",
                      policy={"abstain": False, "answer": "The fee is 4.72%.", "citations": ["P9"]})
    r = ask(policy_agent(llm, [FEES], tmp_path=tmp_path), "What is the foreclosure fee?")
    assert "unknown_citation_label" in r.guard_flags and "fallback_template" in r.guard_flags
    assert r.abstained is True and r.citations == [] and ABSTAIN_TEXT in r.answer


# ---------------------------------------------------------------- (c) conflicting passages
def test_conflicting_sources_are_surfaced_not_collapsed(tmp_path):
    a = P("P1", "Foreclosure charges of up to 4.72% apply on the outstanding principal.", "FEES")
    b = P("P2", "Foreclosure charges of up to 2.00% apply on the outstanding principal.", "FEES_OLD")
    llm = ScriptedLLM(intent="policy", policy={
        "abstain": False, "citations": ["P1", "P2"],
        "answer": "Foreclosure charges are 4.72% under one document and 2.00% under another."})
    r = ask(policy_agent(llm, [a, b], mode="primary_source", tmp_path=tmp_path), "What is the foreclosure fee?")
    assert r.abstained is False and [c.label for c in r.citations] == ["P1", "P2"]  # neither side is hidden


def test_conflicting_sources_abstain_when_the_model_will_not_pick_a_side(tmp_path):
    a = P("P1", "Foreclosure charges of up to 4.72% apply on the outstanding principal.", "FEES")
    b = P("P2", "Foreclosure charges of up to 2.00% apply on the outstanding principal.", "FEES_OLD")
    llm = ScriptedLLM(intent="policy", policy={"abstain": True, "answer": "", "citations": []})
    r = ask(policy_agent(llm, [a, b], tmp_path=tmp_path), "What is the foreclosure fee?")
    assert r.abstained is True and r.citations == [] and ABSTAIN_TEXT in r.answer


# ---------------------------------------------------------------- (d) wrong lender / superseded version
def test_wrong_lender_and_unapproved_content_is_filtered_before_retrieval():
    profile = {"legal_name": "Ref", "entity_type": "nbfc", "lender_id": "own"}
    current, historical = profile_filter(profile, "current"), profile_filter(profile, "historical")

    def chunk(lender, status="approved"):
        return {"lender_id": lender, "approval_status": status, "applies_to_entity": ["all"]}

    assert current.allows(chunk("own")) and current.allows(chunk("none"))  # own lender + regulator
    assert not current.allows(chunk("anotherbank"))                         # another lender's policy
    assert not current.allows(chunk("own", "pending_review"))               # not approved
    assert not current.allows(chunk("own", "approved_historical"))          # superseded: not current
    assert historical.allows(chunk("own", "approved_historical"))           # served only for temporal questions


def test_superseded_passage_is_served_only_for_temporal_questions_and_stays_labelled(tmp_path):
    old = P("P1", "Complaints may be raised with the Grievance Redressal Officer within 30 days.", "GRIEV_V5",
            approval_status="approved_historical")
    pol = FakePolicy(passages=[old])
    llm = ScriptedLLM(intent="policy", policy={
        "abstain": False, "citations": ["P1"],
        "answer": "Under the earlier version, complaints went to the Grievance Redressal Officer."})
    ag = agent_for(llm, pol, tmp_path=tmp_path)
    r = ask(ag, "Under the previous version, how did I complain?")
    assert pol.historical is True
    assert "[historical]" in next(u for t, _, u in llm.prompts if t == "compose_policy")
    assert r.abstained is False and r.citations[0].approval_status == "approved_historical"


# ---------------------------------------------------------------- (e) unsupported numerical thresholds
def test_invented_policy_threshold_forces_abstention(tmp_path):
    llm = ScriptedLLM(intent="policy", policy={
        "abstain": False, "citations": ["P2"],
        "answer": "Foreclosure charges are 9.5% of the outstanding principal."})
    r = ask(policy_agent(llm, [FEES], tmp_path=tmp_path), "What is the foreclosure fee?")
    assert "ungrounded_numbers:9.5" in r.guard_flags
    assert r.abstained is True and r.citations == [] and "9.5" not in r.answer and ABSTAIN_TEXT in r.answer


# ---------------------------------------------------------------- (f) general guidance without lender policy
def test_general_guidance_without_lender_policy_abstains(tmp_path):
    llm = ScriptedLLM(intent="policy")
    r = ask(policy_agent(llm, [], tmp_path=tmp_path), "What does risk-based pricing mean?")
    assert r.abstained is True and r.citations == [] and ABSTAIN_TEXT in r.answer
    assert not [p for p in llm.prompts if p[0] == "compose_policy"]


# ---------------------------------------------------------------- (g) adequate evidence still answers
@pytest.mark.parametrize("mode", ["labels", "verify", "primary_source"])
def test_adequate_evidence_answers_without_false_abstention(mode, tmp_path):
    llm = ScriptedLLM(intent="policy", policy={"abstain": False, "citations": ["P1"], "answer": GREV_ANSWER})
    r = ask(policy_agent(llm, [GREV], mode=mode, tmp_path=tmp_path), "How do I file a complaint?")
    assert r.abstained is False and r.action == "answer" and r.guard_flags == []
    assert [c.label for c in r.citations] == ["P1"] and r.citations[0].document_id == "GRIEV"


def test_tentative_wording_with_solid_evidence_is_not_refused(tmp_path):
    ans = "It may depend on the case, but complaints may be raised with the Grievance Redressal Officer."
    llm = ScriptedLLM(intent="policy", policy={"abstain": False, "citations": ["P1"], "answer": ans})
    r = ask(policy_agent(llm, [GREV], tmp_path=tmp_path), "How do I file a complaint?")
    assert r.abstained is False and [c.label for c in r.citations] == ["P1"] and r.guard_flags == []
