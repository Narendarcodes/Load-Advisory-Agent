"""Verification of the short-lived assertion minted by Frappe.

Mirror of `services/assertion.py` in the portal app: HMAC-SHA256 over compact
sorted JSON, `body.signature`, issuer/audience pinned, 60-second lifetime, 30 s
clock skew, and a single-use `jti`.

The secret is the site's `agent_assertion_secret`, handed to this service as
`AGENT_ASSERTION_SECRET` at deploy time. It is never read from a request.

Single use is enforced by a shared store when one is configured. Redis uses
`SET NX EX`, which is atomic across every worker; any store error is a 503, not
an accepted credential. Process-local memory is a development/test backend and
is refused when `APP_ENV`/`ENVIRONMENT` says production.
"""
import base64
import hashlib
import hmac
import json
import os
import threading
import time
from typing import Protocol

import redis

ISSUER = "frappe:loan_advisory_portal"
AUDIENCE = "loan-advisory-agent"
CLOCK_SKEW_SECONDS = 30
MAX_LIFETIME_SECONDS = 300
REPLAY_WINDOW_SECONDS = 90


class AssertionRejected(Exception):
    """The credential is absent, malformed, expired, forged, or already used."""


class AssertionUnavailable(Exception):
    """The service has no usable secret; nothing can be verified."""


def _secret() -> bytes:
    raw = (os.environ.get("AGENT_ASSERTION_SECRET") or "").strip()
    if len(raw) < 32:
        raise AssertionUnavailable("assertion verification is not configured")
    return raw.encode("utf-8")


