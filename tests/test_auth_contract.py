"""P0a: session-secret handling (H-1) and LiveKit token input validation (G-1).

H-1: a missing AGENT_SESSION_SECRET must stop startup instead of silently signing with a per-process random key;
the only way back is the explicit --dev-ephemeral-secret flag, which warns on stderr.

G-1: /api/livekit-token must reject literacy/locale values the rest of the app does not support, before minting a
token, using the contract literals as the single source of truth.
"""
import base64
import hashlib
import hmac
import json
import threading
import time
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from typing import get_args

import pytest

from loan_advisory.agent import server as srv
from loan_advisory.agent.contracts import LOCALES, Literacy

SECRET = "test-secret-not-a-real-key"
CLAIMS = {"applicant_ref": "CUS-1", "application_ref": "APP-1", "external_ref": "APP-1"}


@pytest.fixture(autouse=True)
def _restore_secret():
    saved = srv._SECRET
    yield
    srv._SECRET = saved


def _configure(secret=SECRET):
    return srv.configure_secret(env={"AGENT_SESSION_SECRET": secret} if secret else {})


def _forge(claims: dict) -> str:
    """A correctly signed token with whatever claims the test wants (to test claim checks, not the HMAC)."""
    raw = base64.urlsafe_b64encode(json.dumps(claims, sort_keys=True).encode()).decode()
    return f"{raw}.{hmac.new(SECRET.encode(), raw.encode(), hashlib.sha256).hexdigest()}"


# ------------------------------------------------------------------ H-1: fail closed
def test_startup_without_a_secret_fails_closed():
    with pytest.raises(SystemExit) as exc:
        srv.configure_secret(env={})
    assert "AGENT_SESSION_SECRET" in str(exc.value) and "--dev-ephemeral-secret" in str(exc.value)


def test_main_fails_closed_without_a_secret(monkeypatch):
    monkeypatch.delenv("AGENT_SESSION_SECRET", raising=False)
    with pytest.raises(SystemExit):
        srv.main(["--offline", "--no-rag"])   # stops before the agent or the port is touched


def test_blank_secret_is_not_a_secret():
    with pytest.raises(SystemExit):
        srv.configure_secret(env={"AGENT_SESSION_SECRET": "   "})


def test_failed_startup_leaves_no_usable_key():
    srv._SECRET = None
    with pytest.raises(SystemExit):
        srv.configure_secret(env={})
    assert srv._SECRET is None
    with pytest.raises(RuntimeError):
        srv.sign({"exp": time.time() + 60})   # no silent random fallback at signing time either


def test_dev_ephemeral_secret_warns_without_printing_the_key(capsys):
    assert srv.configure_secret(dev_ephemeral=True, env={}) == "dev-ephemeral"
    err = capsys.readouterr().err
    assert "WARNING" in err and "production" in err
    assert srv._key().hex() not in err and len(err) < 400
    assert srv.verify(srv.sign({"exp": time.time() + 60, "sub": "x"}))["sub"] == "x"


def test_dev_mode_is_explicit_only():
    assert srv.parse_args([]).dev_ephemeral_secret is False
    assert srv.parse_args(["--dev-ephemeral-secret"]).dev_ephemeral_secret is True
    with pytest.raises(SystemExit):
        srv.configure_secret(env={})   # absence of the flag is what fails, not the default of some helper


def test_env_secret_round_trip_carries_issuer_audience_and_iat(capsys):
    assert _configure() == "env"
    claims = srv.verify(srv.sign({"exp": time.time() + 60, "applicant_ref": "CUS-1"}))
    assert claims["applicant_ref"] == "CUS-1"
    assert claims["iss"] == srv.ISSUER and claims["aud"] == srv.AUDIENCE
    assert abs(claims["iat"] - time.time()) < 5
    assert capsys.readouterr().err == ""   # a configured start is silent


# ------------------------------------------------------------------ token rejection
def test_expired_token_is_rejected_with_its_own_reason():
    _configure()
    claims, reason = srv.verify_token(srv.sign({"exp": time.time() - 1}))
    assert claims is None and reason == "expired"


@pytest.mark.parametrize("token, reason", [
    ("", "missing"),
    ("garbage", "malformed"),
    ("a.b.c", "malformed"),
    (base64.urlsafe_b64encode(b"[1, 2]").decode() + ".x", "malformed"),
    (base64.urlsafe_b64encode(b'{"exp": 9e9}').decode() + ".sig\xff", "malformed"),  # non-ASCII signature text
])
def test_malformed_tokens_are_rejected(token, reason):
    _configure()
    assert srv.verify_token(token) == (None, reason)


def test_tampered_signature_is_rejected():
    _configure()
    head, sig = srv.sign({"exp": time.time() + 60}).rsplit(".", 1)
    flipped = "0" if sig[0] != "0" else "1"
    assert srv.verify_token(f"{head}.{flipped}{sig[1:]}") == (None, "invalid")


