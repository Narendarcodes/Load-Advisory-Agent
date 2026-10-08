# P1 vs P0 Comparison

CASE A (mock `APP-TEST-005`) vs CASE B (live `ACC-LOAP-2026-00001`).
Same inputs by construction (32000 / 18500 / 690 / 8 / 300000 / 36).

| Aspect | CASE A (P0 mock) | CASE B (P1 live) | Match |
|---|---|---|---|
| Canonical input | 32000, 18500, 690, 8, 300000, 36 | identical values (ids differ) | YES |
| Decision | REJECTED | REJECTED | YES |
| MIN_MONTHLY_INCOME | PASS (32000 ≥ 25000) | PASS | YES |
| FOIR_MAX_45 | FAIL (0.5781 > 0.45) | FAIL (0.5781) | YES |
| MIN_CREDIT_SCORE | FAIL (690 < 700) | FAIL | YES |
| MIN_EMPLOYMENT_TENURE | FAIL (8 < 12) | FAIL | YES |
| Trace available | YES (in1→uw1→out1) | YES (same nodes) | YES |
| Execution time | ~2 ms | ~162 ms (REST-inclusive) | n/a |

Conclusion: real Frappe input produces the expected canonical representation
and therefore the same ZEN behavior. The canonical → ZEN contract held
unchanged. Only P0 *test* touch: live-branch default app name
(`tests/test_frappe_connection.py`); no P0 logic modified.
