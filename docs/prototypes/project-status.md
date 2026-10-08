# Project Status (verified 2026-10-08, HEAD `21f500a`)

## A. Current status

| Component | Status | Version | Evidence | Commit / file |
|---|---|---|---|---|
| Git repository | IMPLEMENTED | — | `git log`: 2 commits, clean tree | `37260fa`, `21f500a` |
| P0 code | IMPLEMENTED | — | 24 files: policy, data, contracts, adapter, orchestrator, evidence, scripts | `37260fa` |
| ZEN Engine | INSTALLED + TESTED | 2.1.2 (pinned) | `pip`, smoke test green | `requirements.txt`, `tests/test_zen_smoke.py` |
| ZEN decision model | IMPLEMENTED + TESTED | synthetic-v1 JDM | single expressionNode, 6 self-contained expressions | `prototype_0/decisions/personal_loan_v1.json` |
| ZEN trace | TESTED | — | `evaluate(ctx, {"trace": True})` → per-node input/output/performance | `prototype_0/scripts/inspect_zen_trace.py` |
| Canonical schema | IMPLEMENTED + TESTED | pydantic v2 | rejects missing/invalid, never coerces | `prototype_0/contracts/underwriting.py` |
| Frappe source | PULLED TEMPORARILY → INSPECTED | lending `version-16` @ `754be8f` (v16.6.1) | throwaway clone outside repo, field tables | `docs/frappe-schema-discovery.md` |
| Frappe runtime | NOT STARTED | — | no bench, no containers (`docker ps` empty), no `FRAPPE_URL` | — |
| Frappe Lending (live) | NOT STARTED | — | same as above | — |
| Frappe API (live) | NOT STARTED | — | live test skips without env | `tests/test_frappe_connection.py` |
| Frappe adapter | IMPLEMENTED + TESTED | mock store + REST client | mock round-trip green; REST client untested live | `prototype_0/integration/frappe_adapter.py` |
| Frappe → ZEN integration | TESTED (mock source only) | — | full matrix green; **no live round trip has passed** | `tests/test_p0_integration.py` |
| Frappe Workflow | INSPECTED | fixtures `is_active: 0` | transitions/states recorded, gap noted | `docs/frappe-schema-discovery.md` §7 |
| Decision Evidence | IMPLEMENTED + TESTED | §16 shape | joined from ZEN result + policy JSON | `prototype_0/evidence/decision_evidence.py` |
| What-if simulation | TESTED | in-memory overrides | FOIR flips FAIL→PASS, original asserted unchanged | `test_what_if_does_not_mutate` |
| Synthetic data | IMPLEMENTED | 8 fixtures | all-pass → invalid, boundary FOIR=0.45 | `prototype_0/data/applicants.json` |
| Automated tests | TESTED | **7 passed, 1 skipped** | skip = live-Frappe test, no env by design | `tests/` (run 2026-10-08) |

## B. What is actually implemented

Mock/Frappe-shaped store → explicit mapping → pydantic canonical schema →
ZEN 2.1.2 (deterministic decision, 4 rule evaluations, real trace) → normalized
evidence → in-memory what-if; fail-safe `ERROR` on missing/invalid/unknown/ZEN
failure. All verified by green tests.

## C. What was only inspected

Frappe Lending source → cloned to temp, inspected, documented, discarded.
NOT installed, NOT modified, NOT run, NOT connected to ZEN, NOT API-tested.

## D. What is not implemented

Live Frappe runtime; live API round trip; custom underwriting fields on a real
site; decision write-back; workflow trigger; historical-loan wiring; any
LangGraph/LLM/agent/RAG/UI/voice/i18n/observability work (all explicitly P1+).

## E. Current architecture

```
Frappe ──▶ Adapter ──▶ Canonical schema ──▶ ZEN ──▶ Decision + rule results + trace ──▶ Evidence
 (mock)      (both)        (pydantic)        (2.1.2)              (mock-proven; live pending)
```

## F. P0 result

**P0 decision-core: GREEN** — `7 passed, 1 skipped` (`python -m pytest tests/ -q`).

## G. P1 objective

"Replace the mock Frappe source with a live Frappe Lending instance without
breaking the existing canonical → ZEN contract."

## H. P1 acceptance criteria

Live: start Lending → synthetic customer + product + application → API retrieve
→ existing adapter → existing schema → existing ZEN → decision + 4 rule results
+ trace → match P0 expected result (APP-TEST-005 REJECTED, 3 fails). Synthetic
data only. Plus: measure disk/RAM/startup/image sizes; do NOT redesign
canonical/ZEN to fit Frappe (explain any forced change).

## I. Open questions

1. `Approved`/`Rejected` workflow states missing from shipped fixtures — confirm live.
2. Customer vs dedicated borrower profile for KYC-heavy P1.
3. Lending license terms for hosted use — legal glance before P1.
4. Lead → Application pre-fill — LATER.
5. Actual Frappe disk/RAM footprint — measure, don't estimate (no claim made yet).

## J. Next action

"Set up the smallest viable live Frappe Lending environment and perform the
first real API → adapter → ZEN round trip."
