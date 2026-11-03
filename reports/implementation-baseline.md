# Implementation Baseline — Phase 0

Phase: **0 — Establish a safe baseline** of the approved roadmap (`Loan Advisory Agent — Implementation Roadmap and Coding-Agent Prompts`).
Date: 2026-11-03 (IST). Executed **read-only**: no file in the repository was modified, no branch created, no commit/stash/checkout, no service restarted, no index touched, no external write. This file is the only artefact produced.

Roadmap decisions taken as given: bureau is a separate upstream service never called by the agent · lender identity fully synthetic · old lender corpus and generated index are **deleted**, then rebuilt selectively · PR #38 deferred · System 1 model work out of scope.

---

## 1. Baseline identity

| Item | Value | Verified by |
|---|---|---|
| Repository (origin) | `https://github.com/Narendarcodes/Load-Advisory-Agent.git` (public) | `git remote -v` |
| Working directory | `C:/Users/golla/Documents/Projects/Load-advisory-agent` | — |
| Branch | `main` | `git rev-parse --abbrev-ref HEAD` |
| Commit | `31cbe1922fa7901a14c407048d572abc58489c54` ("Merge pull request #40 … reproducibility-integration-report") | `git rev-parse HEAD` |
| Sync state | `main` up to date with `origin/main` | `git status` |
| Working tree | clean of tracked changes; **untracked only**: `docs/audit/agent-rag-policy-cost-audit.md`, `reports/` (this file, `rag-golden-set-audit.md`) | `git status --porcelain` |
| Stashes | none | `git stash list` |
| Pre-commit hooks | `.githooks` (native, ruff-pinned) — no Node tooling | repo convention |
| Python | 3.14.4, AMD64, Windows | `sys.version` |
| GPU | **NVIDIA GeForce GTX 1650, 4096 MiB, driver 610.91** — the roadmap's Phase 4 target is confirmed for this machine, not assumed | `nvidia-smi --query-gpu` |

**Acceptance criterion "working tree is clean before implementation": MET** for tracked content. The two untracked reports are audit artefacts and must be either committed as a docs PR or explicitly excluded before the implementation branch is cut (decision Q3 below).

## 2. Worktrees (all left untouched)

```
Load-advisory-agent                      31cbe19 [main]                       <- this baseline
Load-advisory-agent-frappe               15579b4 [feat/frappe-borrower-platform]  <- RUNNING agent source
Load-advisory-agent-fastapi              f5a82ca [wip/fastapi-full-stack-preserved] <- divergent; holds golden_v1
Load-advisory-agent-integration          12b07e4 [integration/pr-6-12]
Load-advisory-agent-pr11                 6767e04 [docs/project-docs]
Load-advisory-agent-pr12                 0ea0074 [docs/investigation-question-bank]
```

`15579b4` **is an ancestor of `main`**; `f5a82ca` is **not**.

## 3. Runtime → source mapping (what actually serves borrowers)

| Process | PID / port | Command line | Source it loads |
|---|---|---|---|
| Advisory agent | 21392 · `127.0.0.1:8095` | `.venv-embed\Scripts\python.exe run_with_env.py agent`, started 2026-11-02 19:17:38 | **`Load-advisory-agent-frappe/apps/api/src`** — forced by `run_with_env.py`, which overwrites `sys.argv` to `server --host 127.0.0.1 --port 8095` (so **no `--no-rag`, no `--offline`**: live-Frappe mode with RAG enabled) |
| CopilotKit runtime | 9928 · `127.0.0.1:4200` | `node.exe Load-advisory-agent-frappe/apps/runtime/dist/index.js` | frappe worktree `dist/` |
| Synthetic bureau | 1808 · `127.0.0.1:8011` | `C:\Python314\python.exe run_with_env.py bureau` | frappe worktree `apps/bureau/src` |
| Portal (nginx proxy) | 19180 · `127.0.0.1:8081→8080` | `loanportal-acceptance-proxy` (nginx:alpine) | Frappe app `apps/loan_advisory_portal` |
| Frappe site (isolated) | containers `loanrangers-*` :8080 | `loanrangers-frappe:16` + mariadb 11.8 + 2× redis 8.6 | docker; **not** the protected `p1loan.local` |
| Langfuse | containers :3000 | `langfuse 4.70.0` + worker + clickhouse 25.12 + postgres 17 + redis 7 + minio | `infra/langfuse/docker-compose.yml`, digests match running images |

