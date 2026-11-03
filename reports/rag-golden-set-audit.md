# RAG Corpus and Golden Dataset — Read-Only Audit

Audited by: Qoder agent, read-only pass.
Date: 2026-11-03 (IST).
Repository inspected: `C:/Users/golla/Documents/Projects/Load-advisory-agent` (origin `https://github.com/Narendarcodes/Load-Advisory-Agent`).
Scope: audit only. No file in the repository was created, modified, or deleted by this audit except this report. No index was rebuilt, no dataset was published, no LLM answer was generated, no evaluation was run.

---

## 1. Executive summary

1. **The RAG pipeline is real, complete, and running.** Retrieval is hybrid (EmbeddingGemma-2 dense in an embedded Qdrant collection + BM25, fused with weighted RRF, reranked by `BAAI/bge-reranker-v2-m3`), governance-filtered before ranking. The live server on `127.0.0.1:8095` was started **with RAG enabled**, loaded the retriever in 43.3 s, and its own turn log shows four policy turns that each retrieved 5 passages and cited real Bajaj/RBI documents. This is runtime evidence, not source-code inference.
2. **The index is verified, and it matches its corpus exactly.** 1,557 chunks from 37 documents; the recomputed corpus fingerprint equals the index sidecar hash, and the Qdrant collection's `chunk_id` set is identical to `chunks.jsonl` (verified by opening a copy of the collection).
3. **But the index is not in git, and it no longer matches the committed provenance manifest.** The committed `data/sources/policy_manifest_v2.json` is a 2026-10-14 snapshot (1,544 chunks); the live index is a 2026-10-29 re-fetch (1,557 chunks, 10 changed content hashes). Drift detection is within-tree only, so `review_events.json` is empty despite the drift. The auditable provenance record does not describe the index actually built.
4. **Only 669 of the 1,557 indexed chunks (20 of 37 documents) are reachable under the shipped default profile.** 17 indexed documents are dead corpus weight for the running configuration; three adversarial `pending_review` documents are indexed but never served — and I verified they would rank #1 in one query if the filter were removed.
5. **Genuine golden datasets already exist.** `bajaj_v1` (149 rows, human + reviewed-LLM, with expected answer, expected gold documents, verbatim anchors, abstain labels, dev/test split) and `citation_audit_v1` (68 hand-authored rows with a documented "labels were written before any function was run" independence claim) are the two real golden sets. `synthetic_v1` (8 rows) is genuine but tiny and self-referential by construction. `boundary_v1` (40) and `abstain_v2` (41) are **not** golden datasets — the repo says so itself.
6. **A 15-case `golden_v1` exists but is not on `main`.** It and its harness live only on the `wip/fastapi-full-stack-preserved` branch; nothing on `main` references it. It is nevertheless published in Langfuse as dataset `loan-advisory-golden-v1`.
7. **DeepEval is definitively absent.** Zero occurrences in tracked files, zero in every requirement manifest, not installed. RAGAS appears once, as a bibliographic citation. promptfoo absent. Langfuse **is** integrated and **is** operationally usable: stack healthy, 2 datasets (29 + 15 items), 364 scores present right now.
8. **The most consequential audit finding is a policy drift the user will see.** The deterministic engine evaluates a credit-score floor of **700**; the retriever, under the shipped default profile, serves Bajaj pages stating **650**. The two surfaces never reconcile, and the policy prompt carries no engine disclaimer. Same pattern for FOIR (45% vs "50% to 60%") and income floor (₹25,000 vs ₹25,001 vs ₹40,000 for metros).
9. **The live application is not running `main`.** It runs code from the `Load-advisory-agent-frappe` worktree (`feat/frappe-borrower-platform`). Source citations in this report are `main` line numbers; the running binary is a different branch.
10. **Nothing blocks the first evaluation run except three concrete preparations** (see §12/§14).

---

## 2. Repository and environment inspected

| Item | Verified value | How |
|---|---|---|
| Branch | `main` | `git rev-parse --abbrev-ref HEAD` |
| HEAD | `31cbe1922fa7901a14c407048d572abc58489c54` — "Merge pull request #40 … reproducibility-integration-report", 2026-11-02 19:57 +0530 | `git log -1` |
| Working tree | **clean** before and after the audit (`git status --porcelain` empty) | `git status` |
| Stashes | none | `git stash list` |
| Worktrees | 6 (below) | `git worktree list` |
| Remote | `https://github.com/Narendarcodes/Load-Advisory-Agent.git` | `git remote -v` |

Worktrees present (all left untouched):

```
Load-advisory-agent                      31cbe19 [main]
Load-advisory-agent-fastapi              f5a82ca [wip/fastapi-full-stack-preserved]
Load-advisory-agent-frappe               15579b4 [feat/frappe-borrower-platform]
Load-advisory-agent-integration          12b07e4 [integration/pr-6-12]
Load-advisory-agent-pr11                 6767e04 [docs/project-docs]
Load-advisory-agent-pr12                 0ea0074 [docs/investigation-question-bank]
```

Running services observed (read-only, `docker ps`, `netstat`, `Win32_Process`):

- **Agent API**: PID 21392, `.venv-embed\Scripts\python.exe run_with_env.py agent`, started **2026-11-02 19:17:38**, listening `127.0.0.1:8095`.
- **Langfuse stack**: 6 containers, all `Up 2 hours`, images match `infra/langfuse/docker-compose.yml` digests byte-for-byte; web healthy on `127.0.0.1:3000`.
- Also present: an nginx acceptance proxy and the unrelated `loanrangers-*` Frappe stack.

Safety notes on what was **not** done: no branch switch, no stash/reset/clean/commit/push, no container restarted, no volume touched, `.env` files read but **never echoed** (only variable *names* and non-secret settings are reported here), the `p1loan.local` site and its database untouched, no script that writes to Langfuse executed, no LLM call made.

Scratch files created by this audit live **outside** the repository, in `C:\Users\golla\AppData\Local\Temp\rag-audit\`, and the temporary Qdrant copy used for §4 was deleted after use. The repository's index files kept their original mtimes (`storage.sqlite` 2026-10-29 20:25:03) — verified post-audit.

---

## 3. RAG architecture and execution path

Traced from an incoming question to the final answer. Module `rag/` is 4 files (`__init__.py`, `corpus.py`, `index_meta.py`, `retrieve.py`); the application side lives in `apps/api/src/loan_advisory/`.

### 3.1 Load path (process start)

`apps/api/src/loan_advisory/agent/server.py:182-184` — unless `--no-rag` is passed, `main()` calls `load_policy_tools()`; `:187`/`:192` then inject the resulting `policy_tools` + `profile` into the offline or **live** agent.

`apps/api/src/loan_advisory/agent/runtime.py:68-114`, `load_policy_tools()`:

| Concern | Actual implementation | Location |
|---|---|---|
| Corpus root | `LOAN_POLICY_DIR`, default `/root/hx/loan/policy` | `runtime.py:77` |
| Chunk source | `chunks.jsonl`, one JSON object per line | `runtime.py:63-65` |
| Fusion config + profile + mode | `config/rag.yaml`, env `LENDER_PROFILE` overrides profile | `rag/retrieve.py:298-305`, `:71-78` |
| Device | `AGENT_RETRIEVER_DEVICE`, else `cuda` if available | `runtime.py:83` |
| VRAM cap | `AGENT_GPU_FRACTION` → `torch.cuda.set_per_process_memory_fraction` | `runtime.py:84-86` |
| Embedding model | `EMBED_MODEL`, default `google/embeddinggemma-2`, bf16 | `runtime.py:87-88` |
| Query prompt | `prompt_name="QuestionAnswering"` | `runtime.py:89`, `:101` |
| Index location | `AGENT_QDRANT_DIR`, default `$LOAN_POLICY_DIR/qdrant_v2` | `runtime.py:94` |
| Open vs build | if `<dir>/collection` exists → **open + validate**; else encode all chunks and build | `runtime.py:95-99` |
| Reranker | `CrossEncoderReranker` only if `rerank.candidates` > 0 | `runtime.py:100` |
| Warm-up | one synthetic query at startup so the applicant does not pay kernel warm-up | `runtime.py:113` |
| GPU hygiene | `torch.cuda.empty_cache()` after every query | `runtime.py:103-111` |

`runtime.py:117-131` (`_open_dense`) deliberately reuses `DenseIndex`'s read path on an existing collection and calls `validate_index` **then** `validate_collection` — a mismatched index raises `IndexCompatibilityError` and the process refuses to serve rather than silently re-encoding.

### 3.2 Ingestion / chunking (offline)

`scripts/policy/fetch_sources.py` → `rag/corpus.py`. The **only** source list read by code is `data/sources/policy_register.yaml`, hardcoded at `rag/corpus.py:20`. `data/sources/policy_manifest_v2.json` is an **output** (`fetch_sources.py:114-124`), not an input; its only reader in the repo is `tests/test_bajaj_rag.py:64`.

- Ingestible statuses: `{approved, approved_historical, pending_review}` (`rag/corpus.py:22`); anything else is recorded as `skipped` and never fetched (`:154-156`).
- Loaders: `repo://` markdown (`:122-124`), HTML via BeautifulSoup with RBI table handling (`:91-108`), PDF via PyMuPDF with `[[page N]]` markers (`:68-88`), and browser-downloaded PDFs from `manual/<local_file>` (`:111-117`).
- Per-source failures are isolated and recorded as `{"status":"error","error":…}` and the run continues (`:158-163`). A scripted fetch of `rbidocs` returns a bot-challenge page and raises (`:133-134`).
- Chunking: `chunk_document(doc_meta, body, max_words=180)` at `rag/corpus.py:180` — section-aware; a new chunk starts at each top-level numbered paragraph or markdown heading, long sections split at block boundaries; `page_start`/`page_end` recorded from the page markers; `chunk_id` = `<document_id>#<i:03d>`; each chunk stores `chunk_sha256` plus register metadata.
- Corpus change vs the previous **in-tree** manifest appends a review event and never changes `approval_status` (`:169-171`).

