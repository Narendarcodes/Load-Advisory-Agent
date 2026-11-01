# Final frontend acceptance report — browser reproduction and accessibility audit

Date: 2026-11-01
Repository: `Load-advisory-agent-frappe`, branch `feat/frappe-borrower-platform`, HEAD `7ec710e`
Target site: disposable `loanportal.local` inside `loanrangers-backend-1`, reached through the
temporary acceptance front door `http://127.0.0.1:8081`
Evidence directory: `docs/borrower-frontend/acceptance/2026-11-01/`

---

## A. Executive Summary

Both previously open items are closed, with one limitation stated plainly.

| Open item | Now |
| --- | --- |
| Missing Information GenUI card verified in a real browser, not only by component unit test | **VERIFIED** — reproduced through the production render path at 1440/1280/1024/768/390 with 17 DOM checks per width, 6 negative payloads, 0 console errors, and the one 390px clipping defect found and fixed. See `missing-information/missing-information-report.md` |
| Dynamic accessibility audit (axe-core + Playwright) with remediation, over the real route and state inventory | **VERIFIED** for the automated audit (103 runs, 0 violations, 0 suppressions) and **VERIFIED WITH LIMITATIONS** for the accessibility claim as a whole: 12 contrast pairs remain undecidable by any tool used here, and no real screen-reader session was performed because none is installed on this machine |

The frontend is **not** claimed to be fully accessible. What is claimed: the audited routes and
states produce zero axe-core WCAG 2.2 AA violations with no suppressions, the three real contrast
defects found in the baseline are fixed and re-measured, keyboard operation was walked and recorded,
and the residual gaps are itemised in D and H.

---

## B. Missing Information Card

Full detail: [missing-information/missing-information-report.md](missing-information/missing-information-report.md)

- **Reproduction method.** Real Chromium (Playwright 1.63.0) drives the borrower assistant page,
  signs in through the Frappe form, asks a question, and the streamed state snapshot carries a
  missing-information record. Upstream of the CopilotKit runtime the agent was replaced by
  `tests/e2e/agui_stub.cjs`, a deterministic test-only fixture; the auth boundary, the runtime, the
  `mint_assertion` bridge and the island bundle all stayed on the path. No model, no GPU.
- **Rendering path actually exercised.** `parsePublicState` → `buildBlocks` → `renderBlock` →
  `MissingInformationBlock` in [blocks.tsx](../../../../apps/web/assistant/src/genui/blocks.tsx), as
  shipped in `public/js/assistant/assistant.js`. No second implementation was written.
- **Five viewport results.** 1440, 1280, 1024, 768, 390 — all 17 checks pass at each width,
  including `noClipping`, `noOverflow` (page `scrollWidth` equals viewport at every width),
  `cardInsideViewport`, `visibleAfterScroll`, `keyboardReachesCard`, `focusVisible` (2px solid
  outline) and `noLeakage` (7 internal/attack needles absent from rendered text).
  At 390 the card rect is 39 → 351 (width 312) with `clipped: null`.
- **Negative test results.** 6/6: `malformed`, `unknown`, `absent_fields`, `no_missing`, `no_key`,
  `error`. Invalid or empty states render no card; an unsupported component type is ignored while a
  known card still renders; `RUN_ERROR` surfaces as a friendly alert. No fabricated fallback content
  is ever rendered.
- **Screenshot locations.** `missing-information/*.png` — 21 images: full page, viewport and
  card-only crop at each of the five widths, plus one per negative scenario. Machine-readable
  results in `missing-information/missing-information-results.json`.
- **Limitations.** The card content is fixture-supplied, so the wording proves rendering and
  structure, not model phrasing. Item counts and copy come from the fixture, not from a live
  application with genuinely missing evidence.

---

## C. Accessibility Audit

Full detail: [accessibility/accessibility-report.md](accessibility/accessibility-report.md) ·
[accessibility/remediation.md](accessibility/remediation.md)

- **Tooling and versions.** axe-core 4.14.0 via `@axe-core/playwright` 4.14.0, Playwright 1.63.0,
  Node 24. Tags requested: `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa` (WCAG 2.2 AA).
- **Routes actually tested.** 16 distinct URLs across 17 views: `/borrower/products`, `/login`,
  `/borrower/invite`, `/borrower`, `/borrower/eligibility`, `/borrower/apply`, `/borrower/kyc`,
  `/borrower/documents`, `/borrower/application` (two application records: submitted and recorded
  decision), `/borrower/assistant`, `/borrower/servicing`, `/borrower/profile`, `/borrower/help`,
  `/borrower/feedback`, `/borrower/terms`, `/borrower/privacy`. No route was created for coverage.
