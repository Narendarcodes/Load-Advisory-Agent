# Changed-file report — findings-closure task

Deliverable 14. The exact list of files this task changed.

The reference point is [`worktree-baseline.txt`](worktree-baseline.txt), `git status --short` captured
at 2026-11-01T15:06Z, before this task touched anything. Every file below is either new relative to
that baseline or was modified after it; the classification was produced by
`find <source dirs> -type f -newer worktree-baseline.txt`, not by memory, and then cross-checked
against the baseline's own `M`/`??` listing. Nothing was committed, pushed, merged, staged, reset or
cleaned, and no pre-existing modification was discarded.

## 1. Source and test files changed by this task

### Created

| File | Part | What it is |
| --- | --- | --- |
| [`tests/e2e/write_guard.cjs`](../../../../tests/e2e/write_guard.cjs) | A (§7) | the read-only control: classifies every non-GET request before it leaves the browser against three declared lists — session writes, assistant-turn writes, and the 12 posted reads whose server code was checked for a write |
| [`tests/e2e/write_guard_proof.cjs`](../../../../tests/e2e/write_guard_proof.cjs) | A (§7) | attempts five known writes through the guard and fails unless all five are blocked *and* a before/after database probe is byte-identical |
| [`tests/e2e/thread_continuity_e2e.cjs`](../../../../tests/e2e/thread_continuity_e2e.cjs) | B (§12–13) | browser journey for the assistant thread lifecycle plus the foreign-thread control run; records transcript requests, 404s, console errors and the guard summary |
| [`apps/loan_advisory_portal/loan_advisory_portal/tests/test_transcript_contract.py`](../../../../apps/loan_advisory_portal/loan_advisory_portal/tests/test_transcript_contract.py) | B (§11) | 8 Frappe-side regression tests for `conversation_messages`: brand-new, existing, empty, unknown, foreign, unauthenticated, malformed, oversized thread ids |
| [`apps/web/assistant/src/island.test.tsx`](../../../../apps/web/assistant/src/island.test.tsx) | B (§11) | component test that the island does not ask for transcript messages for a thread it minted and never used |

### Modified

Files marked **clean at baseline** were unmodified in git when this task started; the diff against
`HEAD` is therefore entirely this task's work. Files marked **already dirty at baseline** carried
earlier work; this task made a minimal, isolated change inside them, named per file below.

| File | Baseline state | Part | This task's change |
| --- | --- | --- | --- |
| [`apps/web/assistant/src/thread.ts`](../../../../apps/web/assistant/src/thread.ts) | clean | B | `pendingThread()` / `clearThreadPending()` and the `…:pending` sessionStorage marker; `newThread()` now sets the marker; storage read/write hoisted into two small helpers |
| [`apps/web/assistant/src/thread.test.ts`](../../../../apps/web/assistant/src/thread.test.ts) | clean | B | 7 added unit tests for the pending marker and the mint→record→release invariant |
| [`apps/web/assistant/src/island.tsx`](../../../../apps/web/assistant/src/island.tsx) | already dirty | B | the restore effect returns early when the thread is pending, and a completed turn clears the marker — two statements, no other behaviour touched |
| [`apps/loan_advisory_portal/loan_advisory_portal/public/css/portal.css`](../../../../apps/loan_advisory_portal/loan_advisory_portal/public/css/portal.css) | already dirty | C | one declaration inside `.identity-card`: the `linear-gradient(150deg, …)` background replaced by `background: var(--ink)`. No new colour, no text shadow, no selector outside the card |
| [`tests/e2e/accessibility_audit.cjs`](../../../../tests/e2e/accessibility_audit.cjs) | already present (untracked) | A/C | the `05-apply / form-validation` state replaced with the blank-name case (the old one asked for a >140-character name, which `maxlength=140` makes unreachable, so the form was valid and Continue wrote the profile); write guard attached to every context |
| [`tests/e2e/borrower_views.cjs`](../../../../tests/e2e/borrower_views.cjs) | already present | A | write guard attached, summary in the output |
| [`tests/e2e/manual_contrast.cjs`](../../../../tests/e2e/manual_contrast.cjs) | already present | A | write guard attached |
| [`tests/e2e/keyboard_review.cjs`](../../../../tests/e2e/keyboard_review.cjs) | already present | A | write guard attached |
| [`tests/e2e/missing_information_e2e.cjs`](../../../../tests/e2e/missing_information_e2e.cjs) | already present | A | write guard attached (assistant-declared writes for the journey, plain for the negative cases) |
| [`tests/e2e/package.json`](../../../../tests/e2e/package.json) | already present | B | `npm run thread` script for the new harness |
| [`tests/e2e/README.md`](../../../../tests/e2e/README.md) | already dirty | A/B | three new rows in the file table, the two new run commands, and the two rules the guard encodes (a POST is not a write; a validation state must really be invalid) |

**Sixteen files, counting the created and modified rows above.** No other file in the repository was
written by this task.

## 2. Explicitly not changed

Verified by the `-newer` scan rather than asserted:

- **No server-side behaviour changed for the new-thread 404.** Neither
  `apps/loan_advisory_portal/loan_advisory_portal/api/agent.py` nor any other file under `api/` is in
  the changed list. `_owned_conversation` still requires `row.user == ctx.user && row.customer ==
  ctx.customer` and still raises `NotFound`, which is the chosen answer to Part B — see
  [`conversation-api-contract.md`](conversation-api-contract.md) §2 for why the 404 is kept rather than
  softened to a 200.
