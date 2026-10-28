"""Request bodies: wrong field types are rejected, never silently coerced.

`str(body.get("message"))` used to turn `123` into `"123"` and a dict into its repr, so a malformed
client could inject unexpected text into the graph. Field types are now validated at the boundary.
"""
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
