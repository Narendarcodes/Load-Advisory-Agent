"""feat/agent-upgrades: sentence streaming behind the guard, per-turn deadline with graceful fallback,
fast (regex-first) classify, typed settings. Offline and deterministic (scripted / slow fake LLMs)."""
import json
import threading
import time

import pytest

from loan_advisory.agent import settings as S
from loan_advisory.agent.contracts import AgentRequest, Session
from loan_advisory.agent.llm import LLMError
from loan_advisory.agent.runtime import build_offline_agent
from loan_advisory.agent.streaming import SentenceGate, remainder, split_sentences
from tests.test_agent_graph import FakePolicy, ScriptedLLM


def agent_for(llm, policy=None, tmp_path=None, settings=None):
    ag, store, sink = build_offline_agent(llm=llm, policy_tools=policy, profile={"legal_name": "Ref", "entity_type": "nbfc"})
    if settings is not None:
        ag.settings = settings
    if tmp_path is not None:
        ag.audit_path = tmp_path / "turns.jsonl"
        ag.handoff.path = tmp_path / "handoffs.jsonl"
    return ag


def ask(ag, msg, app="APP-TEST-005", who="CUS-TEST-005", on_sentence=None, **kw):
    req = AgentRequest(request_id=kw.pop("rid", "r1"), conversation_id=kw.pop("conv", "c1"), message=msg, application_ref=app, **kw)
    return ag.run(req, Session(applicant_ref=who) if who else None, on_sentence=on_sentence)


# ------------------------------------------------------------------ settings
def test_settings_from_env_are_typed_and_have_safe_defaults(monkeypatch):
    for k in ("AGENT_VOICE_DEADLINE_S", "AGENT_TEXT_DEADLINE_S", "AGENT_FAST_CLASSIFY", "AGENT_CITATION_MODE"):
        monkeypatch.delenv(k, raising=False)
    s = S.AgentSettings.from_env()
    assert s.voice_deadline_s < 90  # the voice worker's old HTTP timeout; a voice turn must finish well inside it
    assert s.text_deadline_s >= s.voice_deadline_s
    assert s.fast_classify in ("off", "voice", "all")
    monkeypatch.setenv("AGENT_VOICE_DEADLINE_S", "12.5")
    monkeypatch.setenv("AGENT_FAST_CLASSIFY", "all")
    s = S.AgentSettings.from_env()
    assert s.voice_deadline_s == 12.5 and s.fast_classify == "all"
    monkeypatch.setenv("AGENT_FAST_CLASSIFY", "bogus")
    with pytest.raises(ValueError):
        S.AgentSettings.from_env()


# ------------------------------------------------------------------ sentence splitting / gate
def test_split_sentences_keeps_decimals_amounts_and_handles_devanagari():
    done, tail = split_sentences("Your FOIR is 64.8%, above 45%. Your score is 689. The other")
    assert done == ["Your FOIR is 64.8%, above 45%.", "Your score is 689."] and tail == "The other"
    done, tail = split_sentences("आपका स्कोर 689 है। सीमा 700 है। ")
    assert done == ["आपका स्कोर 689 है।", "सीमा 700 है।"] and tail == ""
    done, tail = split_sentences("1. Pay down one EMI.\n2. Wait")
    assert done == ["1. Pay down one EMI."] and tail == "2. Wait"


def test_gate_releases_only_clean_sentences_and_stops_at_the_first_flagged_one():
    out = []
    g = SentenceGate(allowed={"689", "700"}, emit=out.append)
    g.push("Your score is 689 and the synthetic limit is 700. ")
    assert out == ["Your score is 689 and the synthetic limit is 700."]
    g.push("You will definitely be approved next time. Your income is fine.")
    g.close()
    assert out == ["Your score is 689 and the synthetic limit is 700."]
    assert g.tainted and "guarantee_language" in g.flags[0]


def test_gate_blocks_ungrounded_numbers_and_flushes_a_clean_tail_on_close():
    out = []
    g = SentenceGate(allowed={"689"}, emit=out.append)
    g.push("Your score is 689. It must reach")
    g.close()
    assert out == ["Your score is 689.", "It must reach"]
    out2 = []
    g2 = SentenceGate(allowed={"689"}, emit=out2.append)
    g2.push("Your score is 689. The bank needs 750. Okay.")
    g2.close()
    assert out2 == ["Your score is 689."] and g2.tainted and g2.flags[0].startswith("ungrounded_numbers")


