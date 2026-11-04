# Saral LMS doctypes and the review desk

Branch `feat/saral-lms-doctypes`. Closes the LMS gap list (G01 to G14) in [DATA_DICTIONARY.md](DATA_DICTIONARY.md) and adds the officer review desk (ADR-0008), the demo officer and the prototype consent texts (ADR-0009).

Every one of the 229 data-dictionary fields now has a Frappe location. The map is [`contracts/frappe_field_map.json`](../../contracts/frappe_field_map.json), copied into `contracts/data_dictionary.json` as `frappe_location`. `tests/test_saral_lms_doctypes.py` fails if a field loses its location or if a NEVER_STORE item gets a field.

## New doctypes (module Loan Advisory Portal)

All of them are custom app doctypes. Frappe Lending is not vendored in this repo, so nothing depends on a Lending doctype other than `Loan Application`.

| Doctype | Kind | Holds |
|---|---|---|
| Bureau Report Summary | document | Summary of one bureau pull: score, accounts, DPD, enquiries, exposure. Raw report as source reference + sha256. The bureau-report/2 columns stay empty until v2 ships. |
| KYC Verification | document | Masked PAN, PAN hash (officer only), Aadhaar last 4, statuses, match scores. |
| Bank Statement Summary | document | AA reference id, content sha256, fetch time, salary credits, cash flow, EMI debits, integrity (officer only). |
| Consent Text | document | Versioned consent wording. Seeded from `consent_texts.json`: credit check, KYC verification, bank statement fetch, data use. All are **PROTOTYPE, pending legal review**. Wording never changes once saved; a change is a new version. |
| Consent Record | document | One row per consent event: type, linked text, purpose, version, time, channel. Append-only; only `withdrawn_at` may be set later. |
| Document Extraction (+ Document Extraction Field) | document + child | Masked OCR values in the PR #41 shape, document sha256 and date, engine, integrity flags. No raw OCR text. |
| Signature Screening Result | document | Presence, crop sha256, similarity, anomaly score, refer flag. |
| Decision Snapshot (+ Rule Result, Decision Policy Parameter) | submittable + children | The frozen ZEN input JSON and its sha256, catalogue version, outcome, offer, borrower categories, internal reasons, rule results and the policy parameters used. **Immutable once submitted:** no `allow_on_submit` fields, and update, cancel and delete are refused. |
| Loan Review Action | child of Loan Application | Officer audit: action, from/to state, reviewer, time, required note, snapshot and its hash. |
| Borrower Employment History | child of Borrower Profile | Past and current employers. |
| Negative List Entry, Employer Caution Entry, Contact Fingerprint | document | Internal lists. Hashes only. |

**Changed:**
- **Borrower Profile:** gains DOB, nationality, address, PIN, residence type, months at address, employer category, employment status, joining date, total experience, gross pay, rent, and phone/email hashes.
- **Loan Decision Evidence.decision:** gains the four-level outcome plus COUNTER_OFFER. APPROVED, REJECTED and ERROR are kept.
- **Loan Application custom fields** (`custom_fields.py`):
  - the purpose as a Select of the four products;
  - the PAN hash;
  - links to the bureau, KYC, bank and snapshot records;
  - outcome, borrower categories and internal reasons (officer only);
  - the offer;
  - purpose details;
  - the disbursal account, with the account number in an encrypted Password field;
  - the review audit table.
- **`custom_credit_score`:** now read-only and filled from the bureau only. `custom_credit_score_origin` records where it came from. The portal accepts and ignores a typed score. A patch flags old typed scores as `APPLICANT_TYPED_LEGACY` without deleting them.

## Human review in the Frappe desk (ADR-0008)

- **Role:** `Loan Officer`, with desk access. It can read Loan Applications at permlevel 0 and 1. It has no write, submit or delete.
- **Workspace "Saral Review":** visible to Loan Officer and System Manager. It holds:
  - the **Saral Manual Review Queue** report, which lists Loan Applications in MANUAL_REVIEW, newest first, with purpose, amount, outcome, borrower categories, internal reasons and the Decision Snapshot;
  - a quick list of the same queue;
  - links to every evidence doctype.
- **Actions:** on a MANUAL_REVIEW form, the **Review** menu has Approve, Decline and Request info. Each one opens a required note. They call `loan_advisory_portal.api.review.approve`, `decline` and `request_info`. Each call:
  1. checks the role;
  2. locks the row;
  3. checks the move against `lifecycle.json` (MANUAL_REVIEW to APPROVED, REJECTED or INFO_REQUESTED);
  4. appends a Loan Review Action row (who, when, note, snapshot hash);
  5. sets the lifecycle state, and the native Lending status for a final decision;
  6. writes an Application State Log row with source `ops`.

  None of them writes to the Decision Snapshot.
- **Borrowers:** borrowers hold no Desk permission on any of these doctypes. Internal reasons, rule messages, the PAN hash and the review notes are at permlevel 1, which only Loan Officer and System Manager can read. The portal APIs never read them.
- **Writing snapshots:** `api.snapshots.record_decision_snapshot` is the trusted way to write a snapshot. It needs the Evidence Service role.

## Demo officer (ADR-0009)

```
bench --site <site> execute loan_advisory_portal.setup_demo.create_demo_officer
```

This creates `loan.officer.demo@example.invalid` with the Loan Officer role. The password is generated at run time with `secrets` and printed once. It is never committed. The command refuses to run unless `developer_mode` or `allow_demo_users` is set.

## Not verified here

There is no Frappe bench in this environment. The doctype JSON, the custom fields, the field map, the review rules and the snapshot controller are checked by the offline tests. Installing the workspace and the Report Builder report, and running the Frappe integration tests, still need a bench run.