### 3.3 Retrieval (per request)

`apps/api/src/loan_advisory/agent/graph.py:388-401`, `retrieve_policy`:
1. `self.policy is None` → `{"passages": [], "retrieval": {"error": "policy retrieval not configured"}}` (`:390-391`).
2. Query rewrite: if the message is under 6 words and there is history, the last user turn is prepended (`:394-395`).
3. `historical=bool(TEMPORAL.search(message))` selects the historical filter (`:397`).
4. Any exception → empty passages + error metadata, i.e. **fail-safe to abstention, never a guess** (`:398-399`).

`apps/api/src/loan_advisory/agent/tools.py:156-184`, `PolicyTools.search` (`k=5` default, `:159`), serialized under `_RETRIEVER_LOCK` (`:166`). Inside, `HybridRetriever.search` (`rag/retrieve.py:279-295`): dense top-`depth` + BM25 top-`depth` → `weighted_rrf` → optional cross-encoder rerank of the top `rerank_candidates` → slice to `k`.

**Top-K and tuning actually configured** (`config/rag.yaml`): `lender_profile: bajaj_finance`, `mode: current`, `fusion.method: weighted_rrf`, `fusion.k: 10`, `w_dense: 1.0`, `w_bm25: 0.5`, `rerank.enabled: true`, `rerank.model: BAAI/bge-reranker-v2-m3`, `rerank.candidates: 50`; `HybridConfig.depth` stays at its default **50 per retriever** (`rag/retrieve.py:268`) and the final served `k` is **5** (`tools.py:159`).

**Governance filters**, applied *before* ranking in both retrievers:
- `RetrievalFilter.allows` (`rag/retrieve.py:55-68`) and the mirrored Qdrant filter (`:151-160`): `mode` allow-set (`:28-29`), other lenders excluded under any lender profile (`:58-61`, `NO_LENDER = "none"` at `:34` because Qdrant cannot match null), `applies_to_entity` (`:62-65`), source-type allow-list (`:66-67`).
- Lender profiles (`config/lender_profiles/*.yaml`) are retrieval-authorization configs, **not** corpus and **not** rule files: none contains a numeric threshold.

**Metadata stored per chunk** — verified present on all 1,557 index points: `chunk_id, document_id, approval_status, effective_from, effective_to, jurisdiction, document_type, section, source_type, page_start, page_end` as Qdrant payload (`rag/retrieve.py:109-110`), plus `lender_id`, `applies_to_entity`; and in `chunks.jsonl` also `title, publisher, authority, product, reference, publication_date, superseded_by, supersedes, lender_relationship, source_url, chunk_sha256, text`.

**Reranking**: implemented (`rag/retrieve.py:248-260`) and **enabled** in the shipped config — see §6, where I confirm it is also enabled in the running process.

### 3.4 Context assembly, answering, citations

`graph.py:451-495`, `_compose_policy`:
- Each passage is rendered `[P#][ [historical] if approved_historical ] title — section` + `text[:1800]`, then `Question: <message>` (`:454-456`).
- System prompt chosen by `AGENT_CITATION_MODE` (`P.POLICY` vs `P.POLICY_SPANS`), with `ONE_SOURCE_RULE` spliced in for `one_source*` modes (`:457-461`).
- Zero passages → deterministic `policy_abstain` template, **before** any LLM call (`graph.py:408-410`); an LLM-emitted `abstain` or an empty answer also falls back to the template (`:487`).
- Citation verification is post-hoc and mode-dependent: `verify_citations` (deterministic lexical support) or `_llm_verify_citations` (`:497-510`), with `MIN_SUPPORT/REL_SUPPORT/SPAN_MIN_COVER` env-tunable (`citations.py:38-40`).
- `citation_for()` (`tools.py:187-195`) builds the citation object: `document_id, title, section, page, source_url, approval_status, publisher, relationship, applies_to_entity` — so page and URL traceability is preserved into the response.
- The seven modes are documented at `citations.py:3-18`; conflict handling keeps both sources when cited passages disagree (`citations.py:139-159`, `:172-185`).

**Fallbacks, enumerated**: retriever not configured → abstain; retrieval raises → abstain; deadline before compose → template (`graph.py:411-413`); unknown citation label → `unknown_citation_label` guard; LLM error → `policy_busy` template (`graph.py:689`).

### 3.5 RAG enable/disable, and dev vs deployment differences

- The only switch is `--no-rag` on the server (`server.py:104`) plus `LOAN_POLICY_DIR`/`AGENT_QDRANT_DIR`/`EMBED_MODEL`/`AGENT_RETRIEVER_DEVICE`/`AGENT_GPU_FRACTION`. `rag/` itself reads no enable flag.
- There is **no deployment manifest for the agent in this repository**. `infra/` contains only `frappe/`, `langfuse/`, `proxy/nginx.conf.template`, `voice/`. The documented production-shaped environment is a GPU container with `/root/hx/loan/policy` (`README.md:166-167`) driven by `scripts/policy/rag_run.sh` / `rag_run_bajaj.sh`, which install `transformers==5.19.0` and run the benchmark scripts.
- Local reality differs from all of that: `LOAN_POLICY_DIR` is `runs/policy_local` in this machine's `.env`; the interpreter is `.venv-embed` with **`transformers 5.21.1` / `sentence-transformers 6.2.0`**, whereas `requirements-rag.txt` pins `transformers==5.19.0` (first release with `embedding_gemma2`) and `sentence-transformers>=6.1`. Version drift is therefore live and unguarded.
- The committed benchmark artifacts record `torch 2.11.0+gitd0c8b1f / transformers 5.19.0 / sentence-transformers 6.1.0` on `cuda` (`data/evaluation/rag/bajaj_v1/results/meta.json.gz`), so local numbers are not guaranteed to match committed numbers.

---

## 4. Complete source-document inventory

Register: `data/sources/policy_register.yaml`, `register_version: 2`, **38 entries**. Semantics are defined by the file's own header (`:1-14`): `approval_status` ∈ `approved | approved_historical | pending_review | registered_not_ingested`; `source_type` ∈ `regulator | regulator_faq | lender_policy | lender_terms | lender_web_page | lender_education | synthetic | untrusted_test | statute`; `lender_id: BFL` is explicitly **a public reference lender, not a partner**; `local_file` marks PDFs that had to be fetched through a browser. `reviewed_by` is `"Verified 2026-10-14 by Hark (automated) - needs human sign-off"` (`:15-16`).

Counts measured: **approved 25 · approved_historical 9 · pending_review 3 · registered_not_ingested 1**; regulator 13, lender 18 (BFL-labelled), public comparison pages 2, synthetic 1, untrusted_test 2, statute 1, consumer-education 1.

All four verification levels are shown separately, because they are not the same claim:

