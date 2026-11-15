import { r as e } from "./rolldown-runtime-CwxnZyOB.js";
import { n as t, r as n, t as r } from "./content-schema-6bvh5BFp.js";
import { A as i, B as a, F as o, G as s, H as c, I as l, J as u, K as d, L as f, M as p, N as m, P as h, Q as g, U as _, V as v, W as y, X as b, Y as x, Z as ee, a as S, d as C, i as te, j as w, l as T, m as E, p as ne, q as D, r as re, t as ie, z as ae } from "./random-id-CUzDLhTm.js";
// node_modules/.pnpm/@copilotkit+mcp-apps-render_930531415c0c853efe006375fdb5b352/node_modules/@copilotkit/mcp-apps-renderer/dist/follow-up.mjs
async function oe({ host: e, agent: t, capturedThreadId: n }) {
	let r = t.threadId || "default", i = n || "default";
	return r === i ? e.runAgent({ agent: t }) : (console.warn(`[MCPAppsRenderer] ui/message follow-up dropped: the thread changed (${i} → ${r}) between enqueue and execution, so running it would leak into the now-foreground thread.`), {
		result: void 0,
		newMessages: []
	});
}
// node_modules/.pnpm/@copilotkit+mcp-apps-render_930531415c0c853efe006375fdb5b352/node_modules/@copilotkit/mcp-apps-renderer/dist/sandbox.mjs
var se = "allow-scripts allow-forms", ce = "allow-scripts allow-same-origin allow-forms";
function le(e = !1) {
	return e ? ce : se;
}
var ue = /^(?:[a-z][a-z0-9+.-]*:\/\/)?(?:\*\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*(?::(?:\d+|\*))?(?:\/[\w.~%/!$()*+=:@-]*)?$/i;
function de(e) {
	let t = (e ?? []).filter((e) => typeof e == "string" && ue.test(e)), n = t.length ? " " + t.join(" ") : "";
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
inner.setAttribute("sandbox","${se}");
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
// node_modules/.pnpm/@copilotkit+mcp-apps-render_930531415c0c853efe006375fdb5b352/node_modules/@copilotkit/mcp-apps-renderer/dist/request-queue.mjs
var fe = 3e4, pe = class extends Error {
	constructor(e, t) {
		super(`[CopilotKit] MCP app request dropped: the agent moved from thread "${e}" to "${t}" while it was queued.`), this.originThreadId = e, this.currentThreadId = t, this.name = "MCPAppsQueueThreadChangedError";
	}
}, me = /* @__PURE__ */ new WeakMap(), he = 0;
function ge(e) {
	let t = me.get(e);
	return t || (t = `agent-${he++}`, me.set(e, t)), `${t}::${e.threadId || "default"}`;
}
var _e = class {
	constructor() {
		this.queues = /* @__PURE__ */ new Map(), this.processing = /* @__PURE__ */ new Map();
	}
	async enqueue(e, t, n) {
		let r = ge(e);
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
								e.reject(new pe(e.originThreadId, r)), n.shift();
								continue;
							}
							e.executing = !0;
							let i = e.execute(e.controller.signal), a = e.cancelRunningWait ? await ve(i, e.controller.signal) : await i;
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
}, O = new _e();
function ve(e, t) {
	return new Promise((n, r) => {
		let i = () => r(/* @__PURE__ */ Error("[CopilotKit] MCP app request cancelled on teardown"));
		t.addEventListener("abort", i, { once: !0 }), e.then(n, r).finally(() => t.removeEventListener("abort", i)), t.aborted && i();
	});
}
// node_modules/.pnpm/@modelcontextprotocol+sdk@1.32.2_zod@3.25.76/node_modules/@modelcontextprotocol/sdk/dist/esm/types.js
var k = "io.modelcontextprotocol/related-task", A = l((e) => e !== null && (typeof e == "object" || typeof e == "function")), ye = x([u(), _().int()]), be = u();
v({
	ttl: _().optional(),
	pollInterval: _().optional()
});
var xe = y({ ttl: _().optional() }), Se = y({ taskId: u() }), Ce = v({
	progressToken: ye.optional(),
	[k]: Se.optional()
}), j = y({ _meta: Ce.optional() }), M = j.extend({ task: xe.optional() }), we = (e) => M.safeParse(e).success, N = y({
	method: u(),
	params: j.loose().optional()
}), P = y({ _meta: Ce.optional() }), F = y({
	method: u(),
	params: P.loose().optional()
}), I = v({ _meta: Ce.optional() }), L = x([u(), _().int()]), Te = y({
	jsonrpc: a("2.0"),
	id: L,
	...N.shape
}).strict(), Ee = (e) => Te.safeParse(e).success, De = y({
	jsonrpc: a("2.0"),
	...F.shape
}).strict(), Oe = (e) => De.safeParse(e).success, ke = y({
	jsonrpc: a("2.0"),
	id: L,
	result: I
}).strict(), Ae = (e) => ke.safeParse(e).success, R;
(function(e) {
	e[e.ConnectionClosed = -32e3] = "ConnectionClosed", e[e.RequestTimeout = -32001] = "RequestTimeout", e[e.ParseError = -32700] = "ParseError", e[e.InvalidRequest = -32600] = "InvalidRequest", e[e.MethodNotFound = -32601] = "MethodNotFound", e[e.InvalidParams = -32602] = "InvalidParams", e[e.InternalError = -32603] = "InternalError", e[e.UrlElicitationRequired = -32042] = "UrlElicitationRequired";
})(R ||= {});
var je = y({
	jsonrpc: a("2.0"),
	id: L.optional(),
	error: y({
		code: _().int(),
		message: u(),
		data: b().optional()
	})
}).strict(), Me = (e) => je.safeParse(e).success, Ne = x([
	Te,
	De,
	ke,
	je
]);
x([ke, je]);
var Pe = I.strict(), Fe = P.extend({
	requestId: L.optional(),
	reason: u().optional()
}), Ie = F.extend({
	method: a("notifications/cancelled"),
	params: Fe
}), Le = y({
	src: u(),
	mimeType: u().optional(),
	sizes: h(u()).optional(),
	theme: i(["light", "dark"]).optional()
}), z = y({ icons: h(Le).optional() }), B = y({
	name: u(),
	title: u().optional()
}), V = B.extend({
	...B.shape,
	...z.shape,
	version: u(),
	websiteUrl: u().optional(),
	description: u().optional()
}), Re = ae(y({ applyDefaults: o().optional() }), D(u(), b())), ze = d((e) => e && typeof e == "object" && !Array.isArray(e) && Object.keys(e).length === 0 ? { form: {} } : e, ae(y({
	form: Re.optional(),
	url: A.optional()
}), D(u(), b()).optional())), Be = v({
	list: A.optional(),
	cancel: A.optional(),
	requests: v({
		sampling: v({ createMessage: A.optional() }).optional(),
		elicitation: v({ create: A.optional() }).optional()
	}).optional()
}), Ve = v({
	list: A.optional(),
	cancel: A.optional(),
	requests: v({ tools: v({ call: A.optional() }).optional() }).optional()
}), He = y({
	experimental: D(u(), A).optional(),
	sampling: y({
		context: A.optional(),
		tools: A.optional()
	}).optional(),
	elicitation: ze.optional(),
	roots: y({ listChanged: o().optional() }).optional(),
	tasks: Be.optional(),
	extensions: D(u(), A).optional()
}), Ue = j.extend({
	protocolVersion: u(),
	capabilities: He,
	clientInfo: V
}), We = N.extend({
	method: a("initialize"),
	params: Ue
}), Ge = y({
	experimental: D(u(), A).optional(),
	logging: A.optional(),
	completions: A.optional(),
	prompts: y({ listChanged: o().optional() }).optional(),
	resources: y({
		subscribe: o().optional(),
		listChanged: o().optional()
	}).optional(),
	tools: y({ listChanged: o().optional() }).optional(),
	tasks: Ve.optional(),
	extensions: D(u(), A).optional()
}), Ke = I.extend({
	protocolVersion: u(),
	capabilities: Ge,
	serverInfo: V,
	instructions: u().optional()
}), qe = F.extend({
	method: a("notifications/initialized"),
	params: P.optional()
}), H = N.extend({
	method: a("ping"),
	params: j.optional()
}), Je = y({
	progress: _(),
	total: s(_()),
	message: s(u())
}), Ye = y({
	...P.shape,
	...Je.shape,
	progressToken: ye
}), Xe = F.extend({
	method: a("notifications/progress"),
	params: Ye
}), Ze = j.extend({ cursor: be.optional() }), U = N.extend({ params: Ze.optional() }), W = I.extend({ nextCursor: be.optional() }), Qe = i([
	"working",
	"input_required",
	"completed",
	"failed",
	"cancelled"
]), G = y({
	taskId: u(),
	status: Qe,
	ttl: x([_(), w()]),
	createdAt: u(),
	lastUpdatedAt: u(),
	pollInterval: s(_()),
	statusMessage: s(u())
}), $e = I.extend({ task: G }), et = P.merge(G), K = F.extend({
	method: a("notifications/tasks/status"),
	params: et
}), tt = N.extend({
	method: a("tasks/get"),
	params: j.extend({ taskId: u() })
}), nt = I.merge(G), rt = N.extend({
	method: a("tasks/result"),
	params: j.extend({ taskId: u() })
});
I.loose();
var it = U.extend({ method: a("tasks/list") }), at = W.extend({ tasks: h(G) }), ot = N.extend({
	method: a("tasks/cancel"),
	params: j.extend({ taskId: u() })
}), st = I.merge(G), ct = y({
	uri: u(),
	mimeType: s(u()),
	_meta: D(u(), b()).optional()
}), lt = ct.extend({ text: u() }), ut = u().refine((e) => {
	try {
		return atob(e), !0;
	} catch {
		return !1;
	}
}, { message: "Invalid Base64 string" }), dt = ct.extend({ blob: ut }), q = i(["user", "assistant"]), J = y({
	audience: h(q).optional(),
	priority: _().min(0).max(1).optional(),
	lastModified: ee({ offset: !0 }).optional()
}), ft = y({
	...B.shape,
	...z.shape,
	uri: u(),
	description: s(u()),
	mimeType: s(u()),
	size: s(_()),
	annotations: J.optional(),
	_meta: s(v({}))
}), pt = y({
	...B.shape,
	...z.shape,
	uriTemplate: u(),
	description: s(u()),
	mimeType: s(u()),
	annotations: J.optional(),
	_meta: s(v({}))
}), mt = U.extend({ method: a("resources/list") }), ht = W.extend({ resources: h(ft) }), gt = U.extend({ method: a("resources/templates/list") }), _t = W.extend({ resourceTemplates: h(pt) }), vt = j.extend({ uri: u() }), yt = vt, bt = N.extend({
	method: a("resources/read"),
	params: yt
}), xt = I.extend({ contents: h(x([lt, dt])) }), St = F.extend({
	method: a("notifications/resources/list_changed"),
	params: P.optional()
}), Ct = vt, wt = N.extend({
	method: a("resources/subscribe"),
	params: Ct
}), Tt = vt, Et = N.extend({
	method: a("resources/unsubscribe"),
	params: Tt
}), Dt = P.extend({ uri: u() }), Ot = F.extend({
	method: a("notifications/resources/updated"),
	params: Dt
}), kt = y({
	name: u(),
	description: s(u()),
	required: s(o())
}), At = y({
	...B.shape,
	...z.shape,
	description: s(u()),
	arguments: s(h(kt)),
	_meta: s(v({}))
}), jt = U.extend({ method: a("prompts/list") }), Mt = W.extend({ prompts: h(At) }), Nt = j.extend({
	name: u(),
	arguments: D(u(), u()).optional()
}), Pt = N.extend({
	method: a("prompts/get"),
	params: Nt
}), Ft = y({
	type: a("text"),
	text: u(),
	annotations: J.optional(),
	_meta: D(u(), b()).optional()
}), It = y({
	type: a("image"),
	data: ut,
	mimeType: u(),
	annotations: J.optional(),
	_meta: D(u(), b()).optional()
}), Lt = y({
	type: a("audio"),
	data: ut,
	mimeType: u(),
	annotations: J.optional(),
	_meta: D(u(), b()).optional()
}), Rt = y({
	type: a("tool_use"),
	name: u(),
	id: u(),
	input: D(u(), b()),
	_meta: D(u(), b()).optional()
}), zt = y({
	type: a("resource"),
	resource: x([lt, dt]),
	annotations: J.optional(),
	_meta: D(u(), b()).optional()
}), Bt = ft.extend({ type: a("resource_link") }), Y = x([
	Ft,
	It,
	Lt,
	Bt,
	zt
]), Vt = y({
	role: q,
	content: Y
}), Ht = I.extend({
	description: u().optional(),
	messages: h(Vt)
}), Ut = F.extend({
	method: a("notifications/prompts/list_changed"),
	params: P.optional()
}), Wt = y({
	title: u().optional(),
	readOnlyHint: o().optional(),
	destructiveHint: o().optional(),
	idempotentHint: o().optional(),
	openWorldHint: o().optional()
}), Gt = y({ taskSupport: i([
	"required",
	"optional",
	"forbidden"
]).optional() }), Kt = y({
	...B.shape,
	...z.shape,
	description: u().optional(),
	inputSchema: y({
		type: a("object"),
		properties: D(u(), A).optional(),
		required: h(u()).optional()
	}).catchall(b()),
	outputSchema: y({
		type: a("object"),
		properties: D(u(), A).optional(),
		required: h(u()).optional()
	}).catchall(b()).optional(),
	annotations: Wt.optional(),
	execution: Gt.optional(),
	_meta: D(u(), b()).optional()
}), qt = U.extend({ method: a("tools/list") }), Jt = W.extend({ tools: h(Kt) }), X = I.extend({
	content: h(Y).default([]),
	structuredContent: D(u(), b()).optional(),
	isError: o().optional()
});
X.or(I.extend({ toolResult: b() }));
var Yt = M.extend({
	name: u(),
	arguments: D(u(), b()).optional()
}), Xt = N.extend({
	method: a("tools/call"),
	params: Yt
}), Zt = F.extend({
	method: a("notifications/tools/list_changed"),
	params: P.optional()
});
y({
	autoRefresh: o().default(!0),
	debounceMs: _().int().nonnegative().default(300)
});
var Qt = i([
	"debug",
	"info",
	"notice",
	"warning",
	"error",
	"critical",
	"alert",
	"emergency"
]), $t = j.extend({ level: Qt }), en = N.extend({
	method: a("logging/setLevel"),
	params: $t
}), tn = P.extend({
	level: Qt,
	logger: u().optional(),
	data: b()
}), nn = F.extend({
	method: a("notifications/message"),
	params: tn
}), rn = y({ name: u().optional() }), an = y({
	hints: h(rn).optional(),
	costPriority: _().min(0).max(1).optional(),
	speedPriority: _().min(0).max(1).optional(),
	intelligencePriority: _().min(0).max(1).optional()
}), on = y({ mode: i([
	"auto",
	"required",
	"none"
]).optional() }), sn = y({
	type: a("tool_result"),
	toolUseId: u().describe("The unique identifier for the corresponding tool call."),
	content: h(Y).default([]),
	structuredContent: y({}).loose().optional(),
	isError: o().optional(),
	_meta: D(u(), b()).optional()
}), cn = f("type", [
	Ft,
	It,
	Lt
]), ln = f("type", [
	Ft,
	It,
	Lt,
	Rt,
	sn
]), un = y({
	role: q,
	content: x([ln, h(ln)]),
	_meta: D(u(), b()).optional()
}), dn = M.extend({
	messages: h(un),
	modelPreferences: an.optional(),
	systemPrompt: u().optional(),
	includeContext: i([
		"none",
		"thisServer",
		"allServers"
	]).optional(),
	temperature: _().optional(),
	maxTokens: _().int(),
	stopSequences: h(u()).optional(),
	metadata: A.optional(),
	tools: h(Kt).optional(),
	toolChoice: on.optional()
}), fn = N.extend({
	method: a("sampling/createMessage"),
	params: dn
}), pn = I.extend({
	model: u(),
	stopReason: s(i([
		"endTurn",
		"stopSequence",
		"maxTokens"
	]).or(u())),
	role: q,
	content: cn
}), mn = I.extend({
	model: u(),
	stopReason: s(i([
		"endTurn",
		"stopSequence",
		"maxTokens",
		"toolUse"
	]).or(u())),
	role: q,
	content: x([ln, h(ln)])
}), hn = y({
	type: a("boolean"),
	title: u().optional(),
	description: u().optional(),
	default: o().optional()
}), gn = y({
	type: a("string"),
	title: u().optional(),
	description: u().optional(),
	minLength: _().optional(),
	maxLength: _().optional(),
	format: i([
		"email",
		"uri",
		"date",
		"date-time"
	]).optional(),
	default: u().optional()
}), _n = y({
	type: i(["number", "integer"]),
	title: u().optional(),
	description: u().optional(),
	minimum: _().optional(),
	maximum: _().optional(),
	default: _().optional()
}), vn = y({
	type: a("string"),
	title: u().optional(),
	description: u().optional(),
	enum: h(u()),
	default: u().optional()
}), yn = y({
	type: a("string"),
	title: u().optional(),
	description: u().optional(),
	oneOf: h(y({
		const: u(),
		title: u()
	})),
	default: u().optional()
}), bn = y({
	type: a("string"),
	title: u().optional(),
	description: u().optional(),
	enum: h(u()),
	enumNames: h(u()).optional(),
	default: u().optional()
}), xn = x([vn, yn]), Sn = y({
	type: a("array"),
	title: u().optional(),
	description: u().optional(),
	minItems: _().optional(),
	maxItems: _().optional(),
	items: y({
		type: a("string"),
		enum: h(u())
	}),
	default: h(u()).optional()
}), Cn = y({
	type: a("array"),
	title: u().optional(),
	description: u().optional(),
	minItems: _().optional(),
	maxItems: _().optional(),
	items: y({ anyOf: h(y({
		const: u(),
		title: u()
	})) }),
	default: h(u()).optional()
}), wn = x([Sn, Cn]), Tn = x([
	bn,
	xn,
	wn
]), En = x([
	Tn,
	hn,
	gn,
	_n
]), Dn = M.extend({
	mode: a("form").optional(),
	message: u(),
	requestedSchema: y({
		type: a("object"),
		properties: D(u(), En),
		required: h(u()).optional()
	})
}), On = M.extend({
	mode: a("url"),
	message: u(),
	elicitationId: u(),
	url: u().url()
}), kn = x([Dn, On]), An = N.extend({
	method: a("elicitation/create"),
	params: kn
}), jn = P.extend({ elicitationId: u() }), Mn = F.extend({
	method: a("notifications/elicitation/complete"),
	params: jn
}), Nn = I.extend({
	action: i([
		"accept",
		"decline",
		"cancel"
	]),
	content: d((e) => e === null ? void 0 : e, D(u(), x([
		u(),
		_(),
		o(),
		h(u())
	])).optional())
}), Pn = y({
	type: a("ref/resource"),
	uri: u()
}), Fn = y({
	type: a("ref/prompt"),
	name: u()
}), In = j.extend({
	ref: x([Fn, Pn]),
	argument: y({
		name: u(),
		value: u()
	}),
	context: y({ arguments: D(u(), u()).optional() }).optional()
}), Ln = N.extend({
	method: a("completion/complete"),
	params: In
}), Rn = I.extend({ completion: v({
	values: h(u()).max(100),
	total: s(_().int()),
	hasMore: s(o())
}) }), zn = y({
	uri: u().startsWith("file://"),
	name: u().optional(),
	_meta: D(u(), b()).optional()
}), Bn = N.extend({
	method: a("roots/list"),
	params: j.optional()
}), Vn = I.extend({ roots: h(zn) }), Hn = F.extend({
	method: a("notifications/roots/list_changed"),
	params: P.optional()
});
x([
	H,
	We,
	Ln,
	en,
	Pt,
	jt,
	mt,
	gt,
	bt,
	wt,
	Et,
	Xt,
	qt,
	tt,
	rt,
	it,
	ot
]), x([
	Ie,
	Xe,
	qe,
	Hn,
	K
]), x([
	Pe,
	pn,
	mn,
	Nn,
	Vn,
	nt,
	at,
	$e
]), x([
	H,
	fn,
	An,
	Bn,
	tt,
	rt,
	it,
	ot
]), x([
	Ie,
	Xe,
	nn,
	Ot,
	St,
	Zt,
	Ut,
	K,
	Mn
]), x([
	Pe,
	Ke,
	Rn,
	Ht,
	Mt,
	ht,
	_t,
	xt,
	X,
	Jt,
	nt,
	at,
	$e
]);
var Z = class e extends Error {
	constructor(e, t, n) {
		super(`MCP error ${e}: ${t}`), this.code = e, this.data = n, this.name = "McpError";
	}
	static fromError(t, n, r) {
		if (t === R.UrlElicitationRequired && r) {
			let e = r;
			if (e.elicitations) return new Un(e.elicitations, n);
		}
		return new e(t, n, r);
	}
}, Un = class extends Z {
	constructor(e, t = `URL elicitation${e.length > 1 ? "s" : ""} required`) {
		super(R.UrlElicitationRequired, t, { elicitations: e });
	}
	get elicitations() {
		return this.data?.elicitations ?? [];
	}
};
// node_modules/.pnpm/@modelcontextprotocol+sdk@1.32.2_zod@3.25.76/node_modules/@modelcontextprotocol/sdk/dist/esm/server/zod-compat.js
function Wn(e) {
	return !!e._zod;
}
function Gn(e, t) {
	return Wn(e) ? g(e, t) : e.safeParse(t);
}
function Kn(e) {
	if (!e) return;
	let t;
	if (t = Wn(e) ? e._zod?.def?.shape : e.shape, t) {
		if (typeof t == "function") try {
			return t();
		} catch {
			return;
		}
		return t;
	}
}
function qn(e) {
	if (Wn(e)) {
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
// node_modules/.pnpm/@modelcontextprotocol+sdk@1.32.2_zod@3.25.76/node_modules/@modelcontextprotocol/sdk/dist/esm/experimental/tasks/interfaces.js
function Q(e) {
	return e === "completed" || e === "failed" || e === "cancelled";
}
// node_modules/.pnpm/@modelcontextprotocol+sdk@1.32.2_zod@3.25.76/node_modules/@modelcontextprotocol/sdk/dist/esm/server/zod-json-schema-compat.js
function Jn(e) {
	let t = Kn(e)?.method;
	if (!t) throw Error("Schema is missing a method literal");
	let n = qn(t);
	if (typeof n != "string") throw Error("Schema method literal must be a string");
	return n;
}
function Yn(e, t) {
	let n = Gn(e, t);
	if (!n.success) throw n.error;
	return n.data;
}
var Xn = class {
	constructor(e) {
		this._options = e, this._requestMessageId = 0, this._requestHandlers = /* @__PURE__ */ new Map(), this._requestHandlerAbortControllers = /* @__PURE__ */ new Map(), this._notificationHandlers = /* @__PURE__ */ new Map(), this._responseHandlers = /* @__PURE__ */ new Map(), this._progressHandlers = /* @__PURE__ */ new Map(), this._timeoutInfo = /* @__PURE__ */ new Map(), this._pendingDebouncedNotifications = /* @__PURE__ */ new Set(), this._taskProgressTokens = /* @__PURE__ */ new Map(), this._requestResolvers = /* @__PURE__ */ new Map(), this.setNotificationHandler(Ie, (e) => {
			this._oncancel(e);
		}), this.setNotificationHandler(Xe, (e) => {
			this._onprogress(e);
		}), this.setRequestHandler(H, (e) => ({})), this._taskStore = e?.taskStore, this._taskMessageQueue = e?.taskMessageQueue, this._taskStore && (this.setRequestHandler(tt, async (e, t) => {
			let n = await this._taskStore.getTask(e.params.taskId, t.sessionId);
			if (!n) throw new Z(R.InvalidParams, "Failed to retrieve task: Task not found");
			return { ...n };
		}), this.setRequestHandler(rt, async (e, t) => {
			let n = async () => {
				let r = e.params.taskId;
				if (!await this._taskStore.getTask(r, t.sessionId)) throw new Z(R.InvalidParams, `Task not found: ${r}`);
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
				if (!i) throw new Z(R.InvalidParams, `Task not found: ${r}`);
				if (!Q(i.status)) return await this._waitForTaskUpdate(r, t.signal, t.sessionId), await n();
				if (Q(i.status)) {
					let e = await this._taskStore.getTaskResult(r, t.sessionId);
					return this._clearTaskQueue(r, t.sessionId), {
						...e,
						_meta: {
							...e._meta,
							[k]: { taskId: r }
						}
					};
				}
				return await n();
			};
			return await n();
		}), this.setRequestHandler(it, async (e, t) => {
			try {
				let { tasks: n, nextCursor: r } = await this._taskStore.listTasks(e.params?.cursor, t.sessionId);
				return {
					tasks: n,
					nextCursor: r,
					_meta: {}
				};
			} catch (e) {
				throw new Z(R.InvalidParams, `Failed to list tasks: ${e instanceof Error ? e.message : String(e)}`);
			}
		}), this.setRequestHandler(ot, async (e, t) => {
			try {
				let n = await this._taskStore.getTask(e.params.taskId, t.sessionId);
				if (!n) throw new Z(R.InvalidParams, `Task not found: ${e.params.taskId}`);
				if (Q(n.status)) throw new Z(R.InvalidParams, `Cannot cancel task in terminal status: ${n.status}`);
				await this._taskStore.updateTaskStatus(e.params.taskId, "cancelled", "Client cancelled task execution.", t.sessionId), this._clearTaskQueue(e.params.taskId, t.sessionId);
				let r = await this._taskStore.getTask(e.params.taskId, t.sessionId);
				if (!r) throw new Z(R.InvalidParams, `Task not found after cancellation: ${e.params.taskId}`);
				return {
					_meta: {},
					...r
				};
			} catch (e) {
				throw e instanceof Z ? e : new Z(R.InvalidRequest, `Failed to cancel task: ${e instanceof Error ? e.message : String(e)}`);
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
		if (t.maxTotalTimeout && n >= t.maxTotalTimeout) throw this._timeoutInfo.delete(e), Z.fromError(R.RequestTimeout, "Maximum total timeout exceeded", {
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
			r?.(e, t), Ae(e) || Me(e) ? this._onresponse(e) : Ee(e) ? this._onrequest(e, t) : Oe(e) ? this._onnotification(e) : this._onerror(/* @__PURE__ */ Error(`Unknown message type: ${JSON.stringify(e)}`));
		}, await this._transport.start();
	}
	_onclose() {
		let e = this._responseHandlers;
		this._responseHandlers = /* @__PURE__ */ new Map(), this._progressHandlers.clear(), this._taskProgressTokens.clear(), this._pendingDebouncedNotifications.clear();
		for (let e of this._timeoutInfo.values()) clearTimeout(e.timeoutId);
		this._timeoutInfo.clear();
		for (let e of this._requestHandlerAbortControllers.values()) e.abort();
		this._requestHandlerAbortControllers.clear();
		let t = Z.fromError(R.ConnectionClosed, "Connection closed");
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
		let n = this._requestHandlers.get(e.method) ?? this.fallbackRequestHandler, r = this._transport, i = e.params?._meta?.[k]?.taskId, a = r?.sessionId, o = this._taskStore, s = !0, c;
		if (i && o && this._taskMessageQueue && a !== void 0 && (s = !1, c = (async () => {
			if (!await o.getTask(i, a)) throw new Z(R.InvalidParams, `Task not found: ${i}`);
			s = !0;
		})()), n === void 0) {
			let t = {
				jsonrpc: "2.0",
				id: e.id,
				error: {
					code: R.MethodNotFound,
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
		let u = we(e.params) ? e.params.task : void 0, d = this._taskStore ? this.requestTaskStore(e, r?.sessionId) : void 0, f = {
			signal: l.signal,
			sessionId: r?.sessionId,
			_meta: e.params?._meta,
			sendNotification: async (t) => {
				if (l.signal.aborted) return;
				let n = { relatedRequestId: e.id };
				i && (n.relatedTask = { taskId: i }), await this.notification(t, n);
			},
			sendRequest: async (t, n, r) => {
				if (l.signal.aborted) throw new Z(R.ConnectionClosed, "Request was cancelled");
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
			if (c && l.signal.aborted) throw new Z(R.ConnectionClosed, "Request was cancelled");
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
					code: Number.isSafeInteger(t.code) ? t.code : R.InternalError,
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
			this._requestResolvers.delete(t), Ae(e) ? n(e) : n(new Z(e.error.code, e.error.message, e.error.data));
			return;
		}
		let r = this._responseHandlers.get(t);
		if (r === void 0) {
			this._onerror(/* @__PURE__ */ Error(`Received a response for an unknown message ID: ${JSON.stringify(e)}`));
			return;
		}
		this._responseHandlers.delete(t), this._cleanupTimeout(t);
		let i = !1;
		if (Ae(e) && e.result && typeof e.result == "object") {
			let n = e.result;
			if (n.task && typeof n.task == "object") {
				let e = n.task;
				typeof e.taskId == "string" && (i = !0, this._taskProgressTokens.set(e.taskId, t));
			}
		}
		i || this._progressHandlers.delete(t), Ae(e) ? r(e) : r(Z.fromError(e.error.code, e.error.message, e.error.data));
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
					error: e instanceof Z ? e : new Z(R.InternalError, String(e))
				};
			}
			return;
		}
		let i;
		try {
			let r = await this.request(e, $e, n);
			if (r.task) i = r.task.taskId, yield {
				type: "taskCreated",
				task: r.task
			};
			else throw new Z(R.InternalError, "Task creation did not return a task");
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
						error: new Z(R.InternalError, `Task ${i} failed`)
					} : e.status === "cancelled" && (yield {
						type: "error",
						error: new Z(R.InternalError, `Task ${i} was cancelled`)
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
				error: e instanceof Z ? e : new Z(R.InternalError, String(e))
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
					[k]: s
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
				}).catch((e) => this._onerror(/* @__PURE__ */ Error(`Failed to send cancellation: ${e}`))), l(e instanceof Z ? e : new Z(R.RequestTimeout, String(e)));
			};
			this._responseHandlers.set(d, (e) => {
				if (!n?.signal?.aborted) {
					if (e instanceof Error) return l(e);
					try {
						let n = Gn(t, e.result);
						n.success ? c(n.data) : l(n.error);
					} catch (e) {
						l(e);
					}
				}
			}), n?.signal?.addEventListener("abort", () => {
				p(n?.signal?.reason);
			});
			let m = n?.timeout ?? 6e4;
			this._setupTimeout(d, m, n?.maxTotalTimeout, () => p(Z.fromError(R.RequestTimeout, "Request timed out", { timeout: m })), n?.resetTimeoutOnProgress ?? !1);
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
		}, nt, t);
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
		}, at, t);
	}
	async cancelTask(e, t) {
		return this.request({
			method: "tasks/cancel",
			params: e
		}, st, t);
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
						[k]: t.relatedTask
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
							[k]: t.relatedTask
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
					[k]: t.relatedTask
				}
			}
		}), await this._transport.send(r, t);
	}
	setRequestHandler(e, t) {
		let n = Jn(e);
		this.assertRequestHandlerCapability(n), this._requestHandlers.set(n, (n, r) => {
			let i = Yn(e, n);
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
		let n = Jn(e);
		this._notificationHandlers.set(n, (n) => {
			let r = Yn(e, n);
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
			for (let t of n) if (t.type === "request" && Ee(t.message)) {
				let n = t.message.id, r = this._requestResolvers.get(n);
				r ? (r(new Z(R.InternalError, "Task cancelled or completed")), this._requestResolvers.delete(n)) : this._onerror(/* @__PURE__ */ Error(`Resolver missing for request ${n} during task ${e} cleanup`));
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
				n(new Z(R.InvalidRequest, "Request cancelled"));
				return;
			}
			let i = setTimeout(e, r);
			t.addEventListener("abort", () => {
				clearTimeout(i), n(new Z(R.InvalidRequest, "Request cancelled"));
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
				if (!r) throw new Z(R.InvalidParams, "Failed to retrieve task: Task not found");
				return r;
			},
			storeTaskResult: async (e, r, i) => {
				await n.storeTaskResult(e, r, i, t);
				let a = await n.getTask(e, t);
				if (a) {
					let t = K.parse({
						method: "notifications/tasks/status",
						params: a
					});
					await this.notification(t), Q(a.status) && this._cleanupTaskProgressHandler(e);
				}
			},
			getTaskResult: (e) => n.getTaskResult(e, t),
			updateTaskStatus: async (e, r, i) => {
				let a = await n.getTask(e, t);
				if (!a) throw new Z(R.InvalidParams, `Task "${e}" not found - it may have been cleaned up`);
				if (Q(a.status)) throw new Z(R.InvalidParams, `Cannot update task "${e}" from terminal status "${a.status}" to "${r}". Terminal states (completed, failed, cancelled) cannot transition to other states.`);
				await n.updateTaskStatus(e, r, i, t);
				let o = await n.getTask(e, t);
				if (o) {
					let t = K.parse({
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
// node_modules/.pnpm/@modelcontextprotocol+ext-a_ab45c7b694ff6cf32e67aa6bf78fb752/node_modules/@modelcontextprotocol/ext-apps/dist/src/app-bridge.js
((t) => typeof e < "u" ? e : typeof Proxy < "u" ? new Proxy(t, { get: (t, n) => (typeof e < "u" ? e : t)[n] }) : t)(function(t) {
	if (typeof e < "u") return e.apply(this, arguments);
	throw Error("Dynamic require of \"" + t + "\" is not supported");
});
var Zn = class extends Xn {
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
}, Qn = "2026-01-26", $n = x([a("light"), a("dark")]).describe("Color theme preference for the host environment."), $ = x([
	a("inline"),
	a("fullscreen"),
	a("pip")
]).describe("Display mode for UI presentation."), er = x([
	a("--color-background-primary"),
	a("--color-background-secondary"),
	a("--color-background-tertiary"),
	a("--color-background-inverse"),
	a("--color-background-ghost"),
	a("--color-background-info"),
	a("--color-background-danger"),
	a("--color-background-success"),
	a("--color-background-warning"),
	a("--color-background-disabled"),
	a("--color-text-primary"),
	a("--color-text-secondary"),
	a("--color-text-tertiary"),
	a("--color-text-inverse"),
	a("--color-text-ghost"),
	a("--color-text-info"),
	a("--color-text-danger"),
	a("--color-text-success"),
	a("--color-text-warning"),
	a("--color-text-disabled"),
	a("--color-border-primary"),
	a("--color-border-secondary"),
	a("--color-border-tertiary"),
	a("--color-border-inverse"),
	a("--color-border-ghost"),
	a("--color-border-info"),
	a("--color-border-danger"),
	a("--color-border-success"),
	a("--color-border-warning"),
	a("--color-border-disabled"),
	a("--color-ring-primary"),
	a("--color-ring-secondary"),
	a("--color-ring-inverse"),
	a("--color-ring-info"),
	a("--color-ring-danger"),
	a("--color-ring-success"),
	a("--color-ring-warning"),
	a("--font-sans"),
	a("--font-mono"),
	a("--font-weight-normal"),
	a("--font-weight-medium"),
	a("--font-weight-semibold"),
	a("--font-weight-bold"),
	a("--font-text-xs-size"),
	a("--font-text-sm-size"),
	a("--font-text-md-size"),
	a("--font-text-lg-size"),
	a("--font-heading-xs-size"),
	a("--font-heading-sm-size"),
	a("--font-heading-md-size"),
	a("--font-heading-lg-size"),
	a("--font-heading-xl-size"),
	a("--font-heading-2xl-size"),
	a("--font-heading-3xl-size"),
	a("--font-text-xs-line-height"),
	a("--font-text-sm-line-height"),
	a("--font-text-md-line-height"),
	a("--font-text-lg-line-height"),
	a("--font-heading-xs-line-height"),
	a("--font-heading-sm-line-height"),
	a("--font-heading-md-line-height"),
	a("--font-heading-lg-line-height"),
	a("--font-heading-xl-line-height"),
	a("--font-heading-2xl-line-height"),
	a("--font-heading-3xl-line-height"),
	a("--border-radius-xs"),
	a("--border-radius-sm"),
	a("--border-radius-md"),
	a("--border-radius-lg"),
	a("--border-radius-xl"),
	a("--border-radius-full"),
	a("--border-width-regular"),
	a("--shadow-hairline"),
	a("--shadow-sm"),
	a("--shadow-md"),
	a("--shadow-lg")
]).describe("CSS variable keys available to MCP apps for theming."), tr = D(er.describe("Style variables for theming MCP apps.\n\nIndividual style keys are optional - hosts may provide any subset of these values.\nValues are strings containing CSS values (colors, sizes, font stacks, etc.).\n\nNote: This type uses `Record<K, string | undefined>` rather than `Partial<Record<K, string>>`\nfor compatibility with Zod schema generation. Both are functionally equivalent for validation."), x([u(), p()]).describe("Style variables for theming MCP apps.\n\nIndividual style keys are optional - hosts may provide any subset of these values.\nValues are strings containing CSS values (colors, sizes, font stacks, etc.).\n\nNote: This type uses `Record<K, string | undefined>` rather than `Partial<Record<K, string>>`\nfor compatibility with Zod schema generation. Both are functionally equivalent for validation.")).describe("Style variables for theming MCP apps.\n\nIndividual style keys are optional - hosts may provide any subset of these values.\nValues are strings containing CSS values (colors, sizes, font stacks, etc.).\n\nNote: This type uses `Record<K, string | undefined>` rather than `Partial<Record<K, string>>`\nfor compatibility with Zod schema generation. Both are functionally equivalent for validation."), nr = y({
	method: a("ui/open-link"),
	params: y({ url: u().describe("URL to open in the host's browser") })
});
y({ isError: o().optional().describe("True if the host failed to open the URL (e.g., due to security policy).") }).passthrough(), y({ isError: o().optional().describe("True if the download failed (e.g., user cancelled or host denied).") }).passthrough(), y({ isError: o().optional().describe("True if the host rejected or failed to deliver the message.") }).passthrough();
var rr = y({
	method: a("ui/notifications/sandbox-proxy-ready"),
	params: y({})
}), ir = y({
	connectDomains: h(u()).optional().describe("Origins for network requests (fetch/XHR/WebSocket).\n\n- Maps to CSP `connect-src` directive\n- Empty or omitted → no network connections (secure default)"),
	resourceDomains: h(u()).optional().describe("Origins for static resources (images, scripts, stylesheets, fonts, media).\n\n- Maps to CSP `img-src`, `script-src`, `style-src`, `font-src`, `media-src` directives\n- Wildcard subdomains supported: `https://*.example.com`\n- Empty or omitted → no network resources (secure default)"),
	frameDomains: h(u()).optional().describe("Origins for nested iframes.\n\n- Maps to CSP `frame-src` directive\n- Empty or omitted → no nested iframes allowed (`frame-src 'none'`)"),
	baseUriDomains: h(u()).optional().describe("Allowed base URIs for the document.\n\n- Maps to CSP `base-uri` directive\n- Empty or omitted → only same origin allowed (`base-uri 'self'`)")
}), ar = y({
	camera: y({}).optional().describe("Request camera access.\n\nMaps to Permission Policy `camera` feature."),
	microphone: y({}).optional().describe("Request microphone access.\n\nMaps to Permission Policy `microphone` feature."),
	geolocation: y({}).optional().describe("Request geolocation access.\n\nMaps to Permission Policy `geolocation` feature."),
	clipboardWrite: y({}).optional().describe("Request clipboard write access.\n\nMaps to Permission Policy `clipboard-write` feature.")
}), or = y({
	method: a("ui/notifications/size-changed"),
	params: y({
		width: _().optional().describe("New width in pixels."),
		height: _().optional().describe("New height in pixels.")
	})
});
y({
	method: a("ui/notifications/tool-input"),
	params: y({ arguments: D(u(), b().describe("Complete tool call arguments as key-value pairs.")).optional().describe("Complete tool call arguments as key-value pairs.") })
}), y({
	method: a("ui/notifications/tool-input-partial"),
	params: y({ arguments: D(u(), b().describe("Partial tool call arguments (incomplete, may change).")).optional().describe("Partial tool call arguments (incomplete, may change).") })
}), y({
	method: a("ui/notifications/tool-cancelled"),
	params: y({ reason: u().optional().describe("Optional reason for the cancellation (e.g., \"user action\", \"timeout\").") })
});
var sr = y({ fonts: u().optional() }), cr = y({
	variables: tr.optional().describe("CSS variables for theming the app."),
	css: sr.optional().describe("CSS blocks that apps can inject.")
});
y({
	method: a("ui/resource-teardown"),
	params: y({})
});
var lr = D(u(), b()), ur = y({
	text: y({}).optional().describe("Host supports text content blocks."),
	image: y({}).optional().describe("Host supports image content blocks."),
	audio: y({}).optional().describe("Host supports audio content blocks."),
	resource: y({}).optional().describe("Host supports resource content blocks."),
	resourceLink: y({}).optional().describe("Host supports resource link content blocks."),
	structuredContent: y({}).optional().describe("Host supports structured content.")
}), dr = y({
	method: a("ui/notifications/request-teardown"),
	params: y({}).optional()
}), fr = y({
	experimental: D(u(), D(u(), m()).describe("Experimental features keyed by identifier.")).optional().describe("Experimental features keyed by identifier."),
	openLinks: y({}).optional().describe("Host supports opening external URLs."),
	downloadFile: y({}).optional().describe("Host supports file downloads via ui/download-file."),
	serverTools: y({ listChanged: o().optional().describe("Host supports tools/list_changed notifications.") }).optional().describe("Host can proxy tool calls to the MCP server."),
	serverResources: y({ listChanged: o().optional().describe("Host supports resources/list_changed notifications.") }).optional().describe("Host can proxy resource reads to the MCP server."),
	logging: y({}).optional().describe("Host accepts log messages."),
	sandbox: y({
		permissions: ar.optional().describe("Permissions granted by the host (camera, microphone, geolocation)."),
		csp: ir.optional().describe("CSP domains approved by the host.")
	}).optional().describe("Sandbox configuration applied by the host."),
	updateModelContext: ur.optional().describe("Host accepts context updates (ui/update-model-context) to be included in the model's context for future turns."),
	message: ur.optional().describe("Host supports receiving content messages (ui/message) from the view."),
	sampling: y({ tools: y({}).optional().describe("Host supports tool use via `tools` and `toolChoice` parameters.") }).optional().describe("Host supports LLM sampling (sampling/createMessage) from the view.\nMirrors the MCP `ClientCapabilities.sampling` shape so hosts can pass it through.")
}), pr = y({
	experimental: D(u(), D(u(), m()).describe("Experimental features keyed by identifier.")).optional().describe("Experimental features keyed by identifier."),
	tools: y({ listChanged: o().optional().describe("App supports tools/list_changed notifications.") }).optional().describe("App exposes MCP-style tools that the host can call."),
	availableDisplayModes: h($).optional().describe("Display modes the app supports.")
}), mr = y({
	method: a("ui/notifications/initialized"),
	params: y({}).optional()
});
y({
	csp: ir.optional().describe("Content Security Policy configuration for UI resources."),
	permissions: ar.optional().describe("Sandbox permissions requested by the UI resource."),
	domain: u().optional().describe("Dedicated origin for view sandbox.\n\nUseful when views need stable, dedicated origins for OAuth callbacks, CORS policies, or API key allowlists.\n\n**Host-dependent:** The format and validation rules for this field are determined by each host. Servers MUST consult host-specific documentation for the expected domain format. Common patterns include:\n- Hash-based subdomains (e.g., `{hash}.claudemcpcontent.com`)\n- URL-derived subdomains (e.g., `www-example-com.oaiusercontent.com`)\n\nIf omitted, host uses default sandbox origin (typically per-conversation)."),
	prefersBorder: o().optional().describe("Visual boundary preference - true if view prefers a visible border.\n\nBoolean requesting whether a visible border and background is provided by the host. Specifying an explicit value for this is recommended because hosts' defaults may vary.\n\n- `true`: request visible border + background\n- `false`: request no visible border + background\n- omitted: host decides border")
});
var hr = y({
	method: a("ui/request-display-mode"),
	params: y({ mode: $.describe("The display mode being requested.") })
});
y({ mode: $.describe("The display mode that was actually set. May differ from requested if not supported.") }).passthrough();
var gr = x([a("model"), a("app")]).describe("Tool visibility scope - who can access the tool.");
y({
	resourceUri: u().optional(),
	visibility: h(gr).optional().describe("Who can access this tool. Default: [\"model\", \"app\"]\n- \"model\": Tool visible to and callable by the agent\n- \"app\": Tool callable by the app from this server only"),
	csp: c().optional(),
	permissions: c().optional()
}), y({ mimeTypes: h(u()).optional().describe("Array of supported MIME types for UI resources.\nMust include `\"text/html;profile=mcp-app\"` for MCP Apps support.") });
var _r = y({
	method: a("ui/download-file"),
	params: y({ contents: h(x([zt, Bt])).describe("Resource contents to download — embedded (inline data) or linked (host fetches). Uses standard MCP resource types.") })
}), vr = y({
	method: a("ui/message"),
	params: y({
		role: a("user").describe("Message role, currently only \"user\" is supported."),
		content: h(Y).describe("Message content blocks (text, image, etc.).")
	})
});
y({
	method: a("ui/notifications/sandbox-resource-ready"),
	params: y({
		html: u().describe("HTML content to load into the inner iframe."),
		sandbox: u().optional().describe("Optional override for the inner iframe's sandbox attribute."),
		csp: ir.optional().describe("CSP configuration from resource metadata."),
		permissions: ar.optional().describe("Sandbox permissions from resource metadata.")
	})
}), y({
	method: a("ui/notifications/tool-result"),
	params: X.describe("Standard MCP tool execution result.")
});
var yr = y({
	toolInfo: y({
		id: L.optional().describe("JSON-RPC id of the tools/call request."),
		tool: Kt.describe("Tool definition including name, inputSchema, etc.")
	}).optional().describe("Metadata of the tool call that instantiated this App."),
	theme: $n.optional().describe("Current color theme preference."),
	styles: cr.optional().describe("Style configuration for theming the app."),
	displayMode: $.optional().describe("How the UI is currently displayed."),
	availableDisplayModes: h($).optional().describe("Display modes the host supports."),
	containerDimensions: x([y({ height: _().describe("Fixed container height in pixels.") }), y({ maxHeight: x([_(), p()]).optional().describe("Maximum container height in pixels.") })]).and(x([y({ width: _().describe("Fixed container width in pixels.") }), y({ maxWidth: x([_(), p()]).optional().describe("Maximum container width in pixels.") })])).optional().describe("Container dimensions. Represents the dimensions of the iframe or other\ncontainer holding the app. Specify either width or maxWidth, and either height or maxHeight."),
	locale: u().optional().describe("User's language and region preference in BCP 47 format."),
	timeZone: u().optional().describe("User's timezone in IANA format."),
	userAgent: u().optional().describe("Host application identifier."),
	platform: x([
		a("web"),
		a("desktop"),
		a("mobile")
	]).optional().describe("Platform type for responsive design decisions."),
	deviceCapabilities: y({
		touch: o().optional().describe("Whether the device supports touch input."),
		hover: o().optional().describe("Whether the device supports hover interactions.")
	}).optional().describe("Device input capabilities."),
	safeAreaInsets: y({
		top: _().describe("Top safe area inset in pixels."),
		right: _().describe("Right safe area inset in pixels."),
		bottom: _().describe("Bottom safe area inset in pixels."),
		left: _().describe("Left safe area inset in pixels.")
	}).optional().describe("Mobile safe area boundaries in pixels.")
}).passthrough();
y({
	method: a("ui/notifications/host-context-changed"),
	params: yr.describe("Partial context update containing only changed fields.")
});
var br = y({
	method: a("ui/update-model-context"),
	params: y({
		content: h(Y).optional().describe("Context content blocks (text, image, etc.)."),
		structuredContent: D(u(), b().describe("Structured content for machine-readable context data.")).optional().describe("Structured content for machine-readable context data.")
	})
}), xr = y({
	method: a("ui/initialize"),
	params: y({
		appInfo: V.describe("App identification (name and version)."),
		appCapabilities: pr.describe("Features and capabilities this app provides."),
		protocolVersion: u().describe("Protocol version this app supports.")
	})
});
y({
	protocolVersion: u().describe("Negotiated protocol version string (e.g., \"2025-11-21\")."),
	hostInfo: V.describe("Host application identification and version."),
	hostCapabilities: fr.describe("Features and capabilities provided by the host."),
	hostContext: yr.describe("Rich context about the host environment.")
}).passthrough();
var Sr = class {
	eventTarget;
	eventSource;
	messageListener;
	constructor(e = window.parent, t) {
		this.eventTarget = e, this.eventSource = t, this.messageListener = (e) => {
			if (t && e.source !== this.eventSource) {
				console.debug("Ignoring message from unknown source", e);
				return;
			}
			let n = Ne.safeParse(e.data);
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
}, Cr = [Qn], wr = class extends Zn {
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
		sizechange: or,
		sandboxready: rr,
		initialized: mr,
		requestteardown: dr,
		loggingmessage: nn
	};
	constructor(e, t, n, r) {
		super(r), this._client = e, this._hostInfo = t, this._capabilities = n, this.addEventListener("initialized", () => {
			this._initializedReceived = !0;
		}), this._hostContext = r?.hostContext || {}, this.setRequestHandler(xr, (e) => this._oninitialize(e)), this.setRequestHandler(H, (e, t) => (this.onping?.(e.params, t), {})), this.replaceRequestHandler(hr, (e) => ({ mode: this._hostContext.displayMode ?? "inline" }));
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
		this.warnIfRequestHandlerReplaced("onmessage", this._onmessage, e), this._onmessage = e, this.replaceRequestHandler(vr, async (e, t) => {
			if (!this._onmessage) throw Error("No onmessage handler set");
			return this._onmessage(e.params, t);
		});
	}
	_onopenlink;
	get onopenlink() {
		return this._onopenlink;
	}
	set onopenlink(e) {
		this.warnIfRequestHandlerReplaced("onopenlink", this._onopenlink, e), this._onopenlink = e, this.replaceRequestHandler(nr, async (e, t) => {
			if (!this._onopenlink) throw Error("No onopenlink handler set");
			return this._onopenlink(e.params, t);
		});
	}
	_ondownloadfile;
	get ondownloadfile() {
		return this._ondownloadfile;
	}
	set ondownloadfile(e) {
		this.warnIfRequestHandlerReplaced("ondownloadfile", this._ondownloadfile, e), this._ondownloadfile = e, this.replaceRequestHandler(_r, async (e, t) => {
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
		this.warnIfRequestHandlerReplaced("onrequestdisplaymode", this._onrequestdisplaymode, e), this._onrequestdisplaymode = e, this.replaceRequestHandler(hr, async (e, t) => {
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
		this.warnIfRequestHandlerReplaced("onupdatemodelcontext", this._onupdatemodelcontext, e), this._onupdatemodelcontext = e, this.replaceRequestHandler(br, async (e, t) => {
			if (!this._onupdatemodelcontext) throw Error("No onupdatemodelcontext handler set");
			return this._onupdatemodelcontext(e.params, t);
		});
	}
	_oncalltool;
	get oncalltool() {
		return this._oncalltool;
	}
	set oncalltool(e) {
		this.warnIfRequestHandlerReplaced("oncalltool", this._oncalltool, e), this._oncalltool = e, this.replaceRequestHandler(Xt, async (e, t) => {
			if (!this._oncalltool) throw Error("No oncalltool handler set");
			return this._oncalltool(e.params, t);
		});
	}
	set oncreatesamplingmessage(e) {
		this.setRequestHandler(fn, async (t, n) => e(t.params, n));
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
		this.warnIfRequestHandlerReplaced("onlistresources", this._onlistresources, e), this._onlistresources = e, this.replaceRequestHandler(mt, async (e, t) => {
			if (!this._onlistresources) throw Error("No onlistresources handler set");
			return this._onlistresources(e.params, t);
		});
	}
	_onlistresourcetemplates;
	get onlistresourcetemplates() {
		return this._onlistresourcetemplates;
	}
	set onlistresourcetemplates(e) {
		this.warnIfRequestHandlerReplaced("onlistresourcetemplates", this._onlistresourcetemplates, e), this._onlistresourcetemplates = e, this.replaceRequestHandler(gt, async (e, t) => {
			if (!this._onlistresourcetemplates) throw Error("No onlistresourcetemplates handler set");
			return this._onlistresourcetemplates(e.params, t);
		});
	}
	_onreadresource;
	get onreadresource() {
		return this._onreadresource;
	}
	set onreadresource(e) {
		this.warnIfRequestHandlerReplaced("onreadresource", this._onreadresource, e), this._onreadresource = e, this.replaceRequestHandler(bt, async (e, t) => {
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
		this.warnIfRequestHandlerReplaced("onlistprompts", this._onlistprompts, e), this._onlistprompts = e, this.replaceRequestHandler(jt, async (e, t) => {
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
			protocolVersion: Cr.includes(t) ? t : Qn,
			hostCapabilities: this.getCapabilities(),
			hostInfo: this._hostInfo,
			hostContext: this._hostContext
		};
	}
	setHostContext(e) {
		let t = {}, n = !1;
		for (let r of Object.keys(e)) {
			let i = this._hostContext[r], a = e[r];
			Tr(i, a) || (t[r] = a, n = !0);
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
		}, lr, t);
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
		}, Jt, t);
	}
	async connect(e) {
		if (this.transport) throw Error("AppBridge is already connected. Call close() before connecting again.");
		if (this._initializedReceived = !1, this._client) {
			let e = this._client.getServerCapabilities();
			if (!e) throw Error("Client server capabilities not available");
			e.tools && (this.oncalltool = async (e, t) => this._client.request({
				method: "tools/call",
				params: e
			}, X, { signal: t.signal }), e.tools.listChanged && this._client.setNotificationHandler(Zt, (e) => this.sendToolListChanged(e.params))), e.resources && (this.onlistresources = async (e, t) => this._client.request({
				method: "resources/list",
				params: e
			}, ht, { signal: t.signal }), this.onlistresourcetemplates = async (e, t) => this._client.request({
				method: "resources/templates/list",
				params: e
			}, _t, { signal: t.signal }), this.onreadresource = async (e, t) => this._client.request({
				method: "resources/read",
				params: e
			}, xt, { signal: t.signal }), e.resources.listChanged && this._client.setNotificationHandler(St, (e) => this.sendResourceListChanged(e.params))), e.prompts && (this.onlistprompts = async (e, t) => this._client.request({
				method: "prompts/list",
				params: e
			}, Mt, { signal: t.signal }), e.prompts.listChanged && this._client.setNotificationHandler(Ut, (e) => this.sendPromptListChanged(e.params)));
		}
		return super.connect(e);
	}
};
function Tr(e, t) {
	return JSON.stringify(e) === JSON.stringify(t);
}
// node_modules/.pnpm/@copilotkit+mcp-apps-render_930531415c0c853efe006375fdb5b352/node_modules/@copilotkit/mcp-apps-renderer/dist/session.mjs
function Er(e) {
	try {
		return JSON.stringify(e) ?? "";
	} catch {
		return "";
	}
}
function Dr(e) {
	try {
		let t = atob(e), n = Uint8Array.from(t, (e) => e.charCodeAt(0));
		return new TextDecoder().decode(n);
	} catch {
		throw Error("The MCP App resource contains invalid base64 content.");
	}
}
function Or(e, t, n = !1) {
	return e?.find((e) => e.uri === t) || (!n && e?.length === 1 ? e[0] : void 0);
}
function kr(e) {
	return JSON.stringify([
		e.resourceUri ?? null,
		e.serverHash ?? null,
		e.serverId ?? null
	]);
}
var Ar = Qn, jr = C({
	method: T("ui/message"),
	params: C({
		role: E().optional(),
		content: te(re()).optional(),
		followUp: S().optional(),
		_meta: ne(E(), re()).optional()
	}).passthrough()
}), Mr = {
	idleTimeoutMs: fe,
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
}, Nr = (e) => {
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
function Pr(e) {
	let { iframe: t, getContent: n, getAgent: i, host: a, messageId: o, hooks: s, options: c, openLinkPolicy: l = Nr, cancelFollowUpsOnTeardown: u = !1 } = e, d = {
		...Mr,
		...c
	}, f = kr(n()), p = {}, m = !1, h = !1, g = null, _, v, y, b, x, ee = null, S, C = !1, te = !1, w = () => {
		h && g && (_ !== void 0 && (g.sendToolInput({ arguments: _ }), _ = void 0), v !== void 0 && (g.sendToolResult(v), v = void 0));
	}, T = (e, t) => {
		let n = Er(e);
		n !== x && (x = n, s?.onContentError?.(/* @__PURE__ */ Error(`[MCPAppsRenderer] Activity content for message "${o ?? "(no id)"}" does not match the MCP Apps content schema, so it was not forwarded to the widget: ${t.message}`)));
	}, E = () => {
		x !== void 0 && (x = void 0, s?.onContentError?.(null));
	}, ne = (e) => {
		let t = r.safeParse(e);
		if (!t.success) {
			T(e, t.error);
			return;
		}
		let n = t.data;
		if (kr(n) !== f) return;
		let { toolInput: i } = n, a = n.result;
		if (E(), i !== void 0) {
			let e = Er(i);
			e !== y && (y = e, _ = i, w());
		}
		if (a !== void 0) {
			let e = Er(a);
			e !== b && (b = e, v = a, w());
		}
	}, D = (e) => {
		if (m || !o) return;
		let t = (e ?? i()?.messages)?.find((e) => e?.id === o);
		if (!t || t.activityType !== "mcp-apps") return;
		let n = r.safeParse(t.content);
		n.success ? ne(n.data) : T(t.content, n.error);
	}, re = () => !!(i()?.messages)?.some((e) => e?.id === o && e?.activityType === "mcp-apps"), ae = async () => {
		let t = i();
		if (!t) throw Error("No agent available to fetch resource");
		let { resourceUri: r, serverHash: a, serverId: o } = n(), s = t, c = (await O.enqueue(t, () => {
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
		})).result, l = Or(c?.contents, r, e.requireExactResourceUri);
		if (!l) throw Error("No resource content in response");
		return l;
	}, se = () => {
		if (m) return;
		m = !0, S !== void 0 && (clearTimeout(S), S = void 0), O.cancelOwner(p), ee?.unsubscribe(), ee = null;
		let e = g;
		g = null, e?.close();
	};
	return (async () => {
		try {
			let c = await ae();
			if (m) return;
			s?.onResource?.(c);
			let f = le(d.allowSameOriginFallback);
			t.setAttribute("sandbox", f), t.setAttribute("data-testid", "mcp-app-iframe"), t.setAttribute("title", "Interactive MCP application");
			let x = c._meta?.ui?.csp?.resourceDomains;
			t.srcdoc = de(x);
			let T = t.contentWindow;
			if (!T) throw Error("Sandbox iframe has no contentWindow");
			let E;
			if (c.text) E = c.text;
			else if (c.blob) E = Dr(c.blob);
			else throw Error("Resource has no text or blob content");
			g = new wr(null, d.hostInfo, d.hostCapabilities, { hostContext: {
				theme: t.closest(".dark") ? "dark" : "light",
				...d.hostContext
			} }), S = setTimeout(() => {
				m || C || (te = !0, s?.onError?.(/* @__PURE__ */ Error(`[MCPAppsRenderer] Timed out after ${d.initializationTimeoutMs}ms waiting for the MCP App sandbox to initialize.`)), se());
			}, d.initializationTimeoutMs), g.onsandboxready = () => {
				te ? console.warn("[MCPAppsRenderer] Ignoring a sandbox handshake that arrived after the initialization timeout.") : (C = !0, S !== void 0 && (clearTimeout(S), S = void 0), g?.sendSandboxResourceReady({
					html: E,
					sandbox: f
				}).then(() => {
					m || s?.onSandboxReady?.();
				}));
			}, g.setRequestHandler(jr, async (t) => {
				let n = i();
				if (!n) return console.warn("[MCPAppsRenderer] ui/message: No agent available"), { isError: !1 };
				try {
					let r = t.params, i = r._meta?.copilotkit ?? {}, o = i.role || r.role || "user", c = r.content?.filter((e) => e.type === "text" && e.text).map((e) => e.text).join("\n") || "";
					if (c && n.addMessage({
						id: ie(),
						role: o,
						content: c
					}), (i.followUp ?? r.followUp ?? o === "user") && c) {
						let t = n.threadId || "default";
						O.enqueue(n, () => oe({
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
					c = await O.enqueue(s, () => s.runAgent({ forwardedProps: { __proxiedMCPRequest: {
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
					throw e instanceof pe ? Error(`tools/call was not executed: ${e.message} Retry from the current thread.`, { cause: e }) : e;
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
				m || (h = !0, s?.onInitialized?.(), o && re() && (_ = void 0, v = void 0, y = void 0, b = void 0, D()), w());
			}, g.onloggingmessage = (e) => {
				console.log("[MCPAppsRenderer] App log:", e);
			};
			let ne = new Sr(T, T);
			if (await g.connect(ne), m) {
				await g.close(), g = null;
				return;
			}
			o && (ee = i()?.subscribe({ onMessagesChanged: ({ messages: e }) => D(e) }) ?? null);
		} catch (e) {
			console.error("[MCPAppsRenderer] Setup error:", e), m || s?.onError?.(e instanceof Error ? e : Error(String(e)));
		}
	})(), {
		sendToolInput(e) {
			_ = e, w();
		},
		sendToolResult(e) {
			v = r.shape.result.parse(e), w();
		},
		syncContent(e) {
			o && re() || ne(e);
		},
		teardown() {
			se();
		}
	};
}
export { r as MCPAppsActivityContentSchema, t as MCPAppsActivityType, pe as MCPAppsQueueThreadChangedError, _e as MCPAppsRequestQueue, Ar as MCP_APPS_PROTOCOL_VERSION, fe as MCP_APPS_QUEUE_IDLE_TIMEOUT_MS, Mr as MCP_APPS_SESSION_DEFAULTS, n as MCP_OPEN_LINK_BLOCKED_SCHEMES, Pr as bindMcpApp, de as buildSandboxHTML, Nr as denyDangerousSchemes, O as mcpAppsRequestQueue, Dr as ɵdecodeBase64, le as ɵmcpAppSandboxFlags, oe as ɵrunMcpFollowUp };
