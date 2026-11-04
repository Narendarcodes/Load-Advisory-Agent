"""E2E D-16 (A5 live, 2026-11-04): the borrower decision card and the explain facts carried raw v2 outcome codes
(ELIGIBILITY_CONDITIONS_MET, COUNTER_OFFER, DECLINE), the assistant card showed them as the badge, and a counter-offer
explanation had no offer to talk about.

decision_card_borrower now maps the recorded v2 outcome onto the borrower vocabulary the assistant UI already knows,
explain facts carry the plain outcome words, the offer (amount, EMI, loan period) and the plain reason categories, the
deterministic fallback states the offer, and every borrower-visible answer passes through guards.sanitize_answer when
that guard is available (PR #46)."""
import copy

import pytest

from loan_advisory.agent import facts as F
from loan_advisory.agent import graph as GR
from tests.test_agent_graph import ScriptedLLM, agent_for, ask

V2 = ["ELIGIBILITY_CONDITIONS_MET", "COUNTER_OFFER", "MANUAL_REVIEW", "MORE_INFORMATION_REQUIRED", "DECLINE"]


def _counter(sink, app="APP-TEST-005"):
    rid = next(k for k, r in sink.records.items() if r["application_ref"] == app and not r["is_simulation"])
    rec = sink.records[rid]
    rec.update(decision="COUNTER_OFFER", outcome="COUNTER_OFFER", reason_categories=["REQUEST_OUTSIDE_OFFER"],
               offer={"amount": 2500000, "emi": 55515, "tenure_months": 84, "counter_offer": True})
    for e in rec.get("rule_evaluations", []):
        e["result"] = "PASS"
    return rec


@pytest.mark.parametrize("code,want", [("ELIGIBILITY_CONDITIONS_MET", "APPROVED"), ("COUNTER_OFFER", "COUNTER"),
                                       ("MANUAL_REVIEW", "REVIEW"), ("MORE_INFORMATION_REQUIRED", "INFO_REQUESTED"),
                                       ("DECLINE", "REJECTED"), ("REJECTED", "REJECTED"), ("APPROVED", "APPROVED")])
def test_borrower_card_uses_the_ui_vocabulary(code, want):
    card = F.decision_card_borrower({"decision": code, "outcome": code, "application_ref": "A"})
    assert card["recorded_outcome"] == want and card["decision"] == want
    assert not any(c in str(card) for c in V2)


@pytest.mark.parametrize("locale", ["en", "hi", "te"])
@pytest.mark.parametrize("code", V2)
def test_outcome_plain_has_words_for_every_v2_code(code, locale):
    words = F.outcome_plain({"decision": code}, locale)
    assert words and "_" not in words and code not in words


def test_offer_numbers_are_grounded():
    rec = {"decision": "COUNTER_OFFER", "offer": {"amount": 2500000, "emi": 55515, "tenure_months": 84}}
    nums = F.grounded_numbers(rec)
    assert {"2500000", "55515", "84"} <= nums


def test_counter_offer_explain_facts_carry_offer_reasons_and_plain_outcome(tmp_path):
    llm = ScriptedLLM(intent="explain", compose="We can't offer the full amount. We can offer ₹25,00,000 at ₹55,515 a month for 84 months. This demo uses synthetic rules.")
    ag, _, sink = agent_for(llm, tmp_path=tmp_path)
    _counter(sink)
    r = ask(ag, "Why did I get this decision?")
    system = next(p[1] for p in llm.prompts if p[0] == "compose_explain")
    assert '"outcome_plain"' in system and '"offer"' in system and '"reason_categories"' in system
    assert "₹25,00,000" in system and "₹55,515" in system
    assert r.decision_card["recorded_outcome"] == "COUNTER"
    assert "COUNTER_OFFER" not in r.answer
    assert "fallback_template" not in r.guard_flags  # the offer numbers are grounded


def test_counter_offer_fallback_states_the_offer_in_plain_words(tmp_path):
    ag, _, sink = agent_for(ScriptedLLM(intent="explain", compose=None, fail=False), tmp_path=tmp_path)
    rec = _counter(sink)
    s = {"intent": "explain", "record": copy.deepcopy(rec), "req": None}
    ag._req = lambda _s: type("R", (), {"locale": "en"})()
    txt = ag._fallback(s)
    assert "COUNTER_OFFER" not in txt
    assert "₹25,00,000" in txt and "₹55,515" in txt and "84" in txt


def test_answers_pass_through_sanitize_answer_when_available(tmp_path, monkeypatch):
    seen = []

    def fake(text, locale="en"):
        seen.append(locale)
        return text.replace("COUNTER_OFFER", "a smaller offer")

    monkeypatch.setattr(GR.G, "sanitize_answer", fake, raising=False)
    ag, _, sink = agent_for(ScriptedLLM(intent="explain", compose="Your decision is COUNTER_OFFER. This demo uses synthetic rules."), tmp_path=tmp_path)
    _counter(sink)
    r = ask(ag, "Why?")
    assert "COUNTER_OFFER" not in r.answer and seen
