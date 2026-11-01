# Final MVP readiness report — consent integrity and synthetic data cleanup

Branch `feat/frappe-borrower-platform`, HEAD `7ec710e`, nothing committed, pushed or merged. Site
`loanportal.local` — the disposable bench, never `p1loan.local`. Evidence bundle:
[`2026-11-01-mvp-closure/`](./) (195 files; the bundle keeps the date the task specified — the run
crossed midnight IST at 2026-11-02 00:00, 2026-11-01T18:30Z).

Both approved workstreams are complete. The screen-reader workstream is **DEFERRED — POST-MVP** by owner
decision, and nothing in this bundle claims otherwise.

Four words are used deliberately below. **VERIFIED** — a command was run in this task and its output is
in this bundle. **VERIFIED WITH LIMITATIONS** — it passed, but the evidence does not cover everything a
reviewer would want. **NOT VERIFIED** — open. **DEFERRED** — out of scope by decision, not by failure.

## 1. Executive summary

| Workstream | Outcome |
| --- | --- |
| Consent timestamp correctness (§§1-5) | **Complete — VERIFIED.** Two production files changed, 14 lifecycle tests added, the historical value restored through the Frappe document API with a new auditable Version record, and a browser run proving four real saves produce one consent change instead of four |
| Synthetic transcript cleanup (§§6-10) | **Complete — VERIFIED.** 111 conversations / 224 messages revalidated per record, exported, deleted through the document API; 13 ambiguous conversations deliberately preserved and reported; the fixture teardown that let transcripts survive is fixed and demonstrated |
| Basic MVP accessibility (§11, the retained requirement) | **No regression — VERIFIED.** 103 axe runs with 0 violations, 0 contrast nodes below AA and 0 indeterminate, 595 tab stops all with a visible focus indicator |
| NVDA screen-reader testing | **DEFERRED — POST-MVP.** Not performed; not simulated; not claimed. See §6 for the one machine-level side effect that did happen |
| Regression suites | **All at or above baseline** — 685/15 host, 193 Frappe, 86 island, 13 runtime, clean build/typecheck, clean ruff |
| Environment and worktree | **VERIFIED** — every service started here stopped, ports released, GPU idle, 15 permanent containers intact, 78 → 85 worktree entries all accounted for |

## 2. Consent timestamp correctness

