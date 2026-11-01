# Final product readiness report — remaining findings closure

Branch `feat/frappe-borrower-platform`, worktree as at 2026-11-01T16:50Z (nothing committed, pushed,
merged, staged, reset or cleaned). Site `loanportal.local` — the disposable bench, not `p1loan.local`,
not production. Evidence bundle: [`2026-11-01-findings-closure/`](./), indexed in
[§H](#h-changed-files).

This report deliberately contains four different words. **VERIFIED** means a command was run in this
session and its output is in this bundle. **VERIFIED WITH LIMITATIONS** means it passed, but the
evidence does not cover everything a reviewer would want. **NOT VERIFIED** means the claim is open —
the code exists or the symptom is absent, but nothing here proves the behaviour. **BLOCKED** means the
test could not be run at all on this machine and no substitute was passed off as a result.

Nothing below is marked verified because the code for it exists, and no borderline number was rounded
upward to reach a pass.

## A. Executive summary

Four findings were open from the previous acceptance report. Three are closed; one is closed for the
browser and open for a screen reader; and the investigation surfaced two problems that nobody had
reported.

**Closed.**

1. **Database integrity / `consent_at`.** All five Version records were re-verified from the database
   rather than from the earlier report. The chain is unbroken, each record changed exactly one field,
   the original timestamp is established rather than inferred, and nothing else in the borrower's
   record — application, document, decision, payment, customer, invitation — was created, modified or
   deleted on 2026-11-01. Root cause is one line in the `Borrower Profile` controller that restamps
   consent on *every* save. **Not restored, on purpose**: the sanctioned Frappe mechanism cannot hold
   the value, and the only way to force it is the direct table write the task forbids. The restoration
   target is recorded for whoever approves the controller fix
   ([database-integrity.md](database-integrity.md)).
2. **Read-only harnesses could write, and one of them was trying to.** Every browser harness now runs
   behind a request guard that fails the run on any undeclared mutation. Its value is proven twice: five
   deliberate write attempts were blocked with a byte-identical database before and after, and the first
   guarded axe run caught a live defect — the `05-apply` "form validation" state asked for a name longer
   than 140 characters, `maxlength="140"` made that unreachable, so the step was *valid* and Continue
   posted a real `update_profile` at 1440 and at 390. Both were blocked; the profile was never renamed
   (12 Borrower Profile Version rows, 0 mentioning `full_name`; the name is still the seeded one).
   Whether the same attempts landed before the guard existed is **NOT VERIFIED** — the container keeps
   no request log (`@@log_bin = 0`)
   ([harness-write-guards.md](harness-write-guards.md)).
3. **New-thread 404.** The cause was the client asking for a transcript that could not exist. The fix
   removes the request, not the refusal: the server contract and every ownership check are unchanged,
   and a test now pins that an unknown thread id still gets `NotFound`
   ([conversation-api-contract.md](conversation-api-contract.md)).
4. **KYC contrast.** The 12 nodes axe could not decide are now measurable on every width, because the
   card's gradient was replaced by one existing design token. Ratios are 10.37:1 to 15.12:1 against
   ink, 0 indeterminate, 0 below AA, layout proven identical
   ([kyc-card-contrast.md](kyc-card-contrast.md)).

**Open.**

5. **NVDA.** Not installed on this machine, so no screen-reader test was performed, no speech was
   simulated, and nothing was silently installed. The blocker, the machine facts behind it, and the
   exact official install and five-journey procedure are documented
   ([screen-reader-blocker.md](screen-reader-blocker.md)). This is the single largest gap between this
   product and a defensible accessibility claim.

**Newly found, not previously reported.**

6. **A real product defect, independent of the test incident:** because `validate()` restamps
   `consent_at` whenever both consent flags are set, the stored timestamp records "last time anything
   on this profile was saved", not "when the borrower consented". The consent API already knows how to
   do this correctly; the controller line overrides it. Fixing it is a business-logic change and is
   outside this task's frozen scope, so it was documented rather than patched.
7. **345 transcript rows created by earlier test runs remain in the borrower-visible store**, including
   52+ rows carrying deterministic fixture wording ("Acceptance fixture response: …"), on the demo
   borrower's account. Not corrupt data, not another borrower's data — but persistent synthetic content
   that no one asked to keep. Left in place: deleting 345 rows is an irreversible write this task is
   not authorised to make.

## B. Data integrity

Full detail: [database-integrity.md](database-integrity.md); machine-readable records in
[`database/`](database/).

| Version | created (site time) | field | from → to |
| --- | --- | --- | --- |
| `o9j9u5vuci` | 2026-11-01 19:46:24.377 | `consent_at` | `2026-10-31 18:13:36` → `2026-11-01 19:46:24` |
| `qqug2c24b5` | 2026-11-01 19:50:44.615 | `consent_at` | `2026-11-01 19:46:24` → `2026-11-01 19:50:44` |
| `s5o9ecp52i` | 2026-11-01 19:53:01.656 | `consent_at` | `2026-11-01 19:50:44` → `2026-11-01 19:53:01` |
| `tsf2h570nc` | 2026-11-01 19:55:56.720 | `consent_at` | `2026-11-01 19:53:01` → `2026-11-01 19:55:56` |
| `ttc4d6dfl6` | 2026-11-01 19:55:59.605 | `consent_at` | `2026-11-01 19:55:56` → `2026-11-01 19:55:59` |

- **Document and site.** `Borrower Profile` → `review.demo@example.invalid`, site `loanportal.local`
  (database `_21ddc3370f18f30e`). Environment check: `allow_tests` on, every borrower identity is
  `@example.invalid`, `tabLoan`/`tabLoan Disbursement`/`tabLoan Demand` hold 0 rows. Disposable, not
  production-like.
- **Original vs current.** Original `2026-10-31 18:13:36`, corroborated by the immediately preceding
  Version `m5mu4nv063`, whose `to` side is the same value. Current `2026-11-01 19:55:59.600517`.
- **Restoration: not performed.** The sanctioned path (`save()` through the document API) recomputes
  the field to `now_datetime()` in `validate()`, so a document-level restore is a no-op; the only
  mechanism that would hold is a direct table write or `frappe.db.set_value`, both of which dodge the
  Version record this task's rules forbid. The current value is also not corrupt — it is what this
  application's own logic defines after the last save. Writing back a timestamp the application cannot
  produce would make the row inconsistent with the code that governs it.
- **Other fields.** Consent *content* intact (`consent_terms = 1`, `consent_privacy = 1`,
  `terms_version = portal-terms/1`, `privacy_version = portal-privacy/1`). Identity, contact,
  employment, income, obligations, locale and literacy last changed on 2026-10-31, before this task.
  The pre-existing `employment_type` blank and `monthly_income = 0` are seed state, not damage.
- **Other records.** Per-table created/modified counts for 2026-11-01: **0** for Loan Application (12),
  Loan Application Document (10), Loan Decision Evidence (1), Application State Log (7), Evidence
  Ingestion Log (1), Borrower Feedback (1), Voice Session (2), invitations (4/4), Customer (13);
  `Deleted Document` gained nothing, so nothing was removed either. Site-wide, the only five versioned
  writes on that date are the chain above.
- **What the earlier report did not disclose, and this one does.** (i) one `User` write
  (`modified 16:54:38`, `logout_all_sessions = 1`) — attributed by Activity Log to 44 `Force Logged
  out` events in 233 ms, a session invalidation with no borrower-field change; (ii) 103 `Advisory
  Conversation` and 242 `Advisory Message` rows created by the acceptance runs, still present (§A item
  7).

**Status.**

| Claim | Status |
| --- | --- |
| Five Version records verified at record level against the database | **VERIFIED** |
| Only `consent_at` changed; all other fields and all other tables intact | **VERIFIED** |
| Original timestamp established, not inferred | **VERIFIED** |
| `consent_at` restored | **BLOCKED** — needs the controller fix plus owner approval; target recorded |
| The `User` write changed no borrower field | **VERIFIED**; which command triggered it: **NOT VERIFIED** (`@@log_bin = 0`, no request log) |
| No unexplained persistent borrower-data change remains | **VERIFIED for the audited window**; **NOT VERIFIED as "nothing synthetic remains"** — 345 transcript rows are left in place pending an owner decision |

## C. New assistant thread

Full detail: [conversation-api-contract.md](conversation-api-contract.md); run evidence in
[`thread-continuity/`](thread-continuity).

- **Root cause.** The island restores a transcript whenever the open thread changes and had no way to
  know the thread it was asking about had never existed server-side. A thread minted by the tab has no
  `Advisory Conversation` row until `record_turn` succeeds, so the very first paint asked for nothing
  and got `NotFound`. The pending marker that already existed for exactly this purpose was not being
  consulted on the restore path.
- **Chosen contract: Option B — do not make the request.** Option A (200 with an empty shape for an
  unknown thread) was considered and rejected: it would make `conversation_messages` answer 200 for
  identifiers matching no row, so "your new thread is empty" becomes indistinguishable from "that
  thread is someone else's", and the 404 is the only thing that makes an enumeration attempt both
  observable and useless. The empty-but-existing case is already a 200 with `messages: []`, so both
  shapes the frontend needs already exist.
- **Change.** Two statements on the client: the restore effect returns early while the thread is
  pending; a successful turn releases the marker. Server code is untouched — `api/agent.py` is not in
  the changed-file list, and `_owned_conversation` still requires `row.user == ctx.user` **and**
  `row.customer == ctx.customer`, returning the same indistinguishable `NotFound` for foreign and
  absent ids.
- **Security and ownership.** Nine scenarios pinned by tests: brand-new (no request at all), minted
  with no turn (200 empty), with turns (200, oldest-first, capped), another borrower's thread (404,
  indistinguishable), a thread rebound to another application (404), signed out (`SignInRequired`, no
  transcript and no list), malformed/oversized/non-string reference (refused before any lookup),
  relinked profile (old thread not carried over), and an attempt to append to a thread you do not own
  (refused, no turn created). No raw exception text, database detail, or other borrower's content
  reaches the page; the refusal renders as an empty panel and the run proves nothing is fabricated.
