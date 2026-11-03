# Phase 1 — Write-Path Inventory (boundary D)

Date: 2026-11-03 (IST). Branch `feat/agent-boundary-corpus-reset`. Scope: every destination the
**advisory agent process** (`loan_advisory.agent.server` + `loan_advisory.api.app`) can write to, and
what a turn actually writes. Read-only survey of the code plus the tests added with it; nothing here is
inferred from a design document.

Reference: `docs/audit/agent-rag-policy-cost-audit.md` §11.3 (P0.1, the agent-reachable write path)
and §12.4; the corrections are recorded in that file's §0.6.

---

## 1. What a borrower turn writes today

| # | Destination | Written by | Contents | Bound / retention | Failure behaviour | Classification |
|---|---|---|---|---|---|---|
| W1 | `turns.jsonl` (`AGENT_AUDIT_LOG`, `AGENT_STATE_DIR`, default `agent_out/turns.jsonl`) | `AdvisoryAgent._audit`, `agent/graph.py:730` | `trace_id`, `request_id`, `conversation_id`, `applicant_hash` (sha256, 16 hex), channel, locale, literacy, `message_chars`, intent, action, abstained, cited document ids, evidence refs, guard flags, `handoff_ref`, node trace events, timings. **No message text, no financial values.** | active file capped by `AGENT_LOG_MAX_BYTES` (default 50 MB); at the cap the whole file is renamed `turns-<UTC stamp>.jsonl` and a new one starts | `OSError` swallowed: the answer is still returned, the row is lost | operational log |
| W2 | `handoffs.jsonl` (`AGENT_HANDOFF_LOG`, default `agent_out/handoffs.jsonl`) | `HandoffQueue.create`, `agent/tools.py:235` | `handoff_ref`, `category`, `refs` (the one application reference), `request_id`, `message_sha256`, `message_chars`, `created_at`. **No message text.** | same cap and the same rotate-don't-delete rule | `OSError` → `create()` returns `None`, stderr names the failure, the turn completes and the answer says the handoff is **pending** instead of quoting a reference that was never stored | operational escalation queue |
| W3 | LangGraph checkpoints — `InMemorySaver` (dev) or Redis (`RedisCheckpointSaver`, `agent/checkpoint.py:181-218`) | every turn, per node write | **The full `AgentState`**: raw request text, conversation `history`, the loaded Decision Evidence record (`record`), the what-if result, retrieved policy `passages`, guard flags. This is the only store that holds borrower message text in the agent process. | `AGENT_CHECKPOINT_TTL_S`. `0` = keep forever, still allowed outside production; **`APP_ENV`/`ENVIRONMENT=production` with no TTL now refuses to start** (`CheckpointUnavailable`) | construction raises before the service opens a port (`build_checkpointer()` is in the agent factory); a Redis failure during a turn surfaces as the normal 503/failure path | operational state that contains personal data — retention is the control |
| W4 | Redis budget counters (`api/limits.py:79-83`) | one `INCR` per authenticated route call | key `agent-turn:<sub>`, integer count, window TTL | TTL is the window (60 s); `reset()` clears the prefix | store unreachable → 503 fail-closed | operational counter, no payload |
| W5 | Redis assertion replay claims (`api/assertion.py:103`) | one `SET NX` per verified assertion | `jti` claim, TTL `exp + 90 s` | TTL-bound by construction | unavailable → 503 fail-closed | operational counter, no payload |
| W6 | Embedded Qdrant directory (`AGENT_QDRANT_DIR`, default `<LOAN_POLICY_DIR>/qdrant_v2`) | opened by `runtime._open_dense` at startup | the serve path **does not** call `create_collection`, `create_payload_index`, `upsert` or `delete` — those live in `DenseIndex.__init__`, i.e. the indexer (`scripts/policy/*`), not the agent | filesystem permissions on the directory | opening an embedded collection that another process holds fails at startup | the agent takes an OS-level write lock on this directory (a `lock` file appears), but writes no index content |
| W7 | Langfuse / OTel spans (`agent/observability.py`, `langfuse_config.py`) | every span and observation | ids, model, token counts, latency, retrieval counts, guard flags. Prompt and answer **content** is off unless `LANGFUSE_CAPTURE_CONTENT=1`; `LANGFUSE_ALLOW_REMOTE` is refused | project retention, configured in Langfuse — outside this repo | exporter failure is swallowed; a turn never fails because telemetry did | external telemetry, content-free by default |

Everything else the agent touches is a read: Frappe Loan Application GETs, the one evidence read
method, the policy `chunks.jsonl`, the pinned ZEN decision/policy files, `config/lender_profiles`,
`data/sources/policy_register.yaml`.

## 2. What the agent can no longer write

Removed during Phase 1, in this order:

