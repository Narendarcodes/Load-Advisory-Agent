"""Applicant chat server — Python standard library only (no FastAPI, per the handoff).

    PYTHONPATH=.:apps/api/src python -m loan_advisory.agent.server --port 8095 [--offline] [--no-rag]

Endpoints (JSON):
  GET  /                      chat UI (apps/web/chat/index.html)
  GET  /healthz
  GET  /api/demo-accounts     synthetic demo applicants (no real people)
  POST /api/session           {external_ref} -> {token, ...}   (DEMO sign-in: synthetic accounts only)
  GET  /api/decision          Authorization: Bearer <token> -> decision card of the signed-in application
  POST /api/chat              {message, literacy, locale, channel, conversation_id} -> AgentResponse
  POST /api/chat/stream       same body -> application/x-ndjson: {"type":"sentence","text":...} for every answer
                              sentence as soon as it has passed the guards, then {"type":"final","response":AgentResponse}
  POST /api/bureau/run        {scenario?} -> typed bureau evaluation result for the SIGNED-IN application
                              (session required; scenario is a synthetic-provider test switch). The bureau origin
                              defaults to http://127.0.0.1:8001; use --bureau-url / BUREAU_BASE_URL (loopback only)
                              when the self-hosted LLM already listens there.
  POST /api/livekit-token     {room, identity} -> LiveKit JWT (voice demo; only when LIVEKIT_* env is set)

The session token is an HMAC over (applicant_ref, application_ref, expiry) issued by the server. The
applicant and application are taken from the token, never from the chat body. In production the demo
sign-in must be replaced by real authentication (OTP / lender SSO) — not implemented here.
"""
import argparse
import base64
import hashlib
import hmac
import json
import os
import secrets
import sys
import threading
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from decision_engine.paths import repo_root
from loan_advisory.agent.contracts import AgentRequest, Session
from loan_advisory.agent.facts import decision_card
from loan_advisory.agent.tools import NotAuthorized
from loan_advisory.application.bureau_intake import BureauInputError, run_bureau_evaluation
from loan_advisory.infrastructure.bureau_client import BureauClient
from loan_advisory.infrastructure.frappe_adapter import FrappeUnavailable, UnknownApplication

WEB = repo_root() / "apps" / "web" / "chat"
SECRET = os.environ.get("AGENT_SESSION_SECRET", "").encode() or secrets.token_bytes(32)
DEMO = [  # external refs seeded by infra/frappe/bootstrap/seed.sh (synthetic)
    {"external_ref": "SYN-APP-00000", "label": "Persona 00000 · salaried govt · 3 failed checks", "literacy": "low"},
    {"external_ref": "APP-TEST-005", "label": "Fixture 005 · FOIR + score + tenure", "literacy": "medium"},
    {"external_ref": "APP-TEST-002", "label": "Fixture 002 · FOIR only", "literacy": "medium"},
    {"external_ref": "APP-TEST-003", "label": "Fixture 003 · credit score only", "literacy": "high"},
    {"external_ref": "APP-TEST-004", "label": "Fixture 004 · job tenure only", "literacy": "medium"},
    {"external_ref": "SYN-APP-02408", "label": "Persona 02408 · credit score missing", "literacy": "medium"},
    {"external_ref": "APP-TEST-001", "label": "Fixture 001 · approved", "literacy": "high"},
]


def sign(payload: dict) -> str:
    raw = base64.urlsafe_b64encode(json.dumps(payload, sort_keys=True).encode()).decode()
    sig = hmac.new(SECRET, raw.encode(), hashlib.sha256).hexdigest()
    return f"{raw}.{sig}"


def verify(token: str) -> dict | None:
    try:
        raw, sig = token.rsplit(".", 1)
    except ValueError:
        return None
    if not hmac.compare_digest(sig, hmac.new(SECRET, raw.encode(), hashlib.sha256).hexdigest()):
        return None
    p = json.loads(base64.urlsafe_b64decode(raw))
    return p if p.get("exp", 0) > time.time() else None


