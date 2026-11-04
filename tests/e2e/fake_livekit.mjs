/*
 * TEST ONLY. A scripted stand-in for the `livekit-client` chunk, served by redesign_capture.cjs (page.route) so
 * the voice drawer's states can be photographed without a LiveKit server or a microphone. It implements only
 * what voice-transport.ts touches. The capture drives it through window.__fakeVoice:
 *   __fakeVoice.speak("user" | "assistant" | null, level)   speaker detection (ActiveSpeakersChanged)
 *   __fakeVoice.answer(question, answer)                      the worker's `advisor` data record
 * Nothing here records or plays audio.
 */
export const ConnectionState = { Connected: "connected", Reconnecting: "reconnecting", SignalReconnecting: "signalReconnecting", Disconnected: "disconnected" };
export const RoomEvent = {
	ConnectionStateChanged: "connectionStateChanged",
	Disconnected: "disconnected",
	TrackSubscribed: "trackSubscribed",
	TrackUnsubscribed: "trackUnsubscribed",
	DataReceived: "dataReceived",
	ActiveSpeakersChanged: "activeSpeakersChanged",
};
export const Track = { Kind: { Audio: "audio", Video: "video" } };

export class Room {
	constructor() {
		this.handlers = {};
		this.activeSpeakers = [];
		this.localParticipant = { audioLevel: 0, setMicrophoneEnabled: async () => {} };
		this.remote = { audioLevel: 0 };
		const room = this;
		window.__fakeVoice = {
			speak(who, level) {
				room.localParticipant.audioLevel = who === "user" ? level : 0;
				room.remote.audioLevel = who === "assistant" ? level : 0;
				room.activeSpeakers = who === "user" ? [room.localParticipant] : who === "assistant" ? [room.remote] : [];
				room.emit(RoomEvent.ActiveSpeakersChanged, room.activeSpeakers);
			},
			answer(question, answer) {
				const payload = new TextEncoder().encode(JSON.stringify({ transcript: question, answer }));
				room.emit(RoomEvent.DataReceived, payload, room.remote, 0, "advisor");
			},
		};
	}
	on(event, handler) {
		(this.handlers[event] = this.handlers[event] || []).push(handler);
		return this;
	}
	emit(event, ...args) {
		for (const handler of this.handlers[event] || []) handler(...args);
	}
	async connect() {
		if (window.__fakeVoiceDelay) await new Promise((resolve) => setTimeout(resolve, window.__fakeVoiceDelay));
		this.emit(RoomEvent.ConnectionStateChanged, ConnectionState.Connected);
	}
	async disconnect() {
		this.emit(RoomEvent.Disconnected);
	}
}
