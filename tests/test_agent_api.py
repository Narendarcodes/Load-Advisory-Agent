"""Agent-only HTTP surface: assertion in, AG-UI / NDJSON / bureau out.

Every AG-UI frame is re-parsed with the official `ag_ui.core.Event` union, so protocol drift fails
here rather than in the browser. The offline agent runs over the in-memory MockStore with a
scripted LLM: APP-TEST-005 is REJECTED, APP-TEST-001 is APPROVED.
"""
import base64
import hashlib
import hmac
import json
import time

import pytest
from ag_ui.core import Event, RunAgentInput, UserMessage
from fastapi.testclient import TestClient
from pydantic import TypeAdapter

from loan_advisory.api import assertion
from loan_advisory.api.app import create_app
from loan_advisory.api.events import PUBLIC_STATE_FIELDS
from loan_advisory.agent import server as srv
from loan_advisory.agent.runtime import build_offline_agent
from tests.test_agent_graph import FakePolicy, ScriptedLLM

SECRET = "unit-test-assertion-secret-0123456789"
EVENT = TypeAdapter(Event)


def _b64(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def mint(customer="CUS-TEST-005", application="APP-TEST-005", *, literacy="medium", locale="en",
         thread=None, jti=None, iat=None, exp=None, secret=SECRET) -> str:
    now = int(time.time()) if iat is None else iat
    payload = {
        "iss": assertion.ISSUER, "aud": assertion.AUDIENCE, "sub": "borrower@example.invalid",
        "customer": customer, "application": application, "thread": thread,
        "literacy": literacy, "locale": locale,
        "iat": now, "exp": (now + 60) if exp is None else exp, "jti": jti or f"jti-{time.time_ns()}",
    }
    body = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    signature = hmac.new(secret.encode(), body, hashlib.sha256).digest()
    return f"{_b64(body)}.{_b64(signature)}"


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(autouse=True)
def _secret(monkeypatch):
    monkeypatch.setenv("AGENT_ASSERTION_SECRET", SECRET)
    assertion.replay.reset()
    yield
    assertion.replay.reset()


@pytest.fixture(scope="module")
def service():
    agent, store, _ = build_offline_agent(llm=ScriptedLLM(intent="explain"), policy_tools=FakePolicy())
    return srv.App(agent, store.get)


@pytest.fixture
def client(service):
    return TestClient(create_app(service))


def _input(text="why?", thread="thread-a", run="run-a", **props) -> dict:
    inp = RunAgentInput(threadId=thread, runId=run, messages=[UserMessage(id="u1", role="user", content=text)],
                        forwardedProps=props)
    return json.loads(inp.model_dump_json(by_alias=True))


def _agui(client, body, token):
    response = client.post("/api/agui", json=body, headers=auth(token) if token else {})
    assert response.headers["content-type"].startswith("text/event-stream")
    frames = [line[6:] for block in response.text.split("\n\n") for line in block.splitlines()
              if line.startswith("data: ")]
    return response, [EVENT.validate_json(frame) for frame in frames]


def test_health_and_security_headers(client):
    response = client.get("/healthz")
    assert (response.status_code, response.json()) == (200, {"ok": True})
    assert response.headers["cache-control"] == "no-store"
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["referrer-policy"] == "no-referrer"


def test_legacy_borrower_routes_are_gone(client):
    assert client.post("/api/session", json={}).json() == {"error": "not found"}
    assert client.get("/api/demo-accounts").json() == {"error": "not found"}
    assert client.get("/api/decision").json() == {"error": "not found"}
    assert client.post("/api/livekit-token", json={}).json() == {"error": "not found"}
    assert client.get("/api/agui").json() == {"error": "method not allowed"}


def test_no_credential_is_401_before_any_work(client):
    response = client.post("/api/agui", json=_input())
    assert (response.status_code, response.json()) == (401, {"error": "sign in first"})
    assert client.post("/api/chat", json={"message": "why?"}).status_code == 401
    assert client.post("/api/agui", json=_input(), headers=auth("garbage")).status_code == 401


def test_unconfigured_secret_is_503(client, monkeypatch):
    monkeypatch.setenv("AGENT_ASSERTION_SECRET", "too-short")
    response = client.post("/api/agui", json=_input(), headers=auth(mint()))
    assert (response.status_code, response.json()) == (503, {"error": "agent authentication is not configured"})


def test_agui_event_sequence_and_allowlisted_state(client):
    _, events = _agui(client, _input(), mint(thread="thread-a"))
    kinds = [event.type for event in events]
    assert kinds[0] == "RUN_STARTED" and kinds[1] == "TEXT_MESSAGE_START"
    assert kinds[-3:] == ["STATE_SNAPSHOT", "TEXT_MESSAGE_END", "RUN_FINISHED"]
    assert set(kinds[2:-3]) == {"TEXT_MESSAGE_CONTENT"}
    assert events[0].thread_id == "thread-a" and events[0].run_id == "run-a"

    deltas = [event.delta for event in events if event.type == "TEXT_MESSAGE_CONTENT"]
    assert deltas and deltas[0].startswith("This uses a synthetic prototype policy.")
    assert any("Credit score" in delta for delta in deltas)
    state = events[-3].snapshot
    assert set(state) <= set(PUBLIC_STATE_FIELDS) and "timings" not in state
    assert state["decision_card"]["application_ref"] == "APP-TEST-005"
    assert state["decision_card"]["decision"] == "REJECTED"
    assert state["trace_id"] and state["intent"] == "explain"


def test_identity_and_language_come_from_the_assertion(client, service, monkeypatch):
    captured = {}
    real_run = service.agent.run

    def run(req, *args, **kwargs):
        captured["req"] = req
        return real_run(req, *args, **kwargs)

    monkeypatch.setattr(service.agent, "run", run)
    _, events = _agui(client, _input(literacy="high", locale="te", application="APP-TEST-001"),
                      mint(literacy="low", locale="hi", thread="thread-a"))
    assert captured["req"].application_ref == "APP-TEST-005"  # body props are ignored
    assert captured["req"].literacy == "low"
    assert captured["req"].locale == "hi"
    assert events[-3].snapshot["decision_card"]["application_ref"] == "APP-TEST-005"


def test_no_selected_application_is_409_before_the_stream(client):
    response = client.post("/api/agui", json=_input(), headers=auth(mint(application=None, thread="thread-a")))
    assert (response.status_code, response.json()) == (409, {"error": "select an application first"})
    response = client.post("/api/chat/stream", json={"message": "why?"}, headers=auth(mint(application=None)))
    assert (response.status_code, response.json()) == (409, {"error": "select an application first"})


def test_agui_reconciles_the_asserted_thread_with_the_run(client):
    # The assertion was minted for a different conversation than the one being streamed.
    response = client.post("/api/agui", json=_input(thread="thread-b"), headers=auth(mint(thread="thread-a")))
    assert (response.status_code, response.json()) == (
        403,
        {"error": "conversation does not match the signed-in session"},
    )
    # An assertion without a thread cannot authorise any run.
    response = client.post("/api/agui", json=_input(thread="thread-a"), headers=auth(mint(thread=None)))
    assert response.status_code == 403


def test_chat_refuses_a_conversation_other_than_the_asserted_one(client):
    body = {"message": "why?", "conversation_id": "voice-b"}
    response = client.post("/api/chat", json=body, headers=auth(mint(thread="voice-a")))
    assert (response.status_code, response.json()) == (
        403,
        {"error": "conversation does not match the signed-in session"},
    )
    allowed = client.post("/api/chat", json={"message": "why?", "conversation_id": "voice-a"},
                          headers=auth(mint(thread="voice-a")))
    assert allowed.status_code == 200


def test_invalid_agui_input_is_422(client):
    for bad in (_input(run="bad run"),
                _input(thread="x" * 200),
                {"threadId": "t", "runId": "r", "messages": []},
                {"threadId": "t"}):
        response = client.post("/api/agui", json=bad, headers=auth(mint()))
        assert (response.status_code, response.json()) == (422, {"error": "invalid AG-UI request"}), bad


def test_assertion_is_single_use(client):
    token = mint(jti="one-shot", thread="thread-a")
    assert client.post("/api/agui", json=_input(), headers=auth(token)).status_code == 200
    assert client.post("/api/agui", json=_input(), headers=auth(token)).status_code == 401


def test_expired_forged_and_long_lived_assertions_are_rejected(client):
    now = int(time.time())
    for token in (mint(iat=now - 120, exp=now - 60),
                  mint(secret="another-secret-that-is-long-enough-00"),
                  mint(iat=now, exp=now + assertion.MAX_LIFETIME_SECONDS + 60)):
        assert client.post("/api/agui", json=_input(), headers=auth(token)).status_code == 401


def test_chat_and_ndjson_stream_use_the_same_assertion(client):
    response = client.post("/api/chat", json={"message": "why?"}, headers=auth(mint()))
    assert response.status_code == 200
    assert response.json()["decision_card"]["application_ref"] == "APP-TEST-005"

    response = client.post("/api/chat/stream", json={"message": "why?"}, headers=auth(mint()))
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/x-ndjson")
    lines = [json.loads(line) for line in response.text.splitlines() if line.strip()]
    assert lines[-1]["type"] == "final"
    assert any(line["type"] == "sentence" for line in lines)
    assert lines[-1]["response"]["decision_card"]["decision"] == "REJECTED"


def test_malformed_and_oversized_bodies_are_400(client):
    token = mint()
    response = client.post("/api/chat", content=b"not json", headers={**auth(token), "content-type": "application/json"})
    assert (response.status_code, response.json()) == (400, {"error": "bad JSON body"})
    response = client.post("/api/chat", content=b"x" * 64_001,
                           headers={**auth(token), "content-type": "application/json"})
    assert (response.status_code, response.json()) == (400, {"error": "bad JSON body"})
