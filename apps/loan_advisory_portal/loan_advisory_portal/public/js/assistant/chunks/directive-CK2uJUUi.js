import { i as e, n as t, t as n } from "./rolldown-runtime-CwxnZyOB.js";
import { $ as r, A as i, B as a, C as o, D as s, E as c, F as l, I as u, J as d, L as f, N as p, O as m, P as h, R as g, S as ee, T as te, V as _, Y as ne, b as re, k as ie, n as v, t as ae, v as oe, w as se, x as ce, y as le } from "./random-id-CUzDLhTm.js";
// node_modules/.pnpm/@tanstack+pacer@0.20.1/node_modules/@tanstack/pacer/dist/utils.js
function ue(e) {
	return typeof e == "function";
}
function de(e, ...t) {
	return ue(e) ? e(...t) : e;
}
// node_modules/.pnpm/@tanstack+devtools-event-client@0.4.4/node_modules/@tanstack/devtools-event-client/dist/esm/plugin.js
var fe = class {
	#e = !0;
	#t;
	#n;
	#r;
	#i;
	#a;
	#o;
	#s;
	#c = 0;
	#l = 5;
	#u = !1;
	#d = !1;
	#f = null;
	#p = () => {
		this.debugLog("Connected to event bus"), this.#a = !0, this.#u = !1, this.debugLog("Emitting queued events", this.#i), this.#i.forEach((e) => this.emitEventToBus(e)), this.#i = [], this.stopConnectLoop(), this.#n().removeEventListener("tanstack-connect-success", this.#p);
	};
	#m = () => {
		this.#c < this.#l ? (this.#c++, this.dispatchCustomEvent("tanstack-connect", {})) : (this.#n().removeEventListener("tanstack-connect", this.#m), this.#d = !0, this.debugLog("Max retries reached, giving up on connection"), this.stopConnectLoop());
	};
	#h = () => {
		this.#u || (this.#u = !0, this.#n().addEventListener("tanstack-connect-success", this.#p), this.#m());
	};
	constructor({ pluginId: e, debug: t = !1, enabled: n = !0, reconnectEveryMs: r = 300 }) {
		this.#t = e, this.#e = n, this.#n = this.getGlobalTarget, this.#r = t, this.debugLog(" Initializing event subscription for plugin", this.#t), this.#i = [], this.#a = !1, this.#d = !1, this.#o = null, this.#s = r;
	}
	startConnectLoop() {
		this.#o !== null || this.#a || (this.debugLog(`Starting connect loop (every ${this.#s}ms)`), this.#o = setInterval(this.#m, this.#s));
	}
	stopConnectLoop() {
		this.#u = !1, this.#o !== null && (clearInterval(this.#o), this.#o = null, this.#i = [], this.debugLog("Stopped connect loop"));
	}
	debugLog(...e) {
		this.#r && console.log(`🌴 [tanstack-devtools:${this.#t}-plugin]`, ...e);
	}
	getGlobalTarget() {
		if (typeof globalThis < "u" && globalThis.__TANSTACK_EVENT_TARGET__) return this.debugLog("Using global event target"), globalThis.__TANSTACK_EVENT_TARGET__;
		if (typeof window < "u" && window.addEventListener !== void 0) return this.debugLog("Using window as event target"), window;
		let e = typeof EventTarget < "u" ? new EventTarget() : void 0;
		return e === void 0 || e.addEventListener === void 0 ? (this.debugLog("No event mechanism available, running in non-web environment"), {
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => !1
		}) : (this.debugLog("Using new EventTarget as fallback"), e);
	}
	getPluginId() {
		return this.#t;
	}
	dispatchCustomEventShim(e, t) {
		try {
			let n = new Event(e, { detail: t });
			this.#n().dispatchEvent(n);
		} catch {
			this.debugLog("Failed to dispatch shim event");
		}
	}
	dispatchCustomEvent(e, t) {
		try {
			this.#n().dispatchEvent(new CustomEvent(e, { detail: t }));
		} catch {
			this.dispatchCustomEventShim(e, t);
		}
	}
	emitEventToBus(e) {
		this.debugLog("Emitting event to client bus", e), this.dispatchCustomEvent("tanstack-dispatch-event", e);
	}
	createEventPayload(e, t) {
		return {
			type: `${this.#t}:${e}`,
			payload: t,
			pluginId: this.#t
		};
	}
	emit(e, t) {
		if (!this.#e) this.debugLog("Event bus client is disabled, not emitting event", e, t);
		else if (this.#f && (this.debugLog("Emitting event to internal event target", e, t), this.#f.dispatchEvent(new CustomEvent(`${this.#t}:${e}`, { detail: this.createEventPayload(e, t) }))), this.#d) this.debugLog("Previously failed to connect, not emitting to bus");
		else if (!this.#a) this.debugLog("Bus not available, will be pushed as soon as connected"), this.#i.push(this.createEventPayload(e, t)), typeof CustomEvent < "u" && !this.#u && (this.#h(), this.startConnectLoop());
		else return this.emitEventToBus(this.createEventPayload(e, t));
	}
	on(e, t, n) {
		let r = n?.withEventTarget ?? !1, i = `${this.#t}:${e}`;
		if (r && (this.#f ||= new EventTarget(), this.#f.addEventListener(i, (e) => {
			t(e.detail);
		})), !this.#e) return this.debugLog("Event bus client is disabled, not registering event", i), () => {};
		let a = (e) => {
			this.debugLog("Received event from bus", e.detail), t(e.detail);
		};
		return this.#n().addEventListener(i, a), this.debugLog("Registered event to bus", i), () => {
			r && this.#f?.removeEventListener(i, a), this.#n().removeEventListener(i, a);
		};
	}
	onAll(e) {
		if (!this.#e) return this.debugLog("Event bus client is disabled, not registering event"), () => {};
		let t = (t) => {
			let n = t.detail;
			e(n);
		};
		return this.#n().addEventListener("tanstack-devtools-global", t), () => this.#n().removeEventListener("tanstack-devtools-global", t);
	}
	onAllPluginEvents(e) {
		if (!this.#e) return this.debugLog("Event bus client is disabled, not registering event"), () => {};
		let t = (t) => {
			let n = t.detail;
			this.#t && n.pluginId !== this.#t || e(n);
		};
		return this.#n().addEventListener("tanstack-devtools-global", t), () => this.#n().removeEventListener("tanstack-devtools-global", t);
	}
}, pe = /* @__PURE__ */ new Map();
function me(e, t) {
	pe.set(e, t);
}
function he(e) {
	if (e !== void 0) try {
		return JSON.parse(JSON.stringify(e));
	} catch {
		return null;
	}
}
function ge(e) {
	return typeof e.get == "function" ? e.get() : e.state;
}
function _e(e) {
	return {
		key: e.key,
		store: { state: he(ge(e.store)) },
		options: he(e.options)
	};
}
var ve = class extends fe {
	constructor(e) {
		super({
			pluginId: "pacer",
			debug: e?.debug,
			reconnectEveryMs: 1e3
		});
	}
}, ye = (e, t) => {
	let n = t.key;
	n && (me(n, t), be.emit(e, _e({
		...t,
		key: n
	})));
}, be = new ve(), y = /* @__PURE__ */ ((e) => (e[e.None = 0] = "None", e[e.Mutable = 1] = "Mutable", e[e.Watching = 2] = "Watching", e[e.RecursedCheck = 4] = "RecursedCheck", e[e.Recursed = 8] = "Recursed", e[e.Dirty = 16] = "Dirty", e[e.Pending = 32] = "Pending", e))(y || {});
// @__NO_SIDE_EFFECTS__
function xe({ update: e, notify: t, unwatched: n }) {
	return {
		link: r,
		unlink: i,
		propagate: a,
		checkDirty: o,
		shallowPropagate: s
	};
	function r(e, t, n) {
		let r = t.depsTail;
		if (r !== void 0 && r.dep === e) return;
		let i = r === void 0 ? t.deps : r.nextDep;
		if (i !== void 0 && i.dep === e) {
			i.version = n, t.depsTail = i;
			return;
		}
		let a = e.subsTail;
		if (a !== void 0 && a.version === n && a.sub === t) return;
		let o = t.depsTail = e.subsTail = {
			version: n,
			dep: e,
			sub: t,
			prevDep: r,
			nextDep: i,
			prevSub: a,
			nextSub: void 0
		};
		i !== void 0 && (i.prevDep = o), r === void 0 ? t.deps = o : r.nextDep = o, a === void 0 ? e.subs = o : a.nextSub = o;
	}
	function i(e, t = e.sub) {
		let r = e.dep, i = e.prevDep, a = e.nextDep, o = e.nextSub, s = e.prevSub;
		return a === void 0 ? t.depsTail = i : a.prevDep = i, i === void 0 ? t.deps = a : i.nextDep = a, o === void 0 ? r.subsTail = s : o.prevSub = s, s === void 0 ? (r.subs = o) === void 0 && n(r) : s.nextSub = o, a;
	}
	function a(e) {
		let n = e.nextSub, r;
		top: do {
			let i = e.sub, a = i.flags;
			if (a & 60 ? a & 12 ? a & 4 ? !(a & 48) && c(e, i) ? (i.flags = a | 40, a &= 1) : a = 0 : i.flags = a & -9 | 32 : a = 0 : i.flags = a | 32, a & 2 && t(i), a & 1) {
				let t = i.subs;
				if (t !== void 0) {
					let i = (e = t).nextSub;
					i !== void 0 && (r = {
						value: n,
						prev: r
					}, n = i);
					continue;
				}
			}
			if ((e = n) !== void 0) n = e.nextSub;
			else {
				for (; r !== void 0;) if (e = r.value, r = r.prev, e !== void 0) {
					n = e.nextSub;
					continue top;
				}
				break;
			}
		} while (1);
	}
	function o(t, n) {
		let r, i = 0, a = !1;
		top: do {
			let o = t.dep, c = o.flags;
			if (n.flags & 16) a = !0;
			else if ((c & 17) == 17) {
				if (e(o)) {
					let e = o.subs;
					e.nextSub !== void 0 && s(e), a = !0;
				}
			} else if ((c & 33) == 33) {
				(t.nextSub !== void 0 || t.prevSub !== void 0) && (r = {
					value: t,
					prev: r
				}), t = o.deps, n = o, ++i;
				continue;
			}
			if (!a) {
				let e = t.nextDep;
				if (e !== void 0) {
					t = e;
					continue;
				}
			}
			for (; i--;) {
				let i = n.subs, o = i.nextSub !== void 0;
				if (o ? (t = r.value, r = r.prev) : t = i, a) {
					if (e(n)) {
						o && s(i), n = t.sub;
						continue;
					}
					a = !1;
				} else n.flags &= -33;
				n = t.sub;
				let c = t.nextDep;
				if (c !== void 0) {
					t = c;
					continue top;
				}
			}
			return a;
		} while (1);
	}
	function s(e) {
		do {
			let n = e.sub, r = n.flags;
			(r & 48) == 32 && (n.flags = r | 16, (r & 6) == 2 && t(n));
		} while ((e = e.nextSub) !== void 0);
	}
	function c(e, t) {
		let n = t.depsTail;
		for (; n !== void 0;) {
			if (n === e) return !0;
			n = n.prevDep;
		}
		return !1;
	}
}
// node_modules/.pnpm/@tanstack+store@0.9.3/node_modules/@tanstack/store/dist/esm/atom.js
function Se(e, t, n) {
	let r = typeof e == "object", i = r ? e : void 0;
	return {
		next: (r ? e.next : e)?.bind(i),
		error: (r ? e.error : t)?.bind(i),
		complete: (r ? e.complete : n)?.bind(i)
	};
}
var Ce = [], we = 0, { link: Te, unlink: Ee, propagate: De, checkDirty: Oe, shallowPropagate: ke } = /* @__PURE__ */ xe({
	update(e) {
		return e._update();
	},
	notify(e) {
		Ce[je++] = e, e.flags &= ~y.Watching;
	},
	unwatched(e) {
		e.depsTail !== void 0 && (e.depsTail = void 0, e.flags = y.Mutable | y.Dirty, Pe(e));
	}
}), Ae = 0, je = 0, Me, Ne = 0;
function Pe(e) {
	let t = e.depsTail, n = t === void 0 ? e.deps : t.nextDep;
	for (; n !== void 0;) n = Ee(n, e);
}
function Fe() {
	if (!(Ne > 0)) {
		for (; Ae < je;) {
			let e = Ce[Ae];
			Ce[Ae++] = void 0, e.notify();
		}
		Ae = 0, je = 0;
	}
}
function Ie(e, t) {
	let n = typeof e == "function", r = e, i = {
		_snapshot: n ? void 0 : e,
		subs: void 0,
		subsTail: void 0,
		deps: void 0,
		depsTail: void 0,
		flags: n ? y.None : y.Mutable,
		get() {
			return Me !== void 0 && Te(i, Me, we), i._snapshot;
		},
		subscribe(e) {
			let t = Se(e), n = { current: !1 }, r = Le(() => {
				i.get(), n.current ? t.next?.(i._snapshot) : n.current = !0;
			});
			return { unsubscribe: () => {
				r.stop();
			} };
		},
		_update(e) {
			let a = Me, o = t?.compare ?? Object.is;
			if (n) Me = i, ++we, i.depsTail = void 0;
			else if (e === void 0) return !1;
			n && (i.flags = y.Mutable | y.RecursedCheck);
			try {
				let t = i._snapshot, a = typeof e == "function" ? e(t) : e === void 0 && n ? r(t) : e;
				return t === void 0 || !o(t, a) ? (i._snapshot = a, !0) : !1;
			} finally {
				Me = a, n && (i.flags &= ~y.RecursedCheck), Pe(i);
			}
		}
	};
	return n ? (i.flags = y.Mutable | y.Dirty, i.get = function() {
		let e = i.flags;
		if (e & y.Dirty || e & y.Pending && Oe(i.deps, i)) {
			if (i._update()) {
				let e = i.subs;
				e !== void 0 && ke(e);
			}
		} else e & y.Pending && (i.flags = e & ~y.Pending);
		return Me !== void 0 && Te(i, Me, we), i._snapshot;
	}) : i.set = function(e) {
		if (i._update(e)) {
			let e = i.subs;
			e !== void 0 && (De(e), ke(e), Fe());
		}
	}, i;
}
function Le(e) {
	let t = () => {
		let t = Me;
		Me = n, ++we, n.depsTail = void 0, n.flags = y.Watching | y.RecursedCheck;
		try {
			return e();
		} finally {
			Me = t, n.flags &= ~y.RecursedCheck, Pe(n);
		}
	}, n = {
		deps: void 0,
		depsTail: void 0,
		subs: void 0,
		subsTail: void 0,
		flags: y.Watching | y.RecursedCheck,
		notify() {
			let e = this.flags;
			e & y.Dirty || e & y.Pending && Oe(this.deps, this) ? t() : this.flags = y.Watching;
		},
		stop() {
			this.flags = y.None, this.depsTail = void 0, Pe(this);
		}
	};
	return t(), n;
}
// node_modules/.pnpm/@tanstack+store@0.9.3/node_modules/@tanstack/store/dist/esm/store.js
var Re = class {
	constructor(e) {
		this.atom = Ie(e);
	}
	setState(e) {
		this.atom.set(e);
	}
	get state() {
		return this.atom.get();
	}
	get() {
		return this.state;
	}
	subscribe(e) {
		return this.atom.subscribe(Se(e));
	}
};
// node_modules/.pnpm/@tanstack+pacer@0.20.1/node_modules/@tanstack/pacer/dist/throttler.js
function ze() {
	return {
		executionCount: 0,
		isPending: !1,
		lastArgs: void 0,
		lastExecutionTime: 0,
		nextExecutionTime: 0,
		status: "idle",
		maybeExecuteCount: 0
	};
}
var Be = {
	enabled: !0,
	leading: !0,
	trailing: !0,
	wait: 0
}, Ve = class {
	#e;
	constructor(e, t) {
		this.fn = e, this.store = new Re(ze()), this.setOptions = (e) => {
			this.options = {
				...this.options,
				...e
			}, this.#n() || this.cancel();
		}, this.maybeExecute = (...e) => {
			this.#t({ maybeExecuteCount: this.store.state.maybeExecuteCount + 1 });
			let t = Date.now(), n = t - this.store.state.lastExecutionTime, r = this.#r();
			if (this.options.leading && n >= r) this.#i(...e);
			else if (this.#t({ lastArgs: e }), !this.#e && this.options.trailing) {
				let e = r - (this.store.state.lastExecutionTime ? t - this.store.state.lastExecutionTime : 0);
				this.#t({ isPending: !0 }), this.#e = setTimeout(() => {
					let { lastArgs: e } = this.store.state;
					e !== void 0 && this.#i(...e);
				}, e);
			}
		}, this.flush = () => {
			this.store.state.isPending && this.store.state.lastArgs && this.#i(...this.store.state.lastArgs);
		}, this.cancel = () => {
			this.#a(), this.#t({
				lastArgs: void 0,
				isPending: !1
			});
		}, this.reset = () => {
			this.#t(ze());
		}, this.key = t.key, this.options = {
			...Be,
			...t
		}, this.#t(this.options.initialState ?? {}), this.key && be.on("d-Throttler", (e) => {
			e.payload.key === this.key && (this.#t(e.payload.store.state), this.setOptions(e.payload.options));
		});
	}
	#t = (e) => {
		this.store.setState((t) => {
			let n = {
				...t,
				...e
			}, { isPending: r } = n;
			return {
				...n,
				status: this.#n() ? r ? "pending" : "idle" : "disabled"
			};
		}), ye("Throttler", this);
	};
	#n = () => !!de(this.options.enabled, this);
	#r = () => de(this.options.wait, this);
	#i = (...e) => {
		if (!this.#n()) return;
		this.fn(...e);
		let t = Date.now(), n = t + this.#r();
		this.#a(), this.#t({
			executionCount: this.store.state.executionCount + 1,
			lastExecutionTime: t,
			nextExecutionTime: n,
			isPending: !1,
			lastArgs: void 0
		}), this.options.onExecute?.(e, this), setTimeout(() => {
			this.store.state.isPending || this.#t({ nextExecutionTime: void 0 });
		}, this.#r());
	};
	#a = () => {
		this.#e &&= (clearTimeout(this.#e), void 0);
	};
}, b = /* @__PURE__ */ function(e) {
	return e.TEXT_MESSAGE_START = "TEXT_MESSAGE_START", e.TEXT_MESSAGE_CONTENT = "TEXT_MESSAGE_CONTENT", e.TEXT_MESSAGE_END = "TEXT_MESSAGE_END", e.TEXT_MESSAGE_CHUNK = "TEXT_MESSAGE_CHUNK", e.TOOL_CALL_START = "TOOL_CALL_START", e.TOOL_CALL_ARGS = "TOOL_CALL_ARGS", e.TOOL_CALL_END = "TOOL_CALL_END", e.TOOL_CALL_CHUNK = "TOOL_CALL_CHUNK", e.TOOL_CALL_RESULT = "TOOL_CALL_RESULT", e.STATE_SNAPSHOT = "STATE_SNAPSHOT", e.STATE_DELTA = "STATE_DELTA", e.MESSAGES_SNAPSHOT = "MESSAGES_SNAPSHOT", e.ACTIVITY_SNAPSHOT = "ACTIVITY_SNAPSHOT", e.ACTIVITY_DELTA = "ACTIVITY_DELTA", e.RAW = "RAW", e.CUSTOM = "CUSTOM", e.RUN_STARTED = "RUN_STARTED", e.RUN_FINISHED = "RUN_FINISHED", e.RUN_ERROR = "RUN_ERROR", e.STEP_STARTED = "STEP_STARTED", e.STEP_FINISHED = "STEP_FINISHED", e.REASONING_START = "REASONING_START", e.REASONING_MESSAGE_START = "REASONING_MESSAGE_START", e.REASONING_MESSAGE_CONTENT = "REASONING_MESSAGE_CONTENT", e.REASONING_MESSAGE_END = "REASONING_MESSAGE_END", e.REASONING_MESSAGE_CHUNK = "REASONING_MESSAGE_CHUNK", e.REASONING_END = "REASONING_END", e.REASONING_ENCRYPTED_VALUE = "REASONING_ENCRYPTED_VALUE", e.SUBAGENT_STARTED = "SUBAGENT_STARTED", e.SUBAGENT_FINISHED = "SUBAGENT_FINISHED", e.SUBAGENT_ERROR = "SUBAGENT_ERROR", e;
}({}), He = {
	TextMessageStartEvent: {
		optional: [
			"timestamp",
			"rawEvent",
			"metadata",
			"subagentRunId",
			"role",
			"name"
		],
		fields: {}
	},
	TextMessageContentEvent: {
		optional: [
			"timestamp",
			"rawEvent",
			"metadata",
			"subagentRunId"
		],
		fields: {}
	},
	TextMessageEndEvent: {
		optional: [
			"timestamp",
			"rawEvent",
			"metadata",
			"subagentRunId"
		],
		fields: {}
	},
	TextMessageChunkEvent: {
		optional: [
			"timestamp",
			"rawEvent",
			"metadata",
			"subagentRunId",
			"messageId",
			"role",
			"delta",
			"name"
		],
		fields: {}
	},
	ToolCallStartEvent: {
		optional: [
			"timestamp",
			"rawEvent",
			"metadata",
			"subagentRunId",
			"parentMessageId"
		],
		fields: {}
	},
	ToolCallArgsEvent: {
		optional: [
			"timestamp",
			"rawEvent",
			"metadata",
			"subagentRunId"
		],
		fields: {}
	},
	ToolCallEndEvent: {
		optional: [
			"timestamp",
			"rawEvent",
			"metadata",
			"subagentRunId"
		],
		fields: {}
	},
	ToolCallChunkEvent: {
		optional: [
			"timestamp",
			"rawEvent",
			"metadata",
			"subagentRunId",
			"toolCallId",
			"toolCallName",
			"parentMessageId",
			"delta"
		],
		fields: {}
	},
	TextPart: {
		optional: ["id", "metadata"],
		fields: {}
	},
	DataSource: {
		optional: [],
		fields: {}
	},
	UrlSource: {
		optional: ["mimeType"],
		fields: {}
	},
	FileSource: {
		optional: ["provider", "mimeType"],
		fields: {}
	},
	PartSource: {
		discriminator: "type",
		variants: {
			data: "DataSource",
			url: "UrlSource",
			file: "FileSource"
		}
	},
	ImagePart: {
		optional: ["id", "metadata"],
		fields: { source: "PartSource" }
	},
	AudioPart: {
		optional: ["id", "metadata"],
		fields: { source: "PartSource" }
	},
	VideoPart: {
		optional: ["id", "metadata"],
		fields: { source: "PartSource" }
	},
	DocumentPart: {
		optional: ["id", "metadata"],
		fields: { source: "PartSource" }
	},
	ContentPart: {
		discriminator: "type",
		variants: {
			text: "TextPart",
			image: "ImagePart",
			audio: "AudioPart",
			video: "VideoPart",
			document: "DocumentPart"
		}
	},
	ToolCallResultEvent: {
		optional: [
			"timestamp",
			"rawEvent",
			"metadata",
			"subagentRunId",
			"role"
		],
		fields: { content: { array: "ContentPart" } }
	},
	StateSnapshotEvent: {
		optional: [
			"timestamp",
			"rawEvent",
			"metadata",
			"subagentRunId"
		],
		fields: {}
	},
	AddOperation: {
		optional: [],
		fields: {}
	},
	RemoveOperation: {
		optional: [],
		fields: {}
	},
	ReplaceOperation: {
		optional: [],
		fields: {}
	},
	MoveOperation: {
		optional: [],
		fields: {}
	},
	CopyOperation: {
		optional: [],
		fields: {}
	},
	TestOperation: {
		optional: [],
		fields: {}
	},
	JsonPatchOperation: {
		discriminator: "op",
		variants: {
			add: "AddOperation",
			remove: "RemoveOperation",
			replace: "ReplaceOperation",
			move: "MoveOperation",
			copy: "CopyOperation",
			test: "TestOperation"
		}
	},
	StateDeltaEvent: {
		optional: [
			"timestamp",
			"rawEvent",
			"metadata",
			"subagentRunId"
		],
		fields: { delta: { array: "JsonPatchOperation" } }
	},
	DeveloperMessage: {
		optional: [
			"subagentRunId",
			"name",
			"encryptedValue",
			"metadata"
		],
		fields: {}
	},
	SystemMessage: {
		optional: [
			"subagentRunId",
			"name",
			"encryptedValue",
			"metadata"
		],
		fields: {}
	},
	FunctionCall: {
		optional: [],
		fields: {}
	},
	ToolCall: {
		optional: ["encryptedValue", "metadata"],
		fields: { function: "FunctionCall" }
	},
	AssistantMessage: {
		optional: [
			"subagentRunId",
			"name",
			"encryptedValue",
			"metadata",
			"content",
			"toolCalls"
		],
		fields: { toolCalls: { array: "ToolCall" } }
	},
	UserMessage: {
		optional: [
			"subagentRunId",
			"name",
			"encryptedValue",
			"metadata"
		],
		fields: { content: { array: "ContentPart" } }
	},
	ToolMessage: {
		optional: [
			"subagentRunId",
			"error",
			"encryptedValue",
			"metadata"
		],
		fields: { content: { array: "ContentPart" } }
	},
	ActivityMessage: {
		optional: ["subagentRunId", "metadata"],
		fields: {}
	},
	ReasoningMessage: {
		optional: [
			"subagentRunId",
			"encryptedValue",
			"metadata"
		],
		fields: {}
	},
	Message: {
		discriminator: "role",
		variants: {
			developer: "DeveloperMessage",
			system: "SystemMessage",
			assistant: "AssistantMessage",
			user: "UserMessage",
			tool: "ToolMessage",
			activity: "ActivityMessage",
			reasoning: "ReasoningMessage"
		}
	},
	MessagesSnapshotEvent: {
		optional: [
			"timestamp",
			"rawEvent",
			"metadata"
		],
		fields: { messages: { array: "Message" } }
	},
	ActivitySnapshotEvent: {
		optional: [
			"timestamp",
			"rawEvent",
			"metadata",
			"subagentRunId",
			"replace"
		],
		fields: {}
	},
	ActivityDeltaEvent: {
		optional: [
			"timestamp",
			"rawEvent",
			"metadata",
			"subagentRunId"
		],
		fields: { patch: { array: "JsonPatchOperation" } }
	},
	RawEvent: {
		optional: [
			"timestamp",
			"rawEvent",
			"metadata",
			"subagentRunId",
			"source"
		],
		fields: {}
	},
	CustomEvent: {
		optional: [
			"timestamp",
			"rawEvent",
			"metadata",
			"subagentRunId"
		],
		fields: {}
	},
	Tool: {
		optional: ["parameters", "metadata"],
		fields: {}
	},
	Context: {
		optional: [],
		fields: {}
	},
	ResumeEntry: {
		optional: ["payload", "metadata"],
		fields: {}
	},
	RunAgentInput: {
		optional: [
			"protocolVersion",
			"parentRunId",
			"state",
			"tools",
			"context",
			"forwardedProps",
			"resume"
		],
		fields: {
			messages: { array: "Message" },
			tools: { array: "Tool" },
			context: { array: "Context" },
			resume: { array: "ResumeEntry" }
		}
	},
	RunStartedEvent: {
		optional: [
			"timestamp",
			"rawEvent",
			"metadata",
			"protocolVersion",
			"parentRunId",
			"input"
		],
		fields: { input: "RunAgentInput" }
	},
	RunFinishedSuccessOutcome: {
		optional: ["pendingToolCallIds"],
		fields: {}
	},
	Interrupt: {
		optional: [
			"subagentRunId",
			"message",
			"toolCallId",
			"responseSchema",
			"expiresAt",
			"metadata"
		],
		fields: {}
	},
	RunFinishedInterruptOutcome: {
		optional: [],
		fields: { interrupts: { array: "Interrupt" } }
	},
	RunFinishedCancelledOutcome: {
		optional: [],
		fields: {}
	},
	RunFinishedOutcome: {
		discriminator: "type",
		variants: {
			success: "RunFinishedSuccessOutcome",
			interrupt: "RunFinishedInterruptOutcome",
			cancelled: "RunFinishedCancelledOutcome"
		}
	},
	TokenUsage: {
		optional: [
			"provider",
			"model",
			"inputTokens",
			"outputTokens",
			"totalTokens",
			"reasoningTokens",
			"cachedInputTokens",
			"cacheWriteInputTokens"
		],
		fields: {}
	},
	RunFinishedEvent: {
		optional: [
			"timestamp",
			"rawEvent",
			"metadata",
			"result",
			"outcome",
			"usage"
		],
		fields: {
			outcome: "RunFinishedOutcome",
			usage: { array: "TokenUsage" }
		}
	},
	RunErrorEvent: {
		optional: [
			"timestamp",
			"rawEvent",
			"metadata",
			"code",
			"usage"
		],
		fields: { usage: { array: "TokenUsage" } }
	},
	StepStartedEvent: {
		optional: [
			"timestamp",
			"rawEvent",
			"metadata",
			"subagentRunId"
		],
		fields: {}
	},
	StepFinishedEvent: {
		optional: [
			"timestamp",
			"rawEvent",
			"metadata",
			"subagentRunId"
		],
		fields: {}
	},
	ReasoningStartEvent: {
		optional: [
			"timestamp",
			"rawEvent",
			"metadata",
			"subagentRunId"
		],
		fields: {}
	},
	ReasoningMessageStartEvent: {
		optional: [
			"timestamp",
			"rawEvent",
			"metadata",
			"subagentRunId"
		],
		fields: {}
	},
	ReasoningMessageContentEvent: {
		optional: [
			"timestamp",
			"rawEvent",
			"metadata",
			"subagentRunId"
		],
		fields: {}
	},
	ReasoningMessageEndEvent: {
		optional: [
			"timestamp",
			"rawEvent",
			"metadata",
			"subagentRunId"
		],
		fields: {}
	},
	ReasoningMessageChunkEvent: {
		optional: [
			"timestamp",
			"rawEvent",
			"metadata",
			"subagentRunId",
			"messageId",
			"delta"
		],
		fields: {}
	},
	ReasoningEndEvent: {
		optional: [
			"timestamp",
			"rawEvent",
			"metadata",
			"subagentRunId"
		],
		fields: {}
	},
	ReasoningEncryptedValueEvent: {
		optional: [
			"timestamp",
			"rawEvent",
			"metadata",
			"subagentRunId"
		],
		fields: {}
	},
	SubagentStartedEvent: {
		optional: [
			"timestamp",
			"rawEvent",
			"metadata",
			"description",
			"parentSubagentRunId",
			"parentToolCallId",
			"parentMessageId"
		],
		fields: {}
	},
	SubagentFinishedSuccessOutcome: {
		optional: [],
		fields: {}
	},
	SubagentFinishedSuspendedOutcome: {
		optional: ["interruptIds"],
		fields: {}
	},
	SubagentFinishedOutcome: {
		discriminator: "type",
		variants: {
			success: "SubagentFinishedSuccessOutcome",
			suspended: "SubagentFinishedSuspendedOutcome"
		}
	},
	SubagentFinishedEvent: {
		optional: [
			"timestamp",
			"rawEvent",
			"metadata",
			"result",
			"outcome"
		],
		fields: { outcome: "SubagentFinishedOutcome" }
	},
	SubagentErrorEvent: {
		optional: [
			"timestamp",
			"rawEvent",
			"metadata",
			"code"
		],
		fields: {}
	},
	Event: {
		discriminator: "type",
		variants: {
			TEXT_MESSAGE_START: "TextMessageStartEvent",
			TEXT_MESSAGE_CONTENT: "TextMessageContentEvent",
			TEXT_MESSAGE_END: "TextMessageEndEvent",
			TEXT_MESSAGE_CHUNK: "TextMessageChunkEvent",
			TOOL_CALL_START: "ToolCallStartEvent",
			TOOL_CALL_ARGS: "ToolCallArgsEvent",
			TOOL_CALL_END: "ToolCallEndEvent",
			TOOL_CALL_CHUNK: "ToolCallChunkEvent",
			TOOL_CALL_RESULT: "ToolCallResultEvent",
			STATE_SNAPSHOT: "StateSnapshotEvent",
			STATE_DELTA: "StateDeltaEvent",
			MESSAGES_SNAPSHOT: "MessagesSnapshotEvent",
			ACTIVITY_SNAPSHOT: "ActivitySnapshotEvent",
			ACTIVITY_DELTA: "ActivityDeltaEvent",
			RAW: "RawEvent",
			CUSTOM: "CustomEvent",
			RUN_STARTED: "RunStartedEvent",
			RUN_FINISHED: "RunFinishedEvent",
			RUN_ERROR: "RunErrorEvent",
			STEP_STARTED: "StepStartedEvent",
			STEP_FINISHED: "StepFinishedEvent",
			REASONING_START: "ReasoningStartEvent",
			REASONING_MESSAGE_START: "ReasoningMessageStartEvent",
			REASONING_MESSAGE_CONTENT: "ReasoningMessageContentEvent",
			REASONING_MESSAGE_END: "ReasoningMessageEndEvent",
			REASONING_MESSAGE_CHUNK: "ReasoningMessageChunkEvent",
			REASONING_END: "ReasoningEndEvent",
			REASONING_ENCRYPTED_VALUE: "ReasoningEncryptedValueEvent",
			SUBAGENT_STARTED: "SubagentStartedEvent",
			SUBAGENT_FINISHED: "SubagentFinishedEvent",
			SUBAGENT_ERROR: "SubagentErrorEvent"
		}
	},
	SubagentInfo: {
		optional: ["description"],
		fields: {}
	},
	IdentityCapabilities: {
		optional: [
			"name",
			"type",
			"description",
			"version",
			"provider",
			"documentationUrl",
			"metadata"
		],
		fields: {}
	},
	TransportCapabilities: {
		optional: [
			"streaming",
			"websocket",
			"httpBinary",
			"pushNotifications",
			"resumable"
		],
		fields: {}
	},
	ToolsCapabilities: {
		optional: [
			"supported",
			"items",
			"parallelCalls",
			"clientProvided"
		],
		fields: { items: { array: "Tool" } }
	},
	OutputCapabilities: {
		optional: ["structuredOutput", "supportedMimeTypes"],
		fields: {}
	},
	StateCapabilities: {
		optional: [
			"snapshots",
			"deltas",
			"memory",
			"persistentState"
		],
		fields: {}
	},
	MultiAgentCapabilities: {
		optional: [
			"supported",
			"delegation",
			"handoffs",
			"subagents"
		],
		fields: { subagents: { array: "SubagentInfo" } }
	},
	ReasoningCapabilities: {
		optional: [
			"supported",
			"streaming",
			"encrypted"
		],
		fields: {}
	},
	MultimodalInputCapabilities: {
		optional: [
			"image",
			"audio",
			"video",
			"pdf",
			"file"
		],
		fields: {}
	},
	MultimodalOutputCapabilities: {
		optional: ["image", "audio"],
		fields: {}
	},
	MultimodalCapabilities: {
		optional: ["input", "output"],
		fields: {
			input: "MultimodalInputCapabilities",
			output: "MultimodalOutputCapabilities"
		}
	},
	ExecutionCapabilities: {
		optional: [
			"codeExecution",
			"sandboxed",
			"maxIterations",
			"maxExecutionTime"
		],
		fields: {}
	},
	HumanInTheLoopCapabilities: {
		optional: [
			"supported",
			"approvals",
			"interventions",
			"feedback",
			"interrupts",
			"approveWithEdits"
		],
		fields: {}
	},
	AgentCapabilities: {
		optional: [
			"identity",
			"transport",
			"tools",
			"output",
			"state",
			"multiAgent",
			"reasoning",
			"multimodal",
			"execution",
			"humanInTheLoop",
			"custom"
		],
		fields: {
			identity: "IdentityCapabilities",
			transport: "TransportCapabilities",
			tools: "ToolsCapabilities",
			output: "OutputCapabilities",
			state: "StateCapabilities",
			multiAgent: "MultiAgentCapabilities",
			reasoning: "ReasoningCapabilities",
			multimodal: "MultimodalCapabilities",
			execution: "ExecutionCapabilities",
			humanInTheLoop: "HumanInTheLoopCapabilities"
		}
	}
};
function Ue(e, t) {
	if (typeof t == "string") return Ue(e, He[t]);
	if ("array" in t) {
		if (!Array.isArray(e)) return e;
		let n = e.map((e) => Ue(e, t.array));
		return n.every((t, n) => t === e[n]) ? e : n;
	}
	if (typeof e != "object" || !e || Array.isArray(e)) return e;
	let n = e;
	if ("discriminator" in t) {
		let r = n[t.discriminator];
		return typeof r == "string" && Object.prototype.hasOwnProperty.call(t.variants, r) ? Ue(e, t.variants[r]) : e;
	}
	let r = n;
	for (let e of t.optional) Object.prototype.hasOwnProperty.call(n, e) && n[e] === null && (r === n && (r = { ...n }), delete r[e]);
	for (let [e, i] of Object.entries(t.fields)) {
		if (!Object.prototype.hasOwnProperty.call(r, e)) continue;
		let t = Ue(r[e], i);
		t !== r[e] && (r === n && (r = { ...n }), r[e] = t);
	}
	return r;
}
function We(e, t) {
	return Ue(e, t);
}
var x = class extends Error {
	constructor(e) {
		super(e);
	}
}, Ge = class extends x {
	constructor() {
		super("Connect not implemented. This method is not supported by the current agent.");
	}
};
function Ke(e, t) {
	return t === void 0 ? e : e === void 0 ? { ...t } : {
		...e,
		...t
	};
}
function qe(e) {
	return e === void 0 ? "" : typeof e == "string" ? e : e.filter((e) => e.type === "text").map((e) => e.text).join("");
}
function Je(e) {
	return Array.isArray(e) && e.some((e) => e.type !== "text");
}
// node_modules/.pnpm/fast-json-patch@3.1.1/node_modules/fast-json-patch/module/helpers.mjs
var Ye = (function() {
	var e = function(t, n) {
		return e = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e, t) {
			e.__proto__ = t;
		} || function(e, t) {
			for (var n in t) t.hasOwnProperty(n) && (e[n] = t[n]);
		}, e(t, n);
	};
	return function(t, n) {
		e(t, n);
		function r() {
			this.constructor = t;
		}
		t.prototype = n === null ? Object.create(n) : (r.prototype = n.prototype, new r());
	};
})(), Xe = Object.prototype.hasOwnProperty;
function Ze(e, t) {
	return Xe.call(e, t);
}
function Qe(e) {
	if (Array.isArray(e)) {
		for (var t = Array(e.length), n = 0; n < t.length; n++) t[n] = "" + n;
		return t;
	}
	if (Object.keys) return Object.keys(e);
	var r = [];
	for (var i in e) Ze(e, i) && r.push(i);
	return r;
}
function $e(e) {
	switch (typeof e) {
		case "object": return JSON.parse(JSON.stringify(e));
		case "undefined": return null;
		default: return e;
	}
}
function et(e) {
	for (var t = 0, n = e.length, r; t < n;) if (r = e.charCodeAt(t), r >= 48 && r <= 57) t++;
	else return !1;
	return !0;
}
function tt(e) {
	return e.indexOf("/") === -1 && e.indexOf("~") === -1 ? e : e.replace(/~/g, "~0").replace(/\//g, "~1");
}
function nt(e) {
	return e.replace(/~1/g, "/").replace(/~0/g, "~");
}
function rt(e) {
	if (e === void 0) return !0;
	if (e) {
		if (Array.isArray(e)) {
			for (var t = 0, n = e.length; t < n; t++) if (rt(e[t])) return !0;
		} else if (typeof e == "object") {
			for (var r = Qe(e), i = r.length, a = 0; a < i; a++) if (rt(e[r[a]])) return !0;
		}
	}
	return !1;
}
function it(e, t) {
	var n = [e];
	for (var r in t) {
		var i = typeof t[r] == "object" ? JSON.stringify(t[r], null, 2) : t[r];
		i !== void 0 && n.push(r + ": " + i);
	}
	return n.join("\n");
}
var at = function(e) {
	Ye(t, e);
	function t(t, n, r, i, a) {
		var o = this.constructor, s = e.call(this, it(t, {
			name: n,
			index: r,
			operation: i,
			tree: a
		})) || this;
		return s.name = n, s.index = r, s.operation = i, s.tree = a, Object.setPrototypeOf(s, o.prototype), s.message = it(t, {
			name: n,
			index: r,
			operation: i,
			tree: a
		}), s;
	}
	return t;
}(Error), ot = /* @__PURE__ */ t({
	JsonPatchError: () => S,
	_areEquals: () => gt,
	applyOperation: () => dt,
	applyPatch: () => ft,
	applyReducer: () => pt,
	deepClone: () => st,
	getValueByPointer: () => ut,
	validate: () => ht,
	validator: () => mt
}), S = at, st = $e, ct = {
	add: function(e, t, n) {
		return e[t] = this.value, { newDocument: n };
	},
	remove: function(e, t, n) {
		var r = e[t];
		return delete e[t], {
			newDocument: n,
			removed: r
		};
	},
	replace: function(e, t, n) {
		var r = e[t];
		return e[t] = this.value, {
			newDocument: n,
			removed: r
		};
	},
	move: function(e, t, n) {
		var r = ut(n, this.path);
		r &&= $e(r);
		var i = dt(n, {
			op: "remove",
			path: this.from
		}).removed;
		return dt(n, {
			op: "add",
			path: this.path,
			value: i
		}), {
			newDocument: n,
			removed: r
		};
	},
	copy: function(e, t, n) {
		var r = ut(n, this.from);
		return dt(n, {
			op: "add",
			path: this.path,
			value: $e(r)
		}), { newDocument: n };
	},
	test: function(e, t, n) {
		return {
			newDocument: n,
			test: gt(e[t], this.value)
		};
	},
	_get: function(e, t, n) {
		return this.value = e[t], { newDocument: n };
	}
}, lt = {
	add: function(e, t, n) {
		return et(t) ? e.splice(t, 0, this.value) : e[t] = this.value, {
			newDocument: n,
			index: t
		};
	},
	remove: function(e, t, n) {
		return {
			newDocument: n,
			removed: e.splice(t, 1)[0]
		};
	},
	replace: function(e, t, n) {
		var r = e[t];
		return e[t] = this.value, {
			newDocument: n,
			removed: r
		};
	},
	move: ct.move,
	copy: ct.copy,
	test: ct.test,
	_get: ct._get
};
function ut(e, t) {
	if (t == "") return e;
	var n = {
		op: "_get",
		path: t
	};
	return dt(e, n), n.value;
}
function dt(e, t, n, r, i, a) {
	if (n === void 0 && (n = !1), r === void 0 && (r = !0), i === void 0 && (i = !0), a === void 0 && (a = 0), n && (typeof n == "function" ? n(t, 0, e, t.path) : mt(t, 0)), t.path === "") {
		var o = { newDocument: e };
		if (t.op === "add") return o.newDocument = t.value, o;
		if (t.op === "replace") return o.newDocument = t.value, o.removed = e, o;
		if (t.op === "move" || t.op === "copy") return o.newDocument = ut(e, t.from), t.op === "move" && (o.removed = e), o;
		if (t.op === "test") {
			if (o.test = gt(e, t.value), o.test === !1) throw new S("Test operation failed", "TEST_OPERATION_FAILED", a, t, e);
			return o.newDocument = e, o;
		}
		if (t.op === "remove") return o.removed = e, o.newDocument = null, o;
		if (t.op === "_get") return t.value = e, o;
		if (n) throw new S("Operation `op` property is not one of operations defined in RFC-6902", "OPERATION_OP_INVALID", a, t, e);
		return o;
	}
	r || (e = $e(e));
	var s = (t.path || "").split("/"), c = e, l = 1, u = s.length, d = void 0, f = void 0, p = void 0;
	for (p = typeof n == "function" ? n : mt;;) {
		if (f = s[l], f && f.indexOf("~") != -1 && (f = nt(f)), i && (f == "__proto__" || f == "prototype" && l > 0 && s[l - 1] == "constructor")) throw TypeError("JSON-Patch: modifying `__proto__` or `constructor/prototype` prop is banned for security reasons, if this was on purpose, please set `banPrototypeModifications` flag false and pass it to this function. More info in fast-json-patch README");
		if (n && d === void 0 && (c[f] === void 0 ? d = s.slice(0, l).join("/") : l == u - 1 && (d = t.path), d !== void 0 && p(t, 0, e, d)), l++, Array.isArray(c)) {
			if (f === "-") f = c.length;
			else if (n && !et(f)) throw new S("Expected an unsigned base-10 integer value, making the new referenced value the array element with the zero-based index", "OPERATION_PATH_ILLEGAL_ARRAY_INDEX", a, t, e);
			else et(f) && (f = ~~f);
			if (l >= u) {
				if (n && t.op === "add" && f > c.length) throw new S("The specified index MUST NOT be greater than the number of elements in the array", "OPERATION_VALUE_OUT_OF_BOUNDS", a, t, e);
				var o = lt[t.op].call(t, c, f, e);
				if (o.test === !1) throw new S("Test operation failed", "TEST_OPERATION_FAILED", a, t, e);
				return o;
			}
		} else if (l >= u) {
			var o = ct[t.op].call(t, c, f, e);
			if (o.test === !1) throw new S("Test operation failed", "TEST_OPERATION_FAILED", a, t, e);
			return o;
		}
		if (c = c[f], n && l < u && (!c || typeof c != "object")) throw new S("Cannot perform operation at the desired path", "OPERATION_PATH_UNRESOLVABLE", a, t, e);
	}
}
function ft(e, t, n, r, i) {
	if (r === void 0 && (r = !0), i === void 0 && (i = !0), n && !Array.isArray(t)) throw new S("Patch sequence must be an array", "SEQUENCE_NOT_AN_ARRAY");
	r || (e = $e(e));
	for (var a = Array(t.length), o = 0, s = t.length; o < s; o++) a[o] = dt(e, t[o], n, !0, i, o), e = a[o].newDocument;
	return a.newDocument = e, a;
}
function pt(e, t, n) {
	var r = dt(e, t);
	if (r.test === !1) throw new S("Test operation failed", "TEST_OPERATION_FAILED", n, t, e);
	return r.newDocument;
}
function mt(e, t, n, r) {
	if (typeof e != "object" || !e || Array.isArray(e)) throw new S("Operation is not an object", "OPERATION_NOT_AN_OBJECT", t, e, n);
	if (!ct[e.op]) throw new S("Operation `op` property is not one of operations defined in RFC-6902", "OPERATION_OP_INVALID", t, e, n);
	if (typeof e.path != "string") throw new S("Operation `path` property is not a string", "OPERATION_PATH_INVALID", t, e, n);
	if (e.path.indexOf("/") !== 0 && e.path.length > 0) throw new S("Operation `path` property must start with \"/\"", "OPERATION_PATH_INVALID", t, e, n);
	if ((e.op === "move" || e.op === "copy") && typeof e.from != "string") throw new S("Operation `from` property is not present (applicable in `move` and `copy` operations)", "OPERATION_FROM_REQUIRED", t, e, n);
	if ((e.op === "add" || e.op === "replace" || e.op === "test") && e.value === void 0) throw new S("Operation `value` property is not present (applicable in `add`, `replace` and `test` operations)", "OPERATION_VALUE_REQUIRED", t, e, n);
	if ((e.op === "add" || e.op === "replace" || e.op === "test") && rt(e.value)) throw new S("Operation `value` property is not present (applicable in `add`, `replace` and `test` operations)", "OPERATION_VALUE_CANNOT_CONTAIN_UNDEFINED", t, e, n);
	if (n) {
		if (e.op == "add") {
			var i = e.path.split("/").length, a = r.split("/").length;
			if (i !== a + 1 && i !== a) throw new S("Cannot perform an `add` operation at the desired path", "OPERATION_PATH_CANNOT_ADD", t, e, n);
		} else if (e.op === "replace" || e.op === "remove" || e.op === "_get") {
			if (e.path !== r) throw new S("Cannot perform the operation at a path that does not exist", "OPERATION_PATH_UNRESOLVABLE", t, e, n);
		} else if (e.op === "move" || e.op === "copy") {
			var o = ht([{
				op: "_get",
				path: e.from,
				value: void 0
			}], n);
			if (o && o.name === "OPERATION_PATH_UNRESOLVABLE") throw new S("Cannot perform the operation from a path that does not exist", "OPERATION_FROM_UNRESOLVABLE", t, e, n);
		}
	}
}
function ht(e, t, n) {
	try {
		if (!Array.isArray(e)) throw new S("Patch sequence must be an array", "SEQUENCE_NOT_AN_ARRAY");
		if (t) ft($e(t), $e(e), n || !0);
		else {
			n ||= mt;
			for (var r = 0; r < e.length; r++) n(e[r], r, t, void 0);
		}
	} catch (e) {
		if (e instanceof S) return e;
		throw e;
	}
}
function gt(e, t) {
	if (e === t) return !0;
	if (e && t && typeof e == "object" && typeof t == "object") {
		var n = Array.isArray(e), r = Array.isArray(t), i, a, o;
		if (n && r) {
			if (a = e.length, a != t.length) return !1;
			for (i = a; i-- !== 0;) if (!gt(e[i], t[i])) return !1;
			return !0;
		}
		if (n != r) return !1;
		var s = Object.keys(e);
		if (a = s.length, a !== Object.keys(t).length) return !1;
		for (i = a; i-- !== 0;) if (!t.hasOwnProperty(s[i])) return !1;
		for (i = a; i-- !== 0;) if (o = s[i], !gt(e[o], t[o])) return !1;
		return !0;
	}
	return e !== e && t !== t;
}
// node_modules/.pnpm/fast-json-patch@3.1.1/node_modules/fast-json-patch/module/duplex.mjs
var _t = /* @__PURE__ */ t({
	compare: () => Ot,
	generate: () => Et,
	observe: () => Tt,
	unobserve: () => wt
}), vt = /* @__PURE__ */ new WeakMap(), yt = function() {
	function e(e) {
		this.observers = /* @__PURE__ */ new Map(), this.obj = e;
	}
	return e;
}(), bt = function() {
	function e(e, t) {
		this.callback = e, this.observer = t;
	}
	return e;
}();
function xt(e) {
	return vt.get(e);
}
function St(e, t) {
	return e.observers.get(t);
}
function Ct(e, t) {
	e.observers.delete(t.callback);
}
function wt(e, t) {
	t.unobserve();
}
function Tt(e, t) {
	var n = [], r, i = xt(e);
	if (!i) i = new yt(e), vt.set(e, i);
	else {
		var a = St(i, t);
		r = a && a.observer;
	}
	if (r) return r;
	if (r = {}, i.value = $e(e), t) {
		r.callback = t, r.next = null;
		var o = function() {
			Et(r);
		}, s = function() {
			clearTimeout(r.next), r.next = setTimeout(o);
		};
		typeof window < "u" && (window.addEventListener("mouseup", s), window.addEventListener("keyup", s), window.addEventListener("mousedown", s), window.addEventListener("keydown", s), window.addEventListener("change", s));
	}
	return r.patches = n, r.object = e, r.unobserve = function() {
		Et(r), clearTimeout(r.next), Ct(i, r), typeof window < "u" && (window.removeEventListener("mouseup", s), window.removeEventListener("keyup", s), window.removeEventListener("mousedown", s), window.removeEventListener("keydown", s), window.removeEventListener("change", s));
	}, i.observers.set(t, new bt(t, r)), r;
}
function Et(e, t) {
	t === void 0 && (t = !1);
	var n = vt.get(e.object);
	Dt(n.value, e.object, e.patches, "", t), e.patches.length && ft(n.value, e.patches);
	var r = e.patches;
	return r.length > 0 && (e.patches = [], e.callback && e.callback(r)), r;
}
function Dt(e, t, n, r, i) {
	if (t !== e) {
		typeof t.toJSON == "function" && (t = t.toJSON());
		for (var a = Qe(t), o = Qe(e), s = !1, c = o.length - 1; c >= 0; c--) {
			var l = o[c], u = e[l];
			if (Ze(t, l) && (t[l] !== void 0 || u === void 0 || Array.isArray(t) !== !1)) {
				var d = t[l];
				typeof u == "object" && u && typeof d == "object" && d && Array.isArray(u) === Array.isArray(d) ? Dt(u, d, n, r + "/" + tt(l), i) : u !== d && (i && n.push({
					op: "test",
					path: r + "/" + tt(l),
					value: $e(u)
				}), n.push({
					op: "replace",
					path: r + "/" + tt(l),
					value: $e(d)
				}));
			} else Array.isArray(e) === Array.isArray(t) ? (i && n.push({
				op: "test",
				path: r + "/" + tt(l),
				value: $e(u)
			}), n.push({
				op: "remove",
				path: r + "/" + tt(l)
			}), s = !0) : (i && n.push({
				op: "test",
				path: r,
				value: e
			}), n.push({
				op: "replace",
				path: r,
				value: t
			}));
		}
		if (s || a.length != o.length) for (var c = 0; c < a.length; c++) {
			var l = a[c];
			!Ze(e, l) && t[l] !== void 0 && n.push({
				op: "add",
				path: r + "/" + tt(l),
				value: $e(t[l])
			});
		}
	}
}
function Ot(e, t, n) {
	n === void 0 && (n = !1);
	var r = [];
	return Dt(e, t, r, "", n), r;
}
// node_modules/.pnpm/fast-json-patch@3.1.1/node_modules/fast-json-patch/index.mjs
var kt = Object.assign({}, ot, _t, {
	JsonPatchError: at,
	deepClone: $e,
	escapePathComponent: tt,
	unescapePathComponent: nt
}), At = function(e, t) {
	return At = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e, t) {
		e.__proto__ = t;
	} || function(e, t) {
		for (var n in t) Object.prototype.hasOwnProperty.call(t, n) && (e[n] = t[n]);
	}, At(e, t);
};
function jt(e, t) {
	if (typeof t != "function" && t !== null) throw TypeError("Class extends value " + String(t) + " is not a constructor or null");
	At(e, t);
	function n() {
		this.constructor = e;
	}
	e.prototype = t === null ? Object.create(t) : (n.prototype = t.prototype, new n());
}
var Mt = function() {
	return Mt = Object.assign || function(e) {
		for (var t, n = 1, r = arguments.length; n < r; n++) for (var i in t = arguments[n], t) Object.prototype.hasOwnProperty.call(t, i) && (e[i] = t[i]);
		return e;
	}, Mt.apply(this, arguments);
};
function Nt(e, t) {
	var n = {};
	for (var r in e) Object.prototype.hasOwnProperty.call(e, r) && t.indexOf(r) < 0 && (n[r] = e[r]);
	if (e != null && typeof Object.getOwnPropertySymbols == "function") for (var i = 0, r = Object.getOwnPropertySymbols(e); i < r.length; i++) t.indexOf(r[i]) < 0 && Object.prototype.propertyIsEnumerable.call(e, r[i]) && (n[r[i]] = e[r[i]]);
	return n;
}
function Pt(e, t, n, r) {
	function i(e) {
		return e instanceof n ? e : new n(function(t) {
			t(e);
		});
	}
	return new (n ||= Promise)(function(n, a) {
		function o(e) {
			try {
				c(r.next(e));
			} catch (e) {
				a(e);
			}
		}
		function s(e) {
			try {
				c(r.throw(e));
			} catch (e) {
				a(e);
			}
		}
		function c(e) {
			e.done ? n(e.value) : i(e.value).then(o, s);
		}
		c((r = r.apply(e, t || [])).next());
	});
}
function Ft(e, t) {
	var n = {
		label: 0,
		sent: function() {
			if (a[0] & 1) throw a[1];
			return a[1];
		},
		trys: [],
		ops: []
	}, r, i, a, o = Object.create((typeof Iterator == "function" ? Iterator : Object).prototype);
	return o.next = s(0), o.throw = s(1), o.return = s(2), typeof Symbol == "function" && (o[Symbol.iterator] = function() {
		return this;
	}), o;
	function s(e) {
		return function(t) {
			return c([e, t]);
		};
	}
	function c(s) {
		if (r) throw TypeError("Generator is already executing.");
		for (; o && (o = 0, s[0] && (n = 0)), n;) try {
			if (r = 1, i && (a = s[0] & 2 ? i.return : s[0] ? i.throw || ((a = i.return) && a.call(i), 0) : i.next) && !(a = a.call(i, s[1])).done) return a;
			switch (i = 0, a && (s = [s[0] & 2, a.value]), s[0]) {
				case 0:
				case 1:
					a = s;
					break;
				case 4: return n.label++, {
					value: s[1],
					done: !1
				};
				case 5:
					n.label++, i = s[1], s = [0];
					continue;
				case 7:
					s = n.ops.pop(), n.trys.pop();
					continue;
				default:
					if (a = n.trys, !(a = a.length > 0 && a[a.length - 1]) && (s[0] === 6 || s[0] === 2)) {
						n = 0;
						continue;
					}
					if (s[0] === 3 && (!a || s[1] > a[0] && s[1] < a[3])) {
						n.label = s[1];
						break;
					}
					if (s[0] === 6 && n.label < a[1]) {
						n.label = a[1], a = s;
						break;
					}
					if (a && n.label < a[2]) {
						n.label = a[2], n.ops.push(s);
						break;
					}
					a[2] && n.ops.pop(), n.trys.pop();
					continue;
			}
			s = t.call(e, n);
		} catch (e) {
			s = [6, e], i = 0;
		} finally {
			r = a = 0;
		}
		if (s[0] & 5) throw s[1];
		return {
			value: s[0] ? s[1] : void 0,
			done: !0
		};
	}
}
function It(e) {
	var t = typeof Symbol == "function" && Symbol.iterator, n = t && e[t], r = 0;
	if (n) return n.call(e);
	if (e && typeof e.length == "number") return { next: function() {
		return e && r >= e.length && (e = void 0), {
			value: e && e[r++],
			done: !e
		};
	} };
	throw TypeError(t ? "Object is not iterable." : "Symbol.iterator is not defined.");
}
function Lt(e, t) {
	var n = typeof Symbol == "function" && e[Symbol.iterator];
	if (!n) return e;
	var r = n.call(e), i, a = [], o;
	try {
		for (; (t === void 0 || t-- > 0) && !(i = r.next()).done;) a.push(i.value);
	} catch (e) {
		o = { error: e };
	} finally {
		try {
			i && !i.done && (n = r.return) && n.call(r);
		} finally {
			if (o) throw o.error;
		}
	}
	return a;
}
function Rt(e, t, n) {
	if (n || arguments.length === 2) for (var r = 0, i = t.length, a; r < i; r++) (a || !(r in t)) && (a ||= Array.prototype.slice.call(t, 0, r), a[r] = t[r]);
	return e.concat(a || Array.prototype.slice.call(t));
}
function zt(e) {
	return this instanceof zt ? (this.v = e, this) : new zt(e);
}
function Bt(e, t, n) {
	if (!Symbol.asyncIterator) throw TypeError("Symbol.asyncIterator is not defined.");
	var r = n.apply(e, t || []), i, a = [];
	return i = Object.create((typeof AsyncIterator == "function" ? AsyncIterator : Object).prototype), s("next"), s("throw"), s("return", o), i[Symbol.asyncIterator] = function() {
		return this;
	}, i;
	function o(e) {
		return function(t) {
			return Promise.resolve(t).then(e, d);
		};
	}
	function s(e, t) {
		r[e] && (i[e] = function(t) {
			return new Promise(function(n, r) {
				a.push([
					e,
					t,
					n,
					r
				]) > 1 || c(e, t);
			});
		}, t && (i[e] = t(i[e])));
	}
	function c(e, t) {
		try {
			l(r[e](t));
		} catch (e) {
			f(a[0][3], e);
		}
	}
	function l(e) {
		e.value instanceof zt ? Promise.resolve(e.value.v).then(u, d) : f(a[0][2], e);
	}
	function u(e) {
		c("next", e);
	}
	function d(e) {
		c("throw", e);
	}
	function f(e, t) {
		e(t), a.shift(), a.length && c(a[0][0], a[0][1]);
	}
}
function Vt(e) {
	if (!Symbol.asyncIterator) throw TypeError("Symbol.asyncIterator is not defined.");
	var t = e[Symbol.asyncIterator], n;
	return t ? t.call(e) : (e = typeof It == "function" ? It(e) : e[Symbol.iterator](), n = {}, r("next"), r("throw"), r("return"), n[Symbol.asyncIterator] = function() {
		return this;
	}, n);
	function r(t) {
		n[t] = e[t] && function(n) {
			return new Promise(function(r, a) {
				n = e[t](n), i(r, a, n.done, n.value);
			});
		};
	}
	function i(e, t, n, r) {
		Promise.resolve(r).then(function(t) {
			e({
				value: t,
				done: n
			});
		}, t);
	}
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/util/isFunction.js
function C(e) {
	return typeof e == "function";
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/util/createErrorClass.js
function Ht(e) {
	var t = e(function(e) {
		Error.call(e), e.stack = (/* @__PURE__ */ Error()).stack;
	});
	return t.prototype = Object.create(Error.prototype), t.prototype.constructor = t, t;
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/util/UnsubscriptionError.js
var Ut = Ht(function(e) {
	return function(t) {
		e(this), this.message = t ? t.length + " errors occurred during unsubscription:\n" + t.map(function(e, t) {
			return t + 1 + ") " + e.toString();
		}).join("\n  ") : "", this.name = "UnsubscriptionError", this.errors = t;
	};
});
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/util/arrRemove.js
function Wt(e, t) {
	if (e) {
		var n = e.indexOf(t);
		0 <= n && e.splice(n, 1);
	}
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/Subscription.js
var Gt = function() {
	function e(e) {
		this.initialTeardown = e, this.closed = !1, this._parentage = null, this._finalizers = null;
	}
	return e.prototype.unsubscribe = function() {
		var e, t, n, r, i;
		if (!this.closed) {
			this.closed = !0;
			var a = this._parentage;
			if (a) {
				if (this._parentage = null, Array.isArray(a)) try {
					for (var o = It(a), s = o.next(); !s.done; s = o.next()) s.value.remove(this);
				} catch (t) {
					e = { error: t };
				} finally {
					try {
						s && !s.done && (t = o.return) && t.call(o);
					} finally {
						if (e) throw e.error;
					}
				}
				else a.remove(this);
			}
			var c = this.initialTeardown;
			if (C(c)) try {
				c();
			} catch (e) {
				i = e instanceof Ut ? e.errors : [e];
			}
			var l = this._finalizers;
			if (l) {
				this._finalizers = null;
				try {
					for (var u = It(l), d = u.next(); !d.done; d = u.next()) {
						var f = d.value;
						try {
							Jt(f);
						} catch (e) {
							i ??= [], e instanceof Ut ? i = Rt(Rt([], Lt(i)), Lt(e.errors)) : i.push(e);
						}
					}
				} catch (e) {
					n = { error: e };
				} finally {
					try {
						d && !d.done && (r = u.return) && r.call(u);
					} finally {
						if (n) throw n.error;
					}
				}
			}
			if (i) throw new Ut(i);
		}
	}, e.prototype.add = function(t) {
		if (t && t !== this) {
			if (this.closed) Jt(t);
			else {
				if (t instanceof e) {
					if (t.closed || t._hasParent(this)) return;
					t._addParent(this);
				}
				(this._finalizers = this._finalizers ?? []).push(t);
			}
		}
	}, e.prototype._hasParent = function(e) {
		var t = this._parentage;
		return t === e || Array.isArray(t) && t.includes(e);
	}, e.prototype._addParent = function(e) {
		var t = this._parentage;
		this._parentage = Array.isArray(t) ? (t.push(e), t) : t ? [t, e] : e;
	}, e.prototype._removeParent = function(e) {
		var t = this._parentage;
		t === e ? this._parentage = null : Array.isArray(t) && Wt(t, e);
	}, e.prototype.remove = function(t) {
		var n = this._finalizers;
		n && Wt(n, t), t instanceof e && t._removeParent(this);
	}, e.EMPTY = (function() {
		var t = new e();
		return t.closed = !0, t;
	})(), e;
}(), Kt = Gt.EMPTY;
function qt(e) {
	return e instanceof Gt || e && "closed" in e && C(e.remove) && C(e.add) && C(e.unsubscribe);
}
function Jt(e) {
	C(e) ? e() : e.unsubscribe();
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/config.js
var Yt = {
	onUnhandledError: null,
	onStoppedNotification: null,
	Promise: void 0,
	useDeprecatedSynchronousErrorHandling: !1,
	useDeprecatedNextContext: !1
}, Xt = {
	setTimeout: function(e, t) {
		var n = [...arguments].slice(2), r = Xt.delegate;
		return r?.setTimeout ? r.setTimeout.apply(r, Rt([e, t], Lt(n))) : setTimeout.apply(void 0, Rt([e, t], Lt(n)));
	},
	clearTimeout: function(e) {
		return (Xt.delegate?.clearTimeout || clearTimeout)(e);
	},
	delegate: void 0
};
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/util/reportUnhandledError.js
function Zt(e) {
	Xt.setTimeout(function() {
		var t = Yt.onUnhandledError;
		if (t) t(e);
		else throw e;
	});
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/util/noop.js
function Qt() {}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/NotificationFactories.js
var $t = (function() {
	return nn("C", void 0, void 0);
})();
function en(e) {
	return nn("E", void 0, e);
}
function tn(e) {
	return nn("N", e, void 0);
}
function nn(e, t, n) {
	return {
		kind: e,
		value: t,
		error: n
	};
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/util/errorContext.js
var rn = null;
function an(e) {
	if (Yt.useDeprecatedSynchronousErrorHandling) {
		var t = !rn;
		if (t && (rn = {
			errorThrown: !1,
			error: null
		}), e(), t) {
			var n = rn, r = n.errorThrown, i = n.error;
			if (rn = null, r) throw i;
		}
	} else e();
}
function on(e) {
	Yt.useDeprecatedSynchronousErrorHandling && rn && (rn.errorThrown = !0, rn.error = e);
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/Subscriber.js
var sn = function(e) {
	jt(t, e);
	function t(t) {
		var n = e.call(this) || this;
		return n.isStopped = !1, t ? (n.destination = t, qt(t) && t.add(n)) : n.destination = hn, n;
	}
	return t.create = function(e, t, n) {
		return new dn(e, t, n);
	}, t.prototype.next = function(e) {
		this.isStopped ? mn(tn(e), this) : this._next(e);
	}, t.prototype.error = function(e) {
		this.isStopped ? mn(en(e), this) : (this.isStopped = !0, this._error(e));
	}, t.prototype.complete = function() {
		this.isStopped ? mn($t, this) : (this.isStopped = !0, this._complete());
	}, t.prototype.unsubscribe = function() {
		this.closed || (this.isStopped = !0, e.prototype.unsubscribe.call(this), this.destination = null);
	}, t.prototype._next = function(e) {
		this.destination.next(e);
	}, t.prototype._error = function(e) {
		try {
			this.destination.error(e);
		} finally {
			this.unsubscribe();
		}
	}, t.prototype._complete = function() {
		try {
			this.destination.complete();
		} finally {
			this.unsubscribe();
		}
	}, t;
}(Gt), cn = Function.prototype.bind;
function ln(e, t) {
	return cn.call(e, t);
}
var un = function() {
	function e(e) {
		this.partialObserver = e;
	}
	return e.prototype.next = function(e) {
		var t = this.partialObserver;
		if (t.next) try {
			t.next(e);
		} catch (e) {
			fn(e);
		}
	}, e.prototype.error = function(e) {
		var t = this.partialObserver;
		if (t.error) try {
			t.error(e);
		} catch (e) {
			fn(e);
		}
		else fn(e);
	}, e.prototype.complete = function() {
		var e = this.partialObserver;
		if (e.complete) try {
			e.complete();
		} catch (e) {
			fn(e);
		}
	}, e;
}(), dn = function(e) {
	jt(t, e);
	function t(t, n, r) {
		var i = e.call(this) || this, a;
		if (C(t) || !t) a = {
			next: t ?? void 0,
			error: n ?? void 0,
			complete: r ?? void 0
		};
		else {
			var o;
			i && Yt.useDeprecatedNextContext ? (o = Object.create(t), o.unsubscribe = function() {
				return i.unsubscribe();
			}, a = {
				next: t.next && ln(t.next, o),
				error: t.error && ln(t.error, o),
				complete: t.complete && ln(t.complete, o)
			}) : a = t;
		}
		return i.destination = new un(a), i;
	}
	return t;
}(sn);
function fn(e) {
	Yt.useDeprecatedSynchronousErrorHandling ? on(e) : Zt(e);
}
function pn(e) {
	throw e;
}
function mn(e, t) {
	var n = Yt.onStoppedNotification;
	n && Xt.setTimeout(function() {
		return n(e, t);
	});
}
var hn = {
	closed: !0,
	next: Qt,
	error: pn,
	complete: Qt
}, gn = (function() {
	return typeof Symbol == "function" && Symbol.observable || "@@observable";
})();
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/util/identity.js
function _n(e) {
	return e;
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/util/pipe.js
function vn() {
	return yn([...arguments]);
}
function yn(e) {
	return e.length === 0 ? _n : e.length === 1 ? e[0] : function(t) {
		return e.reduce(function(e, t) {
			return t(e);
		}, t);
	};
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/Observable.js
var w = function() {
	function e(e) {
		e && (this._subscribe = e);
	}
	return e.prototype.lift = function(t) {
		var n = new e();
		return n.source = this, n.operator = t, n;
	}, e.prototype.subscribe = function(e, t, n) {
		var r = this, i = Sn(e) ? e : new dn(e, t, n);
		return an(function() {
			var e = r, t = e.operator, n = e.source;
			i.add(t ? t.call(i, n) : n ? r._subscribe(i) : r._trySubscribe(i));
		}), i;
	}, e.prototype._trySubscribe = function(e) {
		try {
			return this._subscribe(e);
		} catch (t) {
			e.error(t);
		}
	}, e.prototype.forEach = function(e, t) {
		var n = this;
		return t = bn(t), new t(function(t, r) {
			var i = new dn({
				next: function(t) {
					try {
						e(t);
					} catch (e) {
						r(e), i.unsubscribe();
					}
				},
				error: r,
				complete: t
			});
			n.subscribe(i);
		});
	}, e.prototype._subscribe = function(e) {
		return this.source?.subscribe(e);
	}, e.prototype[gn] = function() {
		return this;
	}, e.prototype.pipe = function() {
		return yn([...arguments])(this);
	}, e.prototype.toPromise = function(e) {
		var t = this;
		return e = bn(e), new e(function(e, n) {
			var r;
			t.subscribe(function(e) {
				return r = e;
			}, function(e) {
				return n(e);
			}, function() {
				return e(r);
			});
		});
	}, e.create = function(t) {
		return new e(t);
	}, e;
}();
function bn(e) {
	return e ?? Yt.Promise ?? Promise;
}
function xn(e) {
	return e && C(e.next) && C(e.error) && C(e.complete);
}
function Sn(e) {
	return e && e instanceof sn || xn(e) && qt(e);
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/util/lift.js
function Cn(e) {
	return C(e?.lift);
}
function T(e) {
	return function(t) {
		if (Cn(t)) return t.lift(function(t) {
			try {
				return e(t, this);
			} catch (e) {
				this.error(e);
			}
		});
		throw TypeError("Unable to lift unknown Observable type");
	};
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/operators/OperatorSubscriber.js
function E(e, t, n, r, i) {
	return new wn(e, t, n, r, i);
}
var wn = function(e) {
	jt(t, e);
	function t(t, n, r, i, a, o) {
		var s = e.call(this, t) || this;
		return s.onFinalize = a, s.shouldUnsubscribe = o, s._next = n ? function(e) {
			try {
				n(e);
			} catch (e) {
				t.error(e);
			}
		} : e.prototype._next, s._error = i ? function(e) {
			try {
				i(e);
			} catch (e) {
				t.error(e);
			} finally {
				this.unsubscribe();
			}
		} : e.prototype._error, s._complete = r ? function() {
			try {
				r();
			} catch (e) {
				t.error(e);
			} finally {
				this.unsubscribe();
			}
		} : e.prototype._complete, s;
	}
	return t.prototype.unsubscribe = function() {
		var t;
		if (!this.shouldUnsubscribe || this.shouldUnsubscribe()) {
			var n = this.closed;
			e.prototype.unsubscribe.call(this), n || (t = this.onFinalize) == null || t.call(this);
		}
	}, t;
}(sn), Tn = Ht(function(e) {
	return function() {
		e(this), this.name = "ObjectUnsubscribedError", this.message = "object unsubscribed";
	};
}), En = function(e) {
	jt(t, e);
	function t() {
		var t = e.call(this) || this;
		return t.closed = !1, t.currentObservers = null, t.observers = [], t.isStopped = !1, t.hasError = !1, t.thrownError = null, t;
	}
	return t.prototype.lift = function(e) {
		var t = new Dn(this, this);
		return t.operator = e, t;
	}, t.prototype._throwIfClosed = function() {
		if (this.closed) throw new Tn();
	}, t.prototype.next = function(e) {
		var t = this;
		an(function() {
			var n, r;
			if (t._throwIfClosed(), !t.isStopped) {
				t.currentObservers ||= Array.from(t.observers);
				try {
					for (var i = It(t.currentObservers), a = i.next(); !a.done; a = i.next()) a.value.next(e);
				} catch (e) {
					n = { error: e };
				} finally {
					try {
						a && !a.done && (r = i.return) && r.call(i);
					} finally {
						if (n) throw n.error;
					}
				}
			}
		});
	}, t.prototype.error = function(e) {
		var t = this;
		an(function() {
			if (t._throwIfClosed(), !t.isStopped) {
				t.hasError = t.isStopped = !0, t.thrownError = e;
				for (var n = t.observers; n.length;) n.shift().error(e);
			}
		});
	}, t.prototype.complete = function() {
		var e = this;
		an(function() {
			if (e._throwIfClosed(), !e.isStopped) {
				e.isStopped = !0;
				for (var t = e.observers; t.length;) t.shift().complete();
			}
		});
	}, t.prototype.unsubscribe = function() {
		this.isStopped = this.closed = !0, this.observers = this.currentObservers = null;
	}, Object.defineProperty(t.prototype, "observed", {
		get: function() {
			return this.observers?.length > 0;
		},
		enumerable: !1,
		configurable: !0
	}), t.prototype._trySubscribe = function(t) {
		return this._throwIfClosed(), e.prototype._trySubscribe.call(this, t);
	}, t.prototype._subscribe = function(e) {
		return this._throwIfClosed(), this._checkFinalizedStatuses(e), this._innerSubscribe(e);
	}, t.prototype._innerSubscribe = function(e) {
		var t = this, n = this, r = n.hasError, i = n.isStopped, a = n.observers;
		return r || i ? Kt : (this.currentObservers = null, a.push(e), new Gt(function() {
			t.currentObservers = null, Wt(a, e);
		}));
	}, t.prototype._checkFinalizedStatuses = function(e) {
		var t = this, n = t.hasError, r = t.thrownError, i = t.isStopped;
		n ? e.error(r) : i && e.complete();
	}, t.prototype.asObservable = function() {
		var e = new w();
		return e.source = this, e;
	}, t.create = function(e, t) {
		return new Dn(e, t);
	}, t;
}(w), Dn = function(e) {
	jt(t, e);
	function t(t, n) {
		var r = e.call(this) || this;
		return r.destination = t, r.source = n, r;
	}
	return t.prototype.next = function(e) {
		var t, n;
		(n = (t = this.destination)?.next) == null || n.call(t, e);
	}, t.prototype.error = function(e) {
		var t, n;
		(n = (t = this.destination)?.error) == null || n.call(t, e);
	}, t.prototype.complete = function() {
		var e, t;
		(t = (e = this.destination)?.complete) == null || t.call(e);
	}, t.prototype._subscribe = function(e) {
		return this.source?.subscribe(e) ?? Kt;
	}, t;
}(En), On = function(e) {
	jt(t, e);
	function t(t) {
		var n = e.call(this) || this;
		return n._value = t, n;
	}
	return Object.defineProperty(t.prototype, "value", {
		get: function() {
			return this.getValue();
		},
		enumerable: !1,
		configurable: !0
	}), t.prototype._subscribe = function(t) {
		var n = e.prototype._subscribe.call(this, t);
		return !n.closed && t.next(this._value), n;
	}, t.prototype.getValue = function() {
		var e = this, t = e.hasError, n = e.thrownError, r = e._value;
		if (t) throw n;
		return this._throwIfClosed(), r;
	}, t.prototype.next = function(t) {
		e.prototype.next.call(this, this._value = t);
	}, t;
}(En), kn = {
	now: function() {
		return (kn.delegate || Date).now();
	},
	delegate: void 0
}, An = function(e) {
	jt(t, e);
	function t(t, n, r) {
		t === void 0 && (t = Infinity), n === void 0 && (n = Infinity), r === void 0 && (r = kn);
		var i = e.call(this) || this;
		return i._bufferSize = t, i._windowTime = n, i._timestampProvider = r, i._buffer = [], i._infiniteTimeWindow = !0, i._infiniteTimeWindow = n === Infinity, i._bufferSize = Math.max(1, t), i._windowTime = Math.max(1, n), i;
	}
	return t.prototype.next = function(t) {
		var n = this, r = n.isStopped, i = n._buffer, a = n._infiniteTimeWindow, o = n._timestampProvider, s = n._windowTime;
		r || (i.push(t), !a && i.push(o.now() + s)), this._trimBuffer(), e.prototype.next.call(this, t);
	}, t.prototype._subscribe = function(e) {
		this._throwIfClosed(), this._trimBuffer();
		for (var t = this._innerSubscribe(e), n = this, r = n._infiniteTimeWindow, i = n._buffer.slice(), a = 0; a < i.length && !e.closed; a += r ? 1 : 2) e.next(i[a]);
		return this._checkFinalizedStatuses(e), t;
	}, t.prototype._trimBuffer = function() {
		var e = this, t = e._bufferSize, n = e._timestampProvider, r = e._buffer, i = e._infiniteTimeWindow, a = (i ? 1 : 2) * t;
		if (t < Infinity && a < r.length && r.splice(0, r.length - a), !i) {
			for (var o = n.now(), s = 0, c = 1; c < r.length && r[c] <= o; c += 2) s = c;
			s && r.splice(0, s + 1);
		}
	}, t;
}(En), jn = function(e) {
	jt(t, e);
	function t(t, n) {
		return e.call(this) || this;
	}
	return t.prototype.schedule = function(e, t) {
		return t === void 0 && (t = 0), this;
	}, t;
}(Gt), Mn = {
	setInterval: function(e, t) {
		var n = [...arguments].slice(2), r = Mn.delegate;
		return r?.setInterval ? r.setInterval.apply(r, Rt([e, t], Lt(n))) : setInterval.apply(void 0, Rt([e, t], Lt(n)));
	},
	clearInterval: function(e) {
		return (Mn.delegate?.clearInterval || clearInterval)(e);
	},
	delegate: void 0
}, Nn = function(e) {
	jt(t, e);
	function t(t, n) {
		var r = e.call(this, t, n) || this;
		return r.scheduler = t, r.work = n, r.pending = !1, r;
	}
	return t.prototype.schedule = function(e, t) {
		if (t === void 0 && (t = 0), this.closed) return this;
		this.state = e;
		var n = this.id, r = this.scheduler;
		return n != null && (this.id = this.recycleAsyncId(r, n, t)), this.pending = !0, this.delay = t, this.id = this.id ?? this.requestAsyncId(r, this.id, t), this;
	}, t.prototype.requestAsyncId = function(e, t, n) {
		return n === void 0 && (n = 0), Mn.setInterval(e.flush.bind(e, this), n);
	}, t.prototype.recycleAsyncId = function(e, t, n) {
		if (n === void 0 && (n = 0), n != null && this.delay === n && this.pending === !1) return t;
		t != null && Mn.clearInterval(t);
	}, t.prototype.execute = function(e, t) {
		if (this.closed) return /* @__PURE__ */ Error("executing a cancelled action");
		this.pending = !1;
		var n = this._execute(e, t);
		if (n) return n;
		this.pending === !1 && this.id != null && (this.id = this.recycleAsyncId(this.scheduler, this.id, null));
	}, t.prototype._execute = function(e, t) {
		var n = !1, r;
		try {
			this.work(e);
		} catch (e) {
			n = !0, r = e || /* @__PURE__ */ Error("Scheduled action threw falsy error");
		}
		if (n) return this.unsubscribe(), r;
	}, t.prototype.unsubscribe = function() {
		if (!this.closed) {
			var t = this, n = t.id, r = t.scheduler, i = r.actions;
			this.work = this.state = this.scheduler = null, this.pending = !1, Wt(i, this), n != null && (this.id = this.recycleAsyncId(r, n, null)), this.delay = null, e.prototype.unsubscribe.call(this);
		}
	}, t;
}(jn), Pn = 1, Fn, In = {};
function Ln(e) {
	return e in In && (delete In[e], !0);
}
var Rn = {
	setImmediate: function(e) {
		var t = Pn++;
		return In[t] = !0, Fn ||= Promise.resolve(), Fn.then(function() {
			return Ln(t) && e();
		}), t;
	},
	clearImmediate: function(e) {
		Ln(e);
	}
}, zn = Rn.setImmediate, Bn = Rn.clearImmediate, Vn = {
	setImmediate: function() {
		var e = [...arguments];
		return (Vn.delegate?.setImmediate || zn).apply(void 0, Rt([], Lt(e)));
	},
	clearImmediate: function(e) {
		return (Vn.delegate?.clearImmediate || Bn)(e);
	},
	delegate: void 0
}, Hn = function(e) {
	jt(t, e);
	function t(t, n) {
		var r = e.call(this, t, n) || this;
		return r.scheduler = t, r.work = n, r;
	}
	return t.prototype.requestAsyncId = function(t, n, r) {
		return r === void 0 && (r = 0), r !== null && r > 0 ? e.prototype.requestAsyncId.call(this, t, n, r) : (t.actions.push(this), t._scheduled ||= Vn.setImmediate(t.flush.bind(t, void 0)));
	}, t.prototype.recycleAsyncId = function(t, n, r) {
		if (r === void 0 && (r = 0), r == null ? this.delay > 0 : r > 0) return e.prototype.recycleAsyncId.call(this, t, n, r);
		var i = t.actions;
		n != null && i[i.length - 1]?.id !== n && (Vn.clearImmediate(n), t._scheduled === n && (t._scheduled = void 0));
	}, t;
}(Nn), Un = function() {
	function e(t, n) {
		n === void 0 && (n = e.now), this.schedulerActionCtor = t, this.now = n;
	}
	return e.prototype.schedule = function(e, t, n) {
		return t === void 0 && (t = 0), new this.schedulerActionCtor(this, e).schedule(n, t);
	}, e.now = kn.now, e;
}(), Wn = function(e) {
	jt(t, e);
	function t(t, n) {
		n === void 0 && (n = Un.now);
		var r = e.call(this, t, n) || this;
		return r.actions = [], r._active = !1, r;
	}
	return t.prototype.flush = function(e) {
		var t = this.actions;
		if (this._active) t.push(e);
		else {
			var n;
			this._active = !0;
			do
				if (n = e.execute(e.state, e.delay)) break;
			while (e = t.shift());
			if (this._active = !1, n) {
				for (; e = t.shift();) e.unsubscribe();
				throw n;
			}
		}
	}, t;
}(Un), Gn = new (function(e) {
	jt(t, e);
	function t() {
		return e !== null && e.apply(this, arguments) || this;
	}
	return t.prototype.flush = function(e) {
		this._active = !0;
		var t = this._scheduled;
		this._scheduled = void 0;
		var n = this.actions, r;
		e ||= n.shift();
		do
			if (r = e.execute(e.state, e.delay)) break;
		while ((e = n[0]) && e.id === t && n.shift());
		if (this._active = !1, r) {
			for (; (e = n[0]) && e.id === t && n.shift();) e.unsubscribe();
			throw r;
		}
	}, t;
}(Wn))(Hn), Kn = new Wn(Nn), qn = Kn, Jn = new w(function(e) {
	return e.complete();
});
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/util/isScheduler.js
function Yn(e) {
	return e && C(e.schedule);
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/util/args.js
function Xn(e) {
	return e[e.length - 1];
}
function Zn(e) {
	return C(Xn(e)) ? e.pop() : void 0;
}
function Qn(e) {
	return Yn(Xn(e)) ? e.pop() : void 0;
}
function $n(e, t) {
	return typeof Xn(e) == "number" ? e.pop() : t;
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/util/isArrayLike.js
var er = (function(e) {
	return e && typeof e.length == "number" && typeof e != "function";
});
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/util/isPromise.js
function tr(e) {
	return C(e?.then);
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/util/isInteropObservable.js
function nr(e) {
	return C(e[gn]);
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/util/isAsyncIterable.js
function rr(e) {
	return Symbol.asyncIterator && C(e?.[Symbol.asyncIterator]);
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/util/throwUnobservableError.js
function ir(e) {
	return /* @__PURE__ */ TypeError("You provided " + (typeof e == "object" && e ? "an invalid object" : "'" + e + "'") + " where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable.");
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/symbol/iterator.js
function ar() {
	return typeof Symbol != "function" || !Symbol.iterator ? "@@iterator" : Symbol.iterator;
}
var or = ar();
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/util/isIterable.js
function sr(e) {
	return C(e?.[or]);
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/util/isReadableStreamLike.js
function cr(e) {
	return Bt(this, arguments, function() {
		var t, n, r, i;
		return Ft(this, function(a) {
			switch (a.label) {
				case 0: t = e.getReader(), a.label = 1;
				case 1: a.trys.push([
					1,
					,
					9,
					10
				]), a.label = 2;
				case 2: return [4, zt(t.read())];
				case 3: return n = a.sent(), r = n.value, i = n.done, i ? [4, zt(void 0)] : [3, 5];
				case 4: return [2, a.sent()];
				case 5: return [4, zt(r)];
				case 6: return [4, a.sent()];
				case 7: return a.sent(), [3, 2];
				case 8: return [3, 10];
				case 9: return t.releaseLock(), [7];
				case 10: return [2];
			}
		});
	});
}
function lr(e) {
	return C(e?.getReader);
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/observable/innerFrom.js
function ur(e) {
	if (e instanceof w) return e;
	if (e != null) {
		if (nr(e)) return dr(e);
		if (er(e)) return fr(e);
		if (tr(e)) return pr(e);
		if (rr(e)) return hr(e);
		if (sr(e)) return mr(e);
		if (lr(e)) return gr(e);
	}
	throw ir(e);
}
function dr(e) {
	return new w(function(t) {
		var n = e[gn]();
		if (C(n.subscribe)) return n.subscribe(t);
		throw TypeError("Provided object does not correctly implement Symbol.observable");
	});
}
function fr(e) {
	return new w(function(t) {
		for (var n = 0; n < e.length && !t.closed; n++) t.next(e[n]);
		t.complete();
	});
}
function pr(e) {
	return new w(function(t) {
		e.then(function(e) {
			t.closed || (t.next(e), t.complete());
		}, function(e) {
			return t.error(e);
		}).then(null, Zt);
	});
}
function mr(e) {
	return new w(function(t) {
		var n, r;
		try {
			for (var i = It(e), a = i.next(); !a.done; a = i.next()) {
				var o = a.value;
				if (t.next(o), t.closed) return;
			}
		} catch (e) {
			n = { error: e };
		} finally {
			try {
				a && !a.done && (r = i.return) && r.call(i);
			} finally {
				if (n) throw n.error;
			}
		}
		t.complete();
	});
}
function hr(e) {
	return new w(function(t) {
		_r(e, t).catch(function(e) {
			return t.error(e);
		});
	});
}
function gr(e) {
	return hr(cr(e));
}
function _r(e, t) {
	var n, r, i, a;
	return Pt(this, void 0, void 0, function() {
		var o, s;
		return Ft(this, function(c) {
			switch (c.label) {
				case 0: c.trys.push([
					0,
					5,
					6,
					11
				]), n = Vt(e), c.label = 1;
				case 1: return [4, n.next()];
				case 2:
					if (r = c.sent(), r.done) return [3, 4];
					if (o = r.value, t.next(o), t.closed) return [2];
					c.label = 3;
				case 3: return [3, 1];
				case 4: return [3, 11];
				case 5: return s = c.sent(), i = { error: s }, [3, 11];
				case 6: return c.trys.push([
					6,
					,
					9,
					10
				]), r && !r.done && (a = n.return) ? [4, a.call(n)] : [3, 8];
				case 7: c.sent(), c.label = 8;
				case 8: return [3, 10];
				case 9:
					if (i) throw i.error;
					return [7];
				case 10: return [7];
				case 11: return t.complete(), [2];
			}
		});
	});
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/util/executeSchedule.js
function vr(e, t, n, r, i) {
	r === void 0 && (r = 0), i === void 0 && (i = !1);
	var a = t.schedule(function() {
		n(), i ? e.add(this.schedule(null, r)) : this.unsubscribe();
	}, r);
	if (e.add(a), !i) return a;
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/operators/observeOn.js
function yr(e, t) {
	return t === void 0 && (t = 0), T(function(n, r) {
		n.subscribe(E(r, function(n) {
			return vr(r, e, function() {
				return r.next(n);
			}, t);
		}, function() {
			return vr(r, e, function() {
				return r.complete();
			}, t);
		}, function(n) {
			return vr(r, e, function() {
				return r.error(n);
			}, t);
		}));
	});
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/operators/subscribeOn.js
function br(e, t) {
	return t === void 0 && (t = 0), T(function(n, r) {
		r.add(e.schedule(function() {
			return n.subscribe(r);
		}, t));
	});
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/scheduled/scheduleObservable.js
function xr(e, t) {
	return ur(e).pipe(br(t), yr(t));
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/scheduled/schedulePromise.js
function Sr(e, t) {
	return ur(e).pipe(br(t), yr(t));
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/scheduled/scheduleArray.js
function Cr(e, t) {
	return new w(function(n) {
		var r = 0;
		return t.schedule(function() {
			r === e.length ? n.complete() : (n.next(e[r++]), n.closed || this.schedule());
		});
	});
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/scheduled/scheduleIterable.js
function wr(e, t) {
	return new w(function(n) {
		var r;
		return vr(n, t, function() {
			r = e[or](), vr(n, t, function() {
				var e, t, i;
				try {
					e = r.next(), t = e.value, i = e.done;
				} catch (e) {
					n.error(e);
					return;
				}
				i ? n.complete() : n.next(t);
			}, 0, !0);
		}), function() {
			return C(r?.return) && r.return();
		};
	});
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/scheduled/scheduleAsyncIterable.js
function Tr(e, t) {
	if (!e) throw Error("Iterable cannot be null");
	return new w(function(n) {
		vr(n, t, function() {
			var r = e[Symbol.asyncIterator]();
			vr(n, t, function() {
				r.next().then(function(e) {
					e.done ? n.complete() : n.next(e.value);
				});
			}, 0, !0);
		});
	});
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/scheduled/scheduleReadableStreamLike.js
function Er(e, t) {
	return Tr(cr(e), t);
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/scheduled/scheduled.js
function Dr(e, t) {
	if (e != null) {
		if (nr(e)) return xr(e, t);
		if (er(e)) return Cr(e, t);
		if (tr(e)) return Sr(e, t);
		if (rr(e)) return Tr(e, t);
		if (sr(e)) return wr(e, t);
		if (lr(e)) return Er(e, t);
	}
	throw ir(e);
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/observable/from.js
function Or(e, t) {
	return t ? Dr(e, t) : ur(e);
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/observable/of.js
function D() {
	var e = [...arguments];
	return Or(e, Qn(e));
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/observable/throwError.js
function O(e, t) {
	var n = C(e) ? e : function() {
		return e;
	}, r = function(e) {
		return e.error(n());
	};
	return new w(t ? function(e) {
		return t.schedule(r, 0, e);
	} : r);
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/Notification.js
var kr;
(function(e) {
	e.NEXT = "N", e.ERROR = "E", e.COMPLETE = "C";
})(kr ||= {});
var Ar = function() {
	function e(e, t, n) {
		this.kind = e, this.value = t, this.error = n, this.hasValue = e === "N";
	}
	return e.prototype.observe = function(e) {
		return jr(this, e);
	}, e.prototype.do = function(e, t, n) {
		var r = this, i = r.kind, a = r.value, o = r.error;
		return i === "N" ? e?.(a) : i === "E" ? t?.(o) : n?.();
	}, e.prototype.accept = function(e, t, n) {
		return C(e?.next) ? this.observe(e) : this.do(e, t, n);
	}, e.prototype.toObservable = function() {
		var e = this, t = e.kind, n = e.value, r = e.error, i = t === "N" ? D(n) : t === "E" ? O(function() {
			return r;
		}) : t === "C" ? Jn : 0;
		if (!i) throw TypeError("Unexpected notification kind " + t);
		return i;
	}, e.createNext = function(t) {
		return new e("N", t);
	}, e.createError = function(t) {
		return new e("E", void 0, t);
	}, e.createComplete = function() {
		return e.completeNotification;
	}, e.completeNotification = new e("C"), e;
}();
function jr(e, t) {
	var n, r, i, a = e, o = a.kind, s = a.value, c = a.error;
	if (typeof o != "string") throw TypeError("Invalid notification, missing \"kind\"");
	o === "N" ? (n = t.next) == null || n.call(t, s) : o === "E" ? (r = t.error) == null || r.call(t, c) : (i = t.complete) == null || i.call(t);
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/util/EmptyError.js
var Mr = Ht(function(e) {
	return function() {
		e(this), this.name = "EmptyError", this.message = "no elements in sequence";
	};
});
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/lastValueFrom.js
function Nr(e, t) {
	var n = typeof t == "object";
	return new Promise(function(r, i) {
		var a = !1, o;
		e.subscribe({
			next: function(e) {
				o = e, a = !0;
			},
			error: i,
			complete: function() {
				a ? r(o) : n ? r(t.defaultValue) : i(new Mr());
			}
		});
	});
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/firstValueFrom.js
function Pr(e, t) {
	var n = typeof t == "object";
	return new Promise(function(r, i) {
		var a = new dn({
			next: function(e) {
				r(e), a.unsubscribe();
			},
			error: i,
			complete: function() {
				n ? r(t.defaultValue) : i(new Mr());
			}
		});
		e.subscribe(a);
	});
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/util/isDate.js
function Fr(e) {
	return e instanceof Date && !isNaN(e);
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/operators/timeout.js
var Ir = Ht(function(e) {
	return function(t) {
		t === void 0 && (t = null), e(this), this.message = "Timeout has occurred", this.name = "TimeoutError", this.info = t;
	};
});
function Lr(e, t) {
	var n = Fr(e) ? { first: e } : typeof e == "number" ? { each: e } : e, r = n.first, i = n.each, a = n.with, o = a === void 0 ? Rr : a, s = n.scheduler, c = s === void 0 ? t ?? Kn : s, l = n.meta, u = l === void 0 ? null : l;
	if (r == null && i == null) throw TypeError("No timeout provided.");
	return T(function(e, t) {
		var n, a, s = null, l = 0, d = function(e) {
			a = vr(t, c, function() {
				try {
					n.unsubscribe(), ur(o({
						meta: u,
						lastValue: s,
						seen: l
					})).subscribe(t);
				} catch (e) {
					t.error(e);
				}
			}, e);
		};
		n = e.subscribe(E(t, function(e) {
			a?.unsubscribe(), l++, t.next(s = e), i > 0 && d(i);
		}, void 0, void 0, function() {
			a?.closed || a?.unsubscribe(), s = null;
		})), !l && d(r == null ? i : typeof r == "number" ? r : +r - c.now());
	});
}
function Rr(e) {
	throw new Ir(e);
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/operators/map.js
function k(e, t) {
	return T(function(n, r) {
		var i = 0;
		n.subscribe(E(r, function(n) {
			r.next(e.call(t, n, i++));
		}));
	});
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/util/mapOneOrManyArgs.js
var zr = Array.isArray;
function Br(e, t) {
	return zr(t) ? e.apply(void 0, Rt([], Lt(t))) : e(t);
}
function Vr(e) {
	return k(function(t) {
		return Br(e, t);
	});
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/util/argsArgArrayOrObject.js
var Hr = Array.isArray, Ur = Object.getPrototypeOf, Wr = Object.prototype, Gr = Object.keys;
function Kr(e) {
	if (e.length === 1) {
		var t = e[0];
		if (Hr(t)) return {
			args: t,
			keys: null
		};
		if (qr(t)) {
			var n = Gr(t);
			return {
				args: n.map(function(e) {
					return t[e];
				}),
				keys: n
			};
		}
	}
	return {
		args: e,
		keys: null
	};
}
function qr(e) {
	return e && typeof e == "object" && Ur(e) === Wr;
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/util/createObject.js
function Jr(e, t) {
	return e.reduce(function(e, n, r) {
		return e[n] = t[r], e;
	}, {});
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/observable/combineLatest.js
function Yr() {
	var e = [...arguments], t = Qn(e), n = Zn(e), r = Kr(e), i = r.args, a = r.keys;
	if (i.length === 0) return Or([], t);
	var o = new w(Xr(i, t, a ? function(e) {
		return Jr(a, e);
	} : _n));
	return n ? o.pipe(Vr(n)) : o;
}
function Xr(e, t, n) {
	return n === void 0 && (n = _n), function(r) {
		Zr(t, function() {
			for (var i = e.length, a = Array(i), o = i, s = i, c = function(i) {
				Zr(t, function() {
					var c = Or(e[i], t), l = !1;
					c.subscribe(E(r, function(e) {
						a[i] = e, l || (l = !0, s--), s || r.next(n(a.slice()));
					}, function() {
						--o || r.complete();
					}));
				}, r);
			}, l = 0; l < i; l++) c(l);
		}, r);
	};
}
function Zr(e, t, n) {
	e ? vr(n, e, t) : t();
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/operators/mergeInternals.js
function Qr(e, t, n, r, i, a, o, s) {
	var c = [], l = 0, u = 0, d = !1, f = function() {
		d && !c.length && !l && t.complete();
	}, p = function(e) {
		return l < r ? m(e) : c.push(e);
	}, m = function(e) {
		a && t.next(e), l++;
		var s = !1;
		ur(n(e, u++)).subscribe(E(t, function(e) {
			i?.(e), a ? p(e) : t.next(e);
		}, function() {
			s = !0;
		}, void 0, function() {
			if (s) try {
				l--;
				for (var e = function() {
					var e = c.shift();
					o ? vr(t, o, function() {
						return m(e);
					}) : m(e);
				}; c.length && l < r;) e();
				f();
			} catch (e) {
				t.error(e);
			}
		}));
	};
	return e.subscribe(E(t, p, function() {
		d = !0, f();
	})), function() {
		s?.();
	};
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/operators/mergeMap.js
function $r(e, t, n) {
	return n === void 0 && (n = Infinity), C(t) ? $r(function(n, r) {
		return k(function(e, i) {
			return t(n, e, r, i);
		})(ur(e(n, r)));
	}, n) : (typeof t == "number" && (n = t), T(function(t, r) {
		return Qr(t, r, e, n);
	}));
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/operators/mergeAll.js
function ei(e) {
	return e === void 0 && (e = Infinity), $r(_n, e);
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/operators/concatAll.js
function ti() {
	return ei(1);
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/observable/concat.js
function ni() {
	var e = [...arguments];
	return ti()(Or(e, Qn(e)));
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/observable/defer.js
function A(e) {
	return new w(function(t) {
		ur(e()).subscribe(t);
	});
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/observable/timer.js
function ri(e, t, n) {
	e === void 0 && (e = 0), n === void 0 && (n = qn);
	var r = -1;
	return t != null && (Yn(t) ? n = t : r = t), new w(function(t) {
		var i = Fr(e) ? +e - n.now() : e;
		i < 0 && (i = 0);
		var a = 0;
		return n.schedule(function() {
			t.closed || (t.next(a++), 0 <= r ? this.schedule(void 0, r) : t.complete());
		}, i);
	});
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/observable/merge.js
function ii() {
	var e = [...arguments], t = Qn(e), n = $n(e, Infinity), r = e;
	return r.length ? r.length === 1 ? ur(r[0]) : ei(n)(Or(r, t)) : Jn;
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/observable/never.js
var ai = new w(Qt);
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/operators/filter.js
function j(e, t) {
	return T(function(n, r) {
		var i = 0;
		n.subscribe(E(r, function(n) {
			return e.call(t, n, i++) && r.next(n);
		}));
	});
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/operators/catchError.js
function oi(e) {
	return T(function(t, n) {
		var r = null, i = !1, a;
		r = t.subscribe(E(n, void 0, void 0, function(o) {
			a = ur(e(o, oi(e)(t))), r ? (r.unsubscribe(), r = null, a.subscribe(n)) : i = !0;
		})), i && (r.unsubscribe(), r = null, a.subscribe(n));
	});
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/operators/scanInternals.js
function si(e, t, n, r, i) {
	return function(a, o) {
		var s = n, c = t, l = 0;
		a.subscribe(E(o, function(t) {
			var n = l++;
			c = s ? e(c, t, n) : (s = !0, t), r && o.next(c);
		}, i && (function() {
			s && o.next(c), o.complete();
		})));
	};
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/operators/concatMap.js
function ci(e, t) {
	return C(t) ? $r(e, t, 1) : $r(e, 1);
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/operators/concat.js
function li() {
	var e = [...arguments], t = Qn(e);
	return T(function(n, r) {
		ti()(Or(Rt([n], Lt(e)), t)).subscribe(r);
	});
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/operators/concatWith.js
function ui() {
	var e = [...arguments];
	return li.apply(void 0, Rt([], Lt(e)));
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/operators/defaultIfEmpty.js
function di(e) {
	return T(function(t, n) {
		var r = !1;
		t.subscribe(E(n, function(e) {
			r = !0, n.next(e);
		}, function() {
			r || n.next(e), n.complete();
		}));
	});
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/operators/take.js
function fi(e) {
	return e <= 0 ? function() {
		return Jn;
	} : T(function(t, n) {
		var r = 0;
		t.subscribe(E(n, function(t) {
			++r <= e && (n.next(t), e <= r && n.complete());
		}));
	});
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/operators/ignoreElements.js
function pi() {
	return T(function(e, t) {
		e.subscribe(E(t, Qt));
	});
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/operators/mapTo.js
function mi(e) {
	return k(function() {
		return e;
	});
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/operators/delayWhen.js
function hi(e, t) {
	return t ? function(n) {
		return ni(t.pipe(fi(1), pi()), n.pipe(hi(e)));
	} : $r(function(t, n) {
		return ur(e(t, n)).pipe(fi(1), mi(t));
	});
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/operators/delay.js
function gi(e, t) {
	t === void 0 && (t = Kn);
	var n = ri(e, t);
	return hi(function() {
		return n;
	});
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/operators/dematerialize.js
function _i() {
	return T(function(e, t) {
		e.subscribe(E(t, function(e) {
			return jr(e, t);
		}));
	});
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/operators/distinctUntilChanged.js
function vi(e, t) {
	return t === void 0 && (t = _n), e ??= yi, T(function(n, r) {
		var i, a = !0;
		n.subscribe(E(r, function(n) {
			var o = t(n);
			(a || !e(i, o)) && (a = !1, i = o, r.next(n));
		}));
	});
}
function yi(e, t) {
	return e === t;
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/operators/endWith.js
function bi() {
	var e = [...arguments];
	return function(t) {
		return ni(t, D.apply(void 0, Rt([], Lt(e))));
	};
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/operators/finalize.js
function xi(e) {
	return T(function(t, n) {
		try {
			t.subscribe(n);
		} finally {
			n.add(e);
		}
	});
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/operators/scan.js
function Si(e, t) {
	return T(si(e, t, arguments.length >= 2, !0));
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/operators/share.js
function Ci(e) {
	e === void 0 && (e = {});
	var t = e.connector, n = t === void 0 ? function() {
		return new En();
	} : t, r = e.resetOnError, i = r === void 0 || r, a = e.resetOnComplete, o = a === void 0 || a, s = e.resetOnRefCountZero, c = s === void 0 || s;
	return function(e) {
		var t, r, a, s = 0, l = !1, u = !1, d = function() {
			r?.unsubscribe(), r = void 0;
		}, f = function() {
			d(), t = a = void 0, l = u = !1;
		}, p = function() {
			var e = t;
			f(), e?.unsubscribe();
		};
		return T(function(e, m) {
			s++, !u && !l && d();
			var h = a ??= n();
			m.add(function() {
				s--, s === 0 && !u && !l && (r = wi(p, c));
			}), h.subscribe(m), !t && s > 0 && (t = new dn({
				next: function(e) {
					return h.next(e);
				},
				error: function(e) {
					u = !0, d(), r = wi(f, i, e), h.error(e);
				},
				complete: function() {
					l = !0, d(), r = wi(f, o), h.complete();
				}
			}), ur(e).subscribe(t));
		})(e);
	};
}
function wi(e, t) {
	var n = [...arguments].slice(2);
	if (t === !0) e();
	else if (t !== !1) {
		var r = new dn({ next: function() {
			r.unsubscribe(), e();
		} });
		return ur(t.apply(void 0, Rt([], Lt(n)))).subscribe(r);
	}
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/operators/shareReplay.js
function Ti(e, t, n) {
	var r, i, a, o, s = !1;
	return e && typeof e == "object" ? (r = e.bufferSize, o = r === void 0 ? Infinity : r, i = e.windowTime, t = i === void 0 ? Infinity : i, a = e.refCount, s = a !== void 0 && a, n = e.scheduler) : o = e ?? Infinity, Ci({
		connector: function() {
			return new An(o, t, n);
		},
		resetOnError: !0,
		resetOnComplete: !1,
		resetOnRefCountZero: s
	});
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/operators/startWith.js
function Ei() {
	var e = [...arguments], t = Qn(e);
	return T(function(n, r) {
		(t ? ni(e, n, t) : ni(e, n)).subscribe(r);
	});
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/operators/switchMap.js
function M(e, t) {
	return T(function(n, r) {
		var i = null, a = 0, o = !1, s = function() {
			return o && !i && r.complete();
		};
		n.subscribe(E(r, function(n) {
			i?.unsubscribe();
			var o = 0, c = a++;
			ur(e(n, c)).subscribe(i = E(r, function(e) {
				return r.next(t ? t(n, e, c, o++) : e);
			}, function() {
				i = null, s();
			}));
		}, function() {
			o = !0, s();
		}));
	});
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/operators/takeUntil.js
function Di(e) {
	return T(function(t, n) {
		ur(e).subscribe(E(n, function() {
			return n.complete();
		}, Qt)), !n.closed && t.subscribe(n);
	});
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/operators/tap.js
function Oi(e, t, n) {
	var r = C(e) || t || n ? {
		next: e,
		error: t,
		complete: n
	} : e;
	return r ? T(function(e, t) {
		var n;
		(n = r.subscribe) == null || n.call(r);
		var i = !0;
		e.subscribe(E(t, function(e) {
			var n;
			(n = r.next) == null || n.call(r, e), t.next(e);
		}, function() {
			var e;
			i = !1, (e = r.complete) == null || e.call(r), t.complete();
		}, function(e) {
			var n;
			i = !1, (n = r.error) == null || n.call(r, e), t.error(e);
		}, function() {
			var e, t;
			i && ((e = r.unsubscribe) == null || e.call(r)), (t = r.finalize) == null || t.call(r);
		}));
	}) : _n;
}
// node_modules/.pnpm/rxjs@7.8.1/node_modules/rxjs/dist/esm5/internal/operators/withLatestFrom.js
function ki() {
	var e = [...arguments], t = Zn(e);
	return T(function(n, r) {
		for (var i = e.length, a = Array(i), o = e.map(function() {
			return !1;
		}), s = !1, c = function(t) {
			ur(e[t]).subscribe(E(r, function(e) {
				a[t] = e, !s && !o[t] && (o[t] = !0, (s = o.every(_n)) && (o = null));
			}, Qt));
		}, l = 0; l < i; l++) c(l);
		n.subscribe(E(r, function(e) {
			if (s) {
				var n = Rt([e], Lt(a));
				r.next(t ? t.apply(void 0, Rt([], Lt(n))) : n);
			}
		}));
	});
}
// node_modules/.pnpm/untruncate-json@0.0.1/node_modules/untruncate-json/dist/esm/index.js
function Ai(e) {
	return " \r\n	".indexOf(e) >= 0;
}
function ji(e) {
	for (var t = ["topLevel"], n = 0, r, i, a, o = function(e) {
		return t.push(e);
	}, s = function(e) {
		return t[t.length - 1] = e;
	}, c = function(e) {
		r ?? (r = n, i = t.length, a = e);
	}, l = function(e) {
		e === a && (r = void 0, i = void 0, a = void 0);
	}, u = function() {
		return t.pop();
	}, d = function() {
		return n--;
	}, f = function(e) {
		if ("0" <= e && e <= "9") o("number");
		else switch (e) {
			case "\"":
				o("string");
				return;
			case "-":
				o("numberNeedsDigit");
				return;
			case "t":
				o("true");
				return;
			case "f":
				o("false");
				return;
			case "n":
				o("null");
				return;
			case "[":
				o("arrayNeedsValue");
				return;
			case "{":
				o("objectNeedsKey");
				return;
		}
	}, p = e.length; n < p; n++) {
		var m = e[n];
		switch (t[t.length - 1]) {
			case "topLevel":
				f(m);
				break;
			case "string":
				switch (m) {
					case "\"":
						u();
						break;
					case "\\": c("stringEscape"), o("stringEscaped");
				}
				break;
			case "stringEscaped":
				m === "u" ? o("stringUnicode") : (l("stringEscape"), u());
				break;
			case "stringUnicode":
				n - e.lastIndexOf("u", n) === 4 && (l("stringEscape"), u());
				break;
			case "number":
				m === "." ? s("numberNeedsDigit") : m === "e" || m === "E" ? s("numberNeedsExponent") : (m < "0" || m > "9") && (d(), u());
				break;
			case "numberNeedsDigit":
				s("number");
				break;
			case "numberNeedsExponent":
				s(m === "+" || m === "-" ? "numberNeedsDigit" : "number");
				break;
			case "true":
			case "false":
			case "null":
				(m < "a" || m > "z") && (d(), u());
				break;
			case "arrayNeedsValue":
				m === "]" ? u() : Ai(m) || (l("collectionItem"), s("arrayNeedsComma"), f(m));
				break;
			case "arrayNeedsComma":
				m === "]" ? u() : m === "," && (c("collectionItem"), s("arrayNeedsValue"));
				break;
			case "objectNeedsKey":
				m === "}" ? u() : m === "\"" && (c("collectionItem"), s("objectNeedsColon"), o("string"));
				break;
			case "objectNeedsColon":
				m === ":" && s("objectNeedsValue");
				break;
			case "objectNeedsValue":
				Ai(m) || (l("collectionItem"), s("objectNeedsComma"), f(m));
				break;
			case "objectNeedsComma": m === "}" ? u() : m === "," && (c("collectionItem"), s("objectNeedsKey"));
		}
	}
	i != null && (t.length = i);
	for (var h = [r == null ? e : e.slice(0, r)], g = function(t) {
		return h.push(t.slice(e.length - e.lastIndexOf(t[0])));
	}, ee = t.length - 1; ee >= 0; ee--) switch (t[ee]) {
		case "string":
			h.push("\"");
			break;
		case "numberNeedsDigit":
		case "numberNeedsExponent":
			h.push("0");
			break;
		case "true":
			g("true");
			break;
		case "false":
			g("false");
			break;
		case "null":
			g("null");
			break;
		case "arrayNeedsValue":
		case "arrayNeedsComma":
			h.push("]");
			break;
		case "objectNeedsKey":
		case "objectNeedsColon":
		case "objectNeedsValue":
		case "objectNeedsComma": h.push("}");
	}
	return h.join("");
}
// node_modules/.pnpm/@ag-ui+core@1.0.2_zod@3.25.76/node_modules/@ag-ui/core/dist/schemas.mjs
var Mi = i(b), N = u((e) => typeof e == "object" && !!e && !Array.isArray(e)), P = d(), Ni = i([
	"developer",
	"system",
	"assistant",
	"user"
]), Pi = _({
	type: a(b.TEXT_MESSAGE_START),
	timestamp: g().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: p().refine((e) => e !== null).optional(),
	metadata: N.optional(),
	subagentRunId: P.optional(),
	messageId: d(),
	role: Ni.optional(),
	name: d().optional()
}), Fi = _({
	type: a(b.TEXT_MESSAGE_CONTENT),
	timestamp: g().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: p().refine((e) => e !== null).optional(),
	metadata: N.optional(),
	subagentRunId: P.optional(),
	messageId: d(),
	delta: d()
}), Ii = _({
	type: a(b.TEXT_MESSAGE_END),
	timestamp: g().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: p().refine((e) => e !== null).optional(),
	metadata: N.optional(),
	subagentRunId: P.optional(),
	messageId: d()
}), Li = _({
	type: a(b.TEXT_MESSAGE_CHUNK),
	timestamp: g().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: p().refine((e) => e !== null).optional(),
	metadata: N.optional(),
	subagentRunId: P.optional(),
	messageId: d().optional(),
	role: Ni.optional(),
	delta: d().optional(),
	name: d().optional()
}), Ri = _({
	type: a(b.TOOL_CALL_START),
	timestamp: g().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: p().refine((e) => e !== null).optional(),
	metadata: N.optional(),
	subagentRunId: P.optional(),
	toolCallId: d(),
	toolCallName: d(),
	parentMessageId: d().optional()
}), zi = _({
	type: a(b.TOOL_CALL_ARGS),
	timestamp: g().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: p().refine((e) => e !== null).optional(),
	metadata: N.optional(),
	subagentRunId: P.optional(),
	toolCallId: d(),
	delta: d()
}), Bi = _({
	type: a(b.TOOL_CALL_END),
	timestamp: g().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: p().refine((e) => e !== null).optional(),
	metadata: N.optional(),
	subagentRunId: P.optional(),
	toolCallId: d()
}), Vi = _({
	type: a(b.TOOL_CALL_CHUNK),
	timestamp: g().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: p().refine((e) => e !== null).optional(),
	metadata: N.optional(),
	subagentRunId: P.optional(),
	toolCallId: d().optional(),
	toolCallName: d().optional(),
	parentMessageId: d().optional(),
	delta: d().optional()
}), Hi = _({
	type: a("text"),
	id: d().optional(),
	text: d(),
	metadata: p().refine((e) => e !== null).optional()
}), Ui = _({
	type: a("data"),
	value: d(),
	mimeType: d()
}), Wi = _({
	type: a("url"),
	value: d(),
	mimeType: d().optional()
}), Gi = _({
	type: a("file"),
	value: d(),
	provider: d().optional(),
	mimeType: d().optional()
}), Ki = f("type", [
	Ui,
	Wi,
	Gi
]), qi = _({
	type: a("image"),
	id: d().optional(),
	source: Ki,
	metadata: p().refine((e) => e !== null).optional()
}), Ji = _({
	type: a("audio"),
	id: d().optional(),
	source: Ki,
	metadata: p().refine((e) => e !== null).optional()
}), Yi = _({
	type: a("video"),
	id: d().optional(),
	source: Ki,
	metadata: p().refine((e) => e !== null).optional()
}), Xi = _({
	type: a("document"),
	id: d().optional(),
	source: Ki,
	metadata: p().refine((e) => e !== null).optional()
}), Zi = f("type", [
	Hi,
	qi,
	Ji,
	Yi,
	Xi
]), Qi = _({
	type: a(b.TOOL_CALL_RESULT),
	timestamp: g().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: p().refine((e) => e !== null).optional(),
	metadata: N.optional(),
	subagentRunId: P.optional(),
	messageId: d(),
	toolCallId: d(),
	content: ne([d(), h(Zi)]),
	role: a("tool").optional()
}), $i = p(), ea = _({
	type: a(b.STATE_SNAPSHOT),
	timestamp: g().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: p().refine((e) => e !== null).optional(),
	metadata: N.optional(),
	subagentRunId: P.optional(),
	snapshot: $i.refine((e) => e !== void 0)
}), ta = d().regex(/* @__PURE__ */ RegExp("^(/([^/~]|~[01])*)*$")), na = _({
	op: a("add"),
	path: ta,
	value: p().refine((e) => e !== void 0)
}).meta({ specOpen: !0 }), ra = _({
	op: a("remove"),
	path: ta
}).meta({ specOpen: !0 }), ia = _({
	op: a("replace"),
	path: ta,
	value: p().refine((e) => e !== void 0)
}).meta({ specOpen: !0 }), aa = _({
	op: a("move"),
	from: ta,
	path: ta
}).meta({ specOpen: !0 }), oa = _({
	op: a("copy"),
	from: ta,
	path: ta
}).meta({ specOpen: !0 }), sa = _({
	op: a("test"),
	path: ta,
	value: p().refine((e) => e !== void 0)
}).meta({ specOpen: !0 }), ca = f("op", [
	na,
	ra,
	ia,
	aa,
	oa,
	sa
]), la = h(ca), ua = _({
	type: a(b.STATE_DELTA),
	timestamp: g().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: p().refine((e) => e !== null).optional(),
	metadata: N.optional(),
	subagentRunId: P.optional(),
	delta: la
}), da = _({
	subagentRunId: P.optional(),
	id: d(),
	role: a("developer"),
	name: d().optional(),
	encryptedValue: d().optional(),
	metadata: N.optional(),
	content: d()
}), fa = _({
	subagentRunId: P.optional(),
	id: d(),
	role: a("system"),
	name: d().optional(),
	encryptedValue: d().optional(),
	metadata: N.optional(),
	content: d()
}), pa = _({
	name: d(),
	arguments: d()
}), ma = _({
	id: d(),
	type: a("function"),
	function: pa,
	encryptedValue: d().optional(),
	metadata: N.optional()
}), ha = _({
	subagentRunId: P.optional(),
	id: d(),
	role: a("assistant"),
	name: d().optional(),
	encryptedValue: d().optional(),
	metadata: N.optional(),
	content: d().optional(),
	toolCalls: h(ma).optional()
}), ga = _({
	subagentRunId: P.optional(),
	id: d(),
	role: a("user"),
	name: d().optional(),
	encryptedValue: d().optional(),
	metadata: N.optional(),
	content: ne([d(), h(Zi)])
}), _a = _({
	subagentRunId: P.optional(),
	id: d(),
	role: a("tool"),
	content: ne([d(), h(Zi)]),
	toolCallId: d(),
	error: d().optional(),
	encryptedValue: d().optional(),
	metadata: N.optional()
}), va = _({
	subagentRunId: P.optional(),
	id: d(),
	role: a("activity"),
	activityType: d(),
	content: u((e) => typeof e == "object" && !!e && !Array.isArray(e)),
	metadata: N.optional()
}), ya = _({
	subagentRunId: P.optional(),
	id: d(),
	role: a("reasoning"),
	content: d(),
	encryptedValue: d().optional(),
	metadata: N.optional()
}), ba = f("role", [
	da,
	fa,
	ha,
	ga,
	_a,
	va,
	ya
]), xa = _({
	type: a(b.MESSAGES_SNAPSHOT),
	timestamp: g().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: p().refine((e) => e !== null).optional(),
	metadata: N.optional(),
	messages: h(ba)
}), Sa = _({
	type: a(b.ACTIVITY_SNAPSHOT),
	timestamp: g().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: p().refine((e) => e !== null).optional(),
	metadata: N.optional(),
	subagentRunId: P.optional(),
	messageId: d(),
	activityType: d(),
	content: u((e) => typeof e == "object" && !!e && !Array.isArray(e)),
	replace: l().optional()
}), Ca = _({
	type: a(b.ACTIVITY_DELTA),
	timestamp: g().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: p().refine((e) => e !== null).optional(),
	metadata: N.optional(),
	subagentRunId: P.optional(),
	messageId: d(),
	activityType: d(),
	patch: la
}), wa = _({
	type: a(b.RAW),
	timestamp: g().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: p().refine((e) => e !== null).optional(),
	metadata: N.optional(),
	subagentRunId: P.optional(),
	event: p().refine((e) => e !== void 0),
	source: d().optional()
}), Ta = _({
	type: a(b.CUSTOM),
	timestamp: g().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: p().refine((e) => e !== null).optional(),
	metadata: N.optional(),
	subagentRunId: P.optional(),
	name: d(),
	value: p().refine((e) => e !== void 0)
}), Ea = _({
	name: d(),
	description: d(),
	parameters: p().refine((e) => e !== null).optional(),
	metadata: N.optional()
}), Da = _({
	description: d(),
	value: d()
}), Oa = _({
	interruptId: d(),
	status: i(["resolved", "cancelled"]),
	payload: p().refine((e) => e !== null).optional(),
	metadata: N.optional()
}), ka = _({
	threadId: d(),
	runId: d(),
	protocolVersion: d().optional(),
	parentRunId: d().optional(),
	state: $i.refine((e) => e !== null).nullable().transform((e) => e ?? void 0).optional(),
	messages: h(ba),
	tools: h(Ea).default(() => []),
	context: h(Da).default(() => []),
	forwardedProps: p().refine((e) => e !== null).optional(),
	resume: h(Oa).optional()
}), Aa = _({
	type: a(b.RUN_STARTED),
	timestamp: g().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: p().refine((e) => e !== null).optional(),
	metadata: N.optional(),
	threadId: d(),
	runId: d(),
	protocolVersion: d().optional(),
	parentRunId: d().optional(),
	input: ka.optional()
}), ja = _({
	type: a("success"),
	pendingToolCallIds: h(d()).optional()
}), Ma = _({
	subagentRunId: P.optional(),
	id: d(),
	reason: d(),
	message: d().optional(),
	toolCallId: d().optional(),
	responseSchema: u((e) => typeof e == "object" && !!e && !Array.isArray(e)).optional(),
	expiresAt: d().optional(),
	metadata: N.optional()
}), Na = _({
	type: a("interrupt"),
	interrupts: h(Ma).min(1)
}), Pa = _({ type: a("cancelled") }), Fa = f("type", [
	ja,
	Na,
	Pa
]), Ia = _({
	provider: d().optional(),
	model: d().optional(),
	inputTokens: g().min(0).max(9007199254740991).optional(),
	outputTokens: g().min(0).max(9007199254740991).optional(),
	totalTokens: g().min(0).max(9007199254740991).optional(),
	reasoningTokens: g().min(0).max(9007199254740991).optional(),
	cachedInputTokens: g().min(0).max(9007199254740991).optional(),
	cacheWriteInputTokens: g().min(0).max(9007199254740991).optional()
}), La = _({
	type: a(b.RUN_FINISHED),
	timestamp: g().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: p().refine((e) => e !== null).optional(),
	metadata: N.optional(),
	threadId: d(),
	runId: d(),
	result: p().refine((e) => e !== null).optional(),
	outcome: Fa.optional(),
	usage: h(Ia).optional()
}), Ra = _({
	type: a(b.RUN_ERROR),
	timestamp: g().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: p().refine((e) => e !== null).optional(),
	metadata: N.optional(),
	message: d(),
	code: d().optional(),
	usage: h(Ia).optional()
}), za = _({
	type: a(b.STEP_STARTED),
	timestamp: g().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: p().refine((e) => e !== null).optional(),
	metadata: N.optional(),
	subagentRunId: P.optional(),
	stepName: d()
}), Ba = _({
	type: a(b.STEP_FINISHED),
	timestamp: g().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: p().refine((e) => e !== null).optional(),
	metadata: N.optional(),
	subagentRunId: P.optional(),
	stepName: d()
}), Va = _({
	type: a(b.REASONING_START),
	timestamp: g().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: p().refine((e) => e !== null).optional(),
	metadata: N.optional(),
	subagentRunId: P.optional(),
	messageId: d()
}), Ha = _({
	type: a(b.REASONING_MESSAGE_START),
	timestamp: g().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: p().refine((e) => e !== null).optional(),
	metadata: N.optional(),
	subagentRunId: P.optional(),
	messageId: d(),
	role: a("reasoning")
}), Ua = _({
	type: a(b.REASONING_MESSAGE_CONTENT),
	timestamp: g().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: p().refine((e) => e !== null).optional(),
	metadata: N.optional(),
	subagentRunId: P.optional(),
	messageId: d(),
	delta: d()
}), Wa = _({
	type: a(b.REASONING_MESSAGE_END),
	timestamp: g().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: p().refine((e) => e !== null).optional(),
	metadata: N.optional(),
	subagentRunId: P.optional(),
	messageId: d()
}), Ga = _({
	type: a(b.REASONING_MESSAGE_CHUNK),
	timestamp: g().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: p().refine((e) => e !== null).optional(),
	metadata: N.optional(),
	subagentRunId: P.optional(),
	messageId: d().optional(),
	delta: d().optional()
}), Ka = _({
	type: a(b.REASONING_END),
	timestamp: g().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: p().refine((e) => e !== null).optional(),
	metadata: N.optional(),
	subagentRunId: P.optional(),
	messageId: d()
}), qa = i(["tool-call", "message"]), Ja = _({
	type: a(b.REASONING_ENCRYPTED_VALUE),
	timestamp: g().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: p().refine((e) => e !== null).optional(),
	metadata: N.optional(),
	subagentRunId: P.optional(),
	subtype: qa,
	entityId: d(),
	encryptedValue: d()
}), Ya = _({
	type: a(b.SUBAGENT_STARTED),
	timestamp: g().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: p().refine((e) => e !== null).optional(),
	metadata: N.optional(),
	subagentRunId: P,
	name: d(),
	description: d().optional(),
	parentSubagentRunId: P.optional(),
	parentToolCallId: d().optional(),
	parentMessageId: d().optional()
}), Xa = _({ type: a("success") }), Za = _({
	type: a("suspended"),
	interruptIds: h(d()).optional()
}), Qa = f("type", [Xa, Za]), $a = _({
	type: a(b.SUBAGENT_FINISHED),
	timestamp: g().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: p().refine((e) => e !== null).optional(),
	metadata: N.optional(),
	subagentRunId: P,
	result: p().refine((e) => e !== null).optional(),
	outcome: Qa.optional()
}), eo = _({
	type: a(b.SUBAGENT_ERROR),
	timestamp: g().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: p().refine((e) => e !== null).optional(),
	metadata: N.optional(),
	subagentRunId: P,
	message: d(),
	code: d().optional()
}), to = f("type", [
	Pi,
	Fi,
	Ii,
	Li,
	Ri,
	zi,
	Bi,
	Vi,
	Qi,
	ea,
	ua,
	xa,
	Sa,
	Ca,
	wa,
	Ta,
	Aa,
	La,
	Ra,
	za,
	Ba,
	Va,
	Ha,
	Ua,
	Wa,
	Ga,
	Ka,
	Ja,
	Ya,
	$a,
	eo
]);
i([
	"developer",
	"system",
	"assistant",
	"user",
	"tool",
	"activity",
	"reasoning"
]);
var no = _({
	name: d(),
	description: d().optional()
}), ro = _({
	name: d().optional(),
	type: d().optional(),
	description: d().optional(),
	version: d().optional(),
	provider: d().optional(),
	documentationUrl: d().optional(),
	metadata: N.optional()
}), io = _({
	streaming: l().optional(),
	websocket: l().optional(),
	httpBinary: l().optional(),
	pushNotifications: l().optional(),
	resumable: l().optional()
}), ao = _({
	supported: l().optional(),
	items: h(Ea).optional(),
	parallelCalls: l().optional(),
	clientProvided: l().optional()
}), oo = _({
	structuredOutput: l().optional(),
	supportedMimeTypes: h(d()).optional()
}), so = _({
	snapshots: l().optional(),
	deltas: l().optional(),
	memory: l().optional(),
	persistentState: l().optional()
}), co = _({
	supported: l().optional(),
	delegation: l().optional(),
	handoffs: l().optional(),
	subagents: h(no).optional()
}), lo = _({
	supported: l().optional(),
	streaming: l().optional(),
	encrypted: l().optional()
}), uo = _({
	image: l().optional(),
	audio: l().optional(),
	video: l().optional(),
	pdf: l().optional(),
	file: l().optional()
}), fo = _({
	image: l().optional(),
	audio: l().optional()
}), po = _({
	input: uo.optional(),
	output: fo.optional()
}), mo = _({
	codeExecution: l().optional(),
	sandboxed: l().optional(),
	maxIterations: g().min(0).max(9007199254740991).optional(),
	maxExecutionTime: g().min(0).max(9007199254740991).optional()
}), ho = _({
	supported: l().optional(),
	approvals: l().optional(),
	interventions: l().optional(),
	feedback: l().optional(),
	interrupts: l().optional(),
	approveWithEdits: l().optional()
});
_({
	identity: ro.optional(),
	transport: io.optional(),
	tools: ao.optional(),
	output: oo.optional(),
	state: so.optional(),
	multiAgent: co.optional(),
	reasoning: lo.optional(),
	multimodal: po.optional(),
	execution: mo.optional(),
	humanInTheLoop: ho.optional(),
	custom: u((e) => typeof e == "object" && !!e && !Array.isArray(e)).optional()
}), _({ subagentRunId: P.optional() }), _({
	type: Mi,
	timestamp: g().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: p().refine((e) => e !== null).optional(),
	metadata: N.optional()
}), _({
	subagentRunId: P.optional(),
	id: d(),
	role: d(),
	name: d().optional(),
	encryptedValue: d().optional(),
	metadata: N.optional()
}), N.optional();
// node_modules/.pnpm/@bufbuild+protobuf@2.17.0/node_modules/@bufbuild/protobuf/dist/esm/wire/varint.js
function go() {
	let e = this.buf, t = this.pos, n = 0, r = 0;
	for (let i = 0; i < 28; i += 7) {
		let a = e[t++];
		if (n |= (a & 127) << i, !(a & 128)) {
			this.pos = t, this.assertBounds(), this.varint64Lo = n, this.varint64Hi = r;
			return;
		}
	}
	let i = e[t++];
	if (n |= (i & 15) << 28, r = (i & 112) >> 4, !(i & 128)) this.pos = t, this.assertBounds(), this.varint64Lo = n, this.varint64Hi = r;
	else {
		for (let i = 3; i <= 31; i += 7) {
			let a = e[t++];
			if (r |= (a & 127) << i, !(a & 128)) {
				this.pos = t, this.assertBounds(), this.varint64Lo = n, this.varint64Hi = r;
				return;
			}
		}
		throw Error("invalid varint");
	}
}
var _o = 4294967296;
function vo(e) {
	let t = e[0] === "-";
	t && (e = e.slice(1));
	let n = 1e6, r = 0, i = 0;
	function a(t, a) {
		let o = Number(e.slice(t, a));
		i *= n, r = r * n + o, r >= _o && (i += r / _o | 0, r %= _o);
	}
	return a(-24, -18), a(-18, -12), a(-12, -6), a(-6), t ? Co(r, i) : So(r, i);
}
function yo(e, t) {
	let n = So(e, t), r = n.hi & 2147483648;
	r && (n = Co(n.lo, n.hi));
	let i = bo(n.lo, n.hi);
	return r ? "-" + i : i;
}
function bo(e, t) {
	if ({lo: e, hi: t} = xo(e, t), t <= 2097151) return String(_o * t + e);
	let n = e & 16777215, r = (e >>> 24 | t << 8) & 16777215, i = t >> 16 & 65535, a = n + r * 6777216 + i * 6710656, o = r + i * 8147497, s = i * 2, c = 1e7;
	return a >= c && (o += Math.floor(a / c), a %= c), o >= c && (s += Math.floor(o / c), o %= c), s.toString() + wo(o) + wo(a);
}
function xo(e, t) {
	return {
		lo: e >>> 0,
		hi: t >>> 0
	};
}
function So(e, t) {
	return {
		lo: e | 0,
		hi: t | 0
	};
}
function Co(e, t) {
	return t = ~t, e ? e = ~e + 1 : t += 1, So(e, t);
}
var wo = (e) => {
	let t = String(e);
	return "0000000".slice(t.length) + t;
};
function To() {
	let e = this.buf[this.pos++];
	if (!(e & 128)) return this.assertBounds(), e;
	let t = e & 127;
	if (e = this.buf[this.pos++], t |= (e & 127) << 7, !(e & 128) || (e = this.buf[this.pos++], t |= (e & 127) << 14, !(e & 128)) || (e = this.buf[this.pos++], t |= (e & 127) << 21, !(e & 128))) return this.assertBounds(), t;
	e = this.buf[this.pos++], t |= (e & 15) << 28;
	for (let t = 5; e & 128 && t < 10; t++) e = this.buf[this.pos++];
	if (e & 128) throw Error("invalid varint");
	return this.assertBounds(), t >>> 0;
}
// node_modules/.pnpm/@bufbuild+protobuf@2.17.0/node_modules/@bufbuild/protobuf/dist/esm/proto-int64.js
var Eo = /*@__PURE__*/ Do();
function Do() {
	let e = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(8));
	if (typeof BigInt == "function" && typeof e.getBigInt64 == "function" && typeof e.getBigUint64 == "function" && typeof e.setBigInt64 == "function" && typeof e.setBigUint64 == "function" && (globalThis.Deno || globalThis.Bun || typeof process != "object" || typeof process.env != "object" || process.env.BUF_BIGINT_DISABLE !== "1")) {
		let t = BigInt("-9223372036854775808"), n = BigInt("9223372036854775807"), r = BigInt("0"), i = BigInt("18446744073709551615");
		return {
			zero: BigInt(0),
			supported: !0,
			parse(e) {
				let r = typeof e == "bigint" ? e : BigInt(e);
				if (r > n || r < t) throw Error(`invalid int64: ${e}`);
				return r;
			},
			uParse(e) {
				let t = typeof e == "bigint" ? e : BigInt(e);
				if (t > i || t < r) throw Error(`invalid uint64: ${e}`);
				return t;
			},
			enc(t) {
				return e.setBigInt64(0, this.parse(t), !0), {
					lo: e.getInt32(0, !0),
					hi: e.getInt32(4, !0)
				};
			},
			uEnc(t) {
				return e.setBigInt64(0, this.uParse(t), !0), {
					lo: e.getInt32(0, !0),
					hi: e.getInt32(4, !0)
				};
			},
			dec(t, n) {
				return e.setInt32(0, t, !0), e.setInt32(4, n, !0), e.getBigInt64(0, !0);
			},
			uDec(t, n) {
				return e.setInt32(0, t, !0), e.setInt32(4, n, !0), e.getBigUint64(0, !0);
			}
		};
	}
	return {
		zero: "0",
		supported: !1,
		parse(e) {
			return typeof e != "string" && (e = e.toString()), Oo(e), e;
		},
		uParse(e) {
			return typeof e != "string" && (e = e.toString()), ko(e), e;
		},
		enc(e) {
			return typeof e != "string" && (e = e.toString()), Oo(e), vo(e);
		},
		uEnc(e) {
			return typeof e != "string" && (e = e.toString()), ko(e), vo(e);
		},
		dec(e, t) {
			return yo(e, t);
		},
		uDec(e, t) {
			return bo(e, t);
		}
	};
}
function Oo(e) {
	if (!/^-?[0-9]+$/.test(e)) throw Error("invalid int64: " + e);
}
function ko(e) {
	if (!/^[0-9]+$/.test(e)) throw Error("invalid uint64: " + e);
}
// node_modules/.pnpm/@bufbuild+protobuf@2.17.0/node_modules/@bufbuild/protobuf/dist/esm/wire/text-encoding.js
var Ao;
function jo(e) {
	Ao = Object.assign(Object.assign({}, e), { encodeUtf8Into: e.encodeUtf8Into ?? No(e.encodeUtf8.bind(e)) });
}
function Mo() {
	if (!Ao) {
		let e = globalThis;
		if (!e.TextEncoder || !e.TextDecoder) throw Error("encoding API missing: install TextEncoder and TextDecoder on globalThis");
		let t = new e.TextEncoder(), n = new e.TextDecoder("utf-8", { ignoreBOM: !0 }), r, i = {
			encodeUtf8(e) {
				return t.encode(e);
			},
			decodeUtf8(t, i) {
				return i ? (r ||= new e.TextDecoder("utf-8", {
					fatal: !0,
					ignoreBOM: !0
				}), r.decode(t)) : n.decode(t);
			},
			checkUtf8(e) {
				try {
					return !0;
				} catch {
					return !1;
				}
			}
		};
		t.encodeInto && (i.encodeUtf8Into = t.encodeInto.bind(t));
		let a = String.prototype.isWellFormed;
		a && (i.checkUtf8 = (e) => a.call(e)), jo(i);
	}
	return Ao;
}
function No(e) {
	return (t, n) => {
		let r = e(t);
		return n.set(r), { written: r.byteLength };
	};
}
// node_modules/.pnpm/@bufbuild+protobuf@2.17.0/node_modules/@bufbuild/protobuf/dist/esm/wire/binary-encoding.js
var Po;
(function(e) {
	e[e.Varint = 0] = "Varint", e[e.Bit64 = 1] = "Bit64", e[e.LengthDelimited = 2] = "LengthDelimited", e[e.StartGroup = 3] = "StartGroup", e[e.EndGroup = 4] = "EndGroup", e[e.Bit32 = 5] = "Bit32";
})(Po ||= {});
var F = class {
	constructor(e) {
		this.stackPos = [], this.encodeUtf8Into = e ? No(e) : Mo().encodeUtf8Into, this.buffer = Lo, this.viewCache = Ro, this.pos = 0;
	}
	ensureCapacity(e) {
		let t = this.pos + e;
		if (t > this.buffer.length) {
			let e = this.buffer.length || Fo;
			for (; e < t;) e *= 2;
			let n = new Uint8Array(e);
			this.pos > 0 && n.set(this.buffer), this.buffer = n;
		}
	}
	view() {
		let e = this.buffer, t = this.viewCache;
		if (t.byteLength === e.byteLength) return t;
		let n = new DataView(e.buffer);
		return this.viewCache = n, n;
	}
	finish() {
		let e = this.buffer.slice(0, this.pos);
		return this.pos = 0, this.stackPos = [], e;
	}
	fork() {
		return this.stackPos.push(this.pos), this.ensureCapacity(Io), this.buffer[this.pos++] = 0, this;
	}
	join() {
		let e = this.stackPos.pop();
		if (e === void 0) throw Error("invalid state, fork stack empty");
		let t = this.pos - e - Io, n = Bo(t);
		return n > Io && (this.ensureCapacity(n - Io), this.buffer.copyWithin(e + n, e + Io, this.pos)), this.pos = e, this.uint32(t), this.pos += t, this;
	}
	tag(e, t) {
		return this.uint32((e << 3 | t) >>> 0);
	}
	raw(e) {
		return this.ensureCapacity(e.length), this.buffer.set(e, this.pos), this.pos += e.length, this;
	}
	uint32(e) {
		if (Ho(e), this.ensureCapacity(5), e < 128) return this.buffer[this.pos++] = e, this;
		for (; e > 127;) this.buffer[this.pos++] = e & 127 | 128, e >>>= 7;
		return this.buffer[this.pos++] = e, this;
	}
	int32(e) {
		if (Vo(e), e >= 0) return this.uint32(e);
		this.ensureCapacity(10);
		for (let t = 0; t < 9; t++) this.buffer[this.pos++] = e & 127 | 128, e >>= 7;
		return this.buffer[this.pos++] = 1, this;
	}
	bool(e) {
		return this.ensureCapacity(1), this.buffer[this.pos++] = +!!e, this;
	}
	bytes(e) {
		return this.uint32(e.byteLength), this.raw(e);
	}
	string(e) {
		typeof e != "string" && (e = String(e));
		let t = e.length;
		if (t <= zo) {
			this.ensureCapacity(t + 1);
			let n = this.buffer, r = this.pos;
			n[r++] = t;
			let i = 0;
			for (; i < t; i++) {
				let t = e.charCodeAt(i);
				if (t > 127) break;
				n[r++] = t;
			}
			if (i == t) return this.pos = r, this;
		}
		this.ensureCapacity(t * 3 + 5);
		let n = Bo(t), r = this.buffer, i = this.pos, { written: a } = this.encodeUtf8Into(e, r.subarray(i + n)), o = Bo(a);
		return o != n && r.copyWithin(i + o, i + n, i + n + a), this.uint32(a), this.pos += a, this;
	}
	float(e) {
		return Uo(e), this.ensureCapacity(4), this.view().setFloat32(this.pos, e, !0), this.pos += 4, this;
	}
	double(e) {
		return this.ensureCapacity(8), this.view().setFloat64(this.pos, e, !0), this.pos += 8, this;
	}
	fixed32(e) {
		return Ho(e), this.ensureCapacity(4), this.view().setUint32(this.pos, e, !0), this.pos += 4, this;
	}
	sfixed32(e) {
		return Vo(e), this.ensureCapacity(4), this.view().setInt32(this.pos, e, !0), this.pos += 4, this;
	}
	sint32(e) {
		return Vo(e), this.uint32((e << 1 ^ e >> 31) >>> 0);
	}
	sfixed64(e) {
		let t = Eo.enc(e);
		this.ensureCapacity(8);
		let n = this.view();
		return n.setInt32(this.pos, t.lo, !0), n.setInt32(this.pos + 4, t.hi, !0), this.pos += 8, this;
	}
	fixed64(e) {
		let t = Eo.uEnc(e);
		this.ensureCapacity(8);
		let n = this.view();
		return n.setInt32(this.pos, t.lo, !0), n.setInt32(this.pos + 4, t.hi, !0), this.pos += 8, this;
	}
	int64(e) {
		let t = Eo.enc(e);
		return this.writeVarint64(t.lo, t.hi);
	}
	sint64(e) {
		let t = Eo.enc(e), n = t.hi >> 31, r = t.lo << 1 ^ n, i = (t.hi << 1 | t.lo >>> 31) ^ n;
		return this.writeVarint64(r, i);
	}
	uint64(e) {
		let t = Eo.uEnc(e);
		return this.writeVarint64(t.lo, t.hi);
	}
	writeVarint64(e, t) {
		this.ensureCapacity(10);
		let n = this.buffer, r = this.pos;
		for (let i = 0; i < 28; i += 7) {
			let a = e >>> i, o = !(!(a >>> 7) && t == 0);
			if (n[r++] = (o ? a | 128 : a) & 255, !o) return this.pos = r, this;
		}
		let i = e >>> 28 & 15 | (t & 7) << 4, a = !!(t >> 3);
		if (n[r++] = (a ? i | 128 : i) & 255, !a) return this.pos = r, this;
		for (let e = 3; e < 31; e += 7) {
			let i = t >>> e, a = !!(i >>> 7);
			if (n[r++] = (a ? i | 128 : i) & 255, !a) return this.pos = r, this;
		}
		return n[r++] = t >>> 31 & 1, this.pos = r, this;
	}
}, Fo = 128, Io = 1, Lo = /* @__PURE__ */ new Uint8Array(), Ro = new DataView(Lo.buffer), zo = 32;
function Bo(e) {
	return e < 128 ? 1 : e < 16384 ? 2 : e < 2097152 ? 3 : e < 268435456 ? 4 : 5;
}
var I = class {
	constructor(e, t = Mo().decodeUtf8) {
		this.decodeUtf8 = t, this.varint64Lo = 0, this.varint64Hi = 0, this.varint64 = go, this.uint32 = To, this.buf = e, this.len = e.length, this.pos = 0, this.view = new DataView(e.buffer, e.byteOffset, e.byteLength);
	}
	tag() {
		let e = this.pos, t = this.uint32(), n = this.pos - e;
		if (n > 5 || n == 5 && this.buf[this.pos - 1] > 15) throw Error("illegal tag: varint overflows uint32");
		let r = t >>> 3, i = t & 7;
		if (r <= 0 || i > 5) throw Error("illegal tag: field no " + r + " wire type " + i);
		return [r, i];
	}
	skip(e, t, n = 100) {
		let r = this.pos;
		switch (e) {
			case Po.Varint:
				for (; this.buf[this.pos++] & 128;);
				break;
			case Po.Bit64: this.pos += 4;
			case Po.Bit32:
				this.pos += 4;
				break;
			case Po.LengthDelimited:
				let r = this.uint32();
				this.pos += r;
				break;
			case Po.StartGroup:
				if (n <= 0) throw Error("maximum recursion depth reached");
				for (;;) {
					let [e, r] = this.tag();
					if (r === Po.EndGroup) {
						if (t !== void 0 && e !== t) throw Error("invalid end group tag");
						break;
					}
					this.skip(r, e, n - 1);
				}
				break;
			default: throw Error("cant skip wire type " + e);
		}
		return this.assertBounds(), this.buf.subarray(r, this.pos);
	}
	assertBounds() {
		if (this.pos > this.len) throw RangeError("premature EOF");
	}
	int32() {
		return this.uint32() | 0;
	}
	sint32() {
		let e = this.uint32();
		return e >>> 1 ^ -(e & 1);
	}
	int64() {
		return this.varint64(), Eo.dec(this.varint64Lo, this.varint64Hi);
	}
	uint64() {
		return this.varint64(), Eo.uDec(this.varint64Lo, this.varint64Hi);
	}
	sint64() {
		this.varint64();
		let e = this.varint64Lo, t = this.varint64Hi, n = -(e & 1);
		return e = (e >>> 1 | (t & 1) << 31) ^ n, t = t >>> 1 ^ n, Eo.dec(e, t);
	}
	bool() {
		let e = this.buf[this.pos];
		return e < 128 ? (this.pos++, e !== 0) : (this.varint64(), this.varint64Lo !== 0 || this.varint64Hi !== 0);
	}
	fixed32() {
		return this.view.getUint32((this.pos += 4) - 4, !0);
	}
	sfixed32() {
		return this.view.getInt32((this.pos += 4) - 4, !0);
	}
	fixed64() {
		return Eo.uDec(this.sfixed32(), this.sfixed32());
	}
	sfixed64() {
		return Eo.dec(this.sfixed32(), this.sfixed32());
	}
	float() {
		return this.view.getFloat32((this.pos += 4) - 4, !0);
	}
	double() {
		return this.view.getFloat64((this.pos += 8) - 8, !0);
	}
	bytes() {
		let e = this.uint32(), t = this.pos;
		return this.pos += e, this.assertBounds(), this.buf.subarray(t, t + e);
	}
	string(e) {
		let t = this.uint32(), n = this.pos;
		this.pos += t, this.assertBounds();
		let r = this.buf;
		if (t <= zo) {
			let i = Array(t);
			for (let a = 0; a < t; a++) {
				let t = r[n + a];
				if (t > 127) return this.decodeUtf8(r.subarray(n, this.pos), e);
				i[a] = t;
			}
			return String.fromCharCode.apply(String, i);
		}
		return this.decodeUtf8(r.subarray(n, this.pos), e);
	}
};
function Vo(e) {
	if (typeof e == "string") e = Number(e);
	else if (typeof e != "number") throw Error("invalid int32: " + typeof e);
	if (!Number.isInteger(e) || e > 2147483647 || e < -2147483648) throw Error("invalid int32: " + e);
}
function Ho(e) {
	if (typeof e == "string") e = Number(e);
	else if (typeof e != "number") throw Error("invalid uint32: " + typeof e);
	if (!Number.isInteger(e) || e > 4294967295 || e < 0) throw Error("invalid uint32: " + e);
}
function Uo(e) {
	if (typeof e == "string") {
		let t = e;
		if (e = Number(e), Number.isNaN(e) && t !== "NaN") throw Error("invalid float32: " + t);
	} else if (typeof e != "number") throw Error("invalid float32: " + typeof e);
	if (!Number.isFinite(Math.fround(e)) && Number.isFinite(e)) throw Error("invalid float32: " + e);
}
// node_modules/.pnpm/@ag-ui+proto@1.0.2/node_modules/@ag-ui/proto/dist/index.mjs
var Wo = /* @__PURE__ */ function(e) {
	return e[e.NULL_VALUE = 0] = "NULL_VALUE", e[e.UNRECOGNIZED = -1] = "UNRECOGNIZED", e;
}({});
function Go() {
	return { fields: {} };
}
var L = {
	encode(e, t = new F()) {
		return Object.entries(e.fields).forEach(([e, n]) => {
			n !== void 0 && qo.encode({
				key: e,
				value: n
			}, t.uint32(10).fork()).join();
		}), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = Go();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1: {
					if (e !== 10) break;
					let t = qo.decode(n, n.uint32());
					t.value !== void 0 && (i.fields[t.key] = t.value);
					continue;
				}
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return L.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Go();
		return t.fields = Object.entries(e.fields ?? {}).reduce((e, [t, n]) => (n !== void 0 && (e[t] = n), e), {}), t;
	},
	wrap(e) {
		let t = Go();
		if (e !== void 0) for (let n of Object.keys(e)) t.fields[n] = e[n];
		return t;
	},
	unwrap(e) {
		let t = {};
		if (e.fields) for (let n of Object.keys(e.fields)) t[n] = e.fields[n];
		return t;
	}
};
function Ko() {
	return {
		key: "",
		value: void 0
	};
}
var qo = {
	encode(e, t = new F()) {
		return e.key !== "" && t.uint32(10).string(e.key), e.value !== void 0 && R.encode(R.wrap(e.value), t.uint32(18).fork()).join(), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = Ko();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.key = n.string();
					continue;
				case 2:
					if (e !== 18) break;
					i.value = R.unwrap(R.decode(n, n.uint32()));
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return qo.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Ko();
		return t.key = e.key ?? "", t.value = e.value ?? void 0, t;
	}
};
function Jo() {
	return {
		nullValue: void 0,
		numberValue: void 0,
		stringValue: void 0,
		boolValue: void 0,
		structValue: void 0,
		listValue: void 0
	};
}
var R = {
	encode(e, t = new F()) {
		return e.nullValue !== void 0 && t.uint32(8).int32(e.nullValue), e.numberValue !== void 0 && t.uint32(17).double(e.numberValue), e.stringValue !== void 0 && t.uint32(26).string(e.stringValue), e.boolValue !== void 0 && t.uint32(32).bool(e.boolValue), e.structValue !== void 0 && L.encode(L.wrap(e.structValue), t.uint32(42).fork()).join(), e.listValue !== void 0 && Xo.encode(Xo.wrap(e.listValue), t.uint32(50).fork()).join(), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = Jo();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 8) break;
					i.nullValue = n.int32();
					continue;
				case 2:
					if (e !== 17) break;
					i.numberValue = n.double();
					continue;
				case 3:
					if (e !== 26) break;
					i.stringValue = n.string();
					continue;
				case 4:
					if (e !== 32) break;
					i.boolValue = n.bool();
					continue;
				case 5:
					if (e !== 42) break;
					i.structValue = L.unwrap(L.decode(n, n.uint32()));
					continue;
				case 6:
					if (e !== 50) break;
					i.listValue = Xo.unwrap(Xo.decode(n, n.uint32()));
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return R.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Jo();
		return t.nullValue = e.nullValue ?? void 0, t.numberValue = e.numberValue ?? void 0, t.stringValue = e.stringValue ?? void 0, t.boolValue = e.boolValue ?? void 0, t.structValue = e.structValue ?? void 0, t.listValue = e.listValue ?? void 0, t;
	},
	wrap(e) {
		let t = Jo();
		if (e === null) t.nullValue = Wo.NULL_VALUE;
		else if (typeof e == "boolean") t.boolValue = e;
		else if (typeof e == "number") t.numberValue = e;
		else if (typeof e == "string") t.stringValue = e;
		else if (globalThis.Array.isArray(e)) t.listValue = e;
		else if (typeof e == "object") t.structValue = e;
		else if (e !== void 0) throw new globalThis.Error("Unsupported any value type: " + typeof e);
		return t;
	},
	unwrap(e) {
		if (e.stringValue !== void 0) return e.stringValue;
		if (e?.numberValue !== void 0) return e.numberValue;
		if (e?.boolValue !== void 0) return e.boolValue;
		if (e?.structValue !== void 0) return e.structValue;
		if (e?.listValue !== void 0) return e.listValue;
		if (e?.nullValue !== void 0) return null;
	}
};
function Yo() {
	return { values: [] };
}
var Xo = {
	encode(e, t = new F()) {
		for (let n of e.values) R.encode(R.wrap(n), t.uint32(10).fork()).join();
		return t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = Yo();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.values.push(R.unwrap(R.decode(n, n.uint32())));
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return Xo.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Yo();
		return t.values = e.values?.map((e) => e) || [], t;
	},
	wrap(e) {
		let t = Yo();
		return t.values = e ?? [], t;
	},
	unwrap(e) {
		return e?.hasOwnProperty("values") && globalThis.Array.isArray(e.values) ? e.values : e;
	}
}, Zo = /* @__PURE__ */ function(e) {
	return e[e.ADD = 0] = "ADD", e[e.REMOVE = 1] = "REMOVE", e[e.REPLACE = 2] = "REPLACE", e[e.MOVE = 3] = "MOVE", e[e.COPY = 4] = "COPY", e[e.TEST = 5] = "TEST", e[e.UNRECOGNIZED = -1] = "UNRECOGNIZED", e;
}({});
function Qo() {
	return {
		op: 0,
		path: "",
		from: void 0,
		value: void 0
	};
}
var $o = {
	encode(e, t = new F()) {
		return e.op !== 0 && t.uint32(8).int32(e.op), e.path !== "" && t.uint32(18).string(e.path), e.from !== void 0 && t.uint32(26).string(e.from), e.value !== void 0 && R.encode(R.wrap(e.value), t.uint32(34).fork()).join(), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = Qo();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 8) break;
					i.op = n.int32();
					continue;
				case 2:
					if (e !== 18) break;
					i.path = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.from = n.string();
					continue;
				case 4:
					if (e !== 34) break;
					i.value = R.unwrap(R.decode(n, n.uint32()));
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return $o.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Qo();
		return t.op = e.op ?? 0, t.path = e.path ?? "", t.from = e.from ?? void 0, t.value = e.value ?? void 0, t;
	}
};
function es() {
	return {
		text: "",
		id: void 0,
		metadata: void 0
	};
}
var ts = {
	encode(e, t = new F()) {
		return e.text !== "" && t.uint32(10).string(e.text), e.id !== void 0 && t.uint32(18).string(e.id), e.metadata !== void 0 && R.encode(R.wrap(e.metadata), t.uint32(26).fork()).join(), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = es();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.text = n.string();
					continue;
				case 2:
					if (e !== 18) break;
					i.id = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.metadata = R.unwrap(R.decode(n, n.uint32()));
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return ts.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = es();
		return t.text = e.text ?? "", t.id = e.id ?? void 0, t.metadata = e.metadata ?? void 0, t;
	}
};
function ns() {
	return {
		source: void 0,
		metadata: void 0,
		id: void 0
	};
}
var rs = {
	encode(e, t = new F()) {
		return e.source !== void 0 && ds.encode(e.source, t.uint32(10).fork()).join(), e.metadata !== void 0 && R.encode(R.wrap(e.metadata), t.uint32(18).fork()).join(), e.id !== void 0 && t.uint32(26).string(e.id), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = ns();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.source = ds.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.metadata = R.unwrap(R.decode(n, n.uint32()));
					continue;
				case 3:
					if (e !== 26) break;
					i.id = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return rs.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = ns();
		return t.source = e.source !== void 0 && e.source !== null ? ds.fromPartial(e.source) : void 0, t.metadata = e.metadata ?? void 0, t.id = e.id ?? void 0, t;
	}
};
function is() {
	return {
		value: "",
		mimeType: ""
	};
}
var as = {
	encode(e, t = new F()) {
		return e.value !== "" && t.uint32(10).string(e.value), e.mimeType !== "" && t.uint32(18).string(e.mimeType), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = is();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.value = n.string();
					continue;
				case 2:
					if (e !== 18) break;
					i.mimeType = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return as.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = is();
		return t.value = e.value ?? "", t.mimeType = e.mimeType ?? "", t;
	}
};
function os() {
	return {
		value: "",
		mimeType: void 0
	};
}
var ss = {
	encode(e, t = new F()) {
		return e.value !== "" && t.uint32(10).string(e.value), e.mimeType !== void 0 && t.uint32(18).string(e.mimeType), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = os();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.value = n.string();
					continue;
				case 2:
					if (e !== 18) break;
					i.mimeType = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return ss.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = os();
		return t.value = e.value ?? "", t.mimeType = e.mimeType ?? void 0, t;
	}
};
function cs() {
	return {
		value: "",
		provider: void 0,
		mimeType: void 0
	};
}
var ls = {
	encode(e, t = new F()) {
		return e.value !== "" && t.uint32(10).string(e.value), e.provider !== void 0 && t.uint32(18).string(e.provider), e.mimeType !== void 0 && t.uint32(26).string(e.mimeType), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = cs();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.value = n.string();
					continue;
				case 2:
					if (e !== 18) break;
					i.provider = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.mimeType = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return ls.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = cs();
		return t.value = e.value ?? "", t.provider = e.provider ?? void 0, t.mimeType = e.mimeType ?? void 0, t;
	}
};
function us() {
	return {
		data: void 0,
		url: void 0,
		file: void 0
	};
}
var ds = {
	encode(e, t = new F()) {
		return e.data !== void 0 && as.encode(e.data, t.uint32(10).fork()).join(), e.url !== void 0 && ss.encode(e.url, t.uint32(18).fork()).join(), e.file !== void 0 && ls.encode(e.file, t.uint32(26).fork()).join(), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = us();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.data = as.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.url = ss.decode(n, n.uint32());
					continue;
				case 3:
					if (e !== 26) break;
					i.file = ls.decode(n, n.uint32());
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return ds.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = us();
		return t.data = e.data !== void 0 && e.data !== null ? as.fromPartial(e.data) : void 0, t.url = e.url !== void 0 && e.url !== null ? ss.fromPartial(e.url) : void 0, t.file = e.file !== void 0 && e.file !== null ? ls.fromPartial(e.file) : void 0, t;
	}
};
function fs() {
	return {
		source: void 0,
		metadata: void 0,
		id: void 0
	};
}
var ps = {
	encode(e, t = new F()) {
		return e.source !== void 0 && ds.encode(e.source, t.uint32(10).fork()).join(), e.metadata !== void 0 && R.encode(R.wrap(e.metadata), t.uint32(18).fork()).join(), e.id !== void 0 && t.uint32(26).string(e.id), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = fs();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.source = ds.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.metadata = R.unwrap(R.decode(n, n.uint32()));
					continue;
				case 3:
					if (e !== 26) break;
					i.id = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return ps.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = fs();
		return t.source = e.source !== void 0 && e.source !== null ? ds.fromPartial(e.source) : void 0, t.metadata = e.metadata ?? void 0, t.id = e.id ?? void 0, t;
	}
};
function ms() {
	return {
		source: void 0,
		metadata: void 0,
		id: void 0
	};
}
var hs = {
	encode(e, t = new F()) {
		return e.source !== void 0 && ds.encode(e.source, t.uint32(10).fork()).join(), e.metadata !== void 0 && R.encode(R.wrap(e.metadata), t.uint32(18).fork()).join(), e.id !== void 0 && t.uint32(26).string(e.id), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = ms();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.source = ds.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.metadata = R.unwrap(R.decode(n, n.uint32()));
					continue;
				case 3:
					if (e !== 26) break;
					i.id = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return hs.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = ms();
		return t.source = e.source !== void 0 && e.source !== null ? ds.fromPartial(e.source) : void 0, t.metadata = e.metadata ?? void 0, t.id = e.id ?? void 0, t;
	}
};
function gs() {
	return {
		source: void 0,
		metadata: void 0,
		id: void 0
	};
}
var _s = {
	encode(e, t = new F()) {
		return e.source !== void 0 && ds.encode(e.source, t.uint32(10).fork()).join(), e.metadata !== void 0 && R.encode(R.wrap(e.metadata), t.uint32(18).fork()).join(), e.id !== void 0 && t.uint32(26).string(e.id), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = gs();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.source = ds.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.metadata = R.unwrap(R.decode(n, n.uint32()));
					continue;
				case 3:
					if (e !== 26) break;
					i.id = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return _s.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = gs();
		return t.source = e.source !== void 0 && e.source !== null ? ds.fromPartial(e.source) : void 0, t.metadata = e.metadata ?? void 0, t.id = e.id ?? void 0, t;
	}
};
function vs() {
	return {
		text: void 0,
		image: void 0,
		audio: void 0,
		video: void 0,
		document: void 0
	};
}
var ys = {
	encode(e, t = new F()) {
		return e.text !== void 0 && ts.encode(e.text, t.uint32(10).fork()).join(), e.image !== void 0 && rs.encode(e.image, t.uint32(18).fork()).join(), e.audio !== void 0 && ps.encode(e.audio, t.uint32(26).fork()).join(), e.video !== void 0 && hs.encode(e.video, t.uint32(34).fork()).join(), e.document !== void 0 && _s.encode(e.document, t.uint32(42).fork()).join(), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = vs();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.text = ts.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.image = rs.decode(n, n.uint32());
					continue;
				case 3:
					if (e !== 26) break;
					i.audio = ps.decode(n, n.uint32());
					continue;
				case 4:
					if (e !== 34) break;
					i.video = hs.decode(n, n.uint32());
					continue;
				case 5:
					if (e !== 42) break;
					i.document = _s.decode(n, n.uint32());
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return ys.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = vs();
		return t.text = e.text !== void 0 && e.text !== null ? ts.fromPartial(e.text) : void 0, t.image = e.image !== void 0 && e.image !== null ? rs.fromPartial(e.image) : void 0, t.audio = e.audio !== void 0 && e.audio !== null ? ps.fromPartial(e.audio) : void 0, t.video = e.video !== void 0 && e.video !== null ? hs.fromPartial(e.video) : void 0, t.document = e.document !== void 0 && e.document !== null ? _s.fromPartial(e.document) : void 0, t;
	}
};
function bs() {
	return {
		id: "",
		type: "",
		function: void 0,
		metadata: void 0,
		encryptedValue: void 0
	};
}
var xs = {
	encode(e, t = new F()) {
		return e.id !== "" && t.uint32(10).string(e.id), e.type !== "" && t.uint32(18).string(e.type), e.function !== void 0 && Cs.encode(e.function, t.uint32(26).fork()).join(), e.metadata !== void 0 && L.encode(L.wrap(e.metadata), t.uint32(34).fork()).join(), e.encryptedValue !== void 0 && t.uint32(42).string(e.encryptedValue), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = bs();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.id = n.string();
					continue;
				case 2:
					if (e !== 18) break;
					i.type = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.function = Cs.decode(n, n.uint32());
					continue;
				case 4:
					if (e !== 34) break;
					i.metadata = L.unwrap(L.decode(n, n.uint32()));
					continue;
				case 5:
					if (e !== 42) break;
					i.encryptedValue = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return xs.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = bs();
		return t.id = e.id ?? "", t.type = e.type ?? "", t.function = e.function !== void 0 && e.function !== null ? Cs.fromPartial(e.function) : void 0, t.metadata = e.metadata ?? void 0, t.encryptedValue = e.encryptedValue ?? void 0, t;
	}
};
function Ss() {
	return {
		name: "",
		arguments: ""
	};
}
var Cs = {
	encode(e, t = new F()) {
		return e.name !== "" && t.uint32(10).string(e.name), e.arguments !== "" && t.uint32(18).string(e.arguments), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = Ss();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.name = n.string();
					continue;
				case 2:
					if (e !== 18) break;
					i.arguments = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return Cs.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Ss();
		return t.name = e.name ?? "", t.arguments = e.arguments ?? "", t;
	}
};
function ws() {
	return {
		id: "",
		role: "",
		content: void 0,
		name: void 0,
		toolCalls: [],
		toolCallId: void 0,
		error: void 0,
		contentParts: [],
		metadata: void 0,
		subagentRunId: void 0,
		encryptedValue: void 0,
		activityType: void 0,
		activityContent: void 0
	};
}
var Ts = {
	encode(e, t = new F()) {
		e.id !== "" && t.uint32(10).string(e.id), e.role !== "" && t.uint32(18).string(e.role), e.content !== void 0 && t.uint32(26).string(e.content), e.name !== void 0 && t.uint32(34).string(e.name);
		for (let n of e.toolCalls) xs.encode(n, t.uint32(42).fork()).join();
		e.toolCallId !== void 0 && t.uint32(50).string(e.toolCallId), e.error !== void 0 && t.uint32(58).string(e.error);
		for (let n of e.contentParts) ys.encode(n, t.uint32(66).fork()).join();
		return e.metadata !== void 0 && L.encode(L.wrap(e.metadata), t.uint32(74).fork()).join(), e.subagentRunId !== void 0 && t.uint32(82).string(e.subagentRunId), e.encryptedValue !== void 0 && t.uint32(90).string(e.encryptedValue), e.activityType !== void 0 && t.uint32(98).string(e.activityType), e.activityContent !== void 0 && L.encode(L.wrap(e.activityContent), t.uint32(106).fork()).join(), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = ws();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.id = n.string();
					continue;
				case 2:
					if (e !== 18) break;
					i.role = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.content = n.string();
					continue;
				case 4:
					if (e !== 34) break;
					i.name = n.string();
					continue;
				case 5:
					if (e !== 42) break;
					i.toolCalls.push(xs.decode(n, n.uint32()));
					continue;
				case 6:
					if (e !== 50) break;
					i.toolCallId = n.string();
					continue;
				case 7:
					if (e !== 58) break;
					i.error = n.string();
					continue;
				case 8:
					if (e !== 66) break;
					i.contentParts.push(ys.decode(n, n.uint32()));
					continue;
				case 9:
					if (e !== 74) break;
					i.metadata = L.unwrap(L.decode(n, n.uint32()));
					continue;
				case 10:
					if (e !== 82) break;
					i.subagentRunId = n.string();
					continue;
				case 11:
					if (e !== 90) break;
					i.encryptedValue = n.string();
					continue;
				case 12:
					if (e !== 98) break;
					i.activityType = n.string();
					continue;
				case 13:
					if (e !== 106) break;
					i.activityContent = L.unwrap(L.decode(n, n.uint32()));
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return Ts.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = ws();
		return t.id = e.id ?? "", t.role = e.role ?? "", t.content = e.content ?? void 0, t.name = e.name ?? void 0, t.toolCalls = e.toolCalls?.map((e) => xs.fromPartial(e)) || [], t.toolCallId = e.toolCallId ?? void 0, t.error = e.error ?? void 0, t.contentParts = e.contentParts?.map((e) => ys.fromPartial(e)) || [], t.metadata = e.metadata ?? void 0, t.subagentRunId = e.subagentRunId ?? void 0, t.encryptedValue = e.encryptedValue ?? void 0, t.activityType = e.activityType ?? void 0, t.activityContent = e.activityContent ?? void 0, t;
	}
};
function Es() {
	return {
		name: "",
		description: "",
		parameters: void 0,
		metadata: void 0
	};
}
var Ds = {
	encode(e, t = new F()) {
		return e.name !== "" && t.uint32(10).string(e.name), e.description !== "" && t.uint32(18).string(e.description), e.parameters !== void 0 && R.encode(R.wrap(e.parameters), t.uint32(26).fork()).join(), e.metadata !== void 0 && L.encode(L.wrap(e.metadata), t.uint32(34).fork()).join(), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = Es();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.name = n.string();
					continue;
				case 2:
					if (e !== 18) break;
					i.description = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.parameters = R.unwrap(R.decode(n, n.uint32()));
					continue;
				case 4:
					if (e !== 34) break;
					i.metadata = L.unwrap(L.decode(n, n.uint32()));
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return Ds.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Es();
		return t.name = e.name ?? "", t.description = e.description ?? "", t.parameters = e.parameters ?? void 0, t.metadata = e.metadata ?? void 0, t;
	}
};
function Os() {
	return {
		description: "",
		value: ""
	};
}
var ks = {
	encode(e, t = new F()) {
		return e.description !== "" && t.uint32(10).string(e.description), e.value !== "" && t.uint32(18).string(e.value), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = Os();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.description = n.string();
					continue;
				case 2:
					if (e !== 18) break;
					i.value = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return ks.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Os();
		return t.description = e.description ?? "", t.value = e.value ?? "", t;
	}
};
function As() {
	return {
		interruptId: "",
		status: "",
		payload: void 0,
		metadata: void 0
	};
}
var js = {
	encode(e, t = new F()) {
		return e.interruptId !== "" && t.uint32(10).string(e.interruptId), e.status !== "" && t.uint32(18).string(e.status), e.payload !== void 0 && R.encode(R.wrap(e.payload), t.uint32(26).fork()).join(), e.metadata !== void 0 && L.encode(L.wrap(e.metadata), t.uint32(34).fork()).join(), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = As();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.interruptId = n.string();
					continue;
				case 2:
					if (e !== 18) break;
					i.status = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.payload = R.unwrap(R.decode(n, n.uint32()));
					continue;
				case 4:
					if (e !== 34) break;
					i.metadata = L.unwrap(L.decode(n, n.uint32()));
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return js.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = As();
		return t.interruptId = e.interruptId ?? "", t.status = e.status ?? "", t.payload = e.payload ?? void 0, t.metadata = e.metadata ?? void 0, t;
	}
};
function Ms() {
	return {
		threadId: "",
		runId: "",
		parentRunId: void 0,
		state: void 0,
		messages: [],
		tools: [],
		context: [],
		forwardedProps: void 0,
		resume: [],
		protocolVersion: void 0
	};
}
var Ns = {
	encode(e, t = new F()) {
		e.threadId !== "" && t.uint32(10).string(e.threadId), e.runId !== "" && t.uint32(18).string(e.runId), e.parentRunId !== void 0 && t.uint32(26).string(e.parentRunId), e.state !== void 0 && R.encode(R.wrap(e.state), t.uint32(34).fork()).join();
		for (let n of e.messages) Ts.encode(n, t.uint32(42).fork()).join();
		for (let n of e.tools) Ds.encode(n, t.uint32(50).fork()).join();
		for (let n of e.context) ks.encode(n, t.uint32(58).fork()).join();
		e.forwardedProps !== void 0 && R.encode(R.wrap(e.forwardedProps), t.uint32(66).fork()).join();
		for (let n of e.resume) js.encode(n, t.uint32(74).fork()).join();
		return e.protocolVersion !== void 0 && t.uint32(82).string(e.protocolVersion), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = Ms();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.threadId = n.string();
					continue;
				case 2:
					if (e !== 18) break;
					i.runId = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.parentRunId = n.string();
					continue;
				case 4:
					if (e !== 34) break;
					i.state = R.unwrap(R.decode(n, n.uint32()));
					continue;
				case 5:
					if (e !== 42) break;
					i.messages.push(Ts.decode(n, n.uint32()));
					continue;
				case 6:
					if (e !== 50) break;
					i.tools.push(Ds.decode(n, n.uint32()));
					continue;
				case 7:
					if (e !== 58) break;
					i.context.push(ks.decode(n, n.uint32()));
					continue;
				case 8:
					if (e !== 66) break;
					i.forwardedProps = R.unwrap(R.decode(n, n.uint32()));
					continue;
				case 9:
					if (e !== 74) break;
					i.resume.push(js.decode(n, n.uint32()));
					continue;
				case 10:
					if (e !== 82) break;
					i.protocolVersion = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return Ns.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Ms();
		return t.threadId = e.threadId ?? "", t.runId = e.runId ?? "", t.parentRunId = e.parentRunId ?? void 0, t.state = e.state ?? void 0, t.messages = e.messages?.map((e) => Ts.fromPartial(e)) || [], t.tools = e.tools?.map((e) => Ds.fromPartial(e)) || [], t.context = e.context?.map((e) => ks.fromPartial(e)) || [], t.forwardedProps = e.forwardedProps ?? void 0, t.resume = e.resume?.map((e) => js.fromPartial(e)) || [], t.protocolVersion = e.protocolVersion ?? void 0, t;
	}
};
function Ps() {
	return {
		id: "",
		reason: "",
		message: void 0,
		toolCallId: void 0,
		responseSchema: void 0,
		expiresAt: void 0,
		metadata: void 0,
		subagentRunId: void 0
	};
}
var Fs = {
	encode(e, t = new F()) {
		return e.id !== "" && t.uint32(10).string(e.id), e.reason !== "" && t.uint32(18).string(e.reason), e.message !== void 0 && t.uint32(26).string(e.message), e.toolCallId !== void 0 && t.uint32(34).string(e.toolCallId), e.responseSchema !== void 0 && R.encode(R.wrap(e.responseSchema), t.uint32(42).fork()).join(), e.expiresAt !== void 0 && t.uint32(50).string(e.expiresAt), e.metadata !== void 0 && R.encode(R.wrap(e.metadata), t.uint32(58).fork()).join(), e.subagentRunId !== void 0 && t.uint32(66).string(e.subagentRunId), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = Ps();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.id = n.string();
					continue;
				case 2:
					if (e !== 18) break;
					i.reason = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.message = n.string();
					continue;
				case 4:
					if (e !== 34) break;
					i.toolCallId = n.string();
					continue;
				case 5:
					if (e !== 42) break;
					i.responseSchema = R.unwrap(R.decode(n, n.uint32()));
					continue;
				case 6:
					if (e !== 50) break;
					i.expiresAt = n.string();
					continue;
				case 7:
					if (e !== 58) break;
					i.metadata = R.unwrap(R.decode(n, n.uint32()));
					continue;
				case 8:
					if (e !== 66) break;
					i.subagentRunId = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return Fs.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Ps();
		return t.id = e.id ?? "", t.reason = e.reason ?? "", t.message = e.message ?? void 0, t.toolCallId = e.toolCallId ?? void 0, t.responseSchema = e.responseSchema ?? void 0, t.expiresAt = e.expiresAt ?? void 0, t.metadata = e.metadata ?? void 0, t.subagentRunId = e.subagentRunId ?? void 0, t;
	}
}, Is = /* @__PURE__ */ function(e) {
	return e[e.TEXT_MESSAGE_START = 0] = "TEXT_MESSAGE_START", e[e.TEXT_MESSAGE_CONTENT = 1] = "TEXT_MESSAGE_CONTENT", e[e.TEXT_MESSAGE_END = 2] = "TEXT_MESSAGE_END", e[e.TOOL_CALL_START = 3] = "TOOL_CALL_START", e[e.TOOL_CALL_ARGS = 4] = "TOOL_CALL_ARGS", e[e.TOOL_CALL_END = 5] = "TOOL_CALL_END", e[e.STATE_SNAPSHOT = 6] = "STATE_SNAPSHOT", e[e.STATE_DELTA = 7] = "STATE_DELTA", e[e.MESSAGES_SNAPSHOT = 8] = "MESSAGES_SNAPSHOT", e[e.RAW = 9] = "RAW", e[e.CUSTOM = 10] = "CUSTOM", e[e.RUN_STARTED = 11] = "RUN_STARTED", e[e.RUN_FINISHED = 12] = "RUN_FINISHED", e[e.RUN_ERROR = 13] = "RUN_ERROR", e[e.STEP_STARTED = 14] = "STEP_STARTED", e[e.STEP_FINISHED = 15] = "STEP_FINISHED", e[e.SUBAGENT_STARTED = 16] = "SUBAGENT_STARTED", e[e.SUBAGENT_FINISHED = 17] = "SUBAGENT_FINISHED", e[e.SUBAGENT_ERROR = 18] = "SUBAGENT_ERROR", e[e.TEXT_MESSAGE_CHUNK = 19] = "TEXT_MESSAGE_CHUNK", e[e.TOOL_CALL_CHUNK = 20] = "TOOL_CALL_CHUNK", e[e.TOOL_CALL_RESULT = 21] = "TOOL_CALL_RESULT", e[e.ACTIVITY_SNAPSHOT = 22] = "ACTIVITY_SNAPSHOT", e[e.ACTIVITY_DELTA = 23] = "ACTIVITY_DELTA", e[e.REASONING_START = 24] = "REASONING_START", e[e.REASONING_MESSAGE_START = 25] = "REASONING_MESSAGE_START", e[e.REASONING_MESSAGE_CONTENT = 26] = "REASONING_MESSAGE_CONTENT", e[e.REASONING_MESSAGE_END = 27] = "REASONING_MESSAGE_END", e[e.REASONING_MESSAGE_CHUNK = 28] = "REASONING_MESSAGE_CHUNK", e[e.REASONING_END = 29] = "REASONING_END", e[e.REASONING_ENCRYPTED_VALUE = 30] = "REASONING_ENCRYPTED_VALUE", e[e.UNRECOGNIZED = -1] = "UNRECOGNIZED", e;
}({});
function Ls() {
	return {
		type: 0,
		timestamp: void 0,
		rawEvent: void 0,
		metadata: void 0
	};
}
var z = {
	encode(e, t = new F()) {
		return e.type !== 0 && t.uint32(8).int32(e.type), e.timestamp !== void 0 && t.uint32(16).int64(e.timestamp), e.rawEvent !== void 0 && R.encode(R.wrap(e.rawEvent), t.uint32(26).fork()).join(), e.metadata !== void 0 && L.encode(L.wrap(e.metadata), t.uint32(34).fork()).join(), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = Ls();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 8) break;
					i.type = n.int32();
					continue;
				case 2:
					if (e !== 16) break;
					i.timestamp = Xc(n.int64());
					continue;
				case 3:
					if (e !== 26) break;
					i.rawEvent = R.unwrap(R.decode(n, n.uint32()));
					continue;
				case 4:
					if (e !== 34) break;
					i.metadata = L.unwrap(L.decode(n, n.uint32()));
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return z.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Ls();
		return t.type = e.type ?? 0, t.timestamp = e.timestamp ?? void 0, t.rawEvent = e.rawEvent ?? void 0, t.metadata = e.metadata ?? void 0, t;
	}
};
function Rs() {
	return {
		baseEvent: void 0,
		messageId: "",
		role: void 0,
		name: void 0,
		subagentRunId: void 0
	};
}
var zs = {
	encode(e, t = new F()) {
		return e.baseEvent !== void 0 && z.encode(e.baseEvent, t.uint32(10).fork()).join(), e.messageId !== "" && t.uint32(18).string(e.messageId), e.role !== void 0 && t.uint32(26).string(e.role), e.name !== void 0 && t.uint32(34).string(e.name), e.subagentRunId !== void 0 && t.uint32(42).string(e.subagentRunId), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = Rs();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = z.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.messageId = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.role = n.string();
					continue;
				case 4:
					if (e !== 34) break;
					i.name = n.string();
					continue;
				case 5:
					if (e !== 42) break;
					i.subagentRunId = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return zs.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Rs();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? z.fromPartial(e.baseEvent) : void 0, t.messageId = e.messageId ?? "", t.role = e.role ?? void 0, t.name = e.name ?? void 0, t.subagentRunId = e.subagentRunId ?? void 0, t;
	}
};
function Bs() {
	return {
		baseEvent: void 0,
		messageId: "",
		delta: "",
		subagentRunId: void 0
	};
}
var Vs = {
	encode(e, t = new F()) {
		return e.baseEvent !== void 0 && z.encode(e.baseEvent, t.uint32(10).fork()).join(), e.messageId !== "" && t.uint32(18).string(e.messageId), e.delta !== "" && t.uint32(26).string(e.delta), e.subagentRunId !== void 0 && t.uint32(34).string(e.subagentRunId), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = Bs();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = z.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.messageId = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.delta = n.string();
					continue;
				case 4:
					if (e !== 34) break;
					i.subagentRunId = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return Vs.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Bs();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? z.fromPartial(e.baseEvent) : void 0, t.messageId = e.messageId ?? "", t.delta = e.delta ?? "", t.subagentRunId = e.subagentRunId ?? void 0, t;
	}
};
function Hs() {
	return {
		baseEvent: void 0,
		messageId: "",
		subagentRunId: void 0
	};
}
var Us = {
	encode(e, t = new F()) {
		return e.baseEvent !== void 0 && z.encode(e.baseEvent, t.uint32(10).fork()).join(), e.messageId !== "" && t.uint32(18).string(e.messageId), e.subagentRunId !== void 0 && t.uint32(26).string(e.subagentRunId), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = Hs();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = z.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.messageId = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.subagentRunId = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return Us.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Hs();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? z.fromPartial(e.baseEvent) : void 0, t.messageId = e.messageId ?? "", t.subagentRunId = e.subagentRunId ?? void 0, t;
	}
};
function Ws() {
	return {
		baseEvent: void 0,
		messageId: void 0,
		role: void 0,
		delta: void 0,
		name: void 0,
		subagentRunId: void 0
	};
}
var Gs = {
	encode(e, t = new F()) {
		return e.baseEvent !== void 0 && z.encode(e.baseEvent, t.uint32(10).fork()).join(), e.messageId !== void 0 && t.uint32(18).string(e.messageId), e.role !== void 0 && t.uint32(26).string(e.role), e.delta !== void 0 && t.uint32(34).string(e.delta), e.name !== void 0 && t.uint32(42).string(e.name), e.subagentRunId !== void 0 && t.uint32(50).string(e.subagentRunId), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = Ws();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = z.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.messageId = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.role = n.string();
					continue;
				case 4:
					if (e !== 34) break;
					i.delta = n.string();
					continue;
				case 5:
					if (e !== 42) break;
					i.name = n.string();
					continue;
				case 6:
					if (e !== 50) break;
					i.subagentRunId = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return Gs.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Ws();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? z.fromPartial(e.baseEvent) : void 0, t.messageId = e.messageId ?? void 0, t.role = e.role ?? void 0, t.delta = e.delta ?? void 0, t.name = e.name ?? void 0, t.subagentRunId = e.subagentRunId ?? void 0, t;
	}
};
function Ks() {
	return {
		baseEvent: void 0,
		toolCallId: "",
		toolCallName: "",
		parentMessageId: void 0,
		subagentRunId: void 0
	};
}
var qs = {
	encode(e, t = new F()) {
		return e.baseEvent !== void 0 && z.encode(e.baseEvent, t.uint32(10).fork()).join(), e.toolCallId !== "" && t.uint32(18).string(e.toolCallId), e.toolCallName !== "" && t.uint32(26).string(e.toolCallName), e.parentMessageId !== void 0 && t.uint32(34).string(e.parentMessageId), e.subagentRunId !== void 0 && t.uint32(42).string(e.subagentRunId), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = Ks();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = z.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.toolCallId = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.toolCallName = n.string();
					continue;
				case 4:
					if (e !== 34) break;
					i.parentMessageId = n.string();
					continue;
				case 5:
					if (e !== 42) break;
					i.subagentRunId = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return qs.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Ks();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? z.fromPartial(e.baseEvent) : void 0, t.toolCallId = e.toolCallId ?? "", t.toolCallName = e.toolCallName ?? "", t.parentMessageId = e.parentMessageId ?? void 0, t.subagentRunId = e.subagentRunId ?? void 0, t;
	}
};
function Js() {
	return {
		baseEvent: void 0,
		toolCallId: "",
		delta: "",
		subagentRunId: void 0
	};
}
var Ys = {
	encode(e, t = new F()) {
		return e.baseEvent !== void 0 && z.encode(e.baseEvent, t.uint32(10).fork()).join(), e.toolCallId !== "" && t.uint32(18).string(e.toolCallId), e.delta !== "" && t.uint32(26).string(e.delta), e.subagentRunId !== void 0 && t.uint32(34).string(e.subagentRunId), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = Js();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = z.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.toolCallId = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.delta = n.string();
					continue;
				case 4:
					if (e !== 34) break;
					i.subagentRunId = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return Ys.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Js();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? z.fromPartial(e.baseEvent) : void 0, t.toolCallId = e.toolCallId ?? "", t.delta = e.delta ?? "", t.subagentRunId = e.subagentRunId ?? void 0, t;
	}
};
function Xs() {
	return {
		baseEvent: void 0,
		toolCallId: "",
		subagentRunId: void 0
	};
}
var Zs = {
	encode(e, t = new F()) {
		return e.baseEvent !== void 0 && z.encode(e.baseEvent, t.uint32(10).fork()).join(), e.toolCallId !== "" && t.uint32(18).string(e.toolCallId), e.subagentRunId !== void 0 && t.uint32(26).string(e.subagentRunId), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = Xs();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = z.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.toolCallId = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.subagentRunId = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return Zs.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Xs();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? z.fromPartial(e.baseEvent) : void 0, t.toolCallId = e.toolCallId ?? "", t.subagentRunId = e.subagentRunId ?? void 0, t;
	}
};
function Qs() {
	return {
		baseEvent: void 0,
		toolCallId: void 0,
		toolCallName: void 0,
		parentMessageId: void 0,
		delta: void 0,
		subagentRunId: void 0
	};
}
var $s = {
	encode(e, t = new F()) {
		return e.baseEvent !== void 0 && z.encode(e.baseEvent, t.uint32(10).fork()).join(), e.toolCallId !== void 0 && t.uint32(18).string(e.toolCallId), e.toolCallName !== void 0 && t.uint32(26).string(e.toolCallName), e.parentMessageId !== void 0 && t.uint32(34).string(e.parentMessageId), e.delta !== void 0 && t.uint32(42).string(e.delta), e.subagentRunId !== void 0 && t.uint32(50).string(e.subagentRunId), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = Qs();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = z.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.toolCallId = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.toolCallName = n.string();
					continue;
				case 4:
					if (e !== 34) break;
					i.parentMessageId = n.string();
					continue;
				case 5:
					if (e !== 42) break;
					i.delta = n.string();
					continue;
				case 6:
					if (e !== 50) break;
					i.subagentRunId = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return $s.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Qs();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? z.fromPartial(e.baseEvent) : void 0, t.toolCallId = e.toolCallId ?? void 0, t.toolCallName = e.toolCallName ?? void 0, t.parentMessageId = e.parentMessageId ?? void 0, t.delta = e.delta ?? void 0, t.subagentRunId = e.subagentRunId ?? void 0, t;
	}
};
function ec() {
	return {
		baseEvent: void 0,
		subagentRunId: void 0,
		messageId: "",
		toolCallId: "",
		content: void 0,
		role: void 0,
		contentParts: []
	};
}
var tc = {
	encode(e, t = new F()) {
		e.baseEvent !== void 0 && z.encode(e.baseEvent, t.uint32(10).fork()).join(), e.subagentRunId !== void 0 && t.uint32(18).string(e.subagentRunId), e.messageId !== "" && t.uint32(26).string(e.messageId), e.toolCallId !== "" && t.uint32(34).string(e.toolCallId), e.content !== void 0 && t.uint32(42).string(e.content), e.role !== void 0 && t.uint32(50).string(e.role);
		for (let n of e.contentParts) ys.encode(n, t.uint32(58).fork()).join();
		return t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = ec();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = z.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.subagentRunId = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.messageId = n.string();
					continue;
				case 4:
					if (e !== 34) break;
					i.toolCallId = n.string();
					continue;
				case 5:
					if (e !== 42) break;
					i.content = n.string();
					continue;
				case 6:
					if (e !== 50) break;
					i.role = n.string();
					continue;
				case 7:
					if (e !== 58) break;
					i.contentParts.push(ys.decode(n, n.uint32()));
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return tc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = ec();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? z.fromPartial(e.baseEvent) : void 0, t.subagentRunId = e.subagentRunId ?? void 0, t.messageId = e.messageId ?? "", t.toolCallId = e.toolCallId ?? "", t.content = e.content ?? void 0, t.role = e.role ?? void 0, t.contentParts = e.contentParts?.map((e) => ys.fromPartial(e)) || [], t;
	}
};
function nc() {
	return {
		baseEvent: void 0,
		snapshot: void 0,
		subagentRunId: void 0
	};
}
var rc = {
	encode(e, t = new F()) {
		return e.baseEvent !== void 0 && z.encode(e.baseEvent, t.uint32(10).fork()).join(), e.snapshot !== void 0 && R.encode(R.wrap(e.snapshot), t.uint32(18).fork()).join(), e.subagentRunId !== void 0 && t.uint32(26).string(e.subagentRunId), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = nc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = z.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.snapshot = R.unwrap(R.decode(n, n.uint32()));
					continue;
				case 3:
					if (e !== 26) break;
					i.subagentRunId = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return rc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = nc();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? z.fromPartial(e.baseEvent) : void 0, t.snapshot = e.snapshot ?? void 0, t.subagentRunId = e.subagentRunId ?? void 0, t;
	}
};
function ic() {
	return {
		baseEvent: void 0,
		delta: [],
		subagentRunId: void 0
	};
}
var ac = {
	encode(e, t = new F()) {
		e.baseEvent !== void 0 && z.encode(e.baseEvent, t.uint32(10).fork()).join();
		for (let n of e.delta) $o.encode(n, t.uint32(18).fork()).join();
		return e.subagentRunId !== void 0 && t.uint32(26).string(e.subagentRunId), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = ic();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = z.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.delta.push($o.decode(n, n.uint32()));
					continue;
				case 3:
					if (e !== 26) break;
					i.subagentRunId = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return ac.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = ic();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? z.fromPartial(e.baseEvent) : void 0, t.delta = e.delta?.map((e) => $o.fromPartial(e)) || [], t.subagentRunId = e.subagentRunId ?? void 0, t;
	}
};
function oc() {
	return {
		baseEvent: void 0,
		messages: []
	};
}
var sc = {
	encode(e, t = new F()) {
		e.baseEvent !== void 0 && z.encode(e.baseEvent, t.uint32(10).fork()).join();
		for (let n of e.messages) Ts.encode(n, t.uint32(18).fork()).join();
		return t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = oc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = z.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.messages.push(Ts.decode(n, n.uint32()));
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return sc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = oc();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? z.fromPartial(e.baseEvent) : void 0, t.messages = e.messages?.map((e) => Ts.fromPartial(e)) || [], t;
	}
};
function cc() {
	return {
		baseEvent: void 0,
		subagentRunId: void 0,
		messageId: "",
		activityType: "",
		content: void 0,
		replace: void 0
	};
}
var lc = {
	encode(e, t = new F()) {
		return e.baseEvent !== void 0 && z.encode(e.baseEvent, t.uint32(10).fork()).join(), e.subagentRunId !== void 0 && t.uint32(18).string(e.subagentRunId), e.messageId !== "" && t.uint32(26).string(e.messageId), e.activityType !== "" && t.uint32(34).string(e.activityType), e.content !== void 0 && L.encode(L.wrap(e.content), t.uint32(42).fork()).join(), e.replace !== void 0 && t.uint32(48).bool(e.replace), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = cc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = z.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.subagentRunId = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.messageId = n.string();
					continue;
				case 4:
					if (e !== 34) break;
					i.activityType = n.string();
					continue;
				case 5:
					if (e !== 42) break;
					i.content = L.unwrap(L.decode(n, n.uint32()));
					continue;
				case 6:
					if (e !== 48) break;
					i.replace = n.bool();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return lc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = cc();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? z.fromPartial(e.baseEvent) : void 0, t.subagentRunId = e.subagentRunId ?? void 0, t.messageId = e.messageId ?? "", t.activityType = e.activityType ?? "", t.content = e.content ?? void 0, t.replace = e.replace ?? void 0, t;
	}
};
function uc() {
	return {
		baseEvent: void 0,
		subagentRunId: void 0,
		messageId: "",
		activityType: "",
		patch: []
	};
}
var dc = {
	encode(e, t = new F()) {
		e.baseEvent !== void 0 && z.encode(e.baseEvent, t.uint32(10).fork()).join(), e.subagentRunId !== void 0 && t.uint32(18).string(e.subagentRunId), e.messageId !== "" && t.uint32(26).string(e.messageId), e.activityType !== "" && t.uint32(34).string(e.activityType);
		for (let n of e.patch) $o.encode(n, t.uint32(42).fork()).join();
		return t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = uc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = z.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.subagentRunId = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.messageId = n.string();
					continue;
				case 4:
					if (e !== 34) break;
					i.activityType = n.string();
					continue;
				case 5:
					if (e !== 42) break;
					i.patch.push($o.decode(n, n.uint32()));
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return dc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = uc();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? z.fromPartial(e.baseEvent) : void 0, t.subagentRunId = e.subagentRunId ?? void 0, t.messageId = e.messageId ?? "", t.activityType = e.activityType ?? "", t.patch = e.patch?.map((e) => $o.fromPartial(e)) || [], t;
	}
};
function fc() {
	return {
		baseEvent: void 0,
		event: void 0,
		source: void 0,
		subagentRunId: void 0
	};
}
var pc = {
	encode(e, t = new F()) {
		return e.baseEvent !== void 0 && z.encode(e.baseEvent, t.uint32(10).fork()).join(), e.event !== void 0 && R.encode(R.wrap(e.event), t.uint32(18).fork()).join(), e.source !== void 0 && t.uint32(26).string(e.source), e.subagentRunId !== void 0 && t.uint32(34).string(e.subagentRunId), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = fc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = z.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.event = R.unwrap(R.decode(n, n.uint32()));
					continue;
				case 3:
					if (e !== 26) break;
					i.source = n.string();
					continue;
				case 4:
					if (e !== 34) break;
					i.subagentRunId = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return pc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = fc();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? z.fromPartial(e.baseEvent) : void 0, t.event = e.event ?? void 0, t.source = e.source ?? void 0, t.subagentRunId = e.subagentRunId ?? void 0, t;
	}
};
function mc() {
	return {
		baseEvent: void 0,
		name: "",
		value: void 0,
		subagentRunId: void 0
	};
}
var hc = {
	encode(e, t = new F()) {
		return e.baseEvent !== void 0 && z.encode(e.baseEvent, t.uint32(10).fork()).join(), e.name !== "" && t.uint32(18).string(e.name), e.value !== void 0 && R.encode(R.wrap(e.value), t.uint32(26).fork()).join(), e.subagentRunId !== void 0 && t.uint32(34).string(e.subagentRunId), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = mc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = z.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.name = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.value = R.unwrap(R.decode(n, n.uint32()));
					continue;
				case 4:
					if (e !== 34) break;
					i.subagentRunId = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return hc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = mc();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? z.fromPartial(e.baseEvent) : void 0, t.name = e.name ?? "", t.value = e.value ?? void 0, t.subagentRunId = e.subagentRunId ?? void 0, t;
	}
};
function gc() {
	return {
		baseEvent: void 0,
		threadId: "",
		runId: "",
		parentRunId: void 0,
		input: void 0,
		protocolVersion: void 0
	};
}
var _c = {
	encode(e, t = new F()) {
		return e.baseEvent !== void 0 && z.encode(e.baseEvent, t.uint32(10).fork()).join(), e.threadId !== "" && t.uint32(18).string(e.threadId), e.runId !== "" && t.uint32(26).string(e.runId), e.parentRunId !== void 0 && t.uint32(34).string(e.parentRunId), e.input !== void 0 && Ns.encode(e.input, t.uint32(42).fork()).join(), e.protocolVersion !== void 0 && t.uint32(50).string(e.protocolVersion), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = gc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = z.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.threadId = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.runId = n.string();
					continue;
				case 4:
					if (e !== 34) break;
					i.parentRunId = n.string();
					continue;
				case 5:
					if (e !== 42) break;
					i.input = Ns.decode(n, n.uint32());
					continue;
				case 6:
					if (e !== 50) break;
					i.protocolVersion = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return _c.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = gc();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? z.fromPartial(e.baseEvent) : void 0, t.threadId = e.threadId ?? "", t.runId = e.runId ?? "", t.parentRunId = e.parentRunId ?? void 0, t.input = e.input !== void 0 && e.input !== null ? Ns.fromPartial(e.input) : void 0, t.protocolVersion = e.protocolVersion ?? void 0, t;
	}
};
function vc() {
	return {
		baseEvent: void 0,
		threadId: "",
		runId: "",
		result: void 0,
		outcome: "",
		interrupts: [],
		usage: [],
		pendingToolCallIds: []
	};
}
var yc = {
	encode(e, t = new F()) {
		e.baseEvent !== void 0 && z.encode(e.baseEvent, t.uint32(10).fork()).join(), e.threadId !== "" && t.uint32(18).string(e.threadId), e.runId !== "" && t.uint32(26).string(e.runId), e.result !== void 0 && R.encode(R.wrap(e.result), t.uint32(34).fork()).join(), e.outcome !== "" && t.uint32(42).string(e.outcome);
		for (let n of e.interrupts) Fs.encode(n, t.uint32(50).fork()).join();
		for (let n of e.usage) Yc.encode(n, t.uint32(58).fork()).join();
		for (let n of e.pendingToolCallIds) t.uint32(66).string(n);
		return t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = vc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = z.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.threadId = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.runId = n.string();
					continue;
				case 4:
					if (e !== 34) break;
					i.result = R.unwrap(R.decode(n, n.uint32()));
					continue;
				case 5:
					if (e !== 42) break;
					i.outcome = n.string();
					continue;
				case 6:
					if (e !== 50) break;
					i.interrupts.push(Fs.decode(n, n.uint32()));
					continue;
				case 7:
					if (e !== 58) break;
					i.usage.push(Yc.decode(n, n.uint32()));
					continue;
				case 8:
					if (e !== 66) break;
					i.pendingToolCallIds.push(n.string());
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return yc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = vc();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? z.fromPartial(e.baseEvent) : void 0, t.threadId = e.threadId ?? "", t.runId = e.runId ?? "", t.result = e.result ?? void 0, t.outcome = e.outcome ?? "", t.interrupts = e.interrupts?.map((e) => Fs.fromPartial(e)) || [], t.usage = e.usage?.map((e) => Yc.fromPartial(e)) || [], t.pendingToolCallIds = e.pendingToolCallIds?.map((e) => e) || [], t;
	}
};
function bc() {
	return {
		baseEvent: void 0,
		code: void 0,
		message: "",
		usage: []
	};
}
var xc = {
	encode(e, t = new F()) {
		e.baseEvent !== void 0 && z.encode(e.baseEvent, t.uint32(10).fork()).join(), e.code !== void 0 && t.uint32(18).string(e.code), e.message !== "" && t.uint32(26).string(e.message);
		for (let n of e.usage) Yc.encode(n, t.uint32(34).fork()).join();
		return t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = bc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = z.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.code = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.message = n.string();
					continue;
				case 4:
					if (e !== 34) break;
					i.usage.push(Yc.decode(n, n.uint32()));
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return xc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = bc();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? z.fromPartial(e.baseEvent) : void 0, t.code = e.code ?? void 0, t.message = e.message ?? "", t.usage = e.usage?.map((e) => Yc.fromPartial(e)) || [], t;
	}
};
function Sc() {
	return {
		baseEvent: void 0,
		stepName: "",
		subagentRunId: void 0
	};
}
var Cc = {
	encode(e, t = new F()) {
		return e.baseEvent !== void 0 && z.encode(e.baseEvent, t.uint32(10).fork()).join(), e.stepName !== "" && t.uint32(18).string(e.stepName), e.subagentRunId !== void 0 && t.uint32(26).string(e.subagentRunId), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = Sc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = z.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.stepName = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.subagentRunId = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return Cc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Sc();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? z.fromPartial(e.baseEvent) : void 0, t.stepName = e.stepName ?? "", t.subagentRunId = e.subagentRunId ?? void 0, t;
	}
};
function wc() {
	return {
		baseEvent: void 0,
		stepName: "",
		subagentRunId: void 0
	};
}
var Tc = {
	encode(e, t = new F()) {
		return e.baseEvent !== void 0 && z.encode(e.baseEvent, t.uint32(10).fork()).join(), e.stepName !== "" && t.uint32(18).string(e.stepName), e.subagentRunId !== void 0 && t.uint32(26).string(e.subagentRunId), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = wc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = z.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.stepName = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.subagentRunId = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return Tc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = wc();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? z.fromPartial(e.baseEvent) : void 0, t.stepName = e.stepName ?? "", t.subagentRunId = e.subagentRunId ?? void 0, t;
	}
};
function Ec() {
	return {
		baseEvent: void 0,
		subagentRunId: void 0,
		messageId: ""
	};
}
var Dc = {
	encode(e, t = new F()) {
		return e.baseEvent !== void 0 && z.encode(e.baseEvent, t.uint32(10).fork()).join(), e.subagentRunId !== void 0 && t.uint32(18).string(e.subagentRunId), e.messageId !== "" && t.uint32(26).string(e.messageId), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = Ec();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = z.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.subagentRunId = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.messageId = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return Dc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Ec();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? z.fromPartial(e.baseEvent) : void 0, t.subagentRunId = e.subagentRunId ?? void 0, t.messageId = e.messageId ?? "", t;
	}
};
function Oc() {
	return {
		baseEvent: void 0,
		subagentRunId: void 0,
		messageId: "",
		role: ""
	};
}
var kc = {
	encode(e, t = new F()) {
		return e.baseEvent !== void 0 && z.encode(e.baseEvent, t.uint32(10).fork()).join(), e.subagentRunId !== void 0 && t.uint32(18).string(e.subagentRunId), e.messageId !== "" && t.uint32(26).string(e.messageId), e.role !== "" && t.uint32(34).string(e.role), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = Oc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = z.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.subagentRunId = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.messageId = n.string();
					continue;
				case 4:
					if (e !== 34) break;
					i.role = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return kc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Oc();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? z.fromPartial(e.baseEvent) : void 0, t.subagentRunId = e.subagentRunId ?? void 0, t.messageId = e.messageId ?? "", t.role = e.role ?? "", t;
	}
};
function Ac() {
	return {
		baseEvent: void 0,
		subagentRunId: void 0,
		messageId: "",
		delta: ""
	};
}
var jc = {
	encode(e, t = new F()) {
		return e.baseEvent !== void 0 && z.encode(e.baseEvent, t.uint32(10).fork()).join(), e.subagentRunId !== void 0 && t.uint32(18).string(e.subagentRunId), e.messageId !== "" && t.uint32(26).string(e.messageId), e.delta !== "" && t.uint32(34).string(e.delta), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = Ac();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = z.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.subagentRunId = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.messageId = n.string();
					continue;
				case 4:
					if (e !== 34) break;
					i.delta = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return jc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Ac();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? z.fromPartial(e.baseEvent) : void 0, t.subagentRunId = e.subagentRunId ?? void 0, t.messageId = e.messageId ?? "", t.delta = e.delta ?? "", t;
	}
};
function Mc() {
	return {
		baseEvent: void 0,
		subagentRunId: void 0,
		messageId: ""
	};
}
var Nc = {
	encode(e, t = new F()) {
		return e.baseEvent !== void 0 && z.encode(e.baseEvent, t.uint32(10).fork()).join(), e.subagentRunId !== void 0 && t.uint32(18).string(e.subagentRunId), e.messageId !== "" && t.uint32(26).string(e.messageId), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = Mc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = z.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.subagentRunId = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.messageId = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return Nc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Mc();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? z.fromPartial(e.baseEvent) : void 0, t.subagentRunId = e.subagentRunId ?? void 0, t.messageId = e.messageId ?? "", t;
	}
};
function Pc() {
	return {
		baseEvent: void 0,
		subagentRunId: void 0,
		messageId: void 0,
		delta: void 0
	};
}
var Fc = {
	encode(e, t = new F()) {
		return e.baseEvent !== void 0 && z.encode(e.baseEvent, t.uint32(10).fork()).join(), e.subagentRunId !== void 0 && t.uint32(18).string(e.subagentRunId), e.messageId !== void 0 && t.uint32(26).string(e.messageId), e.delta !== void 0 && t.uint32(34).string(e.delta), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = Pc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = z.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.subagentRunId = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.messageId = n.string();
					continue;
				case 4:
					if (e !== 34) break;
					i.delta = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return Fc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Pc();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? z.fromPartial(e.baseEvent) : void 0, t.subagentRunId = e.subagentRunId ?? void 0, t.messageId = e.messageId ?? void 0, t.delta = e.delta ?? void 0, t;
	}
};
function Ic() {
	return {
		baseEvent: void 0,
		subagentRunId: void 0,
		messageId: ""
	};
}
var Lc = {
	encode(e, t = new F()) {
		return e.baseEvent !== void 0 && z.encode(e.baseEvent, t.uint32(10).fork()).join(), e.subagentRunId !== void 0 && t.uint32(18).string(e.subagentRunId), e.messageId !== "" && t.uint32(26).string(e.messageId), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = Ic();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = z.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.subagentRunId = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.messageId = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return Lc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Ic();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? z.fromPartial(e.baseEvent) : void 0, t.subagentRunId = e.subagentRunId ?? void 0, t.messageId = e.messageId ?? "", t;
	}
};
function Rc() {
	return {
		baseEvent: void 0,
		subagentRunId: void 0,
		subtype: "",
		entityId: "",
		encryptedValue: ""
	};
}
var zc = {
	encode(e, t = new F()) {
		return e.baseEvent !== void 0 && z.encode(e.baseEvent, t.uint32(10).fork()).join(), e.subagentRunId !== void 0 && t.uint32(18).string(e.subagentRunId), e.subtype !== "" && t.uint32(26).string(e.subtype), e.entityId !== "" && t.uint32(34).string(e.entityId), e.encryptedValue !== "" && t.uint32(42).string(e.encryptedValue), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = Rc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = z.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.subagentRunId = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.subtype = n.string();
					continue;
				case 4:
					if (e !== 34) break;
					i.entityId = n.string();
					continue;
				case 5:
					if (e !== 42) break;
					i.encryptedValue = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return zc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Rc();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? z.fromPartial(e.baseEvent) : void 0, t.subagentRunId = e.subagentRunId ?? void 0, t.subtype = e.subtype ?? "", t.entityId = e.entityId ?? "", t.encryptedValue = e.encryptedValue ?? "", t;
	}
};
function Bc() {
	return {
		baseEvent: void 0,
		subagentRunId: "",
		name: "",
		description: void 0,
		parentSubagentRunId: void 0,
		parentToolCallId: void 0,
		parentMessageId: void 0
	};
}
var Vc = {
	encode(e, t = new F()) {
		return e.baseEvent !== void 0 && z.encode(e.baseEvent, t.uint32(10).fork()).join(), e.subagentRunId !== "" && t.uint32(18).string(e.subagentRunId), e.name !== "" && t.uint32(26).string(e.name), e.description !== void 0 && t.uint32(34).string(e.description), e.parentSubagentRunId !== void 0 && t.uint32(42).string(e.parentSubagentRunId), e.parentToolCallId !== void 0 && t.uint32(50).string(e.parentToolCallId), e.parentMessageId !== void 0 && t.uint32(58).string(e.parentMessageId), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = Bc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = z.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.subagentRunId = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.name = n.string();
					continue;
				case 4:
					if (e !== 34) break;
					i.description = n.string();
					continue;
				case 5:
					if (e !== 42) break;
					i.parentSubagentRunId = n.string();
					continue;
				case 6:
					if (e !== 50) break;
					i.parentToolCallId = n.string();
					continue;
				case 7:
					if (e !== 58) break;
					i.parentMessageId = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return Vc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Bc();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? z.fromPartial(e.baseEvent) : void 0, t.subagentRunId = e.subagentRunId ?? "", t.name = e.name ?? "", t.description = e.description ?? void 0, t.parentSubagentRunId = e.parentSubagentRunId ?? void 0, t.parentToolCallId = e.parentToolCallId ?? void 0, t.parentMessageId = e.parentMessageId ?? void 0, t;
	}
};
function Hc() {
	return {
		baseEvent: void 0,
		subagentRunId: "",
		result: void 0,
		outcome: "",
		interruptIds: []
	};
}
var Uc = {
	encode(e, t = new F()) {
		e.baseEvent !== void 0 && z.encode(e.baseEvent, t.uint32(10).fork()).join(), e.subagentRunId !== "" && t.uint32(18).string(e.subagentRunId), e.result !== void 0 && R.encode(R.wrap(e.result), t.uint32(26).fork()).join(), e.outcome !== "" && t.uint32(34).string(e.outcome);
		for (let n of e.interruptIds) t.uint32(42).string(n);
		return t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = Hc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = z.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.subagentRunId = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.result = R.unwrap(R.decode(n, n.uint32()));
					continue;
				case 4:
					if (e !== 34) break;
					i.outcome = n.string();
					continue;
				case 5:
					if (e !== 42) break;
					i.interruptIds.push(n.string());
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return Uc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Hc();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? z.fromPartial(e.baseEvent) : void 0, t.subagentRunId = e.subagentRunId ?? "", t.result = e.result ?? void 0, t.outcome = e.outcome ?? "", t.interruptIds = e.interruptIds?.map((e) => e) || [], t;
	}
};
function Wc() {
	return {
		baseEvent: void 0,
		subagentRunId: "",
		message: "",
		code: void 0
	};
}
var Gc = {
	encode(e, t = new F()) {
		return e.baseEvent !== void 0 && z.encode(e.baseEvent, t.uint32(10).fork()).join(), e.subagentRunId !== "" && t.uint32(18).string(e.subagentRunId), e.message !== "" && t.uint32(26).string(e.message), e.code !== void 0 && t.uint32(34).string(e.code), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = Wc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = z.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.subagentRunId = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.message = n.string();
					continue;
				case 4:
					if (e !== 34) break;
					i.code = n.string();
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return Gc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Wc();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? z.fromPartial(e.baseEvent) : void 0, t.subagentRunId = e.subagentRunId ?? "", t.message = e.message ?? "", t.code = e.code ?? void 0, t;
	}
};
function Kc() {
	return {
		textMessageStart: void 0,
		textMessageContent: void 0,
		textMessageEnd: void 0,
		toolCallStart: void 0,
		toolCallArgs: void 0,
		toolCallEnd: void 0,
		stateSnapshot: void 0,
		stateDelta: void 0,
		messagesSnapshot: void 0,
		raw: void 0,
		custom: void 0,
		runStarted: void 0,
		runFinished: void 0,
		runError: void 0,
		stepStarted: void 0,
		stepFinished: void 0,
		textMessageChunk: void 0,
		toolCallChunk: void 0,
		subagentStarted: void 0,
		subagentFinished: void 0,
		subagentError: void 0,
		toolCallResult: void 0,
		activitySnapshot: void 0,
		activityDelta: void 0,
		reasoningStart: void 0,
		reasoningMessageStart: void 0,
		reasoningMessageContent: void 0,
		reasoningMessageEnd: void 0,
		reasoningMessageChunk: void 0,
		reasoningEnd: void 0,
		reasoningEncryptedValue: void 0
	};
}
var qc = {
	encode(e, t = new F()) {
		return e.textMessageStart !== void 0 && zs.encode(e.textMessageStart, t.uint32(10).fork()).join(), e.textMessageContent !== void 0 && Vs.encode(e.textMessageContent, t.uint32(18).fork()).join(), e.textMessageEnd !== void 0 && Us.encode(e.textMessageEnd, t.uint32(26).fork()).join(), e.toolCallStart !== void 0 && qs.encode(e.toolCallStart, t.uint32(34).fork()).join(), e.toolCallArgs !== void 0 && Ys.encode(e.toolCallArgs, t.uint32(42).fork()).join(), e.toolCallEnd !== void 0 && Zs.encode(e.toolCallEnd, t.uint32(50).fork()).join(), e.stateSnapshot !== void 0 && rc.encode(e.stateSnapshot, t.uint32(58).fork()).join(), e.stateDelta !== void 0 && ac.encode(e.stateDelta, t.uint32(66).fork()).join(), e.messagesSnapshot !== void 0 && sc.encode(e.messagesSnapshot, t.uint32(74).fork()).join(), e.raw !== void 0 && pc.encode(e.raw, t.uint32(82).fork()).join(), e.custom !== void 0 && hc.encode(e.custom, t.uint32(90).fork()).join(), e.runStarted !== void 0 && _c.encode(e.runStarted, t.uint32(98).fork()).join(), e.runFinished !== void 0 && yc.encode(e.runFinished, t.uint32(106).fork()).join(), e.runError !== void 0 && xc.encode(e.runError, t.uint32(114).fork()).join(), e.stepStarted !== void 0 && Cc.encode(e.stepStarted, t.uint32(122).fork()).join(), e.stepFinished !== void 0 && Tc.encode(e.stepFinished, t.uint32(130).fork()).join(), e.textMessageChunk !== void 0 && Gs.encode(e.textMessageChunk, t.uint32(138).fork()).join(), e.toolCallChunk !== void 0 && $s.encode(e.toolCallChunk, t.uint32(146).fork()).join(), e.subagentStarted !== void 0 && Vc.encode(e.subagentStarted, t.uint32(154).fork()).join(), e.subagentFinished !== void 0 && Uc.encode(e.subagentFinished, t.uint32(162).fork()).join(), e.subagentError !== void 0 && Gc.encode(e.subagentError, t.uint32(170).fork()).join(), e.toolCallResult !== void 0 && tc.encode(e.toolCallResult, t.uint32(178).fork()).join(), e.activitySnapshot !== void 0 && lc.encode(e.activitySnapshot, t.uint32(186).fork()).join(), e.activityDelta !== void 0 && dc.encode(e.activityDelta, t.uint32(194).fork()).join(), e.reasoningStart !== void 0 && Dc.encode(e.reasoningStart, t.uint32(202).fork()).join(), e.reasoningMessageStart !== void 0 && kc.encode(e.reasoningMessageStart, t.uint32(210).fork()).join(), e.reasoningMessageContent !== void 0 && jc.encode(e.reasoningMessageContent, t.uint32(218).fork()).join(), e.reasoningMessageEnd !== void 0 && Nc.encode(e.reasoningMessageEnd, t.uint32(226).fork()).join(), e.reasoningMessageChunk !== void 0 && Fc.encode(e.reasoningMessageChunk, t.uint32(234).fork()).join(), e.reasoningEnd !== void 0 && Lc.encode(e.reasoningEnd, t.uint32(242).fork()).join(), e.reasoningEncryptedValue !== void 0 && zc.encode(e.reasoningEncryptedValue, t.uint32(250).fork()).join(), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = Kc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.textMessageStart = zs.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.textMessageContent = Vs.decode(n, n.uint32());
					continue;
				case 3:
					if (e !== 26) break;
					i.textMessageEnd = Us.decode(n, n.uint32());
					continue;
				case 4:
					if (e !== 34) break;
					i.toolCallStart = qs.decode(n, n.uint32());
					continue;
				case 5:
					if (e !== 42) break;
					i.toolCallArgs = Ys.decode(n, n.uint32());
					continue;
				case 6:
					if (e !== 50) break;
					i.toolCallEnd = Zs.decode(n, n.uint32());
					continue;
				case 7:
					if (e !== 58) break;
					i.stateSnapshot = rc.decode(n, n.uint32());
					continue;
				case 8:
					if (e !== 66) break;
					i.stateDelta = ac.decode(n, n.uint32());
					continue;
				case 9:
					if (e !== 74) break;
					i.messagesSnapshot = sc.decode(n, n.uint32());
					continue;
				case 10:
					if (e !== 82) break;
					i.raw = pc.decode(n, n.uint32());
					continue;
				case 11:
					if (e !== 90) break;
					i.custom = hc.decode(n, n.uint32());
					continue;
				case 12:
					if (e !== 98) break;
					i.runStarted = _c.decode(n, n.uint32());
					continue;
				case 13:
					if (e !== 106) break;
					i.runFinished = yc.decode(n, n.uint32());
					continue;
				case 14:
					if (e !== 114) break;
					i.runError = xc.decode(n, n.uint32());
					continue;
				case 15:
					if (e !== 122) break;
					i.stepStarted = Cc.decode(n, n.uint32());
					continue;
				case 16:
					if (e !== 130) break;
					i.stepFinished = Tc.decode(n, n.uint32());
					continue;
				case 17:
					if (e !== 138) break;
					i.textMessageChunk = Gs.decode(n, n.uint32());
					continue;
				case 18:
					if (e !== 146) break;
					i.toolCallChunk = $s.decode(n, n.uint32());
					continue;
				case 19:
					if (e !== 154) break;
					i.subagentStarted = Vc.decode(n, n.uint32());
					continue;
				case 20:
					if (e !== 162) break;
					i.subagentFinished = Uc.decode(n, n.uint32());
					continue;
				case 21:
					if (e !== 170) break;
					i.subagentError = Gc.decode(n, n.uint32());
					continue;
				case 22:
					if (e !== 178) break;
					i.toolCallResult = tc.decode(n, n.uint32());
					continue;
				case 23:
					if (e !== 186) break;
					i.activitySnapshot = lc.decode(n, n.uint32());
					continue;
				case 24:
					if (e !== 194) break;
					i.activityDelta = dc.decode(n, n.uint32());
					continue;
				case 25:
					if (e !== 202) break;
					i.reasoningStart = Dc.decode(n, n.uint32());
					continue;
				case 26:
					if (e !== 210) break;
					i.reasoningMessageStart = kc.decode(n, n.uint32());
					continue;
				case 27:
					if (e !== 218) break;
					i.reasoningMessageContent = jc.decode(n, n.uint32());
					continue;
				case 28:
					if (e !== 226) break;
					i.reasoningMessageEnd = Nc.decode(n, n.uint32());
					continue;
				case 29:
					if (e !== 234) break;
					i.reasoningMessageChunk = Fc.decode(n, n.uint32());
					continue;
				case 30:
					if (e !== 242) break;
					i.reasoningEnd = Lc.decode(n, n.uint32());
					continue;
				case 31:
					if (e !== 250) break;
					i.reasoningEncryptedValue = zc.decode(n, n.uint32());
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return qc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Kc();
		return t.textMessageStart = e.textMessageStart !== void 0 && e.textMessageStart !== null ? zs.fromPartial(e.textMessageStart) : void 0, t.textMessageContent = e.textMessageContent !== void 0 && e.textMessageContent !== null ? Vs.fromPartial(e.textMessageContent) : void 0, t.textMessageEnd = e.textMessageEnd !== void 0 && e.textMessageEnd !== null ? Us.fromPartial(e.textMessageEnd) : void 0, t.toolCallStart = e.toolCallStart !== void 0 && e.toolCallStart !== null ? qs.fromPartial(e.toolCallStart) : void 0, t.toolCallArgs = e.toolCallArgs !== void 0 && e.toolCallArgs !== null ? Ys.fromPartial(e.toolCallArgs) : void 0, t.toolCallEnd = e.toolCallEnd !== void 0 && e.toolCallEnd !== null ? Zs.fromPartial(e.toolCallEnd) : void 0, t.stateSnapshot = e.stateSnapshot !== void 0 && e.stateSnapshot !== null ? rc.fromPartial(e.stateSnapshot) : void 0, t.stateDelta = e.stateDelta !== void 0 && e.stateDelta !== null ? ac.fromPartial(e.stateDelta) : void 0, t.messagesSnapshot = e.messagesSnapshot !== void 0 && e.messagesSnapshot !== null ? sc.fromPartial(e.messagesSnapshot) : void 0, t.raw = e.raw !== void 0 && e.raw !== null ? pc.fromPartial(e.raw) : void 0, t.custom = e.custom !== void 0 && e.custom !== null ? hc.fromPartial(e.custom) : void 0, t.runStarted = e.runStarted !== void 0 && e.runStarted !== null ? _c.fromPartial(e.runStarted) : void 0, t.runFinished = e.runFinished !== void 0 && e.runFinished !== null ? yc.fromPartial(e.runFinished) : void 0, t.runError = e.runError !== void 0 && e.runError !== null ? xc.fromPartial(e.runError) : void 0, t.stepStarted = e.stepStarted !== void 0 && e.stepStarted !== null ? Cc.fromPartial(e.stepStarted) : void 0, t.stepFinished = e.stepFinished !== void 0 && e.stepFinished !== null ? Tc.fromPartial(e.stepFinished) : void 0, t.textMessageChunk = e.textMessageChunk !== void 0 && e.textMessageChunk !== null ? Gs.fromPartial(e.textMessageChunk) : void 0, t.toolCallChunk = e.toolCallChunk !== void 0 && e.toolCallChunk !== null ? $s.fromPartial(e.toolCallChunk) : void 0, t.subagentStarted = e.subagentStarted !== void 0 && e.subagentStarted !== null ? Vc.fromPartial(e.subagentStarted) : void 0, t.subagentFinished = e.subagentFinished !== void 0 && e.subagentFinished !== null ? Uc.fromPartial(e.subagentFinished) : void 0, t.subagentError = e.subagentError !== void 0 && e.subagentError !== null ? Gc.fromPartial(e.subagentError) : void 0, t.toolCallResult = e.toolCallResult !== void 0 && e.toolCallResult !== null ? tc.fromPartial(e.toolCallResult) : void 0, t.activitySnapshot = e.activitySnapshot !== void 0 && e.activitySnapshot !== null ? lc.fromPartial(e.activitySnapshot) : void 0, t.activityDelta = e.activityDelta !== void 0 && e.activityDelta !== null ? dc.fromPartial(e.activityDelta) : void 0, t.reasoningStart = e.reasoningStart !== void 0 && e.reasoningStart !== null ? Dc.fromPartial(e.reasoningStart) : void 0, t.reasoningMessageStart = e.reasoningMessageStart !== void 0 && e.reasoningMessageStart !== null ? kc.fromPartial(e.reasoningMessageStart) : void 0, t.reasoningMessageContent = e.reasoningMessageContent !== void 0 && e.reasoningMessageContent !== null ? jc.fromPartial(e.reasoningMessageContent) : void 0, t.reasoningMessageEnd = e.reasoningMessageEnd !== void 0 && e.reasoningMessageEnd !== null ? Nc.fromPartial(e.reasoningMessageEnd) : void 0, t.reasoningMessageChunk = e.reasoningMessageChunk !== void 0 && e.reasoningMessageChunk !== null ? Fc.fromPartial(e.reasoningMessageChunk) : void 0, t.reasoningEnd = e.reasoningEnd !== void 0 && e.reasoningEnd !== null ? Lc.fromPartial(e.reasoningEnd) : void 0, t.reasoningEncryptedValue = e.reasoningEncryptedValue !== void 0 && e.reasoningEncryptedValue !== null ? zc.fromPartial(e.reasoningEncryptedValue) : void 0, t;
	}
};
function Jc() {
	return {
		provider: void 0,
		model: void 0,
		inputTokens: void 0,
		outputTokens: void 0,
		totalTokens: void 0,
		reasoningTokens: void 0,
		cachedInputTokens: void 0,
		cacheWriteInputTokens: void 0
	};
}
var Yc = {
	encode(e, t = new F()) {
		return e.provider !== void 0 && t.uint32(10).string(e.provider), e.model !== void 0 && t.uint32(18).string(e.model), e.inputTokens !== void 0 && t.uint32(24).int64(e.inputTokens), e.outputTokens !== void 0 && t.uint32(32).int64(e.outputTokens), e.totalTokens !== void 0 && t.uint32(40).int64(e.totalTokens), e.reasoningTokens !== void 0 && t.uint32(48).int64(e.reasoningTokens), e.cachedInputTokens !== void 0 && t.uint32(56).int64(e.cachedInputTokens), e.cacheWriteInputTokens !== void 0 && t.uint32(64).int64(e.cacheWriteInputTokens), t;
	},
	decode(e, t) {
		let n = e instanceof I ? e : new I(e), r = t === void 0 ? n.len : n.pos + t, i = Jc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.provider = n.string();
					continue;
				case 2:
					if (e !== 18) break;
					i.model = n.string();
					continue;
				case 3:
					if (e !== 24) break;
					i.inputTokens = Xc(n.int64());
					continue;
				case 4:
					if (e !== 32) break;
					i.outputTokens = Xc(n.int64());
					continue;
				case 5:
					if (e !== 40) break;
					i.totalTokens = Xc(n.int64());
					continue;
				case 6:
					if (e !== 48) break;
					i.reasoningTokens = Xc(n.int64());
					continue;
				case 7:
					if (e !== 56) break;
					i.cachedInputTokens = Xc(n.int64());
					continue;
				case 8:
					if (e !== 64) break;
					i.cacheWriteInputTokens = Xc(n.int64());
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return Yc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Jc();
		return t.provider = e.provider ?? void 0, t.model = e.model ?? void 0, t.inputTokens = e.inputTokens ?? void 0, t.outputTokens = e.outputTokens ?? void 0, t.totalTokens = e.totalTokens ?? void 0, t.reasoningTokens = e.reasoningTokens ?? void 0, t.cachedInputTokens = e.cachedInputTokens ?? void 0, t.cacheWriteInputTokens = e.cacheWriteInputTokens ?? void 0, t;
	}
};
function Xc(e) {
	let t = globalThis.Number(e.toString());
	if (t > globalThis.Number.MAX_SAFE_INTEGER) throw new globalThis.Error("Value is larger than Number.MAX_SAFE_INTEGER");
	if (t < globalThis.Number.MIN_SAFE_INTEGER) throw new globalThis.Error("Value is smaller than Number.MIN_SAFE_INTEGER");
	return t;
}
var Zc = (e) => e && typeof e == "object" ? e : void 0, B = (e) => Array.isArray(e) ? e : [], Qc = () => typeof process < "u" && process.env !== void 0 && !!process.env.SUPPRESS_TRANSFORMATION_WARNINGS, $c = () => {
	Qc() || console.warn("[ag-ui][proto] Dropped a content part this build does not know: the protocol has a variant this SDK predates.");
};
new Set(Object.values(b));
var el = {
	textMessageStart: "TEXT_MESSAGE_START",
	textMessageContent: "TEXT_MESSAGE_CONTENT",
	textMessageEnd: "TEXT_MESSAGE_END",
	textMessageChunk: "TEXT_MESSAGE_CHUNK",
	toolCallStart: "TOOL_CALL_START",
	toolCallArgs: "TOOL_CALL_ARGS",
	toolCallEnd: "TOOL_CALL_END",
	toolCallChunk: "TOOL_CALL_CHUNK",
	toolCallResult: "TOOL_CALL_RESULT",
	stateSnapshot: "STATE_SNAPSHOT",
	stateDelta: "STATE_DELTA",
	messagesSnapshot: "MESSAGES_SNAPSHOT",
	activitySnapshot: "ACTIVITY_SNAPSHOT",
	activityDelta: "ACTIVITY_DELTA",
	raw: "RAW",
	custom: "CUSTOM",
	runStarted: "RUN_STARTED",
	runFinished: "RUN_FINISHED",
	runError: "RUN_ERROR",
	stepStarted: "STEP_STARTED",
	stepFinished: "STEP_FINISHED",
	reasoningStart: "REASONING_START",
	reasoningMessageStart: "REASONING_MESSAGE_START",
	reasoningMessageContent: "REASONING_MESSAGE_CONTENT",
	reasoningMessageEnd: "REASONING_MESSAGE_END",
	reasoningMessageChunk: "REASONING_MESSAGE_CHUNK",
	reasoningEnd: "REASONING_END",
	reasoningEncryptedValue: "REASONING_ENCRYPTED_VALUE",
	subagentStarted: "SUBAGENT_STARTED",
	subagentFinished: "SUBAGENT_FINISHED",
	subagentError: "SUBAGENT_ERROR"
}, tl = /* @__PURE__ */ new Set([
	1,
	2,
	3,
	4,
	5,
	6,
	7,
	8,
	9,
	10,
	11,
	12,
	13,
	14,
	15,
	16,
	17,
	18,
	19,
	20,
	21,
	22,
	23,
	24,
	25,
	26,
	27,
	28,
	29,
	30,
	31
]), nl = (e) => {
	let t = Zc(e);
	if (t) {
		if ([
			t.data,
			t.url,
			t.file
		].filter(Boolean).length > 1) throw Error("Invalid event: source carries more than one arm");
		if (t.data) {
			let e = t.data;
			return {
				type: "data",
				value: e.value,
				mimeType: e.mimeType
			};
		}
		if (t.url) {
			let e = t.url;
			return {
				type: "url",
				value: e.value,
				mimeType: e.mimeType
			};
		}
		if (t.file) {
			let e = t.file;
			return {
				type: "file",
				value: e.value,
				provider: e.provider,
				mimeType: e.mimeType
			};
		}
	}
}, rl = (e) => {
	let t = Zc(e);
	if (t) {
		if ([
			t.text,
			t.image,
			t.audio,
			t.video,
			t.document
		].filter(Boolean).length > 1) throw Error("Invalid event: content part carries more than one arm");
		if (t.text) {
			let e = t.text;
			return {
				type: "text",
				id: e.id,
				text: e.text,
				metadata: e.metadata
			};
		}
		if (t.image) {
			let e = t.image;
			return e.source !== void 0 && nl(e.source) === void 0 ? void 0 : {
				type: "image",
				id: e.id,
				source: nl(e.source),
				metadata: e.metadata
			};
		}
		if (t.audio) {
			let e = t.audio;
			return e.source !== void 0 && nl(e.source) === void 0 ? void 0 : {
				type: "audio",
				id: e.id,
				source: nl(e.source),
				metadata: e.metadata
			};
		}
		if (t.video) {
			let e = t.video;
			return e.source !== void 0 && nl(e.source) === void 0 ? void 0 : {
				type: "video",
				id: e.id,
				source: nl(e.source),
				metadata: e.metadata
			};
		}
		if (t.document) {
			let e = t.document;
			return e.source !== void 0 && nl(e.source) === void 0 ? void 0 : {
				type: "document",
				id: e.id,
				source: nl(e.source),
				metadata: e.metadata
			};
		}
	}
}, il = /* @__PURE__ */ new Set(["activity"]), al = /* @__PURE__ */ new Set(["user", "tool"]), ol = /* @__PURE__ */ new Set([
	"developer",
	"system",
	"assistant",
	"user",
	"tool",
	"activity",
	"reasoning"
]), sl = (e) => {
	let t = Zc(e) ?? {}, n = { ...t }, r = typeof t.role == "string" ? t.role : "", i = ol.has(r), a = i ? al.has(r) : B(t.contentParts).length > 0, o = i ? il.has(r) : !a && t.activityContent !== void 0;
	if (!i && (t.content === void 0 ? 0 : 1) + +(B(t.contentParts).length > 0) + (t.activityContent === void 0 ? 0 : 1) > 1) throw Error("Invalid event: message carries more than one content form");
	if (i) {
		if (!a && B(t.contentParts).length > 0) throw Error("Invalid event: message carries content parts for a role that has none");
		if (t.activityContent !== void 0 && !o) throw Error("Invalid event: message carries activity content for a non-activity role");
		if (o && t.content !== void 0) throw Error("Invalid event: activity content cannot ride with other content forms");
		if (a && t.content !== void 0 && B(t.contentParts).length > 0) throw Error("Invalid event: message carries both string content and content parts");
	}
	return a && t.content === void 0 && (n.content = B(t.contentParts).map((e) => {
		let t = rl(e);
		return t === void 0 && $c(), t;
	}).filter((e) => e !== void 0)), o && t.activityContent !== void 0 && (n.content = t.activityContent), delete n.activityContent, delete n.contentParts, B(t.toolCalls).length === 0 && delete n.toolCalls, Object.keys(n).forEach((e) => {
		n[e] === void 0 && delete n[e];
	}), n;
}, cl = (e) => {
	if (Array.isArray(e)) {
		for (let t of e) cl(t);
		return;
	}
	let t = Zc(e);
	if (t) for (let e of Object.keys(t)) t[e] === void 0 ? delete t[e] : cl(t[e]);
}, ll = (e) => {
	let t = Zc(e);
	if (!t) return;
	let n = {};
	return t.threadId !== void 0 && (n.threadId = t.threadId), t.runId !== void 0 && (n.runId = t.runId), t.protocolVersion !== void 0 && (n.protocolVersion = t.protocolVersion), t.parentRunId !== void 0 && (n.parentRunId = t.parentRunId), t.state !== void 0 && (n.state = t.state), n.messages = B(t.messages).map(sl).filter((e) => e !== void 0), n.tools = B(t.tools), n.context = B(t.context), t.forwardedProps !== void 0 && (n.forwardedProps = t.forwardedProps), n.resume = B(t.resume), n;
}, ul = {
	TextMessageStartEvent: {
		singular: /* @__PURE__ */ new Set([1]),
		descend: { 1: "BaseEvent" }
	},
	BaseEvent: {
		singular: /* @__PURE__ */ new Set([3, 4]),
		descend: {},
		google: {
			3: "google.protobuf.Value",
			4: "google.protobuf.Struct"
		}
	},
	TextMessageContentEvent: {
		singular: /* @__PURE__ */ new Set([1]),
		descend: { 1: "BaseEvent" }
	},
	TextMessageEndEvent: {
		singular: /* @__PURE__ */ new Set([1]),
		descend: { 1: "BaseEvent" }
	},
	ToolCallStartEvent: {
		singular: /* @__PURE__ */ new Set([1]),
		descend: { 1: "BaseEvent" }
	},
	ToolCallArgsEvent: {
		singular: /* @__PURE__ */ new Set([1]),
		descend: { 1: "BaseEvent" }
	},
	ToolCallEndEvent: {
		singular: /* @__PURE__ */ new Set([1]),
		descend: { 1: "BaseEvent" }
	},
	StateSnapshotEvent: {
		singular: /* @__PURE__ */ new Set([1, 2]),
		descend: { 1: "BaseEvent" },
		google: { 2: "google.protobuf.Value" }
	},
	StateDeltaEvent: {
		singular: /* @__PURE__ */ new Set([1]),
		descend: {
			1: "BaseEvent",
			2: "JsonPatchOperation"
		}
	},
	JsonPatchOperation: {
		singular: /* @__PURE__ */ new Set([4]),
		descend: {},
		google: { 4: "google.protobuf.Value" }
	},
	MessagesSnapshotEvent: {
		singular: /* @__PURE__ */ new Set([1]),
		descend: {
			1: "BaseEvent",
			2: "Message"
		}
	},
	Message: {
		singular: /* @__PURE__ */ new Set([9, 13]),
		descend: {
			5: "ToolCall",
			8: "InputContent"
		},
		google: {
			9: "google.protobuf.Struct",
			13: "google.protobuf.Struct"
		}
	},
	ToolCall: {
		singular: /* @__PURE__ */ new Set([3, 4]),
		descend: {},
		google: { 4: "google.protobuf.Struct" }
	},
	InputContent: {
		singular: /* @__PURE__ */ new Set([
			1,
			2,
			3,
			4,
			5
		]),
		descend: {
			1: "TextInputPart",
			2: "ImageInputPart",
			3: "AudioInputPart",
			4: "VideoInputPart",
			5: "DocumentInputPart"
		},
		arms: /* @__PURE__ */ new Set([
			1,
			2,
			3,
			4,
			5
		])
	},
	TextInputPart: {
		singular: /* @__PURE__ */ new Set([3]),
		descend: {},
		google: { 3: "google.protobuf.Value" }
	},
	ImageInputPart: {
		singular: /* @__PURE__ */ new Set([1, 2]),
		descend: { 1: "InputContentSource" },
		google: { 2: "google.protobuf.Value" }
	},
	InputContentSource: {
		singular: /* @__PURE__ */ new Set([
			1,
			2,
			3
		]),
		descend: {},
		arms: /* @__PURE__ */ new Set([
			1,
			2,
			3
		])
	},
	AudioInputPart: {
		singular: /* @__PURE__ */ new Set([1, 2]),
		descend: { 1: "InputContentSource" },
		google: { 2: "google.protobuf.Value" }
	},
	VideoInputPart: {
		singular: /* @__PURE__ */ new Set([1, 2]),
		descend: { 1: "InputContentSource" },
		google: { 2: "google.protobuf.Value" }
	},
	DocumentInputPart: {
		singular: /* @__PURE__ */ new Set([1, 2]),
		descend: { 1: "InputContentSource" },
		google: { 2: "google.protobuf.Value" }
	},
	RawEvent: {
		singular: /* @__PURE__ */ new Set([1, 2]),
		descend: { 1: "BaseEvent" },
		google: { 2: "google.protobuf.Value" }
	},
	CustomEvent: {
		singular: /* @__PURE__ */ new Set([1, 3]),
		descend: { 1: "BaseEvent" },
		google: { 3: "google.protobuf.Value" }
	},
	RunStartedEvent: {
		singular: /* @__PURE__ */ new Set([1, 5]),
		descend: {
			1: "BaseEvent",
			5: "RunAgentInput"
		}
	},
	RunAgentInput: {
		singular: /* @__PURE__ */ new Set([4, 8]),
		descend: {
			5: "Message",
			6: "Tool",
			9: "ResumeEntry"
		},
		google: {
			4: "google.protobuf.Value",
			8: "google.protobuf.Value"
		}
	},
	Tool: {
		singular: /* @__PURE__ */ new Set([3, 4]),
		descend: {},
		google: {
			3: "google.protobuf.Value",
			4: "google.protobuf.Struct"
		}
	},
	ResumeEntry: {
		singular: /* @__PURE__ */ new Set([3, 4]),
		descend: {},
		google: {
			3: "google.protobuf.Value",
			4: "google.protobuf.Struct"
		}
	},
	RunFinishedEvent: {
		singular: /* @__PURE__ */ new Set([1, 4]),
		descend: {
			1: "BaseEvent",
			6: "Interrupt"
		},
		google: { 4: "google.protobuf.Value" }
	},
	Interrupt: {
		singular: /* @__PURE__ */ new Set([5, 7]),
		descend: {},
		google: {
			5: "google.protobuf.Value",
			7: "google.protobuf.Value"
		}
	},
	RunErrorEvent: {
		singular: /* @__PURE__ */ new Set([1]),
		descend: { 1: "BaseEvent" }
	},
	StepStartedEvent: {
		singular: /* @__PURE__ */ new Set([1]),
		descend: { 1: "BaseEvent" }
	},
	StepFinishedEvent: {
		singular: /* @__PURE__ */ new Set([1]),
		descend: { 1: "BaseEvent" }
	},
	TextMessageChunkEvent: {
		singular: /* @__PURE__ */ new Set([1]),
		descend: { 1: "BaseEvent" }
	},
	ToolCallChunkEvent: {
		singular: /* @__PURE__ */ new Set([1]),
		descend: { 1: "BaseEvent" }
	},
	SubagentStartedEvent: {
		singular: /* @__PURE__ */ new Set([1]),
		descend: { 1: "BaseEvent" }
	},
	SubagentFinishedEvent: {
		singular: /* @__PURE__ */ new Set([1, 3]),
		descend: { 1: "BaseEvent" },
		google: { 3: "google.protobuf.Value" }
	},
	SubagentErrorEvent: {
		singular: /* @__PURE__ */ new Set([1]),
		descend: { 1: "BaseEvent" }
	},
	ToolCallResultEvent: {
		singular: /* @__PURE__ */ new Set([1]),
		descend: {
			1: "BaseEvent",
			7: "InputContent"
		}
	},
	ActivitySnapshotEvent: {
		singular: /* @__PURE__ */ new Set([1, 5]),
		descend: { 1: "BaseEvent" },
		google: { 5: "google.protobuf.Struct" }
	},
	ActivityDeltaEvent: {
		singular: /* @__PURE__ */ new Set([1]),
		descend: {
			1: "BaseEvent",
			5: "JsonPatchOperation"
		}
	},
	ReasoningStartEvent: {
		singular: /* @__PURE__ */ new Set([1]),
		descend: { 1: "BaseEvent" }
	},
	ReasoningMessageStartEvent: {
		singular: /* @__PURE__ */ new Set([1]),
		descend: { 1: "BaseEvent" }
	},
	ReasoningMessageContentEvent: {
		singular: /* @__PURE__ */ new Set([1]),
		descend: { 1: "BaseEvent" }
	},
	ReasoningMessageEndEvent: {
		singular: /* @__PURE__ */ new Set([1]),
		descend: { 1: "BaseEvent" }
	},
	ReasoningMessageChunkEvent: {
		singular: /* @__PURE__ */ new Set([1]),
		descend: { 1: "BaseEvent" }
	},
	ReasoningEndEvent: {
		singular: /* @__PURE__ */ new Set([1]),
		descend: { 1: "BaseEvent" }
	},
	ReasoningEncryptedValueEvent: {
		singular: /* @__PURE__ */ new Set([1]),
		descend: { 1: "BaseEvent" }
	},
	"google.protobuf.Struct": {
		singular: /* @__PURE__ */ new Set(),
		descend: { 1: "google.protobuf.Struct.FieldsEntry" }
	},
	"google.protobuf.Struct.FieldsEntry": {
		singular: /* @__PURE__ */ new Set([2]),
		descend: { 2: "google.protobuf.Value" }
	},
	"google.protobuf.Value": {
		singular: /* @__PURE__ */ new Set([5, 6]),
		descend: {
			5: "google.protobuf.Struct",
			6: "google.protobuf.ListValue"
		},
		arms: /* @__PURE__ */ new Set([
			1,
			2,
			3,
			4,
			5,
			6
		]),
		armWireTypes: {
			1: 0,
			2: 1,
			3: 2,
			4: 0,
			5: 2,
			6: 2
		}
	},
	"google.protobuf.ListValue": {
		singular: /* @__PURE__ */ new Set(),
		descend: { 1: "google.protobuf.Value" }
	}
}, dl = {
	1: "TextMessageStartEvent",
	2: "TextMessageContentEvent",
	3: "TextMessageEndEvent",
	4: "ToolCallStartEvent",
	5: "ToolCallArgsEvent",
	6: "ToolCallEndEvent",
	7: "StateSnapshotEvent",
	8: "StateDeltaEvent",
	9: "MessagesSnapshotEvent",
	10: "RawEvent",
	11: "CustomEvent",
	12: "RunStartedEvent",
	13: "RunFinishedEvent",
	14: "RunErrorEvent",
	15: "StepStartedEvent",
	16: "StepFinishedEvent",
	17: "TextMessageChunkEvent",
	18: "ToolCallChunkEvent",
	19: "SubagentStartedEvent",
	20: "SubagentFinishedEvent",
	21: "SubagentErrorEvent",
	22: "ToolCallResultEvent",
	23: "ActivitySnapshotEvent",
	24: "ActivityDeltaEvent",
	25: "ReasoningStartEvent",
	26: "ReasoningMessageStartEvent",
	27: "ReasoningMessageContentEvent",
	28: "ReasoningMessageEndEvent",
	29: "ReasoningMessageChunkEvent",
	30: "ReasoningEndEvent",
	31: "ReasoningEncryptedValueEvent"
};
function fl(e, t) {
	let n = 0, r = 0;
	for (;;) {
		if (t.offset >= e.length) throw Error("Invalid event");
		let i = e[t.offset++];
		if (r < 28 ? n += (i & 127) * 2 ** r : r === 28 && (n += (i & 15) * 2 ** 28), r += 7, !(i & 128)) return n;
	}
}
function pl(e, t) {
	let n = { offset: 0 }, r = 0, i = 0;
	for (; n.offset < e.length;) {
		let a = fl(e, n), o = Math.floor(a / 8), s = a % 8;
		if (o === 0) throw Error("Invalid event");
		if (s === 3) r += 1;
		else if (s === 4) {
			if (--r, r < 0) throw Error("Invalid event");
		} else {
			if (s === 0) fl(e, n);
			else if (s === 1) n.offset += 8;
			else if (s === 2) {
				let a = fl(e, n);
				if (n.offset + a > e.length) throw Error("Invalid event");
				if (r === 0) {
					if (t.arms?.has(o)) {
						if (i !== 0 && i !== o) throw Error("Invalid event");
						i = o;
					}
					let r = t.descend[o];
					if (r !== void 0) {
						let t = ul[r];
						t !== void 0 && pl(e.subarray(n.offset, n.offset + a), t);
					}
				}
				n.offset += a;
			} else if (s === 5) n.offset += 4;
			else throw Error("Invalid event");
			if (n.offset > e.length) throw Error("Invalid event");
		}
	}
	if (r !== 0) throw Error("Invalid event");
}
function ml(e) {
	let t = /* @__PURE__ */ new Set(), n = { offset: 0 }, r = 0;
	for (; n.offset < e.length;) {
		let i = fl(e, n), a = Math.floor(i / 8), o = i % 8;
		if (a === 0) throw Error("Invalid event");
		if (o === 3) r += 1;
		else if (o === 4) {
			if (--r, r < 0) throw Error("Invalid event");
		} else {
			if (r === 0 && tl.has(a)) {
				if (t.size > 0 && !t.has(a)) throw Error("Invalid event");
				t.add(a);
			}
			if (o === 0) fl(e, n);
			else if (o === 1) n.offset += 8;
			else if (o === 2) {
				let t = fl(e, n);
				if (n.offset + t > e.length) throw Error("Invalid event");
				if (r === 0) {
					let r = dl[a];
					if (r !== void 0) {
						let i = ul[r];
						i !== void 0 && pl(e.subarray(n.offset, n.offset + t), i);
					}
				}
				n.offset += t;
			} else if (o === 5) n.offset += 4;
			else throw Error("Invalid event");
			if (n.offset > e.length) throw Error("Invalid event");
		}
	}
	if (r !== 0) throw Error("Invalid event");
}
function hl(e) {
	if (e.length === 1) return e[0];
	let t = new Uint8Array(e.reduce((e, t) => e + t.length, 0)), n = 0;
	for (let r of e) t.set(r, n), n += r.length;
	return t;
}
function gl(e, t) {
	let n = new I(e), r = [], i = /* @__PURE__ */ new Map(), a, o = !1;
	for (; n.pos < n.len;) {
		let s = n.pos, [c, l] = n.tag(), u = l === 2 ? n.bytes() : void 0;
		u === void 0 && n.skip(l, c);
		let d = t.arms?.has(c) && l === (t.armWireTypes?.[c] ?? 2);
		if (d) {
			if (a !== void 0 && a !== c) {
				let e = i.get(a);
				e !== void 0 && (r[e] = void 0), i.delete(a), o = !0;
			}
			if (a = c, !t.singular.has(c)) {
				let e = i.get(c);
				e !== void 0 && (r[e] = void 0, i.delete(c), o = !0);
			}
		}
		let f = t.descend[c] ?? t.google?.[c], p = u !== void 0 && (t.singular.has(c) || f !== void 0), m = i.get(c), h = m === void 0 ? void 0 : r[m]?.payloads;
		p && t.singular.has(c) && h !== void 0 ? (h.push(u), o = !0) : ((p || d) && i.set(c, r.length), r.push({
			number: c,
			raw: e.subarray(s, n.pos),
			...p && { payloads: [u] },
			child: f === void 0 ? void 0 : ul[f]
		}));
	}
	let s = [];
	for (let e of r) if (e !== void 0) {
		if (e.payloads !== void 0) {
			let t = hl(e.payloads), n = e.child === void 0 ? t : gl(t, e.child);
			if (e.payloads.length > 1 || n !== t) {
				s.push(new F().uint32(e.number * 8 + 2).bytes(n).finish()), o = !0;
				continue;
			}
		}
		s.push(e.raw);
	}
	return o ? hl(s) : e;
}
var _l = class extends Error {
	constructor(e = "Unknown event type") {
		super(e), this.name = "AGUIUnknownEventTypeError";
	}
};
function vl(e, t, n, r) {
	let i = 0, a = 0, o = 0;
	for (;;) {
		if (t.offset >= e.length || o >= n) return -1;
		let s = e[t.offset++];
		if (o += 1, o === n && s > r) return -1;
		if (i += (s & 127) * 2 ** a, a += 7, !(s & 128)) return i;
	}
}
var yl = (e, t) => vl(e, t, 5, 15), bl = (e, t) => vl(e, t, 10, 1);
function xl(e) {
	let t = { offset: 0 }, n = [];
	for (; t.offset < e.length;) {
		let r = yl(e, t);
		if (r < 0) return !1;
		let i = Math.floor(r / 8), a = r % 8;
		if (i === 0) return !1;
		if (a === 3) n.push(i);
		else if (a === 4) {
			if (n.pop() !== i) return !1;
		} else if (a === 0) {
			if (bl(e, t) < 0) return !1;
		} else if (a === 1) t.offset += 8;
		else if (a === 5) t.offset += 4;
		else if (a === 2) {
			let n = yl(e, t);
			if (n < 0 || t.offset + n > e.length) return !1;
			t.offset += n;
		} else return !1;
		if (t.offset > e.length) return !1;
	}
	return n.length === 0;
}
function Sl(e) {
	let t = { offset: 0 }, n = [], r = 0;
	for (; t.offset < e.length;) {
		let i = yl(e, t);
		if (i < 0) return !1;
		let a = Math.floor(i / 8), o = i % 8;
		if (a === 0) return !1;
		let s = n.length === 0;
		if (o === 3) {
			if (s && tl.has(a)) return !1;
			n.push(a);
		} else if (o === 4) {
			if (n.pop() !== a) return !1;
		} else if (o === 0) {
			if (s && tl.has(a) || bl(e, t) < 0) return !1;
		} else if (o === 1) {
			if (s && tl.has(a)) return !1;
			t.offset += 8;
		} else if (o === 5) {
			if (s && tl.has(a)) return !1;
			t.offset += 4;
		} else if (o === 2) {
			let n = yl(e, t);
			if (n < 0 || t.offset + n > e.length) return !1;
			if (s) {
				if (tl.has(a) || !xl(e.subarray(t.offset, t.offset + n))) return !1;
				r += 1;
			}
			t.offset += n;
		} else return !1;
		if (t.offset > e.length) return !1;
	}
	return n.length === 0 && r > 0;
}
function Cl(e) {
	ml(e);
	let t = qc.decode(gl(e, {
		singular: tl,
		descend: dl
	})), n = Object.entries(t).filter(([, e]) => e !== void 0);
	if (n.length !== 1) throw n.length === 0 && Sl(e) ? new _l() : Error("Invalid event");
	let r = n[0], i = el[r[0]];
	if (i === void 0) throw Error("Invalid event");
	let a = r[1], o = Zc(a.baseEvent);
	if (!o) throw Error("Invalid event");
	let s = Is[o.type];
	if (s !== i) throw Error("Invalid event: envelope carries " + i + " but the base event declares " + String(s));
	if (a.type = i, a.timestamp = o.timestamp, a.rawEvent = o.rawEvent, o.metadata !== void 0 && (a.metadata = o.metadata), delete a.baseEvent, a.type === "MESSAGES_SNAPSHOT" && Array.isArray(a.messages) && (a.messages = a.messages.map(sl).filter((e) => e !== void 0)), a.type === "RUN_FINISHED") {
		let e = a, t = typeof e.outcome == "string" && e.outcome !== "" ? e.outcome : void 0, n = {};
		n.pendingToolCallIds = e.pendingToolCallIds, delete e.pendingToolCallIds, n.interrupts = e.interrupts, delete e.interrupts, delete e.outcome, t === void 0 && (B(n.pendingToolCallIds).length > 0 && (e.pendingToolCallIds = n.pendingToolCallIds), B(n.interrupts).length > 0 && (e.interrupts = n.interrupts)), t === "success" && (e.outcome = {
			type: "success",
			...B(n.pendingToolCallIds).length > 0 ? { pendingToolCallIds: n.pendingToolCallIds } : {},
			...B(n.interrupts).length > 0 ? { interrupts: n.interrupts } : {}
		}), t === "interrupt" && (e.outcome = {
			type: "interrupt",
			interrupts: B(n.interrupts),
			...B(n.pendingToolCallIds).length > 0 ? { pendingToolCallIds: n.pendingToolCallIds } : {}
		}), t === "cancelled" && (e.outcome = {
			type: "cancelled",
			...B(n.pendingToolCallIds).length > 0 ? { pendingToolCallIds: n.pendingToolCallIds } : {},
			...B(n.interrupts).length > 0 ? { interrupts: n.interrupts } : {}
		}), t !== void 0 && ![
			"success",
			"interrupt",
			"cancelled"
		].includes(t) && (e.outcome = {
			type: t,
			...B(n.pendingToolCallIds).length > 0 ? { pendingToolCallIds: n.pendingToolCallIds } : {},
			...B(n.interrupts).length > 0 ? { interrupts: n.interrupts } : {}
		});
	}
	if (a.type === "SUBAGENT_FINISHED") {
		let e = a, t = typeof e.outcome == "string" && e.outcome !== "" ? e.outcome : void 0, n = {};
		n.interruptIds = e.interruptIds, delete e.interruptIds, delete e.outcome, t === void 0 && B(n.interruptIds).length > 0 && (e.interruptIds = n.interruptIds), t === "success" && (e.outcome = {
			type: "success",
			...B(n.interruptIds).length > 0 ? { interruptIds: n.interruptIds } : {}
		}), t === "suspended" && (e.outcome = {
			type: "suspended",
			...B(n.interruptIds).length > 0 ? { interruptIds: n.interruptIds } : {}
		}), t !== void 0 && !["success", "suspended"].includes(t) && (e.outcome = {
			type: t,
			...B(n.interruptIds).length > 0 ? { interruptIds: n.interruptIds } : {}
		});
	}
	if (a.type === "STATE_DELTA" && Array.isArray(a.delta) && (a.delta = a.delta.map((e) => {
		let t = Zo[e.op];
		return e.op = typeof t == "string" && t !== "UNRECOGNIZED" ? t.toLowerCase() : String(e.op), Object.keys(e).forEach((t) => {
			e[t] === void 0 && delete e[t];
		}), e;
	})), a.type === "ACTIVITY_DELTA" && Array.isArray(a.patch) && (a.patch = a.patch.map((e) => {
		let t = Zo[e.op];
		return e.op = typeof t == "string" && t !== "UNRECOGNIZED" ? t.toLowerCase() : String(e.op), Object.keys(e).forEach((t) => {
			e[t] === void 0 && delete e[t];
		}), e;
	})), a.type === "RUN_FINISHED" && Array.isArray(a.usage) && a.usage.length === 0 && delete a.usage, a.type === "RUN_ERROR" && Array.isArray(a.usage) && a.usage.length === 0 && delete a.usage, a.type === "TOOL_CALL_RESULT") {
		let e = a;
		if (e.content !== void 0 && B(e.contentParts).length > 0) throw Error("Invalid event: content carries both string content and content parts");
		e.content === void 0 && (e.content = B(e.contentParts).map((e) => {
			let t = rl(e);
			return t === void 0 && $c(), t;
		}).filter((e) => e !== void 0)), delete e.contentParts;
	}
	return a.type === "RUN_STARTED" && a.input !== void 0 && (a.input = ll(a.input)), cl(a), a;
}
// node_modules/.pnpm/compare-versions@6.1.1/node_modules/compare-versions/lib/esm/utils.js
var wl = /^[v^~<>=]*?(\d+)(?:\.([x*]|\d+)(?:\.([x*]|\d+)(?:\.([x*]|\d+))?(?:-([\da-z\-]+(?:\.[\da-z\-]+)*))?(?:\+[\da-z\-]+(?:\.[\da-z\-]+)*)?)?)?$/i, Tl = (e) => {
	if (typeof e != "string") throw TypeError("Invalid argument expected string");
	let t = e.match(wl);
	if (!t) throw Error(`Invalid argument not valid semver ('${e}' received)`);
	return t.shift(), t;
}, El = (e) => e === "*" || e === "x" || e === "X", Dl = (e) => {
	let t = parseInt(e, 10);
	return isNaN(t) ? e : t;
}, Ol = (e, t) => typeof e == typeof t ? [e, t] : [String(e), String(t)], kl = (e, t) => {
	if (El(e) || El(t)) return 0;
	let [n, r] = Ol(Dl(e), Dl(t));
	return n > r ? 1 : n < r ? -1 : 0;
}, Al = (e, t) => {
	for (let n = 0; n < Math.max(e.length, t.length); n++) {
		let r = kl(e[n] || "0", t[n] || "0");
		if (r !== 0) return r;
	}
	return 0;
}, jl = (e, t) => {
	let n = Tl(e), r = Tl(t), i = n.pop(), a = r.pop(), o = Al(n, r);
	return o === 0 ? i && a ? Al(i.split("."), a.split(".")) : i || a ? i ? -1 : 1 : 0 : o;
}, Ml = (e) => typeof e == "string" && /^[v\d]/.test(e) && wl.test(e), Nl = "@ag-ui/client";
function Pl(e) {
	if (!e.metadata || !Object.prototype.hasOwnProperty.call(e.metadata, "@ag-ui/client")) return;
	let t = e.metadata?.[Nl];
	if (!t || typeof t != "object" || Array.isArray(t)) return [];
	if (!Object.prototype.hasOwnProperty.call(t, "authoritativeActivityTypes")) return;
	let n = t.authoritativeActivityTypes;
	return n === null ? null : Array.isArray(n) && n.every((e) => typeof e == "string") ? n : [];
}
var V = (e) => {
	if (typeof structuredClone == "function") return structuredClone(e);
	try {
		return JSON.parse(JSON.stringify(e));
	} catch {
		return Array.isArray(e) ? [...e] : { ...e };
	}
};
function Fl() {
	return r();
}
function Il(e) {
	return e instanceof TypeError && /read[- ]?only|not extensible|cannot add property|cannot delete property|can't be deleted|unable to delete property|object is frozen|is not writable/i.test(e.message);
}
function Ll(e) {
	if (Object.freeze(e), typeof e == "object" && e) for (let t of Object.values(e)) typeof t == "object" && t && !Object.isFrozen(t) && Ll(t);
	return e;
}
var Rl = 524288;
function zl(e, t, n) {
	let r = 0, i = [e, t], a = /* @__PURE__ */ new WeakSet();
	for (; i.length > 0;) {
		let e = i.pop();
		if (typeof e == "string") {
			if (r += e.length, r > n) return !0;
		} else if (typeof e == "object" && e) {
			if (a.has(e)) continue;
			if (a.add(e), Array.isArray(e)) for (let t = 0; t < e.length; t++) i.push(e[t]);
			else {
				let t = Object.keys(e);
				for (let a = 0; a < t.length; a++) {
					let o = t[a];
					if (r += o.length, r > n) return !0;
					i.push(e[o]);
				}
			}
		}
	}
	return !1;
}
async function H(e, t, n, r) {
	let i = typeof process < "u" && process.env !== void 0, a = i && !!process.env.VITEST_WORKER_ID, o = i && !!process.env.VITEST_WORKER_ID, s = o && !zl(t, n, Rl), c = s ? V(t) : t, l = s ? V(n) : n, u = !1, d = !1, f;
	for (let t of e) try {
		s && (Ll(c), Ll(l));
		let e = await r(t, c, l);
		if (e === void 0) continue;
		let n = !1;
		if (e.messages !== void 0 && e.messages !== c && (c = V(e.messages), u = !0, n = !0), e.state !== void 0 && e.state !== l && (l = V(e.state), d = !0, n = !0), s && n && zl(c, l, Rl) && (s = !1), f = e.stopPropagation, f === !0) break;
	} catch (e) {
		if (a && e instanceof TypeError) throw e;
		s && o && Il(e) ? console.error("AG-UI: Subscriber attempted to mutate frozen inputs in-place. Return mutations via AgentStateMutation instead of mutating directly.", e) : console.error("Subscriber error:", e);
		continue;
	}
	return {
		...u ? { messages: Object.isFrozen(c) ? V(c) : c } : {},
		...d ? { state: Object.isFrozen(l) ? V(l) : l } : {},
		...f === void 0 ? {} : { stopPropagation: f }
	};
}
function Bl(e) {
	if (!e) return {
		enabled: !1,
		events: !1,
		lifecycle: !1,
		verbose: !1
	};
	if (e === !0) return {
		enabled: !0,
		events: !0,
		lifecycle: !0,
		verbose: !0
	};
	let t = e.events ?? !0, n = e.lifecycle ?? !0, r = e.verbose ?? !1;
	return {
		enabled: t || n,
		events: t,
		lifecycle: n,
		verbose: r
	};
}
function Vl(e) {
	if (e instanceof Hl) return e;
	if (e === !0) return new Hl(Bl(!0));
}
var Hl = class {
	constructor(e) {
		this.config = e;
	}
	event(e, t, n, r) {
		this.config.events && (this.config.verbose ? console.debug(`[${e}] ${t}`, typeof n == "string" ? n : JSON.stringify(n)) : console.debug(`[${e}] ${t}`, r ?? n));
	}
	lifecycle(e, t, n) {
		this.config.lifecycle && (n ? console.debug(`[${e}] ${t}`, n) : console.debug(`[${e}] ${t}`));
	}
	get eventsEnabled() {
		return this.config.events;
	}
	get lifecycleEnabled() {
		return this.config.lifecycle;
	}
	get enabled() {
		return this.config.enabled;
	}
};
function Ul(e) {
	return e.enabled ? new Hl(e) : void 0;
}
function Wl(e, t, n) {
	if (t) {
		let r = e.find((e) => e.id === t);
		if (r?.role === "assistant") return r;
		r && console.warn(`TOOL_CALL_START: parentMessageId '${t}' matches a '${r.role}' message, not assistant — falling back to toolCallId`);
		let i = {
			id: r ? n : t,
			role: "assistant",
			toolCalls: []
		};
		return e.push(i), i;
	}
	let r = {
		id: n,
		role: "assistant",
		toolCalls: []
	};
	return e.push(r), r;
}
function Gl(e, t) {
	return !e || t.metadata === void 0 ? !1 : (e.metadata = Ke(e.metadata, V(t.metadata)), !0);
}
var Kl = (e, t, n, r, i) => {
	let a = Vl(i), o = V(n.messages), s = V(e.state), c = {}, l = [], u = /* @__PURE__ */ new Set(), d = (e) => {
		let t = e.outcome?.type === "success" ? e.outcome.pendingToolCallIds : void 0;
		return t !== void 0 && t.length > 0 ? [...t] : l.filter((e) => !u.has(e));
	}, f = (e) => {
		e.messages !== void 0 && (o = e.messages, c.messages = e.messages), e.state !== void 0 && (s = e.state, c.state = e.state);
	}, p = () => {
		let e = V(c);
		return c = {}, e.messages !== void 0 || e.state !== void 0 ? D(e) : Jn;
	};
	return t.pipe(ci(async (t) => {
		let i = await H(r, o, s, (r, i, a) => r.onEvent?.({
			event: t,
			agent: n,
			input: e,
			messages: i,
			state: a
		}));
		if (f(i), i.stopPropagation === !0 ? a?.event("APPLY", "Event dropped:", t, {
			type: t.type,
			reason: "stopPropagation by subscriber"
		}) : a?.event("APPLY", "Event applied:", t, {
			type: t.type,
			subscribers: r.length
		}), i.stopPropagation === !0) return p();
		switch (t.type) {
			case b.TEXT_MESSAGE_START: {
				let i = await H(r, o, s, (r, i, a) => r.onTextMessageStartEvent?.({
					event: t,
					messages: i,
					state: a,
					agent: n,
					input: e
				}));
				if (f(i), i.stopPropagation !== !0) {
					let { messageId: e, role: n = "assistant", name: r, subagentRunId: i } = t, a = o.find((t) => t.id === e);
					if (a?.role === "activity") return console.warn(`TEXT_MESSAGE_START: Message '${e}' is an activity message — message ids must be unique across activity and text messages`), p();
					let s = a;
					if (!s) {
						let t = {
							id: e,
							role: n,
							content: "",
							...r !== void 0 && { name: r },
							...i != null && { subagentRunId: i }
						};
						o.push(t), s = t;
					}
					let c = Gl(s, t);
					(!a || c) && f({ messages: o });
				}
				return p();
			}
			case b.TEXT_MESSAGE_CONTENT: {
				let { messageId: i, delta: a } = t, c = o.find((e) => e.id === i);
				if (!c) return console.warn(`TEXT_MESSAGE_CONTENT: No message found with ID '${i}'`), p();
				if (c.role === "activity") return console.warn(`TEXT_MESSAGE_CONTENT: Message '${i}' is an activity message — message ids must be unique across activity and text messages`), p();
				let l = await H(r, o, s, (r, i, a) => r.onTextMessageContentEvent?.({
					event: t,
					messages: i,
					state: a,
					agent: n,
					input: e,
					textMessageBuffer: typeof c.content == "string" ? c.content : ""
				}));
				return f(l), l.stopPropagation !== !0 && (c.content = `${typeof c.content == "string" ? c.content : ""}${a}`, Gl(c, t), f({ messages: o })), p();
			}
			case b.TEXT_MESSAGE_END: {
				let { messageId: i } = t, a = o.find((e) => e.id === i);
				if (!a) return console.warn(`TEXT_MESSAGE_END: No message found with ID '${i}'`), p();
				if (a.role === "activity") return console.warn(`TEXT_MESSAGE_END: Message '${i}' is an activity message — message ids must be unique across activity and text messages`), p();
				let c = await H(r, o, s, (r, i, o) => r.onTextMessageEndEvent?.({
					event: t,
					messages: i,
					state: o,
					agent: n,
					input: e,
					textMessageBuffer: typeof a.content == "string" ? a.content : ""
				}));
				return f(c), c.stopPropagation !== !0 && Gl(a, t) && f({ messages: o }), await Promise.all(r.map((t) => {
					t.onNewMessage?.({
						message: a,
						messages: o,
						state: s,
						agent: n,
						input: e
					});
				})), p();
			}
			case b.TOOL_CALL_START: {
				let i = await H(r, o, s, (r, i, a) => r.onToolCallStartEvent?.({
					event: t,
					messages: i,
					state: a,
					agent: n,
					input: e
				}));
				if (f(i), i.stopPropagation !== !0) {
					let { toolCallId: e, toolCallName: n, parentMessageId: r, subagentRunId: i } = t;
					l.includes(e) || l.push(e);
					let a = o.find((t) => t.toolCalls?.some((t) => t.id === e))?.toolCalls?.find((t) => t.id === e);
					if (a) {
						let r = a.function.name !== n;
						return r && (console.warn(`TOOL_CALL_START: tool call '${e}' already exists with name '${a.function.name}' — updating it to '${n}'`), a.function.name = n), (Gl(a, t) || r) && f({ messages: o }), p();
					}
					let s = new Set(o.map((e) => e.id)), c = Wl(o, r, e);
					!s.has(c.id) && i != null && c.subagentRunId === void 0 && (c.subagentRunId = i), c.toolCalls ??= [];
					let u = {
						id: e,
						type: "function",
						function: {
							name: n,
							arguments: ""
						}
					};
					c.toolCalls.push(u), Gl(u, t), f({ messages: o });
				}
				return p();
			}
			case b.TOOL_CALL_ARGS: {
				let { toolCallId: i, delta: a } = t, c = o.find((e) => e.toolCalls?.some((e) => e.id === i));
				if (!c) return console.warn(`TOOL_CALL_ARGS: No message found containing tool call with ID '${i}'`), p();
				let l = c.toolCalls?.find((e) => e.id === i);
				if (!l) return console.warn(`TOOL_CALL_ARGS: No tool call found with ID '${i}'`), p();
				let u = await H(r, o, s, (r, i, a) => {
					let o = l.function.arguments, s = l.function.name, c = {};
					try {
						c = ji(o);
					} catch {}
					return r.onToolCallArgsEvent?.({
						event: t,
						messages: i,
						state: a,
						agent: n,
						input: e,
						toolCallBuffer: o,
						toolCallName: s,
						partialToolCallArgs: c
					});
				});
				return f(u), u.stopPropagation !== !0 && (l.function.arguments += a, Gl(l, t), f({ messages: o })), p();
			}
			case b.TOOL_CALL_END: {
				let { toolCallId: i } = t, a = o.find((e) => e.toolCalls?.some((e) => e.id === i));
				if (!a) return console.warn(`TOOL_CALL_END: No message found containing tool call with ID '${i}'`), p();
				let c = a.toolCalls?.find((e) => e.id === i);
				if (!c) return console.warn(`TOOL_CALL_END: No tool call found with ID '${i}'`), p();
				let l = await H(r, o, s, (r, i, a) => {
					let o = c.function.arguments, s = c.function.name, l = {};
					try {
						l = JSON.parse(o);
					} catch {}
					return r.onToolCallEndEvent?.({
						event: t,
						messages: i,
						state: a,
						agent: n,
						input: e,
						toolCallName: s,
						toolCallArgs: l
					});
				});
				return f(l), l.stopPropagation !== !0 && Gl(c, t) && f({ messages: o }), await Promise.all(r.map((t) => {
					t.onNewToolCall?.({
						toolCall: c,
						messages: o,
						state: s,
						agent: n,
						input: e
					});
				})), p();
			}
			case b.TOOL_CALL_RESULT: {
				let i = await H(r, o, s, (r, i, a) => r.onToolCallResultEvent?.({
					event: t,
					messages: i,
					state: a,
					agent: n,
					input: e
				}));
				if (f(i), i.stopPropagation !== !0) {
					let { messageId: i, toolCallId: a, content: c, role: l, subagentRunId: d } = t;
					u.add(a);
					let p = {
						id: i,
						toolCallId: a,
						role: l || "tool",
						content: c,
						...d != null && { subagentRunId: d }
					};
					Gl(p, t);
					let m = o.findIndex((e) => e.role === "assistant" && e.toolCalls?.some((e) => e.id === a));
					if (m === -1) o.push(p);
					else {
						let e = m + 1;
						for (; e < o.length && o[e].role === "tool";) e++;
						o.splice(e, 0, p);
					}
					await Promise.all(r.map((t) => {
						t.onNewMessage?.({
							message: p,
							messages: o,
							state: s,
							agent: n,
							input: e
						});
					})), f({ messages: o });
				}
				return p();
			}
			case b.STATE_SNAPSHOT: {
				let i = await H(r, o, s, (r, i, a) => r.onStateSnapshotEvent?.({
					event: t,
					messages: i,
					state: a,
					agent: n,
					input: e
				}));
				if (f(i), i.stopPropagation !== !0) {
					let { snapshot: e } = t;
					s = e, f({ state: s });
				}
				return p();
			}
			case b.STATE_DELTA: {
				let i = await H(r, o, s, (r, i, a) => r.onStateDeltaEvent?.({
					event: t,
					messages: i,
					state: a,
					agent: n,
					input: e
				}));
				if (f(i), i.stopPropagation !== !0) {
					let { delta: e } = t;
					try {
						s = kt.applyPatch(s, e, !0, !1).newDocument, f({ state: s });
					} catch (t) {
						let n = t instanceof Error ? t.message : String(t);
						console.warn(`Failed to apply state patch:\nCurrent state: ${JSON.stringify(s, null, 2)}\nPatch operations: ${JSON.stringify(e, null, 2)}\nError: ${n}`);
					}
				}
				return p();
			}
			case b.MESSAGES_SNAPSHOT: {
				let i = await H(r, o, s, (r, i, a) => r.onMessagesSnapshotEvent?.({
					event: t,
					messages: i,
					state: a,
					agent: n,
					input: e
				}));
				if (f(i), i.stopPropagation !== !0) {
					let { messages: e } = t, n = e.map((e) => {
						if (e.subagentRunId !== null) return e;
						let t = { ...e };
						return delete t.subagentRunId, t;
					}), r = new Map(n.map((e) => [e.id, e])), i = Pl(t), a = n.some((e) => e.role === "activity"), s = n.some((e) => e.role === "reasoning"), c = (e) => e.role === "activity" && (i ? !i.includes(e.activityType) : i !== null && !a) || e.role === "reasoning" && !s;
					o = o.filter((e) => r.has(e.id) || c(e)).map((e) => r.get(e.id) ?? e);
					let l = new Set(o.map((e) => e.id));
					for (let e of n) l.has(e.id) || o.push(e);
					f({ messages: o });
				}
				return p();
			}
			case b.ACTIVITY_SNAPSHOT: {
				let i = t, a = o.findIndex((e) => e.id === i.messageId), c = a >= 0 ? o[a] : void 0, l = c?.role === "activity" ? c : void 0, u = i.replace ?? !0, d = await H(r, o, s, (t, r, a) => t.onActivitySnapshotEvent?.({
					event: i,
					messages: r,
					state: a,
					agent: n,
					input: e,
					activityMessage: l,
					existingMessage: c
				}));
				if (f(d), d.stopPropagation !== !0) {
					let t = {
						id: i.messageId,
						role: "activity",
						activityType: i.activityType,
						content: V(i.content),
						...i.subagentRunId != null && { subagentRunId: i.subagentRunId }
					}, c, d;
					a === -1 ? (o.push(t), c = t, d = t) : l ? (u && (o[a] = {
						...l,
						activityType: i.activityType,
						content: V(i.content),
						subagentRunId: i.subagentRunId
					}, i.subagentRunId ?? delete o[a].subagentRunId), d = o[a]) : u && (o[a] = t, c = t, d = t), Gl(d, i), f({ messages: o }), c && await Promise.all(r.map((t) => t.onNewMessage?.({
						message: c,
						messages: o,
						state: s,
						agent: n,
						input: e
					})));
				}
				return p();
			}
			case b.ACTIVITY_DELTA: {
				let i = t, a = o.findIndex((e) => e.id === i.messageId);
				if (a === -1) return p();
				let c = o[a];
				if (c.role !== "activity") return console.warn(`ACTIVITY_DELTA: Message '${i.messageId}' is not an activity message`), p();
				let l = c, u = await H(r, o, s, (t, r, a) => t.onActivityDeltaEvent?.({
					event: i,
					messages: r,
					state: a,
					agent: n,
					input: e,
					activityMessage: l
				}));
				if (f(u), u.stopPropagation !== !0) try {
					Gl(l, i) && f({ messages: o });
					let e = V(l.content ?? {}), t = kt.applyPatch(e, i.patch ?? [], !0, !1).newDocument;
					o[a] = {
						...l,
						content: V(t),
						activityType: i.activityType
					}, f({ messages: o });
				} catch (e) {
					let t = e instanceof Error ? e.message : String(e);
					console.warn(`Failed to apply activity patch for '${i.messageId}': ${t}`);
				}
				return p();
			}
			case b.RAW: return f(await H(r, o, s, (r, i, a) => r.onRawEvent?.({
				event: t,
				messages: i,
				state: a,
				agent: n,
				input: e
			}))), p();
			case b.CUSTOM: return f(await H(r, o, s, (r, i, a) => r.onCustomEvent?.({
				event: t,
				messages: i,
				state: a,
				agent: n,
				input: e
			}))), p();
			case b.RUN_STARTED: {
				let i = await H(r, o, s, (r, i, a) => r.onRunStartedEvent?.({
					event: t,
					messages: i,
					state: a,
					agent: n,
					input: e
				}));
				if (f(i), l = [], u = /* @__PURE__ */ new Set(), i.stopPropagation !== !0) {
					let e = t;
					if (e.input?.messages) {
						for (let t of e.input.messages) {
							let e = t;
							if (t.subagentRunId === null) {
								let n = { ...t };
								delete n.subagentRunId, e = n;
							}
							o.find((t) => t.id === e.id) || o.push(e);
						}
						f({ messages: o });
					}
				}
				return p();
			}
			case b.RUN_FINISHED: {
				let i = t, a = i.outcome?.type === "interrupt" ? {
					event: i,
					outcome: "interrupt",
					interrupts: i.outcome.interrupts
				} : i.outcome?.type === "cancelled" ? {
					event: i,
					outcome: "cancelled"
				} : {
					event: i,
					outcome: "success",
					result: i.result,
					pendingToolCallIds: d(i)
				}, c = await H(r, o, s, (t, r, i) => t.onRunFinishedEvent?.({
					...a,
					messages: r,
					state: i,
					agent: n,
					input: e
				}));
				return f(c), c.stopPropagation !== !0 && (n.pendingInterrupts = a.outcome === "interrupt" ? a.interrupts.map((e) => {
					if (e.subagentRunId !== null) return e;
					let t = { ...e };
					return delete t.subagentRunId, t;
				}) : []), p();
			}
			case b.RUN_ERROR: return f(await H(r, o, s, (r, i, a) => r.onRunErrorEvent?.({
				event: t,
				messages: i,
				state: a,
				agent: n,
				input: e
			}))), p();
			case b.STEP_STARTED: return f(await H(r, o, s, (r, i, a) => r.onStepStartedEvent?.({
				event: t,
				messages: i,
				state: a,
				agent: n,
				input: e
			}))), p();
			case b.STEP_FINISHED: return f(await H(r, o, s, (r, i, a) => r.onStepFinishedEvent?.({
				event: t,
				messages: i,
				state: a,
				agent: n,
				input: e
			}))), p();
			case b.TEXT_MESSAGE_CHUNK: throw Error("TEXT_MESSAGE_CHUNK must be transformed before being applied");
			case b.TOOL_CALL_CHUNK: throw Error("TOOL_CALL_CHUNK must be transformed before being applied");
			case b.REASONING_START: return f(await H(r, o, s, (r, i, a) => r.onReasoningStartEvent?.({
				event: t,
				messages: i,
				state: a,
				agent: n,
				input: e
			}))), p();
			case b.REASONING_MESSAGE_START: {
				let i = await H(r, o, s, (r, i, a) => r.onReasoningMessageStartEvent?.({
					event: t,
					messages: i,
					state: a,
					agent: n,
					input: e
				}));
				if (f(i), i.stopPropagation !== !0) {
					let { messageId: e, subagentRunId: n } = t, r = o.find((t) => t.id === e);
					if (r?.role === "activity") return console.warn(`REASONING_MESSAGE_START: Message '${e}' is an activity message — message ids must be unique across activity and reasoning messages`), p();
					let i = r;
					if (!i) {
						let t = {
							id: e,
							role: "reasoning",
							content: "",
							...n != null && { subagentRunId: n }
						};
						o.push(t), i = t;
					}
					let a = Gl(i, t);
					(!r || a) && f({ messages: o });
				}
				return p();
			}
			case b.REASONING_MESSAGE_CONTENT: {
				let { messageId: i, delta: a } = t, c = o.find((e) => e.id === i);
				if (!c) return console.warn(`REASONING_MESSAGE_CONTENT: No message found with ID '${i}'`), p();
				if (c.role === "activity") return console.warn(`REASONING_MESSAGE_CONTENT: Message '${i}' is an activity message — message ids must be unique across activity and reasoning messages`), p();
				let l = await H(r, o, s, (r, i, a) => r.onReasoningMessageContentEvent?.({
					event: t,
					messages: i,
					state: a,
					agent: n,
					input: e,
					reasoningMessageBuffer: typeof c.content == "string" ? c.content : ""
				}));
				return f(l), l.stopPropagation !== !0 && (c.content = `${typeof c.content == "string" ? c.content : ""}${a}`, Gl(c, t), f({ messages: o })), p();
			}
			case b.REASONING_MESSAGE_END: {
				let { messageId: i } = t, a = o.find((e) => e.id === i);
				if (!a) return console.warn(`REASONING_MESSAGE_END: No message found with ID '${i}'`), p();
				if (a.role === "activity") return console.warn(`REASONING_MESSAGE_END: Message '${i}' is an activity message — message ids must be unique across activity and reasoning messages`), p();
				let c = await H(r, o, s, (r, i, o) => r.onReasoningMessageEndEvent?.({
					event: t,
					messages: i,
					state: o,
					agent: n,
					input: e,
					reasoningMessageBuffer: typeof a.content == "string" ? a.content : ""
				}));
				return f(c), c.stopPropagation !== !0 && Gl(a, t) && f({ messages: o }), await Promise.all(r.map((t) => {
					t.onNewMessage?.({
						message: a,
						messages: o,
						state: s,
						agent: n,
						input: e
					});
				})), p();
			}
			case b.REASONING_MESSAGE_CHUNK: throw Error("REASONING_MESSAGE_CHUNK must be transformed before being applied");
			case b.REASONING_END: return f(await H(r, o, s, (r, i, a) => r.onReasoningEndEvent?.({
				event: t,
				messages: i,
				state: a,
				agent: n,
				input: e
			}))), p();
			case b.REASONING_ENCRYPTED_VALUE: {
				let { subtype: i, entityId: a, encryptedValue: l } = t, u = await H(r, o, s, (r, i, a) => r.onReasoningEncryptedValueEvent?.({
					event: t,
					messages: i,
					state: a,
					agent: n,
					input: e
				}));
				if (f(u), u.stopPropagation !== !0) {
					let e = !1;
					if (i === "tool-call") {
						for (let t of o) if (t.role === "assistant" && t.toolCalls) {
							let n = t.toolCalls.find((e) => e.id === a);
							if (n) {
								n.encryptedValue = l, e = !0;
								break;
							}
						}
					} else {
						let t = o.find((e) => e.id === a);
						t?.role !== "activity" && t && (t.encryptedValue = l, e = !0);
					}
					e && (c.messages = o);
				}
				return p();
			}
			case b.SUBAGENT_STARTED: return f(await H(r, o, s, (r, i, a) => r.onSubagentStartedEvent?.({
				event: t,
				messages: i,
				state: a,
				agent: n,
				input: e
			}))), p();
			case b.SUBAGENT_FINISHED: return f(await H(r, o, s, (r, i, a) => r.onSubagentFinishedEvent?.({
				event: t,
				messages: i,
				state: a,
				agent: n,
				input: e
			}))), p();
			case b.SUBAGENT_ERROR: return f(await H(r, o, s, (r, i, a) => r.onSubagentErrorEvent?.({
				event: t,
				messages: i,
				state: a,
				agent: n,
				input: e
			}))), p();
		}
		return t.type, p();
	}), ei(), r.length > 0 ? di({}) : (e) => e);
};
function ql(e, t) {
	typeof process < "u" && process.env !== void 0 && process.env.SUPPRESS_TRANSFORMATION_WARNINGS || console.warn(`[ag-ui][compat] Converting deprecated ${e} to ${t}. The old shape leaves the protocol after its shim window — see the repo-root DEPRECATIONS.md. Set SUPPRESS_TRANSFORMATION_WARNINGS=true to silence.`);
}
var Jl = (e) => (t) => {
	let n = Vl(e), r = /* @__PURE__ */ new Set(), i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Set(), s = {
		message: /* @__PURE__ */ new Map(),
		toolCall: /* @__PURE__ */ new Map(),
		activity: /* @__PURE__ */ new Map(),
		reasoning: /* @__PURE__ */ new Map()
	}, c = !1, l = !1, u = !1, d = /* @__PURE__ */ new Map(), f = (e) => {
		let t = d.get(e);
		return t || (t = /* @__PURE__ */ new Map(), d.set(e, t)), t;
	}, p = () => {
		for (let e of d.values()) if (e.size > 0) return !0;
		return !1;
	}, m = /* @__PURE__ */ new Map(), h = /* @__PURE__ */ new Set(), g = !1, ee = !1, te = () => {
		ee = !1, r.clear(), i.clear(), a.clear(), o.clear(), s.message.clear(), s.toolCall.clear(), s.activity.clear(), s.reasoning.clear(), d.clear(), m.clear(), h.clear(), c = !1, l = !1, g = !0;
	}, _ = (e, t) => {
		let n = e ?? [];
		if (Array.isArray(n)) for (let e of n) {
			if (!e || typeof e.id != "string") continue;
			if (e.subagentRunId === null) return new x(`Cannot send a message (id '${e.id}') with 'subagentRunId: null'. The field is optional — omit it entirely.`);
			let n = e.role === "reasoning" ? s.reasoning : e.role === "activity" ? s.activity : s.message;
			(t || !n.has(e.id)) && n.set(e.id, { subagentRunId: e.subagentRunId });
			for (let n of e.toolCalls ?? []) n && typeof n.id == "string" && (t || !s.toolCall.has(n.id)) && s.toolCall.set(n.id, { subagentRunId: e.subagentRunId ?? void 0 });
		}
	}, ne = (e, t, n, r, i) => {
		if (t !== void 0 && n && n.subagentRunId !== t) return new x(`Cannot send '${e}': subagentRunId '${t}' does not match the ${r} '${i}' opener's subagent '${n.subagentRunId ?? "(the parent agent)"}'.`);
	};
	return t.pipe($r((e) => {
		let t = e.type;
		if (n?.event("VERIFY", "Event:", e, { type: e.type }), l && t !== b.RUN_STARTED) return O(() => new x(`Cannot send event type '${t}': The run has already errored with 'RUN_ERROR'. No further events can be sent.`));
		if (c && t !== b.RUN_ERROR && t !== b.RUN_STARTED) return O(() => new x(`Cannot send event type '${t}': The run has already finished with 'RUN_FINISHED'. Start a new run with 'RUN_STARTED'.`));
		if (!u) {
			if (u = !0, t !== b.RUN_STARTED && t !== b.RUN_ERROR) return O(() => new x("First event must be 'RUN_STARTED'"));
		} else if (t === b.RUN_STARTED) {
			if (g && !c && !l) return O(() => new x("Cannot send 'RUN_STARTED' while a run is still active. The previous run must be finished with 'RUN_FINISHED' before starting a new run."));
			(c || l) && te();
		}
		if (e.subagentRunId === null) {
			ee || (ee = !0, ql("subagentRunId: null", "an absent field"));
			let { subagentRunId: t, ...n } = e;
			e = n;
		}
		if (t === b.SUBAGENT_STARTED || t === b.SUBAGENT_FINISHED || t === b.SUBAGENT_ERROR) {
			let n = t === b.SUBAGENT_STARTED ? [
				"description",
				"parentSubagentRunId",
				"parentToolCallId",
				"parentMessageId"
			] : t === b.SUBAGENT_FINISHED ? ["outcome"] : ["code"];
			for (let r of n) if (e[r] === null) return O(() => new x(`Cannot send '${t}' with '${r}: null'. The field is optional — omit it entirely.`));
			let r = e.outcome;
			if (r != null && r.type !== "success" && r.type !== "suspended") return O(() => new x(`Cannot send '${t}' with outcome type '${String(r.type)}'. The outcome is either { type: "success" } or { type: "suspended" }.`));
			if (r && r.interruptIds === null) return O(() => new x(`Cannot send '${t}' with 'outcome.interruptIds: null'. The field is optional — omit it entirely.`));
			if (r && Array.isArray(r.interruptIds) && r.interruptIds.some((e) => typeof e != "string")) return O(() => new x(`Cannot send '${t}' with a non-string entry in 'outcome.interruptIds'. Interrupt ids are strings.`));
		}
		if (t === b.RUN_FINISHED) {
			let t = e.outcome;
			if (t?.type === "interrupt" && Array.isArray(t.interrupts)) {
				for (let e of t.interrupts) if (e && e.subagentRunId === null) return O(() => new x(`Cannot send 'RUN_FINISHED' with an interrupt (id '${e.id}') carrying 'subagentRunId: null'. The field is optional — omit it entirely.`));
			}
		}
		switch (t) {
			case b.TEXT_MESSAGE_START: {
				let n = e.messageId;
				if (r.has(n)) return O(() => new x(`Cannot send 'TEXT_MESSAGE_START' event: A text message with ID '${n}' is already in progress. Complete it with 'TEXT_MESSAGE_END' first.`));
				let i = s.message.get(n);
				if (i) {
					let r = ne(t, e.subagentRunId, i, "message", n);
					if (r) return O(() => r);
				}
				return r.add(n), i || s.message.set(n, { subagentRunId: e.subagentRunId }), D(e);
			}
			case b.TEXT_MESSAGE_CONTENT: {
				let n = e.messageId;
				if (!r.has(n)) return O(() => new x(`Cannot send 'TEXT_MESSAGE_CONTENT' event: No active text message found with ID '${n}'. Start a text message with 'TEXT_MESSAGE_START' first.`));
				let i = ne(t, e.subagentRunId, s.message.get(n), "message", n);
				return i ? O(() => i) : D(e);
			}
			case b.TEXT_MESSAGE_END: {
				let n = e.messageId;
				if (!r.has(n)) return O(() => new x(`Cannot send 'TEXT_MESSAGE_END' event: No active text message found with ID '${n}'. A 'TEXT_MESSAGE_START' event must be sent first.`));
				let i = ne(t, e.subagentRunId, s.message.get(n), "message", n);
				return i ? O(() => i) : (r.delete(n), D(e));
			}
			case b.TOOL_CALL_START: {
				let n = e.toolCallId;
				if (i.has(n)) return O(() => new x(`Cannot send 'TOOL_CALL_START' event: A tool call with ID '${n}' is already in progress. Complete it with 'TOOL_CALL_END' first.`));
				let r = e.parentMessageId, a = e.subagentRunId, o;
				if (r !== void 0) {
					let e = s.message.get(r);
					if (e) {
						if (a !== void 0 && a !== e.subagentRunId) return O(() => new x(`Cannot send 'TOOL_CALL_START': subagentRunId '${a}' does not match its parent message '${r}' owner '${e.subagentRunId ?? "(the parent agent)"}'. A tool call belongs to the message that carries it.`));
						o = e;
					}
				}
				let c = s.toolCall.get(n);
				if (c) {
					let e = ne(t, a, c, "tool call", n);
					if (e) return O(() => e);
					if (a === void 0 && o && o.subagentRunId !== c.subagentRunId) return O(() => new x(`Cannot send 'TOOL_CALL_START': tool call '${n}' is owned by '${c.subagentRunId ?? "(the parent agent)"}' but its parent message '${r}' is owned by '${o.subagentRunId ?? "(the parent agent)"}'. A tool call belongs to the message that carries it.`));
				}
				return i.add(n), c || s.toolCall.set(n, a === void 0 ? o ?? { subagentRunId: void 0 } : { subagentRunId: a }), D(e);
			}
			case b.TOOL_CALL_ARGS: {
				let n = e.toolCallId;
				if (!i.has(n)) return O(() => new x(`Cannot send 'TOOL_CALL_ARGS' event: No active tool call found with ID '${n}'. Start a tool call with 'TOOL_CALL_START' first.`));
				let r = ne(t, e.subagentRunId, s.toolCall.get(n), "tool call", n);
				return r ? O(() => r) : D(e);
			}
			case b.TOOL_CALL_END: {
				let n = e.toolCallId;
				if (!i.has(n)) return O(() => new x(`Cannot send 'TOOL_CALL_END' event: No active tool call found with ID '${n}'. A 'TOOL_CALL_START' event must be sent first.`));
				let r = ne(t, e.subagentRunId, s.toolCall.get(n), "tool call", n);
				return r ? O(() => r) : (i.delete(n), D(e));
			}
			case b.STEP_STARTED: {
				let t = e.stepName, n = e.subagentRunId;
				return f(n).has(t) ? O(() => new x(`Step "${t}" is already active for 'STEP_STARTED'${n === void 0 ? "" : ` in subagent '${n}'`}`)) : (f(n).set(t, !0), D(e));
			}
			case b.STEP_FINISHED: {
				let t = e.stepName, n = e.subagentRunId;
				if (!f(n).has(t)) {
					let e, r = !1;
					for (let [i, a] of d) if (i !== n && a.has(t)) {
						e = i, r = !0;
						break;
					}
					return O(r ? () => new x(`Cannot send 'STEP_FINISHED' for step "${t}" attributed to ${n === void 0 ? "the parent agent" : `subagent '${n}'`}: that step is open under ${e === void 0 ? "the parent agent" : `subagent '${e}'`}. A step must be finished by whoever started it.`) : () => new x(`Cannot send 'STEP_FINISHED' for step "${t}" that was not started`));
				}
				return f(n).delete(t), D(e);
			}
			case b.ACTIVITY_SNAPSHOT: {
				let t = e.messageId;
				return s.activity.has(t) && e.replace === !1 || s.activity.set(t, { subagentRunId: e.subagentRunId }), D(e);
			}
			case b.TOOL_CALL_RESULT: {
				let t = e.messageId;
				return typeof t == "string" && s.message.set(t, { subagentRunId: e.subagentRunId }), D(e);
			}
			case b.REASONING_START:
			case b.REASONING_MESSAGE_START: {
				let n = e.messageId, r = t === b.REASONING_START, i = r ? a : o;
				if (i.has(n)) return O(() => new x(r ? `Cannot send 'REASONING_START' event: A reasoning span with ID '${n}' is already in progress. Complete it with 'REASONING_END' first.` : `Cannot send 'REASONING_MESSAGE_START' event: A reasoning message with ID '${n}' is already in progress. Complete it with 'REASONING_MESSAGE_END' first.`));
				let c = s.reasoning.get(n);
				if (c) {
					let r = ne(t, e.subagentRunId, c, "reasoning message", n);
					if (r) return O(() => r);
				}
				return i.add(n), c || s.reasoning.set(n, { subagentRunId: e.subagentRunId }), D(e);
			}
			case b.REASONING_MESSAGE_CONTENT:
			case b.REASONING_MESSAGE_END:
			case b.REASONING_END: {
				let n = e.messageId, r = t === b.REASONING_END, i = r ? a : o;
				if (!i.has(n)) return O(() => new x(r ? `Cannot send 'REASONING_END' event: No active reasoning span found with ID '${n}'. A 'REASONING_START' event must be sent first.` : `Cannot send '${t}' event: No active reasoning message found with ID '${n}'. Start a reasoning message with 'REASONING_MESSAGE_START' first.`));
				let c = ne(t, e.subagentRunId, s.reasoning.get(n), "reasoning message", n);
				return c ? O(() => c) : ((t === b.REASONING_END || t === b.REASONING_MESSAGE_END) && i.delete(n), D(e));
			}
			case b.REASONING_ENCRYPTED_VALUE: {
				let n = e.entityId, r = e.subtype, i = r === "tool-call" ? s.toolCall.get(n) : r === "message" ? s.message.get(n) ?? s.reasoning.get(n) : s.reasoning.get(n), a = r === "tool-call" ? "tool call" : r === "message" ? "message" : "reasoning message", o = ne(t, e.subagentRunId, i, a, n);
				return o ? O(() => o) : D(e);
			}
			case b.ACTIVITY_DELTA: {
				let n = e.messageId, r = ne(t, e.subagentRunId, s.activity.get(n), "activity", n);
				return r ? O(() => r) : D(e);
			}
			case b.SUBAGENT_STARTED: {
				if (typeof e.subagentRunId != "string") return O(() => new x("Cannot send 'SUBAGENT_STARTED' without a 'subagentRunId'."));
				if (typeof e.name != "string") return O(() => new x("Cannot send 'SUBAGENT_STARTED' without a 'name'."));
				let t = e.subagentRunId, n = e.parentSubagentRunId;
				return m.has(t) ? O(() => new x(`Cannot send 'SUBAGENT_STARTED': subagent '${t}' is already active. Finish it with 'SUBAGENT_FINISHED' first.`)) : h.has(t) ? O(() => new x(`Cannot send 'SUBAGENT_STARTED': subagent '${t}' has already finished in this run. Subagent IDs are per-invocation and cannot be reused.`)) : n !== void 0 && !m.has(n) && !h.has(n) ? O(() => new x(`Cannot send 'SUBAGENT_STARTED': parentSubagentRunId '${n}' has not been started in this run.`)) : (m.set(t, !0), D(e));
			}
			case b.SUBAGENT_FINISHED:
			case b.SUBAGENT_ERROR: {
				if (typeof e.subagentRunId != "string") return O(() => new x(`Cannot send '${t}' without a 'subagentRunId'.`));
				if (t === b.SUBAGENT_ERROR && typeof e.message != "string") return O(() => new x("Cannot send 'SUBAGENT_ERROR' without a 'message'."));
				let n = e.subagentRunId;
				return m.has(n) ? (m.delete(n), h.add(n), D(e)) : O(() => new x(`Cannot send '${t}': no active subagent found with ID '${n}'. A 'SUBAGENT_STARTED' event must be sent first.`));
			}
			case b.MESSAGES_SNAPSHOT:
				{
					let t = _(e.messages, !0);
					if (t) return O(() => t);
				}
				return D(e);
			case b.RUN_STARTED:
				g = !0;
				{
					let t = _((e.input ?? {}).messages, !1);
					if (t) return O(() => t);
				}
				return D(e);
			case b.RUN_FINISHED:
				if (p()) {
					let e = [];
					for (let [t, n] of d) for (let r of n.keys()) e.push(t === void 0 ? r : `${r} (subagent '${t}')`);
					let t = e.join(", ");
					return O(() => new x(`Cannot send 'RUN_FINISHED' while steps are still active: ${t}`));
				}
				if (r.size > 0) {
					let e = Array.from(r.keys()).join(", ");
					return O(() => new x(`Cannot send 'RUN_FINISHED' while text messages are still active: ${e}`));
				}
				if (o.size > 0) {
					let e = Array.from(o.keys()).join(", ");
					return O(() => new x(`Cannot send 'RUN_FINISHED' while reasoning messages are still active: ${e}`));
				}
				if (a.size > 0) {
					let e = Array.from(a.keys()).join(", ");
					return O(() => new x(`Cannot send 'RUN_FINISHED' while reasoning spans are still active: ${e}`));
				}
				if (i.size > 0) {
					let e = Array.from(i.keys()).join(", ");
					return O(() => new x(`Cannot send 'RUN_FINISHED' while tool calls are still active: ${e}`));
				}
				if (m.size > 0) {
					let e = Array.from(m.keys()).join(", ");
					return O(() => new x(`Cannot send 'RUN_FINISHED' while subagents are still active: ${e}`));
				}
				return c = !0, D(e);
			case b.RUN_ERROR: return l = !0, D(e);
			case b.CUSTOM: return D(e);
			default: return D(e);
		}
	}));
}, Yl = function(e) {
	return e.HEADERS = "headers", e.DATA = "data", e;
}({}), Xl = (e) => A(() => Or(e())).pipe(M((e) => {
	if (!e.ok) {
		let t = e.headers.get("content-type") || "";
		return Or(e.text()).pipe($r((n) => {
			let r = n;
			if (t.includes("application/json")) try {
				r = JSON.parse(n);
			} catch {}
			let i = Error(`HTTP ${e.status}: ${typeof r == "string" ? r : JSON.stringify(r)}`);
			return i.status = e.status, i.payload = r, O(() => i);
		}));
	}
	let t = {
		type: Yl.HEADERS,
		status: e.status,
		headers: e.headers
	}, n = e.body?.getReader();
	return n ? new w((e) => {
		let r = !1;
		return e.next(t), (async () => {
			try {
				for (; !e.closed;) {
					let { done: t, value: i } = await n.read();
					if (t) {
						r = !0;
						break;
					}
					let a = {
						type: Yl.DATA,
						data: i
					};
					e.next(a);
				}
				e.complete();
			} catch (t) {
				r = !0, e.error(t);
			}
		})(), () => {
			r || n.cancel().catch((e) => {
				e?.name !== "AbortError" && console.warn("Failed to cancel HTTP response stream:", e);
			});
		};
	}) : O(() => Error("Failed to getReader() from response"));
})), Zl = 10485760, Ql = (e, t) => {
	let n = Vl(t), r = new En(), i = new TextDecoder("utf-8", { fatal: !1 }), a = "";
	e.subscribe({
		next: (e) => {
			if (e.type !== Yl.HEADERS && e.type === Yl.DATA && e.data) {
				let t = i.decode(e.data, { stream: !0 });
				a += t;
				let n = a.split(/\n\n/);
				a = n.pop() || "";
				for (let e of n) o(e);
				if (a.length > Zl) {
					r.error(Error(`SSE buffer size exceeded maximum limit of ${Zl / 1048576} MB`));
					return;
				}
			}
		},
		error: (e) => r.error(e),
		complete: () => {
			a && (a += i.decode(), o(a)), r.complete();
		}
	});
	function o(e) {
		let t = e.split("\n"), i = [];
		for (let e of t) e.startsWith("data:") && i.push(e.slice(5).replace(/^ /, ""));
		if (i.length > 0) try {
			let e = i.join("\n"), t = JSON.parse(e);
			n?.event("SSE", "Event received:", t, { type: t?.type }), r.next(t);
		} catch (e) {
			r.error(e);
		}
	}
	return r.asObservable();
}, $l = 10485760, eu = () => typeof process < "u" && process.env !== void 0 && !!process.env.SUPPRESS_TRANSFORMATION_WARNINGS, tu = (e, t) => {
	let n = Vl(t), r = new En(), i = /* @__PURE__ */ new Uint8Array(), a = !1;
	e.subscribe({
		next: (e) => {
			if (e.type !== Yl.HEADERS && e.type === Yl.DATA && e.data) {
				let t = new Uint8Array(i.length + e.data.length);
				t.set(i, 0), t.set(e.data, i.length), i = t, o();
			}
		},
		error: (e) => r.error(e),
		complete: () => {
			if (o(), !a) {
				if (i.length > 0) {
					r.error(Error(`The binary stream ended mid-frame: ${i.length} trailing bytes could not be read as a complete message.`));
					return;
				}
				r.complete();
			}
		}
	});
	function o() {
		if (!a) for (; i.length >= 4;) {
			let e = 4 + new DataView(i.buffer, i.byteOffset, 4).getUint32(0, !1);
			if (e > $l) {
				r.error(Error(`Protobuf message size exceeded maximum limit of ${$l / 1048576} MB`));
				return;
			}
			if (i.length < e) break;
			try {
				let t = Cl(i.slice(4, e));
				n?.event("PROTO", "Event received:", t, { type: t.type }), r.next(t);
			} catch (e) {
				if (e instanceof _l) eu() || console.warn("[ag-ui][proto] Dropped an event this build does not know: the protocol has a variant this SDK predates.");
				else {
					let t = e instanceof Error ? e.message : String(e);
					a = !0, r.error(Error(`Failed to decode protocol buffer message: ${t}`));
					return;
				}
			}
			i = i.slice(e);
		}
	}
	return r.asObservable();
}, nu = (e, t) => {
	let n = Vl(t), r = new En(), i = new An(1), a = !1, o, s = !1, c = () => {
		s = !0, o?.unsubscribe();
	}, l = (e) => {
		c(), r.error(e);
	}, u = () => {
		c(), r.complete();
	};
	return o = e.subscribe({
		next: (e) => {
			if (i.next(e), e.type === Yl.HEADERS && !a) {
				a = !0;
				let t = e.headers.get("content-type");
				n?.lifecycle("HTTP", "Stream format detected:", {
					contentType: t,
					parser: t === "application/vnd.ag-ui.event+proto" ? "protobuf" : "sse"
				}), t === "application/vnd.ag-ui.event+proto" ? tu(i, n).subscribe({
					next: (e) => r.next(e),
					error: (e) => l(e),
					complete: () => u()
				}) : Ql(i, n).subscribe({
					next: (e) => {
						if (typeof e != "object" || !e || Array.isArray(e)) {
							let t = Error("Invalid event: the frame is not a JSON object.");
							n?.event("HTTP", "Event invalid:", {
								json: e,
								error: String(t)
							}), l(t);
							return;
						}
						let t = e;
						if (typeof t.type != "string" || t.type.length === 0) {
							let t = Error("Invalid event: the frame carries no event type.");
							n?.event("HTTP", "Event invalid:", {
								json: e,
								error: String(t)
							}), l(t);
						} else n?.event("HTTP", "Event received:", e, { type: t.type }), r.next(e);
					},
					error: (e) => {
						if (e?.name === "AbortError") r.next({
							type: b.RUN_ERROR,
							message: e.message || "Request aborted",
							code: "abort",
							rawEvent: e
						}), u();
						else return l(e);
					},
					complete: () => u()
				});
			} else a || l(Error("No headers event received before data events"));
		},
		error: (e) => {
			i.error(e), l(e);
		},
		complete: () => {
			i.complete();
		}
	}), s && o.unsubscribe(), r.asObservable();
}, ru = {
	TextMessageStart: "TextMessageStart",
	TextMessageContent: "TextMessageContent",
	TextMessageEnd: "TextMessageEnd",
	ActionExecutionStart: "ActionExecutionStart",
	ActionExecutionArgs: "ActionExecutionArgs",
	ActionExecutionEnd: "ActionExecutionEnd",
	ActionExecutionResult: "ActionExecutionResult",
	AgentStateMessage: "AgentStateMessage",
	MetaEvent: "MetaEvent",
	RunStarted: "RunStarted",
	RunFinished: "RunFinished",
	RunError: "RunError",
	NodeStarted: "NodeStarted",
	NodeFinished: "NodeFinished"
}, iu = (e) => {
	if (typeof e == "string") return e;
	if (!Array.isArray(e)) return;
	let t = e.filter((e) => e.type === "text").map((e) => e.text).filter((e) => e.length > 0);
	if (t.length !== 0) return t.join("\n");
};
function au(e, t) {
	return Je(t) && ou(`[ag-ui][legacy] The result of tool call '${e}' carries content parts the legacy protocol cannot represent; only its text parts are bridged and the rest is dropped.`), qe(t);
}
var ou = (e) => {
	typeof process < "u" && process.env !== void 0 && process.env.SUPPRESS_TRANSFORMATION_WARNINGS || console.warn(e);
}, su = (e, t, n) => (r) => {
	let i = {}, a = !0, o = !0, s = "", c = null, l = null, u = [], d = {}, f = !1, p = (e) => {
		typeof e == "object" && e && ("messages" in e && delete e.messages, i = e);
	};
	return r.pipe($r((r) => {
		switch (r.type) {
			case b.TEXT_MESSAGE_START: {
				let e = r;
				return [{
					type: ru.TextMessageStart,
					messageId: e.messageId,
					role: e.role
				}];
			}
			case b.TEXT_MESSAGE_CONTENT: {
				let e = r;
				return [{
					type: ru.TextMessageContent,
					messageId: e.messageId,
					content: e.delta
				}];
			}
			case b.TEXT_MESSAGE_END: {
				let e = r;
				return [{
					type: ru.TextMessageEnd,
					messageId: e.messageId
				}];
			}
			case b.TOOL_CALL_START: {
				let e = r;
				return u.push({
					id: e.toolCallId,
					type: "function",
					function: {
						name: e.toolCallName,
						arguments: ""
					}
				}), o = !0, d[e.toolCallId] = e.toolCallName, [{
					type: ru.ActionExecutionStart,
					actionExecutionId: e.toolCallId,
					actionName: e.toolCallName,
					parentMessageId: e.parentMessageId
				}];
			}
			case b.TOOL_CALL_ARGS: {
				let c = r, d = u.find((e) => e.id === c.toolCallId);
				if (!d) return ou(`[ag-ui][legacy] TOOL_CALL_ARGS: No tool call found with ID '${c.toolCallId}'`), [];
				d.function.arguments += c.delta;
				let f = !1;
				if (l) {
					let e = l.find((e) => e.tool == d.function.name);
					if (e) try {
						let t = JSON.parse(ji(d.function.arguments));
						e.tool_argument && e.tool_argument in t ? (p({
							...i,
							[e.state_key]: t[e.tool_argument]
						}), f = !0) : e.tool_argument || (p({
							...i,
							[e.state_key]: t
						}), f = !0);
					} catch {}
				}
				return [{
					type: ru.ActionExecutionArgs,
					actionExecutionId: c.toolCallId,
					args: c.delta
				}, ...f ? [{
					type: ru.AgentStateMessage,
					threadId: e,
					agentName: n,
					nodeName: s,
					runId: t,
					running: a,
					role: "assistant",
					state: JSON.stringify(i),
					active: o
				}] : []];
			}
			case b.TOOL_CALL_END: {
				let e = r;
				return [{
					type: ru.ActionExecutionEnd,
					actionExecutionId: e.toolCallId
				}];
			}
			case b.TOOL_CALL_RESULT: {
				let e = r, t = d[e.toolCallId];
				return (t === void 0 || t === "") && ou(`[ag-ui][legacy] No usable tool name was seen for tool call '${e.toolCallId}' (${t === void 0 ? "no TOOL_CALL_START reached this bridge" : "its TOOL_CALL_START carried an empty toolCallName"}), so its result is being bridged with the fabricated action name "unknown". Downstream consumers route on that name.`), [{
					type: ru.ActionExecutionResult,
					actionExecutionId: e.toolCallId,
					result: au(e.toolCallId, e.content),
					actionName: t || "unknown"
				}];
			}
			case b.RAW: return f || (f = !0, ou("[ag-ui][legacy] Dropping RAW events: the legacy runtime protocol has no equivalent, so the provider payloads they carry do not reach the legacy stream. Reported once per stream.")), [];
			case b.CUSTOM: {
				let e = r;
				switch (e.name) {
					case "Exit":
						a = !1;
						break;
					case "PredictState": l = e.value;
				}
				return [{
					type: ru.MetaEvent,
					name: e.name,
					value: e.value
				}];
			}
			case b.STATE_SNAPSHOT: return p(r.snapshot), [{
				type: ru.AgentStateMessage,
				threadId: e,
				agentName: n,
				nodeName: s,
				runId: t,
				running: a,
				role: "assistant",
				state: JSON.stringify(i),
				active: o
			}];
			case b.STATE_DELTA: {
				let c = r, l;
				try {
					l = kt.applyPatch(i, c.delta, !0, !1).newDocument;
				} catch (e) {
					let t = e instanceof Error ? e.message : String(e);
					return ou(`[ag-ui][legacy] Failed to apply state patch:\nCurrent state: ${JSON.stringify(i, null, 2)}\nPatch operations: ${JSON.stringify(c.delta, null, 2)}\nError: ${t}`), [];
				}
				return p(l), [{
					type: ru.AgentStateMessage,
					threadId: e,
					agentName: n,
					nodeName: s,
					runId: t,
					running: a,
					role: "assistant",
					state: JSON.stringify(i),
					active: o
				}];
			}
			case b.MESSAGES_SNAPSHOT: return c = r.messages, [{
				type: ru.AgentStateMessage,
				threadId: e,
				agentName: n,
				nodeName: s,
				runId: t,
				running: a,
				role: "assistant",
				state: JSON.stringify({
					...i,
					...c ? { messages: c } : {}
				}),
				active: !0
			}];
			case b.RUN_STARTED: return [];
			case b.RUN_FINISHED: {
				if (c && (i.messages = c), Object.keys(i).length === 0) return [];
				let r = null;
				if (c) try {
					r = cu(c);
				} catch (e) {
					return [{
						type: ru.RunError,
						message: e.message
					}];
				}
				return [{
					type: ru.AgentStateMessage,
					threadId: e,
					agentName: n,
					nodeName: s,
					runId: t,
					running: a,
					role: "assistant",
					state: JSON.stringify({
						...i,
						...r ? { messages: r } : {}
					}),
					active: !1
				}];
			}
			case b.RUN_ERROR: {
				let e = r;
				return [{
					type: ru.RunError,
					message: e.message,
					code: e.code
				}];
			}
			case b.STEP_STARTED: return s = r.stepName, u = [], l = null, [{
				type: ru.AgentStateMessage,
				threadId: e,
				agentName: n,
				nodeName: s,
				runId: t,
				running: a,
				role: "assistant",
				state: JSON.stringify(i),
				active: !0
			}];
			case b.STEP_FINISHED: return u = [], l = null, [{
				type: ru.AgentStateMessage,
				threadId: e,
				agentName: n,
				nodeName: s,
				runId: t,
				running: a,
				role: "assistant",
				state: JSON.stringify(i),
				active: !1
			}];
			default: return [];
		}
	}));
};
function cu(e) {
	let t = [];
	for (let n of e) if (n.role === "assistant" || n.role === "user" || n.role === "system") {
		let e = iu(n.content);
		if (e) {
			let r = {
				id: n.id,
				role: n.role,
				content: e
			};
			t.push(r);
		}
		if (n.role === "assistant" && n.toolCalls && n.toolCalls.length > 0) for (let e of n.toolCalls) {
			let r;
			try {
				r = JSON.parse(e.function.arguments);
			} catch (t) {
				throw Error(`Failed to parse arguments for tool call '${e.id}' (${e.function.name}): ${t.message}`);
			}
			let i = {
				id: e.id,
				name: e.function.name,
				arguments: r,
				parentMessageId: n.id
			};
			t.push(i);
		}
	} else if (n.role === "tool") {
		let r = "unknown";
		for (let t of e) if (t.role === "assistant" && t.toolCalls?.length) {
			for (let e of t.toolCalls) if (e.id === n.toolCallId) {
				r = e.function.name;
				break;
			}
		}
		let i = {
			id: n.id,
			result: au(n.toolCallId, n.content),
			actionExecutionId: n.toolCallId,
			actionName: r
		};
		t.push(i);
	}
	return t;
}
var lu = (e) => e.kind === "tool" ? e.fields.toolCallId : e.fields.messageId, uu = (e) => e === "tool" ? "toolCallId" : "messageId", du = (e, t, n, r, i) => {
	if (r !== void 0 && r !== i) throw Error(`Cannot continue ${e} '${t}': chunk ${n} '${r}' does not match the open stream's ${n} ${i === void 0 ? "(absent)" : `'${i}'`}.`);
}, fu = (e, t) => t.metadata === void 0 ? e : {
	...e,
	metadata: t.metadata
}, pu = (e, t) => {
	let n = fu(e, t);
	return t.rawEvent === void 0 ? n : {
		...n,
		rawEvent: t.rawEvent
	};
}, mu = (e) => new Set(Object.keys(e.shape)), hu = mu(Li), gu = mu(Vi), _u = mu(Ga), vu = (e, t) => {
	let n;
	for (let r of Object.keys(e)) t.has(r) || ((n ??= {})[r] = e[r]);
	return n;
}, yu = (e) => {
	typeof process < "u" && process.env !== void 0 && process.env.SUPPRESS_TRANSFORMATION_WARNINGS || console.warn(`[ag-ui][transform] ${e} Set SUPPRESS_TRANSFORMATION_WARNINGS=true to silence.`);
}, bu = (e, t, n, r) => {
	if (t === void 0 || n || e.length === 0) return;
	let i = e[e.length - 1], a = Object.keys(t).filter((e) => Object.prototype.hasOwnProperty.call(i, e));
	a.length > 0 && yu(`A ${r} carried ${a.map((e) => `'${e}'`).join(", ")}, which the synthesized ${String(i.type)} already describes. The synthesized value is kept and the chunk's is dropped — this stage does not judge a described field, so the producer's value cannot be substituted for its own.`), e[e.length - 1] = {
		...t,
		...i
	};
}, xu = (e) => (t) => {
	let n = Vl(e), r = /* @__PURE__ */ new Map(), i = (e) => {
		let t = r.get(e);
		if (!t) return [];
		switch (r.delete(e), t.kind) {
			case "text": {
				let e = {
					type: b.TEXT_MESSAGE_END,
					messageId: t.fields.messageId,
					...t.fields.subagentRunId !== void 0 && { subagentRunId: t.fields.subagentRunId }
				};
				return n?.event("TRANSFORM", "TEXT_MESSAGE_END", e, { messageId: e.messageId }), [e];
			}
			case "tool": {
				let e = {
					type: b.TOOL_CALL_END,
					toolCallId: t.fields.toolCallId,
					...t.fields.subagentRunId !== void 0 && { subagentRunId: t.fields.subagentRunId }
				};
				return n?.event("TRANSFORM", "TOOL_CALL_END", e, { toolCallId: e.toolCallId }), [e];
			}
			case "reasoning": {
				let e = {
					type: b.REASONING_MESSAGE_END,
					messageId: t.fields.messageId,
					...t.fields.subagentRunId !== void 0 && { subagentRunId: t.fields.subagentRunId }
				};
				return n?.event("TRANSFORM", "REASONING_MESSAGE_END", e, { messageId: e.messageId }), [e];
			}
		}
	}, a = () => [...r.keys()].flatMap((e) => i(e)), o = (e, t) => {
		for (let [n, i] of r) if (i.kind === e && lu(i) === t) return { owner: n };
	}, s = (e, t, n, i, a) => {
		if (t !== void 0) {
			let r = o(e, t);
			if (r) {
				if (n !== void 0 && n !== r.owner) throw Error(`Cannot continue ${a} '${t}': chunk subagentRunId '${n}' does not match the open stream's subagent '${r.owner ?? "(the parent agent)"}'.`);
				return r.owner;
			}
			return n;
		}
		if (n !== void 0) return n;
		if (r.get(void 0)?.kind === e) return;
		let s = [...r.entries()].filter(([, t]) => t.kind === e);
		if (s.length === 1) return s[0][0];
		if (s.length > 1) throw Error(`Ambiguous ${i}: it carries neither a ${uu(e)} nor a subagentRunId, but ${s.length} lanes have an open ${a}. Attribute the chunk to the subagent it belongs to.`);
	};
	return t.pipe($r((e) => {
		switch (e.type) {
			case b.TEXT_MESSAGE_START:
			case b.TEXT_MESSAGE_CONTENT:
			case b.TEXT_MESSAGE_END:
			case b.TOOL_CALL_START:
			case b.TOOL_CALL_ARGS:
			case b.TOOL_CALL_END:
			case b.TOOL_CALL_RESULT:
			case b.STATE_SNAPSHOT:
			case b.STATE_DELTA:
			case b.CUSTOM:
			case b.STEP_STARTED:
			case b.STEP_FINISHED:
			case b.REASONING_START:
			case b.REASONING_MESSAGE_START:
			case b.REASONING_MESSAGE_CONTENT:
			case b.REASONING_MESSAGE_END:
			case b.REASONING_END: return [...i(e.subagentRunId ?? void 0), e];
			case b.RUN_STARTED:
			case b.RUN_FINISHED:
			case b.RUN_ERROR:
			case b.MESSAGES_SNAPSHOT: return [...a(), e];
			case b.RAW:
			case b.ACTIVITY_SNAPSHOT:
			case b.ACTIVITY_DELTA:
			case b.REASONING_ENCRYPTED_VALUE:
			case b.SUBAGENT_STARTED: return [e];
			case b.SUBAGENT_FINISHED:
			case b.SUBAGENT_ERROR: {
				let t = e.subagentRunId;
				return t == null ? [e] : [...i(t), e];
			}
			case b.TEXT_MESSAGE_CHUNK: {
				let t = e, a = vu(e, hu), o = s("text", t.messageId, t.subagentRunId ?? void 0, "TEXT_MESSAGE_CHUNK", "text message"), c = r.get(o), l = [], u = !1, d;
				if (c?.kind === "text" && (t.messageId === void 0 || t.messageId === c.fields.messageId)) du("text message", c.fields.messageId, "role", t.role, c.fields.role), du("text message", c.fields.messageId, "name", t.name, c.fields.name), d = c.fields;
				else {
					if (l.push(...i(o)), t.messageId === void 0) throw Error("First TEXT_MESSAGE_CHUNK must have a messageId");
					d = {
						messageId: t.messageId,
						role: t.role === void 0 ? "assistant" : t.role,
						name: t.name,
						subagentRunId: t.subagentRunId
					}, r.set(o, {
						kind: "text",
						fields: d
					});
					let e = fu({
						type: b.TEXT_MESSAGE_START,
						messageId: t.messageId,
						role: d.role,
						...t.name !== void 0 && { name: t.name },
						...t.subagentRunId !== void 0 && { subagentRunId: t.subagentRunId }
					}, t);
					l.push(e), n?.event("TRANSFORM", "TEXT_MESSAGE_START", e, { messageId: t.messageId });
				}
				if (t.delta !== void 0 || t.rawEvent !== void 0) {
					let e = t.subagentRunId === void 0 ? d.subagentRunId : t.subagentRunId, r = pu({
						...a,
						type: b.TEXT_MESSAGE_CONTENT,
						messageId: d.messageId,
						delta: t.delta === void 0 ? "" : t.delta,
						...e !== void 0 && { subagentRunId: e }
					}, t);
					l.push(r), u = !0, n?.event("TRANSFORM", "TEXT_MESSAGE_CONTENT", r, { messageId: d.messageId });
				}
				if (l.length === 0 && (t.metadata !== void 0 || t.rawEvent !== void 0 || t.subagentRunId === null || a !== void 0)) {
					let e = t.subagentRunId === void 0 ? d.subagentRunId : t.subagentRunId;
					l.push({
						...a,
						type: b.TEXT_MESSAGE_CONTENT,
						messageId: d.messageId,
						delta: "",
						...t.metadata !== void 0 && { metadata: t.metadata },
						...t.rawEvent !== void 0 && { rawEvent: t.rawEvent },
						...e !== void 0 && { subagentRunId: e }
					}), u = !0;
				}
				return bu(l, a, u, "TEXT_MESSAGE_CHUNK"), l;
			}
			case b.TOOL_CALL_CHUNK: {
				let t = e, a = vu(e, gu), o = s("tool", t.toolCallId, t.subagentRunId ?? void 0, "TOOL_CALL_CHUNK", "tool call"), c = r.get(o), l = [], u = !1, d;
				if (c?.kind === "tool" && (t.toolCallId === void 0 || t.toolCallId === c.fields.toolCallId)) du("tool call", c.fields.toolCallId, "toolCallName", t.toolCallName, c.fields.toolCallName), du("tool call", c.fields.toolCallId, "parentMessageId", t.parentMessageId, c.fields.parentMessageId), d = c.fields;
				else {
					if (l.push(...i(o)), t.toolCallId === void 0) throw Error("First TOOL_CALL_CHUNK must have a toolCallId");
					if (t.toolCallName === void 0) throw Error("First TOOL_CALL_CHUNK must have a toolCallName");
					d = {
						toolCallId: t.toolCallId,
						toolCallName: t.toolCallName,
						parentMessageId: t.parentMessageId,
						subagentRunId: t.subagentRunId
					}, r.set(o, {
						kind: "tool",
						fields: d
					});
					let e = fu({
						type: b.TOOL_CALL_START,
						toolCallId: t.toolCallId,
						toolCallName: t.toolCallName,
						...t.parentMessageId !== void 0 && { parentMessageId: t.parentMessageId },
						...t.subagentRunId !== void 0 && { subagentRunId: t.subagentRunId }
					}, t);
					l.push(e), n?.event("TRANSFORM", "TOOL_CALL_START", e, {
						toolCallId: t.toolCallId,
						toolCallName: t.toolCallName
					});
				}
				if (t.delta !== void 0 || t.rawEvent !== void 0) {
					let e = t.subagentRunId === void 0 ? d.subagentRunId : t.subagentRunId, r = pu({
						...a,
						type: b.TOOL_CALL_ARGS,
						toolCallId: d.toolCallId,
						delta: t.delta === void 0 ? "" : t.delta,
						...e !== void 0 && { subagentRunId: e }
					}, t);
					l.push(r), u = !0, n?.event("TRANSFORM", "TOOL_CALL_ARGS", r, { toolCallId: d.toolCallId });
				}
				if (l.length === 0 && (t.metadata !== void 0 || t.rawEvent !== void 0 || t.subagentRunId === null || a !== void 0)) {
					let e = t.subagentRunId === void 0 ? d.subagentRunId : t.subagentRunId;
					l.push({
						...a,
						type: b.TOOL_CALL_ARGS,
						toolCallId: d.toolCallId,
						delta: "",
						...t.metadata !== void 0 && { metadata: t.metadata },
						...t.rawEvent !== void 0 && { rawEvent: t.rawEvent },
						...e !== void 0 && { subagentRunId: e }
					}), u = !0;
				}
				return bu(l, a, u, "TOOL_CALL_CHUNK"), l;
			}
			case b.REASONING_MESSAGE_CHUNK: {
				let t = e, a = vu(e, _u), o = s("reasoning", t.messageId, t.subagentRunId ?? void 0, "REASONING_MESSAGE_CHUNK", "reasoning message"), c = r.get(o), l = [], u = !1, d;
				if (c?.kind === "reasoning" && (t.messageId === void 0 || t.messageId === c.fields.messageId)) d = c.fields;
				else {
					if (l.push(...i(o)), t.messageId === void 0) throw Error("First REASONING_MESSAGE_CHUNK must have a messageId");
					d = {
						messageId: t.messageId,
						subagentRunId: t.subagentRunId
					}, r.set(o, {
						kind: "reasoning",
						fields: d
					});
					let e = fu({
						type: b.REASONING_MESSAGE_START,
						messageId: t.messageId,
						role: "reasoning",
						...t.subagentRunId !== void 0 && { subagentRunId: t.subagentRunId }
					}, t);
					l.push(e), n?.event("TRANSFORM", "REASONING_MESSAGE_START", e, { messageId: t.messageId });
				}
				if (t.delta !== void 0 || t.rawEvent !== void 0) {
					let e = t.subagentRunId === void 0 ? d.subagentRunId : t.subagentRunId, r = pu({
						...a,
						type: b.REASONING_MESSAGE_CONTENT,
						messageId: d.messageId,
						delta: t.delta === void 0 ? "" : t.delta,
						...e !== void 0 && { subagentRunId: e }
					}, t);
					l.push(r), u = !0, n?.event("TRANSFORM", "REASONING_MESSAGE_CONTENT", r, { messageId: d.messageId });
				}
				if (l.length === 0 && (t.metadata !== void 0 || t.rawEvent !== void 0 || t.subagentRunId === null || a !== void 0)) {
					let e = t.subagentRunId === void 0 ? d.subagentRunId : t.subagentRunId;
					l.push({
						...a,
						type: b.REASONING_MESSAGE_CONTENT,
						messageId: d.messageId,
						delta: "",
						...t.metadata !== void 0 && { metadata: t.metadata },
						...t.rawEvent !== void 0 && { rawEvent: t.rawEvent },
						...e !== void 0 && { subagentRunId: e }
					}), u = !0;
				}
				return bu(l, a, u, "REASONING_MESSAGE_CHUNK"), l;
			}
		}
		return e.type, [e];
	}), xi(() => {
		a();
	}));
}, Su = Symbol("agui.strip.drop");
function Cu(e) {
	let t = e;
	for (;;) if (t instanceof te || t instanceof o || t instanceof re || t instanceof s || t instanceof le) t = t.unwrap();
	else if (t instanceof c) t = t.def.in;
	else if (t instanceof ce) t = t.def.getter();
	else return t;
}
function wu(e) {
	let t = e.def;
	return typeof t?.discriminator == "string" ? t.discriminator : void 0;
}
function Tu(e) {
	let t = e, n = Array.isArray(t.def?.values) ? t.def.values : t.values ? Array.from(t.values) : void 0;
	return n && n.length === 1 ? n[0] : t.value;
}
function Eu(e) {
	let t = Cu(e);
	return t instanceof ee ? Tu(t) : void 0;
}
function Du(e, t, n, r) {
	let i = Cu(t);
	if (i instanceof se) {
		if (typeof e != "object" || !e || Array.isArray(e)) return e;
		let t = i.shape, a = e, o = {}, s = i.meta()?.specOpen === !0;
		for (let e of Object.keys(a)) {
			let i = Object.prototype.hasOwnProperty.call(t, e) ? t[e] : void 0;
			if (i === void 0) {
				if (s) {
					o[e] = a[e];
					continue;
				}
				r.push(`${n}/${e}`);
				continue;
			}
			let c = r.length, l = Du(a[e], i, `${n}/${e}`, r);
			if (l === Su) {
				if (r.length = c, i.safeParse(void 0).success) {
					r.push(`${n}/${e}`);
					continue;
				}
				return Su;
			}
			o[e] = l;
		}
		return o;
	}
	if (i instanceof oe) {
		if (!Array.isArray(e)) return e;
		let t = i.element, a = [];
		return e.forEach((e, i) => {
			let o = r.length, s = Du(e, t, `${n}/${i}`, r);
			s === Su ? (r.length = o, r.push(`${n}/${i}`)) : a.push(s);
		}), a;
	}
	if (i instanceof m) {
		if (typeof e != "object" || !e || Array.isArray(e)) return e;
		let t = i.def.valueType, a = e, o = {};
		for (let e of Object.keys(a)) {
			let i = r.length, s = Du(a[e], t, `${n}/${e}`, r);
			s === Su ? (r.length = i, r.push(`${n}/${e}`)) : o[e] = s;
		}
		return o;
	}
	if (i instanceof ie) {
		let t = i.options, a = wu(i);
		if (a !== void 0) {
			if (typeof e != "object" || !e || Array.isArray(e)) return e;
			let i = e[a];
			for (let o of t) {
				let t = Cu(o);
				if (!(t instanceof se)) continue;
				let s = t.shape;
				if (Eu(s[a]) === i) return Du(e, o, n, r);
			}
			return Su;
		}
		let o = t.filter((e) => Cu(e) instanceof se), s = typeof e == "object" && !!e && !Array.isArray(e);
		if (o.length > 1 && s) return e;
		for (let i of t) {
			let t = Cu(i);
			if (t instanceof oe && Array.isArray(e) || t instanceof se && s) return Du(e, i, n, r);
		}
		return e;
	}
	return e;
}
function Ou(e, t) {
	let n = [], r = Du(e, t, "", n);
	if (r === Su) throw Error("Internal error: the stripper found the whole value unrecognisable, which the schemas are not supposed to allow — schema/stripper mismatch.");
	return {
		value: r,
		stripped: n
	};
}
var ku = new Set(Object.values(b));
function Au(e) {
	return ku.has(e.type);
}
var ju = new Map(to.options.map((e) => {
	let t = e.shape;
	return [String(Tu(t.type)), e];
})), Mu = () => typeof process < "u" && process.env !== void 0 && !!process.env.SUPPRESS_TRANSFORMATION_WARNINGS;
function Nu(e) {
	Mu() || console.warn(`[ag-ui][enforce] ${e}`);
}
var Pu = (e) => (t) => {
	let n = Vl(e);
	return t.pipe($r((e) => {
		if (!Au(e)) return Nu(`Dropping unrecognised event '${String(e.type)}': no middleware translated it and the protocol does not describe it.`), n?.event("ENFORCE", "Unrecognised event dropped:", e, { type: e.type }), Jn;
		let t = ju.get(e.type);
		if (t === void 0) throw Error(`No validator for recognised event type '${String(e.type)}'`);
		let { value: r, stripped: i } = Ou(e, t);
		for (let t of i) Nu(`Removed unrecognised material at '${t}' on ${String(e.type)}. Nothing handled it; see the repo-root DEPRECATIONS.md if it is a retired shape.`);
		return D(t.parse(r));
	}));
};
function Fu(e) {
	let { value: t, stripped: n } = Ou(We(e, "RunAgentInput"), ka);
	for (let e of n) Nu(`Removed unrecognised material at '${e}' from the outgoing input.`);
	return ka.parse(t);
}
var Iu = class {
	runNext(e, t) {
		return t.run(e).pipe(xu(!1));
	}
	runNextWithState(e, t) {
		let n = V(e.messages || []), r = V(e.state === void 0 ? {} : e.state), i = new An();
		return Kl(e, i, t, []).subscribe({
			next: (e) => {
				e.messages !== void 0 && (n = e.messages), e.state !== void 0 && (r = e.state);
			},
			error: () => {}
		}), this.runNext(e, t).pipe(ci(async (e) => (i.next(e), await new Promise((e) => setTimeout(e, 0)), {
			event: e,
			messages: V(n),
			state: V(r)
		})));
	}
}, Lu = class extends Iu {
	constructor(e) {
		super(), this.fn = e;
	}
	run(e, t) {
		return this.fn(e, t);
	}
};
function Ru(e) {
	return e.startsWith("image/") ? "image" : e.startsWith("audio/") ? "audio" : e.startsWith("video/") ? "video" : "document";
}
function zu(e) {
	return typeof e == "object" && !!e && "type" in e && e.type === "binary" && "mimeType" in e && typeof e.mimeType == "string";
}
function Bu(e) {
	let t = Ru(e.mimeType);
	return e.data ? {
		type: t,
		source: {
			type: "data",
			value: e.data,
			mimeType: e.mimeType
		},
		...e.filename ? { metadata: { filename: e.filename } } : {}
	} : e.url ? {
		type: t,
		source: {
			type: "url",
			value: e.url,
			mimeType: e.mimeType
		},
		...e.filename ? { metadata: { filename: e.filename } } : {}
	} : (typeof process < "u" && process.env !== void 0 && process.env.SUPPRESS_TRANSFORMATION_WARNINGS || console.warn(`[ag-ui][compat] A binary content part carries only an id ('${e.id ?? ""}') and cannot be converted to a modern media part; a 1.0 peer will not accept it. Provide data or a url. See the repo-root DEPRECATIONS.md.`), e);
}
function Vu(e, t, n) {
	if (typeof e != "object" || !e || !("type" in e) || e.type !== t.type || !("source" in e)) return !1;
	let r = e.source;
	return typeof r != "object" || !r || !("type" in r) || r.type !== t.source.type || !("value" in r) || r.value !== t.source.value || !("mimeType" in r) || r.mimeType !== t.source.mimeType ? !1 : !n || "metadata" in e && typeof e.metadata == "object" && e.metadata !== null && "filename" in e.metadata && e.metadata.filename === n;
}
function Hu(e) {
	let t = e.content;
	if (!Array.isArray(t)) return e;
	let n = t.flatMap((e) => {
		if (zu(e)) {
			let n = Bu(e);
			return n.type !== "binary" && t.some((t) => Vu(t, n, e.filename)) ? [] : [n];
		}
		return [e];
	});
	return {
		...e,
		content: n
	};
}
var Uu = "THINKING_START", Wu = "THINKING_END", Gu = "THINKING_TEXT_MESSAGE_START", Ku = "THINKING_TEXT_MESSAGE_CONTENT", qu = "THINKING_TEXT_MESSAGE_END";
function Ju(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
var Yu = {
	event: ["rawEvent", "subagentRunId"],
	[b.RUN_STARTED]: ["parentRunId", "input"],
	[b.RUN_FINISHED]: ["result", "outcome"],
	[b.RUN_ERROR]: ["usage"],
	[b.SUBAGENT_FINISHED]: ["result"],
	[b.TOOL_CALL_START]: ["parentMessageId"],
	[b.TOOL_CALL_CHUNK]: ["parentMessageId"],
	[b.TOOL_CALL_RESULT]: ["role"],
	"RUN_FINISHED.outcome": ["pendingToolCallIds"],
	"RUN_FINISHED.usage[]": [
		"provider",
		"reasoningTokens",
		"cachedInputTokens",
		"cacheWriteInputTokens"
	],
	RunAgentInput: ["forwardedProps"],
	Tool: ["parameters"],
	ResumeEntry: ["payload"],
	"input content": ["metadata"]
}, Xu = new Map(Object.entries(Yu).filter(([e]) => Object.values(b).includes(e))), Zu = (e) => ql(e, "an absent field");
function Qu(e, t, n, r) {
	if (!Ju(e)) return e;
	let i;
	for (let a of t) e[a] === null && (r(n === void 0 ? `${a}: null` : `${n}.${a}: null`), i ??= { ...e }, delete i[a]);
	return i ?? e;
}
function $u(e, t, n) {
	if (!Ju(e) || !Array.isArray(e[t])) return e;
	let r = e[t], i = r.map(n);
	return i.some((e, t) => e !== r[t]) ? {
		...e,
		[t]: i
	} : e;
}
function ed(e, t) {
	return $u(e, "content", (e) => {
		if (!Ju(e)) return e;
		switch (e.type) {
			case "image":
			case "audio":
			case "video":
			case "document": return Qu(e, Yu["input content"], `${e.type} input content`, t);
			default: return e;
		}
	});
}
function td(e, t = Zu) {
	let n = Qu(e, Yu.RunAgentInput, "RunAgentInput", t);
	return n = $u(n, "tools", (e) => Qu(e, Yu.Tool, "Tool", t)), n = $u(n, "resume", (e) => Qu(e, Yu.ResumeEntry, "ResumeEntry", t)), $u(n, "messages", (e) => ed(e, t));
}
var nd = class extends Iu {
	constructor(...e) {
		super(...e), this.currentReasoningId = null, this.currentMessageId = null, this.nullsNoticedThisRun = /* @__PURE__ */ new Set(), this.noticeNullOncePerRun = (e) => {
			this.nullsNoticedThisRun.has(e) || (this.nullsNoticedThisRun.add(e), ql(e, "an absent field"));
		};
	}
	warn(e, t) {
		ql(e, t);
	}
	mintedContinuationId(e, t) {
		if (t !== null) return t;
		let n = Fl();
		return this.warnAside(`Minting a messageId ('${n}') for ${e}: no THINKING opener preceded it, so there was no id to continue. The id is this client's invention, not the producer's, and verification will reject the translated event for naming something nothing opened.`), n;
	}
	warnAside(e) {
		typeof process < "u" && process.env !== void 0 && process.env.SUPPRESS_TRANSFORMATION_WARNINGS || console.warn(`[ag-ui][compat] ${e} Set SUPPRESS_TRANSFORMATION_WARNINGS=true to silence.`);
	}
	run(e, t) {
		return this.currentReasoningId = null, this.currentMessageId = null, this.nullsNoticedThisRun.clear(), e.messages = e.messages.map(Hu), t.run(e).pipe(k((e) => this.transformEvent(e)));
	}
	transformEvent(e) {
		let t = this.noticeNullOncePerRun;
		e.type === b.RUN_STARTED && this.nullsNoticedThisRun.clear(), e = Qu(e, Yu.event, void 0, t);
		let n = Xu.get(e.type);
		switch (n && (e = Qu(e, n, e.type, t)), e.type) {
			case Uu: {
				this.currentReasoningId = Fl();
				let { title: t, ...n } = e;
				return this.warn(Uu, b.REASONING_START), t !== void 0 && this.warnAside(`Dropping ${Uu}.title ${JSON.stringify(t)}: ${b.REASONING_START} has no title field, so the span's label cannot be carried and nothing downstream can recover it.`), {
					...n,
					type: b.REASONING_START,
					messageId: this.currentReasoningId
				};
			}
			case Gu: return this.currentMessageId = Fl(), this.warn(Gu, b.REASONING_MESSAGE_START), {
				...e,
				type: b.REASONING_MESSAGE_START,
				messageId: this.currentMessageId,
				role: "reasoning"
			};
			case Ku: {
				let { delta: t, ...n } = e;
				return this.warn(Ku, b.REASONING_MESSAGE_CONTENT), {
					...n,
					type: b.REASONING_MESSAGE_CONTENT,
					messageId: this.mintedContinuationId(Ku, this.currentMessageId),
					delta: t
				};
			}
			case qu: {
				let t = this.mintedContinuationId(qu, this.currentMessageId);
				return this.currentMessageId = null, this.warn(qu, b.REASONING_MESSAGE_END), {
					...e,
					type: b.REASONING_MESSAGE_END,
					messageId: t
				};
			}
			case Wu: {
				let t = this.mintedContinuationId(Wu, this.currentReasoningId);
				return this.currentReasoningId = null, this.warn(Wu, b.REASONING_END), {
					...e,
					type: b.REASONING_END,
					messageId: t
				};
			}
			case b.RUN_FINISHED: {
				let n = e, r = Qu(n.outcome, Yu["RUN_FINISHED.outcome"], "RUN_FINISHED.outcome", t);
				return $u(r === n.outcome ? n : {
					...n,
					outcome: r
				}, "usage", (e) => Qu(e, Yu["RUN_FINISHED.usage[]"], "RUN_FINISHED.usage[]", t));
			}
			case b.MESSAGES_SNAPSHOT: {
				let t = e;
				return Array.isArray(t.messages) ? {
					...t,
					messages: t.messages.map((e) => this.upgradeInboundMessage(e))
				} : e;
			}
			case b.RUN_STARTED: {
				let n = td(e.input, t), r = n === e.input ? e : {
					...e,
					input: n
				}, i = r;
				return !i.input || !Array.isArray(i.input.messages) ? r : {
					...i,
					input: {
						...i.input,
						messages: i.input.messages.map((e) => this.upgradeInboundMessage(e))
					}
				};
			}
			default: return e;
		}
	}
	upgradeInboundMessage(e) {
		e = ed(e, this.noticeNullOncePerRun);
		let t = e.content;
		return !Array.isArray(t) || !t.some((e) => typeof e == "object" && !!e && e.type === "binary") ? e : (this.warn("binary input content", "the modern media content parts"), Hu(e));
	}
}, rd = () => (e) => A(() => {
	let t = new nd();
	return e.pipe(k((e) => t.transformEvent(e)));
});
function id(e, t = /* @__PURE__ */ new Date()) {
	return e.expiresAt !== void 0 && new Date(e.expiresAt) <= t;
}
function ad() {
	return typeof process < "u" && process.env !== void 0 && !!process.env.SUPPRESS_TRANSFORMATION_WARNINGS;
}
function od(e) {
	ad() || console.warn(`[ag-ui][compat] Flattening message content for a <=0.0.39 peer DROPS non-text parts (${e.join(", ")}). The peer cannot receive them; upgrade it to keep media content. See the repo-root DEPRECATIONS.md.`);
}
function sd(e) {
	ad() || console.warn(`[ag-ui][compat] Not flattening message content for a <=0.0.39 peer: ${e} content part(s) claim type "text" but carry a malformed 'text' value. That is a defect in the message, not media the peer cannot represent, and a downgrade must not repair it — the content is passed on unchanged so the outgoing enforcement boundary reports it. See the repo-root DEPRECATIONS.md.`);
}
function cd(e) {
	let t = e.content;
	if (Array.isArray(t)) {
		let n = (e) => typeof e == "object" && !!e && "type" in e && e.type === "text", r = (e) => n(e) && typeof e.text == "string", i = t.filter((e) => n(e) && !r(e));
		if (i.length > 0) return sd(i.length), e;
		let a = t.filter((e) => !r(e)).map((e) => typeof e == "object" && e && "type" in e ? String(e.type) : typeof e);
		a.length > 0 && od(a);
		let o = t.filter(r).map((e) => e.text).join("");
		return {
			...e,
			content: o
		};
	}
	return typeof t == "string" ? e : t === void 0 ? {
		...e,
		content: ""
	} : e;
}
var ld = class extends Iu {
	run(e, t) {
		let { parentRunId: n, ...r } = e, i = {
			...r,
			messages: r.messages.map(cd)
		};
		return this.runNext(i, t);
	}
}, ud = "THINKING_START", dd = "THINKING_END", fd = "THINKING_TEXT_MESSAGE_START", pd = "THINKING_TEXT_MESSAGE_CONTENT", md = "THINKING_TEXT_MESSAGE_END", hd = class extends Iu {
	constructor(...e) {
		super(...e), this.currentReasoningId = null, this.currentMessageId = null;
	}
	warnAboutTransformation(e, t) {
		typeof process < "u" && process.env !== void 0 && process.env.SUPPRESS_TRANSFORMATION_WARNINGS || console.warn(`AG-UI is converting ${e} to ${t}. To remove this warning, upgrade your AG-UI integration package (e.g. @ag-ui/langgraph). To surpress it, set SUPPRESS_TRANSFORMATION_WARNINGS=true in your .env file.`);
	}
	run(e, t) {
		return this.currentReasoningId = null, this.currentMessageId = null, this.runNext(e, t).pipe(k((e) => this.transformEvent(e)));
	}
	transformEvent(e) {
		switch (e.type) {
			case ud: {
				this.currentReasoningId = Fl();
				let { title: t, ...n } = e;
				return this.warnAboutTransformation(ud, b.REASONING_START), {
					...n,
					type: b.REASONING_START,
					messageId: this.currentReasoningId
				};
			}
			case fd: return this.currentMessageId = Fl(), this.warnAboutTransformation(fd, b.REASONING_MESSAGE_START), {
				...e,
				type: b.REASONING_MESSAGE_START,
				messageId: this.currentMessageId,
				role: "reasoning"
			};
			case pd: {
				let { delta: t, ...n } = e;
				return this.warnAboutTransformation(pd, b.REASONING_MESSAGE_CONTENT), {
					...n,
					type: b.REASONING_MESSAGE_CONTENT,
					messageId: this.currentMessageId ?? Fl(),
					delta: t
				};
			}
			case md: {
				let t = this.currentMessageId ?? Fl();
				return this.warnAboutTransformation(md, b.REASONING_MESSAGE_END), {
					...e,
					type: b.REASONING_MESSAGE_END,
					messageId: t
				};
			}
			case dd: {
				let t = this.currentReasoningId ?? Fl();
				return this.warnAboutTransformation(dd, b.REASONING_END), {
					...e,
					type: b.REASONING_END,
					messageId: t
				};
			}
			default: return e;
		}
	}
}, gd = "SUBAGENT_STARTED", _d = "SUBAGENT_FINISHED", vd = "SUBAGENT_ERROR";
function yd(e) {
	if (e && typeof e == "object" && "subagentRunId" in e) {
		let { subagentRunId: t, ...n } = e;
		return n;
	}
	return e;
}
function bd(e) {
	return e.map((e) => yd(e));
}
var xd = class extends Iu {
	warnDroppedLifecycleEvent(e) {
		typeof process < "u" && process.env !== void 0 && process.env.SUPPRESS_TRANSFORMATION_WARNINGS || console.warn(`AG-UI is dropping ${e} because the target agent predates subagent support. To remove this warning, upgrade your AG-UI integration package. To suppress it, set SUPPRESS_TRANSFORMATION_WARNINGS=true in your .env file.`);
	}
	run(e, t) {
		let n = {
			...e,
			messages: (e.messages ?? []).map((e) => yd(e))
		};
		return this.runNext(n, t).pipe(Oi((e) => {
			let t = e.type;
			(t === gd || t === _d || t === vd) && this.warnDroppedLifecycleEvent(t);
		}), j((e) => {
			let t = e.type;
			return t !== gd && t !== _d && t !== vd;
		}), k((e) => {
			let t = yd(e);
			if (t.type === b.MESSAGES_SNAPSHOT) {
				let e = t;
				if (Array.isArray(e.messages)) return {
					...e,
					messages: bd(e.messages)
				};
			}
			if (t.type === b.RUN_FINISHED) {
				let e = t;
				if (e.outcome && Array.isArray(e.outcome.interrupts)) return {
					...e,
					outcome: {
						...e.outcome,
						interrupts: e.outcome.interrupts.map((e) => yd(e))
					}
				};
			}
			if (t.type === b.RUN_STARTED) {
				let e = t;
				if (e.input && Array.isArray(e.input.messages)) return {
					...e,
					input: {
						...e.input,
						messages: bd(e.input.messages)
					}
				};
			}
			return t;
		}));
	}
}, Sd = "1.0.2", Cd = !1, wd = /* @__PURE__ */ new WeakSet(), Td = (e, t) => /^\d+\.\d+$/.test(e) ? jl(e, t) > 0 ? "newer" : "not-newer" : "uninterpretable", Ed = (e) => {
	let t = e.protocolVersion;
	if (t !== void 0 && t !== "1.0") switch (Td(t, "1.0")) {
		case "uninterpretable":
			console.warn(`[ag-ui] The producer declared protocol version '${t}', which this client cannot interpret.`);
			return;
		case "newer":
			console.warn(`[ag-ui] The producer speaks protocol ${t}; this client speaks 1.0. Unrecognised material will be stripped with warnings.`);
			return;
		case "not-newer": return;
	}
}, Dd = class e {
	resolvePeerCeiling(t) {
		if (this.resolvingPeerCeiling) return Sd;
		let n = Object.getOwnPropertyDescriptor(this, "maxVersion"), r = Object.getOwnPropertyDescriptor(this, "maxProtocolVersion"), i = Object.getPrototypeOf(this);
		for (; i && i !== e.prototype;) n ??= Object.getOwnPropertyDescriptor(i, "maxVersion"), r ??= Object.getOwnPropertyDescriptor(i, "maxProtocolVersion"), i = Object.getPrototypeOf(i);
		if (t === "maxVersion" && n) return Sd;
		let a = t === "maxProtocolVersion" ? n : r;
		if (!a) return Sd;
		this.resolvingPeerCeiling = !0;
		try {
			return a.get ? a.get.call(this) : a.value;
		} finally {
			this.resolvingPeerCeiling = !1;
		}
	}
	get maxProtocolVersion() {
		return this.resolvePeerCeiling("maxProtocolVersion");
	}
	get maxVersion() {
		return !this.resolvingPeerCeiling && !Cd && (Cd = !0, console.warn("[ag-ui] AbstractAgent.maxVersion is deprecated — use maxProtocolVersion. Same value; the new name says whose version it is and that it is a ceiling.")), this.resolvePeerCeiling("maxVersion");
	}
	get debug() {
		return this._debug;
	}
	set debug(e) {
		this._debug = Bl(e), this._debugLogger = Ul(this._debug);
	}
	get debugLogger() {
		return this._debugLogger;
	}
	set debugLogger(e) {
		this._debugLogger = typeof e == "boolean" ? e ? Ul(Bl(!0)) : void 0 : e;
	}
	resolvedCeilingDuringConstruction() {
		let e = this.maxProtocolVersion;
		if (typeof e != "string" || !Ml(e)) throw new x(`maxProtocolVersion resolved to ${JSON.stringify(e)} during construction, which is not a version this client can compare. A ceiling read from an instance field is not available yet — return a literal from the getter.`);
		return e;
	}
	constructor({ agentId: e, description: t, threadId: n, initialMessages: i, initialState: a, debug: o } = {}) {
		this.subscribers = [], this.isRunning = !1, this.pendingInterrupts = [], this.middlewares = [], this.resolvingPeerCeiling = !1, this.agentId = e, this.description = t ?? "", this.threadId = n ?? r(), this.messages = V(i ?? []), this.state = V(a ?? {}), this._debug = Bl(o), this._debugLogger = Ul(this._debug);
		let s = this.resolvedCeilingDuringConstruction();
		jl(s, "0.0.39") <= 0 && this.middlewares.unshift(new ld()), jl(s, "0.0.45") <= 0 && this.middlewares.unshift(new hd()), jl(s, "0.0.57") <= 0 && this.middlewares.unshift(new xd());
	}
	subscribe(e) {
		return this.subscribers.push(e), { unsubscribe: () => {
			this.subscribers = this.subscribers.filter((t) => t !== e);
		} };
	}
	use(...e) {
		let t = e.map((e) => typeof e == "function" ? new Lu(e) : e);
		return this.middlewares.push(...t), this;
	}
	async runAgent(e, t) {
		try {
			this.isRunning = !0, this.agentId = this.agentId ?? r();
			let n = this.prepareRunAgentInput(e);
			this.debugLogger?.lifecycle("LIFECYCLE", "Run started:", {
				agentId: this.agentId,
				threadId: this.threadId
			});
			let i, a = new Set(this.messages.map((e) => e.id)), o = [
				{
					onRunStartedEvent: ({ event: e }) => Ed(e),
					onRunFinishedEvent: (e) => {
						e.outcome === "success" && (i = e.result);
					}
				},
				...this.subscribers,
				t ?? {}
			];
			wd.add(n), await this.onInitialize(n, o), this.activeRunDetach$ = new En();
			let s;
			this.activeRunCompletionPromise = new Promise((e) => {
				s = e;
			}), await Nr(vn(() => [...this.middlewares, new nd()].reduceRight((e, t) => ({
				run: (n) => t.run(n, e),
				get messages() {
					return e.messages;
				},
				get state() {
					return e.state;
				}
			}), this).run(n), Pu(this.debugLogger), xu(this.debugLogger), Jl(this.debugLogger), (e) => e.pipe(Di(this.activeRunDetach$)), (e) => this.applyBeforeSourceError(n, e, o), oi((e) => (this.debugLogger?.lifecycle("LIFECYCLE", "Run errored:", {
				agentId: this.agentId,
				error: e instanceof Error ? e.message : String(e)
			}), this.isRunning = !1, this.onError(n, e, o))), xi(() => {
				this.debugLogger?.lifecycle("LIFECYCLE", "Run finished:", {
					agentId: this.agentId,
					threadId: this.threadId
				}), this.isRunning = !1, this.onFinalize(n, o), s?.(), s = void 0, this.activeRunCompletionPromise = void 0, this.activeRunDetach$ = void 0;
			}))(D(null)));
			let c = V(this.messages).filter((e) => !a.has(e.id));
			return {
				result: i,
				newMessages: c
			};
		} finally {
			this.isRunning = !1;
		}
	}
	connect(e) {
		throw new Ge();
	}
	async connectAgent(e, t) {
		try {
			this.isRunning = !0, this.agentId = this.agentId ?? r();
			let n = this.prepareRunAgentInput(e), i, a = new Set(this.messages.map((e) => e.id)), o = [
				{
					onRunStartedEvent: ({ event: e }) => Ed(e),
					onRunFinishedEvent: (e) => {
						e.outcome === "success" && (i = e.result);
					}
				},
				...this.subscribers,
				t ?? {}
			];
			await this.onInitialize(n, o), this.activeRunDetach$ = new En();
			let s;
			this.activeRunCompletionPromise = new Promise((e) => {
				s = e;
			}), await Nr(vn(() => A(() => this.connect(n)), (e) => Pu(this.debugLogger)(rd()(e)), xu(this.debugLogger), Jl(this.debugLogger), (e) => e.pipe(Di(this.activeRunDetach$)), (e) => this.applyBeforeSourceError(n, e, o), oi((e) => (this.isRunning = !1, e instanceof Ge ? Jn : this.onError(n, e, o))), xi(() => {
				this.isRunning = !1, this.onFinalize(n, o), s?.(), s = void 0, this.activeRunCompletionPromise = void 0, this.activeRunDetach$ = void 0;
			}))(D(null)), { defaultValue: void 0 });
			let c = V(this.messages).filter((e) => !a.has(e.id));
			return {
				result: i,
				newMessages: c
			};
		} finally {
			this.isRunning = !1;
		}
	}
	abortRun() {}
	async detachActiveRun() {
		if (!this.activeRunDetach$) return;
		let e = this.activeRunCompletionPromise ?? Promise.resolve();
		this.activeRunDetach$.next(), this.activeRunDetach$?.complete(), await e;
	}
	applyBeforeSourceError(e, t, n) {
		return A(() => {
			let r, i = t.pipe(oi((e) => (r = { error: e }, Jn)));
			return this.processApplyEvents(e, this.apply(e, i, n), n).pipe(ui(A(() => {
				let e = r;
				return e ? O(() => e.error) : Jn;
			})));
		});
	}
	apply(e, t, n) {
		return Kl(e, t, this, n, this.debugLogger);
	}
	processApplyEvents(e, t, n) {
		return t.pipe(Oi((t) => {
			t.messages && (this.messages = t.messages, n.forEach((t) => {
				t.onMessagesChanged?.({
					messages: this.messages,
					state: this.state,
					agent: this,
					input: e
				});
			})), t.state !== void 0 && (this.state = t.state, n.forEach((t) => {
				t.onStateChanged?.({
					state: this.state,
					messages: this.messages,
					agent: this,
					input: e
				});
			}));
		}));
	}
	prepareRunAgentInput(e) {
		let t = V(this.messages);
		for (let e of t) e.subagentRunId === null && delete e.subagentRunId;
		let n = t.filter((e) => e.role !== "activity");
		return {
			threadId: this.threadId,
			runId: e?.runId || r(),
			...jl(this.maxProtocolVersion, Sd) >= 0 && { protocolVersion: "1.0" },
			tools: V(e?.tools ?? []),
			context: V(e?.context ?? []),
			forwardedProps: V(e?.forwardedProps ?? {}),
			state: V(this.state),
			messages: n,
			...e?.resume === void 0 ? {} : { resume: V(e.resume) }
		};
	}
	async onInitialize(e, t) {
		if (wd.has(e) && this.pendingInterrupts.length > 0) {
			let t = new Set((e.resume ?? []).map((e) => e.interruptId)), n = this.pendingInterrupts.map((e) => e.id).filter((e) => !t.has(e));
			if (n.length > 0) throw new x(`Thread has ${n.length} pending interrupt(s) not addressed by resume: ${n.join(", ")}`);
			for (let t of this.pendingInterrupts) if (id(t) && (e.resume ?? []).find((e) => e.interruptId === t.id)?.status !== "cancelled") throw new x(`Interrupt ${t.id} expired at ${t.expiresAt} and can no longer be answered. Cancel it to continue the thread.`);
		}
		let n = await H(t, this.messages, this.state, (t, n, r) => t.onRunInitialized?.({
			messages: n,
			state: r,
			agent: this,
			input: e
		}));
		if (n.messages !== void 0 || n.state !== void 0) {
			if (n.messages) {
				this.messages = n.messages;
				for (let e of n.messages) e.subagentRunId === null && delete e.subagentRunId;
				e.messages = n.messages.filter((e) => e.role !== "activity"), t.forEach((t) => {
					t.onMessagesChanged?.({
						messages: this.messages,
						state: this.state,
						agent: this,
						input: e
					});
				});
			}
			n.state !== void 0 && (this.state = n.state, e.state = n.state, t.forEach((t) => {
				t.onStateChanged?.({
					state: this.state,
					messages: this.messages,
					agent: this,
					input: e
				});
			}));
		}
	}
	onError(e, t, n) {
		return Or(H(n, this.messages, this.state, (n, r, i) => n.onRunFailed?.({
			error: t,
			messages: r,
			state: i,
			agent: this,
			input: e
		}))).pipe(k((r) => {
			let i = r;
			if ((i.messages !== void 0 || i.state !== void 0) && (i.messages !== void 0 && (this.messages = i.messages, n.forEach((t) => {
				t.onMessagesChanged?.({
					messages: this.messages,
					state: this.state,
					agent: this,
					input: e
				});
			})), i.state !== void 0 && (this.state = i.state, n.forEach((t) => {
				t.onStateChanged?.({
					state: this.state,
					messages: this.messages,
					agent: this,
					input: e
				});
			}))), i.stopPropagation !== !0) {
				let e = String(t);
				if (t.name !== "AbortError" && t.message !== "Fetch is aborted" && t.message !== "signal is aborted without reason" && t.message !== "component unmounted" && e !== "component unmounted") throw console.error("Agent execution failed:", t), t;
			}
			return {};
		}));
	}
	async onFinalize(e, t) {
		let n = await H(t, this.messages, this.state, (t, n, r) => t.onRunFinalized?.({
			messages: n,
			state: r,
			agent: this,
			input: e
		}));
		(n.messages !== void 0 || n.state !== void 0) && (n.messages !== void 0 && (this.messages = n.messages, t.forEach((t) => {
			t.onMessagesChanged?.({
				messages: this.messages,
				state: this.state,
				agent: this,
				input: e
			});
		})), n.state !== void 0 && (this.state = n.state, t.forEach((t) => {
			t.onStateChanged?.({
				state: this.state,
				messages: this.messages,
				agent: this,
				input: e
			});
		})));
	}
	clone() {
		let e = Object.create(Object.getPrototypeOf(this));
		return e.agentId = this.agentId, e.description = this.description, e.threadId = this.threadId, e.messages = V(this.messages), e.state = V(this.state), e._debug = this._debug, e._debugLogger = this._debugLogger, e.isRunning = this.isRunning, e.subscribers = [...this.subscribers], e.middlewares = [...this.middlewares], e.pendingInterrupts = V(this.pendingInterrupts), e;
	}
	addMessage(e) {
		this.messages.push(e), (async () => {
			for (let t of this.subscribers) await t.onNewMessage?.({
				message: e,
				messages: this.messages,
				state: this.state,
				agent: this
			});
			if (e.role === "assistant" && e.toolCalls) for (let t of e.toolCalls) for (let e of this.subscribers) await e.onNewToolCall?.({
				toolCall: t,
				messages: this.messages,
				state: this.state,
				agent: this
			});
			for (let e of this.subscribers) await e.onMessagesChanged?.({
				messages: this.messages,
				state: this.state,
				agent: this
			});
		})();
	}
	addMessages(e) {
		this.messages.push(...e), (async () => {
			for (let t of e) {
				for (let e of this.subscribers) await e.onNewMessage?.({
					message: t,
					messages: this.messages,
					state: this.state,
					agent: this
				});
				if (t.role === "assistant" && t.toolCalls) for (let e of t.toolCalls) for (let t of this.subscribers) await t.onNewToolCall?.({
					toolCall: e,
					messages: this.messages,
					state: this.state,
					agent: this
				});
			}
			for (let e of this.subscribers) await e.onMessagesChanged?.({
				messages: this.messages,
				state: this.state,
				agent: this
			});
		})();
	}
	setMessages(e) {
		this.messages = V(e), (async () => {
			for (let e of this.subscribers) await e.onMessagesChanged?.({
				messages: this.messages,
				state: this.state,
				agent: this
			});
		})();
	}
	setState(e) {
		this.state = V(e), (async () => {
			for (let e of this.subscribers) await e.onStateChanged?.({
				messages: this.messages,
				state: this.state,
				agent: this
			});
		})();
	}
	legacy_to_be_removed_runAgentBridged(e) {
		this.agentId = this.agentId ?? r();
		let t = this.prepareRunAgentInput(e);
		return [...this.middlewares, new nd()].reduceRight((e, t) => ({
			run: (n) => t.run(n, e),
			get messages() {
				return e.messages;
			},
			get state() {
				return e.state;
			}
		}), this).run(t).pipe(Pu(this.debugLogger), xu(this.debugLogger), Jl(this.debugLogger), su(this.threadId, t.runId, this.agentId), (e) => e.pipe(k((e) => (this.debugLogger?.event("LEGACY", "Event:", e, { type: e.type }), e))));
	}
};
function Od(e) {
	if (!Array.isArray(e.messages)) return e;
	let t = !1, n = e.messages.map((e) => {
		if (e.subagentRunId === null) {
			t = !0;
			let n = { ...e };
			return delete n.subagentRunId, n;
		}
		return e;
	});
	return t ? {
		...e,
		messages: n
	} : e;
}
var kd = class extends Dd {
	requestInit(e) {
		return {
			method: "POST",
			headers: {
				...this.headers,
				"Content-Type": "application/json",
				Accept: "text/event-stream"
			},
			body: JSON.stringify(Od(e)),
			signal: this.abortController.signal
		};
	}
	runAgent(e, t) {
		return this.abortController = e?.abortController ?? new AbortController(), super.runAgent(e, t);
	}
	abortRun() {
		this.abortController.abort(), super.abortRun();
	}
	constructor(e) {
		super(e), this.abortController = new AbortController(), this.url = e.url, this.headers = V(e.headers ?? {}), this.fetch = e.fetch ?? ((e, t) => fetch(e, t));
	}
	run(e) {
		return nu(Xl(() => this.fetch(this.url, this.requestInit(Fu(e)))), this.debugLogger);
	}
	clone() {
		let e = super.clone();
		e.url = this.url, e.headers = V(this.headers ?? {}), e.fetch = this.fetch;
		let t = new AbortController(), n = this.abortController.signal;
		return n.aborted && t.abort(n.reason), e.abortController = t, e;
	}
};
// node_modules/.pnpm/@copilotkit+shared@1.83.0_@ag-ui+core@1.0.2_zod@3.25.76_/node_modules/@copilotkit/shared/dist/utils/dashboard-url.mjs
function Ad(e) {
	let t = [
		"localhost",
		"127.0.0.1",
		"[::1]"
	].includes(e.hostname) || /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+localhost$/u.test(e.hostname);
	return !e.username && !e.password && (e.protocol === "https:" || e.protocol === "http:" && t);
}
// node_modules/.pnpm/@copilotkit+shared@1.83.0_@ag-ui+core@1.0.2_zod@3.25.76_/node_modules/@copilotkit/shared/dist/utils/inspector-metadata.mjs
function jd(e) {
	if (typeof e != "object" || !e || Array.isArray(e)) return !1;
	try {
		let t = Object.getPrototypeOf(e);
		return t === Object.prototype || t === null;
	} catch {
		return !1;
	}
}
function Md(e, t) {
	try {
		let n = Object.getOwnPropertyDescriptor(e, t);
		return n !== void 0 && "value" in n ? n.value : void 0;
	} catch {
		return;
	}
}
function Nd(e) {
	if (typeof e != "string") return;
	let t = e.trim();
	return t.length > 0 ? t : void 0;
}
function Pd(e) {
	if (!jd(e)) return;
	let t = Nd(e.organizationName), n = Nd(e.projectName);
	if (t !== void 0 && n !== void 0) return {
		organizationName: t,
		projectName: n
	};
}
function Fd(e) {
	if (!jd(e)) return;
	let t = Nd(e.code), n = Nd(e.label);
	if (t !== void 0 && n !== void 0) return {
		code: t,
		label: n
	};
}
function Id(e) {
	if (jd(e)) switch (e.state) {
		case "valid":
		case "none":
		case "expired":
		case "unknown": return { state: e.state };
		default: return;
	}
}
function Ld(e) {
	switch (e) {
		case "manage_plan":
		case "renew":
		case "enable_intelligence": return e;
		default: return;
	}
}
function Rd(e) {
	let t = Nd(e);
	if (t === void 0 || t.includes("?") || t.includes("#")) return;
	let n = t.indexOf("://");
	if (n < 1) return;
	let r = t.slice(n + 3), i = r.indexOf("/");
	if ((i === -1 ? r : r.slice(0, i)).includes("@")) return;
	let a;
	try {
		a = new URL(t);
	} catch {
		return;
	}
	if (!(a.hostname.length === 0 || a.username || a.password)) return Ad(a) ? t : void 0;
}
function zd(e) {
	if (!jd(e)) return;
	let t = Ld(e.kind), n = Rd(e.url);
	if (t !== void 0 && n !== void 0) return {
		kind: t,
		url: n
	};
}
function Bd(e) {
	return typeof e == "number" && Number.isSafeInteger(e) && e >= 0;
}
function Vd(e) {
	if (jd(e)) {
		if (e.kind === "finite") return typeof e.value != "number" || !Number.isSafeInteger(e.value) || e.value < 1 ? void 0 : {
			kind: "finite",
			value: e.value
		};
		if (e.kind === "unlimited") return { kind: "unlimited" };
		if (e.kind === "unknown") return { kind: "unknown" };
	}
}
function Hd(e) {
	if (!jd(e)) return;
	let t = Vd(e.limit), n = e.used;
	if (!Bd(n) || t === void 0) return;
	let r = Md(e, "expiringSoonCount"), i = Bd(r) ? r : void 0;
	return {
		used: n,
		limit: t,
		...i === void 0 ? {} : { expiringSoonCount: i }
	};
}
function Ud(e) {
	if (!jd(e) || e.schemaVersion !== 1) return;
	let t = Pd(e.identity), n = Fd(e.plan), r = Id(e.license), i = zd(e.action), a = Hd(e.usage);
	return {
		schemaVersion: 1,
		...t === void 0 ? {} : { identity: t },
		...n === void 0 ? {} : { plan: n },
		...r === void 0 ? {} : { license: r },
		...i === void 0 ? {} : { action: i },
		...a === void 0 ? {} : { usage: a }
	};
}
// node_modules/.pnpm/partial-json@0.1.7/node_modules/partial-json/dist/options.js
var Wd = /* @__PURE__ */ n(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.Allow = e.ALL = e.COLLECTION = e.ATOM = e.SPECIAL = e.INF = e._INFINITY = e.INFINITY = e.NAN = e.BOOL = e.NULL = e.OBJ = e.ARR = e.NUM = e.STR = void 0, e.STR = 1, e.NUM = 2, e.ARR = 4, e.OBJ = 8, e.NULL = 16, e.BOOL = 32, e.NAN = 64, e.INFINITY = 128, e._INFINITY = 256, e.INF = e.INFINITY | e._INFINITY, e.SPECIAL = e.NULL | e.BOOL | e.INF | e.NAN, e.ATOM = e.STR | e.NUM | e.SPECIAL, e.COLLECTION = e.ARR | e.OBJ, e.ALL = e.ATOM | e.COLLECTION, e.Allow = {
		STR: e.STR,
		NUM: e.NUM,
		ARR: e.ARR,
		OBJ: e.OBJ,
		NULL: e.NULL,
		BOOL: e.BOOL,
		NAN: e.NAN,
		INFINITY: e.INFINITY,
		_INFINITY: e._INFINITY,
		INF: e.INF,
		SPECIAL: e.SPECIAL,
		ATOM: e.ATOM,
		COLLECTION: e.COLLECTION,
		ALL: e.ALL
	}, e.default = e.Allow;
})), Gd = /* @__PURE__ */ e((/* @__PURE__ */ n(((e, t, n) => {
	var r = n && n.__createBinding || (Object.create ? (function(e, t, n, r) {
		r === void 0 && (r = n);
		var i = Object.getOwnPropertyDescriptor(t, n);
		(!i || ("get" in i ? !t.__esModule : i.writable || i.configurable)) && (i = {
			enumerable: !0,
			get: function() {
				return t[n];
			}
		}), Object.defineProperty(e, r, i);
	}) : (function(e, t, n, r) {
		r === void 0 && (r = n), e[r] = t[n];
	})), i = n && n.__exportStar || function(e, t) {
		for (var n in e) n !== "default" && !Object.prototype.hasOwnProperty.call(t, n) && r(t, e, n);
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.Allow = e.MalformedJSON = e.PartialJSON = e.parseJSON = e.parse = void 0;
	var a = Wd();
	Object.defineProperty(e, "Allow", {
		enumerable: !0,
		get: function() {
			return a.Allow;
		}
	}), i(Wd(), e);
	var o = class extends Error {};
	e.PartialJSON = o;
	var s = class extends Error {};
	e.MalformedJSON = s;
	function c(e, t = a.Allow.ALL) {
		if (typeof e != "string") throw TypeError(`expecting str, got ${typeof e}`);
		if (!e.trim()) throw Error(`${e} is empty`);
		return l(e.trim(), t);
	}
	e.parseJSON = c;
	var l = (e, t) => {
		let n = e.length, r = 0, i = (e) => {
			throw new o(`${e} at position ${r}`);
		}, c = (e) => {
			throw new s(`${e} at position ${r}`);
		}, l = () => (m(), r >= n && i("Unexpected end of input"), e[r] === "\"" ? u() : e[r] === "{" ? d() : e[r] === "[" ? f() : e.substring(r, r + 4) === "null" || a.Allow.NULL & t && n - r < 4 && "null".startsWith(e.substring(r)) ? (r += 4, null) : e.substring(r, r + 4) === "true" || a.Allow.BOOL & t && n - r < 4 && "true".startsWith(e.substring(r)) ? (r += 4, !0) : e.substring(r, r + 5) === "false" || a.Allow.BOOL & t && n - r < 5 && "false".startsWith(e.substring(r)) ? (r += 5, !1) : e.substring(r, r + 8) === "Infinity" || a.Allow.INFINITY & t && n - r < 8 && "Infinity".startsWith(e.substring(r)) ? (r += 8, Infinity) : e.substring(r, r + 9) === "-Infinity" || a.Allow._INFINITY & t && 1 < n - r && n - r < 9 && "-Infinity".startsWith(e.substring(r)) ? (r += 9, -Infinity) : e.substring(r, r + 3) === "NaN" || a.Allow.NAN & t && n - r < 3 && "NaN".startsWith(e.substring(r)) ? (r += 3, NaN) : p()), u = () => {
			let o = r, s = !1;
			for (r++; r < n && (e[r] !== "\"" || s && e[r - 1] === "\\");) s = e[r] === "\\" && !s, r++;
			if (e.charAt(r) == "\"") try {
				return JSON.parse(e.substring(o, ++r - Number(s)));
			} catch (e) {
				c(String(e));
			}
			else if (a.Allow.STR & t) try {
				return JSON.parse(e.substring(o, r - Number(s)) + "\"");
			} catch {
				return JSON.parse(e.substring(o, e.lastIndexOf("\\")) + "\"");
			}
			i("Unterminated string literal");
		}, d = () => {
			r++, m();
			let o = {};
			try {
				for (; e[r] !== "}";) {
					if (m(), r >= n && a.Allow.OBJ & t) return o;
					let i = u();
					m(), r++;
					try {
						o[i] = l();
					} catch (e) {
						if (a.Allow.OBJ & t) return o;
						throw e;
					}
					m(), e[r] === "," && r++;
				}
			} catch {
				if (a.Allow.OBJ & t) return o;
				i("Expected '}' at end of object");
			}
			return r++, o;
		}, f = () => {
			r++;
			let n = [];
			try {
				for (; e[r] !== "]";) n.push(l()), m(), e[r] === "," && r++;
			} catch {
				if (a.Allow.ARR & t) return n;
				i("Expected ']' at end of array");
			}
			return r++, n;
		}, p = () => {
			if (r === 0) {
				e === "-" && c("Not sure what '-' is");
				try {
					return JSON.parse(e);
				} catch (n) {
					if (a.Allow.NUM & t) try {
						return JSON.parse(e.substring(0, e.lastIndexOf("e")));
					} catch {}
					c(String(n));
				}
			}
			let o = r;
			for (e[r] === "-" && r++; e[r] && ",]}".indexOf(e[r]) === -1;) r++;
			r == n && !(a.Allow.NUM & t) && i("Unterminated number literal");
			try {
				return JSON.parse(e.substring(o, r));
			} catch {
				e.substring(o, r) === "-" && i("Not sure what '-' is");
				try {
					return JSON.parse(e.substring(o, e.lastIndexOf("e")));
				} catch (e) {
					c(String(e));
				}
			}
		}, m = () => {
			for (; r < n && " \n\r	".includes(e[r]);) r++;
		};
		return l();
	};
	e.parse = c;
})))(), 1), Kd = Gd.Allow.ALL & ~Gd.Allow.NUM;
function qd(e) {
	try {
		let t = Gd.parse(e, Kd);
		return t && typeof t == "object" && !Array.isArray(t) ? t : {};
	} catch {
		return {};
	}
}
function Jd(e, t) {
	return (n) => Math.min(e * 2 ** (n - 1), t);
}
// node_modules/.pnpm/@copilotkit+shared@1.83.0_@ag-ui+core@1.0.2_zod@3.25.76_/node_modules/@copilotkit/shared/dist/constants/index.mjs
var Yd = "https://api.cloud.copilotkit.ai", Xd = "X-CopilotCloud-Public-Api-Key", Zd = "default", Qd = {
	enabled: !1,
	events: !1,
	lifecycle: !1,
	verbose: !1
};
function $d(e) {
	if (!e) return Qd;
	if (e === !0) return {
		enabled: !0,
		events: !0,
		lifecycle: !0,
		verbose: !1
	};
	let t = e.events ?? !0, n = e.lifecycle ?? !0, r = t || n;
	return {
		enabled: r,
		events: t,
		lifecycle: n,
		verbose: r && (e.verbose ?? !1)
	};
}
// node_modules/.pnpm/@copilotkit+shared@1.83.0_@ag-ui+core@1.0.2_zod@3.25.76_/node_modules/@copilotkit/shared/dist/standard-schema.mjs
function ef(e) {
	let t = e["~standard"];
	return typeof t == "object" && !!t && "jsonSchema" in t && t.jsonSchema != null && typeof t.jsonSchema == "object" && "input" in t.jsonSchema && typeof t.jsonSchema.input == "function";
}
function tf(e, t) {
	if (ef(e)) return e["~standard"].jsonSchema.input({ target: "draft-07" });
	if (typeof e.toJSONSchema == "function") return e.toJSONSchema();
	let n = e["~standard"].vendor;
	if (n === "zod" && t?.zodToJsonSchema) return t.zodToJsonSchema(e, { $refStrategy: "none" });
	throw Error(`Cannot convert schema to JSON Schema. The schema (vendor: "${n}") does not implement Standard JSON Schema V1 and no zodToJsonSchema fallback is available. Use a library that supports Standard JSON Schema (e.g., Zod 3.24+, Valibot v1+, ArkType v2+) or pass a zodToJsonSchema function in options.`);
}
// node_modules/.pnpm/@copilotkit+shared@1.83.0_@ag-ui+core@1.0.2_zod@3.25.76_/node_modules/@copilotkit/shared/dist/logger.mjs
var nf = console, rf = /* @__PURE__ */ new Set(["RUN_STARTED", "RUN_FINISHED"]);
function af(e) {
	let t = e, n = rf.has(t.type);
	if (!("thread_id" in t) && !("run_id" in t) && (n || !("threadId" in t) && !("runId" in t))) return e;
	let { thread_id: r, run_id: i, ...a } = t;
	return n || (delete a.threadId, delete a.runId), a;
}
// node_modules/.pnpm/@copilotkit+shared@1.83.0_@ag-ui+core@1.0.2_zod@3.25.76_/node_modules/@copilotkit/shared/dist/generative-ui/is-record.mjs
function of(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
var sf = "common_types.json#/$defs/ChildList";
function cf(e) {
	let t = e.$ref;
	if (t === "common_types.json#/$defs/ComponentId") return "single";
	if (t === "common_types.json#/$defs/ChildList") return "multiple";
}
function lf(e) {
	let t = (e, t, n) => {
		if (typeof e != "string" || !e.startsWith(t)) return;
		let r = e.slice(t.length).trim();
		return r === "" ? { $ref: n } : {
			$ref: n,
			description: r
		};
	}, n = (e) => Array.isArray(e) ? e.map(n) : of(e) ? (t(e.description, "@a2ui/ComponentId", "common_types.json#/$defs/ComponentId") ?? t(e.description, "@a2ui/ChildList", "common_types.json#/$defs/ChildList")) || Object.fromEntries(Object.entries(e).map(([e, t]) => [e, n(t)])) : e;
	return n(e);
}
function uf(e) {
	let t = [], n = /* @__PURE__ */ new Set(), r = (e, r) => {
		let i = e.join("\0");
		n.has(i) || (n.add(i), t.push({
			path: e,
			kind: r
		}));
	}, i = (e, t) => {
		if (!of(e)) return;
		let n = cf(e);
		if (n) return r(t, n);
		for (let n of [e.anyOf, e.oneOf]) {
			if (!Array.isArray(n) || n.length === 0) continue;
			let e = n.map((e) => of(e) ? cf(e) : void 0), [i] = e;
			if (i && e.every((e) => e === i)) r(t, i);
			else if (e.every((e) => e === void 0)) {
				let e = n.map((e) => uf(e)), i = (e) => `${e.kind}\u0000${e.path.join("\0")}`;
				e[0].filter((t) => e.every((e) => e.some((e) => i(e) === i(t)))).forEach((e) => r([...t, ...e.path], e.kind));
			}
		}
		if (Array.isArray(e.allOf) && e.allOf.forEach((e) => i(e, t)), of(e.properties)) for (let [n, r] of Object.entries(e.properties)) i(r, [...t, n]);
		of(e.items) && i(e.items, [...t, "*"]);
	};
	return i(e, []), t;
}
function df(e, t) {
	let n = [], r = (e) => {
		typeof e == "string" ? n.push(e) : Array.isArray(e) ? e.forEach((e) => typeof e == "string" && n.push(e)) : of(e) && typeof e.componentId == "string" && n.push(e.componentId);
	}, i = (e, t) => {
		if (t.length === 0) return r(e);
		let [n, ...a] = t;
		n === "*" ? Array.isArray(e) && e.forEach((e) => i(e, a)) : of(e) && Object.prototype.hasOwnProperty.call(e, n) && i(e[n], a);
	};
	for (let n of t) i(e, n.path);
	return n;
}
function ff(e, t) {
	let n = (e) => of(e) && ("@path" in e || "@call" in e), r = (e, t) => {
		if (n(e)) return !0;
		if (t.length === 0) return !1;
		let [i, ...a] = t;
		return i === "*" ? Array.isArray(e) && e.some((e) => r(e, a)) : of(e) && Object.prototype.hasOwnProperty.call(e, i) && r(e[i], a);
	};
	return t.some((t) => r(e, t.path));
}
function pf(e, t, n) {
	if (t.length === 0) return n(e);
	let [r, ...i] = t;
	return r === "*" ? Array.isArray(e) ? e.map((e) => pf(e, i, n)) : e : !of(e) || !Object.prototype.hasOwnProperty.call(e, r) ? e : {
		...e,
		[r]: pf(e[r], i, n)
	};
}
// node_modules/.pnpm/@copilotkit+shared@1.83.0_@ag-ui+core@1.0.2_zod@3.25.76_/node_modules/@copilotkit/shared/dist/generative-ui/types.mjs
var mf = "v1.0", hf = "generative-ui-surface", gf = "generative-ui-function-call", _f = "render_ui", vf = "chat", yf = "root", bf = "callRendererFunction is not supported in this version: the agent cannot call renderer functions until their results can be sent back to it reliably", xf = /* @__PURE__ */ new Set([
	"catalogId",
	"accessibility",
	"metadata"
]);
function Sf(e) {
	return {
		version: mf,
		action: {
			name: e.name,
			surfaceId: e.surfaceId,
			sourceComponentId: e.componentId,
			timestamp: e.timestamp ?? (/* @__PURE__ */ new Date()).toISOString(),
			...e.userMessage === void 0 ? {} : { userMessage: e.userMessage },
			context: e.context
		}
	};
}
// node_modules/.pnpm/phoenix@1.8.16/node_modules/phoenix/priv/static/phoenix.mjs
var Cf = (e) => typeof e == "function" ? e : function() {
	return e;
}, wf = typeof self < "u" ? self : null, Tf = typeof window < "u" ? window : null, Ef = wf || Tf || globalThis, Df = "2.0.0", Of = {
	connecting: 0,
	open: 1,
	closing: 2,
	closed: 3
}, kf = 100, Af = 1e4, jf = 1e3, Mf = {
	closed: "closed",
	errored: "errored",
	joined: "joined",
	joining: "joining",
	leaving: "leaving"
}, Nf = {
	close: "phx_close",
	error: "phx_error",
	join: "phx_join",
	reply: "phx_reply",
	leave: "phx_leave"
}, Pf = {
	longpoll: "longpoll",
	websocket: "websocket"
}, Ff = { complete: 4 }, If = "base64url.bearer.phx.", Lf = class {
	constructor(e, t, n, r) {
		this.channel = e, this.event = t, this.payload = n || function() {
			return {};
		}, this.receivedResp = null, this.timeout = r, this.timeoutTimer = null, this.recHooks = [], this.sent = !1;
	}
	resend(e) {
		this.timeout = e, this.reset(), this.send();
	}
	send() {
		this.hasReceived("timeout") || (this.startTimeout(), this.sent = !0, this.channel.socket.push({
			topic: this.channel.topic,
			event: this.event,
			payload: this.payload(),
			ref: this.ref,
			join_ref: this.channel.joinRef()
		}, this.channel));
	}
	receive(e, t) {
		return this.hasReceived(e) && t(this.receivedResp.response), this.recHooks.push({
			status: e,
			callback: t
		}), this;
	}
	reset() {
		this.cancelRefEvent(), this.ref = null, this.refEvent = null, this.receivedResp = null, this.sent = !1;
	}
	matchReceive({ status: e, response: t, _ref: n }) {
		this.recHooks.filter((t) => t.status === e).forEach((e) => e.callback(t));
	}
	cancelRefEvent() {
		this.refEvent && this.channel.off(this.refEvent);
	}
	cancelTimeout() {
		clearTimeout(this.timeoutTimer), this.timeoutTimer = null;
	}
	startTimeout() {
		this.timeoutTimer && this.cancelTimeout(), this.cancelRefEvent(), this.ref = this.channel.socket.makeRef(), this.refEvent = this.channel.replyEventName(this.ref), this.channel.on(this.refEvent, (e) => {
			this.cancelRefEvent(), this.cancelTimeout(), this.receivedResp = e, this.matchReceive(e);
		}), this.timeoutTimer = setTimeout(() => {
			this.trigger("timeout", {});
		}, this.timeout);
	}
	hasReceived(e) {
		return this.receivedResp && this.receivedResp.status === e;
	}
	trigger(e, t) {
		this.channel.trigger(this.refEvent, {
			status: e,
			response: t
		});
	}
}, Rf = class {
	constructor(e, t) {
		this.callback = e, this.timerCalc = t, this.timer = null, this.tries = 0;
	}
	reset() {
		this.tries = 0, clearTimeout(this.timer);
	}
	scheduleTimeout() {
		clearTimeout(this.timer), this.timer = setTimeout(() => {
			this.tries += 1, this.callback();
		}, this.timerCalc(this.tries + 1));
	}
}, zf = class {
	constructor(e, t, n) {
		this.state = Mf.closed, this.topic = e, this.params = Cf(t || {}), this.socket = n, this.bindings = [], this.bindingRef = 0, this.timeout = this.socket.timeout, this.joinedOnce = !1, this.joinPush = new Lf(this, Nf.join, this.params, this.timeout), this.pushBuffer = [], this.stateChangeRefs = [], this.rejoinTimer = new Rf(() => {
			this.socket.isConnected() && this.rejoin();
		}, this.socket.rejoinAfterMs), this.stateChangeRefs.push(this.socket.onError(() => this.rejoinTimer.reset())), this.stateChangeRefs.push(this.socket.onOpen(() => {
			this.rejoinTimer.reset(), this.isErrored() && this.rejoin();
		})), this.joinPush.receive("ok", () => {
			this.state = Mf.joined, this.rejoinTimer.reset(), this.pushBuffer.forEach((e) => e.send()), this.pushBuffer = [];
		}), this.joinPush.receive("error", () => {
			this.state = Mf.errored, this.socket.isConnected() && this.rejoinTimer.scheduleTimeout();
		}), this.onClose(() => {
			this.rejoinTimer.reset(), this.socket.hasLogger() && this.socket.log("channel", `close ${this.topic} ${this.joinRef()}`), this.state = Mf.closed, this.socket.remove(this);
		}), this.onError((e) => {
			this.socket.hasLogger() && this.socket.log("channel", `error ${this.topic}`, e), this.isJoining() && this.joinPush.reset(), this.state = Mf.errored, this.socket.isConnected() && this.rejoinTimer.scheduleTimeout();
		}), this.joinPush.receive("timeout", () => {
			this.socket.hasLogger() && this.socket.log("channel", `timeout ${this.topic} (${this.joinRef()})`, this.joinPush.timeout), new Lf(this, Nf.leave, Cf({}), this.timeout).send(), this.state = Mf.errored, this.joinPush.reset(), this.socket.isConnected() && this.rejoinTimer.scheduleTimeout();
		}), this.on(Nf.reply, (e, t) => {
			this.trigger(this.replyEventName(t), e);
		});
	}
	join(e = this.timeout) {
		if (this.joinedOnce) throw Error("tried to join multiple times. 'join' can only be called a single time per channel instance");
		return this.timeout = e, this.joinedOnce = !0, this.rejoin(), this.joinPush;
	}
	onClose(e) {
		this.on(Nf.close, e);
	}
	onError(e) {
		return this.on(Nf.error, (t) => e(t));
	}
	on(e, t) {
		let n = this.bindingRef++;
		return this.bindings.push({
			event: e,
			ref: n,
			callback: t
		}), n;
	}
	off(e, t) {
		this.bindings = this.bindings.filter((n) => n.event !== e || t !== void 0 && t !== n.ref);
	}
	canPush() {
		return this.socket.isConnected() && this.isJoined();
	}
	push(e, t, n = this.timeout) {
		if (t ||= {}, !this.joinedOnce) throw Error(`tried to push '${e}' to '${this.topic}' before joining. Use channel.join() before pushing events`);
		let r = new Lf(this, e, function() {
			return t;
		}, n);
		return this.canPush() ? r.send() : (r.startTimeout(), this.pushBuffer.push(r)), r;
	}
	leave(e = this.timeout) {
		this.rejoinTimer.reset(), this.joinPush.cancelTimeout(), this.state = Mf.leaving;
		let t = () => {
			this.socket.hasLogger() && this.socket.log("channel", `leave ${this.topic}`), this.trigger(Nf.close, "leave");
		}, n = new Lf(this, Nf.leave, Cf({}), e);
		return n.receive("ok", () => t()).receive("timeout", () => t()), n.send(), this.canPush() || n.trigger("ok", {}), n;
	}
	onMessage(e, t, n) {
		return t;
	}
	isMember(e, t, n, r) {
		return this.topic === e ? r && r !== this.joinRef() ? (this.socket.hasLogger() && this.socket.log("channel", "dropping outdated message", {
			topic: e,
			event: t,
			payload: n,
			joinRef: r
		}), !1) : !0 : !1;
	}
	joinRef() {
		return this.joinPush.ref;
	}
	rejoin(e = this.timeout) {
		this.isLeaving() || (this.socket.leaveOpenTopic(this.topic), this.state = Mf.joining, this.joinPush.resend(e));
	}
	trigger(e, t, n, r) {
		let i = this.onMessage(e, t, n, r);
		if (t && !i) throw Error("channel onMessage callbacks must return the payload, modified or unmodified");
		let a = this.bindings.filter((t) => t.event === e);
		for (let e = 0; e < a.length; e++) a[e].callback(i, n, r || this.joinRef());
	}
	replyEventName(e) {
		return `chan_reply_${e}`;
	}
	isClosed() {
		return this.state === Mf.closed;
	}
	isErrored() {
		return this.state === Mf.errored;
	}
	isJoined() {
		return this.state === Mf.joined;
	}
	isJoining() {
		return this.state === Mf.joining;
	}
	isLeaving() {
		return this.state === Mf.leaving;
	}
}, Bf = class {
	static request(e, t, n, r, i, a, o) {
		if (Ef.XDomainRequest) {
			let n = new Ef.XDomainRequest();
			return this.xdomainRequest(n, e, t, r, i, a, o);
		}
		if (Ef.XMLHttpRequest) {
			let s = new Ef.XMLHttpRequest();
			return this.xhrRequest(s, e, t, n, r, i, a, o);
		}
		if (Ef.fetch && Ef.AbortController) return this.fetchRequest(e, t, n, r, i, a, o);
		throw Error("No suitable XMLHttpRequest implementation found");
	}
	static fetchRequest(e, t, n, r, i, a, o) {
		let s = {
			method: e,
			headers: n,
			body: r
		}, c = null, l = null;
		return i && (c = new AbortController(), l = setTimeout(() => c.abort(), i), s.signal = c.signal), Ef.fetch(t, s).then((e) => e.text()).then((e) => this.parseJSON(e)).then((e) => {
			l && clearTimeout(l), o && o(e);
		}).catch((e) => {
			l && clearTimeout(l), e.name === "AbortError" && a ? a() : o && o(null);
		}), c;
	}
	static xdomainRequest(e, t, n, r, i, a, o) {
		return e.timeout = i, e.open(t, n), e.onload = () => {
			let t = this.parseJSON(e.responseText);
			o && o(t);
		}, a && (e.ontimeout = a), e.onprogress = () => {}, e.send(r), e;
	}
	static xhrRequest(e, t, n, r, i, a, o, s) {
		e.open(t, n, !0), e.timeout = a;
		for (let [t, n] of Object.entries(r)) e.setRequestHeader(t, n);
		return e.onerror = () => s && s(null), e.onreadystatechange = () => {
			e.readyState === Ff.complete && s && s(this.parseJSON(e.responseText));
		}, o && (e.ontimeout = o), e.send(i), e;
	}
	static parseJSON(e) {
		if (!e || e === "") return null;
		try {
			return JSON.parse(e);
		} catch {
			return console && console.log("failed to parse JSON response", e), null;
		}
	}
	static serialize(e, t) {
		let n = [];
		for (var r in e) {
			if (!Object.prototype.hasOwnProperty.call(e, r)) continue;
			let i = t ? `${t}[${r}]` : r, a = e[r];
			typeof a == "object" ? n.push(this.serialize(a, i)) : n.push(encodeURIComponent(i) + "=" + encodeURIComponent(a));
		}
		return n.join("&");
	}
	static appendParams(e, t) {
		return Object.keys(t).length === 0 ? e : `${e}${e.match(/\?/) ? "&" : "?"}${this.serialize(t)}`;
	}
}, Vf = (e) => {
	let t = "", n = new Uint8Array(e), r = n.byteLength;
	for (let e = 0; e < r; e++) t += String.fromCharCode(n[e]);
	return btoa(t);
}, Hf = class {
	constructor(e, t) {
		t && t.length === 2 && t[1].startsWith(If) && (this.authToken = atob(t[1].slice(If.length))), this.endPoint = null, this.token = null, this.skipHeartbeat = !0, this.reqs = /* @__PURE__ */ new Set(), this.messageTimers = /* @__PURE__ */ new Set(), this.awaitingBatchAck = !1, this.currentBatch = null, this.currentBatchTimer = null, this.batchBuffer = [], this.onopen = function() {}, this.onerror = function() {}, this.onmessage = function() {}, this.onclose = function() {}, this.pollEndpoint = this.normalizeEndpoint(e), this.readyState = Of.connecting, setTimeout(() => this.poll(), 0);
	}
	normalizeEndpoint(e) {
		return e.replace("ws://", "http://").replace("wss://", "https://").replace(RegExp("(.*)/" + Pf.websocket), "$1/" + Pf.longpoll);
	}
	endpointURL() {
		return Bf.appendParams(this.pollEndpoint, { token: this.token });
	}
	closeAndRetry(e, t, n, r) {
		this.isActive() && (this.stop(Of.connecting), this.onerror(e), this.isActive() && this.emitClose(t, n, r));
	}
	ontimeout() {
		this.closeAndRetry("timeout", 1005, "timeout", !1);
	}
	isActive() {
		return this.readyState === Of.open || this.readyState === Of.connecting;
	}
	poll() {
		if (!this.isActive()) return;
		let e = { Accept: "application/json" };
		this.authToken && (e["X-Phoenix-AuthToken"] = this.authToken), this.ajax("GET", e, null, () => this.ontimeout(), (e) => {
			if (e) {
				var { status: t, token: n, messages: r } = e;
				if (t === 410 && this.token !== null) {
					this.closeAndRetry(410, 3410, "session_gone", !1);
					return;
				}
				this.token = n;
			} else t = 0;
			switch (t) {
				case 200:
					r.forEach((e) => {
						let t = setTimeout(() => {
							this.messageTimers.delete(t), this.onmessage({ data: e });
						}, 0);
						this.messageTimers.add(t);
					}), this.poll();
					break;
				case 204:
					this.poll();
					break;
				case 410:
					this.readyState = Of.open, this.onopen({}), this.poll();
					break;
				case 403:
					this.onerror(403), this.close(1008, "forbidden", !1);
					break;
				case 0:
				case 500:
					this.closeAndRetry(500, 1011, "internal server error", !1);
					break;
				default: throw Error(`unhandled poll status ${t}`);
			}
		});
	}
	send(e) {
		typeof e != "string" && (e = Vf(e)), this.currentBatch ? this.currentBatch.push(e) : this.awaitingBatchAck ? this.batchBuffer.push(e) : (this.currentBatch = [e], this.currentBatchTimer = setTimeout(() => {
			this.batchSend(this.currentBatch), this.currentBatch = null;
		}, 0));
	}
	batchSend(e, t = 0) {
		this.awaitingBatchAck = !0;
		let n = t + kf, r = e.slice(t, n);
		this.ajax("POST", { "Content-Type": "application/x-ndjson" }, r.join("\n"), () => this.ontimeout(), (t) => {
			!t || t.status !== 200 ? this.closeAndRetry(t && t.status, 1011, "internal server error", !1) : n < e.length ? this.batchSend(e, n) : this.batchBuffer.length > 0 ? (this.batchSend(this.batchBuffer), this.batchBuffer = []) : this.awaitingBatchAck = !1;
		});
	}
	close(e, t, n) {
		this.stop(Of.closed), this.emitClose(e, t, n);
	}
	stop(e) {
		this.readyState = e;
		let t = this.reqs;
		this.reqs = /* @__PURE__ */ new Set();
		for (let { req: e } of t) e && e.abort();
		for (let e of this.messageTimers) clearTimeout(e);
		this.messageTimers.clear(), this.batchBuffer = [], this.awaitingBatchAck = !1, clearTimeout(this.currentBatchTimer), this.currentBatchTimer = null, this.currentBatch = null;
	}
	emitClose(e = 1005, t, n = !0) {
		let r = {
			code: e,
			reason: t,
			wasClean: n
		};
		typeof CloseEvent < "u" ? this.onclose(new CloseEvent("close", r)) : this.onclose(r);
	}
	ajax(e, t, n, r, i) {
		let a = { req: null };
		this.reqs.add(a), a.req = Bf.request(e, this.endpointURL(), t, n, this.timeout, () => {
			this.reqs.delete(a) && r();
		}, (e) => {
			this.reqs.delete(a) && i(e);
		});
	}
}, Uf = {
	HEADER_LENGTH: 1,
	META_LENGTH: 4,
	KINDS: {
		push: 0,
		reply: 1,
		broadcast: 2
	},
	encode(e, t) {
		if (e.payload.constructor === ArrayBuffer) return t(this.binaryEncode(e));
		{
			let n = [
				e.join_ref,
				e.ref,
				e.topic,
				e.event,
				e.payload
			];
			return t(JSON.stringify(n));
		}
	},
	decode(e, t) {
		if (e.constructor === ArrayBuffer) return t(this.binaryDecode(e));
		{
			let [n, r, i, a, o] = JSON.parse(e);
			return t({
				join_ref: n,
				ref: r,
				topic: i,
				event: a,
				payload: o
			});
		}
	},
	binaryEncode(e) {
		let { join_ref: t, ref: n, event: r, topic: i, payload: a } = e, o = new TextEncoder(), s = o.encode(t), c = o.encode(n), l = o.encode(i), u = o.encode(r);
		this.assertFieldSize(s.byteLength, "join_ref"), this.assertFieldSize(c.byteLength, "ref"), this.assertFieldSize(l.byteLength, "topic"), this.assertFieldSize(u.byteLength, "event");
		let d = this.META_LENGTH + s.byteLength + c.byteLength + l.byteLength + u.byteLength, f = new ArrayBuffer(this.HEADER_LENGTH + d), p = new Uint8Array(f), m = new DataView(f), h = 0;
		m.setUint8(h++, this.KINDS.push), m.setUint8(h++, s.byteLength), m.setUint8(h++, c.byteLength), m.setUint8(h++, l.byteLength), m.setUint8(h++, u.byteLength), p.set(s, h), h += s.byteLength, p.set(c, h), h += c.byteLength, p.set(l, h), h += l.byteLength, p.set(u, h), h += u.byteLength;
		var g = new Uint8Array(f.byteLength + a.byteLength);
		return g.set(p, 0), g.set(new Uint8Array(a), f.byteLength), g.buffer;
	},
	assertFieldSize(e, t) {
		if (e > 255) throw Error(`unable to convert ${t} to binary: must be less than or equal to 255 bytes, but is ${e} bytes`);
	},
	binaryDecode(e) {
		let t = new DataView(e), n = t.getUint8(0), r = new TextDecoder();
		switch (n) {
			case this.KINDS.push: return this.decodePush(e, t, r);
			case this.KINDS.reply: return this.decodeReply(e, t, r);
			case this.KINDS.broadcast: return this.decodeBroadcast(e, t, r);
		}
	},
	decodePush(e, t, n) {
		let r = t.getUint8(1), i = t.getUint8(2), a = t.getUint8(3), o = this.HEADER_LENGTH + this.META_LENGTH - 1, s = n.decode(e.slice(o, o + r));
		o += r;
		let c = n.decode(e.slice(o, o + i));
		o += i;
		let l = n.decode(e.slice(o, o + a));
		return o += a, {
			join_ref: s,
			ref: null,
			topic: c,
			event: l,
			payload: e.slice(o, e.byteLength)
		};
	},
	decodeReply(e, t, n) {
		let r = t.getUint8(1), i = t.getUint8(2), a = t.getUint8(3), o = t.getUint8(4), s = this.HEADER_LENGTH + this.META_LENGTH, c = n.decode(e.slice(s, s + r));
		s += r;
		let l = n.decode(e.slice(s, s + i));
		s += i;
		let u = n.decode(e.slice(s, s + a));
		s += a;
		let d = n.decode(e.slice(s, s + o));
		s += o;
		let f = {
			status: d,
			response: e.slice(s, e.byteLength)
		};
		return {
			join_ref: c,
			ref: l,
			topic: u,
			event: Nf.reply,
			payload: f
		};
	},
	decodeBroadcast(e, t, n) {
		let r = t.getUint8(1), i = t.getUint8(2), a = this.HEADER_LENGTH + 2, o = n.decode(e.slice(a, a + r));
		a += r;
		let s = n.decode(e.slice(a, a + i));
		return a += i, {
			join_ref: null,
			ref: null,
			topic: o,
			event: s,
			payload: e.slice(a, e.byteLength)
		};
	}
}, Wf = class {
	constructor(e, t) {
		this.socket = e, this.transport = t, this.joins = /* @__PURE__ */ new WeakMap(), this.pings = /* @__PURE__ */ new Map(), this.closing = !1, this.ended = !1, this.channelsErrored = !1, this.closeHandled = !1, t.onopen = () => {
			this.isCurrent() && e.onConnOpen();
		}, t.onerror = (t) => {
			this.isCurrent() && e.onConnError(t);
		}, t.onmessage = (t) => {
			this.isCurrent() && e.onConnMessage(t);
		}, t.onclose = (t) => {
			this.isCurrent() && !this.closeHandled && (this.closeHandled = !0, e.onConnClose(t));
		};
	}
	isCurrent() {
		return this.socket.connection === this;
	}
	isOpen() {
		return this.transport.readyState === Of.open;
	}
	isConnecting() {
		return this.transport.readyState === Of.connecting;
	}
	carried(e, t = e.joinRef()) {
		return this.joins.has(e) && this.joins.get(e) === t;
	}
	close(e, t) {
		this.closing = !0, this.transport.onerror = function() {}, e ? this.transport.close(e, t || "") : this.transport.close();
	}
}, Gf = class {
	constructor(e, t = {}) {
		this.stateChangeCallbacks = {
			open: [],
			close: [],
			error: [],
			message: []
		}, this.channels = [], this.sendBuffer = [], this.ref = 0, this.fallbackRef = null, this.fallbackErrorRef = null, this.timeout = t.timeout || Af, this.transport = t.transport || Ef.WebSocket || Hf, this.primaryPassedHealthCheck = !1, this.longPollFallbackMs = t.longPollFallbackMs, this.fallbackTimer = null, this.sessionStore = t.sessionStorage || Ef && Ef.sessionStorage, this.establishedConnections = 0, this.defaultEncoder = Uf.encode.bind(Uf), this.defaultDecoder = Uf.decode.bind(Uf), this.closeWasClean = !0, this.binaryType = t.binaryType || "arraybuffer", this.connection = null, this.connectClock = 1, this.visibilityConnection = null, this.transport === Hf ? (this.encode = this.defaultEncoder, this.decode = this.defaultDecoder) : (this.encode = t.encode || this.defaultEncoder, this.decode = t.decode || this.defaultDecoder);
		let n = null;
		Tf && Tf.addEventListener && (Tf.addEventListener("pagehide", (e) => {
			this.connection && !this.connection.ended && (this.disconnect(), n = this.connectClock);
		}), Tf.addEventListener("pageshow", (e) => {
			n === this.connectClock && (n = null, this.connect());
		}), Tf.addEventListener("visibilitychange", () => {
			this.handleVisibilityChange();
		}), Tf.document && Tf.document.addEventListener("resume", () => {
			this.handleVisibilityChange();
		})), this.heartbeatIntervalMs = t.heartbeatIntervalMs || 3e4, this.rejoinAfterMs = (e) => t.rejoinAfterMs ? t.rejoinAfterMs(e) : [
			1e3,
			2e3,
			5e3
		][e - 1] || 1e4, this.reconnectAfterMs = (e) => t.reconnectAfterMs ? t.reconnectAfterMs(e) : [
			10,
			50,
			100,
			150,
			200,
			250,
			500,
			1e3,
			2e3
		][e - 1] || 5e3, this.logger = t.logger || null, !this.logger && t.debug && (this.logger = (e, t, n) => {
			console.log(`${e}: ${t}`, n);
		}), this.longpollerTimeout = t.longpollerTimeout || 2e4, this.params = Cf(t.params || {}), this.endPoint = `${e}/${Pf.websocket}`, this.vsn = t.vsn || Df, this.heartbeatTimeoutTimer = null, this.heartbeatTimer = null, this.pendingHeartbeatRef = null, this.reconnectTimer = new Rf(() => {
			this.pageHidden ? (this.log("Not reconnecting as page is hidden!"), this.teardown()) : this.teardownAndReconnect(() => this.connect());
		}, this.reconnectAfterMs), this.authToken = t.authToken && Cf(t.authToken);
	}
	get conn() {
		return this.connection && this.connection.transport;
	}
	get pageHidden() {
		return Tf && Tf.document ? Tf.document.visibilityState === "hidden" : !1;
	}
	handleVisibilityChange() {
		if (this.pageHidden) {
			this.visibilityConnection = null;
			return;
		}
		let e = this.connection;
		e && e === this.visibilityConnection && e.isConnecting() || !this.isConnected() && !this.closeWasClean && (this.reconnectTimer.reset(), this.teardownAndReconnect(() => {
			this.connect(), this.visibilityConnection = this.connection;
		}));
	}
	getLongPollTransport() {
		return Hf;
	}
	replaceTransport(e) {
		let t = ++this.connectClock;
		this.closeWasClean = !0, clearTimeout(this.fallbackTimer), this.reconnectTimer.reset(), this.transport = e;
		let n = this.connection;
		if (n) {
			let e = n.isOpen();
			this.connection = null, n.ended = !0, n.close(), this.clearHeartbeats(), e && this.triggerChanError("connection_closed", n);
		}
		return t;
	}
	protocol() {
		return location.protocol.match(/^https/) ? "wss" : "ws";
	}
	endPointURL() {
		let e = Bf.appendParams(Bf.appendParams(this.endPoint, this.params()), { vsn: this.vsn });
		return e.charAt(0) === "/" ? e.charAt(1) === "/" ? `${this.protocol()}:${e}` : `${this.protocol()}://${location.host}${e}` : e;
	}
	disconnect(e, t, n) {
		this.connectClock++, this.closeWasClean = !0, clearTimeout(this.fallbackTimer), this.reconnectTimer.reset(), this.connection && (this.connection.ended = !0), this.teardown(e, t, n);
	}
	connect(e) {
		e && (console && console.log("passing params to connect is deprecated. Instead pass :params to the Socket constructor"), this.params = Cf(e)), (!this.connection || this.connection.ended) && (this.longPollFallbackMs && this.transport !== Hf ? this.connectWithFallback(Hf, this.longPollFallbackMs) : this.transportConnect());
	}
	log(e, t, n) {
		this.logger && this.logger(e, t, n);
	}
	hasLogger() {
		return this.logger !== null;
	}
	onOpen(e) {
		let t = this.makeRef();
		return this.stateChangeCallbacks.open.push([t, e]), t;
	}
	onClose(e) {
		let t = this.makeRef();
		return this.stateChangeCallbacks.close.push([t, e]), t;
	}
	onError(e) {
		let t = this.makeRef();
		return this.stateChangeCallbacks.error.push([t, e]), t;
	}
	onMessage(e) {
		let t = this.makeRef();
		return this.stateChangeCallbacks.message.push([t, e]), t;
	}
	ping(e) {
		if (!this.isConnected()) return !1;
		let t = this.makeRef(), n = Date.now();
		return this.connection.pings.set(t, () => e(Date.now() - n)), this.push({
			topic: "phoenix",
			event: "heartbeat",
			payload: {},
			ref: t
		}), !0;
	}
	transportName(e) {
		switch (e) {
			case Hf: return "LongPoll";
			default: return e.name;
		}
	}
	transportConnect() {
		let e = this.connection;
		this.connectClock++, this.closeWasClean = !1, clearTimeout(this.reconnectTimer.timer);
		let t;
		this.authToken && (t = ["phoenix", `${If}${btoa(this.authToken()).replace(/=/g, "")}`]);
		let n = new this.transport(this.endPointURL(), t);
		n.binaryType = this.binaryType, n.timeout = this.longpollerTimeout, this.connection = new Wf(this, n), e && e.isOpen() && this.triggerChanError("connection_closed", e);
	}
	getSession(e) {
		return this.sessionStore && this.sessionStore.getItem(e);
	}
	storeSession(e, t) {
		this.sessionStore && this.sessionStore.setItem(e, t);
	}
	connectWithFallback(e, t = 2500) {
		this.cancelFallback();
		let n = !1, r = !0, i, a, o = () => a === this.connectClock && !this.closeWasClean, s = this.transportName(e), c = (t) => {
			this.log("transport", `falling back to ${s}...`, t), this.off([i]), r = !1, this.replaceTransport(e) === this.connectClock && this.transportConnect();
		};
		if (this.getSession(`phx:fallback:${s}`)) return c("memorized");
		this.fallbackTimer = setTimeout(c, t), i = this.fallbackErrorRef = this.onError((e) => {
			o() && (this.log("transport", "error", e), r && !n && (clearTimeout(this.fallbackTimer), c(e)));
		}), this.fallbackRef = this.onOpen(() => {
			if (!r) {
				if (this.transport !== e || this.closeWasClean) return;
				let t = this.transportName(e);
				return this.primaryPassedHealthCheck || this.storeSession(`phx:fallback:${t}`, "true"), this.log("transport", `established ${t} fallback`);
			}
			o() && (n = !0, clearTimeout(this.fallbackTimer), this.fallbackTimer = setTimeout(c, t), this.ping((e) => {
				this.log("transport", "connected to primary after", e), this.primaryPassedHealthCheck = !0, clearTimeout(this.fallbackTimer);
			}));
		}), this.transportConnect(), a = this.connectClock;
	}
	cancelFallback() {
		clearTimeout(this.fallbackTimer), this.off([this.fallbackRef, this.fallbackErrorRef]);
	}
	clearHeartbeats() {
		clearTimeout(this.heartbeatTimer), clearTimeout(this.heartbeatTimeoutTimer), this.pendingHeartbeatRef = null;
	}
	onConnOpen() {
		this.hasLogger() && this.log("transport", `${this.transportName(this.transport)} connected to ${this.endPointURL()}`), this.closeWasClean = !1, this.establishedConnections++, this.flushSendBuffer(), this.reconnectTimer.reset(), this.resetHeartbeat(), this.stateChangeCallbacks.open.forEach(([, e]) => e());
	}
	heartbeatTimeout() {
		if (this.pendingHeartbeatRef) {
			let e = this.connection;
			if (this.pendingHeartbeatRef = null, this.hasLogger() && this.log("transport", "heartbeat timeout. Attempting to re-establish connection"), this.closeWasClean = !1, e && e.close(jf, "heartbeat timeout"), !this.stillUses(e) || (this.triggerChanError("heartbeat_timeout"), !this.stillUses(e))) return;
			this.teardownAndReconnect(() => this.reconnectTimer.scheduleTimeout());
		}
	}
	resetHeartbeat() {
		this.conn && this.conn.skipHeartbeat || (this.clearHeartbeats(), this.heartbeatTimer = setTimeout(() => this.sendHeartbeat(), this.heartbeatIntervalMs));
	}
	teardownAndReconnect(e) {
		let t = this.connection, n = this.connectClock;
		this.teardown(() => {
			n !== this.connectClock || t && t.ended || e();
		});
	}
	stillUses(e) {
		return this.connection === e && !(e && e.ended);
	}
	teardown(e, t, n) {
		let r = this.connection;
		if (!r) return e && e();
		this.clearHeartbeats(), this.waitForBufferDone(r.transport, () => {
			if (!r.closing) {
				let e = !r.isConnecting();
				r.close(t, n), e && this.triggerChanError("connection_closed", r);
			}
			this.waitForSocketClosed(r.transport, () => {
				this.connection === r && (this.connection = null), e && e();
			});
		});
	}
	waitForBufferDone(e, t, n = 1) {
		n === 5 || !e.bufferedAmount || e.readyState !== Of.open ? t() : setTimeout(() => {
			this.waitForBufferDone(e, t, n + 1);
		}, 150 * n);
	}
	waitForSocketClosed(e, t, n = 1) {
		n === 5 || e.readyState === Of.closed ? t() : setTimeout(() => {
			this.waitForSocketClosed(e, t, n + 1);
		}, 150 * n);
	}
	onConnClose(e) {
		let t = this.connection;
		this.hasLogger() && this.log("transport", "close", e), this.clearHeartbeats();
		let n = !!(t && t.closing);
		this.triggerChanError("connection_closed", t), this.stillUses(t) && !n && !this.closeWasClean && this.reconnectTimer.scheduleTimeout(), this.stateChangeCallbacks.close.forEach(([, t]) => t(e));
	}
	onConnError(e) {
		let t = this.connection;
		this.hasLogger() && this.log("transport", "error", e);
		let n = this.transport, r = this.establishedConnections;
		this.stateChangeCallbacks.error.forEach(([, t]) => {
			t(e, n, r);
		}), this.triggerChanError("connection_error", t);
	}
	triggerChanError(e, t = this.connection) {
		let n = !1;
		t && !t.isOpen() && (n = t.channelsErrored, t.channelsErrored = !0), this.channels.map((e) => [e, e.joinRef()]).forEach(([r, i]) => {
			r.joinRef() === i && (!t || !n && t.isCurrent() || t.carried(r, i)) && (r.isErrored() || r.isLeaving() || r.isClosed() || r.trigger(Nf.error, {
				source: "transport",
				reason: e
			}));
		});
	}
	connectionState() {
		switch (this.conn && this.conn.readyState) {
			case Of.connecting: return "connecting";
			case Of.open: return "open";
			case Of.closing: return "closing";
			default: return "closed";
		}
	}
	isConnected() {
		return this.connectionState() === "open";
	}
	remove(e) {
		this.off(e.stateChangeRefs), this.channels = this.channels.filter((t) => t !== e);
	}
	off(e) {
		for (let t in this.stateChangeCallbacks) this.stateChangeCallbacks[t] = this.stateChangeCallbacks[t].filter(([t]) => e.indexOf(t) === -1);
	}
	channel(e, t = {}) {
		let n = new zf(e, t, this);
		return this.channels.push(n), n;
	}
	push(e, t) {
		if (this.hasLogger()) {
			let { topic: t, event: n, payload: r, ref: i, join_ref: a } = e;
			this.log("push", `${t} ${n} (${a}, ${i})`, r);
		}
		this.isConnected() ? this.send(e, t) : this.sendBuffer.push(() => {
			this.isOutdated(e, t) || this.send(e, t);
		});
	}
	send(e, t) {
		let n = this.connection;
		t && e.event === Nf.join && n.joins.set(t, e.join_ref), this.encode(e, (r) => {
			n.isCurrent() && n.isOpen() && (e.event !== Nf.leave && this.isOutdated(e, t) || n.transport.send(r));
		});
	}
	isOutdated(e, t) {
		return !!t && (e.join_ref !== t.joinRef() || t.isClosed());
	}
	makeRef() {
		let e = this.ref + 1;
		return this.ref = e === this.ref ? 0 : e, this.ref.toString();
	}
	sendHeartbeat() {
		(!this.pendingHeartbeatRef || this.isConnected()) && (this.pendingHeartbeatRef = this.makeRef(), this.push({
			topic: "phoenix",
			event: "heartbeat",
			payload: {},
			ref: this.pendingHeartbeatRef
		}), this.heartbeatTimeoutTimer = setTimeout(() => this.heartbeatTimeout(), this.heartbeatIntervalMs));
	}
	flushSendBuffer() {
		this.isConnected() && this.sendBuffer.length > 0 && (this.sendBuffer.forEach((e) => e()), this.sendBuffer = []);
	}
	onConnMessage(e) {
		let t = this.connection, n = t && t.isOpen();
		this.decode(e.data, (e) => {
			if (t !== this.connection || n && !t.isOpen()) return;
			let { topic: r, event: i, payload: a, ref: o, join_ref: s } = e;
			o && o === this.pendingHeartbeatRef && (this.clearHeartbeats(), this.heartbeatTimer = setTimeout(() => this.sendHeartbeat(), this.heartbeatIntervalMs)), this.hasLogger() && this.log("receive", `${a.status || ""} ${r} ${i} ${o && "(" + o + ")" || ""}`, a);
			let c = this.channels;
			for (let e = 0; e < c.length; e++) {
				let t = c[e];
				t.isMember(r, i, a, s) && t.trigger(i, a, o, s);
			}
			let l = this.stateChangeCallbacks.message;
			for (let t = 0; t < l.length; t++) {
				let [, n] = l[t];
				n(e);
			}
			let u = o && t.pings.get(o);
			u && (t.pings.delete(o), u());
		});
	}
	leaveOpenTopic(e) {
		let t = this.channels.find((t) => t.topic === e && (t.isJoined() || t.isJoining()));
		t && (this.hasLogger() && this.log("transport", `leaving duplicate topic "${e}"`), t.leave());
	}
}, Kf = Symbol("Let zodToJsonSchema decide on which parser to use"), qf = {
	name: void 0,
	$refStrategy: "root",
	basePath: ["#"],
	effectStrategy: "input",
	pipeStrategy: "all",
	dateStrategy: "format:date-time",
	mapStrategy: "entries",
	removeAdditionalStrategy: "passthrough",
	allowedAdditionalProperties: !0,
	rejectedAdditionalProperties: !1,
	definitionPath: "definitions",
	target: "jsonSchema7",
	strictUnions: !1,
	definitions: {},
	errorMessages: !1,
	markdownDescription: !1,
	patternStrategy: "escape",
	applyRegexFlags: !1,
	emailStrategy: "format:email",
	base64Strategy: "contentEncoding:base64",
	nameStrategy: "ref",
	openAiAnyTypeName: "OpenAiAnyType"
}, Jf = (e) => typeof e == "string" ? {
	...qf,
	name: e
} : {
	...qf,
	...e
}, Yf = (e) => {
	let t = Jf(e), n = t.name === void 0 ? t.basePath : [
		...t.basePath,
		t.definitionPath,
		t.name
	];
	return {
		...t,
		flags: { hasReferencedOpenAiAnyType: !1 },
		currentPath: n,
		propertyPath: void 0,
		seen: new Map(Object.entries(t.definitions).map(([e, n]) => [n._def, {
			def: n._def,
			path: [
				...t.basePath,
				t.definitionPath,
				e
			],
			jsonSchema: void 0
		}]))
	};
};
// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/errorMessages.js
function Xf(e, t, n, r) {
	r?.errorMessages && n && (e.errorMessage = {
		...e.errorMessage,
		[t]: n
	});
}
function U(e, t, n, r, i) {
	e[t] = n, Xf(e, t, r, i);
}
// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/getRelativePath.js
var Zf = (e, t) => {
	let n = 0;
	for (; n < e.length && n < t.length && e[n] === t[n]; n++);
	return [(e.length - n).toString(), ...t.slice(n)].join("/");
};
// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/any.js
function Qf(e) {
	if (e.target !== "openAi") return {};
	let t = [
		...e.basePath,
		e.definitionPath,
		e.openAiAnyTypeName
	];
	return e.flags.hasReferencedOpenAiAnyType = !0, { $ref: e.$refStrategy === "relative" ? Zf(t, e.currentPath) : t.join("/") };
}
// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/array.js
function $f(e, t) {
	let n = { type: "array" };
	return e.type?._def && e.type?._def?.typeName !== v.ZodAny && (n.items = W(e.type._def, {
		...t,
		currentPath: [...t.currentPath, "items"]
	})), e.minLength && U(n, "minItems", e.minLength.value, e.minLength.message, t), e.maxLength && U(n, "maxItems", e.maxLength.value, e.maxLength.message, t), e.exactLength && (U(n, "minItems", e.exactLength.value, e.exactLength.message, t), U(n, "maxItems", e.exactLength.value, e.exactLength.message, t)), n;
}
// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/bigint.js
function ep(e, t) {
	let n = {
		type: "integer",
		format: "int64"
	};
	if (!e.checks) return n;
	for (let r of e.checks) switch (r.kind) {
		case "min":
			t.target === "jsonSchema7" ? r.inclusive ? U(n, "minimum", r.value, r.message, t) : U(n, "exclusiveMinimum", r.value, r.message, t) : (r.inclusive || (n.exclusiveMinimum = !0), U(n, "minimum", r.value, r.message, t));
			break;
		case "max":
			t.target === "jsonSchema7" ? r.inclusive ? U(n, "maximum", r.value, r.message, t) : U(n, "exclusiveMaximum", r.value, r.message, t) : (r.inclusive || (n.exclusiveMaximum = !0), U(n, "maximum", r.value, r.message, t));
			break;
		case "multipleOf": U(n, "multipleOf", r.value, r.message, t);
	}
	return n;
}
// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/boolean.js
function tp() {
	return { type: "boolean" };
}
// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/branded.js
function np(e, t) {
	return W(e.type._def, t);
}
// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/catch.js
var rp = (e, t) => W(e.innerType._def, t);
// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/date.js
function ip(e, t, n) {
	let r = n ?? t.dateStrategy;
	if (Array.isArray(r)) return { anyOf: r.map((n, r) => ip(e, t, n)) };
	switch (r) {
		case "string":
		case "format:date-time": return {
			type: "string",
			format: "date-time"
		};
		case "format:date": return {
			type: "string",
			format: "date"
		};
		case "integer": return ap(e, t);
	}
}
var ap = (e, t) => {
	let n = {
		type: "integer",
		format: "unix-time"
	};
	if (t.target === "openApi3") return n;
	for (let r of e.checks) switch (r.kind) {
		case "min":
			U(n, "minimum", r.value, r.message, t);
			break;
		case "max": U(n, "maximum", r.value, r.message, t);
	}
	return n;
};
// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/default.js
function op(e, t) {
	return {
		...W(e.innerType._def, t),
		default: e.defaultValue()
	};
}
// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/effects.js
function sp(e, t) {
	return t.effectStrategy === "input" ? W(e.schema._def, t) : Qf(t);
}
// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/enum.js
function cp(e) {
	return {
		type: "string",
		enum: Array.from(e.values)
	};
}
// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/intersection.js
var lp = (e) => "type" in e && e.type === "string" ? !1 : "allOf" in e;
function up(e, t) {
	let n = [W(e.left._def, {
		...t,
		currentPath: [
			...t.currentPath,
			"allOf",
			"0"
		]
	}), W(e.right._def, {
		...t,
		currentPath: [
			...t.currentPath,
			"allOf",
			"1"
		]
	})].filter((e) => !!e), r = t.target === "jsonSchema2019-09" ? { unevaluatedProperties: !1 } : void 0, i = [];
	return n.forEach((e) => {
		if (lp(e)) i.push(...e.allOf), e.unevaluatedProperties === void 0 && (r = void 0);
		else {
			let t = e;
			if ("additionalProperties" in e && e.additionalProperties === !1) {
				let { additionalProperties: n, ...r } = e;
				t = r;
			} else r = void 0;
			i.push(t);
		}
	}), i.length ? {
		allOf: i,
		...r
	} : void 0;
}
// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/literal.js
function dp(e, t) {
	let n = typeof e.value;
	return n !== "bigint" && n !== "number" && n !== "boolean" && n !== "string" ? { type: Array.isArray(e.value) ? "array" : "object" } : t.target === "openApi3" ? {
		type: n === "bigint" ? "integer" : n,
		enum: [e.value]
	} : {
		type: n === "bigint" ? "integer" : n,
		const: e.value
	};
}
// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/string.js
var fp = void 0, pp = {
	cuid: /^[cC][^\s-]{8,}$/,
	cuid2: /^[0-9a-z]+$/,
	ulid: /^[0-9A-HJKMNP-TV-Z]{26}$/,
	email: /^(?!\.)(?!.*\.\.)([a-zA-Z0-9_'+\-\.]*)[a-zA-Z0-9_+-]@([a-zA-Z0-9][a-zA-Z0-9\-]*\.)+[a-zA-Z]{2,}$/,
	emoji: () => (fp === void 0 && (fp = RegExp("^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$", "u")), fp),
	uuid: /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/,
	ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,
	ipv4Cidr: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/,
	ipv6: /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/,
	ipv6Cidr: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
	base64: /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/,
	base64url: /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/,
	nanoid: /^[a-zA-Z0-9_-]{21}$/,
	jwt: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/
};
function mp(e, t) {
	let n = { type: "string" };
	if (e.checks) for (let r of e.checks) switch (r.kind) {
		case "min":
			U(n, "minLength", typeof n.minLength == "number" ? Math.max(n.minLength, r.value) : r.value, r.message, t);
			break;
		case "max":
			U(n, "maxLength", typeof n.maxLength == "number" ? Math.min(n.maxLength, r.value) : r.value, r.message, t);
			break;
		case "email":
			switch (t.emailStrategy) {
				case "format:email":
					vp(n, "email", r.message, t);
					break;
				case "format:idn-email":
					vp(n, "idn-email", r.message, t);
					break;
				case "pattern:zod": yp(n, pp.email, r.message, t);
			}
			break;
		case "url":
			vp(n, "uri", r.message, t);
			break;
		case "uuid":
			vp(n, "uuid", r.message, t);
			break;
		case "regex":
			yp(n, r.regex, r.message, t);
			break;
		case "cuid":
			yp(n, pp.cuid, r.message, t);
			break;
		case "cuid2":
			yp(n, pp.cuid2, r.message, t);
			break;
		case "startsWith":
			yp(n, RegExp(`^${hp(r.value, t)}`), r.message, t);
			break;
		case "endsWith":
			yp(n, RegExp(`${hp(r.value, t)}$`), r.message, t);
			break;
		case "datetime":
			vp(n, "date-time", r.message, t);
			break;
		case "date":
			vp(n, "date", r.message, t);
			break;
		case "time":
			vp(n, "time", r.message, t);
			break;
		case "duration":
			vp(n, "duration", r.message, t);
			break;
		case "length":
			U(n, "minLength", typeof n.minLength == "number" ? Math.max(n.minLength, r.value) : r.value, r.message, t), U(n, "maxLength", typeof n.maxLength == "number" ? Math.min(n.maxLength, r.value) : r.value, r.message, t);
			break;
		case "includes":
			yp(n, RegExp(hp(r.value, t)), r.message, t);
			break;
		case "ip":
			r.version !== "v6" && vp(n, "ipv4", r.message, t), r.version !== "v4" && vp(n, "ipv6", r.message, t);
			break;
		case "base64url":
			yp(n, pp.base64url, r.message, t);
			break;
		case "jwt":
			yp(n, pp.jwt, r.message, t);
			break;
		case "cidr":
			r.version !== "v6" && yp(n, pp.ipv4Cidr, r.message, t), r.version !== "v4" && yp(n, pp.ipv6Cidr, r.message, t);
			break;
		case "emoji":
			yp(n, pp.emoji(), r.message, t);
			break;
		case "ulid":
			yp(n, pp.ulid, r.message, t);
			break;
		case "base64":
			switch (t.base64Strategy) {
				case "format:binary":
					vp(n, "binary", r.message, t);
					break;
				case "contentEncoding:base64":
					U(n, "contentEncoding", "base64", r.message, t);
					break;
				case "pattern:zod": yp(n, pp.base64, r.message, t);
			}
			break;
		case "nanoid": yp(n, pp.nanoid, r.message, t);
	}
	return n;
}
function hp(e, t) {
	return t.patternStrategy === "escape" ? _p(e) : e;
}
var gp = /* @__PURE__ */ new Set("ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvxyz0123456789");
function _p(e) {
	let t = "";
	for (let n = 0; n < e.length; n++) gp.has(e[n]) || (t += "\\"), t += e[n];
	return t;
}
function vp(e, t, n, r) {
	e.format || e.anyOf?.some((e) => e.format) ? (e.anyOf ||= [], e.format && (e.anyOf.push({
		format: e.format,
		...e.errorMessage && r.errorMessages && { errorMessage: { format: e.errorMessage.format } }
	}), delete e.format, e.errorMessage && (delete e.errorMessage.format, Object.keys(e.errorMessage).length === 0 && delete e.errorMessage)), e.anyOf.push({
		format: t,
		...n && r.errorMessages && { errorMessage: { format: n } }
	})) : U(e, "format", t, n, r);
}
function yp(e, t, n, r) {
	e.pattern || e.allOf?.some((e) => e.pattern) ? (e.allOf ||= [], e.pattern && (e.allOf.push({
		pattern: e.pattern,
		...e.errorMessage && r.errorMessages && { errorMessage: { pattern: e.errorMessage.pattern } }
	}), delete e.pattern, e.errorMessage && (delete e.errorMessage.pattern, Object.keys(e.errorMessage).length === 0 && delete e.errorMessage)), e.allOf.push({
		pattern: bp(t, r),
		...n && r.errorMessages && { errorMessage: { pattern: n } }
	})) : U(e, "pattern", bp(t, r), n, r);
}
function bp(e, t) {
	if (!t.applyRegexFlags || !e.flags) return e.source;
	let n = {
		i: e.flags.includes("i"),
		m: e.flags.includes("m"),
		s: e.flags.includes("s")
	}, r = n.i ? e.source.toLowerCase() : e.source, i = "", a = !1, o = !1, s = !1;
	for (let e = 0; e < r.length; e++) if (a) i += r[e], a = !1;
	else {
		if (n.i) {
			if (o) {
				if (r[e].match(/[a-z]/)) {
					s ? (i += r[e], i += `${r[e - 2]}-${r[e]}`.toUpperCase(), s = !1) : r[e + 1] === "-" && r[e + 2]?.match(/[a-z]/) ? (i += r[e], s = !0) : i += `${r[e]}${r[e].toUpperCase()}`;
					continue;
				}
			} else if (r[e].match(/[a-z]/)) {
				i += `[${r[e]}${r[e].toUpperCase()}]`;
				continue;
			}
		}
		if (n.m) {
			if (r[e] === "^") {
				i += "(^|(?<=[\r\n]))";
				continue;
			}
			if (r[e] === "$") {
				i += "($|(?=[\r\n]))";
				continue;
			}
		}
		n.s && r[e] === "." ? i += o ? `${r[e]}\r\n` : `[${r[e]}\r\n]` : (i += r[e], r[e] === "\\" ? a = !0 : o && r[e] === "]" ? o = !1 : !o && r[e] === "[" && (o = !0));
	}
	try {
		new RegExp(i);
	} catch {
		return console.warn(`Could not convert regex pattern at ${t.currentPath.join("/")} to a flag-independent form! Falling back to the flag-ignorant source`), e.source;
	}
	return i;
}
// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/record.js
function xp(e, t) {
	if (t.target === "openAi" && console.warn("Warning: OpenAI may not support records in schemas! Try an array of key-value pairs instead."), t.target === "openApi3" && e.keyType?._def.typeName === v.ZodEnum) return {
		type: "object",
		required: e.keyType._def.values,
		properties: e.keyType._def.values.reduce((n, r) => ({
			...n,
			[r]: W(e.valueType._def, {
				...t,
				currentPath: [
					...t.currentPath,
					"properties",
					r
				]
			}) ?? Qf(t)
		}), {}),
		additionalProperties: t.rejectedAdditionalProperties
	};
	let n = {
		type: "object",
		additionalProperties: W(e.valueType._def, {
			...t,
			currentPath: [...t.currentPath, "additionalProperties"]
		}) ?? t.allowedAdditionalProperties
	};
	if (t.target === "openApi3") return n;
	if (e.keyType?._def.typeName === v.ZodString && e.keyType._def.checks?.length) {
		let { type: r, ...i } = mp(e.keyType._def, t);
		return {
			...n,
			propertyNames: i
		};
	}
	if (e.keyType?._def.typeName === v.ZodEnum) return {
		...n,
		propertyNames: { enum: e.keyType._def.values }
	};
	if (e.keyType?._def.typeName === v.ZodBranded && e.keyType._def.type._def.typeName === v.ZodString && e.keyType._def.type._def.checks?.length) {
		let { type: r, ...i } = np(e.keyType._def, t);
		return {
			...n,
			propertyNames: i
		};
	}
	return n;
}
// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/map.js
function Sp(e, t) {
	return t.mapStrategy === "record" ? xp(e, t) : {
		type: "array",
		maxItems: 125,
		items: {
			type: "array",
			items: [W(e.keyType._def, {
				...t,
				currentPath: [
					...t.currentPath,
					"items",
					"items",
					"0"
				]
			}) || Qf(t), W(e.valueType._def, {
				...t,
				currentPath: [
					...t.currentPath,
					"items",
					"items",
					"1"
				]
			}) || Qf(t)],
			minItems: 2,
			maxItems: 2
		}
	};
}
// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/nativeEnum.js
function Cp(e) {
	let t = e.values, n = Object.keys(e.values).filter((e) => typeof t[t[e]] != "number").map((e) => t[e]), r = Array.from(new Set(n.map((e) => typeof e)));
	return {
		type: r.length === 1 ? r[0] === "string" ? "string" : "number" : ["string", "number"],
		enum: n
	};
}
// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/never.js
function wp(e) {
	return e.target === "openAi" ? void 0 : { not: Qf({
		...e,
		currentPath: [...e.currentPath, "not"]
	}) };
}
// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/null.js
function Tp(e) {
	return e.target === "openApi3" ? {
		enum: ["null"],
		nullable: !0
	} : { type: "null" };
}
// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/union.js
var Ep = {
	ZodString: "string",
	ZodNumber: "number",
	ZodBigInt: "integer",
	ZodBoolean: "boolean",
	ZodNull: "null"
};
function Dp(e, t) {
	if (t.target === "openApi3") return Op(e, t);
	let n = e.options instanceof Map ? Array.from(e.options.values()) : e.options;
	if (n.every((e) => e._def.typeName in Ep && (!e._def.checks || !e._def.checks.length))) {
		let e = n.reduce((e, t) => {
			let n = Ep[t._def.typeName];
			return n && !e.includes(n) ? [...e, n] : e;
		}, []);
		return { type: e.length > 1 ? e : e[0] };
	}
	if (n.every((e) => e._def.typeName === "ZodLiteral" && !e.description)) {
		let e = n.reduce((e, t) => {
			let n = typeof t._def.value;
			switch (n) {
				case "string":
				case "number":
				case "boolean": return [...e, n];
				case "bigint": return [...e, "integer"];
				case "object": if (t._def.value === null) return [...e, "null"];
				default: return e;
			}
		}, []);
		if (e.length === n.length) {
			let t = e.filter((e, t, n) => n.indexOf(e) === t);
			return {
				type: t.length > 1 ? t : t[0],
				enum: n.reduce((e, t) => e.includes(t._def.value) ? e : [...e, t._def.value], [])
			};
		}
	} else if (n.every((e) => e._def.typeName === "ZodEnum")) return {
		type: "string",
		enum: n.reduce((e, t) => [...e, ...t._def.values.filter((t) => !e.includes(t))], [])
	};
	return Op(e, t);
}
var Op = (e, t) => {
	let n = (e.options instanceof Map ? Array.from(e.options.values()) : e.options).map((e, n) => W(e._def, {
		...t,
		currentPath: [
			...t.currentPath,
			"anyOf",
			`${n}`
		]
	})).filter((e) => !!e && (!t.strictUnions || typeof e == "object" && Object.keys(e).length > 0));
	return n.length ? { anyOf: n } : void 0;
};
// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/nullable.js
function kp(e, t) {
	if ([
		"ZodString",
		"ZodNumber",
		"ZodBigInt",
		"ZodBoolean",
		"ZodNull"
	].includes(e.innerType._def.typeName) && (!e.innerType._def.checks || !e.innerType._def.checks.length)) return t.target === "openApi3" ? {
		type: Ep[e.innerType._def.typeName],
		nullable: !0
	} : { type: [Ep[e.innerType._def.typeName], "null"] };
	if (t.target === "openApi3") {
		let n = W(e.innerType._def, {
			...t,
			currentPath: [...t.currentPath]
		});
		return n && "$ref" in n ? {
			allOf: [n],
			nullable: !0
		} : n && {
			...n,
			nullable: !0
		};
	}
	let n = W(e.innerType._def, {
		...t,
		currentPath: [
			...t.currentPath,
			"anyOf",
			"0"
		]
	});
	return n && { anyOf: [n, { type: "null" }] };
}
// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/number.js
function Ap(e, t) {
	let n = { type: "number" };
	if (!e.checks) return n;
	for (let r of e.checks) switch (r.kind) {
		case "int":
			n.type = "integer", Xf(n, "type", r.message, t);
			break;
		case "min":
			t.target === "jsonSchema7" ? r.inclusive ? U(n, "minimum", r.value, r.message, t) : U(n, "exclusiveMinimum", r.value, r.message, t) : (r.inclusive || (n.exclusiveMinimum = !0), U(n, "minimum", r.value, r.message, t));
			break;
		case "max":
			t.target === "jsonSchema7" ? r.inclusive ? U(n, "maximum", r.value, r.message, t) : U(n, "exclusiveMaximum", r.value, r.message, t) : (r.inclusive || (n.exclusiveMaximum = !0), U(n, "maximum", r.value, r.message, t));
			break;
		case "multipleOf": U(n, "multipleOf", r.value, r.message, t);
	}
	return n;
}
// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/object.js
function jp(e, t) {
	let n = t.target === "openAi", r = {
		type: "object",
		properties: {}
	}, i = [], a = e.shape();
	for (let e in a) {
		let o = a[e];
		if (o === void 0 || o._def === void 0) continue;
		let s = Np(o);
		s && n && (o._def.typeName === "ZodOptional" && (o = o._def.innerType), o.isNullable() || (o = o.nullable()), s = !1);
		let c = W(o._def, {
			...t,
			currentPath: [
				...t.currentPath,
				"properties",
				e
			],
			propertyPath: [
				...t.currentPath,
				"properties",
				e
			]
		});
		c !== void 0 && (r.properties[e] = c, s || i.push(e));
	}
	i.length && (r.required = i);
	let o = Mp(e, t);
	return o !== void 0 && (r.additionalProperties = o), r;
}
function Mp(e, t) {
	if (e.catchall._def.typeName !== "ZodNever") return W(e.catchall._def, {
		...t,
		currentPath: [...t.currentPath, "additionalProperties"]
	});
	switch (e.unknownKeys) {
		case "passthrough": return t.allowedAdditionalProperties;
		case "strict": return t.rejectedAdditionalProperties;
		case "strip": return t.removeAdditionalStrategy === "strict" ? t.allowedAdditionalProperties : t.rejectedAdditionalProperties;
	}
}
function Np(e) {
	try {
		return e.isOptional();
	} catch {
		return !0;
	}
}
// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/optional.js
var Pp = (e, t) => {
	if (t.currentPath.toString() === t.propertyPath?.toString()) return W(e.innerType._def, t);
	let n = W(e.innerType._def, {
		...t,
		currentPath: [
			...t.currentPath,
			"anyOf",
			"1"
		]
	});
	return n ? { anyOf: [{ not: Qf(t) }, n] } : Qf(t);
}, Fp = (e, t) => {
	if (t.pipeStrategy === "input") return W(e.in._def, t);
	if (t.pipeStrategy === "output") return W(e.out._def, t);
	let n = W(e.in._def, {
		...t,
		currentPath: [
			...t.currentPath,
			"allOf",
			"0"
		]
	});
	return { allOf: [n, W(e.out._def, {
		...t,
		currentPath: [
			...t.currentPath,
			"allOf",
			n ? "1" : "0"
		]
	})].filter((e) => e !== void 0) };
};
// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/promise.js
function Ip(e, t) {
	return W(e.type._def, t);
}
// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/set.js
function Lp(e, t) {
	let n = {
		type: "array",
		uniqueItems: !0,
		items: W(e.valueType._def, {
			...t,
			currentPath: [...t.currentPath, "items"]
		})
	};
	return e.minSize && U(n, "minItems", e.minSize.value, e.minSize.message, t), e.maxSize && U(n, "maxItems", e.maxSize.value, e.maxSize.message, t), n;
}
// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/tuple.js
function Rp(e, t) {
	return e.rest ? {
		type: "array",
		minItems: e.items.length,
		items: e.items.map((e, n) => W(e._def, {
			...t,
			currentPath: [
				...t.currentPath,
				"items",
				`${n}`
			]
		})).reduce((e, t) => t === void 0 ? e : [...e, t], []),
		additionalItems: W(e.rest._def, {
			...t,
			currentPath: [...t.currentPath, "additionalItems"]
		})
	} : {
		type: "array",
		minItems: e.items.length,
		maxItems: e.items.length,
		items: e.items.map((e, n) => W(e._def, {
			...t,
			currentPath: [
				...t.currentPath,
				"items",
				`${n}`
			]
		})).reduce((e, t) => t === void 0 ? e : [...e, t], [])
	};
}
// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/undefined.js
function zp(e) {
	return { not: Qf(e) };
}
// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/unknown.js
function Bp(e) {
	return Qf(e);
}
// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/readonly.js
var Vp = (e, t) => W(e.innerType._def, t), Hp = (e, t, n) => {
	switch (t) {
		case v.ZodString: return mp(e, n);
		case v.ZodNumber: return Ap(e, n);
		case v.ZodObject: return jp(e, n);
		case v.ZodBigInt: return ep(e, n);
		case v.ZodBoolean: return tp();
		case v.ZodDate: return ip(e, n);
		case v.ZodUndefined: return zp(n);
		case v.ZodNull: return Tp(n);
		case v.ZodArray: return $f(e, n);
		case v.ZodUnion:
		case v.ZodDiscriminatedUnion: return Dp(e, n);
		case v.ZodIntersection: return up(e, n);
		case v.ZodTuple: return Rp(e, n);
		case v.ZodRecord: return xp(e, n);
		case v.ZodLiteral: return dp(e, n);
		case v.ZodEnum: return cp(e);
		case v.ZodNativeEnum: return Cp(e);
		case v.ZodNullable: return kp(e, n);
		case v.ZodOptional: return Pp(e, n);
		case v.ZodMap: return Sp(e, n);
		case v.ZodSet: return Lp(e, n);
		case v.ZodLazy: return () => e.getter()._def;
		case v.ZodPromise: return Ip(e, n);
		case v.ZodNaN:
		case v.ZodNever: return wp(n);
		case v.ZodEffects: return sp(e, n);
		case v.ZodAny: return Qf(n);
		case v.ZodUnknown: return Bp(n);
		case v.ZodDefault: return op(e, n);
		case v.ZodBranded: return np(e, n);
		case v.ZodReadonly: return Vp(e, n);
		case v.ZodCatch: return rp(e, n);
		case v.ZodPipeline: return Fp(e, n);
		case v.ZodFunction:
		case v.ZodVoid:
		case v.ZodSymbol: return;
		default: return ((e) => void 0)(t);
	}
};
// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parseDef.js
function W(e, t, n = !1) {
	let r = t.seen.get(e);
	if (t.override) {
		let i = t.override?.(e, t, r, n);
		if (i !== Kf) return i;
	}
	if (r && !n) {
		let e = Up(r, t);
		if (e !== void 0) return e;
	}
	let i = {
		def: e,
		path: t.currentPath,
		jsonSchema: void 0
	};
	t.seen.set(e, i);
	let a = Hp(e, e.typeName, t), o = typeof a == "function" ? W(a(), t) : a;
	if (o && Wp(e, t, o), t.postProcess) {
		let n = t.postProcess(o, e, t);
		return i.jsonSchema = o, n;
	}
	return i.jsonSchema = o, o;
}
var Up = (e, t) => {
	switch (t.$refStrategy) {
		case "root": return { $ref: e.path.join("/") };
		case "relative": return { $ref: Zf(t.currentPath, e.path) };
		case "none":
		case "seen": return e.path.length < t.currentPath.length && e.path.every((e, n) => t.currentPath[n] === e) ? (console.warn(`Recursive reference detected at ${t.currentPath.join("/")}! Defaulting to any`), Qf(t)) : t.$refStrategy === "seen" ? Qf(t) : void 0;
	}
}, Wp = (e, t, n) => (e.description && (n.description = e.description, t.markdownDescription && (n.markdownDescription = e.description)), n), Gp = (e, t) => {
	let n = Yf(t), r = typeof t == "object" && t.definitions ? Object.entries(t.definitions).reduce((e, [t, r]) => ({
		...e,
		[t]: W(r._def, {
			...n,
			currentPath: [
				...n.basePath,
				n.definitionPath,
				t
			]
		}, !0) ?? Qf(n)
	}), {}) : void 0, i = typeof t == "string" ? t : t?.nameStrategy === "title" ? void 0 : t?.name, a = W(e._def, i === void 0 ? n : {
		...n,
		currentPath: [
			...n.basePath,
			n.definitionPath,
			i
		]
	}, !1) ?? Qf(n), o = typeof t == "object" && t.name !== void 0 && t.nameStrategy === "title" ? t.name : void 0;
	o !== void 0 && (a.title = o), n.flags.hasReferencedOpenAiAnyType && (r ||= {}, r[n.openAiAnyTypeName] || (r[n.openAiAnyTypeName] = {
		type: [
			"string",
			"number",
			"integer",
			"boolean",
			"array",
			"null"
		],
		items: { $ref: n.$refStrategy === "relative" ? "1" : [
			...n.basePath,
			n.definitionPath,
			n.openAiAnyTypeName
		].join("/") }
	}));
	let s = i === void 0 ? r ? {
		...a,
		[n.definitionPath]: r
	} : a : {
		$ref: [
			...n.$refStrategy === "relative" ? [] : n.basePath,
			n.definitionPath,
			i
		].join("/"),
		[n.definitionPath]: {
			...r,
			[i]: a
		}
	};
	return n.target === "jsonSchema7" ? s.$schema = "http://json-schema.org/draft-07/schema#" : (n.target === "jsonSchema2019-09" || n.target === "openAi") && (s.$schema = "https://json-schema.org/draft/2019-09/schema#"), n.target === "openAi" && ("anyOf" in s || "oneOf" in s || "allOf" in s || "type" in s && Array.isArray(s.type)) && console.warn("Warning: OpenAI may not support schemas with unions as roots! Try wrapping it in an object property."), s;
}, Kp = [
	"page",
	"navigation",
	"click",
	"input",
	"network",
	"thread.linked",
	"agent.run",
	"agent.message",
	"tool.call"
], qp = "[redacted]", Jp = /password|passwd|passphrase|passcode|credential|api(key|token)|privatekey|subscriptionkey|(access|refresh|auth|session)token|clientsecret/, Yp = / (secret|id ?token)s? | (authorization|cookies?|jwt|bearer ?token|[cx]srf ?token) $|^ (pwd|pass|token|otp) $/, Xp = / (ids?|at|in|expires?|expiry|length|count|enabled|required|policy|hint|type) $/, Zp = /(current|new)-password|one-time-code/, Qp = /"((?:\\[\s\S]|[^"\\])*)("?)(\s*:\s*)?/g, $p = /"(?:\\[\s\S]?|[^"\\])*"?/y, em = /([\w$.%+[\]-]{1,64})(\s*(?:=|:(?=\s|$))\s*)((?:(?:basic|bearer|digest|token) +)?[^\s&,;)}\]]*)/gi, tm = /([a-z][\w+.-]{0,31}:\/\/)[^\s/?#"]*@/gi, nm = 16384, rm = 20, im = (e) => {
	let t = ` ${e.replace(/%([\da-f]{2})/gi, (e, t) => String.fromCharCode(parseInt(t, 16))).replace(/([a-z\d])(?=[A-Z])/g, "$1 ").toLowerCase().split(/[^a-z\d]+/).filter(Boolean).join(" ")} `;
	return !Xp.test(t) && (Jp.test(t.replace(/ /g, "")) || Yp.test(t));
}, am = (e) => {
	try {
		return JSON.parse(`"${e}"`);
	} catch {
		return e;
	}
}, om = (e, t) => {
	let n = 0;
	for (let r = t; r < e.length; r++) {
		let t = e[r];
		if (t === "\"") $p.lastIndex = r, $p.test(e), r = $p.lastIndex - 1;
		else if (t === "{" || t === "[") {
			n++;
			continue;
		} else if (t === "}" || t === "]") {
			if (--n < 0) return r;
		} else {
			if (!n && (t === "," || /\s/.test(t))) return r;
			continue;
		}
		if (!n) return r + 1;
	}
	return e.length;
}, sm = (e, t = 0) => {
	let n = new RegExp(Qp), r = !1, i = (e) => {
		let t = e.replace(tm, "$1");
		return t.replace(em, (e, n, i, a, o) => !im(n) || o + e.length === t.length && (r = !0, !a) ? e : n + i + qp);
	}, a = "", o = 0, s;
	for (; s = n.exec(e);) {
		let [c, l, u, d] = s;
		r = !1, a += i(e.slice(o, s.index));
		let f = n.lastIndex, p = c, m = l.includes("\\") ? am(l) : l;
		if (d) {
			if (im(m)) {
				let t = om(e, f);
				/^(true|false|null|)$/.test(e.slice(f, t)) || (p += `"${qp}"`, f = t);
			}
		} else if (r) p = `"${qp}"`;
		else if (t < 4 && /[=:"]/.test(m)) {
			let e = sm(m, t + 1);
			e !== m && (p = JSON.stringify(e).slice(0, u ? void 0 : -1));
		}
		a += p, o = n.lastIndex = f;
	}
	return a + i(e.slice(o));
};
function cm() {
	let e = /* @__PURE__ */ new WeakSet(), t = /* @__PURE__ */ new Map(), n, r = (t) => {
		for (let n of t) n.oldValue?.toLowerCase() === "password" && e.add(n.target);
	}, i = (e, n) => {
		for (let r of [...t.values()].sort((e, t) => t.length - e.length)) for (let t of [
			r,
			JSON.stringify(r).slice(1, -1),
			encodeURIComponent(r),
			new URLSearchParams({ v: r }).toString().slice(2),
			...[n?.(r) ?? ""].filter((e) => e.length >= 4)
		]) e = /^\d+$/.test(t) ? e.replace(RegExp(`(?<!\\d)${t}(?!\\d)`, "g"), qp) : e.split(t).join(qp);
		return e;
	}, a = (i) => (n && r(n.takeRecords()), !(i instanceof HTMLInputElement) || !(i.type === "password" || e.has(i) || im(i.name) || Zp.test(i.getAttribute("autocomplete") ?? "")) ? !1 : (e.add(i), i.value.length >= 4 && (t.delete(i), t.set(i, i.value), t.size > rm && t.delete(t.keys().next().value)), !0));
	return {
		isPassword: a,
		scrub: i,
		watch() {
			try {
				for (let t of document.querySelectorAll("input[type=password]")) e.add(t);
			} catch {}
			let t;
			try {
				t = new MutationObserver(r), t.observe(document, {
					subtree: !0,
					attributeFilter: ["type"],
					attributeOldValue: !0
				}), n = t;
			} catch {
				t = void 0;
			}
			let i = (e) => {
				try {
					let [t] = e.composedPath();
					t instanceof Element && a(t);
				} catch {}
			};
			for (let e of ["input", "change"]) window.addEventListener(e, i, !0);
			return () => {
				t?.disconnect(), t !== void 0 && n === t && (n = void 0);
				for (let e of ["input", "change"]) window.removeEventListener(e, i, !0);
			};
		},
		field: (e, t) => im(e) ? qp : i(sm(t)),
		body(e) {
			try {
				return i(sm(e.slice(0, nm)));
			} catch {
				return;
			}
		},
		url(e) {
			try {
				return i(e.replace(/[^#]+/g, (e) => sm(e)));
			} catch {
				return qp;
			}
		}
	};
}
var lm = "button, a[href], input, select, textarea, label, summary, [role], [data-copilotkit-action], [contenteditable]:not([contenteditable=\"false\"])", um = 5, dm = 1e3;
function fm(e, t) {
	let n = e;
	for (; n !== null;) {
		let e = n.closest(t);
		if (e !== null) return e;
		let r = n.getRootNode();
		n = r instanceof ShadowRoot ? r.host : null;
	}
	return null;
}
function pm(e, t) {
	if (fm(e, "[data-copilotkit-ignore]") !== null) return null;
	let n = e.closest(lm) ?? e, r = t.isPassword(n);
	return {
		element: n,
		target: {
			tag: n.localName,
			role: n.getAttribute("role"),
			action: n.getAttribute("data-copilotkit-action"),
			text: (n.textContent ?? "").slice(0, dm),
			attributes: Object.fromEntries(Array.from(n.attributes, ({ name: e, value: n }) => [e, r && e === "value" || im(e.replace(/^data-/, "")) ? qp : t.url(n)])),
			...qm(n, t)
		}
	};
}
var mm = 80, hm = 1e3, gm = 320, _m = /^(button|link|tab|menuitem(checkbox|radio)?|option|checkbox|switch|radio|treeitem)$/, vm = "[contenteditable]:not([contenteditable=\"false\"])", ym = `${vm}, [role~=textbox], [role~=searchbox], [role~=combobox]`, bm = `input, textarea, select, ${ym}`, xm = "h1, h2, h3, h4, h5, h6, [role~=heading]", Sm = `${xm}, p, ul, ol, li, dl, table, article, section, blockquote`, Cm = "script, style, template, [hidden], [aria-hidden=\"true\"]", wm = /^(b|i|u|em|strong|mark|small|sub|sup|abbr|code|kbd|s|q|cite|dfn|var|time|data|bdi|bdo|wbr|span)$/, Tm = /^(submit|button|reset|image)$/, Em = /^(submit|button|reset|image|checkbox|radio|range|color|file|hidden)$/, Dm = /\p{Default_Ignorable_Code_Point}/gu, Om = /(?:\b[a-z][\w+.-]{0,31}:\/\/|\bwww\.)[^\s<>"']*[^\s<>"'.,;:!?)]/gi, km = /[\p{L}\p{N}_.%+-]{1,64}@[\p{L}\p{N}-]{1,63}(?:\.[\p{L}\p{N}-]{1,63})+/gu, Am = /(^|[^\w-])(?:eyJ[\w-]*\.[\w-]*\.[\w-]*|[\w-]{16,}\.[\w-]{16,}\.[\w-]{16,}|(?=[\w-]*\d)[\w-]{8,}\.(?=[\w-]*\d)[\w-]{8,}\.(?=[\w-]*\d)[\w-]{8,})/g, jm = /[\w+/=-]{24,}/g, Mm = (e) => (e.getAttribute("role") ?? "").trim().split(/\s+/)[0].toLowerCase(), Nm = (e, t) => (e.getAttribute(t) ?? "").split(/\s+/).filter(Boolean), Pm = (e) => {
	let t = e.getRootNode();
	return t instanceof Document || t instanceof ShadowRoot ? t : null;
}, Fm = (e) => {
	let t = Mm(e);
	return t ? _m.test(t) : e.matches("button, a[href], summary");
}, Im = (e) => e instanceof HTMLInputElement ? !Em.test(e.type) : e.matches("textarea, select") || e.closest(ym) !== null;
function Lm(e) {
	if (e.localName === "img") return e.getAttribute("alt");
	if (e.localName !== "svg" && Mm(e) !== "img") return;
	let t = Array.from(e.children).find((e) => e.localName === "title" && e.childElementCount === 0);
	return e.getAttribute("aria-label") ?? t?.textContent ?? null;
}
function Rm(e, t) {
	if (Im(e)) return "";
	let n = "", r = 0, i = 0, a, o = /* @__PURE__ */ new Map(), s = (e) => n = (n + e).replace(/\s+/g, " "), c = (n) => {
		if (!t) return !0;
		for (let t = n, r = n.parentNode; t !== e && r !== null; t = r, r = r.parentNode) {
			let e = o.get(r) ?? /* @__PURE__ */ new Set();
			if (o.set(r, e), e.has(t)) break;
			if (e.add(t).size > 2) return !1;
		}
		return !0;
	}, l = e.firstChild;
	for (; l !== null;) {
		if (++r > hm || n.length > gm) {
			if (t) return "";
			break;
		}
		let o = !1;
		if (l instanceof Text) {
			let n = l.parentNode, r = n;
			for (; r !== e && wm.test(r.localName);) r = r.parentElement;
			if (/\S/.test(l.data) && (!c(n) || t && r.localName === "div" && (a ??= r) !== r)) return "";
			s(l.data);
		} else if (l instanceof Element) {
			if (l.matches(bm) || t && l.matches(Sm) && !(e.localName === "summary" && l.matches(xm)) && (l.localName !== "p" || ++i > 1)) return "";
			let n = l.matches(Cm) ? null : Lm(l);
			if (n) {
				if (!c(l)) return "";
				s(` ${n} `);
			} else n === void 0 && (wm.test(l.localName) || s(" "), o = !0);
		}
		if (o && l.firstChild !== null) l = l.firstChild;
		else {
			for (; l !== e && l.nextSibling === null;) l = l.parentNode, wm.test(l.localName) || s(" ");
			l = l === e ? null : l.nextSibling;
		}
	}
	return n;
}
var zm = (e) => (e.localName === "option" || /^(option|treeitem)$/.test(Mm(e))) && Bm(e);
function Bm(e) {
	if (e.closest("[role~=combobox], datalist") !== null) return !0;
	let t = Pm(e);
	return t !== null && Array.from(t.querySelectorAll("[role~=combobox], [aria-autocomplete]")).some((n) => [...Nm(n, "aria-controls"), ...Nm(n, "aria-owns")].some((n) => t.getElementById(n)?.contains(e)));
}
function Vm(e) {
	let t = Pm(e);
	return t === null ? null : Nm(e, "aria-labelledby").map((e) => {
		let n = t.getElementById(e);
		return n === null || Bm(n) ? "" : Rm(n, !1);
	}).join(" ");
}
var Hm = (e) => e.replace(Dm, "").replace(/\s+/g, " ").trim();
function Um(e) {
	let t = Rm(e, !0);
	return Array.from(Hm(t)).length > mm ? "" : t;
}
function Wm(e, t) {
	let n = Array.from(t.scrub(Hm(t.body(e.replace(Dm, "")) ?? ""), Hm).replace(Om, "[url]").replace(km, "[email]").replace(Am, `$1${qp}`).replace(jm, (e) => /\d/.test(e) ? qp : e));
	return n.length > mm ? `${n.slice(0, 79).join("").trimEnd()}…` : n.join("");
}
function Gm(e, t) {
	for (let n of e) {
		let e = Wm(n() ?? "", t);
		if (e) return e;
	}
}
function Km(e, t) {
	let n = e.closest("option, [role~=option], [role~=treeitem]");
	if (n !== null && zm(n)) return;
	let r = [() => Vm(e), () => e.getAttribute("aria-label")];
	if (/^(img|svg)$/.test(e.localName) || /^(img|presentation|none)$/.test(Mm(e))) {
		let n = Gm([...r, () => Lm(e) ?? null], t);
		if (n !== void 0) return n;
		let i = e.parentElement;
		for (; i !== null && !Fm(i);) i = i.parentElement;
		return i === null ? void 0 : Km(i, t);
	}
	let i = Fm(e) && !Im(e), a = e instanceof HTMLInputElement && Tm.test(e.type);
	return Gm([
		...r,
		() => a ? e.type === "image" ? e.getAttribute("alt") : e.value : null,
		() => i || a ? e.getAttribute("title") : null,
		() => i ? Um(e) : null
	], t);
}
function qm(e, t) {
	return e instanceof HTMLInputElement ? {
		value: t.isPassword(e) ? qp : e.value,
		...["checkbox", "radio"].includes(e.type) ? { checked: e.checked } : {},
		...e.type === "file" ? { files: Array.from(e.files ?? [], (e) => ({
			name: e.name,
			type: e.type,
			size: e.size,
			lastModified: e.lastModified
		})) } : {}
	} : e instanceof HTMLSelectElement ? {
		value: e.value,
		selectedValues: Array.from(e.selectedOptions, (e) => e.value)
	} : e instanceof HTMLTextAreaElement ? { value: e.value } : e.matches(vm) ? { value: e.textContent ?? "" } : {};
}
function Jm(e) {
	let [t] = e.composedPath();
	return t instanceof Element ? t : null;
}
function Ym(e) {
	return e.localName === "body" || e.localName === "html" || !e.isConnected;
}
function Xm(e, t) {
	return Math.abs(e.x - t.clientX) <= um && Math.abs(e.y - t.clientY) <= um;
}
function Zm(e) {
	let { emit: t, getRoute: n, enrich: r, isTrusted: i = (e) => e.isTrusted, redact: a = cm() } = e, o = null, s = (e) => {
		let t = pm(e, a);
		if (t === null) return null;
		try {
			let e = Km(t.element, a);
			e !== void 0 && (t.target.label = e);
		} catch {}
		return t;
	}, c = (e) => {
		try {
			if (e.isPrimary === !1) return;
			let t = Jm(e);
			o = {
				described: t === null ? null : s(t),
				x: e.clientX,
				y: e.clientY
			};
		} catch {
			o = null;
		}
	}, l = (e) => {
		let c = o;
		o = null;
		try {
			if (!i(e)) return;
			let o = Jm(e);
			if (o === null) return;
			let l = c !== null && Ym(o) && Xm(c, e) ? c.described : s(o);
			if (l === null) return;
			let u = e.detail === 0 ? "keyboard" : "pointer";
			t("click", {
				target: {
					...l.target,
					input: u
				},
				route: n(),
				url: a.url(location.href),
				...r?.(l.element)
			});
		} catch {}
	};
	return window.addEventListener("pointerdown", c, {
		capture: !0,
		passive: !0
	}), window.addEventListener("click", l, {
		capture: !0,
		passive: !0
	}), () => {
		window.removeEventListener("pointerdown", c, { capture: !0 }), window.removeEventListener("click", l, { capture: !0 });
	};
}
var Qm = 300, $m = /* @__PURE__ */ new Set([
	"text",
	"search",
	"tel",
	"url",
	"email",
	"password",
	"number"
]);
function eh(e) {
	let { emit: t, isTrusted: n = (e) => e.isTrusted, redact: r = cm() } = e, i = !0, a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new WeakMap(), s = /* @__PURE__ */ new WeakMap(), c = (e) => {
		clearTimeout(a.get(e)?.timer), a.delete(e);
	}, l = (e, n) => {
		try {
			if (!i || pm(e, r) === null || r.isPassword(e) && n.state.value !== qp) return;
			n.payload.eventType === "input" && o.set(e, JSON.stringify(n.state)), n.payload.url = r.url(n.payload.url), n.payload.target.text = r.url(n.payload.target.text), n.payload.target.attributes = Object.fromEntries(Object.entries(n.payload.target.attributes).map(([e, t]) => [e, r.url(t)])), t("input", n.payload);
		} catch {}
	}, u = () => {
		let e = [...a];
		for (let [t] of e) c(t);
		for (let [t, n] of e) l(t, n);
	}, d = (e, t, n) => {
		if (a.size > 0 && !a.has(e) && u(), !i) return;
		let s = pm(e, r);
		if (s === null) {
			c(e);
			return;
		}
		let d = qm(e, r);
		if (!("value" in d)) return;
		let f = e instanceof HTMLTextAreaElement || e instanceof HTMLInputElement && $m.has(e.type) || e.matches("[contenteditable]:not([contenteditable=\"false\"])");
		f || u();
		let p = JSON.stringify(d), m = t === "change" && (p === JSON.stringify(a.get(e)?.state) || p === o.get(e));
		if (o.delete(e), m) {
			u(), o.delete(e);
			return;
		}
		c(e);
		let h = {
			state: d,
			payload: {
				eventType: t,
				target: {
					...s.target,
					...d
				},
				url: r.url(location.href),
				route: location.pathname
			}
		};
		f ? (n && (h.timer = setTimeout(() => {
			c(e), l(e, h);
		}, Qm)), a.set(e, h)) : l(e, h);
	}, f = (e) => {
		try {
			if (!i || !n(e)) return;
			let [t] = e.composedPath();
			if (!(t instanceof Element)) return;
			if (e.type === "compositionstart") {
				s.set(t, !0), clearTimeout(a.get(t)?.timer);
				return;
			}
			e.type === "compositionend" && s.set(t, !1);
			let r = s.get(t) === !0 || s.get(t) !== !1 && "isComposing" in e && e.isComposing === !0;
			d(t, e.type === "compositionend" ? "input" : e.type, !r), e.type === "change" && u();
		} catch {}
	}, p = (e) => {
		if (e.type === "pagehide" || n(e)) {
			if (e.type === "keydown") {
				let [t] = e.composedPath();
				if (!(e instanceof KeyboardEvent) || e.key !== "Enter" || e.isComposing || e.keyCode === 229 || t instanceof Element && s.get(t) === !0) return;
			}
			u();
		}
	}, m = [
		"input",
		"change",
		"compositionstart",
		"compositionend"
	], h = [
		"click",
		"submit",
		"focusout",
		"pagehide",
		"keydown"
	];
	for (let e of m) window.addEventListener(e, f, {
		capture: !0,
		passive: !0
	});
	for (let e of h) window.addEventListener(e, p, {
		capture: !0,
		passive: !0
	});
	return Object.assign(() => {
		i = !1;
		for (let e of a.keys()) c(e);
		for (let e of m) window.removeEventListener(e, f, !0);
		for (let e of h) window.removeEventListener(e, p, !0);
	}, { flush: u });
}
function th(e) {
	return typeof e == "object" && !!e && "addEventListener" in e && "removeEventListener" in e;
}
function nh() {
	let e = Reflect.get(window, "navigation");
	return th(e) ? e : null;
}
function rh(e) {
	switch (e) {
		case "replace":
		case "traverse":
		case "reload": return e;
		default: return "push";
	}
}
function ih(e) {
	let { emit: t, redact: n = cm() } = e, r = location.href, i = (e) => {
		try {
			let i = location.href;
			if (i === r) return;
			t("navigation", {
				from: n.url(r),
				to: n.url(i),
				navigationType: e
			}), r = i;
		} catch {}
	}, a = nh();
	if (a !== null) {
		let e = (e) => i(rh(Reflect.get(e, "navigationType")));
		return a.addEventListener("currententrychange", e), () => a.removeEventListener("currententrychange", e);
	}
	return ah(i);
}
function ah(e) {
	let t = !0, n = [], r = (r, i) => {
		let a = r[i], o = function(...n) {
			let r = a.apply(this, n);
			return t && e(i === "pushState" ? "push" : "replace"), r;
		};
		r[i] = o, n.push(() => {
			r[i] === o && (r[i] = a);
		});
	};
	for (let e of ["pushState", "replaceState"]) r(History.prototype, e), Object.prototype.hasOwnProperty.call(history, e) && r(history, e);
	let i = () => e("traverse");
	return window.addEventListener("popstate", i), window.addEventListener("hashchange", i), () => {
		t = !1, window.removeEventListener("popstate", i), window.removeEventListener("hashchange", i);
		for (let e of n) e();
	};
}
var oh = 4096, sh = 1e3, ch = new TextEncoder(), lh = () => ({
	status: "unavailable",
	reason: "redaction-failed"
});
function uh(e, t, n, r, i) {
	let a;
	if (!fh(n)) try {
		a = new TextDecoder("utf-8", { fatal: !n }).decode(e, { stream: t !== "complete" });
	} catch {}
	if (a !== void 0) {
		if (a = r(a), a === void 0) return lh();
		a.includes("\0") && (e = ch.encode(a), a = void 0);
	}
	let o = a === void 0;
	a ??= btoa(String.fromCharCode(...e.subarray(0, oh)));
	let s = {
		status: t === "complete" && e.length === 0 ? "empty" : t,
		text: a,
		encoding: o ? "base64" : "utf-8",
		...i ? { reason: i } : {}
	};
	if (ch.encode(JSON.stringify(s)).length <= oh) return s;
	s.status = t === "complete" ? "truncated" : t, s.truncated = !0;
	let c = 0, l = a.length;
	for (; c < l;) {
		let e = Math.ceil((c + l) / 2);
		s.text = a.slice(0, e), ch.encode(JSON.stringify(s)).length <= oh ? c = e : l = e - 1;
	}
	return o ? c -= c % 4 : c > 0 && /[\uD800-\uDBFF]/.test(a[c - 1]) && c--, s.text = a.slice(0, c), s;
}
function dh(e, t, n = "complete", r) {
	return uh(ch.encode(e.slice(0, nm)), e.length > nm && n === "complete" ? "truncated" : n, "text/plain", t, r);
}
function fh(e) {
	return e !== "" && !/(^text\/|json|xml|javascript|graphql|x-www-form-urlencoded|multipart\/form-data)/i.test(e);
}
function ph(e) {
	let t = /* @__PURE__ */ new Set(), n = !0, r = (r, i = "") => {
		if (!r) return Promise.resolve({ status: "empty" });
		if (!n) return Promise.resolve({
			status: "unavailable",
			reason: "capture-stopped"
		});
		let a;
		try {
			a = r.getReader();
		} catch {
			return Promise.resolve({
				status: "unavailable",
				reason: "body-locked"
			});
		}
		return new Promise((n) => {
			let r = new Uint8Array(nm), o = 0, s = !1, c = (c, d) => {
				s || (s = !0, clearTimeout(u), t.delete(l), n(uh(r.subarray(0, o), c, i, e.body, d)), a.cancel().catch(() => {}));
			}, l = () => c("interrupted", "capture-stopped"), u = setTimeout(() => c("timeout", "body-read-timeout"), sh);
			t.add(l), (async () => {
				try {
					for (;;) {
						let e = await a.read();
						if (s) break;
						if (e.done) {
							c("complete");
							break;
						}
						let t = e.value.subarray(0, nm - o);
						if (r.set(t, o), o += t.length, o === nm) {
							c("truncated");
							break;
						}
					}
				} catch {
					c("interrupted", "body-read-failed");
				} finally {
					try {
						a.releaseLock();
					} catch {}
				}
			})();
		});
	};
	return {
		read: r,
		body: (t, n = "") => {
			try {
				if (t == null) return Promise.resolve({ status: "empty" });
				if (t instanceof URLSearchParams && (t = t.toString()), typeof t == "string") return Promise.resolve(dh(t, e.body));
				if (typeof ReadableStream < "u" && t instanceof ReadableStream) return Promise.resolve({
					status: "unavailable",
					reason: "caller-owned-stream"
				});
				if (t instanceof FormData) {
					let n = new FormData();
					t.forEach((t, r) => n.append(r, typeof t == "string" ? e.field(r, t) : t)), t = n;
				}
				let i = new Response(t);
				return r(i.body, n || i.headers.get("content-type") || "");
			} catch {
				return Promise.resolve({
					status: "unavailable",
					reason: "body-not-readable"
				});
			}
		},
		text: (t, n, r) => dh(t, e.body, n, r),
		stop() {
			n = !1;
			for (let e of t) e();
		}
	};
}
var mh = () => Promise.resolve({ status: "empty" }), hh = (e) => Promise.resolve({
	status: "unavailable",
	reason: e
}), gh = (e) => new URL(e, location.href).href, _h = /* @__PURE__ */ new Set([
	"x-amz-security-token",
	"private-token",
	"x-token"
]), vh = (e, t) => _h.has(e.toLowerCase()) || im(e) ? qp : t, yh = (e) => Object.fromEntries(Array.from(e.entries(), ([e, t]) => [e, vh(e, t)]));
function bh(e) {
	return typeof e == "object" && !!e && "name" in e && e.name === "AbortError";
}
function xh(e) {
	let t = !0, { redact: n = cm() } = e, r = ph(n), i = e.ignoreUrls.map((e) => typeof e == "string" ? gh(e) : new RegExp(e.source, e.flags)), a = (e) => i.some((t) => typeof t == "string" ? e.startsWith(t) : (t.lastIndex = 0, t.test(e))), o = (r, i, a, o, s, c, l) => {
		let u = Math.round(performance.now() - o), d = Date.now();
		Promise.all([a, l?.body ?? hh("no-response")]).then(([a, o]) => {
			if (!t) return;
			let f = n.url(i.url), p = new URL(f);
			e.emit("network", {
				transport: r,
				method: i.method,
				url: f,
				origin: p.origin,
				route: p.pathname,
				status: s,
				durationMs: u,
				completedAt: d,
				outcome: c,
				request: {
					headers: i.headers,
					body: a
				},
				response: {
					...l?.url ? { url: n.url(l.url) } : {},
					headers: l?.headers ?? {},
					body: o
				}
			});
		}).catch(() => {});
	}, s = globalThis.fetch, c = (e, n) => {
		if (!t) return s.call(globalThis, e, n);
		let i, c;
		try {
			let t = typeof Request < "u" && e instanceof Request ? e : void 0;
			i = {
				url: gh(t ? t.url : String(e)),
				method: (n?.method ?? t?.method ?? "GET").toUpperCase(),
				headers: yh(new Headers(n?.headers ?? t?.headers))
			}, c = a(i.url);
		} catch {
			return s.call(globalThis, e, n);
		}
		if (c) return s.call(globalThis, e, n);
		let l = performance.now(), u;
		try {
			u = n?.body == null ? typeof Request < "u" && e instanceof Request ? r.read(e.clone().body, i.headers["content-type"]) : mh() : r.body(n.body, i.headers["content-type"]);
		} catch {
			u = hh("request-clone-failed");
		}
		let d = (e) => o("fetch", i, u, l, null, bh(e) ? "aborted" : "error"), f;
		try {
			f = s.call(globalThis, e, n);
		} catch (e) {
			throw d(e), e;
		}
		return f.then((e) => {
			if (!t) return;
			let n;
			try {
				n = e.type === "opaque" || e.type === "opaqueredirect" ? hh("opaque-response") : r.read(e.clone().body, e.headers.get("content-type") ?? "");
			} catch {
				n = hh("response-clone-failed");
			}
			o("fetch", i, u, l, e.status, "ok", {
				url: e.url,
				headers: yh(e.headers),
				body: n
			});
		}, d).catch(() => {}), f;
	};
	typeof s == "function" && (globalThis.fetch = c);
	let l = Sh(a, o, r);
	return () => {
		t = !1, r.stop(), globalThis.fetch === c && (globalThis.fetch = s), l();
	};
}
function Sh(e, t, n) {
	if (typeof XMLHttpRequest != "function") return () => {};
	let r = XMLHttpRequest.prototype, i = r.open, a = r.send, o = r.setRequestHeader, s = /* @__PURE__ */ new WeakMap(), c = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new WeakMap(), u = !0, d = function(e, t, ...n) {
		l.get(this)?.();
		let r = Reflect.apply(i, this, [
			e,
			t,
			...n
		]);
		try {
			s.set(this, {
				url: gh(String(t)),
				method: e.toUpperCase(),
				headers: {}
			});
		} catch {
			s.delete(this);
		}
		return r;
	}, f = function(e, t) {
		let n = o.call(this, e, t), r = s.get(this);
		if (u && r) try {
			let n = new Headers(r.headers);
			n.append(e, t), r.headers = yh(n);
		} catch {}
		return n;
	}, p = function(r) {
		let i = s.get(this);
		if (!u || !i || e(i.url)) return a.call(this, r);
		let o = performance.now(), d;
		try {
			d = typeof Document < "u" && r instanceof Document ? Promise.resolve(n.text(new XMLSerializer().serializeToString(r))) : n.body(r, i.headers["content-type"]);
		} catch {
			d = hh("request-body-unavailable");
		}
		let f = !1, p = () => {
			f = !0;
		}, m = () => {
			this.removeEventListener("abort", p), this.removeEventListener("loadend", h), c.delete(m), l.get(this) === m && l.delete(this);
		}, h = () => {
			if (m(), !u) return;
			let e = f ? "aborted" : this.status === 0 ? "error" : "ok", r = {};
			try {
				for (let e of this.getAllResponseHeaders().split(/\r?\n/)) {
					let t = e.indexOf(":");
					if (t > 0) {
						let n = e.slice(0, t).toLowerCase();
						r[n] = vh(n, e.slice(t + 1).trim());
					}
				}
			} catch {}
			let a;
			try {
				a = this.responseType === "" || this.responseType === "text" ? Promise.resolve(n.text(this.responseText, e === "ok" ? "complete" : "interrupted", e === "ok" ? void 0 : `request-${e}`)) : this.responseType === "json" ? Promise.resolve(n.text(JSON.stringify(this.response))) : this.responseType === "document" ? this.responseXML ? Promise.resolve(n.text(new XMLSerializer().serializeToString(this.responseXML))) : hh("empty-document") : n.body(this.response, r["content-type"] ?? "application/octet-stream");
			} catch {
				a = hh("response-body-unavailable");
			}
			t("xhr", i, d, o, e === "ok" ? this.status : null, e, {
				url: this.responseURL,
				headers: r,
				body: a
			});
		};
		this.addEventListener("abort", p), this.addEventListener("loadend", h), c.add(m), l.set(this, m);
		try {
			return a.call(this, r);
		} catch (e) {
			throw m(), t("xhr", i, d, o, null, bh(e) ? "aborted" : "error"), e;
		}
	};
	return r.open = d, r.send = p, r.setRequestHeader = f, () => {
		u = !1;
		for (let e of c) e();
		r.open === d && (r.open = i), r.send === p && (r.send = a), r.setRequestHeader === f && (r.setRequestHeader = o);
	};
}
function Ch(e, t = []) {
	return e;
}
var wh = 50, Th = 2e3, Eh = new Set(Kp);
function Dh(e) {
	let { sink: t, routes: n, beforeSend: r, enrich: i } = e, a = {
		clicks: !0,
		navigation: !0,
		network: !0,
		inputs: !0,
		...e.capture
	}, o = null, s = 0, c = () => Ch(location.pathname, n), l = (e) => {
		let n = o;
		if (n === null || n.queue.length === 0 && n.dropped === 0) return;
		let r = n.queue.splice(0), i = n.dropped;
		n.dropped = 0;
		let a = {
			trajectoryId: n.trajectoryId,
			learningContainerIds: n.learningContainerIds,
			events: r,
			dropped: i
		}, s = () => {
			o === n && (n.dropped += r.length + i);
		};
		try {
			Promise.resolve(t(a, e)).catch(s);
		} catch {
			s();
		}
	}, u = (e, t) => {
		let n = o;
		if (n !== null && (e !== "input" && e !== "network" && n.flushInputs?.(), o === n)) try {
			s += 1;
			let i = {
				type: "CUSTOM",
				name: e,
				value: {
					...t,
					seq: s
				},
				timestamp: Date.now()
			}, a = r === void 0 ? i : r(i);
			if (a === null || o !== n) return;
			n.queue.push(a), n.queue.length >= wh && l();
		} catch {}
	};
	return {
		start: ({ trajectoryId: r, learningContainerIds: s }) => {
			if (o !== null) {
				o.trajectoryId !== r && console.warn(`[@copilotkit/learning] Trajectory "${o.trajectoryId}" is active. Stop it before you start "${r}".`);
				return;
			}
			if (typeof window > "u" || typeof window.addEventListener != "function") return;
			let d = {
				trajectoryId: r,
				learningContainerIds: s,
				queue: [],
				dropped: 0,
				uninstalls: [],
				timer: void 0
			};
			o = d;
			let f = (e, t) => {
				o === d && u(e, t);
			}, p = cm();
			d.uninstalls.push(p.watch());
			let m = [...e.ignoreUrls ?? [], ...t.url === void 0 ? [] : [t.url]];
			if (a.clicks && d.uninstalls.push(Zm({
				emit: f,
				getRoute: c,
				enrich: i,
				redact: p
			})), a.navigation && d.uninstalls.push(ih({
				emit: f,
				routes: n,
				redact: p
			})), a.network && d.uninstalls.push(xh({
				emit: f,
				routes: n,
				ignoreUrls: m,
				redact: p
			})), a.inputs) {
				let e = eh({
					emit: f,
					redact: p
				});
				d.flushInputs = e.flush, d.uninstalls.push(e);
			}
			let h = () => l({ beacon: !0 });
			window.addEventListener("pagehide", h), d.uninstalls.push(() => window.removeEventListener("pagehide", h)), d.timer = setInterval(() => l(), Th), u("page", {
				route: c(),
				url: p.url(location.href),
				title: document.title,
				referrer: p.url(document.referrer)
			});
		},
		stop: () => {
			let e = o;
			if (e !== null && (e.flushInputs?.(), o === e)) {
				clearInterval(e.timer);
				for (let t of e.uninstalls) t();
				l(), o = null;
			}
		},
		emit: (e, t) => {
			Eh.has(e) ? console.warn(`[@copilotkit/learning] "${e}" is a built-in event name. Use your own name, such as "deal.approved".`) : u(e, t);
		},
		ɵemit: (e, t) => u(e, t),
		get trajectoryId() {
			return o?.trajectoryId ?? null;
		}
	};
}
var Oh = new Set(Kp);
function kh(e, t = /* @__PURE__ */ new Set()) {
	if (typeof e == "string") return !e.includes("\0");
	if (e === null || typeof e == "boolean") return !0;
	if (typeof e == "number") return Number.isFinite(e);
	if (typeof e != "object" || t.has(e) || !Array.isArray(e) && Object.getPrototypeOf(e) !== Object.prototype && Object.getPrototypeOf(e) !== null || (t.add(e), !Array.isArray(e) && Object.keys(e).some((e) => e.includes("\0")))) return !1;
	let n = Array.isArray(e) ? e : Object.values(e);
	for (let e of n) if (!kh(e, t)) return !1;
	return t.delete(e), !0;
}
function Ah(e) {
	let t = !1, n = 0, r = [], i, a = (t, n) => {
		try {
			e.onError?.({
				code: t,
				message: n
			});
		} catch {}
	}, o = () => Ch(location.pathname), s = (r, o) => {
		if (!t) return;
		let s = n;
		if (r !== "input" && r !== "network" && i?.(), !t || n !== s) return;
		let c;
		try {
			let i = {
				type: "CUSTOM",
				name: r,
				timestamp: Date.now(),
				value: o
			}, l = e.beforeSend === void 0 ? i : e.beforeSend(i);
			if (l === null || !t || n !== s) return;
			if (l.type !== "CUSTOM" || typeof l.name != "string" || !l.name.trim() || l.name.length > 200 || l.name.includes("\0") || !Number.isFinite(l.timestamp) || l.timestamp <= 0 || l.timestamp >= 0xe677d21fdc00 || !kh(l.value)) {
				a("INVALID_EVENT", "The event must contain a name, timestamp, and JSON value.");
				return;
			}
			let u = JSON.stringify({
				type: l.type,
				name: l.name,
				timestamp: l.timestamp,
				value: l.value
			});
			if (new TextEncoder().encode(u).byteLength > 16384) {
				a("EVENT_TOO_LARGE", "The serialized event exceeds 16 KiB.");
				return;
			}
			c = JSON.parse(u);
		} catch {
			a("INVALID_EVENT", "The event could not be serialized as JSON.");
			return;
		}
		try {
			e.send(c);
		} catch {
			a("PERSISTENCE_UNKNOWN", "Event delivery failed. The event will not be retried.");
		}
	}, c = (e, t) => {
		s(e, t);
	}, l = () => {
		let e = n, a = i;
		if (i = void 0, a?.(), n !== e) return;
		n++, t = !1;
		let o = r;
		r = [];
		for (let e of o) e();
	};
	return {
		start() {
			if (t || typeof window > "u" || (t = !0, n++, typeof window.addEventListener != "function")) return;
			let u = cm();
			try {
				if (r.push(u.watch()), e.capture?.clicks !== !1 && r.push(Zm({
					emit: c,
					getRoute: o,
					redact: u
				})), e.capture?.navigation !== !1 && r.push(ih({
					emit: c,
					redact: u
				})), e.capture?.inputs !== !1) {
					let e = eh({
						emit: c,
						redact: u
					});
					i = e.flush, r.push(e);
				}
				e.capture?.network !== !1 && r.push(xh({
					emit: c,
					ignoreUrls: e.ignoreUrls ?? [],
					redact: u
				})), s("page", {
					route: o(),
					url: u.url(location.href),
					title: document.title,
					referrer: u.url(document.referrer)
				});
			} catch {
				l(), a("CAPTURE_FAILED", "Browser capture could not start.");
			}
		},
		stop: l,
		emit(e, n) {
			t && (Oh.has(e) ? a("INVALID_EVENT", "Use a developer event name, not a reserved capture name.") : s(e, n));
		}
	};
}
// node_modules/.pnpm/@copilotkit+core@1.83.0_@ag_4e183dd2bbc3ace133cd60c340482564/node_modules/@copilotkit/core/dist/index.mjs
function jh(e) {
	if (e instanceof kd) return !0;
	if (typeof e != "object" || !e) return !1;
	let t = e;
	return typeof t.url == "string" && typeof t.headers == "object" && t.headers !== null && t.abortController instanceof AbortController && typeof t.runAgent == "function";
}
async function Mh(e, t, n, r) {
	let i = e, a = () => {
		e.isRunning = !1;
	};
	try {
		e.isRunning = !0, e.agentId = e.agentId ?? Fl();
		let o = i.prepareRunAgentInput(t), s, c = new Set(e.messages.map((e) => e.id)), l = !0, u = /* @__PURE__ */ new WeakSet(), d = [
			{
				onRunStartedEvent: () => {
					e.isRunning = !0;
				},
				onRunErrorEvent: ({ event: t }) => {
					u.has(t) && (e.isRunning = !1);
				},
				onRunFinishedEvent: (e) => {
					e.outcome === "success" && (s = e.result);
				}
			},
			...e.subscribers,
			n ?? {}
		], f = new En();
		i.activeRunDetach$ = f;
		let p;
		i.activeRunCompletionPromise = new Promise((e) => {
			p = e;
		});
		let m = !1, h = !1, g = f.subscribe(() => {
			m = !0;
		});
		if (a = () => {
			h || (h = !0, g.unsubscribe(), i.activeRunDetach$ === f && (e.isRunning = !1, i.activeRunCompletionPromise = void 0, i.activeRunDetach$ = void 0, i.onFinalize(o, d)), p?.(), p = void 0);
		}, await i.onInitialize(o, d), m) return {
			result: void 0,
			newMessages: []
		};
		let ee = {
			onReplayStarted: () => {
				l = !0, e.isRunning = !0;
			},
			onReplayFinished: () => {
				l = !1;
			}
		}, te = A(() => new nd().run(o, { run: () => r ? r(o, ee) : i.connect(o) })).pipe(Oi((e) => {
			!l && e.type === b.RUN_ERROR && u.add(e);
		}), xu(i.debugLogger), Di(f)), _ = i.apply(o, te, d);
		await Nr(i.processApplyEvents(o, _, d).pipe(oi((t) => i.activeRunDetach$ !== f || (e.isRunning = !1, t instanceof Ge) ? Jn : i.onError(o, t, d)), xi(() => a())), { defaultValue: void 0 });
		let ne = V(e.messages).filter((e) => !c.has(e.id));
		return {
			result: s,
			newMessages: ne
		};
	} finally {
		a();
	}
}
function Nh(e) {
	return new w((t) => {
		e.onOpen(() => t.next({ type: "open" })), e.onError((e) => t.next({
			type: "error",
			error: e
		}));
	});
}
function Ph(e) {
	return new w((t) => {
		e.join().receive("ok", () => {
			t.next({ type: "joined" }), t.complete();
		}).receive("error", (e) => {
			t.next({
				type: "error",
				response: e
			}), t.complete();
		}).receive("timeout", () => {
			t.next({ type: "timeout" }), t.complete();
		});
	});
}
function Fh(e) {
	return A(() => {
		let t = new Gf(e.url, {
			heartbeatIntervalMs: 15e3,
			...e.options
		}), n = Nh(t).pipe(Ti({
			bufferSize: 1,
			refCount: !0
		}));
		return t.connect(), ni(D({
			socket: t,
			signals$: n
		}), ai).pipe(xi(() => t.disconnect()));
	});
}
function Ih(e) {
	return e.socket$.pipe(M(({ socket: t }) => A(() => {
		let n = t.channel(e.topic, e.params);
		return ni(D({
			channel: n,
			joinOutcome$: Ph(n).pipe(Ti({
				bufferSize: 1,
				refCount: !0
			}))
		}), ai).pipe(xi(() => {
			e.leaveOnUnsubscribe !== !1 && n.leave();
		}));
	})));
}
function Lh(e, t) {
	return new w((n) => {
		let r = e.on(t, (e) => n.next(e));
		return () => {
			e.off(t, r);
		};
	});
}
function Rh(e) {
	return e.pipe(M((e) => e.joinOutcome$));
}
function zh(e) {
	return Rh(e).pipe(fi(1), $r((e) => {
		if (e.type === "joined") return Jn;
		throw e.type === "timeout" ? /* @__PURE__ */ Error("Timed out joining channel") : /* @__PURE__ */ Error(`Failed to join channel: ${JSON.stringify(e.response)}`);
	}));
}
function Bh(e) {
	return e.pipe(M((e) => e.signals$));
}
function Vh(e, t) {
	return e.pipe(Si((e, t) => t.type === "open" ? 0 : e + 1, 0), j((e) => e >= t), fi(1), $r((e) => O(() => /* @__PURE__ */ Error(`WebSocket connection failed after ${e} consecutive errors`))));
}
var Hh = (...e) => fetch(...e), Uh = "ag_ui_event", Wh = "replay_complete", Gh = "replay_failed", Kh = "stream_idle", qh = "stop_run", Jh = 100, Yh = 3e4, Xh = 2;
function Zh(e) {
	let t = e.forwardedProps, n = t?.__proxiedMCPRequest;
	return t?.__copilotkitMcpResourceReadOnly === !0 && typeof n == "object" && !!n && n.method === "resources/read";
}
var Qh = class extends Error {
	constructor(e) {
		super(e ? `Thread ${e} is locked` : "Thread is locked"), this.name = "AgentThreadLockedError";
	}
};
function $h(e) {
	return typeof e == "object" && !!e && "activeRunCompletionPromise" in e;
}
var eg = class e extends Dd {
	config;
	socket = null;
	activeChannel = null;
	canonicalRunId = null;
	sharedState;
	constructor(e, t = { lastSeenEventIds: /* @__PURE__ */ new Map() }) {
		super(), this.config = e, this.sharedState = t;
	}
	get headers() {
		return this.config.headers;
	}
	set headers(e) {
		this.config = {
			...this.config,
			headers: e
		};
	}
	get credentials() {
		return this.config.credentials;
	}
	set credentials(e) {
		this.config = {
			...this.config,
			credentials: e
		};
	}
	clone() {
		return new e(this.config, this.sharedState);
	}
	async connectAgent(e, t) {
		let n = e?.runId || !this.canonicalRunId ? e : {
			...e,
			runId: this.canonicalRunId
		};
		return Mh(this, n, t, (e, t) => this.connect(e, t));
	}
	abortRun() {
		if (this.activeChannel && this.canonicalRunId) {
			let e = setTimeout(() => t(), 5e3), t = () => {
				clearTimeout(e), this.detachActiveRun(), this.cleanup();
			};
			this.activeChannel.push(qh, { run_id: this.canonicalRunId }).receive("ok", t).receive("error", t).receive("timeout", t);
		} else this.detachActiveRun(), this.cleanup();
	}
	run(e) {
		return Zh(e) || (this.threadId = e.threadId, this.canonicalRunId = e.runId), A(() => this.requestJoinCredentials$("run", e)).pipe(M((t) => {
			if (t === null) return O(() => /* @__PURE__ */ Error("REST run request returned no credentials"));
			if ("kind" in t) return D({
				type: b.RUN_STARTED,
				threadId: t.threadId,
				runId: t.runId
			}, {
				type: b.RUN_FINISHED,
				threadId: t.threadId,
				runId: t.runId,
				result: t.result
			});
			let n = this.applyCanonicalRunIdentity(e, t, { fallbackToInputRunId: !0 });
			return this.observeThread$(n, t, {
				completeOnRunError: !1,
				streamMode: "run"
			});
		}));
	}
	connect(e, t) {
		this.threadId = e.threadId, this.canonicalRunId = null;
		let n = this.getReconnectCursor(e);
		return A(() => this.requestJoinCredentials$("connect", e, n)).pipe(M((r) => {
			if (r === null) return t?.onReplayStarted?.(), t?.onReplayFinished?.(), Jn;
			let i = this.applyCanonicalRunIdentity(e, r, { fallbackToInputRunId: !1 });
			return this.observeThread$(i, r, {
				completeOnRunError: !1,
				streamMode: "connect",
				replayCursor: n,
				lifecycle: t
			});
		}));
	}
	cleanupOwned(e, t) {
		e && (e.leave(), this.activeChannel === e && (this.activeChannel = null)), t && (t.disconnect(), this.socket === t && (this.socket = null)), this.canonicalRunId = null;
	}
	cleanup() {
		this.cleanupOwned(this.activeChannel, this.socket);
	}
	requestJoinCredentials$(e, t, n) {
		return A(async () => {
			try {
				let r = this.config.fetch ?? Hh, i = {
					...t,
					...e === "connect" ? { lastSeenEventId: n === void 0 ? this.getReconnectCursor(t) : n } : {}
				}, a = this.config.transport === "single", o = await r(a ? this.config.runtimeUrl : this.buildRuntimeUrl(e), {
					method: "POST",
					redirect: "error",
					headers: {
						"Content-Type": "application/json",
						...this.headers
					},
					body: JSON.stringify(a ? {
						method: `agent/${e}`,
						params: { agentId: this.config.agentId },
						body: i
					} : i),
					...this.credentials ? { credentials: this.credentials } : {}
				});
				if (o.status === 204 && e === "connect") return null;
				if (o.status === 409 && e === "run") throw new Qh(t.threadId);
				if (!o.ok) {
					let e = await o.text().catch(() => "");
					throw Error(e || o.statusText || String(o.status));
				}
				let s = await o.json();
				if (e === "run" && Zh(t) && typeof s == "object" && s && s.kind === "mcp-resource-read") {
					let e = s;
					if (typeof e.threadId != "string" || !e.threadId || typeof e.runId != "string" || !e.runId) throw Error("invalid MCP resource response identity");
					return {
						kind: "mcp-resource-read",
						threadId: e.threadId,
						runId: e.runId,
						result: e.result
					};
				}
				return this.normalizeJoinCredentials(s, t);
			} catch (t) {
				throw t instanceof Qh ? t : Error(`REST ${e} request failed: ${t instanceof Error ? t.message : String(t)}`, { cause: t });
			}
		});
	}
	normalizeJoinCredentials(e, t) {
		let n = e && typeof e == "object" ? e : null, r = n?.realtime && typeof n.realtime == "object" ? n.realtime : null;
		if (typeof n?.joinToken != "string" || !n.joinToken) throw Error("missing joinToken");
		if (typeof r?.clientUrl != "string" || !r.clientUrl) throw Error("missing realtime.clientUrl");
		if (typeof r.topic != "string" || !r.topic) throw Error("missing realtime.topic");
		return {
			threadId: typeof n.threadId == "string" && n.threadId ? n.threadId : t.threadId,
			runId: typeof n.runId == "string" && n.runId ? n.runId : null,
			joinToken: n.joinToken,
			realtime: {
				clientUrl: r.clientUrl,
				topic: r.topic
			}
		};
	}
	observeThread$(e, t, n) {
		let { unopenedRefreshes: r = 0, ...i } = n;
		return A(() => {
			let a = !1;
			return this.observeThreadSession$(e, t, {
				...i,
				onSocketOpen: () => {
					a = !0;
				}
			}).pipe(oi((o) => {
				if (!this.isSocketReconnectExhaustedError(o)) return O(() => o);
				let s = a ? 0 : r + 1;
				if (n.streamMode === "run" && s > Xh) return O(() => /* @__PURE__ */ Error(`Realtime connection to ${t.realtime.clientUrl} never opened in ${s} connection attempts. The realtime endpoint is unavailable.`));
				let c = this.getReconnectCursor(e);
				return this.requestJoinCredentials$("connect", e, c).pipe(M((t) => t === null ? Jn : this.observeThread$(this.applyCanonicalRunIdentity(e, t, { fallbackToInputRunId: n.streamMode === "run" }), t, {
					...i,
					channelMode: "connect",
					replayCursor: c,
					unopenedRefreshes: s
				})));
			}));
		});
	}
	observeThreadSession$(e, t, n) {
		return A(() => {
			n.lifecycle?.onReplayStarted?.();
			let r = null, i = null, a = !1, o = !1, s, c = () => {
				clearTimeout(s), s = void 0;
			}, l = () => {
				c(), n.streamMode === "connect" && a && !o && (s = setTimeout(() => {
					o = !0, this.debugLogger?.lifecycle("INTELLIGENCE", "No progress or stream_idle for 30 seconds after replay_complete; the run may still be active or its status unavailable.", { threadId: e.threadId });
				}, Yh));
			}, u = Fh({
				url: t.realtime.clientUrl,
				options: {
					params: {
						...this.config.socketParams,
						join_token: t.joinToken
					},
					reconnectAfterMs: Jd(100, 1e4),
					rejoinAfterMs: Jd(1e3, 3e4)
				}
			}).pipe(Oi(({ socket: e }) => {
				r = e, this.socket = r;
			}), Ti({
				bufferSize: 1,
				refCount: !0
			})), d = this.createThreadChannelParams(e, n.channelMode ?? n.streamMode, n.replayCursor), f = Ih({
				socket$: u,
				topic: t.realtime.topic,
				params: d
			}).pipe(Oi(({ channel: e }) => {
				i = e, this.activeChannel = i;
			}), Ti({
				bufferSize: 1,
				refCount: !0
			})), p = this.readDurableEventId(n.replayCursor ?? this.getReconnectCursor(e)), m = null, h = this.observeThreadEvents$(e.threadId, f, n).pipe(Oi((e) => {
				m = this.readEventId(e) ?? m, l();
			}), Ci()), g = {
				applied: null,
				replayFailed: !1
			}, ee = f.pipe(M(({ channel: e }) => this.observeChannelEvent$(e, Gh)), Oi(() => {
				g.replayFailed = !0;
			})), te = this.observeControlEvent$(e.threadId, f, Wh, g).pipe(Oi(() => {
				a = !0, l(), n.lifecycle?.onReplayFinished?.();
			}), Ci()), _ = this.observeControlEvent$(e.threadId, f, Kh, g).pipe(Ci()), ne = ii(this.observeControlEvent$(e.threadId, f, "phx_error", g), Bh(u).pipe(j((e) => e.type === "error"))).pipe(Oi(() => {
				a = !1, o = !1, c(), n.lifecycle?.onReplayStarted?.();
			}), Ci()), re = n.streamMode === "connect" ? ne.pipe(Ei(null), M(() => ii(Yr([te.pipe(fi(1)), _.pipe(fi(1))]), _.pipe(fi(1), j((e) => this.canFallbackCompleteConnect(e, p, m)), gi(Jh), Oi(() => {
				this.debugLogger?.lifecycle("INTELLIGENCE", "Completing connection on stream_idle fallback without replay_complete.", {
					threadId: e.threadId,
					fallbackMs: Jh
				});
			})))), fi(1), Ti({
				bufferSize: 1,
				refCount: !0
			})) : Jn, ie = h.pipe(pi(), bi(null), fi(1)), v = ii(ie, re);
			return ii(ee.pipe(pi(), Di(v)), te.pipe(pi(), Di(v)), this.joinThreadChannel$(f), this.observeSocketHealth$(u, n.onSocketOpen).pipe(Di(v)), h.pipe(Di(re)), re.pipe(pi(), Di(ie))).pipe(xi(() => {
				c(), this.cleanupOwned(i, r);
			}));
		});
	}
	joinThreadChannel$(e) {
		return zh(e);
	}
	observeSocketHealth$(e, t) {
		return Vh(Bh(e).pipe(Oi((e) => {
			e.type === "open" && t?.();
		})), 5);
	}
	observeThreadEvents$(e, t, n) {
		return t.pipe(M(({ channel: e }) => this.observeChannelEvent$(e, Uh)), Oi((t) => {
			this.updateLastSeenEventId(e, t);
		}), k((e) => n.streamMode === "run" ? af(e) : e), $r((e) => this.createThreadNotifications(e, {
			completeOnRunError: n.completeOnRunError,
			completeOnRunFinished: n.streamMode === "run",
			errorOnRunError: n.streamMode === "run"
		})), _i());
	}
	observeControlEvent$(e, t, n, r) {
		return t.pipe(M(({ channel: e }) => this.observeChannelEvent$(e, n)), Oi((t) => this.updateLastSeenEventIdFromControl(e, t, r)));
	}
	observeChannelEvent$(e, t) {
		return Lh(e, t);
	}
	createThreadNotifications(e, t) {
		if (e.type === b.RUN_FINISHED) return t.completeOnRunFinished ? [Ar.createNext(e), Ar.createComplete()] : [Ar.createNext(e)];
		if (e.type === b.RUN_ERROR) {
			let n = e.message ?? "Run error";
			return t.completeOnRunError ? [Ar.createNext(e), Ar.createComplete()] : t.errorOnRunError ? [Ar.createNext(e), Ar.createError(Error(n))] : [Ar.createNext(e)];
		}
		return [Ar.createNext(e)];
	}
	buildRuntimeUrl(e) {
		let t = `${this.config.runtimeUrl}/agent/${encodeURIComponent(this.config.agentId)}/${e}`, n = typeof window < "u" && window.location ? window.location.origin : "http://localhost";
		return new URL(t, new URL(this.config.runtimeUrl, n)).toString();
	}
	createThreadChannelParams(e, t, n) {
		return t === "run" ? {
			stream_mode: "run",
			run_id: e.runId
		} : {
			stream_mode: "connect",
			last_seen_event_id: n === void 0 ? this.getReconnectCursor(e) : n
		};
	}
	getLastSeenEventId(e) {
		return this.sharedState.lastSeenEventIds.get(e) ?? null;
	}
	getReconnectCursor(e) {
		return this.getLastSeenEventId(e.threadId);
	}
	clearReconnectCursor(e) {
		this.sharedState.lastSeenEventIds.delete(e);
	}
	updateLastSeenEventId(e, t) {
		let n = this.readEventId(t);
		n && this.advanceLastSeenEventId(e, n);
	}
	updateLastSeenEventIdFromControl(e, t, n) {
		let r = this.readControlEventId(t);
		r && (r !== n.applied || n.replayFailed) && (n.applied = r, this.advanceLastSeenEventId(e, r));
	}
	advanceLastSeenEventId(e, t) {
		this.sharedState.lastSeenEventIds.set(e, t);
	}
	readEventId(e) {
		let t = e.metadata;
		if (!t || typeof t != "object") return null;
		let n = t;
		return this.readDurableEventId(n.cpki_event_id);
	}
	readControlEventId(e) {
		if (!e || typeof e != "object") return null;
		let t = e, n = t.latestEventId ?? t.latest_event_id;
		return this.readDurableEventId(n);
	}
	readDurableEventId(e) {
		return typeof e != "string" || e.trim() === "" || e.startsWith("cpki_ingested") ? null : e;
	}
	canFallbackCompleteConnect(e, t, n) {
		let r = this.readControlEventId(e);
		return !r || r === t || r === n;
	}
	applyCanonicalRunIdentity(e, t, n) {
		this.threadId = t.threadId;
		let r = t.runId ?? (n.fallbackToInputRunId ? e.runId : null);
		return this.canonicalRunId = r, {
			...e,
			threadId: t.threadId,
			...r === null ? {} : { runId: r }
		};
	}
	isSocketReconnectExhaustedError(e) {
		return e instanceof Error && e.message.includes("WebSocket connection failed after");
	}
};
async function tg(e) {
	let t = `Runtime info request failed with status ${e.status}`, n;
	try {
		let t = (await e.clone().json())?.message;
		typeof t == "string" && t.trim().length > 0 && (n = t.trim());
	} catch {}
	let r = Error(n ? `${t}: ${n}` : t);
	return r.runtimeInfoStatus = e.status, r;
}
function ng(e) {
	return typeof e == "object" && !!e && typeof e.runtimeInfoStatus == "number";
}
function rg(e) {
	let t = e.toolCalls;
	return Array.isArray(t) ? t.map((e) => e.id).filter((e) => !!e) : [];
}
function ig(e) {
	if (e.role === "tool") return e.toolCallId;
}
function ag(e, t) {
	let n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
	for (let e of t) {
		for (let t of rg(e)) n.set(t, e);
		let t = ig(e);
		t !== void 0 && r.set(t, e);
	}
	let i = [], a = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Set(), s = (e) => {
		a.has(e.id) || (a.add(e.id), i.push(e));
	}, c = (e) => {
		if (s(e), !o.has(e)) {
			o.add(e);
			for (let t of rg(e)) {
				let e = r.get(t);
				e && s(e);
			}
		}
	};
	for (let t of e) {
		let e = ig(t);
		if (e === void 0) {
			c(t);
			continue;
		}
		let r = n.get(e);
		r ? c(r) : s(t);
	}
	return i;
}
function og(e) {
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), r = (e, t) => {
		t.open = !1, n.set(e, n.get(e) - 1);
	}, i = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map(), o = -1;
	for (let s = 0; s < e.length; s++) {
		let c = e[s];
		if (cg(c)) continue;
		let l = lg(c);
		if (l !== "tool") {
			o = s;
			let e = l === "assistant" ? c.toolCalls : void 0;
			if (!Array.isArray(e)) continue;
			for (let r of e) {
				if (typeof r != "object" || !r) continue;
				let e = r.id;
				typeof e == "string" && (sg(t, e, {
					issuer: s,
					open: !0
				}), n.set(e, (n.get(e) ?? 0) + 1));
			}
			continue;
		}
		let u = c.toolCallId;
		if (typeof u != "string") continue;
		let d = t.get(u);
		if (!d) {
			sg(a, u, s);
			continue;
		}
		let f;
		for (let e = d.length - 1; e >= 0; e--) {
			let t = d[e];
			if (t.issuer !== o) break;
			t.open && (f = t);
		}
		f ? r(u, f) : n.get(u) > 0 && sg(i, u, s);
	}
	let s = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Set(), l = (e, t, n) => {
		r(e, t), c.add(n), sg(s, t.issuer, n);
	};
	for (let [e, n] of i) {
		let r = t.get(e), i = r.length - 1;
		for (let t = n.length - 1; t >= 0; t--) {
			let a = n[t];
			for (; i >= 0 && (!r[i].open || r[i].issuer >= a);) i--;
			if (i < 0) break;
			l(e, r[i], a);
		}
	}
	for (let [e, n] of a) {
		let r = t.get(e);
		r?.length === 1 && r[0].open && l(e, r[0], n[0]);
	}
	if (c.size === 0) return e;
	let u = [], d = -1, f = () => {
		let t = s.get(d);
		if (!t) return;
		let n = u.length;
		for (let e = u.length - 1; e >= 0 && cg(u[e]); e--) lg(u[e]) === "reasoning" && (n = e);
		u.splice(n, 0, ...[...t].sort((e, t) => e - t).map((t) => e[t]));
	};
	for (let t = 0; t < e.length; t++) {
		if (c.has(t)) continue;
		let n = e[t];
		!cg(n) && lg(n) !== "tool" && (f(), d = t), u.push(n);
	}
	return f(), u;
}
function sg(e, t, n) {
	let r = e.get(t);
	r ? r.push(n) : e.set(t, [n]);
}
function cg(e) {
	return typeof e != "object" || !e || Array.isArray(e) || e.role === "activity" || e.role === "reasoning";
}
function lg(e) {
	if (typeof e == "object" && e) return e.role;
}
function ug(e) {
	return "headers" in e;
}
function dg(e) {
	return "credentials" in e;
}
function fg(e) {
	return typeof e == "object" && !!e && "name" in e && e.name === "ZodError";
}
function pg(e) {
	return (e instanceof DOMException || e instanceof Error) && e.name === "AbortError";
}
function mg(e) {
	return e.pipe(oi((e) => {
		if (fg(e) || pg(e)) return Jn;
		throw e;
	}));
}
var hg = class e extends kd {
	runtimeUrl;
	credentials;
	runtimeAgentId;
	transport;
	runtimeEndpointUrl;
	singleEndpointUrl;
	runtimeMode;
	intelligence;
	_capabilities;
	delegate;
	runtimeInfoPromise;
	connectionAttempt;
	_messageFilter;
	activeRun;
	constructor(e) {
		let t = e.runtimeUrl ? e.runtimeUrl.replace(/\/$/, "") : void 0, n = e.transport ?? "auto", r = e.runtimeAgentId ?? e.agentId ?? "", i = n === "single" ? e.runtimeUrl ?? "" : `${t ?? e.runtimeUrl}/agent/${encodeURIComponent(r)}/run`;
		if (!i) throw Error("ProxiedCopilotRuntimeAgent requires a runtimeUrl when transport is set to 'single'.");
		super({
			...e,
			url: i
		}), this.runtimeUrl = t ?? e.runtimeUrl, this.runtimeEndpointUrl = e.runtimeUrl, this.credentials = e.credentials, this.runtimeAgentId = e.runtimeAgentId, this.transport = n, this.runtimeMode = e.runtimeMode ?? "sse", this.intelligence = e.intelligence, this._capabilities = e.capabilities, this._messageFilter = e.messageFilter, e.debug && (this.debug = e.debug), this.transport === "single" && (this.singleEndpointUrl = this.runtimeEndpointUrl);
	}
	adoptRuntimeMode(e, t) {
		let n = this.runtimeMode === e && this.intelligence?.wsUrl === t?.wsUrl;
		if (this.runtimeMode = e, this.intelligence = t, n) return;
		this.connectionAttempt = void 0, this.runtimeInfoPromise = void 0;
		let r = this.delegate;
		this.delegate = void 0, r && r.abortRun(), this.detachActiveRun();
	}
	routedAgentId() {
		let e = this.runtimeAgentId ?? this.agentId;
		if (!e) throw Error("ProxiedCopilotRuntimeAgent: cannot make a runtime request without an agentId or runtimeAgentId.");
		return e;
	}
	get capabilities() {
		return this._capabilities;
	}
	get messageFilter() {
		return this._messageFilter;
	}
	set messageFilter(e) {
		this._messageFilter = e;
	}
	#e(e) {
		let t = e.messages, n = this.#t(t), r = this.agentId ?? "";
		try {
			let r = n === void 0 ? og(t) : ag(n, t);
			return {
				...e,
				messages: r
			};
		} catch (t) {
			if (n === void 0) return console.warn(`ProxiedCopilotRuntimeAgent: tool-call repair failed for agent "${r}"; sending the message history unrepaired instead.`, t), e;
			try {
				let i = og(n);
				return console.warn(`ProxiedCopilotRuntimeAgent: tool-call repair failed for agent "${r}"; sending the filtered message history with only drifted tool results moved instead.`, t), {
					...e,
					messages: i
				};
			} catch (i) {
				return console.warn(`ProxiedCopilotRuntimeAgent: tool-call repair failed for agent "${r}"; sending the filtered message history unrepaired instead.`, t, i), {
					...e,
					messages: n
				};
			}
		}
	}
	#t(e) {
		let t = this._messageFilter;
		if (!t) return;
		let n;
		try {
			n = V(e);
		} catch (e) {
			console.warn("ProxiedCopilotRuntimeAgent: could not copy the message history for messageFilter; sending the full message history instead.", e);
			return;
		}
		let r;
		try {
			r = t(n, { agentId: this.agentId ?? "" });
		} catch (e) {
			console.warn("ProxiedCopilotRuntimeAgent: messageFilter failed; sending the full message history instead.", e);
			return;
		}
		if (!Array.isArray(r)) console.warn("ProxiedCopilotRuntimeAgent: messageFilter returned a non-array value; sending the full message history instead.");
		else {
			for (let e = 0; e < r.length; e++) {
				let t = r[e];
				if (typeof t != "object" || !t || Array.isArray(t)) {
					console.warn("ProxiedCopilotRuntimeAgent: messageFilter returned an entry that is not a message; sending the full message history instead.");
					return;
				}
			}
			return r;
		}
	}
	requestInit(e) {
		return {
			...super.requestInit(e),
			...this.credentials ? { credentials: this.credentials } : {}
		};
	}
	async getCapabilities() {
		return this._capabilities ?? {};
	}
	async detachActiveRun() {
		this.connectionAttempt = void 0, this.isRunning = !1;
		let e = this.delegate?.detachActiveRun(), t = super.detachActiveRun();
		await Promise.all([e, t]);
	}
	abortRun() {
		if (this.delegate) {
			this.syncDelegate(this.delegate), this.delegate.abortRun(), this.detachActiveRun();
			return;
		}
		if (!this.agentId || !this.threadId || typeof fetch > "u") return;
		let e = this.routedAgentId(), t = this.activeRun?.threadId === this.threadId ? this.activeRun.runId : void 0;
		if (this.transport === "single") {
			if (!this.singleEndpointUrl) return;
			let n = new Headers({
				...this.headers,
				"Content-Type": "application/json"
			});
			this.fetch(this.singleEndpointUrl, {
				method: "POST",
				headers: n,
				body: JSON.stringify({
					method: "agent/stop",
					params: {
						agentId: e,
						threadId: this.threadId
					},
					...t === void 0 ? {} : { body: { runId: t } }
				}),
				...this.credentials ? { credentials: this.credentials } : {},
				ɵruntimeRequest: { nonCritical: !0 }
			}).catch((e) => {
				console.error("ProxiedCopilotRuntimeAgent: stop request failed", e);
			});
			return;
		}
		if (!this.runtimeUrl) return;
		let n = `${this.runtimeUrl}/agent/${encodeURIComponent(e)}/stop/${encodeURIComponent(this.threadId)}`, r = typeof window < "u" && window.location ? window.location.origin : "http://localhost", i = new URL(this.runtimeUrl, r), a = new URL(n, i);
		this.fetch(a.toString(), {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...this.headers
			},
			...t === void 0 ? {} : { body: JSON.stringify({ runId: t }) },
			...this.credentials ? { credentials: this.credentials } : {},
			ɵruntimeRequest: { nonCritical: !0 }
		}).catch((e) => {
			console.error("ProxiedCopilotRuntimeAgent: stop request failed", e);
		});
	}
	async connectAgent(e, t) {
		let n = this.detachActiveRun(), r = {}, i = this.threadId;
		this.connectionAttempt = r;
		let a = () => this.connectionAttempt === r && this.threadId === i;
		if (await n, !a() || (await this.ensureRuntimeConfiguration(), !a())) return {
			result: void 0,
			newMessages: []
		};
		if (this.runtimeMode !== "intelligence") return Mh(this, e, t, (e, t) => this.connect(e, t));
		if (await this.resolveDelegate(), !a()) return {
			result: void 0,
			newMessages: []
		};
		let o = this.delegate, s = o.subscribe({
			onMessagesChanged: () => {
				a() && this.setMessages([...o.messages]);
			},
			onStateChanged: () => {
				a() && this.setState({ ...o.state });
			},
			onRunInitialized: () => {
				a() && (this.isRunning = !0);
			},
			onRunFinalized: () => {
				a() && (this.pendingInterrupts = V(o.pendingInterrupts), this.isRunning = !1);
			},
			onRunFailed: () => {
				a() && (this.isRunning = !1);
			},
			onRunErrorEvent: () => {
				a() && (this.isRunning = o.isRunning);
			},
			onRunStartedEvent: () => {
				a() && (this.isRunning = o.isRunning);
			}
		}), c = [...this.subscribers, ...t ? [t] : []].map((e) => o.subscribe(new Proxy(e, { get(e, t, n) {
			let r = Reflect.get(e, t, n);
			return typeof r == "function" ? (...t) => a() ? Reflect.apply(r, e, t) : void 0 : r;
		} })));
		try {
			let t = await o.connectAgent(e);
			return a() && (this.setMessages([...o.messages]), this.setState({ ...o.state }), this.pendingInterrupts = V(o.pendingInterrupts)), t;
		} finally {
			a() && (this.isRunning = !1), s.unsubscribe();
			for (let e of c) e.unsubscribe();
		}
	}
	connect(e, t) {
		return this.runtimeMode === "pending" || this.transport === "auto" && this.runtimeMode !== "intelligence" ? A(() => Or(this.ensureRuntimeConfiguration())).pipe(M(() => this.connect(e, t))) : this.runtimeMode === "intelligence" ? this.#n(e, t) : this.#r(e);
	}
	run(e) {
		return this.runtimeMode === "pending" || this.transport === "auto" && this.runtimeMode !== "intelligence" ? A(() => Or(this.ensureRuntimeConfiguration())).pipe(M(() => this.run(e))) : this.runtimeMode === "intelligence" ? this.#i(e) : this.#a(e);
	}
	#n(e, t) {
		return A(() => Or(this.resolveDelegate())).pipe(M((n) => mg(n.connect(e, t))));
	}
	#r(e) {
		let t = this.#e(e);
		this.activeRun = void 0;
		let n = this.routedAgentId(), r;
		if (this.transport === "single") {
			if (!this.singleEndpointUrl) throw Error("Single endpoint transport requires a runtimeUrl");
			let e = this.createSingleRouteRequestInit(t, "agent/connect", { agentId: n });
			r = Xl(() => this.fetch(this.singleEndpointUrl, e));
		} else {
			let e = `${this.runtimeUrl}/agent/${n}/connect`, i = this.requestInit(t);
			r = Xl(() => this.fetch(e, i));
		}
		return mg(A(() => {
			let e = !1, t = [{
				type: b.MESSAGES_SNAPSHOT,
				messages: []
			}, {
				type: b.STATE_SNAPSHOT,
				snapshot: {}
			}];
			return nu(r).pipe(ci((n) => e ? D(n) : (e = !0, Or([...t, n]))), ui(A(() => e ? Jn : Or(t))));
		}));
	}
	#i(e) {
		return A(() => Or(this.resolveDelegate())).pipe(M((t) => mg(t.run(e))));
	}
	#a(e) {
		let t = this.#e(e), n = {
			threadId: t.threadId,
			runId: t.runId
		}, r = (e) => (this.activeRun = n, e.pipe(xi(() => {
			this.activeRun === n && (this.activeRun = void 0);
		})));
		if (this.transport === "single") {
			if (!this.singleEndpointUrl) throw Error("Single endpoint transport requires a runtimeUrl");
			let e = this.createSingleRouteRequestInit(t, "agent/run", { agentId: this.routedAgentId() });
			return r(mg(nu(Xl(() => this.fetch(this.singleEndpointUrl, e)))));
		}
		return r(mg(super.run(t)));
	}
	clone() {
		let t = new e({
			runtimeUrl: this.runtimeEndpointUrl ?? this.runtimeUrl,
			agentId: this.agentId,
			runtimeAgentId: this.runtimeAgentId,
			description: this.description,
			headers: { ...this.headers },
			credentials: this.credentials,
			transport: this.transport,
			runtimeMode: this.runtimeMode,
			intelligence: this.intelligence,
			capabilities: this._capabilities,
			debug: this.debug,
			fetch: this.fetch,
			messageFilter: this._messageFilter
		});
		if (t.threadId = this.threadId, t.setState(this.state), t.setMessages(this.messages), t.pendingInterrupts = V(this.pendingInterrupts), this.delegate) {
			let e = this.delegate.clone();
			t.delegate = e, t.syncDelegate(e);
		}
		return t;
	}
	async ɵrunMcpResourceRead(e) {
		let t = e.forwardedProps?.__proxiedMCPRequest;
		if (typeof t != "object" || !t || t.method !== "resources/read") throw Error("Only MCP resources/read can use the read-only path");
		await this.ensureRuntimeConfiguration();
		let n = {
			...e,
			forwardedProps: {
				...e.forwardedProps,
				__copilotkitMcpResourceReadOnly: !0
			}
		};
		if (this.runtimeMode !== "intelligence") return this.runAgent(n);
		let r = this.clone();
		return r.pendingInterrupts = [], r.runAgent(n);
	}
	clearReplayCursor(e) {
		this.runtimeMode === "intelligence" && this.delegate?.clearReconnectCursor?.(e);
	}
	async resolveDelegate() {
		if (await this.ensureRuntimeConfiguration(), !this.delegate) {
			if (this.runtimeMode !== "intelligence") throw Error("A delegate is only created for Intelligence mode");
			this.delegate = this.createIntelligenceDelegate();
		}
		return this.syncDelegate(this.delegate), this.delegate;
	}
	async ensureRuntimeConfiguration() {
		if (this.runtimeMode === "intelligence" || this.runtimeMode !== "pending" && this.transport !== "auto") return;
		if (!this.runtimeUrl) throw Error("Runtime URL is not set");
		let e = this.runtimeInfoPromise ?? this.fetchRuntimeInfo().then((t) => {
			this.runtimeInfoPromise === e && (this.runtimeMode = t.mode ?? "sse", this.intelligence = t.intelligence);
		});
		this.runtimeInfoPromise = e;
		try {
			await e;
		} catch (t) {
			throw this.runtimeInfoPromise === e && (this.runtimeInfoPromise = void 0), t;
		}
	}
	async fetchRuntimeInfo() {
		let e = { ...this.headers };
		if (this.transport === "auto") return this.fetchRuntimeInfoAutoDetect(e);
		let t, n;
		if (this.transport === "single") {
			if (!this.singleEndpointUrl) throw Error("Single endpoint transport requires a runtimeUrl");
			e["Content-Type"] ||= "application/json", n = this.singleEndpointUrl, t = {
				method: "POST",
				body: JSON.stringify({ method: "info" })
			};
		} else n = `${this.runtimeUrl}/info`, t = {};
		let r = await this.fetch(n, {
			...t,
			headers: e,
			...this.credentials ? { credentials: this.credentials } : {}
		});
		if (!r.ok) throw await tg(r);
		return await r.json();
	}
	async fetchRuntimeInfoAutoDetect(e) {
		try {
			let t = await this.fetch(`${this.runtimeUrl}/info`, {
				headers: { ...e },
				...this.credentials ? { credentials: this.credentials } : {}
			});
			if (t.status >= 200 && t.status < 300) return this.transport = "rest", await t.json();
		} catch {}
		let t = { ...e };
		t["Content-Type"] ||= "application/json";
		let n = this.runtimeEndpointUrl ?? this.runtimeUrl, r = await this.fetch(n, {
			method: "POST",
			headers: t,
			body: JSON.stringify({ method: "info" }),
			...this.credentials ? { credentials: this.credentials } : {}
		});
		if (!r.ok) throw await tg(r);
		return this.transport = "single", this.singleEndpointUrl = n, await r.json();
	}
	createSingleRouteRequestInit(e, t, n) {
		if (!this.agentId) throw Error("ProxiedCopilotRuntimeAgent requires agentId to make runtime requests");
		let r = super.requestInit(e), i = new Headers(r.headers ?? {});
		i.set("Content-Type", "application/json"), i.set("Accept", i.get("Accept") ?? "text/event-stream");
		let a;
		if (typeof r.body == "string") try {
			a = JSON.parse(r.body);
		} catch (e) {
			console.warn("ProxiedCopilotRuntimeAgent: failed to parse request body for single route transport", e);
		}
		let o = { method: t };
		return n && Object.keys(n).length > 0 && (o.params = n), a !== void 0 && (o.body = a), {
			...r,
			headers: i,
			body: JSON.stringify(o),
			...this.credentials ? { credentials: this.credentials } : {}
		};
	}
	createIntelligenceDelegate() {
		let e = this.routedAgentId();
		if (!this.runtimeUrl || !e || !this.intelligence?.wsUrl) throw Error("Intelligence mode requires runtimeUrl, agentId, and intelligence websocket metadata");
		let t = this.transport === "single";
		return new eg({
			url: this.intelligence.wsUrl,
			runtimeUrl: t ? this.runtimeEndpointUrl ?? this.runtimeUrl : this.runtimeUrl,
			transport: t ? "single" : "rest",
			agentId: e,
			headers: { ...this.headers },
			credentials: this.credentials,
			fetch: this.fetch
		});
	}
	syncDelegate(e) {
		e.agentId = this.routedAgentId(), e.description = this.description, e.threadId = this.threadId, e.debugLogger = this.debugLogger, e.setMessages(this.messages), e.setState(this.state), e.pendingInterrupts = V(this.pendingInterrupts), ug(e) && (e.headers = { ...this.headers }), dg(e) && (e.credentials = this.credentials);
	}
}, gg = /* @__PURE__ */ new Set([
	"Fetch is aborted",
	"signal is aborted without reason",
	"component unmounted"
]);
function _g(e) {
	if (typeof e != "object" || !e) return !1;
	let { name: t, message: n } = e;
	return t === "AbortError" || typeof n == "string" && gg.has(n);
}
var vg = 1e4;
function yg(e) {
	return e?.ɵruntimeRequest;
}
function bg(e) {
	return e === "/threads" || e.startsWith("/threads/") || e === "/memories" || e.startsWith("/memories/") || e === "/annotate";
}
async function xg(e, t, n, r) {
	if (r === "GET" || r === "HEAD") return;
	let i;
	if (t?.body == null ? e instanceof Request && (i = await e.clone().text()) : i = await new Response(t.body).text(), i) {
		if (n.get("content-type")?.toLowerCase().includes("application/json")) try {
			return JSON.parse(i);
		} catch {
			return i;
		}
		return i;
	}
}
async function Sg(e, t, n) {
	let r = typeof window < "u" && window.location?.href ? window.location.href : "http://localhost", i = new URL(n, r), a = e instanceof Request ? e.url : e instanceof URL ? e.href : e, o = new URL(a, r), s = i.pathname.replace(/\/$/, "");
	if (o.origin !== i.origin || !o.pathname.startsWith(`${s}/`)) return null;
	let c = o.pathname.slice(s.length);
	if (!bg(c)) return null;
	let l = (t?.method ?? (e instanceof Request ? e.method : "GET")).toUpperCase(), u = new Headers(t?.headers ?? (e instanceof Request ? e.headers : void 0)), d = await xg(e, t, u, l);
	return u.set("content-type", "application/json"), u.delete("content-length"), {
		input: n,
		init: {
			...e instanceof Request ? {
				cache: e.cache,
				credentials: e.credentials,
				integrity: e.integrity,
				keepalive: e.keepalive,
				mode: e.mode,
				redirect: e.redirect,
				referrer: e.referrer,
				referrerPolicy: e.referrerPolicy,
				signal: e.signal
			} : {},
			...t,
			method: "POST",
			headers: u,
			body: JSON.stringify({
				method: "resource/request",
				params: {
					path: `${c}${o.search}`,
					httpMethod: l
				},
				...d === void 0 ? {} : { body: d }
			})
		}
	};
}
var Cg = class extends Error {
	name = "CopilotKitHeaderResolutionError";
	constructor(e) {
		super("[CopilotKit] Failed to resolve request headers", { cause: e });
	}
};
function wg(e) {
	let t = e;
	for (let e = 0; e < 5 && t; e++) {
		if (t instanceof Cg) return !0;
		t = t.cause;
	}
	return !1;
}
function Tg(e) {
	return typeof e == "object" && !!e && typeof e.then == "function";
}
function Eg(e) {
	return Object.fromEntries(Object.entries(e).filter((e) => e[1] != null));
}
function Dg(e, t) {
	let n = Object.keys(e), r = Object.keys(t);
	return n.length === r.length && n.every((n) => e[n] === t[n]);
}
function Og(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
var kg = class {
	source = {};
	sourceGeneration = 0;
	snapshot = {};
	inFlight;
	constructor(e) {
		this.onFailure = e;
	}
	get headers() {
		return this.snapshot;
	}
	get generation() {
		return this.sourceGeneration;
	}
	setSource(e) {
		if (typeof e == "function" && e === this.source) return !1;
		let t = typeof e == "function" ? {} : Eg(e);
		return typeof e != "function" && typeof this.source != "function" && Dg(t, this.snapshot) ? !1 : (this.source = e, this.sourceGeneration += 1, this.inFlight = void 0, this.snapshot = t, !0);
	}
	resolve() {
		let e = this.source;
		if (typeof e != "function") return this.snapshot;
		let t = this.sourceGeneration;
		if (this.inFlight?.generation === t) return this.inFlight.promise;
		let n;
		try {
			n = e();
		} catch (e) {
			throw this.fail(e);
		}
		if (!Tg(n)) return this.accept(n, t);
		let r = Promise.resolve(n).then((e) => this.accept(e, t), (e) => {
			throw this.fail(e);
		}).finally(() => {
			this.inFlight?.promise === r && (this.inFlight = void 0);
		});
		return this.inFlight = {
			generation: t,
			promise: r
		}, r;
	}
	accept(e, t) {
		if (!Og(e)) throw this.fail(/* @__PURE__ */ TypeError("headers builder must return an object of header values"));
		let n = Eg(e);
		return t === this.sourceGeneration ? (Dg(n, this.snapshot) || (this.snapshot = n), this.snapshot) : n;
	}
	fail(e) {
		if (e instanceof Cg) return e;
		let t = new Cg(e);
		return this.onFailure(t), t;
	}
}, Ag = /* @__PURE__ */ new Set(["content-type", "accept"]);
function jg(e, t) {
	if (e instanceof Headers) {
		let n = new Headers(e);
		for (let [e, r] of Object.entries(t)) Ag.has(e.toLowerCase()) && n.has(e) || n.set(e, r);
		return n;
	}
	let n = Array.isArray(e) ? Object.fromEntries(e) : { ...e }, r = new Map(Object.keys(n).map((e) => [e.toLowerCase(), e]));
	for (let [e, i] of Object.entries(t)) {
		let t = r.get(e.toLowerCase());
		if (t !== void 0) {
			if (Ag.has(e.toLowerCase())) continue;
			delete n[t];
		}
		n[e] = i;
	}
	return n;
}
async function Mg(e, t) {
	if (!t || !Tg(e)) return e;
	if (t.aborted) throw Ng(t);
	return new Promise((n, r) => {
		let i = () => r(Ng(t));
		t.addEventListener("abort", i, { once: !0 }), Promise.resolve(e).then((e) => {
			t.removeEventListener("abort", i), n(e);
		}, (e) => {
			t.removeEventListener("abort", i), r(e);
		});
	});
}
function Ng(e) {
	return e.reason instanceof Error ? e.reason : new DOMException("The operation was aborted.", "AbortError");
}
function Pg(e, t) {
	if (Object.keys(t).length === 0) return e;
	let n = (e) => {
		let n = { ...e };
		for (let [e, r] of Object.entries(t)) n[e] || (n[e] = r);
		return n;
	};
	return typeof e == "function" ? (() => {
		let t = e();
		return Tg(t) ? Promise.resolve(t).then((e) => Og(e) ? n(e) : e) : Og(t) ? n(t) : t;
	}) : n(e);
}
var Fg = 5e3, Ig = 5e3;
function Lg(e, t) {
	return t?.nonCritical ? "ignored" : _g(e) && !t?.timedOut ? "aborted" : "failed";
}
function Rg(e) {
	let t = new Headers(e);
	return t.has("content-type") || t.set("content-type", "application/json"), t;
}
var zg = 5e3, Bg = class {
	_agents = {};
	localAgents = {};
	remoteAgents = {};
	mintedThreadIds = /* @__PURE__ */ new WeakMap();
	_runtimeUrl;
	_runtimeEndpointUrl;
	_connectionInFlight;
	_runtimeConnectionGeneration = 0;
	_activeRuntimeConnectionAttempt;
	_runtimeEntitlementRetryTimer;
	_runtimeEntitlementRetryAttemptedKey;
	_runtimeEntitlementRetryPendingKey;
	_runtimeVersion;
	_runtimeConnectionStatus = Z.Disconnected;
	_runtimeTransport = "auto";
	_requestedTransport = "auto";
	_audioFileTranscriptionEnabled = !1;
	_runtimeMode = "sse";
	_intelligence;
	_threadEndpoints;
	_singleRouteResourceOperations = !1;
	_suggestions;
	_inspectorLearning = !1;
	_inspectorMetadata;
	_inspectorMetadataSupported = !1;
	inspectorMetadataRefreshReady = !1;
	inspectorMetadataConnectionGeneration = 0;
	inspectorMetadataGeneration = 0;
	inspectorMetadataHeadersGeneration = 0;
	inspectorMetadataCredentialsGeneration = 0;
	inspectorMetadataAbortController;
	inspectorMetadataNotificationQueue = Promise.resolve();
	_a2uiEnabled = !1;
	_a2uiAgents;
	_openGenerativeUIEnabled = !1;
	_licenseStatus;
	_runtimeEntitlements;
	_telemetryDisabled = !1;
	remoteAgentConnections = /* @__PURE__ */ new WeakMap();
	runtimeFetch;
	runtimeProbeInFlight = !1;
	runtimeProbeToken = 0;
	runtimeProbeAbortController;
	runtimeRecoveryRunning = !1;
	runtimeRecoveryPending = !1;
	runtimeHealthGeneration = 0;
	agentOwnHeaders = /* @__PURE__ */ new WeakMap();
	constructor(e) {
		this.core = e;
	}
	get agents() {
		return this._agents;
	}
	get runtimeUrl() {
		return this._runtimeUrl;
	}
	get runtimeVersion() {
		return this._runtimeVersion;
	}
	get runtimeConnectionStatus() {
		return this._runtimeConnectionStatus;
	}
	get runtimeTransport() {
		return this._runtimeTransport;
	}
	get audioFileTranscriptionEnabled() {
		return this._audioFileTranscriptionEnabled;
	}
	get runtimeMode() {
		return this._runtimeMode;
	}
	get intelligence() {
		return this._intelligence;
	}
	get threadEndpoints() {
		return this._threadEndpoints;
	}
	get suggestions() {
		return this._suggestions;
	}
	get inspectorLearning() {
		return this._inspectorLearning;
	}
	get inspectorMetadata() {
		return this._inspectorMetadata;
	}
	get a2uiEnabled() {
		return this._a2uiEnabled;
	}
	get a2uiAgents() {
		return this._a2uiAgents;
	}
	get openGenerativeUIEnabled() {
		return this._openGenerativeUIEnabled;
	}
	get licenseStatus() {
		return this._licenseStatus;
	}
	get runtimeEntitlements() {
		return this._runtimeEntitlements;
	}
	get runtimeEntitlementRetryPending() {
		return this._runtimeEntitlementRetryPendingKey === this.runtimeConnectionKey();
	}
	get telemetryDisabled() {
		return this._telemetryDisabled;
	}
	initialize(e) {
		this.localAgents = this.assignAgentIds(e), this.applyHeadersToAgents(this.localAgents), this.applyCredentialsToAgents(this.localAgents), this.applyMessageFilterToAgents(this.localAgents), this.applyRuntimeFetchToAgents(this.localAgents), this._agents = this.localAgents;
	}
	setRuntimeUrl(e, t) {
		let n = e ? e.replace(/\/$/, "") : void 0, r = e || void 0;
		(this._runtimeUrl !== n || this._runtimeEndpointUrl !== r) && (this.invalidateInspectorMetadataConnection(), this.abandonRuntimeHealthProbe(), this.resetRuntimeEntitlementRetry(), this._licenseStatus = void 0, this._runtimeEntitlements = void 0, this._singleRouteResourceOperations = !1, this._runtimeUrl = n, this._runtimeEndpointUrl = r, t?.deferConnection || this.updateRuntimeConnection({ preserveOnFailure: this.hasLiveRuntimeKnowledgeToProtect() }));
	}
	connectRuntime() {
		typeof window < "u" && this._runtimeUrl && this._runtimeConnectionStatus === Z.Disconnected && this.updateRuntimeConnection();
	}
	setRuntimeTransport(e) {
		this._requestedTransport !== e && (this.invalidateInspectorMetadataConnection(), this.abandonRuntimeHealthProbe(), this.resetRuntimeEntitlementRetry(), this._requestedTransport = e, this._runtimeTransport = e, this._singleRouteResourceOperations = !1, this.updateRuntimeConnection({ preserveOnFailure: this.hasLiveRuntimeKnowledgeToProtect() }));
	}
	hasLiveRuntimeKnowledgeToProtect() {
		return Object.keys(this.remoteAgents).length !== 0 && this._runtimeConnectionStatus !== Z.Connected;
	}
	reconcileRecoveredAgents(e) {
		let t = {
			...this.remoteAgents,
			...e
		};
		if (Object.keys(e).length === 0) return t;
		for (let [n, r] of Object.entries(t)) Object.prototype.hasOwnProperty.call(e, n) || this.carriesConversationState(r) || delete t[n];
		return t;
	}
	carriesConversationState(e) {
		if (e.messages.length > 0) return !0;
		let t = this.mintedThreadIds.get(e);
		return t === void 0 || e.threadId !== t;
	}
	abandonRuntimeHealthProbe() {
		this.runtimeProbeToken += 1, this.runtimeProbeInFlight = !1, this.runtimeHealthGeneration += 1, this.runtimeProbeAbortController?.abort(), this.runtimeProbeAbortController = void 0;
	}
	setAgents__unsafe_dev_only(e) {
		Object.entries(e).forEach(([e, t]) => {
			t && this.validateAndAssignAgentId(e, t);
		}), this.localAgents = e, this._agents = {
			...this.localAgents,
			...this.remoteAgents
		}, this.applyHeadersToAgents(this._agents), this.applyCredentialsToAgents(this._agents), this.applyMessageFilterToAgents(this._agents), this.applyRuntimeFetchToAgents(this._agents), this.notifyAgentsChanged();
	}
	addAgent__unsafe_dev_only({ id: e, agent: t }) {
		this.validateAndAssignAgentId(e, t), this.localAgents[e] = t, this.applyHeadersToAgent(t), this.applyCredentialsToAgent(t), this.applyRuntimeFetchToAgent(t), this._agents = {
			...this.localAgents,
			...this.remoteAgents
		}, this.notifyAgentsChanged();
	}
	removeAgent__unsafe_dev_only(e) {
		delete this.localAgents[e], this._agents = {
			...this.localAgents,
			...this.remoteAgents
		}, this.notifyAgentsChanged();
	}
	registerProxiedAgent({ agentId: e, runtimeAgentId: t }) {
		if (Object.prototype.hasOwnProperty.call(this._agents, e)) throw Error(`CopilotKitCore.registerProxiedAgent: agentId "${e}" is already registered. Pick a different agentId, or unregister the existing agent first.`);
		let n = this.core, r = n.debug, i = new hg({
			runtimeUrl: this._runtimeEndpointUrl ?? this._runtimeUrl,
			agentId: e,
			runtimeAgentId: t,
			transport: this._runtimeTransport,
			credentials: n.credentials,
			runtimeMode: this._runtimeUrl ? this._runtimeConnectionStatus === Z.Connected ? this._runtimeMode : "pending" : "sse",
			intelligence: this._intelligence,
			debug: r ? $d(r) : void 0,
			messageFilter: n.messageFilter
		});
		return this.applyHeadersToAgent(i), this.applyRuntimeFetchToAgent(i), this.localAgents[e] = i, this._agents = {
			...this.localAgents,
			...this.remoteAgents
		}, this.notifyAgentsChanged(), {
			agent: i,
			unregister: () => {
				this.localAgents[e] === i && (delete this.localAgents[e], this._agents = {
					...this.localAgents,
					...this.remoteAgents
				}, this.notifyAgentsChanged());
			}
		};
	}
	getAgent(e) {
		if (e in this._agents) return this._agents[e];
		(this.runtimeUrl === void 0 || this.runtimeConnectionStatus !== Z.Disconnected && this.runtimeConnectionStatus !== Z.Connecting) && console.warn(`Agent ${e} not found`);
	}
	applyHeaderRecordToAgent(e, t) {
		this.agentOwnHeaders.has(e) || this.agentOwnHeaders.set(e, { ...e.headers });
		let n = this.agentOwnHeaders.get(e);
		e instanceof hg ? (e.headers = { ...n }, this.applyRuntimeFetchToAgent(e)) : e.headers = {
			...n,
			...t
		};
	}
	applyHeadersToAgent(e) {
		if (!jh(e)) return;
		let t = this.core;
		this.applyHeaderRecordToAgent(e, t.headers);
	}
	applyHeadersToAgents(e) {
		let t = this.core;
		Object.values(e).forEach((e) => {
			jh(e) && this.applyHeaderRecordToAgent(e, t.headers);
		});
	}
	prepareAgentHeadersForRun(e) {
		if (!jh(e)) return;
		if (e instanceof hg) {
			this.applyHeaderRecordToAgent(e, {});
			return;
		}
		let t = this.core.resolveHeaders();
		if (Tg(t)) return Promise.resolve(t).then((t) => {
			this.applyHeaderRecordToAgent(e, t);
		});
		this.applyHeaderRecordToAgent(e, t);
	}
	applyCredentialsToAgent(e) {
		e instanceof hg && (e.credentials = this.core.credentials);
	}
	applyCredentialsToAgents(e) {
		Object.values(e).forEach((e) => {
			this.applyCredentialsToAgent(e);
		});
	}
	applyRuntimeModeToAgent(e, t) {
		e instanceof hg && e.adoptRuntimeMode(t.mode ?? "sse", t.intelligence);
	}
	applyMessageFilterToAgent(e) {
		e instanceof hg && (e.messageFilter = this.core.messageFilter);
	}
	applyMessageFilterToAgents(e) {
		Object.values(e).forEach((e) => {
			this.applyMessageFilterToAgent(e);
		});
	}
	get runtimeEndpointUrl() {
		return this._runtimeEndpointUrl;
	}
	createRuntimeFetch() {
		return this.runtimeFetch ||= (async (e, t) => {
			let n = this.core, r = await Mg(n.resolveHeaders(), t?.signal), i = jg(t?.headers ?? (e instanceof Request ? e.headers : void 0), r);
			t = {
				...t,
				headers: i
			};
			let a = () => yg(t), o = this.armRuntimeRequestWatchdog(a());
			try {
				let n = this._runtimeTransport === "single" && this._singleRouteResourceOperations && this._runtimeUrl ? await Sg(e, t, this._runtimeEndpointUrl ?? this._runtimeUrl) : null, r = n ? await fetch(n.input, n.init) : await fetch(e, t);
				return o.clear(), this.handleRuntimeRequestOutcome(r.ok ? "ok" : a()?.nonCritical ? "ignored" : "failed", o.checked), r;
			} catch (e) {
				throw o.clear(), this.handleRuntimeRequestOutcome(Lg(e, a()), o.checked), e;
			}
		}), this.runtimeFetch;
	}
	armRuntimeRequestWatchdog(e) {
		if (typeof window > "u" || e?.nonCritical || e?.selfBounded) return {
			clear: () => {},
			checked: () => !1
		};
		let t = !1, n = setTimeout(() => {
			t = this.handleRuntimeRequestOutcome("failed");
		}, vg);
		return {
			clear: () => clearTimeout(n),
			checked: () => t
		};
	}
	applyRuntimeFetchToAgent(e) {
		e instanceof hg && (e.fetch = this.createRuntimeFetch());
	}
	applyRuntimeFetchToAgents(e) {
		Object.values(e).forEach((e) => {
			this.applyRuntimeFetchToAgent(e);
		});
	}
	handleHeadersChanged() {
		this.inspectorMetadataHeadersGeneration += 1, this.setInspectorMetadata(void 0), this.refreshInspectorMetadata();
	}
	handleCredentialsChanged() {
		this.inspectorMetadataCredentialsGeneration += 1, this.setInspectorMetadata(void 0), this.refreshInspectorMetadata();
	}
	async refreshInspectorMetadata() {
		let e = ++this.inspectorMetadataGeneration;
		if (this.inspectorMetadataAbortController?.abort(), this.inspectorMetadataAbortController = void 0, !this._inspectorMetadataSupported || !this.inspectorMetadataRefreshReady || !this.runtimeUrl || this._runtimeConnectionStatus !== Z.Connected) {
			this.setInspectorMetadata(void 0);
			return;
		}
		let t = this.runtimeUrl, n = this._requestedTransport, r = this._runtimeTransport, i = this.inspectorMetadataHeadersGeneration, a = this.inspectorMetadataCredentialsGeneration, o = this.core, s;
		try {
			let e = o.resolveHeaders();
			s = { ...Tg(e) ? await e : e };
		} catch {
			e === this.inspectorMetadataGeneration && this.setInspectorMetadata(void 0);
			return;
		}
		if (e !== this.inspectorMetadataGeneration) return;
		let c = o.credentials, l = new AbortController();
		this.inspectorMetadataAbortController = l;
		let u = !1, d, f, p = new Promise((e, t) => {
			f = t;
		}), m = () => {
			f?.(/* @__PURE__ */ Error("Inspector metadata request aborted"));
		};
		l.signal.addEventListener("abort", m, { once: !0 });
		let h = new Promise((e, t) => {
			d = setTimeout(() => {
				u = !0, t(/* @__PURE__ */ Error("Inspector metadata request timed out")), l.abort();
			}, Fg);
		}), g;
		try {
			let e = (async () => {
				let e = r === "single" ? await this.fetchInspectorMetadataSingle({
					runtimeUrl: this.singleEndpointUrlFor(t),
					headers: s,
					credentials: c,
					signal: l.signal
				}) : await this.fetchInspectorMetadataRest({
					runtimeUrl: t,
					headers: s,
					credentials: c,
					signal: l.signal
				});
				if (e.status !== 204 && e.ok) return Ud(await e.json());
			})();
			g = await Promise.race([
				e,
				p,
				h
			]);
		} catch {
			g = void 0;
		} finally {
			d !== void 0 && clearTimeout(d), l.signal.removeEventListener("abort", m);
		}
		this.isInspectorMetadataRequestCurrent({
			generation: e,
			runtimeUrl: t,
			requestedTransport: n,
			resolvedTransport: r,
			headersGeneration: i,
			credentialsGeneration: a,
			signal: l.signal,
			allowAbortedSignal: u
		}) && (this.inspectorMetadataAbortController = void 0, this.setInspectorMetadata(g));
	}
	async fetchInspectorMetadataRest({ runtimeUrl: e, headers: t, credentials: n, signal: r }) {
		return fetch(`${e}/inspector-metadata`, {
			method: "GET",
			headers: t,
			...n ? { credentials: n } : {},
			signal: r
		});
	}
	async fetchInspectorMetadataSingle({ runtimeUrl: e, headers: t, credentials: n, signal: r }) {
		return fetch(e, {
			method: "POST",
			headers: Rg(t),
			body: JSON.stringify({ method: "inspector/metadata" }),
			...n ? { credentials: n } : {},
			signal: r
		});
	}
	isInspectorMetadataRequestCurrent({ generation: e, runtimeUrl: t, requestedTransport: n, resolvedTransport: r, headersGeneration: i, credentialsGeneration: a, signal: o, allowAbortedSignal: s = !1 }) {
		return (s || !o.aborted) && e === this.inspectorMetadataGeneration && t === this.runtimeUrl && n === this._requestedTransport && r === this._runtimeTransport && i === this.inspectorMetadataHeadersGeneration && a === this.inspectorMetadataCredentialsGeneration && this._inspectorMetadataSupported && this.inspectorMetadataRefreshReady && this._runtimeConnectionStatus === Z.Connected;
	}
	invalidateInspectorMetadataConnection() {
		this._inspectorMetadataSupported = !1, this._inspectorLearning = !1, this.inspectorMetadataRefreshReady = !1, this.inspectorMetadataConnectionGeneration += 1, this.inspectorMetadataGeneration += 1, this.inspectorMetadataAbortController?.abort(), this.inspectorMetadataAbortController = void 0, this.setInspectorMetadata(void 0);
	}
	setInspectorMetadata(e) {
		if (JSON.stringify(this._inspectorMetadata) === JSON.stringify(e)) return;
		this._inspectorMetadata = e;
		let t = e;
		this.inspectorMetadataNotificationQueue = this.inspectorMetadataNotificationQueue.then(() => this.notifyInspectorMetadataChanged(t)).catch((e) => {
			console.error("Subscriber onInspectorMetadataChanged queue error:", e);
		});
	}
	setRuntimeConnectionStatus(e) {
		this._runtimeConnectionStatus = e, this.runtimeHealthGeneration += 1;
	}
	handleRuntimeRequestOutcome(e, t = () => !1) {
		return e === "aborted" || e === "ignored" || e === "failed" && t() || typeof window > "u" || !this._runtimeUrl ? !1 : e === "ok" ? (this.runtimeHealthGeneration += 1, this.runtimeRecoveryRunning && (this.runtimeRecoveryPending = !0), this._runtimeConnectionStatus === Z.Error && this.recoverRuntimeConnection(), !1) : this._runtimeConnectionStatus !== Z.Connected || this.runtimeProbeInFlight ? !1 : (this.probeRuntimeReachability(), !0);
	}
	async fetchRuntimeInfoWithTimeout(e, t = this.runtimeUrl, n = this._runtimeTransport) {
		if (!t) throw Error("Runtime URL is not set");
		let r, i = this.fetchRuntimeInfo(t, n, e.signal);
		i.catch(() => {});
		try {
			let t = new Promise((t, n) => {
				r = setTimeout(() => {
					e.abort(), n(/* @__PURE__ */ Error(`Runtime did not answer within ${Ig}ms`));
				}, Ig);
			});
			return await Promise.race([i, t]);
		} finally {
			r !== void 0 && clearTimeout(r);
		}
	}
	async probeRuntimeReachability() {
		let e = this.runtimeHealthGeneration, t = ++this.runtimeProbeToken;
		this.runtimeProbeInFlight = !0;
		let n = new AbortController();
		this.runtimeProbeAbortController = n;
		try {
			await this.fetchRuntimeInfoWithTimeout(n);
		} catch (t) {
			if (e !== this.runtimeHealthGeneration) return;
			await this.markRuntimeUnreachable(t instanceof Error ? t : Error(String(t)));
		} finally {
			this.runtimeProbeAbortController === n && (this.runtimeProbeAbortController = void 0), this.runtimeProbeToken === t && (this.runtimeProbeInFlight = !1);
		}
	}
	async markRuntimeUnreachable(e) {
		if (this.setRuntimeConnectionStatus(Z.Error), await this.notifyRuntimeStatusChanged(Z.Error), wg(e)) {
			nf.warn(`Could not resolve request headers for the identification request (${this._runtimeUrl}/info). Check the headers builder passed to CopilotKit.`);
			return;
		}
		let t = ng(e) ? e.runtimeInfoStatus : void 0;
		nf.warn(t === void 0 ? `Runtime did not answer the identification request (${this._runtimeUrl}/info): ${e.message}. The runtime appears to be unreachable.` : `Runtime answered the identification request with status ${t} (${this._runtimeUrl}/info): ${e.message}. The runtime is reachable but refused the request — check credentials and authorisation before addresses and ports.`), await this.core.emitError({
			error: e,
			code: X.RUNTIME_INFO_FETCH_FAILED,
			context: {
				runtimeUrl: this._runtimeUrl,
				reason: t === void 0 ? "no-answer" : "answered",
				...t === void 0 ? {} : { runtimeStatus: t }
			}
		});
	}
	async recoverRuntimeConnection() {
		if (this.runtimeRecoveryRunning) this.runtimeRecoveryPending = !0;
		else {
			this.runtimeRecoveryRunning = !0;
			try {
				do
					this.runtimeRecoveryPending = !1, await this.updateRuntimeConnection({
						preserveOnFailure: !0,
						recovery: !0
					});
				while (this.runtimeRecoveryPending && this._runtimeConnectionStatus !== Z.Connected);
			} finally {
				this.runtimeRecoveryRunning = !1, this.runtimeRecoveryPending = !1;
			}
		}
	}
	async updateRuntimeConnection(e) {
		if (typeof window > "u") return;
		let t = this.runtimeConnectionKey(), n = this._connectionInFlight;
		if (n && n.attempt.key === t && this.isCurrentRuntimeConnection(n.attempt)) return n.promise;
		let r = {
			key: t,
			generation: ++this._runtimeConnectionGeneration
		};
		this._activeRuntimeConnectionAttempt = r;
		let i = this.performRuntimeConnection({
			attempt: r,
			runtimeUrl: this._runtimeUrl,
			transport: this._runtimeTransport,
			options: e
		});
		return this._connectionInFlight = {
			attempt: r,
			promise: i
		}, i.finally(() => {
			this._connectionInFlight?.promise === i && (this._connectionInFlight = void 0);
		}), i;
	}
	runtimeConnectionKey() {
		return `${this._runtimeEndpointUrl ?? this._runtimeUrl ?? ""}::${this._requestedTransport}`;
	}
	canReuseRuntimeAgent(e, t, n) {
		if (!t) return !1;
		let r = this.remoteAgentConnections.get(e);
		return r?.runtimeUrl === t.replace(/\/$/, "") && r.endpointUrl === this._runtimeEndpointUrl && r.transport === n;
	}
	isCurrentRuntimeConnection(e) {
		return this._activeRuntimeConnectionAttempt?.generation === e.generation && this.runtimeConnectionKey() === e.key;
	}
	resetRuntimeEntitlementRetry() {
		this._runtimeEntitlementRetryTimer !== void 0 && (clearTimeout(this._runtimeEntitlementRetryTimer), this._runtimeEntitlementRetryTimer = void 0), this._runtimeEntitlementRetryAttemptedKey = void 0, this._runtimeEntitlementRetryPendingKey = void 0;
	}
	updateRuntimeEntitlementRetry(e, t) {
		if (!this.isCurrentRuntimeConnection(t)) return;
		let { key: n } = t;
		e?.status === "ready" || e?.error.retryable !== !0 ? this.resetRuntimeEntitlementRetry() : this._runtimeEntitlementRetryTimer === void 0 && (this._runtimeEntitlementRetryAttemptedKey === n ? this._runtimeEntitlementRetryPendingKey = void 0 : (this._runtimeEntitlementRetryAttemptedKey = n, this._runtimeEntitlementRetryPendingKey = n, this._runtimeEntitlementRetryTimer = setTimeout(() => {
			this._runtimeEntitlementRetryTimer = void 0, this.executeRuntimeEntitlementRetry(t).catch((e) => {
				let t = e instanceof Error ? e.message : JSON.stringify(e);
				nf.warn(`Failed to retry runtime info (${this.runtimeUrl}/info): ${t}`);
			});
		}, zg)));
	}
	async executeRuntimeEntitlementRetry(e) {
		let t = this._connectionInFlight;
		t?.attempt.generation === e.generation && await t.promise, this._runtimeUrl && this.isCurrentRuntimeConnection(e) && await this.updateRuntimeConnection();
	}
	async performRuntimeConnection({ attempt: e, runtimeUrl: t, transport: n, options: r }) {
		let { key: i } = e;
		if (!t) {
			if (this.invalidateInspectorMetadataConnection(), this.setRuntimeConnectionStatus(Z.Disconnected), this._runtimeVersion = void 0, this._audioFileTranscriptionEnabled = !1, this._runtimeMode = "sse", this._intelligence = void 0, this._threadEndpoints = void 0, this._singleRouteResourceOperations = !1, this._suggestions = void 0, this._inspectorLearning = !1, this._a2uiEnabled = !1, this._a2uiAgents = void 0, this._openGenerativeUIEnabled = !1, this._licenseStatus = void 0, this._runtimeEntitlements = void 0, this.remoteAgents = {}, this._agents = this.localAgents, await this.notifyRuntimeStatusChanged(Z.Disconnected), !this.isCurrentRuntimeConnection(e)) return;
			await this.notifyAgentsChanged();
			return;
		}
		let a = this.inspectorMetadataConnectionGeneration;
		this.setRuntimeConnectionStatus(Z.Connecting);
		let o = this.runtimeHealthGeneration;
		if (await this.notifyRuntimeStatusChanged(Z.Connecting), this.isCurrentRuntimeConnection(e)) try {
			if (a !== this.inspectorMetadataConnectionGeneration) return;
			let { runtimeInfo: i, resolvedTransport: o } = r?.recovery ? await this.fetchRuntimeInfoWithTimeout(new AbortController(), t, n) : await this.fetchRuntimeInfo(t, n);
			if (!this.isCurrentRuntimeConnection(e) || a !== this.inspectorMetadataConnectionGeneration) return;
			this._runtimeTransport = o;
			let { version: s, ...c } = i, l = this.core.credentials, u = this.core.debug, d = Object.fromEntries(Object.entries(c.agents).map(([e, { description: n, capabilities: a }]) => {
				let o = Object.prototype.hasOwnProperty.call(this.remoteAgents, e) ? this.remoteAgents[e] : void 0;
				if (o instanceof hg && this.canReuseRuntimeAgent(o, t, this._runtimeTransport)) return this.applyHeadersToAgent(o), this.applyCredentialsToAgent(o), this.applyMessageFilterToAgent(o), this.applyRuntimeFetchToAgent(o), this.applyRuntimeModeToAgent(o, i), [e, o];
				let s = new hg({
					runtimeUrl: this._runtimeEndpointUrl ?? t,
					agentId: e,
					description: n,
					transport: this._runtimeTransport,
					credentials: l,
					runtimeMode: i.mode ?? "sse",
					intelligence: i.intelligence,
					capabilities: a,
					debug: u ? $d(u) : void 0,
					messageFilter: this.core.messageFilter
				});
				return this.applyHeadersToAgent(s), this.applyRuntimeFetchToAgent(s), this.mintedThreadIds.set(s, s.threadId), r?.preserveOnFailure === !0 && o && (s.threadId = o.threadId, s.setState(o.state), s.setMessages([...o.messages])), this.remoteAgentConnections.set(s, {
					runtimeUrl: t,
					endpointUrl: this._runtimeEndpointUrl,
					transport: this._runtimeTransport
				}), [e, s];
			}));
			this.remoteAgents = r?.recovery ? this.reconcileRecoveredAgents(d) : d, this._agents = {
				...this.localAgents,
				...this.remoteAgents
			}, this.setRuntimeConnectionStatus(Z.Connected), this._runtimeVersion = s, this._audioFileTranscriptionEnabled = i.audioFileTranscriptionEnabled ?? !1, this._runtimeMode = i.mode ?? "sse", this._intelligence = i.intelligence, this._singleRouteResourceOperations = o === "single" && i.singleRoute?.resourceOperations === !0, this._threadEndpoints = this._singleRouteResourceOperations ? i.singleRoute?.threadEndpoints : i.threadEndpoints, this._suggestions = i.suggestions, this._inspectorLearning = i.inspectorLearning === !0, this._inspectorMetadataSupported = i.inspectorMetadata === !0, this.inspectorMetadataRefreshReady = !1, this._inspectorMetadataSupported || this.setInspectorMetadata(void 0);
			let f = i.a2ui;
			if (this._a2uiEnabled = f?.enabled ?? i.a2uiEnabled ?? !1, this._a2uiAgents = f?.enabled ? f.agents : void 0, this._openGenerativeUIEnabled = i.openGenerativeUIEnabled ?? !1, this._licenseStatus = i.licenseStatus, this._runtimeEntitlements = i.runtimeEntitlements, this.updateRuntimeEntitlementRetry(i.runtimeEntitlements, e), this._telemetryDisabled = i.telemetryDisabled ?? !1, await this.notifyRuntimeStatusChanged(Z.Connected), !this.isCurrentRuntimeConnection(e) || (await this.notifyAgentsChanged(), a !== this.inspectorMetadataConnectionGeneration || this._runtimeConnectionStatus !== Z.Connected)) return;
			this.inspectorMetadataRefreshReady = !0, this._inspectorMetadataSupported && this.refreshInspectorMetadata();
		} catch (n) {
			if (!this.isCurrentRuntimeConnection(e) || a !== this.inspectorMetadataConnectionGeneration) return;
			let s = this._runtimeEntitlementRetryTimer === void 0 && this._runtimeEntitlementRetryAttemptedKey === i && this._runtimeEntitlementRetryPendingKey === i;
			if (s && (this._runtimeEntitlementRetryPendingKey = void 0), r?.preserveOnFailure) {
				if (r?.recovery && o !== this.runtimeHealthGeneration) return;
				this.setRuntimeConnectionStatus(Z.Error), await this.notifyRuntimeStatusChanged(Z.Error);
			} else this.invalidateInspectorMetadataConnection(), this.setRuntimeConnectionStatus(Z.Error), this._runtimeVersion = void 0, this._audioFileTranscriptionEnabled = !1, this._runtimeMode = "sse", this._intelligence = void 0, this._threadEndpoints = void 0, this._singleRouteResourceOperations = !1, this._suggestions = void 0, this._inspectorLearning = !1, this._a2uiEnabled = !1, this._a2uiAgents = void 0, this._openGenerativeUIEnabled = !1, s || (this._licenseStatus = void 0, this._runtimeEntitlements = void 0), this.remoteAgents = {}, this._agents = this.localAgents, await this.notifyRuntimeStatusChanged(Z.Error), await this.notifyAgentsChanged();
			let c = n instanceof Error ? n.message : JSON.stringify(n);
			nf.warn(`Failed to load runtime info (${t}/info): ${c}`);
			let l = n instanceof Error ? n : Error(String(n));
			await this.core.emitError({
				error: l,
				code: X.RUNTIME_INFO_FETCH_FAILED,
				context: { runtimeUrl: t }
			});
		}
	}
	async fetchRuntimeInfo(e, t, n) {
		let r = this.core, i = r.credentials, a = r.resolveHeaders(), o = { ...Tg(a) ? await Mg(a, n) : a };
		if (t === "single") return {
			runtimeInfo: await this.fetchRuntimeInfoSingle(this.singleEndpointUrlFor(e), o, i, n),
			resolvedTransport: "single"
		};
		if (t === "auto") return this.fetchRuntimeInfoAutoDetect(e, o, i, n);
		let s = await fetch(`${e}/info`, {
			headers: o,
			...i ? { credentials: i } : {},
			...n ? { signal: n } : {}
		});
		if (!s.ok) throw await tg(s);
		return {
			runtimeInfo: await s.json(),
			resolvedTransport: "rest"
		};
	}
	singleEndpointUrlFor(e) {
		return this._runtimeEndpointUrl !== void 0 && this._runtimeUrl === e ? this._runtimeEndpointUrl : e;
	}
	async fetchRuntimeInfoSingle(e, t, n, r) {
		let i = await fetch(e, {
			method: "POST",
			headers: Rg(t),
			body: JSON.stringify({ method: "info" }),
			...n ? { credentials: n } : {},
			...r ? { signal: r } : {}
		});
		if (!i.ok) throw await tg(i);
		return await i.json();
	}
	async fetchRuntimeInfoAutoDetect(e, t, n, r) {
		try {
			let i = await fetch(`${e}/info`, {
				headers: { ...t },
				...n ? { credentials: n } : {},
				...r ? { signal: r } : {}
			});
			if (i.status >= 200 && i.status < 300) return {
				runtimeInfo: await i.json(),
				resolvedTransport: "rest"
			};
		} catch {}
		return {
			runtimeInfo: await this.fetchRuntimeInfoSingle(this.singleEndpointUrlFor(e), { ...t }, n, r),
			resolvedTransport: "single"
		};
	}
	assignAgentIds(e) {
		return Object.entries(e).forEach(([e, t]) => {
			t && this.validateAndAssignAgentId(e, t);
		}), e;
	}
	validateAndAssignAgentId(e, t) {
		if (t.agentId && t.agentId !== e) throw Error(`Agent registration mismatch: Agent with ID "${t.agentId}" cannot be registered under key "${e}". The agent ID must match the registration key or be undefined.`);
		t.agentId ||= e;
	}
	async notifyRuntimeStatusChanged(e) {
		await this.core.notifySubscribers((t) => t.onRuntimeConnectionStatusChanged?.({
			copilotkit: this.core,
			status: e
		}), "Error in CopilotKitCore subscriber (onRuntimeConnectionStatusChanged):");
	}
	async notifyAgentsChanged() {
		await this.core.notifySubscribers((e) => e.onAgentsChanged?.({
			copilotkit: this.core,
			agents: this._agents
		}), "Subscriber onAgentsChanged error:");
	}
	async notifyInspectorMetadataChanged(e) {
		await this.core.notifySubscribers((t) => t.onInspectorMetadataChanged?.({
			copilotkit: this.core,
			inspectorMetadata: e
		}), "Subscriber onInspectorMetadataChanged error:");
	}
};
function Vg(e, t) {
	return e === void 0 || t !== void 0 && e.includes(t);
}
var Hg = class {
	_context = {};
	constructor(e) {
		this.core = e;
	}
	get context() {
		return this._context;
	}
	addContext({ description: e, value: t, agentIds: n }) {
		let r = ae();
		return this._context[r] = {
			description: e,
			value: t,
			...n ? { agentIds: n } : {}
		}, this.notifySubscribers(), r;
	}
	getContextForAgent(e) {
		return Object.values(this._context).filter((t) => Vg(t.agentIds, e)).map(({ description: e, value: t }) => ({
			description: e,
			value: t
		}));
	}
	removeContext(e) {
		delete this._context[e], this.notifySubscribers();
	}
	async notifySubscribers() {
		await this.core.notifySubscribers((e) => e.onContextChanged?.({
			copilotkit: this.core,
			context: this._context
		}), "Subscriber onContextChanged error:");
	}
}, Ug = class {
	_suggestionsConfig = {};
	_suggestions = {};
	_runningSuggestions = {};
	constructor(e) {
		this.core = e;
	}
	initialize(e) {
		for (let t of e) this._suggestionsConfig[ae()] = t;
	}
	addSuggestionsConfig(e) {
		let t = ae();
		return this._suggestionsConfig[t] = e, this.notifySuggestionsConfigChanged(), t;
	}
	removeSuggestionsConfig(e) {
		delete this._suggestionsConfig[e], this.notifySuggestionsConfigChanged();
	}
	reloadSuggestions(e) {
		this.clearSuggestions(e);
		let t = this.core.getAgent(e), n = t?.messages?.length ?? 0, r = !1;
		for (let i of Object.values(this._suggestionsConfig)) {
			if (i.consumerAgentId !== void 0 && i.consumerAgentId !== "*" && i.consumerAgentId !== e || !this.shouldShowSuggestions(i, n)) continue;
			let a = ae();
			if (Gg(i)) {
				if (!t) continue;
				r || (r = !0, this.notifySuggestionsStartedLoading(e)), this.generateSuggestions(a, i, e);
			} else Kg(i) && this.addStaticSuggestions(a, i, e);
		}
	}
	clearSuggestions(e) {
		let t = this._runningSuggestions[e];
		if (t) {
			for (let e of t) e.abortRun();
			delete this._runningSuggestions[e];
		}
		this._suggestions[e] = {}, this.notifySuggestionsChanged(e, []);
	}
	getSuggestions(e) {
		return {
			suggestions: Object.values(this._suggestions[e] ?? {}).flat(),
			isLoading: (this._runningSuggestions[e]?.length ?? 0) > 0
		};
	}
	async generateSuggestions(e, t, n) {
		let r, i = !1;
		try {
			let a = this.core, o = t.providerAgentId ?? "default", s = a.getAgent(o);
			if (!s) throw Error(`Suggestions provider agent not found: ${o}`);
			let c = a.getAgent(n);
			if (!c) throw Error(`Suggestions consumer agent not found: ${n}`);
			let l = [
				"Suggest what the user could say next. Provide clear, highly relevant suggestions by calling the `copilotkitSuggest` tool.",
				`Provide at least ${t.minSuggestions ?? 1} and at most ${t.maxSuggestions ?? 3} suggestions.`,
				`The user has the following tools available: ${JSON.stringify(a.buildFrontendTools(n))}.`,
				` ${t.instructions}`
			].join("\n");
			this._suggestions[n] = {
				...this._suggestions[n],
				[e]: []
			};
			let u = JSON.parse(JSON.stringify(c.messages)), d = JSON.parse(JSON.stringify(c.state ?? {})), f = this.core.suggestions === !0 && this.core.runtimeTransport !== "single", p, m;
			if (f) {
				let e = `${this.core.runtimeUrl}/agent/${encodeURIComponent(o)}/suggest`, t = this.core.credentials;
				m = new kd({
					agentId: o,
					url: e,
					...t ? { fetch: (e, n) => fetch(e, {
						...n,
						credentials: t
					}) } : {}
				}), p = m;
			} else p = s.clone(), p instanceof hg && (p.messageFilter = void 0);
			if (p.threadId = e, p.setMessages(u), p.setState(d), r = { abortRun: () => {
				i = !0, p.abortRun();
			} }, this._runningSuggestions[n] = [...this._runningSuggestions[n] ?? [], r], m ? m.headers = { ...await this.core.resolveHeaders() } : await this.core.prepareAgentHeadersForRun(p), i) return;
			p.addMessage({
				id: e,
				role: "user",
				content: l
			}), await p.runAgent({
				context: a.getContextForAgent(n),
				forwardedProps: {
					...a.getPropertiesForAgent(n),
					toolChoice: {
						type: "function",
						function: { name: "copilotkitSuggest" }
					}
				},
				tools: [qg]
			}, { onMessagesChanged: ({ messages: t }) => {
				this.extractSuggestions(t, e, n, !0);
			} });
		} catch (e) {
			!Wg(e) && !i && console.warn("Error generating suggestions:", e);
		} finally {
			this.finalizeSuggestions(e, n);
			let t = this._runningSuggestions[n], i = r ? (t ?? []).filter((e) => e !== r) : t ?? [];
			i.length === 0 ? (delete this._runningSuggestions[n], await this.notifySuggestionsFinishedLoading(n)) : this._runningSuggestions[n] = i;
		}
	}
	finalizeSuggestions(e, t) {
		let n = this._suggestions[t], r = n?.[e];
		if (n && r && r.length > 0) {
			let i = r.filter((e) => e.title !== "" || e.message !== "").map((e) => ({
				...e,
				isLoading: !1
			}));
			i.length > 0 ? n[e] = i : delete n[e];
			let a = Object.values(this._suggestions[t] ?? {}).flat();
			this.notifySuggestionsChanged(t, a, "finalized");
		}
	}
	extractSuggestions(e, t, n, r) {
		let i = e.findIndex((e) => e.id === t);
		if (i == -1) return;
		let a = [], o = e.slice(i + 1);
		for (let e of o) if (e.role === "assistant" && e.toolCalls) {
			for (let t of e.toolCalls) if (t.function.name === "copilotkitSuggest") {
				let e = qd(Array.isArray(t.function.arguments) ? t.function.arguments.join("") : t.function.arguments);
				if (e && typeof e == "object" && "suggestions" in e) {
					let t = e.suggestions;
					if (Array.isArray(t)) for (let e of t) e && typeof e == "object" && "title" in e && a.push({
						title: e.title ?? "",
						message: e.message ?? "",
						isLoading: !1
					});
				}
			}
		}
		r && a.length > 0 && (a[a.length - 1].isLoading = !0);
		let s = this._suggestions[n];
		if (s) {
			s[t] = a;
			let e = Object.values(this._suggestions[n] ?? {}).flat();
			this.notifySuggestionsChanged(n, e, "suggestions changed");
		}
	}
	async notifySuggestionsConfigChanged() {
		await this.core.notifySubscribers((e) => e.onSuggestionsConfigChanged?.({
			copilotkit: this.core,
			suggestionsConfig: this._suggestionsConfig
		}), "Subscriber onSuggestionsConfigChanged error:");
	}
	async notifySuggestionsChanged(e, t, n = "") {
		await this.core.notifySubscribers((n) => n.onSuggestionsChanged?.({
			copilotkit: this.core,
			agentId: e,
			suggestions: t
		}), `Subscriber onSuggestionsChanged error: ${n}`);
	}
	async notifySuggestionsStartedLoading(e) {
		await this.core.notifySubscribers((t) => t.onSuggestionsStartedLoading?.({
			copilotkit: this.core,
			agentId: e
		}), "Subscriber onSuggestionsStartedLoading error:");
	}
	async notifySuggestionsFinishedLoading(e) {
		await this.core.notifySubscribers((t) => t.onSuggestionsFinishedLoading?.({
			copilotkit: this.core,
			agentId: e
		}), "Subscriber onSuggestionsFinishedLoading error:");
	}
	shouldShowSuggestions(e, t) {
		let n = e.available;
		if (!n) return Gg(e) ? t > 0 : t === 0;
		switch (n) {
			case "disabled": return !1;
			case "before-first-message": return t === 0;
			case "after-first-message": return t > 0;
			case "always": return !0;
			default: return !1;
		}
	}
	addStaticSuggestions(e, t, n) {
		let r = t.suggestions.map((e) => ({
			...e,
			isLoading: !1
		}));
		this._suggestions[n] = {
			...this._suggestions[n],
			[e]: r
		};
		let i = Object.values(this._suggestions[n] ?? {}).flat();
		this.notifySuggestionsChanged(n, i, "static suggestions added");
	}
};
function Wg(e) {
	return typeof e == "object" && !!e && "name" in e && e.name === "AbortError";
}
function Gg(e) {
	return "instructions" in e;
}
function Kg(e) {
	return "suggestions" in e;
}
var qg = {
	name: "copilotkitSuggest",
	description: "Suggest what the user could say next",
	parameters: {
		type: "object",
		properties: { suggestions: {
			type: "array",
			description: "List of suggestions shown to the user as buttons.",
			items: {
				type: "object",
				properties: {
					title: {
						type: "string",
						description: "The title of the suggestion. This is shown as a button and should be short."
					},
					message: {
						type: "string",
						description: "The message to send when the suggestion is clicked. This should be a clear, complete sentence and will be sent as an instruction to the AI."
					}
				},
				required: ["title", "message"]
			}
		} },
		required: ["suggestions"]
	}
}, Jg = "Forwarded to client";
function Yg(e) {
	if (typeof e == "string") return e.trim();
	if (Array.isArray(e)) {
		let t = e.flatMap((e) => typeof e == "string" ? [e] : e && typeof e == "object" && "text" in e && typeof e.text == "string" ? [e.text] : []).join("").trim();
		return t.length > 0 ? t : null;
	}
	return e && typeof e == "object" && "text" in e && typeof e.text == "string" ? e.text.trim() : null;
}
function Xg(e) {
	return Yg(e) === Jg;
}
var Zg = /* @__PURE__ */ new Set([
	"image",
	"audio",
	"video",
	"document"
]);
function Qg(e) {
	return e === void 0 || typeof e == "string";
}
function $g(e) {
	if (!e || typeof e != "object") return !1;
	let t = e;
	if (typeof t.value != "string") return !1;
	switch (t.type) {
		case "data": return typeof t.mimeType == "string";
		case "url": return Qg(t.mimeType);
		case "file": return Qg(t.provider) && Qg(t.mimeType);
		default: return !1;
	}
}
function e_(e) {
	if (!e || typeof e != "object" || Array.isArray(e)) return !1;
	let t = e;
	return !Qg(t.id) || t.metadata === null ? !1 : t.type === "text" ? typeof t.text == "string" : typeof t.type == "string" && Zg.has(t.type) && $g(t.source);
}
function t_(e) {
	if (e == null) return {
		content: "",
		text: ""
	};
	if (typeof e == "string") return {
		content: e,
		text: e
	};
	let t = JSON.stringify(e);
	return Array.isArray(e) && e.length > 0 && e.every(e_) ? {
		content: e,
		text: t
	} : {
		content: t,
		text: t
	};
}
var n_ = {
	type: "object",
	properties: {}
};
function r_(e) {
	if (!e.parameters) return { ...n_ };
	let t = tf(e.parameters, { zodToJsonSchema: (e, t) => Gp(e, t) });
	if (!t || typeof t != "object") return { ...n_ };
	let { $schema: n, ...r } = t;
	return typeof r.type != "string" && (r.type = "object"), (typeof r.properties != "object" || r.properties === null) && (r.properties = {}), i_(r), r;
}
function i_(e) {
	if (!e || typeof e != "object") return;
	if (Array.isArray(e)) {
		e.forEach(i_);
		return;
	}
	let t = e;
	t.additionalProperties !== void 0 && delete t.additionalProperties;
	for (let e of Object.values(t)) i_(e);
}
function a_() {
	return typeof document > "u" ? null : document.modelContext ?? null;
}
var o_ = class {
	entries = /* @__PURE__ */ new Map();
	warnedNames = /* @__PURE__ */ new Set();
	get registeredNames() {
		return [...this.entries.keys()];
	}
	sync(e) {
		let t = a_();
		if (t) {
			for (let [t, n] of [...this.entries]) e.get(t) !== n.tool && (n.controller.abort(), this.entries.delete(t));
			for (let [n, r] of e) {
				if (this.entries.has(n)) continue;
				if (!r.description) {
					this.warnOnce(n, `Skipping WebMCP registration for tool '${n}': WebMCP requires a description.`);
					continue;
				}
				let e = new AbortController();
				this.entries.set(n, {
					tool: r,
					controller: e
				}), t.registerTool(this.buildModelContextTool(r), { signal: e.signal }).catch((t) => {
					if (this.entries.get(n)?.controller !== e) return;
					this.entries.delete(n);
					let r = t instanceof Error ? t.message : String(t);
					this.warnOnce(n, `WebMCP registration failed for tool '${n}': ${r}`);
				});
			}
		}
	}
	buildModelContextTool(e) {
		let t = typeof e.webmcp == "object" ? e.webmcp.annotations : void 0;
		return {
			name: e.name,
			description: e.description,
			inputSchema: r_(e),
			execute: async (t, n) => {
				if (!e.handler) return "";
				let r = {
					id: ae(),
					type: "function",
					function: {
						name: e.name,
						arguments: JSON.stringify(t ?? {})
					}
				};
				return await e.handler(t, {
					toolCall: r,
					signal: n?.signal
				});
			},
			...t ? { annotations: t } : {}
		};
	}
	warnOnce(e, t) {
		this.warnedNames.has(e) || (this.warnedNames.add(e), nf.warn(`[CopilotKit] ${t}`));
	}
}, s_ = /* @__PURE__ */ new WeakMap();
function c_(e) {
	return e.message || "Tool call failed";
}
function l_(e, t, n) {
	return !!(t && e?.aborted && !(s_.get(e)?.() && n));
}
var u_ = 100, d_ = 100, f_ = "*", p_ = class {
	_propTools = [];
	_hookTools = /* @__PURE__ */ new Map();
	_cachedMergedTools = null;
	_catalogComponents = [];
	_disabledCatalogComponents = /* @__PURE__ */ new Set();
	_disabledToolKeys = /* @__PURE__ */ new Set();
	_warnedMissingToolParameters = /* @__PURE__ */ new Set();
	_runAbortControllers = /* @__PURE__ */ new WeakMap();
	_runDepths = /* @__PURE__ */ new WeakMap();
	_originalAbortRuns = /* @__PURE__ */ new WeakMap();
	_activeRequestIds = /* @__PURE__ */ new WeakMap();
	_requestIdByRun = /* @__PURE__ */ new Map();
	_webmcpRegistry = new o_();
	_lastConnectedThreadIdsByAgent = /* @__PURE__ */ new Map();
	_lastActiveThreadIdsByAgent = /* @__PURE__ */ new Map();
	_anonymousAgentIds = /* @__PURE__ */ new WeakMap();
	_nextAnonymousAgentId = 0;
	_executingToolCalls = /* @__PURE__ */ new WeakMap();
	_connectionGenerations = /* @__PURE__ */ new WeakMap();
	_interactionAbortControllers = /* @__PURE__ */ new WeakMap();
	constructor(e) {
		this.core = e;
	}
	abortCurrentRun(e) {
		this.abortAgentRuns(e);
		let t = this._interactionAbortControllers.get(e);
		if (t) {
			for (let e of t.controllers) e.abort();
			this._interactionAbortControllers.delete(e), this._executingToolCalls.delete(e);
		}
	}
	abortAgentRuns(e) {
		for (let t of this._runAbortControllers.get(e) ?? []) t.abort();
	}
	latestRunSignal(e) {
		let t;
		for (let n of this._runAbortControllers.get(e) ?? []) t = n;
		return t?.signal;
	}
	get _internal() {
		return this.core;
	}
	getConnectRestoreKey(e) {
		if (e.agentId) return `agent:${e.agentId}`;
		let t = this._anonymousAgentIds.get(e);
		if (t) return t;
		let n = `anonymous:${this._nextAnonymousAgentId}`;
		return this._nextAnonymousAgentId += 1, this._anonymousAgentIds.set(e, n), n;
	}
	get tools() {
		if (this._hookTools.size === 0) return this._propTools;
		if (this._cachedMergedTools) return this._cachedMergedTools;
		let e = /* @__PURE__ */ new Map();
		for (let t of this._propTools) e.set(this.capabilityKey(t.name, t.agentId), t);
		for (let [t, n] of this._hookTools) e.set(t, n);
		return this._cachedMergedTools = Array.from(e.values()), this._cachedMergedTools;
	}
	initialize(e) {
		this._propTools = [...e], this._cachedMergedTools = null, this.warnOnMissingToolParameters(this._propTools), this.syncWebMCP();
	}
	addTool(e) {
		let t = this.capabilityKey(e.name, e.agentId);
		this._hookTools.has(t) ? nf.warn(`Tool already exists: '${e.name}' for agent '${e.agentId || "global"}', skipping.`) : (this._hookTools.set(t, e), this._cachedMergedTools = null, this.warnOnMissingToolParameters([e]), this.syncWebMCP());
	}
	warnOnMissingToolParameters(e) {}
	removeTool(e, t) {
		this._hookTools.delete(this.capabilityKey(e, t)), this._propTools = this._propTools.filter((n) => t === void 0 ? !(n.name === e && !n.agentId) : n.name !== e || n.agentId !== t), this._cachedMergedTools = null, this.syncWebMCP();
	}
	getTool(e) {
		let { toolName: t, agentId: n } = e, r = this.tools;
		if (n) {
			let e = r.find((e) => e.name === t && e.agentId === n);
			if (e) return e;
		}
		return r.find((e) => e.name === t && !e.agentId);
	}
	setTools(e) {
		this._propTools = [...e], this._cachedMergedTools = null, this.warnOnMissingToolParameters(this._propTools), this.syncWebMCP();
	}
	get catalogComponents() {
		return this._catalogComponents;
	}
	setCatalogComponents(e) {
		this._catalogComponents = [...e];
	}
	setCatalogComponentEnabled(e, t) {
		t ? this._disabledCatalogComponents.delete(e) : this._disabledCatalogComponents.add(e);
	}
	isCatalogComponentEnabled(e) {
		return !this._disabledCatalogComponents.has(e);
	}
	async connectAgent({ agent: e }) {
		let t = {};
		this._connectionGenerations.set(e, t);
		let n = e.threadId ?? null, r = this._interactionAbortControllers.get(e);
		if (r && r.threadId !== n) {
			for (let e of r.controllers) e.abort();
			this._interactionAbortControllers.delete(e), this._executingToolCalls.delete(e);
		}
		try {
			let r = this.getConnectRestoreKey(e), i = this._lastActiveThreadIdsByAgent.get(r), a = n !== (i ?? this._lastConnectedThreadIdsByAgent.get(r) ?? null);
			if (await e.detachActiveRun(), this._connectionGenerations.get(e) !== t || (e.threadId ?? null) !== n) return {
				result: void 0,
				newMessages: []
			};
			if (this._lastConnectedThreadIdsByAgent.set(r, n), this._lastActiveThreadIdsByAgent.set(r, n), a) {
				e.setMessages([]), e.setState({}), i !== void 0 && i !== n && (e.pendingInterrupts = []);
				let t = e;
				n && (typeof t.clearReplayCursor == "function" && t.clearReplayCursor(n), typeof t.clearReconnectCursor == "function" && t.clearReconnectCursor(n));
			}
			let o = this._internal.prepareAgentHeadersForRun(e);
			if (o && await o, await this._internal.notifySubscribers((t) => t.onAgentRunStarted?.({
				copilotkit: this.core,
				agent: e
			}), "Subscriber onAgentRunStarted error:"), this._connectionGenerations.get(e) !== t || (e.threadId ?? null) !== n) return {
				result: void 0,
				newMessages: []
			};
			let s = await e.connectAgent({
				forwardedProps: this._internal.getPropertiesForAgent(e.agentId),
				tools: this.buildFrontendTools(e.agentId),
				context: this._internal.getContextForAgent(e.agentId)
			}, this.createAgentErrorSubscriber(e));
			if (this._connectionGenerations.get(e) !== t || (e.threadId ?? null) !== n) return s;
			let c = new AbortController(), l = this._interactionAbortControllers.get(e) ?? {
				threadId: n,
				controllers: /* @__PURE__ */ new Set()
			};
			return l.controllers.add(c), this._interactionAbortControllers.set(e, l), this.processAgentResult({
				runAgentResult: s,
				agent: e,
				toolExecutionMode: "restore",
				signal: c.signal
			}).catch(async (t) => {
				await this._internal.emitError({
					error: t instanceof Error ? t : Error(String(t)),
					code: X.AGENT_CONNECT_FAILED,
					context: {
						agentId: e.agentId,
						threadId: n
					}
				});
			}).finally(() => {
				l.controllers.delete(c), l.controllers.size === 0 && this._interactionAbortControllers.get(e) === l && this._interactionAbortControllers.delete(e);
			}), s;
		} catch (t) {
			let r = t instanceof Error ? t : Error(String(t));
			if (!_g(r)) {
				let t = {};
				e.agentId && (t.agentId = e.agentId), n && (t.threadId = n), await this._internal.emitError({
					error: r,
					code: X.AGENT_CONNECT_FAILED,
					context: t
				});
			}
			return {
				result: void 0,
				newMessages: []
			};
		}
	}
	async runAgent({ agent: e, forwardedProps: t, resume: n, runId: r }, i, a) {
		e.agentId && this._internal.suggestionEngine.clearSuggestions(e.agentId);
		try {
			let t = this._internal.prepareAgentHeadersForRun(e);
			t && await t;
		} catch {
			return i?.cancel(), {
				result: void 0,
				newMessages: []
			};
		}
		if (e.detachActiveRun) try {
			await e.detachActiveRun();
		} catch (e) {
			throw i?.cancel(), e;
		}
		let o = this._internal.stateManager.getContinuationRunId(e, {
			threadId: e.threadId,
			resume: n,
			forwardedProps: t
		}), s = i ?? (o ? this._internal.stateManager.markNextRunAsContinuation(e, o) : void 0), c = a !== void 0, l = a ?? new AbortController(), u = this._runDepths.get(e) ?? 0;
		this._runDepths.set(e, u + 1);
		let d = o ?? (i ? r : void 0), f = (i ? this._activeRequestIds.get(e) : void 0) ?? (d === void 0 ? void 0 : this._requestIdByRun.get(d)) ?? ae();
		if (!c) {
			let t = this._runAbortControllers.get(e) ?? /* @__PURE__ */ new Set();
			t.add(l), this._runAbortControllers.set(e, t);
		}
		if (u === 0) {
			let t = e.abortRun;
			this._originalAbortRuns.set(e, t), e.abortRun = () => {
				this.abortAgentRuns(e), t.call(e);
			};
		}
		let p = this._activeRequestIds.get(e);
		this._activeRequestIds.set(e, f);
		try {
			u === 0 && await this._internal.notifySubscribers((t) => t.onAgentRunStarted?.({
				copilotkit: this.core,
				agent: e
			}), "Subscriber onAgentRunStarted error:");
			let a = o ?? r, c = this.createAgentErrorSubscriber(e, l.signal), d = !1, p = c.onRunStartedEvent, m = c.onRunInitialized;
			c.onRunInitialized = async (t) => (this._lastActiveThreadIdsByAgent.set(this.getConnectRestoreKey(e), t.input.threadId), s?.bind(t.input), m?.(t)), c.onRunStartedEvent = async (e) => (d = !0, s || (a = e.input.runId), p?.(e));
			let h = r !== void 0 && !i, g = {
				forwardedProps: {
					...this._internal.getPropertiesForAgent(e.agentId),
					...t,
					__copilotkitRequestId: f
				},
				...n === void 0 ? {} : { resume: n },
				...h ? { runId: r } : {},
				tools: this.buildFrontendTools(e.agentId),
				context: this._internal.getContextForAgent(e.agentId)
			}, ee = await e.runAgent(g, c);
			return d || s?.cancel(), a !== void 0 && this.rememberRequestId(a, f), await this.processAgentResult({
				runAgentResult: ee,
				agent: e,
				runId: a,
				runController: l
			});
		} catch (t) {
			s?.cancel();
			let n = t instanceof Error ? t : Error(String(t)), r = {};
			return e.agentId && (r.agentId = e.agentId), await this._internal.emitError({
				error: n,
				code: X.AGENT_RUN_FAILED,
				context: r
			}), {
				result: void 0,
				newMessages: []
			};
		} finally {
			let t = (this._runDepths.get(e) ?? 1) - 1;
			if (this._runDepths.set(e, t), !c) {
				let t = this._runAbortControllers.get(e);
				t?.delete(l), t?.size === 0 && this._runAbortControllers.delete(e);
			}
			if (t === 0) {
				let t = this._originalAbortRuns.get(e);
				t && (e.abortRun = t, this._originalAbortRuns.delete(e));
			}
			p === void 0 ? this._activeRequestIds.delete(e) : this._activeRequestIds.set(e, p);
		}
	}
	rememberRequestId(e, t) {
		if (this._requestIdByRun.delete(e), this._requestIdByRun.set(e, t), this._requestIdByRun.size > u_) {
			let e = this._requestIdByRun.keys().next().value;
			e !== void 0 && this._requestIdByRun.delete(e);
		}
	}
	async processAgentResult({ runAgentResult: e, agent: t, runId: n, toolExecutionMode: r = "all", runController: i, signal: a = i?.signal }) {
		let { newMessages: o } = e, s = t.agentId, c = !1, l = t.threadId, u = this._executingToolCalls.get(t) ?? /* @__PURE__ */ new Set();
		this._executingToolCalls.set(t, u);
		let d = r === "restore" ? t.messages.filter((e) => e.role === "assistant" && this.isInLatestUserTurn(t.messages, e.id)) : o;
		if (r === "restore" && d.some((e) => e.role === "assistant" && e.toolCalls?.some((e) => u.has(JSON.stringify([l, e.id])) && !t.messages.some((t) => t.role === "tool" && t.toolCallId === e.id && !this.isFrontendPlaceholderResult(t))))) return e;
		for (let n of d) if (n.role === "assistant") for (let i of n.toolCalls || []) {
			let d = this.getTool({
				toolName: i.function.name,
				agentId: t.agentId
			}), f, p = () => (d || f || (f = this.getTool({
				toolName: f_,
				agentId: t.agentId
			})), f), m = d ?? p();
			if (r === "restore" && (!m || m.handler && m.type !== "human-in-the-loop" && m.reconnectBehavior !== "resume-pending")) continue;
			let h = JSON.stringify([l, i.id]);
			if (a?.aborted || t.threadId !== l || r === "restore" && !this.isInLatestUserTurn(t.messages, n.id) || u.has(h)) continue;
			let g = o.findIndex((e) => e.role === "tool" && e.toolCallId === i.id), ee = t.messages.find((e) => e.role === "tool" && e.toolCallId === i.id) ?? o[g];
			if (ee && this.isFrontendPlaceholderResult(ee) && (r === "restore" || m?.handler)) {
				g !== -1 && o.splice(g, 1), ee = void 0;
				let e = t.messages.findIndex((e) => e.role === "tool" && e.toolCallId === i.id);
				e !== -1 && t.messages.splice(e, 1);
			}
			if (!ee) {
				u.add(h);
				let o = r === "all" && m?.type === "human-in-the-loop" ? new AbortController() : void 0, f = this._interactionAbortControllers.get(t) ?? {
					threadId: l ?? null,
					controllers: /* @__PURE__ */ new Set()
				}, g = () => {
					if (!o) return;
					let e = this._connectionGenerations.get(t);
					s_.set(o.signal, () => this._connectionGenerations.get(t) === e && t.threadId === l), o.abort();
				};
				o && (f.controllers.add(o), this._interactionAbortControllers.set(t, f), a?.addEventListener("abort", g, { once: !0 }), a?.aborted && g());
				let ee = o?.signal ?? a, te = r === "restore" || !!o;
				try {
					if (d) await this.executeSpecificTool(d, i, n, t, s, ee, te, r === "restore") && (c = !0);
					else {
						let e = p();
						e && await this.executeWildcardTool(e, i, n, t, s, ee, te, r === "restore") && (c = !0);
					}
				} finally {
					u.delete(h), o && (a?.removeEventListener("abort", g), f.controllers.delete(o), f.controllers.size === 0 && this._interactionAbortControllers.get(t) === f && this._interactionAbortControllers.delete(t));
				}
				if (o?.signal.aborted) return e;
			}
		}
		if (c && t.threadId === l && !a?.aborted) {
			if ((this._runDepths.get(t) ?? 0) >= d_) nf.warn(`[CopilotKit] Follow-up depth limit (${d_}) reached for agent "${s}". Stopping recursive follow-up runs to prevent an infinite loop. This usually indicates a tool that keeps requesting a follow-up (e.g. the LLM repeatedly calling the same tool). Consider setting "followUp: false" on the offending tool.`);
			else {
				if (await this._internal.waitForPendingFrameworkUpdates(), r === "restore" && !d.some((e) => this.isInLatestUserTurn(t.messages, e.id))) return e;
				let a = this._internal.stateManager.markNextRunAsContinuation(t, n);
				return await this.runAgent({
					agent: t,
					...n === void 0 ? {} : { runId: n }
				}, a, i);
			}
		}
		return this._internal.suggestionEngine.reloadSuggestions(s), e;
	}
	isInLatestUserTurn(e, t) {
		for (let n = e.length - 1; n >= 0; n--) {
			let r = e[n];
			if (r?.role === "user") return !1;
			if (r?.id === t) return !0;
		}
		return !1;
	}
	toolResultInsertionIndex(e, t, n) {
		let r = e[t], i = r?.role === "assistant" ? r.toolCalls ?? [] : [], a = i.findIndex((e) => e.id === n), o = t + 1;
		for (; o < e.length;) {
			let t = e[o];
			if (t?.role !== "tool" || i.findIndex((e) => e.id === t.toolCallId) > a) break;
			o++;
		}
		return o;
	}
	isFrontendPlaceholderResult(e) {
		return e.role === "tool" && Xg(e.content);
	}
	async executeToolHandler({ tool: e, toolCall: t, agent: n, agentId: r, handlerArgs: i, toolType: a, messageId: o, signal: s = this.latestRunSignal(n), discardOnAbort: c = !1, isReplay: l = !1 }) {
		let u = "", d = "", f, p = !1, m;
		try {
			m = h_(i, t.function.name);
		} catch (e) {
			let n = e instanceof Error ? e : Error(String(e));
			f = c_(n), p = !0, await this._internal.emitError({
				error: n,
				code: X.TOOL_ARGUMENT_PARSE_FAILED,
				context: {
					agentId: r,
					toolCallId: t.id,
					toolName: t.function.name,
					rawArguments: i,
					toolType: a,
					...o ? { messageId: o } : {}
				}
			});
		}
		if (await this._internal.notifySubscribers((e) => e.onToolExecutionStart?.({
			copilotkit: this.core,
			toolCallId: t.id,
			agentId: r,
			toolName: t.function.name,
			args: m
		}), "Subscriber onToolExecutionStart error:"), !f) try {
			let r = await e.handler(m, {
				toolCall: t,
				agent: n,
				signal: s,
				...l ? { isReplay: l } : {}
			});
			({content: u, text: d} = t_(r));
		} catch (e) {
			let n = e instanceof Error ? e : Error(String(e));
			f = c_(n), l_(s, c, f) || await this._internal.emitError({
				error: n,
				code: X.TOOL_HANDLER_FAILED,
				context: {
					agentId: r,
					toolCallId: t.id,
					toolName: t.function.name,
					parsedArgs: m,
					toolType: a,
					...o ? { messageId: o } : {}
				}
			});
		}
		return f && (u = d = `Error: ${f}`), await this._internal.notifySubscribers((e) => e.onToolExecutionEnd?.({
			copilotkit: this.core,
			toolCallId: t.id,
			agentId: r,
			toolName: t.function.name,
			result: f ? "" : d,
			error: f
		}), "Subscriber onToolExecutionEnd error:"), {
			content: u,
			result: d,
			error: f,
			isArgumentError: p
		};
	}
	async executeSpecificTool(e, t, n, r, i, a, o = !1, s = !1) {
		let c = r.threadId;
		if (e?.agentId && e.agentId !== r.agentId) return !1;
		let l = {
			content: "",
			result: "",
			error: void 0,
			isArgumentError: !1
		};
		e?.handler && (l = await this.executeToolHandler({
			tool: e,
			toolCall: t,
			agent: r,
			agentId: i,
			handlerArgs: t.function.arguments,
			toolType: "specific",
			messageId: n.id,
			signal: a,
			discardOnAbort: o,
			isReplay: s
		}));
		{
			let i = r.messages.findIndex((e) => e.id === n.id);
			if (l_(a, o, l.error) || r.threadId !== c || i === -1 || s && !this.isInLatestUserTurn(r.messages, n.id) || r.messages.some((e) => e.role === "tool" && e.toolCallId === t.id && !this.isFrontendPlaceholderResult(e))) return !1;
			let u = this.toolResultInsertionIndex(r.messages, i, t.id), d = {
				id: ae(),
				role: "tool",
				toolCallId: t.id,
				content: l.content,
				...l.error ? { error: l.error } : {}
			};
			if (r.messages.splice(u, 0, d), !l.error && e?.followUp !== !1) return !0;
		}
		return !1;
	}
	async executeWildcardTool(e, t, n, r, i, a, o = !1, s = !1) {
		let c = r.threadId;
		if (e?.agentId && e.agentId !== r.agentId) return !1;
		let l = "", u = "", d;
		if (e?.handler) {
			let c;
			try {
				c = h_(t.function.arguments, t.function.name);
			} catch (e) {
				let r = e instanceof Error ? e : Error(String(e));
				d = c_(r), await this._internal.emitError({
					error: r,
					code: X.TOOL_ARGUMENT_PARSE_FAILED,
					context: {
						agentId: i,
						toolCallId: t.id,
						toolName: t.function.name,
						rawArguments: t.function.arguments,
						toolType: "wildcard",
						messageId: n.id
					}
				});
			}
			let f = {
				toolName: t.function.name,
				args: c
			};
			if (await this._internal.notifySubscribers((e) => e.onToolExecutionStart?.({
				copilotkit: this.core,
				toolCallId: t.id,
				agentId: i,
				toolName: t.function.name,
				args: f
			}), "Subscriber onToolExecutionStart error:"), !d) try {
				let n = await e.handler(f, {
					toolCall: t,
					agent: r,
					signal: a,
					...s ? { isReplay: s } : {}
				});
				({content: l, text: u} = t_(n));
			} catch (e) {
				let r = e instanceof Error ? e : Error(String(e));
				d = c_(r), l_(a, o, d) || await this._internal.emitError({
					error: r,
					code: X.TOOL_HANDLER_FAILED,
					context: {
						agentId: i,
						toolCallId: t.id,
						toolName: t.function.name,
						parsedArgs: f,
						toolType: "wildcard",
						messageId: n.id
					}
				});
			}
			d && (l = u = `Error: ${d}`), await this._internal.notifySubscribers((e) => e.onToolExecutionEnd?.({
				copilotkit: this.core,
				toolCallId: t.id,
				agentId: i,
				toolName: t.function.name,
				result: d ? "" : u,
				error: d
			}), "Subscriber onToolExecutionEnd error:");
		}
		{
			let i = r.messages.findIndex((e) => e.id === n.id);
			if (l_(a, o, d) || r.threadId !== c || i === -1 || s && !this.isInLatestUserTurn(r.messages, n.id) || r.messages.some((e) => e.role === "tool" && e.toolCallId === t.id && !this.isFrontendPlaceholderResult(e))) return !1;
			let u = this.toolResultInsertionIndex(r.messages, i, t.id), f = {
				id: ae(),
				role: "tool",
				toolCallId: t.id,
				content: l,
				...d ? { error: d } : {}
			};
			if (r.messages.splice(u, 0, f), !d && e?.followUp !== !1) return !0;
		}
		return !1;
	}
	async runTool(e) {
		let { name: t, agentId: n, parameters: r = {}, followUp: i = !1 } = e, a = this.getTool({
			toolName: t,
			agentId: n
		});
		if (!a) {
			let e = /* @__PURE__ */ Error(`Tool not found: ${t}`);
			throw await this._internal.emitError({
				error: e,
				code: X.TOOL_NOT_FOUND,
				context: {
					toolName: t,
					agentId: n
				}
			}), e;
		}
		let o = n ?? "default", s = this._internal.getAgent(o);
		if (!s) {
			let e = /* @__PURE__ */ Error(`Agent not found: ${o}`);
			throw await this._internal.emitError({
				error: e,
				code: X.AGENT_NOT_FOUND,
				context: { agentId: o }
			}), e;
		}
		let c = ae(), l = {
			id: c,
			type: "function",
			function: {
				name: t,
				arguments: JSON.stringify(r)
			}
		}, u = {
			id: ae(),
			role: "assistant",
			content: "",
			toolCalls: [l]
		};
		s.messages.push(u);
		let d = {
			content: "",
			result: "",
			error: void 0,
			isArgumentError: !1
		};
		a.handler && (d = await this.executeToolHandler({
			tool: a,
			toolCall: l,
			agent: s,
			agentId: o,
			handlerArgs: r,
			toolType: "runTool"
		}));
		let f = {
			id: ae(),
			role: "tool",
			toolCallId: c,
			content: d.content,
			...d.error ? { error: d.error } : {}
		}, p = s.messages.findIndex((e) => e.id === u.id);
		if (p === -1 ? s.messages.push(f) : s.messages.splice(p + 1, 0, f), !d.error && i !== !1) {
			if (typeof i == "string" && i !== "generate") {
				let e = {
					id: ae(),
					role: "user",
					content: i
				};
				s.messages.push(e);
			}
			await this._internal.waitForPendingFrameworkUpdates(), await this.runAgent({ agent: s });
		}
		return {
			toolCallId: c,
			result: d.result,
			error: d.error
		};
	}
	capabilityKey(e, t) {
		return `${t ?? ""}\u0000${e}`;
	}
	setToolEnabled(e, t, n) {
		let r = this.capabilityKey(e, n);
		t ? this._disabledToolKeys.delete(r) : this._disabledToolKeys.add(r), this.syncWebMCP();
	}
	isToolEnabled(e, t) {
		return !this._disabledToolKeys.has(this.capabilityKey(e, t));
	}
	buildFrontendTools(e) {
		return this.tools.filter((t) => t.name !== f_ && t.available !== !1 && t.available !== "disabled" && (!t.agentId || t.agentId === e) && this.isToolEnabled(t.name, t.agentId)).map((e) => ({
			name: e.name,
			description: e.description ?? "",
			parameters: r_(e)
		}));
	}
	syncWebMCP() {
		let e = /* @__PURE__ */ new Map(), t = /* @__PURE__ */ new Set();
		for (let n of this.tools) n.webmcp && n.name !== f_ && n.available !== !1 && n.available !== "disabled" && this.isToolEnabled(n.name, n.agentId) && (e.has(n.name) ? t.has(n.name) || (t.add(n.name), nf.warn(`[CopilotKit] Multiple WebMCP tools share the name '${n.name}'. Only the first registration is exposed to browser agents.`)) : e.set(n.name, n));
		this._webmcpRegistry.sync(e);
	}
	createAgentErrorSubscriber(e, t) {
		let n = async (t, n, r = {}) => {
			let i = { ...r };
			e.agentId && (i.agentId = e.agentId), await this._internal.emitError({
				error: t,
				code: n,
				context: i
			});
		};
		return {
			onRunFailed: async ({ error: e }) => {
				await n(e, e instanceof Qh ? X.AGENT_THREAD_LOCKED : X.AGENT_RUN_FAILED_EVENT, { source: "onRunFailed" });
			},
			onRunErrorEvent: async ({ event: r }) => {
				if ((t?.aborted ?? !1) || r?.code === "abort") return;
				if (r?.code === "THREAD_ALREADY_RUNNING") {
					await n(new Qh(e.threadId), X.AGENT_THREAD_LOCKED, {
						source: "onRunErrorEvent",
						event: r
					});
					return;
				}
				let i = r?.rawEvent instanceof Error ? r.rawEvent : r?.rawEvent?.error instanceof Error ? r.rawEvent.error : void 0, a = typeof r?.rawEvent?.error == "string" ? r.rawEvent.error : r?.message ?? "Agent run error", o = i ?? Error(a);
				r?.code && !o.code && (o.code = r.code), await n(o, X.AGENT_RUN_ERROR_EVENT, {
					source: "onRunErrorEvent",
					event: r,
					runtimeErrorCode: r?.code
				});
			}
		};
	}
};
function m_(e, t) {
	if (typeof e == "object" && e && !Array.isArray(e)) return e;
	throw Error(`Tool arguments for ${t} parsed to non-object (${typeof e})`);
}
function h_(e, t) {
	return e === "" || e == null ? (nf.debug(`[parseToolArguments] Tool "${t}" received empty/null/undefined arguments — defaulting to {}`), {}) : m_(typeof e == "string" ? JSON.parse(e) : e, t);
}
var g_ = (e) => e.resume !== void 0 || Object.prototype.hasOwnProperty.call(e.forwardedProps?.command ?? {}, "resume"), __ = class {
	stateByRun = /* @__PURE__ */ new Map();
	messageToRun = /* @__PURE__ */ new Map();
	rawEventByMessage = /* @__PURE__ */ new Map();
	activeRun = /* @__PURE__ */ new Map();
	agentSubscriptions = /* @__PURE__ */ new Map();
	pendingContinuations = /* @__PURE__ */ new WeakMap();
	interruptedRuns = /* @__PURE__ */ new WeakMap();
	getContinuationRunId(e, t) {
		let n = this.interruptedRuns.get(e)?.get(t.threadId);
		if (!n) return;
		if (n.interruptIds === null) return t.resume === void 0 && g_(t) ? n.runId : void 0;
		let r = new Set(t.resume?.map((e) => e.interruptId));
		return r.size > 0 && r.size === t.resume?.length && r.size === n.interruptIds.length && n.interruptIds.every((e) => r.has(e)) ? n.runId : void 0;
	}
	constructor(e) {
		this.core = e;
	}
	initialize() {}
	markNextRunAsContinuation(e, t) {
		let n = this.pendingContinuations.get(e);
		n || (n = /* @__PURE__ */ new Set(), this.pendingContinuations.set(e, n));
		let r = {
			active: !0,
			expectedRunId: t,
			bind: (e) => {
				r.active && (r.expectedInput = e);
			},
			cancel: () => {
				r.active && (r.active = !1, n.delete(r), n.size === 0 && this.pendingContinuations.delete(e));
			}
		};
		return n.add(r), r;
	}
	subscribeToAgent(e) {
		if (!e.agentId) return;
		let t = e.agentId, n = this.agentSubscriptions.get(t);
		if (n) {
			if (n.agent === e) return;
			n.unsubscribe(), this.agentSubscriptions.delete(t);
		}
		let r = !1, i, a = !1, o = !1, s = /* @__PURE__ */ new WeakMap(), c = (e, t) => {
			let n = s.get(t);
			if (!n) return;
			let r = [...e], i = !1;
			for (let e of n.values()) {
				let t = r.findIndex((t) => t.role === "assistant" && t.toolCalls?.some((t) => t.id === e.toolCallId));
				if (t < 0) continue;
				let n = r.reduce((t, n, r) => (n.role === "tool" && n.toolCallId === e.toolCallId && t.push(r), t), []), a = n.find((e) => !Xg(r[e]?.content));
				if (a !== void 0) {
					for (let e of n.filter((e) => e !== a).sort((e, t) => t - e)) r.splice(e, 1), i = !0;
					continue;
				}
				let o = n.find((e) => Xg(r[e]?.content));
				if (o !== void 0) {
					if (Xg(e.content)) {
						for (let e of n.slice(1).sort((e, t) => t - e)) r.splice(e, 1), i = !0;
						continue;
					}
					r[o] = {
						...r[o],
						id: e.messageId,
						content: e.content
					}, i = !0;
					for (let e of n.filter((e) => e !== o && Xg(r[e]?.content)).sort((e, t) => t - e)) r.splice(e, 1);
					continue;
				}
				let s = {
					id: e.messageId,
					role: "tool",
					toolCallId: e.toolCallId,
					content: e.content
				}, c = t + 1;
				for (; r[c]?.role === "tool";) c++;
				r.splice(c, 0, s), i = !0;
			}
			return i ? { messages: r } : void 0;
		}, l = (e) => {
			s.delete(e);
		}, u = (e) => ({
			...e,
			runId: i ?? e.runId
		}), { unsubscribe: d } = e.subscribe({
			onRunStartedEvent: ({ event: t, input: n, state: s }) => {
				if (r) return;
				let c = [...this.pendingContinuations.get(e) ?? []].find((e) => e.expectedInput === n);
				c?.cancel();
				let l = t.input ?? {
					...n,
					threadId: t.threadId
				}, d = this.getContinuationRunId(e, l);
				this.interruptedRuns.get(e)?.delete(l.threadId), a = !1, i = c ? c.expectedRunId ?? t.runId ?? n.runId : d || (o && n.runId === i && !g_(n) && (t.runId == null || t.runId === i) ? Fl() : t.runId || n.runId), o = !1, this.handleRunStarted(e, u(n), s);
			},
			onRunFinishedEvent: ({ event: t, input: n, state: i, messages: s }) => {
				if (r) return;
				o = !0;
				let d = u(n), f = this.interruptedRuns.get(e);
				t.outcome?.type === "interrupt" || a ? (f || (f = /* @__PURE__ */ new Map(), this.interruptedRuns.set(e, f)), f.set(t.threadId, {
					runId: d.runId,
					interruptIds: t.outcome?.type === "interrupt" ? t.outcome.interrupts.map((e) => e.id) : null
				})) : f?.delete(t.threadId);
				let p = c(s, n);
				return l(n), this.handleRunFinished(e, d, i), p;
			},
			onCustomEvent: ({ event: e }) => {
				!r && e.name === "on_interrupt" && (a = !0);
			},
			onRunErrorEvent: ({ input: t, state: n, messages: i }) => {
				if (r) return;
				o = !0;
				let a = u(t), s = c(i, t);
				return this.handleRunFinished(e, a, n), s;
			},
			onRunFailed: ({ input: e, messages: t }) => {
				if (!r) return c(t, e);
			},
			onRunFinalized: ({ input: e }) => {
				r || l(e);
			},
			onToolCallResultEvent: ({ event: e, input: t }) => {
				if (r) return;
				let n = s.get(t);
				n || (n = /* @__PURE__ */ new Map(), s.set(t, n)), n.set(e.toolCallId, e);
			},
			onStateSnapshotEvent: ({ event: t, input: n, state: i }) => {
				r || this.handleStateSnapshot(e, t, u(n), i);
			},
			onStateDeltaEvent: ({ event: t, input: n, state: i }) => {
				r || this.handleStateDelta(e, t, u(n), i);
			},
			onTextMessageStartEvent: ({ event: t, input: n }) => {
				r || this.handleTextMessageStart(e, t, u(n));
			},
			onMessagesSnapshotEvent: ({ event: t, input: n, messages: i }) => {
				r || (this.handleMessagesSnapshot(e, t, u(n), i), this.pruneRawEvents(e.agentId, n.threadId, t.messages, u(n)));
			},
			onNewMessage: ({ message: t, input: n }) => {
				r || this.handleNewMessage(e, t, n ? u(n) : void 0);
			},
			onMessagesChanged: ({ messages: t, input: n }) => {
				r || n || this.pruneRawEvents(e.agentId, e.threadId, t);
			}
		});
		this.agentSubscriptions.set(t, {
			agent: e,
			unsubscribe: () => {
				r = !0, this.pendingContinuations.delete(e), this.interruptedRuns.delete(e), d();
			}
		});
	}
	unsubscribeFromAgent(e) {
		let t = this.agentSubscriptions.get(e);
		t && (t.unsubscribe(), this.agentSubscriptions.delete(e)), this.rawEventByMessage.delete(e);
	}
	getStateByRun(e, t, n) {
		let r = this.stateByRun.get(e)?.get(t)?.get(n);
		if (r) return JSON.parse(JSON.stringify(r));
	}
	getRunIdForMessage(e, t, n) {
		return this.messageToRun.get(e)?.get(t)?.get(n);
	}
	getRawEventForMessage(e, t, n) {
		let r = this.rawEventByMessage.get(e)?.get(t)?.get(n);
		return r === void 0 ? void 0 : V(r);
	}
	getStatesForThread(e, t) {
		return this.stateByRun.get(e)?.get(t) ?? /* @__PURE__ */ new Map();
	}
	getRunIdsForThread(e, t) {
		let n = this.stateByRun.get(e)?.get(t);
		return n ? Array.from(n.keys()) : [];
	}
	handleRunStarted(e, t, n) {
		if (!e.agentId) return;
		let { threadId: r, runId: i } = t;
		this.activeRun.set(`${e.agentId}:${r}`, i), n && Object.keys(n).length > 0 && this.saveState(e.agentId, r, i, n);
	}
	handleRunFinished(e, t, n) {
		if (!e.agentId) return;
		let { threadId: r, runId: i } = t;
		this.activeRun.delete(`${e.agentId}:${r}`), n && Object.keys(n).length > 0 && this.saveState(e.agentId, r, i, n);
	}
	handleStateSnapshot(e, t, n, r) {
		if (!e.agentId) return;
		let { threadId: i, runId: a } = n, o = {
			...r,
			...t.snapshot
		};
		this.saveState(e.agentId, i, a, o);
	}
	handleStateDelta(e, t, n, r) {
		if (!e.agentId) return;
		let { threadId: i, runId: a } = n;
		this.saveState(e.agentId, i, a, r);
	}
	handleTextMessageStart(e, t, n) {
		if (!e.agentId) return;
		let { threadId: r } = n;
		if (t.rawEvent === void 0) {
			let n = this.rawEventByMessage.get(e.agentId)?.get(r);
			n?.delete(t.messageId), n?.size === 0 && this.rawEventByMessage.get(e.agentId)?.delete(r), this.rawEventByMessage.get(e.agentId)?.size === 0 && this.rawEventByMessage.delete(e.agentId);
			return;
		}
		this.rawEventByMessage.has(e.agentId) || this.rawEventByMessage.set(e.agentId, /* @__PURE__ */ new Map());
		let i = this.rawEventByMessage.get(e.agentId);
		i.has(r) || i.set(r, /* @__PURE__ */ new Map()), i.get(r).set(t.messageId, t.rawEvent);
	}
	handleMessagesSnapshot(e, t, n, r) {
		if (!e.agentId) return;
		let { threadId: i, runId: a } = n;
		for (let n of t.messages) this.getRunIdForMessage(e.agentId, i, n.id) === void 0 && this.associateMessageWithRun(e.agentId, i, n.id, a);
	}
	handleNewMessage(e, t, n) {
		if (!e.agentId) return;
		if (!n) {
			let n = e.threadId ?? "", r = this.activeRun.get(`${e.agentId}:${n}`);
			r && this.associateMessageWithRun(e.agentId, n, t.id, r);
			return;
		}
		let { threadId: r, runId: i } = n;
		this.associateMessageWithRun(e.agentId, r, t.id, i);
	}
	saveState(e, t, n, r) {
		this.stateByRun.has(e) || this.stateByRun.set(e, /* @__PURE__ */ new Map());
		let i = this.stateByRun.get(e);
		i.has(t) || i.set(t, /* @__PURE__ */ new Map()), i.get(t).set(n, JSON.parse(JSON.stringify(r)));
	}
	associateMessageWithRun(e, t, n, r) {
		this.messageToRun.has(e) || this.messageToRun.set(e, /* @__PURE__ */ new Map());
		let i = this.messageToRun.get(e);
		i.has(t) || i.set(t, /* @__PURE__ */ new Map()), i.get(t).set(n, r);
	}
	pruneRawEvents(e, t, n, r) {
		let i = r?.threadId ?? t;
		if (!i) return;
		let a = this.rawEventByMessage.get(e)?.get(i);
		if (!a) return;
		let o = new Set(n.map((e) => e.id));
		for (let e of a.keys()) o.has(e) || a.delete(e);
		a.size === 0 && this.rawEventByMessage.get(e)?.delete(i), this.rawEventByMessage.get(e)?.size === 0 && this.rawEventByMessage.delete(e);
	}
	clearAgentState(e) {
		let t = this.agentSubscriptions.get(e)?.agent;
		t && this.interruptedRuns.delete(t), this.stateByRun.delete(e), this.messageToRun.delete(e), this.rawEventByMessage.delete(e);
	}
	clearThreadState(e, t) {
		let n = this.agentSubscriptions.get(e)?.agent;
		n && this.interruptedRuns.get(n)?.delete(t), this.stateByRun.get(e)?.delete(t), this.messageToRun.get(e)?.delete(t), this.rawEventByMessage.get(e)?.delete(t);
	}
}, v_ = class {
	_stores = {};
	_snapshot = null;
	constructor(e) {
		this.core = e;
	}
	register(e, t) {
		if (e in this._stores) {
			let t = this._stores[e];
			delete this._stores[e], this._snapshot = null, this.notifyUnregistered(e, t).catch((e) => {
				console.error("ThreadStoreRegistry notifyUnregistered failed:", e);
			});
		}
		this._stores[e] = t, this._snapshot = null, this.notifyRegistered(e, t).catch((e) => {
			console.error("ThreadStoreRegistry notifyRegistered failed:", e);
		});
	}
	unregister(e) {
		if (!(e in this._stores)) return;
		let t = this._stores[e];
		delete this._stores[e], this._snapshot = null, this.notifyUnregistered(e, t).catch((e) => {
			console.error("ThreadStoreRegistry notifyUnregistered failed:", e);
		});
	}
	get(e) {
		return this._stores[e];
	}
	getAll() {
		return this._snapshot === null && (this._snapshot = Object.freeze({ ...this._stores })), this._snapshot;
	}
	async notifyRegistered(e, t) {
		await this.core.notifySubscribers((n) => n.onThreadStoreRegistered?.({
			copilotkit: this.core,
			agentId: e,
			store: t
		}), "Subscriber onThreadStoreRegistered error:");
	}
	async notifyUnregistered(e, t) {
		await this.core.notifySubscribers((n) => n.onThreadStoreUnregistered?.({
			copilotkit: this.core,
			agentId: e,
			prevStore: t
		}), "Subscriber onThreadStoreUnregistered error:");
	}
}, y_ = 1e4, b_ = 2e3, x_ = 50, S_ = 65536, C_ = 16384, w_ = (e) => new TextEncoder().encode(JSON.stringify(e)).byteLength, T_ = Jd(1e3, 1e4), E_ = {
	RUNTIME_REQUIRED: "Set runtimeUrl: capture connects through the CopilotKit runtime.",
	INTELLIGENCE_RUNTIME_REQUIRED: "Configure the CopilotRuntime with `intelligence` to accept capture.",
	CONNECTION_FAILED: "Check that the CopilotRuntime is configured with `intelligence` and valid Intelligence credentials, and check the runtime logs.",
	IDENTITY_REQUIRED: "The runtime could not identify the user. Configure `identifyUser` on the CopilotRuntime and send the app's session with runtime requests.",
	TRAJECTORIES_NOT_ENABLED: "Trajectories are not enabled for this Intelligence project.",
	TRAJECTORIES_UNAVAILABLE: "This Intelligence deployment does not serve Trajectory capture.",
	TRAJECTORIES_ENTITLEMENT_UNAVAILABLE: "Intelligence could not confirm that Trajectories are enabled for this project; try again later.",
	MARKETPLACE_LICENSE_REQUIRED: "Trajectory capture requires a CopilotKit license for this project."
};
function D_(e) {
	return typeof e == "object" && !!e;
}
function O_(e) {
	return typeof e == "number" && Number.isSafeInteger(e) && e >= 0;
}
function k_(e, t) {
	return D_(e) && O_(e.accepted) && O_(e.rejected) && e.accepted + e.rejected === t && (e.highestSeq === null || O_(e.highestSeq)) && (e.accepted === 0 || e.highestSeq !== null);
}
function A_(e) {
	return D_(e) && typeof e.joinToken == "string" && e.joinToken.length > 0 && D_(e.realtime) && typeof e.realtime.clientUrl == "string" && e.realtime.clientUrl.length > 0 && typeof e.realtime.topic == "string" && e.realtime.topic.length > 0;
}
var j_ = {
	trajectories_unavailable: "TRAJECTORIES_UNAVAILABLE",
	trajectories_not_enabled: "TRAJECTORIES_NOT_ENABLED",
	entitlement_unavailable: "TRAJECTORIES_ENTITLEMENT_UNAVAILABLE",
	marketplace_license_required: "MARKETPLACE_LICENSE_REQUIRED"
};
function M_(e) {
	let t = D_(e) ? e.reason : void 0;
	return (typeof t == "string" && Object.hasOwn(j_, t) ? j_[t] : void 0) ?? N_(e, "JOIN_FAILED");
}
function N_(e, t) {
	return D_(e) && typeof e.code == "string" && /^[A-Z][A-Z0-9_]{0,63}$/.test(e.code) ? e.code : t;
}
var P_ = class {
	session;
	warned = /* @__PURE__ */ new Set();
	nextSeq = Math.floor(Date.now()) * 1e3;
	constructor(e, t) {
		this.core = e, this.onChange = t;
	}
	get trajectoryId() {
		return this.session?.ready ? this.session.trajectoryId : null;
	}
	start(e, t) {
		if (this.session && (e === void 0 || e === this.session.trajectoryId)) return this.session.promise;
		this.stop();
		let n = e ?? crypto.randomUUID(), r, i = new Promise((e) => {
			r = e;
		}), a = {
			trajectoryId: n,
			config: t,
			promise: i,
			resolve: r,
			retries: 0,
			queue: [],
			dropped: 0,
			ready: !1,
			started: !1,
			offline: typeof navigator < "u" && navigator.onLine === !1,
			onOffline: () => {
				this.session === a && (a.offline = !0, a.connection && this.fail(a, a.connection, "CONNECTION_LOST"), clearTimeout(a.retry), a.retry = void 0);
			},
			onOnline: () => {
				this.session === a && (a.offline = !1, a.connection || (clearTimeout(a.retry), a.retry = void 0, this.connect(a)));
			},
			linkedThreads: /* @__PURE__ */ new Set(),
			agentWatches: /* @__PURE__ */ new Map()
		};
		return this.session = a, a.runWatch = this.core.subscribe({ onAgentRunStarted: ({ agent: e }) => this.watchAgent(a, e) }), typeof window < "u" && typeof window.addEventListener == "function" && (window.addEventListener("offline", a.onOffline), window.addEventListener("online", a.onOnline)), a.offline ? (this.report(a, "CONNECTION_LOST"), this.end(a, {
			status: "error",
			code: "CONNECTION_LOST"
		})) : this.connect(a), i;
	}
	stop() {
		let e = this.session;
		if (!e) return;
		let t = e.collector;
		e.collector = void 0, t?.stop(), e.ready && e.connection && this.flush(e, e.connection), this.end(e, {
			status: "error",
			code: "CANCELLED"
		});
	}
	emit(e, t) {
		let n = this.session;
		n?.ready ? n.collector?.emit(e, t) : n?.started && this.addDropped(n, 1, !1);
	}
	watchAgent(e, t) {
		this.session !== e || e.agentWatches.has(t) || e.agentWatches.set(t, t.subscribe({ onRunStartedEvent: ({ event: t }) => this.linkThread(e, t) }));
	}
	linkThread(e, { threadId: t }) {
		let n = e.connection;
		if (!e.ready || !n || !t || e.linkedThreads.has(t)) return;
		e.linkedThreads.add(t);
		let r = {
			type: "CUSTOM",
			name: "thread.linked",
			timestamp: Date.now(),
			value: { threadId: t }
		};
		try {
			let { beforeSend: t } = e.config, i = t === void 0 ? r : t(r);
			i !== null && this.send(e, n, i);
		} catch {
			this.report(e, "INVALID_EVENT");
		}
	}
	report(e, t) {
		try {
			e.config.onError?.({
				code: t,
				message: `Trajectory capture: ${t}.`
			});
		} catch {}
	}
	current(e, t) {
		return this.session === e && e.connection === t;
	}
	end(e, t) {
		if (this.session === e) {
			this.session = void 0, clearTimeout(e.retry), e.runWatch?.unsubscribe();
			for (let t of e.agentWatches.values()) t.unsubscribe();
			if (e.agentWatches.clear(), e.collector?.stop(), e.ready = !1, e.queue.length > 0 && this.report(e, "EVENTS_DROPPED"), this.discardQueue(e), e.connection) {
				for (let t of e.connection.pending) t.finish("PERSISTENCE_UNKNOWN"), this.report(e, "PERSISTENCE_UNKNOWN");
				this.cleanup(e, e.connection);
			}
			typeof window < "u" && typeof window.removeEventListener == "function" && (window.removeEventListener("offline", e.onOffline), window.removeEventListener("online", e.onOnline)), t.status === "error" && t.code !== "CANCELLED" && this.warnEnded(e, t.code), e.resolve(t), this.onChange();
		}
	}
	warnEnded(e, t) {
		if (e.config.onError !== void 0) return;
		let n = e.started ? `Trajectory capture stopped (${t}).` : `Trajectory capture did not start (${t}).`;
		if (this.warned.has(n)) return;
		this.warned.add(n);
		let r = E_[t];
		console.warn(`[CopilotKit] ${n}${r === void 0 ? "" : ` ${r}`} Set learning.onError to handle capture errors in the app.`);
	}
	cleanup(e, t) {
		e.connection = void 0, clearTimeout(t.timer), t.abort.abort();
		for (let e of t.pending) clearTimeout(e.timer);
		t.pending.clear();
		let { socket: n, channel: r } = t;
		try {
			if (r) {
				for (let [e, n] of t.channelRefs) r.off(e, n);
				r.leave();
			}
		} finally {
			n && (n.off(t.socketRefs), n.connect = () => void 0, n.disconnect());
		}
	}
	fail(e, t, n, r = !0) {
		if (this.current(e, t)) {
			e.ready && e.started && (e.promise = new Promise((t) => {
				e.resolve = t;
			})), e.ready = !1, e.collector?.stop(), e.collector = void 0, this.discardQueue(e), e.linkedThreads.clear();
			for (let e of t.pending) e.finish("PERSISTENCE_UNKNOWN");
			this.current(e, t) && (this.cleanup(e, t), this.onChange(), this.report(e, n), this.session === e && (!e.started || !r ? this.end(e, {
				status: "error",
				code: n
			}) : e.offline || this.session !== e || (e.retry = setTimeout(() => {
				e.retry = void 0, this.session === e && !e.offline && this.connect(e);
			}, T_(++e.retries)))));
		}
	}
	async connect(e) {
		if (this.session !== e || e.offline || e.connection) return;
		let t = {
			abort: new AbortController(),
			socketRefs: [],
			channelRefs: [],
			pending: /* @__PURE__ */ new Set()
		};
		e.connection = t, t.timer = setTimeout(() => this.fail(e, t, "CONNECTION_TIMEOUT"), y_);
		try {
			let n = this.core.runtimeUrl;
			if (!n) {
				this.fail(e, t, "RUNTIME_REQUIRED", !1);
				return;
			}
			let r = this.core.runtimeTransport;
			if (r === "auto" && (r = await this.detectedTransport(t.abort.signal), !this.current(e, t))) return;
			let i = r === "rest", a = this.core.resolveHeaders(), o = Tg(a) ? await Mg(a, t.abort.signal) : a;
			if (!this.current(e, t)) return;
			let s = await fetch(i ? `${n}/trajectory/${encodeURIComponent(e.trajectoryId)}/connect` : this.core.ɵruntimeEndpointUrl ?? n, {
				method: "POST",
				redirect: "error",
				signal: t.abort.signal,
				headers: {
					...o,
					"Content-Type": "application/json"
				},
				credentials: this.core.credentials,
				body: JSON.stringify(i ? {} : {
					method: "trajectory/connect",
					params: { trajectoryId: e.trajectoryId },
					body: {}
				})
			});
			if (!this.current(e, t)) return;
			let c = await s.json().catch(() => void 0);
			if (!this.current(e, t)) return;
			if (!s.ok) {
				this.fail(e, t, N_(c, "CONNECTION_FAILED"), s.status >= 500 || s.status === 408 || s.status === 429);
				return;
			}
			if (!A_(c)) {
				this.fail(e, t, "INVALID_GRANT", !1);
				return;
			}
			let l = new Gf(c.realtime.clientUrl, {
				params: { join_token: c.joinToken },
				timeout: y_
			});
			t.socket = l;
			let u = () => this.fail(e, t, "CONNECTION_LOST");
			t.socketRefs.push(l.onError(u), l.onClose(u));
			let d = l.channel(c.realtime.topic, {});
			if (t.channel = d, t.channelRefs.push(["phx_error", d.onError(u)], ["phx_close", d.onClose(u)]), l.connect(), !this.current(e, t)) return;
			d.join(y_).receive("ok", () => {
				if (this.current(e, t)) try {
					if (clearTimeout(t.timer), e.ready = !0, e.retries = 0, e.collector = Ah({
						...e.config,
						ignoreUrls: [
							...e.config.ignoreUrls ?? [],
							...this.core.runtimeUrl ? [this.core.runtimeUrl] : [],
							...this.core.ɵruntimeEndpointUrl ? [this.core.ɵruntimeEndpointUrl] : [],
							"https://telemetry.copilotkit.ai/",
							"https://cdn.copilotkit.ai/"
						],
						onError: (n) => {
							n.code === "CAPTURE_FAILED" ? this.fail(e, t, n.code, !1) : ((n.code === "INVALID_EVENT" || n.code === "EVENT_TOO_LARGE") && this.addDropped(e, 1), e.config.onError?.(n));
						},
						send: (n) => this.send(e, t, n)
					}), e.collector.start(), !this.current(e, t)) return;
					e.dropped > 0 && this.scheduleFlush(e, t), e.started = !0, e.resolve({
						status: "started",
						trajectoryId: e.trajectoryId
					}), this.onChange();
				} catch {
					this.fail(e, t, "CAPTURE_FAILED", !1);
				}
			}).receive("error", (n) => this.fail(e, t, M_(n))).receive("timeout", () => this.fail(e, t, "CONNECTION_TIMEOUT"));
		} catch {
			this.fail(e, t, "CONNECTION_FAILED");
		}
	}
	detectedTransport(e) {
		return new Promise((t) => {
			let n = () => {
				r.unsubscribe(), e.removeEventListener("abort", n), t(this.core.runtimeTransport);
			}, r = this.core.subscribe({ onRuntimeConnectionStatusChanged: () => {
				this.core.runtimeTransport !== "auto" && n();
			} });
			e.addEventListener("abort", n, { once: !0 });
		});
	}
	addDropped(e, t, n = !0) {
		e.dropped = Math.min(2 ** 53 - 1, e.dropped + t), n && t > 0 && e.ready && e.connection && this.scheduleFlush(e, e.connection);
	}
	scheduleFlush(e, t) {
		e.flushTimer === void 0 && this.current(e, t) && (e.flushTimer = setTimeout(() => {
			e.flushTimer = void 0, this.flush(e, t);
		}, b_));
	}
	discardQueue(e) {
		clearTimeout(e.flushTimer), e.flushTimer = void 0, this.addDropped(e, e.queue.length, !1), e.queue = [];
	}
	connected(e) {
		return e.socket?.isConnected() === !0 && e.channel?.state === "joined";
	}
	send(e, t, n) {
		if (!this.current(e, t)) return;
		if (!e.ready) {
			this.addDropped(e, 1, !1);
			return;
		}
		if (!this.connected(t)) {
			this.addDropped(e, 1), this.fail(e, t, "CONNECTION_LOST");
			return;
		}
		if (!Number.isSafeInteger(this.nextSeq)) {
			this.addDropped(e, 1), this.report(e, "SEQUENCE_EXHAUSTED");
			return;
		}
		let r = n.value, i = D_(r) && !Array.isArray(r) && !Object.hasOwn(r, "seq") ? r : { data: r }, a = {
			...n,
			value: {
				...i,
				seq: this.nextSeq++
			}
		};
		if (w_(a) > C_) {
			this.addDropped(e, 1), this.report(e, "EVENT_TOO_LARGE");
			return;
		}
		let o = () => e.queue.length < x_ && w_({
			events: [...e.queue, a],
			dropped: 2 ** 53 - 1
		}) <= S_;
		o() || this.flush(e, t), this.current(e, t) && e.ready && (o() ? (e.queue.push(a), e.queue.length === x_ ? this.flush(e, t) : this.scheduleFlush(e, t)) : (this.addDropped(e, 1), this.report(e, "EVENTS_DROPPED")));
	}
	flush(e, t) {
		if (!this.current(e, t) || !e.ready || e.queue.length === 0 && e.dropped === 0) return;
		if (!this.connected(t)) {
			this.fail(e, t, "CONNECTION_LOST");
			return;
		}
		if (t.pending.size > 0) return;
		clearTimeout(e.flushTimer), e.flushTimer = void 0;
		let n = {
			events: e.queue,
			dropped: e.dropped
		};
		e.queue = [], e.dropped = 0;
		let r = !1, i = {
			timer: setTimeout(() => i.finish("PERSISTENCE_UNKNOWN"), y_),
			finish: (a, o = !1, s = !0) => {
				r || (r = !0, clearTimeout(i.timer), t.pending.delete(i), o && this.addDropped(e, n.events.length + n.dropped, !1), a && this.current(e, t) && this.report(e, a), s && this.current(e, t) && e.ready && (e.queue.length > 0 || !o && e.dropped > 0) && this.flush(e, t));
			}
		};
		t.pending.add(i);
		try {
			t.channel.push("events", n, y_).receive("ok", (e) => {
				i.finish(k_(e, n.events.length) ? e.rejected > 0 ? "EVENTS_REJECTED" : void 0 : "PERSISTENCE_UNKNOWN");
			}).receive("error", (n) => {
				if (!this.current(e, t)) return;
				let r = D_(n) ? n.reason : void 0;
				if (r === "unauthorized" || r === "trajectory_mismatch") {
					i.finish(void 0, !0, !1), this.fail(e, t, r.toUpperCase(), !1);
					return;
				}
				let a = typeof r == "string" && [
					"invalid_batch",
					"batch_too_large",
					"batch_too_many_events",
					"trajectory_over_share",
					"trajectory_outbox_full",
					"unsupported_event"
				].includes(r);
				i.finish(a ? r.toUpperCase() : "PERSISTENCE_UNKNOWN", a);
			}).receive("timeout", () => i.finish("PERSISTENCE_UNKNOWN"));
		} catch {
			i.finish("PERSISTENCE_UNKNOWN");
		}
	}
}, F_ = ["https://telemetry.copilotkit.ai/", "https://cdn.copilotkit.ai/"], I_ = class {
	collector = null;
	agents = /* @__PURE__ */ new Map();
	openThreads = /* @__PURE__ */ new Set();
	toolCalls = /* @__PURE__ */ new Map();
	executingTools = /* @__PURE__ */ new Map();
	lastRunIds = /* @__PURE__ */ new WeakMap();
	lastLinkedThreadId = null;
	coreSubscription = null;
	seq = 0;
	activeConfig;
	connection;
	constructor(e, t, n = () => {}) {
		this.core = e, this.config = t, this.connection = new P_(e, n), this.setConfig(t);
	}
	setConfig(e) {
		this.config = e, e === void 0 && this.stop();
	}
	get isConfigured() {
		return this.config !== void 0;
	}
	get capturesAgentText() {
		let e = this.activeConfig ?? this.config;
		if (e === void 0) return !1;
		let t = e.capture;
		return !(typeof t == "object" && t && t.agentText === !1);
	}
	get isLegacyCaptureActive() {
		return this.collector !== null && this.collector.trajectoryId !== null;
	}
	startTracking() {
		if (this.coreSubscription === null && this.isLegacyCaptureActive) {
			this.coreSubscription = this.core.subscribe({
				onAgentsChanged: ({ agents: e }) => {
					for (let t of Object.values(e)) this.track(t);
				},
				onAgentRunStarted: ({ agent: e }) => this.track(e),
				onToolExecutionStart: ({ toolCallId: e, agentId: t, toolName: n }) => {
					this.isLegacyCaptureActive && (this.executingTools.set(e, Date.now()), this.emitToolCall("executing", e, t, n, {}));
				},
				onToolExecutionEnd: ({ toolCallId: e, agentId: t, toolName: n, error: r }) => {
					if (!this.isLegacyCaptureActive) return;
					let i = this.executingTools.get(e);
					this.executingTools.delete(e), this.emitToolCall("completed", e, t, n, {
						durationMs: i === void 0 ? void 0 : Date.now() - i,
						outcome: r === void 0 ? "ok" : "error"
					}), this.toolCalls.delete(e);
				}
			});
			for (let e of Object.values(this.core.agents)) this.track(e);
		}
	}
	get trajectoryId() {
		return this.connection.trajectoryId ?? this.collector?.trajectoryId ?? null;
	}
	start(e = {}) {
		let t = this.config;
		if (t === void 0) return console.warn("[CopilotKit] startTrajectory() needs the `learning` option on CopilotKitCore (or the CopilotKitProvider `learning` prop)."), Promise.resolve({
			status: "error",
			code: "LEARNING_DISABLED"
		});
		if (t.sink === void 0) return e.learningContainerIds !== void 0 && console.warn("[CopilotKit] learningContainerIds is supported only with a custom sink. Authenticated Trajectory capture ignores it; assign Learning Spaces on the server with getTrajectoryLearningContainerIds on CopilotKitIntelligence, and remove learningContainerIds from the capture options."), this.stopLegacy(), this.connection.start(e.trajectoryId, t);
		this.connection.stop();
		let n = e.trajectoryId ?? this.collector?.trajectoryId ?? crypto.randomUUID();
		if (this.collector === null) {
			this.activeConfig = t;
			let e = this.core.runtimeUrl;
			this.collector = Dh({
				...t,
				beforeSend: (e) => {
					let n = {
						...e,
						value: {
							...e.value,
							seq: ++this.seq
						}
					};
					return t.beforeSend === void 0 ? n : t.beforeSend(n);
				},
				ignoreUrls: [
					...t.ignoreUrls ?? [],
					...F_,
					...e === void 0 ? [] : [e]
				],
				enrich: (e) => this.enrich(e)
			});
		}
		let r = this.collector.trajectoryId !== null;
		if (this.collector.start({
			...e,
			trajectoryId: n
		}), r) return Promise.resolve(this.collector.trajectoryId === n ? {
			status: "started",
			trajectoryId: n
		} : {
			status: "error",
			code: "TRAJECTORY_ACTIVE"
		});
		this.startTracking(), this.lastLinkedThreadId = null;
		for (let e of this.distinctOpenThreadIds()) this.emitThreadLinked(e, "start");
		return Promise.resolve({
			status: "started",
			trajectoryId: n
		});
	}
	stop() {
		this.connection.stop(), this.stopLegacy();
	}
	stopLegacy() {
		this.collector?.stop(), this.collector = null, this.activeConfig = void 0, this.coreSubscription?.unsubscribe(), this.coreSubscription = null;
		for (let e of this.agents.values()) e.unsubscribe();
		this.agents.clear(), this.toolCalls.clear(), this.executingTools.clear();
	}
	emit(e, t) {
		if (this.connection.emit(e, t), typeof t == "object" && t && !Array.isArray(t)) {
			let n = typeof t.threadId == "string" ? {} : this.openThreadContext();
			this.collector?.emit(e, {
				...n,
				...t
			});
		}
	}
	registerOpenThread(e) {
		let t = { ...e }, n = !this.distinctOpenThreadIds().includes(t.threadId);
		return this.openThreads.add(t), n && this.emitThreadLinked(t.threadId, "open"), {
			update: (e) => {
				e !== t.threadId && (t.threadId = e, [...this.openThreads].filter((e) => e !== t).some((t) => t.threadId === e) || this.emitThreadLinked(e, "switch"));
			},
			unregister: () => {
				this.openThreads.delete(t);
			}
		};
	}
	distinctOpenThreadIds() {
		return [...new Set([...this.openThreads].map((e) => e.threadId))];
	}
	emitThreadLinked(e, t) {
		if (this.collector === null || this.collector.trajectoryId === null || e === this.lastLinkedThreadId) return;
		this.lastLinkedThreadId = e;
		let n = [...this.openThreads].find((t) => t.threadId === e), r = this.findAgentForThread(e);
		this.collector?.ɵemit("thread.linked", {
			threadId: e,
			agentId: n?.agentId ?? r?.agentId ?? null,
			hasMessages: (r?.messages.length ?? 0) > 0,
			reason: t
		});
	}
	findAgentForThread(e) {
		return [...this.agents.keys()].find((t) => t.threadId === e);
	}
	track(e) {
		let t = e.agentId;
		this.isLegacyCaptureActive && !this.agents.has(e) && t !== void 0 && this.agents.set(e, e.subscribe(this.agentSubscriber(e, t)));
	}
	agentSubscriber(e, t) {
		let n = () => this.lastRunIds.get(e);
		return {
			onRunStartedEvent: ({ event: t }) => {
				this.lastRunIds.set(e, t.runId), this.emitRun("started", e, t.threadId, t.runId);
			},
			onRunFinishedEvent: ({ event: t }) => {
				this.emitRun("finished", e, t.threadId, t.runId);
			},
			onRunErrorEvent: () => {
				this.emitRun("error", e, e.threadId, n() ?? null);
			},
			onToolCallStartEvent: ({ event: r }) => {
				if (!this.isLegacyCaptureActive) return;
				let i = {
					agentId: t,
					threadId: e.threadId,
					messageId: r.parentMessageId,
					runId: n()
				};
				this.toolCalls.set(r.toolCallId, i), this.emitToolCall("started", r.toolCallId, i.agentId, r.toolCallName, {});
			},
			onToolCallResultEvent: ({ event: e }) => {
				this.executingTools.has(e.toolCallId) || this.toolCalls.delete(e.toolCallId);
			},
			onNewMessage: ({ message: t }) => this.emitMessage(e, t)
		};
	}
	emitRun(e, t, n, r) {
		this.collector?.ɵemit("agent.run", {
			phase: e,
			runId: r,
			threadId: n,
			agentId: t.agentId
		});
	}
	emitMessage(e, t) {
		let n = typeof t.content == "string" ? t.content : "", r = this.capturesAgentText && typeof t.content == "string";
		this.collector?.ɵemit("agent.message", {
			messageId: t.id,
			runId: this.runIdForMessage(e, t.id),
			threadId: e.threadId,
			agentId: e.agentId,
			role: t.role,
			textLength: n.length,
			...r ? { text: n } : {}
		});
	}
	emitToolCall(e, t, n, r, i) {
		let a = this.toolCalls.get(t);
		this.collector?.ɵemit("tool.call", {
			phase: e,
			toolCallId: t,
			toolName: r,
			agentId: n,
			threadId: a?.threadId ?? null,
			messageId: a?.messageId,
			runId: a?.runId,
			...i
		});
	}
	runIdForMessage(e, t) {
		let n = e.agentId;
		return n === void 0 ? null : this.core.getRunIdForMessage(n, e.threadId, t) ?? this.lastRunIds.get(e) ?? null;
	}
	findMessage(e) {
		for (let t of this.agents.keys()) {
			let n = t.messages.find((t) => t.id === e);
			if (n !== void 0) return {
				agent: t,
				message: n
			};
		}
		return null;
	}
	toolStatus(e, t) {
		return this.executingTools.has(t) ? "executing" : e.messages.some((e) => e.role === "tool" && e.toolCallId === t) ? "complete" : "inProgress";
	}
	enrich(e) {
		let t = e.closest("[data-message-id]")?.getAttribute("data-message-id") ?? null, n = e.closest("[data-tool-call-id]")?.getAttribute("data-tool-call-id") ?? null, r = t === null ? null : this.findMessage(t);
		if (r !== null) {
			let { agent: e, message: t } = r, i = n !== null && t.role === "assistant" ? t.toolCalls?.find((e) => e.id === n) : void 0;
			return {
				threadId: e.threadId,
				agentId: e.agentId,
				messageId: t.id,
				runId: this.runIdForMessage(e, t.id),
				...i === void 0 ? {} : {
					toolCallId: i.id,
					toolName: i.function.name,
					toolStatus: this.toolStatus(e, i.id)
				}
			};
		}
		return this.openThreadContext();
	}
	openThreadContext() {
		let e = this.distinctOpenThreadIds();
		return e.length > 1 ? {
			threadId: null,
			threadAmbiguity: {
				reason: "multiple-open",
				candidates: e
			}
		} : { threadId: e[0] ?? null };
	}
}, L_ = {
	boot: "@@micro-redux/boot",
	init: "@@micro-redux/init",
	stop: "@@micro-redux/stop"
}, R_ = { type: L_.boot };
function z_(e, t) {
	let n = ((...n) => ({
		...t(...n),
		type: e
	}));
	return n.type = e, n.match = (t) => t.type === e, n;
}
function G() {
	return { kind: "props" };
}
function B_() {
	return { kind: "empty" };
}
function V_(e, t) {
	let n = {};
	for (let r of Object.keys(t)) {
		let i = t[r];
		if (!i) continue;
		let a = `[${e}] ${r}`;
		n[r] = i.kind === "props" ? z_(a, (e) => ({ ...e })) : z_(a, () => ({}));
	}
	return n;
}
function K(...e) {
	if (e.length < 2) throw Error("on requires at least one action creator and one reducer");
	let t = e[e.length - 1];
	return {
		creators: e.slice(0, -1),
		reducer: t
	};
}
function H_(e, ...t) {
	let n = /* @__PURE__ */ new Map();
	for (let e of t) for (let t of e.creators) {
		let r = n.get(t.type) ?? [];
		r.push(e.reducer), n.set(t.type, r);
	}
	return (t, r) => {
		let i = t ?? e, a = n.get(r.type);
		if (!a || a.length === 0) return i;
		let o = i;
		for (let e of a) o = e(o, r);
		return o;
	};
}
function U_(...e) {
	if (e.length === 1) {
		let t = e[0], n = !1, r, i;
		return (e) => (n && e === r || (r = e, i = t(e), n = !0), i);
	}
	let t = e[e.length - 1], n = e.slice(0, -1), r = !1, i = [], a;
	return (e) => {
		let o = n.map((t) => t(e));
		return r && o.length === i.length && o.every((e, t) => e === i[t]) || (i = o, a = t(...o), r = !0), a;
	};
}
function W_(e) {
	return (t) => t.pipe(k(e), vi());
}
function q(...e) {
	if (e.length === 0) throw Error("ofType requires at least one action creator");
	let t = new Set(e.map((e) => e.type));
	return (e) => e.pipe(j((e) => t.has(e.type)));
}
function G_(e, t = {}) {
	return t.dispatch === !1 ? {
		run: e,
		dispatch: !1
	} : {
		run: e,
		dispatch: !0
	};
}
function K_(e) {
	let t = e.reducer, n = e.effects ?? [], r = !1, i = !1, a = new Gt(), o = t(void 0, R_), s = new On(o), c = new En(), l = (e) => {
		if (r) throw Error("Store is in a failed state due to an effect error");
		o = t(o, e), s.next(o), c.next(e);
	}, u = (e) => {
		r || (r = !0, i = !1, a.unsubscribe(), a = new Gt(), c.error(e), s.error(e));
	}, d = () => {
		for (let e of n) {
			let t = c.asObservable().pipe(yr(Gn)), n = s.asObservable();
			if (e.dispatch) {
				let i = e.run(t, n).subscribe({
					next: (e) => {
						r || l(e);
					},
					error: (e) => {
						u(e);
					}
				});
				a.add(i);
				continue;
			}
			let i = e.run(t, n).subscribe({ error: (e) => {
				u(e);
			} });
			a.add(i);
		}
	};
	return {
		dispatch(e) {
			l(e);
		},
		getState() {
			return o;
		},
		get state$() {
			return s.asObservable();
		},
		get actions$() {
			return c.asObservable();
		},
		select(e) {
			return s.asObservable().pipe(W_(e));
		},
		init() {
			r || i || (i = !0, d(), r || l({ type: L_.init }));
		},
		stop() {
			!r && i && (l({ type: L_.stop }), a.unsubscribe(), a = new Gt(), i = !1);
		}
	};
}
var q_ = Object.freeze({
	MEMORY_LIST_FAILED: {
		code: "MEMORY_LIST_FAILED",
		category: "dependency",
		retryable: !0,
		message: "Failed to fetch memories",
		docsPath: "docs/errors/memory.md#memory_list_failed"
	},
	MEMORY_RECALL_FAILED: {
		code: "MEMORY_RECALL_FAILED",
		category: "dependency",
		retryable: !0,
		message: "Failed to recall memories",
		docsPath: "docs/errors/memory.md#memory_recall_failed"
	},
	MEMORY_CREDENTIALS_FAILED: {
		code: "MEMORY_CREDENTIALS_FAILED",
		category: "dependency",
		retryable: !0,
		message: "Failed to fetch memory subscribe credentials",
		docsPath: "docs/errors/memory.md#memory_credentials_failed"
	},
	MEMORY_MUTATION_FAILED: {
		code: "MEMORY_MUTATION_FAILED",
		category: "dependency",
		retryable: !0,
		message: "Memory mutation request failed",
		docsPath: "docs/errors/memory.md#memory_mutation_failed"
	},
	MEMORY_REQUEST_TIMEOUT: {
		code: "MEMORY_REQUEST_TIMEOUT",
		category: "dependency",
		retryable: !0,
		message: "Request timed out",
		docsPath: "docs/errors/memory.md#memory_request_timeout"
	}
}), J_ = class e extends Error {
	code;
	category;
	retryable;
	constructor(t, n) {
		let r = q_[t];
		super(n?.message ?? r.message, { cause: n?.cause }), this.name = "MemoryError", this.code = t, this.category = r.category, this.retryable = n?.retryable ?? r.retryable, Object.setPrototypeOf(this, e.prototype);
	}
};
function Y_(e) {
	return !(Number.isInteger(e) && e >= 400 && e <= 499);
}
var X_ = "/memories", Z_ = "/memories/subscribe", Q_ = "/memories/recall", $_ = 15e3, ev = 5, tv = /* @__PURE__ */ new Set([
	404,
	422,
	501
]), nv = class extends Error {}, rv = Object.freeze({
	memories: Object.freeze([]),
	isLoading: !1,
	inFlightMutationCount: 0,
	error: null,
	context: null,
	sessionId: 0,
	available: !0,
	realtimeStatus: "connecting"
}), J = V_("Memory Adapter", {
	started: B_(),
	stopped: B_(),
	contextChanged: G(),
	addRequested: G(),
	updateRequested: G(),
	removeRequested: G()
}), Y = V_("Memory REST", {
	listRequested: G(),
	listSucceeded: G(),
	listFailed: G(),
	listUnavailable: G(),
	mutationFinished: G(),
	credentialsRequested: G(),
	credentialsSucceeded: G(),
	credentialsFailed: G(),
	credentialsUnavailable: G()
}), iv = V_("Memory Domain", {
	memoryUpserted: G(),
	memoryInvalidated: G(),
	realtimeConnecting: G(),
	realtimeConnected: G(),
	realtimeUnavailable: G()
});
function av(e) {
	return {
		id: e.id,
		kind: e.kind,
		scope: e.scope,
		content: e.content,
		sourceThreadIds: e.sourceThreadIds,
		invalidatedAt: e.invalidatedAt
	};
}
function ov(e, t) {
	return e.operation === "invalidated" ? iv.memoryInvalidated({
		sessionId: t,
		memoryId: e.invalidated.id
	}) : iv.memoryUpserted({
		sessionId: t,
		memory: av(e.memory)
	});
}
function sv(e, t) {
	let n = e.findIndex((e) => e.id === t.id);
	if (n === -1) return [t, ...e];
	let r = [...e];
	return r[n] = t, r;
}
var cv = H_(rv, K(J.contextChanged, (e, { context: t }) => ({
	...e,
	context: t,
	sessionId: e.sessionId + 1,
	memories: [],
	isLoading: !!t,
	inFlightMutationCount: 0,
	error: null,
	available: !0,
	realtimeStatus: "connecting"
})), K(J.stopped, (e) => ({
	...e,
	memories: [],
	isLoading: !1,
	inFlightMutationCount: 0,
	error: null,
	available: !0,
	realtimeStatus: "connecting"
})), K(Y.listRequested, (e, { sessionId: t }) => t !== e.sessionId || !e.context ? e : {
	...e,
	isLoading: !0,
	error: null,
	available: !0
}), K(Y.listFailed, (e, { sessionId: t, error: n }) => t === e.sessionId ? {
	...e,
	isLoading: !1,
	error: n
} : e), K(Y.listUnavailable, (e, { sessionId: t }) => t === e.sessionId ? {
	...e,
	memories: [],
	isLoading: !1,
	error: null,
	available: !1
} : e), K(J.addRequested, J.updateRequested, J.removeRequested, (e) => ({
	...e,
	inFlightMutationCount: e.inFlightMutationCount + 1
})), K(Y.mutationFinished, (e, { outcome: t }) => t.sessionId === e.sessionId ? {
	...e,
	inFlightMutationCount: Math.max(0, e.inFlightMutationCount - 1),
	error: t.ok ? null : t.error
} : e), K(Y.listSucceeded, (e, { sessionId: t, memories: n }) => t === e.sessionId ? {
	...e,
	memories: n,
	isLoading: !1,
	error: null,
	available: !0
} : e), K(iv.memoryUpserted, (e, { sessionId: t, memory: n }) => t === e.sessionId ? {
	...e,
	memories: sv(e.memories, n)
} : e), K(iv.memoryInvalidated, (e, { sessionId: t, memoryId: n }) => t === e.sessionId ? {
	...e,
	memories: e.memories.filter((e) => e.id !== n)
} : e), K(iv.realtimeConnecting, (e, { sessionId: t }) => t === e.sessionId ? {
	...e,
	realtimeStatus: "connecting"
} : e), K(iv.realtimeConnected, (e, { sessionId: t }) => t === e.sessionId ? {
	...e,
	realtimeStatus: "connected"
} : e), K(iv.realtimeUnavailable, (e, { sessionId: t }) => t === e.sessionId ? {
	...e,
	realtimeStatus: "unavailable"
} : e)), lv = U_((e) => e.memories), uv = U_((e) => e.isLoading), dv = U_((e) => e.error);
U_((e) => e.inFlightMutationCount > 0);
var fv = U_((e) => e.available), pv = U_((e) => e.realtimeStatus), mv = "memory_metadata";
function hv(e, t) {
	let { selector: n, fetch: r, signal: i, ...a } = t;
	return new w((t) => {
		let o = new AbortController(), s = () => o.abort();
		i?.aborted ? o.abort() : i?.addEventListener("abort", s);
		let c = Or(r(e, {
			...a,
			signal: o.signal
		})).pipe($r((e) => Or(n(e)))).subscribe(t);
		return () => {
			i?.removeEventListener("abort", s), o.abort(), c.unsubscribe();
		};
	});
}
function gv(e, t, n) {
	return A(() => {
		let r = t.includeInvalidated ? "?includeInvalidated=true" : "";
		return hv(`${t.runtimeUrl}${X_}${r}`, {
			selector: (e) => {
				if (!e.ok) throw tv.has(e.status) ? new nv(String(e.status)) : new J_("MEMORY_LIST_FAILED", {
					message: `Failed to fetch memories: ${e.status}`,
					retryable: Y_(e.status)
				});
				return e.json();
			},
			fetch: e.fetch,
			method: "GET",
			headers: { ...t.headers }
		}).pipe(Lr({
			first: $_,
			with: () => {
				throw new J_("MEMORY_REQUEST_TIMEOUT");
			}
		}), k((e) => Y.listSucceeded({
			sessionId: n,
			memories: e.memories
		})), oi((e) => e instanceof nv ? D(Y.listUnavailable({ sessionId: n })) : D(Y.listFailed({
			sessionId: n,
			error: e instanceof Error ? e : Error(String(e))
		}))));
	});
}
function _v(e, t, n) {
	return A(() => hv(`${t.runtimeUrl}${Z_}`, {
		selector: async (e) => {
			if (!e.ok) throw tv.has(e.status) ? new nv(String(e.status)) : new J_("MEMORY_CREDENTIALS_FAILED", {
				message: `Failed to fetch memory subscribe credentials: ${e.status}`,
				retryable: Y_(e.status)
			});
			return e.json();
		},
		fetch: e.fetch,
		method: "POST",
		headers: {
			...t.headers,
			"Content-Type": "application/json"
		},
		body: JSON.stringify({})
	}).pipe(Lr({
		first: $_,
		with: () => {
			throw new J_("MEMORY_REQUEST_TIMEOUT");
		}
	}), k((e) => {
		let t = typeof e.joinToken == "string" && e.joinToken.length > 0 && typeof e.joinCode == "string" && e.joinCode.length > 0, r = typeof e.projectJoinToken == "string" && e.projectJoinToken.length > 0 && typeof e.projectJoinCode == "string" && e.projectJoinCode.length > 0;
		if (!t && !r) throw Error("missing memory realtime credentials");
		return Y.credentialsSucceeded({
			sessionId: n,
			...t ? {
				joinToken: e.joinToken,
				joinCode: e.joinCode
			} : {},
			...r ? {
				projectJoinToken: e.projectJoinToken,
				projectJoinCode: e.projectJoinCode
			} : {}
		});
	}), oi((e) => e instanceof nv ? D(Y.credentialsUnavailable({ sessionId: n })) : D(Y.credentialsFailed({
		sessionId: n,
		error: e instanceof Error ? e : Error(String(e))
	})))));
}
function vv(e) {
	return {
		id: e.id,
		kind: e.kind,
		scope: e.scope,
		content: e.content,
		sourceThreadIds: e.sourceThreadIds,
		invalidatedAt: e.invalidatedAt
	};
}
function yv(e) {
	return {
		id: e.id,
		kind: e.kind,
		scope: e.scope,
		content: e.content,
		sourceThreadIds: e.sourceThreadIds,
		invalidatedAt: e.invalidatedAt,
		...typeof e.score == "number" ? { score: e.score } : {}
	};
}
var bv = /* @__PURE__ */ new Set([
	"topical",
	"episodic",
	"operational"
]), xv = /* @__PURE__ */ new Set(["user", "project"]);
function Sv(e) {
	return !e || typeof e != "object" ? /* @__PURE__ */ Error("memory mutation response missing/invalid body") : typeof e.id != "string" || e.id.length === 0 ? /* @__PURE__ */ Error("memory mutation response missing/invalid id") : typeof e.kind != "string" || !bv.has(e.kind) ? /* @__PURE__ */ Error("memory mutation response missing/invalid kind") : typeof e.scope != "string" || !xv.has(e.scope) ? /* @__PURE__ */ Error("memory mutation response missing/invalid scope") : typeof e.content == "string" ? !Array.isArray(e.sourceThreadIds) || !e.sourceThreadIds.every((e) => typeof e == "string") ? /* @__PURE__ */ Error("memory mutation response missing/invalid sourceThreadIds") : e.invalidatedAt !== null && typeof e.invalidatedAt != "string" ? /* @__PURE__ */ Error("memory mutation response missing/invalid invalidatedAt") : null : /* @__PURE__ */ Error("memory mutation response missing/invalid content");
}
function Cv(e) {
	return {
		content: e.content,
		kind: e.kind,
		...e.scope === void 0 ? {} : { scope: e.scope },
		sourceThreadIds: e.sourceThreadIds ?? []
	};
}
function wv(e, t) {
	let { requestId: n, sessionId: r } = e;
	if (e.kind === "remove") return [iv.memoryInvalidated({
		sessionId: r,
		memoryId: e.id
	}), Y.mutationFinished({ outcome: {
		requestId: n,
		sessionId: r,
		ok: !0,
		memory: null
	} })];
	let i = Sv(t);
	if (i) return [Y.mutationFinished({ outcome: {
		requestId: n,
		sessionId: r,
		ok: !1,
		error: i
	} })];
	let a = vv(t);
	if (e.kind === "update") {
		let e = t.retiredId;
		return typeof e != "string" || e.length === 0 ? [Y.mutationFinished({ outcome: {
			requestId: n,
			sessionId: r,
			ok: !1,
			error: /* @__PURE__ */ Error("supersede response missing retiredId")
		} })] : [
			iv.memoryInvalidated({
				sessionId: r,
				memoryId: e
			}),
			iv.memoryUpserted({
				sessionId: r,
				memory: a
			}),
			Y.mutationFinished({ outcome: {
				requestId: n,
				sessionId: r,
				ok: !0,
				memory: a
			} })
		];
	}
	return [iv.memoryUpserted({
		sessionId: r,
		memory: a
	}), Y.mutationFinished({ outcome: {
		requestId: n,
		sessionId: r,
		ok: !0,
		memory: a
	} })];
}
function Tv(e, t, n) {
	let r = n.kind === "add" ? "POST" : n.kind === "update" ? "PATCH" : "DELETE", i = n.kind === "add" ? X_ : `${X_}/${encodeURIComponent(n.id)}`;
	return A(() => hv(`${t.runtimeUrl}${i}`, {
		selector: async (e) => {
			if (!e.ok) throw new J_("MEMORY_MUTATION_FAILED", {
				message: `Request failed: ${e.status}`,
				retryable: Y_(e.status)
			});
			return n.kind === "remove" ? null : await e.json();
		},
		fetch: e.fetch,
		method: r,
		headers: {
			...t.headers,
			"Content-Type": "application/json"
		},
		body: n.kind === "remove" ? void 0 : JSON.stringify(n.body)
	}).pipe(Lr({
		first: $_,
		with: () => {
			throw new J_("MEMORY_REQUEST_TIMEOUT");
		}
	}), $r((e) => D(...wv(n, e))), oi((e) => D(Y.mutationFinished({ outcome: {
		requestId: n.requestId,
		sessionId: n.sessionId,
		ok: !1,
		error: e instanceof Error ? e : Error(String(e))
	} })))));
}
function Ev(e) {
	let t = 0, n = () => (t += 1, `memory-request-${t}`), r = G_((e, t) => e.pipe(q(J.contextChanged), ki(t), j(([, e]) => !!e.context), k(([, e]) => Y.listRequested({ sessionId: e.sessionId })))), i = G_((e, t) => e.pipe(q(J.contextChanged), ki(t), j(([, e]) => !!e.context), k(([, e]) => Y.credentialsRequested({ sessionId: e.sessionId })))), a = G_((t, n) => t.pipe(q(Y.credentialsRequested), M((r) => n.pipe(k((e) => e.context), j((e) => !!e), fi(1), k((e) => ({
		action: r,
		context: e
	})), Di(t.pipe(q(J.contextChanged, J.stopped))), M(({ action: t, context: n }) => _v(e, n, t.sessionId)))))), o = K_({
		reducer: cv,
		effects: [
			r,
			i,
			G_((t, n) => t.pipe(q(Y.listRequested), M((r) => n.pipe(k((e) => e.context), j((e) => !!e), fi(1), k((e) => ({
				action: r,
				context: e
			})), Di(t.pipe(q(J.contextChanged, J.stopped))), M(({ action: t, context: n }) => gv(e, n, t.sessionId)))))),
			a,
			G_((t, n) => t.pipe(q(J.addRequested, J.updateRequested, J.removeRequested), ki(n), $r(([t, n]) => {
				let r = n.context, i = n.sessionId;
				return r?.runtimeUrl ? J.addRequested.match(t) ? Tv(e, r, {
					requestId: t.requestId,
					sessionId: i,
					kind: "add",
					body: Cv(t.input)
				}) : J.updateRequested.match(t) ? Tv(e, r, {
					requestId: t.requestId,
					sessionId: i,
					kind: "update",
					id: t.id,
					body: Cv(t.changes)
				}) : Tv(e, r, {
					requestId: t.requestId,
					sessionId: i,
					kind: "remove",
					id: t.id
				}) : D(Y.mutationFinished({ outcome: {
					requestId: t.requestId,
					sessionId: i,
					ok: !1,
					error: /* @__PURE__ */ Error("Runtime URL is not configured")
				} }));
			}))),
			G_((e, t) => e.pipe(q(Y.credentialsSucceeded), ki(t), j(([e, t]) => e.sessionId === t.sessionId && !!t.context?.wsUrl), M(([t, n]) => {
				let r = n.context, { joinToken: i, joinCode: a, projectJoinToken: o, projectJoinCode: s } = t, c = i ?? o, l = i && a ? `user_meta:memories:${a}` : `project_meta:memories:${s}`, u = t.sessionId, d = e.pipe(q(J.contextChanged, J.stopped)), f = (e, t) => {
					let n = Ih({
						socket$: Fh({
							url: r.wsUrl,
							options: {
								params: { join_token: e },
								reconnectAfterMs: Jd(100, 1e4),
								rejoinAfterMs: Jd(1e3, 3e4)
							}
						}).pipe(Ti({
							bufferSize: 1,
							refCount: !0
						})),
						topic: t
					}).pipe(Ti({
						bufferSize: 1,
						refCount: !0
					}));
					return ii(n.pipe(M(({ channel: e }) => Lh(e, mv)), k((e) => ov(e, u))), zh(n).pipe(oi((e) => (console.warn(`[memory] failed to join ${t}`, e), Jn))));
				};
				return A(() => {
					let e = Fh({
						url: r.wsUrl,
						options: {
							params: { join_token: c },
							reconnectAfterMs: Jd(100, 1e4),
							rejoinAfterMs: Jd(1e3, 3e4)
						}
					}).pipe(Ti({
						bufferSize: 1,
						refCount: !0
					})), n = Ih({
						socket$: e,
						topic: l
					}).pipe(Ti({
						bufferSize: 1,
						refCount: !0
					})), p = Vh(Bh(e).pipe(Ci()), ev).pipe(oi(() => (console.warn(`[memory] WebSocket failed after ${ev} attempts, giving up`), D(void 0))), Ci()), m = p.pipe(k(() => iv.realtimeUnavailable({ sessionId: u }))), h = n.pipe(M(({ channel: e }) => Lh(e, mv)), k((e) => ov(e, t.sessionId))), g = zh(n).pipe(ui(D(iv.realtimeConnected({ sessionId: u }))), oi((e) => (console.warn(`[memory] failed to join ${l}`, e), D(iv.realtimeUnavailable({ sessionId: u }))))), ee = i && a && o && s ? f(o, `project_meta:memories:${s}`) : Jn;
					return ii(D(iv.realtimeConnecting({ sessionId: u })), h, g, ee, m).pipe(Di(ii(d, p.pipe(yr(Gn)))), xi(() => {}));
				});
			})))
		]
	});
	function s(e, t) {
		let { requestId: n } = e, r = Pr(ii(o.actions$.pipe(q(Y.mutationFinished), j((e) => e.outcome.requestId === n), k((e) => e.outcome)), o.actions$.pipe(q(J.stopped), k(() => ({
			requestId: n,
			sessionId: o.getState().sessionId,
			ok: !1,
			error: /* @__PURE__ */ Error("Memory store stopped before mutation completed")
		})))).pipe(fi(1))).then((e) => {
			if (!e.ok) throw e.error;
			return t(e);
		});
		return o.dispatch(e), r;
	}
	return {
		start() {
			o.init(), o.dispatch(J.started());
		},
		stop() {
			o.dispatch(J.stopped()), o.stop();
		},
		setContext(e) {
			o.dispatch(J.contextChanged({ context: e }));
		},
		refresh() {
			let { sessionId: e, context: t } = o.getState();
			if (!t) return Promise.resolve();
			let n = Pr(ii(o.actions$.pipe(q(Y.listSucceeded, Y.listFailed, Y.listUnavailable), j((t) => t.sessionId === e)), o.actions$.pipe(q(J.stopped)), o.actions$.pipe(q(J.contextChanged))).pipe(fi(1))).then((e) => {
				if (Y.listFailed.match(e)) throw e.error;
				if (J.stopped.match(e)) throw Error("Memory store stopped before refresh completed");
				J.contextChanged.match(e);
			});
			return o.dispatch(Y.listRequested({ sessionId: e })), n;
		},
		recall(t, n) {
			let { context: r } = o.getState();
			if (!r?.runtimeUrl) return Promise.reject(/* @__PURE__ */ Error("Runtime URL is not configured"));
			let i = { query: t };
			return n?.limit !== void 0 && (i.limit = n.limit), n?.scope !== void 0 && (i.scope = n.scope), Pr(hv(`${r.runtimeUrl}${Q_}`, {
				selector: async (e) => {
					if (!e.ok) throw new J_("MEMORY_RECALL_FAILED", {
						message: `Failed to recall memories: ${e.status}`,
						retryable: Y_(e.status)
					});
					return await e.json();
				},
				fetch: e.fetch,
				method: "POST",
				headers: {
					...r.headers,
					"Content-Type": "application/json"
				},
				body: JSON.stringify(i)
			}).pipe(Lr({
				first: $_,
				with: () => {
					throw new J_("MEMORY_REQUEST_TIMEOUT");
				}
			}), k((e) => (e.memories ?? []).map((e) => yv(e)))));
		},
		addMemory(e) {
			return s(J.addRequested({
				requestId: n(),
				input: e
			}), (e) => {
				if (e.memory == null) throw Error("add resolved without a memory");
				return e.memory;
			});
		},
		updateMemory(e, t) {
			return s(J.updateRequested({
				requestId: n(),
				id: e,
				changes: t
			}), (e) => {
				if (e.memory == null) throw Error("update resolved without a memory");
				return e.memory;
			});
		},
		removeMemory(e) {
			return s(J.removeRequested({
				requestId: n(),
				id: e
			}), () => void 0);
		},
		getState() {
			return o.getState();
		},
		getServerState() {
			return rv;
		},
		select: o.select.bind(o)
	};
}
var Dv = lv, Ov = uv, kv = dv, Av = fv, jv = pv;
function Mv(e) {
	return typeof e == "object" && !!e && !Array.isArray(e) && Object.getPrototypeOf(e) === Object.prototype;
}
var X = /* @__PURE__ */ function(e) {
	return e.RUNTIME_INFO_FETCH_FAILED = "runtime_info_fetch_failed", e.AGENT_CONNECT_FAILED = "agent_connect_failed", e.AGENT_RUN_FAILED = "agent_run_failed", e.AGENT_RUN_FAILED_EVENT = "agent_run_failed_event", e.AGENT_RUN_ERROR_EVENT = "agent_run_error_event", e.TOOL_ARGUMENT_PARSE_FAILED = "tool_argument_parse_failed", e.TOOL_HANDLER_FAILED = "tool_handler_failed", e.TOOL_NOT_FOUND = "tool_not_found", e.AGENT_NOT_FOUND = "agent_not_found", e.AGENT_THREAD_LOCKED = "agent_thread_locked", e.TRANSCRIPTION_FAILED = "transcription_failed", e.TRANSCRIPTION_SERVICE_NOT_CONFIGURED = "transcription_service_not_configured", e.TRANSCRIPTION_INVALID_AUDIO = "transcription_invalid_audio", e.TRANSCRIPTION_RATE_LIMITED = "transcription_rate_limited", e.TRANSCRIPTION_AUTH_FAILED = "transcription_auth_failed", e.TRANSCRIPTION_NETWORK_ERROR = "transcription_network_error", e.SUBSCRIBER_CALLBACK_FAILED = "subscriber_callback_failed", e.HEADER_RESOLUTION_FAILED = "header_resolution_failed", e;
}({}), Nv = /* @__PURE__ */ new Set([
	"onMessagesChanged",
	"onStateChanged",
	"onRunInitialized",
	"onRunStartedEvent",
	"onRunFinalized",
	"onRunFailed",
	"onRunErrorEvent"
]), Z = /* @__PURE__ */ function(e) {
	return e.Disconnected = "disconnected", e.Connected = "connected", e.Connecting = "connecting", e.Error = "error", e;
}({}), Pv = class {
	headerSource;
	_credentials;
	_messageFilter;
	_properties;
	_scopedProperties = /* @__PURE__ */ new Map();
	_defaultThrottleMs;
	_debug;
	subscribers = /* @__PURE__ */ new Set();
	agentRegistry;
	contextStore;
	suggestionEngine;
	runHandler;
	stateManager;
	threadStoreRegistry;
	learningBridge;
	notifiedTrajectoryId = null;
	learningConfiguredListeners = /* @__PURE__ */ new Set();
	_generativeUIDebugSource;
	generativeUIDebugListeners = /* @__PURE__ */ new Set();
	_memoryStore;
	previousAgentIds = /* @__PURE__ */ new Set();
	constructor({ runtimeUrl: e, runtimeTransport: t = "auto", deferInitialConnection: n = !1, headers: r = {}, credentials: i, messageFilter: a, properties: o = {}, agents__unsafe_dev_only: s = {}, tools: c = [], suggestionsConfig: l = [], debug: u, learning: d }) {
		this.headerSource = new kg((e) => {
			this.emitError({
				error: e,
				code: X.HEADER_RESOLUTION_FAILED,
				context: { source: "headers" }
			});
		}), this.headerSource.setSource(r), this._credentials = i, this._messageFilter = a, this._properties = o, this._debug = u, this.agentRegistry = new Bg(this), this.contextStore = new Hg(this), this.suggestionEngine = new Ug(this), this.runHandler = new p_(this), this.stateManager = new __(this), this.threadStoreRegistry = new v_(this), this.agentRegistry.initialize(s), this.runHandler.initialize(c), this.suggestionEngine.initialize(l), this.stateManager.initialize(), this.learningBridge = new I_(this, d, () => this.notifyTrajectoryChanged()), this.agentRegistry.setRuntimeTransport(t), this.agentRegistry.setRuntimeUrl(e, { deferConnection: n }), this.previousAgentIds = new Set(Object.keys(s)), this.subscribe({
			onRuntimeConnectionStatusChanged: () => {
				this._memoryStore && this.syncMemoryContext();
			},
			onAgentsChanged: ({ agents: e }) => {
				Object.values(e).forEach((e) => {
					e.agentId && this.stateManager.subscribeToAgent(e);
				});
				let t = new Set(Object.keys(e));
				for (let e of Object.keys(this.threadStoreRegistry.getAll())) if (this.previousAgentIds.has(e) && !t.has(e)) try {
					this.threadStoreRegistry.unregister(e);
				} catch (t) {
					console.error(`CopilotKitCore.onAgentsChanged: threadStoreRegistry.unregister failed for "${e}":`, t);
				}
				for (let e of this.previousAgentIds) if (!t.has(e)) try {
					this.stateManager.unsubscribeFromAgent(e);
				} catch (t) {
					console.error(`CopilotKitCore.onAgentsChanged: stateManager.unsubscribeFromAgent failed for "${e}":`, t);
				}
				this.previousAgentIds = t;
			}
		});
	}
	async notifySubscribers(e, t) {
		await Promise.all(Array.from(this.subscribers).map(async (n) => {
			try {
				await e(n);
			} catch (e) {
				console.error(t, e);
			}
		}));
	}
	async emitError({ error: e, code: t, context: n = {} }) {
		t !== X.HEADER_RESOLUTION_FAILED && wg(e) || await this.notifySubscribers((r) => r.onError?.({
			copilotkit: this,
			error: e,
			code: t,
			context: n
		}), "Subscriber onError error:");
	}
	logAndEmitError(e, t, n = "error") {
		console[n](e, t.error), this.emitError(t).catch((t) => {
			console.error(e + " — emitError itself failed:", t);
		});
	}
	get context() {
		return this.contextStore.context;
	}
	get agents() {
		return this.agentRegistry.agents;
	}
	get tools() {
		return this.runHandler.tools;
	}
	get catalogComponents() {
		return this.runHandler.catalogComponents;
	}
	get runtimeUrl() {
		return this.agentRegistry.runtimeUrl;
	}
	setRuntimeUrl(e) {
		this.agentRegistry.setRuntimeUrl(e);
	}
	connect() {
		this.agentRegistry.connectRuntime();
	}
	get runtimeTransport() {
		return this.agentRegistry.runtimeTransport;
	}
	setRuntimeTransport(e) {
		this.agentRegistry.setRuntimeTransport(e);
	}
	get runtimeVersion() {
		return this.agentRegistry.runtimeVersion;
	}
	get headers() {
		return this.headerSource.headers;
	}
	resolveHeaders() {
		return this.headerSource.resolve();
	}
	get ɵheadersGeneration() {
		return this.headerSource.generation;
	}
	get credentials() {
		return this._credentials;
	}
	get messageFilter() {
		return this._messageFilter;
	}
	get properties() {
		return this._properties;
	}
	get defaultThrottleMs() {
		return this._defaultThrottleMs;
	}
	setDefaultThrottleMs(e) {
		e !== void 0 && (!Number.isFinite(e) || e < 0) ? this.logAndEmitError(`CopilotKitCore.setDefaultThrottleMs: value must be a non-negative finite number or undefined, got ${e}. Keeping current value (${this._defaultThrottleMs}).`, {
			error: /* @__PURE__ */ Error(`setDefaultThrottleMs: invalid value (${e}), keeping current value (${this._defaultThrottleMs})`),
			code: X.SUBSCRIBER_CALLBACK_FAILED,
			context: {
				value: e,
				currentValue: this._defaultThrottleMs
			}
		}) : this._defaultThrottleMs = e;
	}
	get debug() {
		return this._debug;
	}
	setDebug(e) {
		this._debug = e;
	}
	get runtimeConnectionStatus() {
		return this.agentRegistry.runtimeConnectionStatus;
	}
	get ɵruntimeEndpointUrl() {
		return this.agentRegistry.runtimeEndpointUrl;
	}
	get ɵruntimeFetch() {
		return this.agentRegistry.createRuntimeFetch();
	}
	get audioFileTranscriptionEnabled() {
		return this.agentRegistry.audioFileTranscriptionEnabled;
	}
	get runtimeMode() {
		return this.agentRegistry.runtimeMode;
	}
	get intelligence() {
		return this.agentRegistry.intelligence;
	}
	get threadEndpoints() {
		return this.agentRegistry.threadEndpoints;
	}
	get suggestions() {
		return this.agentRegistry.suggestions;
	}
	get inspectorLearning() {
		return this.agentRegistry.inspectorLearning;
	}
	get inspectorMetadata() {
		return this.agentRegistry.inspectorMetadata;
	}
	async refreshInspectorMetadata() {
		await this.agentRegistry.refreshInspectorMetadata();
	}
	get a2uiEnabled() {
		return this.agentRegistry.a2uiEnabled;
	}
	get a2uiAgents() {
		return this.agentRegistry.a2uiAgents;
	}
	get openGenerativeUIEnabled() {
		return this.agentRegistry.openGenerativeUIEnabled;
	}
	get licenseStatus() {
		return this.agentRegistry.licenseStatus;
	}
	get runtimeEntitlements() {
		return this.agentRegistry.runtimeEntitlements;
	}
	get runtimeEntitlementRetryPending() {
		return this.agentRegistry.runtimeEntitlementRetryPending;
	}
	get telemetryDisabled() {
		return this.agentRegistry.telemetryDisabled;
	}
	setHeaders(e) {
		this.headerSource.setSource(e) && (this._memoryStore && this.syncMemoryContext(), this.agentRegistry.applyHeadersToAgents(this.agentRegistry.agents), this.agentRegistry.handleHeadersChanged(), this.notifySubscribers((e) => e.onHeadersChanged?.({
			copilotkit: this,
			headers: this.headers
		}), "Subscriber onHeadersChanged error:"));
	}
	setCredentials(e) {
		this._credentials = e, this.agentRegistry.applyCredentialsToAgents(this.agentRegistry.agents), this.agentRegistry.handleCredentialsChanged();
	}
	setMessageFilter(e) {
		this._messageFilter = e, this.agentRegistry.applyMessageFilterToAgents(this.agentRegistry.agents);
	}
	addScopedProperties({ properties: e, agentIds: t }) {
		let n = ae();
		for (let e = 1; this._scopedProperties.has(n); e++) n = `${n}-${e}`;
		return this._scopedProperties.set(n, {
			properties: e,
			...t ? { agentIds: t } : {}
		}), n;
	}
	removeScopedProperties(e) {
		this._scopedProperties.delete(e);
	}
	getPropertiesForAgent(e) {
		let t = { ...this._properties }, n = this._scopedProperties.values();
		for (let r of n) {
			if (!Vg(r.agentIds, e)) continue;
			let n = Object.entries(r.properties);
			for (let [e, r] of n) {
				let n = t[e];
				t[e] = Mv(n) && Mv(r) ? {
					...n,
					...r
				} : r;
			}
		}
		return t;
	}
	setProperties(e) {
		this._properties = e, this.notifySubscribers((e) => e.onPropertiesChanged?.({
			copilotkit: this,
			properties: this.properties
		}), "Subscriber onPropertiesChanged error:");
	}
	setAgents__unsafe_dev_only(e) {
		this.agentRegistry.setAgents__unsafe_dev_only(e);
	}
	addAgent__unsafe_dev_only(e) {
		this.agentRegistry.addAgent__unsafe_dev_only(e);
	}
	removeAgent__unsafe_dev_only(e) {
		this.agentRegistry.removeAgent__unsafe_dev_only(e);
	}
	registerProxiedAgent(e) {
		return this.agentRegistry.registerProxiedAgent(e);
	}
	getAgent(e) {
		return this.agentRegistry.getAgent(e);
	}
	setLearningConfig(e) {
		let t = this.ɵlearningConfigured;
		if (this.learningBridge.setConfig(e), this.notifyTrajectoryChanged(), this.ɵlearningConfigured !== t) for (let e of this.learningConfiguredListeners) try {
			e();
		} catch (e) {
			console.error("Learning configured listener error:", e);
		}
	}
	get ɵlearningConfigured() {
		return this.learningBridge.isConfigured;
	}
	get ɵlearningCapturesAgentText() {
		return this.learningBridge.capturesAgentText;
	}
	ɵsubscribeToLearningConfigured(e) {
		return this.learningConfiguredListeners.add(e), () => {
			this.learningConfiguredListeners.delete(e);
		};
	}
	get ɵgenerativeUIDebugSource() {
		return this._generativeUIDebugSource;
	}
	ɵsetGenerativeUIDebugSource(e) {
		if (e !== this._generativeUIDebugSource) {
			this._generativeUIDebugSource = e;
			for (let e of [...this.generativeUIDebugListeners]) try {
				e();
			} catch (e) {
				console.error("Generative UI debug listener error:", e);
			}
		}
	}
	ɵsubscribeToGenerativeUIDebugSource(e) {
		return this.generativeUIDebugListeners.add(e), () => {
			this.generativeUIDebugListeners.delete(e);
		};
	}
	get trajectoryId() {
		return this.learningBridge.trajectoryId;
	}
	notifyTrajectoryChanged() {
		let e = this.trajectoryId;
		e !== this.notifiedTrajectoryId && (this.notifiedTrajectoryId = e, this.notifySubscribers((t) => t.onTrajectoryChanged?.({
			copilotkit: this,
			trajectoryId: e
		}), "Subscriber onTrajectoryChanged error:"));
	}
	startTrajectory(e = {}) {
		let t = this.learningBridge.start(e);
		return this.notifyTrajectoryChanged(), t;
	}
	stopTrajectory() {
		this.learningBridge.stop(), this.notifyTrajectoryChanged();
	}
	emitTrajectoryEvent(e, t = {}) {
		this.learningBridge.emit(e, t);
	}
	registerOpenThread(e) {
		return this.learningBridge.registerOpenThread(e);
	}
	applyHeadersToAgent(e) {
		this.agentRegistry.applyHeadersToAgent(e);
	}
	prepareAgentHeadersForRun(e) {
		return this.agentRegistry.prepareAgentHeadersForRun(e);
	}
	addContext(e) {
		return this.contextStore.addContext(e);
	}
	removeContext(e) {
		this.contextStore.removeContext(e);
	}
	getContextForAgent(e) {
		return this.contextStore.getContextForAgent(e);
	}
	registerThreadStore(e, t) {
		this.threadStoreRegistry.register(e, t);
	}
	unregisterThreadStore(e) {
		this.threadStoreRegistry.unregister(e);
	}
	getThreadStore(e) {
		return this.threadStoreRegistry.get(e);
	}
	getThreadStores() {
		return this.threadStoreRegistry.getAll();
	}
	getMemoryStore() {
		return this.ensureMemoryStore();
	}
	ensureMemoryStore() {
		return this._memoryStore || (this._memoryStore = Ev({ fetch: this.ɵruntimeFetch }), this._memoryStore.start(), this.syncMemoryContext()), this._memoryStore;
	}
	syncMemoryContext() {
		this._memoryStore && (this.runtimeConnectionStatus === Z.Connected && this.intelligence?.wsUrl && this.runtimeUrl ? this._memoryStore.setContext({
			runtimeUrl: this.runtimeUrl,
			wsUrl: this.intelligence.wsUrl
		}) : this._memoryStore.setContext(null));
	}
	addSuggestionsConfig(e) {
		return this.suggestionEngine.addSuggestionsConfig(e);
	}
	removeSuggestionsConfig(e) {
		this.suggestionEngine.removeSuggestionsConfig(e);
	}
	reloadSuggestions(e) {
		this.suggestionEngine.reloadSuggestions(e);
	}
	clearSuggestions(e) {
		this.suggestionEngine.clearSuggestions(e);
	}
	getSuggestions(e) {
		return this.suggestionEngine.getSuggestions(e);
	}
	addTool(e) {
		this.runHandler.addTool(e);
	}
	removeTool(e, t) {
		this.runHandler.removeTool(e, t);
	}
	getTool(e) {
		return this.runHandler.getTool(e);
	}
	setTools(e) {
		this.runHandler.setTools(e);
	}
	setToolEnabled(e, t, n) {
		this.runHandler.setToolEnabled(e, t, n);
	}
	isToolEnabled(e, t) {
		return this.runHandler.isToolEnabled(e, t);
	}
	setCatalogComponents(e) {
		this.runHandler.setCatalogComponents(e), this.notifySubscribers((e) => e.onCatalogComponentsChanged?.({
			copilotkit: this,
			catalogComponents: this.runHandler.catalogComponents
		}), "Subscriber onCatalogComponentsChanged error:");
	}
	setCatalogComponentEnabled(e, t) {
		this.runHandler.setCatalogComponentEnabled(e, t), this.notifySubscribers((e) => e.onCatalogComponentsChanged?.({
			copilotkit: this,
			catalogComponents: this.runHandler.catalogComponents
		}), "Subscriber onCatalogComponentsChanged error:");
	}
	isCatalogComponentEnabled(e) {
		return this.runHandler.isCatalogComponentEnabled(e);
	}
	subscribe(e) {
		return this.subscribers.add(e), { unsubscribe: () => {
			this.subscribers.delete(e);
		} };
	}
	subscribeToAgentWithOptions(e, t, n) {
		let r = n?.throttleMs ?? this._defaultThrottleMs ?? 0, i = 0;
		if (!Number.isFinite(r) || r < 0) {
			let t = n?.throttleMs === void 0 ? "defaultThrottleMs" : "throttleMs";
			this.logAndEmitError(`CopilotKitCore.subscribeToAgentWithOptions: ${t} must be a non-negative finite number, got ${r}. Falling back to unthrottled.`, {
				error: /* @__PURE__ */ Error(`subscribeToAgentWithOptions: invalid ${t} (${r}), falling back to unthrottled`),
				code: X.SUBSCRIBER_CALLBACK_FAILED,
				context: {
					agentId: e.agentId,
					source: t,
					value: r
				}
			});
		} else i = r;
		let a = e.agentId || "(unknown agent)", o = (t, n, ...r) => {
			let i = (n, r) => {
				this.logAndEmitError(`CopilotKitCore.subscribeToAgentWithOptions[${a}]: ${t} callback ${r}:`, {
					error: n instanceof Error ? n : Error(String(n)),
					code: X.SUBSCRIBER_CALLBACK_FAILED,
					context: {
						agentId: e.agentId,
						callback: t
					}
				});
			};
			try {
				let e = n(...r);
				return e instanceof Promise ? e.catch((e) => {
					i(e, "rejected");
				}) : e;
			} catch (e) {
				i(e, "threw");
			}
		}, s = (e) => {
			let t = {};
			if (e.onMessagesChanged) {
				let n = e.onMessagesChanged;
				t.onMessagesChanged = (e) => o("onMessagesChanged", n, e);
			}
			if (e.onStateChanged) {
				let n = e.onStateChanged;
				t.onStateChanged = (e) => o("onStateChanged", n, e);
			}
			if (e.onRunInitialized) {
				let n = e.onRunInitialized;
				t.onRunInitialized = (e) => o("onRunInitialized", n, e);
			}
			if (e.onRunStartedEvent) {
				let n = e.onRunStartedEvent;
				t.onRunStartedEvent = (e) => o("onRunStartedEvent", n, e);
			}
			if (e.onRunFinalized) {
				let n = e.onRunFinalized;
				t.onRunFinalized = (e) => o("onRunFinalized", n, e);
			}
			if (e.onRunFailed) {
				let n = e.onRunFailed;
				t.onRunFailed = (e) => o("onRunFailed", n, e);
			}
			if (e.onRunErrorEvent) {
				let n = e.onRunErrorEvent;
				t.onRunErrorEvent = (e) => o("onRunErrorEvent", n, e);
			}
			return t;
		};
		for (let n of Object.keys(t)) if (typeof t[n] == "function" && !Nv.has(n)) {
			let t = `CopilotKitCore.subscribeToAgentWithOptions[${a}]: callback "${n}" is not supported and was dropped. Supported callbacks: ${Array.from(Nv).join(", ")}. Use agent.subscribe() directly for event handlers and per-item notifications.`;
			this.logAndEmitError(t, {
				error: Error(t),
				code: X.SUBSCRIBER_CALLBACK_FAILED,
				context: {
					agentId: e.agentId,
					droppedCallback: n
				}
			}, "warn");
		}
		if (i <= 0) {
			let n = e.subscribe(s(t));
			return { unsubscribe: () => n.unsubscribe() };
		}
		let c = !0, l = null, u = null, d = new Ve(() => {
			if (c && t.onMessagesChanged && l) {
				let e = l;
				l = null, o("onMessagesChanged", t.onMessagesChanged, e);
			}
			if (c && t.onStateChanged && u) {
				let e = u;
				u = null, o("onStateChanged", t.onStateChanged, e);
			}
		}, {
			wait: i,
			leading: !0,
			trailing: !0
		}), f = {};
		t.onRunInitialized && (f.onRunInitialized = t.onRunInitialized), t.onRunStartedEvent && (f.onRunStartedEvent = t.onRunStartedEvent), t.onRunFinalized && (f.onRunFinalized = t.onRunFinalized), t.onRunFailed && (f.onRunFailed = t.onRunFailed), t.onRunErrorEvent && (f.onRunErrorEvent = t.onRunErrorEvent);
		let p = s(f);
		t.onMessagesChanged && (p.onMessagesChanged = (e) => {
			l = e, d.maybeExecute();
		}), t.onStateChanged && (p.onStateChanged = (e) => {
			u = e, d.maybeExecute();
		});
		let m = e.subscribe(p);
		return { unsubscribe: () => {
			c = !1, d.cancel(), m.unsubscribe();
		} };
	}
	async connectAgent(e) {
		return this.runHandler.connectAgent(e);
	}
	stopAgent(e) {
		this.runHandler.abortCurrentRun(e.agent), e.agent.abortRun();
	}
	async runAgent(e) {
		return this.runHandler.runAgent(e);
	}
	async runTool(e) {
		return this.runHandler.runTool(e);
	}
	getStateByRun(e, t, n) {
		return this.stateManager.getStateByRun(e, t, n);
	}
	getRunIdForMessage(e, t, n) {
		return this.stateManager.getRunIdForMessage(e, t, n);
	}
	getRawEventForMessage(e, t, n) {
		return this.stateManager.getRawEventForMessage(e, t, n);
	}
	getRunIdsForThread(e, t) {
		return this.stateManager.getRunIdsForThread(e, t);
	}
	buildFrontendTools(e) {
		return this.runHandler.buildFrontendTools(e);
	}
	async waitForPendingFrameworkUpdates() {}
}, Fv = /* @__PURE__ */ function(e) {
	return e.InProgress = "inProgress", e.Executing = "executing", e.Complete = "complete", e;
}({}), Iv = "thread_metadata", Lv = "thread_run_activity", Rv = "/threads/subscribe", zv = 5, Bv = 15e3, Vv = {
	threads: [],
	isLoading: !1,
	isFetchingNextPage: !1,
	error: null,
	fetchMoreError: null,
	context: null,
	sessionId: 0,
	metadataCredentialsRequested: !1,
	metadataJoinCode: null,
	nextCursor: null,
	inFlightMutationCount: 0,
	pendingDeletes: {}
}, Q = V_("Thread Adapter", {
	started: B_(),
	stopped: B_(),
	contextChanged: G(),
	fetchNextPageRequested: B_(),
	renameRequested: G(),
	archiveRequested: G(),
	unarchiveRequested: G(),
	deleteRequested: G(),
	newThreadStarted: B_()
}), $ = V_("Thread REST", {
	listRequested: G(),
	listSucceeded: G(),
	listFailed: G(),
	nextPageSucceeded: G(),
	nextPageFailed: G(),
	metadataCredentialsRequested: G(),
	metadataCredentialsSucceeded: G(),
	metadataCredentialsFailed: G(),
	mutationFinished: G()
}), Hv = V_("Thread Socket", {
	opened: G(),
	errored: G(),
	joinFailed: G(),
	joinTimedOut: G(),
	metadataReceived: G(),
	runActivityReceived: G()
}), Uv = V_("Thread Domain", {
	threadUpserted: G(),
	threadDeleted: G()
});
function Wv(e) {
	return [...e].sort((e, t) => {
		let n = e.lastRunAt ?? e.updatedAt ?? e.createdAt;
		return (t.lastRunAt ?? t.updatedAt ?? t.createdAt).localeCompare(n);
	});
}
function Gv(e, t) {
	let n = e.findIndex((e) => e.id === t.id);
	if (n === -1) return Wv([...e, t]);
	let r = [...e];
	return r[n] = t, Wv(r);
}
function Kv(e) {
	return typeof e == "string" && e.length > 0 ? e : void 0;
}
function qv(e, t) {
	if (!t || e.operation === "deleted") return !0;
	let n = Kv(e.thread.agentId);
	return !n || n === t;
}
function Jv(e) {
	let t = Kv(e.threadId ?? e.thread_id), n = Kv(e.eventType ?? e.event_type);
	return !t || !n ? null : {
		type: "thread_run_activity",
		threadId: t,
		agentId: Kv(e.agentId ?? e.agent_id),
		runId: Kv(e.runId ?? e.run_id),
		eventType: n,
		latestEventId: Kv(e.latestEventId ?? e.latest_event_id)
	};
}
var Yv = H_(Vv, K(Q.contextChanged, (e, { context: t }) => ({
	...e,
	context: t,
	sessionId: e.sessionId + 1,
	threads: [],
	isLoading: !!t,
	isFetchingNextPage: !1,
	error: null,
	fetchMoreError: null,
	metadataCredentialsRequested: !1,
	metadataJoinCode: null,
	nextCursor: null,
	inFlightMutationCount: 0,
	pendingDeletes: {}
})), K(Q.stopped, (e) => ({
	...e,
	threads: [],
	isLoading: !1,
	isFetchingNextPage: !1,
	error: null,
	fetchMoreError: null,
	metadataCredentialsRequested: !1,
	metadataJoinCode: null,
	nextCursor: null,
	inFlightMutationCount: 0,
	pendingDeletes: {}
})), K($.listRequested, (e, { sessionId: t }) => t !== e.sessionId || !e.context ? e : {
	...e,
	isLoading: !0,
	error: null,
	fetchMoreError: null
}), K($.listSucceeded, (e, { sessionId: t, threads: n, joinCode: r, nextCursor: i }) => {
	if (t !== e.sessionId) return e;
	let a = r !== e.metadataJoinCode;
	return {
		...e,
		threads: Wv(n),
		isLoading: !1,
		error: null,
		fetchMoreError: null,
		metadataJoinCode: r,
		metadataCredentialsRequested: !a && e.metadataCredentialsRequested,
		nextCursor: i
	};
}), K($.listFailed, (e, { sessionId: t, error: n }) => t === e.sessionId ? {
	...e,
	isLoading: !1,
	error: n
} : e), K($.nextPageSucceeded, (e, { sessionId: t, threads: n, nextCursor: r }) => {
	if (t !== e.sessionId) return e;
	let i = e.threads;
	for (let e of n) i = Gv(i, e);
	return {
		...e,
		threads: i,
		isFetchingNextPage: !1,
		fetchMoreError: null,
		nextCursor: r
	};
}), K($.nextPageFailed, (e, { sessionId: t, error: n }) => t === e.sessionId ? {
	...e,
	isFetchingNextPage: !1,
	fetchMoreError: n
} : e), K($.metadataCredentialsFailed, (e, { sessionId: t }) => t === e.sessionId ? {
	...e,
	metadataCredentialsRequested: !1
} : e), K($.metadataCredentialsRequested, (e, { sessionId: t }) => t === e.sessionId ? {
	...e,
	metadataCredentialsRequested: !0
} : e), K(Q.fetchNextPageRequested, (e) => !e.nextCursor || e.isFetchingNextPage ? e : {
	...e,
	isFetchingNextPage: !0,
	fetchMoreError: null
}), K(Q.renameRequested, (e, { threadId: t, name: n }) => {
	let r = e.threads.find((e) => e.id === t), i = e.inFlightMutationCount + 1;
	return r ? {
		...e,
		threads: Gv(e.threads, {
			...r,
			name: n
		}),
		inFlightMutationCount: i
	} : {
		...e,
		inFlightMutationCount: i
	};
}), K(Q.archiveRequested, (e, { threadId: t }) => {
	let n = e.threads.find((e) => e.id === t), r = e.inFlightMutationCount + 1;
	return n ? e.context?.includeArchived ? {
		...e,
		threads: Gv(e.threads, {
			...n,
			archived: !0
		}),
		inFlightMutationCount: r
	} : {
		...e,
		threads: e.threads.filter((e) => e.id !== t),
		inFlightMutationCount: r
	} : {
		...e,
		inFlightMutationCount: r
	};
}), K(Q.unarchiveRequested, (e, { threadId: t }) => {
	let n = e.threads.find((e) => e.id === t), r = e.inFlightMutationCount + 1;
	return n ? {
		...e,
		threads: Gv(e.threads, {
			...n,
			archived: !1
		}),
		inFlightMutationCount: r
	} : {
		...e,
		inFlightMutationCount: r
	};
}), K(Q.deleteRequested, (e, { requestId: t, threadId: n }) => {
	let r = e.threads.find((e) => e.id === n), i = e.inFlightMutationCount + 1;
	return r ? {
		...e,
		threads: e.threads.filter((e) => e.id !== n),
		pendingDeletes: {
			...e.pendingDeletes,
			[t]: r
		},
		inFlightMutationCount: i
	} : {
		...e,
		inFlightMutationCount: i
	};
}), K(Q.newThreadStarted, (e) => ({
	...e,
	error: null
})), K($.mutationFinished, (e, { outcome: t }) => {
	if (t.sessionId !== e.sessionId) return e;
	let n = Math.max(0, e.inFlightMutationCount - 1);
	if (t.ok) {
		if (e.pendingDeletes[t.requestId] === void 0) return {
			...e,
			inFlightMutationCount: n
		};
		let { [t.requestId]: r, ...i } = e.pendingDeletes;
		return {
			...e,
			inFlightMutationCount: n,
			pendingDeletes: i
		};
	}
	let r = e.pendingDeletes[t.requestId];
	if (r === void 0) return {
		...e,
		inFlightMutationCount: n,
		error: t.error
	};
	let { [t.requestId]: i, ...a } = e.pendingDeletes;
	return {
		...e,
		threads: Gv(e.threads, r),
		pendingDeletes: a,
		inFlightMutationCount: n,
		error: t.error
	};
}), K(Uv.threadUpserted, (e, { sessionId: t, thread: n }) => t === e.sessionId ? {
	...e,
	threads: Gv(e.threads, n)
} : e), K(Uv.threadDeleted, (e, { sessionId: t, threadId: n }) => t === e.sessionId ? {
	...e,
	threads: e.threads.filter((e) => e.id !== n)
} : e));
function Xv() {
	return {
		threads: U_((e) => e.threads),
		isLoading: U_((e) => e.isLoading),
		error: U_((e) => e.error),
		fetchMoreError: U_((e) => e.fetchMoreError),
		hasNextPage: U_((e) => e.nextCursor != null),
		isFetchingNextPage: U_((e) => e.isFetchingNextPage),
		isMutating: U_((e) => e.inFlightMutationCount > 0)
	};
}
var Zv = Xv(), Qv = Zv.threads, $v = Zv.isLoading, ey = Zv.error, ty = Zv.fetchMoreError, ny = Zv.hasNextPage, ry = Zv.isFetchingNextPage, iy = Zv.isMutating, ay = 0;
function oy() {
	return ay += 1, `thread-request-${ay}`;
}
function sy(e, t) {
	return new w((n) => {
		let { fetch: r, selector: i, signal: a, timeoutMs: o, nonCritical: s, ...c } = t, l = new AbortController(), u = {
			...s ? { nonCritical: !0 } : {},
			...o === void 0 ? {} : { selfBounded: !0 }
		}, d = !1, f = () => l.abort();
		a?.aborted ? f() : a?.addEventListener("abort", f, { once: !0 });
		let p = o === void 0 ? void 0 : setTimeout(() => {
			d = !0, u.timedOut = !0, f();
		}, o);
		return r(e, {
			...c,
			signal: l.signal,
			ɵruntimeRequest: u
		}).then((e) => i(e)).then((e) => {
			n.closed || (n.next(e), n.complete());
		}).catch((e) => {
			n.closed || n.error(d ? /* @__PURE__ */ Error("Request timed out") : e);
		}), () => {
			p !== void 0 && clearTimeout(p), a?.removeEventListener("abort", f), f();
		};
	});
}
function cy(e, t, n) {
	return A(() => {
		let r = { agentId: t.agentId };
		t.includeArchived && (r.includeArchived = "true"), t.limit != null && (r.limit = String(t.limit));
		let i = new URLSearchParams(r);
		return sy(`${t.runtimeUrl}/threads?${i.toString()}`, {
			selector: (e) => {
				if (!e.ok) throw Error(`Failed to fetch threads: ${e.status}`);
				return e.json();
			},
			fetch: e.fetch,
			timeoutMs: Bv,
			method: "GET",
			headers: { ...t.headers }
		}).pipe(k((e) => $.listSucceeded({
			sessionId: n,
			threads: e.threads,
			joinCode: typeof e.joinCode == "string" && e.joinCode.length > 0 ? e.joinCode : null,
			nextCursor: e.nextCursor ?? null
		})), oi((e) => D($.listFailed({
			sessionId: n,
			error: e instanceof Error ? e : Error(String(e))
		}))));
	});
}
function ly(e, t, n) {
	return A(() => sy(`${t.runtimeUrl}${Rv}`, {
		selector: async (e) => {
			if (!e.ok) throw Error(`Failed to fetch thread metadata credentials: ${e.status}`);
			return e.json();
		},
		fetch: e.fetch,
		timeoutMs: Bv,
		nonCritical: !0,
		method: "POST",
		headers: {
			...t.headers,
			"Content-Type": "application/json"
		},
		body: JSON.stringify({})
	}).pipe(k((e) => {
		if (typeof e.joinToken != "string" || e.joinToken.length === 0) throw Error("missing joinToken");
		return $.metadataCredentialsSucceeded({
			sessionId: n,
			joinToken: e.joinToken
		});
	}), oi((e) => D($.metadataCredentialsFailed({
		sessionId: n,
		error: e instanceof Error ? e : Error(String(e))
	})))));
}
function uy(e, t, n) {
	return A(() => sy(`${t.runtimeUrl}${n.path}`, {
		selector: async (e) => {
			if (!e.ok) throw Error(`Request failed: ${e.status}`);
			return null;
		},
		fetch: e.fetch,
		method: n.method,
		headers: {
			...t.headers,
			"Content-Type": "application/json"
		},
		body: JSON.stringify(n.body)
	}).pipe(k(() => $.mutationFinished({ outcome: {
		requestId: n.requestId,
		sessionId: n.sessionId,
		ok: !0
	} })), oi((e) => D($.mutationFinished({ outcome: {
		requestId: n.requestId,
		sessionId: n.sessionId,
		ok: !1,
		error: e instanceof Error ? e : Error(String(e))
	} })))));
}
function dy(e) {
	let t = Xv(), n = K_({
		reducer: Yv,
		effects: [
			G_((e, t) => e.pipe(q(Q.contextChanged), ki(t), j(([, e]) => !!e.context), k(([, e]) => $.listRequested({ sessionId: e.sessionId })))),
			G_((t, n) => t.pipe(q($.listRequested), M((r) => n.pipe(k((e) => e.context), j((e) => !!e), fi(1), k((e) => ({
				action: r,
				context: e
			})), Di(t.pipe(q(Q.contextChanged, Q.stopped))), M(({ action: t, context: n }) => cy(e, n, t.sessionId)))))),
			G_((e, t) => e.pipe(q($.listSucceeded), ki(t), j(([e, t]) => e.sessionId === t.sessionId && !t.metadataCredentialsRequested && !!t.context?.wsUrl && !!t.metadataJoinCode), k(([e]) => $.metadataCredentialsRequested({ sessionId: e.sessionId })))),
			G_((t, n) => t.pipe(q($.metadataCredentialsRequested), M((r) => n.pipe(k((e) => e.context), j((e) => !!e), fi(1), k((e) => ({
				action: r,
				context: e
			})), Di(t.pipe(q(Q.contextChanged, Q.stopped))), M(({ action: t, context: n }) => ly(e, n, t.sessionId)))))),
			G_((e, t) => e.pipe(q($.metadataCredentialsSucceeded), ki(t), j(([e, t]) => e.sessionId === t.sessionId && !!t.context?.wsUrl), M(([t, n]) => {
				let r = n.context, i = t.joinToken, a = n.metadataJoinCode, o = e.pipe(q(Q.contextChanged, Q.stopped));
				return A(() => {
					let e = Fh({
						url: r.wsUrl,
						options: {
							params: { join_token: i },
							reconnectAfterMs: Jd(100, 1e4),
							rejoinAfterMs: Jd(1e3, 3e4)
						}
					}).pipe(Ti({
						bufferSize: 1,
						refCount: !0
					})), n = Ih({
						socket$: e,
						topic: `user_meta:${a}`
					}).pipe(Ti({
						bufferSize: 1,
						refCount: !0
					})), s = Bh(e).pipe(Ci()), c = Vh(s, zv).pipe(oi(() => (console.warn(`[threads] WebSocket failed after ${zv} attempts, giving up`), D(void 0))), Ci());
					return ii(s.pipe(k((e) => e.type === "open" ? Hv.opened({ sessionId: t.sessionId }) : Hv.errored({ sessionId: t.sessionId }))), n.pipe(M(({ channel: e }) => Lh(e, Iv)), k((e) => Hv.metadataReceived({
						sessionId: t.sessionId,
						payload: e
					}))), n.pipe(M(({ channel: e }) => Lh(e, Lv)), k((e) => Jv(e)), j((e) => e !== null), k((e) => Hv.runActivityReceived({
						sessionId: t.sessionId,
						notification: e
					}))), Rh(n).pipe(j((e) => e.type !== "joined"), k((e) => e.type === "timeout" ? Hv.joinTimedOut({ sessionId: t.sessionId }) : Hv.joinFailed({ sessionId: t.sessionId })))).pipe(Di(ii(o, c)));
				});
			}))),
			G_((e, t) => e.pipe(q(Hv.metadataReceived), ki(t), j(([e, t]) => e.sessionId === t.sessionId && qv(e.payload, t.context?.agentId)), k(([e, t]) => e.payload.operation === "deleted" ? Uv.threadDeleted({
				sessionId: e.sessionId,
				threadId: e.payload.deleted.id
			}) : e.payload.operation === "archived" && !t.context?.includeArchived ? Uv.threadDeleted({
				sessionId: e.sessionId,
				threadId: e.payload.threadId
			}) : Uv.threadUpserted({
				sessionId: e.sessionId,
				thread: e.payload.thread
			})))),
			G_((e, t) => e.pipe(q(Hv.joinFailed, Hv.joinTimedOut, Hv.errored, $.metadataCredentialsFailed), ki(t), j(([e, t]) => e.sessionId === t.sessionId), Oi(([e]) => {
				let t = Hv.joinTimedOut.match(e) ? "channel join timed out" : Hv.joinFailed.match(e) ? "channel join was rejected" : $.metadataCredentialsFailed.match(e) ? "metadata credentials fetch failed" : "socket errored";
				console.warn(`[threads] realtime ${t}; the thread list may be stale until reconnect`);
			})), { dispatch: !1 }),
			G_((t, n) => t.pipe(q(Q.fetchNextPageRequested), ki(n), j(([, e]) => !!e.context && !!e.nextCursor), M(([, n]) => {
				let r = n.context, i = {
					agentId: r.agentId,
					cursor: n.nextCursor
				};
				return r.includeArchived && (i.includeArchived = "true"), r.limit != null && (i.limit = String(r.limit)), sy(`${r.runtimeUrl}/threads?${new URLSearchParams(i).toString()}`, {
					selector: (e) => {
						if (!e.ok) throw Error(`Failed to fetch next page: ${e.status}`);
						return e.json();
					},
					fetch: e.fetch,
					timeoutMs: Bv,
					method: "GET",
					headers: { ...r.headers }
				}).pipe(k((e) => $.nextPageSucceeded({
					sessionId: n.sessionId,
					threads: e.threads,
					nextCursor: e.nextCursor ?? null
				})), oi((e) => D($.nextPageFailed({
					sessionId: n.sessionId,
					error: e instanceof Error ? e : Error(String(e))
				}))), Di(t.pipe(q(Q.contextChanged, Q.stopped))));
			}))),
			G_((t, n) => t.pipe(q(Q.renameRequested, Q.archiveRequested, Q.unarchiveRequested, Q.deleteRequested), ki(n), $r(([t, n]) => {
				let r = n.sessionId, i = n.context;
				if (!i?.runtimeUrl) {
					let e = t.requestId;
					return D($.mutationFinished({ outcome: {
						requestId: e,
						sessionId: r,
						ok: !1,
						error: /* @__PURE__ */ Error("Runtime URL is not configured")
					} }));
				}
				let a = { agentId: i.agentId };
				return Q.renameRequested.match(t) ? uy(e, i, {
					requestId: t.requestId,
					sessionId: r,
					method: "PATCH",
					path: `/threads/${encodeURIComponent(t.threadId)}`,
					body: {
						...a,
						name: t.name
					}
				}) : Q.archiveRequested.match(t) ? uy(e, i, {
					requestId: t.requestId,
					sessionId: r,
					method: "POST",
					path: `/threads/${encodeURIComponent(t.threadId)}/archive`,
					body: a
				}) : Q.unarchiveRequested.match(t) ? uy(e, i, {
					requestId: t.requestId,
					sessionId: r,
					method: "PATCH",
					path: `/threads/${encodeURIComponent(t.threadId)}`,
					body: {
						...a,
						archived: !1
					}
				}) : uy(e, i, {
					requestId: t.requestId,
					sessionId: r,
					method: "DELETE",
					path: `/threads/${encodeURIComponent(t.threadId)}`,
					body: a
				});
			})))
		]
	});
	function r(e) {
		let t = Pr(ii(n.actions$.pipe(q($.mutationFinished), j((t) => t.outcome.requestId === e.requestId), k((e) => e.outcome)), n.actions$.pipe(q(Q.stopped), k(() => ({
			requestId: e.requestId,
			sessionId: n.getState().sessionId,
			ok: !1,
			error: /* @__PURE__ */ Error("Thread store stopped before mutation completed")
		})))).pipe(fi(1))).then((e) => {
			if (!e.ok) throw e.error;
		});
		return n.dispatch(e), t;
	}
	let i = null, a = () => {
		e.onError && !i && (i = n.actions$.pipe(q($.mutationFinished), j((e) => !e.outcome.ok && e.outcome.sessionId === n.getState().sessionId)).subscribe((t) => {
			t.outcome.ok || e.onError?.(t.outcome.error);
		}));
	};
	return {
		start() {
			n.init(), a(), n.dispatch(Q.started());
		},
		stop() {
			n.dispatch(Q.stopped()), i?.unsubscribe(), i = null, n.stop();
		},
		setContext(e) {
			n.dispatch(Q.contextChanged({ context: e }));
		},
		refresh() {
			let { sessionId: e, context: t } = n.getState();
			t && n.dispatch($.listRequested({ sessionId: e }));
		},
		refetchThreads() {
			let { sessionId: e, context: t } = n.getState();
			t && n.dispatch($.listRequested({ sessionId: e }));
		},
		startNewThread() {
			n.dispatch(Q.newThreadStarted());
		},
		fetchNextPage() {
			n.dispatch(Q.fetchNextPageRequested());
		},
		renameThread(e, t) {
			return r(Q.renameRequested({
				requestId: oy(),
				threadId: e,
				name: t
			}));
		},
		archiveThread(e) {
			return r(Q.archiveRequested({
				requestId: oy(),
				threadId: e
			}));
		},
		unarchiveThread(e) {
			return r(Q.unarchiveRequested({
				requestId: oy(),
				threadId: e
			}));
		},
		deleteThread(e) {
			return r(Q.deleteRequested({
				requestId: oy(),
				threadId: e
			}));
		},
		subscribeToRunActivity(e) {
			return n.actions$.pipe(q(Hv.runActivityReceived), j((e) => e.sessionId === n.getState().sessionId), k((e) => e.notification)).subscribe(e);
		},
		getState() {
			return n.getState();
		},
		getServerState() {
			return Vv;
		},
		select: n.select.bind(n),
		selectors: t
	};
}
var fy = Qv, py = $v, my = ey, hy = ty, gy = ny, _y = ry, vy = iy, yy = Object.freeze([
	"chat",
	"sidebar",
	"popup",
	"threads"
]);
new Set(yy);
var by = "copilotkit:cpk-inspector-thread";
function xy(e) {
	return `${by}:${e}`;
}
function Sy() {
	if (typeof window < "u" && typeof window.addEventListener == "function") return window;
	if (typeof EventTarget > "u") return null;
	let e = globalThis;
	return e.__COPILOTKIT_INSPECTOR_THREAD_EVENT_TARGET__ ??= new EventTarget(), e.__COPILOTKIT_INSPECTOR_THREAD_EVENT_TARGET__;
}
function Cy(e, t) {
	if (typeof CustomEvent < "u") return new CustomEvent(e, { detail: t });
	let n = new Event(e);
	return Object.defineProperty(n, "detail", { value: t }), n;
}
function wy(e) {
	return e.detail;
}
function Ty() {
	return !1;
}
function Ey() {
	return typeof crypto < "u" && "randomUUID" in crypto ? crypto.randomUUID() : `inspector-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
function Dy(e, t) {
	if (!Ty()) return;
	let n = Sy();
	n && n.dispatchEvent(Cy(xy(e), t));
}
function Oy(e, t) {
	if (!Ty()) return () => void 0;
	let n = Sy();
	if (!n) return () => void 0;
	let r = (e) => {
		t(wy(e));
	}, i = xy(e);
	return n.addEventListener(i, r), () => n.removeEventListener(i, r);
}
function ky(e) {
	if (!Ty()) return !1;
	let t = Sy();
	if (!t) return !1;
	let n = {
		payload: e,
		claimed: !1
	};
	return t.dispatchEvent(Cy(xy("view-thread"), n)), n.claimed;
}
function Ay(e) {
	Dy("stop-viewing", e);
}
function jy(e) {
	Dy("active-thread", e);
}
function My(e) {
	Dy("view-thread-result", e);
}
function Ny(e) {
	if (!Ty()) return () => void 0;
	let t = Sy();
	if (!t) return () => void 0;
	let n = (t) => {
		let n = wy(t);
		n.claimed ||= e(n.payload);
	}, r = xy("view-thread");
	return t.addEventListener(r, n), () => t.removeEventListener(r, n);
}
function Py(e) {
	return Oy("stop-viewing", e);
}
function Fy(e) {
	return Oy("active-thread", e);
}
function Iy(e) {
	return Oy("view-thread-result", e);
}
var Ly = "a2ui", Ry = /^(`{3,}|~{3,})(.*)$/, zy = /^target=(.+)$/;
function By(e, t) {
	let n = e.trim();
	if (n.length < t.length) return !1;
	for (let e of n) if (e !== t.char) return !1;
	return !0;
}
function Vy(e) {
	for (let t of e) {
		let e = zy.exec(t);
		if (e) return e[1];
	}
}
function Hy(e, t, n) {
	let r = {
		type: "a2ui",
		index: e.index,
		text: t,
		closed: n
	};
	return e.target !== void 0 && (r.target = e.target), r;
}
function Uy(e) {
	let t = [], n = 0, r = null, i = 0, a = (r) => {
		r > n && t.push({
			type: "markdown",
			text: e.slice(n, r)
		});
	}, o = 0;
	for (; o <= e.length;) {
		let s = e.indexOf("\n", o), c = s < 0 ? e.length : s, l = c > o && e[c - 1] === "\r", u = e.slice(o, l ? c - 1 : c);
		if (r) {
			if (By(u, r)) {
				if (r.index >= 0) {
					let i = e.slice(r.bodyStart, Math.max(r.bodyStart, o));
					t.push(Hy(r, i, !0)), n = l ? c - 1 : c;
				}
				r = null;
			}
		} else {
			let t = Ry.exec(u);
			if (t) {
				let n = t[1] ?? "", l = t[2] ?? "", u = n.charAt(0);
				if (!(u === "`" && l.includes("`"))) {
					let [t = "", ...d] = l.trim().split(/\s+/), f = t === Ly;
					f && a(o), r = {
						char: u,
						length: n.length,
						bodyStart: s < 0 ? e.length : c + 1,
						index: f ? i++ : -1,
						target: f ? Vy(d) : void 0
					};
				}
			}
		}
		if (s < 0) break;
		o = s + 1;
	}
	if (r && r.index >= 0) {
		let { char: n } = r, i = e.slice(r.bodyStart), a = i.lastIndexOf("\n"), o = i.slice(a + 1).replace(/\r$/, "");
		o.length > 0 && [...o].every((e) => e === n) && (i = i.slice(0, a + 1)), t.push(Hy(r, i, !1));
	} else a(e.length);
	return t;
}
var Wy = [
	"createSurface",
	"updateComponents",
	"updateDataModel",
	"deleteSurface"
], Gy = "callRendererFunction", Ky = [...Wy, Gy];
function qy(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function Jy(e) {
	return e === " " || e === "\n" || e === "\r" || e === "	";
}
function Yy(e, t) {
	for (; t < e.length && Jy(e[t]);) t++;
	return t;
}
function Xy(e, t) {
	for (let n = t + 1; n < e.length; n++) if (e[n] === "\\") n++;
	else if (e[n] === "\"") return n;
	return -1;
}
function Zy(e, t) {
	let n = e.trim();
	if (n) try {
		t.push(JSON.parse(n));
	} catch {}
}
function Qy(e, t) {
	let n = t - 1;
	for (; n >= 0 && Jy(e[n]);) n--;
	return n;
}
var $y = /* @__PURE__ */ new Set([
	"id",
	"component",
	"child",
	"children"
]);
function eb(e, t) {
	return e === "children" ? t === "[" || t === "{" : t === "\"";
}
var tb = /^\{\s*"id"\s*:/;
function nb(e) {
	let t = [], n = /* @__PURE__ */ new Set(), r = "", i = 0;
	for (let a = 0; a < e.length; a++) {
		let o = e[a];
		if (o === "\"") {
			let o = Xy(e, a);
			if (o < 0) return null;
			let s = Qy(e, a), c = e[s], l = Yy(e, o + 1);
			if (t[t.length - 1] === "{" && (c === "," || c === "{") && e[l] === ":") {
				let u;
				try {
					u = JSON.parse(e.slice(a, o + 1));
				} catch {
					return null;
				}
				if (typeof u == "string") {
					if (t.length === 1) n.add(u);
					else if ($y.has(u) && !n.has(u) && t.every((e) => e === "{") && eb(u, e[Yy(e, l + 1)])) {
						let o = "}".repeat(t.length - 1);
						c === "," ? (r += e.slice(i, s) + o, i = s) : (r += e.slice(i, a) + o + ",", i = a), t.length = 1, n.add(u);
					}
				}
			}
			a = o;
		} else if (o === "{" || o === "[") t.push(o);
		else if ((o === "}" || o === "]") && (t.pop(), t.length === 0)) return r + e.slice(i, a + 1);
	}
	let a = t.reduceRight((e, t) => e + (t === "{" ? "}" : "]"), "");
	return r + e.slice(i) + a;
}
function rb(e) {
	if (e !== null) try {
		let t = JSON.parse(e);
		return qy(t) ? t : void 0;
	} catch {
		return;
	}
}
function ib(e, t, n) {
	let { repairComponents: r } = n, i = e, a = [], o = [], s = !1, c = -1, l = (e, t) => {
		let n = i.slice(c, e);
		if (!r) {
			Zy(n, a);
			return;
		}
		if (t) try {
			a.push(JSON.parse(n));
			return;
		} catch {}
		let o = rb(nb(n.trim()));
		o !== void 0 && a.push(o);
	};
	for (let e = t + 1; e < i.length; e++) {
		let t = i[e];
		if (s) t === "\\" ? e++ : t === "\"" && (s = !1);
		else if (t === "\"") s = !0, o.length === 0 && c < 0 && (c = e);
		else if (t === "{" || t === "[") {
			if (r && t === "{" && o[o.length - 1] === "{" && tb.test(i.slice(e, e + 24))) {
				let n = Qy(i, e);
				if (i[n] === ",") {
					l(n, !1), o.length = 0, c = e, o.push(t);
					continue;
				}
			}
			o.length === 0 && (c = e), o.push(t);
		} else if (t === "}" || t === "]") {
			if (o.length === 0) return t === "]" ? (c >= 0 && Zy(i.slice(c, e), a), {
				items: a,
				closed: !0
			}) : {
				items: a,
				closed: !1
			};
			o.pop(), o.length === 0 && (l(e + 1, !0), c = -1);
		} else o.length === 0 && (t === "," ? (c >= 0 && Zy(i.slice(c, e), a), c = -1) : c < 0 && !Jy(t) && (c = e));
	}
	return {
		items: a,
		closed: !1
	};
}
function ab(e) {
	for (let t of Ky) {
		let n = e[t];
		if (qy(n)) return {
			key: t,
			inner: n
		};
	}
	return null;
}
function ob(e) {
	if (ab(e)?.key !== Gy) {
		for (let t of Wy) {
			let n = e[t];
			if (qy(n) && typeof n.surfaceId == "string") return n.surfaceId;
		}
		return typeof e.surfaceId == "string" ? e.surfaceId : void 0;
	}
}
function sb(e, t) {
	let n = e[t];
	if (n === "\"") {
		let n = Xy(e, t);
		return n < 0 ? -1 : n + 1;
	}
	if (n === "{" || n === "[") {
		let n = 0;
		for (let r = t; r < e.length; r++) {
			let t = e[r];
			if (t === "\"") {
				let t = Xy(e, r);
				if (t < 0) return -1;
				r = t;
			} else if (t === "{" || t === "[") n++;
			else if ((t === "}" || t === "]") && (n--, n === 0)) return r + 1;
		}
		return -1;
	}
	let r = t;
	for (; r < e.length && !Jy(e[r]) && !",}]".includes(e[r]);) r++;
	return r >= e.length ? -1 : r;
}
function cb(e, t, n) {
	let r = t + 1;
	for (; r < e.length;) {
		r = Yy(e, r);
		let t = e[r];
		if (t === ",") {
			r++;
			continue;
		}
		if (t !== "\"") return;
		let i = Xy(e, r);
		if (i < 0) return;
		let a;
		try {
			a = JSON.parse(e.slice(r, i + 1));
		} catch {
			return;
		}
		if (r = Yy(e, i + 1), e[r] !== ":" || (r = Yy(e, r + 1), r >= e.length) || typeof a == "string" && n(a, r)) return;
		let o = sb(e, r);
		if (o < 0) return;
		r = o;
	}
}
function lb(e, t, n, r) {
	let i = -1;
	return cb(e, t, (t, a) => t === n && ((r === void 0 || e[a] === r) && (i = a), !0)), i;
}
function ub(e, t, n) {
	if (t < 0) return null;
	let r = lb(e, t, n, "\"");
	if (r < 0) return null;
	let i = sb(e, r);
	if (i < 0) return null;
	try {
		let t = JSON.parse(e.slice(r, i));
		return typeof t == "string" ? t : null;
	} catch {
		return null;
	}
}
function db(e, t, n) {
	let r = lb(e, t, n, "{");
	if (r < 0) return;
	let i = sb(e, r);
	if (!(i < 0)) return rb(e.slice(r, i));
}
function fb(e, t) {
	let n = sb(e, t);
	if (n >= 0) try {
		return JSON.parse(e.slice(t, n));
	} catch {
		return;
	}
	if (e[t] !== "{") return;
	let r = {};
	return cb(e, t, (t, n) => {
		let i = sb(e, n);
		if (i >= 0) try {
			r[t] = JSON.parse(e.slice(n, i));
		} catch {}
		else if (e[n] === "[") {
			let { items: i } = ib(e, n, { repairComponents: !1 });
			i.length > 0 && (r[t] = i);
		}
		return !1;
	}), Object.keys(r).length > 0 ? r : void 0;
}
function pb(e) {
	let t = Yy(e, 0);
	if (e[t] !== "{") return null;
	let n = ub(e, t, "version") ?? "v1.0", r = lb(e, t, "updateComponents", "{");
	if (r >= 0) {
		let t = lb(e, r, "components", "[");
		if (t < 0) return null;
		let { items: i } = ib(e, t, { repairComponents: !0 });
		if (i.length === 0) return null;
		let a = ub(e, r, "surfaceId");
		return {
			version: n,
			updateComponents: {
				...a ? { surfaceId: a } : {},
				components: i
			}
		};
	}
	let i = lb(e, t, "updateDataModel", "{");
	if (i >= 0) {
		let t = lb(e, i, "value");
		if (t < 0) return null;
		let r = fb(e, t);
		if (r === void 0) return null;
		let a = ub(e, i, "surfaceId"), o = ub(e, i, "path");
		return {
			version: n,
			updateDataModel: {
				...a ? { surfaceId: a } : {},
				...o ? { path: o } : {},
				value: r
			}
		};
	}
	let a = lb(e, t, "createSurface", "{");
	if (a >= 0) {
		let t = ub(e, a, "surfaceId");
		if (!t) return null;
		let r = ub(e, a, "catalogId"), i = db(e, a, "dataModel"), o = lb(e, a, "components", "["), s = o < 0 ? [] : ib(e, o, { repairComponents: !0 }).items;
		return {
			version: n,
			createSurface: {
				surfaceId: t,
				...r ? { catalogId: r } : {},
				...i ? { dataModel: i } : {},
				...s.length > 0 ? { components: s } : {}
			}
		};
	}
	return null;
}
var mb = RegExp(`^\\{\\s*"(?:version"\\s*:\\s*"v\\d|(?:${Ky.join("|")})"\\s*:\\s*\\{)`);
function hb(e, t) {
	let n = 0, r = !1;
	for (let i = t; i < e.length; i++) {
		let t = e[i];
		if (!(r && (t === "\\" && e[i + 1] !== "\n" ? i++ : (t === "\"" || t === "\n") && (r = !1), t !== "\n"))) {
			if (t === "\n") {
				let t = Yy(e, i + 1);
				if (mb.test(e.slice(t, t + 40))) return {
					end: i + 1,
					balanced: !1
				};
			} else if (t === "\"") r = !0;
			else if (t === "{" || t === "[") n++;
			else if ((t === "}" || t === "]") && (n--, n === 0)) return {
				end: i + 1,
				balanced: !0
			};
		}
	}
	return {
		end: e.length,
		balanced: !1
	};
}
function gb(e) {
	let t = e, n = [], r = [], i = [], a = null, o = (e) => {
		r.push(e.trim());
		let t = pb(e);
		t && n.push(t);
	}, s = -1, c = (e) => {
		if (s < 0) return;
		let n = t.slice(s, e).trim();
		s = -1, n && (i.push(n), r.push(n));
	}, l = 0;
	for (; l < t.length;) {
		let e = t[l];
		if (e === "{") {
			c(l);
			let { end: e, balanced: r } = hb(t, l), i = t.slice(l, e);
			if (r) {
				let e;
				try {
					e = JSON.parse(i);
				} catch {
					e = void 0;
				}
				qy(e) ? n.push(e) : o(i);
			} else if (e < t.length) o(i);
			else {
				a = i;
				let e = pb(i);
				e && n.push(e);
			}
			l = e;
		} else e === "\n" || e === "[" || e === "]" ? c(l) : s < 0 && !Jy(e) && e !== "," && (s = l), l++;
	}
	return c(t.length), {
		operations: n,
		partialObject: a,
		partialLine: a,
		invalidLines: r,
		recovered: i
	};
}
function _b(e) {
	let { operations: t, fallbackSurfaceId: n, catalogId: r } = e, i = e.catalogIds ?? [r], a = t.map(ob).find((e) => !!e) ?? n, o = [], s = [], c = !1;
	for (let e of t) {
		let t = ab(e);
		if (!t) continue;
		let { key: n } = t, l = { ...t.inner }, u = typeof e.version == "string" ? e.version : mf;
		if (n === Gy) s.push({
			version: u,
			[n]: l
		});
		else {
			if (typeof l.surfaceId != "string" && (l.surfaceId = a), n === "createSurface") {
				if (c) {
					let { surfaceId: e, dataModel: t, components: n } = l;
					t !== void 0 && o.push({
						version: u,
						updateDataModel: {
							surfaceId: e,
							path: "/",
							value: t
						}
					}), Array.isArray(n) && n.length > 0 && o.push({
						version: u,
						updateComponents: {
							surfaceId: e,
							components: n
						}
					});
					continue;
				}
				c = !0, i.includes(l.catalogId) || (l.catalogId = r);
			}
			o.push({
				version: u,
				[n]: l
			});
		}
	}
	return !c && o.length > 0 && o.unshift({
		version: mf,
		createSurface: {
			surfaceId: a,
			catalogId: r
		}
	}), {
		surfaceId: a,
		operations: o,
		functionCalls: s
	};
}
var vb = /* @__PURE__ */ new Set([
	"Button",
	"Pressable",
	"Form",
	"TextField",
	"TextArea",
	"Select",
	"CheckBox",
	"Radio",
	"RadioGroup",
	"Slider",
	"SegmentedControl",
	"ChoicePicker",
	"DateTimeInput"
]);
function yb(e) {
	if (typeof e == "string") return e;
	if (qy(e)) {
		if (typeof e.componentId == "string") return e.componentId;
		if (typeof e.id == "string") return e.id;
	}
}
function bb(e) {
	return qy(e) ? yb(e) : void 0;
}
function xb(e, t) {
	let n = [], r = (e) => {
		e && n.push(e);
	}, i = t?.(e);
	Array.isArray(i) && i.forEach(r), r(yb(e.child));
	let a = e.children;
	if (Array.isArray(a) ? a.forEach((e) => r(yb(e))) : r(yb(a)), Array.isArray(e.columns) && e.columns.forEach((e) => r(bb(e))), Array.isArray(e.rows)) for (let t of e.rows) Array.isArray(t) && t.forEach((e) => r(bb(e)));
	return n;
}
function Sb(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) {
		let e = n.updateComponents, r = qy(e) ? e.components : void 0;
		if (Array.isArray(r)) for (let e of r) qy(e) && typeof e.id == "string" && t.set(e.id, e);
	}
	return t;
}
function Cb(e, t, n) {
	let r = /* @__PURE__ */ new Set(), i = [...xb(t.get(e) ?? {}, n)];
	for (; i.length > 0;) {
		let a = i.pop();
		if (r.has(a) || a === e) continue;
		r.add(a);
		let o = t.get(a);
		o && i.push(...xb(o, n));
	}
	return r;
}
function wb(e, t = {}) {
	let n = /* @__PURE__ */ new Map();
	for (let t of e) qy(t) && typeof t.id == "string" && n.set(t.id, t);
	let r = /* @__PURE__ */ new Set();
	for (let [e, i] of n) if (i.component === "Card") for (let i of Cb(e, n, t.childIds)) {
		let t = n.get(i)?.component;
		if (typeof t == "string" && vb.has(t)) {
			r.add(e);
			break;
		}
	}
	return r;
}
function Tb(e, t = {}) {
	let n = Sb(e);
	if (![...n.values()].some((e) => e.component === "Card")) return e;
	let r = wb([...n.values()], t), i = /* @__PURE__ */ new Set();
	for (let e of r) for (let r of Cb(e, n, t.childIds)) i.add(r);
	let a = (e) => e.component === "Card" && typeof e.id == "string" && !r.has(e.id) && !i.has(e.id) && e.variant == null && e.border == null;
	return e.map((e) => {
		let t = e.updateComponents;
		return !qy(t) || !Array.isArray(t.components) || !t.components.some((e) => qy(e) && a(e)) ? e : {
			...e,
			updateComponents: {
				...t,
				components: t.components.map((e) => qy(e) && a(e) ? {
					...e,
					variant: "section"
				} : e)
			}
		};
	});
}
var Eb = /* @__PURE__ */ new Set([
	"Title",
	"Text",
	"Caption",
	"Markdown"
]);
function Db(e) {
	return e.trim().replace(/\s*\n\s*/g, " ");
}
function Ob(e) {
	if (typeof e == "string") return e.trim() ? Db(e) : null;
	if (!qy(e)) return null;
	for (let t of Object.keys(e)) if (t !== "label" && t !== "description") return null;
	if (typeof e.label != "string" || !e.label.trim()) return null;
	let t = Db(e.label);
	return e.description === void 0 ? t : typeof e.description == "string" ? e.description.trim() ? `**${t}** — ${Db(e.description)}` : t : null;
}
function kb(e) {
	let t = e.children;
	if (t != null && !(Array.isArray(t) && t.length === 0) || !Array.isArray(e.items) || e.items.length === 0) return null;
	let n = [];
	for (let t of e.items) {
		let e = Ob(t);
		if (e === null) return null;
		n.push(e);
	}
	if (e.marker === "number") {
		let t = typeof e.start == "number" && Number.isInteger(e.start) ? e.start : 1;
		return n.map((e, n) => `${t + n}. ${e}`).join("\n");
	}
	return n.map((e) => `- ${e}`).join("\n");
}
function Ab(e) {
	if (!e || e.accessibility !== void 0) return null;
	if (e.component === "Divider") return { kind: "divider" };
	if (e.component === "Spacer") return { kind: "spacer" };
	if (e.component === "List") {
		if (e.direction !== void 0 && e.direction !== "vertical") return null;
		let t = kb(e);
		return t === null ? null : {
			kind: "text",
			markdown: t
		};
	}
	if (typeof e.component != "string" || !Eb.has(e.component) || typeof e.text != "string" || e.text.trim() === "") return null;
	let t = e.text.trim();
	switch (e.component) {
		case "Title": {
			let n = typeof e.size == "string" ? e.size : "md";
			return {
				kind: "text",
				markdown: `${n === "sm" ? "####" : n === "md" || n === "lg" ? "###" : "##"} ${t}`
			};
		}
		case "Text": return xb(e).length > 0 ? null : {
			kind: "text",
			markdown: e.strong === !0 ? `**${t}**` : t
		};
		default: return {
			kind: "text",
			markdown: t
		};
	}
}
function jb(e) {
	let t = [], n = !1;
	for (let r of e) r?.kind === "text" ? (n && t.length > 0 && t.push("---"), n = !1, t.push(r.markdown)) : r?.kind === "divider" && (n = !0);
	return t.join("\n\n");
}
function Mb(e, t) {
	return e.accessibility === void 0 ? e.component === "Column" ? !0 : e.component === "Box" ? e.direction == null || e.direction === "col" : e.component === "Card" && (e.variant == null || e.variant === "section") && typeof e.id == "string" && !t.has(e.id) : !1;
}
function Nb(e) {
	let t = typeof e.child == "string" ? [e.child] : [];
	return Array.isArray(e.children) ? [...t, ...e.children] : t.length > 0 && e.children === void 0 ? t : null;
}
function Pb(e) {
	let t = [], n = 0;
	for (; n < e.length;) {
		let r = e[n] !== null, i = !1, a = n;
		for (; a < e.length && e[a] !== null === r;) e[a]?.kind === "text" && (i = !0), a++;
		let o = r && i, s = t[t.length - 1];
		!o && s && !s.prose ? s.end = a : t.push({
			prose: o,
			start: n,
			end: a
		}), n = a;
	}
	return t;
}
function Fb(e, t = {}) {
	let n = [{
		kind: "surface",
		components: e
	}], r = /* @__PURE__ */ new Map();
	for (let t of e) qy(t) && typeof t.id == "string" && r.set(t.id, t);
	let i = r.get(yf);
	if (!i || e.some((e) => qy(e) && t.childIds?.(e) === "unknown")) return n;
	let a = Ab(i);
	if (a?.kind === "text") return [{
		kind: "markdown",
		markdown: a.markdown
	}];
	let o = wb(e, t), s = i, c = yf, l, u = /* @__PURE__ */ new Set();
	for (;;) {
		if (!Mb(s, o)) return n;
		u.add(c);
		let e = Nb(s);
		if (!e) return n;
		l = e;
		let t = e.length === 1 ? e[0] : void 0;
		if (typeof t != "string") break;
		let i = r.get(t);
		if (!i || u.has(t) || Ab(i)) break;
		s = i, c = t;
	}
	let d = l, f = d.map((e) => typeof e == "string" ? Ab(r.get(e)) : null), p = Pb(f);
	if (!p.some((e) => e.prose)) return n;
	let m = p.filter((e) => !e.prose), h = /* @__PURE__ */ new Map();
	m.forEach((e, n) => {
		let i = d.slice(e.start, e.end).map(yb).filter((e) => e !== void 0), a = /* @__PURE__ */ new Set();
		for (; i.length > 0;) {
			let e = i.pop();
			if (e === "root" || e === c || a.has(e)) continue;
			a.add(e);
			let o = h.get(e);
			o ? o.push(n) : h.set(e, [n]);
			let s = r.get(e);
			s && i.push(...xb(s, t.childIds));
		}
	});
	let g = m.map((e) => {
		let { child: t, ...n } = s, r = {
			...n,
			id: yf,
			children: d.slice(e.start, e.end)
		};
		return delete r.child, [r];
	});
	for (let t of e) {
		if (!qy(t) || typeof t.id != "string" || r.get(t.id) !== t) continue;
		let e = h.get(t.id) ?? [];
		for (let n of e) g[n].push(t);
	}
	let ee = 0;
	return p.map((e) => e.prose ? {
		kind: "markdown",
		markdown: jb(f.slice(e.start, e.end))
	} : {
		kind: "surface",
		components: g[ee++]
	});
}
// node_modules/.pnpm/@lit+reactive-element@2.1.2/node_modules/@lit/reactive-element/css-tag.js
var Ib = globalThis, Lb = Ib.ShadowRoot && (Ib.ShadyCSS === void 0 || Ib.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Rb = Symbol(), zb = /* @__PURE__ */ new WeakMap(), Bb = class {
	constructor(e, t, n) {
		if (this._$cssResult$ = !0, n !== Rb) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
		this.cssText = e, this.t = t;
	}
	get styleSheet() {
		let e = this.o, t = this.t;
		if (Lb && e === void 0) {
			let n = t !== void 0 && t.length === 1;
			n && (e = zb.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), n && zb.set(t, e));
		}
		return e;
	}
	toString() {
		return this.cssText;
	}
}, Vb = (e) => new Bb(typeof e == "string" ? e : e + "", void 0, Rb), Hb = (e, ...t) => new Bb(e.length === 1 ? e[0] : t.reduce((t, n, r) => t + ((e) => {
	if (!0 === e._$cssResult$) return e.cssText;
	if (typeof e == "number") return e;
	throw Error("Value passed to 'css' function must be a 'css' function result: " + e + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
})(n) + e[r + 1], e[0]), e, Rb), Ub = (e, t) => {
	if (Lb) e.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
	else for (let n of t) {
		let t = document.createElement("style"), r = Ib.litNonce;
		r !== void 0 && t.setAttribute("nonce", r), t.textContent = n.cssText, e.appendChild(t);
	}
}, Wb = Lb ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((e) => {
	let t = "";
	for (let n of e.cssRules) t += n.cssText;
	return Vb(t);
})(e) : e, { is: Gb, defineProperty: Kb, getOwnPropertyDescriptor: qb, getOwnPropertyNames: Jb, getOwnPropertySymbols: Yb, getPrototypeOf: Xb } = Object, Zb = globalThis, Qb = Zb.trustedTypes, $b = Qb ? Qb.emptyScript : "", ex = Zb.reactiveElementPolyfillSupport, tx = (e, t) => e, nx = {
	toAttribute(e, t) {
		switch (t) {
			case Boolean:
				e = e ? $b : null;
				break;
			case Object:
			case Array: e = e == null ? e : JSON.stringify(e);
		}
		return e;
	},
	fromAttribute(e, t) {
		let n = e;
		switch (t) {
			case Boolean:
				n = e !== null;
				break;
			case Number:
				n = e === null ? null : Number(e);
				break;
			case Object:
			case Array: try {
				n = JSON.parse(e);
			} catch {
				n = null;
			}
		}
		return n;
	}
}, rx = (e, t) => !Gb(e, t), ix = {
	attribute: !0,
	type: String,
	converter: nx,
	reflect: !1,
	useDefault: !1,
	hasChanged: rx
};
Symbol.metadata ??= Symbol("metadata"), Zb.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var ax = class extends HTMLElement {
	static addInitializer(e) {
		this._$Ei(), (this.l ??= []).push(e);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(e, t = ix) {
		if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
			let n = Symbol(), r = this.getPropertyDescriptor(e, n, t);
			r !== void 0 && Kb(this.prototype, e, r);
		}
	}
	static getPropertyDescriptor(e, t, n) {
		let { get: r, set: i } = qb(this.prototype, e) ?? {
			get() {
				return this[t];
			},
			set(e) {
				this[t] = e;
			}
		};
		return {
			get: r,
			set(t) {
				let a = r?.call(this);
				i?.call(this, t), this.requestUpdate(e, a, n);
			},
			configurable: !0,
			enumerable: !0
		};
	}
	static getPropertyOptions(e) {
		return this.elementProperties.get(e) ?? ix;
	}
	static _$Ei() {
		if (this.hasOwnProperty(tx("elementProperties"))) return;
		let e = Xb(this);
		e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(tx("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(tx("properties"))) {
			let e = this.properties, t = [...Jb(e), ...Yb(e)];
			for (let n of t) this.createProperty(n, e[n]);
		}
		let e = this[Symbol.metadata];
		if (e !== null) {
			let t = litPropertyMetadata.get(e);
			if (t !== void 0) for (let [e, n] of t) this.elementProperties.set(e, n);
		}
		this._$Eh = /* @__PURE__ */ new Map();
		for (let [e, t] of this.elementProperties) {
			let n = this._$Eu(e, t);
			n !== void 0 && this._$Eh.set(n, e);
		}
		this.elementStyles = this.finalizeStyles(this.styles);
	}
	static finalizeStyles(e) {
		let t = [];
		if (Array.isArray(e)) {
			let n = new Set(e.flat(1 / 0).reverse());
			for (let e of n) t.unshift(Wb(e));
		} else e !== void 0 && t.push(Wb(e));
		return t;
	}
	static _$Eu(e, t) {
		let n = t.attribute;
		return !1 === n ? void 0 : typeof n == "string" ? n : typeof e == "string" ? e.toLowerCase() : void 0;
	}
	constructor() {
		super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
	}
	_$Ev() {
		this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((e) => e(this));
	}
	addController(e) {
		(this._$EO ??= /* @__PURE__ */ new Set()).add(e), this.renderRoot !== void 0 && this.isConnected && e.hostConnected?.();
	}
	removeController(e) {
		this._$EO?.delete(e);
	}
	_$E_() {
		let e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
		for (let n of t.keys()) this.hasOwnProperty(n) && (e.set(n, this[n]), delete this[n]);
		e.size > 0 && (this._$Ep = e);
	}
	createRenderRoot() {
		let e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
		return Ub(e, this.constructor.elementStyles), e;
	}
	connectedCallback() {
		this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
	}
	enableUpdating(e) {}
	disconnectedCallback() {
		this._$EO?.forEach((e) => e.hostDisconnected?.());
	}
	attributeChangedCallback(e, t, n) {
		this._$AK(e, n);
	}
	_$ET(e, t) {
		let n = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, n);
		if (r !== void 0 && !0 === n.reflect) {
			let i = (n.converter?.toAttribute === void 0 ? nx : n.converter).toAttribute(t, n.type);
			this._$Em = e, i == null ? this.removeAttribute(r) : this.setAttribute(r, i), this._$Em = null;
		}
	}
	_$AK(e, t) {
		let n = this.constructor, r = n._$Eh.get(e);
		if (r !== void 0 && this._$Em !== r) {
			let e = n.getPropertyOptions(r), i = typeof e.converter == "function" ? { fromAttribute: e.converter } : e.converter?.fromAttribute === void 0 ? nx : e.converter;
			this._$Em = r;
			let a = i.fromAttribute(t, e.type);
			this[r] = a ?? this._$Ej?.get(r) ?? a, this._$Em = null;
		}
	}
	requestUpdate(e, t, n, r = !1, i) {
		if (e !== void 0) {
			let a = this.constructor;
			if (!1 === r && (i = this[e]), n ??= a.getPropertyOptions(e), !((n.hasChanged ?? rx)(i, t) || n.useDefault && n.reflect && i === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, n)))) return;
			this.C(e, t, n);
		}
		!1 === this.isUpdatePending && (this._$ES = this._$EP());
	}
	C(e, t, { useDefault: n, reflect: r, wrapped: i }, a) {
		n && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, a ?? t ?? this[e]), !0 !== i || a !== void 0) || (this._$AL.has(e) || (this.hasUpdated || n || (t = void 0), this._$AL.set(e, t)), !0 === r && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
	}
	async _$EP() {
		this.isUpdatePending = !0;
		try {
			await this._$ES;
		} catch (e) {
			Promise.reject(e);
		}
		let e = this.scheduleUpdate();
		return e != null && await e, !this.isUpdatePending;
	}
	scheduleUpdate() {
		return this.performUpdate();
	}
	performUpdate() {
		if (!this.isUpdatePending) return;
		if (!this.hasUpdated) {
			if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
				for (let [e, t] of this._$Ep) this[e] = t;
				this._$Ep = void 0;
			}
			let e = this.constructor.elementProperties;
			if (e.size > 0) for (let [t, n] of e) {
				let { wrapped: e } = n, r = this[t];
				!0 !== e || this._$AL.has(t) || r === void 0 || this.C(t, void 0, n, r);
			}
		}
		let e = !1, t = this._$AL;
		try {
			e = this.shouldUpdate(t), e ? (this.willUpdate(t), this._$EO?.forEach((e) => e.hostUpdate?.()), this.update(t)) : this._$EM();
		} catch (t) {
			throw e = !1, this._$EM(), t;
		}
		e && this._$AE(t);
	}
	willUpdate(e) {}
	_$AE(e) {
		this._$EO?.forEach((e) => e.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
	}
	_$EM() {
		this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
	}
	get updateComplete() {
		return this.getUpdateComplete();
	}
	getUpdateComplete() {
		return this._$ES;
	}
	shouldUpdate(e) {
		return !0;
	}
	update(e) {
		this._$Eq &&= this._$Eq.forEach((e) => this._$ET(e, this[e])), this._$EM();
	}
	updated(e) {}
	firstUpdated(e) {}
};
ax.elementStyles = [], ax.shadowRootOptions = { mode: "open" }, ax[tx("elementProperties")] = /* @__PURE__ */ new Map(), ax[tx("finalized")] = /* @__PURE__ */ new Map(), ex?.({ ReactiveElement: ax }), (Zb.reactiveElementVersions ??= []).push("2.1.2");
// node_modules/.pnpm/lit-html@3.3.3/node_modules/lit-html/lit-html.js
var ox = globalThis, sx = (e) => e, cx = ox.trustedTypes, lx = cx ? cx.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, ux = "$lit$", dx = `lit$${Math.random().toFixed(9).slice(2)}$`, fx = "?" + dx, px = `<${fx}>`, mx = document, hx = () => mx.createComment(""), gx = (e) => e === null || typeof e != "object" && typeof e != "function", _x = Array.isArray, vx = (e) => _x(e) || typeof e?.[Symbol.iterator] == "function", yx = "[ 	\n\f\r]", bx = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, xx = /-->/g, Sx = />/g, Cx = RegExp(`>|${yx}(?:([^\\s"'>=/]+)(${yx}*=${yx}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), wx = /'/g, Tx = /"/g, Ex = /^(?:script|style|textarea|title)$/i, Dx = ((e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}))(1), Ox = Symbol.for("lit-noChange"), kx = Symbol.for("lit-nothing"), Ax = /* @__PURE__ */ new WeakMap(), jx = mx.createTreeWalker(mx, 129);
function Mx(e, t) {
	if (!_x(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return lx === void 0 ? t : lx.createHTML(t);
}
var Nx = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = bx;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === bx ? c[1] === "!--" ? o = xx : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = Cx) : (Ex.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = Cx) : o = Sx : o === Cx ? c[0] === ">" ? (o = i ?? bx, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? Cx : c[3] === "\"" ? Tx : wx) : o === Tx || o === wx ? o = Cx : o === xx || o === Sx ? o = bx : (o = Cx, i = void 0);
		let d = o === Cx && e[t + 1].startsWith("/>") ? " " : "";
		a += o === bx ? n + px : l >= 0 ? (r.push(s), n.slice(0, l) + ux + n.slice(l) + dx + d) : n + dx + (l === -2 ? t : d);
	}
	return [Mx(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, Px = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = Nx(t, n);
		if (this.el = e.createElement(l, r), jx.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = jx.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(ux)) {
					let t = u[o++], n = i.getAttribute(e).split(dx), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? zx : r[1] === "?" ? Bx : r[1] === "@" ? Vx : Rx
					}), i.removeAttribute(e);
				} else e.startsWith(dx) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (Ex.test(i.tagName)) {
					let e = i.textContent.split(dx), t = e.length - 1;
					if (t > 0) {
						i.textContent = cx ? cx.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], hx()), jx.nextNode(), c.push({
							type: 2,
							index: ++a
						});
						i.append(e[t], hx());
					}
				}
			} else if (i.nodeType === 8) {
				if (i.data === fx) c.push({
					type: 2,
					index: a
				});
				else {
					let e = -1;
					for (; (e = i.data.indexOf(dx, e + 1)) !== -1;) c.push({
						type: 7,
						index: a
					}), e += dx.length - 1;
				}
			}
			a++;
		}
	}
	static createElement(e, t) {
		let n = mx.createElement("template");
		return n.innerHTML = e, n;
	}
};
function Fx(e, t, n = e, r) {
	if (t === Ox) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = gx(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = Fx(e, i._$AS(e, t.values), i, r)), t;
}
var Ix = class {
	constructor(e, t) {
		this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
	}
	get parentNode() {
		return this._$AM.parentNode;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	u(e) {
		let { el: { content: t }, parts: n } = this._$AD, r = (e?.creationScope ?? mx).importNode(t, !0);
		jx.currentNode = r;
		let i = jx.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new Lx(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new Hx(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = jx.nextNode(), a++);
		}
		return jx.currentNode = mx, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, Lx = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = kx, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
	}
	get parentNode() {
		let e = this._$AA.parentNode, t = this._$AM;
		return t !== void 0 && e?.nodeType === 11 && (e = t.parentNode), e;
	}
	get startNode() {
		return this._$AA;
	}
	get endNode() {
		return this._$AB;
	}
	_$AI(e, t = this) {
		e = Fx(this, e, t), gx(e) ? e === kx || e == null || e === "" ? (this._$AH !== kx && this._$AR(), this._$AH = kx) : e !== this._$AH && e !== Ox && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? vx(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== kx && gx(this._$AH) ? this._$AA.nextSibling.data = e : this.T(mx.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = Px.createElement(Mx(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new Ix(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = Ax.get(e.strings);
		return t === void 0 && Ax.set(e.strings, t = new Px(e)), t;
	}
	k(t) {
		_x(this._$AH) || (this._$AH = [], this._$AR());
		let n = this._$AH, r, i = 0;
		for (let a of t) i === n.length ? n.push(r = new e(this.O(hx()), this.O(hx()), this, this.options)) : r = n[i], r._$AI(a), i++;
		i < n.length && (this._$AR(r && r._$AB.nextSibling, i), n.length = i);
	}
	_$AR(e = this._$AA.nextSibling, t) {
		for (this._$AP?.(!1, !0, t); e !== this._$AB;) {
			let t = sx(e).nextSibling;
			sx(e).remove(), e = t;
		}
	}
	setConnected(e) {
		this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
	}
}, Rx = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = kx, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = kx;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = Fx(this, e, t, 0), a = !gx(e) || e !== this._$AH && e !== Ox, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = Fx(this, r[n + o], t, o), s === Ox && (s = this._$AH[o]), a ||= !gx(s) || s !== this._$AH[o], s === kx ? e = kx : e !== kx && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === kx ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, zx = class extends Rx {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === kx ? void 0 : e;
	}
}, Bx = class extends Rx {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== kx);
	}
}, Vx = class extends Rx {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = Fx(this, e, t, 0) ?? kx) === Ox) return;
		let n = this._$AH, r = e === kx && n !== kx || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== kx && (n === kx || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, Hx = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		Fx(this, e);
	}
}, Ux = {
	M: ux,
	P: dx,
	A: fx,
	C: 1,
	L: Nx,
	R: Ix,
	D: vx,
	V: Fx,
	I: Lx,
	H: Rx,
	N: Bx,
	U: Vx,
	B: zx,
	F: Hx
}, Wx = ox.litHtmlPolyfillSupport;
Wx?.(Px, Lx), (ox.litHtmlVersions ??= []).push("3.3.3");
var Gx = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new Lx(t.insertBefore(hx(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, Kx = globalThis, qx = class extends ax {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Gx(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return Ox;
	}
};
qx._$litElement$ = !0, qx.finalized = !0, Kx.litElementHydrateSupport?.({ LitElement: qx });
var Jx = Kx.litElementPolyfillSupport;
Jx?.({ LitElement: qx }), (Kx.litElementVersions ??= []).push("4.2.2");
// node_modules/.pnpm/lit-html@3.3.3/node_modules/lit-html/directive.js
var Yx = {
	ATTRIBUTE: 1,
	CHILD: 2,
	PROPERTY: 3,
	BOOLEAN_ATTRIBUTE: 4,
	EVENT: 5,
	ELEMENT: 6
}, Xx = (e) => (...t) => ({
	_$litDirective$: e,
	values: t
}), Zx = class {
	constructor(e) {}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AT(e, t, n) {
		this._$Ct = e, this._$AM = t, this._$Ci = n;
	}
	_$AS(e, t) {
		return this.update(e, t);
	}
	update(e, t) {
		return this.render(...t);
	}
};
export { bf as $, Ny as A, Dv as B, gb as C, qe as Ct, $h as D, Ty as E, jh as F, fy as G, kv as H, hy as I, Pg as J, my as K, gy as L, _b as M, Fb as N, Fy as O, Uy as P, hf as Q, _y as R, My as S, Rt as St, ob as T, Ov as U, Av as V, jv as W, xf as X, Gp as Y, mf as Z, Ey as _, qd as _t, kx as a, sf as at, Ay as b, Mt as bt, Dx as c, cf as ct, Vb as d, pf as dt, vf as et, Pv as f, of as ft, Fv as g, Zd as gt, hg as h, Xd as ht, qx as i, Sf as it, Iy as j, Py as k, Ux as l, uf as lt, Z as m, Yd as mt, Zx as n, _f as nt, Gx as o, lf as ot, X as p, tf as pt, py as q, Yx as r, yf as rt, Ox as s, df as st, Xx as t, gf as tt, Hb as u, ff as ut, dy as v, Ud as vt, Tb as w, ky as x, Nt as xt, jy as y, Ad as yt, vy as z };