def test_remainder_speaks_only_what_was_not_already_spoken():
    spoken = ["Your score is 689.", "The limit is 700."]
    assert remainder(spoken, "Your score is 689. The limit is 700.\n\n(Synthetic policy.)") == "(Synthetic policy.)"
    assert remainder(spoken, "Your score is 689. The limit is 700.") == ""
    assert remainder([], "Full answer.") == "Full answer."
    # the final answer diverged (e.g. deterministic fallback): say the whole final answer after a short bridge
    r = remainder(["Your score is 689."], "Your application's recorded decision is REJECTED.", bridge="To be precise:")
    assert r == "To be precise: Your application's recorded decision is REJECTED."


# ------------------------------------------------------------------ graph: streaming behind the guard
def test_streamed_sentences_are_validated_and_the_full_answer_still_runs_validate(tmp_path):
    llm = ScriptedLLM(intent="explain", compose="Your recorded decision is REJECTED. Your credit score is 690 and the synthetic limit is 700.")
    ag = agent_for(llm, tmp_path=tmp_path)
    got = []
    r = ask(ag, "why was I rejected?", channel="voice", on_sentence=got.append)
    assert got[:2] == ["Your recorded decision is REJECTED.", "Your credit score is 690 and the synthetic limit is 700."]
    assert r.answer.startswith(" ".join(got[:2]))
    assert "fallback_template" not in r.guard_flags
    assert r.timings.get("first_sentence_ms") is not None
    assert remainder(got, r.answer) == ""


def test_a_flagged_sentence_is_never_streamed_and_the_turn_falls_back(tmp_path):
    llm = ScriptedLLM(intent="explain", compose="Your credit score is 690. You will definitely get the loan if you reapply.")
    ag = agent_for(llm, tmp_path=tmp_path)
    got = []
    r = ask(ag, "why was I rejected?", channel="voice", on_sentence=got.append)
    assert all("definitely" not in g for g in got)
    assert "fallback_template" in r.guard_flags  # full-answer validation still ran (twice) and rejected the draft
    assert "definitely" not in r.answer


def test_an_ungrounded_number_is_never_streamed(tmp_path):
    llm = ScriptedLLM(intent="explain", compose="Your recorded decision is REJECTED. Your credit score is 689.")
    ag = agent_for(llm, tmp_path=tmp_path)
    got = []
    ask(ag, "why was I rejected?", channel="voice", on_sentence=got.append)
    assert got[0] == "Your recorded decision is REJECTED." and not any("689" in g for g in got)


def test_no_sink_means_no_streaming_behaviour_change(tmp_path):
    llm = ScriptedLLM(intent="explain")
    ag = agent_for(llm, tmp_path=tmp_path)
    r = ask(ag, "why was I rejected?")
    assert r.intent == "explain" and "first_sentence_ms" not in r.timings


def test_policy_answer_streams_only_when_citations_are_present(tmp_path):
    pol = {"abstain": False, "citations": ["P1"], "answer": "Complaints go to the Grievance Redressal Officer within 30 days. That is the first step."}
    llm = ScriptedLLM(intent="policy", policy=pol)
    ag = agent_for(llm, policy=FakePolicy(), tmp_path=tmp_path)
    got = []
    r = ask(ag, "how do I complain?", channel="voice", on_sentence=got.append)
    assert got and got[0].startswith("Complaints go to")
    assert [c.label for c in r.citations] == ["P1"]
    llm2 = ScriptedLLM(intent="policy", policy={"abstain": False, "citations": [], "answer": "Complaints go to the officer."})
    ag2 = agent_for(llm2, policy=FakePolicy(), tmp_path=tmp_path)
    got2 = []
    ask(ag2, "how do I complain?", channel="voice", on_sentence=got2.append)
    assert not any("officer" in g for g in got2)  # uncited answer never spoken; only the abstention template is
    assert got2 and "won't guess" in " ".join(got2)