| # | Document ID | Type / source_type | Authority | Version / date | Approval | Intended | Ingested (manifest) | In live index (chunks) | Served under default profile |
|---|---|---|---|---|---|---|---|---|---|
| 1 | RBI-DLD-2025 | master_direction | RBI | 2025-05-08 → eff_to 2025-11-28 (withdrawn) | approved_historical | yes | fetched | 56 | no (historical only) |
| 2 | RBI-KFS-2024 | circular | RBI | 2024-04-15 | approved_historical | yes | fetched | 15 | no |
| 3 | RBI-PENAL-2023 | circular | RBI | 2023-08-18 | approved_historical | yes | fetched | 32 | no |
| 4 | RBI-CIC-CS-2023 | circular | RBI | 2023-10-26 | approved | yes | fetched | 8 | **yes** |
| 5 | RBI-CIC-COMP-2023 | circular | RBI | 2023-10-26 | approved | yes | fetched | 10 | **yes** |
| 6 | RBI-IOS-2021 | scheme | RBI | 2021-11-12 → 2026-06-30 | approved_historical | yes | fetched (cover HTML only) | 6 | no |
| 7 | RBI-IOS-2026-FAQ | faq | RBI consumer ed. | 2026-07-01 | approved | yes | fetched | 40 | **yes** |
| 8 | RBI-FPC-2007 | circular | RBI (bank) | 2007-03-06 → 2025-11-28 | approved_historical | yes | fetched (thin: 2,376 chars) | 6 | no |
| 9 | RBI-MC-CS-2015 | master_circular | RBI (bank) | 2015-07-01 → 2016-07-01 | approved_historical | yes | fetched | 267 | no |
| 10 | RBI-RBC-CB-2025 | master_direction, `local_file` | RBI (bank) | "Updated as on Oct 1 2026" | approved | yes | fetched (browser PDF) | 389 | bank profiles only → **no** under `bajaj_finance` (entity filter) |
| 11 | RBI-RBC-NBFC-2025 | master_direction, `local_file` | RBI (nbfc) | "Updated as on Jul 1 2026" | approved | yes | fetched (browser PDF) | 130 | **yes** |
| 12 | HDFC-PL-ELIG | eligibility_page | HDFC (public page) | none ("as retrieved") | approved | yes | fetched | 5 | no (other lender) |
| 13 | ICICI-PL-ELIG | eligibility_page | ICICI (public page) | none | approved | yes | fetched | 13 | no (other lender) |
| 14 | SYN-POLICY-V1 | synthetic_policy (`repo://`) | team | 2026-10-08 | approved | yes | fetched | 6 | synthetic profile only → **no** |
| 15 | SYN-INJECT-001 | adversarial_test (`repo://`) | team | 2026-10-14 | pending_review | yes (as distractor) | fetched | 1 | **never** |
| 16 | IN-DPDP-2023 | statute | Govt of India | 2023 | **registered_not_ingested** | **no** — flagged "needs legal review, not RAG" | **skipped** | **0** | no |
| 17 | RBI-NBFC-CF-2025 | master_direction | RBI (nbfc) | "updated Jul 15 2026" | approved | yes | fetched | 71 | **yes** |
| 18 | RBI-IOS-2026 | scheme, `local_file` | RBI | 2026-01-16, in force 2026-07-01 | approved | yes | fetched (browser PDF) | 59 | **yes** |
| 19 | RBI-FPC-NBFC-2015 | master_circular | RBI (nbfc) | 2015-07-01 → 2025-11-28 | approved_historical | yes | fetched | 22 | no |
| 20 | BFL-PL-OVERVIEW | product_page | Bajaj | "as retrieved" | approved | yes | fetched | 30 | **yes** |
| 21 | BFL-PL-ELIG-DOCS | eligibility_page | Bajaj | none | approved | yes | fetched | 14 | **yes** |
| 22 | BFL-PL-RATES-FEES | fees_and_charges | Bajaj | none | approved | yes | fetched | 26 | **yes** |
| 23 | BFL-PL-SALARIED | eligibility_page | Bajaj | none | approved | yes | fetched | 14 | **yes** |
| 24 | BFL-FAQ-REJECTION | faq (marker-sliced) | Bajaj | none | approved | yes | fetched | 2 | **yes** |
| 25 | BFL-FPC-2026 | fair_practices_code PDF | Bajaj | Ver 7.1, 2026-01 | approved | yes | fetched | 33 | **yes** |
| 26 | BFL-FPC-2023 | fair_practices_code | Bajaj | Ver 6.0, 2023-10 → 2026-01 | approved_historical | yes | fetched | 31 | no |
| 27 | BFL-IRP-2026 | interest_rate_policy PDF | Bajaj | 2026-03 | approved | yes | fetched | 12 | **yes** |
| 28 | BFL-IRP-2023 | interest_rate_policy | Bajaj | 2023-04 → 2026-03 | approved_historical | yes | fetched | 10 | no |
| 29 | BFL-GRIEVANCE | grievance page | Bajaj | none | approved | yes | fetched | 7 | **yes** |
| 30 | BFL-CITIZENS-CHARTER-2025 | citizens_charter PDF | Bajaj | Ver 7.0, 2025-05 | approved | yes | fetched (v8.0 was 404) | 18 | **yes** |
| 31 | BFL-PRIVACY | privacy_policy | Bajaj | none | approved | yes | fetched | 34 | **yes** |
| 32 | BFL-DL-PARTNERS | digital_lending_disclosure | Bajaj | none | approved | yes | fetched | 43 | **yes** |
| 33 | BFL-PL-DETAILED-TNC | loan_terms PDF | Bajaj | reg. 2019-06-21, "updated as on ____" **blank** | approved | yes | fetched | 80 | **yes** |
| 34 | BFL-APP-TNC-2023 | application_terms PDF | Bajaj | 2023-06-08 (post-2023 currency unverified) | approved | yes | fetched | 21 | **yes** |
| 35 | BFL-KYC-TNC | kyc_terms | Bajaj | none | approved | yes | fetched | 17 | **yes** |
| 36 | BFL-KYC-PMLA-POLICY | kyc_policy PDF | Bajaj | **undated**, staging URL | pending_review | yes | fetched | 11 | **never** |
| 37 | BFL-INSIGHT-REJECTION | education_article | Bajaj | none | approved | yes | fetched | 15 | **no** — `lender_education` is not in the profile's allow-list |
| 38 | SYN-INJECT-002 | test_fixture (`repo://`, borrows `lender_id: BFL`) | team | none | pending_review | yes (as distractor) | fetched | 3 | **never** |

**Totals verified**: 38 registered · 37 ingested · 1 skipped · 1,557 chunks · 20 documents servable under the shipped profile · 669 of 1,557 chunks servable.

Source-document files are **not in git**: `git ls-files` shows 0 `.pdf`, 0 `.docx`, and every `.html`/`.txt` hit is a portal template, a Frappe manifest, a font licence, a requirements file, or an acceptance log. `docs/policy/` holds 2 prose notes + 3 evaluation reports, no policy text. Real document bytes exist only in the git-ignored tree `runs/policy_local/{src,manual}/` — 37 `.raw` + 37 `.txt` pairs, `manifest.json`, `review_events.json` (`[]`), and `manual/` with exactly the 3 `local_file` PDFs.

### Missing / outdated / duplicated / unversioned / provenance gaps

- **Missing from the index by design**: `IN-DPDP-2023` (only skipped entry).
- **Thin extractions**: `RBI-IOS-2021` (cover notification only — the scheme PDF was never fetched), `RBI-FPC-2007` (2,376 chars).
- **Unversioned but `approved` and citable**: all 11 lender/bank web pages (`BFL-PL-OVERVIEW`, `BFL-PL-ELIG-DOCS`, `BFL-PL-RATES-FEES`, `BFL-PL-SALARIED`, `BFL-FAQ-REJECTION`, `BFL-GRIEVANCE`, `BFL-PRIVACY`, `BFL-DL-PARTNERS`, `BFL-KYC-TNC`, `HDFC-PL-ELIG`, `ICICI-PL-ELIG`) — `publication_date: null`, "values change without notice" acknowledged only in a note; `BFL-PL-DETAILED-TNC` (2019, blank update date, 80 chunks); `BFL-APP-TNC-2023` (currency after 2023 unverified).
- **Duplicated / conflicting**: BFL FPC v7 exists at two URLs with different bytes under the same version label (one registered); the register's own conflict note claims a 4.13% vs 3.93%/30% fee conflict, and I verified **no "3.93" fee and no "30%" rate exists anywhere in the ingested corpus** — the documented conflict cannot be substantiated from the index; KFS-2024 + PENAL-2023 text now also sits inside `RBI-RBC-NBFC-2025`, and DLD-2025 content inside `RBI-NBFC-CF-2025`, kept as historical alongside the current text.
- **Mis-scoped**: `BFL-FAQ-REJECTION` is sliced from the EMI Network Card / consumer-durables FAQ, not the personal-loan policy section (2 chunks).
- **Stale cross-references**: BFL FPC v7.1 names the superseded "Ombudsman Scheme for NBFCs 2018"; Citizen's Charter v7.0 names RB-IOS 2021 while RB-IOS 2026 is in force.
- **Provenance**: `reviewed_by` is automated with "needs human sign-off"; two repeals (KFS-2024, PENAL-2023) are self-labelled *inferred*; the CIC consolidation question is marked `UNRESOLVED`.
- **Provenance drift**: committed `policy_manifest_v2.json` (1,544 chunks, 2026-10-14) ≠ live index (1,557, 2026-10-29) for 10 documents' `content_hash`, 2 documents' chunk counts (`BFL-PL-OVERVIEW` 26→30, `BFL-PL-RATES-FEES` 17→26), and `RBI-RBC-NBFC-2025`'s `raw_sha256` no longer matches the manual PDF on disk. `review_events.json` is empty because drift detection compares within-tree manifests only (`rag/corpus.py:169`).
- **Dead corpus weight**: HDFC + ICICI + `RBI-RBC-CB-2025` (659 chunks combined) are indexed but unreachable under the shipped `bajaj_finance` profile.

---

## 5. Vector index status — VERIFIED (with one structural caveat)

Method: the live directory is exclusively locked by the running server (see §6), so the collection was **copied** to a scratch directory and inspected there. `storage.sqlite` was never opened against the live tree. Nothing in the repository was written.

Verified facts:

| Property | Verified value | Evidence |
|---|---|---|
| Location | `runs/policy_local/qdrant_v2` (embedded, local mode) | `AGENT_QDRANT_DIR` unset → default at `runtime.py:94`; `runtime.json` sets `LOAN_POLICY_DIR` to the same path |
| Engine / access | Qdrant embedded (`QdrantClient(path=…)`) — **no Qdrant server process exists** | copy opened successfully; no qdrant container in `docker ps` |
| Collection name | `policy_chunks_v2` | `rag/retrieve.py:123`; `index_compat.json` |
| Indexed points | **1,557** | `client.count()` and `get_collection().points_count`, both 1557 |
| Distinct documents | **37** | chunk-id set grouped by `document_id` |
| Vector config | `size=768`, `distance=Cosine`, `hnsw_config=None`, `quantization_config=None`, `indexed_points_count=0`, `status=green` | `get_collection()` |
| Embedding model | `google/embeddinggemma-2`, bf16, query prompt `QuestionAnswering` | `index_compat.json`, `runtime.py:87-89` |
| Sidecar | `index_compat.json`: `chunks: 1557`, `corpus_hash: 0c64cb52a32f…af99`, `created_at: 2026-10-29T14:55:03.72Z` | file read directly |
| **Index ↔ corpus match** | `corpus_fingerprint(chunks.jsonl)` recomputed = `0c64cb52a32f9da18f44d8c0113f62f44824ccfa12e2c6a65f7188cd2854af99` → **exact match** | `rag/index_meta.py:22-27` |
| **Index ↔ chunk-id set** | `collection_chunk_ids()` == chunks.jsonl ids → **True**, 0 missing, 0 extra | `rag/index_meta.py:106-114` |
| `validate_collection(dimension=768, COSINE, ids)` | **PASSED** | `rag/index_meta.py:116-139` |
| Payload on a point (id 0) | `chunk_id RBI-DLD-2025#000, document_id, approval_status approved_historical, effective_from 2025-05-08, effective_to 2025-11-28, jurisdiction IN, document_type master_direction, section preamble, source_type regulator, page_start None, lender_id "none", applies_to_entity ["all"]` | `client.retrieve()` |
| Filename / page retention | `source_url` 1557/1557 · `title` 1557/1557 · `section` 1557/1557 · `page_start` **794/1557** (PDF-derived docs only) | `chunks.jsonl` scan |
| Copy integrity | `PRAGMA integrity_check` = `ok`; single table `points`; copy 12,833,763 B | scratch run output |
| Matches committed source register? | Register: yes (37 of 38 present, only `IN-DPDP-2023` absent — the one marked not ingestible). Committed manifest: **no** — 1,544 vs 1,557, 10 hash differences | §4 |

