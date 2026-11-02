import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { AbstractAgent, Message } from "@copilotkit/react-core/v2";

import type { PublicState } from "./types";
import { buildBlocks, renderBlock, type GenUiBlock, type GenUiContext } from "./genui/registry";
import { parsePublicState } from "./genui/schema";
import { progressLabel } from "./genui/catalog";
import { Markdown } from "./markdown";
import { sendAnswerFeedback } from "./feedback";
import {
  addStage,
  answerKey,
  displayText,
  followUps,
  formattedAnswer,
  keptState,
  loadTurns,
  metaFor,
  saveTurns,
  type TurnMeta,
} from "./turns";

/** Starters shown only while the conversation is empty. */
export const STARTERS = [
  "Why was this decision made?",
  "What can I do to improve before reapplying?",
  "What if my credit score was 720?",
];

export const TRUST_LINE = "Understand your loan decision. A person decides.";
const ILLUSTRATION = "/assets/loan_advisory_portal/illustrations/assistant.svg";

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
  if (/503|busy|unavailable/i.test(message)) return "Saral is busy or unavailable right now. Wait a moment and try again.";
  return "Something went wrong and your question was not answered. Please try again.";
}

function assistantCount(messages: readonly Message[]): number {
  return messages.filter((message) => message.role === "assistant").length;
}

/** The answer's cards, in reading order, rebuilt from the validated state kept with that answer. */
export function answerBlocks(state: PublicState | undefined, context: GenUiContext): GenUiBlock[] {
  if (!state) return [];
  const blocks = buildBlocks(state, context);
  if (state.improvement_plan?.length) blocks.push({ type: "improvement_plan", plan: state.improvement_plan });
  return blocks;
}

