# Phase 4: Policy source register and hybrid retrieval (EmbeddingGemma 2 + Qdrant + BM25)

Date: 2026-10-14. Retrieval only: no answer generation, no agent. Labels: **verified**
(measured or seen on the source), **proposed**, **unresolved**.

Retrieval similarity **never** decides eligibility. It finds citable text; decisions stay with ZEN
and the Decision Evidence record.

## 1. Register (`data/sources/policy_register.yaml`)

The register has 16 entries. Each records the document ID, title, publisher, authority type,
reference number, source URL, document type, jurisdiction, product, publication and effective
dates, supersedes/superseded-by links, approval status, licence and notes. The fetch manifest
adds `retrieved_at` and the content sha256.

| Status | Documents |
|---|---|
| **approved (current)** | RBI Digital Lending Directions 2025; RBI KFS circular 2024 (effective for new loans from 2024-10-01, para 11); RBI Penal Charges circular 2023; RBI CIC customer-service circular 2023; RBI CIC compensation framework 2023; **RBI FAQs on RB-IOS 2026** (in force from 2026-07-01); HDFC and ICICI public eligibility pages; `SYN-POLICY-V1` (synthetic, team-authored) |
| **approved_historical** | RBI Fair Practices Code circular 2007 (rejection reasons for all loan categories); RB-IOS 2021 cover notification (replaced from 2026-07-01); Master Circular on Customer Service 2015 (large distractor) |
| **pending_review** | `SYN-INJECT-001`, an adversarial page with embedded prompt-injection text, synthetic. It is never approved. |
| **registered_not_ingested** | RBI Commercial Banks and NBFC **Responsible Business Conduct Directions 2025** (28 Nov 2025); DPDP Act 2023 / Rules 2025 |

**Corpus.** 13 fetched documents, 465 section-aware chunks (median 87 words). Chunking is
deterministic: the sandbox and droplet runs produce byte-identical `chunks.jsonl`.

**Licence (verified).**

* rbi.org.in states "© Reserve Bank of India. All Rights Reserved"; its disclaimer requires
  permission for deep-linking or framing.
* Bank pages are © the bank.
* Use is non-commercial capstone research. Raw text stays on the droplet
  (`$LOAN_DATA_DIR/policy/src`) and is **not** in git; the repo holds only metadata, synthetic
  docs and the benchmark.

**Change control (verified working).**

* `fetch_sources.py` compares content hashes with the previous manifest. A change writes a
  `CONTENT_CHANGED_REVIEW_REQUIRED` event to `review_events.json` and **never** alters
  `approval_status`.
* This fired once during the build, when the RB-IOS 2021 URL was corrected.

**Findings during registration:**

1. **Unresolved, important.** The current RBI text on conveying reasons for rejection is the 2025
   RBC Directions. It is published only as PDF on `rbidocs.rbi.org.in`, which serves a JavaScript
   bot challenge to scripted clients (sandbox and droplet, 2026-10-14).
   * The AIFI version of the same Directions (verified via search excerpt) carries the
     requirement "convey in writing, the main reason / reasons which, have led to rejection of the
     loan applications … for all categories of loans irrespective of any threshold limit".
   * The CB/NBFC texts must be downloaded manually by the user, placed in `policy/src/`, and
     marked approved after review.
   * Until then, "must the lender tell me why?" is answered only by **historical** sources, and the
     system must say so (see H-017).
2. **Verified.** RB-IOS 2026 replaced RB-IOS 2021 from 2026-07-01 (RBI FAQ). Complaints received
   before that date stay under 2021.
3. **Verified.** The NotificationUser `Id=12182` page is a Basel capital Master Direction, not the
   Ombudsman scheme. An earlier draft of the register had it wrong; this was caught by checking
   generated questions against the source and fixed to `Id=12192`.
4. **Note.** HDFC's public page states a minimum net monthly income of ₹25,000, the same number as
   our synthetic threshold. Answers must keep the two sources distinct; benchmark question H-009
   tests this.

## 2. Retrieval design (`rag/`)

* **Dense.** `google/embeddinggemma-2` (Apache-2.0, 768-d), bf16.
  * Documents are encoded as `title: … | text: …`; queries use prompt `QuestionAnswering`.
  * Stored in **Qdrant**, embedded local mode, collection `policy_chunks_v1`, cosine, payload
    index on `approval_status`.
  * Server mode is supported via `url=` (proposed for production).
* **Sparse.** BM25 (rank-bm25) over title and text, with a small stop-list.
* **Fusion.** Reciprocal-rank fusion (k=60) of the top 50 from each retriever.
* **Governance filter applied before ranking, in both retrievers:**
  * `current` mode: `approved` only;
  * `historical` mode: `approved` + `approved_historical`, with the status kept on each hit;
  * `pending_review` and not-ingested content are never served.
* **Runtime.** Container `hx-loan-rag` (rocm:latest + transformers 5.19.0, the first release with
  `embedding_gemma2`), removed after the run.
  * Peak VRAM **4.7 GiB** (cap 6 GiB enforced); index build 3.6 s for 465 chunks.

## 3. Benchmark (`data/evaluation/rag/benchmark_v1.jsonl`, 96 questions)

