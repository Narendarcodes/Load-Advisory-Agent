# Frappe Borrower Platform — Post-Audit Hardening Report

This report closes Phase I. It consolidates the independent audit (Phase A) and the hardening work
phases B1–H into one record, labelled by what was actually proven and how. It is documentation
only; it changes no runtime behaviour. Every number quoted in §9 is from the Phase H rerun made
after the last code change; numbers from earlier phases are labelled with the phase that produced
them and are never presented as current-run results.

Nothing in this report is a deployment. No live voice call, no SMTP/IdP delivery and no external
LLM/Langfuse integration is claimed.

## 1. Scope, labels and the six mandated documents

Three labels are used throughout, in this report and in the documents it indexes:

| Label | Means |
| --- | --- |
| **verified** | Proven by a run in this branch against the disposable site or the local test stack. The command and its current output are cited. |
| **test-only** | Proven only against local harnesses, fixtures or a disposable environment — a real reverse proxy container, a local Redis, a threaded dev server, an Edge browser — not against a deployment. |
| **unverified** | Not exercised. Includes everything explicitly **BLOCKED** because the environment lacks the dependency (a LiveKit server, a valid worker credential, an SMTP relay, an identity provider). |

The six mandated documents were updated in Phase I, each carrying these labels:

| Document | What it now records | Label |
| --- | --- | --- |
| [frappe-implementation-audit.md](frappe-implementation-audit.md) | The original findings, left intact, plus §7 post-audit status per phase and the current-run audit evidence in §4 | verified (findings: read-only) |
| [borrower-platform-test-plan.md](../testing/borrower-platform-test-plan.md) | The suite map and Addenda G and H, ending with the final full regression | verified (current run) |
| [screen-completion-matrix.md](../migration/screen-completion-matrix.md) | Every implemented screen with route, purpose, data, permissions, validation, states and acceptance; deferred screens with the owner decision that blocks each | verified (unit) / test-only (browser where listed) |
| [production-readiness.md](../testing/production-readiness.md) | The front door, shared state and bounded-load evidence, the deployment contract, residual risks, and §9 Phase H confirmation | test-only (disposable environment); **BLOCKED** where stated |
| [final-execution-report.md](../migration/final-execution-report.md) | The original migration record, superseded where necessary by §12 post-audit hardening status | verified (historical) / superseded per item |
| [hardening-baseline.md](../architecture/hardening-baseline.md) | The pre-migration baseline of the original worktree, retained with a banner; current state points here | verified (historical baseline) |

[frappe-borrower-platform.md](../architecture/frappe-borrower-platform.md) was also refreshed in
Phase G, because the preference vocabulary it describes changed. It is not one of the six.

## 2. Where the work happened and what was left untouched

All implementation and verification happened inside the separate worktree
`C:\Users\golla\Documents\Projects\Load-advisory-agent-frappe` on branch
`feat/frappe-borrower-platform`. The original worktree
`C:\Users\golla\Documents\Projects\Load-advisory-agent` (branch `docs/status-and-audit`) was not
modified, and its React frontend, CopilotKit Node runtime and unfinished work remain untouched.

The shared Frappe site `p1loan.local` was never contacted. The disposable site
`loanportal.local` and the container `loanrangers-backend-1` were used only for the tests in this
campaign, and every fixture, invitation, seeded customer and temporary credential directory created
for them was torn down afterwards. `.gitignore`, `.env`, `infra/langfuse/.env`, `.cada`,
`.freebuff` and the protected session HTML were not edited. No secret, API key, customer record or
PII is reproduced in any document.

No reset, clean or stash was run; no untracked file was deleted; no existing change was discarded;
no history was rewritten; and no commit, push, PR or merge was made.

## 3. What the audit found, and what closed it

The audit's blocking findings were three correctness/security defects and one structural pair, plus
a set of gaps. Each finding below is mapped to the phase that closed it and to the evidence that
proves the closure.

