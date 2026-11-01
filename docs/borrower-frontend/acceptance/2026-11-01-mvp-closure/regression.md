# Regression results — executed 2026-11-01

Every figure is from a command run in this task on the current worktree (`feat/frappe-borrower-platform`,
HEAD `7ec710e`, nothing committed). Historical baselines are the findings-closure numbers and are shown
only for comparison. Raw output is named per row under [`regression/`](regression/).

## 1. Suites

| Suite | Command | Baseline | This run | Result |
| --- | --- | --- | --- | --- |
| Host repository | `python -m pytest -q` | 685 passed / 15 skipped | **685 passed, 15 skipped**, 2 warnings, 38.21s ([host-pytest.txt](regression/host-pytest.txt)) | match |
| Frappe portal app | `bench --site loanportal.local run-tests --app loan_advisory_portal` | 193 / OK (after the consent module) | **`Ran 193 tests in 45.377s` / `OK`** ([frappe-portal-suite-final.txt](regression/frappe-portal-suite-final.txt)) | match, and the 193 includes the 14 new consent tests on top of the 179 transcript/portal baseline |
| KYC page module | same, `--module …tests.test_kyc_page` | 2 / OK | **`Ran 2 tests in 1.215s` / `OK`** ([frappe-kyc-and-consent-modules.txt](regression/frappe-kyc-and-consent-modules.txt)) | match |
| Consent module | same, `--module …tests.test_consent` | new this task | **`Ran 14 tests in 3.152s` / `OK`** (same file) | added |
| Assistant island | `npm --prefix apps/web/assistant run test` | 86 (10 files) | **86 passed (10 files)**, 7.63s ([npm-and-lint.txt](regression/npm-and-lint.txt)) | match — the new-thread fix is still covered |
| Island typecheck + build | `npm --prefix apps/web/assistant run build` | clean | **clean, built in 9.25s** | match |
| Runtime gateway | `npm --prefix apps/runtime run test` | 13 | **13 pass, 0 fail**, 9.99s | match |
| Runtime typecheck | `npm --prefix apps/runtime run typecheck` | clean | **clean** | match |
| Python lint | `python -m ruff check .` | clean | **`All checks passed!`** | match |
| axe-core | `npm --prefix tests/e2e run a11y` | 103 runs, 0 violations | **103 runs, 0 violations, 0 distinct rules, 0 states not reached, 0 console errors** ([a11y-rerun-with-fixture-ids.txt](regression/a11y-rerun-with-fixture-ids.txt)) | match |

`ruff` was not clean on the first attempt: `F401 frappe._ imported but unused` in this task's own
verification script. Fixed in that file, then re-run — not silenced, not ignored.

## 2. Browser verification at 1440 / 1280 / 1024 / 768 / 390

All runs attach the request guard; all signed in as a freshly seeded disposable fixture
(`mvp1-borrower@example.invalid`), and every conversation those runs created was removed by the fixture
teardown at the end.

| Harness | Scope | Result | Writes allowed / blocked |
| --- | --- | --- | --- |
| `accessibility_audit.cjs` | 103 runs across the route matrix and the states each page reaches | **0 violations, 0 states not reached, 0 console errors** | 17 / **0** |
| `manual_contrast.cjs` | 5 widths × 10 views | **0 below AA, 0 indeterminate**; tightest passing measurement 4.68:1 | 16 / **0** |
| `keyboard_review.cjs` | 30 page/width walks | **595 tab stops, 595/595 with a visible focus indicator**, 0 unnamed controls, 0 page errors | 43 / **0** |
| `thread_continuity_e2e.cjs` | journey + control | **22/22 journey, 4/4 control**, 0 unexpected 404, one expected 404 in the control | 6 / **0** |
| `missing_information_e2e.cjs` | 5 valid + 6 negative runs | **5/5, 6/6**, 0 console errors | 32 / **0** |
| `borrower_views.cjs` | 5 widths × 17 views | **85 screenshots, no horizontal overflow, 0 console errors** | 5 / **0** |
| `consent_regression_e2e.cjs` (new) | four real profile/wizard saves | **7/7 checks**, and the Version chain shows one consent change in four saves | 5 / **0** |
| `conversation_list_state.cjs` (new) | rendered history panel, before and after a deletion | before **2 items**, after **0 items** with the empty-state note; HTTP 200 both times | 1 / **0** |

