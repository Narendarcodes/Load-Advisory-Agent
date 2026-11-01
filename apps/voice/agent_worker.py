"""LiveKit Agents voice worker that drives the SAME LangGraph advisory graph as the text chat.

    LIVEKIT_URL=ws://127.0.0.1:7880 LIVEKIT_API_KEY=... LIVEKIT_API_SECRET=... \
    AGENT_HTTP=http://127.0.0.1:8095 STT_HTTP=http://127.0.0.1:8791 TTS_HTTP=http://127.0.0.1:8793 \
        python agent_worker.py start

Pipeline (self-hosted, no cloud services):
  browser mic -> LiveKit (self-hosted server) -> Silero VAD -> STT sidecar (Hyperion asr-http: IndicConformer for
  te/hi, Whisper large-v3-turbo for en) -> llm_node = POST /api/chat on the advisory server (LangGraph graph:
  authorization, ZEN evidence, what-if, policy RAG, guards) -> svara-tts-v1 streaming sidecar -> LiveKit -> browser.

Authorization: Frappe mints the LiveKit token and writes the `Voice Session` row before the browser joins, so
the row is the authorisation. Participant metadata carries `{session_id, user, customer, application}` and no
credential; for every turn the worker presents that session id (with the room and identity it is serving) to
Frappe's `voice_assertion` method and forwards the fresh 60-second assertion as `Authorization: Bearer`. Voice
therefore uses exactly the same authorization path as text, and the worker holds no borrower cookie. The worker
never sees or chooses an application on its own.

Every turn writes one JSON line (VOICE_TURN_LOG) with: end-of-user-speech -> STT done -> graph answer (and the
graph's LLM TTFT) -> first TTS audio -> agent speaking. It keeps timings, locale, STT engine, audio duration,
filler and the session id only, never the transcript. The same answer card (decision, citations) is published on
the data channel (topic "advisor") for the page to render.
"""
import asyncio
import json
import os
import re
import time
from pathlib import Path

import sys

import aiohttp
from livekit import rtc
from livekit.agents import (DEFAULT_API_CONNECT_OPTIONS, Agent, AgentSession, APIConnectOptions, JobContext,
                            JobProcess, WorkerOptions, cli, llm, stt, tts, utils)
from livekit.agents.types import NOT_GIVEN, NotGivenOr
from livekit.plugins import silero

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "api", "src"))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from loan_advisory.agent import observability as obs  # noqa: E402  (OTel -> Phoenix; no-op unless AGENT_TRACING=1)
from loan_advisory.agent.settings import VoiceSettings  # noqa: E402
from loan_advisory.agent.streaming import speakable  # noqa: E402
from loan_advisory.agent.voice_log import turn_row  # noqa: E402
from loan_advisory.state_paths import append_private  # noqa: E402  (P0c private creation)
from voice_assertion_exchange import Assertions  # noqa: E402  (Frappe exchange; no LiveKit imports)

CFG = VoiceSettings.from_env()
AGENT_HTTP, STT_HTTP, TTS_HTTP, TURN_LOG = CFG.agent_http, CFG.stt_http, CFG.tts_http, CFG.turn_log
SESSION_ID = re.compile(r"^[0-9a-f]{32}$")
GREETING = {
    "en": "Hello. I can explain your loan decision, suggest what to work on, or answer policy questions. What would you like to know?",
    "hi": "नमस्ते। मैं आपके लोन फ़ैसले के कारण समझा सकता हूँ, सुधार के उपाय बता सकता हूँ, या नीति के सवालों का जवाब दे सकता हूँ। आप क्या जानना चाहेंगे?",
    "te": "నమస్కారం. మీ లోన్ నిర్ణయానికి కారణాలు వివరించగలను, ఏమి మెరుగుపరచాలో చెప్పగలను, లేదా నియమాల ప్రశ్నలకు జవాబివ్వగలను. మీరు ఏమి తెలుసుకోవాలనుకుంటున్నారు?",
}


