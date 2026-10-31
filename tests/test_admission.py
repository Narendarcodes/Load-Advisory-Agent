"""P0b: bounded admission, controlled overload, and one-release-per-request slots.

The ASGI middleware admits at most `max_inflight` requests; the next one gets an immediate 503 +
`Retry-After` instead of queueing. A slot is held for the whole response and released on success,
on an exception downstream and on client disconnects (the `finally` in the middleware).
"""
import asyncio
import json
import threading

import pytest
from fastapi.testclient import TestClient

from loan_advisory.agent import server as srv
from loan_advisory.api.admission import AdmissionMiddleware
from loan_advisory.api.app import create_app
from tests.test_agent_api import SECRET, auth, mint


@pytest.fixture(autouse=True)
def _secret(monkeypatch):
    monkeypatch.setenv("AGENT_ASSERTION_SECRET", SECRET)


class BlockingService:
    def __init__(self):
        self.entered = threading.Event()
        self.gate = threading.Event()

    def chat(self, claims, body, headers=None, on_sentence=None):
        self.entered.set()
        self.gate.wait(10)
        return 200, {"answer": "ok"}


def test_capacity_limit_refuses_extra_requests_with_503_and_recovers():
    service = BlockingService()
    app = create_app(service, max_inflight=1)
    first, second = TestClient(app), TestClient(app)
    first.get("/healthz")   # builds the middleware stack once, so both clients share one admission
    results = {}

    def call():
        results["first"] = first.post("/api/chat", json={"message": "why?"}, headers=auth(mint()))

    worker = threading.Thread(target=call)
    try:
        worker.start()
        assert service.entered.wait(5)   # the only slot is held
        refused = second.post("/api/chat", json={"message": "why?"}, headers=auth(mint()))
        assert refused.status_code == 503
        assert refused.headers["retry-after"] == "1"
        assert refused.headers["cache-control"] == "no-store"
        assert json.loads(refused.content) == {"error": "server busy; retry shortly"}

        service.gate.set()
        worker.join(10)
        assert results["first"].status_code == 200
        assert second.post("/api/chat", json={"message": "why?"}, headers=auth(mint())).status_code == 200
    finally:
        service.gate.set()
        worker.join(10)


def test_slot_release_is_idempotent():
    admission = srv.Admission(1)
    slot = admission.acquire()
    assert admission.in_flight == 1
    assert admission.acquire() is None
    assert slot.release() is True
    assert slot.release() is False
    assert admission.in_flight == 0


def test_a_failing_downstream_still_releases_the_slot():
    async def boom(scope, receive, send):
        raise RuntimeError("handler failed")

    middleware = AdmissionMiddleware(boom, limit=1)
    with pytest.raises(RuntimeError, match="handler failed"):
        asyncio.run(middleware({"type": "http", "method": "GET", "path": "/", "headers": []}, None, None))
    assert middleware.admission.in_flight == 0


def test_non_http_scopes_bypass_admission():
    seen = []

    async def app(scope, receive, send):
        seen.append(scope["type"])

    middleware = AdmissionMiddleware(app, limit=1)
    asyncio.run(middleware({"type": "lifespan"}, None, None))
    assert seen == ["lifespan"] and middleware.admission.in_flight == 0


def test_refusal_does_not_take_a_slot_while_busy():
    """A refused request must neither queue nor consume capacity: two refusals still leave the one slot held."""
    async def hold(scope, receive, send):
        await send({"type": "http.response.start", "status": 200, "headers": []})
        await send({"type": "http.response.body", "body": b"ok"})

    middleware = AdmissionMiddleware(hold, limit=1)
    slot = middleware.admission.acquire()
    assert slot is not None

    async def refuse_twice():
        for _ in range(2):
            messages = []

            async def send(message):
                messages.append(message)

            await middleware({"type": "http"}, None, send)
            assert messages[0]["status"] == 503
        return middleware.admission.in_flight

    try:
        assert asyncio.run(refuse_twice()) == 1
    finally:
        slot.release()
    assert middleware.admission.in_flight == 0
