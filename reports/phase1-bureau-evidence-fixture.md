# Phase 1.6 §B — synthetic bureau-evidence fixture, and the live explanation

Date: 2026-11-03 (IST). Branch `feat/agent-boundary-corpus-reset`, commits `c3f8010` (the provisioning)
and `e04dc78` (the live proofs), on top of `408b93f` (the read split the fixture forced). Site:
`loanportal.local` behind the site-pinned proxy. The protected `p1loan.local` site was not touched.

Phase 1.5 could read stored Decision Evidence but reported **A3-BUREAU: BLOCKED** — *no bureau-backed
record exists on the disposable site; provisioning requires running the bureau pipeline, which that
milestone forbade*. This milestone closes it without starting the service, and it also found the reason
the live bureau path has never worked.

## 1. The provisioning requirements, stated exactly

Two constraints make a bureau-backed record impossible to produce against Frappe with the tooling as it
ships. Both were derived from the schemas and then confirmed by running them.

1. **The borrower identifier.** `decision_engine/schemas/bureau.py` requires
   `BureauReportRequest.applicant_id` to match `^[A-Za-z0-9][A-Za-z0-9_-]*$`, 3–64 characters. Every
   synthetic borrower the seeder creates is named `Synthetic Borrower-<10 hex>` — `make_customer` builds
   that name and ERPNext uses `customer_name` as the Customer's `name`, which is what the application's
   `applicant` link holds. The space fails the pattern, so `POST /v1/bureau/reports` would be refused with
   a 422 before any report was produced, for **every** seeded borrower on this site. `seed_bureau_evidence.py`
   now prints this verdict for the application it is given, rather than leaving it to be discovered:
   `{"real_service_request": {"admissible": false, "errors": [{"loc": ["applicant_id"], "type":
   "string_pattern_mismatch", …}]}}`.
   The data-quality gate separately requires `report.applicant_id == application["applicant_id"]`, so the
   identifier is not cosmetic — it is the identity check.
2. **"No local score" cannot be expressed.** `custom_credit_score` is an `Int` custom field whose column is
   `int(11) NOT NULL DEFAULT 0`. `docs/architecture/synthetic-bureau.md` precedence rule 1 — *"No local
   score → use the bureau score"* — is therefore unreachable from a Frappe-backed application: an absent
   score arrives as `0`, which `resolve_credit_score` reads as present-and-invalid
   (`INVALID_LOCAL_SCORE`, `conflict=True`), not as missing. `applications.resubmit_application` writes
   `None` for an omitted score and MariaDB stores `0`, so the portal cannot express it either. Rule 2
   (`credit_score_origin = SYNTHETIC_PLACEHOLDER`) is fixture metadata that the doc itself says is *"never
   stored in Frappe"*, so it too is unreachable from the system of record.

What a live application *can* reach is rule 3 — local score equals bureau score,
`SYNTHETIC_BUREAU_MATCH` — or rule 4, a conflict the gate holds for review. The fixture uses rule 3, and
the mode is printed rather than assumed: `--score-mode match` asks the generator for the score the
application already records.

## 2. What was built

**`apps/loan_advisory_portal/loan_advisory_portal/tests/bureau_fixture.py`** — the seeder extension §B asked
for, run with `bench execute` inside the Frappe container. It creates no Customer, no User and no
application; it moves an existing synthetic draft to SUBMITTED through the portal's own borrower methods,
performed in-process as the application's own existing portal user (`as_user` +
`attach_fixture_document` + `submit_application`), so no password or API credential is involved. It
refuses a site not listed disposable, an application that is not a DRAFT, and an applicant with no
`@example.invalid` portal user — "explicitly synthetic borrower" is checked, not assumed. `teardown`
reverses it: the evidence record, the ingestion log, the state log, the attached file and document row,
the submission (cancel, then back to `docstatus 0` because Frappe has no un-submit) and the portal fields
the ingestion wrote.

**`tests/e2e/seed_bureau_evidence.py`** — the pipeline run, on the host, mirroring the existing
`tests/e2e/seed_evidence.py`. Reads use the `reader` credential, ingestion uses the dedicated `evidence`
service credential from the seeder's fixture file, and the agent is given neither. It calls the
application's real entry point, `run_bureau_evaluation`, so the data-quality gate, the unchanged `decide()`
and ZEN 2.1.2, the evidence record builder and the portal's trusted `evidence.ingest` all run as they do
in the pipeline process.

