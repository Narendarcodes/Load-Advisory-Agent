# Disposable Frappe environment

How to run, seed, test and reset the **isolated** site the migration is developed against. This is an operator document for `loanportal.local` only.

> **Never point these steps at `p1loan.local`.** The shared site is served by the compose stack on `:8080` (`infra/frappe/loanrangers.yml:97`) and is owned by someone else. No migrate, install, fixture, seed, test or restore may run against it. `loanportal.local` exists only inside the backend container and is disposable by design.

## 1. Stack facts (verified 2026-10-30)

| Item | Value |
| --- | --- |
| Compose project | `loan-advisory` (containers `loanrangers-*`), `infra/frappe/loanrangers.yml` |
| Frappe image | `loanrangers-frappe:16` |
| Backend container | `loanrangers-backend-1` (no published ports) |
| Bench root | `/home/frappe/frappe-bench` |
| Bench CLI | 5.31.0 |
| Frappe / ERPNext / Lending | 16.51.0 / 16.50.0 / 16.6.1 |
| Portal app | `loan_advisory_portal` 0.1.0 |
| Python (bench env) | 3.14.8 at `/home/frappe/frappe-bench/env/bin/python` |
| Database | `mariadb:11.8`, container `loanrangers-db-1` |
| Redis | cache + queue, `redis:8.6-alpine` |
| Shared site (do not touch) | `p1loan.local` via nginx `:8080` |
| Disposable site | `loanportal.local`, dev server on `127.0.0.1:8001` **inside** the container |
| Test front door (host) | throw-away nginx on `127.0.0.1:8081`, pins every request to `loanportal.local` (`tests/e2e/nginx.loanportal.conf`) |
| Site apps | frappe, erpnext, lending, loan_advisory_portal |
| Site config keys | `agent_assertion_secret`, `livekit_api_key`, `livekit_api_secret`, `livekit_url`, `allow_tests`, `db_*`, `installed_apps` (values never printed) |

Two consequences worth remembering:

- The dev server port is **not published to the host**. The browser harness reaches it through a throw-away nginx container (section 4.1) that publishes only `127.0.0.1:8081` and rewrites `Host`/`X-Frappe-Site-Name` to `loanportal.local`, so a browser can never be routed to `p1loan.local`.
- The backend image has no `node` on `PATH`. The portal ships plain CSS/JS through a symlink, so no `bench build` is needed for it. The assistant island is built on the host (`cd apps/web/assistant && npm run build`) into `public/js/assistant/` and copied in; Node never runs inside the container. The build must define `process.env.NODE_ENV` (`vite.config.ts` does): library mode otherwise leaves that read in the bundle and the island dies in the browser with `process is not defined`.

### 1.1 Environment matrix

Variable **names** only; values are never recorded here. Frappe-side, agent-side and voice-worker variables are live in this worktree.

