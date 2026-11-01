# Frappe platform → main integration report

Executed 2 November 2026. Repository `Narendarcodes/Load-Advisory-Agent`, disposable-site work on
branch `feat/frappe-borrower-platform`, released through pull request **#35**.

> This document was written on the merged release branch and lands through a focused follow-up
> documentation PR rather than PR #35, which it describes: a report cannot record the merge of the pull
> request that carries it. Its companion `post-merge-housekeeping-report.md` records this document's own
> PR and merge SHA.

---

## A. Initial state

| Item | Value |
| --- | --- |
| Primary worktree branch / HEAD | `docs/status-and-audit` @ `7b2bd0b` |
| Primary worktree changes | 26 modified tracked, 40 untracked entries (133 expanded paths) |
| Frappe worktree branch / HEAD | `feat/frappe-borrower-platform` @ `7ec710e` |
| Frappe worktree changes | 41 modified tracked, 44 untracked entries → **1,297 expanded paths** |
| `origin/main` at start | `7f3ef48` (`Merge pull request #34`) |
| Local `main` at start | `b8e016e`, **behind `origin/main` by 11** |
| Branches in the repo | 45 local, several worktrees (`-integration`, `-pr11`, `-pr12`) |
| GitHub identity | `Narendarcodes`, token scopes `repo read:org workflow`, **admin = true** |
| Open PRs found | **exactly one: #35.** #34 and older are already merged |
| Ruleset on `main` | `Protect main branch` (active): blocks deletion and non-fast-forward; requires **1 approving review**, `require_last_push_approval`, `require_extra_approval_for_unattributed_changes`; merge methods merge/squash/rebase |
| Required status checks | **none configured** — CI exists (`ci.yml`, job `ruff + pytest`) but is not a ruleset-required check |

### Premise corrections, stated plainly

1. **There were not two open PRs.** Only #35 was open. The owner was asked and chose *merge the
   single real PR #35*, so this release contains one merge, not two.
2. **The prompt assumed failing CI was the risk; the actual gate was review.** The ruleset requires an
   approving review and imposes no required checks, so `--admin` bypasses review only, and CI still
   had to be genuinely green first.
3. **My earlier note that "no CI exists" was stale and is corrected here** — `ci.yml` runs
   `ruff + pytest` on Python 3.14 for PRs targeting `main`.

## B. Change classification

The two worktrees turned out to hold two different workstreams, which the prompt's single-worktree
assumption did not anticipate.

| Group | Where it actually lived | Disposition |
| --- | --- | --- |
| **A — Frappe borrower platform** | `Load-advisory-agent-frappe` (portal app, island, runtime, e2e harnesses, acceptance docs, manual testing pack) | 1,272 paths committed |
| **B — FastAPI full-stack** | `Load-advisory-agent` — `account_admin.py`, `application/{accounts,applications,invitations,session_status}.py`, `infrastructure/{frappe_accounts,frappe_invitations}.py`, `apps/api/src/loan_advisory/api/*` HTTP surface, `apps/web/advisory`, 16 new test files | **excluded**, preserved locally |
| **C — shared/ambiguous** | `apps/api/.../agent/{graph,prompts}.py`, `api/{agui,events}.py`, new `agent/progress.py`, `tests/test_agent_api.py` (62 insertions) | inspected hunk by hunk: all of it is the **graph-stage progress feature the island needs** → included |

`routes_agent.py` was checked specifically because it matched an exclusion pattern: it is **pre-existing
PR #35 baseline content**, not the excluded workstream, and the preserved branch does not touch it.

**Kept out deliberately (25 paths):** the database record dumps under
`docs/borrower-frontend/acceptance/**/database/`, plus `database-integrity-probe.txt` and
`db-after-browser-run.txt`. They remain on disk, untracked, in the frappe worktree.

**Repo hygiene added:** `.gitignore` now excludes `apps/runtime/node_modules`,
`apps/web/assistant/node_modules`, `apps/web/advisory/node_modules`, `apps/runtime/dist` and
`tests/e2e/out`; a new `.gitattributes` marks the generated island bundle, vendored webfonts + OFL
texts, and captured acceptance output as `-whitespace -text linguist-generated=true`.

Why the attributes were needed: the repo's own pre-commit hook runs `git diff --cached --check`, which
**blocked** commits over trailing whitespace inside the 20 MB minified bundle, the font license files,
and a blank line at the end of my own guide. The generated/vendored paths were declared generated
instead of being edited, and the guide's own EOF blank line was fixed. **No hook was skipped and no
file bypassed the gate.**

## C. FastAPI preservation

