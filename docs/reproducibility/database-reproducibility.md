# Database reproducibility

Rule: schema and synthetic data are reproduced by **code in the repository**. Raw database content is
never the mechanism, and never committed.

## What recreates the database

| Layer | Source in git | Command |
| --- | --- | --- |
| Frappe schema, DocTypes, custom fields, roles | `apps/loan_advisory_portal/**/doctype/**/*.json`, `install.py` (`ensure_roles`, `ensure_custom_fields`), `hooks.py` fixtures | `bench --site <site> install-app loan_advisory_portal` then `migrate`. Both ensure-functions run on `after_install` **and** `after_migrate`, so a migrated site always ends with the custom fields |
| ERPNext / Lending schema | upstream apps at `version-16`, declared in `infra/frappe/apps.json` | `bench new-site --install-app erpnext`, `bench install-app lending` |
| Underwriting catalogue (company, product, document types) | `infra/frappe/bootstrap/seed_site.py`, `seed_applications.json`, `make_seed.py` | `infra/frappe/bootstrap/seed.sh` |
| Browser-test borrowers, applications, private files, service accounts | `apps/loan_advisory_portal/.../tests/e2e_seed.py` (+ `tests/utils.py` builders) | `bench --site <site> execute loan_advisory_portal.tests.e2e_seed.seed --kwargs '{"tag":"e2e1"}'` |
| A genuine decision, produced not inserted | ZEN ruleset in `decision_engine/`, `application/lifecycle.py`, `infrastructure/evidence_store.py` | `python tests/e2e/seed_evidence.py --seed <temp>/e2e1.json --trace-dir <temp>/traces` → `{"state":"REJECTED","decision":"REJECTED"}` + evidence row |
| Synthetic bureau reports | `apps/bureau/src/synthetic_bureau/{fixtures,generator}.py`, committed 120-case set `data/synthetic/bureau/cases_120.json` | start `synthetic_bureau.app`; larger sets generated on demand rather than committed |
| Policy corpus for retrieval | `data/sources/policy_manifest_v2.json`, `policy_register.yaml`, ingestion code in `rag/corpus.py` | rebuild the index into a directory you set as `LOAN_POLICY_DIR`. The **index itself is not in git**, so a clean machine cannot cite until it is rebuilt — this is the one real gap |

## Teardown, which is part of reproducibility

`e2e_seed.teardown --kwargs '{"tag":"e2e1"}'` deletes users, customers, applications (cancelling a
submitted doc first), attached private files, evidence ingestion logs, application state logs, decision
evidence rows **and** the `Advisory Conversation` transcripts the browser journeys create. Without the
conversation removal, test text persists in a borrower-visible store.

The journeys' own create→upload→submit→withdraw application is intentionally left behind so a run can be
inspected, and is named in `tests/e2e/README.md`.

Both seed and teardown refuse to run unless the site sets `allow_tests`. Neither has a variant that
targets the shared site.

## Evidence archived outside git

25 files under `docs/borrower-frontend/acceptance/**/database/` (and two named probe outputs, 284,547
bytes) were excluded from the release: record dumps from a disposable site are not release artefacts,
and this repository is public.

- Location: `Documents\Projects\frappe-evidence-archive\2026-11-02\files\…`, paths preserved
- Manifest: `EVIDENCE-MANIFEST.json` — per-file path, format, size, mtime, SHA-256, whether it carries
  row content, credential hits, personal-data shapes, and classification
- Classification: 8 useful audit evidence, 9 reproducible temporary data, 8 sensitive evidence
  (synthetic row content)
- Credentials found: **0**. Personal-data shapes: synthetic fixture values only
- Integrity: copied, checksum-verified, originals removed only after verification; re-checked after an
  ACL change at 25/25 with 0 mismatches
- Nothing was deleted without a verified copy, and nothing here is in git

Access is owner-restricted by explicit grant. One method was rejected after it locked the owner out:
`icacls /inheritance:r` on a tree you also need to read.

## The rule for future evidence

If a fact can only be shown by a row dump, prefer committing the **generator and the query** and
attaching a sanitised manifest: counts, checksums, schema names. That keeps the audit trail reproducible
without publishing table content.