| Finding | Audit severity | Closure | Label |
| --- | --- | --- | --- |
| F-S01 — per-process replay cache; two workers accept the same `jti` | Critical | B1: Redis `SET NX EX` with expiry plus skew, fail closed, production refuses process-local memory | verified (unit + two-process Redis) |
| F-S02 — evidence writes unlinked and over-privileged | Critical | B2: dedicated least-privilege identity, server-side application↔evidence linkage, audit log, no Customer/decision write | verified (unit) |
| F-D01/F-D02 — two lifecycle vocabularies and two sources of truth | High | B3: one `loan-lifecycle/1` contract, atomic transitions, immutable audit log, reconciliation | verified (unit + browser resubmit) |
| F-S03/F-S04 — thread rebinding; asserted thread not compared with run thread | High/Medium | B5: first mint binds the thread, later mints refuse foreign account/application; AG-UI and chat routes require `claims["thread"] == input.threadId` | verified (unit + browser) |
| F-S05/F-S06/F-S07 — feedback DocPerm bypass, unscoped document types, invitation token in URL | Medium | B4: DocPerm removed with server-side validation, borrower-scoped document types, token stripped before first call plus `no-referrer` | verified (unit + browser) |
| F-S08/F-Z07 — proxy headers asserted, not tested | Medium | B4 unit invariants plus F live hostile-header proof | verified (unit) / test-only (live nginx) |
| F-S09/F-M07 — no borrower budgets outside invitation | Medium | B4/F: per-account portal fixed windows and per-`sub` agent budgets shared through Redis, fail closed | verified (unit + two-process) |
| F-M02/F-D04/F-U01–F-U03 — history bookkeeping dead or absent | High | B5: `record_turn`, `conversation_messages`, `list_conversations` wired to the island with ownership on every read | verified (unit + browser) |
| F-M04 — required screens missing | High | D: public help/products/terms/privacy, status guidance, resubmit path; deferred screens named in the matrix | verified (unit) / test-only (browser) |
| F-M01/F-T06 — no voice surface or consent | High | C: consent-gated UI, server preconditions, state events, transcript controls | test-only; live call **BLOCKED** |
| F-A01/F-A04/F-A06 — overstated "no duplicates", narrow ownership claim, suites run once | Medium | B3/B5/G contracts; H reran every browser surface | verified (current run) |
| F-T09 — browser suites historical | High | H: 36/36 journeys and 39/39 security rerun after the last code change | verified (current run) |
| Locale/literacy mismatch (`en/hi/mr`, `plain/standard` vs `en/hi/te`, `low/medium/high`) | High | G: one `borrower-preferences/1` contract shared by portal and agent, legacy values normalised on read | verified (unit) |

The audit's conclusion that the platform is **not production-ready** is unchanged, and for the same
structural reasons: no deployment, no SMTP/IdP, no live voice and no retention policy. What changed
is that the three blocking defects are closed and the claims in the earlier reports now agree with
the code.

## 4. Replay protection and shared state across workers

The single-use assertion guarantee no longer depends on one process. `api/assertion.py` claims a
`jti` with a single atomic `SET NX EX` against Redis, with the TTL set to the assertion expiry plus
a 90 s replay window, and raises `AssertionUnavailable` when the store cannot answer. In
production, `auto` without Redis and the process-local memory backend both refuse rather than
silently accept.

