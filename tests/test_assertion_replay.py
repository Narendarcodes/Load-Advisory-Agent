"""Shared, atomic, expiring replay protection for the assertion verifier (B1).

`RedisReplayStore` uses `SET NX EX`; the fake below is a minimal atomic server so
two store instances can stand in for two uvicorn workers without a live Redis.
The nine scenarios the hardening brief requires are covered explicitly.
"""
import base64
import hashlib
import hmac
import json
import threading
import time

import pytest
import redis

from loan_advisory.api import assertion

SECRET = "replay-test-assertion-secret-0123456789"
APPLICATION = "APP-TEST-005"


def _b64(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def mint(*, jti="jti-1", iat=None, exp=None, iss=None, aud=None, secret=SECRET) -> str:
    now = int(time.time()) if iat is None else iat
    payload = {
        "iss": assertion.ISSUER if iss is None else iss,
        "aud": assertion.AUDIENCE if aud is None else aud,
        "sub": "borrower@example.invalid",
        "customer": "CUS-TEST-005",
        "application": APPLICATION,
        "thread": None,
        "literacy": "medium",
        "locale": "en",
        "iat": now,
        "exp": (now + 60) if exp is None else exp,
        "jti": jti,
    }
    body = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    signature = hmac.new(secret.encode(), body, hashlib.sha256).digest()
    return f"{_b64(body)}.{_b64(signature)}"


class FakeRedis:
    """One fake server shared by every store instance; SET NX EX under a lock."""

    def __init__(self, *, fail=None):
        self._lock = threading.Lock()
        self._values = {}
        self._ttls = {}
        self.fail = fail

    def set(self, name, value, nx=False, ex=None):
        if self.fail is not None:
            raise self.fail
        with self._lock:
            if nx and name in self._values:
                return None
            self._values[name] = value
            self._ttls[name] = ex
            return True

    def scan_iter(self, match="*"):
        prefix = match.rstrip("*")
        with self._lock:
            return [key for key in self._values if key.startswith(prefix)]

    def delete(self, *keys):
        with self._lock:
            for key in keys:
                self._values.pop(key, None)
                self._ttls.pop(key, None)
        return len(keys)


@pytest.fixture(autouse=True)
def _secret(monkeypatch):
    monkeypatch.setenv("AGENT_ASSERTION_SECRET", SECRET)
    yield


def worker(server: FakeRedis) -> assertion.ReplayGuard:
    return assertion.ReplayGuard(assertion.RedisReplayStore(client=server))


def use(monkeypatch, guard: assertion.ReplayGuard) -> None:
    monkeypatch.setattr(assertion, "replay", guard)


def test_first_use_is_accepted(monkeypatch):
    server = FakeRedis()
    use(monkeypatch, worker(server))

    assert assertion.verify(mint(jti="first"))["jti"] == "first"


def test_same_worker_reuse_is_rejected(monkeypatch):
    use(monkeypatch, worker(FakeRedis()))
    token = mint(jti="same-worker")

    assertion.verify(token)
    with pytest.raises(assertion.AssertionRejected, match="already been used"):
        assertion.verify(token)


def test_different_worker_reuse_is_rejected(monkeypatch):
    server = FakeRedis()  # the shared Redis both workers talk to
    token = mint(jti="cross-worker")

    use(monkeypatch, worker(server))
    assertion.verify(token)

    use(monkeypatch, worker(server))
    with pytest.raises(assertion.AssertionRejected, match="already been used"):
        assertion.verify(token)


def test_concurrent_replay_has_exactly_one_winner():
    server = FakeRedis()
    guards = [worker(server) for _ in range(8)]
    barrier = threading.Barrier(len(guards))
    outcomes = []
    lock = threading.Lock()

    def run(guard):
        barrier.wait()
        try:
            guard.claim("concurrent", 1000 + 60, 1000)
            outcome = "accepted"
        except assertion.AssertionRejected:
            outcome = "replay"
        with lock:
            outcomes.append(outcome)

    threads = [threading.Thread(target=run, args=(guard,)) for guard in guards]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()

    assert outcomes.count("accepted") == 1
    assert outcomes.count("replay") == len(guards) - 1


def test_expired_assertion_is_rejected(monkeypatch):
    server = FakeRedis()
    use(monkeypatch, worker(server))
    now = int(time.time())

    with pytest.raises(assertion.AssertionRejected, match="expired"):
        assertion.verify(mint(jti="expired", iat=now - 120, exp=now - 60))
    assert server._values == {}


def test_malformed_assertion_is_rejected(monkeypatch):
    use(monkeypatch, worker(FakeRedis()))

    for token in ("", "not-a-token", "a.b.c", "!!.!!"):
        with pytest.raises(assertion.AssertionRejected, match="invalid assertion"):
            assertion.verify(token)


def test_wrong_issuer_or_audience_is_rejected(monkeypatch):
    use(monkeypatch, worker(FakeRedis()))

    with pytest.raises(assertion.AssertionRejected, match="invalid assertion"):
        assertion.verify(mint(jti="wrong-iss", iss="someone-else"))
    with pytest.raises(assertion.AssertionRejected, match="invalid assertion"):
        assertion.verify(mint(jti="wrong-aud", aud="another-service"))


def test_store_unavailable_fails_closed(monkeypatch):
    server = FakeRedis(fail=redis.ConnectionError("redis is down"))
    use(monkeypatch, worker(server))

    with pytest.raises(assertion.AssertionUnavailable, match="unavailable"):
        assertion.verify(mint(jti="store-down"))


def test_fresh_valid_assertion_succeeds_after_a_replay(monkeypatch):
    use(monkeypatch, worker(FakeRedis()))
    first = mint(jti="first")
    second = mint(jti="second")

    assertion.verify(first)
    with pytest.raises(assertion.AssertionRejected):
        assertion.verify(first)
    assert assertion.verify(second)["jti"] == "second"


def test_ttl_covers_expiry_plus_clock_skew(monkeypatch):
    server = FakeRedis()
    use(monkeypatch, worker(server))
    now = 1_000_000

    assertion.verify(mint(jti="ttl", iat=now, exp=now + 60), now=now)

    key = assertion.RedisReplayStore._key(assertion.REPLAY_KEY_PREFIX, "ttl")
    assert server._ttls[key] == 60 + assertion.REPLAY_WINDOW_SECONDS


def test_memory_backend_is_refused_in_production(monkeypatch):
    monkeypatch.setenv("ASSERTION_REPLAY_BACKEND", "memory")
    monkeypatch.setenv("APP_ENV", "production")
    store = assertion._store_from_env()

    with pytest.raises(assertion.AssertionUnavailable, match="production"):
        store.claim("any", 60)


def test_auto_backend_without_redis_is_refused_in_production(monkeypatch):
    monkeypatch.delenv("ASSERTION_REPLAY_BACKEND", raising=False)
    monkeypatch.delenv("ASSERTION_REPLAY_REDIS_URL", raising=False)
    monkeypatch.setenv("APP_ENV", "production")
    store = assertion._store_from_env()

    with pytest.raises(assertion.AssertionUnavailable, match="process-local memory"):
        store.claim("any", 60)
