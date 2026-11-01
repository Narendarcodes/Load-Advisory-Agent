# Production readiness

What Phase F proved about the front door, the shared worker state and behaviour under
concurrency, and what is still an owner decision or unverified. Every number below is from a
run on 2026-10-31 in this branch; each section names the script and the JSON output it wrote.
Nothing here is a deployment. LiveKit remains **BLOCKED** (no server, no voice-worker
credential) and no live voice call is claimed. §9 records the Phase H browser confirmation of
the response headers and the deferred B4 checks, and restates what remains unverified.

## 1. Scope and environment

| Piece | What was actually run |
| --- | --- |
| Front door | `infra/proxy/nginx.conf.template`, rendered by the harness and run as `nginx:alpine` **1.31.8** in a throwaway container, with a self-signed certificate for `portal.test` and a local echo upstream. Script `tests/e2e/production_proxy_check.py`; output `tests/e2e/out/phase-f/production_proxy.json`. |
| Shared state | `redis:7-alpine` (**Redis 7.4.9**) on `127.0.0.1:6380`; every "worker" is a separate OS process running `tests/e2e/two_worker_scenario.py`. Script `tests/e2e/two_worker_check.py`; output `tests/e2e/out/phase-f/two_worker.json`. |
| Load | The same nginx template on the `frappe_docker_default` network in front of `bench --site loanportal.local serve --port 8001` (Werkzeug, threaded) in `loanrangers-backend-1`, TLS for `loanportal.local`. Script `tests/e2e/load_check.py`; output `tests/e2e/out/phase-f/load.json`. |

The shared site `p1loan.local` was not contacted. All ports are bound to `127.0.0.1`, the
Redis and nginx containers are removed by the harnesses in `finally`, and the echo upstream
only exists for the duration of the run.

## 2. Front door — 9 of 9 live checks passed

Each check is an assertion against a real request through the rendered config, not a text match
(the text-level invariants are covered separately by `tests/test_production_proxy.py`, 7 tests).

| Check | Measured result |
| --- | --- |
| `http_redirect_uses_literal_host` | `GET http://…/apply?step=2` with `Host: evil.example` → **308**, `Location: https://portal.test/apply?step=2` (literal host, no open redirect). |
| `healthz_204` | `GET /healthz` → **204**, answered by nginx without an upstream. |
| `foreign_host_rejected_421` | `GET /dashboard` with `Host: shared.example` and a `sid` cookie → **421**; the cookie never reaches another site. |
| `identity_headers_replaced` | Forged `X-Forwarded-For: 6.6.6.6`, `X-Real-IP: 6.6.6.6`, `X-Frappe-Site-Name: shared.example`, `X-Forwarded-Proto: http` → upstream saw `host=portal.test`, `x-frappe-site-name=portal.test`, `x-forwarded-for=172.17.0.1` (single address, not the claim), `x-real-ip=172.17.0.1`, `x-forwarded-proto=https`. |
| `runtime_path_pins_identity` | `/api/copilotkit/agent/run` with a foreign `Host` and site name → runtime upstream saw `host=portal.test`, `x-frappe-site-name=portal.test`, original path. The runtime forwards inbound `x-*` headers to the agent, so this path pins the site name as well. |
| `websocket_headers_forwarded` | `Upgrade: websocket` / `Connection: Upgrade` reached the upstream unchanged. |
| `sse_not_buffered` | Two events written 1.0 s apart arrived 1.000 s apart (`proxy_buffering off` on the runtime path). |
| `assets_gzipped` | 15,300 B identity → **162 B** gzip, `Content-Encoding: gzip` (that payload is the harness stylesheet; the portal stylesheet ratio is in §4). |
| `tls_versions_pinned` | TLS 1.0 and 1.1 handshakes refused, TLS 1.3 accepted. |

`tests/test_production_proxy.py` additionally asserts the template never uses `$http_host`,
`$http_x_frappe_site_name`, `$http_x_forwarded_for` or `$proxy_add_x_forwarded_for` in the
portal block, and that no shared site name appears in a directive.

### What the proxy does not do

- Client headers other than the pinned ones are still forwarded. The runtime sets
  `authorization` itself from the minted assertion and the agent treats unknown headers as
  unknown; this is accepted, not silently trusted. If a header must be authoritative, it must
  be pinned here.
- The `/livekit/` block is configured and was exercised only for header forwarding. No LiveKit
  server exists, so a real WebSocket session is **unverified**.