| Item | Value |
| --- | --- |
| Branch | `wip/fastapi-full-stack-preserved` @ `f5a82ca` |
| Worktree | `C:\Users\golla\Documents\Projects\Load-advisory-agent-fastapi` (833 files, sources checked out) |
| Contents | 131 files — the whole uncommitted FastAPI surface plus `docs/testing`, `DESIGN.md`, `PRODUCT.md`, architecture notes |
| Not committed on purpose | `log.txt` (2 bytes) and `omp-session-…html` (3.2 MB session transcript) — unrelated machine artefacts. Parked, **not deleted**, in `Documents\Projects\fastapi-workstream-artefacts\` |
| Pushed? | **No.** `git branch -r` has no matching ref |
| Merged into `main`? | **No.** Verified absent from `main`: `account_admin.py`, `api/accounts.py`, `apps/web/advisory/src` |
| Verification | The pre-commit hook ran the full suite over the preserved tree: **1047 passed, 15 skipped** |

Note: the two unmerged commits `2af3577` and `7b2bd0b` (CI + docs refresh) from
`docs/status-and-audit` are ancestors of the preserved branch, so they are retained but **not
released** — they belong to neither workstream described in the prompt.

## D. Commits and push

Eight new commits, all pushed as a plain fast-forward (`7ec710e..45ca2c1`, then `45ca2c1..f745f32`).
No force-push, no history rewrite, no branch deletion.

| SHA | Subject | Files |
| --- | --- | --- |
| `d13dde6` | chore(repo): ignore node build output and mark the island bundle as generated | 2 |
| `73182b7` | feat(api): emit graph-stage progress over AG-UI | 6 |
| `295c666` | feat(web): show turn progress, the what-if form and GenUI cards | 18 |
| `5f8bef0` | feat(portal): complete the borrower portal pages and their API | 54 |
| `a9b240e` | build(portal): commit the built assistant island | 409 |
| `1426b75` | test(e2e): add the browser acceptance harnesses and write guards | 14 |
| `45ca2c1` | docs: record borrower-frontend acceptance and add manual testing pack | 771 |
| `f745f32` | docs: state citation accuracy per measured mode | 1 |

Total released diff: **1,470 files, +463,234 / −996** (dominated by the committed island build and the
acceptance screenshots, which the owner chose to include).

Every commit was made with `core.hooksPath = .githooks` active, so each one re-ran the whitespace
check, `ruff` against the staged blobs, and the **full pytest suite** (`685 passed, 15 skipped` each
time, ~35 s).

## E. Testing — exact commands and actual results

| Command | Result |
| --- | --- |
| `python -m ruff check .` | `All checks passed!` |
| `PYTHONPATH=".;apps/api/src;apps/bureau/src" python -m pytest -q` | **685 passed, 15 skipped** |
| `bench --site loanportal.local run-tests --app loan_advisory_portal` (container) | **Ran 193 tests — OK** (consent lifecycle rows visible in output) |
| `apps/web/assistant`: `npm run typecheck` | clean (`tsc --noEmit`) |
| `apps/web/assistant`: `npm test` | **86 passed** (10 files) |
| `apps/web/assistant`: `npm run build` | succeeds, 407 chunks, built into the app tree |
| `apps/runtime`: `npm run typecheck` | clean (app + test configs) |
| `apps/runtime`: `npm test` | **13 passed, 0 failed** |
| `node consent_regression_e2e.cjs` | **7/7**, 5 declared writes allowed, 0 blocked |
| `node missing_information_e2e.cjs` | **5/5 widths + 6/6 negatives**, 0 console errors |
| `node thread_continuity_e2e.cjs` | **22/22 + 4/4 control**, 0 unexpected 404s |
| `node accessibility_audit.cjs` | **103 runs, 0 runs with violations, 0 console errors** |
| `node manual_contrast.cjs` | **0 text nodes below AA, 0 indeterminate**; tightest pass 4.68:1 |
| `node keyboard_review.cjs` | **605 tab stops**, 0 offscreen, 0 without focus ring, 0 unnamed, 0 heading jumps, 0 page errors |
| `node write_guard` (attached to every browser run above) | 0 undeclared writes blocked across all runs |

**One failure was found and resolved, not hidden.** The first missing-information run failed the 390 px
case with a browser console 500 and a CSP error. Cause: **I had started the Frappe `bench run-tests`
suite concurrently against the same disposable site**, and `GET /borrower` returned 500 mid-mutation;
the CSP message was just Frappe's error page. Re-run in isolation: 5/5 valid, 6/6 negative, 0 console
errors. This is a testing-procedure hazard, not a product defect, but it is a real one — browser suites
and `bench run-tests` must not share the site at the same time.

Baselines were **re-measured, not quoted**. Where numbers drifted they are reported as measured: the
historical keyboard figure was 595 stops, today's is 605 (the what-if form adds fields); host pytest was
683 at PR submission, 685 now.

## F. Pull request

| Item | Value |
| --- | --- |
| PR | **#35** — "feat: complete the borrower platform hardening campaign (B1–I)" |
| Head → base | `feat/frappe-borrower-platform` → `main` |
| Head merged | `f745f32de1d2253368d02e7a99c51bcdbee1d548` |
| Merge order | Single PR; order question moot |
| Description | rewritten to match real content (16 commits), including what was excluded and the known limitations |
| CI on that exact SHA | **`ruff + pytest` = success** (45 s, run `41349208696`); `CodeRabbit` = *skipped*, not a required check |
| Mergeable | `MERGEABLE` — no conflicts; branch was 0 behind `origin/main` |
| Blocking reason before merge | `BLOCKED` / `REVIEW_REQUIRED` — the ruleset's 1 approving review, and nothing else |
| Bypass used | `gh pr merge 35 --merge --admin` — **review requirement only.** No required CI, security scan, build check or conflict was bypassed, because none was failing and none was configured as required |
| Merge method | `merge` commit, matching every previous merge into `main` (#29–#34) |
| Merge commit | **`1a1b2f148c502c105cdb8fbd23da61243fa3b00c`** |
| GitHub confirmation | `state: MERGED`, `mergedAt: 2026-11-01T20:56:51Z` |
| Branch cleanup | none performed — remote branch kept, as instructed |

## G. Final local worktree

```text
Current branch: main
HEAD: 1a1b2f148c502c105cdb8fbd23da61243fa3b00c
origin/main: 1a1b2f148c502c105cdb8fbd23da61243fa3b00c
HEAD == origin/main: YES
git status --short: CLEAN            (also clean with --untracked-files=all: 0 lines)
FastAPI preservation: VERIFIED       (branch f5a82ca + worktree, 131 files, never pushed)
Both PRs merged: N/A — one PR existed (#35), and it is MERGED
```

Synchronization was `git switch main` + `git pull --ff-only origin main`, after confirming `main` was
an ancestor of `origin/main`. No `reset`, no `clean`, no force operation, no deletion.

Spot-checked present in `main`: `www/borrower/kyc.py`, `tests/test_consent.py`,
`src/what-if-form.tsx`, `tests/e2e/write_guard.cjs`, the manual testing guide and checklist, the built
island `public/js/assistant/assistant.js`, `.gitattributes`.

## H. Remaining limitations and outstanding items

### Security — needs owner action, not resolved by this report

- **The Groq API key, both Langfuse project keys and the `loanportal.local`
  `agent_assertion_secret` were printed into the chat transcript during the previous session's
  manual-testing handover** (my masking set compared lowercase names against uppercase keys). They
  are **not committed anywhere** — verified: `gsk_`/`pk-lf`/`sk-lf`/`gh[pousr]_`/private-key patterns
  are absent from the working tree, from the released diff (1,470 files / 463,234 added lines) and from all branch history — but
  they should be treated as disclosed. **Rotation is the owner's call and has not been performed**,
  since changing provider credentials was explicitly outside this task's authority. The disposable
  site's own `agent_assertion_secret` matters least; the Groq key matters most.
- No borrower password, API secret, cookie, certificate or real PAN/Aadhaar/bank value is in the
  release. Pattern hits in the scan were confirmed to be synthetic fixtures (a placeholder
  `ABCDE1234F`, the generator's `+ "!A1"` suffix, phone-shaped digits) plus byte coincidences in PNGs.
  `gitleaks` is not installed on this machine, so this used a targeted pattern scan, not that tool.

### Environment / process

- **Browser suites and `bench run-tests` must not run against `loanportal.local` simultaneously** —
  see the resolved 500 in §E.
- At the moment this release was cut, the frappe worktree still held 25 untracked database-dump
  evidence files plus this report, and the preserved FastAPI branch existed on this machine only. All
  three were handled afterwards: the dumps were archived outside git with SHA-256 verification, this
  document was landed by a follow-up PR, and the FastAPI workstream gained a verified bundle, a working
  tree archive and a remote backup branch. See `post-merge-housekeeping-report.md` for the resulting
  state.
- `manualqa1-*` QA accounts and their seeded applications/conversations still exist on the disposable
  site; teardown is available (`e2e_seed.teardown --kwargs '{"tag":"manualqa1"}'`).

### Product, unchanged by this release

- **CI covers only `ruff + pytest`.** The Frappe app tests, island and runtime suites are local gates
  with no workflow enforcement — a green check does not prove them.
- **Self-hosted Langfuse still produces no traces** from the agent (OTLP endpoint answers, spans never
  land; the OTel provider is built with zero span processors in `observability.tracer()`). Documented,
  not fixed here.
- **Voice/LiveKit is not deployable** (`livekit_url = wss://livekit.invalid`), the bureau is a
  synthetic loopback stand-in with data-quality gates disabled, KYC performs no verification, there is
  no payment path, and citation strict accuracy is 0.59 by default.
- Screen-reader (NVDA) testing remains deferred; nothing in `main` should be described as
  screen-reader accessible.
- This is a **single-machine test deployment**, not a production one.