# ------------------------------------------------------------------ fast classify
@pytest.mark.parametrize("msg,intent", [
    ("Why was my loan application rejected?", "explain"),
    ("What can I do to improve before I reapply?", "improve"),
    ("How do I raise a complaint with the lender?", "policy"),
    ("मेरा लोन आवेदन क्यों रिजेक्ट हुआ?", "explain"),
    ("లెండర్‌కు ఫిర్యాదు ఎలా చేయాలి?", "policy"),
    ("నా లోన్ దరఖాస్తు ఎందుకు తిరస్కరించారు?", "explain"),
])
def test_fast_classify_skips_the_llm_for_clear_intents(tmp_path, msg, intent):
    llm = ScriptedLLM(intent="other")  # would be wrong if it were consulted
    ag = agent_for(llm, policy=FakePolicy(), tmp_path=tmp_path, settings=S.AgentSettings(fast_classify="voice"))
    r = ask(ag, msg, channel="voice")
    assert r.intent == intent
    assert not any(t == "classify" for t, _, _ in llm.prompts)


@pytest.mark.parametrize("msg", ["If I earn 40000 what interest rate would Bajaj give?", "what about my score and the fees?",
                                 "Why are fees charged on prepayment?"])
def test_fast_classify_defers_ambiguous_messages_to_the_llm(tmp_path, msg):
    llm = ScriptedLLM(intent="policy")
    ag = agent_for(llm, policy=FakePolicy(), tmp_path=tmp_path, settings=S.AgentSettings(fast_classify="voice"))
    ask(ag, msg, channel="voice")
    assert any(t == "classify" for t, _, _ in llm.prompts)


def test_fast_classify_off_for_text_by_default(tmp_path):
    llm = ScriptedLLM(intent="explain")
    ag = agent_for(llm, tmp_path=tmp_path, settings=S.AgentSettings(fast_classify="voice"))
    ask(ag, "Why was my loan application rejected?")
    assert any(t == "classify" for t, _, _ in llm.prompts)


# ------------------------------------------------------------------ per-turn deadline
class SlowLLM(ScriptedLLM):
    """A busy shared LLM: every call takes `delay` seconds unless the caller's deadline cuts it short."""
    supports_deadline = True

    def __init__(self, delay, **kw):
        super().__init__(**kw)
        self.delay, self.deadlines = delay, []

    def chat(self, system, user, max_tokens=900, temperature=0.0, tag="", deadline=None):
        self.deadlines.append((tag, deadline))
        wait = self.delay if deadline is None else min(self.delay, max(0.0, deadline - time.perf_counter()))
        time.sleep(wait)
        if wait < self.delay:
            self.calls.append({"tag": tag, "ttft_s": None, "total_s": wait, "error": "deadline"})
            raise LLMError("deadline exceeded")
        return super().chat(system, user, max_tokens, temperature, tag)

    def chat_json(self, system, user, max_tokens=900, tag="", deadline=None):
        return json.loads(self.chat(system, user, max_tokens, tag=tag, deadline=deadline))


def test_busy_llm_turn_finishes_inside_the_deadline_with_the_template(tmp_path):
    st = S.AgentSettings(voice_deadline_s=2.0, classify_budget_s=0.5, min_compose_s=0.3, fast_classify="off")
    llm = SlowLLM(delay=30, intent="explain")
    ag = agent_for(llm, tmp_path=tmp_path, settings=st)
    t = time.perf_counter()
    r = ask(ag, "why was I rejected?", channel="voice")
    took = time.perf_counter() - t
    assert took < 2.6, took
    assert r.intent == "explain"  # classify budget hit -> deterministic rules
    assert "fallback_template" in r.guard_flags and "deadline" in r.guard_flags
    assert "REJECTED" in r.answer and "synthetic" in r.answer.lower()
    assert all(d is not None for _, d in llm.deadlines)  # every LLM call carried the deadline


def test_busy_llm_policy_turn_abstains_with_a_busy_template(tmp_path):
    st = S.AgentSettings(voice_deadline_s=1.5, classify_budget_s=0.3, min_compose_s=0.3, fast_classify="voice")
    llm = SlowLLM(delay=30, intent="policy")
    ag = agent_for(llm, policy=FakePolicy(), tmp_path=tmp_path, settings=st)
    t = time.perf_counter()
    r = ask(ag, "How do I raise a complaint with the lender?", channel="voice")
    assert time.perf_counter() - t < 2.1
    assert r.abstained and not r.citations and "deadline" in r.guard_flags
    assert "busy" in r.answer.lower() or "moment" in r.answer.lower()


