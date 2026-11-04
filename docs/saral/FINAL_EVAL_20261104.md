# Saral final evaluation, 2026-11-04

All times IST (UTC+05:30). All data is synthetic. Labels: **automated** = scripted run, LLM-judged where a metric
needs it, no human review. Raw per-turn outputs, judge rows and run scripts are kept outside the repository (they
contain gateway addresses); the numbers below are copied from those run reports.

Pass bars (ADR-0009): RAG faithfulness ≥ 0.85, answer relevancy ≥ 0.80, contextual recall ≥ 0.80; agent 0 leaks,
role adherence ≥ 0.90, tool correctness ≥ 0.95.

## 1. Models used

| Role | Model | Fallback | Use in the final agent runs |
|---|---|---|---|
| Answer generator (shipped default) | `antigravity/gemini-3.8-flash` via OmniRoute | `antigravity/claude-sonnet-4-6` via OmniRoute | dev: 84 calls, 0 fallback; held-out: 21 calls, 0 fallback |
| Judge | `antigravity/gemini-3.8-flash` via OmniRoute (**same model as the generator**) | `codex/gpt-6-luna` via OmniRoute | dev: 221 of 256 rows Gemini only, 35 rows used the fallback; held-out: 105 Gemini calls, 5 fallback calls |
| Intent classifier | Groq `openai/gpt-oss-120b` | Groq `gpt-oss-20b` → OmniRoute `gemini-3.5-flash-lite` → rules | dev: 33 turns hit the Groq free-tier limit (429) and were classified by 20b; held-out: 0 limit hits |
| Policy retrieval in the agent eval | BM25 in process | — | dense retrieval is covered by the RAG eval |