- **Backend tests.** New `test_transcript_contract.py`, 8 tests, all passing inside the Frappe app
  suite (`Ran 179 tests … OK`, up from the 171 baseline). The first one asserts that a minted-in-the-
  browser id has no row and that asking for it *is* a 404 — so if anyone later "fixes" the 404 by
  loosening the endpoint, that test states what was chosen and why. `tests/test_agent_api.py`
  extended by 28 lines, inside the 685-passing host run.
- **Frontend tests.** 72 → 86 island tests (9 → 10 files): 7 new in `thread.test.ts`, plus the new
  `island.test.tsx` covering the restore decision itself.
- **Before / after in a real browser.** Before: the first load of a fresh workspace produced one 404
  for `conversation_messages` and a matching console line. After (journey run, 22/22 checks):
  first load **0 transcript requests**, after the first answer 0, **reload 1 → 200** with the recorded
  exchange restored, "New conversation" 0, reopen of the older conversation 1 → 200; **0 console
  errors, 0 unexpected 404s**. Control run (marker removed by hand to re-create the original
  condition): the request is made, the server answers 404 exactly once, the panel stays empty — proof
  that a request was removed, not a refusal. Writes across both runs: 6 allowed, 0 blocked.

**Status.**

| Claim | Status |
| --- | --- |
| Root cause traced through the whole lifecycle | **VERIFIED** |
| Smallest correct fix; authorization and ownership semantics unchanged | **VERIFIED** — server code unmodified; Option A rejected with reason |
| Fresh assistant experience is 404-free in a real browser | **VERIFIED** — 22/22 journey checks, 0 console errors, 6 numbered screenshots |
| Refused thread yields an empty panel with no invented transcript | **VERIFIED** — control run |
| Same behaviour against the live model instead of the deterministic stub | **VERIFIED WITH LIMITATIONS** — this fix was exercised against the stub; streaming with the real model was verified earlier in the acceptance work, not in this run |
| What a screen-reader user hears when a restored transcript appears | **NOT VERIFIED** — see §E |