| Layer | Variables | Purpose |
| --- | --- | --- |
| Frappe site (`site_config.json`) | `agent_assertion_secret` (≥32 chars), `livekit_url`, `livekit_api_key`, `livekit_api_secret`, `allow_tests`, optional `loan_advisory_product`, bench-managed `db_*` | assertion signing, voice minting, test gate, product pinning |
| CopilotKit runtime (`apps/runtime`) | `AGENT_RUNTIME_HOST`, `AGENT_RUNTIME_PORT`, `AGENT_RUNTIME_BASE_PATH`, `AGENT_RUNTIME_AGENT_ID`, `AGENT_AGUI_URL`, `FRAPPE_BASE_URL` (default `http://localhost:8080`), `FRAPPE_MINT_PATH` (default the mint method), `FRAPPE_MINT_TIMEOUT_MS` (≥100, default), `AGENT_WEB_ORIGINS` (comma list, never `*`; defaults to the Frappe origin), `COPILOTKIT_TELEMETRY_DISABLED` (defaulted by code) | listen address, upstream AG-UI URL, the Frappe host it mints assertions from, allowed browser origins |
| FastAPI agent | `AGENT_ASSERTION_SECRET` (same value as the site `agent_assertion_secret`, ≥32 chars; the legacy `AGENT_SESSION_SECRET` bearer is retired), `LLM_MODEL`, `LLM_TIMEOUT_S`, `LLM_RETRIES`, `GROQ_API_KEY`, `OMNIROUTE_API_KEY`, `OMNIROUTE_BASE_URL` | assertion verification, LLM access |
| Agent data + tracing | `FRAPPE_URL`, `FRAPPE_API_KEY`, `FRAPPE_API_SECRET`, `FRAPPE_LOAN_COMPANY`, `FRAPPE_LOAN_PRODUCT`, `AGENT_STORE` (`mock` or live), `AGENT_TRACING`, `AGENT_TRACE_PROJECT`, `AGENT_TRACE_CONTENT` (off by default), `LANGFUSE_HOST` / `LANGFUSE_BASE_URL`, `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_TRACING_ENVIRONMENT`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME` | evidence sink, RAG store, Langfuse/OTel |
| Agent budgets (`AGENT_*_S`, `AGENT_CITATION_MODE`, `AGENT_FAST_CLASSIFY`, `AGENT_STREAM_BRIDGE`) | see `agent/settings.py` | per-turn deadlines and citation behaviour |
| Voice worker (`apps/voice`) | `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `FRAPPE_URL`, `FRAPPE_API_KEY`, `FRAPPE_API_SECRET` (an `Agent Integration` API key), `AGENT_HTTP`, `STT_HTTP`, `TTS_HTTP`, `VOICE_WORKER_PORT`, `VOICE_HTTP_TIMEOUT_S`, `VOICE_STREAM`, `VOICE_*_{S,GENDER}`, `VOICE_TURN_LOG` | LiveKit join, per-turn assertion exchange with Frappe, advisory HTTP calls, STT/TTS sidecars (`infra/voice/up.sh` binds them to `127.0.0.1`) |
| Reverse proxy (`infra/frappe/loanrangers.yml`) | `FRAPPE_SITE_NAME_HEADER`, `NGINX_LISTEN_PORT`, `BACKEND`, `SOCKETIO`, `CLIENT_MAX_BODY_SIZE`, `PROXY_READ_TIMEOUT`, `UPSTREAM_REAL_IP_ADDRESS`, `UPSTREAM_REAL_IP_HEADER`, `UPSTREAM_REAL_IP_RECURSIVE` | site header, upstreams, upload ceiling, real-IP trust |

Production topology (proposed, same-origin required):

```
browser ──HTTPS──► reverse proxy ──┬──► Frappe (pages, /api/method, /assets)
                                    ├──► CopilotKit runtime (/api/copilotkit)
                                    ├──► LiveKit (wss)
                                    └──► FastAPI agent (internal, never public)
```

- One public origin: the Frappe session cookie must be sent to the runtime path, so the runtime and the portal share a host. No wildcard CORS; `AGENT_WEB_ORIGINS` lists exact origins.
- FastAPI is reachable only from the runtime and the voice worker, never from the browser.
- The compose file currently pins `FRAPPE_SITE_NAME_HEADER: p1loan.local`; a disposable/production deployment must change it deliberately, not by accident.

No `.env.example` was added: every secret already has a documented owner (site config, bench env, process env), and a template file in the repo would invite values to be copied next to it.

## 2. First-time setup

Already done for `loanportal.local`; recorded so it can be rebuilt.

```bash
# inside loanrangers-backend-1
cd /home/frappe/frappe-bench
bench new-site loanportal.local --db-root-password <root> --admin-password <admin> --no-mariadb-socket
bench --site loanportal.local install-app erpnext
bench --site loanportal.local install-app lending
bench --site loanportal.local install-app loan_advisory_portal

# site secrets and test flag (names only; values live in the site config)
bench --site loanportal.local set-config allow_tests true
bench --site loanportal.local set-config agent_assertion_secret <32+ random chars>
bench --site loanportal.local set-config livekit_url <wss url>
bench --site loanportal.local set-config livekit_api_key <key>
bench --site loanportal.local set-config livekit_api_secret <secret>

# assets: expose public/ under /assets/loan_advisory_portal
ln -s /home/frappe/frappe-bench/apps/loan_advisory_portal/loan_advisory_portal/public \
      /home/frappe/frappe-bench/sites/assets/loan_advisory_portal
```

