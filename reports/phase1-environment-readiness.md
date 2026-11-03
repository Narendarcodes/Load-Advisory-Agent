# Phase 1.5 — Environment Readiness

Date: 2026-11-03 (IST). Machine: Windows 11 (10.0.26200) x64, CPython 3.14.4, Docker engine 29.8.1.
Endpoints and versions were measured in this session; nothing is carried over from an earlier run. No
secret value appears in this document, and none was printed while it was assembled.

## 1. Service inventory at preflight

| Service | State found | Identity used for verification |
|---|---|---|
| Frappe 16.51.0 + ERPNext 16.50.0 + Lending 16.6.1 + `loan_advisory_portal` 0.1.0 | **already running**, compose project `loanrangers` (backend, frontend, worker queues, scheduler, websocket, MariaDB 11.8, redis-cache, redis-queue) | `manualqa1-reader@example.invalid` — roles `Agent Integration` + `Loan Reporter` |
| Langfuse 4.70.0 (web, worker, postgres 17, clickhouse 25.12, minio, redis 7) | **already running**, project `loan-advisory-local`, health `OK` | keys in `infra/langfuse/.env` |
| Redis (Frappe cache + queue) | running, **no host port published** — not used and not modified | — |
| Redis (Langfuse) | running, no host port — not used and not modified | — |
| **Qdrant** | **absent**: no container, no service in any compose file, and no server-capable code path in the serving runtime | — |
| Synthetic bureau service | not started, and §2 of the task forbids starting it | — |

Sites present in the bench, with fixture counts read live:

| Site | Loan Applications | Decision Evidence | Used here? |
|---|---:|---:|---|
| `p1loan.local` | 41 | 48 | **No verification ran against it.** The shared site, and the one the shipped frontend pins (`server_name p1loan.local`, `X-Frappe-Site-Name` hardcoded). Two read-only counts were taken to identify which site the shared frontend serves and to size the fixture gap; nothing was written, and no agent or proxy request reached it |
| `loanportal.local` | 17 | 2 | **Yes** — disposable, reached only through the site-pinned proxy |
| `repro.local` | 6 | 1 | inspected for fixtures only; not used for the journey |

## 2. What was started for this milestone, and how it was removed

| Container | Why | Removed |
|---|---|---|
| `p15-acceptance-proxy` (`nginx:alpine`, `--rm`) | 8080 serves the protected site; the disposable site is reachable only through the repo's pinned proxy | yes, `docker rm -f` after the run |
| `p15-redis` (`redis:7-alpine`, `--rm`, `--save '' --appendonly no`, `127.0.0.1:6399`) | nothing Redis-publishing existed and the shared instances publish no port; reconfiguring a shared stack to make a test reachable would be the wrong trade | yes, `docker rm -f` — with no persistence and `--rm`, its keyspace left with it |

Two deliberate deviations from the documented launcher, both recorded rather than smoothed over:

1. `tests/e2e/nginx.loanportal.conf` targets `backend:8001` (a bench dev server, which the Phase 9
   harness starts separately). This deployment runs gunicorn on `8000`, so the first proxy attempt
   returned 502. A temporary copy outside the repository changed **only** the upstream port; the
   `Host: loanportal.local` and `X-Frappe-Site-Name: loanportal.local` pins were kept and verified, and
   a request that tried to name another site could not get there. The repo file was not edited.
2. The repository documents sourcing a temp `agent.env` that does not exist on this machine, and
   `.env` carries no service credentials. The run therefore read the synthetic identities where the
   repository's own seeder puts them — `/tmp/loanportal-e2e/<tag>.json` (mode 600) inside the Frappe
   container — and the site's assertion secret from its own `site_config.json`, in-process. Values were
   assigned to environment variables and never rendered.

## 3. Configuration state found

`​.env` (this worktree):

| Slot | State | Consequence |
|---|---|---|
| `FRAPPE_URL` | set → `http://127.0.0.1:8080` | points at the **shared** site; live verification used the pinned proxy on a loopback port instead |
| `FRAPPE_API_KEY`, `FRAPPE_API_SECRET` | present as keys, **empty** | no live Frappe path configured; filled from the seeder's fixture file for this run |
| `FRAPPE_P1_APP` | set | unused here |
| `LOAN_POLICY_DIR` | set to a `runs/policy_local` path that **does not exist** | the retriever cannot load in this worktree today; consistent with Service C being blocked |
| `LLM_PROVIDER`, `LLM_MODEL`, `GROQ_API_KEY` | set | not used — the live suite runs a deterministic stand-in composer so a failure is never blamed on a provider |
| `OMNIROUT_API_KEY` | present | known misspelling of `OMNIROUTE_API_KEY` (carried over, not touched) |
| `AGENT_ASSERTION_SECRET` | **absent** | was taken from the site's own `agent_assertion_secret` for the journey, which is precisely the pairing the server demands |
| `ASSERTION_REPLAY_REDIS_URL`, `AGENT_CHECKPOINT_*` | **absent** | pointed at the disposable instance for Service B |
| `EVIDENCE_FRAPPE_*` | **absent** | correct, and now a tested property: the agent must not need them. `A3` asserts the evidence read succeeds with them unset |
| `LANGFUSE_*` | absent from `.env`, present in `infra/langfuse/.env` | used via that file, as documented |

`infra/langfuse/docker-compose.yml` is the only compose file in this repository; the Frappe stack is
launched from a generated compose file outside the repo (`%TEMP%\opencode\frappe_docker\loanrangers.yml`),
so its configuration is not version-controlled here. Worth knowing when reproducing this environment.

