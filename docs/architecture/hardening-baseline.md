# Hardening Baseline and Phase-Roadmap Status

Documentation only. Nothing in this file changes runtime behaviour.

## Verified baseline

Verified on 2026-10-28 against the primary checkout.

| Item | Value |
|---|---|
| Branch | `main`, tracking `origin/main` |
| HEAD | `1b5bad150c3ca82bee142ca9b87d602d214df093` |
| Divergence | `0 0` (not ahead, not behind) |
| CI | GitHub Actions workflow `CI`, run `40700897307`, conclusion `success`, `headSha` = HEAD (queried live, not quoted) |
| Tests | `python -m pytest -q` → **579 passed, 14 skipped, 2 warnings**, exit `0`, 38.80s, Python 3.14.4 (run during this phase) |
| Lint | `python -m ruff check .` → **All checks passed!**, exit `0` (run during this phase) |
| Pre-existing tree changes | `M .gitignore` (adds `.cadra/`), untracked session HTML — preserved, not part of this work |

Skipped tests are environment-gated (no live Frappe, no LiveKit, no external Qdrant corpus). Skipped is not passing.

## P0 merge chain

| Phase | PR | Merge SHA | Subject |
|---|---|---|---|
| P0a | #22 | `ba6fe57c98cc22bcb03720e2506c2995a4566245` | require session secret and validate LiveKit input |
| P0b | #23 | `ca180ad4cb00cbb543a3f9a5e1f73363b719a362` | bound in-flight requests, answer overload with 503 |
| P0c | #24 | `08c333c598b7e9210f294614d290cd6fdd66eeb2` | one state-path root with private file creation |
| P0d | #25 | `1b5bad150c3ca82bee142ca9b87d602d214df093` | minimise handoff and voice-turn logs |

Chain is linear: `ba6fe57` → `ca180ad` → `08c333c` → `1b5bad1`. P0 is merged; do not reimplement it.

## Roadmap status: UNRESOLVED

No authoritative P1–P15 roadmap (or "Phase 2F.3" document) exists in this repository or its Git history
(re-searched during this phase); an earlier audit also found none in GitHub issues or PR bodies — only
references to an "approved hardening roadmap" in the P0 PR descriptions. At least three incompatible
definitions of "P1" are in circulation:

| Source | "P1" means |
|---|---|
| `docs/prototypes/project-status.md` §G (2026-10-08) | Replace the mock Frappe source with a **live Frappe Lending instance** |
| Earlier planning referenced by the owner | **Packaging** hardening (with P2 = dependency consolidation) |
| Audit-derived provisional plan | **Documentation truth-up and baseline pinning** (with P2 = packaging) |

Because the numbering cannot be reconciled from the repository, **P2–P15 are provisional and blocked** until
the owner supplies or approves the authoritative roadmap.

Only the documentation-and-baseline work (provisional P1) has been performed. Its scope is limited to making
these documents agree with the code at HEAD.

### Blocked phases

| Phase | Blocked on |
|---|---|
| P3 (structure consolidation) | approved target layout |
| P6 (RAG rebuild safety) | owner decision on whether destructive rebuild is intended |
| P9e | roadmap definition |
| P13 (legacy removal) | deployment evidence over a stated window |
| P14 | **no task is defined anywhere; do not invent one** |
| P15 (retention/rotation) | owner-chosen retention duration per data class |

## Known residuals at this HEAD

Confirmed during the audit and still present. Each belongs to a later, approved phase; they are recorded
here so the baseline is honest, not fixed here.

| Residual | Location | Phase |
|---|---|---|
| Audit rows can carry what-if financial values via `trace` | `agent/graph.py:181`, `:365`, `:700–714` | P5 |
| Silent `MockStore` fallback when the live client fails | `infrastructure/frappe_adapter.py:110–115` | P4 |
| No installable packaging metadata; `repo_root()` walks parents | `pyproject.toml`, `decision_engine/paths.py` | P2 |
| RAG rebuild deletes the existing collection | `rag/retrieve.py:119` | P6 |
| Corpus lives outside the clone; hashes not re-verified | `rag/`, `LOAN_POLICY_DIR` | P7 |
| Voice logs bypass the shared state-path helper | `apps/voice/agent_worker.py` | P9 |
| Import-time telemetry content capture | `agent/observability.py` | P10 |
| Process-local admission and locks | `agent/server.py`, `agent/tools.py` | P11 |
| No coverage gate, install smoke test, or e2e test in CI | `.github/workflows/ci.yml` | P12 |
| Retention undefined | `docs/observability/langfuse.md` | P15 |
