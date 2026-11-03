import type { ReactNode } from "react";

import type { Citation, DecisionCard, ImprovementTask, Locale, PublicState, WhatIf } from "../types";
import {
  DecisionCardBlock,
  HumanAssistanceBlock,
  ImprovementPlanBlock,
  MissingInformationBlock,
  NoticeBlock,
  PolicyCitationBlock,
  WhatIfResultBlock,
} from "./blocks";
import { missingInformationItem, type MissingInformationItem } from "./catalog";
import { WhatIfForm } from "../what-if-form";

/**
 * The approved GenUI catalogue. Every block is built from a validated projection of the public
 * state; there is no HTML or script channel, and an unrecognised block renders nothing.
 */
export type GenUiBlock =
  | { type: "decision_card"; card: DecisionCard }
  | { type: "policy_citation"; citations: Citation[] }
  | { type: "what_if_form"; card?: DecisionCard }
  | { type: "what_if_result"; whatIf: WhatIf; card?: DecisionCard }
  | { type: "improvement_plan"; plan: ImprovementTask[] }
  | { type: "missing_information"; items: MissingInformationItem[] }
  | { type: "human_assistance"; handoffRef: string }
  | { type: "notice"; tone: "info" | "error"; text: string };

export type BlockKind = GenUiBlock["type"];

/** Frozen: rule_evaluation, progress and application_context were removed (no rule rows, ever). */
export const GENUI_BLOCK_TYPES: readonly BlockKind[] = Object.freeze([
  "decision_card",
  "policy_citation",
  "what_if_form",
  "what_if_result",
  "improvement_plan",
  "missing_information",
  "human_assistance",
  "notice",
] as const);

export interface GenUiContext {
  application: string;
  busy?: boolean;
  /** The profile language for reason copy (en, hi, te). */
  locale?: Locale;
  onAsk: (question: string) => void;
  /** Opens the inline what-if form (the chat panel owns it). Absent where there is no form. */
  onOpenWhatIf?: () => void;
}

type Renderer<K extends BlockKind> = (block: Extract<GenUiBlock, { type: K }>, context: GenUiContext) => ReactNode;

const RENDERERS: { [K in BlockKind]: Renderer<K> } = {
  decision_card: (block, context) => <DecisionCardBlock card={block.card} locale={context.locale} />,
  policy_citation: (block) => <PolicyCitationBlock citations={block.citations} />,
  what_if_form: (block, context) => (
    <WhatIfForm disabled={Boolean(context.busy)} recorded={block.card} onAsk={context.onAsk} />
  ),
  what_if_result: (block, context) => (
    <WhatIfResultBlock
      whatIf={block.whatIf}
      card={block.card}
      locale={context.locale}
      onAdjust={context.busy ? undefined : context.onOpenWhatIf}
    />
  ),
  improvement_plan: (block, context) => <ImprovementPlanBlock plan={block.plan} locale={context.locale} />,
  missing_information: (block) => <MissingInformationBlock items={block.items} />,
  human_assistance: (block) => <HumanAssistanceBlock handoffRef={block.handoffRef} />,
  notice: (block) => <NoticeBlock tone={block.tone} text={block.text} />,
};

/** Unknown or forged block types are dropped instead of being rendered or coerced. */
export function isGenUiBlock(value: unknown): value is GenUiBlock {
  if (typeof value !== "object" || value === null) return false;
  const type = (value as { type?: unknown }).type;
  return typeof type === "string" && (GENUI_BLOCK_TYPES as readonly string[]).includes(type);
}

export function renderBlock(block: GenUiBlock, context: GenUiContext): ReactNode {
  if (!isGenUiBlock(block)) return null;
  const render = RENDERERS[block.type] as (value: GenUiBlock, ctx: GenUiContext) => ReactNode;
  return render(block, context);
}

/**
 * The blocks a finished (or in-flight) turn contributes to the answer panel, in reading order.
 * `busy` is set from the run status, never guessed from the state payload.
 */
export function buildBlocks(state: PublicState, context: GenUiContext): GenUiBlock[] {
  const blocks: GenUiBlock[] = [];
  const card = state.decision_card;
  if (card) blocks.push({ type: "decision_card", card });
  if (state.what_if) blocks.push({ type: "what_if_result", whatIf: state.what_if, card });
  if (state.missing_information?.length) {
    blocks.push({
      type: "missing_information",
      items: state.missing_information.map((field) => missingInformationItem(field, context.application)),
    });
  }
  if (state.abstained) {
    blocks.push({
      type: "notice",
      tone: "info",
      text: "The assistant did not answer this one on its own; it will not guess about your file.",
    });
  }
  if (state.handoff_ref) blocks.push({ type: "human_assistance", handoffRef: state.handoff_ref });
  if (state.citations?.length) blocks.push({ type: "policy_citation", citations: state.citations });
  return blocks;
}
