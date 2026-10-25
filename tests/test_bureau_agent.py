"""Phase D: the agent consumes bureau evidence without conflating a hold or a provider failure with a rejection.

The bureau-backed evidence is produced by the conventional lifecycle (``process_bureau_application``);
the agent only reads the stored record, exactly as it does for non-bureau decisions.
"""
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from loan_advisory.agent import facts as F
from loan_advisory.agent.contracts import AgentRequest, Session
from loan_advisory.agent.runtime import build_offline_agent
from loan_advisory.agent.settings import AgentSettings
from loan_advisory.application.lifecycle import process_bureau_application
from loan_advisory.infrastructure.bureau_client import BureauClient
from loan_advisory.infrastructure.frappe_adapter import UnknownApplication
from synthetic_bureau.app import create_app
from synthetic_bureau.labeling import to_frappe_doc
from tests.test_agent_graph import FakePolicy, ScriptedLLM

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = json.loads((ROOT / "data" / "synthetic" / "bureau" / "cases_120.json").read_text(encoding="utf-8"))


def _case(scenario: str, position: int = 0) -> dict:
    return [c for c in FIXTURE["cases"] if c["scenario"] == scenario][position]


class _Store:
    def __init__(self, cases: list[dict]):
        self._docs = {c["application"]["application_id"]: to_frappe_doc(c) for c in cases}

    def get(self, application_id: str) -> dict:
        if application_id not in self._docs:
            raise UnknownApplication(application_id)
        return dict(self._docs[application_id])


@pytest.fixture(scope="module")
def client():
    http = TestClient(create_app())
    yield BureauClient(client=http)
    http.close()


def _agent(case, client, *, scenario=None, llm=None, policy=None, tmp_path=None):
    llm = llm or ScriptedLLM(intent="explain")
    ag, store, sink = build_offline_agent(
        store=_Store([case]), refs=[], llm=llm, policy_tools=policy,
        profile={"legal_name": "Ref", "entity_type": "nbfc", "relationship": "public reference lender, not a partner"})
    if tmp_path is not None:
        ag.audit_path = tmp_path / "turns.jsonl"
        ag.handoff.path = tmp_path / "handoffs.jsonl"
    process_bureau_application(case["application"]["application_id"], store, sink, client, scenario=scenario)
    return ag, sink


def _ask(ag, msg, case):
    return ag.run(AgentRequest(request_id="r1", conversation_id="c1", message=msg,
                               application_ref=case["application"]["application_id"]),
                  Session(applicant_ref=case["application"]["applicant_id"]))


def _composed(llm) -> bool:
    return any(tag.startswith("compose_") for tag, *_ in llm.prompts)


# --------------------------------------------------------------- projection
@pytest.mark.parametrize("outcome, provider_error, kind", [
    ("REVIEW", None, "DATA_QUALITY_HOLD"),
    ("ERROR", {"code": "BUREAU_TIMEOUT", "retryable": True}, "PROVIDER_FAILURE"),
    ("ERROR", None, "EVALUATION_ERROR"),
    ("REJECTED", None, "CREDIT_REJECTION"),
    ("APPROVED", None, "APPROVED"),
])
def test_bureau_facts_classifies_every_outcome(outcome, provider_error, kind):
    rec = {"decision": "ERROR" if outcome in ("REVIEW", "ERROR") else outcome, "outcome": outcome,
           "review": {"required": outcome == "REVIEW", "category": "DATA_QUALITY"},
           "bureau": {"provider_error": provider_error, "score": {"source": "SYNTHETIC_BUREAU_REPLACED_PLACEHOLDER"}}}
    bf = F.bureau_facts(rec)
    assert bf["outcome_kind"] == kind
    assert bf["is_credit_rejection"] is (kind == "CREDIT_REJECTION")
    assert bf["is_non_rejected"] is (kind != "CREDIT_REJECTION")


def test_bureau_facts_is_none_without_bureau_blocks():
    assert F.bureau_facts(None) is None
    assert F.bureau_facts({"decision": "REJECTED", "outcome": "REJECTED", "review": None, "bureau": None}) is None