## D. KYC contrast

Full detail: [kyc-card-contrast.md](kyc-card-contrast.md); data in
[`kyc-contrast/`](kyc-contrast).

- **The 12 nodes.** The previous run measured 96 text nodes at 1440 and 77 at 390 on `/borrower/kyc`
  and reported 6 indeterminate per width — 12 in total — all inside the identity card, all for the same
  recorded reason: `background-image in the ancestor chain`. The honest reading of that result is
  *unknown*, and it was not counted as a pass then or now.
- **The change.** One declaration in `.identity-card` in `portal.css`:
  `background: linear-gradient(150deg, #2c2321, #4a3a35 82%)` → `background: var(--ink)`
  (`--ink` = `#241c1b`, the existing token already used for body text and the page header). It is
  *darker* than either gradient stop, so every ratio improved rather than being traded away. No text
  shadow, no new colour, no `!important`, no global selector, no DOM or template edit, no change to the
  card's text colours, padding, radius or shadow.
- **Computed values and per-node ratios** (identical at all five widths; background
  `rgb(36, 28, 27)` on every row):

| Node | Foreground | Ratio | Required | Pass |
| --- | --- | ---: | ---: | --- |
| `div.identity-card__name` | `rgb(247, 243, 238)` | **15.12:1** | 4.5 | yes |
| `p#card-pan.identity-card__masked` | `rgb(255, 217, 207)` | **12.79:1** | 4.5 | yes |
| `p#card-aadhaar.identity-card__masked` | `rgb(255, 217, 207)` | **12.79:1** | 4.5 | yes |
| card head `span` | `rgb(232, 217, 205)` | **12.12:1** | 4.5 | yes |
| footnote `span` ×2 | `rgb(217, 201, 189)` | **10.37:1** | 4.5 | yes |
| `span.demo-flag` (badge) | `rgb(138, 90, 18)` on `rgb(247, 236, 216)` | **5.05:1** | 4.5 | yes |

