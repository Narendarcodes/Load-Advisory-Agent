# Functional document — Saral (Loan Advisory Agent)

Team Loan Rangers · VaaniLabs.AI capstone · personal loans only.
First written by Syed Imaaduddin (PR #51); updated on 2026-11-04 to the final Saral system.
Design rationale and build-vs-reuse: [APPROACH.md](../APPROACH.md). What exists and how to run it:
[README.md](../README.md). Architecture: [architecture.drawio.svg](architecture.drawio.svg) and
[saral/ARCHITECTURE.md](saral/ARCHITECTURE.md). Demo: [DEMO_GUIDE.md](DEMO_GUIDE.md).

## A. Understanding of the problem

A personal-loan applicant who is declined, offered less, or held for review usually learns little more than the
outcome. They do not know which part of their profile mattered, what they can legitimately do next, or whether the
lender's published rules apply to them. Many applicants are first-time or low-literacy borrowers and prefer Hindi or
Telugu. The brief: explain the decision in plain language with a concrete, legitimate path forward, and evaluate the
system honestly (correctness, failure cases, limitations, metrics).

What the system must not do: approve or reject on its own, replace the decision engine, invent reasons, thresholds or
waiting periods, guarantee approval, change application facts, or present synthetic policy as a real lender's.

## B. Domain context: the current lending process and its challenges

| Step today (NBFC personal loan) | Challenge for the borrower | Challenge for the lender |
|---|---|---|
| Online form, KYC (PAN, Aadhaar), consent to a bureau pull and a bank-statement fetch (account aggregator) | Long forms; unclear why each item is needed | Incomplete or mismatched documents; manual checking |
| Bureau report and rules (credit score, delinquency, enquiries, FOIR / affordability, income, employment) | Outcome arrives as "declined" or an SMS | Rules are internal; explaining them risks gaming and disclosure of thresholds |
| Counter-offers and manual review | A smaller amount or a delay with no reason given | Officers re-read files to explain them |
| Regulation | — | RBI requires banks to give the main rejection reasons in writing; the NBFC Fair Practices Code has no such clause, so NBFC explanations are a product choice, not a duty |

Saral follows the public documents of one NBFC, **Bajaj Finance Ltd, as a public reference lender, not a partner**.
Its published numbers are indicative guidance only; Saral's own prototype rules (catalogue v2,
`prototype_synthetic`, ADR-0011) decide.

## C. Proposed interventions

1. **ZEN decides, the agent explains.** A deterministic ZEN rules engine (one JSON rule catalogue, 130 rules) decides
   approve / counter-offer / decline / more information / manual review and sizes the offer. The agent only reads
   the stored decision.
2. **One plain reason, no cut-offs.** The borrower hears the main reason category (for example "repayments too
   high" or "credit history") and 2-3 general next steps, never a threshold or a rule number (reason disclosure
   policy, ADR-0006).
3. **Safe what-if.** Up to 3 estimates per session on amount, tenure, existing EMIs or income, run through ZEN in
   memory, answered only as "would likely meet" or "wouldn't meet", and never saved.
4. **Cited policy answers.** General questions are answered from Bajaj and RBI documents with sources, labelled as
   general guidance and never tied to the applicant's own case.
5. **Own language and literacy.** English, Hindi and Telugu, native script or romanised; customer segmentation picks
   how to explain (Guided, Simple, Standard, Detailed), never what.
6. **A person when it matters.** Fraud or list hits, missing documents, stale bureau data and disputes go to a Loan
   Officer in the Frappe desk; the borrower can ask for a person at any time.
7. **Honest evaluation.** Golden datasets, DeepEval metrics, deterministic leak checks and published limitations
   ([project-management/AGENT_LIMITATIONS.md](../project-management/AGENT_LIMITATIONS.md)).

## D. High-level user journey

**Borrower**
1. Signs in to the Saral portal (served by Frappe) and picks one of four purposes: wedding, higher education, home
   renovation or medical emergency.
2. Fills a short form (7 steps, English), consents to a credit check, KYC and a bank-statement fetch, and uploads
   documents (OCR suggests values; the borrower confirms).
3. The decision runner calls the synthetic KYC / bank / bureau services and ZEN, and stores the decision evidence.
4. Sees a decision card: outcome, amount, EMI and tenure.
5. Opens the assistant: asks why, what to do next, a what-if, or a policy question, in their language; or asks for a
   person, which creates a handoff.

**Loan Officer**
1. Signs in to the built-in Frappe desk with the Loan Officer role.
2. Works the manual-review queue with internal reasons visible.
3. Approves, declines or requests information; every action is in the audit trail (ADR-0008).

## E. Tech and agentic construct

