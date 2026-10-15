# Research note: explainability (XAI), reason codes and how they apply to this project

Status: research note for the investigation question bank (sections 7, 27, 39). Written Oct 15, 2026. Every external claim below is
quoted or paraphrased from the source linked next to it. Statements about this project point to repo files. US rules are included as
a comparison point only: they do not apply to Indian lenders. Indian rules are in `data/sources/policy_register.yaml` and
`docs/policy/bajaj_reference_lender.md`.

## 1. External findings (sourced)

### SHAP
SHAP (SHapley Additive exPlanations) is "a unified framework for interpreting predictions". It "assigns each feature an importance
value for a particular prediction". It is an additive feature-importance method with a unique solution that has a set of desirable
properties.
Source: Lundberg & Lee, "A Unified Approach to Interpreting Model Predictions", NIPS 2017, https://arxiv.org/abs/1705.07874

### LIME
LIME "explains the predictions of any classifier in an interpretable and faithful manner, by learning an interpretable model locally
around the prediction".
Source: Ribeiro, Singh & Guestrin, "Why Should I Trust You?", 2016, https://arxiv.org/abs/1602.04938

### Counterfactual explanations
Counterfactual explanations "describe the smallest change to the world that can be made to obtain a desirable outcome ... without
needing to explain the internal logic of the system". The authors give three aims for explanations to affected individuals:
- understand why a decision was reached;
- have grounds to contest it;
- understand "what would need to change in order to receive a desired result in the future".

Source: Wachter, Mittelstadt & Russell, Harvard JOLT 2018, https://arxiv.org/abs/1711.00399

### Reason codes / adverse-action reasons (US comparison: ECOA / Regulation B)
- A statement of reasons "must be specific and indicate the principal reason(s) for the adverse action".
- Statements that the decision rested on "internal standards or policies", or that the applicant failed to reach a qualifying score,
  "are insufficient".
- The reasons "must relate to and accurately describe the factors actually considered or scored by a creditor".
- Checking "the closest identifiable factor" on a sample form does not satisfy the notice requirement.
- On post-hoc explanation methods: such explanations "approximate models", and creditors "must still be able to validate the accuracy
  of those approximations".
- The notice requirement serves "consumer protection and education". Informed consumers "can take steps to try to improve their
  credit status" or have a mistake rectified.

Source: CFPB Circular 2022-03 (May 26, 2022),
https://www.consumerfinance.gov/compliance/circulars/circular-2022-03-adverse-action-notification-requirements-in-connection-with-credit-decisions-based-on-complex-algorithms/

## 2. How this applies to the project (decisions already evident in the code)

- **The decision is rule-based, so no post-hoc approximation is needed.** The prototype decides with ZEN rules over four inputs:
  - minimum monthly income;
  - FOIR (fixed-obligation-to-income ratio, the share of income already going to EMIs);
  - credit score;
  - months in the current job.

  The thresholds are synthetic, not real lender policy. See `decision_engine/policies/personal_loan_synthetic_v1.json` and
  `decision_engine/decisions/personal_loan_v1.json`.
- **The rejection reasons are the rules that failed, recorded at decision time.** They live in the stored evidence record
  (`decision_engine/evidence/evidence_record.py`, `apps/api/src/loan_advisory/infrastructure/evidence_store.py`). This is the
  "factors actually considered" standard in section 1, met exactly, rather than SHAP or LIME estimates.
- **The agent may only state the recorded failed rules as reasons.**
  - `apps/api/src/loan_advisory/agent/facts.py` passes them as `failed_rules_the_only_reasons`.
  - The guards in `apps/api/src/loan_advisory/agent/guards.py` block ungrounded numbers, plus decision and guarantee language.
- **What-if is a counterfactual on the real rule engine, not a model approximation.**
  - `run_what_if` in `apps/api/src/loan_advisory/agent/tools.py` re-runs ZEN on the changed inputs.
  - It reports a before/after result per rule and leaves the original record unchanged. `eval_v3` A4 measured
    `sim_matches_direct_zen` = 1.0.
- **The improvement plan is a set of counterfactual targets checked in ZEN.** `eval_v3` A3 measured
  `plan_targets_pass_in_zen` = 1.0, so each suggested target passes the rule when simulated. This covers aim 3 of Wachter et al.
  It is never a promise of approval: the guarantee guards and templates block that.
- **Faithfulness is checked in two ways.**
  - Deterministically: reason/value coverage, ungrounded numbers, and gold-passage citation support and strictness.
  - With an LLM judge: the same gpt-oss-120b, so those figures are indicative only.

  See `docs/agent/README.md` and `docs/agent/citation_accuracy.md`.
- **Gap.** A real lender's decision may come from an ML scorecard. Then the reasons would have to come from that lender's own
  validated reason codes, and the agent would explain those. Using SHAP, LIME or other approximations as reasons would need the
  lender to validate them. No real lender model or reason-code list is available to this project. Who must answer: a partner
  lender.
