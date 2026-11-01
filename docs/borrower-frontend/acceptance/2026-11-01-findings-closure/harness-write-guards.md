# Read-only harness write guards

Task: close the recurrence-prevention half of the `consent_at` finding in
[database-integrity.md](database-integrity.md) — make it structurally impossible for a read-only
validation run to change borrower data, and prove the mechanism rather than assert it.

Branch `feat/frappe-borrower-platform`, captured 2026-11-01. Test code only; no product behaviour
was changed to make a test pass.

## 1. What was true before

Every acceptance harness claimed to be read-only by *shaping its inputs so the server would refuse*
— clearing a required field, sending an over-long string, relying on the page's own validation to
stop a submit. That is a convention, not a control. It stops being true whenever a seeded fixture
happens to make the input valid, and nothing notices when a write goes through.

That is exactly how the original finding was produced: `loan_advisory_portal.api.profile.update_profile`
re-stamps `consent_at` whenever the payload contains an accepted consent field
([api/profile.py:110](../../../../apps/loan_advisory_portal/loan_advisory_portal/api/profile.py#L110)),
and the profile page's payload always contains both consent fields
([public/js/pages/profile.js:71](../../../../apps/loan_advisory_portal/loan_advisory_portal/public/js/pages/profile.js#L71)).
No browser request was ever inspected to confirm which run asked for those five writes.

## 2. The control

[tests/e2e/write_guard.cjs](../../../../tests/e2e/write_guard.cjs) installs `page.route("**/*")` before
the first navigation of every context and classifies each request before it leaves the browser.
`GET`, `HEAD` and `OPTIONS` pass through untouched. Everything else gets one of four decisions:

| Decision | Condition | Action |
| --- | --- | --- |
| `read` | path matches the posted-read list (§3) | `route.continue()` |
| `allowed` | mutating request the run declared | `route.continue()` |
| `blocked` | mutating request nobody declared | `route.abort("blockedbyclient")` |
| `noted` | method that is neither a safe read nor a declared write | `route.abort("aborted")` |

`blocked` and `noted` are both findings: `assertClean()` throws and each harness exits non-zero, so a
run that tries to write cannot report a pass. Two runs declare writes, by name and with a reason:

- **session writes** — `login`, `login_form`, `logout`, `refresh_csrf_token`, `POST /login`. A
  signed-in audit is impossible without them.
- **assistant-turn writes** — `agent.mint_assertion`, `agent.record_turn`, `livekit.*`,
  `/api/copilotkit`. Opt-in (`assistant: true`), because they are only correct for a run that
  actually holds a conversation. Of the seven harnesses, only the accessibility audit, the keyboard
  review, the missing-information journey and the thread-continuity journey opt in; the contrast
  harness renders the island but never asks it a question, so it declares nothing.

Nothing is disabled in the application to achieve this. The borrower can still save a profile; a test
cannot.

## 3. The correction the guard forced: POST is not a write here

The first run after wiring the guard into `borrower_views.cjs` blocked **10 requests to
`POST …api.applications.get_decision`**, printed `net::ERR_BLOCKED_BY_CLIENT.Inspector` console
errors, and exited non-zero — the guard had blocked a *read*, and the pages it ran on rendered with
empty decision panels.

Root cause: Frappe's calling convention sends every whitelisted method as a POST, and this portal's
client follows it — [public/js/portal.js:77](../../../../apps/loan_advisory_portal/loan_advisory_portal/public/js/portal.js#L77).
`Portal.call()` POSTs `get_profile`, `list_applications`, `get_decision` and the rest. A guard that
equated POST with write would blind the audit and then report the wreck as clean, which is worse than
the problem it solves.

The response was an enumeration, not a wildcard. All 32 `@frappe.whitelist` functions under `api/`
were listed and each one reachable from the borrower portal was read in its service file. The 12 that only
read are in `POSTED_READS`, each with the reason it is safe — e.g. `get_decision` selects a recorded
decision for an application the caller owns
([api/applications.py:235](../../../../apps/loan_advisory_portal/loan_advisory_portal/api/applications.py#L235)),
and `invitations.validate` checks a token while `invitations.redeem` is the write
([api/invitations.py:15 and :21](../../../../apps/loan_advisory_portal/loan_advisory_portal/api/invitations.py#L15)).
The portal's mutating methods (`profile.update_profile`,
`applications.create_application / submit_application / resubmit_application / withdraw_application`,
`documents.attach_document / remove_document`, `feedback.submit_feedback`, `invitations.redeem`,
`agent.mint_assertion / record_turn`) plus core Frappe's `upload_file`, which
[public/js/portal.js:98](../../../../apps/loan_advisory_portal/loan_advisory_portal/public/js/portal.js#L98)
posts directly, are absent from the list by construction — they can only pass through
`ASSISTANT_WRITES` or an explicit `allow`.

Honest gap: the failing console output of that first run was printed to the terminal and not saved as
a file, so it is quoted here rather than attached. The fix is verifiable in any later run: every
`writeGuard.byPath` since records `get_decision` as a passed read, including
[kyc-contrast/view-matrix-before/_summary.json](kyc-contrast/view-matrix-before/_summary.json).

## 4. Proof that it blocks

[tests/e2e/write_guard_proof.cjs](../../../../tests/e2e/write_guard_proof.cjs) is a harness whose only
job is to try to write, five ways, with the page's own session and CSRF token:

| # | Attempt | Route | Outcome |
| --- | --- | --- | --- |
| 1 | click the real UI: untick the privacy consent and press Save | `POST …api.profile.update_profile` | aborted in the browser |
| 2 | craft a new application | `POST …api.applications.create_application` | aborted in the browser |
| 3 | REST edit of the borrower's own profile document | `PUT /api/resource/Borrower Profile/<name>` | aborted in the browser |
| 4 | generic Frappe field setter | `POST …frappe.client.set_value` | aborted in the browser |
| 5 | upload a file | `POST …upload_file` (multipart, 1-byte blob) | aborted in the browser |

Attempt 1 is the exact route behind the original finding. Result
([write-guard-proof.json](database/write-guard-proof.json),
[console](database/write-guard-proof-console.txt)): **5 attempts, 5 blocked, 0 reached the server, 0
got any response other than an abort.** Guard summary for that run:
`{requestsSeen: 10, postedReads: 4, writesAllowed: 1, writesBlocked: 5}` — the one allowed write is
its own `POST /api/method/login`.

The page-level symptom is recorded too: the borrower saw `Could not save your profile / Failed to
fetch`, and `consentBefore {terms: true, privacy: true}` became `consentAfterClick {terms: true,
privacy: false}` in the DOM only — the checkbox state changed on screen and nothing persisted.

Database proof, before and after the same script, from
[write-guard-proof-probe.sql](database/write-guard-proof-probe.sql) (SELECTs only):
[before](database/write-guard-proof-before.txt) and [after](database/write-guard-proof-after.txt)
are **identical from line 2 to the end**; the only difference in either file is the header comment
that carries the timestamp and the word BEFORE or AFTER. Row counts across 11 tables, the `closure1-*`
consent fields, every `Borrower Profile` Version row and the newest `creation` per writable table are
unchanged. Screenshot: [write-attempt-proof.png](database/write-attempt-proof.png).

Process note, kept because it is part of the evidence: the first execution of this script failed at
login (`waitForURL("**/borrower")` timed out). Credentials were checked with curl (HTTP 200) and login
was reproduced successfully both with and without the guard attached in a temporary probe file, which
also re-confirmed that `session.me` and `list_applications` are posted reads. The probe was deleted;
the failure was transient, and the run above is the retry.

## 5. What the guard caught on its first real audit

The first five-width axe run of this task (103 runs, 0 violations) exited non-zero because it was
blocked from **two** writes:

```
UNEXPECTED blocked POST /api/method/loan_advisory_portal.api.profile.update_profile [1440/authed]
UNEXPECTED blocked POST /api/method/loan_advisory_portal.api.profile.update_profile [390/authed]
```

Traced to the `05-apply` state labelled *"Step 1 with a name that is too long"*. `#about-name` carries
`maxlength="140"` ([www/borrower/apply.html:94](../../../../apps/loan_advisory_portal/loan_advisory_portal/www/borrower/apply.html#L94)),
so filling 141 characters leaves a *valid* 140-character name; the client rule the state depended on
([public/js/pages/apply.js:123](../../../../apps/loan_advisory_portal/loan_advisory_portal/public/js/pages/apply.js#L123))
is unreachable through the field, validation passes, and Continue posts the step to the profile
([public/js/pages/apply.js:216-222](../../../../apps/loan_advisory_portal/loan_advisory_portal/public/js/pages/apply.js#L216-L222)).
The run's own comment claimed the opposite. An accessibility state was being audited while the wizard
silently renamed the demo borrower — and the state still reported "reached", because a visible error
of *some* kind was on screen.

Data impact checked before fixing: `tabVersion` holds **12** Borrower Profile rows and **0** mention
`full_name`; the demo profile still reads `Review Demo Borrower`. So no such write landed in the
recorded history of this site either. Why the pre-guard attempts did not land is **NOT VERIFIED** —
the two candidate explanations (refused by the server-side rules before `profile.save()`, or
overwritten by a later seed) cannot be separated without a request log that this container does not
keep (`@@log_bin = 0`).

Fix applied to the harness, not the app: the state now blanks the name, which is stopped by the
wizard's own rule before any request is made
([accessibility_audit.cjs:153-165](../../../../tests/e2e/accessibility_audit.cjs#L153-L165)). It still
audits an inline-validation error state, and it cannot post. The first run's report is preserved at
[kyc-contrast/accessibility-prev-run-blocked-write/](kyc-contrast/accessibility-prev-run-blocked-write/)
rather than overwritten.

The rerun confirms both halves
([kyc-contrast/accessibility/](kyc-contrast/accessibility/), captured 2026-11-01T16:24:16Z): 103 runs,
**0 violations, 0 distinct rules, 0 states not reached, 0 console errors, 0 writes blocked**, and the
state note changed from a click that produced some error to the specific
`message #about-name-error: Enter your full name.` at both 1440 and 390 — the validation error the
state claims to audit is now demonstrably the one on screen.

## 6. Counts from every guarded run in this task

| Harness | Run | Posted reads passed | Writes allowed | Writes blocked |
| --- | --- | ---: | ---: | ---: |
| `borrower_views.cjs` | KYC BEFORE matrix, 5 widths | 80 | 5 | 0 |
| `manual_contrast.cjs` | five widths × 10 views | 130 | 40 | 0 |
| `borrower_views.cjs` | KYC AFTER matrix, 5 widths | 80 | 5 | 0 |
| `write_guard_proof.cjs` | five write attempts | 4 | 1 | 5 |
| `accessibility_audit.cjs` | five widths, first run | 100 | 17 | **2** |
| `accessibility_audit.cjs` | five widths, after the §5 fix | 100 | 17 | 0 |
| `thread_continuity_e2e.cjs` | journey | 0 | 5 | 0 |
| `thread_continuity_e2e.cjs` | control | 0 | 1 | 0 |
| `keyboard_review.cjs` | 30 walks over five widths (37 guard contexts) | 124 | 43 | 0 |
| `missing_information_e2e.cjs` | 5 valid + 6 negative runs | 22 | 32 | 0 |

The allowed writes in the browser runs are `POST /api/method/login` (one per signed-in view per
width) and, where a conversation is held, `record_turn` plus the runtime calls that carry the turn.
No run in this task allowed a write to a borrower, application, document, decision or file record.
The thread-continuity harness records no posted reads because the island fetches its own transcript
with GET rather than through `Portal.call()`.

## 7. Standing rules for future runs

1. Attach a guard before the first navigation. A context without one is not a read-only run.
2. A new whitelisted method is classified by reading its service function, not by its name.
3. If a run needs to write, declare the route and say why; never widen the posted-read list to
   silence a block.
4. Keep `writesBlocked` in the report even when it is zero — the number is the control's evidence.
5. A blocked-write line is a finding about the application or the harness, not noise to delete from
   the transcript.
