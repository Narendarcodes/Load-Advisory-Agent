# Phase 1 — Security Test Results

Date: 2026-11-03 (IST). Branch `feat/agent-boundary-corpus-reset`, commits `61d3439`…this one.
Environment: Windows 11 (10.0.26200), x64, CPython 3.14.4, ruff and pytest as pinned by
`pyproject.toml`. **Offline only** — no Docker, Redis, Frappe site, Qdrant server or Langfuse
instance was started, created or configured (owner instruction B3).

## Headline

| Point in Phase 1 | `pytest -q` | Δ passed |
|---|---|---|
| Baseline `964a0fc`, **measured** in a temporary worktree of the same tree (not quoted from the prompt) | **685 passed, 15 skipped** | — |
| After boundary A (`61d3439`) | 688 passed, 15 skipped | +3 |
| After boundary B (`bb06832`) | 702 passed, 15 skipped | +14 |
| After boundaries C/D (`9c54acf`) | 716 passed, 15 skipped | +14 |
| After boundary E (`aba862b`) | 750 passed, 15 skipped | +34 |
| After boundary F (this commit) | **761 passed, 15 skipped** | +11 |

76 net new tests, no test deleted without replacement, no test skipped, marked `xfail`, or had an
assertion weakened to reach green. Four pre-existing tests were **rewritten to assert absence instead
of behaviour** because the surface they covered was removed by design: the two `/api/bureau/run`
route tests in `tests/test_agent_guards.py`, the four `App.bureau_run` route tests in
`tests/test_bureau_entry.py`, and the three `--bureau-url` / `BUREAU_BASE_URL` tests in
`tests/test_bureau_port_config.py`. Their replacements are named in the table below.

## The eight mandatory boundary proofs

`tests/test_phase1_boundaries.py` — 11 tests (one per behaviour, plus the two parametrised locale sets):

| # | Behaviour promised | Test | Result |
|---|---|---|---|
| 1 | No evaluation can be started from the agent | `test_proof_1_the_agent_cannot_start_an_evaluation` | PASSED |
| 2 | No write to the system of record | `test_proof_2_the_agent_holds_no_writer` | PASSED |
| 3 | What-if never persists | `test_proof_3_a_what_if_changes_nothing` | PASSED |
| 4 | Another applicant's file stays unreadable | `test_proof_4_another_applicants_file_stays_unreadable` | PASSED |
| 5 | Borrower injection is refused in every locale | `test_proof_5_injection_is_refused_in_every_supported_locale` × en, hi, te, hi-Roman | PASSED ×4 |
| 6 | Injected retrieved text changes nothing | `test_proof_6_a_hostile_document_cannot_change_the_answer` | PASSED |
| 7 | The model never selects a tool | `test_proof_7_the_model_names_an_intent_and_nothing_else` | PASSED |
| 8 | A bad credential does no work | `test_proof_8_an_unauthenticated_or_forged_request_runs_nothing` | PASSED |

## Per-module detail

| Module | Tests | Status | What it pins |
|---|---:|---|---|
| `tests/test_phase1_boundaries.py` | 11 | passed | the eight proofs above, through the HTTP surface and the tool objects |
| `tests/test_agent_read_boundary.py` | 16 → 18 after Phase 1.5 | passed | guard refuses writers; offline and live graphs hold readers only; `READ_FIELDS` asserted on the returned document, against a fake that reproduces what the real endpoints do; projection covers every consumed field and names only fields the portal installer creates; evidence read works with the ingest credential absent; missing application and unreadable record both fail closed; `vars(App) == {"agent"}` |
| `tests/test_agent_write_paths.py` | 12 | passed | `simulate()` has no sink; zero writes across five intents; the writers are not imported by graph/tools; handoff and audit write failures; rotation keeps every row; `AGENT_LOG_MAX_BYTES` semantics; production refuses an endless checkpoint TTL and honours a given one |
| `tests/test_agent_dispatch_isolation.py` | 34 | passed | no tool-binding mechanism anywhere under `apps/api/src/loan_advisory`; `_after_classify`/`_after_evidence` totality; invented what-if fields refused; guards precede the model; sentinel borrower text appears in no system turn across five intents; hostile passage → abstain with the right flags; injection coverage per locale; zero false positives over the synthetic persona corpus; `unfiltered` unreachable and `pending_review` refused by both filters |
| `tests/test_bureau_entry.py` | 19 | passed | pipeline entry behaviour unchanged (validation, provider-failure mapping, persistence) **plus** route/method/flag/source absence |
| `tests/test_bureau_port_config.py` | 9 | passed | the agent has no bureau origin; `BureauClient` still refuses non-loopback origins for whoever runs the pipeline; synthetic bureau `--port` regression kept |
| `tests/test_agent_guards.py` | 8 | passed | forged identity headers inert; the removed bureau route 404s with forged **and** valid credentials; no `bureau` budget scope is ever spent; chat budget per borrower; fail-closed store |
| `tests/test_log_minimisation.py` | 5 | passed | handoff and voice-turn rows keep identifiers, hashes and timings only — the changed `HandoffQueue.create` still writes exactly the pinned seven keys |
| `tests/test_state_paths.py` | 8 passed, 3 skipped | passed | state-path precedence, 0600/0700 modes and the sink's trace directory; the 3 skips are the POSIX permission assertions, not runnable on Windows |
| Pre-existing suites (graph, api, upgrades, bureau lifecycle/replay/service/agent, rag, citations, limits, checkpoints, e2e harnesses) | remainder | passed | unchanged; the only source edits they touch are the removed `App.resolve` argument, `read_only_view()` wiring and `append_line()` rotation |

