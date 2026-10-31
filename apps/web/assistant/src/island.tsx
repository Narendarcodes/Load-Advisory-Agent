import { useCallback, useEffect, useRef, useState } from "react";
import { UseAgentUpdate, useAgent } from "@copilotkit/react-core/v2";

import type { AssistantContext } from "./context";
import type { Locale, PublicState } from "./types";
import { ChatPanel } from "./chat-panel";
import { PlanPanel } from "./plan-panel";
import { VoicePanel } from "./voice-panel";
import { conversationMessages, HistoryError, listConversations, recordTurn, type Conversation } from "./history";
import { newThread, storedThread } from "./thread";

const LOCALE_LABEL: Record<Locale, string> = { en: "English", hi: "हिन्दी", te: "తెలుగు" };
const LITERACY_LABEL = { low: "new to loans", medium: "knows the basics", high: "very familiar" } as const;
const VISIBLE_HISTORY = 8;

function signInAgain() {
  window.location.assign(`/login?redirect-to=${encodeURIComponent(window.location.pathname + window.location.search)}`);
}

function storedMessages(detail: { messages: { role: "user" | "assistant"; text: string }[] }) {
  return detail.messages
    .filter((message) => message.text)
    .map((message, index) => ({ id: `stored-${index}`, role: message.role, content: message.text }));
}

export function Island({ context }: { context: AssistantContext }) {
  const { agent, isReady } = useAgent({
    agentId: "advisory",
    updates: [UseAgentUpdate.OnMessagesChanged, UseAgentUpdate.OnStateChanged, UseAgentUpdate.OnRunStatusChanged],
    throttleMs: 60,
  });
  const freshThreads = useRef(new Set<string>());
  const [thread, setThread] = useState(() => {
    const stored = storedThread(context.user, context.application);
    if (stored) return stored;
    const id = newThread(context.user, context.application);
    freshThreads.current.add(id);
    return id;
  });
  const [history, setHistory] = useState<Conversation[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const refreshHistory = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const rows = await listConversations(context, signal);
        if (!signal?.aborted) {
          setHistory(rows);
          setHistoryError(null);
        }
      } catch (error) {
        if (signal?.aborted || (error as Error)?.name === "AbortError") return;
        if (error instanceof HistoryError && error.status === 401) signInAgain();
        else if (!signal?.aborted) setHistoryError("Earlier conversations could not be loaded.");
      }
    },
    [context],
  );

  useEffect(() => {
    const controller = new AbortController();
    void refreshHistory(controller.signal);
    return () => controller.abort();
  }, [refreshHistory]);

  // A thread change starts from the stored transcript of that conversation. The conversation was
  // bound to this application and this borrower when Frappe minted it, so the server restores
  // only what belongs here; a 404 simply means the thread has not had a turn yet.
  useEffect(() => {
    if (!isReady) return;
    let cancelled = false;
    agent.setMessages([]);
    agent.setState({});
    agent.threadId = thread;
    // A thread started in this page load has no stored turns; asking for them is a needless 404.
    if (freshThreads.current.has(thread)) return;
    conversationMessages(context, thread)
      .then((detail) => {
        if (cancelled || detail.thread_id !== thread) return;
        const restored = storedMessages(detail);
        // A question typed while the transcript was loading wins; never overwrite it.
        if (restored.length && agent.messages.length === 0) agent.setMessages(restored);
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof HistoryError && error.status === 401) signInAgain();
        // 404: nothing stored for this thread yet (or it was removed). The first mint creates it.
      });
    return () => {
      cancelled = true;
    };
  }, [agent, context, isReady, thread]);

  const answered = useCallback(
    async (question: string, answer: string) => {
      try {
        await recordTurn(context, thread, question, answer);
        await refreshHistory();
      } catch (error) {
        if (error instanceof HistoryError && error.status === 401) signInAgain();
        // Bookkeeping only: the answer is already on screen, so a failure here is not shown.
      }
    },
    [context, refreshHistory, thread],
  );

  const startNewThread = useCallback(() => {
    const id = newThread(context.user, context.application);
    freshThreads.current.add(id);
    setThread(id);
  }, [context]);

  const conversationConflict = useCallback(() => {
    // The server refused this thread (another application, another account or a signed-out
    // session). A fresh thread is the only safe continuation; nothing of the old one is reused.
    startNewThread();
  }, [startNewThread]);

  const state = (agent.state ?? {}) as PublicState;
  const visible = history.slice(0, VISIBLE_HISTORY);

  return (
    <div className="assistant__grid">
      <ChatPanel
        agent={agent}
        isReady={isReady}
        application={context.application}
        state={state}
        onSessionExpired={signInAgain}
        onAnswered={answered}
        onConversationReset={conversationConflict}
      />
      <aside className="assistant__aside" aria-label="Conversation controls">
        <VoicePanel context={context} onSessionExpired={signInAgain} />
        <button
          type="button"
          className="btn btn--quiet btn--sm"
          onClick={startNewThread}
          disabled={!isReady}
        >
          New conversation
        </button>
        <section className="history" aria-labelledby="history-heading">
          <h3 id="history-heading" className="history__title">
            Recent conversations
          </h3>
          {historyError ? (
            <p className="note" role="status">
              {historyError}
            </p>
          ) : visible.length === 0 ? (
            <p className="note">Questions you ask about this application are kept here for you to reopen.</p>
          ) : (
            <ul className="history__list" role="list">
              {visible.map((item) => {
                const current = item.thread_id === thread;
                return (
                  <li key={item.thread_id}>
                    <button
                      type="button"
                      className={`history__item${current ? " history__item--current" : ""}`}
                      aria-current={current ? "true" : undefined}
                      onClick={() => setThread(item.thread_id)}
                      disabled={!isReady}
                    >
                      <span className="history__label">{item.title || "Conversation"}</span>
                      <span className="history__meta">
                        {item.turn_count ? `${item.turn_count} ${item.turn_count === 1 ? "exchange" : "exchanges"}` : "No exchanges"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <PlanPanel plan={state.improvement_plan ?? []} />
        <p className="note">
          Answers use your profile settings — {LOCALE_LABEL[context.locale]}, {LITERACY_LABEL[context.literacy]}. Change
          them in <a href="/borrower/profile">your profile</a>.
        </p>
      </aside>
    </div>
  );
}
