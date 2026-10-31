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
  improvement_plan?: ImprovementTask[];
  what_if?: WhatIf;
  guard_flags?: string[];
}