# --------------------------------------------------------------- approved
def test_approved_bureau_record_states_the_outcome_without_conditions(client, tmp_path):
    case, llm = _case("VALID_PASS"), ScriptedLLM(intent="explain")
    ag, _ = _agent(case, client, llm=llm, tmp_path=tmp_path)
    r = _ask(ag, "Why was my application decided this way?", case)
    assert r.action == "answer" and r.abstained is False and not _composed(llm)
    assert "APPROVED" in r.answer and "no rejection reasons" in r.answer
    assert "guarantee" not in r.answer.lower()
    card = r.decision_card
    assert card["decision"] == card["recorded_outcome"] == "APPROVED"
    assert card["bureau"]["outcome_kind"] == "APPROVED"
    assert card["bureau"]["score_source"] == "SYNTHETIC_BUREAU_REPLACED_PLACEHOLDER"


# --------------------------------------------------------------- A. credit rejection
def test_credit_rejection_is_projected_as_a_policy_rejection(client, tmp_path):
    case = _case("FAIL_SCORE")
    llm = ScriptedLLM(intent="explain")
    ag, _ = _agent(case, client, llm=llm, tmp_path=tmp_path)
    r = _ask(ag, "Why was my loan rejected?", case)
    assert r.action == "answer"
    card = r.decision_card
    assert card["decision"] == card["recorded_outcome"] == "REJECTED"
    assert card["bureau"]["outcome_kind"] == "CREDIT_REJECTION"
    assert "ERR_CREDIT_SCORE_BELOW_MINIMUM" in card["failed_reason_codes"]
    facts = json.loads(llm.prompts[-1][1].split("FACTS (JSON):")[1].rsplit("Return only", 1)[0])
    assert facts["bureau"]["is_credit_rejection"] is True
    assert facts["bureau"]["is_data_quality_hold"] is False
    assert facts["bureau"]["score_source"]


def test_rejection_fallback_never_calls_the_hold_the_decision(client, tmp_path):
    case = _case("FAIL_SCORE")
    ag, _ = _agent(case, client, llm=ScriptedLLM(intent="explain", fail=True), tmp_path=tmp_path)
    r = _ask(ag, "Why was my loan rejected?", case)
    assert "fallback_template" in r.guard_flags
    assert "REJECTED" in r.answer and "ERROR" not in r.answer
    assert "synthetic bureau" in r.answer  # the score source is named, not implied to be a real bureau


def test_improvement_plan_from_a_bureau_rejection_is_labelled_general_guidance(client, tmp_path):
    case = _case("FAIL_SCORE")
    ag, _ = _agent(case, client, llm=ScriptedLLM(intent="improve"), tmp_path=tmp_path)
    r = _ask(ag, "How can I improve my chances?", case)
    assert r.intent == "improve" and r.improvement_plan
    assert {s["guidance_source"] for s in r.improvement_plan} == {"general financial guidance, not lender policy"}
    assert r.citations == []  # no lender policy is cited for general guidance
    assert "guarantee" not in r.answer.lower()


# --------------------------------------------------------------- B. data-quality hold
def test_data_quality_hold_is_not_a_rejection_and_goes_to_a_human(client, tmp_path):
    case, llm = _case("NO_HIT"), ScriptedLLM(intent="explain")
    ag, _ = _agent(case, client, llm=llm, tmp_path=tmp_path)
    r = _ask(ag, "Why was I rejected?", case)
    assert r.action == "handoff" and not _composed(llm)
    assert "has not been rejected" in r.answer and "no record" in r.answer
    card = r.decision_card
    assert card["decision"] == "ERROR" and card["recorded_outcome"] == "REVIEW"
    assert card["bureau"]["outcome_kind"] == "DATA_QUALITY_HOLD"
    assert "DQ_BUREAU_NO_HIT" in card["bureau"]["review_reason_codes"]


def test_information_request_lists_the_missing_details(client, tmp_path):
    case = _case("MISSING_REQUIRED_FIELDS")
    ag, _ = _agent(case, client, tmp_path=tmp_path)
    r = _ask(ag, "Why was I rejected?", case)
    assert r.action == "clarify" and "has not been rejected" in r.answer
    assert r.missing_information and r.missing_information[0].replace("_", " ") in r.answer
    assert r.decision_card["bureau"]["info_requested"] is True


def test_what_if_on_a_bureau_hold_simulates_nothing(client, tmp_path):
    case = _case("NO_HIT")
    llm = ScriptedLLM(intent="what_if", changes={"credit_score": {"set": 800}})
    ag, _ = _agent(case, client, llm=llm, tmp_path=tmp_path)
    r = _ask(ag, "What if my credit score were 800?", case)
    assert r.intent == "what_if" and r.what_if is None
    assert "has not been rejected" in r.answer and "would pass" not in r.answer.lower()
    assert not _composed(llm)


