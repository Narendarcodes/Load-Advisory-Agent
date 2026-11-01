# Environment lifecycle — start, work, stop

Part of the MVP closure bundle. Records what was already running, what this task started, every
persistent database write it made, the one machine-level change that happened (including the fact that
it happened under a scope that was later revised), and what the machine and the site look like now.

Raw captures: [`baseline/worktree-and-environment.txt`](baseline/worktree-and-environment.txt),
[`environment/services-started.txt`](environment/services-started.txt),
[`environment/teardown.log`](environment/teardown.log),
[`environment/teardown-verification.txt`](environment/teardown-verification.txt).

## 1. Baseline before anything was started

- Branch `feat/frappe-borrower-platform`, HEAD `7ec710e` — the HEAD the task reported.
- `git status --short`: **78 entries** (37 modified, 41 untracked), none staged. Against the previous
  bundle's 71-entry baseline the only additions are the seven files that bundle itself produced
  (`thread.ts`, `thread.test.ts`, `test_transcript_contract.py`, `island.test.tsx`,
  `thread_continuity_e2e.cjs`, `write_guard.cjs`, `write_guard_proof.cjs`) and nothing was removed, so
  **no other workstream touched this worktree in between**.
- Fifteen permanent containers `Up 7 hours`: nine `loanrangers-*`, six `loan-advisory-langfuse-*`
  (the Langfuse ones healthy). `:8080` and `127.0.0.1:3000` listening; `:8001`, `:8081`, `:4200`,
  `:8095`, `:8096` free. GPU: no compute processes.
- Site verified from `bench --site loanportal.local show-config`: `db_name` `_21ddc3370f18f30e`,
  `allow_tests: True`, apps `frappe, erpnext, lending, loan_advisory_portal`. Secret-bearing config
  values were read but are deliberately not reproduced in this bundle.

## 2. Started by this task

| Service | Where | Identifier |
| --- | --- | --- |
| Frappe dev server `:8001` | inside `loanrangers-backend-1` | container pids 16770 (bench) / 16988 (werkzeug) |
| Acceptance front door `127.0.0.1:8081` | the **existing** container `loanportal-acceptance-proxy` (`4bd676ee8025`), restarted rather than recreated | host forwarding pid 23420 (Docker Desktop) |
| CopilotKit runtime `127.0.0.1:4200` | host, `apps/runtime/dist/index.js` | host pid 40340 |
| AG-UI stub `127.0.0.1:8096` | host, `tests/e2e/agui_stub.cjs` | host pids 39744, then 44704 after it was restarted to point at the new fixture |

Deliberately never started: the live FastAPI agent on `:8095`, the RAG index, anything that allocates GPU
memory. Bring-up health checks and the exact commands are in
[`environment/services-started.txt`](environment/services-started.txt).

## 3. Persistent database writes, every one

All on the disposable `loanportal.local`; `p1loan.local` was never contacted. Each was preceded by the
required re-verification (site name, `db_name`, `allow_tests`, `@example.invalid` borrower identity, no
money-movement rows) which the scripts themselves enforce and refuse to bypass.

| # | Write | Mechanism | Evidence |
| --- | --- | --- | --- |
| 1 | `consent_at` restored to `2026-10-31 18:13:36` on `review.demo@example.invalid` | `frappe.get_doc()` + `document.save()` | [`database/restore-evidence.json`](database/restore-evidence.json), Version `97d9cnnkjd` |
| 2 | Four profile saves on the seeded fixture `mvp1-borrower@example.invalid` (employer, income, name+phone via the wizard, obligations) | the real UI, `update_profile`, declared to the guard | [`consent/db-after-browser-run.txt`](consent/db-after-browser-run.txt) |
| 3 | Fixture seeds: `nvda1`, `hygiene1`, `mvp1` (users, customers, applications, consents) | `e2e_seed.seed`, the repo's own fixture path | [`environment/services-started.txt`](environment/services-started.txt) |
| 4 | One synthetic conversation with two messages, to prove the teardown safeguard | `frappe.get_doc().insert()` | [`transcripts/teardown-hygiene-demo.json`](transcripts/teardown-hygiene-demo.json) |
| 5 | **Deletion of 111 conversations / 224 messages** (the approved synthetic set) | `frappe.delete_doc(..., delete_permanently=False)`, after export + revalidation | [`transcripts/delete-result.json`](transcripts/delete-result.json) |
| 6 | Deletion of the two fixture conversations created by this task's own browser runs | `frappe.client.delete`, the document API | [`conversation-list/conversation-list-after.json`](conversation-list/conversation-list-after.json) |
| 7 | Fixture teardowns (`nvda1`, `hygiene1`, `mvp1`): applications, profiles, users, conversations, customers | `e2e_seed.teardown` | teardown outputs, [`regression/db-counts-final.txt`](regression/db-counts-final.txt) |
| 8 | Deletion of four orphan `Customer` rows left by teardowns that ran before the fix | `frappe.delete_doc`, each verified unreferenced first | [`database/fixture-customer-cleanup.json`](database/fixture-customer-cleanup.json) |
| 9 | No-op validation save on `closure1-borrower` (the live proof that `validate()` no longer restamps) | `document.save()` with no field change | [`database/verify-restored-holds.json`](database/verify-restored-holds.json) |

