# ops/ — Saral live-E2E test-bed tooling (SYNTHETIC ONLY)

Nothing here is product code, and no applicant data, credential or `.env` is committed. Data comes
from `python -m synthetic_data.saral_kyc_bank --count 200 --seed 20261103 --out <dir>` (#50).

| Tool | What it does |
|---|---|
| `saral_seed/plan.py` | applicants.jsonl -> seed rows (space-free applicant id as the name, Q-10 workaround; 4 purposes; ₹25L cap flag; raw-identifier guard; demo cast first). `rekey_cli` re-keys #50's `bureau_cases.json` by Frappe application name. |
| `saral_seed/frappe_seed.py` | bench-side: borrowers, applications, 4 synthetic documents each, KYC / bank / bureau summary rows, evidence + reader service keys. Idempotent; secrets only to a 0600 JSON. `backfill` mode re-creates missing summary rows. |
| `synthetic_kyc_bank/app.py` | loopback FastAPI: `/v1/kyc/pan/verify`, `/v1/kyc/aadhaar/ekyc`, `/v1/aa/fetch` (consent-checked, PDF fallback hint). Never returns `specimen_truth`. |
| `bureau_fixture_server.py` | the unchanged synthetic bureau with a chosen fixture file. |
| `decision_runner.py` | always-on poller: SUBMITTED -> `process_bureau_application` (bureau gate -> ZEN v1 -> evidence). No decision logic of its own. |

Requests above the ₹25L product cap are refused by the portal today (no counter-offer in v1; see
QODER_HANDOFF Q-15).