| Part | What it is |
|---|---|
| **Frappe Lending** | System of record: applications, documents, decision evidence and snapshot, audit log; the Saral portal app and the officer desk |
| **ZEN rules engine** | The only decision authority; rule catalogue v2 compiled to a ZEN decision model; what-if runs it in memory |
| **LangGraph agent** (FastAPI) | One graph: authenticate the 60-second signed assertion, request guards, classify, read the stored decision only when the turn needs it (cached per conversation), explain / improve / what-if / policy / clarify / handoff, compose, answer guards and sanitiser. No write path |
| **Intent classifier chain** | Groq `gpt-oss-120b` → Groq `gpt-oss-20b` → OmniRoute `gemini-3.5-flash-lite` → regex / rules (96.4% on 140 dev turns) |
| **Answer model** | Gemini 3.8 Flash via an OmniRoute OpenAI-compatible gateway, Claude Sonnet 4.6 as fallback |
| **RAG** | Qdrant collections `saral_nbfc_policy` (Bajaj) and `rbi_regulatory` (RBI), EmbeddingGemma dense + BM25, weighted RRF, optional reranker; ZEN rules are never indexed |
| **OCR** | PaddleOCR PP-OCRv5 mobile by default with Tesseract as automatic fallback, field parsers and masking; signature screening is a refer-only signal |
| **Synthetic services** | Bureau, PAN / Aadhaar KYC and account-aggregator bank fetch; none of them is real |
| **Langfuse** | Self-hosted tracing of every turn and tool; message text is exported only when content capture is switched on |
| **DeepEval** | RAG (faithfulness, relevancy, recall) and agent (role adherence, tool correctness) evaluation, plus leak regexes |

---

The sections below are the functional specification, kept in the original structure.

## 1. Purpose

A personal-loan applicant usually learns only the outcome. The assistant talks to that applicant, explains the
recorded decision in plain language, and describes legitimate next steps.

**It explains; it never decides.** The decision comes from the ZEN rules engine run by the decision pipeline. The
assistant reads the stored decision evidence and phrases it. It never approves, rejects, overrides or edits a record,
never guarantees an outcome, and never invents policy.

## 2. User and context

| Item | Definition |
|---|---|
| Primary user | A signed-in salaried applicant whose personal-loan application has a recorded decision |
| Secondary user | Loan Officer in the Frappe desk, who works manual-review cases and receives handoffs; any turn can be inspected through its trace |
| Channel | Text chat in the Saral portal (voice was built earlier but is not part of the supported scope) |
| Language | English, Hindi and Telugu, in native script or romanised; replies come in the borrower's language |
| Explanation style | Chosen by customer segmentation from the bureau record (Guided, Simple, Standard, Detailed); it changes wording, never facts |
| Data | All applicant data is synthetic; thresholds are a prototype (`prototype_synthetic`, catalogue v2, policy `synthetic-v2`). Every explanation carries the synthetic-policy label |

## 3. Inputs

1. **Message**: free text from the applicant, in the current conversation.
2. **Identity and application**: taken only from a 60-second signed assertion minted by Frappe, never from the chat
   body. The agent reads only an application owned by the signed-in applicant.
3. **Decision evidence**: the stored record for that application: outcome, reason categories, offer (amount, EMI,
   tenure), policy version and hashes. Rule-level detail stays internal.
4. **Policy corpus**: Bajaj Finance public documents and RBI directions, retrieved on demand for policy questions.
5. **Conversation history**: earlier turns of the same conversation.

## 4. What the assistant does

| # | Capability | Behaviour | Source of truth |
|---|---|---|---|
| F1 | **Explain the decision** | States the recorded outcome and the one main reason category in plain words; never a threshold, a rule number or the applicant's value against a cut-off | Decision evidence |
| F2 | **Show its evidence** | A minimal decision card (outcome, amount, EMI, tenure) and, for policy answers, citations to the sources used | Decision evidence, retrieved passages |
| F3 | **Next steps** | 2-3 general, legitimate steps, with no numeric targets | Decision evidence |
| F4 | **What-if** | Hypothetical amount, tenure, existing EMIs or income; ZEN re-evaluates in memory; answer is "would likely meet" or "wouldn't meet", labelled "Estimate only, your application is unchanged"; at most 3 per session; credit score and job months are refused | Rules engine |
| F5 | **Policy questions** | Answers from retrieved passages only, with citations, as indicative general guidance; abstains when unsupported | Policy corpus |
| F6 | **Clarify** | A vague message gets one clarifying question in the borrower's language with 2-3 likely meanings | Classifier |
| F7 | **Refuse and redirect** | Fixed replies for guarantees, overrides, record edits, other applicants' data, prompt injection, auto-submission, misrepresentation, and threshold probes | Deterministic guards |
| F8 | **Hand off to a person** | Disputes, requests for a person, distress (calm reply plus handoff) and system failures create a handoff for the Loan Officer | Handoff queue |
| F9 | **Status handling** | Different replies for no decision yet, more information needed, manual review, counter-offer and approval | Lifecycle state |

