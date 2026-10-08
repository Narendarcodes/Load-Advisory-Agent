# Frappe Requirements (evidence: `docs/frappe-schema-discovery.md`)

Source: `frappe/lending` `version-16` @ `754be8f` (v16.6.1). Field names below
are source-verified; anything unverified is marked OPEN.

## 1. Executive summary

Frappe Lending gives us identity (Customer), application shell (`Loan
Application`: product, amount, tenure, `Open/Approved/Rejected` status),
lifecycle history (`Loan`, `Loan Repayment`), and API-first CRUD. It gives us
**no** underwriting inputs (income/obligations/credit score/tenure — all custom
fields) and **no** decision storage (no reason/code/notes/score — all custom
fields). Minimum useful slice: Customer + Loan Product + Loan Application +
`Loan`/`Loan Repayment` read + token-auth REST. Full LMS/accounting/security/
co-lending surface is NOT NEEDED.

## 2. P0 requirements (sufficient: YES)

Customer + Loan Product + Loan Application + `status` + read API. P0's four
ZEN inputs arrive via four custom fields; `loan_amount`/`repayment_periods`
are standard. Nothing else is required to answer "retrieve → ZEN".

## 3. P1 requirements

Real decisions: custom fields for decision/reason-code/evidence-ref + `PUT`
write-back. History: `Loan` + `Loan Repayment` reads (delinquency, outstanding).
Reapplication/what-if: re-read application, in-memory overrides (already proven
in P0 — Frappe untouched). Education: product terms + repayment schedule
(`lending.api.get_repayment_schedule`).

## 4–5. Required DocTypes / fields

| DocType | Fields | Use |
|---|---|---|
| Customer (ERPNext) | id, name (+optional email/phone) | applicant identity |
| Loan Product | `product_code/name`, `maximum_loan_amount`, `rate_of_interest` | context |
| Loan Application | `applicant(_type)`, `loan_product`, `loan_amount`, `repayment_periods`, `status`, `posting_date` + 4 custom fields | P0 core |
| Loan | `applicant`, `status`, totals, `is_npa` | history (P1) |
| Loan Repayment | `against_loan`, `amount_paid`, `days_past_due`, `is_npa` | history (P1) |
| Loan Lead | `income`, `employment_type`, `proposed_tenure` | LATER pre-app context |

## 6. Unnecessary functionality

Accounting/ledgers, Loan Security/Pledge, Co-Lending/Loan Partner, NPA/IRAC
provisioning, bulk/scheduler processes, Employee applicant path, OTP/PAN flows.

## 7. API endpoints (standard REST; docs `docs.frappe.io/framework/.../api/rest`)

```http
Authorization: token <api_key>:<api_secret>
GET /api/resource/Loan Application/APP-TEST-001
GET /api/resource/Loan?filters=[["applicant","=","CUS-TEST-001"]]&fields=["name","status","loan_amount","total_amount_paid","is_npa"]
GET /api/resource/Loan Repayment?filters=[["against_loan","=","<loan>"]]&fields=["posting_date","amount_paid","days_past_due","is_npa"]
PUT /api/resource/Loan Application/APP-TEST-001   # P1 write-back only
```

## 8. Field mapping (Frappe → canonical → ZEN)

| Frappe | Canonical | ZEN |
|---|---|---|
| `name` | `application_id` | carried |
| `applicant` | `applicant_id` | carried |
| `custom_monthly_income` *(custom)* | `monthly_income` | `monthly_income` |
| `custom_monthly_obligations` *(custom)* | `monthly_obligations` | `monthly_obligations` |
| `custom_credit_score` *(custom)* | `credit_score` | `credit_score` |
| `custom_employment_months` *(custom)* | `employment_months` | `employment_months` |
| `loan_amount` | `loan_amount` | carried (unscored) |
| `repayment_periods` | `loan_tenure_months` | carried (unscored) |

## 9. Standard vs custom

Standard: amount, tenure, product, status, identity, all history.
Custom required: 4 underwriting inputs + (P1) decision/reason-code/evidence-ref.
Source-from-elsewhere: none — Lead `income` is pre-application data, not a substitute.

## 10. Decision storage

AVAILABLE: `status` (`Open/Approved/Rejected`) only. NOT AVAILABLE: reason,
reason code, notes, rule results, score, evidence link — all custom fields.
Frappe is the system of record, never the underwriting engine (ZEN is).

## 11. Historical data

Available without custom code: previous/current loans per applicant, per-loan
status/totals/`is_npa`, repayment rows with `days_past_due`, schedule rows.
Belongs in ZEN input? No (P0/P1 policy uses application data only) — history is
agent context for explanation and reapplication guidance.

## 12. Workflow relevance

Shipped workflows are **inactive** (`is_active: 0`); states in
`workflow_state.json` don't include the `Approved`/`Rejected` transition targets
— OPEN: confirm on live site. P0 must key on the `status` field. Workflow is
orchestration-only and a P1 concern (Underwriting transition → orchestrator).

## 13. Storage/complexity

Smallest supported P0 install: frappe_docker (MariaDB + Redis + bench) with
ERPNext + Lending (`version-16`), only the §4–5 DocTypes used; accounting
optional since v16 (per Lending v16 release notes). The LMS tail (security,
co-lending, provisioning) costs schema + scheduler overhead — install the app,
use the slice. No custom app needed until P1 write-back (then: custom fields
via UI/fixtures, no upstream fork).

## 14. Open questions

1. `Approved`/`Rejected` workflow states missing from fixtures — live-site check.
2. Confirm `Customer` vs a dedicated borrower profile for KYC-heavy P1.
3. Lending `license.txt` terms for hosted use (AGPL surface) — legal glance before P1.
4. Whether `Loan Lead` → `Loan Application` conversion should feed pre-fill (LATER).

## 15. Recommendation

Install the smallest useful slice: **Customer + Loan Product + Loan Application
(+4 custom fields) + read-only token REST for P0; add `Loan`/`Loan Repayment`
reads + decision custom fields + `PUT` write-back for P1.** Defer Lead,
Workflow activation, and the entire accounting/security/co-lending surface.

## 20. Final table

| Frappe capability | Verdict |
|---|---|
| Customer (applicant identity) | REQUIRED NOW |
| Loan Application (shell + status) | REQUIRED NOW |
| Loan Product (context) | REQUIRED NOW |
| Token-auth REST read | REQUIRED NOW |
| 4 custom underwriting fields | REQUIRED NOW |
| Loan + Repayment history reads | REQUIRED LATER (P1) |
| Decision/reason custom fields + PUT | REQUIRED LATER (P1) |
| Workflow activation | REQUIRED LATER (P1) |
| Loan Lead | OPTIONAL (LATER) |
| Repayment schedule API, documents | OPTIONAL (LATER) |
| Accounting, security/pledge, co-lending, NPA engine | NOT NEEDED |
