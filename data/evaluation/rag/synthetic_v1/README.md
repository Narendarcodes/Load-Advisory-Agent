# Synthetic rejection/reapplication retrieval set (v1)

Small, fully authorized eval set for the decision and policy paths that explain a **rejection** and
handle **reapplication**. Built only from team-authored text that is already in this repository; it
contains no lender content, no personal data and no `.cadra/` material.

## Provenance

- Source document: `data/evaluation/rag/synthetic_docs/SYN-POLICY-V1.md`, registered in
  `data/sources/policy_register.yaml` as `SYN-POLICY-V1` (`approval_status: approved`,
  `lender_id: SYNTHETIC`, `source_type: synthetic`).
- Chunk IDs are deterministic: `rag.corpus.chunk_document` splits the document at its rule headings,
  so `#001`..`#005` are income, FOIR, credit score, employment tenure and outcome.
- Index-time distractor documents: `SYN-INJECT-001` and `SYN-INJECT-002` (pending review). They are
  chunked into the in-memory index on purpose, then the `current` governance filter must exclude them
  from every result. Reference lender content is not used and is not present on this host.

## Checks

| Check | Definition | Pass rule |
|---|---|---|
| Relevance | rank of the first `expected_chunk_ids` entry in the hybrid top-k | R@1 / R@3 / R@5 and MRR@10 reported on `expect_evidence: true` rows |
| Evidence coverage | a question is covered when at least one expected chunk is in the top 5 | coverage@5 = 1.0 on answerable rows |
| Citation correctness | every cited chunk's text must contain `citation_anchor`, and the answer must not state a threshold, fee or waiting period absent from that chunk | manual/LLM review against the anchor; `answer_check` names the specific failure mode |
| Abstention | `expect_evidence: false` rows must not be answered from unrelated chunks | answer abstains or says the policy is silent; no invented amount |
| Governance | pending/untrusted chunks are indexed but must never be served in `current` mode | zero chunks from `SYN-INJECT-*` anywhere in the top-10 returned results |

`answer_check` values: `grounded` (numbers must match the chunk), `no_invented_waiting_period`,
`no_invented_rule`, `abstain_or_insufficient`.

## Run

```bash
# CPU venv with sentence-transformers/torch, run from the repo root
.venv-embed/Scripts/python.exe scripts/policy/eval_synthetic_rejection.py \
  > data/evaluation/rag/synthetic_v1/results.json
```

`results.json` is the committed output of that command on the CPU venv
(`google/embeddinggemma-2`, no reranker). It records the model, prompt, indexed/served chunk
counts and per-question ranks, so the numbers below can be diffed after any retriever change.

The evaluator builds an **in-memory** Qdrant collection and never touches `$LOAN_POLICY_DIR`,
`qdrant_v2` or any production index. It reuses the runtime document string
(`rag.retrieve.doc_string`) and the runtime query prompt (`prompt_name="QuestionAnswering"`), which
is the point of the consistency check.

## Results (synthetic, 2026-10-25)

`results.json`, reproduced twice on the CPU venv with identical output:

| Metric | Value |
|---|---|
| Questions / answerable | 8 / 7 |
| Recall@1 / @3 / @5 | 0.857 / 1.000 / 1.000 |
| MRR@10 | 0.905 |
| Evidence coverage@5 | 1.000 |
| Governance leaks (`SYN-INJECT-*` in top-10) | 0 |

The only R@1 miss is `SYN-RJ-007` (rank 3): the missing-income question is answered by `#005`, which
ranks below two rule chunks. The single out-of-scope question (`SYN-RJ-008`, processing fee) returns
`SYN-POLICY-V1#000` at rank 1; retrieval alone cannot abstain, so the answer layer's
`abstain_or_insufficient` check remains unmeasured until answers are generated.

These are **synthetic sanity numbers** and must not be reported as production retrieval quality.

## Limitations

- This is a synthetic sanity set of 10 chunks (6 served under `current` mode), not a measurement of
  production retrieval quality. The real-corpus benchmark is `data/evaluation/rag/bajaj_v1/`
  (1,544 chunks, 149 questions); its numbers require the authorized corpus and are not reproduced here.
- `BAAI/bge-reranker-v2-m3` is not cached on this Windows host, so the run reports weighted-RRF
  results without reranking; production `config/rag.yaml` enables the reranker.
- Answers are not generated here; `answer_check` is applied by the citation-faithfulness judge or by
  human review.