- **States actually reached, with proof.** default at all five widths, plus interactive states at
  1440 and 390: form validation on sign-in, eligibility, application wizard, KYC and feedback
  (each recorded the real message it found, e.g. `#about-name-error: "Enter your full name."`),
  loading/progress and disabled composer, missing-information card, assistant response with
  citations, `RUN_ERROR` alert, empty documents list, submitted and not-approved decision status,
  and the servicing view whose actions are deliberately unavailable. 19 state screenshots in
  `accessibility/states/{1440,390}/`. The report's "states recorded as NOT reached" section is
  empty because the harness reports any state it could not reach instead of auditing a guess.
- **Totals.** 103 runs. **Violations: 0 runs, 0 distinct rules, 0 nodes.** Baseline before
  remediation (`accessibility/baseline-before-remediation/`): 22 of 26 runs with violations,
  1 rule (`color-contrast`, impact **serious**), 97 node reports over 11 distinct selectors.
  Grouped by impact now: serious 0, moderate 0, minor 0, critical 0.
- **Findings fixed (3).**
  1. `.rail__label` sidebar labels — `--faint` on `--paper-2` 2.67:1 → `--muted` 4.68:1
     ([portal.css:511](../../../../apps/loan_advisory_portal/loan_advisory_portal/public/css/portal.css))
  2. declined-status body text — `--muted` on `--bad-soft` 4.47:1 → `--ink-2` 8.06:1, scoped to
     `.status-block--bad` ([portal.css:1231](../../../../apps/loan_advisory_portal/loan_advisory_portal/public/css/portal.css))
  3. borrower chat bubble — white on `--coral` 2.51:1 → `--ink` on `--coral` 6.65:1, the
     dark-on-light-coral pairing the palette guidance prefers
     ([assistant.css:135](../../../../apps/web/assistant/src/assistant.css))
  All three reuse existing palette tokens: no colour was invented, no typography or layout system
  was redesigned, no rule was bypassed to reach zero.
- **Findings still open.**
  - 12 text nodes on the KYC workspace stay **indeterminate** for contrast: axe reports them as
    `incomplete` (48 runs carry `color-contrast` incompletes overall, 198 node records) and the
    independent recomputation in `accessibility/manual-contrast.json` refuses to guess because a
    `background-image` sits in the ancestor chain (`span`, `div.identity-card__name`,
    `p#card-pan`, `p#card-aadhaar`). Deciding them needs a human judgement about the KYC card's
    textured background — an owner decision, not a CSS fix, and not counted as a pass here.
  - One non-accessibility defect observed during the audit: the island requests
    `/api/method/loan_advisory_portal.api.agent.conversation_messages?thread_id=<new uuid>` for a
    thread with no stored transcript and Frappe answers **404**, producing 2 console errors in the
    run. Reproducible on every fresh assistant thread. It is a first-load history bug outside the
    scope of this CSS-sized work; the exact endpoint and thread behaviour are recorded in
    `accessibility/accessibility-results.json` under `failedRequests`.
- **Suppressions.** None. No rule disabled, no include/exclude selector, no `data-axe-ignore`, no
  impact filter. Verified by the `suppressions` field in the results JSON: `"none: no rules
  disabled, no includes/excludes, no overrides"`.
- **Independent contrast check.** Because axe cannot decide every pair, 1,621 rendered text nodes
  across 10 views at 1440 and 390 were re-measured from computed foreground against the first opaque
  ancestor: **0 below AA**, tightest passing pair 4.68:1 (the `.rail__label` fix, 0.18 above the
  floor — recorded rather than rounded away), 12 indeterminate as above.

---

## D. Manual Review

Full detail: [accessibility/keyboard-and-ax-tree.json](accessibility/keyboard-and-ax-tree.json)

