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
  it("accepts an approved record with its rule table and provenance", () => {
    const parsed = parseDecisionCard(
      card({ decision: "APPROVED", recorded_outcome: "APPROVED", rules: [rule({ result: "PASS" })], failed_reason_codes: [] }),
    );
    expect(parsed).not.toBeNull();
    expect(parsed!.recorded_outcome).toBe("APPROVED");
    expect(parsed!.rules).toHaveLength(1);
    expect(parsed!.rules[0]).toMatchObject({ rule_id: "MIN_CREDIT_SCORE", result: "PASS", actual: "640" });
    expect(parsed!.policy_synthetic).toBe(true);
    expect(parsed!.record_id).toBe("DEC-0001");
  });

  it("accepts a rejected record and keeps the failing reason codes", () => {
    const parsed = parseDecisionCard(card());
    expect(parsed!.recorded_outcome).toBe("REJECTED");
    expect(parsed!.failed_reason_codes).toEqual(["MIN_CREDIT_SCORE"]);
  });

  it("accepts a review record whose checks could not run", () => {
    const parsed = parseDecisionCard(
      card({
        decision: "ERROR",
        recorded_outcome: "REVIEW",
        rules: [rule({ result: "NOT_EVALUABLE", actual: "missing" })],
        failed_reason_codes: [],
        missing_fields: ["monthly_income"],
      }),
    );
    expect(parsed!.recorded_outcome).toBe("REVIEW");
    expect(parsed!.rules[0].result).toBe("NOT_EVALUABLE");
    expect(parsed!.missing_fields).toEqual(["monthly_income"]);
  });

  it("keeps bureau evidence only when it is a recognisable object", () => {
    const parsed = parseDecisionCard(
      card({
        bureau: {
          outcome_kind: "DATA_QUALITY_HOLD",
          review_required: true,
          info_requested: true,
          review_reason_codes: ["DQ_MISSING_REQUIRED_FIELD"],
          info_requested_fields: ["monthly_income"],
          score_source: "SYNTHETIC_BUREAU",
          synthetic_report: true,
          unexpected: "<script>alert(1)</script>",
        },
      }),
    );
    expect(parsed!.bureau).toMatchObject({
      outcome_kind: "DATA_QUALITY_HOLD",
      review_required: true,
      synthetic_report: true,
    });
    expect(parsed!.bureau).not.toHaveProperty("unexpected");
  });

  it("rejects a payload that cannot be recognised instead of guessing", () => {
    expect(parseDecisionCard(null)).toBeNull();
    expect(parseDecisionCard("REJECTED")).toBeNull();
    expect(parseDecisionCard({})).toBeNull();
    expect(parseDecisionCard({ application_ref: "LA-1" })).toBeNull();
    expect(parseDecisionCard(card({ rules: "not a list" }))).toBeNull();
    expect(parseDecisionCard(card({ bureau: ["not", "an", "object"] }))).toBeNull();
  });

  it("drops individual malformed rule rows without discarding the card", () => {
    const parsed = parseDecisionCard(card({ rules: [rule(), { rule_id: "X" }, "nonsense", rule({ rule_id: "FOIR_MAX_45" })] }));
    expect(parsed!.rules.map((item) => item.rule_id)).toEqual(["MIN_CREDIT_SCORE", "FOIR_MAX_45"]);
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
        { task: "missing rule id" },
      ],
      what_if: { error: "credit_score out of range" },
      progress: { stage: "retrieve_policy", internal_node: "retrieve_policy" },
      unknown_key: "ignored",
    });
    expect(state.intent).toBe("explain");
    expect(state.decision_card).toBeUndefined();
    expect(state.citations).toHaveLength(1);
    expect(state.improvement_plan).toHaveLength(1);
    expect(state.what_if?.error).toBe("credit_score out of range");
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
  it("keeps numeric changes and string rule results", () => {
    const parsed = parseWhatIf({
      changes: { credit_score: 720, monthly_income: "45000", bad: null },
      rule_results: { MIN_CREDIT_SCORE: "PASS", BROKEN: 3 },
      simulated_decision: "APPROVED",
      is_simulation: true,
      original_record_unchanged: true,
      label: "Hypothetical only",
    });
    expect(parsed!.changes).toEqual({ credit_score: 720 });
    expect(parsed!.rule_results).toEqual({ MIN_CREDIT_SCORE: "PASS" });
    expect(parsed!.original_record_unchanged).toBe(true);
  });

  it("rejects an empty simulation and accepts an error-only result", () => {
    expect(parseWhatIf({})).toBeNull();
    expect(parseWhatIf({ changes: { credit_score: "high" } })).toBeNull();
    expect(parseWhatIf({ error: "credit_score must be between 300 and 900" })?.error).toMatch(/between 300 and 900/);
  });
});

describe("parseImprovementPlan", () => {
  it("requires rule, task and guidance before a step is shown", () => {
    const plan = parseImprovementPlan([
      { rule_id: "MIN_CREDIT_SCORE", task: "Raise your score", general_guidance: "Pay on time", rule_passes_after_change: true },
      { rule_id: "FOIR_MAX_45", task: "Reduce EMIs" },
    ]);
    expect(plan).toEqual([
      expect.objectContaining({ rule_id: "MIN_CREDIT_SCORE", rule_passes_after_change: true }),
    ]);
  });
});
