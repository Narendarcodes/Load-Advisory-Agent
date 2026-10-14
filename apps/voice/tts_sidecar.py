"""Streaming TTS sidecar: kenpath/svara-tts-v1 (Apache-2.0; Indian English, Hindi, Telugu + 16 more) served by vLLM,
decoded with SNAC 24 kHz. Standard-library HTTP only.

    python tts_sidecar.py --port 8793 --vllm http://127.0.0.1:8792/v1 --model svara

svara is an Orpheus-style LM that emits SNAC audio codes as `<custom_token_N>` tokens (7 per ~85 ms frame). We
stream the completion from vLLM, and every 7 new codes decode the last 4 frames and emit the middle 2048 samples
(the standard Orpheus streaming window), so audio starts after the first ~4 frames instead of the whole utterance.

  GET  /healthz
  POST /v1/tts   {"text", "language": "en|hi|te", "gender": "Female|Male", "style": "<clear>" (optional)}
       -> chunked raw PCM s16le, 24 kHz, mono.  Headers: X-Sample-Rate, X-TTS-Model.
       Timing of the first audio chunk is logged per request (and returned in the X-TTFA trailer log).
"""
import argparse
import json
import re
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import numpy as np
import requests

SR = 24000
LANG = {"en": "English", "hi": "Hindi", "te": "Telugu"}
CUSTOM = re.compile(r"<custom_token_(\d+)>")
START, END_TEXT, START_AUDIO_HDR, EOS = 128259, 128009, 128260, 128258


class Engine:
    def __init__(self, vllm_base, model, tokenizer_id, device):
        import torch
        from snac import SNAC
        from transformers import AutoTokenizer
        self.torch = torch
        self.base, self.model, self.device = vllm_base.rstrip("/"), model, device
        self.tok = AutoTokenizer.from_pretrained(tokenizer_id)
        self.snac = SNAC.from_pretrained("hubertsiuzdak/snac_24khz").to(device).eval()
        self.lock = threading.Lock()  # SNAC decode is cheap; serialise it

    def prompt_ids(self, text, language, gender, style):
        spk = f"{LANG.get(language, 'English')} ({gender})"
        return [START] + self.tok(f"{spk}: {text}{(' ' + style) if style else ''}").input_ids + [END_TEXT, START_AUDIO_HDR]

    def _decode_window(self, codes):
        """codes: 28 ints (4 frames). Returns the middle 2048 samples (int16 bytes)."""
        torch = self.torch
        l0, l1, l2 = [], [], []
        for j in range(4):
            b = 7 * j
            l0.append(codes[b]); l1.append(codes[b + 1]); l2 += [codes[b + 2], codes[b + 3]]
            l1.append(codes[b + 4]); l2 += [codes[b + 5], codes[b + 6]]
        if min(l0 + l1 + l2) < 0 or max(l0 + l1 + l2) > 4095:
            return b""
        with self.lock, torch.inference_mode():
            audio = self.snac.decode([torch.tensor(x, device=self.device).unsqueeze(0) for x in (l0, l1, l2)])
        a = audio[0, 0, 2048:4096].float().cpu().numpy()
        return (np.clip(a, -1, 1) * 32767).astype(np.int16).tobytes()

    def stream(self, text, language="en", gender="Female", style="", max_tokens=1600):
        body = {"model": self.model, "prompt": self.prompt_ids(text, language, gender, style), "max_tokens": max_tokens,
                "temperature": 0.6, "top_p": 0.8, "repetition_penalty": 1.1, "stop_token_ids": [EOS],
                "skip_special_tokens": False, "stream": True}
        codes, n = [], 0
        with requests.post(f"{self.base}/completions", json=body, stream=True, timeout=120) as r:
            r.raise_for_status()
            for line in r.iter_lines(decode_unicode=True):
                if not line or not line.startswith("data:"):
                    continue
                data = line[5:].strip()
                if data == "[DONE]":
                    break
                try:
                    txt = json.loads(data)["choices"][0].get("text", "")
                except (ValueError, KeyError, IndexError):
                    continue
                for m in CUSTOM.finditer(txt):
                    raw = int(m.group(1)) - 10        # token id - 128266
                    if raw < 0:
                        continue  # control tokens (start-of-speech / start-of-audio markers), not audio codes
                    code = raw - ((n % 7) * 4096)     # position within the 7-token frame selects the codebook offset
                    n += 1
                    codes.append(code)
                    if len(codes) % 7 == 0 and len(codes) > 27:
                        pcm = self._decode_window(codes[-28:])
                        if pcm:
                            yield pcm