The bureau report is the project's own deterministic generator output —
`synthetic_bureau.generator.build_report(application_id, applicant_id, "SUCCESS", seed=20261024,
as_of=2026-10-24, correlation_id="BUREAU-<app>-FIXTURE", record_origin="generated_on_demand")` — which is
precisely what the service returns for an application with no golden case. It is handed to the **real
`BureauClient`** through an in-memory `httpx.MockTransport`, so every client-side guard stays on the path:
the loopback-only URL policy, response-schema validation, the refusal of a payload not marked synthetic,
and `report.application_id == application_id`. No service was started, no socket was opened, no external
bureau API was called, and nothing was invented: the score the decision used is the report's score and the
decision is ZEN's.

## 3. The fixture as stored

| Field | Value |
|---|---|
| Site | `loanportal.local` (disposable) |
| Application | `ACC-LOAP-2026-00020` — existing synthetic borrower `Synthetic Borrower-533f75b853` |
| Record id | `2e0ed0da-0691-583a-8bc2-444d4b2a5daf` (`Loan Decision Evidence`, deterministic uuid5) |
| Schema / policy | `decision-evidence/1` / `PERSONAL_LOAN` `synthetic-v1`, engine `zen-engine 2.1.2` |
| Outcome / decision / state | `REJECTED` / `REJECTED` / lifecycle `REJECTED`; application `status` untouched (`Open`, because `docstatus = 1` means ingestion writes no native status) |
| Score | local 640, bureau 640 → `precedence VALUES_MATCH`, `source SYNTHETIC_BUREAU_MATCH`, `conflict false` |
| Report | `BUR-DBFC94A8ED72`, `report_date 2026-10-14`, provider `synthetic-bureau`, `provider.synthetic true`, `score.type SYNTHETIC` |
| Identity | `report.applicant_id` = `Synthetic Borrower-533f75b853`, `identity.match true` |
| Inputs evaluated | income ₹40,000, obligations ₹22,000, credit score 640, employment 18 months |
| Failed rules | `FOIR_MAX_45` → `ERR_FOIR_EXCEEDED`, `MIN_CREDIT_SCORE` → `ERR_CREDIT_SCORE_BELOW_MINIMUM` (4 rules evaluated) |
| Simulation | `is_simulation false` — a real persisted evaluation, not a what-if |
| Fixture id | `phase16-bureau-evidence` (provisioning script and `bureau_fixture` module both stamp it) |

Provenance recorded by the provisioning run: generator path, scenario `SUCCESS`, seed `20261024`,
as-of `2026-10-24`, `record_origin generated_on_demand`, `score_mode match`, `target_score 640`,
`service_started false`, `network_used false`, plus the application's own recorded score alongside the
report's. That is the whole point of printing it: which score came from where is visible in the artefact,
not reconstructed later.

**An earlier attempt, kept in the record because it changed the design.** The first fixture ran on
`ACC-LOAP-2026-00003` (an existing draft whose recorded score happens to be 760, which the generator's
default target also is) and produced a valid `APPROVED` bureau-backed record, `47ecda5f-…`. It was
torn down and rebuilt on `ACC-LOAP-2026-00020` because an approved application never reaches the
composer: `load_evidence` maps `decision == "APPROVED"` to the `approved` status, which routes to a fixed
template, so the two proofs about *explanation* — what the composer was shown, and what the deterministic
fallback says — cannot be made about it. A rejection is the case where the explanation layer actually runs.
`bureau_fixture.teardown` restored `ACC-LOAP-2026-00003` to exactly what it found: DRAFT, `docstatus 0`,
no evidence pointer, no document row, the state/ingestion logs and evidence record deleted.

## 4. Live results — the six §B requirements

`tests/test_phase1_live_integration.py`, section "Phase 1.6 §B": **6 passed**, plus the pre-existing
`test_a3_bureau_backed_evidence_still_explains_through_the_agent` which was looking for exactly this kind
of record and used to skip. They are gated on `P15_BUREAU_APP` *and* on the stored record actually
carrying a `bureau` block — a site without the fixture skips with the provisioning command in the reason.

