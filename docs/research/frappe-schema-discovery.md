# Frappe Schema Discovery (source-verified)

Source: `https://github.com/frappe/lending`, branch `version-16`,
commit `754be8f` ("Bumped to Version 16.6.1"). Inspected 2026-10-08 as a
shallow clone — **no install, no modifications**. Every field below comes from
the DocType JSON in `lending/<module>/doctype/<name>/<name>.json`.
Nothing is inferred from screenshots or tutorials.

## 1. Loan Application (`loan_management/doctype/loan_application/`)

autoname `ACC-LOAP-.YYYY.-.#####`, title_field `applicant`. Controller confirms
`status: Literal["Open", "Approved", "Rejected"]` (`loan_application.py:70`).

### A. Applicant identity/reference

| fieldname | label | type | reqd | ZEN? | Agent? |
|---|---|---|---|---|---|
| `applicant_type` | Applicant Type | Select `Employee/Customer` | yes | no (routing only) | later (display) |
| `applicant` | Applicant | Dynamic Link → `applicant_type` | no | no (id carried) | yes (id link) |
| `applicant_name` | First Name | Data | no | no | yes |
| `applicant_email_address` | Applicant Email Address | Data | no | no | later (contact) |
| `applicant_phone_number` | Applicant Phone Number | Phone | no | no | later (contact) |
| `address_line_1/2`, `city`, `state`, `zip_code`, `country` | address | mixed | no | no | NOT NEEDED for P0 |

### B–D. Product / amount / tenure

| fieldname | label | type | reqd | ZEN? | Agent? |
|---|---|---|---|---|---|
| `loan_product` | Loan Product | Link → Loan Product | yes | no (context) | yes |
| `company` | Company | Link → Company | yes | no | no |
| `loan_amount` | Loan Amount | Currency | no | **yes** | yes |
| `repayment_method` | Repayment Method | Select `/Repay Fixed Amount per Period/Repay Over Number of Periods` | no | no | later |
| `repayment_amount` | Monthly Repayment Amount | Currency | no | no | later (explains FOIR) |
| `repayment_periods` | Repayment Period in Months | Int | no | **yes** (tenure) | yes |
| `rate_of_interest` | Rate of Interest | Percent | no | no | later |
| `total_payable_interest` / `total_payable_amount` | totals | Currency | no | no | later |
| `maximum_loan_amount` | Maximum Loan Amount | Currency | no | no | later |
| `is_term_loan` | Is Term Loan | Check | no | no | no |
| `posting_date` | Application Date | Date | yes | no | yes (timestamps) |

### E–G. Employment / financial / obligations

**None exist.** No income, obligation, credit-score, or tenure field on the
standard DocType. All four synthetic-policy inputs require custom fields (§5).

### H–J. Documents / co-applicants / collateral

| fieldname | type | ZEN? | Agent? |
|---|---|---|---|
| `documents` (Table → Loan Application Document) | Table | no | later (evidence attachments) |
| `co_applicants` (Table → Loan Co-Applicants) | Table | no | LATER |
| `is_secured_loan`, `proposed_pledges` (Table → Proposed Pledge) | Check/Table | no | NOT NEEDED (unsecured personal loan) |
| `loan_purpose` (Link → Loan Purpose) | Link | no | later (context) |

### K. Status/workflow

`status`: Select `Open/Approved/Rejected`. No reason/note/score field anywhere
on the DocType — **decision metadata is NOT AVAILABLE** (custom fields needed).
`amended_from` (Link) supports amendment chains.

## 2. Applicant records

- Personal-loan applicant = **Customer** (`applicant_type=Customer`; `Employee`
  is the staff-loan path). Loan Application links via Dynamic Link `applicant`.
- Customer contact/profile lives in ERPNext (`Customer`, `Contact`, `Address`),
  not in Lending. Financial/profile fields useful to us: none standard —
  income etc. are application-level custom fields (§5 of requirements doc).
- Classification: REQUIRED = Customer id+name; OPTIONAL = email/phone;
  NOT NEEDED = address, Employee path; SENSITIVE = PAN (only on Loan Lead),
  OTP secrets — never touch.

## 3. Loan Lead (`loan_origination/doctype/loan_lead/`)