## 4. Deployment settings required to run the secured agent

State after Phase 1 and this milestone; `.env.example` and `docs/development/environment-variables.md`
now say the same thing.

| Setting | Needed by | Rule as it now stands |
|---|---|---|
| `FRAPPE_URL` / `FRAPPE_API_KEY` / `FRAPPE_API_SECRET` | agent | a **read-only** identity (`Agent Integration` + `Loan Reporter`). Verified live: 200 on `Loan Application` and `Loan Decision Evidence`, 403 on `API Key`, `DocPerm`, `Has Role`, `DocType` |
| `AGENT_ASSERTION_SECRET` | agent | required, ≥32 chars, must equal the site's `agent_assertion_secret`; startup fails otherwise |
| `EVIDENCE_FRAPPE_*` | **bureau/decision pipeline only** | the agent never reads these. Giving them to an agent deployment re-introduces the exact condition boundary B removed; the README and `.env.example` now say so |
| `ASSERTION_REPLAY_REDIS_URL`, `AGENT_CHECKPOINT_REDIS_URL`, `AGENT_CHECKPOINT_BACKEND` | agent | production may not fall back to process-local state |
| `AGENT_CHECKPOINT_TTL_S` | agent | **mandatory in production**: unset/zero now refuses to start |
| `AGENT_CHECKPOINT_PREFIX` | agent | set it per deployment. Measured live: one run wrote **434** keys under the default `advisory:graph:v1:` namespace. Two deployments sharing a Redis on the default can read each other's threads |
| `AGENT_LOG_MAX_BYTES` | agent | cap per active JSONL log; rotation renames, never deletes |
| `AGENT_STATE_DIR`, `AGENT_AUDIT_LOG`, `AGENT_HANDOFF_LOG` | agent | unchanged precedence; new files 0600, new directories 0700 |
| `LOAN_POLICY_DIR`, `AGENT_QDRANT_DIR` | agent (RAG on) | a local directory today; see §5 |
| `LANGFUSE_ENABLED`, `LANGFUSE_BASE_URL`, keys, `LANGFUSE_CAPTURE_CONTENT` | agent | optional; content capture off is the default and was verified against what actually arrived |
| `--bureau-url`, `BUREAU_BASE_URL`, `POST /api/bureau/run` | — | **removed.** Nothing in compose, launchers, `.env*`, docs-as-config or the runtime still references them except tests asserting their absence |

Health checks that exist: `GET /healthz` on the agent; `/api/public/health` for Langfuse; `frappe.ping`
for the site; `PING` for Redis. There is no readiness probe that proves the agent's Frappe identity is
still read-only — that is a test, not an endpoint.

## 5. Not ready — what needs a decision or provisioning before the live gate can close

| # | Gap | What it blocks | Who can close it |
|---|---|---|---|
| 1 | **Qdrant Server is not an architecture the application has.** The serve path is `QdrantClient(path=...)` (`runtime.py:126`); `url=` exists only on the index builder; no `QDRANT_URL` anywhere; no container | Service C entirely (C1–C4) | Owner decision: either wire a server-backed read path and stand up the service, or formally adopt embedded Qdrant and drop "Qdrant Server" from the Phase 2 entry gate |
| 2 | **No bureau-backed evidence fixture** on either disposable site (both stored records have no `bureau` block) | A3's bureau case, and part of §7's "previously stored synthetic bureau evidence" | Run the bureau pipeline process against a disposable site, or import a recorded synthetic bureau run. Not done here because §2 forbids starting a bureau service |
| 3 | **The shared site is unverified.** `p1loan.local` holds the richest data (41 apps / 48 evidence) and is out of bounds | confidence that the projection and the evidence-document read behave the same there | Owner: either authorize a read-only pass against it, or accept that the dev-site result stands |
| 4 | **`LOAN_POLICY_DIR` in `.env` points at a path that does not exist** | any live RAG check in this worktree | Provision: materialize or repoint the index directory (Phase 2 will rebuild it anyway) |
| 5 | **No `.env` service credentials and no `agent.env`** | reproducing this milestone without the ad-hoc fixture sourcing described in §2 | Owner: decide where local service credentials live; `.env.example` documents the slots |
| 6 | **Telemetry has no traces listing** on this deployment (`/api/public/traces` empty while observations are present), consistent with `events_only` | a trace-level integrity check by id | Accept the observations-API check, or reconfigure the Langfuse deployment |
| 7 | **No alerting behind the two operational logs** | noticing a lost audit row or an unqueued handoff | Ops wiring, outside this milestone |

Items 1 and 2 are the only ones that block a *gate*; 3–7 are gaps in coverage or comfort.

## 6. Isolation properties of this environment, as measured

- The agent's Frappe identity cannot read `API Key`, `DocPerm`, `Has Role` or `DocType` (403 each), so
  the credential cannot enumerate its own permission model or another tenant's keys.
- A `User` list read by that identity returned rows but only the `name` column — email and other
  columns were stripped server-side. Field-level restriction is working, and it is the *server's*
  decision, not the agent's: a future role edit could widen it. The live test is the tripwire.
- No request that entered the proxy could name a site other than `loanportal.local`: the proxy pins
  `Host` and `X-Frappe-Site-Name` itself.
- The Redis used was a separate instance holding nothing else; the run's key namespace before and after
  is in the results report.
- The bureau service was never started, and after Phase 1 boundary A the agent has no code path that
  could call it even if one were listening.