## 3. Shared state — 11 of 11 checks across separate processes

| Check | Measured result |
| --- | --- |
| `replay_first_claim_allowed` | Worker A verifies a freshly minted assertion → accepted. |
| `replay_reuse_refused_by_other_worker` | Worker B replays the same token → rejected `assertion has already been used`. |
| `replay_store_not_stuck` | Worker B verifies a second token → accepted (the store refused one token, not all). |
| `budget_ten_turns_across_two_workers` | Limit 10 / 60 s, alternating processes → exactly 10 allowed. |
| `budget_eleventh_turn_refused` | 11th turn → `exceeded`, `retry_after=40`. |
| `graph_turn_one_worker_a` | Thread `phase-f-thread-1`, turn `a` → `n=1`, `messages=["a"]`. |
| `graph_turn_two_worker_b` | New process, turn `b` → `n=2`, `messages=["a","b"]`, checkpoint id present. |
| `graph_turn_three_worker_a` | Another process, turn `c` → `n=3`, `messages=["a","b","c"]`. |
| `state_lives_in_redis` | Keys present under all three prefixes: `loan-advisory:assertion-replay:*` (2), `loan-advisory:budget:*` (1), `advisory:graph:v1:*` (17); replay TTL 174 s, i.e. token lifetime + 90 s replay window. |
| `production_refuses_memory_replay` | `APP_ENV=production` + memory backend → `unavailable: assertion replay cannot use process-local memory in production`. |
| `production_refuses_memory_checkpoint` | Same rule for `AGENT_CHECKPOINT_BACKEND=memory` → refused. |

Unit-level companion: `tests/test_shared_checkpointer.py` (8 tests, including two compiled
graphs sharing one store) and the existing replay/budget tests from B1/B4. The checkpointer is
wired in `apps/api/src/loan_advisory/agent/runtime.py`; both live and offline agents use
`build_checkpointer()`.

### Retention is an owner decision

`AGENT_CHECKPOINT_TTL_S` defaults to **0 (keep)**. The module refuses to invent a retention
period; the operator sets a TTL or a scheduled trim. Until then, conversation checkpoints grow
with usage. This is open.

## 4. Modest load measurement

240 page requests from 8 keep-alive sessions (30 each, round-robin over six URLs:
`/borrower/terms`, `/borrower/privacy`, `/borrower/help`, `/borrower/products`, `/login`,
`/assets/loan_advisory_portal/css/portal.css`), plus 400 `/healthz` requests from 16 sessions:

| Measure | Pages | `/healthz` |
| --- | --- | --- |
| Requests | 240 | 400 |
| Status | 240 × 200, 0 failures | 400 × 204, 0 failures |
| p50 | 119.4 ms | 8.3 ms |
| p95 | 202.4 ms | 50.7 ms |
| p99 | 270.4 ms | 161.8 ms |
| max | 332.3 ms | 210.9 ms |
| Throughput | 67.2 req/s | 724.5 req/s |

Compression through the same front door: `portal.css` 13,502 B identity → **4,315 B** gzip
(3.13×, `Content-Encoding: gzip`). Phase E's eager-island payload (3,157,229 B raw) is now
served compressed by this configuration.

**Caveats, stated plainly:** the upstream is Frappe's `bench serve` (Werkzeug, threaded) in one
container on this laptop, not gunicorn/uvicorn workers behind a real load balancer. There is no
LLM call, no authenticated journey and no asset fan-out in this run. These numbers show the front
door holds under concurrency and give a baseline; they are **not** production capacity and must
not be quoted as such.

## 5. Deployment contract

The template is rendered by the nginx image's `envsubst` hook — mount it as
`/etc/nginx/templates/default.conf.template` (or render it yourself) and provide:

| Variable | Meaning |
| --- | --- |
| `PORTAL_SITE` | The one public hostname and Frappe site name. No scheme, no trailing slash. |
| `FRAPPE_UPSTREAM` | `host:port` of the Frappe web server (compose service name in-network). |
| `RUNTIME_UPSTREAM` | `host:port` of the CopilotKit runtime. |
| `LIVEKIT_UPSTREAM` | `host:port` of a same-origin LiveKit server; required when voice is enabled. |

