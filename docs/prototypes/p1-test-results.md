# P1 Test Results

With live env (`FRAPPE_URL`, `FRAPPE_API_KEY`, `FRAPPE_API_SECRET`):
**14 passed** (`python -m pytest tests/ -q`) — including live retrieve,
live determinism (2×), live what-if (FOIR→PASS, Frappe re-read unchanged),
live write-back (`PUT status=Rejected`, persisted), unreachable-host,
unknown-app, malformed/invalid-doc failures. Without env: 9 passed, 5 skipped
(P0 regression-safe).

## Acceptance (§17)

[x] Live Lending runs (16.6.1 on frappe 16.51.0/erpnext 16.50.0)
[x] Synthetic Customer / Product / Application exist
[x] Retrievable via REST (token auth)
[x] Existing adapter reads it · maps to canonical · ZEN evaluates
[x] Deterministic · rule results · trace captured
[x] P0 tests green (no logic change; one test-only default-name touch)
[x] Live integration test + live what-if pass, Frappe unmutated by simulation
[x] Footprint measured (images +7.28 GB, volumes +301 MB, idle ≈845 MB)
[x] Limitations documented (autonames, rename block, wizard/API whitelisting,
    4 mandatory offset sequences, CRLF/`pull_policy` Windows gotchas)

P1: GREEN.
