import { useCallback, useEffect, useState } from "react";
import { UseAgentUpdate, useAgent } from "@copilotkit/react-core/v2";

import type { AssistantContext } from "./context";
import type { Locale } from "./types";
import { parsePublicState } from "./genui/schema";
import { ChatPanel } from "./chat-panel";
import { PlanPanel } from "./plan-panel";
import { VoicePanel } from "./voice-panel";
import { conversationMessages, HistoryError, listConversations, recordTurn, type Conversation } from "./history";
import { clearThreadPending, newThread, pendingThread, threadFor } from "./thread";
import { turnsKey } from "./turns";

type Drawer = "history" | "plan" | "voice" | null;

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
  const [thread, setThread] = useState(() => threadFor(context.user, context.application));
  const [history, setHistory] = useState<Conversation[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<Drawer>(null);

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
  // only what belongs here; anything else is refused as not found.
  useEffect(() => {
    if (!isReady) return;
    let cancelled = false;
    agent.setMessages([]);
    agent.setState({});
    agent.threadId = thread;
    // A thread this tab minted but never used has no stored rows, so its transcript cannot be
    // restored yet. The marker is kept in storage precisely so a reload does not ask for it.
    if (pendingThread(context.user, context.application) === thread) return;
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
        // Anything else, 404 included, leaves the panel empty: the transcript is never invented.
      });
    return () => {
      cancelled = true;
    };
  }, [agent, context, isReady, thread]);

  const answered = useCallback(
    async (question: string, answer: string) => {
      try {
        await recordTurn(context, thread, question, answer);
        // The transcript is stored, so a later page load of this tab can restore it.
        clearThreadPending(context.user, context.application, thread);
        await refreshHistory();
      } catch (error) {
        if (error instanceof HistoryError && error.status === 401) signInAgain();
        // Bookkeeping only: the answer is already on screen, so a failure here is not shown.
      }
    },
    [context, refreshHistory, thread],
  );

  const startNewThread = useCallback(() => setThread(newThread(context.user, context.application)), [context]);

  const conversationConflict = useCallback(() => {
    // The server refused this thread (another application, another account or a signed-out
    // session). A fresh thread is the only safe continuation; nothing of the old one is reused.
    startNewThread();
  }, [startNewThread]);

  // The runtime snapshot is untyped JSON; only fields in the server contract survive validation.
  const state = parsePublicState(agent.state);
  const visible = history.slice(0, VISIBLE_HISTORY);

  const turnsStorage = turnsKey(context.user, context.application, thread);
  const toggle = (panel: Drawer) => setDrawer((open) => (open === panel ? null : panel));
  const tab = (panel: Drawer, label: string) => (
    <button
      type="button"
      className={`drawer-tab${drawer === panel ? " drawer-tab--on" : ""}`}
      aria-expanded={drawer === panel}
      aria-controls={`drawer-${panel}`}
      onClick={() => toggle(panel)}
    >
      {label}
    </button>
  );

  return (
    <div className={`assistant__grid${drawer ? " assistant__grid--drawer" : ""}`}>
      <div className="assistant__toolbar" role="toolbar" aria-label="Conversation tools">
        {tab("history", "History")}
        {tab("plan", "Plan")}
        {tab("voice", "Voice")}
        <span className="assistant__toolbar-spacer" />
        <button type="button" className="btn btn--quiet btn--sm" onClick={startNewThread} disabled={!isReady}>
          New conversation
        </button>
      </div>
      <ChatPanel
        agent={agent}
        isReady={isReady}
        application={context.application}
        state={state}
        onSessionExpired={signInAgain}
        onAnswered={answered}
        onConversationReset={conversationConflict}
        storageKey={turnsStorage}
        csrfToken={context.csrfToken}
      />
      <aside className="assistant__aside tools-drawer" aria-label="Conversation controls" hidden={!drawer}>
        <div className="drawer__head">
          <span className="drawer__grip" aria-hidden="true" />
          <button type="button" className="btn btn--quiet btn--sm drawer__close" onClick={() => setDrawer(null)}>
            Close
          </button>
        </div>
        {/* Voice stays mounted while the drawer is closed so a live call is never cut by a click. */}
        <div id="drawer-voice" hidden={drawer !== "voice"}>
          <VoicePanel context={context} onSessionExpired={signInAgain} />
        </div>
        <section id="drawer-history" className="history" aria-labelledby="history-heading" hidden={drawer !== "history"}>
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
                      onClick={() => {
                        setThread(item.thread_id);
                        setDrawer(null);
                      }}
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
          <p className="note">
            Answers use your profile settings — {LOCALE_LABEL[context.locale]}, {LITERACY_LABEL[context.literacy]}. Change
            them in <a href="/borrower/profile">your profile</a>.
          </p>
        </section>
        <div id="drawer-plan" hidden={drawer !== "plan"}>
          <PlanPanel plan={state.improvement_plan ?? []} />
        </div>
      </aside>
    </div>
  );
}