- **Five widths.** 1440 / 1280 / 1024 / 768 / 390: 7 card text nodes measured individually at each width
  (35 in total), **0 indeterminate at every width**, 0 text nodes below AA on the page, 0 indeterminate
  on the page. The badge is the tightest at 5.05:1 — 0.55 of margin, reported as measured, not rounded.
- **Structure preserved.** Card computed style: `background-image: none`, colour/radius/padding/shadow
  unchanged, box 320 × 202 px, page scroll height **1621 px identical before and after**. Full view
  matrices captured before and after — 85 screenshots each, `scrollWidth` unchanged at every width,
  0 horizontal-overflow offenders, 0 console errors in each.
- **axe after the change.** 103 runs × 5 widths: 0 violations, 0 distinct rules, 0 states not reached,
  0 console errors, and `.identity-card` nodes in axe's incomplete list on `/borrower/kyc` **6 → 0**.
  axe still leaves 42 runs with page-wide colour-contrast nodes it cannot decide (selects, layered
  backgrounds such as `.topbar__brand` and the `.tabbar` links at 390); those are outside this finding,
  are not counted as passes, and are covered by the independent harness above.
- **Focus indicators.** The card contains 0 focusable elements, so no ring is painted on the new
  surface; the full walk after the change is 30 page/width walks, **605 tab stops, 605/605 with a
  visible focus indicator**, 0 off-screen focus, 0 unnamed controls, no trap.

**Status: VERIFIED** that the 12 nodes are measurable and pass AA on their own computed numbers, with
layout, illustration, dimensions and responsive behaviour preserved and focus unaffected.
**NOT VERIFIED**: how the card is announced — see §E.

## E. NVDA assessment

Full detail: [screen-reader-blocker.md](screen-reader-blocker.md).

- **Environment.** Windows 11 Home Single Language build 26200 (NVDA requires Windows 10/11 or Server
  2016+, so the OS is supported); interactive console session `golla@VICTUS-LAPTOP`; `Audiosrv`
  Running; `UIAutomationCore.dll` present; .NET 4.8.1 (Release 533509); Edge 156.0.4314.58 and Chrome
  156.0.8078.74 installed, Firefox absent. **NVDA is not installed**: no process, no install directory
  in `%LOCALAPPDATA%\NVDA`, `%APPDATA%\NVDA` or either `Program Files` path, no `HKCU:\Software\NVDA`,
  no uninstall record, and no other screen reader (checked against JAWS, ZoomText, Window Eyes).
  Narrator is present and not running, and was deliberately not started.
- **Tests actually performed with a screen reader: none.** No speech was generated, synthesised,
  recorded or transcribed for this task. No software was installed and no machine-level setting was
  changed, because that was outside this task's authorization.
- **Announcements observed: none.** Problems found under NVDA: none observed, which is not the same as
  none existing. Fixes and retests under a screen reader: none.
- **Journeys left untested: all five** — sign in, dashboard, application wizard, KYC workspace, AI
  advisory workspace. The document gives the official NV Access install procedure (2026.3, the three
  launcher choices verbatim), the version-recording keys, a fresh-seed command for credentials, and per
  journey what to listen for — including the one that matters most: whether the `role=status` progress
  node is spoken early enough for a borrower to know an answer is still coming.