Caveat worth recording: `indexed_points_count = 0` and `hnsw_config = None` mean the embedded collection performs **brute-force** scoring, which is fine at 1,557 points but is not the production server shape.

### Minimal read-only retrieval inspection (no LLM, no evaluation)

Dense queries executed through the real read path (`DenseIndex.search` + the live `profile_filter(bajaj_finance, "current")`), on CPU so the running server's VRAM was untouched:

| Query | Top served result (score) | Traceable to an original document? |
|---|---|---|
| "What CIBIL score do I need for a Bajaj personal loan?" | `BFL-PL-OVERVIEW#026` (0.8782); then `BFL-PL-ELIG-DOCS#007`, `BFL-PL-RATES-FEES#007`, `BFL-PL-RATES-FEES#019` ("…require a CIBIL Score of 650 or higher"), `#018` | Yes — all carry `source_url`, `title`, `section` |
| "When can I reapply after a rejection?" | `BFL-PL-OVERVIEW#021` (0.6626), `RBI-RBC-NBFC-2025#111` (page 27), `RBI-IOS-2026-FAQ#026`, `#034`, `BFL-FAQ-REJECTION#001` — **none states a waiting period** | Yes |
| "What is the maximum personal loan tenure at Bajaj Finance?" | `BFL-PL-ELIG-DOCS#008` (0.8432) + `BFL-PL-OVERVIEW#000/#003/#001`, `BFL-PL-SALARIED#003` — the "108 months" sentence is in `BFL-PL-ELIG-DOCS` but not in the top-ranked chunk | Yes, with a ranking reservation |

Governance control test (same vectors, filter removed — `unfiltered` mode exists for evaluation only, `rag/retrieve.py:29`): for the reapplication query, **`SYN-INJECT-001#000` ranks #1 at 0.7384** and `SYN-INJECT-002#001` ranks #3, both `pending_review` adversarial fixtures; `BFL-INSIGHT-REJECTION` (lender_education) also surfaces. Under the live filter none of them is served. The filter is therefore doing real work on a corpus that would otherwise leak.

BM25-only inspection on the live corpus (no vector store, no model) reproduced the same governance behaviour and returned grounded text, e.g. `BFL-PL-OVERVIEW#024` (score 17.73): "CIBIL Score: 650 or higher", and `BFL-PL-RATES-FEES#021` (15.13): "The processing fee is up to 4.13% of the loan amount".

---

## 6. Runtime RAG activation status — VERIFIED ACTIVE

Five distinct claims, verified separately rather than conflated:

| Claim | Status | Evidence observed today |
|---|---|---|
| RAG implementation exists | **VERIFIED** | §3 |
| RAG configuration is enabled | **VERIFIED** | `config/rag.yaml` (`rerank.enabled: true`, `lender_profile: bajaj_finance`); no `--no-rag` in the live argv |
| Retriever successfully initialized | **VERIFIED** | Launcher forces `sys.argv = ["server","--host","127.0.0.1","--port","8095"]` → RAG path taken; log line `starting agent: rag=on device=cuda policy_dir=…\runs\policy_local`; `retriever loaded in 43.3s`; `loan-advisory agent on http://127.0.0.1:8095`; PID 21392 listening since 2026-11-02 19:17:38; the Qdrant `.lock` is OS-held (my copy attempt failed with `WinError 33`, and a second agent attempt failed with `Storage folder … is already accessed by another instance of Qdrant client`) |
| Actual user requests invoke retrieval | **VERIFIED** | `agent_out/turns.jsonl` written by that server (2026-11-02) contains 12 turns, 4 with `intent=policy`, each carrying a `retrieve_policy` event with `n=5, mode=current, latency_ms, top_rerank_score` |
| Retrieved context used in answer generation | **VERIFIED** | The same 4 turns: `compose_policy` LLM call with `prompt_tokens` 1,618–1,713 (vs 548–697 for `classify`), `abstained=false`, `guard_flags=[]` |
| Citations survive into the response | **VERIFIED** | Same turns cite `BFL-PL-ELIG-DOCS`, `BFL-APP-TNC-2023`, `BFL-FPC-2026`, `BFL-PL-RATES-FEES`, `BFL-PL-OVERVIEW` |

Observed retrieval latencies: **8,557 ms / 10,766 ms / 10,974 ms / 36,063 ms**. The reranker is unambiguously active (`top_rerank_score` present in every event: 0.9992, 0.0706, 0.0107, 0.6118), so the "rerank off" arrangement recorded in earlier project notes is **no longer true of the running process** — retrieval costs 8.5–36 s per policy turn on this machine, and `total_ms` was 11.3–39.3 s.

Three qualifications, stated so they are not read as more than they are:

1. **The live server runs a different branch.** `run_with_env.py` sets `REPO = C:\Users\golla\Documents\Projects\Load-advisory-agent-frappe` and puts that worktree's paths on `PYTHONPATH`; the traceback frames confirm `/Load-advisory-agent-frappe/apps/api/src/…`. So the audited runtime is `feat/frappe-borrower-platform` @ `15579b4`, while every source citation in this report is `main` @ `31cbe19`. The corpus it reads, however, is `main`'s `runs/policy_local`.
2. **It is a live-Frappe agent, not offline** (no `--offline`), pointed at `FRAPPE_URL = http://127.0.0.1:8081`, LLM `groq / openai/gpt-oss-120b`, `LANGFUSE_ENABLED=1`, `LANGFUSE_CAPTURE_CONTENT=0`. No secrets were read or printed.
3. **I did not send a request to it.** A chat request would invoke the LLM and produce an answer, which §1/§4 of the audit brief forbids. The runtime evidence above comes from the process, its lock, its logs, and its own turn log.

---

## 7. Existing golden dataset inventory

20 tracked files under `data/evaluation/`, all present on disk, none untracked or ignored.

