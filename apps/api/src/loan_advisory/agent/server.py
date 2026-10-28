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
from typing import get_args

from decision_engine.paths import repo_root
from loan_advisory.agent.contracts import LOCALES, AgentRequest, Literacy, Session
from loan_advisory.agent.facts import decision_card
from loan_advisory.agent.tools import NotAuthorized
from loan_advisory.application.bureau_intake import BureauInputError, run_bureau_evaluation
from loan_advisory.infrastructure.bureau_client import BureauClient
from loan_advisory.infrastructure.frappe_adapter import FrappeUnavailable, UnknownApplication

WEB = repo_root() / "apps" / "web" / "chat"
DEMO = [  # external refs seeded by infra/frappe/bootstrap/seed.sh (synthetic)
    {"external_ref": "SYN-APP-00000", "label": "Persona 00000 · salaried govt · 3 failed checks", "literacy": "low"},
    {"external_ref": "APP-TEST-005", "label": "Fixture 005 · FOIR + score + tenure", "literacy": "medium"},
    {"external_ref": "APP-TEST-002", "label": "Fixture 002 · FOIR only", "literacy": "medium"},
    {"external_ref": "APP-TEST-003", "label": "Fixture 003 · credit score only", "literacy": "high"},
    {"external_ref": "APP-TEST-004", "label": "Fixture 004 · job tenure only", "literacy": "medium"},
    {"external_ref": "SYN-APP-02408", "label": "Persona 02408 · credit score missing", "literacy": "medium"},
    {"external_ref": "APP-TEST-001", "label": "Fixture 001 · approved", "literacy": "high"},
]


ISSUER = "loan-advisory"
AUDIENCE = "loan-advisory-chat"
LITERACIES = get_args(Literacy)   # canonical set from the request contract, never a second copy
TOKEN_SKEW_S = 60
_SECRET: bytes | None = None  # resolved once by configure_secret(); None means "not configured yet"
AUTH_ERRORS = {"missing": "sign in first", "expired": "session expired; sign in again",
               "malformed": "malformed session token", "invalid": "invalid session token"}


def configure_secret(dev_ephemeral: bool = False, env=None, stream=None) -> str:
    """Resolve the HMAC key once at startup. Fails closed: no secret, no service."""
    global _SECRET
    env = os.environ if env is None else env
    raw = (env.get("AGENT_SESSION_SECRET") or "").strip()
    if raw:
        _SECRET = raw.encode()
        return "env"
    if dev_ephemeral:
        _SECRET = secrets.token_bytes(32)
        (stream or sys.stderr).write(
            "WARNING: --dev-ephemeral-secret: AGENT_SESSION_SECRET is unset, so session tokens are signed with a "
            "random in-memory key. They stop working on restart, and this mode must never be used in production.\n")
        return "dev-ephemeral"
    raise SystemExit(
        "AGENT_SESSION_SECRET is not set. Provide a long random value (for example `openssl rand -hex 32`) in the "
        "environment, or pass --dev-ephemeral-secret for local development only.")


def _key() -> bytes:
    global _SECRET
    if _SECRET is None:
        raw = (os.environ.get("AGENT_SESSION_SECRET") or "").strip()
        if not raw:  # never a random fallback: an unconfigured server must not sign
            raise RuntimeError("AGENT_SESSION_SECRET is not configured; call configure_secret() at startup")
        _SECRET = raw.encode()
    return _SECRET


def sign(payload: dict) -> str:
    claims = {"iss": ISSUER, "aud": AUDIENCE, "iat": int(time.time()), **payload}
    raw = base64.urlsafe_b64encode(json.dumps(claims, sort_keys=True).encode()).decode()
    sig = hmac.new(_key(), raw.encode(), hashlib.sha256).hexdigest()
    return f"{raw}.{sig}"


