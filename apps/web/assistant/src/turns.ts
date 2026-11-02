import type { PublicState } from "./types";
import { parsePublicState } from "./genui/schema";
import { progressLabel } from "./genui/catalog";

/**
 * What one assistant answer carried beyond its words: the steps the server reported while it ran
 * and the validated public state it finished with. Kept per answer so the cards stay with the
 * message that produced them instead of being replaced by the next turn.
 */
export interface TurnMeta {
  /** The first characters of the answer, so a restored transcript only re-attaches matching cards. */
  answer: string;
  stages: string[];
  state?: PublicState;
  /**
   * The answer as the server finished it, with its line breaks. The stream arrives one guarded
   * sentence at a time with the breaks collapsed, which flattens headings and lists; this copy is
   * only ever shown when its words are the streamed words (see `displayText`).
   */
  text?: string;
}

const ANSWER_KEY = 120;
const MAX_TURNS = 40;
const MAX_TEXT = 12000;

function words(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * The text to render for a finished answer: the final answer from the server's state when it is
 * the same words as what was streamed (only whitespace differs), otherwise the streamed text.
 * Nothing the guarded stream did not show can reach the page this way.
 */
export function formattedAnswer(streamed: string, finalAnswer: unknown): string {
  if (typeof finalAnswer !== "string" || !finalAnswer.trim() || finalAnswer.length > MAX_TEXT) return streamed;
  return words(finalAnswer) === words(streamed) ? finalAnswer : streamed;
}

/**
 * The streamed answer arrives with its line breaks collapsed (the server guards it sentence by
 * sentence), so while it is still streaming its markdown showed as raw "###" and run-on lists until
 * the final answer replaced it. Put headings, list items and quotes back on their own lines.
 * Whitespace only: the words are exactly what was streamed, and lines that are already broken stay
 * as they are.
 */
export function liveText(streamed: string): string {
  return streamed
    .replace(/([^\n])[ \t]+(#{1,6} )/g, "$1\n\n$2")
    .replace(/((?:^|\n)#{1,6} [^\n]*?)[ \t]+(?=(?:\d+\.|-|>) )/g, "$1\n")
    .replace(/([.!?:;)*])[ \t]+(>[ \t])/g, "$1\n\n$2")
    .replace(/([.!?:;)*])[ \t]+(\d+\. |- )/g, "$1\n$2")
    .trim();
}

/** What to render for one answer, given the meta stored with it. */
export function displayText(meta: TurnMeta | undefined, streamed: string): string {
  return meta?.text ? formattedAnswer(streamed, meta.text) : streamed;
}

/** Whitespace-insensitive, so a restored transcript (with line breaks) still finds its cards. */
export function answerKey(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, ANSWER_KEY);
}

/** Append a server stage once, in arrival order. Unknown stage ids are ignored, never labelled. */
export function addStage(stages: readonly string[], stage: unknown): string[] {
  if (typeof stage !== "string" || !progressLabel(stage) || stages.includes(stage)) return [...stages];
  return [...stages, stage];
}

/** The parts of the public state an answer keeps. Request and trace ids are not stored. */
export function keptState(state: PublicState): PublicState | undefined {
  const kept: PublicState = {};
  if (state.decision_card) kept.decision_card = state.decision_card;
  if (state.what_if) kept.what_if = state.what_if;
  if (state.missing_information?.length) kept.missing_information = state.missing_information;
  if (state.handoff_ref) kept.handoff_ref = state.handoff_ref;
  if (state.citations?.length) kept.citations = state.citations;
  if (state.improvement_plan?.length) kept.improvement_plan = state.improvement_plan;
  if (state.abstained) kept.abstained = true;
  return Object.keys(kept).length ? kept : undefined;
}

function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function turnsKey(user: string, application: string, thread: string): string {
  return `loan-advisory:turns:${user}:${application}:${thread}`;
}

/** Stored metas are re-validated on the way out: storage is never trusted more than the wire. */
export function loadTurns(key: string | undefined): TurnMeta[] {
  if (!key) return [];
  const raw = storage()?.getItem(key);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item): TurnMeta[] => {
      if (!item || typeof item !== "object") return [];
      const record = item as { answer?: unknown; stages?: unknown; state?: unknown; text?: unknown };
      if (typeof record.answer !== "string") return [];
      const stages = Array.isArray(record.stages) ? record.stages.reduce<string[]>(addStage, []) : [];
      const state = record.state ? keptState(parsePublicState(record.state)) : undefined;
      const text =
        typeof record.text === "string" && record.text.length <= MAX_TEXT ? record.text : undefined;
      return [{ answer: record.answer.slice(0, ANSWER_KEY), stages, state, ...(text ? { text } : {}) }];
    });
  } catch {
    return [];
  }
}

export function saveTurns(key: string | undefined, turns: TurnMeta[]): void {
  if (!key) return;
  try {
    storage()?.setItem(key, JSON.stringify(turns.slice(-MAX_TURNS)));
  } catch {
    // Storage full or disabled: the cards stay for this page view only.
  }
}

/** Find the meta stored for an answer: same position first, then any answer with the same text. */
export function metaFor(turns: readonly TurnMeta[], ordinal: number, text: string): TurnMeta | undefined {
  const key = answerKey(text);
  if (!key) return undefined;
  const same = turns[ordinal];
  if (same && same.answer === key) return same;
  return turns.find((turn) => turn.answer === key);
}

/** Follow-up questions offered under the latest answer, chosen from what the answer showed. */
export function followUps(state: PublicState | undefined): string[] {
  const out: string[] = [];
  const card = state?.decision_card;
  const notMet = card?.rules.some((rule) => rule.result === "FAIL");
  if (state?.what_if) out.push("How is this different from my recorded decision?");
  if (notMet || card?.recorded_outcome === "REJECTED") out.push("What can I do to improve before reapplying?");
  if (state?.missing_information?.length) out.push("How do I provide the missing information?");
  if (!out.length) out.push("Why was this decision made?");
  out.push("How do I talk to a person about this?");
  return Array.from(new Set(out)).slice(0, 3);
}