Code: `saral/integration` at 6fa17c1 (#56 at b9b017f merged in), harness on #55.

## 2. Agent, dev split (Golden B, 49 conversations, 158 turns), automated

Generate 13:53–13:59, judge 13:59–14:39 (the sandbox rebooted at about 14:33; the run resumed and skipped scored
rows; 256/256 rows scored, 0 errors).

| Metric | Bar | First run (pre-fix build) | River DeepSeek run (superseded) | **Final: Gemini 3.8 Flash** | Verdict |
|---|---|---|---|---|---|
| No-leak conversations | 49/49 | 30/49 | 48/49 | **48/49** | FAIL |
| Leak turns | 0 | 22/158 | 1/158 | **1/158** (AC-009 turn 2) | FAIL |
| Role adherence (mean) | ≥ 0.90 | 0.464 | 0.695 (n=48) | **0.680** | FAIL |
| Tool correctness, exact | ≥ 0.95 | 0.456 | 0.867 | **0.835** | FAIL |
| Tool correctness, lenient | (≥ 0.95) | 0.939 | 0.951 | **0.937** | FAIL |
| Expected behaviour, pass@0.5 | — | 0.563 | 0.726 | **0.658** | — |
| Borrower-safe disclosure | — | — | — | 0.988 | — |

- The River DeepSeek run (generator `deepseek-ai/DeepSeek-V4.1-Flash`, judge Kimi-K3 with GLM-5.3 and gpt-6-luna
  fallbacks) is **superseded**: River returned HTTP 402 (out of funds) from about 12:58, so the shipped default became
  Gemini 3.8 Flash. Its numbers are shown for comparison only.
- Weakest categories (Gemini): policy turns (tool exact 0.536, expected behaviour 0.214), leak probes (expected
  behaviour 0.647), improve (role 0.562). Lowest role adherence: AC-021 and AC-044 (0.0).
- The one leak turn, AC-009 turn 2, quotes a public figure the golden answer itself contains (a golden conflict);
  the strict regex counts it.

## 3. Agent, held-out split (11 conversations, 33 turns), automated, single run

Run 14:55–15:00 on the same build, after the owner's go. **Disclosure:** the held-out conversation ids were visible
to reviewers in the golden review sheet from 07:42 IST; no code was tuned on them, and the owner chose to proceed.

| Metric | Bar | Dev (Gemini) | **Held-out** | Verdict |
|---|---|---|---|---|
| No-leak conversations | 11/11 | 48/49 | **10/11** | FAIL |
| Leak turns | 0 | 1/158 | **1/33** | FAIL |
| Role adherence | ≥ 0.90 | 0.680 | **0.750** | FAIL |
| Tool correctness, exact | ≥ 0.95 | 0.835 | **0.788** | FAIL |
| Tool correctness, lenient | (≥ 0.95) | 0.937 | **0.909** | FAIL |
| Expected behaviour, pass@0.5 | — | 0.658 | **0.697** | — |

- The leak: AC-014 turn 2 quotes Bajaj Finance's public "650" credit-score guidance, which the question asks for and
  the expected answer contains. It is not tied to the applicant, but the strict regex counts it.
- By language: EN 9 conversations (role 0.731, tool exact 0.741); HI 1 (role 0.667, tool 1.0); TE 1 (role 1.0,
  tool 1.0). Samples this small are indicative only.

## 4. RAG

- **Held-out (49 items): not run** (owner decision 2026-11-04 14:49 IST: no new RAG eval).
- A Gemini-generated, Gemini-judged dev run was started and stopped by the same decision (49 of about 636 judge jobs
  scored); its partial files are kept unreported and no number is taken from them.
- **Reported RAG numbers: the earlier dev run** (178 items; generator `claude-sonnet-4-6`, judge `gpt-6-luna`;
  DEEPEVAL_BASELINE §11 on #55). **The shipped answer model is Gemini 3.8 Flash, which these numbers did not measure.**

| Metric | Bar | Dev (Sonnet generator) | Verdict |
|---|---|---|---|
| Faithfulness | ≥ 0.85 | 0.981 | pass |
| Answer relevancy | ≥ 0.80 | 0.960 | pass |
| Contextual recall | ≥ 0.80 | 0.837 | pass |
| Contextual precision | — | 0.897 | — |
| Shown leaks | 0 | 0/178 | pass |

Weakest area: multi-hop questions, contextual recall 0.657 on 41 items. Vague questions answered with a clarifying
question: 6/11.

A partial River DeepSeek RAG run (not final) scored 1/178 on the strict leak word list: R2-KYC-03 quotes Bajaj's
public KYC consent wording containing "retrieve". No passage labels were shown.

## 5. Intent classifier (140 dev agent turns, automated)

| Classifier | Accuracy | EN | HI | TE | Turns over the time budget |
|---|---|---|---|---|---|
| Before: OmniRoute `claude-sonnet-4-6`, 6 s budget | 116/140 (82.9%) | 92/106 | 12/19 | 12/15 | 88 |
| **Chosen: Groq `gpt-oss-120b`, 1 worker** | **135/140 (96.4%)** | 102/106 | 19/19 | 14/15 | 0 |

Groq's free tier allows 8,000 tokens per minute per model, so concurrent load falls down the chain (20b, then the
gateway, then rules).

## 6. Optional fast intent router (Laya), automated

Fine-tuned Laya (rlcd) in front of the classifier, 140 dev turns: hybrid 118/140 (84.3%) vs the classifier path of
that run 116/140 (82.9%), +1.4 points against a +2.0 gate fixed before the run. **Gate failed; the router ships off**
(#57, flag `SARAL_LAYA_ROUTER_URL` unset). Zero-shot Laya scored 51.8% on dev items.

## 7. Decisions and OCR (automated)

- **ZEN label agreement, 200 synthetic applicants (group B):** 187/200 offline after the gap fixes; 188/200 with the
  owner's SYN-APP-0131 ruling (its dataset label is superseded), plus 12 catalogue design choices the owner accepted
  as intended. 0 open defects. Before the fixes: 174/200 (87.0%) on the live API at 03:50 IST.
- **OCR, public sample documents:** 46 public specimen, sample and third-party synthetic documents (no real person's
  ID), 184 pages including phone-style variants, single annotator. All fields correct, Tesseract vs PaddleOCR: PAN 4%
  vs 58%, Aadhaar 62% vs 98%, bank statement 6% vs 48%, payslip 51% vs 79%. PaddleOCR median 0.52 s, p90 5.96 s per
  page. Six of the sources carry no licence, so the images are internal only and are not in the repository.
