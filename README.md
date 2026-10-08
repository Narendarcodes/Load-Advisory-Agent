# Loan Advisory Agent — Prototype 0 (Frappe Lending + ZEN Engine)

P0 answers one question: can a synthetic loan application flow
Frappe → canonical schema → ZEN → deterministic decision + rule evidence + trace?
Yes — proven end-to-end (mock Frappe store; live-site install is the one open step).

## Stack

ZEN Engine 2.1.2 · pydantic v2 · Frappe Lending v16 (pending live install) · pytest

## Run

```powershell
pip install -r requirements.txt
python -m pytest tests/ -q                       # 7 passed, 1 skipped (live Frappe)
python prototype_0/scripts/run_p0.py             # all fixtures + what-if demo
python prototype_0/scripts/inspect_zen_trace.py  # decision + result + trace dump
python -m prototype_0.integration.decision_orchestrator  # single-app demo check
```

Live Frappe (optional): set `FRAPPE_URL`, `FRAPPE_API_KEY`, `FRAPPE_API_SECRET`
— `FrappeClient` takes over from the mock store; no code changes.

## Where things live

- Synthetic policy: `prototype_0/policy/personal_loan_synthetic_v1.json` (NOT real policy)
- Synthetic data: `prototype_0/data/applicants.json` (8 cases, no real people)
- ZEN model: `prototype_0/decisions/personal_loan_v1.json`
- Mapping/orchestration/evidence: `prototype_0/integration/`, `prototype_0/evidence/`
- Docs: `docs/p0-*.md` (versions, env, frappe, zen, mapping, integration, results…)

## Limitations

- Frappe runs against a synthetic in-memory store until the WSL2/Docker bench
  install is done (`docs/p0-environment.md` has the steps).
- ZEN 2.x nodes see only the previous node's output → single self-contained
  expression node (documented in `docs/p0-zen.md`).
- No write-back, no workflow trigger, no LLM/agent — all explicitly P1.
