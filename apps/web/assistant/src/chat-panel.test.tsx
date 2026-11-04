import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AbstractAgent } from "@copilotkit/react-core/v2";

import { ChatPanel } from "./chat-panel";
import type { PublicState } from "./types";
import { parsePublicState } from "./genui/schema";

interface RunCall {
  runId: string;
  forwardedProps?: Record<string, unknown>;
}

function fakeAgent(rejectWith?: Error, answer?: string) {
  const calls: RunCall[] = [];
  const agent = {
    messages: [] as { id: string; role: string; content: string }[],
    state: {},
    addMessage: vi.fn(),
    setMessages: vi.fn(),
    setState: vi.fn(),
    runAgent: vi.fn(async (parameters: RunCall) => {
      calls.push(parameters);
      if (rejectWith) throw rejectWith;
      if (answer) agent.messages.push({ id: "answer", role: "assistant", content: answer });
    }),
  };
  return { agent: agent as unknown as AbstractAgent, calls };
}

function type(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  setter.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

let root: ReturnType<typeof createRoot> | undefined;
let container: HTMLDivElement | undefined;

afterEach(async () => {
  await act(async () => root?.unmount());
  container?.remove();
  root = undefined;
  container = undefined;
});

async function mount(agent: AbstractAgent, onSessionExpired = vi.fn(), state: PublicState = {}, extra: { storageKey?: string; csrfToken?: string } = {}) {
  container = document.createElement("div");
  document.body.append(container);
  const onAnswered = vi.fn();
  const onConversationReset = vi.fn();
  await act(async () => {
    root = createRoot(container!);
    root.render(
      <ChatPanel
        agent={agent}
        isReady
        application="LA-2026-00001"
        state={state}
        onSessionExpired={onSessionExpired}
        onAnswered={onAnswered}
        onConversationReset={onConversationReset}
        {...extra}
      />,
    );
  });
  return { container, onSessionExpired, onAnswered, onConversationReset };
}

describe("ChatPanel", () => {
  it("sends only the page application; identity and tone stay server-side", async () => {
    const { agent, calls } = fakeAgent();
    const { container: element } = await mount(agent);

    await act(async () => {
      type(element.querySelector("#question") as HTMLInputElement, "Why was I rejected?");
    });
    await act(async () => {
      element.querySelector("form.row")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].forwardedProps).toEqual({ application: "LA-2026-00001" });
    expect((agent as unknown as { addMessage: ReturnType<typeof vi.fn> }).addMessage).toHaveBeenCalledWith(
      expect.objectContaining({ role: "user", content: "Why was I rejected?" }),
    );
  });

  it("turns a 401 into a sign-in prompt and reports it upward", async () => {
    const { agent } = fakeAgent(new Error("401 sign in first"));
    const { container: element, onSessionExpired } = await mount(agent);

    await act(async () => {
      type(element.querySelector("#question") as HTMLInputElement, "why?");
    });
    await act(async () => {
      element.querySelector("form.row")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(onSessionExpired).toHaveBeenCalledOnce();
    expect(element.querySelector('[role="alert"]')?.textContent).toMatch(/session is no longer valid/i);
  });

  it("stores a completed exchange with the question and the answer", async () => {
    const { agent } = fakeAgent(undefined, "Because the recorded income did not cover the instalment.");
    const { container: element, onAnswered } = await mount(agent);

    await act(async () => {
      type(element.querySelector("#question") as HTMLInputElement, "Why was I rejected?");
    });
    await act(async () => {
      element.querySelector("form.row")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(onAnswered).toHaveBeenCalledWith(
      "Why was I rejected?",
      "Because the recorded income did not cover the instalment.",
    );
  });

  it("starts a new conversation when the server refuses the thread", async () => {
    const { agent } = fakeAgent(new Error("403 conversation does not match the signed-in session"));
    const { container: element, onConversationReset, onAnswered } = await mount(agent);

    await act(async () => {
      type(element.querySelector("#question") as HTMLInputElement, "why?");
    });
    await act(async () => {
      element.querySelector("form.row")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(onConversationReset).toHaveBeenCalledOnce();
    expect(onAnswered).not.toHaveBeenCalled();
    expect(element.querySelector('[role="alert"]')?.textContent).toMatch(/new one has been started/i);
  });

  it("offers starters while empty and swaps them for a typing bubble while the agent answers", async () => {
    let release: (() => void) | undefined;
    const agent = {
      messages: [],
      state: {},
      addMessage: vi.fn(),
      setMessages: vi.fn(),
      setState: vi.fn(),
      runAgent: vi.fn(() => new Promise<void>((resolve) => (release = resolve))),
    } as unknown as AbstractAgent;
    const { container: element } = await mount(agent);

    const chips = element.querySelectorAll<HTMLButtonElement>(".chips button");
    expect(chips.length).toBe(2);

    await act(async () => {
      chips[0].click();
    });
    expect(element.querySelector(".chat-empty")).toBeNull();
    expect(element.querySelector(".msg--live .typing")).not.toBeNull();
    expect((element.querySelector("#question") as HTMLInputElement).disabled).toBe(true);

    await act(async () => {
      release?.();
      await Promise.resolve();
    });
    // No answer arrived (the fake never adds one), so the empty state comes back, enabled.
    expect(element.querySelector<HTMLButtonElement>(".chips button")?.disabled).toBe(false);
  });

  it("shows the Saral mark on a plain circle while empty and a quiet thinking mark while working (final)", async () => {
    let release: (() => void) | undefined;
    const agent = {
      messages: [],
      state: {},
      addMessage: vi.fn(),
      setMessages: vi.fn(),
      setState: vi.fn(),
      runAgent: vi.fn(() => new Promise<void>((resolve) => (release = resolve))),
    } as unknown as AbstractAgent;
    const { container: element } = await mount(agent);
    const mark = element.querySelector(".chat-empty .chat-empty__mark");
    expect(mark).not.toBeNull();
    expect(mark?.querySelector("img")?.getAttribute("alt")).toBe("");
    expect(element.querySelector(".msg__thinking-mark")).toBeNull();

    await act(async () => {
      element.querySelector<HTMLButtonElement>(".chips button")?.click();
    });
    expect(element.querySelector(".chat-empty__mark")).toBeNull();
    expect(element.querySelector(".msg--live .msg__thinking-mark")).not.toBeNull();
    expect(element.querySelector(".msg--live .typing")).not.toBeNull();
    // No canvas or decorative data hooks: the treatment is plain CSS.
    expect(element.querySelector("canvas")).toBeNull();

    await act(async () => {
      release?.();
      await Promise.resolve();
    });
  });

  it("leaves the application facts to the page's header strip instead of repeating them in the log", async () => {
    // v2: assistant.html renders the slim "This application" strip with the decision and documents links.
    const { agent } = fakeAgent();
    const { container: element } = await mount(agent);
    expect(element.querySelector(".appctx")).toBeNull();
  });

  it("shows a real server stage only while the turn is running", async () => {
    let release: (() => void) | undefined;
    const agent = {
      messages: [],
      state: {},
      addMessage: vi.fn(),
      setMessages: vi.fn(),
      setState: vi.fn(),
      runAgent: vi.fn(() => new Promise<void>((resolve) => (release = resolve))),
    } as unknown as AbstractAgent;
    const { container: element } = await mount(agent, vi.fn(), parsePublicState({ progress: { stage: "retrieve_policy" } }));
    expect(element.querySelector(".progress")).toBeNull();

    await act(async () => {
      type(element.querySelector("#question") as HTMLInputElement, "why?");
    });
    await act(async () => {
      element.querySelector("form.row")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(element.querySelector(".progress")?.textContent).toContain("Searching the lender's policy documents");
    expect(element.textContent).not.toContain("retrieve_policy");

    await act(async () => {
      release?.();
      await Promise.resolve();
    });
    expect(element.querySelector(".progress")).toBeNull();
  });
});

const CARD = {
  application_ref: "LA-2026-00001",
  decision: "REJECTED",
  recorded_outcome: "REJECTED",
  policy_synthetic: true,
  rules: [{ rule_id: "MIN_CREDIT_SCORE", name: "Credit score", result: "FAIL", actual: "640", threshold: "≥ 700", actual_value: 640, threshold_value: 700, operator: ">=" }],
  failed_reason_codes: ["MIN_CREDIT_SCORE"],
  missing_fields: [],
  flags: [],
  answer_html: "<img src=x onerror=alert(1)>",
};

type Subscriber = { onStateSnapshotEvent?: (p: { event: { snapshot: unknown } }) => void };

/** An agent that replays the server's event order: progress snapshots, then the final state. */
function scriptedAgent(turns: { stages: string[]; final: Record<string, unknown>; answer: string }[]) {
  let turn = 0;
  let release: (() => void) | undefined;
  const agent = {
    messages: [] as { id: string; role: string; content: string }[],
    state: {} as Record<string, unknown>,
    addMessage: vi.fn((message: { id: string; role: string; content: string }) => agent.messages.push(message)),
    setMessages: vi.fn(),
    setState: vi.fn(),
    runAgent: vi.fn(async (_parameters: RunCall, subscriber?: Subscriber) => {
      const script = turns[turn++];
      for (const stage of script.stages) {
        agent.state = { progress: { stage } };
        subscriber?.onStateSnapshotEvent?.({ event: { snapshot: agent.state } });
      }
      await new Promise<void>((resolve) => (release = resolve));
      agent.state = script.final;
      subscriber?.onStateSnapshotEvent?.({ event: { snapshot: script.final } });
      agent.messages.push({ id: `a${turn}`, role: "assistant", content: script.answer });
    }),
  };
  return { agent: agent as unknown as AbstractAgent, finish: async () => act(async () => { release?.(); await Promise.resolve(); }) };
}

async function ask(element: HTMLElement, question: string) {
  await act(async () => {
    type(element.querySelector("#question") as HTMLInputElement, question);
  });
  await act(async () => {
    element.querySelector("form.row")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}

describe("ChatPanel conversation surface", () => {
  afterEach(() => window.sessionStorage.clear());

  it("shows a typing bubble at once and stacks progress steps instead of replacing them", async () => {
    const { agent, finish } = scriptedAgent([
      { stages: ["authenticate", "load_evidence", "compose"], final: {}, answer: "Done." },
    ]);
    const { container: element } = await mount(agent);
    await ask(element, "Why?");

    const steps = element.querySelectorAll(".msg--live .progress li");
    expect(element.querySelector(".msg--live .typing")).not.toBeNull();
    expect(Array.from(steps).map((step) => step.textContent)).toEqual([
      "Confirmed this is your application (done)",
      "Read your recorded decision (done)",
      "Writing the explanation",
    ]);
    expect(element.querySelector(".msg--live .trail svg")).not.toBeNull();

    await finish();
    expect(element.querySelector(".progress")).toBeNull();
    expect(element.querySelector(".msg.bot .run-steps summary")?.textContent).toBe("What I checked (3 steps)");
    expect((element.querySelector(".msg.bot .run-steps") as HTMLDetailsElement).open).toBe(true);
  });

  it("renders the answer's cards inside its own bubble and keeps them after the next turn", async () => {
    const { agent, finish } = scriptedAgent([
      { stages: ["load_evidence"], final: { decision_card: CARD }, answer: "Your **credit score** was below the minimum." },
      { stages: ["what_if"], final: { what_if: { changes: { credit_score: 720 }, simulated_decision: "APPROVED", is_simulation: true, rule_results: { MIN_CREDIT_SCORE: "PASS" } } }, answer: "In the simulation it passes." },
    ]);
    const { container: element } = await mount(agent);
    await ask(element, "Why was I rejected?");
    await finish();
    await ask(element, "What if my score was 720?");
    await finish();

    const bubbles = element.querySelectorAll(".msg.bot");
    expect(bubbles).toHaveLength(2);
    expect(bubbles[0].querySelector(".decision")?.textContent).toContain("Not approved");
    expect(bubbles[0].querySelector("strong")?.textContent).toBe("credit score");
    expect(bubbles[1].querySelector(".whatif")?.textContent).toContain("Estimate only, your application is unchanged");
    expect(bubbles[1].querySelector(".decision")).toBeNull();
    expect(element.querySelector("img[onerror], img[src='x']")).toBeNull();
    expect(element.textContent).not.toContain("About the latest answer");
  });

  it("restores cards for a transcript reloaded in the same tab", async () => {
    const storageKey = "loan-advisory:turns:u:LA-2026-00001:t1";
    const first = scriptedAgent([{ stages: ["load_evidence"], final: { decision_card: CARD }, answer: "Recorded reasons." }]);
    const { container: element } = await mount(first.agent, vi.fn(), {}, { storageKey });
    await ask(element, "Why?");
    await first.finish();
    await act(async () => root?.unmount());
    container?.remove();

    const restored = {
      messages: [
        { id: "stored-0", role: "user", content: "Why?" },
        { id: "stored-1", role: "assistant", content: "Recorded reasons." },
      ],
      state: {},
      addMessage: vi.fn(),
      setMessages: vi.fn(),
      setState: vi.fn(),
      runAgent: vi.fn(),
    } as unknown as AbstractAgent;
    const { container: again } = await mount(restored, vi.fn(), {}, { storageKey });
    expect(again.querySelector(".msg.bot .decision")?.textContent).toContain("Not approved");
    // Only the real stage: no line per rule, so no recorded value or cut-off is repeated in the trail.
    expect(again.querySelector(".msg.bot .run-steps summary")?.textContent).toBe("What I checked (1 step)");
    expect(again.querySelector(".msg.bot .run-steps")?.textContent).not.toMatch(/640|700|score|minimum/i);
  });

  it("offers follow-ups after an answer and starters only while empty", async () => {
    const { agent, finish } = scriptedAgent([{ stages: [], final: { decision_card: CARD }, answer: "Reasons." }]);
    const { container: element } = await mount(agent);
    expect(element.querySelectorAll(".chat-empty .chips button")).toHaveLength(2);
    await ask(element, "Why?");
    await finish();
    expect(element.querySelector(".chat-empty")).toBeNull();
    const followups = Array.from(element.querySelectorAll(".followups button")).map((b) => b.textContent);
    expect(followups).toContain("What can I do to improve before reapplying?");
  });

  it("opens the what-if form only on request", async () => {
    const { agent } = fakeAgent();
    const { container: element } = await mount(agent);
    expect(element.querySelector(".whatif-form")).toBeNull();
    const toggle = Array.from(element.querySelectorAll<HTMLButtonElement>(".composer__tools button")).find(
      (button) => button.textContent === "Try a what-if",
    )!;
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    await act(async () => toggle.click());
    expect(element.querySelector(".whatif-form")).not.toBeNull();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });

  it("shows a failure inside the bot bubble with a Retry that re-asks without duplicating the question", async () => {
    const { agent, calls } = fakeAgent(new Error("503 busy"));
    const { container: element } = await mount(agent);
    await ask(element, "Why?");
    const bubble = element.querySelector(".msg.bot.msg--error");
    expect(bubble?.getAttribute("role")).toBe("alert");
    expect(bubble?.textContent).toMatch(/busy or unavailable/);
    expect(bubble?.querySelector('img[alt=""]')).not.toBeNull();
    const addMessage = (agent as unknown as { addMessage: ReturnType<typeof vi.fn> }).addMessage;
    expect(addMessage).toHaveBeenCalledTimes(1);
    await act(async () => (bubble!.querySelector("button") as HTMLButtonElement).click());
    expect(calls).toHaveLength(2);
    expect(addMessage).toHaveBeenCalledTimes(1);
  });

  it("shows feedback thumbs only when the page can post feedback", async () => {
    const without = scriptedAgent([{ stages: [], final: {}, answer: "A." }]);
    const { container: element } = await mount(without.agent);
    await ask(element, "Q?");
    await without.finish();
    expect(element.querySelector(".feedback")).toBeNull();
  });

  it("posts a thumbs-up to the existing feedback endpoint without the answer text", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const scripted = scriptedAgent([{ stages: [], final: {}, answer: "A private answer." }]);
    const { container: element } = await mount(scripted.agent, vi.fn(), {}, { csrfToken: "tok" });
    await ask(element, "Q?");
    await scripted.finish();
    await act(async () => (element.querySelector('.feedback button[aria-label="Helpful"]') as HTMLButtonElement).click());
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/method/loan_advisory_portal.api.feedback.submit_feedback");
    expect(JSON.parse(String(init.body))).toMatchObject({ rating: 5, category: "assistant", application: "LA-2026-00001" });
    expect(String(init.body)).not.toContain("private answer");
    expect(element.querySelector(".feedback")?.textContent).toContain("Thanks");
    vi.unstubAllGlobals();
  });
});
