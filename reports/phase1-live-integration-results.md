# Phase 1.5 — Live Integration Verification: Results

Date: 2026-11-03 (IST). Branch `feat/agent-boundary-corpus-reset`, commits `b663df2` (fixes found by
this work) and `9fa900d` (the live suite). Plan: `reports/phase1-live-integration-plan.md`.
Environment inventory: `reports/phase1-environment-readiness.md`.

**Every result below was produced against a running service.** Nothing here is an offline fake
presented as an integration pass, and every non-pass is labelled as such.

## 1. Summary

| Service | Result | Detail |
|---|---|---|
| A — live Frappe | **PASS** (8 of 9 cases; 1 BLOCKED) | projected read, ownership both ways, stored evidence on the read identity, no-write proof, four failure modes |
| B — live Redis | **PASS** (7 of 7) | checkpoints, finite TTL, production refusal, budget counters, replay, isolation |
| C — live Qdrant Server | **BLOCKED** (0 of 4) | the application has no server-backed retrieval path to verify |
| D — live Langfuse | **PASS** (2 of 2 covering D1–D5) | real turn, readable observation, no content, telemetry-down unaffected |
| §7 cross-service journey | **PASS** (2 of 2) | portal-minted assertion → live HTTP → live Frappe → live Redis → replay refused |

Live suite: **19 passed, 1 skipped** (`tests/test_phase1_live_integration.py`). Offline regression after
the fixes: **763 passed, 35 skipped** — was 761/15; +2 tests from the rewritten projection assertions and
+20 skips because the new live module is inert without services.

## 2. Per-test results

### Service A — Frappe 16.51.0, site `loanportal.local` via the pinned proxy

