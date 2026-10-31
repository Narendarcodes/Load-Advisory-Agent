"""Request bodies: wrong field types are rejected, never silently coerced.

`str(body.get("message"))` used to turn `123` into `"123"` and a dict into its repr, so a malformed
client could inject unexpected text into the graph. Field types are now validated at the boundary,
before authentication and before a stream is opened.
"""
import pytest
from fastapi.testclient import TestClient

from loan_advisory.agent import server as srv
from loan_advisory.api import assertion
from loan_advisory.api.app import create_app
from tests.test_agent_api import SECRET, auth, mint


def test_non_string_message_is_rejected():
    app = srv.App(None, None)
    with pytest.raises(srv.BadRequest):
        app._request({"application_ref": "APP-1"}, {"message": 123})


@pytest.mark.parametrize("key", ["request_id", "conversation_id"])
def test_non_string_ids_are_rejected(key):
    app = srv.App(None, None)
    with pytest.raises(srv.BadRequest):
        app._request({"application_ref": "APP-1"}, {key: ["x"]})


def test_valid_body_is_unchanged():
    app = srv.App(None, None)
    req = app._request({"application_ref": "APP-1"},
                       {"message": "why?", "conversation_id": "c1", "request_id": "r1"})
    assert (req.message, req.conversation_id, req.request_id) == ("why?", "c1", "r1")
    assert req.application_ref == "APP-1"


# ------------------------------------------------------------------ HTTP contract
@pytest.fixture(autouse=True)
def _secret(monkeypatch):
    monkeypatch.setenv("AGENT_ASSERTION_SECRET", SECRET)
    assertion.replay.reset()
    yield
    assertion.replay.reset()


@pytest.fixture
def client():
    return TestClient(create_app(srv.App(None, None)))


def test_non_object_json_body_returns_400(client):
    response = client.post("/api/chat", content=b"[1,2,3]",
                           headers={**auth(mint()), "content-type": "application/json"})
    assert (response.status_code, response.json()) == (400, {"error": "bad JSON body"})


def test_non_string_message_is_a_400_even_on_the_stream_endpoint(client):
    """The stream sends 200 before the graph runs, so validation must happen before dispatch."""
    response = client.post("/api/chat/stream", json={"message": 123}, headers=auth(mint()))
    assert (response.status_code, response.json()) == (400, {"error": "message must be a string"})