- **What *is* established, and labelled so it cannot be mistaken for a screen-reader result**:
  accessibility-tree inspection (axe-core 4.14 + Chrome AX tree) **VERIFIED for the tree only** —
  roles, names, landmarks, live-region presence, 0 unnamed controls, 0 dangling ARIA references;
  keyboard-only walkthrough **VERIFIED** — reachability, focus rings, activation. The AX tree is not the
  spoken output: NVDA adds verbosity settings, focus behaviour, layout-table handling, live-region
  timing and its own summarisation, so a node present in the tree can be skipped, deferred or rephrased
  in speech.

**Status: BLOCKED.** Everything a real NVDA run would prove is open, and the report says so instead of
substituting a proxy.

## F. Regression

Full detail with commands and raw output per suite: [regression.md](regression.md),
[`regression/`](regression). Every figure below is from a command run in this session on the current
worktree.

| Suite | Baseline | This run | Result |
| --- | --- | --- | --- |
| Host repository suite (`python -m pytest -q`) | 685 passed / 15 skipped | **685 passed, 15 skipped**, 2 warnings, 41.01s | match |
| Frappe portal app (`bench run-tests --app loan_advisory_portal`) | 171 / OK | **179 / OK**, 46.065s | +8, the new transcript-contract module |
| KYC page module | 2 / OK | **2 / OK**, 1.269s | match |
| Island unit tests | 72 (9 files) | **86 (10 files)**, 7.16s | +14, the thread-contract tests |
| Runtime gateway | 13 | **13 pass, 0 fail**, 10.045s | match |
| Island typecheck + build | clean | **clean**, 9.60s | match |
| Runtime typecheck | clean | **clean** | match |
| Python lint (`ruff 0.17.2`) | clean | **`All checks passed!`** | match |
| axe-core browser audit | 103 runs, 0 violations | **103 runs, 0 violations**, 0 console errors | match |

Browser harnesses, all guarded: `manual_contrast.cjs` 5 widths × 10 views, 0 below AA, 0
indeterminate; `keyboard_review.cjs` 30 walks, 605/605 focus indicators; `thread_continuity_e2e.cjs`
22/22 journey + 4/4 control; `missing_information_e2e.cjs` 5/5 valid + 6/6 negative;
`borrower_views.cjs` 5 widths × 17 views before and after the CSS change; `write_guard_proof.cjs`
5 attempts, 5 blocked, 0 reaching the server.

Two deliberate non-runs, recorded rather than hidden: the RAG agent and its index were never started
(no GPU work; `nvidia-smi --query-compute-apps` returned no rows), and no suite outside the task list
was run to inflate a count.

`bench run-tests` is a real write path, so business-table row counts were captured before and after it
and are **identical**: Loan Application 14, Borrower Profile 7, Loan Application Document 12, Advisory
Conversation 152, Advisory Message 332, Version 110, User 15.

Console and network across every guarded run in this task: **0 unexplained console errors, 0 failed
HTTP responses**, with one exception that *is* the test — the control run's single expected 404. The
first axe run's 2 blocked writes and 2 console errors were the same real finding, now 0
(§B/§A item 2, [harness-write-guards.md §5](harness-write-guards.md)).

**Status: VERIFIED** — every suite matches or improves on baseline, and both deltas (+8 Frappe, +14
island) are attributable to files this task added, not to a re-baselined expectation. No test was
weakened, skipped or re-marked to reach these numbers; the 15 skipped host tests are the same 15 as
the baseline.

## G. Environment cleanup

Full detail: [environment-lifecycle.md](environment-lifecycle.md),
[`environment/`](environment).

- **Started here (4):** Frappe dev server `:8001` inside `loanrangers-backend-1` (container pids
  8483/8486); nginx front door `127.0.0.1:8081` (`loanportal-acceptance-proxy`, id `4bd676ee8025`,
  created *without* `--rm`); CopilotKit runtime `127.0.0.1:4200` (host pid 36316); deterministic AG-UI
  stub `127.0.0.1:8096` (host pid 34888). **Deliberately not started:** the live FastAPI agent on
  `:8095`, the duplicate `loanportal-e2e-proxy`, anything that loads the retriever.
