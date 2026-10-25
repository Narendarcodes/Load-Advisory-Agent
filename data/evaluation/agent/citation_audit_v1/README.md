# citation_audit_v1 — independent, deterministic audit of policy citation handling

Version: **citation_audit_v1**, authored 2026-10-25 for the PR #9 review (branch `feat/citation-accuracy`).
Baseline compared: `origin/main` @ `33b904e77659704ea31e88521b34f78271a0245b`.
Candidate compared: PR #9 head as reviewed (pre-fix `c10ab6e9e1cf2159fdddd87cd3e983d0e834868a`), then the
validated fix commit.

## What this set is (and is not)

- **It is** a hand-authored set of fixed policy passages, fixed "composer" outputs (plausible model answers), and
  expected citation/abstention labels. It measures the **deterministic citation and guard layers** of the agent:
  which passages get credited, which are pruned, whether a conflict is exposed, and whether the agent declines.
- **It is not** a live-model evaluation. No LLM generated the composer outputs and no LLM judges the results.
  `composer` blocks are fixtures written by the auditor, so the numbers describe the post-processing / guard
  behaviour on fixed inputs, not end-to-end answer quality.
- **It is not** a real lender corpus. Every passage is synthetic fixture text. Titles say `SYNTHETIC`, and none
  is quoted from an actual bank, NBFC or RBI document. The real Bajaj/policy corpus and Qdrant index are not
  available in this environment (`LOAN_POLICY_DIR` unset, `qdrant_v2` absent), so no claim about production
  retrieval quality is made here.

## Annotation independence

- Passages, fixture answers and gold labels were written by hand before running any PR #9 function.
- `gold.supporting` is the set of passages that entail (or directly state) the claims in the fixture answer;
  `gold.required` is the set that must survive for the answer to remain adequately sourced (used for the
  "material coverage" metric); `gold.forbidden` is the set that must never be credited as support.
- No expected label is derived from `verify_citations`, `select_verified`, `primary_source`, or any saved PR #9
  output. The harness applies the tree's own code and compares to these fixed labels.
- Lexical token overlap is used by the implementation and is reported as a limitation: overlap is not entailment.

## Categories (the 12 required by the review)

| category | what it checks |
|---|---|
| `direct_support` | the cited passage states the answer's claim; extra unrelated citations should not survive |
| `relevant_non_entailing` | same topic, but the passage does not entail the claim (overlap trap) |
| `irrelevant` | cited passage is unrelated, wrong-product or a wrong label |
| `corroboration` | two documents state the same fact; one suffices (duplicate, not complementary) |
| `contradiction` | two cited passages disagree (near-duplicate value, or negation polarity) |
| `wrong_lender` | a passage from another lender must not be credited under this profile |
| `wrong_version` | a superseded/historical passage vs the current one |
| `unsupported_numeric` | the answer states a number that no passage contains |
| `no_evidence` | retrieval returns nothing: the agent must abstain, never guess |
| `general_guidance` | general education is not lender policy; provenance must stay visible |
| `multi_document` | the answer needs facts from two or more documents; suppressing one is misleading |
| `requires_abstention` | guarantees, record tampering, other applicants, injection, out-of-scope |

## Case kinds

- `citation` — quote/citation post-processing: build `passages`, take `composer` JSON, run the tree's mode logic.
- `graph` — run the offline agent end-to-end with a scripted LLM (no network) to measure abstention/refusal and
  the answer guards (`ungrounded_numbers`, boundary routing).
- `guard` — call `guards.request_flags` directly (production-active in `classify`) to measure detection and
  false positives on ordinary questions.
- `governance` — call `rag.retrieve.profile_filter` / `citation_for` to confirm wrong-lender, wrong-version and
  synthetic-under-real-profile content is rejected or explicitly qualified.
- `wiring` — check that `AGENT_CITATION_MODE=primary_source` is actually accepted and used by the agent path
  (the mode does not exist on baseline).

## Metrics and conventions

- `precision` = supporting cited labels / all cited labels (aggregate TP/FP).
- `coverage_all` = supporting cited labels / all `gold.supporting` labels (aggregate).
- `material_coverage` = required cited labels / all `gold.required` labels. A drop here is a material regression.
- `case_ok` = every cited label is in `supporting` ∪ `required`, every required label is cited, no forbidden citation,
  every cited passage's authority is allowed, and a historical citation is explicitly qualified when the gold asks.
  A conflicting counterpart in `required` is therefore allowed without counting as a failure (it still counts as an
  FP in aggregate precision).