Nothing else was written. `bench run-tests` was run twice; the business-table counts before and after it
are identical.

No SQL `UPDATE`/`DELETE`, no `frappe.db.set_value` on a consent or transcript field, no Version-table
edit, and no raw table surgery anywhere in this task — the scripts in this bundle are the only writers
and they are reviewed in place.

## 4. Machine-level change: NVDA 2026.3

This is the one thing on this list that changed the machine rather than the disposable site, and it
happened under the scope that was in force when it started.

- Downloaded from the official distribution only:
  `https://download.nvaccess.org/releases/2026.3/nvda_2026.3.exe`, 69,352,040 bytes,
  SHA-256 `a8a87cb823da0c62cfbae4a444ae5ae238d54dc82ad6d46d3fdb3fef082799b2`.
- Authenticode: **Valid**, signer `CN=NV Access Limited, O=NV Access Limited, L=Camp Mountain,
  S=Queensland, C=AU`, issuer GlobalSign GCC R45 CodeSigning CA 2020, product version 2026.3.
- Installed with the documented `--install-silent` switch, landing machine-wide at
  `C:\Program Files\NVDA` (registry entry `NVDA 2026.3`, version `2026.3.0.58174`). The revised task then
  arrived directing that NVDA not be installed at all.
- Consequences, stated plainly: **no screen-reader journeys were performed, no announcements were
  captured, no speech was simulated, and nothing in this bundle is a screen-reader result.** NVDA was
  running briefly (pid 42436, the `nvda_noUIAccess` build launched while reading its own help output) and
  was stopped; it is not running now. There is **no** start-at-sign-in entry — no `HKCU\...\Run` value,
  no `NVDA Startup Logon Task` — and no user configuration was written
  (`%APPDATA%\NVDA\nvda.log` shows `Not writing profile`).
- What should happen next is the owner's call, and it is a one-command decision: uninstall through the
  official uninstaller (`C:\Program Files\NVDA\uninstall.exe`), or keep it for the post-MVP accessibility
  work the revised scope defers. This task will not remove software it did not authorise itself to
  install in the first place, and it did not silently delete the launcher either: the downloaded
  installer is still at `%TEMP%\nvda-2026.3\nvda_2026.3.exe`.
- The earlier blocker document
  ([`../2026-11-01-findings-closure/screen-reader-blocker.md`](../2026-11-01-findings-closure/screen-reader-blocker.md))
  is left exactly as it was, since it is accurate history for its own run; the install above supersedes
  its machine facts, and the revised readiness report marks the item **DEFERRED — POST-MVP** rather than
  BLOCKED.

## 5. Shutdown

Stopped, in order, only what this task started
([`environment/teardown.log`](environment/teardown.log)):

| Service | Method | Result |
| --- | --- | --- |
| CopilotKit runtime (pid 40340) | `Stop-Process`, identity verified as `node` | stopped |
| AG-UI stub (pid 44704) | `Stop-Process`, identity verified as `node` | stopped |
| Frappe dev server `:8001` | `kill 16770 16988` inside the container | `:8001 no longer listening inside the container` |
| `loanportal-acceptance-proxy` | `docker stop` | `Exited (0)` — **not removed**, so its config and logs remain inspectable |

Unlike the previous run, no process needed a forced termination: `Stop-Process` succeeded on both node
processes, and the dev server and container stopped gracefully.

## 6. Verified after shutdown

From [`environment/teardown-verification.txt`](environment/teardown-verification.txt):

- No listener on `:8081`, `:4200`, `:8096`; `:8001` released inside the container; `:8095` was never
  opened.
- GPU: `nvidia-smi --query-compute-apps=pid,used_memory --format=csv` → header only, no compute process.
- All fifteen permanent containers still `Up 8 hours`, Langfuse ones still healthy; the site still serves
  (`/borrower/products` → 200, `frappe.ping` → `{"message":"pong"}`), probed with the `Host: loanportal.local`
  header Frappe routes on.
- No `docker rm`, no `system prune`, no volume or image touched.
- Credentials: this task's fixture files were copied out of the container to
  `%TEMP%\loanportal-e2e\<tag>.json` for the browser runs and deleted on both sides afterwards — the
  host directory is gone, the container directory is empty, and no credential appears in any document
  here. `/tmp/seed_applications.json` in the backend container was left untouched as instructed.

## 7. Status

| Claim | Status |
| --- | --- |
| Only the services started here were stopped; everything else preserved | **VERIFIED** |
| Ports released and GPU idle | **VERIFIED** |
| Every persistent write recorded, and none outside the disposable site | **VERIFIED** — nine entries in §3 |
| Fixture litter from this task removed | **VERIFIED** — three fixture teardowns plus four verified-orphan customers |
| The approved transcript set deleted, unrelated data intact | **VERIFIED** — see [`transcript-cleanup.md`](transcript-cleanup.md) |
| Machine-level NVDA change disclosed and its consequences bounded | **VERIFIED as disclosed**; its removal is an **owner decision**, and screen-reader testing remains **DEFERRED — POST-MVP** |
