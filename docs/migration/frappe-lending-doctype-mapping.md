# Frappe Lending doctype mapping

How borrower data is stored after the migration: which upstream Frappe Lending doctypes are reused, which fields are added, and which doctypes the portal owns. Everything described here exists on the disposable site `loanportal.local` (Frappe 16.51.0, ERPNext 16.50.0, Lending 16.6.1) and is exercised by the app's test suite in `apps/loan_advisory_portal/loan_advisory_portal/tests/` (current totals in the [test plan](../testing/borrower-platform-test-plan.md)).

## 1. Principles

1. **Never fork Lending.** `Loan Application`, `Loan Product`, `Customer`, `Loan Document Type` and `File` stay upstream. Portal-specific fields are created as Custom Fields by `install.py:LOAN_APPLICATION_FIELDS`, idempotently, on `after_install` and `after_migrate`.
2. **One writer per record class.** The portal writes profiles, invitations, feedback, conversations and voice sessions; the agent writes decision evidence. The portal only reads evidence.
3. **Borrowers never get desk doctype permissions.** They reach data through whitelisted methods that call `borrower_context()` / `owned_application()`. `tests/test_permission_boundary.py` pins that no generic read path exists for Lending doctypes and that a borrower cannot list another Customer.
4. **The legacy FastAPI service already used Frappe as the system of record** (`infrastructure/frappe_adapter.py` performed REST calls against `Loan Application`). The migration moves *route ownership*, not the data: same doctypes, same field names, different caller.

## 2. Record relationships

```mermaid
erDiagram
    User ||--|| Borrower Profile : "autoname = user"
    Customer ||--o| Borrower Profile : "customer"
    Customer ||--o{ Loan Application : "applicant_type=Customer"
    Loan Product ||--o{ Loan Application : "loan_product"
    Loan Application ||--o{ Application Document : "documents (upstream child)"
    Loan Application ||--o| Loan Decision Evidence : "custom_latest_evidence"
    Loan Application ||--o{ Advisory Conversation : "application"
    User ||--o{ Advisory Conversation : "user"
    User ||--o{ Voice Session : "user"
    User ||--o{ Borrower Feedback : "user"
    Customer ||--o{ Account Invitation : "customer"
    Account Invitation ||--|| Account Invitation Redemption : "autoname = invitation"
    Account Invitation Redemption }o--|| User : "user"
```

`Advisory Conversation.application` is nullable: a conversation can exist before an application is selected.

## 3. Upstream doctypes in use

| Doctype | Role | Notes |
| --- | --- | --- |
| `Loan Application` | the borrower's application | required fields `applicant_type`, `company`, `posting_date`, `loan_product`; child tables `documents`, `co_applicants`, `proposed_pledges` |
| `Loan Product` | amount ceiling and rate | resolved by `api/applications.py:_resolve_product` — `frappe.conf["loan_advisory_product"]` if set, otherwise the single enabled term-loan product; anything else is a 503 |
| `Customer` | the borrower as a person | one per portal user (see `services/invitations.py` conflict checks) |
| `Loan Document Type` | the `document_type` select on `documents` | portal lists it (`api/documents.py:list_document_types`) |
| `File` | uploads | private-only, owner-checked, extension and 10 MB limits (`api/documents.py:ALLOWED_EXTENSIONS`, `MAX_BYTES`) |

`Loan Application.status` is upstream (`Open` / `Approved` / `Rejected`) and is **not** shown to the borrower. The borrower-facing state is `custom_lifecycle_state`.

### 3.1 Custom fields on `Loan Application`

Created by `install.py:LOAN_APPLICATION_FIELDS` after `loan_amount`:

| Field | Type | Written by | Purpose |
| --- | --- | --- | --- |
| `custom_underwriting_section` | Section Break | — | groups the portal fields in the desk form |
| `custom_loan_purpose` | Data | borrower (validated, ≤ 200 chars) | what the loan is for |
| `custom_monthly_income` | Currency | borrower, defaulted from profile | underwriting input |
| `custom_monthly_obligations` | Currency | borrower, defaulted from profile | underwriting input |
| `custom_credit_score` | Int | optional; the wizard no longer asks | policy input; `0` is normalised to `None` on read |
| `custom_employment_months` | Int | borrower, defaulted from profile | policy input (0–720) |
| `custom_external_ref` | Data, **unique** | server (`POR-<uuid hex>`) | stable external key; the legacy adapter's `custom_external_ref` seed key |
| `custom_lifecycle_state` | Select | server | `DRAFT, SUBMITTED, INFO_REQUESTED, UNDER_REVIEW, MANUAL_REVIEW, APPROVED, REJECTED, WITHDRAWN` — **`DRAFT` must stay first** (Frappe defaults a blank Select to its first option) |
| `custom_submitted_at` | Datetime, read-only | `submit_application` | set when the borrower submits |
| `custom_policy_version` | Data, read-only | agent write path (pending) | denormalised for the list view |
| `custom_latest_evidence` | Link → `Loan Decision Evidence`, read-only | agent write path (pending) | pointer to the current evidence record |

## 4. Portal-owned doctypes