def make_handler(engine, model_name):
    class H(BaseHTTPRequestHandler):
        protocol_version = "HTTP/1.1"

        def log_message(self, fmt, *a):
            pass

        def do_GET(self):
            if self.path == "/healthz":
                b = json.dumps({"ok": True, "model": model_name, "sample_rate": SR}).encode()
                self.send_response(200); self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
            else:
                self.send_error(404)

        def do_POST(self):
            if self.path != "/v1/tts":
                return self.send_error(404)
            try:
                req = json.loads(self.rfile.read(int(self.headers.get("Content-Length") or 0)) or b"{}")
                text = normalise(str(req.get("text") or ""), req.get("language", "en"))
            except ValueError:
                return self.send_error(400)
            if not text:
                return self.send_error(400)
            t0 = time.perf_counter()
            self.send_response(200)
            self.send_header("Content-Type", "audio/pcm"); self.send_header("X-Sample-Rate", str(SR))
            self.send_header("X-TTS-Model", model_name); self.send_header("Transfer-Encoding", "chunked"); self.end_headers()
            first, total = None, 0
            try:
                for pcm in engine.stream(text, req.get("language", "en"), req.get("gender", "Female"), req.get("style", "")):
                    if first is None:
                        first = time.perf_counter() - t0
                    total += len(pcm)
                    self.wfile.write(f"{len(pcm):X}\r\n".encode() + pcm + b"\r\n")
                self.wfile.write(b"0\r\n\r\n")
            except (BrokenPipeError, ConnectionResetError, requests.RequestException) as e:
                print(f"tts stream aborted: {type(e).__name__}", file=sys.stderr, flush=True)
            dur = total / 2 / SR
            wall = time.perf_counter() - t0
            print(json.dumps({"event": "tts", "lang": req.get("language"), "chars": len(text), "ttfa_s": round(first or -1, 3),
                              "audio_s": round(dur, 2), "wall_s": round(wall, 2), "rtf": round(wall / dur, 3) if dur else None}),
                  file=sys.stderr, flush=True)

    return H


_MD = re.compile(r"[*_`#>|]+")


def normalise(text, language="en"):
    """Make chat text speakable: drop markdown/bullets, expand ₹ and %, spell out FOIR."""
    t = _MD.sub(" ", text)
    t = re.sub(r"^\s*[-•]\s*", "", t, flags=re.M)
    t = re.sub(r"\(P\d+\)|\[P\d+\]", "", t)
    if language == "en":
        t = re.sub(r"₹\s?([\d,]+(?:\.\d+)?)", r"\1 rupees", t)
        t = re.sub(r"(\d)\s?%", r"\1 percent", t)
        t = re.sub(r"\bFOIR\b", "F O I R", t)
        t = t.replace("≥", "at least ").replace("≤", "at most ")
    else:
        t = re.sub(r"₹\s?([\d,]+(?:\.\d+)?)", r"\1 ₹", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t[:1200]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=8793)
    ap.add_argument("--vllm", default="http://127.0.0.1:8792/v1")
    ap.add_argument("--model", default="svara")
    ap.add_argument("--tokenizer", default="kenpath/svara-tts-v1")
    ap.add_argument("--device", default="cuda")
    a = ap.parse_args()
    eng = Engine(a.vllm, a.model, a.tokenizer, a.device)
    list(eng.stream("Hello.", "en"))  # warm-up (SNAC kernels + vLLM)
    srv = ThreadingHTTPServer((a.host, a.port), make_handler(eng, "kenpath/svara-tts-v1"))
    print(f"tts sidecar on {a.host}:{a.port}", file=sys.stderr, flush=True)
    srv.serve_forever()


if __name__ == "__main__":
    main()
