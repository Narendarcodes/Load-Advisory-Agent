import { useEffect, useRef, useState, type FormEvent } from "react";
import type { AbstractAgent, Message } from "@copilotkit/react-core/v2";

import type { PublicState } from "./types";
import { AnswerDetails } from "./answer-details";

const CHIPS = [
  "Why was my loan rejected?",
  "What can I do to improve before reapplying?",
  "What if my credit score was 720?",
  "How do I raise a complaint with the lender?",
];

function textOf(message: Message): string {
  const content = (message as { content?: unknown }).content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        part && typeof part === "object" && "text" in part ? String((part as { text?: unknown }).text ?? "") : "",
      )
      .join("");
  }
  return "";
}

function isAuthError(message: string): boolean {
  return /401|sign in|session expired|invalid session|malformed session/i.test(message);
}

/** The server refused this thread: it belongs to another application/account or the run used a
 *  conversation the assertion did not authorise. Only a new conversation is safe. */
function isConversationConflict(message: string): boolean {
  return /403|another application|another account|does not match the signed-in session/i.test(message);
}

function friendlyError(message: string): string {
  if (isAuthError(message)) return "Your session is no longer valid. Sign in again to continue.";
  if (isConversationConflict(message)) return "That conversation can't be continued here. A new one has been started — please ask again.";
  if (/409|select an application/i.test(message)) return "Choose an application before asking about it.";
  if (/503|busy|unavailable/i.test(message)) return "The advisory service is busy or unavailable. Wait a moment and try again.";
  return "The assistant could not answer that. Your question was not answered — please try again.";
}

interface ChatPanelProps {
  agent: AbstractAgent;
  isReady: boolean;
  application: string;
  state: PublicState;
  onSessionExpired: (message: string) => void;
  /** Called once a turn finished with an answer, so the island can store the transcript. */
  onAnswered: (question: string, answer: string) => void;
  onConversationReset: () => void;
}

export function ChatPanel({
  agent,
  isReady,
  application,
  state,
  onSessionExpired,
  onAnswered,
  onConversationReset,
}: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const messages = agent.messages.filter((message) => message.role === "user" || message.role === "assistant");
  const signature = messages.map((message) => `${message.id}:${textOf(message).length}`).join("|");

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [signature]);

  async function run(question: string, append: boolean) {
    const trimmed = question.trim();
    if (!trimmed || busy || !isReady) return;
    setError(null);
    setBusy(true);
    setLastQuestion(trimmed);
    if (append) agent.addMessage({ id: crypto.randomUUID(), role: "user", content: trimmed });
    let failed = false;
    const fail = (message: string) => {
      failed = true;
      setError(friendlyError(message));
      if (isAuthError(message)) onSessionExpired("Your session is no longer valid. Sign in again to continue.");
      else if (isConversationConflict(message)) onConversationReset();
    };
    try {
      // Only the application travels from the page. Identity, language and familiarity come from
      // the assertion Frappe mints for this run, so the client cannot choose them.
      await agent.runAgent(
        { runId: crypto.randomUUID(), forwardedProps: { application } },
        {
          onRunErrorEvent: ({ event }) => {
            fail(String((event as { message?: string }).message ?? "the run failed"));
          },
        },
      );
    } catch (cause) {
      fail(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
    if (failed) return;

    const messages = agent.messages.filter((message) => message.role === "assistant");
    const answer = messages.length ? textOf(messages[messages.length - 1]) : "";
    if (answer) onAnswered(trimmed, answer);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const question = draft;
    setDraft("");
    void run(question, true);
  }

  const disabled = busy || !isReady;

  return (
    <section className="chat" aria-labelledby="chat-heading">
      <h2 id="chat-heading" className="assistant__title">
        Ask about this application
      </h2>
      <p className="sr-only" role="status">
        {busy ? "The assistant is answering." : ""}
      </p>
      {error ? (
        <div className="error" role="alert">
          <p>{error}</p>
          {lastQuestion ? (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => void run(lastQuestion, false)} disabled={busy}>
              Try again
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="log" ref={logRef} role="log" aria-live="polite" aria-relevant="additions text" tabIndex={0}>
        {messages.length === 0 ? (
          <p className="empty">
            The assistant explains your recorded decision, runs what-ifs and answers policy questions with sources. It
            cannot approve, change or promise anything.
          </p>
        ) : (
          messages.map((message) => {
            const text = textOf(message);
            if (!text) return null;
            return (
              <div key={message.id} className={`msg ${message.role === "user" ? "user" : "bot"}`}>
                {text}
              </div>
            );
          })
        )}
      </div>
      <div className="chips">
        {CHIPS.map((chip) => (
          <button key={chip} type="button" className="btn btn--ghost btn--sm" disabled={disabled} onClick={() => void run(chip, true)}>
            {chip}
          </button>
        ))}
      </div>
      <form className="row" onSubmit={submit}>
        <label className="sr-only" htmlFor="question">
          Your question
        </label>
        <input
          id="question"
          ref={inputRef}
          type="text"
          value={draft}
          placeholder="Ask about your decision…"
          autoComplete="off"
          disabled={disabled}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button type="submit" className="btn" disabled={disabled || !draft.trim()}>
          {busy ? "Answering…" : "Send"}
        </button>
      </form>
      {!isReady ? <p className="note">Connecting to the advisory service…</p> : null}
      <AnswerDetails state={state} />
    </section>
  );
}