class Turn:
    """Timestamps of the current turn (perf_counter seconds)."""

    def __init__(self):
        self.reset()

    def reset(self):
        sp = getattr(self, "span", None)
        if sp is not None:  # turn abandoned (e.g. barge-in) — close its span
            sp.set_attribute("voice.abandoned", True); sp.end()
        self.t = {}
        self.info = {}
        self.span = None

    @staticmethod
    def epoch_ns(t_perf):
        return time.time_ns() - int((time.perf_counter() - t_perf) * 1e9)

    def start_span(self):
        """voice.turn span, back-dated to end of user speech, with an explicit voice.stt child."""
        tr = obs.tracer()
        if tr is None or self.span is not None or "user_stopped" not in self.t:
            return None
        from opentelemetry import trace
        self.span = tr.start_span("voice.turn", start_time=self.epoch_ns(self.t["user_stopped"]),
                                  attributes={"openinference.span.kind": "CHAIN", "voice.locale": self.info.get("locale", "")})
        ctx = trace.set_span_in_context(self.span)
        if "stt_done" in self.t:
            st = tr.start_span("voice.stt", context=ctx, start_time=self.epoch_ns(self.t["user_stopped"]),
                               attributes={"openinference.span.kind": "TOOL", "stt.engine": str(self.info.get("stt_engine")),
                                           "stt.latency_ms": self.info.get("stt_ms") or 0, "stt.user_audio_s": self.info.get("user_audio_s") or 0})
            st.end(end_time=self.epoch_ns(self.t["stt_done"]))
        return ctx

    def mark(self, k):
        self.t.setdefault(k, time.perf_counter())

    def flush(self):
        t = self.t
        if "user_stopped" not in t or "graph_done" not in t:
            self.reset(); return
        row = turn_row(self.info, t, time.time())
        if self.span is not None:
            self.span.set_attributes({f"voice.{k}": v for k, v in row.items() if isinstance(v, (int, float, str)) and k != "transcript"})
            if "tts_first_audio" in t:
                self.span.add_event("tts_first_audio", timestamp=self.epoch_ns(t["tts_first_audio"]))
            self.span.end(end_time=self.epoch_ns(t.get("agent_speaking", time.perf_counter())))
            self.span = None
        with append_private(Path(TURN_LOG)) as f:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
        self.reset()


class SidecarSTT(stt.STT):
    """Non-streaming STT over the Hyperion asr-http sidecar; the session wraps it with Silero VAD."""

    def __init__(self, language: str, turn: Turn):
        super().__init__(capabilities=stt.STTCapabilities(streaming=False, interim_results=False))
        self.language, self.turn = language, turn
        self._http: aiohttp.ClientSession | None = None

    @property
    def model(self) -> str:
        return "indicconformer-600m" if self.language in ("te", "hi") else "whisper-large-v3-turbo"

    @property
    def provider(self) -> str:
        return "hyperion-asr-http"

    async def _recognize_impl(self, buffer, *, language: NotGivenOr[str] = NOT_GIVEN,
                              conn_options: APIConnectOptions = DEFAULT_API_CONNECT_OPTIONS) -> stt.SpeechEvent:
        import base64
        self.turn.mark("user_stopped")  # VAD end-of-speech handed the buffer to us
        frame = rtc.combine_audio_frames(buffer)
        wav = frame.to_wav_bytes()
        self._http = self._http or aiohttp.ClientSession()
        t0 = time.perf_counter()
        async with self._http.post(f"{STT_HTTP}/v1/transcribe", json={"language": self.language, "audio_b64": base64.b64encode(wav).decode(),
                                                                       "normalize": "none"}, timeout=aiohttp.ClientTimeout(total=30)) as r:
            j = await r.json()
        self.turn.mark("stt_done")
        self.turn.info.update(stt_ms=round((time.perf_counter() - t0) * 1000, 1), stt_engine=j.get("engine"),
                              user_audio_s=round(frame.duration, 2))
        return stt.SpeechEvent(type=stt.SpeechEventType.FINAL_TRANSCRIPT,
                               alternatives=[stt.SpeechData(language=self.language, text=j.get("text", ""))])


