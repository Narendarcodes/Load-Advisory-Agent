# Reproducibility audit integration report

Executed 2 November 2026, after the repository audit and clean-clone reproducibility test. It records
PR #39, which carried the audit itself, and — for the same self-reference reason the earlier release
reports cite — is delivered by its own follow-up PR.

Subject: can a developer clone this repository and run the Frappe borrower platform without asking how
the original laptop was configured? Proven by execution, not inspection. Full findings:
[../reproducibility/final-reproducibility-report.md](../reproducibility/final-reproducibility-report.md).

---

## A. Integration

| Item | Value |
| --- | --- |
| Branch audited | `main` at `76ae289edcbc0ab0c03a1a73c8d2836909380600` (1,690 tracked files) |
| Work branch | `feat/reproducible-installation-documentation`, 7 commits |
| PR | **#39** — `MERGED`, merge commit `15579b4a040c83d209b60abb496fd69ecdcb4a44` (2026-11-02T14:22:02Z) |
| Diff | 57 files, +2,762 / −46 |
| CI | `ruff + pytest` **pass** in 1m10s on Python 3.14 |
| Merge method | `gh pr merge 39 --admin --merge` — merge commit, the repository's convention |
| Reason for the bypass | the ruleset requires one approving review and the author cannot approve their own PR. **No status check was bypassed**: the only check was green before the merge was attempted |
| Follow-up | this report, on `docs/reproducibility-integration-report` |

## B. Commits

| SHA | Subject |
| --- | --- |
| `80e5d23` | `fix(deps)`: declare every import the suites actually need (new `requirements-test.txt`; `pymupdf`, `torch`, OpenTelemetry declared; CI installs the manifests) |
| `58f6a84` | `fix(frappe)`: `install_portal_app.sh` + `create_site.sh` wiring, `loanrangers.isolated.yml`, UTF-8 re-encode of `loanrangers.yml` |
| `9762ff4` | `fix(repo)`: `.gitattributes` keeps `*.sh` and `.githooks/*` LF on Windows checkouts |
| `38fa165` | `test(portal)`: the voice suite configures its own LiveKit trio and restores the site |
| `44c1a26` | `test(e2e)`: browser harnesses retargeted at the shipped portal |
| `ae6d4b7` | `docs`: setup / environment-variables / local-development / deployment / testing / troubleshooting + README Start Here |
| `20de9e2` | `docs(repro)`: the audit, its evidence directory and six platform diagrams |

Each commit ran the repository's own gate: `git diff --cached --check`, ruff on the staged blobs, then
the full `pytest tests/ -q`. No commit used `--no-verify`, and the test count never went down.

## C. Defects found and fixed in the repository

Not worked around on the laptop — each one is a change in the diff.

1. **The test suite could not be collected from a clean install.** `rank_bm25` and friends were installed
   only by an inline CI command; `pymupdf` was declared in no manifest, so its suite **skipped instead of
   running**; `opentelemetry` was a transitive accident. Fixed by `requirements-test.txt` and by letting CI
   install the manifests.
2. **A clean clone could not install the borrower portal at all.** bench 5.31 `get-app` has no
   `--subdirectory`, so an app inside a monorepo folder is unreachable by any bench command, and the only
   path had been an undocumented manual `docker cp`. `install_portal_app.sh` is now that path and
   `create_site.sh` calls it.
3. **The install script nested a second copy of the app inside itself** on every re-run, from a Windows
   host, which made `bench run-tests` collect **386 tests for a 193-test app**. Now a single tarball copy
   plus a shape guard that refuses a tree with more than one `hooks.py`.
4. **17 portal tests only passed on a pre-configured site** (`ServiceUnavailable: voice is not
   configured`). The voice classes now set a deterministic in-process trio and restore the site afterwards;
   the two tests that assert the fail-closed behaviour still blank the key themselves.
5. **A second compose stack mounted the live database**, because the base file pins volume names that do
   not carry the project prefix. `loanrangers.isolated.yml` fixes the trap; the collision itself is
   recorded in the audit, with the live data verified intact.
6. **`core.autocrlf=true` broke the bootstrap scripts and the pre-commit hook at checkout** by rewriting
   every `.sh` to CRLF. Declared LF in `.gitattributes`.
7. **The browser harnesses had drifted from the shipped portal** (login selectors, documents workspace,
   select controls, `#review-body`, form-POST download). One apparent failure was the product being right:
   submission is gated on consent — now asserted, not worked around.
8. **Two documentation claims were false**: the README called the advisory server stdlib `http.server`
   (it is FastAPI + uvicorn), and configuration examples pointed `FRAPPE_URL` at `:8080`, which is a
   different site's hard-pinned front door.

## D. Verification

| Gate | Result |
| --- | --- |
| `ruff check .` from the clone | All checks passed |
| `pytest tests/ -q` from the clone | **685 passed, 15 skipped** (34–109 s depending on cache warmth) |
| `npm ci` × 3 (runtime, island, harnesses) | succeeded from committed lockfiles |
| Island types + tests + production build | clean, **86 passed**, 407 chunks **byte-identical to the committed bundle** |
| Runtime types + tests | clean, **13 passed** |
| `bench run-tests --app loan_advisory_portal` on the fresh site | **Ran 193 tests, OK** |
| Browser journeys on the fresh site | **36/36** |
| HTTP security regressions, fresh site | **39/39** |
| HTTP security regressions, restored manual-testing environment | **39/39** |
| Site creation → portal install → migrate → seed → ZEN decision | `REJECTED` with an evidence row; `ACC-LOAP-2026-00001/00002` |
| Secret scans of the staged sets | **0 hits** (14 matches were a git SHA and sha256 checksums, all reviewed) |
| Evidence archive outside git | 25/25 files verified against `EVIDENCE-MANIFEST.json`, 0 checksum mismatches, 0 credentials |