| Dataset | Location | Records | Schema | Categories | Expected output | Ground truth | Provenance | Status |
|---|---|---|---|---|---|---|---|---|
| **bajaj_v1** | `data/evaluation/rag/bajaj_v1/benchmark.jsonl` | **149** (dev 58 / test 91) | 14 fields, zero schema variance: `qid origin category mode profile question answer seed_docs gold_anchors gold_docs expect_abstain note expand split` | 20 (grievance 27, fees 18, eligibility 15, kfs_terms 15, digital_lending 12, kyc 10, interest 8, fpc 8, rejection_reapply 7, 5 abstain families, …) | **Yes ×3**: expected answer, expected gold docs + verbatim anchors (relevance definition), expected abstention (16) | Mixed: 66 `origin:human`, 83 `origin:llm_draft_reviewed`; gold docs mechanically forced (`build_benchmark.py:158-167` — build fails if an anchor is not found in a visible chunk) | `build_benchmark.py`; 135 LLM drafts → 52 hand-dropped → 83 kept + 66 hand-written; stratified split seed `20261014` | **GENUINE golden dataset** (strongest in repo) |
| **citation_audit_v1** | `data/evaluation/agent/citation_audit_v1/cases.jsonl` | **68** | 6 keysets by `kind` (citation 29, guard 15, graph 10, governance 11, wiring 3); always `case_id kind category gold note` | 12 (direct_support, requires_abstention, wrong_lender, wrong_version, relevant_non_entailing, contradiction, multi_document, corroboration, unsupported_numeric, …) | **Yes, richest in repo**: expected supporting/required/forbidden citation sets + fixed `passages[]` + fixed expected composer output (= expected retrieval context *and* expected citation outcome) | Yes — README asserts labels were hand-authored **before** running any function and are not derived from the code under test | `README.md:3` "authored 2026-10-25 for the PR #9 review" | **GENUINE golden dataset** (deterministic, self-contained, no LLM needed) |
| **synthetic_v1** | `data/evaluation/rag/synthetic_v1/benchmark.jsonl` | **8** | 10 fields incl. `expected_chunk_ids citation_anchor expect_evidence answer_check profile mode` | 4 (rejection_reason 5, reapplication 1, missing_information 1, out_of_scope 1) | Yes — exact **chunk** ids + verbatim anchor + evidence flag | Retrieval gold mechanically derived from a repo-authored doc; `answer_check` is judged/manually applied | `README.md:7-16`; built only from `SYN-POLICY-V1.md`, which is in git | **GENUINE but tiny and synthetic**; README itself: "must not be reported as production retrieval quality" |
| **benchmark_v1** | `data/evaluation/rag/benchmark_v1.jsonl` | **96** (87 answerable, 9 abstain) | 9 fields + optional `note` (29/96) | 10 | Yes: answer, `gold_docs`, `gold_anchors`, `expect_abstain` | 29 human, 67 reviewed-LLM | `data/evaluation/rag/build_benchmark.py` | Genuine golden set, **superseded** by bajaj_v1; **no `split` field → not holdout-safe** |
| boundary_v1 | `data/evaluation/agent/boundary_v1.jsonl` | **40** | 5 fields: `id category expect message locale` (en 38 / hi 1 / te 1) | 9 refusal families | **Label only** (`refuse` 18, `refuse_or_abstain` 8, `abstain` 8, `handoff` 3, `no_compose_claims` 3) — no answer text, no citation gold | Unknown — no README, no build script, no per-row author/date | none found | **NOT a golden dataset** (behavioural pass/fail set, provenance undocumented) |
| abstain_v2 | `data/evaluation/rag/bajaj_v1/abstain_v2.jsonl` | **41** | same 14 fields | 9 abstain families | Label only; `answer=null`, `gold_docs=[]` | **No** — every row is `origin: "agent_authored"` with the note "not human-reviewed"; the repo states the fix was written **after seeing its misses** | none | **NOT a golden dataset** (hard-case probe only) |
| llm_drafts_raw | `…/bajaj_v1/llm_drafts_raw.jsonl` | 135 | 8 fields | per seed doc | draft answer + anchor | 52 later rejected by hand | `scripts/policy/draft_questions.py` (gpt-oss-120b) | **NOT gold** ("Drafts are not gold until reviewed") |
| llm_drafts_reviewed | `data/evaluation/rag/llm_drafts_reviewed.jsonl` | 67 | 9 fields | single_doc | answer + gold docs + anchors | anchor-verified, answer text still LLM-authored | feeds `benchmark_v1` | Half-built gold |
| results artifacts | `…/bajaj_v1/results/{runs.jsonl.gz,meta.json.gz,answers_slim.jsonl}` | 149 / 1 / 455 | ids, scores, judge columns | — | — | `judge_correct`/`citation_supported` come from the **same model that answered** | stage 1/3 outputs | Recorded outputs, **not inputs** |
| stats / results | `…/bajaj_v1/stats.json`, `…/synthetic_v1/results.json` | dicts | — | — | — | — | emitted by build/eval | Derived metadata / recorded output |
| synthetic_docs | `data/evaluation/rag/synthetic_docs/*.md` (3 files) | — | markdown | 4 rules + 2 adversarial | n/a | n/a | team-authored, `SYNTHETIC — NOT A REAL LENDER POLICY` | **Corpus input documents, not eval rows** (they sit under `data/evaluation/` and are easy to mistake for one) |
| **golden_v1** | `data/evaluation/agent/golden_v1/cases.jsonl` | 15 | `case_id category channel literacy question expect{abstain,required_docs,required_prefixes,forbidden_prefixes,facts(regex),forbid,action}` | policy 8, abstain 2, guard 2, decision 2, privacy 1 | Yes (regex facts + required docs + abstain flag) | no README, no reviewer field | branch-only | **NOT on `main`.** Absent from HEAD and absent from disk; exists only at `f5a82ca` (`wip/fastapi-full-stack-preserved`), confirmed not an ancestor of HEAD. Its harness `scripts/development/langfuse_eval_agent.py` is likewise branch-only, and **nothing on `main` references `golden_v1`** |

Adjacent data, classified: `data/synthetic/applicants.json`, `data/synthetic/personas/*.jsonl`, `data/synthetic/bureau/cases_120.json` and `apps/bureau/src/synthetic_bureau/fixtures.py` are **synthetic input data** for decision-personas and the bureau simulator, not evaluation datasets. `docs/data/dataset_audit.md` audits Phase-1 *training* datasets (LendingClub/UCI/Home Credit) and is not an evaluation inventory. `docs/investigation-question-bank.csv` is a question bank without expected outcomes. `data/sources/datasets.yaml` + `scripts/data/{download,normalise,audit}_datasets.py` are model-training/bureau data, disjoint from the RAG corpus.

---

## 8. Existing evaluation implementation

| Script | Dataset | Measures | Metric mechanism | Writes | Live LLM? | Live index? |
|---|---|---|---|---|---|---|
| `scripts/policy/eval_rag.py` | benchmark_v1 + `$LOAN_DATA_DIR/policy/chunks.jsonl` | bm25/dense/hybrid recall, MRR, nDCG, doc_p@1, abstention AUROC, latency, governance counts | **deterministic** (relevance = doc in `gold_docs` AND anchor in text) | `$RAG_OUT/{per_question.jsonl,report.json}` | No | No — builds an **in-memory** index ("an eval must not write or replace a policy index") |
| `scripts/policy/eval_bajaj_retrieve.py` | bajaj_v1 + `$LOAN_POLICY_DIR/chunks.jsonl` | stage 1: raw runs only, no metrics | n/a | `runs.jsonl`, `meta.json` | No | No (in-memory; `--index-dir/--replace-index` opt-in, staged swap) |
| `scripts/policy/eval_bajaj_score.py` | saved runs + lender profiles | stage 2: tune on **dev**, score **test**; recall/MRR/nDCG/cite@1, **paired bootstrap 95% CI (n=2000, seed 7)**, abstention AUROC, governance `permitted()`, latency | **deterministic post-processing** | `report.json`, `rankings.jsonl` | No | **No** → the only CPU-reproducible scorer in the repo |
| `scripts/policy/eval_bajaj_answers.py` | benchmark + rankings + chunk text | stage 3: grounded answers + citations + abstention per system | deterministic support/precision/strict **plus LLM-as-judge** (`JUDGE`, `SUPPORT`) by the same gpt-oss-120b | `answers.jsonl`, `answer_report.json` | **Yes** (vLLM :8001) | No |
| `scripts/policy/eval_synthetic_rejection.py` | synthetic_v1 | recall/MRR/coverage/governance leaks | deterministic + anchor check | stdout JSON | No | No (in-memory, repo-only docs) |
| `scripts/policy/draft_questions.py` | chunks.jsonl | **generation**, not evaluation | filter: keep only if anchor appears verbatim | drafts into `$LOAN_POLICY_DIR` | Yes | No |
| `scripts/agent/eval_agent.py` | personas + bajaj_v1 **test** + boundary_v1 | full agent sets A1–A5, B policy, C boundary | deterministic facts/ungrounded-numbers/plan-recheck + **6 LLM judge prompts**; self-judging bias stated in the file | `rows.jsonl.gz`, `turns.jsonl`, `handoffs.jsonl` | Yes | Yes |
| `scripts/agent/eval_policy_split.py` | bajaj_v1 / abstain_v2 | `retrieve` (production retriever) / `run` (graph per citation mode) / `score` | deterministic `citation_support`, `strict_citation_correct`; judge optional | `retrieval.json`, `rows.jsonl`, `report.json` | `run` yes; `retrieve`/`score` no | `retrieve` yes |
| `scripts/agent/eval_citation_audit.py` | citation_audit_v1 | 5 layers (citation, graph, guards, governance, wiring) | **100% deterministic** — `ScriptedLLM` + `FakePolicy`; `meta.deterministic: true, llm_used: false` | `--out` JSON | No | No |
| `scripts/agent/eval_citation_verify.py` | frozen answers + cached retrieval | offline A/B of citation verifiers | judge under test; deterministic reported metrics | `.json`, `.raw.jsonl` | Yes | No |
| `scripts/development/langfuse_publish_eval.py` | citation_audit_v1 | republishes the deterministic audit as a Langfuse dataset + experiment | deterministic set arithmetic | Langfuse only with `--publish` | No | No |
| `scripts/development/langfuse_check.py` | none | connectivity/auth diagnostic | none | nothing unless `--send-trace` | No | No |

Recorded results and their reproducibility:

- `docs/policy/rag_eval_v1_report.json` (benchmark_v1, 96 q, **465 chunks**, 2026-10-14): dense R@1 0.701 / MRR 0.796, hybrid 0.667/0.768, bm25 0.471/0.606; abstention AUROC 0.963; 0 governance violations. **Not reproducible** — needs a 465-chunk corpus that no longer exists.
- `docs/policy/rag_eval_bajaj_v1_report.json` (149 q, **1,544 chunks**, 2026-10-14): test-answerable R@1/MRR — bm25 0.388/0.526, dense 0.562/0.666, hybrid_rrf_equal 0.525/0.631, hybrid_weighted 0.550/0.664, **hybrid_rerank 0.750/0.843**; rerank-vs-dense MRR +0.177 [0.101, 0.253]; 0 non-permitted chunks in every final top-10; **without** filters the injection page reaches top-10 for 30/149 questions and a historical doc appears in 98 current-mode questions. **Reproducible from committed state** (`python scripts/policy/eval_bajaj_score.py --runs data/evaluation/rag/bajaj_v1/results --out …`) — CPU-only, no LLM, no corpus — and `tests/test_bajaj_rag.py:224-241` asserts it in CI.
- `docs/policy/rag_eval_bajaj_v1_answers.json` (stage 3, gpt-oss-120b, temperature 0): hybrid_rerank citation_support 0.900, citation_precision_doc 0.840, strict_citation_correct 0.675, judge answer_correct 0.950, citation_faithful 0.974, correct_abstention 1.000; adding the retrieval gate *degrades* support (an honest negative result). **Not reproducible** — needs vLLM plus the copyrighted chunk text; `answers_slim.jsonl` keeps ids and scores but no text, so the judge inputs are gone.
- `data/evaluation/rag/synthetic_v1/results.json` (2026-10-25): R@1 0.857, R@3/R@5 1.000, MRR@10 0.905, coverage@5 1.000, 0 leaks. Reproducible in principle (repo-only text); in practice version-drift-guarded (see §3.5) and rerank-off, while production reranks.

