"""Saral Laya router service: a small CPU HTTP service around the Laya multilingual checkpoint.

    POST /route   {"text": str, "lang": "en|hi|te|...", "context": str?}
               -> {"intent", "probs", "confidence", "flags": {name: prob}, "latency_ms", "model", "questions_version"}
    GET  /health  -> {"ok": true, "model": ..., "questions_version": ...}

Binds 127.0.0.1 only. Laya never touches loan decisions; it only proposes a route the agent may use.
Env: LAYA_PORT (8097), LAYA_THREADS (2), LAYA_MODEL_PATH (local fine-tuned checkpoint dir; default: the published
multilingual checkpoint), LAYA_FLAGS (1; 0 skips the flag questions and saves ~0.4 s), LAYA_FLAG_STYLE (noul|choice),
LAYA_ALLOW_RAW (0; 1 enables POST /v1/raw for offline question-design experiments), LAYA_HEAD_MAX_LEN (optional).
The intent and the flags are two forward passes: Laya pads every question in one call to the longest question, so one
13-option choice batched with four yes/no questions costs about five times a single pass on CPU.
"""
import json
import os
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

try:
    from .laya_questions import QUESTIONS_VERSION, build_state, flag_questions, intent_question
except ImportError:  # run as a plain script next to laya_questions.py
    from laya_questions import QUESTIONS_VERSION, build_state, flag_questions, intent_question

MODEL_ID, SUBFOLDER = "convaiinnovations/laya", "multilingual"
_lock = threading.Lock()
_agent = None
_model_name = f"{MODEL_ID}/{SUBFOLDER}"


def _load():
    global _agent, _model_name
    os.environ.setdefault("USE_TF", "0")
    import torch
    torch.set_num_threads(int(os.environ.get("LAYA_THREADS", "2")))
    import laya
    path = os.environ.get("LAYA_MODEL_PATH")
    if path:
        _agent = laya.load(path, device="cpu")
        _model_name = "local:" + os.path.basename(path.rstrip("/"))
    else:
        _agent = laya.load(MODEL_ID, subfolder=SUBFOLDER, device="cpu")


def _predict(state, qs, lang=None):
    kw = {}
    if os.environ.get("LAYA_HEAD_MAX_LEN"):
        kw["head_max_len"] = int(os.environ["LAYA_HEAD_MAX_LEN"])
    with _lock:  # one forward pass at a time on CPU; keeps memory flat
        t0 = time.perf_counter()
        out = _agent.predict(state, qs, lang=lang, **kw)
        return out, (time.perf_counter() - t0) * 1000


def route(text, lang=None, context="", flag_style=None):
    # The intent is asked on the latest message alone: on the dev benchmark, adding the assistant's previous reply to
    # the state made the published checkpoint worse (it latched onto words in the reply). `context` is accepted for
    # forward compatibility and ignored for now.
    state = build_state(text, "")
    out, ms = _predict(state, intent_question(), lang)
    it = out["answers"]["intent"]
    flags = {}
    if os.environ.get("LAYA_FLAGS", "1") != "0":
        style = flag_style or os.environ.get("LAYA_FLAG_STYLE", "noul")
        fout, fms = _predict(state, flag_questions(style), lang)
        ms += fms
        for k, v in fout["answers"].items():
            flags[k[5:]] = round(v["noul"] if v.get("type") == "noul" else v["probabilities"]["A"], 4)
    return {"intent": it["choice"], "probs": it["probabilities"], "confidence": it.get("confidence"),
            "flags": flags, "latency_ms": round(ms, 1), "model": _model_name, "questions_version": QUESTIONS_VERSION}


class H(BaseHTTPRequestHandler):
    def _send(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *a):  # no request logging: messages may hold personal details
        pass

    def do_GET(self):
        if self.path == "/health":
            return self._send(200, {"ok": _agent is not None, "model": _model_name,
                                    "questions_version": QUESTIONS_VERSION})
        self._send(404, {"error": "not found"})

    def do_POST(self):
        try:
            n = int(self.headers.get("Content-Length") or 0)
            if n > 64_000:
                return self._send(413, {"error": "too large"})
            body = json.loads(self.rfile.read(n) or b"{}")
            if self.path == "/route":
                text = body.get("text")
                if not isinstance(text, str) or not text.strip():
                    return self._send(422, {"error": "text required"})
                return self._send(200, route(text, body.get("lang"), body.get("context") or "", body.get("flag_style")))
            if self.path == "/v1/raw" and os.environ.get("LAYA_ALLOW_RAW") == "1":
                out, ms = _predict(body["state"], body["questions"], body.get("lang"))
                return self._send(200, {"answers": out["answers"], "latency_ms": round(ms, 1)})
            self._send(404, {"error": "not found"})
        except Exception as exc:  # never leak a traceback with message content
            self._send(500, {"error": type(exc).__name__})


def main():
    _load()
    port = int(os.environ.get("LAYA_PORT", "8097"))
    srv = ThreadingHTTPServer(("127.0.0.1", port), H)
    print(f"laya router on 127.0.0.1:{port} ({QUESTIONS_VERSION})", flush=True)
    srv.serve_forever()


if __name__ == "__main__":
    main()