The unit evidence is `tests/test_assertion_replay.py` (12 tests: same-worker reuse, cross-worker
reuse, eight-thread concurrency with exactly one winner, expiry, malformed claims, wrong
issuer/audience, unavailable store, TTL, production refusals). The cross-process evidence is from
the **Phase F run** — it was not rerun in H, and the island change that followed does not touch the
store — and comprises separate OS processes against Redis 7.4.9: one token claimed by worker A is
refused by worker B, a 10/60 s budget split across processes allows exactly 10 turns and refuses
the 11th with `retry_after=40`, a graph thread continues `n=1→2→3` across three processes, and the
memory backends are refused when `APP_ENV=production`. That record is
[production-readiness.md §3](../testing/production-readiness.md#3-shared-state--11-of-11-checks-across-separate-processes)
(test-only).

The graph checkpointer (`agent/checkpoint.py`) is a Redis `BaseCheckpointSaver` with typed blobs,
ordered writes, a thread index and TTL **off by default**. `tests/test_shared_checkpointer.py`
proves two compiled graphs share one store. Checkpoint retention remains an owner decision (§10).

## 5. Least-privilege evidence service

Evidence no longer travels with the general read credential. `FrappeEvidenceSink` calls the trusted
method `loan_advisory_portal.api.evidence.ingest` with the `EVIDENCE_FRAPPE_*` identity only. The
`Evidence Service` role holds no DocType grants. The method validates
`expected_application == record.application_ref`, refuses record-id rebinding before the state
check, refuses simulations, writes only allowlisted lifecycle fields plus native status while
`docstatus == 0`, and inserts one `Evidence Ingestion Log` row per call.

`tests/test_evidence_api.py` proves valid persistence, refusal of an unrelated application,
refusal of rebinding, borrower and guest denial, no writes to Customer, Borrower Profile or decision
fields, no System Manager requirement, idempotency and the audit row. This is **verified** at unit
level. The E2E seed writer still holds elevated roles, so the seeded browser flow proves the flow
works with elevated rights, not with the intended least-privilege identity; that gap (F-T10) is
called out in the matrix and is not re-described here as closed.

## 6. Canonical lifecycle, correction path and screens

One contract, `config/loan_lifecycle.json` (schema `loan-lifecycle/1`), is loaded by FastAPI
(`application/lifecycle.py`) and by the portal's byte-identical vendored copy
(`portal/lifecycle.py`). It defines canonical states and transitions, a total
`native_status_for`, an `Open`-is-ambiguous `state_for_native`, collapsed automated transitions
with terminal refusal, and a pure `reconcile` that reports
`IN_SYNC`/`PENDING_LENDING`/`OUT_OF_SYNC`/`CONFLICT`/`UNKNOWN`. `Application State Log` is the
immutable transition history; submit, withdraw and evidence ingestion write it in the same
transaction as the state change.

`resubmit_application` is the correction path the audit found missing: it replaces the four scored
inputs on an `INFO_REQUESTED` application, returns it to `SUBMITTED`, keeps `docstatus = 1` and
Lending's `status`, freezes the loan terms and documents, and writes a `portal` state-log row. The
browser confirmed it in H: the correction panel became visible on an information-requested
application and a resubmit returned it to `SUBMITTED`.

Phase D completed the screens that do not depend on an owner decision — public help, products,
terms and privacy, plus status guidance driven by `portal/guidance.py` and complete over every
portal state. Owner-deferred screens (password reset, verification, notification centre,
notification preferences, a public landing page, a standalone what-if screen and support channels)
are listed with their blocking decision in
[screen-completion-matrix.md](../migration/screen-completion-matrix.md), not hidden behind the UI.
`tests/test_lifecycle_contract.py`, `tests/test_lifecycle.py`, the extended evidence suite and
`tests/test_screens.py` are **verified** at unit level.

## 7. Identity, agent boundary, proxy and browser headers

Identity is fixed by Frappe at mint and cannot be overridden downstream. `_touch_conversation`
creates the thread on first mint and afterwards refuses a foreign account (`Forbidden`) or a
different application (`Conflict`); `application`, `user` and `customer` are never rewritten. The
AG-UI route and both chat routes require the asserted thread id to equal the run thread id. Minting
moved inside the runtime's `fetch`, so Frappe 403/404/409/503 reach the browser as `RUN_ERROR`
with the real status instead of a false sign-out or a gateway 500.

The production template `infra/proxy/nginx.conf.template` pins `Host` and `X-Frappe-Site-Name` on
the portal, runtime and LiveKit paths; never reads `$http_host`, `$http_frappe_site_name`,
`$http_x_forwarded_for` or `$proxy_add_x_forwarded_for`; replaces `X-Forwarded-For` with
`$remote_addr`; answers a foreign `Host` with 421; redirects HTTP with a literal host; terminates
TLS 1.2/1.3; compresses assets; forwards WebSocket upgrades; and disables buffering for SSE.
`tests/test_production_proxy.py` (7) asserts the text invariants. The **Phase F run** (not rerun in
H; the template was not touched afterwards) proved 9/9 live checks against nginx 1.31.8, including
a foreign-`Host` request carrying a `sid` cookie getting 421 and an SSE gap of 1.000 s. That is
**test-only** evidence.

Response headers are added in `portal/headers.py`: `X-Content-Type-Options: nosniff`,
`Referrer-Policy: no-referrer`, `X-Frame-Options: SAMEORIGIN`, a `Permissions-Policy`, a strict CSP
on `/borrower*` (`script-src 'self' blob:`, `frame-ancestors 'self'`), HSTS only when the request
arrived over TLS, and `Retry-After` on 429. Phase H confirmed all of this in a real browser through
the test front door (§9).

## 8. Voice: test-only, live path BLOCKED

The assistant aside mounts a voice panel with explicit consent, real room connection states,
microphone mute, remote-audio attachment, End session, expiry auto-end and transcript
Hide/Show/Clear. Consent is a server precondition: `create_voice_session` refuses without it, stores
`consent_version` and `consent_at`, checks ownership before consent, and applies the `voice-session`
limit only afterwards; `voice_assertion` refuses a row whose consent version is missing or older, so
an unconsented room cannot process a turn. `tests/test_livekit.py`,
`tests/test_voice_assertion.py`, the island's `voice.test.ts` and `voice-panel.test.tsx` cover this.

Two things are explicitly **not** claimed. First, the worker still authenticates with the shared
`Agent Integration` key plus the row/room/identity check; consent adds no rotation or per-session
credential (F-Z06). Second, there is no LiveKit server, no voice-worker container and no valid site
credential in this environment — `livekit_url` is `wss://livekit.invalid` — so no live room join,
transcript flow or hang-up was exercised. The live path is **BLOCKED**, not passed.

## 9. Current-run regression evidence

Phase H reran every surface after the last code change (the island restore fix in §9.1), on the
disposable site `loanportal.local` through the test front door with a local Ollama model
(`qwen3.5:4b` via `LLM_BASE`). These are the only numbers in this report presented as current-run.

| Surface | Command | Current-run result |
| --- | --- | --- |
| Frappe L1 | `bench --site loanportal.local run-tests --app loan_advisory_portal` | **Ran 169 tests in 52.384s — OK** |
| Host Python | `python -m pytest -q` | **683 passed, 15 skipped in 55.19s** |
| Runtime | `npm run typecheck && npm test` (`apps/runtime`) | typecheck clean; **13 passed, 0 failed** |
| Island | `npm run typecheck && npm test` (`apps/web/assistant`) | typecheck clean; **34 passed (6 files)** |
| Browser journeys | `python tests/e2e/portal_journeys.py --seed <seed>` | **36/36** |
| HTTP security | `python tests/e2e/portal_security.py --seed <seed>` | **39/39** |
| Deferred B4 browser checks | `python tests/e2e/phase_h_checks.py --seed <seed> --setup <setup>` | **17/17** |
| Live voice | — | **BLOCKED** (no LiveKit server, worker or valid site credential) |
| Lint | `ruff check .` | All checks passed |

The 36 journeys cover session, dashboard, decision, private download, assistant
explain/what-if/refusal, history reset, wizard → upload → submit → withdraw, profile save, no
direct agent calls, no `Authorization` header, no console errors, and zero horizontal overflow at
390 px on five pages. The 39 security checks cover guests, IDOR on every surface, CSRF, conversation
ownership, replay/tamper, body override, cross-borrower answer isolation, voice refusal, CORS and
logout. The 17 targeted checks cover the full baseline header set and CSP on public and signed-in
pages, HSTS only when the request says it arrived over TLS, `Retry-After: 3038` on a spent profile
budget, the invitation token removed from the address bar before the first call and absent from
every later request, `Referrer-Policy: no-referrer`, and an `INFO_REQUESTED` panel whose resubmit
returned the application to `SUBMITTED`.

Outputs are under `tests/e2e/out/` (`journeys/journeys.json`, `security.json`,
`phase-h/phase_h.json`). The 15 skipped host tests are the documented opt-in live-environment gates
and Windows permission-bit cases; skipped is not passing, and none hides a failing area.

### 9.1 Finding and fix in H

The island's first mount asked `conversation_messages` for a thread id it had just generated, so the
server correctly answered 404 and the browser logged a failed resource. Nothing leaked and the
island handled it, but the request can never have stored rows. `thread.ts` now exposes
`storedThread()` and `island.tsx` skips the restore request for threads started in this page load
(initial mount, "New conversation", conflict reset); history items still restore. Island tests grew
by one. Journeys then reported zero console errors. The browser evidence was produced with a local
Ollama model, so answer wording is model-dependent; the checks are behaviour bounds, not exact
strings. Frappe → runtime → FastAPI → evidence was exercised; the production nginx template, TLS
and load were not part of this run.

## 10. Residual risks, owner decisions and reproduction

Still open, each with the decision it waits on:

| Item | State | Why it is open |
| --- | --- | --- |
| Password reset and email verification | **unverified / deferred** | No SMTP relay or identity provider; invitations remain operator-delivered. Owner decision. |
| Voice deployment | **BLOCKED / unverified** | No LiveKit server, TURN, worker deployment or per-session worker credential. Owner decision. |
| Checkpoint retention | **unverified** | `AGENT_CHECKPOINT_TTL_S` defaults to 0 (keep); the module will not invent a retention period. Owner decision. |
| Lending ↔ portal status synchronization | **unverified** | `reconcile` reports drift, but no inbound synchronization process exists; the policy is an owner decision. |
| CDN / ingress trust hop | **unverified** | Adding a CDN changes the `X-Forwarded-For` trust boundary; the template replaces it with the peer address, which would be the CDN. Owner decision. |
| Load and capacity | **test-only baseline** | The measured run used `bench serve` on one laptop container; it is not production capacity. |
| Least-privilege E2E seed | **test-only** | The seed writer holds System Manager + Loan Manager, so browser proofs run with elevated rights. |
| IPv6, HTTP/2 end-to-end, multi-hop forwarding, real devices | **unverified** | Not exercised. |

The front door and shared state remain **test-only**: everything was measured against a self-signed
certificate, a single-node Redis, one nginx container and a threaded dev server. There is no
deployment, no external service modification and no production credential.

Reproduce the current-run evidence:

```bash
# inside the disposable Frappe container
bench --site loanportal.local run-tests --app loan_advisory_portal

# host
python -m pytest -q
ruff check .
(cd apps/runtime && npm run typecheck && npm test)
(cd apps/web/assistant && npm run typecheck && npm test)
python tests/e2e/portal_journeys.py --seed <seed>
python tests/e2e/portal_security.py --seed <seed>
python tests/e2e/phase_h_checks.py --seed <seed> --setup <setup>
```

Each script writes its JSON under `tests/e2e/out/` and exits non-zero on a failed check.

The platform is a working prototype with real end-to-end behaviour and closed blocking defects, but
it is **not production-ready**: no deployment, no live voice call, no SMTP/IdP and no external
LLM/Langfuse integration is claimed.

No commits, pushes or merges were authorized.
