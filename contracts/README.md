# Saral contracts

Shared, versioned schemas for the Saral loan flow: applicant record, document extraction, bureau view, ZEN input/output, decision trace and segments. They are **contracts only**. They contain no decision logic, and no threshold in them is in force. Every record is synthetic, with `SYN-` ids.

| Contract | Schema id | Module |
|---|---|---|
| Applicant (masked PAN, Aadhaar last 4, bureau snapshot ref) | `saral-applicant/1` | `applicant.py` |
| DocumentExtraction (value + OCR confidence + source doc/page per field; PR #41 kinds and statuses) | `saral-document-extraction/1` | `document_extraction.py` |
| SignatureCheck (experimental, screening only) | — | `document_extraction.py` |
| BureauReport (score, tradelines, EMIs, DPD 12/24 m, enquiries 6 m, write-off/settlement) | `saral-bureau-report/1` | `bureau_report.py` |
| Segment, SegmentAssignment | `saral-segment/1` | `segment.py` |
| ZenInput, ZenOutput | `saral-zen-input/1`, `saral-zen-output/1` | `zen.py` |
| DecisionTrace (rule id, actual, threshold, operator, result, outcome, basis, citation) | `saral-decision-trace/1` | `decision_trace.py` |

- JSON Schema: `contracts/schemas/*.schema.json`. Regenerate with `python -m contracts.export_schemas`; `--check` fails if the files are stale. Cross-field rules are enforced only by the pydantic models.
- Fixtures: `contracts/fixtures/*.json`. Regenerate with `python contracts/fixtures/build_fixtures.py`, which also writes `docs/saral/rule_catalogue.draft.json`.
- Tests (offline, no services): `python -m pytest contracts/tests -q`. These tests are **not** in the repo's default `testpaths = ["tests"]`, so run them by path.
- Design: `docs/saral/ZEN_DESIGN.md`. Pending values: `docs/saral/THRESHOLD_APPROVALS.md`.

## Rule catalogue v2 and data dictionary (design only)

- `contracts/catalogue_v2/` holds the v2 rule specs (user's PL-001..PL-099 canonical, read from `docs/saral/source/USER_RULE_CATALOGUE_PL.yaml`, plus PL-100..PL-128), the data dictionary, the MVP frontend field spec, the product matrix with offer sizing, and the synthetic-source coverage target.
- Generate with `python -m contracts.catalogue_v2.build` (`--check` fails when outputs are stale; `--corpus <g1 out dir>` also verifies every quoted chunk verbatim).
- Outputs: `docs/saral/rule_catalogue.v2.json` (single source of truth for rules; never indexed by RAG), `docs/saral/RULE_CATALOGUE_V2.md`, `DATA_DICTIONARY.md`, `REASON_DISCLOSURE_POLICY.md`, `FRONTEND_MVP_FIELD_SPEC.md`, `ZEN_INPUT_COVERAGE.md`, `PRODUCT_MATRIX.md`, `ZEN_RAG_CONSISTENCY.md`, and `contracts/data_dictionary.json`, `frontend_fields.json`, `product_matrix.json`, `synthetic_sources.json`.
- No ZEN/JDM file is produced. `rule_catalogue.draft.json` and its tests are unchanged.
