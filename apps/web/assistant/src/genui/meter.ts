import type { DecisionCard, DecisionRule, WhatIf } from "../types";

/**
 * Geometry for one rule meter, built only from the engine's own numbers on the recorded rule row.
 * Nothing here decides anything: `passes` is the recorded result, and the labels are the server's
 * display strings. A rule without numbers or an operator gets no meter.
 */
export interface MeterModel {
  min: number;
  max: number;
  valuePct: number;
  limitPct: number;
  direction: "at_least" | "at_most";
  passes: boolean;
  valueLabel: string;
  limitLabel: string;
}

/** Fixed scales where the domain has one; otherwise zero to a little past the larger number. */
const SCALES: Record<string, [number, number]> = {
  MIN_CREDIT_SCORE: [300, 900],
  FOIR_MAX_45: [0, 1],
};

function clampPct(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

/** "≥ 650" → "650": the server's threshold string without its operator sign. */
export function limitText(threshold: string | null | undefined, fallback: number): string {
  const cleaned = (threshold ?? "").replace(/^[≥≤<>=\s]+/, "").trim();
  return cleaned || String(fallback);
}

export function meterModel(rule: DecisionRule): MeterModel | null {
  const value = rule.actual_value;
  const limit = rule.threshold_value;
  if (value === null || value === undefined || limit === null || limit === undefined || !rule.operator) return null;
  const [min, max] = SCALES[rule.rule_id] ?? [0, Math.max(value, limit) * 1.4 || 1];
  return {
    min,
    max,
    valuePct: clampPct(value, min, max),
    limitPct: clampPct(limit, min, max),
    direction: rule.operator === ">=" ? "at_least" : "at_most",
    passes: rule.result === "PASS",
    valueLabel: rule.actual ?? String(value),
    limitLabel: limitText(rule.threshold, limit),
  };
}

/** What-if fields that map to exactly one recorded rule's number. */
const FIELD_RULE: Record<string, { rule: string; label: string }> = {
  credit_score: { rule: "MIN_CREDIT_SCORE", label: "Credit score" },
  monthly_income: { rule: "MIN_MONTHLY_INCOME", label: "Monthly income" },
  employment_months: { rule: "MIN_EMPLOYMENT_TENURE", label: "Months in current job" },
  monthly_obligations: { rule: "", label: "Monthly EMIs" },
};

export interface WhatIfRow {
  field: string;
  label: string;
  rule: DecisionRule | null;
  before: number | null;
  after: number;
  recorded: string | null;
  simulated: string | null;
}

/** One row per changed field: the recorded number (only when a single rule holds it) and the simulated one. */
export function whatIfComparisons(whatIf: WhatIf, card?: DecisionCard): WhatIfRow[] {
  const rules = new Map((card?.rules ?? []).map((rule) => [rule.rule_id, rule]));
  return Object.entries(whatIf.changes ?? {}).map(([field, after]) => {
    const mapping = FIELD_RULE[field];
    const rule = mapping?.rule ? (rules.get(mapping.rule) ?? null) : null;
    return {
      field,
      label: mapping?.label ?? field.replaceAll("_", " "),
      rule,
      before: rule?.actual_value ?? null,
      after,
      recorded: rule?.result ?? null,
      simulated: mapping?.rule ? (whatIf.rule_results?.[mapping.rule] ?? null) : null,
    };
  });
}
