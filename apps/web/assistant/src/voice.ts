import type { AssistantContext } from "./context";

/** What Frappe hands the browser after recording the notice: a short-lived room grant, not an assertion. */
export interface VoiceSessionInfo {
  token: string;
  url: string;
  room: string;
  identity: string;
  session_id: string;
  expires_at: string;
}

export type VoiceStatus = "idle" | "connecting" | "connected" | "reconnecting" | "ended" | "failed";

/** A Frappe refusal. `status` is the HTTP status, or 401 when the session had already expired. */
export class VoiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "VoiceError";
  }
}

const BASE = "/api/method/loan_advisory_portal.api.livekit.";

function messageOf(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const body = payload as { _error_message?: unknown; exc_type?: unknown; message?: unknown };
  if (typeof body._error_message === "string" && body._error_message) return body._error_message;
  if (typeof body.exc_type === "string" && body.exc_type) return body.exc_type;
  if (typeof body.message === "string" && body.message) return body.message;
  return undefined;
}

async function post<T>(
  method: string,
  context: AssistantContext,
  body: Record<string, unknown>,
  options: { keepalive?: boolean; signal?: AbortSignal } = {},
): Promise<T> {
  const response = await fetch(`${BASE}${method}`, {
    method: "POST",
    credentials: "same-origin",
    keepalive: options.keepalive,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-frappe-csrf-token": context.csrfToken,
    },
    body: JSON.stringify(body),
    signal: options.signal,
  });

  // A dead session is redirected to /login; fetch follows it, so a document body would be
  // mistaken for a result unless the redirect itself is treated as signed out.
  if (response.redirected) throw new VoiceError("sign in again", 401);

  let payload: unknown = undefined;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }
  if (!response.ok) {
    throw new VoiceError(messageOf(payload) ?? `request failed (${response.status})`, response.status);
  }
  return (payload as { message?: T } | undefined)?.message as T;
}

/** Consent travels with the request: Frappe refuses to mint a session without it and records it. */
export function createVoiceSession(
  context: AssistantContext,
  signal?: AbortSignal,
): Promise<VoiceSessionInfo> {
  return post<VoiceSessionInfo>(
    "create_voice_session",
    context,
    { application: context.application, consent: 1 },
    { signal },
  );
}

/**
 * Closes the caller's own session. Safe to call more than once: the server reports the state it
 * already holds. `keepalive` lets a tab that is closing still deliver the end.
 */
export function endVoiceSession(
  context: AssistantContext,
  sessionId: string,
  options: { keepalive?: boolean } = {},
): Promise<{ session_id: string; status: string; ended_at: string | null }> {
  return post("end_voice_session", context, { session_id: sessionId }, options);
}

export function isVoiceAuthError(error: unknown): boolean {
  return error instanceof VoiceError && error.status === 401;
}

export function voiceErrorMessage(error: unknown): string {
  if (isVoiceAuthError(error)) return "Your session is no longer valid. Sign in again to start voice.";
  if (error instanceof VoiceError && error.status === 409) return "That voice session has already ended. Start a new one.";
  if (error instanceof VoiceError && error.status === 503) return "The voice service is not available right now. You can still ask by text.";
  return "Voice could not start. Check the connection and try again, or ask by text.";
}
