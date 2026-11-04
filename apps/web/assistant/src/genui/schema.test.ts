import { describe, expect, it } from "vitest";

import { parseDecisionCard, parseImprovementPlan, parsePublicState, parseWhatIf } from "./schema";

const rule = (overrides: Record<string, unknown> = {}) => ({
  rule_id: "MIN_CREDIT_SCORE",
  name: "Credit score",
  reason_code: "MIN_CREDIT_SCORE",
  result: "FAIL",
  actual: "640",
  threshold: "≥ 700",
  threshold_source: "synthetic",
  ...overrides,
});

const card = (overrides: Record<string, unknown> = {}) => ({
  application_ref: "LA-2026-00001",
  decision: "REJECTED",
  recorded_outcome: "REJECTED",
  lifecycle_state: "DECIDED",
  record_id: "DEC-0001",
  policy_version: "synthetic-v1",
  policy_synthetic: true,
  policy_label: "synthetic prototype policy (synthetic-v1)",
  evaluated_at: "2026-10-01T10:00:00Z",
  rules: [rule()],
  failed_reason_codes: ["MIN_CREDIT_SCORE"],
  missing_fields: [],
  flags: [],
  ...overrides,
});

describe("parseDecisionCard", () => {
  it("accepts an approved record and keeps only the borrower's own offer", () => {
    const parsed = parseDecisionCard(
      card({ decision: "APPROVED", recorded_outcome: "APPROVED", rules: [rule({ result: "PASS" })], failed_reason_codes: [], offer: { amount: 200000, emi: 9555, tenure_months: 24 } }),
    );
    expect(parsed).not.toBeNull();
    expect(parsed!.offer).toEqual({ amount: 200000, emi: 9555, tenure_months: 24 });
    expect(parsed!.themes).toEqual([]);
    expect(parsed).not.toHaveProperty("rules");
    expect(parsed).not.toHaveProperty("record_id");
  });

  it("turns a rejected record's failing rules into borrower themes", () => {
    const parsed = parseDecisionCard(card());
    expect(parsed!.themes).toEqual(["CREDIT_HISTORY"]);
    expect(parsed!.offer).toBeNull();
    expect(JSON.stringify(parsed)).not.toMatch(/640|700|MIN_CREDIT_SCORE/);
  });

  it("prefers borrower-safe categories when the server sends them", () => {
    const parsed = parseDecisionCard(card({ reason_categories: ["EMPLOYMENT_STABILITY", "REPAYMENTS_TOO_HIGH"] }));
    expect(parsed!.themes).toEqual(["EMPLOYMENT", "REPAYMENTS_TOO_HIGH"]);
  });

  it("gives a decline with no readable reason one generic theme", () => {
    expect(parseDecisionCard(card({ rules: [], failed_reason_codes: [] }))!.themes).toEqual(["OTHER"]);
  });

  it("reads bureau signals only as themes, never as text", () => {
    const parsed = parseDecisionCard(
      card({ decision: "REVIEW", recorded_outcome: "REVIEW", rules: [], failed_reason_codes: [], bureau: { outcome_kind: "PROVIDER_FAILURE", provider_error: "BUREAU_TIMEOUT" } }),
    );
    expect(parsed!.themes).toEqual(["CHECKS_PENDING"]);
    expect(parsed).not.toHaveProperty("bureau");
  });

  it("rejects a payload that cannot be recognised instead of guessing", () => {
    expect(parseDecisionCard(null)).toBeNull();
    expect(parseDecisionCard({ application_ref: "LA-1" })).toBeNull();
    expect(parseDecisionCard(card({ rules: "not a list" }))).toBeNull();
    expect(parseDecisionCard(card({ bureau: ["not", "an", "object"] }))).toBeNull();
  });

  it("never carries unknown keys or markup through", () => {
    const parsed = parseDecisionCard(card({ answer_html: "<img src=x onerror=alert(1)>", script: "alert(1)" }));
    expect(parsed).not.toBeNull();
    expect(parsed).not.toHaveProperty("answer_html");
    expect(parsed).not.toHaveProperty("script");
  });
});

describe("parsePublicState", () => {
  it("validates each optional field independently", () => {
    const state = parsePublicState({
      intent: "explain",
      decision_card: { rules: [] },
      citations: [{ label: "[1]", document_id: "doc", title: "Policy" }, { label: "broken" }],
      improvement_plan: [
        { rule_id: "MIN_CREDIT_SCORE", task: "Raise your score", general_guidance: "Pay on time" },
        { general_guidance: "missing task" },
      ],
      what_if: { error: "credit_score out of range" },
      progress: { stage: "retrieve_policy", internal_node: "retrieve_policy" },
      unknown_key: "ignored",
    });
    expect(state.intent).toBe("explain");
    expect(state.decision_card).toBeUndefined();
    expect(state.citations).toHaveLength(1);
    expect(state.improvement_plan).toHaveLength(1);
    expect(state.what_if?.error).toBe(true);
    expect(state.progress).toEqual({ stage: "retrieve_policy" });
    expect(state).not.toHaveProperty("unknown_key");
  });

  it("refuses a progress stage that is not a string", () => {
    expect(parsePublicState({ progress: { stage: { nested: true } } }).progress).toBeUndefined();
    expect(parsePublicState({ progress: "retrieve_policy" }).progress).toBeUndefined();
  });

  it("returns an empty state for a non-object snapshot", () => {
    expect(parsePublicState(null)).toEqual({});
    expect(parsePublicState("state")).toEqual({});
    expect(parsePublicState([])).toEqual({});
  });
});

describe("parseWhatIf", () => {
  it("keeps only the verdict and the hypothetical amount", () => {
    const parsed = parseWhatIf({
      changes: { loan_amount: 300000, monthly_income: "45000", bad: null },
      rule_results: { MIN_CREDIT_SCORE: "PASS", BROKEN: 3 },
      simulated_decision: "APPROVED",
      is_simulation: true,
      original_record_unchanged: true,
      label: "Hypothetical only",
    });
    expect(parsed).toEqual({ meets: true, amount: 300000, original_record_unchanged: true, error: false });
  });

  it("reads the Q-03 shape too", () => {
    expect(parseWhatIf({ result: "WOULD_NOT_MEET", hypothetical_amount: 250000 })).toEqual({ meets: false, amount: 250000, original_record_unchanged: undefined, error: false });
  });

  it("rejects an empty simulation and keeps an error as a flag, not its text", () => {
    expect(parseWhatIf({})).toBeNull();
    expect(parseWhatIf({ changes: { credit_score: "high" } })).toBeNull();
    const failed = parseWhatIf({ error: "credit_score must be between 300 and 900" });
    expect(failed?.error).toBe(true);
    expect(JSON.stringify(failed)).not.toMatch(/300|900|score/);
  });
});

describe("parseImprovementPlan", () => {
  it("keeps each step only as its theme: no task text, target or gap", () => {
    const plan = parseImprovementPlan([
      { rule_id: "MIN_CREDIT_SCORE", task: "Raise your score to 700", general_guidance: "Pay on time", target_display: "700", gap_display: "+60" },
      { rule_id: "FOIR_MAX_45", task: "Reduce EMIs" },
      { general_guidance: "no task" },
    ]);
    expect(plan).toEqual([{ theme: "CREDIT_HISTORY" }, { theme: "REPAYMENTS_TOO_HIGH" }]);
  });
});
