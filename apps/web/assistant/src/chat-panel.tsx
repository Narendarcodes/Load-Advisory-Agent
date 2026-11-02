import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { AbstractAgent, Message } from "@copilotkit/react-core/v2";

import type { PublicState } from "./types";
import { buildBlocks, renderBlock, type GenUiBlock, type GenUiContext } from "./genui/registry";
import { parsePublicState } from "./genui/schema";
import { trailLabel, ruleTrailLines } from "./genui/trail";
import { Markdown } from "./markdown";
import { sendAnswerFeedback } from "./feedback";
import {
  addStage,
  answerKey,
  displayText,
  followUps,
  formattedAnswer,
  liveText,
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
const ERROR_ILLUSTRATION = "/assets/loan_advisory_portal/illustrations/service-unavailable.svg";
const THINKING_ILLUSTRATION = "/assets/loan_advisory_portal/illustrations/assistant-thinking.svg";

/** Before the first words arrive: a quiet scene beside the live steps (decorative; the steps say what is happening). */
function Thinking({ stages }: { stages: string[] }) {
  return (
    <div className="msg__thinking">
      {/* The Saral mark scene on a plain soft circle that pulses gently while Saral works (CSS; still under
          reduced motion). Decorative: the live steps say what is happening. */}
      <div className="msg__thinking-mark">
        <img className="msg__thinking-art" src={THINKING_ILLUSTRATION} alt="" width={96} height={72} />
      </div>
      <div className="msg__thinking-body">
        <LiveSteps stages={stages} />
        <Typing />
      </div>
    </div>
  );
}

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

function Tick() {
  return (
    <svg className="trail__icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The running turn's activity trail: one line per real server stage, finished ones ticked. */
function LiveSteps({ stages }: { stages: string[] }) {
  const known = stages.filter((stage) => trailLabel(stage, true));
  return (
    <ol className="progress trail" role="status" aria-live="polite" aria-label="What I am checking">
      {known.length === 0 ? (
        <li className="progress__step progress__step--current">
          <span className="progress__dot" aria-hidden="true" />
          <span>Reading your question</span>
        </li>
      ) : (
        known.map((stage, index) => {
          const current = index === known.length - 1;
          return (
            <li key={stage} className={`progress__step${current ? " progress__step--current" : " progress__step--done"}`}>
              {current ? <span className="progress__dot" aria-hidden="true" /> : <Tick />}
              <span>{trailLabel(stage, !current)}</span>
              {current ? null : <span className="sr-only"> (done)</span>}
            </li>
          );
        })
      )}
    </ol>
  );
}

/** After the answer: the stages that really ran, then the recorded figures the answer read. */
function DoneSteps({ stages, state, open }: { stages: string[]; state?: PublicState; open: boolean }) {
  const lines = [
    ...stages.map((stage) => trailLabel(stage, true)).filter((line): line is string => Boolean(line)),
    ...ruleTrailLines(state?.decision_card),
  ];
  if (!lines.length) return null;
  return (
    <details className="run-steps trail" open={open}>
      <summary>What I checked ({lines.length} {lines.length === 1 ? "step" : "steps"})</summary>
      <ol>
        {lines.map((line) => (
          <li key={line}>
            <Tick /> {line}
          </li>
        ))}
      </ol>
    </details>
  );
}

function Thumb({ down }: { down?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false" style={down ? { transform: "rotate(180deg)" } : undefined}>
      <path
        d="M6.5 9v8.5H3.5V9zM6.5 9l3.2-5.6c.4-.7 1.3-.9 1.9-.4.5.4.7 1 .5 1.6L11.4 8H16c1 0 1.8.9 1.6 1.9l-1.1 6c-.2.9-.9 1.6-1.8 1.6H6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
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
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // A different thread brings its own cards; nothing from the previous one carries over.
  useEffect(() => {
    setTurns(loadTurns(storageKey));
    setError(null);
    setVotes({});
  }, [storageKey]);

  const messages = agent.messages.filter((message) => message.role === "user" || message.role === "assistant");
  const signature = `${messages.map((message) => `${message.id}:${textOf(message).length}`).join("|")}#${runStages.length}#${busy}#${error ? 1 : 0}`;

  // The conversation flows in the page; keep the newest line in view above the sticky composer.
  useEffect(() => {
    const end = endRef.current;
    if (end && typeof end.scrollIntoView === "function" && messages.length) end.scrollIntoView({ block: "end" });
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const genui: GenUiContext = {
    application,
    busy: disabled,
    onAsk: (question) => void run(question, true),
    onOpenWhatIf: () => setWhatIfOpen(true),
  };
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
          <p>{text}</p>
        </div>
      );
    }
    ordinal += 1;
    const index = ordinal;
    const live = busy && index >= runBase;
    if (live) {
      return (
        <div key={message.id} className="msg bot msg--live">
          <div className="msg__body">
            {text ? (
              <>
                <LiveSteps stages={runStages} />
                <Markdown text={liveText(text)} />
                {/* A thin CSS progress bar under an answer that is still arriving (decorative; still under reduced motion). */}
                <div className="msg__stream-edge" aria-hidden="true" />
              </>
            ) : (
              <Thinking stages={runStages} />
            )}
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
        <div className="msg__body">
          <DoneSteps stages={meta?.stages ?? []} state={meta?.state} open={index === totalAnswers - 1} />
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
                      <Thumb />
                    </button>
                    <button type="button" className="icon-btn" aria-label="Not helpful" title="Not helpful" onClick={() => void vote(index, false)}>
                      <Thumb down />
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
      <p className="sr-only" role="status">
        {busy ? "Saral is answering." : ""}
      </p>
      <div className="log" ref={logRef} role="log" aria-live="polite" aria-relevant="additions text" tabIndex={0}>
        {empty ? (
          <div className="chat-empty">
            {/* The Saral mark on a plain, soft coral-tinted circle (decorative). */}
            <div className="chat-empty__mark">
              <img className="chat-empty__art" src={ILLUSTRATION} alt="" width={160} height={120} />
            </div>
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
            <div className="msg__body">
              <Thinking stages={runStages} />
            </div>
          </div>
        ) : null}
        {error && !busy ? (
          <div className="msg bot msg--error" role="alert">
            <div className="msg__body action-row action-row--error">
              <img className="msg__error-art" src={ERROR_ILLUSTRATION} alt="" width={96} height={72} />
              <div className="action-row__text">
                <p>{error.text}</p>
                <p className="note">Your question is kept. Nothing on your application changed.</p>
              </div>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => void run(error.question, false)} disabled={disabled}>
                Retry
              </button>
            </div>
          </div>
        ) : null}
        {whatIfOpen ? (
          <div className="whatif-panel">
            {renderBlock({ type: "what_if_form", card: lastCard(turns, state) }, genui)}
            <button type="button" className="btn btn--quiet btn--sm" onClick={() => setWhatIfOpen(false)}>
              Close what-if
            </button>
          </div>
        ) : null}
        <div ref={endRef} className="log__end" aria-hidden="true" />
      </div>
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
        {/* The composer is the plain floating surface; keyboard focus shows the standard focus ring. */}
        <form className="row composer__form" onSubmit={submit}>
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
