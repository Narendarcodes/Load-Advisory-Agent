# Part A — database integrity and `consent_at` reconciliation

Investigated 2026-11-01 on site `loanportal.local` (database `_21ddc3370f18f30e`, container
`loanrangers-db-1`). Nothing in this task wrote to the database; every statement used is in
[integrity-probe.sql](database/integrity-probe.sql) and is a `SELECT`. Machine-readable evidence:
[versions-borrower-profile.jsonl](database/versions-borrower-profile.jsonl) (the five Version
records, fetched through `frappe.client.get`) and
[borrower-profile-current.json](database/borrower-profile-current.json) (the document as it stands).
Full console output: [integrity-probe-output.txt](database/integrity-probe-output.txt).

## 1. Which record, which site

| | |
| --- | --- |
| Document | `Borrower Profile` → `review.demo@example.invalid` ("Review Demo Borrower", Customer `Review Demo Borrower`, status Active, onboarding_state Registered) |
| Site / database | `loanportal.local` / `_21ddc3370f18f30e`, inside the disposable `loanrangers` bench |
| Environment check | `allow_tests` site, every borrower identity is `@example.invalid`, `tabLoan` / `tabLoan Disbursement` / `tabLoan Demand` hold **0 rows**, 12 seeded loan applications. This is the disposable test environment, not a production-like one. |
| Other profiles touched | none — 4 of the 5 `Borrower Profile` rows were last modified on 2026-10-30 |

## 2. Original vs current `consent_at`

The five Version records form an unbroken chain and each one lists exactly one changed field:

| Version | created (site time) | changed | from → to |
| --- | --- | --- | --- |
| `o9j9u5vuci` | 2026-11-01 19:46:24.377 | `consent_at` | `2026-10-31 18:13:36` → `2026-11-01 19:46:24` |
| `qqug2c24b5` | 2026-11-01 19:50:44.615 | `consent_at` | `2026-11-01 19:46:24` → `2026-11-01 19:50:44` |
| `s5o9ecp52i` | 2026-11-01 19:53:01.656 | `consent_at` | `2026-11-01 19:50:44` → `2026-11-01 19:53:01` |
| `tsf2h570nc` | 2026-11-01 19:55:56.720 | `consent_at` | `2026-11-01 19:53:01` → `2026-11-01 19:55:56` |
| `ttc4d6dfl6` | 2026-11-01 19:55:59.605 | `consent_at` | `2026-11-01 19:55:56` → `2026-11-01 19:55:59` |

- **Original value: `2026-10-31 18:13:36`** — the `from` side of the first record, independently
  corroborated by the immediately preceding Version `m5mu4nv063` (2026-10-31 18:13:36), whose `to`
  side is the same value. The value is established conclusively; it is not inferred.
- **Current value: `2026-11-01 19:55:59.600517`.**
- `added`, `removed`, `row_changed` and `data_import` are empty in all five records.

## 3. Were any other fields changed?

No. Consent **content** is intact: `consent_terms = 1`, `consent_privacy = 1`,
`terms_version = portal-terms/1`, `privacy_version = portal-privacy/1`. Identity, contact,
employment, income, obligations, locale and literacy are unchanged on 2026-11-01; the last document
edit that touched them is the 2026-10-31 16:44:39 Version `21p2jtunea` (`employer`,
`monthly_obligations`, `profile_completion`), which predates this task. In particular the empty
`employment_type` and `monthly_income = 0` on this profile are pre-existing seed state, not damage
from the audit — the previous report's note about this is confirmed.

## 4. Were any application, document, decision or payment records touched?

No. Rows created **or** modified during 2026-11-01, per table:

