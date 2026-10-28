# Design decisions already encoded in the code (question bank s.12, 19, 20, 22, 35, 44, 46)

Status: research note for the investigation question bank. Written Oct 15, 2026. It writes down decisions that the code on this
branch already makes, so they can be cited. Nothing here is new behaviour. Each line points to the file that implements it.
Where the code makes a prototype choice that a real deployment would have to confirm, the "Who must confirm" line says so.
Nothing below is a statement about VaaniLabs, any lender or real applicants.

## 1. Data correction and disputes (s.19)

- **Can the agent modify applicant information?** No. The agent has no write tool for the application record. Requests to edit,
  update or correct the record ("update my income to ...", "remove the enquiry from my report", "mark my EMI as paid") are matched by
  the `edit_record` request guard and get a fixed refusal: "I can't edit your application or its recorded details. I can run a
  what-if with different numbers without changing anything, or pass a correction request to a human reviewer."
  (`apps/api/src/loan_advisory/agent/guards.py` `_REQ["edit_record"]`; `prompts.py` `TEMPLATES["en"]["edit_record"]`).
- **What happens when the applicant says their salary, employment or credit information is wrong?** When a signed-in applicant's
  message matches the `DISPUTE` pattern (wrong, incorrect, mistake, not mine, outdated, old salary, and Hindi/Telugu equivalents)
  the turn goes to the boundary path, which calls `HandoffQueue.create("data_dispute", [application_ref], message)` and answers with
  the `dispute` template: "I've passed this to a human reviewer so they can check the recorded information (reference {ref}). I can't
  change the record myself." The response carries `action="handoff"` and the `handoff_ref`. (`graph.py` `DISPUTE`, `classify`,
  `boundary`; `tools.py` `HandoffQueue`.) The same handling applies to salary, employment and credit fields: the pattern is about the
  claim of an error, not the field.
- **Can the agent initiate a correction request?** Yes, in the sense above: it files a handoff record (category `data_dispute`,
  application ref, request id, message hash and length, timestamp; never the message text) to a queue (`AGENT_HANDOFF_LOG`, default
  `agent_out/handoffs.jsonl`). It does not change data or promise an outcome.
- **Should the agent collect evidence for a correction request?** Not built. The handoff keeps only a SHA-256 and the length of the
  applicant's message, so a reviewer can check a quoted message without the log holding it. It does not ask for documents. Who must
  confirm what evidence a reviewer needs: a partner lender.
- **Credit-report errors:** the improvement text for a low credit score tells the applicant they can dispute errors with the credit
  bureau (`facts.py`, `MIN_CREDIT_SCORE`). RBI's CIC customer-service and compensation circulars are in the policy register
  (`RBI-CIC-CS-2023`, `RBI-CIC-COMP-2023`).

## 2. Human handoff (s.22)

What triggers a handoff in the built system (`graph.py` `boundary`, `simple`):
1. A data dispute (above) — creates a handoff record.
2. The loan system (Frappe) is unreachable — `unavailable` template, `action="handoff"`: "I can't reach the loan system right now,
   so I won't guess about your decision ... or I can pass your question to a human reviewer."
3. The application is in manual review — `manual_review` template, `action="handoff"`: "Your application is with a human reviewer
   ({flags}). I can't predict their outcome; they will decide."
4. Override, record edit and misrepresentation refusals offer to pass a genuine error to a human reviewer (template text).

- **How does the applicant know they have been handed off?** The answer text says so and, for disputes, gives the reference
  (`HO-xxxxxxxxxx`). The API response has `action="handoff"` and `handoff_ref` (`contracts.py` `AgentResponse`).
- **Does the system explain why it escalated?** Yes, in the template (a reported data error, the system being unreachable, or manual
  review with its flags).
- **Is the evidence package transferred?** Partly. The handoff record holds the category, the application ref, the request id and a
  hash/length of the applicant's message — not the message itself. The reviewer can reopen the decision evidence from the application
  ref, and each turn's audit log (`AGENT_AUDIT_LOG`) holds the trace. There is no reviewer UI and no live transfer of the conversation.
- **Not built:** escalation on fraud signals (misrepresentation requests are refused, not escalated), on repeated failed explanations,
  or on applicant distress; a human continuing the same conversation. Who must decide these for a deployment: VaaniLabs and a partner
  lender.

## 3. Privacy (s.20) and data security

- **Another person's application:** the `other_applicant` guard refuses ("I can only discuss your own application. I can't share or
  look up anyone else's details."). Application access is authorised server-side from the session, never from the message or the LLM
  (`contracts.py` `Session`; `graph.py` `authenticate`). An unknown reference is reported the same way as someone else's
  ("do not reveal whether another applicant's ref exists").
