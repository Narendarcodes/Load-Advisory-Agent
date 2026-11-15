"""Saral OCR sidecar.

POST /ocr   body: PNG/JPEG bytes   ->  {"boxes": [[x0,y0,x1,y1]...], "texts": [...], "scores": [...], "device": "gpu:0", "ms": 412}
GET  /health                        ->  {"ok": true, "loaded": false, "device": "gpu:0"}

The model loads on the first /ocr call and is released after OCR_IDLE_SECONDS without one,
so the GPU (and RAM) is free whenever nobody is reading a document.
"""

from __future__ import annotations

import io
import json
import os
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

DET = os.environ.get("PADDLE_OCR_DET_MODEL", "PP-OCRv5_mobile_det")
REC = os.environ.get("PADDLE_OCR_REC_MODEL", "PP-OCRv5_mobile_rec")
IDLE = float(os.environ.get("OCR_IDLE_SECONDS", "300"))
MAX_BYTES = 15 * 1024 * 1024

_lock = threading.Lock()
_engine = None
_last_used = 0.0


def device() -> str:
    wanted = os.environ.get("OCR_DEVICE", "auto")
    if wanted != "auto":
        return wanted
    try:
        import paddle

        if paddle.device.is_compiled_with_cuda() and paddle.device.cuda.device_count() > 0:
            return "gpu:0"
    except Exception:  # noqa: BLE001
        pass
    return "cpu"


def engine():
    global _engine, _last_used
    with _lock:
        if _engine is None:
            from paddleocr import PaddleOCR

            started = time.perf_counter()
            _engine = PaddleOCR(text_detection_model_name=DET, text_recognition_model_name=REC,
                                use_doc_orientation_classify=False, use_doc_unwarping=False,
                                use_textline_orientation=False, device=device())
            print(f"ocr: loaded {DET}/{REC} on {device()} in {time.perf_counter() - started:.1f}s", flush=True)
        _last_used = time.time()
        return _engine


def _reaper():
    global _engine
    while True:
        time.sleep(15)
        with _lock:
            if _engine is not None and time.time() - _last_used > IDLE:
                _engine = None
                try:
                    import gc

                    import paddle

                    gc.collect()
                    if paddle.device.is_compiled_with_cuda():
                        paddle.device.cuda.empty_cache()
                except Exception:  # noqa: BLE001
                    pass
                print("ocr: idle, model released", flush=True)


class Handler(BaseHTTPRequestHandler):
    def _send(self, code: int, body: dict):
        data = json.dumps(body).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):  # noqa: N802
        if self.path == "/health":
            self._send(200, {"ok": True, "loaded": _engine is not None, "device": device(),
                             "models": f"{DET}/{REC}"})
        else:
            self._send(404, {"error": "not found"})

    def do_POST(self):  # noqa: N802
        if self.path != "/ocr":
            return self._send(404, {"error": "not found"})
        size = int(self.headers.get("Content-Length") or 0)
        if not 0 < size <= MAX_BYTES:
            return self._send(413, {"error": "image too large"})
        try:
            import numpy as np
            from PIL import Image

            image = Image.open(io.BytesIO(self.rfile.read(size))).convert("RGB")
            array = np.asarray(image)[:, :, ::-1]  # BGR, as Paddle expects
            started = time.perf_counter()
            results = engine().predict(array)
            page = results[0] if results else {"rec_boxes": [], "rec_texts": [], "rec_scores": []}
            self._send(200, {
                "boxes": [[float(v) for v in box] for box in page["rec_boxes"]],
                "texts": [str(t) for t in page["rec_texts"]],
                "scores": [float(s) for s in page["rec_scores"]],
                "device": device(),
                "ms": round((time.perf_counter() - started) * 1000),
            })
        except Exception as exc:  # noqa: BLE001
            self._send(500, {"error": f"{type(exc).__name__}: {exc}"[:300]})

    def log_message(self, *args):  # quiet: document contents never reach the log
        pass


if __name__ == "__main__":
    threading.Thread(target=_reaper, daemon=True).start()
    print(f"ocr: listening on :8866 (device {device()}, idle release {IDLE:.0f}s)", flush=True)
    ThreadingHTTPServer(("0.0.0.0", 8866), Handler).serve_forever()
