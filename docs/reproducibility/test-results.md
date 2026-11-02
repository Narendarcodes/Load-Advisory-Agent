# Test results

Fresh numbers from the 2026-11-02 clean-clone audit, kept separate from the historical baselines they
are compared against. A baseline is not a result.

## Fresh, from the clean clone

| Suite | Command | Result |
| --- | --- | --- |
| Host Python tests | `.venv\Scripts\python -m pytest -q` | **685 passed, 15 skipped**, 109 s |
| Lint | `.venv\Scripts\python -m ruff check .` | All checks passed |
| Island types | `npm run typecheck` (apps/web/assistant) | clean |
| Island tests | `npm test` | **86 passed** (10 files) |
| Island production build | `npm run build` | 407 chunks, **byte-identical to the committed bundle** |
| Runtime types | `npm run typecheck` (app + test configs) | clean |
| Runtime tests | `npm test` | **13 passed, 0 failed** |
| Frappe application tests | `bench --site <fresh-site> run-tests --app loan_advisory_portal` | **193 tests, OK** in 44 s — after two defects were fixed: the install script's nested copy (which made the runner collect 386) and 17 voice tests that only passed on a pre-configured site |
| Browser journeys | `portal_journeys.py --base http://127.0.0.1:8082` | **36/36** |
| HTTP security regressions | `portal_security.py --base :8082 --agent :8097 --runtime :4201` | **39/39** |
| HTTP security regressions, re-run against the manual-testing environment after the audit | `portal_security.py --base :8081 --agent :8095 --runtime :4200` | **39/39** |
| Site creation from scratch | `bench new-site --install-app erpnext` + `install-app lending` | succeeded |
| Portal install + migrate | `install_portal_app.sh` | succeeded, idempotent on re-run |
| Seeding | `e2e_seed.seed`, then `seed_evidence.py` | `ACC-LOAP-2026-00001/00002`; decision `REJECTED` with an evidence row |

The skips are declared, not concealed: they are the live-Frappe, live-Langfuse and live-LLM suites
(each gated behind an env flag or a reachable site) and three POSIX permission-bit assertions that
cannot apply on Windows. `-rs` prints the reason for every one.

## Historical baselines, for comparison only

| Suite | Previously reported | Now | Explanation |
| --- | --- | --- | --- |
| Host repository | 685 passed, 15 skipped | 685 / 15 | unchanged |
| Frappe portal | 193 passed | 193 OK on a fresh site | same count, now reproducible. The first clean-clone pass could not confirm it: a nested app copy doubled collection to 386 and 17 voice tests needed site config the bootstrap never sets (rows 16–17 of [clean-clone-audit.md](clean-clone-audit.md)) |
| Assistant island | 86 passed | 86 | unchanged |
| Runtime gateway | 13 passed | 13 | unchanged |
| Journeys | 36/36 | 36/36 | count restored, but **only after 13 stale assertions were corrected**; see clean-clone-audit.md. Two intent-chip checks were removed and two new behavioural checks added |
| HTTP security | 39/39 | 39/39 | unchanged |
| axe-core | 103 runs, 0 violations | not re-run from the clone | verified against the primary environment on the same byte-identical bundle |
| Contrast | 0 below AA, 0 indeterminate | not re-run from the clone | as above |
| Keyboard | 595 stops | 605 stops (primary env, 2026-11-02) | drift explained: the what-if form added fields. 0 structural findings |

## Not run, and why

| Suite | Reason |
| --- | --- |
| Policy retrieval / citation tests from the clone | `LOAN_POLICY_DIR` and the vector index are not in the repository; the clone agent ran `--no-rag`. See [known-limitations.md](known-limitations.md) |
| Voice | no LiveKit server exists to point at |
| Frappe tests against the clone site concurrently with browser suites | measured hazard: it produced a false 500 during the release work. These ran sequentially instead |

## The CI gate

`.github/workflows/ci.yml` runs `ruff` then `pytest` on Python 3.14 for PRs targeting `main`. It does
**not** run the Frappe app tests, the island, the runtime or any browser suite. A green check mark is
therefore evidence about one suite, not about the platform. The numbers above are the local gates that
CI does not cover.
