# P0 Integration

```
Frappe (MockStore | FrappeClient REST)
  ↓ store.get(app_id) -> doc dict
from_frappe_doc  (explicit mapping -> UnderwritingInput, raises on bad data)
  ↓ canonical.zen_context()
ZEN personal_loan_v1.json (single expressionNode, trace=True)
  ↓ result {foir, *_pass, decision} + trace {in1, uw1, out1}
build_evidence  (join with policy/*.json by rule_id)
  ↓ {application_id, decision, policy{id,version}, rule_evaluations[4], zen_trace}
```

Fail-safe: `decide()` catches `UnknownApplication`, `FrappeUnavailable`,
validation errors and ZEN `NodeError` → returns `decision: "ERROR"` with the
cause in `_log.error`. No decision is ever fabricated.

What-if: `decide(app_id, overrides={...})` merges overrides into an in-memory
copy; the stored record is never mutated (asserted in tests).

Write-back (optional §17): NOT implemented — deliberately. Read→ZEN→result is
proven; persisting `decision`/evidence to the Loan Application is a one-field
update once a live site exists, documented in `p0-test-results.md` Q14.

Workflow (§15): not wired; Frappe Workflow stays orchestration-only by design —
rules live in ZEN. Trigger = `Underwriting` transition → `decision_orchestrator.decide`.