function Avatar() {
  return (
    <span className="msg__avatar" aria-hidden="true">
      <svg viewBox="0 0 64 64" width="28" height="28" focusable="false">
        <rect width="64" height="64" rx="16" fill="#FE7D6B" />
        <path
          d="M11 39 Q17 34.5 22.5 38.5 L30 45 L52.5 19.5"
          fill="none"
          stroke="#241C1B"
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/** Steps reported by the server for the running turn: finished ones ticked, the newest spinning. */
function LiveSteps({ stages }: { stages: string[] }) {
  return (
    <ol className="progress" role="status" aria-live="polite" aria-label="Working on your question">
      {stages.length === 0 ? (
        <li className="progress__step progress__step--current">
          <span className="progress__dot" aria-hidden="true" />
          <span>Reading your question</span>
        </li>
      ) : (
        stages.map((stage, index) => {
          const current = index === stages.length - 1;
          return (
            <li key={stage} className={`progress__step${current ? " progress__step--current" : " progress__step--done"}`}>
              {current ? <span className="progress__dot" aria-hidden="true" /> : <span className="progress__tick" aria-hidden="true">✓</span>}
              <span>{progressLabel(stage)}</span>
              {current ? null : <span className="sr-only"> (done)</span>}
            </li>
          );
        })
      )}
    </ol>
  );
}

function DoneSteps({ stages }: { stages: string[] }) {
  if (!stages.length) return null;
  return (
    <details className="run-steps">
      <summary>
        Checked {stages.length} {stages.length === 1 ? "step" : "steps"}
      </summary>
      <ol>
        {stages.map((stage) => (
          <li key={stage}>
            <span className="progress__tick" aria-hidden="true">✓</span> {progressLabel(stage)}
          </li>
        ))}
      </ol>
    </details>
  );
}

function Typing() {
  return (
    <span className="typing" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

type Vote = "up" | "down" | "failed";

interface ChatPanelProps {
  agent: AbstractAgent;
  isReady: boolean;
  application: string;
  state: PublicState;
  onSessionExpired: (message: string) => void;
  /** Called once a turn finished with an answer, so the island can store the transcript. */
  onAnswered: (question: string, answer: string) => void;
  onConversationReset: () => void;
  /** Where this conversation's per-answer cards are kept for the tab (scoped to user, application, thread). */
  storageKey?: string;
  /** Present when the page can post feedback; thumbs are hidden otherwise. */
  csrfToken?: string;
}

export function ChatPanel({
  agent,
  isReady,
  application,
  state,
  onSessionExpired,
  onAnswered,
  onConversationReset,
  storageKey,
  csrfToken,
}: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; question: string } | null>(null);
  const [runStages, setRunStages] = useState<string[]>([]);
  const [runBase, setRunBase] = useState(0);
  const [turns, setTurns] = useState<TurnMeta[]>(() => loadTurns(storageKey));
  const [whatIfOpen, setWhatIfOpen] = useState(false);
  const [votes, setVotes] = useState<Record<number, Vote>>({});
  const stagesRef = useRef<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // A different thread brings its own cards; nothing from the previous one carries over.
  useEffect(() => {
    setTurns(loadTurns(storageKey));
    setError(null);
    setVotes({});
  }, [storageKey]);

  const messages = agent.messages.filter((message) => message.role === "user" || message.role === "assistant");
  const signature = `${messages.map((message) => `${message.id}:${textOf(message).length}`).join("|")}#${runStages.length}#${busy}#${error ? 1 : 0}`;

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [signature]);

  const pushStage = useCallback((stage: unknown) => {
    const next = addStage(stagesRef.current, stage);
    if (next.length !== stagesRef.current.length) {
      stagesRef.current = next;
      setRunStages(next);
    }
  }, []);

  // The snapshot the island validated also carries the stage; take it too in case an event was batched.
  const liveStage = state.progress?.stage;
  useEffect(() => {
    if (busy && liveStage) pushStage(liveStage);
  }, [busy, liveStage, pushStage]);

  async function run(question: string, append: boolean) {
    const trimmed = question.trim();
    if (!trimmed || busy || !isReady) return;
    setError(null);
    setBusy(true);
    setWhatIfOpen(false);
    stagesRef.current = [];
    setRunStages([]);
    setRunBase(assistantCount(agent.messages));
    if (append) agent.addMessage({ id: crypto.randomUUID(), role: "user", content: trimmed });
    let failed = false;
    let snapshotSeen = false;
    const fail = (message: string) => {
      failed = true;
      setError({ text: friendlyError(message), question: trimmed });
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
          onStateSnapshotEvent: ({ event }) => {
            snapshotSeen = true;
            const snapshot = (event as { snapshot?: unknown }).snapshot;
            pushStage(parsePublicState(snapshot).progress?.stage);
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

    const answers = agent.messages.filter((message) => message.role === "assistant");
    const answer = answers.length ? textOf(answers[answers.length - 1]) : "";
    if (!answer) return;
    const finalState = snapshotSeen ? parsePublicState(agent.state) : undefined;
    const formatted = formattedAnswer(answer, finalState?.answer);
    const meta: TurnMeta = {
      answer: answerKey(answer),
      stages: stagesRef.current,
      state: finalState ? keptState(finalState) : undefined,
      ...(formatted !== answer ? { text: formatted } : {}),
    };
    setTurns((previous) => {
      const next = [...previous];
      while (next.length < answers.length - 1) next.push({ answer: "", stages: [] });
      next[answers.length - 1] = meta;
      saveTurns(storageKey, next);
      return next;
    });
    onAnswered(trimmed, formatted);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const question = draft;
    setDraft("");
    void run(question, true);
  }

  async function vote(ordinal: number, helpful: boolean) {
    if (!csrfToken || votes[ordinal] === "up" || votes[ordinal] === "down") return;
    setVotes((current) => ({ ...current, [ordinal]: helpful ? "up" : "down" }));
    try {
      await sendAnswerFeedback(csrfToken, application, helpful);
    } catch {
      setVotes((current) => ({ ...current, [ordinal]: "failed" }));
    }
  }

  const disabled = busy || !isReady;
  const genui: GenUiContext = { application, busy: disabled, onAsk: (question) => void run(question, true) };
  const totalAnswers = assistantCount(messages);
  const waiting = busy && totalAnswers <= runBase;
  const empty = messages.length === 0 && !busy;

  let ordinal = -1;
  const rendered = messages.map((message) => {
    const text = textOf(message);
    if (message.role === "user") {
      if (!text) return null;
      return (
        <div key={message.id} className="msg user">
          <span className="sr-only">You said: </span>
          {text}
        </div>
      );
    }
    ordinal += 1;
    const index = ordinal;
    const live = busy && index >= runBase;
    if (live) {
      return (
        <div key={message.id} className="msg bot msg--live">
          <Avatar />
          <div className="msg__body">
            <LiveSteps stages={runStages} />
            {text ? <Markdown text={text} /> : <Typing />}
          </div>
        </div>
      );
    }
    if (!text) return null;
    const meta = metaFor(turns, index, text);
    const blocks = answerBlocks(meta?.state, genui);
    const latest = index === totalAnswers - 1 && !busy && !error;
    const voted = votes[index];
    return (
      <div key={message.id} className="msg bot">
        <Avatar />
        <div className="msg__body">
          <DoneSteps stages={meta?.stages ?? []} />
          <Markdown text={displayText(meta, text)} citations={meta?.state?.citations ?? []} />
          {blocks.length ? (
            <div className="msg__cards">
              {blocks.map((block, blockIndex) => (
                <div className="msg__card" key={`${block.type}-${blockIndex}`}>
                  {renderBlock(block, genui)}
                </div>
              ))}
            </div>
          ) : null}
          {csrfToken ? (
            <div className="msg__foot">
              <span className="feedback" role="group" aria-label="Was this answer helpful?">
                {voted === "up" || voted === "down" ? (
                  <span className="feedback__thanks" role="status">
                    Thanks for the feedback.
                  </span>
                ) : (
                  <>
                    <button type="button" className="icon-btn" aria-label="Helpful" title="Helpful" onClick={() => void vote(index, true)}>
                      👍
                    </button>
                    <button type="button" className="icon-btn" aria-label="Not helpful" title="Not helpful" onClick={() => void vote(index, false)}>
                      👎
                    </button>
                    {voted === "failed" ? <span className="feedback__thanks">Couldn't send that. Try again.</span> : null}
                  </>
                )}
              </span>
            </div>
          ) : null}
          {latest ? (
            <div className="followups" aria-label="Suggested follow-ups">
              {followUps(meta?.state).map((chip) => (
                <button key={chip} type="button" className="chip" disabled={disabled} onClick={() => void run(chip, true)}>
                  {chip}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    );
  });

  return (
    <section className="chat" aria-labelledby="chat-heading">
      <h2 id="chat-heading" className="sr-only">
        Ask about this application
      </h2>
      {renderBlock({ type: "application_context", application }, genui)}
      <p className="sr-only" role="status">
        {busy ? "Saral is answering." : ""}
      </p>
      <div className="log" ref={logRef} role="log" aria-live="polite" aria-relevant="additions text" tabIndex={0}>
        {empty ? (
          <div className="chat-empty">
            <img className="chat-empty__art" src={ILLUSTRATION} alt="" width={160} height={120} />
            <h3>Ask about your decision</h3>
            <p>Ask why, what to fix, or try a what-if.</p>
            <div className="chips">
              {STARTERS.map((chip) => (
                <button key={chip} type="button" className="chip" disabled={disabled} onClick={() => void run(chip, true)}>
                  {chip}
                </button>
              ))}
            </div>
          </div>
        ) : (
          rendered
        )}
        {waiting ? (
          <div className="msg bot msg--live">
            <Avatar />
            <div className="msg__body">
              <LiveSteps stages={runStages} />
              <Typing />
            </div>
          </div>
        ) : null}
        {error && !busy ? (
          <div className="msg bot msg--error" role="alert">
            <Avatar />
            <div className="msg__body">
              <p>{error.text}</p>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => void run(error.question, false)} disabled={disabled}>
                Retry
              </button>
            </div>
          </div>
        ) : null}
      </div>
      {whatIfOpen ? (
        <div className="whatif-panel">
          {renderBlock({ type: "what_if_form", card: lastCard(turns, state) }, genui)}
          <button type="button" className="btn btn--quiet btn--sm" onClick={() => setWhatIfOpen(false)}>
            Close what-if
          </button>
        </div>
      ) : null}
      <div className="composer">
        <div className="composer__tools">
          <button
            type="button"
            className="chip chip--alt"
            aria-expanded={whatIfOpen}
            disabled={disabled}
            onClick={() => setWhatIfOpen((open) => !open)}
          >
            Try a what-if
          </button>
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
        <p className="trust-line">{TRUST_LINE}</p>
        {!isReady ? <p className="note">Connecting…</p> : null}
      </div>
    </section>
  );
}

/** The what-if form shows recorded values from the newest decision card this conversation has seen. */
function lastCard(turns: readonly TurnMeta[], state: PublicState) {
  for (let index = turns.length - 1; index >= 0; index -= 1) {
    const card = turns[index].state?.decision_card;
    if (card) return card;
  }
  return state.decision_card;
}