- **Keyboard review.** 30 page/width walks (6 key journey views × 5 widths), **605 Tab stops**
  recorded individually with tag, id, class, role, accessible name, size, viewport visibility and
  focus styling.
  | Check | Result |
  | --- | --- |
  | Logical tab order | recorded stop by stop; no anomalies reported by the walk |
  | Visible focus indicators | **605/605** stops change outline or box-shadow between unfocused and focused (measured by re-focusing each element, not by trusting a static style) |
  | No keyboard traps | no walk returned to a control it had already visited |
  | Off-screen stops | 0 |
  | Stops without an accessible name | 0 |
  | Enter/Space activation | sign-in button activated with **Enter** and with **Space**: `#login-error` went from hidden to visible with `role=alert` and the message "Enter the email address your invitation was sent to."; no POST was made |
  | Focus after form validation error | focus lands on the field in error (`input#email`) — the behaviour [login.js:38](../../../../apps/loan_advisory_portal/loan_advisory_portal/public/js/pages/login.js) implements deliberately |
  | Navigation by keyboard | dashboard link "New application" activated with Enter navigated `/borrower` → `/borrower/apply` |
  | Escape / dialog focus management | **not applicable on these routes**: 0 dialog, `[role=dialog]`, `[aria-modal]`, `.modal`, `.sheet` or `[data-dialog]` nodes exist on any reviewed view. Not tested, and not claimed |
  | Accessible names and descriptions | 0 unnamed visible controls, 0 dangling `aria-labelledby`/`aria-describedby`/`aria-controls` references, resolved descriptions recorded |
  | Heading and landmark navigation | 0 heading-level jumps; 8–21 landmarks per view; one `Skip to content` (`#main`) link; `documentElement.lang = "en"` |
  | Status updates | live regions enumerated per view (`#login-error role=alert`, `#applications aria-live=polite`, `#next-step aria-live=polite`, `#flash aria-live=polite`, plus the assistant's `role=status` progress and `role=alert` error) |
  | Assistant / GenUI semantics | heading ladder h1 "Ask about this decision" → h2 sections; card links all named ("Correct this in your application"); card region labelled by its own heading |
  | Reduced motion | animated nodes under `prefers-reduced-motion: reduce`: **0** on every view; under no preference: 3 (sign-in), 9 (dashboard), 16 (apply), 8 (documents), 13 (application), 14 (assistant) — the guard is effective, not merely declared |
- **Accessibility-tree review.** Done through Chromium's computed tree per page (landmarks, heading
  levels, unnamed visible controls, images without `alt` — 0, live regions, `lang`, skip links).
- **Screen-reader status.** **NOT PERFORMED.** No NVDA, Orca or other screen reader is installed on
  this machine (no process, no install directory). Nothing in this section is a screen-reader test;
  it is a DOM and accessibility-tree review. A practical NVDA pass over the assistant journey and
  the application wizard remains open.
- **Untested items, stated explicitly.**
  - Dialog/overlay focus handling — no such component exists on the reviewed routes.
  - Real screen-reader output (speech, verbosity, focus announcement).
  - Voice input/output paths (out of scope for this task by instruction).
  - Live model wording in the assistant — the deterministic fixture replaced it.
  - Borrower journeys requiring a write (submit application, upload document, payment): deliberately
    not exercised; the audit is read-only by design.
  - `manual_contrast.cjs` cannot decide 12 nodes over a `background-image` (listed in C).

---

## E. Regression

Every suite below was **executed in this session**; counts are from this run, not quoted from the
baseline. Baselines are the previously recorded figures for comparison only.

| Suite | Command | Baseline | This run | Result |
| --- | --- | --- | --- | --- |
| Island unit tests | `npm --prefix apps/web/assistant run test` | 72 passed | **72 passed** (9 files) | match |
| Host repository suite | `python -m pytest -q` | 685 passed / 15 skipped | **685 passed, 15 skipped**, 2 warnings, 46.51s | match |
| Runtime gateway | `npm --prefix apps/runtime run test` | 13 passed | **13 pass, 0 fail**, 8.4s | match |
| Frappe portal app | `bench --site loanportal.local run-tests --app loan_advisory_portal` (in container) | 171 | **Ran 171 tests in 39.033s — OK** | match |
| KYC page module | same, `--module …test_kyc_page` | 2 | **Ran 2 tests in 1.873s — OK** | match |
| Runtime typecheck | `npm --prefix apps/runtime run typecheck` | clean | **clean** | match |
| Island typecheck + build | `npm --prefix apps/web/assistant run build` (`tsc --noEmit && vite build`) | clean | **clean, built in 5.18s** | match |
| Python lint | `python -m ruff check .` | clean | **All checks passed** | match |
| Responsive view matrix | `node tests/e2e/borrower_views.cjs` | 102 screenshots in the pre-existing `2026-11-01-genui` matrix | **85 screenshots re-shot post-fix** into `view-matrix/`; overflow at all 85 view×width combinations: **none**; console errors: **0** | see note |

