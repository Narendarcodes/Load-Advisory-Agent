"""Identity never comes from headers; provider work is budgeted per borrower (B4).

The agent surface accepts exactly one credential: a verified Frappe assertion. These
tests forge the headers a proxy or browser could add — user, customer, application,
session and site — and prove both that they are inert without an assertion and that
they cannot override the claims inside a valid one. The budget tests use the same
fake shared Redis pattern as the replay suite: two store instances stand in for two
workers, so a per-process allowance cannot hide a shared limit.
"""
import base64
import hashlib
import hmac
import json
import threading
import time

import pytest
from fastapi.testclient import TestClient

from loan_advisory.agent import server as srv
from loan_advisory.agent.runtime import build_offline_agent
from loan_advisory.api import assertion, limits, routes_agent
from loan_advisory.api.app import create_app
from tests.test_agent_api import _input, auth
from tests.test_agent_graph import FakePolicy, ScriptedLLM

SECRET = "guard-test-assertion-secret-0123456789"

FORGED = {
    "X-Forwarded-User": "admin@example.invalid",
    "X-Frappe-Session": "forged-session-id",
    "X-Frappe-Site-Name": "p1loan.local",
    "X-User": "admin@example.invalid",
    "Remote-User": "admin@example.invalid",
    "X-Customer": "CUS-OTHER",
    "X-Application": "APP-TEST-001",
    "X-App-Ref": "APP-TEST-001",
}


def mint(customer="CUS-TEST-005", application="APP-TEST-005", *, sub="borrower@example.invalid", thread=None) -> str:
    now = int(time.time())
    payload = {
        "iss": assertion.ISSUER,
        "aud": assertion.AUDIENCE,
        "sub": sub,
        "customer": customer,
        "application": application,
        "thread": thread,
        "literacy": "medium",
        "locale": "en",
        "iat": now,
        "exp": now + 60,
        "jti": f"jti-{time.time_ns()}-{customer}",
    }
    body = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    signature = hmac.new(SECRET.encode(), body, hashlib.sha256).digest()
    return f"{base64.urlsafe_b64encode(body).rstrip(b'=').decode()}." \
           f"{base64.urlsafe_b64encode(signature).rstrip(b'=').decode()}"


@pytest.fixture(autouse=True)
def _isolated(monkeypatch):
    monkeypatch.setenv("AGENT_ASSERTION_SECRET", SECRET)
    assertion.replay.reset()
    store = limits.MemoryBudgetStore()
    monkeypatch.setattr(limits.budget, "_store", store)
    monkeypatch.setattr(limits.budget, "_signature", None)
    yield
    assertion.replay.reset()


@pytest.fixture(scope="module")
def service():
    agent, store, _ = build_offline_agent(llm=ScriptedLLM(intent="explain"), policy_tools=FakePolicy())
    return srv.App(agent, store.get)


@pytest.fixture
def client(service):
    return TestClient(create_app(service))


def test_forged_identity_headers_without_an_assertion_are_401(client):
    assert client.post("/api/chat", json={"message": "why?"}, headers=FORGED).status_code == 401
    assert client.post("/api/agui", json=_input(), headers=FORGED).status_code == 401
    assert client.post("/api/bureau/run", json={}, headers=FORGED).status_code == 401
    assert client.post("/api/chat/stream", json={"message": "why?"}, headers=FORGED).status_code == 401


def test_forged_headers_cannot_override_verified_claims(client, service, monkeypatch):
    captured = {}
    real_run = service.agent.run

    def run(req, session, *args, **kwargs):
        captured["req"], captured["session"] = req, session
        return real_run(req, session, *args, **kwargs)

    monkeypatch.setattr(service.agent, "run", run)
    headers = {
        **auth(mint(customer="CUS-TEST-005", sub="alice@example.invalid", thread="thread-a")),
        **FORGED,
        "Host": "p1loan.local",
    }
    response = client.post("/api/agui", json=_input(application="APP-TEST-001"), headers=headers)
    assert response.status_code == 200
    # Body props, forged headers and Host all lose to the signed assertion.
    assert captured["req"].application_ref == "APP-TEST-005"
    assert captured["session"].applicant_ref == "CUS-TEST-005"
    assert captured["session"].applicant_ref != FORGED["X-Customer"]


def test_chat_budget_is_per_borrower(client, monkeypatch):
    monkeypatch.setattr(routes_agent, "CHAT_LIMIT", 2)
    body = {"message": "why?"}
    for _ in range(2):
        assert client.post("/api/chat", json=body, headers=auth(mint())).status_code == 200

    blocked = client.post("/api/chat", json=body, headers=auth(mint()))
    assert blocked.status_code == 429
    assert blocked.json() == {"error": "rate limit exceeded"}
    assert int(blocked.headers["retry-after"]) > 0

    # A second borrower has their own allowance.
    assert client.post(
        "/api/chat", json=body, headers=auth(mint(sub="bob@example.invalid"))
    ).status_code == 200


def test_bureau_budget_refuses_before_provider_work(client, monkeypatch):
    monkeypatch.setattr(routes_agent, "BUREAU_LIMIT", 0)
    response = client.post("/api/bureau/run", json={}, headers=auth(mint()))
    assert response.status_code == 429
    assert response.headers["retry-after"]


def test_budget_store_failure_fails_closed(client, monkeypatch):
    monkeypatch.setattr(limits.budget, "_store", limits.UnavailableBudgetStore("down"))
    assert client.post("/api/chat", json={"message": "why?"}, headers=auth(mint())).status_code == 503


def test_memory_budget_is_refused_in_production(monkeypatch):
    monkeypatch.setenv("ASSERTION_REPLAY_BACKEND", "memory")
    monkeypatch.setenv("APP_ENV", "production")
    assert isinstance(limits._store_from_env(), limits.UnavailableBudgetStore)
    monkeypatch.setenv("APP_ENV", "development")
    assert isinstance(limits._store_from_env(), limits.MemoryBudgetStore)


class FakeRedis:
    """Just the commands the budget store uses, shared by every instance."""

    def __init__(self):
        self._lock = threading.Lock()
        self._values: dict[str, int] = {}
        self._ttls: dict[str, int] = {}

    def set(self, name, value, nx=False, ex=None):
        with self._lock:
            if nx and name in self._values:
                return None
            self._values[name] = int(value)
            if ex is not None:
                self._ttls[name] = int(ex)
            return True

    def incr(self, name):
        with self._lock:
            self._values[name] = self._values.get(name, 0) + 1
            return self._values[name]

    def ttl(self, name):
        with self._lock:
            return self._ttls.get(name, -2)

    def expire(self, name, seconds):
        with self._lock:
            self._ttls[name] = int(seconds)
            return True

    def scan_iter(self, match=None):
        with self._lock:
            return [key for key in self._values if not match or key.startswith(match.rstrip("*"))]

    def delete(self, *keys):
        with self._lock:
            for key in keys:
                self._values.pop(key, None)
                self._ttls.pop(key, None)
            return len(keys)


def test_redis_budget_is_shared_across_workers():
    server = FakeRedis()
    worker_a = limits.RedisBudgetStore(client=server)
    worker_b = limits.RedisBudgetStore(client=server)
    first, ttl = worker_a.hit("agent-turn:alice", 60)
    second, _ = worker_b.hit("agent-turn:alice", 60)
    other, _ = worker_b.hit("agent-turn:bob", 60)
    assert (first, second, other) == (1, 2, 1)
    assert ttl > 0
