# Acceptance evidence — 2026-11-01

Final frontend acceptance for the borrower portal: browser reproduction of the Missing Information
GenUI card and the dynamic accessibility audit, with remediation, manual review, regressions and the
temporary-environment record.

Start with [final-acceptance-report.md](final-acceptance-report.md) — it carries the A–H report and
the per-item acceptance statuses.

## Required deliverables and where each one lives

| # | Deliverable | File(s) |
| --- | --- | --- |
| 1 | Missing Information screenshots at five viewport widths | `missing-information/missing-information-{1440,1280,1024,768,390}.png` plus `-card-` and `-viewport-` crops |
| 2 | Playwright E2E test results | `missing-information/missing-information-results.json` (harness: [tests/e2e/missing_information_e2e.cjs](../../../../tests/e2e/missing_information_e2e.cjs)) |
| 3 | axe-core JSON output | `accessibility/accessibility-results.json`, pre-fix baseline in `accessibility/baseline-before-remediation/` |
| 4 | Human-readable accessibility audit report | `accessibility/accessibility-report.md` |
| 5 | Accessibility violation and remediation table | `accessibility/remediation.md` (rule, impact, component, selector, cause, fix, retest per finding) |
| 6 | Keyboard review checklist and results | `accessibility/keyboard-and-ax-tree.json` (`checklist` per §11 item, `activation`, then every Tab stop of all 30 walks), screenshots of each reached state in `accessibility/states/` |
| 7 | Browser console/error summary | `accessibility/accessibility-results.json` (`consoleErrors`, `failedRequests`), `missing-information-results.json` (`consoleErrors`), `view-matrix/_summary.json` |
| 8 | Responsive overflow results | `view-matrix/_summary.json` (85 view×width rows, `overflowPx` and offending selectors, all zero) and `missing-information-results.json` (`layout` per width) |
| 9 | Regression test summary | section E of `final-acceptance-report.md`; raw run logs in `tests/e2e/out/` (`pytest_run.log`, `node_suites.log`, `frappe_tests.log`) |
| 10 | Environment startup and shutdown report | `logs/service-inventory.md` (identifiers recorded before start) and section F of `final-acceptance-report.md`; service logs in `logs/` |

## Layout

- `missing-information/` — Part A: 21 PNGs, results JSON, `missing-information-report.md`
- `accessibility/` — Part B: audit report and JSON, remediation record, independent contrast
  recomputation (`manual-contrast.json`), keyboard/tree review, `states/` screenshots,
  `baseline-before-remediation/`
- `view-matrix/` — post-fix responsive matrix (85 PNGs + `_summary.json`)
- `logs/` — front-door/runtime/stub/dev-server logs and the service inventory

## Reproducing any of it

The stack must be up first (see [tests/e2e/README.md](../../../../tests/e2e/README.md), "Node
acceptance and accessibility harness"): disposable site plus its `bench serve`, the acceptance nginx
front door on `:8081`, the CopilotKit runtime on `:4200` and the test-only AG-UI stub on `:8096`.
No RAG agent and no model are involved.

```bash
npm --prefix tests/e2e run missing-info   # Part A
npm --prefix tests/e2e run a11y           # Part B axe audit
npm --prefix tests/e2e run contrast       # independent contrast recomputation
npm --prefix tests/e2e run keyboard       # keyboard + accessibility-tree review
```

## What is deliberately not here

No redesign, no GenUI rebuild, no new route or component, no palette or typography change, no real
KYC/bureau data, no underwriting change, no voice work, no dependency upgrade, no commit or push.
The pre-existing screenshot matrix under `docs/borrower-frontend/screenshots/2026-11-01-genui/`
(102 images) was left as captured earlier; because three ink declarations and one island layout rule
changed afterwards, `view-matrix/` in this bundle is the current visual evidence.