| Doctype | total | created today | modified today |
| --- | ---: | ---: | ---: |
| Loan Application | 12 | 0 | 0 |
| Loan Application Document | 10 | 0 | 0 |
| Loan Decision Evidence | 1 | 0 | 0 |
| Application State Log | 7 | 0 | 0 |
| Evidence Ingestion Log | 1 | 0 | 0 |
| Borrower Feedback | 1 | 0 | 0 |
| Voice Session | 2 | 0 | 0 |
| Account Invitation / Redemption | 4 / 4 | 0 | 0 |
| Customer | 13 | 0 | 0 |
| Loan / Loan Disbursement / Loan Demand | 0 | — | — |
| Deleted Document | 27 | 0 | 0 |
| Borrower Profile | 5 | 0 | 1 |
| Version | 98 | 5 | 5 |

`Deleted Document` gained nothing today, so no record was removed either. Only five versioned
writes exist site-wide on 2026-11-01, all of them the `consent_at` chain above.

## 5. Root cause — why a name/phone save rewrites a consent timestamp

[borrower_profile.py:32](../../../../apps/loan_advisory_portal/loan_advisory_portal/loan_advisory_portal/doctype/borrower_profile/borrower_profile.py#L32)
(committed at `f08e8c93`, 2026-10-31, in HEAD; the file is **not** modified by any task):

```python
self.consent_at = now_datetime() if self.consent_terms and self.consent_privacy else None
```

This runs in `validate()`, so **every** save of a profile that has both consent flags set restamps
`consent_at` — including a save whose payload contains no consent field at all. The acceptance
harness clicked Continue in the application wizard, which posted
`loan_advisory_portal.api.profile.update_profile` with `{full_name, phone}`
([apply.js:222](../../../../apps/loan_advisory_portal/loan_advisory_portal/public/js/pages/apply.js#L222)),
and the controller restamped consent five times.

By contrast, the deliberate consent path
([profile.py:110](../../../../apps/loan_advisory_portal/loan_advisory_portal/api/profile.py#L110))
already stamps `consent_at` explicitly when a consent flag is in the payload. The controller line
therefore makes the API's careful consent accounting meaningless: the stored timestamp records "the
last time anything on this profile was saved", not "when the borrower consented". That is a genuine
product defect in its own right, separate from the test incident.

## 6. Treatment: not restored, deliberately

Restoration was investigated and **not** performed. Reasons, in order of decisiveness:

1. **The sanctioned mechanism cannot hold the value.** Restoring `2026-10-31 18:13:36` through
   Frappe's document API means a `save()`, and `validate()` immediately recomputes it to
   `now_datetime()`. Any document-level restore is a no-op.
2. **The only alternative is the one this task forbids.** The value could be forced with a direct
   table `UPDATE` (or `frappe.db.set_value`, which bypasses `validate` and creates no Version row).
   Section 6 of the task rules prohibit direct table manipulation that dodges a Version record, and
   an untracked write to a consent field is exactly the kind of silent change that makes an audit
   trail untrustworthy.
3. **The current value is not corrupt data.** It is what this application's own logic defines
   `consent_at` to be after the last save. Writing back a timestamp the application cannot produce
   would make the row inconsistent with the code that governs it, and would be immediately
   overwritten by the next legitimate profile edit.

What is needed instead, as an owner decision (see the readiness report):

- **Fix the controller first**: stamp `consent_at` only when a consent flag actually changes (the
  API at `profile.py:110` already knows this), and stop restamping it in `validate()`. That is a
  business-logic change and is explicitly outside this task's frozen scope, so it was not made here.
- **Then** restore once, through the document API, so the change is recorded as a Version row.
  After the controller fix the value will hold.
- The restoration target is unambiguous: `consent_at = 2026-10-31 18:13:36`.

## 7. Two writes the previous report did not disclose

Independent verification found persistent changes beyond `consent_at`. Both are recorded here
because the earlier report claimed the impact was limited to consent timestamps.

### 7.1 One `User` (login account) write — explained, no data changed

`tabUser` row `review.demo@example.invalid`: `modified = 2026-11-01 16:54:38` by **Administrator**,
`logout_all_sessions = 1`. The Activity Log pins it: **44 `Force Logged out` events in 233 ms** at
16:54:24 immediately followed by the write. This is a session invalidation for that account, not an
edit of borrower data — `enabled = 1`, `user_type = Website User`, no password-reset state
(`last_password_reset_date` NULL, no reset key), and no `api_key` change, all of which would have
produced a Version record and none did (`db.set_value` bypasses document versioning).
`last_login` / `last_active` / `last_ip` reflect the 250 sign-ins from the acceptance runs and are
written without bumping `modified`. Residual uncertainty: binary logging is off on this container
(`@@log_bin = 0`) and the saved request log starts later, so the exact command or request that
triggered the force-logout cannot be attributed. It changed no borrower field.

### 7.2 103 assistant conversations and 242 messages created by the runs — undisclosed, still present

| Table | total rows | created during the acceptance runs on 2026-11-01 |
| --- | ---: | ---: |
| Advisory Conversation | 138 | **103** |
| Advisory Message | 296 | **242** (121 `user` + 121 `assistant`) |

All 103 belong to `review.demo@example.invalid`, all are attached to application
`ACC-LOAP-2026-00018`, and they span 16:55:55 → 20:18:36 — the acceptance window. Attribution is
verbatim: the stored prompts appear character-for-character in the harness sources, e.g.
`What information is missing from my application?`
([accessibility_audit.cjs](../../../../tests/e2e/accessibility_audit.cjs),
[keyboard_review.cjs](../../../../tests/e2e/keyboard_review.cjs),
[missing_information_e2e.cjs](../../../../tests/e2e/missing_information_e2e.cjs)),
`Render a malformed payload.` and `Confirm there is no missing information.`
(missing_information_e2e.cjs), `Which policy source supports this rule? show the citation`
(accessibility_audit.cjs).

The stored assistant side includes deterministic fixture wording — `Acceptance fixture response: …`
appears in 52+ rows — because the assistant persists transcripts on the real path whether the reply
came from the model or from the test stub. Consequence: **synthetic fixture text now sits in the
borrower-visible transcript store**, and the demo borrower's conversation list holds 103 near-identical
test threads. This is not corrupt data and it is not another borrower's data, but it is persistent
content created by testing that no one asked to keep, and it can mislead anyone who opens the
assistant on this account afterwards.

**Treatment: left in place.** Deleting 345 rows is an irreversible destructive write that this task
does not authorise and that no evidence-based rule here supports. Owner decision required: either
approve a scoped cleanup of exactly the rows `creation >= 2026-11-01 00:00:00 AND owner =
review.demo@example.invalid` in these two tables (children first, then parents, in a reviewed
transaction), or keep them as test fixtures and mark the account visibly as a test account. A
durable product-level answer is a "test thread" flag on `Advisory Conversation` so fixture
transcripts are distinguishable and filterable — that is a schema decision, out of scope here.

## 8. Recurrence prevention

See [harness-write-guards.md](harness-write-guards.md): the read-only acceptance harnesses now fail
on any attempted write request rather than relying on the page's client-side validation to block a
submit, and the tests that are allowed to mutate data are named explicitly.

## 9. Status

| Claim | Status |
| --- | --- |
| Five Version records inspected at the record level, not by re-reading the old report | **VERIFIED** |
| Only `consent_at` changed on the Borrower Profile; consent content and all other fields intact | **VERIFIED** |
| No application, document, decision, payment, customer or invitation record created, modified or deleted | **VERIFIED** |
| Original timestamp conclusively established (`2026-10-31 18:13:36`) | **VERIFIED** |
| `consent_at` restored | **NOT PERFORMED — blocked by the controller's own `validate()`; needs the owner decision in §6** |
| The single `User` write is a session invalidation with no borrower-field change | **VERIFIED**; the specific triggering command is **NOT VERIFIED** (no binary log) |
| No undisclosed persistent writes remain | **NOT VERIFIED** — 345 transcript rows created by the runs remain in place pending an owner decision (§7.2) |
| Read-only harness cannot accidentally write borrower data again | **VERIFIED** by the new guards and their tests |