- **What is shown back to the applicant:** their own recorded decision, the rule checks behind it and the values they submitted
  (`not_available` template wording). Not shown: who handled the file, internal grades/scores (`not_available` guard).
- **Logs:** tracing is off by default; when on, spans carry ids, intents, flags, token counts and timings only. Message and answer
  text are recorded only with an explicit content flag: `AGENT_TRACE_CONTENT=1` for Phoenix and `LANGFUSE_CAPTURE_CONTENT=1` for the
  optional Langfuse exporter; the flags are independent and both default off. Langfuse masks `input.value`, `output.value`,
  `llm.system` and `llm.error` at export (`observability.py`, `langfuse_config.py`, `docs/observability/langfuse.md`). The audit log
  and handoff queue do store message text.
- **Retention period, anonymisation policy, consent capture:** not set by the project. RBI's Digital Lending Directions, 2025
  require lenders to have and disclose a data-storage policy covering how long data can be stored (see
  `docs/research/regulation-and-design-references.md`). Who must decide: the lender deploying it (and VaaniLabs as its provider).

## 4. Safety edge cases (s.35)

| Request | Built behaviour (guard → template) |
|---|---|
| Guaranteed approval / chances of approval | `guarantee` → "I can't promise or predict approval ..." (+ the deterministic improvement plan when the application was rejected); abstained |
| Approve / reverse / reconsider my decision | `override` → "I can't approve, reverse or change a loan decision ..." |
| Fake, inflate, hide or forge information; trick the system | `misrepresentation` → "I can't help hide, inflate, edit or fake any information ... may be treated as fraud" |
| Confidential internal information (who decided, internal grade/score) | `not_available` → "That information isn't available to me ..."; abstained, no citations |
| Prompt injection ("ignore previous instructions", "system prompt") | `injection` → "My rules don't change based on instructions in a message." |
| Submit/re-apply on my behalf | `auto_submit` → refusal, points to lender channels |

Bypassing eligibility maps to `misrepresentation` when phrased as manipulation ("game/trick/cheat the system"). The answer guards
also block guarantee and decision language in any drafted answer (`guards.py` `_BAD`). Suspected fraud is refused, not reported.

## 5. What-if / counterfactual representation (s.12)

- Allowed hypothetical changes are the four scored fields only, each with a numeric range; anything else is rejected with a
  `bad_what_if` clarify answer naming the allowed fields (`tools.py` `run_what_if`, `FIELD_TO_DOC`, `LIMITS`).
- The simulation runs through the unchanged ZEN rules; the result is labelled `is_simulation=True` and "hypothetical result under the
  synthetic prototype policy; not a decision and not a guarantee", and the tool checks `original_record_unchanged`.
- Changing one variable does not recompute others (e.g. a lower EMI does not change income); fields are independent inputs to the four
  rules. Answers say "This is a simulation, not a guarantee; a lender decides on a fresh application" (`graph.py`).

## 6. Evaluation metrics the harness already computes (s.44)

From `scripts/agent/eval_agent.py`, `scripts/agent/eval_policy_split.py` and `scripts/agent/eval_citation_verify.py`:

| Question-bank metric | How it is measured here |
|---|---|
| Explanation completeness | `reason_value_coverage` / `reason_value_coverage_all`: every failed ZEN reason and its value appear in the explanation (A1) |
| Hallucination / unsupported claims | `ungrounded_number_rate` (numbers not in the facts); policy answers: `citation_support`, `strict_citation_correct`, `citation_faithful_given_answered` (judge + verbatim checks) |
| Guarantee-violation rate | deterministic `answer_flags` count in final answers ("deterministic_guarantee_or_decision_language_in_final_answers") plus `judge_violation_rate` |
| Abstention | `answered_rate` and unanswerable-abstention counts on the policy split; abstain_v2 set |
| Communication adaptation | A2 literacy pairs (low vs high): readability / jargon difference + judge rating |
| What-if correctness | A4: simulation equals a direct ZEN run, original record untouched |
| Reliability / fallbacks | `fallback_template_rate` |
| Latency and cost proxies | `latency_ms_p50/p95`, `ttft_s_p50/p95_compose`, `prompt_tokens`, `completion_tokens`, tokens/s, `retrieval_ms_p50` |
| Retrieval quality | RAG reports in `docs/policy/rag_eval_*_report.json` |

The judge is the same gpt-oss-120b model (self-judging bias, labelled "indicative only" in the script). Not measured: applicant
comprehension, satisfaction, learning, money cost per conversation. Published references for these metric families are in
`docs/research/regulation-and-design-references.md` §3.