class App:
    def __init__(self, agent, resolve, demo=None, bureau_client=None):
        self.agent, self.resolve, self.demo = agent, resolve, demo or DEMO
        self.bureau_client = bureau_client
        self.lock = threading.Lock()

    def session(self, body):
        ref = str(body.get("external_ref") or "")
        if ref not in {d["external_ref"] for d in self.demo}:
            return 403, {"error": "demo sign-in is limited to the synthetic demo accounts"}
        row = self.resolve(ref)
        if not row:
            return 404, {"error": "application not found"}
        tok = sign({"applicant_ref": row["applicant"], "application_ref": row["name"], "external_ref": ref,
                    "exp": time.time() + 4 * 3600})
        return 200, {"token": tok, "application_ref": row["name"], "external_ref": ref}

    def decision(self, claims):
        rec = self.agent.tools.get_decision_evidence(claims["application_ref"], Session(applicant_ref=claims["applicant_ref"]))
        return 200, {"decision_card": decision_card(rec) if rec else None,
                     "summary": self.agent.tools.get_application_summary(claims["application_ref"], Session(applicant_ref=claims["applicant_ref"]))}

    def _request(self, claims, body):
        return AgentRequest(request_id=str(body.get("request_id") or uuid.uuid4()),
                           conversation_id=str(body.get("conversation_id") or claims["application_ref"]),
                           message=str(body.get("message") or "")[:4000] or "hello",
                           channel=body.get("channel") if body.get("channel") in ("text", "voice") else "text",
                           locale=body.get("locale") if body.get("locale") in ("en", "hi", "te") else "en",
                           literacy=body.get("literacy") if body.get("literacy") in ("low", "medium", "high") else "medium",
                           application_ref=claims["application_ref"])

    def chat(self, claims, body, headers=None, on_sentence=None):
        req = self._request(claims, body)
        from loan_advisory.agent import observability as obs
        resp = self.agent.run(req, Session(applicant_ref=claims["applicant_ref"]),
                              trace_context=obs.extract_context(headers) if headers is not None else None,
                              **({"on_sentence": on_sentence} if on_sentence is not None else {}))
        return 200, resp.model_dump()

    def bureau_run(self, claims, body):
        """Evaluate the signed-in application through the synthetic bureau gate.

        The application ref comes only from the session token; the body may carry a
        synthetic-provider scenario for tests/demos. Authorization is the same check
        the evidence tools use, so an applicant can never run someone else's file.
        """
        ref = claims["application_ref"]
        try:
            self.agent.tools.authorize(ref, Session(applicant_ref=claims["applicant_ref"]))
        except NotAuthorized:
            return 403, {"error": "application does not belong to this applicant"}
        except UnknownApplication:
            return 404, {"error": "application not found"}
        except FrappeUnavailable:
            return 503, {"error": "system of record unavailable"}
        scenario = body.get("scenario")
        try:
            res = run_bureau_evaluation(
                ref, store=self.agent.tools.store, sink=self.agent.tools.evidence.sink,
                bureau_client=self.bureau_client, scenario=str(scenario) if scenario else None)
        except BureauInputError as e:
            return 400, {"error": str(e)}
        except UnknownApplication:
            return 404, {"error": "application not found"}
        except FrappeUnavailable:
            return 503, {"error": "system of record unavailable"}
        return res.status, {"result": res.to_dict()}


def make_handler(app: App):
    class H(BaseHTTPRequestHandler):
        server_version = "loan-advisory/0.1"

        def log_message(self, fmt, *a):
            sys.stderr.write("%s %s\n" % (self.address_string(), fmt % a))

        def _send(self, code, obj, ctype="application/json"):
            data = obj if isinstance(obj, (bytes, bytearray)) else json.dumps(obj, ensure_ascii=False, default=str).encode()
            self.send_response(code)
            self.send_header("Content-Type", ctype + ("; charset=utf-8" if "json" in ctype or "html" in ctype or "javascript" in ctype else ""))
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            self.wfile.write(data)

        def _claims(self):
            auth = self.headers.get("Authorization", "")
            return verify(auth[7:]) if auth.startswith("Bearer ") else None

        def _body(self):
            n = int(self.headers.get("Content-Length") or 0)
            if n > 64_000:
                return None
            try:
                return json.loads(self.rfile.read(n) or b"{}")
            except ValueError:
                return None

        def do_GET(self):
            path = self.path.split("?")[0]
            if path in ("/", "/index.html"):
                return self._send(200, (WEB / "index.html").read_bytes(), "text/html")
            if path == "/voice":
                p = WEB / "voice.html"
                return self._send(200, p.read_bytes(), "text/html") if p.exists() else self._send(404, {"error": "no voice page"})
            if path.startswith("/static/"):
                p = (WEB / path[len("/static/"):]).resolve()
                if WEB.resolve() in p.parents and p.exists():
                    ct = "application/javascript" if p.suffix == ".js" else "text/css" if p.suffix == ".css" else "application/octet-stream"
                    return self._send(200, p.read_bytes(), ct)
                return self._send(404, {"error": "not found"})
            if path == "/healthz":
                return self._send(200, {"ok": True})
            if path == "/favicon.ico":
                return self._send(204, b"", "image/x-icon")
            if path == "/api/demo-accounts":
                return self._send(200, {"accounts": app.demo, "note": "synthetic demo accounts; no real people"})
            if path == "/api/decision":
                c = self._claims()
                return self._send(*app.decision(c)) if c else self._send(401, {"error": "sign in first"})
            return self._send(404, {"error": "not found"})

        def _stream_chat(self, claims, body):
            """NDJSON over a close-delimited HTTP/1.0 body: one line per guarded sentence, then the final response."""
            lock = threading.Lock()
            self.send_response(200)
            self.send_header("Content-Type", "application/x-ndjson; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Connection", "close")
            self.end_headers()
            self.close_connection = True

            def line(obj):
                with lock:
                    try:
                        self.wfile.write((json.dumps(obj, ensure_ascii=False, default=str) + "\n").encode())
                        self.wfile.flush()
                    except OSError:
                        pass  # client went away; the turn still completes and is audited
            try:
                _, resp = app.chat(claims, body, self.headers, on_sentence=lambda t: line({"type": "sentence", "text": t}))
                line({"type": "final", "response": resp})
            except Exception as e:
                sys.stderr.write(f"error {type(e).__name__}: {e}\n")
                line({"type": "error", "error": "internal error"})

        def do_POST(self):
            path = self.path.split("?")[0]
            body = self._body()
            if body is None:
                return self._send(400, {"error": "bad JSON body"})
            try:
                if path == "/api/session":
                    return self._send(*app.session(body))
                c = self._claims()
                if not c:
                    return self._send(401, {"error": "sign in first"})
                if path == "/api/chat":
                    return self._send(*app.chat(c, body, self.headers))
                if path == "/api/chat/stream":
                    return self._stream_chat(c, body)
                if path == "/api/bureau/run":
                    return self._send(*app.bureau_run(c, body))
                if path == "/api/livekit-token":
                    return self._send(*livekit_token(c, body))
            except Exception as e:  # never leak a stack trace to the client
                sys.stderr.write(f"error {type(e).__name__}: {e}\n")
                return self._send(500, {"error": "internal error"})
            return self._send(404, {"error": "not found"})

    return H


