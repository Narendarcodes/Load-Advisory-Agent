"""Busy-LLM simulator for deadline tests: an OpenAI-compatible pass-through proxy that holds every request for
--delay seconds before forwarding it to the real vLLM (stdlib only). Point LLM_BASE at it.

    python scripts/agent/slow_llm_proxy.py --port 8011 --upstream http://127.0.0.1:8001 --delay 40
"""
import argparse
import time
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8011)
    ap.add_argument("--upstream", default="http://127.0.0.1:8001")
    ap.add_argument("--delay", type=float, default=40.0)
    a = ap.parse_args()

    class H(BaseHTTPRequestHandler):
        protocol_version = "HTTP/1.0"

        def do_POST(self):
            body = self.rfile.read(int(self.headers.get("Content-Length") or 0))
            time.sleep(a.delay)  # queued behind other tenants
            req = urllib.request.Request(a.upstream + self.path, data=body, headers={"Content-Type": "application/json"})
            try:
                with urllib.request.urlopen(req, timeout=300) as r:
                    self.send_response(r.status)
                    self.send_header("Content-Type", r.headers.get("Content-Type", "application/json"))
                    self.end_headers()
                    for chunk in iter(lambda: r.read(1024), b""):
                        self.wfile.write(chunk)
                        self.wfile.flush()
            except (BrokenPipeError, ConnectionResetError):
                pass

    ThreadingHTTPServer(("127.0.0.1", a.port), H).serve_forever()


if __name__ == "__main__":
    main()
