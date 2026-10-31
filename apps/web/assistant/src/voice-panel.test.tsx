import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AssistantContext } from "./context";
import { VoicePanel } from "./voice-panel";
import type { VoiceStatus } from "./voice";
import type { VoiceTransport, VoiceUtterance } from "./voice-transport";

const SESSION_ID = "a".repeat(32);

function expiresLater(): string {
  const at = new Date(Date.now() + 600_000);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())} ${pad(at.getHours())}:${pad(at.getMinutes())}:${pad(at.getSeconds())}`;
}

function context(enabled = true): AssistantContext {
  return {
    application: "LA-2026-00001",
    user: "borrower@example.invalid",
    csrfToken: "csrf-abc",
    literacy: "medium",
    locale: "en",
    voice: { enabled, consentVersion: "voice-consent/1" },
  };
}

function respond(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
}

function fakeTransport() {
  const statusHandlers = new Set<(status: VoiceStatus) => void>();
  const utteranceHandlers = new Set<(utterance: VoiceUtterance) => void>();
  const transport: VoiceTransport = {
    connect: vi.fn(async () => {}),
    disconnect: vi.fn(async () => {}),
    setMicrophoneEnabled: vi.fn(async () => {}),
    onStatus(handler) {
      statusHandlers.add(handler);
      return () => statusHandlers.delete(handler);
    },
    onUtterance(handler) {
      utteranceHandlers.add(handler);
      return () => utteranceHandlers.delete(handler);
    },
  };
  return {
    transport,
    emitStatus: (status: VoiceStatus) => statusHandlers.forEach((handler) => handler(status)),
    emitUtterance: (utterance: VoiceUtterance) => utteranceHandlers.forEach((handler) => handler(utterance)),
  };
}

function stubFetch() {
  const fetchMock = vi.fn(async (url: string) => {
    if (url.endsWith("create_voice_session")) {
      return respond({
        message: {
          token: "jwt-token",
          url: "wss://voice.invalid",
          room: "loan-1",
          identity: "applicant-1",
          session_id: SESSION_ID,
          expires_at: expiresLater(),
        },
      });
    }
    return respond({ message: { session_id: SESSION_ID, status: "Ended", ended_at: null } });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

let root: ReturnType<typeof createRoot> | undefined;
let container: HTMLDivElement | undefined;

afterEach(async () => {
  await act(async () => root?.unmount());
  container?.remove();
  root = undefined;
  container = undefined;
  vi.unstubAllGlobals();
});

async function mount(createTransport: () => VoiceTransport | Promise<VoiceTransport>, enabled = true) {
  const ctx = context(enabled);
  container = document.createElement("div");
  document.body.append(container);
  const onSessionExpired = vi.fn();
  await act(async () => {
    root = createRoot(container!);
    root.render(<VoicePanel context={ctx} createTransport={createTransport} onSessionExpired={onSessionExpired} />);
  });
  return { element: container, onSessionExpired };
}

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function button(element: HTMLElement, label: RegExp): HTMLButtonElement {
  return [...element.querySelectorAll<HTMLButtonElement>("button")].find((item) => label.test(item.textContent ?? ""))!;
}

async function startCall(element: HTMLElement) {
  const consent = element.querySelector<HTMLInputElement>("#voice-consent")!;
  await act(async () => {
    consent.click();
  });
  await act(async () => {
    button(element, /start voice/i).click();
  });
  await flush();
}

describe("VoicePanel", () => {
  it("says so when the site cannot offer voice", async () => {
    const { element } = await mount(() => fakeTransport().transport, false);
    expect(element.textContent).toMatch(/not available/i);
    expect(element.querySelector("#voice-consent")).toBeNull();
  });

  it("starts only after explicit consent and joins the room Frappe minted", async () => {
    const fetchMock = stubFetch();
    const { transport } = fakeTransport();
    const { element } = await mount(() => transport);

    expect(button(element, /start voice/i).disabled).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();

    await startCall(element);

    const create = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(create[1].body))).toEqual({ application: "LA-2026-00001", consent: 1 });
    expect(transport.connect).toHaveBeenCalledWith("wss://voice.invalid", "jwt-token");
    expect(transport.setMicrophoneEnabled).toHaveBeenCalledWith(true);
    expect(element.textContent).toMatch(/connected/i);
    expect(button(element, /end session/i)).toBeTruthy();
  });

  it("shows the turn transcript and lets the borrower hide or clear it", async () => {
    stubFetch();
    const { transport, emitUtterance } = fakeTransport();
    const { element } = await mount(() => transport);
    await startCall(element);

    await act(async () => {
      emitUtterance({ role: "user", text: "Why was my loan rejected?" });
      emitUtterance({ role: "assistant", text: "The recorded income did not cover the instalment." });
    });
    expect(element.textContent).toContain("Why was my loan rejected?");
    expect(element.textContent).toContain("The recorded income did not cover the instalment.");

    await act(async () => {
      button(element, /hide transcript/i).click();
    });
    expect(element.textContent).not.toContain("Why was my loan rejected?");

    await act(async () => {
      button(element, /show transcript/i).click();
    });
    expect(element.textContent).toContain("Why was my loan rejected?");

    await act(async () => {
      button(element, /clear transcript/i).click();
    });
    expect(element.textContent).not.toContain("Why was my loan rejected?");
    expect(element.querySelector("#voice-transcript")).toBeNull();
  });

  it("ends the call in the room and on the server", async () => {
    const fetchMock = stubFetch();
    const { transport } = fakeTransport();
    const { element } = await mount(() => transport);
    await startCall(element);

    await act(async () => {
      button(element, /end session/i).click();
    });
    await flush();

    expect(transport.disconnect).toHaveBeenCalled();
    const end = fetchMock.mock.calls.find(([url]) =>
      String(url).endsWith("end_voice_session"),
    ) as unknown as [string, RequestInit];
    expect(JSON.parse(String(end[1].body))).toEqual({ session_id: SESSION_ID });
    expect(element.textContent).toMatch(/voice session ended/i);
    expect(button(element, /start a new voice session/i)).toBeTruthy();
  });

  it("refuses nothing silently: a blocked microphone is explained and the session is closed", async () => {
    const fetchMock = stubFetch();
    const fake = fakeTransport();
    fake.transport.connect = vi.fn(async () => {
      throw new DOMException("denied", "NotAllowedError");
    });
    const { element } = await mount(() => fake.transport);

    await startCall(element);

    expect(element.querySelector('[role="alert"]')?.textContent).toMatch(/microphone is blocked/i);
    expect(element.textContent).toMatch(/voice could not start/i);
    expect(
      fetchMock.mock.calls.some(([url]) => String(url).endsWith("end_voice_session")),
    ).toBe(true);
  });

  it("mirrors a reconnect from the room instead of pretending it is still connected", async () => {
    stubFetch();
    const { transport, emitStatus } = fakeTransport();
    const { element } = await mount(() => transport);
    await startCall(element);

    await act(async () => {
      emitStatus("reconnecting");
    });
    expect(element.textContent).toMatch(/reconnecting/i);
    expect(element.querySelector(".voice__status--reconnecting")).toBeTruthy();
  });

  it("signs in again when Frappe no longer recognises the session", async () => {
    const response = respond({ message: {} });
    Object.defineProperty(response, "redirected", { value: true });
    vi.stubGlobal("fetch", vi.fn(async () => response));
    const { element, onSessionExpired } = await mount(() => fakeTransport().transport);

    await startCall(element);

    expect(onSessionExpired).toHaveBeenCalledOnce();
    expect(element.querySelector('[role="alert"]')?.textContent).toMatch(/sign in again/i);
  });
});