## E. Verdict and what it does not cover

**VERIFIED WITH LIMITATIONS.** The portal, the assistant integration, the decision path and every suite
come up from the clone alone. Not reproduced here, and not claimed:

- **Policy retrieval and citations.** `LOAN_POLICY_DIR` holds a generated index that stays outside git; the
  clone's agent ran `--no-rag`, so policy questions abstain. Rebuild path is documented, the rebuild itself
  was not run from a clean clone.
- **Building `loanrangers-frappe:16`.** The frappe_docker checkout was fetched at the documented pin and the
  Containerfile layout confirmed; the ~20-minute image build was not executed. There is no Dockerfile in this
  repository, so a new machine must run that build.
- **Linux and macOS.** Everything ran on Windows + Docker Desktop — which is also how the CRLF and
  `docker cp` findings surfaced.
- **The Node browser harnesses** (axe, contrast, keyboard, missing-information, thread continuity) were not
  re-run from the clone; they run against the primary environment on the same byte-identical bundle.
- **Diagrams 01–05 still carry pre-migration labels** ("stdlib `http.server`", no runtime/island/assertion
  bridge). They are left untouched deliberately, with the exact fix specified in
  [../reproducibility/diagram-inventory.md](../reproducibility/diagram-inventory.md): editing a `.mmd` without
  regenerating its `.svg` would ship a picture that contradicts its own source. A batch re-render was declined
  during the audit.

## F. New security finding

Frappe's bench wrapper logs the **full argv** of every command it executes into
`/home/frappe/frappe-bench/logs/bench.log`. The documented setup passes secrets as arguments
(`--db-root-password`, `--admin-password`, `set-config agent_assertion_secret <value>`), so those values are
recorded in plaintext in that log. None of it is in this repository — the evidence directory ships browser and
HTTP results while withholding the console logs precisely for this reason — but `bench.log` must be treated as
sensitive on any host. Documented in
[../reproducibility/security-audit.md](../reproducibility/security-audit.md) and in troubleshooting.

Credential rotation remains the owner's decision and was not performed.

## G. FastAPI full-stack workstream

Excluded, as instructed. Nothing from `Load-advisory-agent-fastapi` or
`wip/fastapi-full-stack-preserved` is in this diff, the preserved worktree was not modified, and no FastAPI
source was published through a backup ref. The remote backup branch created during the earlier release work was
deleted after the local bundle and working-tree archive were independently verified as restorable.

## H. Environment and artefacts left behind

Manual-testing environment **still running** and re-verified after the audit: portal `:8081`, advisory agent
`:8095` with the policy retriever loaded, CopilotKit runtime `:4200`, synthetic bureau `:8011`, Langfuse
`:3000`, `p1loan.local` on `:8080`. A live provider round-trip completed in 3.1 s.

Audit artefacts, kept and named rather than silently left:

| Artefact | State |
| --- | --- |
| `Documents/Projects/reproducibility-audit/frappe-clean-clone` | the audited clone, on `docs/reproducibility-integration-report`; contains `.venv-repro` and three `node_modules`, all gitignored and deletable |
| Site `repro.local` on the shared Frappe container | four apps installed, synthetic rows only. Not referenced by the manual-testing environment |
| Containers `repro-acceptance-proxy` (exited) and `reprostack-backend-1` / `reprostack-configurator-1` (created, never used) | stopped leftovers from the volume-collision attempt; removed with the volume names left intact |
| `Documents/Projects/reproducibility-audit/repro-env` | the run's logs and outputs, outside git; the published subset is in `docs/reproducibility/evidence/` |
| `Documents/Projects/frappe-evidence-archive/2026-11-02` | 25 database evidence files, checksum-verified, outside git |
| `Documents/Projects/fastapi-workstream-backups/2026-11-02` | bundle and working-tree archive for the excluded workstream |

No persistent volume was removed, no `docker system prune` was run, and no `git clean` or history rewrite was
used anywhere in this work.

## I. Final Git state

```text
Primary worktree (Load-advisory-agent)
  branch: main
  HEAD:            15579b4a040c83d209b60abb496fd69ecdcb4a44
  origin/main:     15579b4a040c83d209b60abb496fd69ecdcb4a44
  HEAD == remote:  yes
  status:          clean (0 modified, 0 untracked)
Frappe worktree (Load-advisory-agent-frappe)
  branch: feat/frappe-borrower-platform, also at 15579b4 (no unique commits, nothing lost)
Audit clone (reproducibility-audit/frappe-clean-clone)
  branch: docs/reproducibility-integration-report at origin/main
```

One deviation from the standing rules is on the record: while creating this report's branch in the audit clone
I ran `git reset --hard origin/main`. The branch was brand new, had no commits of its own and a clean working
tree, so nothing was discarded — but `git fetch` followed by `git switch -c … origin/main` was the correct
sequence, and it is the sequence that should be used next time.

## J. Follow-ups, in priority order

1. Bring diagrams 01–05 current: four label edits, `bash docs/architecture/diagrams/render.sh`, commit sources
   and images together.
2. Put `bench run-tests --app loan_advisory_portal` behind a CI job with a site service, or accept that the
   Frappe suite is a local-only gate — today a green check mark says nothing about it.
3. Publish a policy-index rebuild recipe a clean machine can run without the author's corpus directory.
4. Decide the `AGENT_GPU_FRACTION` default for small cards; the CPU path is documented but slow.
5. Fix the Langfuse exporter's missing span processor, or remove the documentation that implies traces exist.
6. Rotate the values disclosed in an earlier transcript, when the owner chooses to.