**Root cause, confirmed in the current code — and it was in two places, not one.** The controller
restamped `consent_at` on every `validate()`
([`borrower_profile.py:32`](../../../../apps/loan_advisory_portal/loan_advisory_portal/loan_advisory_portal/doctype/borrower_profile/borrower_profile.py#L32)
before the change), and the consent API stamped it whenever a consent flag appeared in the payload —
which the profile page always sends
([`api/profile.py:101-110`](../../../../apps/loan_advisory_portal/loan_advisory_portal/api/profile.py#L101-L110)
before the change). Fixing only the controller would have left the timestamp moving on every profile
save.

**New semantics** ([`consent-integrity.md`](consent-integrity.md) §2): the timestamp moves only on a
consent event — first grant, re-grant after a withdrawal, or acceptance of a notice version not already
recorded. Incomplete consent holds no timestamp and clears that notice's version. An unchanged consent
carries the stored value through, so unrelated saves are silent. A value the caller set deliberately is
respected, which is how the API records an acceptance and how a historical value is restored. No new
fields, no new consent model, no invented legal rule; revocation and re-consent follow the semantics the
code already implemented.

**Tests** ([`tests/test_consent.py`](../../../../apps/loan_advisory_portal/loan_advisory_portal/tests/test_consent.py),
14, real document lifecycle): `Ran 14 … OK`, inside `Ran 193 tests … OK` for the whole app. The negative
control matters most: with the pre-fix controller restored, **8 of the 14 fail**
([`consent-tests/negative-control-old-controller.txt`](consent-tests/negative-control-old-controller.txt))
— so these tests can detect the defect rather than merely coexist with it.

**Restoration**: `2026-10-31 18:13:36`, re-derived from the Version payloads before writing (five
incident records, corroborated by the preceding `m5mu4nv063`, chain unbroken), applied with
`frappe.get_doc()` + `.save()`, confirmed by a fresh read
([`database/restore-evidence.json`](database/restore-evidence.json)). A new Version record `97d9cnnkjd`
shows `2026-11-01 19:55:59` → `2026-10-31 18:13:36`. No SQL, no `frappe.db.set_value`, no Version-table
edit. Only `consent_at`, `modified`, `modified_by` changed on the profile; the only table count that
moved was `Version`, 110 → 111.

**Uncertainty that remains, stated:** the consent timestamps written before this fix are historical
records of "last save", not of consent, and cannot be repaired individually. The restored value is
correct for this borrower because the Version chain establishes what it was before the test incident; it
does not make the earlier rows trustworthy.

## 3. Synthetic transcript cleanup

Reported earlier as 103 conversations / 242 messages; measured now as **124 conversations / 290 messages**
in the approved scope — the earlier figure was right for its moment, and the acceptance runs that
followed it added more.

[`transcript-cleanup.md`](transcript-cleanup.md) records the per-record work. The rule was stricter than a
date filter: a thread was deleted only when **every** user message in it appears verbatim in a 33-file
corpus of harness and fixture **code** (not in reports that quote it), and its owner, user, customer and
application were checked individually.

| | |
| --- | --- |
| Deleted | **111 conversations, 224 messages**, 0 failures, via `frappe.delete_doc(..., delete_permanently=False)` |
| Preserved and reported | **13 conversations, 66 messages** — four prompts unplaceable in any harness source, no stub replies at all, two of the prompts generated by the product's own what-if form, and a creation window before the acceptance runs. Ambiguous, so kept |
| Untouched | 17 pre-cutoff conversations on the same account; 22 conversations belonging to other borrowers |
| Export | full manifest with metadata and message bodies, SHA-256 `80e52d4f…5eed6`, scanned clean of secrets; plus Frappe's own soft-delete snapshots (27 → 152) |
| Counts | conversations 163 → 52, messages 352 → 128, orphans 0 before and after |

Verification: as the borrower, `list_conversations` returns 30 threads with none of the deleted ids,
12 sampled deleted threads raise `DoesNotExist`, 12 sampled preserved threads still answer, the profile
and both applications are intact, and authentication and roles are unchanged
([`transcripts/verify-cleanup.json`](transcripts/verify-cleanup.json)). In a real browser, the rendered
history panel went from **2 items to 0 with the empty-state note** around a document-API deletion of the
fixture's own threads ([`conversation-list/`](conversation-list/)).

**Limitation, plainly:** the rendered panel was verified on a seeded fixture, not on
`review.demo@example.invalid`, because this task does not hold that account's password and resetting it
to take a screenshot is an auth change nobody asked for. For that account the list is verified at the
exact read the panel renders.

**Recurrence:** [`e2e_seed.teardown`](../../../../apps/loan_advisory_portal/loan_advisory_portal/tests/e2e_seed.py)
now removes a fixture's conversations and customers — the gap that produced this whole cleanup — and was
demonstrated on a live fixture (`conversationsRemoved: 1`, no orphans), then used for real on the three
fixtures this task created.

## 4. Functional application verification

Everything the previous bundles fixed is still fixed, re-run rather than assumed
([`regression.md`](regression.md)):

| Behaviour | Evidence |
| --- | --- |
| New assistant thread is 404-free on first load | journey 22/22, 0 unexpected 404; control run still refuses exactly once, proving the fix removed a request and not a security answer |
| Conversation restoration after reload | 1 request → 200, recorded exchange restored; reopened older conversation restores correctly |
| Ownership and enumeration protection | unchanged server behaviour; 8 Frappe transcript-contract tests and 13 island thread tests still pass |
| Missing Information GenUI card | 5/5 valid runs, 6/6 negative runs, 0 console errors |
| KYC identity card | 0 nodes below AA and 0 indeterminate at five widths; 14 card nodes measured individually; the `--ink` surface from the previous task is still in place |
| Responsive layout | 85 screenshots across 17 views × 5 widths, no horizontal overflow |
| Consent save paths | 4 browser saves → 4 Version rows, only 1 consent change |
| Suites | 685 passed / 15 skipped host; 193 Frappe; 86 island; 13 runtime; clean build, typecheck and ruff |

Two harness defects surfaced during this work and were fixed rather than narrated away: fixture-coupled
application ids that produced 15 console errors pointing at nothing wrong in the portal, and a hardcoded
"no screen reader installed" string in the keyboard evidence that would have become a false statement.
Both are described with their before/after runs in [`regression.md`](regression.md) §2.

## 5. Automated accessibility and basic keyboard accessibility

**Automated accessibility — VERIFIED, no regression.** axe-core 4.14 over 103 runs at 1440/1280/1024/768/390:
0 violations, 0 distinct rules violated, 0 states not reached, 0 console errors. Independent contrast
recomputation: 0 text nodes below AA and 0 indeterminate anywhere in the matrix, the tightest passing
measurement reported as 4.68:1 rather than rounded. Accessibility-tree review: 0 unnamed controls, 0
dangling ARIA references, live regions present where expected.

**Basic keyboard accessibility — VERIFIED.** 30 page/width walks, 595 tab stops, **all 595 with a visible
focus indicator**, no traps, activation checked, no page errors. Form labels, validation messages, status
and error semantics and heading structure are all covered by the axe and tree runs above.

The 21-stop difference against the previous 605-stop figure is the new fixture having fewer applications
and documents to tab through, not a lost control: stops-without-ring and unnamed controls are both 0.

## 6. NVDA screen-reader testing — DEFERRED — POST-MVP

Not performed. No journeys run, no announcements captured, no speech simulated, no transcript generated
for this report. **Screen-reader accessibility is not claimed anywhere in this bundle**, and the portal
should not be described as having passed full screen-reader accessibility testing.

One thing must be disclosed rather than quietly reversed. The instruction that arrived asked for NVDA not
to be installed; NVDA 2026.3 had already been installed minutes earlier, under the previous scope and with
the owner's approval at the time, from the official distribution with a verified Authenticode signature
(signer `CN=NV Access Limited`, SHA-256 recorded). Details, consequences and the removal decision are in
[`environment-lifecycle.md`](environment-lifecycle.md) §4:

- installed machine-wide at `C:\Program Files\NVDA`, version `2026.3.0.58174`;
- it ran briefly while its own help was being read, and was stopped — it is not running now;
- **no** start-at-sign-in entry, no scheduled logon task, no user configuration written;
- no accessibility conclusions were drawn from it, and the harness evidence that used to assert "no
  screen reader installed" now states the real machine state instead;
- removal is the owner's decision: `C:\Program Files\NVDA\uninstall.exe`, or keep it for the deferred
  post-MVP pass. This task will not uninstall software it is not being asked to uninstall, and it did not
  hide the fact that it is there.

The post-MVP procedure — official install, five journeys, what to listen for, a recording sheet — already
exists and is still accurate except for the "absent machine" facts at its top:
[`../2026-11-01-findings-closure/screen-reader-blocker.md`](../2026-11-01-findings-closure/screen-reader-blocker.md).

## 7. Verdict table

| Item | Verdict |
| --- | --- |
| Unrelated profile saves no longer modify `consent_at` | **VERIFIED** |
| First consent, re-consent, new notice version, incomplete consent, revocation | **VERIFIED** — 14 lifecycle tests plus a negative control that fails 8 of them without the fix |
| Consent API and controller agree on one definition of a consent event | **VERIFIED** |
| Original `consent_at` restored through the Frappe document API, confirmed by a fresh read | **VERIFIED** — `2026-10-31 18:13:36`, Version `97d9cnnkjd` |
| Consent audit trail correct going forward | **VERIFIED for new events**; historical rows recorded "last save" — **NOT VERIFIED as trustworthy history** |
| Approved synthetic transcripts exported and removed | **VERIFIED** — 111 / 224, manifest + soft-delete snapshots |
| No unrelated or ambiguous records deleted | **VERIFIED** — 13 preserved, 17 pre-cutoff and 22 other-owner intact |
| No orphaned messages | **VERIFIED** — 0 before and 0 after |
| Borrower-facing conversation list reflects the deletion | **VERIFIED WITH LIMITATIONS** — rendered and re-rendered on a seeded fixture; verified for the cleaned account through the API read the panel is built from |
| Future test runs cannot leave synthetic transcripts behind | **VERIFIED** — teardown fixed and demonstrated on a live fixture |
| Previous assistant, KYC and responsive fixes intact | **VERIFIED** |
| Automated accessibility and keyboard basics do not regress | **VERIFIED** |
| Regression suites and lint | **VERIFIED** — at or above baseline across the board |
| Temporary services shut down, permanent stack and volumes preserved | **VERIFIED** |
| Worktree and historical evidence preserved | **VERIFIED** — 78 → 85 entries, every one itemised; both earlier bundles untouched |
| NVDA screen-reader testing | **DEFERRED — POST-MVP** |
| Portal is screen-reader accessible | **NOT VERIFIED** — and not claimed |
| Voice / LiveKit journeys, real bureau, PAN/Aadhaar, underwriting policy | **OUT OF SCOPE — NOT VERIFIED**; masked placeholders and locked steps only |

## 8. Definition of done

| # | Criterion | Outcome |
| --- | --- | --- |
| 1 | Unrelated profile saves no longer modify `consent_at` | **DONE** |
| 2 | Explicit consent events follow the documented contract | **DONE** — no new rules invented; the existing acceptance path is the contract |
| 3 | Original timestamp restored through the Frappe document API | **DONE** |
| 4 | Consent regression tests pass | **DONE** — 14/14, and 8 fail without the fix |
| 5 | Approved synthetic records exported and removed | **DONE** |
| 6 | No unrelated borrower data deleted | **DONE** |
| 7 | No orphaned messages remain | **DONE** |
| 8 | Previous assistant and KYC fixes intact | **DONE** |
| 9 | Relevant regression tests pass | **DONE** |
| 10 | Basic MVP accessibility does not regress | **DONE** |
| 11 | Temporary services safely shut down | **DONE** |
| 12 | Worktree and historical evidence preserved | **DONE** |
| 13 | NVDA documented as deferred post-MVP | **DONE** — §6, with the install disclosed rather than buried |

## 9. What a reviewer should ask for next

1. **Consent history, not just the current value.** `consent_at` is trustworthy from here. If the project
   needs defensible consent *evidence* for real borrowers, that needs a product decision — an append-only
   consent event record rather than one overwritten timestamp — and it is a schema change, deliberately
   not attempted here.
2. **The 13 preserved conversations.** They are almost certainly manual sessions, but they are the demo
   borrower's visible history. Either confirm their provenance and keep them, or approve their removal by
   id — the list is in [`transcripts/classification-detail.json`](transcripts/classification-detail.json).
3. **The deferred NVDA pass**, whenever MVP accessibility is taken past the automated checks. The
   journeys, the listening sheet and the five things to hear are already written; the one open question
   right now is whether to keep or uninstall the copy on this machine.
4. **The pre-existing `/tmp/seed_applications.json`** in the backend container remains untouched and out
   of scope, as instructed.
