import type {
  BureauFacts,
  Citation,
  DecisionCard,
  DecisionRule,
  ImprovementTask,
  PublicState,
  WhatIf,
} from "../types";

/*
 * The island receives an untyped JSON snapshot from the agent runtime. Everything below is a
 * runtime gate: only fields shaped like the server contract survive, unknown keys are dropped, and
 * a payload that cannot be recognised is returned as null so the component renders nothing rather
 * than guessing. No value from here is ever interpreted as markup.
 */

type Obj = Record<string, unknown>;

function record(value: unknown): Obj | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Obj;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function textList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim() !== "");
}

function flag(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function number(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function safePage(value: unknown): number | null {
  const page = number(value);
  return page !== null && Number.isInteger(page) && page > 0 ? page : null;
}

export function parseCitation(value: unknown): Citation | null {
  const raw = record(value);
  if (!raw) return null;
  const label = text(raw.label);
  const documentId = text(raw.document_id);
  const title = text(raw.title);
  if (!label || !documentId || !title) return null;
  return {
    label,
    document_id: documentId,
    title,
    section: text(raw.section),
    page: safePage(raw.page),
    source_url: text(raw.source_url),
    relationship: text(raw.relationship),
    applies_to_entity: textList(raw.applies_to_entity),
  };
}

export function parseDecisionRule(value: unknown): DecisionRule | null {
  const raw = record(value);
  if (!raw) return null;
  const ruleId = text(raw.rule_id);
  const result = text(raw.result);
  if (!ruleId || !result) return null;
  return {
    rule_id: ruleId,
    name: text(raw.name) ?? ruleId,
    reason_code: text(raw.reason_code),
    result,
    actual: text(raw.actual),
    threshold: text(raw.threshold),
    threshold_source: text(raw.threshold_source),
  };
}

function parseBureau(value: unknown): BureauFacts | null {
  const raw = record(value);
  if (!raw) return null;
  return {
    outcome_kind: text(raw.outcome_kind),
    review_required: flag(raw.review_required),
    info_requested: flag(raw.info_requested),
    review_reason_codes: textList(raw.review_reason_codes),
    info_requested_fields: textList(raw.info_requested_fields),
    data_quality_category: text(raw.data_quality_category),
    score_source: text(raw.score_source),
    score_conflict: flag(raw.score_conflict),
    provider_error: text(raw.provider_error),
    retryable: flag(raw.retryable),
    synthetic_report: flag(raw.synthetic_report),
  };
}

/**
 * The backend decision card. A card is only accepted when it names a recorded outcome and its
 * rule list (if present) is a list of recognisable rows; a partial card would be misleading.
 */
export function parseDecisionCard(value: unknown): DecisionCard | null {
  const raw = record(value);
  if (!raw) return null;
  const decision = text(raw.decision);
  const recorded = text(raw.recorded_outcome);
  const lifecycle = text(raw.lifecycle_state);
  if (!decision && !recorded && !lifecycle) return null;
  if (raw.rules !== undefined && raw.rules !== null && !Array.isArray(raw.rules)) return null;
  const rules = Array.isArray(raw.rules)
    ? raw.rules.map(parseDecisionRule).filter((rule): rule is DecisionRule => rule !== null)
    : [];
  if (raw.bureau !== undefined && raw.bureau !== null && !record(raw.bureau)) return null;
  return {
    application_ref: text(raw.application_ref),
    decision,
    recorded_outcome: recorded,
    lifecycle_state: lifecycle,
    record_id: text(raw.record_id),
    policy_version: text(raw.policy_version),
    policy_synthetic: raw.policy_synthetic === true,
    policy_label: text(raw.policy_label),
    evaluated_at: text(raw.evaluated_at),
    rules,
    failed_reason_codes: textList(raw.failed_reason_codes),
    missing_fields: textList(raw.missing_fields),
    flags: textList(raw.flags),
    bureau: parseBureau(raw.bureau),
  };
}

export function parseWhatIf(value: unknown): WhatIf | null {
  const raw = record(value);
  if (!raw) return null;
  const error = text(raw.error);
  const changes: Record<string, number> = {};
  for (const [field, amount] of Object.entries(record(raw.changes) ?? {})) {
    const parsed = number(amount);
    if (parsed !== null) changes[field] = parsed;
  }
  const ruleResults: Record<string, string> = {};
  for (const [rule, result] of Object.entries(record(raw.rule_results) ?? {})) {
    const parsed = text(result);
    if (parsed) ruleResults[rule] = parsed;
  }
  if (!error && !Object.keys(changes).length && !Object.keys(ruleResults).length) return null;
  return {
    changes,
    simulated_decision: text(raw.simulated_decision) ?? undefined,
    is_simulation: flag(raw.is_simulation) ?? true,
    rule_results: ruleResults,
    failed_reason_codes: textList(raw.failed_reason_codes),
    original_record_unchanged: flag(raw.original_record_unchanged) ?? undefined,
    label: text(raw.label) ?? undefined,
    error: error ?? undefined,
  };
}

export function parseImprovementPlan(value: unknown): ImprovementTask[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const raw = record(item);
    if (!raw) return [];
    const ruleId = text(raw.rule_id);
    const task = text(raw.task);
    const guidance = text(raw.general_guidance);
    if (!ruleId || !task || !guidance) return [];
    return [
      {
        rule_id: ruleId,
        task,
        general_guidance: guidance,
        guidance_source: text(raw.guidance_source) ?? undefined,
        target_display: text(raw.target_display) ?? undefined,
        gap_display: text(raw.gap_display) ?? undefined,
        rule_passes_after_change: flag(raw.rule_passes_after_change) ?? undefined,
      },
    ];
  });
}

/** The whole snapshot: every optional field is validated on its own so one bad block cannot hide the rest. */
export function parsePublicState(value: unknown): PublicState {
  const raw = record(value);
  if (!raw) return {};
  const state: PublicState = {
    request_id: text(raw.request_id) ?? undefined,
    trace_id: text(raw.trace_id) ?? undefined,
    intent: text(raw.intent) ?? undefined,
    action: text(raw.action) ?? undefined,
    answer: text(raw.answer) ?? undefined,
    abstained: flag(raw.abstained) ?? undefined,
    citations: Array.isArray(raw.citations)
      ? raw.citations.map(parseCitation).filter((citation): citation is Citation => citation !== null)
      : undefined,
    evidence_refs: Array.isArray(raw.evidence_refs) ? textList(raw.evidence_refs) : undefined,
    missing_information: Array.isArray(raw.missing_information) ? textList(raw.missing_information) : undefined,
    handoff_ref: text(raw.handoff_ref) ?? undefined,
    decision_card: raw.decision_card === undefined ? undefined : (parseDecisionCard(raw.decision_card) ?? undefined),
    improvement_plan: Array.isArray(raw.improvement_plan) ? parseImprovementPlan(raw.improvement_plan) : undefined,
    what_if: raw.what_if === undefined ? undefined : (parseWhatIf(raw.what_if) ?? undefined),
    guard_flags: Array.isArray(raw.guard_flags) ? textList(raw.guard_flags) : undefined,
  };
  const progress = record(raw.progress);
  const stage = progress ? text(progress.stage) : null;
  if (stage) state.progress = { stage };
  return state;
}
