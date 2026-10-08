# P1 Live Integration

## Fixtures (all synthetic, created via REST unless noted)

Company "Loan Rangers Test NBFC" (INR, via setup wizard) · Customer
`CUS-TEST-001` (renamed via bench; autoname ignores explicit `name`) ·
Loan Product `SYN-PERSONAL-001` ("Personal Loan — Synthetic", 14%, max 10L) ·
Loan Application **`ACC-LOAP-2026-00001`** (autoname kept — rename blocked):
income 32000, obligations 18500, credit 690, employment 8, amount 300000,
tenure 36, status Open → Rejected (write-back test).

## Naming decision (Step 7)

Standard Frappe supplies: amount, tenure, product, status, identity.
Custom fields (4, documented): income, obligations, credit score, tenure-months.
Nothing represented outside Frappe. P0 IDs `APP-TEST-00x` cannot exist live
(autonames) — comparison is by values/decision, not by ID.

## Live round trip (no P0 logic changed)

`FrappeClient.get` → `from_frappe_doc` → `UnderwritingInput` →
existing ZEN model → **REJECTED**, rule results identical to mock
`APP-TEST-005` (see `p1-p0-comparison.md`). Trace captured, ~162 ms
REST-inclusive vs ~2 ms mock. Failure modes (unreachable host, unknown app,
missing/invalid/malformed) all return `ERROR` evidence — covered in
`tests/test_p1_live.py`.
