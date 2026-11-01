import { r as e } from "./rolldown-runtime-CwxnZyOB.js";
import { n as t, r as n, t as r } from "./content-schema-zuSr5D-R.js";
import { C as i, S as a, T as o, _ as s, a as c, b as l, c as u, f as d, g as f, h as p, i as m, l as h, m as g, n as _, o as v, p as y, r as b, s as x, t as ee, u as S, v as C, w as te, x as w, y as T } from "./random-id-Dq3iPRBO.js";
// node_modules/zod/v4/classic/iso.js
function E(e) {
	return te(_, e);
}
// node_modules/@copilotkit/mcp-apps-renderer/dist/follow-up.mjs
async function ne({ host: e, agent: t, capturedThreadId: n }) {
	let r = t.threadId || "default", i = n || "default";
	return r === i ? e.runAgent({ agent: t }) : (console.warn(`[MCPAppsRenderer] ui/message follow-up dropped: the thread changed (${i} → ${r}) between enqueue and execution, so running it would leak into the now-foreground thread.`), {
		result: void 0,
		newMessages: []
	});
}
// node_modules/@copilotkit/mcp-apps-renderer/dist/sandbox.mjs
var D = "allow-scripts allow-forms", re = "allow-scripts allow-same-origin allow-forms";
function ie(e = !1) {
	return e ? re : D;
}
var ae = /^(?:[a-z][a-z0-9+.-]*:\/\/)?(?:\*\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*(?::(?:\d+|\*))?(?:\/[\w.~%/!$()*+=:@-]*)?$/i;
function oe(e) {
	let t = (e ?? []).filter((e) => typeof e == "string" && ae.test(e)), n = t.length ? " " + t.join(" ") : "";
	return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src * data: blob: 'unsafe-inline'; media-src * blob: data:; font-src * blob: data:; script-src ${"'self' 'wasm-unsafe-eval' 'unsafe-inline' 'unsafe-eval' blob: data: http://localhost:* https://localhost:*" + n}; style-src * blob: data: 'unsafe-inline'; connect-src *; frame-src ${"* blob: data: http://localhost:* https://localhost:*" + n}; base-uri 'self';" />
<style>html,body{margin:0;padding:0;height:100%;width:100%;overflow:hidden}*{box-sizing:border-box}iframe{background-color:transparent;border:none;padding:0;overflow:hidden;width:100%;height:100%}</style>
</head>
<body>
<script>
if(window.self===window.top){throw new Error("This file must be used in an iframe.")}
const inner=document.createElement("iframe");
inner.style="width:100%;height:100%;border:none;";
inner.setAttribute("sandbox","${D}");
document.body.appendChild(inner);
window.addEventListener("message",async(event)=>{
if(event.source===window.parent){
if(event.data&&event.data.method==="ui/notifications/sandbox-resource-ready"){
const{html,sandbox}=event.data.params;
if(typeof sandbox==="string")inner.setAttribute("sandbox",sandbox);
if(typeof html==="string")inner.srcdoc=html;
}else if(inner&&inner.contentWindow){
inner.contentWindow.postMessage(event.data,"*");
}
}else if(event.source===inner.contentWindow){
if(event.data&&typeof event.data.method==="string"&&event.data.method.startsWith("ui/notifications/sandbox-"))return;
window.parent.postMessage(event.data,"*");
}
});
window.parent.postMessage({jsonrpc:"2.0",method:"ui/notifications/sandbox-proxy-ready",params:{}},"*");
<\/script>
</body>
</html>`;
}
// node_modules/@copilotkit/mcp-apps-renderer/dist/request-queue.mjs
var O = 3e4, se = class extends Error {
	constructor(e, t) {
		super(`[CopilotKit] MCP app request dropped: the agent moved from thread "${e}" to "${t}" while it was queued.`), this.originThreadId = e, this.currentThreadId = t, this.name = "MCPAppsQueueThreadChangedError";
	}
}, ce = /* @__PURE__ */ new WeakMap(), le = 0;
function ue(e) {
	let t = ce.get(e);
	return t || (t = `agent-${le++}`, ce.set(e, t)), `${t}::${e.threadId || "default"}`;
}
var de = class {
	constructor() {
		this.queues = /* @__PURE__ */ new Map(), this.processing = /* @__PURE__ */ new Map();
	}
	async enqueue(e, t, n) {
		let r = ue(e);
		return new Promise((i, a) => {
			let o = this.queues.get(r);
			o || (o = [], this.queues.set(r, o)), o.push({
				execute: t,
				cancelRunningWait: n?.cancelRunningWait,
				resolve: i,
				reject: a,
				owner: n?.owner,
				timeoutMs: n?.timeoutMs ?? 3e4,
				controller: new AbortController(),
				originThreadId: e.threadId || "default",
				dropAfterThreadSwitch: n?.dropAfterThreadSwitch
			}), this.processQueue(r, e);
		});
	}
	cancelOwner(e) {
		for (let t of this.queues.values()) for (let n of t) n.owner !== e || n.executing && !n.cancelRunningWait || n.cancelled || (n.cancelled = !0, n.controller.abort(), n.reject(/* @__PURE__ */ Error("[CopilotKit] MCP app request cancelled on teardown")));
	}
	async processQueue(e, t) {
		if (!this.processing.get(e)) {
			this.processing.set(e, !0);
			try {
				let n = this.queues.get(e);
				if (!n) return;
				for (; n.length > 0;) {
					let e = n[0];
					if (e.cancelled) n.shift();
					else {
						try {
							if (await this.waitForAgentIdle(t, e.timeoutMs, e.controller.signal), e.cancelled) {
								n.shift();
								continue;
							}
							let r = t.threadId || "default";
							if (e.dropAfterThreadSwitch && r !== e.originThreadId) {
								e.reject(new se(e.originThreadId, r)), n.shift();
								continue;
							}
							e.executing = !0;
							let i = e.execute(e.controller.signal), a = e.cancelRunningWait ? await fe(i, e.controller.signal) : await i;
							e.resolve(a);
						} catch (t) {
							e.reject(t instanceof Error ? t : Error(String(t)));
						}
						n.shift();
					}
				}
			} finally {
				let t = this.queues.get(e);
				!t || t.length === 0 ? (this.queues.delete(e), this.processing.delete(e)) : this.processing.set(e, !1);
			}
		}
	}
	waitForAgentIdle(e, t, n) {
		return new Promise((r, i) => {
			if (!e.isRunning) {
				r();
				return;
			}
			if (n?.aborted) {
				i(/* @__PURE__ */ Error("[CopilotKit] MCP app request cancelled on teardown"));
				return;
			}
			let a = !1, o = (e) => {
				a || (a = !0, clearTimeout(d), clearInterval(u), l.unsubscribe(), n?.removeEventListener("abort", s), e());
			}, s = () => o(() => i(/* @__PURE__ */ Error("[CopilotKit] MCP app request cancelled on teardown")));
			n?.addEventListener("abort", s);
			let c = () => o(r), l = e.subscribe({
				onRunFinalized: c,
				onRunFailed: c
			}), u = setInterval(() => {
				e.isRunning || c();
			}, 500), d = setTimeout(() => {
				o(() => i(/* @__PURE__ */ Error("[CopilotKit] Timed out waiting for agent to become idle")));
			}, t);
		});
	}
}, k = new de();
function fe(e, t) {
	return new Promise((n, r) => {
		let i = () => r(/* @__PURE__ */ Error("[CopilotKit] MCP app request cancelled on teardown"));
		t.addEventListener("abort", i, { once: !0 }), e.then(n, r).finally(() => t.removeEventListener("abort", i)), t.aborted && i();
	});
}
// node_modules/@modelcontextprotocol/sdk/dist/esm/types.js
var A = "io.modelcontextprotocol/related-task", j = h((e) => e !== null && (typeof e == "object" || typeof e == "function")), pe = a([w(), f().int()]), me = w();
g({
	ttl: f().optional(),
	pollInterval: f().optional()
});
var he = s({ ttl: f().optional() }), ge = s({ taskId: w() }), _e = g({
	progressToken: pe.optional(),
	[A]: ge.optional()
}), M = s({ _meta: _e.optional() }), N = M.extend({ task: he.optional() }), ve = (e) => N.safeParse(e).success, P = s({
	method: w(),
	params: M.loose().optional()
}), F = s({ _meta: _e.optional() }), I = s({
	method: w(),
	params: F.loose().optional()
}), L = g({ _meta: _e.optional() }), R = a([w(), f().int()]), ye = s({
	jsonrpc: y("2.0"),
	id: R,
	...P.shape
}).strict(), be = (e) => ye.safeParse(e).success, xe = s({
	jsonrpc: y("2.0"),
	...I.shape
}).strict(), Se = (e) => xe.safeParse(e).success, Ce = s({
	jsonrpc: y("2.0"),
	id: R,
	result: L
}).strict(), z = (e) => Ce.safeParse(e).success, B;
(function(e) {
	e[e.ConnectionClosed = -32e3] = "ConnectionClosed", e[e.RequestTimeout = -32001] = "RequestTimeout", e[e.ParseError = -32700] = "ParseError", e[e.InvalidRequest = -32600] = "InvalidRequest", e[e.MethodNotFound = -32601] = "MethodNotFound", e[e.InvalidParams = -32602] = "InvalidParams", e[e.InternalError = -32603] = "InternalError", e[e.UrlElicitationRequired = -32042] = "UrlElicitationRequired";
})(B ||= {});
var we = s({
	jsonrpc: y("2.0"),
	id: R.optional(),
	error: s({
		code: f().int(),
		message: w(),
		data: i().optional()
	})
}).strict(), Te = (e) => we.safeParse(e).success, Ee = a([
	ye,
	xe,
	Ce,
	we
]);
a([Ce, we]);
var De = L.strict(), Oe = F.extend({
	requestId: R.optional(),
	reason: w().optional()
}), ke = I.extend({
	method: y("notifications/cancelled"),
	params: Oe
}), Ae = s({
	src: w(),
	mimeType: w().optional(),
	sizes: x(w()).optional(),
	theme: b(["light", "dark"]).optional()
}), V = s({ icons: x(Ae).optional() }), H = s({
	name: w(),
	title: w().optional()
}), U = H.extend({
	...H.shape,
	...V.shape,
	version: w(),
	websiteUrl: w().optional(),
	description: w().optional()
}), je = d(s({ applyDefaults: u().optional() }), l(w(), i())), Me = T((e) => e && typeof e == "object" && !Array.isArray(e) && Object.keys(e).length === 0 ? { form: {} } : e, d(s({
	form: je.optional(),
	url: j.optional()
}), l(w(), i()).optional())), Ne = g({
	list: j.optional(),
	cancel: j.optional(),
	requests: g({
		sampling: g({ createMessage: j.optional() }).optional(),
		elicitation: g({ create: j.optional() }).optional()
	}).optional()
}), Pe = g({
	list: j.optional(),
	cancel: j.optional(),
	requests: g({ tools: g({ call: j.optional() }).optional() }).optional()
}), Fe = s({
	experimental: l(w(), j).optional(),
	sampling: s({
		context: j.optional(),
		tools: j.optional()
	}).optional(),
	elicitation: Me.optional(),
	roots: s({ listChanged: u().optional() }).optional(),
	tasks: Ne.optional(),
	extensions: l(w(), j).optional()
}), Ie = M.extend({
	protocolVersion: w(),
	capabilities: Fe,
	clientInfo: U
}), Le = P.extend({
	method: y("initialize"),
	params: Ie
}), Re = s({
	experimental: l(w(), j).optional(),
	logging: j.optional(),
	completions: j.optional(),
	prompts: s({ listChanged: u().optional() }).optional(),
	resources: s({
		subscribe: u().optional(),
		listChanged: u().optional()
	}).optional(),
	tools: s({ listChanged: u().optional() }).optional(),
	tasks: Pe.optional(),
	extensions: l(w(), j).optional()
}), ze = L.extend({
	protocolVersion: w(),
	capabilities: Re,
	serverInfo: U,
	instructions: w().optional()
}), Be = I.extend({
	method: y("notifications/initialized"),
	params: F.optional()
}), Ve = P.extend({
	method: y("ping"),
	params: M.optional()
}), He = s({
	progress: f(),
	total: C(f()),
	message: C(w())
}), Ue = s({
	...F.shape,
	...He.shape,
	progressToken: pe
}), We = I.extend({
	method: y("notifications/progress"),
	params: Ue
}), Ge = M.extend({ cursor: me.optional() }), W = P.extend({ params: Ge.optional() }), G = L.extend({ nextCursor: me.optional() }), Ke = b([
	"working",
	"input_required",
	"completed",
	"failed",
	"cancelled"
]), K = s({
	taskId: w(),
	status: Ke,
	ttl: a([f(), m()]),
	createdAt: w(),
	lastUpdatedAt: w(),
	pollInterval: C(f()),
	statusMessage: C(w())
}), qe = L.extend({ task: K }), Je = F.merge(K), Ye = I.extend({
	method: y("notifications/tasks/status"),
	params: Je
}), Xe = P.extend({
	method: y("tasks/get"),
	params: M.extend({ taskId: w() })
}), Ze = L.merge(K), Qe = P.extend({
	method: y("tasks/result"),
	params: M.extend({ taskId: w() })
});
L.loose();
var $e = W.extend({ method: y("tasks/list") }), et = G.extend({ tasks: x(K) }), tt = P.extend({
	method: y("tasks/cancel"),
	params: M.extend({ taskId: w() })
}), nt = L.merge(K), rt = s({
	uri: w(),
	mimeType: C(w()),
	_meta: l(w(), i()).optional()
}), it = rt.extend({ text: w() }), at = w().refine((e) => {
	try {
		return atob(e), !0;
	} catch {
		return !1;
	}
}, { message: "Invalid Base64 string" }), ot = rt.extend({ blob: at }), q = b(["user", "assistant"]), J = s({
	audience: x(q).optional(),
	priority: f().min(0).max(1).optional(),
	lastModified: E({ offset: !0 }).optional()
}), st = s({
	...H.shape,
	...V.shape,
	uri: w(),
	description: C(w()),
	mimeType: C(w()),
	size: C(f()),
	annotations: J.optional(),
	_meta: C(g({}))
}), ct = s({
	...H.shape,
	...V.shape,
	uriTemplate: w(),
	description: C(w()),
	mimeType: C(w()),
	annotations: J.optional(),
	_meta: C(g({}))
}), lt = W.extend({ method: y("resources/list") }), ut = G.extend({ resources: x(st) }), dt = W.extend({ method: y("resources/templates/list") }), ft = G.extend({ resourceTemplates: x(ct) }), pt = M.extend({ uri: w() }), mt = pt, ht = P.extend({
	method: y("resources/read"),
	params: mt
}), gt = L.extend({ contents: x(a([it, ot])) }), _t = I.extend({
	method: y("notifications/resources/list_changed"),
	params: F.optional()
}), vt = pt, yt = P.extend({
	method: y("resources/subscribe"),
	params: vt
}), bt = pt, xt = P.extend({
	method: y("resources/unsubscribe"),
	params: bt
}), St = F.extend({ uri: w() }), Ct = I.extend({
	method: y("notifications/resources/updated"),
	params: St
}), wt = s({
	name: w(),
	description: C(w()),
	required: C(u())
}), Tt = s({
	...H.shape,
	...V.shape,
	description: C(w()),
	arguments: C(x(wt)),
	_meta: C(g({}))
}), Et = W.extend({ method: y("prompts/list") }), Dt = G.extend({ prompts: x(Tt) }), Ot = M.extend({
	name: w(),
	arguments: l(w(), w()).optional()
}), kt = P.extend({
	method: y("prompts/get"),
	params: Ot
}), At = s({
	type: y("text"),
	text: w(),
	annotations: J.optional(),
	_meta: l(w(), i()).optional()
}), jt = s({
	type: y("image"),
	data: at,
	mimeType: w(),
	annotations: J.optional(),
	_meta: l(w(), i()).optional()
}), Mt = s({
	type: y("audio"),
	data: at,
	mimeType: w(),
	annotations: J.optional(),
	_meta: l(w(), i()).optional()
}), Nt = s({
	type: y("tool_use"),
	name: w(),
	id: w(),
	input: l(w(), i()),
	_meta: l(w(), i()).optional()
}), Pt = s({
	type: y("resource"),
	resource: a([it, ot]),
	annotations: J.optional(),
	_meta: l(w(), i()).optional()
}), Ft = st.extend({ type: y("resource_link") }), Y = a([
	At,
	jt,
	Mt,
	Ft,
	Pt
]), It = s({
	role: q,
	content: Y
}), Lt = L.extend({
	description: w().optional(),
	messages: x(It)
}), Rt = I.extend({
	method: y("notifications/prompts/list_changed"),
	params: F.optional()
}), zt = s({
	title: w().optional(),
	readOnlyHint: u().optional(),
	destructiveHint: u().optional(),
	idempotentHint: u().optional(),
	openWorldHint: u().optional()
}), Bt = s({ taskSupport: b([
	"required",
	"optional",
	"forbidden"
]).optional() }), Vt = s({
	...H.shape,
	...V.shape,
	description: w().optional(),
	inputSchema: s({
		type: y("object"),
		properties: l(w(), j).optional(),
		required: x(w()).optional()
	}).catchall(i()),
	outputSchema: s({
		type: y("object"),
		properties: l(w(), j).optional(),
		required: x(w()).optional()
	}).catchall(i()).optional(),
	annotations: zt.optional(),
	execution: Bt.optional(),
	_meta: l(w(), i()).optional()
}), Ht = W.extend({ method: y("tools/list") }), Ut = G.extend({ tools: x(Vt) }), X = L.extend({
	content: x(Y).default([]),
	structuredContent: l(w(), i()).optional(),
	isError: u().optional()
});
X.or(L.extend({ toolResult: i() }));
var Wt = N.extend({
	name: w(),
	arguments: l(w(), i()).optional()
}), Gt = P.extend({
	method: y("tools/call"),
	params: Wt
}), Kt = I.extend({
	method: y("notifications/tools/list_changed"),
	params: F.optional()
});
s({
	autoRefresh: u().default(!0),
	debounceMs: f().int().nonnegative().default(300)
});
var qt = b([
	"debug",
	"info",
	"notice",
	"warning",
	"error",
	"critical",
	"alert",
	"emergency"
]), Jt = M.extend({ level: qt }), Yt = P.extend({
	method: y("logging/setLevel"),
	params: Jt
}), Xt = F.extend({
	level: qt,
	logger: w().optional(),
	data: i()
}), Zt = I.extend({
	method: y("notifications/message"),
	params: Xt
}), Qt = s({ name: w().optional() }), $t = s({
	hints: x(Qt).optional(),
	costPriority: f().min(0).max(1).optional(),
	speedPriority: f().min(0).max(1).optional(),
	intelligencePriority: f().min(0).max(1).optional()
}), en = s({ mode: b([
	"auto",
	"required",
	"none"
]).optional() }), tn = s({
	type: y("tool_result"),
	toolUseId: w().describe("The unique identifier for the corresponding tool call."),
	content: x(Y).default([]),
	structuredContent: s({}).loose().optional(),
	isError: u().optional(),
	_meta: l(w(), i()).optional()
}), nn = S("type", [
	At,
	jt,
	Mt
]), rn = S("type", [
	At,
	jt,
	Mt,
	Nt,
	tn
]), an = s({
	role: q,
	content: a([rn, x(rn)]),
	_meta: l(w(), i()).optional()
}), on = N.extend({
	messages: x(an),
	modelPreferences: $t.optional(),
	systemPrompt: w().optional(),
	includeContext: b([
		"none",
		"thisServer",
		"allServers"
	]).optional(),
	temperature: f().optional(),
	maxTokens: f().int(),
	stopSequences: x(w()).optional(),
	metadata: j.optional(),
	tools: x(Vt).optional(),
	toolChoice: en.optional()
}), sn = P.extend({
	method: y("sampling/createMessage"),
	params: on
}), cn = L.extend({
	model: w(),
	stopReason: C(b([
		"endTurn",
		"stopSequence",
		"maxTokens"
	]).or(w())),
	role: q,
	content: nn
}), ln = L.extend({
	model: w(),
	stopReason: C(b([
		"endTurn",
		"stopSequence",
		"maxTokens",
		"toolUse"
	]).or(w())),
	role: q,
	content: a([rn, x(rn)])
}), un = s({
	type: y("boolean"),
	title: w().optional(),
	description: w().optional(),
	default: u().optional()
}), dn = s({
	type: y("string"),
	title: w().optional(),
	description: w().optional(),
	minLength: f().optional(),
	maxLength: f().optional(),
	format: b([
		"email",
		"uri",
		"date",
		"date-time"
	]).optional(),
	default: w().optional()
}), fn = s({
	type: b(["number", "integer"]),
	title: w().optional(),
	description: w().optional(),
	minimum: f().optional(),
	maximum: f().optional(),
	default: f().optional()
}), pn = s({
	type: y("string"),
	title: w().optional(),
	description: w().optional(),
	enum: x(w()),
	default: w().optional()
}), mn = s({
	type: y("string"),
	title: w().optional(),
	description: w().optional(),
	oneOf: x(s({
		const: w(),
		title: w()
	})),
	default: w().optional()
}), hn = s({
	type: y("string"),
	title: w().optional(),
	description: w().optional(),
	enum: x(w()),
	enumNames: x(w()).optional(),
	default: w().optional()
}), gn = a([pn, mn]), _n = s({
	type: y("array"),
	title: w().optional(),
	description: w().optional(),
	minItems: f().optional(),
	maxItems: f().optional(),
	items: s({
		type: y("string"),
		enum: x(w())
	}),
	default: x(w()).optional()
}), vn = s({
	type: y("array"),
	title: w().optional(),
	description: w().optional(),
	minItems: f().optional(),
	maxItems: f().optional(),
	items: s({ anyOf: x(s({
		const: w(),
		title: w()
	})) }),
	default: x(w()).optional()
}), yn = a([_n, vn]), bn = a([
	hn,
	gn,
	yn
]), xn = a([
	bn,
	un,
	dn,
	fn
]), Sn = N.extend({
	mode: y("form").optional(),
	message: w(),
	requestedSchema: s({
		type: y("object"),
		properties: l(w(), xn),
		required: x(w()).optional()
	})
}), Cn = N.extend({
	mode: y("url"),
	message: w(),
	elicitationId: w(),
	url: w().url()
}), wn = a([Sn, Cn]), Tn = P.extend({
	method: y("elicitation/create"),
	params: wn
}), En = F.extend({ elicitationId: w() }), Dn = I.extend({
	method: y("notifications/elicitation/complete"),
	params: En
}), On = L.extend({
	action: b([
		"accept",
		"decline",
		"cancel"
	]),
	content: T((e) => e === null ? void 0 : e, l(w(), a([
		w(),
		f(),
		u(),
		x(w())
	])).optional())
}), kn = s({
	type: y("ref/resource"),
	uri: w()
}), An = s({
	type: y("ref/prompt"),
	name: w()
}), jn = M.extend({
	ref: a([An, kn]),
	argument: s({
		name: w(),
		value: w()
	}),
	context: s({ arguments: l(w(), w()).optional() }).optional()
}), Mn = P.extend({
	method: y("completion/complete"),
	params: jn
}), Nn = L.extend({ completion: g({
	values: x(w()).max(100),
	total: C(f().int()),
	hasMore: C(u())
}) }), Pn = s({
	uri: w().startsWith("file://"),
	name: w().optional(),
	_meta: l(w(), i()).optional()
}), Fn = P.extend({
	method: y("roots/list"),
	params: M.optional()
}), In = L.extend({ roots: x(Pn) }), Ln = I.extend({
	method: y("notifications/roots/list_changed"),
	params: F.optional()
});
a([
	Ve,
	Le,
	Mn,
	Yt,
	kt,
	Et,
	lt,
	dt,
	ht,
	yt,
	xt,
	Gt,
	Ht,
	Xe,
	Qe,
	$e,
	tt
]), a([
	ke,
	We,
	Be,
	Ln,
	Ye
]), a([
	De,
	cn,
	ln,
	On,
	In,
	Ze,
	et,
	qe
]), a([
	Ve,
	sn,
	Tn,
	Fn,
	Xe,
	Qe,
	$e,
	tt
]), a([
	ke,
	We,
	Zt,
	Ct,
	_t,
	Kt,
	Rt,
	Ye,
	Dn
]), a([
	De,
	ze,
	Nn,
	Lt,
	Dt,
	ut,
	ft,
	gt,
	X,
	Ut,
	Ze,
	et,
	qe
]);
var Z = class e extends Error {
	constructor(e, t, n) {
		super(`MCP error ${e}: ${t}`), this.code = e, this.data = n, this.name = "McpError";
	}
	static fromError(t, n, r) {
		if (t === B.UrlElicitationRequired && r) {
			let e = r;
			if (e.elicitations) return new Rn(e.elicitations, n);
		}
		return new e(t, n, r);
	}
}, Rn = class extends Z {
	constructor(e, t = `URL elicitation${e.length > 1 ? "s" : ""} required`) {
		super(B.UrlElicitationRequired, t, { elicitations: e });
	}
	get elicitations() {
		return this.data?.elicitations ?? [];
	}
};
// node_modules/@modelcontextprotocol/sdk/dist/esm/server/zod-compat.js
function zn(e) {
	return !!e._zod;
}
function Bn(e, t) {
	return zn(e) ? o(e, t) : e.safeParse(t);
}
function Vn(e) {
	if (!e) return;
	let t;
	if (t = zn(e) ? e._zod?.def?.shape : e.shape, t) {
		if (typeof t == "function") try {
			return t();
		} catch {
			return;
		}
		return t;
	}
}
function Hn(e) {
	if (zn(e)) {
		let t = e._zod?.def;
		if (t) {
			if (t.value !== void 0) return t.value;
			if (Array.isArray(t.values) && t.values.length > 0) return t.values[0];
		}
	}
	let t = e._def;
	if (t) {
		if (t.value !== void 0) return t.value;
		if (Array.isArray(t.values) && t.values.length > 0) return t.values[0];
	}
	let n = e.value;
	if (n !== void 0) return n;
}
// node_modules/@modelcontextprotocol/sdk/dist/esm/experimental/tasks/interfaces.js
function Q(e) {
	return e === "completed" || e === "failed" || e === "cancelled";
}
// node_modules/@modelcontextprotocol/sdk/dist/esm/server/zod-json-schema-compat.js
function Un(e) {
	let t = Vn(e)?.method;
	if (!t) throw Error("Schema is missing a method literal");
	let n = Hn(t);
	if (typeof n != "string") throw Error("Schema method literal must be a string");
	return n;
}
function Wn(e, t) {
	let n = Bn(e, t);
	if (!n.success) throw n.error;
	return n.data;
}
var Gn = class {
	constructor(e) {
		this._options = e, this._requestMessageId = 0, this._requestHandlers = /* @__PURE__ */ new Map(), this._requestHandlerAbortControllers = /* @__PURE__ */ new Map(), this._notificationHandlers = /* @__PURE__ */ new Map(), this._responseHandlers = /* @__PURE__ */ new Map(), this._progressHandlers = /* @__PURE__ */ new Map(), this._timeoutInfo = /* @__PURE__ */ new Map(), this._pendingDebouncedNotifications = /* @__PURE__ */ new Set(), this._taskProgressTokens = /* @__PURE__ */ new Map(), this._requestResolvers = /* @__PURE__ */ new Map(), this.setNotificationHandler(ke, (e) => {
			this._oncancel(e);
		}), this.setNotificationHandler(We, (e) => {
			this._onprogress(e);
		}), this.setRequestHandler(Ve, (e) => ({})), this._taskStore = e?.taskStore, this._taskMessageQueue = e?.taskMessageQueue, this._taskStore && (this.setRequestHandler(Xe, async (e, t) => {
			let n = await this._taskStore.getTask(e.params.taskId, t.sessionId);
			if (!n) throw new Z(B.InvalidParams, "Failed to retrieve task: Task not found");
			return { ...n };
		}), this.setRequestHandler(Qe, async (e, t) => {
			let n = async () => {
				let r = e.params.taskId;
				if (!await this._taskStore.getTask(r, t.sessionId)) throw new Z(B.InvalidParams, `Task not found: ${r}`);
				if (this._taskMessageQueue) {
					let e;
					for (; e = await this._taskMessageQueue.dequeue(r, t.sessionId);) if (e.type === "response" || e.type === "error") {
						let t = e.message, n = t.id, r = this._requestResolvers.get(n);
						if (r) {
							if (this._requestResolvers.delete(n), e.type === "response") r(t);
							else {
								let e = t;
								r(new Z(e.error.code, e.error.message, e.error.data));
							}
						} else {
							let t = e.type === "response" ? "Response" : "Error";
							this._onerror(/* @__PURE__ */ Error(`${t} handler missing for request ${n}`));
						}
					} else await this._transport?.send(e.message, { relatedRequestId: t.requestId });
				}
				let i = await this._taskStore.getTask(r, t.sessionId);
				if (!i) throw new Z(B.InvalidParams, `Task not found: ${r}`);
				if (!Q(i.status)) return await this._waitForTaskUpdate(r, t.signal, t.sessionId), await n();
				if (Q(i.status)) {
					let e = await this._taskStore.getTaskResult(r, t.sessionId);
					return this._clearTaskQueue(r, t.sessionId), {
						...e,
						_meta: {
							...e._meta,
							[A]: { taskId: r }
						}
					};
				}
				return await n();
			};
			return await n();
		}), this.setRequestHandler($e, async (e, t) => {
			try {
				let { tasks: n, nextCursor: r } = await this._taskStore.listTasks(e.params?.cursor, t.sessionId);
				return {
					tasks: n,
					nextCursor: r,
					_meta: {}
				};
			} catch (e) {
				throw new Z(B.InvalidParams, `Failed to list tasks: ${e instanceof Error ? e.message : String(e)}`);
			}
		}), this.setRequestHandler(tt, async (e, t) => {
			try {
				let n = await this._taskStore.getTask(e.params.taskId, t.sessionId);
				if (!n) throw new Z(B.InvalidParams, `Task not found: ${e.params.taskId}`);
				if (Q(n.status)) throw new Z(B.InvalidParams, `Cannot cancel task in terminal status: ${n.status}`);
				await this._taskStore.updateTaskStatus(e.params.taskId, "cancelled", "Client cancelled task execution.", t.sessionId), this._clearTaskQueue(e.params.taskId, t.sessionId);
				let r = await this._taskStore.getTask(e.params.taskId, t.sessionId);
				if (!r) throw new Z(B.InvalidParams, `Task not found after cancellation: ${e.params.taskId}`);
				return {
					_meta: {},
					...r
				};
			} catch (e) {
				throw e instanceof Z ? e : new Z(B.InvalidRequest, `Failed to cancel task: ${e instanceof Error ? e.message : String(e)}`);
			}
		}));
	}
	async _oncancel(e) {
		e.params.requestId && this._requestHandlerAbortControllers.get(e.params.requestId)?.abort(e.params.reason);
	}
	_setupTimeout(e, t, n, r, i = !1) {
		this._timeoutInfo.set(e, {
			timeoutId: setTimeout(r, t),
			startTime: Date.now(),
			timeout: t,
			maxTotalTimeout: n,
			resetTimeoutOnProgress: i,
			onTimeout: r
		});
	}
	_resetTimeout(e) {
		let t = this._timeoutInfo.get(e);
		if (!t) return !1;
		let n = Date.now() - t.startTime;
		if (t.maxTotalTimeout && n >= t.maxTotalTimeout) throw this._timeoutInfo.delete(e), Z.fromError(B.RequestTimeout, "Maximum total timeout exceeded", {
			maxTotalTimeout: t.maxTotalTimeout,
			totalElapsed: n
		});
		return clearTimeout(t.timeoutId), t.timeoutId = setTimeout(t.onTimeout, t.timeout), !0;
	}
	_cleanupTimeout(e) {
		let t = this._timeoutInfo.get(e);
		t && (clearTimeout(t.timeoutId), this._timeoutInfo.delete(e));
	}
	async connect(e) {
		if (this._transport) throw Error("Already connected to a transport. Call close() before connecting to a new transport, or use a separate Protocol instance per connection.");
		this._transport = e;
		let t = this.transport?.onclose;
		this._transport.onclose = () => {
			t?.(), this._onclose();
		};
		let n = this.transport?.onerror;
		this._transport.onerror = (e) => {
			n?.(e), this._onerror(e);
		};
		let r = this._transport?.onmessage;
		this._transport.onmessage = (e, t) => {
			r?.(e, t), z(e) || Te(e) ? this._onresponse(e) : be(e) ? this._onrequest(e, t) : Se(e) ? this._onnotification(e) : this._onerror(/* @__PURE__ */ Error(`Unknown message type: ${JSON.stringify(e)}`));
		}, await this._transport.start();
	}
	_onclose() {
		let e = this._responseHandlers;
		this._responseHandlers = /* @__PURE__ */ new Map(), this._progressHandlers.clear(), this._taskProgressTokens.clear(), this._pendingDebouncedNotifications.clear();
		for (let e of this._timeoutInfo.values()) clearTimeout(e.timeoutId);
		this._timeoutInfo.clear();
		for (let e of this._requestHandlerAbortControllers.values()) e.abort();
		this._requestHandlerAbortControllers.clear();
		let t = Z.fromError(B.ConnectionClosed, "Connection closed");
		this._transport = void 0, this.onclose?.();
		for (let n of e.values()) n(t);
	}
	_onerror(e) {
		this.onerror?.(e);
	}
	_onnotification(e) {
		let t = this._notificationHandlers.get(e.method) ?? this.fallbackNotificationHandler;
		t !== void 0 && Promise.resolve().then(() => t(e)).catch((e) => this._onerror(/* @__PURE__ */ Error(`Uncaught error in notification handler: ${e}`)));
	}
	_onrequest(e, t) {
		let n = this._requestHandlers.get(e.method) ?? this.fallbackRequestHandler, r = this._transport, i = e.params?._meta?.[A]?.taskId, a = r?.sessionId, o = this._taskStore, s = !0, c;
		if (i && o && this._taskMessageQueue && a !== void 0 && (s = !1, c = (async () => {
			if (!await o.getTask(i, a)) throw new Z(B.InvalidParams, `Task not found: ${i}`);
			s = !0;
		})()), n === void 0) {
			let t = {
				jsonrpc: "2.0",
				id: e.id,
				error: {
					code: B.MethodNotFound,
					message: "Method not found"
				}
			};
			if (i && c) {
				let e = {
					type: "error",
					message: t,
					timestamp: Date.now()
				};
				c.then(() => this._enqueueTaskMessage(i, e, a), () => r?.send(t)).catch((e) => this._onerror(/* @__PURE__ */ Error(`Failed to send an error response: ${e}`)));
			} else i && this._taskMessageQueue ? this._enqueueTaskMessage(i, {
				type: "error",
				message: t,
				timestamp: Date.now()
			}, r?.sessionId).catch((e) => this._onerror(/* @__PURE__ */ Error(`Failed to enqueue error response: ${e}`))) : r?.send(t).catch((e) => this._onerror(/* @__PURE__ */ Error(`Failed to send an error response: ${e}`)));
			return;
		}
		let l = new AbortController();
		this._requestHandlerAbortControllers.set(e.id, l);
		let u = ve(e.params) ? e.params.task : void 0, d = this._taskStore ? this.requestTaskStore(e, r?.sessionId) : void 0, f = {
			signal: l.signal,
			sessionId: r?.sessionId,
			_meta: e.params?._meta,
			sendNotification: async (t) => {
				if (l.signal.aborted) return;
				let n = { relatedRequestId: e.id };
				i && (n.relatedTask = { taskId: i }), await this.notification(t, n);
			},
			sendRequest: async (t, n, r) => {
				if (l.signal.aborted) throw new Z(B.ConnectionClosed, "Request was cancelled");
				let a = {
					...r,
					relatedRequestId: e.id
				};
				i && !a.relatedTask && (a.relatedTask = { taskId: i });
				let o = a.relatedTask?.taskId ?? i;
				return o && d && await d.updateTaskStatus(o, "input_required"), await this.request(t, n, a);
			},
			authInfo: t?.authInfo,
			requestId: e.id,
			requestInfo: t?.requestInfo,
			taskId: i,
			taskStore: d,
			taskRequestedTtl: u?.ttl,
			closeSSEStream: t?.closeSSEStream,
			closeStandaloneSSEStream: t?.closeStandaloneSSEStream
		};
		(c ?? Promise.resolve()).then(() => {
			if (c && l.signal.aborted) throw new Z(B.ConnectionClosed, "Request was cancelled");
			u && this.assertTaskHandlerCapability(e.method);
		}).then(() => n(e, f)).then(async (t) => {
			if (l.signal.aborted) return;
			let n = {
				result: t,
				jsonrpc: "2.0",
				id: e.id
			};
			i && this._taskMessageQueue ? await this._enqueueTaskMessage(i, {
				type: "response",
				message: n,
				timestamp: Date.now()
			}, r?.sessionId) : await r?.send(n);
		}, async (t) => {
			if (l.signal.aborted) return;
			let n = {
				jsonrpc: "2.0",
				id: e.id,
				error: {
					code: Number.isSafeInteger(t.code) ? t.code : B.InternalError,
					message: t.message ?? "Internal error",
					...t.data !== void 0 && { data: t.data }
				}
			};
			i && this._taskMessageQueue && s ? await this._enqueueTaskMessage(i, {
				type: "error",
				message: n,
				timestamp: Date.now()
			}, r?.sessionId) : await r?.send(n);
		}).catch((e) => this._onerror(/* @__PURE__ */ Error(`Failed to send response: ${e}`))).finally(() => {
			this._requestHandlerAbortControllers.get(e.id) === l && this._requestHandlerAbortControllers.delete(e.id);
		});
	}
	_onprogress(e) {
		let { progressToken: t, ...n } = e.params, r = Number(t), i = this._progressHandlers.get(r);
		if (!i) {
			this._onerror(/* @__PURE__ */ Error(`Received a progress notification for an unknown token: ${JSON.stringify(e)}`));
			return;
		}
		let a = this._responseHandlers.get(r), o = this._timeoutInfo.get(r);
		if (o && a && o.resetTimeoutOnProgress) try {
			this._resetTimeout(r);
		} catch (e) {
			this._responseHandlers.delete(r), this._progressHandlers.delete(r), this._cleanupTimeout(r), a(e);
			return;
		}
		i(n);
	}
	_onresponse(e) {
		let t = Number(e.id), n = this._requestResolvers.get(t);
		if (n) {
			this._requestResolvers.delete(t), z(e) ? n(e) : n(new Z(e.error.code, e.error.message, e.error.data));
			return;
		}
		let r = this._responseHandlers.get(t);
		if (r === void 0) {
			this._onerror(/* @__PURE__ */ Error(`Received a response for an unknown message ID: ${JSON.stringify(e)}`));
			return;
		}
		this._responseHandlers.delete(t), this._cleanupTimeout(t);
		let i = !1;
		if (z(e) && e.result && typeof e.result == "object") {
			let n = e.result;
			if (n.task && typeof n.task == "object") {
				let e = n.task;
				typeof e.taskId == "string" && (i = !0, this._taskProgressTokens.set(e.taskId, t));
			}
		}
		i || this._progressHandlers.delete(t), z(e) ? r(e) : r(Z.fromError(e.error.code, e.error.message, e.error.data));
	}
	get transport() {
		return this._transport;
	}
	async close() {
		await this._transport?.close();
	}
	async *requestStream(e, t, n) {
		let { task: r } = n ?? {};
		if (!r) {
			try {
				yield {
					type: "result",
					result: await this.request(e, t, n)
				};
			} catch (e) {
				yield {
					type: "error",
					error: e instanceof Z ? e : new Z(B.InternalError, String(e))
				};
			}
			return;
		}
		let i;
		try {
			let r = await this.request(e, qe, n);
			if (r.task) i = r.task.taskId, yield {
				type: "taskCreated",
				task: r.task
			};
			else throw new Z(B.InternalError, "Task creation did not return a task");
			for (;;) {
				let e = await this.getTask({ taskId: i }, n);
				if (yield {
					type: "taskStatus",
					task: e
				}, Q(e.status)) {
					e.status === "completed" ? yield {
						type: "result",
						result: await this.getTaskResult({ taskId: i }, t, n)
					} : e.status === "failed" ? yield {
						type: "error",
						error: new Z(B.InternalError, `Task ${i} failed`)
					} : e.status === "cancelled" && (yield {
						type: "error",
						error: new Z(B.InternalError, `Task ${i} was cancelled`)
					});
					return;
				}
				if (e.status === "input_required") {
					yield {
						type: "result",
						result: await this.getTaskResult({ taskId: i }, t, n)
					};
					return;
				}
				let r = e.pollInterval ?? this._options?.defaultTaskPollInterval ?? 1e3;
				await new Promise((e) => setTimeout(e, r)), n?.signal?.throwIfAborted();
			}
		} catch (e) {
			yield {
				type: "error",
				error: e instanceof Z ? e : new Z(B.InternalError, String(e))
			};
		}
	}
	request(e, t, n) {
		let { relatedRequestId: r, resumptionToken: i, onresumptiontoken: a, task: o, relatedTask: s } = n ?? {};
		return new Promise((c, l) => {
			let u = (e) => {
				l(e);
			};
			if (!this._transport) {
				u(/* @__PURE__ */ Error("Not connected"));
				return;
			}
			if (this._options?.enforceStrictCapabilities === !0) try {
				this.assertCapabilityForMethod(e.method), o && this.assertTaskCapability(e.method);
			} catch (e) {
				u(e);
				return;
			}
			n?.signal?.throwIfAborted();
			let d = this._requestMessageId++, f = {
				...e,
				jsonrpc: "2.0",
				id: d
			};
			n?.onprogress && (this._progressHandlers.set(d, n.onprogress), f.params = {
				...e.params,
				_meta: {
					...e.params?._meta || {},
					progressToken: d
				}
			}), o && (f.params = {
				...f.params,
				task: o
			}), s && (f.params = {
				...f.params,
				_meta: {
					...f.params?._meta || {},
					[A]: s
				}
			});
			let p = (e) => {
				this._responseHandlers.delete(d), this._progressHandlers.delete(d), this._cleanupTimeout(d), this._transport?.send({
					jsonrpc: "2.0",
					method: "notifications/cancelled",
					params: {
						requestId: d,
						reason: String(e)
					}
				}, {
					relatedRequestId: r,
					resumptionToken: i,
					onresumptiontoken: a
				}).catch((e) => this._onerror(/* @__PURE__ */ Error(`Failed to send cancellation: ${e}`))), l(e instanceof Z ? e : new Z(B.RequestTimeout, String(e)));
			};
			this._responseHandlers.set(d, (e) => {
				if (!n?.signal?.aborted) {
					if (e instanceof Error) return l(e);
					try {
						let n = Bn(t, e.result);
						n.success ? c(n.data) : l(n.error);
					} catch (e) {
						l(e);
					}
				}
			}), n?.signal?.addEventListener("abort", () => {
				p(n?.signal?.reason);
			});
			let m = n?.timeout ?? 6e4;
			this._setupTimeout(d, m, n?.maxTotalTimeout, () => p(Z.fromError(B.RequestTimeout, "Request timed out", { timeout: m })), n?.resetTimeoutOnProgress ?? !1);
			let h = s?.taskId;
			h ? (this._requestResolvers.set(d, (e) => {
				let t = this._responseHandlers.get(d);
				t ? t(e) : this._onerror(/* @__PURE__ */ Error(`Response handler missing for side-channeled request ${d}`));
			}), this._enqueueTaskMessage(h, {
				type: "request",
				message: f,
				timestamp: Date.now()
			}).catch((e) => {
				this._cleanupTimeout(d), l(e);
			})) : this._transport.send(f, {
				relatedRequestId: r,
				resumptionToken: i,
				onresumptiontoken: a
			}).catch((e) => {
				this._cleanupTimeout(d), l(e);
			});
		});
	}
	async getTask(e, t) {
		return this.request({
			method: "tasks/get",
			params: e
		}, Ze, t);
	}
	async getTaskResult(e, t, n) {
		return this.request({
			method: "tasks/result",
			params: e
		}, t, n);
	}
	async listTasks(e, t) {
		return this.request({
			method: "tasks/list",
			params: e
		}, et, t);
	}
	async cancelTask(e, t) {
		return this.request({
			method: "tasks/cancel",
			params: e
		}, nt, t);
	}
	async notification(e, t) {
		if (!this._transport) throw Error("Not connected");
		this.assertNotificationCapability(e.method);
		let n = t?.relatedTask?.taskId;
		if (n) {
			let r = {
				...e,
				jsonrpc: "2.0",
				params: {
					...e.params,
					_meta: {
						...e.params?._meta || {},
						[A]: t.relatedTask
					}
				}
			};
			await this._enqueueTaskMessage(n, {
				type: "notification",
				message: r,
				timestamp: Date.now()
			});
			return;
		}
		if ((this._options?.debouncedNotificationMethods ?? []).includes(e.method) && !e.params && !t?.relatedRequestId && !t?.relatedTask) {
			if (this._pendingDebouncedNotifications.has(e.method)) return;
			this._pendingDebouncedNotifications.add(e.method), Promise.resolve().then(() => {
				if (this._pendingDebouncedNotifications.delete(e.method), !this._transport) return;
				let n = {
					...e,
					jsonrpc: "2.0"
				};
				t?.relatedTask && (n = {
					...n,
					params: {
						...n.params,
						_meta: {
							...n.params?._meta || {},
							[A]: t.relatedTask
						}
					}
				}), this._transport?.send(n, t).catch((e) => this._onerror(e));
			});
			return;
		}
		let r = {
			...e,
			jsonrpc: "2.0"
		};
		t?.relatedTask && (r = {
			...r,
			params: {
				...r.params,
				_meta: {
					...r.params?._meta || {},
					[A]: t.relatedTask
				}
			}
		}), await this._transport.send(r, t);
	}
	setRequestHandler(e, t) {
		let n = Un(e);
		this.assertRequestHandlerCapability(n), this._requestHandlers.set(n, (n, r) => {
			let i = Wn(e, n);
			return Promise.resolve(t(i, r));
		});
	}
	removeRequestHandler(e) {
		this._requestHandlers.delete(e);
	}
	assertCanSetRequestHandler(e) {
		if (this._requestHandlers.has(e)) throw Error(`A request handler for ${e} already exists, which would be overridden`);
	}
	setNotificationHandler(e, t) {
		let n = Un(e);
		this._notificationHandlers.set(n, (n) => {
			let r = Wn(e, n);
			return Promise.resolve(t(r));
		});
	}
	removeNotificationHandler(e) {
		this._notificationHandlers.delete(e);
	}
	_cleanupTaskProgressHandler(e) {
		let t = this._taskProgressTokens.get(e);
		t !== void 0 && (this._progressHandlers.delete(t), this._taskProgressTokens.delete(e));
	}
	async _enqueueTaskMessage(e, t, n) {
		if (!this._taskStore || !this._taskMessageQueue) throw Error("Cannot enqueue task message: taskStore and taskMessageQueue are not configured");
		let r = this._options?.maxTaskQueueSize;
		await this._taskMessageQueue.enqueue(e, t, n ?? this._transport?.sessionId, r);
	}
	async _clearTaskQueue(e, t) {
		if (this._taskMessageQueue) {
			let n = await this._taskMessageQueue.dequeueAll(e, t);
			for (let t of n) if (t.type === "request" && be(t.message)) {
				let n = t.message.id, r = this._requestResolvers.get(n);
				r ? (r(new Z(B.InternalError, "Task cancelled or completed")), this._requestResolvers.delete(n)) : this._onerror(/* @__PURE__ */ Error(`Resolver missing for request ${n} during task ${e} cleanup`));
			}
		}
	}
	async _waitForTaskUpdate(e, t, n) {
		let r = this._options?.defaultTaskPollInterval ?? 1e3;
		try {
			let t = await this._taskStore?.getTask(e, n);
			t?.pollInterval && (r = t.pollInterval);
		} catch {}
		return new Promise((e, n) => {
			if (t.aborted) {
				n(new Z(B.InvalidRequest, "Request cancelled"));
				return;
			}
			let i = setTimeout(e, r);
			t.addEventListener("abort", () => {
				clearTimeout(i), n(new Z(B.InvalidRequest, "Request cancelled"));
			}, { once: !0 });
		});
	}
	requestTaskStore(e, t) {
		let n = this._taskStore;
		if (!n) throw Error("No task store configured");
		return {
			createTask: async (r) => {
				if (!e) throw Error("No request provided");
				return await n.createTask(r, e.id, {
					method: e.method,
					params: e.params
				}, t);
			},
			getTask: async (e) => {
				let r = await n.getTask(e, t);
				if (!r) throw new Z(B.InvalidParams, "Failed to retrieve task: Task not found");
				return r;
			},
			storeTaskResult: async (e, r, i) => {
				await n.storeTaskResult(e, r, i, t);
				let a = await n.getTask(e, t);
				if (a) {
					let t = Ye.parse({
						method: "notifications/tasks/status",
						params: a
					});
					await this.notification(t), Q(a.status) && this._cleanupTaskProgressHandler(e);
				}
			},
			getTaskResult: (e) => n.getTaskResult(e, t),
			updateTaskStatus: async (e, r, i) => {
				let a = await n.getTask(e, t);
				if (!a) throw new Z(B.InvalidParams, `Task "${e}" not found - it may have been cleaned up`);
				if (Q(a.status)) throw new Z(B.InvalidParams, `Cannot update task "${e}" from terminal status "${a.status}" to "${r}". Terminal states (completed, failed, cancelled) cannot transition to other states.`);
				await n.updateTaskStatus(e, r, i, t);
				let o = await n.getTask(e, t);
				if (o) {
					let t = Ye.parse({
						method: "notifications/tasks/status",
						params: o
					});
					await this.notification(t), Q(o.status) && this._cleanupTaskProgressHandler(e);
				}
			},
			listTasks: (e) => n.listTasks(e, t)
		};
	}
};
// node_modules/@modelcontextprotocol/ext-apps/dist/src/app-bridge.js
((t) => typeof e < "u" ? e : typeof Proxy < "u" ? new Proxy(t, { get: (t, n) => (typeof e < "u" ? e : t)[n] }) : t)(function(t) {
	if (typeof e < "u") return e.apply(this, arguments);
	throw Error("Dynamic require of \"" + t + "\" is not supported");
});
var Kn = class extends Gn {
	_registeredMethods = /* @__PURE__ */ new Set();
	_eventSlots = /* @__PURE__ */ new Map();
	onEventDispatch(e, t) {}
	_ensureEventSlot(e) {
		let t = this._eventSlots.get(e);
		if (!t) {
			let n = this.eventSchemas[e];
			if (!n) throw Error(`Unknown event: ${String(e)}`);
			t = { listeners: [] }, this._eventSlots.set(e, t);
			let r = n.shape.method.value;
			this._registeredMethods.add(r);
			let i = t;
			super.setNotificationHandler(n, (t) => {
				let n = t.params;
				this.onEventDispatch(e, n), i.onHandler?.(n);
				for (let e of [...i.listeners]) e(n);
			});
		}
		return t;
	}
	setEventHandler(e, t) {
		let n = this._ensureEventSlot(e);
		n.onHandler && t && console.warn(`[MCP Apps] on${String(e)} handler replaced. Use addEventListener("${String(e)}", …) to add multiple listeners without replacing.`), n.onHandler = t;
	}
	getEventHandler(e) {
		return this._eventSlots.get(e)?.onHandler;
	}
	addEventListener(e, t) {
		this._ensureEventSlot(e).listeners.push(t);
	}
	removeEventListener(e, t) {
		let n = this._eventSlots.get(e);
		if (!n) return;
		let r = n.listeners.indexOf(t);
		r !== -1 && n.listeners.splice(r, 1);
	}
	setRequestHandler = (e, t) => {
		this._assertMethodNotRegistered(e, "setRequestHandler"), super.setRequestHandler(e, t);
	};
	setNotificationHandler = (e, t) => {
		this._assertMethodNotRegistered(e, "setNotificationHandler"), super.setNotificationHandler(e, t);
	};
	warnIfRequestHandlerReplaced(e, t, n) {
		t && n && console.warn(`[MCP Apps] ${e} handler replaced. Previous handler will no longer be called.`);
	}
	replaceRequestHandler = (e, t) => {
		let n = e.shape.method.value;
		this._registeredMethods.add(n), super.setRequestHandler(e, t);
	};
	_assertMethodNotRegistered(e, t) {
		let n = e.shape.method.value;
		if (this._registeredMethods.has(n)) throw Error(`Handler for "${n}" already registered (via ${t}). Use addEventListener() to attach multiple listeners, or the on* setter for replace semantics.`);
		this._registeredMethods.add(n);
	}
}, qn = "2026-01-26", Jn = a([y("light"), y("dark")]).describe("Color theme preference for the host environment."), $ = a([
	y("inline"),
	y("fullscreen"),
	y("pip")
]).describe("Display mode for UI presentation."), Yn = a([
	y("--color-background-primary"),
	y("--color-background-secondary"),
	y("--color-background-tertiary"),
	y("--color-background-inverse"),
	y("--color-background-ghost"),
	y("--color-background-info"),
	y("--color-background-danger"),
	y("--color-background-success"),
	y("--color-background-warning"),
	y("--color-background-disabled"),
	y("--color-text-primary"),
	y("--color-text-secondary"),
	y("--color-text-tertiary"),
	y("--color-text-inverse"),
	y("--color-text-ghost"),
	y("--color-text-info"),
	y("--color-text-danger"),
	y("--color-text-success"),
	y("--color-text-warning"),
	y("--color-text-disabled"),
	y("--color-border-primary"),
	y("--color-border-secondary"),
	y("--color-border-tertiary"),
	y("--color-border-inverse"),
	y("--color-border-ghost"),
	y("--color-border-info"),
	y("--color-border-danger"),
	y("--color-border-success"),
	y("--color-border-warning"),
	y("--color-border-disabled"),
	y("--color-ring-primary"),
	y("--color-ring-secondary"),
	y("--color-ring-inverse"),
	y("--color-ring-info"),
	y("--color-ring-danger"),
	y("--color-ring-success"),
	y("--color-ring-warning"),
	y("--font-sans"),
	y("--font-mono"),
	y("--font-weight-normal"),
	y("--font-weight-medium"),
	y("--font-weight-semibold"),
	y("--font-weight-bold"),
	y("--font-text-xs-size"),
	y("--font-text-sm-size"),
	y("--font-text-md-size"),
	y("--font-text-lg-size"),
	y("--font-heading-xs-size"),
	y("--font-heading-sm-size"),
	y("--font-heading-md-size"),
	y("--font-heading-lg-size"),
	y("--font-heading-xl-size"),
	y("--font-heading-2xl-size"),
	y("--font-heading-3xl-size"),
	y("--font-text-xs-line-height"),
	y("--font-text-sm-line-height"),
	y("--font-text-md-line-height"),
	y("--font-text-lg-line-height"),
	y("--font-heading-xs-line-height"),
	y("--font-heading-sm-line-height"),
	y("--font-heading-md-line-height"),
	y("--font-heading-lg-line-height"),
	y("--font-heading-xl-line-height"),
	y("--font-heading-2xl-line-height"),
	y("--font-heading-3xl-line-height"),
	y("--border-radius-xs"),
	y("--border-radius-sm"),
	y("--border-radius-md"),
	y("--border-radius-lg"),
	y("--border-radius-xl"),
	y("--border-radius-full"),
	y("--border-width-regular"),
	y("--shadow-hairline"),
	y("--shadow-sm"),
	y("--shadow-md"),
	y("--shadow-lg")
]).describe("CSS variable keys available to MCP apps for theming."), Xn = l(Yn.describe("Style variables for theming MCP apps.\n\nIndividual style keys are optional - hosts may provide any subset of these values.\nValues are strings containing CSS values (colors, sizes, font stacks, etc.).\n\nNote: This type uses `Record<K, string | undefined>` rather than `Partial<Record<K, string>>`\nfor compatibility with Zod schema generation. Both are functionally equivalent for validation."), a([w(), c()]).describe("Style variables for theming MCP apps.\n\nIndividual style keys are optional - hosts may provide any subset of these values.\nValues are strings containing CSS values (colors, sizes, font stacks, etc.).\n\nNote: This type uses `Record<K, string | undefined>` rather than `Partial<Record<K, string>>`\nfor compatibility with Zod schema generation. Both are functionally equivalent for validation.")).describe("Style variables for theming MCP apps.\n\nIndividual style keys are optional - hosts may provide any subset of these values.\nValues are strings containing CSS values (colors, sizes, font stacks, etc.).\n\nNote: This type uses `Record<K, string | undefined>` rather than `Partial<Record<K, string>>`\nfor compatibility with Zod schema generation. Both are functionally equivalent for validation."), Zn = s({
	method: y("ui/open-link"),
	params: s({ url: w().describe("URL to open in the host's browser") })
});
s({ isError: u().optional().describe("True if the host failed to open the URL (e.g., due to security policy).") }).passthrough(), s({ isError: u().optional().describe("True if the download failed (e.g., user cancelled or host denied).") }).passthrough(), s({ isError: u().optional().describe("True if the host rejected or failed to deliver the message.") }).passthrough();
var Qn = s({
	method: y("ui/notifications/sandbox-proxy-ready"),
	params: s({})
}), $n = s({
	connectDomains: x(w()).optional().describe("Origins for network requests (fetch/XHR/WebSocket).\n\n- Maps to CSP `connect-src` directive\n- Empty or omitted → no network connections (secure default)"),
	resourceDomains: x(w()).optional().describe("Origins for static resources (images, scripts, stylesheets, fonts, media).\n\n- Maps to CSP `img-src`, `script-src`, `style-src`, `font-src`, `media-src` directives\n- Wildcard subdomains supported: `https://*.example.com`\n- Empty or omitted → no network resources (secure default)"),
	frameDomains: x(w()).optional().describe("Origins for nested iframes.\n\n- Maps to CSP `frame-src` directive\n- Empty or omitted → no nested iframes allowed (`frame-src 'none'`)"),
	baseUriDomains: x(w()).optional().describe("Allowed base URIs for the document.\n\n- Maps to CSP `base-uri` directive\n- Empty or omitted → only same origin allowed (`base-uri 'self'`)")
}), er = s({
	camera: s({}).optional().describe("Request camera access.\n\nMaps to Permission Policy `camera` feature."),
	microphone: s({}).optional().describe("Request microphone access.\n\nMaps to Permission Policy `microphone` feature."),
	geolocation: s({}).optional().describe("Request geolocation access.\n\nMaps to Permission Policy `geolocation` feature."),
	clipboardWrite: s({}).optional().describe("Request clipboard write access.\n\nMaps to Permission Policy `clipboard-write` feature.")
}), tr = s({
	method: y("ui/notifications/size-changed"),
	params: s({
		width: f().optional().describe("New width in pixels."),
		height: f().optional().describe("New height in pixels.")
	})
});
s({
	method: y("ui/notifications/tool-input"),
	params: s({ arguments: l(w(), i().describe("Complete tool call arguments as key-value pairs.")).optional().describe("Complete tool call arguments as key-value pairs.") })
}), s({
	method: y("ui/notifications/tool-input-partial"),
	params: s({ arguments: l(w(), i().describe("Partial tool call arguments (incomplete, may change).")).optional().describe("Partial tool call arguments (incomplete, may change).") })
}), s({
	method: y("ui/notifications/tool-cancelled"),
	params: s({ reason: w().optional().describe("Optional reason for the cancellation (e.g., \"user action\", \"timeout\").") })
});
var nr = s({ fonts: w().optional() }), rr = s({
	variables: Xn.optional().describe("CSS variables for theming the app."),
	css: nr.optional().describe("CSS blocks that apps can inject.")
});
s({
	method: y("ui/resource-teardown"),
	params: s({})
});
var ir = l(w(), i()), ar = s({
	text: s({}).optional().describe("Host supports text content blocks."),
	image: s({}).optional().describe("Host supports image content blocks."),
	audio: s({}).optional().describe("Host supports audio content blocks."),
	resource: s({}).optional().describe("Host supports resource content blocks."),
	resourceLink: s({}).optional().describe("Host supports resource link content blocks."),
	structuredContent: s({}).optional().describe("Host supports structured content.")
}), or = s({
	method: y("ui/notifications/request-teardown"),
	params: s({}).optional()
}), sr = s({
	experimental: l(w(), l(w(), v()).describe("Experimental features keyed by identifier.")).optional().describe("Experimental features keyed by identifier."),
	openLinks: s({}).optional().describe("Host supports opening external URLs."),
	downloadFile: s({}).optional().describe("Host supports file downloads via ui/download-file."),
	serverTools: s({ listChanged: u().optional().describe("Host supports tools/list_changed notifications.") }).optional().describe("Host can proxy tool calls to the MCP server."),
	serverResources: s({ listChanged: u().optional().describe("Host supports resources/list_changed notifications.") }).optional().describe("Host can proxy resource reads to the MCP server."),
	logging: s({}).optional().describe("Host accepts log messages."),
	sandbox: s({
		permissions: er.optional().describe("Permissions granted by the host (camera, microphone, geolocation)."),
		csp: $n.optional().describe("CSP domains approved by the host.")
	}).optional().describe("Sandbox configuration applied by the host."),
	updateModelContext: ar.optional().describe("Host accepts context updates (ui/update-model-context) to be included in the model's context for future turns."),
	message: ar.optional().describe("Host supports receiving content messages (ui/message) from the view."),
	sampling: s({ tools: s({}).optional().describe("Host supports tool use via `tools` and `toolChoice` parameters.") }).optional().describe("Host supports LLM sampling (sampling/createMessage) from the view.\nMirrors the MCP `ClientCapabilities.sampling` shape so hosts can pass it through.")
}), cr = s({
	experimental: l(w(), l(w(), v()).describe("Experimental features keyed by identifier.")).optional().describe("Experimental features keyed by identifier."),
	tools: s({ listChanged: u().optional().describe("App supports tools/list_changed notifications.") }).optional().describe("App exposes MCP-style tools that the host can call."),
	availableDisplayModes: x($).optional().describe("Display modes the app supports.")
}), lr = s({
	method: y("ui/notifications/initialized"),
	params: s({}).optional()
});
s({
	csp: $n.optional().describe("Content Security Policy configuration for UI resources."),
	permissions: er.optional().describe("Sandbox permissions requested by the UI resource."),
	domain: w().optional().describe("Dedicated origin for view sandbox.\n\nUseful when views need stable, dedicated origins for OAuth callbacks, CORS policies, or API key allowlists.\n\n**Host-dependent:** The format and validation rules for this field are determined by each host. Servers MUST consult host-specific documentation for the expected domain format. Common patterns include:\n- Hash-based subdomains (e.g., `{hash}.claudemcpcontent.com`)\n- URL-derived subdomains (e.g., `www-example-com.oaiusercontent.com`)\n\nIf omitted, host uses default sandbox origin (typically per-conversation)."),
	prefersBorder: u().optional().describe("Visual boundary preference - true if view prefers a visible border.\n\nBoolean requesting whether a visible border and background is provided by the host. Specifying an explicit value for this is recommended because hosts' defaults may vary.\n\n- `true`: request visible border + background\n- `false`: request no visible border + background\n- omitted: host decides border")
});
var ur = s({
	method: y("ui/request-display-mode"),
	params: s({ mode: $.describe("The display mode being requested.") })
});
s({ mode: $.describe("The display mode that was actually set. May differ from requested if not supported.") }).passthrough();
var dr = a([y("model"), y("app")]).describe("Tool visibility scope - who can access the tool.");
s({
	resourceUri: w().optional(),
	visibility: x(dr).optional().describe("Who can access this tool. Default: [\"model\", \"app\"]\n- \"model\": Tool visible to and callable by the agent\n- \"app\": Tool callable by the app from this server only"),
	csp: p().optional(),
	permissions: p().optional()
}), s({ mimeTypes: x(w()).optional().describe("Array of supported MIME types for UI resources.\nMust include `\"text/html;profile=mcp-app\"` for MCP Apps support.") });
var fr = s({
	method: y("ui/download-file"),
	params: s({ contents: x(a([Pt, Ft])).describe("Resource contents to download — embedded (inline data) or linked (host fetches). Uses standard MCP resource types.") })
}), pr = s({
	method: y("ui/message"),
	params: s({
		role: y("user").describe("Message role, currently only \"user\" is supported."),
		content: x(Y).describe("Message content blocks (text, image, etc.).")
	})
});
s({
	method: y("ui/notifications/sandbox-resource-ready"),
	params: s({
		html: w().describe("HTML content to load into the inner iframe."),
		sandbox: w().optional().describe("Optional override for the inner iframe's sandbox attribute."),
		csp: $n.optional().describe("CSP configuration from resource metadata."),
		permissions: er.optional().describe("Sandbox permissions from resource metadata.")
	})
}), s({
	method: y("ui/notifications/tool-result"),
	params: X.describe("Standard MCP tool execution result.")
});
var mr = s({
	toolInfo: s({
		id: R.optional().describe("JSON-RPC id of the tools/call request."),
		tool: Vt.describe("Tool definition including name, inputSchema, etc.")
	}).optional().describe("Metadata of the tool call that instantiated this App."),
	theme: Jn.optional().describe("Current color theme preference."),
	styles: rr.optional().describe("Style configuration for theming the app."),
	displayMode: $.optional().describe("How the UI is currently displayed."),
	availableDisplayModes: x($).optional().describe("Display modes the host supports."),
	containerDimensions: a([s({ height: f().describe("Fixed container height in pixels.") }), s({ maxHeight: a([f(), c()]).optional().describe("Maximum container height in pixels.") })]).and(a([s({ width: f().describe("Fixed container width in pixels.") }), s({ maxWidth: a([f(), c()]).optional().describe("Maximum container width in pixels.") })])).optional().describe("Container dimensions. Represents the dimensions of the iframe or other\ncontainer holding the app. Specify either width or maxWidth, and either height or maxHeight."),
	locale: w().optional().describe("User's language and region preference in BCP 47 format."),
	timeZone: w().optional().describe("User's timezone in IANA format."),
	userAgent: w().optional().describe("Host application identifier."),
	platform: a([
		y("web"),
		y("desktop"),
		y("mobile")
	]).optional().describe("Platform type for responsive design decisions."),
	deviceCapabilities: s({
		touch: u().optional().describe("Whether the device supports touch input."),
		hover: u().optional().describe("Whether the device supports hover interactions.")
	}).optional().describe("Device input capabilities."),
	safeAreaInsets: s({
		top: f().describe("Top safe area inset in pixels."),
		right: f().describe("Right safe area inset in pixels."),
		bottom: f().describe("Bottom safe area inset in pixels."),
		left: f().describe("Left safe area inset in pixels.")
	}).optional().describe("Mobile safe area boundaries in pixels.")
}).passthrough();
s({
	method: y("ui/notifications/host-context-changed"),
	params: mr.describe("Partial context update containing only changed fields.")
});
var hr = s({
	method: y("ui/update-model-context"),
	params: s({
		content: x(Y).optional().describe("Context content blocks (text, image, etc.)."),
		structuredContent: l(w(), i().describe("Structured content for machine-readable context data.")).optional().describe("Structured content for machine-readable context data.")
	})
}), gr = s({
	method: y("ui/initialize"),
	params: s({
		appInfo: U.describe("App identification (name and version)."),
		appCapabilities: cr.describe("Features and capabilities this app provides."),
		protocolVersion: w().describe("Protocol version this app supports.")
	})
});
s({
	protocolVersion: w().describe("Negotiated protocol version string (e.g., \"2025-11-21\")."),
	hostInfo: U.describe("Host application identification and version."),
	hostCapabilities: sr.describe("Features and capabilities provided by the host."),
	hostContext: mr.describe("Rich context about the host environment.")
}).passthrough();
var _r = class {
	eventTarget;
	eventSource;
	messageListener;
	constructor(e = window.parent, t) {
		this.eventTarget = e, this.eventSource = t, this.messageListener = (e) => {
			if (t && e.source !== this.eventSource) {
				console.debug("Ignoring message from unknown source", e);
				return;
			}
			let n = Ee.safeParse(e.data);
			n.success ? (console.debug("Parsed message", n.data), this.onmessage?.(n.data)) : e.data?.jsonrpc === "2.0" ? (console.error("Failed to parse message", n.error.message, e), this.onerror?.(Error("Invalid JSON-RPC message received: " + n.error.message))) : console.debug("Ignoring non-JSON-RPC message", n.error.message, e);
		};
	}
	async start() {
		window.addEventListener("message", this.messageListener);
	}
	async send(e, t) {
		e.method !== "ui/notifications/tool-input-partial" && console.debug("Sending message", e), this.eventTarget.postMessage(e, "*");
	}
	async close() {
		window.removeEventListener("message", this.messageListener), this.onclose?.();
	}
	onclose;
	onerror;
	onmessage;
	sessionId;
	setProtocolVersion;
}, vr = [qn], yr = class extends Kn {
	_client;
	_hostInfo;
	_capabilities;
	_appCapabilities;
	_hostContext = {};
	_appInfo;
	_initializedReceived = !1;
	_baseReplaceRequestHandler = this.replaceRequestHandler;
	replaceRequestHandler = (e, t) => {
		this._baseReplaceRequestHandler(e, (e, n) => (this._initializedReceived || console.warn(`[ext-apps] AppBridge received '${e.method}' before ui/notifications/initialized. The View is calling host methods before completing the handshake; it should await app.connect() first.`), t(e, n)));
	};
	eventSchemas = {
		sizechange: tr,
		sandboxready: Qn,
		initialized: lr,
		requestteardown: or,
		loggingmessage: Zt
	};
	constructor(e, t, n, r) {
		super(r), this._client = e, this._hostInfo = t, this._capabilities = n, this.addEventListener("initialized", () => {
			this._initializedReceived = !0;
		}), this._hostContext = r?.hostContext || {}, this.setRequestHandler(gr, (e) => this._oninitialize(e)), this.setRequestHandler(Ve, (e, t) => (this.onping?.(e.params, t), {})), this.replaceRequestHandler(ur, (e) => ({ mode: this._hostContext.displayMode ?? "inline" }));
	}
	getAppCapabilities() {
		return this._appCapabilities;
	}
	getAppVersion() {
		return this._appInfo;
	}
	onping;
	get onsizechange() {
		return this.getEventHandler("sizechange");
	}
	set onsizechange(e) {
		this.setEventHandler("sizechange", e);
	}
	get onsandboxready() {
		return this.getEventHandler("sandboxready");
	}
	set onsandboxready(e) {
		this.setEventHandler("sandboxready", e);
	}
	get oninitialized() {
		return this.getEventHandler("initialized");
	}
	set oninitialized(e) {
		this.setEventHandler("initialized", e);
	}
	_onmessage;
	get onmessage() {
		return this._onmessage;
	}
	set onmessage(e) {
		this.warnIfRequestHandlerReplaced("onmessage", this._onmessage, e), this._onmessage = e, this.replaceRequestHandler(pr, async (e, t) => {
			if (!this._onmessage) throw Error("No onmessage handler set");
			return this._onmessage(e.params, t);
		});
	}
	_onopenlink;
	get onopenlink() {
		return this._onopenlink;
	}
	set onopenlink(e) {
		this.warnIfRequestHandlerReplaced("onopenlink", this._onopenlink, e), this._onopenlink = e, this.replaceRequestHandler(Zn, async (e, t) => {
			if (!this._onopenlink) throw Error("No onopenlink handler set");
			return this._onopenlink(e.params, t);
		});
	}
	_ondownloadfile;
	get ondownloadfile() {
		return this._ondownloadfile;
	}
	set ondownloadfile(e) {
		this.warnIfRequestHandlerReplaced("ondownloadfile", this._ondownloadfile, e), this._ondownloadfile = e, this.replaceRequestHandler(fr, async (e, t) => {
			if (!this._ondownloadfile) throw Error("No ondownloadfile handler set");
			return this._ondownloadfile(e.params, t);
		});
	}
	get onrequestteardown() {
		return this.getEventHandler("requestteardown");
	}
	set onrequestteardown(e) {
		this.setEventHandler("requestteardown", e);
	}
	_onrequestdisplaymode;
	get onrequestdisplaymode() {
		return this._onrequestdisplaymode;
	}
	set onrequestdisplaymode(e) {
		this.warnIfRequestHandlerReplaced("onrequestdisplaymode", this._onrequestdisplaymode, e), this._onrequestdisplaymode = e, this.replaceRequestHandler(ur, async (e, t) => {
			if (!this._onrequestdisplaymode) throw Error("No onrequestdisplaymode handler set");
			return this._onrequestdisplaymode(e.params, t);
		});
	}
	get onloggingmessage() {
		return this.getEventHandler("loggingmessage");
	}
	set onloggingmessage(e) {
		this.setEventHandler("loggingmessage", e);
	}
	_onupdatemodelcontext;
	get onupdatemodelcontext() {
		return this._onupdatemodelcontext;
	}
	set onupdatemodelcontext(e) {
		this.warnIfRequestHandlerReplaced("onupdatemodelcontext", this._onupdatemodelcontext, e), this._onupdatemodelcontext = e, this.replaceRequestHandler(hr, async (e, t) => {
			if (!this._onupdatemodelcontext) throw Error("No onupdatemodelcontext handler set");
			return this._onupdatemodelcontext(e.params, t);
		});
	}
	_oncalltool;
	get oncalltool() {
		return this._oncalltool;
	}
	set oncalltool(e) {
		this.warnIfRequestHandlerReplaced("oncalltool", this._oncalltool, e), this._oncalltool = e, this.replaceRequestHandler(Gt, async (e, t) => {
			if (!this._oncalltool) throw Error("No oncalltool handler set");
			return this._oncalltool(e.params, t);
		});
	}
	set oncreatesamplingmessage(e) {
		this.setRequestHandler(sn, async (t, n) => e(t.params, n));
	}
	sendToolListChanged(e = {}) {
		return this.notification({
			method: "notifications/tools/list_changed",
			params: e
		});
	}
	_onlistresources;
	get onlistresources() {
		return this._onlistresources;
	}
	set onlistresources(e) {
		this.warnIfRequestHandlerReplaced("onlistresources", this._onlistresources, e), this._onlistresources = e, this.replaceRequestHandler(lt, async (e, t) => {
			if (!this._onlistresources) throw Error("No onlistresources handler set");
			return this._onlistresources(e.params, t);
		});
	}
	_onlistresourcetemplates;
	get onlistresourcetemplates() {
		return this._onlistresourcetemplates;
	}
	set onlistresourcetemplates(e) {
		this.warnIfRequestHandlerReplaced("onlistresourcetemplates", this._onlistresourcetemplates, e), this._onlistresourcetemplates = e, this.replaceRequestHandler(dt, async (e, t) => {
			if (!this._onlistresourcetemplates) throw Error("No onlistresourcetemplates handler set");
			return this._onlistresourcetemplates(e.params, t);
		});
	}
	_onreadresource;
	get onreadresource() {
		return this._onreadresource;
	}
	set onreadresource(e) {
		this.warnIfRequestHandlerReplaced("onreadresource", this._onreadresource, e), this._onreadresource = e, this.replaceRequestHandler(ht, async (e, t) => {
			if (!this._onreadresource) throw Error("No onreadresource handler set");
			return this._onreadresource(e.params, t);
		});
	}
	sendResourceListChanged(e = {}) {
		return this.notification({
			method: "notifications/resources/list_changed",
			params: e
		});
	}
	_onlistprompts;
	get onlistprompts() {
		return this._onlistprompts;
	}
	set onlistprompts(e) {
		this.warnIfRequestHandlerReplaced("onlistprompts", this._onlistprompts, e), this._onlistprompts = e, this.replaceRequestHandler(Et, async (e, t) => {
			if (!this._onlistprompts) throw Error("No onlistprompts handler set");
			return this._onlistprompts(e.params, t);
		});
	}
	sendPromptListChanged(e = {}) {
		return this.notification({
			method: "notifications/prompts/list_changed",
			params: e
		});
	}
	assertCapabilityForMethod(e) {}
	assertRequestHandlerCapability(e) {}
	assertNotificationCapability(e) {}
	assertTaskCapability(e) {
		throw Error("Tasks are not supported in MCP Apps");
	}
	assertTaskHandlerCapability(e) {
		throw Error("Task handlers are not supported in MCP Apps");
	}
	getCapabilities() {
		return this._capabilities;
	}
	async _oninitialize(e) {
		let t = e.params.protocolVersion;
		return this._appInfo !== void 0 && console.warn("[ext-apps] AppBridge received a second ui/initialize. The View may be double-mounting (e.g. React StrictMode in dev) without closing the previous App instance. Responding normally; the latest appInfo/appCapabilities replace the previous values."), this._appCapabilities = e.params.appCapabilities, this._appInfo = e.params.appInfo, {
			protocolVersion: vr.includes(t) ? t : qn,
			hostCapabilities: this.getCapabilities(),
			hostInfo: this._hostInfo,
			hostContext: this._hostContext
		};
	}
	setHostContext(e) {
		let t = {}, n = !1;
		for (let r of Object.keys(e)) {
			let i = this._hostContext[r], a = e[r];
			br(i, a) || (t[r] = a, n = !0);
		}
		n && (this._hostContext = e, this.sendHostContextChange(t));
	}
	sendHostContextChange(e) {
		return this.notification({
			method: "ui/notifications/host-context-changed",
			params: e
		});
	}
	sendToolInput(e) {
		return this.notification({
			method: "ui/notifications/tool-input",
			params: e
		});
	}
	sendToolInputPartial(e) {
		return this.notification({
			method: "ui/notifications/tool-input-partial",
			params: e
		});
	}
	sendToolResult(e) {
		return this.notification({
			method: "ui/notifications/tool-result",
			params: e
		});
	}
	sendToolCancelled(e) {
		return this.notification({
			method: "ui/notifications/tool-cancelled",
			params: e
		});
	}
	sendSandboxResourceReady(e) {
		return this.notification({
			method: "ui/notifications/sandbox-resource-ready",
			params: e
		});
	}
	teardownResource(e, t) {
		return this.request({
			method: "ui/resource-teardown",
			params: e
		}, ir, t);
	}
	sendResourceTeardown = this.teardownResource;
	callTool(e, t) {
		return this.request({
			method: "tools/call",
			params: e
		}, X, t);
	}
	listTools(e, t) {
		return this.request({
			method: "tools/list",
			params: e
		}, Ut, t);
	}
	async connect(e) {
		if (this.transport) throw Error("AppBridge is already connected. Call close() before connecting again.");
		if (this._initializedReceived = !1, this._client) {
			let e = this._client.getServerCapabilities();
			if (!e) throw Error("Client server capabilities not available");
			e.tools && (this.oncalltool = async (e, t) => this._client.request({
				method: "tools/call",
				params: e
			}, X, { signal: t.signal }), e.tools.listChanged && this._client.setNotificationHandler(Kt, (e) => this.sendToolListChanged(e.params))), e.resources && (this.onlistresources = async (e, t) => this._client.request({
				method: "resources/list",
				params: e
			}, ut, { signal: t.signal }), this.onlistresourcetemplates = async (e, t) => this._client.request({
				method: "resources/templates/list",
				params: e
			}, ft, { signal: t.signal }), this.onreadresource = async (e, t) => this._client.request({
				method: "resources/read",
				params: e
			}, gt, { signal: t.signal }), e.resources.listChanged && this._client.setNotificationHandler(_t, (e) => this.sendResourceListChanged(e.params))), e.prompts && (this.onlistprompts = async (e, t) => this._client.request({
				method: "prompts/list",
				params: e
			}, Dt, { signal: t.signal }), e.prompts.listChanged && this._client.setNotificationHandler(Rt, (e) => this.sendPromptListChanged(e.params)));
		}
		return super.connect(e);
	}
};
function br(e, t) {
	return JSON.stringify(e) === JSON.stringify(t);
}
// node_modules/@copilotkit/mcp-apps-renderer/dist/session.mjs
function xr(e) {
	try {
		return JSON.stringify(e) ?? "";
	} catch {
		return "";
	}
}
function Sr(e) {
	try {
		let t = atob(e), n = Uint8Array.from(t, (e) => e.charCodeAt(0));
		return new TextDecoder().decode(n);
	} catch {
		throw Error("The MCP App resource contains invalid base64 content.");
	}
}
function Cr(e, t, n = !1) {
	return e?.find((e) => e.uri === t) || (!n && e?.length === 1 ? e[0] : void 0);
}
function wr(e) {
	return JSON.stringify([
		e.resourceUri ?? null,
		e.serverHash ?? null,
		e.serverId ?? null
	]);
}
var Tr = qn, Er = s({
	method: y("ui/message"),
	params: s({
		role: w().optional(),
		content: x(v()).optional(),
		followUp: u().optional(),
		_meta: l(w(), v()).optional()
	}).passthrough()
}), Dr = {
	idleTimeoutMs: O,
	initializationTimeoutMs: 3e4,
	hostInfo: {
		name: "CopilotKit MCP Apps Host",
		version: "1.0.0"
	},
	hostCapabilities: {
		openLinks: {},
		logging: {},
		message: { text: {} }
	},
	hostContext: { platform: "web" },
	allowSameOriginFallback: !1
}, Or = (e) => {
	let t, r = !0;
	try {
		t = new URL(e);
	} catch {
		if (!/^(\/|\.\/|\.\.\/)/.test(e)) return;
		r = !1;
		try {
			t = new URL(e, window.location.href);
		} catch {
			return;
		}
		if (t.origin !== window.location.origin) return;
	}
	if (!n.has(t.protocol) && !(t.username || t.password)) return r ? e : t.href;
};
function kr(e) {
	let { iframe: t, getContent: n, getAgent: i, host: a, messageId: o, hooks: s, options: c, openLinkPolicy: l = Or, cancelFollowUpsOnTeardown: u = !1 } = e, d = {
		...Dr,
		...c
	}, f = wr(n()), p = {}, m = !1, h = !1, g = null, _, v, y, b, x, S = null, C, te = !1, w = !1, T = () => {
		h && g && (_ !== void 0 && (g.sendToolInput({ arguments: _ }), _ = void 0), v !== void 0 && (g.sendToolResult(v), v = void 0));
	}, E = (e, t) => {
		let n = xr(e);
		n !== x && (x = n, s?.onContentError?.(/* @__PURE__ */ Error(`[MCPAppsRenderer] Activity content for message "${o ?? "(no id)"}" does not match the MCP Apps content schema, so it was not forwarded to the widget: ${t.message}`)));
	}, D = () => {
		x !== void 0 && (x = void 0, s?.onContentError?.(null));
	}, re = (e) => {
		let t = r.safeParse(e);
		if (!t.success) {
			E(e, t.error);
			return;
		}
		let n = t.data;
		if (wr(n) !== f) return;
		let { toolInput: i } = n, a = n.result;
		if (D(), i !== void 0) {
			let e = xr(i);
			e !== y && (y = e, _ = i, T());
		}
		if (a !== void 0) {
			let e = xr(a);
			e !== b && (b = e, v = a, T());
		}
	}, ae = (e) => {
		if (m || !o) return;
		let t = (e ?? i()?.messages)?.find((e) => e?.id === o);
		if (!t || t.activityType !== "mcp-apps") return;
		let n = r.safeParse(t.content);
		n.success ? re(n.data) : E(t.content, n.error);
	}, O = () => !!(i()?.messages)?.some((e) => e?.id === o && e?.activityType === "mcp-apps"), ce = async () => {
		let t = i();
		if (!t) throw Error("No agent available to fetch resource");
		let { resourceUri: r, serverHash: a, serverId: o } = n(), s = t, c = (await k.enqueue(t, () => {
			let e = { forwardedProps: { __proxiedMCPRequest: {
				serverHash: a,
				serverId: o,
				method: "resources/read",
				params: { uri: r }
			} } };
			return s.ɵrunMcpResourceRead ? s.ɵrunMcpResourceRead(e) : t.runAgent(e);
		}, {
			owner: p,
			timeoutMs: d.idleTimeoutMs,
			cancelRunningWait: e.cancelRunningWaitOnTeardown,
			dropAfterThreadSwitch: !0
		})).result, l = Cr(c?.contents, r, e.requireExactResourceUri);
		if (!l) throw Error("No resource content in response");
		return l;
	}, le = () => {
		if (m) return;
		m = !0, C !== void 0 && (clearTimeout(C), C = void 0), k.cancelOwner(p), S?.unsubscribe(), S = null;
		let e = g;
		g = null, e?.close();
	};
	return (async () => {
		try {
			let c = await ce();
			if (m) return;
			s?.onResource?.(c);
			let f = ie(d.allowSameOriginFallback);
			t.setAttribute("sandbox", f), t.setAttribute("data-testid", "mcp-app-iframe"), t.setAttribute("title", "Interactive MCP application");
			let x = c._meta?.ui?.csp?.resourceDomains;
			t.srcdoc = oe(x);
			let E = t.contentWindow;
			if (!E) throw Error("Sandbox iframe has no contentWindow");
			let D;
			if (c.text) D = c.text;
			else if (c.blob) D = Sr(c.blob);
			else throw Error("Resource has no text or blob content");
			g = new yr(null, d.hostInfo, d.hostCapabilities, { hostContext: {
				theme: t.closest(".dark") ? "dark" : "light",
				...d.hostContext
			} }), C = setTimeout(() => {
				m || te || (w = !0, s?.onError?.(/* @__PURE__ */ Error(`[MCPAppsRenderer] Timed out after ${d.initializationTimeoutMs}ms waiting for the MCP App sandbox to initialize.`)), le());
			}, d.initializationTimeoutMs), g.onsandboxready = () => {
				w ? console.warn("[MCPAppsRenderer] Ignoring a sandbox handshake that arrived after the initialization timeout.") : (te = !0, C !== void 0 && (clearTimeout(C), C = void 0), g?.sendSandboxResourceReady({
					html: D,
					sandbox: f
				}).then(() => {
					m || s?.onSandboxReady?.();
				}));
			}, g.setRequestHandler(Er, async (t) => {
				let n = i();
				if (!n) return console.warn("[MCPAppsRenderer] ui/message: No agent available"), { isError: !1 };
				try {
					let r = t.params, i = r._meta?.copilotkit ?? {}, o = i.role || r.role || "user", c = r.content?.filter((e) => e.type === "text" && e.text).map((e) => e.text).join("\n") || "";
					if (c && n.addMessage({
						id: ee(),
						role: o,
						content: c
					}), (i.followUp ?? r.followUp ?? o === "user") && c) {
						let t = n.threadId || "default";
						k.enqueue(n, () => ne({
							host: a,
							agent: n,
							capturedThreadId: t
						}), {
							timeoutMs: d.idleTimeoutMs,
							owner: u ? p : void 0,
							cancelRunningWait: e.cancelRunningWaitOnTeardown
						}).catch((e) => {
							m && u || (console.error("[MCPAppsRenderer] ui/message agent run failed:", e), s?.onFollowUpError?.(e instanceof Error ? e : Error(String(e))));
						});
					}
					return { isError: !1 };
				} catch (e) {
					return console.error("[MCPAppsRenderer] ui/message error:", e), { isError: !0 };
				}
			}), g.onopenlink = async ({ url: e }) => {
				let t = l(e);
				return t ? (window.open(t, "_blank", "noopener,noreferrer"), { isError: !1 }) : (console.warn("[MCPAppsRenderer] ui/open-link rejected by policy:", e), { isError: !0 });
			}, g.oncalltool = async (t) => {
				let { serverHash: a, serverId: o } = n(), s = i();
				if (!a) throw Error("No server hash available for proxying");
				if (!s) throw Error("No agent available for proxying");
				let c;
				try {
					c = await k.enqueue(s, () => s.runAgent({ forwardedProps: { __proxiedMCPRequest: {
						serverHash: a,
						serverId: o,
						method: "tools/call",
						params: t
					} } }), {
						owner: p,
						timeoutMs: d.idleTimeoutMs,
						cancelRunningWait: e.cancelRunningWaitOnTeardown,
						dropAfterThreadSwitch: !0
					});
				} catch (e) {
					throw e instanceof se ? Error(`tools/call was not executed: ${e.message} Retry from the current thread.`, { cause: e }) : e;
				}
				return r.shape.result.parse(c.result ?? {});
			}, g.onsizechange = (e) => {
				if (m) return;
				let { width: t, height: n } = e || {};
				s?.onSizeChanged?.({
					width: typeof t == "number" ? t : void 0,
					height: typeof n == "number" ? n : void 0
				});
			}, g.oninitialized = () => {
				m || (h = !0, s?.onInitialized?.(), o && O() && (_ = void 0, v = void 0, y = void 0, b = void 0, ae()), T());
			}, g.onloggingmessage = (e) => {
				console.log("[MCPAppsRenderer] App log:", e);
			};
			let re = new _r(E, E);
			if (await g.connect(re), m) {
				await g.close(), g = null;
				return;
			}
			o && (S = i()?.subscribe({ onMessagesChanged: ({ messages: e }) => ae(e) }) ?? null);
		} catch (e) {
			console.error("[MCPAppsRenderer] Setup error:", e), m || s?.onError?.(e instanceof Error ? e : Error(String(e)));
		}
	})(), {
		sendToolInput(e) {
			_ = e, T();
		},
		sendToolResult(e) {
			v = r.shape.result.parse(e), T();
		},
		syncContent(e) {
			o && O() || re(e);
		},
		teardown() {
			le();
		}
	};
}
export { r as MCPAppsActivityContentSchema, t as MCPAppsActivityType, se as MCPAppsQueueThreadChangedError, de as MCPAppsRequestQueue, Tr as MCP_APPS_PROTOCOL_VERSION, O as MCP_APPS_QUEUE_IDLE_TIMEOUT_MS, Dr as MCP_APPS_SESSION_DEFAULTS, n as MCP_OPEN_LINK_BLOCKED_SCHEMES, kr as bindMcpApp, oe as buildSandboxHTML, Or as denyDangerousSchemes, k as mcpAppsRequestQueue, Sr as ɵdecodeBase64, ie as ɵmcpAppSandboxFlags, ne as ɵrunMcpFollowUp };