def test_no_rewrite_when_the_deadline_leaves_too_little_time(tmp_path):
    st = S.AgentSettings(voice_deadline_s=1.0, classify_budget_s=0.2, min_compose_s=5.0, fast_classify="voice")
    llm = ScriptedLLM(intent="explain")
    ag = agent_for(llm, tmp_path=tmp_path, settings=st)
    r = ask(ag, "Why was my loan application rejected?", channel="voice")
    assert not any(t.startswith("compose") for t, _, _ in llm.prompts)  # not enough budget: go straight to the template
    assert "fallback_template" in r.guard_flags and "deadline" in r.guard_flags


def test_text_turns_use_the_longer_text_deadline(tmp_path):
    st = S.AgentSettings(voice_deadline_s=1.0, text_deadline_s=60.0, min_compose_s=0.5)
    llm = SlowLLM(delay=0.05, intent="explain")
    ag = agent_for(llm, tmp_path=tmp_path, settings=st)
    r = ask(ag, "why was I rejected?")
    assert "deadline" not in r.guard_flags and "fallback_template" not in r.guard_flags


# ------------------------------------------------------------------ ChatLLM: streaming + deadline
class _FakeResp:
    def __init__(self, lines, delay=0.0, status=200):
        self.lines, self.delay, self.status_code, self.text = lines, delay, status, ""

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False

    def iter_lines(self, decode_unicode=True):
        for ln in self.lines:
            time.sleep(self.delay)
            yield ln


def _sse(*contents):
    out = [f"data: {json.dumps({'choices': [{'delta': {'reasoning': 'think'}}]})}"]
    out += [f"data: {json.dumps({'choices': [{'delta': {'content': c}}]})}" for c in contents]
    out += [f"data: {json.dumps({'choices': [], 'usage': {'prompt_tokens': 5, 'completion_tokens': 3}})}", "data: [DONE]"]
    return out


def test_chat_stream_yields_content_deltas_and_logs_the_call(monkeypatch):
    from loan_advisory.agent import llm as L
    seen = {}

    def fake_post(url, json=None, stream=None, timeout=None):
        seen["timeout"] = timeout
        return _FakeResp(_sse("Hello", " there.", " Bye."))
    monkeypatch.setattr(L.requests, "post", fake_post)
    c = L.ChatLLM(base="http://x/v1")
    assert "".join(c.chat_stream("s", "u", tag="compose_explain")) == "Hello there. Bye."
    assert c.calls[-1]["tag"] == "compose_explain" and c.calls[-1]["completion_tokens"] == 3


def test_chat_respects_the_deadline_and_does_not_retry_past_it(monkeypatch):
    from loan_advisory.agent import llm as L
    n = {"posts": 0, "timeouts": []}

    def fake_post(url, json=None, stream=None, timeout=None):
        n["posts"] += 1
        n["timeouts"].append(timeout)
        return _FakeResp(_sse(*["tok "] * 50), delay=0.05)  # ~2.6 s of streaming
    monkeypatch.setattr(L.requests, "post", fake_post)
    c = L.ChatLLM(base="http://x/v1", timeout=120)
    t = time.perf_counter()
    with pytest.raises(LLMError):
        c.chat("s", "u", tag="compose_explain", deadline=time.perf_counter() + 0.5)
    assert time.perf_counter() - t < 1.2
    assert n["posts"] == 1
    read_timeout = n["timeouts"][0][1] if isinstance(n["timeouts"][0], tuple) else n["timeouts"][0]
    assert read_timeout <= 0.6


# ------------------------------------------------------------------ server: NDJSON stream endpoint
def test_stream_endpoint_sends_sentences_then_the_final_response(tmp_path):
    import urllib.request
    from http.server import ThreadingHTTPServer

    from loan_advisory.agent import server as srv
    llm = ScriptedLLM(intent="explain", compose="Your recorded decision is REJECTED. Your credit score is 690.")
    ag = agent_for(llm, tmp_path=tmp_path)
    store_refs = {"APP-TEST-005": {"name": "APP-TEST-005", "applicant": "CUS-TEST-005"}}
    app = srv.App(ag, store_refs.get, demo=[{"external_ref": "APP-TEST-005", "label": "x", "literacy": "medium"}])
    httpd = ThreadingHTTPServer(("127.0.0.1", 0), srv.make_handler(app))
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{httpd.server_address[1]}"
    try:
        tok = json.loads(urllib.request.urlopen(urllib.request.Request(base + "/api/session", data=b'{"external_ref": "APP-TEST-005"}',
                                                                       headers={"Content-Type": "application/json"})).read())["token"]
        req = urllib.request.Request(base + "/api/chat/stream", data=json.dumps({"message": "why?", "channel": "voice"}).encode(),
                                     headers={"Content-Type": "application/json", "Authorization": f"Bearer {tok}"})
        with urllib.request.urlopen(req, timeout=30) as r:
            assert r.headers["Content-Type"].startswith("application/x-ndjson")
            events = [json.loads(l) for l in r.read().decode().splitlines() if l.strip()]
    finally:
        httpd.shutdown()
    kinds = [e["type"] for e in events]
    assert kinds[:2] == ["sentence", "sentence"] and kinds[-1] == "final"
    assert events[0]["text"] == "Your recorded decision is REJECTED."
    assert events[-1]["response"]["intent"] == "explain"


