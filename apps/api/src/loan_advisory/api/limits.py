"""Per-borrower budgets for the agent surface.

An assertion is single-use per turn, which stops replay but not volume: a signed-in
borrower can keep minting and keep driving provider calls. Budgets are counted per
`sub` and per scope in the same shared Redis the replay guard uses; process-local
counters are a development backend only and are refused in production.

The store is intentionally separate from replay: a budget hit is recoverable and
must not consume or invalidate any credential.
"""
import hashlib
import os
import threading
import time
from typing import Protocol

import redis

BUDGET_KEY_PREFIX = "loan-advisory:budget:"
PRODUCTION_ENV = {"production", "prod"}


class BudgetExceeded(Exception):
    def __init__(self, retry_after: int):
        super().__init__("rate limit exceeded")
        self.retry_after = retry_after


class BudgetUnavailable(Exception):
    """The counter store cannot be reached; the caller decides whether to fail closed."""


class BudgetStore(Protocol):
    def hit(self, key: str, window: int) -> tuple[int, int]:
        """(count in the current window, seconds until it resets)."""

    def reset(self) -> None:
        """Test helper; never called by a route."""


class MemoryBudgetStore:
    def __init__(self) -> None:
        self._counts: dict[str, tuple[int, float]] = {}
        self._lock = threading.Lock()

    def hit(self, key: str, window: int) -> tuple[int, int]:
        now = time.monotonic()
        with self._lock:
            for stale in [k for k, (_, reset) in self._counts.items() if reset <= now]:
                del self._counts[stale]
            count, reset = self._counts.get(key, (0, now + window))
            if reset <= now:
                count, reset = 0, now + window
            count += 1
            self._counts[key] = (count, reset)
            return count, max(int(reset - now), 1)

    def reset(self) -> None:
        with self._lock:
            self._counts.clear()


class RedisBudgetStore:
    def __init__(self, url: str | None = None, *, client=None, prefix: str = BUDGET_KEY_PREFIX):
        self._client = client or redis.Redis.from_url(
            url, socket_connect_timeout=1.0, socket_timeout=1.0
        )
        self._prefix = prefix

    @staticmethod
    def _key(prefix: str, key: str) -> str:
        return prefix + hashlib.sha256(key.encode("utf-8")).hexdigest()

    def hit(self, key: str, window: int) -> tuple[int, int]:
        redis_key = self._key(self._prefix, key)
        try:
            # SET NX gives the first caller the window; every later caller only increments,
            # so the reset time never slides. A key that lost its TTL is repaired once.
            self._client.set(redis_key, 0, nx=True, ex=max(1, int(window)))
            count = int(self._client.incr(redis_key))
            ttl = int(self._client.ttl(redis_key))
            if ttl < 0:
                self._client.expire(redis_key, max(1, int(window)))
                ttl = int(window)
        except (redis.RedisError, OSError) as exc:
            raise BudgetUnavailable("rate limit store is unavailable") from exc
        return count, max(ttl, 1)

    def reset(self) -> None:
        try:
            keys = list(self._client.scan_iter(match=self._prefix + "*"))
            if keys:
                self._client.delete(*keys)
        except (redis.RedisError, OSError) as exc:
            raise BudgetUnavailable("rate limit store is unavailable") from exc


class UnavailableBudgetStore:
    def __init__(self, reason: str) -> None:
        self.reason = reason

    def hit(self, key: str, window: int) -> tuple[int, int]:
        raise BudgetUnavailable(self.reason)

    def reset(self) -> None:
        return None


def _store_from_env() -> BudgetStore:
    url = (os.environ.get("ASSERTION_REPLAY_REDIS_URL") or "").strip()
    backend = (os.environ.get("ASSERTION_REPLAY_BACKEND") or "auto").strip().lower()
    environment = (os.environ.get("APP_ENV") or os.environ.get("ENVIRONMENT") or "").strip().lower()
    if backend == "auto":
        backend = "redis" if url else "memory"
    if backend == "redis":
        if not url:
            return UnavailableBudgetStore("rate limits are misconfigured: no Redis URL")
        try:
            return RedisBudgetStore(url)
        except (redis.RedisError, OSError, ValueError) as exc:
            return UnavailableBudgetStore(f"rate limits are misconfigured: {exc}")
    if backend == "memory":
        if environment in PRODUCTION_ENV:
            return UnavailableBudgetStore(
                "rate limits cannot use process-local memory in production"
            )
        return MemoryBudgetStore()
    return UnavailableBudgetStore(f"rate limit backend {backend!r} is not supported")


class BudgetGuard:
    """One lazy, configuration-aware store; routes call `enforce` with the verified `sub`."""

    def __init__(self, store: BudgetStore | None = None) -> None:
        self._store = store
        self._signature: tuple[str, str, str] | None = None

    def _configured(self) -> BudgetStore:
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

    def enforce(self, scope: str, identity: str, limit: int, window: int) -> None:
        count, ttl = self._configured().hit(f"{scope}:{identity}", window)
        if count > limit:
            raise BudgetExceeded(ttl)

    def reset(self) -> None:
        self._configured().reset()


budget = BudgetGuard()


def enforce(scope: str, identity: str, limit: int, window: int) -> None:
    budget.enforce(scope, identity, limit, window)