All are module **Loan Advisory Portal**, all restricted to `System Manager` (plus read-only `Agent Integration` where noted), and all reachable by borrowers only through whitelisted methods.

| Doctype | Autoname | Key fields | Permissions | Written by |
| --- | --- | --- | --- | --- |
| `Borrower Profile` | `field:user` | `user`, `customer`, `status` (Active/Suspended/Closed), `onboarding_state` (Invited/Registered/Profile Complete), identity (`full_name`, `email`, `phone`), employment (`employment_type`, `employer`, `employment_months`), financial (`monthly_income`, `monthly_obligations`), preferences (`preferred_locale` en/hi/mr, `literacy` standard/plain), consents (`consent_terms`, `consent_privacy`, `consent_at`), `profile_completion`, `last_verified_at` | System Manager | invite redemption, `api/profile.update_profile` |
| `Account Invitation` | `field:invitation_id` | `invitation_id`, `email`, `customer`, `application`, `expires_at`, `revoked`, `redeemed`, `issued_by`, `secret_hash`, `note` | System Manager | `services/invitations.issue_invitation` / `revoke_invitation` |
| `Account Invitation Redemption` | `field:invitation` | `invitation`, `email`, `customer`, `user`, `redeemed_at` | System Manager (create via service, delete only) | `services/invitations.redeem` |
| `Borrower Feedback` | `LAFB-.#####` | `user`, `customer`, `application`, `rating` (1–5), `category` (General/Application/Decision/Assistant/Voice/Other), `message`, `status` (New/Reviewed/Closed), `submitted_at` | System Manager; `Loan Borrower` read+create, **if_owner** | `api/feedback.submit_feedback` |
| `Advisory Conversation` | `field:thread_id` | `thread_id` (≤128), `user`, `customer`, `application`, `title`, `turn_count`, `last_activity`, `status` (Open/Closed) | System Manager | `api/agent._touch_conversation`, `api/agent.record_turn` |
| `Voice Session` | `field:session_id` | `session_id`, `room`, `identity`, `user`, `customer`, `application`, `expires_at`, `status` (Created/Joined/Ended/Expired), `created_at`, `consent_version`, `consent_at`, `ended_at` | System Manager; `Agent Integration` read | `api/livekit.create_voice_session` (consent required); `api/livekit.end_voice_session`; worker marks Joined/Expired through `voice_assertion` |
| `Loan Decision Evidence` | `field:record_id` | `record_id`, `loan_application`, `decision` (APPROVED/REJECTED/ERROR), `lifecycle_state`, `policy_id`, `policy_version`, `policy_sha256`, `jdm_sha256`, `input_sha256`, `engine`, `evaluated_at`, `trace_sha256`, `trace_store`, `is_simulation`, `record_json` | System Manager; `Agent Integration` read | agent service only (portal is read-only) |

`Account Invitation` secret handling: the link is `<invitation_id>.<secret>`; only `secret_hash` is stored. Redemption is single-use, expiry-checked and revoked by re-issue.

## 5. Field mapping from the legacy service

| Legacy name | Frappe | Note |
| --- | --- | --- |
| `application_ref` (URL) | `Loan Application.name` | opaque id; `custom_external_ref` is the stable seed key |
| `applicant_ref` (claim) | `Customer.name` via `Borrower Profile.customer` | never accepted from a request body |
| `loan_amount` | `loan_amount` | same |
| `tenure_months` | `repayment_periods` | no `custom_tenure_months` field exists despite the legacy adapter docstring |
| `purpose` | `custom_loan_purpose` | |
| `monthly_income` / `monthly_obligations` / `credit_score` / `employment_months` | `custom_*` | same names |
| `lifecycle` | `custom_lifecycle_state` | legacy created records already `SUBMITTED`; the portal creates `DRAFT` and submits explicitly |
| decision payload | `Loan Decision Evidence.record_json` | borrower sees a projection only |

## 6. Data classification

| Data | Where | Exposure |
| --- | --- | --- |
| Name, email, phone, employer, income, obligations | `Borrower Profile`, `Loan Application` | the owning borrower, via whitelisted methods |
| Identity documents | private `File` + `documents` child table | owning borrower; download re-checks ownership |
| Invitation secret | only `secret_hash` | never returned; validate returns the email only |
| Decision internals (thresholds, hashes, trace paths) | `Loan Decision Evidence.record_json` | reviewers/audit; the portal projects `customer_visible` reasons only |
| Conversation transcript | **not stored in Frappe** | `Advisory Conversation` keeps counters, not messages |

## 7. Unresolved

- The evidence write path lives in the agent service (`infrastructure/evidence_store.py`: `FrappeEvidenceSink` creates `Loan Decision Evidence` rows) but is exercised only by opt-in live tests (`test_p1_live.py`, skipped without `FRAPPE_*`); a written row on the disposable site is not yet verified end to end (Phase 9).
- `custom_credit_score` survives as an optional field although the wizard stopped asking for it; whether the agent should keep accepting a self-declared score is a policy decision, not a schema one.
- `Voice Session.status`: `Created → Joined` and `Expired` are written by `api/voice.py`; nothing writes `Ended` yet (a session-end hook is Phase 9).
- Feedback has no notification doctype; operators see `Borrower Feedback` in the desk only.
