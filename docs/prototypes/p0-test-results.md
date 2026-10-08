# P0 Test Results (2026-10-08, run: `python -m pytest tests/ -q`)

`7 passed, 1 skipped` (skip = live-Frappe test, no env configured — by design).
`python prototype_0/scripts/run_p0.py` prints all 8 fixtures + what-if. Trace for
APP-TEST-005 inspected via `python prototype_0/scripts/inspect_zen_trace.py`.

## Spec example (§18) — reproduced

```
APP-TEST-005 → REJECTED
FOIR actual=57.81% threshold=45% FAIL · CIBIL actual=690 threshold=700 FAIL
EMPLOYMENT actual=8mo threshold=12mo FAIL · INCOME actual=32000 threshold=25000 PASS
TRACE AVAILABLE (in1 → uw1 → out1, per-node input/output/performance)
```

## Matrix (§19) — all covered in `tests/test_p0_integration.py`

All-pass, each single-rule fail, multi-fail, exact boundary (FOIR=0.45→PASS),
missing (ERROR), invalid (ERROR), unknown app (ERROR), ZEN error (ERROR via
NodeError path), trace-unavailable path (empty-trace evidence shape), determinism
(2× same input → same decision), what-if (FOIR flips FAIL→PASS at 14000/32000,
original record asserted unchanged).

## Critical questions (§29)

1. Store required info? Model supports it via custom fields; live verification pending.
2. Retrieve programmatically? Yes — REST `GET /api/resource/Loan Application/<name>`;
   client implemented, tested against mock, live test skips without env.
3. Map reliably to canonical schema? Yes — explicit mapping + pydantic ranges.
4. ZEN evaluates? Yes — deterministic APPROVED/REJECTED on all fixtures.
5. Structured rule results? Yes — per-rule PASS/FAIL + actual + threshold.
6. Trace available? Yes — `evaluate(ctx, {"trace": True})` returns per-node trace.
7. Trace contains? Per node: input, output, name, id, performance, traceData
   (expression results / matched table rule). Plus total `performance`.
8. Missing from raw trace? Rule ids/names/reason codes/thresholds — joined in
   Python from `policy/*.json`. No cross-node context (single-node design, §p0-zen).
9. Normalized evidence constructible? Yes — `build_evidence()`; shape in §16.
10. Hypothetical without mutation? Yes — in-memory `overrides`, asserted unchanged.
11. Does Frappe add unnecessary complexity? Honest answer: for P0's four rules it
    is heavy (bench + MariaDB/Redis + custom fields for data it doesn't natively
    hold). Its value is P1+: origination workflow, ledger, compliance. Not
    disproven — but live install is still required to close this question fully.
12. Does ZEN justify itself? Yes — deterministic, µs-scale, portable JDM in git,
    real trace. With one caveat: no inter-node context forces self-contained
    expressions (documented, worked around, not hidden).
13. Suitable for P1? Yes, with the Frappe-live-install precondition.
14. Before the conversational agent? (a) live Frappe round-trip + write-back of
    `decision`/evidence reference; (b) policy versioning story (JDM file per
    version, selected by orchestrator); (c) PII/minimization review — ZEN needs
    only 4 numerics, keep it that way.