def _unb64(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


REPLAY_KEY_PREFIX = "loan-advisory:assertion-replay:"
PRODUCTION_ENV = {"production", "prod"}


class ReplayStore(Protocol):
    def claim(self, jti: str, ttl_seconds: int) -> bool:
        """True when this worker claimed the jti; False when it was already used."""

    def reset(self) -> None:
        """Test helper; never called by the verifier."""


class MemoryReplayStore:
    """Process-local store for development and tests, never a production fallback."""

    def __init__(self) -> None:
        self._seen: dict[str, float] = {}
        self._lock = threading.Lock()

    def claim(self, jti: str, ttl_seconds: int) -> bool:
        now = time.monotonic()
        with self._lock:
            for key, expiry in list(self._seen.items()):
                if expiry <= now:
                    del self._seen[key]
            if jti in self._seen:
                return False
            self._seen[jti] = now + max(1, int(ttl_seconds))
            return True

    def reset(self) -> None:
        with self._lock:
            self._seen.clear()


class RedisReplayStore:
    """Shared single-use store. `SET NX EX` is the atomic claim; errors fail closed."""

    def __init__(self, url: str | None = None, *, client=None, prefix: str = REPLAY_KEY_PREFIX):
        self._client = client or redis.Redis.from_url(
            url, socket_connect_timeout=1.0, socket_timeout=1.0
        )
        self._prefix = prefix

    @staticmethod
    def _key(prefix: str, jti: str) -> str:
        return prefix + hashlib.sha256(jti.encode("utf-8")).hexdigest()

    def claim(self, jti: str, ttl_seconds: int) -> bool:
        try:
            claimed = self._client.set(
                self._key(self._prefix, jti), "1", nx=True, ex=max(1, int(ttl_seconds))
            )
        except (redis.RedisError, OSError) as exc:
            raise AssertionUnavailable("assertion replay store is unavailable") from exc
        return bool(claimed)

    def reset(self) -> None:
        """Only for tests: removes this deployment's replay keys, never other prefixes."""
        try:
            keys = list(self._client.scan_iter(match=self._prefix + "*"))
            if keys:
                self._client.delete(*keys)
        except (redis.RedisError, OSError) as exc:
            raise AssertionUnavailable("assertion replay store is unavailable") from exc


class UnavailableReplayStore:
    """A misconfigured or forbidden backend refuses every assertion instead of accepting it."""

    def __init__(self, reason: str) -> None:
        self.reason = reason

    def claim(self, jti: str, ttl_seconds: int) -> bool:
        raise AssertionUnavailable(self.reason)

    def reset(self) -> None:
        return None


def _store_from_env() -> ReplayStore:
    url = (os.environ.get("ASSERTION_REPLAY_REDIS_URL") or "").strip()
    backend = (os.environ.get("ASSERTION_REPLAY_BACKEND") or "auto").strip().lower()
    environment = (os.environ.get("APP_ENV") or os.environ.get("ENVIRONMENT") or "").strip().lower()
    if backend == "auto":
        backend = "redis" if url else "memory"
    if backend == "redis":
        if not url:
            return UnavailableReplayStore("assertion replay is misconfigured: no Redis URL")
        try:
            return RedisReplayStore(url)
        except (redis.RedisError, OSError, ValueError) as exc:
            return UnavailableReplayStore(f"assertion replay is misconfigured: {exc}")
    if backend == "memory":
        if environment in PRODUCTION_ENV:
            return UnavailableReplayStore(
                "assertion replay cannot use process-local memory in production"
            )
        return MemoryReplayStore()
    return UnavailableReplayStore(f"assertion replay backend {backend!r} is not supported")


class ReplayGuard:
    """Module-level facade: one lazy store per configuration, TTL covers expiry plus skew."""

    def __init__(self, store: ReplayStore | None = None) -> None:
        self._store = store
        self._signature: tuple[str, str, str] | None = None

    def _configured(self) -> ReplayStore:
        if self._store is not None:
            return self._store
        signature = (
            os.environ.get("ASSERTION_REPLAY_REDIS_URL") or "",
            os.environ.get("ASSERTION_REPLAY_BACKEND") or "auto",
            os.environ.get("APP_ENV") or os.environ.get("ENVIRONMENT") or "",
        )
        if signature != self._signature:
            self._store = _store_from_env()
            self._signature = signature
        return self._store

    def claim(self, jti: str, expires_at: int, now: int) -> None:
        ttl_seconds = int(expires_at) + REPLAY_WINDOW_SECONDS - int(now)
        if not self._configured().claim(jti, ttl_seconds):
            raise AssertionRejected("assertion has already been used")

    def reset(self) -> None:
        self._configured().reset()


replay = ReplayGuard()


def verify(token: str, *, now: int | None = None) -> dict:
    if not token or not isinstance(token, str) or token.count(".") != 1:
        raise AssertionRejected("invalid assertion")
    body_b64, signature_b64 = token.split(".", 1)
    try:
        body = _unb64(body_b64)
        signature = _unb64(signature_b64)
    except (ValueError, TypeError):
        raise AssertionRejected("invalid assertion") from None

    expected = hmac.new(_secret(), body, hashlib.sha256).digest()
    if not hmac.compare_digest(signature, expected):
        raise AssertionRejected("invalid assertion")

    try:
        payload = json.loads(body)
    except ValueError:
        raise AssertionRejected("invalid assertion") from None
    if not isinstance(payload, dict):
        raise AssertionRejected("invalid assertion")

    moment = int(time.time()) if now is None else int(now)
    if payload.get("iss") != ISSUER or payload.get("aud") != AUDIENCE:
        raise AssertionRejected("invalid assertion")
    try:
        issued = int(payload.get("iat", 0))
        expires = int(payload.get("exp", 0))
    except (TypeError, ValueError):
        raise AssertionRejected("invalid assertion") from None
    if issued > moment + CLOCK_SKEW_SECONDS or expires <= moment:
        raise AssertionRejected("assertion expired; sign in again")
    if expires - issued > MAX_LIFETIME_SECONDS:
        raise AssertionRejected("invalid assertion")

    for field in ("sub", "customer", "jti"):
        value = payload.get(field)
        if not isinstance(value, str) or not value.strip():
            raise AssertionRejected("invalid assertion")

    replay.claim(payload["jti"], expires, moment)
    return payload


def session_claims(payload: dict) -> dict:
    """Map an assertion to the claim shape the agent already understands.

    `applicant_ref` is the Frappe Customer name, exactly what the legacy token
    carried, so every tool and ownership check keeps working unchanged.
    """
    literacy = payload.get("literacy")
    locale = payload.get("locale")
    return {
        "sub": payload["sub"],
        "customer": payload["customer"],
        "applicant_ref": payload["customer"],
        "application_ref": payload.get("application") or None,
        "thread": payload.get("thread") or None,
        "literacy": literacy if literacy in ("low", "medium", "high") else "medium",
        "locale": locale if locale in ("en", "hi", "te") else "en",
    }