- `forbidden_cited` = number of citations in `gold.forbidden` (must be 0 for a safe answer).
- `conflict_safe` = for contradiction cases, all required (conflicting) labels survive, or the agent abstains.
- `multi_doc_retained` = for multi-document cases, all required labels survive.
- `corroboration_both` = for corroboration cases, both duplicate labels survive. Dropping one is the documented
  "one primary source" trade-off; it is reported separately and is not counted as material unless `required`
  says so (for duplicate corroboration it does not).
- `authority_correct` = every cited passage's authority is in `gold.authority_ok`.
- `governance_leakage` = governance cases where a disallowed chunk was allowed.
- Abstention precision/recall use `declined = action in {refuse, handoff} or abstained`.
- No statistical-significance claim is made: the denominators are small and the set is hand-authored.

## Results (2026-10-25, deterministic, `citation_audit_v1`)

Baseline `33b904e` vs candidate `c10ab6e` + the validated fix (conflict/multi-document retention in
`primary_source`, and an imperative-anchored amount-increase guard). 29 citation cases, 68 cases in total.

| metric | baseline labels | candidate labels | candidate verify | candidate primary_source |
|---|---|---|---|---|
| citation precision | 0.7069 (41/58) | 0.7069 (41/58) | 0.8723 (41/47) | **0.95 (38/40)** |
| coverage (all supporting) | 1.0 (41/41) | 1.0 (41/41) | 1.0 (41/41) | 0.9268 (38/41)¹ |
| material coverage (required) | 1.0 | 1.0 | 1.0 | **1.0** |
| `case_ok` | 15/29 | 15/29 | 25/29 | **29/29** |
| forbidden citations | 6 | 6 | 3 | **0** |
| conflict-safe | 4/4 | 4/4 | 4/4 | **4/4** |
| multi-document retained | 4/4 | 4/4 | 4/4 | **4/4** |
| corroboration both kept | 3/3 | 3/3 | 3/3 | 0/3¹ |

¹ The three missing labels are duplicate restatements whose gold `required` is empty; dropping one is the documented
`primary_source` trade-off and is not a material coverage loss. There are **0** case-level regressions in the
per-case comparison for `labels->primary_source`, `labels->verify`, and `labels->one_source`; the same comparison
shows 14, 10, and 14 improvements respectively.

Other layers: graph 8/10 → 10/10 (`precision=1.0`, `recall=1.0`, abstention precision/recall 1.0); request guards
3/7 → **7/7** detection with 0/8 false positives; governance 11/11 with 0 leakage; wiring 1/3 → 3/3.

Caveats: these are fixed, hand-authored synthetic fixtures, so they show post-processing/guard behaviour, not live
answer quality; the sample is too small for significance claims; `primary_source` remains **opt-in**
(`AGENT_CITATION_MODE=primary_source`) and the default `labels` mode is unchanged; no live LLM or real corpus was
available, so prompt-level effects (`one_source`) and retrieval quality are unverified here.

## Reproduce

```
# candidate tree (run from the candidate worktree)
PYTHONPATH=.:apps/api/src python scripts/agent/eval_citation_audit.py \
  --cases data/evaluation/agent/citation_audit_v1/cases.jsonl \
  --label candidate --sha "$(git rev-parse HEAD)" --out runs/audit_candidate.json

# baseline tree (same harness file, baseline PYTHONPATH)
PYTHONPATH=<baseline>:/<baseline>/apps/api/src python <candidate>/scripts/agent/eval_citation_audit.py \
  --cases <candidate>/data/evaluation/agent/citation_audit_v1/cases.jsonl \
  --label baseline --sha "$(git -C <baseline> rev-parse HEAD)" --out runs/audit_baseline.json

# per-case comparison
PYTHONPATH=.:apps/api/src python scripts/agent/eval_citation_audit.py \
  --compare runs/audit_baseline.json runs/audit_candidate.json --out runs/audit_diff.json
```

The harness only reads the cases file and calls pure/deterministic functions plus the offline agent
(`build_offline_agent`, MockStore, in-memory evidence). It opens no Qdrant collection, makes no network call,
and writes only to `--out` and a temporary directory for audit/handoff logs.
