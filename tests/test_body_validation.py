"""Request bodies: wrong field types are rejected, never silently coerced.

`str(body.get("message"))` used to turn `123` into `"123"` and a dict into its repr, so a malformed
client could inject unexpected text into the graph. Field types are now validated at the boundary.
"""
import json
import threading
import time
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer

import pytest

from loan_advisory.agent import server as srv


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


def test_session_rejects_non_string_external_ref():
    app = srv.App(None, None)
    with pytest.raises(srv.BadRequest):
        app.session({"external_ref": 7})


# ------------------------------------------------------------------ HTTP contract
@pytest.fixture(autouse=True)
def _restore_secret():
    saved = getattr(srv, "_SECRET", None)
    yield
    srv._SECRET = saved


@pytest.fixture
def live_app():
    httpd = ThreadingHTTPServer(("127.0.0.1", 0), srv.make_handler(srv.App(None, None)))
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{httpd.server_address[1]}"
    httpd.shutdown()


def _post(url, body, token=None):
    data = body if isinstance(body, bytes) else json.dumps(body).encode()
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"{}")


def test_non_object_json_body_returns_400(live_app):
    assert _post(live_app + "/api/session", b"[1,2,3]") == (400, {"error": "bad JSON body"})


def test_non_string_message_is_a_400_even_on_the_stream_endpoint(live_app):
    """_stream_chat sends 200 before the graph runs, so validation must happen before dispatch."""
    srv.configure_secret(env={"AGENT_SESSION_SECRET": "test-secret"})
    token = srv.sign({"applicant_ref": "CUS-1", "application_ref": "APP-1", "exp": time.time() + 60})
    status, body = _post(live_app + "/api/chat/stream", {"message": 123}, token=token)
    assert status == 400 and body == {"error": "message must be a string"}
