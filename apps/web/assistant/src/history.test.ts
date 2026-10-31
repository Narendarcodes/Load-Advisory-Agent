import { afterEach, describe, expect, it, vi } from "vitest";

import type { AssistantContext } from "./context";
import { conversationMessages, HistoryError, listConversations, recordTurn } from "./history";

const CONTEXT: AssistantContext = {
  application: "LA-2026-00001",
  user: "borrower@example.invalid",
  csrfToken: "csrf-abc",
  literacy: "medium",
  locale: "en",
  voice: { enabled: true, consentVersion: "voice-consent/1" },
};

function respond(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" }, ...init });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("conversation API", () => {
  it("lists the borrower's conversations for this application with a plain GET", async () => {
    const fetchMock = vi.fn(async () => respond({ message: [{ thread_id: "t-1", application: "LA-2026-00001" }] }));
    vi.stubGlobal("fetch", fetchMock);

    const rows = await listConversations(CONTEXT);

    expect(rows).toEqual([{ thread_id: "t-1", application: "LA-2026-00001" }]);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/method/loan_advisory_portal.api.agent.list_conversations?application=LA-2026-00001");
    expect(init.method).toBe("GET");
    expect(init.credentials).toBe("same-origin");
    expect((init.headers as Record<string, string>)["x-frappe-csrf-token"]).toBeUndefined();
  });

  it("reads one transcript by thread id", async () => {
    const fetchMock = vi.fn(async () =>
      respond({ message: { thread_id: "t-1", application: "LA-2026-00001", messages: [] } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const detail = await conversationMessages(CONTEXT, "t-1");
    expect(detail.thread_id).toBe("t-1");
    const [url] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/method/loan_advisory_portal.api.agent.conversation_messages?thread_id=t-1");
  });

  it("posts a finished turn with the CSRF header", async () => {
    const fetchMock = vi.fn(async () => respond({ message: { thread_id: "t-1", turn_count: 1 } }));
    vi.stubGlobal("fetch", fetchMock);

    await recordTurn(CONTEXT, "t-1", "why?", "because");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/method/loan_advisory_portal.api.agent.record_turn");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["x-frappe-csrf-token"]).toBe("csrf-abc");
    expect(JSON.parse(String(init.body))).toEqual({ thread_id: "t-1", question: "why?", answer: "because" });
  });

  it("surfaces the server refusal text and status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        respond({ exc_type: "NotFound", _error_message: "Conversation not found." }, { status: 404 }),
      ),
    );

    await expect(conversationMessages(CONTEXT, "gone")).rejects.toMatchObject({
      name: "HistoryError",
      message: "Conversation not found.",
      status: 404,
    });
  });

  it("treats a redirect to the login page as a signed-out session", async () => {
    const response = respond("<html></html>");
    Object.defineProperty(response, "redirected", { value: true });
    vi.stubGlobal("fetch", vi.fn(async () => response));

    await expect(listConversations(CONTEXT)).rejects.toBeInstanceOf(HistoryError);
    await expect(listConversations(CONTEXT)).rejects.toMatchObject({ status: 401 });
  });
});