**Critical baseline fact (correction carried forward):** the running agent is **not** divergent code. `git diff --stat main..feat/frappe-borrower-platform -- apps/api rag config decision_engine apps/voice apps/runtime` returns **empty**; the whole-tree delta is 2 markdown files. **Edits made on `main` during implementation will not be reflected in the live process until the frappe worktree is updated or the process is restarted from the new checkout** — that is the one way this baseline can silently mislead a coding agent. Every "verified at runtime" claim must therefore name the checkout it came from.

Launcher and env live outside the repo, in `%LOCALAPPDATA%\Temp\loanportal-manualqa\` (`run_with_env.py`, `runtime.json`, logs). No credential values were read or printed.

## 4. Configuration snapshot

**RAG (`config/rag.yaml`, committed):** `lender_profile: bajaj_finance` · `mode: current` · fusion `weighted_rrf, k=10, w_dense=1.0, w_bm25=0.5` · `rerank.enabled: true`, model `BAAI/bge-reranker-v2-m3`, `candidates: 50` · per-retriever `depth` default **50** · served `k=5` (`tools.py:159`).

**Agent settings (code defaults, env-overridable):** `voice_deadline_s 25`, `text_deadline_s 75`, `classify_budget_s 6`, `min_compose_s 4`, `fast_classify "voice"`, `citation_mode "labels"`, `verify_min_left_s 3`. Provider: `LLM_PROVIDER=groq`, `LLM_MODEL=openai/gpt-oss-120b`, `LLM_REASONING_EFFORT=low`, temperature 0.0, `LLM_RETRIES=3`, `LLM_TIMEOUT_S=120`. Limits: `max_inflight 8`, chat budget `60/60s`, bureau budget `10/3600s`, message ≤4,000 chars, body ≤64 KB (chat only), `recursion_limit` **unset**.

**Live process env — variable NAMES only.** Set: `LLM_PROVIDER`, `LLM_MODEL`, `LLM_REASONING_EFFORT`, `LLM_RETRIES`, `LLM_TIMEOUT_S`, `GROQ_API_KEY`, `AGENT_ASSERTION_SECRET`, `AGENT_RETRIEVER_DEVICE`, `AGENT_GPU_FRACTION` (set to empty — i.e. no VRAM cap), `AGENT_CHECKPOINT_BACKEND`, `ASSERTION_REPLAY_BACKEND`, `APP_ENV`, `AGENT_WEB_ORIGINS`, `AGENT_AGUI_URL`, `AGENT_RUNTIME_PORT`, `FRAPPE_URL`, `FRAPPE_BASE_URL`, `FRAPPE_API_KEY`, `FRAPPE_API_SECRET`, `FRAPPE_LOAN_COMPANY`, `FRAPPE_LOAN_PRODUCT`, `EVIDENCE_FRAPPE_URL`, `EVIDENCE_FRAPPE_API_KEY`, `EVIDENCE_FRAPPE_API_SECRET`, `BUREAU_BASE_URL`, `LOAN_POLICY_DIR`, `LANGFUSE_ENABLED`, `LANGFUSE_CAPTURE_CONTENT`, `LANGFUSE_BASE_URL`, `LANGFUSE_ENVIRONMENT`, `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`.
**Absent (matters for Phase 1/4):** no `ASSERTION_REPLAY_REDIS_URL` and no `AGENT_CHECKPOINT_REDIS_URL` (so replay, budgets and checkpoints run on **per-process in-memory** backends — and no Redis is published to the host), no `LENDER_PROFILE` (profile comes from `config/rag.yaml`), no `AGENT_QDRANT_DIR` (index is at `$LOAN_POLICY_DIR/qdrant_v2`), no `EMBED_MODEL` override.
Repo `.env` (not read for values) declares names including a **misspelled `OMNIROUT_API_KEY`** — a known trap if anyone switches to the OmniRoute provider.

**Dependency versions, two interpreters (this split is load-bearing):**

| Package | System `C:\Python314` | `.venv-embed` (runs the live agent) | Pinned in repo |
|---|---|---|---|
| python | 3.14.4 | 3.14.4 (`--system-site-packages`) | — |
| sentence-transformers | 3.4.1 | **6.2.0** | `>=6.1` (rag req) |
| transformers | 4.57.6 | **5.21.1** | **`==5.19.0`** ← drift |
| torch | 2.12.1+cu126 | 2.12.1+cu126 | `>=2.11` |
| langgraph | 1.2.16 | 1.2.16 (visible) | `>=1.0,<2` |
| zen-engine | 2.1.2 (dist-info in user site) | **importable as `zen`** — `zen.ZenEngine()` verified working | `zen-engine==2.1.2` |
| qdrant-client / rank-bm25 | 1.19.1 / 0.2.2 | 1.19.1 / 0.2.2 | `>=1.12` / `>=0.2.2` |
| pydantic | 2.12.5 | via user site | `>=2.0` |
| langfuse / otel-sdk | 5.0.4 / 1.45.1 | visible | `==5.0.4` / `>=1.27` |
| fastapi / starlette / uvicorn | 0.139.0 / 1.3.0 / 0.49.0 | visible | same ranges |
| redis client | 8.1.0 | visible | `>=5.0` |
| pytest / ruff | 9.1.1 / 0.17.2 | — | `>=8.0` / `>=0.17` |

Notes for implementers: the **module name is `zen`, not `zen_engine`** (`decision_orchestrator.py:10 import zen`, `:31 zen.ZenEngine()`), and it lives in the *user* site-packages (`AppData\Roaming\Python\Python314`), which the venv sees because `ENABLE_USER_SITE=True`. The system interpreter alone has `sentence-transformers 3.4.1`, which cannot load `google/embeddinggemma-2` — hence the two-interpreter arrangement. `deepeval` is **not installed anywhere**.

## 5. Corpus, index and manifest as they stand

| Item | Value |
|---|---|
| `LOAN_POLICY_DIR` (live) | `…/Load-advisory-agent/runs/policy_local` — **main** worktree, git-ignored |
| Register | `data/sources/policy_register.yaml`, `register_version: 2`, **38 entries** (25 approved · 9 approved_historical · 3 pending_review · 1 registered_not_ingested) |
| On-disk source | `src/` 37 `.raw` + 37 `.txt` + `manifest.json`; `manual/` 3 RBI PDFs; `src/review_events.json` = `[]` |
| Chunks | `chunks.jsonl` **1,557** chunks / **37** documents (2,616,696 bytes) |
| Collection | embedded Qdrant `policy_chunks_v2`, **1,557 points**, dim **768**, COSINE, **no HNSW/quantization** (`indexed_points_count=0` → brute force) |
| `index_compat.json` | embed `google/embeddinggemma-2`, query prompt `QuestionAnswering`, chunks 1557, `corpus_hash 0c64cb52a32f9da18f44d8c0113f62f44824ccfa12e2c6a65f7188cd2854af99`, created `2026-10-29T14:55:03.7Z` |
| Fingerprint check | recomputed `corpus_fingerprint(chunks.jsonl)` **equals** the sidecar hash — index and chunk set are consistent |
| Servable today | **20 documents / 669 chunks (43%)**; 17 documents / 888 chunks unreachable |
| Committed manifest | `data/sources/policy_manifest_v2.json` = **1,544 chunks, 2026-10-14** — **stale** vs the served index (10 content-hash differences) |
| File-level state | `qdrant_v2` is **exclusively OS-locked** by PID 21392 (copy of `.lock` fails `WinError 33`); index mtimes unchanged since 2026-10-29 |

**Consequence for Phase 2 (deletion):** the collection cannot be deleted, moved or rebuilt while the agent process holds the lock. Phase 2 step 4 ("remove the old Qdrant collection") **requires stopping PID 21392 first**, and the manual-QA bring-up lives outside the repo, so the stop/restart procedure needs an explicit owner instruction. Also: because deletion is chosen over archival, the three browser-fetched RBI PDFs and the 37 `.raw` files are **not reproducible by scripted fetch** (rbidocs bot challenge; `bajajfinserv.in` blocks datacenter IPs) — deleting the retained-RBI source files would make the new corpus unrebuildable. **Phase 2 must delete lender content and keep the approved RBI bytes** (decision Q2).

## 6. Services and data stores implementation could affect

| Target | Touchable by | Risk during implementation |
|---|---|---|
| `runs/policy_local/*` (chunks, src, manual, qdrant_v2) | Phase 2, 3, 4 | **OS-locked by the live process**; deletion irreversible (sources not re-fetchable by script) |
| Agent process 8095 + frappe worktree | Phase 1, 4 | code edits on `main` do not affect it until restart/re-point |
| `loanrangers-*` Frappe containers (isolated site) | Phase 1 (read-only credential) | credential rotation is a **Frappe-side** change, not repo-only |
| **Protected `p1loan.local` site + DB (:8080)** | — | **must not be touched** — out of scope for every phase |
| `loan-advisory-langfuse-*` stack | Phase 5 | `docker compose down -v` destroys traces/datasets/scores; never run it |
| Redis (Langfuse/Frappe internal) | Phase 4 (shared limits) | none is published to the host today → "Redis-backed shared limits" needs new infra, not just code |
| Evaluation datasets under `data/evaluation/` | Phase 2, 5 | 149 `bajaj_v1` + 96 `benchmark_v1` + 68 `citation_audit_v1` + 8 `synthetic_v1` + 40 `boundary_v1` + 41 `abstain_v1`; several reference old lender IDs and will break on corpus reset |
| `infra/langfuse/.env`, repo `.env`, `%TEMP%\loanportal-manualqa\runtime.json` | Phase 1 (credential removal) | hold live secrets; edits here can break the running stack |
| CI (`.github/workflows/ci.yml`: ruff + pytest on 3.14) | every phase | merges to `main` require 1 approval; the ruleset blocks on review, not CI |

## 7. Phase 1 blast radius (measured, not guessed)

**Bureau footprint inside the agent service** (`apps/api/src/loan_advisory/`): `agent/server.py:66-95` (`App.bureau_run`), `api/routes_agent.py:75-81` (route + 10/h budget), `application/bureau_intake.py` (orchestration), `infrastructure/bureau_client.py` (loopback-constrained `httpx` client), `application/lifecycle.py:144-219` (bureau gate + ZEN with the bureau-resolved score), plus `agent/tools.py` wiring, `apps/runtime/test/support/serve_agent.py`, `scripts/agent/eval_agent.py`, and portal-side `Bureau Report` DocType intake.

**Who calls `/api/bureau/run`?** Verified: **no frontend consumer exists** — grep over `main` *and* over `origin/pr38` (`.js/.ts/.tsx/.html`) finds zero calls; the portal's only bureau strings are disclaimers ("no credit bureau was contacted", "does not … run a credit bureau enquiry"). So Phase 1.1 has no known UI breakage. The callers are the route itself and eval/test scripts.

**What must NOT be deleted with the client:** the **read** path that explains a bureau outcome from the stored evidence — `facts.py:94-143` (`bureau_facts`), `facts.py:31-41` (DQ/reason code wording), `graph.py:348-354,574` (bureau review/improvement stages), `agent/settings.py:32-34` (bureau review templates in en/hi/te), and the what-if label `tools.py:134`. The target architecture explicitly allows this: the upstream service writes evidence into Frappe, the agent reads it. Removing the client and route must leave this projection intact, or borrowers lose "the bureau found no record that matches you" style explanations.

**Write paths to resolve in 1.3/1.4** (verified inventory, not speculation): `/api/bureau/run` → `sink=self.agent.tools.evidence.sink` (`server.py:84-86`) is the **only business-data write** reachable inside the agent object graph; `HandoffQueue.create` (`tools.py:199-212`) is a **local JSONL operational log** that already stores only `message_sha256` + length (no applicant text) — removing it entirely deletes the human-handoff capability, which the roadmap's own "Important distinction" note flags as a decision rather than a given; `agent_out/turns.jsonl` audit rows (hashed applicant, no message text, unbounded rotation); LangGraph Redis checkpoints (contain raw user messages and full evidence, TTL currently 0 = forever, but in-memory in the live process); Langfuse spans (metadata only under default-off content capture).

**Read-only Frappe work (1.2)** is partly present already: `frappe_adapter.py` has an explicit field list for the *list* call (`:32-33 LIST_FIELDS`) but `get()` fetches the whole doc (`:127-140`); `FrappeEvidenceSink.persist` refuses writes without `expected_application` and on ref mismatch (`evidence_store.py:55-59`). The missing pieces are a read-only *interface* (today the sink instance is handed in), a scoped credential, and type-level enforcement so `create`/`call_method` are unreachable rather than merely unused.

## 8. PR #38 — deferred, but two facts change the sequencing

| Attribute | Verified value |
|---|---|
| Title / head branch | **"Saral: borrower portal and assistant redesign (final)"** / `feat/saral-redesign` |
| State | OPEN, not draft, **MERGEABLE**, `REVIEW_REQUIRED` (ruleset wants 1 approval) |
| Size | 129 files, **+16,272 / −6,192** |
| Backend files touched | `agent/contracts.py` (+1), `agent/facts.py` (+11/−1), `agent/graph.py` (+18/−1) |
| Nature of backend change | **purely additive**: `Citation.excerpt` (≤320-char plain-text source chip) and numeric `actual_value`/`threshold_value`/`operator` on the decision card for meters. No auth, no bureau, no write path |
| Branding | "Saral" is the **product/UI brand**: `<title>… · Saral</title>`, `og:site_name Saral`, `saral-mark.svg`/`saral-wordmark.svg`/favicon set, rail and header labels, "Saral answers about one application at a time" |
| Illustrations/fonts | Open Peeps CC0 figures (licence text shipped); Space Grotesk with OFL licence file — licence-compliant as included |

**Why this matters now:** (a) PR #38 is **not frontend-only** — Phase 1 and Phase 3 will edit the same three files (`graph.py`, `facts.py`, `contracts.py`), so deferring it past Phase 5 guarantees merge conflicts that must be resolved by a human, not an agent; (b) it ships **"Saral" as the visible brand**, while Phase 3 mandates the borrower-facing lender label **"Demo Sample Lender (Synthetic)"**. Those can coexist *only* if "Saral" is unambiguously the *platform* and never the *lender* — which is exactly the risk flagged in the audit (live NBFC-ICC "Saral Finmart Corporation", HFC "Saral Home Finance", and Indian Bank's "IB Saral" personal loan). The roadmap already says internal-id-only; PR #38's `<title>`/OG strings don't claim lender status, but no automated gate currently enforces that separation.

## 9. Acceptance criteria for Phase 0 — status

| Criterion | Status |
|---|---|
| The agent can be traced to a specific source commit | **MET** — PID 21392 → `run_with_env.py` → `Load-advisory-agent-frappe` @ `15579b4`, which is an ancestor of `main` `31cbe19`; executable code identical to `main` |
| The working tree is clean before implementation | **MET** for tracked files; 2 untracked audit reports pending disposition (Q3) |
| No production or protected environment modified | **MET** — `p1loan.local` and its DB untouched; no container restarted or deleted; no Langfuse mutation; no credential read or printed; index mtimes unchanged; no git state change |
| Corpus path, collection and index metadata recorded | **MET** — §5 |
| Services/data stores that implementation could affect listed | **MET** — §6 |
| PR #38 not merged, no branch created yet | **MET** — PR #38 remains OPEN; no branch created (Q1) |

## 10. Open decisions blocking Phase 1 (all are the owner's, not the agent's)

**Q1 — Branch and where implementation happens.** Phase 0 asks for a dedicated implementation branch. Creating it changes repository state, so it is not done unilaterally. Proposed: `feat/agent-boundary-corpus-reset` from `main` @ `31cbe19`. Related and unavoidable: the live process runs from the **frappe worktree**, so Phase 1 verification against a running service requires either re-pointing that launcher to the new branch or accepting code-level + offline-test verification only. Which is intended?

**Q2 — Deletion depth in Phase 2.** "Delete the old corpus and generated index" collides with reproducibility: the retained RBI sources (3 browser-fetched PDFs + HTML extractions) cannot be re-fetched by script on this network. Options: (a) delete lender `.raw`/`.txt`/chunks + rebuild index, **keep** the approved RBI source bytes on disk and add them to a checksummed backup; (b) delete everything including RBI sources and re-fetch before re-index (needs a browser/manual step); (c) move retired sources to a git-ignored `runs/corpus_retired/` and delete only derived artefacts. Recommendation: (a).

**Q3 — Human handoff and untracked reports.** Is `HandoffQueue.create` (a local append-only log carrying **no** message text, only sha256 + length) acceptable as an operational write under "no business-data writes", or must handoff become non-persistent (losing the queue)? And should `docs/audit/agent-rag-policy-cost-audit.md` + `reports/*.md` be committed as a docs PR before the implementation branch is cut, or excluded?

Not blocking but noted for Phase 4: "Redis-backed shared limits" requires Redis that is reachable from the host — none is published today; and Phase 2/4 index work requires stopping the live agent (Q1's runtime question again).

## 11. Reproducing this baseline (read-only)

```bash
git rev-parse --abbrev-ref HEAD && git rev-parse HEAD && git status --porcelain
git worktree list && git stash list
git merge-base --is-ancestor 15579b4 HEAD && echo "live code is an ancestor of main"
git diff --stat main..feat/frappe-borrower-platform -- apps/api rag config decision_engine apps/voice apps/runtime
docker ps --format '{{.Names}} | {{.Image}} | {{.Status}}'
nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader
cat runs/policy_local/qdrant_v2/index_compat.json
.venv-embed/Scripts/python.exe -c "import zen; print(zen.ZenEngine)"     # module name is `zen`
gh pr view 38 --json title,headRefName,state,mergeable,reviewDecision,changedFiles,additions,deletions
git diff --stat main..origin/pr38 -- apps/api        # additive backend delta only
```

**Phase gate:** Phase 0 passes. Per the roadmap, **Phase 1 is the first coding task and must not start until Q1–Q3 are answered**; nothing was implemented in this phase.
