# Saral golden datasets: Golden A v2 (RAG) and Golden B v1 (agent)

**Status: release candidate, pending human review.** Every item was written and checked by the frontier model
(`origin: frontier-authored`, `review_status: pending_human`). Golden B decisions are scenario specs waiting on ZEN v2.
Do not use either set as a hard CI gate until the 30-item calibration review is done (see `REVIEW_GUIDE.md`).

| File | What it is |
|---|---|
| `rag_v2/golden.jsonl` | Golden A v2: 227 RAG items |
| `agent_v1/conversations.jsonl` | Golden B v1: 60 multi-turn conversations (190 turns, 30 scenarios) |
| `calibration_30.jsonl` | 30 items (18 RAG + 12 conversations) for human review, each with an empty `review` block |
| `REVIEW_GUIDE.md` | Reviewer sheet: what to check, how to mark accept / fix / reject, and the open policy questions |
| `REVIEW_LOG.md` | What the adversarial review pass changed |
| `COVERAGE.md` | Coverage matrix and validator result, generated |
| `MANIFEST.json` | SHA-256 of the frozen files, corpus hashes, the held-out ids and the calibration ids |

## Sources

- **Corpus v3 G1 cleaned collections** (branch `feat/saral-corpus-collections` @ `3de95b0`):
  - `saral_nbfc_policy`: 15 Bajaj Finance documents, 329 chunks. Bajaj is the public reference lender, not a partner.
  - `rbi_regulatory`: 6 RBI documents, 317 chunks.
  - The chunk texts are not committed (metadata-only policy). Anchors carry `chunk_sha256` from `data/corpus_v3/chunk_index.csv`.
- **Question phrasing** is modelled on the public FAQ and "people also ask" style questions on those same pages. Where an item
  was modelled on a specific public FAQ, `source_url` names the page (28 items). No chunk text was copied into a question;
  the validator measures the longest shared token run.
- **Agent policy**: the user's disclosure rules, also in the uncommitted `wt-prompt` branch's `DISCLOSURE` prompt.
  Scenario rule ids come from `ZEN_RULES_PROPOSAL_v2.md` (draft, thresholds unapproved), mapped to `USER_RULE_CATALOGUE_PL.yaml`.
  Tools come from the seven in `SYSTEM_DISCLOSURE.md` §6.1.
- **saral_golden_v1** (80 items, uncommitted in the Track C worktree) was the starting point and schema reference. All 80
  v1 questions are carried over and mapped by `v1_qid`, with plainer answers, checklists and more anchors.

## Golden A v2 (RAG)

- **Counts**: 227 items.
  - By behaviour: 180 answer, 11 answer_note (conflicts), 12 clarify, 10 abstain, 14 refuse.
  - By variant: 55 direct, 85 paraphrase, 51 multi-hop, 36 behaviour.
  - By language: 200 English, 14 Hindi (7 Devanagari, 7 Roman), 13 Telugu (7 script, 6 Roman).
- **Topics**: 20 required topics, each with at least 3 items and at least one direct, paraphrase and multi-hop item:
  - the four purposes;
  - amount, tenure and rates;
  - fees; eligibility; documents; KYC;
  - KFS / APR / cooling-off; penal charges; prepayment / foreclosure; sanction;
  - recovery conduct; digital-lending rights; grievance / GRO / Ombudsman / CIC;
  - rejection reasons; disbursal.
- **Schema**: all v1 fields are kept (qid, category, topic, collection, language, question, turns, expected_behavior,
  expected_answer, anchors, conflict, note, origin, review_status, gold_docs, gold_chunks, conflict_note, calibration,
  golden_version), so v1 tooling still reads the file. v2 adds:
  - `variant`, `script`, `behaviour_kind`;
  - `must_include` / `must_not_include` (judge checklists);
  - `difficulty`, `source_url`, `v1_qid`, `collections`, `split`;
  - `chunk_sha256` on each anchor.
- **Conflicts**:
  - C1 to C5 come from the G1 report.
  - C6, C7 and C8 are new, found while building this set:
    - C6: rate is fixed vs fixed-or-floating.
    - C7: the T&C cancellation clause vs the RBI cooling-off exit.
    - C8: GRO hours differ between the grievance page and the Charter.
  - They are described in `conflict_note`. They are not yet in `data/corpus_v3/conflicts.md`, which belongs to the corpus track.

## Golden B v1 (agent)

- **Counts**: 60 conversations over 30 scenarios.
  - By decision: 14 APPROVED, 29 DECLINED, 12 MANUAL_REVIEW, 5 INFO_REQUESTED.
  - By language: 46 English, 8 Hindi (4 Devanagari, 4 Roman), 6 Telugu (3 script, 3 Roman).
- **Scenarios**:
  - approved prime and near-prime;
  - counter-offer;
  - a decline for each borrower-safe reason category: employment stability, income verification, existing repayments, credit
    history, recent applications, could not verify details, documents, and outside what we offer (purpose, amount, self-employed);
  - manual review from negative-list, signature, duplicate and tamper flags (must stay generic);
  - info requested;
  - thin file and stale report;
  - an urgent medical case, distressed borrowers, injection attempts.
- **Probes**:
  - cut-off / "why exactly" leak probes; improvement and gaming probes;
  - clarifying questions; mid-conversation policy questions (with Golden A anchors);
  - another applicant's data; injection and override;
  - guarantee demands; record changes and credit-check requests; disputes; distress.
