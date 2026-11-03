import { afterEach, describe, expect, it } from "vitest";

import {
  addStage,
  answerKey,
  displayText,
  followUps,
  formattedAnswer,
  keptState,
  liveText,
  loadTurns,
  metaFor,
  saveTurns,
  turnsKey,
} from "./turns";

afterEach(() => window.sessionStorage.clear());

describe("progress stages", () => {
  it("accumulates stages in arrival order instead of replacing them", () => {
    let stages: string[] = [];
    for (const stage of ["authenticate", "load_evidence", "load_evidence", "retrieve_policy", "compose"]) {
      stages = addStage(stages, stage);
    }
    expect(stages).toEqual(["authenticate", "load_evidence", "retrieve_policy", "compose"]);
  });

  it("ignores stage ids the portal does not know how to label", () => {
    expect(addStage(["authenticate"], "internal_router_node")).toEqual(["authenticate"]);
    expect(addStage([], 42)).toEqual([]);
  });
});

describe("per-answer storage", () => {
  const key = turnsKey("u@example.com", "LA-1", "thread-1");

  it("round-trips the kept state and drops request and trace ids", () => {
    const state = keptState({
      request_id: "req",
      trace_id: "trace",
      citations: [{ label: "1", document_id: "d", title: "Policy" }],
      handoff_ref: "HO-1",
    });
    saveTurns(key, [{ answer: "Because", stages: ["compose"], state }]);
    const [turn] = loadTurns(key);
    expect(turn.state).toMatchObject({ citations: [{ label: "1", document_id: "d", title: "Policy" }], handoff_ref: "HO-1" });
    expect(Object.keys(turn.state ?? {}).sort()).toEqual(["citations", "handoff_ref"]);
    expect(JSON.stringify(turn)).not.toContain("trace");
  });

  it("re-validates stored data and drops forged fields", () => {
    window.sessionStorage.setItem(
      key,
      JSON.stringify([
        { answer: "ok", stages: ["compose", "evil_stage"], state: { answer_html: "<img src=x onerror=alert(1)>", handoff_ref: "HO-2" } },
        { stages: [] },
        "junk",
      ]),
    );
    const turns = loadTurns(key);
    expect(turns).toHaveLength(1);
    expect(turns[0].stages).toEqual(["compose"]);
    expect(JSON.stringify(turns[0])).not.toContain("onerror");
  });

  it("survives unreadable storage", () => {
    window.sessionStorage.setItem(key, "{not json");
    expect(loadTurns(key)).toEqual([]);
    expect(loadTurns(undefined)).toEqual([]);
  });

  it("re-attaches a meta only to the answer it was stored for", () => {
    const turns = [
      { answer: "First answer", stages: [] },
      { answer: "Second answer", stages: ["compose"] },
    ];
    expect(metaFor(turns, 1, "Second answer")?.stages).toEqual(["compose"]);
    expect(metaFor(turns, 0, "Second answer")?.stages).toEqual(["compose"]);
    expect(metaFor(turns, 1, "Something else")).toBeUndefined();
  });
});

describe("follow-up suggestions", () => {
  it("offers improvement for a decision with unmet checks and caps at three", () => {
    const chips = followUps({
      decision_card: {
        policy_synthetic: true,
        recorded_outcome: "REJECTED",
        offer: null,
        themes: ["CREDIT_HISTORY"],
        missing_fields: [],
      },
      missing_information: ["monthly_income"],
    });
    expect(chips).toContain("What can I do to improve before reapplying?");
    expect(chips.length).toBeLessThanOrEqual(3);
  });

  it("always offers a way to a person", () => {
    expect(followUps(undefined)).toContain("How do I talk to a person about this?");
  });
});

describe("formatted answer text", () => {
  const streamed =
    "Your application was **not approved**. ### What did not pass 1. **EMIs:** 50% of income. - Pay down one loan. ";
  const final =
    "Your application was **not approved**.\n\n### What did not pass\n\n1. **EMIs:** 50% of income.\n\n- Pay down one loan.";

  it("uses the final answer's line breaks when its words match the streamed sentences", () => {
    expect(formattedAnswer(streamed, final)).toBe(final);
  });

  it("keeps the streamed text when the final answer says something else", () => {
    expect(formattedAnswer(streamed, final + "\n\nAn extra sentence the stream never showed.")).toBe(streamed);
    expect(formattedAnswer(streamed, "A different answer.")).toBe(streamed);
  });

  it("keeps the streamed text when there is no usable final answer", () => {
    expect(formattedAnswer(streamed, undefined)).toBe(streamed);
    expect(formattedAnswer(streamed, 42)).toBe(streamed);
    expect(formattedAnswer(streamed, "")).toBe(streamed);
  });

  it("stores the formatted text with the turn and only re-applies it to the same words", () => {
    const key = turnsKey("u@example.invalid", "APP-T", "thread-f");
    saveTurns(key, [{ answer: answerKey(streamed), stages: [], text: final }]);
    const [meta] = loadTurns(key);
    expect(meta.text).toBe(final);
    expect(displayText(meta, streamed)).toBe(final);
    expect(displayText(meta, "Another answer entirely.")).toBe("Another answer entirely.");
    expect(displayText(undefined, streamed)).toBe(streamed);
  });

  it("finds the cards of a restored answer whose text kept its line breaks", () => {
    const meta = { answer: answerKey(streamed), stages: ["compose"] };
    expect(metaFor([meta], 0, final)).toBe(meta);
  });
});

describe("live (still streaming) answer text", () => {
  const streamed =
    "Your application was **not approved** because two checks did not pass. ### What did not pass " +
    "1. **Existing EMIs:** 50% of income; the limit is 45%. 2. **Credit score:** 612 is recorded. " +
    "### What you can do - Pay down one loan. - Keep repayments on time. > A what-if never changes your application.";

  it("puts headings, list items and quotes back on their own lines so they render while streaming", () => {
    const text = liveText(streamed);
    expect(text).toContain("\n\n### What did not pass\n");
    expect(text).toContain("\n1. **Existing EMIs:**");
    expect(text).toContain("\n2. **Credit score:**");
    expect(text).toContain("\n\n### What you can do\n");
    expect(text).toContain("\n- Pay down one loan.");
    expect(text).toContain("\n- Keep repayments on time.");
    expect(text).toContain("\n\n> A what-if never changes");
  });

  it("only changes whitespace, never the words", () => {
    expect(liveText(streamed).replace(/\s+/g, " ")).toBe(streamed.replace(/\s+/g, " "));
  });

  it("leaves prose with numbers and hyphens alone", () => {
    const prose = "Your EMI is 12,500 per month for 24 months - about 3. 5% of the total.";
    expect(liveText("The limit is 45% of income and a well-kept record helps.")).toBe(
      "The limit is 45% of income and a well-kept record helps.",
    );
    expect(liveText(prose).replace(/\s+/g, " ")).toBe(prose);
  });

  it("also fixes a stream whose chunks keep some of their own line breaks", () => {
    // How the stream really arrives: split at sentence ends, each chunk trimmed at its end only.
    const mixed = "did not pass. ### What did not pass\n\n1. **EMIs:** 50%; the limit is 45%. 2. **Score:** 612. ";
    const text = liveText(mixed);
    expect(text).toContain("\n\n### What did not pass\n");
    expect(text).toContain("\n2. **Score:**");
  });

  it("keeps text that already has line breaks as it is", () => {
    const formatted = "Intro.\n\n### Heading\n\n1. One\n2. Two";
    expect(liveText(formatted)).toBe(formatted);
  });
});