- **Stopped (4/4).** The Frappe dev server stopped cleanly (`:8001 no longer listening inside the
  container`) and the proxy stopped gracefully (`Exited (0)`, **not removed**). The two host `node`
  processes **could not be stopped gracefully** — Windows refused both with "This process can only be
  terminated forcefully" — so each was force-terminated *after* its identity was confirmed (`node`,
  started 21:15:22 and 21:19:30, inside this task's window). That deviation is the only one in the
  teardown and it is recorded in the log, not smoothed over.
- **Ports released:** no listener on 8081, 4200, 8096 or 8095; `:8001` released inside the container.
- **GPU:** `nvidia-smi --query-compute-apps=pid,used_memory --format=csv` returns only the header — no
  compute process, as intended, since the RAG agent never ran.
- **Persistent data preserved:** all 15 permanent containers (9 Frappe, 6 Langfuse) still `Up`, the
  Langfuse ones still `(healthy)`; `:8000` still serves (after correcting a probe that had omitted the
  site `Host` header and mis-read a 404 — both readings kept in the file). No `docker rm`, no
  `system prune`, no volume or image touched. The front door remains as a stopped container so its
  logs and config stay inspectable.
- **Secrets:** the run's credential file outside the repository was deleted, and the container-side
  copy verified gone. One pre-existing, root-owned `/tmp/seed_applications.json` (dated 2026-10-19) was
  found in the container, left untouched, and flagged for the owner in §I.

**Status: VERIFIED WITH LIMITATIONS** — services started here were all stopped and everything else
preserved; the limitation is that two of them required a forced termination, and `query session`
returned no rows, so the desktop-session fact rests on environment variables and WMI rather than
Terminal Services output.

## H. Changed files

Complete, verified list with per-file reasons and the explicit "not changed" section:
[changed-files.md](changed-files.md). Summary:

| Kind | Count | What |
| --- | ---: | --- |
| Created (source/test) | 5 | `tests/e2e/write_guard.cjs`, `write_guard_proof.cjs`, `thread_continuity_e2e.cjs`, `tests/test_transcript_contract.py`, `apps/web/assistant/src/island.test.tsx` |
| Modified (source/test) | 11 | `thread.ts`, `thread.test.ts`, `island.tsx`, `portal.css` (one declaration), `accessibility_audit.cjs` (the write-inducing state + guard), guard attached to `borrower_views.cjs` / `manual_contrast.cjs` / `keyboard_review.cjs` / `missing_information_e2e.cjs`, `package.json` (run script), `tests/e2e/README.md` |
| Regenerated build output | 409 files | `public/js/assistant/**` — the island bundle rebuilt and copied in, not hand-edited |
| Documents written | 9 | the six part reports plus [environment-lifecycle.md](environment-lifecycle.md), [changed-files.md](changed-files.md) and this report |
| Evidence files | 262 | 260 captures (screenshots, JSON, SQL probes, console output) under [`2026-11-01-findings-closure/`](./), plus the 2 axe reports the harness generates into its own folders |
| Deleted | 0 repo files | only this task's own scratch outside the repository (the credential file, and the probe script — moved into the bundle) |