### Two harness defects this run produced, found and fixed rather than explained away

1. **Fixture-coupled route ids.** The first axe run reported 15 console errors and
   `borrower_views.cjs` reported 404s. Both were the harness asking for `ACC-LOAP-2026-00018/00019`,
   which belong to the earlier demo borrower, while signed in as a different one — Frappe answered 404
   for ownership, *correctly*. Fixed by parameterising `APPLICATION`, `SUBMITTED_APPLICATION` and
   `DECISION_APPLICATION`, making `borrower_views.cjs` skip and report a route with no id, and making
   `thread_continuity_e2e.cjs` require `APPLICATION` instead of defaulting to a stale one. Re-runs:
   **0 console errors** in both suites. The lesson is recorded in
   [`tests/e2e/README.md`](../../../../tests/e2e/README.md).
2. **A stale claim in the keyboard evidence.** `keyboard_review.cjs` wrote a fixed string asserting that
   no screen reader is installed on the machine. That was true when it was written and is false now (see
   §4), so the harness detects the actual state and states plainly that it performs no screen-reader
   session regardless, being headless.

`write_guard_proof.cjs` was not re-run: the guard itself did not change in this task, and its five
blocked attempts are already evidenced in the findings-closure bundle.

## 3. Data-safety checks around the destructive-capable paths

`bench run-tests` creates and deletes records on the disposable site, so the business tables were
counted immediately before and after it. The two captures are **identical** —
[before](regression/db-counts-before-frappe-tests.txt), [after](regression/db-counts-after-frappe-tests.txt) —
including the restored `consent_at` on the demo profile, which the suite did not touch.

Final state after the fixture teardown
([`regression/db-counts-final.txt`](regression/db-counts-final.txt)):

| Table | Value | Comparison with the task's opening baseline |
| --- | ---: | --- |
| Advisory Conversation | 52 | 30 demo (17 pre-cutoff + 13 preserved) + 18 `e2e1` + 4 `closure1` — the synthetic set is gone |
| Advisory Message | 128 | children of those 52, 0 orphans |
| Borrower Profile / Loan Application / Document / Decision Evidence | 7 / 14 / 12 / 1 | unchanged |
| Customer / User | 15 / 15 | unchanged |
| Version | 111 | +1, the restoration record `97d9cnnkjd` |
| Deleted Document | 152 | +111 conversation snapshots + the fixture deletions this task made and disclosed |
| Loan / Loan Disbursement / Loan Demand | 0 / 0 / 0 | unchanged — no payment data exists |
| `review.demo` `consent_at` | `2026-10-31 18:13:36` | the restored value, holding |

## 4. Accessibility: what is and is not verified

| Method | Result | Status |
| --- | --- | --- |
| axe-core (WCAG 2.2 AA tags), names and roles | 103 runs, 0 violations | **VERIFIED** |
| Independent contrast recomputation | 0 fails, 0 indeterminate, per-node numbers retained | **VERIFIED** — the KYC fix from the previous task still holds |
| Keyboard walk | 595 stops, all with a visible focus indicator, no traps | **VERIFIED** |
| Accessibility-tree review (landmarks, headings, live regions, unnamed controls) | 0 unnamed controls, live regions present where expected | **VERIFIED for the tree only** |
| Basic MVP accessibility required by the revised scope | labels, validation messages, contrast, keyboard, focus, semantic headings, status and error roles | **VERIFIED — no regression** |
| NVDA screen-reader testing | not performed | **DEFERRED — POST-MVP** by owner decision |

The deferred item is described honestly in [`environment-lifecycle.md`](environment-lifecycle.md) §4:
NVDA 2026.3 was installed on this machine during the earlier scope of this work, before the revision
arrived; no journeys were run, it is not running now, nothing was simulated, and screen-reader
accessibility is **not** claimed anywhere in this bundle.

## 5. Console and network summary

Across the guarded browser runs in this task after the harness fixes: **0 unexplained console errors,
0 failed HTTP responses, 0 undeclared writes**, with one exception that is the point of a test — the
thread-continuity control run produces exactly one 404 for a thread with no stored rows, plus the
matching browser resource line, by design.

## 6. Deliberate non-runs

- The RAG agent and its index: never started, no GPU memory allocated
  (`nvidia-smi --query-compute-apps` returned only its header, before and after).
- `write_guard_proof.cjs` (reason in §2).
- Any suite outside the task list — no numbers were padded.