Test fixtures convertible into evaluation cases: 64 `test_*.py` files, 511 `def test_` functions, 26 entries under `tests/e2e/`. No test calls an LLM for a score — all are deterministic assertions over `ScriptedLLM`/`FakePolicy`. The highest-value conversions are `tests/test_bajaj_rag.py:137-180` (query → exact served document-id set per profile/mode), `tests/test_citations.py:15-50` and `:199-242` (18 negative-control phrasings that must **not** be flagged — the false-positive half of a confusion matrix), `tests/test_abstain_unavailable.py:10-34`, `tests/test_abstention_evidence.py:21-24`/`:66-73` (conflict case must retain **both** sources), `tests/test_agent_graph.py:228-246` (6 boundary intents) and `:271-298` (polarity pair), `tests/test_agent_upgrades.py:256-259` + `tests/test_own_value_routing.py:14-23` (intent-routing gold). Also port `tests/test_bajaj_rag.py:204-222`, which is a **benchmark hygiene validator** (minimum rows, human fraction, unique qids, dev/test split, required categories, abstain rows carry empty gold, every gold doc servable under its own filter) — the natural guard for any new golden set.

---

## 9. Langfuse integration status — VERIFIED OPERATIONAL (with real limits)

**In code.** `langfuse==5.0.4` + `opentelemetry-sdk>=1.27` + `opentelemetry-exporter-otlp-proto-http>=1.27` (`requirements.txt:13,17,18`). One `TracerProvider` built in `observability.py:88-139`; Langfuse accepts only instrumentation scope `loan_advisory.agent` (`:83-85`) and an export-stage mask deletes `input.value/output.value/llm.system/llm.error` (`:47,162-170`). Master switch `LANGFUSE_ENABLED`, hard-off override `LANGFUSE_TRACING_ENABLED`, content switch `LANGFUSE_CAPTURE_CONTENT` (default off); cloud hosts and non-loopback endpoints are refused (`langfuse_config.py:100-103`). Fail-open everywhere: `tracer()` returns `None` on any exception and logs only the exception **class**.
**Instrumented operations**: `advisor.turn`, `node.<name>`, `llm.<tag>` (GENERATION), `@obs.tool` tools (`authorize`, `get_decision_evidence`, `get_application_summary`, `run_what_if`, `improvement_plan`, `search_approved_policy`, `create_human_handoff`), `frappe.*`, `zen.simulate`, `bureau.evaluation`, voice turn/stt/tts. **Retrieval is instrumented**: `tools.py:176-183` sets `langfuse.observation.type="retriever"` with mode, lender, k, latency, top rerank score, document_ids, chunk_ids. `AgentResponse.trace_id` is the OTel/Langfuse trace id (`graph.py:152`, exposed via `api/events.py:20`).
**In infrastructure**: `infra/langfuse/docker-compose.yml` pins `langfuse:4.70.0`, `langfuse-worker:4.70.0`, `clickhouse:25.12`, `postgres:17`, `redis:7`, Chainguard Minio — all by digest; web published only on `127.0.0.1:3000`; `infra/langfuse/.env` exists (28 variable names, values not read out), and running digests match it.
**In tests**: 5 files — config unit matrix, in-memory-OTel tracing/privacy assertions (incl. retriever span content and full-turn PII absence), resilience with a closed localhost port, `test_langfuse_eval.py` (dry-run determinism, `n=29`), and `test_langfuse_live.py` which is **skipped unless `LANGFUSE_LIVE=1`**.

**Runtime, verified today, GET requests only — no dataset, item, run, or trace was created or modified:**

- Health `{"status":"OK","version":"4.70.0"}`; project `loan-advisory-local`.
- **2 datasets exist**: `loan-advisory-citation-audit-v1` (29 items, created 2026-10-25T18:39Z) and `loan-advisory-golden-v1` (15 items, created 2026-10-29T16:08Z).
- **364 scores**, all `source=API`, `dataType=NUMERIC`, createdAt 2026-10-25 → 2026-10-29: citation-audit `case_ok`/`citation_precision`/`forbidden_citations` ×87 (= 29 items × 3 runs) and golden `case_ok`/`abstain_ok`/`citations_ok`/`facts_ok`/`text_guard_ok`/`latency_ms` ×15 plus run rollups `pass_rate`/`citation_hit_rate`/`mean_latency_ms`.
- Observations include real `advisor.turn` trees and **3 `RETRIEVER` observations**, confirming retrieval instrumentation reaches the server.
- Newest observation `startTime` is **2026-11-02T14:08:48Z** — i.e. **nothing has been ingested since the current stack started (~2 h uptime)**. Traces are historical, not flowing.
- Endpoint map verified today: `/api/public/health`, `/projects`, `/v2/datasets`, `/v2/observations`, `/v3/scores`, `/dataset-items` → 200; `/api/public/traces`, `/scores`, `/v2/dataset-items` → **404**, and the run-items endpoints return `404 {"message":"This endpoint is not available on deployments running in events_only"}`. `/v3/scores` rejects `page` (cursor-only), and the observations list ignores `page`, `orderBy` and `fromTimestamp`, so only a newest-first page-1 sample is obtainable.

**Usable for dataset + experiment tracking today: yes** — datasets, items and scores are real and readable, and `langfuse_publish_eval.py` + `tests/test_langfuse_eval.py` give a deterministic, no-LLM publish path. **Concrete gaps**: (i) no ingestion happening now; (ii) content capture off, so answers/questions are not in traces by design; (iii) experiments and runs are **not enumerable via API** in `events_only` (UI-only), and score→trace links come back `traceId=None`; (iv) observation totals are not obtainable; (v) no dashboards; (vi) the golden-set publisher is **not on `main`**, so `loan-advisory-golden-v1` cannot currently be republished from audited code; (vii) `LANGFUSE_ENABLED=1` was set for the live process but no RAG turn since then, so retrieval spans today are from prior runs.

---

## 10. DeepEval integration status — NOT PRESENT

Definitive negative, established by searching every tracked file, all four requirement manifests, `pyproject.toml`, every config file, and the installed distributions of `.venv-embed`:

- `deepeval`: **0 occurrences** in tracked files; not in `pyproject.toml`, `requirements.txt`, `requirements-test.txt`, `requirements-rag.txt`, `requirements-data.txt`; no `deepeval.config*`; not installed.
- `promptfoo`: **0 occurrences**; absent everywhere.
- `ragas`: **1 occurrence**, a bibliographic mention in `docs/research/regulation-and-design-references.md:78` — not a dependency, import, or config. (A naive `git grep -i ragas` returns ~600 KB of false positives from base64 blobs in the bundled portal JS; word-boundary searching is the correct result.)
- `.venv-embed` installs exactly 8 packages: `sentence_transformers 6.2.0`, `transformers 5.21.1`, `tokenizers 0.23.3`, `huggingface_hub 2.3.0`, `hf_transfer`, `hf_xet`, `pyarrow 26.0.0`, `pip` — no eval framework, not even pytest.
- No pytest-based LLM eval harness exists: pytest is configured (`pyproject.toml:1-6`, CI runs `python -m pytest tests/ -q`) but every test is deterministic and no test calls a model for a score.

Consequence: a DeepEval + Langfuse pipeline would sit on greenfield dependency ground. The metric vocabulary worth porting is already written down in `data/evaluation/agent/citation_audit_v1/README.md:62-77` and `scripts/policy/eval_bajaj_score.py:57-67`.

---

## 11. ZEN versus RAG policy consistency findings

Zen side (`decision_engine/`): four scored rules in `personal_loan_synthetic_v1.json`, mirrored independently in the JDM `decisions/personal_loan_v1.json` and bound by sha256 in `policies/registry.json` (active `synthetic-v1`, effective 2026-10-08, `threshold_source` states "Prototype assumption … NOT a VaaniLabs or lender policy"): monthly income ≥ ₹25,000 · FOIR ≤ 0.45 · credit score ≥ 700 · employment tenure ≥ 12 months. Loan amount and tenure are validated but **never scored**. Bureau gates are `approved: false` (`config/bureau_dq_policy.json`), so their proposed 90-day / 20% / ₹2,000 values cannot affect an outcome. No DPD rule consumes delinquency. `config/lender_profiles/*.yaml` contain **no thresholds at all**.

Pipeline order, verified: `frappe_adapter.from_frappe_doc` → pydantic canonical → `zen.evaluate` → `build_evidence` (`decision_orchestrator.py:43-64`); `lifecycle.py:144-219` runs the DQ gate first, then ZEN with the bureau-resolved score; `admission.py` is HTTP concurrency, not a policy stage.