TLS material is read from `/etc/nginx/tls/tls.crt` and `tls.key`; renewal is outside this repo.
`/healthz` returns 204 and is suitable as the container health probe. Agent-side variables are
in `.env.example`: `ASSERTION_REPLAY_REDIS_URL`, `ASSERTION_REPLAY_BACKEND`,
`AGENT_CHECKPOINT_REDIS_URL`, `AGENT_CHECKPOINT_BACKEND`, `AGENT_CHECKPOINT_TTL_S`,
`AGENT_ASSERTION_SECRET`. With more than one worker, Redis is mandatory — the production
fail-closed checks above are the evidence that a missing or memory-only store refuses rather
than silently accepts.

## 6. Verified, local-only, and unverified

| Status | Item |
| --- | --- |
| **Verified in this run** | Header pinning and replacement; foreign-host 421; literal-host redirect; TLS versions; gzip; SSE unbuffered; WebSocket headers forwarded; single-use assertions, budgets and graph checkpoints shared across processes; production refusal of process-local memory; bounded load with zero failures. Phase H also verified in a browser, through the test front door: the baseline header set and CSP on public and signed-in pages, HSTS only when the request arrived with `X-Forwarded-Proto: https`, `Retry-After: 3038` on a spent budget, and the invitation token stripped from the address bar before the first request. |
| **Verified only in the disposable environment** | Everything above was measured against a self-signed certificate, a single-node Redis, one nginx container and a threaded dev server. No CDN, no external load balancer, no Redis Sentinel/cluster, no container resource limits. |
| **Unverified / BLOCKED** | LiveKit voice over TLS and WebSocket with a real token (no LiveKit server or voice-worker credential). A live LLM turn through runtime → agent in this exact topology (the runtime was not part of the load run; the browser journeys did exercise runtime → agent → evidence, but not through the production template or under load). IPv6, HTTP/2 end-to-end and multi-hop forwarding. Real client devices. |
| **Owner decisions still open** | Checkpoint retention; SMTP/identity for password reset; bureau budget policy beyond the 10/h count; CDN/ingress choice (which also decides where `X-Forwarded-For` trust is anchored). |

## 7. Residual risks

1. **Adding a CDN changes the trust boundary.** The template replaces `X-Forwarded-For` with the
   peer address. Behind a CDN that is the CDN's address; the correct change is one trusted hop
   header set at the ingress, never trusting a client-supplied chain.
2. **Redis is a hard dependency.** An outage is a 503 for new turns, not a fallback to
   process-local state — safe, but it makes Redis availability part of the portal's availability.
3. **Checkpoint growth is unbounded** until the retention decision above.
4. **Client `x-*` headers pass through beyond the pinned ones.** The runtime mints
   `authorization` itself, so identity cannot be forged this way, but new downstream code must
   not start reading an unpinned header.
5. **The load numbers are dev-server numbers.** Sizing needs a run with the real deployment
   topology (gunicorn/uvicorn workers, production asset serving).

## 8. Reproduce

```bash
python -m pytest -q tests/test_production_proxy.py tests/test_shared_checkpointer.py
python tests/e2e/production_proxy_check.py
python tests/e2e/two_worker_check.py
# load check needs bench serve on 8001 in the disposable backend:
docker exec -d loanrangers-backend-1 bash -lc \
  'cd /home/frappe/frappe-bench && exec bench --site loanportal.local serve --port 8001'
python tests/e2e/load_check.py
```

Each script writes its JSON under `tests/e2e/out/phase-f/` and exits non-zero on a failed check.

## 9. Phase H confirmation (final regression)

Run after the last code change, on the disposable site through the test front door:

| Check | Current-run result |
| --- | --- |
| Full suites | Frappe `Ran 169 tests in 52.384s — OK`; host `683 passed, 15 skipped`; runtime `13 passed`; island `34 passed`; `ruff check .` clean |
| Browser journeys | **36/36**, including streaming answers, what-if isolation, wizard → upload → submit → withdraw, zero console errors and zero 390 px overflow |
| HTTP security | **39/39**, including IDOR on every surface, CSRF, replay/tamper, body override and CORS |
| Deferred header/invite/resubmit checks | **17/17** — `tests/e2e/phase_h_checks.py`; output `tests/e2e/out/phase-h/phase_h.json` |
| Live voice | **BLOCKED** — no LiveKit server, worker process or valid site credential; no call is claimed |

The browser run used the local Ollama model through the generic `LLM_BASE`, so answer wording is
model-dependent and the checks are behaviour bounds. It exercised Frappe → runtime → FastAPI →
evidence, but not the production nginx template, not TLS, and not under load. Nothing in this
section changes the deployment status: this is still a tested local platform, not a deployment.
