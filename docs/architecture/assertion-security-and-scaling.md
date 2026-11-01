# Assertion security and replay scaling

- **Status:** implemented in `apps/api/src/loan_advisory/api/assertion.py` (B1)
- **Contract owner:** Frappe `apps/loan_advisory_portal/loan_advisory_portal/services/assertion.py`
- **Verifier:** FastAPI `apps/api/src/loan_advisory/api/assertion.py`
- **Tests:** `tests/test_assertion_replay.py`

## 1. What the assertion is

The Node runtime exchanges the borrower's Frappe session cookie and CSRF token for a 60-second
HMAC-SHA256 assertion. The browser never sees it. FastAPI accepts only this credential:

- `iss = frappe:loan_advisory_portal`
- `aud = loan-advisory-agent`
- `iat` / `exp`, 60 s lifetime, 30 s clock-skew tolerance
- `sub`, `customer`, optional `application`/`thread`, `literacy`, `locale`, and a random `jti`

The verifier checks the signature, issuer, audience, lifetime and required fields before any
agent work starts. Identity is taken only from the verified payload; no request body field can
replace `customer` or `application`.

## 2. Single-use requirement

A valid assertion is a bearer credential for its lifetime. Single use means:

1. The first request presenting a `jti` may proceed.
2. Every later request with the same `jti` must be rejected, including requests handled by a
   different process, a restarted process, or a second API instance.
3. The claim must survive at least until the assertion can no longer be accepted
   (`exp` plus the verifier's 30 s skew). The implementation keeps it for `exp + 90 s`.
4. If the shared store cannot be reached, the service must **refuse** the assertion (fail
   closed), never accept it on the assumption that the store is empty.

## 3. Implementation

`ReplayGuard` is the module-level facade used by `verify()`. It selects one store from the
environment and computes the Redis TTL as:

```text
ttl = exp + REPLAY_WINDOW_SECONDS - now      # REPLAY_WINDOW_SECONDS = 90
```

`RedisReplayStore` claims a `jti` with one atomic command:

```text
SET loan-advisory:assertion-replay:<sha256(jti)> 1 NX EX <ttl>
```

- `NX` makes the insert-if-absent atomic across every worker sharing the Redis deployment.
- `EX` expires the key automatically; no cleanup process is needed.
- The key is a SHA-256 hash of the `jti`, so key length is bounded and the raw value is not
  exposed in Redis diagnostics.
- Any `redis.RedisError`/`OSError` becomes `AssertionUnavailable`, which `api/auth.py` maps to
  HTTP 503. The request is not accepted.

`MemoryReplayStore` remains for local development and the unit suite. It is process-local and is
refused when `APP_ENV` or `ENVIRONMENT` is `production`/`prod`. An `auto` backend with no Redis
URL (the default) therefore also fails closed in production. There is no production fallback to
process memory.

## 4. Configuration

| Variable | Required | Meaning |
| --- | --- | --- |
| `AGENT_ASSERTION_SECRET` | yes, 32+ chars | Shared HMAC secret; must equal the Frappe site's `agent_assertion_secret`. |
| `ASSERTION_REPLAY_BACKEND` | production: `redis` | `auto` (Redis if a URL is set, otherwise memory), `redis`, or `memory`. Unknown values fail closed. |
| `ASSERTION_REPLAY_REDIS_URL` | production: yes | Example shape `redis://redis.internal:6379/0`; supply credentials through the deployment secret store, never in source. |
| `APP_ENV` / `ENVIRONMENT` | recommended | `production`/`prod` forbids the memory backend and auto-without-Redis. |

The 60-second minted lifetime is unchanged; only the verifier's replay store changed.

## 5. Deployment notes

- **Topology:** every uvicorn worker and every API replica must point at the same Redis
  database/prefix. No sticky sessions are required.
- **Availability:** replay state is ephemeral by design. Persistence/AOF is not required for
  correctness after a restart (assertions live 60 s), but Redis availability is required for
  agent authentication. If Redis is down, text, AG-UI and voice turns return 503 until it
  recovers. That is the intended fail-closed trade-off.
- **Isolation:** use a dedicated Redis database or ACL user for this prefix, with no access to
  other application keys. The prefix is `loan-advisory:assertion-replay:`.
- **Capacity:** a claim lives at most 150 s. Memory is roughly `requests/second × 150 s ×
  ~100 bytes`, plus Redis overhead.
- **Latency:** the client uses a 1 s connect timeout and 1 s socket timeout. A healthy local
  Redis adds sub-millisecond lookup; a degraded one fails the request rather than hanging.
- **Secrets:** rotate `AGENT_ASSERTION_SECRET` in Frappe and FastAPI together. Rotation
  invalidates outstanding assertions; replay keys can be left to expire.
- **Test helper:** `ReplayGuard.reset()` / `RedisReplayStore.reset()` scan only this prefix and
  exist for tests. Production code must never call them.

## 6. Test coverage

`tests/test_assertion_replay.py` uses a minimal atomic fake server so two store instances can
stand in for two workers without a live Redis:

1. first use succeeds;
2. reuse in the same worker is rejected;
3. reuse from a different worker instance is rejected;
4. eight concurrent claims produce exactly one winner;
5. an expired assertion is rejected and never claimed;
6. malformed tokens are rejected;
7. wrong issuer or audience is rejected;
8. an unavailable store fails closed with `AssertionUnavailable`;
9. a fresh valid assertion still succeeds after a replay attempt;
10. the stored TTL is `exp + 90 s − now` (expiry plus skew);
11. `memory` is refused in production;
12. `auto` without Redis is refused in production.

## 7. Known limits

- The suite proves the verifier's use of an atomic `SET NX EX` contract against a fake server.
  Phase F then ran the real thing: Redis 7.4.9 with each worker a separate OS process
  (`tests/e2e/two_worker_check.py`, **11/11**) — reuse across processes rejected, budgets shared,
  graph checkpoints continued across three processes, memory backends refused in production.
  Two uvicorn workers behind a load balancer were still not exercised.
- Redis Cluster is not required for this single-key workload; if it is introduced, the key is
  already a single hash slot.
- The verifier still runs synchronously inside the async AG-UI handler. With timeouts capped at
  1 s a Redis outage delays that request but does not accept it; moving the check to a thread
  pool is a performance change, not a security gap.
