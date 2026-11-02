# Final reproducibility report

Audit date 2026-11-02. Target: the Frappe borrower platform as published on `main`.

**Verdict: VERIFIED WITH LIMITATIONS.** A developer who clones this repository and follows
[../development/setup.md](../development/setup.md) ends up with a working site, a working portal, a passing
test suite, working assistant integration and passing browser journeys, using only files inside the
repository plus the external prerequisites named in section G. Two things are not reproducible from the clone
alone — the policy retrieval index and the Frappe Docker image build — and neither is a defect in the
documentation: both need artefacts that are deliberately outside the repository. Because an essential step
(the image build) was not re-executed from scratch on a virgin machine, this cannot be certified as VERIFIED.

| Fact | Value |
| --- | --- |
| Cloned | `https://github.com/Narendarcodes/Load-Advisory-Agent.git`, branch `main`, HEAD `76ae289edcbc0ab0c03a1a73c8d2836909380600` |
| Clone location | `Documents/Projects/reproducibility-audit/frappe-clean-clone` (separate from every developer worktree) |
| Tracked files at clone | 1,690 |
| Fixes landed by this audit | 1 new install script, 1 new compose override, 1 new Python manifest, 3 corrected manifests, 1 corrected CI workflow, 1 corrected e2e harness set, 3 test modules made self-sufficient, 6 new diagrams, 7 new documentation files |
| Machine | Windows 11 10.0.26200, x64, Docker Desktop 29.8.1, Python 3.14, Node 24.18.0, 4 GB GPU |

## A. Repository completeness

**Is everything required for the Frappe application in `main`? Yes, with one exception that is by design.**
The portal app source (`apps/loan_advisory_portal`, DocTypes, controllers, `www/` pages, templates, the built
assistant island under `public/js/assistant`), the Node runtime (`apps/runtime`), the island source
(`apps/web/assistant`), the decision engine (`decision_engine`), the agent (`apps/api`), the synthetic bureau
(`apps/bureau`), the compose files, bootstrap scripts and test harnesses are all tracked. The exception is the
**policy retrieval index**: `LOAN_POLICY_DIR` points at generated artefacts (chunk set + Qdrant collection)
that are not in git, so a clean machine cannot answer policy questions or produce citations until it rebuilds
them from the committed register and sources. That is a documented, deliberate exclusion — the corpus is
third-party text — not a missing file.

**Undocumented external dependencies? Two, now documented.** (1) `loanrangers-frappe:16` is built from a
frappe_docker checkout at a pinned commit; the repository contains no Dockerfile of its own. setup.md §3 states
this, pins the commit and gives the build command. (2) The provider endpoint for the LLM. Everything else that
was previously only present on the author's machine has been moved into the repository: the portal install
procedure (`infra/frappe/bootstrap/install_portal_app.sh`), the isolated-stack override
(`infra/frappe/loanrangers.isolated.yml`), and the test-only Python dependencies
(`requirements-test.txt`).

**Required files missing? None found.** The check that would have caught one was running the whole documented
procedure from the clone instead of reading it.

## B. Dependency correctness

| Manifest | Status after the audit |
| --- | --- |
| `requirements.txt` | accurate for the application set; `opentelemetry-sdk` and `opentelemetry-exporter-otlp-proto-http` added (imported directly, previously available only as a transitive dependency of `langfuse`) |
| `requirements-test.txt` | **new.** Previously the test-only imports (`rank_bm25`, `qdrant-client`, `beautifulsoup4`, `pyyaml`, `pymupdf`, `pypdf`, `playwright`, `urllib3`) were installed by an inline command in CI, so a clean `pytest` from the clone could not even collect. Its absence was the single largest reproducibility defect found |
| `requirements-rag.txt` | `pymupdf` and `torch` added; `pymupdf` was imported by `rag/corpus.py` and declared nowhere |
| `requirements-data.txt`, `pyproject.toml` | unchanged; verified consistent with the install actually performed |
| `.github/workflows/ci.yml` | now installs `requirements.txt` + `requirements-test.txt` and caches on all three manifests; the GPU-only RAG extras remain deliberately out of CI |
| `apps/runtime`, `apps/web/assistant`, `tests/e2e` | three `package.json` + three committed `package-lock.json`; `npm ci` succeeded in all three from the clone (345 / 1,041 / harness packages); no package manager was introduced |

Versions are supported and were not upgraded for the sake of it: Frappe 16.51.0, ERPNext 16.50.0, Lending
16.6.1, `loan_advisory_portal` 0.1.0, `zen-engine==2.1.2` (pinned), React 19.2.0, CopilotKit 1.83.0,
Vite ^8.3.5, TypeScript ^5.9.0. Clean installs work — proven by a new virtualenv and three new
`node_modules`, not by inspection. The full matrix is in [dependency-matrix.md](dependency-matrix.md).