## Negative controls — the tests were shown to bite

A green suite proves nothing if the assertions pass when the protection is removed. Three mutations
were run and each was caught:

| Mutation | Effect expected | Measured |
|---|---|---|
| `runtime.build_offline_agent`: `read_only_view(store)` → raw `store`, **and** `DecisionTools.__post_init__` guard body → `pass` | the agent holds a write-capable store and nothing refuses it | **4 failed, 54 passed** across `test_agent_read_boundary`, `test_agent_write_paths`, `test_phase1_boundaries`, `test_bureau_entry` — `test_decision_tools_refuses_a_write_capable_store`, `…_evidence_source`, `test_the_offline_agent_holds_no_write_capable_object`, `test_proof_2_the_agent_holds_no_writer` |
| `runtime.build_offline_agent`: `read_only_view(store)` → raw `store` only | construction guard fires on the shipped wiring | **3 failed + 2 errors** in `test_agent_read_boundary` / `test_bureau_entry` |
| `guards.py`: `injection` pattern reverted to its pre-Phase-1 English-only form | non-English injection reaches the composer | **17 failed, 28 passed** across `test_phase1_boundaries` and `test_agent_dispatch_isolation` — every hi / te / code-mixed case |

Both mutations were reverted immediately; `git status` after each revert showed no residual change,
and the full suite was re-run green afterwards.

## Skips: 15, all pre-existing, none introduced here

| Count | Test | Reason |
|---:|---|---|
| 4 | `tests/test_p1_live.py` (lines 26, 38, 44, 54) | no live Frappe env configured |
| 4 | `tests/test_p3_live.py` (line 37 ×3, line 63) | no live Frappe env configured |
| 3 | `tests/test_state_paths.py` (lines 72, 82, 99) | POSIX permission bits, not assertable on Windows |
| 2 | `tests/test_langfuse_live.py` (lines 52, 81) | needs `LANGFUSE_LIVE=1` and a local stack |
| 1 | `tests/test_frappe_connection.py::test_live_frappe_roundtrip` | no live Frappe env configured |
| 1 | `tests/test_llm_live.py` | needs `LLM_LIVE_TEST=1` plus provider config |
| **15** | | |

No new skip was added, and no previously-skipped test was re-enabled or counted as a pass.

## What is NOT claimed

- **No live integration test was executed** *(superseded 2026-11-03: Phase 1.5 ran the live suite; two
  defects this caveat implied were found and fixed — see `reports/phase1-live-integration-results.md`)*.
  The read-only boundary, the projected Frappe GET, the
  `FrappeEvidenceReader` HTTP call, the Redis checkpoint TTL refusal and the handoff rotation are all
  proven against fakes, monkeypatched transports and in-memory stores. They have not been exercised
  against a running Frappe site or Redis.
- **The `--offline` build still decides at startup.** `runtime.decide_offline()` runs the conventional
  workflow once to create fixtures, and writes to its in-memory sink. The proofs about a *turn* hold;
  a process-start fixture generation is a different thing and is recorded as such in the inventory
  (§4.5).
- **The guard is not a sandbox.** `assert_reader` does not follow `method.__self__`, so a determined
  caller using reflection can still reach an object a reader was built from. The claim is "the shipped
  wiring is read-only and accidental re-wiring is refused at startup", which is what the mutation
  results above support.
- **No screen-reader testing.** NVDA is installed on this machine but assistive-technology verification
  was deliberately deferred (post-MVP); nothing here asserts SR behaviour.
- **No corpus or index claim changed.** Phase 1 touched no retrieval corpus, no register status and no
  ZEN threshold, so the RAG/golden-set results in `docs/audit/agent-rag-policy-cost-audit.md` still
  describe the same index.

## Reproduce

```bash
# full suite
PYTHONIOENCODING=utf-8 python -m pytest -q                     # 761 passed, 15 skipped

# the Phase 1 surface only
PYTHONIOENCODING=utf-8 python -m pytest \
  tests/test_phase1_boundaries.py tests/test_agent_read_boundary.py \
  tests/test_agent_write_paths.py tests/test_agent_dispatch_isolation.py \
  tests/test_bureau_entry.py tests/test_bureau_port_config.py \
  tests/test_agent_guards.py -q                                # 109 passed, 0 skipped

# adding the two log/state suites the boundaries also touched
PYTHONIOENCODING=utf-8 python -m pytest \
  tests/test_log_minimisation.py tests/test_state_paths.py -q   # 13 passed, 3 skipped (POSIX bits)

# lint, as the pre-commit hook runs it
python -m ruff check apps tests scripts                        # All checks passed!
```

The repository's native pre-commit hook (`git diff --cached --check` → ruff on staged Python → the
whole pytest suite) ran on every one of the five Phase 1 commits. No hook was bypassed and no failure
was suppressed.
