import type { Citation, DecisionCard, DecisionOffer, ImprovementTask, PublicState, WhatIf } from "../types";
import { reasonThemes, whatIfMeets, type ReasonSignal, type ThemeKey } from "./plain";

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

const EXCERPT_LIMIT = 600;

/** Plain text, cut to a limit. Rendered as a text node, never as markup. */
function bounded(value: unknown, limit: number): string | null {
  const value_ = text(value);
  if (!value_) return null;
  return value_.length > limit ? `${value_.slice(0, limit)}…` : value_;
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
    excerpt: bounded(raw.excerpt, EXCERPT_LIMIT),
  };
}

/*
 * Sanitiser. The server's card still carries rule rows with values, thresholds and rule ids, reason
 * codes, flags and bureau details (Qoder Q-07). They are read here only to pick borrower themes, and are
 * never copied into the parsed card, so no block can render them.
 */
function ruleSignal(value: unknown): (ReasonSignal & { result: string }) | null {
  const raw = record(value);
  if (!raw) return null;
  const ruleId = text(raw.rule_id);
  const result = text(raw.result);
  if (!ruleId || !result) return null;
  return {
    rule_id: ruleId,
    result,
    reason_code: text(raw.reason_code),
    category: text(raw.category) ?? text(raw.reason_category),
    name: text(raw.name),
  };
}

function bureauSignals(value: unknown): ReasonSignal[] {
  const raw = record(value);
  if (!raw) return [];
  const out: ReasonSignal[] = [];
  if (text(raw.provider_error) || raw.outcome_kind === "PROVIDER_FAILURE" || raw.outcome_kind === "EVALUATION_ERROR") {
    out.push({ category: "CHECKS_PENDING" });
  }
  if (raw.outcome_kind === "DATA_QUALITY_HOLD" || raw.score_conflict === true) out.push({ category: "DETAILS_NOT_VERIFIED" });
  if (raw.outcome_kind === "CREDIT_REJECTION") out.push({ category: "CREDIT_HISTORY" });
  return out;
}

function positive(value: unknown): number | null {
  const parsed = number(value);
  return parsed !== null && parsed > 0 ? parsed : null;
}

function parseOffer(raw: Obj): DecisionOffer | null {
  const offer = record(raw.offer) ?? raw;
  const parsed = {
    amount: positive(offer.amount) ?? positive(offer.loan_amount) ?? positive(offer.offer_amount),
    emi: positive(offer.emi),
    tenure_months: positive(offer.tenure_months) ?? positive(offer.tenure),
  };
  return parsed.amount || parsed.emi || parsed.tenure_months ? parsed : null;
}

/**
 * The backend decision card. A card is only accepted when it names a recorded outcome and its
 * rule list (if present) is a list; a partial card would be misleading.
 */
/**
 * v2 outcome codes (E2E D-16) in the vocabulary this UI knows. The agent already sends these words; a card that
 * still carries a stored code must never show it.
 */
const V2_OUTCOME: Record<string, string> = {
  ELIGIBILITY_CONDITIONS_MET: "APPROVED",
  COUNTER_OFFER: "COUNTER",
  MANUAL_REVIEW: "REVIEW",
  MORE_INFORMATION_REQUIRED: "INFO_REQUESTED",
  DECLINE: "REJECTED",
};

function outcomeWord(value: string | null): string | null {
  return value ? (V2_OUTCOME[value.toUpperCase()] ?? value) : value;
}

export function parseDecisionCard(value: unknown): DecisionCard | null {
  const raw = record(value);
  if (!raw) return null;
  const decision = outcomeWord(text(raw.decision));
  const recorded = outcomeWord(text(raw.recorded_outcome));
  const lifecycle = text(raw.lifecycle_state);
  if (!decision && !recorded && !lifecycle) return null;
  if (raw.rules !== undefined && raw.rules !== null && !Array.isArray(raw.rules)) return null;
  if (raw.bureau !== undefined && raw.bureau !== null && !record(raw.bureau)) return null;
  const outcome = (recorded ?? decision ?? "").toUpperCase();

  // Borrower-safe categories win when the server sends them (the Q-07 contract); otherwise the failing
  // rules, reason codes and bureau signals choose the themes.
  const categories = textList(raw.reason_categories).map((category): ReasonSignal => ({ category }));
  const failing = (Array.isArray(raw.rules) ? raw.rules : [])
    .map(ruleSignal)
    .filter((rule): rule is ReasonSignal & { result: string } => rule !== null && rule.result === "FAIL");
  const codes = textList(raw.failed_reason_codes).map((code): ReasonSignal => ({ code }));
  const signals = categories.length ? categories : [...failing, ...(failing.length ? [] : codes), ...bureauSignals(raw.bureau)];
  let themes: ThemeKey[] = outcome === "APPROVED" ? [] : reasonThemes(signals);
  if (outcome === "REJECTED" && !themes.length) themes = ["OTHER"];

  return {
    application_ref: text(raw.application_ref),
    decision,
    recorded_outcome: recorded,
    lifecycle_state: lifecycle,
    evaluated_at: text(raw.evaluated_at),
    policy_synthetic: raw.policy_synthetic === true,
    offer: outcome === "APPROVED" || outcome === "COUNTER" ? parseOffer(raw) : null,
    themes,
    missing_fields: textList(raw.missing_fields),
  };
}

/** The estimate's verdict and amount only; changed values, rule results and error text are dropped. */
export function parseWhatIf(value: unknown): WhatIf | null {
  const raw = record(value);
  if (!raw) return null;
  const error = Boolean(text(raw.error));
  const changes = record(raw.changes) ?? {};
  const hasChange = Object.values(changes).some((amount) => number(amount) !== null);
  const meets = whatIfMeets(text(raw.result) ?? text(raw.simulated_decision));
  const amount = positive(raw.hypothetical_amount) ?? positive(changes.loan_amount);
  const hasResults = Object.keys(record(raw.rule_results) ?? {}).length > 0;
  if (!error && meets === null && !hasChange && !hasResults) return null;
  return {
    meets: error ? null : meets,
    amount: error ? null : amount,
    original_record_unchanged: flag(raw.original_record_unchanged) ?? undefined,
    error,
  };
}

/** One step per item, kept only as its borrower theme: no task text, target or gap survives. */
export function parseImprovementPlan(value: unknown): ImprovementTask[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const raw = record(item);
    if (!raw) return [];
    const task = text(raw.task);
    if (!task) return [];
    const [theme] = reasonThemes([{ category: text(raw.category), rule_id: text(raw.rule_id), text: task }]);
    return [{ theme: theme ?? "OTHER" }];
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