def test_hold_answer_makes_no_policy_claim_and_states_no_procedure(client, tmp_path):
    case = _case("NO_HIT")
    ag, _ = _agent(case, client, tmp_path=tmp_path)
    r = _ask(ag, "What should I do about the bureau problem?", case)
    assert r.citations == []
    assert "correction procedure" in r.answer
    assert "would not clear this hold" in r.answer


# --------------------------------------------------------------- C. provider failure
def test_retryable_provider_failure_invites_a_retry_and_invents_no_score(client, tmp_path):
    case, llm = _case("VALID_PASS"), ScriptedLLM(intent="explain")
    ag, _ = _agent(case, client, scenario="TIMEOUT", llm=llm, tmp_path=tmp_path)
    r = _ask(ag, "What is my decision?", case)
    assert r.action == "clarify" and r.abstained is True and not _composed(llm)
    assert "BUREAU_TIMEOUT" in r.answer and "try again" in r.answer
    assert "your score" not in r.answer.lower()
    assert "APPROVED" not in r.answer and "REJECTED" not in r.answer  # no decision was recorded
    card = r.decision_card
    assert card["recorded_outcome"] == "ERROR" and card["bureau"]["outcome_kind"] == "PROVIDER_FAILURE"
    assert card["bureau"]["provider_error"]["retryable"] is True and card["bureau"]["retryable"] is True


def test_non_retryable_provider_failure_routes_to_a_human(client, tmp_path):
    case = _case("VALID_PASS")
    ag, _ = _agent(case, client, scenario="MALFORMED_RESPONSE", tmp_path=tmp_path)
    r = _ask(ag, "Why was I rejected?", case)
    assert r.action == "handoff" and "human reviewer" in r.answer
    assert "BUREAU_MALFORMED_RESPONSE" in r.answer
    assert r.decision_card["bureau"]["outcome_kind"] == "PROVIDER_FAILURE"
    assert r.decision_card["bureau"]["retryable"] is False


# --------------------------------------------------------------- D. non-bureau flows
def test_non_bureau_agent_flow_is_unchanged(tmp_path):
    ag, _, _ = build_offline_agent(llm=ScriptedLLM(intent="explain"))
    ag.audit_path = tmp_path / "turns.jsonl"
    r = ag.run(AgentRequest(request_id="r1", conversation_id="c1", message="Why was I rejected?",
                            application_ref="APP-TEST-005"), Session(applicant_ref="CUS-TEST-005"))
    assert r.intent == "explain" and r.decision_card["decision"] == "REJECTED"
    assert r.decision_card["recorded_outcome"] == "REJECTED"
    assert "bureau" not in r.decision_card


# --------------------------------------------------------------- E. citations / abstention
def test_policy_question_with_a_bureau_hold_still_cites_with_provenance(client, tmp_path):
    case = _case("NO_HIT")
    llm = ScriptedLLM(intent="policy", policy={"abstain": False, "citations": ["P1"],
                                               "answer": "Complaints go to the grievance officer within 30 days."})
    ag, _ = _agent(case, client, llm=llm, policy=FakePolicy(), tmp_path=tmp_path)
    r = _ask(ag, "How do I complain about a wrong bureau entry?", case)
    assert r.intent == "policy" and r.abstained is False
    assert [c.document_id for c in r.citations] == ["BFL-GRIEVANCE"]
    assert r.citations[0].title and r.citations[0].relationship
    assert r.decision_card is None  # a policy answer is not grounded in the application's record


def test_policy_question_abstains_when_no_approved_passage_supports_it(client, tmp_path):
    case = _case("NO_HIT")
    ag, _ = _agent(case, client, llm=ScriptedLLM(intent="policy"), policy=FakePolicy(passages=[]), tmp_path=tmp_path)
    r = _ask(ag, "What is the bureau correction procedure?", case)
    assert r.intent == "policy" and r.abstained is True and r.citations == []
    assert "approved policy sources" in r.answer


def test_citation_mode_default_is_unchanged_and_primary_source_is_opt_in():
    assert AgentSettings.from_env({}).citation_mode == "labels"
    assert AgentSettings.from_env({"AGENT_CITATION_MODE": "primary_source"}).citation_mode == "primary_source"
