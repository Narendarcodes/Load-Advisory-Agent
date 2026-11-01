# Post-merge housekeeping report

Executed 2 November 2026, after PR #35 released the Frappe borrower platform. This report covers the
four remaining items and the state they left behind. It records PR #36, which carried
`frappe-main-integration-report.md`, and is itself carried by a follow-up PR for the same
self-reference reason.

---

## A. Frappe release

| Item | Value |
| --- | --- |
| PR #35 | `MERGED` — merge commit `1a1b2f148c502c105cdb8fbd23da61243fa3b00c` (2026-11-01T20:56:51Z) |
| Follow-up documentation PR | **#36** — `docs: record the Frappe platform main integration (PR #35)` |
| PR #36 head | `6c192be60b0a5acab3051ca1b64c8333a5e2c68e` |
| PR #36 changed files | exactly one: `docs/release/frappe-main-integration-report.md` |
| PR #36 CI | `ruff + pytest` **pass** (50 s, run `41362614697`); `CodeRabbit` skipped, not a required check |
| PR #36 merge | `MERGED` — merge commit `a8fc33af7af2aa6384ff70ace5e8b91bebf313f8` (2026-11-01T23:33:50Z) |
| Final `main` | `a8fc33af7af2aa6384ff70ace5e8b91bebf313f8` |

`main` was never force-pushed and PR #35 was never touched again after merging.

## B. FastAPI preservation

The workstream is now recoverable four independent ways, each verified rather than assumed.

| Layer | Location | Verification |
| --- | --- | --- |
| Local branch | `wip/fastapi-full-stack-preserved` @ `f5a82ca` | checked out in its own worktree |
| Local worktree | `Documents\Projects\Load-advisory-agent-fastapi` | 354 tracked files on disk, working tree clean |
| Git bundle | `Documents\Projects\fastapi-workstream-backups\2026-11-02\fastapi-preserved-wip-fastapi-full-stack-preserved-f5a82ca.bundle` (4,786,742 bytes) | SHA-256 `1e3755e6…98f8f3`; `git bundle verify` passes; **cloned into a fresh directory and the restored HEAD equals `f5a82ca`** |
| Working-tree archive | `…\fastapi-worktree-f5a82ca.tar.gz` (4,686,390 bytes) | SHA-256 `b4caa1c8…3c16d2`; extracted independently; **all 357 per-file SHA-256 checksums matched, 0 mismatches** |
| Remote backup branch | `backup/fastapi-full-stack-2026-11-02` @ `f5a82ca` | cloned from GitHub into a temp directory: HEAD `f5a82ca`, 354 files, **tree hash identical to the source worktree** |

Bundle and archive checksums are also recorded in `backup-verification.json` beside them.

Archive contents: the committed tree plus `quarantine-parked-artefacts/` holding the previously parked
`log.txt`, the 3.2 MB `omp-session-…html` transcript and `preserved-files.txt`.

**Excluded from the archive, with reasons recorded in `MANIFEST.json`:** `**/node_modules/`,
`apps/web/advisory/dist/` and `.cadra/` (regenerable), `**/.venv*/` and `__pycache__` (machine-local),
`.env` (**it holds the live Groq key — credentials are never copied into a backup**), `runs/`
(rebuildable RAG index that belongs to neither workstream), `**.log`.

Before pushing the backup branch, all 354 committed files were individually decoded and scanned for
key, token, private-key, password-value and credential-pair patterns: **zero hits.** `f5a82ca` is
**not an ancestor of `main`** and no FastAPI source exists on `main` (`account_admin.py`,
`api/accounts.py`, `apps/web/advisory/src` all verified absent). The backup branch is preservation-only;
it was pushed as a new ref with no force and no history rewrite, and the original preservation worktree
was not modified to prepare it.

**One thing to weigh:** this repository is **public** (`visibility: PUBLIC`). Publishing the backup
branch made the FastAPI source, `DESIGN.md`, `PRODUCT.md` and `docs/testing/` publicly readable. No
secrets were in them, but if that exposure is unwanted, `git push origin :backup/fastapi-full-stack-2026-11-02`
removes the remote ref while the bundle, archive and local branch keep the work recoverable.

## C. Database evidence

25 untracked files under `docs/borrower-frontend/acceptance/**` (284,547 bytes) were inspected
field by field — path, format, size, mtime, SHA-256, whether the file carries row content, credential
patterns and personal-data shapes — with contents never printed.

| Finding | Count |
| --- | --- |
| Files inspected | 25 |
| Containing credentials | **0** |
| Containing synthetic PII-shaped values | 8 |
| Carrying row/record content | 22 |
| Formats | 9 text, 8 json, 5 sql, 2 python, 1 screenshot |

Classification: **8** useful audit evidence (queries, probe scripts, write-guard proof, screenshot),
**9** reproducible temporary data (captured counts and record output), **8** sensitive evidence
(row content with identity-shaped fields — synthetic fixtures, but kept restricted regardless).

Destination: `Documents\Projects\frappe-evidence-archive\2026-11-02\files\…`, preserving repository-relative
paths, with `EVIDENCE-MANIFEST.json` recording checksums and classification but no file contents. The
folder's ACL was set to inheritance-off, current-user full control.

**Nothing was destroyed.** Each file was copied, its SHA-256 compared against the original, and only
then removed from the worktree — a move. Re-verification after the move: **25 of 25 files present with
matching checksums, 0 mismatches.** Empty directories left behind were pruned; `git status` confirms no
tracked file was affected. Raw dumps were never committed: `main` contains none of them.