# ------------------------------------------------------------------ voice worker helpers (no livekit needed)
def test_voice_settings_from_env(monkeypatch):
    monkeypatch.setenv("VOICE_HTTP_TIMEOUT_S", "40")
    monkeypatch.setenv("VOICE_FILLER_AFTER_S", "3.5")
    v = S.VoiceSettings.from_env()
    assert v.http_timeout_s == 40 and v.filler_after_s == 3.5
    assert v.http_timeout_s > S.AgentSettings.from_env().voice_deadline_s  # the graph's deadline fires first
    assert set(v.filler) >= {"en", "hi", "te"} and set(v.unreachable) >= {"en", "hi", "te"}


def _events(spec):
    """spec: list of (delay_s, event) -> async iterator of events."""
    import asyncio

    async def gen():
        for d, ev in spec:
            await asyncio.sleep(d)
            yield ev
    return gen()


def test_speakable_yields_sentences_and_reports_the_final_response():
    import asyncio

    from loan_advisory.agent.streaming import speakable
    finals = []
    spec = [(0.01, {"type": "sentence", "text": "One."}), (0.01, {"type": "sentence", "text": "Two."}),
            (0.01, {"type": "final", "response": {"answer": "One. Two."}})]

    async def run():
        return [t async for t in speakable(_events(spec), filler_after_s=5, filler_text="One moment.", on_final=finals.append)]
    assert asyncio.run(run()) == ["One.", "Two."]
    assert finals == [{"answer": "One. Two."}]


def test_speakable_says_one_moment_once_when_the_graph_is_slow():
    import asyncio

    from loan_advisory.agent.streaming import speakable
    spec = [(0.35, {"type": "sentence", "text": "Late answer."}), (0.0, {"type": "final", "response": {"answer": "Late answer."}})]

    async def run():
        return [t async for t in speakable(_events(spec), filler_after_s=0.1, filler_text="One moment, please.", on_final=lambda r: None)]
    assert asyncio.run(run()) == ["One moment, please.", "Late answer."]


def test_speakable_falls_back_when_the_stream_breaks_or_ends_without_a_sentence():
    import asyncio

    from loan_advisory.agent.streaming import speakable

    async def broken():
        yield {"type": "sentence", "text": "First."}
        raise ConnectionError("reset")

    async def run(src):
        return [t async for t in speakable(src, filler_after_s=5, filler_text="x", on_final=lambda r: None, failure_text="Sorry.")]
    assert asyncio.run(run(broken())) == ["First.", "Sorry."]
    assert asyncio.run(run(_events([(0.0, {"type": "final", "response": {"answer": "Whole answer."}})]))) == ["Whole answer."]


def test_rules_fallback_sends_an_unmatched_question_to_policy_not_other(tmp_path):
    """When the busy LLM classifier misses its budget, an unrecognised QUESTION goes to the policy path (which cites
    or abstains) instead of the generic 'other' reply."""
    st = S.AgentSettings(voice_deadline_s=30, classify_budget_s=0.2, min_compose_s=0.1, fast_classify="off")
    llm = SlowLLM(delay=0.6, intent="other", policy={"abstain": True, "citations": [], "answer": "Not in the sources."})
    ag = agent_for(llm, policy=FakePolicy(), tmp_path=tmp_path, settings=st)
    r = ask(ag, "Can a co-applicant's income be added to my application?", channel="voice")
    assert r.intent == "policy"
    llm2 = SlowLLM(delay=0.6, intent="other")
    ag2 = agent_for(llm2, policy=FakePolicy(), tmp_path=tmp_path, settings=st)
    assert ask(ag2, "ok cool", channel="voice").intent in ("greeting", "other")
