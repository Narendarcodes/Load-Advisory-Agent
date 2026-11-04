import { useCallback, useEffect, useRef, useState } from "react";

import type { AssistantContext } from "./context";
import {
  createVoiceSession,
  endVoiceSession,
  isVoiceAuthError,
  voiceErrorMessage,
  type VoiceSessionInfo,
  type VoiceStatus,
} from "./voice";
import { createLiveKitTransport, type VoiceTransport, type VoiceTransportFactory, type VoiceUtterance } from "./voice-transport";
import { ORB_LABEL, nextOrbState, type OrbState, type VoiceSpeaker } from "./voice-orb";

/**
 * A clean CSS circle that follows the call (idle, connecting, listening, thinking, speaking, microphone off)
 * and scales gently with LiveKit's audio level; still under reduced motion. Decorative; the static state
 * label, status line and transcript carry the meaning, so the circle is hidden from assistive tech.
 */
function VoiceOrb({ state, level }: { state: OrbState; level: number }) {
  return (
    <div className="voice-stage">
      <div
        className="voice-orb"
        data-state={state}
        data-level={level.toFixed(2)}
        aria-hidden="true"
        style={{ ["--voice-level" as string]: level.toFixed(2) }}
      >
        <span className="voice-orb__core" />
      </div>
      <p className="voice-orb__label">{ORB_LABEL[state]}</p>
    </div>
  );
}

const STATUS_LABEL: Record<VoiceStatus, string> = {
  idle: "Not started",
  connecting: "Connecting…",
  connected: "Connected — the assistant is listening.",
  reconnecting: "Connection lost. Reconnecting…",
  ended: "Voice session ended.",
  failed: "Voice could not start.",
};

const ACTIVE: readonly VoiceStatus[] = ["connecting", "connected", "reconnecting"];

function joinError(error: unknown): string {
  const name = (error as { name?: unknown })?.name;
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "The microphone is blocked. Allow microphone access for this site and try again.";
  }
  if (name === "NotFoundError") return "No microphone was found on this device. You can still ask by text.";
  if (name === "NotSupportedError") return "This browser cannot start a voice call. You can still ask by text.";
  return "The voice session could not connect. Check the connection and try again, or ask by text.";
}

interface VoicePanelProps {
  context: AssistantContext;
  /** Injectable so tests run the panel without a room or a microphone. */
  createTransport?: VoiceTransportFactory;
  onSessionExpired?: () => void;
}