| Concept | ZEN (location) | RAG corpus (location) | Verdict |
|---|---|---|---|
| Minimum credit score | **700** `personal_loan_synthetic_v1.json:36` | **650** ×4 BFL pages (`BFL-PL-OVERVIEW.txt:15,459,480`, `BFL-PL-ELIG-DOCS.txt:19,162`, `BFL-PL-SALARIED.txt:54`, `BFL-PL-RATES-FEES.txt:243`); 685/750 in `BFL-INSIGHT-REJECTION.txt:21`; HDFC 720; ICICI "700 preferred" | **MISMATCH — highest drift, and I verified 650 is retrievable under the shipped filter** (dense top-5 for the score question contains "require a CIBIL Score of 650 or higher") |
| FOIR cap | **0.45** `:25` | "within 50% to 60% of net monthly income" `BFL-PL-RATES-FEES.txt:92`; "High FOIR (as per lender criteria)" no number `BFL-PL-OVERVIEW.txt:433` | **MISMATCH** (45% vs 50–60%); no regulator number exists |
| Minimum income | **₹25,000** `:14` (mirrored in `SYN-POLICY-V1.txt:5`) | BFL "Rs. 25,001" `BFL-PL-SALARIED.txt:1,55`; **₹40,000 for Pune/Bangalore/Mumbai/Delhi** `:191`; HDFC ₹25,000; ICICI ₹30,000 | **MISMATCH** (trivial at the headline, real for metros) |
| Employment tenure | **12 months** `:47` | HDFC 2 yrs / 1 yr current; ICICI 2 yrs; **BFL states none** | **ZEN-only vs BFL; mismatch vs bank docs** |
| Loan amount / max tenure | not scored (validator 1–360 months) | BFL ₹40,000–₹75 lakh, max **108 months**; ICICI ₹50 lakh; HDFC ₹30 lakh | **Document-only** — and the ZEN validator would admit 360-month personal loans every lender page rejects |
| Rejection reasons in writing | no rule; prompts forbid claiming one (`prompts.py:26,100`) | required for **banks** (`RBI-RBC-CB-2025.txt:784`, para 331, in force 2025-11-28); **no NBFC equivalent**; BFL practice "SMS" (`BFL-FAQ-REJECTION.txt:11`); T&C "without assigning any reason" | **Document-only asymmetry** |
| Reapplication waiting period | no rule | **no document contains any number**; only "fix it and then reapply" (`BFL-PL-OVERVIEW.txt:438`) and "does not define any waiting period" (`SYN-POLICY-V1.txt:14`, unreachable) | **Neither side** — and `config/loan_lifecycle.json:12` models `REJECTED → [MANUAL_REVIEW]` only, so the system's own state machine cannot express reapplication |
| NPA / delinquency | DPD enum only, consumed by no rule | 91st-day NPA (`BFL-PL-DETAILED-TNC.txt:116`), DPD alerts (`RBI-CIC-CS-2023.txt:19`) | **Unmatched** |
| Rates, fees, DLG 5% cap, 30-day grievance, LTV | none (ZEN never prices) | 10–30.5% p.a., ≤4.13% fee; `RBI-NBFC-CF-2025.txt:255,200,211` | **Document-only** (expected) |

**Can the agent cite a threshold that is not the rule it evaluated? Yes — concretely, under the shipped default profile.** Turn A "Why was I rejected?" answers only from the pinned Decision Evidence and states the 700 floor (`facts.py:208-212`, labelled synthetic). Turn B "What CIBIL do I need for a Bajaj personal loan?" retrieves `BFL-PL-OVERVIEW`/`BFL-PL-RATES-FEES` (both permitted by `bajaj_finance.yaml`) and the `POLICY` prompt (`prompts.py:89-109`) requires only passage-grounding — it contains no core-rules block, no synthetic-policy disclaimer, and no instruction to distinguish lender marketing criteria from the engine's thresholds. The session can therefore say 700 and then 650 with nothing reconciling them. `citations.py` compares passages to each other (`:139-159`, `:172-185`) and never sees ZEN's thresholds, so no existing mechanism catches this. Two aggravating details: for `intent=policy` the allowed-numbers set is unioned over **all retrieved** passages, not only cited ones (`graph.py:256-258` + `guards.py:179-188`), so an uncited number can pass validation; and the near-identical-sentence conflict heuristic will usually miss "different sentence, different number" cases such as 650-vs-685 inside one document.

Positive control: `explain/improve/what_if` answers carry **no** document citations (`graph.py:629`), historical passages are labelled `[historical]` (`graph.py:454`), and no fixed template in `prompts.py` contains a threshold that could contradict ZEN — so the drift is confined to the cross-turn policy path, not the decision path.

---

## 12. Missing assets and blockers

**Blocking the first evaluation run**

1. **Corpus provenance record is stale.** `policy_manifest_v2.json` describes a 1,544-chunk 2026-10-14 corpus; the served index is 1,557/2026-10-29 with 10 changed hashes. Until a manifest describing the *actual* index is committed, no evaluation number can be attributed to a named corpus.
2. **The corpus and index are outside git, and one document set is unreproducible by design.** The 3 `local_file` RBI PDFs require a browser through an F5/JS challenge; `www.bajajfinserv.in` blocks the datacenter IP. A clean machine cannot rebuild the current corpus (`docs/reproducibility/database-reproducibility.md:16`).
3. **Benchmark gold anchors cannot be re-verified here.** Gold relevance is "anchor appears verbatim in a visible chunk"; that guarantee was enforced at build time against a corpus that has since changed hash for 10 documents. Any chunk-boundary shift silently invalidates anchors.
4. **`golden_v1` is branch-only.** 15 cases + their Langfuse harness are not on `main`; the Langfuse dataset `loan-advisory-golden-v1` exists with no committed generator on the audited branch.
5. **Dependency drift vs the pinned rag requirements** (`transformers 5.21.1` vs `==5.19.0`, ST `6.2.0` vs `>=6.1`), which is enough to invalidate exact reproduction of committed numbers.

**Blocking nothing but limiting interpretation**

6. **No human sign-off on the register or on `bajaj_v1`'s 66 human rows** — records carry no reviewer/author/date field; only one row has a prose "verified 2026-10-14".
7. **`boundary_v1` and `abstain_v2` have no provenance**; `abstain_v2` is agent-authored and its fix was written after seeing misses (not held out).
8. **Judge is the same model as the answerer** in stage-3 and `eval_agent.py` — self-referential scores, explicitly flagged "indicative only" in the repo.
9. **17 indexed documents unreachable under the default profile** (HDFC/ICICI/RBI-CB-2025/BFL education/SYN docs) — an evaluation that assumes "indexed = reachable" will mislabel those questions as failures.
10. **`events_only` Langfuse cannot list experiments/runs via API** — automated comparison of runs needs either the UI or a documented client-side record of run names.
11. **`bajaj_v1` stopped mid-run** when the 149-question answer pipeline was attempted on this host (`eval_bajaj_answers.py` writes only at the end): no local stage-3 numbers exist on current code.
12. **No retrieval-quality dataset exists for `mode=historical`** or for temporal questions (`TEMPORAL` → historical filter, `graph.py:397`) — untested surface.
13. **Dead-code hazard in the corpus**: 888 of 1,557 chunks (57%) are unservable under the shipped profile; a reranker-only change could surface them.

---

## 13. Evidence references for every material claim

Code paths cited in §3: `rag/corpus.py:20,22,68-88,91-108,111-117,122-124,133-134,135-140,154-163,167-176,169-171,180-230,233-240` · `rag/retrieve.py:27-34,28-29,41-42,46-68,55-68,71-78,81-88,96-106,109-110,113-165,151-160,168-227,231-245,248-260,263-295,279-295,298-305` · `rag/index_meta.py:22-27,30-33,36-72,75-81,84-93,96-103,106-114,116-139` · `config/rag.yaml:1-12` · `config/lender_profiles/*.yaml` · `runtime.py:63-65,68-114,77,83-89,94-99,100,103-111,113,117-131` · `tools.py:22-26,156-184,159,166,176-183,187-195` · `graph.py:388-401,390-391,394-395,397,398-399,408-410,411-413,451-495,454-456,457-461,487,497-510,256-258,629,689,738-765` · `citations.py:3-18,38-40,139-159,168-169,172-185,229-252` · `prompts.py:19,23,26,33,89-109,94,100,302-303` · `server.py:104,169-174,181-192` · `decision_orchestrator.py:43-64` · `lifecycle.py:106-141,144-219,223-233` · `decision_engine/policies/personal_loan_synthetic_v1.json:9-51` · `decisions/personal_loan_v1.json:8-12` · `policies/registry.json:9-14` · `policies/registry.py:59-77` · `schemas/underwriting.py:19-72` · `schemas/bureau.py:17-19,65-69` · `evidence/decision_evidence.py:5-37` · `evidence/evidence_record.py:24,41-87` · `bureau/gates.py:17-41,166-172,189-268,283` · `bureau/policy.py:13-49` · `config/bureau_dq_policy.json:15-25` · `config/loan_lifecycle.json:12` · `requirements.txt:6,13,17,18` · `requirements-rag.txt` (all lines).

Corpus/index evidence: `data/sources/policy_register.yaml:1-16` plus per-entry lines quoted in §4 · `data/sources/policy_manifest_v2.json` (38 entries, 1 skip at `:221-226`) · `runs/policy_local/src/manifest.json` · `runs/policy_local/chunks.jsonl` (1,557 lines) · `runs/policy_local/qdrant_v2/index_compat.json` · runtime scratch output of `corpus_fingerprint`, `client.count`, `get_collection`, `collection_chunk_ids`, `validate_collection` (all reproduced in §5) · retrieved sentences `runs/policy_local/src/BFL-PL-OVERVIEW.txt:6,15,215,433,438,459,480`, `BFL-PL-RATES-FEES.txt:12,15,92,243`, `BFL-PL-SALARIED.txt:1,55,191`, `BFL-PL-ELIG-DOCS.txt:19,162,171`, `BFL-INSIGHT-REJECTION.txt:20,21,89`, `RBI-RBC-CB-2025.txt:69,784,877`, `RBI-NBFC-CF-2025.txt:23-27,200,255,286`, `HDFC-PL-ELIG.txt:6,25,27,52`, `ICICI-PL-ELIG.txt:67,68,80,159`, `BFL-PL-DETAILED-TNC.txt:109-117`, `SYN-POLICY-V1.txt:5,7,9,14`.