`install-app` runs `install.py:after_install` → `ensure_roles()` + `ensure_custom_fields()`. Both are idempotent and also run on `after_migrate`, so a migrated site always has the custom fields.

## 3. Deploy an app change into the container

The worktree lives on the host; the container mounts only `sites/`. Copy the app tree explicitly:

```bash
# host
docker cp apps/loan_advisory_portal/loan_advisory_portal/. \
  loanrangers-backend-1:/home/frappe/frappe-bench/apps/loan_advisory_portal/loan_advisory_portal/

# container
cd /home/frappe/frappe-bench
bench --site loanportal.local migrate        # when DocTypes/patches changed
# otherwise: the dev server's stat reloader picks up .py changes on next request
```

`docker cp` does not delete files removed in the worktree; if a module was deleted, remove it in the container too (the target is disposable and reconstructed from the worktree).

The assistant island is already in that tree after a build: `docker cp` also copies `public/js/assistant/` (~19 MB of chunks, mostly CopilotKit's lazy syntax-highlighting bundles). Change the island on the host, rebuild, and copy it **as its own directory**; there is no build step inside the container:

```bash
cd apps/web/assistant && npm run build
# container copy is root-owned, so delete it as root
docker exec -u root loanrangers-backend-1 rm -rf \
  /home/frappe/frappe-bench/apps/loan_advisory_portal/loan_advisory_portal/public/js/assistant
docker cp apps/loan_advisory_portal/loan_advisory_portal/public/js/assistant \
  loanrangers-backend-1:/home/frappe/frappe-bench/apps/loan_advisory_portal/loan_advisory_portal/public/js/assistant
```

Old hashed chunks are not deleted by `docker cp`; remove the directory first or the container keeps stale files.

## 4. Run the development server

```bash
docker exec loanrangers-backend-1 bash -lc '
  cd /home/frappe/frappe-bench/sites &&
  nohup /home/frappe/frappe-bench/env/bin/python -m frappe.utils.bench_helper \
    frappe --site loanportal.local serve --port 8001 > /tmp/loanportal-serve.log 2>&1 &'
```

- Log: `/tmp/loanportal-serve.log`
- Log format: one line per request with status; 500s include the traceback on stderr.
- The server runs with the reloader enabled (`stat` mode), so edits to copied Python are picked up without a restart.
- `bench serve` is also the only process that serves `/assets` here. Hitting gunicorn on `:8000` through the proxy returns 404 for every asset; keep the proxy pointed at `:8001`.
- If a restart is needed, find the listener without `ps` (the image may not ship `procps`):

```bash
for p in /proc/[0-9]*; do c=$(tr '\0' ' ' < "$p/cmdline" 2>/dev/null); \
  case "$c" in *8001*) echo "PID ${p#/proc/}: $c";; esac; done
kill <pid>
```

Only one process may hold `:8001`; a stale server after a container restart is the usual cause of "my changes are ignored".

### 4.1 Test front door (host, disposable only)

```bash
docker run -d --rm --name loanportal-e2e-proxy \
  --network frappe_docker_default -p 127.0.0.1:8081:8080 \
  --add-host host.docker.internal:host-gateway \
  -v "$(pwd)/tests/e2e/nginx.loanportal.conf:/etc/nginx/conf.d/default.conf:ro" nginx:alpine
```

- `http://127.0.0.1:8081` → `backend:8001` (Frappe pages, `/api/method`, `/assets`).
- `/api/copilotkit` → `host.docker.internal:4200` (the CopilotKit runtime).
- `Host` and `X-Frappe-Site-Name` are pinned in the config, never taken from the client.
- The container is `--rm`: **a Docker Desktop restart removes it** while the other compose services come back automatically. Re-run the command after every restart, and restart the dev server (section 4).

Start the two host processes in separate terminals:

```bash
# CopilotKit runtime
cd apps/runtime && AGENT_RUNTIME_PORT=4200 AGENT_AGUI_URL=http://127.0.0.1:8095/api/agui \
  FRAPPE_BASE_URL=http://127.0.0.1:8081 AGENT_WEB_ORIGINS=http://127.0.0.1:8081 node dist/index.js

# live FastAPI agent (env from the isolated env file; --no-rag skips the GPU retriever)
cd <repo> && set -a && . "<temp>/agent.env" && set +a && \
  PYTHONPATH=".;apps/api/src" python -u -m loan_advisory.agent.server --port 8095 --no-rag
```

On Windows the `PYTHONPATH` separator is `;`, not `:`.

## 5. Seed data

Browser-harness fixtures are repo code (`tests/e2e/`); earlier one-off `/tmp` scripts are obsolete.

| Piece | What it does |
| --- | --- |
| `loan_advisory_portal/tests/e2e_seed.py` | creates two borrowers (one rejected application with evidence, one private draft), an `Evidence Service` account (no DocType grants) and a read-only reader account; writes credentials **only** to `/tmp/loanportal-e2e/<tag>.json` (mode 600) and prints the application ids |
| `tests/e2e/seed_evidence.py` | records one authentic decision through the real policy pipeline (reader credentials for reads, dedicated evidence credentials for ingestion; disposable site only) |
| `tests/e2e/portal_journeys.py` | Playwright journeys (L4) |
| `tests/e2e/portal_security.py` | HTTP security regressions (L5) |

```bash
# container
bench --site loanportal.local execute loan_advisory_portal.tests.e2e_seed.seed --kwargs '{"tag": "e2e1"}'
docker cp loanrangers-backend-1:/tmp/loanportal-e2e/e2e1.json <host temp>   # then delete it in the container

# host
python tests/e2e/seed_evidence.py --seed <host temp>/e2e1.json --trace-dir <temp>/traces
python tests/e2e/portal_journeys.py --seed <host temp>/e2e1.json
python tests/e2e/portal_security.py --seed <host temp>/e2e1.json
```

`e2e_seed.teardown --kwargs '{"tag": "e2e1"}'` removes everything the seed created. The credentials file is a credential: keep it outside the repo and delete it after the run.

The seed scripts are test scaffolding and refuse to run on a site without `allow_tests`.

## 6. Run the tests

```bash
cd /home/frappe/frappe-bench
bench --site loanportal.local run-tests --app loan_advisory_portal
```

Expected: **169 tests, 0 failures** (last full run 2026-10-31). Per-module counts and the hardening addenda are in [the test plan](../testing/borrower-platform-test-plan.md); that document, not this setup guide, is the source of truth for counts.

The agent, voice-exchange, runtime and island suites run on the host, not in the container:

```bash
python -m pytest -q                                                                           # 683 passed, 15 skipped
PYTHONPATH=.:apps/api/src:apps/bureau/src python -m pytest tests/test_agent_api.py -q          # 14 tests
PYTHONPATH=.:apps/api/src:apps/bureau/src python -m pytest tests/test_voice_assertions.py -q   # 5 tests
cd apps/runtime && npm run typecheck && npm test                                              # 13 tests
cd apps/web/assistant && npm run typecheck && npm test                                        # 34 tests
```

Browser and HTTP regressions need the front door and both host processes from section 4.1:

```bash
python tests/e2e/portal_journeys.py --seed <temp>/e2e1.json    # 36 checks, screenshots
python tests/e2e/portal_security.py --seed <temp>/e2e1.json    # 39 checks
python tests/e2e/phase_h_checks.py --seed <temp>/e2e1.json --setup <temp>/setup.json  # 17 checks; voice BLOCKED
```

Single module while iterating:

```bash
bench --site loanportal.local run-tests --app loan_advisory_portal \
  --module loan_advisory_portal.tests.test_profile
```

## 7. HTTP smoke tests without a host browser

`curl` runs inside the container so `127.0.0.1:8001` is reachable. One-shot patterns:

```bash
# guest is redirected to login
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://127.0.0.1:8001/borrower

# guest JSON endpoint
curl -s http://127.0.0.1:8001/api/method/loan_advisory_portal.api.session.me

# authenticated call: reuse a cookie jar from /login, then include the CSRF header
curl -s -c /tmp/jar -o /dev/null \
  -d 'usr=borrower@example.invalid&pwd=<password>' http://127.0.0.1:8001/api/method/login
curl -s -b /tmp/jar -H 'X-Frappe-CSRF-Token: <token from /borrower>' \
  http://127.0.0.1:8001/api/method/loan_advisory_portal.api.applications.list_applications
```

The CSRF token for a session is published in the page bootstrap (`portal/jinja.py:portal_bootstrap`) and is required on every authenticated POST.

## 8. Reset (destructive, disposable site only)

```bash
cd /home/frappe/frappe-bench
bench --site loanportal.local drop-site --force --no-backup
# then repeat section 2
```

Before dropping, confirm the hostname: `bench --site loanportal.local ...` and nothing else. A drop of `p1loan.local` is unrecoverable and out of scope for this migration.

## 9. Failure modes seen so far

| Symptom | Cause | Fix |
| --- | --- | --- |
| `CSRFTokenError` on POST | token missing or from another session | read `boot.csrf_token` from the rendered page |
| New application shows `SUBMITTED` | Select default = first option | keep `DRAFT` first in `LIFECYCLE_STATES` (already pinned by a test) |
| `update_profile` always 403 | `frappe.call` forwards `cmd` into `**values` | `values.pop("cmd", None)` |
| `{"exc_type": "Forbidden"}` with no text | custom exception without `frappe.flags.error_message` | `PortalError.__init__` sets it (already fixed) |
| `/borrower/application` 500 `dict has no attribute …` | assigning attributes on the dict returned by `borrower_page` | assign items, not attributes |
| 404 shows Frappe "Server Error" page | exception raised through the renderer | return `not_found` context + `http_status_code = 404` |
| Tests: `PermissionError … access this file` | private `File` content-hash dedupe across users | unique PDF producer per fixture (already fixed) |
| Assets 404 under `/assets/loan_advisory_portal` | symlink missing | recreate it (section 2) |
| Changes ignored | stale dev server on `:8001` | kill it and restart (section 4) |
| Agent answers with no evidence after a re-seed | the agent still holds the deleted seed's API key | rewrite `FRAPPE_API_KEY`/`FRAPPE_API_SECRET` in the agent env from the new seed and restart the agent |
| `LinkExistsError` in `e2e_seed.teardown` | the application still links to its evidence | the fixture clears `custom_latest_evidence` first; copy the current fixture into the container |
| Proxy answers `502` | dev server on `:8001` is not running | restart it (section 4); the compose restart does not start `bench serve` |
| Front door missing after a Docker restart | it is a `--rm` container | re-run section 4.1 |
| Every asset 404s through the proxy | upstream points at gunicorn `:8000`, which serves no `/assets` | keep `backend:8001` |
| Island stuck on “Loading the assistant…” with `process is not defined` | bundle built without the `process.env.NODE_ENV` define, or the container still has an old copy | rebuild, delete the container directory, copy again (section 3) |
| `docker exec … rm` fails with `Permission denied` | copied files are root-owned | `docker exec -u root …` |
| `ModuleNotFoundError: loan_advisory` on Windows | `PYTHONPATH` used `:` | use `;` between paths |
| One stray 404 in the console on portal pages | browsers request `/favicon.ico` when no icon is declared | the layout now inlines an SVG icon; keep it |

## 10. Guardrails

- Every command in this document targets `loanportal.local`. There is no variant for `p1loan.local`.
- Secrets are set with `bench set-config` and never echoed; this document records key names only.
- The dev server is internal; do not publish `:8001` without an owner decision, because it would expose a test site with synthetic data and live secrets.