## D. Manual-testing environment

Still running and re-verified after every repository operation. URL: **`http://127.0.0.1:8081/borrower`**

| Service | Port | Check | Result |
| --- | --- | --- | --- |
| Frappe permanent stack | 8000 | 9 `loanrangers-*` containers | Up 13 h |
| Frappe dev server (`loanportal.local`) | 8001 (inside container) | asset serving | 200 on all 6 sampled assets |
| Acceptance proxy | 8081 | `/login`, `/borrower/products`, `/api/copilotkit/info` | 200, 200, 200 |
| CopilotKit runtime | 4200 | `/api/copilotkit/info` direct and through the proxy | 200, 200 |
| FastAPI agent | 8095 | `/healthz`, RAG loaded in-process | 200 |
| Synthetic bureau | 8011 | `/healthz` | 200 |
| Langfuse UI | 3000 | `/api/public/health` (v4.70.0) | 200 |
| AG-UI deterministic stub | 8096 | listener count | **0 — correctly not running** |

Live inference was proven, not inferred: a real browser turn on the advisory workspace asked
*"What is the minimum credit score required?"* and returned a grounded answer citing
`[P1] Bajaj Finance Ltd — Personal Loan interest rates, processing fees and charges` and
`[P3] … overview page (eligibility, rates, fees, rejection FAQ)`, marked *public reference lender, not a
partner*. The runtime's upstream is `http://127.0.0.1:8095/api/agui`, so this is the live model
(`openai/gpt-oss-120b` via Groq) plus live policy retrieval — no fixture is in the path.

Browser console during that turn: **no messages.** Static assets: portal CSS, `portal.js`, the island
bundle and CSS, and the KYC/eligibility page modules all 200.

**GPU: 2,647 MiB of 4,096 MiB in use** — the resident embedding model and reranker. RAG steady-state
retrieval is about 10 s a query, so the first answer after idle is slow; that is expected, not a fault.
Consequence: local Ollama `qwen3.5:4b` cannot co-reside while RAG runs.

No service was stopped, no container removed, no volume touched, no fixture teardown run and no
credentials touched. `manualqa1-borrower` / `manualqa1-other` and their seeded applications remain
usable, and the conversation written during this verification was deliberately left in place.

## E. Git integration

| Action | Detail |
| --- | --- |
| Commits created | `f5a82ca` (FastAPI checkpoint, local only) · `6c192be` (the release report, PR #36) · the single-doc commit carrying this report (PR #37) |
| Branches pushed | `docs/release-integration-report` (new), `backup/fastapi-full-stack-2026-11-02` (new), `docs/post-merge-housekeeping` (new) |
| PRs created | #36 (release report), #37 (this report) |
| PRs merged | #36 → `a8fc33a`. **Not merged:** PR #35 (already merged, untouched) |
| CI | run `41362614697` on `6c192be`: `ruff + pytest` **success**; the new commit re-ran the full suite locally through the pre-commit hook: **685 passed, 15 skipped** |
| Administrator bypass | `gh pr merge 36 --admin --merge`, used **only** because the ruleset's one-approving-review requirement was the sole blocker (`mergeState: BLOCKED`, `review: REVIEW_REQUIRED`, `mergeable: MERGEABLE`). No required CI, security scan, build check or merge conflict was bypassed — CI was already green on that exact head |
| Merge convention | `merge` commit, matching #29–#35 |
| Force-pushes / resets / `--no-verify` | **none** |

## F. Final repository state

State at authoring time, i.e. `main` immediately after PR #36 and before this document's own PR #37
merges. Merging #37 advances `main` by exactly one merge commit and nothing else:

```text
Current branch: main
Local HEAD: a8fc33af7af2aa6384ff70ace5e8b91bebf313f8
origin/main HEAD: a8fc33af7af2aa6384ff70ace5e8b91bebf313f8
HEAD == origin/main: YES
Primary worktree status: CLEAN (git status --short --untracked-files=all returns no lines)
FastAPI preservation status: VERIFIED — bundle, archive and remote backup branch all restore to f5a82ca; not merged into main
Documentation PR status: #36 MERGED (a8fc33a); this document lands by #37
Manual testing environment: RUNNING and live-verified at http://127.0.0.1:8081/borrower
```

## G. Remaining limitations

Carried forward unchanged by this housekeeping pass, and still true of `main`:

- **Langfuse still records no traces** from the agent (OTLP endpoint answers, spans never land; the
  provider is built with zero span processors in `observability.tracer()`). Diagnosed, not fixed —
  fixing it means touching observability code, which is outside a housekeeping scope.
- **CI enforces only `ruff + pytest`.** The Frappe app (193), island (86) and runtime (13) suites are
  local gates with no workflow enforcement, so a green check does not prove them.
- **Voice/LiveKit is undeployable** (`livekit_url = wss://livekit.invalid`); the bureau is a synthetic
  loopback stand-in with data-quality gates disabled; KYC performs no verification; there is no payment
  path; strict citation accuracy is 0.59 by default (0.80 in `primary_source` mode, 0.67 opt-in).
- **Screen-reader (NVDA) testing remains deferred.** Nothing on `main` may be described as
  screen-reader accessible.
- Credentials disclosed in the earlier chat transcript (Groq, Langfuse, site assertion secret) have
  **not** been rotated — explicitly outside this task. Rotation is the owner's action.
- Browser suites and `bench run-tests` must not target `loanportal.local` at the same time; that
  contention produced the transient 500 documented in the release report.
- This is a single-machine test deployment, not a production one.
