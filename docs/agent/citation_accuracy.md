# Policy citation accuracy and abstention (feat/citation-accuracy, Oct 15, 2026)

Synthetic-data prototype. The judge is the same self-hosted gpt-oss-120b as the agent, so the judge figures
(`correct`, `faithful`) are indicative only. `strict` and `support` are deterministic: gold document + gold anchor checks
from `data/evaluation/rag/bajaj_v1/benchmark.jsonl`.

## Why strict citation accuracy was about 60%

On the 80 answerable TEST questions, a `labels`-mode run failed `strict` 32 times:

| Failure | Count |
|---|---|
| Correct passage cited, plus an extra passage from a NON-gold document (usually a document restating the same rule, e.g. the lender's Fair Practices Code restating an RBI direction, or a sibling product page) | 19 |
| Gold document cited, but not the passage carrying the gold anchor | 5 |
| Only non-gold documents cited | 2 |
| Gold passage not in the top 5 (retrieval miss) | 3 |
| Abstained although the gold passage was retrieved | 3 |

Retrieval is not the bottleneck. The gold passage is in the top 5 for 0.963 of test and 0.906 of dev questions
(top 8: 0.975 / 0.925). Without the bge reranker, those numbers drop to 0.825 / 0.792, so the reranker stays on.
The main loss comes from over-citation across documents.

## What was tried (tuned on DEV only)

| Method | dev strict | dev support | notes |
|---|---|---|---|
| labels (default) | 0.60–0.62 | 0.75–0.79 | |
| llm_verify (PR #8) | 0.68–0.70 | 0.72–0.77 | +1 LLM call |
| verifier v2 "quote": verbatim quote per supporting passage, checked in code (`select_verified`) | 0.66–0.68 | 0.70 | not better than llm_verify |
| **primary_source**: keep only the cited passages from the document of the top-ranked cited passage | **0.72–0.75** | 0.72–0.75 | no extra call |
| one_source: composer told to answer from one document, then primary_source | 0.70 | 0.70 | prompt costs support |
| one_source_soft: the prompt only | 0.62–0.64 | 0.68 | |
| primary_source plus a lexical keep for a second document that alone supports an answer sentence | 0.72–0.74 | — | did not recover faithfulness |

## TEST (91 q: 80 answerable, 11 unanswerable), 3 full runs per mode

| Mode | strict | support | judge faithful | judge correct | p50 latency | unanswerable |
|---|---|---|---|---|---|---|
| labels (default) | 0.613 / 0.600 / 0.563 (mean **0.592**) | 0.838 | 0.904 | 0.892 | 7.3 s | 11/11 ×3 |
| primary_source | 0.775 / 0.825 / 0.800 (mean **0.800**) | 0.800 | 0.819 | 0.883 | 7.1 s | 11/11 ×3 |
| llm_verify (PR #8 opt-in) | 0.688 / 0.663 / 0.663 (mean **0.671**) | 0.763 | 0.870 | 0.90 | 9.1–11.6 s | 11/11 ×3 |

On the same answers, re-judged with different citation policies (`rejudge`), primary_source lowers judged faithfulness
in every case: dev −8 / −12 pts, test −3 / −12 / −5 pts. When the answer combines facts from two documents, dropping the
second document leaves a claim without a citation. llm_verify also lowers judged faithfulness (0.870), and it adds an LLM call. primary_source beats it on strict (+13 pts) and support (+4 pts) at no latency cost. For that reason **the default stays `labels`**, and **primary_source is the recommended opt-in** over llm_verify. `primary_source` is
opt-in: `AGENT_CITATION_MODE=primary_source`. It raises strict by about 21 pts at no latency cost, and costs about
4 pts of support and about 8 pts of judged faithfulness. Choosing it is a product call.

## Abstention set abstain_v2 (41 agent-authored unanswerable questions, 9 families)

`data/evaluation/rag/bajaj_v1/abstain_v2.jsonl` covers these families: invented internal thresholds, other lenders,
guarantees, cross-lender comparisons, future predictions, out-of-scope products, record-tampering actions, injection, and
personal or internal data. The set is agent-authored and has **not been human-reviewed**. Two label errors were fixed
after the first run:
- One question was removed because the corpus does answer it.
- One profile was corrected.

| Run | abstained or refused |
|---|---|
| before guard fix (labels / primary_source) | 37/42, 35/42 |
| after guard fix (labels ×2, one_source) | 40/41, 39/41, 39/41 |

The guard fix routes imperative record-tampering requests ("remove the enquiry from my CIBIL report", "mark my EMI as paid",
"increase my approved amount") and "will X give me the lowest rate" to the boundary path. It changes no flag on any
bajaj_v1, benchmark_v1 or boundary_v1 question. **It was written after seeing these misses, so the after-fix abstain_v2
numbers are not held-out.**

Remaining misses: "Who was the loan officer who rejected my application?" and "What internal risk grade did Bajaj assign
to my application?" go to explain. The agent explains the recorded reasons without fabricating, but it does not say that
the information is unavailable.

## Reproduce
```
PYTHONPATH=.:apps/api/src python scripts/agent/eval_policy_split.py run --split test --mode primary_source --cache retrieval.json --out runs/x --judge
PYTHONPATH=.:apps/api/src python scripts/agent/eval_policy_split.py retrieve --bench data/evaluation/rag/bajaj_v1/abstain_v2.jsonl --out retrieval_ab.json
PYTHONPATH=.:apps/api/src python scripts/agent/eval_policy_split.py run --bench data/evaluation/rag/bajaj_v1/abstain_v2.jsonl --split abstain_v2 --mode labels --cache retrieval_ab.json --out runs/ab
PYTHONPATH=.:apps/api/src python scripts/agent/eval_citation_verify.py --run runs/dev_labels --cache retrieval.json --variants v1,quote --out runs/verify_dev.json
```