| §B requirement | Test | Result |
|---|---|---|
| Retrieve the stored synthetic bureau evidence on the read-only identity | `test_a6_the_stored_bureau_evidence_is_readable_on_the_read_identity_alone` | PASS — with `EVIDENCE_FRAPPE_*` absent from the environment: `application_ref` correct, `is_simulation false`, `report_id`/`report_schema` present, score source starts `SYNTHETIC_BUREAU`, no provider error, 4 rule evaluations, **and** `inputs.values.credit_score == bureau.score.value` |
| Verify the `bureau_facts` mapping | `test_a6_bureau_facts_project_the_stored_record_without_deciding_anything` | PASS — outcome, legacy decision, score source and its plain wording, `synthetic_report true`, no hold, no provider failure, rejection flag consistent with its own kind; and stripping `bureau`/`review` returns `None` rather than a guess |
| Relevant evidence fields reach the explanation layer | `test_a6_the_bureau_fields_reach_the_explanation_layer` | PASS — asserted on the prompt the composer **received** (`score_source` and `score_source_plain` present in the system text, `'"bureau"'` block included), the synthetic policy label present, and `record_id` in the response's `evidence_refs` |
| Explanation distinguishes synthetic from real bureau evidence | `test_a6_the_explanation_distinguishes_synthetic_bureau_evidence_from_a_real_report` | PASS — with the composer raising `LLMError`, the deterministic template is what the borrower gets, and it says the score came from "the synthetic bureau, which matched the score already on the application" and is "synthetic prototype data, not a real credit bureau report". A wording that only appears when an LLM cooperates is not a guarantee |
| The agent cannot initiate a bureau evaluation | `test_a6_nothing_the_borrower_can_send_reaches_a_bureau_client` | PASS — live ASGI app has no `/api/bureau/run` (404), `App` holds only the agent, and a bounded walk of the live object graph finds no `fetch_report`, `bureau_client`, `bureau_run` or `run_bureau_evaluation` |
| No lifecycle or Decision Evidence mutation during a turn | `test_a6_an_agent_turn_on_the_bureau_record_mutates_nothing` | PASS — projected document identical, Frappe's own `modified` identical, evidence row count identical, and the stored `record_json` of the bureau record byte-identical before and after the turn |

Full live module on this run: **27 passed, 0 skipped**, including both cross-service journeys.

## 5. Removal

The fixture is confined to `loanportal.local` and removable in one command per half:

```sh
# inside the Frappe container — evidence, logs, document, submission, portal fields
bench --site loanportal.local execute loan_advisory_portal.tests.bureau_fixture.teardown \
    --kwargs '{"application": "ACC-LOAP-2026-00020"}'
```

Nothing else on the site was changed. `ACC-LOAP-2026-00025` (the Phase 1.5 rejected borrower used by the
journey tests) and `ACC-LOAP-2026-00026` (the draft that must stay private) are untouched, and the
teardown of `ACC-LOAP-2026-00003` left that application exactly as it was found.

## 6. What remains blocked

| # | Blocker | Who closes it |
|---|---|---|
| 1 | **The real client → real service path cannot be exercised for any seeded synthetic borrower.** `BureauReportRequest.applicant_id`'s pattern rejects `Synthetic Borrower-…`. Either the bureau wire schema relaxes the identifier, or the pipeline must send a scheme-safe applicant reference (the Customer's id is not one), or the seeder must name synthetic Customers without a space. That is a product decision with a schema consequence, not a test fix | Owner decision, Phase 2 |
| 2 | **Precedence rules 1 and 2 are unreachable from Frappe.** `custom_credit_score` is `NOT NULL DEFAULT 0`, and `credit_score_origin` is never stored. A bureau-supplied score can therefore only ever *confirm* a recorded score, never replace or fill one. `docs/architecture/synthetic-bureau.md` documents a precedence the system of record cannot express | Owner decision: doc correction, or a schema change |
| 3 | **The bureau-backed borrower has no credential in the current seed file**, so its explanation proofs run through the agent's own session object (`agent.run` + `Session(applicant_ref=…)`) as A4 does, not through a portal-minted assertion. The HTTP+assertion journey is proven live for `ACC-LOAP-2026-00025` | Provisioning convenience, not a gate |
| 4 | One bureau-backed record exists, of the `MATCH` shape. The data-quality-hold shape (`DQ_CREDIT_SCORE_CONFLICT`, `INVALID_LOCAL_SCORE`) is proven offline (`tests/test_bureau_lifecycle.py` replays all 120 golden cases) but not on a live site | Cheap to add if wanted: `--score-mode generator_default` on a matching application |