Not changed, checked by a `-newer` scan rather than asserted: no server-side authorisation code
(`api/agent.py` and everything under `api/`), no `api/profile.py` consent logic, no `apps/api` FastAPI
agent file, no DocType, permission or ZEN rule, no template or page other than the single CSS
declaration, and no file in the previous acceptance bundle `2026-11-01/` (0 files newer than this
task's baseline — earlier reports were not rewritten).

## I. Final readiness status

The borrower portal is **VERIFIED WITH LIMITATIONS** for the routes, data paths and automated
accessibility checks that were exercised, and **not** ready to be called screen-reader accessible,
consent-timestamp-correct, or production-evidenced.

| Area | Status | Why not higher |
| --- | --- | --- |
| Data integrity of the audited incident | **VERIFIED** | the investigation is complete and reproducible; the *treatment* below is not |
| `consent_at` restored to `2026-10-31 18:13:36` | **BLOCKED** | the controller recomputes it on every save; restoring needs a code decision this task may not make |
| Consent restamping defect (any profile save rewrites the consent timestamp) | **NOT VERIFIED as fixed** — it is a live product defect, documented with its one-line cause | fixing it changes business logic, explicitly out of scope |
| Read-only harness cannot accidentally write borrower data | **VERIFIED** | guarded, and proven against five deliberate write attempts with a byte-identical database afterwards |
| Synthetic test transcripts removed from the borrower-visible store | **NOT VERIFIED** | 345 rows left in place; deletion is an unauthorised irreversible write |
| New assistant thread: no 404 on first load | **VERIFIED** | against the deterministic stub on a disposable site; live-model streaming verified earlier, not in this run |
| Ownership and enumeration protection on `conversation_messages` | **VERIFIED** | 9 scenarios pinned by 8 new server tests; the refusal was preserved on purpose |
| KYC identity-card contrast, five widths | **VERIFIED** | 0 indeterminate, per-node computed numbers, layout and focus proven unchanged |
| Portal-wide accessibility: axe + tree + keyboard | **VERIFIED WITH LIMITATIONS** | 42 axe runs still hold colour-contrast nodes the tool cannot decide (topbar, tabbar at 390), covered by the independent harness but not by a screen reader |
| Screen-reader behaviour (NVDA) | **BLOCKED** | NVDA absent; no substitution claimed |
| Automated regression suites | **VERIFIED** | every suite matches or improves; deltas attributed to files added here |
| Voice / LiveKit journeys | **NOT VERIFIED in this task** | out of scope; the token-minting route was guarded, nothing else was exercised |
| Real bureau, PAN/Aadhaar, underwriting policy | **NOT VERIFIED — out of scope by design** | masked placeholders and locked steps only; no external integration exists |
| Environment teardown and preservation | **VERIFIED WITH LIMITATIONS** | two node processes required forced termination, documented |
| Worktree safety | **VERIFIED** | baseline captured, nothing committed/pushed/merged/reset/cleaned, prior reports intact |

### The three things a reviewer should ask for next

1. **A decision on `consent_at`** (owner): fix `Borrower Profile.validate()` to stamp consent only when
   a consent flag changes — the API at `api/profile.py:110` already does this correctly — then restore
   once through the document API so the change is itself a Version row. Until then the field means
   "last save", and every consent audit built on it is wrong.
2. **A real NVDA session** (anyone with the machine): the five journeys in
   [screen-reader-blocker.md §4](screen-reader-blocker.md), with the recording sheet filled in. This is
   a one-time install decision, not an architecture gap — everything else it needs is already present.
3. **A scoped cleanup of the test transcripts** (owner): either delete exactly the rows
   `creation >= 2026-11-01 AND owner = review.demo@example.invalid` in `Advisory Conversation` /
   `Advisory Message`, or mark the account visibly as a test account. Longer term, a "test thread" flag
   would make fixture transcripts distinguishable without a cleanup at all.

Also for the record: `/tmp/seed_applications.json` in `loanrangers-backend-1` (root-owned, 2026-10-19,
9,890 bytes) predates this task and may hold seeding data; it was left untouched and is flagged rather
than deleted or read. And the `tests/e2e/README.md` standing rules now encode the two mistakes this task
found, so the next harness does not repeat them.

### Against the task's own definition of done

| # | Criterion | Outcome |
| --- | --- | --- |
| 1 | Five `consent_at` modifications investigated and treatment documented | **DONE** |
| 2 | No unexplained borrower-data changes remain | **DONE for explanation** — every change is attributed; two of them (345 transcript rows, the pre-existing seed file) remain *in place* under explicit owner decisions, which is disclosed rather than glossed |
| 3 | Read-only scenarios cannot accidentally write borrower information | **DONE** — guard plus five-attempt proof |
| 4 | First-load assistant thread no longer generates the known 404 | **DONE** |
| 5 | Existing conversation history and ownership checks remain correct | **DONE** — server unchanged, 9 scenarios pinned |
| 6 | The 12 KYC contrast pairs become measurable and satisfy requirements | **DONE** |
| 7 | A genuine NVDA test performed, or the exact blocker documented without false claims | **BLOCKER DOCUMENTED** — no NVDA test claimed |
| 8 | Relevant automated and browser tests pass | **DONE** |
| 9 | No new console errors or horizontal-overflow regressions | **DONE** — 0 console errors, `scrollWidth` unchanged at all five widths, 0 overflow offenders |
| 10 | Temporary services shut down safely | **DONE WITH DEVIATION** — two processes required `/F`, identity confirmed first, recorded |
| 11 | Worktree preserved | **DONE** |
| 12 | Report distinguishes verified from limited | **This document.** |