class SvaraTTS(tts.TTS):
    def __init__(self, language: str, turn: Turn, gender: str = CFG.tts_gender):
        super().__init__(capabilities=tts.TTSCapabilities(streaming=False), sample_rate=24000, num_channels=1)
        self.language, self.turn, self.gender = language, turn, gender
        self._http: aiohttp.ClientSession | None = None

    @property
    def model(self) -> str:
        return "kenpath/svara-tts-v1"

    @property
    def provider(self) -> str:
        return "self-hosted-vllm"

    def synthesize(self, text: str, *, conn_options: APIConnectOptions = DEFAULT_API_CONNECT_OPTIONS) -> tts.ChunkedStream:
        return _SvaraStream(tts=self, input_text=text, conn_options=conn_options)


class _SvaraStream(tts.ChunkedStream):
    async def _run(self, output_emitter: tts.AudioEmitter) -> None:
        t: SvaraTTS = self._tts  # type: ignore[assignment]
        t._http = t._http or aiohttp.ClientSession()
        output_emitter.initialize(request_id=utils.shortuuid(), sample_rate=24000, num_channels=1, mime_type="audio/pcm")
        t0 = time.perf_counter()
        first = True
        async with t._http.post(f"{TTS_HTTP}/v1/tts", json={"text": self.input_text, "language": t.language, "gender": t.gender},
                                timeout=aiohttp.ClientTimeout(total=90)) as r:
            async for chunk in r.content.iter_chunked(4800):
                if first:
                    t.turn.mark("tts_first_audio")
                    t.turn.info.setdefault("tts_ttfa_ms", round((time.perf_counter() - t0) * 1000, 1))
                    first = False
                output_emitter.push(chunk)
        output_emitter.flush()


class GraphLLM(llm.LLM):
    """Placeholder so AgentSession runs the pipeline; generation happens in AdvisorAgent.llm_node (the graph)."""

    @property
    def model(self) -> str:
        return "langgraph-advisor(gpt-oss-120b)"

    def chat(self, **kw):
        raise RuntimeError("generation is handled by the advisory graph in llm_node")


