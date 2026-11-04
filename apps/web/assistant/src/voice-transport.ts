import type { VoiceStatus } from "./voice";

export interface VoiceUtterance {
  role: "user" | "assistant";
  text: string;
}

/**
 * Who is talking right now and how loudly (0..1), from LiveKit's own speaker detection. Only drives the
 * decorative voice orb; no audio is read, recorded or stored by the page for it.
 */
export interface VoiceActivity {
  speaker: "user" | "assistant" | null;
  level: number;
}

/**
 * The small part of a LiveKit room the panel needs. Tests drive a fake of this, so the panel's
 * lifecycle logic is exercised without a server or a microphone.
 */
export interface VoiceTransport {
  connect(url: string, token: string): Promise<void>;
  disconnect(): Promise<void>;
  setMicrophoneEnabled(enabled: boolean): Promise<void>;
  onStatus(handler: (status: VoiceStatus) => void): () => void;
  onUtterance(handler: (utterance: VoiceUtterance) => void): () => void;
  /** Optional: speaker activity for the voice orb. A transport without it leaves the orb listening. */
  onActivity?(handler: (activity: VoiceActivity) => void): () => void;
}

export type VoiceTransportFactory = () => VoiceTransport | Promise<VoiceTransport>;

/**
 * Loads LiveKit only when the borrower starts a call (it stays out of the initial bundle) and maps
 * the room's real events onto the panel's states. The worker publishes one JSON record per turn on
 * the `advisor` topic carrying the recognised question and the answer, which becomes the transcript.
 */
export async function createLiveKitTransport(): Promise<VoiceTransport> {
  const { ConnectionState, Room, RoomEvent, Track } = await import("livekit-client");
  const room = new Room();
  const statusHandlers = new Set<(status: VoiceStatus) => void>();
  const utteranceHandlers = new Set<(utterance: VoiceUtterance) => void>();
  const activityHandlers = new Set<(activity: VoiceActivity) => void>();
  const emitStatus = (status: VoiceStatus) => {
    for (const handler of statusHandlers) handler(status);
  };

  room.on(RoomEvent.ConnectionStateChanged, (state) => {
    if (state === ConnectionState.Connected) emitStatus("connected");
    else if (state === ConnectionState.Reconnecting || state === ConnectionState.SignalReconnecting) {
      emitStatus("reconnecting");
    }
  });
  room.on(RoomEvent.Disconnected, () => emitStatus("ended"));

  // Remote speech is an audio track that has to be attached to an element to be heard.
  room.on(RoomEvent.TrackSubscribed, (track) => {
    if (track.kind !== Track.Kind.Audio) return;
    const element = track.attach();
    element.dataset.voiceRemote = "audio";
    document.body.append(element);
  });
  room.on(RoomEvent.TrackUnsubscribed, (track) => {
    for (const element of track.detach()) element.remove();
  });

  // The voice orb follows LiveKit's speaker detection (participant audio levels the SDK already computes),
  // so the page never opens a second tap on the microphone. Polled gently while someone is speaking.
  let activityTimer: ReturnType<typeof setInterval> | undefined;
  const emitActivity = () => {
    const speakers = room.activeSpeakers;
    const remote = speakers.find((participant) => participant !== room.localParticipant);
    const local = speakers.find((participant) => participant === room.localParticipant);
    const who: VoiceActivity["speaker"] = remote ? "assistant" : local ? "user" : null;
    const level = Math.min(1, (remote ?? local)?.audioLevel ?? 0);
    for (const handler of activityHandlers) handler({ speaker: who, level });
  };
  room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
    emitActivity();
    if (speakers.length && !activityTimer) activityTimer = setInterval(emitActivity, 150);
    if (!speakers.length && activityTimer) {
      clearInterval(activityTimer);
      activityTimer = undefined;
    }
  });

  room.on(RoomEvent.DataReceived, (payload, _participant, _kind, topic) => {
    if (topic !== "advisor") return;
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(new TextDecoder().decode(payload)) as Record<string, unknown>;
    } catch {
      return;
    }
    const question = typeof body.transcript === "string" ? body.transcript.trim() : "";
    const answer = typeof body.answer === "string" ? body.answer.trim() : "";
    if (question) for (const handler of utteranceHandlers) handler({ role: "user", text: question });
    if (answer) for (const handler of utteranceHandlers) handler({ role: "assistant", text: answer });
  });

  return {
    async connect(url, token) {
      await room.connect(url, token);
    },
    async disconnect() {
      if (activityTimer) clearInterval(activityTimer);
      activityTimer = undefined;
      await room.disconnect();
      for (const element of document.querySelectorAll("[data-voice-remote]")) element.remove();
    },
    async setMicrophoneEnabled(enabled) {
      await room.localParticipant.setMicrophoneEnabled(enabled);
    },
    onStatus(handler) {
      statusHandlers.add(handler);
      return () => statusHandlers.delete(handler);
    },
    onUtterance(handler) {
      utteranceHandlers.add(handler);
      return () => utteranceHandlers.delete(handler);
    },
    onActivity(handler) {
      activityHandlers.add(handler);
      return () => activityHandlers.delete(handler);
    },
  };
}
