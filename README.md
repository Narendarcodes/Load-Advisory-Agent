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
python prototype_0/scripts/run_p0.py             # all fixtures + what-if demo
python prototype_0/scripts/inspect_zen_trace.py  # decision + result + trace dump
python -m prototype_0.integration.decision_orchestrator  # single-app demo check
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

- Synthetic policy: `prototype_0/policy/personal_loan_synthetic_v1.json` (NOT real policy)
- Synthetic data: `prototype_0/data/applicants.json` (8 cases, no real people)
- ZEN model: `prototype_0/decisions/personal_loan_v1.json`
- Mapping/orchestration/evidence: `prototype_0/integration/`, `prototype_0/evidence/`
- Docs: `docs/p0-*.md` (versions, env, frappe, zen, mapping, integration, results…)

## Limitations

- Live DocTypes use Frappe autonames (`ACC-LOAP-…`); `APP-TEST-00x` IDs exist
  only in the mock store. Loan Application forbids rename.
- ZEN 2.x nodes see only the previous node's output → single self-contained
  expression node (documented in `docs/p0-zen.md`).
- No workflow trigger, no LLM/agent — explicitly future work.