class AdvisorAgent(Agent):
    def __init__(self, auth: Assertions, locale: str, room: rtc.Room, turn: Turn):
        super().__init__(instructions="Loan advisory assistant (replies come from the LangGraph advisory graph).")
        self.auth, self.locale, self.room, self.turn = auth, locale, room, turn
        self.conv = f"voice-{auth.session_id}"
        self._http: aiohttp.ClientSession | None = None

    async def llm_node(self, chat_ctx: llm.ChatContext, tools, model_settings):
        msg = ""
        for item in reversed(chat_ctx.items):
            if getattr(item, "role", None) == "user":
                msg = item.text_content or ""
                break
        self.turn.mark("graph_start")
        self.turn.info["locale"] = self.locale
        self.turn.info["session_id"] = self.auth.session_id
        ctx = self.turn.start_span()
        self._http = self._http or aiohttp.ClientSession()
        # The body carries the question only: identity, application and language come from the
        # assertion, so a tampered worker cannot change whose file is explained.
        body = {"message": msg or "hello", "channel": "voice", "conversation_id": self.conv}
        final: dict = {}

        async def events():
            """One fresh assertion, then NDJSON events from the advisory server (sentence streaming)."""
            assertion = await self.auth.fresh()
            self.locale = assertion.get("locale") or self.locale
            headers = {"Authorization": f"Bearer {assertion['assertion']}"}
            if ctx is not None:  # W3C traceparent -> the server's advisor.turn becomes a child of this voice.turn
                from opentelemetry.propagate import inject
                inject(headers, context=ctx)
            path = "/api/chat/stream" if CFG.stream else "/api/chat"
            async with self._http.post(f"{AGENT_HTTP}{path}", headers=headers, json=body,
                                       timeout=aiohttp.ClientTimeout(total=CFG.http_timeout_s)) as r:
                if not CFG.stream:
                    yield {"type": "final", "response": await r.json()}
                    return
                async for raw in r.content:
                    line = raw.decode("utf-8", "replace").strip()
                    if line:
                        yield json.loads(line)

        def on_final(resp):
            final.update(resp)

        n = 0
        async for text in speakable(events(), CFG.filler_after_s, CFG.filler.get(self.locale, CFG.filler["en"]), on_final,
                                    failure_text=CFG.unreachable.get(self.locale, CFG.unreachable["en"])):
            n += 1
            if text == CFG.filler.get(self.locale):
                self.turn.info["filler"] = True
            else:
                self.turn.mark("first_sentence")
            yield text
        self.turn.mark("graph_done")
        resp = final or {"answer": "", "intent": "other", "error": "no final response"}
        self._report(resp, msg, n)

    def _report(self, resp, msg, n_chunks):
        timings = resp.get("timings") or {}
        calls = timings.get("llm_calls") or []
        comp = [c for c in calls if str(c.get("tag", "")).startswith("compose")]
        self.turn.info.update(intent=resp.get("intent"), action=resp.get("action"), locale=self.locale,
                              graph_total_ms=timings.get("total_ms"), graph_first_sentence_ms=timings.get("first_sentence_ms"),
                              spoken_chunks=n_chunks,
                              llm_ttft_ms=round(comp[-1]["ttft_s"] * 1000, 1) if comp and comp[-1].get("ttft_s") else None,
                              classify_ms=round(calls[0]["total_s"] * 1000, 1) if calls and calls[0].get("tag") == "classify" else None,
                              guard_flags=resp.get("guard_flags"), answer_chars=len(resp.get("answer", "")))
        task = asyncio.ensure_future(self.room.local_participant.publish_data(json.dumps(
            {k: resp.get(k) for k in ("answer", "intent", "action", "abstained", "citations", "decision_card", "improvement_plan",
                                      "what_if", "handoff_ref")} | {"transcript": msg}, ensure_ascii=False).encode(), topic="advisor"))
        task.add_done_callback(lambda t: t.exception())  # best effort; never break the turn

    async def tts_node(self, text, model_settings):
        """Every chunk from llm_node is already a complete, guarded sentence: synthesize each one as soon as it
        arrives (no extra sentence buffering by the default tokenizer)."""
        tts_engine = self.session.tts
        async for sentence in text:
            if not sentence.strip():
                continue
            async with tts_engine.synthesize(sentence) as stream:
                async for ev in stream:
                    yield ev.frame


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load(min_silence_duration=CFG.vad_min_silence_s)


async def entrypoint(ctx: JobContext):
    await ctx.connect()
    participant = await ctx.wait_for_participant()
    meta = json.loads(participant.metadata or "{}")
    session_id = meta.get("session_id")
    if not isinstance(session_id, str) or not SESSION_ID.match(session_id):
        # No session row means no authorisation: refuse the room instead of greeting a stranger.
        raise RuntimeError("voice session metadata is missing; leaving the room")
    http = aiohttp.ClientSession()
    auth = Assertions(http, session_id, ctx.room.name, participant.identity,
                      frappe_url=CFG.frappe_url, api_key=CFG.frappe_api_key,
                      api_secret=CFG.frappe_api_secret, timeout_s=CFG.http_timeout_s)
    first = await auth.fresh()  # fail fast: an unverified session never hears a greeting
    locale = first.get("locale") if first.get("locale") in ("en", "hi", "te") else "en"
    turn = Turn()
    session = AgentSession(vad=ctx.proc.userdata["vad"], stt=SidecarSTT(locale, turn), tts=SvaraTTS(locale, turn), llm=GraphLLM(),
                           min_endpointing_delay=CFG.min_endpointing_s)

    @session.on("user_state_changed")
    def _u(ev):
        if getattr(ev, "new_state", None) == "speaking":
            turn.reset()
        elif getattr(ev, "new_state", None) == "listening":
            turn.mark("user_stopped")

    @session.on("agent_state_changed")
    def _a(ev):
        if getattr(ev, "new_state", None) == "speaking":
            turn.mark("agent_speaking")
            turn.flush()

    agent = AdvisorAgent(auth, locale, ctx.room, turn)
    await session.start(agent=agent, room=ctx.room)
    await session.say(GREETING[locale], allow_interruptions=True)
    await asyncio.sleep(0)


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm, port=int(os.environ.get("VOICE_WORKER_PORT", "8081"))))