Evaluation evidence: paths and line numbers in §7/§8, including `data/evaluation/rag/bajaj_v1/build_benchmark.py:9,12-13,119-125,152,158-167,169,180-185`, `…/synthetic_v1/README.md:7-16,20-27,43-46,50,65,72-74`, `…/citation_audit_v1/README.md:3,10-13,16-19,23,27-29,62-77,78,104-107,127-129`, `scripts/policy/draft_questions.py:1,5-7,19-21,59-61,60,84`, `scripts/policy/eval_bajaj_score.py:57-67,93-103,106-114,117-125,163-173,186-197,208,211,220-226`, `scripts/agent/eval_agent.py:18,41-77,128,142-154,244,270,275-277,306`, `scripts/agent/eval_policy_split.py:18,42,44-52,70-91,95-101,114-123,143-203,207-232,240`, `scripts/agent/eval_citation_audit.py:53-72,94-142,148,159,188,204,223,252,277-299`, `tests/test_bajaj_rag.py:64,71-72,76-90,123-133,137-180,166-168,190-196,204-222,224-241,241-242`, and the test list in §8.

Langfuse evidence: `apps/api/src/loan_advisory/agent/langfuse_config.py:79-90,100-103,106-116` · `observability.py:47,83-85,88-139,112-116,122-126,153-159,162-170,197-221,232-239,242-254,271-283,286-300` · `graph.py:125,152,171,178-180` · `llm.py:143` · `bureau_intake.py:91` · `api/events.py:13,20` · `contracts.py:46` · `infra/langfuse/docker-compose.yml:56,67-68,97,116,136,154,171` · `docs/observability/langfuse.md:22,35-36,83-88,111,203-205` · `tests/test_langfuse_{config,tracing,resilience,eval,live}.py` · live `docker ps`, `GET /api/public/health`, `/projects`, `/v2/datasets`, `/dataset-items`, `/v3/scores`, `/v2/observations` responses.

Runtime evidence: PID 21392 command line + creation time (`Win32_Process`), `netstat` `127.0.0.1:8095`, `%TEMP%/loanportal-manualqa/run_with_env.py` (forced argv, `REPO` = frappe worktree), `runtime.json` (names + non-secret values), `agent.log` (`rag=on`, `retriever loaded in 43.3s`), `agent2.log` (qdrant lock refusal), `.lock` copy failure (`WinError 33`), `agent_out/turns.jsonl` (4 policy turns with `retrieve_policy` events and citations), `traces/*.json` (a ZEN decision trace: `credit_score 640 → credit_pass false`, `foir 0.55 → foir_pass false`, `REJECTED`).

---

## 14. Recommended next steps, in priority order

1. **Freeze a corpus snapshot the evaluation can be attributed to.** Re-export `policy_manifest_v2.json` from the current `runs/policy_local/src/manifest.json` (1,557 chunks) and commit it, plus `index_compat.json`, so a run can name its corpus. Do not rebuild or re-embed — only export the existing state.
2. **Re-verify gold anchors against the current corpus before scoring anything.** Run the existing mechanical check (`build_benchmark.py:158-167` logic) against `runs/policy_local/chunks.jsonl` and list any anchor that no longer appears verbatim; that determines whether the 149 bajaj questions remain valid gold.
3. **Pin the rag environment** (`transformers==5.19.0` vs 5.21.1, ST 6.2.0 vs 6.1.0) or accept a documented difference and record the exact versions in every new run's metadata — the committed `meta.json.gz` already shows this is the mechanism that made stage 2 reproducible.
4. **Decide the authority question for the ZEN-vs-RAG thresholds (700/650, 0.45/50–60%, 25,000/25,001/40,000) before writing an expected-answer dataset.** Any golden answer either states the synthetic prototype threshold or the lender page threshold; whichever is chosen must be the one the citation path can defend. Do not change business rules as part of this — record the decision.
5. **Bring the 15-case `golden_v1` (and `langfuse_eval_agent.py`) onto `main` or formally retire them** — the Langfuse dataset already exists, so it currently has no committed generator on the audited branch.
6. **Publish a deterministic-first evaluation slice to Langfuse from `main`** using `scripts/development/langfuse_publish_eval.py` (citation_audit_v1, no LLM, no network) as the baseline the DeepEval integration must reproduce, then add DeepEval metrics on top of the existing metric names (`case_ok`, `citation_precision`, `forbidden_citations`, `abstain_ok`, `facts_ok`, `citations_ok`, `text_guard_ok`, `latency_ms`) rather than inventing new ones.
7. **Convert the strongest fixtures in §8 into evaluation cases** — profile/mode exact-served-set, the 18 negative controls, and the conflict-must-retain-both case — and port `tests/test_bajaj_rag.py:204-222` as the schema validator guarding any new dataset.
8. **Add the missing evaluation surface**: historical-mode and temporal questions, abstention with the reranker on (the only configuration the live app actually runs), and an explicit governance-leak probe that asserts the 3 `pending_review` fixtures never appear in a served top-5.
9. **Record human sign-off** for the register (`reviewed_by` is automated, "needs human sign-off") and add `reviewer`/`reviewed_on` fields to any new golden rows; `citation_audit_v1/README.md` is the provenance model to copy.
10. **Only then fix the operational gaps that will otherwise confuse results**: traces are not flowing (last 2026-11-02T14:08Z), content capture is off, and `events_only` cannot enumerate runs — decide whether to enable `LANGFUSE_CAPTURE_CONTENT=1` for synthetic-only runs, and keep a client-side run-name ledger.

---

## 15. Final classification

| # | Question | Status | Basis |
|---|---|---|---|
| 1 | Which exact documents are intended to be used by RAG? | **VERIFIED** | 38 entries in `data/sources/policy_register.yaml`; 37 marked ingestible (`rag/corpus.py:22`); `IN-DPDP-2023` explicitly `registered_not_ingested` |
| 2 | Which documents have actually been ingested? | **VERIFIED** | 37 fetched with `.raw`+`.txt`+`src/manifest.json` entries; 1,557 chunks in `chunks.jsonl`; 1 skipped |
| 3 | Which documents are verified present in the current index? | **VERIFIED** | Qdrant `count()=1557`, `chunk_id` set == corpus set, `validate_collection` passed, sidecar `corpus_hash` recomputed exactly equal; 37 documents |
| 4 | Can we verify what the live retriever returns? | **PARTIALLY VERIFIED** | Verified: the live collection's vectors/filters by opening a **copy**, dense + BM25 + governance behaviour reproduced, and the live server's own `turns.jsonl` shows real `retrieve_policy` events with document ids. Not verified: reading the **locked** live directory in place, and the full `HybridRetriever` + rerank fusion path end-to-end in one process — the copy test ran dense and BM25 only, because the reranker (`BAAI/bge-reranker-v2-m3`, present in the local HF cache) was deliberately not loaded: the live server holds the GPU and a CPU cold start of that cross-encoder does not warm within a reasonable window. Fusion weights and rerank depth are therefore verified only as *configuration* (§3.1) and as *observed rerank scores* in the live turn log, not reproduced by me |
| 5 | Is RAG active in the current application? | **VERIFIED** | Live PID forces no `--no-rag`; log `rag=on device=cuda` + `retriever loaded in 43.3s`; OS-held Qdrant lock; 4 policy turns with `n=5` passages, rerank scores, and real citations; **but the running code is the `feat/frappe-borrower-platform` worktree, not `main`** |
| 6 | Does an existing golden dataset already exist? | **VERIFIED** | `bajaj_v1` (149) and `citation_audit_v1` (68) qualify; `synthetic_v1` (8) qualifies narrowly; `benchmark_v1` (96) qualifies but is superseded and not holdout-safe |
| 7 | If one exists, is it suitable for formal evaluation? | **PARTIALLY VERIFIED** | `bajaj_v1`: yes for retrieval/abstention with bootstrap CIs and a real dev/test split — **caveats**: its gold anchors were validated against a corpus whose hashes changed, and its 66 "human" rows carry no reviewer/date field. `citation_audit_v1`: yes, fully deterministic and independence-claimed, but its claim is prose, not machine-verifiable, and it uses synthetic passages rather than the real corpus. Neither has LLM-judge-independent answer correctness |
| 8 | Are there existing test fixtures that can be converted into evaluation cases? | **VERIFIED** | ~15 strong candidates listed in §8 from 64 test files / 511 tests, including an exact-served-document-set fixture and 18 negative controls; plus a benchmark-hygiene validator worth porting |
| 9 | Is Langfuse operational for dataset and experiment tracking? | **PARTIALLY VERIFIED** | Operational and verified now: healthy 4.70.0 stack, project + 2 datasets (29, 15 items) + 364 scores + retriever-type observations. Limits verified: no ingestion since 2026-11-02T14:08Z, content capture off, experiments/runs not enumerable in `events_only`, observation list pagination ignored, dashboards absent, and the golden-set publisher is not on `main` |
| 10 | Is DeepEval already integrated? | **NOT PRESENT** | Zero occurrences in tracked files, absent from all requirement manifests and `pyproject.toml`, not installed in `.venv-embed`; RAGAS and promptfoo likewise not present |
| 11 | What must be fixed or prepared before the first evaluation run? | **VERIFIED** (as an itemised list) | §12 items 1–5 are the blocking set: a committed manifest that describes the served index; anchor re-verification; rag dependency pin/version record; the ZEN-vs-RAG authority decision; and `golden_v1` either landed on `main` or retired |

---

*Audit terminated here as instructed. No golden dataset was created, no document ingested, no index rebuilt, no evaluation run, and no application code, configuration, or environment was modified.*
