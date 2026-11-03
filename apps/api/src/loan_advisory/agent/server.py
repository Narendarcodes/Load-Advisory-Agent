"""The advisory service: one graph, two machine transports, no browser surface.

    PYTHONPATH=.:apps/api/src python -m loan_advisory.agent.server --port 8095 [--offline] [--no-rag]

`create_app(service)` (loan_advisory.api.app) is the HTTP surface; this module builds the service
(offline fixtures or the live Frappe-backed agent) and serves it with uvicorn.

Identity, application, literacy and locale always come from the verified Frappe assertion
(`api/assertion.py`); the request body carries the question only. FastAPI is reached by the CopilotKit
runtime and the voice worker, both of which present an assertion, never a browser credential.
"""
import argparse
import os
import sys
import threading
import time
import uuid
from typing import get_args

from loan_advisory.agent.contracts import LOCALES, AgentRequest, Literacy, Session

LITERACIES = get_args(Literacy)   # canonical set from the request contract, never a second copy
MIN_SECRET_LENGTH = 32


class BadRequest(Exception):
    """A well-formed JSON body with a wrong shape or field type; answered with 400, never 500."""


def _require_strings(body, keys):
    for key in keys:
        if key in body and not isinstance(body[key], str):
            raise BadRequest(f"{key} must be a string")


class App:
    def __init__(self, agent, resolve):
        self.agent, self.resolve = agent, resolve

    def _request(self, claims, body):
        _require_strings(body, ("request_id", "conversation_id", "message"))
        literacy = claims.get("literacy")
        locale = claims.get("locale")
        return AgentRequest(request_id=body.get("request_id") or str(uuid.uuid4()),
                           conversation_id=body.get("conversation_id") or claims.get("thread") or claims["application_ref"],
                           message=(body.get("message") or "")[:4000] or "hello",
                           channel=body.get("channel") if body.get("channel") in ("text", "voice") else "text",
                           locale=locale if locale in LOCALES else "en",
                           literacy=literacy if literacy in LITERACIES else "medium",
                           application_ref=claims["application_ref"])

    def chat(self, claims, body, headers=None, on_sentence=None):
        req = self._request(claims, body)
        from loan_advisory.agent import observability as obs
        resp = self.agent.run(req, Session(applicant_ref=claims["applicant_ref"]),
                              trace_context=obs.extract_context(headers) if headers is not None else None,
                              **({"on_sentence": on_sentence} if on_sentence is not None else {}))
        return 200, resp.model_dump()


def parse_args(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=8095)
    ap.add_argument("--offline", action="store_true", help="MockStore + in-memory evidence instead of live Frappe")
    ap.add_argument("--no-rag", action="store_true", help="do not load the GPU retriever (policy questions abstain)")
    ap.add_argument("--max-inflight", type=_positive_int, default=8,
                    help="concurrent requests the server admits; extra requests get 503 + Retry-After (default 8)")
    return ap.parse_args(argv)


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


def _positive_int(text) -> int:
    n = int(text)
    if n < 1:
        raise argparse.ArgumentTypeError("must be at least 1")
    return n


def _require_secret() -> None:
    """Fail closed before opening a port: without a verifier secret every run would 503 anyway."""
    if len((os.environ.get("AGENT_ASSERTION_SECRET") or "").strip()) < MIN_SECRET_LENGTH:
        raise SystemExit(
            "AGENT_ASSERTION_SECRET is not set (or shorter than 32 characters). It must match the Frappe site's "
            "agent_assertion_secret; the agent cannot verify an assertion without it.")


def main(argv=None):
    a = parse_args(argv)
    _require_secret()
    policy, profile = (None, None)
    if not a.no_rag:
        from loan_advisory.agent.runtime import load_policy_tools
        t = time.time(); policy, profile = load_policy_tools(); print(f"retriever loaded in {time.time() - t:.1f}s", file=sys.stderr)
    if a.offline:
        from loan_advisory.agent.runtime import build_offline_agent
        agent, store, _ = build_offline_agent(policy_tools=policy, profile=profile)
        resolve = lambda ref: {"name": ref, "applicant": store.get(ref)["applicant"]} if ref in store._apps else None
        service = App(agent, resolve)
    else:
        from loan_advisory.agent.runtime import build_live_agent, frappe_resolve
        agent, client = build_live_agent(policy_tools=policy, profile=profile)
        service = App(agent, lambda ref: frappe_resolve(client, ref))

    import uvicorn
    from loan_advisory.api.app import create_app

    print(f"loan-advisory agent on http://{a.host}:{a.port}", file=sys.stderr, flush=True)
    uvicorn.run(create_app(service, max_inflight=a.max_inflight), host=a.host, port=a.port, log_level="warning")


if __name__ == "__main__":
    main()