Two honesty notes.

1. The pre-existing 102-screenshot matrix was **not** re-shot in place and is left untouched as
   historical evidence. Because three ink declarations and one island layout rule changed after it
   was captured, those older images no longer match the served CSS for the affected views; the fresh
   85-shot `view-matrix/` in this bundle is the current visual evidence.
2. The runtime test log prints a `401 { error: 'sign in first' }` object. That is the expected
   negative-path assertion in `an assertion cannot be replayed`; the run still reports 13 pass,
   0 fail.

---

## F. Environment Cleanup

Inventory recorded before anything was started: [logs/service-inventory.md](logs/service-inventory.md)

| Service started here | Stopped how | Verified |
| --- | --- | --- |
| Frappe dev server `--port 8001` (inside `loanrangers-backend-1`, PIDs 2334 + child 2337) | `kill -TERM` — graceful | container reports `8001: not listening` |
| nginx front door `loanportal-acceptance-proxy` (host `127.0.0.1:8081`, id `4ab4484e5984`) | `docker stop` then `docker rm` — it was created **without** `--rm` (`AutoRemove=false Restart=no`), so it survives a stop until removed explicitly; that was recorded up front to avoid the previous `--rm` surprise | `docker ps -a --filter name=loanportal` → empty |
| CopilotKit runtime `127.0.0.1:4200` (host PID 11404) | `taskkill /PID 11404 /T` requested first **without** `/F`; Windows refused ("can only be terminated forcefully") for this windowless console process, so it was terminated with `/F` on the recorded PID only | port released |
| Test-only AG-UI stub `127.0.0.1:8096` (host PID 30624) | same sequence, same refusal then `/F` on the recorded PID | port released |

- **Port verification after cleanup:** `8001 released, 8081 released, 4200 released, 8096 released`,
  and `8095` (RAG agent) never opened.
- **GPU verification:** `nvidia-smi` reports **0 MiB used of 4096 MiB**. The RAG agent was never
  started for this task, as instructed — the deterministic fixture removed any technical necessity
  for a model.
- **Persistent data preserved:** `loanrangers-backend-1` remains `Up 4 hours`; no volume was
  removed, no `docker system prune` was run, no image was deleted, and the `loanportal.local`
  database is intact. Logs were copied out before shutdown
  (`logs/frappe-serve.log` 5,491 lines, `logs/runtime.log`, `logs/agui-stub.log`).
- **Data side effect, disclosed.** The first audit pass (before its error detector was corrected)
  clicked "Continue" in the application wizard, which re-saved the seeded borrower's
  `Borrower Profile`. Frappe's version trail shows exactly what changed in each of the five writes
  made on 2026-11-01 (`o9j9u5vuci`, `qqug2c24b5`, `s5o9ecp52i`, `tsf2h570nc`, `ttc4d6dfl6`): **only
  the `consent_at` timestamp**; no income, employment, name, contact or consent-content field changed,
  and no application, document, decision or payment record was created or touched. The harness was
  then fixed so the wizard state is validated client-side without any POST
  (`#about-name` is cleared before Continue), and the corrected run wrote nothing.
- No process was killed by name or by port; every stop used a PID or container id recorded in the
  inventory above.

---

## G. Changed Files

Working tree at the start of this task: 63 changed entries (branch `feat/frappe-borrower-platform`,
HEAD `7ec710e`, uncommitted borrower-frontend work). Now: 71 entries — 35 modified, 36 untracked.
The delta is exactly the 8 files this task added, plus files created inside already-untracked
directories.

**Modified (3)**

| File | Why | Overlap note |
| --- | --- | --- |
| [apps/web/assistant/src/assistant.css](../../../../apps/web/assistant/src/assistant.css) | `.msg.user` ink for contrast; `minmax(0, 1fr)` grid track and `thead th { white-space: normal }` inside the existing ≤1300px block to stop the 390px card clipping | **Already modified** by the pre-existing 63-change workstream. Unavoidable overlap: the island's layout and ink can only be corrected here, and the defect is in this island's own CSS |
| [apps/loan_advisory_portal/loan_advisory_portal/public/css/portal.css](../../../../apps/loan_advisory_portal/loan_advisory_portal/public/css/portal.css) | `.rail__label` and the `.status-block--bad` body ink, the two design-system contrast defects | **Already modified** by that workstream. The rules being fixed are design-system rules, so they live in this file |
| [tests/e2e/README.md](../../../../tests/e2e/README.md) | documents the new harness commands and the `--rm`-free proxy teardown | tracked and clean before this task; +22 lines only, no existing text rewritten |

