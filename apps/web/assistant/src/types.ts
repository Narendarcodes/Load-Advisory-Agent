export type Literacy = "low" | "medium" | "high";
export type Locale = "en" | "hi" | "te";

/** Used only when the page omits the version: the server always sends the notice it recorded. */
export const FALLBACK_VOICE_CONSENT_VERSION = "voice-consent/1";

export interface Citation {
  label: string;
  document_id: string;
  title: string;
  section?: string | null;
  page?: number | null;
  source_url?: string | null;
  relationship?: string | null;
  applies_to_entity?: string[] | null;
}

export interface ImprovementTask {
  rule_id: string;
  task: string;
  general_guidance: string;
  guidance_source?: string;
  target_display?: string;
  gap_display?: string;
  rule_passes_after_change?: boolean;
}

export interface WhatIf {
  changes?: Record<string, number>;
  simulated_decision?: string;
  is_simulation?: boolean;
  rule_results?: Record<string, string>;
  failed_reason_codes?: string[];
  original_record_unchanged?: boolean;
  label?: string;
  error?: string;
}

/** One row of the recorded decision's rule table (facts.decision_card → rules[]). */
export interface DecisionRule {
  rule_id: string;
  name: string;
  reason_code?: string | null;
  result: string;
  actual?: string | null;
  threshold?: string | null;
  threshold_source?: string | null;
}

/** facts.bureau_facts(): present only when the decision used a bureau report. */
export interface BureauFacts {
  outcome_kind?: string | null;
  review_required?: boolean | null;
  info_requested?: boolean | null;
  review_reason_codes?: string[];
  info_requested_fields?: string[];
  data_quality_category?: string | null;
  score_source?: string | null;
  score_conflict?: boolean | null;
  provider_error?: string | null;
  retryable?: boolean | null;
  synthetic_report?: boolean | null;
}

/** The server's decision card (agent/facts.py). A projection of a stored record, never a new decision. */
export interface DecisionCard {
  application_ref?: string | null;
  decision?: string | null;
  recorded_outcome?: string | null;
  lifecycle_state?: string | null;
  record_id?: string | null;
  policy_version?: string | null;
  policy_synthetic: boolean;
  policy_label?: string | null;
  evaluated_at?: string | null;
  rules: DecisionRule[];
  failed_reason_codes: string[];
  missing_fields: string[];
  flags: string[];
  bureau?: BureauFacts | null;
}

/** A safe public stage id, emitted by the real graph node that just started. */
export interface ProgressState {
  stage: string;
}

/** The allowlisted AgentResponse projection the AG-UI endpoint sends as STATE_SNAPSHOT. */
export interface PublicState {
  request_id?: string;
  trace_id?: string;
  intent?: string;
  action?: string;
  answer?: string;
  abstained?: boolean;
  citations?: Citation[];
  evidence_refs?: string[];
  missing_information?: string[];
  handoff_ref?: string;
  decision_card?: DecisionCard;
  improvement_plan?: ImprovementTask[];
  what_if?: WhatIf;
  guard_flags?: string[];
  progress?: ProgressState;
}
