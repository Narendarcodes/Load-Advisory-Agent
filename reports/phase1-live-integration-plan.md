# Phase 1.5 — Live Integration Verification: Plan

Date: 2026-11-03 (IST). Branch `feat/agent-boundary-corpus-reset`. Owner authorization: perform live
integration verification of Frappe, Redis, Qdrant Server and Langfuse, starting the services needed.
Results are in `reports/phase1-live-integration-results.md`; the environment inventory is in
`reports/phase1-environment-readiness.md`.

## 1. What this milestone is for

Phase 1 was implemented and tested offline: 761 passing tests, three mutation checks, and an explicit
statement that nothing had been run against live services. That statement is the reason for this step.
An offline fake can only prove that the code sends what it intends to send; it cannot prove the service
on the other end honours it. Two of Phase 1's central claims were exactly that kind of claim, and both
turned out to be wrong — see §4.

## 2. Preflight (executed before any service was started)

| Check | Result |
|---|---|
| `git fetch --all --prune` | done; branch 5 ahead of its own remote tip at start |
| Branch | `feat/agent-boundary-corpus-reset`, 0 behind `origin/main` |
| Five Phase 1 commits present | `61d3439` `bb06832` `9c54acf` `aba862b` `38581c6` — all ancestors of HEAD |
| Working tree | clean except the intentional untracked `data/source_archive/` (RBI sources, kept out of git by earlier decision) — reported, preserved, untouched |
| Phase 1 reports read | `phase1-security-boundaries.md`, `phase1-write-path-inventory.md`, `phase1-security-test-results.md` |
| Compose / launchers | `infra/frappe/loanrangers{,.isolated,.droplet}.yml`, `infra/langfuse/docker-compose.yml`, `infra/voice/up.sh`, `tests/e2e/nginx.loanportal.conf`, `docs/development/frappe-disposable-environment.md` |
| Secrets handling | no password, key, token or `.env` value printed at any point; configuration was reported as names and set/unset state only |
| Prior runtime state assumed? | no — every service, site, port, version and fixture below was re-measured in this session |

## 3. Plan per service

### Service A — live Frappe (A1–A5)

Site selection was decided before touching anything: `loanportal.local` and `repro.local` are
disposable development sites; `p1loan.local` is the shared site and was **not** used for anything.
The agent's own `.env` points at `http://127.0.0.1:8080`, which the shipped nginx serves as
`p1loan.local` (`server_name p1loan.local`, pinned `X-Frappe-Site-Name`) — so the run went through the
repository's own pinned proxy instead, and the proxy's pinning was verified rather than trusted.

| Test | Assertion |
|---|---|
| A1 | projected read succeeds; the `Loan Application` DocType resolves; the read identity is refused `API Key`, `DocPerm`, `Has Role` and `DocType` (proof it is not Administrator); the live view object exposes exactly `{base_url, get}` |
| A2 | the returned document contains **only** the 12 `READ_FIELDS`; `applicant_name`, `applicant_email_address`, `applicant_phone_number`, `zip_code`, `owner`, `modified_by`, `documents` are absent; ownership accepted for the owner and refused for the other borrower in both directions |
| A3 | stored `Loan Decision Evidence` read succeeds **with the ingest credential absent from the environment**; canonical keys present; a bureau-backed record still projects through `facts.bureau_facts` |
| A4 | before/after comparison of the projected document **and of Frappe's own `modified` column**; evidence row count unchanged across a real agent turn; DocPerm metadata shows read=1/write=0 for the roles the agent's identity carries |
| A5 | unknown application → `UnknownApplication`; bad credentials → `FrappeUnavailable`; unreachable host → `FrappeUnavailable`; unknown evidence id → `FrappeUnavailable`; error text carries no other applicant's data |

A4 deliberately performs **no** write probe. §3/A4 forbids speculative writes against persistent
records, and a rejected `PUT` is still an attempted mutation that would succeed the moment a grant is
misconfigured. Privilege is therefore read from the site's own permission metadata and from
read attempts against privileged doctypes.

### Service B — live Redis (B1–B5)

A **dedicated, disposable** Redis instance was started on `127.0.0.1:6399`
(`redis:7-alpine`, `--save '' --appendonly no`, `--rm`). The three Redis containers already running
(Frappe cache, Frappe queue, Langfuse) publish no host port and were not modified: reconfiguring a
shared stack to make a test reachable is exactly what this milestone must not do.

| Test | Assertion |
|---|---|
| B1 | connect, `PING`, server version; URL never printed |
| B2 | a checkpoint written by one saver instance is read back by a second one, with metadata and ordered pending writes |
| B3 | every key this run wrote carries a finite TTL; `APP_ENV=production` with no `AGENT_CHECKPOINT_TTL_S` raises before a client is built; with a TTL set, the same store is constructed and answers the real server |
| B4 | budget counters are borrower-scoped, refuse the call over the limit, and expire; replay claims are single-use and carry an expiry |
| B5 | the keyspace is snapshotted before and after the run: no key outside this run's prefixes changed or disappeared; cleanup deletes only this run's prefixes; no `FLUSHDB`/`FLUSHALL` anywhere |

### Service C — live Qdrant Server (C1–C4)

