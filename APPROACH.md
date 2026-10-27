# Approach

How the Loan Advisory Agent is built and why. Numbered evidence comes from PR descriptions or committed reports and is
named next to each claim. Implementation history runs through PRs #1–#21 (#5 was closed with its commits already on
`main`; #11/#12 are open docs-only PRs); diagrams are in [docs/architecture/](docs/architecture/README.md).

## 1. Problem statement

The VaaniLabs.AI capstone brief: a personal-loan applicant who is rejected usually gets little more than "declined".
Build an agent that **explains the rejection in plain language and gives a concrete, legitimate path to reapply**, and
evaluate it honestly: correctness, failure cases, limitations and metrics. Follow-up asks from the project review: adapt
explanations to the applicant's background and loan literacy, give concrete improvement tasks, prefer voice (text is
acceptable), and research real rejection reasons and variables.

What the agent must **not** do (handoff §1): approve or reject on its own, replace the decision engine, invent reasons,
thresholds or waiting periods, guarantee approval, change policy or application facts, auto-submit an application, or
present synthetic policy as a real lender's.

The business goal is understanding and legitimate next steps, not "maximise approvals". Effects such as fewer premature
reapplications are hypotheses until measured with a lender.

## 2. Scope decisions and why

| Decision | Why |
|---|---|
| **Personal loans, rejected applicants only** | Narrowest population where an explanation is owed and testable |
| **Explain, never decide** | Decisions must be reproducible and auditable; an LLM is neither. ZEN decides, the agent reads the stored evidence |
| **Synthetic applicants and a synthetic `synthetic-v1` policy** | No public dataset has Indian lender decisions with reason codes (PR #1). LendingClub is used as a US public proxy only, UCI German Credit as a fallback |
| **Bajaj Finance as a public reference lender, not a partner** | VaaniLabs gave a problem statement, not a lender relationship. A real NBFC's public documents make the policy RAG testable; every Bajaj source carries the relationship label |
| **Lender-neutral by configuration** | The lender is a profile in `config/lender_profiles/` (`bajaj_finance`, `generic_bank`, `generic_nbfc`, `synthetic_prototype`). RBI texts are tagged by entity type, because the rules differ (below) |
| **Data → conventional workflow → policy RAG → agent → voice** | Each layer is tested before the next consumes it; the agent never compensates for an untested decision core |
| **One LangGraph graph, not multi-agent** | The task is a controlled workflow with a few tools; no evaluation showed a need for multiple agents |
| **Standard-library advisory server, plain `requests` to the LLM** | Handoff rule: no FastAPI, LiteLLM or Hermes in the advisory server; it runs on `http.server`. The synthetic bureau (PR #17) is a separate local-only FastAPI service, not part of the advisory path. Fewer moving parts on a shared droplet |
| **Self-hosted, free/open components** | Frappe Lending, ZEN, Qdrant, vLLM (gpt-oss-120b), LiveKit, IndicConformer, Whisper, svara-tts, Arize Phoenix, optional Langfuse |

**Bank vs NBFC (PR #5).** RBI requires banks to give the main reasons for a rejection in writing (RBC Directions 2025 for
commercial banks, para 331). The NBFC Fair Practices Code and Bajaj's own FPC have no such clause; Bajaj's FAQ says only
that it sends an SMS. The agent therefore has an answer guard that blocks any claim that an NBFC must give written
reasons.

## 3. Decision core and conventional workflow (P0, P1, PR #3)

`Frappe Lending → adapter → canonical pydantic schema → ZEN → Decision Evidence → (agent)`.

- Underwriting rules live only in ZEN decision models (`decision_engine/`), never in prompts, Frappe or the agent.
- Frappe data never enters ZEN raw: it is mapped explicitly and validated by the canonical schema. A failure returns
  ERROR evidence, never a fabricated decision.
- The policy registry is sha256-pinned and fails closed on any unregistered edit.
- The lifecycle is SUBMITTED → UNDER_REVIEW → APPROVED / REJECTED / INFO_REQUESTED / MANUAL_REVIEW (plus dispute,
  resubmit, withdraw); illegal transitions are refused.
- The `decision-evidence/1` record, stored in a custom `Loan Decision Evidence` DocType, holds rule-level
  PASS / FAIL / NOT_EVALUABLE with reason code and threshold source, policy / JDM / input hashes, a deterministic
  `record_id` and a trace hash.
- What-if is `lifecycle.simulate`: overrides merged in memory, run through ZEN, returned as `is_simulation` and never
  persisted. Live tests confirm Frappe's `modified` timestamp is unchanged.

**Bureau-backed runs (PR #17).** `POST /api/bureau/run` takes the application ref from the session token, calls a local
synthetic bureau through `bureau_client.py` (FastAPI, loopback only, **not CIBIL/FICO**), checks the response in
`decision_engine/bureau/gates.py`, resolves the credit score and sends the resolved inputs through the unchanged ZEN
decision. Evidence gains `outcome`, `review` and `bureau` fields additively; the Frappe `decision` value stays
`APPROVED`/`REJECTED`/`ERROR`. The distinction that matters:

- A data-quality hold is evidence `outcome=REVIEW` with legacy `decision=ERROR`; the lifecycle is `MANUAL_REVIEW`, or
  `INFO_REQUESTED` when data is missing/invalid.
- A provider failure (timeout, 429, 503, malformed response) is evidence `outcome=ERROR`; `retryable` says whether a
  retry can help, and the lifecycle is `MANUAL_REVIEW`.
- A real credit outcome stays `APPROVED`/`REJECTED` from ZEN.

The staleness and income/obligation-variance gates ship disabled and only change through a reviewed
`config/bureau_dq_policy.json` edit. Flow and score precedence:
[docs/architecture/synthetic-bureau.md](docs/architecture/synthetic-bureau.md).

## 4. Policy register and RAG (PR #4, PR #5)

**Register.** `data/sources/policy_register.yaml` (v2, 38 sources) records URL, publisher/authority, reference,
publication and effective dates, supersedes links, approval status, licence and the entity type a rule applies to.
Copyrighted text stays on the droplet; git holds only the metadata manifest (`policy_manifest_v2.json`). A changed
content hash is written as a `CONTENT_CHANGED_REVIEW_REQUIRED` review event and never changes approval status. Status
corrections found during the build: the RBI Digital Lending Directions 2025 are withdrawn (now NBFC Credit Facilities
Directions 2025 ch. III), and the KFS 2024 and penal-charges 2023 circulars are consolidated into RBC 2025, so all three
are `approved_historical`.

**Retrieval.** Section-aware chunks with page references → BM25 and EmbeddingGemma 2 dense vectors in Qdrant
(`policy_chunks_v2`) → weighted reciprocal-rank fusion (w_dense 1.0, w_bm25 0.5, k 10) → `bge-reranker-v2-m3` over the
top 50 → top 5 passages labelled P1..P5. The lender-profile filter (approval status, entity type, own lender only,
source-type allow-list) is applied **before** ranking and is identical in BM25 and Qdrant. A temporal question switches
to historical mode; a retriever failure means abstain.

**Why weighted RRF plus a reranker.** In PR #4, equal-weight RRF scored below dense-only. Fusion weights and the reranker
were then tuned on the **dev split only** (PR #5). Held-out TEST, 80 answerable questions:

| System | R@5 | MRR@10 |
|---|---|---|
| BM25 | 0.738 | 0.526 |
| Dense | 0.838 | 0.666 |
| Equal RRF (PR #4) | 0.787 | 0.631 |
| Weighted RRF | 0.825 | 0.664 |
| **Hybrid + rerank** | **0.950** | **0.843** |

Hybrid + rerank vs dense: MRR +0.177, 95% CI [0.101, 0.253]. With filters, 0 non-permitted chunks appear in any top-10;
without them the injection page reaches the top-10 for 30/149 questions. Removing the reranker drops the gold-in-top-5
rate on TEST from 0.963 to 0.825 (PR #9), so it stays on.

## 5. Agent graph and guards (PR #6, #9, #10)

One `StateGraph` (`agent/graph.py`):

```
receive → authenticate → classify → load_evidence → compose | plan → compose | what_if → compose
                                  → retrieve_policy → compose
                                  → boundary → finalize
                                  → simple   → finalize
compose → validate → (one rewrite) → finalize
```

- **Least-privilege tools** (`tools.py`): authorize, application summary, decision evidence, what-if, improvement plan,
  approved-policy search, human handoff. There is no generic Frappe, SQL or web tool and no decision or record write
  path.
- **Authorization.** The session token's `applicant_ref` must own the Loan Application; an unknown reference gets the
  same answer as a not-owned one. Conversation memory is a `MemorySaver` thread keyed `applicant_ref::conversation_id`
  and is never treated as loan data.
- **Facts first.** `facts.py` derives the failed rules, values and ZEN-verified targets deterministically. The LLM only
  phrases them, in the requested language (en/hi/te) and literacy level, and voice answers are capped at about 70 words.
- **Request guards** run before any LLM call and route to fixed EN/HI/TE templates on the boundary path:
  `injection`, `misrepresentation` (fake, inflate, hide or forge application information; PR #10), `other_applicant`,
  `dispute` (also files a human handoff), `override`, `edit_record` (including imperative record tampering such as
  "remove the enquiry from my CIBIL report"; PR #9), `auto_submit`, `not_available` and `guarantee`.
- **Abstention.** `not_available` (PR #10) answers questions about information the agent never holds, such as who
  handled the file or an internal risk grade, with "that isn't available to me", no LLM call, no citations and
  `abstained=True`. `guarantee` also abstains, while still offering the labelled ZEN improvement plan. Policy questions
  abstain when the passages do not support an answer or retrieval fails.
- **Answer guards** (`validate`): guarantee or decision language (negation-aware), NBFC written-reason claims,
  ungrounded numbers (every number must come from the record, thresholds, ZEN targets, the message or cited passages)
  and citation labels (valid, present, and absent on abstention). A flagged draft gets one rewrite with the flags fed
  back, then a deterministic template.
- **Finalize** appends the synthetic-policy label if a draft forgot it and writes an audit row with ids, intent, flags
  and timings, but no message text and no financial values.
- **Deadlines (PR #8).** Per-turn deadline (voice 25 s, text 75 s). The LLM read timeout is the time left; when time
  runs out explain/improve/what-if fall back to the template and policy turns to a localized "busy, ask again" template.
- **Bureau is not a graph node.** `/api/bureau/run` is a separate authenticated server entry point; the agent reads the
  stored bureau-backed evidence like any other decision.
- **Observability (PR #18).** One `TracerProvider` emits manual OTel spans for advisory turns and bureau evaluations.
  Phoenix is the opt-in OTLP backend (`AGENT_TRACING=1`); self-hosted Langfuse is a second optional processor
  (`LANGFUSE_ENABLED=1`, loopback only, Langfuse Cloud refused). Both are off by default, and message/answer text is
  captured only with `AGENT_TRACE_CONTENT=1` (Phoenix) or `LANGFUSE_CAPTURE_CONTENT=1` (Langfuse). Telemetry cannot
  change an answer, gate or decision.

## 6. Citation modes (PR #8, #9)

Strict citation accuracy was about 60%. The PR #9 failure analysis of 32 strict failures on TEST: 19 cited the correct
passage plus a passage from another document restating the same rule, 5 cited the gold document but not the gold
passage, 2 cited only non-gold documents, 3 were retrieval misses and 3 abstained although the gold passage was
retrieved. The main loss is over-citation across documents, not retrieval.

PR #10-era live run, 80 answerable + 11 unanswerable, 3 full runs per mode, not re-run for this revision
(`docs/agent/citation_accuracy.md`):

| Mode | strict (mean) | support | judged faithful | judged correct | p50 | unanswerable |
|---|---|---|---|---|---|---|
| `labels` (default) | 0.592 | 0.838 | 0.904 | 0.892 | 7.3 s | 11/11 ×3 |
| `primary_source` | 0.800 | 0.800 | 0.819 | 0.883 | 7.1 s | 11/11 ×3 |
| `llm_verify` | 0.671 | 0.763 | 0.870 | 0.90 | 9.1–11.6 s | 11/11 ×3 |

`primary_source` keeps the cited passages from the best-supported source document (support, then currency, then
retrieval rank). It keeps a second document when the cited sources conflict and the answer does not acknowledge it,
when the answer contrasts versions, or when the second document uniquely supports part of an answer sentence the
primary only partly covers. Re-judging the same answers shows it lowers judged faithfulness in every case (dev −8 / −12
points, test −3 / −12 / −5), because a pure cross-document restatement still collapses to one citation. So **`labels`
stays the default and `primary_source` is the recommended opt-in** (`AGENT_CITATION_MODE=primary_source`). Choosing it
is a product decision.

**Independent citation audit (2026-10-25).** A hand-authored, deterministic audit (`data/evaluation/agent/
citation_audit_v1/`, 68 fixed cases, fixed composer outputs, no LLM judge and no corpus access) measures the citation,
guard and governance layers rather than end-to-end answer quality. Against baseline `33b904e`, `primary_source` moves
precision from labels' 0.7069 to 0.95 (41/58 → 38/40), with material coverage 1.0, 29/29 case pass, 0 forbidden
citations and 0 per-case regressions; the sample is too small for significance claims. The audit also caught the
second-document drop described above and an amount-increase guard false positive, both fixed. Source:
`docs/agent/citation_accuracy.md`.

## 7. Voice pipeline and latency (PR #7, #8, #10)

Browser `/voice` → self-hosted LiveKit 1.13 → LiveKit Agents 1.8 worker → Silero VAD → STT sidecar (IndicConformer-600M
on CPU for hi/te, Whisper large-v3-turbo for en) → `POST /api/chat/stream` with the participant's session token (the same
graph, guards and authorization as text) → svara-tts-v1 on vLLM with a streaming SNAC sidecar → LiveKit. The decision
card goes over the data channel.

**Latency work.** In PR #7 the full answer had to be generated and validated before TTS could start; the breakdown for
a warm English turn was STT 0.13–0.25 s, classify 0.5–1.9 s, LLM TTFT 0.5–1.0 s, waiting for the full answer and guard
1.5–2.1 s, TTS first audio about 0.15 s. PR #8 added:

- `SentenceGate`, which releases each sentence only after the same deterministic guards. The first flagged sentence
  stops the stream, the full-answer `validate` still runs, and only the remainder is spoken after a short bridge.
- A high-precision fast classifier for voice (EN/HI/TE).
- For English explain/improve, a lead sentence built from the recorded ZEN evidence (never by the LLM), spoken while
  the LLM writes the rest.
- A "one moment" filler at 4 s, and a 40 s worker timeout that is longer than the graph deadline.

| Measurement | Before (PR #7) | After |
|---|---|---|
| EN first audio p50, 5 turns, LLM idle | 5.4 s (max 9.9) | 1.97 s (max 4.8); 3.07 s without the lead sentence (PR #8) |
| HI+TE first audio p50 / max, 6 turns | 11.0 s / 23.8 s | 3.8 s / 4.2 s (PR #8) |
| Busy LLM (requests held 40 s) | 90 s worker timeout | template at 25.0 s (PR #8) |
| 11-turn EN/HI/TE loop, #8+ code + PR #10, LLM idle | – | 11/11 audio, 11/11 intents, p50 3.44 s, max 6.63 s (PR #10 run) |

Latency depends on load on the shared gpt-oss: one production explain turn went from 4.3 s idle to 13.8 s with 48
requests in flight (PR #10 run). VRAM for STT + TTS + SNAC was 10.4 GB right after restart and about 11.9 GB after use,
against a 12 GB voice budget (PR #7). The retriever is capped separately with `AGENT_GPU_FRACTION`.

## 8. Evaluation methodology

- **Splits and leakage.** bajaj_v1 has 149 questions (66 hand-written including 16 must-abstain, 83 reviewed gpt-oss
  drafts with verbatim anchors), split 58 dev / 91 test. All tuning (fusion weights, reranker depth, citation modes) used
  dev only. `eval_policy_split.py` caches retrieval once so methods are compared on identical passages.
- **Deterministic metrics first.** Retrieval R@k / MRR / nDCG against gold documents; citation `strict` and `support`
  against gold document + gold anchor; reason-value coverage and ungrounded numbers against the ZEN record; plan targets
  re-checked through ZEN; what-if equal to direct ZEN with the original record unchanged.
- **LLM judge, labelled indicative.** The judge is the same gpt-oss-120b that writes the answers, so judged correctness
  and faithfulness can be biased. Every report says so.
- **Agent sets** (`scripts/agent/eval_agent.py`): A1 explain, A2 literacy pairs (readability and jargon), A3 improve, A4
  what-if, A5 Hindi/Telugu, B policy (bajaj_v1 TEST), C boundary (`boundary_v1`, 40). Results on PR #6 (eval_v3, 989
  turns, 0 errors): explain coverage 100% with 0 ungrounded numbers; low-literacy versions read simpler (FK +0.63, CI
  0.36–0.90) with far less jargon (0.07 vs 2.32 terms); plan targets pass in ZEN 100%; boundary 40/40 with 0 guarantee or
  decision language.
- **Abstention.** 11/11 test-split unanswerable questions abstain in every run. `abstain_v2` (41 agent-authored
  questions in 9 families) is a harder set: 39/41 and 40/41 with `labels`, 40/41 with `primary_source` on PR #10. It is
  not human-reviewed, and the PR #9 guard fix was written after seeing its misses, so those numbers are not held-out.
- **TDD for guards.** New guard tests were written red first (PR #10: 13 of 23 and 11 of 17 failed before the change)
  and include honest phrasings that must stay unflagged (e.g. the Grievance Redressal Officer, "my salary in the
  application is wrong"). New flags were checked against the 528 existing eval prompts and fire only on two items that
  already expected abstention.
- **Bureau replay (PR #17).** `tests/test_bureau_lifecycle.py` replays all 120 committed bureau cases through
  `process_bureau_application`; the fixture's expected labels come from the unchanged `decide()` pipeline.
- **CI and pre-commit (PR #20, #21).** GitHub Actions runs `python -m ruff check .` and `python -m pytest tests/ -q` on
  pushes and PRs to `main`. The optional `.githooks/pre-commit` hook runs staged whitespace checks, ruff on staged
  Python and the test suite.
- **End to end.** The tree collects 527 tests; a 2026-10-27 local run without live Frappe/GPU/LLM gave **516 passed,
  11 skipped**. Historical, not current: **205 passed** on the droplet with live Frappe on PR #10, Playwright chat
  smoke 16/16 (PR #9), and an automated voice loop with synthetic utterances measured on the client clock.

## 9. Trade-offs

| Choice | Gain | Cost |
|---|---|---|
| Deterministic guards and templates | No guarantee/decision language reached a final answer in eval; predictable refusals in three languages | Regex coverage is finite; some phrasings route to the wrong path (e.g. AB2-018) |
| Facts-first composing | 0 ungrounded numbers in explain | Less natural wording; occasional template fallback (10% in HI/TE explain, PR #6) |
| `labels` default citation mode | Higher support and judged faithfulness | Strict citation about 0.6 |
| Sentence streaming behind guards | Voice first audio p50 down to about 2–4 s | More moving parts; a corrected answer needs a spoken bridge |
| Synthetic policy and data | Safe, reproducible, no personal data | No external validity for real lender decisions |
| Synthetic bureau + data-quality gates (PR #17) | Exercises bureau-shaped inputs, holds and provider failures without real bureau data | `synthetic-score-v1` is unvalidated and not real bureau behaviour; two gates ship disabled |
| Same-model judge | Free and self-hosted | Self-judging bias; judge numbers are indicative only |
| Shared GPU and shared LLM | No paid services | Latency rises under load; tight VRAM budgets |

## 10. What's next

- Fix the `eval_agent.py` set B harness issue (about 30% answered vs 95% in `eval_policy_split.py` on the same split).
- Confirm what the production `:8095` droplet runs; its state is not recorded in this repo and the last recorded
  evidence is PR #10-era. Deploying the merged post-#10 work is the owner's decision.
- Human review of `abstain_v2`, and more unanswerable questions to calibrate abstention.
- Decide the default citation mode (`labels` vs `primary_source`).
- Human sign-off on register v2 (two repeals are inferred) and on the currency of the older Bajaj terms documents.
- Route the remaining abstain_v2 misses (co-applicant sanction guarantee; another bank's rules).
- Add a lockfile and pin or list the remaining stack (OpenTelemetry, LiveKit Agents, `sentence-transformers`,
  `qdrant-client`, STT/TTS); `requirements.txt` now covers the decision core, advisory server, LangGraph and Langfuse.
- If the synthetic bureau leaves development: validate `synthetic-score-v1`, review the disabled staleness/variance
  gates, and replace the fixture with a contracted bureau integration.
- Replace demo sign-in with real authentication and the JSONL handoff with a real escalation channel.
- Validate against an authorised, anonymised lender dataset, if one becomes available.