Two rebuilt artefacts were written by the existing build command, not hand-edited:
`public/js/assistant/assistant.css` (md5 `c704f8d3…`) and the rest of the island bundle
(`assistant.js` md5 unchanged at `d341d9f8…`); host and in-container copies verified identical.

**Created (8)**

| File | Why |
| --- | --- |
| [tests/e2e/agui_stub.cjs](../../../../tests/e2e/agui_stub.cjs) | deterministic test-only AG-UI upstream so the card and assistant states are reproducible without a model or GPU |
| [tests/e2e/missing_information_e2e.cjs](../../../../tests/e2e/missing_information_e2e.cjs) | Part A browser reproduction, five widths plus six negative payloads |
| [tests/e2e/accessibility_audit.cjs](../../../../tests/e2e/accessibility_audit.cjs) | Part B axe audit over the route/state matrix, with reached-state attestation and state screenshots |
| [tests/e2e/manual_contrast.cjs](../../../../tests/e2e/manual_contrast.cjs) | independent recomputation for the pairs axe leaves undetermined |
| [tests/e2e/keyboard_review.cjs](../../../../tests/e2e/keyboard_review.cjs) | §11 tab walk, focus-indicator measurement, activation, overlay/Escape, tree and reduced-motion review |
| [tests/e2e/package.json](../../../../tests/e2e/package.json) | repository test commands (`missing-info`, `a11y`, `contrast`, `keyboard`) with pinned `@axe-core/playwright` 4.14.0 and `playwright` 1.63.0 |
| `tests/e2e/package-lock.json` | lockfile for the above, npm only — no second package manager introduced |
| `docs/borrower-frontend/acceptance/2026-11-01/**` | the evidence bundle (39 acceptance PNGs + 85 matrix PNGs, JSON results, reports, logs) |

**Deleted:** nothing. `tests/e2e/out/` holds this session's scratch probes and run logs; it is
untracked and left in place so the runs stay auditable.

Nothing in `apps/api`, `apps/runtime`, `decision_engine`, DocType JSON, controller code, business
logic, product copy, the palette or the typography was changed, and no existing test infrastructure
was replaced.

---

## H. Final Acceptance Status

| Item | Status |
| --- | --- |
| Missing Information card reproduced and verified in a real browser through the shipped render path | **VERIFIED** |
| Five-width responsive verification of that card (1440/1280/1024/768/390) | **VERIFIED** |
| Negative and malformed payload behaviour | **VERIFIED** |
| axe-core + Playwright WCAG 2.2 AA audit over the real route inventory, no suppressions, reproducible via `npm --prefix tests/e2e run a11y` | **VERIFIED** |
| Targeted remediation of the defects found, regression-tested and design-system preserving | **VERIFIED** |
| Contrast coverage of everything axe could not decide | **VERIFIED WITH LIMITATIONS** — 1,621 nodes recomputed with 0 failures, but 12 KYC nodes over a textured background remain undecidable and need an owner decision |
| Keyboard and accessibility-tree review | **VERIFIED WITH LIMITATIONS** — 605 stops, focus indicators, activation, naming, landmarks, reduced motion all clean; dialog/Escape not applicable (none exist); **no real screen-reader session was performed** |
| Responsive accessibility across all five widths | **VERIFIED** |
| Regression suites (72 island, 685/15 host, 13 runtime, 171 Frappe, 2 KYC, typechecks, ruff) | **VERIFIED** |
| Temporary environment lifecycle: started, tracked, shut down, ports and GPU verified, persistent data preserved | **VERIFIED** |
| Whole frontend is accessible | **NOT VERIFIED** — deliberately not claimed. A screen-reader pass, the 12 indeterminate contrast decisions and the `conversation_messages` 404 remain open |

Open items for the owner, each with the decision needed:

1. **KYC identity card contrast over its textured background** (12 nodes). Decide either to drop the
   `background-image` on `.identity-card` for a flat token fill so contrast is machine-checkable, or
   to accept the texture and sign off those 12 pairs by eye against a stated target.
2. **Real screen-reader session.** Needs NVDA on Windows hardware with a display; nothing in this
   report substitutes for it.
3. **`conversation_messages` 404 on a brand-new assistant thread.** Decide whether the endpoint
   should return an empty transcript (200) or the island should skip the history fetch for an
   unknown thread id. Either is a small change; both are behind an API-contract decision.