export function VoicePanel({ context, createTransport, onSessionExpired }: VoicePanelProps) {
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [entries, setEntries] = useState<VoiceUtterance[]>([]);
  const [showTranscript, setShowTranscript] = useState(true);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [orb, setOrb] = useState<{ state: OrbState; level: number; speaker: VoiceSpeaker }>({
    state: "idle",
    level: 0,
    speaker: null,
  });
  const statusRef = useRef<VoiceStatus>("idle");
  statusRef.current = status;
  const mutedRef = useRef(false);
  mutedRef.current = muted;

  const sessionRef = useRef<VoiceSessionInfo | null>(null);
  const transportRef = useRef<VoiceTransport | null>(null);
  const unsubsRef = useRef<(() => void)[]>([]);

  const release = useCallback(async () => {
    for (const off of unsubsRef.current) off();
    unsubsRef.current = [];
    const transport = transportRef.current;
    transportRef.current = null;
    if (transport) {
      try {
        await transport.disconnect();
      } catch {
        // Teardown is best effort: the server-side end below still closes the session.
      }
    }
    const session = sessionRef.current;
    sessionRef.current = null;
    if (session) {
      try {
        // `keepalive` so a tab that is navigating away still delivers the end.
        await endVoiceSession(context, session.session_id, { keepalive: true });
      } catch (cause) {
        if (isVoiceAuthError(cause)) onSessionExpired?.();
      }
    }
  }, [context, onSessionExpired]);

  const releaseRef = useRef(release);
  releaseRef.current = release;
  useEffect(
    () => () => {
      // Leaving the page must not leave a live room behind. The row also expires on its own.
      void releaseRef.current();
    },
    [],
  );

  const stop = useCallback(async () => {
    setStatus("ended");
    setMuted(false);
    setExpiresAt(null);
    await release();
  }, [release]);

  const start = useCallback(async () => {
    if (!consent || !context.voice.enabled || ACTIVE.includes(status)) return;
    setError(null);
    setEntries([]);
    setShowTranscript(true);
    setStatus("connecting");
    setExpiresAt(null);

    let created: VoiceSessionInfo;
    try {
      created = await createVoiceSession(context);
    } catch (cause) {
      if (isVoiceAuthError(cause)) onSessionExpired?.();
      setError(voiceErrorMessage(cause));
      setStatus("failed");
      return;
    }
    sessionRef.current = created;
    setExpiresAt(new Date(created.expires_at.replace(" ", "T")));

    try {
      const transport = await (createTransport ?? createLiveKitTransport)();
      // The borrower may have ended the call while the room was loading.
      if (sessionRef.current !== created) {
        await transport.disconnect();
        return;
      }
      transportRef.current = transport;
      unsubsRef.current = [
        transport.onStatus((next) => setStatus(next)),
        transport.onUtterance((utterance) => {
          setEntries((previous) => [...previous, utterance]);
          if (utterance.role === "assistant") {
            setOrb((previous) => ({
              ...previous,
              state: nextOrbState(previous.state, {
                status: statusRef.current,
                muted: mutedRef.current,
                speaker: previous.speaker,
                answered: true,
              }),
            }));
          }
        }),
      ];
      if (transport.onActivity) {
        unsubsRef.current.push(
          transport.onActivity((activity) =>
            setOrb((previous) => ({
              speaker: activity.speaker,
              level: activity.speaker ? Math.min(1, Math.max(0, activity.level)) : 0,
              state: nextOrbState(previous.state, {
                status: statusRef.current,
                muted: mutedRef.current,
                speaker: activity.speaker,
                previous: previous.speaker,
              }),
            })),
          ),
        );
      }
      await transport.connect(created.url, created.token);
      if (transportRef.current !== transport) return;
      await transport.setMicrophoneEnabled(true);
      setMuted(false);
      setStatus("connected");
    } catch (cause) {
      await release();
      setExpiresAt(null);
      setStatus("failed");
      setError(joinError(cause));
    }
  }, [consent, context, createTransport, onSessionExpired, release, status]);

  const toggleMicrophone = useCallback(async () => {
    const transport = transportRef.current;
    if (!transport) return;
    try {
      await transport.setMicrophoneEnabled(muted);
      setMuted(!muted);
    } catch (cause) {
      setError(joinError(cause));
    }
  }, [muted]);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setEntries([]);
    setExpiresAt(null);
  }, []);

  // Status and mute changes move the orb too (connecting, listening, muted, idle at the end).
  useEffect(() => {
    setOrb((previous) => {
      const state = nextOrbState(previous.state, { status, muted, speaker: previous.speaker, previous: previous.speaker });
      const ended = state === "idle" || state === "connecting";
      return { state, level: ended ? 0 : previous.level, speaker: ended ? null : previous.speaker };
    });
  }, [status, muted]);

  // The token and the room grant die with the row. Closing here makes the panel state match that.
  useEffect(() => {
    if (!expiresAt || !ACTIVE.includes(status)) return;
    const delay = expiresAt.getTime() - Date.now();
    if (!Number.isFinite(delay)) return;
    const timer = window.setTimeout(() => {
      setError("This voice session reached its time limit. Start a new one to keep talking.");
      void stop();
    }, Math.max(0, Math.min(delay, 2_147_483_647)));
    return () => window.clearTimeout(timer);
  }, [expiresAt, status, stop]);

  if (!context.voice.enabled) {
    return (
      <section className="voice" aria-labelledby="voice-heading">
        <h3 id="voice-heading" className="history__title">
          Talk instead of typing
        </h3>
        <p className="note">Voice is not available on this site. You can still ask by text.</p>
      </section>
    );
  }

  const active = ACTIVE.includes(status);
  const finished = status === "ended" || status === "failed";

  return (
    <section className="voice" aria-labelledby="voice-heading">
      <h3 id="voice-heading" className="history__title">
        Talk instead of typing
      </h3>
      <p className="note">
        The assistant listens only while this page is open. Your speech goes to the advisory voice service to answer
        your question, and each question and answer also appears here as text.
      </p>

      <VoiceOrb state={orb.state} level={orb.level} />

      {!active && !finished ? (
        <div className="voice__start">
          <label className="voice__consent" htmlFor="voice-consent">
            <input
              id="voice-consent"
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
            />
            <span>
              I agree to the voice notice ({context.voice.consentVersion}): my microphone audio is used to answer my
              question in this session, and Frappe records this agreement with the time and notice version.
            </span>
          </label>
          <button type="button" className="btn btn--sm" onClick={() => void start()} disabled={!consent}>
            Start voice
          </button>
        </div>
      ) : null}

      {status !== "idle" ? (
        <p className={`voice__status voice__status--${status}`} role="status" aria-live="polite">
          <span className="voice__dot" aria-hidden="true" />
          {STATUS_LABEL[status]}
        </p>
      ) : null}

      {error ? (
        <div className="error" role="alert">
          <p>{error}</p>
        </div>
      ) : null}

      {active ? (
        <div className="voice__actions">
          <button type="button" className="btn btn--ghost btn--sm" aria-pressed={muted} onClick={() => void toggleMicrophone()}>
            {muted ? "Unmute microphone" : "Mute microphone"}
          </button>
          <button type="button" className="btn btn--quiet btn--sm" onClick={() => void stop()}>
            End session
          </button>
          {expiresAt ? (
            <span className="voice__expiry">
              Ends at {expiresAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          ) : null}
        </div>
      ) : null}

      {finished ? (
        <button type="button" className="btn btn--sm" onClick={reset}>
          Start a new voice session
        </button>
      ) : null}

      {entries.length ? (
        <div className="voice__transcript">
          <div className="voice__transcript-head">
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              aria-pressed={showTranscript}
              aria-controls="voice-transcript"
              onClick={() => setShowTranscript(!showTranscript)}
            >
              {showTranscript ? "Hide transcript" : "Show transcript"}
            </button>
            <button type="button" className="btn btn--quiet btn--sm" onClick={() => setEntries([])}>
              Clear transcript
            </button>
          </div>
          {showTranscript ? (
            <ol id="voice-transcript" className="voice__lines" role="list">
              {entries.map((entry, index) => (
                <li key={index} className={`voice__line voice__line--${entry.role}`}>
                  <span className="voice__speaker">{entry.role === "user" ? "You" : "Assistant"}</span>
                  <span>{entry.text}</span>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
