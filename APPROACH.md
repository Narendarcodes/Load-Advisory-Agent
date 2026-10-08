# Approach

Frappe Lending is the operational system of record; ZEN Engine is the
deterministic underwriting engine; a future agent explains decisions.
Nothing else is architecture — everything else is detail.

```
Frappe Lending → Adapter → Canonical schema → ZEN → Decision Evidence → (future) Agent
```

Rules:

- Underwriting rules live ONLY in ZEN decision models (`decision_engine/`).
  Never in prompts, never in Frappe, never in the agent.
- Frappe data NEVER enters ZEN raw — it is mapped explicitly, then validated
  by the canonical pydantic schema. Failures return ERROR evidence, never a
  fabricated decision.
- The agent (future) consumes Decision Evidence, never Frappe docs or MariaDB.
- Prototype history lives in Git + `docs/prototypes/`, never in source paths.
