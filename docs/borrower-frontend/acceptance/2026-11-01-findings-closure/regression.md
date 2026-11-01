# Regression results — executed 2026-11-01

Every number below is from a command run in this session on the current worktree
(`feat/frappe-borrower-platform`), written to
[regression/](regression/). Baselines are the figures recorded in the 2026-11-01 acceptance report and
are shown only for comparison. Raw output files are named in the table so each claim can be checked.

## 1. Suites

| Suite | Command | Baseline | This run | Result |
| --- | --- | --- | --- | --- |
| Host repository suite | `python -m pytest -q` | 685 passed / 15 skipped | **685 passed, 15 skipped**, 2 warnings, 41.01s ([host-pytest.txt](regression/host-pytest.txt)) | match |
| Frappe portal app | `docker exec loanrangers-backend-1 bench --site loanportal.local run-tests --app loan_advisory_portal` | `Ran 171 tests … OK` | **`Ran 179 tests in 46.065s` / `OK`** ([frappe-portal-tests.txt](regression/frappe-portal-tests.txt)) | +8, the new transcript-contract module |
| KYC page module | same, `--module loan_advisory_portal.tests.test_kyc_page` | `Ran 2 tests … OK` | **`Ran 2 tests in 1.269s` / `OK`** ([frappe-kyc-tests.txt](regression/frappe-kyc-tests.txt)) | match |
| Island unit tests | `npm --prefix apps/web/assistant run test` | 72 passed (9 files) | **86 passed (10 files)**, 7.16s ([island-tests.txt](regression/island-tests.txt)) | +14, thread-contract tests |
| Runtime gateway | `npm --prefix apps/runtime run test` | 13 passed | **13 tests, 13 pass, 0 fail**, 10.045s ([runtime-tests.txt](regression/runtime-tests.txt)) | match |
| Island typecheck + build | `npm --prefix apps/web/assistant run build` (`tsc --noEmit && vite build`) | clean, 5.18s | **clean, built in 9.60s** ([island-build.txt](regression/island-build.txt)) | match |
| Runtime typecheck | `npm --prefix apps/runtime run typecheck` | clean | **clean** ([runtime-typecheck.txt](regression/runtime-typecheck.txt)) | match |
| Python lint | `python -m ruff check .` (ruff 0.17.2) | clean | **`All checks passed!`** ([ruff.txt](regression/ruff.txt)) | match |

Two deliberate non-runs: the RAG agent and its index build were not started, so no GPU work was done
for this task (`nvidia-smi --query-compute-apps` returned no rows —
[environment/services-started.txt](environment/services-started.txt)); and no suite was run that is not
listed in the task.

## 2. The new-thread fix, specifically

- Backend: 8 new tests in
  [tests/test_transcript_contract.py](../../../../apps/loan_advisory_portal/loan_advisory_portal/tests/test_transcript_contract.py)
  — brand-new, existing-empty, existing-with-turns, foreign borrower, foreign application, signed-out,
  malformed reference, non-string reference, append-to-a-foreign-thread. All pass inside the 179-test
  Frappe run. Detail: [conversation-api-contract.md](conversation-api-contract.md).
- Frontend: the 72 → 86 delta is 14 tests, attributable by file timestamp to this fix — 7 new tests in
  [apps/web/assistant/src/thread.test.ts](../../../../apps/web/assistant/src/thread.test.ts) (now 13,
  including `survives the reload that used to cause a needless 404`, `is released once a turn has been
  recorded`, `keeps the marker of a newer thread when an older turn lands late`,
  `holds one marker per application`, `ignores a marker that storage no longer holds`) and the new
  10th file [apps/web/assistant/src/island.test.tsx](../../../../apps/web/assistant/src/island.test.tsx)
  (7 tests, covering the restore decision itself). `chat-panel.test.tsx` holds 8 and was last touched
  before this fix.
- No test was weakened, skipped or re-baselined to reach these numbers; 15 skipped host tests are the
  same 15 as the baseline.

## 3. Data-safety check around the destructive-capable suite

`bench run-tests` is a real write path: it creates and deletes Frappe test records on the disposable
site. Row counts of the business tables were captured before and after it and are **identical** —
[before](regression/db-counts-before-frappe-tests.txt), [after](regression/db-counts-after-frappe-tests.txt):

| Table | Before | After |
| --- | ---: | ---: |
| Loan Application | 14 | 14 |
| Borrower Profile | 7 | 7 |
| Loan Application Document | 12 | 12 |
| Advisory Conversation | 152 | 152 |
| Advisory Message | 332 | 332 |
| Version | 110 | 110 |
| User | 15 | 15 |

The browser harnesses are separately guarded; see
[harness-write-guards.md](harness-write-guards.md) for the mechanism, the five-attempt write proof and
the per-run allowed/blocked counts.

## 4. Browser verification runs in this session

| Harness | Scope | Result | Writes allowed / blocked |
| --- | --- | --- | --- |
| `accessibility_audit.cjs` | 103 runs × 5 widths, no suppressions | **0 violations, 0 distinct rules, 0 states not reached, 0 console errors** | 17 / 0 |
| `manual_contrast.cjs` | 5 widths × 10 views | **0 nodes below AA, 0 indeterminate**, 35 card nodes measured individually | 40 / 0 |
| `keyboard_review.cjs` | 30 page/width walks | **605 stops, 605/605 visible focus indicator**, 0 unnamed controls, 0 traps | 43 / 0 |
| `thread_continuity_e2e.cjs` | journey + control | **22/22 journey checks, 4/4 control checks**, 0 unexpected 404 | 6 / 0 |
| `missing_information_e2e.cjs` | 5 valid + 6 negative runs | **5/5, 6/6**, 0 console errors | 32 / 0 |
| `borrower_views.cjs` | 5 widths × 17 views, before and after the CSS change | **85 screenshots each, 0 overflow offenders, 0 console errors** | 5 / 0 each |
| `write_guard_proof.cjs` | five deliberate write attempts | 5 blocked, **0 reached the server** | 1 / 5 |

## 5. Console and network error summary

Across every guarded browser run in this task: **0 unexplained console errors and 0 failed HTTP
responses**, with one exception that is the point of a test rather than a defect — the thread-continuity
control run produces exactly one 404 (`conversation_messages` for a thread id with no row) and one
matching browser console line, by design, after the pending marker is removed by hand.

The first axe run of this task also produced 2 console errors and 2 blocked requests; both were the
same finding — a genuine unintended write attempt from the application wizard — and both are 0 after the
harness fix. Full account: [harness-write-guards.md §5](harness-write-guards.md).