def test_tampered_payload_is_rejected():
    _configure()
    head, sig = srv.sign({"exp": time.time() + 60, "applicant_ref": "CUS-1"}).rsplit(".", 1)
    other = base64.urlsafe_b64encode(json.dumps({"exp": time.time() + 60, "applicant_ref": "CUS-2"}).encode()).decode()
    assert srv.verify_token(f"{other}.{sig}") == (None, "invalid")


@pytest.mark.parametrize("override", [{"iss": "other"}, {"aud": "other"}, {"iss": None}, {"aud": None}])
def test_issuer_and_audience_are_checked(override):
    _configure()
    claims = {"iss": srv.ISSUER, "aud": srv.AUDIENCE, "iat": int(time.time()), "exp": time.time() + 60}
    for k, v in override.items():
        if v is None:
            claims.pop(k)
        else:
            claims[k] = v
    assert srv.verify_token(_forge(claims)) == (None, "invalid")


@pytest.mark.parametrize("iat", [None, "now", time.time() + 3600])
def test_issued_at_is_required_and_not_in_the_future(iat):
    _configure()
    claims = {"iss": srv.ISSUER, "aud": srv.AUDIENCE, "iat": int(time.time()), "exp": time.time() + 60}
    if iat is None:
        claims.pop("iat")
    else:
        claims["iat"] = iat
    assert srv.verify_token(_forge(claims)) == (None, "invalid")


def test_legacy_token_without_the_new_claims_is_rejected():
    """Compatibility: tokens minted before P0a have no iss/aud/iat and must not authenticate (max 4 h lifetime)."""
    _configure()
    assert srv.verify_token(_forge({"applicant_ref": "CUS-1", "exp": time.time() + 60})) == (None, "invalid")


# ------------------------------------------------------------------ HTTP contract
def test_http_401_says_why_the_token_was_refused():
    _configure()
    httpd = ThreadingHTTPServer(("127.0.0.1", 0), srv.make_handler(srv.App(None, None)))
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{httpd.server_address[1]}"

    def get(token=None):
        req = urllib.request.Request(base + "/api/decision",
                                     headers={"Authorization": f"Bearer {token}"} if token else {})
        try:
            with urllib.request.urlopen(req, timeout=5) as r:
                return r.status, json.loads(r.read())
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read())

    try:
        assert get() == (401, {"error": "sign in first"})
        assert get(srv.sign({"exp": time.time() - 1})) == (401, {"error": "session expired; sign in again"})
        tok = srv.sign({"exp": time.time() + 60})
        assert get(tok[:-1] + ("0" if tok[-1] != "0" else "1")) == (401, {"error": "invalid session token"})
        # a non-ASCII signature must be a controlled 401, not an uncaught TypeError that drops the connection
        assert get(tok[:-1] + "\xff") == (401, {"error": "malformed session token"})
    finally:
        httpd.shutdown()


# ------------------------------------------------------------------ G-1: livekit input
@pytest.fixture
def no_livekit(monkeypatch):
    for k in ("LIVEKIT_API_KEY", "LIVEKIT_API_SECRET", "LIVEKIT_URL"):
        monkeypatch.delenv(k, raising=False)


@pytest.mark.parametrize("body", [
    {"literacy": "expert"}, {"literacy": "LOW"}, {"literacy": ""}, {"literacy": None}, {"literacy": ["low"]},
    {"locale": "fr"}, {"locale": "EN"}, {"locale": ""}, {"locale": 5},
])
def test_livekit_token_rejects_unsupported_values(no_livekit, body):
    status, payload = srv.livekit_token(CLAIMS, body)
    assert status == 400 and "unsupported" in payload["error"]


@pytest.mark.parametrize("body", [
    {}, {"literacy": "low"}, {"locale": "hi"}, {"literacy": "medium", "locale": "te"}, {"literacy": "high", "locale": "en"},
])
def test_livekit_token_accepts_supported_values_and_defaults(no_livekit, body):
    # 503 = input accepted, LiveKit is simply not configured in this test environment
    assert srv.livekit_token(CLAIMS, body) == (503, {"error": "voice not configured"})


@pytest.mark.parametrize("body", [None, [], "low", 5, True])
def test_livekit_token_rejects_a_non_object_body(no_livekit, body):
    status, payload = srv.livekit_token(CLAIMS, body)
    assert status == 400 and "JSON object" in payload["error"]


def test_livekit_literals_come_from_the_contract():
    assert set(srv.LITERACIES) == {"low", "medium", "high"}
    assert srv.LITERACIES == get_args(Literacy)
    assert tuple(LOCALES) == ("en", "hi", "te")
