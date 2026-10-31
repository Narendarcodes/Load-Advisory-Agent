import type { AssistantContext } from "./context";

export interface Conversation {
  thread_id: string;
  application: string;
  title?: string | null;
  turn_count?: number;
  last_activity?: string | null;
  status?: string;
}

export interface StoredMessage {
  role: "user" | "assistant";
  text: string;
  at?: string;
}

export interface ConversationDetail {
  thread_id: string;
  application: string;
  title?: string | null;
  messages: StoredMessage[];
}

/** A Frappe refusal. `status` is the HTTP status, or 401 when the session had already expired. */
export class HistoryError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "HistoryError";
  }
}

const BASE = "/api/method/loan_advisory_portal.api.agent.";

function messageOf(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const body = payload as { _error_message?: unknown; exc_type?: unknown; message?: unknown };
  if (typeof body._error_message === "string" && body._error_message) return body._error_message;
  if (typeof body.exc_type === "string" && body.exc_type) return body.exc_type;
  if (typeof body.message === "string" && body.message) return body.message;
  return undefined;
}

async function call<T>(
  method: string,
  context: AssistantContext,
  options: { query?: Record<string, string>; body?: unknown; method?: "GET" | "POST"; signal?: AbortSignal } = {},
): Promise<T> {
  const verb = options.method ?? (options.body ? "POST" : "GET");
  const query = new URLSearchParams(options.query ?? {}).toString();
  const response = await fetch(`${BASE}${method}${query ? `?${query}` : ""}`, {
    method: verb,
    credentials: "same-origin",
    headers: {
      accept: "application/json",
      ...(verb === "POST"
        ? { "content-type": "application/json", "x-frappe-csrf-token": context.csrfToken }
        : {}),
    },
    body: verb === "POST" ? JSON.stringify(options.body ?? {}) : undefined,
    signal: options.signal,
  });

  // Frappe answers a dead session with a redirect to /login; fetch follows it, so the status
  // stays 200 while the body is a document. Treat that as a signed-out session, not as history.
  if (response.redirected) throw new HistoryError("sign in again", 401);

  let payload: unknown = undefined;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }
  if (!response.ok) {
    throw new HistoryError(messageOf(payload) ?? `request failed (${response.status})`, response.status);
  }
  const message = (payload as { message?: T } | undefined)?.message;
  return message as T;
}

/** The borrower's own conversations for one application, newest first. */
export function listConversations(context: AssistantContext, signal?: AbortSignal): Promise<Conversation[]> {
  return call<Conversation[]>("list_conversations", context, {
    query: { application: context.application },
    signal,
  });
}

/** The stored transcript of one owned conversation. 404 means it is gone or not this borrower's. */
export function conversationMessages(
  context: AssistantContext,
  threadId: string,
  signal?: AbortSignal,
): Promise<ConversationDetail> {
  return call<ConversationDetail>("conversation_messages", context, { query: { thread_id: threadId }, signal });
}

/** Bookkeeping after a completed turn: the server decides ownership, roles and the stored length. */
export function recordTurn(
  context: AssistantContext,
  threadId: string,
  question: string,
  answer: string,
): Promise<{ thread_id: string; turn_count: number }> {
  return call<{ thread_id: string; turn_count: number }>("record_turn", context, {
    body: { thread_id: threadId, question, answer },
  });
}