* **67 LLM-drafted questions, reviewed.**
  * gpt-oss-120b wrote a paraphrased question plus a verbatim anchor for sampled chunks; drafts
    were kept only if the anchor occurs in the chunk.
  * A human-in-the-loop review then dropped 23: 12 that pointed at the wrong IOS page, plus trivia
    and duplicates.
* **29 hand-written questions:**
  * exact thresholds (synthetic) and terminology;
  * multi-document;
  * version (current, gap, historical);
  * 8 abstention;
  * 3 prompt-injection probes.
* **Gold definition.** A hit is relevant if it is in a gold document and contains an anchor. This
  handles the RBI circulars that repeat the same paragraph for banks, NBFCs and HFCs.

## 4. Results (droplet, 2026-10-14; `docs/policy/rag_eval_v1_report.json`)

Answerable questions, n = 87:

| System | R@1 | R@3 | R@5 | R@10 | MRR@10 | nDCG@10 | doc-P@1 | all gold docs @10 |
|---|---|---|---|---|---|---|---|---|
| BM25 only (baseline) | 0.471 | 0.724 | 0.770 | 0.862 | 0.606 | 0.662 | 0.805 | 0.839 |
| Dense only (EmbeddingGemma 2 / Qdrant) | **0.701** | **0.897** | **0.954** | **0.966** | **0.796** | **0.827** | **0.920** | **0.954** |
| **Hybrid (RRF)** | 0.667 | 0.839 | 0.908 | 0.943 | 0.768 | 0.799 | 0.885 | 0.931 |

* **Hybrid vs BM25 (verified).** +0.20 R@1, +0.14 R@5, +0.16 MRR.
  * The gain holds on the 20 hand-written answerable questions (R@5 0.90 vs 0.80; MRR 0.754 vs
    0.575), not only on the LLM paraphrases, which are deliberately low-overlap and therefore
    harder for BM25.
  * Multi-document "all gold docs @10": hybrid 0.75 vs BM25 0.25 (n=4).
* **Honest negative.** Equal-weight RRF is **below dense-only** on this corpus because BM25 drags
  down good dense rankings.
  * Proposed: weighted RRF or a reranker (`BAAI/bge-reranker-v2-m3` is already cached), tuned on a
    separate dev set. Not done here, to avoid tuning on the test questions.
* **Latency.** Hybrid p50 41.9 ms / p95 46.4 ms per query (query embedding dominates); BM25
  0.6 ms.
* **Governance (verified).**
  * Non-current chunks in current-mode top 10: **0**.
  * The prompt-injection page appeared in the top 10 for **0/96** queries with the approval filter
    and **16/96** without it. The filter is what protects the system, so it is mandatory.
* **Abstention.** Threshold on the top dense cosine, chosen on odd rows and tested on even rows:
  * AUROC 0.963, test accuracy 0.957, τ = 0.7535 (vs BM25-score AUROC 0.892).
  * **Only 9 abstain questions**, so this is indicative, not a calibrated operating point
    (unresolved: needs 50+ negatives).
* **Failures (5 of 87 answerable missed at @10).**
  * H-015 "which ombudsman scheme applies today": the date sentence is in FAQ#000, which ranked
    below other FAQ entries.
  * H-016 (historical): the 2026 FAQ outranks the 2021 notification. Retrieval has no temporal
    intent. Proposed: parse dates or "before/after" in queries and filter on
    `effective_from`/`effective_to`.
  * LLM-030, LLM-047, LLM-067: near-duplicate content in sibling chunks.
* **Small categories.** Several have n = 1–5; per-category numbers are not statistically
  meaningful.

## 5. Reproduce

```bash
LOAN_DATA_DIR=/root/hx/loan/data python scripts/policy/fetch_sources.py         # register -> src/ + chunks.jsonl
LOAN_DATA_DIR=/root/hx/loan/data python scripts/policy/draft_questions.py       # optional: new drafts (gpt-oss)
python data/evaluation/rag/build_benchmark.py                                   # merge reviewed drafts + human Qs
docker run --rm --name hx-loan-rag --device=/dev/kfd --device=/dev/dri --group-add video \
  -e HF_HUB_OFFLINE=1 -v /root/hx/loan:/root/hx/loan -v /root/.cache/huggingface:/root/.cache/huggingface \
  rocm:latest bash scripts/policy/rag_run.sh  (from /root/hx/loan/repo)   # pip transformers==5.19.0 sentence-transformers qdrant-client rank_bm25; eval_rag.py
```

## 6. Open items before the agent phase

1. **Unresolved.** Manually obtain and review the RBC Directions 2025 (CB and NBFC). Without them,
   current-mode answers about rejection reasons must abstain or explicitly cite historical text.
2. **Unresolved.** Human sign-off on the register (`reviewed_by` is automated) and confirmation of
   which lender type the VaaniLabs partner is (bank vs NBFC); this decides which RBC text applies.
3. **Proposed.** Weighted fusion or a reranker, temporal routing, and 50+ abstention negatives.
4. **Proposed.** Add Hindi/Telugu queries, since 293 personas narrate in Indic script; this has not
   been evaluated yet.