- **Salaried only** (user decision 2026-11-03): every applicant is salaried except the 2 self-employed conversations
  (AC-023, AC-024). In those the agent must say the request is outside what Saral offers and must not invent eligibility rules.
- **Each conversation has**:
  - a synthetic applicant block (`SYN-APP-xxxx`, Aadhaar masked and starting with 0, PAN masked);
  - `stored_decision` with rule hits, for the grader only;
  - `expected_reason_category` and `expected_decision_source: scenario_spec_pending_zen_v2`.
- **Each turn has**:
  - `expected_behaviour`, `must_include`, `must_not_include`;
  - regex `must_not_include_patterns`, for deterministic leak checks;
  - `expected_tool_calls`, as an ordered list where `authorize` runs every turn.
- **Conversation level**: global must-not lists, DeepEval metric specs (ConversationalGEval criteria, RoleAdherence,
  ConversationCompleteness, TurnRelevancy, ToolCorrectness, plus KnowledgeRetention where it applies), and DeepEval
  `ConversationalGolden` fields (`scenario_text`, `expected_outcome`, `user_description`, `chatbot_role`).
- **Review flags**: 5 conversations carry a `review_flag` for a policy decision only the user can make (see `REVIEW_GUIDE.md`).

## How it was built

1. `scripts/golden/build_rag_v2.py --chunks <dir>`: Golden A. Items are hand-written in the script. The build stops if any
   anchor quote is not found verbatim (whitespace-normalised) in its chunk, or if a chunk id is unknown.
2. `scripts/golden/build_agent_v1.py`: Golden B. Policy turns reuse Golden A expected answers and anchors by qid.
3. `scripts/golden/freeze_golden.py`: marks the held-out split, marks the calibration items, and writes
   `calibration_30.jsonl` and `MANIFEST.json`.
   - The held-out split is a deterministic 20%: inside each stratum (Golden A: topic; Golden B: decision), items are sorted
     by sha256(id) and every 5th is held out. Calibration items are never held out.
   - Result: Golden A 49 of 227 held out; Golden B 11 of 60.
4. `scripts/golden/validate_golden.py [--chunks <dir>]`: the validators. Writes `COVERAGE.md`.
5. The adversarial review pass, logged in `REVIEW_LOG.md`.

## How it is validated

`scripts/golden/validate_golden.py` checks:
- schema;
- anchors: the chunk id and sha256 always; the verbatim quote when the chunk texts are available;
- duplicate and near-duplicate questions;
- questions copied from chunks (fails at an 8-token shared run, warns at 6);
- the coverage matrix: topic × variant × language × behaviour, and scenario × reason category, with minimums;
- a `must_not_include` on every leak probe;
- checklists that contradict their own must-not patterns;
- no real-looking PII;
- the split ratio, the calibration count and the manifest hashes.

`tests/test_golden_validators.py` (13 tests) runs in CI. The two checks that need chunk texts, verbatim anchors and copy
detection on the real data, run when `SARAL_CHUNKS_DIR` points at the G1 chunk files.

Current result: **0 errors, 6 warnings**. The warnings are 6- and 7-token generic phrases shared with chunks; 360 anchors
were verified verbatim.

## Regenerate

```
CHUNKS=/path/to/g1/out   # saral_nbfc_policy.chunks.jsonl, rbi_regulatory.chunks.jsonl
python scripts/golden/build_rag_v2.py --chunks "$CHUNKS"
python scripts/golden/build_agent_v1.py
python scripts/golden/freeze_golden.py
SARAL_CHUNKS_DIR="$CHUNKS" python scripts/golden/validate_golden.py
SARAL_CHUNKS_DIR="$CHUNKS" python -m pytest tests/test_golden_validators.py -q
```

Re-run all four steps when the corpus, the rules or the prompts change. Any edit after freezing breaks the manifest
check on purpose.

## Limitations

- **Frontier-authored, not human-reviewed.** Every question, answer and checklist is model-written. The calibration
  review (30 items, two reviewers, Cohen's kappa ≥ 0.7) has not happened yet.
- **Golden B decisions are scenario specs, not ZEN output.** ZEN v2 isn't built, and its thresholds are unapproved
  assumptions; some scenarios record DECLINED where the draft would REFER (`decision_note` says so). Regenerate the
  conversations from real ZEN output once ZEN v2 exists.
- **The agent on `main` will fail many Golden B leak probes by design.** The live `EXPLAIN` prompt tells the model to
  state each failed rule with the applicant's value and the required value. The user's disclosure policy forbids this; the
  `wt-prompt` branch implements it but is not merged.
- **Product scope is not in the corpus.** Saral's four purposes and salaried-only scope are product decisions, so the
  agent can't cite them from the corpus (AC-022 is flagged).
- **Some answers rely on documents with caveats**: `BFL-PL-DETAILED-TNC` has a blank date (F1), and the insight article
  is lender education (C2).
- **`source_url` is recorded only where phrasing followed a specific public page in the corpus.** External
  "people also ask" pages were not fetched. One RBI digital-lending FAQ was seen only in a search excerpt, so it is
  noted but not recorded (R2-KFS-07).
- **No difficulty filtering yet.** "Drop items every model passes trivially" needs a baseline run first.
