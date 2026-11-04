# Functional document — Loan Advisory Agent

Team Loan Rangers · VaaniLabs.AI capstone · personal loans only.
Design rationale is in [APPROACH.md](../APPROACH.md); what exists today is in [ARTEFACT.md](../ARTEFACT.md).

## 1. Purpose

A personal-loan applicant whose application was rejected usually learns only "declined". The assistant talks to that
applicant, explains the recorded decision in plain language, shows which factors and policy points the explanation
rests on, and describes a legitimate path to reapply.

**It explains; it never decides.** The decision comes from a deterministic rules engine (ZEN) run by the lender
workflow. The assistant reads the stored decision evidence and phrases it. It never approves, rejects, overrides or
edits a record, never guarantees an outcome, and never invents policy.

## 2. User and context

| Item | Definition |
|---|---|
| Primary user | A signed-in applicant whose personal-loan application has a recorded decision |
| Secondary reader | Lender support staff, who receive hand-offs and can inspect any turn through its trace |
| Channel | Text chat in the borrower portal; voice is built but is not part of the supported scope |
| Language | English (required). Hindi and Telugu are also supported; Telugu is the optional language in the brief |
| Literacy level | Low, medium or high, set on the applicant's profile; it changes wording, never facts |
| Data | All applicant data and the four thresholds are synthetic (`synthetic-v1`). Every explanation says so |

## 3. Inputs

1. **Message**: free text from the applicant, in the current conversation.
2. **Identity and application**: taken only from a 60-second signed assertion minted by the portal, never from the
   chat body. The agent will only read an application owned by the signed-in applicant.
3. **Decision evidence**: the latest stored record for that application: per-rule PASS / FAIL, the applicant's value,
   the threshold, the policy version and its hash.
4. **Policy corpus**: approved published policy and regulator text, retrieved on demand for policy questions.
5. **Conversation history**: earlier turns of the same conversation, so the applicant does not repeat themselves.

## 4. What the assistant does

| # | Capability | Behaviour | Source of truth |
|---|---|---|---|
| F1 | **Explain the decision** | States the recorded outcome and the failed checks, each with the applicant's value and the required value. Passed checks are named as not being reasons | Decision evidence |
| F2 | **Show its evidence** | Returns a decision card (rule, result, actual, threshold, policy version) and, for policy answers, citations to the passages used | Decision evidence, retrieved passages |
| F3 | **Improvement plan** | For each failed check, the smallest change that would pass it, plus general (clearly labelled) guidance. Each target is re-checked through the rules engine | Rules engine |
| F4 | **What-if** | Applicant gives a hypothetical value ("if my score were 720"). The engine re-evaluates in memory; nothing is saved and the real record is unchanged | Rules engine |
| F5 | **Policy questions** | Answers fees, grievance, KYC, prepayment and similar questions from retrieved passages only, with citations; abstains when the passages do not support an answer | Policy corpus |
| F6 | **Multi-turn memory** | Follow-ups and short questions inherit the earlier context within the conversation; conversations are isolated per applicant | Conversation thread |
| F7 | **Refuse and redirect** | Fixed replies for guarantees, overrides, record edits, other applicants' data, prompt injection, auto-submission, and requests to fake or hide information | Deterministic guards |
| F8 | **Hand off to a person** | Disputes about recorded data, data-deletion requests, manual-review cases and system failures are routed to a human, with a reference number | Hand-off queue |
| F9 | **Status handling** | Different replies when there is no decision yet, information is missing, the case is under manual review, or the application was approved | Lifecycle state |

## 5. Behaviour by kind of applicant question

