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
