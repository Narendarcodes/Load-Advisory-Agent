import { i as e, n as t, t as n } from "./rolldown-runtime-CwxnZyOB.js";
import { t as r } from "./v4-DpgXktep.js";
import { S as i, c as a, d as o, l as s, m as c, o as l, p as u, r as d, s as f, t as p, u as m, x as h } from "./random-id-Dq3iPRBO.js";
// node_modules/@tanstack/pacer/dist/utils.js
function g(e) {
	return typeof e == "function";
}
function ee(e, ...t) {
	return g(e) ? e(...t) : e;
}
// node_modules/@tanstack/devtools-event-client/dist/esm/plugin.js
var te = class {
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
}, ne = /* @__PURE__ */ new Map();
function re(e, t) {
	ne.set(e, t);
}
function ie(e) {
	if (e !== void 0) try {
		return JSON.parse(JSON.stringify(e));
	} catch {
		return null;
	}
}
function ae(e) {
	return typeof e.get == "function" ? e.get() : e.state;
}
function oe(e) {
	return {
		key: e.key,
		store: { state: ie(ae(e.store)) },
		options: ie(e.options)
	};
}
var se = class extends te {
	constructor(e) {
		super({
			pluginId: "pacer",
			debug: e?.debug,
			reconnectEveryMs: 1e3
		});
	}
}, ce = (e, t) => {
	let n = t.key;
	n && (re(n, t), le.emit(e, oe({
		...t,
		key: n
	})));
}, le = new se(), ue = /* @__PURE__ */ ((e) => (e[e.None = 0] = "None", e[e.Mutable = 1] = "Mutable", e[e.Watching = 2] = "Watching", e[e.RecursedCheck = 4] = "RecursedCheck", e[e.Recursed = 8] = "Recursed", e[e.Dirty = 16] = "Dirty", e[e.Pending = 32] = "Pending", e))(ue || {});
// @__NO_SIDE_EFFECTS__
function de({ update: e, notify: t, unwatched: n }) {
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
// node_modules/@tanstack/store/dist/esm/atom.js
function fe(e, t, n) {
	let r = typeof e == "object", i = r ? e : void 0;
	return {
		next: (r ? e.next : e)?.bind(i),
		error: (r ? e.error : t)?.bind(i),
		complete: (r ? e.complete : n)?.bind(i)
	};
}
var pe = [], me = 0, { link: he, unlink: ge, propagate: _e, checkDirty: ve, shallowPropagate: ye } = /* @__PURE__ */ de({
	update(e) {
		return e._update();
	},
	notify(e) {
		pe[xe++] = e, e.flags &= ~ue.Watching;
	},
	unwatched(e) {
		e.depsTail !== void 0 && (e.depsTail = void 0, e.flags = ue.Mutable | ue.Dirty, we(e));
	}
}), be = 0, xe = 0, Se, Ce = 0;
function we(e) {
	let t = e.depsTail, n = t === void 0 ? e.deps : t.nextDep;
	for (; n !== void 0;) n = ge(n, e);
}
function Te() {
	if (!(Ce > 0)) {
		for (; be < xe;) {
			let e = pe[be];
			pe[be++] = void 0, e.notify();
		}
		be = 0, xe = 0;
	}
}
function Ee(e, t) {
	let n = typeof e == "function", r = e, i = {
		_snapshot: n ? void 0 : e,
		subs: void 0,
		subsTail: void 0,
		deps: void 0,
		depsTail: void 0,
		flags: n ? ue.None : ue.Mutable,
		get() {
			return Se !== void 0 && he(i, Se, me), i._snapshot;
		},
		subscribe(e) {
			let t = fe(e), n = { current: !1 }, r = De(() => {
				i.get(), n.current ? t.next?.(i._snapshot) : n.current = !0;
			});
			return { unsubscribe: () => {
				r.stop();
			} };
		},
		_update(e) {
			let a = Se, o = t?.compare ?? Object.is;
			if (n) Se = i, ++me, i.depsTail = void 0;
			else if (e === void 0) return !1;
			n && (i.flags = ue.Mutable | ue.RecursedCheck);
			try {
				let t = i._snapshot, a = typeof e == "function" ? e(t) : e === void 0 && n ? r(t) : e;
				return t === void 0 || !o(t, a) ? (i._snapshot = a, !0) : !1;
			} finally {
				Se = a, n && (i.flags &= ~ue.RecursedCheck), we(i);
			}
		}
	};
	return n ? (i.flags = ue.Mutable | ue.Dirty, i.get = function() {
		let e = i.flags;
		if (e & ue.Dirty || e & ue.Pending && ve(i.deps, i)) {
			if (i._update()) {
				let e = i.subs;
				e !== void 0 && ye(e);
			}
		} else e & ue.Pending && (i.flags = e & ~ue.Pending);
		return Se !== void 0 && he(i, Se, me), i._snapshot;
	}) : i.set = function(e) {
		if (i._update(e)) {
			let e = i.subs;
			e !== void 0 && (_e(e), ye(e), Te());
		}
	}, i;
}
function De(e) {
	let t = () => {
		let t = Se;
		Se = n, ++me, n.depsTail = void 0, n.flags = ue.Watching | ue.RecursedCheck;
		try {
			return e();
		} finally {
			Se = t, n.flags &= ~ue.RecursedCheck, we(n);
		}
	}, n = {
		deps: void 0,
		depsTail: void 0,
		subs: void 0,
		subsTail: void 0,
		flags: ue.Watching | ue.RecursedCheck,
		notify() {
			let e = this.flags;
			e & ue.Dirty || e & ue.Pending && ve(this.deps, this) ? t() : this.flags = ue.Watching;
		},
		stop() {
			this.flags = ue.None, this.depsTail = void 0, we(this);
		}
	};
	return t(), n;
}
// node_modules/@tanstack/store/dist/esm/store.js
var Oe = class {
	constructor(e) {
		this.atom = Ee(e);
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
		return this.atom.subscribe(fe(e));
	}
};
// node_modules/@tanstack/pacer/dist/throttler.js
function ke() {
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
var Ae = {
	enabled: !0,
	leading: !0,
	trailing: !0,
	wait: 0
}, je = class {
	#e;
	constructor(e, t) {
		this.fn = e, this.store = new Oe(ke()), this.setOptions = (e) => {
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
			this.#t(ke());
		}, this.key = t.key, this.options = {
			...Ae,
			...t
		}, this.#t(this.options.initialState ?? {}), this.key && le.on("d-Throttler", (e) => {
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
		}), ce("Throttler", this);
	};
	#n = () => !!ee(this.options.enabled, this);
	#r = () => ee(this.options.wait, this);
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
}, _ = /* @__PURE__ */ function(e) {
	return e.TEXT_MESSAGE_START = "TEXT_MESSAGE_START", e.TEXT_MESSAGE_CONTENT = "TEXT_MESSAGE_CONTENT", e.TEXT_MESSAGE_END = "TEXT_MESSAGE_END", e.TEXT_MESSAGE_CHUNK = "TEXT_MESSAGE_CHUNK", e.TOOL_CALL_START = "TOOL_CALL_START", e.TOOL_CALL_ARGS = "TOOL_CALL_ARGS", e.TOOL_CALL_END = "TOOL_CALL_END", e.TOOL_CALL_CHUNK = "TOOL_CALL_CHUNK", e.TOOL_CALL_RESULT = "TOOL_CALL_RESULT", e.STATE_SNAPSHOT = "STATE_SNAPSHOT", e.STATE_DELTA = "STATE_DELTA", e.MESSAGES_SNAPSHOT = "MESSAGES_SNAPSHOT", e.ACTIVITY_SNAPSHOT = "ACTIVITY_SNAPSHOT", e.ACTIVITY_DELTA = "ACTIVITY_DELTA", e.RAW = "RAW", e.CUSTOM = "CUSTOM", e.RUN_STARTED = "RUN_STARTED", e.RUN_FINISHED = "RUN_FINISHED", e.RUN_ERROR = "RUN_ERROR", e.STEP_STARTED = "STEP_STARTED", e.STEP_FINISHED = "STEP_FINISHED", e.REASONING_START = "REASONING_START", e.REASONING_MESSAGE_START = "REASONING_MESSAGE_START", e.REASONING_MESSAGE_CONTENT = "REASONING_MESSAGE_CONTENT", e.REASONING_MESSAGE_END = "REASONING_MESSAGE_END", e.REASONING_MESSAGE_CHUNK = "REASONING_MESSAGE_CHUNK", e.REASONING_END = "REASONING_END", e.REASONING_ENCRYPTED_VALUE = "REASONING_ENCRYPTED_VALUE", e.SUBAGENT_STARTED = "SUBAGENT_STARTED", e.SUBAGENT_FINISHED = "SUBAGENT_FINISHED", e.SUBAGENT_ERROR = "SUBAGENT_ERROR", e;
}({}), Me = {
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
function Ne(e, t) {
	if (typeof t == "string") return Ne(e, Me[t]);
	if ("array" in t) {
		if (!Array.isArray(e)) return e;
		let n = e.map((e) => Ne(e, t.array));
		return n.every((t, n) => t === e[n]) ? e : n;
	}
	if (typeof e != "object" || !e || Array.isArray(e)) return e;
	let n = e;
	if ("discriminator" in t) {
		let r = n[t.discriminator];
		return typeof r == "string" && Object.prototype.hasOwnProperty.call(t.variants, r) ? Ne(e, t.variants[r]) : e;
	}
	let r = n;
	for (let e of t.optional) Object.prototype.hasOwnProperty.call(n, e) && n[e] === null && (r === n && (r = { ...n }), delete r[e]);
	for (let [e, i] of Object.entries(t.fields)) {
		if (!Object.prototype.hasOwnProperty.call(r, e)) continue;
		let t = Ne(r[e], i);
		t !== r[e] && (r === n && (r = { ...n }), r[e] = t);
	}
	return r;
}
function Pe(e, t) {
	return Ne(e, t);
}
var v = class extends Error {
	constructor(e) {
		super(e);
	}
}, Fe = class extends v {
	constructor() {
		super("Connect not implemented. This method is not supported by the current agent.");
	}
};
function Ie(e, t) {
	return t === void 0 ? e : e === void 0 ? { ...t } : {
		...e,
		...t
	};
}
function Le(e) {
	return e === void 0 ? "" : typeof e == "string" ? e : e.filter((e) => e.type === "text").map((e) => e.text).join("");
}
function Re(e) {
	return Array.isArray(e) && e.some((e) => e.type !== "text");
}
// node_modules/fast-json-patch/module/helpers.mjs
var ze = (function() {
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
})(), Be = Object.prototype.hasOwnProperty;
function Ve(e, t) {
	return Be.call(e, t);
}
function He(e) {
	if (Array.isArray(e)) {
		for (var t = Array(e.length), n = 0; n < t.length; n++) t[n] = "" + n;
		return t;
	}
	if (Object.keys) return Object.keys(e);
	var r = [];
	for (var i in e) Ve(e, i) && r.push(i);
	return r;
}
function Ue(e) {
	switch (typeof e) {
		case "object": return JSON.parse(JSON.stringify(e));
		case "undefined": return null;
		default: return e;
	}
}
function We(e) {
	for (var t = 0, n = e.length, r; t < n;) if (r = e.charCodeAt(t), r >= 48 && r <= 57) t++;
	else return !1;
	return !0;
}
function Ge(e) {
	return e.indexOf("/") === -1 && e.indexOf("~") === -1 ? e : e.replace(/~/g, "~0").replace(/\//g, "~1");
}
function Ke(e) {
	return e.replace(/~1/g, "/").replace(/~0/g, "~");
}
function qe(e) {
	if (e === void 0) return !0;
	if (e) {
		if (Array.isArray(e)) {
			for (var t = 0, n = e.length; t < n; t++) if (qe(e[t])) return !0;
		} else if (typeof e == "object") {
			for (var r = He(e), i = r.length, a = 0; a < i; a++) if (qe(e[r[a]])) return !0;
		}
	}
	return !1;
}
function Je(e, t) {
	var n = [e];
	for (var r in t) {
		var i = typeof t[r] == "object" ? JSON.stringify(t[r], null, 2) : t[r];
		i !== void 0 && n.push(r + ": " + i);
	}
	return n.join("\n");
}
var Ye = function(e) {
	ze(t, e);
	function t(t, n, r, i, a) {
		var o = this.constructor, s = e.call(this, Je(t, {
			name: n,
			index: r,
			operation: i,
			tree: a
		})) || this;
		return s.name = n, s.index = r, s.operation = i, s.tree = a, Object.setPrototypeOf(s, o.prototype), s.message = Je(t, {
			name: n,
			index: r,
			operation: i,
			tree: a
		}), s;
	}
	return t;
}(Error), Xe = /* @__PURE__ */ t({
	JsonPatchError: () => Ze,
	_areEquals: () => st,
	applyOperation: () => nt,
	applyPatch: () => rt,
	applyReducer: () => it,
	deepClone: () => Qe,
	getValueByPointer: () => tt,
	validate: () => ot,
	validator: () => at
}), Ze = Ye, Qe = Ue, $e = {
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
		var r = tt(n, this.path);
		r &&= Ue(r);
		var i = nt(n, {
			op: "remove",
			path: this.from
		}).removed;
		return nt(n, {
			op: "add",
			path: this.path,
			value: i
		}), {
			newDocument: n,
			removed: r
		};
	},
	copy: function(e, t, n) {
		var r = tt(n, this.from);
		return nt(n, {
			op: "add",
			path: this.path,
			value: Ue(r)
		}), { newDocument: n };
	},
	test: function(e, t, n) {
		return {
			newDocument: n,
			test: st(e[t], this.value)
		};
	},
	_get: function(e, t, n) {
		return this.value = e[t], { newDocument: n };
	}
}, et = {
	add: function(e, t, n) {
		return We(t) ? e.splice(t, 0, this.value) : e[t] = this.value, {
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
	move: $e.move,
	copy: $e.copy,
	test: $e.test,
	_get: $e._get
};
function tt(e, t) {
	if (t == "") return e;
	var n = {
		op: "_get",
		path: t
	};
	return nt(e, n), n.value;
}
function nt(e, t, n, r, i, a) {
	if (n === void 0 && (n = !1), r === void 0 && (r = !0), i === void 0 && (i = !0), a === void 0 && (a = 0), n && (typeof n == "function" ? n(t, 0, e, t.path) : at(t, 0)), t.path === "") {
		var o = { newDocument: e };
		if (t.op === "add") return o.newDocument = t.value, o;
		if (t.op === "replace") return o.newDocument = t.value, o.removed = e, o;
		if (t.op === "move" || t.op === "copy") return o.newDocument = tt(e, t.from), t.op === "move" && (o.removed = e), o;
		if (t.op === "test") {
			if (o.test = st(e, t.value), o.test === !1) throw new Ze("Test operation failed", "TEST_OPERATION_FAILED", a, t, e);
			return o.newDocument = e, o;
		}
		if (t.op === "remove") return o.removed = e, o.newDocument = null, o;
		if (t.op === "_get") return t.value = e, o;
		if (n) throw new Ze("Operation `op` property is not one of operations defined in RFC-6902", "OPERATION_OP_INVALID", a, t, e);
		return o;
	}
	r || (e = Ue(e));
	var s = (t.path || "").split("/"), c = e, l = 1, u = s.length, d = void 0, f = void 0, p = void 0;
	for (p = typeof n == "function" ? n : at;;) {
		if (f = s[l], f && f.indexOf("~") != -1 && (f = Ke(f)), i && (f == "__proto__" || f == "prototype" && l > 0 && s[l - 1] == "constructor")) throw TypeError("JSON-Patch: modifying `__proto__` or `constructor/prototype` prop is banned for security reasons, if this was on purpose, please set `banPrototypeModifications` flag false and pass it to this function. More info in fast-json-patch README");
		if (n && d === void 0 && (c[f] === void 0 ? d = s.slice(0, l).join("/") : l == u - 1 && (d = t.path), d !== void 0 && p(t, 0, e, d)), l++, Array.isArray(c)) {
			if (f === "-") f = c.length;
			else if (n && !We(f)) throw new Ze("Expected an unsigned base-10 integer value, making the new referenced value the array element with the zero-based index", "OPERATION_PATH_ILLEGAL_ARRAY_INDEX", a, t, e);
			else We(f) && (f = ~~f);
			if (l >= u) {
				if (n && t.op === "add" && f > c.length) throw new Ze("The specified index MUST NOT be greater than the number of elements in the array", "OPERATION_VALUE_OUT_OF_BOUNDS", a, t, e);
				var o = et[t.op].call(t, c, f, e);
				if (o.test === !1) throw new Ze("Test operation failed", "TEST_OPERATION_FAILED", a, t, e);
				return o;
			}
		} else if (l >= u) {
			var o = $e[t.op].call(t, c, f, e);
			if (o.test === !1) throw new Ze("Test operation failed", "TEST_OPERATION_FAILED", a, t, e);
			return o;
		}
		if (c = c[f], n && l < u && (!c || typeof c != "object")) throw new Ze("Cannot perform operation at the desired path", "OPERATION_PATH_UNRESOLVABLE", a, t, e);
	}
}
function rt(e, t, n, r, i) {
	if (r === void 0 && (r = !0), i === void 0 && (i = !0), n && !Array.isArray(t)) throw new Ze("Patch sequence must be an array", "SEQUENCE_NOT_AN_ARRAY");
	r || (e = Ue(e));
	for (var a = Array(t.length), o = 0, s = t.length; o < s; o++) a[o] = nt(e, t[o], n, !0, i, o), e = a[o].newDocument;
	return a.newDocument = e, a;
}
function it(e, t, n) {
	var r = nt(e, t);
	if (r.test === !1) throw new Ze("Test operation failed", "TEST_OPERATION_FAILED", n, t, e);
	return r.newDocument;
}
function at(e, t, n, r) {
	if (typeof e != "object" || !e || Array.isArray(e)) throw new Ze("Operation is not an object", "OPERATION_NOT_AN_OBJECT", t, e, n);
	if (!$e[e.op]) throw new Ze("Operation `op` property is not one of operations defined in RFC-6902", "OPERATION_OP_INVALID", t, e, n);
	if (typeof e.path != "string") throw new Ze("Operation `path` property is not a string", "OPERATION_PATH_INVALID", t, e, n);
	if (e.path.indexOf("/") !== 0 && e.path.length > 0) throw new Ze("Operation `path` property must start with \"/\"", "OPERATION_PATH_INVALID", t, e, n);
	if ((e.op === "move" || e.op === "copy") && typeof e.from != "string") throw new Ze("Operation `from` property is not present (applicable in `move` and `copy` operations)", "OPERATION_FROM_REQUIRED", t, e, n);
	if ((e.op === "add" || e.op === "replace" || e.op === "test") && e.value === void 0) throw new Ze("Operation `value` property is not present (applicable in `add`, `replace` and `test` operations)", "OPERATION_VALUE_REQUIRED", t, e, n);
	if ((e.op === "add" || e.op === "replace" || e.op === "test") && qe(e.value)) throw new Ze("Operation `value` property is not present (applicable in `add`, `replace` and `test` operations)", "OPERATION_VALUE_CANNOT_CONTAIN_UNDEFINED", t, e, n);
	if (n) {
		if (e.op == "add") {
			var i = e.path.split("/").length, a = r.split("/").length;
			if (i !== a + 1 && i !== a) throw new Ze("Cannot perform an `add` operation at the desired path", "OPERATION_PATH_CANNOT_ADD", t, e, n);
		} else if (e.op === "replace" || e.op === "remove" || e.op === "_get") {
			if (e.path !== r) throw new Ze("Cannot perform the operation at a path that does not exist", "OPERATION_PATH_UNRESOLVABLE", t, e, n);
		} else if (e.op === "move" || e.op === "copy") {
			var o = ot([{
				op: "_get",
				path: e.from,
				value: void 0
			}], n);
			if (o && o.name === "OPERATION_PATH_UNRESOLVABLE") throw new Ze("Cannot perform the operation from a path that does not exist", "OPERATION_FROM_UNRESOLVABLE", t, e, n);
		}
	}
}
function ot(e, t, n) {
	try {
		if (!Array.isArray(e)) throw new Ze("Patch sequence must be an array", "SEQUENCE_NOT_AN_ARRAY");
		if (t) rt(Ue(t), Ue(e), n || !0);
		else {
			n ||= at;
			for (var r = 0; r < e.length; r++) n(e[r], r, t, void 0);
		}
	} catch (e) {
		if (e instanceof Ze) return e;
		throw e;
	}
}
function st(e, t) {
	if (e === t) return !0;
	if (e && t && typeof e == "object" && typeof t == "object") {
		var n = Array.isArray(e), r = Array.isArray(t), i, a, o;
		if (n && r) {
			if (a = e.length, a != t.length) return !1;
			for (i = a; i-- !== 0;) if (!st(e[i], t[i])) return !1;
			return !0;
		}
		if (n != r) return !1;
		var s = Object.keys(e);
		if (a = s.length, a !== Object.keys(t).length) return !1;
		for (i = a; i-- !== 0;) if (!t.hasOwnProperty(s[i])) return !1;
		for (i = a; i-- !== 0;) if (o = s[i], !st(e[o], t[o])) return !1;
		return !0;
	}
	return e !== e && t !== t;
}
// node_modules/fast-json-patch/module/duplex.mjs
var ct = /* @__PURE__ */ t({
	compare: () => yt,
	generate: () => _t,
	observe: () => gt,
	unobserve: () => ht
}), lt = /* @__PURE__ */ new WeakMap(), ut = function() {
	function e(e) {
		this.observers = /* @__PURE__ */ new Map(), this.obj = e;
	}
	return e;
}(), dt = function() {
	function e(e, t) {
		this.callback = e, this.observer = t;
	}
	return e;
}();
function ft(e) {
	return lt.get(e);
}
function pt(e, t) {
	return e.observers.get(t);
}
function mt(e, t) {
	e.observers.delete(t.callback);
}
function ht(e, t) {
	t.unobserve();
}
function gt(e, t) {
	var n = [], r, i = ft(e);
	if (!i) i = new ut(e), lt.set(e, i);
	else {
		var a = pt(i, t);
		r = a && a.observer;
	}
	if (r) return r;
	if (r = {}, i.value = Ue(e), t) {
		r.callback = t, r.next = null;
		var o = function() {
			_t(r);
		}, s = function() {
			clearTimeout(r.next), r.next = setTimeout(o);
		};
		typeof window < "u" && (window.addEventListener("mouseup", s), window.addEventListener("keyup", s), window.addEventListener("mousedown", s), window.addEventListener("keydown", s), window.addEventListener("change", s));
	}
	return r.patches = n, r.object = e, r.unobserve = function() {
		_t(r), clearTimeout(r.next), mt(i, r), typeof window < "u" && (window.removeEventListener("mouseup", s), window.removeEventListener("keyup", s), window.removeEventListener("mousedown", s), window.removeEventListener("keydown", s), window.removeEventListener("change", s));
	}, i.observers.set(t, new dt(t, r)), r;
}
function _t(e, t) {
	t === void 0 && (t = !1);
	var n = lt.get(e.object);
	vt(n.value, e.object, e.patches, "", t), e.patches.length && rt(n.value, e.patches);
	var r = e.patches;
	return r.length > 0 && (e.patches = [], e.callback && e.callback(r)), r;
}
function vt(e, t, n, r, i) {
	if (t !== e) {
		typeof t.toJSON == "function" && (t = t.toJSON());
		for (var a = He(t), o = He(e), s = !1, c = o.length - 1; c >= 0; c--) {
			var l = o[c], u = e[l];
			if (Ve(t, l) && (t[l] !== void 0 || u === void 0 || Array.isArray(t) !== !1)) {
				var d = t[l];
				typeof u == "object" && u && typeof d == "object" && d && Array.isArray(u) === Array.isArray(d) ? vt(u, d, n, r + "/" + Ge(l), i) : u !== d && (i && n.push({
					op: "test",
					path: r + "/" + Ge(l),
					value: Ue(u)
				}), n.push({
					op: "replace",
					path: r + "/" + Ge(l),
					value: Ue(d)
				}));
			} else Array.isArray(e) === Array.isArray(t) ? (i && n.push({
				op: "test",
				path: r + "/" + Ge(l),
				value: Ue(u)
			}), n.push({
				op: "remove",
				path: r + "/" + Ge(l)
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
			!Ve(e, l) && t[l] !== void 0 && n.push({
				op: "add",
				path: r + "/" + Ge(l),
				value: Ue(t[l])
			});
		}
	}
}
function yt(e, t, n) {
	n === void 0 && (n = !1);
	var r = [];
	return vt(e, t, r, "", n), r;
}
// node_modules/fast-json-patch/index.mjs
var bt = Object.assign({}, Xe, ct, {
	JsonPatchError: Ye,
	deepClone: Ue,
	escapePathComponent: Ge,
	unescapePathComponent: Ke
}), xt = function(e, t) {
	return xt = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e, t) {
		e.__proto__ = t;
	} || function(e, t) {
		for (var n in t) Object.prototype.hasOwnProperty.call(t, n) && (e[n] = t[n]);
	}, xt(e, t);
};
function St(e, t) {
	if (typeof t != "function" && t !== null) throw TypeError("Class extends value " + String(t) + " is not a constructor or null");
	xt(e, t);
	function n() {
		this.constructor = e;
	}
	e.prototype = t === null ? Object.create(t) : (n.prototype = t.prototype, new n());
}
var Ct = function() {
	return Ct = Object.assign || function(e) {
		for (var t, n = 1, r = arguments.length; n < r; n++) for (var i in t = arguments[n], t) Object.prototype.hasOwnProperty.call(t, i) && (e[i] = t[i]);
		return e;
	}, Ct.apply(this, arguments);
};
function wt(e, t) {
	var n = {};
	for (var r in e) Object.prototype.hasOwnProperty.call(e, r) && t.indexOf(r) < 0 && (n[r] = e[r]);
	if (e != null && typeof Object.getOwnPropertySymbols == "function") for (var i = 0, r = Object.getOwnPropertySymbols(e); i < r.length; i++) t.indexOf(r[i]) < 0 && Object.prototype.propertyIsEnumerable.call(e, r[i]) && (n[r[i]] = e[r[i]]);
	return n;
}
function Tt(e, t, n, r) {
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
function Et(e, t) {
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
function Dt(e) {
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
function Ot(e, t) {
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
function kt(e, t, n) {
	if (n || arguments.length === 2) for (var r = 0, i = t.length, a; r < i; r++) (a || !(r in t)) && (a ||= Array.prototype.slice.call(t, 0, r), a[r] = t[r]);
	return e.concat(a || Array.prototype.slice.call(t));
}
function At(e) {
	return this instanceof At ? (this.v = e, this) : new At(e);
}
function jt(e, t, n) {
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
		e.value instanceof At ? Promise.resolve(e.value.v).then(u, d) : f(a[0][2], e);
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
function Mt(e) {
	if (!Symbol.asyncIterator) throw TypeError("Symbol.asyncIterator is not defined.");
	var t = e[Symbol.asyncIterator], n;
	return t ? t.call(e) : (e = typeof Dt == "function" ? Dt(e) : e[Symbol.iterator](), n = {}, r("next"), r("throw"), r("return"), n[Symbol.asyncIterator] = function() {
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
// node_modules/rxjs/dist/esm5/internal/util/isFunction.js
function Nt(e) {
	return typeof e == "function";
}
// node_modules/rxjs/dist/esm5/internal/util/createErrorClass.js
function Pt(e) {
	var t = e(function(e) {
		Error.call(e), e.stack = (/* @__PURE__ */ Error()).stack;
	});
	return t.prototype = Object.create(Error.prototype), t.prototype.constructor = t, t;
}
// node_modules/rxjs/dist/esm5/internal/util/UnsubscriptionError.js
var Ft = Pt(function(e) {
	return function(t) {
		e(this), this.message = t ? t.length + " errors occurred during unsubscription:\n" + t.map(function(e, t) {
			return t + 1 + ") " + e.toString();
		}).join("\n  ") : "", this.name = "UnsubscriptionError", this.errors = t;
	};
});
// node_modules/rxjs/dist/esm5/internal/util/arrRemove.js
function It(e, t) {
	if (e) {
		var n = e.indexOf(t);
		0 <= n && e.splice(n, 1);
	}
}
// node_modules/rxjs/dist/esm5/internal/Subscription.js
var Lt = function() {
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
					for (var o = Dt(a), s = o.next(); !s.done; s = o.next()) s.value.remove(this);
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
			if (Nt(c)) try {
				c();
			} catch (e) {
				i = e instanceof Ft ? e.errors : [e];
			}
			var l = this._finalizers;
			if (l) {
				this._finalizers = null;
				try {
					for (var u = Dt(l), d = u.next(); !d.done; d = u.next()) {
						var f = d.value;
						try {
							Bt(f);
						} catch (e) {
							i ??= [], e instanceof Ft ? i = kt(kt([], Ot(i)), Ot(e.errors)) : i.push(e);
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
			if (i) throw new Ft(i);
		}
	}, e.prototype.add = function(t) {
		if (t && t !== this) {
			if (this.closed) Bt(t);
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
		t === e ? this._parentage = null : Array.isArray(t) && It(t, e);
	}, e.prototype.remove = function(t) {
		var n = this._finalizers;
		n && It(n, t), t instanceof e && t._removeParent(this);
	}, e.EMPTY = (function() {
		var t = new e();
		return t.closed = !0, t;
	})(), e;
}(), Rt = Lt.EMPTY;
function zt(e) {
	return e instanceof Lt || e && "closed" in e && Nt(e.remove) && Nt(e.add) && Nt(e.unsubscribe);
}
function Bt(e) {
	Nt(e) ? e() : e.unsubscribe();
}
// node_modules/rxjs/dist/esm5/internal/config.js
var Vt = {
	onUnhandledError: null,
	onStoppedNotification: null,
	Promise: void 0,
	useDeprecatedSynchronousErrorHandling: !1,
	useDeprecatedNextContext: !1
}, Ht = {
	setTimeout: function(e, t) {
		var n = [...arguments].slice(2), r = Ht.delegate;
		return r?.setTimeout ? r.setTimeout.apply(r, kt([e, t], Ot(n))) : setTimeout.apply(void 0, kt([e, t], Ot(n)));
	},
	clearTimeout: function(e) {
		return (Ht.delegate?.clearTimeout || clearTimeout)(e);
	},
	delegate: void 0
};
// node_modules/rxjs/dist/esm5/internal/util/reportUnhandledError.js
function Ut(e) {
	Ht.setTimeout(function() {
		var t = Vt.onUnhandledError;
		if (t) t(e);
		else throw e;
	});
}
// node_modules/rxjs/dist/esm5/internal/util/noop.js
function Wt() {}
// node_modules/rxjs/dist/esm5/internal/NotificationFactories.js
var Gt = (function() {
	return Jt("C", void 0, void 0);
})();
function Kt(e) {
	return Jt("E", void 0, e);
}
function qt(e) {
	return Jt("N", e, void 0);
}
function Jt(e, t, n) {
	return {
		kind: e,
		value: t,
		error: n
	};
}
// node_modules/rxjs/dist/esm5/internal/util/errorContext.js
var Yt = null;
function Xt(e) {
	if (Vt.useDeprecatedSynchronousErrorHandling) {
		var t = !Yt;
		if (t && (Yt = {
			errorThrown: !1,
			error: null
		}), e(), t) {
			var n = Yt, r = n.errorThrown, i = n.error;
			if (Yt = null, r) throw i;
		}
	} else e();
}
function Zt(e) {
	Vt.useDeprecatedSynchronousErrorHandling && Yt && (Yt.errorThrown = !0, Yt.error = e);
}
// node_modules/rxjs/dist/esm5/internal/Subscriber.js
var Qt = function(e) {
	St(t, e);
	function t(t) {
		var n = e.call(this) || this;
		return n.isStopped = !1, t ? (n.destination = t, zt(t) && t.add(n)) : n.destination = sn, n;
	}
	return t.create = function(e, t, n) {
		return new nn(e, t, n);
	}, t.prototype.next = function(e) {
		this.isStopped ? on(qt(e), this) : this._next(e);
	}, t.prototype.error = function(e) {
		this.isStopped ? on(Kt(e), this) : (this.isStopped = !0, this._error(e));
	}, t.prototype.complete = function() {
		this.isStopped ? on(Gt, this) : (this.isStopped = !0, this._complete());
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
}(Lt), $t = Function.prototype.bind;
function en(e, t) {
	return $t.call(e, t);
}
var tn = function() {
	function e(e) {
		this.partialObserver = e;
	}
	return e.prototype.next = function(e) {
		var t = this.partialObserver;
		if (t.next) try {
			t.next(e);
		} catch (e) {
			rn(e);
		}
	}, e.prototype.error = function(e) {
		var t = this.partialObserver;
		if (t.error) try {
			t.error(e);
		} catch (e) {
			rn(e);
		}
		else rn(e);
	}, e.prototype.complete = function() {
		var e = this.partialObserver;
		if (e.complete) try {
			e.complete();
		} catch (e) {
			rn(e);
		}
	}, e;
}(), nn = function(e) {
	St(t, e);
	function t(t, n, r) {
		var i = e.call(this) || this, a;
		if (Nt(t) || !t) a = {
			next: t ?? void 0,
			error: n ?? void 0,
			complete: r ?? void 0
		};
		else {
			var o;
			i && Vt.useDeprecatedNextContext ? (o = Object.create(t), o.unsubscribe = function() {
				return i.unsubscribe();
			}, a = {
				next: t.next && en(t.next, o),
				error: t.error && en(t.error, o),
				complete: t.complete && en(t.complete, o)
			}) : a = t;
		}
		return i.destination = new tn(a), i;
	}
	return t;
}(Qt);
function rn(e) {
	Vt.useDeprecatedSynchronousErrorHandling ? Zt(e) : Ut(e);
}
function an(e) {
	throw e;
}
function on(e, t) {
	var n = Vt.onStoppedNotification;
	n && Ht.setTimeout(function() {
		return n(e, t);
	});
}
var sn = {
	closed: !0,
	next: Wt,
	error: an,
	complete: Wt
}, cn = (function() {
	return typeof Symbol == "function" && Symbol.observable || "@@observable";
})();
// node_modules/rxjs/dist/esm5/internal/util/identity.js
function ln(e) {
	return e;
}
// node_modules/rxjs/dist/esm5/internal/util/pipe.js
function un() {
	return dn([...arguments]);
}
function dn(e) {
	return e.length === 0 ? ln : e.length === 1 ? e[0] : function(t) {
		return e.reduce(function(e, t) {
			return t(e);
		}, t);
	};
}
// node_modules/rxjs/dist/esm5/internal/Observable.js
var fn = function() {
	function e(e) {
		e && (this._subscribe = e);
	}
	return e.prototype.lift = function(t) {
		var n = new e();
		return n.source = this, n.operator = t, n;
	}, e.prototype.subscribe = function(e, t, n) {
		var r = this, i = hn(e) ? e : new nn(e, t, n);
		return Xt(function() {
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
		return t = pn(t), new t(function(t, r) {
			var i = new nn({
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
	}, e.prototype[cn] = function() {
		return this;
	}, e.prototype.pipe = function() {
		return dn([...arguments])(this);
	}, e.prototype.toPromise = function(e) {
		var t = this;
		return e = pn(e), new e(function(e, n) {
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
function pn(e) {
	return e ?? Vt.Promise ?? Promise;
}
function mn(e) {
	return e && Nt(e.next) && Nt(e.error) && Nt(e.complete);
}
function hn(e) {
	return e && e instanceof Qt || mn(e) && zt(e);
}
// node_modules/rxjs/dist/esm5/internal/util/lift.js
function gn(e) {
	return Nt(e?.lift);
}
function _n(e) {
	return function(t) {
		if (gn(t)) return t.lift(function(t) {
			try {
				return e(t, this);
			} catch (e) {
				this.error(e);
			}
		});
		throw TypeError("Unable to lift unknown Observable type");
	};
}
// node_modules/rxjs/dist/esm5/internal/operators/OperatorSubscriber.js
function vn(e, t, n, r, i) {
	return new yn(e, t, n, r, i);
}
var yn = function(e) {
	St(t, e);
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
}(Qt), bn = Pt(function(e) {
	return function() {
		e(this), this.name = "ObjectUnsubscribedError", this.message = "object unsubscribed";
	};
}), xn = function(e) {
	St(t, e);
	function t() {
		var t = e.call(this) || this;
		return t.closed = !1, t.currentObservers = null, t.observers = [], t.isStopped = !1, t.hasError = !1, t.thrownError = null, t;
	}
	return t.prototype.lift = function(e) {
		var t = new Sn(this, this);
		return t.operator = e, t;
	}, t.prototype._throwIfClosed = function() {
		if (this.closed) throw new bn();
	}, t.prototype.next = function(e) {
		var t = this;
		Xt(function() {
			var n, r;
			if (t._throwIfClosed(), !t.isStopped) {
				t.currentObservers ||= Array.from(t.observers);
				try {
					for (var i = Dt(t.currentObservers), a = i.next(); !a.done; a = i.next()) a.value.next(e);
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
		Xt(function() {
			if (t._throwIfClosed(), !t.isStopped) {
				t.hasError = t.isStopped = !0, t.thrownError = e;
				for (var n = t.observers; n.length;) n.shift().error(e);
			}
		});
	}, t.prototype.complete = function() {
		var e = this;
		Xt(function() {
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
		return r || i ? Rt : (this.currentObservers = null, a.push(e), new Lt(function() {
			t.currentObservers = null, It(a, e);
		}));
	}, t.prototype._checkFinalizedStatuses = function(e) {
		var t = this, n = t.hasError, r = t.thrownError, i = t.isStopped;
		n ? e.error(r) : i && e.complete();
	}, t.prototype.asObservable = function() {
		var e = new fn();
		return e.source = this, e;
	}, t.create = function(e, t) {
		return new Sn(e, t);
	}, t;
}(fn), Sn = function(e) {
	St(t, e);
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
		return this.source?.subscribe(e) ?? Rt;
	}, t;
}(xn), Cn = function(e) {
	St(t, e);
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
}(xn), wn = {
	now: function() {
		return (wn.delegate || Date).now();
	},
	delegate: void 0
}, Tn = function(e) {
	St(t, e);
	function t(t, n, r) {
		t === void 0 && (t = Infinity), n === void 0 && (n = Infinity), r === void 0 && (r = wn);
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
}(xn), En = function(e) {
	St(t, e);
	function t(t, n) {
		return e.call(this) || this;
	}
	return t.prototype.schedule = function(e, t) {
		return t === void 0 && (t = 0), this;
	}, t;
}(Lt), Dn = {
	setInterval: function(e, t) {
		var n = [...arguments].slice(2), r = Dn.delegate;
		return r?.setInterval ? r.setInterval.apply(r, kt([e, t], Ot(n))) : setInterval.apply(void 0, kt([e, t], Ot(n)));
	},
	clearInterval: function(e) {
		return (Dn.delegate?.clearInterval || clearInterval)(e);
	},
	delegate: void 0
}, On = function(e) {
	St(t, e);
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
		return n === void 0 && (n = 0), Dn.setInterval(e.flush.bind(e, this), n);
	}, t.prototype.recycleAsyncId = function(e, t, n) {
		if (n === void 0 && (n = 0), n != null && this.delay === n && this.pending === !1) return t;
		t != null && Dn.clearInterval(t);
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
			this.work = this.state = this.scheduler = null, this.pending = !1, It(i, this), n != null && (this.id = this.recycleAsyncId(r, n, null)), this.delay = null, e.prototype.unsubscribe.call(this);
		}
	}, t;
}(En), kn = 1, An, jn = {};
function Mn(e) {
	return e in jn && (delete jn[e], !0);
}
var Nn = {
	setImmediate: function(e) {
		var t = kn++;
		return jn[t] = !0, An ||= Promise.resolve(), An.then(function() {
			return Mn(t) && e();
		}), t;
	},
	clearImmediate: function(e) {
		Mn(e);
	}
}, Pn = Nn.setImmediate, Fn = Nn.clearImmediate, In = {
	setImmediate: function() {
		var e = [...arguments];
		return (In.delegate?.setImmediate || Pn).apply(void 0, kt([], Ot(e)));
	},
	clearImmediate: function(e) {
		return (In.delegate?.clearImmediate || Fn)(e);
	},
	delegate: void 0
}, Ln = function(e) {
	St(t, e);
	function t(t, n) {
		var r = e.call(this, t, n) || this;
		return r.scheduler = t, r.work = n, r;
	}
	return t.prototype.requestAsyncId = function(t, n, r) {
		return r === void 0 && (r = 0), r !== null && r > 0 ? e.prototype.requestAsyncId.call(this, t, n, r) : (t.actions.push(this), t._scheduled ||= In.setImmediate(t.flush.bind(t, void 0)));
	}, t.prototype.recycleAsyncId = function(t, n, r) {
		if (r === void 0 && (r = 0), r == null ? this.delay > 0 : r > 0) return e.prototype.recycleAsyncId.call(this, t, n, r);
		var i = t.actions;
		n != null && i[i.length - 1]?.id !== n && (In.clearImmediate(n), t._scheduled === n && (t._scheduled = void 0));
	}, t;
}(On), Rn = function() {
	function e(t, n) {
		n === void 0 && (n = e.now), this.schedulerActionCtor = t, this.now = n;
	}
	return e.prototype.schedule = function(e, t, n) {
		return t === void 0 && (t = 0), new this.schedulerActionCtor(this, e).schedule(n, t);
	}, e.now = wn.now, e;
}(), zn = function(e) {
	St(t, e);
	function t(t, n) {
		n === void 0 && (n = Rn.now);
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
}(Rn), Bn = new (function(e) {
	St(t, e);
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
}(zn))(Ln), Vn = new zn(On), Hn = Vn, Un = new fn(function(e) {
	return e.complete();
});
// node_modules/rxjs/dist/esm5/internal/util/isScheduler.js
function Wn(e) {
	return e && Nt(e.schedule);
}
// node_modules/rxjs/dist/esm5/internal/util/args.js
function Gn(e) {
	return e[e.length - 1];
}
function Kn(e) {
	return Nt(Gn(e)) ? e.pop() : void 0;
}
function qn(e) {
	return Wn(Gn(e)) ? e.pop() : void 0;
}
function Jn(e, t) {
	return typeof Gn(e) == "number" ? e.pop() : t;
}
// node_modules/rxjs/dist/esm5/internal/util/isArrayLike.js
var Yn = (function(e) {
	return e && typeof e.length == "number" && typeof e != "function";
});
// node_modules/rxjs/dist/esm5/internal/util/isPromise.js
function Xn(e) {
	return Nt(e?.then);
}
// node_modules/rxjs/dist/esm5/internal/util/isInteropObservable.js
function Zn(e) {
	return Nt(e[cn]);
}
// node_modules/rxjs/dist/esm5/internal/util/isAsyncIterable.js
function Qn(e) {
	return Symbol.asyncIterator && Nt(e?.[Symbol.asyncIterator]);
}
// node_modules/rxjs/dist/esm5/internal/util/throwUnobservableError.js
function $n(e) {
	return /* @__PURE__ */ TypeError("You provided " + (typeof e == "object" && e ? "an invalid object" : "'" + e + "'") + " where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable.");
}
// node_modules/rxjs/dist/esm5/internal/symbol/iterator.js
function er() {
	return typeof Symbol != "function" || !Symbol.iterator ? "@@iterator" : Symbol.iterator;
}
var tr = er();
// node_modules/rxjs/dist/esm5/internal/util/isIterable.js
function nr(e) {
	return Nt(e?.[tr]);
}
// node_modules/rxjs/dist/esm5/internal/util/isReadableStreamLike.js
function rr(e) {
	return jt(this, arguments, function() {
		var t, n, r, i;
		return Et(this, function(a) {
			switch (a.label) {
				case 0: t = e.getReader(), a.label = 1;
				case 1: a.trys.push([
					1,
					,
					9,
					10
				]), a.label = 2;
				case 2: return [4, At(t.read())];
				case 3: return n = a.sent(), r = n.value, i = n.done, i ? [4, At(void 0)] : [3, 5];
				case 4: return [2, a.sent()];
				case 5: return [4, At(r)];
				case 6: return [4, a.sent()];
				case 7: return a.sent(), [3, 2];
				case 8: return [3, 10];
				case 9: return t.releaseLock(), [7];
				case 10: return [2];
			}
		});
	});
}
function ir(e) {
	return Nt(e?.getReader);
}
// node_modules/rxjs/dist/esm5/internal/observable/innerFrom.js
function ar(e) {
	if (e instanceof fn) return e;
	if (e != null) {
		if (Zn(e)) return or(e);
		if (Yn(e)) return sr(e);
		if (Xn(e)) return cr(e);
		if (Qn(e)) return ur(e);
		if (nr(e)) return lr(e);
		if (ir(e)) return dr(e);
	}
	throw $n(e);
}
function or(e) {
	return new fn(function(t) {
		var n = e[cn]();
		if (Nt(n.subscribe)) return n.subscribe(t);
		throw TypeError("Provided object does not correctly implement Symbol.observable");
	});
}
function sr(e) {
	return new fn(function(t) {
		for (var n = 0; n < e.length && !t.closed; n++) t.next(e[n]);
		t.complete();
	});
}
function cr(e) {
	return new fn(function(t) {
		e.then(function(e) {
			t.closed || (t.next(e), t.complete());
		}, function(e) {
			return t.error(e);
		}).then(null, Ut);
	});
}
function lr(e) {
	return new fn(function(t) {
		var n, r;
		try {
			for (var i = Dt(e), a = i.next(); !a.done; a = i.next()) {
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
function ur(e) {
	return new fn(function(t) {
		fr(e, t).catch(function(e) {
			return t.error(e);
		});
	});
}
function dr(e) {
	return ur(rr(e));
}
function fr(e, t) {
	var n, r, i, a;
	return Tt(this, void 0, void 0, function() {
		var o, s;
		return Et(this, function(c) {
			switch (c.label) {
				case 0: c.trys.push([
					0,
					5,
					6,
					11
				]), n = Mt(e), c.label = 1;
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
// node_modules/rxjs/dist/esm5/internal/util/executeSchedule.js
function pr(e, t, n, r, i) {
	r === void 0 && (r = 0), i === void 0 && (i = !1);
	var a = t.schedule(function() {
		n(), i ? e.add(this.schedule(null, r)) : this.unsubscribe();
	}, r);
	if (e.add(a), !i) return a;
}
// node_modules/rxjs/dist/esm5/internal/operators/observeOn.js
function mr(e, t) {
	return t === void 0 && (t = 0), _n(function(n, r) {
		n.subscribe(vn(r, function(n) {
			return pr(r, e, function() {
				return r.next(n);
			}, t);
		}, function() {
			return pr(r, e, function() {
				return r.complete();
			}, t);
		}, function(n) {
			return pr(r, e, function() {
				return r.error(n);
			}, t);
		}));
	});
}
// node_modules/rxjs/dist/esm5/internal/operators/subscribeOn.js
function hr(e, t) {
	return t === void 0 && (t = 0), _n(function(n, r) {
		r.add(e.schedule(function() {
			return n.subscribe(r);
		}, t));
	});
}
// node_modules/rxjs/dist/esm5/internal/scheduled/scheduleObservable.js
function gr(e, t) {
	return ar(e).pipe(hr(t), mr(t));
}
// node_modules/rxjs/dist/esm5/internal/scheduled/schedulePromise.js
function _r(e, t) {
	return ar(e).pipe(hr(t), mr(t));
}
// node_modules/rxjs/dist/esm5/internal/scheduled/scheduleArray.js
function vr(e, t) {
	return new fn(function(n) {
		var r = 0;
		return t.schedule(function() {
			r === e.length ? n.complete() : (n.next(e[r++]), n.closed || this.schedule());
		});
	});
}
// node_modules/rxjs/dist/esm5/internal/scheduled/scheduleIterable.js
function yr(e, t) {
	return new fn(function(n) {
		var r;
		return pr(n, t, function() {
			r = e[tr](), pr(n, t, function() {
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
			return Nt(r?.return) && r.return();
		};
	});
}
// node_modules/rxjs/dist/esm5/internal/scheduled/scheduleAsyncIterable.js
function br(e, t) {
	if (!e) throw Error("Iterable cannot be null");
	return new fn(function(n) {
		pr(n, t, function() {
			var r = e[Symbol.asyncIterator]();
			pr(n, t, function() {
				r.next().then(function(e) {
					e.done ? n.complete() : n.next(e.value);
				});
			}, 0, !0);
		});
	});
}
// node_modules/rxjs/dist/esm5/internal/scheduled/scheduleReadableStreamLike.js
function xr(e, t) {
	return br(rr(e), t);
}
// node_modules/rxjs/dist/esm5/internal/scheduled/scheduled.js
function Sr(e, t) {
	if (e != null) {
		if (Zn(e)) return gr(e, t);
		if (Yn(e)) return vr(e, t);
		if (Xn(e)) return _r(e, t);
		if (Qn(e)) return br(e, t);
		if (nr(e)) return yr(e, t);
		if (ir(e)) return xr(e, t);
	}
	throw $n(e);
}
// node_modules/rxjs/dist/esm5/internal/observable/from.js
function Cr(e, t) {
	return t ? Sr(e, t) : ar(e);
}
// node_modules/rxjs/dist/esm5/internal/observable/of.js
function y() {
	var e = [...arguments];
	return Cr(e, qn(e));
}
// node_modules/rxjs/dist/esm5/internal/observable/throwError.js
function b(e, t) {
	var n = Nt(e) ? e : function() {
		return e;
	}, r = function(e) {
		return e.error(n());
	};
	return new fn(t ? function(e) {
		return t.schedule(r, 0, e);
	} : r);
}
// node_modules/rxjs/dist/esm5/internal/Notification.js
var wr;
(function(e) {
	e.NEXT = "N", e.ERROR = "E", e.COMPLETE = "C";
})(wr ||= {});
var Tr = function() {
	function e(e, t, n) {
		this.kind = e, this.value = t, this.error = n, this.hasValue = e === "N";
	}
	return e.prototype.observe = function(e) {
		return Er(this, e);
	}, e.prototype.do = function(e, t, n) {
		var r = this, i = r.kind, a = r.value, o = r.error;
		return i === "N" ? e?.(a) : i === "E" ? t?.(o) : n?.();
	}, e.prototype.accept = function(e, t, n) {
		return Nt(e?.next) ? this.observe(e) : this.do(e, t, n);
	}, e.prototype.toObservable = function() {
		var e = this, t = e.kind, n = e.value, r = e.error, i = t === "N" ? y(n) : t === "E" ? b(function() {
			return r;
		}) : t === "C" ? Un : 0;
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
function Er(e, t) {
	var n, r, i, a = e, o = a.kind, s = a.value, c = a.error;
	if (typeof o != "string") throw TypeError("Invalid notification, missing \"kind\"");
	o === "N" ? (n = t.next) == null || n.call(t, s) : o === "E" ? (r = t.error) == null || r.call(t, c) : (i = t.complete) == null || i.call(t);
}
// node_modules/rxjs/dist/esm5/internal/util/EmptyError.js
var Dr = Pt(function(e) {
	return function() {
		e(this), this.name = "EmptyError", this.message = "no elements in sequence";
	};
});
// node_modules/rxjs/dist/esm5/internal/lastValueFrom.js
function Or(e, t) {
	var n = typeof t == "object";
	return new Promise(function(r, i) {
		var a = !1, o;
		e.subscribe({
			next: function(e) {
				o = e, a = !0;
			},
			error: i,
			complete: function() {
				a ? r(o) : n ? r(t.defaultValue) : i(new Dr());
			}
		});
	});
}
// node_modules/rxjs/dist/esm5/internal/firstValueFrom.js
function kr(e, t) {
	var n = typeof t == "object";
	return new Promise(function(r, i) {
		var a = new nn({
			next: function(e) {
				r(e), a.unsubscribe();
			},
			error: i,
			complete: function() {
				n ? r(t.defaultValue) : i(new Dr());
			}
		});
		e.subscribe(a);
	});
}
// node_modules/rxjs/dist/esm5/internal/util/isDate.js
function Ar(e) {
	return e instanceof Date && !isNaN(e);
}
// node_modules/rxjs/dist/esm5/internal/operators/timeout.js
var jr = Pt(function(e) {
	return function(t) {
		t === void 0 && (t = null), e(this), this.message = "Timeout has occurred", this.name = "TimeoutError", this.info = t;
	};
});
function Mr(e, t) {
	var n = Ar(e) ? { first: e } : typeof e == "number" ? { each: e } : e, r = n.first, i = n.each, a = n.with, o = a === void 0 ? Nr : a, s = n.scheduler, c = s === void 0 ? t ?? Vn : s, l = n.meta, u = l === void 0 ? null : l;
	if (r == null && i == null) throw TypeError("No timeout provided.");
	return _n(function(e, t) {
		var n, a, s = null, l = 0, d = function(e) {
			a = pr(t, c, function() {
				try {
					n.unsubscribe(), ar(o({
						meta: u,
						lastValue: s,
						seen: l
					})).subscribe(t);
				} catch (e) {
					t.error(e);
				}
			}, e);
		};
		n = e.subscribe(vn(t, function(e) {
			a?.unsubscribe(), l++, t.next(s = e), i > 0 && d(i);
		}, void 0, void 0, function() {
			a?.closed || a?.unsubscribe(), s = null;
		})), !l && d(r == null ? i : typeof r == "number" ? r : +r - c.now());
	});
}
function Nr(e) {
	throw new jr(e);
}
// node_modules/rxjs/dist/esm5/internal/operators/map.js
function x(e, t) {
	return _n(function(n, r) {
		var i = 0;
		n.subscribe(vn(r, function(n) {
			r.next(e.call(t, n, i++));
		}));
	});
}
// node_modules/rxjs/dist/esm5/internal/util/mapOneOrManyArgs.js
var Pr = Array.isArray;
function Fr(e, t) {
	return Pr(t) ? e.apply(void 0, kt([], Ot(t))) : e(t);
}
function Ir(e) {
	return x(function(t) {
		return Fr(e, t);
	});
}
// node_modules/rxjs/dist/esm5/internal/util/argsArgArrayOrObject.js
var Lr = Array.isArray, Rr = Object.getPrototypeOf, zr = Object.prototype, Br = Object.keys;
function Vr(e) {
	if (e.length === 1) {
		var t = e[0];
		if (Lr(t)) return {
			args: t,
			keys: null
		};
		if (Hr(t)) {
			var n = Br(t);
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
function Hr(e) {
	return e && typeof e == "object" && Rr(e) === zr;
}
// node_modules/rxjs/dist/esm5/internal/util/createObject.js
function Ur(e, t) {
	return e.reduce(function(e, n, r) {
		return e[n] = t[r], e;
	}, {});
}
// node_modules/rxjs/dist/esm5/internal/observable/combineLatest.js
function Wr() {
	var e = [...arguments], t = qn(e), n = Kn(e), r = Vr(e), i = r.args, a = r.keys;
	if (i.length === 0) return Cr([], t);
	var o = new fn(Gr(i, t, a ? function(e) {
		return Ur(a, e);
	} : ln));
	return n ? o.pipe(Ir(n)) : o;
}
function Gr(e, t, n) {
	return n === void 0 && (n = ln), function(r) {
		Kr(t, function() {
			for (var i = e.length, a = Array(i), o = i, s = i, c = function(i) {
				Kr(t, function() {
					var c = Cr(e[i], t), l = !1;
					c.subscribe(vn(r, function(e) {
						a[i] = e, l || (l = !0, s--), s || r.next(n(a.slice()));
					}, function() {
						--o || r.complete();
					}));
				}, r);
			}, l = 0; l < i; l++) c(l);
		}, r);
	};
}
function Kr(e, t, n) {
	e ? pr(n, e, t) : t();
}
// node_modules/rxjs/dist/esm5/internal/operators/mergeInternals.js
function qr(e, t, n, r, i, a, o, s) {
	var c = [], l = 0, u = 0, d = !1, f = function() {
		d && !c.length && !l && t.complete();
	}, p = function(e) {
		return l < r ? m(e) : c.push(e);
	}, m = function(e) {
		a && t.next(e), l++;
		var s = !1;
		ar(n(e, u++)).subscribe(vn(t, function(e) {
			i?.(e), a ? p(e) : t.next(e);
		}, function() {
			s = !0;
		}, void 0, function() {
			if (s) try {
				l--;
				for (var e = function() {
					var e = c.shift();
					o ? pr(t, o, function() {
						return m(e);
					}) : m(e);
				}; c.length && l < r;) e();
				f();
			} catch (e) {
				t.error(e);
			}
		}));
	};
	return e.subscribe(vn(t, p, function() {
		d = !0, f();
	})), function() {
		s?.();
	};
}
// node_modules/rxjs/dist/esm5/internal/operators/mergeMap.js
function Jr(e, t, n) {
	return n === void 0 && (n = Infinity), Nt(t) ? Jr(function(n, r) {
		return x(function(e, i) {
			return t(n, e, r, i);
		})(ar(e(n, r)));
	}, n) : (typeof t == "number" && (n = t), _n(function(t, r) {
		return qr(t, r, e, n);
	}));
}
// node_modules/rxjs/dist/esm5/internal/operators/mergeAll.js
function Yr(e) {
	return e === void 0 && (e = Infinity), Jr(ln, e);
}
// node_modules/rxjs/dist/esm5/internal/operators/concatAll.js
function Xr() {
	return Yr(1);
}
// node_modules/rxjs/dist/esm5/internal/observable/concat.js
function Zr() {
	var e = [...arguments];
	return Xr()(Cr(e, qn(e)));
}
// node_modules/rxjs/dist/esm5/internal/observable/defer.js
function S(e) {
	return new fn(function(t) {
		ar(e()).subscribe(t);
	});
}
// node_modules/rxjs/dist/esm5/internal/observable/timer.js
function Qr(e, t, n) {
	e === void 0 && (e = 0), n === void 0 && (n = Hn);
	var r = -1;
	return t != null && (Wn(t) ? n = t : r = t), new fn(function(t) {
		var i = Ar(e) ? +e - n.now() : e;
		i < 0 && (i = 0);
		var a = 0;
		return n.schedule(function() {
			t.closed || (t.next(a++), 0 <= r ? this.schedule(void 0, r) : t.complete());
		}, i);
	});
}
// node_modules/rxjs/dist/esm5/internal/observable/merge.js
function $r() {
	var e = [...arguments], t = qn(e), n = Jn(e, Infinity), r = e;
	return r.length ? r.length === 1 ? ar(r[0]) : Yr(n)(Cr(r, t)) : Un;
}
// node_modules/rxjs/dist/esm5/internal/observable/never.js
var ei = new fn(Wt);
// node_modules/rxjs/dist/esm5/internal/operators/filter.js
function ti(e, t) {
	return _n(function(n, r) {
		var i = 0;
		n.subscribe(vn(r, function(n) {
			return e.call(t, n, i++) && r.next(n);
		}));
	});
}
// node_modules/rxjs/dist/esm5/internal/operators/catchError.js
function ni(e) {
	return _n(function(t, n) {
		var r = null, i = !1, a;
		r = t.subscribe(vn(n, void 0, void 0, function(o) {
			a = ar(e(o, ni(e)(t))), r ? (r.unsubscribe(), r = null, a.subscribe(n)) : i = !0;
		})), i && (r.unsubscribe(), r = null, a.subscribe(n));
	});
}
// node_modules/rxjs/dist/esm5/internal/operators/scanInternals.js
function ri(e, t, n, r, i) {
	return function(a, o) {
		var s = n, c = t, l = 0;
		a.subscribe(vn(o, function(t) {
			var n = l++;
			c = s ? e(c, t, n) : (s = !0, t), r && o.next(c);
		}, i && (function() {
			s && o.next(c), o.complete();
		})));
	};
}
// node_modules/rxjs/dist/esm5/internal/operators/concatMap.js
function ii(e, t) {
	return Nt(t) ? Jr(e, t, 1) : Jr(e, 1);
}
// node_modules/rxjs/dist/esm5/internal/operators/concat.js
function ai() {
	var e = [...arguments], t = qn(e);
	return _n(function(n, r) {
		Xr()(Cr(kt([n], Ot(e)), t)).subscribe(r);
	});
}
// node_modules/rxjs/dist/esm5/internal/operators/concatWith.js
function oi() {
	var e = [...arguments];
	return ai.apply(void 0, kt([], Ot(e)));
}
// node_modules/rxjs/dist/esm5/internal/operators/defaultIfEmpty.js
function si(e) {
	return _n(function(t, n) {
		var r = !1;
		t.subscribe(vn(n, function(e) {
			r = !0, n.next(e);
		}, function() {
			r || n.next(e), n.complete();
		}));
	});
}
// node_modules/rxjs/dist/esm5/internal/operators/take.js
function ci(e) {
	return e <= 0 ? function() {
		return Un;
	} : _n(function(t, n) {
		var r = 0;
		t.subscribe(vn(n, function(t) {
			++r <= e && (n.next(t), e <= r && n.complete());
		}));
	});
}
// node_modules/rxjs/dist/esm5/internal/operators/ignoreElements.js
function li() {
	return _n(function(e, t) {
		e.subscribe(vn(t, Wt));
	});
}
// node_modules/rxjs/dist/esm5/internal/operators/mapTo.js
function ui(e) {
	return x(function() {
		return e;
	});
}
// node_modules/rxjs/dist/esm5/internal/operators/delayWhen.js
function di(e, t) {
	return t ? function(n) {
		return Zr(t.pipe(ci(1), li()), n.pipe(di(e)));
	} : Jr(function(t, n) {
		return ar(e(t, n)).pipe(ci(1), ui(t));
	});
}
// node_modules/rxjs/dist/esm5/internal/operators/delay.js
function fi(e, t) {
	t === void 0 && (t = Vn);
	var n = Qr(e, t);
	return di(function() {
		return n;
	});
}
// node_modules/rxjs/dist/esm5/internal/operators/dematerialize.js
function pi() {
	return _n(function(e, t) {
		e.subscribe(vn(t, function(e) {
			return Er(e, t);
		}));
	});
}
// node_modules/rxjs/dist/esm5/internal/operators/distinctUntilChanged.js
function mi(e, t) {
	return t === void 0 && (t = ln), e ??= hi, _n(function(n, r) {
		var i, a = !0;
		n.subscribe(vn(r, function(n) {
			var o = t(n);
			(a || !e(i, o)) && (a = !1, i = o, r.next(n));
		}));
	});
}
function hi(e, t) {
	return e === t;
}
// node_modules/rxjs/dist/esm5/internal/operators/endWith.js
function gi() {
	var e = [...arguments];
	return function(t) {
		return Zr(t, y.apply(void 0, kt([], Ot(e))));
	};
}
// node_modules/rxjs/dist/esm5/internal/operators/finalize.js
function _i(e) {
	return _n(function(t, n) {
		try {
			t.subscribe(n);
		} finally {
			n.add(e);
		}
	});
}
// node_modules/rxjs/dist/esm5/internal/operators/scan.js
function vi(e, t) {
	return _n(ri(e, t, arguments.length >= 2, !0));
}
// node_modules/rxjs/dist/esm5/internal/operators/share.js
function yi(e) {
	e === void 0 && (e = {});
	var t = e.connector, n = t === void 0 ? function() {
		return new xn();
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
		return _n(function(e, m) {
			s++, !u && !l && d();
			var h = a ??= n();
			m.add(function() {
				s--, s === 0 && !u && !l && (r = bi(p, c));
			}), h.subscribe(m), !t && s > 0 && (t = new nn({
				next: function(e) {
					return h.next(e);
				},
				error: function(e) {
					u = !0, d(), r = bi(f, i, e), h.error(e);
				},
				complete: function() {
					l = !0, d(), r = bi(f, o), h.complete();
				}
			}), ar(e).subscribe(t));
		})(e);
	};
}
function bi(e, t) {
	var n = [...arguments].slice(2);
	if (t === !0) e();
	else if (t !== !1) {
		var r = new nn({ next: function() {
			r.unsubscribe(), e();
		} });
		return ar(t.apply(void 0, kt([], Ot(n)))).subscribe(r);
	}
}
// node_modules/rxjs/dist/esm5/internal/operators/shareReplay.js
function xi(e, t, n) {
	var r, i, a, o, s = !1;
	return e && typeof e == "object" ? (r = e.bufferSize, o = r === void 0 ? Infinity : r, i = e.windowTime, t = i === void 0 ? Infinity : i, a = e.refCount, s = a !== void 0 && a, n = e.scheduler) : o = e ?? Infinity, yi({
		connector: function() {
			return new Tn(o, t, n);
		},
		resetOnError: !0,
		resetOnComplete: !1,
		resetOnRefCountZero: s
	});
}
// node_modules/rxjs/dist/esm5/internal/operators/startWith.js
function Si() {
	var e = [...arguments], t = qn(e);
	return _n(function(n, r) {
		(t ? Zr(e, n, t) : Zr(e, n)).subscribe(r);
	});
}
// node_modules/rxjs/dist/esm5/internal/operators/switchMap.js
function C(e, t) {
	return _n(function(n, r) {
		var i = null, a = 0, o = !1, s = function() {
			return o && !i && r.complete();
		};
		n.subscribe(vn(r, function(n) {
			i?.unsubscribe();
			var o = 0, c = a++;
			ar(e(n, c)).subscribe(i = vn(r, function(e) {
				return r.next(t ? t(n, e, c, o++) : e);
			}, function() {
				i = null, s();
			}));
		}, function() {
			o = !0, s();
		}));
	});
}
// node_modules/rxjs/dist/esm5/internal/operators/takeUntil.js
function Ci(e) {
	return _n(function(t, n) {
		ar(e).subscribe(vn(n, function() {
			return n.complete();
		}, Wt)), !n.closed && t.subscribe(n);
	});
}
// node_modules/rxjs/dist/esm5/internal/operators/tap.js
function wi(e, t, n) {
	var r = Nt(e) || t || n ? {
		next: e,
		error: t,
		complete: n
	} : e;
	return r ? _n(function(e, t) {
		var n;
		(n = r.subscribe) == null || n.call(r);
		var i = !0;
		e.subscribe(vn(t, function(e) {
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
	}) : ln;
}
// node_modules/rxjs/dist/esm5/internal/operators/withLatestFrom.js
function Ti() {
	var e = [...arguments], t = Kn(e);
	return _n(function(n, r) {
		for (var i = e.length, a = Array(i), o = e.map(function() {
			return !1;
		}), s = !1, c = function(t) {
			ar(e[t]).subscribe(vn(r, function(e) {
				a[t] = e, !s && !o[t] && (o[t] = !0, (s = o.every(ln)) && (o = null));
			}, Wt));
		}, l = 0; l < i; l++) c(l);
		n.subscribe(vn(r, function(e) {
			if (s) {
				var n = kt([e], Ot(a));
				r.next(t ? t.apply(void 0, kt([], Ot(n))) : n);
			}
		}));
	});
}
// node_modules/untruncate-json/dist/esm/index.js
function Ei(e) {
	return " \r\n	".indexOf(e) >= 0;
}
function Di(e) {
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
				m === "]" ? u() : Ei(m) || (l("collectionItem"), s("arrayNeedsComma"), f(m));
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
				Ei(m) || (l("collectionItem"), s("objectNeedsComma"), f(m));
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
// node_modules/@ag-ui/core/dist/schemas.mjs
var Oi = d(_), w = s((e) => typeof e == "object" && !!e && !Array.isArray(e)), T = h(), ki = d([
	"developer",
	"system",
	"assistant",
	"user"
]), Ai = c({
	type: u(_.TEXT_MESSAGE_START),
	timestamp: o().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: l().refine((e) => e !== null).optional(),
	metadata: w.optional(),
	subagentRunId: T.optional(),
	messageId: h(),
	role: ki.optional(),
	name: h().optional()
}), ji = c({
	type: u(_.TEXT_MESSAGE_CONTENT),
	timestamp: o().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: l().refine((e) => e !== null).optional(),
	metadata: w.optional(),
	subagentRunId: T.optional(),
	messageId: h(),
	delta: h()
}), Mi = c({
	type: u(_.TEXT_MESSAGE_END),
	timestamp: o().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: l().refine((e) => e !== null).optional(),
	metadata: w.optional(),
	subagentRunId: T.optional(),
	messageId: h()
}), Ni = c({
	type: u(_.TEXT_MESSAGE_CHUNK),
	timestamp: o().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: l().refine((e) => e !== null).optional(),
	metadata: w.optional(),
	subagentRunId: T.optional(),
	messageId: h().optional(),
	role: ki.optional(),
	delta: h().optional(),
	name: h().optional()
}), Pi = c({
	type: u(_.TOOL_CALL_START),
	timestamp: o().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: l().refine((e) => e !== null).optional(),
	metadata: w.optional(),
	subagentRunId: T.optional(),
	toolCallId: h(),
	toolCallName: h(),
	parentMessageId: h().optional()
}), Fi = c({
	type: u(_.TOOL_CALL_ARGS),
	timestamp: o().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: l().refine((e) => e !== null).optional(),
	metadata: w.optional(),
	subagentRunId: T.optional(),
	toolCallId: h(),
	delta: h()
}), Ii = c({
	type: u(_.TOOL_CALL_END),
	timestamp: o().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: l().refine((e) => e !== null).optional(),
	metadata: w.optional(),
	subagentRunId: T.optional(),
	toolCallId: h()
}), Li = c({
	type: u(_.TOOL_CALL_CHUNK),
	timestamp: o().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: l().refine((e) => e !== null).optional(),
	metadata: w.optional(),
	subagentRunId: T.optional(),
	toolCallId: h().optional(),
	toolCallName: h().optional(),
	parentMessageId: h().optional(),
	delta: h().optional()
}), Ri = c({
	type: u("text"),
	id: h().optional(),
	text: h(),
	metadata: l().refine((e) => e !== null).optional()
}), zi = c({
	type: u("data"),
	value: h(),
	mimeType: h()
}), Bi = c({
	type: u("url"),
	value: h(),
	mimeType: h().optional()
}), Vi = c({
	type: u("file"),
	value: h(),
	provider: h().optional(),
	mimeType: h().optional()
}), Hi = m("type", [
	zi,
	Bi,
	Vi
]), Ui = c({
	type: u("image"),
	id: h().optional(),
	source: Hi,
	metadata: l().refine((e) => e !== null).optional()
}), Wi = c({
	type: u("audio"),
	id: h().optional(),
	source: Hi,
	metadata: l().refine((e) => e !== null).optional()
}), Gi = c({
	type: u("video"),
	id: h().optional(),
	source: Hi,
	metadata: l().refine((e) => e !== null).optional()
}), Ki = c({
	type: u("document"),
	id: h().optional(),
	source: Hi,
	metadata: l().refine((e) => e !== null).optional()
}), qi = m("type", [
	Ri,
	Ui,
	Wi,
	Gi,
	Ki
]), Ji = c({
	type: u(_.TOOL_CALL_RESULT),
	timestamp: o().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: l().refine((e) => e !== null).optional(),
	metadata: w.optional(),
	subagentRunId: T.optional(),
	messageId: h(),
	toolCallId: h(),
	content: i([h(), f(qi)]),
	role: u("tool").optional()
}), Yi = l(), Xi = c({
	type: u(_.STATE_SNAPSHOT),
	timestamp: o().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: l().refine((e) => e !== null).optional(),
	metadata: w.optional(),
	subagentRunId: T.optional(),
	snapshot: Yi.refine((e) => e !== void 0)
}), Zi = h().regex(/* @__PURE__ */ RegExp("^(/([^/~]|~[01])*)*$")), Qi = c({
	op: u("add"),
	path: Zi,
	value: l().refine((e) => e !== void 0)
}).meta({ specOpen: !0 }), $i = c({
	op: u("remove"),
	path: Zi
}).meta({ specOpen: !0 }), ea = c({
	op: u("replace"),
	path: Zi,
	value: l().refine((e) => e !== void 0)
}).meta({ specOpen: !0 }), ta = c({
	op: u("move"),
	from: Zi,
	path: Zi
}).meta({ specOpen: !0 }), na = c({
	op: u("copy"),
	from: Zi,
	path: Zi
}).meta({ specOpen: !0 }), ra = c({
	op: u("test"),
	path: Zi,
	value: l().refine((e) => e !== void 0)
}).meta({ specOpen: !0 }), ia = m("op", [
	Qi,
	$i,
	ea,
	ta,
	na,
	ra
]), aa = f(ia), oa = c({
	type: u(_.STATE_DELTA),
	timestamp: o().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: l().refine((e) => e !== null).optional(),
	metadata: w.optional(),
	subagentRunId: T.optional(),
	delta: aa
}), sa = c({
	subagentRunId: T.optional(),
	id: h(),
	role: u("developer"),
	name: h().optional(),
	encryptedValue: h().optional(),
	metadata: w.optional(),
	content: h()
}), ca = c({
	subagentRunId: T.optional(),
	id: h(),
	role: u("system"),
	name: h().optional(),
	encryptedValue: h().optional(),
	metadata: w.optional(),
	content: h()
}), la = c({
	name: h(),
	arguments: h()
}), ua = c({
	id: h(),
	type: u("function"),
	function: la,
	encryptedValue: h().optional(),
	metadata: w.optional()
}), da = c({
	subagentRunId: T.optional(),
	id: h(),
	role: u("assistant"),
	name: h().optional(),
	encryptedValue: h().optional(),
	metadata: w.optional(),
	content: h().optional(),
	toolCalls: f(ua).optional()
}), fa = c({
	subagentRunId: T.optional(),
	id: h(),
	role: u("user"),
	name: h().optional(),
	encryptedValue: h().optional(),
	metadata: w.optional(),
	content: i([h(), f(qi)])
}), pa = c({
	subagentRunId: T.optional(),
	id: h(),
	role: u("tool"),
	content: i([h(), f(qi)]),
	toolCallId: h(),
	error: h().optional(),
	encryptedValue: h().optional(),
	metadata: w.optional()
}), ma = c({
	subagentRunId: T.optional(),
	id: h(),
	role: u("activity"),
	activityType: h(),
	content: s((e) => typeof e == "object" && !!e && !Array.isArray(e)),
	metadata: w.optional()
}), ha = c({
	subagentRunId: T.optional(),
	id: h(),
	role: u("reasoning"),
	content: h(),
	encryptedValue: h().optional(),
	metadata: w.optional()
}), ga = m("role", [
	sa,
	ca,
	da,
	fa,
	pa,
	ma,
	ha
]), _a = c({
	type: u(_.MESSAGES_SNAPSHOT),
	timestamp: o().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: l().refine((e) => e !== null).optional(),
	metadata: w.optional(),
	messages: f(ga)
}), va = c({
	type: u(_.ACTIVITY_SNAPSHOT),
	timestamp: o().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: l().refine((e) => e !== null).optional(),
	metadata: w.optional(),
	subagentRunId: T.optional(),
	messageId: h(),
	activityType: h(),
	content: s((e) => typeof e == "object" && !!e && !Array.isArray(e)),
	replace: a().optional()
}), ya = c({
	type: u(_.ACTIVITY_DELTA),
	timestamp: o().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: l().refine((e) => e !== null).optional(),
	metadata: w.optional(),
	subagentRunId: T.optional(),
	messageId: h(),
	activityType: h(),
	patch: aa
}), ba = c({
	type: u(_.RAW),
	timestamp: o().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: l().refine((e) => e !== null).optional(),
	metadata: w.optional(),
	subagentRunId: T.optional(),
	event: l().refine((e) => e !== void 0),
	source: h().optional()
}), xa = c({
	type: u(_.CUSTOM),
	timestamp: o().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: l().refine((e) => e !== null).optional(),
	metadata: w.optional(),
	subagentRunId: T.optional(),
	name: h(),
	value: l().refine((e) => e !== void 0)
}), Sa = c({
	name: h(),
	description: h(),
	parameters: l().refine((e) => e !== null).optional(),
	metadata: w.optional()
}), Ca = c({
	description: h(),
	value: h()
}), wa = c({
	interruptId: h(),
	status: d(["resolved", "cancelled"]),
	payload: l().refine((e) => e !== null).optional(),
	metadata: w.optional()
}), Ta = c({
	threadId: h(),
	runId: h(),
	protocolVersion: h().optional(),
	parentRunId: h().optional(),
	state: Yi.refine((e) => e !== null).nullable().transform((e) => e ?? void 0).optional(),
	messages: f(ga),
	tools: f(Sa).default(() => []),
	context: f(Ca).default(() => []),
	forwardedProps: l().refine((e) => e !== null).optional(),
	resume: f(wa).optional()
}), Ea = c({
	type: u(_.RUN_STARTED),
	timestamp: o().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: l().refine((e) => e !== null).optional(),
	metadata: w.optional(),
	threadId: h(),
	runId: h(),
	protocolVersion: h().optional(),
	parentRunId: h().optional(),
	input: Ta.optional()
}), Da = c({
	type: u("success"),
	pendingToolCallIds: f(h()).optional()
}), Oa = c({
	subagentRunId: T.optional(),
	id: h(),
	reason: h(),
	message: h().optional(),
	toolCallId: h().optional(),
	responseSchema: s((e) => typeof e == "object" && !!e && !Array.isArray(e)).optional(),
	expiresAt: h().optional(),
	metadata: w.optional()
}), ka = c({
	type: u("interrupt"),
	interrupts: f(Oa).min(1)
}), Aa = c({ type: u("cancelled") }), ja = m("type", [
	Da,
	ka,
	Aa
]), Ma = c({
	provider: h().optional(),
	model: h().optional(),
	inputTokens: o().min(0).max(9007199254740991).optional(),
	outputTokens: o().min(0).max(9007199254740991).optional(),
	totalTokens: o().min(0).max(9007199254740991).optional(),
	reasoningTokens: o().min(0).max(9007199254740991).optional(),
	cachedInputTokens: o().min(0).max(9007199254740991).optional(),
	cacheWriteInputTokens: o().min(0).max(9007199254740991).optional()
}), Na = c({
	type: u(_.RUN_FINISHED),
	timestamp: o().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: l().refine((e) => e !== null).optional(),
	metadata: w.optional(),
	threadId: h(),
	runId: h(),
	result: l().refine((e) => e !== null).optional(),
	outcome: ja.optional(),
	usage: f(Ma).optional()
}), Pa = c({
	type: u(_.RUN_ERROR),
	timestamp: o().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: l().refine((e) => e !== null).optional(),
	metadata: w.optional(),
	message: h(),
	code: h().optional(),
	usage: f(Ma).optional()
}), Fa = c({
	type: u(_.STEP_STARTED),
	timestamp: o().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: l().refine((e) => e !== null).optional(),
	metadata: w.optional(),
	subagentRunId: T.optional(),
	stepName: h()
}), Ia = c({
	type: u(_.STEP_FINISHED),
	timestamp: o().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: l().refine((e) => e !== null).optional(),
	metadata: w.optional(),
	subagentRunId: T.optional(),
	stepName: h()
}), La = c({
	type: u(_.REASONING_START),
	timestamp: o().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: l().refine((e) => e !== null).optional(),
	metadata: w.optional(),
	subagentRunId: T.optional(),
	messageId: h()
}), Ra = c({
	type: u(_.REASONING_MESSAGE_START),
	timestamp: o().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: l().refine((e) => e !== null).optional(),
	metadata: w.optional(),
	subagentRunId: T.optional(),
	messageId: h(),
	role: u("reasoning")
}), za = c({
	type: u(_.REASONING_MESSAGE_CONTENT),
	timestamp: o().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: l().refine((e) => e !== null).optional(),
	metadata: w.optional(),
	subagentRunId: T.optional(),
	messageId: h(),
	delta: h()
}), Ba = c({
	type: u(_.REASONING_MESSAGE_END),
	timestamp: o().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: l().refine((e) => e !== null).optional(),
	metadata: w.optional(),
	subagentRunId: T.optional(),
	messageId: h()
}), Va = c({
	type: u(_.REASONING_MESSAGE_CHUNK),
	timestamp: o().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: l().refine((e) => e !== null).optional(),
	metadata: w.optional(),
	subagentRunId: T.optional(),
	messageId: h().optional(),
	delta: h().optional()
}), Ha = c({
	type: u(_.REASONING_END),
	timestamp: o().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: l().refine((e) => e !== null).optional(),
	metadata: w.optional(),
	subagentRunId: T.optional(),
	messageId: h()
}), Ua = d(["tool-call", "message"]), Wa = c({
	type: u(_.REASONING_ENCRYPTED_VALUE),
	timestamp: o().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: l().refine((e) => e !== null).optional(),
	metadata: w.optional(),
	subagentRunId: T.optional(),
	subtype: Ua,
	entityId: h(),
	encryptedValue: h()
}), Ga = c({
	type: u(_.SUBAGENT_STARTED),
	timestamp: o().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: l().refine((e) => e !== null).optional(),
	metadata: w.optional(),
	subagentRunId: T,
	name: h(),
	description: h().optional(),
	parentSubagentRunId: T.optional(),
	parentToolCallId: h().optional(),
	parentMessageId: h().optional()
}), Ka = c({ type: u("success") }), qa = c({
	type: u("suspended"),
	interruptIds: f(h()).optional()
}), Ja = m("type", [Ka, qa]), Ya = c({
	type: u(_.SUBAGENT_FINISHED),
	timestamp: o().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: l().refine((e) => e !== null).optional(),
	metadata: w.optional(),
	subagentRunId: T,
	result: l().refine((e) => e !== null).optional(),
	outcome: Ja.optional()
}), Xa = c({
	type: u(_.SUBAGENT_ERROR),
	timestamp: o().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: l().refine((e) => e !== null).optional(),
	metadata: w.optional(),
	subagentRunId: T,
	message: h(),
	code: h().optional()
}), Za = m("type", [
	Ai,
	ji,
	Mi,
	Ni,
	Pi,
	Fi,
	Ii,
	Li,
	Ji,
	Xi,
	oa,
	_a,
	va,
	ya,
	ba,
	xa,
	Ea,
	Na,
	Pa,
	Fa,
	Ia,
	La,
	Ra,
	za,
	Ba,
	Va,
	Ha,
	Wa,
	Ga,
	Ya,
	Xa
]);
d([
	"developer",
	"system",
	"assistant",
	"user",
	"tool",
	"activity",
	"reasoning"
]);
var Qa = c({
	name: h(),
	description: h().optional()
}), $a = c({
	name: h().optional(),
	type: h().optional(),
	description: h().optional(),
	version: h().optional(),
	provider: h().optional(),
	documentationUrl: h().optional(),
	metadata: w.optional()
}), eo = c({
	streaming: a().optional(),
	websocket: a().optional(),
	httpBinary: a().optional(),
	pushNotifications: a().optional(),
	resumable: a().optional()
}), to = c({
	supported: a().optional(),
	items: f(Sa).optional(),
	parallelCalls: a().optional(),
	clientProvided: a().optional()
}), no = c({
	structuredOutput: a().optional(),
	supportedMimeTypes: f(h()).optional()
}), ro = c({
	snapshots: a().optional(),
	deltas: a().optional(),
	memory: a().optional(),
	persistentState: a().optional()
}), io = c({
	supported: a().optional(),
	delegation: a().optional(),
	handoffs: a().optional(),
	subagents: f(Qa).optional()
}), ao = c({
	supported: a().optional(),
	streaming: a().optional(),
	encrypted: a().optional()
}), oo = c({
	image: a().optional(),
	audio: a().optional(),
	video: a().optional(),
	pdf: a().optional(),
	file: a().optional()
}), so = c({
	image: a().optional(),
	audio: a().optional()
}), co = c({
	input: oo.optional(),
	output: so.optional()
}), lo = c({
	codeExecution: a().optional(),
	sandboxed: a().optional(),
	maxIterations: o().min(0).max(9007199254740991).optional(),
	maxExecutionTime: o().min(0).max(9007199254740991).optional()
}), uo = c({
	supported: a().optional(),
	approvals: a().optional(),
	interventions: a().optional(),
	feedback: a().optional(),
	interrupts: a().optional(),
	approveWithEdits: a().optional()
});
c({
	identity: $a.optional(),
	transport: eo.optional(),
	tools: to.optional(),
	output: no.optional(),
	state: ro.optional(),
	multiAgent: io.optional(),
	reasoning: ao.optional(),
	multimodal: co.optional(),
	execution: lo.optional(),
	humanInTheLoop: uo.optional(),
	custom: s((e) => typeof e == "object" && !!e && !Array.isArray(e)).optional()
}), c({ subagentRunId: T.optional() }), c({
	type: Oi,
	timestamp: o().min(-9007199254740991).max(9007199254740991).optional(),
	rawEvent: l().refine((e) => e !== null).optional(),
	metadata: w.optional()
}), c({
	subagentRunId: T.optional(),
	id: h(),
	role: h(),
	name: h().optional(),
	encryptedValue: h().optional(),
	metadata: w.optional()
}), w.optional();
// node_modules/@bufbuild/protobuf/dist/esm/wire/varint.js
function fo() {
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
var po = 4294967296;
function mo(e) {
	let t = e[0] === "-";
	t && (e = e.slice(1));
	let n = 1e6, r = 0, i = 0;
	function a(t, a) {
		let o = Number(e.slice(t, a));
		i *= n, r = r * n + o, r >= po && (i += r / po | 0, r %= po);
	}
	return a(-24, -18), a(-18, -12), a(-12, -6), a(-6), t ? yo(r, i) : vo(r, i);
}
function ho(e, t) {
	let n = vo(e, t), r = n.hi & 2147483648;
	r && (n = yo(n.lo, n.hi));
	let i = go(n.lo, n.hi);
	return r ? "-" + i : i;
}
function go(e, t) {
	if ({lo: e, hi: t} = _o(e, t), t <= 2097151) return String(po * t + e);
	let n = e & 16777215, r = (e >>> 24 | t << 8) & 16777215, i = t >> 16 & 65535, a = n + r * 6777216 + i * 6710656, o = r + i * 8147497, s = i * 2, c = 1e7;
	return a >= c && (o += Math.floor(a / c), a %= c), o >= c && (s += Math.floor(o / c), o %= c), s.toString() + bo(o) + bo(a);
}
function _o(e, t) {
	return {
		lo: e >>> 0,
		hi: t >>> 0
	};
}
function vo(e, t) {
	return {
		lo: e | 0,
		hi: t | 0
	};
}
function yo(e, t) {
	return t = ~t, e ? e = ~e + 1 : t += 1, vo(e, t);
}
var bo = (e) => {
	let t = String(e);
	return "0000000".slice(t.length) + t;
};
function xo() {
	let e = this.buf[this.pos++];
	if (!(e & 128)) return this.assertBounds(), e;
	let t = e & 127;
	if (e = this.buf[this.pos++], t |= (e & 127) << 7, !(e & 128) || (e = this.buf[this.pos++], t |= (e & 127) << 14, !(e & 128)) || (e = this.buf[this.pos++], t |= (e & 127) << 21, !(e & 128))) return this.assertBounds(), t;
	e = this.buf[this.pos++], t |= (e & 15) << 28;
	for (let t = 5; e & 128 && t < 10; t++) e = this.buf[this.pos++];
	if (e & 128) throw Error("invalid varint");
	return this.assertBounds(), t >>> 0;
}
// node_modules/@bufbuild/protobuf/dist/esm/proto-int64.js
var So = /*@__PURE__*/ Co();
function Co() {
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
			return typeof e != "string" && (e = e.toString()), wo(e), e;
		},
		uParse(e) {
			return typeof e != "string" && (e = e.toString()), To(e), e;
		},
		enc(e) {
			return typeof e != "string" && (e = e.toString()), wo(e), mo(e);
		},
		uEnc(e) {
			return typeof e != "string" && (e = e.toString()), To(e), mo(e);
		},
		dec(e, t) {
			return ho(e, t);
		},
		uDec(e, t) {
			return go(e, t);
		}
	};
}
function wo(e) {
	if (!/^-?[0-9]+$/.test(e)) throw Error("invalid int64: " + e);
}
function To(e) {
	if (!/^[0-9]+$/.test(e)) throw Error("invalid uint64: " + e);
}
// node_modules/@bufbuild/protobuf/dist/esm/wire/text-encoding.js
var Eo;
function Do(e) {
	Eo = Object.assign(Object.assign({}, e), { encodeUtf8Into: e.encodeUtf8Into ?? ko(e.encodeUtf8.bind(e)) });
}
function Oo() {
	if (!Eo) {
		let e = globalThis;
		if (!e.TextEncoder || !e.TextDecoder) throw Error("encoding API missing: install TextEncoder and TextDecoder on globalThis");
		let t = new e.TextEncoder(), n = new e.TextDecoder(), r, i = {
			encodeUtf8(e) {
				return t.encode(e);
			},
			decodeUtf8(t, i) {
				return i ? (r ||= new e.TextDecoder("utf-8", { fatal: !0 }), r.decode(t)) : n.decode(t);
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
		a && (i.checkUtf8 = (e) => a.call(e)), Do(i);
	}
	return Eo;
}
function ko(e) {
	return (t, n) => {
		let r = e(t);
		return n.set(r), { written: r.byteLength };
	};
}
// node_modules/@bufbuild/protobuf/dist/esm/wire/binary-encoding.js
var Ao;
(function(e) {
	e[e.Varint = 0] = "Varint", e[e.Bit64 = 1] = "Bit64", e[e.LengthDelimited = 2] = "LengthDelimited", e[e.StartGroup = 3] = "StartGroup", e[e.EndGroup = 4] = "EndGroup", e[e.Bit32 = 5] = "Bit32";
})(Ao ||= {});
var E = class {
	constructor(e) {
		this.stackPos = [], this.encodeUtf8Into = e ? ko(e) : Oo().encodeUtf8Into, this.buffer = No, this.viewCache = Po, this.pos = 0;
	}
	ensureCapacity(e) {
		let t = this.pos + e;
		if (t > this.buffer.length) {
			let e = this.buffer.length || jo;
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
		return this.stackPos.push(this.pos), this.ensureCapacity(Mo), this.buffer[this.pos++] = 0, this;
	}
	join() {
		let e = this.stackPos.pop();
		if (e === void 0) throw Error("invalid state, fork stack empty");
		let t = this.pos - e - Mo, n = Io(t);
		return n > Mo && (this.ensureCapacity(n - Mo), this.buffer.copyWithin(e + n, e + Mo, this.pos)), this.pos = e, this.uint32(t), this.pos += t, this;
	}
	tag(e, t) {
		return this.uint32((e << 3 | t) >>> 0);
	}
	raw(e) {
		return this.ensureCapacity(e.length), this.buffer.set(e, this.pos), this.pos += e.length, this;
	}
	uint32(e) {
		if (Ro(e), this.ensureCapacity(5), e < 128) return this.buffer[this.pos++] = e, this;
		for (; e > 127;) this.buffer[this.pos++] = e & 127 | 128, e >>>= 7;
		return this.buffer[this.pos++] = e, this;
	}
	int32(e) {
		if (Lo(e), e >= 0) return this.uint32(e);
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
		if (t <= Fo) {
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
		let n = Io(t), r = this.buffer, i = this.pos, { written: a } = this.encodeUtf8Into(e, r.subarray(i + n)), o = Io(a);
		return o != n && r.copyWithin(i + o, i + n, i + n + a), this.uint32(a), this.pos += a, this;
	}
	float(e) {
		return zo(e), this.ensureCapacity(4), this.view().setFloat32(this.pos, e, !0), this.pos += 4, this;
	}
	double(e) {
		return this.ensureCapacity(8), this.view().setFloat64(this.pos, e, !0), this.pos += 8, this;
	}
	fixed32(e) {
		return Ro(e), this.ensureCapacity(4), this.view().setUint32(this.pos, e, !0), this.pos += 4, this;
	}
	sfixed32(e) {
		return Lo(e), this.ensureCapacity(4), this.view().setInt32(this.pos, e, !0), this.pos += 4, this;
	}
	sint32(e) {
		return Lo(e), this.uint32((e << 1 ^ e >> 31) >>> 0);
	}
	sfixed64(e) {
		let t = So.enc(e);
		this.ensureCapacity(8);
		let n = this.view();
		return n.setInt32(this.pos, t.lo, !0), n.setInt32(this.pos + 4, t.hi, !0), this.pos += 8, this;
	}
	fixed64(e) {
		let t = So.uEnc(e);
		this.ensureCapacity(8);
		let n = this.view();
		return n.setInt32(this.pos, t.lo, !0), n.setInt32(this.pos + 4, t.hi, !0), this.pos += 8, this;
	}
	int64(e) {
		let t = So.enc(e);
		return this.writeVarint64(t.lo, t.hi);
	}
	sint64(e) {
		let t = So.enc(e), n = t.hi >> 31, r = t.lo << 1 ^ n, i = (t.hi << 1 | t.lo >>> 31) ^ n;
		return this.writeVarint64(r, i);
	}
	uint64(e) {
		let t = So.uEnc(e);
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
}, jo = 128, Mo = 1, No = /* @__PURE__ */ new Uint8Array(), Po = new DataView(No.buffer), Fo = 32;
function Io(e) {
	return e < 128 ? 1 : e < 16384 ? 2 : e < 2097152 ? 3 : e < 268435456 ? 4 : 5;
}
var D = class {
	constructor(e, t = Oo().decodeUtf8) {
		this.decodeUtf8 = t, this.varint64Lo = 0, this.varint64Hi = 0, this.varint64 = fo, this.uint32 = xo, this.buf = e, this.len = e.length, this.pos = 0, this.view = new DataView(e.buffer, e.byteOffset, e.byteLength);
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
			case Ao.Varint:
				for (; this.buf[this.pos++] & 128;);
				break;
			case Ao.Bit64: this.pos += 4;
			case Ao.Bit32:
				this.pos += 4;
				break;
			case Ao.LengthDelimited:
				let r = this.uint32();
				this.pos += r;
				break;
			case Ao.StartGroup:
				if (n <= 0) throw Error("maximum recursion depth reached");
				for (;;) {
					let [e, r] = this.tag();
					if (r === Ao.EndGroup) {
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
		return this.varint64(), So.dec(this.varint64Lo, this.varint64Hi);
	}
	uint64() {
		return this.varint64(), So.uDec(this.varint64Lo, this.varint64Hi);
	}
	sint64() {
		this.varint64();
		let e = this.varint64Lo, t = this.varint64Hi, n = -(e & 1);
		return e = (e >>> 1 | (t & 1) << 31) ^ n, t = t >>> 1 ^ n, So.dec(e, t);
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
		return So.uDec(this.sfixed32(), this.sfixed32());
	}
	sfixed64() {
		return So.dec(this.sfixed32(), this.sfixed32());
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
		let t = this.bytes(), n = t.length;
		if (n <= Fo) {
			let r = Array(n);
			for (let i = 0; i < n; i++) {
				let n = t[i];
				if (n > 127) return this.decodeUtf8(t, e);
				r[i] = n;
			}
			return String.fromCharCode.apply(String, r);
		}
		return this.decodeUtf8(t, e);
	}
};
function Lo(e) {
	if (typeof e == "string") e = Number(e);
	else if (typeof e != "number") throw Error("invalid int32: " + typeof e);
	if (!Number.isInteger(e) || e > 2147483647 || e < -2147483648) throw Error("invalid int32: " + e);
}
function Ro(e) {
	if (typeof e == "string") e = Number(e);
	else if (typeof e != "number") throw Error("invalid uint32: " + typeof e);
	if (!Number.isInteger(e) || e > 4294967295 || e < 0) throw Error("invalid uint32: " + e);
}
function zo(e) {
	if (typeof e == "string") {
		let t = e;
		if (e = Number(e), Number.isNaN(e) && t !== "NaN") throw Error("invalid float32: " + t);
	} else if (typeof e != "number") throw Error("invalid float32: " + typeof e);
	if (!Number.isFinite(Math.fround(e)) && Number.isFinite(e)) throw Error("invalid float32: " + e);
}
// node_modules/@ag-ui/proto/dist/index.mjs
var Bo = /* @__PURE__ */ function(e) {
	return e[e.NULL_VALUE = 0] = "NULL_VALUE", e[e.UNRECOGNIZED = -1] = "UNRECOGNIZED", e;
}({});
function Vo() {
	return { fields: {} };
}
var O = {
	encode(e, t = new E()) {
		return Object.entries(e.fields).forEach(([e, n]) => {
			n !== void 0 && Uo.encode({
				key: e,
				value: n
			}, t.uint32(10).fork()).join();
		}), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = Vo();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1: {
					if (e !== 10) break;
					let t = Uo.decode(n, n.uint32());
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
		return O.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Vo();
		return t.fields = Object.entries(e.fields ?? {}).reduce((e, [t, n]) => (n !== void 0 && (e[t] = n), e), {}), t;
	},
	wrap(e) {
		let t = Vo();
		if (e !== void 0) for (let n of Object.keys(e)) t.fields[n] = e[n];
		return t;
	},
	unwrap(e) {
		let t = {};
		if (e.fields) for (let n of Object.keys(e.fields)) t[n] = e.fields[n];
		return t;
	}
};
function Ho() {
	return {
		key: "",
		value: void 0
	};
}
var Uo = {
	encode(e, t = new E()) {
		return e.key !== "" && t.uint32(10).string(e.key), e.value !== void 0 && k.encode(k.wrap(e.value), t.uint32(18).fork()).join(), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = Ho();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.key = n.string();
					continue;
				case 2:
					if (e !== 18) break;
					i.value = k.unwrap(k.decode(n, n.uint32()));
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return Uo.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Ho();
		return t.key = e.key ?? "", t.value = e.value ?? void 0, t;
	}
};
function Wo() {
	return {
		nullValue: void 0,
		numberValue: void 0,
		stringValue: void 0,
		boolValue: void 0,
		structValue: void 0,
		listValue: void 0
	};
}
var k = {
	encode(e, t = new E()) {
		return e.nullValue !== void 0 && t.uint32(8).int32(e.nullValue), e.numberValue !== void 0 && t.uint32(17).double(e.numberValue), e.stringValue !== void 0 && t.uint32(26).string(e.stringValue), e.boolValue !== void 0 && t.uint32(32).bool(e.boolValue), e.structValue !== void 0 && O.encode(O.wrap(e.structValue), t.uint32(42).fork()).join(), e.listValue !== void 0 && Ko.encode(Ko.wrap(e.listValue), t.uint32(50).fork()).join(), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = Wo();
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
					i.structValue = O.unwrap(O.decode(n, n.uint32()));
					continue;
				case 6:
					if (e !== 50) break;
					i.listValue = Ko.unwrap(Ko.decode(n, n.uint32()));
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return k.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Wo();
		return t.nullValue = e.nullValue ?? void 0, t.numberValue = e.numberValue ?? void 0, t.stringValue = e.stringValue ?? void 0, t.boolValue = e.boolValue ?? void 0, t.structValue = e.structValue ?? void 0, t.listValue = e.listValue ?? void 0, t;
	},
	wrap(e) {
		let t = Wo();
		if (e === null) t.nullValue = Bo.NULL_VALUE;
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
function Go() {
	return { values: [] };
}
var Ko = {
	encode(e, t = new E()) {
		for (let n of e.values) k.encode(k.wrap(n), t.uint32(10).fork()).join();
		return t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = Go();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.values.push(k.unwrap(k.decode(n, n.uint32())));
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return Ko.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Go();
		return t.values = e.values?.map((e) => e) || [], t;
	},
	wrap(e) {
		let t = Go();
		return t.values = e ?? [], t;
	},
	unwrap(e) {
		return e?.hasOwnProperty("values") && globalThis.Array.isArray(e.values) ? e.values : e;
	}
}, qo = /* @__PURE__ */ function(e) {
	return e[e.ADD = 0] = "ADD", e[e.REMOVE = 1] = "REMOVE", e[e.REPLACE = 2] = "REPLACE", e[e.MOVE = 3] = "MOVE", e[e.COPY = 4] = "COPY", e[e.TEST = 5] = "TEST", e[e.UNRECOGNIZED = -1] = "UNRECOGNIZED", e;
}({});
function Jo() {
	return {
		op: 0,
		path: "",
		from: void 0,
		value: void 0
	};
}
var Yo = {
	encode(e, t = new E()) {
		return e.op !== 0 && t.uint32(8).int32(e.op), e.path !== "" && t.uint32(18).string(e.path), e.from !== void 0 && t.uint32(26).string(e.from), e.value !== void 0 && k.encode(k.wrap(e.value), t.uint32(34).fork()).join(), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = Jo();
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
					i.value = k.unwrap(k.decode(n, n.uint32()));
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return Yo.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Jo();
		return t.op = e.op ?? 0, t.path = e.path ?? "", t.from = e.from ?? void 0, t.value = e.value ?? void 0, t;
	}
};
function Xo() {
	return {
		text: "",
		id: void 0,
		metadata: void 0
	};
}
var Zo = {
	encode(e, t = new E()) {
		return e.text !== "" && t.uint32(10).string(e.text), e.id !== void 0 && t.uint32(18).string(e.id), e.metadata !== void 0 && k.encode(k.wrap(e.metadata), t.uint32(26).fork()).join(), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = Xo();
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
					i.metadata = k.unwrap(k.decode(n, n.uint32()));
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return Zo.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Xo();
		return t.text = e.text ?? "", t.id = e.id ?? void 0, t.metadata = e.metadata ?? void 0, t;
	}
};
function Qo() {
	return {
		source: void 0,
		metadata: void 0,
		id: void 0
	};
}
var $o = {
	encode(e, t = new E()) {
		return e.source !== void 0 && ss.encode(e.source, t.uint32(10).fork()).join(), e.metadata !== void 0 && k.encode(k.wrap(e.metadata), t.uint32(18).fork()).join(), e.id !== void 0 && t.uint32(26).string(e.id), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = Qo();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.source = ss.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.metadata = k.unwrap(k.decode(n, n.uint32()));
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
		return $o.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Qo();
		return t.source = e.source !== void 0 && e.source !== null ? ss.fromPartial(e.source) : void 0, t.metadata = e.metadata ?? void 0, t.id = e.id ?? void 0, t;
	}
};
function es() {
	return {
		value: "",
		mimeType: ""
	};
}
var ts = {
	encode(e, t = new E()) {
		return e.value !== "" && t.uint32(10).string(e.value), e.mimeType !== "" && t.uint32(18).string(e.mimeType), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = es();
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
		return ts.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = es();
		return t.value = e.value ?? "", t.mimeType = e.mimeType ?? "", t;
	}
};
function ns() {
	return {
		value: "",
		mimeType: void 0
	};
}
var rs = {
	encode(e, t = new E()) {
		return e.value !== "" && t.uint32(10).string(e.value), e.mimeType !== void 0 && t.uint32(18).string(e.mimeType), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = ns();
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
		return rs.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = ns();
		return t.value = e.value ?? "", t.mimeType = e.mimeType ?? void 0, t;
	}
};
function is() {
	return {
		value: "",
		provider: void 0,
		mimeType: void 0
	};
}
var as = {
	encode(e, t = new E()) {
		return e.value !== "" && t.uint32(10).string(e.value), e.provider !== void 0 && t.uint32(18).string(e.provider), e.mimeType !== void 0 && t.uint32(26).string(e.mimeType), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = is();
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
		return as.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = is();
		return t.value = e.value ?? "", t.provider = e.provider ?? void 0, t.mimeType = e.mimeType ?? void 0, t;
	}
};
function os() {
	return {
		data: void 0,
		url: void 0,
		file: void 0
	};
}
var ss = {
	encode(e, t = new E()) {
		return e.data !== void 0 && ts.encode(e.data, t.uint32(10).fork()).join(), e.url !== void 0 && rs.encode(e.url, t.uint32(18).fork()).join(), e.file !== void 0 && as.encode(e.file, t.uint32(26).fork()).join(), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = os();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.data = ts.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.url = rs.decode(n, n.uint32());
					continue;
				case 3:
					if (e !== 26) break;
					i.file = as.decode(n, n.uint32());
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
		return t.data = e.data !== void 0 && e.data !== null ? ts.fromPartial(e.data) : void 0, t.url = e.url !== void 0 && e.url !== null ? rs.fromPartial(e.url) : void 0, t.file = e.file !== void 0 && e.file !== null ? as.fromPartial(e.file) : void 0, t;
	}
};
function cs() {
	return {
		source: void 0,
		metadata: void 0,
		id: void 0
	};
}
var ls = {
	encode(e, t = new E()) {
		return e.source !== void 0 && ss.encode(e.source, t.uint32(10).fork()).join(), e.metadata !== void 0 && k.encode(k.wrap(e.metadata), t.uint32(18).fork()).join(), e.id !== void 0 && t.uint32(26).string(e.id), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = cs();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.source = ss.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.metadata = k.unwrap(k.decode(n, n.uint32()));
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
		return ls.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = cs();
		return t.source = e.source !== void 0 && e.source !== null ? ss.fromPartial(e.source) : void 0, t.metadata = e.metadata ?? void 0, t.id = e.id ?? void 0, t;
	}
};
function us() {
	return {
		source: void 0,
		metadata: void 0,
		id: void 0
	};
}
var ds = {
	encode(e, t = new E()) {
		return e.source !== void 0 && ss.encode(e.source, t.uint32(10).fork()).join(), e.metadata !== void 0 && k.encode(k.wrap(e.metadata), t.uint32(18).fork()).join(), e.id !== void 0 && t.uint32(26).string(e.id), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = us();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.source = ss.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.metadata = k.unwrap(k.decode(n, n.uint32()));
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
		return ds.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = us();
		return t.source = e.source !== void 0 && e.source !== null ? ss.fromPartial(e.source) : void 0, t.metadata = e.metadata ?? void 0, t.id = e.id ?? void 0, t;
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
	encode(e, t = new E()) {
		return e.source !== void 0 && ss.encode(e.source, t.uint32(10).fork()).join(), e.metadata !== void 0 && k.encode(k.wrap(e.metadata), t.uint32(18).fork()).join(), e.id !== void 0 && t.uint32(26).string(e.id), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = fs();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.source = ss.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.metadata = k.unwrap(k.decode(n, n.uint32()));
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
		return t.source = e.source !== void 0 && e.source !== null ? ss.fromPartial(e.source) : void 0, t.metadata = e.metadata ?? void 0, t.id = e.id ?? void 0, t;
	}
};
function ms() {
	return {
		text: void 0,
		image: void 0,
		audio: void 0,
		video: void 0,
		document: void 0
	};
}
var hs = {
	encode(e, t = new E()) {
		return e.text !== void 0 && Zo.encode(e.text, t.uint32(10).fork()).join(), e.image !== void 0 && $o.encode(e.image, t.uint32(18).fork()).join(), e.audio !== void 0 && ls.encode(e.audio, t.uint32(26).fork()).join(), e.video !== void 0 && ds.encode(e.video, t.uint32(34).fork()).join(), e.document !== void 0 && ps.encode(e.document, t.uint32(42).fork()).join(), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = ms();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.text = Zo.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.image = $o.decode(n, n.uint32());
					continue;
				case 3:
					if (e !== 26) break;
					i.audio = ls.decode(n, n.uint32());
					continue;
				case 4:
					if (e !== 34) break;
					i.video = ds.decode(n, n.uint32());
					continue;
				case 5:
					if (e !== 42) break;
					i.document = ps.decode(n, n.uint32());
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
		return t.text = e.text !== void 0 && e.text !== null ? Zo.fromPartial(e.text) : void 0, t.image = e.image !== void 0 && e.image !== null ? $o.fromPartial(e.image) : void 0, t.audio = e.audio !== void 0 && e.audio !== null ? ls.fromPartial(e.audio) : void 0, t.video = e.video !== void 0 && e.video !== null ? ds.fromPartial(e.video) : void 0, t.document = e.document !== void 0 && e.document !== null ? ps.fromPartial(e.document) : void 0, t;
	}
};
function gs() {
	return {
		id: "",
		type: "",
		function: void 0,
		metadata: void 0,
		encryptedValue: void 0
	};
}
var _s = {
	encode(e, t = new E()) {
		return e.id !== "" && t.uint32(10).string(e.id), e.type !== "" && t.uint32(18).string(e.type), e.function !== void 0 && ys.encode(e.function, t.uint32(26).fork()).join(), e.metadata !== void 0 && O.encode(O.wrap(e.metadata), t.uint32(34).fork()).join(), e.encryptedValue !== void 0 && t.uint32(42).string(e.encryptedValue), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = gs();
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
					i.function = ys.decode(n, n.uint32());
					continue;
				case 4:
					if (e !== 34) break;
					i.metadata = O.unwrap(O.decode(n, n.uint32()));
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
		return _s.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = gs();
		return t.id = e.id ?? "", t.type = e.type ?? "", t.function = e.function !== void 0 && e.function !== null ? ys.fromPartial(e.function) : void 0, t.metadata = e.metadata ?? void 0, t.encryptedValue = e.encryptedValue ?? void 0, t;
	}
};
function vs() {
	return {
		name: "",
		arguments: ""
	};
}
var ys = {
	encode(e, t = new E()) {
		return e.name !== "" && t.uint32(10).string(e.name), e.arguments !== "" && t.uint32(18).string(e.arguments), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = vs();
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
		return ys.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = vs();
		return t.name = e.name ?? "", t.arguments = e.arguments ?? "", t;
	}
};
function bs() {
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
var xs = {
	encode(e, t = new E()) {
		e.id !== "" && t.uint32(10).string(e.id), e.role !== "" && t.uint32(18).string(e.role), e.content !== void 0 && t.uint32(26).string(e.content), e.name !== void 0 && t.uint32(34).string(e.name);
		for (let n of e.toolCalls) _s.encode(n, t.uint32(42).fork()).join();
		e.toolCallId !== void 0 && t.uint32(50).string(e.toolCallId), e.error !== void 0 && t.uint32(58).string(e.error);
		for (let n of e.contentParts) hs.encode(n, t.uint32(66).fork()).join();
		return e.metadata !== void 0 && O.encode(O.wrap(e.metadata), t.uint32(74).fork()).join(), e.subagentRunId !== void 0 && t.uint32(82).string(e.subagentRunId), e.encryptedValue !== void 0 && t.uint32(90).string(e.encryptedValue), e.activityType !== void 0 && t.uint32(98).string(e.activityType), e.activityContent !== void 0 && O.encode(O.wrap(e.activityContent), t.uint32(106).fork()).join(), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = bs();
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
					i.toolCalls.push(_s.decode(n, n.uint32()));
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
					i.contentParts.push(hs.decode(n, n.uint32()));
					continue;
				case 9:
					if (e !== 74) break;
					i.metadata = O.unwrap(O.decode(n, n.uint32()));
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
					i.activityContent = O.unwrap(O.decode(n, n.uint32()));
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
		return t.id = e.id ?? "", t.role = e.role ?? "", t.content = e.content ?? void 0, t.name = e.name ?? void 0, t.toolCalls = e.toolCalls?.map((e) => _s.fromPartial(e)) || [], t.toolCallId = e.toolCallId ?? void 0, t.error = e.error ?? void 0, t.contentParts = e.contentParts?.map((e) => hs.fromPartial(e)) || [], t.metadata = e.metadata ?? void 0, t.subagentRunId = e.subagentRunId ?? void 0, t.encryptedValue = e.encryptedValue ?? void 0, t.activityType = e.activityType ?? void 0, t.activityContent = e.activityContent ?? void 0, t;
	}
};
function Ss() {
	return {
		name: "",
		description: "",
		parameters: void 0,
		metadata: void 0
	};
}
var Cs = {
	encode(e, t = new E()) {
		return e.name !== "" && t.uint32(10).string(e.name), e.description !== "" && t.uint32(18).string(e.description), e.parameters !== void 0 && k.encode(k.wrap(e.parameters), t.uint32(26).fork()).join(), e.metadata !== void 0 && O.encode(O.wrap(e.metadata), t.uint32(34).fork()).join(), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = Ss();
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
					i.parameters = k.unwrap(k.decode(n, n.uint32()));
					continue;
				case 4:
					if (e !== 34) break;
					i.metadata = O.unwrap(O.decode(n, n.uint32()));
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
		return t.name = e.name ?? "", t.description = e.description ?? "", t.parameters = e.parameters ?? void 0, t.metadata = e.metadata ?? void 0, t;
	}
};
function ws() {
	return {
		description: "",
		value: ""
	};
}
var Ts = {
	encode(e, t = new E()) {
		return e.description !== "" && t.uint32(10).string(e.description), e.value !== "" && t.uint32(18).string(e.value), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = ws();
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
		return Ts.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = ws();
		return t.description = e.description ?? "", t.value = e.value ?? "", t;
	}
};
function Es() {
	return {
		interruptId: "",
		status: "",
		payload: void 0,
		metadata: void 0
	};
}
var Ds = {
	encode(e, t = new E()) {
		return e.interruptId !== "" && t.uint32(10).string(e.interruptId), e.status !== "" && t.uint32(18).string(e.status), e.payload !== void 0 && k.encode(k.wrap(e.payload), t.uint32(26).fork()).join(), e.metadata !== void 0 && O.encode(O.wrap(e.metadata), t.uint32(34).fork()).join(), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = Es();
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
					i.payload = k.unwrap(k.decode(n, n.uint32()));
					continue;
				case 4:
					if (e !== 34) break;
					i.metadata = O.unwrap(O.decode(n, n.uint32()));
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
		return t.interruptId = e.interruptId ?? "", t.status = e.status ?? "", t.payload = e.payload ?? void 0, t.metadata = e.metadata ?? void 0, t;
	}
};
function Os() {
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
var ks = {
	encode(e, t = new E()) {
		e.threadId !== "" && t.uint32(10).string(e.threadId), e.runId !== "" && t.uint32(18).string(e.runId), e.parentRunId !== void 0 && t.uint32(26).string(e.parentRunId), e.state !== void 0 && k.encode(k.wrap(e.state), t.uint32(34).fork()).join();
		for (let n of e.messages) xs.encode(n, t.uint32(42).fork()).join();
		for (let n of e.tools) Cs.encode(n, t.uint32(50).fork()).join();
		for (let n of e.context) Ts.encode(n, t.uint32(58).fork()).join();
		e.forwardedProps !== void 0 && k.encode(k.wrap(e.forwardedProps), t.uint32(66).fork()).join();
		for (let n of e.resume) Ds.encode(n, t.uint32(74).fork()).join();
		return e.protocolVersion !== void 0 && t.uint32(82).string(e.protocolVersion), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = Os();
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
					i.state = k.unwrap(k.decode(n, n.uint32()));
					continue;
				case 5:
					if (e !== 42) break;
					i.messages.push(xs.decode(n, n.uint32()));
					continue;
				case 6:
					if (e !== 50) break;
					i.tools.push(Cs.decode(n, n.uint32()));
					continue;
				case 7:
					if (e !== 58) break;
					i.context.push(Ts.decode(n, n.uint32()));
					continue;
				case 8:
					if (e !== 66) break;
					i.forwardedProps = k.unwrap(k.decode(n, n.uint32()));
					continue;
				case 9:
					if (e !== 74) break;
					i.resume.push(Ds.decode(n, n.uint32()));
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
		return ks.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Os();
		return t.threadId = e.threadId ?? "", t.runId = e.runId ?? "", t.parentRunId = e.parentRunId ?? void 0, t.state = e.state ?? void 0, t.messages = e.messages?.map((e) => xs.fromPartial(e)) || [], t.tools = e.tools?.map((e) => Cs.fromPartial(e)) || [], t.context = e.context?.map((e) => Ts.fromPartial(e)) || [], t.forwardedProps = e.forwardedProps ?? void 0, t.resume = e.resume?.map((e) => Ds.fromPartial(e)) || [], t.protocolVersion = e.protocolVersion ?? void 0, t;
	}
};
function As() {
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
var js = {
	encode(e, t = new E()) {
		return e.id !== "" && t.uint32(10).string(e.id), e.reason !== "" && t.uint32(18).string(e.reason), e.message !== void 0 && t.uint32(26).string(e.message), e.toolCallId !== void 0 && t.uint32(34).string(e.toolCallId), e.responseSchema !== void 0 && k.encode(k.wrap(e.responseSchema), t.uint32(42).fork()).join(), e.expiresAt !== void 0 && t.uint32(50).string(e.expiresAt), e.metadata !== void 0 && k.encode(k.wrap(e.metadata), t.uint32(58).fork()).join(), e.subagentRunId !== void 0 && t.uint32(66).string(e.subagentRunId), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = As();
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
					i.responseSchema = k.unwrap(k.decode(n, n.uint32()));
					continue;
				case 6:
					if (e !== 50) break;
					i.expiresAt = n.string();
					continue;
				case 7:
					if (e !== 58) break;
					i.metadata = k.unwrap(k.decode(n, n.uint32()));
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
		return js.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = As();
		return t.id = e.id ?? "", t.reason = e.reason ?? "", t.message = e.message ?? void 0, t.toolCallId = e.toolCallId ?? void 0, t.responseSchema = e.responseSchema ?? void 0, t.expiresAt = e.expiresAt ?? void 0, t.metadata = e.metadata ?? void 0, t.subagentRunId = e.subagentRunId ?? void 0, t;
	}
}, Ms = /* @__PURE__ */ function(e) {
	return e[e.TEXT_MESSAGE_START = 0] = "TEXT_MESSAGE_START", e[e.TEXT_MESSAGE_CONTENT = 1] = "TEXT_MESSAGE_CONTENT", e[e.TEXT_MESSAGE_END = 2] = "TEXT_MESSAGE_END", e[e.TOOL_CALL_START = 3] = "TOOL_CALL_START", e[e.TOOL_CALL_ARGS = 4] = "TOOL_CALL_ARGS", e[e.TOOL_CALL_END = 5] = "TOOL_CALL_END", e[e.STATE_SNAPSHOT = 6] = "STATE_SNAPSHOT", e[e.STATE_DELTA = 7] = "STATE_DELTA", e[e.MESSAGES_SNAPSHOT = 8] = "MESSAGES_SNAPSHOT", e[e.RAW = 9] = "RAW", e[e.CUSTOM = 10] = "CUSTOM", e[e.RUN_STARTED = 11] = "RUN_STARTED", e[e.RUN_FINISHED = 12] = "RUN_FINISHED", e[e.RUN_ERROR = 13] = "RUN_ERROR", e[e.STEP_STARTED = 14] = "STEP_STARTED", e[e.STEP_FINISHED = 15] = "STEP_FINISHED", e[e.SUBAGENT_STARTED = 16] = "SUBAGENT_STARTED", e[e.SUBAGENT_FINISHED = 17] = "SUBAGENT_FINISHED", e[e.SUBAGENT_ERROR = 18] = "SUBAGENT_ERROR", e[e.TEXT_MESSAGE_CHUNK = 19] = "TEXT_MESSAGE_CHUNK", e[e.TOOL_CALL_CHUNK = 20] = "TOOL_CALL_CHUNK", e[e.TOOL_CALL_RESULT = 21] = "TOOL_CALL_RESULT", e[e.ACTIVITY_SNAPSHOT = 22] = "ACTIVITY_SNAPSHOT", e[e.ACTIVITY_DELTA = 23] = "ACTIVITY_DELTA", e[e.REASONING_START = 24] = "REASONING_START", e[e.REASONING_MESSAGE_START = 25] = "REASONING_MESSAGE_START", e[e.REASONING_MESSAGE_CONTENT = 26] = "REASONING_MESSAGE_CONTENT", e[e.REASONING_MESSAGE_END = 27] = "REASONING_MESSAGE_END", e[e.REASONING_MESSAGE_CHUNK = 28] = "REASONING_MESSAGE_CHUNK", e[e.REASONING_END = 29] = "REASONING_END", e[e.REASONING_ENCRYPTED_VALUE = 30] = "REASONING_ENCRYPTED_VALUE", e[e.UNRECOGNIZED = -1] = "UNRECOGNIZED", e;
}({});
function Ns() {
	return {
		type: 0,
		timestamp: void 0,
		rawEvent: void 0,
		metadata: void 0
	};
}
var A = {
	encode(e, t = new E()) {
		return e.type !== 0 && t.uint32(8).int32(e.type), e.timestamp !== void 0 && t.uint32(16).int64(e.timestamp), e.rawEvent !== void 0 && k.encode(k.wrap(e.rawEvent), t.uint32(26).fork()).join(), e.metadata !== void 0 && O.encode(O.wrap(e.metadata), t.uint32(34).fork()).join(), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = Ns();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 8) break;
					i.type = n.int32();
					continue;
				case 2:
					if (e !== 16) break;
					i.timestamp = Kc(n.int64());
					continue;
				case 3:
					if (e !== 26) break;
					i.rawEvent = k.unwrap(k.decode(n, n.uint32()));
					continue;
				case 4:
					if (e !== 34) break;
					i.metadata = O.unwrap(O.decode(n, n.uint32()));
					continue;
			}
			if ((e & 7) == 4 || e === 0) break;
			n.skip(e & 7);
		}
		return i;
	},
	create(e) {
		return A.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Ns();
		return t.type = e.type ?? 0, t.timestamp = e.timestamp ?? void 0, t.rawEvent = e.rawEvent ?? void 0, t.metadata = e.metadata ?? void 0, t;
	}
};
function Ps() {
	return {
		baseEvent: void 0,
		messageId: "",
		role: void 0,
		name: void 0,
		subagentRunId: void 0
	};
}
var Fs = {
	encode(e, t = new E()) {
		return e.baseEvent !== void 0 && A.encode(e.baseEvent, t.uint32(10).fork()).join(), e.messageId !== "" && t.uint32(18).string(e.messageId), e.role !== void 0 && t.uint32(26).string(e.role), e.name !== void 0 && t.uint32(34).string(e.name), e.subagentRunId !== void 0 && t.uint32(42).string(e.subagentRunId), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = Ps();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = A.decode(n, n.uint32());
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
		return Fs.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Ps();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? A.fromPartial(e.baseEvent) : void 0, t.messageId = e.messageId ?? "", t.role = e.role ?? void 0, t.name = e.name ?? void 0, t.subagentRunId = e.subagentRunId ?? void 0, t;
	}
};
function Is() {
	return {
		baseEvent: void 0,
		messageId: "",
		delta: "",
		subagentRunId: void 0
	};
}
var Ls = {
	encode(e, t = new E()) {
		return e.baseEvent !== void 0 && A.encode(e.baseEvent, t.uint32(10).fork()).join(), e.messageId !== "" && t.uint32(18).string(e.messageId), e.delta !== "" && t.uint32(26).string(e.delta), e.subagentRunId !== void 0 && t.uint32(34).string(e.subagentRunId), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = Is();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = A.decode(n, n.uint32());
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
		return Ls.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Is();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? A.fromPartial(e.baseEvent) : void 0, t.messageId = e.messageId ?? "", t.delta = e.delta ?? "", t.subagentRunId = e.subagentRunId ?? void 0, t;
	}
};
function Rs() {
	return {
		baseEvent: void 0,
		messageId: "",
		subagentRunId: void 0
	};
}
var zs = {
	encode(e, t = new E()) {
		return e.baseEvent !== void 0 && A.encode(e.baseEvent, t.uint32(10).fork()).join(), e.messageId !== "" && t.uint32(18).string(e.messageId), e.subagentRunId !== void 0 && t.uint32(26).string(e.subagentRunId), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = Rs();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = A.decode(n, n.uint32());
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
		return zs.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Rs();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? A.fromPartial(e.baseEvent) : void 0, t.messageId = e.messageId ?? "", t.subagentRunId = e.subagentRunId ?? void 0, t;
	}
};
function Bs() {
	return {
		baseEvent: void 0,
		messageId: void 0,
		role: void 0,
		delta: void 0,
		name: void 0,
		subagentRunId: void 0
	};
}
var Vs = {
	encode(e, t = new E()) {
		return e.baseEvent !== void 0 && A.encode(e.baseEvent, t.uint32(10).fork()).join(), e.messageId !== void 0 && t.uint32(18).string(e.messageId), e.role !== void 0 && t.uint32(26).string(e.role), e.delta !== void 0 && t.uint32(34).string(e.delta), e.name !== void 0 && t.uint32(42).string(e.name), e.subagentRunId !== void 0 && t.uint32(50).string(e.subagentRunId), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = Bs();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = A.decode(n, n.uint32());
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
		return Vs.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Bs();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? A.fromPartial(e.baseEvent) : void 0, t.messageId = e.messageId ?? void 0, t.role = e.role ?? void 0, t.delta = e.delta ?? void 0, t.name = e.name ?? void 0, t.subagentRunId = e.subagentRunId ?? void 0, t;
	}
};
function Hs() {
	return {
		baseEvent: void 0,
		toolCallId: "",
		toolCallName: "",
		parentMessageId: void 0,
		subagentRunId: void 0
	};
}
var Us = {
	encode(e, t = new E()) {
		return e.baseEvent !== void 0 && A.encode(e.baseEvent, t.uint32(10).fork()).join(), e.toolCallId !== "" && t.uint32(18).string(e.toolCallId), e.toolCallName !== "" && t.uint32(26).string(e.toolCallName), e.parentMessageId !== void 0 && t.uint32(34).string(e.parentMessageId), e.subagentRunId !== void 0 && t.uint32(42).string(e.subagentRunId), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = Hs();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = A.decode(n, n.uint32());
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
		return Us.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Hs();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? A.fromPartial(e.baseEvent) : void 0, t.toolCallId = e.toolCallId ?? "", t.toolCallName = e.toolCallName ?? "", t.parentMessageId = e.parentMessageId ?? void 0, t.subagentRunId = e.subagentRunId ?? void 0, t;
	}
};
function Ws() {
	return {
		baseEvent: void 0,
		toolCallId: "",
		delta: "",
		subagentRunId: void 0
	};
}
var Gs = {
	encode(e, t = new E()) {
		return e.baseEvent !== void 0 && A.encode(e.baseEvent, t.uint32(10).fork()).join(), e.toolCallId !== "" && t.uint32(18).string(e.toolCallId), e.delta !== "" && t.uint32(26).string(e.delta), e.subagentRunId !== void 0 && t.uint32(34).string(e.subagentRunId), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = Ws();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = A.decode(n, n.uint32());
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
		return Gs.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Ws();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? A.fromPartial(e.baseEvent) : void 0, t.toolCallId = e.toolCallId ?? "", t.delta = e.delta ?? "", t.subagentRunId = e.subagentRunId ?? void 0, t;
	}
};
function Ks() {
	return {
		baseEvent: void 0,
		toolCallId: "",
		subagentRunId: void 0
	};
}
var qs = {
	encode(e, t = new E()) {
		return e.baseEvent !== void 0 && A.encode(e.baseEvent, t.uint32(10).fork()).join(), e.toolCallId !== "" && t.uint32(18).string(e.toolCallId), e.subagentRunId !== void 0 && t.uint32(26).string(e.subagentRunId), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = Ks();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = A.decode(n, n.uint32());
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
		return qs.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Ks();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? A.fromPartial(e.baseEvent) : void 0, t.toolCallId = e.toolCallId ?? "", t.subagentRunId = e.subagentRunId ?? void 0, t;
	}
};
function Js() {
	return {
		baseEvent: void 0,
		toolCallId: void 0,
		toolCallName: void 0,
		parentMessageId: void 0,
		delta: void 0,
		subagentRunId: void 0
	};
}
var Ys = {
	encode(e, t = new E()) {
		return e.baseEvent !== void 0 && A.encode(e.baseEvent, t.uint32(10).fork()).join(), e.toolCallId !== void 0 && t.uint32(18).string(e.toolCallId), e.toolCallName !== void 0 && t.uint32(26).string(e.toolCallName), e.parentMessageId !== void 0 && t.uint32(34).string(e.parentMessageId), e.delta !== void 0 && t.uint32(42).string(e.delta), e.subagentRunId !== void 0 && t.uint32(50).string(e.subagentRunId), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = Js();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = A.decode(n, n.uint32());
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
		return Ys.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Js();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? A.fromPartial(e.baseEvent) : void 0, t.toolCallId = e.toolCallId ?? void 0, t.toolCallName = e.toolCallName ?? void 0, t.parentMessageId = e.parentMessageId ?? void 0, t.delta = e.delta ?? void 0, t.subagentRunId = e.subagentRunId ?? void 0, t;
	}
};
function Xs() {
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
var Zs = {
	encode(e, t = new E()) {
		e.baseEvent !== void 0 && A.encode(e.baseEvent, t.uint32(10).fork()).join(), e.subagentRunId !== void 0 && t.uint32(18).string(e.subagentRunId), e.messageId !== "" && t.uint32(26).string(e.messageId), e.toolCallId !== "" && t.uint32(34).string(e.toolCallId), e.content !== void 0 && t.uint32(42).string(e.content), e.role !== void 0 && t.uint32(50).string(e.role);
		for (let n of e.contentParts) hs.encode(n, t.uint32(58).fork()).join();
		return t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = Xs();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = A.decode(n, n.uint32());
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
					i.contentParts.push(hs.decode(n, n.uint32()));
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
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? A.fromPartial(e.baseEvent) : void 0, t.subagentRunId = e.subagentRunId ?? void 0, t.messageId = e.messageId ?? "", t.toolCallId = e.toolCallId ?? "", t.content = e.content ?? void 0, t.role = e.role ?? void 0, t.contentParts = e.contentParts?.map((e) => hs.fromPartial(e)) || [], t;
	}
};
function Qs() {
	return {
		baseEvent: void 0,
		snapshot: void 0,
		subagentRunId: void 0
	};
}
var $s = {
	encode(e, t = new E()) {
		return e.baseEvent !== void 0 && A.encode(e.baseEvent, t.uint32(10).fork()).join(), e.snapshot !== void 0 && k.encode(k.wrap(e.snapshot), t.uint32(18).fork()).join(), e.subagentRunId !== void 0 && t.uint32(26).string(e.subagentRunId), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = Qs();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = A.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.snapshot = k.unwrap(k.decode(n, n.uint32()));
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
		return $s.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Qs();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? A.fromPartial(e.baseEvent) : void 0, t.snapshot = e.snapshot ?? void 0, t.subagentRunId = e.subagentRunId ?? void 0, t;
	}
};
function ec() {
	return {
		baseEvent: void 0,
		delta: [],
		subagentRunId: void 0
	};
}
var tc = {
	encode(e, t = new E()) {
		e.baseEvent !== void 0 && A.encode(e.baseEvent, t.uint32(10).fork()).join();
		for (let n of e.delta) Yo.encode(n, t.uint32(18).fork()).join();
		return e.subagentRunId !== void 0 && t.uint32(26).string(e.subagentRunId), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = ec();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = A.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.delta.push(Yo.decode(n, n.uint32()));
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
		return tc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = ec();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? A.fromPartial(e.baseEvent) : void 0, t.delta = e.delta?.map((e) => Yo.fromPartial(e)) || [], t.subagentRunId = e.subagentRunId ?? void 0, t;
	}
};
function nc() {
	return {
		baseEvent: void 0,
		messages: []
	};
}
var rc = {
	encode(e, t = new E()) {
		e.baseEvent !== void 0 && A.encode(e.baseEvent, t.uint32(10).fork()).join();
		for (let n of e.messages) xs.encode(n, t.uint32(18).fork()).join();
		return t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = nc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = A.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.messages.push(xs.decode(n, n.uint32()));
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
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? A.fromPartial(e.baseEvent) : void 0, t.messages = e.messages?.map((e) => xs.fromPartial(e)) || [], t;
	}
};
function ic() {
	return {
		baseEvent: void 0,
		subagentRunId: void 0,
		messageId: "",
		activityType: "",
		content: void 0,
		replace: void 0
	};
}
var ac = {
	encode(e, t = new E()) {
		return e.baseEvent !== void 0 && A.encode(e.baseEvent, t.uint32(10).fork()).join(), e.subagentRunId !== void 0 && t.uint32(18).string(e.subagentRunId), e.messageId !== "" && t.uint32(26).string(e.messageId), e.activityType !== "" && t.uint32(34).string(e.activityType), e.content !== void 0 && O.encode(O.wrap(e.content), t.uint32(42).fork()).join(), e.replace !== void 0 && t.uint32(48).bool(e.replace), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = ic();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = A.decode(n, n.uint32());
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
					i.content = O.unwrap(O.decode(n, n.uint32()));
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
		return ac.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = ic();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? A.fromPartial(e.baseEvent) : void 0, t.subagentRunId = e.subagentRunId ?? void 0, t.messageId = e.messageId ?? "", t.activityType = e.activityType ?? "", t.content = e.content ?? void 0, t.replace = e.replace ?? void 0, t;
	}
};
function oc() {
	return {
		baseEvent: void 0,
		subagentRunId: void 0,
		messageId: "",
		activityType: "",
		patch: []
	};
}
var sc = {
	encode(e, t = new E()) {
		e.baseEvent !== void 0 && A.encode(e.baseEvent, t.uint32(10).fork()).join(), e.subagentRunId !== void 0 && t.uint32(18).string(e.subagentRunId), e.messageId !== "" && t.uint32(26).string(e.messageId), e.activityType !== "" && t.uint32(34).string(e.activityType);
		for (let n of e.patch) Yo.encode(n, t.uint32(42).fork()).join();
		return t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = oc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = A.decode(n, n.uint32());
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
					i.patch.push(Yo.decode(n, n.uint32()));
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
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? A.fromPartial(e.baseEvent) : void 0, t.subagentRunId = e.subagentRunId ?? void 0, t.messageId = e.messageId ?? "", t.activityType = e.activityType ?? "", t.patch = e.patch?.map((e) => Yo.fromPartial(e)) || [], t;
	}
};
function cc() {
	return {
		baseEvent: void 0,
		event: void 0,
		source: void 0,
		subagentRunId: void 0
	};
}
var lc = {
	encode(e, t = new E()) {
		return e.baseEvent !== void 0 && A.encode(e.baseEvent, t.uint32(10).fork()).join(), e.event !== void 0 && k.encode(k.wrap(e.event), t.uint32(18).fork()).join(), e.source !== void 0 && t.uint32(26).string(e.source), e.subagentRunId !== void 0 && t.uint32(34).string(e.subagentRunId), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = cc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = A.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.event = k.unwrap(k.decode(n, n.uint32()));
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
		return lc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = cc();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? A.fromPartial(e.baseEvent) : void 0, t.event = e.event ?? void 0, t.source = e.source ?? void 0, t.subagentRunId = e.subagentRunId ?? void 0, t;
	}
};
function uc() {
	return {
		baseEvent: void 0,
		name: "",
		value: void 0,
		subagentRunId: void 0
	};
}
var dc = {
	encode(e, t = new E()) {
		return e.baseEvent !== void 0 && A.encode(e.baseEvent, t.uint32(10).fork()).join(), e.name !== "" && t.uint32(18).string(e.name), e.value !== void 0 && k.encode(k.wrap(e.value), t.uint32(26).fork()).join(), e.subagentRunId !== void 0 && t.uint32(34).string(e.subagentRunId), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = uc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = A.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.name = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.value = k.unwrap(k.decode(n, n.uint32()));
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
		return dc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = uc();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? A.fromPartial(e.baseEvent) : void 0, t.name = e.name ?? "", t.value = e.value ?? void 0, t.subagentRunId = e.subagentRunId ?? void 0, t;
	}
};
function fc() {
	return {
		baseEvent: void 0,
		threadId: "",
		runId: "",
		parentRunId: void 0,
		input: void 0,
		protocolVersion: void 0
	};
}
var pc = {
	encode(e, t = new E()) {
		return e.baseEvent !== void 0 && A.encode(e.baseEvent, t.uint32(10).fork()).join(), e.threadId !== "" && t.uint32(18).string(e.threadId), e.runId !== "" && t.uint32(26).string(e.runId), e.parentRunId !== void 0 && t.uint32(34).string(e.parentRunId), e.input !== void 0 && ks.encode(e.input, t.uint32(42).fork()).join(), e.protocolVersion !== void 0 && t.uint32(50).string(e.protocolVersion), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = fc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = A.decode(n, n.uint32());
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
					i.input = ks.decode(n, n.uint32());
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
		return pc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = fc();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? A.fromPartial(e.baseEvent) : void 0, t.threadId = e.threadId ?? "", t.runId = e.runId ?? "", t.parentRunId = e.parentRunId ?? void 0, t.input = e.input !== void 0 && e.input !== null ? ks.fromPartial(e.input) : void 0, t.protocolVersion = e.protocolVersion ?? void 0, t;
	}
};
function mc() {
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
var hc = {
	encode(e, t = new E()) {
		e.baseEvent !== void 0 && A.encode(e.baseEvent, t.uint32(10).fork()).join(), e.threadId !== "" && t.uint32(18).string(e.threadId), e.runId !== "" && t.uint32(26).string(e.runId), e.result !== void 0 && k.encode(k.wrap(e.result), t.uint32(34).fork()).join(), e.outcome !== "" && t.uint32(42).string(e.outcome);
		for (let n of e.interrupts) js.encode(n, t.uint32(50).fork()).join();
		for (let n of e.usage) Gc.encode(n, t.uint32(58).fork()).join();
		for (let n of e.pendingToolCallIds) t.uint32(66).string(n);
		return t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = mc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = A.decode(n, n.uint32());
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
					i.result = k.unwrap(k.decode(n, n.uint32()));
					continue;
				case 5:
					if (e !== 42) break;
					i.outcome = n.string();
					continue;
				case 6:
					if (e !== 50) break;
					i.interrupts.push(js.decode(n, n.uint32()));
					continue;
				case 7:
					if (e !== 58) break;
					i.usage.push(Gc.decode(n, n.uint32()));
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
		return hc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = mc();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? A.fromPartial(e.baseEvent) : void 0, t.threadId = e.threadId ?? "", t.runId = e.runId ?? "", t.result = e.result ?? void 0, t.outcome = e.outcome ?? "", t.interrupts = e.interrupts?.map((e) => js.fromPartial(e)) || [], t.usage = e.usage?.map((e) => Gc.fromPartial(e)) || [], t.pendingToolCallIds = e.pendingToolCallIds?.map((e) => e) || [], t;
	}
};
function gc() {
	return {
		baseEvent: void 0,
		code: void 0,
		message: "",
		usage: []
	};
}
var _c = {
	encode(e, t = new E()) {
		e.baseEvent !== void 0 && A.encode(e.baseEvent, t.uint32(10).fork()).join(), e.code !== void 0 && t.uint32(18).string(e.code), e.message !== "" && t.uint32(26).string(e.message);
		for (let n of e.usage) Gc.encode(n, t.uint32(34).fork()).join();
		return t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = gc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = A.decode(n, n.uint32());
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
					i.usage.push(Gc.decode(n, n.uint32()));
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
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? A.fromPartial(e.baseEvent) : void 0, t.code = e.code ?? void 0, t.message = e.message ?? "", t.usage = e.usage?.map((e) => Gc.fromPartial(e)) || [], t;
	}
};
function vc() {
	return {
		baseEvent: void 0,
		stepName: "",
		subagentRunId: void 0
	};
}
var yc = {
	encode(e, t = new E()) {
		return e.baseEvent !== void 0 && A.encode(e.baseEvent, t.uint32(10).fork()).join(), e.stepName !== "" && t.uint32(18).string(e.stepName), e.subagentRunId !== void 0 && t.uint32(26).string(e.subagentRunId), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = vc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = A.decode(n, n.uint32());
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
		return yc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = vc();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? A.fromPartial(e.baseEvent) : void 0, t.stepName = e.stepName ?? "", t.subagentRunId = e.subagentRunId ?? void 0, t;
	}
};
function bc() {
	return {
		baseEvent: void 0,
		stepName: "",
		subagentRunId: void 0
	};
}
var xc = {
	encode(e, t = new E()) {
		return e.baseEvent !== void 0 && A.encode(e.baseEvent, t.uint32(10).fork()).join(), e.stepName !== "" && t.uint32(18).string(e.stepName), e.subagentRunId !== void 0 && t.uint32(26).string(e.subagentRunId), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = bc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = A.decode(n, n.uint32());
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
		return xc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = bc();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? A.fromPartial(e.baseEvent) : void 0, t.stepName = e.stepName ?? "", t.subagentRunId = e.subagentRunId ?? void 0, t;
	}
};
function Sc() {
	return {
		baseEvent: void 0,
		subagentRunId: void 0,
		messageId: ""
	};
}
var Cc = {
	encode(e, t = new E()) {
		return e.baseEvent !== void 0 && A.encode(e.baseEvent, t.uint32(10).fork()).join(), e.subagentRunId !== void 0 && t.uint32(18).string(e.subagentRunId), e.messageId !== "" && t.uint32(26).string(e.messageId), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = Sc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = A.decode(n, n.uint32());
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
		return Cc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Sc();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? A.fromPartial(e.baseEvent) : void 0, t.subagentRunId = e.subagentRunId ?? void 0, t.messageId = e.messageId ?? "", t;
	}
};
function wc() {
	return {
		baseEvent: void 0,
		subagentRunId: void 0,
		messageId: "",
		role: ""
	};
}
var Tc = {
	encode(e, t = new E()) {
		return e.baseEvent !== void 0 && A.encode(e.baseEvent, t.uint32(10).fork()).join(), e.subagentRunId !== void 0 && t.uint32(18).string(e.subagentRunId), e.messageId !== "" && t.uint32(26).string(e.messageId), e.role !== "" && t.uint32(34).string(e.role), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = wc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = A.decode(n, n.uint32());
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
		return Tc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = wc();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? A.fromPartial(e.baseEvent) : void 0, t.subagentRunId = e.subagentRunId ?? void 0, t.messageId = e.messageId ?? "", t.role = e.role ?? "", t;
	}
};
function Ec() {
	return {
		baseEvent: void 0,
		subagentRunId: void 0,
		messageId: "",
		delta: ""
	};
}
var Dc = {
	encode(e, t = new E()) {
		return e.baseEvent !== void 0 && A.encode(e.baseEvent, t.uint32(10).fork()).join(), e.subagentRunId !== void 0 && t.uint32(18).string(e.subagentRunId), e.messageId !== "" && t.uint32(26).string(e.messageId), e.delta !== "" && t.uint32(34).string(e.delta), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = Ec();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = A.decode(n, n.uint32());
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
		return Dc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Ec();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? A.fromPartial(e.baseEvent) : void 0, t.subagentRunId = e.subagentRunId ?? void 0, t.messageId = e.messageId ?? "", t.delta = e.delta ?? "", t;
	}
};
function Oc() {
	return {
		baseEvent: void 0,
		subagentRunId: void 0,
		messageId: ""
	};
}
var kc = {
	encode(e, t = new E()) {
		return e.baseEvent !== void 0 && A.encode(e.baseEvent, t.uint32(10).fork()).join(), e.subagentRunId !== void 0 && t.uint32(18).string(e.subagentRunId), e.messageId !== "" && t.uint32(26).string(e.messageId), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = Oc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = A.decode(n, n.uint32());
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
		return kc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Oc();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? A.fromPartial(e.baseEvent) : void 0, t.subagentRunId = e.subagentRunId ?? void 0, t.messageId = e.messageId ?? "", t;
	}
};
function Ac() {
	return {
		baseEvent: void 0,
		subagentRunId: void 0,
		messageId: void 0,
		delta: void 0
	};
}
var jc = {
	encode(e, t = new E()) {
		return e.baseEvent !== void 0 && A.encode(e.baseEvent, t.uint32(10).fork()).join(), e.subagentRunId !== void 0 && t.uint32(18).string(e.subagentRunId), e.messageId !== void 0 && t.uint32(26).string(e.messageId), e.delta !== void 0 && t.uint32(34).string(e.delta), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = Ac();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = A.decode(n, n.uint32());
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
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? A.fromPartial(e.baseEvent) : void 0, t.subagentRunId = e.subagentRunId ?? void 0, t.messageId = e.messageId ?? void 0, t.delta = e.delta ?? void 0, t;
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
	encode(e, t = new E()) {
		return e.baseEvent !== void 0 && A.encode(e.baseEvent, t.uint32(10).fork()).join(), e.subagentRunId !== void 0 && t.uint32(18).string(e.subagentRunId), e.messageId !== "" && t.uint32(26).string(e.messageId), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = Mc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = A.decode(n, n.uint32());
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
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? A.fromPartial(e.baseEvent) : void 0, t.subagentRunId = e.subagentRunId ?? void 0, t.messageId = e.messageId ?? "", t;
	}
};
function Pc() {
	return {
		baseEvent: void 0,
		subagentRunId: void 0,
		subtype: "",
		entityId: "",
		encryptedValue: ""
	};
}
var Fc = {
	encode(e, t = new E()) {
		return e.baseEvent !== void 0 && A.encode(e.baseEvent, t.uint32(10).fork()).join(), e.subagentRunId !== void 0 && t.uint32(18).string(e.subagentRunId), e.subtype !== "" && t.uint32(26).string(e.subtype), e.entityId !== "" && t.uint32(34).string(e.entityId), e.encryptedValue !== "" && t.uint32(42).string(e.encryptedValue), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = Pc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = A.decode(n, n.uint32());
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
		return Fc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Pc();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? A.fromPartial(e.baseEvent) : void 0, t.subagentRunId = e.subagentRunId ?? void 0, t.subtype = e.subtype ?? "", t.entityId = e.entityId ?? "", t.encryptedValue = e.encryptedValue ?? "", t;
	}
};
function Ic() {
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
var Lc = {
	encode(e, t = new E()) {
		return e.baseEvent !== void 0 && A.encode(e.baseEvent, t.uint32(10).fork()).join(), e.subagentRunId !== "" && t.uint32(18).string(e.subagentRunId), e.name !== "" && t.uint32(26).string(e.name), e.description !== void 0 && t.uint32(34).string(e.description), e.parentSubagentRunId !== void 0 && t.uint32(42).string(e.parentSubagentRunId), e.parentToolCallId !== void 0 && t.uint32(50).string(e.parentToolCallId), e.parentMessageId !== void 0 && t.uint32(58).string(e.parentMessageId), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = Ic();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = A.decode(n, n.uint32());
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
		return Lc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Ic();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? A.fromPartial(e.baseEvent) : void 0, t.subagentRunId = e.subagentRunId ?? "", t.name = e.name ?? "", t.description = e.description ?? void 0, t.parentSubagentRunId = e.parentSubagentRunId ?? void 0, t.parentToolCallId = e.parentToolCallId ?? void 0, t.parentMessageId = e.parentMessageId ?? void 0, t;
	}
};
function Rc() {
	return {
		baseEvent: void 0,
		subagentRunId: "",
		result: void 0,
		outcome: "",
		interruptIds: []
	};
}
var zc = {
	encode(e, t = new E()) {
		e.baseEvent !== void 0 && A.encode(e.baseEvent, t.uint32(10).fork()).join(), e.subagentRunId !== "" && t.uint32(18).string(e.subagentRunId), e.result !== void 0 && k.encode(k.wrap(e.result), t.uint32(26).fork()).join(), e.outcome !== "" && t.uint32(34).string(e.outcome);
		for (let n of e.interruptIds) t.uint32(42).string(n);
		return t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = Rc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = A.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.subagentRunId = n.string();
					continue;
				case 3:
					if (e !== 26) break;
					i.result = k.unwrap(k.decode(n, n.uint32()));
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
		return zc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Rc();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? A.fromPartial(e.baseEvent) : void 0, t.subagentRunId = e.subagentRunId ?? "", t.result = e.result ?? void 0, t.outcome = e.outcome ?? "", t.interruptIds = e.interruptIds?.map((e) => e) || [], t;
	}
};
function Bc() {
	return {
		baseEvent: void 0,
		subagentRunId: "",
		message: "",
		code: void 0
	};
}
var Vc = {
	encode(e, t = new E()) {
		return e.baseEvent !== void 0 && A.encode(e.baseEvent, t.uint32(10).fork()).join(), e.subagentRunId !== "" && t.uint32(18).string(e.subagentRunId), e.message !== "" && t.uint32(26).string(e.message), e.code !== void 0 && t.uint32(34).string(e.code), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = Bc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.baseEvent = A.decode(n, n.uint32());
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
		return Vc.fromPartial(e ?? {});
	},
	fromPartial(e) {
		let t = Bc();
		return t.baseEvent = e.baseEvent !== void 0 && e.baseEvent !== null ? A.fromPartial(e.baseEvent) : void 0, t.subagentRunId = e.subagentRunId ?? "", t.message = e.message ?? "", t.code = e.code ?? void 0, t;
	}
};
function Hc() {
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
var Uc = {
	encode(e, t = new E()) {
		return e.textMessageStart !== void 0 && Fs.encode(e.textMessageStart, t.uint32(10).fork()).join(), e.textMessageContent !== void 0 && Ls.encode(e.textMessageContent, t.uint32(18).fork()).join(), e.textMessageEnd !== void 0 && zs.encode(e.textMessageEnd, t.uint32(26).fork()).join(), e.toolCallStart !== void 0 && Us.encode(e.toolCallStart, t.uint32(34).fork()).join(), e.toolCallArgs !== void 0 && Gs.encode(e.toolCallArgs, t.uint32(42).fork()).join(), e.toolCallEnd !== void 0 && qs.encode(e.toolCallEnd, t.uint32(50).fork()).join(), e.stateSnapshot !== void 0 && $s.encode(e.stateSnapshot, t.uint32(58).fork()).join(), e.stateDelta !== void 0 && tc.encode(e.stateDelta, t.uint32(66).fork()).join(), e.messagesSnapshot !== void 0 && rc.encode(e.messagesSnapshot, t.uint32(74).fork()).join(), e.raw !== void 0 && lc.encode(e.raw, t.uint32(82).fork()).join(), e.custom !== void 0 && dc.encode(e.custom, t.uint32(90).fork()).join(), e.runStarted !== void 0 && pc.encode(e.runStarted, t.uint32(98).fork()).join(), e.runFinished !== void 0 && hc.encode(e.runFinished, t.uint32(106).fork()).join(), e.runError !== void 0 && _c.encode(e.runError, t.uint32(114).fork()).join(), e.stepStarted !== void 0 && yc.encode(e.stepStarted, t.uint32(122).fork()).join(), e.stepFinished !== void 0 && xc.encode(e.stepFinished, t.uint32(130).fork()).join(), e.textMessageChunk !== void 0 && Vs.encode(e.textMessageChunk, t.uint32(138).fork()).join(), e.toolCallChunk !== void 0 && Ys.encode(e.toolCallChunk, t.uint32(146).fork()).join(), e.subagentStarted !== void 0 && Lc.encode(e.subagentStarted, t.uint32(154).fork()).join(), e.subagentFinished !== void 0 && zc.encode(e.subagentFinished, t.uint32(162).fork()).join(), e.subagentError !== void 0 && Vc.encode(e.subagentError, t.uint32(170).fork()).join(), e.toolCallResult !== void 0 && Zs.encode(e.toolCallResult, t.uint32(178).fork()).join(), e.activitySnapshot !== void 0 && ac.encode(e.activitySnapshot, t.uint32(186).fork()).join(), e.activityDelta !== void 0 && sc.encode(e.activityDelta, t.uint32(194).fork()).join(), e.reasoningStart !== void 0 && Cc.encode(e.reasoningStart, t.uint32(202).fork()).join(), e.reasoningMessageStart !== void 0 && Tc.encode(e.reasoningMessageStart, t.uint32(210).fork()).join(), e.reasoningMessageContent !== void 0 && Dc.encode(e.reasoningMessageContent, t.uint32(218).fork()).join(), e.reasoningMessageEnd !== void 0 && kc.encode(e.reasoningMessageEnd, t.uint32(226).fork()).join(), e.reasoningMessageChunk !== void 0 && jc.encode(e.reasoningMessageChunk, t.uint32(234).fork()).join(), e.reasoningEnd !== void 0 && Nc.encode(e.reasoningEnd, t.uint32(242).fork()).join(), e.reasoningEncryptedValue !== void 0 && Fc.encode(e.reasoningEncryptedValue, t.uint32(250).fork()).join(), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = Hc();
		for (; n.pos < r;) {
			let e = n.uint32();
			switch (e >>> 3) {
				case 1:
					if (e !== 10) break;
					i.textMessageStart = Fs.decode(n, n.uint32());
					continue;
				case 2:
					if (e !== 18) break;
					i.textMessageContent = Ls.decode(n, n.uint32());
					continue;
				case 3:
					if (e !== 26) break;
					i.textMessageEnd = zs.decode(n, n.uint32());
					continue;
				case 4:
					if (e !== 34) break;
					i.toolCallStart = Us.decode(n, n.uint32());
					continue;
				case 5:
					if (e !== 42) break;
					i.toolCallArgs = Gs.decode(n, n.uint32());
					continue;
				case 6:
					if (e !== 50) break;
					i.toolCallEnd = qs.decode(n, n.uint32());
					continue;
				case 7:
					if (e !== 58) break;
					i.stateSnapshot = $s.decode(n, n.uint32());
					continue;
				case 8:
					if (e !== 66) break;
					i.stateDelta = tc.decode(n, n.uint32());
					continue;
				case 9:
					if (e !== 74) break;
					i.messagesSnapshot = rc.decode(n, n.uint32());
					continue;
				case 10:
					if (e !== 82) break;
					i.raw = lc.decode(n, n.uint32());
					continue;
				case 11:
					if (e !== 90) break;
					i.custom = dc.decode(n, n.uint32());
					continue;
				case 12:
					if (e !== 98) break;
					i.runStarted = pc.decode(n, n.uint32());
					continue;
				case 13:
					if (e !== 106) break;
					i.runFinished = hc.decode(n, n.uint32());
					continue;
				case 14:
					if (e !== 114) break;
					i.runError = _c.decode(n, n.uint32());
					continue;
				case 15:
					if (e !== 122) break;
					i.stepStarted = yc.decode(n, n.uint32());
					continue;
				case 16:
					if (e !== 130) break;
					i.stepFinished = xc.decode(n, n.uint32());
					continue;
				case 17:
					if (e !== 138) break;
					i.textMessageChunk = Vs.decode(n, n.uint32());
					continue;
				case 18:
					if (e !== 146) break;
					i.toolCallChunk = Ys.decode(n, n.uint32());
					continue;
				case 19:
					if (e !== 154) break;
					i.subagentStarted = Lc.decode(n, n.uint32());
					continue;
				case 20:
					if (e !== 162) break;
					i.subagentFinished = zc.decode(n, n.uint32());
					continue;
				case 21:
					if (e !== 170) break;
					i.subagentError = Vc.decode(n, n.uint32());
					continue;
				case 22:
					if (e !== 178) break;
					i.toolCallResult = Zs.decode(n, n.uint32());
					continue;
				case 23:
					if (e !== 186) break;
					i.activitySnapshot = ac.decode(n, n.uint32());
					continue;
				case 24:
					if (e !== 194) break;
					i.activityDelta = sc.decode(n, n.uint32());
					continue;
				case 25:
					if (e !== 202) break;
					i.reasoningStart = Cc.decode(n, n.uint32());
					continue;
				case 26:
					if (e !== 210) break;
					i.reasoningMessageStart = Tc.decode(n, n.uint32());
					continue;
				case 27:
					if (e !== 218) break;
					i.reasoningMessageContent = Dc.decode(n, n.uint32());
					continue;
				case 28:
					if (e !== 226) break;
					i.reasoningMessageEnd = kc.decode(n, n.uint32());
					continue;
				case 29:
					if (e !== 234) break;
					i.reasoningMessageChunk = jc.decode(n, n.uint32());
					continue;
				case 30:
					if (e !== 242) break;
					i.reasoningEnd = Nc.decode(n, n.uint32());
					continue;
				case 31:
					if (e !== 250) break;
					i.reasoningEncryptedValue = Fc.decode(n, n.uint32());
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
		return t.textMessageStart = e.textMessageStart !== void 0 && e.textMessageStart !== null ? Fs.fromPartial(e.textMessageStart) : void 0, t.textMessageContent = e.textMessageContent !== void 0 && e.textMessageContent !== null ? Ls.fromPartial(e.textMessageContent) : void 0, t.textMessageEnd = e.textMessageEnd !== void 0 && e.textMessageEnd !== null ? zs.fromPartial(e.textMessageEnd) : void 0, t.toolCallStart = e.toolCallStart !== void 0 && e.toolCallStart !== null ? Us.fromPartial(e.toolCallStart) : void 0, t.toolCallArgs = e.toolCallArgs !== void 0 && e.toolCallArgs !== null ? Gs.fromPartial(e.toolCallArgs) : void 0, t.toolCallEnd = e.toolCallEnd !== void 0 && e.toolCallEnd !== null ? qs.fromPartial(e.toolCallEnd) : void 0, t.stateSnapshot = e.stateSnapshot !== void 0 && e.stateSnapshot !== null ? $s.fromPartial(e.stateSnapshot) : void 0, t.stateDelta = e.stateDelta !== void 0 && e.stateDelta !== null ? tc.fromPartial(e.stateDelta) : void 0, t.messagesSnapshot = e.messagesSnapshot !== void 0 && e.messagesSnapshot !== null ? rc.fromPartial(e.messagesSnapshot) : void 0, t.raw = e.raw !== void 0 && e.raw !== null ? lc.fromPartial(e.raw) : void 0, t.custom = e.custom !== void 0 && e.custom !== null ? dc.fromPartial(e.custom) : void 0, t.runStarted = e.runStarted !== void 0 && e.runStarted !== null ? pc.fromPartial(e.runStarted) : void 0, t.runFinished = e.runFinished !== void 0 && e.runFinished !== null ? hc.fromPartial(e.runFinished) : void 0, t.runError = e.runError !== void 0 && e.runError !== null ? _c.fromPartial(e.runError) : void 0, t.stepStarted = e.stepStarted !== void 0 && e.stepStarted !== null ? yc.fromPartial(e.stepStarted) : void 0, t.stepFinished = e.stepFinished !== void 0 && e.stepFinished !== null ? xc.fromPartial(e.stepFinished) : void 0, t.textMessageChunk = e.textMessageChunk !== void 0 && e.textMessageChunk !== null ? Vs.fromPartial(e.textMessageChunk) : void 0, t.toolCallChunk = e.toolCallChunk !== void 0 && e.toolCallChunk !== null ? Ys.fromPartial(e.toolCallChunk) : void 0, t.subagentStarted = e.subagentStarted !== void 0 && e.subagentStarted !== null ? Lc.fromPartial(e.subagentStarted) : void 0, t.subagentFinished = e.subagentFinished !== void 0 && e.subagentFinished !== null ? zc.fromPartial(e.subagentFinished) : void 0, t.subagentError = e.subagentError !== void 0 && e.subagentError !== null ? Vc.fromPartial(e.subagentError) : void 0, t.toolCallResult = e.toolCallResult !== void 0 && e.toolCallResult !== null ? Zs.fromPartial(e.toolCallResult) : void 0, t.activitySnapshot = e.activitySnapshot !== void 0 && e.activitySnapshot !== null ? ac.fromPartial(e.activitySnapshot) : void 0, t.activityDelta = e.activityDelta !== void 0 && e.activityDelta !== null ? sc.fromPartial(e.activityDelta) : void 0, t.reasoningStart = e.reasoningStart !== void 0 && e.reasoningStart !== null ? Cc.fromPartial(e.reasoningStart) : void 0, t.reasoningMessageStart = e.reasoningMessageStart !== void 0 && e.reasoningMessageStart !== null ? Tc.fromPartial(e.reasoningMessageStart) : void 0, t.reasoningMessageContent = e.reasoningMessageContent !== void 0 && e.reasoningMessageContent !== null ? Dc.fromPartial(e.reasoningMessageContent) : void 0, t.reasoningMessageEnd = e.reasoningMessageEnd !== void 0 && e.reasoningMessageEnd !== null ? kc.fromPartial(e.reasoningMessageEnd) : void 0, t.reasoningMessageChunk = e.reasoningMessageChunk !== void 0 && e.reasoningMessageChunk !== null ? jc.fromPartial(e.reasoningMessageChunk) : void 0, t.reasoningEnd = e.reasoningEnd !== void 0 && e.reasoningEnd !== null ? Nc.fromPartial(e.reasoningEnd) : void 0, t.reasoningEncryptedValue = e.reasoningEncryptedValue !== void 0 && e.reasoningEncryptedValue !== null ? Fc.fromPartial(e.reasoningEncryptedValue) : void 0, t;
	}
};
function Wc() {
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
var Gc = {
	encode(e, t = new E()) {
		return e.provider !== void 0 && t.uint32(10).string(e.provider), e.model !== void 0 && t.uint32(18).string(e.model), e.inputTokens !== void 0 && t.uint32(24).int64(e.inputTokens), e.outputTokens !== void 0 && t.uint32(32).int64(e.outputTokens), e.totalTokens !== void 0 && t.uint32(40).int64(e.totalTokens), e.reasoningTokens !== void 0 && t.uint32(48).int64(e.reasoningTokens), e.cachedInputTokens !== void 0 && t.uint32(56).int64(e.cachedInputTokens), e.cacheWriteInputTokens !== void 0 && t.uint32(64).int64(e.cacheWriteInputTokens), t;
	},
	decode(e, t) {
		let n = e instanceof D ? e : new D(e), r = t === void 0 ? n.len : n.pos + t, i = Wc();
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
					i.inputTokens = Kc(n.int64());
					continue;
				case 4:
					if (e !== 32) break;
					i.outputTokens = Kc(n.int64());
					continue;
				case 5:
					if (e !== 40) break;
					i.totalTokens = Kc(n.int64());
					continue;
				case 6:
					if (e !== 48) break;
					i.reasoningTokens = Kc(n.int64());
					continue;
				case 7:
					if (e !== 56) break;
					i.cachedInputTokens = Kc(n.int64());
					continue;
				case 8:
					if (e !== 64) break;
					i.cacheWriteInputTokens = Kc(n.int64());
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
		return t.provider = e.provider ?? void 0, t.model = e.model ?? void 0, t.inputTokens = e.inputTokens ?? void 0, t.outputTokens = e.outputTokens ?? void 0, t.totalTokens = e.totalTokens ?? void 0, t.reasoningTokens = e.reasoningTokens ?? void 0, t.cachedInputTokens = e.cachedInputTokens ?? void 0, t.cacheWriteInputTokens = e.cacheWriteInputTokens ?? void 0, t;
	}
};
function Kc(e) {
	let t = globalThis.Number(e.toString());
	if (t > globalThis.Number.MAX_SAFE_INTEGER) throw new globalThis.Error("Value is larger than Number.MAX_SAFE_INTEGER");
	if (t < globalThis.Number.MIN_SAFE_INTEGER) throw new globalThis.Error("Value is smaller than Number.MIN_SAFE_INTEGER");
	return t;
}
var qc = (e) => e && typeof e == "object" ? e : void 0, j = (e) => Array.isArray(e) ? e : [], Jc = () => typeof process < "u" && process.env !== void 0 && !!process.env.SUPPRESS_TRANSFORMATION_WARNINGS, Yc = () => {
	Jc() || console.warn("[ag-ui][proto] Dropped a content part this build does not know: the protocol has a variant this SDK predates.");
};
new Set(Object.values(_));
var Xc = {
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
}, Zc = /* @__PURE__ */ new Set([
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
]), Qc = (e) => {
	let t = qc(e);
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
}, $c = (e) => {
	let t = qc(e);
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
			return e.source !== void 0 && Qc(e.source) === void 0 ? void 0 : {
				type: "image",
				id: e.id,
				source: Qc(e.source),
				metadata: e.metadata
			};
		}
		if (t.audio) {
			let e = t.audio;
			return e.source !== void 0 && Qc(e.source) === void 0 ? void 0 : {
				type: "audio",
				id: e.id,
				source: Qc(e.source),
				metadata: e.metadata
			};
		}
		if (t.video) {
			let e = t.video;
			return e.source !== void 0 && Qc(e.source) === void 0 ? void 0 : {
				type: "video",
				id: e.id,
				source: Qc(e.source),
				metadata: e.metadata
			};
		}
		if (t.document) {
			let e = t.document;
			return e.source !== void 0 && Qc(e.source) === void 0 ? void 0 : {
				type: "document",
				id: e.id,
				source: Qc(e.source),
				metadata: e.metadata
			};
		}
	}
}, el = /* @__PURE__ */ new Set(["activity"]), tl = /* @__PURE__ */ new Set(["user", "tool"]), nl = /* @__PURE__ */ new Set([
	"developer",
	"system",
	"assistant",
	"user",
	"tool",
	"activity",
	"reasoning"
]), rl = (e) => {
	let t = qc(e) ?? {}, n = { ...t }, r = typeof t.role == "string" ? t.role : "", i = nl.has(r), a = i ? tl.has(r) : j(t.contentParts).length > 0, o = i ? el.has(r) : !a && t.activityContent !== void 0;
	if (!i && (t.content === void 0 ? 0 : 1) + +(j(t.contentParts).length > 0) + (t.activityContent === void 0 ? 0 : 1) > 1) throw Error("Invalid event: message carries more than one content form");
	if (i) {
		if (!a && j(t.contentParts).length > 0) throw Error("Invalid event: message carries content parts for a role that has none");
		if (t.activityContent !== void 0 && !o) throw Error("Invalid event: message carries activity content for a non-activity role");
		if (o && t.content !== void 0) throw Error("Invalid event: activity content cannot ride with other content forms");
		if (a && t.content !== void 0 && j(t.contentParts).length > 0) throw Error("Invalid event: message carries both string content and content parts");
	}
	return a && t.content === void 0 && (n.content = j(t.contentParts).map((e) => {
		let t = $c(e);
		return t === void 0 && Yc(), t;
	}).filter((e) => e !== void 0)), o && t.activityContent !== void 0 && (n.content = t.activityContent), delete n.activityContent, delete n.contentParts, j(t.toolCalls).length === 0 && delete n.toolCalls, Object.keys(n).forEach((e) => {
		n[e] === void 0 && delete n[e];
	}), n;
}, il = (e) => {
	if (Array.isArray(e)) {
		for (let t of e) il(t);
		return;
	}
	let t = qc(e);
	if (t) for (let e of Object.keys(t)) t[e] === void 0 ? delete t[e] : il(t[e]);
}, al = (e) => {
	let t = qc(e);
	if (!t) return;
	let n = {};
	return t.threadId !== void 0 && (n.threadId = t.threadId), t.runId !== void 0 && (n.runId = t.runId), t.protocolVersion !== void 0 && (n.protocolVersion = t.protocolVersion), t.parentRunId !== void 0 && (n.parentRunId = t.parentRunId), t.state !== void 0 && (n.state = t.state), n.messages = j(t.messages).map(rl).filter((e) => e !== void 0), n.tools = j(t.tools), n.context = j(t.context), t.forwardedProps !== void 0 && (n.forwardedProps = t.forwardedProps), n.resume = j(t.resume), n;
}, ol = {
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
}, sl = {
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
function cl(e, t) {
	let n = 0, r = 0;
	for (;;) {
		if (t.offset >= e.length) throw Error("Invalid event");
		let i = e[t.offset++];
		if (r < 28 ? n += (i & 127) * 2 ** r : r === 28 && (n += (i & 15) * 2 ** 28), r += 7, !(i & 128)) return n;
	}
}
function ll(e, t) {
	let n = { offset: 0 }, r = 0, i = 0;
	for (; n.offset < e.length;) {
		let a = cl(e, n), o = Math.floor(a / 8), s = a % 8;
		if (o === 0) throw Error("Invalid event");
		if (s === 3) r += 1;
		else if (s === 4) {
			if (--r, r < 0) throw Error("Invalid event");
		} else {
			if (s === 0) cl(e, n);
			else if (s === 1) n.offset += 8;
			else if (s === 2) {
				let a = cl(e, n);
				if (n.offset + a > e.length) throw Error("Invalid event");
				if (r === 0) {
					if (t.arms?.has(o)) {
						if (i !== 0 && i !== o) throw Error("Invalid event");
						i = o;
					}
					let r = t.descend[o];
					if (r !== void 0) {
						let t = ol[r];
						t !== void 0 && ll(e.subarray(n.offset, n.offset + a), t);
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
function ul(e) {
	let t = /* @__PURE__ */ new Set(), n = { offset: 0 }, r = 0;
	for (; n.offset < e.length;) {
		let i = cl(e, n), a = Math.floor(i / 8), o = i % 8;
		if (a === 0) throw Error("Invalid event");
		if (o === 3) r += 1;
		else if (o === 4) {
			if (--r, r < 0) throw Error("Invalid event");
		} else {
			if (r === 0 && Zc.has(a)) {
				if (t.size > 0 && !t.has(a)) throw Error("Invalid event");
				t.add(a);
			}
			if (o === 0) cl(e, n);
			else if (o === 1) n.offset += 8;
			else if (o === 2) {
				let t = cl(e, n);
				if (n.offset + t > e.length) throw Error("Invalid event");
				if (r === 0) {
					let r = sl[a];
					if (r !== void 0) {
						let i = ol[r];
						i !== void 0 && ll(e.subarray(n.offset, n.offset + t), i);
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
function dl(e) {
	if (e.length === 1) return e[0];
	let t = new Uint8Array(e.reduce((e, t) => e + t.length, 0)), n = 0;
	for (let r of e) t.set(r, n), n += r.length;
	return t;
}
function fl(e, t) {
	let n = new D(e), r = [], i = /* @__PURE__ */ new Map(), a, o = !1;
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
			child: f === void 0 ? void 0 : ol[f]
		}));
	}
	let s = [];
	for (let e of r) if (e !== void 0) {
		if (e.payloads !== void 0) {
			let t = dl(e.payloads), n = e.child === void 0 ? t : fl(t, e.child);
			if (e.payloads.length > 1 || n !== t) {
				s.push(new E().uint32(e.number * 8 + 2).bytes(n).finish()), o = !0;
				continue;
			}
		}
		s.push(e.raw);
	}
	return o ? dl(s) : e;
}
var pl = class extends Error {
	constructor(e = "Unknown event type") {
		super(e), this.name = "AGUIUnknownEventTypeError";
	}
};
function ml(e, t, n, r) {
	let i = 0, a = 0, o = 0;
	for (;;) {
		if (t.offset >= e.length || o >= n) return -1;
		let s = e[t.offset++];
		if (o += 1, o === n && s > r) return -1;
		if (i += (s & 127) * 2 ** a, a += 7, !(s & 128)) return i;
	}
}
var hl = (e, t) => ml(e, t, 5, 15), gl = (e, t) => ml(e, t, 10, 1);
function _l(e) {
	let t = { offset: 0 }, n = [];
	for (; t.offset < e.length;) {
		let r = hl(e, t);
		if (r < 0) return !1;
		let i = Math.floor(r / 8), a = r % 8;
		if (i === 0) return !1;
		if (a === 3) n.push(i);
		else if (a === 4) {
			if (n.pop() !== i) return !1;
		} else if (a === 0) {
			if (gl(e, t) < 0) return !1;
		} else if (a === 1) t.offset += 8;
		else if (a === 5) t.offset += 4;
		else if (a === 2) {
			let n = hl(e, t);
			if (n < 0 || t.offset + n > e.length) return !1;
			t.offset += n;
		} else return !1;
		if (t.offset > e.length) return !1;
	}
	return n.length === 0;
}
function vl(e) {
	let t = { offset: 0 }, n = [], r = 0;
	for (; t.offset < e.length;) {
		let i = hl(e, t);
		if (i < 0) return !1;
		let a = Math.floor(i / 8), o = i % 8;
		if (a === 0) return !1;
		let s = n.length === 0;
		if (o === 3) {
			if (s && Zc.has(a)) return !1;
			n.push(a);
		} else if (o === 4) {
			if (n.pop() !== a) return !1;
		} else if (o === 0) {
			if (s && Zc.has(a) || gl(e, t) < 0) return !1;
		} else if (o === 1) {
			if (s && Zc.has(a)) return !1;
			t.offset += 8;
		} else if (o === 5) {
			if (s && Zc.has(a)) return !1;
			t.offset += 4;
		} else if (o === 2) {
			let n = hl(e, t);
			if (n < 0 || t.offset + n > e.length) return !1;
			if (s) {
				if (Zc.has(a) || !_l(e.subarray(t.offset, t.offset + n))) return !1;
				r += 1;
			}
			t.offset += n;
		} else return !1;
		if (t.offset > e.length) return !1;
	}
	return n.length === 0 && r > 0;
}
function yl(e) {
	ul(e);
	let t = Uc.decode(fl(e, {
		singular: Zc,
		descend: sl
	})), n = Object.entries(t).filter(([, e]) => e !== void 0);
	if (n.length !== 1) throw n.length === 0 && vl(e) ? new pl() : Error("Invalid event");
	let r = n[0], i = Xc[r[0]];
	if (i === void 0) throw Error("Invalid event");
	let a = r[1], o = qc(a.baseEvent);
	if (!o) throw Error("Invalid event");
	let s = Ms[o.type];
	if (s !== i) throw Error("Invalid event: envelope carries " + i + " but the base event declares " + String(s));
	if (a.type = i, a.timestamp = o.timestamp, a.rawEvent = o.rawEvent, o.metadata !== void 0 && (a.metadata = o.metadata), delete a.baseEvent, a.type === "MESSAGES_SNAPSHOT" && Array.isArray(a.messages) && (a.messages = a.messages.map(rl).filter((e) => e !== void 0)), a.type === "RUN_FINISHED") {
		let e = a, t = typeof e.outcome == "string" && e.outcome !== "" ? e.outcome : void 0, n = {};
		n.pendingToolCallIds = e.pendingToolCallIds, delete e.pendingToolCallIds, n.interrupts = e.interrupts, delete e.interrupts, delete e.outcome, t === void 0 && (j(n.pendingToolCallIds).length > 0 && (e.pendingToolCallIds = n.pendingToolCallIds), j(n.interrupts).length > 0 && (e.interrupts = n.interrupts)), t === "success" && (e.outcome = {
			type: "success",
			...j(n.pendingToolCallIds).length > 0 ? { pendingToolCallIds: n.pendingToolCallIds } : {},
			...j(n.interrupts).length > 0 ? { interrupts: n.interrupts } : {}
		}), t === "interrupt" && (e.outcome = {
			type: "interrupt",
			interrupts: j(n.interrupts),
			...j(n.pendingToolCallIds).length > 0 ? { pendingToolCallIds: n.pendingToolCallIds } : {}
		}), t === "cancelled" && (e.outcome = {
			type: "cancelled",
			...j(n.pendingToolCallIds).length > 0 ? { pendingToolCallIds: n.pendingToolCallIds } : {},
			...j(n.interrupts).length > 0 ? { interrupts: n.interrupts } : {}
		}), t !== void 0 && ![
			"success",
			"interrupt",
			"cancelled"
		].includes(t) && (e.outcome = {
			type: t,
			...j(n.pendingToolCallIds).length > 0 ? { pendingToolCallIds: n.pendingToolCallIds } : {},
			...j(n.interrupts).length > 0 ? { interrupts: n.interrupts } : {}
		});
	}
	if (a.type === "SUBAGENT_FINISHED") {
		let e = a, t = typeof e.outcome == "string" && e.outcome !== "" ? e.outcome : void 0, n = {};
		n.interruptIds = e.interruptIds, delete e.interruptIds, delete e.outcome, t === void 0 && j(n.interruptIds).length > 0 && (e.interruptIds = n.interruptIds), t === "success" && (e.outcome = {
			type: "success",
			...j(n.interruptIds).length > 0 ? { interruptIds: n.interruptIds } : {}
		}), t === "suspended" && (e.outcome = {
			type: "suspended",
			...j(n.interruptIds).length > 0 ? { interruptIds: n.interruptIds } : {}
		}), t !== void 0 && !["success", "suspended"].includes(t) && (e.outcome = {
			type: t,
			...j(n.interruptIds).length > 0 ? { interruptIds: n.interruptIds } : {}
		});
	}
	if (a.type === "STATE_DELTA" && Array.isArray(a.delta) && (a.delta = a.delta.map((e) => {
		let t = qo[e.op];
		return e.op = typeof t == "string" && t !== "UNRECOGNIZED" ? t.toLowerCase() : String(e.op), Object.keys(e).forEach((t) => {
			e[t] === void 0 && delete e[t];
		}), e;
	})), a.type === "ACTIVITY_DELTA" && Array.isArray(a.patch) && (a.patch = a.patch.map((e) => {
		let t = qo[e.op];
		return e.op = typeof t == "string" && t !== "UNRECOGNIZED" ? t.toLowerCase() : String(e.op), Object.keys(e).forEach((t) => {
			e[t] === void 0 && delete e[t];
		}), e;
	})), a.type === "RUN_FINISHED" && Array.isArray(a.usage) && a.usage.length === 0 && delete a.usage, a.type === "RUN_ERROR" && Array.isArray(a.usage) && a.usage.length === 0 && delete a.usage, a.type === "TOOL_CALL_RESULT") {
		let e = a;
		if (e.content !== void 0 && j(e.contentParts).length > 0) throw Error("Invalid event: content carries both string content and content parts");
		e.content === void 0 && (e.content = j(e.contentParts).map((e) => {
			let t = $c(e);
			return t === void 0 && Yc(), t;
		}).filter((e) => e !== void 0)), delete e.contentParts;
	}
	return a.type === "RUN_STARTED" && a.input !== void 0 && (a.input = al(a.input)), il(a), a;
}
// node_modules/compare-versions/lib/esm/utils.js
var bl = /^[v^~<>=]*?(\d+)(?:\.([x*]|\d+)(?:\.([x*]|\d+)(?:\.([x*]|\d+))?(?:-([\da-z\-]+(?:\.[\da-z\-]+)*))?(?:\+[\da-z\-]+(?:\.[\da-z\-]+)*)?)?)?$/i, xl = (e) => {
	if (typeof e != "string") throw TypeError("Invalid argument expected string");
	let t = e.match(bl);
	if (!t) throw Error(`Invalid argument not valid semver ('${e}' received)`);
	return t.shift(), t;
}, Sl = (e) => e === "*" || e === "x" || e === "X", Cl = (e) => {
	let t = parseInt(e, 10);
	return isNaN(t) ? e : t;
}, wl = (e, t) => typeof e == typeof t ? [e, t] : [String(e), String(t)], Tl = (e, t) => {
	if (Sl(e) || Sl(t)) return 0;
	let [n, r] = wl(Cl(e), Cl(t));
	return n > r ? 1 : n < r ? -1 : 0;
}, El = (e, t) => {
	for (let n = 0; n < Math.max(e.length, t.length); n++) {
		let r = Tl(e[n] || "0", t[n] || "0");
		if (r !== 0) return r;
	}
	return 0;
}, Dl = (e, t) => {
	let n = xl(e), r = xl(t), i = n.pop(), a = r.pop(), o = El(n, r);
	return o === 0 ? i && a ? El(i.split("."), a.split(".")) : i || a ? i ? -1 : 1 : 0 : o;
}, Ol = (e) => typeof e == "string" && /^[v\d]/.test(e) && bl.test(e);
Object.freeze({ status: "aborted" });
/* @__NO_SIDE_EFFECTS__ */
function M(e, t, n) {
	function r(n, r) {
		var i;
		Object.defineProperty(n, "_zod", {
			value: n._zod ?? {},
			enumerable: !1
		}), (i = n._zod).traits ?? (i.traits = /* @__PURE__ */ new Set()), n._zod.traits.add(e), t(n, r);
		for (let e in o.prototype) e in n || Object.defineProperty(n, e, { value: o.prototype[e].bind(n) });
		n._zod.constr = o, n._zod.def = r;
	}
	let i = n?.Parent ?? Object;
	class a extends i {}
	Object.defineProperty(a, "name", { value: e });
	function o(e) {
		var t;
		let i = n?.Parent ? new a() : this;
		r(i, e), (t = i._zod).deferred ?? (t.deferred = []);
		for (let e of i._zod.deferred) e();
		return i;
	}
	return Object.defineProperty(o, "init", { value: r }), Object.defineProperty(o, Symbol.hasInstance, { value: (t) => n?.Parent && t instanceof n.Parent ? !0 : t?._zod?.traits?.has(e) }), Object.defineProperty(o, "name", { value: e }), o;
}
var kl = class extends Error {
	constructor() {
		super("Encountered Promise during synchronous parse. Use .parseAsync() instead.");
	}
}, Al = {};
function jl(e) {
	return e && Object.assign(Al, e), Al;
}
// node_modules/@ag-ui/client/node_modules/zod/v4/core/util.js
function Ml(e) {
	let t = Object.values(e).filter((e) => typeof e == "number");
	return Object.entries(e).filter(([e, n]) => t.indexOf(+e) === -1).map(([e, t]) => t);
}
function Nl(e, t) {
	return typeof t == "bigint" ? t.toString() : t;
}
function Pl(e) {
	return { get value() {
		{
			let t = e();
			return Object.defineProperty(this, "value", { value: t }), t;
		}
	} };
}
function Fl(e) {
	return e == null;
}
function Il(e) {
	let t = +!!e.startsWith("^"), n = e.endsWith("$") ? e.length - 1 : e.length;
	return e.slice(t, n);
}
function N(e, t, n) {
	Object.defineProperty(e, t, {
		get() {
			{
				let r = n();
				return e[t] = r, r;
			}
		},
		set(n) {
			Object.defineProperty(e, t, { value: n });
		},
		configurable: !0
	});
}
function Ll(e, t, n) {
	Object.defineProperty(e, t, {
		value: n,
		writable: !0,
		enumerable: !0,
		configurable: !0
	});
}
function Rl(e) {
	return JSON.stringify(e);
}
var zl = Error.captureStackTrace ? Error.captureStackTrace : (...e) => {};
function Bl(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
var Vl = Pl(() => {
	if (typeof navigator < "u" && navigator?.userAgent?.includes("Cloudflare")) return !1;
	try {
		return Function(""), !0;
	} catch {
		return !1;
	}
});
function Hl(e) {
	if (Bl(e) === !1) return !1;
	let t = e.constructor;
	if (t === void 0) return !0;
	let n = t.prototype;
	return Bl(n) !== !1 && Object.prototype.hasOwnProperty.call(n, "isPrototypeOf") !== !1;
}
var Ul = /* @__PURE__ */ new Set([
	"string",
	"number",
	"symbol"
]);
function Wl(e) {
	return e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function Gl(e, t, n) {
	let r = new e._zod.constr(t ?? e._zod.def);
	return (!t || n?.parent) && (r._zod.parent = e), r;
}
function Kl(e) {
	let t = e;
	if (!t) return {};
	if (typeof t == "string") return { error: () => t };
	if (t?.message !== void 0) {
		if (t?.error !== void 0) throw Error("Cannot specify both `message` and `error` params");
		t.error = t.message;
	}
	return delete t.message, typeof t.error == "string" ? {
		...t,
		error: () => t.error
	} : t;
}
function ql(e) {
	return Object.keys(e).filter((t) => e[t]._zod.optin === "optional" && e[t]._zod.optout === "optional");
}
function Jl(e, t) {
	let n = {}, r = e._zod.def;
	for (let e in t) {
		if (!(e in r.shape)) throw Error(`Unrecognized key: "${e}"`);
		t[e] && (n[e] = r.shape[e]);
	}
	return Gl(e, {
		...e._zod.def,
		shape: n,
		checks: []
	});
}
function Yl(e, t) {
	let n = { ...e._zod.def.shape }, r = e._zod.def;
	for (let e in t) {
		if (!(e in r.shape)) throw Error(`Unrecognized key: "${e}"`);
		t[e] && delete n[e];
	}
	return Gl(e, {
		...e._zod.def,
		shape: n,
		checks: []
	});
}
function Xl(e, t) {
	if (!Hl(t)) throw Error("Invalid input to extend: expected a plain object");
	return Gl(e, {
		...e._zod.def,
		get shape() {
			let n = {
				...e._zod.def.shape,
				...t
			};
			return Ll(this, "shape", n), n;
		},
		checks: []
	});
}
function Zl(e, t) {
	return Gl(e, {
		...e._zod.def,
		get shape() {
			let n = {
				...e._zod.def.shape,
				...t._zod.def.shape
			};
			return Ll(this, "shape", n), n;
		},
		catchall: t._zod.def.catchall,
		checks: []
	});
}
function Ql(e, t, n) {
	let r = t._zod.def.shape, i = { ...r };
	if (n) for (let t in n) {
		if (!(t in r)) throw Error(`Unrecognized key: "${t}"`);
		n[t] && (i[t] = e ? new e({
			type: "optional",
			innerType: r[t]
		}) : r[t]);
	}
	else for (let t in r) i[t] = e ? new e({
		type: "optional",
		innerType: r[t]
	}) : r[t];
	return Gl(t, {
		...t._zod.def,
		shape: i,
		checks: []
	});
}
function $l(e, t, n) {
	let r = t._zod.def.shape, i = { ...r };
	if (n) for (let t in n) {
		if (!(t in i)) throw Error(`Unrecognized key: "${t}"`);
		n[t] && (i[t] = new e({
			type: "nonoptional",
			innerType: r[t]
		}));
	}
	else for (let t in r) i[t] = new e({
		type: "nonoptional",
		innerType: r[t]
	});
	return Gl(t, {
		...t._zod.def,
		shape: i,
		checks: []
	});
}
function eu(e, t = 0) {
	for (let n = t; n < e.issues.length; n++) if (e.issues[n]?.continue !== !0) return !0;
	return !1;
}
function tu(e, t) {
	return t.map((t) => {
		var n;
		return (n = t).path ?? (n.path = []), t.path.unshift(e), t;
	});
}
function nu(e) {
	return typeof e == "string" ? e : e?.message;
}
function ru(e, t, n) {
	let r = {
		...e,
		path: e.path ?? []
	};
	return e.message || (r.message = nu(e.inst?._zod.def?.error?.(e)) ?? nu(t?.error?.(e)) ?? nu(n.customError?.(e)) ?? nu(n.localeError?.(e)) ?? "Invalid input"), delete r.inst, delete r.continue, t?.reportInput || delete r.input, r;
}
function iu(e) {
	return Array.isArray(e) ? "array" : typeof e == "string" ? "string" : "unknown";
}
function au(...e) {
	let [t, n, r] = e;
	return typeof t == "string" ? {
		message: t,
		code: "custom",
		input: n,
		inst: r
	} : { ...t };
}
// node_modules/@ag-ui/client/node_modules/zod/v4/core/errors.js
var ou = (e, t) => {
	e.name = "$ZodError", Object.defineProperty(e, "_zod", {
		value: e._zod,
		enumerable: !1
	}), Object.defineProperty(e, "issues", {
		value: t,
		enumerable: !1
	}), Object.defineProperty(e, "message", {
		get() {
			return JSON.stringify(t, Nl, 2);
		},
		enumerable: !0
	}), Object.defineProperty(e, "toString", {
		value: () => e.message,
		enumerable: !1
	});
}, su = /* @__PURE__ */ M("$ZodError", ou), cu = /* @__PURE__ */ M("$ZodError", ou, { Parent: Error });
function lu(e, t = (e) => e.message) {
	let n = {}, r = [];
	for (let i of e.issues) i.path.length > 0 ? (n[i.path[0]] = n[i.path[0]] || [], n[i.path[0]].push(t(i))) : r.push(t(i));
	return {
		formErrors: r,
		fieldErrors: n
	};
}
function uu(e, t) {
	let n = t || function(e) {
		return e.message;
	}, r = { _errors: [] }, i = (e) => {
		for (let t of e.issues) if (t.code === "invalid_union" && t.errors.length) t.errors.map((e) => i({ issues: e }));
		else if (t.code === "invalid_key") i({ issues: t.issues });
		else if (t.code === "invalid_element") i({ issues: t.issues });
		else if (t.path.length === 0) r._errors.push(n(t));
		else {
			let e = r, i = 0;
			for (; i < t.path.length;) {
				let r = t.path[i];
				i === t.path.length - 1 ? (e[r] = e[r] || { _errors: [] }, e[r]._errors.push(n(t))) : e[r] = e[r] || { _errors: [] }, e = e[r], i++;
			}
		}
	};
	return i(e), r;
}
// node_modules/@ag-ui/client/node_modules/zod/v4/core/parse.js
var du = (e) => (t, n, r, i) => {
	let a = r ? Object.assign(r, { async: !1 }) : { async: !1 }, o = t._zod.run({
		value: n,
		issues: []
	}, a);
	if (o instanceof Promise) throw new kl();
	if (o.issues.length) {
		let t = new ((i?.Err) ?? e)(o.issues.map((e) => ru(e, a, jl())));
		throw zl(t, i?.callee), t;
	}
	return o.value;
}, fu = (e) => async (t, n, r, i) => {
	let a = r ? Object.assign(r, { async: !0 }) : { async: !0 }, o = t._zod.run({
		value: n,
		issues: []
	}, a);
	if (o instanceof Promise && (o = await o), o.issues.length) {
		let t = new ((i?.Err) ?? e)(o.issues.map((e) => ru(e, a, jl())));
		throw zl(t, i?.callee), t;
	}
	return o.value;
}, pu = (e) => (t, n, r) => {
	let i = r ? {
		...r,
		async: !1
	} : { async: !1 }, a = t._zod.run({
		value: n,
		issues: []
	}, i);
	if (a instanceof Promise) throw new kl();
	return a.issues.length ? {
		success: !1,
		error: new (e ?? su)(a.issues.map((e) => ru(e, i, jl())))
	} : {
		success: !0,
		data: a.value
	};
}, mu = /* @__PURE__*/ pu(cu), hu = (e) => async (t, n, r) => {
	let i = r ? Object.assign(r, { async: !0 }) : { async: !0 }, a = t._zod.run({
		value: n,
		issues: []
	}, i);
	return a instanceof Promise && (a = await a), a.issues.length ? {
		success: !1,
		error: new e(a.issues.map((e) => ru(e, i, jl())))
	} : {
		success: !0,
		data: a.value
	};
}, gu = /* @__PURE__*/ hu(cu), _u = /*@__PURE__*/ M("$ZodCheck", (e, t) => {
	var n;
	e._zod ??= {}, e._zod.def = t, (n = e._zod).onattach ?? (n.onattach = []);
}), vu = /*@__PURE__*/ M("$ZodCheckMaxLength", (e, t) => {
	var n;
	_u.init(e, t), (n = e._zod.def).when ?? (n.when = (e) => {
		let t = e.value;
		return !Fl(t) && t.length !== void 0;
	}), e._zod.onattach.push((e) => {
		let n = e._zod.bag.maximum ?? Infinity;
		t.maximum < n && (e._zod.bag.maximum = t.maximum);
	}), e._zod.check = (n) => {
		let r = n.value;
		if (r.length <= t.maximum) return;
		let i = iu(r);
		n.issues.push({
			origin: i,
			code: "too_big",
			maximum: t.maximum,
			inclusive: !0,
			input: r,
			inst: e,
			continue: !t.abort
		});
	};
}), yu = /*@__PURE__*/ M("$ZodCheckMinLength", (e, t) => {
	var n;
	_u.init(e, t), (n = e._zod.def).when ?? (n.when = (e) => {
		let t = e.value;
		return !Fl(t) && t.length !== void 0;
	}), e._zod.onattach.push((e) => {
		let n = e._zod.bag.minimum ?? -Infinity;
		t.minimum > n && (e._zod.bag.minimum = t.minimum);
	}), e._zod.check = (n) => {
		let r = n.value;
		if (r.length >= t.minimum) return;
		let i = iu(r);
		n.issues.push({
			origin: i,
			code: "too_small",
			minimum: t.minimum,
			inclusive: !0,
			input: r,
			inst: e,
			continue: !t.abort
		});
	};
}), bu = /*@__PURE__*/ M("$ZodCheckLengthEquals", (e, t) => {
	var n;
	_u.init(e, t), (n = e._zod.def).when ?? (n.when = (e) => {
		let t = e.value;
		return !Fl(t) && t.length !== void 0;
	}), e._zod.onattach.push((e) => {
		let n = e._zod.bag;
		n.minimum = t.length, n.maximum = t.length, n.length = t.length;
	}), e._zod.check = (n) => {
		let r = n.value, i = r.length;
		if (i === t.length) return;
		let a = iu(r), o = i > t.length;
		n.issues.push({
			origin: a,
			...o ? {
				code: "too_big",
				maximum: t.length
			} : {
				code: "too_small",
				minimum: t.length
			},
			inclusive: !0,
			exact: !0,
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), xu = /*@__PURE__*/ M("$ZodCheckOverwrite", (e, t) => {
	_u.init(e, t), e._zod.check = (e) => {
		e.value = t.tx(e.value);
	};
}), Su = class {
	constructor(e = []) {
		this.content = [], this.indent = 0, this && (this.args = e);
	}
	indented(e) {
		this.indent += 1, e(this), --this.indent;
	}
	write(e) {
		if (typeof e == "function") {
			e(this, { execution: "sync" }), e(this, { execution: "async" });
			return;
		}
		let t = e.split("\n").filter((e) => e), n = Math.min(...t.map((e) => e.length - e.trimStart().length)), r = t.map((e) => e.slice(n)).map((e) => " ".repeat(this.indent * 2) + e);
		for (let e of r) this.content.push(e);
	}
	compile() {
		let e = Function, t = this?.args, n = [...(this?.content ?? [""]).map((e) => `  ${e}`)];
		return new e(...t, n.join("\n"));
	}
}, Cu = {
	major: 4,
	minor: 0,
	patch: 0
}, wu = /*@__PURE__*/ M("$ZodType", (e, t) => {
	var n;
	e ??= {}, e._zod.def = t, e._zod.bag = e._zod.bag || {}, e._zod.version = Cu;
	let r = [...e._zod.def.checks ?? []];
	e._zod.traits.has("$ZodCheck") && r.unshift(e);
	for (let t of r) for (let n of t._zod.onattach) n(e);
	if (r.length === 0) (n = e._zod).deferred ?? (n.deferred = []), e._zod.deferred?.push(() => {
		e._zod.run = e._zod.parse;
	});
	else {
		let t = (e, t, n) => {
			let r = eu(e), i;
			for (let a of t) {
				if (a._zod.def.when) {
					if (!a._zod.def.when(e)) continue;
				} else if (r) continue;
				let t = e.issues.length, o = a._zod.check(e);
				if (o instanceof Promise && n?.async === !1) throw new kl();
				if (i || o instanceof Promise) i = (i ?? Promise.resolve()).then(async () => {
					await o, e.issues.length !== t && (r ||= eu(e, t));
				});
				else {
					if (e.issues.length === t) continue;
					r ||= eu(e, t);
				}
			}
			return i ? i.then(() => e) : e;
		};
		e._zod.run = (n, i) => {
			let a = e._zod.parse(n, i);
			if (a instanceof Promise) {
				if (i.async === !1) throw new kl();
				return a.then((e) => t(e, r, i));
			}
			return t(a, r, i);
		};
	}
	e["~standard"] = {
		validate: (t) => {
			try {
				let n = mu(e, t);
				return n.success ? { value: n.data } : { issues: n.error?.issues };
			} catch {
				return gu(e, t).then((e) => e.success ? { value: e.data } : { issues: e.error?.issues });
			}
		},
		vendor: "zod",
		version: 1
	};
}), Tu = /*@__PURE__*/ M("$ZodUnknown", (e, t) => {
	wu.init(e, t), e._zod.parse = (e) => e;
}), Eu = /*@__PURE__*/ M("$ZodNever", (e, t) => {
	wu.init(e, t), e._zod.parse = (t, n) => (t.issues.push({
		expected: "never",
		code: "invalid_type",
		input: t.value,
		inst: e
	}), t);
});
function Du(e, t, n) {
	e.issues.length && t.issues.push(...tu(n, e.issues)), t.value[n] = e.value;
}
var Ou = /*@__PURE__*/ M("$ZodArray", (e, t) => {
	wu.init(e, t), e._zod.parse = (n, r) => {
		let i = n.value;
		if (!Array.isArray(i)) return n.issues.push({
			expected: "array",
			code: "invalid_type",
			input: i,
			inst: e
		}), n;
		n.value = Array(i.length);
		let a = [];
		for (let e = 0; e < i.length; e++) {
			let o = i[e], s = t.element._zod.run({
				value: o,
				issues: []
			}, r);
			s instanceof Promise ? a.push(s.then((t) => Du(t, n, e))) : Du(s, n, e);
		}
		return a.length ? Promise.all(a).then(() => n) : n;
	};
});
function ku(e, t, n) {
	e.issues.length && t.issues.push(...tu(n, e.issues)), t.value[n] = e.value;
}
function Au(e, t, n, r) {
	e.issues.length ? r[n] === void 0 ? n in r ? t.value[n] = void 0 : t.value[n] = e.value : t.issues.push(...tu(n, e.issues)) : e.value === void 0 ? n in r && (t.value[n] = void 0) : t.value[n] = e.value;
}
var ju = /*@__PURE__*/ M("$ZodObject", (e, t) => {
	wu.init(e, t);
	let n = Pl(() => {
		let e = Object.keys(t.shape);
		for (let n of e) if (!(t.shape[n] instanceof wu)) throw Error(`Invalid element at key "${n}": expected a Zod schema`);
		let n = ql(t.shape);
		return {
			shape: t.shape,
			keys: e,
			keySet: new Set(e),
			numKeys: e.length,
			optionalKeys: new Set(n)
		};
	});
	N(e._zod, "propValues", () => {
		let e = t.shape, n = {};
		for (let t in e) {
			let r = e[t]._zod;
			if (r.values) {
				n[t] ?? (n[t] = /* @__PURE__ */ new Set());
				for (let e of r.values) n[t].add(e);
			}
		}
		return n;
	});
	let r = (e) => {
		let t = new Su([
			"shape",
			"payload",
			"ctx"
		]), r = n.value, i = (e) => {
			let t = Rl(e);
			return `shape[${t}]._zod.run({ value: input[${t}], issues: [] }, ctx)`;
		};
		t.write("const input = payload.value;");
		let a = Object.create(null), o = 0;
		for (let e of r.keys) a[e] = `key_${o++}`;
		t.write("const newResult = {}");
		for (let e of r.keys) if (r.optionalKeys.has(e)) {
			let n = a[e];
			t.write(`const ${n} = ${i(e)};`);
			let r = Rl(e);
			t.write(`
        if (${n}.issues.length) {
          if (input[${r}] === undefined) {
            if (${r} in input) {
              newResult[${r}] = undefined;
            }
          } else {
            payload.issues = payload.issues.concat(
              ${n}.issues.map((iss) => ({
                ...iss,
                path: iss.path ? [${r}, ...iss.path] : [${r}],
              }))
            );
          }
        } else if (${n}.value === undefined) {
          if (${r} in input) newResult[${r}] = undefined;
        } else {
          newResult[${r}] = ${n}.value;
        }
        `);
		} else {
			let n = a[e];
			t.write(`const ${n} = ${i(e)};`), t.write(`
          if (${n}.issues.length) payload.issues = payload.issues.concat(${n}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${Rl(e)}, ...iss.path] : [${Rl(e)}]
          })));`), t.write(`newResult[${Rl(e)}] = ${n}.value`);
		}
		t.write("payload.value = newResult;"), t.write("return payload;");
		let s = t.compile();
		return (t, n) => s(e, t, n);
	}, i, a = Bl, o = !Al.jitless, s = o && Vl.value, c = t.catchall, l;
	e._zod.parse = (u, d) => {
		l ??= n.value;
		let f = u.value;
		if (!a(f)) return u.issues.push({
			expected: "object",
			code: "invalid_type",
			input: f,
			inst: e
		}), u;
		let p = [];
		if (o && s && d?.async === !1 && d.jitless !== !0) i ||= r(t.shape), u = i(u, d);
		else {
			u.value = {};
			let e = l.shape;
			for (let t of l.keys) {
				let n = e[t], r = n._zod.run({
					value: f[t],
					issues: []
				}, d), i = n._zod.optin === "optional" && n._zod.optout === "optional";
				r instanceof Promise ? p.push(r.then((e) => i ? Au(e, u, t, f) : ku(e, u, t))) : i ? Au(r, u, t, f) : ku(r, u, t);
			}
		}
		if (!c) return p.length ? Promise.all(p).then(() => u) : u;
		let m = [], h = l.keySet, g = c._zod, ee = g.def.type;
		for (let e of Object.keys(f)) {
			if (h.has(e)) continue;
			if (ee === "never") {
				m.push(e);
				continue;
			}
			let t = g.run({
				value: f[e],
				issues: []
			}, d);
			t instanceof Promise ? p.push(t.then((t) => ku(t, u, e))) : ku(t, u, e);
		}
		return m.length && u.issues.push({
			code: "unrecognized_keys",
			keys: m,
			input: f,
			inst: e
		}), p.length ? Promise.all(p).then(() => u) : u;
	};
});
function Mu(e, t, n, r) {
	for (let n of e) if (n.issues.length === 0) return t.value = n.value, t;
	return t.issues.push({
		code: "invalid_union",
		input: t.value,
		inst: n,
		errors: e.map((e) => e.issues.map((e) => ru(e, r, jl())))
	}), t;
}
var Nu = /*@__PURE__*/ M("$ZodUnion", (e, t) => {
	wu.init(e, t), N(e._zod, "optin", () => t.options.some((e) => e._zod.optin === "optional") ? "optional" : void 0), N(e._zod, "optout", () => t.options.some((e) => e._zod.optout === "optional") ? "optional" : void 0), N(e._zod, "values", () => {
		if (t.options.every((e) => e._zod.values)) return new Set(t.options.flatMap((e) => Array.from(e._zod.values)));
	}), N(e._zod, "pattern", () => {
		if (t.options.every((e) => e._zod.pattern)) {
			let e = t.options.map((e) => e._zod.pattern);
			return RegExp(`^(${e.map((e) => Il(e.source)).join("|")})$`);
		}
	}), e._zod.parse = (n, r) => {
		let i = !1, a = [];
		for (let e of t.options) {
			let t = e._zod.run({
				value: n.value,
				issues: []
			}, r);
			if (t instanceof Promise) a.push(t), i = !0;
			else {
				if (t.issues.length === 0) return t;
				a.push(t);
			}
		}
		return i ? Promise.all(a).then((t) => Mu(t, n, e, r)) : Mu(a, n, e, r);
	};
}), Pu = /*@__PURE__*/ M("$ZodIntersection", (e, t) => {
	wu.init(e, t), e._zod.parse = (e, n) => {
		let r = e.value, i = t.left._zod.run({
			value: r,
			issues: []
		}, n), a = t.right._zod.run({
			value: r,
			issues: []
		}, n);
		return i instanceof Promise || a instanceof Promise ? Promise.all([i, a]).then(([t, n]) => Iu(e, t, n)) : Iu(e, i, a);
	};
});
function Fu(e, t) {
	if (e === t || e instanceof Date && t instanceof Date && +e == +t) return {
		valid: !0,
		data: e
	};
	if (Hl(e) && Hl(t)) {
		let n = Object.keys(t), r = Object.keys(e).filter((e) => n.indexOf(e) !== -1), i = {
			...e,
			...t
		};
		for (let n of r) {
			let r = Fu(e[n], t[n]);
			if (!r.valid) return {
				valid: !1,
				mergeErrorPath: [n, ...r.mergeErrorPath]
			};
			i[n] = r.data;
		}
		return {
			valid: !0,
			data: i
		};
	}
	if (Array.isArray(e) && Array.isArray(t)) {
		if (e.length !== t.length) return {
			valid: !1,
			mergeErrorPath: []
		};
		let n = [];
		for (let r = 0; r < e.length; r++) {
			let i = e[r], a = t[r], o = Fu(i, a);
			if (!o.valid) return {
				valid: !1,
				mergeErrorPath: [r, ...o.mergeErrorPath]
			};
			n.push(o.data);
		}
		return {
			valid: !0,
			data: n
		};
	}
	return {
		valid: !1,
		mergeErrorPath: []
	};
}
function Iu(e, t, n) {
	if (t.issues.length && e.issues.push(...t.issues), n.issues.length && e.issues.push(...n.issues), eu(e)) return e;
	let r = Fu(t.value, n.value);
	if (!r.valid) throw Error(`Unmergable intersection. Error path: ${JSON.stringify(r.mergeErrorPath)}`);
	return e.value = r.data, e;
}
var Lu = /*@__PURE__*/ M("$ZodRecord", (e, t) => {
	wu.init(e, t), e._zod.parse = (n, r) => {
		let i = n.value;
		if (!Hl(i)) return n.issues.push({
			expected: "record",
			code: "invalid_type",
			input: i,
			inst: e
		}), n;
		let a = [];
		if (t.keyType._zod.values) {
			let o = t.keyType._zod.values;
			n.value = {};
			for (let e of o) if (typeof e == "string" || typeof e == "number" || typeof e == "symbol") {
				let o = t.valueType._zod.run({
					value: i[e],
					issues: []
				}, r);
				o instanceof Promise ? a.push(o.then((t) => {
					t.issues.length && n.issues.push(...tu(e, t.issues)), n.value[e] = t.value;
				})) : (o.issues.length && n.issues.push(...tu(e, o.issues)), n.value[e] = o.value);
			}
			let s;
			for (let e in i) o.has(e) || (s ??= [], s.push(e));
			s && s.length > 0 && n.issues.push({
				code: "unrecognized_keys",
				input: i,
				inst: e,
				keys: s
			});
		} else {
			n.value = {};
			for (let o of Reflect.ownKeys(i)) {
				if (o === "__proto__") continue;
				let s = t.keyType._zod.run({
					value: o,
					issues: []
				}, r);
				if (s instanceof Promise) throw Error("Async schemas not supported in object keys currently");
				if (s.issues.length) {
					n.issues.push({
						origin: "record",
						code: "invalid_key",
						issues: s.issues.map((e) => ru(e, r, jl())),
						input: o,
						path: [o],
						inst: e
					}), n.value[s.value] = s.value;
					continue;
				}
				let c = t.valueType._zod.run({
					value: i[o],
					issues: []
				}, r);
				c instanceof Promise ? a.push(c.then((e) => {
					e.issues.length && n.issues.push(...tu(o, e.issues)), n.value[s.value] = e.value;
				})) : (c.issues.length && n.issues.push(...tu(o, c.issues)), n.value[s.value] = c.value);
			}
		}
		return a.length ? Promise.all(a).then(() => n) : n;
	};
}), Ru = /*@__PURE__*/ M("$ZodEnum", (e, t) => {
	wu.init(e, t);
	let n = Ml(t.entries);
	e._zod.values = new Set(n), e._zod.pattern = RegExp(`^(${n.filter((e) => Ul.has(typeof e)).map((e) => typeof e == "string" ? Wl(e) : e.toString()).join("|")})$`), e._zod.parse = (t, r) => {
		let i = t.value;
		return e._zod.values.has(i) || t.issues.push({
			code: "invalid_value",
			values: n,
			input: i,
			inst: e
		}), t;
	};
}), zu = /*@__PURE__*/ M("$ZodLiteral", (e, t) => {
	wu.init(e, t), e._zod.values = new Set(t.values), e._zod.pattern = RegExp(`^(${t.values.map((e) => typeof e == "string" ? Wl(e) : e ? e.toString() : String(e)).join("|")})$`), e._zod.parse = (n, r) => {
		let i = n.value;
		return e._zod.values.has(i) || n.issues.push({
			code: "invalid_value",
			values: t.values,
			input: i,
			inst: e
		}), n;
	};
}), Bu = /*@__PURE__*/ M("$ZodTransform", (e, t) => {
	wu.init(e, t), e._zod.parse = (e, n) => {
		let r = t.transform(e.value, e);
		if (n.async) return (r instanceof Promise ? r : Promise.resolve(r)).then((t) => (e.value = t, e));
		if (r instanceof Promise) throw new kl();
		return e.value = r, e;
	};
}), Vu = /*@__PURE__*/ M("$ZodOptional", (e, t) => {
	wu.init(e, t), e._zod.optin = "optional", e._zod.optout = "optional", N(e._zod, "values", () => t.innerType._zod.values ? /* @__PURE__ */ new Set([...t.innerType._zod.values, void 0]) : void 0), N(e._zod, "pattern", () => {
		let e = t.innerType._zod.pattern;
		return e ? RegExp(`^(${Il(e.source)})?$`) : void 0;
	}), e._zod.parse = (e, n) => t.innerType._zod.optin === "optional" ? t.innerType._zod.run(e, n) : e.value === void 0 ? e : t.innerType._zod.run(e, n);
}), Hu = /*@__PURE__*/ M("$ZodNullable", (e, t) => {
	wu.init(e, t), N(e._zod, "optin", () => t.innerType._zod.optin), N(e._zod, "optout", () => t.innerType._zod.optout), N(e._zod, "pattern", () => {
		let e = t.innerType._zod.pattern;
		return e ? RegExp(`^(${Il(e.source)}|null)$`) : void 0;
	}), N(e._zod, "values", () => t.innerType._zod.values ? /* @__PURE__ */ new Set([...t.innerType._zod.values, null]) : void 0), e._zod.parse = (e, n) => e.value === null ? e : t.innerType._zod.run(e, n);
}), Uu = /*@__PURE__*/ M("$ZodDefault", (e, t) => {
	wu.init(e, t), e._zod.optin = "optional", N(e._zod, "values", () => t.innerType._zod.values), e._zod.parse = (e, n) => {
		if (e.value === void 0) return e.value = t.defaultValue, e;
		let r = t.innerType._zod.run(e, n);
		return r instanceof Promise ? r.then((e) => Wu(e, t)) : Wu(r, t);
	};
});
function Wu(e, t) {
	return e.value === void 0 && (e.value = t.defaultValue), e;
}
var Gu = /*@__PURE__*/ M("$ZodPrefault", (e, t) => {
	wu.init(e, t), e._zod.optin = "optional", N(e._zod, "values", () => t.innerType._zod.values), e._zod.parse = (e, n) => (e.value === void 0 && (e.value = t.defaultValue), t.innerType._zod.run(e, n));
}), Ku = /*@__PURE__*/ M("$ZodNonOptional", (e, t) => {
	wu.init(e, t), N(e._zod, "values", () => {
		let e = t.innerType._zod.values;
		return e ? new Set([...e].filter((e) => e !== void 0)) : void 0;
	}), e._zod.parse = (n, r) => {
		let i = t.innerType._zod.run(n, r);
		return i instanceof Promise ? i.then((t) => qu(t, e)) : qu(i, e);
	};
});
function qu(e, t) {
	return !e.issues.length && e.value === void 0 && e.issues.push({
		code: "invalid_type",
		expected: "nonoptional",
		input: e.value,
		inst: t
	}), e;
}
var Ju = /*@__PURE__*/ M("$ZodCatch", (e, t) => {
	wu.init(e, t), e._zod.optin = "optional", N(e._zod, "optout", () => t.innerType._zod.optout), N(e._zod, "values", () => t.innerType._zod.values), e._zod.parse = (e, n) => {
		let r = t.innerType._zod.run(e, n);
		return r instanceof Promise ? r.then((r) => (e.value = r.value, r.issues.length && (e.value = t.catchValue({
			...e,
			error: { issues: r.issues.map((e) => ru(e, n, jl())) },
			input: e.value
		}), e.issues = []), e)) : (e.value = r.value, r.issues.length && (e.value = t.catchValue({
			...e,
			error: { issues: r.issues.map((e) => ru(e, n, jl())) },
			input: e.value
		}), e.issues = []), e);
	};
}), Yu = /*@__PURE__*/ M("$ZodPipe", (e, t) => {
	wu.init(e, t), N(e._zod, "values", () => t.in._zod.values), N(e._zod, "optin", () => t.in._zod.optin), N(e._zod, "optout", () => t.out._zod.optout), e._zod.parse = (e, n) => {
		let r = t.in._zod.run(e, n);
		return r instanceof Promise ? r.then((e) => Xu(e, t, n)) : Xu(r, t, n);
	};
});
function Xu(e, t, n) {
	return eu(e) ? e : t.out._zod.run({
		value: e.value,
		issues: e.issues
	}, n);
}
var Zu = /*@__PURE__*/ M("$ZodReadonly", (e, t) => {
	wu.init(e, t), N(e._zod, "propValues", () => t.innerType._zod.propValues), N(e._zod, "values", () => t.innerType._zod.values), N(e._zod, "optin", () => t.innerType._zod.optin), N(e._zod, "optout", () => t.innerType._zod.optout), e._zod.parse = (e, n) => {
		let r = t.innerType._zod.run(e, n);
		return r instanceof Promise ? r.then(Qu) : Qu(r);
	};
});
function Qu(e) {
	return e.value = Object.freeze(e.value), e;
}
var $u = /*@__PURE__*/ M("$ZodLazy", (e, t) => {
	wu.init(e, t), N(e._zod, "innerType", () => t.getter()), N(e._zod, "pattern", () => e._zod.innerType._zod.pattern), N(e._zod, "propValues", () => e._zod.innerType._zod.propValues), N(e._zod, "optin", () => e._zod.innerType._zod.optin), N(e._zod, "optout", () => e._zod.innerType._zod.optout), e._zod.parse = (t, n) => e._zod.innerType._zod.run(t, n);
}), ed = /*@__PURE__*/ M("$ZodCustom", (e, t) => {
	_u.init(e, t), wu.init(e, t), e._zod.parse = (e, t) => e, e._zod.check = (n) => {
		let r = n.value, i = t.fn(r);
		if (i instanceof Promise) return i.then((t) => td(t, n, r, e));
		td(i, n, r, e);
	};
});
function td(e, t, n, r) {
	if (!e) {
		let e = {
			code: "custom",
			input: n,
			inst: r,
			path: [...r._zod.def.path ?? []],
			continue: !r._zod.def.abort
		};
		r._zod.def.params && (e.params = r._zod.def.params), t.issues.push(au(e));
	}
}
// node_modules/@ag-ui/client/node_modules/zod/v4/core/registries.js
var nd = class {
	constructor() {
		this._map = /* @__PURE__ */ new Map(), this._idmap = /* @__PURE__ */ new Map();
	}
	add(e, ...t) {
		let n = t[0];
		if (this._map.set(e, n), n && typeof n == "object" && "id" in n) {
			if (this._idmap.has(n.id)) throw Error(`ID ${n.id} already exists in the registry`);
			this._idmap.set(n.id, e);
		}
		return this;
	}
	clear() {
		return this._map = /* @__PURE__ */ new Map(), this._idmap = /* @__PURE__ */ new Map(), this;
	}
	remove(e) {
		let t = this._map.get(e);
		return t && typeof t == "object" && "id" in t && this._idmap.delete(t.id), this._map.delete(e), this;
	}
	get(e) {
		let t = e._zod.parent;
		if (t) {
			let n = { ...this.get(t) ?? {} };
			return delete n.id, {
				...n,
				...this._map.get(e)
			};
		}
		return this._map.get(e);
	}
	has(e) {
		return this._map.has(e);
	}
};
function rd() {
	return new nd();
}
var id = /*@__PURE__*/ rd();
// node_modules/@ag-ui/client/node_modules/zod/v4/core/api.js
function ad(e) {
	return new e({ type: "unknown" });
}
function od(e, t) {
	return new e({
		type: "never",
		...Kl(t)
	});
}
function sd(e, t) {
	return new vu({
		check: "max_length",
		...Kl(t),
		maximum: e
	});
}
function cd(e, t) {
	return new yu({
		check: "min_length",
		...Kl(t),
		minimum: e
	});
}
function ld(e, t) {
	return new bu({
		check: "length_equals",
		...Kl(t),
		length: e
	});
}
function ud(e) {
	return new xu({
		check: "overwrite",
		tx: e
	});
}
function dd(e, t, n) {
	return new e({
		type: "array",
		element: t,
		...Kl(n)
	});
}
function fd(e, t, n) {
	return new e({
		type: "custom",
		check: "custom",
		fn: t,
		...Kl(n)
	});
}
var pd = /* @__PURE__ */ M("ZodError", (e, t) => {
	su.init(e, t), e.name = "ZodError", Object.defineProperties(e, {
		format: { value: (t) => uu(e, t) },
		flatten: { value: (t) => lu(e, t) },
		addIssue: { value: (t) => e.issues.push(t) },
		addIssues: { value: (t) => e.issues.push(...t) },
		isEmpty: { get() {
			return e.issues.length === 0;
		} }
	});
}, { Parent: Error }), md = /* @__PURE__ */ du(pd), hd = /* @__PURE__ */ fu(pd), gd = /* @__PURE__ */ pu(pd), _d = /* @__PURE__ */ hu(pd), vd = /*@__PURE__*/ M("ZodType", (e, t) => (wu.init(e, t), e.def = t, Object.defineProperty(e, "_def", { value: t }), e.check = (...n) => e.clone({
	...t,
	checks: [...t.checks ?? [], ...n.map((e) => typeof e == "function" ? { _zod: {
		check: e,
		def: { check: "custom" },
		onattach: []
	} } : e)]
}), e.clone = (t, n) => Gl(e, t, n), e.brand = () => e, e.register = ((t, n) => (t.add(e, n), e)), e.parse = (t, n) => md(e, t, n, { callee: e.parse }), e.safeParse = (t, n) => gd(e, t, n), e.parseAsync = async (t, n) => hd(e, t, n, { callee: e.parseAsync }), e.safeParseAsync = async (t, n) => _d(e, t, n), e.spa = e.safeParseAsync, e.refine = (t, n) => e.check(tf(t, n)), e.superRefine = (t) => e.check(nf(t)), e.overwrite = (t) => e.check(ud(t)), e.optional = () => Ld(e), e.nullable = () => zd(e), e.nullish = () => Ld(zd(e)), e.nonoptional = (t) => Gd(e, t), e.array = () => wd(e), e.or = (t) => Dd([e, t]), e.and = (t) => kd(e, t), e.transform = (t) => Yd(e, Fd(t)), e.default = (t) => Vd(e, t), e.prefault = (t) => Ud(e, t), e.catch = (t) => qd(e, t), e.pipe = (t) => Yd(e, t), e.readonly = () => Zd(e), e.describe = (t) => {
	let n = e.clone();
	return id.add(n, { description: t }), n;
}, Object.defineProperty(e, "description", {
	get() {
		return id.get(e)?.description;
	},
	configurable: !0
}), e.meta = (...t) => {
	if (t.length === 0) return id.get(e);
	let n = e.clone();
	return id.add(n, t[0]), n;
}, e.isOptional = () => e.safeParse(void 0).success, e.isNullable = () => e.safeParse(null).success, e)), yd = /*@__PURE__*/ M("ZodUnknown", (e, t) => {
	Tu.init(e, t), vd.init(e, t);
});
function bd() {
	return ad(yd);
}
var xd = /*@__PURE__*/ M("ZodNever", (e, t) => {
	Eu.init(e, t), vd.init(e, t);
});
function Sd(e) {
	return od(xd, e);
}
var Cd = /*@__PURE__*/ M("ZodArray", (e, t) => {
	Ou.init(e, t), vd.init(e, t), e.element = t.element, e.min = (t, n) => e.check(cd(t, n)), e.nonempty = (t) => e.check(cd(1, t)), e.max = (t, n) => e.check(sd(t, n)), e.length = (t, n) => e.check(ld(t, n)), e.unwrap = () => e.element;
});
function wd(e, t) {
	return dd(Cd, e, t);
}
var Td = /*@__PURE__*/ M("ZodObject", (e, t) => {
	ju.init(e, t), vd.init(e, t), N(e, "shape", () => t.shape), e.keyof = () => Md(Object.keys(e._zod.def.shape)), e.catchall = (t) => e.clone({
		...e._zod.def,
		catchall: t
	}), e.passthrough = () => e.clone({
		...e._zod.def,
		catchall: bd()
	}), e.loose = () => e.clone({
		...e._zod.def,
		catchall: bd()
	}), e.strict = () => e.clone({
		...e._zod.def,
		catchall: Sd()
	}), e.strip = () => e.clone({
		...e._zod.def,
		catchall: void 0
	}), e.extend = (t) => Xl(e, t), e.merge = (t) => Zl(e, t), e.pick = (t) => Jl(e, t), e.omit = (t) => Yl(e, t), e.partial = (...t) => Ql(Id, e, t[0]), e.required = (...t) => $l(Wd, e, t[0]);
}), Ed = /*@__PURE__*/ M("ZodUnion", (e, t) => {
	Nu.init(e, t), vd.init(e, t), e.options = t.options;
});
function Dd(e, t) {
	return new Ed({
		type: "union",
		options: e,
		...Kl(t)
	});
}
var Od = /*@__PURE__*/ M("ZodIntersection", (e, t) => {
	Pu.init(e, t), vd.init(e, t);
});
function kd(e, t) {
	return new Od({
		type: "intersection",
		left: e,
		right: t
	});
}
var Ad = /*@__PURE__*/ M("ZodRecord", (e, t) => {
	Lu.init(e, t), vd.init(e, t), e.keyType = t.keyType, e.valueType = t.valueType;
}), jd = /*@__PURE__*/ M("ZodEnum", (e, t) => {
	Ru.init(e, t), vd.init(e, t), e.enum = t.entries, e.options = Object.values(t.entries);
	let n = new Set(Object.keys(t.entries));
	e.extract = (e, r) => {
		let i = {};
		for (let r of e) if (n.has(r)) i[r] = t.entries[r];
		else throw Error(`Key ${r} not found in enum`);
		return new jd({
			...t,
			checks: [],
			...Kl(r),
			entries: i
		});
	}, e.exclude = (e, r) => {
		let i = { ...t.entries };
		for (let t of e) if (n.has(t)) delete i[t];
		else throw Error(`Key ${t} not found in enum`);
		return new jd({
			...t,
			checks: [],
			...Kl(r),
			entries: i
		});
	};
});
function Md(e, t) {
	return new jd({
		type: "enum",
		entries: Array.isArray(e) ? Object.fromEntries(e.map((e) => [e, e])) : e,
		...Kl(t)
	});
}
var Nd = /*@__PURE__*/ M("ZodLiteral", (e, t) => {
	zu.init(e, t), vd.init(e, t), e.values = new Set(t.values), Object.defineProperty(e, "value", { get() {
		if (t.values.length > 1) throw Error("This schema contains multiple valid literal values. Use `.values` instead.");
		return t.values[0];
	} });
}), Pd = /*@__PURE__*/ M("ZodTransform", (e, t) => {
	Bu.init(e, t), vd.init(e, t), e._zod.parse = (n, r) => {
		n.addIssue = (r) => {
			if (typeof r == "string") n.issues.push(au(r, n.value, t));
			else {
				let t = r;
				t.fatal && (t.continue = !1), t.code ??= "custom", t.input ??= n.value, t.inst ??= e, t.continue ??= !0, n.issues.push(au(t));
			}
		};
		let i = t.transform(n.value, n);
		return i instanceof Promise ? i.then((e) => (n.value = e, n)) : (n.value = i, n);
	};
});
function Fd(e) {
	return new Pd({
		type: "transform",
		transform: e
	});
}
var Id = /*@__PURE__*/ M("ZodOptional", (e, t) => {
	Vu.init(e, t), vd.init(e, t), e.unwrap = () => e._zod.def.innerType;
});
function Ld(e) {
	return new Id({
		type: "optional",
		innerType: e
	});
}
var Rd = /*@__PURE__*/ M("ZodNullable", (e, t) => {
	Hu.init(e, t), vd.init(e, t), e.unwrap = () => e._zod.def.innerType;
});
function zd(e) {
	return new Rd({
		type: "nullable",
		innerType: e
	});
}
var Bd = /*@__PURE__*/ M("ZodDefault", (e, t) => {
	Uu.init(e, t), vd.init(e, t), e.unwrap = () => e._zod.def.innerType, e.removeDefault = e.unwrap;
});
function Vd(e, t) {
	return new Bd({
		type: "default",
		innerType: e,
		get defaultValue() {
			return typeof t == "function" ? t() : t;
		}
	});
}
var Hd = /*@__PURE__*/ M("ZodPrefault", (e, t) => {
	Gu.init(e, t), vd.init(e, t), e.unwrap = () => e._zod.def.innerType;
});
function Ud(e, t) {
	return new Hd({
		type: "prefault",
		innerType: e,
		get defaultValue() {
			return typeof t == "function" ? t() : t;
		}
	});
}
var Wd = /*@__PURE__*/ M("ZodNonOptional", (e, t) => {
	Ku.init(e, t), vd.init(e, t), e.unwrap = () => e._zod.def.innerType;
});
function Gd(e, t) {
	return new Wd({
		type: "nonoptional",
		innerType: e,
		...Kl(t)
	});
}
var Kd = /*@__PURE__*/ M("ZodCatch", (e, t) => {
	Ju.init(e, t), vd.init(e, t), e.unwrap = () => e._zod.def.innerType, e.removeCatch = e.unwrap;
});
function qd(e, t) {
	return new Kd({
		type: "catch",
		innerType: e,
		catchValue: typeof t == "function" ? t : () => t
	});
}
var Jd = /*@__PURE__*/ M("ZodPipe", (e, t) => {
	Yu.init(e, t), vd.init(e, t), e.in = t.in, e.out = t.out;
});
function Yd(e, t) {
	return new Jd({
		type: "pipe",
		in: e,
		out: t
	});
}
var Xd = /*@__PURE__*/ M("ZodReadonly", (e, t) => {
	Zu.init(e, t), vd.init(e, t);
});
function Zd(e) {
	return new Xd({
		type: "readonly",
		innerType: e
	});
}
var Qd = /*@__PURE__*/ M("ZodLazy", (e, t) => {
	$u.init(e, t), vd.init(e, t), e.unwrap = () => e._zod.def.getter();
}), $d = /*@__PURE__*/ M("ZodCustom", (e, t) => {
	ed.init(e, t), vd.init(e, t);
});
function ef(e) {
	let t = new _u({ check: "custom" });
	return t._zod.check = e, t;
}
function tf(e, t = {}) {
	return fd($d, e, t);
}
function nf(e) {
	let t = ef((n) => (n.addIssue = (e) => {
		if (typeof e == "string") n.issues.push(au(e, n.value, t._zod.def));
		else {
			let r = e;
			r.fatal && (r.continue = !1), r.code ??= "custom", r.input ??= n.value, r.inst ??= t, r.continue ??= !t._zod.def.abort, n.issues.push(au(r));
		}
	}, e(n.value, n)));
	return t;
}
// node_modules/@ag-ui/client/dist/index.mjs
var rf = "@ag-ui/client";
function af(e) {
	if (!e.metadata || !Object.prototype.hasOwnProperty.call(e.metadata, "@ag-ui/client")) return;
	let t = e.metadata?.[rf];
	if (!t || typeof t != "object" || Array.isArray(t)) return [];
	if (!Object.prototype.hasOwnProperty.call(t, "authoritativeActivityTypes")) return;
	let n = t.authoritativeActivityTypes;
	return n === null ? null : Array.isArray(n) && n.every((e) => typeof e == "string") ? n : [];
}
var P = (e) => {
	if (typeof structuredClone == "function") return structuredClone(e);
	try {
		return JSON.parse(JSON.stringify(e));
	} catch {
		return Array.isArray(e) ? [...e] : { ...e };
	}
};
function of() {
	return r();
}
function sf(e) {
	return e instanceof TypeError && /read[- ]?only|not extensible|cannot add property|cannot delete property|can't be deleted|unable to delete property|object is frozen|is not writable/i.test(e.message);
}
function cf(e) {
	if (Object.freeze(e), typeof e == "object" && e) for (let t of Object.values(e)) typeof t == "object" && t && !Object.isFrozen(t) && cf(t);
	return e;
}
var lf = 524288;
function uf(e, t, n) {
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
async function F(e, t, n, r) {
	let i = typeof process < "u" && process.env !== void 0, a = i && !!process.env.VITEST_WORKER_ID, o = i && !!process.env.VITEST_WORKER_ID, s = o && !uf(t, n, lf), c = s ? P(t) : t, l = s ? P(n) : n, u = !1, d = !1, f;
	for (let t of e) try {
		s && (cf(c), cf(l));
		let e = await r(t, c, l);
		if (e === void 0) continue;
		let n = !1;
		if (e.messages !== void 0 && e.messages !== c && (c = P(e.messages), u = !0, n = !0), e.state !== void 0 && e.state !== l && (l = P(e.state), d = !0, n = !0), s && n && uf(c, l, lf) && (s = !1), f = e.stopPropagation, f === !0) break;
	} catch (e) {
		if (a && e instanceof TypeError) throw e;
		s && o && sf(e) ? console.error("AG-UI: Subscriber attempted to mutate frozen inputs in-place. Return mutations via AgentStateMutation instead of mutating directly.", e) : console.error("Subscriber error:", e);
		continue;
	}
	return {
		...u ? { messages: Object.isFrozen(c) ? P(c) : c } : {},
		...d ? { state: Object.isFrozen(l) ? P(l) : l } : {},
		...f === void 0 ? {} : { stopPropagation: f }
	};
}
function df(e) {
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
function ff(e) {
	if (e instanceof pf) return e;
	if (e === !0) return new pf(df(!0));
}
var pf = class {
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
function mf(e) {
	return e.enabled ? new pf(e) : void 0;
}
function hf(e, t, n) {
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
function gf(e, t) {
	return !e || t.metadata === void 0 ? !1 : (e.metadata = Ie(e.metadata, P(t.metadata)), !0);
}
var _f = (e, t, n, r, i) => {
	let a = ff(i), o = P(n.messages), s = P(e.state), c = {}, l = [], u = /* @__PURE__ */ new Set(), d = (e) => {
		let t = e.outcome?.type === "success" ? e.outcome.pendingToolCallIds : void 0;
		return t !== void 0 && t.length > 0 ? [...t] : l.filter((e) => !u.has(e));
	}, f = (e) => {
		e.messages !== void 0 && (o = e.messages, c.messages = e.messages), e.state !== void 0 && (s = e.state, c.state = e.state);
	}, p = () => {
		let e = P(c);
		return c = {}, e.messages !== void 0 || e.state !== void 0 ? y(e) : Un;
	};
	return t.pipe(ii(async (t) => {
		let i = await F(r, o, s, (r, i, a) => r.onEvent?.({
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
			case _.TEXT_MESSAGE_START: {
				let i = await F(r, o, s, (r, i, a) => r.onTextMessageStartEvent?.({
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
					let c = gf(s, t);
					(!a || c) && f({ messages: o });
				}
				return p();
			}
			case _.TEXT_MESSAGE_CONTENT: {
				let { messageId: i, delta: a } = t, c = o.find((e) => e.id === i);
				if (!c) return console.warn(`TEXT_MESSAGE_CONTENT: No message found with ID '${i}'`), p();
				if (c.role === "activity") return console.warn(`TEXT_MESSAGE_CONTENT: Message '${i}' is an activity message — message ids must be unique across activity and text messages`), p();
				let l = await F(r, o, s, (r, i, a) => r.onTextMessageContentEvent?.({
					event: t,
					messages: i,
					state: a,
					agent: n,
					input: e,
					textMessageBuffer: typeof c.content == "string" ? c.content : ""
				}));
				return f(l), l.stopPropagation !== !0 && (c.content = `${typeof c.content == "string" ? c.content : ""}${a}`, gf(c, t), f({ messages: o })), p();
			}
			case _.TEXT_MESSAGE_END: {
				let { messageId: i } = t, a = o.find((e) => e.id === i);
				if (!a) return console.warn(`TEXT_MESSAGE_END: No message found with ID '${i}'`), p();
				if (a.role === "activity") return console.warn(`TEXT_MESSAGE_END: Message '${i}' is an activity message — message ids must be unique across activity and text messages`), p();
				let c = await F(r, o, s, (r, i, o) => r.onTextMessageEndEvent?.({
					event: t,
					messages: i,
					state: o,
					agent: n,
					input: e,
					textMessageBuffer: typeof a.content == "string" ? a.content : ""
				}));
				return f(c), c.stopPropagation !== !0 && gf(a, t) && f({ messages: o }), await Promise.all(r.map((t) => {
					t.onNewMessage?.({
						message: a,
						messages: o,
						state: s,
						agent: n,
						input: e
					});
				})), p();
			}
			case _.TOOL_CALL_START: {
				let i = await F(r, o, s, (r, i, a) => r.onToolCallStartEvent?.({
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
						return r && (console.warn(`TOOL_CALL_START: tool call '${e}' already exists with name '${a.function.name}' — updating it to '${n}'`), a.function.name = n), (gf(a, t) || r) && f({ messages: o }), p();
					}
					let s = new Set(o.map((e) => e.id)), c = hf(o, r, e);
					!s.has(c.id) && i != null && c.subagentRunId === void 0 && (c.subagentRunId = i), c.toolCalls ??= [];
					let u = {
						id: e,
						type: "function",
						function: {
							name: n,
							arguments: ""
						}
					};
					c.toolCalls.push(u), gf(u, t), f({ messages: o });
				}
				return p();
			}
			case _.TOOL_CALL_ARGS: {
				let { toolCallId: i, delta: a } = t, c = o.find((e) => e.toolCalls?.some((e) => e.id === i));
				if (!c) return console.warn(`TOOL_CALL_ARGS: No message found containing tool call with ID '${i}'`), p();
				let l = c.toolCalls?.find((e) => e.id === i);
				if (!l) return console.warn(`TOOL_CALL_ARGS: No tool call found with ID '${i}'`), p();
				let u = await F(r, o, s, (r, i, a) => {
					let o = l.function.arguments, s = l.function.name, c = {};
					try {
						c = Di(o);
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
				return f(u), u.stopPropagation !== !0 && (l.function.arguments += a, gf(l, t), f({ messages: o })), p();
			}
			case _.TOOL_CALL_END: {
				let { toolCallId: i } = t, a = o.find((e) => e.toolCalls?.some((e) => e.id === i));
				if (!a) return console.warn(`TOOL_CALL_END: No message found containing tool call with ID '${i}'`), p();
				let c = a.toolCalls?.find((e) => e.id === i);
				if (!c) return console.warn(`TOOL_CALL_END: No tool call found with ID '${i}'`), p();
				let l = await F(r, o, s, (r, i, a) => {
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
				return f(l), l.stopPropagation !== !0 && gf(c, t) && f({ messages: o }), await Promise.all(r.map((t) => {
					t.onNewToolCall?.({
						toolCall: c,
						messages: o,
						state: s,
						agent: n,
						input: e
					});
				})), p();
			}
			case _.TOOL_CALL_RESULT: {
				let i = await F(r, o, s, (r, i, a) => r.onToolCallResultEvent?.({
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
					gf(p, t);
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
			case _.STATE_SNAPSHOT: {
				let i = await F(r, o, s, (r, i, a) => r.onStateSnapshotEvent?.({
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
			case _.STATE_DELTA: {
				let i = await F(r, o, s, (r, i, a) => r.onStateDeltaEvent?.({
					event: t,
					messages: i,
					state: a,
					agent: n,
					input: e
				}));
				if (f(i), i.stopPropagation !== !0) {
					let { delta: e } = t;
					try {
						s = bt.applyPatch(s, e, !0, !1).newDocument, f({ state: s });
					} catch (t) {
						let n = t instanceof Error ? t.message : String(t);
						console.warn(`Failed to apply state patch:\nCurrent state: ${JSON.stringify(s, null, 2)}\nPatch operations: ${JSON.stringify(e, null, 2)}\nError: ${n}`);
					}
				}
				return p();
			}
			case _.MESSAGES_SNAPSHOT: {
				let i = await F(r, o, s, (r, i, a) => r.onMessagesSnapshotEvent?.({
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
					}), r = new Map(n.map((e) => [e.id, e])), i = af(t), a = n.some((e) => e.role === "activity"), s = n.some((e) => e.role === "reasoning"), c = (e) => e.role === "activity" && (i ? !i.includes(e.activityType) : i !== null && !a) || e.role === "reasoning" && !s;
					o = o.filter((e) => r.has(e.id) || c(e)).map((e) => r.get(e.id) ?? e);
					let l = new Set(o.map((e) => e.id));
					for (let e of n) l.has(e.id) || o.push(e);
					f({ messages: o });
				}
				return p();
			}
			case _.ACTIVITY_SNAPSHOT: {
				let i = t, a = o.findIndex((e) => e.id === i.messageId), c = a >= 0 ? o[a] : void 0, l = c?.role === "activity" ? c : void 0, u = i.replace ?? !0, d = await F(r, o, s, (t, r, a) => t.onActivitySnapshotEvent?.({
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
						content: P(i.content),
						...i.subagentRunId != null && { subagentRunId: i.subagentRunId }
					}, c, d;
					a === -1 ? (o.push(t), c = t, d = t) : l ? (u && (o[a] = {
						...l,
						activityType: i.activityType,
						content: P(i.content),
						subagentRunId: i.subagentRunId
					}, i.subagentRunId ?? delete o[a].subagentRunId), d = o[a]) : u && (o[a] = t, c = t, d = t), gf(d, i), f({ messages: o }), c && await Promise.all(r.map((t) => t.onNewMessage?.({
						message: c,
						messages: o,
						state: s,
						agent: n,
						input: e
					})));
				}
				return p();
			}
			case _.ACTIVITY_DELTA: {
				let i = t, a = o.findIndex((e) => e.id === i.messageId);
				if (a === -1) return p();
				let c = o[a];
				if (c.role !== "activity") return console.warn(`ACTIVITY_DELTA: Message '${i.messageId}' is not an activity message`), p();
				let l = c, u = await F(r, o, s, (t, r, a) => t.onActivityDeltaEvent?.({
					event: i,
					messages: r,
					state: a,
					agent: n,
					input: e,
					activityMessage: l
				}));
				if (f(u), u.stopPropagation !== !0) try {
					gf(l, i) && f({ messages: o });
					let e = P(l.content ?? {}), t = bt.applyPatch(e, i.patch ?? [], !0, !1).newDocument;
					o[a] = {
						...l,
						content: P(t),
						activityType: i.activityType
					}, f({ messages: o });
				} catch (e) {
					let t = e instanceof Error ? e.message : String(e);
					console.warn(`Failed to apply activity patch for '${i.messageId}': ${t}`);
				}
				return p();
			}
			case _.RAW: return f(await F(r, o, s, (r, i, a) => r.onRawEvent?.({
				event: t,
				messages: i,
				state: a,
				agent: n,
				input: e
			}))), p();
			case _.CUSTOM: return f(await F(r, o, s, (r, i, a) => r.onCustomEvent?.({
				event: t,
				messages: i,
				state: a,
				agent: n,
				input: e
			}))), p();
			case _.RUN_STARTED: {
				let i = await F(r, o, s, (r, i, a) => r.onRunStartedEvent?.({
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
			case _.RUN_FINISHED: {
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
				}, c = await F(r, o, s, (t, r, i) => t.onRunFinishedEvent?.({
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
			case _.RUN_ERROR: return f(await F(r, o, s, (r, i, a) => r.onRunErrorEvent?.({
				event: t,
				messages: i,
				state: a,
				agent: n,
				input: e
			}))), p();
			case _.STEP_STARTED: return f(await F(r, o, s, (r, i, a) => r.onStepStartedEvent?.({
				event: t,
				messages: i,
				state: a,
				agent: n,
				input: e
			}))), p();
			case _.STEP_FINISHED: return f(await F(r, o, s, (r, i, a) => r.onStepFinishedEvent?.({
				event: t,
				messages: i,
				state: a,
				agent: n,
				input: e
			}))), p();
			case _.TEXT_MESSAGE_CHUNK: throw Error("TEXT_MESSAGE_CHUNK must be transformed before being applied");
			case _.TOOL_CALL_CHUNK: throw Error("TOOL_CALL_CHUNK must be transformed before being applied");
			case _.REASONING_START: return f(await F(r, o, s, (r, i, a) => r.onReasoningStartEvent?.({
				event: t,
				messages: i,
				state: a,
				agent: n,
				input: e
			}))), p();
			case _.REASONING_MESSAGE_START: {
				let i = await F(r, o, s, (r, i, a) => r.onReasoningMessageStartEvent?.({
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
					let a = gf(i, t);
					(!r || a) && f({ messages: o });
				}
				return p();
			}
			case _.REASONING_MESSAGE_CONTENT: {
				let { messageId: i, delta: a } = t, c = o.find((e) => e.id === i);
				if (!c) return console.warn(`REASONING_MESSAGE_CONTENT: No message found with ID '${i}'`), p();
				if (c.role === "activity") return console.warn(`REASONING_MESSAGE_CONTENT: Message '${i}' is an activity message — message ids must be unique across activity and reasoning messages`), p();
				let l = await F(r, o, s, (r, i, a) => r.onReasoningMessageContentEvent?.({
					event: t,
					messages: i,
					state: a,
					agent: n,
					input: e,
					reasoningMessageBuffer: typeof c.content == "string" ? c.content : ""
				}));
				return f(l), l.stopPropagation !== !0 && (c.content = `${typeof c.content == "string" ? c.content : ""}${a}`, gf(c, t), f({ messages: o })), p();
			}
			case _.REASONING_MESSAGE_END: {
				let { messageId: i } = t, a = o.find((e) => e.id === i);
				if (!a) return console.warn(`REASONING_MESSAGE_END: No message found with ID '${i}'`), p();
				if (a.role === "activity") return console.warn(`REASONING_MESSAGE_END: Message '${i}' is an activity message — message ids must be unique across activity and reasoning messages`), p();
				let c = await F(r, o, s, (r, i, o) => r.onReasoningMessageEndEvent?.({
					event: t,
					messages: i,
					state: o,
					agent: n,
					input: e,
					reasoningMessageBuffer: typeof a.content == "string" ? a.content : ""
				}));
				return f(c), c.stopPropagation !== !0 && gf(a, t) && f({ messages: o }), await Promise.all(r.map((t) => {
					t.onNewMessage?.({
						message: a,
						messages: o,
						state: s,
						agent: n,
						input: e
					});
				})), p();
			}
			case _.REASONING_MESSAGE_CHUNK: throw Error("REASONING_MESSAGE_CHUNK must be transformed before being applied");
			case _.REASONING_END: return f(await F(r, o, s, (r, i, a) => r.onReasoningEndEvent?.({
				event: t,
				messages: i,
				state: a,
				agent: n,
				input: e
			}))), p();
			case _.REASONING_ENCRYPTED_VALUE: {
				let { subtype: i, entityId: a, encryptedValue: l } = t, u = await F(r, o, s, (r, i, a) => r.onReasoningEncryptedValueEvent?.({
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
			case _.SUBAGENT_STARTED: return f(await F(r, o, s, (r, i, a) => r.onSubagentStartedEvent?.({
				event: t,
				messages: i,
				state: a,
				agent: n,
				input: e
			}))), p();
			case _.SUBAGENT_FINISHED: return f(await F(r, o, s, (r, i, a) => r.onSubagentFinishedEvent?.({
				event: t,
				messages: i,
				state: a,
				agent: n,
				input: e
			}))), p();
			case _.SUBAGENT_ERROR: return f(await F(r, o, s, (r, i, a) => r.onSubagentErrorEvent?.({
				event: t,
				messages: i,
				state: a,
				agent: n,
				input: e
			}))), p();
		}
		return t.type, p();
	}), Yr(), r.length > 0 ? si({}) : (e) => e);
};
function vf(e, t) {
	typeof process < "u" && process.env !== void 0 && process.env.SUPPRESS_TRANSFORMATION_WARNINGS || console.warn(`[ag-ui][compat] Converting deprecated ${e} to ${t}. The old shape leaves the protocol after its shim window — see the repo-root DEPRECATIONS.md. Set SUPPRESS_TRANSFORMATION_WARNINGS=true to silence.`);
}
var yf = (e) => (t) => {
	let n = ff(e), r = /* @__PURE__ */ new Set(), i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Set(), s = {
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
	}, ne = (e, t) => {
		let n = e ?? [];
		if (Array.isArray(n)) for (let e of n) {
			if (!e || typeof e.id != "string") continue;
			if (e.subagentRunId === null) return new v(`Cannot send a message (id '${e.id}') with 'subagentRunId: null'. The field is optional — omit it entirely.`);
			let n = e.role === "reasoning" ? s.reasoning : e.role === "activity" ? s.activity : s.message;
			(t || !n.has(e.id)) && n.set(e.id, { subagentRunId: e.subagentRunId });
			for (let n of e.toolCalls ?? []) n && typeof n.id == "string" && (t || !s.toolCall.has(n.id)) && s.toolCall.set(n.id, { subagentRunId: e.subagentRunId ?? void 0 });
		}
	}, re = (e, t, n, r, i) => {
		if (t !== void 0 && n && n.subagentRunId !== t) return new v(`Cannot send '${e}': subagentRunId '${t}' does not match the ${r} '${i}' opener's subagent '${n.subagentRunId ?? "(the parent agent)"}'.`);
	};
	return t.pipe(Jr((e) => {
		let t = e.type;
		if (n?.event("VERIFY", "Event:", e, { type: e.type }), l && t !== _.RUN_STARTED) return b(() => new v(`Cannot send event type '${t}': The run has already errored with 'RUN_ERROR'. No further events can be sent.`));
		if (c && t !== _.RUN_ERROR && t !== _.RUN_STARTED) return b(() => new v(`Cannot send event type '${t}': The run has already finished with 'RUN_FINISHED'. Start a new run with 'RUN_STARTED'.`));
		if (!u) {
			if (u = !0, t !== _.RUN_STARTED && t !== _.RUN_ERROR) return b(() => new v("First event must be 'RUN_STARTED'"));
		} else if (t === _.RUN_STARTED) {
			if (g && !c && !l) return b(() => new v("Cannot send 'RUN_STARTED' while a run is still active. The previous run must be finished with 'RUN_FINISHED' before starting a new run."));
			(c || l) && te();
		}
		if (e.subagentRunId === null) {
			ee || (ee = !0, vf("subagentRunId: null", "an absent field"));
			let { subagentRunId: t, ...n } = e;
			e = n;
		}
		if (t === _.SUBAGENT_STARTED || t === _.SUBAGENT_FINISHED || t === _.SUBAGENT_ERROR) {
			let n = t === _.SUBAGENT_STARTED ? [
				"description",
				"parentSubagentRunId",
				"parentToolCallId",
				"parentMessageId"
			] : t === _.SUBAGENT_FINISHED ? ["outcome"] : ["code"];
			for (let r of n) if (e[r] === null) return b(() => new v(`Cannot send '${t}' with '${r}: null'. The field is optional — omit it entirely.`));
			let r = e.outcome;
			if (r != null && r.type !== "success" && r.type !== "suspended") return b(() => new v(`Cannot send '${t}' with outcome type '${String(r.type)}'. The outcome is either { type: "success" } or { type: "suspended" }.`));
			if (r && r.interruptIds === null) return b(() => new v(`Cannot send '${t}' with 'outcome.interruptIds: null'. The field is optional — omit it entirely.`));
			if (r && Array.isArray(r.interruptIds) && r.interruptIds.some((e) => typeof e != "string")) return b(() => new v(`Cannot send '${t}' with a non-string entry in 'outcome.interruptIds'. Interrupt ids are strings.`));
		}
		if (t === _.RUN_FINISHED) {
			let t = e.outcome;
			if (t?.type === "interrupt" && Array.isArray(t.interrupts)) {
				for (let e of t.interrupts) if (e && e.subagentRunId === null) return b(() => new v(`Cannot send 'RUN_FINISHED' with an interrupt (id '${e.id}') carrying 'subagentRunId: null'. The field is optional — omit it entirely.`));
			}
		}
		switch (t) {
			case _.TEXT_MESSAGE_START: {
				let n = e.messageId;
				if (r.has(n)) return b(() => new v(`Cannot send 'TEXT_MESSAGE_START' event: A text message with ID '${n}' is already in progress. Complete it with 'TEXT_MESSAGE_END' first.`));
				let i = s.message.get(n);
				if (i) {
					let r = re(t, e.subagentRunId, i, "message", n);
					if (r) return b(() => r);
				}
				return r.add(n), i || s.message.set(n, { subagentRunId: e.subagentRunId }), y(e);
			}
			case _.TEXT_MESSAGE_CONTENT: {
				let n = e.messageId;
				if (!r.has(n)) return b(() => new v(`Cannot send 'TEXT_MESSAGE_CONTENT' event: No active text message found with ID '${n}'. Start a text message with 'TEXT_MESSAGE_START' first.`));
				let i = re(t, e.subagentRunId, s.message.get(n), "message", n);
				return i ? b(() => i) : y(e);
			}
			case _.TEXT_MESSAGE_END: {
				let n = e.messageId;
				if (!r.has(n)) return b(() => new v(`Cannot send 'TEXT_MESSAGE_END' event: No active text message found with ID '${n}'. A 'TEXT_MESSAGE_START' event must be sent first.`));
				let i = re(t, e.subagentRunId, s.message.get(n), "message", n);
				return i ? b(() => i) : (r.delete(n), y(e));
			}
			case _.TOOL_CALL_START: {
				let n = e.toolCallId;
				if (i.has(n)) return b(() => new v(`Cannot send 'TOOL_CALL_START' event: A tool call with ID '${n}' is already in progress. Complete it with 'TOOL_CALL_END' first.`));
				let r = e.parentMessageId, a = e.subagentRunId, o;
				if (r !== void 0) {
					let e = s.message.get(r);
					if (e) {
						if (a !== void 0 && a !== e.subagentRunId) return b(() => new v(`Cannot send 'TOOL_CALL_START': subagentRunId '${a}' does not match its parent message '${r}' owner '${e.subagentRunId ?? "(the parent agent)"}'. A tool call belongs to the message that carries it.`));
						o = e;
					}
				}
				let c = s.toolCall.get(n);
				if (c) {
					let e = re(t, a, c, "tool call", n);
					if (e) return b(() => e);
					if (a === void 0 && o && o.subagentRunId !== c.subagentRunId) return b(() => new v(`Cannot send 'TOOL_CALL_START': tool call '${n}' is owned by '${c.subagentRunId ?? "(the parent agent)"}' but its parent message '${r}' is owned by '${o.subagentRunId ?? "(the parent agent)"}'. A tool call belongs to the message that carries it.`));
				}
				return i.add(n), c || s.toolCall.set(n, a === void 0 ? o ?? { subagentRunId: void 0 } : { subagentRunId: a }), y(e);
			}
			case _.TOOL_CALL_ARGS: {
				let n = e.toolCallId;
				if (!i.has(n)) return b(() => new v(`Cannot send 'TOOL_CALL_ARGS' event: No active tool call found with ID '${n}'. Start a tool call with 'TOOL_CALL_START' first.`));
				let r = re(t, e.subagentRunId, s.toolCall.get(n), "tool call", n);
				return r ? b(() => r) : y(e);
			}
			case _.TOOL_CALL_END: {
				let n = e.toolCallId;
				if (!i.has(n)) return b(() => new v(`Cannot send 'TOOL_CALL_END' event: No active tool call found with ID '${n}'. A 'TOOL_CALL_START' event must be sent first.`));
				let r = re(t, e.subagentRunId, s.toolCall.get(n), "tool call", n);
				return r ? b(() => r) : (i.delete(n), y(e));
			}
			case _.STEP_STARTED: {
				let t = e.stepName, n = e.subagentRunId;
				return f(n).has(t) ? b(() => new v(`Step "${t}" is already active for 'STEP_STARTED'${n === void 0 ? "" : ` in subagent '${n}'`}`)) : (f(n).set(t, !0), y(e));
			}
			case _.STEP_FINISHED: {
				let t = e.stepName, n = e.subagentRunId;
				if (!f(n).has(t)) {
					let e, r = !1;
					for (let [i, a] of d) if (i !== n && a.has(t)) {
						e = i, r = !0;
						break;
					}
					return b(r ? () => new v(`Cannot send 'STEP_FINISHED' for step "${t}" attributed to ${n === void 0 ? "the parent agent" : `subagent '${n}'`}: that step is open under ${e === void 0 ? "the parent agent" : `subagent '${e}'`}. A step must be finished by whoever started it.`) : () => new v(`Cannot send 'STEP_FINISHED' for step "${t}" that was not started`));
				}
				return f(n).delete(t), y(e);
			}
			case _.ACTIVITY_SNAPSHOT: {
				let t = e.messageId;
				return s.activity.has(t) && e.replace === !1 || s.activity.set(t, { subagentRunId: e.subagentRunId }), y(e);
			}
			case _.TOOL_CALL_RESULT: {
				let t = e.messageId;
				return typeof t == "string" && s.message.set(t, { subagentRunId: e.subagentRunId }), y(e);
			}
			case _.REASONING_START:
			case _.REASONING_MESSAGE_START: {
				let n = e.messageId, r = t === _.REASONING_START, i = r ? a : o;
				if (i.has(n)) return b(() => new v(r ? `Cannot send 'REASONING_START' event: A reasoning span with ID '${n}' is already in progress. Complete it with 'REASONING_END' first.` : `Cannot send 'REASONING_MESSAGE_START' event: A reasoning message with ID '${n}' is already in progress. Complete it with 'REASONING_MESSAGE_END' first.`));
				let c = s.reasoning.get(n);
				if (c) {
					let r = re(t, e.subagentRunId, c, "reasoning message", n);
					if (r) return b(() => r);
				}
				return i.add(n), c || s.reasoning.set(n, { subagentRunId: e.subagentRunId }), y(e);
			}
			case _.REASONING_MESSAGE_CONTENT:
			case _.REASONING_MESSAGE_END:
			case _.REASONING_END: {
				let n = e.messageId, r = t === _.REASONING_END, i = r ? a : o;
				if (!i.has(n)) return b(() => new v(r ? `Cannot send 'REASONING_END' event: No active reasoning span found with ID '${n}'. A 'REASONING_START' event must be sent first.` : `Cannot send '${t}' event: No active reasoning message found with ID '${n}'. Start a reasoning message with 'REASONING_MESSAGE_START' first.`));
				let c = re(t, e.subagentRunId, s.reasoning.get(n), "reasoning message", n);
				return c ? b(() => c) : ((t === _.REASONING_END || t === _.REASONING_MESSAGE_END) && i.delete(n), y(e));
			}
			case _.REASONING_ENCRYPTED_VALUE: {
				let n = e.entityId, r = e.subtype, i = r === "tool-call" ? s.toolCall.get(n) : r === "message" ? s.message.get(n) ?? s.reasoning.get(n) : s.reasoning.get(n), a = r === "tool-call" ? "tool call" : r === "message" ? "message" : "reasoning message", o = re(t, e.subagentRunId, i, a, n);
				return o ? b(() => o) : y(e);
			}
			case _.ACTIVITY_DELTA: {
				let n = e.messageId, r = re(t, e.subagentRunId, s.activity.get(n), "activity", n);
				return r ? b(() => r) : y(e);
			}
			case _.SUBAGENT_STARTED: {
				if (typeof e.subagentRunId != "string") return b(() => new v("Cannot send 'SUBAGENT_STARTED' without a 'subagentRunId'."));
				if (typeof e.name != "string") return b(() => new v("Cannot send 'SUBAGENT_STARTED' without a 'name'."));
				let t = e.subagentRunId, n = e.parentSubagentRunId;
				return m.has(t) ? b(() => new v(`Cannot send 'SUBAGENT_STARTED': subagent '${t}' is already active. Finish it with 'SUBAGENT_FINISHED' first.`)) : h.has(t) ? b(() => new v(`Cannot send 'SUBAGENT_STARTED': subagent '${t}' has already finished in this run. Subagent IDs are per-invocation and cannot be reused.`)) : n !== void 0 && !m.has(n) && !h.has(n) ? b(() => new v(`Cannot send 'SUBAGENT_STARTED': parentSubagentRunId '${n}' has not been started in this run.`)) : (m.set(t, !0), y(e));
			}
			case _.SUBAGENT_FINISHED:
			case _.SUBAGENT_ERROR: {
				if (typeof e.subagentRunId != "string") return b(() => new v(`Cannot send '${t}' without a 'subagentRunId'.`));
				if (t === _.SUBAGENT_ERROR && typeof e.message != "string") return b(() => new v("Cannot send 'SUBAGENT_ERROR' without a 'message'."));
				let n = e.subagentRunId;
				return m.has(n) ? (m.delete(n), h.add(n), y(e)) : b(() => new v(`Cannot send '${t}': no active subagent found with ID '${n}'. A 'SUBAGENT_STARTED' event must be sent first.`));
			}
			case _.MESSAGES_SNAPSHOT:
				{
					let t = ne(e.messages, !0);
					if (t) return b(() => t);
				}
				return y(e);
			case _.RUN_STARTED:
				g = !0;
				{
					let t = ne((e.input ?? {}).messages, !1);
					if (t) return b(() => t);
				}
				return y(e);
			case _.RUN_FINISHED:
				if (p()) {
					let e = [];
					for (let [t, n] of d) for (let r of n.keys()) e.push(t === void 0 ? r : `${r} (subagent '${t}')`);
					let t = e.join(", ");
					return b(() => new v(`Cannot send 'RUN_FINISHED' while steps are still active: ${t}`));
				}
				if (r.size > 0) {
					let e = Array.from(r.keys()).join(", ");
					return b(() => new v(`Cannot send 'RUN_FINISHED' while text messages are still active: ${e}`));
				}
				if (o.size > 0) {
					let e = Array.from(o.keys()).join(", ");
					return b(() => new v(`Cannot send 'RUN_FINISHED' while reasoning messages are still active: ${e}`));
				}
				if (a.size > 0) {
					let e = Array.from(a.keys()).join(", ");
					return b(() => new v(`Cannot send 'RUN_FINISHED' while reasoning spans are still active: ${e}`));
				}
				if (i.size > 0) {
					let e = Array.from(i.keys()).join(", ");
					return b(() => new v(`Cannot send 'RUN_FINISHED' while tool calls are still active: ${e}`));
				}
				if (m.size > 0) {
					let e = Array.from(m.keys()).join(", ");
					return b(() => new v(`Cannot send 'RUN_FINISHED' while subagents are still active: ${e}`));
				}
				return c = !0, y(e);
			case _.RUN_ERROR: return l = !0, y(e);
			case _.CUSTOM: return y(e);
			default: return y(e);
		}
	}));
}, bf = function(e) {
	return e.HEADERS = "headers", e.DATA = "data", e;
}({}), xf = (e) => S(() => Cr(e())).pipe(C((e) => {
	if (!e.ok) {
		let t = e.headers.get("content-type") || "";
		return Cr(e.text()).pipe(Jr((n) => {
			let r = n;
			if (t.includes("application/json")) try {
				r = JSON.parse(n);
			} catch {}
			let i = Error(`HTTP ${e.status}: ${typeof r == "string" ? r : JSON.stringify(r)}`);
			return i.status = e.status, i.payload = r, b(() => i);
		}));
	}
	let t = {
		type: bf.HEADERS,
		status: e.status,
		headers: e.headers
	}, n = e.body?.getReader();
	return n ? new fn((e) => {
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
						type: bf.DATA,
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
	}) : b(() => Error("Failed to getReader() from response"));
})), Sf = 10485760, Cf = (e, t) => {
	let n = ff(t), r = new xn(), i = new TextDecoder("utf-8", { fatal: !1 }), a = "";
	e.subscribe({
		next: (e) => {
			if (e.type !== bf.HEADERS && e.type === bf.DATA && e.data) {
				let t = i.decode(e.data, { stream: !0 });
				a += t;
				let n = a.split(/\n\n/);
				a = n.pop() || "";
				for (let e of n) o(e);
				if (a.length > Sf) {
					r.error(Error(`SSE buffer size exceeded maximum limit of ${Sf / 1048576} MB`));
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
}, wf = 10485760, Tf = () => typeof process < "u" && process.env !== void 0 && !!process.env.SUPPRESS_TRANSFORMATION_WARNINGS, Ef = (e, t) => {
	let n = ff(t), r = new xn(), i = /* @__PURE__ */ new Uint8Array(), a = !1;
	e.subscribe({
		next: (e) => {
			if (e.type !== bf.HEADERS && e.type === bf.DATA && e.data) {
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
			if (e > wf) {
				r.error(Error(`Protobuf message size exceeded maximum limit of ${wf / 1048576} MB`));
				return;
			}
			if (i.length < e) break;
			try {
				let t = yl(i.slice(4, e));
				n?.event("PROTO", "Event received:", t, { type: t.type }), r.next(t);
			} catch (e) {
				if (e instanceof pl) Tf() || console.warn("[ag-ui][proto] Dropped an event this build does not know: the protocol has a variant this SDK predates.");
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
}, Df = (e, t) => {
	let n = ff(t), r = new xn(), i = new Tn(1), a = !1, o, s = !1, c = () => {
		s = !0, o?.unsubscribe();
	}, l = (e) => {
		c(), r.error(e);
	}, u = () => {
		c(), r.complete();
	};
	return o = e.subscribe({
		next: (e) => {
			if (i.next(e), e.type === bf.HEADERS && !a) {
				a = !0;
				let t = e.headers.get("content-type");
				n?.lifecycle("HTTP", "Stream format detected:", {
					contentType: t,
					parser: t === "application/vnd.ag-ui.event+proto" ? "protobuf" : "sse"
				}), t === "application/vnd.ag-ui.event+proto" ? Ef(i, n).subscribe({
					next: (e) => r.next(e),
					error: (e) => l(e),
					complete: () => u()
				}) : Cf(i, n).subscribe({
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
							type: _.RUN_ERROR,
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
}, Of = {
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
}, kf = (e) => {
	if (typeof e == "string") return e;
	if (!Array.isArray(e)) return;
	let t = e.filter((e) => e.type === "text").map((e) => e.text).filter((e) => e.length > 0);
	if (t.length !== 0) return t.join("\n");
};
function Af(e, t) {
	return Re(t) && jf(`[ag-ui][legacy] The result of tool call '${e}' carries content parts the legacy protocol cannot represent; only its text parts are bridged and the rest is dropped.`), Le(t);
}
var jf = (e) => {
	typeof process < "u" && process.env !== void 0 && process.env.SUPPRESS_TRANSFORMATION_WARNINGS || console.warn(e);
}, Mf = (e, t, n) => (r) => {
	let i = {}, a = !0, o = !0, s = "", c = null, l = null, u = [], d = {}, f = !1, p = (e) => {
		typeof e == "object" && e && ("messages" in e && delete e.messages, i = e);
	};
	return r.pipe(Jr((r) => {
		switch (r.type) {
			case _.TEXT_MESSAGE_START: {
				let e = r;
				return [{
					type: Of.TextMessageStart,
					messageId: e.messageId,
					role: e.role
				}];
			}
			case _.TEXT_MESSAGE_CONTENT: {
				let e = r;
				return [{
					type: Of.TextMessageContent,
					messageId: e.messageId,
					content: e.delta
				}];
			}
			case _.TEXT_MESSAGE_END: {
				let e = r;
				return [{
					type: Of.TextMessageEnd,
					messageId: e.messageId
				}];
			}
			case _.TOOL_CALL_START: {
				let e = r;
				return u.push({
					id: e.toolCallId,
					type: "function",
					function: {
						name: e.toolCallName,
						arguments: ""
					}
				}), o = !0, d[e.toolCallId] = e.toolCallName, [{
					type: Of.ActionExecutionStart,
					actionExecutionId: e.toolCallId,
					actionName: e.toolCallName,
					parentMessageId: e.parentMessageId
				}];
			}
			case _.TOOL_CALL_ARGS: {
				let c = r, d = u.find((e) => e.id === c.toolCallId);
				if (!d) return jf(`[ag-ui][legacy] TOOL_CALL_ARGS: No tool call found with ID '${c.toolCallId}'`), [];
				d.function.arguments += c.delta;
				let f = !1;
				if (l) {
					let e = l.find((e) => e.tool == d.function.name);
					if (e) try {
						let t = JSON.parse(Di(d.function.arguments));
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
					type: Of.ActionExecutionArgs,
					actionExecutionId: c.toolCallId,
					args: c.delta
				}, ...f ? [{
					type: Of.AgentStateMessage,
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
			case _.TOOL_CALL_END: {
				let e = r;
				return [{
					type: Of.ActionExecutionEnd,
					actionExecutionId: e.toolCallId
				}];
			}
			case _.TOOL_CALL_RESULT: {
				let e = r, t = d[e.toolCallId];
				return (t === void 0 || t === "") && jf(`[ag-ui][legacy] No usable tool name was seen for tool call '${e.toolCallId}' (${t === void 0 ? "no TOOL_CALL_START reached this bridge" : "its TOOL_CALL_START carried an empty toolCallName"}), so its result is being bridged with the fabricated action name "unknown". Downstream consumers route on that name.`), [{
					type: Of.ActionExecutionResult,
					actionExecutionId: e.toolCallId,
					result: Af(e.toolCallId, e.content),
					actionName: t || "unknown"
				}];
			}
			case _.RAW: return f || (f = !0, jf("[ag-ui][legacy] Dropping RAW events: the legacy runtime protocol has no equivalent, so the provider payloads they carry do not reach the legacy stream. Reported once per stream.")), [];
			case _.CUSTOM: {
				let e = r;
				switch (e.name) {
					case "Exit":
						a = !1;
						break;
					case "PredictState": l = e.value;
				}
				return [{
					type: Of.MetaEvent,
					name: e.name,
					value: e.value
				}];
			}
			case _.STATE_SNAPSHOT: return p(r.snapshot), [{
				type: Of.AgentStateMessage,
				threadId: e,
				agentName: n,
				nodeName: s,
				runId: t,
				running: a,
				role: "assistant",
				state: JSON.stringify(i),
				active: o
			}];
			case _.STATE_DELTA: {
				let c = r, l;
				try {
					l = bt.applyPatch(i, c.delta, !0, !1).newDocument;
				} catch (e) {
					let t = e instanceof Error ? e.message : String(e);
					return jf(`[ag-ui][legacy] Failed to apply state patch:\nCurrent state: ${JSON.stringify(i, null, 2)}\nPatch operations: ${JSON.stringify(c.delta, null, 2)}\nError: ${t}`), [];
				}
				return p(l), [{
					type: Of.AgentStateMessage,
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
			case _.MESSAGES_SNAPSHOT: return c = r.messages, [{
				type: Of.AgentStateMessage,
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
			case _.RUN_STARTED: return [];
			case _.RUN_FINISHED: {
				if (c && (i.messages = c), Object.keys(i).length === 0) return [];
				let r = null;
				if (c) try {
					r = Nf(c);
				} catch (e) {
					return [{
						type: Of.RunError,
						message: e.message
					}];
				}
				return [{
					type: Of.AgentStateMessage,
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
			case _.RUN_ERROR: {
				let e = r;
				return [{
					type: Of.RunError,
					message: e.message,
					code: e.code
				}];
			}
			case _.STEP_STARTED: return s = r.stepName, u = [], l = null, [{
				type: Of.AgentStateMessage,
				threadId: e,
				agentName: n,
				nodeName: s,
				runId: t,
				running: a,
				role: "assistant",
				state: JSON.stringify(i),
				active: !0
			}];
			case _.STEP_FINISHED: return u = [], l = null, [{
				type: Of.AgentStateMessage,
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
function Nf(e) {
	let t = [];
	for (let n of e) if (n.role === "assistant" || n.role === "user" || n.role === "system") {
		let e = kf(n.content);
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
			result: Af(n.toolCallId, n.content),
			actionExecutionId: n.toolCallId,
			actionName: r
		};
		t.push(i);
	}
	return t;
}
var Pf = (e) => e.kind === "tool" ? e.fields.toolCallId : e.fields.messageId, Ff = (e) => e === "tool" ? "toolCallId" : "messageId", If = (e, t, n, r, i) => {
	if (r !== void 0 && r !== i) throw Error(`Cannot continue ${e} '${t}': chunk ${n} '${r}' does not match the open stream's ${n} ${i === void 0 ? "(absent)" : `'${i}'`}.`);
}, Lf = (e, t) => t.metadata === void 0 ? e : {
	...e,
	metadata: t.metadata
}, Rf = (e, t) => {
	let n = Lf(e, t);
	return t.rawEvent === void 0 ? n : {
		...n,
		rawEvent: t.rawEvent
	};
}, zf = (e) => new Set(Object.keys(e.shape)), Bf = zf(Ni), Vf = zf(Li), Hf = zf(Va), Uf = (e, t) => {
	let n;
	for (let r of Object.keys(e)) t.has(r) || ((n ??= {})[r] = e[r]);
	return n;
}, Wf = (e) => {
	typeof process < "u" && process.env !== void 0 && process.env.SUPPRESS_TRANSFORMATION_WARNINGS || console.warn(`[ag-ui][transform] ${e} Set SUPPRESS_TRANSFORMATION_WARNINGS=true to silence.`);
}, Gf = (e, t, n, r) => {
	if (t === void 0 || n || e.length === 0) return;
	let i = e[e.length - 1], a = Object.keys(t).filter((e) => Object.prototype.hasOwnProperty.call(i, e));
	a.length > 0 && Wf(`A ${r} carried ${a.map((e) => `'${e}'`).join(", ")}, which the synthesized ${String(i.type)} already describes. The synthesized value is kept and the chunk's is dropped — this stage does not judge a described field, so the producer's value cannot be substituted for its own.`), e[e.length - 1] = {
		...t,
		...i
	};
}, Kf = (e) => (t) => {
	let n = ff(e), r = /* @__PURE__ */ new Map(), i = (e) => {
		let t = r.get(e);
		if (!t) return [];
		switch (r.delete(e), t.kind) {
			case "text": {
				let e = {
					type: _.TEXT_MESSAGE_END,
					messageId: t.fields.messageId,
					...t.fields.subagentRunId !== void 0 && { subagentRunId: t.fields.subagentRunId }
				};
				return n?.event("TRANSFORM", "TEXT_MESSAGE_END", e, { messageId: e.messageId }), [e];
			}
			case "tool": {
				let e = {
					type: _.TOOL_CALL_END,
					toolCallId: t.fields.toolCallId,
					...t.fields.subagentRunId !== void 0 && { subagentRunId: t.fields.subagentRunId }
				};
				return n?.event("TRANSFORM", "TOOL_CALL_END", e, { toolCallId: e.toolCallId }), [e];
			}
			case "reasoning": {
				let e = {
					type: _.REASONING_MESSAGE_END,
					messageId: t.fields.messageId,
					...t.fields.subagentRunId !== void 0 && { subagentRunId: t.fields.subagentRunId }
				};
				return n?.event("TRANSFORM", "REASONING_MESSAGE_END", e, { messageId: e.messageId }), [e];
			}
		}
	}, a = () => [...r.keys()].flatMap((e) => i(e)), o = (e, t) => {
		for (let [n, i] of r) if (i.kind === e && Pf(i) === t) return { owner: n };
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
		if (s.length > 1) throw Error(`Ambiguous ${i}: it carries neither a ${Ff(e)} nor a subagentRunId, but ${s.length} lanes have an open ${a}. Attribute the chunk to the subagent it belongs to.`);
	};
	return t.pipe(Jr((e) => {
		switch (e.type) {
			case _.TEXT_MESSAGE_START:
			case _.TEXT_MESSAGE_CONTENT:
			case _.TEXT_MESSAGE_END:
			case _.TOOL_CALL_START:
			case _.TOOL_CALL_ARGS:
			case _.TOOL_CALL_END:
			case _.TOOL_CALL_RESULT:
			case _.STATE_SNAPSHOT:
			case _.STATE_DELTA:
			case _.CUSTOM:
			case _.STEP_STARTED:
			case _.STEP_FINISHED:
			case _.REASONING_START:
			case _.REASONING_MESSAGE_START:
			case _.REASONING_MESSAGE_CONTENT:
			case _.REASONING_MESSAGE_END:
			case _.REASONING_END: return [...i(e.subagentRunId ?? void 0), e];
			case _.RUN_STARTED:
			case _.RUN_FINISHED:
			case _.RUN_ERROR:
			case _.MESSAGES_SNAPSHOT: return [...a(), e];
			case _.RAW:
			case _.ACTIVITY_SNAPSHOT:
			case _.ACTIVITY_DELTA:
			case _.REASONING_ENCRYPTED_VALUE:
			case _.SUBAGENT_STARTED: return [e];
			case _.SUBAGENT_FINISHED:
			case _.SUBAGENT_ERROR: {
				let t = e.subagentRunId;
				return t == null ? [e] : [...i(t), e];
			}
			case _.TEXT_MESSAGE_CHUNK: {
				let t = e, a = Uf(e, Bf), o = s("text", t.messageId, t.subagentRunId ?? void 0, "TEXT_MESSAGE_CHUNK", "text message"), c = r.get(o), l = [], u = !1, d;
				if (c?.kind === "text" && (t.messageId === void 0 || t.messageId === c.fields.messageId)) If("text message", c.fields.messageId, "role", t.role, c.fields.role), If("text message", c.fields.messageId, "name", t.name, c.fields.name), d = c.fields;
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
					let e = Lf({
						type: _.TEXT_MESSAGE_START,
						messageId: t.messageId,
						role: d.role,
						...t.name !== void 0 && { name: t.name },
						...t.subagentRunId !== void 0 && { subagentRunId: t.subagentRunId }
					}, t);
					l.push(e), n?.event("TRANSFORM", "TEXT_MESSAGE_START", e, { messageId: t.messageId });
				}
				if (t.delta !== void 0 || t.rawEvent !== void 0) {
					let e = t.subagentRunId === void 0 ? d.subagentRunId : t.subagentRunId, r = Rf({
						...a,
						type: _.TEXT_MESSAGE_CONTENT,
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
						type: _.TEXT_MESSAGE_CONTENT,
						messageId: d.messageId,
						delta: "",
						...t.metadata !== void 0 && { metadata: t.metadata },
						...t.rawEvent !== void 0 && { rawEvent: t.rawEvent },
						...e !== void 0 && { subagentRunId: e }
					}), u = !0;
				}
				return Gf(l, a, u, "TEXT_MESSAGE_CHUNK"), l;
			}
			case _.TOOL_CALL_CHUNK: {
				let t = e, a = Uf(e, Vf), o = s("tool", t.toolCallId, t.subagentRunId ?? void 0, "TOOL_CALL_CHUNK", "tool call"), c = r.get(o), l = [], u = !1, d;
				if (c?.kind === "tool" && (t.toolCallId === void 0 || t.toolCallId === c.fields.toolCallId)) If("tool call", c.fields.toolCallId, "toolCallName", t.toolCallName, c.fields.toolCallName), If("tool call", c.fields.toolCallId, "parentMessageId", t.parentMessageId, c.fields.parentMessageId), d = c.fields;
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
					let e = Lf({
						type: _.TOOL_CALL_START,
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
					let e = t.subagentRunId === void 0 ? d.subagentRunId : t.subagentRunId, r = Rf({
						...a,
						type: _.TOOL_CALL_ARGS,
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
						type: _.TOOL_CALL_ARGS,
						toolCallId: d.toolCallId,
						delta: "",
						...t.metadata !== void 0 && { metadata: t.metadata },
						...t.rawEvent !== void 0 && { rawEvent: t.rawEvent },
						...e !== void 0 && { subagentRunId: e }
					}), u = !0;
				}
				return Gf(l, a, u, "TOOL_CALL_CHUNK"), l;
			}
			case _.REASONING_MESSAGE_CHUNK: {
				let t = e, a = Uf(e, Hf), o = s("reasoning", t.messageId, t.subagentRunId ?? void 0, "REASONING_MESSAGE_CHUNK", "reasoning message"), c = r.get(o), l = [], u = !1, d;
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
					let e = Lf({
						type: _.REASONING_MESSAGE_START,
						messageId: t.messageId,
						role: "reasoning",
						...t.subagentRunId !== void 0 && { subagentRunId: t.subagentRunId }
					}, t);
					l.push(e), n?.event("TRANSFORM", "REASONING_MESSAGE_START", e, { messageId: t.messageId });
				}
				if (t.delta !== void 0 || t.rawEvent !== void 0) {
					let e = t.subagentRunId === void 0 ? d.subagentRunId : t.subagentRunId, r = Rf({
						...a,
						type: _.REASONING_MESSAGE_CONTENT,
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
						type: _.REASONING_MESSAGE_CONTENT,
						messageId: d.messageId,
						delta: "",
						...t.metadata !== void 0 && { metadata: t.metadata },
						...t.rawEvent !== void 0 && { rawEvent: t.rawEvent },
						...e !== void 0 && { subagentRunId: e }
					}), u = !0;
				}
				return Gf(l, a, u, "REASONING_MESSAGE_CHUNK"), l;
			}
		}
		return e.type, [e];
	}), _i(() => {
		a();
	}));
}, qf = Symbol("agui.strip.drop");
function Jf(e) {
	let t = e;
	for (;;) if (t instanceof Id || t instanceof Rd || t instanceof Bd || t instanceof Xd || t instanceof Kd) t = t.unwrap();
	else if (t instanceof Jd) t = t.def.in;
	else if (t instanceof Qd) t = t.def.getter();
	else return t;
}
function Yf(e) {
	let t = e.def;
	return typeof t?.discriminator == "string" ? t.discriminator : void 0;
}
function Xf(e) {
	let t = e, n = Array.isArray(t.def?.values) ? t.def.values : t.values ? Array.from(t.values) : void 0;
	return n && n.length === 1 ? n[0] : t.value;
}
function Zf(e) {
	let t = Jf(e);
	return t instanceof Nd ? Xf(t) : void 0;
}
function Qf(e, t, n, r) {
	let i = Jf(t);
	if (i instanceof Td) {
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
			let c = r.length, l = Qf(a[e], i, `${n}/${e}`, r);
			if (l === qf) {
				if (r.length = c, i.safeParse(void 0).success) {
					r.push(`${n}/${e}`);
					continue;
				}
				return qf;
			}
			o[e] = l;
		}
		return o;
	}
	if (i instanceof Cd) {
		if (!Array.isArray(e)) return e;
		let t = i.element, a = [];
		return e.forEach((e, i) => {
			let o = r.length, s = Qf(e, t, `${n}/${i}`, r);
			s === qf ? (r.length = o, r.push(`${n}/${i}`)) : a.push(s);
		}), a;
	}
	if (i instanceof Ad) {
		if (typeof e != "object" || !e || Array.isArray(e)) return e;
		let t = i.def.valueType, a = e, o = {};
		for (let e of Object.keys(a)) {
			let i = r.length, s = Qf(a[e], t, `${n}/${e}`, r);
			s === qf ? (r.length = i, r.push(`${n}/${e}`)) : o[e] = s;
		}
		return o;
	}
	if (i instanceof Ed) {
		let t = i.options, a = Yf(i);
		if (a !== void 0) {
			if (typeof e != "object" || !e || Array.isArray(e)) return e;
			let i = e[a];
			for (let o of t) {
				let t = Jf(o);
				if (!(t instanceof Td)) continue;
				let s = t.shape;
				if (Zf(s[a]) === i) return Qf(e, o, n, r);
			}
			return qf;
		}
		let o = t.filter((e) => Jf(e) instanceof Td), s = typeof e == "object" && !!e && !Array.isArray(e);
		if (o.length > 1 && s) return e;
		for (let i of t) {
			let t = Jf(i);
			if (t instanceof Cd && Array.isArray(e) || t instanceof Td && s) return Qf(e, i, n, r);
		}
		return e;
	}
	return e;
}
function $f(e, t) {
	let n = [], r = Qf(e, t, "", n);
	if (r === qf) throw Error("Internal error: the stripper found the whole value unrecognisable, which the schemas are not supposed to allow — schema/stripper mismatch.");
	return {
		value: r,
		stripped: n
	};
}
var ep = new Set(Object.values(_));
function tp(e) {
	return ep.has(e.type);
}
var np = new Map(Za.options.map((e) => {
	let t = e.shape;
	return [String(Xf(t.type)), e];
})), rp = () => typeof process < "u" && process.env !== void 0 && !!process.env.SUPPRESS_TRANSFORMATION_WARNINGS;
function ip(e) {
	rp() || console.warn(`[ag-ui][enforce] ${e}`);
}
var ap = (e) => (t) => {
	let n = ff(e);
	return t.pipe(Jr((e) => {
		if (!tp(e)) return ip(`Dropping unrecognised event '${String(e.type)}': no middleware translated it and the protocol does not describe it.`), n?.event("ENFORCE", "Unrecognised event dropped:", e, { type: e.type }), Un;
		let t = np.get(e.type);
		if (t === void 0) throw Error(`No validator for recognised event type '${String(e.type)}'`);
		let { value: r, stripped: i } = $f(e, t);
		for (let t of i) ip(`Removed unrecognised material at '${t}' on ${String(e.type)}. Nothing handled it; see the repo-root DEPRECATIONS.md if it is a retired shape.`);
		return y(t.parse(r));
	}));
};
function op(e) {
	let { value: t, stripped: n } = $f(Pe(e, "RunAgentInput"), Ta);
	for (let e of n) ip(`Removed unrecognised material at '${e}' from the outgoing input.`);
	return Ta.parse(t);
}
var sp = class {
	runNext(e, t) {
		return t.run(e).pipe(Kf(!1));
	}
	runNextWithState(e, t) {
		let n = P(e.messages || []), r = P(e.state === void 0 ? {} : e.state), i = new Tn();
		return _f(e, i, t, []).subscribe({
			next: (e) => {
				e.messages !== void 0 && (n = e.messages), e.state !== void 0 && (r = e.state);
			},
			error: () => {}
		}), this.runNext(e, t).pipe(ii(async (e) => (i.next(e), await new Promise((e) => setTimeout(e, 0)), {
			event: e,
			messages: P(n),
			state: P(r)
		})));
	}
}, cp = class extends sp {
	constructor(e) {
		super(), this.fn = e;
	}
	run(e, t) {
		return this.fn(e, t);
	}
};
function lp(e) {
	return e.startsWith("image/") ? "image" : e.startsWith("audio/") ? "audio" : e.startsWith("video/") ? "video" : "document";
}
function up(e) {
	return typeof e == "object" && !!e && "type" in e && e.type === "binary" && "mimeType" in e && typeof e.mimeType == "string";
}
function dp(e) {
	let t = lp(e.mimeType);
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
function fp(e, t, n) {
	if (typeof e != "object" || !e || !("type" in e) || e.type !== t.type || !("source" in e)) return !1;
	let r = e.source;
	return typeof r != "object" || !r || !("type" in r) || r.type !== t.source.type || !("value" in r) || r.value !== t.source.value || !("mimeType" in r) || r.mimeType !== t.source.mimeType ? !1 : !n || "metadata" in e && typeof e.metadata == "object" && e.metadata !== null && "filename" in e.metadata && e.metadata.filename === n;
}
function pp(e) {
	let t = e.content;
	if (!Array.isArray(t)) return e;
	let n = t.flatMap((e) => {
		if (up(e)) {
			let n = dp(e);
			return n.type !== "binary" && t.some((t) => fp(t, n, e.filename)) ? [] : [n];
		}
		return [e];
	});
	return {
		...e,
		content: n
	};
}
var mp = "THINKING_START", hp = "THINKING_END", gp = "THINKING_TEXT_MESSAGE_START", _p = "THINKING_TEXT_MESSAGE_CONTENT", vp = "THINKING_TEXT_MESSAGE_END";
function yp(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
var bp = {
	event: ["rawEvent", "subagentRunId"],
	[_.RUN_STARTED]: ["parentRunId", "input"],
	[_.RUN_FINISHED]: ["result", "outcome"],
	[_.RUN_ERROR]: ["usage"],
	[_.SUBAGENT_FINISHED]: ["result"],
	[_.TOOL_CALL_START]: ["parentMessageId"],
	[_.TOOL_CALL_CHUNK]: ["parentMessageId"],
	[_.TOOL_CALL_RESULT]: ["role"],
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
}, xp = new Map(Object.entries(bp).filter(([e]) => Object.values(_).includes(e))), Sp = (e) => vf(e, "an absent field");
function Cp(e, t, n, r) {
	if (!yp(e)) return e;
	let i;
	for (let a of t) e[a] === null && (r(n === void 0 ? `${a}: null` : `${n}.${a}: null`), i ??= { ...e }, delete i[a]);
	return i ?? e;
}
function wp(e, t, n) {
	if (!yp(e) || !Array.isArray(e[t])) return e;
	let r = e[t], i = r.map(n);
	return i.some((e, t) => e !== r[t]) ? {
		...e,
		[t]: i
	} : e;
}
function Tp(e, t) {
	return wp(e, "content", (e) => {
		if (!yp(e)) return e;
		switch (e.type) {
			case "image":
			case "audio":
			case "video":
			case "document": return Cp(e, bp["input content"], `${e.type} input content`, t);
			default: return e;
		}
	});
}
function Ep(e, t = Sp) {
	let n = Cp(e, bp.RunAgentInput, "RunAgentInput", t);
	return n = wp(n, "tools", (e) => Cp(e, bp.Tool, "Tool", t)), n = wp(n, "resume", (e) => Cp(e, bp.ResumeEntry, "ResumeEntry", t)), wp(n, "messages", (e) => Tp(e, t));
}
var Dp = class extends sp {
	constructor(...e) {
		super(...e), this.currentReasoningId = null, this.currentMessageId = null, this.nullsNoticedThisRun = /* @__PURE__ */ new Set(), this.noticeNullOncePerRun = (e) => {
			this.nullsNoticedThisRun.has(e) || (this.nullsNoticedThisRun.add(e), vf(e, "an absent field"));
		};
	}
	warn(e, t) {
		vf(e, t);
	}
	mintedContinuationId(e, t) {
		if (t !== null) return t;
		let n = of();
		return this.warnAside(`Minting a messageId ('${n}') for ${e}: no THINKING opener preceded it, so there was no id to continue. The id is this client's invention, not the producer's, and verification will reject the translated event for naming something nothing opened.`), n;
	}
	warnAside(e) {
		typeof process < "u" && process.env !== void 0 && process.env.SUPPRESS_TRANSFORMATION_WARNINGS || console.warn(`[ag-ui][compat] ${e} Set SUPPRESS_TRANSFORMATION_WARNINGS=true to silence.`);
	}
	run(e, t) {
		return this.currentReasoningId = null, this.currentMessageId = null, this.nullsNoticedThisRun.clear(), e.messages = e.messages.map(pp), t.run(e).pipe(x((e) => this.transformEvent(e)));
	}
	transformEvent(e) {
		let t = this.noticeNullOncePerRun;
		e.type === _.RUN_STARTED && this.nullsNoticedThisRun.clear(), e = Cp(e, bp.event, void 0, t);
		let n = xp.get(e.type);
		switch (n && (e = Cp(e, n, e.type, t)), e.type) {
			case mp: {
				this.currentReasoningId = of();
				let { title: t, ...n } = e;
				return this.warn(mp, _.REASONING_START), t !== void 0 && this.warnAside(`Dropping ${mp}.title ${JSON.stringify(t)}: ${_.REASONING_START} has no title field, so the span's label cannot be carried and nothing downstream can recover it.`), {
					...n,
					type: _.REASONING_START,
					messageId: this.currentReasoningId
				};
			}
			case gp: return this.currentMessageId = of(), this.warn(gp, _.REASONING_MESSAGE_START), {
				...e,
				type: _.REASONING_MESSAGE_START,
				messageId: this.currentMessageId,
				role: "reasoning"
			};
			case _p: {
				let { delta: t, ...n } = e;
				return this.warn(_p, _.REASONING_MESSAGE_CONTENT), {
					...n,
					type: _.REASONING_MESSAGE_CONTENT,
					messageId: this.mintedContinuationId(_p, this.currentMessageId),
					delta: t
				};
			}
			case vp: {
				let t = this.mintedContinuationId(vp, this.currentMessageId);
				return this.currentMessageId = null, this.warn(vp, _.REASONING_MESSAGE_END), {
					...e,
					type: _.REASONING_MESSAGE_END,
					messageId: t
				};
			}
			case hp: {
				let t = this.mintedContinuationId(hp, this.currentReasoningId);
				return this.currentReasoningId = null, this.warn(hp, _.REASONING_END), {
					...e,
					type: _.REASONING_END,
					messageId: t
				};
			}
			case _.RUN_FINISHED: {
				let n = e, r = Cp(n.outcome, bp["RUN_FINISHED.outcome"], "RUN_FINISHED.outcome", t);
				return wp(r === n.outcome ? n : {
					...n,
					outcome: r
				}, "usage", (e) => Cp(e, bp["RUN_FINISHED.usage[]"], "RUN_FINISHED.usage[]", t));
			}
			case _.MESSAGES_SNAPSHOT: {
				let t = e;
				return Array.isArray(t.messages) ? {
					...t,
					messages: t.messages.map((e) => this.upgradeInboundMessage(e))
				} : e;
			}
			case _.RUN_STARTED: {
				let n = Ep(e.input, t), r = n === e.input ? e : {
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
		e = Tp(e, this.noticeNullOncePerRun);
		let t = e.content;
		return !Array.isArray(t) || !t.some((e) => typeof e == "object" && !!e && e.type === "binary") ? e : (this.warn("binary input content", "the modern media content parts"), pp(e));
	}
}, Op = () => (e) => S(() => {
	let t = new Dp();
	return e.pipe(x((e) => t.transformEvent(e)));
});
function kp(e, t = /* @__PURE__ */ new Date()) {
	return e.expiresAt !== void 0 && new Date(e.expiresAt) <= t;
}
function Ap() {
	return typeof process < "u" && process.env !== void 0 && !!process.env.SUPPRESS_TRANSFORMATION_WARNINGS;
}
function jp(e) {
	Ap() || console.warn(`[ag-ui][compat] Flattening message content for a <=0.0.39 peer DROPS non-text parts (${e.join(", ")}). The peer cannot receive them; upgrade it to keep media content. See the repo-root DEPRECATIONS.md.`);
}
function Mp(e) {
	Ap() || console.warn(`[ag-ui][compat] Not flattening message content for a <=0.0.39 peer: ${e} content part(s) claim type "text" but carry a malformed 'text' value. That is a defect in the message, not media the peer cannot represent, and a downgrade must not repair it — the content is passed on unchanged so the outgoing enforcement boundary reports it. See the repo-root DEPRECATIONS.md.`);
}
function Np(e) {
	let t = e.content;
	if (Array.isArray(t)) {
		let n = (e) => typeof e == "object" && !!e && "type" in e && e.type === "text", r = (e) => n(e) && typeof e.text == "string", i = t.filter((e) => n(e) && !r(e));
		if (i.length > 0) return Mp(i.length), e;
		let a = t.filter((e) => !r(e)).map((e) => typeof e == "object" && e && "type" in e ? String(e.type) : typeof e);
		a.length > 0 && jp(a);
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
var Pp = class extends sp {
	run(e, t) {
		let { parentRunId: n, ...r } = e, i = {
			...r,
			messages: r.messages.map(Np)
		};
		return this.runNext(i, t);
	}
}, Fp = "THINKING_START", Ip = "THINKING_END", Lp = "THINKING_TEXT_MESSAGE_START", Rp = "THINKING_TEXT_MESSAGE_CONTENT", zp = "THINKING_TEXT_MESSAGE_END", Bp = class extends sp {
	constructor(...e) {
		super(...e), this.currentReasoningId = null, this.currentMessageId = null;
	}
	warnAboutTransformation(e, t) {
		typeof process < "u" && process.env !== void 0 && process.env.SUPPRESS_TRANSFORMATION_WARNINGS || console.warn(`AG-UI is converting ${e} to ${t}. To remove this warning, upgrade your AG-UI integration package (e.g. @ag-ui/langgraph). To surpress it, set SUPPRESS_TRANSFORMATION_WARNINGS=true in your .env file.`);
	}
	run(e, t) {
		return this.currentReasoningId = null, this.currentMessageId = null, this.runNext(e, t).pipe(x((e) => this.transformEvent(e)));
	}
	transformEvent(e) {
		switch (e.type) {
			case Fp: {
				this.currentReasoningId = of();
				let { title: t, ...n } = e;
				return this.warnAboutTransformation(Fp, _.REASONING_START), {
					...n,
					type: _.REASONING_START,
					messageId: this.currentReasoningId
				};
			}
			case Lp: return this.currentMessageId = of(), this.warnAboutTransformation(Lp, _.REASONING_MESSAGE_START), {
				...e,
				type: _.REASONING_MESSAGE_START,
				messageId: this.currentMessageId,
				role: "reasoning"
			};
			case Rp: {
				let { delta: t, ...n } = e;
				return this.warnAboutTransformation(Rp, _.REASONING_MESSAGE_CONTENT), {
					...n,
					type: _.REASONING_MESSAGE_CONTENT,
					messageId: this.currentMessageId ?? of(),
					delta: t
				};
			}
			case zp: {
				let t = this.currentMessageId ?? of();
				return this.warnAboutTransformation(zp, _.REASONING_MESSAGE_END), {
					...e,
					type: _.REASONING_MESSAGE_END,
					messageId: t
				};
			}
			case Ip: {
				let t = this.currentReasoningId ?? of();
				return this.warnAboutTransformation(Ip, _.REASONING_END), {
					...e,
					type: _.REASONING_END,
					messageId: t
				};
			}
			default: return e;
		}
	}
}, Vp = "SUBAGENT_STARTED", Hp = "SUBAGENT_FINISHED", Up = "SUBAGENT_ERROR";
function Wp(e) {
	if (e && typeof e == "object" && "subagentRunId" in e) {
		let { subagentRunId: t, ...n } = e;
		return n;
	}
	return e;
}
function Gp(e) {
	return e.map((e) => Wp(e));
}
var Kp = class extends sp {
	warnDroppedLifecycleEvent(e) {
		typeof process < "u" && process.env !== void 0 && process.env.SUPPRESS_TRANSFORMATION_WARNINGS || console.warn(`AG-UI is dropping ${e} because the target agent predates subagent support. To remove this warning, upgrade your AG-UI integration package. To suppress it, set SUPPRESS_TRANSFORMATION_WARNINGS=true in your .env file.`);
	}
	run(e, t) {
		let n = {
			...e,
			messages: (e.messages ?? []).map((e) => Wp(e))
		};
		return this.runNext(n, t).pipe(wi((e) => {
			let t = e.type;
			(t === Vp || t === Hp || t === Up) && this.warnDroppedLifecycleEvent(t);
		}), ti((e) => {
			let t = e.type;
			return t !== Vp && t !== Hp && t !== Up;
		}), x((e) => {
			let t = Wp(e);
			if (t.type === _.MESSAGES_SNAPSHOT) {
				let e = t;
				if (Array.isArray(e.messages)) return {
					...e,
					messages: Gp(e.messages)
				};
			}
			if (t.type === _.RUN_FINISHED) {
				let e = t;
				if (e.outcome && Array.isArray(e.outcome.interrupts)) return {
					...e,
					outcome: {
						...e.outcome,
						interrupts: e.outcome.interrupts.map((e) => Wp(e))
					}
				};
			}
			if (t.type === _.RUN_STARTED) {
				let e = t;
				if (e.input && Array.isArray(e.input.messages)) return {
					...e,
					input: {
						...e.input,
						messages: Gp(e.input.messages)
					}
				};
			}
			return t;
		}));
	}
}, qp = "1.0.2", Jp = !1, Yp = /* @__PURE__ */ new WeakSet(), Xp = (e, t) => /^\d+\.\d+$/.test(e) ? Dl(e, t) > 0 ? "newer" : "not-newer" : "uninterpretable", Zp = (e) => {
	let t = e.protocolVersion;
	if (t !== void 0 && t !== "1.0") switch (Xp(t, "1.0")) {
		case "uninterpretable":
			console.warn(`[ag-ui] The producer declared protocol version '${t}', which this client cannot interpret.`);
			return;
		case "newer":
			console.warn(`[ag-ui] The producer speaks protocol ${t}; this client speaks 1.0. Unrecognised material will be stripped with warnings.`);
			return;
		case "not-newer": return;
	}
}, Qp = class e {
	resolvePeerCeiling(t) {
		if (this.resolvingPeerCeiling) return qp;
		let n = Object.getOwnPropertyDescriptor(this, "maxVersion"), r = Object.getOwnPropertyDescriptor(this, "maxProtocolVersion"), i = Object.getPrototypeOf(this);
		for (; i && i !== e.prototype;) n ??= Object.getOwnPropertyDescriptor(i, "maxVersion"), r ??= Object.getOwnPropertyDescriptor(i, "maxProtocolVersion"), i = Object.getPrototypeOf(i);
		if (t === "maxVersion" && n) return qp;
		let a = t === "maxProtocolVersion" ? n : r;
		if (!a) return qp;
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
		return !this.resolvingPeerCeiling && !Jp && (Jp = !0, console.warn("[ag-ui] AbstractAgent.maxVersion is deprecated — use maxProtocolVersion. Same value; the new name says whose version it is and that it is a ceiling.")), this.resolvePeerCeiling("maxVersion");
	}
	get debug() {
		return this._debug;
	}
	set debug(e) {
		this._debug = df(e), this._debugLogger = mf(this._debug);
	}
	get debugLogger() {
		return this._debugLogger;
	}
	set debugLogger(e) {
		this._debugLogger = typeof e == "boolean" ? e ? mf(df(!0)) : void 0 : e;
	}
	resolvedCeilingDuringConstruction() {
		let e = this.maxProtocolVersion;
		if (typeof e != "string" || !Ol(e)) throw new v(`maxProtocolVersion resolved to ${JSON.stringify(e)} during construction, which is not a version this client can compare. A ceiling read from an instance field is not available yet — return a literal from the getter.`);
		return e;
	}
	constructor({ agentId: e, description: t, threadId: n, initialMessages: i, initialState: a, debug: o } = {}) {
		this.subscribers = [], this.isRunning = !1, this.pendingInterrupts = [], this.middlewares = [], this.resolvingPeerCeiling = !1, this.agentId = e, this.description = t ?? "", this.threadId = n ?? r(), this.messages = P(i ?? []), this.state = P(a ?? {}), this._debug = df(o), this._debugLogger = mf(this._debug);
		let s = this.resolvedCeilingDuringConstruction();
		Dl(s, "0.0.39") <= 0 && this.middlewares.unshift(new Pp()), Dl(s, "0.0.45") <= 0 && this.middlewares.unshift(new Bp()), Dl(s, "0.0.57") <= 0 && this.middlewares.unshift(new Kp());
	}
	subscribe(e) {
		return this.subscribers.push(e), { unsubscribe: () => {
			this.subscribers = this.subscribers.filter((t) => t !== e);
		} };
	}
	use(...e) {
		let t = e.map((e) => typeof e == "function" ? new cp(e) : e);
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
					onRunStartedEvent: ({ event: e }) => Zp(e),
					onRunFinishedEvent: (e) => {
						e.outcome === "success" && (i = e.result);
					}
				},
				...this.subscribers,
				t ?? {}
			];
			Yp.add(n), await this.onInitialize(n, o), this.activeRunDetach$ = new xn();
			let s;
			this.activeRunCompletionPromise = new Promise((e) => {
				s = e;
			}), await Or(un(() => [...this.middlewares, new Dp()].reduceRight((e, t) => ({
				run: (n) => t.run(n, e),
				get messages() {
					return e.messages;
				},
				get state() {
					return e.state;
				}
			}), this).run(n), ap(this.debugLogger), Kf(this.debugLogger), yf(this.debugLogger), (e) => e.pipe(Ci(this.activeRunDetach$)), (e) => this.applyBeforeSourceError(n, e, o), ni((e) => (this.debugLogger?.lifecycle("LIFECYCLE", "Run errored:", {
				agentId: this.agentId,
				error: e instanceof Error ? e.message : String(e)
			}), this.isRunning = !1, this.onError(n, e, o))), _i(() => {
				this.debugLogger?.lifecycle("LIFECYCLE", "Run finished:", {
					agentId: this.agentId,
					threadId: this.threadId
				}), this.isRunning = !1, this.onFinalize(n, o), s?.(), s = void 0, this.activeRunCompletionPromise = void 0, this.activeRunDetach$ = void 0;
			}))(y(null)));
			let c = P(this.messages).filter((e) => !a.has(e.id));
			return {
				result: i,
				newMessages: c
			};
		} finally {
			this.isRunning = !1;
		}
	}
	connect(e) {
		throw new Fe();
	}
	async connectAgent(e, t) {
		try {
			this.isRunning = !0, this.agentId = this.agentId ?? r();
			let n = this.prepareRunAgentInput(e), i, a = new Set(this.messages.map((e) => e.id)), o = [
				{
					onRunStartedEvent: ({ event: e }) => Zp(e),
					onRunFinishedEvent: (e) => {
						e.outcome === "success" && (i = e.result);
					}
				},
				...this.subscribers,
				t ?? {}
			];
			await this.onInitialize(n, o), this.activeRunDetach$ = new xn();
			let s;
			this.activeRunCompletionPromise = new Promise((e) => {
				s = e;
			}), await Or(un(() => S(() => this.connect(n)), (e) => ap(this.debugLogger)(Op()(e)), Kf(this.debugLogger), yf(this.debugLogger), (e) => e.pipe(Ci(this.activeRunDetach$)), (e) => this.applyBeforeSourceError(n, e, o), ni((e) => (this.isRunning = !1, e instanceof Fe ? Un : this.onError(n, e, o))), _i(() => {
				this.isRunning = !1, this.onFinalize(n, o), s?.(), s = void 0, this.activeRunCompletionPromise = void 0, this.activeRunDetach$ = void 0;
			}))(y(null)), { defaultValue: void 0 });
			let c = P(this.messages).filter((e) => !a.has(e.id));
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
		return S(() => {
			let r, i = t.pipe(ni((e) => (r = { error: e }, Un)));
			return this.processApplyEvents(e, this.apply(e, i, n), n).pipe(oi(S(() => {
				let e = r;
				return e ? b(() => e.error) : Un;
			})));
		});
	}
	apply(e, t, n) {
		return _f(e, t, this, n, this.debugLogger);
	}
	processApplyEvents(e, t, n) {
		return t.pipe(wi((t) => {
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
		let t = P(this.messages);
		for (let e of t) e.subagentRunId === null && delete e.subagentRunId;
		let n = t.filter((e) => e.role !== "activity");
		return {
			threadId: this.threadId,
			runId: e?.runId || r(),
			...Dl(this.maxProtocolVersion, qp) >= 0 && { protocolVersion: "1.0" },
			tools: P(e?.tools ?? []),
			context: P(e?.context ?? []),
			forwardedProps: P(e?.forwardedProps ?? {}),
			state: P(this.state),
			messages: n,
			...e?.resume === void 0 ? {} : { resume: P(e.resume) }
		};
	}
	async onInitialize(e, t) {
		if (Yp.has(e) && this.pendingInterrupts.length > 0) {
			let t = new Set((e.resume ?? []).map((e) => e.interruptId)), n = this.pendingInterrupts.map((e) => e.id).filter((e) => !t.has(e));
			if (n.length > 0) throw new v(`Thread has ${n.length} pending interrupt(s) not addressed by resume: ${n.join(", ")}`);
			for (let t of this.pendingInterrupts) if (kp(t) && (e.resume ?? []).find((e) => e.interruptId === t.id)?.status !== "cancelled") throw new v(`Interrupt ${t.id} expired at ${t.expiresAt} and can no longer be answered. Cancel it to continue the thread.`);
		}
		let n = await F(t, this.messages, this.state, (t, n, r) => t.onRunInitialized?.({
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
		return Cr(F(n, this.messages, this.state, (n, r, i) => n.onRunFailed?.({
			error: t,
			messages: r,
			state: i,
			agent: this,
			input: e
		}))).pipe(x((r) => {
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
		let n = await F(t, this.messages, this.state, (t, n, r) => t.onRunFinalized?.({
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
		return e.agentId = this.agentId, e.description = this.description, e.threadId = this.threadId, e.messages = P(this.messages), e.state = P(this.state), e._debug = this._debug, e._debugLogger = this._debugLogger, e.isRunning = this.isRunning, e.subscribers = [...this.subscribers], e.middlewares = [...this.middlewares], e.pendingInterrupts = P(this.pendingInterrupts), e;
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
		this.messages = P(e), (async () => {
			for (let e of this.subscribers) await e.onMessagesChanged?.({
				messages: this.messages,
				state: this.state,
				agent: this
			});
		})();
	}
	setState(e) {
		this.state = P(e), (async () => {
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
		return [...this.middlewares, new Dp()].reduceRight((e, t) => ({
			run: (n) => t.run(n, e),
			get messages() {
				return e.messages;
			},
			get state() {
				return e.state;
			}
		}), this).run(t).pipe(ap(this.debugLogger), Kf(this.debugLogger), yf(this.debugLogger), Mf(this.threadId, t.runId, this.agentId), (e) => e.pipe(x((e) => (this.debugLogger?.event("LEGACY", "Event:", e, { type: e.type }), e))));
	}
};
function $p(e) {
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
var em = class extends Qp {
	requestInit(e) {
		return {
			method: "POST",
			headers: {
				...this.headers,
				"Content-Type": "application/json",
				Accept: "text/event-stream"
			},
			body: JSON.stringify($p(e)),
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
		super(e), this.abortController = new AbortController(), this.url = e.url, this.headers = P(e.headers ?? {}), this.fetch = e.fetch ?? ((e, t) => fetch(e, t));
	}
	run(e) {
		return Df(xf(() => this.fetch(this.url, this.requestInit(op(e)))), this.debugLogger);
	}
	clone() {
		let e = super.clone();
		e.url = this.url, e.headers = P(this.headers ?? {}), e.fetch = this.fetch;
		let t = new AbortController(), n = this.abortController.signal;
		return n.aborted && t.abort(n.reason), e.abortController = t, e;
	}
};
// node_modules/@copilotkit/shared/dist/utils/dashboard-url.mjs
function tm(e) {
	let t = [
		"localhost",
		"127.0.0.1",
		"[::1]"
	].includes(e.hostname) || /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+localhost$/u.test(e.hostname);
	return !e.username && !e.password && (e.protocol === "https:" || e.protocol === "http:" && t);
}
// node_modules/@copilotkit/shared/dist/utils/inspector-metadata.mjs
function nm(e) {
	if (typeof e != "object" || !e || Array.isArray(e)) return !1;
	try {
		let t = Object.getPrototypeOf(e);
		return t === Object.prototype || t === null;
	} catch {
		return !1;
	}
}
function rm(e, t) {
	try {
		let n = Object.getOwnPropertyDescriptor(e, t);
		return n !== void 0 && "value" in n ? n.value : void 0;
	} catch {
		return;
	}
}
function im(e) {
	if (typeof e != "string") return;
	let t = e.trim();
	return t.length > 0 ? t : void 0;
}
function am(e) {
	if (!nm(e)) return;
	let t = im(e.organizationName), n = im(e.projectName);
	if (t !== void 0 && n !== void 0) return {
		organizationName: t,
		projectName: n
	};
}
function om(e) {
	if (!nm(e)) return;
	let t = im(e.code), n = im(e.label);
	if (t !== void 0 && n !== void 0) return {
		code: t,
		label: n
	};
}
function sm(e) {
	if (nm(e)) switch (e.state) {
		case "valid":
		case "none":
		case "expired":
		case "unknown": return { state: e.state };
		default: return;
	}
}
function cm(e) {
	switch (e) {
		case "manage_plan":
		case "renew":
		case "enable_intelligence": return e;
		default: return;
	}
}
function lm(e) {
	let t = im(e);
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
	if (!(a.hostname.length === 0 || a.username || a.password)) return tm(a) ? t : void 0;
}
function um(e) {
	if (!nm(e)) return;
	let t = cm(e.kind), n = lm(e.url);
	if (t !== void 0 && n !== void 0) return {
		kind: t,
		url: n
	};
}
function dm(e) {
	return typeof e == "number" && Number.isSafeInteger(e) && e >= 0;
}
function fm(e) {
	if (nm(e)) {
		if (e.kind === "finite") return typeof e.value != "number" || !Number.isSafeInteger(e.value) || e.value < 1 ? void 0 : {
			kind: "finite",
			value: e.value
		};
		if (e.kind === "unlimited") return { kind: "unlimited" };
		if (e.kind === "unknown") return { kind: "unknown" };
	}
}
function pm(e) {
	if (!nm(e)) return;
	let t = fm(e.limit), n = e.used;
	if (!dm(n) || t === void 0) return;
	let r = rm(e, "expiringSoonCount"), i = dm(r) ? r : void 0;
	return {
		used: n,
		limit: t,
		...i === void 0 ? {} : { expiringSoonCount: i }
	};
}
function mm(e) {
	if (!nm(e) || e.schemaVersion !== 1) return;
	let t = am(e.identity), n = om(e.plan), r = sm(e.license), i = um(e.action), a = pm(e.usage);
	return {
		schemaVersion: 1,
		...t === void 0 ? {} : { identity: t },
		...n === void 0 ? {} : { plan: n },
		...r === void 0 ? {} : { license: r },
		...i === void 0 ? {} : { action: i },
		...a === void 0 ? {} : { usage: a }
	};
}
// node_modules/partial-json/dist/options.js
var hm = /* @__PURE__ */ n(((e) => {
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
})), gm = /* @__PURE__ */ e((/* @__PURE__ */ n(((e, t, n) => {
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
	var a = hm();
	Object.defineProperty(e, "Allow", {
		enumerable: !0,
		get: function() {
			return a.Allow;
		}
	}), i(hm(), e);
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
})))(), 1), _m = gm.Allow.ALL & ~gm.Allow.NUM;
function vm(e) {
	try {
		let t = gm.parse(e, _m);
		return t && typeof t == "object" && !Array.isArray(t) ? t : {};
	} catch {
		return {};
	}
}
function ym(e, t) {
	return (n) => Math.min(e * 2 ** (n - 1), t);
}
// node_modules/@copilotkit/shared/dist/constants/index.mjs
var bm = "https://api.cloud.copilotkit.ai", xm = "X-CopilotCloud-Public-Api-Key", Sm = "default", Cm = {
	enabled: !1,
	events: !1,
	lifecycle: !1,
	verbose: !1
};
function wm(e) {
	if (!e) return Cm;
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
// node_modules/@copilotkit/shared/dist/standard-schema.mjs
function Tm(e) {
	let t = e["~standard"];
	return typeof t == "object" && !!t && "jsonSchema" in t && t.jsonSchema != null && typeof t.jsonSchema == "object" && "input" in t.jsonSchema && typeof t.jsonSchema.input == "function";
}
function Em(e, t) {
	if (Tm(e)) return e["~standard"].jsonSchema.input({ target: "draft-07" });
	if (typeof e.toJSONSchema == "function") return e.toJSONSchema();
	let n = e["~standard"].vendor;
	if (n === "zod" && t?.zodToJsonSchema) return t.zodToJsonSchema(e, { $refStrategy: "none" });
	throw Error(`Cannot convert schema to JSON Schema. The schema (vendor: "${n}") does not implement Standard JSON Schema V1 and no zodToJsonSchema fallback is available. Use a library that supports Standard JSON Schema (e.g., Zod 3.24+, Valibot v1+, ArkType v2+) or pass a zodToJsonSchema function in options.`);
}
// node_modules/@copilotkit/shared/dist/logger.mjs
var Dm = console, Om = /* @__PURE__ */ new Set(["RUN_STARTED", "RUN_FINISHED"]);
function km(e) {
	let t = e, n = Om.has(t.type);
	if (!("thread_id" in t) && !("run_id" in t) && (n || !("threadId" in t) && !("runId" in t))) return e;
	let { thread_id: r, run_id: i, ...a } = t;
	return n || (delete a.threadId, delete a.runId), a;
}
// node_modules/@copilotkit/shared/dist/generative-ui/is-record.mjs
function Am(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
var jm = "common_types.json#/$defs/ChildList";
function Mm(e) {
	let t = e.$ref;
	if (t === "common_types.json#/$defs/ComponentId") return "single";
	if (t === "common_types.json#/$defs/ChildList") return "multiple";
}
function Nm(e) {
	let t = (e, t, n) => {
		if (typeof e != "string" || !e.startsWith(t)) return;
		let r = e.slice(t.length).trim();
		return r === "" ? { $ref: n } : {
			$ref: n,
			description: r
		};
	}, n = (e) => Array.isArray(e) ? e.map(n) : Am(e) ? (t(e.description, "@a2ui/ComponentId", "common_types.json#/$defs/ComponentId") ?? t(e.description, "@a2ui/ChildList", "common_types.json#/$defs/ChildList")) || Object.fromEntries(Object.entries(e).map(([e, t]) => [e, n(t)])) : e;
	return n(e);
}
function Pm(e) {
	let t = [], n = /* @__PURE__ */ new Set(), r = (e, r) => {
		let i = e.join("\0");
		n.has(i) || (n.add(i), t.push({
			path: e,
			kind: r
		}));
	}, i = (e, t) => {
		if (!Am(e)) return;
		let n = Mm(e);
		if (n) return r(t, n);
		for (let n of [e.anyOf, e.oneOf]) {
			if (!Array.isArray(n) || n.length === 0) continue;
			let e = n.map((e) => Am(e) ? Mm(e) : void 0), [i] = e;
			if (i && e.every((e) => e === i)) r(t, i);
			else if (e.every((e) => e === void 0)) {
				let e = n.map((e) => Pm(e)), i = (e) => `${e.kind}\u0000${e.path.join("\0")}`;
				e[0].filter((t) => e.every((e) => e.some((e) => i(e) === i(t)))).forEach((e) => r([...t, ...e.path], e.kind));
			}
		}
		if (Array.isArray(e.allOf) && e.allOf.forEach((e) => i(e, t)), Am(e.properties)) for (let [n, r] of Object.entries(e.properties)) i(r, [...t, n]);
		Am(e.items) && i(e.items, [...t, "*"]);
	};
	return i(e, []), t;
}
function Fm(e, t) {
	let n = [], r = (e) => {
		typeof e == "string" ? n.push(e) : Array.isArray(e) ? e.forEach((e) => typeof e == "string" && n.push(e)) : Am(e) && typeof e.componentId == "string" && n.push(e.componentId);
	}, i = (e, t) => {
		if (t.length === 0) return r(e);
		let [n, ...a] = t;
		n === "*" ? Array.isArray(e) && e.forEach((e) => i(e, a)) : Am(e) && Object.prototype.hasOwnProperty.call(e, n) && i(e[n], a);
	};
	for (let n of t) i(e, n.path);
	return n;
}
function Im(e, t) {
	let n = (e) => Am(e) && ("@path" in e || "@call" in e), r = (e, t) => {
		if (n(e)) return !0;
		if (t.length === 0) return !1;
		let [i, ...a] = t;
		return i === "*" ? Array.isArray(e) && e.some((e) => r(e, a)) : Am(e) && Object.prototype.hasOwnProperty.call(e, i) && r(e[i], a);
	};
	return t.some((t) => r(e, t.path));
}
function Lm(e, t, n) {
	if (t.length === 0) return n(e);
	let [r, ...i] = t;
	return r === "*" ? Array.isArray(e) ? e.map((e) => Lm(e, i, n)) : e : !Am(e) || !Object.prototype.hasOwnProperty.call(e, r) ? e : {
		...e,
		[r]: Lm(e[r], i, n)
	};
}
// node_modules/@copilotkit/shared/dist/generative-ui/types.mjs
var Rm = "v1.0", zm = "generative-ui-surface", Bm = "generative-ui-function-call", Vm = "render_ui", Hm = "chat", Um = "root", Wm = "callRendererFunction is not supported in this version: the agent cannot call renderer functions until their results can be sent back to it reliably", Gm = /* @__PURE__ */ new Set([
	"catalogId",
	"accessibility",
	"metadata"
]);
function Km(e) {
	return {
		version: Rm,
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
// node_modules/phoenix/priv/static/phoenix.mjs
var qm = (e) => typeof e == "function" ? e : function() {
	return e;
}, Jm = typeof self < "u" ? self : null, Ym = typeof window < "u" ? window : null, Xm = Jm || Ym || globalThis, Zm = "2.0.0", Qm = {
	connecting: 0,
	open: 1,
	closing: 2,
	closed: 3
}, $m = 100, eh = 1e4, th = 1e3, nh = {
	closed: "closed",
	errored: "errored",
	joined: "joined",
	joining: "joining",
	leaving: "leaving"
}, rh = {
	close: "phx_close",
	error: "phx_error",
	join: "phx_join",
	reply: "phx_reply",
	leave: "phx_leave"
}, ih = {
	longpoll: "longpoll",
	websocket: "websocket"
}, ah = { complete: 4 }, oh = "base64url.bearer.phx.", sh = class {
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
}, ch = class {
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
}, lh = class {
	constructor(e, t, n) {
		this.state = nh.closed, this.topic = e, this.params = qm(t || {}), this.socket = n, this.bindings = [], this.bindingRef = 0, this.timeout = this.socket.timeout, this.joinedOnce = !1, this.joinPush = new sh(this, rh.join, this.params, this.timeout), this.pushBuffer = [], this.stateChangeRefs = [], this.rejoinTimer = new ch(() => {
			this.socket.isConnected() && this.rejoin();
		}, this.socket.rejoinAfterMs), this.stateChangeRefs.push(this.socket.onError(() => this.rejoinTimer.reset())), this.stateChangeRefs.push(this.socket.onOpen(() => {
			this.rejoinTimer.reset(), this.isErrored() && this.rejoin();
		})), this.joinPush.receive("ok", () => {
			this.state = nh.joined, this.rejoinTimer.reset(), this.pushBuffer.forEach((e) => e.send()), this.pushBuffer = [];
		}), this.joinPush.receive("error", () => {
			this.state = nh.errored, this.socket.isConnected() && this.rejoinTimer.scheduleTimeout();
		}), this.onClose(() => {
			this.rejoinTimer.reset(), this.socket.hasLogger() && this.socket.log("channel", `close ${this.topic} ${this.joinRef()}`), this.state = nh.closed, this.socket.remove(this);
		}), this.onError((e) => {
			this.socket.hasLogger() && this.socket.log("channel", `error ${this.topic}`, e), this.isJoining() && this.joinPush.reset(), this.state = nh.errored, this.socket.isConnected() && this.rejoinTimer.scheduleTimeout();
		}), this.joinPush.receive("timeout", () => {
			this.socket.hasLogger() && this.socket.log("channel", `timeout ${this.topic} (${this.joinRef()})`, this.joinPush.timeout), new sh(this, rh.leave, qm({}), this.timeout).send(), this.state = nh.errored, this.joinPush.reset(), this.socket.isConnected() && this.rejoinTimer.scheduleTimeout();
		}), this.on(rh.reply, (e, t) => {
			this.trigger(this.replyEventName(t), e);
		});
	}
	join(e = this.timeout) {
		if (this.joinedOnce) throw Error("tried to join multiple times. 'join' can only be called a single time per channel instance");
		return this.timeout = e, this.joinedOnce = !0, this.rejoin(), this.joinPush;
	}
	onClose(e) {
		this.on(rh.close, e);
	}
	onError(e) {
		return this.on(rh.error, (t) => e(t));
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
		let r = new sh(this, e, function() {
			return t;
		}, n);
		return this.canPush() ? r.send() : (r.startTimeout(), this.pushBuffer.push(r)), r;
	}
	leave(e = this.timeout) {
		this.rejoinTimer.reset(), this.joinPush.cancelTimeout(), this.state = nh.leaving;
		let t = () => {
			this.socket.hasLogger() && this.socket.log("channel", `leave ${this.topic}`), this.trigger(rh.close, "leave");
		}, n = new sh(this, rh.leave, qm({}), e);
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
		this.isLeaving() || (this.socket.leaveOpenTopic(this.topic), this.state = nh.joining, this.joinPush.resend(e));
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
		return this.state === nh.closed;
	}
	isErrored() {
		return this.state === nh.errored;
	}
	isJoined() {
		return this.state === nh.joined;
	}
	isJoining() {
		return this.state === nh.joining;
	}
	isLeaving() {
		return this.state === nh.leaving;
	}
}, uh = class {
	static request(e, t, n, r, i, a, o) {
		if (Xm.XDomainRequest) {
			let n = new Xm.XDomainRequest();
			return this.xdomainRequest(n, e, t, r, i, a, o);
		}
		if (Xm.XMLHttpRequest) {
			let s = new Xm.XMLHttpRequest();
			return this.xhrRequest(s, e, t, n, r, i, a, o);
		}
		if (Xm.fetch && Xm.AbortController) return this.fetchRequest(e, t, n, r, i, a, o);
		throw Error("No suitable XMLHttpRequest implementation found");
	}
	static fetchRequest(e, t, n, r, i, a, o) {
		let s = {
			method: e,
			headers: n,
			body: r
		}, c = null, l = null;
		return i && (c = new AbortController(), l = setTimeout(() => c.abort(), i), s.signal = c.signal), Xm.fetch(t, s).then((e) => e.text()).then((e) => this.parseJSON(e)).then((e) => {
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
			e.readyState === ah.complete && s && s(this.parseJSON(e.responseText));
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
}, dh = (e) => {
	let t = "", n = new Uint8Array(e), r = n.byteLength;
	for (let e = 0; e < r; e++) t += String.fromCharCode(n[e]);
	return btoa(t);
}, fh = class {
	constructor(e, t) {
		t && t.length === 2 && t[1].startsWith(oh) && (this.authToken = atob(t[1].slice(oh.length))), this.endPoint = null, this.token = null, this.skipHeartbeat = !0, this.reqs = /* @__PURE__ */ new Set(), this.messageTimers = /* @__PURE__ */ new Set(), this.awaitingBatchAck = !1, this.currentBatch = null, this.currentBatchTimer = null, this.batchBuffer = [], this.onopen = function() {}, this.onerror = function() {}, this.onmessage = function() {}, this.onclose = function() {}, this.pollEndpoint = this.normalizeEndpoint(e), this.readyState = Qm.connecting, setTimeout(() => this.poll(), 0);
	}
	normalizeEndpoint(e) {
		return e.replace("ws://", "http://").replace("wss://", "https://").replace(RegExp("(.*)/" + ih.websocket), "$1/" + ih.longpoll);
	}
	endpointURL() {
		return uh.appendParams(this.pollEndpoint, { token: this.token });
	}
	closeAndRetry(e, t, n, r) {
		this.isActive() && (this.stop(Qm.connecting), this.onerror(e), this.isActive() && this.emitClose(t, n, r));
	}
	ontimeout() {
		this.closeAndRetry("timeout", 1005, "timeout", !1);
	}
	isActive() {
		return this.readyState === Qm.open || this.readyState === Qm.connecting;
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
					this.readyState = Qm.open, this.onopen({}), this.poll();
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
		typeof e != "string" && (e = dh(e)), this.currentBatch ? this.currentBatch.push(e) : this.awaitingBatchAck ? this.batchBuffer.push(e) : (this.currentBatch = [e], this.currentBatchTimer = setTimeout(() => {
			this.batchSend(this.currentBatch), this.currentBatch = null;
		}, 0));
	}
	batchSend(e, t = 0) {
		this.awaitingBatchAck = !0;
		let n = t + $m, r = e.slice(t, n);
		this.ajax("POST", { "Content-Type": "application/x-ndjson" }, r.join("\n"), () => this.ontimeout(), (t) => {
			!t || t.status !== 200 ? this.closeAndRetry(t && t.status, 1011, "internal server error", !1) : n < e.length ? this.batchSend(e, n) : this.batchBuffer.length > 0 ? (this.batchSend(this.batchBuffer), this.batchBuffer = []) : this.awaitingBatchAck = !1;
		});
	}
	close(e, t, n) {
		this.stop(Qm.closed), this.emitClose(e, t, n);
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
		this.reqs.add(a), a.req = uh.request(e, this.endpointURL(), t, n, this.timeout, () => {
			this.reqs.delete(a) && r();
		}, (e) => {
			this.reqs.delete(a) && i(e);
		});
	}
}, ph = {
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
			event: rh.reply,
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
}, mh = class {
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
		return this.transport.readyState === Qm.open;
	}
	isConnecting() {
		return this.transport.readyState === Qm.connecting;
	}
	carried(e, t = e.joinRef()) {
		return this.joins.has(e) && this.joins.get(e) === t;
	}
	close(e, t) {
		this.closing = !0, this.transport.onerror = function() {}, e ? this.transport.close(e, t || "") : this.transport.close();
	}
}, hh = class {
	constructor(e, t = {}) {
		this.stateChangeCallbacks = {
			open: [],
			close: [],
			error: [],
			message: []
		}, this.channels = [], this.sendBuffer = [], this.ref = 0, this.fallbackRef = null, this.fallbackErrorRef = null, this.timeout = t.timeout || eh, this.transport = t.transport || Xm.WebSocket || fh, this.primaryPassedHealthCheck = !1, this.longPollFallbackMs = t.longPollFallbackMs, this.fallbackTimer = null, this.sessionStore = t.sessionStorage || Xm && Xm.sessionStorage, this.establishedConnections = 0, this.defaultEncoder = ph.encode.bind(ph), this.defaultDecoder = ph.decode.bind(ph), this.closeWasClean = !0, this.binaryType = t.binaryType || "arraybuffer", this.connection = null, this.connectClock = 1, this.visibilityConnection = null, this.transport === fh ? (this.encode = this.defaultEncoder, this.decode = this.defaultDecoder) : (this.encode = t.encode || this.defaultEncoder, this.decode = t.decode || this.defaultDecoder);
		let n = null;
		Ym && Ym.addEventListener && (Ym.addEventListener("pagehide", (e) => {
			this.connection && !this.connection.ended && (this.disconnect(), n = this.connectClock);
		}), Ym.addEventListener("pageshow", (e) => {
			n === this.connectClock && (n = null, this.connect());
		}), Ym.addEventListener("visibilitychange", () => {
			this.handleVisibilityChange();
		}), Ym.document && Ym.document.addEventListener("resume", () => {
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
		}), this.longpollerTimeout = t.longpollerTimeout || 2e4, this.params = qm(t.params || {}), this.endPoint = `${e}/${ih.websocket}`, this.vsn = t.vsn || Zm, this.heartbeatTimeoutTimer = null, this.heartbeatTimer = null, this.pendingHeartbeatRef = null, this.reconnectTimer = new ch(() => {
			this.pageHidden ? (this.log("Not reconnecting as page is hidden!"), this.teardown()) : this.teardownAndReconnect(() => this.connect());
		}, this.reconnectAfterMs), this.authToken = t.authToken && qm(t.authToken);
	}
	get conn() {
		return this.connection && this.connection.transport;
	}
	get pageHidden() {
		return Ym && Ym.document ? Ym.document.visibilityState === "hidden" : !1;
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
		return fh;
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
		let e = uh.appendParams(uh.appendParams(this.endPoint, this.params()), { vsn: this.vsn });
		return e.charAt(0) === "/" ? e.charAt(1) === "/" ? `${this.protocol()}:${e}` : `${this.protocol()}://${location.host}${e}` : e;
	}
	disconnect(e, t, n) {
		this.connectClock++, this.closeWasClean = !0, clearTimeout(this.fallbackTimer), this.reconnectTimer.reset(), this.connection && (this.connection.ended = !0), this.teardown(e, t, n);
	}
	connect(e) {
		e && (console && console.log("passing params to connect is deprecated. Instead pass :params to the Socket constructor"), this.params = qm(e)), (!this.connection || this.connection.ended) && (this.longPollFallbackMs && this.transport !== fh ? this.connectWithFallback(fh, this.longPollFallbackMs) : this.transportConnect());
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
			case fh: return "LongPoll";
			default: return e.name;
		}
	}
	transportConnect() {
		let e = this.connection;
		this.connectClock++, this.closeWasClean = !1, clearTimeout(this.reconnectTimer.timer);
		let t;
		this.authToken && (t = ["phoenix", `${oh}${btoa(this.authToken()).replace(/=/g, "")}`]);
		let n = new this.transport(this.endPointURL(), t);
		n.binaryType = this.binaryType, n.timeout = this.longpollerTimeout, this.connection = new mh(this, n), e && e.isOpen() && this.triggerChanError("connection_closed", e);
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
			if (this.pendingHeartbeatRef = null, this.hasLogger() && this.log("transport", "heartbeat timeout. Attempting to re-establish connection"), this.closeWasClean = !1, e && e.close(th, "heartbeat timeout"), !this.stillUses(e) || (this.triggerChanError("heartbeat_timeout"), !this.stillUses(e))) return;
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
		n === 5 || !e.bufferedAmount || e.readyState !== Qm.open ? t() : setTimeout(() => {
			this.waitForBufferDone(e, t, n + 1);
		}, 150 * n);
	}
	waitForSocketClosed(e, t, n = 1) {
		n === 5 || e.readyState === Qm.closed ? t() : setTimeout(() => {
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
			r.joinRef() === i && (!t || !n && t.isCurrent() || t.carried(r, i)) && (r.isErrored() || r.isLeaving() || r.isClosed() || r.trigger(rh.error, {
				source: "transport",
				reason: e
			}));
		});
	}
	connectionState() {
		switch (this.conn && this.conn.readyState) {
			case Qm.connecting: return "connecting";
			case Qm.open: return "open";
			case Qm.closing: return "closing";
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
		let n = new lh(e, t, this);
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
		t && e.event === rh.join && n.joins.set(t, e.join_ref), this.encode(e, (r) => {
			n.isCurrent() && n.isOpen() && (e.event !== rh.leave && this.isOutdated(e, t) || n.transport.send(r));
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
}, gh = Symbol("Let zodToJsonSchema decide on which parser to use"), _h = {
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
}, vh = (e) => typeof e == "string" ? {
	..._h,
	name: e
} : {
	..._h,
	...e
}, yh = (e) => {
	let t = vh(e), n = t.name === void 0 ? t.basePath : [
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
// node_modules/zod-to-json-schema/dist/esm/errorMessages.js
function bh(e, t, n, r) {
	r?.errorMessages && n && (e.errorMessage = {
		...e.errorMessage,
		[t]: n
	});
}
function I(e, t, n, r, i) {
	e[t] = n, bh(e, t, r, i);
}
// node_modules/zod-to-json-schema/dist/esm/getRelativePath.js
var xh = (e, t) => {
	let n = 0;
	for (; n < e.length && n < t.length && e[n] === t[n]; n++);
	return [(e.length - n).toString(), ...t.slice(n)].join("/");
}, L;
(function(e) {
	e.assertEqual = (e) => {};
	function t(e) {}
	e.assertIs = t;
	function n(e) {
		throw Error();
	}
	e.assertNever = n, e.arrayToEnum = (e) => {
		let t = {};
		for (let n of e) t[n] = n;
		return t;
	}, e.getValidEnumValues = (t) => {
		let n = e.objectKeys(t).filter((e) => typeof t[t[e]] != "number"), r = {};
		for (let e of n) r[e] = t[e];
		return e.objectValues(r);
	}, e.objectValues = (t) => e.objectKeys(t).map(function(e) {
		return t[e];
	}), e.objectKeys = typeof Object.keys == "function" ? (e) => Object.keys(e) : (e) => {
		let t = [];
		for (let n in e) Object.prototype.hasOwnProperty.call(e, n) && t.push(n);
		return t;
	}, e.find = (e, t) => {
		for (let n of e) if (t(n)) return n;
	}, e.isInteger = typeof Number.isInteger == "function" ? (e) => Number.isInteger(e) : (e) => typeof e == "number" && Number.isFinite(e) && Math.floor(e) === e;
	function r(e, t = " | ") {
		return e.map((e) => typeof e == "string" ? `'${e}'` : e).join(t);
	}
	e.joinValues = r, e.jsonStringifyReplacer = (e, t) => typeof t == "bigint" ? t.toString() : t;
})(L ||= {});
var Sh;
(function(e) {
	e.mergeShapes = (e, t) => ({
		...e,
		...t
	});
})(Sh ||= {});
var R = L.arrayToEnum([
	"string",
	"nan",
	"number",
	"integer",
	"float",
	"boolean",
	"date",
	"bigint",
	"symbol",
	"function",
	"undefined",
	"null",
	"array",
	"object",
	"unknown",
	"promise",
	"void",
	"never",
	"map",
	"set"
]), Ch = (e) => {
	switch (typeof e) {
		case "undefined": return R.undefined;
		case "string": return R.string;
		case "number": return Number.isNaN(e) ? R.nan : R.number;
		case "boolean": return R.boolean;
		case "function": return R.function;
		case "bigint": return R.bigint;
		case "symbol": return R.symbol;
		case "object": return Array.isArray(e) ? R.array : e === null ? R.null : e.then && typeof e.then == "function" && e.catch && typeof e.catch == "function" ? R.promise : typeof Map < "u" && e instanceof Map ? R.map : typeof Set < "u" && e instanceof Set ? R.set : typeof Date < "u" && e instanceof Date ? R.date : R.object;
		default: return R.unknown;
	}
}, z = L.arrayToEnum([
	"invalid_type",
	"invalid_literal",
	"custom",
	"invalid_union",
	"invalid_union_discriminator",
	"invalid_enum_value",
	"unrecognized_keys",
	"invalid_arguments",
	"invalid_return_type",
	"invalid_date",
	"invalid_string",
	"too_small",
	"too_big",
	"invalid_intersection_types",
	"not_multiple_of",
	"not_finite"
]), wh = class e extends Error {
	get errors() {
		return this.issues;
	}
	constructor(e) {
		super(), this.issues = [], this.addIssue = (e) => {
			this.issues = [...this.issues, e];
		}, this.addIssues = (e = []) => {
			this.issues = [...this.issues, ...e];
		};
		let t = new.target.prototype;
		Object.setPrototypeOf ? Object.setPrototypeOf(this, t) : this.__proto__ = t, this.name = "ZodError", this.issues = e;
	}
	format(e) {
		let t = e || function(e) {
			return e.message;
		}, n = { _errors: [] }, r = (e) => {
			for (let i of e.issues) if (i.code === "invalid_union") i.unionErrors.map(r);
			else if (i.code === "invalid_return_type") r(i.returnTypeError);
			else if (i.code === "invalid_arguments") r(i.argumentsError);
			else if (i.path.length === 0) n._errors.push(t(i));
			else {
				let e = n, r = 0;
				for (; r < i.path.length;) {
					let n = i.path[r], a = r === i.path.length - 1;
					n === "_errors" ? (a && e._errors.push(t(i)), r++) : (Object.prototype.hasOwnProperty.call(e, n) || (n === "__proto__" ? Object.defineProperty(e, n, {
						value: { _errors: [] },
						writable: !0,
						enumerable: !0,
						configurable: !0
					}) : e[n] = { _errors: [] }), e = e[n], a && e._errors.push(t(i)), r++);
				}
			}
		};
		return r(this), n;
	}
	static assert(t) {
		if (!(t instanceof e)) throw Error(`Not a ZodError: ${t}`);
	}
	toString() {
		return this.message;
	}
	get message() {
		return JSON.stringify(this.issues, L.jsonStringifyReplacer, 2);
	}
	get isEmpty() {
		return this.issues.length === 0;
	}
	flatten(e = (e) => e.message) {
		let t = Object.create(null), n = [];
		for (let r of this.issues) if (r.path.length > 0) {
			let n = r.path[0];
			t[n] = t[n] || [], t[n].push(e(r));
		} else n.push(e(r));
		return {
			formErrors: n,
			fieldErrors: t
		};
	}
	get formErrors() {
		return this.flatten();
	}
};
wh.create = (e) => new wh(e);
// node_modules/zod/v3/locales/en.js
var Th = (e, t) => {
	let n;
	switch (e.code) {
		case z.invalid_type:
			n = e.received === R.undefined ? "Required" : `Expected ${e.expected}, received ${e.received}`;
			break;
		case z.invalid_literal:
			n = `Invalid literal value, expected ${JSON.stringify(e.expected, L.jsonStringifyReplacer)}`;
			break;
		case z.unrecognized_keys:
			n = `Unrecognized key(s) in object: ${L.joinValues(e.keys, ", ")}`;
			break;
		case z.invalid_union:
			n = "Invalid input";
			break;
		case z.invalid_union_discriminator:
			n = `Invalid discriminator value. Expected ${L.joinValues(e.options)}`;
			break;
		case z.invalid_enum_value:
			n = `Invalid enum value. Expected ${L.joinValues(e.options)}, received '${e.received}'`;
			break;
		case z.invalid_arguments:
			n = "Invalid function arguments";
			break;
		case z.invalid_return_type:
			n = "Invalid function return type";
			break;
		case z.invalid_date:
			n = "Invalid date";
			break;
		case z.invalid_string:
			typeof e.validation == "object" ? "includes" in e.validation ? (n = `Invalid input: must include "${e.validation.includes}"`, typeof e.validation.position == "number" && (n = `${n} at one or more positions greater than or equal to ${e.validation.position}`)) : "startsWith" in e.validation ? n = `Invalid input: must start with "${e.validation.startsWith}"` : "endsWith" in e.validation ? n = `Invalid input: must end with "${e.validation.endsWith}"` : L.assertNever(e.validation) : n = e.validation === "regex" ? "Invalid" : `Invalid ${e.validation}`;
			break;
		case z.too_small:
			n = e.type === "array" ? `Array must contain ${e.exact ? "exactly" : e.inclusive ? "at least" : "more than"} ${e.minimum} element(s)` : e.type === "string" ? `String must contain ${e.exact ? "exactly" : e.inclusive ? "at least" : "over"} ${e.minimum} character(s)` : e.type === "number" || e.type === "bigint" ? `Number must be ${e.exact ? "exactly equal to " : e.inclusive ? "greater than or equal to " : "greater than "}${e.minimum}` : e.type === "date" ? `Date must be ${e.exact ? "exactly equal to " : e.inclusive ? "greater than or equal to " : "greater than "}${new Date(Number(e.minimum))}` : "Invalid input";
			break;
		case z.too_big:
			n = e.type === "array" ? `Array must contain ${e.exact ? "exactly" : e.inclusive ? "at most" : "less than"} ${e.maximum} element(s)` : e.type === "string" ? `String must contain ${e.exact ? "exactly" : e.inclusive ? "at most" : "under"} ${e.maximum} character(s)` : e.type === "number" ? `Number must be ${e.exact ? "exactly" : e.inclusive ? "less than or equal to" : "less than"} ${e.maximum}` : e.type === "bigint" ? `BigInt must be ${e.exact ? "exactly" : e.inclusive ? "less than or equal to" : "less than"} ${e.maximum}` : e.type === "date" ? `Date must be ${e.exact ? "exactly" : e.inclusive ? "smaller than or equal to" : "smaller than"} ${new Date(Number(e.maximum))}` : "Invalid input";
			break;
		case z.custom:
			n = "Invalid input";
			break;
		case z.invalid_intersection_types:
			n = "Intersection results could not be merged";
			break;
		case z.not_multiple_of:
			n = `Number must be a multiple of ${e.multipleOf}`;
			break;
		case z.not_finite:
			n = "Number must be finite";
			break;
		default: n = t.defaultError, L.assertNever(e);
	}
	return { message: n };
}, Eh = Th;
function Dh() {
	return Eh;
}
// node_modules/zod/v3/helpers/parseUtil.js
var Oh = (e) => {
	let { data: t, path: n, errorMaps: r, issueData: i } = e, a = [...n, ...i.path || []], o = {
		...i,
		path: a
	};
	if (i.message !== void 0) return {
		...i,
		path: a,
		message: i.message
	};
	let s = "", c = r.filter((e) => !!e).slice().reverse();
	for (let e of c) s = e(o, {
		data: t,
		defaultError: s
	}).message;
	return {
		...i,
		path: a,
		message: s
	};
};
function B(e, t) {
	let n = Dh(), r = Oh({
		issueData: t,
		data: e.data,
		path: e.path,
		errorMaps: [
			e.common.contextualErrorMap,
			e.schemaErrorMap,
			n,
			n === Th ? void 0 : Th
		].filter((e) => !!e)
	});
	e.common.issues.push(r);
}
var kh = class e {
	constructor() {
		this.value = "valid";
	}
	dirty() {
		this.value === "valid" && (this.value = "dirty");
	}
	abort() {
		this.value !== "aborted" && (this.value = "aborted");
	}
	static mergeArray(e, t) {
		let n = [];
		for (let r of t) {
			if (r.status === "aborted") return V;
			r.status === "dirty" && e.dirty(), n.push(r.value);
		}
		return {
			status: e.value,
			value: n
		};
	}
	static async mergeObjectAsync(t, n) {
		let r = [];
		for (let e of n) {
			let t = await e.key, n = await e.value;
			r.push({
				key: t,
				value: n
			});
		}
		return e.mergeObjectSync(t, r);
	}
	static mergeObjectSync(e, t) {
		let n = {};
		for (let r of t) {
			let { key: t, value: i } = r;
			if (t.status === "aborted" || i.status === "aborted") return V;
			t.status === "dirty" && e.dirty(), i.status === "dirty" && e.dirty(), t.value !== "__proto__" && (i.value !== void 0 || r.alwaysSet) && (n[t.value] = i.value);
		}
		return {
			status: e.value,
			value: n
		};
	}
}, V = Object.freeze({ status: "aborted" }), Ah = (e) => ({
	status: "dirty",
	value: e
}), jh = (e) => ({
	status: "valid",
	value: e
}), Mh = (e) => e.status === "aborted", Nh = (e) => e.status === "dirty", Ph = (e) => e.status === "valid", Fh = (e) => typeof Promise < "u" && e instanceof Promise, H;
(function(e) {
	e.errToObj = (e) => typeof e == "string" ? { message: e } : e || {}, e.toString = (e) => typeof e == "string" ? e : e?.message;
})(H ||= {});
// node_modules/zod/v3/types.js
var Ih = class {
	constructor(e, t, n, r) {
		this._cachedPath = [], this.parent = e, this.data = t, this._path = n, this._key = r;
	}
	get path() {
		return this._cachedPath.length || (Array.isArray(this._key) ? this._cachedPath.push(...this._path, ...this._key) : this._cachedPath.push(...this._path, this._key)), this._cachedPath;
	}
}, Lh = (e, t) => {
	if (Ph(t)) return {
		success: !0,
		data: t.value
	};
	if (!e.common.issues.length) throw Error("Validation failed but no issues detected.");
	return {
		success: !1,
		get error() {
			if (this._error) return this._error;
			let t = new wh(e.common.issues);
			return this._error = t, this._error;
		}
	};
};
function U(e) {
	if (!e) return {};
	let { errorMap: t, invalid_type_error: n, required_error: r, description: i } = e;
	if (t && (n || r)) throw Error("Can't use \"invalid_type_error\" or \"required_error\" in conjunction with custom error map.");
	return t ? {
		errorMap: t,
		description: i
	} : {
		errorMap: (t, i) => {
			let { message: a } = e;
			return t.code === "invalid_enum_value" ? { message: a ?? i.defaultError } : i.data === void 0 ? { message: a ?? r ?? i.defaultError } : t.code === "invalid_type" ? { message: a ?? n ?? i.defaultError } : { message: i.defaultError };
		},
		description: i
	};
}
var W = class {
	get description() {
		return this._def.description;
	}
	_getType(e) {
		return Ch(e.data);
	}
	_getOrReturnCtx(e, t) {
		return t || {
			common: e.parent.common,
			data: e.data,
			parsedType: Ch(e.data),
			schemaErrorMap: this._def.errorMap,
			path: e.path,
			parent: e.parent
		};
	}
	_processInputParams(e) {
		return {
			status: new kh(),
			ctx: {
				common: e.parent.common,
				data: e.data,
				parsedType: Ch(e.data),
				schemaErrorMap: this._def.errorMap,
				path: e.path,
				parent: e.parent
			}
		};
	}
	_parseSync(e) {
		let t = this._parse(e);
		if (Fh(t)) throw Error("Synchronous parse encountered promise.");
		return t;
	}
	_parseAsync(e) {
		let t = this._parse(e);
		return Promise.resolve(t);
	}
	parse(e, t) {
		let n = this.safeParse(e, t);
		if (n.success) return n.data;
		throw n.error;
	}
	safeParse(e, t) {
		let n = {
			common: {
				issues: [],
				async: t?.async ?? !1,
				contextualErrorMap: t?.errorMap
			},
			path: t?.path || [],
			schemaErrorMap: this._def.errorMap,
			parent: null,
			data: e,
			parsedType: Ch(e)
		};
		return Lh(n, this._parseSync({
			data: e,
			path: n.path,
			parent: n
		}));
	}
	"~validate"(e) {
		let t = {
			common: {
				issues: [],
				async: !!this["~standard"].async
			},
			path: [],
			schemaErrorMap: this._def.errorMap,
			parent: null,
			data: e,
			parsedType: Ch(e)
		};
		if (!this["~standard"].async) try {
			let n = this._parseSync({
				data: e,
				path: [],
				parent: t
			});
			return Ph(n) ? { value: n.value } : { issues: t.common.issues };
		} catch (e) {
			e?.message?.toLowerCase()?.includes("encountered") && (this["~standard"].async = !0), t.common = {
				issues: [],
				async: !0
			};
		}
		return this._parseAsync({
			data: e,
			path: [],
			parent: t
		}).then((e) => Ph(e) ? { value: e.value } : { issues: t.common.issues });
	}
	async parseAsync(e, t) {
		let n = await this.safeParseAsync(e, t);
		if (n.success) return n.data;
		throw n.error;
	}
	async safeParseAsync(e, t) {
		let n = {
			common: {
				issues: [],
				contextualErrorMap: t?.errorMap,
				async: !0
			},
			path: t?.path || [],
			schemaErrorMap: this._def.errorMap,
			parent: null,
			data: e,
			parsedType: Ch(e)
		}, r = this._parse({
			data: e,
			path: n.path,
			parent: n
		});
		return Lh(n, await (Fh(r) ? r : Promise.resolve(r)));
	}
	refine(e, t) {
		let n = (e) => typeof t == "string" || t === void 0 ? { message: t } : typeof t == "function" ? t(e) : t;
		return this._refinement((t, r) => {
			let i = e(t), a = () => r.addIssue({
				code: z.custom,
				...n(t)
			});
			return typeof Promise < "u" && i instanceof Promise ? i.then((e) => e ? !0 : (a(), !1)) : i ? !0 : (a(), !1);
		});
	}
	refinement(e, t) {
		return this._refinement((n, r) => e(n) ? !0 : (r.addIssue(typeof t == "function" ? t(n, r) : t), !1));
	}
	_refinement(e) {
		return new Bg({
			schema: this,
			typeName: G.ZodEffects,
			effect: {
				type: "refinement",
				refinement: e
			}
		});
	}
	superRefine(e) {
		return this._refinement(e);
	}
	constructor(e) {
		this.spa = this.safeParseAsync, this._def = e, this.parse = this.parse.bind(this), this.safeParse = this.safeParse.bind(this), this.parseAsync = this.parseAsync.bind(this), this.safeParseAsync = this.safeParseAsync.bind(this), this.spa = this.spa.bind(this), this.refine = this.refine.bind(this), this.refinement = this.refinement.bind(this), this.superRefine = this.superRefine.bind(this), this.optional = this.optional.bind(this), this.nullable = this.nullable.bind(this), this.nullish = this.nullish.bind(this), this.array = this.array.bind(this), this.promise = this.promise.bind(this), this.or = this.or.bind(this), this.and = this.and.bind(this), this.transform = this.transform.bind(this), this.brand = this.brand.bind(this), this.default = this.default.bind(this), this.catch = this.catch.bind(this), this.describe = this.describe.bind(this), this.pipe = this.pipe.bind(this), this.readonly = this.readonly.bind(this), this.isNullable = this.isNullable.bind(this), this.isOptional = this.isOptional.bind(this), this["~standard"] = {
			version: 1,
			vendor: "zod",
			validate: (e) => this["~validate"](e)
		};
	}
	optional() {
		return Vg.create(this, this._def);
	}
	nullable() {
		return Hg.create(this, this._def);
	}
	nullish() {
		return this.nullable().optional();
	}
	array() {
		return xg.create(this);
	}
	promise() {
		return zg.create(this, this._def);
	}
	or(e) {
		return wg.create([this, e], this._def);
	}
	and(e) {
		return Og.create(this, e, this._def);
	}
	transform(e) {
		return new Bg({
			...U(this._def),
			schema: this,
			typeName: G.ZodEffects,
			effect: {
				type: "transform",
				transform: e
			}
		});
	}
	default(e) {
		let t = typeof e == "function" ? e : () => e;
		return new Ug({
			...U(this._def),
			innerType: this,
			defaultValue: t,
			typeName: G.ZodDefault
		});
	}
	brand() {
		return new Kg({
			typeName: G.ZodBranded,
			type: this,
			...U(this._def)
		});
	}
	catch(e) {
		let t = typeof e == "function" ? e : () => e;
		return new Wg({
			...U(this._def),
			innerType: this,
			catchValue: t,
			typeName: G.ZodCatch
		});
	}
	describe(e) {
		let t = this.constructor;
		return new t({
			...this._def,
			description: e
		});
	}
	pipe(e) {
		return qg.create(this, e);
	}
	readonly() {
		return Jg.create(this);
	}
	isOptional() {
		return this.safeParse(void 0).success;
	}
	isNullable() {
		return this.safeParse(null).success;
	}
}, Rh = /^c[^\s-]{8,}$/i, zh = /^[0-9a-z]+$/, Bh = /^[0-9A-HJKMNP-TV-Z]{26}$/i, Vh = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i, Hh = /^[a-z0-9_-]{21}$/i, Uh = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/, Wh = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/, Gh = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i, Kh = "^[\\p{Extended_Pictographic}\\p{Emoji_Component}]+$", qh, Jh = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/, Yh = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/, Xh = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/, Zh = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/, Qh = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/, $h = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/, eg = "((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))", tg = RegExp(`^${eg}$`);
function ng(e) {
	let t = "[0-5]\\d";
	e.precision ? t = `${t}\\.\\d{${e.precision}}` : e.precision ?? (t = `${t}(\\.\\d+)?`);
	let n = e.precision ? "+" : "?";
	return `([01]\\d|2[0-3]):[0-5]\\d(:${t})${n}`;
}
function rg(e) {
	return RegExp(`^${ng(e)}$`);
}
function ig(e) {
	let t = `${eg}T${ng(e)}`, n = [];
	return n.push(e.local ? "Z?" : "Z"), e.offset && n.push("([+-]\\d{2}:?\\d{2})"), t = `${t}(${n.join("|")})`, RegExp(`^${t}$`);
}
function ag(e, t) {
	return !((t !== "v4" && t || !Jh.test(e)) && (t !== "v6" && t || !Xh.test(e)));
}
function og(e, t) {
	if (!Uh.test(e)) return !1;
	try {
		let [n] = e.split(".");
		if (!n) return !1;
		let r = n.replace(/-/g, "+").replace(/_/g, "/").padEnd(n.length + (4 - n.length % 4) % 4, "="), i = JSON.parse(atob(r));
		return !(typeof i != "object" || !i || "typ" in i && i?.typ !== "JWT" || !i.alg || t && i.alg !== t);
	} catch {
		return !1;
	}
}
function sg(e, t) {
	return !((t !== "v4" && t || !Yh.test(e)) && (t !== "v6" && t || !Zh.test(e)));
}
var cg = class e extends W {
	_parse(e) {
		if (this._def.coerce && (e.data = String(e.data)), this._getType(e) !== R.string) {
			let t = this._getOrReturnCtx(e);
			return B(t, {
				code: z.invalid_type,
				expected: R.string,
				received: t.parsedType
			}), V;
		}
		let t = new kh(), n;
		for (let r of this._def.checks) if (r.kind === "min") e.data.length < r.value && (n = this._getOrReturnCtx(e, n), B(n, {
			code: z.too_small,
			minimum: r.value,
			type: "string",
			inclusive: !0,
			exact: !1,
			message: r.message
		}), t.dirty());
		else if (r.kind === "max") e.data.length > r.value && (n = this._getOrReturnCtx(e, n), B(n, {
			code: z.too_big,
			maximum: r.value,
			type: "string",
			inclusive: !0,
			exact: !1,
			message: r.message
		}), t.dirty());
		else if (r.kind === "length") {
			let i = e.data.length > r.value, a = e.data.length < r.value;
			(i || a) && (n = this._getOrReturnCtx(e, n), i ? B(n, {
				code: z.too_big,
				maximum: r.value,
				type: "string",
				inclusive: !0,
				exact: !0,
				message: r.message
			}) : a && B(n, {
				code: z.too_small,
				minimum: r.value,
				type: "string",
				inclusive: !0,
				exact: !0,
				message: r.message
			}), t.dirty());
		} else if (r.kind === "email") Gh.test(e.data) || (n = this._getOrReturnCtx(e, n), B(n, {
			validation: "email",
			code: z.invalid_string,
			message: r.message
		}), t.dirty());
		else if (r.kind === "emoji") qh ||= new RegExp(Kh, "u"), qh.test(e.data) || (n = this._getOrReturnCtx(e, n), B(n, {
			validation: "emoji",
			code: z.invalid_string,
			message: r.message
		}), t.dirty());
		else if (r.kind === "uuid") Vh.test(e.data) || (n = this._getOrReturnCtx(e, n), B(n, {
			validation: "uuid",
			code: z.invalid_string,
			message: r.message
		}), t.dirty());
		else if (r.kind === "nanoid") Hh.test(e.data) || (n = this._getOrReturnCtx(e, n), B(n, {
			validation: "nanoid",
			code: z.invalid_string,
			message: r.message
		}), t.dirty());
		else if (r.kind === "cuid") Rh.test(e.data) || (n = this._getOrReturnCtx(e, n), B(n, {
			validation: "cuid",
			code: z.invalid_string,
			message: r.message
		}), t.dirty());
		else if (r.kind === "cuid2") zh.test(e.data) || (n = this._getOrReturnCtx(e, n), B(n, {
			validation: "cuid2",
			code: z.invalid_string,
			message: r.message
		}), t.dirty());
		else if (r.kind === "ulid") Bh.test(e.data) || (n = this._getOrReturnCtx(e, n), B(n, {
			validation: "ulid",
			code: z.invalid_string,
			message: r.message
		}), t.dirty());
		else if (r.kind === "url") try {
			new URL(e.data);
		} catch {
			n = this._getOrReturnCtx(e, n), B(n, {
				validation: "url",
				code: z.invalid_string,
				message: r.message
			}), t.dirty();
		}
		else r.kind === "regex" ? (r.regex.lastIndex = 0, r.regex.test(e.data) || (n = this._getOrReturnCtx(e, n), B(n, {
			validation: "regex",
			code: z.invalid_string,
			message: r.message
		}), t.dirty())) : r.kind === "trim" ? e.data = e.data.trim() : r.kind === "includes" ? e.data.includes(r.value, r.position) || (n = this._getOrReturnCtx(e, n), B(n, {
			code: z.invalid_string,
			validation: {
				includes: r.value,
				position: r.position
			},
			message: r.message
		}), t.dirty()) : r.kind === "toLowerCase" ? e.data = e.data.toLowerCase() : r.kind === "toUpperCase" ? e.data = e.data.toUpperCase() : r.kind === "startsWith" ? e.data.startsWith(r.value) || (n = this._getOrReturnCtx(e, n), B(n, {
			code: z.invalid_string,
			validation: { startsWith: r.value },
			message: r.message
		}), t.dirty()) : r.kind === "endsWith" ? e.data.endsWith(r.value) || (n = this._getOrReturnCtx(e, n), B(n, {
			code: z.invalid_string,
			validation: { endsWith: r.value },
			message: r.message
		}), t.dirty()) : r.kind === "datetime" ? ig(r).test(e.data) || (n = this._getOrReturnCtx(e, n), B(n, {
			code: z.invalid_string,
			validation: "datetime",
			message: r.message
		}), t.dirty()) : r.kind === "date" ? tg.test(e.data) || (n = this._getOrReturnCtx(e, n), B(n, {
			code: z.invalid_string,
			validation: "date",
			message: r.message
		}), t.dirty()) : r.kind === "time" ? rg(r).test(e.data) || (n = this._getOrReturnCtx(e, n), B(n, {
			code: z.invalid_string,
			validation: "time",
			message: r.message
		}), t.dirty()) : r.kind === "duration" ? Wh.test(e.data) || (n = this._getOrReturnCtx(e, n), B(n, {
			validation: "duration",
			code: z.invalid_string,
			message: r.message
		}), t.dirty()) : r.kind === "ip" ? ag(e.data, r.version) || (n = this._getOrReturnCtx(e, n), B(n, {
			validation: "ip",
			code: z.invalid_string,
			message: r.message
		}), t.dirty()) : r.kind === "jwt" ? og(e.data, r.alg) || (n = this._getOrReturnCtx(e, n), B(n, {
			validation: "jwt",
			code: z.invalid_string,
			message: r.message
		}), t.dirty()) : r.kind === "cidr" ? sg(e.data, r.version) || (n = this._getOrReturnCtx(e, n), B(n, {
			validation: "cidr",
			code: z.invalid_string,
			message: r.message
		}), t.dirty()) : r.kind === "base64" ? Qh.test(e.data) || (n = this._getOrReturnCtx(e, n), B(n, {
			validation: "base64",
			code: z.invalid_string,
			message: r.message
		}), t.dirty()) : r.kind === "base64url" ? $h.test(e.data) || (n = this._getOrReturnCtx(e, n), B(n, {
			validation: "base64url",
			code: z.invalid_string,
			message: r.message
		}), t.dirty()) : L.assertNever(r);
		return {
			status: t.value,
			value: e.data
		};
	}
	_regex(e, t, n) {
		return this.refinement((t) => e.test(t), {
			validation: t,
			code: z.invalid_string,
			...H.errToObj(n)
		});
	}
	_addCheck(t) {
		return new e({
			...this._def,
			checks: [...this._def.checks, t]
		});
	}
	email(e) {
		return this._addCheck({
			kind: "email",
			...H.errToObj(e)
		});
	}
	url(e) {
		return this._addCheck({
			kind: "url",
			...H.errToObj(e)
		});
	}
	emoji(e) {
		return this._addCheck({
			kind: "emoji",
			...H.errToObj(e)
		});
	}
	uuid(e) {
		return this._addCheck({
			kind: "uuid",
			...H.errToObj(e)
		});
	}
	nanoid(e) {
		return this._addCheck({
			kind: "nanoid",
			...H.errToObj(e)
		});
	}
	cuid(e) {
		return this._addCheck({
			kind: "cuid",
			...H.errToObj(e)
		});
	}
	cuid2(e) {
		return this._addCheck({
			kind: "cuid2",
			...H.errToObj(e)
		});
	}
	ulid(e) {
		return this._addCheck({
			kind: "ulid",
			...H.errToObj(e)
		});
	}
	base64(e) {
		return this._addCheck({
			kind: "base64",
			...H.errToObj(e)
		});
	}
	base64url(e) {
		return this._addCheck({
			kind: "base64url",
			...H.errToObj(e)
		});
	}
	jwt(e) {
		return this._addCheck({
			kind: "jwt",
			...H.errToObj(e)
		});
	}
	ip(e) {
		return this._addCheck({
			kind: "ip",
			...H.errToObj(e)
		});
	}
	cidr(e) {
		return this._addCheck({
			kind: "cidr",
			...H.errToObj(e)
		});
	}
	datetime(e) {
		return typeof e == "string" ? this._addCheck({
			kind: "datetime",
			precision: null,
			offset: !1,
			local: !1,
			message: e
		}) : this._addCheck({
			kind: "datetime",
			precision: e?.precision === void 0 ? null : e?.precision,
			offset: e?.offset ?? !1,
			local: e?.local ?? !1,
			...H.errToObj(e?.message)
		});
	}
	date(e) {
		return this._addCheck({
			kind: "date",
			message: e
		});
	}
	time(e) {
		return typeof e == "string" ? this._addCheck({
			kind: "time",
			precision: null,
			message: e
		}) : this._addCheck({
			kind: "time",
			precision: e?.precision === void 0 ? null : e?.precision,
			...H.errToObj(e?.message)
		});
	}
	duration(e) {
		return this._addCheck({
			kind: "duration",
			...H.errToObj(e)
		});
	}
	regex(e, t) {
		return this._addCheck({
			kind: "regex",
			regex: e,
			...H.errToObj(t)
		});
	}
	includes(e, t) {
		return this._addCheck({
			kind: "includes",
			value: e,
			position: t?.position,
			...H.errToObj(t?.message)
		});
	}
	startsWith(e, t) {
		return this._addCheck({
			kind: "startsWith",
			value: e,
			...H.errToObj(t)
		});
	}
	endsWith(e, t) {
		return this._addCheck({
			kind: "endsWith",
			value: e,
			...H.errToObj(t)
		});
	}
	min(e, t) {
		return this._addCheck({
			kind: "min",
			value: e,
			...H.errToObj(t)
		});
	}
	max(e, t) {
		return this._addCheck({
			kind: "max",
			value: e,
			...H.errToObj(t)
		});
	}
	length(e, t) {
		return this._addCheck({
			kind: "length",
			value: e,
			...H.errToObj(t)
		});
	}
	nonempty(e) {
		return this.min(1, H.errToObj(e));
	}
	trim() {
		return new e({
			...this._def,
			checks: [...this._def.checks, { kind: "trim" }]
		});
	}
	toLowerCase() {
		return new e({
			...this._def,
			checks: [...this._def.checks, { kind: "toLowerCase" }]
		});
	}
	toUpperCase() {
		return new e({
			...this._def,
			checks: [...this._def.checks, { kind: "toUpperCase" }]
		});
	}
	get isDatetime() {
		return !!this._def.checks.find((e) => e.kind === "datetime");
	}
	get isDate() {
		return !!this._def.checks.find((e) => e.kind === "date");
	}
	get isTime() {
		return !!this._def.checks.find((e) => e.kind === "time");
	}
	get isDuration() {
		return !!this._def.checks.find((e) => e.kind === "duration");
	}
	get isEmail() {
		return !!this._def.checks.find((e) => e.kind === "email");
	}
	get isURL() {
		return !!this._def.checks.find((e) => e.kind === "url");
	}
	get isEmoji() {
		return !!this._def.checks.find((e) => e.kind === "emoji");
	}
	get isUUID() {
		return !!this._def.checks.find((e) => e.kind === "uuid");
	}
	get isNANOID() {
		return !!this._def.checks.find((e) => e.kind === "nanoid");
	}
	get isCUID() {
		return !!this._def.checks.find((e) => e.kind === "cuid");
	}
	get isCUID2() {
		return !!this._def.checks.find((e) => e.kind === "cuid2");
	}
	get isULID() {
		return !!this._def.checks.find((e) => e.kind === "ulid");
	}
	get isIP() {
		return !!this._def.checks.find((e) => e.kind === "ip");
	}
	get isCIDR() {
		return !!this._def.checks.find((e) => e.kind === "cidr");
	}
	get isBase64() {
		return !!this._def.checks.find((e) => e.kind === "base64");
	}
	get isBase64url() {
		return !!this._def.checks.find((e) => e.kind === "base64url");
	}
	get minLength() {
		let e = null;
		for (let t of this._def.checks) t.kind === "min" && (e === null || t.value > e) && (e = t.value);
		return e;
	}
	get maxLength() {
		let e = null;
		for (let t of this._def.checks) t.kind === "max" && (e === null || t.value < e) && (e = t.value);
		return e;
	}
};
cg.create = (e) => new cg({
	checks: [],
	typeName: G.ZodString,
	coerce: e?.coerce ?? !1,
	...U(e)
});
function lg(e, t) {
	let n = (e.toString().split(".")[1] || "").length, r = (t.toString().split(".")[1] || "").length, i = n > r ? n : r;
	return Number.parseInt(e.toFixed(i).replace(".", "")) % Number.parseInt(t.toFixed(i).replace(".", "")) / 10 ** i;
}
var ug = class e extends W {
	constructor() {
		super(...arguments), this.min = this.gte, this.max = this.lte, this.step = this.multipleOf;
	}
	_parse(e) {
		if (this._def.coerce && (e.data = Number(e.data)), this._getType(e) !== R.number) {
			let t = this._getOrReturnCtx(e);
			return B(t, {
				code: z.invalid_type,
				expected: R.number,
				received: t.parsedType
			}), V;
		}
		let t, n = new kh();
		for (let r of this._def.checks) r.kind === "int" ? L.isInteger(e.data) || (t = this._getOrReturnCtx(e, t), B(t, {
			code: z.invalid_type,
			expected: "integer",
			received: "float",
			message: r.message
		}), n.dirty()) : r.kind === "min" ? (r.inclusive ? e.data < r.value : e.data <= r.value) && (t = this._getOrReturnCtx(e, t), B(t, {
			code: z.too_small,
			minimum: r.value,
			type: "number",
			inclusive: r.inclusive,
			exact: !1,
			message: r.message
		}), n.dirty()) : r.kind === "max" ? (r.inclusive ? e.data > r.value : e.data >= r.value) && (t = this._getOrReturnCtx(e, t), B(t, {
			code: z.too_big,
			maximum: r.value,
			type: "number",
			inclusive: r.inclusive,
			exact: !1,
			message: r.message
		}), n.dirty()) : r.kind === "multipleOf" ? lg(e.data, r.value) !== 0 && (t = this._getOrReturnCtx(e, t), B(t, {
			code: z.not_multiple_of,
			multipleOf: r.value,
			message: r.message
		}), n.dirty()) : r.kind === "finite" ? Number.isFinite(e.data) || (t = this._getOrReturnCtx(e, t), B(t, {
			code: z.not_finite,
			message: r.message
		}), n.dirty()) : L.assertNever(r);
		return {
			status: n.value,
			value: e.data
		};
	}
	gte(e, t) {
		return this.setLimit("min", e, !0, H.toString(t));
	}
	gt(e, t) {
		return this.setLimit("min", e, !1, H.toString(t));
	}
	lte(e, t) {
		return this.setLimit("max", e, !0, H.toString(t));
	}
	lt(e, t) {
		return this.setLimit("max", e, !1, H.toString(t));
	}
	setLimit(t, n, r, i) {
		return new e({
			...this._def,
			checks: [...this._def.checks, {
				kind: t,
				value: n,
				inclusive: r,
				message: H.toString(i)
			}]
		});
	}
	_addCheck(t) {
		return new e({
			...this._def,
			checks: [...this._def.checks, t]
		});
	}
	int(e) {
		return this._addCheck({
			kind: "int",
			message: H.toString(e)
		});
	}
	positive(e) {
		return this._addCheck({
			kind: "min",
			value: 0,
			inclusive: !1,
			message: H.toString(e)
		});
	}
	negative(e) {
		return this._addCheck({
			kind: "max",
			value: 0,
			inclusive: !1,
			message: H.toString(e)
		});
	}
	nonpositive(e) {
		return this._addCheck({
			kind: "max",
			value: 0,
			inclusive: !0,
			message: H.toString(e)
		});
	}
	nonnegative(e) {
		return this._addCheck({
			kind: "min",
			value: 0,
			inclusive: !0,
			message: H.toString(e)
		});
	}
	multipleOf(e, t) {
		return this._addCheck({
			kind: "multipleOf",
			value: e,
			message: H.toString(t)
		});
	}
	finite(e) {
		return this._addCheck({
			kind: "finite",
			message: H.toString(e)
		});
	}
	safe(e) {
		return this._addCheck({
			kind: "min",
			inclusive: !0,
			value: -(2 ** 53 - 1),
			message: H.toString(e)
		})._addCheck({
			kind: "max",
			inclusive: !0,
			value: 2 ** 53 - 1,
			message: H.toString(e)
		});
	}
	get minValue() {
		let e = null;
		for (let t of this._def.checks) t.kind === "min" && (e === null || t.value > e) && (e = t.value);
		return e;
	}
	get maxValue() {
		let e = null;
		for (let t of this._def.checks) t.kind === "max" && (e === null || t.value < e) && (e = t.value);
		return e;
	}
	get isInt() {
		return !!this._def.checks.find((e) => e.kind === "int" || e.kind === "multipleOf" && L.isInteger(e.value));
	}
	get isFinite() {
		let e = null, t = null;
		for (let n of this._def.checks) if (n.kind === "finite" || n.kind === "int" || n.kind === "multipleOf") return !0;
		else n.kind === "min" ? (t === null || n.value > t) && (t = n.value) : n.kind === "max" && (e === null || n.value < e) && (e = n.value);
		return Number.isFinite(t) && Number.isFinite(e);
	}
};
ug.create = (e) => new ug({
	checks: [],
	typeName: G.ZodNumber,
	coerce: e?.coerce || !1,
	...U(e)
});
var dg = class e extends W {
	constructor() {
		super(...arguments), this.min = this.gte, this.max = this.lte;
	}
	_parse(e) {
		if (this._def.coerce) try {
			e.data = BigInt(e.data);
		} catch {
			return this._getInvalidInput(e);
		}
		if (this._getType(e) !== R.bigint) return this._getInvalidInput(e);
		let t, n = new kh();
		for (let r of this._def.checks) r.kind === "min" ? (r.inclusive ? e.data < r.value : e.data <= r.value) && (t = this._getOrReturnCtx(e, t), B(t, {
			code: z.too_small,
			type: "bigint",
			minimum: r.value,
			inclusive: r.inclusive,
			message: r.message
		}), n.dirty()) : r.kind === "max" ? (r.inclusive ? e.data > r.value : e.data >= r.value) && (t = this._getOrReturnCtx(e, t), B(t, {
			code: z.too_big,
			type: "bigint",
			maximum: r.value,
			inclusive: r.inclusive,
			message: r.message
		}), n.dirty()) : r.kind === "multipleOf" ? e.data % r.value !== BigInt(0) && (t = this._getOrReturnCtx(e, t), B(t, {
			code: z.not_multiple_of,
			multipleOf: r.value,
			message: r.message
		}), n.dirty()) : L.assertNever(r);
		return {
			status: n.value,
			value: e.data
		};
	}
	_getInvalidInput(e) {
		let t = this._getOrReturnCtx(e);
		return B(t, {
			code: z.invalid_type,
			expected: R.bigint,
			received: t.parsedType
		}), V;
	}
	gte(e, t) {
		return this.setLimit("min", e, !0, H.toString(t));
	}
	gt(e, t) {
		return this.setLimit("min", e, !1, H.toString(t));
	}
	lte(e, t) {
		return this.setLimit("max", e, !0, H.toString(t));
	}
	lt(e, t) {
		return this.setLimit("max", e, !1, H.toString(t));
	}
	setLimit(t, n, r, i) {
		return new e({
			...this._def,
			checks: [...this._def.checks, {
				kind: t,
				value: n,
				inclusive: r,
				message: H.toString(i)
			}]
		});
	}
	_addCheck(t) {
		return new e({
			...this._def,
			checks: [...this._def.checks, t]
		});
	}
	positive(e) {
		return this._addCheck({
			kind: "min",
			value: BigInt(0),
			inclusive: !1,
			message: H.toString(e)
		});
	}
	negative(e) {
		return this._addCheck({
			kind: "max",
			value: BigInt(0),
			inclusive: !1,
			message: H.toString(e)
		});
	}
	nonpositive(e) {
		return this._addCheck({
			kind: "max",
			value: BigInt(0),
			inclusive: !0,
			message: H.toString(e)
		});
	}
	nonnegative(e) {
		return this._addCheck({
			kind: "min",
			value: BigInt(0),
			inclusive: !0,
			message: H.toString(e)
		});
	}
	multipleOf(e, t) {
		return this._addCheck({
			kind: "multipleOf",
			value: e,
			message: H.toString(t)
		});
	}
	get minValue() {
		let e = null;
		for (let t of this._def.checks) t.kind === "min" && (e === null || t.value > e) && (e = t.value);
		return e;
	}
	get maxValue() {
		let e = null;
		for (let t of this._def.checks) t.kind === "max" && (e === null || t.value < e) && (e = t.value);
		return e;
	}
};
dg.create = (e) => new dg({
	checks: [],
	typeName: G.ZodBigInt,
	coerce: e?.coerce ?? !1,
	...U(e)
});
var fg = class extends W {
	_parse(e) {
		if (this._def.coerce && (e.data = !!e.data), this._getType(e) !== R.boolean) {
			let t = this._getOrReturnCtx(e);
			return B(t, {
				code: z.invalid_type,
				expected: R.boolean,
				received: t.parsedType
			}), V;
		}
		return jh(e.data);
	}
};
fg.create = (e) => new fg({
	typeName: G.ZodBoolean,
	coerce: e?.coerce || !1,
	...U(e)
});
var pg = class e extends W {
	_parse(e) {
		if (this._def.coerce && (e.data = new Date(e.data)), this._getType(e) !== R.date) {
			let t = this._getOrReturnCtx(e);
			return B(t, {
				code: z.invalid_type,
				expected: R.date,
				received: t.parsedType
			}), V;
		}
		if (Number.isNaN(e.data.getTime())) return B(this._getOrReturnCtx(e), { code: z.invalid_date }), V;
		let t = new kh(), n;
		for (let r of this._def.checks) r.kind === "min" ? e.data.getTime() < r.value && (n = this._getOrReturnCtx(e, n), B(n, {
			code: z.too_small,
			message: r.message,
			inclusive: !0,
			exact: !1,
			minimum: r.value,
			type: "date"
		}), t.dirty()) : r.kind === "max" ? e.data.getTime() > r.value && (n = this._getOrReturnCtx(e, n), B(n, {
			code: z.too_big,
			message: r.message,
			inclusive: !0,
			exact: !1,
			maximum: r.value,
			type: "date"
		}), t.dirty()) : L.assertNever(r);
		return {
			status: t.value,
			value: new Date(e.data.getTime())
		};
	}
	_addCheck(t) {
		return new e({
			...this._def,
			checks: [...this._def.checks, t]
		});
	}
	min(e, t) {
		return this._addCheck({
			kind: "min",
			value: e.getTime(),
			message: H.toString(t)
		});
	}
	max(e, t) {
		return this._addCheck({
			kind: "max",
			value: e.getTime(),
			message: H.toString(t)
		});
	}
	get minDate() {
		let e = null;
		for (let t of this._def.checks) t.kind === "min" && (e === null || t.value > e) && (e = t.value);
		return e == null ? null : new Date(e);
	}
	get maxDate() {
		let e = null;
		for (let t of this._def.checks) t.kind === "max" && (e === null || t.value < e) && (e = t.value);
		return e == null ? null : new Date(e);
	}
};
pg.create = (e) => new pg({
	checks: [],
	coerce: e?.coerce || !1,
	typeName: G.ZodDate,
	...U(e)
});
var mg = class extends W {
	_parse(e) {
		if (this._getType(e) !== R.symbol) {
			let t = this._getOrReturnCtx(e);
			return B(t, {
				code: z.invalid_type,
				expected: R.symbol,
				received: t.parsedType
			}), V;
		}
		return jh(e.data);
	}
};
mg.create = (e) => new mg({
	typeName: G.ZodSymbol,
	...U(e)
});
var hg = class extends W {
	_parse(e) {
		if (this._getType(e) !== R.undefined) {
			let t = this._getOrReturnCtx(e);
			return B(t, {
				code: z.invalid_type,
				expected: R.undefined,
				received: t.parsedType
			}), V;
		}
		return jh(e.data);
	}
};
hg.create = (e) => new hg({
	typeName: G.ZodUndefined,
	...U(e)
});
var gg = class extends W {
	_parse(e) {
		if (this._getType(e) !== R.null) {
			let t = this._getOrReturnCtx(e);
			return B(t, {
				code: z.invalid_type,
				expected: R.null,
				received: t.parsedType
			}), V;
		}
		return jh(e.data);
	}
};
gg.create = (e) => new gg({
	typeName: G.ZodNull,
	...U(e)
});
var _g = class extends W {
	constructor() {
		super(...arguments), this._any = !0;
	}
	_parse(e) {
		return jh(e.data);
	}
};
_g.create = (e) => new _g({
	typeName: G.ZodAny,
	...U(e)
});
var vg = class extends W {
	constructor() {
		super(...arguments), this._unknown = !0;
	}
	_parse(e) {
		return jh(e.data);
	}
};
vg.create = (e) => new vg({
	typeName: G.ZodUnknown,
	...U(e)
});
var yg = class extends W {
	_parse(e) {
		let t = this._getOrReturnCtx(e);
		return B(t, {
			code: z.invalid_type,
			expected: R.never,
			received: t.parsedType
		}), V;
	}
};
yg.create = (e) => new yg({
	typeName: G.ZodNever,
	...U(e)
});
var bg = class extends W {
	_parse(e) {
		if (this._getType(e) !== R.undefined) {
			let t = this._getOrReturnCtx(e);
			return B(t, {
				code: z.invalid_type,
				expected: R.void,
				received: t.parsedType
			}), V;
		}
		return jh(e.data);
	}
};
bg.create = (e) => new bg({
	typeName: G.ZodVoid,
	...U(e)
});
var xg = class e extends W {
	_parse(e) {
		let { ctx: t, status: n } = this._processInputParams(e), r = this._def;
		if (t.parsedType !== R.array) return B(t, {
			code: z.invalid_type,
			expected: R.array,
			received: t.parsedType
		}), V;
		if (r.exactLength !== null) {
			let e = t.data.length > r.exactLength.value, i = t.data.length < r.exactLength.value;
			(e || i) && (B(t, {
				code: e ? z.too_big : z.too_small,
				minimum: i ? r.exactLength.value : void 0,
				maximum: e ? r.exactLength.value : void 0,
				type: "array",
				inclusive: !0,
				exact: !0,
				message: r.exactLength.message
			}), n.dirty());
		}
		if (r.minLength !== null && t.data.length < r.minLength.value && (B(t, {
			code: z.too_small,
			minimum: r.minLength.value,
			type: "array",
			inclusive: !0,
			exact: !1,
			message: r.minLength.message
		}), n.dirty()), r.maxLength !== null && t.data.length > r.maxLength.value && (B(t, {
			code: z.too_big,
			maximum: r.maxLength.value,
			type: "array",
			inclusive: !0,
			exact: !1,
			message: r.maxLength.message
		}), n.dirty()), t.common.async) return Promise.all([...t.data].map((e, n) => r.type._parseAsync(new Ih(t, e, t.path, n)))).then((e) => kh.mergeArray(n, e));
		let i = [...t.data].map((e, n) => r.type._parseSync(new Ih(t, e, t.path, n)));
		return kh.mergeArray(n, i);
	}
	get element() {
		return this._def.type;
	}
	min(t, n) {
		return new e({
			...this._def,
			minLength: {
				value: t,
				message: H.toString(n)
			}
		});
	}
	max(t, n) {
		return new e({
			...this._def,
			maxLength: {
				value: t,
				message: H.toString(n)
			}
		});
	}
	length(t, n) {
		return new e({
			...this._def,
			exactLength: {
				value: t,
				message: H.toString(n)
			}
		});
	}
	nonempty(e) {
		return this.min(1, e);
	}
};
xg.create = (e, t) => new xg({
	type: e,
	minLength: null,
	maxLength: null,
	exactLength: null,
	typeName: G.ZodArray,
	...U(t)
});
function Sg(e) {
	if (e instanceof Cg) {
		let t = {};
		for (let n in e.shape) {
			let r = e.shape[n];
			t[n] = Vg.create(Sg(r));
		}
		return new Cg({
			...e._def,
			shape: () => t
		});
	}
	return e instanceof xg ? new xg({
		...e._def,
		type: Sg(e.element)
	}) : e instanceof Vg ? Vg.create(Sg(e.unwrap())) : e instanceof Hg ? Hg.create(Sg(e.unwrap())) : e instanceof kg ? kg.create(e.items.map((e) => Sg(e))) : e;
}
var Cg = class e extends W {
	constructor() {
		super(...arguments), this._cached = null, this.nonstrict = this.passthrough, this.augment = this.extend;
	}
	_getCached() {
		if (this._cached !== null) return this._cached;
		let e = this._def.shape(), t = L.objectKeys(e);
		return this._cached = {
			shape: e,
			keys: t
		}, this._cached;
	}
	_parse(e) {
		if (this._getType(e) !== R.object) {
			let t = this._getOrReturnCtx(e);
			return B(t, {
				code: z.invalid_type,
				expected: R.object,
				received: t.parsedType
			}), V;
		}
		let { status: t, ctx: n } = this._processInputParams(e), { shape: r, keys: i } = this._getCached(), a = [];
		if (!(this._def.catchall instanceof yg && this._def.unknownKeys === "strip")) for (let e in n.data) i.includes(e) || a.push(e);
		let o = [];
		for (let e of i) {
			let t = r[e], i = n.data[e];
			o.push({
				key: {
					status: "valid",
					value: e
				},
				value: t._parse(new Ih(n, i, n.path, e)),
				alwaysSet: e in n.data
			});
		}
		if (this._def.catchall instanceof yg) {
			let e = this._def.unknownKeys;
			if (e === "passthrough") for (let e of a) o.push({
				key: {
					status: "valid",
					value: e
				},
				value: {
					status: "valid",
					value: n.data[e]
				}
			});
			else if (e === "strict") a.length > 0 && (B(n, {
				code: z.unrecognized_keys,
				keys: a
			}), t.dirty());
			else if (e !== "strip") throw Error("Internal ZodObject error: invalid unknownKeys value.");
		} else {
			let e = this._def.catchall;
			for (let t of a) {
				let r = n.data[t];
				o.push({
					key: {
						status: "valid",
						value: t
					},
					value: e._parse(new Ih(n, r, n.path, t)),
					alwaysSet: t in n.data
				});
			}
		}
		return n.common.async ? Promise.resolve().then(async () => {
			let e = [];
			for (let t of o) {
				let n = await t.key, r = await t.value;
				e.push({
					key: n,
					value: r,
					alwaysSet: t.alwaysSet
				});
			}
			return e;
		}).then((e) => kh.mergeObjectSync(t, e)) : kh.mergeObjectSync(t, o);
	}
	get shape() {
		return this._def.shape();
	}
	strict(t) {
		return H.errToObj, new e({
			...this._def,
			unknownKeys: "strict",
			...t === void 0 ? {} : { errorMap: (e, n) => {
				let r = this._def.errorMap?.(e, n).message ?? n.defaultError;
				return e.code === "unrecognized_keys" ? { message: H.errToObj(t).message ?? r } : { message: r };
			} }
		});
	}
	strip() {
		return new e({
			...this._def,
			unknownKeys: "strip"
		});
	}
	passthrough() {
		return new e({
			...this._def,
			unknownKeys: "passthrough"
		});
	}
	extend(t) {
		return new e({
			...this._def,
			shape: () => ({
				...this._def.shape(),
				...t
			})
		});
	}
	merge(t) {
		return new e({
			unknownKeys: t._def.unknownKeys,
			catchall: t._def.catchall,
			shape: () => ({
				...this._def.shape(),
				...t._def.shape()
			}),
			typeName: G.ZodObject
		});
	}
	setKey(e, t) {
		return this.augment({ [e]: t });
	}
	catchall(t) {
		return new e({
			...this._def,
			catchall: t
		});
	}
	pick(t) {
		let n = {};
		for (let e of L.objectKeys(t)) t[e] && this.shape[e] && (n[e] = this.shape[e]);
		return new e({
			...this._def,
			shape: () => n
		});
	}
	omit(t) {
		let n = {};
		for (let e of L.objectKeys(this.shape)) t[e] || (n[e] = this.shape[e]);
		return new e({
			...this._def,
			shape: () => n
		});
	}
	deepPartial() {
		return Sg(this);
	}
	partial(t) {
		let n = {};
		for (let e of L.objectKeys(this.shape)) {
			let r = this.shape[e];
			n[e] = t && !t[e] ? r : r.optional();
		}
		return new e({
			...this._def,
			shape: () => n
		});
	}
	required(t) {
		let n = {};
		for (let e of L.objectKeys(this.shape)) if (t && !t[e]) n[e] = this.shape[e];
		else {
			let t = this.shape[e];
			for (; t instanceof Vg;) t = t._def.innerType;
			n[e] = t;
		}
		return new e({
			...this._def,
			shape: () => n
		});
	}
	keyof() {
		return Ig(L.objectKeys(this.shape));
	}
};
Cg.create = (e, t) => new Cg({
	shape: () => e,
	unknownKeys: "strip",
	catchall: yg.create(),
	typeName: G.ZodObject,
	...U(t)
}), Cg.strictCreate = (e, t) => new Cg({
	shape: () => e,
	unknownKeys: "strict",
	catchall: yg.create(),
	typeName: G.ZodObject,
	...U(t)
}), Cg.lazycreate = (e, t) => new Cg({
	shape: e,
	unknownKeys: "strip",
	catchall: yg.create(),
	typeName: G.ZodObject,
	...U(t)
});
var wg = class extends W {
	_parse(e) {
		let { ctx: t } = this._processInputParams(e), n = this._def.options;
		function r(e) {
			for (let t of e) if (t.result.status === "valid") return t.result;
			for (let n of e) if (n.result.status === "dirty") return t.common.issues.push(...n.ctx.common.issues), n.result;
			let n = e.map((e) => new wh(e.ctx.common.issues));
			return B(t, {
				code: z.invalid_union,
				unionErrors: n
			}), V;
		}
		if (t.common.async) return Promise.all(n.map(async (e) => {
			let n = {
				...t,
				common: {
					...t.common,
					issues: []
				},
				parent: null
			};
			return {
				result: await e._parseAsync({
					data: t.data,
					path: t.path,
					parent: n
				}),
				ctx: n
			};
		})).then(r);
		{
			let e, r = [];
			for (let i of n) {
				let n = {
					...t,
					common: {
						...t.common,
						issues: []
					},
					parent: null
				}, a = i._parseSync({
					data: t.data,
					path: t.path,
					parent: n
				});
				if (a.status === "valid") return a;
				a.status === "dirty" && !e && (e = {
					result: a,
					ctx: n
				}), n.common.issues.length && r.push(n.common.issues);
			}
			if (e) return t.common.issues.push(...e.ctx.common.issues), e.result;
			let i = r.map((e) => new wh(e));
			return B(t, {
				code: z.invalid_union,
				unionErrors: i
			}), V;
		}
	}
	get options() {
		return this._def.options;
	}
};
wg.create = (e, t) => new wg({
	options: e,
	typeName: G.ZodUnion,
	...U(t)
});
var Tg = (e) => e instanceof Pg ? Tg(e.schema) : e instanceof Bg ? Tg(e.innerType()) : e instanceof Fg ? [e.value] : e instanceof Lg ? e.options : e instanceof Rg ? L.objectValues(e.enum) : e instanceof Ug ? Tg(e._def.innerType) : e instanceof hg ? [void 0] : e instanceof gg ? [null] : e instanceof Vg ? [void 0, ...Tg(e.unwrap())] : e instanceof Hg ? [null, ...Tg(e.unwrap())] : e instanceof Kg || e instanceof Jg ? Tg(e.unwrap()) : e instanceof Wg ? Tg(e._def.innerType) : [], Eg = class e extends W {
	_parse(e) {
		let { ctx: t } = this._processInputParams(e);
		if (t.parsedType !== R.object) return B(t, {
			code: z.invalid_type,
			expected: R.object,
			received: t.parsedType
		}), V;
		let n = this.discriminator, r = t.data[n], i = this.optionsMap.get(r);
		return i ? t.common.async ? i._parseAsync({
			data: t.data,
			path: t.path,
			parent: t
		}) : i._parseSync({
			data: t.data,
			path: t.path,
			parent: t
		}) : (B(t, {
			code: z.invalid_union_discriminator,
			options: Array.from(this.optionsMap.keys()),
			path: [n]
		}), V);
	}
	get discriminator() {
		return this._def.discriminator;
	}
	get options() {
		return this._def.options;
	}
	get optionsMap() {
		return this._def.optionsMap;
	}
	static create(t, n, r) {
		let i = /* @__PURE__ */ new Map();
		for (let e of n) {
			let n = Tg(e.shape[t]);
			if (!n.length) throw Error(`A discriminator value for key \`${t}\` could not be extracted from all schema options`);
			for (let r of n) {
				if (i.has(r)) throw Error(`Discriminator property ${String(t)} has duplicate value ${String(r)}`);
				i.set(r, e);
			}
		}
		return new e({
			typeName: G.ZodDiscriminatedUnion,
			discriminator: t,
			options: n,
			optionsMap: i,
			...U(r)
		});
	}
};
function Dg(e, t) {
	let n = Ch(e), r = Ch(t);
	if (e === t) return {
		valid: !0,
		data: e
	};
	if (n === R.object && r === R.object) {
		let n = L.objectKeys(t), r = L.objectKeys(e).filter((e) => n.indexOf(e) !== -1), i = {
			...e,
			...t
		};
		Object.prototype.hasOwnProperty.call(i, "__proto__") && delete i.__proto__;
		for (let n of r) {
			if (n === "__proto__") continue;
			let r = Dg(e[n], t[n]);
			if (!r.valid) return { valid: !1 };
			i[n] = r.data;
		}
		return {
			valid: !0,
			data: i
		};
	}
	if (n === R.array && r === R.array) {
		if (e.length !== t.length) return { valid: !1 };
		let n = [];
		for (let r = 0; r < e.length; r++) {
			let i = e[r], a = t[r], o = Dg(i, a);
			if (!o.valid) return { valid: !1 };
			n.push(o.data);
		}
		return {
			valid: !0,
			data: n
		};
	}
	return n === R.date && r === R.date && +e == +t ? {
		valid: !0,
		data: e
	} : { valid: !1 };
}
var Og = class extends W {
	_parse(e) {
		let { status: t, ctx: n } = this._processInputParams(e), r = (e, r) => {
			if (Mh(e) || Mh(r)) return V;
			let i = Dg(e.value, r.value);
			return i.valid ? ((Nh(e) || Nh(r)) && t.dirty(), {
				status: t.value,
				value: i.data
			}) : (B(n, { code: z.invalid_intersection_types }), V);
		};
		return n.common.async ? Promise.all([this._def.left._parseAsync({
			data: n.data,
			path: n.path,
			parent: n
		}), this._def.right._parseAsync({
			data: n.data,
			path: n.path,
			parent: n
		})]).then(([e, t]) => r(e, t)) : r(this._def.left._parseSync({
			data: n.data,
			path: n.path,
			parent: n
		}), this._def.right._parseSync({
			data: n.data,
			path: n.path,
			parent: n
		}));
	}
};
Og.create = (e, t, n) => new Og({
	left: e,
	right: t,
	typeName: G.ZodIntersection,
	...U(n)
});
var kg = class e extends W {
	_parse(e) {
		let { status: t, ctx: n } = this._processInputParams(e);
		if (n.parsedType !== R.array) return B(n, {
			code: z.invalid_type,
			expected: R.array,
			received: n.parsedType
		}), V;
		if (n.data.length < this._def.items.length) return B(n, {
			code: z.too_small,
			minimum: this._def.items.length,
			inclusive: !0,
			exact: !1,
			type: "array"
		}), V;
		!this._def.rest && n.data.length > this._def.items.length && (B(n, {
			code: z.too_big,
			maximum: this._def.items.length,
			inclusive: !0,
			exact: !1,
			type: "array"
		}), t.dirty());
		let r = [...n.data].map((e, t) => {
			let r = this._def.items[t] || this._def.rest;
			return r ? r._parse(new Ih(n, e, n.path, t)) : null;
		}).filter((e) => !!e);
		return n.common.async ? Promise.all(r).then((e) => kh.mergeArray(t, e)) : kh.mergeArray(t, r);
	}
	get items() {
		return this._def.items;
	}
	rest(t) {
		return new e({
			...this._def,
			rest: t
		});
	}
};
kg.create = (e, t) => {
	if (!Array.isArray(e)) throw Error("You must pass an array of schemas to z.tuple([ ... ])");
	return new kg({
		items: e,
		typeName: G.ZodTuple,
		rest: null,
		...U(t)
	});
};
var Ag = class e extends W {
	get keySchema() {
		return this._def.keyType;
	}
	get valueSchema() {
		return this._def.valueType;
	}
	_parse(e) {
		let { status: t, ctx: n } = this._processInputParams(e);
		if (n.parsedType !== R.object) return B(n, {
			code: z.invalid_type,
			expected: R.object,
			received: n.parsedType
		}), V;
		let r = [], i = this._def.keyType, a = this._def.valueType;
		for (let e in n.data) r.push({
			key: i._parse(new Ih(n, e, n.path, e)),
			value: a._parse(new Ih(n, n.data[e], n.path, e)),
			alwaysSet: e in n.data
		});
		return n.common.async ? kh.mergeObjectAsync(t, r) : kh.mergeObjectSync(t, r);
	}
	get element() {
		return this._def.valueType;
	}
	static create(t, n, r) {
		return n instanceof W ? new e({
			keyType: t,
			valueType: n,
			typeName: G.ZodRecord,
			...U(r)
		}) : new e({
			keyType: cg.create(),
			valueType: t,
			typeName: G.ZodRecord,
			...U(n)
		});
	}
}, jg = class extends W {
	get keySchema() {
		return this._def.keyType;
	}
	get valueSchema() {
		return this._def.valueType;
	}
	_parse(e) {
		let { status: t, ctx: n } = this._processInputParams(e);
		if (n.parsedType !== R.map) return B(n, {
			code: z.invalid_type,
			expected: R.map,
			received: n.parsedType
		}), V;
		let r = this._def.keyType, i = this._def.valueType, a = [...n.data.entries()].map(([e, t], a) => ({
			key: r._parse(new Ih(n, e, n.path, [a, "key"])),
			value: i._parse(new Ih(n, t, n.path, [a, "value"]))
		}));
		if (n.common.async) {
			let e = /* @__PURE__ */ new Map();
			return Promise.resolve().then(async () => {
				for (let n of a) {
					let r = await n.key, i = await n.value;
					if (r.status === "aborted" || i.status === "aborted") return V;
					(r.status === "dirty" || i.status === "dirty") && t.dirty(), e.set(r.value, i.value);
				}
				return {
					status: t.value,
					value: e
				};
			});
		}
		{
			let e = /* @__PURE__ */ new Map();
			for (let n of a) {
				let r = n.key, i = n.value;
				if (r.status === "aborted" || i.status === "aborted") return V;
				(r.status === "dirty" || i.status === "dirty") && t.dirty(), e.set(r.value, i.value);
			}
			return {
				status: t.value,
				value: e
			};
		}
	}
};
jg.create = (e, t, n) => new jg({
	valueType: t,
	keyType: e,
	typeName: G.ZodMap,
	...U(n)
});
var Mg = class e extends W {
	_parse(e) {
		let { status: t, ctx: n } = this._processInputParams(e);
		if (n.parsedType !== R.set) return B(n, {
			code: z.invalid_type,
			expected: R.set,
			received: n.parsedType
		}), V;
		let r = this._def;
		r.minSize !== null && n.data.size < r.minSize.value && (B(n, {
			code: z.too_small,
			minimum: r.minSize.value,
			type: "set",
			inclusive: !0,
			exact: !1,
			message: r.minSize.message
		}), t.dirty()), r.maxSize !== null && n.data.size > r.maxSize.value && (B(n, {
			code: z.too_big,
			maximum: r.maxSize.value,
			type: "set",
			inclusive: !0,
			exact: !1,
			message: r.maxSize.message
		}), t.dirty());
		let i = this._def.valueType;
		function a(e) {
			let n = /* @__PURE__ */ new Set();
			for (let r of e) {
				if (r.status === "aborted") return V;
				r.status === "dirty" && t.dirty(), n.add(r.value);
			}
			return {
				status: t.value,
				value: n
			};
		}
		let o = [...n.data.values()].map((e, t) => i._parse(new Ih(n, e, n.path, t)));
		return n.common.async ? Promise.all(o).then((e) => a(e)) : a(o);
	}
	min(t, n) {
		return new e({
			...this._def,
			minSize: {
				value: t,
				message: H.toString(n)
			}
		});
	}
	max(t, n) {
		return new e({
			...this._def,
			maxSize: {
				value: t,
				message: H.toString(n)
			}
		});
	}
	size(e, t) {
		return this.min(e, t).max(e, t);
	}
	nonempty(e) {
		return this.min(1, e);
	}
};
Mg.create = (e, t) => new Mg({
	valueType: e,
	minSize: null,
	maxSize: null,
	typeName: G.ZodSet,
	...U(t)
});
var Ng = class e extends W {
	constructor() {
		super(...arguments), this.validate = this.implement;
	}
	_parse(e) {
		let { ctx: t } = this._processInputParams(e);
		if (t.parsedType !== R.function) return B(t, {
			code: z.invalid_type,
			expected: R.function,
			received: t.parsedType
		}), V;
		function n(e, n) {
			return Oh({
				data: e,
				path: t.path,
				errorMaps: [
					t.common.contextualErrorMap,
					t.schemaErrorMap,
					Dh(),
					Th
				].filter((e) => !!e),
				issueData: {
					code: z.invalid_arguments,
					argumentsError: n
				}
			});
		}
		function r(e, n) {
			return Oh({
				data: e,
				path: t.path,
				errorMaps: [
					t.common.contextualErrorMap,
					t.schemaErrorMap,
					Dh(),
					Th
				].filter((e) => !!e),
				issueData: {
					code: z.invalid_return_type,
					returnTypeError: n
				}
			});
		}
		let i = { errorMap: t.common.contextualErrorMap }, a = t.data;
		if (this._def.returns instanceof zg) {
			let e = this;
			return jh(async function(...t) {
				let o = new wh([]), s = await e._def.args.parseAsync(t, i).catch((e) => {
					throw o.addIssue(n(t, e)), o;
				}), c = await Reflect.apply(a, this, s);
				return await e._def.returns._def.type.parseAsync(c, i).catch((e) => {
					throw o.addIssue(r(c, e)), o;
				});
			});
		}
		{
			let e = this;
			return jh(function(...t) {
				let o = e._def.args.safeParse(t, i);
				if (!o.success) throw new wh([n(t, o.error)]);
				let s = Reflect.apply(a, this, o.data), c = e._def.returns.safeParse(s, i);
				if (!c.success) throw new wh([r(s, c.error)]);
				return c.data;
			});
		}
	}
	parameters() {
		return this._def.args;
	}
	returnType() {
		return this._def.returns;
	}
	args(...t) {
		return new e({
			...this._def,
			args: kg.create(t).rest(vg.create())
		});
	}
	returns(t) {
		return new e({
			...this._def,
			returns: t
		});
	}
	implement(e) {
		return this.parse(e);
	}
	strictImplement(e) {
		return this.parse(e);
	}
	static create(t, n, r) {
		return new e({
			args: t || kg.create([]).rest(vg.create()),
			returns: n || vg.create(),
			typeName: G.ZodFunction,
			...U(r)
		});
	}
}, Pg = class extends W {
	get schema() {
		return this._def.getter();
	}
	_parse(e) {
		let { ctx: t } = this._processInputParams(e);
		return this._def.getter()._parse({
			data: t.data,
			path: t.path,
			parent: t
		});
	}
};
Pg.create = (e, t) => new Pg({
	getter: e,
	typeName: G.ZodLazy,
	...U(t)
});
var Fg = class extends W {
	_parse(e) {
		if (e.data !== this._def.value) {
			let t = this._getOrReturnCtx(e);
			return B(t, {
				received: t.data,
				code: z.invalid_literal,
				expected: this._def.value
			}), V;
		}
		return {
			status: "valid",
			value: e.data
		};
	}
	get value() {
		return this._def.value;
	}
};
Fg.create = (e, t) => new Fg({
	value: e,
	typeName: G.ZodLiteral,
	...U(t)
});
function Ig(e, t) {
	return new Lg({
		values: e,
		typeName: G.ZodEnum,
		...U(t)
	});
}
var Lg = class e extends W {
	_parse(e) {
		if (typeof e.data != "string") {
			let t = this._getOrReturnCtx(e), n = this._def.values;
			return B(t, {
				expected: L.joinValues(n),
				received: t.parsedType,
				code: z.invalid_type
			}), V;
		}
		if (this._cache ||= new Set(this._def.values), !this._cache.has(e.data)) {
			let t = this._getOrReturnCtx(e), n = this._def.values;
			return B(t, {
				received: t.data,
				code: z.invalid_enum_value,
				options: n
			}), V;
		}
		return jh(e.data);
	}
	get options() {
		return this._def.values;
	}
	get enum() {
		let e = {};
		for (let t of this._def.values) e[t] = t;
		return e;
	}
	get Values() {
		let e = {};
		for (let t of this._def.values) e[t] = t;
		return e;
	}
	get Enum() {
		let e = {};
		for (let t of this._def.values) e[t] = t;
		return e;
	}
	extract(t, n = this._def) {
		return e.create(t, {
			...this._def,
			...n
		});
	}
	exclude(t, n = this._def) {
		return e.create(this.options.filter((e) => !t.includes(e)), {
			...this._def,
			...n
		});
	}
};
Lg.create = Ig;
var Rg = class extends W {
	_parse(e) {
		let t = L.getValidEnumValues(this._def.values), n = this._getOrReturnCtx(e);
		if (n.parsedType !== R.string && n.parsedType !== R.number) {
			let e = L.objectValues(t);
			return B(n, {
				expected: L.joinValues(e),
				received: n.parsedType,
				code: z.invalid_type
			}), V;
		}
		if (this._cache ||= new Set(L.getValidEnumValues(this._def.values)), !this._cache.has(e.data)) {
			let e = L.objectValues(t);
			return B(n, {
				received: n.data,
				code: z.invalid_enum_value,
				options: e
			}), V;
		}
		return jh(e.data);
	}
	get enum() {
		return this._def.values;
	}
};
Rg.create = (e, t) => new Rg({
	values: e,
	typeName: G.ZodNativeEnum,
	...U(t)
});
var zg = class extends W {
	unwrap() {
		return this._def.type;
	}
	_parse(e) {
		let { ctx: t } = this._processInputParams(e);
		return t.parsedType !== R.promise && t.common.async === !1 ? (B(t, {
			code: z.invalid_type,
			expected: R.promise,
			received: t.parsedType
		}), V) : jh((t.parsedType === R.promise ? t.data : Promise.resolve(t.data)).then((e) => this._def.type.parseAsync(e, {
			path: t.path,
			errorMap: t.common.contextualErrorMap
		})));
	}
};
zg.create = (e, t) => new zg({
	type: e,
	typeName: G.ZodPromise,
	...U(t)
});
var Bg = class extends W {
	innerType() {
		return this._def.schema;
	}
	sourceType() {
		return this._def.schema._def.typeName === G.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
	}
	_parse(e) {
		let { status: t, ctx: n } = this._processInputParams(e), r = this._def.effect || null, i = {
			addIssue: (e) => {
				B(n, e), e.fatal ? t.abort() : t.dirty();
			},
			get path() {
				return n.path;
			}
		};
		if (i.addIssue = i.addIssue.bind(i), r.type === "preprocess") {
			let e = r.transform(n.data, i);
			if (n.common.async) return Promise.resolve(e).then(async (e) => {
				if (t.value === "aborted") return V;
				let r = await this._def.schema._parseAsync({
					data: e,
					path: n.path,
					parent: n
				});
				return r.status === "aborted" ? V : r.status === "dirty" || t.value === "dirty" ? Ah(r.value) : r;
			});
			{
				if (t.value === "aborted") return V;
				let r = this._def.schema._parseSync({
					data: e,
					path: n.path,
					parent: n
				});
				return r.status === "aborted" ? V : r.status === "dirty" || t.value === "dirty" ? Ah(r.value) : r;
			}
		}
		if (r.type === "refinement") {
			let e = (e) => {
				let t = r.refinement(e, i);
				if (n.common.async) return Promise.resolve(t);
				if (t instanceof Promise) throw Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
				return e;
			};
			if (n.common.async === !1) {
				let r = this._def.schema._parseSync({
					data: n.data,
					path: n.path,
					parent: n
				});
				return r.status === "aborted" ? V : (r.status === "dirty" && t.dirty(), e(r.value), {
					status: t.value,
					value: r.value
				});
			}
			return this._def.schema._parseAsync({
				data: n.data,
				path: n.path,
				parent: n
			}).then((n) => n.status === "aborted" ? V : (n.status === "dirty" && t.dirty(), e(n.value).then(() => ({
				status: t.value,
				value: n.value
			}))));
		}
		if (r.type === "transform") {
			if (n.common.async === !1) {
				let e = this._def.schema._parseSync({
					data: n.data,
					path: n.path,
					parent: n
				});
				if (!Ph(e)) return V;
				let a = r.transform(e.value, i);
				if (a instanceof Promise) throw Error("Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.");
				return {
					status: t.value,
					value: a
				};
			}
			return this._def.schema._parseAsync({
				data: n.data,
				path: n.path,
				parent: n
			}).then((e) => Ph(e) ? Promise.resolve(r.transform(e.value, i)).then((e) => ({
				status: t.value,
				value: e
			})) : V);
		}
		L.assertNever(r);
	}
};
Bg.create = (e, t, n) => new Bg({
	schema: e,
	typeName: G.ZodEffects,
	effect: t,
	...U(n)
}), Bg.createWithPreprocess = (e, t, n) => new Bg({
	schema: t,
	effect: {
		type: "preprocess",
		transform: e
	},
	typeName: G.ZodEffects,
	...U(n)
});
var Vg = class extends W {
	_parse(e) {
		return this._getType(e) === R.undefined ? jh(void 0) : this._def.innerType._parse(e);
	}
	unwrap() {
		return this._def.innerType;
	}
};
Vg.create = (e, t) => new Vg({
	innerType: e,
	typeName: G.ZodOptional,
	...U(t)
});
var Hg = class extends W {
	_parse(e) {
		return this._getType(e) === R.null ? jh(null) : this._def.innerType._parse(e);
	}
	unwrap() {
		return this._def.innerType;
	}
};
Hg.create = (e, t) => new Hg({
	innerType: e,
	typeName: G.ZodNullable,
	...U(t)
});
var Ug = class extends W {
	_parse(e) {
		let { ctx: t } = this._processInputParams(e), n = t.data;
		return t.parsedType === R.undefined && (n = this._def.defaultValue()), this._def.innerType._parse({
			data: n,
			path: t.path,
			parent: t
		});
	}
	removeDefault() {
		return this._def.innerType;
	}
};
Ug.create = (e, t) => new Ug({
	innerType: e,
	typeName: G.ZodDefault,
	defaultValue: typeof t.default == "function" ? t.default : () => t.default,
	...U(t)
});
var Wg = class extends W {
	_parse(e) {
		let { ctx: t } = this._processInputParams(e), n = {
			...t,
			common: {
				...t.common,
				issues: []
			}
		}, r = this._def.innerType._parse({
			data: n.data,
			path: n.path,
			parent: { ...n }
		});
		return Fh(r) ? r.then((e) => ({
			status: "valid",
			value: e.status === "valid" ? e.value : this._def.catchValue({
				get error() {
					return new wh(n.common.issues);
				},
				input: n.data
			})
		})) : {
			status: "valid",
			value: r.status === "valid" ? r.value : this._def.catchValue({
				get error() {
					return new wh(n.common.issues);
				},
				input: n.data
			})
		};
	}
	removeCatch() {
		return this._def.innerType;
	}
};
Wg.create = (e, t) => new Wg({
	innerType: e,
	typeName: G.ZodCatch,
	catchValue: typeof t.catch == "function" ? t.catch : () => t.catch,
	...U(t)
});
var Gg = class extends W {
	_parse(e) {
		if (this._getType(e) !== R.nan) {
			let t = this._getOrReturnCtx(e);
			return B(t, {
				code: z.invalid_type,
				expected: R.nan,
				received: t.parsedType
			}), V;
		}
		return {
			status: "valid",
			value: e.data
		};
	}
};
Gg.create = (e) => new Gg({
	typeName: G.ZodNaN,
	...U(e)
});
var Kg = class extends W {
	_parse(e) {
		let { ctx: t } = this._processInputParams(e), n = t.data;
		return this._def.type._parse({
			data: n,
			path: t.path,
			parent: t
		});
	}
	unwrap() {
		return this._def.type;
	}
}, qg = class e extends W {
	_parse(e) {
		let { status: t, ctx: n } = this._processInputParams(e);
		if (n.common.async) return (async () => {
			let e = await this._def.in._parseAsync({
				data: n.data,
				path: n.path,
				parent: n
			});
			return e.status === "aborted" ? V : e.status === "dirty" ? (t.dirty(), Ah(e.value)) : this._def.out._parseAsync({
				data: e.value,
				path: n.path,
				parent: n
			});
		})();
		{
			let e = this._def.in._parseSync({
				data: n.data,
				path: n.path,
				parent: n
			});
			return e.status === "aborted" ? V : e.status === "dirty" ? (t.dirty(), {
				status: "dirty",
				value: e.value
			}) : this._def.out._parseSync({
				data: e.value,
				path: n.path,
				parent: n
			});
		}
	}
	static create(t, n) {
		return new e({
			in: t,
			out: n,
			typeName: G.ZodPipeline
		});
	}
}, Jg = class extends W {
	_parse(e) {
		let t = this._def.innerType._parse(e), n = (e) => (Ph(e) && (e.value = Object.freeze(e.value)), e);
		return Fh(t) ? t.then((e) => n(e)) : n(t);
	}
	unwrap() {
		return this._def.innerType;
	}
};
Jg.create = (e, t) => new Jg({
	innerType: e,
	typeName: G.ZodReadonly,
	...U(t)
}), Cg.lazycreate;
var G;
(function(e) {
	e.ZodString = "ZodString", e.ZodNumber = "ZodNumber", e.ZodNaN = "ZodNaN", e.ZodBigInt = "ZodBigInt", e.ZodBoolean = "ZodBoolean", e.ZodDate = "ZodDate", e.ZodSymbol = "ZodSymbol", e.ZodUndefined = "ZodUndefined", e.ZodNull = "ZodNull", e.ZodAny = "ZodAny", e.ZodUnknown = "ZodUnknown", e.ZodNever = "ZodNever", e.ZodVoid = "ZodVoid", e.ZodArray = "ZodArray", e.ZodObject = "ZodObject", e.ZodUnion = "ZodUnion", e.ZodDiscriminatedUnion = "ZodDiscriminatedUnion", e.ZodIntersection = "ZodIntersection", e.ZodTuple = "ZodTuple", e.ZodRecord = "ZodRecord", e.ZodMap = "ZodMap", e.ZodSet = "ZodSet", e.ZodFunction = "ZodFunction", e.ZodLazy = "ZodLazy", e.ZodLiteral = "ZodLiteral", e.ZodEnum = "ZodEnum", e.ZodEffects = "ZodEffects", e.ZodNativeEnum = "ZodNativeEnum", e.ZodOptional = "ZodOptional", e.ZodNullable = "ZodNullable", e.ZodDefault = "ZodDefault", e.ZodCatch = "ZodCatch", e.ZodPromise = "ZodPromise", e.ZodBranded = "ZodBranded", e.ZodPipeline = "ZodPipeline", e.ZodReadonly = "ZodReadonly";
})(G ||= {}), cg.create, ug.create, Gg.create, dg.create, fg.create, pg.create, mg.create, hg.create, gg.create, _g.create, vg.create, yg.create, bg.create, xg.create, Cg.create, Cg.strictCreate, wg.create, Eg.create, Og.create, kg.create, Ag.create, jg.create, Mg.create, Ng.create, Pg.create, Fg.create, Lg.create, Rg.create, zg.create, Bg.create, Vg.create, Hg.create, Bg.createWithPreprocess, qg.create;
// node_modules/zod-to-json-schema/dist/esm/parsers/any.js
function Yg(e) {
	if (e.target !== "openAi") return {};
	let t = [
		...e.basePath,
		e.definitionPath,
		e.openAiAnyTypeName
	];
	return e.flags.hasReferencedOpenAiAnyType = !0, { $ref: e.$refStrategy === "relative" ? xh(t, e.currentPath) : t.join("/") };
}
// node_modules/zod-to-json-schema/dist/esm/parsers/array.js
function Xg(e, t) {
	let n = { type: "array" };
	return e.type?._def && e.type?._def?.typeName !== G.ZodAny && (n.items = K(e.type._def, {
		...t,
		currentPath: [...t.currentPath, "items"]
	})), e.minLength && I(n, "minItems", e.minLength.value, e.minLength.message, t), e.maxLength && I(n, "maxItems", e.maxLength.value, e.maxLength.message, t), e.exactLength && (I(n, "minItems", e.exactLength.value, e.exactLength.message, t), I(n, "maxItems", e.exactLength.value, e.exactLength.message, t)), n;
}
// node_modules/zod-to-json-schema/dist/esm/parsers/bigint.js
function Zg(e, t) {
	let n = {
		type: "integer",
		format: "int64"
	};
	if (!e.checks) return n;
	for (let r of e.checks) switch (r.kind) {
		case "min":
			t.target === "jsonSchema7" ? r.inclusive ? I(n, "minimum", r.value, r.message, t) : I(n, "exclusiveMinimum", r.value, r.message, t) : (r.inclusive || (n.exclusiveMinimum = !0), I(n, "minimum", r.value, r.message, t));
			break;
		case "max":
			t.target === "jsonSchema7" ? r.inclusive ? I(n, "maximum", r.value, r.message, t) : I(n, "exclusiveMaximum", r.value, r.message, t) : (r.inclusive || (n.exclusiveMaximum = !0), I(n, "maximum", r.value, r.message, t));
			break;
		case "multipleOf": I(n, "multipleOf", r.value, r.message, t);
	}
	return n;
}
// node_modules/zod-to-json-schema/dist/esm/parsers/boolean.js
function Qg() {
	return { type: "boolean" };
}
// node_modules/zod-to-json-schema/dist/esm/parsers/branded.js
function $g(e, t) {
	return K(e.type._def, t);
}
// node_modules/zod-to-json-schema/dist/esm/parsers/catch.js
var e_ = (e, t) => K(e.innerType._def, t);
// node_modules/zod-to-json-schema/dist/esm/parsers/date.js
function t_(e, t, n) {
	let r = n ?? t.dateStrategy;
	if (Array.isArray(r)) return { anyOf: r.map((n, r) => t_(e, t, n)) };
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
		case "integer": return n_(e, t);
	}
}
var n_ = (e, t) => {
	let n = {
		type: "integer",
		format: "unix-time"
	};
	if (t.target === "openApi3") return n;
	for (let r of e.checks) switch (r.kind) {
		case "min":
			I(n, "minimum", r.value, r.message, t);
			break;
		case "max": I(n, "maximum", r.value, r.message, t);
	}
	return n;
};
// node_modules/zod-to-json-schema/dist/esm/parsers/default.js
function r_(e, t) {
	return {
		...K(e.innerType._def, t),
		default: e.defaultValue()
	};
}
// node_modules/zod-to-json-schema/dist/esm/parsers/effects.js
function i_(e, t) {
	return t.effectStrategy === "input" ? K(e.schema._def, t) : Yg(t);
}
// node_modules/zod-to-json-schema/dist/esm/parsers/enum.js
function a_(e) {
	return {
		type: "string",
		enum: Array.from(e.values)
	};
}
// node_modules/zod-to-json-schema/dist/esm/parsers/intersection.js
var o_ = (e) => "type" in e && e.type === "string" ? !1 : "allOf" in e;
function s_(e, t) {
	let n = [K(e.left._def, {
		...t,
		currentPath: [
			...t.currentPath,
			"allOf",
			"0"
		]
	}), K(e.right._def, {
		...t,
		currentPath: [
			...t.currentPath,
			"allOf",
			"1"
		]
	})].filter((e) => !!e), r = t.target === "jsonSchema2019-09" ? { unevaluatedProperties: !1 } : void 0, i = [];
	return n.forEach((e) => {
		if (o_(e)) i.push(...e.allOf), e.unevaluatedProperties === void 0 && (r = void 0);
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
// node_modules/zod-to-json-schema/dist/esm/parsers/literal.js
function c_(e, t) {
	let n = typeof e.value;
	return n !== "bigint" && n !== "number" && n !== "boolean" && n !== "string" ? { type: Array.isArray(e.value) ? "array" : "object" } : t.target === "openApi3" ? {
		type: n === "bigint" ? "integer" : n,
		enum: [e.value]
	} : {
		type: n === "bigint" ? "integer" : n,
		const: e.value
	};
}
// node_modules/zod-to-json-schema/dist/esm/parsers/string.js
var l_ = void 0, u_ = {
	cuid: /^[cC][^\s-]{8,}$/,
	cuid2: /^[0-9a-z]+$/,
	ulid: /^[0-9A-HJKMNP-TV-Z]{26}$/,
	email: /^(?!\.)(?!.*\.\.)([a-zA-Z0-9_'+\-\.]*)[a-zA-Z0-9_+-]@([a-zA-Z0-9][a-zA-Z0-9\-]*\.)+[a-zA-Z]{2,}$/,
	emoji: () => (l_ === void 0 && (l_ = RegExp("^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$", "u")), l_),
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
function d_(e, t) {
	let n = { type: "string" };
	if (e.checks) for (let r of e.checks) switch (r.kind) {
		case "min":
			I(n, "minLength", typeof n.minLength == "number" ? Math.max(n.minLength, r.value) : r.value, r.message, t);
			break;
		case "max":
			I(n, "maxLength", typeof n.maxLength == "number" ? Math.min(n.maxLength, r.value) : r.value, r.message, t);
			break;
		case "email":
			switch (t.emailStrategy) {
				case "format:email":
					h_(n, "email", r.message, t);
					break;
				case "format:idn-email":
					h_(n, "idn-email", r.message, t);
					break;
				case "pattern:zod": g_(n, u_.email, r.message, t);
			}
			break;
		case "url":
			h_(n, "uri", r.message, t);
			break;
		case "uuid":
			h_(n, "uuid", r.message, t);
			break;
		case "regex":
			g_(n, r.regex, r.message, t);
			break;
		case "cuid":
			g_(n, u_.cuid, r.message, t);
			break;
		case "cuid2":
			g_(n, u_.cuid2, r.message, t);
			break;
		case "startsWith":
			g_(n, RegExp(`^${f_(r.value, t)}`), r.message, t);
			break;
		case "endsWith":
			g_(n, RegExp(`${f_(r.value, t)}$`), r.message, t);
			break;
		case "datetime":
			h_(n, "date-time", r.message, t);
			break;
		case "date":
			h_(n, "date", r.message, t);
			break;
		case "time":
			h_(n, "time", r.message, t);
			break;
		case "duration":
			h_(n, "duration", r.message, t);
			break;
		case "length":
			I(n, "minLength", typeof n.minLength == "number" ? Math.max(n.minLength, r.value) : r.value, r.message, t), I(n, "maxLength", typeof n.maxLength == "number" ? Math.min(n.maxLength, r.value) : r.value, r.message, t);
			break;
		case "includes":
			g_(n, RegExp(f_(r.value, t)), r.message, t);
			break;
		case "ip":
			r.version !== "v6" && h_(n, "ipv4", r.message, t), r.version !== "v4" && h_(n, "ipv6", r.message, t);
			break;
		case "base64url":
			g_(n, u_.base64url, r.message, t);
			break;
		case "jwt":
			g_(n, u_.jwt, r.message, t);
			break;
		case "cidr":
			r.version !== "v6" && g_(n, u_.ipv4Cidr, r.message, t), r.version !== "v4" && g_(n, u_.ipv6Cidr, r.message, t);
			break;
		case "emoji":
			g_(n, u_.emoji(), r.message, t);
			break;
		case "ulid":
			g_(n, u_.ulid, r.message, t);
			break;
		case "base64":
			switch (t.base64Strategy) {
				case "format:binary":
					h_(n, "binary", r.message, t);
					break;
				case "contentEncoding:base64":
					I(n, "contentEncoding", "base64", r.message, t);
					break;
				case "pattern:zod": g_(n, u_.base64, r.message, t);
			}
			break;
		case "nanoid": g_(n, u_.nanoid, r.message, t);
	}
	return n;
}
function f_(e, t) {
	return t.patternStrategy === "escape" ? m_(e) : e;
}
var p_ = /* @__PURE__ */ new Set("ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvxyz0123456789");
function m_(e) {
	let t = "";
	for (let n = 0; n < e.length; n++) p_.has(e[n]) || (t += "\\"), t += e[n];
	return t;
}
function h_(e, t, n, r) {
	e.format || e.anyOf?.some((e) => e.format) ? (e.anyOf ||= [], e.format && (e.anyOf.push({
		format: e.format,
		...e.errorMessage && r.errorMessages && { errorMessage: { format: e.errorMessage.format } }
	}), delete e.format, e.errorMessage && (delete e.errorMessage.format, Object.keys(e.errorMessage).length === 0 && delete e.errorMessage)), e.anyOf.push({
		format: t,
		...n && r.errorMessages && { errorMessage: { format: n } }
	})) : I(e, "format", t, n, r);
}
function g_(e, t, n, r) {
	e.pattern || e.allOf?.some((e) => e.pattern) ? (e.allOf ||= [], e.pattern && (e.allOf.push({
		pattern: e.pattern,
		...e.errorMessage && r.errorMessages && { errorMessage: { pattern: e.errorMessage.pattern } }
	}), delete e.pattern, e.errorMessage && (delete e.errorMessage.pattern, Object.keys(e.errorMessage).length === 0 && delete e.errorMessage)), e.allOf.push({
		pattern: __(t, r),
		...n && r.errorMessages && { errorMessage: { pattern: n } }
	})) : I(e, "pattern", __(t, r), n, r);
}
function __(e, t) {
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
// node_modules/zod-to-json-schema/dist/esm/parsers/record.js
function v_(e, t) {
	if (t.target === "openAi" && console.warn("Warning: OpenAI may not support records in schemas! Try an array of key-value pairs instead."), t.target === "openApi3" && e.keyType?._def.typeName === G.ZodEnum) return {
		type: "object",
		required: e.keyType._def.values,
		properties: e.keyType._def.values.reduce((n, r) => ({
			...n,
			[r]: K(e.valueType._def, {
				...t,
				currentPath: [
					...t.currentPath,
					"properties",
					r
				]
			}) ?? Yg(t)
		}), {}),
		additionalProperties: t.rejectedAdditionalProperties
	};
	let n = {
		type: "object",
		additionalProperties: K(e.valueType._def, {
			...t,
			currentPath: [...t.currentPath, "additionalProperties"]
		}) ?? t.allowedAdditionalProperties
	};
	if (t.target === "openApi3") return n;
	if (e.keyType?._def.typeName === G.ZodString && e.keyType._def.checks?.length) {
		let { type: r, ...i } = d_(e.keyType._def, t);
		return {
			...n,
			propertyNames: i
		};
	}
	if (e.keyType?._def.typeName === G.ZodEnum) return {
		...n,
		propertyNames: { enum: e.keyType._def.values }
	};
	if (e.keyType?._def.typeName === G.ZodBranded && e.keyType._def.type._def.typeName === G.ZodString && e.keyType._def.type._def.checks?.length) {
		let { type: r, ...i } = $g(e.keyType._def, t);
		return {
			...n,
			propertyNames: i
		};
	}
	return n;
}
// node_modules/zod-to-json-schema/dist/esm/parsers/map.js
function y_(e, t) {
	return t.mapStrategy === "record" ? v_(e, t) : {
		type: "array",
		maxItems: 125,
		items: {
			type: "array",
			items: [K(e.keyType._def, {
				...t,
				currentPath: [
					...t.currentPath,
					"items",
					"items",
					"0"
				]
			}) || Yg(t), K(e.valueType._def, {
				...t,
				currentPath: [
					...t.currentPath,
					"items",
					"items",
					"1"
				]
			}) || Yg(t)],
			minItems: 2,
			maxItems: 2
		}
	};
}
// node_modules/zod-to-json-schema/dist/esm/parsers/nativeEnum.js
function b_(e) {
	let t = e.values, n = Object.keys(e.values).filter((e) => typeof t[t[e]] != "number").map((e) => t[e]), r = Array.from(new Set(n.map((e) => typeof e)));
	return {
		type: r.length === 1 ? r[0] === "string" ? "string" : "number" : ["string", "number"],
		enum: n
	};
}
// node_modules/zod-to-json-schema/dist/esm/parsers/never.js
function x_(e) {
	return e.target === "openAi" ? void 0 : { not: Yg({
		...e,
		currentPath: [...e.currentPath, "not"]
	}) };
}
// node_modules/zod-to-json-schema/dist/esm/parsers/null.js
function S_(e) {
	return e.target === "openApi3" ? {
		enum: ["null"],
		nullable: !0
	} : { type: "null" };
}
// node_modules/zod-to-json-schema/dist/esm/parsers/union.js
var C_ = {
	ZodString: "string",
	ZodNumber: "number",
	ZodBigInt: "integer",
	ZodBoolean: "boolean",
	ZodNull: "null"
};
function w_(e, t) {
	if (t.target === "openApi3") return T_(e, t);
	let n = e.options instanceof Map ? Array.from(e.options.values()) : e.options;
	if (n.every((e) => e._def.typeName in C_ && (!e._def.checks || !e._def.checks.length))) {
		let e = n.reduce((e, t) => {
			let n = C_[t._def.typeName];
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
	return T_(e, t);
}
var T_ = (e, t) => {
	let n = (e.options instanceof Map ? Array.from(e.options.values()) : e.options).map((e, n) => K(e._def, {
		...t,
		currentPath: [
			...t.currentPath,
			"anyOf",
			`${n}`
		]
	})).filter((e) => !!e && (!t.strictUnions || typeof e == "object" && Object.keys(e).length > 0));
	return n.length ? { anyOf: n } : void 0;
};
// node_modules/zod-to-json-schema/dist/esm/parsers/nullable.js
function E_(e, t) {
	if ([
		"ZodString",
		"ZodNumber",
		"ZodBigInt",
		"ZodBoolean",
		"ZodNull"
	].includes(e.innerType._def.typeName) && (!e.innerType._def.checks || !e.innerType._def.checks.length)) return t.target === "openApi3" ? {
		type: C_[e.innerType._def.typeName],
		nullable: !0
	} : { type: [C_[e.innerType._def.typeName], "null"] };
	if (t.target === "openApi3") {
		let n = K(e.innerType._def, {
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
	let n = K(e.innerType._def, {
		...t,
		currentPath: [
			...t.currentPath,
			"anyOf",
			"0"
		]
	});
	return n && { anyOf: [n, { type: "null" }] };
}
// node_modules/zod-to-json-schema/dist/esm/parsers/number.js
function D_(e, t) {
	let n = { type: "number" };
	if (!e.checks) return n;
	for (let r of e.checks) switch (r.kind) {
		case "int":
			n.type = "integer", bh(n, "type", r.message, t);
			break;
		case "min":
			t.target === "jsonSchema7" ? r.inclusive ? I(n, "minimum", r.value, r.message, t) : I(n, "exclusiveMinimum", r.value, r.message, t) : (r.inclusive || (n.exclusiveMinimum = !0), I(n, "minimum", r.value, r.message, t));
			break;
		case "max":
			t.target === "jsonSchema7" ? r.inclusive ? I(n, "maximum", r.value, r.message, t) : I(n, "exclusiveMaximum", r.value, r.message, t) : (r.inclusive || (n.exclusiveMaximum = !0), I(n, "maximum", r.value, r.message, t));
			break;
		case "multipleOf": I(n, "multipleOf", r.value, r.message, t);
	}
	return n;
}
// node_modules/zod-to-json-schema/dist/esm/parsers/object.js
function O_(e, t) {
	let n = t.target === "openAi", r = {
		type: "object",
		properties: {}
	}, i = [], a = e.shape();
	for (let e in a) {
		let o = a[e];
		if (o === void 0 || o._def === void 0) continue;
		let s = A_(o);
		s && n && (o._def.typeName === "ZodOptional" && (o = o._def.innerType), o.isNullable() || (o = o.nullable()), s = !1);
		let c = K(o._def, {
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
	let o = k_(e, t);
	return o !== void 0 && (r.additionalProperties = o), r;
}
function k_(e, t) {
	if (e.catchall._def.typeName !== "ZodNever") return K(e.catchall._def, {
		...t,
		currentPath: [...t.currentPath, "additionalProperties"]
	});
	switch (e.unknownKeys) {
		case "passthrough": return t.allowedAdditionalProperties;
		case "strict": return t.rejectedAdditionalProperties;
		case "strip": return t.removeAdditionalStrategy === "strict" ? t.allowedAdditionalProperties : t.rejectedAdditionalProperties;
	}
}
function A_(e) {
	try {
		return e.isOptional();
	} catch {
		return !0;
	}
}
// node_modules/zod-to-json-schema/dist/esm/parsers/optional.js
var j_ = (e, t) => {
	if (t.currentPath.toString() === t.propertyPath?.toString()) return K(e.innerType._def, t);
	let n = K(e.innerType._def, {
		...t,
		currentPath: [
			...t.currentPath,
			"anyOf",
			"1"
		]
	});
	return n ? { anyOf: [{ not: Yg(t) }, n] } : Yg(t);
}, M_ = (e, t) => {
	if (t.pipeStrategy === "input") return K(e.in._def, t);
	if (t.pipeStrategy === "output") return K(e.out._def, t);
	let n = K(e.in._def, {
		...t,
		currentPath: [
			...t.currentPath,
			"allOf",
			"0"
		]
	});
	return { allOf: [n, K(e.out._def, {
		...t,
		currentPath: [
			...t.currentPath,
			"allOf",
			n ? "1" : "0"
		]
	})].filter((e) => e !== void 0) };
};
// node_modules/zod-to-json-schema/dist/esm/parsers/promise.js
function N_(e, t) {
	return K(e.type._def, t);
}
// node_modules/zod-to-json-schema/dist/esm/parsers/set.js
function P_(e, t) {
	let n = {
		type: "array",
		uniqueItems: !0,
		items: K(e.valueType._def, {
			...t,
			currentPath: [...t.currentPath, "items"]
		})
	};
	return e.minSize && I(n, "minItems", e.minSize.value, e.minSize.message, t), e.maxSize && I(n, "maxItems", e.maxSize.value, e.maxSize.message, t), n;
}
// node_modules/zod-to-json-schema/dist/esm/parsers/tuple.js
function F_(e, t) {
	return e.rest ? {
		type: "array",
		minItems: e.items.length,
		items: e.items.map((e, n) => K(e._def, {
			...t,
			currentPath: [
				...t.currentPath,
				"items",
				`${n}`
			]
		})).reduce((e, t) => t === void 0 ? e : [...e, t], []),
		additionalItems: K(e.rest._def, {
			...t,
			currentPath: [...t.currentPath, "additionalItems"]
		})
	} : {
		type: "array",
		minItems: e.items.length,
		maxItems: e.items.length,
		items: e.items.map((e, n) => K(e._def, {
			...t,
			currentPath: [
				...t.currentPath,
				"items",
				`${n}`
			]
		})).reduce((e, t) => t === void 0 ? e : [...e, t], [])
	};
}
// node_modules/zod-to-json-schema/dist/esm/parsers/undefined.js
function I_(e) {
	return { not: Yg(e) };
}
// node_modules/zod-to-json-schema/dist/esm/parsers/unknown.js
function L_(e) {
	return Yg(e);
}
// node_modules/zod-to-json-schema/dist/esm/parsers/readonly.js
var R_ = (e, t) => K(e.innerType._def, t), z_ = (e, t, n) => {
	switch (t) {
		case G.ZodString: return d_(e, n);
		case G.ZodNumber: return D_(e, n);
		case G.ZodObject: return O_(e, n);
		case G.ZodBigInt: return Zg(e, n);
		case G.ZodBoolean: return Qg();
		case G.ZodDate: return t_(e, n);
		case G.ZodUndefined: return I_(n);
		case G.ZodNull: return S_(n);
		case G.ZodArray: return Xg(e, n);
		case G.ZodUnion:
		case G.ZodDiscriminatedUnion: return w_(e, n);
		case G.ZodIntersection: return s_(e, n);
		case G.ZodTuple: return F_(e, n);
		case G.ZodRecord: return v_(e, n);
		case G.ZodLiteral: return c_(e, n);
		case G.ZodEnum: return a_(e);
		case G.ZodNativeEnum: return b_(e);
		case G.ZodNullable: return E_(e, n);
		case G.ZodOptional: return j_(e, n);
		case G.ZodMap: return y_(e, n);
		case G.ZodSet: return P_(e, n);
		case G.ZodLazy: return () => e.getter()._def;
		case G.ZodPromise: return N_(e, n);
		case G.ZodNaN:
		case G.ZodNever: return x_(n);
		case G.ZodEffects: return i_(e, n);
		case G.ZodAny: return Yg(n);
		case G.ZodUnknown: return L_(n);
		case G.ZodDefault: return r_(e, n);
		case G.ZodBranded: return $g(e, n);
		case G.ZodReadonly: return R_(e, n);
		case G.ZodCatch: return e_(e, n);
		case G.ZodPipeline: return M_(e, n);
		case G.ZodFunction:
		case G.ZodVoid:
		case G.ZodSymbol: return;
		default: return ((e) => void 0)(t);
	}
};
// node_modules/zod-to-json-schema/dist/esm/parseDef.js
function K(e, t, n = !1) {
	let r = t.seen.get(e);
	if (t.override) {
		let i = t.override?.(e, t, r, n);
		if (i !== gh) return i;
	}
	if (r && !n) {
		let e = B_(r, t);
		if (e !== void 0) return e;
	}
	let i = {
		def: e,
		path: t.currentPath,
		jsonSchema: void 0
	};
	t.seen.set(e, i);
	let a = z_(e, e.typeName, t), o = typeof a == "function" ? K(a(), t) : a;
	if (o && V_(e, t, o), t.postProcess) {
		let n = t.postProcess(o, e, t);
		return i.jsonSchema = o, n;
	}
	return i.jsonSchema = o, o;
}
var B_ = (e, t) => {
	switch (t.$refStrategy) {
		case "root": return { $ref: e.path.join("/") };
		case "relative": return { $ref: xh(t.currentPath, e.path) };
		case "none":
		case "seen": return e.path.length < t.currentPath.length && e.path.every((e, n) => t.currentPath[n] === e) ? (console.warn(`Recursive reference detected at ${t.currentPath.join("/")}! Defaulting to any`), Yg(t)) : t.$refStrategy === "seen" ? Yg(t) : void 0;
	}
}, V_ = (e, t, n) => (e.description && (n.description = e.description, t.markdownDescription && (n.markdownDescription = e.description)), n), H_ = (e, t) => {
	let n = yh(t), r = typeof t == "object" && t.definitions ? Object.entries(t.definitions).reduce((e, [t, r]) => ({
		...e,
		[t]: K(r._def, {
			...n,
			currentPath: [
				...n.basePath,
				n.definitionPath,
				t
			]
		}, !0) ?? Yg(n)
	}), {}) : void 0, i = typeof t == "string" ? t : t?.nameStrategy === "title" ? void 0 : t?.name, a = K(e._def, i === void 0 ? n : {
		...n,
		currentPath: [
			...n.basePath,
			n.definitionPath,
			i
		]
	}, !1) ?? Yg(n), o = typeof t == "object" && t.name !== void 0 && t.nameStrategy === "title" ? t.name : void 0;
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
}, U_ = [
	"page",
	"navigation",
	"click",
	"input",
	"network",
	"thread.linked",
	"agent.run",
	"agent.message",
	"tool.call"
], W_ = "[redacted]", G_ = /password|passwd|passphrase|passcode|credential|api(key|token)|privatekey|subscriptionkey|(access|refresh|auth|session)token|clientsecret/, K_ = / (secret|id ?token)s? | (authorization|cookies?|jwt|bearer ?token|[cx]srf ?token) $|^ (pwd|pass|token|otp) $/, q_ = / (ids?|at|in|expires?|expiry|length|count|enabled|required|policy|hint|type) $/, J_ = /(current|new)-password|one-time-code/, Y_ = /"((?:\\[\s\S]|[^"\\])*)("?)(\s*:\s*)?/g, X_ = /"(?:\\[\s\S]?|[^"\\])*"?/y, Z_ = /([\w$.%+[\]-]{1,64})(\s*(?:=|:(?=\s|$))\s*)((?:(?:basic|bearer|digest|token) +)?[^\s&,;)}\]]*)/gi, Q_ = /([a-z][\w+.-]{0,31}:\/\/)[^\s/?#"]*@/gi, $_ = 16384, ev = 20, tv = (e) => {
	let t = ` ${e.replace(/%([\da-f]{2})/gi, (e, t) => String.fromCharCode(parseInt(t, 16))).replace(/([a-z\d])(?=[A-Z])/g, "$1 ").toLowerCase().split(/[^a-z\d]+/).filter(Boolean).join(" ")} `;
	return !q_.test(t) && (G_.test(t.replace(/ /g, "")) || K_.test(t));
}, nv = (e) => {
	try {
		return JSON.parse(`"${e}"`);
	} catch {
		return e;
	}
}, rv = (e, t) => {
	let n = 0;
	for (let r = t; r < e.length; r++) {
		let t = e[r];
		if (t === "\"") X_.lastIndex = r, X_.test(e), r = X_.lastIndex - 1;
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
}, iv = (e, t = 0) => {
	let n = new RegExp(Y_), r = !1, i = (e) => {
		let t = e.replace(Q_, "$1");
		return t.replace(Z_, (e, n, i, a, o) => !tv(n) || o + e.length === t.length && (r = !0, !a) ? e : n + i + W_);
	}, a = "", o = 0, s;
	for (; s = n.exec(e);) {
		let [c, l, u, d] = s;
		r = !1, a += i(e.slice(o, s.index));
		let f = n.lastIndex, p = c, m = l.includes("\\") ? nv(l) : l;
		if (d) {
			if (tv(m)) {
				let t = rv(e, f);
				/^(true|false|null|)$/.test(e.slice(f, t)) || (p += `"${W_}"`, f = t);
			}
		} else if (r) p = `"${W_}"`;
		else if (t < 4 && /[=:"]/.test(m)) {
			let e = iv(m, t + 1);
			e !== m && (p = JSON.stringify(e).slice(0, u ? void 0 : -1));
		}
		a += p, o = n.lastIndex = f;
	}
	return a + i(e.slice(o));
};
function av() {
	let e = /* @__PURE__ */ new WeakSet(), t = /* @__PURE__ */ new Map(), n, r = (t) => {
		for (let n of t) n.oldValue?.toLowerCase() === "password" && e.add(n.target);
	}, i = (e, n) => {
		for (let r of [...t.values()].sort((e, t) => t.length - e.length)) for (let t of [
			r,
			JSON.stringify(r).slice(1, -1),
			encodeURIComponent(r),
			new URLSearchParams({ v: r }).toString().slice(2),
			...[n?.(r) ?? ""].filter((e) => e.length >= 4)
		]) e = /^\d+$/.test(t) ? e.replace(RegExp(`(?<!\\d)${t}(?!\\d)`, "g"), W_) : e.split(t).join(W_);
		return e;
	}, a = (i) => (n && r(n.takeRecords()), !(i instanceof HTMLInputElement) || !(i.type === "password" || e.has(i) || tv(i.name) || J_.test(i.getAttribute("autocomplete") ?? "")) ? !1 : (e.add(i), i.value.length >= 4 && (t.delete(i), t.set(i, i.value), t.size > ev && t.delete(t.keys().next().value)), !0));
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
		field: (e, t) => tv(e) ? W_ : i(iv(t)),
		body(e) {
			try {
				return i(iv(e.slice(0, $_)));
			} catch {
				return;
			}
		},
		url(e) {
			try {
				return i(e.replace(/[^#]+/g, (e) => iv(e)));
			} catch {
				return W_;
			}
		}
	};
}
var ov = "button, a[href], input, select, textarea, label, summary, [role], [data-copilotkit-action], [contenteditable]:not([contenteditable=\"false\"])", sv = 5, cv = 1e3;
function lv(e, t) {
	let n = e;
	for (; n !== null;) {
		let e = n.closest(t);
		if (e !== null) return e;
		let r = n.getRootNode();
		n = r instanceof ShadowRoot ? r.host : null;
	}
	return null;
}
function uv(e, t) {
	if (lv(e, "[data-copilotkit-ignore]") !== null) return null;
	let n = e.closest(ov) ?? e, r = t.isPassword(n);
	return {
		element: n,
		target: {
			tag: n.localName,
			role: n.getAttribute("role"),
			action: n.getAttribute("data-copilotkit-action"),
			text: (n.textContent ?? "").slice(0, cv),
			attributes: Object.fromEntries(Array.from(n.attributes, ({ name: e, value: n }) => [e, r && e === "value" || tv(e.replace(/^data-/, "")) ? W_ : t.url(n)])),
			...Wv(n, t)
		}
	};
}
var dv = 80, fv = 1e3, pv = 320, mv = /^(button|link|tab|menuitem(checkbox|radio)?|option|checkbox|switch|radio|treeitem)$/, hv = "[contenteditable]:not([contenteditable=\"false\"])", gv = `${hv}, [role~=textbox], [role~=searchbox], [role~=combobox]`, _v = `input, textarea, select, ${gv}`, vv = "h1, h2, h3, h4, h5, h6, [role~=heading]", yv = `${vv}, p, ul, ol, li, dl, table, article, section, blockquote`, bv = "script, style, template, [hidden], [aria-hidden=\"true\"]", xv = /^(b|i|u|em|strong|mark|small|sub|sup|abbr|code|kbd|s|q|cite|dfn|var|time|data|bdi|bdo|wbr|span)$/, Sv = /^(submit|button|reset|image)$/, Cv = /^(submit|button|reset|image|checkbox|radio|range|color|file|hidden)$/, wv = /\p{Default_Ignorable_Code_Point}/gu, Tv = /(?:\b[a-z][\w+.-]{0,31}:\/\/|\bwww\.)[^\s<>"']*[^\s<>"'.,;:!?)]/gi, Ev = /[\p{L}\p{N}_.%+-]{1,64}@[\p{L}\p{N}-]{1,63}(?:\.[\p{L}\p{N}-]{1,63})+/gu, Dv = /(^|[^\w-])(?:eyJ[\w-]*\.[\w-]*\.[\w-]*|[\w-]{16,}\.[\w-]{16,}\.[\w-]{16,}|(?=[\w-]*\d)[\w-]{8,}\.(?=[\w-]*\d)[\w-]{8,}\.(?=[\w-]*\d)[\w-]{8,})/g, Ov = /[\w+/=-]{24,}/g, kv = (e) => (e.getAttribute("role") ?? "").trim().split(/\s+/)[0].toLowerCase(), Av = (e, t) => (e.getAttribute(t) ?? "").split(/\s+/).filter(Boolean), jv = (e) => {
	let t = e.getRootNode();
	return t instanceof Document || t instanceof ShadowRoot ? t : null;
}, Mv = (e) => {
	let t = kv(e);
	return t ? mv.test(t) : e.matches("button, a[href], summary");
}, Nv = (e) => e instanceof HTMLInputElement ? !Cv.test(e.type) : e.matches("textarea, select") || e.closest(gv) !== null;
function Pv(e) {
	if (e.localName === "img") return e.getAttribute("alt");
	if (e.localName !== "svg" && kv(e) !== "img") return;
	let t = Array.from(e.children).find((e) => e.localName === "title" && e.childElementCount === 0);
	return e.getAttribute("aria-label") ?? t?.textContent ?? null;
}
function Fv(e, t) {
	if (Nv(e)) return "";
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
		if (++r > fv || n.length > pv) {
			if (t) return "";
			break;
		}
		let o = !1;
		if (l instanceof Text) {
			let n = l.parentNode, r = n;
			for (; r !== e && xv.test(r.localName);) r = r.parentElement;
			if (/\S/.test(l.data) && (!c(n) || t && r.localName === "div" && (a ??= r) !== r)) return "";
			s(l.data);
		} else if (l instanceof Element) {
			if (l.matches(_v) || t && l.matches(yv) && !(e.localName === "summary" && l.matches(vv)) && (l.localName !== "p" || ++i > 1)) return "";
			let n = l.matches(bv) ? null : Pv(l);
			if (n) {
				if (!c(l)) return "";
				s(` ${n} `);
			} else n === void 0 && (xv.test(l.localName) || s(" "), o = !0);
		}
		if (o && l.firstChild !== null) l = l.firstChild;
		else {
			for (; l !== e && l.nextSibling === null;) l = l.parentNode, xv.test(l.localName) || s(" ");
			l = l === e ? null : l.nextSibling;
		}
	}
	return n;
}
var Iv = (e) => (e.localName === "option" || /^(option|treeitem)$/.test(kv(e))) && Lv(e);
function Lv(e) {
	if (e.closest("[role~=combobox], datalist") !== null) return !0;
	let t = jv(e);
	return t !== null && Array.from(t.querySelectorAll("[role~=combobox], [aria-autocomplete]")).some((n) => [...Av(n, "aria-controls"), ...Av(n, "aria-owns")].some((n) => t.getElementById(n)?.contains(e)));
}
function Rv(e) {
	let t = jv(e);
	return t === null ? null : Av(e, "aria-labelledby").map((e) => {
		let n = t.getElementById(e);
		return n === null || Lv(n) ? "" : Fv(n, !1);
	}).join(" ");
}
var zv = (e) => e.replace(wv, "").replace(/\s+/g, " ").trim();
function Bv(e) {
	let t = Fv(e, !0);
	return Array.from(zv(t)).length > dv ? "" : t;
}
function Vv(e, t) {
	let n = Array.from(t.scrub(zv(t.body(e.replace(wv, "")) ?? ""), zv).replace(Tv, "[url]").replace(Ev, "[email]").replace(Dv, `$1${W_}`).replace(Ov, (e) => /\d/.test(e) ? W_ : e));
	return n.length > dv ? `${n.slice(0, 79).join("").trimEnd()}…` : n.join("");
}
function Hv(e, t) {
	for (let n of e) {
		let e = Vv(n() ?? "", t);
		if (e) return e;
	}
}
function Uv(e, t) {
	let n = e.closest("option, [role~=option], [role~=treeitem]");
	if (n !== null && Iv(n)) return;
	let r = [() => Rv(e), () => e.getAttribute("aria-label")];
	if (/^(img|svg)$/.test(e.localName) || /^(img|presentation|none)$/.test(kv(e))) {
		let n = Hv([...r, () => Pv(e) ?? null], t);
		if (n !== void 0) return n;
		let i = e.parentElement;
		for (; i !== null && !Mv(i);) i = i.parentElement;
		return i === null ? void 0 : Uv(i, t);
	}
	let i = Mv(e) && !Nv(e), a = e instanceof HTMLInputElement && Sv.test(e.type);
	return Hv([
		...r,
		() => a ? e.type === "image" ? e.getAttribute("alt") : e.value : null,
		() => i || a ? e.getAttribute("title") : null,
		() => i ? Bv(e) : null
	], t);
}
function Wv(e, t) {
	return e instanceof HTMLInputElement ? {
		value: t.isPassword(e) ? W_ : e.value,
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
	} : e instanceof HTMLTextAreaElement ? { value: e.value } : e.matches(hv) ? { value: e.textContent ?? "" } : {};
}
function Gv(e) {
	let [t] = e.composedPath();
	return t instanceof Element ? t : null;
}
function Kv(e) {
	return e.localName === "body" || e.localName === "html" || !e.isConnected;
}
function qv(e, t) {
	return Math.abs(e.x - t.clientX) <= sv && Math.abs(e.y - t.clientY) <= sv;
}
function Jv(e) {
	let { emit: t, getRoute: n, enrich: r, isTrusted: i = (e) => e.isTrusted, redact: a = av() } = e, o = null, s = (e) => {
		let t = uv(e, a);
		if (t === null) return null;
		try {
			let e = Uv(t.element, a);
			e !== void 0 && (t.target.label = e);
		} catch {}
		return t;
	}, c = (e) => {
		try {
			if (e.isPrimary === !1) return;
			let t = Gv(e);
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
			let o = Gv(e);
			if (o === null) return;
			let l = c !== null && Kv(o) && qv(c, e) ? c.described : s(o);
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
var Yv = 300, Xv = /* @__PURE__ */ new Set([
	"text",
	"search",
	"tel",
	"url",
	"email",
	"password",
	"number"
]);
function Zv(e) {
	let { emit: t, isTrusted: n = (e) => e.isTrusted, redact: r = av() } = e, i = !0, a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new WeakMap(), s = /* @__PURE__ */ new WeakMap(), c = (e) => {
		clearTimeout(a.get(e)?.timer), a.delete(e);
	}, l = (e, n) => {
		try {
			if (!i || uv(e, r) === null || r.isPassword(e) && n.state.value !== W_) return;
			n.payload.eventType === "input" && o.set(e, JSON.stringify(n.state)), n.payload.url = r.url(n.payload.url), n.payload.target.text = r.url(n.payload.target.text), n.payload.target.attributes = Object.fromEntries(Object.entries(n.payload.target.attributes).map(([e, t]) => [e, r.url(t)])), t("input", n.payload);
		} catch {}
	}, u = () => {
		let e = [...a];
		for (let [t] of e) c(t);
		for (let [t, n] of e) l(t, n);
	}, d = (e, t, n) => {
		if (a.size > 0 && !a.has(e) && u(), !i) return;
		let s = uv(e, r);
		if (s === null) {
			c(e);
			return;
		}
		let d = Wv(e, r);
		if (!("value" in d)) return;
		let f = e instanceof HTMLTextAreaElement || e instanceof HTMLInputElement && Xv.has(e.type) || e.matches("[contenteditable]:not([contenteditable=\"false\"])");
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
		}, Yv)), a.set(e, h)) : l(e, h);
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
function Qv(e) {
	return typeof e == "object" && !!e && "addEventListener" in e && "removeEventListener" in e;
}
function $v() {
	let e = Reflect.get(window, "navigation");
	return Qv(e) ? e : null;
}
function ey(e) {
	switch (e) {
		case "replace":
		case "traverse":
		case "reload": return e;
		default: return "push";
	}
}
function ty(e) {
	let { emit: t, redact: n = av() } = e, r = location.href, i = (e) => {
		try {
			let i = location.href;
			if (i === r) return;
			t("navigation", {
				from: n.url(r),
				to: n.url(i),
				navigationType: e
			}), r = i;
		} catch {}
	}, a = $v();
	if (a !== null) {
		let e = (e) => i(ey(Reflect.get(e, "navigationType")));
		return a.addEventListener("currententrychange", e), () => a.removeEventListener("currententrychange", e);
	}
	return ny(i);
}
function ny(e) {
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
var ry = 4096, iy = 1e3, ay = new TextEncoder(), oy = () => ({
	status: "unavailable",
	reason: "redaction-failed"
});
function sy(e, t, n, r, i) {
	let a;
	if (!ly(n)) try {
		a = new TextDecoder("utf-8", { fatal: !n }).decode(e, { stream: t !== "complete" });
	} catch {}
	if (a !== void 0) {
		if (a = r(a), a === void 0) return oy();
		a.includes("\0") && (e = ay.encode(a), a = void 0);
	}
	let o = a === void 0;
	a ??= btoa(String.fromCharCode(...e.subarray(0, ry)));
	let s = {
		status: t === "complete" && e.length === 0 ? "empty" : t,
		text: a,
		encoding: o ? "base64" : "utf-8",
		...i ? { reason: i } : {}
	};
	if (ay.encode(JSON.stringify(s)).length <= ry) return s;
	s.status = t === "complete" ? "truncated" : t, s.truncated = !0;
	let c = 0, l = a.length;
	for (; c < l;) {
		let e = Math.ceil((c + l) / 2);
		s.text = a.slice(0, e), ay.encode(JSON.stringify(s)).length <= ry ? c = e : l = e - 1;
	}
	return o ? c -= c % 4 : c > 0 && /[\uD800-\uDBFF]/.test(a[c - 1]) && c--, s.text = a.slice(0, c), s;
}
function cy(e, t, n = "complete", r) {
	return sy(ay.encode(e.slice(0, $_)), e.length > $_ && n === "complete" ? "truncated" : n, "text/plain", t, r);
}
function ly(e) {
	return e !== "" && !/(^text\/|json|xml|javascript|graphql|x-www-form-urlencoded|multipart\/form-data)/i.test(e);
}
function uy(e) {
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
			let r = new Uint8Array($_), o = 0, s = !1, c = (c, d) => {
				s || (s = !0, clearTimeout(u), t.delete(l), n(sy(r.subarray(0, o), c, i, e.body, d)), a.cancel().catch(() => {}));
			}, l = () => c("interrupted", "capture-stopped"), u = setTimeout(() => c("timeout", "body-read-timeout"), iy);
			t.add(l), (async () => {
				try {
					for (;;) {
						let e = await a.read();
						if (s) break;
						if (e.done) {
							c("complete");
							break;
						}
						let t = e.value.subarray(0, $_ - o);
						if (r.set(t, o), o += t.length, o === $_) {
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
				if (t instanceof URLSearchParams && (t = t.toString()), typeof t == "string") return Promise.resolve(cy(t, e.body));
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
		text: (t, n, r) => cy(t, e.body, n, r),
		stop() {
			n = !1;
			for (let e of t) e();
		}
	};
}
var dy = () => Promise.resolve({ status: "empty" }), fy = (e) => Promise.resolve({
	status: "unavailable",
	reason: e
}), py = (e) => new URL(e, location.href).href, my = /* @__PURE__ */ new Set([
	"x-amz-security-token",
	"private-token",
	"x-token"
]), hy = (e, t) => my.has(e.toLowerCase()) || tv(e) ? W_ : t, gy = (e) => Object.fromEntries(Array.from(e.entries(), ([e, t]) => [e, hy(e, t)]));
function _y(e) {
	return typeof e == "object" && !!e && "name" in e && e.name === "AbortError";
}
function vy(e) {
	let t = !0, { redact: n = av() } = e, r = uy(n), i = e.ignoreUrls.map((e) => typeof e == "string" ? py(e) : new RegExp(e.source, e.flags)), a = (e) => i.some((t) => typeof t == "string" ? e.startsWith(t) : (t.lastIndex = 0, t.test(e))), o = (r, i, a, o, s, c, l) => {
		let u = Math.round(performance.now() - o), d = Date.now();
		Promise.all([a, l?.body ?? fy("no-response")]).then(([a, o]) => {
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
				url: py(t ? t.url : String(e)),
				method: (n?.method ?? t?.method ?? "GET").toUpperCase(),
				headers: gy(new Headers(n?.headers ?? t?.headers))
			}, c = a(i.url);
		} catch {
			return s.call(globalThis, e, n);
		}
		if (c) return s.call(globalThis, e, n);
		let l = performance.now(), u;
		try {
			u = n?.body == null ? typeof Request < "u" && e instanceof Request ? r.read(e.clone().body, i.headers["content-type"]) : dy() : r.body(n.body, i.headers["content-type"]);
		} catch {
			u = fy("request-clone-failed");
		}
		let d = (e) => o("fetch", i, u, l, null, _y(e) ? "aborted" : "error"), f;
		try {
			f = s.call(globalThis, e, n);
		} catch (e) {
			throw d(e), e;
		}
		return f.then((e) => {
			if (!t) return;
			let n;
			try {
				n = e.type === "opaque" || e.type === "opaqueredirect" ? fy("opaque-response") : r.read(e.clone().body, e.headers.get("content-type") ?? "");
			} catch {
				n = fy("response-clone-failed");
			}
			o("fetch", i, u, l, e.status, "ok", {
				url: e.url,
				headers: gy(e.headers),
				body: n
			});
		}, d).catch(() => {}), f;
	};
	typeof s == "function" && (globalThis.fetch = c);
	let l = yy(a, o, r);
	return () => {
		t = !1, r.stop(), globalThis.fetch === c && (globalThis.fetch = s), l();
	};
}
function yy(e, t, n) {
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
				url: py(String(t)),
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
			n.append(e, t), r.headers = gy(n);
		} catch {}
		return n;
	}, p = function(r) {
		let i = s.get(this);
		if (!u || !i || e(i.url)) return a.call(this, r);
		let o = performance.now(), d;
		try {
			d = typeof Document < "u" && r instanceof Document ? Promise.resolve(n.text(new XMLSerializer().serializeToString(r))) : n.body(r, i.headers["content-type"]);
		} catch {
			d = fy("request-body-unavailable");
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
						r[n] = hy(n, e.slice(t + 1).trim());
					}
				}
			} catch {}
			let a;
			try {
				a = this.responseType === "" || this.responseType === "text" ? Promise.resolve(n.text(this.responseText, e === "ok" ? "complete" : "interrupted", e === "ok" ? void 0 : `request-${e}`)) : this.responseType === "json" ? Promise.resolve(n.text(JSON.stringify(this.response))) : this.responseType === "document" ? this.responseXML ? Promise.resolve(n.text(new XMLSerializer().serializeToString(this.responseXML))) : fy("empty-document") : n.body(this.response, r["content-type"] ?? "application/octet-stream");
			} catch {
				a = fy("response-body-unavailable");
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
			throw m(), t("xhr", i, d, o, null, _y(e) ? "aborted" : "error"), e;
		}
	};
	return r.open = d, r.send = p, r.setRequestHeader = f, () => {
		u = !1;
		for (let e of c) e();
		r.open === d && (r.open = i), r.send === p && (r.send = a), r.setRequestHeader === f && (r.setRequestHeader = o);
	};
}
function by(e, t = []) {
	return e;
}
var xy = 50, Sy = 2e3, Cy = new Set(U_);
function wy(e) {
	let { sink: t, routes: n, beforeSend: r, enrich: i } = e, a = {
		clicks: !0,
		navigation: !0,
		network: !0,
		inputs: !0,
		...e.capture
	}, o = null, s = 0, c = () => by(location.pathname, n), l = (e) => {
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
			n.queue.push(a), n.queue.length >= xy && l();
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
			}, p = av();
			d.uninstalls.push(p.watch());
			let m = [...e.ignoreUrls ?? [], ...t.url === void 0 ? [] : [t.url]];
			if (a.clicks && d.uninstalls.push(Jv({
				emit: f,
				getRoute: c,
				enrich: i,
				redact: p
			})), a.navigation && d.uninstalls.push(ty({
				emit: f,
				routes: n,
				redact: p
			})), a.network && d.uninstalls.push(vy({
				emit: f,
				routes: n,
				ignoreUrls: m,
				redact: p
			})), a.inputs) {
				let e = Zv({
					emit: f,
					redact: p
				});
				d.flushInputs = e.flush, d.uninstalls.push(e);
			}
			let h = () => l({ beacon: !0 });
			window.addEventListener("pagehide", h), d.uninstalls.push(() => window.removeEventListener("pagehide", h)), d.timer = setInterval(() => l(), Sy), u("page", {
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
			Cy.has(e) ? console.warn(`[@copilotkit/learning] "${e}" is a built-in event name. Use your own name, such as "deal.approved".`) : u(e, t);
		},
		ɵemit: (e, t) => u(e, t),
		get trajectoryId() {
			return o?.trajectoryId ?? null;
		}
	};
}
var Ty = new Set(U_);
function Ey(e, t = /* @__PURE__ */ new Set()) {
	if (typeof e == "string") return !e.includes("\0");
	if (e === null || typeof e == "boolean") return !0;
	if (typeof e == "number") return Number.isFinite(e);
	if (typeof e != "object" || t.has(e) || !Array.isArray(e) && Object.getPrototypeOf(e) !== Object.prototype && Object.getPrototypeOf(e) !== null || (t.add(e), !Array.isArray(e) && Object.keys(e).some((e) => e.includes("\0")))) return !1;
	let n = Array.isArray(e) ? e : Object.values(e);
	for (let e of n) if (!Ey(e, t)) return !1;
	return t.delete(e), !0;
}
function Dy(e) {
	let t = !1, n = 0, r = [], i, a = (t, n) => {
		try {
			e.onError?.({
				code: t,
				message: n
			});
		} catch {}
	}, o = () => by(location.pathname), s = (r, o) => {
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
			if (l.type !== "CUSTOM" || typeof l.name != "string" || !l.name.trim() || l.name.length > 200 || l.name.includes("\0") || !Number.isFinite(l.timestamp) || l.timestamp <= 0 || l.timestamp >= 0xe677d21fdc00 || !Ey(l.value)) {
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
			let u = av();
			try {
				if (r.push(u.watch()), e.capture?.clicks !== !1 && r.push(Jv({
					emit: c,
					getRoute: o,
					redact: u
				})), e.capture?.navigation !== !1 && r.push(ty({
					emit: c,
					redact: u
				})), e.capture?.inputs !== !1) {
					let e = Zv({
						emit: c,
						redact: u
					});
					i = e.flush, r.push(e);
				}
				e.capture?.network !== !1 && r.push(vy({
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
			t && (Ty.has(e) ? a("INVALID_EVENT", "Use a developer event name, not a reserved capture name.") : s(e, n));
		}
	};
}
// node_modules/@copilotkit/core/dist/index.mjs
function Oy(e) {
	if (e instanceof em) return !0;
	if (typeof e != "object" || !e) return !1;
	let t = e;
	return typeof t.url == "string" && typeof t.headers == "object" && t.headers !== null && t.abortController instanceof AbortController && typeof t.runAgent == "function";
}
async function ky(e, t, n, r) {
	let i = e, a = () => {
		e.isRunning = !1;
	};
	try {
		e.isRunning = !0, e.agentId = e.agentId ?? of();
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
		], f = new xn();
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
		}, te = S(() => new Dp().run(o, { run: () => r ? r(o, ee) : i.connect(o) })).pipe(wi((e) => {
			!l && e.type === _.RUN_ERROR && u.add(e);
		}), Kf(i.debugLogger), Ci(f)), ne = i.apply(o, te, d);
		await Or(i.processApplyEvents(o, ne, d).pipe(ni((t) => i.activeRunDetach$ !== f || (e.isRunning = !1, t instanceof Fe) ? Un : i.onError(o, t, d)), _i(() => a())), { defaultValue: void 0 });
		let re = P(e.messages).filter((e) => !c.has(e.id));
		return {
			result: s,
			newMessages: re
		};
	} finally {
		a();
	}
}
function Ay(e) {
	return new fn((t) => {
		e.onOpen(() => t.next({ type: "open" })), e.onError((e) => t.next({
			type: "error",
			error: e
		}));
	});
}
function jy(e) {
	return new fn((t) => {
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
function My(e) {
	return S(() => {
		let t = new hh(e.url, {
			heartbeatIntervalMs: 15e3,
			...e.options
		}), n = Ay(t).pipe(xi({
			bufferSize: 1,
			refCount: !0
		}));
		return t.connect(), Zr(y({
			socket: t,
			signals$: n
		}), ei).pipe(_i(() => t.disconnect()));
	});
}
function Ny(e) {
	return e.socket$.pipe(C(({ socket: t }) => S(() => {
		let n = t.channel(e.topic, e.params);
		return Zr(y({
			channel: n,
			joinOutcome$: jy(n).pipe(xi({
				bufferSize: 1,
				refCount: !0
			}))
		}), ei).pipe(_i(() => {
			e.leaveOnUnsubscribe !== !1 && n.leave();
		}));
	})));
}
function Py(e, t) {
	return new fn((n) => {
		let r = e.on(t, (e) => n.next(e));
		return () => {
			e.off(t, r);
		};
	});
}
function Fy(e) {
	return e.pipe(C((e) => e.joinOutcome$));
}
function Iy(e) {
	return Fy(e).pipe(ci(1), Jr((e) => {
		if (e.type === "joined") return Un;
		throw e.type === "timeout" ? /* @__PURE__ */ Error("Timed out joining channel") : /* @__PURE__ */ Error(`Failed to join channel: ${JSON.stringify(e.response)}`);
	}));
}
function Ly(e) {
	return e.pipe(C((e) => e.signals$));
}
function Ry(e, t) {
	return e.pipe(vi((e, t) => t.type === "open" ? 0 : e + 1, 0), ti((e) => e >= t), ci(1), Jr((e) => b(() => /* @__PURE__ */ Error(`WebSocket connection failed after ${e} consecutive errors`))));
}
var zy = (...e) => fetch(...e), By = "ag_ui_event", Vy = "replay_complete", Hy = "replay_failed", Uy = "stream_idle", Wy = "stop_run", Gy = 100, Ky = 3e4, qy = 2;
function Jy(e) {
	let t = e.forwardedProps, n = t?.__proxiedMCPRequest;
	return t?.__copilotkitMcpResourceReadOnly === !0 && typeof n == "object" && !!n && n.method === "resources/read";
}
var Yy = class extends Error {
	constructor(e) {
		super(e ? `Thread ${e} is locked` : "Thread is locked"), this.name = "AgentThreadLockedError";
	}
};
function Xy(e) {
	return typeof e == "object" && !!e && "activeRunCompletionPromise" in e;
}
var Zy = class e extends Qp {
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
		return ky(this, n, t, (e, t) => this.connect(e, t));
	}
	abortRun() {
		if (this.activeChannel && this.canonicalRunId) {
			let e = setTimeout(() => t(), 5e3), t = () => {
				clearTimeout(e), this.detachActiveRun(), this.cleanup();
			};
			this.activeChannel.push(Wy, { run_id: this.canonicalRunId }).receive("ok", t).receive("error", t).receive("timeout", t);
		} else this.detachActiveRun(), this.cleanup();
	}
	run(e) {
		return Jy(e) || (this.threadId = e.threadId, this.canonicalRunId = e.runId), S(() => this.requestJoinCredentials$("run", e)).pipe(C((t) => {
			if (t === null) return b(() => /* @__PURE__ */ Error("REST run request returned no credentials"));
			if ("kind" in t) return y({
				type: _.RUN_STARTED,
				threadId: t.threadId,
				runId: t.runId
			}, {
				type: _.RUN_FINISHED,
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
		return S(() => this.requestJoinCredentials$("connect", e, n)).pipe(C((r) => {
			if (r === null) return t?.onReplayStarted?.(), t?.onReplayFinished?.(), Un;
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
		return S(async () => {
			try {
				let r = this.config.fetch ?? zy, i = {
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
				if (o.status === 409 && e === "run") throw new Yy(t.threadId);
				if (!o.ok) {
					let e = await o.text().catch(() => "");
					throw Error(e || o.statusText || String(o.status));
				}
				let s = await o.json();
				if (e === "run" && Jy(t) && typeof s == "object" && s && s.kind === "mcp-resource-read") {
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
				throw t instanceof Yy ? t : Error(`REST ${e} request failed: ${t instanceof Error ? t.message : String(t)}`, { cause: t });
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
		return S(() => {
			let a = !1;
			return this.observeThreadSession$(e, t, {
				...i,
				onSocketOpen: () => {
					a = !0;
				}
			}).pipe(ni((o) => {
				if (!this.isSocketReconnectExhaustedError(o)) return b(() => o);
				let s = a ? 0 : r + 1;
				if (n.streamMode === "run" && s > qy) return b(() => /* @__PURE__ */ Error(`Realtime connection to ${t.realtime.clientUrl} never opened in ${s} connection attempts. The realtime endpoint is unavailable.`));
				let c = this.getReconnectCursor(e);
				return this.requestJoinCredentials$("connect", e, c).pipe(C((t) => t === null ? Un : this.observeThread$(this.applyCanonicalRunIdentity(e, t, { fallbackToInputRunId: n.streamMode === "run" }), t, {
					...i,
					channelMode: "connect",
					replayCursor: c,
					unopenedRefreshes: s
				})));
			}));
		});
	}
	observeThreadSession$(e, t, n) {
		return S(() => {
			n.lifecycle?.onReplayStarted?.();
			let r = null, i = null, a = !1, o = !1, s, c = () => {
				clearTimeout(s), s = void 0;
			}, l = () => {
				c(), n.streamMode === "connect" && a && !o && (s = setTimeout(() => {
					o = !0, this.debugLogger?.lifecycle("INTELLIGENCE", "No progress or stream_idle for 30 seconds after replay_complete; the run may still be active or its status unavailable.", { threadId: e.threadId });
				}, Ky));
			}, u = My({
				url: t.realtime.clientUrl,
				options: {
					params: {
						...this.config.socketParams,
						join_token: t.joinToken
					},
					reconnectAfterMs: ym(100, 1e4),
					rejoinAfterMs: ym(1e3, 3e4)
				}
			}).pipe(wi(({ socket: e }) => {
				r = e, this.socket = r;
			}), xi({
				bufferSize: 1,
				refCount: !0
			})), d = this.createThreadChannelParams(e, n.channelMode ?? n.streamMode, n.replayCursor), f = Ny({
				socket$: u,
				topic: t.realtime.topic,
				params: d
			}).pipe(wi(({ channel: e }) => {
				i = e, this.activeChannel = i;
			}), xi({
				bufferSize: 1,
				refCount: !0
			})), p = this.readDurableEventId(n.replayCursor ?? this.getReconnectCursor(e)), m = null, h = this.observeThreadEvents$(e.threadId, f, n).pipe(wi((e) => {
				m = this.readEventId(e) ?? m, l();
			}), yi()), g = {
				applied: null,
				replayFailed: !1
			}, ee = f.pipe(C(({ channel: e }) => this.observeChannelEvent$(e, Hy)), wi(() => {
				g.replayFailed = !0;
			})), te = this.observeControlEvent$(e.threadId, f, Vy, g).pipe(wi(() => {
				a = !0, l(), n.lifecycle?.onReplayFinished?.();
			}), yi()), ne = this.observeControlEvent$(e.threadId, f, Uy, g).pipe(yi()), re = $r(this.observeControlEvent$(e.threadId, f, "phx_error", g), Ly(u).pipe(ti((e) => e.type === "error"))).pipe(wi(() => {
				a = !1, o = !1, c(), n.lifecycle?.onReplayStarted?.();
			}), yi()), ie = n.streamMode === "connect" ? re.pipe(Si(null), C(() => $r(Wr([te.pipe(ci(1)), ne.pipe(ci(1))]), ne.pipe(ci(1), ti((e) => this.canFallbackCompleteConnect(e, p, m)), fi(Gy), wi(() => {
				this.debugLogger?.lifecycle("INTELLIGENCE", "Completing connection on stream_idle fallback without replay_complete.", {
					threadId: e.threadId,
					fallbackMs: Gy
				});
			})))), ci(1), xi({
				bufferSize: 1,
				refCount: !0
			})) : Un, ae = h.pipe(li(), gi(null), ci(1)), oe = $r(ae, ie);
			return $r(ee.pipe(li(), Ci(oe)), te.pipe(li(), Ci(oe)), this.joinThreadChannel$(f), this.observeSocketHealth$(u, n.onSocketOpen).pipe(Ci(oe)), h.pipe(Ci(ie)), ie.pipe(li(), Ci(ae))).pipe(_i(() => {
				c(), this.cleanupOwned(i, r);
			}));
		});
	}
	joinThreadChannel$(e) {
		return Iy(e);
	}
	observeSocketHealth$(e, t) {
		return Ry(Ly(e).pipe(wi((e) => {
			e.type === "open" && t?.();
		})), 5);
	}
	observeThreadEvents$(e, t, n) {
		return t.pipe(C(({ channel: e }) => this.observeChannelEvent$(e, By)), wi((t) => {
			this.updateLastSeenEventId(e, t);
		}), x((e) => n.streamMode === "run" ? km(e) : e), Jr((e) => this.createThreadNotifications(e, {
			completeOnRunError: n.completeOnRunError,
			completeOnRunFinished: n.streamMode === "run",
			errorOnRunError: n.streamMode === "run"
		})), pi());
	}
	observeControlEvent$(e, t, n, r) {
		return t.pipe(C(({ channel: e }) => this.observeChannelEvent$(e, n)), wi((t) => this.updateLastSeenEventIdFromControl(e, t, r)));
	}
	observeChannelEvent$(e, t) {
		return Py(e, t);
	}
	createThreadNotifications(e, t) {
		if (e.type === _.RUN_FINISHED) return t.completeOnRunFinished ? [Tr.createNext(e), Tr.createComplete()] : [Tr.createNext(e)];
		if (e.type === _.RUN_ERROR) {
			let n = e.message ?? "Run error";
			return t.completeOnRunError ? [Tr.createNext(e), Tr.createComplete()] : t.errorOnRunError ? [Tr.createNext(e), Tr.createError(Error(n))] : [Tr.createNext(e)];
		}
		return [Tr.createNext(e)];
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
async function Qy(e) {
	let t = `Runtime info request failed with status ${e.status}`, n;
	try {
		let t = (await e.clone().json())?.message;
		typeof t == "string" && t.trim().length > 0 && (n = t.trim());
	} catch {}
	let r = Error(n ? `${t}: ${n}` : t);
	return r.runtimeInfoStatus = e.status, r;
}
function $y(e) {
	return typeof e == "object" && !!e && typeof e.runtimeInfoStatus == "number";
}
function eb(e) {
	let t = e.toolCalls;
	return Array.isArray(t) ? t.map((e) => e.id).filter((e) => !!e) : [];
}
function tb(e) {
	if (e.role === "tool") return e.toolCallId;
}
function nb(e, t) {
	let n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
	for (let e of t) {
		for (let t of eb(e)) n.set(t, e);
		let t = tb(e);
		t !== void 0 && r.set(t, e);
	}
	let i = [], a = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Set(), s = (e) => {
		a.has(e.id) || (a.add(e.id), i.push(e));
	}, c = (e) => {
		if (s(e), !o.has(e)) {
			o.add(e);
			for (let t of eb(e)) {
				let e = r.get(t);
				e && s(e);
			}
		}
	};
	for (let t of e) {
		let e = tb(t);
		if (e === void 0) {
			c(t);
			continue;
		}
		let r = n.get(e);
		r ? c(r) : s(t);
	}
	return i;
}
function rb(e) {
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), r = (e, t) => {
		t.open = !1, n.set(e, n.get(e) - 1);
	}, i = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map(), o = -1;
	for (let s = 0; s < e.length; s++) {
		let c = e[s];
		if (ab(c)) continue;
		let l = ob(c);
		if (l !== "tool") {
			o = s;
			let e = l === "assistant" ? c.toolCalls : void 0;
			if (!Array.isArray(e)) continue;
			for (let r of e) {
				if (typeof r != "object" || !r) continue;
				let e = r.id;
				typeof e == "string" && (ib(t, e, {
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
			ib(a, u, s);
			continue;
		}
		let f;
		for (let e = d.length - 1; e >= 0; e--) {
			let t = d[e];
			if (t.issuer !== o) break;
			t.open && (f = t);
		}
		f ? r(u, f) : n.get(u) > 0 && ib(i, u, s);
	}
	let s = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Set(), l = (e, t, n) => {
		r(e, t), c.add(n), ib(s, t.issuer, n);
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
		for (let e = u.length - 1; e >= 0 && ab(u[e]); e--) ob(u[e]) === "reasoning" && (n = e);
		u.splice(n, 0, ...[...t].sort((e, t) => e - t).map((t) => e[t]));
	};
	for (let t = 0; t < e.length; t++) {
		if (c.has(t)) continue;
		let n = e[t];
		!ab(n) && ob(n) !== "tool" && (f(), d = t), u.push(n);
	}
	return f(), u;
}
function ib(e, t, n) {
	let r = e.get(t);
	r ? r.push(n) : e.set(t, [n]);
}
function ab(e) {
	return typeof e != "object" || !e || Array.isArray(e) || e.role === "activity" || e.role === "reasoning";
}
function ob(e) {
	if (typeof e == "object" && e) return e.role;
}
function sb(e) {
	return "headers" in e;
}
function cb(e) {
	return "credentials" in e;
}
function lb(e) {
	return typeof e == "object" && !!e && "name" in e && e.name === "ZodError";
}
function ub(e) {
	return (e instanceof DOMException || e instanceof Error) && e.name === "AbortError";
}
function db(e) {
	return e.pipe(ni((e) => {
		if (lb(e) || ub(e)) return Un;
		throw e;
	}));
}
var fb = class e extends em {
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
			let r = n === void 0 ? rb(t) : nb(n, t);
			return {
				...e,
				messages: r
			};
		} catch (t) {
			if (n === void 0) return console.warn(`ProxiedCopilotRuntimeAgent: tool-call repair failed for agent "${r}"; sending the message history unrepaired instead.`, t), e;
			try {
				let i = rb(n);
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
			n = P(e);
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
		if (this.runtimeMode !== "intelligence") return ky(this, e, t, (e, t) => this.connect(e, t));
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
				a() && (this.pendingInterrupts = P(o.pendingInterrupts), this.isRunning = !1);
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
			return a() && (this.setMessages([...o.messages]), this.setState({ ...o.state }), this.pendingInterrupts = P(o.pendingInterrupts)), t;
		} finally {
			a() && (this.isRunning = !1), s.unsubscribe();
			for (let e of c) e.unsubscribe();
		}
	}
	connect(e, t) {
		return this.runtimeMode === "pending" || this.transport === "auto" && this.runtimeMode !== "intelligence" ? S(() => Cr(this.ensureRuntimeConfiguration())).pipe(C(() => this.connect(e, t))) : this.runtimeMode === "intelligence" ? this.#n(e, t) : this.#r(e);
	}
	run(e) {
		return this.runtimeMode === "pending" || this.transport === "auto" && this.runtimeMode !== "intelligence" ? S(() => Cr(this.ensureRuntimeConfiguration())).pipe(C(() => this.run(e))) : this.runtimeMode === "intelligence" ? this.#i(e) : this.#a(e);
	}
	#n(e, t) {
		return S(() => Cr(this.resolveDelegate())).pipe(C((n) => db(n.connect(e, t))));
	}
	#r(e) {
		let t = this.#e(e);
		this.activeRun = void 0;
		let n = this.routedAgentId(), r;
		if (this.transport === "single") {
			if (!this.singleEndpointUrl) throw Error("Single endpoint transport requires a runtimeUrl");
			let e = this.createSingleRouteRequestInit(t, "agent/connect", { agentId: n });
			r = xf(() => this.fetch(this.singleEndpointUrl, e));
		} else {
			let e = `${this.runtimeUrl}/agent/${n}/connect`, i = this.requestInit(t);
			r = xf(() => this.fetch(e, i));
		}
		return db(S(() => {
			let e = !1, t = [{
				type: _.MESSAGES_SNAPSHOT,
				messages: []
			}, {
				type: _.STATE_SNAPSHOT,
				snapshot: {}
			}];
			return Df(r).pipe(ii((n) => e ? y(n) : (e = !0, Cr([...t, n]))), oi(S(() => e ? Un : Cr(t))));
		}));
	}
	#i(e) {
		return S(() => Cr(this.resolveDelegate())).pipe(C((t) => db(t.run(e))));
	}
	#a(e) {
		let t = this.#e(e), n = {
			threadId: t.threadId,
			runId: t.runId
		}, r = (e) => (this.activeRun = n, e.pipe(_i(() => {
			this.activeRun === n && (this.activeRun = void 0);
		})));
		if (this.transport === "single") {
			if (!this.singleEndpointUrl) throw Error("Single endpoint transport requires a runtimeUrl");
			let e = this.createSingleRouteRequestInit(t, "agent/run", { agentId: this.routedAgentId() });
			return r(db(Df(xf(() => this.fetch(this.singleEndpointUrl, e)))));
		}
		return r(db(super.run(t)));
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
		if (t.threadId = this.threadId, t.setState(this.state), t.setMessages(this.messages), t.pendingInterrupts = P(this.pendingInterrupts), this.delegate) {
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
		if (!r.ok) throw await Qy(r);
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
		if (!r.ok) throw await Qy(r);
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
		return new Zy({
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
		e.agentId = this.routedAgentId(), e.description = this.description, e.threadId = this.threadId, e.debugLogger = this.debugLogger, e.setMessages(this.messages), e.setState(this.state), e.pendingInterrupts = P(this.pendingInterrupts), sb(e) && (e.headers = { ...this.headers }), cb(e) && (e.credentials = this.credentials);
	}
}, pb = /* @__PURE__ */ new Set([
	"Fetch is aborted",
	"signal is aborted without reason",
	"component unmounted"
]);
function mb(e) {
	if (typeof e != "object" || !e) return !1;
	let { name: t, message: n } = e;
	return t === "AbortError" || typeof n == "string" && pb.has(n);
}
var hb = 1e4;
function gb(e) {
	return e?.ɵruntimeRequest;
}
function _b(e) {
	return e === "/threads" || e.startsWith("/threads/") || e === "/memories" || e.startsWith("/memories/") || e === "/annotate";
}
async function vb(e, t, n, r) {
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
async function yb(e, t, n) {
	let r = typeof window < "u" && window.location?.href ? window.location.href : "http://localhost", i = new URL(n, r), a = e instanceof Request ? e.url : e instanceof URL ? e.href : e, o = new URL(a, r), s = i.pathname.replace(/\/$/, "");
	if (o.origin !== i.origin || !o.pathname.startsWith(`${s}/`)) return null;
	let c = o.pathname.slice(s.length);
	if (!_b(c)) return null;
	let l = (t?.method ?? (e instanceof Request ? e.method : "GET")).toUpperCase(), u = new Headers(t?.headers ?? (e instanceof Request ? e.headers : void 0)), d = await vb(e, t, u, l);
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
var bb = class extends Error {
	name = "CopilotKitHeaderResolutionError";
	constructor(e) {
		super("[CopilotKit] Failed to resolve request headers", { cause: e });
	}
};
function xb(e) {
	let t = e;
	for (let e = 0; e < 5 && t; e++) {
		if (t instanceof bb) return !0;
		t = t.cause;
	}
	return !1;
}
function Sb(e) {
	return typeof e == "object" && !!e && typeof e.then == "function";
}
function Cb(e) {
	return Object.fromEntries(Object.entries(e).filter((e) => e[1] != null));
}
function wb(e, t) {
	let n = Object.keys(e), r = Object.keys(t);
	return n.length === r.length && n.every((n) => e[n] === t[n]);
}
function Tb(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
var Eb = class {
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
		let t = typeof e == "function" ? {} : Cb(e);
		return typeof e != "function" && typeof this.source != "function" && wb(t, this.snapshot) ? !1 : (this.source = e, this.sourceGeneration += 1, this.inFlight = void 0, this.snapshot = t, !0);
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
		if (!Sb(n)) return this.accept(n, t);
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
		if (!Tb(e)) throw this.fail(/* @__PURE__ */ TypeError("headers builder must return an object of header values"));
		let n = Cb(e);
		return t === this.sourceGeneration ? (wb(n, this.snapshot) || (this.snapshot = n), this.snapshot) : n;
	}
	fail(e) {
		if (e instanceof bb) return e;
		let t = new bb(e);
		return this.onFailure(t), t;
	}
}, Db = /* @__PURE__ */ new Set(["content-type", "accept"]);
function Ob(e, t) {
	if (e instanceof Headers) {
		let n = new Headers(e);
		for (let [e, r] of Object.entries(t)) Db.has(e.toLowerCase()) && n.has(e) || n.set(e, r);
		return n;
	}
	let n = Array.isArray(e) ? Object.fromEntries(e) : { ...e }, r = new Map(Object.keys(n).map((e) => [e.toLowerCase(), e]));
	for (let [e, i] of Object.entries(t)) {
		let t = r.get(e.toLowerCase());
		if (t !== void 0) {
			if (Db.has(e.toLowerCase())) continue;
			delete n[t];
		}
		n[e] = i;
	}
	return n;
}
async function kb(e, t) {
	if (!t || !Sb(e)) return e;
	if (t.aborted) throw Ab(t);
	return new Promise((n, r) => {
		let i = () => r(Ab(t));
		t.addEventListener("abort", i, { once: !0 }), Promise.resolve(e).then((e) => {
			t.removeEventListener("abort", i), n(e);
		}, (e) => {
			t.removeEventListener("abort", i), r(e);
		});
	});
}
function Ab(e) {
	return e.reason instanceof Error ? e.reason : new DOMException("The operation was aborted.", "AbortError");
}
function jb(e, t) {
	if (Object.keys(t).length === 0) return e;
	let n = (e) => {
		let n = { ...e };
		for (let [e, r] of Object.entries(t)) n[e] || (n[e] = r);
		return n;
	};
	return typeof e == "function" ? (() => {
		let t = e();
		return Sb(t) ? Promise.resolve(t).then((e) => Tb(e) ? n(e) : e) : Tb(t) ? n(t) : t;
	}) : n(e);
}
var Mb = 5e3, Nb = 5e3;
function Pb(e, t) {
	return t?.nonCritical ? "ignored" : mb(e) && !t?.timedOut ? "aborted" : "failed";
}
function Fb(e) {
	let t = new Headers(e);
	return t.has("content-type") || t.set("content-type", "application/json"), t;
}
var Ib = 5e3, Lb = class {
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
	_runtimeConnectionStatus = MS.Disconnected;
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
		typeof window < "u" && this._runtimeUrl && this._runtimeConnectionStatus === MS.Disconnected && this.updateRuntimeConnection();
	}
	setRuntimeTransport(e) {
		this._requestedTransport !== e && (this.invalidateInspectorMetadataConnection(), this.abandonRuntimeHealthProbe(), this.resetRuntimeEntitlementRetry(), this._requestedTransport = e, this._runtimeTransport = e, this._singleRouteResourceOperations = !1, this.updateRuntimeConnection({ preserveOnFailure: this.hasLiveRuntimeKnowledgeToProtect() }));
	}
	hasLiveRuntimeKnowledgeToProtect() {
		return Object.keys(this.remoteAgents).length !== 0 && this._runtimeConnectionStatus !== MS.Connected;
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
		let n = this.core, r = n.debug, i = new fb({
			runtimeUrl: this._runtimeEndpointUrl ?? this._runtimeUrl,
			agentId: e,
			runtimeAgentId: t,
			transport: this._runtimeTransport,
			credentials: n.credentials,
			runtimeMode: this._runtimeUrl ? this._runtimeConnectionStatus === MS.Connected ? this._runtimeMode : "pending" : "sse",
			intelligence: this._intelligence,
			debug: r ? wm(r) : void 0,
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
		(this.runtimeUrl === void 0 || this.runtimeConnectionStatus !== MS.Disconnected && this.runtimeConnectionStatus !== MS.Connecting) && console.warn(`Agent ${e} not found`);
	}
	applyHeaderRecordToAgent(e, t) {
		this.agentOwnHeaders.has(e) || this.agentOwnHeaders.set(e, { ...e.headers });
		let n = this.agentOwnHeaders.get(e);
		e instanceof fb ? (e.headers = { ...n }, this.applyRuntimeFetchToAgent(e)) : e.headers = {
			...n,
			...t
		};
	}
	applyHeadersToAgent(e) {
		if (!Oy(e)) return;
		let t = this.core;
		this.applyHeaderRecordToAgent(e, t.headers);
	}
	applyHeadersToAgents(e) {
		let t = this.core;
		Object.values(e).forEach((e) => {
			Oy(e) && this.applyHeaderRecordToAgent(e, t.headers);
		});
	}
	prepareAgentHeadersForRun(e) {
		if (!Oy(e)) return;
		if (e instanceof fb) {
			this.applyHeaderRecordToAgent(e, {});
			return;
		}
		let t = this.core.resolveHeaders();
		if (Sb(t)) return Promise.resolve(t).then((t) => {
			this.applyHeaderRecordToAgent(e, t);
		});
		this.applyHeaderRecordToAgent(e, t);
	}
	applyCredentialsToAgent(e) {
		e instanceof fb && (e.credentials = this.core.credentials);
	}
	applyCredentialsToAgents(e) {
		Object.values(e).forEach((e) => {
			this.applyCredentialsToAgent(e);
		});
	}
	applyRuntimeModeToAgent(e, t) {
		e instanceof fb && e.adoptRuntimeMode(t.mode ?? "sse", t.intelligence);
	}
	applyMessageFilterToAgent(e) {
		e instanceof fb && (e.messageFilter = this.core.messageFilter);
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
			let n = this.core, r = await kb(n.resolveHeaders(), t?.signal), i = Ob(t?.headers ?? (e instanceof Request ? e.headers : void 0), r);
			t = {
				...t,
				headers: i
			};
			let a = () => gb(t), o = this.armRuntimeRequestWatchdog(a());
			try {
				let n = this._runtimeTransport === "single" && this._singleRouteResourceOperations && this._runtimeUrl ? await yb(e, t, this._runtimeEndpointUrl ?? this._runtimeUrl) : null, r = n ? await fetch(n.input, n.init) : await fetch(e, t);
				return o.clear(), this.handleRuntimeRequestOutcome(r.ok ? "ok" : a()?.nonCritical ? "ignored" : "failed", o.checked), r;
			} catch (e) {
				throw o.clear(), this.handleRuntimeRequestOutcome(Pb(e, a()), o.checked), e;
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
		}, hb);
		return {
			clear: () => clearTimeout(n),
			checked: () => t
		};
	}
	applyRuntimeFetchToAgent(e) {
		e instanceof fb && (e.fetch = this.createRuntimeFetch());
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
		if (this.inspectorMetadataAbortController?.abort(), this.inspectorMetadataAbortController = void 0, !this._inspectorMetadataSupported || !this.inspectorMetadataRefreshReady || !this.runtimeUrl || this._runtimeConnectionStatus !== MS.Connected) {
			this.setInspectorMetadata(void 0);
			return;
		}
		let t = this.runtimeUrl, n = this._requestedTransport, r = this._runtimeTransport, i = this.inspectorMetadataHeadersGeneration, a = this.inspectorMetadataCredentialsGeneration, o = this.core, s;
		try {
			let e = o.resolveHeaders();
			s = { ...Sb(e) ? await e : e };
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
			}, Mb);
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
				if (e.status !== 204 && e.ok) return mm(await e.json());
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
			headers: Fb(t),
			body: JSON.stringify({ method: "inspector/metadata" }),
			...n ? { credentials: n } : {},
			signal: r
		});
	}
	isInspectorMetadataRequestCurrent({ generation: e, runtimeUrl: t, requestedTransport: n, resolvedTransport: r, headersGeneration: i, credentialsGeneration: a, signal: o, allowAbortedSignal: s = !1 }) {
		return (s || !o.aborted) && e === this.inspectorMetadataGeneration && t === this.runtimeUrl && n === this._requestedTransport && r === this._runtimeTransport && i === this.inspectorMetadataHeadersGeneration && a === this.inspectorMetadataCredentialsGeneration && this._inspectorMetadataSupported && this.inspectorMetadataRefreshReady && this._runtimeConnectionStatus === MS.Connected;
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
		return e === "aborted" || e === "ignored" || e === "failed" && t() || typeof window > "u" || !this._runtimeUrl ? !1 : e === "ok" ? (this.runtimeHealthGeneration += 1, this.runtimeRecoveryRunning && (this.runtimeRecoveryPending = !0), this._runtimeConnectionStatus === MS.Error && this.recoverRuntimeConnection(), !1) : this._runtimeConnectionStatus !== MS.Connected || this.runtimeProbeInFlight ? !1 : (this.probeRuntimeReachability(), !0);
	}
	async fetchRuntimeInfoWithTimeout(e, t = this.runtimeUrl, n = this._runtimeTransport) {
		if (!t) throw Error("Runtime URL is not set");
		let r, i = this.fetchRuntimeInfo(t, n, e.signal);
		i.catch(() => {});
		try {
			let t = new Promise((t, n) => {
				r = setTimeout(() => {
					e.abort(), n(/* @__PURE__ */ Error(`Runtime did not answer within ${Nb}ms`));
				}, Nb);
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
		if (this.setRuntimeConnectionStatus(MS.Error), await this.notifyRuntimeStatusChanged(MS.Error), xb(e)) {
			Dm.warn(`Could not resolve request headers for the identification request (${this._runtimeUrl}/info). Check the headers builder passed to CopilotKit.`);
			return;
		}
		let t = $y(e) ? e.runtimeInfoStatus : void 0;
		Dm.warn(t === void 0 ? `Runtime did not answer the identification request (${this._runtimeUrl}/info): ${e.message}. The runtime appears to be unreachable.` : `Runtime answered the identification request with status ${t} (${this._runtimeUrl}/info): ${e.message}. The runtime is reachable but refused the request — check credentials and authorisation before addresses and ports.`), await this.core.emitError({
			error: e,
			code: AS.RUNTIME_INFO_FETCH_FAILED,
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
				while (this.runtimeRecoveryPending && this._runtimeConnectionStatus !== MS.Connected);
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
				Dm.warn(`Failed to retry runtime info (${this.runtimeUrl}/info): ${t}`);
			});
		}, Ib)));
	}
	async executeRuntimeEntitlementRetry(e) {
		let t = this._connectionInFlight;
		t?.attempt.generation === e.generation && await t.promise, this._runtimeUrl && this.isCurrentRuntimeConnection(e) && await this.updateRuntimeConnection();
	}
	async performRuntimeConnection({ attempt: e, runtimeUrl: t, transport: n, options: r }) {
		let { key: i } = e;
		if (!t) {
			if (this.invalidateInspectorMetadataConnection(), this.setRuntimeConnectionStatus(MS.Disconnected), this._runtimeVersion = void 0, this._audioFileTranscriptionEnabled = !1, this._runtimeMode = "sse", this._intelligence = void 0, this._threadEndpoints = void 0, this._singleRouteResourceOperations = !1, this._suggestions = void 0, this._inspectorLearning = !1, this._a2uiEnabled = !1, this._a2uiAgents = void 0, this._openGenerativeUIEnabled = !1, this._licenseStatus = void 0, this._runtimeEntitlements = void 0, this.remoteAgents = {}, this._agents = this.localAgents, await this.notifyRuntimeStatusChanged(MS.Disconnected), !this.isCurrentRuntimeConnection(e)) return;
			await this.notifyAgentsChanged();
			return;
		}
		let a = this.inspectorMetadataConnectionGeneration;
		this.setRuntimeConnectionStatus(MS.Connecting);
		let o = this.runtimeHealthGeneration;
		if (await this.notifyRuntimeStatusChanged(MS.Connecting), this.isCurrentRuntimeConnection(e)) try {
			if (a !== this.inspectorMetadataConnectionGeneration) return;
			let { runtimeInfo: i, resolvedTransport: o } = r?.recovery ? await this.fetchRuntimeInfoWithTimeout(new AbortController(), t, n) : await this.fetchRuntimeInfo(t, n);
			if (!this.isCurrentRuntimeConnection(e) || a !== this.inspectorMetadataConnectionGeneration) return;
			this._runtimeTransport = o;
			let { version: s, ...c } = i, l = this.core.credentials, u = this.core.debug, d = Object.fromEntries(Object.entries(c.agents).map(([e, { description: n, capabilities: a }]) => {
				let o = Object.prototype.hasOwnProperty.call(this.remoteAgents, e) ? this.remoteAgents[e] : void 0;
				if (o instanceof fb && this.canReuseRuntimeAgent(o, t, this._runtimeTransport)) return this.applyHeadersToAgent(o), this.applyCredentialsToAgent(o), this.applyMessageFilterToAgent(o), this.applyRuntimeFetchToAgent(o), this.applyRuntimeModeToAgent(o, i), [e, o];
				let s = new fb({
					runtimeUrl: this._runtimeEndpointUrl ?? t,
					agentId: e,
					description: n,
					transport: this._runtimeTransport,
					credentials: l,
					runtimeMode: i.mode ?? "sse",
					intelligence: i.intelligence,
					capabilities: a,
					debug: u ? wm(u) : void 0,
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
			}, this.setRuntimeConnectionStatus(MS.Connected), this._runtimeVersion = s, this._audioFileTranscriptionEnabled = i.audioFileTranscriptionEnabled ?? !1, this._runtimeMode = i.mode ?? "sse", this._intelligence = i.intelligence, this._singleRouteResourceOperations = o === "single" && i.singleRoute?.resourceOperations === !0, this._threadEndpoints = this._singleRouteResourceOperations ? i.singleRoute?.threadEndpoints : i.threadEndpoints, this._suggestions = i.suggestions, this._inspectorLearning = i.inspectorLearning === !0, this._inspectorMetadataSupported = i.inspectorMetadata === !0, this.inspectorMetadataRefreshReady = !1, this._inspectorMetadataSupported || this.setInspectorMetadata(void 0);
			let f = i.a2ui;
			if (this._a2uiEnabled = f?.enabled ?? i.a2uiEnabled ?? !1, this._a2uiAgents = f?.enabled ? f.agents : void 0, this._openGenerativeUIEnabled = i.openGenerativeUIEnabled ?? !1, this._licenseStatus = i.licenseStatus, this._runtimeEntitlements = i.runtimeEntitlements, this.updateRuntimeEntitlementRetry(i.runtimeEntitlements, e), this._telemetryDisabled = i.telemetryDisabled ?? !1, await this.notifyRuntimeStatusChanged(MS.Connected), !this.isCurrentRuntimeConnection(e) || (await this.notifyAgentsChanged(), a !== this.inspectorMetadataConnectionGeneration || this._runtimeConnectionStatus !== MS.Connected)) return;
			this.inspectorMetadataRefreshReady = !0, this._inspectorMetadataSupported && this.refreshInspectorMetadata();
		} catch (n) {
			if (!this.isCurrentRuntimeConnection(e) || a !== this.inspectorMetadataConnectionGeneration) return;
			let s = this._runtimeEntitlementRetryTimer === void 0 && this._runtimeEntitlementRetryAttemptedKey === i && this._runtimeEntitlementRetryPendingKey === i;
			if (s && (this._runtimeEntitlementRetryPendingKey = void 0), r?.preserveOnFailure) {
				if (r?.recovery && o !== this.runtimeHealthGeneration) return;
				this.setRuntimeConnectionStatus(MS.Error), await this.notifyRuntimeStatusChanged(MS.Error);
			} else this.invalidateInspectorMetadataConnection(), this.setRuntimeConnectionStatus(MS.Error), this._runtimeVersion = void 0, this._audioFileTranscriptionEnabled = !1, this._runtimeMode = "sse", this._intelligence = void 0, this._threadEndpoints = void 0, this._singleRouteResourceOperations = !1, this._suggestions = void 0, this._inspectorLearning = !1, this._a2uiEnabled = !1, this._a2uiAgents = void 0, this._openGenerativeUIEnabled = !1, s || (this._licenseStatus = void 0, this._runtimeEntitlements = void 0), this.remoteAgents = {}, this._agents = this.localAgents, await this.notifyRuntimeStatusChanged(MS.Error), await this.notifyAgentsChanged();
			let c = n instanceof Error ? n.message : JSON.stringify(n);
			Dm.warn(`Failed to load runtime info (${t}/info): ${c}`);
			let l = n instanceof Error ? n : Error(String(n));
			await this.core.emitError({
				error: l,
				code: AS.RUNTIME_INFO_FETCH_FAILED,
				context: { runtimeUrl: t }
			});
		}
	}
	async fetchRuntimeInfo(e, t, n) {
		let r = this.core, i = r.credentials, a = r.resolveHeaders(), o = { ...Sb(a) ? await kb(a, n) : a };
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
		if (!s.ok) throw await Qy(s);
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
			headers: Fb(t),
			body: JSON.stringify({ method: "info" }),
			...n ? { credentials: n } : {},
			...r ? { signal: r } : {}
		});
		if (!i.ok) throw await Qy(i);
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
function Rb(e, t) {
	return e === void 0 || t !== void 0 && e.includes(t);
}
var zb = class {
	_context = {};
	constructor(e) {
		this.core = e;
	}
	get context() {
		return this._context;
	}
	addContext({ description: e, value: t, agentIds: n }) {
		let r = p();
		return this._context[r] = {
			description: e,
			value: t,
			...n ? { agentIds: n } : {}
		}, this.notifySubscribers(), r;
	}
	getContextForAgent(e) {
		return Object.values(this._context).filter((t) => Rb(t.agentIds, e)).map(({ description: e, value: t }) => ({
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
}, Bb = class {
	_suggestionsConfig = {};
	_suggestions = {};
	_runningSuggestions = {};
	constructor(e) {
		this.core = e;
	}
	initialize(e) {
		for (let t of e) this._suggestionsConfig[p()] = t;
	}
	addSuggestionsConfig(e) {
		let t = p();
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
			let a = p();
			if (Hb(i)) {
				if (!t) continue;
				r || (r = !0, this.notifySuggestionsStartedLoading(e)), this.generateSuggestions(a, i, e);
			} else Ub(i) && this.addStaticSuggestions(a, i, e);
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
				m = new em({
					agentId: o,
					url: e,
					...t ? { fetch: (e, n) => fetch(e, {
						...n,
						credentials: t
					}) } : {}
				}), p = m;
			} else p = s.clone(), p instanceof fb && (p.messageFilter = void 0);
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
				tools: [Wb]
			}, { onMessagesChanged: ({ messages: t }) => {
				this.extractSuggestions(t, e, n, !0);
			} });
		} catch (e) {
			!Vb(e) && !i && console.warn("Error generating suggestions:", e);
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
				let e = vm(Array.isArray(t.function.arguments) ? t.function.arguments.join("") : t.function.arguments);
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
		if (!n) return Hb(e) ? t > 0 : t === 0;
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
function Vb(e) {
	return typeof e == "object" && !!e && "name" in e && e.name === "AbortError";
}
function Hb(e) {
	return "instructions" in e;
}
function Ub(e) {
	return "suggestions" in e;
}
var Wb = {
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
}, Gb = "Forwarded to client";
function Kb(e) {
	if (typeof e == "string") return e.trim();
	if (Array.isArray(e)) {
		let t = e.flatMap((e) => typeof e == "string" ? [e] : e && typeof e == "object" && "text" in e && typeof e.text == "string" ? [e.text] : []).join("").trim();
		return t.length > 0 ? t : null;
	}
	return e && typeof e == "object" && "text" in e && typeof e.text == "string" ? e.text.trim() : null;
}
function qb(e) {
	return Kb(e) === Gb;
}
var Jb = /* @__PURE__ */ new Set([
	"image",
	"audio",
	"video",
	"document"
]);
function Yb(e) {
	return e === void 0 || typeof e == "string";
}
function Xb(e) {
	if (!e || typeof e != "object") return !1;
	let t = e;
	if (typeof t.value != "string") return !1;
	switch (t.type) {
		case "data": return typeof t.mimeType == "string";
		case "url": return Yb(t.mimeType);
		case "file": return Yb(t.provider) && Yb(t.mimeType);
		default: return !1;
	}
}
function Zb(e) {
	if (!e || typeof e != "object" || Array.isArray(e)) return !1;
	let t = e;
	return !Yb(t.id) || t.metadata === null ? !1 : t.type === "text" ? typeof t.text == "string" : typeof t.type == "string" && Jb.has(t.type) && Xb(t.source);
}
function Qb(e) {
	if (e == null) return {
		content: "",
		text: ""
	};
	if (typeof e == "string") return {
		content: e,
		text: e
	};
	let t = JSON.stringify(e);
	return Array.isArray(e) && e.length > 0 && e.every(Zb) ? {
		content: e,
		text: t
	} : {
		content: t,
		text: t
	};
}
var $b = {
	type: "object",
	properties: {}
};
function ex(e) {
	if (!e.parameters) return { ...$b };
	let t = Em(e.parameters, { zodToJsonSchema: (e, t) => H_(e, t) });
	if (!t || typeof t != "object") return { ...$b };
	let { $schema: n, ...r } = t;
	return typeof r.type != "string" && (r.type = "object"), (typeof r.properties != "object" || r.properties === null) && (r.properties = {}), tx(r), r;
}
function tx(e) {
	if (!e || typeof e != "object") return;
	if (Array.isArray(e)) {
		e.forEach(tx);
		return;
	}
	let t = e;
	t.additionalProperties !== void 0 && delete t.additionalProperties;
	for (let e of Object.values(t)) tx(e);
}
function nx() {
	return typeof document > "u" ? null : document.modelContext ?? null;
}
var rx = class {
	entries = /* @__PURE__ */ new Map();
	warnedNames = /* @__PURE__ */ new Set();
	get registeredNames() {
		return [...this.entries.keys()];
	}
	sync(e) {
		let t = nx();
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
			inputSchema: ex(e),
			execute: async (t, n) => {
				if (!e.handler) return "";
				let r = {
					id: p(),
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
		this.warnedNames.has(e) || (this.warnedNames.add(e), Dm.warn(`[CopilotKit] ${t}`));
	}
}, ix = /* @__PURE__ */ new WeakMap();
function ax(e) {
	return e.message || "Tool call failed";
}
function ox(e, t, n) {
	return !!(t && e?.aborted && !(ix.get(e)?.() && n));
}
var sx = 100, cx = 100, lx = "*", ux = class {
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
	_webmcpRegistry = new rx();
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
		this._hookTools.has(t) ? Dm.warn(`Tool already exists: '${e.name}' for agent '${e.agentId || "global"}', skipping.`) : (this._hookTools.set(t, e), this._cachedMergedTools = null, this.warnOnMissingToolParameters([e]), this.syncWebMCP());
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
					code: AS.AGENT_CONNECT_FAILED,
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
			if (!mb(r)) {
				let t = {};
				e.agentId && (t.agentId = e.agentId), n && (t.threadId = n), await this._internal.emitError({
					error: r,
					code: AS.AGENT_CONNECT_FAILED,
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
		let d = o ?? (i ? r : void 0), f = (i ? this._activeRequestIds.get(e) : void 0) ?? (d === void 0 ? void 0 : this._requestIdByRun.get(d)) ?? p();
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
		let m = this._activeRequestIds.get(e);
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
				code: AS.AGENT_RUN_FAILED,
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
			m === void 0 ? this._activeRequestIds.delete(e) : this._activeRequestIds.set(e, m);
		}
	}
	rememberRequestId(e, t) {
		if (this._requestIdByRun.delete(e), this._requestIdByRun.set(e, t), this._requestIdByRun.size > sx) {
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
				toolName: lx,
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
					ix.set(o.signal, () => this._connectionGenerations.get(t) === e && t.threadId === l), o.abort();
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
			if ((this._runDepths.get(t) ?? 0) >= cx) Dm.warn(`[CopilotKit] Follow-up depth limit (${cx}) reached for agent "${s}". Stopping recursive follow-up runs to prevent an infinite loop. This usually indicates a tool that keeps requesting a follow-up (e.g. the LLM repeatedly calling the same tool). Consider setting "followUp: false" on the offending tool.`);
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
		return e.role === "tool" && qb(e.content);
	}
	async executeToolHandler({ tool: e, toolCall: t, agent: n, agentId: r, handlerArgs: i, toolType: a, messageId: o, signal: s = this.latestRunSignal(n), discardOnAbort: c = !1, isReplay: l = !1 }) {
		let u = "", d = "", f, p = !1, m;
		try {
			m = fx(i, t.function.name);
		} catch (e) {
			let n = e instanceof Error ? e : Error(String(e));
			f = ax(n), p = !0, await this._internal.emitError({
				error: n,
				code: AS.TOOL_ARGUMENT_PARSE_FAILED,
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
			({content: u, text: d} = Qb(r));
		} catch (e) {
			let n = e instanceof Error ? e : Error(String(e));
			f = ax(n), ox(s, c, f) || await this._internal.emitError({
				error: n,
				code: AS.TOOL_HANDLER_FAILED,
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
			if (ox(a, o, l.error) || r.threadId !== c || i === -1 || s && !this.isInLatestUserTurn(r.messages, n.id) || r.messages.some((e) => e.role === "tool" && e.toolCallId === t.id && !this.isFrontendPlaceholderResult(e))) return !1;
			let u = this.toolResultInsertionIndex(r.messages, i, t.id), d = {
				id: p(),
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
				c = fx(t.function.arguments, t.function.name);
			} catch (e) {
				let r = e instanceof Error ? e : Error(String(e));
				d = ax(r), await this._internal.emitError({
					error: r,
					code: AS.TOOL_ARGUMENT_PARSE_FAILED,
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
				({content: l, text: u} = Qb(n));
			} catch (e) {
				let r = e instanceof Error ? e : Error(String(e));
				d = ax(r), ox(a, o, d) || await this._internal.emitError({
					error: r,
					code: AS.TOOL_HANDLER_FAILED,
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
			if (ox(a, o, d) || r.threadId !== c || i === -1 || s && !this.isInLatestUserTurn(r.messages, n.id) || r.messages.some((e) => e.role === "tool" && e.toolCallId === t.id && !this.isFrontendPlaceholderResult(e))) return !1;
			let u = this.toolResultInsertionIndex(r.messages, i, t.id), f = {
				id: p(),
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
				code: AS.TOOL_NOT_FOUND,
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
				code: AS.AGENT_NOT_FOUND,
				context: { agentId: o }
			}), e;
		}
		let c = p(), l = {
			id: c,
			type: "function",
			function: {
				name: t,
				arguments: JSON.stringify(r)
			}
		}, u = {
			id: p(),
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
			id: p(),
			role: "tool",
			toolCallId: c,
			content: d.content,
			...d.error ? { error: d.error } : {}
		}, m = s.messages.findIndex((e) => e.id === u.id);
		if (m === -1 ? s.messages.push(f) : s.messages.splice(m + 1, 0, f), !d.error && i !== !1) {
			if (typeof i == "string" && i !== "generate") {
				let e = {
					id: p(),
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
		return this.tools.filter((t) => t.name !== lx && t.available !== !1 && t.available !== "disabled" && (!t.agentId || t.agentId === e) && this.isToolEnabled(t.name, t.agentId)).map((e) => ({
			name: e.name,
			description: e.description ?? "",
			parameters: ex(e)
		}));
	}
	syncWebMCP() {
		let e = /* @__PURE__ */ new Map(), t = /* @__PURE__ */ new Set();
		for (let n of this.tools) n.webmcp && n.name !== lx && n.available !== !1 && n.available !== "disabled" && this.isToolEnabled(n.name, n.agentId) && (e.has(n.name) ? t.has(n.name) || (t.add(n.name), Dm.warn(`[CopilotKit] Multiple WebMCP tools share the name '${n.name}'. Only the first registration is exposed to browser agents.`)) : e.set(n.name, n));
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
				await n(e, e instanceof Yy ? AS.AGENT_THREAD_LOCKED : AS.AGENT_RUN_FAILED_EVENT, { source: "onRunFailed" });
			},
			onRunErrorEvent: async ({ event: r }) => {
				if ((t?.aborted ?? !1) || r?.code === "abort") return;
				if (r?.code === "THREAD_ALREADY_RUNNING") {
					await n(new Yy(e.threadId), AS.AGENT_THREAD_LOCKED, {
						source: "onRunErrorEvent",
						event: r
					});
					return;
				}
				let i = r?.rawEvent instanceof Error ? r.rawEvent : r?.rawEvent?.error instanceof Error ? r.rawEvent.error : void 0, a = typeof r?.rawEvent?.error == "string" ? r.rawEvent.error : r?.message ?? "Agent run error", o = i ?? Error(a);
				r?.code && !o.code && (o.code = r.code), await n(o, AS.AGENT_RUN_ERROR_EVENT, {
					source: "onRunErrorEvent",
					event: r,
					runtimeErrorCode: r?.code
				});
			}
		};
	}
};
function dx(e, t) {
	if (typeof e == "object" && e && !Array.isArray(e)) return e;
	throw Error(`Tool arguments for ${t} parsed to non-object (${typeof e})`);
}
function fx(e, t) {
	return e === "" || e == null ? (Dm.debug(`[parseToolArguments] Tool "${t}" received empty/null/undefined arguments — defaulting to {}`), {}) : dx(typeof e == "string" ? JSON.parse(e) : e, t);
}
var px = (e) => e.resume !== void 0 || Object.prototype.hasOwnProperty.call(e.forwardedProps?.command ?? {}, "resume"), mx = class {
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
		if (n.interruptIds === null) return t.resume === void 0 && px(t) ? n.runId : void 0;
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
				let n = r.reduce((t, n, r) => (n.role === "tool" && n.toolCallId === e.toolCallId && t.push(r), t), []), a = n.find((e) => !qb(r[e]?.content));
				if (a !== void 0) {
					for (let e of n.filter((e) => e !== a).sort((e, t) => t - e)) r.splice(e, 1), i = !0;
					continue;
				}
				let o = n.find((e) => qb(r[e]?.content));
				if (o !== void 0) {
					if (qb(e.content)) {
						for (let e of n.slice(1).sort((e, t) => t - e)) r.splice(e, 1), i = !0;
						continue;
					}
					r[o] = {
						...r[o],
						id: e.messageId,
						content: e.content
					}, i = !0;
					for (let e of n.filter((e) => e !== o && qb(r[e]?.content)).sort((e, t) => t - e)) r.splice(e, 1);
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
				this.interruptedRuns.get(e)?.delete(l.threadId), a = !1, i = c ? c.expectedRunId ?? t.runId ?? n.runId : d || (o && n.runId === i && !px(n) && (t.runId == null || t.runId === i) ? of() : t.runId || n.runId), o = !1, this.handleRunStarted(e, u(n), s);
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
		return r === void 0 ? void 0 : P(r);
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
}, hx = class {
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
}, gx = 1e4, _x = 2e3, vx = 50, yx = 65536, bx = 16384, xx = (e) => new TextEncoder().encode(JSON.stringify(e)).byteLength, Sx = ym(1e3, 1e4), Cx = {
	RUNTIME_REQUIRED: "Set runtimeUrl: capture connects through the CopilotKit runtime.",
	INTELLIGENCE_RUNTIME_REQUIRED: "Configure the CopilotRuntime with `intelligence` to accept capture.",
	CONNECTION_FAILED: "Check that the CopilotRuntime is configured with `intelligence` and valid Intelligence credentials, and check the runtime logs.",
	IDENTITY_REQUIRED: "The runtime could not identify the user. Configure `identifyUser` on the CopilotRuntime and send the app's session with runtime requests.",
	TRAJECTORIES_NOT_ENABLED: "Trajectories are not enabled for this Intelligence project.",
	TRAJECTORIES_UNAVAILABLE: "This Intelligence deployment does not serve Trajectory capture.",
	TRAJECTORIES_ENTITLEMENT_UNAVAILABLE: "Intelligence could not confirm that Trajectories are enabled for this project; try again later.",
	MARKETPLACE_LICENSE_REQUIRED: "Trajectory capture requires a CopilotKit license for this project."
};
function wx(e) {
	return typeof e == "object" && !!e;
}
function Tx(e) {
	return typeof e == "number" && Number.isSafeInteger(e) && e >= 0;
}
function Ex(e, t) {
	return wx(e) && Tx(e.accepted) && Tx(e.rejected) && e.accepted + e.rejected === t && (e.highestSeq === null || Tx(e.highestSeq)) && (e.accepted === 0 || e.highestSeq !== null);
}
function Dx(e) {
	return wx(e) && typeof e.joinToken == "string" && e.joinToken.length > 0 && wx(e.realtime) && typeof e.realtime.clientUrl == "string" && e.realtime.clientUrl.length > 0 && typeof e.realtime.topic == "string" && e.realtime.topic.length > 0;
}
var Ox = {
	trajectories_unavailable: "TRAJECTORIES_UNAVAILABLE",
	trajectories_not_enabled: "TRAJECTORIES_NOT_ENABLED",
	entitlement_unavailable: "TRAJECTORIES_ENTITLEMENT_UNAVAILABLE",
	marketplace_license_required: "MARKETPLACE_LICENSE_REQUIRED"
};
function kx(e) {
	let t = wx(e) ? e.reason : void 0;
	return (typeof t == "string" && Object.hasOwn(Ox, t) ? Ox[t] : void 0) ?? Ax(e, "JOIN_FAILED");
}
function Ax(e, t) {
	return wx(e) && typeof e.code == "string" && /^[A-Z][A-Z0-9_]{0,63}$/.test(e.code) ? e.code : t;
}
var jx = class {
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
		let r = Cx[t];
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
			}, Sx(++e.retries)))));
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
		e.connection = t, t.timer = setTimeout(() => this.fail(e, t, "CONNECTION_TIMEOUT"), gx);
		try {
			let n = this.core.runtimeUrl;
			if (!n) {
				this.fail(e, t, "RUNTIME_REQUIRED", !1);
				return;
			}
			let r = this.core.runtimeTransport;
			if (r === "auto" && (r = await this.detectedTransport(t.abort.signal), !this.current(e, t))) return;
			let i = r === "rest", a = this.core.resolveHeaders(), o = Sb(a) ? await kb(a, t.abort.signal) : a;
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
				this.fail(e, t, Ax(c, "CONNECTION_FAILED"), s.status >= 500 || s.status === 408 || s.status === 429);
				return;
			}
			if (!Dx(c)) {
				this.fail(e, t, "INVALID_GRANT", !1);
				return;
			}
			let l = new hh(c.realtime.clientUrl, {
				params: { join_token: c.joinToken },
				timeout: gx
			});
			t.socket = l;
			let u = () => this.fail(e, t, "CONNECTION_LOST");
			t.socketRefs.push(l.onError(u), l.onClose(u));
			let d = l.channel(c.realtime.topic, {});
			if (t.channel = d, t.channelRefs.push(["phx_error", d.onError(u)], ["phx_close", d.onClose(u)]), l.connect(), !this.current(e, t)) return;
			d.join(gx).receive("ok", () => {
				if (this.current(e, t)) try {
					if (clearTimeout(t.timer), e.ready = !0, e.retries = 0, e.collector = Dy({
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
			}).receive("error", (n) => this.fail(e, t, kx(n))).receive("timeout", () => this.fail(e, t, "CONNECTION_TIMEOUT"));
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
		}, _x));
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
		let r = n.value, i = wx(r) && !Array.isArray(r) && !Object.hasOwn(r, "seq") ? r : { data: r }, a = {
			...n,
			value: {
				...i,
				seq: this.nextSeq++
			}
		};
		if (xx(a) > bx) {
			this.addDropped(e, 1), this.report(e, "EVENT_TOO_LARGE");
			return;
		}
		let o = () => e.queue.length < vx && xx({
			events: [...e.queue, a],
			dropped: 2 ** 53 - 1
		}) <= yx;
		o() || this.flush(e, t), this.current(e, t) && e.ready && (o() ? (e.queue.push(a), e.queue.length === vx ? this.flush(e, t) : this.scheduleFlush(e, t)) : (this.addDropped(e, 1), this.report(e, "EVENTS_DROPPED")));
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
			timer: setTimeout(() => i.finish("PERSISTENCE_UNKNOWN"), gx),
			finish: (a, o = !1, s = !0) => {
				r || (r = !0, clearTimeout(i.timer), t.pending.delete(i), o && this.addDropped(e, n.events.length + n.dropped, !1), a && this.current(e, t) && this.report(e, a), s && this.current(e, t) && e.ready && (e.queue.length > 0 || !o && e.dropped > 0) && this.flush(e, t));
			}
		};
		t.pending.add(i);
		try {
			t.channel.push("events", n, gx).receive("ok", (e) => {
				i.finish(Ex(e, n.events.length) ? e.rejected > 0 ? "EVENTS_REJECTED" : void 0 : "PERSISTENCE_UNKNOWN");
			}).receive("error", (n) => {
				if (!this.current(e, t)) return;
				let r = wx(n) ? n.reason : void 0;
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
}, Mx = ["https://telemetry.copilotkit.ai/", "https://cdn.copilotkit.ai/"], Nx = class {
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
		this.core = e, this.config = t, this.connection = new jx(e, n), this.setConfig(t);
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
			this.collector = wy({
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
					...Mx,
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
}, Px = {
	boot: "@@micro-redux/boot",
	init: "@@micro-redux/init",
	stop: "@@micro-redux/stop"
}, Fx = { type: Px.boot };
function Ix(e, t) {
	let n = ((...n) => ({
		...t(...n),
		type: e
	}));
	return n.type = e, n.match = (t) => t.type === e, n;
}
function q() {
	return { kind: "props" };
}
function Lx() {
	return { kind: "empty" };
}
function Rx(e, t) {
	let n = {};
	for (let r of Object.keys(t)) {
		let i = t[r];
		if (!i) continue;
		let a = `[${e}] ${r}`;
		n[r] = i.kind === "props" ? Ix(a, (e) => ({ ...e })) : Ix(a, () => ({}));
	}
	return n;
}
function J(...e) {
	if (e.length < 2) throw Error("on requires at least one action creator and one reducer");
	let t = e[e.length - 1];
	return {
		creators: e.slice(0, -1),
		reducer: t
	};
}
function zx(e, ...t) {
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
function Bx(...e) {
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
function Vx(e) {
	return (t) => t.pipe(x(e), mi());
}
function Y(...e) {
	if (e.length === 0) throw Error("ofType requires at least one action creator");
	let t = new Set(e.map((e) => e.type));
	return (e) => e.pipe(ti((e) => t.has(e.type)));
}
function Hx(e, t = {}) {
	return t.dispatch === !1 ? {
		run: e,
		dispatch: !1
	} : {
		run: e,
		dispatch: !0
	};
}
function Ux(e) {
	let t = e.reducer, n = e.effects ?? [], r = !1, i = !1, a = new Lt(), o = t(void 0, Fx), s = new Cn(o), c = new xn(), l = (e) => {
		if (r) throw Error("Store is in a failed state due to an effect error");
		o = t(o, e), s.next(o), c.next(e);
	}, u = (e) => {
		r || (r = !0, i = !1, a.unsubscribe(), a = new Lt(), c.error(e), s.error(e));
	}, d = () => {
		for (let e of n) {
			let t = c.asObservable().pipe(mr(Bn)), n = s.asObservable();
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
			return s.asObservable().pipe(Vx(e));
		},
		init() {
			r || i || (i = !0, d(), r || l({ type: Px.init }));
		},
		stop() {
			!r && i && (l({ type: Px.stop }), a.unsubscribe(), a = new Lt(), i = !1);
		}
	};
}
var Wx = Object.freeze({
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
}), Gx = class e extends Error {
	code;
	category;
	retryable;
	constructor(t, n) {
		let r = Wx[t];
		super(n?.message ?? r.message, { cause: n?.cause }), this.name = "MemoryError", this.code = t, this.category = r.category, this.retryable = n?.retryable ?? r.retryable, Object.setPrototypeOf(this, e.prototype);
	}
};
function Kx(e) {
	return !(Number.isInteger(e) && e >= 400 && e <= 499);
}
var qx = "/memories", Jx = "/memories/subscribe", Yx = "/memories/recall", Xx = 15e3, Zx = 5, Qx = /* @__PURE__ */ new Set([
	404,
	422,
	501
]), $x = class extends Error {}, eS = Object.freeze({
	memories: Object.freeze([]),
	isLoading: !1,
	inFlightMutationCount: 0,
	error: null,
	context: null,
	sessionId: 0,
	available: !0,
	realtimeStatus: "connecting"
}), X = Rx("Memory Adapter", {
	started: Lx(),
	stopped: Lx(),
	contextChanged: q(),
	addRequested: q(),
	updateRequested: q(),
	removeRequested: q()
}), Z = Rx("Memory REST", {
	listRequested: q(),
	listSucceeded: q(),
	listFailed: q(),
	listUnavailable: q(),
	mutationFinished: q(),
	credentialsRequested: q(),
	credentialsSucceeded: q(),
	credentialsFailed: q(),
	credentialsUnavailable: q()
}), tS = Rx("Memory Domain", {
	memoryUpserted: q(),
	memoryInvalidated: q(),
	realtimeConnecting: q(),
	realtimeConnected: q(),
	realtimeUnavailable: q()
});
function nS(e) {
	return {
		id: e.id,
		kind: e.kind,
		scope: e.scope,
		content: e.content,
		sourceThreadIds: e.sourceThreadIds,
		invalidatedAt: e.invalidatedAt
	};
}
function rS(e, t) {
	return e.operation === "invalidated" ? tS.memoryInvalidated({
		sessionId: t,
		memoryId: e.invalidated.id
	}) : tS.memoryUpserted({
		sessionId: t,
		memory: nS(e.memory)
	});
}
function iS(e, t) {
	let n = e.findIndex((e) => e.id === t.id);
	if (n === -1) return [t, ...e];
	let r = [...e];
	return r[n] = t, r;
}
var aS = zx(eS, J(X.contextChanged, (e, { context: t }) => ({
	...e,
	context: t,
	sessionId: e.sessionId + 1,
	memories: [],
	isLoading: !!t,
	inFlightMutationCount: 0,
	error: null,
	available: !0,
	realtimeStatus: "connecting"
})), J(X.stopped, (e) => ({
	...e,
	memories: [],
	isLoading: !1,
	inFlightMutationCount: 0,
	error: null,
	available: !0,
	realtimeStatus: "connecting"
})), J(Z.listRequested, (e, { sessionId: t }) => t !== e.sessionId || !e.context ? e : {
	...e,
	isLoading: !0,
	error: null,
	available: !0
}), J(Z.listFailed, (e, { sessionId: t, error: n }) => t === e.sessionId ? {
	...e,
	isLoading: !1,
	error: n
} : e), J(Z.listUnavailable, (e, { sessionId: t }) => t === e.sessionId ? {
	...e,
	memories: [],
	isLoading: !1,
	error: null,
	available: !1
} : e), J(X.addRequested, X.updateRequested, X.removeRequested, (e) => ({
	...e,
	inFlightMutationCount: e.inFlightMutationCount + 1
})), J(Z.mutationFinished, (e, { outcome: t }) => t.sessionId === e.sessionId ? {
	...e,
	inFlightMutationCount: Math.max(0, e.inFlightMutationCount - 1),
	error: t.ok ? null : t.error
} : e), J(Z.listSucceeded, (e, { sessionId: t, memories: n }) => t === e.sessionId ? {
	...e,
	memories: n,
	isLoading: !1,
	error: null,
	available: !0
} : e), J(tS.memoryUpserted, (e, { sessionId: t, memory: n }) => t === e.sessionId ? {
	...e,
	memories: iS(e.memories, n)
} : e), J(tS.memoryInvalidated, (e, { sessionId: t, memoryId: n }) => t === e.sessionId ? {
	...e,
	memories: e.memories.filter((e) => e.id !== n)
} : e), J(tS.realtimeConnecting, (e, { sessionId: t }) => t === e.sessionId ? {
	...e,
	realtimeStatus: "connecting"
} : e), J(tS.realtimeConnected, (e, { sessionId: t }) => t === e.sessionId ? {
	...e,
	realtimeStatus: "connected"
} : e), J(tS.realtimeUnavailable, (e, { sessionId: t }) => t === e.sessionId ? {
	...e,
	realtimeStatus: "unavailable"
} : e)), oS = Bx((e) => e.memories), sS = Bx((e) => e.isLoading), cS = Bx((e) => e.error);
Bx((e) => e.inFlightMutationCount > 0);
var lS = Bx((e) => e.available), uS = Bx((e) => e.realtimeStatus), dS = "memory_metadata";
function fS(e, t) {
	let { selector: n, fetch: r, signal: i, ...a } = t;
	return new fn((t) => {
		let o = new AbortController(), s = () => o.abort();
		i?.aborted ? o.abort() : i?.addEventListener("abort", s);
		let c = Cr(r(e, {
			...a,
			signal: o.signal
		})).pipe(Jr((e) => Cr(n(e)))).subscribe(t);
		return () => {
			i?.removeEventListener("abort", s), o.abort(), c.unsubscribe();
		};
	});
}
function pS(e, t, n) {
	return S(() => {
		let r = t.includeInvalidated ? "?includeInvalidated=true" : "";
		return fS(`${t.runtimeUrl}${qx}${r}`, {
			selector: (e) => {
				if (!e.ok) throw Qx.has(e.status) ? new $x(String(e.status)) : new Gx("MEMORY_LIST_FAILED", {
					message: `Failed to fetch memories: ${e.status}`,
					retryable: Kx(e.status)
				});
				return e.json();
			},
			fetch: e.fetch,
			method: "GET",
			headers: { ...t.headers }
		}).pipe(Mr({
			first: Xx,
			with: () => {
				throw new Gx("MEMORY_REQUEST_TIMEOUT");
			}
		}), x((e) => Z.listSucceeded({
			sessionId: n,
			memories: e.memories
		})), ni((e) => e instanceof $x ? y(Z.listUnavailable({ sessionId: n })) : y(Z.listFailed({
			sessionId: n,
			error: e instanceof Error ? e : Error(String(e))
		}))));
	});
}
function mS(e, t, n) {
	return S(() => fS(`${t.runtimeUrl}${Jx}`, {
		selector: async (e) => {
			if (!e.ok) throw Qx.has(e.status) ? new $x(String(e.status)) : new Gx("MEMORY_CREDENTIALS_FAILED", {
				message: `Failed to fetch memory subscribe credentials: ${e.status}`,
				retryable: Kx(e.status)
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
	}).pipe(Mr({
		first: Xx,
		with: () => {
			throw new Gx("MEMORY_REQUEST_TIMEOUT");
		}
	}), x((e) => {
		let t = typeof e.joinToken == "string" && e.joinToken.length > 0 && typeof e.joinCode == "string" && e.joinCode.length > 0, r = typeof e.projectJoinToken == "string" && e.projectJoinToken.length > 0 && typeof e.projectJoinCode == "string" && e.projectJoinCode.length > 0;
		if (!t && !r) throw Error("missing memory realtime credentials");
		return Z.credentialsSucceeded({
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
	}), ni((e) => e instanceof $x ? y(Z.credentialsUnavailable({ sessionId: n })) : y(Z.credentialsFailed({
		sessionId: n,
		error: e instanceof Error ? e : Error(String(e))
	})))));
}
function hS(e) {
	return {
		id: e.id,
		kind: e.kind,
		scope: e.scope,
		content: e.content,
		sourceThreadIds: e.sourceThreadIds,
		invalidatedAt: e.invalidatedAt
	};
}
function gS(e) {
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
var _S = /* @__PURE__ */ new Set([
	"topical",
	"episodic",
	"operational"
]), vS = /* @__PURE__ */ new Set(["user", "project"]);
function yS(e) {
	return !e || typeof e != "object" ? /* @__PURE__ */ Error("memory mutation response missing/invalid body") : typeof e.id != "string" || e.id.length === 0 ? /* @__PURE__ */ Error("memory mutation response missing/invalid id") : typeof e.kind != "string" || !_S.has(e.kind) ? /* @__PURE__ */ Error("memory mutation response missing/invalid kind") : typeof e.scope != "string" || !vS.has(e.scope) ? /* @__PURE__ */ Error("memory mutation response missing/invalid scope") : typeof e.content == "string" ? !Array.isArray(e.sourceThreadIds) || !e.sourceThreadIds.every((e) => typeof e == "string") ? /* @__PURE__ */ Error("memory mutation response missing/invalid sourceThreadIds") : e.invalidatedAt !== null && typeof e.invalidatedAt != "string" ? /* @__PURE__ */ Error("memory mutation response missing/invalid invalidatedAt") : null : /* @__PURE__ */ Error("memory mutation response missing/invalid content");
}
function bS(e) {
	return {
		content: e.content,
		kind: e.kind,
		...e.scope === void 0 ? {} : { scope: e.scope },
		sourceThreadIds: e.sourceThreadIds ?? []
	};
}
function xS(e, t) {
	let { requestId: n, sessionId: r } = e;
	if (e.kind === "remove") return [tS.memoryInvalidated({
		sessionId: r,
		memoryId: e.id
	}), Z.mutationFinished({ outcome: {
		requestId: n,
		sessionId: r,
		ok: !0,
		memory: null
	} })];
	let i = yS(t);
	if (i) return [Z.mutationFinished({ outcome: {
		requestId: n,
		sessionId: r,
		ok: !1,
		error: i
	} })];
	let a = hS(t);
	if (e.kind === "update") {
		let e = t.retiredId;
		return typeof e != "string" || e.length === 0 ? [Z.mutationFinished({ outcome: {
			requestId: n,
			sessionId: r,
			ok: !1,
			error: /* @__PURE__ */ Error("supersede response missing retiredId")
		} })] : [
			tS.memoryInvalidated({
				sessionId: r,
				memoryId: e
			}),
			tS.memoryUpserted({
				sessionId: r,
				memory: a
			}),
			Z.mutationFinished({ outcome: {
				requestId: n,
				sessionId: r,
				ok: !0,
				memory: a
			} })
		];
	}
	return [tS.memoryUpserted({
		sessionId: r,
		memory: a
	}), Z.mutationFinished({ outcome: {
		requestId: n,
		sessionId: r,
		ok: !0,
		memory: a
	} })];
}
function SS(e, t, n) {
	let r = n.kind === "add" ? "POST" : n.kind === "update" ? "PATCH" : "DELETE", i = n.kind === "add" ? qx : `${qx}/${encodeURIComponent(n.id)}`;
	return S(() => fS(`${t.runtimeUrl}${i}`, {
		selector: async (e) => {
			if (!e.ok) throw new Gx("MEMORY_MUTATION_FAILED", {
				message: `Request failed: ${e.status}`,
				retryable: Kx(e.status)
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
	}).pipe(Mr({
		first: Xx,
		with: () => {
			throw new Gx("MEMORY_REQUEST_TIMEOUT");
		}
	}), Jr((e) => y(...xS(n, e))), ni((e) => y(Z.mutationFinished({ outcome: {
		requestId: n.requestId,
		sessionId: n.sessionId,
		ok: !1,
		error: e instanceof Error ? e : Error(String(e))
	} })))));
}
function CS(e) {
	let t = 0, n = () => (t += 1, `memory-request-${t}`), r = Hx((e, t) => e.pipe(Y(X.contextChanged), Ti(t), ti(([, e]) => !!e.context), x(([, e]) => Z.listRequested({ sessionId: e.sessionId })))), i = Hx((e, t) => e.pipe(Y(X.contextChanged), Ti(t), ti(([, e]) => !!e.context), x(([, e]) => Z.credentialsRequested({ sessionId: e.sessionId })))), a = Hx((t, n) => t.pipe(Y(Z.credentialsRequested), C((r) => n.pipe(x((e) => e.context), ti((e) => !!e), ci(1), x((e) => ({
		action: r,
		context: e
	})), Ci(t.pipe(Y(X.contextChanged, X.stopped))), C(({ action: t, context: n }) => mS(e, n, t.sessionId)))))), o = Ux({
		reducer: aS,
		effects: [
			r,
			i,
			Hx((t, n) => t.pipe(Y(Z.listRequested), C((r) => n.pipe(x((e) => e.context), ti((e) => !!e), ci(1), x((e) => ({
				action: r,
				context: e
			})), Ci(t.pipe(Y(X.contextChanged, X.stopped))), C(({ action: t, context: n }) => pS(e, n, t.sessionId)))))),
			a,
			Hx((t, n) => t.pipe(Y(X.addRequested, X.updateRequested, X.removeRequested), Ti(n), Jr(([t, n]) => {
				let r = n.context, i = n.sessionId;
				return r?.runtimeUrl ? X.addRequested.match(t) ? SS(e, r, {
					requestId: t.requestId,
					sessionId: i,
					kind: "add",
					body: bS(t.input)
				}) : X.updateRequested.match(t) ? SS(e, r, {
					requestId: t.requestId,
					sessionId: i,
					kind: "update",
					id: t.id,
					body: bS(t.changes)
				}) : SS(e, r, {
					requestId: t.requestId,
					sessionId: i,
					kind: "remove",
					id: t.id
				}) : y(Z.mutationFinished({ outcome: {
					requestId: t.requestId,
					sessionId: i,
					ok: !1,
					error: /* @__PURE__ */ Error("Runtime URL is not configured")
				} }));
			}))),
			Hx((e, t) => e.pipe(Y(Z.credentialsSucceeded), Ti(t), ti(([e, t]) => e.sessionId === t.sessionId && !!t.context?.wsUrl), C(([t, n]) => {
				let r = n.context, { joinToken: i, joinCode: a, projectJoinToken: o, projectJoinCode: s } = t, c = i ?? o, l = i && a ? `user_meta:memories:${a}` : `project_meta:memories:${s}`, u = t.sessionId, d = e.pipe(Y(X.contextChanged, X.stopped)), f = (e, t) => {
					let n = Ny({
						socket$: My({
							url: r.wsUrl,
							options: {
								params: { join_token: e },
								reconnectAfterMs: ym(100, 1e4),
								rejoinAfterMs: ym(1e3, 3e4)
							}
						}).pipe(xi({
							bufferSize: 1,
							refCount: !0
						})),
						topic: t
					}).pipe(xi({
						bufferSize: 1,
						refCount: !0
					}));
					return $r(n.pipe(C(({ channel: e }) => Py(e, dS)), x((e) => rS(e, u))), Iy(n).pipe(ni((e) => (console.warn(`[memory] failed to join ${t}`, e), Un))));
				};
				return S(() => {
					let e = My({
						url: r.wsUrl,
						options: {
							params: { join_token: c },
							reconnectAfterMs: ym(100, 1e4),
							rejoinAfterMs: ym(1e3, 3e4)
						}
					}).pipe(xi({
						bufferSize: 1,
						refCount: !0
					})), n = Ny({
						socket$: e,
						topic: l
					}).pipe(xi({
						bufferSize: 1,
						refCount: !0
					})), p = Ry(Ly(e).pipe(yi()), Zx).pipe(ni(() => (console.warn(`[memory] WebSocket failed after ${Zx} attempts, giving up`), y(void 0))), yi()), m = p.pipe(x(() => tS.realtimeUnavailable({ sessionId: u }))), h = n.pipe(C(({ channel: e }) => Py(e, dS)), x((e) => rS(e, t.sessionId))), g = Iy(n).pipe(oi(y(tS.realtimeConnected({ sessionId: u }))), ni((e) => (console.warn(`[memory] failed to join ${l}`, e), y(tS.realtimeUnavailable({ sessionId: u }))))), ee = i && a && o && s ? f(o, `project_meta:memories:${s}`) : Un;
					return $r(y(tS.realtimeConnecting({ sessionId: u })), h, g, ee, m).pipe(Ci($r(d, p.pipe(mr(Bn)))), _i(() => {}));
				});
			})))
		]
	});
	function s(e, t) {
		let { requestId: n } = e, r = kr($r(o.actions$.pipe(Y(Z.mutationFinished), ti((e) => e.outcome.requestId === n), x((e) => e.outcome)), o.actions$.pipe(Y(X.stopped), x(() => ({
			requestId: n,
			sessionId: o.getState().sessionId,
			ok: !1,
			error: /* @__PURE__ */ Error("Memory store stopped before mutation completed")
		})))).pipe(ci(1))).then((e) => {
			if (!e.ok) throw e.error;
			return t(e);
		});
		return o.dispatch(e), r;
	}
	return {
		start() {
			o.init(), o.dispatch(X.started());
		},
		stop() {
			o.dispatch(X.stopped()), o.stop();
		},
		setContext(e) {
			o.dispatch(X.contextChanged({ context: e }));
		},
		refresh() {
			let { sessionId: e, context: t } = o.getState();
			if (!t) return Promise.resolve();
			let n = kr($r(o.actions$.pipe(Y(Z.listSucceeded, Z.listFailed, Z.listUnavailable), ti((t) => t.sessionId === e)), o.actions$.pipe(Y(X.stopped)), o.actions$.pipe(Y(X.contextChanged))).pipe(ci(1))).then((e) => {
				if (Z.listFailed.match(e)) throw e.error;
				if (X.stopped.match(e)) throw Error("Memory store stopped before refresh completed");
				X.contextChanged.match(e);
			});
			return o.dispatch(Z.listRequested({ sessionId: e })), n;
		},
		recall(t, n) {
			let { context: r } = o.getState();
			if (!r?.runtimeUrl) return Promise.reject(/* @__PURE__ */ Error("Runtime URL is not configured"));
			let i = { query: t };
			return n?.limit !== void 0 && (i.limit = n.limit), n?.scope !== void 0 && (i.scope = n.scope), kr(fS(`${r.runtimeUrl}${Yx}`, {
				selector: async (e) => {
					if (!e.ok) throw new Gx("MEMORY_RECALL_FAILED", {
						message: `Failed to recall memories: ${e.status}`,
						retryable: Kx(e.status)
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
			}).pipe(Mr({
				first: Xx,
				with: () => {
					throw new Gx("MEMORY_REQUEST_TIMEOUT");
				}
			}), x((e) => (e.memories ?? []).map((e) => gS(e)))));
		},
		addMemory(e) {
			return s(X.addRequested({
				requestId: n(),
				input: e
			}), (e) => {
				if (e.memory == null) throw Error("add resolved without a memory");
				return e.memory;
			});
		},
		updateMemory(e, t) {
			return s(X.updateRequested({
				requestId: n(),
				id: e,
				changes: t
			}), (e) => {
				if (e.memory == null) throw Error("update resolved without a memory");
				return e.memory;
			});
		},
		removeMemory(e) {
			return s(X.removeRequested({
				requestId: n(),
				id: e
			}), () => void 0);
		},
		getState() {
			return o.getState();
		},
		getServerState() {
			return eS;
		},
		select: o.select.bind(o)
	};
}
var wS = oS, TS = sS, ES = cS, DS = lS, OS = uS;
function kS(e) {
	return typeof e == "object" && !!e && !Array.isArray(e) && Object.getPrototypeOf(e) === Object.prototype;
}
var AS = /* @__PURE__ */ function(e) {
	return e.RUNTIME_INFO_FETCH_FAILED = "runtime_info_fetch_failed", e.AGENT_CONNECT_FAILED = "agent_connect_failed", e.AGENT_RUN_FAILED = "agent_run_failed", e.AGENT_RUN_FAILED_EVENT = "agent_run_failed_event", e.AGENT_RUN_ERROR_EVENT = "agent_run_error_event", e.TOOL_ARGUMENT_PARSE_FAILED = "tool_argument_parse_failed", e.TOOL_HANDLER_FAILED = "tool_handler_failed", e.TOOL_NOT_FOUND = "tool_not_found", e.AGENT_NOT_FOUND = "agent_not_found", e.AGENT_THREAD_LOCKED = "agent_thread_locked", e.TRANSCRIPTION_FAILED = "transcription_failed", e.TRANSCRIPTION_SERVICE_NOT_CONFIGURED = "transcription_service_not_configured", e.TRANSCRIPTION_INVALID_AUDIO = "transcription_invalid_audio", e.TRANSCRIPTION_RATE_LIMITED = "transcription_rate_limited", e.TRANSCRIPTION_AUTH_FAILED = "transcription_auth_failed", e.TRANSCRIPTION_NETWORK_ERROR = "transcription_network_error", e.SUBSCRIBER_CALLBACK_FAILED = "subscriber_callback_failed", e.HEADER_RESOLUTION_FAILED = "header_resolution_failed", e;
}({}), jS = /* @__PURE__ */ new Set([
	"onMessagesChanged",
	"onStateChanged",
	"onRunInitialized",
	"onRunStartedEvent",
	"onRunFinalized",
	"onRunFailed",
	"onRunErrorEvent"
]), MS = /* @__PURE__ */ function(e) {
	return e.Disconnected = "disconnected", e.Connected = "connected", e.Connecting = "connecting", e.Error = "error", e;
}({}), NS = class {
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
		this.headerSource = new Eb((e) => {
			this.emitError({
				error: e,
				code: AS.HEADER_RESOLUTION_FAILED,
				context: { source: "headers" }
			});
		}), this.headerSource.setSource(r), this._credentials = i, this._messageFilter = a, this._properties = o, this._debug = u, this.agentRegistry = new Lb(this), this.contextStore = new zb(this), this.suggestionEngine = new Bb(this), this.runHandler = new ux(this), this.stateManager = new mx(this), this.threadStoreRegistry = new hx(this), this.agentRegistry.initialize(s), this.runHandler.initialize(c), this.suggestionEngine.initialize(l), this.stateManager.initialize(), this.learningBridge = new Nx(this, d, () => this.notifyTrajectoryChanged()), this.agentRegistry.setRuntimeTransport(t), this.agentRegistry.setRuntimeUrl(e, { deferConnection: n }), this.previousAgentIds = new Set(Object.keys(s)), this.subscribe({
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
		t !== AS.HEADER_RESOLUTION_FAILED && xb(e) || await this.notifySubscribers((r) => r.onError?.({
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
			code: AS.SUBSCRIBER_CALLBACK_FAILED,
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
		let n = p();
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
			if (!Rb(r.agentIds, e)) continue;
			let n = Object.entries(r.properties);
			for (let [e, r] of n) {
				let n = t[e];
				t[e] = kS(n) && kS(r) ? {
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
		return this._memoryStore || (this._memoryStore = CS({ fetch: this.ɵruntimeFetch }), this._memoryStore.start(), this.syncMemoryContext()), this._memoryStore;
	}
	syncMemoryContext() {
		this._memoryStore && (this.runtimeConnectionStatus === MS.Connected && this.intelligence?.wsUrl && this.runtimeUrl ? this._memoryStore.setContext({
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
				code: AS.SUBSCRIBER_CALLBACK_FAILED,
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
					code: AS.SUBSCRIBER_CALLBACK_FAILED,
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
		for (let n of Object.keys(t)) if (typeof t[n] == "function" && !jS.has(n)) {
			let t = `CopilotKitCore.subscribeToAgentWithOptions[${a}]: callback "${n}" is not supported and was dropped. Supported callbacks: ${Array.from(jS).join(", ")}. Use agent.subscribe() directly for event handlers and per-item notifications.`;
			this.logAndEmitError(t, {
				error: Error(t),
				code: AS.SUBSCRIBER_CALLBACK_FAILED,
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
		let c = !0, l = null, u = null, d = new je(() => {
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
}, PS = /* @__PURE__ */ function(e) {
	return e.InProgress = "inProgress", e.Executing = "executing", e.Complete = "complete", e;
}({}), FS = "thread_metadata", IS = "thread_run_activity", LS = "/threads/subscribe", RS = 5, zS = 15e3, BS = {
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
}, Q = Rx("Thread Adapter", {
	started: Lx(),
	stopped: Lx(),
	contextChanged: q(),
	fetchNextPageRequested: Lx(),
	renameRequested: q(),
	archiveRequested: q(),
	unarchiveRequested: q(),
	deleteRequested: q(),
	newThreadStarted: Lx()
}), $ = Rx("Thread REST", {
	listRequested: q(),
	listSucceeded: q(),
	listFailed: q(),
	nextPageSucceeded: q(),
	nextPageFailed: q(),
	metadataCredentialsRequested: q(),
	metadataCredentialsSucceeded: q(),
	metadataCredentialsFailed: q(),
	mutationFinished: q()
}), VS = Rx("Thread Socket", {
	opened: q(),
	errored: q(),
	joinFailed: q(),
	joinTimedOut: q(),
	metadataReceived: q(),
	runActivityReceived: q()
}), HS = Rx("Thread Domain", {
	threadUpserted: q(),
	threadDeleted: q()
});
function US(e) {
	return [...e].sort((e, t) => {
		let n = e.lastRunAt ?? e.updatedAt ?? e.createdAt;
		return (t.lastRunAt ?? t.updatedAt ?? t.createdAt).localeCompare(n);
	});
}
function WS(e, t) {
	let n = e.findIndex((e) => e.id === t.id);
	if (n === -1) return US([...e, t]);
	let r = [...e];
	return r[n] = t, US(r);
}
function GS(e) {
	return typeof e == "string" && e.length > 0 ? e : void 0;
}
function KS(e, t) {
	if (!t || e.operation === "deleted") return !0;
	let n = GS(e.thread.agentId);
	return !n || n === t;
}
function qS(e) {
	let t = GS(e.threadId ?? e.thread_id), n = GS(e.eventType ?? e.event_type);
	return !t || !n ? null : {
		type: "thread_run_activity",
		threadId: t,
		agentId: GS(e.agentId ?? e.agent_id),
		runId: GS(e.runId ?? e.run_id),
		eventType: n,
		latestEventId: GS(e.latestEventId ?? e.latest_event_id)
	};
}
var JS = zx(BS, J(Q.contextChanged, (e, { context: t }) => ({
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
})), J(Q.stopped, (e) => ({
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
})), J($.listRequested, (e, { sessionId: t }) => t !== e.sessionId || !e.context ? e : {
	...e,
	isLoading: !0,
	error: null,
	fetchMoreError: null
}), J($.listSucceeded, (e, { sessionId: t, threads: n, joinCode: r, nextCursor: i }) => {
	if (t !== e.sessionId) return e;
	let a = r !== e.metadataJoinCode;
	return {
		...e,
		threads: US(n),
		isLoading: !1,
		error: null,
		fetchMoreError: null,
		metadataJoinCode: r,
		metadataCredentialsRequested: !a && e.metadataCredentialsRequested,
		nextCursor: i
	};
}), J($.listFailed, (e, { sessionId: t, error: n }) => t === e.sessionId ? {
	...e,
	isLoading: !1,
	error: n
} : e), J($.nextPageSucceeded, (e, { sessionId: t, threads: n, nextCursor: r }) => {
	if (t !== e.sessionId) return e;
	let i = e.threads;
	for (let e of n) i = WS(i, e);
	return {
		...e,
		threads: i,
		isFetchingNextPage: !1,
		fetchMoreError: null,
		nextCursor: r
	};
}), J($.nextPageFailed, (e, { sessionId: t, error: n }) => t === e.sessionId ? {
	...e,
	isFetchingNextPage: !1,
	fetchMoreError: n
} : e), J($.metadataCredentialsFailed, (e, { sessionId: t }) => t === e.sessionId ? {
	...e,
	metadataCredentialsRequested: !1
} : e), J($.metadataCredentialsRequested, (e, { sessionId: t }) => t === e.sessionId ? {
	...e,
	metadataCredentialsRequested: !0
} : e), J(Q.fetchNextPageRequested, (e) => !e.nextCursor || e.isFetchingNextPage ? e : {
	...e,
	isFetchingNextPage: !0,
	fetchMoreError: null
}), J(Q.renameRequested, (e, { threadId: t, name: n }) => {
	let r = e.threads.find((e) => e.id === t), i = e.inFlightMutationCount + 1;
	return r ? {
		...e,
		threads: WS(e.threads, {
			...r,
			name: n
		}),
		inFlightMutationCount: i
	} : {
		...e,
		inFlightMutationCount: i
	};
}), J(Q.archiveRequested, (e, { threadId: t }) => {
	let n = e.threads.find((e) => e.id === t), r = e.inFlightMutationCount + 1;
	return n ? e.context?.includeArchived ? {
		...e,
		threads: WS(e.threads, {
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
}), J(Q.unarchiveRequested, (e, { threadId: t }) => {
	let n = e.threads.find((e) => e.id === t), r = e.inFlightMutationCount + 1;
	return n ? {
		...e,
		threads: WS(e.threads, {
			...n,
			archived: !1
		}),
		inFlightMutationCount: r
	} : {
		...e,
		inFlightMutationCount: r
	};
}), J(Q.deleteRequested, (e, { requestId: t, threadId: n }) => {
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
}), J(Q.newThreadStarted, (e) => ({
	...e,
	error: null
})), J($.mutationFinished, (e, { outcome: t }) => {
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
		threads: WS(e.threads, r),
		pendingDeletes: a,
		inFlightMutationCount: n,
		error: t.error
	};
}), J(HS.threadUpserted, (e, { sessionId: t, thread: n }) => t === e.sessionId ? {
	...e,
	threads: WS(e.threads, n)
} : e), J(HS.threadDeleted, (e, { sessionId: t, threadId: n }) => t === e.sessionId ? {
	...e,
	threads: e.threads.filter((e) => e.id !== n)
} : e));
function YS() {
	return {
		threads: Bx((e) => e.threads),
		isLoading: Bx((e) => e.isLoading),
		error: Bx((e) => e.error),
		fetchMoreError: Bx((e) => e.fetchMoreError),
		hasNextPage: Bx((e) => e.nextCursor != null),
		isFetchingNextPage: Bx((e) => e.isFetchingNextPage),
		isMutating: Bx((e) => e.inFlightMutationCount > 0)
	};
}
var XS = YS(), ZS = XS.threads, QS = XS.isLoading, $S = XS.error, eC = XS.fetchMoreError, tC = XS.hasNextPage, nC = XS.isFetchingNextPage, rC = XS.isMutating, iC = 0;
function aC() {
	return iC += 1, `thread-request-${iC}`;
}
function oC(e, t) {
	return new fn((n) => {
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
function sC(e, t, n) {
	return S(() => {
		let r = { agentId: t.agentId };
		t.includeArchived && (r.includeArchived = "true"), t.limit != null && (r.limit = String(t.limit));
		let i = new URLSearchParams(r);
		return oC(`${t.runtimeUrl}/threads?${i.toString()}`, {
			selector: (e) => {
				if (!e.ok) throw Error(`Failed to fetch threads: ${e.status}`);
				return e.json();
			},
			fetch: e.fetch,
			timeoutMs: zS,
			method: "GET",
			headers: { ...t.headers }
		}).pipe(x((e) => $.listSucceeded({
			sessionId: n,
			threads: e.threads,
			joinCode: typeof e.joinCode == "string" && e.joinCode.length > 0 ? e.joinCode : null,
			nextCursor: e.nextCursor ?? null
		})), ni((e) => y($.listFailed({
			sessionId: n,
			error: e instanceof Error ? e : Error(String(e))
		}))));
	});
}
function cC(e, t, n) {
	return S(() => oC(`${t.runtimeUrl}${LS}`, {
		selector: async (e) => {
			if (!e.ok) throw Error(`Failed to fetch thread metadata credentials: ${e.status}`);
			return e.json();
		},
		fetch: e.fetch,
		timeoutMs: zS,
		nonCritical: !0,
		method: "POST",
		headers: {
			...t.headers,
			"Content-Type": "application/json"
		},
		body: JSON.stringify({})
	}).pipe(x((e) => {
		if (typeof e.joinToken != "string" || e.joinToken.length === 0) throw Error("missing joinToken");
		return $.metadataCredentialsSucceeded({
			sessionId: n,
			joinToken: e.joinToken
		});
	}), ni((e) => y($.metadataCredentialsFailed({
		sessionId: n,
		error: e instanceof Error ? e : Error(String(e))
	})))));
}
function lC(e, t, n) {
	return S(() => oC(`${t.runtimeUrl}${n.path}`, {
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
	}).pipe(x(() => $.mutationFinished({ outcome: {
		requestId: n.requestId,
		sessionId: n.sessionId,
		ok: !0
	} })), ni((e) => y($.mutationFinished({ outcome: {
		requestId: n.requestId,
		sessionId: n.sessionId,
		ok: !1,
		error: e instanceof Error ? e : Error(String(e))
	} })))));
}
function uC(e) {
	let t = YS(), n = Ux({
		reducer: JS,
		effects: [
			Hx((e, t) => e.pipe(Y(Q.contextChanged), Ti(t), ti(([, e]) => !!e.context), x(([, e]) => $.listRequested({ sessionId: e.sessionId })))),
			Hx((t, n) => t.pipe(Y($.listRequested), C((r) => n.pipe(x((e) => e.context), ti((e) => !!e), ci(1), x((e) => ({
				action: r,
				context: e
			})), Ci(t.pipe(Y(Q.contextChanged, Q.stopped))), C(({ action: t, context: n }) => sC(e, n, t.sessionId)))))),
			Hx((e, t) => e.pipe(Y($.listSucceeded), Ti(t), ti(([e, t]) => e.sessionId === t.sessionId && !t.metadataCredentialsRequested && !!t.context?.wsUrl && !!t.metadataJoinCode), x(([e]) => $.metadataCredentialsRequested({ sessionId: e.sessionId })))),
			Hx((t, n) => t.pipe(Y($.metadataCredentialsRequested), C((r) => n.pipe(x((e) => e.context), ti((e) => !!e), ci(1), x((e) => ({
				action: r,
				context: e
			})), Ci(t.pipe(Y(Q.contextChanged, Q.stopped))), C(({ action: t, context: n }) => cC(e, n, t.sessionId)))))),
			Hx((e, t) => e.pipe(Y($.metadataCredentialsSucceeded), Ti(t), ti(([e, t]) => e.sessionId === t.sessionId && !!t.context?.wsUrl), C(([t, n]) => {
				let r = n.context, i = t.joinToken, a = n.metadataJoinCode, o = e.pipe(Y(Q.contextChanged, Q.stopped));
				return S(() => {
					let e = My({
						url: r.wsUrl,
						options: {
							params: { join_token: i },
							reconnectAfterMs: ym(100, 1e4),
							rejoinAfterMs: ym(1e3, 3e4)
						}
					}).pipe(xi({
						bufferSize: 1,
						refCount: !0
					})), n = Ny({
						socket$: e,
						topic: `user_meta:${a}`
					}).pipe(xi({
						bufferSize: 1,
						refCount: !0
					})), s = Ly(e).pipe(yi()), c = Ry(s, RS).pipe(ni(() => (console.warn(`[threads] WebSocket failed after ${RS} attempts, giving up`), y(void 0))), yi());
					return $r(s.pipe(x((e) => e.type === "open" ? VS.opened({ sessionId: t.sessionId }) : VS.errored({ sessionId: t.sessionId }))), n.pipe(C(({ channel: e }) => Py(e, FS)), x((e) => VS.metadataReceived({
						sessionId: t.sessionId,
						payload: e
					}))), n.pipe(C(({ channel: e }) => Py(e, IS)), x((e) => qS(e)), ti((e) => e !== null), x((e) => VS.runActivityReceived({
						sessionId: t.sessionId,
						notification: e
					}))), Fy(n).pipe(ti((e) => e.type !== "joined"), x((e) => e.type === "timeout" ? VS.joinTimedOut({ sessionId: t.sessionId }) : VS.joinFailed({ sessionId: t.sessionId })))).pipe(Ci($r(o, c)));
				});
			}))),
			Hx((e, t) => e.pipe(Y(VS.metadataReceived), Ti(t), ti(([e, t]) => e.sessionId === t.sessionId && KS(e.payload, t.context?.agentId)), x(([e, t]) => e.payload.operation === "deleted" ? HS.threadDeleted({
				sessionId: e.sessionId,
				threadId: e.payload.deleted.id
			}) : e.payload.operation === "archived" && !t.context?.includeArchived ? HS.threadDeleted({
				sessionId: e.sessionId,
				threadId: e.payload.threadId
			}) : HS.threadUpserted({
				sessionId: e.sessionId,
				thread: e.payload.thread
			})))),
			Hx((e, t) => e.pipe(Y(VS.joinFailed, VS.joinTimedOut, VS.errored, $.metadataCredentialsFailed), Ti(t), ti(([e, t]) => e.sessionId === t.sessionId), wi(([e]) => {
				let t = VS.joinTimedOut.match(e) ? "channel join timed out" : VS.joinFailed.match(e) ? "channel join was rejected" : $.metadataCredentialsFailed.match(e) ? "metadata credentials fetch failed" : "socket errored";
				console.warn(`[threads] realtime ${t}; the thread list may be stale until reconnect`);
			})), { dispatch: !1 }),
			Hx((t, n) => t.pipe(Y(Q.fetchNextPageRequested), Ti(n), ti(([, e]) => !!e.context && !!e.nextCursor), C(([, n]) => {
				let r = n.context, i = {
					agentId: r.agentId,
					cursor: n.nextCursor
				};
				return r.includeArchived && (i.includeArchived = "true"), r.limit != null && (i.limit = String(r.limit)), oC(`${r.runtimeUrl}/threads?${new URLSearchParams(i).toString()}`, {
					selector: (e) => {
						if (!e.ok) throw Error(`Failed to fetch next page: ${e.status}`);
						return e.json();
					},
					fetch: e.fetch,
					timeoutMs: zS,
					method: "GET",
					headers: { ...r.headers }
				}).pipe(x((e) => $.nextPageSucceeded({
					sessionId: n.sessionId,
					threads: e.threads,
					nextCursor: e.nextCursor ?? null
				})), ni((e) => y($.nextPageFailed({
					sessionId: n.sessionId,
					error: e instanceof Error ? e : Error(String(e))
				}))), Ci(t.pipe(Y(Q.contextChanged, Q.stopped))));
			}))),
			Hx((t, n) => t.pipe(Y(Q.renameRequested, Q.archiveRequested, Q.unarchiveRequested, Q.deleteRequested), Ti(n), Jr(([t, n]) => {
				let r = n.sessionId, i = n.context;
				if (!i?.runtimeUrl) {
					let e = t.requestId;
					return y($.mutationFinished({ outcome: {
						requestId: e,
						sessionId: r,
						ok: !1,
						error: /* @__PURE__ */ Error("Runtime URL is not configured")
					} }));
				}
				let a = { agentId: i.agentId };
				return Q.renameRequested.match(t) ? lC(e, i, {
					requestId: t.requestId,
					sessionId: r,
					method: "PATCH",
					path: `/threads/${encodeURIComponent(t.threadId)}`,
					body: {
						...a,
						name: t.name
					}
				}) : Q.archiveRequested.match(t) ? lC(e, i, {
					requestId: t.requestId,
					sessionId: r,
					method: "POST",
					path: `/threads/${encodeURIComponent(t.threadId)}/archive`,
					body: a
				}) : Q.unarchiveRequested.match(t) ? lC(e, i, {
					requestId: t.requestId,
					sessionId: r,
					method: "PATCH",
					path: `/threads/${encodeURIComponent(t.threadId)}`,
					body: {
						...a,
						archived: !1
					}
				}) : lC(e, i, {
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
		let t = kr($r(n.actions$.pipe(Y($.mutationFinished), ti((t) => t.outcome.requestId === e.requestId), x((e) => e.outcome)), n.actions$.pipe(Y(Q.stopped), x(() => ({
			requestId: e.requestId,
			sessionId: n.getState().sessionId,
			ok: !1,
			error: /* @__PURE__ */ Error("Thread store stopped before mutation completed")
		})))).pipe(ci(1))).then((e) => {
			if (!e.ok) throw e.error;
		});
		return n.dispatch(e), t;
	}
	let i = null, a = () => {
		e.onError && !i && (i = n.actions$.pipe(Y($.mutationFinished), ti((e) => !e.outcome.ok && e.outcome.sessionId === n.getState().sessionId)).subscribe((t) => {
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
				requestId: aC(),
				threadId: e,
				name: t
			}));
		},
		archiveThread(e) {
			return r(Q.archiveRequested({
				requestId: aC(),
				threadId: e
			}));
		},
		unarchiveThread(e) {
			return r(Q.unarchiveRequested({
				requestId: aC(),
				threadId: e
			}));
		},
		deleteThread(e) {
			return r(Q.deleteRequested({
				requestId: aC(),
				threadId: e
			}));
		},
		subscribeToRunActivity(e) {
			return n.actions$.pipe(Y(VS.runActivityReceived), ti((e) => e.sessionId === n.getState().sessionId), x((e) => e.notification)).subscribe(e);
		},
		getState() {
			return n.getState();
		},
		getServerState() {
			return BS;
		},
		select: n.select.bind(n),
		selectors: t
	};
}
var dC = ZS, fC = QS, pC = $S, mC = eC, hC = tC, gC = nC, _C = rC, vC = Object.freeze([
	"chat",
	"sidebar",
	"popup",
	"threads"
]);
new Set(vC);
var yC = "copilotkit:cpk-inspector-thread";
function bC(e) {
	return `${yC}:${e}`;
}
function xC() {
	if (typeof window < "u" && typeof window.addEventListener == "function") return window;
	if (typeof EventTarget > "u") return null;
	let e = globalThis;
	return e.__COPILOTKIT_INSPECTOR_THREAD_EVENT_TARGET__ ??= new EventTarget(), e.__COPILOTKIT_INSPECTOR_THREAD_EVENT_TARGET__;
}
function SC(e, t) {
	if (typeof CustomEvent < "u") return new CustomEvent(e, { detail: t });
	let n = new Event(e);
	return Object.defineProperty(n, "detail", { value: t }), n;
}
function CC(e) {
	return e.detail;
}
function wC() {
	return !1;
}
function TC() {
	return typeof crypto < "u" && "randomUUID" in crypto ? crypto.randomUUID() : `inspector-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
function EC(e, t) {
	if (!wC()) return;
	let n = xC();
	n && n.dispatchEvent(SC(bC(e), t));
}
function DC(e, t) {
	if (!wC()) return () => void 0;
	let n = xC();
	if (!n) return () => void 0;
	let r = (e) => {
		t(CC(e));
	}, i = bC(e);
	return n.addEventListener(i, r), () => n.removeEventListener(i, r);
}
function OC(e) {
	if (!wC()) return !1;
	let t = xC();
	if (!t) return !1;
	let n = {
		payload: e,
		claimed: !1
	};
	return t.dispatchEvent(SC(bC("view-thread"), n)), n.claimed;
}
function kC(e) {
	EC("stop-viewing", e);
}
function AC(e) {
	EC("active-thread", e);
}
function jC(e) {
	EC("view-thread-result", e);
}
function MC(e) {
	if (!wC()) return () => void 0;
	let t = xC();
	if (!t) return () => void 0;
	let n = (t) => {
		let n = CC(t);
		n.claimed ||= e(n.payload);
	}, r = bC("view-thread");
	return t.addEventListener(r, n), () => t.removeEventListener(r, n);
}
function NC(e) {
	return DC("stop-viewing", e);
}
function PC(e) {
	return DC("active-thread", e);
}
function FC(e) {
	return DC("view-thread-result", e);
}
var IC = "a2ui", LC = /^(`{3,}|~{3,})(.*)$/, RC = /^target=(.+)$/;
function zC(e, t) {
	let n = e.trim();
	if (n.length < t.length) return !1;
	for (let e of n) if (e !== t.char) return !1;
	return !0;
}
function BC(e) {
	for (let t of e) {
		let e = RC.exec(t);
		if (e) return e[1];
	}
}
function VC(e, t, n) {
	let r = {
		type: "a2ui",
		index: e.index,
		text: t,
		closed: n
	};
	return e.target !== void 0 && (r.target = e.target), r;
}
function HC(e) {
	let t = [], n = 0, r = null, i = 0, a = (r) => {
		r > n && t.push({
			type: "markdown",
			text: e.slice(n, r)
		});
	}, o = 0;
	for (; o <= e.length;) {
		let s = e.indexOf("\n", o), c = s < 0 ? e.length : s, l = c > o && e[c - 1] === "\r", u = e.slice(o, l ? c - 1 : c);
		if (r) {
			if (zC(u, r)) {
				if (r.index >= 0) {
					let i = e.slice(r.bodyStart, Math.max(r.bodyStart, o));
					t.push(VC(r, i, !0)), n = l ? c - 1 : c;
				}
				r = null;
			}
		} else {
			let t = LC.exec(u);
			if (t) {
				let n = t[1] ?? "", l = t[2] ?? "", u = n.charAt(0);
				if (!(u === "`" && l.includes("`"))) {
					let [t = "", ...d] = l.trim().split(/\s+/), f = t === IC;
					f && a(o), r = {
						char: u,
						length: n.length,
						bodyStart: s < 0 ? e.length : c + 1,
						index: f ? i++ : -1,
						target: f ? BC(d) : void 0
					};
				}
			}
		}
		if (s < 0) break;
		o = s + 1;
	}
	if (r && r.index >= 0) {
		let { char: n } = r, i = e.slice(r.bodyStart), a = i.lastIndexOf("\n"), o = i.slice(a + 1).replace(/\r$/, "");
		o.length > 0 && [...o].every((e) => e === n) && (i = i.slice(0, a + 1)), t.push(VC(r, i, !1));
	} else a(e.length);
	return t;
}
var UC = [
	"createSurface",
	"updateComponents",
	"updateDataModel",
	"deleteSurface"
], WC = "callRendererFunction", GC = [...UC, WC];
function KC(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function qC(e) {
	return e === " " || e === "\n" || e === "\r" || e === "	";
}
function JC(e, t) {
	for (; t < e.length && qC(e[t]);) t++;
	return t;
}
function YC(e, t) {
	for (let n = t + 1; n < e.length; n++) if (e[n] === "\\") n++;
	else if (e[n] === "\"") return n;
	return -1;
}
function XC(e, t) {
	let n = e.trim();
	if (n) try {
		t.push(JSON.parse(n));
	} catch {}
}
function ZC(e, t) {
	let n = t - 1;
	for (; n >= 0 && qC(e[n]);) n--;
	return n;
}
var QC = /* @__PURE__ */ new Set([
	"id",
	"component",
	"child",
	"children"
]);
function $C(e, t) {
	return e === "children" ? t === "[" || t === "{" : t === "\"";
}
var ew = /^\{\s*"id"\s*:/;
function tw(e) {
	let t = [], n = /* @__PURE__ */ new Set(), r = "", i = 0;
	for (let a = 0; a < e.length; a++) {
		let o = e[a];
		if (o === "\"") {
			let o = YC(e, a);
			if (o < 0) return null;
			let s = ZC(e, a), c = e[s], l = JC(e, o + 1);
			if (t[t.length - 1] === "{" && (c === "," || c === "{") && e[l] === ":") {
				let u;
				try {
					u = JSON.parse(e.slice(a, o + 1));
				} catch {
					return null;
				}
				if (typeof u == "string") {
					if (t.length === 1) n.add(u);
					else if (QC.has(u) && !n.has(u) && t.every((e) => e === "{") && $C(u, e[JC(e, l + 1)])) {
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
function nw(e) {
	if (e !== null) try {
		let t = JSON.parse(e);
		return KC(t) ? t : void 0;
	} catch {
		return;
	}
}
function rw(e, t, n) {
	let { repairComponents: r } = n, i = e, a = [], o = [], s = !1, c = -1, l = (e, t) => {
		let n = i.slice(c, e);
		if (!r) {
			XC(n, a);
			return;
		}
		if (t) try {
			a.push(JSON.parse(n));
			return;
		} catch {}
		let o = nw(tw(n.trim()));
		o !== void 0 && a.push(o);
	};
	for (let e = t + 1; e < i.length; e++) {
		let t = i[e];
		if (s) t === "\\" ? e++ : t === "\"" && (s = !1);
		else if (t === "\"") s = !0, o.length === 0 && c < 0 && (c = e);
		else if (t === "{" || t === "[") {
			if (r && t === "{" && o[o.length - 1] === "{" && ew.test(i.slice(e, e + 24))) {
				let n = ZC(i, e);
				if (i[n] === ",") {
					l(n, !1), o.length = 0, c = e, o.push(t);
					continue;
				}
			}
			o.length === 0 && (c = e), o.push(t);
		} else if (t === "}" || t === "]") {
			if (o.length === 0) return t === "]" ? (c >= 0 && XC(i.slice(c, e), a), {
				items: a,
				closed: !0
			}) : {
				items: a,
				closed: !1
			};
			o.pop(), o.length === 0 && (l(e + 1, !0), c = -1);
		} else o.length === 0 && (t === "," ? (c >= 0 && XC(i.slice(c, e), a), c = -1) : c < 0 && !qC(t) && (c = e));
	}
	return {
		items: a,
		closed: !1
	};
}
function iw(e) {
	for (let t of GC) {
		let n = e[t];
		if (KC(n)) return {
			key: t,
			inner: n
		};
	}
	return null;
}
function aw(e) {
	if (iw(e)?.key !== WC) {
		for (let t of UC) {
			let n = e[t];
			if (KC(n) && typeof n.surfaceId == "string") return n.surfaceId;
		}
		return typeof e.surfaceId == "string" ? e.surfaceId : void 0;
	}
}
function ow(e, t) {
	let n = e[t];
	if (n === "\"") {
		let n = YC(e, t);
		return n < 0 ? -1 : n + 1;
	}
	if (n === "{" || n === "[") {
		let n = 0;
		for (let r = t; r < e.length; r++) {
			let t = e[r];
			if (t === "\"") {
				let t = YC(e, r);
				if (t < 0) return -1;
				r = t;
			} else if (t === "{" || t === "[") n++;
			else if ((t === "}" || t === "]") && (n--, n === 0)) return r + 1;
		}
		return -1;
	}
	let r = t;
	for (; r < e.length && !qC(e[r]) && !",}]".includes(e[r]);) r++;
	return r >= e.length ? -1 : r;
}
function sw(e, t, n) {
	let r = t + 1;
	for (; r < e.length;) {
		r = JC(e, r);
		let t = e[r];
		if (t === ",") {
			r++;
			continue;
		}
		if (t !== "\"") return;
		let i = YC(e, r);
		if (i < 0) return;
		let a;
		try {
			a = JSON.parse(e.slice(r, i + 1));
		} catch {
			return;
		}
		if (r = JC(e, i + 1), e[r] !== ":" || (r = JC(e, r + 1), r >= e.length) || typeof a == "string" && n(a, r)) return;
		let o = ow(e, r);
		if (o < 0) return;
		r = o;
	}
}
function cw(e, t, n, r) {
	let i = -1;
	return sw(e, t, (t, a) => t === n && ((r === void 0 || e[a] === r) && (i = a), !0)), i;
}
function lw(e, t, n) {
	if (t < 0) return null;
	let r = cw(e, t, n, "\"");
	if (r < 0) return null;
	let i = ow(e, r);
	if (i < 0) return null;
	try {
		let t = JSON.parse(e.slice(r, i));
		return typeof t == "string" ? t : null;
	} catch {
		return null;
	}
}
function uw(e, t, n) {
	let r = cw(e, t, n, "{");
	if (r < 0) return;
	let i = ow(e, r);
	if (!(i < 0)) return nw(e.slice(r, i));
}
function dw(e, t) {
	let n = ow(e, t);
	if (n >= 0) try {
		return JSON.parse(e.slice(t, n));
	} catch {
		return;
	}
	if (e[t] !== "{") return;
	let r = {};
	return sw(e, t, (t, n) => {
		let i = ow(e, n);
		if (i >= 0) try {
			r[t] = JSON.parse(e.slice(n, i));
		} catch {}
		else if (e[n] === "[") {
			let { items: i } = rw(e, n, { repairComponents: !1 });
			i.length > 0 && (r[t] = i);
		}
		return !1;
	}), Object.keys(r).length > 0 ? r : void 0;
}
function fw(e) {
	let t = JC(e, 0);
	if (e[t] !== "{") return null;
	let n = lw(e, t, "version") ?? "v1.0", r = cw(e, t, "updateComponents", "{");
	if (r >= 0) {
		let t = cw(e, r, "components", "[");
		if (t < 0) return null;
		let { items: i } = rw(e, t, { repairComponents: !0 });
		if (i.length === 0) return null;
		let a = lw(e, r, "surfaceId");
		return {
			version: n,
			updateComponents: {
				...a ? { surfaceId: a } : {},
				components: i
			}
		};
	}
	let i = cw(e, t, "updateDataModel", "{");
	if (i >= 0) {
		let t = cw(e, i, "value");
		if (t < 0) return null;
		let r = dw(e, t);
		if (r === void 0) return null;
		let a = lw(e, i, "surfaceId"), o = lw(e, i, "path");
		return {
			version: n,
			updateDataModel: {
				...a ? { surfaceId: a } : {},
				...o ? { path: o } : {},
				value: r
			}
		};
	}
	let a = cw(e, t, "createSurface", "{");
	if (a >= 0) {
		let t = lw(e, a, "surfaceId");
		if (!t) return null;
		let r = lw(e, a, "catalogId"), i = uw(e, a, "dataModel"), o = cw(e, a, "components", "["), s = o < 0 ? [] : rw(e, o, { repairComponents: !0 }).items;
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
var pw = RegExp(`^\\{\\s*"(?:version"\\s*:\\s*"v\\d|(?:${GC.join("|")})"\\s*:\\s*\\{)`);
function mw(e, t) {
	let n = 0, r = !1;
	for (let i = t; i < e.length; i++) {
		let t = e[i];
		if (!(r && (t === "\\" && e[i + 1] !== "\n" ? i++ : (t === "\"" || t === "\n") && (r = !1), t !== "\n"))) {
			if (t === "\n") {
				let t = JC(e, i + 1);
				if (pw.test(e.slice(t, t + 40))) return {
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
function hw(e) {
	let t = e, n = [], r = [], i = [], a = null, o = (e) => {
		r.push(e.trim());
		let t = fw(e);
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
			let { end: e, balanced: r } = mw(t, l), i = t.slice(l, e);
			if (r) {
				let e;
				try {
					e = JSON.parse(i);
				} catch {
					e = void 0;
				}
				KC(e) ? n.push(e) : o(i);
			} else if (e < t.length) o(i);
			else {
				a = i;
				let e = fw(i);
				e && n.push(e);
			}
			l = e;
		} else e === "\n" || e === "[" || e === "]" ? c(l) : s < 0 && !qC(e) && e !== "," && (s = l), l++;
	}
	return c(t.length), {
		operations: n,
		partialObject: a,
		partialLine: a,
		invalidLines: r,
		recovered: i
	};
}
function gw(e) {
	let { operations: t, fallbackSurfaceId: n, catalogId: r } = e, i = e.catalogIds ?? [r], a = t.map(aw).find((e) => !!e) ?? n, o = [], s = [], c = !1;
	for (let e of t) {
		let t = iw(e);
		if (!t) continue;
		let { key: n } = t, l = { ...t.inner }, u = typeof e.version == "string" ? e.version : Rm;
		if (n === WC) s.push({
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
		version: Rm,
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
var _w = /* @__PURE__ */ new Set([
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
function vw(e) {
	if (typeof e == "string") return e;
	if (KC(e)) {
		if (typeof e.componentId == "string") return e.componentId;
		if (typeof e.id == "string") return e.id;
	}
}
function yw(e) {
	return KC(e) ? vw(e) : void 0;
}
function bw(e, t) {
	let n = [], r = (e) => {
		e && n.push(e);
	}, i = t?.(e);
	Array.isArray(i) && i.forEach(r), r(vw(e.child));
	let a = e.children;
	if (Array.isArray(a) ? a.forEach((e) => r(vw(e))) : r(vw(a)), Array.isArray(e.columns) && e.columns.forEach((e) => r(yw(e))), Array.isArray(e.rows)) for (let t of e.rows) Array.isArray(t) && t.forEach((e) => r(yw(e)));
	return n;
}
function xw(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) {
		let e = n.updateComponents, r = KC(e) ? e.components : void 0;
		if (Array.isArray(r)) for (let e of r) KC(e) && typeof e.id == "string" && t.set(e.id, e);
	}
	return t;
}
function Sw(e, t, n) {
	let r = /* @__PURE__ */ new Set(), i = [...bw(t.get(e) ?? {}, n)];
	for (; i.length > 0;) {
		let a = i.pop();
		if (r.has(a) || a === e) continue;
		r.add(a);
		let o = t.get(a);
		o && i.push(...bw(o, n));
	}
	return r;
}
function Cw(e, t = {}) {
	let n = /* @__PURE__ */ new Map();
	for (let t of e) KC(t) && typeof t.id == "string" && n.set(t.id, t);
	let r = /* @__PURE__ */ new Set();
	for (let [e, i] of n) if (i.component === "Card") for (let i of Sw(e, n, t.childIds)) {
		let t = n.get(i)?.component;
		if (typeof t == "string" && _w.has(t)) {
			r.add(e);
			break;
		}
	}
	return r;
}
function ww(e, t = {}) {
	let n = xw(e);
	if (![...n.values()].some((e) => e.component === "Card")) return e;
	let r = Cw([...n.values()], t), i = /* @__PURE__ */ new Set();
	for (let e of r) for (let r of Sw(e, n, t.childIds)) i.add(r);
	let a = (e) => e.component === "Card" && typeof e.id == "string" && !r.has(e.id) && !i.has(e.id) && e.variant == null && e.border == null;
	return e.map((e) => {
		let t = e.updateComponents;
		return !KC(t) || !Array.isArray(t.components) || !t.components.some((e) => KC(e) && a(e)) ? e : {
			...e,
			updateComponents: {
				...t,
				components: t.components.map((e) => KC(e) && a(e) ? {
					...e,
					variant: "section"
				} : e)
			}
		};
	});
}
var Tw = /* @__PURE__ */ new Set([
	"Title",
	"Text",
	"Caption",
	"Markdown"
]);
function Ew(e) {
	return e.trim().replace(/\s*\n\s*/g, " ");
}
function Dw(e) {
	if (typeof e == "string") return e.trim() ? Ew(e) : null;
	if (!KC(e)) return null;
	for (let t of Object.keys(e)) if (t !== "label" && t !== "description") return null;
	if (typeof e.label != "string" || !e.label.trim()) return null;
	let t = Ew(e.label);
	return e.description === void 0 ? t : typeof e.description == "string" ? e.description.trim() ? `**${t}** — ${Ew(e.description)}` : t : null;
}
function Ow(e) {
	let t = e.children;
	if (t != null && !(Array.isArray(t) && t.length === 0) || !Array.isArray(e.items) || e.items.length === 0) return null;
	let n = [];
	for (let t of e.items) {
		let e = Dw(t);
		if (e === null) return null;
		n.push(e);
	}
	if (e.marker === "number") {
		let t = typeof e.start == "number" && Number.isInteger(e.start) ? e.start : 1;
		return n.map((e, n) => `${t + n}. ${e}`).join("\n");
	}
	return n.map((e) => `- ${e}`).join("\n");
}
function kw(e) {
	if (!e || e.accessibility !== void 0) return null;
	if (e.component === "Divider") return { kind: "divider" };
	if (e.component === "Spacer") return { kind: "spacer" };
	if (e.component === "List") {
		if (e.direction !== void 0 && e.direction !== "vertical") return null;
		let t = Ow(e);
		return t === null ? null : {
			kind: "text",
			markdown: t
		};
	}
	if (typeof e.component != "string" || !Tw.has(e.component) || typeof e.text != "string" || e.text.trim() === "") return null;
	let t = e.text.trim();
	switch (e.component) {
		case "Title": {
			let n = typeof e.size == "string" ? e.size : "md";
			return {
				kind: "text",
				markdown: `${n === "sm" ? "####" : n === "md" || n === "lg" ? "###" : "##"} ${t}`
			};
		}
		case "Text": return bw(e).length > 0 ? null : {
			kind: "text",
			markdown: e.strong === !0 ? `**${t}**` : t
		};
		default: return {
			kind: "text",
			markdown: t
		};
	}
}
function Aw(e) {
	let t = [], n = !1;
	for (let r of e) r?.kind === "text" ? (n && t.length > 0 && t.push("---"), n = !1, t.push(r.markdown)) : r?.kind === "divider" && (n = !0);
	return t.join("\n\n");
}
function jw(e, t) {
	return e.accessibility === void 0 ? e.component === "Column" ? !0 : e.component === "Box" ? e.direction == null || e.direction === "col" : e.component === "Card" && (e.variant == null || e.variant === "section") && typeof e.id == "string" && !t.has(e.id) : !1;
}
function Mw(e) {
	let t = typeof e.child == "string" ? [e.child] : [];
	return Array.isArray(e.children) ? [...t, ...e.children] : t.length > 0 && e.children === void 0 ? t : null;
}
function Nw(e) {
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
function Pw(e, t = {}) {
	let n = [{
		kind: "surface",
		components: e
	}], r = /* @__PURE__ */ new Map();
	for (let t of e) KC(t) && typeof t.id == "string" && r.set(t.id, t);
	let i = r.get(Um);
	if (!i || e.some((e) => KC(e) && t.childIds?.(e) === "unknown")) return n;
	let a = kw(i);
	if (a?.kind === "text") return [{
		kind: "markdown",
		markdown: a.markdown
	}];
	let o = Cw(e, t), s = i, c = Um, l, u = /* @__PURE__ */ new Set();
	for (;;) {
		if (!jw(s, o)) return n;
		u.add(c);
		let e = Mw(s);
		if (!e) return n;
		l = e;
		let t = e.length === 1 ? e[0] : void 0;
		if (typeof t != "string") break;
		let i = r.get(t);
		if (!i || u.has(t) || kw(i)) break;
		s = i, c = t;
	}
	let d = l, f = d.map((e) => typeof e == "string" ? kw(r.get(e)) : null), p = Nw(f);
	if (!p.some((e) => e.prose)) return n;
	let m = p.filter((e) => !e.prose), h = /* @__PURE__ */ new Map();
	m.forEach((e, n) => {
		let i = d.slice(e.start, e.end).map(vw).filter((e) => e !== void 0), a = /* @__PURE__ */ new Set();
		for (; i.length > 0;) {
			let e = i.pop();
			if (e === "root" || e === c || a.has(e)) continue;
			a.add(e);
			let o = h.get(e);
			o ? o.push(n) : h.set(e, [n]);
			let s = r.get(e);
			s && i.push(...bw(s, t.childIds));
		}
	});
	let g = m.map((e) => {
		let { child: t, ...n } = s, r = {
			...n,
			id: Um,
			children: d.slice(e.start, e.end)
		};
		return delete r.child, [r];
	});
	for (let t of e) {
		if (!KC(t) || typeof t.id != "string" || r.get(t.id) !== t) continue;
		let e = h.get(t.id) ?? [];
		for (let n of e) g[n].push(t);
	}
	let ee = 0;
	return p.map((e) => e.prose ? {
		kind: "markdown",
		markdown: Aw(f.slice(e.start, e.end))
	} : {
		kind: "surface",
		components: g[ee++]
	});
}
// node_modules/@lit/reactive-element/css-tag.js
var Fw = globalThis, Iw = Fw.ShadowRoot && (Fw.ShadyCSS === void 0 || Fw.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Lw = Symbol(), Rw = /* @__PURE__ */ new WeakMap(), zw = class {
	constructor(e, t, n) {
		if (this._$cssResult$ = !0, n !== Lw) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
		this.cssText = e, this.t = t;
	}
	get styleSheet() {
		let e = this.o, t = this.t;
		if (Iw && e === void 0) {
			let n = t !== void 0 && t.length === 1;
			n && (e = Rw.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), n && Rw.set(t, e));
		}
		return e;
	}
	toString() {
		return this.cssText;
	}
}, Bw = (e) => new zw(typeof e == "string" ? e : e + "", void 0, Lw), Vw = (e, ...t) => new zw(e.length === 1 ? e[0] : t.reduce((t, n, r) => t + ((e) => {
	if (!0 === e._$cssResult$) return e.cssText;
	if (typeof e == "number") return e;
	throw Error("Value passed to 'css' function must be a 'css' function result: " + e + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
})(n) + e[r + 1], e[0]), e, Lw), Hw = (e, t) => {
	if (Iw) e.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
	else for (let n of t) {
		let t = document.createElement("style"), r = Fw.litNonce;
		r !== void 0 && t.setAttribute("nonce", r), t.textContent = n.cssText, e.appendChild(t);
	}
}, Uw = Iw ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((e) => {
	let t = "";
	for (let n of e.cssRules) t += n.cssText;
	return Bw(t);
})(e) : e, { is: Ww, defineProperty: Gw, getOwnPropertyDescriptor: Kw, getOwnPropertyNames: qw, getOwnPropertySymbols: Jw, getPrototypeOf: Yw } = Object, Xw = globalThis, Zw = Xw.trustedTypes, Qw = Zw ? Zw.emptyScript : "", $w = Xw.reactiveElementPolyfillSupport, eT = (e, t) => e, tT = {
	toAttribute(e, t) {
		switch (t) {
			case Boolean:
				e = e ? Qw : null;
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
}, nT = (e, t) => !Ww(e, t), rT = {
	attribute: !0,
	type: String,
	converter: tT,
	reflect: !1,
	useDefault: !1,
	hasChanged: nT
};
Symbol.metadata ??= Symbol("metadata"), Xw.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var iT = class extends HTMLElement {
	static addInitializer(e) {
		this._$Ei(), (this.l ??= []).push(e);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(e, t = rT) {
		if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
			let n = Symbol(), r = this.getPropertyDescriptor(e, n, t);
			r !== void 0 && Gw(this.prototype, e, r);
		}
	}
	static getPropertyDescriptor(e, t, n) {
		let { get: r, set: i } = Kw(this.prototype, e) ?? {
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
		return this.elementProperties.get(e) ?? rT;
	}
	static _$Ei() {
		if (this.hasOwnProperty(eT("elementProperties"))) return;
		let e = Yw(this);
		e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(eT("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(eT("properties"))) {
			let e = this.properties, t = [...qw(e), ...Jw(e)];
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
			for (let e of n) t.unshift(Uw(e));
		} else e !== void 0 && t.push(Uw(e));
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
		return Hw(e, this.constructor.elementStyles), e;
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
			let i = (n.converter?.toAttribute === void 0 ? tT : n.converter).toAttribute(t, n.type);
			this._$Em = e, i == null ? this.removeAttribute(r) : this.setAttribute(r, i), this._$Em = null;
		}
	}
	_$AK(e, t) {
		let n = this.constructor, r = n._$Eh.get(e);
		if (r !== void 0 && this._$Em !== r) {
			let e = n.getPropertyOptions(r), i = typeof e.converter == "function" ? { fromAttribute: e.converter } : e.converter?.fromAttribute === void 0 ? tT : e.converter;
			this._$Em = r;
			let a = i.fromAttribute(t, e.type);
			this[r] = a ?? this._$Ej?.get(r) ?? a, this._$Em = null;
		}
	}
	requestUpdate(e, t, n, r = !1, i) {
		if (e !== void 0) {
			let a = this.constructor;
			if (!1 === r && (i = this[e]), n ??= a.getPropertyOptions(e), !((n.hasChanged ?? nT)(i, t) || n.useDefault && n.reflect && i === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, n)))) return;
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
iT.elementStyles = [], iT.shadowRootOptions = { mode: "open" }, iT[eT("elementProperties")] = /* @__PURE__ */ new Map(), iT[eT("finalized")] = /* @__PURE__ */ new Map(), $w?.({ ReactiveElement: iT }), (Xw.reactiveElementVersions ??= []).push("2.1.2");
// node_modules/lit-html/lit-html.js
var aT = globalThis, oT = (e) => e, sT = aT.trustedTypes, cT = sT ? sT.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, lT = "$lit$", uT = `lit$${Math.random().toFixed(9).slice(2)}$`, dT = "?" + uT, fT = `<${dT}>`, pT = document, mT = () => pT.createComment(""), hT = (e) => e === null || typeof e != "object" && typeof e != "function", gT = Array.isArray, _T = (e) => gT(e) || typeof e?.[Symbol.iterator] == "function", vT = "[ 	\n\f\r]", yT = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, bT = /-->/g, xT = />/g, ST = RegExp(`>|${vT}(?:([^\\s"'>=/]+)(${vT}*=${vT}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), CT = /'/g, wT = /"/g, TT = /^(?:script|style|textarea|title)$/i, ET = ((e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}))(1), DT = Symbol.for("lit-noChange"), OT = Symbol.for("lit-nothing"), kT = /* @__PURE__ */ new WeakMap(), AT = pT.createTreeWalker(pT, 129);
function jT(e, t) {
	if (!gT(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return cT === void 0 ? t : cT.createHTML(t);
}
var MT = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = yT;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === yT ? c[1] === "!--" ? o = bT : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = ST) : (TT.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = ST) : o = xT : o === ST ? c[0] === ">" ? (o = i ?? yT, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? ST : c[3] === "\"" ? wT : CT) : o === wT || o === CT ? o = ST : o === bT || o === xT ? o = yT : (o = ST, i = void 0);
		let d = o === ST && e[t + 1].startsWith("/>") ? " " : "";
		a += o === yT ? n + fT : l >= 0 ? (r.push(s), n.slice(0, l) + lT + n.slice(l) + uT + d) : n + uT + (l === -2 ? t : d);
	}
	return [jT(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, NT = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = MT(t, n);
		if (this.el = e.createElement(l, r), AT.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = AT.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(lT)) {
					let t = u[o++], n = i.getAttribute(e).split(uT), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? RT : r[1] === "?" ? zT : r[1] === "@" ? BT : LT
					}), i.removeAttribute(e);
				} else e.startsWith(uT) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (TT.test(i.tagName)) {
					let e = i.textContent.split(uT), t = e.length - 1;
					if (t > 0) {
						i.textContent = sT ? sT.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], mT()), AT.nextNode(), c.push({
							type: 2,
							index: ++a
						});
						i.append(e[t], mT());
					}
				}
			} else if (i.nodeType === 8) {
				if (i.data === dT) c.push({
					type: 2,
					index: a
				});
				else {
					let e = -1;
					for (; (e = i.data.indexOf(uT, e + 1)) !== -1;) c.push({
						type: 7,
						index: a
					}), e += uT.length - 1;
				}
			}
			a++;
		}
	}
	static createElement(e, t) {
		let n = pT.createElement("template");
		return n.innerHTML = e, n;
	}
};
function PT(e, t, n = e, r) {
	if (t === DT) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = hT(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = PT(e, i._$AS(e, t.values), i, r)), t;
}
var FT = class {
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
		let { el: { content: t }, parts: n } = this._$AD, r = (e?.creationScope ?? pT).importNode(t, !0);
		AT.currentNode = r;
		let i = AT.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new IT(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new VT(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = AT.nextNode(), a++);
		}
		return AT.currentNode = pT, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, IT = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = OT, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
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
		e = PT(this, e, t), hT(e) ? e === OT || e == null || e === "" ? (this._$AH !== OT && this._$AR(), this._$AH = OT) : e !== this._$AH && e !== DT && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? _T(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== OT && hT(this._$AH) ? this._$AA.nextSibling.data = e : this.T(pT.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = NT.createElement(jT(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new FT(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = kT.get(e.strings);
		return t === void 0 && kT.set(e.strings, t = new NT(e)), t;
	}
	k(t) {
		gT(this._$AH) || (this._$AH = [], this._$AR());
		let n = this._$AH, r, i = 0;
		for (let a of t) i === n.length ? n.push(r = new e(this.O(mT()), this.O(mT()), this, this.options)) : r = n[i], r._$AI(a), i++;
		i < n.length && (this._$AR(r && r._$AB.nextSibling, i), n.length = i);
	}
	_$AR(e = this._$AA.nextSibling, t) {
		for (this._$AP?.(!1, !0, t); e !== this._$AB;) {
			let t = oT(e).nextSibling;
			oT(e).remove(), e = t;
		}
	}
	setConnected(e) {
		this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
	}
}, LT = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = OT, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = OT;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = PT(this, e, t, 0), a = !hT(e) || e !== this._$AH && e !== DT, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = PT(this, r[n + o], t, o), s === DT && (s = this._$AH[o]), a ||= !hT(s) || s !== this._$AH[o], s === OT ? e = OT : e !== OT && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === OT ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, RT = class extends LT {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === OT ? void 0 : e;
	}
}, zT = class extends LT {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== OT);
	}
}, BT = class extends LT {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = PT(this, e, t, 0) ?? OT) === DT) return;
		let n = this._$AH, r = e === OT && n !== OT || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== OT && (n === OT || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, VT = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		PT(this, e);
	}
}, HT = {
	M: lT,
	P: uT,
	A: dT,
	C: 1,
	L: MT,
	R: FT,
	D: _T,
	V: PT,
	I: IT,
	H: LT,
	N: zT,
	U: BT,
	B: RT,
	F: VT
}, UT = aT.litHtmlPolyfillSupport;
UT?.(NT, IT), (aT.litHtmlVersions ??= []).push("3.3.3");
var WT = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new IT(t.insertBefore(mT(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, GT = globalThis, KT = class extends iT {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = WT(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return DT;
	}
};
KT._$litElement$ = !0, KT.finalized = !0, GT.litElementHydrateSupport?.({ LitElement: KT });
var qT = GT.litElementPolyfillSupport;
qT?.({ LitElement: KT }), (GT.litElementVersions ??= []).push("4.2.2");
// node_modules/lit-html/directive.js
var JT = {
	ATTRIBUTE: 1,
	CHILD: 2,
	PROPERTY: 3,
	BOOLEAN_ATTRIBUTE: 4,
	EVENT: 5,
	ELEMENT: 6
}, YT = (e) => (...t) => ({
	_$litDirective$: e,
	values: t
}), XT = class {
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
export { Wm as $, MC as A, wS as B, hw as C, Le as Ct, Xy as D, wC as E, Oy as F, dC as G, ES as H, mC as I, jb as J, pC as K, hC as L, gw as M, Pw as N, PC as O, HC as P, zm as Q, gC as R, jC as S, kt as St, aw as T, TS as U, DS as V, OS as W, Gm as X, H_ as Y, Rm as Z, TC as _, vm as _t, OT as a, jm as at, kC as b, Ct as bt, ET as c, Mm as ct, Bw as d, Lm as dt, Hm as et, NS as f, Am as ft, PS as g, Sm as gt, fb as h, xm as ht, KT as i, Km as it, FC as j, NC as k, HT as l, Pm as lt, MS as m, bm as mt, XT as n, Vm as nt, WT as o, Nm as ot, AS as p, Em as pt, fC as q, JT as r, Um as rt, DT as s, Fm as st, YT as t, Bm as tt, Vw as u, Im as ut, uC as v, mm as vt, ww as w, OC as x, wt as xt, AC as y, tm as yt, _C as z };
