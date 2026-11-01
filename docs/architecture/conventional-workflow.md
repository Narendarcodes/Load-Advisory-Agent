# Phase 3: Conventional loan workflow (Frappe Lending + ZEN, no LLM)

Status (2026-10-14): **implemented and tested** (live on the droplet stack). It is **not**
production-ready, and all policy content is synthetic.

## Pieces

| Concern | Where | Notes |
|---|---|---|
| Frappe stack (droplet) | `infra/frappe/loanrangers.droplet.yml` | Same services as P1 (`loanrangers.yml`). Frontend is bound to `127.0.0.1` only; the DB root password comes from env (an untracked `secrets.env`); separate `loanhx_*` volumes. Image `loanrangers-frappe:16`, rebuilt 2026-10-14 from `version-16`: frappe 16.52.0, erpnext 16.50.0, lending 16.6.2. P1 used frappe 16.51.0 and lending 16.6.1. |
| Site creation | `infra/frappe/bootstrap/create_site.sh` | Idempotent: `new-site` + erpnext, then `install-app lending` |
| Repeatable seeding | `infra/frappe/bootstrap/seed.sh` → `seed_site.py` (+ `make_seed.py` → `seed_applications.json`) | Runs the setup wizard in-process (company INR, FY 2026-27); creates the offset order, Loan Product `SYN-PERSONAL-001`, custom fields, the evidence DocType, customers and 40 draft applications. **Records are keyed by `custom_external_ref`, never by autoname**, so re-running creates nothing new (verified). |
| Versioned policy | `decision_engine/policies/registry.json` + `registry.py` | `(policy_id, version)` → policy JSON + ZEN JDM, each pinned by sha256 of its LF-normalised bytes. A tampered or edited file makes the load **fail closed** (`PolicyIntegrityError`). Only `synthetic-v1` is registered (status active, `synthetic: true`). |
| Decision Evidence contract | `decision_engine/evidence/evidence_record.py` (schema `decision-evidence/1`) | See below |
| Lifecycle | `config/loan_lifecycle.json` (`loan-lifecycle/1`) loaded by `apps/api/src/loan_advisory/application/lifecycle.py` and the portal's vendored copy | States, native mapping, atomicity and reconciliation are in [loan-lifecycle-mapping.md](loan-lifecycle-mapping.md). It wraps the **unchanged** `decide()`. |
| Evidence persistence | `apps/api/src/loan_advisory/infrastructure/evidence_store.py` | `FrappeEvidenceSink` calls the trusted `evidence.ingest` method with a dedicated `Evidence Service` credential; the method writes the `Loan Decision Evidence` doc, updates only allowlisted application fields and records an audit row. ZEN traces go to a content-addressed directory, not into Frappe. |

## Lifecycle (prototype workflow, not a regulatory requirement)

```
SUBMITTED ─▶ UNDER_REVIEW ─▶ APPROVED | REJECTED                 (ZEN decision)
                         ├─▶ INFO_REQUESTED  (missing or invalid scored input) ─▶ SUBMITTED | WITHDRAWN
                         └─▶ MANUAL_REVIEW   (obligations > income, or engine error)
MANUAL_REVIEW ─▶ APPROVED | REJECTED | INFO_REQUESTED                   (human)
REJECTED ─▶ MANUAL_REVIEW                                              (dispute)
```

* **Allowed transitions.** Only the arrows above are allowed (`IllegalTransition` otherwise). A
  decided record cannot be silently re-decided: it must be resubmitted first.
* **Native status mapping.** Frappe's `status` is mapped as Approved/Rejected/Open. The
  fine-grained state lives in `custom_lifecycle_state`.
* **What-if.** `simulate()` returns an `is_simulation` record with its own `record_id` and
  persists nothing. A live test checks that the Frappe `modified` timestamp is unchanged.

## Decision Evidence record (`decision-evidence/1`)

* **Identity and outcome.** `record_id` (uuid5 over application, input hash, policy hash, JDM hash
  and simulation flag), `application_ref`, `applicant_ref`, `decision`, `lifecycle_state`,
  `is_simulation`.
* **Policy.** `policy{id, version, policy_sha256, jdm_sha256, status, synthetic, threshold_source, effective_from/to}`.
* **Inputs.** `inputs{values (the 4 scored fields only), input_sha256, missing_fields}`.
* **Rule evaluations.** `rule_evaluations[]`, each with `{rule_id, rule_name, rule_version,
  reason_code, field, operator, threshold, threshold_source, description, customer_visible,
  actual_value, result: PASS|FAIL|NOT_EVALUABLE}`.
* **Other fields.** `failed_reason_codes`, `engine{zen-engine 2.1.2}`, `evaluated_at`,
  `trace_ref{sha256, bytes}` (computed over the trace **without** wall-clock timing fields),
  `error`, `flags`.
* **Determinism.** The same inputs under the same policy version give the same `record_id` and
  identical rule outcomes; `evaluated_at` is the only time-varying field. This is tested both
  offline and live, including re-processing after resubmission, which produces no duplicate
  evidence document.
* **Data minimisation.** No PII is stored in the record beyond the applicant reference (a
  customer ID). Raw traces are kept outside Frappe.

## Test results (droplet, 2026-10-14)

| Run | Result |
|---|---|
| Live env (`secrets.env` on droplet), full suite | **35 passed**: the original 14 P0/P1 tests (14/14 live), 18 Phase-3 (14 offline + 4 live) and 3 persona-dataset tests |
| Without live env | 26 passed, 9 skipped |
| Sandbox without `NO_PROXY=127.0.0.1` | `test_frappe_unavailable_fails_safe` fails because an HTTP proxy answers for 127.0.0.1:9. This is an environment artefact; set `NO_PROXY`. |

* **Footprint.** Idle RAM across the nine `loanhx-*` containers is about 725 MiB; volumes about
  303 MB.

## Reproduce on a fresh host

```bash
docker build ... --tag=loanrangers-frappe:16   # frappe_docker layered Containerfile, apps.json (P1 docs)
DB_ROOT_PASSWORD=... docker compose -f infra/frappe/loanrangers.droplet.yml up -d
DB_ROOT_PASSWORD=... FRAPPE_ADMIN_PASSWORD=... infra/frappe/bootstrap/create_site.sh
infra/frappe/bootstrap/seed.sh            # idempotent
# API keys: bench execute frappe.core.doctype.user.user.generate_keys (store outside git)
FRAPPE_URL=http://127.0.0.1:8080 FRAPPE_API_KEY=... FRAPPE_API_SECRET=... \
FRAPPE_P1_APP=<name of external_ref P1-PARITY-APP-TEST-005> python -m pytest tests -q
```

## Known limits and open items

* `decide()` stays hard-wired to the v1 files, so P0 code is untouched. The lifecycle refuses to
  run if the registry's active version points elsewhere. Supporting a second version means
  parameterising `decide()`, with tests added first.
* The contradiction rule (obligations > income → manual review) is a workflow safeguard, not a
  lender rule.
* No authentication or authorisation on lifecycle calls yet; an API admin key is used. Role
  separation (ops vs reviewer) is unresolved.
* Frappe's shipped Loan Application workflows are not used, as the P1 discovery advised.