def livekit_token(claims, body):
    key, sec, url = (os.environ.get(k) for k in ("LIVEKIT_API_KEY", "LIVEKIT_API_SECRET", "LIVEKIT_URL"))
    if not (key and sec and url):
        return 503, {"error": "voice not configured"}
    from livekit import api  # optional dependency (voice phase)
    room = f"loan-{hashlib.sha256(claims['application_ref'].encode()).hexdigest()[:10]}-{uuid.uuid4().hex[:6]}"
    meta = json.dumps({"session_token": sign({k: claims[k] for k in ("applicant_ref", "application_ref", "external_ref")} | {"exp": time.time() + 3600}),
                       "literacy": body.get("literacy", "medium"), "locale": body.get("locale", "en")})
    tok = (api.AccessToken(key, sec).with_identity(f"applicant-{uuid.uuid4().hex[:8]}").with_name("Applicant")
           .with_metadata(meta).with_grants(api.VideoGrants(room_join=True, room=room)).to_jwt())
    return 200, {"token": tok, "url": url, "room": room}


def parse_args(argv=None, env=None):
    env = os.environ if env is None else env
    ap = argparse.ArgumentParser()
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=8095)
    ap.add_argument("--offline", action="store_true", help="MockStore + in-memory evidence instead of live Frappe")
    ap.add_argument("--no-rag", action="store_true", help="do not load the GPU retriever (policy questions abstain)")
    ap.add_argument("--bureau-url", default=env.get("BUREAU_BASE_URL") or None,
                    help="loopback origin of the synthetic bureau (default http://127.0.0.1:8001; env BUREAU_BASE_URL). "
                         "Set it when the self-hosted LLM already uses :8001.")
    return ap.parse_args(argv)


def bureau_client_from(args) -> BureauClient | None:
    """None keeps App's default BureauClient(); a configured origin goes through the client's loopback guard."""
    return BureauClient(base_url=args.bureau_url) if args.bureau_url else None


def main(argv=None):
    a = parse_args(argv)
    bureau_client = bureau_client_from(a)  # fail fast on a non-loopback origin, before loading anything
    policy, profile = (None, None)
    if not a.no_rag:
        from loan_advisory.agent.runtime import load_policy_tools
        t = time.time(); policy, profile = load_policy_tools(); print(f"retriever loaded in {time.time() - t:.1f}s", file=sys.stderr)
    if a.offline:
        from loan_advisory.agent.runtime import build_offline_agent
        agent, store, _ = build_offline_agent(policy_tools=policy, profile=profile)
        demo = [{"external_ref": k, "label": k, "literacy": "medium"} for k in store._apps]
        resolve = lambda ref: {"name": ref, "applicant": store.get(ref)["applicant"]} if ref in store._apps else None
        app = App(agent, resolve, demo, bureau_client=bureau_client)
    else:
        from loan_advisory.agent.runtime import build_live_agent, frappe_resolve
        agent, client = build_live_agent(policy_tools=policy, profile=profile)
        app = App(agent, lambda ref: frappe_resolve(client, ref), bureau_client=bureau_client)
    srv = ThreadingHTTPServer((a.host, a.port), make_handler(app))
    print(f"loan-advisory chat on http://{a.host}:{a.port}", file=sys.stderr, flush=True)
    srv.serve_forever()


if __name__ == "__main__":
    main()