def verify_token(token: str) -> tuple[dict | None, str]:
    """(claims, "ok") or (None, reason) with reason in AUTH_ERRORS, so the HTTP layer can say *why* it refused."""
    try:
        raw, sig = token.rsplit(".", 1)
        sig = sig.encode("ascii")  # a real digest is ASCII hex; other text is malformed, not a wrong digest
        payload = json.loads(base64.urlsafe_b64decode(raw))
    except ValueError:  # bad base64 (binascii.Error), non-ASCII signature (UnicodeEncodeError), bad UTF-8 or JSON
        return None, "missing" if not token else "malformed"
    if not isinstance(payload, dict):
        return None, "malformed"
    if not hmac.compare_digest(sig, hmac.new(_key(), raw.encode(), hashlib.sha256).hexdigest().encode()):
        return None, "invalid"
    if payload.get("iss") != ISSUER or payload.get("aud") != AUDIENCE:
        return None, "invalid"
    now, iat, exp = time.time(), payload.get("iat"), payload.get("exp")
    if not isinstance(iat, (int, float)) or not isinstance(exp, (int, float)) or iat > now + TOKEN_SKEW_S:
        return None, "invalid"  # unsigned/legacy claim set, or a token minted in the future
    if exp <= now:
        return None, "expired"
    return payload, "ok"


def verify(token: str) -> dict | None:
    return verify_token(token)[0]


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
                           locale=body.get("locale") if body.get("locale") in LOCALES else "en",
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
            claims, reason = verify_token(auth[7:] if auth.startswith("Bearer ") else "")
            return claims, (None if claims else AUTH_ERRORS.get(reason, "sign in first"))

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
                c, err = self._claims()
                return self._send(*app.decision(c)) if c else self._send(401, {"error": err})
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
                c, err = self._claims()
                if not c:
                    return self._send(401, {"error": err})
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
    if not isinstance(body, dict):
        return 400, {"error": "body must be a JSON object"}
    literacy, locale = body.get("literacy", "medium"), body.get("locale", "en")
    if literacy not in LITERACIES:
        return 400, {"error": f"unsupported literacy; expected one of {list(LITERACIES)}"}
    if locale not in LOCALES:
        return 400, {"error": f"unsupported locale; expected one of {list(LOCALES)}"}
    key, sec, url = (os.environ.get(k) for k in ("LIVEKIT_API_KEY", "LIVEKIT_API_SECRET", "LIVEKIT_URL"))
    if not (key and sec and url):
        return 503, {"error": "voice not configured"}
    from livekit import api  # optional dependency (voice phase)
    room = f"loan-{hashlib.sha256(claims['application_ref'].encode()).hexdigest()[:10]}-{uuid.uuid4().hex[:6]}"
    meta = json.dumps({"session_token": sign({k: claims[k] for k in ("applicant_ref", "application_ref", "external_ref")} | {"exp": time.time() + 3600}),
                       "literacy": literacy, "locale": locale})
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
    ap.add_argument("--dev-ephemeral-secret", action="store_true",
                    help="local development only: when AGENT_SESSION_SECRET is unset, sign sessions with a random "
                         "in-memory key (tokens stop working on restart; never use in production)")
    ap.add_argument("--bureau-url", default=env.get("BUREAU_BASE_URL") or None,
                    help="loopback origin of the synthetic bureau (default http://127.0.0.1:8001; env BUREAU_BASE_URL). "
                         "Set it when the self-hosted LLM already uses :8001.")
    ap.add_argument("--max-inflight", type=_positive_int, default=8,
                    help="concurrent requests the server admits; extra requests get 503 + Retry-After (default 8)")
    return ap.parse_args(argv)


def bureau_client_from(args) -> BureauClient | None:
    """None keeps App's default BureauClient(); a configured origin goes through the client's loopback guard."""
    return BureauClient(base_url=args.bureau_url) if args.bureau_url else None


