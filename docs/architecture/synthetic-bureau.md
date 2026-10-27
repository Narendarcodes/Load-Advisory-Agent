# Synthetic Credit Bureau (development only)

A local FastAPI stand-in for a credit bureau, plus the data-quality gate that
sits between the bureau response and the unchanged ZEN decision.

**This is not CIBIL, FICO, or any real bureau.** Every field is synthetic, the
score is an unvalidated heuristic, and the service must never be used for a
real lending decision. The service binds to `127.0.0.1` and refuses to be
reached on any other host from the client side.

## What it does not change

- ZEN policies, thresholds, JDM models, and `decide()` are untouched.
- Credit pass/fail and the final APPROVED/REJECTED decision still come from ZEN.
- Frappe schemas, workflows, and migrations are untouched. The
  `Loan Decision Evidence.decision` Select still accepts only
  `APPROVED` / `REJECTED` / `ERROR`.
- Staleness and income/obligation variance gates are **disabled**. Enabling
  them needs a reviewed edit of `config/bureau_dq_policy.json`; there are no
  environment overrides.

## Client URL policy

`BureauClient` allows only a plain-HTTP loopback origin: scheme `http`,
hostname exactly `127.0.0.1` or `localhost`, no credentials, no query or
fragment, and an empty or `/` path. Any port is accepted because the service
port is configurable. HTTPS, IPv6 loopback (`[::1]`), trailing-dot hosts,
alternative numeric IPs (`2130706433`), look-alike suffixes
(`127.0.0.1.evil.example`), embedded credentials, and paths fail closed. This
is a client-side allowlist for a development service, not a complete SSRF
defence against proxy or DNS behaviour outside the process.

## REVIEW vs ERROR

| Situation | evidence `outcome` | legacy `decision` | lifecycle state |
|---|---|---|---|
| Credit decision | `APPROVED` / `REJECTED` | same | `APPROVED` / `REJECTED` |
| Data-quality hold | `REVIEW` | `ERROR` | `MANUAL_REVIEW` (or `INFO_REQUESTED` when data is missing/invalid) |
| Missing applicant identity/mandatory field | `REVIEW` | `ERROR` | `INFO_REQUESTED` |
| Provider timeout/429/503/malformed | `ERROR` | `ERROR` | `MANUAL_REVIEW` |

`REVIEW` exists only in evidence (`decision-evidence/1`, additive fields
`outcome`, `review`, `bureau`). The stored Frappe `decision` remains `ERROR`, so
no schema migration is needed.

## Score source precedence

1. No local score → use the bureau score.
2. Local `credit_score_origin = SYNTHETIC_PLACEHOLDER` → the bureau score
   replaces it (fixture metadata only; never stored in Frappe).
3. Local score and bureau score match → use it, source `SYNTHETIC_BUREAU_MATCH`.
4. Local score and bureau score differ → `DQ_CREDIT_SCORE_CONFLICT`, REVIEW.
5. No usable score anywhere → REVIEW (`DQ_BUREAU_NO_HIT` or
   `DQ_BUREAU_INSUFFICIENT_HISTORY`). A score is never invented and never `0`.

## Run the service

```powershell
pip install -r requirements.txt
$env:PYTHONPATH=".;apps/api/src;apps/bureau/src"
python -m synthetic_bureau.app          # http://127.0.0.1:8001, /docs for the schema
```

The self-hosted LLM (`LLM_BASE`) also defaults to `127.0.0.1:8001`. When it runs on
the same machine, start the bureau on another loopback port and point the chat
server at it (loopback origins only; anything else is refused at startup):

```powershell
python -m synthetic_bureau.app --port 8011
python -m loan_advisory.agent.server --offline --bureau-url http://127.0.0.1:8011   # or $env:BUREAU_BASE_URL
```

`POST /v1/bureau/reports` takes
`{"application_id": "...", "applicant_id": "...", "scenario": null}`. With no
scenario, a known fixture application returns its golden report; an unknown one
is generated deterministically. `scenario` accepts `SUCCESS`, `NO_HIT`,
`THIN_HISTORY`, `STALE`, `IDENTITY_MISMATCH`, `INCOMPLETE`, `RATE_LIMIT`,
`UNAVAILABLE`, `TIMEOUT`, `MALFORMED_RESPONSE`.

## Fixture

- Committed: `data/synthetic/bureau/cases_120.json` (120 deterministic cases,
  seed `20261024`, as of `2026-10-24`).
- Regenerate only the committed fixture:

```powershell
python scripts/data/generate_bureau_cases.py --count 120 --seed 20261024 --out data/synthetic/bureau/cases_120.json
```

- Generate 1,000 cases **on demand** (do not commit; ignored by `.gitignore`):

```powershell
python scripts/data/generate_bureau_cases.py --count 1000 --out data/synthetic/bureau/cases_1000_local.json
```

Each case carries `scenario`, the application inputs, the request, the report
(or `null` for a provider failure), `provenance`, and `expected` labels computed
by the unchanged `decide()` pipeline. Fixture requests omit `scenario` on
purpose: they replay through the golden-fixture lookup, which returns the stored
report or provider error exactly. `tests/test_bureau_lifecycle.py` replays all
120 cases through `process_bureau_application()`.

## Known limits

- The score heuristic (`synthetic-score-v1`) has no predictive validation; it
  is a demo device only.
- Minimum history is assumed to be six months. No real bureau rule was
  consulted.
- Staleness (proposed 90 days) and obligation variance (proposed 20% / ₹2,000)
  are documented in `config/bureau_dq_policy.json` under `proposed` and have no
  effect until approved.
