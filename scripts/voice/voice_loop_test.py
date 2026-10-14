"""Automated voice-loop test: synthesized applicant utterances -> LiveKit -> voice worker -> graph -> TTS -> back.

Runs a headless LiveKit participant (livekit rtc SDK) that behaves like the browser: it signs in through the
advisory server, gets a LiveKit token, publishes a microphone track fed from synthesized speech (svara-TTS, MALE
voice, so it differs from the assistant's female voice) and listens to the assistant's audio track.

Measured per turn (client clock): end of the applicant's utterance -> first non-silent assistant audio frame
(= end-to-end response latency the user hears). The worker's turn log adds the breakdown (STT, graph incl. LLM TTFT,
TTS first audio). Correctness: STT transcript vs. the scripted text (CER), routed intent vs. expected, non-empty answer.

    python scripts/voice/voice_loop_test.py --out /root/hx/loan/voice/loop_v1
"""
import argparse
import asyncio
import json
import os
import re
import time
import unicodedata
import urllib.request

import numpy as np
from livekit import rtc

AGENT = os.environ.get("AGENT_HTTP", "http://127.0.0.1:8095")
TTS = os.environ.get("TTS_HTTP", "http://127.0.0.1:8793")
SCRIPT = {
    "en": [("Why was my loan application rejected?", "explain"),
           ("What can I do to improve before I reapply?", "improve"),
           ("What if my credit score was 720?", "what_if"),
           ("How do I raise a complaint with the lender?", "policy"),
           ("Will I definitely get the loan if I reapply next month?", "boundary")],
    "hi": [("मेरा लोन आवेदन क्यों रिजेक्ट हुआ?", "explain"),
           ("दोबारा आवेदन करने से पहले मैं क्या सुधार कर सकता हूँ?", "improve"),
           ("लेंडर से शिकायत कैसे करूँ?", "policy")],
    "te": [("నా లోన్ దరఖాస్తు ఎందుకు తిరస్కరించారు?", "explain"),
           ("మళ్ళీ దరఖాస్తు చేసే ముందు నేను ఏమి మెరుగుపరచాలి?", "improve"),
           ("లెండర్‌కు ఫిర్యాదు ఎలా చేయాలి?", "policy")],
}
SR = 24000


