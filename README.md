# Loan Advisory Agent — P0 (decision core) + P1 (live Frappe)

P0: mock Frappe → canonical → ZEN → decision + evidence + trace — GREEN.
P1: **live** Frappe Lending 16.6.1 → same adapter/schema/ZEN — GREEN
(live `ACC-LOAP-2026-00001` ≡ mock `APP-TEST-005`: REJECTED, identical rules).

## Stack

ZEN Engine 2.1.2 · pydantic v2 · Frappe Lending 16.6.1 (frappe 16.51.0, erpnext 16.50.0, Docker) · pytest

## Run

```powershell
pip install -r requirements.txt
python -m pytest tests/ -q                       # 9 passed, 5 skipped without live env
python scripts/development/run_p0.py             # all fixtures + what-if demo
python scripts/development/inspect_zen_trace.py  # decision + result + trace dump
python -m loan_advisory.application.decision_orchestrator  # single-app demo check (needs apps/api/src on PYTHONPATH)
```

## Live Frappe (P1)

Start the stack (frappe_docker clone, outside this repo):
`docker compose --project-name loanrangers -f loanrangers.yml up -d --pull missing`
(site `p1loan.local` → `http://127.0.0.1:8080`). Then:

```powershell
$env:FRAPPE_URL="http://127.0.0.1:8080"; $env:FRAPPE_API_KEY="<key>"; $env:FRAPPE_API_SECRET="<secret>"
python -m pytest tests/ -q                       # 14 passed (incl. live round trip)
```

Details: `docs/p1-*.md` (installation, resources, API, live integration,
P0 comparison, test results). Footprint: +7.28 GB images, +301 MB volumes,
≈845 MB idle RAM.

## Where things live

- Synthetic policy: `decision_engine/policies/personal_loan_synthetic_v1.json` (NOT real policy)
- Synthetic data: `data/synthetic/applicants.json` (8 cases, no real people)
- ZEN model: `decision_engine/decisions/personal_loan_v1.json`
- API/adapter/orchestration: `apps/api/src/loan_advisory/` (application + infrastructure)
- Frappe stack config: `infra/frappe/` (`loanrangers.yml`, `apps.json`)
- Docs: `docs/p0-*.md` (versions, env, frappe, zen, mapping, integration, results…)

## Limitations

- Live DocTypes use Frappe autonames (`ACC-LOAP-…`); `APP-TEST-00x` IDs exist
  only in the mock store. Loan Application forbids rename.
- ZEN 2.x nodes see only the previous node's output → single self-contained
  expression node (documented in `docs/p0-zen.md`).
- No workflow trigger, no LLM/agent — explicitly future work.