| Test | Status | Evidence |
|---|---|---|
| A1 connectivity, auth, doctype, view surface | PASS | read of `ACC-LOAP-2026-00025` returned 200; `custom_lifecycle_state` present; the live view exposes exactly `{base_url, get}` |
| A1 read identity is not Administrator | PASS | HTTP 200 on `Loan Application` and `Loan Decision Evidence`; **403** on `API Key`, `DocPerm`, `Has Role`, `DocType` |
| A2 live read returns only the projected fields | PASS | 12 fields, `sorted(doc) == sorted(READ_FIELDS)`; `applicant_name`/`applicant_email_address`/`applicant_phone_number`/`zip_code`/`owner`/`modified_by`/`documents` all absent |
| A2 ownership enforced | PASS | owner's `owned_doc` succeeds; the other borrower's customer is refused for the victim's file and vice versa |
| A3 stored evidence readable on the read identity alone | PASS | with `EVIDENCE_FRAPPE_*` removed from the environment: `record_id` matches the pointer, `decision=REJECTED`, `application_ref` correct, `rule_evaluations`/`inputs`/`policy` present, `is_simulation` false |
| A3 bureau-backed evidence still projects | **BLOCKED** | no bureau-backed record exists on the disposable site (both stored records lack a `bureau` block). Provisioning requires running the bureau pipeline, which §2 forbids in this milestone |
| A4 an agent turn changes nothing | PASS | projected document identical before/after; **`modified` identical** (Frappe's own write stamp, read outside the projection); evidence row count identical (2 → 2) |
| A4 no writer in the live graph, no write grant in the role | PASS | `assert_reader` passes on the live store and evidence source; neither exposes `create`/`set_status`/`persist`/`call_method`/`put`/`post`/`delete`; site DocPerm: `Loan Reporter → Loan Application read=1 write=0 create=0 delete=0 submit=0`; `Agent Integration → Loan Decision Evidence read=1 write=0 create=0 delete=0 submit=0` |
| A5 failures fail closed | PASS | unknown application → `UnknownApplication`; bad credentials → `FrappeUnavailable`; unreachable host → `FrappeUnavailable`; unknown evidence id → `FrappeUnavailable`; no applicant data in the error text |

A4 used **no** write probes. Privilege was read from the site's permission metadata and from read
attempts against privileged doctypes.

### Service B — Redis 7.4.9, dedicated disposable instance

| Test | Status | Evidence |
|---|---|---|
| B1 connectivity | PASS | `PING`; `redis_version 7.4.9`; URL never rendered |
| B2 checkpoint survives between savers | PASS | written by one saver, read by a second: `checkpoint.id`, `channel_values.intent`, `metadata.step`; `put_writes` came back through `pending_writes` |
| B3 configured TTL applied | PASS | of the keys this run wrote under its own prefix, **all** had `ttl > 0`; the real agent run left **434** keys under `advisory:graph:v1:*`, every one with a finite TTL between 2 899 and 3 494 seconds of the configured 3 600 |
| B3 production refuses an unbounded store | PASS | `APP_ENV=production` + redis backend + no TTL → `CheckpointUnavailable: production checkpoints need AGENT_CHECKPOINT_TTL_S`, raised before a client is built; with `TTL=3600` the saver is built and the real server answers `PING` |
| B4 budget counters borrower-scoped and expiring | PASS | third call in a 2-call window raised `BudgetExceeded` with `retry_after > 0`; a second borrower still had room; every counter key had a positive TTL; all deleted afterwards |
| B4 replay claims single-use | PASS | first `claim()` true, second false on the live server; TTL positive; through `ReplayGuard` the second use raises `AssertionRejected` |
| B5 isolation | PASS | keyspace snapshotted before/after; every key this run added started with its own prefix; the foreign key set was **identical** before and after. Cleanup deleted only this run's prefixes. `FLUSHDB`/`FLUSHALL` never used |

### Service C — Qdrant Server

| Test | Status | Evidence |
|---|---|---|
| C1 connectivity | **BLOCKED** | no Qdrant container in `docker ps -a`; no server configured anywhere |
| C2 read-only retrieval through the application | **BLOCKED** | the serve path is `QdrantClient(path=path)` at `apps/api/src/loan_advisory/agent/runtime.py:126`; `url=` exists only on `DenseIndex.__init__` (the index **builder**); the only knob is `AGENT_QDRANT_DIR`, a directory; no `QDRANT_URL`/`:6333` reference exists in the repository |
| C3 isolation of competing-lender and adversarial sources | **BLOCKED** as a server test | filter behaviour itself is verified offline (`tests/test_bajaj_rag.py`: `pending_review` and competing-lender documents excluded before ranking), and that stays an offline result — it is **not** counted as a server pass |
| C4 non-mutation of the collection | **BLOCKED** | nothing to compare; the index was not rebuilt or touched |

Phase 1's write-path inventory described an embedded Qdrant directory. That description is accurate; the
gap is that no server-backed retrieval exists to verify. Per §5 the workstream stops here for an owner
decision rather than being closed with an embedded test relabelled.

### Service D — Langfuse 4.70.0, self-hosted, project `loan-advisory-local`

| Test | Status | Evidence |
|---|---|---|
| D1 connectivity, project auth, environment | PASS | `/api/public/health` → `{"status":"OK","version":"4.70.0"}`; `/api/public/projects` → `['loan-advisory-local']`; configuration `enabled/active` true, `environment local` |
| D2 a real turn is ingested | PASS | observation named `phase15.live.turn` found (3 rows in the last 200) after one live agent run + explicit `flush` |
| D3 integrity: name, latency, grouping | PASS | observation name present as created; `latency 0.124`; grouped by trace id |
| D4 privacy | PASS | `capture_content` false **and** no borrower sentence found in any returned `input`/`output` field of what actually arrived |
| D5 telemetry down does not break the answer | PASS | fresh interpreter with `LANGFUSE_BASE_URL=http://127.0.0.1:1`: agent answered, `error` null, its own audit row written, and that row carried no message text |

Caveat, stated rather than smoothed: `/api/public/traces` returned no rows on this instance while
observations were readable — consistent with the `events_only` deployment. D2/D3 were therefore verified
through the observations endpoint.

### §7 cross-service journey

| Test | Status | Evidence |
|---|---|---|
| Full borrower path over live services | PASS | portal login as the synthetic borrower; `mint_assertion` returned 200 with `application=ACC-LOAP-2026-00025`, `customer=Synthetic Borrower-eb352afe6e` and the thread it was asked to bind; `/api/chat` answered 200 with real content; projected document and evidence count unchanged afterwards; audit row written; live Redis state present; **resending the same assertion → 401** from the live replay store, and the refused call was **not** audited a second time |
| Cross-borrower request | PASS | the second borrower minting for the victim's application → **404**, the same status as a reference that does not exist, with no token in the response; minting for their own application → 200 with their own customer claim; a body-supplied `application_ref` pointing at the victim's file changed nothing, and the victim's reference never appeared in the response |

The mint path writes/refreshes an `Advisory Conversation` row. That is the portal's documented behaviour
when minting, not an agent write: the checks above cover `Loan Application` and `Loan Decision Evidence`,
both untouched.

## 3. Cleanup performed

- Redis: this run's prefixes deleted by pattern; then the disposable container itself removed
  (`p15-redis`, started with `--rm`, `--save '' --appendonly no`, so nothing persisted). The Frappe and
  Langfuse Redis instances were never reachable from this run and were not modified.
- Proxy: container `p15-acceptance-proxy` removed (`--rm`); its config was a temporary copy outside the
  repository with only the upstream port changed — the `Host`/`X-Frappe-Site-Name` pinning to
  `loanportal.local` was kept and verified, so no request could reach the shared site.
- Langfuse: no data deleted; the diagnostic observations age out under the project's own retention.
- Frappe: no record created, modified or deleted by this run. One `Advisory Conversation` row per mint,
  which is the portal's normal behaviour for an authenticated borrower.
- `data/source_archive/` remained untracked and untouched throughout.

## 4. Regression and review (§11)

| Step | Result |
|---|---|
| Eight Phase 1 boundary proofs (`tests/test_phase1_boundaries.py`) | 11 passed |
| Offline boundary suites (`test_agent_read_boundary` 18, `test_agent_write_paths` 12, `test_agent_dispatch_isolation` 34, `test_bureau_entry` 19, `test_bureau_port_config` 9, `test_agent_guards` 8) | all passed |
| Live suite | 19 passed, 1 blocked-on-fixture |
| Full suite, no services configured | 763 passed, 35 skipped |
| Ruff (`apps tests scripts`) | all checks passed |
| Pre-commit hook on both new commits | ran `git diff --cached --check` → staged ruff → the complete pytest suite; no bypass, no suppression |
| Diff scope | `git diff --name-only 964a0fc..HEAD` touches only `apps/`, `tests/`, docs and the Phase 1/1.5 reports; **no** `data/`, `config/`, `decision_engine/` or `runs/` path, so no Phase 2 corpus or index artefact was modified |
| `main`, PR #38, PR #41 | untouched |

Count change explained: 761 → 763 passed because the projection tests were rewritten to assert on the
response and two cases were added (missing application → `UnknownApplication`, unreadable evidence record
→ `FrappeUnavailable`). Skips 15 → 35 because the live module's 20 tests self-skip without services.
No test was weakened, no assertion removed, no skip added to hide a failure.

## 5. Remaining security risks after this milestone

1. **`p1loan.local` was never verified.** It is the shared site and §2 keeps it out of bounds, so every
   Frappe result above is for `loanportal.local`. The two sites run the same app version, but a site
   whose custom fields or DocPerms drifted would not be caught by this run.
2. **Field-level restriction was observed, not designed.** The read identity could list `User` rows but
   the response contained only `name` — email and other columns were stripped by the server. That is the
   behaviour we want, and it is the server's decision, not the agent's. A future role change could widen
   it; the A2 test is the tripwire, and it only runs live.
3. **Qdrant remains embedded-only** (C above), so the retrieval state directory is opened with a write
   lock by the serving process. A server-backed read path is the cleaner architecture and needs a
   decision, not a workaround.
4. **Bureau-backed explanation is unverified live.** The code path is tested offline against real stored
   records; against a live site it has no fixture. The gap is data provisioning, not code.
5. **`AGENT_CHECKPOINT_PREFIX` matters more than this run showed.** The real run wrote 434 keys under the
   default prefix in a shared-style namespace. Two deployments pointed at one Redis with the default
   prefix would read each other's threads. Worth making the prefix mandatory in production, the same way
   the TTL now is.
6. **Log-failure visibility is still only stderr** (carried over from Phase 1): a lost audit row or a
   handoff that could not be queued has no alert behind it.

## 6. Reproduce exactly

```bash
# 0. the stacks must already be up: `loanrangers-*` (Frappe) and `loan-advisory-langfuse-*`
docker ps --format '{{.Names}}' | grep -E 'loanrangers-backend-1|langfuse-web-1'

# 1. disposable Redis (its own instance; never reconfigure the shared ones)
docker run -d --rm --name p15-redis -p 127.0.0.1:6399:6379 \
  redis:7-alpine redis-server --save '' --appendonly no

# 2. pinned proxy for the disposable site. Copy the repo conf and retarget the ONLY thing that
#    differs between stacks here: this deployment runs gunicorn on 8000, not a bench dev server on 8001.
sed 's/server backend:8001/server backend:8000/' tests/e2e/nginx.loanportal.conf > "$TEMP/p15-proxy.conf"
docker run -d --rm --name p15-acceptance-proxy --network frappe_docker_default \
  -p 127.0.0.1:6081:8080 --add-host host.docker.internal:host-gateway \
  -v "$(cygpath -w "$TEMP/p15-proxy.conf"):/etc/nginx/conf.d/default.conf:ro" nginx:alpine
curl -s http://127.0.0.1:6081/api/method/frappe.ping          # {"message":"pong"}

# 3. environment: read the synthetic identities where the repo put them, never printing a value.
#    These lines go into this shell only; do not echo them.
set -a
. <(python -c "
import json,subprocess
fx=json.loads(subprocess.run(['docker','exec','loanrangers-backend-1','cat','/tmp/loanportal-e2e/manualqa1.json'],
      capture_output=True,text=True,check=True).stdout)
sc=json.loads(subprocess.run(['docker','exec','loanrangers-backend-1','cat',
      '/home/frappe/frappe-bench/sites/loanportal.local/site_config.json'],capture_output=True,text=True,check=True).stdout)
print(f'export FRAPPE_URL=http://127.0.0.1:6081')
print('export FRAPPE_API_KEY=' + fx['reader']['api_key'])
print('export FRAPPE_API_SECRET=' + fx['reader']['api_secret'])
print('export AGENT_ASSERTION_SECRET=' + sc['agent_assertion_secret'])
print('export P15_VICTIM_APP=' + fx['victim']['application'])
print('export P15_OTHER_APP=' + fx['other']['application'])
")
. <(python -c "
import re
for line in open('infra/langfuse/.env',encoding='utf-8'):
    m=re.match(r'^([A-Z0-9_]+)=(.*)$',line.strip())
    if m: print('export %s=%s' % (m.group(1), m.group(2).strip('\"')))
")
set +a
export AGENT_CHECKPOINT_BACKEND=redis \
       AGENT_CHECKPOINT_REDIS_URL=redis://127.0.0.1:6399/0 \
       ASSERTION_REPLAY_REDIS_URL=redis://127.0.0.1:6399/0 \
       AGENT_CHECKPOINT_TTL_S=3600 P15_REDIS_PREFIX='p15-live:' P15_FIXTURE_TAG=manualqa1
unset EVIDENCE_FRAPPE_URL EVIDENCE_FRAPPE_API_KEY EVIDENCE_FRAPPE_API_SECRET   # the agent must not need them

# 4. run it
PYTHONIOENCODING=utf-8 PYTHONPATH=".:apps/api/src" python -m pytest -q -rs tests/test_phase1_live_integration.py
# expected: 19 passed, 1 skipped (bureau-backed fixture)

# 5. teardown: containers were started with --rm; remove them and the temp conf
docker rm -f p15-redis p15-acceptance-proxy 2>/dev/null; rm -f "$TEMP/p15-proxy.conf"
```

Without step 3's variables the module skips cleanly, which is why it is committed and CI-safe.
