# Changed files — MVP closure task

The reference point is this task's own opening snapshot: `git status --short` with **78 entries**
(branch `feat/frappe-borrower-platform`, HEAD `7ec710e`, recorded in
[`baseline/worktree-and-environment.txt`](baseline/worktree-and-environment.txt) before any edit). The
worktree now has **85 entries**. Diffing the two snapshots gives exactly seven new entries, and every
file below is also confirmed by `find … -type f -newer <previous bundle's final report>`.

Nothing was committed, pushed, merged, staged, reset or cleaned. No pre-existing modification was
discarded, and both earlier bundles are untouched (0 files newer than this task's start in
`2026-11-01/` or `2026-11-01-findings-closure/`).

## 1. Production code — 2 files

| File | Change | Why |
| --- | --- | --- |
| [`apps/loan_advisory_portal/loan_advisory_portal/loan_advisory_portal/doctype/borrower_profile/borrower_profile.py`](../../../../apps/loan_advisory_portal/loan_advisory_portal/loan_advisory_portal/doctype/borrower_profile/borrower_profile.py) | +28 / −1: the `validate()` one-liner replaced by a call to the new `sync_consent_timestamp()` | `consent_at` must record a consent event, not the last save. Grants without a stored timestamp are stamped; withdrawal clears it; an unchanged consent carries the stored value through; a value the caller set deliberately (the API's acceptance, or a historical restoration) is respected |
| [`apps/loan_advisory_portal/loan_advisory_portal/api/profile.py`](../../../../apps/loan_advisory_portal/loan_advisory_portal/api/profile.py) | +18 / −5 inside the existing consent loop | the profile page resends both checkboxes on every save, so the API stamped consent on unrelated edits too. It now stamps only when the acceptance changes the consent state or records a notice version that was not already recorded |

Combined diff: 39 insertions, 7 deletions. No new fields, no new DocTypes, no new endpoints, no change
to authentication, permissions, ownership checks, ZEN rules, the agent, the runtime or the island.

## 2. Test code — 4 files

| File | Change | Why |
| --- | --- | --- |
| [`apps/loan_advisory_portal/loan_advisory_portal/tests/test_consent.py`](../../../../apps/loan_advisory_portal/loan_advisory_portal/tests/test_consent.py) | **new**, 14 tests | the eight scenarios §3 requires, driven through the real document lifecycle (`insert`, `save`, `update_profile`) rather than a copied `validate()` |
| [`apps/loan_advisory_portal/loan_advisory_portal/tests/utils.py`](../../../../apps/loan_advisory_portal/loan_advisory_portal/tests/utils.py) | `make_borrower(..., consent: bool = True)` and the two fixture fields it controls | lets a test start from a profile with no consent so the first-consent path is real rather than described |
| [`apps/loan_advisory_portal/loan_advisory_portal/tests/e2e_seed.py`](../../../../apps/loan_advisory_portal/loan_advisory_portal/tests/e2e_seed.py) | `teardown()` now deletes each fixture borrower's `Advisory Conversation` documents and the fixture `Customer` rows, and reports `conversationsRemoved` / `customersRemoved` | this was the leak: a journey that held a conversation left borrower-visible transcripts behind the fixture. Demonstrated live in [`transcripts/teardown-hygiene-demo.json`](transcripts/teardown-hygiene-demo.json) |
| [`tests/e2e/README.md`](../../../../tests/e2e/README.md) | two new harness rows, two new run commands, the `APPLICATION`/`SUBMITTED_APPLICATION`/`DECISION_APPLICATION` note, and a fourth standing rule | documents the harnesses added here and the fixture-coupling mistake that produced 15 misleading console errors until it was fixed |

## 3. Browser harness — 5 files

| File | Change | Why |
| --- | --- | --- |
| [`tests/e2e/consent_regression_e2e.cjs`](../../../../tests/e2e/consent_regression_e2e.cjs) | **new** | browser-level consent regression: four real profile/wizard saves as a seeded borrower, guard attached with `update_profile` declared as this run's own write |
| [`tests/e2e/conversation_list_state.cjs`](../../../../tests/e2e/conversation_list_state.cjs) | **new** | renders the assistant history panel and reads `list_conversations` in one session; run with `LABEL=before`/`after` around a deletion |
| [`tests/e2e/borrower_views.cjs`](../../../../tests/e2e/borrower_views.cjs) | the three application routes now come from env and are skipped-and-reported when unset | they were hardcoded to one borrower's ids, so any other fixture produced 404s that looked like portal defects |
| [`tests/e2e/thread_continuity_e2e.cjs`](../../../../tests/e2e/thread_continuity_e2e.cjs) | `APPLICATION` is required instead of defaulting to a stale id | the same failure mode, caught as "the island never mounted" |
| [`tests/e2e/keyboard_review.cjs`](../../../../tests/e2e/keyboard_review.cjs) | the fixed "no screen reader installed" string replaced with a live check that also states the harness performs no screen-reader session | the old string would have become a false statement in the evidence once the machine changed |
| [`tests/e2e/package.json`](../../../../tests/e2e/package.json) | `consent` and `list` scripts | so the new harnesses are runnable the same way as the rest |

## 4. Evidence bundle — 195 files

[`2026-11-01-mvp-closure/`](./), all created by this task, no earlier file overwritten:

| Kind | Count | Notes |
| --- | ---: | --- |
| Documents | 6 | `consent-integrity.md`, `transcript-cleanup.md`, `regression.md`, `environment-lifecycle.md`, `changed-files.md`, `final-mvp-readiness-report.md` — plus the axe report the harness writes into `accessibility/` |
| Executable evidence scripts | 5 | the consent probe/restore/verify tool, the transcript classify/export/delete tool, the post-cleanup verifier, the fixture-customer cleanup, the teardown hygiene demo — each is the same file that ran in the container |
| SQL probes | 4 | pre-write reverification, attribution scan, post-restore integrity, table counts — all `SELECT` only |
| Machine-readable results | 22 JSON | restoration evidence, deletion manifest, delete result, browser run results |
| Screenshots | 133 PNG | five widths, before/after conversation list, consent profile page, KYC and GenUI states |
| Console captures | 22 TXT + 1 log + 1 TSV | suite output, DB probes, attribution scan |

No passwords, API secrets, cookies, session identifiers, PAN or Aadhaar values appear anywhere in the
bundle; fixture credentials lived only in `%TEMP%\loanportal-e2e\` and were deleted on both sides.

## 5. Generated build output

`apps/loan_advisory_portal/loan_advisory_portal/public/js/assistant/**` — 409 files regenerated by the
documented `npm run build`, which is part of the typecheck-and-build check. Not hand-edited; no island
source changed in this task, so the bundle content is semantically the same as the previous run.

## 6. Database changes, as a file report would list them

| Object | Change |
| --- | --- |
| `Borrower Profile` → `review.demo@example.invalid` | `consent_at` restored to `2026-10-31 18:13:36`; `modified`/`modified_by` moved with it; nothing else |
| `Version` | 110 → 111 — the one new auditable change record, `97d9cnnkjd` |
| `Advisory Conversation` | 163 → 52 (111 synthetic threads deleted; 13 ambiguous preserved; 22 other-owner intact) |
| `Advisory Message` | 352 → 128 (child rows deleted with their parents; 0 orphans before or after) |
| `Deleted Document` | 27 → 152 — Frappe's recoverable snapshots for the deletions above and the fixture teardowns |
| `Borrower Profile`, `Loan Application`, documents, decisions, state logs, `Customer`, `User`, `Loan*` | back to the opening baseline (7 / 14 / 12 / 1 / 8 / 15 / 15 / 0) after the fixture teardowns |

Every write is itemised with its mechanism in [`environment-lifecycle.md`](environment-lifecycle.md) §3.

## 7. Outside the repository

| Item | Where | Status |
| --- | --- | --- |
| NVDA 2026.3 | `C:\Program Files\NVDA` (installed by `--install-silent` before the revised scope arrived) | **present**; not running; no logon entry; removal is an owner decision — see [`environment-lifecycle.md`](environment-lifecycle.md) §4 |
| NVDA launcher download | `%TEMP%\nvda-2026.3\nvda_2026.3.exe` | kept, hash and signature recorded |
| Fixture credentials | `%TEMP%\loanportal-e2e\` | deleted, directory removed |
| Container-side scripts | `loanrangers-backend-1:/tmp/*.py` | this task's own copies; the app files deployed by `docker cp` match the repository |

## 8. Files deleted

None in the repository. Only this task's own scratch outside it (the fixture credential files), plus the
database records enumerated in §6, each with an export and a Frappe soft-delete snapshot behind it.