## C. Documentation

New, all written from the procedure actually executed:
[../development/setup.md](../development/setup.md),
[../development/environment-variables.md](../development/environment-variables.md),
[../development/local-development.md](../development/local-development.md),
[../deployment/README.md](../deployment/README.md),
[../testing/README.md](../testing/README.md),
[../troubleshooting/README.md](../troubleshooting/README.md) and this folder. The root README gained a
"Start here" table that maps every topic in the brief to exactly one authoritative document.

Startup and shutdown commands are verified, not transcribed: the same commands were run against the audit site
and against the manual-testing environment, and the shutdown was exercised (Docker Desktop was stopped and
started again during the audit, which is the harshest form of the teardown test — see the note in section F).
Environment variables are documented per consumer with the failure each missing value produces, including the
three that bite hardest: `AGENT_ASSERTION_SECRET` (the agent refuses to bind a port), `LLM_REASONING_EFFORT`
(every turn answers nothing) and `LOAN_POLICY_DIR` (a default inherited from the original author's machine).

Limitations are stated in [known-limitations.md](known-limitations.md) and repeated where they matter: the
assistant without a rebuilt index has no citations; voice needs LiveKit; there is no real bureau, KYC, OCR or
payment integration; and Langfuse currently constructs its exporter without a span processor, so it ingests
nothing — documented as broken rather than demoed as working.

Two claims that were **false** and are now corrected: the README described the advisory server as "Python
standard library (`http.server`)" when it is FastAPI served with uvicorn, and several notes pointed
`FRAPPE_URL` at `:8080`, which is a different site's hard-pinned front door.

## D. Diagrams

Eleven diagrams exist, every one with an editable Mermaid source committed beside the rendering.

| Diagram | Source | Rendered | Matches the implementation? |
| --- | --- | --- | --- |
| 01 System context | yes | SVG + PNG | labels the agent endpoints correctly but predates the migration; see below |
| 02 Components | yes | SVG + PNG | as above |
| 03 Agent request sequence | yes | SVG + PNG | accurate for the graph; drawn before the assertion bridge existed |
| 04 Voice turn sequence | yes | SVG + PNG | accurate for the worker path; voice is not runnable without LiveKit |
| 05 Data and policy ingestion | yes | SVG + PNG | accurate |
| 06 Entity model | yes (new) | SVG | **new**, built from the 11 real DocTypes and their actual field names |
| 07 Infrastructure / deployment | yes (new) | SVG | **new**, real services, volumes and ports, development-only surfaces marked |
| 08 Borrower application sequence | yes (new) | SVG | **new**, matches what `portal_journeys.py` drives |
| 09 Decision engine flow | yes (new) | SVG | **new**, LLM absent from the decision path by construction |
| 10 Consent lifecycle | yes (new) | SVG | **new**, including the controller restamping `consent_at` on every profile save |
| 11 Authentication and authorization | yes (new) | SVG | **new**, browser → runtime → agent boundary with no direct edge |

All nine diagrams the brief requires exist and are current: system context (01), application architecture (02),
infrastructure (07), ER (06), borrower application sequence (08), assistant sequence (03 plus 11 for the trust
boundary), decision-engine flow (09), consent lifecycle (10) and authentication (11).

**Honest status of 01–05 against today's code:** they are not yet corrected. 01 and 02 describe the advisory
server as a stdlib `http.server` on `:8095` and none of 01–05 mentions the CopilotKit runtime, the React island
or the assertion bridge. That drift was found by comparing each node against the source, and it is recorded
with the exact edits needed in [diagram-inventory.md](diagram-inventory.md). It was left unedited **on purpose**:
the owner declined the batch re-render during this audit, and publishing a changed `.mmd` next to an unchanged
`.svg` would ship a picture that contradicts its own source. The file states the two-line fix and the single
command (`bash docs/architecture/diagrams/render.sh`) that closes it.

The six new diagrams were each rendered with `@mermaid-js/mermaid-cli@11` and re-read after rendering; two
parse errors (`;` inside a `Note over`, and an `&lt;assertion&gt;` entity) were caught only by the renderer, not
by reading the source.

## E. Database reproducibility

Yes — schema and synthetic data are recreated by code in the repository, on a machine that had never seen the
author's database:

- Schema: DocType JSON + `after_install`/`after_migrate` ensure-functions (`ensure_roles`,
  `ensure_custom_fields`) run by `install-app` and `migrate`.
- Synthetic data: `infra/frappe/bootstrap/seed.sh` for the catalogue and demo borrowers;
  `loan_advisory_portal.tests.e2e_seed.seed` for the two browser-test accounts; `tests/e2e/seed_evidence.py`
  runs the **real** ZEN pipeline to produce a decision rather than inserting one. On the audit site this
  produced `{"state": "REJECTED", "decision": "REJECTED"}` plus an evidence row and applications
  `ACC-LOAP-2026-00001/00002`.
- Teardown: `e2e_seed.teardown` removes users, customers, applications, private files, evidence, state logs and
  the conversation transcripts the journeys create. Both scripts refuse to run without `allow_tests`.
- Proof: `bench --site <fresh-site> run-tests --app loan_advisory_portal` → **193 tests, OK**. That number was
  *not* true at the first pass; getting it to hold is the subject of section F.

Evidence archived outside git: 25 files from `docs/borrower-frontend/acceptance/**/database/`, under
`Documents\Projects\frappe-evidence-archive\2026-11-02\`, verified 25/25 against `EVIDENCE-MANIFEST.json` with
0 checksum mismatches, classified 8 audit evidence / 9 reproducible temporary / 8 sensitive-synthetic, 0
credentials found. Nothing was committed and nothing was deleted before its copy was verified.

Data still missing from the reproducibility process: the built policy index (section A), and the raw record
state of long-lived sites — which is not a gap by policy, because a dump is never the mechanism. See
[database-reproducibility.md](database-reproducibility.md).

## F. Clean-machine execution

Each row is an executed step against the clone, with the failure it produced before the fix.

| Step | Result | Notes |
| --- | --- | --- |
| Clone from GitHub | OK | fresh directory; no developer worktree on the path |
| Python dependency install | OK | 76 packages into a new virtualenv; then `requirements-test.txt` |
| Lint + host tests from the clone | OK | `ruff` clean; **685 passed, 15 skipped** in 109 s. First attempt failed to collect (`rank_bm25`) and silently skipped a suite (`pymupdf`) — both root-caused into manifests |
| Node dependency install | OK | `npm ci` in all three projects from committed lockfiles |
| Frontend build | OK | island production build produced 407 chunks **byte-identical to the bundle already committed** |
| Infrastructure startup | OK, with a documented trap | `up -d --pull missing`. A second compose project silently mounted the live database because volume names are pinned; fixed by `loanrangers.isolated.yml`, found by `docker compose config` |
| Frappe setup (site, ERPNext, Lending) | OK | `bench new-site --install-app erpnext`, `install-app lending` |
| Custom portal install | OK, **only after the fix** | `install_portal_app.sh` exists because bench 5.31 `get-app` has no `--subdirectory`, so no bench command can install an app that lives in a monorepo folder. Before it, a clean clone could build a site with **no borrower portal at all** |
| Migrations | OK | `migrate` re-applied custom fields and roles; script verified idempotent by running it twice |
| Database seeding | OK | two synthetic borrowers, then a real ZEN decision and evidence row |
| Backend startup | OK | `bench serve` on `:8001` inside the container, front door on `:8082`; agent on `:8097` with `--no-rag` |
| Assistant integration | OK | runtime on `:4201` from the clone's own build; assertion minted by the site, verified by the agent; island mounted |
| Browser tests | OK | **36/36** journeys after 15 harness defects were corrected; first runs could not even sign in (`#login_email` vs `#email`) |
| Security regressions | OK | **39/39** |
| Frappe application tests | **193 OK** after two real defects were fixed | first pass: 386 collected, 2 failures, 32 errors. Causes: (a) the install script's `docker cp` form **nested a second copy of the app** inside itself on every re-run, so the runner discovered `tests/` twice; (b) 17 voice tests assumed a site configured with LiveKit keys, which the documented bootstrap does not create. Fixed by a tarball copy plus a tree-shape guard that refuses a nested app, and by `configure_voice_for_tests` restoring the site afterwards. Then re-run: `Ran 193 tests in 44.087s / OK` |
| Shutdown and restart | exercised twice, one consequence found | Docker Desktop was stopped and started during the audit. Everything came back **except** the in-container `bench serve` and the host-side agent/runtime/bureau processes, which are not supervised. `docker cp` content survives a restart but not a **recreate** — which is why the install script is documented as re-runnable. The manual-testing environment was then brought back and re-verified: 200 on `/login` and `/assets/...`, agent `/healthz` 200, runtime `/api/copilotkit/info` 200, bureau 200, Groq round-trip 3.1 s, and **39/39** security regressions against `:8081` |

**The three fixes above were made in the repository, not on the laptop.** That is the difference between this
section and a run log.

## G. Remaining blockers and external prerequisites

Mandatory for the platform as tested: Docker (Desktop on Windows, Engine on Linux) with enough disk for the
Frappe volumes; Python 3.14 and Node 24; about 20 minutes and network access to build `loanrangers-frappe:16`
from the pinned frappe_docker checkout; one MariaDB root password and one admin password for `new-site`.

Mandatory for the assistant, but not for the portal: an OpenAI-compatible LLM endpoint — either a provider key
(`GROQ_API_KEY` was the one used) or a local vLLM/Ollama server with `LLM_PROVIDER`/`LLM_BASE`/`LLM_MODEL` set.
Without it, the borrower can still sign in, apply, see a recorded decision and read the reasons; the assistant
answers nothing. The deterministic stub on `:8096` is test-only and must never be presented as a model answer.

Optional, each with a real cost: GPU (≈2.6 GB of 4 GB) plus a rebuilt policy index for citations; a LiveKit
server plus three site-config keys for voice; a self-hosted Langfuse stack for traces (currently ingests
nothing, see section C).

Not blocked, worth naming because they are often assumed: there is no CIBIL or bureau integration (the bureau
service is synthetic and loopback-only), no KYC vendor, no OCR, no payment gateway, no SMTP (so no email
verification or password reset), and no mobile app. Nothing in the documentation claims otherwise.

Manual prerequisites a human must still do: install Docker Desktop and start it, create the frappe_docker
checkout at the pinned commit, choose the site passwords, and set the provider key.

## H. Final verdict

**VERIFIED WITH LIMITATIONS.**

Everything the repository contains installs, migrates, seeds, builds, runs and passes its own tests on a
machine that reads only the repository. Two external artefacts must be produced before first use — the Frappe
image and the policy index — and the audit built neither from scratch on a virgin host, so the claim stops
short of unconditional. The Linux/macOS paths are documented but untested here: everything ran on Windows with
Docker Desktop.

Definition-of-done scorecard:

| # | Requirement | State |
| --- | --- | --- |
| 1 | Latest remote `main` cloned independently | done |
| 2 | Clean clone depends on no original-laptop source | done — agent, runtime and island all launched from the clone |
| 3 | Python dependencies install | done |
| 4 | Node dependencies install from committed manifests and lockfiles | done |
| 5 | Docker and infrastructure setup documented and verified | done, with the volume-pinning trap fixed in the repo |
| 6 | Frappe, ERPNext, Lending and the custom portal install | done — needed a new script |
| 7 | Migrations execute | done |
| 8 | Synthetic borrower and application data recreated | done |
| 9 | Static assets build from the clone | done, byte-identical |
| 10 | Portal runs in a browser | done |
| 11 | Assistant works where its external dependencies are configured | done without RAG (`--no-rag`); citations need the index |
| 12 | Database evidence classified, sensitive dumps outside git | done, 25/25 verified |
| 13 | README and installation documentation accurate | done; the two false claims corrected |
| 14 | Diagrams match the implementation | **partial** — the six new platform diagrams do; 01–05 still carry pre-migration labels, with the fix specified in [diagram-inventory.md](diagram-inventory.md) |
| 15 | Security and secret scans pass | done — 0 hits, plus one new finding documented: `bench.log` records secrets passed on a command line |
| 16 | Regression suites pass | done — 685/15, 193 OK, 86, 13, 36/36, 39/39 |
| 17 | Reproducibility PR merged after CI | see the PR record in the release report |
| 18 | Local `main` matches `origin/main` | after the merge, yes |
| 19 | Primary worktree clean | after the merge, yes |
| 20 | FastAPI full-stack work stays local and out of the release | yes — nothing from it is in this diff |

## What the audit left behind

- The clone directory `Documents/Projects/reproducibility-audit/frappe-clean-clone` with its `.venv-repro` and
  three `node_modules` — kept until this PR merges, then it can be deleted without losing anything.
- Site `repro.local` on the shared Frappe container, with its synthetic rows, and the container
  `repro-acceptance-proxy` (stopped). Both are audit artefacts; neither is referenced by the manual-testing
  environment, and `p1loan.local` and `loanportal.local` were not modified by the audit's data work.
- The manual-testing environment is **still running** as required: portal `:8081`, agent `:8095` with the policy
  retriever loaded, runtime `:4200`, synthetic bureau `:8011`, Langfuse `:3000`, `p1loan.local` on `:8080`.
- Launcher scripts and credential files for both environments live outside the repository, in temp
  directories; no password or key is in any committed file.

## Follow-ups, in priority order

1. Bring diagrams 01–05 current: edit four labels, `bash docs/architecture/diagrams/render.sh`, commit sources
   and images together.
2. Make `bench run-tests --app loan_advisory_portal` a CI job (it needs a site, so a service container), or
   accept that the Frappe suite is a local-only gate — today a green check mark says nothing about it.
3. Publish a rebuild recipe for the policy index that a clean machine can run without the author's corpus
   directory, or name the exact `data/sources` command that produces it.
4. Decide the `AGENT_GPU_FRACTION` default on small cards; the CPU path is documented but slow.
5. Fix the Langfuse exporter's missing span processor, or remove the tracing documentation that implies traces
   exist.
6. Rotate the values disclosed in the earlier transcript, when the owner chooses to.