class Admission:
    """Bounded number of requests in flight; a request beyond the cap is refused, not queued."""

    def __init__(self, limit: int):
        if limit < 1:
            raise ValueError("max_inflight must be at least 1")
        self.limit = limit
        self._lock = threading.Lock()
        self._in_flight = 0

    @property
    def in_flight(self) -> int:
        with self._lock:
            return self._in_flight

    def acquire(self) -> "AdmissionSlot | None":
        with self._lock:
            if self._in_flight >= self.limit:
                return None
            self._in_flight += 1
        return AdmissionSlot(self)

    def _release(self) -> None:
        with self._lock:
            self._in_flight -= 1


class AdmissionSlot:
    """One admitted request. release() is idempotent: failure paths and shutdown both run it."""

    def __init__(self, admission: Admission):
        self._admission = admission
        self._lock = threading.Lock()
        self._released = False

    def release(self) -> bool:
        with self._lock:
            if self._released:
                return False
            self._released = True
        self._admission._release()
        return True


class BoundedServer(ThreadingHTTPServer):
    """Thread-per-request server with a hard in-flight cap: extra requests get an immediate 503, not another thread."""

    daemon_threads = True

    def __init__(self, addr, handler, max_inflight=8, refusal_lane=16):
        super().__init__(addr, handler)
        self.admission = Admission(max_inflight)
        self._refusals = threading.BoundedSemaphore(refusal_lane)

    def process_request(self, request, client_address):
        slot = self.admission.acquire()
        if slot is not None:
            try:
                self._start_worker(request, client_address, slot)
            except BaseException:  # start() failed: socketserver closes the socket, so only free the slot here
                slot.release()
                raise
            return
        if not self._refusals.acquire(blocking=False):
            return self.shutdown_request(request)  # refusal lane saturated too: shed the connection, never queue
        try:
            threading.Thread(target=self._refuse_overloaded, args=(request,), daemon=True).start()
        except BaseException:
            self._refusals.release()
            self.shutdown_request(request)
            raise

    def _start_worker(self, request, client_address, slot):
        threading.Thread(target=self._serve, args=(request, client_address, slot), daemon=True).start()

    def _serve(self, request, client_address, slot):
        try:
            try:
                self.finish_request(request, client_address)
            except Exception:
                self.handle_error(request, client_address)
            finally:
                self.shutdown_request(request)
        finally:
            slot.release()  # once, after the socket is closed, and also when handle_error itself fails

    def _refuse_overloaded(self, request):
        body = b'{"error": "server busy; retry shortly"}'
        head = (b"HTTP/1.1 503 Service Unavailable\r\nContent-Type: application/json; charset=utf-8\r\n"
                b"Retry-After: 1\r\nContent-Length: " + str(len(body)).encode() + b"\r\nConnection: close\r\n\r\n")
        try:
            # Drain the request before replying: closing on unread data resets the 503 (seen on Windows). Bounded by
            # time and bytes so a huge body cannot pin a refusal thread.
            # shortcut: a body over 1 MiB is not fully drained, so its 503 may reset; raise the cap if clients grow
            drained, deadline = 0, time.monotonic() + 0.5
            while drained < 1 << 20:
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    break
                request.settimeout(remaining)
                try:
                    chunk = request.recv(65536)
                except OSError:  # timeout: the request stopped arriving, so stop waiting for more of it
                    break
                if not chunk:
                    break
                drained += len(chunk)
            request.settimeout(0.5)
            request.sendall(head + body)
        except OSError:
            pass  # client already gone
        finally:
            self._refusals.release()
            self.shutdown_request(request)


def _positive_int(text) -> int:
    n = int(text)
    if n < 1:
        raise argparse.ArgumentTypeError("must be at least 1")
    return n


def main(argv=None):
    a = parse_args(argv)
    configure_secret(a.dev_ephemeral_secret)  # fail closed before loading a model or opening a port
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
    srv = BoundedServer((a.host, a.port), make_handler(app), max_inflight=a.max_inflight)
    print(f"loan-advisory chat on http://{a.host}:{a.port}", file=sys.stderr, flush=True)
    srv.serve_forever()


if __name__ == "__main__":
    main()
