"""The deterministic explain fallback speaks the applicant's language (GUI test D-10).

When the LLM draft is unusable (outage, timeout, guard flags) the agent replaces it with a template built from
the recorded facts. For policy questions that template was already localised; the explain fallback was English
only, so a Telugu (or Hindi) applicant who asked "why was my loan rejected?" got an English answer. The facts
(rule names, values, thresholds) are unchanged; only the sentence frame is localised.
"""
import re

import pytest

from tests.test_agent_graph import ScriptedLLM, agent_for, ask

SCRIPT = {"hi": re.compile(r"[\u0900-\u097F]"), "te": re.compile(r"[\u0C00-\u0C7F]")}


@pytest.mark.parametrize("loc", ["hi", "te"])
def test_explain_fallback_is_in_the_applicants_language(loc, tmp_path):
    ag, _, _ = agent_for(ScriptedLLM(fail=True), tmp_path=tmp_path)
    r = ask(ag, "Why was my application rejected?", locale=loc)
    assert r.intent == "explain" and "fallback_template" in r.guard_flags
    head = r.answer.splitlines()[0]
    assert len(SCRIPT[loc].findall(head)) > 10, head
    assert "Your application's recorded decision" not in r.answer
    for name in ("Existing EMIs vs income", "Credit score", "Time in current job"):
        assert name in r.answer  # the same three recorded reasons, nothing invented
    assert "Monthly income:" not in r.answer


def test_english_explain_fallback_is_unchanged(tmp_path):
    ag, _, _ = agent_for(ScriptedLLM(fail=True), tmp_path=tmp_path)
    r = ask(ag, "Why was my application rejected?")
    assert r.answer.startswith("Your application's recorded decision is REJECTED under a ")
    assert "; the policy needs " in r.answer and "I can show what would need to change, or answer questions." in r.answer
