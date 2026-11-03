import type { ThemeKey } from "./genui/plain";

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
  /** Opening of the cited passage, plain text (server-trimmed). Shown in the source chip. */
  excerpt?: string | null;
}

/**
 * One improvement step as the island keeps it: only the borrower theme it belongs to. The server's task
 * text, targets and gaps (Qoder Q-07/Q-09) are dropped at parse time; the words come from genui/plain.ts.
 */
export interface ImprovementTask {
  theme: ThemeKey;
}

/**
 * A what-if as the island keeps it: the estimate's verdict and the amount it was run for. Per-rule results,
 * the changed values and server error text are dropped at parse time.
 */
export interface WhatIf {
  /** true = "would likely meet", false = "wouldn't meet", null = no verdict sent. */
  meets: boolean | null;
  /** The hypothetical loan amount, when the estimate was run for one. */
  amount: number | null;
  original_record_unchanged?: boolean;
  /** The server refused or failed the estimate; its message is not shown. */
  error: boolean;
}

/** The borrower's own offer on an approved decision. */
export interface DecisionOffer {
  amount: number | null;
  emi: number | null;
  tenure_months: number | null;
}

/**
 * The recorded decision as the island keeps it. Rule rows, values, thresholds, rule ids, reason codes,
 * flags and bureau details from the server's card are reduced to borrower themes at parse time and never
 * stored, so nothing downstream can render them.
 */
export interface DecisionCard {
  application_ref?: string | null;
  decision?: string | null;
  recorded_outcome?: string | null;
  lifecycle_state?: string | null;
  evaluated_at?: string | null;
  policy_synthetic: boolean;
  offer: DecisionOffer | null;
  /** At most three borrower-safe reason themes. */
  themes: ThemeKey[];
  missing_fields: string[];
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