def post(path, body, tok=None, base=AGENT):
    req = urllib.request.Request(base + path, data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json", **({"Authorization": f"Bearer {tok}"} if tok else {})})
    return urllib.request.urlopen(req, timeout=120).read()


def synth(text, lang):
    pcm = post("/v1/tts", {"text": text, "language": lang, "gender": "Male"}, base=TTS)
    return np.frombuffer(pcm, dtype=np.int16)


def cer(ref, hyp):
    n = lambda s: re.sub(r"[^\w]", "", unicodedata.normalize("NFC", s.lower()))
    a, b = n(ref), n(hyp)
    d = list(range(len(b) + 1))
    for i in range(1, len(a) + 1):
        p = d[:]; d[0] = i
        for j in range(1, len(b) + 1):
            d[j] = min(p[j] + 1, d[j - 1] + 1, p[j - 1] + (a[i - 1] != b[j - 1]))
    return round(d[len(b)] / max(1, len(a)), 3)


async def run_session(lang, external_ref, literacy, out_rows):
    tok = json.loads(post("/api/session", {"external_ref": external_ref}))["token"]
    lk = json.loads(post("/api/livekit-token", {"literacy": literacy, "locale": lang}, tok))
    room = rtc.Room()
    agent_audio = []          # (t, rms) for every received frame
    answers = []
    loop = asyncio.get_running_loop()

    async def consume(track):
        async for ev in rtc.AudioStream(track, sample_rate=SR, num_channels=1):
            a = np.frombuffer(ev.frame.data, dtype=np.int16).astype(np.float32)
            agent_audio.append((time.perf_counter(), float(np.sqrt(np.mean(a * a))) if a.size else 0.0))

    @room.on("track_subscribed")
    def _ts(track, pub, participant):
        if track.kind == rtc.TrackKind.KIND_AUDIO:
            loop.create_task(consume(track))

    @room.on("data_received")
    def _dr(pkt):
        if pkt.topic == "advisor":
            answers.append((time.perf_counter(), json.loads(pkt.data.decode())))

    await room.connect(lk["url"], lk["token"])
    src = rtc.AudioSource(SR, 1)
    track = rtc.LocalAudioTrack.create_audio_track("mic", src)
    await room.local_participant.publish_track(track, rtc.TrackPublishOptions(source=rtc.TrackSource.SOURCE_MICROPHONE))
    frame_n = SR // 100  # 10 ms

    async def push(samples):
        for i in range(0, len(samples), frame_n):
            chunk = samples[i:i + frame_n]
            if len(chunk) < frame_n:
                chunk = np.pad(chunk, (0, frame_n - len(chunk)))
            await src.capture_frame(rtc.AudioFrame(chunk.astype(np.int16).tobytes(), SR, 1, frame_n))

    async def silence(seconds):
        await push(np.zeros(int(SR * seconds), dtype=np.int16))

    def speaking_since(t0, thr=300.0):
        return next((t for t, r in agent_audio if t > t0 and r > thr), None)

    async def wait_quiet(t_from, quiet=1.5, timeout=90):
        """Feed silence until the assistant has spoken and then been quiet for `quiet` seconds."""
        start = time.perf_counter()
        while time.perf_counter() - start < timeout:
            await silence(0.25)
            loud = [t for t, r in agent_audio if t > t_from and r > 300.0]
            if loud and time.perf_counter() - loud[-1] > quiet:
                return True
        return False

    t_join = time.perf_counter()
    await wait_quiet(t_join, quiet=1.5, timeout=60)  # greeting
    for text, expect in SCRIPT[lang]:
        audio = synth(text, lang)
        n_ans = len(answers)
        await push(audio)
        t_end = time.perf_counter()
        await silence(0.1)
        # wait for THIS turn's answer card (data channel), then for its speech to finish, before the next utterance
        t_wait = time.perf_counter()
        while len(answers) <= n_ans and time.perf_counter() - t_wait < 150:
            await silence(0.25)
        ok = len(answers) > n_ans and await wait_quiet(answers[n_ans][0] if len(answers) > n_ans else t_end, quiet=2.5, timeout=150)
        t_first = speaking_since(t_end)
        ans = answers[n_ans][1] if len(answers) > n_ans else {}
        row = {"lang": lang, "external_ref": external_ref, "text": text, "expected_intent": expect,
               "utterance_s": round(len(audio) / SR, 2), "e2e_first_audio_ms": round((t_first - t_end) * 1000, 1) if t_first else None,
               "transcript": ans.get("transcript"), "stt_cer": cer(text, ans.get("transcript") or "") if ans else None,
               "intent": ans.get("intent"), "intent_ok": ans.get("intent") == expect, "answer": (ans.get("answer") or "")[:400],
               "answered": bool(ans.get("answer")), "completed": ok}
        out_rows.append(row)
        print(json.dumps({k: row[k] for k in ("lang", "e2e_first_audio_ms", "stt_cer", "intent", "intent_ok")}, ensure_ascii=False), flush=True)
    await room.disconnect()


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--ref", default="SYN-APP-00000")
    ap.add_argument("--langs", default="en,hi,te")
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    rows = []
    for lang, lit in [(l, "medium" if l == "en" else "low") for l in a.langs.split(",")]:
        try:
            await run_session(lang, a.ref, lit, rows)
        except Exception as e:
            rows.append({"lang": lang, "error": f"{type(e).__name__}: {e}"[:300]})
            print("session error", lang, e, flush=True)
    with open(os.path.join(a.out, "loop_rows.jsonl"), "w") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    ok = [r for r in rows if r.get("e2e_first_audio_ms") is not None]
    e2e = sorted(r["e2e_first_audio_ms"] for r in ok)
    summ = {"turns": len(rows), "with_audio_reply": len(ok), "intent_ok": sum(r.get("intent_ok", False) for r in rows),
            "e2e_first_audio_ms_p50": e2e[len(e2e) // 2] if e2e else None, "e2e_first_audio_ms_max": e2e[-1] if e2e else None,
            "stt_cer_mean_by_lang": {l: round(float(np.mean([r["stt_cer"] for r in rows if r.get("lang") == l and r.get("stt_cer") is not None])), 3)
                                     for l in SCRIPT if any(r.get("lang") == l and r.get("stt_cer") is not None for r in rows)}}
    json.dump(summ, open(os.path.join(a.out, "loop_summary.json"), "w"), indent=1, ensure_ascii=False)
    print(json.dumps(summ, indent=1, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main())
