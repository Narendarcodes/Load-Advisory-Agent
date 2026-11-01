# Consent timestamp integrity

Part A of the MVP closure. Code fix, regression tests, restoration of the historical value through the
Frappe document API, and the verification that nothing else moved.

Site `loanportal.local` (database `_21ddc3370f18f30e`), branch `feat/frappe-borrower-platform`,
HEAD `7ec710e`, captured 2026-11-01. Raw evidence in [`database/`](database/) and
[`consent/`](consent/).

## 1. Root cause, verified against the current code

Two paths wrote `consent_at`, and both were wrong in different ways.

| Path | Code as found | Behaviour |
| --- | --- | --- |
| Controller | [`borrower_profile.py:32`](../../../../apps/loan_advisory_portal/loan_advisory_portal/loan_advisory_portal/doctype/borrower_profile/borrower_profile.py#L32) — `self.consent_at = now_datetime() if self.consent_terms and self.consent_privacy else None` inside `validate()` | **every** save of a profile holding both consent flags restamped the timestamp — including saves whose payload contained no consent field at all |
| Consent API | [`api/profile.py:101-110`](../../../../apps/loan_advisory_portal/loan_advisory_portal/api/profile.py#L101-L110) — stamps `consent_at` whenever a consent flag is *present in the request* and accepted | the profile page's `payload()` always includes both checkboxes, so any profile save was treated as a fresh acceptance |

The earlier incident was the controller line: the acceptance harness clicked Continue in the wizard,
which posts `{full_name, phone}` only, and consent was restamped five times
([the previous bundle's investigation](../2026-11-01-findings-closure/database-integrity.md) §5 stands;
its §6 recommendation is what this task implements).

The DocType itself is fine: `consent_at` is a read-only Datetime with `track_changes: 1`, so every
change is a Version row and no desk form can edit it. `Voice Session` has an unrelated field of the
same name and was not touched.

## 2. The semantics now implemented

The invariant: **`consent_at` records a consent event, never the last save of the document.**

[`sync_consent_timestamp()`](../../../../apps/loan_advisory_portal/loan_advisory_portal/loan_advisory_portal/doctype/borrower_profile/borrower_profile.py#L32-L60)
replaced the one-liner and is called from `validate()`:

| Requirement | Behaviour |
| --- | --- |
| 1. First-time explicit consent records a timestamp | no previous document, or no stored timestamp, and both flags set → stamped now |
| 2. An unrelated profile save preserves it | previously granted, versions unchanged, caller did not set the field → the stored value is carried through untouched |
| 3. Repeated saves do not overwrite it | same rule as 2, so the third and fourth save are as silent as the first |
| 4. Accepting a newly required notice version follows the existing contract | a notice version that differs from the stored one is a consent event; the API records the version and the timestamp moves once |
| 5. Incomplete consent claims nothing | either flag off → `consent_at` is `None` and that notice's `*_version` is cleared |
| 6. Revocation then re-consent | revocation clears the timestamp; re-granting has no stored value, so the next acceptance is stamped as a new event |

A value that differs from the stored one is left alone: that is how the consent API records an
acceptance, and it is how a historical value is restored through the document API — the only mechanism
this task was allowed to use. No new fields, no consent-event model, no legal rules invented.

[`api/profile.py`](../../../../apps/loan_advisory_portal/loan_advisory_portal/api/profile.py#L98-L116)
was changed to match: a stamp happens only when the acceptance **changes** the consent state or records
a notice version that is not already on the document. An unchanged resend of two ticked boxes is not a
consent event. Without this second half the fix would be cosmetic, because the profile page always
resends both fields.

## 3. Regression tests

[`tests/test_consent.py`](../../../../apps/loan_advisory_portal/loan_advisory_portal/tests/test_consent.py) —
14 tests, all driving the real document lifecycle (`insert`, `save`, the whitelisted
`update_profile`), none mocking `validate()`:

```
test_a_profile_created_without_consent_holds_no_timestamp
test_first_explicit_consent_records_a_timestamp
test_unrelated_profile_save_preserves_the_consent_timestamp
test_the_wizard_payload_that_caused_the_finding_leaves_consent_untouched
test_repeated_saves_do_not_restamp_consent
test_saving_the_document_outside_the_api_does_not_restamp
test_resending_unchanged_checkboxes_is_not_a_new_consent_event
test_document_validation_alone_does_not_move_the_timestamp
test_incomplete_consent_never_claims_consent
test_revocation_then_reconsent_records_a_new_event
test_a_newly_required_notice_version_is_stamped_when_accepted
test_a_rejected_consent_write_leaves_no_timestamp
test_a_timestamp_set_deliberately_by_the_caller_is_kept
test_the_audit_trail_shows_consent_events_and_not_ordinary_edits
```

Result: `Ran 14 tests … OK`; the whole portal app suite is **`Ran 193 tests in 43.092s` / `OK`**
(179 historical baseline + these 14) in
[`consent-tests/frappe-portal-suite-after-consent-fix.txt`](consent-tests/frappe-portal-suite-after-consent-fix.txt).

**These tests can fail — proven, not asserted.** The module was re-run with the pre-fix controller
taken from `git show HEAD:…borrower_profile.py` and copied into the container:
**14 tests, 8 failures** ([`consent-tests/negative-control-old-controller.txt`](consent-tests/negative-control-old-controller.txt)).
Every failure is a preservation case; the consent-event cases still passed, which is exactly the shape
of the defect — the old code stamped too much, never too little. The fixed file was redeployed
immediately after (md5 verified against the repository copy).

One framework fact is worth recording: Frappe suppresses Version rows inside tests
(`Document._save` sets `flags.ignore_version = frappe.in_test`), so the audit-trail test saves with
`ignore_version=False` to see the real payload. The live-site Version record is verified in §5.

## 4. Restoration through the document API

Reverified first ([`database/probe-before.json`](database/probe-before.json)): the site is
`loanportal.local`, `db_name` `_21ddc3370f18f30e`, `allow_tests` true, the borrower is
`review.demo@example.invalid`, `Loan`/`Loan Disbursement`/`Loan Demand` hold 0 rows. The consent chain
was re-derived from the `Version` payloads, not from the earlier report:

| | |
| --- | --- |
| Incident records | `o9j9u5vuci`, `qqug2c24b5`, `s5o9ecp52i`, `tsf2h570nc`, `ttc4d6dfl6` — the five `consent_at` changes dated 2026-11-01 |
| Original (the `from` side of the first) | `2026-10-31 18:13:36` |
| Corroborated by preceding record | `m5mu4nv063` (its `to` side is the same value) |
| Chain unbroken | every `to` equals the next `from`, across all 7 pre-existing entries |
| Value before restoration | `2026-11-01 19:55:59.600517` |

Mechanism ([`database/consent_timestamp.py`](database/consent_timestamp.py), `--mode restore`):
`frappe.get_doc("Borrower Profile", …)` → set `consent_at` → `document.save()` → commit. No SQL
`UPDATE`, no `frappe.db.set_value`, no Version-table edit.

Outcome ([`database/restore-evidence.json`](database/restore-evidence.json),
[`database/probe-after.json`](database/probe-after.json)):

| Check | Result |
| --- | --- |
| Fresh document read | `consent_at = 2026-10-31 18:13:36` — **restored** |
| New Version record | `97d9cnnkjd`, `consent_at` `2026-11-01 19:55:59` → `2026-10-31 18:13:36`, written by the document lifecycle |
| Version rows | 110 → 111, i.e. exactly the one expected entry |
| Fields changed | `consent_at`, `modified`, `modified_by` — nothing else |
| Table counts | only `Version` moved |

A correction, kept rather than hidden: the first version of this script tried to prove that
`validate()` leaves the restored value alone by calling `sync_consent_timestamp()` on a freshly loaded
document and comparing. That check was wrong — `get_doc_before_save()` is only populated during a real
save, so it reported `false` against a correct database. The check was removed and replaced with a live
one ([`database/verify-restored-holds.json`](database/verify-restored-holds.json)): a no-field-change
save of the synthetic `closure1-borrower` fixture, whose `consent_at` was
`2026-11-01 21:15:35.074035` before and is `2026-11-01 21:15:35.074035` after — the validation on the
real site no longer moves it, and the save created no Version noise. The demo profile's value is still
the restored one.

## 5. Browser-level proof on a real save path

`git status` cannot show this, so a Playwright harness does:
[`tests/e2e/consent_regression_e2e.cjs`](../../../../tests/e2e/consent_regression_e2e.cjs) signs in as
a freshly seeded fixture (`mvp1-borrower@example.invalid`, application `ACC-LOAP-2026-00024`) and
performs four saves a real borrower performs, with the write guard attached and `update_profile`
declared as this run's own deliberate write.

| Save | Version row content |
| --- | --- |
| employer (consent boxes resent, first acceptance) | `employer`, `terms_version`, `privacy_version`, **`consent_at` 23:27:06 → 23:29:53** |
| monthly income | `monthly_income` only |
| wizard step 1 — `full_name` + `phone`, no consent keys | `full_name`, `phone` only |
| monthly obligations | `monthly_obligations` only |

Four saves, four Version rows, **one** of them a consent change — and that one is the genuine first
acceptance of the notices, which is what requirement 4 asks for. Under the previous code every one of
the four restamped consent. Harness result: 7/7 checks passed, 5 writes allowed, 0 blocked, 0 console
errors ([`consent/consent-browser-results.json`](consent/consent-browser-results.json),
[`consent/db-baseline-before-browser.txt`](consent/db-baseline-before-browser.txt),
[`consent/db-after-browser-run.txt`](consent/db-after-browser-run.txt),
[`consent/profile-after-consent-saves-1440.png`](consent/profile-after-consent-saves-1440.png)).

## 6. Status

| Claim | Status |
| --- | --- |
| Root cause verified against current code, both write paths | **VERIFIED** |
| `consent_at` means a consent event, not the last save | **VERIFIED** — 14 lifecycle tests, negative control failing 8 without the fix, live browser save path |
| Original value re-established from Version payloads | **VERIFIED** — `2026-10-31 18:13:36`, corroborated and chain-consistent |
| Restored through the Frappe document API, with a new Version record | **VERIFIED** — `97d9cnnkjd`, fresh read matches |
| Nothing else on the profile or in the account changed | **VERIFIED** — only `consent_at`/`modified`/`modified_by`; only the `Version` count moved |
| Revocation and re-consent follow established semantics | **VERIFIED for the implemented rule** — flags off clear the timestamp and the notice version; re-granting stamps a new event. No new legal rule was invented, and none was needed: the API's acceptance path already defined it |
| Behaviour for a profile whose notice version was never recorded | **VERIFIED as designed** — the first acceptance that records a version is a consent event and stamps once (seen in §5) |
| The consent timestamps written before this fix are individually attributable to a consent event | **NOT VERIFIED** — historical rows recorded "last save"; the chain above is the evidence of what they mean, and no back-dating beyond the restored value was attempted |
