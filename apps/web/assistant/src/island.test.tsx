import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AbstractAgent } from "@copilotkit/react-core/v2";

import type { AssistantContext } from "./context";

const calls = vi.hoisted(() => ({
  list: vi.fn(),
  messages: vi.fn(),
  record: vi.fn(),
  chatProps: [] as Record<string, unknown>[],
}));

vi.mock("./history", () => {
  class HistoryError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
      this.name = "HistoryError";
    }
  }
  return {
    HistoryError,
    listConversations: (context: unknown, signal?: AbortSignal) => calls.list(context, signal),
    conversationMessages: (context: unknown, threadId: string, signal?: AbortSignal) => calls.messages(context, threadId, signal),
    recordTurn: (context: unknown, threadId: string, question: string, answer: string) =>
      calls.record(context, threadId, question, answer),
  };
});

vi.mock("./chat-panel", () => ({
  ChatPanel: (props: Record<string, unknown>) => {
    calls.chatProps.push(props);
    return null;
  },
}));
vi.mock("./plan-panel", () => ({ PlanPanel: () => null }));
vi.mock("./voice-panel", () => ({ VoicePanel: () => null }));

const agentHolder = vi.hoisted(() => ({ current: undefined as unknown as AbstractAgent }));

vi.mock("@copilotkit/react-core/v2", () => ({
  UseAgentUpdate: { OnMessagesChanged: "messages", OnStateChanged: "state", OnRunStatusChanged: "status" },
  useAgent: () => ({ agent: agentHolder.current, isReady: true }),
}));

const { Island } = await import("./island");

const USER = "borrower@example.invalid";
const APPLICATION = "LA-1";

function fakeAgent(): AbstractAgent {
  return {
    messages: [],
    state: {},
    threadId: "",
    setMessages: vi.fn(),
    setState: vi.fn(),
  } as unknown as AbstractAgent;
}

const context: AssistantContext = {
  application: APPLICATION,
  user: USER,
  csrfToken: "csrf",
  literacy: "medium",
  locale: "en",
  voice: { enabled: false, consentVersion: "voice-consent/1" },
};

let root: Root | undefined;
let container: HTMLDivElement | undefined;

async function mount() {
  agentHolder.current = fakeAgent();
  container = document.createElement("div");
  document.body.append(container);
  await act(async () => {
    root = createRoot(container!);
    root.render(<Island context={context} />);
  });
  return agentHolder.current;
}

/** The transcript is only restored on a later page load, so a remount is how a reload is modelled. */
async function reload() {
  await act(async () => root?.unmount());
  root = undefined;
  container?.remove();
  container = undefined;
  return mount();
}

function lastAnswered(): (question: string, answer: string) => Promise<void> {
  return calls.chatProps.at(-1)!.onAnswered as (question: string, answer: string) => Promise<void>;
}

beforeEach(() => {
  window.sessionStorage.clear();
  calls.list.mockClear();
  calls.messages.mockClear();
  calls.record.mockClear();
  calls.chatProps.length = 0;
  calls.list.mockResolvedValue([]);
  calls.messages.mockImplementation(async (_c: unknown, threadId: string) => ({
    thread_id: threadId,
    application: APPLICATION,
    messages: [],
  }));
  calls.record.mockImplementation(async (_c: unknown, threadId: string) => ({ thread_id: threadId, turn_count: 1 }));
});

afterEach(async () => {
  await act(async () => root?.unmount());
  root = undefined;
  container?.remove();
  container = undefined;
});

describe("assistant island transcript loading", () => {
  it("does not ask for the transcript of a thread it just minted", async () => {
    const agent = await mount();
    expect(agent.threadId).toMatch(/^[A-Za-z0-9._:-]{1,128}$/);
    expect(calls.messages).not.toHaveBeenCalled();
    expect(calls.list).toHaveBeenCalledTimes(1);
  });

  it("still does not ask after a reload of a thread that never had a turn", async () => {
    const first = await mount();
    const again = await reload();
    expect(again.threadId).toBe(first.threadId);
    expect(calls.messages).not.toHaveBeenCalled();
  });

  it("asks for the transcript once a recorded turn has stored it", async () => {
    const agent = await mount();
    await act(async () => lastAnswered()("What is my eligibility?", "Here is why."));
    expect(calls.record).toHaveBeenCalledWith(context, agent.threadId, "What is my eligibility?", "Here is why.");

    const reloaded = await reload();
    expect(reloaded.threadId).toBe(agent.threadId);
    expect(calls.messages).toHaveBeenCalledTimes(1);
    expect(calls.messages).toHaveBeenCalledWith(context, agent.threadId, undefined);
  });

  it("asks for the transcript of a conversation reopened from the list", async () => {
    calls.list.mockResolvedValue([
      { thread_id: "stored-thread", application: APPLICATION, title: "Eligibility", turn_count: 2, last_activity: null, status: "Open" },
    ]);
    await mount();
    const button = container!.querySelector<HTMLButtonElement>(".history__item");
    expect(button).toBeTruthy();
    await act(async () => button!.click());
    expect(calls.messages).toHaveBeenCalledTimes(1);
    expect(calls.messages).toHaveBeenCalledWith(context, "stored-thread", undefined);
  });

  it("keeps the panel empty when the server refuses a transcript", async () => {
    const { HistoryError } = await import("./history");
    calls.messages.mockRejectedValue(new HistoryError("Conversation not found.", 404));
    window.sessionStorage.setItem(`loan-advisory:thread:${USER}:${APPLICATION}`, "stored-thread");
    const agent = await mount();
    expect(calls.messages).toHaveBeenCalledTimes(1);
    expect(agent.setMessages).toHaveBeenCalledWith([]);
    expect(agent.setMessages).not.toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ content: expect.any(String) })]));
  });

  it("starts a fresh thread from the control without loading its transcript", async () => {
    const first = await mount();
    const button = Array.from(container!.querySelectorAll<HTMLButtonElement>("button")).find(
      (b) => b.textContent === "New conversation",
    );
    expect(button).toBeTruthy();
    await act(async () => button!.click());
    expect(first.threadId).not.toBe("");
    expect(calls.messages).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem(`loan-advisory:thread:${USER}:${APPLICATION}:pending`)).toBe(first.threadId);
  });

  it("signs the borrower in again when the session died mid-load", async () => {
    const { HistoryError } = await import("./history");
    calls.list.mockRejectedValue(new HistoryError("sign in again", 401));
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    await mount();
    expect(assign).toHaveBeenCalledWith(expect.stringContaining("/login?redirect-to="));
    vi.unstubAllGlobals();
  });
});

describe("assistant tools drawer", () => {
  it("does not reuse the portal's global .drawer class, which pins a fixed full-height side panel", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    // Vitest runs from apps/web/assistant.
    const portalCss = readFileSync(
      resolve(process.cwd(), "../../loan_advisory_portal/loan_advisory_portal/public/css/portal.css"),
      "utf8",
    );
    // The collision this guards against: portal.css styles any `.drawer` as position:fixed; inset:0 0 0 auto.
    expect(portalCss).toMatch(/^\.drawer \{/m);

    await mount();
    const history = Array.from(container!.querySelectorAll<HTMLButtonElement>("button")).find(
      (b) => b.textContent === "History",
    );
    await act(async () => history!.click());
    const aside = container!.querySelector<HTMLElement>(".assistant__aside")!;
    expect(aside.hidden).toBe(false);
    expect(aside.classList.contains("drawer")).toBe(false);
    expect(aside.classList.contains("tools-drawer")).toBe(true);
  });
});
