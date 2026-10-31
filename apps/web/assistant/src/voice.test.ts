import { afterEach, describe, expect, it, vi } from "vitest";

import type { AssistantContext } from "./context";
import {
  createVoiceSession,
  endVoiceSession,
  isVoiceAuthError,
  voiceErrorMessage,
  VoiceError,
} from "./voice";

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

describe("voice session API", () => {
  it("records consent when asking for a room", async () => {
    const fetchMock = vi.fn(async () =>
      respond({
        message: {
          token: "jwt",
          url: "wss://voice.invalid",
          room: "loan-1",
          identity: "applicant-1",
          session_id: "a".repeat(32),
          expires_at: "2026-10-31 10:10:00",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await createVoiceSession(CONTEXT);

    expect(result.session_id).toBe("a".repeat(32));
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/method/loan_advisory_portal.api.livekit.create_voice_session");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["x-frappe-csrf-token"]).toBe("csrf-abc");
    expect(JSON.parse(String(init.body))).toEqual({ application: "LA-2026-00001", consent: 1 });
  });

  it("ends the caller's own session, keeping the request alive through a closing tab", async () => {
    const fetchMock = vi.fn(async () => respond({ message: { session_id: "a".repeat(32), status: "Ended", ended_at: null } }));
    vi.stubGlobal("fetch", fetchMock);

    await endVoiceSession(CONTEXT, "a".repeat(32), { keepalive: true });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/method/loan_advisory_portal.api.livekit.end_voice_session");
    expect(init.keepalive).toBe(true);
    expect(JSON.parse(String(init.body))).toEqual({ session_id: "a".repeat(32) });
  });

  it("turns a refusal into a typed error with the server's message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        respond({ exc_type: "Forbidden", _error_message: "This account is not linked to a borrower profile." }, { status: 403 }),
      ),
    );

    await expect(createVoiceSession(CONTEXT)).rejects.toMatchObject({
      name: "VoiceError",
      message: "This account is not linked to a borrower profile.",
      status: 403,
    });
  });

  it("treats a redirect to the login page as a signed-out session", async () => {
    const response = respond("<html></html>");
    Object.defineProperty(response, "redirected", { value: true });
    vi.stubGlobal("fetch", vi.fn(async () => response));

    const error = await createVoiceSession(CONTEXT).catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(VoiceError);
    expect(isVoiceAuthError(error)).toBe(true);
    expect(voiceErrorMessage(error)).toMatch(/sign in again/i);
  });

  it("explains an ended or unavailable service in borrower terms", () => {
    expect(voiceErrorMessage(new VoiceError("gone", 409))).toMatch(/already ended/i);
    expect(voiceErrorMessage(new VoiceError("down", 503))).toMatch(/not available/i);
    expect(voiceErrorMessage(new Error("boom"))).toMatch(/ask by text/i);
  });
});