| Path | Until | Now |
|---|---|---|
| `Loan Decision Evidence` ingest + `traces/<sha256>.json` from the agent | `POST /api/bureau/run` → `App.bureau_run` → `run_bureau_evaluation(sink=self.agent.tools.evidence.sink)` → `FrappeEvidenceSink.persist` | **Unreachable.** The route is deleted (boundary A) and `FrappeEvidenceSink` is no longer constructed in this process (boundary B). It remains in the pipeline scripts (`scripts/agent/prepare_demo.py`, `tests/e2e/seed_evidence.py`) and in `application/bureau_intake.py` for the separate bureau process. |
| `Loan Application` field writes (`custom_lifecycle_state`, native `status`) from the agent | reached through `sink.store.set_status` inside the evidence ingest path | **Unreachable**, same two boundaries. `DecisionTools` now refuses any store exposing `create`, `set_status`, `persist` or `call_method` (`application/ports.py:assert_reader`). |
| A whole Loan Application document entering the agent | `FrappeClient.get()` returned every field, including applicant name and contact details | **Projected.** `READ_FIELDS` (12 fields, `infrastructure/frappe_adapter.py`) is what the GET asks for; the projection is tested against the portal's own installer so it cannot name a field Frappe does not have. |
| `App.resolve` — an unused handle on the full `FrappeClient` | closed over the write-capable client for a route that no longer exists | **Deleted**, not narrowed. `vars(App)` is now exactly `{"agent": …}`. |
| ZEN what-if persistence | never existed; unproven | **Proven absent.** `simulate(application_ref, store, overrides, now, base)` has no sink parameter, and the tests record zero `create`/`set_status` calls and zero new evidence rows across every intent (`tests/test_agent_write_paths.py`). |

## 3. Handoff queue: classification, decided

`HandoffQueue` writes a file, so an earlier reading of the roadmap ("delete every agent write path")
would delete the human-handoff capability with it. It is **not** a business-data write and it is not
renamed to hide that it writes:

- **It is an operational escalation queue** — the borrower-facing equivalent of paging a human. Nothing
  in it changes a Loan Application or a Decision Evidence record.
- **Its one identifier is deliberate.** `refs` holds a single application reference because a handoff
  that a staff member cannot open is not a handoff. The applicant's words are not in it: only a sha256
  and a character count (`message_sha256`, `message_chars`), pinned by `tests/test_log_minimisation.py`.
- **It is now bounded and failure-tolerant.** W2 above: rotation renames instead of trimming, and a
  write that fails returns no reference, so the borrower's answer cannot advertise a queue entry that
  does not exist.
- **It has no reader.** Nothing in this repository consumes `handoffs.jsonl`; a human reads it. If a
  real ops surface is ever built, the file should become that surface's queue and this row should be
  reclassified as an integration, not left as a log.

## 4. Residual risks, stated plainly

1. **W3 is the sensitive one.** Checkpoints hold raw conversation text and the full evidence record, and
   the key is a sha256 digest of `thread_id` rather than the id itself — which hides the thread id from a
   Redis observer but is not deletion. Production now has to choose a TTL; the TTL has to be *decided*
   against the borrower's expectation of a continuing conversation, and a per-borrower erasure path
   (`delete_thread`) exists in the saver but is not wired to any request handler.
2. **W1/W2 lose rows on disk failure.** The audit row is swallowed silently by design; the handoff now at
   least says "pending". Neither writes a metric anyone alerts on. A real deployment wants the stderr
   line wired to an alert.
3. **Rotation has no deletion policy.** Rotated archives grow without bound on the host and inherit no
   retention rule. `AGENT_LOG_MAX_BYTES` bounds one active file, not the directory. This is an owner
   decision, same class as the checkpoint TTL, and is deliberately not hardcoded here.
4. **The read-only guard is structural, not a sandbox.** A bound method keeps its owner reachable
   (`method.__self__`), and `ReadOnlyFetchStore` (used for stores that ship no reader, i.e. test and eval
   stores) relies on that. The guard proves the shipped wiring is read-only and refuses accidental
   re-wiring at startup; it does not contain code that already runs in the process. Documented in
   `application/ports.py`.
5. **The offline build still decides.** `runtime.decide_offline` runs the conventional workflow
   (`process_application` → ZEN → `InMemoryEvidenceSink`) before the agent exists, so an `--offline`
   process does write to its in-memory sink. That is the fixture generator, not a turn, and it never
   reaches a Frappe credential — but it means "the agent process writes no decisions" is true of a
   *turn*, not of the *process start*.

## 5. How each row is proven

| Row | Test |
|---|---|
| W1 | `tests/test_agent_write_paths.py::test_a_failed_audit_write_still_answers`, `::test_rotation_is_configurable_and_can_be_switched_off`, `tests/test_log_minimisation.py` (row content), `tests/test_state_paths.py` (modes, precedence) |
| W2 | `::test_a_failed_handoff_write_does_not_break_the_turn`, `::test_the_handoff_log_rotates_instead_of_growing_without_bound` |
| W3 | `::test_production_refuses_a_checkpoint_store_that_never_expires`, `::test_production_keeps_a_ttl_it_was_given`, `::test_development_still_allows_an_unbounded_ttl`, existing `tests/test_checkpoint*.py` |
| W4/W5 | `tests/test_agent_guards.py` (budgets, fail-closed, shared store), `tests/test_assertion*.py` |
| W6 | `tests/test_bajaj_rag.py` (index compatibility), and the fact that the serve path constructs `DenseIndex` with `__new__` rather than `__init__` |
| W7 | `tests/test_langfuse_*.py` |
| §2 removals | `tests/test_agent_read_boundary.py`, `tests/test_agent_write_paths.py::test_no_agent_turn_writes_whatever_the_intent_is`, `::test_simulate_takes_no_sink_and_no_way_to_persist`, `tests/test_bureau_entry.py` (route absence) |
