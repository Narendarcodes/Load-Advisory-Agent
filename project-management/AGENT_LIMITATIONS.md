# Saral: known limitations

Draft for the final submission (2026-11-04). Results only: every count below comes from a run with a report on disk,
named per section. `{{...}}` marks a number that the final runs fill in. All data is synthetic.

Labels: **automated** = scripted, LLM-judged where a metric needs it, no human review. **GUI/live** = real browser on
the live integration stack, recorded. **blocked** = could not run.

Sources:
- RAG: `docs/saral/DEEPEVAL_BASELINE.md` §1-§10 (baseline) and §11 (after fixes), dev split, 178 items (PR #55).
- Agent: `docs/saral/AGENT_EVAL.md`, Golden B dev split, 49 conversations / 158 turns (PR #55).
- Live E2E and decisions: the live E2E report, test matrix and the 200-applicant re-decide report (2026-11-04 03:50 IST).
- Traces: the Langfuse trace review (7 cases, 2026-11-04).
- OCR: `docs/saral/OCR_BAKEOFF.md` (120 synthetic pages).

## 1. Failure taxonomy

### 1.1 Retrieval (automated)

| Failure | Count | Examples | Mitigation |
|---|---|---|---|
| Anchored chunk not in the top 5 | 24 items (baseline) → 20 (after fixes); ContextualRecall 0.796 → 0.837 | R2-AMT-02, R2-DIS-04 | Sub-query decomposition (done); next: give each collection its own slots instead of 5 shared, so one hop is not dropped |
| Multi-hop questions | ContextualRecall 0.593 → 0.657 on 41 multi-hop items; 8 of the 20 remaining misses | R2-WED-03, R2-PUR-01 | Same as above; add more multi-hop golden items |
| Gold document missing entirely | 10 → 4 items | R2-AMT-02, R2-RAT-07 | Check chunking of the rates-and-fees and privacy pages |
| Settings tuned on dev | merge settings chosen on the dev split | — | Held-out run once: {{RAG_HELDOUT}} |

### 1.2 Faithfulness (automated)

| Failure | Count | Examples | Mitigation |
|---|---|---|---|
| Qualifier dropped or widened when paraphrasing | 5 (baseline) → 7 items below 0.85 (1 below 0.5); mean 0.981 | R2-DLR-11 (biometric consent), R2-GRV-12 (alert scope) | Prompt: keep the source's qualifiers ("up to", "unless"); keep the faithfulness gate. No figure was invented in either run |

### 1.3 Abstain, refuse and clarify

| Failure | Count | Examples | Mitigation |
|---|---|---|---|
| Vague question answered instead of clarified (RAG) | 10/11 → 5/11 | R2-CLA-01, R2-CLA-03 | Agent asks one clarifying question in the borrower's language with 2-3 likely meanings (queued 2026-11-04). After: {{CLARIFY_RESULT}} |
| Over-abstain on answerable items (RAG) | 3 | R2-DOC-02, R2-LHI-04 (citation guard), R2-GRV-04 (JSON parse) | Retry once on a parse error; let the citation guard request a rewrite before abstaining |
| Request types with no intent get a generic menu (agent) | 17 turns; human review asked 9 times, handoff created once | AC-036-4 "Okay, escalate.", AC-021-2 false purpose, AC-030-2 distress | New intents: human review (creates a handoff), distress (calm reply + handoff), misrepresentation (refuse). After: {{AGENT_EVAL_RESULTS}} |
| Refuse items | 10/10 pass (RAG judge) | — | Keep the deterministic request guards |
| Guard false positives | 2 in the baseline (other-applicant, guarantee), fixed | R2-RAT-07, R2-FEE-08 | Regression items kept |

### 1.4 Hindi and Telugu

| Failure | Count | Examples | Mitigation |
|---|---|---|---|
| hi/te items with a failure tag (RAG) | 8 → 10 of 20 (hi 5/9, te 5/11); 19 of 20 in the right script | R2-LHI-03, R2-LHI-04 | Same causes as English; larger hi/te golden set |
| Script check false positive | 1 | R2-LHR-02 (romanised Hindi flagged as garbled) | Fix the script checker for romanised text |
| Intent classifier timed out (agent) | 15 turns, mostly hi/te | AC-046-1, AC-048-1 | Fast keyword pre-route for hi/te decision questions or a larger budget; optional Laya router: {{LAYA_BENCH}} |
| Small samples | 9 hi + 11 te RAG items; 7 hi + 5 te conversations | — | Treat per-language numbers as indicative |

### 1.5 Conflicting sources

| Failure | Count | Examples | Mitigation |
|---|---|---|---|
| Disagreeing sources not named | 10/11 → 9/11 below a full score | R2-AMT-01 (₹75 lakh given without the ₹55 lakh table limit) | Composer adds a fixed "sources differ" line when retrieved passages carry a known conflict tag; ZEN stays the authority |

### 1.6 Leaks (internal terms shown to the borrower)

| Failure | Count | Examples | Mitigation |
|---|---|---|---|
| Passage labels / "passage(s)" in RAG answers | 91/178 → 0/178 shown (2 in raw drafts, removed by the sanitiser) | R2-ABS-02 | `guards.sanitize_answer` on all borrower text (done) |
| Agent: any leak in a shown answer | 22/158 turns (first run, build without the sanitiser) | AC-004-3 "passages", AC-046-2 "पैसेज" | Sanitiser merged into integration; add Devanagari/Telugu forms of "passage". After: {{AGENT_EVAL_RESULTS}} |
| Agent: raw outcome codes and the policy label in templates | 5 turns | AC-038-1, AC-039-1 (ELIGIBILITY_CONDITIONS_MET, synthetic-v1) | Templates use plain outcome words (fixed on integration, D-16/D-17); re-measure |
| Agent: several reasons or a hidden flag named | 13 conversations judged unsafe | AC-013 (Bajaj 650 tied to the applicant), AC-040/041 (settlement named) | Explain from the single stored reason category, never rule names |
| Officer desk | not checked by the leak regex | — | By design: internal reasons are allowed for the Loan Officer |
| Live borrower screens | 0 leaks in the passing GUI cases | — | Keep the leak check in the E2E harness |

### 1.7 What-if

| Failure | Count | Examples | Mitigation |
|---|---|---|---|
| Session cap of 3 not enforced in the agent | 1 of 1 traced session (4th what-if answered) | Langfuse case D | Read the cap in the agent and count per session; add a span. Status: {{AGENT_FIX_STATUS}} |
| What-if ran the old v1 policy on a v2 decision, error shown as "would still not meet" | every what-if in the traced session | Langfuse case D | Simulate with the decision's own policy version; show an error as "couldn't estimate", never as a result |
| Amount and tenure not editable | endpoint accepts only the four old fields | — | Extend the what-if contract (amount, tenure, existing EMIs, income) |
| Agent asked for clarification instead of running the what-if | 2 turns | AC-005-3, AC-005-4 | Route clear what-if requests straight to the simulation |

### 1.8 Tool use (agent)

| Failure | Count | Examples | Mitigation |
|---|---|---|---|
| Decision fetched when the turn does not need it | 59 turns | policy, thanks, guarantee turns | Route first; fetch only for explain / what-if / status; cache once per conversation with a version stamp (owner decision 2026-11-04) |
| Exact tool list matches the golden | 0.456 (bar 0.95); 0.747 ignoring the prefetch | — | The routing fix above plus the handoff intent. After: {{AGENT_EVAL_RESULTS}} |
| Counter-offer reason lost | 1 traced case | Langfuse case B: "no specific reason" while the card shows "repayments too high" | Decision tool returns the reason category and the offer |
| Reply names a different reason than the card | 1 traced case | Langfuse case E: "age requirement" vs card "Other" | Reply and card read the same reason field |

### 1.9 Latency and fallbacks

| Item | Result | Mitigation |
|---|---|---|
| RAG generation latency (gateway, per item) | p50 5.9 s, p95 10.5 s, max 18.6 s (after fixes) | Production model on Groq is untested here |
| Generator / judge fallback to the backup model | 0 items in the RAG v2 run and the agent run; 1 judge call in the baseline | Every fallback use is listed in the reports |
| Classifier budget (6 s) exceeded | 15 agent turns | See 1.4 |
| Gateway outage | 502 from about 02:18 IST on 2026-11-04 | Hosted endpoint with health checks |

### 1.10 Decisions (ZEN, 200 synthetic applicants, automated via the live API)

174/200 (87.0%) match the dataset labels (2026-11-04 03:50 IST). After the ZEN gap fixes: {{ZEN_AGREEMENT}}.

| Failure | Count | Examples | Mitigation |
|---|---:|---|---|
| Input never reaches the rules, so the engine approves (contract employment D-12, residency D-13, missing EMI debits D-14) | 8 | SYN-APP-0016, 0004, 0052 | Trace each field from the portal into the ZEN inputs; a rule with no input returns INSUFFICIENT_DATA, never PASS. Status: {{ZEN_GAP_STATUS}} |
| INSUFFICIENT_DATA still approves (missing signature, D-15) | 2 | 0072, 0191 | Missing required document → more information. Status: {{ZEN_GAP_STATUS}} |
| Bureau provider error ends as ERROR (D-11) | 2 | 0023, 0142 | Treat like no-hit: manual review with a plain reason |
| Catalogue design differs from the label (accepted behaviour) | 12 | fraud → review (4), missing docs → review (2), stale report → review (2), affordability → counter-offer (2), tenure refused at input (2) | Owner signs off and the labels are updated; a stale report needs its own reason category (shows "Other") |
| Owner call needed | 2 | 0118, 0131 | Owner decides, then relabel or change the rule |
| Rules not compiled | 6 | PL-074, 075, 079, 082, 099, 127 | Compile or mark out of scope. Status: {{ZEN_GAP_STATUS}} |

### 1.11 Live GUI (59 cases)

55 GUI/live, 3 fail, 1 blocked. Agent in the frontend (A5, 64 cases): {{A5_TOTALS}}.

| Failure | Count | Examples | Mitigation |
|---|---:|---|---|
| Decision differs from the label | 3 | A3-0123 (D-13), A3-0139 and A6-MISSING (design) | As 1.10 |
| Product defects found and fixed during the run | 10 (D-02..D-10, D-04b) | counter-offer read as approved (D-06), desk form and audit log unreadable (D-08, D-09) | Fixed, CI green, verified live; kept as regression cases |
| No counter-offer accept action | 1 blocked | A4-COUNTER-ACCEPT | Accept / decline-offer action in the portal and the desk |

### 1.12 Documents and OCR (automated, synthetic pages)

| Item | Result | Mitigation |
|---|---|---|
| Field accuracy, all fields | Tesseract 65.5%, PaddleOCR mobile 75.5% (120 pages). Final: {{OCR_BENCH}} | Tesseract stays the default; PaddleOCR mobile is opt-in until deskew and parser fixes land |
| Name and date of birth | about 41-50% for every engine | Parser fixes for stacked or unlabelled names and PAN date of birth |
| Degraded bank statements | full-row read 43% (Tesseract) vs 77% (Paddle) | Deskew; AA fetch is the primary bank source |
| Signature | screening signal only (refer, never decline) | Not a verification; no claim of accuracy |

## 2. What the evals do not cover

| Gap | Why it matters | Mitigation |
|---|---|---|
| Real people, documents and bureau files | Synthetic layouts and data are cleaner than real ones | Pilot on consented, masked real cases |
| Human review of the golden sets and the judge | Both golden sets were drafted with an LLM; judge-human agreement is not measured | Review the sets; hand-label the 30 calibration items and report agreement |
| One judge vendor | Judge bias is not cross-checked | Second judge family on a sample |
| Production model | Evals used a stand-in generator, not `gpt-oss-120b` on Groq | One run on the production model |
| Held-out splits | Dev numbers can be optimistic | {{RAG_HELDOUT}}, {{AGENT_HELDOUT}} |
| Voice | Only one voice-channel conversation (text in/out) | Voice eval with audio |
| Streaming and latency SLOs | Not measured end to end | Load test on the integration stack |
| Agent eval reads an in-memory record store | Frappe reads are covered only by the live E2E | A5 live cases: {{A5_TOTALS}} |
| Dense retrieval in the agent eval | The agent eval used BM25 only to save memory | The RAG eval covers the hybrid retriever |
| Prompt injection inside retrieved passages | Not tested | Add poisoned-passage items |
| Production Frappe | Test bench only; permissions and load untested | Staging bench with production settings |
| Explanation tone | Segment tone is not yet carried onto the decision evidence (default plain style is used) | Carry the tone onto the evidence |
| Observability gaps | Guard passes, what-if count and simulation errors have no spans | Add the spans (queued 2026-11-04) |

## 3. What is solid

- RAG after the fixes passes all three bars on the dev split, with 0 shown leaks (automated).
- 55 live GUI cases pass, recorded, across 4 products and every outcome, the officer desk (approve, decline, request
  info, audit trail), KYC masking, sign-out, session expiry, resume, backend-down, 390 px and accessibility checks.
- Over-cap requests: 10 of 14 get a ₹25 lakh counter-offer; none is shown as approved.
- Prompt injection and cut-off probes in the traced cases were refused with no threshold shown.
