import type { VoiceStatus } from "./voice";

/** What the voice orb shows. Decorative: the status line and the transcript carry the meaning. */
export type OrbState = "idle" | "connecting" | "listening" | "thinking" | "speaking" | "muted";

/** Who the call's own speaker detection says is talking right now. */
export type VoiceSpeaker = "user" | "assistant" | null;

export interface OrbInput {
  status: VoiceStatus;
  muted: boolean;
  speaker: VoiceSpeaker;
  /** Who was talking at the previous update. */
  previous?: VoiceSpeaker;
  /** An answer arrived on the transcript channel. */
  answered?: boolean;
}

export const ORB_LABEL: Record<OrbState, string> = {
  idle: "Ready when you are",
  connecting: "Connecting",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
  muted: "Microphone off",
};

/**
 * The orb's next state. Pure, so the transitions are tested without a room or a microphone:
 * the borrower speaks (listening) → stops (thinking) → the assistant speaks (speaking) → listening.
 */
export function nextOrbState(current: OrbState, input: OrbInput): OrbState {
  if (input.status === "idle" || input.status === "ended" || input.status === "failed") return "idle";
  if (input.status === "connecting" || input.status === "reconnecting") return "connecting";
  if (input.speaker === "assistant") return "speaking";
  if (input.muted) return "muted";
  if (input.speaker === "user") return "listening";
  if (input.answered) return "listening";
  // Silence right after the borrower spoke is the assistant working on the answer.
  if (input.previous === "user" || current === "thinking") return "thinking";
  return "listening";
}