- **No Frappe ownership check, permission, or DocType was weakened or edited**; no ZEN rule, policy
  engine, or underwriting logic touched; no change to `apps/api` (the FastAPI agent) at all — none of
  its four baseline-modified files (`graph.py`, `prompts.py`, `agui.py`, `events.py`) is newer than
  this task's baseline.
- **No consent logic changed.** `api/profile.py`, which re-stamps `consent_at`, is unmodified: the
  Part A finding is a data-integrity question about an existing site, not a code fix.
- **The previous acceptance bundle is intact**: 0 files in
  `docs/borrower-frontend/acceptance/2026-11-01/` are newer than this task's baseline, and no earlier
  report was rewritten or replaced.
- `tests/test_agent_api.py`, `tests/e2e/agui_stub.cjs`, `tests/e2e/nginx.loanportal.conf`,
  `apps/runtime/**` and every `apps/loan_advisory_portal/**` page, template and JS page other than the
  CSS line above are unchanged by this task.

## 3. Generated build output (not hand-edited)

| Path | Files | Why |
| --- | --- | --- |
| `apps/loan_advisory_portal/loan_advisory_portal/public/js/assistant/**` | 409 | the island bundle rebuilt (`npm run build` in `apps/web/assistant`) and copied into the app so the browser harnesses load the Part B change. Regenerate with the documented build step; the source of truth is `apps/web/assistant/src/` |
| `tests/e2e/out/**` | 2 | the harnesses' own scratch output |

## 4. Documentation and evidence created

All under [`2026-11-01-findings-closure/`](./): **271 files**, all created by this task — 9 hand-written
documents (the table below), 2 axe reports the harness writes into its own evidence folders, and 260
machine-generated captures (217 PNG, 27 TXT, 11 JSON, 2 SQL, 1 JSONL, 1 log, 1 CJS probe script).

| Document | Deliverable | Subject |
| --- | --- | --- |
| [`database-integrity.md`](database-integrity.md) | 1, 2, 3 | the five `Version` records, original vs current `consent_at`, what else changed, why nothing was restored |
| [`harness-write-guards.md`](harness-write-guards.md) | 11 (hardening) | the guard design, the POST-is-not-a-write correction, the five-attempt block proof, the write the guard caught |
| [`conversation-api-contract.md`](conversation-api-contract.md) | 4, 5 | thread lifecycle, Option B chosen and Option A rejected, 9 security scenarios, the tests pinning them |
| [`kyc-card-contrast.md`](kyc-card-contrast.md) | 7, 8 | the 12 indeterminate nodes, the one-line change, per-node computed foreground/background and ratios at five widths |
| [`screen-reader-blocker.md`](screen-reader-blocker.md) | 10 | machine facts, why nothing was substituted, official NVDA install and the five-journey recording sheet |
| [`regression.md`](regression.md) | 5, 11, 12 | every suite re-run against its baseline, DB counts before/after `bench run-tests`, console and network summary |
| [`environment-lifecycle.md`](environment-lifecycle.md) | 13 | start, deliberate non-starts, shutdown of each service, verification, credential cleanup |
| [`changed-files.md`](changed-files.md) | 14 | this report |
| [`final-product-readiness-report.md`](final-product-readiness-report.md) | — | sections A–I, the readiness verdict |

| Evidence directory | Files | Contents |
| --- | --- | --- |
| `database/` | 10 | the SQL probe and its output, the five `Version` rows as JSONL, the borrower profile's current state, the write-attempt before/after probes, the guard-proof console and screenshot |
| `thread-continuity/` | 9 | six numbered screenshots (brand-new → first answer → reload restored → new conversation → reopened conversation → foreign thread refused), the results JSON, the results JSON from the same run captured before the guard summary keys were renamed (identical outcomes: 22/22 journey, 4/4 control, 0 blocked), and the console capture |
| `kyc-contrast/` | 203 | the before/after card screenshot, the recomputed contrast JSON for all five widths, the axe report before and after, the full view matrices before and after, the keyboard/AX-tree walk, and the probe script that measured the card |
| `kyc-contrast/accessibility-prev-run-blocked-write/` | 3 | the failed first axe run, preserved rather than deleted — it is the evidence for the write the guard caught |
| `missing-information/` | 23 | five widths × three render modes plus the six negative payload cases, with the results JSON and console |
| `regression/` | 10 | one capture per suite run, plus the table-count probe before and after `bench run-tests` |
| `environment/` | 5 | baseline, started-services, teardown-before, teardown log, teardown verification |

At the top level: [`worktree-baseline.txt`](worktree-baseline.txt) (the reference point for this
report) and [`database-integrity-probe.txt`](database-integrity-probe.txt) (the first probe run).

## 5. Files removed

Only this task's own scratch, and nothing that held evidence:

- `%TEMP%\loanportal-e2e\closure1.json` — the seeded credentials, deleted from outside the repository
  once the harnesses finished; the container-side copy was already gone (verified in
  [`environment-lifecycle.md`](environment-lifecycle.md) §6).
- `%TEMP%\loanportal-e2e\kyc_card_focus_probe.cjs` — moved into the evidence bundle as
  `kyc-contrast/kyc_card_focus_probe.cjs`, not deleted.

No repository file, report, screenshot, log, database row, container, volume or image was removed by
this task.
