"""E2E D-17 (A5 live, 2026-11-04): on a MORE_INFORMATION_REQUIRED decision the agent showed the catalogue rule id
("PL-095") as the missing item, in the card and in an English template for a Telugu borrower. Missing items now reach
the borrower as plain field keys (the same rule->field map the portal API uses, D-07) and the template is written in
plain words in the borrower's language."""
import re

import pytest

from loan_advisory.agent import facts as F
from loan_advisory.agent import prompts as P
from tests.test_agent_graph import ScriptedLLM, agent_for, ask

PL = re.compile(r"\bPL-\d{3}\b")


def test_rule_ids_map_to_plain_fields_and_unknown_ids_never_pass():
    rec = {"inputs": {"missing_fields": ["PL-095", "PL-121", "PL-999", "monthly_income", "PL-095"]}}
    got = F.borrower_missing_fields(rec)
    assert got == ["consents", "income_documents", "documents", "monthly_income"]


@pytest.mark.parametrize("locale", ["en", "hi", "te"])
def test_missing_field_words_are_plain_and_localised(locale):
    words = F.missing_field_words(["consents", "income_documents", "documents", "monthly_income"], locale)
    assert words and not PL.search(words) and "_" not in words


def test_card_never_carries_a_rule_id():
    card = F.decision_card_borrower({"decision": "MORE_INFORMATION_REQUIRED", "inputs": {"missing_fields": ["PL-095"]}})
    assert card["missing_fields"] == ["consents"]


@pytest.mark.parametrize("locale,script", [("en", r"[A-Za-z]"), ("te", r"[\u0C00-\u0C7F]"), ("hi", r"[\u0900-\u097F]")])
def test_info_requested_answer_is_plain_and_in_the_borrowers_language(tmp_path, locale, script):
    if locale != "en" and "info_requested" not in P.TEMPLATES.get(locale, {}):
        pytest.skip("localised info_requested template comes with PR #46")
    ag, _, sink = agent_for(ScriptedLLM(intent="explain"), tmp_path=tmp_path)
    rid = next(k for k, r in sink.records.items() if r["application_ref"] == "APP-TEST-005" and not r["is_simulation"])
    rec = sink.records[rid]
    rec.update(decision="MORE_INFORMATION_REQUIRED", outcome="MORE_INFORMATION_REQUIRED", lifecycle_state="INFO_REQUESTED")
    rec.setdefault("inputs", {})["missing_fields"] = ["PL-095"]
    r = ask(ag, "Why did I get this decision?", locale=locale)
    assert not PL.search(r.answer) and not PL.search(str(r.missing_information))
    assert re.search(script, r.answer)
