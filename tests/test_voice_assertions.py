"""The voice worker's assertion exchange: service credential only, one request per turn, fail closed.

The worker never holds a borrower credential. It presents the participant's `session_id`, the room and
its own identity to Frappe with an integration API key, and Frappe decides whether that session is live.
"""
import asyncio
import importlib.util
from pathlib import Path

import pytest

MODULE = Path(__file__).resolve().parents[1] / "apps" / "voice" / "voice_assertion_exchange.py"
SPEC = importlib.util.spec_from_file_location("voice_assertion_exchange", MODULE)
W = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(W)

SESSION = "a" * 32
PATH = "/api/method/loan_advisory_portal.api.voice.voice_assertion"


class Response:
    def __init__(self, status: int, payload: dict):
        self.status, self._payload = status, payload

    async def json(self):
        return self._payload

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False


class HTTP:
    def __init__(self, *responses):
        self.responses = list(responses)
        self.calls = []

    def post(self, url, *, headers=None, json=None, timeout=None):
        self.calls.append({"url": url, "headers": headers, "body": json, "timeout": timeout})
        return self.responses.pop(0)


def exchange(http, **override):
    options = {"frappe_url": "http://frappe.test:8080/", "api_key": "key", "api_secret": "secret", "timeout_s": 12}
    options.update(override)
    return W.Assertions(http, SESSION, "room-1", "applicant-1", **options)


def test_fresh_posts_the_session_with_the_service_credential():
    http = HTTP(Response(200, {"message": {"assertion": "body.sig", "locale": "hi", "application": "APP-1"}}))
    message = asyncio.run(exchange(http).fresh())
    assert message == {"assertion": "body.sig", "locale": "hi", "application": "APP-1"}
    call, = http.calls
    assert call["url"] == f"http://frappe.test:8080{PATH}"
    assert call["headers"] == {"Authorization": "token key:secret"}
    assert call["body"] == {"session_id": SESSION, "room": "room-1", "identity": "applicant-1"}
    assert call["timeout"].total == 12


def test_no_service_credential_fails_before_any_request():
    http = HTTP()
    with pytest.raises(RuntimeError, match="integration credential"):
        asyncio.run(exchange(http, api_secret="").fresh())
    assert http.calls == []


def test_a_refusal_reports_the_status_only():
    http = HTTP(Response(409, {"message": "This voice session has expired for CUS-1."}))
    with pytest.raises(RuntimeError, match="HTTP 409") as exc:
        asyncio.run(exchange(http).fresh())
    assert "CUS-1" not in str(exc.value)


def test_a_response_without_an_assertion_is_refused():
    http = HTTP(Response(200, {"message": {"application": "APP-1"}}))
    with pytest.raises(RuntimeError, match="no assertion"):
        asyncio.run(exchange(http).fresh())


def test_each_turn_asks_again_and_nothing_is_cached():
    http = HTTP(Response(200, {"message": {"assertion": "one.a"}}), Response(200, {"message": {"assertion": "two.b"}}))
    client = exchange(http)
    assert asyncio.run(client.fresh())["assertion"] == "one.a"
    assert asyncio.run(client.fresh())["assertion"] == "two.b"
    assert len(http.calls) == 2
    assert http.calls[0]["body"] == http.calls[1]["body"]
