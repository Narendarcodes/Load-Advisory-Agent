import { describe, expect, it } from "vitest";

import { ORB_LABEL, nextOrbState, type OrbInput, type OrbState } from "./voice-orb";

const base: OrbInput = { status: "connected", muted: false, speaker: null };

function run(start: OrbState, inputs: Partial<OrbInput>[]): OrbState[] {
  const seen: OrbState[] = [];
  let state = start;
  let previous: OrbInput["speaker"] = null;
  for (const input of inputs) {
    const full: OrbInput = { ...base, ...input, previous };
    state = nextOrbState(state, full);
    previous = full.speaker;
    seen.push(state);
  }
  return seen;
}

describe("voice orb states (v6)", () => {
  it("is idle before a call, after it ends and when it fails", () => {
    for (const status of ["idle", "ended", "failed"] as const) {
      expect(nextOrbState("speaking", { ...base, status })).toBe("idle");
    }
  });

  it("shows connecting while the room connects or reconnects", () => {
    expect(nextOrbState("idle", { ...base, status: "connecting" })).toBe("connecting");
    expect(nextOrbState("listening", { ...base, status: "reconnecting" })).toBe("connecting");
  });

  it("listens once connected, and while the borrower speaks", () => {
    expect(nextOrbState("connecting", base)).toBe("listening");
    expect(nextOrbState("listening", { ...base, speaker: "user" })).toBe("listening");
    // Plain silence while listening stays listening.
    expect(nextOrbState("listening", { ...base, previous: null })).toBe("listening");
  });

  it("thinks after the borrower stops speaking, until the assistant answers", () => {
    expect(run("listening", [{ speaker: "user" }, { speaker: null }, { speaker: null }])).toEqual([
      "listening",
      "thinking",
      "thinking",
    ]);
    expect(nextOrbState("thinking", { ...base, speaker: "assistant" })).toBe("speaking");
    expect(nextOrbState("thinking", { ...base, answered: true })).toBe("listening");
  });

  it("goes back to listening when the assistant stops speaking", () => {
    expect(run("listening", [{ speaker: "assistant" }, { speaker: null }])).toEqual(["speaking", "listening"]);
  });

  it("is muted while the microphone is off, unless the assistant is speaking", () => {
    expect(nextOrbState("listening", { ...base, muted: true })).toBe("muted");
    expect(nextOrbState("muted", { ...base, muted: true, speaker: "assistant" })).toBe("speaking");
    expect(nextOrbState("muted", { ...base, muted: false })).toBe("listening");
  });

  it("has a plain-language label for every state", () => {
    for (const state of ["idle", "connecting", "listening", "thinking", "speaking", "muted"] as const) {
      expect(ORB_LABEL[state]).toMatch(/^[A-Z][a-z]/);
    }
  });
});