| Applicant asks | Assistant does | Must not |
|---|---|---|
| "Why was my loan rejected?" | F1 with the applicant's own failed checks | Name a reason not in the record; generic credit advice |
| "What should I do?" / "Can I reapply?" | F3 plan; says plainly that it does not hold a lender-specific waiting period unless the policy provides one | Invent a waiting period or a date |
| "What if my income / score / EMI were X?" | F4 simulation, labelled hypothetical | Persist the change; present it as a decision |
| "Will you definitely approve me if…?" | Refuses the guarantee, offers the F3 plan | Promise or imply approval |
| "Approve my loan" / "change my record" | Refuses; explains who decides | Act on the record |
| "My income in the record is wrong" | Files a hand-off for a person to review | Edit the data or argue the figure |
| "What are the charges / how do I complain?" | F5 with citations | Answer without a supporting passage |
| "Who rejected my file?" / "my internal risk grade" | Says that information is not available to it | Guess |
| Another person's application | Refuses | Reveal anything |
| Out of scope (other loan types, advice on a real lender's approval odds) | Says it is outside its role | Improvise |

## 6. The brief's two situations, step by step

**"Why was my loan rejected? My salary is ₹32,000 a month and I have never missed an EMI."**
1. The assistant reads the stored evidence for this applicant's application.
2. It states the failed checks with the applicant's recorded figures against the thresholds. The applicant's stated
   salary is compared with the recorded income; it is not taken as fact. If the stated and recorded figures differ,
   the assistant says so and offers a hand-off for review.
3. A clean repayment history is acknowledged only if the evidence shows it; it is not treated as a reason to approve.

**Later: "If I clear my credit card dues this month, will you definitely approve me next time?"**
1. The guarantee guard fires before any model call. The reply states that the assistant cannot promise approval and
   does not make decisions.
2. It still returns the evidence-based plan: which recorded checks relate to the dues (for example, the share of
   income going to existing EMIs), what the simulated outcome would be, labelled as a simulation and not a decision.

## 7. Outputs

Each reply carries: the answer text; the intent and action taken (answer, clarify, refuse, hand off, simulate); a
decision card where a record exists; citations for policy answers; an improvement plan or what-if result where
relevant; a hand-off reference where one was created; guard flags; per-step timings and a trace id.

## 8. Failure and fallback behaviour

| Situation | Behaviour |
|---|---|
| Model draft fails a guard (guarantee language, ungrounded number, bad citation) | One rewrite with the flags fed back, then a template built from the same facts |
| Model slow or unavailable (per-turn deadline: text 75 s) | Template answer from the recorded facts; policy questions get a "busy, ask again" reply |
| Retrieval fails or passages do not support an answer | Abstain, no citations |
| Record store unavailable | Says it cannot reach the record and files a hand-off |
| Application not owned by the signed-in applicant, or unknown | The same refusal for both, so existence is not revealed |

## 9. Out of scope

Making or changing any decision; approving or submitting applications; real credit-bureau, KYC or payment
integration; real lender policy (the thresholds are a synthetic prototype policy); products other than personal
loans; legal or financial advice.

## 10. Acceptance criteria (measurable)

| Criterion | Pass rule |
|---|---|
| Explanation traces to the record | Every failed rule in the record is stated with the applicant's value; no reason absent from the record |
| No invented numbers | Every number in an answer comes from the record, the policy thresholds, the applicant's message or a cited passage |
| No guarantees or decisions | Zero guarantee or decision language in final answers on the boundary set |
| Boundary handling | All boundary cases refused or handed off as specified |
| Policy answers | Cited passages support the answer; unanswerable questions abstain |
| What-if integrity | Simulation equals a direct rules-engine run and the stored record is unchanged |
| Latency | Per-turn deadline respected; template returned when exceeded |

Detailed metrics, evaluation sets and results are in the evaluation framework linked from ARTEFACT.md.

## 11. Assumptions and open points for the problem owner

- No lender-specific waiting period before reapplying is defined; the assistant therefore does not state one.
- Whether the support desk wants hand-offs delivered to a real queue or system (today they go to a local queue).
- Whether Telugu is required for the final showcase or remains optional.# Functional document — Loan Advisory Agent

Team Loan Rangers · VaaniLabs.AI capstone · personal loans only.
Design rationale is in [APPROACH.md](../APPROACH.md); what exists today is in [ARTEFACT.md](../ARTEFACT.md).

## 1. Purpose

A personal-loan applicant whose application was rejected usually learns only "declined". The assistant talks to that
applicant, explains the recorded decision in plain language, shows which factors and policy points the explanation
rests on, and describes a legitimate path to reapply.

**It explains; it never decides.** The decision comes from a deterministic rules engine (ZEN) run by the lender
workflow. The assistant reads the stored decision evidence and phrases it. It never approves, rejects, overrides or
edits a record, never guarantees an outcome, and never invents policy.

## 2. User and context

| Item | Definition |
|---|---|
| Primary user | A signed-in applicant whose personal-loan application has a recorded decision |
| Secondary reader | Lender support staff, who receive hand-offs and can inspect any turn through its trace |
| Channel | Text chat in the borrower portal; voice is built but is not part of the supported scope |
| Language | English (required). Hindi and Telugu are also supported; Telugu is the optional language in the brief |
| Literacy level | Low, medium or high, set on the applicant's profile; it changes wording, never facts |
| Data | All applicant data and the four thresholds are synthetic (`synthetic-v1`). Every explanation says so |

## 3. Inputs

1. **Message**: free text from the applicant, in the current conversation.
2. **Identity and application**: taken only from a 60-second signed assertion minted by the portal, never from the
   chat body. The agent will only read an application owned by the signed-in applicant.
3. **Decision evidence**: the latest stored record for that application: per-rule PASS / FAIL, the applicant's value,
   the threshold, the policy version and its hash.
4. **Policy corpus**: approved published policy and regulator text, retrieved on demand for policy questions.
5. **Conversation history**: earlier turns of the same conversation, so the applicant does not repeat themselves.

## 4. What the assistant does

| # | Capability | Behaviour | Source of truth |
|---|---|---|---|
| F1 | **Explain the decision** | States the recorded outcome and the failed checks, each with the applicant's value and the required value. Passed checks are named as not being reasons | Decision evidence |
| F2 | **Show its evidence** | Returns a decision card (rule, result, actual, threshold, policy version) and, for policy answers, citations to the passages used | Decision evidence, retrieved passages |
| F3 | **Improvement plan** | For each failed check, the smallest change that would pass it, plus general (clearly labelled) guidance. Each target is re-checked through the rules engine | Rules engine |
| F4 | **What-if** | Applicant gives a hypothetical value ("if my score were 720"). The engine re-evaluates in memory; nothing is saved and the real record is unchanged | Rules engine |
| F5 | **Policy questions** | Answers fees, grievance, KYC, prepayment and similar questions from retrieved passages only, with citations; abstains when the passages do not support an answer | Policy corpus |
| F6 | **Multi-turn memory** | Follow-ups and short questions inherit the earlier context within the conversation; conversations are isolated per applicant | Conversation thread |
| F7 | **Refuse and redirect** | Fixed replies for guarantees, overrides, record edits, other applicants' data, prompt injection, auto-submission, and requests to fake or hide information | Deterministic guards |
| F8 | **Hand off to a person** | Disputes about recorded data, data-deletion requests, manual-review cases and system failures are routed to a human, with a reference number | Hand-off queue |
| F9 | **Status handling** | Different replies when there is no decision yet, information is missing, the case is under manual review, or the application was approved | Lifecycle state |

## 5. Behaviour by kind of applicant question

| Applicant asks | Assistant does | Must not |
|---|---|---|
| "Why was my loan rejected?" | F1 with the applicant's own failed checks | Name a reason not in the record; generic credit advice |
| "What should I do?" / "Can I reapply?" | F3 plan; says plainly that it does not hold a lender-specific waiting period unless the policy provides one | Invent a waiting period or a date |
| "What if my income / score / EMI were X?" | F4 simulation, labelled hypothetical | Persist the change; present it as a decision |
| "Will you definitely approve me if…?" | Refuses the guarantee, offers the F3 plan | Promise or imply approval |
| "Approve my loan" / "change my record" | Refuses; explains who decides | Act on the record |
| "My income in the record is wrong" | Files a hand-off for a person to review | Edit the data or argue the figure |
| "What are the charges / how do I complain?" | F5 with citations | Answer without a supporting passage |
| "Who rejected my file?" / "my internal risk grade" | Says that information is not available to it | Guess |
| Another person's application | Refuses | Reveal anything |
| Out of scope (other loan types, advice on a real lender's approval odds) | Says it is outside its role | Improvise |

## 6. The brief's two situations, step by step

**"Why was my loan rejected? My salary is ₹32,000 a month and I have never missed an EMI."**
1. The assistant reads the stored evidence for this applicant's application.
2. It states the failed checks with the applicant's recorded figures against the thresholds. The applicant's stated
   salary is compared with the recorded income; it is not taken as fact. If the stated and recorded figures differ,
   the assistant says so and offers a hand-off for review.
3. A clean repayment history is acknowledged only if the evidence shows it; it is not treated as a reason to approve.

**Later: "If I clear my credit card dues this month, will you definitely approve me next time?"**
1. The guarantee guard fires before any model call. The reply states that the assistant cannot promise approval and
   does not make decisions.
2. It still returns the evidence-based plan: which recorded checks relate to the dues (for example, the share of
   income going to existing EMIs), what the simulated outcome would be, labelled as a simulation and not a decision.

## 7. Outputs

Each reply carries: the answer text; the intent and action taken (answer, clarify, refuse, hand off, simulate); a
decision card where a record exists; citations for policy answers; an improvement plan or what-if result where
relevant; a hand-off reference where one was created; guard flags; per-step timings and a trace id.

## 8. Failure and fallback behaviour

| Situation | Behaviour |
|---|---|
| Model draft fails a guard (guarantee language, ungrounded number, bad citation) | One rewrite with the flags fed back, then a template built from the same facts |
| Model slow or unavailable (per-turn deadline: text 75 s) | Template answer from the recorded facts; policy questions get a "busy, ask again" reply |
| Retrieval fails or passages do not support an answer | Abstain, no citations |
| Record store unavailable | Says it cannot reach the record and files a hand-off |
| Application not owned by the signed-in applicant, or unknown | The same refusal for both, so existence is not revealed |

## 9. Out of scope

Making or changing any decision; approving or submitting applications; real credit-bureau, KYC or payment
integration; real lender policy (the thresholds are a synthetic prototype policy); products other than personal
loans; legal or financial advice.

## 10. Acceptance criteria (measurable)

| Criterion | Pass rule |
|---|---|
| Explanation traces to the record | Every failed rule in the record is stated with the applicant's value; no reason absent from the record |
| No invented numbers | Every number in an answer comes from the record, the policy thresholds, the applicant's message or a cited passage |
| No guarantees or decisions | Zero guarantee or decision language in final answers on the boundary set |
| Boundary handling | All boundary cases refused or handed off as specified |
| Policy answers | Cited passages support the answer; unanswerable questions abstain |
| What-if integrity | Simulation equals a direct rules-engine run and the stored record is unchanged |
| Latency | Per-turn deadline respected; template returned when exceeded |

Detailed metrics, evaluation sets and results are in the evaluation framework linked from ARTEFACT.md.

## 11. Assumptions and open points for the problem owner

- No lender-specific waiting period before reapplying is defined; the assistant therefore does not state one.
- Whether the support desk wants hand-offs delivered to a real queue or system (today they go to a local queue).
- Whether Telugu is required for the final showcase or remains optional.
