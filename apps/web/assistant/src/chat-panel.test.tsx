import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AbstractAgent } from "@copilotkit/react-core/v2";

import { ChatPanel } from "./chat-panel";

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

async function mount(agent: AbstractAgent, onSessionExpired = vi.fn()) {
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
        state={{}}
        onSessionExpired={onSessionExpired}
        onAnswered={onAnswered}
        onConversationReset={onConversationReset}
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
      element.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
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
      element.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
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
      element.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
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
      element.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(onConversationReset).toHaveBeenCalledOnce();
    expect(onAnswered).not.toHaveBeenCalled();
    expect(element.querySelector('[role="alert"]')?.textContent).toMatch(/new one has been started/i);
  });

  it("suggests questions and disables them while the agent answers", async () => {
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
    expect(chips.length).toBeGreaterThan(1);

    await act(async () => {
      chips[0].click();
    });
    expect(chips[0].disabled).toBe(true);

    await act(async () => {
      release?.();
      await Promise.resolve();
    });
    expect(chips[0].disabled).toBe(false);
  });
});