## 5. Behaviour by kind of applicant question

| Applicant asks | Assistant does | Must not |
|---|---|---|
| "Why was my loan rejected?" | F1 with the recorded reason category | Name a reason not in the record; reveal a cut-off |
| "What should I do?" / "Can I reapply?" | F3 steps; says it holds no lender waiting period unless the policy provides one | Invent a waiting period or a date |
| "What if my income / EMI / amount were X?" | F4 estimate, labelled | Persist the change; present it as a decision |
| "What score do I need?" | Refuses to give an internal threshold; may cite Bajaj's public guidance as general information | Tie a published number to the applicant |
| "Will you definitely approve me if…?" | Refuses the guarantee, offers F3 | Promise or imply approval |
| "Approve my loan" / "change my record" | Refuses; explains who decides | Act on the record |
| "My income in the record is wrong" / "I want a person" | Creates a handoff | Edit the data or argue |
| "What are the charges / how do I complain?" | F5 with citations | Answer without a supporting passage |
| Another person's application | Refuses | Reveal anything |
| Out of scope (other loan types, self-employed) | Says it is outside what Saral offers | Improvise |

## 6. The brief's two situations, step by step

**"Why was my loan rejected? My salary is ₹32,000 a month and I have never missed an EMI."**
1. The assistant reads the stored decision for this applicant's application.
2. It states the outcome and the main reason category in plain words. The stated salary is not taken as fact; if it
   seems to differ from the record, the assistant offers a handoff for review.
3. A clean repayment history is acknowledged only if the record supports it.

**Later: "If I clear my credit card dues this month, will you definitely approve me next time?"**
1. The guarantee guard fires before any model call: the assistant cannot promise approval and does not decide.
2. It offers general next steps and, if asked, a what-if on existing EMIs, labelled as an estimate.

## 7. Outputs

Each reply carries: the answer text; the intent and action (answer, clarify, refuse, hand off, simulate); a minimal
decision card where a record exists; citations for policy answers; a what-if estimate where relevant; a handoff
reference where one was created; guard flags; timings and a trace id.

## 8. Failure and fallback behaviour

| Situation | Behaviour |
|---|---|
| Draft fails a guard (guarantee language, ungrounded number, internal term, bad citation) | One rewrite with the flags fed back, then a template from the same facts; the sanitiser removes internal labels |
| Answer model slow or unavailable | Sonnet fallback, then a template from the recorded facts; policy questions get "busy, ask again" |
| Classifier rate-limited or slow | Next model in the chain, then rules |
| Retrieval fails or passages do not support an answer | Abstain, no citations |
| What-if cannot be computed | "Couldn't be estimated", never "would not meet" |
| Application not owned by the signed-in applicant, or unknown | The same refusal for both |

## 9. Out of scope

Making or changing any decision; approving or submitting applications; real bureau, KYC or payment integration;
real lender policy; products other than salaried personal loans in four purposes; legal or financial advice.

## 10. Acceptance criteria (measurable)

| Criterion | Pass rule (ADR-0009) | Final result (2026-11-04) |
|---|---|---|
| No leaks of internal terms or thresholds | 0 leak turns | Agent dev 1/158, held-out 1/33 (public Bajaj figure the golden asks for); RAG 0/178 |
| Role adherence | ≥ 0.90 | Dev 0.680, held-out 0.750 (fail) |
| Tool correctness | ≥ 0.95 | Dev exact 0.835, held-out 0.788 (fail) |
| RAG faithfulness / relevancy / recall | ≥ 0.85 / 0.80 / 0.80 | 0.981 / 0.960 / 0.837 on dev (earlier generator) |
| What-if integrity | Record unchanged; no write endpoint called | Covered by tests |
| Decisions | ZEN result matches the dataset label or an accepted design choice | 188/200 plus 12 accepted design choices; 0 open defects |

Full numbers and disclosures (the judge is the same model as the generator):
[saral/FINAL_EVAL_20261104.md](saral/FINAL_EVAL_20261104.md).

## 11. Assumptions and open questions

- No lender-specific waiting period before reapplying is defined; the assistant does not state one.
- Handoffs go to the Loan Officer queue in the Frappe desk; a production escalation channel is not built.
- There is no counter-offer accept action yet.
- Hindi and Telugu samples in the evaluation are small; per-language numbers are indicative.
