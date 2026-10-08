# Artefact (what this repo currently contains)

- `decision_engine/` — synthetic personal-loan policy, ZEN decision model,
  canonical underwriting schema, evidence builder. Deterministic, tested.
- `apps/api/src/loan_advisory/` — Frappe adapter (mock store + live REST
  client) and the decision orchestrator (retrieve → validate → ZEN → evidence).
- `data/synthetic/applicants.json` — 8 hand-made fixtures, no real people.
- `infra/frappe/` — reproducible local Lending stack (`loanrangers.yml`,
  `apps.json`); Frappe/Lending remain external dependencies.
- `tests/` — ZEN smoke, P0 matrix, Frappe connection, P1 live integration.
- `docs/` — `architecture/` (current), `research/` (Frappe discovery),
  `prototypes/` (P0/P1 history), `operations/` (reserved, empty).

Explicitly NOT present: agent, evaluation harness, prompt pack, production
deployment. Those directories are created when they earn it.