Inspected before any container was considered, as §5 requires. See §4 for the finding; the outcome is
BLOCKED and the workstream stopped.

### Service D — live Langfuse (D1–D5)

The already-running `loan-advisory-langfuse` stack was used as-is.

| Test | Assertion |
|---|---|
| D1 | `/api/public/health` OK; project authenticated and listed |
| D2 | a real agent turn produces an observation reachable by name and trace id |
| D3 | observation names, latency and grouping present |
| D4 | `capture_content` false **and** no borrower sentence present in any returned field — checked against what arrived, not against a setting |
| D5 | exporter pointed at a dead port **in a fresh interpreter**, because the provider is built once per process; the answer still completes, its own audit row is written, and that row carries no message text |

### §7 cross-service journey

One flow, verified service-side at each step rather than by the HTTP status alone: portal login as the
synthetic borrower → `mint_assertion` → agent HTTP surface with that assertion → live Frappe reads →
live Redis state → operational audit row → no business-data change → replay of the same assertion
refused. A second borrower asking for the first one's application is tested at the mint and through the
request body.

## 4. Findings that changed the plan

**The projected application read was not projected** (high). Frappe's single-document endpoint
`GET /api/resource/Loan Application/<name>` ignores a `fields` parameter and returned all 41 columns,
including `applicant_name`, `applicant_email_address`, `applicant_phone_number` and `zip_code`. The
Phase 1 code asked for 12 fields and got 41; the offline test asserted the outgoing parameter, so it
passed. The read was moved to the list endpoint filtered on `name`, which does honour `fields`
(verified: 12 fields, no PII, including for a `docstatus 0` draft), and the offline test was rewritten
to assert on the returned document against a fake that reproduces the real endpoint's behaviour.

**The "read-only" evidence reader still held the ingest credential** (high).
`loan_advisory_portal.api.evidence.get_record` is guarded by `_require_service()`, which demands the
`Evidence Service` role — measured live: 403 for the agent's read identity, 200 for the evidence
identity. Routing the agent through that method therefore kept a write-capable secret inside the
conversational process, which is the condition P0.1 exists to remove. The site's own DocPerm rows give
`Agent Integration` read=1/write=0/create=0/delete=0 on `Loan Decision Evidence`, so the agent now reads
the stored document on the identity it already has and `EVIDENCE_FRAPPE_*` is never consulted in this
process.

Both were fixed in `b663df2` before the results were measured, and both are recorded with their evidence
in the results report.

**Qdrant Server is not an integration the application has** (blocking, §5 outcome). The retrieval
runtime's serve path is `QdrantClient(path=path)` at `apps/api/src/loan_advisory/agent/runtime.py:126`;
`url=` exists only on `DenseIndex.__init__`, i.e. the index **builder**; the sole environment knob is
`AGENT_QDRANT_DIR`, a directory; no `QDRANT_URL` or `:6333` reference exists anywhere in the
repository; and no Qdrant container was present. There is no server-backed retrieval path to verify, so
testing the embedded collection would have been a fabricated green. C1–C4: **BLOCKED**, needing an
explicit architecture decision from the owner (§5 of the task).

**A bureau-backed evidence fixture does not exist on the disposable sites.** Every application with a
stored evidence pointer on `loanportal.local` was checked: two records, neither carrying a `bureau`
block. Producing one means running the bureau pipeline, which §2 forbids here ("Do not start or invoke
an external credit bureau service"), so A3's bureau case is **BLOCKED** with the provisioning need
stated, not worked around.

## 5. Fixtures

All identifiers, no secrets. Provisioned earlier by the repository's own
`loan_advisory_portal/tests/e2e_seed.py`, which writes credentials to `/tmp/loanportal-e2e/<tag>.json`
(mode 600) **inside** the Frappe container; this run read that file in-process and never rendered a
value.

| Slot | Value |
|---|---|
| tag | `manualqa1` |
| victim borrower | `manualqa1-borrower@example.invalid` / customer `Synthetic Borrower-eb352afe6e` |
| victim application | `ACC-LOAP-2026-00025` — `docstatus 1`, lifecycle `REJECTED`, evidence pointer `c09ae6a3-c7a1-5920-b266-d9e4df288ff8` |
| second borrower | `manualqa1-other@example.invalid` / `Synthetic Borrower-f6d29c1622` |
| second application | `ACC-LOAP-2026-00026` — `docstatus 0`, lifecycle `DRAFT`, no evidence |
| read identity | `manualqa1-reader@example.invalid`, roles `Agent Integration` + `Loan Reporter` |
| ingest identity | `manualqa1-evidence@example.invalid`, role `Evidence Service` — **not** made available to the agent |

Test-created state: Redis keys under `p15-live:*` plus the run's own checkpoint/replay keys in a
disposable instance; one `Advisory Conversation` row per mint (portal-side by design — it is not an
application or evidence write); Langfuse observations named `phase15.live.turn`; agent logs under
pytest `tmp_path`. Cleanup is in §3 of the results report.

## 6. Classification rule used

`PASS` executed against the real service and asserted; `FAIL` executed and an assertion failed;
`BLOCKED` the service, credential, supported integration or fixture is absent; `NOT RUN` deliberately
not executed. Mocks and offline fakes were not counted as live passes anywhere in these reports.