autoname `LN-LEAD-.#####`. Notable: `income` (Currency, optional),
`employment_type` (Select `Salaried/Self-employed`), `loan_amount` (reqd),
`proposed_tenure`, `applicant_type` (Select `Individual/Business`, reqd),
`status` (free-text Data — **no enforced lifecycle**), OTP/PAN fields
(SENSITIVE, out of scope). Verdict: LATER source of pre-application context,
not P0.

## 4. Loan Product (`loan_management/doctype/loan_product/`)

Identity: `product_code` + `product_name` (both reqd Data; autoname
`field:product_code`). Underwriting-relevant: `maximum_loan_amount`,
`rate_of_interest` (reqd Percent), `penalty_interest_rate`,
`grace_period_in_days`, `repayment_schedule_type`. Everything else is
ledger/collection/NPA accounting config (NOT NEEDED for P0/P1 advisory).
No eligibility-rule config exists on the product — product contributes
**context (limits, rate), not rules**; rules stay in ZEN.

## 5. Loan (`loan_management/doctype/loan/`)

Link back: `loan_application` (Link, optional). Borrower: `applicant_type`
(reqd, `Customer/Employee`) + `applicant` (Dynamic Link, reqd).
Lifecycle `status`: `Draft/Sanctioned/Partially Disbursed/Disbursed/Active/
Loan Closure Requested/Closed/Written Off/Settled`.
History math per loan: `loan_amount`, `disbursed_amount`, `total_amount_paid`,
`total_principal_paid`, `total_interest_payable`, `is_npa` (Check),
`repayment_start_date`, `repayment_periods`, `monthly_repayment_amount`.

## 6. Repayment history

- `Loan Repayment`: `against_loan` (reqd Link → Loan), `applicant` +
  `applicant_type` (incl. `Member` option), `posting_date`/`value_date` (reqd),
  `amount_paid` (reqd), `payable_amount`, `principal_amount_paid`,
  `interest_payable`, `penalty_amount`, `days_past_due` (Int), `is_npa`,
  `repayment_type` (reqd Select: Normal/Interest Waiver/Penalty Waiver/…).
- `Repayment Schedule` rows: `payment_date`, `principal_amount`,
  `interest_amount`, `total_payment`, `balance_loan_amount`, `demand_generated`.
- Query pattern (standard REST, no custom API needed):
  `GET /api/resource/Loan?filters=[["applicant","=","CUS-TEST-001"]]`,
  then `GET /api/resource/Loan Repayment?filters=[["against_loan","=","<loan>"]]`.
- Whitelisted helper: `lending.api.get_repayment_schedule(...)` (schedule
  projection, `lending/api.py`); `Loan Application.create_loan` maps an
  Approved application → Loan (`loan_application.py:284`).

## 7. Workflow (fixtures, `lending/fixtures/`)

`Loan Application Workflow` and `Loan Lead Workflow` exist as fixtures but
**`is_active: 0` (shipped inactive)**. Application transitions:
`Draft→Initiated→KYC Pending→{Approved, Rejected}` (+`KYC Complete→Approved/
Rejected`) across roles Loan Officer/Processor/Appraiser/Underwriter.
Observed gap: transitions target `Approved`/`Rejected` states that are absent
from the shipped `workflow_state.json` (lists Initiated/Draft/KYC Pending/
KYC Complete/Incoming/…/Converted) — verify on a live site before relying on
workflow state vs the `status` field. **Source of truth for P0: `status`.**

## 8. APIs (verified)

- Docs (current): `https://docs.frappe.io/lending/` ("end to end REST API
  compatible", updated 2026-01-07); REST reference:
  `https://docs.frappe.io/framework/user/en/api/rest` (auth, CRUD, filters,
  whitelisted methods; fetched 2026-10-08).
- Auth: `Authorization: token <api_key>:<api_secret>` (per-User API Access keys).
- CRUD is auto-generated per DocType: `GET /api/resource/Loan Application/<name>`,
  list with `?fields=[...]&filters=[["applicant","=","..."]]`, `PUT` for updates
  (e.g. status/decision write-back), `POST /api/method/<dotted-path>` for
  whitelisted methods. No lending-specific endpoints needed for P0.
