# P0 Data Provenance

- Dataset: **synthetic** (`prototype_0/data/applicants.json`, 8 hand-made cases).
- Purpose: P0 functional integration testing only.
- Real people: none. Real policy: none (see `policy/personal_loan_synthetic_v1.json`
  warning — never describe it as VaaniLabs policy).
- Generation: manual, rule-based fixtures covering all-pass, each single-rule
  failure, multi-failure, exact-boundary (FOIR 0.45 → PASS), missing and invalid data.
- These fixtures do NOT represent the statistical distribution of Indian
  borrowers. Larger dataset research is a separate workstream.
