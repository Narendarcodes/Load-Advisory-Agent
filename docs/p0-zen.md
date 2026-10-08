# P0 ZEN

Package: `zen-engine==2.1.2` (MIT, prebuilt wheels; `import zen`).

## Python API (verified on this machine)

```python
engine = zen.ZenEngine()
decision = engine.create_decision(open("prototype_0/decisions/personal_loan_v1.json").read())
resp = decision.evaluate({"monthly_income": 60000, ...}, {"trace": True})
resp["result"]  # {"foir","income_pass","foir_pass","credit_pass","employment_pass","decision"}
resp["trace"]   # {"in1": {...}, "uw1": {...}, "out1": {...}} — per-node input/output/performance
resp["performance"]  # total, e.g. "229.7µs"
```

## Decision model format

JDM = `{"nodes": [...], "edges": [...]}`. Node used here: `expressionNode`
(`content.expressions: [{id, key, value}]`, values in ZEN Expression Language;
ternary `cond ? 'A' : 'R'` verified, `and` verified).

## Key finding (verified by probe, documented — not assumed)

In ZEN 2.x a graph node receives **only the previous node's output**, not a
merged context (probe: chained node lost `monthly_income`; trace `n1.input`
was `{"foir": ...}` only). Within one `expressionNode`, later expressions also
cannot reference sibling-computed keys. Consequence: our model is a **single
expressionNode with six self-contained expressions** — FOIR is recomputed
inline in `foir_pass` and `decision` instead of referencing the `foir` key.
`docs/p0-data-mapping.md` records the equivalent Python-side normalization.

## Limitations

- No cross-node / cross-expression references (see above) — multi-step graphs
  must re-emit everything they need downstream.
- `decision.evaluate` raises `RuntimeError(NodeError...)` on bad input (e.g.
  division by zero, missing fields); the orchestrator catches this and returns
  `ERROR` evidence — never a fabricated decision.
- Trace contains node input/output/performance only — no rule names/reasons;
  those are joined in Python from `policy/*.json` (see `p0-integration.md`).
