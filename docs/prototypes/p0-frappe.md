# P0 Frappe

Status: integration code complete; live-site install pending (see `p0-environment.md`).

## Relevant DocTypes (Lending v16)

- `Loan Product` — synthetic product `SYNTHETIC-PERSONAL-LOAN`
- `Loan Application` — record `name` = `APP-TEST-00x`, applicant link, `loan_amount`,
  `repayment_periods`, status `Applied`
- `Loan Customer` / `Customer` — synthetic `CUS-TEST-00x`

Underwriting inputs live in custom fields (exact names are site-configurable;
adapter accepts both): `custom_monthly_income`, `custom_monthly_obligations`,
`custom_credit_score`, `custom_employment_months`.

## API (local dev auth = API key + secret)

```http
GET /api/resource/Loan Application/APP-TEST-001
Authorization: token <FRAPPE_API_KEY>:<FRAPPE_API_SECRET>
```

```json
{ "data": { "name": "APP-TEST-001", "applicant": "CUS-TEST-001",
  "loan_amount": 300000, "custom_monthly_income": 32000,
  "custom_monthly_obligations": 18500, "custom_credit_score": 690,
  "custom_employment_months": 8, "status": "Applied" } }
```

## Code mapping

`prototype_0/integration/frappe_adapter.py`: `MockStore.get()` (default) and
`FrappeClient.get()` (live REST when env vars set) both return a plain doc dict;
`from_frappe_doc()` maps it explicitly into `UnderwritingInput`.
