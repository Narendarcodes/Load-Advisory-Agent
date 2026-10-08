# P1 Frappe API (all calls executed against `http://127.0.0.1:8080`)

Auth: token — `Authorization: token <api_key>:<api_secret>` (keys via
`POST /api/method/frappe.core.doctype.user.user.generate_keys`).
Session-cookie login also verified (`POST /api/method/login`).

## Endpoints used

```http
GET  /api/resource/Company?fields=["name","default_currency"]
GET  /api/resource/Customer?fields=["name","customer_name"]
GET  /api/resource/Loan Product?fields=["name"]
GET  /api/resource/Loan Application/ACC-LOAP-2026-00001
GET  /api/resource/Loan?filters=[["applicant","=","CUS-TEST-001"]]
POST /api/resource/Company|Customer|Loan Product|Loan Application|Custom Field|"Loan Demand Offset Order"
PUT  /api/resource/Loan Application/ACC-LOAP-2026-00001  {"status": "Rejected"} → 200
```

## Custom fields (via `POST /api/resource/Custom Field`, all 200)

`custom_monthly_income` / `custom_monthly_obligations` (Currency),
`custom_credit_score` / `custom_employment_months` (Int) on Loan Application.

## Verified limitations

- `frappe.model.rename_doc.rename_doc` NOT API-whitelisted (403); Customer
  renamed via `bench execute`; Loan Application rename refused server-side
  (`allow_rename=0`) → autoname kept.
- Setup wizard NOT API-whitelisted; run via `bench execute` in-process.
- Old tutorial path `erpnext.setup.page.setup_wizard...` 404s in v16
  (correct: `erpnext.setup.setup_wizard.setup_wizard...`).
- No lending-specific endpoints needed; standard REST + filters suffice for P1.
