import { i as e, n as t, t as n } from "./rolldown-runtime-CwxnZyOB.js";
import { t as r } from "./katex-CAh0cWmK.js";
// node_modules/react/cjs/react.production.js
var i = /* @__PURE__ */ n(((e) => {
	var t = Symbol.for("react.transitional.element"), n = Symbol.for("react.portal"), r = Symbol.for("react.fragment"), i = Symbol.for("react.strict_mode"), a = Symbol.for("react.profiler"), o = Symbol.for("react.consumer"), s = Symbol.for("react.context"), c = Symbol.for("react.forward_ref"), l = Symbol.for("react.suspense"), u = Symbol.for("react.memo"), d = Symbol.for("react.lazy"), f = Symbol.for("react.activity"), p = Symbol.iterator;
	function m(e) {
		return typeof e != "object" || !e ? null : (e = p && e[p] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var h = {
		isMounted: function() {
			return !1;
		},
		enqueueForceUpdate: function() {},
		enqueueReplaceState: function() {},
		enqueueSetState: function() {}
	}, g = Object.assign, _ = {};
	function v(e, t, n) {
		this.props = e, this.context = t, this.refs = _, this.updater = n || h;
	}
	v.prototype.isReactComponent = {}, v.prototype.setState = function(e, t) {
		if (typeof e != "object" && typeof e != "function" && e != null) throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
		this.updater.enqueueSetState(this, e, t, "setState");
	}, v.prototype.forceUpdate = function(e) {
		this.updater.enqueueForceUpdate(this, e, "forceUpdate");
	};
	function y() {}
	y.prototype = v.prototype;
	function b(e, t, n) {
		this.props = e, this.context = t, this.refs = _, this.updater = n || h;
	}
	var ee = b.prototype = new y();
	ee.constructor = b, g(ee, v.prototype), ee.isPureReactComponent = !0;
	var te = Array.isArray;
	function x() {}
	var S = {
		H: null,
		A: null,
		T: null,
		S: null
	}, C = Object.prototype.hasOwnProperty;
	function ne(e, n, r) {
		var i = r.ref;
		return {
			$$typeof: t,
			type: e,
			key: n,
			ref: i === void 0 ? null : i,
			props: r
		};
	}
	function re(e, t) {
		return ne(e.type, t, e.props);
	}
	function w(e) {
		return typeof e == "object" && !!e && e.$$typeof === t;
	}
	function ie(e) {
		var t = {
			"=": "=0",
			":": "=2"
		};
		return "$" + e.replace(/[=:]/g, function(e) {
			return t[e];
		});
	}
	var ae = /\/+/g;
	function oe(e, t) {
		return typeof e == "object" && e && e.key != null ? ie("" + e.key) : t.toString(36);
	}
	function se(e) {
		switch (e.status) {
			case "fulfilled": return e.value;
			case "rejected": throw e.reason;
			default: switch (typeof e.status == "string" ? e.then(x, x) : (e.status = "pending", e.then(function(t) {
				e.status === "pending" && (e.status = "fulfilled", e.value = t);
			}, function(t) {
				e.status === "pending" && (e.status = "rejected", e.reason = t);
			})), e.status) {
				case "fulfilled": return e.value;
				case "rejected": throw e.reason;
			}
		}
		throw e;
	}
	function ce(e, r, i, a, o) {
		var s = typeof e;
		(s === "undefined" || s === "boolean") && (e = null);
		var c = !1;
		if (e === null) c = !0;
		else switch (s) {
			case "bigint":
			case "string":
			case "number":
				c = !0;
				break;
			case "object": switch (e.$$typeof) {
				case t:
				case n:
					c = !0;
					break;
				case d: return c = e._init, ce(c(e._payload), r, i, a, o);
			}
		}
		if (c) return o = o(e), c = a === "" ? "." + oe(e, 0) : a, te(o) ? (i = "", c != null && (i = c.replace(ae, "$&/") + "/"), ce(o, r, i, "", function(e) {
			return e;
		})) : o != null && (w(o) && (o = re(o, i + (o.key == null || e && e.key === o.key ? "" : ("" + o.key).replace(ae, "$&/") + "/") + c)), r.push(o)), 1;
		c = 0;
		var l = a === "" ? "." : a + ":";
		if (te(e)) for (var u = 0; u < e.length; u++) a = e[u], s = l + oe(a, u), c += ce(a, r, i, s, o);
		else if (u = m(e), typeof u == "function") for (e = u.call(e), u = 0; !(a = e.next()).done;) a = a.value, s = l + oe(a, u++), c += ce(a, r, i, s, o);
		else if (s === "object") {
			if (typeof e.then == "function") return ce(se(e), r, i, a, o);
			throw r = String(e), Error("Objects are not valid as a React child (found: " + (r === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : r) + "). If you meant to render a collection of children, use an array instead.");
		}
		return c;
	}
	function le(e, t, n) {
		if (e == null) return e;
		var r = [], i = 0;
		return ce(e, r, "", "", function(e) {
			return t.call(n, e, i++);
		}), r;
	}
	function ue(e) {
		if (e._status === -1) {
			var t = e._result;
			t = t(), t.then(function(t) {
				(e._status === 0 || e._status === -1) && (e._status = 1, e._result = t);
			}, function(t) {
				(e._status === 0 || e._status === -1) && (e._status = 2, e._result = t);
			}), e._status === -1 && (e._status = 0, e._result = t);
		}
		if (e._status === 1) return e._result.default;
		throw e._result;
	}
	var T = typeof reportError == "function" ? reportError : function(e) {
		if (typeof window == "object" && typeof window.ErrorEvent == "function") {
			var t = new window.ErrorEvent("error", {
				bubbles: !0,
				cancelable: !0,
				message: typeof e == "object" && e && typeof e.message == "string" ? String(e.message) : String(e),
				error: e
			});
			if (!window.dispatchEvent(t)) return;
		} else if (typeof process == "object" && typeof process.emit == "function") {
			process.emit("uncaughtException", e);
			return;
		}
		console.error(e);
	}, de = {
		map: le,
		forEach: function(e, t, n) {
			le(e, function() {
				t.apply(this, arguments);
			}, n);
		},
		count: function(e) {
			var t = 0;
			return le(e, function() {
				t++;
			}), t;
		},
		toArray: function(e) {
			return le(e, function(e) {
				return e;
			}) || [];
		},
		only: function(e) {
			if (!w(e)) throw Error("React.Children.only expected to receive a single React element child.");
			return e;
		}
	};
	e.Activity = f, e.Children = de, e.Component = v, e.Fragment = r, e.Profiler = a, e.PureComponent = b, e.StrictMode = i, e.Suspense = l, e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = S, e.__COMPILER_RUNTIME = {
		__proto__: null,
		c: function(e) {
			return S.H.useMemoCache(e);
		}
	}, e.cache = function(e) {
		return function() {
			return e.apply(null, arguments);
		};
	}, e.cacheSignal = function() {
		return null;
	}, e.cloneElement = function(e, t, n) {
		if (e == null) throw Error("The argument must be a React element, but you passed " + e + ".");
		var r = g({}, e.props), i = e.key;
		if (t != null) for (a in t.key !== void 0 && (i = "" + t.key), t) !C.call(t, a) || a === "key" || a === "__self" || a === "__source" || a === "ref" && t.ref === void 0 || (r[a] = t[a]);
		var a = arguments.length - 2;
		if (a === 1) r.children = n;
		else if (1 < a) {
			for (var o = Array(a), s = 0; s < a; s++) o[s] = arguments[s + 2];
			r.children = o;
		}
		return ne(e.type, i, r);
	}, e.createContext = function(e) {
		return e = {
			$$typeof: s,
			_currentValue: e,
			_currentValue2: e,
			_threadCount: 0,
			Provider: null,
			Consumer: null
		}, e.Provider = e, e.Consumer = {
			$$typeof: o,
			_context: e
		}, e;
	}, e.createElement = function(e, t, n) {
		var r, i = {}, a = null;
		if (t != null) for (r in t.key !== void 0 && (a = "" + t.key), t) C.call(t, r) && r !== "key" && r !== "__self" && r !== "__source" && (i[r] = t[r]);
		var o = arguments.length - 2;
		if (o === 1) i.children = n;
		else if (1 < o) {
			for (var s = Array(o), c = 0; c < o; c++) s[c] = arguments[c + 2];
			i.children = s;
		}
		if (e && e.defaultProps) for (r in o = e.defaultProps, o) i[r] === void 0 && (i[r] = o[r]);
		return ne(e, a, i);
	}, e.createRef = function() {
		return { current: null };
	}, e.forwardRef = function(e) {
		return {
			$$typeof: c,
			render: e
		};
	}, e.isValidElement = w, e.lazy = function(e) {
		return {
			$$typeof: d,
			_payload: {
				_status: -1,
				_result: e
			},
			_init: ue
		};
	}, e.memo = function(e, t) {
		return {
			$$typeof: u,
			type: e,
			compare: t === void 0 ? null : t
		};
	}, e.startTransition = function(e) {
		var t = S.T, n = {};
		S.T = n;
		try {
			var r = e(), i = S.S;
			i !== null && i(n, r), typeof r == "object" && r && typeof r.then == "function" && r.then(x, T);
		} catch (e) {
			T(e);
		} finally {
			t !== null && n.types !== null && (t.types = n.types), S.T = t;
		}
	}, e.unstable_useCacheRefresh = function() {
		return S.H.useCacheRefresh();
	}, e.use = function(e) {
		return S.H.use(e);
	}, e.useActionState = function(e, t, n) {
		return S.H.useActionState(e, t, n);
	}, e.useCallback = function(e, t) {
		return S.H.useCallback(e, t);
	}, e.useContext = function(e) {
		return S.H.useContext(e);
	}, e.useDebugValue = function() {}, e.useDeferredValue = function(e, t) {
		return S.H.useDeferredValue(e, t);
	}, e.useEffect = function(e, t) {
		return S.H.useEffect(e, t);
	}, e.useEffectEvent = function(e) {
		return S.H.useEffectEvent(e);
	}, e.useId = function() {
		return S.H.useId();
	}, e.useImperativeHandle = function(e, t, n) {
		return S.H.useImperativeHandle(e, t, n);
	}, e.useInsertionEffect = function(e, t) {
		return S.H.useInsertionEffect(e, t);
	}, e.useLayoutEffect = function(e, t) {
		return S.H.useLayoutEffect(e, t);
	}, e.useMemo = function(e, t) {
		return S.H.useMemo(e, t);
	}, e.useOptimistic = function(e, t) {
		return S.H.useOptimistic(e, t);
	}, e.useReducer = function(e, t, n) {
		return S.H.useReducer(e, t, n);
	}, e.useRef = function(e) {
		return S.H.useRef(e);
	}, e.useState = function(e) {
		return S.H.useState(e);
	}, e.useSyncExternalStore = function(e, t, n) {
		return S.H.useSyncExternalStore(e, t, n);
	}, e.useTransition = function() {
		return S.H.useTransition();
	}, e.version = "19.2.0";
})), a = /* @__PURE__ */ n(((e, t) => {
	t.exports = i();
})), o = /* @__PURE__ */ n(((e) => {
	var t = Symbol.for("react.transitional.element"), n = Symbol.for("react.fragment");
	function r(e, n, r) {
		var i = null;
		if (r !== void 0 && (i = "" + r), n.key !== void 0 && (i = "" + n.key), "key" in n) for (var a in r = {}, n) a !== "key" && (r[a] = n[a]);
		else r = n;
		return n = r.ref, {
			$$typeof: t,
			type: e,
			key: i,
			ref: n === void 0 ? null : n,
			props: r
		};
	}
	e.Fragment = n, e.jsx = r, e.jsxs = r;
})), s = /* @__PURE__ */ n(((e, t) => {
	t.exports = o();
})), c = (function(e) {
	if (e == null) return p;
	if (typeof e == "function") return f(e);
	if (typeof e == "object") return Array.isArray(e) ? l(e) : u(e);
	if (typeof e == "string") return d(e);
	throw Error("Expected function, string, or object as test");
});
function l(e) {
	let t = [], n = -1;
	for (; ++n < e.length;) t[n] = c(e[n]);
	return f(r);
	function r(...e) {
		let n = -1;
		for (; ++n < t.length;) if (t[n].apply(this, e)) return !0;
		return !1;
	}
}
function u(e) {
	let t = e;
	return f(n);
	function n(n) {
		let r = n, i;
		for (i in e) if (r[i] !== t[i]) return !1;
		return !0;
	}
}
function d(e) {
	return f(t);
	function t(t) {
		return t && t.type === e;
	}
}
function f(e) {
	return t;
	function t(t, n, r) {
		return !!(m(t) && e.call(this, t, typeof n == "number" ? n : void 0, r || void 0));
	}
}
function p() {
	return !0;
}
function m(e) {
	return typeof e == "object" && !!e && "type" in e;
}
// node_modules/unist-util-visit-parents/lib/color.js
function h(e) {
	return e;
}
// node_modules/unist-util-visit-parents/lib/index.js
var g = [], _ = "skip";
function v(e, t, n, r) {
	if (!e || typeof e != "object") throw Error("Unexpected value `" + e + "` for `tree`, expected node");
	let i = !0, a, o, s, l;
	if (typeof n == "function" || n && typeof n == "object" ? (a = t, o = n, r && (i = !1)) : (o = t, n && (i = !1)), typeof o == "function") s = o;
	else if (o && typeof o == "object") {
		if (o.enter !== null && o.enter !== void 0) {
			if (typeof o.enter == "function") s = o.enter;
			else throw Error("Unexpected value `" + o.enter + "` for `visitors.enter`, expected optional visitor");
		}
		if (typeof o.exit == "function") l = o.exit;
		else throw Error("Unexpected value `" + o.exit + "` for `visitors.exit`, expected visitor (pass a visitor directly if you only want an enter visitor)");
	} else throw Error("Unexpected value `" + o + "` for `enter` or `visitors`, expected visitor or object with visitors");
	let u = c(a), d = i ? 1 : -1;
	f(e, void 0, [])();
	function f(e, t, n) {
		let r = e && typeof e == "object" ? e : {};
		if (typeof r.type == "string") {
			let t = typeof r.tagName == "string" ? r.tagName : typeof r.name == "string" ? r.name : void 0;
			Object.defineProperty(o, "name", { value: "node (" + h(e.type + (t ? "<" + t + ">" : "")) + ")" });
		}
		return o;
		function o() {
			let r = !a || u(e, t, n[n.length - 1] || void 0), o = g;
			if (s && r && (o = y(s(e, n, t)), o[0] === !1)) return o;
			if ("children" in e && e.children) {
				let t = e;
				if (t.children && o[0] !== "skip") {
					let e = (i ? -1 : t.children.length) + d, r = [...n, t];
					for (; e > -1 && e < t.children.length;) {
						let n = t.children[e], i = f(n, e, r)();
						if (i[0] === !1) return i;
						e = typeof i[1] == "number" ? i[1] : e + d;
					}
				}
			}
			if (l && r) {
				let r = y(l(e, n, t));
				if (r[0] === "skip") throw Error("Unexpected value `" + r[0] + "` from `exit`, expected `CONTINUE`, `EXIT`, index, or nothing");
				if (r[0] === !1 || typeof r[1] == "number") return r;
			}
			return o;
		}
	}
}
function y(e) {
	return Array.isArray(e) ? e : typeof e == "number" ? [!0, e] : e == null ? g : [e];
}
// node_modules/rehype-harden/node_modules/unist-util-visit/lib/index.js
function b(e, t, n, r) {
	let i, a, o;
	typeof n == "function" || n && typeof n == "object" ? (i = t, a = n, o = r) : (a = t, o = n), typeof a == "function" ? v(e, i, te(a), o) : v(e, i, ee(a), o);
}
function ee(e) {
	return !e || typeof e != "object" ? e : {
		enter: typeof e.enter == "function" ? te(e.enter) : e.enter,
		exit: typeof e.exit == "function" ? te(e.exit) : e.exit
	};
}
function te(e) {
	return t;
	function t(t, n, r) {
		return e(t, r, n[n.length - 1]);
	}
}
// node_modules/rehype-harden/dist/index.js
var x = /* @__PURE__ */ e(a()), S = {
	indicator: "indicator",
	textOnly: "text-only",
	remove: "remove"
};
function C({ defaultOrigin: e = "", allowedLinkPrefixes: t = [], allowedImagePrefixes: n = [], allowDataImages: r = !1, allowedProtocols: i = [], blockedImageClass: a = "inline-block bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-3 py-1 rounded text-sm", blockedLinkClass: o = "text-gray-500", linkBlockPolicy: s = S.indicator, imageBlockPolicy: c = S.indicator }) {
	let l = t.length && !t.every((e) => e === "*"), u = n.length && !n.every((e) => e === "*");
	if (!e && (l || u)) throw Error("defaultOrigin is required when allowedLinkPrefixes or allowedImagePrefixes are provided");
	return (l) => {
		let u = ue(e, t, n, r, i, a, o, s, c);
		oe(l), b(l, u);
	};
}
function ne(e, t) {
	if (typeof e != "string") return null;
	try {
		return new URL(e);
	} catch {
		if (t) try {
			return new URL(e, t);
		} catch {
			return null;
		}
		if (e.startsWith("/") || e.startsWith("./") || e.startsWith("../")) try {
			return new URL(e, "http://example.com");
		} catch {
			return null;
		}
		return null;
	}
}
function re(e) {
	return typeof e == "string" ? e.startsWith("/") || e.startsWith("./") || e.startsWith("../") : !1;
}
var w = /* @__PURE__ */ new Set([
	"https:",
	"http:",
	"irc:",
	"ircs:",
	"mailto:",
	"xmpp:",
	"blob:"
]), ie = /* @__PURE__ */ new Set([
	"javascript:",
	"data:",
	"file:",
	"vbscript:"
]);
function ae(e, t, n, r = !1, i = !1, a = []) {
	if (!e) return null;
	if (typeof e == "string" && e.startsWith("#") && !i) try {
		if (new URL(e, "http://example.com").hash === e) return e;
	} catch {}
	if (typeof e == "string" && e.startsWith("data:")) return i && r && e.startsWith("data:image/") ? e : null;
	if (typeof e == "string" && e.startsWith("blob:")) {
		try {
			if (new URL(e).protocol === "blob:" && e.length > 5) {
				let t = e.substring(5);
				if (t && t.length > 0 && t !== "invalid") return e;
			}
		} catch {
			return null;
		}
		return null;
	}
	let o = ne(e, n);
	if (!o || ie.has(o.protocol) || !(w.has(o.protocol) || a.includes(o.protocol) || a.includes("*"))) return null;
	if (o.protocol === "mailto:" || !o.protocol.match(/^https?:$/)) return o.href;
	let s = re(e);
	return o && t.some((e) => {
		let t = ne(e, n);
		return !t || t.origin !== o.origin ? !1 : o.href.startsWith(t.href);
	}) ? s ? o.pathname + o.search + o.hash : o.href : t.includes("*") ? o.protocol !== "https:" && o.protocol !== "http:" ? null : s ? o.pathname + o.search + o.hash : o.href : null;
}
function oe(e) {
	if ("children" in e && Array.isArray(e.children)) {
		e.children = e.children.filter((e) => e != null);
		for (let t of e.children) oe(t);
	}
}
var se = Symbol("node-seen");
function ce(e, t, n) {
	return t === S.remove ? { type: "remove" } : t === S.textOnly ? {
		type: "replace",
		element: {
			type: "element",
			tagName: "span",
			properties: {},
			children: [...e.children]
		}
	} : {
		type: "replace",
		element: {
			type: "element",
			tagName: "span",
			properties: {
				title: "Blocked URL: " + String(e.properties.href),
				class: n
			},
			children: [...e.children, {
				type: "text",
				value: " [blocked]"
			}]
		}
	};
}
function le(e, t, n) {
	if (t === S.remove) return { type: "remove" };
	if (t === S.textOnly) {
		let t = String(e.properties.alt || "");
		return t ? {
			type: "replace",
			element: {
				type: "element",
				tagName: "span",
				properties: {},
				children: [{
					type: "text",
					value: t
				}]
			}
		} : { type: "remove" };
	}
	return {
		type: "replace",
		element: {
			type: "element",
			tagName: "span",
			properties: { class: n },
			children: [{
				type: "text",
				value: "[Image blocked: " + String(e.properties.alt || "No description") + "]"
			}]
		}
	};
}
var ue = (e, t, n, r, i, a, o, s, c) => {
	let l = (u, d, f) => {
		if (u.type !== "element" || u[se]) return !0;
		if (u.tagName === "a") {
			let n = ae(u.properties.href, t, e, !1, !1, i);
			if (n === null) {
				if (u[se] = !0, b(u, l), f && typeof d == "number") {
					let e = ce(u, s, o);
					if (e.type === "remove") return f.children.splice(d, 1), [_, d];
					f.children[d] = e.element;
				}
				return _;
			}
			return u.properties.href = n, u.properties.target = "_blank", u.properties.rel = "noopener noreferrer", !0;
		}
		if (u.tagName === "img") {
			let t = ae(u.properties.src, n, e, r, !0, i);
			if (t === null) {
				if (u[se] = !0, b(u, l), f && typeof d == "number") {
					let e = le(u, c, a);
					if (e.type === "remove") return f.children.splice(d, 1), [_, d];
					f.children[d] = e.element;
				}
				return _;
			}
			return u.properties.src = t, !0;
		}
		return !0;
	};
	return l;
}, T = class {
	constructor(e, t, n) {
		this.normal = t, this.property = e, n && (this.space = n);
	}
};
T.prototype.normal = {}, T.prototype.property = {}, T.prototype.space = void 0;
// node_modules/hastscript/node_modules/property-information/lib/util/merge.js
function de(e, t) {
	let n = {}, r = {};
	for (let t of e) Object.assign(n, t.property), Object.assign(r, t.normal);
	return new T(n, r, t);
}
// node_modules/hastscript/node_modules/property-information/lib/normalize.js
function fe(e) {
	return e.toLowerCase();
}
// node_modules/hastscript/node_modules/property-information/lib/util/info.js
var pe = class {
	constructor(e, t) {
		this.attribute = t, this.property = e;
	}
};
pe.prototype.attribute = "", pe.prototype.booleanish = !1, pe.prototype.boolean = !1, pe.prototype.commaOrSpaceSeparated = !1, pe.prototype.commaSeparated = !1, pe.prototype.defined = !1, pe.prototype.mustUseProperty = !1, pe.prototype.number = !1, pe.prototype.overloadedBoolean = !1, pe.prototype.property = "", pe.prototype.spaceSeparated = !1, pe.prototype.space = void 0;
// node_modules/hastscript/node_modules/property-information/lib/util/types.js
var me = /* @__PURE__ */ t({
	boolean: () => E,
	booleanish: () => ge,
	commaOrSpaceSeparated: () => ye,
	commaSeparated: () => ve,
	number: () => D,
	overloadedBoolean: () => _e,
	spaceSeparated: () => O
}), he = 0, E = be(), ge = be(), _e = be(), D = be(), O = be(), ve = be(), ye = be();
function be() {
	return 2 ** ++he;
}
// node_modules/hastscript/node_modules/property-information/lib/util/defined-info.js
var xe = Object.keys(me), Se = class extends pe {
	constructor(e, t, n, r) {
		let i = -1;
		if (super(e, t), Ce(this, "space", r), typeof n == "number") for (; ++i < xe.length;) {
			let e = xe[i];
			Ce(this, xe[i], (n & me[e]) === me[e]);
		}
	}
};
Se.prototype.defined = !0;
function Ce(e, t, n) {
	n && (e[t] = n);
}
// node_modules/hastscript/node_modules/property-information/lib/util/create.js
function we(e) {
	let t = {}, n = {};
	for (let [r, i] of Object.entries(e.properties)) {
		let a = new Se(r, e.transform(e.attributes || {}, r), i, e.space);
		e.mustUseProperty && e.mustUseProperty.includes(r) && (a.mustUseProperty = !0), t[r] = a, n[fe(r)] = r, n[fe(a.attribute)] = r;
	}
	return new T(t, n, e.space);
}
// node_modules/hastscript/node_modules/property-information/lib/aria.js
var Te = we({
	properties: {
		ariaActiveDescendant: null,
		ariaAtomic: ge,
		ariaAutoComplete: null,
		ariaBusy: ge,
		ariaChecked: ge,
		ariaColCount: D,
		ariaColIndex: D,
		ariaColSpan: D,
		ariaControls: O,
		ariaCurrent: null,
		ariaDescribedBy: O,
		ariaDetails: null,
		ariaDisabled: ge,
		ariaDropEffect: O,
		ariaErrorMessage: null,
		ariaExpanded: ge,
		ariaFlowTo: O,
		ariaGrabbed: ge,
		ariaHasPopup: null,
		ariaHidden: ge,
		ariaInvalid: null,
		ariaKeyShortcuts: null,
		ariaLabel: null,
		ariaLabelledBy: O,
		ariaLevel: D,
		ariaLive: null,
		ariaModal: ge,
		ariaMultiLine: ge,
		ariaMultiSelectable: ge,
		ariaOrientation: null,
		ariaOwns: O,
		ariaPlaceholder: null,
		ariaPosInSet: D,
		ariaPressed: ge,
		ariaReadOnly: ge,
		ariaRelevant: null,
		ariaRequired: ge,
		ariaRoleDescription: O,
		ariaRowCount: D,
		ariaRowIndex: D,
		ariaRowSpan: D,
		ariaSelected: ge,
		ariaSetSize: D,
		ariaSort: null,
		ariaValueMax: D,
		ariaValueMin: D,
		ariaValueNow: D,
		ariaValueText: null,
		role: null
	},
	transform(e, t) {
		return t === "role" ? t : "aria-" + t.slice(4).toLowerCase();
	}
});
// node_modules/hastscript/node_modules/property-information/lib/util/case-sensitive-transform.js
function Ee(e, t) {
	return t in e ? e[t] : t;
}
// node_modules/hastscript/node_modules/property-information/lib/util/case-insensitive-transform.js
function De(e, t) {
	return Ee(e, t.toLowerCase());
}
// node_modules/hastscript/node_modules/property-information/lib/html.js
var Oe = we({
	attributes: {
		acceptcharset: "accept-charset",
		classname: "class",
		htmlfor: "for",
		httpequiv: "http-equiv"
	},
	mustUseProperty: [
		"checked",
		"multiple",
		"muted",
		"selected"
	],
	properties: {
		abbr: null,
		accept: ve,
		acceptCharset: O,
		accessKey: O,
		action: null,
		allow: null,
		allowFullScreen: E,
		allowPaymentRequest: E,
		allowUserMedia: E,
		alpha: E,
		alt: null,
		as: null,
		async: E,
		autoCapitalize: null,
		autoComplete: O,
		autoFocus: E,
		autoPlay: E,
		blocking: O,
		capture: null,
		charSet: null,
		checked: E,
		cite: null,
		className: O,
		closedBy: null,
		colorSpace: null,
		cols: D,
		colSpan: D,
		command: null,
		commandFor: null,
		content: null,
		contentEditable: ge,
		controls: E,
		controlsList: O,
		coords: D | ve,
		crossOrigin: null,
		data: null,
		dateTime: null,
		decoding: null,
		default: E,
		defer: E,
		dir: null,
		dirName: null,
		disabled: E,
		download: _e,
		draggable: ge,
		encType: null,
		enterKeyHint: null,
		fetchPriority: null,
		form: null,
		formAction: null,
		formEncType: null,
		formMethod: null,
		formNoValidate: E,
		formTarget: null,
		headers: O,
		height: D,
		hidden: _e,
		high: D,
		href: null,
		hrefLang: null,
		htmlFor: O,
		httpEquiv: O,
		id: null,
		imageSizes: null,
		imageSrcSet: null,
		inert: E,
		inputMode: null,
		integrity: null,
		is: null,
		isMap: E,
		itemId: null,
		itemProp: O,
		itemRef: O,
		itemScope: E,
		itemType: O,
		kind: null,
		label: null,
		lang: null,
		language: null,
		list: null,
		loading: null,
		loop: E,
		low: D,
		manifest: null,
		max: null,
		maxLength: D,
		media: null,
		method: null,
		min: null,
		minLength: D,
		multiple: E,
		muted: E,
		name: null,
		nonce: null,
		noModule: E,
		noValidate: E,
		onAbort: null,
		onAfterPrint: null,
		onAuxClick: null,
		onBeforeMatch: null,
		onBeforePrint: null,
		onBeforeToggle: null,
		onBeforeUnload: null,
		onBlur: null,
		onCancel: null,
		onCanPlay: null,
		onCanPlayThrough: null,
		onChange: null,
		onClick: null,
		onClose: null,
		onContextLost: null,
		onContextMenu: null,
		onContextRestored: null,
		onCopy: null,
		onCueChange: null,
		onCut: null,
		onDblClick: null,
		onDrag: null,
		onDragEnd: null,
		onDragEnter: null,
		onDragExit: null,
		onDragLeave: null,
		onDragOver: null,
		onDragStart: null,
		onDrop: null,
		onDurationChange: null,
		onEmptied: null,
		onEnded: null,
		onError: null,
		onFocus: null,
		onFormData: null,
		onHashChange: null,
		onInput: null,
		onInvalid: null,
		onKeyDown: null,
		onKeyPress: null,
		onKeyUp: null,
		onLanguageChange: null,
		onLoad: null,
		onLoadedData: null,
		onLoadedMetadata: null,
		onLoadEnd: null,
		onLoadStart: null,
		onMessage: null,
		onMessageError: null,
		onMouseDown: null,
		onMouseEnter: null,
		onMouseLeave: null,
		onMouseMove: null,
		onMouseOut: null,
		onMouseOver: null,
		onMouseUp: null,
		onOffline: null,
		onOnline: null,
		onPageHide: null,
		onPageShow: null,
		onPaste: null,
		onPause: null,
		onPlay: null,
		onPlaying: null,
		onPopState: null,
		onProgress: null,
		onRateChange: null,
		onRejectionHandled: null,
		onReset: null,
		onResize: null,
		onScroll: null,
		onScrollEnd: null,
		onSecurityPolicyViolation: null,
		onSeeked: null,
		onSeeking: null,
		onSelect: null,
		onSlotChange: null,
		onStalled: null,
		onStorage: null,
		onSubmit: null,
		onSuspend: null,
		onTimeUpdate: null,
		onToggle: null,
		onUnhandledRejection: null,
		onUnload: null,
		onVolumeChange: null,
		onWaiting: null,
		onWheel: null,
		open: E,
		optimum: D,
		pattern: null,
		ping: O,
		placeholder: null,
		playsInline: E,
		popover: null,
		popoverTarget: null,
		popoverTargetAction: null,
		poster: null,
		preload: null,
		readOnly: E,
		referrerPolicy: null,
		rel: O,
		required: E,
		reversed: E,
		rows: D,
		rowSpan: D,
		sandbox: O,
		scope: null,
		scoped: E,
		seamless: E,
		selected: E,
		shadowRootClonable: E,
		shadowRootCustomElementRegistry: E,
		shadowRootDelegatesFocus: E,
		shadowRootMode: null,
		shadowRootSerializable: E,
		shape: null,
		size: D,
		sizes: null,
		slot: null,
		span: D,
		spellCheck: ge,
		src: null,
		srcDoc: null,
		srcLang: null,
		srcSet: null,
		start: D,
		step: null,
		style: null,
		tabIndex: D,
		target: null,
		title: null,
		translate: null,
		type: null,
		typeMustMatch: E,
		useMap: null,
		value: ge,
		width: D,
		wrap: null,
		writingSuggestions: null,
		align: null,
		aLink: null,
		archive: O,
		axis: null,
		background: null,
		bgColor: null,
		border: D,
		borderColor: null,
		bottomMargin: D,
		cellPadding: null,
		cellSpacing: null,
		char: null,
		charOff: null,
		classId: null,
		clear: null,
		code: null,
		codeBase: null,
		codeType: null,
		color: null,
		compact: E,
		declare: E,
		event: null,
		face: null,
		frame: null,
		frameBorder: null,
		hSpace: D,
		leftMargin: D,
		link: null,
		longDesc: null,
		lowSrc: null,
		marginHeight: D,
		marginWidth: D,
		noResize: E,
		noHref: E,
		noShade: E,
		noWrap: E,
		object: null,
		profile: null,
		prompt: null,
		rev: null,
		rightMargin: D,
		rules: null,
		scheme: null,
		scrolling: ge,
		standby: null,
		summary: null,
		text: null,
		topMargin: D,
		valueType: null,
		version: null,
		vAlign: null,
		vLink: null,
		vSpace: D,
		allowTransparency: null,
		autoCorrect: null,
		autoSave: null,
		credentialless: E,
		disablePictureInPicture: E,
		disableRemotePlayback: E,
		exportParts: ve,
		part: O,
		prefix: null,
		property: null,
		results: D,
		security: null,
		unselectable: null
	},
	space: "html",
	transform: De
}), ke = we({
	attributes: {
		accentHeight: "accent-height",
		alignmentBaseline: "alignment-baseline",
		arabicForm: "arabic-form",
		baselineShift: "baseline-shift",
		capHeight: "cap-height",
		className: "class",
		clipPath: "clip-path",
		clipRule: "clip-rule",
		colorInterpolation: "color-interpolation",
		colorInterpolationFilters: "color-interpolation-filters",
		colorProfile: "color-profile",
		colorRendering: "color-rendering",
		crossOrigin: "crossorigin",
		dataType: "datatype",
		dominantBaseline: "dominant-baseline",
		enableBackground: "enable-background",
		fillOpacity: "fill-opacity",
		fillRule: "fill-rule",
		floodColor: "flood-color",
		floodOpacity: "flood-opacity",
		fontFamily: "font-family",
		fontSize: "font-size",
		fontSizeAdjust: "font-size-adjust",
		fontStretch: "font-stretch",
		fontStyle: "font-style",
		fontVariant: "font-variant",
		fontWeight: "font-weight",
		glyphName: "glyph-name",
		glyphOrientationHorizontal: "glyph-orientation-horizontal",
		glyphOrientationVertical: "glyph-orientation-vertical",
		hrefLang: "hreflang",
		horizAdvX: "horiz-adv-x",
		horizOriginX: "horiz-origin-x",
		horizOriginY: "horiz-origin-y",
		imageRendering: "image-rendering",
		letterSpacing: "letter-spacing",
		lightingColor: "lighting-color",
		markerEnd: "marker-end",
		markerMid: "marker-mid",
		markerStart: "marker-start",
		maskType: "mask-type",
		navDown: "nav-down",
		navDownLeft: "nav-down-left",
		navDownRight: "nav-down-right",
		navLeft: "nav-left",
		navNext: "nav-next",
		navPrev: "nav-prev",
		navRight: "nav-right",
		navUp: "nav-up",
		navUpLeft: "nav-up-left",
		navUpRight: "nav-up-right",
		onAbort: "onabort",
		onActivate: "onactivate",
		onAfterPrint: "onafterprint",
		onBeforePrint: "onbeforeprint",
		onBegin: "onbegin",
		onCancel: "oncancel",
		onCanPlay: "oncanplay",
		onCanPlayThrough: "oncanplaythrough",
		onChange: "onchange",
		onClick: "onclick",
		onClose: "onclose",
		onCopy: "oncopy",
		onCueChange: "oncuechange",
		onCut: "oncut",
		onDblClick: "ondblclick",
		onDrag: "ondrag",
		onDragEnd: "ondragend",
		onDragEnter: "ondragenter",
		onDragExit: "ondragexit",
		onDragLeave: "ondragleave",
		onDragOver: "ondragover",
		onDragStart: "ondragstart",
		onDrop: "ondrop",
		onDurationChange: "ondurationchange",
		onEmptied: "onemptied",
		onEnd: "onend",
		onEnded: "onended",
		onError: "onerror",
		onFocus: "onfocus",
		onFocusIn: "onfocusin",
		onFocusOut: "onfocusout",
		onHashChange: "onhashchange",
		onInput: "oninput",
		onInvalid: "oninvalid",
		onKeyDown: "onkeydown",
		onKeyPress: "onkeypress",
		onKeyUp: "onkeyup",
		onLoad: "onload",
		onLoadedData: "onloadeddata",
		onLoadedMetadata: "onloadedmetadata",
		onLoadStart: "onloadstart",
		onMessage: "onmessage",
		onMouseDown: "onmousedown",
		onMouseEnter: "onmouseenter",
		onMouseLeave: "onmouseleave",
		onMouseMove: "onmousemove",
		onMouseOut: "onmouseout",
		onMouseOver: "onmouseover",
		onMouseUp: "onmouseup",
		onMouseWheel: "onmousewheel",
		onOffline: "onoffline",
		onOnline: "ononline",
		onPageHide: "onpagehide",
		onPageShow: "onpageshow",
		onPaste: "onpaste",
		onPause: "onpause",
		onPlay: "onplay",
		onPlaying: "onplaying",
		onPopState: "onpopstate",
		onProgress: "onprogress",
		onRateChange: "onratechange",
		onRepeat: "onrepeat",
		onReset: "onreset",
		onResize: "onresize",
		onScroll: "onscroll",
		onSeeked: "onseeked",
		onSeeking: "onseeking",
		onSelect: "onselect",
		onShow: "onshow",
		onStalled: "onstalled",
		onStorage: "onstorage",
		onSubmit: "onsubmit",
		onSuspend: "onsuspend",
		onTimeUpdate: "ontimeupdate",
		onToggle: "ontoggle",
		onUnload: "onunload",
		onVolumeChange: "onvolumechange",
		onWaiting: "onwaiting",
		onZoom: "onzoom",
		overlinePosition: "overline-position",
		overlineThickness: "overline-thickness",
		paintOrder: "paint-order",
		panose1: "panose-1",
		pointerEvents: "pointer-events",
		referrerPolicy: "referrerpolicy",
		renderingIntent: "rendering-intent",
		shapeRendering: "shape-rendering",
		stopColor: "stop-color",
		stopOpacity: "stop-opacity",
		strikethroughPosition: "strikethrough-position",
		strikethroughThickness: "strikethrough-thickness",
		strokeDashArray: "stroke-dasharray",
		strokeDashOffset: "stroke-dashoffset",
		strokeLineCap: "stroke-linecap",
		strokeLineJoin: "stroke-linejoin",
		strokeMiterLimit: "stroke-miterlimit",
		strokeOpacity: "stroke-opacity",
		strokeWidth: "stroke-width",
		tabIndex: "tabindex",
		textAnchor: "text-anchor",
		textDecoration: "text-decoration",
		textRendering: "text-rendering",
		transformOrigin: "transform-origin",
		typeOf: "typeof",
		underlinePosition: "underline-position",
		underlineThickness: "underline-thickness",
		unicodeBidi: "unicode-bidi",
		unicodeRange: "unicode-range",
		unitsPerEm: "units-per-em",
		vAlphabetic: "v-alphabetic",
		vHanging: "v-hanging",
		vIdeographic: "v-ideographic",
		vMathematical: "v-mathematical",
		vectorEffect: "vector-effect",
		vertAdvY: "vert-adv-y",
		vertOriginX: "vert-origin-x",
		vertOriginY: "vert-origin-y",
		wordSpacing: "word-spacing",
		writingMode: "writing-mode",
		xHeight: "x-height",
		playbackOrder: "playbackorder",
		timelineBegin: "timelinebegin"
	},
	properties: {
		about: ye,
		accentHeight: D,
		accumulate: null,
		additive: null,
		alignmentBaseline: null,
		alphabetic: D,
		amplitude: D,
		arabicForm: null,
		ascent: D,
		attributeName: null,
		attributeType: null,
		azimuth: D,
		bandwidth: null,
		baselineShift: null,
		baseFrequency: null,
		baseProfile: null,
		bbox: null,
		begin: null,
		bias: D,
		by: null,
		calcMode: null,
		capHeight: D,
		className: O,
		clip: null,
		clipPath: null,
		clipPathUnits: null,
		clipRule: null,
		color: null,
		colorInterpolation: null,
		colorInterpolationFilters: null,
		colorProfile: null,
		colorRendering: null,
		content: null,
		contentScriptType: null,
		contentStyleType: null,
		crossOrigin: null,
		cursor: null,
		cx: null,
		cy: null,
		d: null,
		dataType: null,
		defaultAction: null,
		descent: D,
		diffuseConstant: D,
		direction: null,
		display: null,
		dur: null,
		divisor: D,
		dominantBaseline: null,
		download: E,
		dx: null,
		dy: null,
		edgeMode: null,
		editable: null,
		elevation: D,
		enableBackground: null,
		end: null,
		event: null,
		exponent: D,
		externalResourcesRequired: null,
		fill: null,
		fillOpacity: D,
		fillRule: null,
		filter: null,
		filterRes: null,
		filterUnits: null,
		floodColor: null,
		floodOpacity: null,
		focusable: null,
		focusHighlight: null,
		fontFamily: null,
		fontSize: null,
		fontSizeAdjust: null,
		fontStretch: null,
		fontStyle: null,
		fontVariant: null,
		fontWeight: null,
		format: null,
		fr: null,
		from: null,
		fx: null,
		fy: null,
		g1: ve,
		g2: ve,
		glyphName: ve,
		glyphOrientationHorizontal: null,
		glyphOrientationVertical: null,
		glyphRef: null,
		gradientTransform: null,
		gradientUnits: null,
		handler: null,
		hanging: D,
		hatchContentUnits: null,
		hatchUnits: null,
		height: null,
		href: null,
		hrefLang: null,
		horizAdvX: D,
		horizOriginX: D,
		horizOriginY: D,
		id: null,
		ideographic: D,
		imageRendering: null,
		initialVisibility: null,
		in: null,
		in2: null,
		intercept: D,
		k: D,
		k1: D,
		k2: D,
		k3: D,
		k4: D,
		kernelMatrix: ye,
		kernelUnitLength: null,
		keyPoints: null,
		keySplines: null,
		keyTimes: null,
		kerning: null,
		lang: null,
		lengthAdjust: null,
		letterSpacing: null,
		lightingColor: null,
		limitingConeAngle: D,
		local: null,
		markerEnd: null,
		markerMid: null,
		markerStart: null,
		markerHeight: null,
		markerUnits: null,
		markerWidth: null,
		mask: null,
		maskContentUnits: null,
		maskType: null,
		maskUnits: null,
		mathematical: null,
		max: null,
		media: null,
		mediaCharacterEncoding: null,
		mediaContentEncodings: null,
		mediaSize: D,
		mediaTime: null,
		method: null,
		min: null,
		mode: null,
		name: null,
		navDown: null,
		navDownLeft: null,
		navDownRight: null,
		navLeft: null,
		navNext: null,
		navPrev: null,
		navRight: null,
		navUp: null,
		navUpLeft: null,
		navUpRight: null,
		numOctaves: null,
		observer: null,
		offset: null,
		onAbort: null,
		onActivate: null,
		onAfterPrint: null,
		onBeforePrint: null,
		onBegin: null,
		onCancel: null,
		onCanPlay: null,
		onCanPlayThrough: null,
		onChange: null,
		onClick: null,
		onClose: null,
		onCopy: null,
		onCueChange: null,
		onCut: null,
		onDblClick: null,
		onDrag: null,
		onDragEnd: null,
		onDragEnter: null,
		onDragExit: null,
		onDragLeave: null,
		onDragOver: null,
		onDragStart: null,
		onDrop: null,
		onDurationChange: null,
		onEmptied: null,
		onEnd: null,
		onEnded: null,
		onError: null,
		onFocus: null,
		onFocusIn: null,
		onFocusOut: null,
		onHashChange: null,
		onInput: null,
		onInvalid: null,
		onKeyDown: null,
		onKeyPress: null,
		onKeyUp: null,
		onLoad: null,
		onLoadedData: null,
		onLoadedMetadata: null,
		onLoadStart: null,
		onMessage: null,
		onMouseDown: null,
		onMouseEnter: null,
		onMouseLeave: null,
		onMouseMove: null,
		onMouseOut: null,
		onMouseOver: null,
		onMouseUp: null,
		onMouseWheel: null,
		onOffline: null,
		onOnline: null,
		onPageHide: null,
		onPageShow: null,
		onPaste: null,
		onPause: null,
		onPlay: null,
		onPlaying: null,
		onPopState: null,
		onProgress: null,
		onRateChange: null,
		onRepeat: null,
		onReset: null,
		onResize: null,
		onScroll: null,
		onSeeked: null,
		onSeeking: null,
		onSelect: null,
		onShow: null,
		onStalled: null,
		onStorage: null,
		onSubmit: null,
		onSuspend: null,
		onTimeUpdate: null,
		onToggle: null,
		onUnload: null,
		onVolumeChange: null,
		onWaiting: null,
		onZoom: null,
		opacity: null,
		operator: null,
		order: null,
		orient: null,
		orientation: null,
		origin: null,
		overflow: null,
		overlay: null,
		overlinePosition: D,
		overlineThickness: D,
		paintOrder: null,
		panose1: null,
		path: null,
		pathLength: D,
		patternContentUnits: null,
		patternTransform: null,
		patternUnits: null,
		phase: null,
		ping: O,
		pitch: null,
		playbackOrder: null,
		pointerEvents: null,
		points: null,
		pointsAtX: D,
		pointsAtY: D,
		pointsAtZ: D,
		preserveAlpha: null,
		preserveAspectRatio: null,
		primitiveUnits: null,
		propagate: null,
		property: ye,
		r: null,
		radius: null,
		referrerPolicy: null,
		refX: null,
		refY: null,
		rel: ye,
		rev: ye,
		renderingIntent: null,
		repeatCount: null,
		repeatDur: null,
		requiredExtensions: ye,
		requiredFeatures: ye,
		requiredFonts: ye,
		requiredFormats: ye,
		resource: null,
		restart: null,
		result: null,
		rotate: null,
		rx: null,
		ry: null,
		scale: null,
		seed: null,
		shapeRendering: null,
		side: null,
		slope: null,
		snapshotTime: null,
		specularConstant: D,
		specularExponent: D,
		spreadMethod: null,
		spacing: null,
		startOffset: null,
		stdDeviation: null,
		stemh: null,
		stemv: null,
		stitchTiles: null,
		stopColor: null,
		stopOpacity: null,
		strikethroughPosition: D,
		strikethroughThickness: D,
		string: null,
		stroke: null,
		strokeDashArray: ye,
		strokeDashOffset: null,
		strokeLineCap: null,
		strokeLineJoin: null,
		strokeMiterLimit: D,
		strokeOpacity: D,
		strokeWidth: null,
		style: null,
		surfaceScale: D,
		syncBehavior: null,
		syncBehaviorDefault: null,
		syncMaster: null,
		syncTolerance: null,
		syncToleranceDefault: null,
		systemLanguage: ye,
		tabIndex: D,
		tableValues: null,
		target: null,
		targetX: D,
		targetY: D,
		textAnchor: null,
		textDecoration: null,
		textRendering: null,
		textLength: null,
		timelineBegin: null,
		title: null,
		transformBehavior: null,
		type: null,
		typeOf: ye,
		to: null,
		transform: null,
		transformOrigin: null,
		u1: null,
		u2: null,
		underlinePosition: D,
		underlineThickness: D,
		unicode: null,
		unicodeBidi: null,
		unicodeRange: null,
		unitsPerEm: D,
		values: null,
		vAlphabetic: D,
		vMathematical: D,
		vectorEffect: null,
		vHanging: D,
		vIdeographic: D,
		version: null,
		vertAdvY: D,
		vertOriginX: D,
		vertOriginY: D,
		viewBox: null,
		viewTarget: null,
		visibility: null,
		width: null,
		widths: null,
		wordSpacing: null,
		writingMode: null,
		x: null,
		x1: null,
		x2: null,
		xChannelSelector: null,
		xHeight: D,
		y: null,
		y1: null,
		y2: null,
		yChannelSelector: null,
		z: null,
		zoomAndPan: null
	},
	space: "svg",
	transform: Ee
}), Ae = we({
	properties: {
		xLinkActuate: null,
		xLinkArcRole: null,
		xLinkHref: null,
		xLinkRole: null,
		xLinkShow: null,
		xLinkTitle: null,
		xLinkType: null
	},
	space: "xlink",
	transform(e, t) {
		return "xlink:" + t.slice(5).toLowerCase();
	}
}), je = we({
	attributes: { xmlnsxlink: "xmlns:xlink" },
	properties: {
		xmlnsXLink: null,
		xmlns: null
	},
	space: "xmlns",
	transform: De
}), Me = we({
	properties: {
		xmlBase: null,
		xmlLang: null,
		xmlSpace: null
	},
	space: "xml",
	transform(e, t) {
		return "xml:" + t.slice(3).toLowerCase();
	}
}), Ne = /[A-Z]/g, Pe = /-[a-z]/g, Fe = /^data[-\w.:]+$/i;
function Ie(e, t) {
	let n = fe(t), r = t, i = pe;
	if (n in e.normal) return e.property[e.normal[n]];
	if (n.length > 4 && n.slice(0, 4) === "data" && Fe.test(t)) {
		if (t.charAt(4) === "-") {
			let e = t.slice(5).replace(Pe, Re);
			r = "data" + e.charAt(0).toUpperCase() + e.slice(1);
		} else {
			let e = t.slice(4);
			if (!Pe.test(e)) {
				let n = e.replace(Ne, Le);
				n.charAt(0) !== "-" && (n = "-" + n), t = "data" + n;
			}
		}
		i = Se;
	}
	return new i(r, t);
}
function Le(e) {
	return "-" + e.toLowerCase();
}
function Re(e) {
	return e.charAt(1).toUpperCase();
}
// node_modules/hastscript/node_modules/property-information/index.js
var ze = de([
	Te,
	Oe,
	Ae,
	je,
	Me
], "html"), Be = de([
	Te,
	ke,
	Ae,
	je,
	Me
], "svg");
// node_modules/comma-separated-tokens/index.js
function Ve(e) {
	let t = [], n = String(e || ""), r = n.indexOf(","), i = 0, a = !1;
	for (; !a;) {
		r === -1 && (r = n.length, a = !0);
		let e = n.slice(i, r).trim();
		(e || !a) && t.push(e), i = r + 1, r = n.indexOf(",", i);
	}
	return t;
}
function He(e, t) {
	let n = t || {};
	return (e[e.length - 1] === "" ? [...e, ""] : e).join((n.padRight ? " " : "") + "," + (n.padLeft === !1 ? "" : " ")).trim();
}
// node_modules/hast-util-parse-selector/lib/index.js
var Ue = /[#.]/g;
function We(e, t) {
	let n = e || "", r = {}, i = 0, a, o;
	for (; i < n.length;) {
		Ue.lastIndex = i;
		let e = Ue.exec(n), t = n.slice(i, e ? e.index : n.length);
		t && (a ? a === "#" ? r.id = t : Array.isArray(r.className) ? r.className.push(t) : r.className = [t] : o = t, i += t.length), e && (a = e[0], i++);
	}
	return {
		type: "element",
		tagName: o || t || "div",
		properties: r,
		children: []
	};
}
// node_modules/space-separated-tokens/index.js
function Ge(e) {
	let t = String(e || "").trim();
	return t ? t.split(/[ \t\n\r\f]+/g) : [];
}
function Ke(e) {
	return e.join(" ").trim();
}
// node_modules/hastscript/lib/create-h.js
function qe(e, t, n) {
	let r = n ? $e(n) : void 0;
	function i(n, i, ...a) {
		let o;
		if (n == null) {
			o = {
				type: "root",
				children: []
			};
			let e = i;
			a.unshift(e);
		} else {
			o = We(n, t);
			let s = o.tagName.toLowerCase(), c = r ? r.get(s) : void 0;
			if (o.tagName = c || s, Je(i)) a.unshift(i);
			else for (let [t, n] of Object.entries(i)) Ye(e, o.properties, t, n);
		}
		for (let e of a) Xe(o.children, e);
		return o.type === "element" && o.tagName === "template" && e.space === "html" && (o.content = {
			type: "root",
			children: o.children
		}, o.children = []), o;
	}
	return i;
}
function Je(e) {
	if (typeof e != "object" || !e || Array.isArray(e)) return !0;
	if (typeof e.type != "string") return !1;
	let t = e, n = Object.keys(e);
	for (let e of n) {
		let n = t[e];
		if (n && typeof n == "object") {
			if (!Array.isArray(n)) return !0;
			let e = n;
			for (let t of e) if (typeof t != "number" && typeof t != "string") return !0;
		}
	}
	return !!("children" in e && Array.isArray(e.children));
}
function Ye(e, t, n, r) {
	if (r == null) return;
	let i = Ie(e, n), a;
	if (typeof r == "number") {
		if (Number.isNaN(r)) return;
		a = r;
	} else a = typeof r == "boolean" ? r : typeof r == "string" ? i.spaceSeparated ? Ge(r) : i.commaSeparated ? Ve(r) : i.commaOrSpaceSeparated ? Ge(Ve(r).join(" ")) : Ze(i, i.property, r) : Array.isArray(r) ? [...r] : i.property === "style" ? Qe(r) : String(r);
	if (Array.isArray(a)) {
		let e = [];
		for (let t of a) e.push(Ze(i, i.property, t));
		a = e;
	}
	if (i.property === "className" && Array.isArray(t.className)) {
		let e = a;
		a = [...t.className, ...Array.isArray(e) ? e : [e]];
	}
	t[i.property] = a;
}
function Xe(e, t) {
	if (t != null) {
		if (typeof t == "number" || typeof t == "string") e.push({
			type: "text",
			value: String(t)
		});
		else if (Array.isArray(t)) for (let n of t) Xe(e, n);
		else if (typeof t == "object" && "type" in t) t.type === "root" ? Xe(e, t.children) : e.push(t);
		else throw Error("Expected node, nodes, or string, got `" + t + "`");
	}
}
function Ze(e, t, n) {
	if (typeof n == "string") {
		if (e.number && n && !Number.isNaN(Number(n))) return Number(n);
		if ((e.boolean || e.overloadedBoolean) && (n === "" || fe(n) === fe(t))) return !0;
	}
	return n;
}
function Qe(e) {
	let t = [];
	for (let [n, r] of Object.entries(e)) t.push([n, r].join(": "));
	return t.join("; ");
}
function $e(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) t.set(n.toLowerCase(), n);
	return t;
}
// node_modules/hastscript/lib/svg-case-sensitive-tag-names.js
var et = /* @__PURE__ */ "altGlyph.altGlyphDef.altGlyphItem.animateColor.animateMotion.animateTransform.clipPath.feBlend.feColorMatrix.feComponentTransfer.feComposite.feConvolveMatrix.feDiffuseLighting.feDisplacementMap.feDistantLight.feDropShadow.feFlood.feFuncA.feFuncB.feFuncG.feFuncR.feGaussianBlur.feImage.feMerge.feMergeNode.feMorphology.feOffset.fePointLight.feSpecularLighting.feSpotLight.feTile.feTurbulence.foreignObject.glyphRef.linearGradient.radialGradient.solidColor.textArea.textPath".split("."), tt = qe(ze, "div"), nt = qe(Be, "g", et), rt = {
	html: "http://www.w3.org/1999/xhtml",
	mathml: "http://www.w3.org/1998/Math/MathML",
	svg: "http://www.w3.org/2000/svg",
	xlink: "http://www.w3.org/1999/xlink",
	xml: "http://www.w3.org/XML/1998/namespace",
	xmlns: "http://www.w3.org/2000/xmlns/"
};
// node_modules/hast-util-from-dom/lib/index.js
function it(e, t) {
	return at(e, t || {}) || {
		type: "root",
		children: []
	};
}
function at(e, t) {
	let n = ot(e, t);
	return n && t.afterTransform && t.afterTransform(e, n), n;
}
function ot(e, t) {
	switch (e.nodeType) {
		case 1: return dt(e, t);
		case 3: return lt(e);
		case 8: return ut(e);
		case 9: return st(e, t);
		case 10: return ct();
		case 11: return st(e, t);
		default: return;
	}
}
function st(e, t) {
	return {
		type: "root",
		children: ft(e, t)
	};
}
function ct() {
	return { type: "doctype" };
}
function lt(e) {
	return {
		type: "text",
		value: e.nodeValue || ""
	};
}
function ut(e) {
	return {
		type: "comment",
		value: e.nodeValue || ""
	};
}
function dt(e, t) {
	let n = e.namespaceURI, r = n === rt.svg ? nt : tt, i = n === rt.html ? e.tagName.toLowerCase() : e.tagName, a = n === rt.html && i === "template" ? e.content : e, o = e.getAttributeNames(), s = {}, c = -1;
	for (; ++c < o.length;) s[o[c]] = e.getAttribute(o[c]) || "";
	return r(i, s, ft(a, t));
}
function ft(e, t) {
	let n = e.childNodes, r = [], i = -1;
	for (; ++i < n.length;) {
		let e = at(n[i], t);
		e !== void 0 && r.push(e);
	}
	return r;
}
// node_modules/hast-util-from-html-isomorphic/lib/browser.js
var pt = new DOMParser();
function mt(e, t) {
	return it(t?.fragment ? ht(e) : pt.parseFromString(e, "text/html"));
}
function ht(e) {
	let t = document.createElement("template");
	return t.innerHTML = e, t.content;
}
// node_modules/hast-util-to-text/lib/index.js
var gt = /\n/g, _t = /[\t ]+/g, vt = /^[\t\n\f\r ]+$/, yt = /* @__PURE__ */ new Set([
	"caption",
	"col",
	"colgroup",
	"tbody",
	"td",
	"tfoot",
	"th",
	"thead",
	"tr"
]), bt = /* @__PURE__ */ new Set([
	"datalist",
	"head",
	"noembed",
	"noframes",
	"noscript",
	"rp",
	"script",
	"style",
	"template",
	"title"
]), xt = /* @__PURE__ */ new Set(/* @__PURE__ */ "address.article.aside.blockquote.body.caption.center.dd.dialog.dir.dl.dt.div.figure.figcaption.footer.form.h1.h2.h3.h4.h5.h6.header.hgroup.hr.html.legend.li.listing.main.menu.nav.ol.p.plaintext.pre.section.ul.xmp".split("."));
function St(e, t) {
	let n = t || {}, r = "children" in e ? e.children : [], i = !1, a = !1;
	e.type === "element" && (i = xt.has(e.tagName), a = e.tagName === "table" || Nt(e));
	let o = Ot(e, {
		breakAfter: !1,
		breakBefore: !1,
		whitespace: n.whitespace || "normal"
	}), s = [];
	(e.type === "text" || e.type === "comment") && jt(s, Tt(e, {
		breakAfter: !0,
		breakBefore: !0,
		whitespace: o
	}));
	let c = -1;
	for (; ++c < r.length;) {
		let t = r[c + 1], n = t ? t.type === "element" && t.tagName === "br" : i, l = c ? void 0 : i;
		jt(s, Ct(r[c], c, e, {
			breakAfter: n,
			breakBefore: l,
			rowAfter: a ? kt(e, c, void 0) : void 0,
			whitespace: o
		}));
	}
	let l = [], u;
	for (c = -1; ++c < s.length;) {
		let e = s[c];
		typeof e == "number" ? u !== void 0 && e > u && (u = e) : e && (u !== void 0 && u > -1 && l.push("\n".repeat(u) || " "), u = -1, l.push(e));
	}
	return l.join("");
}
function Ct(e, t, n, r) {
	if (e.type === "element") return wt(e, t, n, r);
	if (e.type === "text") {
		if (vt.test(e.value) && n.type === "element" && (n.tagName === "table" || n.tagName === "tr" || Nt(n))) {
			let e = n.children[t - 1], r = n.children[t + 1];
			if ((!e || e.type === "element" && yt.has(e.tagName)) && (!r || r.type === "element" && yt.has(r.tagName))) return [];
		}
		return r.whitespace === "normal" ? Tt(e, r) : Et(e);
	}
	return [];
}
function wt(e, t, n, r) {
	let i = Ot(e, r), a = e.children || [], o = e.tagName === "table" || Nt(e), s = -1, c = [];
	if (bt.has(e.tagName) || e.properties?.hidden || e.tagName === "dialog" && !e.properties?.open) return c;
	let l, u;
	for (e.tagName === "br" || Ft(e) && (r.rowAfter || At(n, t, Ft)) ? u = "\n" : e.tagName === "p" ? (l = 2, u = 2) : xt.has(e.tagName) && (l = 1, u = 1); ++s < a.length;) {
		let t = a[s + 1], n = t ? t.type === "element" && t.tagName === "br" : u, d = s ? void 0 : l;
		jt(c, Ct(a[s], s, e, {
			breakAfter: n,
			breakBefore: d,
			rowAfter: o ? kt(e, s, r.rowAfter) : void 0,
			whitespace: i
		}));
	}
	return Mt(e) && At(n, t, Mt) && c.push("	"), l && c.unshift(l), u && c.push(u), c;
}
function Tt(e, t) {
	let n = String(e.value), r = [], i = [], a = 0;
	for (; a <= n.length;) {
		gt.lastIndex = a;
		let e = gt.exec(n), i = e && "index" in e ? e.index : n.length;
		r.push(Dt(n.slice(a, i).replace(/[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, ""), a !== 0 || t.breakBefore, i !== n.length || t.breakAfter)), a = i + 1;
	}
	let o = -1, s;
	for (; ++o < r.length;) r[o].charCodeAt(r[o].length - 1) === 8203 || o < r.length - 1 && r[o + 1].charCodeAt(0) === 8203 ? (i.push(r[o]), s = void 0) : r[o] ? (typeof s == "number" && i.push(s), i.push(r[o]), s = 0) : (o === 0 || o === r.length - 1) && i.push(0);
	return i;
}
function Et(e) {
	return [String(e.value)];
}
function Dt(e, t, n) {
	let r = [], i = 0, a;
	for (; i < e.length;) {
		_t.lastIndex = i;
		let n = _t.exec(e);
		a = n ? n.index : e.length, !i && !a && n && !t && r.push(""), i !== a && r.push(e.slice(i, a)), i = n ? a + n[0].length : a;
	}
	return i !== a && !n && r.push(""), r.join(" ");
}
function Ot(e, t) {
	if (e.type === "element") switch (e.tagName) {
		case "listing":
		case "plaintext":
		case "xmp": return "pre";
		case "nobr": return "nowrap";
		case "pre": return e.properties?.wrap ? "pre-wrap" : "pre";
		case "td":
		case "th": return e.properties?.noWrap ? "nowrap" : t.whitespace;
		case "textarea": return "pre-wrap";
	}
	return t.whitespace;
}
function kt(e, t, n) {
	return e.type === "element" && e.tagName === "table" ? At(e, t, Pt) : n;
}
function At(e, t, n) {
	for (; ++t < e.children.length;) {
		let r = e.children[t];
		if (r.type === "element" && n(r)) return !0;
	}
	return !1;
}
function jt(e, t) {
	let n = -1;
	for (; ++n < t.length;) e.push(t[n]);
}
function Mt(e) {
	return e.tagName === "td" || e.tagName === "th";
}
function Nt(e) {
	return e.tagName === "tbody" || e.tagName === "tfoot" || e.tagName === "thead";
}
function Pt(e) {
	if (Ft(e)) return !0;
	if (Nt(e)) {
		let t = -1;
		for (; ++t < e.children.length;) {
			let n = e.children[t];
			if (n.type === "element" && Ft(n)) return !0;
		}
	}
	return !1;
}
function Ft(e) {
	return e.tagName === "tr";
}
// node_modules/rehype-katex/lib/index.js
var It = {}, Lt = [];
function Rt(e) {
	let t = e || It;
	return function(e, n) {
		v(e, "element", function(e, i) {
			let a = Array.isArray(e.properties.className) ? e.properties.className : Lt, o = a.includes("language-math"), s = a.includes("math-display"), c = a.includes("math-inline"), l = s;
			if (!o && !s && !c) return;
			let u = i[i.length - 1], d = e;
			/* c8 ignore next -- verbose to test. */
			if (e.tagName === "code" && o && u && u.type === "element" && u.tagName === "pre" && (d = u, u = i[i.length - 2], l = !0), !u) return;
			let f = St(d, { whitespace: "pre" }), p;
			try {
				p = r.renderToString(f, {
					...t,
					displayMode: l,
					throwOnError: !0
				});
			} catch (a) {
				let o = a, s = o.name.toLowerCase();
				n.message("Could not render math with KaTeX", {
					ancestors: [...i, e],
					cause: o,
					place: e.position,
					ruleId: s,
					source: "rehype-katex"
				});
				try {
					p = r.renderToString(f, {
						...t,
						displayMode: l,
						strict: "ignore",
						throwOnError: !1
					});
				} catch {
					p = [{
						type: "element",
						tagName: "span",
						properties: {
							className: ["katex-error"],
							style: "color:" + (t.errorColor || "#cc0000"),
							title: String(a)
						},
						children: [{
							type: "text",
							value: f
						}]
					}];
				}
			}
			typeof p == "string" && (p = mt(p, { fragment: !0 }).children);
			let m = u.children.indexOf(d);
			return u.children.splice(m, 1, ...p), _;
		});
	};
}
// node_modules/@ungap/structured-clone/esm/deserialize.js
var { defineProperty: zt } = Object, Bt = typeof self == "object" ? self : globalThis, Vt = (e, t) => {
	switch (e) {
		case "Function":
		case "SharedWorker":
		case "Worker":
		case "eval":
		case "setInterval":
		case "setTimeout": throw TypeError("unable to deserialize " + e);
	}
	return new Bt[e](t);
}, Ht = (e, t) => {
	let n = (t, n) => (e.set(n, t), t), r = (i) => {
		if (e.has(i)) return e.get(i);
		let [a, o] = t[i];
		switch (a) {
			case 0:
			case -1: return n(o, i);
			case 1: {
				let e = n([], i);
				for (let t of o) e.push(r(t));
				return e;
			}
			case 2: {
				let e = n({}, i);
				for (let [t, n] of o) {
					let i = r(t), a = r(n);
					i === "__proto__" ? zt(e, i, {
						value: a,
						configurable: !0,
						enumerable: !0,
						writable: !0
					}) : e[i] = a;
				}
				return e;
			}
			case 3: return n(new Date(o), i);
			case 4: {
				let { source: e, flags: t } = o;
				return n(new RegExp(e, t), i);
			}
			case 5: {
				let e = n(/* @__PURE__ */ new Map(), i);
				for (let [t, n] of o) e.set(r(t), r(n));
				return e;
			}
			case 6: {
				let e = n(/* @__PURE__ */ new Set(), i);
				for (let t of o) e.add(r(t));
				return e;
			}
			case 7: {
				let { name: e, message: t } = o;
				return n(typeof Bt[e] == "function" ? Vt(e, t) : Error(t), i);
			}
			case 8: return n(BigInt(o), i);
			case "BigInt": return n(Object(BigInt(o)), i);
			case "ArrayBuffer": return n(new Uint8Array(o).buffer, o);
			case "DataView": {
				let { buffer: e } = new Uint8Array(o);
				return n(new DataView(e), o);
			}
			case "-0": return -0;
		}
		return n(Vt(a, o), i);
	};
	return r;
}, Ut = (e) => Ht(/* @__PURE__ */ new Map(), e)(0), Wt = "", { toString: Gt } = {}, { keys: Kt, is: qt } = Object, Jt = (e) => {
	let t = typeof e;
	if (t !== "object" || !e) return [0, t];
	let n = Gt.call(e).slice(8, -1);
	switch (n) {
		case "Array": return [1, Wt];
		case "Object": return [2, Wt];
		case "Date": return [3, Wt];
		case "RegExp": return [4, Wt];
		case "Map": return [5, Wt];
		case "Set": return [6, Wt];
		case "DataView": return [1, n];
	}
	return n.includes("Array") ? [1, n] : e instanceof Error ? [7, e.name || "Error"] : [2, n];
}, Yt = ([e, t]) => e === 0 && (t === "function" || t === "symbol"), Xt = (e, t, n, r) => {
	let i = (e, t) => {
		let i = r.push(e) - 1;
		return n.set(t, i), i;
	}, a = (o) => {
		if (n.has(o)) return n.get(o);
		let [s, c] = Jt(o);
		switch (s) {
			case 0: {
				let t = o;
				switch (c) {
					case "bigint":
						s = 8, t = o.toString();
						break;
					case "number":
						if (!o && qt(o, -0)) return r.push(["-0"]) - 1;
						break;
					case "function":
					case "symbol":
						if (e) throw TypeError("unable to serialize " + c);
						t = null;
						break;
					case "undefined": return i([-1], o);
				}
				return i([s, t], o);
			}
			case 1: {
				if (c) {
					let e = o;
					return c === "DataView" ? e = new Uint8Array(o.buffer) : c === "ArrayBuffer" && (e = new Uint8Array(o)), i([c, [...e]], o);
				}
				let e = [], t = i([s, e], o);
				for (let t of o) e.push(a(t));
				return t;
			}
			case 2: {
				if (c) switch (c) {
					case "BigInt": return i([c, o.toString()], o);
					case "Boolean":
					case "Number":
					case "String": return i([c, o.valueOf()], o);
				}
				if (t && "toJSON" in o) return a(o.toJSON());
				let n = [], r = i([s, n], o);
				for (let t of Kt(o)) (e || !Yt(Jt(o[t]))) && n.push([a(t), a(o[t])]);
				return r;
			}
			case 3: return i([s, isNaN(o.getTime()) ? Wt : o.toISOString()], o);
			case 4: {
				let { source: e, flags: t } = o;
				return i([s, {
					source: e,
					flags: t
				}], o);
			}
			case 5: {
				let t = [], n = i([s, t], o);
				for (let [n, r] of o) (e || !(Yt(Jt(n)) || Yt(Jt(r)))) && t.push([a(n), a(r)]);
				return n;
			}
			case 6: {
				let t = [], n = i([s, t], o);
				for (let n of o) (e || !Yt(Jt(n))) && t.push(a(n));
				return n;
			}
		}
		let { message: l } = o;
		return i([s, {
			name: c,
			message: l
		}], o);
	};
	return a;
}, Zt = (e, { json: t, lossy: n } = {}) => {
	let r = [];
	return Xt(!(t || n), !!t, /* @__PURE__ */ new Map(), r)(e), r;
}, Qt = typeof structuredClone == "function" ? 
/* c8 ignore start */
(e, t) => t && ("json" in t || "lossy" in t) ? Ut(Zt(e, t)) : structuredClone(e) : (e, t) => Ut(Zt(e, t)), $t = class {
	constructor(e, t, n) {
		this.normal = t, this.property = e, n && (this.space = n);
	}
};
$t.prototype.normal = {}, $t.prototype.property = {}, $t.prototype.space = void 0;
// node_modules/hast-util-from-parse5/node_modules/property-information/lib/util/merge.js
function en(e, t) {
	let n = {}, r = {};
	for (let t of e) Object.assign(n, t.property), Object.assign(r, t.normal);
	return new $t(n, r, t);
}
// node_modules/hast-util-from-parse5/node_modules/property-information/lib/normalize.js
function tn(e) {
	return e.toLowerCase();
}
// node_modules/hast-util-from-parse5/node_modules/property-information/lib/util/info.js
var nn = class {
	constructor(e, t) {
		this.attribute = t, this.property = e;
	}
};
nn.prototype.attribute = "", nn.prototype.booleanish = !1, nn.prototype.boolean = !1, nn.prototype.commaOrSpaceSeparated = !1, nn.prototype.commaSeparated = !1, nn.prototype.defined = !1, nn.prototype.mustUseProperty = !1, nn.prototype.number = !1, nn.prototype.overloadedBoolean = !1, nn.prototype.property = "", nn.prototype.spaceSeparated = !1, nn.prototype.space = void 0;
// node_modules/hast-util-from-parse5/node_modules/property-information/lib/util/types.js
var rn = /* @__PURE__ */ t({
	boolean: () => k,
	booleanish: () => on,
	commaOrSpaceSeparated: () => un,
	commaSeparated: () => ln,
	number: () => A,
	overloadedBoolean: () => sn,
	spaceSeparated: () => cn
}), an = 0, k = dn(), on = dn(), sn = dn(), A = dn(), cn = dn(), ln = dn(), un = dn();
function dn() {
	return 2 ** ++an;
}
// node_modules/hast-util-from-parse5/node_modules/property-information/lib/util/defined-info.js
var fn = Object.keys(rn), pn = class extends nn {
	constructor(e, t, n, r) {
		let i = -1;
		if (super(e, t), mn(this, "space", r), typeof n == "number") for (; ++i < fn.length;) {
			let e = fn[i];
			mn(this, fn[i], (n & rn[e]) === rn[e]);
		}
	}
};
pn.prototype.defined = !0;
function mn(e, t, n) {
	n && (e[t] = n);
}
// node_modules/hast-util-from-parse5/node_modules/property-information/lib/util/create.js
function hn(e) {
	let t = {}, n = {};
	for (let [r, i] of Object.entries(e.properties)) {
		let a = new pn(r, e.transform(e.attributes || {}, r), i, e.space);
		e.mustUseProperty && e.mustUseProperty.includes(r) && (a.mustUseProperty = !0), t[r] = a, n[tn(r)] = r, n[tn(a.attribute)] = r;
	}
	return new $t(t, n, e.space);
}
// node_modules/hast-util-from-parse5/node_modules/property-information/lib/aria.js
var gn = hn({
	properties: {
		ariaActiveDescendant: null,
		ariaAtomic: on,
		ariaAutoComplete: null,
		ariaBusy: on,
		ariaChecked: on,
		ariaColCount: A,
		ariaColIndex: A,
		ariaColSpan: A,
		ariaControls: cn,
		ariaCurrent: null,
		ariaDescribedBy: cn,
		ariaDetails: null,
		ariaDisabled: on,
		ariaDropEffect: cn,
		ariaErrorMessage: null,
		ariaExpanded: on,
		ariaFlowTo: cn,
		ariaGrabbed: on,
		ariaHasPopup: null,
		ariaHidden: on,
		ariaInvalid: null,
		ariaKeyShortcuts: null,
		ariaLabel: null,
		ariaLabelledBy: cn,
		ariaLevel: A,
		ariaLive: null,
		ariaModal: on,
		ariaMultiLine: on,
		ariaMultiSelectable: on,
		ariaOrientation: null,
		ariaOwns: cn,
		ariaPlaceholder: null,
		ariaPosInSet: A,
		ariaPressed: on,
		ariaReadOnly: on,
		ariaRelevant: null,
		ariaRequired: on,
		ariaRoleDescription: cn,
		ariaRowCount: A,
		ariaRowIndex: A,
		ariaRowSpan: A,
		ariaSelected: on,
		ariaSetSize: A,
		ariaSort: null,
		ariaValueMax: A,
		ariaValueMin: A,
		ariaValueNow: A,
		ariaValueText: null,
		role: null
	},
	transform(e, t) {
		return t === "role" ? t : "aria-" + t.slice(4).toLowerCase();
	}
});
// node_modules/hast-util-from-parse5/node_modules/property-information/lib/util/case-sensitive-transform.js
function _n(e, t) {
	return t in e ? e[t] : t;
}
// node_modules/hast-util-from-parse5/node_modules/property-information/lib/util/case-insensitive-transform.js
function vn(e, t) {
	return _n(e, t.toLowerCase());
}
// node_modules/hast-util-from-parse5/node_modules/property-information/lib/html.js
var yn = hn({
	attributes: {
		acceptcharset: "accept-charset",
		classname: "class",
		htmlfor: "for",
		httpequiv: "http-equiv"
	},
	mustUseProperty: [
		"checked",
		"multiple",
		"muted",
		"selected"
	],
	properties: {
		abbr: null,
		accept: ln,
		acceptCharset: cn,
		accessKey: cn,
		action: null,
		allow: null,
		allowFullScreen: k,
		allowPaymentRequest: k,
		allowUserMedia: k,
		alpha: k,
		alt: null,
		as: null,
		async: k,
		autoCapitalize: null,
		autoComplete: cn,
		autoFocus: k,
		autoPlay: k,
		blocking: cn,
		capture: null,
		charSet: null,
		checked: k,
		cite: null,
		className: cn,
		closedBy: null,
		colorSpace: null,
		cols: A,
		colSpan: A,
		command: null,
		commandFor: null,
		content: null,
		contentEditable: on,
		controls: k,
		controlsList: cn,
		coords: A | ln,
		crossOrigin: null,
		data: null,
		dateTime: null,
		decoding: null,
		default: k,
		defer: k,
		dir: null,
		dirName: null,
		disabled: k,
		download: sn,
		draggable: on,
		encType: null,
		enterKeyHint: null,
		fetchPriority: null,
		form: null,
		formAction: null,
		formEncType: null,
		formMethod: null,
		formNoValidate: k,
		formTarget: null,
		headers: cn,
		height: A,
		hidden: sn,
		high: A,
		href: null,
		hrefLang: null,
		htmlFor: cn,
		httpEquiv: cn,
		id: null,
		imageSizes: null,
		imageSrcSet: null,
		inert: k,
		inputMode: null,
		integrity: null,
		is: null,
		isMap: k,
		itemId: null,
		itemProp: cn,
		itemRef: cn,
		itemScope: k,
		itemType: cn,
		kind: null,
		label: null,
		lang: null,
		language: null,
		list: null,
		loading: null,
		loop: k,
		low: A,
		manifest: null,
		max: null,
		maxLength: A,
		media: null,
		method: null,
		min: null,
		minLength: A,
		multiple: k,
		muted: k,
		name: null,
		nonce: null,
		noModule: k,
		noValidate: k,
		onAbort: null,
		onAfterPrint: null,
		onAuxClick: null,
		onBeforeMatch: null,
		onBeforePrint: null,
		onBeforeToggle: null,
		onBeforeUnload: null,
		onBlur: null,
		onCancel: null,
		onCanPlay: null,
		onCanPlayThrough: null,
		onChange: null,
		onClick: null,
		onClose: null,
		onContextLost: null,
		onContextMenu: null,
		onContextRestored: null,
		onCopy: null,
		onCueChange: null,
		onCut: null,
		onDblClick: null,
		onDrag: null,
		onDragEnd: null,
		onDragEnter: null,
		onDragExit: null,
		onDragLeave: null,
		onDragOver: null,
		onDragStart: null,
		onDrop: null,
		onDurationChange: null,
		onEmptied: null,
		onEnded: null,
		onError: null,
		onFocus: null,
		onFormData: null,
		onHashChange: null,
		onInput: null,
		onInvalid: null,
		onKeyDown: null,
		onKeyPress: null,
		onKeyUp: null,
		onLanguageChange: null,
		onLoad: null,
		onLoadedData: null,
		onLoadedMetadata: null,
		onLoadEnd: null,
		onLoadStart: null,
		onMessage: null,
		onMessageError: null,
		onMouseDown: null,
		onMouseEnter: null,
		onMouseLeave: null,
		onMouseMove: null,
		onMouseOut: null,
		onMouseOver: null,
		onMouseUp: null,
		onOffline: null,
		onOnline: null,
		onPageHide: null,
		onPageShow: null,
		onPaste: null,
		onPause: null,
		onPlay: null,
		onPlaying: null,
		onPopState: null,
		onProgress: null,
		onRateChange: null,
		onRejectionHandled: null,
		onReset: null,
		onResize: null,
		onScroll: null,
		onScrollEnd: null,
		onSecurityPolicyViolation: null,
		onSeeked: null,
		onSeeking: null,
		onSelect: null,
		onSlotChange: null,
		onStalled: null,
		onStorage: null,
		onSubmit: null,
		onSuspend: null,
		onTimeUpdate: null,
		onToggle: null,
		onUnhandledRejection: null,
		onUnload: null,
		onVolumeChange: null,
		onWaiting: null,
		onWheel: null,
		open: k,
		optimum: A,
		pattern: null,
		ping: cn,
		placeholder: null,
		playsInline: k,
		popover: null,
		popoverTarget: null,
		popoverTargetAction: null,
		poster: null,
		preload: null,
		readOnly: k,
		referrerPolicy: null,
		rel: cn,
		required: k,
		reversed: k,
		rows: A,
		rowSpan: A,
		sandbox: cn,
		scope: null,
		scoped: k,
		seamless: k,
		selected: k,
		shadowRootClonable: k,
		shadowRootCustomElementRegistry: k,
		shadowRootDelegatesFocus: k,
		shadowRootMode: null,
		shadowRootSerializable: k,
		shape: null,
		size: A,
		sizes: null,
		slot: null,
		span: A,
		spellCheck: on,
		src: null,
		srcDoc: null,
		srcLang: null,
		srcSet: null,
		start: A,
		step: null,
		style: null,
		tabIndex: A,
		target: null,
		title: null,
		translate: null,
		type: null,
		typeMustMatch: k,
		useMap: null,
		value: on,
		width: A,
		wrap: null,
		writingSuggestions: null,
		align: null,
		aLink: null,
		archive: cn,
		axis: null,
		background: null,
		bgColor: null,
		border: A,
		borderColor: null,
		bottomMargin: A,
		cellPadding: null,
		cellSpacing: null,
		char: null,
		charOff: null,
		classId: null,
		clear: null,
		code: null,
		codeBase: null,
		codeType: null,
		color: null,
		compact: k,
		declare: k,
		event: null,
		face: null,
		frame: null,
		frameBorder: null,
		hSpace: A,
		leftMargin: A,
		link: null,
		longDesc: null,
		lowSrc: null,
		marginHeight: A,
		marginWidth: A,
		noResize: k,
		noHref: k,
		noShade: k,
		noWrap: k,
		object: null,
		profile: null,
		prompt: null,
		rev: null,
		rightMargin: A,
		rules: null,
		scheme: null,
		scrolling: on,
		standby: null,
		summary: null,
		text: null,
		topMargin: A,
		valueType: null,
		version: null,
		vAlign: null,
		vLink: null,
		vSpace: A,
		allowTransparency: null,
		autoCorrect: null,
		autoSave: null,
		credentialless: k,
		disablePictureInPicture: k,
		disableRemotePlayback: k,
		exportParts: ln,
		part: cn,
		prefix: null,
		property: null,
		results: A,
		security: null,
		unselectable: null
	},
	space: "html",
	transform: vn
}), bn = hn({
	attributes: {
		accentHeight: "accent-height",
		alignmentBaseline: "alignment-baseline",
		arabicForm: "arabic-form",
		baselineShift: "baseline-shift",
		capHeight: "cap-height",
		className: "class",
		clipPath: "clip-path",
		clipRule: "clip-rule",
		colorInterpolation: "color-interpolation",
		colorInterpolationFilters: "color-interpolation-filters",
		colorProfile: "color-profile",
		colorRendering: "color-rendering",
		crossOrigin: "crossorigin",
		dataType: "datatype",
		dominantBaseline: "dominant-baseline",
		enableBackground: "enable-background",
		fillOpacity: "fill-opacity",
		fillRule: "fill-rule",
		floodColor: "flood-color",
		floodOpacity: "flood-opacity",
		fontFamily: "font-family",
		fontSize: "font-size",
		fontSizeAdjust: "font-size-adjust",
		fontStretch: "font-stretch",
		fontStyle: "font-style",
		fontVariant: "font-variant",
		fontWeight: "font-weight",
		glyphName: "glyph-name",
		glyphOrientationHorizontal: "glyph-orientation-horizontal",
		glyphOrientationVertical: "glyph-orientation-vertical",
		hrefLang: "hreflang",
		horizAdvX: "horiz-adv-x",
		horizOriginX: "horiz-origin-x",
		horizOriginY: "horiz-origin-y",
		imageRendering: "image-rendering",
		letterSpacing: "letter-spacing",
		lightingColor: "lighting-color",
		markerEnd: "marker-end",
		markerMid: "marker-mid",
		markerStart: "marker-start",
		maskType: "mask-type",
		navDown: "nav-down",
		navDownLeft: "nav-down-left",
		navDownRight: "nav-down-right",
		navLeft: "nav-left",
		navNext: "nav-next",
		navPrev: "nav-prev",
		navRight: "nav-right",
		navUp: "nav-up",
		navUpLeft: "nav-up-left",
		navUpRight: "nav-up-right",
		onAbort: "onabort",
		onActivate: "onactivate",
		onAfterPrint: "onafterprint",
		onBeforePrint: "onbeforeprint",
		onBegin: "onbegin",
		onCancel: "oncancel",
		onCanPlay: "oncanplay",
		onCanPlayThrough: "oncanplaythrough",
		onChange: "onchange",
		onClick: "onclick",
		onClose: "onclose",
		onCopy: "oncopy",
		onCueChange: "oncuechange",
		onCut: "oncut",
		onDblClick: "ondblclick",
		onDrag: "ondrag",
		onDragEnd: "ondragend",
		onDragEnter: "ondragenter",
		onDragExit: "ondragexit",
		onDragLeave: "ondragleave",
		onDragOver: "ondragover",
		onDragStart: "ondragstart",
		onDrop: "ondrop",
		onDurationChange: "ondurationchange",
		onEmptied: "onemptied",
		onEnd: "onend",
		onEnded: "onended",
		onError: "onerror",
		onFocus: "onfocus",
		onFocusIn: "onfocusin",
		onFocusOut: "onfocusout",
		onHashChange: "onhashchange",
		onInput: "oninput",
		onInvalid: "oninvalid",
		onKeyDown: "onkeydown",
		onKeyPress: "onkeypress",
		onKeyUp: "onkeyup",
		onLoad: "onload",
		onLoadedData: "onloadeddata",
		onLoadedMetadata: "onloadedmetadata",
		onLoadStart: "onloadstart",
		onMessage: "onmessage",
		onMouseDown: "onmousedown",
		onMouseEnter: "onmouseenter",
		onMouseLeave: "onmouseleave",
		onMouseMove: "onmousemove",
		onMouseOut: "onmouseout",
		onMouseOver: "onmouseover",
		onMouseUp: "onmouseup",
		onMouseWheel: "onmousewheel",
		onOffline: "onoffline",
		onOnline: "ononline",
		onPageHide: "onpagehide",
		onPageShow: "onpageshow",
		onPaste: "onpaste",
		onPause: "onpause",
		onPlay: "onplay",
		onPlaying: "onplaying",
		onPopState: "onpopstate",
		onProgress: "onprogress",
		onRateChange: "onratechange",
		onRepeat: "onrepeat",
		onReset: "onreset",
		onResize: "onresize",
		onScroll: "onscroll",
		onSeeked: "onseeked",
		onSeeking: "onseeking",
		onSelect: "onselect",
		onShow: "onshow",
		onStalled: "onstalled",
		onStorage: "onstorage",
		onSubmit: "onsubmit",
		onSuspend: "onsuspend",
		onTimeUpdate: "ontimeupdate",
		onToggle: "ontoggle",
		onUnload: "onunload",
		onVolumeChange: "onvolumechange",
		onWaiting: "onwaiting",
		onZoom: "onzoom",
		overlinePosition: "overline-position",
		overlineThickness: "overline-thickness",
		paintOrder: "paint-order",
		panose1: "panose-1",
		pointerEvents: "pointer-events",
		referrerPolicy: "referrerpolicy",
		renderingIntent: "rendering-intent",
		shapeRendering: "shape-rendering",
		stopColor: "stop-color",
		stopOpacity: "stop-opacity",
		strikethroughPosition: "strikethrough-position",
		strikethroughThickness: "strikethrough-thickness",
		strokeDashArray: "stroke-dasharray",
		strokeDashOffset: "stroke-dashoffset",
		strokeLineCap: "stroke-linecap",
		strokeLineJoin: "stroke-linejoin",
		strokeMiterLimit: "stroke-miterlimit",
		strokeOpacity: "stroke-opacity",
		strokeWidth: "stroke-width",
		tabIndex: "tabindex",
		textAnchor: "text-anchor",
		textDecoration: "text-decoration",
		textRendering: "text-rendering",
		transformOrigin: "transform-origin",
		typeOf: "typeof",
		underlinePosition: "underline-position",
		underlineThickness: "underline-thickness",
		unicodeBidi: "unicode-bidi",
		unicodeRange: "unicode-range",
		unitsPerEm: "units-per-em",
		vAlphabetic: "v-alphabetic",
		vHanging: "v-hanging",
		vIdeographic: "v-ideographic",
		vMathematical: "v-mathematical",
		vectorEffect: "vector-effect",
		vertAdvY: "vert-adv-y",
		vertOriginX: "vert-origin-x",
		vertOriginY: "vert-origin-y",
		wordSpacing: "word-spacing",
		writingMode: "writing-mode",
		xHeight: "x-height",
		playbackOrder: "playbackorder",
		timelineBegin: "timelinebegin"
	},
	properties: {
		about: un,
		accentHeight: A,
		accumulate: null,
		additive: null,
		alignmentBaseline: null,
		alphabetic: A,
		amplitude: A,
		arabicForm: null,
		ascent: A,
		attributeName: null,
		attributeType: null,
		azimuth: A,
		bandwidth: null,
		baselineShift: null,
		baseFrequency: null,
		baseProfile: null,
		bbox: null,
		begin: null,
		bias: A,
		by: null,
		calcMode: null,
		capHeight: A,
		className: cn,
		clip: null,
		clipPath: null,
		clipPathUnits: null,
		clipRule: null,
		color: null,
		colorInterpolation: null,
		colorInterpolationFilters: null,
		colorProfile: null,
		colorRendering: null,
		content: null,
		contentScriptType: null,
		contentStyleType: null,
		crossOrigin: null,
		cursor: null,
		cx: null,
		cy: null,
		d: null,
		dataType: null,
		defaultAction: null,
		descent: A,
		diffuseConstant: A,
		direction: null,
		display: null,
		dur: null,
		divisor: A,
		dominantBaseline: null,
		download: k,
		dx: null,
		dy: null,
		edgeMode: null,
		editable: null,
		elevation: A,
		enableBackground: null,
		end: null,
		event: null,
		exponent: A,
		externalResourcesRequired: null,
		fill: null,
		fillOpacity: A,
		fillRule: null,
		filter: null,
		filterRes: null,
		filterUnits: null,
		floodColor: null,
		floodOpacity: null,
		focusable: null,
		focusHighlight: null,
		fontFamily: null,
		fontSize: null,
		fontSizeAdjust: null,
		fontStretch: null,
		fontStyle: null,
		fontVariant: null,
		fontWeight: null,
		format: null,
		fr: null,
		from: null,
		fx: null,
		fy: null,
		g1: ln,
		g2: ln,
		glyphName: ln,
		glyphOrientationHorizontal: null,
		glyphOrientationVertical: null,
		glyphRef: null,
		gradientTransform: null,
		gradientUnits: null,
		handler: null,
		hanging: A,
		hatchContentUnits: null,
		hatchUnits: null,
		height: null,
		href: null,
		hrefLang: null,
		horizAdvX: A,
		horizOriginX: A,
		horizOriginY: A,
		id: null,
		ideographic: A,
		imageRendering: null,
		initialVisibility: null,
		in: null,
		in2: null,
		intercept: A,
		k: A,
		k1: A,
		k2: A,
		k3: A,
		k4: A,
		kernelMatrix: un,
		kernelUnitLength: null,
		keyPoints: null,
		keySplines: null,
		keyTimes: null,
		kerning: null,
		lang: null,
		lengthAdjust: null,
		letterSpacing: null,
		lightingColor: null,
		limitingConeAngle: A,
		local: null,
		markerEnd: null,
		markerMid: null,
		markerStart: null,
		markerHeight: null,
		markerUnits: null,
		markerWidth: null,
		mask: null,
		maskContentUnits: null,
		maskType: null,
		maskUnits: null,
		mathematical: null,
		max: null,
		media: null,
		mediaCharacterEncoding: null,
		mediaContentEncodings: null,
		mediaSize: A,
		mediaTime: null,
		method: null,
		min: null,
		mode: null,
		name: null,
		navDown: null,
		navDownLeft: null,
		navDownRight: null,
		navLeft: null,
		navNext: null,
		navPrev: null,
		navRight: null,
		navUp: null,
		navUpLeft: null,
		navUpRight: null,
		numOctaves: null,
		observer: null,
		offset: null,
		onAbort: null,
		onActivate: null,
		onAfterPrint: null,
		onBeforePrint: null,
		onBegin: null,
		onCancel: null,
		onCanPlay: null,
		onCanPlayThrough: null,
		onChange: null,
		onClick: null,
		onClose: null,
		onCopy: null,
		onCueChange: null,
		onCut: null,
		onDblClick: null,
		onDrag: null,
		onDragEnd: null,
		onDragEnter: null,
		onDragExit: null,
		onDragLeave: null,
		onDragOver: null,
		onDragStart: null,
		onDrop: null,
		onDurationChange: null,
		onEmptied: null,
		onEnd: null,
		onEnded: null,
		onError: null,
		onFocus: null,
		onFocusIn: null,
		onFocusOut: null,
		onHashChange: null,
		onInput: null,
		onInvalid: null,
		onKeyDown: null,
		onKeyPress: null,
		onKeyUp: null,
		onLoad: null,
		onLoadedData: null,
		onLoadedMetadata: null,
		onLoadStart: null,
		onMessage: null,
		onMouseDown: null,
		onMouseEnter: null,
		onMouseLeave: null,
		onMouseMove: null,
		onMouseOut: null,
		onMouseOver: null,
		onMouseUp: null,
		onMouseWheel: null,
		onOffline: null,
		onOnline: null,
		onPageHide: null,
		onPageShow: null,
		onPaste: null,
		onPause: null,
		onPlay: null,
		onPlaying: null,
		onPopState: null,
		onProgress: null,
		onRateChange: null,
		onRepeat: null,
		onReset: null,
		onResize: null,
		onScroll: null,
		onSeeked: null,
		onSeeking: null,
		onSelect: null,
		onShow: null,
		onStalled: null,
		onStorage: null,
		onSubmit: null,
		onSuspend: null,
		onTimeUpdate: null,
		onToggle: null,
		onUnload: null,
		onVolumeChange: null,
		onWaiting: null,
		onZoom: null,
		opacity: null,
		operator: null,
		order: null,
		orient: null,
		orientation: null,
		origin: null,
		overflow: null,
		overlay: null,
		overlinePosition: A,
		overlineThickness: A,
		paintOrder: null,
		panose1: null,
		path: null,
		pathLength: A,
		patternContentUnits: null,
		patternTransform: null,
		patternUnits: null,
		phase: null,
		ping: cn,
		pitch: null,
		playbackOrder: null,
		pointerEvents: null,
		points: null,
		pointsAtX: A,
		pointsAtY: A,
		pointsAtZ: A,
		preserveAlpha: null,
		preserveAspectRatio: null,
		primitiveUnits: null,
		propagate: null,
		property: un,
		r: null,
		radius: null,
		referrerPolicy: null,
		refX: null,
		refY: null,
		rel: un,
		rev: un,
		renderingIntent: null,
		repeatCount: null,
		repeatDur: null,
		requiredExtensions: un,
		requiredFeatures: un,
		requiredFonts: un,
		requiredFormats: un,
		resource: null,
		restart: null,
		result: null,
		rotate: null,
		rx: null,
		ry: null,
		scale: null,
		seed: null,
		shapeRendering: null,
		side: null,
		slope: null,
		snapshotTime: null,
		specularConstant: A,
		specularExponent: A,
		spreadMethod: null,
		spacing: null,
		startOffset: null,
		stdDeviation: null,
		stemh: null,
		stemv: null,
		stitchTiles: null,
		stopColor: null,
		stopOpacity: null,
		strikethroughPosition: A,
		strikethroughThickness: A,
		string: null,
		stroke: null,
		strokeDashArray: un,
		strokeDashOffset: null,
		strokeLineCap: null,
		strokeLineJoin: null,
		strokeMiterLimit: A,
		strokeOpacity: A,
		strokeWidth: null,
		style: null,
		surfaceScale: A,
		syncBehavior: null,
		syncBehaviorDefault: null,
		syncMaster: null,
		syncTolerance: null,
		syncToleranceDefault: null,
		systemLanguage: un,
		tabIndex: A,
		tableValues: null,
		target: null,
		targetX: A,
		targetY: A,
		textAnchor: null,
		textDecoration: null,
		textRendering: null,
		textLength: null,
		timelineBegin: null,
		title: null,
		transformBehavior: null,
		type: null,
		typeOf: un,
		to: null,
		transform: null,
		transformOrigin: null,
		u1: null,
		u2: null,
		underlinePosition: A,
		underlineThickness: A,
		unicode: null,
		unicodeBidi: null,
		unicodeRange: null,
		unitsPerEm: A,
		values: null,
		vAlphabetic: A,
		vMathematical: A,
		vectorEffect: null,
		vHanging: A,
		vIdeographic: A,
		version: null,
		vertAdvY: A,
		vertOriginX: A,
		vertOriginY: A,
		viewBox: null,
		viewTarget: null,
		visibility: null,
		width: null,
		widths: null,
		wordSpacing: null,
		writingMode: null,
		x: null,
		x1: null,
		x2: null,
		xChannelSelector: null,
		xHeight: A,
		y: null,
		y1: null,
		y2: null,
		yChannelSelector: null,
		z: null,
		zoomAndPan: null
	},
	space: "svg",
	transform: _n
}), xn = hn({
	properties: {
		xLinkActuate: null,
		xLinkArcRole: null,
		xLinkHref: null,
		xLinkRole: null,
		xLinkShow: null,
		xLinkTitle: null,
		xLinkType: null
	},
	space: "xlink",
	transform(e, t) {
		return "xlink:" + t.slice(5).toLowerCase();
	}
}), Sn = hn({
	attributes: { xmlnsxlink: "xmlns:xlink" },
	properties: {
		xmlnsXLink: null,
		xmlns: null
	},
	space: "xmlns",
	transform: vn
}), Cn = hn({
	properties: {
		xmlBase: null,
		xmlLang: null,
		xmlSpace: null
	},
	space: "xml",
	transform(e, t) {
		return "xml:" + t.slice(3).toLowerCase();
	}
}), wn = /[A-Z]/g, Tn = /-[a-z]/g, En = /^data[-\w.:]+$/i;
function Dn(e, t) {
	let n = tn(t), r = t, i = nn;
	if (n in e.normal) return e.property[e.normal[n]];
	if (n.length > 4 && n.slice(0, 4) === "data" && En.test(t)) {
		if (t.charAt(4) === "-") {
			let e = t.slice(5).replace(Tn, kn);
			r = "data" + e.charAt(0).toUpperCase() + e.slice(1);
		} else {
			let e = t.slice(4);
			if (!Tn.test(e)) {
				let n = e.replace(wn, On);
				n.charAt(0) !== "-" && (n = "-" + n), t = "data" + n;
			}
		}
		i = pn;
	}
	return new i(r, t);
}
function On(e) {
	return "-" + e.toLowerCase();
}
function kn(e) {
	return e.charAt(1).toUpperCase();
}
// node_modules/hast-util-from-parse5/node_modules/property-information/index.js
var An = en([
	gn,
	yn,
	xn,
	Sn,
	Cn
], "html"), jn = en([
	gn,
	bn,
	xn,
	Sn,
	Cn
], "svg");
// node_modules/vfile-location/lib/index.js
function Mn(e) {
	let t = String(e), n = [];
	return {
		toOffset: i,
		toPoint: r
	};
	function r(e) {
		if (typeof e == "number" && e > -1 && e <= t.length) {
			let r = 0;
			for (;;) {
				let i = n[r];
				if (i === void 0) {
					let e = Nn(t, n[r - 1]);
					i = e === -1 ? t.length + 1 : e + 1, n[r] = i;
				}
				if (i > e) return {
					line: r + 1,
					column: e - (r > 0 ? n[r - 1] : 0) + 1,
					offset: e
				};
				r++;
			}
		}
	}
	function i(e) {
		if (e && typeof e.line == "number" && typeof e.column == "number" && !Number.isNaN(e.line) && !Number.isNaN(e.column)) {
			for (; n.length < e.line;) {
				let e = n[n.length - 1], r = Nn(t, e), i = r === -1 ? t.length + 1 : r + 1;
				if (e === i) break;
				n.push(i);
			}
			let r = (e.line > 1 ? n[e.line - 2] : 0) + e.column - 1;
			if (r < n[e.line - 1]) return r;
		}
	}
}
function Nn(e, t) {
	let n = e.indexOf("\r", t), r = e.indexOf("\n", t);
	return r === -1 ? n : n === -1 || n + 1 === r ? r : n < r ? n : r;
}
// node_modules/hast-util-from-parse5/lib/index.js
var Pn = {}.hasOwnProperty, Fn = Object.prototype;
function In(e, t) {
	let n = t || {};
	return Ln({
		file: n.file || void 0,
		location: !1,
		schema: n.space === "svg" ? jn : An,
		verbose: n.verbose || !1
	}, e);
}
function Ln(e, t) {
	let n;
	switch (t.nodeName) {
		case "#comment": {
			let r = t;
			return n = {
				type: "comment",
				value: r.data
			}, Bn(e, r, n), n;
		}
		case "#document":
		case "#document-fragment": {
			let r = t, i = "mode" in r ? r.mode === "quirks" || r.mode === "limited-quirks" : !1;
			if (n = {
				type: "root",
				children: Rn(e, t.childNodes),
				data: { quirksMode: i }
			}, e.file && e.location) {
				let t = String(e.file), r = Mn(t), i = r.toPoint(0), a = r.toPoint(t.length);
				n.position = {
					start: i,
					end: a
				};
			}
			return n;
		}
		case "#documentType": {
			let r = t;
			return n = { type: "doctype" }, Bn(e, r, n), n;
		}
		case "#text": {
			let r = t;
			return n = {
				type: "text",
				value: r.value
			}, Bn(e, r, n), n;
		}
		default: return n = zn(e, t), n;
	}
}
function Rn(e, t) {
	let n = -1, r = [];
	for (; ++n < t.length;) {
		let i = Ln(e, t[n]);
		r.push(i);
	}
	return r;
}
function zn(e, t) {
	let { schema: n } = e;
	e.schema = t.namespaceURI === rt.svg ? jn : An;
	let r = -1, i = {};
	for (; ++r < t.attrs.length;) {
		let e = t.attrs[r], n = (e.prefix ? e.prefix + ":" : "") + e.name;
		Pn.call(Fn, n) || (i[n] = e.value);
	}
	let a = (e.schema.space === "svg" ? nt : tt)(t.tagName, i, Rn(e, t.childNodes));
	if (Bn(e, t, a), a.tagName === "template") {
		if (t.namespaceURI === rt.html) {
			let n = t, r = n.sourceCodeLocation, i = r && r.startTag && Hn(r.startTag), o = r && r.endTag && Hn(r.endTag), s = Ln(e, n.content);
			i && o && e.file && (s.position = {
				start: i.end,
				end: o.start
			}), a.content = s;
		} else a.content && (a.children = a.content.children, delete a.content);
	}
	return e.schema = n, a;
}
function Bn(e, t, n) {
	if ("sourceCodeLocation" in t && t.sourceCodeLocation && e.file) {
		let r = Vn(e, n, t.sourceCodeLocation);
		r && (e.location = !0, n.position = r);
	}
}
function Vn(e, t, n) {
	let r = Hn(n);
	if (t.type === "element") {
		let i = t.children[t.children.length - 1];
		if (r && !n.endTag && i && i.position && i.position.end && (r.end = Object.assign({}, i.position.end)), e.verbose) {
			let r = {}, i;
			if (n.attrs) for (i in n.attrs) Pn.call(n.attrs, i) && (r[Dn(e.schema, i).property] = Hn(n.attrs[i]));
			n.startTag;
			let a = Hn(n.startTag), o = n.endTag ? Hn(n.endTag) : void 0, s = { opening: a };
			o && (s.closing = o), s.properties = r, t.data = { position: s };
		}
	}
	return r;
}
function Hn(e) {
	let t = Un({
		line: e.startLine,
		column: e.startCol,
		offset: e.startOffset
	}), n = Un({
		line: e.endLine,
		column: e.endCol,
		offset: e.endOffset
	});
	return t || n ? {
		start: t,
		end: n
	} : void 0;
}
function Un(e) {
	return e.line && e.column ? e : void 0;
}
// node_modules/hast-util-to-parse5/node_modules/property-information/lib/util/schema.js
var Wn = class {
	constructor(e, t, n) {
		this.normal = t, this.property = e, n && (this.space = n);
	}
};
Wn.prototype.normal = {}, Wn.prototype.property = {}, Wn.prototype.space = void 0;
// node_modules/hast-util-to-parse5/node_modules/property-information/lib/util/merge.js
function Gn(e, t) {
	let n = {}, r = {};
	for (let t of e) Object.assign(n, t.property), Object.assign(r, t.normal);
	return new Wn(n, r, t);
}
// node_modules/hast-util-to-parse5/node_modules/property-information/lib/normalize.js
function Kn(e) {
	return e.toLowerCase();
}
// node_modules/hast-util-to-parse5/node_modules/property-information/lib/util/info.js
var qn = class {
	constructor(e, t) {
		this.attribute = t, this.property = e;
	}
};
qn.prototype.attribute = "", qn.prototype.booleanish = !1, qn.prototype.boolean = !1, qn.prototype.commaOrSpaceSeparated = !1, qn.prototype.commaSeparated = !1, qn.prototype.defined = !1, qn.prototype.mustUseProperty = !1, qn.prototype.number = !1, qn.prototype.overloadedBoolean = !1, qn.prototype.property = "", qn.prototype.spaceSeparated = !1, qn.prototype.space = void 0;
// node_modules/hast-util-to-parse5/node_modules/property-information/lib/util/types.js
var Jn = /* @__PURE__ */ t({
	boolean: () => j,
	booleanish: () => Xn,
	commaOrSpaceSeparated: () => $n,
	commaSeparated: () => Qn,
	number: () => M,
	overloadedBoolean: () => Zn,
	spaceSeparated: () => N
}), Yn = 0, j = er(), Xn = er(), Zn = er(), M = er(), N = er(), Qn = er(), $n = er();
function er() {
	return 2 ** ++Yn;
}
// node_modules/hast-util-to-parse5/node_modules/property-information/lib/util/defined-info.js
var tr = Object.keys(Jn), nr = class extends qn {
	constructor(e, t, n, r) {
		let i = -1;
		if (super(e, t), rr(this, "space", r), typeof n == "number") for (; ++i < tr.length;) {
			let e = tr[i];
			rr(this, tr[i], (n & Jn[e]) === Jn[e]);
		}
	}
};
nr.prototype.defined = !0;
function rr(e, t, n) {
	n && (e[t] = n);
}
// node_modules/hast-util-to-parse5/node_modules/property-information/lib/util/create.js
function ir(e) {
	let t = {}, n = {};
	for (let [r, i] of Object.entries(e.properties)) {
		let a = new nr(r, e.transform(e.attributes || {}, r), i, e.space);
		e.mustUseProperty && e.mustUseProperty.includes(r) && (a.mustUseProperty = !0), t[r] = a, n[Kn(r)] = r, n[Kn(a.attribute)] = r;
	}
	return new Wn(t, n, e.space);
}
// node_modules/hast-util-to-parse5/node_modules/property-information/lib/aria.js
var ar = ir({
	properties: {
		ariaActiveDescendant: null,
		ariaAtomic: Xn,
		ariaAutoComplete: null,
		ariaBusy: Xn,
		ariaChecked: Xn,
		ariaColCount: M,
		ariaColIndex: M,
		ariaColSpan: M,
		ariaControls: N,
		ariaCurrent: null,
		ariaDescribedBy: N,
		ariaDetails: null,
		ariaDisabled: Xn,
		ariaDropEffect: N,
		ariaErrorMessage: null,
		ariaExpanded: Xn,
		ariaFlowTo: N,
		ariaGrabbed: Xn,
		ariaHasPopup: null,
		ariaHidden: Xn,
		ariaInvalid: null,
		ariaKeyShortcuts: null,
		ariaLabel: null,
		ariaLabelledBy: N,
		ariaLevel: M,
		ariaLive: null,
		ariaModal: Xn,
		ariaMultiLine: Xn,
		ariaMultiSelectable: Xn,
		ariaOrientation: null,
		ariaOwns: N,
		ariaPlaceholder: null,
		ariaPosInSet: M,
		ariaPressed: Xn,
		ariaReadOnly: Xn,
		ariaRelevant: null,
		ariaRequired: Xn,
		ariaRoleDescription: N,
		ariaRowCount: M,
		ariaRowIndex: M,
		ariaRowSpan: M,
		ariaSelected: Xn,
		ariaSetSize: M,
		ariaSort: null,
		ariaValueMax: M,
		ariaValueMin: M,
		ariaValueNow: M,
		ariaValueText: null,
		role: null
	},
	transform(e, t) {
		return t === "role" ? t : "aria-" + t.slice(4).toLowerCase();
	}
});
// node_modules/hast-util-to-parse5/node_modules/property-information/lib/util/case-sensitive-transform.js
function or(e, t) {
	return t in e ? e[t] : t;
}
// node_modules/hast-util-to-parse5/node_modules/property-information/lib/util/case-insensitive-transform.js
function sr(e, t) {
	return or(e, t.toLowerCase());
}
// node_modules/hast-util-to-parse5/node_modules/property-information/lib/html.js
var cr = ir({
	attributes: {
		acceptcharset: "accept-charset",
		classname: "class",
		htmlfor: "for",
		httpequiv: "http-equiv"
	},
	mustUseProperty: [
		"checked",
		"multiple",
		"muted",
		"selected"
	],
	properties: {
		abbr: null,
		accept: Qn,
		acceptCharset: N,
		accessKey: N,
		action: null,
		allow: null,
		allowFullScreen: j,
		allowPaymentRequest: j,
		allowUserMedia: j,
		alpha: j,
		alt: null,
		as: null,
		async: j,
		autoCapitalize: null,
		autoComplete: N,
		autoFocus: j,
		autoPlay: j,
		blocking: N,
		capture: null,
		charSet: null,
		checked: j,
		cite: null,
		className: N,
		closedBy: null,
		colorSpace: null,
		cols: M,
		colSpan: M,
		command: null,
		commandFor: null,
		content: null,
		contentEditable: Xn,
		controls: j,
		controlsList: N,
		coords: M | Qn,
		crossOrigin: null,
		data: null,
		dateTime: null,
		decoding: null,
		default: j,
		defer: j,
		dir: null,
		dirName: null,
		disabled: j,
		download: Zn,
		draggable: Xn,
		encType: null,
		enterKeyHint: null,
		fetchPriority: null,
		form: null,
		formAction: null,
		formEncType: null,
		formMethod: null,
		formNoValidate: j,
		formTarget: null,
		headers: N,
		height: M,
		hidden: Zn,
		high: M,
		href: null,
		hrefLang: null,
		htmlFor: N,
		httpEquiv: N,
		id: null,
		imageSizes: null,
		imageSrcSet: null,
		inert: j,
		inputMode: null,
		integrity: null,
		is: null,
		isMap: j,
		itemId: null,
		itemProp: N,
		itemRef: N,
		itemScope: j,
		itemType: N,
		kind: null,
		label: null,
		lang: null,
		language: null,
		list: null,
		loading: null,
		loop: j,
		low: M,
		manifest: null,
		max: null,
		maxLength: M,
		media: null,
		method: null,
		min: null,
		minLength: M,
		multiple: j,
		muted: j,
		name: null,
		nonce: null,
		noModule: j,
		noValidate: j,
		onAbort: null,
		onAfterPrint: null,
		onAuxClick: null,
		onBeforeMatch: null,
		onBeforePrint: null,
		onBeforeToggle: null,
		onBeforeUnload: null,
		onBlur: null,
		onCancel: null,
		onCanPlay: null,
		onCanPlayThrough: null,
		onChange: null,
		onClick: null,
		onClose: null,
		onContextLost: null,
		onContextMenu: null,
		onContextRestored: null,
		onCopy: null,
		onCueChange: null,
		onCut: null,
		onDblClick: null,
		onDrag: null,
		onDragEnd: null,
		onDragEnter: null,
		onDragExit: null,
		onDragLeave: null,
		onDragOver: null,
		onDragStart: null,
		onDrop: null,
		onDurationChange: null,
		onEmptied: null,
		onEnded: null,
		onError: null,
		onFocus: null,
		onFormData: null,
		onHashChange: null,
		onInput: null,
		onInvalid: null,
		onKeyDown: null,
		onKeyPress: null,
		onKeyUp: null,
		onLanguageChange: null,
		onLoad: null,
		onLoadedData: null,
		onLoadedMetadata: null,
		onLoadEnd: null,
		onLoadStart: null,
		onMessage: null,
		onMessageError: null,
		onMouseDown: null,
		onMouseEnter: null,
		onMouseLeave: null,
		onMouseMove: null,
		onMouseOut: null,
		onMouseOver: null,
		onMouseUp: null,
		onOffline: null,
		onOnline: null,
		onPageHide: null,
		onPageShow: null,
		onPaste: null,
		onPause: null,
		onPlay: null,
		onPlaying: null,
		onPopState: null,
		onProgress: null,
		onRateChange: null,
		onRejectionHandled: null,
		onReset: null,
		onResize: null,
		onScroll: null,
		onScrollEnd: null,
		onSecurityPolicyViolation: null,
		onSeeked: null,
		onSeeking: null,
		onSelect: null,
		onSlotChange: null,
		onStalled: null,
		onStorage: null,
		onSubmit: null,
		onSuspend: null,
		onTimeUpdate: null,
		onToggle: null,
		onUnhandledRejection: null,
		onUnload: null,
		onVolumeChange: null,
		onWaiting: null,
		onWheel: null,
		open: j,
		optimum: M,
		pattern: null,
		ping: N,
		placeholder: null,
		playsInline: j,
		popover: null,
		popoverTarget: null,
		popoverTargetAction: null,
		poster: null,
		preload: null,
		readOnly: j,
		referrerPolicy: null,
		rel: N,
		required: j,
		reversed: j,
		rows: M,
		rowSpan: M,
		sandbox: N,
		scope: null,
		scoped: j,
		seamless: j,
		selected: j,
		shadowRootClonable: j,
		shadowRootCustomElementRegistry: j,
		shadowRootDelegatesFocus: j,
		shadowRootMode: null,
		shadowRootSerializable: j,
		shape: null,
		size: M,
		sizes: null,
		slot: null,
		span: M,
		spellCheck: Xn,
		src: null,
		srcDoc: null,
		srcLang: null,
		srcSet: null,
		start: M,
		step: null,
		style: null,
		tabIndex: M,
		target: null,
		title: null,
		translate: null,
		type: null,
		typeMustMatch: j,
		useMap: null,
		value: Xn,
		width: M,
		wrap: null,
		writingSuggestions: null,
		align: null,
		aLink: null,
		archive: N,
		axis: null,
		background: null,
		bgColor: null,
		border: M,
		borderColor: null,
		bottomMargin: M,
		cellPadding: null,
		cellSpacing: null,
		char: null,
		charOff: null,
		classId: null,
		clear: null,
		code: null,
		codeBase: null,
		codeType: null,
		color: null,
		compact: j,
		declare: j,
		event: null,
		face: null,
		frame: null,
		frameBorder: null,
		hSpace: M,
		leftMargin: M,
		link: null,
		longDesc: null,
		lowSrc: null,
		marginHeight: M,
		marginWidth: M,
		noResize: j,
		noHref: j,
		noShade: j,
		noWrap: j,
		object: null,
		profile: null,
		prompt: null,
		rev: null,
		rightMargin: M,
		rules: null,
		scheme: null,
		scrolling: Xn,
		standby: null,
		summary: null,
		text: null,
		topMargin: M,
		valueType: null,
		version: null,
		vAlign: null,
		vLink: null,
		vSpace: M,
		allowTransparency: null,
		autoCorrect: null,
		autoSave: null,
		credentialless: j,
		disablePictureInPicture: j,
		disableRemotePlayback: j,
		exportParts: Qn,
		part: N,
		prefix: null,
		property: null,
		results: M,
		security: null,
		unselectable: null
	},
	space: "html",
	transform: sr
}), lr = ir({
	attributes: {
		accentHeight: "accent-height",
		alignmentBaseline: "alignment-baseline",
		arabicForm: "arabic-form",
		baselineShift: "baseline-shift",
		capHeight: "cap-height",
		className: "class",
		clipPath: "clip-path",
		clipRule: "clip-rule",
		colorInterpolation: "color-interpolation",
		colorInterpolationFilters: "color-interpolation-filters",
		colorProfile: "color-profile",
		colorRendering: "color-rendering",
		crossOrigin: "crossorigin",
		dataType: "datatype",
		dominantBaseline: "dominant-baseline",
		enableBackground: "enable-background",
		fillOpacity: "fill-opacity",
		fillRule: "fill-rule",
		floodColor: "flood-color",
		floodOpacity: "flood-opacity",
		fontFamily: "font-family",
		fontSize: "font-size",
		fontSizeAdjust: "font-size-adjust",
		fontStretch: "font-stretch",
		fontStyle: "font-style",
		fontVariant: "font-variant",
		fontWeight: "font-weight",
		glyphName: "glyph-name",
		glyphOrientationHorizontal: "glyph-orientation-horizontal",
		glyphOrientationVertical: "glyph-orientation-vertical",
		hrefLang: "hreflang",
		horizAdvX: "horiz-adv-x",
		horizOriginX: "horiz-origin-x",
		horizOriginY: "horiz-origin-y",
		imageRendering: "image-rendering",
		letterSpacing: "letter-spacing",
		lightingColor: "lighting-color",
		markerEnd: "marker-end",
		markerMid: "marker-mid",
		markerStart: "marker-start",
		maskType: "mask-type",
		navDown: "nav-down",
		navDownLeft: "nav-down-left",
		navDownRight: "nav-down-right",
		navLeft: "nav-left",
		navNext: "nav-next",
		navPrev: "nav-prev",
		navRight: "nav-right",
		navUp: "nav-up",
		navUpLeft: "nav-up-left",
		navUpRight: "nav-up-right",
		onAbort: "onabort",
		onActivate: "onactivate",
		onAfterPrint: "onafterprint",
		onBeforePrint: "onbeforeprint",
		onBegin: "onbegin",
		onCancel: "oncancel",
		onCanPlay: "oncanplay",
		onCanPlayThrough: "oncanplaythrough",
		onChange: "onchange",
		onClick: "onclick",
		onClose: "onclose",
		onCopy: "oncopy",
		onCueChange: "oncuechange",
		onCut: "oncut",
		onDblClick: "ondblclick",
		onDrag: "ondrag",
		onDragEnd: "ondragend",
		onDragEnter: "ondragenter",
		onDragExit: "ondragexit",
		onDragLeave: "ondragleave",
		onDragOver: "ondragover",
		onDragStart: "ondragstart",
		onDrop: "ondrop",
		onDurationChange: "ondurationchange",
		onEmptied: "onemptied",
		onEnd: "onend",
		onEnded: "onended",
		onError: "onerror",
		onFocus: "onfocus",
		onFocusIn: "onfocusin",
		onFocusOut: "onfocusout",
		onHashChange: "onhashchange",
		onInput: "oninput",
		onInvalid: "oninvalid",
		onKeyDown: "onkeydown",
		onKeyPress: "onkeypress",
		onKeyUp: "onkeyup",
		onLoad: "onload",
		onLoadedData: "onloadeddata",
		onLoadedMetadata: "onloadedmetadata",
		onLoadStart: "onloadstart",
		onMessage: "onmessage",
		onMouseDown: "onmousedown",
		onMouseEnter: "onmouseenter",
		onMouseLeave: "onmouseleave",
		onMouseMove: "onmousemove",
		onMouseOut: "onmouseout",
		onMouseOver: "onmouseover",
		onMouseUp: "onmouseup",
		onMouseWheel: "onmousewheel",
		onOffline: "onoffline",
		onOnline: "ononline",
		onPageHide: "onpagehide",
		onPageShow: "onpageshow",
		onPaste: "onpaste",
		onPause: "onpause",
		onPlay: "onplay",
		onPlaying: "onplaying",
		onPopState: "onpopstate",
		onProgress: "onprogress",
		onRateChange: "onratechange",
		onRepeat: "onrepeat",
		onReset: "onreset",
		onResize: "onresize",
		onScroll: "onscroll",
		onSeeked: "onseeked",
		onSeeking: "onseeking",
		onSelect: "onselect",
		onShow: "onshow",
		onStalled: "onstalled",
		onStorage: "onstorage",
		onSubmit: "onsubmit",
		onSuspend: "onsuspend",
		onTimeUpdate: "ontimeupdate",
		onToggle: "ontoggle",
		onUnload: "onunload",
		onVolumeChange: "onvolumechange",
		onWaiting: "onwaiting",
		onZoom: "onzoom",
		overlinePosition: "overline-position",
		overlineThickness: "overline-thickness",
		paintOrder: "paint-order",
		panose1: "panose-1",
		pointerEvents: "pointer-events",
		referrerPolicy: "referrerpolicy",
		renderingIntent: "rendering-intent",
		shapeRendering: "shape-rendering",
		stopColor: "stop-color",
		stopOpacity: "stop-opacity",
		strikethroughPosition: "strikethrough-position",
		strikethroughThickness: "strikethrough-thickness",
		strokeDashArray: "stroke-dasharray",
		strokeDashOffset: "stroke-dashoffset",
		strokeLineCap: "stroke-linecap",
		strokeLineJoin: "stroke-linejoin",
		strokeMiterLimit: "stroke-miterlimit",
		strokeOpacity: "stroke-opacity",
		strokeWidth: "stroke-width",
		tabIndex: "tabindex",
		textAnchor: "text-anchor",
		textDecoration: "text-decoration",
		textRendering: "text-rendering",
		transformOrigin: "transform-origin",
		typeOf: "typeof",
		underlinePosition: "underline-position",
		underlineThickness: "underline-thickness",
		unicodeBidi: "unicode-bidi",
		unicodeRange: "unicode-range",
		unitsPerEm: "units-per-em",
		vAlphabetic: "v-alphabetic",
		vHanging: "v-hanging",
		vIdeographic: "v-ideographic",
		vMathematical: "v-mathematical",
		vectorEffect: "vector-effect",
		vertAdvY: "vert-adv-y",
		vertOriginX: "vert-origin-x",
		vertOriginY: "vert-origin-y",
		wordSpacing: "word-spacing",
		writingMode: "writing-mode",
		xHeight: "x-height",
		playbackOrder: "playbackorder",
		timelineBegin: "timelinebegin"
	},
	properties: {
		about: $n,
		accentHeight: M,
		accumulate: null,
		additive: null,
		alignmentBaseline: null,
		alphabetic: M,
		amplitude: M,
		arabicForm: null,
		ascent: M,
		attributeName: null,
		attributeType: null,
		azimuth: M,
		bandwidth: null,
		baselineShift: null,
		baseFrequency: null,
		baseProfile: null,
		bbox: null,
		begin: null,
		bias: M,
		by: null,
		calcMode: null,
		capHeight: M,
		className: N,
		clip: null,
		clipPath: null,
		clipPathUnits: null,
		clipRule: null,
		color: null,
		colorInterpolation: null,
		colorInterpolationFilters: null,
		colorProfile: null,
		colorRendering: null,
		content: null,
		contentScriptType: null,
		contentStyleType: null,
		crossOrigin: null,
		cursor: null,
		cx: null,
		cy: null,
		d: null,
		dataType: null,
		defaultAction: null,
		descent: M,
		diffuseConstant: M,
		direction: null,
		display: null,
		dur: null,
		divisor: M,
		dominantBaseline: null,
		download: j,
		dx: null,
		dy: null,
		edgeMode: null,
		editable: null,
		elevation: M,
		enableBackground: null,
		end: null,
		event: null,
		exponent: M,
		externalResourcesRequired: null,
		fill: null,
		fillOpacity: M,
		fillRule: null,
		filter: null,
		filterRes: null,
		filterUnits: null,
		floodColor: null,
		floodOpacity: null,
		focusable: null,
		focusHighlight: null,
		fontFamily: null,
		fontSize: null,
		fontSizeAdjust: null,
		fontStretch: null,
		fontStyle: null,
		fontVariant: null,
		fontWeight: null,
		format: null,
		fr: null,
		from: null,
		fx: null,
		fy: null,
		g1: Qn,
		g2: Qn,
		glyphName: Qn,
		glyphOrientationHorizontal: null,
		glyphOrientationVertical: null,
		glyphRef: null,
		gradientTransform: null,
		gradientUnits: null,
		handler: null,
		hanging: M,
		hatchContentUnits: null,
		hatchUnits: null,
		height: null,
		href: null,
		hrefLang: null,
		horizAdvX: M,
		horizOriginX: M,
		horizOriginY: M,
		id: null,
		ideographic: M,
		imageRendering: null,
		initialVisibility: null,
		in: null,
		in2: null,
		intercept: M,
		k: M,
		k1: M,
		k2: M,
		k3: M,
		k4: M,
		kernelMatrix: $n,
		kernelUnitLength: null,
		keyPoints: null,
		keySplines: null,
		keyTimes: null,
		kerning: null,
		lang: null,
		lengthAdjust: null,
		letterSpacing: null,
		lightingColor: null,
		limitingConeAngle: M,
		local: null,
		markerEnd: null,
		markerMid: null,
		markerStart: null,
		markerHeight: null,
		markerUnits: null,
		markerWidth: null,
		mask: null,
		maskContentUnits: null,
		maskType: null,
		maskUnits: null,
		mathematical: null,
		max: null,
		media: null,
		mediaCharacterEncoding: null,
		mediaContentEncodings: null,
		mediaSize: M,
		mediaTime: null,
		method: null,
		min: null,
		mode: null,
		name: null,
		navDown: null,
		navDownLeft: null,
		navDownRight: null,
		navLeft: null,
		navNext: null,
		navPrev: null,
		navRight: null,
		navUp: null,
		navUpLeft: null,
		navUpRight: null,
		numOctaves: null,
		observer: null,
		offset: null,
		onAbort: null,
		onActivate: null,
		onAfterPrint: null,
		onBeforePrint: null,
		onBegin: null,
		onCancel: null,
		onCanPlay: null,
		onCanPlayThrough: null,
		onChange: null,
		onClick: null,
		onClose: null,
		onCopy: null,
		onCueChange: null,
		onCut: null,
		onDblClick: null,
		onDrag: null,
		onDragEnd: null,
		onDragEnter: null,
		onDragExit: null,
		onDragLeave: null,
		onDragOver: null,
		onDragStart: null,
		onDrop: null,
		onDurationChange: null,
		onEmptied: null,
		onEnd: null,
		onEnded: null,
		onError: null,
		onFocus: null,
		onFocusIn: null,
		onFocusOut: null,
		onHashChange: null,
		onInput: null,
		onInvalid: null,
		onKeyDown: null,
		onKeyPress: null,
		onKeyUp: null,
		onLoad: null,
		onLoadedData: null,
		onLoadedMetadata: null,
		onLoadStart: null,
		onMessage: null,
		onMouseDown: null,
		onMouseEnter: null,
		onMouseLeave: null,
		onMouseMove: null,
		onMouseOut: null,
		onMouseOver: null,
		onMouseUp: null,
		onMouseWheel: null,
		onOffline: null,
		onOnline: null,
		onPageHide: null,
		onPageShow: null,
		onPaste: null,
		onPause: null,
		onPlay: null,
		onPlaying: null,
		onPopState: null,
		onProgress: null,
		onRateChange: null,
		onRepeat: null,
		onReset: null,
		onResize: null,
		onScroll: null,
		onSeeked: null,
		onSeeking: null,
		onSelect: null,
		onShow: null,
		onStalled: null,
		onStorage: null,
		onSubmit: null,
		onSuspend: null,
		onTimeUpdate: null,
		onToggle: null,
		onUnload: null,
		onVolumeChange: null,
		onWaiting: null,
		onZoom: null,
		opacity: null,
		operator: null,
		order: null,
		orient: null,
		orientation: null,
		origin: null,
		overflow: null,
		overlay: null,
		overlinePosition: M,
		overlineThickness: M,
		paintOrder: null,
		panose1: null,
		path: null,
		pathLength: M,
		patternContentUnits: null,
		patternTransform: null,
		patternUnits: null,
		phase: null,
		ping: N,
		pitch: null,
		playbackOrder: null,
		pointerEvents: null,
		points: null,
		pointsAtX: M,
		pointsAtY: M,
		pointsAtZ: M,
		preserveAlpha: null,
		preserveAspectRatio: null,
		primitiveUnits: null,
		propagate: null,
		property: $n,
		r: null,
		radius: null,
		referrerPolicy: null,
		refX: null,
		refY: null,
		rel: $n,
		rev: $n,
		renderingIntent: null,
		repeatCount: null,
		repeatDur: null,
		requiredExtensions: $n,
		requiredFeatures: $n,
		requiredFonts: $n,
		requiredFormats: $n,
		resource: null,
		restart: null,
		result: null,
		rotate: null,
		rx: null,
		ry: null,
		scale: null,
		seed: null,
		shapeRendering: null,
		side: null,
		slope: null,
		snapshotTime: null,
		specularConstant: M,
		specularExponent: M,
		spreadMethod: null,
		spacing: null,
		startOffset: null,
		stdDeviation: null,
		stemh: null,
		stemv: null,
		stitchTiles: null,
		stopColor: null,
		stopOpacity: null,
		strikethroughPosition: M,
		strikethroughThickness: M,
		string: null,
		stroke: null,
		strokeDashArray: $n,
		strokeDashOffset: null,
		strokeLineCap: null,
		strokeLineJoin: null,
		strokeMiterLimit: M,
		strokeOpacity: M,
		strokeWidth: null,
		style: null,
		surfaceScale: M,
		syncBehavior: null,
		syncBehaviorDefault: null,
		syncMaster: null,
		syncTolerance: null,
		syncToleranceDefault: null,
		systemLanguage: $n,
		tabIndex: M,
		tableValues: null,
		target: null,
		targetX: M,
		targetY: M,
		textAnchor: null,
		textDecoration: null,
		textRendering: null,
		textLength: null,
		timelineBegin: null,
		title: null,
		transformBehavior: null,
		type: null,
		typeOf: $n,
		to: null,
		transform: null,
		transformOrigin: null,
		u1: null,
		u2: null,
		underlinePosition: M,
		underlineThickness: M,
		unicode: null,
		unicodeBidi: null,
		unicodeRange: null,
		unitsPerEm: M,
		values: null,
		vAlphabetic: M,
		vMathematical: M,
		vectorEffect: null,
		vHanging: M,
		vIdeographic: M,
		version: null,
		vertAdvY: M,
		vertOriginX: M,
		vertOriginY: M,
		viewBox: null,
		viewTarget: null,
		visibility: null,
		width: null,
		widths: null,
		wordSpacing: null,
		writingMode: null,
		x: null,
		x1: null,
		x2: null,
		xChannelSelector: null,
		xHeight: M,
		y: null,
		y1: null,
		y2: null,
		yChannelSelector: null,
		z: null,
		zoomAndPan: null
	},
	space: "svg",
	transform: or
}), ur = ir({
	properties: {
		xLinkActuate: null,
		xLinkArcRole: null,
		xLinkHref: null,
		xLinkRole: null,
		xLinkShow: null,
		xLinkTitle: null,
		xLinkType: null
	},
	space: "xlink",
	transform(e, t) {
		return "xlink:" + t.slice(5).toLowerCase();
	}
}), dr = ir({
	attributes: { xmlnsxlink: "xmlns:xlink" },
	properties: {
		xmlnsXLink: null,
		xmlns: null
	},
	space: "xmlns",
	transform: sr
}), fr = ir({
	properties: {
		xmlBase: null,
		xmlLang: null,
		xmlSpace: null
	},
	space: "xml",
	transform(e, t) {
		return "xml:" + t.slice(3).toLowerCase();
	}
}), pr = /[A-Z]/g, mr = /-[a-z]/g, hr = /^data[-\w.:]+$/i;
function gr(e, t) {
	let n = Kn(t), r = t, i = qn;
	if (n in e.normal) return e.property[e.normal[n]];
	if (n.length > 4 && n.slice(0, 4) === "data" && hr.test(t)) {
		if (t.charAt(4) === "-") {
			let e = t.slice(5).replace(mr, vr);
			r = "data" + e.charAt(0).toUpperCase() + e.slice(1);
		} else {
			let e = t.slice(4);
			if (!mr.test(e)) {
				let n = e.replace(pr, _r);
				n.charAt(0) !== "-" && (n = "-" + n), t = "data" + n;
			}
		}
		i = nr;
	}
	return new i(r, t);
}
function _r(e) {
	return "-" + e.toLowerCase();
}
function vr(e) {
	return e.charAt(1).toUpperCase();
}
// node_modules/hast-util-to-parse5/node_modules/property-information/index.js
var yr = Gn([
	ar,
	cr,
	ur,
	dr,
	fr
], "html"), br = Gn([
	ar,
	lr,
	ur,
	dr,
	fr
], "svg"), xr = {}.hasOwnProperty;
function Sr(e, t) {
	let n = t || {};
	function r(t, ...n) {
		let i = r.invalid, a = r.handlers;
		if (t && xr.call(t, e)) {
			let n = String(t[e]);
			i = xr.call(a, n) ? a[n] : r.unknown;
		}
		if (i) return i.call(this, t, ...n);
	}
	return r.handlers = n.handlers || {}, r.invalid = n.invalid, r.unknown = n.unknown, r;
}
// node_modules/hast-util-to-parse5/lib/index.js
var Cr = {}, wr = {}.hasOwnProperty, Tr = Sr("type", { handlers: {
	root: Dr,
	element: Mr,
	text: Ar,
	comment: jr,
	doctype: kr
} });
function Er(e, t) {
	let n = (t || Cr).space;
	return Tr(e, n === "svg" ? br : yr);
}
function Dr(e, t) {
	let n = {
		nodeName: "#document",
		mode: (e.data || {}).quirksMode ? "quirks" : "no-quirks",
		childNodes: []
	};
	return n.childNodes = Pr(e.children, n, t), Fr(e, n), n;
}
function Or(e, t) {
	let n = {
		nodeName: "#document-fragment",
		childNodes: []
	};
	return n.childNodes = Pr(e.children, n, t), Fr(e, n), n;
}
function kr(e) {
	let t = {
		nodeName: "#documentType",
		name: "html",
		publicId: "",
		systemId: "",
		parentNode: null
	};
	return Fr(e, t), t;
}
function Ar(e) {
	let t = {
		nodeName: "#text",
		value: e.value,
		parentNode: null
	};
	return Fr(e, t), t;
}
function jr(e) {
	let t = {
		nodeName: "#comment",
		data: e.value,
		parentNode: null
	};
	return Fr(e, t), t;
}
function Mr(e, t) {
	let n = t, r = n;
	e.type === "element" && e.tagName.toLowerCase() === "svg" && n.space === "html" && (r = br);
	let i = [], a;
	if (e.properties) {
		for (a in e.properties) if (a !== "children" && wr.call(e.properties, a)) {
			let t = Nr(r, a, e.properties[a]);
			t && i.push(t);
		}
	}
	let o = r.space, s = {
		nodeName: e.tagName,
		tagName: e.tagName,
		attrs: i,
		namespaceURI: rt[o],
		childNodes: [],
		parentNode: null
	};
	return s.childNodes = Pr(e.children, s, r), Fr(e, s), e.tagName === "template" && e.content && (s.content = Or(e.content, r)), s;
}
function Nr(e, t, n) {
	let r = gr(e, t);
	if (n === !1 || n == null || typeof n == "number" && Number.isNaN(n) || !n && r.boolean) return;
	Array.isArray(n) && (n = r.commaSeparated ? He(n) : Ke(n));
	let i = {
		name: r.attribute,
		value: n === !0 ? "" : String(n)
	};
	if (r.space && r.space !== "html" && r.space !== "svg") {
		let e = i.name.indexOf(":");
		e < 0 ? i.prefix = "" : (i.name = i.name.slice(e + 1), i.prefix = r.attribute.slice(0, e)), i.namespace = rt[r.space];
	}
	return i;
}
function Pr(e, t, n) {
	let r = -1, i = [];
	if (e) for (; ++r < e.length;) {
		let a = Tr(e[r], n);
		a.parentNode = t, i.push(a);
	}
	return i;
}
function Fr(e, t) {
	let n = e.position;
	n && n.start && n.end && (n.start.offset, n.end.offset, t.sourceCodeLocation = {
		startLine: n.start.line,
		startCol: n.start.column,
		startOffset: n.start.offset,
		endLine: n.end.line,
		endCol: n.end.column,
		endOffset: n.end.offset
	});
}
// node_modules/html-void-elements/index.js
var Ir = [
	"area",
	"base",
	"basefont",
	"bgsound",
	"br",
	"col",
	"command",
	"embed",
	"frame",
	"hr",
	"image",
	"img",
	"input",
	"keygen",
	"link",
	"meta",
	"param",
	"source",
	"track",
	"wbr"
], Lr = /* @__PURE__ */ new Set([
	65534,
	65535,
	131070,
	131071,
	196606,
	196607,
	262142,
	262143,
	327678,
	327679,
	393214,
	393215,
	458750,
	458751,
	524286,
	524287,
	589822,
	589823,
	655358,
	655359,
	720894,
	720895,
	786430,
	786431,
	851966,
	851967,
	917502,
	917503,
	983038,
	983039,
	1048574,
	1048575,
	1114110,
	1114111
]), P;
(function(e) {
	e[e.EOF = -1] = "EOF", e[e.NULL = 0] = "NULL", e[e.TABULATION = 9] = "TABULATION", e[e.CARRIAGE_RETURN = 13] = "CARRIAGE_RETURN", e[e.LINE_FEED = 10] = "LINE_FEED", e[e.FORM_FEED = 12] = "FORM_FEED", e[e.SPACE = 32] = "SPACE", e[e.EXCLAMATION_MARK = 33] = "EXCLAMATION_MARK", e[e.QUOTATION_MARK = 34] = "QUOTATION_MARK", e[e.AMPERSAND = 38] = "AMPERSAND", e[e.APOSTROPHE = 39] = "APOSTROPHE", e[e.HYPHEN_MINUS = 45] = "HYPHEN_MINUS", e[e.SOLIDUS = 47] = "SOLIDUS", e[e.DIGIT_0 = 48] = "DIGIT_0", e[e.DIGIT_9 = 57] = "DIGIT_9", e[e.SEMICOLON = 59] = "SEMICOLON", e[e.LESS_THAN_SIGN = 60] = "LESS_THAN_SIGN", e[e.EQUALS_SIGN = 61] = "EQUALS_SIGN", e[e.GREATER_THAN_SIGN = 62] = "GREATER_THAN_SIGN", e[e.QUESTION_MARK = 63] = "QUESTION_MARK", e[e.LATIN_CAPITAL_A = 65] = "LATIN_CAPITAL_A", e[e.LATIN_CAPITAL_Z = 90] = "LATIN_CAPITAL_Z", e[e.RIGHT_SQUARE_BRACKET = 93] = "RIGHT_SQUARE_BRACKET", e[e.GRAVE_ACCENT = 96] = "GRAVE_ACCENT", e[e.LATIN_SMALL_A = 97] = "LATIN_SMALL_A", e[e.LATIN_SMALL_Z = 122] = "LATIN_SMALL_Z";
})(P ||= {});
var Rr = {
	DASH_DASH: "--",
	CDATA_START: "[CDATA[",
	DOCTYPE: "doctype",
	SCRIPT: "script",
	PUBLIC: "public",
	SYSTEM: "system"
};
function zr(e) {
	return e >= 55296 && e <= 57343;
}
function Br(e) {
	return e >= 56320 && e <= 57343;
}
function Vr(e, t) {
	return (e - 55296) * 1024 + 9216 + t;
}
function Hr(e) {
	return e !== 32 && e !== 10 && e !== 13 && e !== 9 && e !== 12 && e >= 1 && e <= 31 || e >= 127 && e <= 159;
}
function Ur(e) {
	return e >= 64976 && e <= 65007 || Lr.has(e);
}
// node_modules/hast-util-raw/node_modules/parse5/dist/common/error-codes.js
var F;
(function(e) {
	e.controlCharacterInInputStream = "control-character-in-input-stream", e.noncharacterInInputStream = "noncharacter-in-input-stream", e.surrogateInInputStream = "surrogate-in-input-stream", e.nonVoidHtmlElementStartTagWithTrailingSolidus = "non-void-html-element-start-tag-with-trailing-solidus", e.endTagWithAttributes = "end-tag-with-attributes", e.endTagWithTrailingSolidus = "end-tag-with-trailing-solidus", e.unexpectedSolidusInTag = "unexpected-solidus-in-tag", e.unexpectedNullCharacter = "unexpected-null-character", e.unexpectedQuestionMarkInsteadOfTagName = "unexpected-question-mark-instead-of-tag-name", e.invalidFirstCharacterOfTagName = "invalid-first-character-of-tag-name", e.unexpectedEqualsSignBeforeAttributeName = "unexpected-equals-sign-before-attribute-name", e.missingEndTagName = "missing-end-tag-name", e.unexpectedCharacterInAttributeName = "unexpected-character-in-attribute-name", e.unknownNamedCharacterReference = "unknown-named-character-reference", e.missingSemicolonAfterCharacterReference = "missing-semicolon-after-character-reference", e.unexpectedCharacterAfterDoctypeSystemIdentifier = "unexpected-character-after-doctype-system-identifier", e.unexpectedCharacterInUnquotedAttributeValue = "unexpected-character-in-unquoted-attribute-value", e.eofBeforeTagName = "eof-before-tag-name", e.eofInTag = "eof-in-tag", e.missingAttributeValue = "missing-attribute-value", e.missingWhitespaceBetweenAttributes = "missing-whitespace-between-attributes", e.missingWhitespaceAfterDoctypePublicKeyword = "missing-whitespace-after-doctype-public-keyword", e.missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers = "missing-whitespace-between-doctype-public-and-system-identifiers", e.missingWhitespaceAfterDoctypeSystemKeyword = "missing-whitespace-after-doctype-system-keyword", e.missingQuoteBeforeDoctypePublicIdentifier = "missing-quote-before-doctype-public-identifier", e.missingQuoteBeforeDoctypeSystemIdentifier = "missing-quote-before-doctype-system-identifier", e.missingDoctypePublicIdentifier = "missing-doctype-public-identifier", e.missingDoctypeSystemIdentifier = "missing-doctype-system-identifier", e.abruptDoctypePublicIdentifier = "abrupt-doctype-public-identifier", e.abruptDoctypeSystemIdentifier = "abrupt-doctype-system-identifier", e.cdataInHtmlContent = "cdata-in-html-content", e.incorrectlyOpenedComment = "incorrectly-opened-comment", e.eofInScriptHtmlCommentLikeText = "eof-in-script-html-comment-like-text", e.eofInDoctype = "eof-in-doctype", e.nestedComment = "nested-comment", e.abruptClosingOfEmptyComment = "abrupt-closing-of-empty-comment", e.eofInComment = "eof-in-comment", e.incorrectlyClosedComment = "incorrectly-closed-comment", e.eofInCdata = "eof-in-cdata", e.absenceOfDigitsInNumericCharacterReference = "absence-of-digits-in-numeric-character-reference", e.nullCharacterReference = "null-character-reference", e.surrogateCharacterReference = "surrogate-character-reference", e.characterReferenceOutsideUnicodeRange = "character-reference-outside-unicode-range", e.controlCharacterReference = "control-character-reference", e.noncharacterCharacterReference = "noncharacter-character-reference", e.missingWhitespaceBeforeDoctypeName = "missing-whitespace-before-doctype-name", e.missingDoctypeName = "missing-doctype-name", e.invalidCharacterSequenceAfterDoctypeName = "invalid-character-sequence-after-doctype-name", e.duplicateAttribute = "duplicate-attribute", e.nonConformingDoctype = "non-conforming-doctype", e.missingDoctype = "missing-doctype", e.misplacedDoctype = "misplaced-doctype", e.endTagWithoutMatchingOpenElement = "end-tag-without-matching-open-element", e.closingOfElementWithOpenChildElements = "closing-of-element-with-open-child-elements", e.disallowedContentInNoscriptInHead = "disallowed-content-in-noscript-in-head", e.openElementsLeftAfterEof = "open-elements-left-after-eof", e.abandonedHeadElementChild = "abandoned-head-element-child", e.misplacedStartTagForHeadElement = "misplaced-start-tag-for-head-element", e.nestedNoscriptInHead = "nested-noscript-in-head", e.eofInElementThatCanContainOnlyText = "eof-in-element-that-can-contain-only-text";
})(F ||= {});
// node_modules/hast-util-raw/node_modules/parse5/dist/tokenizer/preprocessor.js
var Wr = 65536, Gr = class {
	constructor(e) {
		this.handler = e, this.html = "", this.pos = -1, this.lastGapPos = -2, this.gapStack = [], this.skipNextNewLine = !1, this.lastChunkWritten = !1, this.endOfChunkHit = !1, this.bufferWaterline = Wr, this.isEol = !1, this.lineStartPos = 0, this.droppedBufferSize = 0, this.line = 1, this.lastErrOffset = -1;
	}
	get col() {
		return this.pos - this.lineStartPos + Number(this.lastGapPos !== this.pos);
	}
	get offset() {
		return this.droppedBufferSize + this.pos;
	}
	getError(e, t) {
		let { line: n, col: r, offset: i } = this, a = r + t, o = i + t;
		return {
			code: e,
			startLine: n,
			endLine: n,
			startCol: a,
			endCol: a,
			startOffset: o,
			endOffset: o
		};
	}
	_err(e) {
		this.handler.onParseError && this.lastErrOffset !== this.offset && (this.lastErrOffset = this.offset, this.handler.onParseError(this.getError(e, 0)));
	}
	_addGap() {
		this.gapStack.push(this.lastGapPos), this.lastGapPos = this.pos;
	}
	_processSurrogate(e) {
		if (this.pos !== this.html.length - 1) {
			let t = this.html.charCodeAt(this.pos + 1);
			if (Br(t)) return this.pos++, this._addGap(), Vr(e, t);
		} else if (!this.lastChunkWritten) return this.endOfChunkHit = !0, P.EOF;
		return this._err(F.surrogateInInputStream), e;
	}
	willDropParsedChunk() {
		return this.pos > this.bufferWaterline;
	}
	dropParsedChunk() {
		this.willDropParsedChunk() && (this.html = this.html.substring(this.pos), this.lineStartPos -= this.pos, this.droppedBufferSize += this.pos, this.pos = 0, this.lastGapPos = -2, this.gapStack.length = 0);
	}
	write(e, t) {
		this.html.length > 0 ? this.html += e : this.html = e, this.endOfChunkHit = !1, this.lastChunkWritten = t;
	}
	insertHtmlAtCurrentPos(e) {
		this.html = this.html.substring(0, this.pos + 1) + e + this.html.substring(this.pos + 1), this.endOfChunkHit = !1;
	}
	startsWith(e, t) {
		if (this.pos + e.length > this.html.length) return this.endOfChunkHit = !this.lastChunkWritten, !1;
		if (t) return this.html.startsWith(e, this.pos);
		for (let t = 0; t < e.length; t++) if ((this.html.charCodeAt(this.pos + t) | 32) !== e.charCodeAt(t)) return !1;
		return !0;
	}
	peek(e) {
		let t = this.pos + e;
		if (t >= this.html.length) return this.endOfChunkHit = !this.lastChunkWritten, P.EOF;
		let n = this.html.charCodeAt(t);
		return n === P.CARRIAGE_RETURN ? P.LINE_FEED : n;
	}
	advance() {
		if (this.pos++, this.isEol && (this.isEol = !1, this.line++, this.lineStartPos = this.pos), this.pos >= this.html.length) return this.endOfChunkHit = !this.lastChunkWritten, P.EOF;
		let e = this.html.charCodeAt(this.pos);
		return e === P.CARRIAGE_RETURN ? (this.isEol = !0, this.skipNextNewLine = !0, P.LINE_FEED) : e === P.LINE_FEED && (this.isEol = !0, this.skipNextNewLine) ? (this.line--, this.skipNextNewLine = !1, this._addGap(), this.advance()) : (this.skipNextNewLine = !1, zr(e) && (e = this._processSurrogate(e)), this.handler.onParseError === null || e > 31 && e < 127 || e === P.LINE_FEED || e === P.CARRIAGE_RETURN || e > 159 && e < 64976 || this._checkForProblematicCharacters(e), e);
	}
	_checkForProblematicCharacters(e) {
		Hr(e) ? this._err(F.controlCharacterInInputStream) : Ur(e) && this._err(F.noncharacterInInputStream);
	}
	retreat(e) {
		for (this.pos -= e; this.pos < this.lastGapPos;) this.lastGapPos = this.gapStack.pop(), this.pos--;
		this.isEol = !1;
	}
}, I;
(function(e) {
	e[e.CHARACTER = 0] = "CHARACTER", e[e.NULL_CHARACTER = 1] = "NULL_CHARACTER", e[e.WHITESPACE_CHARACTER = 2] = "WHITESPACE_CHARACTER", e[e.START_TAG = 3] = "START_TAG", e[e.END_TAG = 4] = "END_TAG", e[e.COMMENT = 5] = "COMMENT", e[e.DOCTYPE = 6] = "DOCTYPE", e[e.EOF = 7] = "EOF", e[e.HIBERNATION = 8] = "HIBERNATION";
})(I ||= {});
function Kr(e, t) {
	for (let n = e.attrs.length - 1; n >= 0; n--) if (e.attrs[n].name === t) return e.attrs[n].value;
	return null;
}
// node_modules/hast-util-raw/node_modules/entities/dist/esm/generated/decode-data-html.js
var qr = /* #__PURE__ */ new Uint16Array(/* #__PURE__ */ "ᵁ<Õıʊҝջאٵ۞ޢߖࠏ੊ઑඡ๭༉༦჊ረዡᐕᒝᓃᓟᔥ\0\0\0\0\0\0ᕫᛍᦍᰒᷝ὾⁠↰⊍⏀⏻⑂⠤⤒ⴈ⹈⿎〖㊺㘹㞬㣾㨨㩱㫠㬮ࠀEMabcfglmnoprstu\\bfms¦³¹ÈÏlig耻Æ䃆P耻&䀦cute耻Á䃁reve;䄂Āiyx}rc耻Â䃂;䐐r;쀀𝔄rave耻À䃀pha;䎑acr;䄀d;橓Āgp¡on;䄄f;쀀𝔸plyFunction;恡ing耻Å䃅Ācs¾Ãr;쀀𝒜ign;扔ilde耻Ã䃃ml耻Ä䃄ЀaceforsuåûþėĜĢħĪĀcrêòkslash;或Ŷöø;櫧ed;挆y;䐑ƀcrtąċĔause;戵noullis;愬a;䎒r;쀀𝔅pf;쀀𝔹eve;䋘còēmpeq;扎܀HOacdefhilorsuōőŖƀƞƢƵƷƺǜȕɳɸɾcy;䐧PY耻©䂩ƀcpyŝŢźute;䄆Ā;iŧŨ拒talDifferentialD;慅leys;愭ȀaeioƉƎƔƘron;䄌dil耻Ç䃇rc;䄈nint;戰ot;䄊ĀdnƧƭilla;䂸terDot;䂷òſi;䎧rcleȀDMPTǇǋǑǖot;抙inus;抖lus;投imes;抗oĀcsǢǸkwiseContourIntegral;戲eCurlyĀDQȃȏoubleQuote;思uote;怙ȀlnpuȞȨɇɕonĀ;eȥȦ户;橴ƀgitȯȶȺruent;扡nt;戯ourIntegral;戮ĀfrɌɎ;愂oduct;成nterClockwiseContourIntegral;戳oss;樯cr;쀀𝒞pĀ;Cʄʅ拓ap;才րDJSZacefiosʠʬʰʴʸˋ˗ˡ˦̳ҍĀ;oŹʥtrahd;椑cy;䐂cy;䐅cy;䐏ƀgrsʿ˄ˇger;怡r;憡hv;櫤Āayː˕ron;䄎;䐔lĀ;t˝˞戇a;䎔r;쀀𝔇Āaf˫̧Ācm˰̢riticalȀADGT̖̜̀̆cute;䂴oŴ̋̍;䋙bleAcute;䋝rave;䁠ilde;䋜ond;拄ferentialD;慆Ѱ̽\0\0\0͔͂\0Ѕf;쀀𝔻ƀ;DE͈͉͍䂨ot;惜qual;扐blèCDLRUVͣͲ΂ϏϢϸontourIntegraìȹoɴ͹\0\0ͻ»͉nArrow;懓Āeo·ΤftƀARTΐΖΡrrow;懐ightArrow;懔eåˊngĀLRΫτeftĀARγιrrow;柸ightArrow;柺ightArrow;柹ightĀATϘϞrrow;懒ee;抨pɁϩ\0\0ϯrrow;懑ownArrow;懕erticalBar;戥ǹABLRTaВЪаўѿͼrrowƀ;BUНОТ憓ar;椓pArrow;懵reve;䌑eft˒к\0ц\0ѐightVector;楐eeVector;楞ectorĀ;Bљњ憽ar;楖ightǔѧ\0ѱeeVector;楟ectorĀ;BѺѻ懁ar;楗eeĀ;A҆҇护rrow;憧ĀctҒҗr;쀀𝒟rok;䄐ࠀNTacdfglmopqstuxҽӀӄӋӞӢӧӮӵԡԯԶՒ՝ՠեG;䅊H耻Ð䃐cute耻É䃉ƀaiyӒӗӜron;䄚rc耻Ê䃊;䐭ot;䄖r;쀀𝔈rave耻È䃈ement;戈ĀapӺӾcr;䄒tyɓԆ\0\0ԒmallSquare;旻erySmallSquare;斫ĀgpԦԪon;䄘f;쀀𝔼silon;䎕uĀaiԼՉlĀ;TՂՃ橵ilde;扂librium;懌Āci՗՚r;愰m;橳a;䎗ml耻Ë䃋Āipժկsts;戃onentialE;慇ʀcfiosօֈ֍ֲ׌y;䐤r;쀀𝔉lledɓ֗\0\0֣mallSquare;旼erySmallSquare;斪Ͱֺ\0ֿ\0\0ׄf;쀀𝔽All;戀riertrf;愱cò׋؀JTabcdfgorstר׬ׯ׺؀ؒؖ؛؝أ٬ٲcy;䐃耻>䀾mmaĀ;d׷׸䎓;䏜reve;䄞ƀeiy؇،ؐdil;䄢rc;䄜;䐓ot;䄠r;쀀𝔊;拙pf;쀀𝔾eater̀EFGLSTصلَٖٛ٦qualĀ;Lؾؿ扥ess;招ullEqual;执reater;檢ess;扷lantEqual;橾ilde;扳cr;쀀𝒢;扫ЀAacfiosuڅڋږڛڞڪھۊRDcy;䐪Āctڐڔek;䋇;䁞irc;䄤r;愌lbertSpace;愋ǰگ\0ڲf;愍izontalLine;攀Āctۃۅòکrok;䄦mpńېۘownHumðįqual;扏܀EJOacdfgmnostuۺ۾܃܇܎ܚܞܡܨ݄ݸދޏޕcy;䐕lig;䄲cy;䐁cute耻Í䃍Āiyܓܘrc耻Î䃎;䐘ot;䄰r;愑rave耻Ì䃌ƀ;apܠܯܿĀcgܴܷr;䄪inaryI;慈lieóϝǴ݉\0ݢĀ;eݍݎ戬Āgrݓݘral;戫section;拂isibleĀCTݬݲomma;恣imes;恢ƀgptݿރވon;䄮f;쀀𝕀a;䎙cr;愐ilde;䄨ǫޚ\0ޞcy;䐆l耻Ï䃏ʀcfosuެ޷޼߂ߐĀiyޱ޵rc;䄴;䐙r;쀀𝔍pf;쀀𝕁ǣ߇\0ߌr;쀀𝒥rcy;䐈kcy;䐄΀HJacfosߤߨ߽߬߱ࠂࠈcy;䐥cy;䐌ppa;䎚Āey߶߻dil;䄶;䐚r;쀀𝔎pf;쀀𝕂cr;쀀𝒦րJTaceflmostࠥࠩࠬࡐࡣ঳সে্਷ੇcy;䐉耻<䀼ʀcmnpr࠷࠼ࡁࡄࡍute;䄹bda;䎛g;柪lacetrf;愒r;憞ƀaeyࡗ࡜ࡡron;䄽dil;䄻;䐛Āfsࡨ॰tԀACDFRTUVarࡾࢩࢱࣦ࣠ࣼयज़ΐ४Ānrࢃ࢏gleBracket;柨rowƀ;BR࢙࢚࢞憐ar;懤ightArrow;懆eiling;挈oǵࢷ\0ࣃbleBracket;柦nǔࣈ\0࣒eeVector;楡ectorĀ;Bࣛࣜ懃ar;楙loor;挊ightĀAV࣯ࣵrrow;憔ector;楎Āerँगeƀ;AVउऊऐ抣rrow;憤ector;楚iangleƀ;BEतथऩ抲ar;槏qual;抴pƀDTVषूौownVector;楑eeVector;楠ectorĀ;Bॖॗ憿ar;楘ectorĀ;B॥०憼ar;楒ightáΜs̀EFGLSTॾঋকঝঢভqualGreater;拚ullEqual;扦reater;扶ess;檡lantEqual;橽ilde;扲r;쀀𝔏Ā;eঽা拘ftarrow;懚idot;䄿ƀnpw৔ਖਛgȀLRlr৞৷ਂਐeftĀAR০৬rrow;柵ightArrow;柷ightArrow;柶eftĀarγਊightáοightáϊf;쀀𝕃erĀLRਢਬeftArrow;憙ightArrow;憘ƀchtਾੀੂòࡌ;憰rok;䅁;扪Ѐacefiosuਗ਼੝੠੷੼અઋ઎p;椅y;䐜Ādl੥੯iumSpace;恟lintrf;愳r;쀀𝔐nusPlus;戓pf;쀀𝕄cò੶;䎜ҀJacefostuણધભીଔଙඑ඗ඞcy;䐊cute;䅃ƀaey઴હાron;䅇dil;䅅;䐝ƀgswે૰଎ativeƀMTV૓૟૨ediumSpace;怋hiĀcn૦૘ë૙eryThiî૙tedĀGL૸ଆreaterGreateòٳessLesóੈLine;䀊r;쀀𝔑ȀBnptଢନଷ଺reak;恠BreakingSpace;䂠f;愕ڀ;CDEGHLNPRSTV୕ୖ୪୼஡௫ఄ౞಄ದ೘ൡඅ櫬Āou୛୤ngruent;扢pCap;扭oubleVerticalBar;戦ƀlqxஃஊ஛ement;戉ualĀ;Tஒஓ扠ilde;쀀≂̸ists;戄reater΀;EFGLSTஶஷ஽௉௓௘௥扯qual;扱ullEqual;쀀≧̸reater;쀀≫̸ess;批lantEqual;쀀⩾̸ilde;扵umpń௲௽ownHump;쀀≎̸qual;쀀≏̸eĀfsఊధtTriangleƀ;BEచఛడ拪ar;쀀⧏̸qual;括s̀;EGLSTవశ఼ౄోౘ扮qual;扰reater;扸ess;쀀≪̸lantEqual;쀀⩽̸ilde;扴estedĀGL౨౹reaterGreater;쀀⪢̸essLess;쀀⪡̸recedesƀ;ESಒಓಛ技qual;쀀⪯̸lantEqual;拠ĀeiಫಹverseElement;戌ghtTriangleƀ;BEೋೌ೒拫ar;쀀⧐̸qual;拭ĀquೝഌuareSuĀbp೨೹setĀ;E೰ೳ쀀⊏̸qual;拢ersetĀ;Eഃആ쀀⊐̸qual;拣ƀbcpഓതൎsetĀ;Eഛഞ쀀⊂⃒qual;抈ceedsȀ;ESTലള഻െ抁qual;쀀⪰̸lantEqual;拡ilde;쀀≿̸ersetĀ;E൘൛쀀⊃⃒qual;抉ildeȀ;EFT൮൯൵ൿ扁qual;扄ullEqual;扇ilde;扉erticalBar;戤cr;쀀𝒩ilde耻Ñ䃑;䎝܀Eacdfgmoprstuvලෂ෉෕ෛ෠෧෼ขภยา฿ไlig;䅒cute耻Ó䃓Āiy෎ීrc耻Ô䃔;䐞blac;䅐r;쀀𝔒rave耻Ò䃒ƀaei෮ෲ෶cr;䅌ga;䎩cron;䎟pf;쀀𝕆enCurlyĀDQฎบoubleQuote;怜uote;怘;橔Āclวฬr;쀀𝒪ash耻Ø䃘iŬื฼de耻Õ䃕es;樷ml耻Ö䃖erĀBP๋๠Āar๐๓r;怾acĀek๚๜;揞et;掴arenthesis;揜Ҁacfhilors๿ງຊຏຒດຝະ໼rtialD;戂y;䐟r;쀀𝔓i;䎦;䎠usMinus;䂱Āipຢອncareplanåڝf;愙Ȁ;eio຺ູ໠໤檻cedesȀ;EST່້໏໚扺qual;檯lantEqual;扼ilde;找me;怳Ādp໩໮uct;戏ortionĀ;aȥ໹l;戝Āci༁༆r;쀀𝒫;䎨ȀUfos༑༖༛༟OT耻\"䀢r;쀀𝔔pf;愚cr;쀀𝒬؀BEacefhiorsu༾གྷཇའཱིྦྷྪྭ႖ႩႴႾarr;椐G耻®䂮ƀcnrཎནབute;䅔g;柫rĀ;tཛྷཝ憠l;椖ƀaeyཧཬཱron;䅘dil;䅖;䐠Ā;vླྀཹ愜erseĀEUྂྙĀlq྇ྎement;戋uilibrium;懋pEquilibrium;楯r»ཹo;䎡ghtЀACDFTUVa࿁࿫࿳ဢဨၛႇϘĀnr࿆࿒gleBracket;柩rowƀ;BL࿜࿝࿡憒ar;懥eftArrow;懄eiling;按oǵ࿹\0စbleBracket;柧nǔည\0နeeVector;楝ectorĀ;Bဝသ懂ar;楕loor;挋Āerိ၃eƀ;AVဵံြ抢rrow;憦ector;楛iangleƀ;BEၐၑၕ抳ar;槐qual;抵pƀDTVၣၮၸownVector;楏eeVector;楜ectorĀ;Bႂႃ憾ar;楔ectorĀ;B႑႒懀ar;楓Āpuႛ႞f;愝ndImplies;楰ightarrow;懛ĀchႹႼr;愛;憱leDelayed;槴ڀHOacfhimoqstuფჱჷჽᄙᄞᅑᅖᅡᅧᆵᆻᆿĀCcჩხHcy;䐩y;䐨FTcy;䐬cute;䅚ʀ;aeiyᄈᄉᄎᄓᄗ檼ron;䅠dil;䅞rc;䅜;䐡r;쀀𝔖ortȀDLRUᄪᄴᄾᅉownArrow»ОeftArrow»࢚ightArrow»࿝pArrow;憑gma;䎣allCircle;战pf;쀀𝕊ɲᅭ\0\0ᅰt;戚areȀ;ISUᅻᅼᆉᆯ斡ntersection;抓uĀbpᆏᆞsetĀ;Eᆗᆘ抏qual;抑ersetĀ;Eᆨᆩ抐qual;抒nion;抔cr;쀀𝒮ar;拆ȀbcmpᇈᇛሉላĀ;sᇍᇎ拐etĀ;Eᇍᇕqual;抆ĀchᇠህeedsȀ;ESTᇭᇮᇴᇿ扻qual;檰lantEqual;扽ilde;承Tháྌ;我ƀ;esሒሓሣ拑rsetĀ;Eሜም抃qual;抇et»ሓրHRSacfhiorsሾቄ቉ቕ቞ቱቶኟዂወዑORN耻Þ䃞ADE;愢ĀHc቎ቒcy;䐋y;䐦Ābuቚቜ;䀉;䎤ƀaeyብቪቯron;䅤dil;䅢;䐢r;쀀𝔗Āeiቻ኉ǲኀ\0ኇefore;戴a;䎘Ācn኎ኘkSpace;쀀  Space;怉ldeȀ;EFTካኬኲኼ戼qual;扃ullEqual;扅ilde;扈pf;쀀𝕋ipleDot;惛Āctዖዛr;쀀𝒯rok;䅦ૡዷጎጚጦ\0ጬጱ\0\0\0\0\0ጸጽ፷ᎅ\0᏿ᐄᐊᐐĀcrዻጁute耻Ú䃚rĀ;oጇገ憟cir;楉rǣጓ\0጖y;䐎ve;䅬Āiyጞጣrc耻Û䃛;䐣blac;䅰r;쀀𝔘rave耻Ù䃙acr;䅪Ādiፁ፩erĀBPፈ፝Āarፍፐr;䁟acĀekፗፙ;揟et;掵arenthesis;揝onĀ;P፰፱拃lus;抎Āgp፻፿on;䅲f;쀀𝕌ЀADETadps᎕ᎮᎸᏄϨᏒᏗᏳrrowƀ;BDᅐᎠᎤar;椒ownArrow;懅ownArrow;憕quilibrium;楮eeĀ;AᏋᏌ报rrow;憥ownáϳerĀLRᏞᏨeftArrow;憖ightArrow;憗iĀ;lᏹᏺ䏒on;䎥ing;䅮cr;쀀𝒰ilde;䅨ml耻Ü䃜ҀDbcdefosvᐧᐬᐰᐳᐾᒅᒊᒐᒖash;披ar;櫫y;䐒ashĀ;lᐻᐼ抩;櫦Āerᑃᑅ;拁ƀbtyᑌᑐᑺar;怖Ā;iᑏᑕcalȀBLSTᑡᑥᑪᑴar;戣ine;䁼eparator;杘ilde;所ThinSpace;怊r;쀀𝔙pf;쀀𝕍cr;쀀𝒱dash;抪ʀcefosᒧᒬᒱᒶᒼirc;䅴dge;拀r;쀀𝔚pf;쀀𝕎cr;쀀𝒲Ȁfiosᓋᓐᓒᓘr;쀀𝔛;䎞pf;쀀𝕏cr;쀀𝒳ҀAIUacfosuᓱᓵᓹᓽᔄᔏᔔᔚᔠcy;䐯cy;䐇cy;䐮cute耻Ý䃝Āiyᔉᔍrc;䅶;䐫r;쀀𝔜pf;쀀𝕐cr;쀀𝒴ml;䅸ЀHacdefosᔵᔹᔿᕋᕏᕝᕠᕤcy;䐖cute;䅹Āayᕄᕉron;䅽;䐗ot;䅻ǲᕔ\0ᕛoWidtè૙a;䎖r;愨pf;愤cr;쀀𝒵௡ᖃᖊᖐ\0ᖰᖶᖿ\0\0\0\0ᗆᗛᗫᙟ᙭\0ᚕ᚛ᚲᚹ\0ᚾcute耻á䃡reve;䄃̀;Ediuyᖜᖝᖡᖣᖨᖭ戾;쀀∾̳;房rc耻â䃢te肻´̆;䐰lig耻æ䃦Ā;r²ᖺ;쀀𝔞rave耻à䃠ĀepᗊᗖĀfpᗏᗔsym;愵èᗓha;䎱ĀapᗟcĀclᗤᗧr;䄁g;樿ɤᗰ\0\0ᘊʀ;adsvᗺᗻᗿᘁᘇ戧nd;橕;橜lope;橘;橚΀;elmrszᘘᘙᘛᘞᘿᙏᙙ戠;榤e»ᘙsdĀ;aᘥᘦ戡ѡᘰᘲᘴᘶᘸᘺᘼᘾ;榨;榩;榪;榫;榬;榭;榮;榯tĀ;vᙅᙆ戟bĀ;dᙌᙍ抾;榝Āptᙔᙗh;戢»¹arr;捼Āgpᙣᙧon;䄅f;쀀𝕒΀;Eaeiop዁ᙻᙽᚂᚄᚇᚊ;橰cir;橯;扊d;手s;䀧roxĀ;e዁ᚒñᚃing耻å䃥ƀctyᚡᚦᚨr;쀀𝒶;䀪mpĀ;e዁ᚯñʈilde耻ã䃣ml耻ä䃤Āciᛂᛈoninôɲnt;樑ࠀNabcdefiklnoprsu᛭ᛱᜰ᜼ᝃᝈ᝸᝽០៦ᠹᡐᜍ᤽᥈ᥰot;櫭Ācrᛶ᜞kȀcepsᜀᜅᜍᜓong;扌psilon;䏶rime;怵imĀ;e᜚᜛戽q;拍Ŷᜢᜦee;抽edĀ;gᜬᜭ挅e»ᜭrkĀ;t፜᜷brk;掶Āoyᜁᝁ;䐱quo;怞ʀcmprtᝓ᝛ᝡᝤᝨausĀ;eĊĉptyv;榰séᜌnoõēƀahwᝯ᝱ᝳ;䎲;愶een;扬r;쀀𝔟g΀costuvwឍឝឳេ៕៛៞ƀaiuបពរðݠrc;旯p»፱ƀdptឤឨឭot;樀lus;樁imes;樂ɱឹ\0\0ើcup;樆ar;昅riangleĀdu៍្own;施p;斳plus;樄eåᑄåᒭarow;植ƀako៭ᠦᠵĀcn៲ᠣkƀlst៺֫᠂ozenge;槫riangleȀ;dlr᠒᠓᠘᠝斴own;斾eft;旂ight;斸k;搣Ʊᠫ\0ᠳƲᠯ\0ᠱ;斒;斑4;斓ck;斈ĀeoᠾᡍĀ;qᡃᡆ쀀=⃥uiv;쀀≡⃥t;挐Ȁptwxᡙᡞᡧᡬf;쀀𝕓Ā;tᏋᡣom»Ꮜtie;拈؀DHUVbdhmptuvᢅᢖᢪᢻᣗᣛᣬ᣿ᤅᤊᤐᤡȀLRlrᢎᢐᢒᢔ;敗;敔;敖;敓ʀ;DUduᢡᢢᢤᢦᢨ敐;敦;敩;敤;敧ȀLRlrᢳᢵᢷᢹ;敝;敚;敜;教΀;HLRhlrᣊᣋᣍᣏᣑᣓᣕ救;敬;散;敠;敫;敢;敟ox;槉ȀLRlrᣤᣦᣨᣪ;敕;敒;攐;攌ʀ;DUduڽ᣷᣹᣻᣽;敥;敨;攬;攴inus;抟lus;択imes;抠ȀLRlrᤙᤛᤝ᤟;敛;敘;攘;攔΀;HLRhlrᤰᤱᤳᤵᤷ᤻᤹攂;敪;敡;敞;攼;攤;攜Āevģ᥂bar耻¦䂦Ȁceioᥑᥖᥚᥠr;쀀𝒷mi;恏mĀ;e᜚᜜lƀ;bhᥨᥩᥫ䁜;槅sub;柈Ŭᥴ᥾lĀ;e᥹᥺怢t»᥺pƀ;Eeįᦅᦇ;檮Ā;qۜۛೡᦧ\0᧨ᨑᨕᨲ\0ᨷᩐ\0\0᪴\0\0᫁\0\0ᬡᬮ᭍᭒\0᯽\0ᰌƀcpr᦭ᦲ᧝ute;䄇̀;abcdsᦿᧀᧄ᧊᧕᧙戩nd;橄rcup;橉Āau᧏᧒p;橋p;橇ot;橀;쀀∩︀Āeo᧢᧥t;恁îړȀaeiu᧰᧻ᨁᨅǰ᧵\0᧸s;橍on;䄍dil耻ç䃧rc;䄉psĀ;sᨌᨍ橌m;橐ot;䄋ƀdmnᨛᨠᨦil肻¸ƭptyv;榲t脀¢;eᨭᨮ䂢räƲr;쀀𝔠ƀceiᨽᩀᩍy;䑇ckĀ;mᩇᩈ朓ark»ᩈ;䏇r΀;Ecefms᩟᩠ᩢᩫ᪤᪪᪮旋;槃ƀ;elᩩᩪᩭ䋆q;扗eɡᩴ\0\0᪈rrowĀlr᩼᪁eft;憺ight;憻ʀRSacd᪒᪔᪖᪚᪟»ཇ;擈st;抛irc;抚ash;抝nint;樐id;櫯cir;槂ubsĀ;u᪻᪼晣it»᪼ˬ᫇᫔᫺\0ᬊonĀ;eᫍᫎ䀺Ā;qÇÆɭ᫙\0\0᫢aĀ;t᫞᫟䀬;䁀ƀ;fl᫨᫩᫫戁îᅠeĀmx᫱᫶ent»᫩eóɍǧ᫾\0ᬇĀ;dኻᬂot;橭nôɆƀfryᬐᬔᬗ;쀀𝕔oäɔ脀©;sŕᬝr;愗Āaoᬥᬩrr;憵ss;朗Ācuᬲᬷr;쀀𝒸Ābpᬼ᭄Ā;eᭁᭂ櫏;櫑Ā;eᭉᭊ櫐;櫒dot;拯΀delprvw᭠᭬᭷ᮂᮬᯔ᯹arrĀlr᭨᭪;椸;椵ɰ᭲\0\0᭵r;拞c;拟arrĀ;p᭿ᮀ憶;椽̀;bcdosᮏᮐᮖᮡᮥᮨ截rcap;橈Āauᮛᮞp;橆p;橊ot;抍r;橅;쀀∪︀Ȁalrv᮵ᮿᯞᯣrrĀ;mᮼᮽ憷;椼yƀevwᯇᯔᯘqɰᯎ\0\0ᯒreã᭳uã᭵ee;拎edge;拏en耻¤䂤earrowĀlrᯮ᯳eft»ᮀight»ᮽeäᯝĀciᰁᰇoninôǷnt;戱lcty;挭ঀAHabcdefhijlorstuwz᰸᰻᰿ᱝᱩᱵᲊᲞᲬᲷ᳻᳿ᴍᵻᶑᶫᶻ᷆᷍rò΁ar;楥Ȁglrs᱈ᱍ᱒᱔ger;怠eth;愸òᄳhĀ;vᱚᱛ怐»ऊūᱡᱧarow;椏aã̕Āayᱮᱳron;䄏;䐴ƀ;ao̲ᱼᲄĀgrʿᲁr;懊tseq;橷ƀglmᲑᲔᲘ耻°䂰ta;䎴ptyv;榱ĀirᲣᲨsht;楿;쀀𝔡arĀlrᲳᲵ»ࣜ»သʀaegsv᳂͸᳖᳜᳠mƀ;oș᳊᳔ndĀ;ș᳑uit;晦amma;䏝in;拲ƀ;io᳧᳨᳸䃷de脀÷;o᳧ᳰntimes;拇nø᳷cy;䑒cɯᴆ\0\0ᴊrn;挞op;挍ʀlptuwᴘᴝᴢᵉᵕlar;䀤f;쀀𝕕ʀ;emps̋ᴭᴷᴽᵂqĀ;d͒ᴳot;扑inus;戸lus;戔quare;抡blebarwedgåúnƀadhᄮᵝᵧownarrowóᲃarpoonĀlrᵲᵶefôᲴighôᲶŢᵿᶅkaro÷གɯᶊ\0\0ᶎrn;挟op;挌ƀcotᶘᶣᶦĀryᶝᶡ;쀀𝒹;䑕l;槶rok;䄑Ādrᶰᶴot;拱iĀ;fᶺ᠖斿Āah᷀᷃ròЩaòྦangle;榦Āci᷒ᷕy;䑟grarr;柿ऀDacdefglmnopqrstuxḁḉḙḸոḼṉṡṾấắẽỡἪἷὄ὎὚ĀDoḆᴴoôᲉĀcsḎḔute耻é䃩ter;橮ȀaioyḢḧḱḶron;䄛rĀ;cḭḮ扖耻ê䃪lon;払;䑍ot;䄗ĀDrṁṅot;扒;쀀𝔢ƀ;rsṐṑṗ檚ave耻è䃨Ā;dṜṝ檖ot;檘Ȁ;ilsṪṫṲṴ檙nters;揧;愓Ā;dṹṺ檕ot;檗ƀapsẅẉẗcr;䄓tyƀ;svẒẓẕ戅et»ẓpĀ1;ẝẤĳạả;怄;怅怃ĀgsẪẬ;䅋p;怂ĀgpẴẸon;䄙f;쀀𝕖ƀalsỄỎỒrĀ;sỊị拕l;槣us;橱iƀ;lvỚớở䎵on»ớ;䏵ȀcsuvỪỳἋἣĀioữḱrc»Ḯɩỹ\0\0ỻíՈantĀglἂἆtr»ṝess»Ṻƀaeiἒ἖Ἒls;䀽st;扟vĀ;DȵἠD;橸parsl;槥ĀDaἯἳot;打rr;楱ƀcdiἾὁỸr;愯oô͒ĀahὉὋ;䎷耻ð䃰Āmrὓὗl耻ë䃫o;悬ƀcipὡὤὧl;䀡sôծĀeoὬὴctatioîՙnentialåչৡᾒ\0ᾞ\0ᾡᾧ\0\0ῆῌ\0ΐ\0ῦῪ \0 ⁚llingdotseñṄy;䑄male;晀ƀilrᾭᾳ῁lig;耀ﬃɩᾹ\0\0᾽g;耀ﬀig;耀ﬄ;쀀𝔣lig;耀ﬁlig;쀀fjƀaltῙ῜ῡt;晭ig;耀ﬂns;斱of;䆒ǰ΅\0ῳf;쀀𝕗ĀakֿῷĀ;vῼ´拔;櫙artint;樍Āao‌⁕Ācs‑⁒α‚‰‸⁅⁈\0⁐β•‥‧‪‬\0‮耻½䂽;慓耻¼䂼;慕;慙;慛Ƴ‴\0‶;慔;慖ʴ‾⁁\0\0⁃耻¾䂾;慗;慜5;慘ƶ⁌\0⁎;慚;慝8;慞l;恄wn;挢cr;쀀𝒻ࢀEabcdefgijlnorstv₂₉₟₥₰₴⃰⃵⃺⃿℃ℒℸ̗ℾ⅒↞Ā;lٍ₇;檌ƀcmpₐₕ₝ute;䇵maĀ;dₜ᳚䎳;檆reve;䄟Āiy₪₮rc;䄝;䐳ot;䄡Ȁ;lqsؾق₽⃉ƀ;qsؾٌ⃄lanô٥Ȁ;cdl٥⃒⃥⃕c;檩otĀ;o⃜⃝檀Ā;l⃢⃣檂;檄Ā;e⃪⃭쀀⋛︀s;檔r;쀀𝔤Ā;gٳ؛mel;愷cy;䑓Ȁ;Eajٚℌℎℐ;檒;檥;檤ȀEaesℛℝ℩ℴ;扩pĀ;p℣ℤ檊rox»ℤĀ;q℮ℯ檈Ā;q℮ℛim;拧pf;쀀𝕘Āci⅃ⅆr;愊mƀ;el٫ⅎ⅐;檎;檐茀>;cdlqr׮ⅠⅪⅮⅳⅹĀciⅥⅧ;檧r;橺ot;拗Par;榕uest;橼ʀadelsↄⅪ←ٖ↛ǰ↉\0↎proø₞r;楸qĀlqؿ↖lesó₈ií٫Āen↣↭rtneqq;쀀≩︀Å↪ԀAabcefkosy⇄⇇⇱⇵⇺∘∝∯≨≽ròΠȀilmr⇐⇔⇗⇛rsðᒄf»․ilôکĀdr⇠⇤cy;䑊ƀ;cwࣴ⇫⇯ir;楈;憭ar;意irc;䄥ƀalr∁∎∓rtsĀ;u∉∊晥it»∊lip;怦con;抹r;쀀𝔥sĀew∣∩arow;椥arow;椦ʀamopr∺∾≃≞≣rr;懿tht;戻kĀlr≉≓eftarrow;憩ightarrow;憪f;쀀𝕙bar;怕ƀclt≯≴≸r;쀀𝒽asè⇴rok;䄧Ābp⊂⊇ull;恃hen»ᱛૡ⊣\0⊪\0⊸⋅⋎\0⋕⋳\0\0⋸⌢⍧⍢⍿\0⎆⎪⎴cute耻í䃭ƀ;iyݱ⊰⊵rc耻î䃮;䐸Ācx⊼⊿y;䐵cl耻¡䂡ĀfrΟ⋉;쀀𝔦rave耻ì䃬Ȁ;inoܾ⋝⋩⋮Āin⋢⋦nt;樌t;戭fin;槜ta;愩lig;䄳ƀaop⋾⌚⌝ƀcgt⌅⌈⌗r;䄫ƀelpܟ⌏⌓inåގarôܠh;䄱f;抷ed;䆵ʀ;cfotӴ⌬⌱⌽⍁are;愅inĀ;t⌸⌹戞ie;槝doô⌙ʀ;celpݗ⍌⍐⍛⍡al;抺Āgr⍕⍙eróᕣã⍍arhk;樗rod;樼Ȁcgpt⍯⍲⍶⍻y;䑑on;䄯f;쀀𝕚a;䎹uest耻¿䂿Āci⎊⎏r;쀀𝒾nʀ;EdsvӴ⎛⎝⎡ӳ;拹ot;拵Ā;v⎦⎧拴;拳Ā;iݷ⎮lde;䄩ǫ⎸\0⎼cy;䑖l耻ï䃯̀cfmosu⏌⏗⏜⏡⏧⏵Āiy⏑⏕rc;䄵;䐹r;쀀𝔧ath;䈷pf;쀀𝕛ǣ⏬\0⏱r;쀀𝒿rcy;䑘kcy;䑔Ѐacfghjos␋␖␢␧␭␱␵␻ppaĀ;v␓␔䎺;䏰Āey␛␠dil;䄷;䐺r;쀀𝔨reen;䄸cy;䑅cy;䑜pf;쀀𝕜cr;쀀𝓀஀ABEHabcdefghjlmnoprstuv⑰⒁⒆⒍⒑┎┽╚▀♎♞♥♹♽⚚⚲⛘❝❨➋⟀⠁⠒ƀart⑷⑺⑼rò৆òΕail;椛arr;椎Ā;gঔ⒋;檋ar;楢ॣ⒥\0⒪\0⒱\0\0\0\0\0⒵Ⓔ\0ⓆⓈⓍ\0⓹ute;䄺mptyv;榴raîࡌbda;䎻gƀ;dlࢎⓁⓃ;榑åࢎ;檅uo耻«䂫rЀ;bfhlpst࢙ⓞⓦⓩ⓫⓮⓱⓵Ā;f࢝ⓣs;椟s;椝ë≒p;憫l;椹im;楳l;憢ƀ;ae⓿─┄檫il;椙Ā;s┉┊檭;쀀⪭︀ƀabr┕┙┝rr;椌rk;杲Āak┢┬cĀek┨┪;䁻;䁛Āes┱┳;榋lĀdu┹┻;榏;榍Ȁaeuy╆╋╖╘ron;䄾Ādi═╔il;䄼ìࢰâ┩;䐻Ȁcqrs╣╦╭╽a;椶uoĀ;rนᝆĀdu╲╷har;楧shar;楋h;憲ʀ;fgqs▋▌উ◳◿扤tʀahlrt▘▤▷◂◨rrowĀ;t࢙□aé⓶arpoonĀdu▯▴own»њp»०eftarrows;懇ightƀahs◍◖◞rrowĀ;sࣴࢧarpoonó྘quigarro÷⇰hreetimes;拋ƀ;qs▋ও◺lanôবʀ;cdgsব☊☍☝☨c;檨otĀ;o☔☕橿Ā;r☚☛檁;檃Ā;e☢☥쀀⋚︀s;檓ʀadegs☳☹☽♉♋pproøⓆot;拖qĀgq♃♅ôউgtò⒌ôছiíলƀilr♕࣡♚sht;楼;쀀𝔩Ā;Eজ♣;檑š♩♶rĀdu▲♮Ā;l॥♳;楪lk;斄cy;䑙ʀ;achtੈ⚈⚋⚑⚖rò◁orneòᴈard;楫ri;旺Āio⚟⚤dot;䅀ustĀ;a⚬⚭掰che»⚭ȀEaes⚻⚽⛉⛔;扨pĀ;p⛃⛄檉rox»⛄Ā;q⛎⛏檇Ā;q⛎⚻im;拦Ѐabnoptwz⛩⛴⛷✚✯❁❇❐Ānr⛮⛱g;柬r;懽rëࣁgƀlmr⛿✍✔eftĀar০✇ightá৲apsto;柼ightá৽parrowĀlr✥✩efô⓭ight;憬ƀafl✶✹✽r;榅;쀀𝕝us;樭imes;樴š❋❏st;戗áፎƀ;ef❗❘᠀旊nge»❘arĀ;l❤❥䀨t;榓ʀachmt❳❶❼➅➇ròࢨorneòᶌarĀ;d྘➃;業;怎ri;抿̀achiqt➘➝ੀ➢➮➻quo;怹r;쀀𝓁mƀ;egল➪➬;檍;檏Ābu┪➳oĀ;rฟ➹;怚rok;䅂萀<;cdhilqrࠫ⟒☹⟜⟠⟥⟪⟰Āci⟗⟙;檦r;橹reå◲mes;拉arr;楶uest;橻ĀPi⟵⟹ar;榖ƀ;ef⠀भ᠛旃rĀdu⠇⠍shar;楊har;楦Āen⠗⠡rtneqq;쀀≨︀Å⠞܀Dacdefhilnopsu⡀⡅⢂⢎⢓⢠⢥⢨⣚⣢⣤ઃ⣳⤂Dot;戺Ȁclpr⡎⡒⡣⡽r耻¯䂯Āet⡗⡙;時Ā;e⡞⡟朠se»⡟Ā;sျ⡨toȀ;dluျ⡳⡷⡻owîҌefôएðᏑker;斮Āoy⢇⢌mma;権;䐼ash;怔asuredangle»ᘦr;쀀𝔪o;愧ƀcdn⢯⢴⣉ro耻µ䂵Ȁ;acdᑤ⢽⣀⣄sôᚧir;櫰ot肻·Ƶusƀ;bd⣒ᤃ⣓戒Ā;uᴼ⣘;横ţ⣞⣡p;櫛ò−ðઁĀdp⣩⣮els;抧f;쀀𝕞Āct⣸⣽r;쀀𝓂pos»ᖝƀ;lm⤉⤊⤍䎼timap;抸ఀGLRVabcdefghijlmoprstuvw⥂⥓⥾⦉⦘⧚⧩⨕⨚⩘⩝⪃⪕⪤⪨⬄⬇⭄⭿⮮ⰴⱧⱼ⳩Āgt⥇⥋;쀀⋙̸Ā;v⥐௏쀀≫⃒ƀelt⥚⥲⥶ftĀar⥡⥧rrow;懍ightarrow;懎;쀀⋘̸Ā;v⥻ే쀀≪⃒ightarrow;懏ĀDd⦎⦓ash;抯ash;抮ʀbcnpt⦣⦧⦬⦱⧌la»˞ute;䅄g;쀀∠⃒ʀ;Eiop඄⦼⧀⧅⧈;쀀⩰̸d;쀀≋̸s;䅉roø඄urĀ;a⧓⧔普lĀ;s⧓ସǳ⧟\0⧣p肻\xA0ଷmpĀ;e௹ఀʀaeouy⧴⧾⨃⨐⨓ǰ⧹\0⧻;橃on;䅈dil;䅆ngĀ;dൾ⨊ot;쀀⩭̸p;橂;䐽ash;怓΀;Aadqsxஒ⨩⨭⨻⩁⩅⩐rr;懗rĀhr⨳⨶k;椤Ā;oᏲᏰot;쀀≐̸uiöୣĀei⩊⩎ar;椨í஘istĀ;s஠டr;쀀𝔫ȀEest௅⩦⩹⩼ƀ;qs஼⩭௡ƀ;qs஼௅⩴lanô௢ií௪Ā;rஶ⪁»ஷƀAap⪊⪍⪑rò⥱rr;憮ar;櫲ƀ;svྍ⪜ྌĀ;d⪡⪢拼;拺cy;䑚΀AEadest⪷⪺⪾⫂⫅⫶⫹rò⥦;쀀≦̸rr;憚r;急Ȁ;fqs఻⫎⫣⫯tĀar⫔⫙rro÷⫁ightarro÷⪐ƀ;qs఻⪺⫪lanôౕĀ;sౕ⫴»శiíౝĀ;rవ⫾iĀ;eచథiäඐĀpt⬌⬑f;쀀𝕟膀¬;in⬙⬚⬶䂬nȀ;Edvஉ⬤⬨⬮;쀀⋹̸ot;쀀⋵̸ǡஉ⬳⬵;拷;拶iĀ;vಸ⬼ǡಸ⭁⭃;拾;拽ƀaor⭋⭣⭩rȀ;ast୻⭕⭚⭟lleì୻l;쀀⫽⃥;쀀∂̸lint;樔ƀ;ceಒ⭰⭳uåಥĀ;cಘ⭸Ā;eಒ⭽ñಘȀAait⮈⮋⮝⮧rò⦈rrƀ;cw⮔⮕⮙憛;쀀⤳̸;쀀↝̸ghtarrow»⮕riĀ;eೋೖ΀chimpqu⮽⯍⯙⬄୸⯤⯯Ȁ;cerല⯆ഷ⯉uå൅;쀀𝓃ortɭ⬅\0\0⯖ará⭖mĀ;e൮⯟Ā;q൴൳suĀbp⯫⯭å೸åഋƀbcp⯶ⰑⰙȀ;Ees⯿ⰀഢⰄ抄;쀀⫅̸etĀ;eഛⰋqĀ;qണⰀcĀ;eലⰗñസȀ;EesⰢⰣൟⰧ抅;쀀⫆̸etĀ;e൘ⰮqĀ;qൠⰣȀgilrⰽⰿⱅⱇìௗlde耻ñ䃱çృiangleĀlrⱒⱜeftĀ;eచⱚñదightĀ;eೋⱥñ೗Ā;mⱬⱭ䎽ƀ;esⱴⱵⱹ䀣ro;愖p;怇ҀDHadgilrsⲏⲔⲙⲞⲣⲰⲶⳓⳣash;抭arr;椄p;쀀≍⃒ash;抬ĀetⲨⲬ;쀀≥⃒;쀀>⃒nfin;槞ƀAetⲽⳁⳅrr;椂;쀀≤⃒Ā;rⳊⳍ쀀<⃒ie;쀀⊴⃒ĀAtⳘⳜrr;椃rie;쀀⊵⃒im;쀀∼⃒ƀAan⳰⳴ⴂrr;懖rĀhr⳺⳽k;椣Ā;oᏧᏥear;椧ቓ᪕\0\0\0\0\0\0\0\0\0\0\0\0\0ⴭ\0ⴸⵈⵠⵥ⵲ⶄᬇ\0\0ⶍⶫ\0ⷈⷎ\0ⷜ⸙⸫⸾⹃Ācsⴱ᪗ute耻ó䃳ĀiyⴼⵅrĀ;c᪞ⵂ耻ô䃴;䐾ʀabios᪠ⵒⵗǈⵚlac;䅑v;樸old;榼lig;䅓Ācr⵩⵭ir;榿;쀀𝔬ͯ⵹\0\0⵼\0ⶂn;䋛ave耻ò䃲;槁Ābmⶈ෴ar;榵Ȁacitⶕ⶘ⶥⶨrò᪀Āir⶝ⶠr;榾oss;榻nå๒;槀ƀaeiⶱⶵⶹcr;䅍ga;䏉ƀcdnⷀⷅǍron;䎿;榶pf;쀀𝕠ƀaelⷔ⷗ǒr;榷rp;榹΀;adiosvⷪⷫⷮ⸈⸍⸐⸖戨rò᪆Ȁ;efmⷷⷸ⸂⸅橝rĀ;oⷾⷿ愴f»ⷿ耻ª䂪耻º䂺gof;抶r;橖lope;橗;橛ƀclo⸟⸡⸧ò⸁ash耻ø䃸l;折iŬⸯ⸴de耻õ䃵esĀ;aǛ⸺s;樶ml耻ö䃶bar;挽ૡ⹞\0⹽\0⺀⺝\0⺢⺹\0\0⻋ຜ\0⼓\0\0⼫⾼\0⿈rȀ;astЃ⹧⹲຅脀¶;l⹭⹮䂶leìЃɩ⹸\0\0⹻m;櫳;櫽y;䐿rʀcimpt⺋⺏⺓ᡥ⺗nt;䀥od;䀮il;怰enk;怱r;쀀𝔭ƀimo⺨⺰⺴Ā;v⺭⺮䏆;䏕maô੶ne;明ƀ;tv⺿⻀⻈䏀chfork»´;䏖Āau⻏⻟nĀck⻕⻝kĀ;h⇴⻛;愎ö⇴sҀ;abcdemst⻳⻴ᤈ⻹⻽⼄⼆⼊⼎䀫cir;樣ir;樢Āouᵀ⼂;樥;橲n肻±ຝim;樦wo;樧ƀipu⼙⼠⼥ntint;樕f;쀀𝕡nd耻£䂣Ԁ;Eaceinosu່⼿⽁⽄⽇⾁⾉⾒⽾⾶;檳p;檷uå໙Ā;c໎⽌̀;acens່⽙⽟⽦⽨⽾pproø⽃urlyeñ໙ñ໎ƀaes⽯⽶⽺pprox;檹qq;檵im;拨iíໟmeĀ;s⾈ຮ怲ƀEas⽸⾐⽺ð⽵ƀdfp໬⾙⾯ƀals⾠⾥⾪lar;挮ine;挒urf;挓Ā;t໻⾴ï໻rel;抰Āci⿀⿅r;쀀𝓅;䏈ncsp;怈̀fiopsu⿚⋢⿟⿥⿫⿱r;쀀𝔮pf;쀀𝕢rime;恗cr;쀀𝓆ƀaeo⿸〉〓tĀei⿾々rnionóڰnt;樖stĀ;e【】䀿ñἙô༔઀ABHabcdefhilmnoprstux぀けさすムㄎㄫㅇㅢㅲㆎ㈆㈕㈤㈩㉘㉮㉲㊐㊰㊷ƀartぇおがròႳòϝail;検aròᱥar;楤΀cdenqrtとふへみわゔヌĀeuねぱ;쀀∽̱te;䅕iãᅮmptyv;榳gȀ;del࿑らるろ;榒;榥å࿑uo耻»䂻rր;abcfhlpstw࿜ガクシスゼゾダッデナp;極Ā;f࿠ゴs;椠;椳s;椞ë≝ð✮l;楅im;楴l;憣;憝Āaiパフil;椚oĀ;nホボ戶aló༞ƀabrョリヮrò៥rk;杳ĀakンヽcĀekヹ・;䁽;䁝Āes㄂㄄;榌lĀduㄊㄌ;榎;榐Ȁaeuyㄗㄜㄧㄩron;䅙Ādiㄡㄥil;䅗ì࿲âヺ;䑀Ȁclqsㄴㄷㄽㅄa;椷dhar;楩uoĀ;rȎȍh;憳ƀacgㅎㅟངlȀ;ipsླྀㅘㅛႜnåႻarôྩt;断ƀilrㅩဣㅮsht;楽;쀀𝔯ĀaoㅷㆆrĀduㅽㅿ»ѻĀ;l႑ㆄ;楬Ā;vㆋㆌ䏁;䏱ƀgns㆕ㇹㇼht̀ahlrstㆤㆰ㇂㇘㇤㇮rrowĀ;t࿜ㆭaéトarpoonĀduㆻㆿowîㅾp»႒eftĀah㇊㇐rrowó࿪arpoonóՑightarrows;應quigarro÷ニhreetimes;拌g;䋚ingdotseñἲƀahm㈍㈐㈓rò࿪aòՑ;怏oustĀ;a㈞㈟掱che»㈟mid;櫮Ȁabpt㈲㈽㉀㉒Ānr㈷㈺g;柭r;懾rëဃƀafl㉇㉊㉎r;榆;쀀𝕣us;樮imes;樵Āap㉝㉧rĀ;g㉣㉤䀩t;榔olint;樒arò㇣Ȁachq㉻㊀Ⴜ㊅quo;怺r;쀀𝓇Ābu・㊊oĀ;rȔȓƀhir㊗㊛㊠reåㇸmes;拊iȀ;efl㊪ၙᠡ㊫方tri;槎luhar;楨;愞ൡ㋕㋛㋟㌬㌸㍱\0㍺㎤\0\0㏬㏰\0㐨㑈㑚㒭㒱㓊㓱\0㘖\0\0㘳cute;䅛quï➺Ԁ;Eaceinpsyᇭ㋳㋵㋿㌂㌋㌏㌟㌦㌩;檴ǰ㋺\0㋼;檸on;䅡uåᇾĀ;dᇳ㌇il;䅟rc;䅝ƀEas㌖㌘㌛;檶p;檺im;择olint;樓iíሄ;䑁otƀ;be㌴ᵇ㌵担;橦΀Aacmstx㍆㍊㍗㍛㍞㍣㍭rr;懘rĀhr㍐㍒ë∨Ā;oਸ਼਴t耻§䂧i;䀻war;椩mĀin㍩ðnuóñt;朶rĀ;o㍶⁕쀀𝔰Ȁacoy㎂㎆㎑㎠rp;景Āhy㎋㎏cy;䑉;䑈rtɭ㎙\0\0㎜iäᑤaraì⹯耻­䂭Āgm㎨㎴maƀ;fv㎱㎲㎲䏃;䏂Ѐ;deglnprካ㏅㏉㏎㏖㏞㏡㏦ot;橪Ā;q኱ኰĀ;E㏓㏔檞;檠Ā;E㏛㏜檝;檟e;扆lus;樤arr;楲aròᄽȀaeit㏸㐈㐏㐗Āls㏽㐄lsetmé㍪hp;樳parsl;槤Ādlᑣ㐔e;挣Ā;e㐜㐝檪Ā;s㐢㐣檬;쀀⪬︀ƀflp㐮㐳㑂tcy;䑌Ā;b㐸㐹䀯Ā;a㐾㐿槄r;挿f;쀀𝕤aĀdr㑍ЂesĀ;u㑔㑕晠it»㑕ƀcsu㑠㑹㒟Āau㑥㑯pĀ;sᆈ㑫;쀀⊓︀pĀ;sᆴ㑵;쀀⊔︀uĀbp㑿㒏ƀ;esᆗᆜ㒆etĀ;eᆗ㒍ñᆝƀ;esᆨᆭ㒖etĀ;eᆨ㒝ñᆮƀ;afᅻ㒦ְrť㒫ֱ»ᅼaròᅈȀcemt㒹㒾㓂㓅r;쀀𝓈tmîñiì㐕aræᆾĀar㓎㓕rĀ;f㓔ឿ昆Āan㓚㓭ightĀep㓣㓪psiloîỠhé⺯s»⡒ʀbcmnp㓻㕞ሉ㖋㖎Ҁ;Edemnprs㔎㔏㔑㔕㔞㔣㔬㔱㔶抂;櫅ot;檽Ā;dᇚ㔚ot;櫃ult;櫁ĀEe㔨㔪;櫋;把lus;檿arr;楹ƀeiu㔽㕒㕕tƀ;en㔎㕅㕋qĀ;qᇚ㔏eqĀ;q㔫㔨m;櫇Ābp㕚㕜;櫕;櫓c̀;acensᇭ㕬㕲㕹㕻㌦pproø㋺urlyeñᇾñᇳƀaes㖂㖈㌛pproø㌚qñ㌗g;晪ڀ123;Edehlmnps㖩㖬㖯ሜ㖲㖴㗀㗉㗕㗚㗟㗨㗭耻¹䂹耻²䂲耻³䂳;櫆Āos㖹㖼t;檾ub;櫘Ā;dሢ㗅ot;櫄sĀou㗏㗒l;柉b;櫗arr;楻ult;櫂ĀEe㗤㗦;櫌;抋lus;櫀ƀeiu㗴㘉㘌tƀ;enሜ㗼㘂qĀ;qሢ㖲eqĀ;q㗧㗤m;櫈Ābp㘑㘓;櫔;櫖ƀAan㘜㘠㘭rr;懙rĀhr㘦㘨ë∮Ā;oਫ਩war;椪lig耻ß䃟௡㙑㙝㙠ዎ㙳㙹\0㙾㛂\0\0\0\0\0㛛㜃\0㜉㝬\0\0\0㞇ɲ㙖\0\0㙛get;挖;䏄rë๟ƀaey㙦㙫㙰ron;䅥dil;䅣;䑂lrec;挕r;쀀𝔱Ȁeiko㚆㚝㚵㚼ǲ㚋\0㚑eĀ4fኄኁaƀ;sv㚘㚙㚛䎸ym;䏑Ācn㚢㚲kĀas㚨㚮pproø዁im»ኬsðኞĀas㚺㚮ð዁rn耻þ䃾Ǭ̟㛆⋧es膀×;bd㛏㛐㛘䃗Ā;aᤏ㛕r;樱;樰ƀeps㛡㛣㜀á⩍Ȁ;bcf҆㛬㛰㛴ot;挶ir;櫱Ā;o㛹㛼쀀𝕥rk;櫚á㍢rime;怴ƀaip㜏㜒㝤dåቈ΀adempst㜡㝍㝀㝑㝗㝜㝟ngleʀ;dlqr㜰㜱㜶㝀㝂斵own»ᶻeftĀ;e⠀㜾ñम;扜ightĀ;e㊪㝋ñၚot;旬inus;樺lus;樹b;槍ime;樻ezium;揢ƀcht㝲㝽㞁Āry㝷㝻;쀀𝓉;䑆cy;䑛rok;䅧Āio㞋㞎xô᝷headĀlr㞗㞠eftarro÷ࡏightarrow»ཝऀAHabcdfghlmoprstuw㟐㟓㟗㟤㟰㟼㠎㠜㠣㠴㡑㡝㡫㢩㣌㣒㣪㣶ròϭar;楣Ācr㟜㟢ute耻ú䃺òᅐrǣ㟪\0㟭y;䑞ve;䅭Āiy㟵㟺rc耻û䃻;䑃ƀabh㠃㠆㠋ròᎭlac;䅱aòᏃĀir㠓㠘sht;楾;쀀𝔲rave耻ù䃹š㠧㠱rĀlr㠬㠮»ॗ»ႃlk;斀Āct㠹㡍ɯ㠿\0\0㡊rnĀ;e㡅㡆挜r»㡆op;挏ri;旸Āal㡖㡚cr;䅫肻¨͉Āgp㡢㡦on;䅳f;쀀𝕦̀adhlsuᅋ㡸㡽፲㢑㢠ownáᎳarpoonĀlr㢈㢌efô㠭ighô㠯iƀ;hl㢙㢚㢜䏅»ᏺon»㢚parrows;懈ƀcit㢰㣄㣈ɯ㢶\0\0㣁rnĀ;e㢼㢽挝r»㢽op;挎ng;䅯ri;旹cr;쀀𝓊ƀdir㣙㣝㣢ot;拰lde;䅩iĀ;f㜰㣨»᠓Āam㣯㣲rò㢨l耻ü䃼angle;榧ހABDacdeflnoprsz㤜㤟㤩㤭㦵㦸㦽㧟㧤㧨㧳㧹㧽㨁㨠ròϷarĀ;v㤦㤧櫨;櫩asèϡĀnr㤲㤷grt;榜΀eknprst㓣㥆㥋㥒㥝㥤㦖appá␕othinçẖƀhir㓫⻈㥙opô⾵Ā;hᎷ㥢ïㆍĀiu㥩㥭gmá㎳Ābp㥲㦄setneqĀ;q㥽㦀쀀⊊︀;쀀⫋︀setneqĀ;q㦏㦒쀀⊋︀;쀀⫌︀Āhr㦛㦟etá㚜iangleĀlr㦪㦯eft»थight»ၑy;䐲ash»ံƀelr㧄㧒㧗ƀ;beⷪ㧋㧏ar;抻q;扚lip;拮Ābt㧜ᑨaòᑩr;쀀𝔳tré㦮suĀbp㧯㧱»ജ»൙pf;쀀𝕧roð໻tré㦴Ācu㨆㨋r;쀀𝓋Ābp㨐㨘nĀEe㦀㨖»㥾nĀEe㦒㨞»㦐igzag;榚΀cefoprs㨶㨻㩖㩛㩔㩡㩪irc;䅵Ādi㩀㩑Ābg㩅㩉ar;機eĀ;qᗺ㩏;扙erp;愘r;쀀𝔴pf;쀀𝕨Ā;eᑹ㩦atèᑹcr;쀀𝓌ૣណ㪇\0㪋\0㪐㪛\0\0㪝㪨㪫㪯\0\0㫃㫎\0㫘ៜ៟tré៑r;쀀𝔵ĀAa㪔㪗ròσrò৶;䎾ĀAa㪡㪤ròθrò৫að✓is;拻ƀdptឤ㪵㪾Āfl㪺ឩ;쀀𝕩imåឲĀAa㫇㫊ròώròਁĀcq㫒ីr;쀀𝓍Āpt៖㫜ré។Ѐacefiosu㫰㫽㬈㬌㬑㬕㬛㬡cĀuy㫶㫻te耻ý䃽;䑏Āiy㬂㬆rc;䅷;䑋n耻¥䂥r;쀀𝔶cy;䑗pf;쀀𝕪cr;쀀𝓎Ācm㬦㬩y;䑎l耻ÿ䃿Ԁacdefhiosw㭂㭈㭔㭘㭤㭩㭭㭴㭺㮀cute;䅺Āay㭍㭒ron;䅾;䐷ot;䅼Āet㭝㭡træᕟa;䎶r;쀀𝔷cy;䐶grarr;懝pf;쀀𝕫cr;쀀𝓏Ājn㮅㮇;怍j;怌".split("").map((e) => e.charCodeAt(0))), Jr = /* @__PURE__ */ new Map([
	[0, 65533],
	[128, 8364],
	[130, 8218],
	[131, 402],
	[132, 8222],
	[133, 8230],
	[134, 8224],
	[135, 8225],
	[136, 710],
	[137, 8240],
	[138, 352],
	[139, 8249],
	[140, 338],
	[142, 381],
	[145, 8216],
	[146, 8217],
	[147, 8220],
	[148, 8221],
	[149, 8226],
	[150, 8211],
	[151, 8212],
	[152, 732],
	[153, 8482],
	[154, 353],
	[155, 8250],
	[156, 339],
	[158, 382],
	[159, 376]
]);
String.fromCodePoint;
function Yr(e) {
	return e >= 55296 && e <= 57343 || e > 1114111 ? 65533 : Jr.get(e) ?? e;
}
// node_modules/hast-util-raw/node_modules/entities/dist/esm/decode.js
var Xr;
(function(e) {
	e[e.NUM = 35] = "NUM", e[e.SEMI = 59] = "SEMI", e[e.EQUALS = 61] = "EQUALS", e[e.ZERO = 48] = "ZERO", e[e.NINE = 57] = "NINE", e[e.LOWER_A = 97] = "LOWER_A", e[e.LOWER_F = 102] = "LOWER_F", e[e.LOWER_X = 120] = "LOWER_X", e[e.LOWER_Z = 122] = "LOWER_Z", e[e.UPPER_A = 65] = "UPPER_A", e[e.UPPER_F = 70] = "UPPER_F", e[e.UPPER_Z = 90] = "UPPER_Z";
})(Xr ||= {});
var Zr = 32, Qr;
(function(e) {
	e[e.VALUE_LENGTH = 49152] = "VALUE_LENGTH", e[e.BRANCH_LENGTH = 16256] = "BRANCH_LENGTH", e[e.JUMP_TABLE = 127] = "JUMP_TABLE";
})(Qr ||= {});
function $r(e) {
	return e >= Xr.ZERO && e <= Xr.NINE;
}
function ei(e) {
	return e >= Xr.UPPER_A && e <= Xr.UPPER_F || e >= Xr.LOWER_A && e <= Xr.LOWER_F;
}
function ti(e) {
	return e >= Xr.UPPER_A && e <= Xr.UPPER_Z || e >= Xr.LOWER_A && e <= Xr.LOWER_Z || $r(e);
}
function ni(e) {
	return e === Xr.EQUALS || ti(e);
}
var ri;
(function(e) {
	e[e.EntityStart = 0] = "EntityStart", e[e.NumericStart = 1] = "NumericStart", e[e.NumericDecimal = 2] = "NumericDecimal", e[e.NumericHex = 3] = "NumericHex", e[e.NamedEntity = 4] = "NamedEntity";
})(ri ||= {});
var ii;
(function(e) {
	e[e.Legacy = 0] = "Legacy", e[e.Strict = 1] = "Strict", e[e.Attribute = 2] = "Attribute";
})(ii ||= {});
var ai = class {
	constructor(e, t, n) {
		this.decodeTree = e, this.emitCodePoint = t, this.errors = n, this.state = ri.EntityStart, this.consumed = 1, this.result = 0, this.treeIndex = 0, this.excess = 1, this.decodeMode = ii.Strict;
	}
	startEntity(e) {
		this.decodeMode = e, this.state = ri.EntityStart, this.result = 0, this.treeIndex = 0, this.excess = 1, this.consumed = 1;
	}
	write(e, t) {
		switch (this.state) {
			case ri.EntityStart: return e.charCodeAt(t) === Xr.NUM ? (this.state = ri.NumericStart, this.consumed += 1, this.stateNumericStart(e, t + 1)) : (this.state = ri.NamedEntity, this.stateNamedEntity(e, t));
			case ri.NumericStart: return this.stateNumericStart(e, t);
			case ri.NumericDecimal: return this.stateNumericDecimal(e, t);
			case ri.NumericHex: return this.stateNumericHex(e, t);
			case ri.NamedEntity: return this.stateNamedEntity(e, t);
		}
	}
	stateNumericStart(e, t) {
		return t >= e.length ? -1 : (e.charCodeAt(t) | Zr) === Xr.LOWER_X ? (this.state = ri.NumericHex, this.consumed += 1, this.stateNumericHex(e, t + 1)) : (this.state = ri.NumericDecimal, this.stateNumericDecimal(e, t));
	}
	addToNumericResult(e, t, n, r) {
		if (t !== n) {
			let i = n - t;
			this.result = this.result * r ** +i + Number.parseInt(e.substr(t, i), r), this.consumed += i;
		}
	}
	stateNumericHex(e, t) {
		let n = t;
		for (; t < e.length;) {
			let r = e.charCodeAt(t);
			if ($r(r) || ei(r)) t += 1;
			else return this.addToNumericResult(e, n, t, 16), this.emitNumericEntity(r, 3);
		}
		return this.addToNumericResult(e, n, t, 16), -1;
	}
	stateNumericDecimal(e, t) {
		let n = t;
		for (; t < e.length;) {
			let r = e.charCodeAt(t);
			if ($r(r)) t += 1;
			else return this.addToNumericResult(e, n, t, 10), this.emitNumericEntity(r, 2);
		}
		return this.addToNumericResult(e, n, t, 10), -1;
	}
	emitNumericEntity(e, t) {
		var n;
		if (this.consumed <= t) return (n = this.errors) == null || n.absenceOfDigitsInNumericCharacterReference(this.consumed), 0;
		if (e === Xr.SEMI) this.consumed += 1;
		else if (this.decodeMode === ii.Strict) return 0;
		return this.emitCodePoint(Yr(this.result), this.consumed), this.errors && (e !== Xr.SEMI && this.errors.missingSemicolonAfterCharacterReference(), this.errors.validateNumericCharacterReference(this.result)), this.consumed;
	}
	stateNamedEntity(e, t) {
		let { decodeTree: n } = this, r = n[this.treeIndex], i = (r & Qr.VALUE_LENGTH) >> 14;
		for (; t < e.length; t++, this.excess++) {
			let a = e.charCodeAt(t);
			if (this.treeIndex = oi(n, r, this.treeIndex + Math.max(1, i), a), this.treeIndex < 0) return this.result === 0 || this.decodeMode === ii.Attribute && (i === 0 || ni(a)) ? 0 : this.emitNotTerminatedNamedEntity();
			if (r = n[this.treeIndex], i = (r & Qr.VALUE_LENGTH) >> 14, i !== 0) {
				if (a === Xr.SEMI) return this.emitNamedEntityData(this.treeIndex, i, this.consumed + this.excess);
				this.decodeMode !== ii.Strict && (this.result = this.treeIndex, this.consumed += this.excess, this.excess = 0);
			}
		}
		return -1;
	}
	emitNotTerminatedNamedEntity() {
		var e;
		let { result: t, decodeTree: n } = this, r = (n[t] & Qr.VALUE_LENGTH) >> 14;
		return this.emitNamedEntityData(t, r, this.consumed), (e = this.errors) == null || e.missingSemicolonAfterCharacterReference(), this.consumed;
	}
	emitNamedEntityData(e, t, n) {
		let { decodeTree: r } = this;
		return this.emitCodePoint(t === 1 ? r[e] & ~Qr.VALUE_LENGTH : r[e + 1], n), t === 3 && this.emitCodePoint(r[e + 2], n), n;
	}
	end() {
		var e;
		switch (this.state) {
			case ri.NamedEntity: return this.result !== 0 && (this.decodeMode !== ii.Attribute || this.result === this.treeIndex) ? this.emitNotTerminatedNamedEntity() : 0;
			case ri.NumericDecimal: return this.emitNumericEntity(0, 2);
			case ri.NumericHex: return this.emitNumericEntity(0, 3);
			case ri.NumericStart: return (e = this.errors) == null || e.absenceOfDigitsInNumericCharacterReference(this.consumed), 0;
			case ri.EntityStart: return 0;
		}
	}
};
function oi(e, t, n, r) {
	let i = (t & Qr.BRANCH_LENGTH) >> 7, a = t & Qr.JUMP_TABLE;
	if (i === 0) return a !== 0 && r === a ? n : -1;
	if (a) {
		let t = r - a;
		return t < 0 || t >= i ? -1 : e[n + t] - 1;
	}
	let o = n, s = o + i - 1;
	for (; o <= s;) {
		let t = o + s >>> 1, n = e[t];
		if (n < r) o = t + 1;
		else if (n > r) s = t - 1;
		else return e[t + i];
	}
	return -1;
}
// node_modules/hast-util-raw/node_modules/parse5/dist/common/html.js
var L;
(function(e) {
	e.HTML = "http://www.w3.org/1999/xhtml", e.MATHML = "http://www.w3.org/1998/Math/MathML", e.SVG = "http://www.w3.org/2000/svg", e.XLINK = "http://www.w3.org/1999/xlink", e.XML = "http://www.w3.org/XML/1998/namespace", e.XMLNS = "http://www.w3.org/2000/xmlns/";
})(L ||= {});
var si;
(function(e) {
	e.TYPE = "type", e.ACTION = "action", e.ENCODING = "encoding", e.PROMPT = "prompt", e.NAME = "name", e.COLOR = "color", e.FACE = "face", e.SIZE = "size";
})(si ||= {});
var ci;
(function(e) {
	e.NO_QUIRKS = "no-quirks", e.QUIRKS = "quirks", e.LIMITED_QUIRKS = "limited-quirks";
})(ci ||= {});
var R;
(function(e) {
	e.A = "a", e.ADDRESS = "address", e.ANNOTATION_XML = "annotation-xml", e.APPLET = "applet", e.AREA = "area", e.ARTICLE = "article", e.ASIDE = "aside", e.B = "b", e.BASE = "base", e.BASEFONT = "basefont", e.BGSOUND = "bgsound", e.BIG = "big", e.BLOCKQUOTE = "blockquote", e.BODY = "body", e.BR = "br", e.BUTTON = "button", e.CAPTION = "caption", e.CENTER = "center", e.CODE = "code", e.COL = "col", e.COLGROUP = "colgroup", e.DD = "dd", e.DESC = "desc", e.DETAILS = "details", e.DIALOG = "dialog", e.DIR = "dir", e.DIV = "div", e.DL = "dl", e.DT = "dt", e.EM = "em", e.EMBED = "embed", e.FIELDSET = "fieldset", e.FIGCAPTION = "figcaption", e.FIGURE = "figure", e.FONT = "font", e.FOOTER = "footer", e.FOREIGN_OBJECT = "foreignObject", e.FORM = "form", e.FRAME = "frame", e.FRAMESET = "frameset", e.H1 = "h1", e.H2 = "h2", e.H3 = "h3", e.H4 = "h4", e.H5 = "h5", e.H6 = "h6", e.HEAD = "head", e.HEADER = "header", e.HGROUP = "hgroup", e.HR = "hr", e.HTML = "html", e.I = "i", e.IMG = "img", e.IMAGE = "image", e.INPUT = "input", e.IFRAME = "iframe", e.KEYGEN = "keygen", e.LABEL = "label", e.LI = "li", e.LINK = "link", e.LISTING = "listing", e.MAIN = "main", e.MALIGNMARK = "malignmark", e.MARQUEE = "marquee", e.MATH = "math", e.MENU = "menu", e.META = "meta", e.MGLYPH = "mglyph", e.MI = "mi", e.MO = "mo", e.MN = "mn", e.MS = "ms", e.MTEXT = "mtext", e.NAV = "nav", e.NOBR = "nobr", e.NOFRAMES = "noframes", e.NOEMBED = "noembed", e.NOSCRIPT = "noscript", e.OBJECT = "object", e.OL = "ol", e.OPTGROUP = "optgroup", e.OPTION = "option", e.P = "p", e.PARAM = "param", e.PLAINTEXT = "plaintext", e.PRE = "pre", e.RB = "rb", e.RP = "rp", e.RT = "rt", e.RTC = "rtc", e.RUBY = "ruby", e.S = "s", e.SCRIPT = "script", e.SEARCH = "search", e.SECTION = "section", e.SELECT = "select", e.SOURCE = "source", e.SMALL = "small", e.SPAN = "span", e.STRIKE = "strike", e.STRONG = "strong", e.STYLE = "style", e.SUB = "sub", e.SUMMARY = "summary", e.SUP = "sup", e.TABLE = "table", e.TBODY = "tbody", e.TEMPLATE = "template", e.TEXTAREA = "textarea", e.TFOOT = "tfoot", e.TD = "td", e.TH = "th", e.THEAD = "thead", e.TITLE = "title", e.TR = "tr", e.TRACK = "track", e.TT = "tt", e.U = "u", e.UL = "ul", e.SVG = "svg", e.VAR = "var", e.WBR = "wbr", e.XMP = "xmp";
})(R ||= {});
var z;
(function(e) {
	e[e.UNKNOWN = 0] = "UNKNOWN", e[e.A = 1] = "A", e[e.ADDRESS = 2] = "ADDRESS", e[e.ANNOTATION_XML = 3] = "ANNOTATION_XML", e[e.APPLET = 4] = "APPLET", e[e.AREA = 5] = "AREA", e[e.ARTICLE = 6] = "ARTICLE", e[e.ASIDE = 7] = "ASIDE", e[e.B = 8] = "B", e[e.BASE = 9] = "BASE", e[e.BASEFONT = 10] = "BASEFONT", e[e.BGSOUND = 11] = "BGSOUND", e[e.BIG = 12] = "BIG", e[e.BLOCKQUOTE = 13] = "BLOCKQUOTE", e[e.BODY = 14] = "BODY", e[e.BR = 15] = "BR", e[e.BUTTON = 16] = "BUTTON", e[e.CAPTION = 17] = "CAPTION", e[e.CENTER = 18] = "CENTER", e[e.CODE = 19] = "CODE", e[e.COL = 20] = "COL", e[e.COLGROUP = 21] = "COLGROUP", e[e.DD = 22] = "DD", e[e.DESC = 23] = "DESC", e[e.DETAILS = 24] = "DETAILS", e[e.DIALOG = 25] = "DIALOG", e[e.DIR = 26] = "DIR", e[e.DIV = 27] = "DIV", e[e.DL = 28] = "DL", e[e.DT = 29] = "DT", e[e.EM = 30] = "EM", e[e.EMBED = 31] = "EMBED", e[e.FIELDSET = 32] = "FIELDSET", e[e.FIGCAPTION = 33] = "FIGCAPTION", e[e.FIGURE = 34] = "FIGURE", e[e.FONT = 35] = "FONT", e[e.FOOTER = 36] = "FOOTER", e[e.FOREIGN_OBJECT = 37] = "FOREIGN_OBJECT", e[e.FORM = 38] = "FORM", e[e.FRAME = 39] = "FRAME", e[e.FRAMESET = 40] = "FRAMESET", e[e.H1 = 41] = "H1", e[e.H2 = 42] = "H2", e[e.H3 = 43] = "H3", e[e.H4 = 44] = "H4", e[e.H5 = 45] = "H5", e[e.H6 = 46] = "H6", e[e.HEAD = 47] = "HEAD", e[e.HEADER = 48] = "HEADER", e[e.HGROUP = 49] = "HGROUP", e[e.HR = 50] = "HR", e[e.HTML = 51] = "HTML", e[e.I = 52] = "I", e[e.IMG = 53] = "IMG", e[e.IMAGE = 54] = "IMAGE", e[e.INPUT = 55] = "INPUT", e[e.IFRAME = 56] = "IFRAME", e[e.KEYGEN = 57] = "KEYGEN", e[e.LABEL = 58] = "LABEL", e[e.LI = 59] = "LI", e[e.LINK = 60] = "LINK", e[e.LISTING = 61] = "LISTING", e[e.MAIN = 62] = "MAIN", e[e.MALIGNMARK = 63] = "MALIGNMARK", e[e.MARQUEE = 64] = "MARQUEE", e[e.MATH = 65] = "MATH", e[e.MENU = 66] = "MENU", e[e.META = 67] = "META", e[e.MGLYPH = 68] = "MGLYPH", e[e.MI = 69] = "MI", e[e.MO = 70] = "MO", e[e.MN = 71] = "MN", e[e.MS = 72] = "MS", e[e.MTEXT = 73] = "MTEXT", e[e.NAV = 74] = "NAV", e[e.NOBR = 75] = "NOBR", e[e.NOFRAMES = 76] = "NOFRAMES", e[e.NOEMBED = 77] = "NOEMBED", e[e.NOSCRIPT = 78] = "NOSCRIPT", e[e.OBJECT = 79] = "OBJECT", e[e.OL = 80] = "OL", e[e.OPTGROUP = 81] = "OPTGROUP", e[e.OPTION = 82] = "OPTION", e[e.P = 83] = "P", e[e.PARAM = 84] = "PARAM", e[e.PLAINTEXT = 85] = "PLAINTEXT", e[e.PRE = 86] = "PRE", e[e.RB = 87] = "RB", e[e.RP = 88] = "RP", e[e.RT = 89] = "RT", e[e.RTC = 90] = "RTC", e[e.RUBY = 91] = "RUBY", e[e.S = 92] = "S", e[e.SCRIPT = 93] = "SCRIPT", e[e.SEARCH = 94] = "SEARCH", e[e.SECTION = 95] = "SECTION", e[e.SELECT = 96] = "SELECT", e[e.SOURCE = 97] = "SOURCE", e[e.SMALL = 98] = "SMALL", e[e.SPAN = 99] = "SPAN", e[e.STRIKE = 100] = "STRIKE", e[e.STRONG = 101] = "STRONG", e[e.STYLE = 102] = "STYLE", e[e.SUB = 103] = "SUB", e[e.SUMMARY = 104] = "SUMMARY", e[e.SUP = 105] = "SUP", e[e.TABLE = 106] = "TABLE", e[e.TBODY = 107] = "TBODY", e[e.TEMPLATE = 108] = "TEMPLATE", e[e.TEXTAREA = 109] = "TEXTAREA", e[e.TFOOT = 110] = "TFOOT", e[e.TD = 111] = "TD", e[e.TH = 112] = "TH", e[e.THEAD = 113] = "THEAD", e[e.TITLE = 114] = "TITLE", e[e.TR = 115] = "TR", e[e.TRACK = 116] = "TRACK", e[e.TT = 117] = "TT", e[e.U = 118] = "U", e[e.UL = 119] = "UL", e[e.SVG = 120] = "SVG", e[e.VAR = 121] = "VAR", e[e.WBR = 122] = "WBR", e[e.XMP = 123] = "XMP";
})(z ||= {});
var li = /* @__PURE__ */ new Map([
	[R.A, z.A],
	[R.ADDRESS, z.ADDRESS],
	[R.ANNOTATION_XML, z.ANNOTATION_XML],
	[R.APPLET, z.APPLET],
	[R.AREA, z.AREA],
	[R.ARTICLE, z.ARTICLE],
	[R.ASIDE, z.ASIDE],
	[R.B, z.B],
	[R.BASE, z.BASE],
	[R.BASEFONT, z.BASEFONT],
	[R.BGSOUND, z.BGSOUND],
	[R.BIG, z.BIG],
	[R.BLOCKQUOTE, z.BLOCKQUOTE],
	[R.BODY, z.BODY],
	[R.BR, z.BR],
	[R.BUTTON, z.BUTTON],
	[R.CAPTION, z.CAPTION],
	[R.CENTER, z.CENTER],
	[R.CODE, z.CODE],
	[R.COL, z.COL],
	[R.COLGROUP, z.COLGROUP],
	[R.DD, z.DD],
	[R.DESC, z.DESC],
	[R.DETAILS, z.DETAILS],
	[R.DIALOG, z.DIALOG],
	[R.DIR, z.DIR],
	[R.DIV, z.DIV],
	[R.DL, z.DL],
	[R.DT, z.DT],
	[R.EM, z.EM],
	[R.EMBED, z.EMBED],
	[R.FIELDSET, z.FIELDSET],
	[R.FIGCAPTION, z.FIGCAPTION],
	[R.FIGURE, z.FIGURE],
	[R.FONT, z.FONT],
	[R.FOOTER, z.FOOTER],
	[R.FOREIGN_OBJECT, z.FOREIGN_OBJECT],
	[R.FORM, z.FORM],
	[R.FRAME, z.FRAME],
	[R.FRAMESET, z.FRAMESET],
	[R.H1, z.H1],
	[R.H2, z.H2],
	[R.H3, z.H3],
	[R.H4, z.H4],
	[R.H5, z.H5],
	[R.H6, z.H6],
	[R.HEAD, z.HEAD],
	[R.HEADER, z.HEADER],
	[R.HGROUP, z.HGROUP],
	[R.HR, z.HR],
	[R.HTML, z.HTML],
	[R.I, z.I],
	[R.IMG, z.IMG],
	[R.IMAGE, z.IMAGE],
	[R.INPUT, z.INPUT],
	[R.IFRAME, z.IFRAME],
	[R.KEYGEN, z.KEYGEN],
	[R.LABEL, z.LABEL],
	[R.LI, z.LI],
	[R.LINK, z.LINK],
	[R.LISTING, z.LISTING],
	[R.MAIN, z.MAIN],
	[R.MALIGNMARK, z.MALIGNMARK],
	[R.MARQUEE, z.MARQUEE],
	[R.MATH, z.MATH],
	[R.MENU, z.MENU],
	[R.META, z.META],
	[R.MGLYPH, z.MGLYPH],
	[R.MI, z.MI],
	[R.MO, z.MO],
	[R.MN, z.MN],
	[R.MS, z.MS],
	[R.MTEXT, z.MTEXT],
	[R.NAV, z.NAV],
	[R.NOBR, z.NOBR],
	[R.NOFRAMES, z.NOFRAMES],
	[R.NOEMBED, z.NOEMBED],
	[R.NOSCRIPT, z.NOSCRIPT],
	[R.OBJECT, z.OBJECT],
	[R.OL, z.OL],
	[R.OPTGROUP, z.OPTGROUP],
	[R.OPTION, z.OPTION],
	[R.P, z.P],
	[R.PARAM, z.PARAM],
	[R.PLAINTEXT, z.PLAINTEXT],
	[R.PRE, z.PRE],
	[R.RB, z.RB],
	[R.RP, z.RP],
	[R.RT, z.RT],
	[R.RTC, z.RTC],
	[R.RUBY, z.RUBY],
	[R.S, z.S],
	[R.SCRIPT, z.SCRIPT],
	[R.SEARCH, z.SEARCH],
	[R.SECTION, z.SECTION],
	[R.SELECT, z.SELECT],
	[R.SOURCE, z.SOURCE],
	[R.SMALL, z.SMALL],
	[R.SPAN, z.SPAN],
	[R.STRIKE, z.STRIKE],
	[R.STRONG, z.STRONG],
	[R.STYLE, z.STYLE],
	[R.SUB, z.SUB],
	[R.SUMMARY, z.SUMMARY],
	[R.SUP, z.SUP],
	[R.TABLE, z.TABLE],
	[R.TBODY, z.TBODY],
	[R.TEMPLATE, z.TEMPLATE],
	[R.TEXTAREA, z.TEXTAREA],
	[R.TFOOT, z.TFOOT],
	[R.TD, z.TD],
	[R.TH, z.TH],
	[R.THEAD, z.THEAD],
	[R.TITLE, z.TITLE],
	[R.TR, z.TR],
	[R.TRACK, z.TRACK],
	[R.TT, z.TT],
	[R.U, z.U],
	[R.UL, z.UL],
	[R.SVG, z.SVG],
	[R.VAR, z.VAR],
	[R.WBR, z.WBR],
	[R.XMP, z.XMP]
]);
function ui(e) {
	return li.get(e) ?? z.UNKNOWN;
}
var B = z, di = {
	[L.HTML]: /* @__PURE__ */ new Set([
		B.ADDRESS,
		B.APPLET,
		B.AREA,
		B.ARTICLE,
		B.ASIDE,
		B.BASE,
		B.BASEFONT,
		B.BGSOUND,
		B.BLOCKQUOTE,
		B.BODY,
		B.BR,
		B.BUTTON,
		B.CAPTION,
		B.CENTER,
		B.COL,
		B.COLGROUP,
		B.DD,
		B.DETAILS,
		B.DIR,
		B.DIV,
		B.DL,
		B.DT,
		B.EMBED,
		B.FIELDSET,
		B.FIGCAPTION,
		B.FIGURE,
		B.FOOTER,
		B.FORM,
		B.FRAME,
		B.FRAMESET,
		B.H1,
		B.H2,
		B.H3,
		B.H4,
		B.H5,
		B.H6,
		B.HEAD,
		B.HEADER,
		B.HGROUP,
		B.HR,
		B.HTML,
		B.IFRAME,
		B.IMG,
		B.INPUT,
		B.LI,
		B.LINK,
		B.LISTING,
		B.MAIN,
		B.MARQUEE,
		B.MENU,
		B.META,
		B.NAV,
		B.NOEMBED,
		B.NOFRAMES,
		B.NOSCRIPT,
		B.OBJECT,
		B.OL,
		B.P,
		B.PARAM,
		B.PLAINTEXT,
		B.PRE,
		B.SCRIPT,
		B.SECTION,
		B.SELECT,
		B.SOURCE,
		B.STYLE,
		B.SUMMARY,
		B.TABLE,
		B.TBODY,
		B.TD,
		B.TEMPLATE,
		B.TEXTAREA,
		B.TFOOT,
		B.TH,
		B.THEAD,
		B.TITLE,
		B.TR,
		B.TRACK,
		B.UL,
		B.WBR,
		B.XMP
	]),
	[L.MATHML]: /* @__PURE__ */ new Set([
		B.MI,
		B.MO,
		B.MN,
		B.MS,
		B.MTEXT,
		B.ANNOTATION_XML
	]),
	[L.SVG]: /* @__PURE__ */ new Set([
		B.TITLE,
		B.FOREIGN_OBJECT,
		B.DESC
	]),
	[L.XLINK]: /* @__PURE__ */ new Set(),
	[L.XML]: /* @__PURE__ */ new Set(),
	[L.XMLNS]: /* @__PURE__ */ new Set()
}, fi = /* @__PURE__ */ new Set([
	B.H1,
	B.H2,
	B.H3,
	B.H4,
	B.H5,
	B.H6
]);
R.STYLE, R.SCRIPT, R.XMP, R.IFRAME, R.NOEMBED, R.NOFRAMES, R.PLAINTEXT;
// node_modules/hast-util-raw/node_modules/parse5/dist/tokenizer/index.js
var V;
(function(e) {
	e[e.DATA = 0] = "DATA", e[e.RCDATA = 1] = "RCDATA", e[e.RAWTEXT = 2] = "RAWTEXT", e[e.SCRIPT_DATA = 3] = "SCRIPT_DATA", e[e.PLAINTEXT = 4] = "PLAINTEXT", e[e.TAG_OPEN = 5] = "TAG_OPEN", e[e.END_TAG_OPEN = 6] = "END_TAG_OPEN", e[e.TAG_NAME = 7] = "TAG_NAME", e[e.RCDATA_LESS_THAN_SIGN = 8] = "RCDATA_LESS_THAN_SIGN", e[e.RCDATA_END_TAG_OPEN = 9] = "RCDATA_END_TAG_OPEN", e[e.RCDATA_END_TAG_NAME = 10] = "RCDATA_END_TAG_NAME", e[e.RAWTEXT_LESS_THAN_SIGN = 11] = "RAWTEXT_LESS_THAN_SIGN", e[e.RAWTEXT_END_TAG_OPEN = 12] = "RAWTEXT_END_TAG_OPEN", e[e.RAWTEXT_END_TAG_NAME = 13] = "RAWTEXT_END_TAG_NAME", e[e.SCRIPT_DATA_LESS_THAN_SIGN = 14] = "SCRIPT_DATA_LESS_THAN_SIGN", e[e.SCRIPT_DATA_END_TAG_OPEN = 15] = "SCRIPT_DATA_END_TAG_OPEN", e[e.SCRIPT_DATA_END_TAG_NAME = 16] = "SCRIPT_DATA_END_TAG_NAME", e[e.SCRIPT_DATA_ESCAPE_START = 17] = "SCRIPT_DATA_ESCAPE_START", e[e.SCRIPT_DATA_ESCAPE_START_DASH = 18] = "SCRIPT_DATA_ESCAPE_START_DASH", e[e.SCRIPT_DATA_ESCAPED = 19] = "SCRIPT_DATA_ESCAPED", e[e.SCRIPT_DATA_ESCAPED_DASH = 20] = "SCRIPT_DATA_ESCAPED_DASH", e[e.SCRIPT_DATA_ESCAPED_DASH_DASH = 21] = "SCRIPT_DATA_ESCAPED_DASH_DASH", e[e.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN = 22] = "SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN", e[e.SCRIPT_DATA_ESCAPED_END_TAG_OPEN = 23] = "SCRIPT_DATA_ESCAPED_END_TAG_OPEN", e[e.SCRIPT_DATA_ESCAPED_END_TAG_NAME = 24] = "SCRIPT_DATA_ESCAPED_END_TAG_NAME", e[e.SCRIPT_DATA_DOUBLE_ESCAPE_START = 25] = "SCRIPT_DATA_DOUBLE_ESCAPE_START", e[e.SCRIPT_DATA_DOUBLE_ESCAPED = 26] = "SCRIPT_DATA_DOUBLE_ESCAPED", e[e.SCRIPT_DATA_DOUBLE_ESCAPED_DASH = 27] = "SCRIPT_DATA_DOUBLE_ESCAPED_DASH", e[e.SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH = 28] = "SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH", e[e.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN = 29] = "SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN", e[e.SCRIPT_DATA_DOUBLE_ESCAPE_END = 30] = "SCRIPT_DATA_DOUBLE_ESCAPE_END", e[e.BEFORE_ATTRIBUTE_NAME = 31] = "BEFORE_ATTRIBUTE_NAME", e[e.ATTRIBUTE_NAME = 32] = "ATTRIBUTE_NAME", e[e.AFTER_ATTRIBUTE_NAME = 33] = "AFTER_ATTRIBUTE_NAME", e[e.BEFORE_ATTRIBUTE_VALUE = 34] = "BEFORE_ATTRIBUTE_VALUE", e[e.ATTRIBUTE_VALUE_DOUBLE_QUOTED = 35] = "ATTRIBUTE_VALUE_DOUBLE_QUOTED", e[e.ATTRIBUTE_VALUE_SINGLE_QUOTED = 36] = "ATTRIBUTE_VALUE_SINGLE_QUOTED", e[e.ATTRIBUTE_VALUE_UNQUOTED = 37] = "ATTRIBUTE_VALUE_UNQUOTED", e[e.AFTER_ATTRIBUTE_VALUE_QUOTED = 38] = "AFTER_ATTRIBUTE_VALUE_QUOTED", e[e.SELF_CLOSING_START_TAG = 39] = "SELF_CLOSING_START_TAG", e[e.BOGUS_COMMENT = 40] = "BOGUS_COMMENT", e[e.MARKUP_DECLARATION_OPEN = 41] = "MARKUP_DECLARATION_OPEN", e[e.COMMENT_START = 42] = "COMMENT_START", e[e.COMMENT_START_DASH = 43] = "COMMENT_START_DASH", e[e.COMMENT = 44] = "COMMENT", e[e.COMMENT_LESS_THAN_SIGN = 45] = "COMMENT_LESS_THAN_SIGN", e[e.COMMENT_LESS_THAN_SIGN_BANG = 46] = "COMMENT_LESS_THAN_SIGN_BANG", e[e.COMMENT_LESS_THAN_SIGN_BANG_DASH = 47] = "COMMENT_LESS_THAN_SIGN_BANG_DASH", e[e.COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH = 48] = "COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH", e[e.COMMENT_END_DASH = 49] = "COMMENT_END_DASH", e[e.COMMENT_END = 50] = "COMMENT_END", e[e.COMMENT_END_BANG = 51] = "COMMENT_END_BANG", e[e.DOCTYPE = 52] = "DOCTYPE", e[e.BEFORE_DOCTYPE_NAME = 53] = "BEFORE_DOCTYPE_NAME", e[e.DOCTYPE_NAME = 54] = "DOCTYPE_NAME", e[e.AFTER_DOCTYPE_NAME = 55] = "AFTER_DOCTYPE_NAME", e[e.AFTER_DOCTYPE_PUBLIC_KEYWORD = 56] = "AFTER_DOCTYPE_PUBLIC_KEYWORD", e[e.BEFORE_DOCTYPE_PUBLIC_IDENTIFIER = 57] = "BEFORE_DOCTYPE_PUBLIC_IDENTIFIER", e[e.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED = 58] = "DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED", e[e.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED = 59] = "DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED", e[e.AFTER_DOCTYPE_PUBLIC_IDENTIFIER = 60] = "AFTER_DOCTYPE_PUBLIC_IDENTIFIER", e[e.BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS = 61] = "BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS", e[e.AFTER_DOCTYPE_SYSTEM_KEYWORD = 62] = "AFTER_DOCTYPE_SYSTEM_KEYWORD", e[e.BEFORE_DOCTYPE_SYSTEM_IDENTIFIER = 63] = "BEFORE_DOCTYPE_SYSTEM_IDENTIFIER", e[e.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED = 64] = "DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED", e[e.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED = 65] = "DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED", e[e.AFTER_DOCTYPE_SYSTEM_IDENTIFIER = 66] = "AFTER_DOCTYPE_SYSTEM_IDENTIFIER", e[e.BOGUS_DOCTYPE = 67] = "BOGUS_DOCTYPE", e[e.CDATA_SECTION = 68] = "CDATA_SECTION", e[e.CDATA_SECTION_BRACKET = 69] = "CDATA_SECTION_BRACKET", e[e.CDATA_SECTION_END = 70] = "CDATA_SECTION_END", e[e.CHARACTER_REFERENCE = 71] = "CHARACTER_REFERENCE", e[e.AMBIGUOUS_AMPERSAND = 72] = "AMBIGUOUS_AMPERSAND";
})(V ||= {});
var pi = {
	DATA: V.DATA,
	RCDATA: V.RCDATA,
	RAWTEXT: V.RAWTEXT,
	SCRIPT_DATA: V.SCRIPT_DATA,
	PLAINTEXT: V.PLAINTEXT,
	CDATA_SECTION: V.CDATA_SECTION
};
function mi(e) {
	return e >= P.DIGIT_0 && e <= P.DIGIT_9;
}
function hi(e) {
	return e >= P.LATIN_CAPITAL_A && e <= P.LATIN_CAPITAL_Z;
}
function gi(e) {
	return e >= P.LATIN_SMALL_A && e <= P.LATIN_SMALL_Z;
}
function _i(e) {
	return gi(e) || hi(e);
}
function vi(e) {
	return _i(e) || mi(e);
}
function yi(e) {
	return e + 32;
}
function bi(e) {
	return e === P.SPACE || e === P.LINE_FEED || e === P.TABULATION || e === P.FORM_FEED;
}
function xi(e) {
	return bi(e) || e === P.SOLIDUS || e === P.GREATER_THAN_SIGN;
}
function Si(e) {
	return e === P.NULL ? F.nullCharacterReference : e > 1114111 ? F.characterReferenceOutsideUnicodeRange : zr(e) ? F.surrogateCharacterReference : Ur(e) ? F.noncharacterCharacterReference : Hr(e) || e === P.CARRIAGE_RETURN ? F.controlCharacterReference : null;
}
var Ci = class {
	constructor(e, t) {
		this.options = e, this.handler = t, this.paused = !1, this.inLoop = !1, this.inForeignNode = !1, this.lastStartTagName = "", this.active = !1, this.state = V.DATA, this.returnState = V.DATA, this.entityStartPos = 0, this.consumedAfterSnapshot = -1, this.currentCharacterToken = null, this.currentToken = null, this.currentAttr = {
			name: "",
			value: ""
		}, this.preprocessor = new Gr(t), this.currentLocation = this.getCurrentLocation(-1), this.entityDecoder = new ai(qr, (e, t) => {
			this.preprocessor.pos = this.entityStartPos + t - 1, this._flushCodePointConsumedAsCharacterReference(e);
		}, t.onParseError ? {
			missingSemicolonAfterCharacterReference: () => {
				this._err(F.missingSemicolonAfterCharacterReference, 1);
			},
			absenceOfDigitsInNumericCharacterReference: (e) => {
				this._err(F.absenceOfDigitsInNumericCharacterReference, this.entityStartPos - this.preprocessor.pos + e);
			},
			validateNumericCharacterReference: (e) => {
				let t = Si(e);
				t && this._err(t, 1);
			}
		} : void 0);
	}
	_err(e, t = 0) {
		var n, r;
		(r = (n = this.handler).onParseError) == null || r.call(n, this.preprocessor.getError(e, t));
	}
	getCurrentLocation(e) {
		return this.options.sourceCodeLocationInfo ? {
			startLine: this.preprocessor.line,
			startCol: this.preprocessor.col - e,
			startOffset: this.preprocessor.offset - e,
			endLine: -1,
			endCol: -1,
			endOffset: -1
		} : null;
	}
	_runParsingLoop() {
		if (!this.inLoop) {
			for (this.inLoop = !0; this.active && !this.paused;) {
				this.consumedAfterSnapshot = 0;
				let e = this._consume();
				this._ensureHibernation() || this._callState(e);
			}
			this.inLoop = !1;
		}
	}
	pause() {
		this.paused = !0;
	}
	resume(e) {
		if (!this.paused) throw Error("Parser was already resumed");
		this.paused = !1, this.inLoop || (this._runParsingLoop(), this.paused || e?.());
	}
	write(e, t, n) {
		this.active = !0, this.preprocessor.write(e, t), this._runParsingLoop(), this.paused || n?.();
	}
	insertHtmlAtCurrentPos(e) {
		this.active = !0, this.preprocessor.insertHtmlAtCurrentPos(e), this._runParsingLoop();
	}
	_ensureHibernation() {
		return this.preprocessor.endOfChunkHit ? (this.preprocessor.retreat(this.consumedAfterSnapshot), this.consumedAfterSnapshot = 0, this.active = !1, !0) : !1;
	}
	_consume() {
		return this.consumedAfterSnapshot++, this.preprocessor.advance();
	}
	_advanceBy(e) {
		this.consumedAfterSnapshot += e;
		for (let t = 0; t < e; t++) this.preprocessor.advance();
	}
	_consumeSequenceIfMatch(e, t) {
		return this.preprocessor.startsWith(e, t) ? (this._advanceBy(e.length - 1), !0) : !1;
	}
	_createStartTagToken() {
		this.currentToken = {
			type: I.START_TAG,
			tagName: "",
			tagID: z.UNKNOWN,
			selfClosing: !1,
			ackSelfClosing: !1,
			attrs: [],
			location: this.getCurrentLocation(1)
		};
	}
	_createEndTagToken() {
		this.currentToken = {
			type: I.END_TAG,
			tagName: "",
			tagID: z.UNKNOWN,
			selfClosing: !1,
			ackSelfClosing: !1,
			attrs: [],
			location: this.getCurrentLocation(2)
		};
	}
	_createCommentToken(e) {
		this.currentToken = {
			type: I.COMMENT,
			data: "",
			location: this.getCurrentLocation(e)
		};
	}
	_createDoctypeToken(e) {
		this.currentToken = {
			type: I.DOCTYPE,
			name: e,
			forceQuirks: !1,
			publicId: null,
			systemId: null,
			location: this.currentLocation
		};
	}
	_createCharacterToken(e, t) {
		this.currentCharacterToken = {
			type: e,
			chars: t,
			location: this.currentLocation
		};
	}
	_createAttr(e) {
		this.currentAttr = {
			name: e,
			value: ""
		}, this.currentLocation = this.getCurrentLocation(0);
	}
	_leaveAttrName() {
		var e;
		let t = this.currentToken;
		if (Kr(t, this.currentAttr.name) === null) {
			if (t.attrs.push(this.currentAttr), t.location && this.currentLocation) {
				let n = (e = t.location).attrs ?? (e.attrs = Object.create(null));
				n[this.currentAttr.name] = this.currentLocation, this._leaveAttrValue();
			}
		} else this._err(F.duplicateAttribute);
	}
	_leaveAttrValue() {
		this.currentLocation && (this.currentLocation.endLine = this.preprocessor.line, this.currentLocation.endCol = this.preprocessor.col, this.currentLocation.endOffset = this.preprocessor.offset);
	}
	prepareToken(e) {
		this._emitCurrentCharacterToken(e.location), this.currentToken = null, e.location && (e.location.endLine = this.preprocessor.line, e.location.endCol = this.preprocessor.col + 1, e.location.endOffset = this.preprocessor.offset + 1), this.currentLocation = this.getCurrentLocation(-1);
	}
	emitCurrentTagToken() {
		let e = this.currentToken;
		this.prepareToken(e), e.tagID = ui(e.tagName), e.type === I.START_TAG ? (this.lastStartTagName = e.tagName, this.handler.onStartTag(e)) : (e.attrs.length > 0 && this._err(F.endTagWithAttributes), e.selfClosing && this._err(F.endTagWithTrailingSolidus), this.handler.onEndTag(e)), this.preprocessor.dropParsedChunk();
	}
	emitCurrentComment(e) {
		this.prepareToken(e), this.handler.onComment(e), this.preprocessor.dropParsedChunk();
	}
	emitCurrentDoctype(e) {
		this.prepareToken(e), this.handler.onDoctype(e), this.preprocessor.dropParsedChunk();
	}
	_emitCurrentCharacterToken(e) {
		if (this.currentCharacterToken) {
			switch (e && this.currentCharacterToken.location && (this.currentCharacterToken.location.endLine = e.startLine, this.currentCharacterToken.location.endCol = e.startCol, this.currentCharacterToken.location.endOffset = e.startOffset), this.currentCharacterToken.type) {
				case I.CHARACTER:
					this.handler.onCharacter(this.currentCharacterToken);
					break;
				case I.NULL_CHARACTER:
					this.handler.onNullCharacter(this.currentCharacterToken);
					break;
				case I.WHITESPACE_CHARACTER: this.handler.onWhitespaceCharacter(this.currentCharacterToken);
			}
			this.currentCharacterToken = null;
		}
	}
	_emitEOFToken() {
		let e = this.getCurrentLocation(0);
		e && (e.endLine = e.startLine, e.endCol = e.startCol, e.endOffset = e.startOffset), this._emitCurrentCharacterToken(e), this.handler.onEof({
			type: I.EOF,
			location: e
		}), this.active = !1;
	}
	_appendCharToCurrentCharacterToken(e, t) {
		if (this.currentCharacterToken) {
			if (this.currentCharacterToken.type === e) {
				this.currentCharacterToken.chars += t;
				return;
			}
			this.currentLocation = this.getCurrentLocation(0), this._emitCurrentCharacterToken(this.currentLocation), this.preprocessor.dropParsedChunk();
		}
		this._createCharacterToken(e, t);
	}
	_emitCodePoint(e) {
		let t = bi(e) ? I.WHITESPACE_CHARACTER : e === P.NULL ? I.NULL_CHARACTER : I.CHARACTER;
		this._appendCharToCurrentCharacterToken(t, String.fromCodePoint(e));
	}
	_emitChars(e) {
		this._appendCharToCurrentCharacterToken(I.CHARACTER, e);
	}
	_startCharacterReference() {
		this.returnState = this.state, this.state = V.CHARACTER_REFERENCE, this.entityStartPos = this.preprocessor.pos, this.entityDecoder.startEntity(this._isCharacterReferenceInAttribute() ? ii.Attribute : ii.Legacy);
	}
	_isCharacterReferenceInAttribute() {
		return this.returnState === V.ATTRIBUTE_VALUE_DOUBLE_QUOTED || this.returnState === V.ATTRIBUTE_VALUE_SINGLE_QUOTED || this.returnState === V.ATTRIBUTE_VALUE_UNQUOTED;
	}
	_flushCodePointConsumedAsCharacterReference(e) {
		this._isCharacterReferenceInAttribute() ? this.currentAttr.value += String.fromCodePoint(e) : this._emitCodePoint(e);
	}
	_callState(e) {
		switch (this.state) {
			case V.DATA:
				this._stateData(e);
				break;
			case V.RCDATA:
				this._stateRcdata(e);
				break;
			case V.RAWTEXT:
				this._stateRawtext(e);
				break;
			case V.SCRIPT_DATA:
				this._stateScriptData(e);
				break;
			case V.PLAINTEXT:
				this._statePlaintext(e);
				break;
			case V.TAG_OPEN:
				this._stateTagOpen(e);
				break;
			case V.END_TAG_OPEN:
				this._stateEndTagOpen(e);
				break;
			case V.TAG_NAME:
				this._stateTagName(e);
				break;
			case V.RCDATA_LESS_THAN_SIGN:
				this._stateRcdataLessThanSign(e);
				break;
			case V.RCDATA_END_TAG_OPEN:
				this._stateRcdataEndTagOpen(e);
				break;
			case V.RCDATA_END_TAG_NAME:
				this._stateRcdataEndTagName(e);
				break;
			case V.RAWTEXT_LESS_THAN_SIGN:
				this._stateRawtextLessThanSign(e);
				break;
			case V.RAWTEXT_END_TAG_OPEN:
				this._stateRawtextEndTagOpen(e);
				break;
			case V.RAWTEXT_END_TAG_NAME:
				this._stateRawtextEndTagName(e);
				break;
			case V.SCRIPT_DATA_LESS_THAN_SIGN:
				this._stateScriptDataLessThanSign(e);
				break;
			case V.SCRIPT_DATA_END_TAG_OPEN:
				this._stateScriptDataEndTagOpen(e);
				break;
			case V.SCRIPT_DATA_END_TAG_NAME:
				this._stateScriptDataEndTagName(e);
				break;
			case V.SCRIPT_DATA_ESCAPE_START:
				this._stateScriptDataEscapeStart(e);
				break;
			case V.SCRIPT_DATA_ESCAPE_START_DASH:
				this._stateScriptDataEscapeStartDash(e);
				break;
			case V.SCRIPT_DATA_ESCAPED:
				this._stateScriptDataEscaped(e);
				break;
			case V.SCRIPT_DATA_ESCAPED_DASH:
				this._stateScriptDataEscapedDash(e);
				break;
			case V.SCRIPT_DATA_ESCAPED_DASH_DASH:
				this._stateScriptDataEscapedDashDash(e);
				break;
			case V.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN:
				this._stateScriptDataEscapedLessThanSign(e);
				break;
			case V.SCRIPT_DATA_ESCAPED_END_TAG_OPEN:
				this._stateScriptDataEscapedEndTagOpen(e);
				break;
			case V.SCRIPT_DATA_ESCAPED_END_TAG_NAME:
				this._stateScriptDataEscapedEndTagName(e);
				break;
			case V.SCRIPT_DATA_DOUBLE_ESCAPE_START:
				this._stateScriptDataDoubleEscapeStart(e);
				break;
			case V.SCRIPT_DATA_DOUBLE_ESCAPED:
				this._stateScriptDataDoubleEscaped(e);
				break;
			case V.SCRIPT_DATA_DOUBLE_ESCAPED_DASH:
				this._stateScriptDataDoubleEscapedDash(e);
				break;
			case V.SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH:
				this._stateScriptDataDoubleEscapedDashDash(e);
				break;
			case V.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN:
				this._stateScriptDataDoubleEscapedLessThanSign(e);
				break;
			case V.SCRIPT_DATA_DOUBLE_ESCAPE_END:
				this._stateScriptDataDoubleEscapeEnd(e);
				break;
			case V.BEFORE_ATTRIBUTE_NAME:
				this._stateBeforeAttributeName(e);
				break;
			case V.ATTRIBUTE_NAME:
				this._stateAttributeName(e);
				break;
			case V.AFTER_ATTRIBUTE_NAME:
				this._stateAfterAttributeName(e);
				break;
			case V.BEFORE_ATTRIBUTE_VALUE:
				this._stateBeforeAttributeValue(e);
				break;
			case V.ATTRIBUTE_VALUE_DOUBLE_QUOTED:
				this._stateAttributeValueDoubleQuoted(e);
				break;
			case V.ATTRIBUTE_VALUE_SINGLE_QUOTED:
				this._stateAttributeValueSingleQuoted(e);
				break;
			case V.ATTRIBUTE_VALUE_UNQUOTED:
				this._stateAttributeValueUnquoted(e);
				break;
			case V.AFTER_ATTRIBUTE_VALUE_QUOTED:
				this._stateAfterAttributeValueQuoted(e);
				break;
			case V.SELF_CLOSING_START_TAG:
				this._stateSelfClosingStartTag(e);
				break;
			case V.BOGUS_COMMENT:
				this._stateBogusComment(e);
				break;
			case V.MARKUP_DECLARATION_OPEN:
				this._stateMarkupDeclarationOpen(e);
				break;
			case V.COMMENT_START:
				this._stateCommentStart(e);
				break;
			case V.COMMENT_START_DASH:
				this._stateCommentStartDash(e);
				break;
			case V.COMMENT:
				this._stateComment(e);
				break;
			case V.COMMENT_LESS_THAN_SIGN:
				this._stateCommentLessThanSign(e);
				break;
			case V.COMMENT_LESS_THAN_SIGN_BANG:
				this._stateCommentLessThanSignBang(e);
				break;
			case V.COMMENT_LESS_THAN_SIGN_BANG_DASH:
				this._stateCommentLessThanSignBangDash(e);
				break;
			case V.COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH:
				this._stateCommentLessThanSignBangDashDash(e);
				break;
			case V.COMMENT_END_DASH:
				this._stateCommentEndDash(e);
				break;
			case V.COMMENT_END:
				this._stateCommentEnd(e);
				break;
			case V.COMMENT_END_BANG:
				this._stateCommentEndBang(e);
				break;
			case V.DOCTYPE:
				this._stateDoctype(e);
				break;
			case V.BEFORE_DOCTYPE_NAME:
				this._stateBeforeDoctypeName(e);
				break;
			case V.DOCTYPE_NAME:
				this._stateDoctypeName(e);
				break;
			case V.AFTER_DOCTYPE_NAME:
				this._stateAfterDoctypeName(e);
				break;
			case V.AFTER_DOCTYPE_PUBLIC_KEYWORD:
				this._stateAfterDoctypePublicKeyword(e);
				break;
			case V.BEFORE_DOCTYPE_PUBLIC_IDENTIFIER:
				this._stateBeforeDoctypePublicIdentifier(e);
				break;
			case V.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED:
				this._stateDoctypePublicIdentifierDoubleQuoted(e);
				break;
			case V.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED:
				this._stateDoctypePublicIdentifierSingleQuoted(e);
				break;
			case V.AFTER_DOCTYPE_PUBLIC_IDENTIFIER:
				this._stateAfterDoctypePublicIdentifier(e);
				break;
			case V.BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS:
				this._stateBetweenDoctypePublicAndSystemIdentifiers(e);
				break;
			case V.AFTER_DOCTYPE_SYSTEM_KEYWORD:
				this._stateAfterDoctypeSystemKeyword(e);
				break;
			case V.BEFORE_DOCTYPE_SYSTEM_IDENTIFIER:
				this._stateBeforeDoctypeSystemIdentifier(e);
				break;
			case V.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED:
				this._stateDoctypeSystemIdentifierDoubleQuoted(e);
				break;
			case V.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED:
				this._stateDoctypeSystemIdentifierSingleQuoted(e);
				break;
			case V.AFTER_DOCTYPE_SYSTEM_IDENTIFIER:
				this._stateAfterDoctypeSystemIdentifier(e);
				break;
			case V.BOGUS_DOCTYPE:
				this._stateBogusDoctype(e);
				break;
			case V.CDATA_SECTION:
				this._stateCdataSection(e);
				break;
			case V.CDATA_SECTION_BRACKET:
				this._stateCdataSectionBracket(e);
				break;
			case V.CDATA_SECTION_END:
				this._stateCdataSectionEnd(e);
				break;
			case V.CHARACTER_REFERENCE:
				this._stateCharacterReference();
				break;
			case V.AMBIGUOUS_AMPERSAND:
				this._stateAmbiguousAmpersand(e);
				break;
			default: throw Error("Unknown state");
		}
	}
	_stateData(e) {
		switch (e) {
			case P.LESS_THAN_SIGN:
				this.state = V.TAG_OPEN;
				break;
			case P.AMPERSAND:
				this._startCharacterReference();
				break;
			case P.NULL:
				this._err(F.unexpectedNullCharacter), this._emitCodePoint(e);
				break;
			case P.EOF:
				this._emitEOFToken();
				break;
			default: this._emitCodePoint(e);
		}
	}
	_stateRcdata(e) {
		switch (e) {
			case P.AMPERSAND:
				this._startCharacterReference();
				break;
			case P.LESS_THAN_SIGN:
				this.state = V.RCDATA_LESS_THAN_SIGN;
				break;
			case P.NULL:
				this._err(F.unexpectedNullCharacter), this._emitChars("�");
				break;
			case P.EOF:
				this._emitEOFToken();
				break;
			default: this._emitCodePoint(e);
		}
	}
	_stateRawtext(e) {
		switch (e) {
			case P.LESS_THAN_SIGN:
				this.state = V.RAWTEXT_LESS_THAN_SIGN;
				break;
			case P.NULL:
				this._err(F.unexpectedNullCharacter), this._emitChars("�");
				break;
			case P.EOF:
				this._emitEOFToken();
				break;
			default: this._emitCodePoint(e);
		}
	}
	_stateScriptData(e) {
		switch (e) {
			case P.LESS_THAN_SIGN:
				this.state = V.SCRIPT_DATA_LESS_THAN_SIGN;
				break;
			case P.NULL:
				this._err(F.unexpectedNullCharacter), this._emitChars("�");
				break;
			case P.EOF:
				this._emitEOFToken();
				break;
			default: this._emitCodePoint(e);
		}
	}
	_statePlaintext(e) {
		switch (e) {
			case P.NULL:
				this._err(F.unexpectedNullCharacter), this._emitChars("�");
				break;
			case P.EOF:
				this._emitEOFToken();
				break;
			default: this._emitCodePoint(e);
		}
	}
	_stateTagOpen(e) {
		if (_i(e)) this._createStartTagToken(), this.state = V.TAG_NAME, this._stateTagName(e);
		else switch (e) {
			case P.EXCLAMATION_MARK:
				this.state = V.MARKUP_DECLARATION_OPEN;
				break;
			case P.SOLIDUS:
				this.state = V.END_TAG_OPEN;
				break;
			case P.QUESTION_MARK:
				this._err(F.unexpectedQuestionMarkInsteadOfTagName), this._createCommentToken(1), this.state = V.BOGUS_COMMENT, this._stateBogusComment(e);
				break;
			case P.EOF:
				this._err(F.eofBeforeTagName), this._emitChars("<"), this._emitEOFToken();
				break;
			default: this._err(F.invalidFirstCharacterOfTagName), this._emitChars("<"), this.state = V.DATA, this._stateData(e);
		}
	}
	_stateEndTagOpen(e) {
		if (_i(e)) this._createEndTagToken(), this.state = V.TAG_NAME, this._stateTagName(e);
		else switch (e) {
			case P.GREATER_THAN_SIGN:
				this._err(F.missingEndTagName), this.state = V.DATA;
				break;
			case P.EOF:
				this._err(F.eofBeforeTagName), this._emitChars("</"), this._emitEOFToken();
				break;
			default: this._err(F.invalidFirstCharacterOfTagName), this._createCommentToken(2), this.state = V.BOGUS_COMMENT, this._stateBogusComment(e);
		}
	}
	_stateTagName(e) {
		let t = this.currentToken;
		switch (e) {
			case P.SPACE:
			case P.LINE_FEED:
			case P.TABULATION:
			case P.FORM_FEED:
				this.state = V.BEFORE_ATTRIBUTE_NAME;
				break;
			case P.SOLIDUS:
				this.state = V.SELF_CLOSING_START_TAG;
				break;
			case P.GREATER_THAN_SIGN:
				this.state = V.DATA, this.emitCurrentTagToken();
				break;
			case P.NULL:
				this._err(F.unexpectedNullCharacter), t.tagName += "�";
				break;
			case P.EOF:
				this._err(F.eofInTag), this._emitEOFToken();
				break;
			default: t.tagName += String.fromCodePoint(hi(e) ? yi(e) : e);
		}
	}
	_stateRcdataLessThanSign(e) {
		e === P.SOLIDUS ? this.state = V.RCDATA_END_TAG_OPEN : (this._emitChars("<"), this.state = V.RCDATA, this._stateRcdata(e));
	}
	_stateRcdataEndTagOpen(e) {
		_i(e) ? (this.state = V.RCDATA_END_TAG_NAME, this._stateRcdataEndTagName(e)) : (this._emitChars("</"), this.state = V.RCDATA, this._stateRcdata(e));
	}
	handleSpecialEndTag(e) {
		if (!this.preprocessor.startsWith(this.lastStartTagName, !1)) return !this._ensureHibernation();
		this._createEndTagToken();
		let t = this.currentToken;
		switch (t.tagName = this.lastStartTagName, this.preprocessor.peek(this.lastStartTagName.length)) {
			case P.SPACE:
			case P.LINE_FEED:
			case P.TABULATION:
			case P.FORM_FEED: return this._advanceBy(this.lastStartTagName.length), this.state = V.BEFORE_ATTRIBUTE_NAME, !1;
			case P.SOLIDUS: return this._advanceBy(this.lastStartTagName.length), this.state = V.SELF_CLOSING_START_TAG, !1;
			case P.GREATER_THAN_SIGN: return this._advanceBy(this.lastStartTagName.length), this.emitCurrentTagToken(), this.state = V.DATA, !1;
			default: return !this._ensureHibernation();
		}
	}
	_stateRcdataEndTagName(e) {
		this.handleSpecialEndTag(e) && (this._emitChars("</"), this.state = V.RCDATA, this._stateRcdata(e));
	}
	_stateRawtextLessThanSign(e) {
		e === P.SOLIDUS ? this.state = V.RAWTEXT_END_TAG_OPEN : (this._emitChars("<"), this.state = V.RAWTEXT, this._stateRawtext(e));
	}
	_stateRawtextEndTagOpen(e) {
		_i(e) ? (this.state = V.RAWTEXT_END_TAG_NAME, this._stateRawtextEndTagName(e)) : (this._emitChars("</"), this.state = V.RAWTEXT, this._stateRawtext(e));
	}
	_stateRawtextEndTagName(e) {
		this.handleSpecialEndTag(e) && (this._emitChars("</"), this.state = V.RAWTEXT, this._stateRawtext(e));
	}
	_stateScriptDataLessThanSign(e) {
		switch (e) {
			case P.SOLIDUS:
				this.state = V.SCRIPT_DATA_END_TAG_OPEN;
				break;
			case P.EXCLAMATION_MARK:
				this.state = V.SCRIPT_DATA_ESCAPE_START, this._emitChars("<!");
				break;
			default: this._emitChars("<"), this.state = V.SCRIPT_DATA, this._stateScriptData(e);
		}
	}
	_stateScriptDataEndTagOpen(e) {
		_i(e) ? (this.state = V.SCRIPT_DATA_END_TAG_NAME, this._stateScriptDataEndTagName(e)) : (this._emitChars("</"), this.state = V.SCRIPT_DATA, this._stateScriptData(e));
	}
	_stateScriptDataEndTagName(e) {
		this.handleSpecialEndTag(e) && (this._emitChars("</"), this.state = V.SCRIPT_DATA, this._stateScriptData(e));
	}
	_stateScriptDataEscapeStart(e) {
		e === P.HYPHEN_MINUS ? (this.state = V.SCRIPT_DATA_ESCAPE_START_DASH, this._emitChars("-")) : (this.state = V.SCRIPT_DATA, this._stateScriptData(e));
	}
	_stateScriptDataEscapeStartDash(e) {
		e === P.HYPHEN_MINUS ? (this.state = V.SCRIPT_DATA_ESCAPED_DASH_DASH, this._emitChars("-")) : (this.state = V.SCRIPT_DATA, this._stateScriptData(e));
	}
	_stateScriptDataEscaped(e) {
		switch (e) {
			case P.HYPHEN_MINUS:
				this.state = V.SCRIPT_DATA_ESCAPED_DASH, this._emitChars("-");
				break;
			case P.LESS_THAN_SIGN:
				this.state = V.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN;
				break;
			case P.NULL:
				this._err(F.unexpectedNullCharacter), this._emitChars("�");
				break;
			case P.EOF:
				this._err(F.eofInScriptHtmlCommentLikeText), this._emitEOFToken();
				break;
			default: this._emitCodePoint(e);
		}
	}
	_stateScriptDataEscapedDash(e) {
		switch (e) {
			case P.HYPHEN_MINUS:
				this.state = V.SCRIPT_DATA_ESCAPED_DASH_DASH, this._emitChars("-");
				break;
			case P.LESS_THAN_SIGN:
				this.state = V.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN;
				break;
			case P.NULL:
				this._err(F.unexpectedNullCharacter), this.state = V.SCRIPT_DATA_ESCAPED, this._emitChars("�");
				break;
			case P.EOF:
				this._err(F.eofInScriptHtmlCommentLikeText), this._emitEOFToken();
				break;
			default: this.state = V.SCRIPT_DATA_ESCAPED, this._emitCodePoint(e);
		}
	}
	_stateScriptDataEscapedDashDash(e) {
		switch (e) {
			case P.HYPHEN_MINUS:
				this._emitChars("-");
				break;
			case P.LESS_THAN_SIGN:
				this.state = V.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN;
				break;
			case P.GREATER_THAN_SIGN:
				this.state = V.SCRIPT_DATA, this._emitChars(">");
				break;
			case P.NULL:
				this._err(F.unexpectedNullCharacter), this.state = V.SCRIPT_DATA_ESCAPED, this._emitChars("�");
				break;
			case P.EOF:
				this._err(F.eofInScriptHtmlCommentLikeText), this._emitEOFToken();
				break;
			default: this.state = V.SCRIPT_DATA_ESCAPED, this._emitCodePoint(e);
		}
	}
	_stateScriptDataEscapedLessThanSign(e) {
		e === P.SOLIDUS ? this.state = V.SCRIPT_DATA_ESCAPED_END_TAG_OPEN : _i(e) ? (this._emitChars("<"), this.state = V.SCRIPT_DATA_DOUBLE_ESCAPE_START, this._stateScriptDataDoubleEscapeStart(e)) : (this._emitChars("<"), this.state = V.SCRIPT_DATA_ESCAPED, this._stateScriptDataEscaped(e));
	}
	_stateScriptDataEscapedEndTagOpen(e) {
		_i(e) ? (this.state = V.SCRIPT_DATA_ESCAPED_END_TAG_NAME, this._stateScriptDataEscapedEndTagName(e)) : (this._emitChars("</"), this.state = V.SCRIPT_DATA_ESCAPED, this._stateScriptDataEscaped(e));
	}
	_stateScriptDataEscapedEndTagName(e) {
		this.handleSpecialEndTag(e) && (this._emitChars("</"), this.state = V.SCRIPT_DATA_ESCAPED, this._stateScriptDataEscaped(e));
	}
	_stateScriptDataDoubleEscapeStart(e) {
		if (this.preprocessor.startsWith(Rr.SCRIPT, !1) && xi(this.preprocessor.peek(Rr.SCRIPT.length))) {
			this._emitCodePoint(e);
			for (let e = 0; e < Rr.SCRIPT.length; e++) this._emitCodePoint(this._consume());
			this.state = V.SCRIPT_DATA_DOUBLE_ESCAPED;
		} else this._ensureHibernation() || (this.state = V.SCRIPT_DATA_ESCAPED, this._stateScriptDataEscaped(e));
	}
	_stateScriptDataDoubleEscaped(e) {
		switch (e) {
			case P.HYPHEN_MINUS:
				this.state = V.SCRIPT_DATA_DOUBLE_ESCAPED_DASH, this._emitChars("-");
				break;
			case P.LESS_THAN_SIGN:
				this.state = V.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN, this._emitChars("<");
				break;
			case P.NULL:
				this._err(F.unexpectedNullCharacter), this._emitChars("�");
				break;
			case P.EOF:
				this._err(F.eofInScriptHtmlCommentLikeText), this._emitEOFToken();
				break;
			default: this._emitCodePoint(e);
		}
	}
	_stateScriptDataDoubleEscapedDash(e) {
		switch (e) {
			case P.HYPHEN_MINUS:
				this.state = V.SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH, this._emitChars("-");
				break;
			case P.LESS_THAN_SIGN:
				this.state = V.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN, this._emitChars("<");
				break;
			case P.NULL:
				this._err(F.unexpectedNullCharacter), this.state = V.SCRIPT_DATA_DOUBLE_ESCAPED, this._emitChars("�");
				break;
			case P.EOF:
				this._err(F.eofInScriptHtmlCommentLikeText), this._emitEOFToken();
				break;
			default: this.state = V.SCRIPT_DATA_DOUBLE_ESCAPED, this._emitCodePoint(e);
		}
	}
	_stateScriptDataDoubleEscapedDashDash(e) {
		switch (e) {
			case P.HYPHEN_MINUS:
				this._emitChars("-");
				break;
			case P.LESS_THAN_SIGN:
				this.state = V.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN, this._emitChars("<");
				break;
			case P.GREATER_THAN_SIGN:
				this.state = V.SCRIPT_DATA, this._emitChars(">");
				break;
			case P.NULL:
				this._err(F.unexpectedNullCharacter), this.state = V.SCRIPT_DATA_DOUBLE_ESCAPED, this._emitChars("�");
				break;
			case P.EOF:
				this._err(F.eofInScriptHtmlCommentLikeText), this._emitEOFToken();
				break;
			default: this.state = V.SCRIPT_DATA_DOUBLE_ESCAPED, this._emitCodePoint(e);
		}
	}
	_stateScriptDataDoubleEscapedLessThanSign(e) {
		e === P.SOLIDUS ? (this.state = V.SCRIPT_DATA_DOUBLE_ESCAPE_END, this._emitChars("/")) : (this.state = V.SCRIPT_DATA_DOUBLE_ESCAPED, this._stateScriptDataDoubleEscaped(e));
	}
	_stateScriptDataDoubleEscapeEnd(e) {
		if (this.preprocessor.startsWith(Rr.SCRIPT, !1) && xi(this.preprocessor.peek(Rr.SCRIPT.length))) {
			this._emitCodePoint(e);
			for (let e = 0; e < Rr.SCRIPT.length; e++) this._emitCodePoint(this._consume());
			this.state = V.SCRIPT_DATA_ESCAPED;
		} else this._ensureHibernation() || (this.state = V.SCRIPT_DATA_DOUBLE_ESCAPED, this._stateScriptDataDoubleEscaped(e));
	}
	_stateBeforeAttributeName(e) {
		switch (e) {
			case P.SPACE:
			case P.LINE_FEED:
			case P.TABULATION:
			case P.FORM_FEED: break;
			case P.SOLIDUS:
			case P.GREATER_THAN_SIGN:
			case P.EOF:
				this.state = V.AFTER_ATTRIBUTE_NAME, this._stateAfterAttributeName(e);
				break;
			case P.EQUALS_SIGN:
				this._err(F.unexpectedEqualsSignBeforeAttributeName), this._createAttr("="), this.state = V.ATTRIBUTE_NAME;
				break;
			default: this._createAttr(""), this.state = V.ATTRIBUTE_NAME, this._stateAttributeName(e);
		}
	}
	_stateAttributeName(e) {
		switch (e) {
			case P.SPACE:
			case P.LINE_FEED:
			case P.TABULATION:
			case P.FORM_FEED:
			case P.SOLIDUS:
			case P.GREATER_THAN_SIGN:
			case P.EOF:
				this._leaveAttrName(), this.state = V.AFTER_ATTRIBUTE_NAME, this._stateAfterAttributeName(e);
				break;
			case P.EQUALS_SIGN:
				this._leaveAttrName(), this.state = V.BEFORE_ATTRIBUTE_VALUE;
				break;
			case P.QUOTATION_MARK:
			case P.APOSTROPHE:
			case P.LESS_THAN_SIGN:
				this._err(F.unexpectedCharacterInAttributeName), this.currentAttr.name += String.fromCodePoint(e);
				break;
			case P.NULL:
				this._err(F.unexpectedNullCharacter), this.currentAttr.name += "�";
				break;
			default: this.currentAttr.name += String.fromCodePoint(hi(e) ? yi(e) : e);
		}
	}
	_stateAfterAttributeName(e) {
		switch (e) {
			case P.SPACE:
			case P.LINE_FEED:
			case P.TABULATION:
			case P.FORM_FEED: break;
			case P.SOLIDUS:
				this.state = V.SELF_CLOSING_START_TAG;
				break;
			case P.EQUALS_SIGN:
				this.state = V.BEFORE_ATTRIBUTE_VALUE;
				break;
			case P.GREATER_THAN_SIGN:
				this.state = V.DATA, this.emitCurrentTagToken();
				break;
			case P.EOF:
				this._err(F.eofInTag), this._emitEOFToken();
				break;
			default: this._createAttr(""), this.state = V.ATTRIBUTE_NAME, this._stateAttributeName(e);
		}
	}
	_stateBeforeAttributeValue(e) {
		switch (e) {
			case P.SPACE:
			case P.LINE_FEED:
			case P.TABULATION:
			case P.FORM_FEED: break;
			case P.QUOTATION_MARK:
				this.state = V.ATTRIBUTE_VALUE_DOUBLE_QUOTED;
				break;
			case P.APOSTROPHE:
				this.state = V.ATTRIBUTE_VALUE_SINGLE_QUOTED;
				break;
			case P.GREATER_THAN_SIGN:
				this._err(F.missingAttributeValue), this.state = V.DATA, this.emitCurrentTagToken();
				break;
			default: this.state = V.ATTRIBUTE_VALUE_UNQUOTED, this._stateAttributeValueUnquoted(e);
		}
	}
	_stateAttributeValueDoubleQuoted(e) {
		switch (e) {
			case P.QUOTATION_MARK:
				this.state = V.AFTER_ATTRIBUTE_VALUE_QUOTED;
				break;
			case P.AMPERSAND:
				this._startCharacterReference();
				break;
			case P.NULL:
				this._err(F.unexpectedNullCharacter), this.currentAttr.value += "�";
				break;
			case P.EOF:
				this._err(F.eofInTag), this._emitEOFToken();
				break;
			default: this.currentAttr.value += String.fromCodePoint(e);
		}
	}
	_stateAttributeValueSingleQuoted(e) {
		switch (e) {
			case P.APOSTROPHE:
				this.state = V.AFTER_ATTRIBUTE_VALUE_QUOTED;
				break;
			case P.AMPERSAND:
				this._startCharacterReference();
				break;
			case P.NULL:
				this._err(F.unexpectedNullCharacter), this.currentAttr.value += "�";
				break;
			case P.EOF:
				this._err(F.eofInTag), this._emitEOFToken();
				break;
			default: this.currentAttr.value += String.fromCodePoint(e);
		}
	}
	_stateAttributeValueUnquoted(e) {
		switch (e) {
			case P.SPACE:
			case P.LINE_FEED:
			case P.TABULATION:
			case P.FORM_FEED:
				this._leaveAttrValue(), this.state = V.BEFORE_ATTRIBUTE_NAME;
				break;
			case P.AMPERSAND:
				this._startCharacterReference();
				break;
			case P.GREATER_THAN_SIGN:
				this._leaveAttrValue(), this.state = V.DATA, this.emitCurrentTagToken();
				break;
			case P.NULL:
				this._err(F.unexpectedNullCharacter), this.currentAttr.value += "�";
				break;
			case P.QUOTATION_MARK:
			case P.APOSTROPHE:
			case P.LESS_THAN_SIGN:
			case P.EQUALS_SIGN:
			case P.GRAVE_ACCENT:
				this._err(F.unexpectedCharacterInUnquotedAttributeValue), this.currentAttr.value += String.fromCodePoint(e);
				break;
			case P.EOF:
				this._err(F.eofInTag), this._emitEOFToken();
				break;
			default: this.currentAttr.value += String.fromCodePoint(e);
		}
	}
	_stateAfterAttributeValueQuoted(e) {
		switch (e) {
			case P.SPACE:
			case P.LINE_FEED:
			case P.TABULATION:
			case P.FORM_FEED:
				this._leaveAttrValue(), this.state = V.BEFORE_ATTRIBUTE_NAME;
				break;
			case P.SOLIDUS:
				this._leaveAttrValue(), this.state = V.SELF_CLOSING_START_TAG;
				break;
			case P.GREATER_THAN_SIGN:
				this._leaveAttrValue(), this.state = V.DATA, this.emitCurrentTagToken();
				break;
			case P.EOF:
				this._err(F.eofInTag), this._emitEOFToken();
				break;
			default: this._err(F.missingWhitespaceBetweenAttributes), this.state = V.BEFORE_ATTRIBUTE_NAME, this._stateBeforeAttributeName(e);
		}
	}
	_stateSelfClosingStartTag(e) {
		switch (e) {
			case P.GREATER_THAN_SIGN: {
				let e = this.currentToken;
				e.selfClosing = !0, this.state = V.DATA, this.emitCurrentTagToken();
				break;
			}
			case P.EOF:
				this._err(F.eofInTag), this._emitEOFToken();
				break;
			default: this._err(F.unexpectedSolidusInTag), this.state = V.BEFORE_ATTRIBUTE_NAME, this._stateBeforeAttributeName(e);
		}
	}
	_stateBogusComment(e) {
		let t = this.currentToken;
		switch (e) {
			case P.GREATER_THAN_SIGN:
				this.state = V.DATA, this.emitCurrentComment(t);
				break;
			case P.EOF:
				this.emitCurrentComment(t), this._emitEOFToken();
				break;
			case P.NULL:
				this._err(F.unexpectedNullCharacter), t.data += "�";
				break;
			default: t.data += String.fromCodePoint(e);
		}
	}
	_stateMarkupDeclarationOpen(e) {
		this._consumeSequenceIfMatch(Rr.DASH_DASH, !0) ? (this._createCommentToken(Rr.DASH_DASH.length + 1), this.state = V.COMMENT_START) : this._consumeSequenceIfMatch(Rr.DOCTYPE, !1) ? (this.currentLocation = this.getCurrentLocation(Rr.DOCTYPE.length + 1), this.state = V.DOCTYPE) : this._consumeSequenceIfMatch(Rr.CDATA_START, !0) ? this.inForeignNode ? this.state = V.CDATA_SECTION : (this._err(F.cdataInHtmlContent), this._createCommentToken(Rr.CDATA_START.length + 1), this.currentToken.data = "[CDATA[", this.state = V.BOGUS_COMMENT) : this._ensureHibernation() || (this._err(F.incorrectlyOpenedComment), this._createCommentToken(2), this.state = V.BOGUS_COMMENT, this._stateBogusComment(e));
	}
	_stateCommentStart(e) {
		switch (e) {
			case P.HYPHEN_MINUS:
				this.state = V.COMMENT_START_DASH;
				break;
			case P.GREATER_THAN_SIGN: {
				this._err(F.abruptClosingOfEmptyComment), this.state = V.DATA;
				let e = this.currentToken;
				this.emitCurrentComment(e);
				break;
			}
			default: this.state = V.COMMENT, this._stateComment(e);
		}
	}
	_stateCommentStartDash(e) {
		let t = this.currentToken;
		switch (e) {
			case P.HYPHEN_MINUS:
				this.state = V.COMMENT_END;
				break;
			case P.GREATER_THAN_SIGN:
				this._err(F.abruptClosingOfEmptyComment), this.state = V.DATA, this.emitCurrentComment(t);
				break;
			case P.EOF:
				this._err(F.eofInComment), this.emitCurrentComment(t), this._emitEOFToken();
				break;
			default: t.data += "-", this.state = V.COMMENT, this._stateComment(e);
		}
	}
	_stateComment(e) {
		let t = this.currentToken;
		switch (e) {
			case P.HYPHEN_MINUS:
				this.state = V.COMMENT_END_DASH;
				break;
			case P.LESS_THAN_SIGN:
				t.data += "<", this.state = V.COMMENT_LESS_THAN_SIGN;
				break;
			case P.NULL:
				this._err(F.unexpectedNullCharacter), t.data += "�";
				break;
			case P.EOF:
				this._err(F.eofInComment), this.emitCurrentComment(t), this._emitEOFToken();
				break;
			default: t.data += String.fromCodePoint(e);
		}
	}
	_stateCommentLessThanSign(e) {
		let t = this.currentToken;
		switch (e) {
			case P.EXCLAMATION_MARK:
				t.data += "!", this.state = V.COMMENT_LESS_THAN_SIGN_BANG;
				break;
			case P.LESS_THAN_SIGN:
				t.data += "<";
				break;
			default: this.state = V.COMMENT, this._stateComment(e);
		}
	}
	_stateCommentLessThanSignBang(e) {
		e === P.HYPHEN_MINUS ? this.state = V.COMMENT_LESS_THAN_SIGN_BANG_DASH : (this.state = V.COMMENT, this._stateComment(e));
	}
	_stateCommentLessThanSignBangDash(e) {
		e === P.HYPHEN_MINUS ? this.state = V.COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH : (this.state = V.COMMENT_END_DASH, this._stateCommentEndDash(e));
	}
	_stateCommentLessThanSignBangDashDash(e) {
		e !== P.GREATER_THAN_SIGN && e !== P.EOF && this._err(F.nestedComment), this.state = V.COMMENT_END, this._stateCommentEnd(e);
	}
	_stateCommentEndDash(e) {
		let t = this.currentToken;
		switch (e) {
			case P.HYPHEN_MINUS:
				this.state = V.COMMENT_END;
				break;
			case P.EOF:
				this._err(F.eofInComment), this.emitCurrentComment(t), this._emitEOFToken();
				break;
			default: t.data += "-", this.state = V.COMMENT, this._stateComment(e);
		}
	}
	_stateCommentEnd(e) {
		let t = this.currentToken;
		switch (e) {
			case P.GREATER_THAN_SIGN:
				this.state = V.DATA, this.emitCurrentComment(t);
				break;
			case P.EXCLAMATION_MARK:
				this.state = V.COMMENT_END_BANG;
				break;
			case P.HYPHEN_MINUS:
				t.data += "-";
				break;
			case P.EOF:
				this._err(F.eofInComment), this.emitCurrentComment(t), this._emitEOFToken();
				break;
			default: t.data += "--", this.state = V.COMMENT, this._stateComment(e);
		}
	}
	_stateCommentEndBang(e) {
		let t = this.currentToken;
		switch (e) {
			case P.HYPHEN_MINUS:
				t.data += "--!", this.state = V.COMMENT_END_DASH;
				break;
			case P.GREATER_THAN_SIGN:
				this._err(F.incorrectlyClosedComment), this.state = V.DATA, this.emitCurrentComment(t);
				break;
			case P.EOF:
				this._err(F.eofInComment), this.emitCurrentComment(t), this._emitEOFToken();
				break;
			default: t.data += "--!", this.state = V.COMMENT, this._stateComment(e);
		}
	}
	_stateDoctype(e) {
		switch (e) {
			case P.SPACE:
			case P.LINE_FEED:
			case P.TABULATION:
			case P.FORM_FEED:
				this.state = V.BEFORE_DOCTYPE_NAME;
				break;
			case P.GREATER_THAN_SIGN:
				this.state = V.BEFORE_DOCTYPE_NAME, this._stateBeforeDoctypeName(e);
				break;
			case P.EOF: {
				this._err(F.eofInDoctype), this._createDoctypeToken(null);
				let e = this.currentToken;
				e.forceQuirks = !0, this.emitCurrentDoctype(e), this._emitEOFToken();
				break;
			}
			default: this._err(F.missingWhitespaceBeforeDoctypeName), this.state = V.BEFORE_DOCTYPE_NAME, this._stateBeforeDoctypeName(e);
		}
	}
	_stateBeforeDoctypeName(e) {
		if (hi(e)) this._createDoctypeToken(String.fromCharCode(yi(e))), this.state = V.DOCTYPE_NAME;
		else switch (e) {
			case P.SPACE:
			case P.LINE_FEED:
			case P.TABULATION:
			case P.FORM_FEED: break;
			case P.NULL:
				this._err(F.unexpectedNullCharacter), this._createDoctypeToken("�"), this.state = V.DOCTYPE_NAME;
				break;
			case P.GREATER_THAN_SIGN: {
				this._err(F.missingDoctypeName), this._createDoctypeToken(null);
				let e = this.currentToken;
				e.forceQuirks = !0, this.emitCurrentDoctype(e), this.state = V.DATA;
				break;
			}
			case P.EOF: {
				this._err(F.eofInDoctype), this._createDoctypeToken(null);
				let e = this.currentToken;
				e.forceQuirks = !0, this.emitCurrentDoctype(e), this._emitEOFToken();
				break;
			}
			default: this._createDoctypeToken(String.fromCodePoint(e)), this.state = V.DOCTYPE_NAME;
		}
	}
	_stateDoctypeName(e) {
		let t = this.currentToken;
		switch (e) {
			case P.SPACE:
			case P.LINE_FEED:
			case P.TABULATION:
			case P.FORM_FEED:
				this.state = V.AFTER_DOCTYPE_NAME;
				break;
			case P.GREATER_THAN_SIGN:
				this.state = V.DATA, this.emitCurrentDoctype(t);
				break;
			case P.NULL:
				this._err(F.unexpectedNullCharacter), t.name += "�";
				break;
			case P.EOF:
				this._err(F.eofInDoctype), t.forceQuirks = !0, this.emitCurrentDoctype(t), this._emitEOFToken();
				break;
			default: t.name += String.fromCodePoint(hi(e) ? yi(e) : e);
		}
	}
	_stateAfterDoctypeName(e) {
		let t = this.currentToken;
		switch (e) {
			case P.SPACE:
			case P.LINE_FEED:
			case P.TABULATION:
			case P.FORM_FEED: break;
			case P.GREATER_THAN_SIGN:
				this.state = V.DATA, this.emitCurrentDoctype(t);
				break;
			case P.EOF:
				this._err(F.eofInDoctype), t.forceQuirks = !0, this.emitCurrentDoctype(t), this._emitEOFToken();
				break;
			default: this._consumeSequenceIfMatch(Rr.PUBLIC, !1) ? this.state = V.AFTER_DOCTYPE_PUBLIC_KEYWORD : this._consumeSequenceIfMatch(Rr.SYSTEM, !1) ? this.state = V.AFTER_DOCTYPE_SYSTEM_KEYWORD : this._ensureHibernation() || (this._err(F.invalidCharacterSequenceAfterDoctypeName), t.forceQuirks = !0, this.state = V.BOGUS_DOCTYPE, this._stateBogusDoctype(e));
		}
	}
	_stateAfterDoctypePublicKeyword(e) {
		let t = this.currentToken;
		switch (e) {
			case P.SPACE:
			case P.LINE_FEED:
			case P.TABULATION:
			case P.FORM_FEED:
				this.state = V.BEFORE_DOCTYPE_PUBLIC_IDENTIFIER;
				break;
			case P.QUOTATION_MARK:
				this._err(F.missingWhitespaceAfterDoctypePublicKeyword), t.publicId = "", this.state = V.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED;
				break;
			case P.APOSTROPHE:
				this._err(F.missingWhitespaceAfterDoctypePublicKeyword), t.publicId = "", this.state = V.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED;
				break;
			case P.GREATER_THAN_SIGN:
				this._err(F.missingDoctypePublicIdentifier), t.forceQuirks = !0, this.state = V.DATA, this.emitCurrentDoctype(t);
				break;
			case P.EOF:
				this._err(F.eofInDoctype), t.forceQuirks = !0, this.emitCurrentDoctype(t), this._emitEOFToken();
				break;
			default: this._err(F.missingQuoteBeforeDoctypePublicIdentifier), t.forceQuirks = !0, this.state = V.BOGUS_DOCTYPE, this._stateBogusDoctype(e);
		}
	}
	_stateBeforeDoctypePublicIdentifier(e) {
		let t = this.currentToken;
		switch (e) {
			case P.SPACE:
			case P.LINE_FEED:
			case P.TABULATION:
			case P.FORM_FEED: break;
			case P.QUOTATION_MARK:
				t.publicId = "", this.state = V.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED;
				break;
			case P.APOSTROPHE:
				t.publicId = "", this.state = V.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED;
				break;
			case P.GREATER_THAN_SIGN:
				this._err(F.missingDoctypePublicIdentifier), t.forceQuirks = !0, this.state = V.DATA, this.emitCurrentDoctype(t);
				break;
			case P.EOF:
				this._err(F.eofInDoctype), t.forceQuirks = !0, this.emitCurrentDoctype(t), this._emitEOFToken();
				break;
			default: this._err(F.missingQuoteBeforeDoctypePublicIdentifier), t.forceQuirks = !0, this.state = V.BOGUS_DOCTYPE, this._stateBogusDoctype(e);
		}
	}
	_stateDoctypePublicIdentifierDoubleQuoted(e) {
		let t = this.currentToken;
		switch (e) {
			case P.QUOTATION_MARK:
				this.state = V.AFTER_DOCTYPE_PUBLIC_IDENTIFIER;
				break;
			case P.NULL:
				this._err(F.unexpectedNullCharacter), t.publicId += "�";
				break;
			case P.GREATER_THAN_SIGN:
				this._err(F.abruptDoctypePublicIdentifier), t.forceQuirks = !0, this.emitCurrentDoctype(t), this.state = V.DATA;
				break;
			case P.EOF:
				this._err(F.eofInDoctype), t.forceQuirks = !0, this.emitCurrentDoctype(t), this._emitEOFToken();
				break;
			default: t.publicId += String.fromCodePoint(e);
		}
	}
	_stateDoctypePublicIdentifierSingleQuoted(e) {
		let t = this.currentToken;
		switch (e) {
			case P.APOSTROPHE:
				this.state = V.AFTER_DOCTYPE_PUBLIC_IDENTIFIER;
				break;
			case P.NULL:
				this._err(F.unexpectedNullCharacter), t.publicId += "�";
				break;
			case P.GREATER_THAN_SIGN:
				this._err(F.abruptDoctypePublicIdentifier), t.forceQuirks = !0, this.emitCurrentDoctype(t), this.state = V.DATA;
				break;
			case P.EOF:
				this._err(F.eofInDoctype), t.forceQuirks = !0, this.emitCurrentDoctype(t), this._emitEOFToken();
				break;
			default: t.publicId += String.fromCodePoint(e);
		}
	}
	_stateAfterDoctypePublicIdentifier(e) {
		let t = this.currentToken;
		switch (e) {
			case P.SPACE:
			case P.LINE_FEED:
			case P.TABULATION:
			case P.FORM_FEED:
				this.state = V.BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS;
				break;
			case P.GREATER_THAN_SIGN:
				this.state = V.DATA, this.emitCurrentDoctype(t);
				break;
			case P.QUOTATION_MARK:
				this._err(F.missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers), t.systemId = "", this.state = V.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;
				break;
			case P.APOSTROPHE:
				this._err(F.missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers), t.systemId = "", this.state = V.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;
				break;
			case P.EOF:
				this._err(F.eofInDoctype), t.forceQuirks = !0, this.emitCurrentDoctype(t), this._emitEOFToken();
				break;
			default: this._err(F.missingQuoteBeforeDoctypeSystemIdentifier), t.forceQuirks = !0, this.state = V.BOGUS_DOCTYPE, this._stateBogusDoctype(e);
		}
	}
	_stateBetweenDoctypePublicAndSystemIdentifiers(e) {
		let t = this.currentToken;
		switch (e) {
			case P.SPACE:
			case P.LINE_FEED:
			case P.TABULATION:
			case P.FORM_FEED: break;
			case P.GREATER_THAN_SIGN:
				this.emitCurrentDoctype(t), this.state = V.DATA;
				break;
			case P.QUOTATION_MARK:
				t.systemId = "", this.state = V.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;
				break;
			case P.APOSTROPHE:
				t.systemId = "", this.state = V.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;
				break;
			case P.EOF:
				this._err(F.eofInDoctype), t.forceQuirks = !0, this.emitCurrentDoctype(t), this._emitEOFToken();
				break;
			default: this._err(F.missingQuoteBeforeDoctypeSystemIdentifier), t.forceQuirks = !0, this.state = V.BOGUS_DOCTYPE, this._stateBogusDoctype(e);
		}
	}
	_stateAfterDoctypeSystemKeyword(e) {
		let t = this.currentToken;
		switch (e) {
			case P.SPACE:
			case P.LINE_FEED:
			case P.TABULATION:
			case P.FORM_FEED:
				this.state = V.BEFORE_DOCTYPE_SYSTEM_IDENTIFIER;
				break;
			case P.QUOTATION_MARK:
				this._err(F.missingWhitespaceAfterDoctypeSystemKeyword), t.systemId = "", this.state = V.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;
				break;
			case P.APOSTROPHE:
				this._err(F.missingWhitespaceAfterDoctypeSystemKeyword), t.systemId = "", this.state = V.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;
				break;
			case P.GREATER_THAN_SIGN:
				this._err(F.missingDoctypeSystemIdentifier), t.forceQuirks = !0, this.state = V.DATA, this.emitCurrentDoctype(t);
				break;
			case P.EOF:
				this._err(F.eofInDoctype), t.forceQuirks = !0, this.emitCurrentDoctype(t), this._emitEOFToken();
				break;
			default: this._err(F.missingQuoteBeforeDoctypeSystemIdentifier), t.forceQuirks = !0, this.state = V.BOGUS_DOCTYPE, this._stateBogusDoctype(e);
		}
	}
	_stateBeforeDoctypeSystemIdentifier(e) {
		let t = this.currentToken;
		switch (e) {
			case P.SPACE:
			case P.LINE_FEED:
			case P.TABULATION:
			case P.FORM_FEED: break;
			case P.QUOTATION_MARK:
				t.systemId = "", this.state = V.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;
				break;
			case P.APOSTROPHE:
				t.systemId = "", this.state = V.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;
				break;
			case P.GREATER_THAN_SIGN:
				this._err(F.missingDoctypeSystemIdentifier), t.forceQuirks = !0, this.state = V.DATA, this.emitCurrentDoctype(t);
				break;
			case P.EOF:
				this._err(F.eofInDoctype), t.forceQuirks = !0, this.emitCurrentDoctype(t), this._emitEOFToken();
				break;
			default: this._err(F.missingQuoteBeforeDoctypeSystemIdentifier), t.forceQuirks = !0, this.state = V.BOGUS_DOCTYPE, this._stateBogusDoctype(e);
		}
	}
	_stateDoctypeSystemIdentifierDoubleQuoted(e) {
		let t = this.currentToken;
		switch (e) {
			case P.QUOTATION_MARK:
				this.state = V.AFTER_DOCTYPE_SYSTEM_IDENTIFIER;
				break;
			case P.NULL:
				this._err(F.unexpectedNullCharacter), t.systemId += "�";
				break;
			case P.GREATER_THAN_SIGN:
				this._err(F.abruptDoctypeSystemIdentifier), t.forceQuirks = !0, this.emitCurrentDoctype(t), this.state = V.DATA;
				break;
			case P.EOF:
				this._err(F.eofInDoctype), t.forceQuirks = !0, this.emitCurrentDoctype(t), this._emitEOFToken();
				break;
			default: t.systemId += String.fromCodePoint(e);
		}
	}
	_stateDoctypeSystemIdentifierSingleQuoted(e) {
		let t = this.currentToken;
		switch (e) {
			case P.APOSTROPHE:
				this.state = V.AFTER_DOCTYPE_SYSTEM_IDENTIFIER;
				break;
			case P.NULL:
				this._err(F.unexpectedNullCharacter), t.systemId += "�";
				break;
			case P.GREATER_THAN_SIGN:
				this._err(F.abruptDoctypeSystemIdentifier), t.forceQuirks = !0, this.emitCurrentDoctype(t), this.state = V.DATA;
				break;
			case P.EOF:
				this._err(F.eofInDoctype), t.forceQuirks = !0, this.emitCurrentDoctype(t), this._emitEOFToken();
				break;
			default: t.systemId += String.fromCodePoint(e);
		}
	}
	_stateAfterDoctypeSystemIdentifier(e) {
		let t = this.currentToken;
		switch (e) {
			case P.SPACE:
			case P.LINE_FEED:
			case P.TABULATION:
			case P.FORM_FEED: break;
			case P.GREATER_THAN_SIGN:
				this.emitCurrentDoctype(t), this.state = V.DATA;
				break;
			case P.EOF:
				this._err(F.eofInDoctype), t.forceQuirks = !0, this.emitCurrentDoctype(t), this._emitEOFToken();
				break;
			default: this._err(F.unexpectedCharacterAfterDoctypeSystemIdentifier), this.state = V.BOGUS_DOCTYPE, this._stateBogusDoctype(e);
		}
	}
	_stateBogusDoctype(e) {
		let t = this.currentToken;
		switch (e) {
			case P.GREATER_THAN_SIGN:
				this.emitCurrentDoctype(t), this.state = V.DATA;
				break;
			case P.NULL:
				this._err(F.unexpectedNullCharacter);
				break;
			case P.EOF: this.emitCurrentDoctype(t), this._emitEOFToken();
		}
	}
	_stateCdataSection(e) {
		switch (e) {
			case P.RIGHT_SQUARE_BRACKET:
				this.state = V.CDATA_SECTION_BRACKET;
				break;
			case P.EOF:
				this._err(F.eofInCdata), this._emitEOFToken();
				break;
			default: this._emitCodePoint(e);
		}
	}
	_stateCdataSectionBracket(e) {
		e === P.RIGHT_SQUARE_BRACKET ? this.state = V.CDATA_SECTION_END : (this._emitChars("]"), this.state = V.CDATA_SECTION, this._stateCdataSection(e));
	}
	_stateCdataSectionEnd(e) {
		switch (e) {
			case P.GREATER_THAN_SIGN:
				this.state = V.DATA;
				break;
			case P.RIGHT_SQUARE_BRACKET:
				this._emitChars("]");
				break;
			default: this._emitChars("]]"), this.state = V.CDATA_SECTION, this._stateCdataSection(e);
		}
	}
	_stateCharacterReference() {
		let e = this.entityDecoder.write(this.preprocessor.html, this.preprocessor.pos);
		if (e < 0) {
			if (this.preprocessor.lastChunkWritten) e = this.entityDecoder.end();
			else {
				this.active = !1, this.preprocessor.pos = this.preprocessor.html.length - 1, this.consumedAfterSnapshot = 0, this.preprocessor.endOfChunkHit = !0;
				return;
			}
		}
		e === 0 ? (this.preprocessor.pos = this.entityStartPos, this._flushCodePointConsumedAsCharacterReference(P.AMPERSAND), this.state = !this._isCharacterReferenceInAttribute() && vi(this.preprocessor.peek(1)) ? V.AMBIGUOUS_AMPERSAND : this.returnState) : this.state = this.returnState;
	}
	_stateAmbiguousAmpersand(e) {
		vi(e) ? this._flushCodePointConsumedAsCharacterReference(e) : (e === P.SEMICOLON && this._err(F.unknownNamedCharacterReference), this.state = this.returnState, this._callState(e));
	}
}, wi = /* @__PURE__ */ new Set([
	z.DD,
	z.DT,
	z.LI,
	z.OPTGROUP,
	z.OPTION,
	z.P,
	z.RB,
	z.RP,
	z.RT,
	z.RTC
]), Ti = /* @__PURE__ */ new Set([
	...wi,
	z.CAPTION,
	z.COLGROUP,
	z.TBODY,
	z.TD,
	z.TFOOT,
	z.TH,
	z.THEAD,
	z.TR
]), Ei = /* @__PURE__ */ new Set([
	z.APPLET,
	z.CAPTION,
	z.HTML,
	z.MARQUEE,
	z.OBJECT,
	z.TABLE,
	z.TD,
	z.TEMPLATE,
	z.TH
]), Di = /* @__PURE__ */ new Set([
	...Ei,
	z.OL,
	z.UL
]), Oi = /* @__PURE__ */ new Set([...Ei, z.BUTTON]), ki = /* @__PURE__ */ new Set([
	z.ANNOTATION_XML,
	z.MI,
	z.MN,
	z.MO,
	z.MS,
	z.MTEXT
]), Ai = /* @__PURE__ */ new Set([
	z.DESC,
	z.FOREIGN_OBJECT,
	z.TITLE
]), ji = /* @__PURE__ */ new Set([
	z.TR,
	z.TEMPLATE,
	z.HTML
]), Mi = /* @__PURE__ */ new Set([
	z.TBODY,
	z.TFOOT,
	z.THEAD,
	z.TEMPLATE,
	z.HTML
]), Ni = /* @__PURE__ */ new Set([
	z.TABLE,
	z.TEMPLATE,
	z.HTML
]), Pi = /* @__PURE__ */ new Set([z.TD, z.TH]), Fi = class {
	get currentTmplContentOrNode() {
		return this._isInTemplate() ? this.treeAdapter.getTemplateContent(this.current) : this.current;
	}
	constructor(e, t, n) {
		this.treeAdapter = t, this.handler = n, this.items = [], this.tagIDs = [], this.stackTop = -1, this.tmplCount = 0, this.currentTagId = z.UNKNOWN, this.current = e;
	}
	_indexOf(e) {
		return this.items.lastIndexOf(e, this.stackTop);
	}
	_isInTemplate() {
		return this.currentTagId === z.TEMPLATE && this.treeAdapter.getNamespaceURI(this.current) === L.HTML;
	}
	_updateCurrentElement() {
		this.current = this.items[this.stackTop], this.currentTagId = this.tagIDs[this.stackTop];
	}
	push(e, t) {
		this.stackTop++, this.items[this.stackTop] = e, this.current = e, this.tagIDs[this.stackTop] = t, this.currentTagId = t, this._isInTemplate() && this.tmplCount++, this.handler.onItemPush(e, t, !0);
	}
	pop() {
		let e = this.current;
		this.tmplCount > 0 && this._isInTemplate() && this.tmplCount--, this.stackTop--, this._updateCurrentElement(), this.handler.onItemPop(e, !0);
	}
	replace(e, t) {
		let n = this._indexOf(e);
		this.items[n] = t, n === this.stackTop && (this.current = t);
	}
	insertAfter(e, t, n) {
		let r = this._indexOf(e) + 1;
		this.items.splice(r, 0, t), this.tagIDs.splice(r, 0, n), this.stackTop++, r === this.stackTop && this._updateCurrentElement(), this.current && this.currentTagId !== void 0 && this.handler.onItemPush(this.current, this.currentTagId, r === this.stackTop);
	}
	popUntilTagNamePopped(e) {
		let t = this.stackTop + 1;
		do
			t = this.tagIDs.lastIndexOf(e, t - 1);
		while (t > 0 && this.treeAdapter.getNamespaceURI(this.items[t]) !== L.HTML);
		this.shortenToLength(Math.max(t, 0));
	}
	shortenToLength(e) {
		for (; this.stackTop >= e;) {
			let t = this.current;
			this.tmplCount > 0 && this._isInTemplate() && --this.tmplCount, this.stackTop--, this._updateCurrentElement(), this.handler.onItemPop(t, this.stackTop < e);
		}
	}
	popUntilElementPopped(e) {
		let t = this._indexOf(e);
		this.shortenToLength(Math.max(t, 0));
	}
	popUntilPopped(e, t) {
		let n = this._indexOfTagNames(e, t);
		this.shortenToLength(Math.max(n, 0));
	}
	popUntilNumberedHeaderPopped() {
		this.popUntilPopped(fi, L.HTML);
	}
	popUntilTableCellPopped() {
		this.popUntilPopped(Pi, L.HTML);
	}
	popAllUpToHtmlElement() {
		this.tmplCount = 0, this.shortenToLength(1);
	}
	_indexOfTagNames(e, t) {
		for (let n = this.stackTop; n >= 0; n--) if (e.has(this.tagIDs[n]) && this.treeAdapter.getNamespaceURI(this.items[n]) === t) return n;
		return -1;
	}
	clearBackTo(e, t) {
		let n = this._indexOfTagNames(e, t);
		this.shortenToLength(n + 1);
	}
	clearBackToTableContext() {
		this.clearBackTo(Ni, L.HTML);
	}
	clearBackToTableBodyContext() {
		this.clearBackTo(Mi, L.HTML);
	}
	clearBackToTableRowContext() {
		this.clearBackTo(ji, L.HTML);
	}
	remove(e) {
		let t = this._indexOf(e);
		t >= 0 && (t === this.stackTop ? this.pop() : (this.items.splice(t, 1), this.tagIDs.splice(t, 1), this.stackTop--, this._updateCurrentElement(), this.handler.onItemPop(e, !1)));
	}
	tryPeekProperlyNestedBodyElement() {
		return this.stackTop >= 1 && this.tagIDs[1] === z.BODY ? this.items[1] : null;
	}
	contains(e) {
		return this._indexOf(e) > -1;
	}
	getCommonAncestor(e) {
		let t = this._indexOf(e) - 1;
		return t >= 0 ? this.items[t] : null;
	}
	isRootHtmlElementCurrent() {
		return this.stackTop === 0 && this.tagIDs[0] === z.HTML;
	}
	hasInDynamicScope(e, t) {
		for (let n = this.stackTop; n >= 0; n--) {
			let r = this.tagIDs[n];
			switch (this.treeAdapter.getNamespaceURI(this.items[n])) {
				case L.HTML:
					if (r === e) return !0;
					if (t.has(r)) return !1;
					break;
				case L.SVG:
					if (Ai.has(r)) return !1;
					break;
				case L.MATHML: if (ki.has(r)) return !1;
			}
		}
		return !0;
	}
	hasInScope(e) {
		return this.hasInDynamicScope(e, Ei);
	}
	hasInListItemScope(e) {
		return this.hasInDynamicScope(e, Di);
	}
	hasInButtonScope(e) {
		return this.hasInDynamicScope(e, Oi);
	}
	hasNumberedHeaderInScope() {
		for (let e = this.stackTop; e >= 0; e--) {
			let t = this.tagIDs[e];
			switch (this.treeAdapter.getNamespaceURI(this.items[e])) {
				case L.HTML:
					if (fi.has(t)) return !0;
					if (Ei.has(t)) return !1;
					break;
				case L.SVG:
					if (Ai.has(t)) return !1;
					break;
				case L.MATHML: if (ki.has(t)) return !1;
			}
		}
		return !0;
	}
	hasInTableScope(e) {
		for (let t = this.stackTop; t >= 0; t--) if (this.treeAdapter.getNamespaceURI(this.items[t]) === L.HTML) switch (this.tagIDs[t]) {
			case e: return !0;
			case z.TABLE:
			case z.HTML: return !1;
		}
		return !0;
	}
	hasTableBodyContextInTableScope() {
		for (let e = this.stackTop; e >= 0; e--) if (this.treeAdapter.getNamespaceURI(this.items[e]) === L.HTML) switch (this.tagIDs[e]) {
			case z.TBODY:
			case z.THEAD:
			case z.TFOOT: return !0;
			case z.TABLE:
			case z.HTML: return !1;
		}
		return !0;
	}
	hasInSelectScope(e) {
		for (let t = this.stackTop; t >= 0; t--) if (this.treeAdapter.getNamespaceURI(this.items[t]) === L.HTML) switch (this.tagIDs[t]) {
			case e: return !0;
			case z.OPTION:
			case z.OPTGROUP: break;
			default: return !1;
		}
		return !0;
	}
	generateImpliedEndTags() {
		for (; this.currentTagId !== void 0 && wi.has(this.currentTagId);) this.pop();
	}
	generateImpliedEndTagsThoroughly() {
		for (; this.currentTagId !== void 0 && Ti.has(this.currentTagId);) this.pop();
	}
	generateImpliedEndTagsWithExclusion(e) {
		for (; this.currentTagId !== void 0 && this.currentTagId !== e && Ti.has(this.currentTagId);) this.pop();
	}
}, Ii = 3, Li;
(function(e) {
	e[e.Marker = 0] = "Marker", e[e.Element = 1] = "Element";
})(Li ||= {});
var Ri = { type: Li.Marker }, zi = class {
	constructor(e) {
		this.treeAdapter = e, this.entries = [], this.bookmark = null;
	}
	_getNoahArkConditionCandidates(e, t) {
		let n = [], r = t.length, i = this.treeAdapter.getTagName(e), a = this.treeAdapter.getNamespaceURI(e);
		for (let e = 0; e < this.entries.length; e++) {
			let t = this.entries[e];
			if (t.type === Li.Marker) break;
			let { element: o } = t;
			if (this.treeAdapter.getTagName(o) === i && this.treeAdapter.getNamespaceURI(o) === a) {
				let t = this.treeAdapter.getAttrList(o);
				t.length === r && n.push({
					idx: e,
					attrs: t
				});
			}
		}
		return n;
	}
	_ensureNoahArkCondition(e) {
		if (this.entries.length < Ii) return;
		let t = this.treeAdapter.getAttrList(e), n = this._getNoahArkConditionCandidates(e, t);
		if (n.length < Ii) return;
		let r = new Map(t.map((e) => [e.name, e.value])), i = 0;
		for (let e = 0; e < n.length; e++) {
			let t = n[e];
			t.attrs.every((e) => r.get(e.name) === e.value) && (i += 1, i >= Ii && this.entries.splice(t.idx, 1));
		}
	}
	insertMarker() {
		this.entries.unshift(Ri);
	}
	pushElement(e, t) {
		this._ensureNoahArkCondition(e), this.entries.unshift({
			type: Li.Element,
			element: e,
			token: t
		});
	}
	insertElementAfterBookmark(e, t) {
		let n = this.entries.indexOf(this.bookmark);
		this.entries.splice(n, 0, {
			type: Li.Element,
			element: e,
			token: t
		});
	}
	removeEntry(e) {
		let t = this.entries.indexOf(e);
		t !== -1 && this.entries.splice(t, 1);
	}
	clearToLastMarker() {
		let e = this.entries.indexOf(Ri);
		e === -1 ? this.entries.length = 0 : this.entries.splice(0, e + 1);
	}
	getElementEntryInScopeWithTagName(e) {
		let t = this.entries.find((t) => t.type === Li.Marker || this.treeAdapter.getTagName(t.element) === e);
		return t && t.type === Li.Element ? t : null;
	}
	getElementEntry(e) {
		return this.entries.find((t) => t.type === Li.Element && t.element === e);
	}
}, Bi = {
	createDocument() {
		return {
			nodeName: "#document",
			mode: ci.NO_QUIRKS,
			childNodes: []
		};
	},
	createDocumentFragment() {
		return {
			nodeName: "#document-fragment",
			childNodes: []
		};
	},
	createElement(e, t, n) {
		return {
			nodeName: e,
			tagName: e,
			attrs: n,
			namespaceURI: t,
			childNodes: [],
			parentNode: null
		};
	},
	createCommentNode(e) {
		return {
			nodeName: "#comment",
			data: e,
			parentNode: null
		};
	},
	createTextNode(e) {
		return {
			nodeName: "#text",
			value: e,
			parentNode: null
		};
	},
	appendChild(e, t) {
		e.childNodes.push(t), t.parentNode = e;
	},
	insertBefore(e, t, n) {
		let r = e.childNodes.indexOf(n);
		e.childNodes.splice(r, 0, t), t.parentNode = e;
	},
	setTemplateContent(e, t) {
		e.content = t;
	},
	getTemplateContent(e) {
		return e.content;
	},
	setDocumentType(e, t, n, r) {
		let i = e.childNodes.find((e) => e.nodeName === "#documentType");
		if (i) i.name = t, i.publicId = n, i.systemId = r;
		else {
			let i = {
				nodeName: "#documentType",
				name: t,
				publicId: n,
				systemId: r,
				parentNode: null
			};
			Bi.appendChild(e, i);
		}
	},
	setDocumentMode(e, t) {
		e.mode = t;
	},
	getDocumentMode(e) {
		return e.mode;
	},
	detachNode(e) {
		if (e.parentNode) {
			let t = e.parentNode.childNodes.indexOf(e);
			e.parentNode.childNodes.splice(t, 1), e.parentNode = null;
		}
	},
	insertText(e, t) {
		if (e.childNodes.length > 0) {
			let n = e.childNodes[e.childNodes.length - 1];
			if (Bi.isTextNode(n)) {
				n.value += t;
				return;
			}
		}
		Bi.appendChild(e, Bi.createTextNode(t));
	},
	insertTextBefore(e, t, n) {
		let r = e.childNodes[e.childNodes.indexOf(n) - 1];
		r && Bi.isTextNode(r) ? r.value += t : Bi.insertBefore(e, Bi.createTextNode(t), n);
	},
	adoptAttributes(e, t) {
		let n = new Set(e.attrs.map((e) => e.name));
		for (let r = 0; r < t.length; r++) n.has(t[r].name) || e.attrs.push(t[r]);
	},
	getFirstChild(e) {
		return e.childNodes[0];
	},
	getChildNodes(e) {
		return e.childNodes;
	},
	getParentNode(e) {
		return e.parentNode;
	},
	getAttrList(e) {
		return e.attrs;
	},
	getTagName(e) {
		return e.tagName;
	},
	getNamespaceURI(e) {
		return e.namespaceURI;
	},
	getTextNodeContent(e) {
		return e.value;
	},
	getCommentNodeContent(e) {
		return e.data;
	},
	getDocumentTypeNodeName(e) {
		return e.name;
	},
	getDocumentTypeNodePublicId(e) {
		return e.publicId;
	},
	getDocumentTypeNodeSystemId(e) {
		return e.systemId;
	},
	isTextNode(e) {
		return e.nodeName === "#text";
	},
	isCommentNode(e) {
		return e.nodeName === "#comment";
	},
	isDocumentTypeNode(e) {
		return e.nodeName === "#documentType";
	},
	isElementNode(e) {
		return Object.prototype.hasOwnProperty.call(e, "tagName");
	},
	setNodeSourceCodeLocation(e, t) {
		e.sourceCodeLocation = t;
	},
	getNodeSourceCodeLocation(e) {
		return e.sourceCodeLocation;
	},
	updateNodeSourceCodeLocation(e, t) {
		e.sourceCodeLocation = {
			...e.sourceCodeLocation,
			...t
		};
	}
}, Vi = "html", Hi = "about:legacy-compat", Ui = "http://www.ibm.com/data/dtd/v11/ibmxhtml1-transitional.dtd", Wi = /* @__PURE__ */ "+//silmaril//dtd html pro v0r11 19970101//,-//as//dtd html 3.0 aswedit + extensions//,-//advasoft ltd//dtd html 3.0 aswedit + extensions//,-//ietf//dtd html 2.0 level 1//,-//ietf//dtd html 2.0 level 2//,-//ietf//dtd html 2.0 strict level 1//,-//ietf//dtd html 2.0 strict level 2//,-//ietf//dtd html 2.0 strict//,-//ietf//dtd html 2.0//,-//ietf//dtd html 2.1e//,-//ietf//dtd html 3.0//,-//ietf//dtd html 3.2 final//,-//ietf//dtd html 3.2//,-//ietf//dtd html 3//,-//ietf//dtd html level 0//,-//ietf//dtd html level 1//,-//ietf//dtd html level 2//,-//ietf//dtd html level 3//,-//ietf//dtd html strict level 0//,-//ietf//dtd html strict level 1//,-//ietf//dtd html strict level 2//,-//ietf//dtd html strict level 3//,-//ietf//dtd html strict//,-//ietf//dtd html//,-//metrius//dtd metrius presentational//,-//microsoft//dtd internet explorer 2.0 html strict//,-//microsoft//dtd internet explorer 2.0 html//,-//microsoft//dtd internet explorer 2.0 tables//,-//microsoft//dtd internet explorer 3.0 html strict//,-//microsoft//dtd internet explorer 3.0 html//,-//microsoft//dtd internet explorer 3.0 tables//,-//netscape comm. corp.//dtd html//,-//netscape comm. corp.//dtd strict html//,-//o'reilly and associates//dtd html 2.0//,-//o'reilly and associates//dtd html extended 1.0//,-//o'reilly and associates//dtd html extended relaxed 1.0//,-//sq//dtd html 2.0 hotmetal + extensions//,-//softquad software//dtd hotmetal pro 6.0::19990601::extensions to html 4.0//,-//softquad//dtd hotmetal pro 4.0::19971010::extensions to html 4.0//,-//spyglass//dtd html 2.0 extended//,-//sun microsystems corp.//dtd hotjava html//,-//sun microsystems corp.//dtd hotjava strict html//,-//w3c//dtd html 3 1995-03-24//,-//w3c//dtd html 3.2 draft//,-//w3c//dtd html 3.2 final//,-//w3c//dtd html 3.2//,-//w3c//dtd html 3.2s draft//,-//w3c//dtd html 4.0 frameset//,-//w3c//dtd html 4.0 transitional//,-//w3c//dtd html experimental 19960712//,-//w3c//dtd html experimental 970421//,-//w3c//dtd w3 html//,-//w3o//dtd w3 html 3.0//,-//webtechs//dtd mozilla html 2.0//,-//webtechs//dtd mozilla html//".split(","), Gi = [
	...Wi,
	"-//w3c//dtd html 4.01 frameset//",
	"-//w3c//dtd html 4.01 transitional//"
], Ki = /* @__PURE__ */ new Set([
	"-//w3o//dtd w3 html strict 3.0//en//",
	"-/w3c/dtd html 4.0 transitional/en",
	"html"
]), qi = ["-//w3c//dtd xhtml 1.0 frameset//", "-//w3c//dtd xhtml 1.0 transitional//"], Ji = [
	...qi,
	"-//w3c//dtd html 4.01 frameset//",
	"-//w3c//dtd html 4.01 transitional//"
];
function Yi(e, t) {
	return t.some((t) => e.startsWith(t));
}
function Xi(e) {
	return e.name === Vi && e.publicId === null && (e.systemId === null || e.systemId === Hi);
}
function Zi(e) {
	if (e.name !== Vi) return ci.QUIRKS;
	let { systemId: t } = e;
	if (t && t.toLowerCase() === Ui) return ci.QUIRKS;
	let { publicId: n } = e;
	if (n !== null) {
		if (n = n.toLowerCase(), Ki.has(n)) return ci.QUIRKS;
		let e = t === null ? Gi : Wi;
		if (Yi(n, e)) return ci.QUIRKS;
		if (e = t === null ? qi : Ji, Yi(n, e)) return ci.LIMITED_QUIRKS;
	}
	return ci.NO_QUIRKS;
}
// node_modules/hast-util-raw/node_modules/parse5/dist/common/foreign-content.js
var Qi = {
	TEXT_HTML: "text/html",
	APPLICATION_XML: "application/xhtml+xml"
}, $i = "definitionurl", ea = "definitionURL", ta = new Map((/* @__PURE__ */ "attributeName.attributeType.baseFrequency.baseProfile.calcMode.clipPathUnits.diffuseConstant.edgeMode.filterUnits.glyphRef.gradientTransform.gradientUnits.kernelMatrix.kernelUnitLength.keyPoints.keySplines.keyTimes.lengthAdjust.limitingConeAngle.markerHeight.markerUnits.markerWidth.maskContentUnits.maskUnits.numOctaves.pathLength.patternContentUnits.patternTransform.patternUnits.pointsAtX.pointsAtY.pointsAtZ.preserveAlpha.preserveAspectRatio.primitiveUnits.refX.refY.repeatCount.repeatDur.requiredExtensions.requiredFeatures.specularConstant.specularExponent.spreadMethod.startOffset.stdDeviation.stitchTiles.surfaceScale.systemLanguage.tableValues.targetX.targetY.textLength.viewBox.viewTarget.xChannelSelector.yChannelSelector.zoomAndPan".split(".")).map((e) => [e.toLowerCase(), e])), na = /* @__PURE__ */ new Map([
	["xlink:actuate", {
		prefix: "xlink",
		name: "actuate",
		namespace: L.XLINK
	}],
	["xlink:arcrole", {
		prefix: "xlink",
		name: "arcrole",
		namespace: L.XLINK
	}],
	["xlink:href", {
		prefix: "xlink",
		name: "href",
		namespace: L.XLINK
	}],
	["xlink:role", {
		prefix: "xlink",
		name: "role",
		namespace: L.XLINK
	}],
	["xlink:show", {
		prefix: "xlink",
		name: "show",
		namespace: L.XLINK
	}],
	["xlink:title", {
		prefix: "xlink",
		name: "title",
		namespace: L.XLINK
	}],
	["xlink:type", {
		prefix: "xlink",
		name: "type",
		namespace: L.XLINK
	}],
	["xml:lang", {
		prefix: "xml",
		name: "lang",
		namespace: L.XML
	}],
	["xml:space", {
		prefix: "xml",
		name: "space",
		namespace: L.XML
	}],
	["xmlns", {
		prefix: "",
		name: "xmlns",
		namespace: L.XMLNS
	}],
	["xmlns:xlink", {
		prefix: "xmlns",
		name: "xlink",
		namespace: L.XMLNS
	}]
]), ra = new Map((/* @__PURE__ */ "altGlyph.altGlyphDef.altGlyphItem.animateColor.animateMotion.animateTransform.clipPath.feBlend.feColorMatrix.feComponentTransfer.feComposite.feConvolveMatrix.feDiffuseLighting.feDisplacementMap.feDistantLight.feFlood.feFuncA.feFuncB.feFuncG.feFuncR.feGaussianBlur.feImage.feMerge.feMergeNode.feMorphology.feOffset.fePointLight.feSpecularLighting.feSpotLight.feTile.feTurbulence.foreignObject.glyphRef.linearGradient.radialGradient.textPath".split(".")).map((e) => [e.toLowerCase(), e])), ia = /* @__PURE__ */ new Set([
	z.B,
	z.BIG,
	z.BLOCKQUOTE,
	z.BODY,
	z.BR,
	z.CENTER,
	z.CODE,
	z.DD,
	z.DIV,
	z.DL,
	z.DT,
	z.EM,
	z.EMBED,
	z.H1,
	z.H2,
	z.H3,
	z.H4,
	z.H5,
	z.H6,
	z.HEAD,
	z.HR,
	z.I,
	z.IMG,
	z.LI,
	z.LISTING,
	z.MENU,
	z.META,
	z.NOBR,
	z.OL,
	z.P,
	z.PRE,
	z.RUBY,
	z.S,
	z.SMALL,
	z.SPAN,
	z.STRONG,
	z.STRIKE,
	z.SUB,
	z.SUP,
	z.TABLE,
	z.TT,
	z.U,
	z.UL,
	z.VAR
]);
function aa(e) {
	let t = e.tagID;
	return t === z.FONT && e.attrs.some(({ name: e }) => e === si.COLOR || e === si.SIZE || e === si.FACE) || ia.has(t);
}
function oa(e) {
	for (let t = 0; t < e.attrs.length; t++) if (e.attrs[t].name === $i) {
		e.attrs[t].name = ea;
		break;
	}
}
function sa(e) {
	for (let t = 0; t < e.attrs.length; t++) {
		let n = ta.get(e.attrs[t].name);
		n != null && (e.attrs[t].name = n);
	}
}
function ca(e) {
	for (let t = 0; t < e.attrs.length; t++) {
		let n = na.get(e.attrs[t].name);
		n && (e.attrs[t].prefix = n.prefix, e.attrs[t].name = n.name, e.attrs[t].namespace = n.namespace);
	}
}
function la(e) {
	let t = ra.get(e.tagName);
	t != null && (e.tagName = t, e.tagID = ui(e.tagName));
}
function ua(e, t) {
	return t === L.MATHML && (e === z.MI || e === z.MO || e === z.MN || e === z.MS || e === z.MTEXT);
}
function da(e, t, n) {
	if (t === L.MATHML && e === z.ANNOTATION_XML) {
		for (let e = 0; e < n.length; e++) if (n[e].name === si.ENCODING) {
			let t = n[e].value.toLowerCase();
			return t === Qi.TEXT_HTML || t === Qi.APPLICATION_XML;
		}
	}
	return t === L.SVG && (e === z.FOREIGN_OBJECT || e === z.DESC || e === z.TITLE);
}
function fa(e, t, n, r) {
	return (!r || r === L.HTML) && da(e, t, n) || (!r || r === L.MATHML) && ua(e, t);
}
// node_modules/hast-util-raw/node_modules/parse5/dist/parser/index.js
var pa = "hidden", ma = 8, ha = 3, H;
(function(e) {
	e[e.INITIAL = 0] = "INITIAL", e[e.BEFORE_HTML = 1] = "BEFORE_HTML", e[e.BEFORE_HEAD = 2] = "BEFORE_HEAD", e[e.IN_HEAD = 3] = "IN_HEAD", e[e.IN_HEAD_NO_SCRIPT = 4] = "IN_HEAD_NO_SCRIPT", e[e.AFTER_HEAD = 5] = "AFTER_HEAD", e[e.IN_BODY = 6] = "IN_BODY", e[e.TEXT = 7] = "TEXT", e[e.IN_TABLE = 8] = "IN_TABLE", e[e.IN_TABLE_TEXT = 9] = "IN_TABLE_TEXT", e[e.IN_CAPTION = 10] = "IN_CAPTION", e[e.IN_COLUMN_GROUP = 11] = "IN_COLUMN_GROUP", e[e.IN_TABLE_BODY = 12] = "IN_TABLE_BODY", e[e.IN_ROW = 13] = "IN_ROW", e[e.IN_CELL = 14] = "IN_CELL", e[e.IN_SELECT = 15] = "IN_SELECT", e[e.IN_SELECT_IN_TABLE = 16] = "IN_SELECT_IN_TABLE", e[e.IN_TEMPLATE = 17] = "IN_TEMPLATE", e[e.AFTER_BODY = 18] = "AFTER_BODY", e[e.IN_FRAMESET = 19] = "IN_FRAMESET", e[e.AFTER_FRAMESET = 20] = "AFTER_FRAMESET", e[e.AFTER_AFTER_BODY = 21] = "AFTER_AFTER_BODY", e[e.AFTER_AFTER_FRAMESET = 22] = "AFTER_AFTER_FRAMESET";
})(H ||= {});
var ga = {
	startLine: -1,
	startCol: -1,
	startOffset: -1,
	endLine: -1,
	endCol: -1,
	endOffset: -1
}, _a = /* @__PURE__ */ new Set([
	z.TABLE,
	z.TBODY,
	z.TFOOT,
	z.THEAD,
	z.TR
]), va = {
	scriptingEnabled: !0,
	sourceCodeLocationInfo: !1,
	treeAdapter: Bi,
	onParseError: null
}, ya = class {
	constructor(e, t, n = null, r = null) {
		this.fragmentContext = n, this.scriptHandler = r, this.currentToken = null, this.stopped = !1, this.insertionMode = H.INITIAL, this.originalInsertionMode = H.INITIAL, this.headElement = null, this.formElement = null, this.currentNotInHTML = !1, this.tmplInsertionModeStack = [], this.pendingCharacterTokens = [], this.hasNonWhitespacePendingCharacterToken = !1, this.framesetOk = !0, this.skipNextNewLine = !1, this.fosterParentingEnabled = !1, this.options = {
			...va,
			...e
		}, this.treeAdapter = this.options.treeAdapter, this.onParseError = this.options.onParseError, this.onParseError && (this.options.sourceCodeLocationInfo = !0), this.document = t ?? this.treeAdapter.createDocument(), this.tokenizer = new Ci(this.options, this), this.activeFormattingElements = new zi(this.treeAdapter), this.fragmentContextID = n ? ui(this.treeAdapter.getTagName(n)) : z.UNKNOWN, this._setContextModes(n ?? this.document, this.fragmentContextID), this.openElements = new Fi(this.document, this.treeAdapter, this);
	}
	static parse(e, t) {
		let n = new this(t);
		return n.tokenizer.write(e, !0), n.document;
	}
	static getFragmentParser(e, t) {
		let n = {
			...va,
			...t
		};
		e ??= n.treeAdapter.createElement(R.TEMPLATE, L.HTML, []);
		let r = n.treeAdapter.createElement("documentmock", L.HTML, []), i = new this(n, r, e);
		return i.fragmentContextID === z.TEMPLATE && i.tmplInsertionModeStack.unshift(H.IN_TEMPLATE), i._initTokenizerForFragmentParsing(), i._insertFakeRootElement(), i._resetInsertionMode(), i._findFormInFragmentContext(), i;
	}
	getFragment() {
		let e = this.treeAdapter.getFirstChild(this.document), t = this.treeAdapter.createDocumentFragment();
		return this._adoptNodes(e, t), t;
	}
	_err(e, t, n) {
		if (!this.onParseError) return;
		let r = e.location ?? ga, i = {
			code: t,
			startLine: r.startLine,
			startCol: r.startCol,
			startOffset: r.startOffset,
			endLine: n ? r.startLine : r.endLine,
			endCol: n ? r.startCol : r.endCol,
			endOffset: n ? r.startOffset : r.endOffset
		};
		this.onParseError(i);
	}
	onItemPush(e, t, n) {
		var r, i;
		(i = (r = this.treeAdapter).onItemPush) == null || i.call(r, e), n && this.openElements.stackTop > 0 && this._setContextModes(e, t);
	}
	onItemPop(e, t) {
		var n, r;
		if (this.options.sourceCodeLocationInfo && this._setEndLocation(e, this.currentToken), (r = (n = this.treeAdapter).onItemPop) == null || r.call(n, e, this.openElements.current), t) {
			let e, t;
			this.openElements.stackTop === 0 && this.fragmentContext ? (e = this.fragmentContext, t = this.fragmentContextID) : {current: e, currentTagId: t} = this.openElements, this._setContextModes(e, t);
		}
	}
	_setContextModes(e, t) {
		let n = e === this.document || e && this.treeAdapter.getNamespaceURI(e) === L.HTML;
		this.currentNotInHTML = !n, this.tokenizer.inForeignNode = !n && e !== void 0 && t !== void 0 && !this._isIntegrationPoint(t, e);
	}
	_switchToTextParsing(e, t) {
		this._insertElement(e, L.HTML), this.tokenizer.state = t, this.originalInsertionMode = this.insertionMode, this.insertionMode = H.TEXT;
	}
	switchToPlaintextParsing() {
		this.insertionMode = H.TEXT, this.originalInsertionMode = H.IN_BODY, this.tokenizer.state = pi.PLAINTEXT;
	}
	_getAdjustedCurrentElement() {
		return this.openElements.stackTop === 0 && this.fragmentContext ? this.fragmentContext : this.openElements.current;
	}
	_findFormInFragmentContext() {
		let e = this.fragmentContext;
		for (; e;) {
			if (this.treeAdapter.getTagName(e) === R.FORM) {
				this.formElement = e;
				break;
			}
			e = this.treeAdapter.getParentNode(e);
		}
	}
	_initTokenizerForFragmentParsing() {
		if (this.fragmentContext && this.treeAdapter.getNamespaceURI(this.fragmentContext) === L.HTML) switch (this.fragmentContextID) {
			case z.TITLE:
			case z.TEXTAREA:
				this.tokenizer.state = pi.RCDATA;
				break;
			case z.STYLE:
			case z.XMP:
			case z.IFRAME:
			case z.NOEMBED:
			case z.NOFRAMES:
			case z.NOSCRIPT:
				this.tokenizer.state = pi.RAWTEXT;
				break;
			case z.SCRIPT:
				this.tokenizer.state = pi.SCRIPT_DATA;
				break;
			case z.PLAINTEXT: this.tokenizer.state = pi.PLAINTEXT;
		}
	}
	_setDocumentType(e) {
		let t = e.name || "", n = e.publicId || "", r = e.systemId || "";
		if (this.treeAdapter.setDocumentType(this.document, t, n, r), e.location) {
			let t = this.treeAdapter.getChildNodes(this.document).find((e) => this.treeAdapter.isDocumentTypeNode(e));
			t && this.treeAdapter.setNodeSourceCodeLocation(t, e.location);
		}
	}
	_attachElementToTree(e, t) {
		if (this.options.sourceCodeLocationInfo) {
			let n = t && {
				...t,
				startTag: t
			};
			this.treeAdapter.setNodeSourceCodeLocation(e, n);
		}
		if (this._shouldFosterParentOnInsertion()) this._fosterParentElement(e);
		else {
			let t = this.openElements.currentTmplContentOrNode;
			this.treeAdapter.appendChild(t ?? this.document, e);
		}
	}
	_appendElement(e, t) {
		let n = this.treeAdapter.createElement(e.tagName, t, e.attrs);
		this._attachElementToTree(n, e.location);
	}
	_insertElement(e, t) {
		let n = this.treeAdapter.createElement(e.tagName, t, e.attrs);
		this._attachElementToTree(n, e.location), this.openElements.push(n, e.tagID);
	}
	_insertFakeElement(e, t) {
		let n = this.treeAdapter.createElement(e, L.HTML, []);
		this._attachElementToTree(n, null), this.openElements.push(n, t);
	}
	_insertTemplate(e) {
		let t = this.treeAdapter.createElement(e.tagName, L.HTML, e.attrs), n = this.treeAdapter.createDocumentFragment();
		this.treeAdapter.setTemplateContent(t, n), this._attachElementToTree(t, e.location), this.openElements.push(t, e.tagID), this.options.sourceCodeLocationInfo && this.treeAdapter.setNodeSourceCodeLocation(n, null);
	}
	_insertFakeRootElement() {
		let e = this.treeAdapter.createElement(R.HTML, L.HTML, []);
		this.options.sourceCodeLocationInfo && this.treeAdapter.setNodeSourceCodeLocation(e, null), this.treeAdapter.appendChild(this.openElements.current, e), this.openElements.push(e, z.HTML);
	}
	_appendCommentNode(e, t) {
		let n = this.treeAdapter.createCommentNode(e.data);
		this.treeAdapter.appendChild(t, n), this.options.sourceCodeLocationInfo && this.treeAdapter.setNodeSourceCodeLocation(n, e.location);
	}
	_insertCharacters(e) {
		let t, n;
		if (this._shouldFosterParentOnInsertion() ? ({parent: t, beforeElement: n} = this._findFosterParentingLocation(), n ? this.treeAdapter.insertTextBefore(t, e.chars, n) : this.treeAdapter.insertText(t, e.chars)) : (t = this.openElements.currentTmplContentOrNode, this.treeAdapter.insertText(t, e.chars)), !e.location) return;
		let r = this.treeAdapter.getChildNodes(t), i = r[(n ? r.lastIndexOf(n) : r.length) - 1];
		if (this.treeAdapter.getNodeSourceCodeLocation(i)) {
			let { endLine: t, endCol: n, endOffset: r } = e.location;
			this.treeAdapter.updateNodeSourceCodeLocation(i, {
				endLine: t,
				endCol: n,
				endOffset: r
			});
		} else this.options.sourceCodeLocationInfo && this.treeAdapter.setNodeSourceCodeLocation(i, e.location);
	}
	_adoptNodes(e, t) {
		for (let n = this.treeAdapter.getFirstChild(e); n; n = this.treeAdapter.getFirstChild(e)) this.treeAdapter.detachNode(n), this.treeAdapter.appendChild(t, n);
	}
	_setEndLocation(e, t) {
		if (this.treeAdapter.getNodeSourceCodeLocation(e) && t.location) {
			let n = t.location, r = this.treeAdapter.getTagName(e), i = t.type === I.END_TAG && r === t.tagName ? {
				endTag: { ...n },
				endLine: n.endLine,
				endCol: n.endCol,
				endOffset: n.endOffset
			} : {
				endLine: n.startLine,
				endCol: n.startCol,
				endOffset: n.startOffset
			};
			this.treeAdapter.updateNodeSourceCodeLocation(e, i);
		}
	}
	shouldProcessStartTagTokenInForeignContent(e) {
		if (!this.currentNotInHTML) return !1;
		let t, n;
		return this.openElements.stackTop === 0 && this.fragmentContext ? (t = this.fragmentContext, n = this.fragmentContextID) : {current: t, currentTagId: n} = this.openElements, e.tagID === z.SVG && this.treeAdapter.getTagName(t) === R.ANNOTATION_XML && this.treeAdapter.getNamespaceURI(t) === L.MATHML ? !1 : this.tokenizer.inForeignNode || (e.tagID === z.MGLYPH || e.tagID === z.MALIGNMARK) && n !== void 0 && !this._isIntegrationPoint(n, t, L.HTML);
	}
	_processToken(e) {
		switch (e.type) {
			case I.CHARACTER:
				this.onCharacter(e);
				break;
			case I.NULL_CHARACTER:
				this.onNullCharacter(e);
				break;
			case I.COMMENT:
				this.onComment(e);
				break;
			case I.DOCTYPE:
				this.onDoctype(e);
				break;
			case I.START_TAG:
				this._processStartTag(e);
				break;
			case I.END_TAG:
				this.onEndTag(e);
				break;
			case I.EOF:
				this.onEof(e);
				break;
			case I.WHITESPACE_CHARACTER: this.onWhitespaceCharacter(e);
		}
	}
	_isIntegrationPoint(e, t, n) {
		return fa(e, this.treeAdapter.getNamespaceURI(t), this.treeAdapter.getAttrList(t), n);
	}
	_reconstructActiveFormattingElements() {
		let e = this.activeFormattingElements.entries.length;
		if (e) {
			let t = this.activeFormattingElements.entries.findIndex((e) => e.type === Li.Marker || this.openElements.contains(e.element)), n = t === -1 ? e - 1 : t - 1;
			for (let e = n; e >= 0; e--) {
				let t = this.activeFormattingElements.entries[e];
				this._insertElement(t.token, this.treeAdapter.getNamespaceURI(t.element)), t.element = this.openElements.current;
			}
		}
	}
	_closeTableCell() {
		this.openElements.generateImpliedEndTags(), this.openElements.popUntilTableCellPopped(), this.activeFormattingElements.clearToLastMarker(), this.insertionMode = H.IN_ROW;
	}
	_closePElement() {
		this.openElements.generateImpliedEndTagsWithExclusion(z.P), this.openElements.popUntilTagNamePopped(z.P);
	}
	_resetInsertionMode() {
		for (let e = this.openElements.stackTop; e >= 0; e--) switch (e === 0 && this.fragmentContext ? this.fragmentContextID : this.openElements.tagIDs[e]) {
			case z.TR:
				this.insertionMode = H.IN_ROW;
				return;
			case z.TBODY:
			case z.THEAD:
			case z.TFOOT:
				this.insertionMode = H.IN_TABLE_BODY;
				return;
			case z.CAPTION:
				this.insertionMode = H.IN_CAPTION;
				return;
			case z.COLGROUP:
				this.insertionMode = H.IN_COLUMN_GROUP;
				return;
			case z.TABLE:
				this.insertionMode = H.IN_TABLE;
				return;
			case z.BODY:
				this.insertionMode = H.IN_BODY;
				return;
			case z.FRAMESET:
				this.insertionMode = H.IN_FRAMESET;
				return;
			case z.SELECT:
				this._resetInsertionModeForSelect(e);
				return;
			case z.TEMPLATE:
				this.insertionMode = this.tmplInsertionModeStack[0];
				return;
			case z.HTML:
				this.insertionMode = this.headElement ? H.AFTER_HEAD : H.BEFORE_HEAD;
				return;
			case z.TD:
			case z.TH:
				if (e > 0) {
					this.insertionMode = H.IN_CELL;
					return;
				}
				break;
			case z.HEAD: if (e > 0) {
				this.insertionMode = H.IN_HEAD;
				return;
			}
		}
		this.insertionMode = H.IN_BODY;
	}
	_resetInsertionModeForSelect(e) {
		if (e > 0) for (let t = e - 1; t > 0; t--) {
			let e = this.openElements.tagIDs[t];
			if (e === z.TEMPLATE) break;
			if (e === z.TABLE) {
				this.insertionMode = H.IN_SELECT_IN_TABLE;
				return;
			}
		}
		this.insertionMode = H.IN_SELECT;
	}
	_isElementCausesFosterParenting(e) {
		return _a.has(e);
	}
	_shouldFosterParentOnInsertion() {
		return this.fosterParentingEnabled && this.openElements.currentTagId !== void 0 && this._isElementCausesFosterParenting(this.openElements.currentTagId);
	}
	_findFosterParentingLocation() {
		for (let e = this.openElements.stackTop; e >= 0; e--) {
			let t = this.openElements.items[e];
			switch (this.openElements.tagIDs[e]) {
				case z.TEMPLATE:
					if (this.treeAdapter.getNamespaceURI(t) === L.HTML) return {
						parent: this.treeAdapter.getTemplateContent(t),
						beforeElement: null
					};
					break;
				case z.TABLE: {
					let n = this.treeAdapter.getParentNode(t);
					return n ? {
						parent: n,
						beforeElement: t
					} : {
						parent: this.openElements.items[e - 1],
						beforeElement: null
					};
				}
			}
		}
		return {
			parent: this.openElements.items[0],
			beforeElement: null
		};
	}
	_fosterParentElement(e) {
		let t = this._findFosterParentingLocation();
		t.beforeElement ? this.treeAdapter.insertBefore(t.parent, e, t.beforeElement) : this.treeAdapter.appendChild(t.parent, e);
	}
	_isSpecialElement(e, t) {
		return di[this.treeAdapter.getNamespaceURI(e)].has(t);
	}
	onCharacter(e) {
		if (this.skipNextNewLine = !1, this.tokenizer.inForeignNode) Rs(this, e);
		else switch (this.insertionMode) {
			case H.INITIAL:
				Ma(this, e);
				break;
			case H.BEFORE_HTML:
				Fa(this, e);
				break;
			case H.BEFORE_HEAD:
				Ra(this, e);
				break;
			case H.IN_HEAD:
				Ha(this, e);
				break;
			case H.IN_HEAD_NO_SCRIPT:
				Ga(this, e);
				break;
			case H.AFTER_HEAD:
				Ja(this, e);
				break;
			case H.IN_BODY:
			case H.IN_CAPTION:
			case H.IN_CELL:
			case H.IN_TEMPLATE:
				Za(this, e);
				break;
			case H.TEXT:
			case H.IN_SELECT:
			case H.IN_SELECT_IN_TABLE:
				this._insertCharacters(e);
				break;
			case H.IN_TABLE:
			case H.IN_TABLE_BODY:
			case H.IN_ROW:
				qo(this, e);
				break;
			case H.IN_TABLE_TEXT:
				os(this, e);
				break;
			case H.IN_COLUMN_GROUP:
				ps(this, e);
				break;
			case H.AFTER_BODY:
				ks(this, e);
				break;
			case H.AFTER_AFTER_BODY: Fs(this, e);
		}
	}
	onNullCharacter(e) {
		if (this.skipNextNewLine = !1, this.tokenizer.inForeignNode) Ls(this, e);
		else switch (this.insertionMode) {
			case H.INITIAL:
				Ma(this, e);
				break;
			case H.BEFORE_HTML:
				Fa(this, e);
				break;
			case H.BEFORE_HEAD:
				Ra(this, e);
				break;
			case H.IN_HEAD:
				Ha(this, e);
				break;
			case H.IN_HEAD_NO_SCRIPT:
				Ga(this, e);
				break;
			case H.AFTER_HEAD:
				Ja(this, e);
				break;
			case H.TEXT:
				this._insertCharacters(e);
				break;
			case H.IN_TABLE:
			case H.IN_TABLE_BODY:
			case H.IN_ROW:
				qo(this, e);
				break;
			case H.IN_COLUMN_GROUP:
				ps(this, e);
				break;
			case H.AFTER_BODY:
				ks(this, e);
				break;
			case H.AFTER_AFTER_BODY: Fs(this, e);
		}
	}
	onComment(e) {
		if (this.skipNextNewLine = !1, this.currentNotInHTML) Da(this, e);
		else switch (this.insertionMode) {
			case H.INITIAL:
			case H.BEFORE_HTML:
			case H.BEFORE_HEAD:
			case H.IN_HEAD:
			case H.IN_HEAD_NO_SCRIPT:
			case H.AFTER_HEAD:
			case H.IN_BODY:
			case H.IN_TABLE:
			case H.IN_CAPTION:
			case H.IN_COLUMN_GROUP:
			case H.IN_TABLE_BODY:
			case H.IN_ROW:
			case H.IN_CELL:
			case H.IN_SELECT:
			case H.IN_SELECT_IN_TABLE:
			case H.IN_TEMPLATE:
			case H.IN_FRAMESET:
			case H.AFTER_FRAMESET:
				Da(this, e);
				break;
			case H.IN_TABLE_TEXT:
				ss(this, e);
				break;
			case H.AFTER_BODY:
				Oa(this, e);
				break;
			case H.AFTER_AFTER_BODY:
			case H.AFTER_AFTER_FRAMESET: ka(this, e);
		}
	}
	onDoctype(e) {
		switch (this.skipNextNewLine = !1, this.insertionMode) {
			case H.INITIAL:
				ja(this, e);
				break;
			case H.BEFORE_HEAD:
			case H.IN_HEAD:
			case H.IN_HEAD_NO_SCRIPT:
			case H.AFTER_HEAD:
				this._err(e, F.misplacedDoctype);
				break;
			case H.IN_TABLE_TEXT: ss(this, e);
		}
	}
	onStartTag(e) {
		this.skipNextNewLine = !1, this.currentToken = e, this._processStartTag(e), e.selfClosing && !e.ackSelfClosing && this._err(e, F.nonVoidHtmlElementStartTagWithTrailingSolidus);
	}
	_processStartTag(e) {
		this.shouldProcessStartTagTokenInForeignContent(e) ? Bs(this, e) : this._startTagOutsideForeignContent(e);
	}
	_startTagOutsideForeignContent(e) {
		switch (this.insertionMode) {
			case H.INITIAL:
				Ma(this, e);
				break;
			case H.BEFORE_HTML:
				Na(this, e);
				break;
			case H.BEFORE_HEAD:
				Ia(this, e);
				break;
			case H.IN_HEAD:
				za(this, e);
				break;
			case H.IN_HEAD_NO_SCRIPT:
				Ua(this, e);
				break;
			case H.AFTER_HEAD:
				Ka(this, e);
				break;
			case H.IN_BODY:
				jo(this, e);
				break;
			case H.IN_TABLE:
				ns(this, e);
				break;
			case H.IN_TABLE_TEXT:
				ss(this, e);
				break;
			case H.IN_CAPTION:
				ls(this, e);
				break;
			case H.IN_COLUMN_GROUP:
				ds(this, e);
				break;
			case H.IN_TABLE_BODY:
				ms(this, e);
				break;
			case H.IN_ROW:
				gs(this, e);
				break;
			case H.IN_CELL:
				vs(this, e);
				break;
			case H.IN_SELECT:
				bs(this, e);
				break;
			case H.IN_SELECT_IN_TABLE:
				Ss(this, e);
				break;
			case H.IN_TEMPLATE:
				ws(this, e);
				break;
			case H.AFTER_BODY:
				Ds(this, e);
				break;
			case H.IN_FRAMESET:
				As(this, e);
				break;
			case H.AFTER_FRAMESET:
				Ms(this, e);
				break;
			case H.AFTER_AFTER_BODY:
				Ps(this, e);
				break;
			case H.AFTER_AFTER_FRAMESET: Is(this, e);
		}
	}
	onEndTag(e) {
		this.skipNextNewLine = !1, this.currentToken = e, this.currentNotInHTML ? Vs(this, e) : this._endTagOutsideForeignContent(e);
	}
	_endTagOutsideForeignContent(e) {
		switch (this.insertionMode) {
			case H.INITIAL:
				Ma(this, e);
				break;
			case H.BEFORE_HTML:
				Pa(this, e);
				break;
			case H.BEFORE_HEAD:
				La(this, e);
				break;
			case H.IN_HEAD:
				Ba(this, e);
				break;
			case H.IN_HEAD_NO_SCRIPT:
				Wa(this, e);
				break;
			case H.AFTER_HEAD:
				qa(this, e);
				break;
			case H.IN_BODY:
				Uo(this, e);
				break;
			case H.TEXT:
				Go(this, e);
				break;
			case H.IN_TABLE:
				rs(this, e);
				break;
			case H.IN_TABLE_TEXT:
				ss(this, e);
				break;
			case H.IN_CAPTION:
				us(this, e);
				break;
			case H.IN_COLUMN_GROUP:
				fs(this, e);
				break;
			case H.IN_TABLE_BODY:
				hs(this, e);
				break;
			case H.IN_ROW:
				_s(this, e);
				break;
			case H.IN_CELL:
				ys(this, e);
				break;
			case H.IN_SELECT:
				xs(this, e);
				break;
			case H.IN_SELECT_IN_TABLE:
				Cs(this, e);
				break;
			case H.IN_TEMPLATE:
				Ts(this, e);
				break;
			case H.AFTER_BODY:
				Os(this, e);
				break;
			case H.IN_FRAMESET:
				js(this, e);
				break;
			case H.AFTER_FRAMESET:
				Ns(this, e);
				break;
			case H.AFTER_AFTER_BODY: Fs(this, e);
		}
	}
	onEof(e) {
		switch (this.insertionMode) {
			case H.INITIAL:
				Ma(this, e);
				break;
			case H.BEFORE_HTML:
				Fa(this, e);
				break;
			case H.BEFORE_HEAD:
				Ra(this, e);
				break;
			case H.IN_HEAD:
				Ha(this, e);
				break;
			case H.IN_HEAD_NO_SCRIPT:
				Ga(this, e);
				break;
			case H.AFTER_HEAD:
				Ja(this, e);
				break;
			case H.IN_BODY:
			case H.IN_TABLE:
			case H.IN_CAPTION:
			case H.IN_COLUMN_GROUP:
			case H.IN_TABLE_BODY:
			case H.IN_ROW:
			case H.IN_CELL:
			case H.IN_SELECT:
			case H.IN_SELECT_IN_TABLE:
				Wo(this, e);
				break;
			case H.TEXT:
				Ko(this, e);
				break;
			case H.IN_TABLE_TEXT:
				ss(this, e);
				break;
			case H.IN_TEMPLATE:
				Es(this, e);
				break;
			case H.AFTER_BODY:
			case H.IN_FRAMESET:
			case H.AFTER_FRAMESET:
			case H.AFTER_AFTER_BODY:
			case H.AFTER_AFTER_FRAMESET: Aa(this, e);
		}
	}
	onWhitespaceCharacter(e) {
		if (this.skipNextNewLine && (this.skipNextNewLine = !1, e.chars.charCodeAt(0) === P.LINE_FEED)) {
			if (e.chars.length === 1) return;
			e.chars = e.chars.substr(1);
		}
		if (this.tokenizer.inForeignNode) this._insertCharacters(e);
		else switch (this.insertionMode) {
			case H.IN_HEAD:
			case H.IN_HEAD_NO_SCRIPT:
			case H.AFTER_HEAD:
			case H.TEXT:
			case H.IN_COLUMN_GROUP:
			case H.IN_SELECT:
			case H.IN_SELECT_IN_TABLE:
			case H.IN_FRAMESET:
			case H.AFTER_FRAMESET:
				this._insertCharacters(e);
				break;
			case H.IN_BODY:
			case H.IN_CAPTION:
			case H.IN_CELL:
			case H.IN_TEMPLATE:
			case H.AFTER_BODY:
			case H.AFTER_AFTER_BODY:
			case H.AFTER_AFTER_FRAMESET:
				Xa(this, e);
				break;
			case H.IN_TABLE:
			case H.IN_TABLE_BODY:
			case H.IN_ROW:
				qo(this, e);
				break;
			case H.IN_TABLE_TEXT: as(this, e);
		}
	}
};
function ba(e, t) {
	let n = e.activeFormattingElements.getElementEntryInScopeWithTagName(t.tagName);
	return n ? e.openElements.contains(n.element) ? e.openElements.hasInScope(t.tagID) || (n = null) : (e.activeFormattingElements.removeEntry(n), n = null) : Ho(e, t), n;
}
function xa(e, t) {
	let n = null, r = e.openElements.stackTop;
	for (; r >= 0; r--) {
		let i = e.openElements.items[r];
		if (i === t.element) break;
		e._isSpecialElement(i, e.openElements.tagIDs[r]) && (n = i);
	}
	return n || (e.openElements.shortenToLength(Math.max(r, 0)), e.activeFormattingElements.removeEntry(t)), n;
}
function Sa(e, t, n) {
	let r = t, i = e.openElements.getCommonAncestor(t);
	for (let a = 0, o = i; o !== n; a++, o = i) {
		i = e.openElements.getCommonAncestor(o);
		let n = e.activeFormattingElements.getElementEntry(o), s = n && a >= ha;
		!n || s ? (s && e.activeFormattingElements.removeEntry(n), e.openElements.remove(o)) : (o = Ca(e, n), r === t && (e.activeFormattingElements.bookmark = n), e.treeAdapter.detachNode(r), e.treeAdapter.appendChild(o, r), r = o);
	}
	return r;
}
function Ca(e, t) {
	let n = e.treeAdapter.getNamespaceURI(t.element), r = e.treeAdapter.createElement(t.token.tagName, n, t.token.attrs);
	return e.openElements.replace(t.element, r), t.element = r, r;
}
function wa(e, t, n) {
	let r = ui(e.treeAdapter.getTagName(t));
	if (e._isElementCausesFosterParenting(r)) e._fosterParentElement(n);
	else {
		let i = e.treeAdapter.getNamespaceURI(t);
		r === z.TEMPLATE && i === L.HTML && (t = e.treeAdapter.getTemplateContent(t)), e.treeAdapter.appendChild(t, n);
	}
}
function Ta(e, t, n) {
	let r = e.treeAdapter.getNamespaceURI(n.element), { token: i } = n, a = e.treeAdapter.createElement(i.tagName, r, i.attrs);
	e._adoptNodes(t, a), e.treeAdapter.appendChild(t, a), e.activeFormattingElements.insertElementAfterBookmark(a, i), e.activeFormattingElements.removeEntry(n), e.openElements.remove(n.element), e.openElements.insertAfter(t, a, i.tagID);
}
function Ea(e, t) {
	for (let n = 0; n < ma; n++) {
		let n = ba(e, t);
		if (!n) break;
		let r = xa(e, n);
		if (!r) break;
		e.activeFormattingElements.bookmark = n;
		let i = Sa(e, r, n.element), a = e.openElements.getCommonAncestor(n.element);
		e.treeAdapter.detachNode(i), a && wa(e, a, i), Ta(e, r, n);
	}
}
function Da(e, t) {
	e._appendCommentNode(t, e.openElements.currentTmplContentOrNode);
}
function Oa(e, t) {
	e._appendCommentNode(t, e.openElements.items[0]);
}
function ka(e, t) {
	e._appendCommentNode(t, e.document);
}
function Aa(e, t) {
	if (e.stopped = !0, t.location) {
		let n = e.fragmentContext ? 0 : 2;
		for (let r = e.openElements.stackTop; r >= n; r--) e._setEndLocation(e.openElements.items[r], t);
		if (!e.fragmentContext && e.openElements.stackTop >= 0) {
			let n = e.openElements.items[0], r = e.treeAdapter.getNodeSourceCodeLocation(n);
			if (r && !r.endTag && (e._setEndLocation(n, t), e.openElements.stackTop >= 1)) {
				let n = e.openElements.items[1], r = e.treeAdapter.getNodeSourceCodeLocation(n);
				r && !r.endTag && e._setEndLocation(n, t);
			}
		}
	}
}
function ja(e, t) {
	e._setDocumentType(t);
	let n = t.forceQuirks ? ci.QUIRKS : Zi(t);
	Xi(t) || e._err(t, F.nonConformingDoctype), e.treeAdapter.setDocumentMode(e.document, n), e.insertionMode = H.BEFORE_HTML;
}
function Ma(e, t) {
	e._err(t, F.missingDoctype, !0), e.treeAdapter.setDocumentMode(e.document, ci.QUIRKS), e.insertionMode = H.BEFORE_HTML, e._processToken(t);
}
function Na(e, t) {
	t.tagID === z.HTML ? (e._insertElement(t, L.HTML), e.insertionMode = H.BEFORE_HEAD) : Fa(e, t);
}
function Pa(e, t) {
	let n = t.tagID;
	(n === z.HTML || n === z.HEAD || n === z.BODY || n === z.BR) && Fa(e, t);
}
function Fa(e, t) {
	e._insertFakeRootElement(), e.insertionMode = H.BEFORE_HEAD, e._processToken(t);
}
function Ia(e, t) {
	switch (t.tagID) {
		case z.HTML:
			jo(e, t);
			break;
		case z.HEAD:
			e._insertElement(t, L.HTML), e.headElement = e.openElements.current, e.insertionMode = H.IN_HEAD;
			break;
		default: Ra(e, t);
	}
}
function La(e, t) {
	let n = t.tagID;
	n === z.HEAD || n === z.BODY || n === z.HTML || n === z.BR ? Ra(e, t) : e._err(t, F.endTagWithoutMatchingOpenElement);
}
function Ra(e, t) {
	e._insertFakeElement(R.HEAD, z.HEAD), e.headElement = e.openElements.current, e.insertionMode = H.IN_HEAD, e._processToken(t);
}
function za(e, t) {
	switch (t.tagID) {
		case z.HTML:
			jo(e, t);
			break;
		case z.BASE:
		case z.BASEFONT:
		case z.BGSOUND:
		case z.LINK:
		case z.META:
			e._appendElement(t, L.HTML), t.ackSelfClosing = !0;
			break;
		case z.TITLE:
			e._switchToTextParsing(t, pi.RCDATA);
			break;
		case z.NOSCRIPT:
			e.options.scriptingEnabled ? e._switchToTextParsing(t, pi.RAWTEXT) : (e._insertElement(t, L.HTML), e.insertionMode = H.IN_HEAD_NO_SCRIPT);
			break;
		case z.NOFRAMES:
		case z.STYLE:
			e._switchToTextParsing(t, pi.RAWTEXT);
			break;
		case z.SCRIPT:
			e._switchToTextParsing(t, pi.SCRIPT_DATA);
			break;
		case z.TEMPLATE:
			e._insertTemplate(t), e.activeFormattingElements.insertMarker(), e.framesetOk = !1, e.insertionMode = H.IN_TEMPLATE, e.tmplInsertionModeStack.unshift(H.IN_TEMPLATE);
			break;
		case z.HEAD:
			e._err(t, F.misplacedStartTagForHeadElement);
			break;
		default: Ha(e, t);
	}
}
function Ba(e, t) {
	switch (t.tagID) {
		case z.HEAD:
			e.openElements.pop(), e.insertionMode = H.AFTER_HEAD;
			break;
		case z.BODY:
		case z.BR:
		case z.HTML:
			Ha(e, t);
			break;
		case z.TEMPLATE:
			Va(e, t);
			break;
		default: e._err(t, F.endTagWithoutMatchingOpenElement);
	}
}
function Va(e, t) {
	e.openElements.tmplCount > 0 ? (e.openElements.generateImpliedEndTagsThoroughly(), e.openElements.currentTagId !== z.TEMPLATE && e._err(t, F.closingOfElementWithOpenChildElements), e.openElements.popUntilTagNamePopped(z.TEMPLATE), e.activeFormattingElements.clearToLastMarker(), e.tmplInsertionModeStack.shift(), e._resetInsertionMode()) : e._err(t, F.endTagWithoutMatchingOpenElement);
}
function Ha(e, t) {
	e.openElements.pop(), e.insertionMode = H.AFTER_HEAD, e._processToken(t);
}
function Ua(e, t) {
	switch (t.tagID) {
		case z.HTML:
			jo(e, t);
			break;
		case z.BASEFONT:
		case z.BGSOUND:
		case z.HEAD:
		case z.LINK:
		case z.META:
		case z.NOFRAMES:
		case z.STYLE:
			za(e, t);
			break;
		case z.NOSCRIPT:
			e._err(t, F.nestedNoscriptInHead);
			break;
		default: Ga(e, t);
	}
}
function Wa(e, t) {
	switch (t.tagID) {
		case z.NOSCRIPT:
			e.openElements.pop(), e.insertionMode = H.IN_HEAD;
			break;
		case z.BR:
			Ga(e, t);
			break;
		default: e._err(t, F.endTagWithoutMatchingOpenElement);
	}
}
function Ga(e, t) {
	let n = t.type === I.EOF ? F.openElementsLeftAfterEof : F.disallowedContentInNoscriptInHead;
	e._err(t, n), e.openElements.pop(), e.insertionMode = H.IN_HEAD, e._processToken(t);
}
function Ka(e, t) {
	switch (t.tagID) {
		case z.HTML:
			jo(e, t);
			break;
		case z.BODY:
			e._insertElement(t, L.HTML), e.framesetOk = !1, e.insertionMode = H.IN_BODY;
			break;
		case z.FRAMESET:
			e._insertElement(t, L.HTML), e.insertionMode = H.IN_FRAMESET;
			break;
		case z.BASE:
		case z.BASEFONT:
		case z.BGSOUND:
		case z.LINK:
		case z.META:
		case z.NOFRAMES:
		case z.SCRIPT:
		case z.STYLE:
		case z.TEMPLATE:
		case z.TITLE:
			e._err(t, F.abandonedHeadElementChild), e.openElements.push(e.headElement, z.HEAD), za(e, t), e.openElements.remove(e.headElement);
			break;
		case z.HEAD:
			e._err(t, F.misplacedStartTagForHeadElement);
			break;
		default: Ja(e, t);
	}
}
function qa(e, t) {
	switch (t.tagID) {
		case z.BODY:
		case z.HTML:
		case z.BR:
			Ja(e, t);
			break;
		case z.TEMPLATE:
			Va(e, t);
			break;
		default: e._err(t, F.endTagWithoutMatchingOpenElement);
	}
}
function Ja(e, t) {
	e._insertFakeElement(R.BODY, z.BODY), e.insertionMode = H.IN_BODY, Ya(e, t);
}
function Ya(e, t) {
	switch (t.type) {
		case I.CHARACTER:
			Za(e, t);
			break;
		case I.WHITESPACE_CHARACTER:
			Xa(e, t);
			break;
		case I.COMMENT:
			Da(e, t);
			break;
		case I.START_TAG:
			jo(e, t);
			break;
		case I.END_TAG:
			Uo(e, t);
			break;
		case I.EOF: Wo(e, t);
	}
}
function Xa(e, t) {
	e._reconstructActiveFormattingElements(), e._insertCharacters(t);
}
function Za(e, t) {
	e._reconstructActiveFormattingElements(), e._insertCharacters(t), e.framesetOk = !1;
}
function Qa(e, t) {
	e.openElements.tmplCount === 0 && e.treeAdapter.adoptAttributes(e.openElements.items[0], t.attrs);
}
function $a(e, t) {
	let n = e.openElements.tryPeekProperlyNestedBodyElement();
	n && e.openElements.tmplCount === 0 && (e.framesetOk = !1, e.treeAdapter.adoptAttributes(n, t.attrs));
}
function eo(e, t) {
	let n = e.openElements.tryPeekProperlyNestedBodyElement();
	e.framesetOk && n && (e.treeAdapter.detachNode(n), e.openElements.popAllUpToHtmlElement(), e._insertElement(t, L.HTML), e.insertionMode = H.IN_FRAMESET);
}
function to(e, t) {
	e.openElements.hasInButtonScope(z.P) && e._closePElement(), e._insertElement(t, L.HTML);
}
function no(e, t) {
	e.openElements.hasInButtonScope(z.P) && e._closePElement(), e.openElements.currentTagId !== void 0 && fi.has(e.openElements.currentTagId) && e.openElements.pop(), e._insertElement(t, L.HTML);
}
function ro(e, t) {
	e.openElements.hasInButtonScope(z.P) && e._closePElement(), e._insertElement(t, L.HTML), e.skipNextNewLine = !0, e.framesetOk = !1;
}
function io(e, t) {
	let n = e.openElements.tmplCount > 0;
	(!e.formElement || n) && (e.openElements.hasInButtonScope(z.P) && e._closePElement(), e._insertElement(t, L.HTML), n || (e.formElement = e.openElements.current));
}
function ao(e, t) {
	e.framesetOk = !1;
	let n = t.tagID;
	for (let t = e.openElements.stackTop; t >= 0; t--) {
		let r = e.openElements.tagIDs[t];
		if (n === z.LI && r === z.LI || (n === z.DD || n === z.DT) && (r === z.DD || r === z.DT)) {
			e.openElements.generateImpliedEndTagsWithExclusion(r), e.openElements.popUntilTagNamePopped(r);
			break;
		}
		if (r !== z.ADDRESS && r !== z.DIV && r !== z.P && e._isSpecialElement(e.openElements.items[t], r)) break;
	}
	e.openElements.hasInButtonScope(z.P) && e._closePElement(), e._insertElement(t, L.HTML);
}
function oo(e, t) {
	e.openElements.hasInButtonScope(z.P) && e._closePElement(), e._insertElement(t, L.HTML), e.tokenizer.state = pi.PLAINTEXT;
}
function so(e, t) {
	e.openElements.hasInScope(z.BUTTON) && (e.openElements.generateImpliedEndTags(), e.openElements.popUntilTagNamePopped(z.BUTTON)), e._reconstructActiveFormattingElements(), e._insertElement(t, L.HTML), e.framesetOk = !1;
}
function co(e, t) {
	let n = e.activeFormattingElements.getElementEntryInScopeWithTagName(R.A);
	n && (Ea(e, t), e.openElements.remove(n.element), e.activeFormattingElements.removeEntry(n)), e._reconstructActiveFormattingElements(), e._insertElement(t, L.HTML), e.activeFormattingElements.pushElement(e.openElements.current, t);
}
function lo(e, t) {
	e._reconstructActiveFormattingElements(), e._insertElement(t, L.HTML), e.activeFormattingElements.pushElement(e.openElements.current, t);
}
function uo(e, t) {
	e._reconstructActiveFormattingElements(), e.openElements.hasInScope(z.NOBR) && (Ea(e, t), e._reconstructActiveFormattingElements()), e._insertElement(t, L.HTML), e.activeFormattingElements.pushElement(e.openElements.current, t);
}
function fo(e, t) {
	e._reconstructActiveFormattingElements(), e._insertElement(t, L.HTML), e.activeFormattingElements.insertMarker(), e.framesetOk = !1;
}
function po(e, t) {
	e.treeAdapter.getDocumentMode(e.document) !== ci.QUIRKS && e.openElements.hasInButtonScope(z.P) && e._closePElement(), e._insertElement(t, L.HTML), e.framesetOk = !1, e.insertionMode = H.IN_TABLE;
}
function mo(e, t) {
	e._reconstructActiveFormattingElements(), e._appendElement(t, L.HTML), e.framesetOk = !1, t.ackSelfClosing = !0;
}
function ho(e) {
	let t = Kr(e, si.TYPE);
	return t != null && t.toLowerCase() === pa;
}
function go(e, t) {
	e._reconstructActiveFormattingElements(), e._appendElement(t, L.HTML), ho(t) || (e.framesetOk = !1), t.ackSelfClosing = !0;
}
function _o(e, t) {
	e._appendElement(t, L.HTML), t.ackSelfClosing = !0;
}
function vo(e, t) {
	e.openElements.hasInButtonScope(z.P) && e._closePElement(), e._appendElement(t, L.HTML), e.framesetOk = !1, t.ackSelfClosing = !0;
}
function yo(e, t) {
	t.tagName = R.IMG, t.tagID = z.IMG, mo(e, t);
}
function bo(e, t) {
	e._insertElement(t, L.HTML), e.skipNextNewLine = !0, e.tokenizer.state = pi.RCDATA, e.originalInsertionMode = e.insertionMode, e.framesetOk = !1, e.insertionMode = H.TEXT;
}
function xo(e, t) {
	e.openElements.hasInButtonScope(z.P) && e._closePElement(), e._reconstructActiveFormattingElements(), e.framesetOk = !1, e._switchToTextParsing(t, pi.RAWTEXT);
}
function So(e, t) {
	e.framesetOk = !1, e._switchToTextParsing(t, pi.RAWTEXT);
}
function Co(e, t) {
	e._switchToTextParsing(t, pi.RAWTEXT);
}
function wo(e, t) {
	e._reconstructActiveFormattingElements(), e._insertElement(t, L.HTML), e.framesetOk = !1, e.insertionMode = e.insertionMode === H.IN_TABLE || e.insertionMode === H.IN_CAPTION || e.insertionMode === H.IN_TABLE_BODY || e.insertionMode === H.IN_ROW || e.insertionMode === H.IN_CELL ? H.IN_SELECT_IN_TABLE : H.IN_SELECT;
}
function To(e, t) {
	e.openElements.currentTagId === z.OPTION && e.openElements.pop(), e._reconstructActiveFormattingElements(), e._insertElement(t, L.HTML);
}
function Eo(e, t) {
	e.openElements.hasInScope(z.RUBY) && e.openElements.generateImpliedEndTags(), e._insertElement(t, L.HTML);
}
function Do(e, t) {
	e.openElements.hasInScope(z.RUBY) && e.openElements.generateImpliedEndTagsWithExclusion(z.RTC), e._insertElement(t, L.HTML);
}
function Oo(e, t) {
	e._reconstructActiveFormattingElements(), oa(t), ca(t), t.selfClosing ? e._appendElement(t, L.MATHML) : e._insertElement(t, L.MATHML), t.ackSelfClosing = !0;
}
function ko(e, t) {
	e._reconstructActiveFormattingElements(), sa(t), ca(t), t.selfClosing ? e._appendElement(t, L.SVG) : e._insertElement(t, L.SVG), t.ackSelfClosing = !0;
}
function Ao(e, t) {
	e._reconstructActiveFormattingElements(), e._insertElement(t, L.HTML);
}
function jo(e, t) {
	switch (t.tagID) {
		case z.I:
		case z.S:
		case z.B:
		case z.U:
		case z.EM:
		case z.TT:
		case z.BIG:
		case z.CODE:
		case z.FONT:
		case z.SMALL:
		case z.STRIKE:
		case z.STRONG:
			lo(e, t);
			break;
		case z.A:
			co(e, t);
			break;
		case z.H1:
		case z.H2:
		case z.H3:
		case z.H4:
		case z.H5:
		case z.H6:
			no(e, t);
			break;
		case z.P:
		case z.DL:
		case z.OL:
		case z.UL:
		case z.DIV:
		case z.DIR:
		case z.NAV:
		case z.MAIN:
		case z.MENU:
		case z.ASIDE:
		case z.CENTER:
		case z.FIGURE:
		case z.FOOTER:
		case z.HEADER:
		case z.HGROUP:
		case z.DIALOG:
		case z.DETAILS:
		case z.ADDRESS:
		case z.ARTICLE:
		case z.SEARCH:
		case z.SECTION:
		case z.SUMMARY:
		case z.FIELDSET:
		case z.BLOCKQUOTE:
		case z.FIGCAPTION:
			to(e, t);
			break;
		case z.LI:
		case z.DD:
		case z.DT:
			ao(e, t);
			break;
		case z.BR:
		case z.IMG:
		case z.WBR:
		case z.AREA:
		case z.EMBED:
		case z.KEYGEN:
			mo(e, t);
			break;
		case z.HR:
			vo(e, t);
			break;
		case z.RB:
		case z.RTC:
			Eo(e, t);
			break;
		case z.RT:
		case z.RP:
			Do(e, t);
			break;
		case z.PRE:
		case z.LISTING:
			ro(e, t);
			break;
		case z.XMP:
			xo(e, t);
			break;
		case z.SVG:
			ko(e, t);
			break;
		case z.HTML:
			Qa(e, t);
			break;
		case z.BASE:
		case z.LINK:
		case z.META:
		case z.STYLE:
		case z.TITLE:
		case z.SCRIPT:
		case z.BGSOUND:
		case z.BASEFONT:
		case z.TEMPLATE:
			za(e, t);
			break;
		case z.BODY:
			$a(e, t);
			break;
		case z.FORM:
			io(e, t);
			break;
		case z.NOBR:
			uo(e, t);
			break;
		case z.MATH:
			Oo(e, t);
			break;
		case z.TABLE:
			po(e, t);
			break;
		case z.INPUT:
			go(e, t);
			break;
		case z.PARAM:
		case z.TRACK:
		case z.SOURCE:
			_o(e, t);
			break;
		case z.IMAGE:
			yo(e, t);
			break;
		case z.BUTTON:
			so(e, t);
			break;
		case z.APPLET:
		case z.OBJECT:
		case z.MARQUEE:
			fo(e, t);
			break;
		case z.IFRAME:
			So(e, t);
			break;
		case z.SELECT:
			wo(e, t);
			break;
		case z.OPTION:
		case z.OPTGROUP:
			To(e, t);
			break;
		case z.NOEMBED:
		case z.NOFRAMES:
			Co(e, t);
			break;
		case z.FRAMESET:
			eo(e, t);
			break;
		case z.TEXTAREA:
			bo(e, t);
			break;
		case z.NOSCRIPT:
			e.options.scriptingEnabled ? Co(e, t) : Ao(e, t);
			break;
		case z.PLAINTEXT:
			oo(e, t);
			break;
		case z.COL:
		case z.TH:
		case z.TD:
		case z.TR:
		case z.HEAD:
		case z.FRAME:
		case z.TBODY:
		case z.TFOOT:
		case z.THEAD:
		case z.CAPTION:
		case z.COLGROUP: break;
		default: Ao(e, t);
	}
}
function Mo(e, t) {
	if (e.openElements.hasInScope(z.BODY) && (e.insertionMode = H.AFTER_BODY, e.options.sourceCodeLocationInfo)) {
		let n = e.openElements.tryPeekProperlyNestedBodyElement();
		n && e._setEndLocation(n, t);
	}
}
function No(e, t) {
	e.openElements.hasInScope(z.BODY) && (e.insertionMode = H.AFTER_BODY, Os(e, t));
}
function Po(e, t) {
	let n = t.tagID;
	e.openElements.hasInScope(n) && (e.openElements.generateImpliedEndTags(), e.openElements.popUntilTagNamePopped(n));
}
function Fo(e) {
	let t = e.openElements.tmplCount > 0, { formElement: n } = e;
	t || (e.formElement = null), (n || t) && e.openElements.hasInScope(z.FORM) && (e.openElements.generateImpliedEndTags(), t ? e.openElements.popUntilTagNamePopped(z.FORM) : n && e.openElements.remove(n));
}
function Io(e) {
	e.openElements.hasInButtonScope(z.P) || e._insertFakeElement(R.P, z.P), e._closePElement();
}
function Lo(e) {
	e.openElements.hasInListItemScope(z.LI) && (e.openElements.generateImpliedEndTagsWithExclusion(z.LI), e.openElements.popUntilTagNamePopped(z.LI));
}
function Ro(e, t) {
	let n = t.tagID;
	e.openElements.hasInScope(n) && (e.openElements.generateImpliedEndTagsWithExclusion(n), e.openElements.popUntilTagNamePopped(n));
}
function zo(e) {
	e.openElements.hasNumberedHeaderInScope() && (e.openElements.generateImpliedEndTags(), e.openElements.popUntilNumberedHeaderPopped());
}
function Bo(e, t) {
	let n = t.tagID;
	e.openElements.hasInScope(n) && (e.openElements.generateImpliedEndTags(), e.openElements.popUntilTagNamePopped(n), e.activeFormattingElements.clearToLastMarker());
}
function Vo(e) {
	e._reconstructActiveFormattingElements(), e._insertFakeElement(R.BR, z.BR), e.openElements.pop(), e.framesetOk = !1;
}
function Ho(e, t) {
	let n = t.tagName, r = t.tagID;
	for (let t = e.openElements.stackTop; t > 0; t--) {
		let i = e.openElements.items[t], a = e.openElements.tagIDs[t];
		if (r === a && (r !== z.UNKNOWN || e.treeAdapter.getTagName(i) === n)) {
			e.openElements.generateImpliedEndTagsWithExclusion(r), e.openElements.stackTop >= t && e.openElements.shortenToLength(t);
			break;
		}
		if (e._isSpecialElement(i, a)) break;
	}
}
function Uo(e, t) {
	switch (t.tagID) {
		case z.A:
		case z.B:
		case z.I:
		case z.S:
		case z.U:
		case z.EM:
		case z.TT:
		case z.BIG:
		case z.CODE:
		case z.FONT:
		case z.NOBR:
		case z.SMALL:
		case z.STRIKE:
		case z.STRONG:
			Ea(e, t);
			break;
		case z.P:
			Io(e);
			break;
		case z.DL:
		case z.UL:
		case z.OL:
		case z.DIR:
		case z.DIV:
		case z.NAV:
		case z.PRE:
		case z.MAIN:
		case z.MENU:
		case z.ASIDE:
		case z.BUTTON:
		case z.CENTER:
		case z.FIGURE:
		case z.FOOTER:
		case z.HEADER:
		case z.HGROUP:
		case z.DIALOG:
		case z.ADDRESS:
		case z.ARTICLE:
		case z.DETAILS:
		case z.SEARCH:
		case z.SECTION:
		case z.SUMMARY:
		case z.LISTING:
		case z.FIELDSET:
		case z.BLOCKQUOTE:
		case z.FIGCAPTION:
			Po(e, t);
			break;
		case z.LI:
			Lo(e);
			break;
		case z.DD:
		case z.DT:
			Ro(e, t);
			break;
		case z.H1:
		case z.H2:
		case z.H3:
		case z.H4:
		case z.H5:
		case z.H6:
			zo(e);
			break;
		case z.BR:
			Vo(e);
			break;
		case z.BODY:
			Mo(e, t);
			break;
		case z.HTML:
			No(e, t);
			break;
		case z.FORM:
			Fo(e);
			break;
		case z.APPLET:
		case z.OBJECT:
		case z.MARQUEE:
			Bo(e, t);
			break;
		case z.TEMPLATE:
			Va(e, t);
			break;
		default: Ho(e, t);
	}
}
function Wo(e, t) {
	e.tmplInsertionModeStack.length > 0 ? Es(e, t) : Aa(e, t);
}
function Go(e, t) {
	var n;
	t.tagID === z.SCRIPT && ((n = e.scriptHandler) == null || n.call(e, e.openElements.current)), e.openElements.pop(), e.insertionMode = e.originalInsertionMode;
}
function Ko(e, t) {
	e._err(t, F.eofInElementThatCanContainOnlyText), e.openElements.pop(), e.insertionMode = e.originalInsertionMode, e.onEof(t);
}
function qo(e, t) {
	if (e.openElements.currentTagId !== void 0 && _a.has(e.openElements.currentTagId)) switch (e.pendingCharacterTokens.length = 0, e.hasNonWhitespacePendingCharacterToken = !1, e.originalInsertionMode = e.insertionMode, e.insertionMode = H.IN_TABLE_TEXT, t.type) {
		case I.CHARACTER:
			os(e, t);
			break;
		case I.WHITESPACE_CHARACTER: as(e, t);
	}
	else is(e, t);
}
function Jo(e, t) {
	e.openElements.clearBackToTableContext(), e.activeFormattingElements.insertMarker(), e._insertElement(t, L.HTML), e.insertionMode = H.IN_CAPTION;
}
function Yo(e, t) {
	e.openElements.clearBackToTableContext(), e._insertElement(t, L.HTML), e.insertionMode = H.IN_COLUMN_GROUP;
}
function Xo(e, t) {
	e.openElements.clearBackToTableContext(), e._insertFakeElement(R.COLGROUP, z.COLGROUP), e.insertionMode = H.IN_COLUMN_GROUP, ds(e, t);
}
function Zo(e, t) {
	e.openElements.clearBackToTableContext(), e._insertElement(t, L.HTML), e.insertionMode = H.IN_TABLE_BODY;
}
function Qo(e, t) {
	e.openElements.clearBackToTableContext(), e._insertFakeElement(R.TBODY, z.TBODY), e.insertionMode = H.IN_TABLE_BODY, ms(e, t);
}
function $o(e, t) {
	e.openElements.hasInTableScope(z.TABLE) && (e.openElements.popUntilTagNamePopped(z.TABLE), e._resetInsertionMode(), e._processStartTag(t));
}
function es(e, t) {
	ho(t) ? e._appendElement(t, L.HTML) : is(e, t), t.ackSelfClosing = !0;
}
function ts(e, t) {
	!e.formElement && e.openElements.tmplCount === 0 && (e._insertElement(t, L.HTML), e.formElement = e.openElements.current, e.openElements.pop());
}
function ns(e, t) {
	switch (t.tagID) {
		case z.TD:
		case z.TH:
		case z.TR:
			Qo(e, t);
			break;
		case z.STYLE:
		case z.SCRIPT:
		case z.TEMPLATE:
			za(e, t);
			break;
		case z.COL:
			Xo(e, t);
			break;
		case z.FORM:
			ts(e, t);
			break;
		case z.TABLE:
			$o(e, t);
			break;
		case z.TBODY:
		case z.TFOOT:
		case z.THEAD:
			Zo(e, t);
			break;
		case z.INPUT:
			es(e, t);
			break;
		case z.CAPTION:
			Jo(e, t);
			break;
		case z.COLGROUP:
			Yo(e, t);
			break;
		default: is(e, t);
	}
}
function rs(e, t) {
	switch (t.tagID) {
		case z.TABLE:
			e.openElements.hasInTableScope(z.TABLE) && (e.openElements.popUntilTagNamePopped(z.TABLE), e._resetInsertionMode());
			break;
		case z.TEMPLATE:
			Va(e, t);
			break;
		case z.BODY:
		case z.CAPTION:
		case z.COL:
		case z.COLGROUP:
		case z.HTML:
		case z.TBODY:
		case z.TD:
		case z.TFOOT:
		case z.TH:
		case z.THEAD:
		case z.TR: break;
		default: is(e, t);
	}
}
function is(e, t) {
	let n = e.fosterParentingEnabled;
	e.fosterParentingEnabled = !0, Ya(e, t), e.fosterParentingEnabled = n;
}
function as(e, t) {
	e.pendingCharacterTokens.push(t);
}
function os(e, t) {
	e.pendingCharacterTokens.push(t), e.hasNonWhitespacePendingCharacterToken = !0;
}
function ss(e, t) {
	let n = 0;
	if (e.hasNonWhitespacePendingCharacterToken) for (; n < e.pendingCharacterTokens.length; n++) is(e, e.pendingCharacterTokens[n]);
	else for (; n < e.pendingCharacterTokens.length; n++) e._insertCharacters(e.pendingCharacterTokens[n]);
	e.insertionMode = e.originalInsertionMode, e._processToken(t);
}
var cs = /* @__PURE__ */ new Set([
	z.CAPTION,
	z.COL,
	z.COLGROUP,
	z.TBODY,
	z.TD,
	z.TFOOT,
	z.TH,
	z.THEAD,
	z.TR
]);
function ls(e, t) {
	let n = t.tagID;
	cs.has(n) ? e.openElements.hasInTableScope(z.CAPTION) && (e.openElements.generateImpliedEndTags(), e.openElements.popUntilTagNamePopped(z.CAPTION), e.activeFormattingElements.clearToLastMarker(), e.insertionMode = H.IN_TABLE, ns(e, t)) : jo(e, t);
}
function us(e, t) {
	let n = t.tagID;
	switch (n) {
		case z.CAPTION:
		case z.TABLE:
			e.openElements.hasInTableScope(z.CAPTION) && (e.openElements.generateImpliedEndTags(), e.openElements.popUntilTagNamePopped(z.CAPTION), e.activeFormattingElements.clearToLastMarker(), e.insertionMode = H.IN_TABLE, n === z.TABLE && rs(e, t));
			break;
		case z.BODY:
		case z.COL:
		case z.COLGROUP:
		case z.HTML:
		case z.TBODY:
		case z.TD:
		case z.TFOOT:
		case z.TH:
		case z.THEAD:
		case z.TR: break;
		default: Uo(e, t);
	}
}
function ds(e, t) {
	switch (t.tagID) {
		case z.HTML:
			jo(e, t);
			break;
		case z.COL:
			e._appendElement(t, L.HTML), t.ackSelfClosing = !0;
			break;
		case z.TEMPLATE:
			za(e, t);
			break;
		default: ps(e, t);
	}
}
function fs(e, t) {
	switch (t.tagID) {
		case z.COLGROUP:
			e.openElements.currentTagId === z.COLGROUP && (e.openElements.pop(), e.insertionMode = H.IN_TABLE);
			break;
		case z.TEMPLATE:
			Va(e, t);
			break;
		case z.COL: break;
		default: ps(e, t);
	}
}
function ps(e, t) {
	e.openElements.currentTagId === z.COLGROUP && (e.openElements.pop(), e.insertionMode = H.IN_TABLE, e._processToken(t));
}
function ms(e, t) {
	switch (t.tagID) {
		case z.TR:
			e.openElements.clearBackToTableBodyContext(), e._insertElement(t, L.HTML), e.insertionMode = H.IN_ROW;
			break;
		case z.TH:
		case z.TD:
			e.openElements.clearBackToTableBodyContext(), e._insertFakeElement(R.TR, z.TR), e.insertionMode = H.IN_ROW, gs(e, t);
			break;
		case z.CAPTION:
		case z.COL:
		case z.COLGROUP:
		case z.TBODY:
		case z.TFOOT:
		case z.THEAD:
			e.openElements.hasTableBodyContextInTableScope() && (e.openElements.clearBackToTableBodyContext(), e.openElements.pop(), e.insertionMode = H.IN_TABLE, ns(e, t));
			break;
		default: ns(e, t);
	}
}
function hs(e, t) {
	let n = t.tagID;
	switch (t.tagID) {
		case z.TBODY:
		case z.TFOOT:
		case z.THEAD:
			e.openElements.hasInTableScope(n) && (e.openElements.clearBackToTableBodyContext(), e.openElements.pop(), e.insertionMode = H.IN_TABLE);
			break;
		case z.TABLE:
			e.openElements.hasTableBodyContextInTableScope() && (e.openElements.clearBackToTableBodyContext(), e.openElements.pop(), e.insertionMode = H.IN_TABLE, rs(e, t));
			break;
		case z.BODY:
		case z.CAPTION:
		case z.COL:
		case z.COLGROUP:
		case z.HTML:
		case z.TD:
		case z.TH:
		case z.TR: break;
		default: rs(e, t);
	}
}
function gs(e, t) {
	switch (t.tagID) {
		case z.TH:
		case z.TD:
			e.openElements.clearBackToTableRowContext(), e._insertElement(t, L.HTML), e.insertionMode = H.IN_CELL, e.activeFormattingElements.insertMarker();
			break;
		case z.CAPTION:
		case z.COL:
		case z.COLGROUP:
		case z.TBODY:
		case z.TFOOT:
		case z.THEAD:
		case z.TR:
			e.openElements.hasInTableScope(z.TR) && (e.openElements.clearBackToTableRowContext(), e.openElements.pop(), e.insertionMode = H.IN_TABLE_BODY, ms(e, t));
			break;
		default: ns(e, t);
	}
}
function _s(e, t) {
	switch (t.tagID) {
		case z.TR:
			e.openElements.hasInTableScope(z.TR) && (e.openElements.clearBackToTableRowContext(), e.openElements.pop(), e.insertionMode = H.IN_TABLE_BODY);
			break;
		case z.TABLE:
			e.openElements.hasInTableScope(z.TR) && (e.openElements.clearBackToTableRowContext(), e.openElements.pop(), e.insertionMode = H.IN_TABLE_BODY, hs(e, t));
			break;
		case z.TBODY:
		case z.TFOOT:
		case z.THEAD:
			(e.openElements.hasInTableScope(t.tagID) || e.openElements.hasInTableScope(z.TR)) && (e.openElements.clearBackToTableRowContext(), e.openElements.pop(), e.insertionMode = H.IN_TABLE_BODY, hs(e, t));
			break;
		case z.BODY:
		case z.CAPTION:
		case z.COL:
		case z.COLGROUP:
		case z.HTML:
		case z.TD:
		case z.TH: break;
		default: rs(e, t);
	}
}
function vs(e, t) {
	let n = t.tagID;
	cs.has(n) ? (e.openElements.hasInTableScope(z.TD) || e.openElements.hasInTableScope(z.TH)) && (e._closeTableCell(), gs(e, t)) : jo(e, t);
}
function ys(e, t) {
	let n = t.tagID;
	switch (n) {
		case z.TD:
		case z.TH:
			e.openElements.hasInTableScope(n) && (e.openElements.generateImpliedEndTags(), e.openElements.popUntilTagNamePopped(n), e.activeFormattingElements.clearToLastMarker(), e.insertionMode = H.IN_ROW);
			break;
		case z.TABLE:
		case z.TBODY:
		case z.TFOOT:
		case z.THEAD:
		case z.TR:
			e.openElements.hasInTableScope(n) && (e._closeTableCell(), _s(e, t));
			break;
		case z.BODY:
		case z.CAPTION:
		case z.COL:
		case z.COLGROUP:
		case z.HTML: break;
		default: Uo(e, t);
	}
}
function bs(e, t) {
	switch (t.tagID) {
		case z.HTML:
			jo(e, t);
			break;
		case z.OPTION:
			e.openElements.currentTagId === z.OPTION && e.openElements.pop(), e._insertElement(t, L.HTML);
			break;
		case z.OPTGROUP:
			e.openElements.currentTagId === z.OPTION && e.openElements.pop(), e.openElements.currentTagId === z.OPTGROUP && e.openElements.pop(), e._insertElement(t, L.HTML);
			break;
		case z.HR:
			e.openElements.currentTagId === z.OPTION && e.openElements.pop(), e.openElements.currentTagId === z.OPTGROUP && e.openElements.pop(), e._appendElement(t, L.HTML), t.ackSelfClosing = !0;
			break;
		case z.INPUT:
		case z.KEYGEN:
		case z.TEXTAREA:
		case z.SELECT:
			e.openElements.hasInSelectScope(z.SELECT) && (e.openElements.popUntilTagNamePopped(z.SELECT), e._resetInsertionMode(), t.tagID !== z.SELECT && e._processStartTag(t));
			break;
		case z.SCRIPT:
		case z.TEMPLATE: za(e, t);
	}
}
function xs(e, t) {
	switch (t.tagID) {
		case z.OPTGROUP:
			e.openElements.stackTop > 0 && e.openElements.currentTagId === z.OPTION && e.openElements.tagIDs[e.openElements.stackTop - 1] === z.OPTGROUP && e.openElements.pop(), e.openElements.currentTagId === z.OPTGROUP && e.openElements.pop();
			break;
		case z.OPTION:
			e.openElements.currentTagId === z.OPTION && e.openElements.pop();
			break;
		case z.SELECT:
			e.openElements.hasInSelectScope(z.SELECT) && (e.openElements.popUntilTagNamePopped(z.SELECT), e._resetInsertionMode());
			break;
		case z.TEMPLATE: Va(e, t);
	}
}
function Ss(e, t) {
	let n = t.tagID;
	n === z.CAPTION || n === z.TABLE || n === z.TBODY || n === z.TFOOT || n === z.THEAD || n === z.TR || n === z.TD || n === z.TH ? (e.openElements.popUntilTagNamePopped(z.SELECT), e._resetInsertionMode(), e._processStartTag(t)) : bs(e, t);
}
function Cs(e, t) {
	let n = t.tagID;
	n === z.CAPTION || n === z.TABLE || n === z.TBODY || n === z.TFOOT || n === z.THEAD || n === z.TR || n === z.TD || n === z.TH ? e.openElements.hasInTableScope(n) && (e.openElements.popUntilTagNamePopped(z.SELECT), e._resetInsertionMode(), e.onEndTag(t)) : xs(e, t);
}
function ws(e, t) {
	switch (t.tagID) {
		case z.BASE:
		case z.BASEFONT:
		case z.BGSOUND:
		case z.LINK:
		case z.META:
		case z.NOFRAMES:
		case z.SCRIPT:
		case z.STYLE:
		case z.TEMPLATE:
		case z.TITLE:
			za(e, t);
			break;
		case z.CAPTION:
		case z.COLGROUP:
		case z.TBODY:
		case z.TFOOT:
		case z.THEAD:
			e.tmplInsertionModeStack[0] = H.IN_TABLE, e.insertionMode = H.IN_TABLE, ns(e, t);
			break;
		case z.COL:
			e.tmplInsertionModeStack[0] = H.IN_COLUMN_GROUP, e.insertionMode = H.IN_COLUMN_GROUP, ds(e, t);
			break;
		case z.TR:
			e.tmplInsertionModeStack[0] = H.IN_TABLE_BODY, e.insertionMode = H.IN_TABLE_BODY, ms(e, t);
			break;
		case z.TD:
		case z.TH:
			e.tmplInsertionModeStack[0] = H.IN_ROW, e.insertionMode = H.IN_ROW, gs(e, t);
			break;
		default: e.tmplInsertionModeStack[0] = H.IN_BODY, e.insertionMode = H.IN_BODY, jo(e, t);
	}
}
function Ts(e, t) {
	t.tagID === z.TEMPLATE && Va(e, t);
}
function Es(e, t) {
	e.openElements.tmplCount > 0 ? (e.openElements.popUntilTagNamePopped(z.TEMPLATE), e.activeFormattingElements.clearToLastMarker(), e.tmplInsertionModeStack.shift(), e._resetInsertionMode(), e.onEof(t)) : Aa(e, t);
}
function Ds(e, t) {
	t.tagID === z.HTML ? jo(e, t) : ks(e, t);
}
function Os(e, t) {
	if (t.tagID === z.HTML) {
		if (e.fragmentContext || (e.insertionMode = H.AFTER_AFTER_BODY), e.options.sourceCodeLocationInfo && e.openElements.tagIDs[0] === z.HTML) {
			e._setEndLocation(e.openElements.items[0], t);
			let n = e.openElements.items[1];
			n && !e.treeAdapter.getNodeSourceCodeLocation(n)?.endTag && e._setEndLocation(n, t);
		}
	} else ks(e, t);
}
function ks(e, t) {
	e.insertionMode = H.IN_BODY, Ya(e, t);
}
function As(e, t) {
	switch (t.tagID) {
		case z.HTML:
			jo(e, t);
			break;
		case z.FRAMESET:
			e._insertElement(t, L.HTML);
			break;
		case z.FRAME:
			e._appendElement(t, L.HTML), t.ackSelfClosing = !0;
			break;
		case z.NOFRAMES: za(e, t);
	}
}
function js(e, t) {
	t.tagID === z.FRAMESET && !e.openElements.isRootHtmlElementCurrent() && (e.openElements.pop(), !e.fragmentContext && e.openElements.currentTagId !== z.FRAMESET && (e.insertionMode = H.AFTER_FRAMESET));
}
function Ms(e, t) {
	switch (t.tagID) {
		case z.HTML:
			jo(e, t);
			break;
		case z.NOFRAMES: za(e, t);
	}
}
function Ns(e, t) {
	t.tagID === z.HTML && (e.insertionMode = H.AFTER_AFTER_FRAMESET);
}
function Ps(e, t) {
	t.tagID === z.HTML ? jo(e, t) : Fs(e, t);
}
function Fs(e, t) {
	e.insertionMode = H.IN_BODY, Ya(e, t);
}
function Is(e, t) {
	switch (t.tagID) {
		case z.HTML:
			jo(e, t);
			break;
		case z.NOFRAMES: za(e, t);
	}
}
function Ls(e, t) {
	t.chars = "�", e._insertCharacters(t);
}
function Rs(e, t) {
	e._insertCharacters(t), e.framesetOk = !1;
}
function zs(e) {
	for (; e.treeAdapter.getNamespaceURI(e.openElements.current) !== L.HTML && e.openElements.currentTagId !== void 0 && !e._isIntegrationPoint(e.openElements.currentTagId, e.openElements.current);) e.openElements.pop();
}
function Bs(e, t) {
	if (aa(t)) zs(e), e._startTagOutsideForeignContent(t);
	else {
		let n = e._getAdjustedCurrentElement(), r = e.treeAdapter.getNamespaceURI(n);
		r === L.MATHML ? oa(t) : r === L.SVG && (la(t), sa(t)), ca(t), t.selfClosing ? e._appendElement(t, r) : e._insertElement(t, r), t.ackSelfClosing = !0;
	}
}
function Vs(e, t) {
	if (t.tagID === z.P || t.tagID === z.BR) zs(e), e._endTagOutsideForeignContent(t);
	else for (let n = e.openElements.stackTop; n > 0; n--) {
		let r = e.openElements.items[n];
		if (e.treeAdapter.getNamespaceURI(r) === L.HTML) {
			e._endTagOutsideForeignContent(t);
			break;
		}
		let i = e.treeAdapter.getTagName(r);
		if (i.toLowerCase() === t.tagName) {
			t.tagName = i, e.openElements.shortenToLength(n);
			break;
		}
	}
}
R.AREA, R.BASE, R.BASEFONT, R.BGSOUND, R.BR, R.COL, R.EMBED, R.FRAME, R.HR, R.IMG, R.INPUT, R.KEYGEN, R.LINK, R.META, R.PARAM, R.SOURCE, R.TRACK, R.WBR;
// node_modules/hast-util-raw/node_modules/unist-util-position/lib/index.js
var Hs = Ws("end"), Us = Ws("start");
function Ws(e) {
	return t;
	function t(t) {
		let n = t && t.position && t.position[e] || {};
		if (typeof n.line == "number" && n.line > 0 && typeof n.column == "number" && n.column > 0) return {
			line: n.line,
			column: n.column,
			offset: typeof n.offset == "number" && n.offset > -1 ? n.offset : void 0
		};
	}
}
// node_modules/hast-util-raw/node_modules/unist-util-visit/lib/index.js
function Gs(e, t, n, r) {
	let i, a, o;
	typeof n == "function" || n && typeof n == "object" ? (i = t, a = n, o = r) : (a = t, o = n), typeof a == "function" ? v(e, i, qs(a), o) : v(e, i, Ks(a), o);
}
function Ks(e) {
	return !e || typeof e != "object" ? e : {
		enter: typeof e.enter == "function" ? qs(e.enter) : e.enter,
		exit: typeof e.exit == "function" ? qs(e.exit) : e.exit
	};
}
function qs(e) {
	return t;
	function t(t, n, r) {
		return e(t, r, n[n.length - 1]);
	}
}
// node_modules/hast-util-raw/lib/index.js
var Js = /<(\/?)(iframe|noembed|noframes|plaintext|script|style|textarea|title|xmp)(?=[\t\n\f\r />])/gi, Ys = /* @__PURE__ */ new Set([
	"mdxFlowExpression",
	"mdxJsxFlowElement",
	"mdxJsxTextElement",
	"mdxTextExpression",
	"mdxjsEsm"
]), Xs = {
	sourceCodeLocationInfo: !0,
	scriptingEnabled: !1
};
function Zs(e, t) {
	let n = dc(e), r = Sr("type", {
		handlers: {
			root: $s,
			element: ec,
			text: tc,
			comment: ic,
			doctype: nc,
			raw: ac
		},
		unknown: oc
	}), i = {
		parser: n ? new ya(Xs) : ya.getFragmentParser(void 0, Xs),
		handle(e) {
			r(e, i);
		},
		stitches: !1,
		options: t || {}
	};
	r(e, i), sc(i, Us());
	let a = In(n ? i.parser.document : i.parser.getFragment(), { file: i.options.file });
	return i.stitches && Gs(a, "comment", function(e, t, n) {
		let r = e;
		if (r.value.stitch && n && t !== void 0) {
			let e = n.children;
			return e[t] = r.value.stitch, t;
		}
	}), a.type === "root" && a.children.length === 1 && a.children[0].type === e.type ? a.children[0] : a;
}
function Qs(e, t) {
	let n = -1;
	/* istanbul ignore else - invalid nodes, see rehypejs/rehype-raw#7. */
	if (e) for (; ++n < e.length;) t.handle(e[n]);
}
function $s(e, t) {
	Qs(e.children, t);
}
function ec(e, t) {
	lc(e, t), Qs(e.children, t), uc(e, t);
}
function tc(e, t) {
	t.parser.tokenizer.state > 4 && (t.parser.tokenizer.state = 0);
	let n = {
		type: I.CHARACTER,
		chars: e.value,
		location: fc(e)
	};
	sc(t, Us(e)), t.parser.currentToken = n, t.parser._processToken(t.parser.currentToken);
}
function nc(e, t) {
	let n = {
		type: I.DOCTYPE,
		name: "html",
		forceQuirks: !1,
		publicId: "",
		systemId: "",
		location: fc(e)
	};
	sc(t, Us(e)), t.parser.currentToken = n, t.parser._processToken(t.parser.currentToken);
}
function rc(e, t) {
	t.stitches = !0;
	let n = pc(e);
	"children" in e && "children" in n && (n.children = Zs({
		type: "root",
		children: e.children
	}, t.options).children), ic({
		type: "comment",
		value: { stitch: n }
	}, t);
}
function ic(e, t) {
	let n = e.value, r = {
		type: I.COMMENT,
		data: n,
		location: fc(e)
	};
	sc(t, Us(e)), t.parser.currentToken = r, t.parser._processToken(t.parser.currentToken);
}
function ac(e, t) {
	/* c8 ignore next 12 -- removed in <https://github.com/inikulin/parse5/pull/897> */
	if (t.parser.tokenizer.preprocessor.html = "", t.parser.tokenizer.preprocessor.pos = -1, t.parser.tokenizer.preprocessor.lastGapPos = -2, t.parser.tokenizer.preprocessor.gapStack = [], t.parser.tokenizer.preprocessor.skipNextNewLine = !1, t.parser.tokenizer.preprocessor.lastChunkWritten = !1, t.parser.tokenizer.preprocessor.endOfChunkHit = !1, t.parser.tokenizer.preprocessor.isEol = !1, cc(t, Us(e)), t.parser.tokenizer.write(t.options.tagfilter ? e.value.replace(Js, "&lt;$1$2") : e.value, !1), t.parser.tokenizer._runParsingLoop(), t.parser.tokenizer.state === 72 || t.parser.tokenizer.state === 78) {
		t.parser.tokenizer.preprocessor.lastChunkWritten = !0;
		let e = t.parser.tokenizer._consume();
		t.parser.tokenizer._callState(e);
	}
}
function oc(e, t) {
	let n = e;
	if (t.options.passThrough && t.options.passThrough.includes(n.type)) rc(n, t);
	else {
		let e = "";
		throw Ys.has(n.type) && (e = ". It looks like you are using MDX nodes with `hast-util-raw` (or `rehype-raw`). If you use this because you are using remark or rehype plugins that inject `'html'` nodes, then please raise an issue with that plugin, as its a bad and slow idea. If you use this because you are using markdown syntax, then you have to configure this utility (or plugin) to pass through these nodes (see `passThrough` in docs), but you can also migrate to use the MDX syntax"), Error("Cannot compile `" + n.type + "` node" + e);
	}
}
function sc(e, t) {
	cc(e, t);
	let n = e.parser.tokenizer.currentCharacterToken;
	n && n.location && (n.location.endLine = e.parser.tokenizer.preprocessor.line, n.location.endCol = e.parser.tokenizer.preprocessor.col + 1, n.location.endOffset = e.parser.tokenizer.preprocessor.offset + 1, e.parser.currentToken = n, e.parser._processToken(e.parser.currentToken)), e.parser.tokenizer.paused = !1, e.parser.tokenizer.inLoop = !1, e.parser.tokenizer.active = !1, e.parser.tokenizer.returnState = pi.DATA, e.parser.tokenizer.charRefCode = -1, e.parser.tokenizer.consumedAfterSnapshot = -1, e.parser.tokenizer.currentLocation = null, e.parser.tokenizer.currentCharacterToken = null, e.parser.tokenizer.currentToken = null, e.parser.tokenizer.currentAttr = {
		name: "",
		value: ""
	};
}
function cc(e, t) {
	if (t && t.offset !== void 0) {
		let n = {
			startLine: t.line,
			startCol: t.column,
			startOffset: t.offset,
			endLine: -1,
			endCol: -1,
			endOffset: -1
		};
		e.parser.tokenizer.preprocessor.lineStartPos = -t.column + 1, e.parser.tokenizer.preprocessor.droppedBufferSize = t.offset, e.parser.tokenizer.preprocessor.line = t.line, e.parser.tokenizer.currentLocation = n;
	}
}
function lc(e, t) {
	let n = e.tagName.toLowerCase();
	if (t.parser.tokenizer.state === pi.PLAINTEXT) return;
	sc(t, Us(e));
	let r = t.parser.openElements.current, i = "namespaceURI" in r ? r.namespaceURI : rt.html;
	i === rt.html && n === "svg" && (i = rt.svg);
	let a = Er({
		...e,
		children: []
	}, { space: i === rt.svg ? "svg" : "html" }), o = {
		type: I.START_TAG,
		tagName: n,
		tagID: ui(n),
		selfClosing: !1,
		ackSelfClosing: !1,
		/* c8 ignore next */
		attrs: "attrs" in a ? a.attrs : [],
		location: fc(e)
	};
	t.parser.currentToken = o, t.parser._processToken(t.parser.currentToken), t.parser.tokenizer.lastStartTagName = n;
}
function uc(e, t) {
	let n = e.tagName.toLowerCase();
	if (!t.parser.tokenizer.inForeignNode && Ir.includes(n) || t.parser.tokenizer.state === pi.PLAINTEXT) return;
	sc(t, Hs(e));
	let r = {
		type: I.END_TAG,
		tagName: n,
		tagID: ui(n),
		selfClosing: !1,
		ackSelfClosing: !1,
		attrs: [],
		location: fc(e)
	};
	t.parser.currentToken = r, t.parser._processToken(t.parser.currentToken), n === t.parser.tokenizer.lastStartTagName && (t.parser.tokenizer.state === pi.RCDATA || t.parser.tokenizer.state === pi.RAWTEXT || t.parser.tokenizer.state === pi.SCRIPT_DATA) && (t.parser.tokenizer.state = pi.DATA);
}
function dc(e) {
	let t = e.type === "root" ? e.children[0] : e;
	return !!(t && (t.type === "doctype" || t.type === "element" && t.tagName.toLowerCase() === "html"));
}
function fc(e) {
	let t = Us(e) || {
		line: void 0,
		column: void 0,
		offset: void 0
	}, n = Hs(e) || {
		line: void 0,
		column: void 0,
		offset: void 0
	};
	return {
		startLine: t.line,
		startCol: t.column,
		startOffset: t.offset,
		endLine: n.line,
		endCol: n.column,
		endOffset: n.offset
	};
}
function pc(e) {
	return "children" in e ? Qt({
		...e,
		children: []
	}) : Qt(e);
}
// node_modules/rehype-raw/lib/index.js
function mc(e) {
	return function(t, n) {
		return Zs(t, {
			...e,
			file: n
		});
	};
}
// node_modules/hast-util-sanitize/node_modules/unist-util-position/lib/index.js
var hc = _c("end"), gc = _c("start");
function _c(e) {
	return t;
	function t(t) {
		let n = t && t.position && t.position[e] || {};
		if (typeof n.line == "number" && n.line > 0 && typeof n.column == "number" && n.column > 0) return {
			line: n.line,
			column: n.column,
			offset: typeof n.offset == "number" && n.offset > -1 ? n.offset : void 0
		};
	}
}
function vc(e) {
	let t = gc(e), n = hc(e);
	if (t && n) return {
		start: t,
		end: n
	};
}
// node_modules/hast-util-sanitize/lib/schema.js
var yc = [
	"ariaDescribedBy",
	"ariaLabel",
	"ariaLabelledBy"
], bc = {
	ancestors: {
		tbody: ["table"],
		td: ["table"],
		th: ["table"],
		thead: ["table"],
		tfoot: ["table"],
		tr: ["table"]
	},
	attributes: {
		a: [
			...yc,
			"dataFootnoteBackref",
			"dataFootnoteRef",
			["className", "data-footnote-backref"],
			"href"
		],
		blockquote: ["cite"],
		code: [["className", /^language-./]],
		del: ["cite"],
		div: ["itemScope", "itemType"],
		dl: [...yc],
		h2: [["className", "sr-only"]],
		img: [
			...yc,
			"longDesc",
			"src"
		],
		input: [["disabled", !0], ["type", "checkbox"]],
		ins: ["cite"],
		li: [["className", "task-list-item"]],
		ol: [...yc, ["className", "contains-task-list"]],
		q: ["cite"],
		section: ["dataFootnotes", ["className", "footnotes"]],
		source: ["srcSet"],
		summary: [...yc],
		table: [...yc],
		ul: [...yc, ["className", "contains-task-list"]],
		"*": /* @__PURE__ */ "abbr.accept.acceptCharset.accessKey.action.align.alt.axis.border.cellPadding.cellSpacing.char.charOff.charSet.checked.clear.colSpan.color.cols.compact.coords.dateTime.dir.encType.frame.hSpace.headers.height.hrefLang.htmlFor.id.isMap.itemProp.label.lang.maxLength.media.method.multiple.name.noHref.noShade.noWrap.open.prompt.readOnly.rev.rowSpan.rows.rules.scope.selected.shape.size.span.start.summary.tabIndex.title.useMap.vAlign.value.width".split(".")
	},
	clobber: [
		"ariaDescribedBy",
		"ariaLabelledBy",
		"id",
		"name"
	],
	clobberPrefix: "user-content-",
	protocols: {
		cite: ["http", "https"],
		href: [
			"http",
			"https",
			"irc",
			"ircs",
			"mailto",
			"xmpp"
		],
		longDesc: ["http", "https"],
		src: ["http", "https"]
	},
	required: { input: {
		disabled: !0,
		type: "checkbox"
	} },
	strip: ["script"],
	tagNames: /* @__PURE__ */ "a.b.blockquote.br.code.dd.del.details.div.dl.dt.em.h1.h2.h3.h4.h5.h6.hr.i.img.input.ins.kbd.li.ol.p.picture.pre.q.rp.rt.ruby.s.samp.section.source.span.strike.strong.sub.summary.sup.table.tbody.td.tfoot.th.thead.tr.tt.ul.var".split(".")
}, xc = {}.hasOwnProperty;
function Sc(e, t) {
	let n = {
		type: "root",
		children: []
	}, r = Cc({
		schema: t ? {
			...bc,
			...t
		} : bc,
		stack: []
	}, e);
	return r && (Array.isArray(r) ? r.length === 1 ? n = r[0] : n.children = r : n = r), n;
}
function Cc(e, t) {
	if (t && typeof t == "object") {
		let n = t;
		switch (typeof n.type == "string" ? n.type : "") {
			case "comment": return wc(e, n);
			case "doctype": return Tc(e, n);
			case "element": return Ec(e, n);
			case "root": return Dc(e, n);
			case "text": return Oc(e, n);
		}
	}
}
function wc(e, t) {
	if (e.schema.allowComments) {
		let e = typeof t.value == "string" ? t.value : "", n = e.indexOf("-->"), r = {
			type: "comment",
			value: n < 0 ? e : e.slice(0, n)
		};
		return Fc(r, t), r;
	}
}
function Tc(e, t) {
	if (e.schema.allowDoctypes) {
		let e = { type: "doctype" };
		return Fc(e, t), e;
	}
}
function Ec(e, t) {
	let n = typeof t.tagName == "string" ? t.tagName : "";
	e.stack.push(n);
	let r = kc(e, t.children), i = Ac(e, t.properties);
	e.stack.pop();
	let a = !1;
	if (n && n !== "*" && (!e.schema.tagNames || e.schema.tagNames.includes(n)) && (a = !0, e.schema.ancestors && xc.call(e.schema.ancestors, n))) {
		let t = e.schema.ancestors[n], r = -1;
		for (a = !1; ++r < t.length;) e.stack.includes(t[r]) && (a = !0);
	}
	if (!a) return e.schema.strip && !e.schema.strip.includes(n) ? r : void 0;
	let o = {
		type: "element",
		tagName: n,
		properties: i,
		children: r
	};
	return Fc(o, t), o;
}
function Dc(e, t) {
	let n = {
		type: "root",
		children: kc(e, t.children)
	};
	return Fc(n, t), n;
}
function Oc(e, t) {
	let n = {
		type: "text",
		value: typeof t.value == "string" ? t.value : ""
	};
	return Fc(n, t), n;
}
function kc(e, t) {
	let n = [];
	if (Array.isArray(t)) {
		let r = t, i = -1;
		for (; ++i < r.length;) {
			let t = Cc(e, r[i]);
			t && (Array.isArray(t) ? n.push(...t) : n.push(t));
		}
	}
	return n;
}
function Ac(e, t) {
	let n = e.stack[e.stack.length - 1], r = e.schema.attributes, i = e.schema.required, a = r && xc.call(r, n) ? r[n] : void 0, o = r && xc.call(r, "*") ? r["*"] : void 0, s = t && typeof t == "object" ? t : {}, c = {}, l;
	for (l in s) if (xc.call(s, l)) {
		let t = s[l], n = jc(e, Ic(a, l), l, t);
		n ??= jc(e, Ic(o, l), l, t), n != null && (c[l] = n);
	}
	if (i && xc.call(i, n)) {
		let e = i[n];
		for (l in e) xc.call(e, l) && !xc.call(c, l) && (c[l] = e[l]);
	}
	return c;
}
function jc(e, t, n, r) {
	return t ? Array.isArray(r) ? Mc(e, t, n, r) : Nc(e, t, n, r) : void 0;
}
function Mc(e, t, n, r) {
	let i = -1, a = [];
	for (; ++i < r.length;) {
		let o = Nc(e, t, n, r[i]);
		(typeof o == "number" || typeof o == "string") && a.push(o);
	}
	return a;
}
function Nc(e, t, n, r) {
	if ((typeof r == "boolean" || typeof r == "number" || typeof r == "string") && Pc(e, n, r)) {
		if (typeof t == "object" && t.length > 1) {
			let e = !1, n = 0;
			for (; ++n < t.length;) {
				let i = t[n];
				if (i && typeof i == "object" && "flags" in i) {
					if (i.test(String(r))) {
						e = !0;
						break;
					}
				} else if (i === r) {
					e = !0;
					break;
				}
			}
			if (!e) return;
		}
		return e.schema.clobber && e.schema.clobberPrefix && e.schema.clobber.includes(n) ? e.schema.clobberPrefix + r : r;
	}
}
function Pc(e, t, n) {
	let r = e.schema.protocols && xc.call(e.schema.protocols, t) ? e.schema.protocols[t] : void 0;
	if (!r || r.length === 0) return !0;
	let i = String(n), a = i.indexOf(":"), o = i.indexOf("?"), s = i.indexOf("#"), c = i.indexOf("/");
	if (a < 0 || c > -1 && a > c || o > -1 && a > o || s > -1 && a > s) return !0;
	let l = -1;
	for (; ++l < r.length;) {
		let e = r[l];
		if (a === e.length && i.slice(0, e.length) === e) return !0;
	}
	return !1;
}
function Fc(e, t) {
	let n = vc(t);
	t.data && (e.data = Qt(t.data)), n && (e.position = n);
}
function Ic(e, t) {
	let n, r = -1;
	if (e) for (; ++r < e.length;) {
		let i = e[r], a = typeof i == "string" ? i : i[0];
		if (a === t) return i;
		a === "data*" && (n = i);
	}
	if (t.length > 4 && t.slice(0, 4).toLowerCase() === "data") return n;
}
// node_modules/rehype-sanitize/lib/index.js
function Lc(e) {
	return function(t) {
		return Sc(t, e);
	};
}
// node_modules/streamdown/node_modules/micromark-util-symbol/lib/codes.js
var Rc = {
	carriageReturn: -5,
	lineFeed: -4,
	carriageReturnLineFeed: -3,
	horizontalTab: -2,
	virtualSpace: -1,
	eof: null,
	nul: 0,
	soh: 1,
	stx: 2,
	etx: 3,
	eot: 4,
	enq: 5,
	ack: 6,
	bel: 7,
	bs: 8,
	ht: 9,
	lf: 10,
	vt: 11,
	ff: 12,
	cr: 13,
	so: 14,
	si: 15,
	dle: 16,
	dc1: 17,
	dc2: 18,
	dc3: 19,
	dc4: 20,
	nak: 21,
	syn: 22,
	etb: 23,
	can: 24,
	em: 25,
	sub: 26,
	esc: 27,
	fs: 28,
	gs: 29,
	rs: 30,
	us: 31,
	space: 32,
	exclamationMark: 33,
	quotationMark: 34,
	numberSign: 35,
	dollarSign: 36,
	percentSign: 37,
	ampersand: 38,
	apostrophe: 39,
	leftParenthesis: 40,
	rightParenthesis: 41,
	asterisk: 42,
	plusSign: 43,
	comma: 44,
	dash: 45,
	dot: 46,
	slash: 47,
	digit0: 48,
	digit1: 49,
	digit2: 50,
	digit3: 51,
	digit4: 52,
	digit5: 53,
	digit6: 54,
	digit7: 55,
	digit8: 56,
	digit9: 57,
	colon: 58,
	semicolon: 59,
	lessThan: 60,
	equalsTo: 61,
	greaterThan: 62,
	questionMark: 63,
	atSign: 64,
	uppercaseA: 65,
	uppercaseB: 66,
	uppercaseC: 67,
	uppercaseD: 68,
	uppercaseE: 69,
	uppercaseF: 70,
	uppercaseG: 71,
	uppercaseH: 72,
	uppercaseI: 73,
	uppercaseJ: 74,
	uppercaseK: 75,
	uppercaseL: 76,
	uppercaseM: 77,
	uppercaseN: 78,
	uppercaseO: 79,
	uppercaseP: 80,
	uppercaseQ: 81,
	uppercaseR: 82,
	uppercaseS: 83,
	uppercaseT: 84,
	uppercaseU: 85,
	uppercaseV: 86,
	uppercaseW: 87,
	uppercaseX: 88,
	uppercaseY: 89,
	uppercaseZ: 90,
	leftSquareBracket: 91,
	backslash: 92,
	rightSquareBracket: 93,
	caret: 94,
	underscore: 95,
	graveAccent: 96,
	lowercaseA: 97,
	lowercaseB: 98,
	lowercaseC: 99,
	lowercaseD: 100,
	lowercaseE: 101,
	lowercaseF: 102,
	lowercaseG: 103,
	lowercaseH: 104,
	lowercaseI: 105,
	lowercaseJ: 106,
	lowercaseK: 107,
	lowercaseL: 108,
	lowercaseM: 109,
	lowercaseN: 110,
	lowercaseO: 111,
	lowercaseP: 112,
	lowercaseQ: 113,
	lowercaseR: 114,
	lowercaseS: 115,
	lowercaseT: 116,
	lowercaseU: 117,
	lowercaseV: 118,
	lowercaseW: 119,
	lowercaseX: 120,
	lowercaseY: 121,
	lowercaseZ: 122,
	leftCurlyBrace: 123,
	verticalBar: 124,
	rightCurlyBrace: 125,
	tilde: 126,
	del: 127,
	byteOrderMarker: 65279,
	replacementCharacter: 65533
}, zc = {
	attentionSideAfter: 2,
	attentionSideBefore: 1,
	atxHeadingOpeningFenceSizeMax: 6,
	autolinkDomainSizeMax: 63,
	autolinkSchemeSizeMax: 32,
	cdataOpeningString: "CDATA[",
	characterGroupPunctuation: 2,
	characterGroupWhitespace: 1,
	characterReferenceDecimalSizeMax: 7,
	characterReferenceHexadecimalSizeMax: 6,
	characterReferenceNamedSizeMax: 31,
	codeFencedSequenceSizeMin: 3,
	contentTypeContent: "content",
	contentTypeDocument: "document",
	contentTypeFlow: "flow",
	contentTypeString: "string",
	contentTypeText: "text",
	hardBreakPrefixSizeMin: 2,
	htmlBasic: 6,
	htmlCdata: 5,
	htmlComment: 2,
	htmlComplete: 7,
	htmlDeclaration: 4,
	htmlInstruction: 3,
	htmlRawSizeMax: 8,
	htmlRaw: 1,
	linkResourceDestinationBalanceMax: 32,
	linkReferenceSizeMax: 999,
	listItemValueSizeMax: 10,
	numericBaseDecimal: 10,
	numericBaseHexadecimal: 16,
	tabSize: 4,
	thematicBreakMarkerCountMin: 3,
	v8MaxSafeChunkSize: 1e4
}, Bc = {
	data: "data",
	whitespace: "whitespace",
	lineEnding: "lineEnding",
	lineEndingBlank: "lineEndingBlank",
	linePrefix: "linePrefix",
	lineSuffix: "lineSuffix",
	atxHeading: "atxHeading",
	atxHeadingSequence: "atxHeadingSequence",
	atxHeadingText: "atxHeadingText",
	autolink: "autolink",
	autolinkEmail: "autolinkEmail",
	autolinkMarker: "autolinkMarker",
	autolinkProtocol: "autolinkProtocol",
	characterEscape: "characterEscape",
	characterEscapeValue: "characterEscapeValue",
	characterReference: "characterReference",
	characterReferenceMarker: "characterReferenceMarker",
	characterReferenceMarkerNumeric: "characterReferenceMarkerNumeric",
	characterReferenceMarkerHexadecimal: "characterReferenceMarkerHexadecimal",
	characterReferenceValue: "characterReferenceValue",
	codeFenced: "codeFenced",
	codeFencedFence: "codeFencedFence",
	codeFencedFenceSequence: "codeFencedFenceSequence",
	codeFencedFenceInfo: "codeFencedFenceInfo",
	codeFencedFenceMeta: "codeFencedFenceMeta",
	codeFlowValue: "codeFlowValue",
	codeIndented: "codeIndented",
	codeText: "codeText",
	codeTextData: "codeTextData",
	codeTextPadding: "codeTextPadding",
	codeTextSequence: "codeTextSequence",
	content: "content",
	definition: "definition",
	definitionDestination: "definitionDestination",
	definitionDestinationLiteral: "definitionDestinationLiteral",
	definitionDestinationLiteralMarker: "definitionDestinationLiteralMarker",
	definitionDestinationRaw: "definitionDestinationRaw",
	definitionDestinationString: "definitionDestinationString",
	definitionLabel: "definitionLabel",
	definitionLabelMarker: "definitionLabelMarker",
	definitionLabelString: "definitionLabelString",
	definitionMarker: "definitionMarker",
	definitionTitle: "definitionTitle",
	definitionTitleMarker: "definitionTitleMarker",
	definitionTitleString: "definitionTitleString",
	emphasis: "emphasis",
	emphasisSequence: "emphasisSequence",
	emphasisText: "emphasisText",
	escapeMarker: "escapeMarker",
	hardBreakEscape: "hardBreakEscape",
	hardBreakTrailing: "hardBreakTrailing",
	htmlFlow: "htmlFlow",
	htmlFlowData: "htmlFlowData",
	htmlText: "htmlText",
	htmlTextData: "htmlTextData",
	image: "image",
	label: "label",
	labelText: "labelText",
	labelLink: "labelLink",
	labelImage: "labelImage",
	labelMarker: "labelMarker",
	labelImageMarker: "labelImageMarker",
	labelEnd: "labelEnd",
	link: "link",
	paragraph: "paragraph",
	reference: "reference",
	referenceMarker: "referenceMarker",
	referenceString: "referenceString",
	resource: "resource",
	resourceDestination: "resourceDestination",
	resourceDestinationLiteral: "resourceDestinationLiteral",
	resourceDestinationLiteralMarker: "resourceDestinationLiteralMarker",
	resourceDestinationRaw: "resourceDestinationRaw",
	resourceDestinationString: "resourceDestinationString",
	resourceMarker: "resourceMarker",
	resourceTitle: "resourceTitle",
	resourceTitleMarker: "resourceTitleMarker",
	resourceTitleString: "resourceTitleString",
	setextHeading: "setextHeading",
	setextHeadingText: "setextHeadingText",
	setextHeadingLine: "setextHeadingLine",
	setextHeadingLineSequence: "setextHeadingLineSequence",
	strong: "strong",
	strongSequence: "strongSequence",
	strongText: "strongText",
	thematicBreak: "thematicBreak",
	thematicBreakSequence: "thematicBreakSequence",
	blockQuote: "blockQuote",
	blockQuotePrefix: "blockQuotePrefix",
	blockQuoteMarker: "blockQuoteMarker",
	blockQuotePrefixWhitespace: "blockQuotePrefixWhitespace",
	listOrdered: "listOrdered",
	listUnordered: "listUnordered",
	listItemIndent: "listItemIndent",
	listItemMarker: "listItemMarker",
	listItemPrefix: "listItemPrefix",
	listItemPrefixWhitespace: "listItemPrefixWhitespace",
	listItemValue: "listItemValue",
	chunkDocument: "chunkDocument",
	chunkContent: "chunkContent",
	chunkFlow: "chunkFlow",
	chunkText: "chunkText",
	chunkString: "chunkString"
}, Vc = {
	carriageReturn: -5,
	lineFeed: -4,
	carriageReturnLineFeed: -3,
	horizontalTab: -2,
	virtualSpace: -1,
	eof: null,
	nul: 0,
	soh: 1,
	stx: 2,
	etx: 3,
	eot: 4,
	enq: 5,
	ack: 6,
	bel: 7,
	bs: 8,
	ht: 9,
	lf: 10,
	vt: 11,
	ff: 12,
	cr: 13,
	so: 14,
	si: 15,
	dle: 16,
	dc1: 17,
	dc2: 18,
	dc3: 19,
	dc4: 20,
	nak: 21,
	syn: 22,
	etb: 23,
	can: 24,
	em: 25,
	sub: 26,
	esc: 27,
	fs: 28,
	gs: 29,
	rs: 30,
	us: 31,
	space: 32,
	exclamationMark: 33,
	quotationMark: 34,
	numberSign: 35,
	dollarSign: 36,
	percentSign: 37,
	ampersand: 38,
	apostrophe: 39,
	leftParenthesis: 40,
	rightParenthesis: 41,
	asterisk: 42,
	plusSign: 43,
	comma: 44,
	dash: 45,
	dot: 46,
	slash: 47,
	digit0: 48,
	digit1: 49,
	digit2: 50,
	digit3: 51,
	digit4: 52,
	digit5: 53,
	digit6: 54,
	digit7: 55,
	digit8: 56,
	digit9: 57,
	colon: 58,
	semicolon: 59,
	lessThan: 60,
	equalsTo: 61,
	greaterThan: 62,
	questionMark: 63,
	atSign: 64,
	uppercaseA: 65,
	uppercaseB: 66,
	uppercaseC: 67,
	uppercaseD: 68,
	uppercaseE: 69,
	uppercaseF: 70,
	uppercaseG: 71,
	uppercaseH: 72,
	uppercaseI: 73,
	uppercaseJ: 74,
	uppercaseK: 75,
	uppercaseL: 76,
	uppercaseM: 77,
	uppercaseN: 78,
	uppercaseO: 79,
	uppercaseP: 80,
	uppercaseQ: 81,
	uppercaseR: 82,
	uppercaseS: 83,
	uppercaseT: 84,
	uppercaseU: 85,
	uppercaseV: 86,
	uppercaseW: 87,
	uppercaseX: 88,
	uppercaseY: 89,
	uppercaseZ: 90,
	leftSquareBracket: 91,
	backslash: 92,
	rightSquareBracket: 93,
	caret: 94,
	underscore: 95,
	graveAccent: 96,
	lowercaseA: 97,
	lowercaseB: 98,
	lowercaseC: 99,
	lowercaseD: 100,
	lowercaseE: 101,
	lowercaseF: 102,
	lowercaseG: 103,
	lowercaseH: 104,
	lowercaseI: 105,
	lowercaseJ: 106,
	lowercaseK: 107,
	lowercaseL: 108,
	lowercaseM: 109,
	lowercaseN: 110,
	lowercaseO: 111,
	lowercaseP: 112,
	lowercaseQ: 113,
	lowercaseR: 114,
	lowercaseS: 115,
	lowercaseT: 116,
	lowercaseU: 117,
	lowercaseV: 118,
	lowercaseW: 119,
	lowercaseX: 120,
	lowercaseY: 121,
	lowercaseZ: 122,
	leftCurlyBrace: 123,
	verticalBar: 124,
	rightCurlyBrace: 125,
	tilde: 126,
	del: 127,
	byteOrderMarker: 65279,
	replacementCharacter: 65533
}, Hc = {
	attentionSideAfter: 2,
	attentionSideBefore: 1,
	atxHeadingOpeningFenceSizeMax: 6,
	autolinkDomainSizeMax: 63,
	autolinkSchemeSizeMax: 32,
	cdataOpeningString: "CDATA[",
	characterGroupPunctuation: 2,
	characterGroupWhitespace: 1,
	characterReferenceDecimalSizeMax: 7,
	characterReferenceHexadecimalSizeMax: 6,
	characterReferenceNamedSizeMax: 31,
	codeFencedSequenceSizeMin: 3,
	contentTypeContent: "content",
	contentTypeDocument: "document",
	contentTypeFlow: "flow",
	contentTypeString: "string",
	contentTypeText: "text",
	hardBreakPrefixSizeMin: 2,
	htmlBasic: 6,
	htmlCdata: 5,
	htmlComment: 2,
	htmlComplete: 7,
	htmlDeclaration: 4,
	htmlInstruction: 3,
	htmlRawSizeMax: 8,
	htmlRaw: 1,
	linkResourceDestinationBalanceMax: 32,
	linkReferenceSizeMax: 999,
	listItemValueSizeMax: 10,
	numericBaseDecimal: 10,
	numericBaseHexadecimal: 16,
	tabSize: 4,
	thematicBreakMarkerCountMin: 3,
	v8MaxSafeChunkSize: 1e4
};
function Uc(e) {
	return e !== null && (e < 0 || e === 32);
}
var Wc = [
	161,
	161,
	164,
	164,
	167,
	168,
	170,
	170,
	173,
	174,
	176,
	180,
	182,
	186,
	188,
	191,
	198,
	198,
	208,
	208,
	215,
	216,
	222,
	225,
	230,
	230,
	232,
	234,
	236,
	237,
	240,
	240,
	242,
	243,
	247,
	250,
	252,
	252,
	254,
	254,
	257,
	257,
	273,
	273,
	275,
	275,
	283,
	283,
	294,
	295,
	299,
	299,
	305,
	307,
	312,
	312,
	319,
	322,
	324,
	324,
	328,
	331,
	333,
	333,
	338,
	339,
	358,
	359,
	363,
	363,
	462,
	462,
	464,
	464,
	466,
	466,
	468,
	468,
	470,
	470,
	472,
	472,
	474,
	474,
	476,
	476,
	593,
	593,
	609,
	609,
	708,
	708,
	711,
	711,
	713,
	715,
	717,
	717,
	720,
	720,
	728,
	731,
	733,
	733,
	735,
	735,
	768,
	879,
	913,
	929,
	931,
	937,
	945,
	961,
	963,
	969,
	1025,
	1025,
	1040,
	1103,
	1105,
	1105,
	8208,
	8208,
	8211,
	8214,
	8216,
	8217,
	8220,
	8221,
	8224,
	8226,
	8228,
	8231,
	8240,
	8240,
	8242,
	8243,
	8245,
	8245,
	8251,
	8251,
	8254,
	8254,
	8308,
	8308,
	8319,
	8319,
	8321,
	8324,
	8364,
	8364,
	8451,
	8451,
	8453,
	8453,
	8457,
	8457,
	8467,
	8467,
	8470,
	8470,
	8481,
	8482,
	8486,
	8486,
	8491,
	8491,
	8531,
	8532,
	8539,
	8542,
	8544,
	8555,
	8560,
	8569,
	8585,
	8585,
	8592,
	8601,
	8632,
	8633,
	8658,
	8658,
	8660,
	8660,
	8679,
	8679,
	8704,
	8704,
	8706,
	8707,
	8711,
	8712,
	8715,
	8715,
	8719,
	8719,
	8721,
	8721,
	8725,
	8725,
	8730,
	8730,
	8733,
	8736,
	8739,
	8739,
	8741,
	8741,
	8743,
	8748,
	8750,
	8750,
	8756,
	8759,
	8764,
	8765,
	8776,
	8776,
	8780,
	8780,
	8786,
	8786,
	8800,
	8801,
	8804,
	8807,
	8810,
	8811,
	8814,
	8815,
	8834,
	8835,
	8838,
	8839,
	8853,
	8853,
	8857,
	8857,
	8869,
	8869,
	8895,
	8895,
	8978,
	8978,
	9312,
	9449,
	9451,
	9547,
	9552,
	9587,
	9600,
	9615,
	9618,
	9621,
	9632,
	9633,
	9635,
	9641,
	9650,
	9651,
	9654,
	9655,
	9660,
	9661,
	9664,
	9665,
	9670,
	9672,
	9675,
	9675,
	9678,
	9681,
	9698,
	9701,
	9711,
	9711,
	9733,
	9734,
	9737,
	9737,
	9742,
	9743,
	9756,
	9756,
	9758,
	9758,
	9792,
	9792,
	9794,
	9794,
	9824,
	9825,
	9827,
	9829,
	9831,
	9834,
	9836,
	9837,
	9839,
	9839,
	9886,
	9887,
	9919,
	9919,
	9926,
	9933,
	9935,
	9939,
	9941,
	9953,
	9955,
	9955,
	9960,
	9961,
	9963,
	9969,
	9972,
	9972,
	9974,
	9977,
	9979,
	9980,
	9982,
	9983,
	10045,
	10045,
	10102,
	10111,
	11094,
	11097,
	12872,
	12879,
	57344,
	63743,
	65024,
	65039,
	65533,
	65533,
	127232,
	127242,
	127248,
	127277,
	127280,
	127337,
	127344,
	127373,
	127375,
	127376,
	127387,
	127404,
	917760,
	917999,
	983040,
	1048573,
	1048576,
	1114109
], Gc = [
	12288,
	12288,
	65281,
	65376,
	65504,
	65510
], Kc = [
	8361,
	8361,
	65377,
	65470,
	65474,
	65479,
	65482,
	65487,
	65490,
	65495,
	65498,
	65500,
	65512,
	65518
], qc = [
	32,
	126,
	162,
	163,
	165,
	166,
	172,
	172,
	175,
	175,
	10214,
	10221,
	10629,
	10630
], Jc = [
	4352,
	4447,
	8986,
	8987,
	9001,
	9002,
	9193,
	9196,
	9200,
	9200,
	9203,
	9203,
	9725,
	9726,
	9748,
	9749,
	9776,
	9783,
	9800,
	9811,
	9855,
	9855,
	9866,
	9871,
	9875,
	9875,
	9889,
	9889,
	9898,
	9899,
	9917,
	9918,
	9924,
	9925,
	9934,
	9934,
	9940,
	9940,
	9962,
	9962,
	9970,
	9971,
	9973,
	9973,
	9978,
	9978,
	9981,
	9981,
	9989,
	9989,
	9994,
	9995,
	10024,
	10024,
	10060,
	10060,
	10062,
	10062,
	10067,
	10069,
	10071,
	10071,
	10133,
	10135,
	10160,
	10160,
	10175,
	10175,
	11035,
	11036,
	11088,
	11088,
	11093,
	11093,
	11904,
	11929,
	11931,
	12019,
	12032,
	12245,
	12272,
	12287,
	12289,
	12350,
	12353,
	12438,
	12441,
	12543,
	12549,
	12591,
	12593,
	12686,
	12688,
	12773,
	12783,
	12830,
	12832,
	12871,
	12880,
	42124,
	42128,
	42182,
	43360,
	43388,
	44032,
	55203,
	63744,
	64255,
	65040,
	65049,
	65072,
	65106,
	65108,
	65126,
	65128,
	65131,
	94176,
	94180,
	94192,
	94198,
	94208,
	101594,
	101631,
	101664,
	101760,
	101874,
	101888,
	102801,
	102816,
	102866,
	110576,
	110579,
	110581,
	110587,
	110589,
	110590,
	110592,
	110888,
	110898,
	110898,
	110928,
	110930,
	110933,
	110933,
	110948,
	110952,
	110960,
	111355,
	119552,
	119638,
	119648,
	119670,
	126980,
	126980,
	127183,
	127183,
	127374,
	127374,
	127377,
	127386,
	127406,
	127406,
	127488,
	127490,
	127504,
	127547,
	127552,
	127560,
	127568,
	127569,
	127584,
	127589,
	127744,
	127776,
	127789,
	127797,
	127799,
	127868,
	127870,
	127891,
	127904,
	127946,
	127951,
	127955,
	127968,
	127984,
	127988,
	127988,
	127992,
	128062,
	128064,
	128064,
	128066,
	128252,
	128255,
	128317,
	128331,
	128334,
	128336,
	128359,
	128378,
	128378,
	128405,
	128406,
	128420,
	128420,
	128507,
	128591,
	128640,
	128709,
	128716,
	128716,
	128720,
	128722,
	128725,
	128729,
	128732,
	128735,
	128747,
	128748,
	128756,
	128764,
	128986,
	128986,
	128992,
	129003,
	129008,
	129008,
	129292,
	129338,
	129340,
	129349,
	129351,
	129535,
	129648,
	129660,
	129664,
	129734,
	129736,
	129736,
	129740,
	129757,
	129759,
	129771,
	129775,
	129786,
	131072,
	196605,
	196608,
	262141
], Yc = (e, t) => {
	let n = 0, r = Math.floor(e.length / 2) - 1;
	for (; n <= r;) {
		let i = Math.floor((n + r) / 2), a = i * 2;
		if (t < e[a]) r = i - 1;
		else if (t > e[a + 1]) n = i + 1;
		else return !0;
	}
	return !1;
}, Xc = 19968, [Zc, Qc] = /* #__PURE__ */ $c(Jc);
function $c(e) {
	let t = e[0], n = e[1];
	for (let r = 0; r < e.length; r += 2) {
		let i = e[r], a = e[r + 1];
		if (Xc >= i && Xc <= a) return [i, a];
		a - i > n - t && (t = i, n = a);
	}
	return [t, n];
}
var el = (e) => e < 161 || e > 1114109 ? !1 : Yc(Wc, e), tl = (e) => e < 12288 || e > 65510 ? !1 : Yc(Gc, e), nl = (e) => e < 8361 || e > 65518 ? !1 : Yc(Kc, e), rl = (e) => e < 32 || e > 10630 ? !1 : Yc(qc, e), il = (e) => e >= Zc && e <= Qc ? !0 : e < 4352 || e > 262141 ? !1 : Yc(Jc, e);
function al(e) {
	return el(e) ? "ambiguous" : tl(e) ? "fullwidth" : nl(e) ? "halfwidth" : rl(e) ? "narrow" : il(e) ? "wide" : "neutral";
}
// node_modules/get-east-asian-width/index.js
function ol(e) {
	if (!Number.isSafeInteger(e)) throw TypeError(`Expected a code point, got \`${typeof e}\`.`);
}
function sl(e) {
	return ol(e), al(e);
}
// node_modules/micromark-extension-cjk-friendly-util/dist/index.js
var cl = Object.defineProperty, ll = (e, t, n) => t in e ? cl(e, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: n
}) : e[t] = n, ul = (e, t, n) => ll(e, typeof t == "symbol" ? t : t + "", n);
function dl(e) {
	return /^\p{Emoji_Presentation}/u.test(String.fromCodePoint(e));
}
function fl(e) {
	if (!e || e < 4352) return !1;
	switch (sl(e)) {
		case "fullwidth":
		case "halfwidth": return !0;
		case "wide": return !dl(e);
		case "narrow": return !1;
		case "ambiguous": return 917760 <= e && e <= 917999 && null;
		case "neutral": return /^\p{sc=Hangul}/u.test(String.fromCodePoint(e));
	}
}
function pl(e, t) {
	return t !== 65025 || !e || e < 8216 ? !1 : e === 8216 || e === 8217 || e === 8220 || e === 8221;
}
function ml(e) {
	return e !== null && e >= 65024 && e <= 65038;
}
var hl = _l(/\p{P}|\p{S}/u), gl = _l(/\s/);
function _l(e) {
	return t;
	function t(t) {
		return t !== null && t > -1 && e.test(String.fromCodePoint(t));
	}
}
var vl;
((e) => {
	e.spaceOrPunctuation = 3, e.cjk = 4096, e.cjkPunctuation = 4098, e.ivs = 8192, e.cjkOrIvs = 12288, e.nonEmojiGeneralUseVS = 16384, e.variationSelector = 24576, e.ivsToCjkRightShift = 1;
})(vl ||= {});
function yl(e) {
	if (e === Vc.eof || Uc(e) || gl(e)) return Hc.characterGroupWhitespace;
	let t = 0;
	if (e >= 4352) {
		if (ml(e)) return vl.nonEmojiGeneralUseVS;
		switch (fl(e)) {
			case null: return vl.ivs;
			case !0: t |= vl.cjk;
		}
	}
	return hl(e) && (t |= Hc.characterGroupPunctuation), t;
}
function bl(e, t, n) {
	if (!Dl(e)) return e;
	let r = t(), i = yl(r);
	return !r || Sl(i) ? e : pl(r, n) ? vl.cjkPunctuation : xl(i);
}
function xl(e) {
	return e & ~vl.ivs;
}
function Sl(e) {
	return !!(e & Hc.characterGroupWhitespace);
}
function Cl(e) {
	return (e & vl.cjkPunctuation) === Hc.characterGroupPunctuation;
}
function wl(e) {
	return !!(e & vl.cjk);
}
function Tl(e) {
	return e === vl.ivs;
}
function El(e) {
	return !!(e & vl.cjkOrIvs);
}
function Dl(e) {
	return e === vl.nonEmojiGeneralUseVS;
}
function Ol(e) {
	return !!(e & vl.spaceOrPunctuation);
}
function kl(e) {
	return !!(e && e >= 55296 && e <= 56319);
}
function Al(e) {
	return !!(e && e >= 56320 && e <= 57343);
}
function jl(e, t, n) {
	if (t._bufferIndex < 2) return e;
	let r = n({
		start: {
			...t,
			_bufferIndex: t._bufferIndex - 2
		},
		end: t
	}).codePointAt(0);
	return r && r >= 65536 ? r : e;
}
function Ml(e, t, n) {
	let r = e >= 65536 ? 2 : 1;
	if (t._bufferIndex < 1 + r) return null;
	let i = t._bufferIndex - r - 2, a = n({
		start: {
			...t,
			_bufferIndex: i >= 0 ? i : 0
		},
		end: {
			...t,
			_bufferIndex: t._bufferIndex - r
		}
	}), o = a.charCodeAt(a.length - 1);
	if (Number.isNaN(o)) return null;
	if (a.length < 2 || o < 56320 || 57343 < o) return o;
	let s = a.codePointAt(0);
	return s && s >= 65536 ? s : o;
}
var Nl = class {
	constructor(e, t, n) {
		this.previousCode = e, this.nowPoint = t, this.sliceSerialize = n, ul(this, "cachedValue");
	}
	value() {
		return this.cachedValue === void 0 && (this.cachedValue = Ml(this.previousCode, this.nowPoint, this.sliceSerialize)), this.cachedValue;
	}
};
function Pl(e, t, n) {
	let r = n({
		start: t,
		end: {
			...t,
			_bufferIndex: t._bufferIndex + 2
		}
	}).codePointAt(0);
	return r && r >= 65536 ? r : e;
}
// node_modules/streamdown/node_modules/micromark-util-chunked/index.js
function Fl(e, t, n, r) {
	let i = e.length, a = 0, o;
	if (t = t < 0 ? -t > i ? 0 : i + t : t > i ? i : t, n = n > 0 ? n : 0, r.length < 1e4) o = Array.from(r), o.unshift(t, n), e.splice(...o);
	else for (n && e.splice(t, n); a < r.length;) o = r.slice(a, a + 1e4), o.unshift(t, 0), e.splice(...o), a += 1e4, t += 1e4;
}
function Il(e, t) {
	return e.length > 0 ? (Fl(e, e.length, 0, t), e) : t;
}
// node_modules/streamdown/node_modules/micromark-util-resolve-all/index.js
function Ll(e, t, n) {
	let r = [], i = -1;
	for (; ++i < e.length;) {
		let a = e[i].resolveAll;
		a && !r.includes(a) && (t = a(t, n), r.push(a));
	}
	return t;
}
// node_modules/streamdown/node_modules/micromark-extension-cjk-friendly/dist/index.js
var Rl = {
	name: "attention",
	resolveAll: zl,
	tokenize: Bl
};
function zl(e, t) {
	let n = -1, r, i, a, o, s, c, l, u;
	for (; ++n < e.length;) if (e[n][0] === "enter" && e[n][1].type === "attentionSequence" && e[n][1]._close) {
		for (r = n; r--;) if (e[r][0] === "exit" && e[r][1].type === "attentionSequence" && e[r][1]._open && t.sliceSerialize(e[r][1]).charCodeAt(0) === t.sliceSerialize(e[n][1]).charCodeAt(0)) {
			if ((e[r][1]._close || e[n][1]._open) && (e[n][1].end.offset - e[n][1].start.offset) % 3 && !((e[r][1].end.offset - e[r][1].start.offset + e[n][1].end.offset - e[n][1].start.offset) % 3)) continue;
			c = e[r][1].end.offset - e[r][1].start.offset > 1 && e[n][1].end.offset - e[n][1].start.offset > 1 ? 2 : 1;
			let d = { ...e[r][1].end }, f = { ...e[n][1].start };
			Vl(d, -c), Vl(f, c), o = {
				type: c > 1 ? Bc.strongSequence : Bc.emphasisSequence,
				start: d,
				end: { ...e[r][1].end }
			}, s = {
				type: c > 1 ? Bc.strongSequence : Bc.emphasisSequence,
				start: { ...e[n][1].start },
				end: f
			}, a = {
				type: c > 1 ? Bc.strongText : Bc.emphasisText,
				start: { ...e[r][1].end },
				end: { ...e[n][1].start }
			}, i = {
				type: c > 1 ? Bc.strong : Bc.emphasis,
				start: { ...o.start },
				end: { ...s.end }
			}, e[r][1].end = { ...o.start }, e[n][1].start = { ...s.end }, l = [], e[r][1].end.offset - e[r][1].start.offset && (l = Il(l, [[
				"enter",
				e[r][1],
				t
			], [
				"exit",
				e[r][1],
				t
			]])), l = Il(l, [
				[
					"enter",
					i,
					t
				],
				[
					"enter",
					o,
					t
				],
				[
					"exit",
					o,
					t
				],
				[
					"enter",
					a,
					t
				]
			]), t.parser.constructs.insideSpan.null, l = Il(l, Ll(t.parser.constructs.insideSpan.null, e.slice(r + 1, n), t)), l = Il(l, [
				[
					"exit",
					a,
					t
				],
				[
					"enter",
					s,
					t
				],
				[
					"exit",
					s,
					t
				],
				[
					"exit",
					i,
					t
				]
			]), e[n][1].end.offset - e[n][1].start.offset ? (u = 2, l = Il(l, [[
				"enter",
				e[n][1],
				t
			], [
				"exit",
				e[n][1],
				t
			]])) : u = 0, Fl(e, r - 1, n - r + 3, l), n = r + l.length - u - 2;
			break;
		}
	}
	for (n = -1; ++n < e.length;) e[n][1].type === "attentionSequence" && (e[n][1].type = "data");
	return e;
}
function Bl(e, t) {
	let n = this.parser.constructs.attentionMarkers.null, { now: r, sliceSerialize: i, previous: a } = this, o = Al(a) ? jl(a, r(), i) : a, s = yl(o), c = new Nl(o, r(), i), l = bl(s, c.value.bind(c), o), u;
	return d;
	function d(t) {
		return t === Rc.asterisk || Rc.underscore, u = t, e.enter("attentionSequence"), f(t);
	}
	function f(a) {
		if (a === u) return e.consume(a), f;
		let s = e.exit("attentionSequence"), c = yl(kl(a) ? Pl(a, r(), i) : a), d = Cl(l), p = d || Sl(l), m = Cl(c), h = m || Sl(c), g = El(l), _ = !h || m && (p || g) || n.includes(a), v = !p || d && (h || wl(c)) || n.includes(o);
		return s._open = !!(u === Rc.asterisk ? _ : _ && (Ol(l) || !v)), s._close = !!(u === Rc.asterisk ? v : v && (Ol(c) || !_)), t(a);
	}
}
function Vl(e, t) {
	e.column += t, e.offset += t, e._bufferIndex += t;
}
function Hl() {
	return {
		text: {
			[Rc.asterisk]: Rl,
			[Rc.underscore]: Rl
		},
		insideSpan: { null: [Rl] }
	};
}
// node_modules/streamdown/node_modules/remark-cjk-friendly/dist/index.js
function Ul() {
	let e = this.data();
	(e.micromarkExtensions ||= []).push(Hl());
}
// node_modules/streamdown/node_modules/micromark-extension-cjk-friendly-gfm-strikethrough/dist/index.js
function Wl(e) {
	let t = (e || {}).singleTilde, n = {
		name: "strikethrough",
		tokenize: i,
		resolveAll: r
	};
	return t ??= !0, {
		text: { [Rc.tilde]: n },
		insideSpan: { null: [n] },
		attentionMarkers: { null: [Rc.tilde] }
	};
	function r(e, t) {
		let n = -1;
		for (; ++n < e.length;) if (e[n][0] === "enter" && e[n][1].type === "strikethroughSequenceTemporary" && e[n][1]._close) {
			let r = n;
			for (; r--;) if (e[r][0] === "exit" && e[r][1].type === "strikethroughSequenceTemporary" && e[r][1]._open && e[n][1].end.offset - e[n][1].start.offset === e[r][1].end.offset - e[r][1].start.offset) {
				e[n][1].type = "strikethroughSequence", e[r][1].type = "strikethroughSequence";
				let i = {
					type: "strikethrough",
					start: Object.assign({}, e[r][1].start),
					end: Object.assign({}, e[n][1].end)
				}, a = {
					type: "strikethroughText",
					start: Object.assign({}, e[r][1].end),
					end: Object.assign({}, e[n][1].start)
				}, o = [
					[
						"enter",
						i,
						t
					],
					[
						"enter",
						e[r][1],
						t
					],
					[
						"exit",
						e[r][1],
						t
					],
					[
						"enter",
						a,
						t
					]
				], s = t.parser.constructs.insideSpan.null;
				s && Fl(o, o.length, 0, Ll(s, e.slice(r + 1, n), t)), Fl(o, o.length, 0, [
					[
						"exit",
						a,
						t
					],
					[
						"enter",
						e[n][1],
						t
					],
					[
						"exit",
						e[n][1],
						t
					],
					[
						"exit",
						i,
						t
					]
				]), Fl(e, r - 1, n - r + 3, o), n = r + o.length - 2;
				break;
			}
		}
		for (n = -1; ++n < e.length;) e[n][1].type === "strikethroughSequenceTemporary" && (e[n][1].type = Bc.data);
		return e;
	}
	function i(e, n, r) {
		let { now: i, sliceSerialize: a, previous: o } = this, s = Al(o) ? jl(o, i(), a) : o, c = yl(s), l = new Nl(s, i(), a), u = bl(c, l.value.bind(l), s), d = this.events, f = 0;
		return p;
		function p(t) {
			return Rc.tilde, s === Rc.tilde && d[d.length - 1][1].type !== Bc.characterEscape ? r(t) : (e.enter("strikethroughSequenceTemporary"), m(t));
		}
		function m(o) {
			let c = yl(s);
			if (o === Rc.tilde) return f > 1 ? r(o) : (e.consume(o), f++, m);
			if (f < 2 && !t) return r(o);
			let l = e.exit("strikethroughSequenceTemporary"), d = yl(kl(o) ? Pl(o, i(), a) : o), p = Cl(u) || Sl(u), h = Cl(d) || Sl(d), g = wl(u) || Tl(c);
			return l._open = !h || d === zc.attentionSideAfter && (p || g), l._close = !p || c === zc.attentionSideAfter && (h || wl(d)), n(o);
		}
	}
}
// node_modules/streamdown/node_modules/remark-cjk-friendly-gfm-strikethrough/dist/index.js
function Gl(e) {
	let t = this.data();
	(t.micromarkExtensions ||= []).push(Wl(e));
}
// node_modules/ccount/index.js
function Kl(e, t) {
	let n = String(e);
	if (typeof t != "string") throw TypeError("Expected character");
	let r = 0, i = n.indexOf(t);
	for (; i !== -1;) r++, i = n.indexOf(t, i + t.length);
	return r;
}
var ql = Yl(/\p{P}|\p{S}/u), Jl = Yl(/\s/);
function Yl(e) {
	return t;
	function t(t) {
		return t !== null && t > -1 && e.test(String.fromCharCode(t));
	}
}
// node_modules/escape-string-regexp/index.js
function Xl(e) {
	if (typeof e != "string") throw TypeError("Expected a string");
	return e.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
}
// node_modules/mdast-util-find-and-replace/lib/index.js
function Zl(e, t, n) {
	let r = c((n || {}).ignore || []), i = Ql(t), a = -1;
	for (; ++a < i.length;) v(e, o);
	function o(e, t, n) {
		if (e.type === "text" && typeof n == "number") return s(e, t, n);
		if (r(e, n, t[t.length - 1])) return _;
	}
	function s(e, t, n) {
		let r = t[t.length - 1], o = i[a][0], s = i[a][1], c = 0, l = !1, u = [];
		o.lastIndex = 0;
		let d = o.exec(e.value);
		for (; d;) {
			let n = d.index, r = {
				index: d.index,
				input: d.input,
				stack: [...t, e]
			}, i = s(...d, r);
			if (typeof i == "string" && (i = i.length > 0 ? {
				type: "text",
				value: i
			} : void 0), i === !1) o.lastIndex = n + 1;
			else {
				if (c !== n && f({
					type: "text",
					value: e.value.slice(c, n)
				}), Array.isArray(i)) for (let e of i) f(e);
				else i && f(i);
				c = n + d[0].length, l = !0;
			}
			if (!o.global) break;
			d = o.exec(e.value);
		}
		return l ? (c < e.value.length && f({
			type: "text",
			value: e.value.slice(c)
		}), r.children.splice(n, 1, ...u)) : u = [e], n + u.length;
		function f(e) {
			let t = u[u.length - 1];
			t && t.type === "text" && e.type === "text" ? t.value += e.value : u.push(e);
		}
	}
}
function Ql(e) {
	if (!Array.isArray(e)) throw TypeError("Expected find and replace tuple or list of tuples");
	let t = [], n = !e[0] || Array.isArray(e[0]) ? e : [e], r = -1;
	for (; ++r < n.length;) {
		let e = n[r];
		t.push([$l(e[0]), eu(e[1])]);
	}
	return t;
}
function $l(e) {
	return typeof e == "string" ? new RegExp(Xl(e), "g") : e;
}
function eu(e) {
	return typeof e == "function" ? e : function() {
		return e;
	};
}
// node_modules/mdast-util-gfm-autolink-literal/lib/index.js
var tu = "phrasing", nu = [
	"autolink",
	"link",
	"image",
	"label"
];
function ru() {
	return {
		transforms: [du],
		enter: {
			literalAutolink: au,
			literalAutolinkEmail: ou,
			literalAutolinkHttp: ou,
			literalAutolinkWww: ou
		},
		exit: {
			literalAutolink: uu,
			literalAutolinkEmail: lu,
			literalAutolinkHttp: su,
			literalAutolinkWww: cu
		}
	};
}
function iu() {
	return { unsafe: [
		{
			character: "@",
			before: "[+\\-.\\w]",
			after: "[\\-.\\w]",
			inConstruct: tu,
			notInConstruct: nu
		},
		{
			character: ".",
			before: "[Ww]",
			after: "[\\-.\\w]",
			inConstruct: tu,
			notInConstruct: nu
		},
		{
			character: ":",
			before: "[ps]",
			after: "\\/",
			inConstruct: tu,
			notInConstruct: nu
		}
	] };
}
function au(e) {
	this.enter({
		type: "link",
		title: null,
		url: "",
		children: []
	}, e);
}
function ou(e) {
	this.config.enter.autolinkProtocol.call(this, e);
}
function su(e) {
	this.config.exit.autolinkProtocol.call(this, e);
}
function cu(e) {
	this.config.exit.data.call(this, e);
	let t = this.stack[this.stack.length - 1];
	t.type, t.url = "http://" + this.sliceSerialize(e);
}
function lu(e) {
	this.config.exit.autolinkEmail.call(this, e);
}
function uu(e) {
	this.exit(e);
}
function du(e) {
	Zl(e, [[/(https?:\/\/|www(?=\.))([-.\w]+)([^ \t\r\n]*)/gi, fu], [/(?<=^|\s|\p{P}|\p{S})([-.\w+]+)@([-\w]+(?:\.[-\w]+)+)/gu, pu]], { ignore: ["link", "linkReference"] });
}
function fu(e, t, n, r, i) {
	let a = "";
	if (!gu(i) || (/^w/i.test(t) && (n = t + n, t = "", a = "http://"), !mu(n))) return !1;
	let o = hu(n + r);
	if (!o[0]) return !1;
	let s = {
		type: "link",
		title: null,
		url: a + t + o[0],
		children: [{
			type: "text",
			value: t + o[0]
		}]
	};
	return o[1] ? [s, {
		type: "text",
		value: o[1]
	}] : s;
}
function pu(e, t, n, r) {
	return !gu(r, !0) || /[-\d_]$/.test(n) ? !1 : {
		type: "link",
		title: null,
		url: "mailto:" + t + "@" + n,
		children: [{
			type: "text",
			value: t + "@" + n
		}]
	};
}
function mu(e) {
	let t = e.split(".");
	return !(t.length < 2 || t[t.length - 1] && (/_/.test(t[t.length - 1]) || !/[a-zA-Z\d]/.test(t[t.length - 1])) || t[t.length - 2] && (/_/.test(t[t.length - 2]) || !/[a-zA-Z\d]/.test(t[t.length - 2])));
}
function hu(e) {
	let t = /[!"&'),.:;<>?\]}]+$/.exec(e);
	if (!t) return [e, void 0];
	e = e.slice(0, t.index);
	let n = t[0], r = n.indexOf(")"), i = Kl(e, "("), a = Kl(e, ")");
	for (; r !== -1 && i > a;) e += n.slice(0, r + 1), n = n.slice(r + 1), r = n.indexOf(")"), a++;
	return [e, n];
}
function gu(e, t) {
	let n = e.input.charCodeAt(e.index - 1);
	return (e.index === 0 || Jl(n) || ql(n)) && (!t || n !== 47);
}
// node_modules/mdast-util-gfm-footnote/node_modules/micromark-util-normalize-identifier/index.js
function _u(e) {
	return e.replace(/[\t\n\r ]+/g, " ").replace(/^ | $/g, "").toLowerCase().toUpperCase();
}
// node_modules/mdast-util-gfm-footnote/lib/index.js
Du.peek = Eu;
function vu() {
	this.buffer();
}
function yu(e) {
	this.enter({
		type: "footnoteReference",
		identifier: "",
		label: ""
	}, e);
}
function bu() {
	this.buffer();
}
function xu(e) {
	this.enter({
		type: "footnoteDefinition",
		identifier: "",
		label: "",
		children: []
	}, e);
}
function Su(e) {
	let t = this.resume(), n = this.stack[this.stack.length - 1];
	n.type, n.identifier = _u(this.sliceSerialize(e)).toLowerCase(), n.label = t;
}
function Cu(e) {
	this.exit(e);
}
function wu(e) {
	let t = this.resume(), n = this.stack[this.stack.length - 1];
	n.type, n.identifier = _u(this.sliceSerialize(e)).toLowerCase(), n.label = t;
}
function Tu(e) {
	this.exit(e);
}
function Eu() {
	return "[";
}
function Du(e, t, n, r) {
	let i = n.createTracker(r), a = i.move("[^"), o = n.enter("footnoteReference"), s = n.enter("reference");
	return a += i.move(n.safe(n.associationId(e), {
		after: "]",
		before: a
	})), s(), o(), a += i.move("]"), a;
}
function Ou() {
	return {
		enter: {
			gfmFootnoteCallString: vu,
			gfmFootnoteCall: yu,
			gfmFootnoteDefinitionLabelString: bu,
			gfmFootnoteDefinition: xu
		},
		exit: {
			gfmFootnoteCallString: Su,
			gfmFootnoteCall: Cu,
			gfmFootnoteDefinitionLabelString: wu,
			gfmFootnoteDefinition: Tu
		}
	};
}
function ku(e) {
	let t = !1;
	return e && e.firstLineBlank && (t = !0), {
		handlers: {
			footnoteDefinition: n,
			footnoteReference: Du
		},
		unsafe: [{
			character: "[",
			inConstruct: [
				"label",
				"phrasing",
				"reference"
			]
		}]
	};
	function n(e, n, r, i) {
		let a = r.createTracker(i), o = a.move("[^"), s = r.enter("footnoteDefinition"), c = r.enter("label");
		return o += a.move(r.safe(r.associationId(e), {
			before: o,
			after: "]"
		})), c(), o += a.move("]:"), e.children && e.children.length > 0 && (a.shift(4), o += a.move((t ? "\n" : " ") + r.indentLines(r.containerFlow(e, a.current()), t ? ju : Au))), s(), o;
	}
}
function Au(e, t, n) {
	return t === 0 ? e : ju(e, t, n);
}
function ju(e, t, n) {
	return (n ? "" : "    ") + e;
}
// node_modules/mdast-util-gfm-strikethrough/lib/index.js
var Mu = [
	"autolink",
	"destinationLiteral",
	"destinationRaw",
	"reference",
	"titleQuote",
	"titleApostrophe"
];
Lu.attention = Ru, Lu.peek = zu;
function Nu() {
	return {
		canContainEols: ["delete"],
		enter: { strikethrough: Fu },
		exit: { strikethrough: Iu }
	};
}
function Pu() {
	return {
		handlers: { delete: Lu },
		unsafe: [{
			character: "~",
			inConstruct: "phrasing",
			notInConstruct: Mu
		}]
	};
}
function Fu(e) {
	this.enter({
		type: "delete",
		children: [],
		position: void 0
	}, e);
}
function Iu(e) {
	this.exit(e);
}
function Lu(e, t, n, r) {
	let i = n.createTracker(r), a = n.stack.includes("strikethrough") ? "~" : "~~", o = n.enter("strikethrough"), s = i.move(a);
	return s += n.containerPhrasing(e, {
		...i.current(),
		before: s,
		after: "~"
	}), s += i.move(a), o(), s;
}
function Ru() {
	return {
		construct: "strikethrough",
		markers: ["~"],
		sizes: [2, 1]
	};
}
function zu() {
	return "~";
}
// node_modules/markdown-table/index.js
function Bu(e) {
	return e.length;
}
function Vu(e, t) {
	let n = t || {}, r = (n.align || []).concat(), i = n.stringLength || Bu, a = [], o = [], s = [], c = [], l = 0, u = -1;
	for (; ++u < e.length;) {
		let t = [], r = [], a = -1;
		for (e[u].length > l && (l = e[u].length); ++a < e[u].length;) {
			let o = Hu(e[u][a]);
			if (n.alignDelimiters !== !1) {
				let e = i(o);
				r[a] = e, (c[a] === void 0 || e > c[a]) && (c[a] = e);
			}
			t.push(o);
		}
		o[u] = t, s[u] = r;
	}
	let d = -1;
	if (typeof r == "object" && "length" in r) for (; ++d < l;) a[d] = Uu(r[d]);
	else {
		let e = Uu(r);
		for (; ++d < l;) a[d] = e;
	}
	d = -1;
	let f = [], p = [];
	for (; ++d < l;) {
		let e = a[d], t = "", r = "";
		e === 99 ? (t = ":", r = ":") : e === 108 ? t = ":" : e === 114 && (r = ":");
		let i = n.alignDelimiters === !1 ? 1 : Math.max(1, c[d] - t.length - r.length), o = t + "-".repeat(i) + r;
		n.alignDelimiters !== !1 && (i = t.length + i + r.length, i > c[d] && (c[d] = i), p[d] = i), f[d] = o;
	}
	o.splice(1, 0, f), s.splice(1, 0, p), u = -1;
	let m = [];
	for (; ++u < o.length;) {
		let e = o[u], t = s[u];
		d = -1;
		let r = [];
		for (; ++d < l;) {
			let i = e[d] || "", o = "", s = "";
			if (n.alignDelimiters !== !1) {
				let e = c[d] - (t[d] || 0), n = a[d];
				n === 114 ? o = " ".repeat(e) : n === 99 ? e % 2 ? (o = " ".repeat(e / 2 + .5), s = " ".repeat(e / 2 - .5)) : (o = " ".repeat(e / 2), s = o) : s = " ".repeat(e);
			}
			n.delimiterStart !== !1 && !d && r.push("|"), n.padding === !1 || n.alignDelimiters === !1 && i === "" || n.delimiterStart === !1 && !d || r.push(" "), n.alignDelimiters !== !1 && r.push(o), r.push(i), n.alignDelimiters !== !1 && r.push(s), n.padding !== !1 && r.push(" "), (n.delimiterEnd !== !1 || d !== l - 1) && r.push("|");
		}
		m.push(n.delimiterEnd === !1 ? r.join("").replace(/ +$/, "") : r.join(""));
	}
	return m.join("\n");
}
function Hu(e) {
	return e == null ? "" : String(e);
}
function Uu(e) {
	let t = typeof e == "string" ? e.codePointAt(0) : 0;
	return t === 67 || t === 99 ? 99 : t === 76 || t === 108 ? 108 : t === 82 || t === 114 ? 114 : 0;
}
// node_modules/mdast-util-phrasing/lib/index.js
var Wu = c([
	"break",
	"delete",
	"emphasis",
	"footnote",
	"footnoteReference",
	"image",
	"imageReference",
	"inlineCode",
	"inlineMath",
	"link",
	"linkReference",
	"mdxJsxTextElement",
	"mdxTextExpression",
	"strong",
	"text",
	"textDirective"
]);
// node_modules/mdast-util-to-markdown/lib/handle/blockquote.js
function Gu(e, t, n, r) {
	let i = n.enter("blockquote"), a = n.createTracker(r);
	a.move("> "), a.shift(2);
	let o = n.indentLines(n.containerFlow(e, a.current()), Ku);
	return i(), o;
}
function Ku(e, t, n) {
	return ">" + (n ? "" : " ") + e;
}
// node_modules/mdast-util-to-markdown/lib/util/pattern-in-scope.js
function qu(e, t) {
	return Ju(e, t.inConstruct, !0) && !Ju(e, t.notInConstruct, !1);
}
function Ju(e, t, n) {
	if (typeof t == "string" && (t = [t]), !t || t.length === 0) return n;
	let r = -1;
	for (; ++r < t.length;) if (e.includes(t[r])) return !0;
	return !1;
}
// node_modules/mdast-util-to-markdown/lib/handle/break.js
function Yu(e, t, n, r) {
	let i = -1;
	for (; ++i < n.unsafe.length;) {
		let e = n.unsafe[i];
		if (e.character === "\n" && !e.before && !e.after && qu(n.stack, e)) return /[\t ]/.test(r.before) ? "" : " ";
	}
	return "\\\n";
}
// node_modules/longest-streak/index.js
function Xu(e, t) {
	let n = String(e), r = n.indexOf(t), i = r, a = 0, o = 0;
	if (typeof t != "string") throw TypeError("Expected substring");
	for (; r !== -1;) r === i ? ++a > o && (o = a) : a = 1, i = r + t.length, r = n.indexOf(t, i);
	return o;
}
// node_modules/mdast-util-to-markdown/lib/util/format-code-as-indented.js
function Zu(e, t) {
	return !(t.options.fences !== !1 || !e.value || e.lang || !/[^\n\r ]/.test(e.value) || /^[\t ]*(?:[\n\r]|$)|(?:^|[\n\r])[\t ]*$/.test(e.value));
}
// node_modules/mdast-util-to-markdown/lib/util/check-fence.js
function Qu(e) {
	let t = e.options.fence || "`";
	if (t !== "`" && t !== "~") throw Error("Cannot serialize code with `" + t + "` for `options.fence`, expected `` ` `` or `~`");
	return t;
}
// node_modules/mdast-util-to-markdown/lib/handle/code.js
function $u(e, t, n, r) {
	let i = Qu(n), a = e.value || "";
	if (Zu(e, n)) {
		let e = n.enter("codeIndented"), t = n.indentLines(a, ed);
		return e(), t;
	}
	let o = n.createTracker(r), s = i.repeat(Math.max(Xu(a, i) + 1, 3)), c = n.enter("codeFenced"), l = i === "`" ? "GraveAccent" : "Tilde", u = o.move(s);
	if (e.lang) {
		let t = n.enter(`codeFencedLang${l}`);
		u += o.move(n.safe(e.lang, {
			before: u,
			after: " ",
			encode: ["`"],
			...o.current()
		})), t();
	}
	if (e.lang && e.meta) {
		let t = n.enter(`codeFencedMeta${l}`);
		u += o.move(" "), u += o.move(n.safe(e.meta, {
			before: u,
			after: "\n",
			encode: ["`"],
			...o.current()
		})), t();
	}
	return u += o.move("\n"), a && (u += o.move(a + "\n")), u += o.move(s), c(), u;
}
function ed(e, t, n) {
	return (n ? "" : "    ") + e;
}
// node_modules/mdast-util-to-markdown/lib/util/check-quote.js
function td(e) {
	let t = e.options.quote || "\"";
	if (t !== "\"" && t !== "'") throw Error("Cannot serialize title with `" + t + "` for `options.quote`, expected `\"`, or `'`");
	return t;
}
// node_modules/mdast-util-to-markdown/lib/handle/definition.js
function nd(e, t, n, r) {
	let i = td(n), a = i === "\"" ? "Quote" : "Apostrophe", o = n.enter("definition"), s = n.enter("label"), c = n.createTracker(r), l = c.move("[");
	return l += c.move(n.safe(n.associationId(e), {
		before: l,
		after: "]",
		...c.current()
	})), l += c.move("]: "), s(), !e.url || /[\0- \u007F]/.test(e.url) ? (s = n.enter("destinationLiteral"), l += c.move("<"), l += c.move(n.safe(e.url, {
		before: l,
		after: ">",
		...c.current()
	})), l += c.move(">")) : (s = n.enter("destinationRaw"), l += c.move(n.safe(e.url, {
		before: l,
		after: e.title ? " " : "\n",
		...c.current()
	}))), s(), e.title && (s = n.enter(`title${a}`), l += c.move(" " + i), l += c.move(n.safe(e.title, {
		before: l,
		after: i,
		...c.current()
	})), l += c.move(i), s()), o(), l;
}
// node_modules/mdast-util-to-markdown/lib/util/check-emphasis.js
function rd(e) {
	let t = e.options.emphasis || "*";
	if (t !== "*" && t !== "_") throw Error("Cannot serialize emphasis with `" + t + "` for `options.emphasis`, expected `*`, or `_`");
	return t;
}
// node_modules/mdast-util-to-markdown/node_modules/micromark-util-character/index.js
var id = ud(/[A-Za-z]/), ad = ud(/[\dA-Za-z]/), od = ud(/[!-/:-@[-`{-~]/);
function sd(e) {
	return e !== null && (e < 0 || e === 32);
}
var cd = ud(/\p{P}|\p{S}/u), ld = ud(/\s/);
function ud(e) {
	return t;
	function t(t) {
		return t !== null && t > -1 && e.test(String.fromCharCode(t));
	}
}
// node_modules/mdast-util-to-markdown/node_modules/micromark-util-classify-character/index.js
function dd(e) {
	if (e === null || sd(e) || ld(e)) return 1;
	if (cd(e)) return 2;
}
// node_modules/mdast-util-to-markdown/lib/util/character.js
function fd(e) {
	let t = e.codePointAt(0);
	return t === void 0 ? "" : String.fromCodePoint(t);
}
function pd(e) {
	let t = e.codePointAt(e.length - 2);
	return t !== void 0 && t > 65535 ? e.slice(-2) : e.slice(-1);
}
// node_modules/mdast-util-to-markdown/lib/util/encode-character-reference.js
function md(e) {
	return "&#x" + e.toString(16).toUpperCase() + ";";
}
// node_modules/mdast-util-to-markdown/lib/util/encode-info.js
function hd(e, t, n) {
	let r = dd(e), i = dd(t);
	return r === void 0 ? i === void 0 ? n === "_" ? {
		inside: !0,
		outside: !0
	} : {
		inside: !1,
		outside: !1
	} : i === 1 ? {
		inside: !0,
		outside: !0
	} : {
		inside: !1,
		outside: !0
	} : r === 1 ? i === void 0 ? {
		inside: !1,
		outside: !1
	} : i === 1 ? {
		inside: !0,
		outside: !0
	} : {
		inside: !1,
		outside: !1
	} : i === void 0 ? {
		inside: !1,
		outside: !1
	} : i === 1 ? {
		inside: !0,
		outside: !1
	} : {
		inside: !1,
		outside: !1
	};
}
// node_modules/mdast-util-to-markdown/node_modules/micromark-util-html-tag-name/index.js
var gd = /* @__PURE__ */ "address.article.aside.base.basefont.blockquote.body.caption.center.col.colgroup.dd.details.dialog.dir.div.dl.dt.fieldset.figcaption.figure.footer.form.frame.frameset.h1.h2.h3.h4.h5.h6.head.header.hr.html.iframe.legend.li.link.main.menu.menuitem.nav.noframes.ol.optgroup.option.p.param.search.section.summary.table.tbody.td.tfoot.th.thead.title.tr.track.ul".split("."), _d = [
	"pre",
	"script",
	"style",
	"textarea"
];
// node_modules/mdast-util-to-markdown/lib/util/html-kind.js
function vd(e) {
	if (e.charCodeAt(0) !== 60) return;
	let t = e.charCodeAt(1);
	if (t === 33) {
		let t = e.charCodeAt(2);
		return t === 45 ? 2 : t === 91 ? 5 : id(t) ? 4 : void 0;
	}
	if (t === 63) return 3;
	let n = t === 47, r = n ? 2 : 1, i = r, a = e.charCodeAt(i);
	if (!id(a)) return;
	for (; a === 45 || ad(a);) a = e.charCodeAt(++i);
	let o = e.slice(r, i).toLowerCase();
	return !n && a !== 47 && _d.includes(o) ? 1 : gd.includes(o) ? 6 : 7;
}
// node_modules/mdast-util-to-markdown/lib/util/container-phrasing.js
var yd = /* @__PURE__ */ new Map([["*", !1], ["_", !0]]);
function bd(e, t, n) {
	let r = /* @__PURE__ */ new Set();
	for (let i of e) {
		let e = n.get(i);
		if (e && i.attention && t.some((e) => e.attention === i.attention)) for (let t of e.tokens) r.add(t.attention);
	}
	let i = [];
	for (let t of e) t.attention && r.delete(t.attention) && i.push(t.attention);
	return i.reverse(), i;
}
function xd(e, t, n) {
	let r = [], i = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map(), o = 0;
	for (; o < e.length;) {
		if (!e[o].attention) {
			o++;
			continue;
		}
		let s = e[o].value.charAt(0), c = yd.get(s), l = o + 1;
		for (; l < e.length && e[l].attention && e[l].value.charAt(0) === s;) l++;
		let u = o ? e[o - 1].value : t, d = dd(u.charCodeAt(u.length - 1)), f = dd((l < e.length ? e[l].value : n).charCodeAt(0)), p = !f || f === 2 && !!d, m = !d || d === 2 && !!f, h = {
			tokens: e.slice(o, l),
			markers: [],
			start: 0,
			end: 0,
			open: c ? p && (!!d || !m) : p,
			close: c ? m && (!!f || !p) : m,
			split: c !== void 0
		};
		for (let e of h.tokens) {
			i.set(e, [...h.tokens]), a.set(e, h);
			let t = e.value.length;
			for (; t--;) h.markers.push(e);
		}
		h.end = h.markers.length, r.push(h), o = l;
	}
	for (wd(r, i), o = -1; ++o < e.length;) {
		let t = i.get(e[o]);
		if (t) return {
			attention: bd(e, t, a),
			index: o
		};
	}
}
function Sd(e, t) {
	let n = e[t ? 0 : e.length - 1];
	if (!n || n.attention) return;
	let r = t ? fd(n.value) : pd(n.value), i = md(r.codePointAt(0));
	if (t) n.value = i + n.value.slice(r.length);
	else {
		let e = n.value.slice(0, n.value.length - r.length), t = 0;
		for (; e.charCodeAt(e.length - 1 - t) === 92;) t++;
		t % 2 && (e += "\\"), n.value = e + i;
	}
}
function Cd(e, t, n, r, i) {
	for (let a of n.attention) {
		let o = t.get(a) || a.sequences[0];
		for (let s of a.sequences) {
			if (s === o) continue;
			let c = new Map(t);
			c.set(a, s);
			let l = Od(e, c, r, i), u = xd(l, r, i);
			if (!u || u.index > n.index) return {
				chosen: c,
				mistake: u,
				tokens: l
			};
		}
	}
}
function wd(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let r of e) {
		let e = r.tokens[0].value.charAt(0), i = n.get(e);
		i || (i = [], n.set(e, i));
		let a = r.close ? i.length : 0;
		for (; a-- && r.start < r.end;) {
			let e = i[a], n = e.end - e.start, o = r.end - r.start;
			if (r.split ? (e.close || r.open) && o % 3 && !((n + o) % 3) : n !== e.markers.length || n !== o) continue;
			let s = r.split ? n > 1 && o > 1 ? 2 : 1 : o, c = e.markers.slice(e.end - s, e.end), l = r.markers.slice(r.start, r.start + s), u = c[0], d = l[0];
			if (u === c[s - 1] && u.value.length === s && d === l[s - 1] && d.value.length === s && u.attention === d.attention) t.delete(u), t.delete(d);
			else {
				let e = [.../* @__PURE__ */ new Set([...c, ...l])];
				for (let n of e) {
					let r = t.get(n);
					r && r.push(...e);
				}
			}
			e.end -= s, r.start += s, e.start === e.end && i.splice(a, 1), a = i.length;
		}
		r.open && r.start < r.end && i.push(r);
	}
}
function Td(e, t, n) {
	if (t.length === 0) throw Error("Cannot serialize `" + e + "` as attention without markers, expected one or more markers");
	if (n.length === 0) throw Error("Cannot serialize `" + e + "` as attention without sizes, expected one or more sizes");
	for (let t of n) if (!Number.isSafeInteger(t) || t < 1) throw Error("Cannot serialize `" + e + "` as attention with `" + t + "` as size, expected positive integer");
	let r = [];
	for (let i of t) {
		if (i.length !== 1) throw Error("Cannot serialize `" + e + "` as attention with `" + i + "` as marker, expected a single ascii character");
		if (!od(i.charCodeAt(0))) throw Error("Cannot serialize `" + e + "` as attention with `" + i + "` as marker, expected ascii punctuation");
		for (let e of n) r.push(i.repeat(e));
	}
	return r;
}
function Ed(e, t, n) {
	let r = t.indexStack, i = e.children || [], a = [], o = -1, s = n.before;
	r.push(-1);
	let c = t.createTracker(n);
	for (; ++o < i.length;) {
		let l = i[o], u;
		if (r[r.length - 1] = o, o + 1 < i.length) {
			let n = t.handle.handlers[i[o + 1].type];
			n && n.peek && (n = n.peek), u = n ? fd(n(i[o + 1], e, t, {
				before: "",
				after: "",
				...c.current()
			})) : "";
		} else u = n.after;
		let d = a[a.length - 1];
		typeof d == "string" && (s === "\r" || s === "\n") && l.type === "html" && vd(l.value) !== 7 && (a[a.length - 1] = d.replace(/(\r?\n|\r)$/, " "), s = " ", c = t.createTracker(n), c.move(kd(a, n.before, n.after)));
		let f = t.handle.handlers[l.type];
		if (f && f.attention) {
			let e = Dd(l, f.attention, t, c);
			a.push(e), s = pd(e.sequences[0]);
		} else {
			let n = t.handle(l, e, t, {
				...c.current(),
				after: u,
				before: s
			});
			if (!n) continue;
			c.move(n), a.push(n), s = pd(n);
		}
	}
	return r.pop(), a;
}
function Dd(e, t, n, r) {
	let { construct: i, markers: a, sizes: o } = t(e, n), s = Td(e.type, a, o), c = s[0], l = n.enter(i);
	r.move(c);
	let u = Ed(e, n, {
		...r.current(),
		before: c,
		after: c
	});
	return r.move(kd(u, c, c)), r.move(c), l(), {
		children: u,
		sequences: s
	};
}
function Od(e, t, n, r) {
	let i = [], a, o = pd(n), s = -1;
	for (; ++s < e.length;) {
		let n = e[s];
		if (typeof n == "string") {
			let e = {
				value: n,
				attention: void 0
			};
			a && a === fd(n) && Sd([e], !0), a = void 0, i.push(e), e.value && (o = pd(e.value));
			continue;
		}
		let c = t.get(n) || n.sequences[0], l = c.charAt(0), u = e[s + 1], d = o, f = fd(u === void 0 ? r : typeof u == "string" ? u : t.get(u) || u.sequences[0]), p = Od(n.children, t, c, c), m = p.length > 0 ? p[0].value : "", h = hd(d.charCodeAt(d.length - 1), m.charCodeAt(0), l);
		h.inside && Sd(p, !0);
		let g = p.length > 0 ? pd(p[p.length - 1].value) : "", _ = hd(f.charCodeAt(0), g.charCodeAt(g.length - 1), l);
		_.inside && Sd(p, !1), h.outside && d !== "\n" && d !== "\r" && Sd(i, !1), _.outside && (a = f), i.push({
			value: c,
			attention: n
		}, ...p, {
			value: c,
			attention: n
		}), o = c.charAt(c.length - 1);
	}
	return i;
}
function kd(e, t, n) {
	let r = /* @__PURE__ */ new Map(), i = Od(e, r, t, n), a = i, o = xd(a, t, n);
	for (; o;) {
		let s = Cd(e, r, o, t, n);
		if (!s) {
			a = i;
			break;
		}
		r = s.chosen, a = s.tokens, o = s.mistake;
	}
	let s = "";
	for (let e of a) s += e.value;
	return s;
}
Ad.attention = jd, Ad.peek = Md;
function Ad(e, t, n, r) {
	let i = n.enter("phrasing"), a = kd([Dd(e, jd, n, n.createTracker(r))], r.before, r.after);
	return i(), a;
}
function jd(e, t) {
	return {
		construct: "emphasis",
		markers: rd(t) === "*" ? ["*", "_"] : ["_", "*"],
		sizes: [1]
	};
}
function Md(e, t, n) {
	return n.options.emphasis || "*";
}
// node_modules/mdast-util-to-markdown/node_modules/unist-util-visit/lib/index.js
function Nd(e, t, n, r) {
	let i, a, o;
	typeof n == "function" || n && typeof n == "object" ? (i = t, a = n, o = r) : (a = t, o = n), typeof a == "function" ? v(e, i, Fd(a), o) : v(e, i, Pd(a), o);
}
function Pd(e) {
	return !e || typeof e != "object" ? e : {
		enter: typeof e.enter == "function" ? Fd(e.enter) : e.enter,
		exit: typeof e.exit == "function" ? Fd(e.exit) : e.exit
	};
}
function Fd(e) {
	return t;
	function t(t, n, r) {
		return e(t, r, n[n.length - 1]);
	}
}
// node_modules/mdast-util-to-markdown/node_modules/mdast-util-to-string/lib/index.js
var Id = {};
function Ld(e, t) {
	let n = t || Id;
	return Rd(e, typeof n.includeImageAlt != "boolean" || n.includeImageAlt, typeof n.includeHtml != "boolean" || n.includeHtml);
}
function Rd(e, t, n) {
	if (Bd(e)) {
		if ("value" in e) return e.type === "html" && !n ? "" : e.value;
		if (t && "alt" in e && e.alt) return e.alt;
		if ("children" in e) return zd(e.children, t, n);
	}
	return Array.isArray(e) ? zd(e, t, n) : "";
}
function zd(e, t, n) {
	let r = [], i = -1;
	for (; ++i < e.length;) r[i] = Rd(e[i], t, n);
	return r.join("");
}
function Bd(e) {
	return !!(e && typeof e == "object");
}
// node_modules/mdast-util-to-markdown/lib/util/format-heading-as-setext.js
function Vd(e, t) {
	let n = !1;
	return Nd(e, function(e) {
		if ("value" in e && /\r?\n|\r/.test(e.value) || e.type === "break") return n = !0, !1;
	}), !!((!e.depth || e.depth < 3) && Ld(e) && (t.options.setext || n));
}
// node_modules/mdast-util-to-markdown/lib/handle/heading.js
function Hd(e, t, n, r) {
	let i = Math.max(Math.min(6, e.depth || 1), 1), a = n.createTracker(r);
	if (Vd(e, n)) {
		let t = n.enter("headingSetext"), r = n.enter("phrasing"), o = n.containerPhrasing(e, {
			...a.current(),
			before: "\n",
			after: "\n"
		});
		return r(), t(), o + "\n" + (i === 1 ? "=" : "-").repeat(o.length - (Math.max(o.lastIndexOf("\r"), o.lastIndexOf("\n")) + 1));
	}
	let o = "#".repeat(i), s = n.enter("headingAtx"), c = n.enter("phrasing");
	a.move(o + " ");
	let l = n.containerPhrasing(e, {
		before: "# ",
		after: "\n",
		...a.current()
	}), u = l.charCodeAt(0);
	return (u === 9 || u === 32) && (l = md(u) + l.slice(1)), l = l ? o + " " + l : o, n.options.closeAtx && (l += " " + o), c(), s(), l;
}
// node_modules/mdast-util-to-markdown/lib/handle/html.js
Ud.peek = Wd;
function Ud(e) {
	return e.value || "";
}
function Wd() {
	return "<";
}
// node_modules/mdast-util-to-markdown/lib/handle/image.js
Gd.peek = Kd;
function Gd(e, t, n, r) {
	let i = td(n), a = i === "\"" ? "Quote" : "Apostrophe", o = n.enter("image"), s = n.enter("label"), c = n.createTracker(r), l = c.move("![");
	return l += c.move(n.safe(e.alt, {
		before: l,
		after: "]",
		...c.current()
	})), l += c.move("]("), s(), !e.url && e.title || /[\0- \u007F]/.test(e.url) ? (s = n.enter("destinationLiteral"), l += c.move("<"), l += c.move(n.safe(e.url, {
		before: l,
		after: ">",
		...c.current()
	})), l += c.move(">")) : (s = n.enter("destinationRaw"), l += c.move(n.safe(e.url, {
		before: l,
		after: e.title ? " " : ")",
		...c.current()
	}))), s(), e.title && (s = n.enter(`title${a}`), l += c.move(" " + i), l += c.move(n.safe(e.title, {
		before: l,
		after: i,
		...c.current()
	})), l += c.move(i), s()), l += c.move(")"), o(), l;
}
function Kd() {
	return "!";
}
// node_modules/mdast-util-to-markdown/lib/handle/image-reference.js
qd.peek = Jd;
function qd(e, t, n, r) {
	let i = e.referenceType, a = n.enter("imageReference"), o = n.enter("label"), s = n.createTracker(r), c = s.move("!["), l = n.safe(e.alt, {
		before: c,
		after: "]",
		...s.current()
	});
	c += s.move(l + "]["), o();
	let u = n.stack;
	n.stack = u.filter(function(e) {
		return e !== "phrasing";
	}), o = n.enter("reference");
	let d = n.safe(n.associationId(e), {
		before: c,
		after: "]",
		...s.current()
	});
	return o(), n.stack = u, a(), i === "full" || !l || l !== d ? c += s.move(d + "]") : i === "shortcut" ? c = c.slice(0, -1) : c += s.move("]"), c;
}
function Jd() {
	return "!";
}
// node_modules/mdast-util-to-markdown/lib/handle/inline-code.js
Yd.peek = Xd;
function Yd(e, t, n) {
	let r = e.value || "", i = "`", a = -1;
	for (; RegExp("(^|[^`])" + i + "([^`]|$)").test(r);) i += "`";
	for (/[^\n\r ]/.test(r) && (/^[\n\r ]/.test(r) && /[\n\r ]$/.test(r) || /^`|`$/.test(r)) && (r = " " + r + " "); ++a < n.unsafe.length;) {
		let e = n.unsafe[a], t = n.compilePattern(e);
		if (!e.atBreak) continue;
		let i;
		for (; i = t.exec(r);) {
			let e = i.index;
			r.charCodeAt(e) === 10 && r.charCodeAt(e - 1) === 13 && e--, r = r.slice(0, e) + " " + r.slice(i.index + 1);
		}
	}
	return i + r + i;
}
function Xd() {
	return "`";
}
// node_modules/mdast-util-to-markdown/lib/util/format-link-as-autolink.js
function Zd(e, t) {
	let n = Ld(e);
	return !(t.options.resourceLink || !e.url || e.title || !e.children || e.children.length !== 1 || e.children[0].type !== "text" || n !== e.url && "mailto:" + n !== e.url || !/^[a-z][+\-.a-z]+:/i.test(e.url) || /[\0- <>\u007F]/.test(e.url));
}
// node_modules/mdast-util-to-markdown/lib/handle/link.js
Qd.peek = $d;
function Qd(e, t, n, r) {
	let i = td(n), a = i === "\"" ? "Quote" : "Apostrophe", o = n.createTracker(r);
	if (Zd(e, n)) {
		let t = n.stack;
		n.stack = t.filter(function(e) {
			return e !== "phrasing";
		});
		let r = n.enter("autolink"), i = o.move("<");
		return i += o.move(n.containerPhrasing(e, {
			before: i,
			after: ">",
			...o.current()
		})), i += o.move(">"), r(), n.stack = t, i;
	}
	let s = n.enter("link"), c = n.enter("label"), l = o.move("["), u = n.containerPhrasing(e, {
		before: l,
		after: "](",
		...o.current()
	});
	l += o.move(u), c(), l += o.move("](");
	let d = /[\0- \u007F]/.test(e.url), f = r.before.charAt(r.before.length - 1), p = e.title || void 0;
	if (!p && !d && (f === "\n" || f === "\r")) {
		let e = 0;
		for (; e < u.length && u.charCodeAt(e) !== 93;) e += u.charCodeAt(e) === 92 ? 2 : 1;
		u.charCodeAt(e + 1) === 58 && (p = "");
	}
	return !e.url && typeof p == "string" || d ? (c = n.enter("destinationLiteral"), l += o.move("<"), l += o.move(n.safe(e.url, {
		before: l,
		after: ">",
		...o.current()
	})), l += o.move(">")) : (c = n.enter("destinationRaw"), l += o.move(n.safe(e.url, {
		before: l,
		after: typeof p == "string" ? " " : ")",
		...o.current()
	}))), c(), typeof p == "string" && (c = n.enter(`title${a}`), l += o.move(" " + i), l += o.move(n.safe(p, {
		before: l,
		after: i,
		...o.current()
	})), l += o.move(i), c()), l += o.move(")"), s(), l;
}
function $d(e, t, n) {
	return Zd(e, n) ? "<" : "[";
}
// node_modules/mdast-util-to-markdown/lib/handle/link-reference.js
ef.peek = tf;
function ef(e, t, n, r) {
	let i = e.referenceType, a = n.enter("linkReference"), o = n.enter("label"), s = n.createTracker(r), c = s.move("["), l = n.containerPhrasing(e, {
		before: c,
		after: "]",
		...s.current()
	});
	c += s.move(l + "]["), o();
	let u = n.stack;
	n.stack = u.filter(function(e) {
		return e !== "phrasing";
	}), o = n.enter("reference");
	let d = n.safe(n.associationId(e), {
		before: c,
		after: "]",
		...s.current()
	});
	return o(), n.stack = u, a(), i === "full" || !l || l !== d ? c += s.move(d + "]") : i === "shortcut" ? c = c.slice(0, -1) : c += s.move("]"), c;
}
function tf() {
	return "[";
}
// node_modules/mdast-util-to-markdown/lib/util/check-bullet.js
function nf(e) {
	let t = e.options.bullet || "*";
	if (t !== "*" && t !== "+" && t !== "-") throw Error("Cannot serialize items with `" + t + "` for `options.bullet`, expected `*`, `+`, or `-`");
	return t;
}
// node_modules/mdast-util-to-markdown/lib/util/check-bullet-other.js
function rf(e) {
	let t = nf(e), n = e.options.bulletOther;
	if (!n) return t === "*" ? "-" : "*";
	if (n !== "*" && n !== "+" && n !== "-") throw Error("Cannot serialize items with `" + n + "` for `options.bulletOther`, expected `*`, `+`, or `-`");
	if (n === t) throw Error("Expected `bullet` (`" + t + "`) and `bulletOther` (`" + n + "`) to be different");
	return n;
}
// node_modules/mdast-util-to-markdown/lib/util/check-bullet-ordered.js
function af(e) {
	let t = e.options.bulletOrdered || ".";
	if (t !== "." && t !== ")") throw Error("Cannot serialize items with `" + t + "` for `options.bulletOrdered`, expected `.` or `)`");
	return t;
}
// node_modules/mdast-util-to-markdown/lib/util/check-rule.js
function of(e) {
	let t = e.options.rule || "*";
	if (t !== "*" && t !== "-" && t !== "_") throw Error("Cannot serialize rules with `" + t + "` for `options.rule`, expected `*`, `-`, or `_`");
	return t;
}
// node_modules/mdast-util-to-markdown/lib/handle/list.js
function sf(e, t, n, r) {
	let i = n.enter("list"), a = n.bulletCurrent, o = e.ordered ? af(n) : nf(n), s = e.ordered ? o === "." ? ")" : "." : rf(n), c = t && n.bulletLastUsed ? o === n.bulletLastUsed : !1;
	if (!e.ordered) {
		let t = e.children ? e.children[0] : void 0;
		if (o !== "*" && o !== "-" || !t || t.children && t.children[0] || n.stack[n.stack.length - 1] !== "list" || n.stack[n.stack.length - 2] !== "listItem" || n.stack[n.stack.length - 3] !== "list" || n.stack[n.stack.length - 4] !== "listItem" || n.indexStack[n.indexStack.length - 1] !== 0 || n.indexStack[n.indexStack.length - 2] !== 0 || n.indexStack[n.indexStack.length - 3] !== 0 || (c = !0), of(n) === o && t) {
			let t = -1;
			for (; ++t < e.children.length;) {
				let n = e.children[t];
				if (n && n.type === "listItem" && n.children && n.children[0] && n.children[0].type === "thematicBreak") {
					c = !0;
					break;
				}
			}
		}
	}
	c && (o = s), n.bulletCurrent = o;
	let l = n.containerFlow(e, r);
	return n.bulletLastUsed = o, n.bulletCurrent = a, i(), l;
}
// node_modules/mdast-util-to-markdown/lib/util/check-list-item-indent.js
function cf(e) {
	let t = e.options.listItemIndent || "one";
	if (t !== "tab" && t !== "one" && t !== "mixed") throw Error("Cannot serialize items with `" + t + "` for `options.listItemIndent`, expected `tab`, `one`, or `mixed`");
	return t;
}
// node_modules/mdast-util-to-markdown/lib/handle/list-item.js
function lf(e, t, n, r) {
	let i = cf(n), a = n.bulletCurrent || nf(n);
	t && t.type === "list" && t.ordered && (a = (typeof t.start == "number" && t.start > -1 ? t.start : 1) + (n.options.incrementListMarker === !1 ? 0 : t.children.indexOf(e)) + a);
	let o = a.length + 1;
	(i === "tab" || i === "mixed" && (t && t.type === "list" && t.spread || e.spread)) && (o = Math.ceil(o / 4) * 4);
	let s = n.createTracker(r);
	s.move(a + " ".repeat(o - a.length)), s.shift(o);
	let c = n.enter("listItem"), l = n.indentLines(n.containerFlow(e, s.current()), u);
	return c(), l;
	function u(e, t, n) {
		return t ? (n ? "" : " ".repeat(o)) + e : (n ? a : a + " ".repeat(o - a.length)) + e;
	}
}
// node_modules/mdast-util-to-markdown/lib/handle/paragraph.js
function uf(e, t, n, r) {
	let i = n.enter("paragraph"), a = n.enter("phrasing"), o = n.containerPhrasing(e, r);
	return a(), i(), o;
}
// node_modules/mdast-util-to-markdown/lib/handle/root.js
function df(e, t, n, r) {
	if (!e.children.some(function(e) {
		return Wu(e);
	})) return n.containerFlow(e, r);
	let i = n.enter("phrasing"), a = n.containerPhrasing(e, r);
	return i(), a;
}
// node_modules/mdast-util-to-markdown/lib/util/check-strong.js
function ff(e) {
	let t = e.options.strong || "*";
	if (t !== "*" && t !== "_") throw Error("Cannot serialize strong with `" + t + "` for `options.strong`, expected `*`, or `_`");
	return t;
}
pf.attention = mf, pf.peek = hf;
function pf(e, t, n, r) {
	let i = n.enter("phrasing"), a = kd([Dd(e, mf, n, n.createTracker(r))], r.before, r.after);
	return i(), a;
}
function mf(e, t) {
	return {
		construct: "strong",
		markers: ff(t) === "*" ? ["*", "_"] : ["_", "*"],
		sizes: [2]
	};
}
function hf(e, t, n) {
	return n.options.strong || "*";
}
// node_modules/mdast-util-to-markdown/lib/handle/text.js
function gf(e, t, n, r) {
	/* c8 ignore next -- parent always passed */
	let i = t ? t.children : [], a = n.indexStack[n.indexStack.length - 1];
	return n.safe(e.value, {
		...r,
		afterNode: i[a + 1],
		beforeNode: i[a - 1]
	});
}
// node_modules/mdast-util-to-markdown/lib/util/check-rule-repetition.js
function _f(e) {
	let t = e.options.ruleRepetition || 3;
	if (t < 3) throw Error("Cannot serialize rules with repetition `" + t + "` for `options.ruleRepetition`, expected `3` or more");
	return t;
}
// node_modules/mdast-util-to-markdown/lib/handle/thematic-break.js
function vf(e, t, n) {
	let r = (of(n) + (n.options.ruleSpaces ? " " : "")).repeat(_f(n));
	return n.options.ruleSpaces ? r.slice(0, -1) : r;
}
// node_modules/mdast-util-to-markdown/lib/handle/index.js
var yf = {
	blockquote: Gu,
	break: Yu,
	code: $u,
	definition: nd,
	emphasis: Ad,
	hardBreak: Yu,
	heading: Hd,
	html: Ud,
	image: Gd,
	imageReference: qd,
	inlineCode: Yd,
	link: Qd,
	linkReference: ef,
	list: sf,
	listItem: lf,
	paragraph: uf,
	root: df,
	strong: pf,
	text: gf,
	thematicBreak: vf
}, bf = document.createElement("i");
function xf(e) {
	let t = "&" + e + ";";
	bf.innerHTML = t;
	let n = bf.textContent;
	return n.charCodeAt(n.length - 1) === 59 && e !== "semi" ? !1 : n !== t && n;
}
// node_modules/mdast-util-gfm-table/lib/index.js
function Sf() {
	return {
		enter: {
			table: Cf,
			tableData: Df,
			tableHeader: Df,
			tableRow: Tf
		},
		exit: {
			codeText: Of,
			table: wf,
			tableData: Ef,
			tableHeader: Ef,
			tableRow: Ef
		}
	};
}
function Cf(e) {
	let t = e._align;
	this.enter({
		type: "table",
		align: t.map(function(e) {
			return e === "none" ? null : e;
		}),
		children: []
	}, e), this.data.inTable = !0;
}
function wf(e) {
	this.exit(e), this.data.inTable = void 0;
}
function Tf(e) {
	this.enter({
		type: "tableRow",
		children: []
	}, e);
}
function Ef(e) {
	this.exit(e);
}
function Df(e) {
	this.enter({
		type: "tableCell",
		children: []
	}, e);
}
function Of(e) {
	let t = this.resume();
	this.data.inTable && (t = t.replace(/\\([\\|])/g, kf));
	let n = this.stack[this.stack.length - 1];
	n.type, n.value = t, this.exit(e);
}
function kf(e, t) {
	return t === "|" ? t : e;
}
function Af(e) {
	let t = e || {}, n = t.tableCellPadding, r = t.tablePipeAlign, i = t.stringLength, a = n ? " " : "|";
	return {
		unsafe: [
			{
				character: "\r",
				inConstruct: "tableCell"
			},
			{
				character: "\n",
				inConstruct: "tableCell"
			},
			{
				atBreak: !0,
				character: "|",
				after: "[	 :-]"
			},
			{
				character: "|",
				inConstruct: "tableCell"
			},
			{
				atBreak: !0,
				character: ":",
				after: "-"
			},
			{
				atBreak: !0,
				character: "-",
				after: "[:|-]"
			}
		],
		handlers: {
			inlineCode: f,
			table: o,
			tableCell: c,
			tableRow: s
		}
	};
	function o(e, t, n, r) {
		return l(u(e, n, r), e.align);
	}
	function s(e, t, n, r) {
		let i = l([d(e, n, r)]);
		return i.slice(0, i.indexOf("\n"));
	}
	function c(e, t, n, r) {
		let i = n.enter("tableCell"), o = n.enter("phrasing"), s = n.containerPhrasing(e, {
			...r,
			before: a,
			after: a
		});
		return o(), i(), s;
	}
	function l(e, t) {
		return Vu(e, {
			align: t,
			alignDelimiters: r,
			padding: n,
			stringLength: i
		});
	}
	function u(e, t, n) {
		let r = e.children, i = -1, a = [], o = t.enter("table");
		for (; ++i < r.length;) a[i] = d(r[i], t, n);
		return o(), a;
	}
	function d(e, t, n) {
		let r = e.children, i = -1, a = [], o = t.enter("tableRow");
		for (; ++i < r.length;) a[i] = c(r[i], e, t, n);
		return o(), a;
	}
	function f(e, t, n) {
		let r = yf.inlineCode(e, t, n);
		return n.stack.includes("tableCell") && (r = r.replace(/\|/g, "\\$&")), r;
	}
}
// node_modules/mdast-util-gfm-task-list-item/lib/index.js
function jf() {
	return { exit: {
		taskListCheckValueChecked: Nf,
		taskListCheckValueUnchecked: Nf,
		paragraph: Pf
	} };
}
function Mf() {
	return {
		unsafe: [{
			atBreak: !0,
			character: "-",
			after: "[:|-]"
		}],
		handlers: { listItem: Ff }
	};
}
function Nf(e) {
	let t = this.stack[this.stack.length - 2];
	t.type, t.checked = e.type === "taskListCheckValueChecked";
}
function Pf(e) {
	let t = this.stack[this.stack.length - 2];
	if (t && t.type === "listItem" && typeof t.checked == "boolean") {
		let e = this.stack[this.stack.length - 1];
		e.type;
		let n = e.children[0];
		if (n && n.type === "text") {
			let r = t.children, i = -1, a;
			for (; ++i < r.length;) {
				let e = r[i];
				if (e.type === "paragraph") {
					a = e;
					break;
				}
			}
			a === e && (n.value = n.value.slice(1), n.value.length === 0 ? e.children.shift() : e.position && n.position && typeof n.position.start.offset == "number" && (n.position.start.column++, n.position.start.offset++, e.position.start = Object.assign({}, n.position.start)));
		}
	}
	this.exit(e);
}
function Ff(e, t, n, r) {
	let i = e.children[0], a = typeof e.checked == "boolean" && i && i.type === "paragraph", o = "[" + (e.checked ? "x" : " ") + "] ", s = n.createTracker(r);
	a && s.move(o);
	let c = yf.listItem(e, t, n, {
		...r,
		...s.current()
	});
	return a && (c = c.replace(/^(?:[*+-]|\d+\.)([\r\n]| {1,3})/, l)), c;
	function l(e) {
		return e + o;
	}
}
// node_modules/mdast-util-gfm/lib/index.js
function If() {
	return [
		ru(),
		Ou(),
		Nu(),
		Sf(),
		jf()
	];
}
function Lf(e) {
	return { extensions: [
		iu(),
		ku(e),
		Pu(),
		Af(e),
		Mf()
	] };
}
// node_modules/micromark-extension-gfm/node_modules/micromark-util-chunked/index.js
function Rf(e, t, n, r) {
	let i = e.length, a = 0, o;
	if (t = t < 0 ? -t > i ? 0 : i + t : t > i ? i : t, n = n > 0 ? n : 0, r.length < 1e4) o = Array.from(r), o.unshift(t, n), e.splice(...o);
	else for (n && e.splice(t, n); a < r.length;) o = r.slice(a, a + 1e4), o.unshift(t, 0), e.splice(...o), a += 1e4, t += 1e4;
}
// node_modules/micromark-extension-gfm/node_modules/micromark-util-combine-extensions/index.js
var zf = {}.hasOwnProperty;
function Bf(e) {
	let t = {}, n = -1;
	for (; ++n < e.length;) Vf(t, e[n]);
	return t;
}
function Vf(e, t) {
	let n;
	for (n in t) {
		let r = (zf.call(e, n) ? e[n] : void 0) || (e[n] = {}), i = t[n], a;
		if (i) for (a in i) {
			zf.call(r, a) || (r[a] = []);
			let e = i[a];
			Hf(r[a], Array.isArray(e) ? e : e ? [e] : []);
		}
	}
}
function Hf(e, t) {
	let n = -1, r = [];
	for (; ++n < t.length;) (t[n].add === "after" ? e : r).push(t[n]);
	Rf(e, 0, 0, r);
}
// node_modules/micromark-extension-gfm-autolink-literal/node_modules/micromark-util-character/index.js
var Uf = Yf(/[A-Za-z]/), Wf = Yf(/[\dA-Za-z]/);
function Gf(e) {
	return e !== null && (e < 32 || e === 127);
}
function Kf(e) {
	return e !== null && (e < 0 || e === 32);
}
var qf = Yf(/\p{P}|\p{S}/u), Jf = Yf(/\s/);
function Yf(e) {
	return t;
	function t(t) {
		return t !== null && t > -1 && e.test(String.fromCharCode(t));
	}
}
// node_modules/micromark-extension-gfm-autolink-literal/lib/syntax.js
var Xf = {
	tokenize: up,
	partial: !0
}, Zf = {
	tokenize: dp,
	partial: !0
}, Qf = {
	tokenize: fp,
	partial: !0
}, $f = {
	tokenize: pp,
	partial: !0
}, ep = {
	tokenize: mp,
	partial: !0
}, tp = {
	name: "wwwAutolink",
	tokenize: cp,
	previous: hp
}, np = {
	name: "protocolAutolink",
	tokenize: lp,
	previous: gp
}, rp = {
	name: "emailAutolink",
	tokenize: sp,
	previous: _p
}, ip = {};
function ap() {
	return { text: ip };
}
for (var op = 48; op < 123;) ip[op] = rp, op++, op === 58 ? op = 65 : op === 91 && (op = 97);
ip[43] = rp, ip[45] = rp, ip[46] = rp, ip[95] = rp, ip[72] = [rp, np], ip[104] = [rp, np], ip[87] = [rp, tp], ip[119] = [rp, tp];
function sp(e, t, n) {
	let r = this, i, a;
	return o;
	function o(t) {
		return !vp(t) || !_p.call(r, r.previous) || yp(r.events) ? n(t) : (e.enter("literalAutolink"), e.enter("literalAutolinkEmail"), s(t));
	}
	function s(t) {
		return vp(t) ? (e.consume(t), s) : t === 64 ? (e.consume(t), c) : n(t);
	}
	function c(t) {
		return t === 46 ? e.check(ep, u, l)(t) : t === 45 || t === 95 || Wf(t) ? (a = !0, e.consume(t), c) : u(t);
	}
	function l(t) {
		return e.consume(t), i = !0, c;
	}
	function u(o) {
		return a && i && Uf(r.previous) ? (e.exit("literalAutolinkEmail"), e.exit("literalAutolink"), t(o)) : n(o);
	}
}
function cp(e, t, n) {
	let r = this;
	return i;
	function i(t) {
		return t !== 87 && t !== 119 || !hp.call(r, r.previous) || yp(r.events) ? n(t) : (e.enter("literalAutolink"), e.enter("literalAutolinkWww"), e.check(Xf, e.attempt(Zf, e.attempt(Qf, a), n), n)(t));
	}
	function a(n) {
		return e.exit("literalAutolinkWww"), e.exit("literalAutolink"), t(n);
	}
}
function lp(e, t, n) {
	let r = this, i = "", a = !1;
	return o;
	function o(t) {
		return (t === 72 || t === 104) && gp.call(r, r.previous) && !yp(r.events) ? (e.enter("literalAutolink"), e.enter("literalAutolinkHttp"), i += String.fromCodePoint(t), e.consume(t), s) : n(t);
	}
	function s(t) {
		if (Uf(t) && i.length < 5) return i += String.fromCodePoint(t), e.consume(t), s;
		if (t === 58) {
			let n = i.toLowerCase();
			if (n === "http" || n === "https") return e.consume(t), c;
		}
		return n(t);
	}
	function c(t) {
		return t === 47 ? (e.consume(t), a ? l : (a = !0, c)) : n(t);
	}
	function l(t) {
		return t === null || Gf(t) || Kf(t) || Jf(t) || qf(t) ? n(t) : e.attempt(Zf, e.attempt(Qf, u), n)(t);
	}
	function u(n) {
		return e.exit("literalAutolinkHttp"), e.exit("literalAutolink"), t(n);
	}
}
function up(e, t, n) {
	let r = 0;
	return i;
	function i(t) {
		return (t === 87 || t === 119) && r < 3 ? (r++, e.consume(t), i) : t === 46 && r === 3 ? (e.consume(t), a) : n(t);
	}
	function a(e) {
		return e === null ? n(e) : t(e);
	}
}
function dp(e, t, n) {
	let r, i, a;
	return o;
	function o(t) {
		return t === 46 || t === 95 ? e.check($f, c, s)(t) : t === null || Kf(t) || Jf(t) || t !== 45 && qf(t) ? c(t) : (a = !0, e.consume(t), o);
	}
	function s(t) {
		return t === 95 ? r = !0 : (i = r, r = void 0), e.consume(t), o;
	}
	function c(e) {
		return i || r || !a ? n(e) : t(e);
	}
}
function fp(e, t) {
	let n = 0, r = 0;
	return i;
	function i(o) {
		return o === 40 ? (n++, e.consume(o), i) : o === 41 && r < n ? a(o) : o === 33 || o === 34 || o === 38 || o === 39 || o === 41 || o === 42 || o === 44 || o === 46 || o === 58 || o === 59 || o === 60 || o === 63 || o === 93 || o === 95 || o === 126 ? e.check($f, t, a)(o) : o === null || Kf(o) || Jf(o) ? t(o) : (e.consume(o), i);
	}
	function a(t) {
		return t === 41 && r++, e.consume(t), i;
	}
}
function pp(e, t, n) {
	return r;
	function r(o) {
		return o === 33 || o === 34 || o === 39 || o === 41 || o === 42 || o === 44 || o === 46 || o === 58 || o === 59 || o === 63 || o === 95 || o === 126 ? (e.consume(o), r) : o === 38 ? (e.consume(o), a) : o === 93 ? (e.consume(o), i) : o === 60 || o === null || Kf(o) || Jf(o) ? t(o) : n(o);
	}
	function i(e) {
		return e === null || e === 40 || e === 91 || Kf(e) || Jf(e) ? t(e) : r(e);
	}
	function a(e) {
		return Uf(e) ? o(e) : n(e);
	}
	function o(t) {
		return t === 59 ? (e.consume(t), r) : Uf(t) ? (e.consume(t), o) : n(t);
	}
}
function mp(e, t, n) {
	return r;
	function r(t) {
		return e.consume(t), i;
	}
	function i(e) {
		return Wf(e) ? n(e) : t(e);
	}
}
function hp(e) {
	return e === null || e === 40 || e === 42 || e === 95 || e === 91 || e === 93 || e === 126 || Kf(e);
}
function gp(e) {
	return !Uf(e);
}
function _p(e) {
	return !(e === 47 || vp(e));
}
function vp(e) {
	return e === 43 || e === 45 || e === 46 || e === 95 || Wf(e);
}
function yp(e) {
	let t = e.length, n = !1;
	for (; t--;) {
		let r = e[t][1];
		if ((r.type === "labelLink" || r.type === "labelImage") && !r._balanced) {
			n = !0;
			break;
		}
		if (r._gfmAutolinkLiteralWalkedInto) {
			n = !1;
			break;
		}
	}
	return e.length > 0 && !n && (e[e.length - 1][1]._gfmAutolinkLiteralWalkedInto = !0), n;
}
function bp(e) {
	return e !== null && e < -2;
}
function xp(e) {
	return e !== null && (e < 0 || e === 32);
}
function Sp(e) {
	return e === -2 || e === -1 || e === 32;
}
// node_modules/micromark-extension-gfm-footnote/node_modules/micromark-factory-space/index.js
function Cp(e, t, n, r) {
	let i = r ? r - 1 : Infinity, a = 0;
	return o;
	function o(r) {
		return Sp(r) ? (e.enter(n), s(r)) : t(r);
	}
	function s(r) {
		return Sp(r) && a++ < i ? (e.consume(r), s) : (e.exit(n), t(r));
	}
}
// node_modules/micromark-extension-gfm-footnote/node_modules/micromark-core-commonmark/lib/blank-line.js
var wp = {
	partial: !0,
	tokenize: Tp
};
function Tp(e, t, n) {
	return r;
	function r(t) {
		return Sp(t) ? Cp(e, i, "linePrefix")(t) : i(t);
	}
	function i(e) {
		return e === null || bp(e) ? t(e) : n(e);
	}
}
// node_modules/micromark-extension-gfm-footnote/node_modules/micromark-util-normalize-identifier/index.js
function Ep(e) {
	return e.replace(/[\t\n\r ]+/g, " ").replace(/^ | $/g, "").toLowerCase().toUpperCase();
}
// node_modules/micromark-util-edit-map/index.js
var Dp = class {
	constructor() {
		this.index = /* @__PURE__ */ new Map(), this.map = [];
	}
	add(e, t, n) {
		Op(this, e, t, n, !1);
	}
	addBefore(e, t, n) {
		Op(this, e, t, n, !0);
	}
	consume(e) {
		if (this.map.sort(function(e, t) {
			return e[0] - t[0];
		}), this.map.length === 0) return;
		let t = this.map.length, n = [];
		for (; t > 0;) --t, n.push(e.slice(this.map[t][0] + this.map[t][1]), this.map[t][2]), e.length = this.map[t][0];
		n.push(e.slice()), e.length = 0;
		let r = n.pop();
		for (; r;) {
			for (let t of r) e.push(t);
			r = n.pop();
		}
		this.map.length = 0, this.index.clear();
	}
};
function Op(e, t, n, r, i) {
	if (n === 0 && r.length === 0) return;
	let a = e.index.get(t);
	if (a) {
		a[1] += n, i ? (r.push(...a[2]), a[2] = r) : a[2].push(...r);
		return;
	}
	let o = [
		t,
		n,
		r
	];
	e.map.push(o), e.index.set(t, o);
}
// node_modules/micromark-extension-gfm-footnote/lib/syntax.js
var kp = {
	tokenize: Lp,
	partial: !0
};
function Ap() {
	return {
		document: { 91: {
			name: "gfmFootnoteDefinition",
			tokenize: Pp,
			continuation: { tokenize: Fp },
			exit: Ip
		} },
		text: {
			91: {
				name: "gfmFootnoteCall",
				tokenize: Np
			},
			93: {
				name: "gfmPotentialFootnoteCall",
				add: "after",
				tokenize: jp,
				resolveTo: Mp
			}
		}
	};
}
function jp(e, t, n) {
	let r = this, i = r.events.length, a = r.parser.gfmFootnotes || (r.parser.gfmFootnotes = []), o;
	for (; i--;) {
		let e = r.events[i][1];
		if (e.type === "labelImage") {
			o = e;
			break;
		}
		if (e.type === "gfmFootnoteCall" || e.type === "labelLink" || e.type === "label" || e.type === "image" || e.type === "link") break;
	}
	return s;
	function s(i) {
		if (!o || !o._balanced) return n(i);
		let s = Ep(r.sliceSerialize({
			start: o.end,
			end: r.now()
		}));
		return s.codePointAt(0) !== 94 || !a.includes(s.slice(1)) ? n(i) : (e.enter("gfmFootnoteCallLabelMarker"), e.consume(i), e.exit("gfmFootnoteCallLabelMarker"), t(i));
	}
}
function Mp(e, t) {
	let n = e.length;
	for (; n--;) if (e[n][1].type === "labelImage" && e[n][0] === "enter") {
		e[n][1];
		break;
	}
	e[n + 1][1].type = "data", e[n + 3][1].type = "gfmFootnoteCallLabelMarker";
	let r = {
		type: "gfmFootnoteCall",
		start: Object.assign({}, e[n + 3][1].start),
		end: Object.assign({}, e[e.length - 1][1].end)
	}, i = {
		type: "gfmFootnoteCallMarker",
		start: Object.assign({}, e[n + 3][1].end),
		end: Object.assign({}, e[n + 3][1].end)
	};
	i.end.column++, i.end.offset++, i.end._bufferIndex++;
	let a = {
		type: "gfmFootnoteCallString",
		start: Object.assign({}, i.end),
		end: Object.assign({}, e[e.length - 1][1].start)
	}, o = {
		type: "chunkString",
		contentType: "string",
		start: Object.assign({}, a.start),
		end: Object.assign({}, a.end)
	}, s = [
		e[n + 1],
		e[n + 2],
		[
			"enter",
			r,
			t
		],
		e[n + 3],
		e[n + 4],
		[
			"enter",
			i,
			t
		],
		[
			"exit",
			i,
			t
		],
		[
			"enter",
			a,
			t
		],
		[
			"enter",
			o,
			t
		],
		[
			"exit",
			o,
			t
		],
		[
			"exit",
			a,
			t
		],
		e[e.length - 2],
		e[e.length - 1],
		[
			"exit",
			r,
			t
		]
	];
	return e.splice(n, e.length - n + 1, ...s), e;
}
function Np(e, t, n) {
	let r = this, i = r.parser.gfmFootnotes || (r.parser.gfmFootnotes = []), a = 0, o;
	return s;
	function s(t) {
		return e.enter("gfmFootnoteCall"), e.enter("gfmFootnoteCallLabelMarker"), e.consume(t), e.exit("gfmFootnoteCallLabelMarker"), c;
	}
	function c(t) {
		return t === 94 ? (e.enter("gfmFootnoteCallMarker"), e.consume(t), e.exit("gfmFootnoteCallMarker"), e.enter("gfmFootnoteCallString"), e.enter("chunkString").contentType = "string", l) : n(t);
	}
	function l(s) {
		if (a > 999 || s === 93 && !o || s === null || s === 91 || xp(s)) return n(s);
		if (s === 93) {
			e.exit("chunkString");
			let a = e.exit("gfmFootnoteCallString");
			return i.includes(Ep(r.sliceSerialize(a))) ? (e.enter("gfmFootnoteCallLabelMarker"), e.consume(s), e.exit("gfmFootnoteCallLabelMarker"), e.exit("gfmFootnoteCall"), t) : n(s);
		}
		return xp(s) || (o = !0), a++, e.consume(s), s === 92 ? u : l;
	}
	function u(t) {
		return t === 91 || t === 92 || t === 93 ? (e.consume(t), a++, l) : l(t);
	}
}
function Pp(e, t, n) {
	let r = this, i = r.parser.gfmFootnotes || (r.parser.gfmFootnotes = []), a, o = 0, s;
	return c;
	function c(t) {
		return e.enter("gfmFootnoteDefinition")._container = !0, e.enter("gfmFootnoteDefinitionLabel"), e.enter("gfmFootnoteDefinitionLabelMarker"), e.consume(t), e.exit("gfmFootnoteDefinitionLabelMarker"), l;
	}
	function l(t) {
		return t === 94 ? (e.enter("gfmFootnoteDefinitionMarker"), e.consume(t), e.exit("gfmFootnoteDefinitionMarker"), e.enter("gfmFootnoteDefinitionLabelString"), e.enter("chunkString").contentType = "string", u) : n(t);
	}
	function u(t) {
		if (o > 999 || t === 93 && !s || t === null || t === 91 || xp(t)) return n(t);
		if (t === 93) {
			e.exit("chunkString");
			let n = e.exit("gfmFootnoteDefinitionLabelString");
			return a = Ep(r.sliceSerialize(n)), e.enter("gfmFootnoteDefinitionLabelMarker"), e.consume(t), e.exit("gfmFootnoteDefinitionLabelMarker"), e.exit("gfmFootnoteDefinitionLabel"), f;
		}
		return xp(t) || (s = !0), o++, e.consume(t), t === 92 ? d : u;
	}
	function d(t) {
		return t === 91 || t === 92 || t === 93 ? (e.consume(t), o++, u) : u(t);
	}
	function f(t) {
		return t === 58 ? (e.enter("definitionMarker"), e.consume(t), e.exit("definitionMarker"), i.includes(a) || i.push(a), Cp(e, p, "gfmFootnoteDefinitionWhitespace")) : n(t);
	}
	function p(e) {
		return t(e);
	}
}
function Fp(e, t, n) {
	return e.check(wp, t, e.attempt(kp, t, n));
}
function Ip(e) {
	e.exit("gfmFootnoteDefinition");
}
function Lp(e, t, n) {
	let r = this;
	return Cp(e, i, "gfmFootnoteDefinitionIndent", 5);
	function i(e) {
		let i = r.events[r.events.length - 1];
		return i && i[1].type === "gfmFootnoteDefinitionIndent" && i[2].sliceSerialize(i[1], !0).length === 4 ? t(e) : n(e);
	}
}
// node_modules/micromark-extension-gfm-strikethrough/node_modules/micromark-util-chunked/index.js
function Rp(e, t, n, r) {
	let i = e.length, a = 0, o;
	if (t = t < 0 ? -t > i ? 0 : i + t : t > i ? i : t, n = n > 0 ? n : 0, r.length < 1e4) o = Array.from(r), o.unshift(t, n), e.splice(...o);
	else for (n && e.splice(t, n); a < r.length;) o = r.slice(a, a + 1e4), o.unshift(t, 0), e.splice(...o), a += 1e4, t += 1e4;
}
function zp(e) {
	return e !== null && (e < 0 || e === 32);
}
var Bp = Hp(/\p{P}|\p{S}/u), Vp = Hp(/\s/);
function Hp(e) {
	return t;
	function t(t) {
		return t !== null && t > -1 && e.test(String.fromCharCode(t));
	}
}
// node_modules/micromark-extension-gfm-strikethrough/node_modules/micromark-util-classify-character/index.js
function Up(e) {
	if (e === null || zp(e) || Vp(e)) return 1;
	if (Bp(e)) return 2;
}
// node_modules/micromark-extension-gfm-strikethrough/node_modules/micromark-util-resolve-all/index.js
function Wp(e, t, n) {
	let r = [], i = -1;
	for (; ++i < e.length;) {
		let a = e[i].resolveAll;
		a && !r.includes(a) && (t = a(t, n), r.push(a));
	}
	return t;
}
// node_modules/micromark-extension-gfm-strikethrough/lib/syntax.js
function Gp(e) {
	let t = (e || {}).singleTilde, n = {
		name: "strikethrough",
		tokenize: i,
		resolveAll: r
	};
	return t ??= !0, {
		text: { 126: n },
		insideSpan: { null: [n] },
		attentionMarkers: { null: [126] }
	};
	function r(e, t) {
		let n = -1;
		for (; ++n < e.length;) if (e[n][0] === "enter" && e[n][1].type === "strikethroughSequenceTemporary" && e[n][1]._close) {
			let r = n;
			for (; r--;) if (e[r][0] === "exit" && e[r][1].type === "strikethroughSequenceTemporary" && e[r][1]._open && e[n][1].end.offset - e[n][1].start.offset === e[r][1].end.offset - e[r][1].start.offset) {
				e[n][1].type = "strikethroughSequence", e[r][1].type = "strikethroughSequence";
				let i = {
					type: "strikethrough",
					start: Object.assign({}, e[r][1].start),
					end: Object.assign({}, e[n][1].end)
				}, a = {
					type: "strikethroughText",
					start: Object.assign({}, e[r][1].end),
					end: Object.assign({}, e[n][1].start)
				}, o = [
					[
						"enter",
						i,
						t
					],
					[
						"enter",
						e[r][1],
						t
					],
					[
						"exit",
						e[r][1],
						t
					],
					[
						"enter",
						a,
						t
					]
				], s = t.parser.constructs.insideSpan.null;
				s && Rp(o, o.length, 0, Wp(s, e.slice(r + 1, n), t)), Rp(o, o.length, 0, [
					[
						"exit",
						a,
						t
					],
					[
						"enter",
						e[n][1],
						t
					],
					[
						"exit",
						e[n][1],
						t
					],
					[
						"exit",
						i,
						t
					]
				]), Rp(e, r - 1, n - r + 3, o), n = r + o.length - 2;
				break;
			}
		}
		for (n = -1; ++n < e.length;) e[n][1].type === "strikethroughSequenceTemporary" && (e[n][1].type = "data");
		return e;
	}
	function i(e, n, r) {
		let i = this.previous, a = this.events, o = 0;
		return s;
		function s(t) {
			return i === 126 && a[a.length - 1][1].type !== "characterEscape" ? r(t) : (e.enter("strikethroughSequenceTemporary"), c(t));
		}
		function c(a) {
			let s = Up(i);
			if (a === 126) return o > 1 ? r(a) : (e.consume(a), o++, c);
			if (o < 2 && !t) return r(a);
			let l = e.exit("strikethroughSequenceTemporary"), u = Up(a);
			return l._open = !u || u === 2 && !!s, l._close = !s || s === 2 && !!u, n(a);
		}
	}
}
function Kp(e) {
	return e !== null && e < -2;
}
function qp(e) {
	return e !== null && (e < 0 || e === 32);
}
function Jp(e) {
	return e === -2 || e === -1 || e === 32;
}
// node_modules/micromark-extension-gfm-table/node_modules/micromark-factory-space/index.js
function Yp(e, t, n, r) {
	let i = r ? r - 1 : Infinity, a = 0;
	return o;
	function o(r) {
		return Jp(r) ? (e.enter(n), s(r)) : t(r);
	}
	function s(r) {
		return Jp(r) && a++ < i ? (e.consume(r), s) : (e.exit(n), t(r));
	}
}
// node_modules/micromark-extension-gfm-table/lib/edit-map.js
var Xp = class {
	constructor() {
		this.map = [], this.index = /* @__PURE__ */ new Map();
	}
	add(e, t, n) {
		Zp(this, e, t, n);
	}
	consume(e) {
		/* c8 ignore next 3 -- `resolve` is never called without tables, so without edits. */
		if (this.map.sort(function(e, t) {
			return e[0] - t[0];
		}), this.map.length === 0) return;
		let t = this.map.length, n = [];
		for (; t > 0;) --t, n.push(e.slice(this.map[t][0] + this.map[t][1]), this.map[t][2]), e.length = this.map[t][0];
		n.push(e.slice()), e.length = 0;
		let r = n.pop();
		for (; r;) {
			for (let t of r) e.push(t);
			r = n.pop();
		}
		this.map.length = 0, this.index.clear();
	}
};
function Zp(e, t, n, r) {
	/* c8 ignore next 3 -- `resolve` is never called without tables, so without edits. */
	if (n === 0 && r.length === 0) return;
	let i = e.index.get(t);
	if (i) {
		i[1] += n, i[2].push(...r);
		return;
	}
	let a = [
		t,
		n,
		r
	];
	e.map.push(a), e.index.set(t, a);
}
// node_modules/micromark-extension-gfm-table/lib/infer.js
function Qp(e, t) {
	let n = !1, r = [];
	for (; t < e.length;) {
		let i = e[t];
		if (n) {
			if (i[0] === "enter") i[1].type === "tableContent" && r.push(e[t + 1][1].type === "tableDelimiterMarker" ? "left" : "none");
			else if (i[1].type === "tableContent") {
				if (e[t - 1][1].type === "tableDelimiterMarker") {
					let e = r.length - 1;
					r[e] = r[e] === "left" ? "center" : "right";
				}
			} else if (i[1].type === "tableDelimiterRow") break;
		} else i[0] === "enter" && i[1].type === "tableDelimiterRow" && (n = !0);
		t += 1;
	}
	return r;
}
// node_modules/micromark-extension-gfm-table/lib/syntax.js
function $p() {
	return { flow: { null: {
		name: "table",
		tokenize: em,
		resolveAll: tm
	} } };
}
function em(e, t, n) {
	let r = this, i = 0, a = 0, o;
	return s;
	function s(e) {
		let t = r.events.length - 1;
		for (; t > -1;) {
			let { type: e } = r.events[t][1];
			if (e === "lineEnding" || e === "linePrefix") t--;
			else break;
		}
		let i = t > -1 ? r.events[t][1].type : null, a = i === "tableHead" || i === "tableRow" ? te : c;
		return a === te && r.parser.lazy[r.now().line] ? n(e) : a(e);
	}
	function c(t) {
		return e.enter("tableHead"), e.enter("tableRow"), l(t);
	}
	function l(e) {
		return e === 124 || (o = !0, a += 1), u(e);
	}
	function u(t) {
		return t === null ? n(t) : Kp(t) ? a > 1 ? (a = 0, r.interrupt = !0, e.exit("tableRow"), e.enter("lineEnding"), e.consume(t), e.exit("lineEnding"), p) : n(t) : Jp(t) ? Yp(e, u, "whitespace")(t) : (a += 1, o && (o = !1, i += 1), t === 124 ? (e.enter("tableCellDivider"), e.consume(t), e.exit("tableCellDivider"), o = !0, u) : (e.enter("data"), d(t)));
	}
	function d(t) {
		return t === null || t === 124 || qp(t) ? (e.exit("data"), u(t)) : (e.consume(t), t === 92 ? f : d);
	}
	function f(t) {
		return t === 92 || t === 124 ? (e.consume(t), d) : d(t);
	}
	function p(t) {
		return r.interrupt = !1, r.parser.lazy[r.now().line] ? n(t) : (e.enter("tableDelimiterRow"), o = !1, Jp(t) ? Yp(e, m, "linePrefix", r.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(t) : m(t));
	}
	function m(t) {
		return t === 45 || t === 58 ? g(t) : t === 124 ? (o = !0, e.enter("tableCellDivider"), e.consume(t), e.exit("tableCellDivider"), h) : ee(t);
	}
	function h(t) {
		return Jp(t) ? Yp(e, g, "whitespace")(t) : g(t);
	}
	function g(t) {
		return t === 58 ? (a += 1, o = !0, e.enter("tableDelimiterMarker"), e.consume(t), e.exit("tableDelimiterMarker"), _) : t === 45 ? (a += 1, _(t)) : t === null || Kp(t) ? b(t) : ee(t);
	}
	function _(t) {
		return t === 45 ? (e.enter("tableDelimiterFiller"), v(t)) : ee(t);
	}
	function v(t) {
		return t === 45 ? (e.consume(t), v) : t === 58 ? (o = !0, e.exit("tableDelimiterFiller"), e.enter("tableDelimiterMarker"), e.consume(t), e.exit("tableDelimiterMarker"), y) : (e.exit("tableDelimiterFiller"), y(t));
	}
	function y(t) {
		return Jp(t) ? Yp(e, b, "whitespace")(t) : b(t);
	}
	function b(n) {
		return n === 124 ? m(n) : n === null || Kp(n) ? !o || i !== a ? ee(n) : (e.exit("tableDelimiterRow"), e.exit("tableHead"), t(n)) : ee(n);
	}
	function ee(e) {
		return n(e);
	}
	function te(t) {
		return e.enter("tableRow"), x(t);
	}
	function x(n) {
		return n === 124 ? (e.enter("tableCellDivider"), e.consume(n), e.exit("tableCellDivider"), x) : n === null || Kp(n) ? (e.exit("tableRow"), t(n)) : Jp(n) ? Yp(e, x, "whitespace")(n) : (e.enter("data"), S(n));
	}
	function S(t) {
		return t === null || t === 124 || qp(t) ? (e.exit("data"), x(t)) : (e.consume(t), t === 92 ? C : S);
	}
	function C(t) {
		return t === 92 || t === 124 ? (e.consume(t), S) : S(t);
	}
}
function tm(e, t) {
	let n = -1, r = !0, i = 0, a = [
		0,
		0,
		0,
		0
	], o = [
		0,
		0,
		0,
		0
	], s = !1, c = 0, l, u, d, f = new Xp();
	for (; ++n < e.length;) {
		let p = e[n], m = p[1];
		p[0] === "enter" ? m.type === "tableHead" ? (s = !1, c !== 0 && (rm(f, t, c, l, u), u = void 0, c = 0), l = {
			type: "table",
			start: Object.assign({}, m.start),
			end: Object.assign({}, m.end)
		}, f.add(n, 0, [[
			"enter",
			l,
			t
		]])) : m.type === "tableRow" || m.type === "tableDelimiterRow" ? (r = !0, d = void 0, a = [
			0,
			0,
			0,
			0
		], o = [
			0,
			n + 1,
			0,
			0
		], s && (s = !1, u = {
			type: "tableBody",
			start: Object.assign({}, m.start),
			end: Object.assign({}, m.end)
		}, f.add(n, 0, [[
			"enter",
			u,
			t
		]])), i = m.type === "tableDelimiterRow" ? 2 : u ? 3 : 1) : i && (m.type === "data" || m.type === "tableDelimiterMarker" || m.type === "tableDelimiterFiller") ? (r = !1, o[2] === 0 && (a[1] !== 0 && (o[0] = o[1], d = nm(f, t, a, i, void 0, d), a = [
			0,
			0,
			0,
			0
		]), o[2] = n)) : m.type === "tableCellDivider" && (r ? r = !1 : (a[1] !== 0 && (o[0] = o[1], d = nm(f, t, a, i, void 0, d)), a = o, o = [
			a[1],
			n,
			0,
			0
		])) : m.type === "tableHead" ? (s = !0, c = n) : m.type === "tableRow" || m.type === "tableDelimiterRow" ? (c = n, a[1] === 0 ? o[1] !== 0 && (d = nm(f, t, o, i, n, d)) : (o[0] = o[1], d = nm(f, t, a, i, n, d)), i = 0) : i && (m.type === "data" || m.type === "tableDelimiterMarker" || m.type === "tableDelimiterFiller") && (o[3] = n);
	}
	for (c !== 0 && rm(f, t, c, l, u), f.consume(t.events), n = -1; ++n < t.events.length;) {
		let e = t.events[n];
		e[0] === "enter" && e[1].type === "table" && (e[1]._align = Qp(t.events, n));
	}
	return e;
}
function nm(e, t, n, r, i, a) {
	let o = r === 1 ? "tableHeader" : r === 2 ? "tableDelimiter" : "tableData";
	n[0] !== 0 && (a.end = Object.assign({}, im(t.events, n[0])), e.add(n[0], 0, [[
		"exit",
		a,
		t
	]]));
	let s = im(t.events, n[1]);
	if (a = {
		type: o,
		start: Object.assign({}, s),
		end: Object.assign({}, s)
	}, e.add(n[1], 0, [[
		"enter",
		a,
		t
	]]), n[2] !== 0) {
		let i = im(t.events, n[2]), a = im(t.events, n[3]), o = {
			type: "tableContent",
			start: Object.assign({}, i),
			end: Object.assign({}, a)
		};
		if (e.add(n[2], 0, [[
			"enter",
			o,
			t
		]]), r !== 2) {
			let r = t.events[n[2]], i = t.events[n[3]];
			if (r[1].end = Object.assign({}, i[1].end), r[1].type = "chunkText", r[1].contentType = "text", n[3] > n[2] + 1) {
				let t = n[2] + 1, r = n[3] - n[2] - 1;
				e.add(t, r, []);
			}
		}
		e.add(n[3] + 1, 0, [[
			"exit",
			o,
			t
		]]);
	}
	return i !== void 0 && (a.end = Object.assign({}, im(t.events, i)), e.add(i, 0, [[
		"exit",
		a,
		t
	]]), a = void 0), a;
}
function rm(e, t, n, r, i) {
	let a = [], o = im(t.events, n);
	i && (i.end = Object.assign({}, o), a.push([
		"exit",
		i,
		t
	])), r.end = Object.assign({}, o), a.push([
		"exit",
		r,
		t
	]), e.add(n + 1, 0, a);
}
function im(e, t) {
	let n = e[t], r = n[0] === "enter" ? "start" : "end";
	return n[1][r];
}
function am(e) {
	return e !== null && e < -2;
}
function om(e) {
	return e !== null && (e < 0 || e === 32);
}
function sm(e) {
	return e === -2 || e === -1 || e === 32;
}
// node_modules/micromark-extension-gfm-task-list-item/node_modules/micromark-factory-space/index.js
function cm(e, t, n, r) {
	let i = r ? r - 1 : Infinity, a = 0;
	return o;
	function o(r) {
		return sm(r) ? (e.enter(n), s(r)) : t(r);
	}
	function s(r) {
		return sm(r) && a++ < i ? (e.consume(r), s) : (e.exit(n), t(r));
	}
}
// node_modules/micromark-extension-gfm-task-list-item/lib/syntax.js
var lm = {
	name: "tasklistCheck",
	tokenize: dm
};
function um() {
	return { text: { 91: lm } };
}
function dm(e, t, n) {
	let r = this;
	return i;
	function i(t) {
		return r.previous !== null || !r._gfmTasklistFirstContentOfListItem ? n(t) : (e.enter("taskListCheck"), e.enter("taskListCheckMarker"), e.consume(t), e.exit("taskListCheckMarker"), a);
	}
	function a(t) {
		return om(t) ? (e.enter("taskListCheckValueUnchecked"), e.consume(t), e.exit("taskListCheckValueUnchecked"), o) : t === 88 || t === 120 ? (e.enter("taskListCheckValueChecked"), e.consume(t), e.exit("taskListCheckValueChecked"), o) : n(t);
	}
	function o(t) {
		return t === 93 ? (e.enter("taskListCheckMarker"), e.consume(t), e.exit("taskListCheckMarker"), e.exit("taskListCheck"), s) : n(t);
	}
	function s(r) {
		return am(r) ? t(r) : sm(r) ? e.check({ tokenize: fm }, t, n)(r) : n(r);
	}
}
function fm(e, t, n) {
	return cm(e, r, "whitespace");
	function r(e) {
		return e === null ? n(e) : t(e);
	}
}
// node_modules/micromark-extension-gfm/index.js
function pm(e) {
	return Bf([
		ap(),
		Ap(),
		Gp(e),
		$p(),
		um()
	]);
}
// node_modules/remark-gfm/lib/index.js
var mm = {};
function hm(e) {
	let t = this, n = e || mm, r = t.data(), i = r.micromarkExtensions ||= [], a = r.fromMarkdownExtensions ||= [], o = r.toMarkdownExtensions ||= [];
	i.push(pm(n)), a.push(If()), o.push(Lf(n));
}
// node_modules/mdast-util-math/lib/index.js
function gm() {
	return {
		enter: {
			mathFlow: e,
			mathFlowFenceMeta: t,
			mathText: a
		},
		exit: {
			mathFlow: i,
			mathFlowFence: r,
			mathFlowFenceMeta: n,
			mathFlowValue: s,
			mathText: o,
			mathTextData: s
		}
	};
	function e(e) {
		this.enter({
			type: "math",
			meta: null,
			value: "",
			data: {
				hName: "pre",
				hChildren: [{
					type: "element",
					tagName: "code",
					properties: { className: ["language-math", "math-display"] },
					children: []
				}]
			}
		}, e);
	}
	function t() {
		this.buffer();
	}
	function n() {
		let e = this.resume(), t = this.stack[this.stack.length - 1];
		t.type, t.meta = e;
	}
	function r() {
		this.data.mathFlowInside || (this.buffer(), this.data.mathFlowInside = !0);
	}
	function i(e) {
		let t = this.resume().replace(/^(\r?\n|\r)|(\r?\n|\r)$/g, ""), n = this.stack[this.stack.length - 1];
		n.type, this.exit(e), n.value = t;
		let r = n.data.hChildren[0];
		r.type, r.tagName, r.children.push({
			type: "text",
			value: t
		}), this.data.mathFlowInside = void 0;
	}
	function a(e) {
		this.enter({
			type: "inlineMath",
			value: "",
			data: {
				hName: "code",
				hProperties: { className: ["language-math", "math-inline"] },
				hChildren: []
			}
		}, e), this.buffer();
	}
	function o(e) {
		let t = this.resume(), n = this.stack[this.stack.length - 1];
		n.type, this.exit(e), n.value = t, n.data.hChildren.push({
			type: "text",
			value: t
		});
	}
	function s(e) {
		this.config.enter.data.call(this, e), this.config.exit.data.call(this, e);
	}
}
function _m(e) {
	let t = (e || {}).singleDollarTextMath;
	return t ??= !0, r.peek = i, {
		unsafe: [
			{
				character: "\r",
				inConstruct: "mathFlowMeta"
			},
			{
				character: "\n",
				inConstruct: "mathFlowMeta"
			},
			{
				character: "$",
				after: t ? void 0 : "\\$",
				inConstruct: "phrasing"
			},
			{
				character: "$",
				inConstruct: "mathFlowMeta"
			},
			{
				atBreak: !0,
				character: "$",
				after: "\\$"
			}
		],
		handlers: {
			math: n,
			inlineMath: r
		}
	};
	function n(e, t, n, r) {
		let i = e.value || "", a = n.createTracker(r), o = "$".repeat(Math.max(Xu(i, "$") + 1, 2)), s = n.enter("mathFlow"), c = a.move(o);
		if (e.meta) {
			let t = n.enter("mathFlowMeta");
			c += a.move(n.safe(e.meta, {
				after: "\n",
				before: c,
				encode: ["$"],
				...a.current()
			})), t();
		}
		return c += a.move("\n"), i && (c += a.move(i + "\n")), c += a.move(o), s(), c;
	}
	function r(e, n, r) {
		let i = e.value || "", a = 1;
		for (t || a++; RegExp("(^|[^$])" + "\\$".repeat(a) + "([^$]|$)").test(i);) a++;
		let o = "$".repeat(a);
		/[^ \r\n]/.test(i) && (/^[ \r\n]/.test(i) && /[ \r\n]$/.test(i) || /^\$|\$$/.test(i)) && (i = " " + i + " ");
		let s = -1;
		for (; ++s < r.unsafe.length;) {
			let e = r.unsafe[s];
			if (!e.atBreak) continue;
			let t = r.compilePattern(e), n;
			for (; n = t.exec(i);) {
				let e = n.index;
				i.codePointAt(e) === 10 && i.codePointAt(e - 1) === 13 && e--, i = i.slice(0, e) + " " + i.slice(n.index + 1);
			}
		}
		return o + i + o;
	}
	function i() {
		return "$";
	}
}
function vm(e) {
	return e !== null && e < -2;
}
function ym(e) {
	return e === -2 || e === -1 || e === 32;
}
// node_modules/micromark-extension-math/node_modules/micromark-factory-space/index.js
function bm(e, t, n, r) {
	let i = r ? r - 1 : Infinity, a = 0;
	return o;
	function o(r) {
		return ym(r) ? (e.enter(n), s(r)) : t(r);
	}
	function s(r) {
		return ym(r) && a++ < i ? (e.consume(r), s) : (e.exit(n), t(r));
	}
}
// node_modules/micromark-extension-math/lib/math-flow.js
var xm = {
	tokenize: Cm,
	concrete: !0,
	name: "mathFlow"
}, Sm = {
	tokenize: wm,
	partial: !0
};
function Cm(e, t, n) {
	let r = this, i = r.events[r.events.length - 1], a = i && i[1].type === "linePrefix" ? i[2].sliceSerialize(i[1], !0).length : 0, o = 0;
	return s;
	function s(t) {
		return e.enter("mathFlow"), e.enter("mathFlowFence"), e.enter("mathFlowFenceSequence"), c(t);
	}
	function c(t) {
		return t === 36 ? (e.consume(t), o++, c) : o < 2 ? n(t) : (e.exit("mathFlowFenceSequence"), bm(e, l, "whitespace")(t));
	}
	function l(t) {
		return t === null || vm(t) ? d(t) : (e.enter("mathFlowFenceMeta"), e.enter("chunkString", { contentType: "string" }), u(t));
	}
	function u(t) {
		return t === null || vm(t) ? (e.exit("chunkString"), e.exit("mathFlowFenceMeta"), d(t)) : t === 36 ? n(t) : (e.consume(t), u);
	}
	function d(n) {
		return e.exit("mathFlowFence"), r.interrupt ? t(n) : e.attempt(Sm, f, g)(n);
	}
	function f(t) {
		return e.attempt({
			tokenize: _,
			partial: !0
		}, g, p)(t);
	}
	function p(t) {
		return (a ? bm(e, m, "linePrefix", a + 1) : m)(t);
	}
	function m(t) {
		return t === null ? g(t) : vm(t) ? e.attempt(Sm, f, g)(t) : (e.enter("mathFlowValue"), h(t));
	}
	function h(t) {
		return t === null || vm(t) ? (e.exit("mathFlowValue"), m(t)) : (e.consume(t), h);
	}
	function g(n) {
		return e.exit("mathFlow"), t(n);
	}
	function _(e, t, n) {
		let i = 0;
		return bm(e, a, "linePrefix", r.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4);
		function a(t) {
			return e.enter("mathFlowFence"), e.enter("mathFlowFenceSequence"), s(t);
		}
		function s(t) {
			return t === 36 ? (i++, e.consume(t), s) : i < o ? n(t) : (e.exit("mathFlowFenceSequence"), bm(e, c, "whitespace")(t));
		}
		function c(r) {
			return r === null || vm(r) ? (e.exit("mathFlowFence"), t(r)) : n(r);
		}
	}
}
function wm(e, t, n) {
	let r = this;
	return i;
	function i(n) {
		return n === null ? t(n) : (e.enter("lineEnding"), e.consume(n), e.exit("lineEnding"), a);
	}
	function a(e) {
		return r.parser.lazy[r.now().line] ? n(e) : t(e);
	}
}
// node_modules/micromark-extension-math/lib/math-text.js
function Tm(e) {
	let t = (e || {}).singleDollarTextMath;
	return t ??= !0, {
		tokenize: n,
		resolve: Em,
		previous: Dm,
		name: "mathText"
	};
	function n(e, n, r) {
		let i = 0, a, o;
		return s;
		function s(t) {
			return e.enter("mathText"), e.enter("mathTextSequence"), c(t);
		}
		function c(n) {
			return n === 36 ? (e.consume(n), i++, c) : i < 2 && !t ? r(n) : (e.exit("mathTextSequence"), l(n));
		}
		function l(t) {
			return t === null ? r(t) : t === 36 ? (o = e.enter("mathTextSequence"), a = 0, d(t)) : t === 32 ? (e.enter("space"), e.consume(t), e.exit("space"), l) : vm(t) ? (e.enter("lineEnding"), e.consume(t), e.exit("lineEnding"), l) : (e.enter("mathTextData"), u(t));
		}
		function u(t) {
			return t === null || t === 32 || t === 36 || vm(t) ? (e.exit("mathTextData"), l(t)) : (e.consume(t), u);
		}
		function d(t) {
			return t === 36 ? (e.consume(t), a++, d) : a === i ? (e.exit("mathTextSequence"), e.exit("mathText"), n(t)) : (o.type = "mathTextData", u(t));
		}
	}
}
function Em(e) {
	let t = e.length - 4, n = 3, r, i;
	if ((e[n][1].type === "lineEnding" || e[n][1].type === "space") && (e[t][1].type === "lineEnding" || e[t][1].type === "space")) {
		for (r = n; ++r < t;) if (e[r][1].type === "mathTextData") {
			e[t][1].type = "mathTextPadding", e[n][1].type = "mathTextPadding", n += 2, t -= 2;
			break;
		}
	}
	for (r = n - 1, t++; ++r <= t;) i === void 0 ? r !== t && e[r][1].type !== "lineEnding" && (i = r) : (r === t || e[r][1].type === "lineEnding") && (e[i][1].type = "mathTextData", r !== i + 2 && (e[i][1].end = e[r - 1][1].end, e.splice(i + 2, r - i - 2), t -= r - i - 2, r = i + 2), i = void 0);
	return e;
}
function Dm(e) {
	return e !== 36 || this.events[this.events.length - 1][1].type === "characterEscape";
}
// node_modules/micromark-extension-math/lib/syntax.js
function Om(e) {
	return {
		flow: { 36: xm },
		text: { 36: Tm(e) }
	};
}
// node_modules/remark-math/lib/index.js
var km = {};
function Am(e) {
	let t = this, n = e || km, r = t.data(), i = r.micromarkExtensions ||= [], a = r.fromMarkdownExtensions ||= [], o = r.toMarkdownExtensions ||= [];
	i.push(Om(n)), a.push(gm()), o.push(_m(n));
}
// node_modules/remend/dist/index.js
var jm = /(\*\*)([^*]*?)$/, Mm = /(__)([^_]*?)$/, Nm = /(\*\*\*)([^*]*?)$/, Pm = /(\*)([^*]*?)$/, Fm = /(_)([^_]*?)$/, Im = /(`)([^`]*?)$/, Lm = /(~~)([^~]*?)$/, Rm = /^[\s_~*`]*$/, zm = /^[\s]*[-*+][\s]+$/, Bm = /[\p{L}\p{N}_]/u, Vm = /^```[^`\n]*```?$/, Hm = /^\*{4,}$/, Um = (e) => {
	if (!e) return !1;
	let t = e.charCodeAt(0);
	return t >= 48 && t <= 57 || t >= 65 && t <= 90 || t >= 97 && t <= 122 || t === 95 || Bm.test(e);
}, Wm = (e) => {
	let t = (e.match(/```/g) || []).length;
	return t > 0 && t % 2 == 0 && e.includes("\n");
}, Gm = (e, t) => {
	let n = 1;
	for (let r = t - 1; r >= 0; --r) if (e[r] === "]") n += 1;
	else if (e[r] === "[" && (--n, n === 0)) return r;
	return -1;
}, Km = (e, t) => {
	let n = 1;
	for (let r = t + 1; r < e.length; r += 1) if (e[r] === "[") n += 1;
	else if (e[r] === "]" && (--n, n === 0)) return r;
	return -1;
}, qm = (e, t) => {
	let n = !1, r = !1;
	for (let i = 0; i < e.length && i < t; i += 1) e[i] === "\\" && e[i + 1] === "$" ? i += 1 : e[i] === "$" && (e[i + 1] === "$" ? (r = !r, i += 1, n = !1) : r || (n = !n));
	return n || r;
}, Jm = (e, t, n) => {
	if (n !== " " && n !== "	") return !1;
	let r = 0;
	for (let n = t - 1; n >= 0; --n) if (e[n] === "\n") {
		r = n + 1;
		break;
	}
	for (let n = r; n < t; n += 1) if (e[n] !== " " && e[n] !== "	") return !1;
	return !0;
}, Ym = (e, t, n, r) => !!(n === "\\" || n === "*" || r === "*" || n && r && Um(n) && Um(r) || Jm(e, t, r)), Xm = (e) => {
	let t = 0, n = e.length;
	for (let r = 0; r < n; r += 1) {
		if (e[r] !== "*") continue;
		let i = r > 0 ? e[r - 1] : "", a = r < n - 1 ? e[r + 1] : "";
		Ym(e, r, i, a) || (t += 1);
	}
	return t;
}, Zm = (e, t, n, r) => !!(n === "\\" || e.includes("$") && qm(e, t) || n === "_" || r === "_" || n && r && Um(n) && Um(r)), Qm = (e) => {
	let t = 0, n = e.length;
	for (let r = 0; r < n; r += 1) {
		if (e[r] !== "_") continue;
		let i = r > 0 ? e[r - 1] : "", a = r < n - 1 ? e[r + 1] : "";
		Zm(e, r, i, a) || (t += 1);
	}
	return t;
}, $m = (e) => {
	let t = 0, n = 0;
	for (let r = 0; r < e.length; r += 1) e[r] === "*" ? n += 1 : (n >= 3 && (t += Math.floor(n / 3)), n = 0);
	return n >= 3 && (t += Math.floor(n / 3)), t;
}, eh = (e) => {
	if (Wm(e)) return e;
	let t = e.match(jm);
	if (t) {
		let n = t[2];
		if (!n || Rm.test(n)) return e;
		let r = e.lastIndexOf(t[1]), i = e.substring(0, r).lastIndexOf("\n"), a = i === -1 ? 0 : i + 1, o = e.substring(a, r);
		if (zm.test(o) && n.includes("\n")) return e;
		if ((e.match(/\*\*/g) || []).length % 2 == 1) return `${e}**`;
	}
	return e;
}, th = (e) => {
	let t = e.match(Mm);
	if (t) {
		let n = t[2];
		if (!n || Rm.test(n)) return e;
		let r = e.lastIndexOf(t[1]), i = e.substring(0, r).lastIndexOf("\n"), a = i === -1 ? 0 : i + 1, o = e.substring(a, r);
		if (zm.test(o) && n.includes("\n")) return e;
		if ((e.match(/__/g) || []).length % 2 == 1) return `${e}__`;
	}
	return e;
}, nh = (e) => {
	for (let t = 0; t < e.length; t += 1) if (e[t] === "*" && e[t - 1] !== "*" && e[t + 1] !== "*" && e[t - 1] !== "\\") {
		let n = t > 0 ? e[t - 1] : "", r = t < e.length - 1 ? e[t + 1] : "";
		if (n && r && Um(n) && Um(r)) continue;
		return t;
	}
	return -1;
}, rh = (e) => {
	if (Wm(e) || !e.match(Pm)) return e;
	let t = nh(e);
	if (t === -1) return e;
	let n = e.substring(t + 1);
	return !n || Rm.test(n) ? e : Xm(e) % 2 == 1 ? `${e}*` : e;
}, ih = (e) => {
	for (let t = 0; t < e.length; t += 1) if (e[t] === "_" && e[t - 1] !== "_" && e[t + 1] !== "_" && e[t - 1] !== "\\" && !qm(e, t)) {
		let n = t > 0 ? e[t - 1] : "", r = t < e.length - 1 ? e[t + 1] : "";
		if (n && r && Um(n) && Um(r)) continue;
		return t;
	}
	return -1;
}, ah = (e) => {
	let t = e.length;
	for (; t > 0 && e[t - 1] === "\n";) --t;
	return t < e.length ? `${e.slice(0, t)}_${e.slice(t)}` : `${e}_`;
}, oh = (e) => {
	if (Wm(e) || !e.match(Fm)) return e;
	let t = ih(e);
	if (t === -1) return e;
	let n = e.substring(t + 1);
	return !n || Rm.test(n) ? e : Qm(e) % 2 == 1 ? ah(e) : e;
}, sh = (e) => {
	if (Wm(e) || Hm.test(e)) return e;
	let t = e.match(Nm);
	if (t) {
		let n = t[2];
		if (!n || Rm.test(n)) return e;
		if ($m(e) % 2 == 1) return `${e}***`;
	}
	return e;
}, ch = (e, t) => {
	let n = !1, r = !1;
	for (let i = 0; i < t; i += 1) e.substring(i, i + 3) === "```" ? (r = !r, i += 2) : !r && e[i] === "`" && (n = !n);
	return n || r;
}, lh = (e, t) => {
	let n = e.substring(t, t + 3) === "```", r = t > 0 && e.substring(t - 1, t + 2) === "```", i = t > 1 && e.substring(t - 2, t + 1) === "```";
	return n || r || i;
}, uh = (e) => {
	let t = 0;
	for (let n = 0; n < e.length; n += 1) e[n] === "`" && !lh(e, n) && (t += 1);
	return t;
}, dh = (e) => !e.match(Vm) || e.includes("\n") ? null : e.endsWith("``") && !e.endsWith("```") ? `${e}\`` : e, fh = (e) => {
	let t = (e.match(/```/g) || []).length;
	return !!(t > 0 && t % 2 == 0 && e.includes("\n") || (e.endsWith("```\n") || e.endsWith("```")) && t % 2 == 0);
}, ph = (e) => (e.match(/```/g) || []).length % 2 == 1, mh = (e) => {
	let t = dh(e);
	if (t !== null) return t;
	if (fh(e)) return e;
	let n = e.match(Im);
	if (n && !ph(e)) {
		let t = n[2];
		if (!t || Rm.test(t)) return e;
		if (uh(e) % 2 == 1) return `${e}\``;
	}
	return e;
}, hh = (e) => {
	if ((e.match(/\$\$/g) || []).length % 2 == 0) return e;
	let t = e.indexOf("$$");
	return t !== -1 && e.indexOf("\n", t) !== -1 && !e.endsWith("\n") ? `${e}
$$` : `${e}$$`;
}, gh = (e, t) => {
	if (e.substring(t + 2).includes(")")) return null;
	let n = Gm(e, t);
	if (n === -1 || ch(e, n)) return null;
	let r = n > 0 && e[n - 1] === "!", i = r ? n - 1 : n, a = e.substring(0, i);
	return r ? a : `${a}[${e.substring(n + 1, t)}](streamdown:incomplete-link)`;
}, _h = (e, t) => {
	let n = t > 0 && e[t - 1] === "!", r = n ? t - 1 : t;
	if (!e.substring(t + 1).includes("]") || Km(e, t) === -1) {
		let t = e.substring(0, r);
		return n ? t : `${e}](streamdown:incomplete-link)`;
	}
	return null;
}, vh = (e) => {
	let t = e.lastIndexOf("](");
	if (t !== -1 && !ch(e, t)) {
		let n = gh(e, t);
		if (n !== null) return n;
	}
	for (let t = e.length - 1; t >= 0; --t) if (e[t] === "[" && !ch(e, t)) {
		let n = _h(e, t);
		if (n !== null) return n;
	}
	return e;
}, yh = (e) => {
	let t = e.match(Lm);
	if (t) {
		let n = t[2];
		if (!n || Rm.test(n)) return e;
		if ((e.match(/~~/g) || []).length % 2 == 1) return `${e}~~`;
	}
	return e;
}, bh = (e) => {
	if (!e || typeof e != "string") return e;
	let t = e, n = vh(t);
	return n.endsWith("](streamdown:incomplete-link)") ? n : (t = n, t = sh(t), t = eh(t), t = th(t), t = rh(t), t = oh(t), t = mh(t), t = yh(t), t = hh(t), t);
}, xh = (e) => e.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(), Sh = (e) => e.replace(/^([A-Z])|[\s-_]+(\w)/g, (e, t, n) => n ? n.toUpperCase() : t.toLowerCase()), Ch = (e) => {
	let t = Sh(e);
	return t.charAt(0).toUpperCase() + t.slice(1);
}, wh = (...e) => e.filter((e, t, n) => !!e && e.trim() !== "" && n.indexOf(e) === t).join(" ").trim(), Th = (e) => {
	for (let t in e) if (t.startsWith("aria-") || t === "role" || t === "title") return !0;
}, Eh = {
	xmlns: "http://www.w3.org/2000/svg",
	width: 24,
	height: 24,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 2,
	strokeLinecap: "round",
	strokeLinejoin: "round"
}, Dh = (0, x.forwardRef)(({ color: e = "currentColor", size: t = 24, strokeWidth: n = 2, absoluteStrokeWidth: r, className: i = "", children: a, iconNode: o, ...s }, c) => (0, x.createElement)("svg", {
	ref: c,
	...Eh,
	width: t,
	height: t,
	stroke: e,
	strokeWidth: r ? Number(n) * 24 / Number(t) : n,
	className: wh("lucide", i),
	...!a && !Th(s) && { "aria-hidden": "true" },
	...s
}, [...o.map(([e, t]) => (0, x.createElement)(e, t)), ...Array.isArray(a) ? a : [a]])), Oh = (e, t) => {
	let n = (0, x.forwardRef)(({ className: n, ...r }, i) => (0, x.createElement)(Dh, {
		ref: i,
		iconNode: t,
		className: wh(`lucide-${xh(Ch(e))}`, `lucide-${e}`, n),
		...r
	}));
	return n.displayName = Ch(e), n;
}, kh = Oh("check", [["path", {
	d: "M20 6 9 17l-5-5",
	key: "1gmf2c"
}]]), Ah = Oh("copy", [["rect", {
	width: "14",
	height: "14",
	x: "8",
	y: "8",
	rx: "2",
	ry: "2",
	key: "17jyea"
}], ["path", {
	d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",
	key: "zix9uf"
}]]), jh = Oh("download", [
	["path", {
		d: "M12 15V3",
		key: "m9g1x1"
	}],
	["path", {
		d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
		key: "ih7n3h"
	}],
	["path", {
		d: "m7 10 5 5 5-5",
		key: "brsn70"
	}]
]), Mh = Oh("loader-circle", [["path", {
	d: "M21 12a9 9 0 1 1-6.219-8.56",
	key: "13zald"
}]]), Nh = Oh("maximize-2", [
	["path", {
		d: "M15 3h6v6",
		key: "1q9fwt"
	}],
	["path", {
		d: "m21 3-7 7",
		key: "1l2asr"
	}],
	["path", {
		d: "m3 21 7-7",
		key: "tjx5ai"
	}],
	["path", {
		d: "M9 21H3v-6",
		key: "wtvkvv"
	}]
]), Ph = Oh("rotate-ccw", [["path", {
	d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",
	key: "1357e3"
}], ["path", {
	d: "M3 3v5h5",
	key: "1xhq8a"
}]]), Fh = Oh("x", [["path", {
	d: "M18 6 6 18",
	key: "1bl5f8"
}], ["path", {
	d: "m6 6 12 12",
	key: "d8bk6v"
}]]), Ih = Oh("zoom-in", [
	["circle", {
		cx: "11",
		cy: "11",
		r: "8",
		key: "4ej97u"
	}],
	["line", {
		x1: "21",
		x2: "16.65",
		y1: "21",
		y2: "16.65",
		key: "13gj7c"
	}],
	["line", {
		x1: "11",
		x2: "11",
		y1: "8",
		y2: "14",
		key: "1vmskp"
	}],
	["line", {
		x1: "8",
		x2: "14",
		y1: "11",
		y2: "11",
		key: "durymu"
	}]
]), Lh = Oh("zoom-out", [
	["circle", {
		cx: "11",
		cy: "11",
		r: "8",
		key: "4ej97u"
	}],
	["line", {
		x1: "21",
		x2: "16.65",
		y1: "21",
		y2: "16.65",
		key: "13gj7c"
	}],
	["line", {
		x1: "8",
		x2: "14",
		y1: "11",
		y2: "11",
		key: "durymu"
	}]
]);
// node_modules/clsx/dist/clsx.mjs
function Rh(e) {
	var t, n, r = "";
	if (typeof e == "string" || typeof e == "number") r += e;
	else if (typeof e == "object") {
		if (Array.isArray(e)) {
			var i = e.length;
			for (t = 0; t < i; t++) e[t] && (n = Rh(e[t])) && (r && (r += " "), r += n);
		} else for (n in e) e[n] && (r && (r += " "), r += n);
	}
	return r;
}
function zh() {
	for (var e, t, n = 0, r = "", i = arguments.length; n < i; n++) (e = arguments[n]) && (t = Rh(e)) && (r && (r += " "), r += t);
	return r;
}
// node_modules/tailwind-merge/dist/bundle-mjs.mjs
var Bh = (e, t) => {
	let n = Array(e.length + t.length);
	for (let t = 0; t < e.length; t++) n[t] = e[t];
	for (let r = 0; r < t.length; r++) n[e.length + r] = t[r];
	return n;
}, Vh = (e, t) => ({
	classGroupId: e,
	validator: t
}), Hh = (e = /* @__PURE__ */ new Map(), t = null, n) => ({
	nextPart: e,
	validators: t,
	classGroupId: n
}), Uh = "-", Wh = [], Gh = "arbitrary..", Kh = (e) => {
	let t = Yh(e), { conflictingClassGroups: n, conflictingClassGroupModifiers: r } = e;
	return {
		getClassGroupId: (e) => {
			if (e.startsWith("[") && e.endsWith("]")) return Jh(e);
			let n = e.split(Uh);
			return qh(n, +(n[0] === "" && n.length > 1), t);
		},
		getConflictingClassGroupIds: (e, t) => {
			if (t) {
				let t = r[e], i = n[e];
				return t ? i ? Bh(i, t) : t : i || Wh;
			}
			return n[e] || Wh;
		}
	};
}, qh = (e, t, n) => {
	if (e.length - t === 0) return n.classGroupId;
	let r = e[t], i = n.nextPart.get(r);
	if (i) {
		let n = qh(e, t + 1, i);
		if (n) return n;
	}
	let a = n.validators;
	if (a === null) return;
	let o = t === 0 ? e.join(Uh) : e.slice(t).join(Uh), s = a.length;
	for (let e = 0; e < s; e++) {
		let t = a[e];
		if (t.validator(o)) return t.classGroupId;
	}
}, Jh = (e) => e.slice(1, -1).indexOf(":") === -1 ? void 0 : (() => {
	let t = e.slice(1, -1), n = t.indexOf(":"), r = t.slice(0, n);
	return r ? Gh + r : void 0;
})(), Yh = (e) => {
	let { theme: t, classGroups: n } = e;
	return Xh(n, t);
}, Xh = (e, t) => {
	let n = Hh();
	for (let r in e) {
		let i = e[r];
		Zh(i, n, r, t);
	}
	return n;
}, Zh = (e, t, n, r) => {
	let i = e.length;
	for (let a = 0; a < i; a++) {
		let i = e[a];
		Qh(i, t, n, r);
	}
}, Qh = (e, t, n, r) => {
	typeof e == "string" ? $h(e, t, n) : typeof e == "function" ? eg(e, t, n, r) : tg(e, t, n, r);
}, $h = (e, t, n) => {
	let r = e === "" ? t : ng(t, e);
	r.classGroupId = n;
}, eg = (e, t, n, r) => {
	rg(e) ? Zh(e(r), t, n, r) : (t.validators === null && (t.validators = []), t.validators.push(Vh(n, e)));
}, tg = (e, t, n, r) => {
	let i = Object.entries(e), a = i.length;
	for (let e = 0; e < a; e++) {
		let [a, o] = i[e];
		Zh(o, ng(t, a), n, r);
	}
}, ng = (e, t) => {
	let n = e, r = t.split(Uh), i = r.length;
	for (let e = 0; e < i; e++) {
		let t = r[e], i = n.nextPart.get(t);
		i || (i = Hh(), n.nextPart.set(t, i)), n = i;
	}
	return n;
}, rg = (e) => "isThemeGetter" in e && e.isThemeGetter === !0, ig = (e) => {
	if (e < 1) return {
		get: () => void 0,
		set: () => {}
	};
	let t = 0, n = Object.create(null), r = Object.create(null), i = (i, a) => {
		n[i] = a, t++, t > e && (t = 0, r = n, n = Object.create(null));
	};
	return {
		get(e) {
			let t = n[e];
			if (t !== void 0) return t;
			if ((t = r[e]) !== void 0) return i(e, t), t;
		},
		set(e, t) {
			e in n ? n[e] = t : i(e, t);
		}
	};
}, ag = "!", og = ":", sg = [], cg = (e, t, n, r, i) => ({
	modifiers: e,
	hasImportantModifier: t,
	baseClassName: n,
	maybePostfixModifierPosition: r,
	isExternal: i
}), lg = (e) => {
	let { prefix: t, experimentalParseClassName: n } = e, r = (e) => {
		let t = [], n = 0, r = 0, i = 0, a, o = e.length;
		for (let s = 0; s < o; s++) {
			let o = e[s];
			if (n === 0 && r === 0) {
				if (o === og) {
					t.push(e.slice(i, s)), i = s + 1;
					continue;
				}
				if (o === "/") {
					a = s;
					continue;
				}
			}
			o === "[" ? n++ : o === "]" ? n-- : o === "(" ? r++ : o === ")" && r--;
		}
		let s = t.length === 0 ? e : e.slice(i), c = s, l = !1;
		s.endsWith(ag) ? (c = s.slice(0, -1), l = !0) : s.startsWith(ag) && (c = s.slice(1), l = !0);
		let u = a && a > i ? a - i : void 0;
		return cg(t, l, c, u);
	};
	if (t) {
		let e = t + og, n = r;
		r = (t) => t.startsWith(e) ? n(t.slice(e.length)) : cg(sg, !1, t, void 0, !0);
	}
	if (n) {
		let e = r;
		r = (t) => n({
			className: t,
			parseClassName: e
		});
	}
	return r;
}, ug = (e) => {
	let t = /* @__PURE__ */ new Map();
	return e.orderSensitiveModifiers.forEach((e, n) => {
		t.set(e, 1e6 + n);
	}), (e) => {
		let n = [], r = [];
		for (let i = 0; i < e.length; i++) {
			let a = e[i], o = a[0] === "[", s = t.has(a);
			o || s ? (r.length > 0 && (r.sort(), n.push(...r), r = []), n.push(a)) : r.push(a);
		}
		return r.length > 0 && (r.sort(), n.push(...r)), n;
	};
}, dg = (e) => ({
	cache: ig(e.cacheSize),
	parseClassName: lg(e),
	sortModifiers: ug(e),
	postfixLookupClassGroupIds: fg(e),
	...Kh(e)
}), fg = (e) => {
	let t = Object.create(null), n = e.postfixLookupClassGroups;
	if (n) for (let e = 0; e < n.length; e++) t[n[e]] = !0;
	return t;
}, pg = /\s+/, mg = (e, t) => {
	let { parseClassName: n, getClassGroupId: r, getConflictingClassGroupIds: i, sortModifiers: a, postfixLookupClassGroupIds: o } = t, s = [], c = e.trim().split(pg), l = "";
	for (let e = c.length - 1; e >= 0; --e) {
		let t = c[e], { isExternal: u, modifiers: d, hasImportantModifier: f, baseClassName: p, maybePostfixModifierPosition: m } = n(t);
		if (u) {
			l = t + (l.length > 0 ? " " + l : l);
			continue;
		}
		let h = !!m, g;
		if (h) {
			g = r(p.substring(0, m));
			let e = g && o[g] ? r(p) : void 0;
			e && e !== g && (g = e, h = !1);
		} else g = r(p);
		if (!g) {
			if (!h || (g = r(p), !g)) {
				l = t + (l.length > 0 ? " " + l : l);
				continue;
			}
			h = !1;
		}
		let _ = d.length === 0 ? "" : d.length === 1 ? d[0] : a(d).join(":"), v = f ? _ + ag : _, y = v + g;
		if (s.indexOf(y) > -1) continue;
		s.push(y);
		let b = i(g, h);
		for (let e = 0; e < b.length; ++e) {
			let t = b[e];
			s.push(v + t);
		}
		l = t + (l.length > 0 ? " " + l : l);
	}
	return l;
}, hg = (...e) => {
	let t = 0, n, r, i = "";
	for (; t < e.length;) (n = e[t++]) && (r = gg(n)) && (i && (i += " "), i += r);
	return i;
}, gg = (e) => {
	if (typeof e == "string") return e;
	let t, n = "";
	for (let r = 0; r < e.length; r++) e[r] && (t = gg(e[r])) && (n && (n += " "), n += t);
	return n;
}, _g = (e, ...t) => {
	let n, r, i, a, o = (o) => (n = dg(t.reduce((e, t) => t(e), e())), r = n.cache.get, i = n.cache.set, a = s, s(o)), s = (e) => {
		let t = r(e);
		if (t) return t;
		let a = mg(e, n);
		return i(e, a), a;
	};
	return a = o, (...e) => a(hg(...e));
}, vg = [], yg = (e) => {
	let t = (t) => t[e] || vg;
	return t.isThemeGetter = !0, t.themeKey = e, t;
}, bg = /^\[(?:(\w[\w-]*):)?(.+)\]$/i, xg = /^\((?:(\w[\w-]*):)?(.+)\)$/i, Sg = /^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/, Cg = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, wg = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, Tg = /^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix|color|light-dark)\(.+\)$/, Eg = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, Dg = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, Og = (e) => Sg.test(e), U = (e) => !!e && !Number.isNaN(Number(e)), kg = (e) => !!e && Number.isInteger(Number(e)), Ag = (e) => e.endsWith("%") && U(e.slice(0, -1)), jg = (e) => Cg.test(e), Mg = () => !0, Ng = (e) => wg.test(e) && !Tg.test(e), Pg = () => !1, Fg = (e) => Eg.test(e), Ig = (e) => Dg.test(e), Lg = (e) => !W(e) && !G(e), Rg = (e) => e.startsWith("@container") && (e[10] === "/" && e[11] !== void 0 || e[11] === "s" && e[16] !== void 0 && e.startsWith("-size/", 10) || e[11] === "n" && e[18] !== void 0 && e.startsWith("-normal/", 10)), zg = (e) => e_(e, i_, Pg), W = (e) => bg.test(e), Bg = (e) => e_(e, a_, Ng), Vg = (e) => e_(e, o_, U), Hg = (e) => e_(e, c_, Mg), Ug = (e) => e_(e, s_, Pg), Wg = (e) => e_(e, n_, Pg), Gg = (e) => e_(e, r_, Ig), Kg = (e) => e_(e, l_, Fg), G = (e) => xg.test(e), qg = (e) => t_(e, a_), Jg = (e) => t_(e, s_), Yg = (e) => t_(e, n_), Xg = (e) => t_(e, i_), Zg = (e) => t_(e, r_), Qg = (e) => t_(e, l_, !0), $g = (e) => t_(e, c_, !0), e_ = (e, t, n) => {
	let r = bg.exec(e);
	return r ? r[1] ? t(r[1]) : n(r[2]) : !1;
}, t_ = (e, t, n = !1) => {
	let r = xg.exec(e);
	return r ? r[1] ? t(r[1]) : n : !1;
}, n_ = (e) => e === "position" || e === "percentage", r_ = (e) => e === "image" || e === "url", i_ = (e) => e === "length" || e === "size" || e === "bg-size", a_ = (e) => e === "length", o_ = (e) => e === "number", s_ = (e) => e === "family-name", c_ = (e) => e === "number" || e === "weight", l_ = (e) => e === "shadow", u_ = () => {
	let e = yg("color"), t = yg("font"), n = yg("text"), r = yg("font-weight"), i = yg("tracking"), a = yg("leading"), o = yg("breakpoint"), s = yg("container"), c = yg("spacing"), l = yg("radius"), u = yg("shadow"), d = yg("inset-shadow"), f = yg("text-shadow"), p = yg("drop-shadow"), m = yg("blur"), h = yg("perspective"), g = yg("aspect"), _ = yg("ease"), v = yg("animate"), y = () => [
		"auto",
		"avoid",
		"all",
		"avoid-page",
		"page",
		"left",
		"right",
		"column"
	], b = () => [
		"center",
		"top",
		"bottom",
		"left",
		"right",
		"top-left",
		"left-top",
		"top-right",
		"right-top",
		"bottom-right",
		"right-bottom",
		"bottom-left",
		"left-bottom"
	], ee = () => [
		...b(),
		G,
		W
	], te = () => [
		"auto",
		"hidden",
		"clip",
		"visible",
		"scroll"
	], x = () => [
		"auto",
		"contain",
		"none"
	], S = () => [
		G,
		W,
		c
	], C = () => [
		Og,
		"full",
		"auto",
		...S()
	], ne = () => [
		kg,
		"none",
		"subgrid",
		G,
		W
	], re = () => [
		"auto",
		{ span: [
			"full",
			kg,
			G,
			W
		] },
		kg,
		G,
		W
	], w = () => [
		kg,
		"auto",
		G,
		W
	], ie = () => [
		"auto",
		"min",
		"max",
		"fr",
		G,
		W
	], ae = () => [
		"start",
		"end",
		"center",
		"between",
		"around",
		"evenly",
		"stretch",
		"baseline",
		"center-safe",
		"end-safe"
	], oe = () => [
		"start",
		"end",
		"center",
		"stretch",
		"center-safe",
		"end-safe"
	], se = () => ["auto", ...S()], ce = () => [
		Og,
		"auto",
		"full",
		"dvw",
		"dvh",
		"lvw",
		"lvh",
		"svw",
		"svh",
		"min",
		"max",
		"fit",
		...S()
	], le = () => [
		s,
		Og,
		"screen",
		"full",
		"dvw",
		"lvw",
		"svw",
		"min",
		"max",
		"fit",
		...S()
	], ue = () => [
		Og,
		"screen",
		"full",
		"lh",
		"dvh",
		"lvh",
		"svh",
		"min",
		"max",
		"fit",
		...S()
	], T = () => [
		e,
		G,
		W
	], de = () => [
		...b(),
		Yg,
		Wg,
		{ position: [G, W] }
	], fe = () => ["no-repeat", { repeat: [
		"",
		"x",
		"y",
		"space",
		"round"
	] }], pe = () => [
		"auto",
		"cover",
		"contain",
		Xg,
		zg,
		{ size: [G, W] }
	], me = () => [
		Ag,
		qg,
		Bg
	], he = () => [
		"",
		"none",
		"full",
		l,
		G,
		W
	], E = () => [
		"",
		U,
		qg,
		Bg
	], ge = () => [
		"solid",
		"dashed",
		"dotted",
		"double"
	], _e = () => [
		"normal",
		"multiply",
		"screen",
		"overlay",
		"darken",
		"lighten",
		"color-dodge",
		"color-burn",
		"hard-light",
		"soft-light",
		"difference",
		"exclusion",
		"hue",
		"saturation",
		"color",
		"luminosity"
	], D = () => [
		U,
		Ag,
		Yg,
		Wg
	], O = () => [
		"",
		"none",
		m,
		G,
		W
	], ve = () => [
		"none",
		U,
		G,
		W
	], ye = () => [
		"none",
		U,
		G,
		W
	], be = () => [
		U,
		G,
		W
	], xe = () => [
		Og,
		"full",
		...S()
	];
	return {
		cacheSize: 500,
		theme: {
			animate: [
				"spin",
				"ping",
				"pulse",
				"bounce"
			],
			aspect: ["video"],
			blur: [jg],
			breakpoint: [jg],
			color: [Mg],
			container: [jg],
			"drop-shadow": [jg],
			ease: [
				"in",
				"out",
				"in-out"
			],
			font: [Lg],
			"font-weight": [
				"thin",
				"extralight",
				"light",
				"normal",
				"medium",
				"semibold",
				"bold",
				"extrabold",
				"black"
			],
			"inset-shadow": [jg],
			leading: [
				"none",
				"tight",
				"snug",
				"normal",
				"relaxed",
				"loose"
			],
			perspective: [
				"dramatic",
				"near",
				"normal",
				"midrange",
				"distant",
				"none"
			],
			radius: [jg],
			shadow: [jg],
			spacing: ["px", U],
			text: [jg],
			"text-shadow": [jg],
			tracking: [
				"tighter",
				"tight",
				"normal",
				"wide",
				"wider",
				"widest"
			]
		},
		classGroups: {
			aspect: [{ aspect: [
				"auto",
				"square",
				Og,
				W,
				G,
				g
			] }],
			container: ["container"],
			"container-type": [{ "@container": [
				"",
				"normal",
				"size",
				G,
				W
			] }],
			"container-named": [Rg],
			columns: [{ columns: [
				U,
				"auto",
				W,
				G,
				s
			] }],
			"break-after": [{ "break-after": y() }],
			"break-before": [{ "break-before": y() }],
			"break-inside": [{ "break-inside": [
				"auto",
				"avoid",
				"avoid-page",
				"avoid-column"
			] }],
			"box-decoration": [{ "box-decoration": ["slice", "clone"] }],
			box: [{ box: ["border", "content"] }],
			display: [
				"block",
				"inline-block",
				"inline",
				"flex",
				"inline-flex",
				"table",
				"inline-table",
				"table-caption",
				"table-cell",
				"table-column",
				"table-column-group",
				"table-footer-group",
				"table-header-group",
				"table-row-group",
				"table-row",
				"flow-root",
				"grid",
				"inline-grid",
				"contents",
				"list-item",
				"hidden"
			],
			sr: ["sr-only", "not-sr-only"],
			float: [{ float: [
				"right",
				"left",
				"none",
				"start",
				"end"
			] }],
			clear: [{ clear: [
				"left",
				"right",
				"both",
				"none",
				"start",
				"end"
			] }],
			isolation: ["isolate", "isolation-auto"],
			"object-fit": [{ object: [
				"contain",
				"cover",
				"fill",
				"none",
				"scale-down"
			] }],
			"object-position": [{ object: ee() }],
			overflow: [{ overflow: te() }],
			"overflow-x": [{ "overflow-x": te() }],
			"overflow-y": [{ "overflow-y": te() }],
			overscroll: [{ overscroll: x() }],
			"overscroll-x": [{ "overscroll-x": x() }],
			"overscroll-y": [{ "overscroll-y": x() }],
			position: [
				"static",
				"fixed",
				"absolute",
				"relative",
				"sticky"
			],
			inset: [{ inset: C() }],
			"inset-x": [{ "inset-x": C() }],
			"inset-y": [{ "inset-y": C() }],
			start: [{
				"inset-s": C(),
				start: C()
			}],
			end: [{
				"inset-e": C(),
				end: C()
			}],
			"inset-bs": [{ "inset-bs": C() }],
			"inset-be": [{ "inset-be": C() }],
			top: [{ top: C() }],
			right: [{ right: C() }],
			bottom: [{ bottom: C() }],
			left: [{ left: C() }],
			visibility: [
				"visible",
				"invisible",
				"collapse"
			],
			z: [{ z: [
				kg,
				"auto",
				G,
				W
			] }],
			basis: [{ basis: [
				Og,
				"full",
				"auto",
				s,
				...S()
			] }],
			"flex-direction": [{ flex: [
				"row",
				"row-reverse",
				"col",
				"col-reverse"
			] }],
			"flex-wrap": [{ flex: [
				"nowrap",
				"wrap",
				"wrap-reverse"
			] }],
			flex: [{ flex: [
				U,
				Og,
				"auto",
				"initial",
				"none",
				W
			] }],
			grow: [{ grow: [
				"",
				U,
				G,
				W
			] }],
			shrink: [{ shrink: [
				"",
				U,
				G,
				W
			] }],
			order: [{ order: [
				kg,
				"first",
				"last",
				"none",
				G,
				W
			] }],
			"grid-cols": [{ "grid-cols": ne() }],
			"col-start-end": [{ col: re() }],
			"col-start": [{ "col-start": w() }],
			"col-end": [{ "col-end": w() }],
			"grid-rows": [{ "grid-rows": ne() }],
			"row-start-end": [{ row: re() }],
			"row-start": [{ "row-start": w() }],
			"row-end": [{ "row-end": w() }],
			"grid-flow": [{ "grid-flow": [
				"row",
				"col",
				"dense",
				"row-dense",
				"col-dense"
			] }],
			"auto-cols": [{ "auto-cols": ie() }],
			"auto-rows": [{ "auto-rows": ie() }],
			gap: [{ gap: S() }],
			"gap-x": [{ "gap-x": S() }],
			"gap-y": [{ "gap-y": S() }],
			"justify-content": [{ justify: [...ae(), "normal"] }],
			"justify-items": [{ "justify-items": [...oe(), "normal"] }],
			"justify-self": [{ "justify-self": ["auto", ...oe()] }],
			"align-content": [{ content: ["normal", ...ae()] }],
			"align-items": [{ items: [...oe(), { baseline: ["", "last"] }] }],
			"align-self": [{ self: [
				"auto",
				...oe(),
				{ baseline: ["", "last"] }
			] }],
			"place-content": [{ "place-content": ae() }],
			"place-items": [{ "place-items": [...oe(), "baseline"] }],
			"place-self": [{ "place-self": ["auto", ...oe()] }],
			p: [{ p: S() }],
			px: [{ px: S() }],
			py: [{ py: S() }],
			ps: [{ ps: S() }],
			pe: [{ pe: S() }],
			pbs: [{ pbs: S() }],
			pbe: [{ pbe: S() }],
			pt: [{ pt: S() }],
			pr: [{ pr: S() }],
			pb: [{ pb: S() }],
			pl: [{ pl: S() }],
			m: [{ m: se() }],
			mx: [{ mx: se() }],
			my: [{ my: se() }],
			ms: [{ ms: se() }],
			me: [{ me: se() }],
			mbs: [{ mbs: se() }],
			mbe: [{ mbe: se() }],
			mt: [{ mt: se() }],
			mr: [{ mr: se() }],
			mb: [{ mb: se() }],
			ml: [{ ml: se() }],
			"space-x": [{ "space-x": S() }],
			"space-x-reverse": ["space-x-reverse"],
			"space-y": [{ "space-y": S() }],
			"space-y-reverse": ["space-y-reverse"],
			size: [{ size: ce() }],
			"inline-size": [{ inline: ["auto", ...le()] }],
			"min-inline-size": [{ "min-inline": ["auto", ...le()] }],
			"max-inline-size": [{ "max-inline": ["none", ...le()] }],
			"block-size": [{ block: ["auto", ...ue()] }],
			"min-block-size": [{ "min-block": ["auto", ...ue()] }],
			"max-block-size": [{ "max-block": ["none", ...ue()] }],
			w: [{ w: [
				s,
				"screen",
				...ce()
			] }],
			"min-w": [{ "min-w": [
				s,
				"screen",
				"none",
				...ce()
			] }],
			"max-w": [{ "max-w": [
				s,
				"screen",
				"none",
				"prose",
				{ screen: [o] },
				...ce()
			] }],
			h: [{ h: [
				"screen",
				"lh",
				...ce()
			] }],
			"min-h": [{ "min-h": [
				"screen",
				"lh",
				"none",
				...ce()
			] }],
			"max-h": [{ "max-h": [
				"screen",
				"lh",
				"none",
				...ce()
			] }],
			"font-size": [{ text: [
				"base",
				n,
				qg,
				Bg
			] }],
			"font-smoothing": ["antialiased", "subpixel-antialiased"],
			"font-style": ["italic", "not-italic"],
			"font-weight": [{ font: [
				r,
				$g,
				Hg
			] }],
			"font-stretch": [{ "font-stretch": [
				"ultra-condensed",
				"extra-condensed",
				"condensed",
				"semi-condensed",
				"normal",
				"semi-expanded",
				"expanded",
				"extra-expanded",
				"ultra-expanded",
				Ag,
				W
			] }],
			"font-family": [{ font: [
				Jg,
				Ug,
				t
			] }],
			"font-features": [{ "font-features": [W] }],
			"fvn-normal": ["normal-nums"],
			"fvn-ordinal": ["ordinal"],
			"fvn-slashed-zero": ["slashed-zero"],
			"fvn-figure": ["lining-nums", "oldstyle-nums"],
			"fvn-spacing": ["proportional-nums", "tabular-nums"],
			"fvn-fraction": ["diagonal-fractions", "stacked-fractions"],
			tracking: [{ tracking: [
				i,
				G,
				W
			] }],
			"line-clamp": [{ "line-clamp": [
				U,
				"none",
				G,
				Vg
			] }],
			leading: [{ leading: [
				"none",
				a,
				...S()
			] }],
			"list-image": [{ "list-image": [
				"none",
				G,
				W
			] }],
			"list-style-position": [{ list: ["inside", "outside"] }],
			"list-style-type": [{ list: [
				"disc",
				"decimal",
				"none",
				G,
				W
			] }],
			"text-alignment": [{ text: [
				"left",
				"center",
				"right",
				"justify",
				"start",
				"end"
			] }],
			"placeholder-color": [{ placeholder: T() }],
			"text-color": [{ text: T() }],
			"text-decoration": [
				"underline",
				"overline",
				"line-through",
				"no-underline"
			],
			"text-decoration-style": [{ decoration: [...ge(), "wavy"] }],
			"text-decoration-thickness": [{ decoration: [
				U,
				"from-font",
				"auto",
				G,
				Bg
			] }],
			"text-decoration-color": [{ decoration: T() }],
			"underline-offset": [{ "underline-offset": [
				U,
				"auto",
				G,
				W
			] }],
			"text-transform": [
				"uppercase",
				"lowercase",
				"capitalize",
				"normal-case"
			],
			"text-overflow": [
				"truncate",
				"text-ellipsis",
				"text-clip"
			],
			"text-wrap": [{ text: [
				"wrap",
				"nowrap",
				"balance",
				"pretty"
			] }],
			indent: [{ indent: S() }],
			"tab-size": [{ tab: [
				kg,
				G,
				W
			] }],
			"vertical-align": [{ align: [
				"baseline",
				"top",
				"middle",
				"bottom",
				"text-top",
				"text-bottom",
				"sub",
				"super",
				G,
				W
			] }],
			whitespace: [{ whitespace: [
				"normal",
				"nowrap",
				"pre",
				"pre-line",
				"pre-wrap",
				"break-spaces"
			] }],
			break: [{ break: [
				"normal",
				"words",
				"all",
				"keep"
			] }],
			wrap: [{ wrap: [
				"break-word",
				"anywhere",
				"normal"
			] }],
			hyphens: [{ hyphens: [
				"none",
				"manual",
				"auto"
			] }],
			content: [{ content: [
				"none",
				G,
				W
			] }],
			"bg-attachment": [{ bg: [
				"fixed",
				"local",
				"scroll"
			] }],
			"bg-clip": [{ "bg-clip": [
				"border",
				"padding",
				"content",
				"text"
			] }],
			"bg-origin": [{ "bg-origin": [
				"border",
				"padding",
				"content"
			] }],
			"bg-position": [{ bg: de() }],
			"bg-repeat": [{ bg: fe() }],
			"bg-size": [{ bg: pe() }],
			"bg-image": [{ bg: [
				"none",
				{
					linear: [
						{ to: [
							"t",
							"tr",
							"r",
							"br",
							"b",
							"bl",
							"l",
							"tl"
						] },
						kg,
						G,
						W
					],
					radial: [
						"",
						G,
						W
					],
					conic: [
						"",
						kg,
						G,
						W
					]
				},
				Zg,
				Gg
			] }],
			"bg-color": [{ bg: T() }],
			"gradient-from-pos": [{ from: me() }],
			"gradient-via-pos": [{ via: me() }],
			"gradient-to-pos": [{ to: me() }],
			"gradient-from": [{ from: T() }],
			"gradient-via": [{ via: T() }],
			"gradient-to": [{ to: T() }],
			rounded: [{ rounded: he() }],
			"rounded-s": [{ "rounded-s": he() }],
			"rounded-e": [{ "rounded-e": he() }],
			"rounded-t": [{ "rounded-t": he() }],
			"rounded-r": [{ "rounded-r": he() }],
			"rounded-b": [{ "rounded-b": he() }],
			"rounded-l": [{ "rounded-l": he() }],
			"rounded-ss": [{ "rounded-ss": he() }],
			"rounded-se": [{ "rounded-se": he() }],
			"rounded-ee": [{ "rounded-ee": he() }],
			"rounded-es": [{ "rounded-es": he() }],
			"rounded-tl": [{ "rounded-tl": he() }],
			"rounded-tr": [{ "rounded-tr": he() }],
			"rounded-br": [{ "rounded-br": he() }],
			"rounded-bl": [{ "rounded-bl": he() }],
			"border-w": [{ border: E() }],
			"border-w-x": [{ "border-x": E() }],
			"border-w-y": [{ "border-y": E() }],
			"border-w-s": [{ "border-s": E() }],
			"border-w-e": [{ "border-e": E() }],
			"border-w-bs": [{ "border-bs": E() }],
			"border-w-be": [{ "border-be": E() }],
			"border-w-t": [{ "border-t": E() }],
			"border-w-r": [{ "border-r": E() }],
			"border-w-b": [{ "border-b": E() }],
			"border-w-l": [{ "border-l": E() }],
			"divide-x": [{ "divide-x": E() }],
			"divide-x-reverse": ["divide-x-reverse"],
			"divide-y": [{ "divide-y": E() }],
			"divide-y-reverse": ["divide-y-reverse"],
			"border-style": [{ border: [
				...ge(),
				"hidden",
				"none"
			] }],
			"divide-style": [{ divide: [
				...ge(),
				"hidden",
				"none"
			] }],
			"border-color": [{ border: T() }],
			"border-color-x": [{ "border-x": T() }],
			"border-color-y": [{ "border-y": T() }],
			"border-color-s": [{ "border-s": T() }],
			"border-color-e": [{ "border-e": T() }],
			"border-color-bs": [{ "border-bs": T() }],
			"border-color-be": [{ "border-be": T() }],
			"border-color-t": [{ "border-t": T() }],
			"border-color-r": [{ "border-r": T() }],
			"border-color-b": [{ "border-b": T() }],
			"border-color-l": [{ "border-l": T() }],
			"divide-color": [{ divide: T() }],
			"outline-style": [{ outline: [
				...ge(),
				"none",
				"hidden"
			] }],
			"outline-offset": [{ "outline-offset": [
				U,
				G,
				W
			] }],
			"outline-w": [{ outline: [
				"",
				U,
				qg,
				Bg
			] }],
			"outline-color": [{ outline: T() }],
			shadow: [{ shadow: [
				"",
				"inner",
				"none",
				u,
				Qg,
				Kg
			] }],
			"shadow-color": [{ shadow: T() }],
			"inset-shadow": [{ "inset-shadow": [
				"none",
				d,
				Qg,
				Kg
			] }],
			"inset-shadow-color": [{ "inset-shadow": T() }],
			"ring-w": [{ ring: E() }],
			"ring-w-inset": ["ring-inset"],
			"ring-color": [{ ring: T() }],
			"ring-offset-w": [{ "ring-offset": [U, Bg] }],
			"ring-offset-color": [{ "ring-offset": T() }],
			"inset-ring-w": [{ "inset-ring": E() }],
			"inset-ring-color": [{ "inset-ring": T() }],
			"text-shadow": [{ "text-shadow": [
				"none",
				f,
				Qg,
				Kg
			] }],
			"text-shadow-color": [{ "text-shadow": T() }],
			opacity: [{ opacity: [
				U,
				G,
				W
			] }],
			"mix-blend": [{ "mix-blend": [
				..._e(),
				"plus-darker",
				"plus-lighter"
			] }],
			"bg-blend": [{ "bg-blend": _e() }],
			"mask-clip": [{ "mask-clip": [
				"border",
				"padding",
				"content",
				"fill",
				"stroke",
				"view"
			] }, "mask-no-clip"],
			"mask-composite": [{ mask: [
				"add",
				"subtract",
				"intersect",
				"exclude"
			] }],
			"mask-image-linear-pos": [{ "mask-linear": [U] }],
			"mask-image-linear-from-pos": [{ "mask-linear-from": D() }],
			"mask-image-linear-to-pos": [{ "mask-linear-to": D() }],
			"mask-image-linear-from-color": [{ "mask-linear-from": T() }],
			"mask-image-linear-to-color": [{ "mask-linear-to": T() }],
			"mask-image-t-from-pos": [{ "mask-t-from": D() }],
			"mask-image-t-to-pos": [{ "mask-t-to": D() }],
			"mask-image-t-from-color": [{ "mask-t-from": T() }],
			"mask-image-t-to-color": [{ "mask-t-to": T() }],
			"mask-image-r-from-pos": [{ "mask-r-from": D() }],
			"mask-image-r-to-pos": [{ "mask-r-to": D() }],
			"mask-image-r-from-color": [{ "mask-r-from": T() }],
			"mask-image-r-to-color": [{ "mask-r-to": T() }],
			"mask-image-b-from-pos": [{ "mask-b-from": D() }],
			"mask-image-b-to-pos": [{ "mask-b-to": D() }],
			"mask-image-b-from-color": [{ "mask-b-from": T() }],
			"mask-image-b-to-color": [{ "mask-b-to": T() }],
			"mask-image-l-from-pos": [{ "mask-l-from": D() }],
			"mask-image-l-to-pos": [{ "mask-l-to": D() }],
			"mask-image-l-from-color": [{ "mask-l-from": T() }],
			"mask-image-l-to-color": [{ "mask-l-to": T() }],
			"mask-image-x-from-pos": [{ "mask-x-from": D() }],
			"mask-image-x-to-pos": [{ "mask-x-to": D() }],
			"mask-image-x-from-color": [{ "mask-x-from": T() }],
			"mask-image-x-to-color": [{ "mask-x-to": T() }],
			"mask-image-y-from-pos": [{ "mask-y-from": D() }],
			"mask-image-y-to-pos": [{ "mask-y-to": D() }],
			"mask-image-y-from-color": [{ "mask-y-from": T() }],
			"mask-image-y-to-color": [{ "mask-y-to": T() }],
			"mask-image-radial": [{ "mask-radial": [G, W] }],
			"mask-image-radial-from-pos": [{ "mask-radial-from": D() }],
			"mask-image-radial-to-pos": [{ "mask-radial-to": D() }],
			"mask-image-radial-from-color": [{ "mask-radial-from": T() }],
			"mask-image-radial-to-color": [{ "mask-radial-to": T() }],
			"mask-image-radial-shape": [{ "mask-radial": ["circle", "ellipse"] }],
			"mask-image-radial-size": [{ "mask-radial": [{
				closest: ["side", "corner"],
				farthest: ["side", "corner"]
			}] }],
			"mask-image-radial-pos": [{ "mask-radial-at": b() }],
			"mask-image-conic-pos": [{ "mask-conic": [U] }],
			"mask-image-conic-from-pos": [{ "mask-conic-from": D() }],
			"mask-image-conic-to-pos": [{ "mask-conic-to": D() }],
			"mask-image-conic-from-color": [{ "mask-conic-from": T() }],
			"mask-image-conic-to-color": [{ "mask-conic-to": T() }],
			"mask-mode": [{ mask: [
				"alpha",
				"luminance",
				"match"
			] }],
			"mask-origin": [{ "mask-origin": [
				"border",
				"padding",
				"content",
				"fill",
				"stroke",
				"view"
			] }],
			"mask-position": [{ mask: de() }],
			"mask-repeat": [{ mask: fe() }],
			"mask-size": [{ mask: pe() }],
			"mask-type": [{ "mask-type": ["alpha", "luminance"] }],
			"mask-image": [{ mask: [
				"none",
				G,
				W
			] }],
			filter: [{ filter: [
				"",
				"none",
				G,
				W
			] }],
			blur: [{ blur: O() }],
			brightness: [{ brightness: [
				U,
				G,
				W
			] }],
			contrast: [{ contrast: [
				U,
				G,
				W
			] }],
			"drop-shadow": [{ "drop-shadow": [
				"",
				"none",
				p,
				Qg,
				Kg
			] }],
			"drop-shadow-color": [{ "drop-shadow": T() }],
			grayscale: [{ grayscale: [
				"",
				U,
				G,
				W
			] }],
			"hue-rotate": [{ "hue-rotate": [
				U,
				G,
				W
			] }],
			invert: [{ invert: [
				"",
				U,
				G,
				W
			] }],
			saturate: [{ saturate: [
				U,
				G,
				W
			] }],
			sepia: [{ sepia: [
				"",
				U,
				G,
				W
			] }],
			"backdrop-filter": [{ "backdrop-filter": [
				"",
				"none",
				G,
				W
			] }],
			"backdrop-blur": [{ "backdrop-blur": O() }],
			"backdrop-brightness": [{ "backdrop-brightness": [
				U,
				G,
				W
			] }],
			"backdrop-contrast": [{ "backdrop-contrast": [
				U,
				G,
				W
			] }],
			"backdrop-grayscale": [{ "backdrop-grayscale": [
				"",
				U,
				G,
				W
			] }],
			"backdrop-hue-rotate": [{ "backdrop-hue-rotate": [
				U,
				G,
				W
			] }],
			"backdrop-invert": [{ "backdrop-invert": [
				"",
				U,
				G,
				W
			] }],
			"backdrop-opacity": [{ "backdrop-opacity": [
				U,
				G,
				W
			] }],
			"backdrop-saturate": [{ "backdrop-saturate": [
				U,
				G,
				W
			] }],
			"backdrop-sepia": [{ "backdrop-sepia": [
				"",
				U,
				G,
				W
			] }],
			"border-collapse": [{ border: ["collapse", "separate"] }],
			"border-spacing": [{ "border-spacing": S() }],
			"border-spacing-x": [{ "border-spacing-x": S() }],
			"border-spacing-y": [{ "border-spacing-y": S() }],
			"table-layout": [{ table: ["auto", "fixed"] }],
			caption: [{ caption: ["top", "bottom"] }],
			transition: [{ transition: [
				"",
				"all",
				"colors",
				"opacity",
				"shadow",
				"transform",
				"none",
				G,
				W
			] }],
			"transition-behavior": [{ transition: ["normal", "discrete"] }],
			duration: [{ duration: [
				U,
				"initial",
				G,
				W
			] }],
			ease: [{ ease: [
				"linear",
				"initial",
				_,
				G,
				W
			] }],
			delay: [{ delay: [
				U,
				G,
				W
			] }],
			animate: [{ animate: [
				"none",
				v,
				G,
				W
			] }],
			backface: [{ backface: ["hidden", "visible"] }],
			perspective: [{ perspective: [
				h,
				G,
				W
			] }],
			"perspective-origin": [{ "perspective-origin": ee() }],
			rotate: [{ rotate: ve() }],
			"rotate-x": [{ "rotate-x": ve() }],
			"rotate-y": [{ "rotate-y": ve() }],
			"rotate-z": [{ "rotate-z": ve() }],
			scale: [{ scale: ye() }],
			"scale-x": [{ "scale-x": ye() }],
			"scale-y": [{ "scale-y": ye() }],
			"scale-z": [{ "scale-z": ye() }],
			"scale-3d": ["scale-3d"],
			skew: [{ skew: be() }],
			"skew-x": [{ "skew-x": be() }],
			"skew-y": [{ "skew-y": be() }],
			transform: [{ transform: [
				G,
				W,
				"",
				"none",
				"gpu",
				"cpu"
			] }],
			"transform-origin": [{ origin: ee() }],
			"transform-style": [{ transform: ["3d", "flat"] }],
			translate: [{ translate: xe() }],
			"translate-x": [{ "translate-x": xe() }],
			"translate-y": [{ "translate-y": xe() }],
			"translate-z": [{ "translate-z": xe() }],
			"translate-none": ["translate-none"],
			zoom: [{ zoom: [
				kg,
				G,
				W
			] }],
			accent: [{ accent: T() }],
			appearance: [{ appearance: ["none", "auto"] }],
			"caret-color": [{ caret: T() }],
			"color-scheme": [{ scheme: [
				"normal",
				"dark",
				"light",
				"light-dark",
				"only-dark",
				"only-light"
			] }],
			cursor: [{ cursor: [
				"auto",
				"default",
				"pointer",
				"wait",
				"text",
				"move",
				"help",
				"not-allowed",
				"none",
				"context-menu",
				"progress",
				"cell",
				"crosshair",
				"vertical-text",
				"alias",
				"copy",
				"no-drop",
				"grab",
				"grabbing",
				"all-scroll",
				"col-resize",
				"row-resize",
				"n-resize",
				"e-resize",
				"s-resize",
				"w-resize",
				"ne-resize",
				"nw-resize",
				"se-resize",
				"sw-resize",
				"ew-resize",
				"ns-resize",
				"nesw-resize",
				"nwse-resize",
				"zoom-in",
				"zoom-out",
				G,
				W
			] }],
			"field-sizing": [{ "field-sizing": ["fixed", "content"] }],
			"pointer-events": [{ "pointer-events": ["auto", "none"] }],
			resize: [{ resize: [
				"none",
				"",
				"y",
				"x"
			] }],
			"scroll-behavior": [{ scroll: ["auto", "smooth"] }],
			"scrollbar-thumb-color": [{ "scrollbar-thumb": T() }],
			"scrollbar-track-color": [{ "scrollbar-track": T() }],
			"scrollbar-gutter": [{ "scrollbar-gutter": [
				"auto",
				"stable",
				"both"
			] }],
			"scrollbar-w": [{ scrollbar: [
				"auto",
				"thin",
				"none"
			] }],
			"scroll-m": [{ "scroll-m": S() }],
			"scroll-mx": [{ "scroll-mx": S() }],
			"scroll-my": [{ "scroll-my": S() }],
			"scroll-ms": [{ "scroll-ms": S() }],
			"scroll-me": [{ "scroll-me": S() }],
			"scroll-mbs": [{ "scroll-mbs": S() }],
			"scroll-mbe": [{ "scroll-mbe": S() }],
			"scroll-mt": [{ "scroll-mt": S() }],
			"scroll-mr": [{ "scroll-mr": S() }],
			"scroll-mb": [{ "scroll-mb": S() }],
			"scroll-ml": [{ "scroll-ml": S() }],
			"scroll-p": [{ "scroll-p": S() }],
			"scroll-px": [{ "scroll-px": S() }],
			"scroll-py": [{ "scroll-py": S() }],
			"scroll-ps": [{ "scroll-ps": S() }],
			"scroll-pe": [{ "scroll-pe": S() }],
			"scroll-pbs": [{ "scroll-pbs": S() }],
			"scroll-pbe": [{ "scroll-pbe": S() }],
			"scroll-pt": [{ "scroll-pt": S() }],
			"scroll-pr": [{ "scroll-pr": S() }],
			"scroll-pb": [{ "scroll-pb": S() }],
			"scroll-pl": [{ "scroll-pl": S() }],
			"snap-align": [{ snap: [
				"start",
				"end",
				"center",
				"align-none"
			] }],
			"snap-stop": [{ snap: ["normal", "always"] }],
			"snap-type": [{ snap: [
				"none",
				"x",
				"y",
				"both"
			] }],
			"snap-strictness": [{ snap: ["mandatory", "proximity"] }],
			touch: [{ touch: [
				"auto",
				"none",
				"manipulation"
			] }],
			"touch-x": [{ "touch-pan": [
				"x",
				"left",
				"right"
			] }],
			"touch-y": [{ "touch-pan": [
				"y",
				"up",
				"down"
			] }],
			"touch-pz": ["touch-pinch-zoom"],
			select: [{ select: [
				"none",
				"text",
				"all",
				"auto"
			] }],
			"will-change": [{ "will-change": [
				"auto",
				"scroll",
				"contents",
				"transform",
				G,
				W
			] }],
			fill: [{ fill: ["none", ...T()] }],
			"stroke-w": [{ stroke: [
				U,
				qg,
				Bg,
				Vg
			] }],
			stroke: [{ stroke: ["none", ...T()] }],
			"forced-color-adjust": [{ "forced-color-adjust": ["auto", "none"] }]
		},
		conflictingClassGroups: {
			"container-named": ["container-type"],
			overflow: ["overflow-x", "overflow-y"],
			overscroll: ["overscroll-x", "overscroll-y"],
			inset: [
				"inset-x",
				"inset-y",
				"inset-bs",
				"inset-be",
				"start",
				"end",
				"top",
				"right",
				"bottom",
				"left"
			],
			"inset-x": [
				"start",
				"end",
				"right",
				"left"
			],
			"inset-y": [
				"inset-bs",
				"inset-be",
				"top",
				"bottom"
			],
			flex: [
				"basis",
				"grow",
				"shrink"
			],
			gap: ["gap-x", "gap-y"],
			p: [
				"px",
				"py",
				"ps",
				"pe",
				"pbs",
				"pbe",
				"pt",
				"pr",
				"pb",
				"pl"
			],
			px: [
				"ps",
				"pe",
				"pr",
				"pl"
			],
			py: [
				"pbs",
				"pbe",
				"pt",
				"pb"
			],
			m: [
				"mx",
				"my",
				"ms",
				"me",
				"mbs",
				"mbe",
				"mt",
				"mr",
				"mb",
				"ml"
			],
			mx: [
				"ms",
				"me",
				"mr",
				"ml"
			],
			my: [
				"mbs",
				"mbe",
				"mt",
				"mb"
			],
			size: ["w", "h"],
			"font-size": ["leading"],
			"fvn-normal": [
				"fvn-ordinal",
				"fvn-slashed-zero",
				"fvn-figure",
				"fvn-spacing",
				"fvn-fraction"
			],
			"fvn-ordinal": ["fvn-normal"],
			"fvn-slashed-zero": ["fvn-normal"],
			"fvn-figure": ["fvn-normal"],
			"fvn-spacing": ["fvn-normal"],
			"fvn-fraction": ["fvn-normal"],
			"line-clamp": ["display", "overflow"],
			rounded: [
				"rounded-s",
				"rounded-e",
				"rounded-t",
				"rounded-r",
				"rounded-b",
				"rounded-l",
				"rounded-ss",
				"rounded-se",
				"rounded-ee",
				"rounded-es",
				"rounded-tl",
				"rounded-tr",
				"rounded-br",
				"rounded-bl"
			],
			"rounded-s": ["rounded-ss", "rounded-es"],
			"rounded-e": ["rounded-se", "rounded-ee"],
			"rounded-t": ["rounded-tl", "rounded-tr"],
			"rounded-r": ["rounded-tr", "rounded-br"],
			"rounded-b": ["rounded-br", "rounded-bl"],
			"rounded-l": ["rounded-tl", "rounded-bl"],
			"border-spacing": ["border-spacing-x", "border-spacing-y"],
			"border-w": [
				"border-w-x",
				"border-w-y",
				"border-w-s",
				"border-w-e",
				"border-w-bs",
				"border-w-be",
				"border-w-t",
				"border-w-r",
				"border-w-b",
				"border-w-l"
			],
			"border-w-x": [
				"border-w-s",
				"border-w-e",
				"border-w-r",
				"border-w-l"
			],
			"border-w-y": [
				"border-w-bs",
				"border-w-be",
				"border-w-t",
				"border-w-b"
			],
			"border-color": [
				"border-color-x",
				"border-color-y",
				"border-color-s",
				"border-color-e",
				"border-color-bs",
				"border-color-be",
				"border-color-t",
				"border-color-r",
				"border-color-b",
				"border-color-l"
			],
			"border-color-x": [
				"border-color-s",
				"border-color-e",
				"border-color-r",
				"border-color-l"
			],
			"border-color-y": [
				"border-color-bs",
				"border-color-be",
				"border-color-t",
				"border-color-b"
			],
			translate: [
				"translate-x",
				"translate-y",
				"translate-none"
			],
			"translate-none": [
				"translate",
				"translate-x",
				"translate-y",
				"translate-z"
			],
			"scroll-m": [
				"scroll-mx",
				"scroll-my",
				"scroll-ms",
				"scroll-me",
				"scroll-mbs",
				"scroll-mbe",
				"scroll-mt",
				"scroll-mr",
				"scroll-mb",
				"scroll-ml"
			],
			"scroll-mx": [
				"scroll-ms",
				"scroll-me",
				"scroll-mr",
				"scroll-ml"
			],
			"scroll-my": [
				"scroll-mbs",
				"scroll-mbe",
				"scroll-mt",
				"scroll-mb"
			],
			"scroll-p": [
				"scroll-px",
				"scroll-py",
				"scroll-ps",
				"scroll-pe",
				"scroll-pbs",
				"scroll-pbe",
				"scroll-pt",
				"scroll-pr",
				"scroll-pb",
				"scroll-pl"
			],
			"scroll-px": [
				"scroll-ps",
				"scroll-pe",
				"scroll-pr",
				"scroll-pl"
			],
			"scroll-py": [
				"scroll-pbs",
				"scroll-pbe",
				"scroll-pt",
				"scroll-pb"
			],
			touch: [
				"touch-x",
				"touch-y",
				"touch-pz"
			],
			"touch-x": ["touch"],
			"touch-y": ["touch"],
			"touch-pz": ["touch"]
		},
		conflictingClassGroupModifiers: { "font-size": ["leading"] },
		postfixLookupClassGroups: ["container-type"],
		orderSensitiveModifiers: [
			"*",
			"**",
			"after",
			"backdrop",
			"before",
			"details-content",
			"file",
			"first-letter",
			"first-line",
			"marker",
			"placeholder",
			"selection"
		]
	};
}, d_ = (e, { cacheSize: t, prefix: n, experimentalParseClassName: r, extend: i = {}, override: a = {} }) => (f_(e, "cacheSize", t), f_(e, "prefix", n), f_(e, "experimentalParseClassName", r), p_(e.theme, a.theme), p_(e.classGroups, a.classGroups), p_(e.conflictingClassGroups, a.conflictingClassGroups), p_(e.conflictingClassGroupModifiers, a.conflictingClassGroupModifiers), f_(e, "postfixLookupClassGroups", a.postfixLookupClassGroups), f_(e, "orderSensitiveModifiers", a.orderSensitiveModifiers), m_(e.theme, i.theme), m_(e.classGroups, i.classGroups), m_(e.conflictingClassGroups, i.conflictingClassGroups), m_(e.conflictingClassGroupModifiers, i.conflictingClassGroupModifiers), h_(e, i, "postfixLookupClassGroups"), h_(e, i, "orderSensitiveModifiers"), e), f_ = (e, t, n) => {
	n !== void 0 && (e[t] = n);
}, p_ = (e, t) => {
	if (t) for (let n in t) f_(e, n, t[n]);
}, m_ = (e, t) => {
	if (t) for (let n in t) h_(e, t, n);
}, h_ = (e, t, n) => {
	let r = t[n];
	r !== void 0 && (e[n] = e[n] ? e[n].concat(r) : r);
}, g_ = (e, ...t) => typeof e == "function" ? _g(u_, e, ...t) : _g(() => d_(u_(), e), ...t), __ = /*#__PURE__*/ _g(u_), v_ = /^[$_\p{ID_Start}][$_\u{200C}\u{200D}\p{ID_Continue}]*$/u, y_ = /^[$_\p{ID_Start}][-$_\u{200C}\u{200D}\p{ID_Continue}]*$/u, b_ = {};
function x_(e, t) {
	return ((t || b_).jsx ? y_ : v_).test(e);
}
// node_modules/hast-util-to-jsx-runtime/node_modules/hast-util-whitespace/lib/index.js
var S_ = /[ \t\n\f\r]/g;
function C_(e) {
	return typeof e == "object" ? e.type === "text" && w_(e.value) : w_(e);
}
function w_(e) {
	return e.replace(S_, "") === "";
}
// node_modules/hast-util-to-jsx-runtime/node_modules/property-information/lib/util/schema.js
var T_ = class {
	constructor(e, t, n) {
		this.normal = t, this.property = e, n && (this.space = n);
	}
};
T_.prototype.normal = {}, T_.prototype.property = {}, T_.prototype.space = void 0;
// node_modules/hast-util-to-jsx-runtime/node_modules/property-information/lib/util/merge.js
function E_(e, t) {
	let n = {}, r = {};
	for (let t of e) Object.assign(n, t.property), Object.assign(r, t.normal);
	return new T_(n, r, t);
}
// node_modules/hast-util-to-jsx-runtime/node_modules/property-information/lib/normalize.js
function D_(e) {
	return e.toLowerCase();
}
// node_modules/hast-util-to-jsx-runtime/node_modules/property-information/lib/util/info.js
var O_ = class {
	constructor(e, t) {
		this.attribute = t, this.property = e;
	}
};
O_.prototype.attribute = "", O_.prototype.booleanish = !1, O_.prototype.boolean = !1, O_.prototype.commaOrSpaceSeparated = !1, O_.prototype.commaSeparated = !1, O_.prototype.defined = !1, O_.prototype.mustUseProperty = !1, O_.prototype.number = !1, O_.prototype.overloadedBoolean = !1, O_.prototype.property = "", O_.prototype.spaceSeparated = !1, O_.prototype.space = void 0;
// node_modules/hast-util-to-jsx-runtime/node_modules/property-information/lib/util/types.js
var k_ = /* @__PURE__ */ t({
	boolean: () => K,
	booleanish: () => j_,
	commaOrSpaceSeparated: () => F_,
	commaSeparated: () => P_,
	number: () => q,
	overloadedBoolean: () => M_,
	spaceSeparated: () => N_
}), A_ = 0, K = I_(), j_ = I_(), M_ = I_(), q = I_(), N_ = I_(), P_ = I_(), F_ = I_();
function I_() {
	return 2 ** ++A_;
}
// node_modules/hast-util-to-jsx-runtime/node_modules/property-information/lib/util/defined-info.js
var L_ = Object.keys(k_), R_ = class extends O_ {
	constructor(e, t, n, r) {
		let i = -1;
		if (super(e, t), z_(this, "space", r), typeof n == "number") for (; ++i < L_.length;) {
			let e = L_[i];
			z_(this, L_[i], (n & k_[e]) === k_[e]);
		}
	}
};
R_.prototype.defined = !0;
function z_(e, t, n) {
	n && (e[t] = n);
}
// node_modules/hast-util-to-jsx-runtime/node_modules/property-information/lib/util/create.js
function B_(e) {
	let t = {}, n = {};
	for (let [r, i] of Object.entries(e.properties)) {
		let a = new R_(r, e.transform(e.attributes || {}, r), i, e.space);
		e.mustUseProperty && e.mustUseProperty.includes(r) && (a.mustUseProperty = !0), t[r] = a, n[D_(r)] = r, n[D_(a.attribute)] = r;
	}
	return new T_(t, n, e.space);
}
// node_modules/hast-util-to-jsx-runtime/node_modules/property-information/lib/aria.js
var V_ = B_({
	properties: {
		ariaActiveDescendant: null,
		ariaAtomic: j_,
		ariaAutoComplete: null,
		ariaBusy: j_,
		ariaChecked: j_,
		ariaColCount: q,
		ariaColIndex: q,
		ariaColSpan: q,
		ariaControls: N_,
		ariaCurrent: null,
		ariaDescribedBy: N_,
		ariaDetails: null,
		ariaDisabled: j_,
		ariaDropEffect: N_,
		ariaErrorMessage: null,
		ariaExpanded: j_,
		ariaFlowTo: N_,
		ariaGrabbed: j_,
		ariaHasPopup: null,
		ariaHidden: j_,
		ariaInvalid: null,
		ariaKeyShortcuts: null,
		ariaLabel: null,
		ariaLabelledBy: N_,
		ariaLevel: q,
		ariaLive: null,
		ariaModal: j_,
		ariaMultiLine: j_,
		ariaMultiSelectable: j_,
		ariaOrientation: null,
		ariaOwns: N_,
		ariaPlaceholder: null,
		ariaPosInSet: q,
		ariaPressed: j_,
		ariaReadOnly: j_,
		ariaRelevant: null,
		ariaRequired: j_,
		ariaRoleDescription: N_,
		ariaRowCount: q,
		ariaRowIndex: q,
		ariaRowSpan: q,
		ariaSelected: j_,
		ariaSetSize: q,
		ariaSort: null,
		ariaValueMax: q,
		ariaValueMin: q,
		ariaValueNow: q,
		ariaValueText: null,
		role: null
	},
	transform(e, t) {
		return t === "role" ? t : "aria-" + t.slice(4).toLowerCase();
	}
});
// node_modules/hast-util-to-jsx-runtime/node_modules/property-information/lib/util/case-sensitive-transform.js
function H_(e, t) {
	return t in e ? e[t] : t;
}
// node_modules/hast-util-to-jsx-runtime/node_modules/property-information/lib/util/case-insensitive-transform.js
function U_(e, t) {
	return H_(e, t.toLowerCase());
}
// node_modules/hast-util-to-jsx-runtime/node_modules/property-information/lib/html.js
var W_ = B_({
	attributes: {
		acceptcharset: "accept-charset",
		classname: "class",
		htmlfor: "for",
		httpequiv: "http-equiv"
	},
	mustUseProperty: [
		"checked",
		"multiple",
		"muted",
		"selected"
	],
	properties: {
		abbr: null,
		accept: P_,
		acceptCharset: N_,
		accessKey: N_,
		action: null,
		allow: null,
		allowFullScreen: K,
		allowPaymentRequest: K,
		allowUserMedia: K,
		alpha: K,
		alt: null,
		as: null,
		async: K,
		autoCapitalize: null,
		autoComplete: N_,
		autoFocus: K,
		autoPlay: K,
		blocking: N_,
		capture: null,
		charSet: null,
		checked: K,
		cite: null,
		className: N_,
		closedBy: null,
		colorSpace: null,
		cols: q,
		colSpan: q,
		command: null,
		commandFor: null,
		content: null,
		contentEditable: j_,
		controls: K,
		controlsList: N_,
		coords: q | P_,
		crossOrigin: null,
		data: null,
		dateTime: null,
		decoding: null,
		default: K,
		defer: K,
		dir: null,
		dirName: null,
		disabled: K,
		download: M_,
		draggable: j_,
		encType: null,
		enterKeyHint: null,
		fetchPriority: null,
		form: null,
		formAction: null,
		formEncType: null,
		formMethod: null,
		formNoValidate: K,
		formTarget: null,
		headers: N_,
		height: q,
		hidden: M_,
		high: q,
		href: null,
		hrefLang: null,
		htmlFor: N_,
		httpEquiv: N_,
		id: null,
		imageSizes: null,
		imageSrcSet: null,
		inert: K,
		inputMode: null,
		integrity: null,
		is: null,
		isMap: K,
		itemId: null,
		itemProp: N_,
		itemRef: N_,
		itemScope: K,
		itemType: N_,
		kind: null,
		label: null,
		lang: null,
		language: null,
		list: null,
		loading: null,
		loop: K,
		low: q,
		manifest: null,
		max: null,
		maxLength: q,
		media: null,
		method: null,
		min: null,
		minLength: q,
		multiple: K,
		muted: K,
		name: null,
		nonce: null,
		noModule: K,
		noValidate: K,
		onAbort: null,
		onAfterPrint: null,
		onAuxClick: null,
		onBeforeMatch: null,
		onBeforePrint: null,
		onBeforeToggle: null,
		onBeforeUnload: null,
		onBlur: null,
		onCancel: null,
		onCanPlay: null,
		onCanPlayThrough: null,
		onChange: null,
		onClick: null,
		onClose: null,
		onContextLost: null,
		onContextMenu: null,
		onContextRestored: null,
		onCopy: null,
		onCueChange: null,
		onCut: null,
		onDblClick: null,
		onDrag: null,
		onDragEnd: null,
		onDragEnter: null,
		onDragExit: null,
		onDragLeave: null,
		onDragOver: null,
		onDragStart: null,
		onDrop: null,
		onDurationChange: null,
		onEmptied: null,
		onEnded: null,
		onError: null,
		onFocus: null,
		onFormData: null,
		onHashChange: null,
		onInput: null,
		onInvalid: null,
		onKeyDown: null,
		onKeyPress: null,
		onKeyUp: null,
		onLanguageChange: null,
		onLoad: null,
		onLoadedData: null,
		onLoadedMetadata: null,
		onLoadEnd: null,
		onLoadStart: null,
		onMessage: null,
		onMessageError: null,
		onMouseDown: null,
		onMouseEnter: null,
		onMouseLeave: null,
		onMouseMove: null,
		onMouseOut: null,
		onMouseOver: null,
		onMouseUp: null,
		onOffline: null,
		onOnline: null,
		onPageHide: null,
		onPageShow: null,
		onPaste: null,
		onPause: null,
		onPlay: null,
		onPlaying: null,
		onPopState: null,
		onProgress: null,
		onRateChange: null,
		onRejectionHandled: null,
		onReset: null,
		onResize: null,
		onScroll: null,
		onScrollEnd: null,
		onSecurityPolicyViolation: null,
		onSeeked: null,
		onSeeking: null,
		onSelect: null,
		onSlotChange: null,
		onStalled: null,
		onStorage: null,
		onSubmit: null,
		onSuspend: null,
		onTimeUpdate: null,
		onToggle: null,
		onUnhandledRejection: null,
		onUnload: null,
		onVolumeChange: null,
		onWaiting: null,
		onWheel: null,
		open: K,
		optimum: q,
		pattern: null,
		ping: N_,
		placeholder: null,
		playsInline: K,
		popover: null,
		popoverTarget: null,
		popoverTargetAction: null,
		poster: null,
		preload: null,
		readOnly: K,
		referrerPolicy: null,
		rel: N_,
		required: K,
		reversed: K,
		rows: q,
		rowSpan: q,
		sandbox: N_,
		scope: null,
		scoped: K,
		seamless: K,
		selected: K,
		shadowRootClonable: K,
		shadowRootCustomElementRegistry: K,
		shadowRootDelegatesFocus: K,
		shadowRootMode: null,
		shadowRootSerializable: K,
		shape: null,
		size: q,
		sizes: null,
		slot: null,
		span: q,
		spellCheck: j_,
		src: null,
		srcDoc: null,
		srcLang: null,
		srcSet: null,
		start: q,
		step: null,
		style: null,
		tabIndex: q,
		target: null,
		title: null,
		translate: null,
		type: null,
		typeMustMatch: K,
		useMap: null,
		value: j_,
		width: q,
		wrap: null,
		writingSuggestions: null,
		align: null,
		aLink: null,
		archive: N_,
		axis: null,
		background: null,
		bgColor: null,
		border: q,
		borderColor: null,
		bottomMargin: q,
		cellPadding: null,
		cellSpacing: null,
		char: null,
		charOff: null,
		classId: null,
		clear: null,
		code: null,
		codeBase: null,
		codeType: null,
		color: null,
		compact: K,
		declare: K,
		event: null,
		face: null,
		frame: null,
		frameBorder: null,
		hSpace: q,
		leftMargin: q,
		link: null,
		longDesc: null,
		lowSrc: null,
		marginHeight: q,
		marginWidth: q,
		noResize: K,
		noHref: K,
		noShade: K,
		noWrap: K,
		object: null,
		profile: null,
		prompt: null,
		rev: null,
		rightMargin: q,
		rules: null,
		scheme: null,
		scrolling: j_,
		standby: null,
		summary: null,
		text: null,
		topMargin: q,
		valueType: null,
		version: null,
		vAlign: null,
		vLink: null,
		vSpace: q,
		allowTransparency: null,
		autoCorrect: null,
		autoSave: null,
		credentialless: K,
		disablePictureInPicture: K,
		disableRemotePlayback: K,
		exportParts: P_,
		part: N_,
		prefix: null,
		property: null,
		results: q,
		security: null,
		unselectable: null
	},
	space: "html",
	transform: U_
}), G_ = B_({
	attributes: {
		accentHeight: "accent-height",
		alignmentBaseline: "alignment-baseline",
		arabicForm: "arabic-form",
		baselineShift: "baseline-shift",
		capHeight: "cap-height",
		className: "class",
		clipPath: "clip-path",
		clipRule: "clip-rule",
		colorInterpolation: "color-interpolation",
		colorInterpolationFilters: "color-interpolation-filters",
		colorProfile: "color-profile",
		colorRendering: "color-rendering",
		crossOrigin: "crossorigin",
		dataType: "datatype",
		dominantBaseline: "dominant-baseline",
		enableBackground: "enable-background",
		fillOpacity: "fill-opacity",
		fillRule: "fill-rule",
		floodColor: "flood-color",
		floodOpacity: "flood-opacity",
		fontFamily: "font-family",
		fontSize: "font-size",
		fontSizeAdjust: "font-size-adjust",
		fontStretch: "font-stretch",
		fontStyle: "font-style",
		fontVariant: "font-variant",
		fontWeight: "font-weight",
		glyphName: "glyph-name",
		glyphOrientationHorizontal: "glyph-orientation-horizontal",
		glyphOrientationVertical: "glyph-orientation-vertical",
		hrefLang: "hreflang",
		horizAdvX: "horiz-adv-x",
		horizOriginX: "horiz-origin-x",
		horizOriginY: "horiz-origin-y",
		imageRendering: "image-rendering",
		letterSpacing: "letter-spacing",
		lightingColor: "lighting-color",
		markerEnd: "marker-end",
		markerMid: "marker-mid",
		markerStart: "marker-start",
		maskType: "mask-type",
		navDown: "nav-down",
		navDownLeft: "nav-down-left",
		navDownRight: "nav-down-right",
		navLeft: "nav-left",
		navNext: "nav-next",
		navPrev: "nav-prev",
		navRight: "nav-right",
		navUp: "nav-up",
		navUpLeft: "nav-up-left",
		navUpRight: "nav-up-right",
		onAbort: "onabort",
		onActivate: "onactivate",
		onAfterPrint: "onafterprint",
		onBeforePrint: "onbeforeprint",
		onBegin: "onbegin",
		onCancel: "oncancel",
		onCanPlay: "oncanplay",
		onCanPlayThrough: "oncanplaythrough",
		onChange: "onchange",
		onClick: "onclick",
		onClose: "onclose",
		onCopy: "oncopy",
		onCueChange: "oncuechange",
		onCut: "oncut",
		onDblClick: "ondblclick",
		onDrag: "ondrag",
		onDragEnd: "ondragend",
		onDragEnter: "ondragenter",
		onDragExit: "ondragexit",
		onDragLeave: "ondragleave",
		onDragOver: "ondragover",
		onDragStart: "ondragstart",
		onDrop: "ondrop",
		onDurationChange: "ondurationchange",
		onEmptied: "onemptied",
		onEnd: "onend",
		onEnded: "onended",
		onError: "onerror",
		onFocus: "onfocus",
		onFocusIn: "onfocusin",
		onFocusOut: "onfocusout",
		onHashChange: "onhashchange",
		onInput: "oninput",
		onInvalid: "oninvalid",
		onKeyDown: "onkeydown",
		onKeyPress: "onkeypress",
		onKeyUp: "onkeyup",
		onLoad: "onload",
		onLoadedData: "onloadeddata",
		onLoadedMetadata: "onloadedmetadata",
		onLoadStart: "onloadstart",
		onMessage: "onmessage",
		onMouseDown: "onmousedown",
		onMouseEnter: "onmouseenter",
		onMouseLeave: "onmouseleave",
		onMouseMove: "onmousemove",
		onMouseOut: "onmouseout",
		onMouseOver: "onmouseover",
		onMouseUp: "onmouseup",
		onMouseWheel: "onmousewheel",
		onOffline: "onoffline",
		onOnline: "ononline",
		onPageHide: "onpagehide",
		onPageShow: "onpageshow",
		onPaste: "onpaste",
		onPause: "onpause",
		onPlay: "onplay",
		onPlaying: "onplaying",
		onPopState: "onpopstate",
		onProgress: "onprogress",
		onRateChange: "onratechange",
		onRepeat: "onrepeat",
		onReset: "onreset",
		onResize: "onresize",
		onScroll: "onscroll",
		onSeeked: "onseeked",
		onSeeking: "onseeking",
		onSelect: "onselect",
		onShow: "onshow",
		onStalled: "onstalled",
		onStorage: "onstorage",
		onSubmit: "onsubmit",
		onSuspend: "onsuspend",
		onTimeUpdate: "ontimeupdate",
		onToggle: "ontoggle",
		onUnload: "onunload",
		onVolumeChange: "onvolumechange",
		onWaiting: "onwaiting",
		onZoom: "onzoom",
		overlinePosition: "overline-position",
		overlineThickness: "overline-thickness",
		paintOrder: "paint-order",
		panose1: "panose-1",
		pointerEvents: "pointer-events",
		referrerPolicy: "referrerpolicy",
		renderingIntent: "rendering-intent",
		shapeRendering: "shape-rendering",
		stopColor: "stop-color",
		stopOpacity: "stop-opacity",
		strikethroughPosition: "strikethrough-position",
		strikethroughThickness: "strikethrough-thickness",
		strokeDashArray: "stroke-dasharray",
		strokeDashOffset: "stroke-dashoffset",
		strokeLineCap: "stroke-linecap",
		strokeLineJoin: "stroke-linejoin",
		strokeMiterLimit: "stroke-miterlimit",
		strokeOpacity: "stroke-opacity",
		strokeWidth: "stroke-width",
		tabIndex: "tabindex",
		textAnchor: "text-anchor",
		textDecoration: "text-decoration",
		textRendering: "text-rendering",
		transformOrigin: "transform-origin",
		typeOf: "typeof",
		underlinePosition: "underline-position",
		underlineThickness: "underline-thickness",
		unicodeBidi: "unicode-bidi",
		unicodeRange: "unicode-range",
		unitsPerEm: "units-per-em",
		vAlphabetic: "v-alphabetic",
		vHanging: "v-hanging",
		vIdeographic: "v-ideographic",
		vMathematical: "v-mathematical",
		vectorEffect: "vector-effect",
		vertAdvY: "vert-adv-y",
		vertOriginX: "vert-origin-x",
		vertOriginY: "vert-origin-y",
		wordSpacing: "word-spacing",
		writingMode: "writing-mode",
		xHeight: "x-height",
		playbackOrder: "playbackorder",
		timelineBegin: "timelinebegin"
	},
	properties: {
		about: F_,
		accentHeight: q,
		accumulate: null,
		additive: null,
		alignmentBaseline: null,
		alphabetic: q,
		amplitude: q,
		arabicForm: null,
		ascent: q,
		attributeName: null,
		attributeType: null,
		azimuth: q,
		bandwidth: null,
		baselineShift: null,
		baseFrequency: null,
		baseProfile: null,
		bbox: null,
		begin: null,
		bias: q,
		by: null,
		calcMode: null,
		capHeight: q,
		className: N_,
		clip: null,
		clipPath: null,
		clipPathUnits: null,
		clipRule: null,
		color: null,
		colorInterpolation: null,
		colorInterpolationFilters: null,
		colorProfile: null,
		colorRendering: null,
		content: null,
		contentScriptType: null,
		contentStyleType: null,
		crossOrigin: null,
		cursor: null,
		cx: null,
		cy: null,
		d: null,
		dataType: null,
		defaultAction: null,
		descent: q,
		diffuseConstant: q,
		direction: null,
		display: null,
		dur: null,
		divisor: q,
		dominantBaseline: null,
		download: K,
		dx: null,
		dy: null,
		edgeMode: null,
		editable: null,
		elevation: q,
		enableBackground: null,
		end: null,
		event: null,
		exponent: q,
		externalResourcesRequired: null,
		fill: null,
		fillOpacity: q,
		fillRule: null,
		filter: null,
		filterRes: null,
		filterUnits: null,
		floodColor: null,
		floodOpacity: null,
		focusable: null,
		focusHighlight: null,
		fontFamily: null,
		fontSize: null,
		fontSizeAdjust: null,
		fontStretch: null,
		fontStyle: null,
		fontVariant: null,
		fontWeight: null,
		format: null,
		fr: null,
		from: null,
		fx: null,
		fy: null,
		g1: P_,
		g2: P_,
		glyphName: P_,
		glyphOrientationHorizontal: null,
		glyphOrientationVertical: null,
		glyphRef: null,
		gradientTransform: null,
		gradientUnits: null,
		handler: null,
		hanging: q,
		hatchContentUnits: null,
		hatchUnits: null,
		height: null,
		href: null,
		hrefLang: null,
		horizAdvX: q,
		horizOriginX: q,
		horizOriginY: q,
		id: null,
		ideographic: q,
		imageRendering: null,
		initialVisibility: null,
		in: null,
		in2: null,
		intercept: q,
		k: q,
		k1: q,
		k2: q,
		k3: q,
		k4: q,
		kernelMatrix: F_,
		kernelUnitLength: null,
		keyPoints: null,
		keySplines: null,
		keyTimes: null,
		kerning: null,
		lang: null,
		lengthAdjust: null,
		letterSpacing: null,
		lightingColor: null,
		limitingConeAngle: q,
		local: null,
		markerEnd: null,
		markerMid: null,
		markerStart: null,
		markerHeight: null,
		markerUnits: null,
		markerWidth: null,
		mask: null,
		maskContentUnits: null,
		maskType: null,
		maskUnits: null,
		mathematical: null,
		max: null,
		media: null,
		mediaCharacterEncoding: null,
		mediaContentEncodings: null,
		mediaSize: q,
		mediaTime: null,
		method: null,
		min: null,
		mode: null,
		name: null,
		navDown: null,
		navDownLeft: null,
		navDownRight: null,
		navLeft: null,
		navNext: null,
		navPrev: null,
		navRight: null,
		navUp: null,
		navUpLeft: null,
		navUpRight: null,
		numOctaves: null,
		observer: null,
		offset: null,
		onAbort: null,
		onActivate: null,
		onAfterPrint: null,
		onBeforePrint: null,
		onBegin: null,
		onCancel: null,
		onCanPlay: null,
		onCanPlayThrough: null,
		onChange: null,
		onClick: null,
		onClose: null,
		onCopy: null,
		onCueChange: null,
		onCut: null,
		onDblClick: null,
		onDrag: null,
		onDragEnd: null,
		onDragEnter: null,
		onDragExit: null,
		onDragLeave: null,
		onDragOver: null,
		onDragStart: null,
		onDrop: null,
		onDurationChange: null,
		onEmptied: null,
		onEnd: null,
		onEnded: null,
		onError: null,
		onFocus: null,
		onFocusIn: null,
		onFocusOut: null,
		onHashChange: null,
		onInput: null,
		onInvalid: null,
		onKeyDown: null,
		onKeyPress: null,
		onKeyUp: null,
		onLoad: null,
		onLoadedData: null,
		onLoadedMetadata: null,
		onLoadStart: null,
		onMessage: null,
		onMouseDown: null,
		onMouseEnter: null,
		onMouseLeave: null,
		onMouseMove: null,
		onMouseOut: null,
		onMouseOver: null,
		onMouseUp: null,
		onMouseWheel: null,
		onOffline: null,
		onOnline: null,
		onPageHide: null,
		onPageShow: null,
		onPaste: null,
		onPause: null,
		onPlay: null,
		onPlaying: null,
		onPopState: null,
		onProgress: null,
		onRateChange: null,
		onRepeat: null,
		onReset: null,
		onResize: null,
		onScroll: null,
		onSeeked: null,
		onSeeking: null,
		onSelect: null,
		onShow: null,
		onStalled: null,
		onStorage: null,
		onSubmit: null,
		onSuspend: null,
		onTimeUpdate: null,
		onToggle: null,
		onUnload: null,
		onVolumeChange: null,
		onWaiting: null,
		onZoom: null,
		opacity: null,
		operator: null,
		order: null,
		orient: null,
		orientation: null,
		origin: null,
		overflow: null,
		overlay: null,
		overlinePosition: q,
		overlineThickness: q,
		paintOrder: null,
		panose1: null,
		path: null,
		pathLength: q,
		patternContentUnits: null,
		patternTransform: null,
		patternUnits: null,
		phase: null,
		ping: N_,
		pitch: null,
		playbackOrder: null,
		pointerEvents: null,
		points: null,
		pointsAtX: q,
		pointsAtY: q,
		pointsAtZ: q,
		preserveAlpha: null,
		preserveAspectRatio: null,
		primitiveUnits: null,
		propagate: null,
		property: F_,
		r: null,
		radius: null,
		referrerPolicy: null,
		refX: null,
		refY: null,
		rel: F_,
		rev: F_,
		renderingIntent: null,
		repeatCount: null,
		repeatDur: null,
		requiredExtensions: F_,
		requiredFeatures: F_,
		requiredFonts: F_,
		requiredFormats: F_,
		resource: null,
		restart: null,
		result: null,
		rotate: null,
		rx: null,
		ry: null,
		scale: null,
		seed: null,
		shapeRendering: null,
		side: null,
		slope: null,
		snapshotTime: null,
		specularConstant: q,
		specularExponent: q,
		spreadMethod: null,
		spacing: null,
		startOffset: null,
		stdDeviation: null,
		stemh: null,
		stemv: null,
		stitchTiles: null,
		stopColor: null,
		stopOpacity: null,
		strikethroughPosition: q,
		strikethroughThickness: q,
		string: null,
		stroke: null,
		strokeDashArray: F_,
		strokeDashOffset: null,
		strokeLineCap: null,
		strokeLineJoin: null,
		strokeMiterLimit: q,
		strokeOpacity: q,
		strokeWidth: null,
		style: null,
		surfaceScale: q,
		syncBehavior: null,
		syncBehaviorDefault: null,
		syncMaster: null,
		syncTolerance: null,
		syncToleranceDefault: null,
		systemLanguage: F_,
		tabIndex: q,
		tableValues: null,
		target: null,
		targetX: q,
		targetY: q,
		textAnchor: null,
		textDecoration: null,
		textRendering: null,
		textLength: null,
		timelineBegin: null,
		title: null,
		transformBehavior: null,
		type: null,
		typeOf: F_,
		to: null,
		transform: null,
		transformOrigin: null,
		u1: null,
		u2: null,
		underlinePosition: q,
		underlineThickness: q,
		unicode: null,
		unicodeBidi: null,
		unicodeRange: null,
		unitsPerEm: q,
		values: null,
		vAlphabetic: q,
		vMathematical: q,
		vectorEffect: null,
		vHanging: q,
		vIdeographic: q,
		version: null,
		vertAdvY: q,
		vertOriginX: q,
		vertOriginY: q,
		viewBox: null,
		viewTarget: null,
		visibility: null,
		width: null,
		widths: null,
		wordSpacing: null,
		writingMode: null,
		x: null,
		x1: null,
		x2: null,
		xChannelSelector: null,
		xHeight: q,
		y: null,
		y1: null,
		y2: null,
		yChannelSelector: null,
		z: null,
		zoomAndPan: null
	},
	space: "svg",
	transform: H_
}), K_ = B_({
	properties: {
		xLinkActuate: null,
		xLinkArcRole: null,
		xLinkHref: null,
		xLinkRole: null,
		xLinkShow: null,
		xLinkTitle: null,
		xLinkType: null
	},
	space: "xlink",
	transform(e, t) {
		return "xlink:" + t.slice(5).toLowerCase();
	}
}), q_ = B_({
	attributes: { xmlnsxlink: "xmlns:xlink" },
	properties: {
		xmlnsXLink: null,
		xmlns: null
	},
	space: "xmlns",
	transform: U_
}), J_ = B_({
	properties: {
		xmlBase: null,
		xmlLang: null,
		xmlSpace: null
	},
	space: "xml",
	transform(e, t) {
		return "xml:" + t.slice(3).toLowerCase();
	}
}), Y_ = {
	classId: "classID",
	dataType: "datatype",
	itemId: "itemID",
	strokeDashArray: "strokeDasharray",
	strokeDashOffset: "strokeDashoffset",
	strokeLineCap: "strokeLinecap",
	strokeLineJoin: "strokeLinejoin",
	strokeMiterLimit: "strokeMiterlimit",
	typeOf: "typeof",
	xLinkActuate: "xlinkActuate",
	xLinkArcRole: "xlinkArcrole",
	xLinkHref: "xlinkHref",
	xLinkRole: "xlinkRole",
	xLinkShow: "xlinkShow",
	xLinkTitle: "xlinkTitle",
	xLinkType: "xlinkType",
	xmlnsXLink: "xmlnsXlink"
}, X_ = /[A-Z]/g, Z_ = /-[a-z]/g, Q_ = /^data[-\w.:]+$/i;
function $_(e, t) {
	let n = D_(t), r = t, i = O_;
	if (n in e.normal) return e.property[e.normal[n]];
	if (n.length > 4 && n.slice(0, 4) === "data" && Q_.test(t)) {
		if (t.charAt(4) === "-") {
			let e = t.slice(5).replace(Z_, tv);
			r = "data" + e.charAt(0).toUpperCase() + e.slice(1);
		} else {
			let e = t.slice(4);
			if (!Z_.test(e)) {
				let n = e.replace(X_, ev);
				n.charAt(0) !== "-" && (n = "-" + n), t = "data" + n;
			}
		}
		i = R_;
	}
	return new i(r, t);
}
function ev(e) {
	return "-" + e.toLowerCase();
}
function tv(e) {
	return e.charAt(1).toUpperCase();
}
// node_modules/hast-util-to-jsx-runtime/node_modules/property-information/index.js
var nv = E_([
	V_,
	W_,
	K_,
	q_,
	J_
], "html"), rv = E_([
	V_,
	G_,
	K_,
	q_,
	J_
], "svg"), iv = /\/\*(?:[^*]|\*(?!\/))*\*\//g, av = /\n/g, ov = /^\s*/, sv = /^(\*?[-#/*\\\w]+(\[[0-9a-z_-]+\])?)\s*/, cv = /^:\s*/, lv = /^((?:'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|url\((?:'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|[^)]*)\)|[^};])+)/, uv = /^[;\s]*/, dv = "\n", fv = "/", pv = "*", mv = "", hv = "comment", gv = "declaration";
function _v(e, t) {
	if (typeof e != "string") throw TypeError("First argument must be a string");
	if (!e) return [];
	t ||= {};
	var n = 1, r = 1;
	function i(e) {
		var t = e.match(av);
		t && (n += t.length);
		var i = e.lastIndexOf(dv);
		r = ~i ? e.length - i : r + e.length;
	}
	function a() {
		var e = {
			line: n,
			column: r
		};
		return function(t) {
			return t.position = new o(e), l(), t;
		};
	}
	function o(e) {
		this.start = e, this.end = {
			line: n,
			column: r
		}, this.source = t.source;
	}
	o.prototype.content = e;
	function s(i) {
		var a = /* @__PURE__ */ Error(t.source + ":" + n + ":" + r + ": " + i);
		if (a.reason = i, a.filename = t.source, a.line = n, a.column = r, a.source = e, !t.silent) throw a;
	}
	function c(t) {
		var n = t.exec(e);
		if (n) {
			var r = n[0];
			return i(r), e = e.slice(r.length), n;
		}
	}
	function l() {
		c(ov);
	}
	function u(e) {
		for (var t; t = d();) e.push(t);
		return e;
	}
	function d() {
		var t = a();
		if (fv == e.charAt(0) && pv == e.charAt(1)) {
			for (var n = 2; mv != e.charAt(n) && (pv != e.charAt(n) || fv != e.charAt(n + 1));) ++n;
			if (n += 2, mv === e.charAt(n - 1)) return s("End of comment missing");
			var o = e.slice(2, n - 2);
			return r += 2, i(o), e = e.slice(n), r += 2, t({
				type: hv,
				comment: o
			});
		}
	}
	function f() {
		var e = a(), t = c(sv);
		if (t) {
			if (d(), !c(cv)) return s("property missing ':'");
			var n = c(lv), r = e({
				type: gv,
				property: t[0].replace(iv, mv).trim(),
				value: n ? n[0].replace(iv, mv).trim() : mv
			});
			return c(uv), r;
		}
	}
	function p() {
		var e = [];
		u(e);
		for (var t; t = f();) e.push(t), u(e);
		return e;
	}
	return l(), p();
}
// node_modules/hast-util-to-jsx-runtime/node_modules/style-to-object/esm/index.mjs
function vv(e, t) {
	let n = null;
	if (!e || typeof e != "string") return n;
	let r = _v(e), i = typeof t == "function";
	return r.forEach((e) => {
		if (e.type !== "declaration") return;
		let { property: r, value: a } = e;
		i ? t(r, a, e) : a && (n ??= {}, n[r] = a);
	}), n;
}
var yv = bv("start");
function bv(e) {
	return t;
	function t(t) {
		let n = t && t.position && t.position[e] || {};
		if (typeof n.line == "number" && n.line > 0 && typeof n.column == "number" && n.column > 0) return {
			line: n.line,
			column: n.column,
			offset: typeof n.offset == "number" && n.offset > -1 ? n.offset : void 0
		};
	}
}
// node_modules/vfile-message/node_modules/unist-util-stringify-position/lib/index.js
function xv(e) {
	return !e || typeof e != "object" ? "" : "position" in e || "type" in e ? Cv(e.position) : "start" in e || "end" in e ? Cv(e) : "line" in e || "column" in e ? Sv(e) : "";
}
function Sv(e) {
	return wv(e && e.line) + ":" + wv(e && e.column);
}
function Cv(e) {
	return Sv(e && e.start) + "-" + Sv(e && e.end);
}
function wv(e) {
	return e && typeof e == "number" ? e : 1;
}
// node_modules/vfile-message/lib/index.js
var Tv = class extends Error {
	constructor(e, t, n) {
		super(), typeof t == "string" && (n = t, t = void 0);
		let r = "", i = {}, a = !1;
		if (t && (i = "line" in t && "column" in t || "start" in t && "end" in t ? { place: t } : "type" in t ? {
			ancestors: [t],
			place: t.position
		} : { ...t }), typeof e == "string" ? r = e : !i.cause && e && (a = !0, r = e.message, i.cause = e), !i.ruleId && !i.source && typeof n == "string") {
			let e = n.indexOf(":");
			e === -1 ? i.ruleId = n : (i.source = n.slice(0, e), i.ruleId = n.slice(e + 1));
		}
		if (!i.place && i.ancestors && i.ancestors) {
			let e = i.ancestors[i.ancestors.length - 1];
			e && (i.place = e.position);
		}
		let o = i.place && "start" in i.place ? i.place.start : i.place;
		this.ancestors = i.ancestors || void 0, this.cause = i.cause || void 0, this.column = o ? o.column : void 0, this.fatal = void 0, this.file = "", this.message = r, this.line = o ? o.line : void 0, this.name = xv(i.place) || "1:1", this.place = i.place || void 0, this.reason = this.message, this.ruleId = i.ruleId || void 0, this.source = i.source || void 0, this.stack = a && i.cause && typeof i.cause.stack == "string" ? i.cause.stack : "", this.actual = void 0, this.expected = void 0, this.note = void 0, this.url = void 0;
	}
};
Tv.prototype.file = "", Tv.prototype.name = "", Tv.prototype.reason = "", Tv.prototype.message = "", Tv.prototype.stack = "", Tv.prototype.column = void 0, Tv.prototype.line = void 0, Tv.prototype.ancestors = void 0, Tv.prototype.cause = void 0, Tv.prototype.fatal = void 0, Tv.prototype.place = void 0, Tv.prototype.ruleId = void 0, Tv.prototype.source = void 0;
// node_modules/hast-util-to-jsx-runtime/lib/index.js
var Ev = {}.hasOwnProperty, Dv = /* @__PURE__ */ new Map(), Ov = /[A-Z]/g, kv = /-([a-z])/g, Av = /* @__PURE__ */ new Set([
	"table",
	"tbody",
	"thead",
	"tfoot",
	"tr"
]), jv = /* @__PURE__ */ new Set(["td", "th"]), Mv = "https://github.com/syntax-tree/hast-util-to-jsx-runtime";
function Nv(e, t) {
	if (!t || t.Fragment === void 0) throw TypeError("Expected `Fragment` in options");
	let n = t.filePath || void 0, r;
	if (t.development) {
		if (typeof t.jsxDEV != "function") throw TypeError("Expected `jsxDEV` in options when `development: true`");
		r = Wv(n, t.jsxDEV);
	} else {
		if (typeof t.jsx != "function") throw TypeError("Expected `jsx` in production options");
		if (typeof t.jsxs != "function") throw TypeError("Expected `jsxs` in production options");
		r = Uv(n, t.jsx, t.jsxs);
	}
	let i = {
		Fragment: t.Fragment,
		ancestors: [],
		components: t.components || {},
		create: r,
		elementAttributeNameCase: t.elementAttributeNameCase || "react",
		evaluater: t.createEvaluater ? t.createEvaluater() : void 0,
		filePath: n,
		ignoreInvalidStyle: t.ignoreInvalidStyle || !1,
		passKeys: t.passKeys !== !1,
		passNode: t.passNode || !1,
		schema: t.space === "svg" ? rv : nv,
		stylePropertyNameCase: t.stylePropertyNameCase || "dom",
		tableCellAlignToStyle: t.tableCellAlignToStyle !== !1
	}, a = Pv(i, e, void 0);
	return a && typeof a != "string" ? a : i.create(e, i.Fragment, { children: a || void 0 }, void 0);
}
function Pv(e, t, n) {
	if (t.type === "element") return Fv(e, t, n);
	if (t.type === "mdxFlowExpression" || t.type === "mdxTextExpression") return Iv(e, t);
	if (t.type === "mdxJsxFlowElement" || t.type === "mdxJsxTextElement") return Rv(e, t, n);
	if (t.type === "mdxjsEsm") return Lv(e, t);
	if (t.type === "root") return zv(e, t, n);
	if (t.type === "text") return Bv(e, t);
}
function Fv(e, t, n) {
	let r = e.schema, i = r;
	t.tagName.toLowerCase() === "svg" && r.space === "html" && (i = rv, e.schema = i), e.ancestors.push(t);
	let a = Xv(e, t.tagName, !1), o = Gv(e, t), s = qv(e, t);
	return Av.has(t.tagName) && (s = s.filter(function(e) {
		return typeof e != "string" || !C_(e);
	})), Vv(e, o, a, t), Hv(o, s), e.ancestors.pop(), e.schema = r, e.create(t, a, o, n);
}
function Iv(e, t) {
	if (t.data && t.data.estree && e.evaluater) {
		let n = t.data.estree.body[0];
		return n.type, e.evaluater.evaluateExpression(n.expression);
	}
	Zv(e, t.position);
}
function Lv(e, t) {
	if (t.data && t.data.estree && e.evaluater) return e.evaluater.evaluateProgram(t.data.estree);
	Zv(e, t.position);
}
function Rv(e, t, n) {
	let r = e.schema, i = r;
	t.name === "svg" && r.space === "html" && (i = rv, e.schema = i), e.ancestors.push(t);
	let a = t.name === null ? e.Fragment : Xv(e, t.name, !0), o = Kv(e, t), s = qv(e, t);
	return Vv(e, o, a, t), Hv(o, s), e.ancestors.pop(), e.schema = r, e.create(t, a, o, n);
}
function zv(e, t, n) {
	let r = {};
	return Hv(r, qv(e, t)), e.create(t, e.Fragment, r, n);
}
function Bv(e, t) {
	return t.value;
}
function Vv(e, t, n, r) {
	typeof n != "string" && n !== e.Fragment && e.passNode && (t.node = r);
}
function Hv(e, t) {
	if (t.length > 0) {
		let n = t.length > 1 ? t : t[0];
		n && (e.children = n);
	}
}
function Uv(e, t, n) {
	return r;
	function r(e, r, i, a) {
		let o = Array.isArray(i.children) ? n : t;
		return a ? o(r, i, a) : o(r, i);
	}
}
function Wv(e, t) {
	return n;
	function n(n, r, i, a) {
		let o = Array.isArray(i.children), s = yv(n);
		return t(r, i, a, o, {
			columnNumber: s ? s.column - 1 : void 0,
			fileName: e,
			lineNumber: s ? s.line : void 0
		}, void 0);
	}
}
function Gv(e, t) {
	let n = {}, r, i;
	for (i in t.properties) if (i !== "children" && Ev.call(t.properties, i)) {
		let a = Jv(e, i, t.properties[i]);
		if (a) {
			let [i, o] = a;
			e.tableCellAlignToStyle && i === "align" && typeof o == "string" && jv.has(t.tagName) ? r = o : n[i] = o;
		}
	}
	if (r) {
		let t = n.style ||= {};
		t[e.stylePropertyNameCase === "css" ? "text-align" : "textAlign"] = r;
	}
	return n;
}
function Kv(e, t) {
	let n = {};
	for (let r of t.attributes) if (r.type === "mdxJsxExpressionAttribute") {
		if (r.data && r.data.estree && e.evaluater) {
			let t = r.data.estree.body[0];
			t.type;
			let i = t.expression;
			i.type;
			let a = i.properties[0];
			a.type, Object.assign(n, e.evaluater.evaluateExpression(a.argument));
		} else Zv(e, t.position);
	} else {
		let { name: i } = r, a;
		if (r.value && typeof r.value == "object") {
			if (r.value.data && r.value.data.estree && e.evaluater) {
				let t = r.value.data.estree.body[0];
				t.type, a = e.evaluater.evaluateExpression(t.expression);
			} else Zv(e, t.position);
		} else a = r.value === null || r.value;
		n[i] = a;
	}
	return n;
}
function qv(e, t) {
	let n = [], r = -1, i = e.passKeys ? /* @__PURE__ */ new Map() : Dv;
	for (; ++r < t.children.length;) {
		let a = t.children[r], o;
		if (e.passKeys) {
			let e = a.type === "element" ? a.tagName : a.type === "mdxJsxFlowElement" || a.type === "mdxJsxTextElement" ? a.name : void 0;
			if (e) {
				let t = i.get(e) || 0;
				o = e + "-" + t, i.set(e, t + 1);
			}
		}
		let s = Pv(e, a, o);
		s !== void 0 && n.push(s);
	}
	return n;
}
function Jv(e, t, n) {
	if (n == null || typeof n == "number" && Number.isNaN(n)) return;
	let r = $_(e.schema, t);
	return Array.isArray(n) && (n = r.commaSeparated ? He(n) : Ke(n)), r.property === "style" ? ["style", typeof n == "object" ? e.stylePropertyNameCase === "dom" ? n : Qv(n) : Yv(e, String(n))] : [e.elementAttributeNameCase === "react" && r.space ? Y_[r.property] || r.property : r.attribute, n];
}
function Yv(e, t) {
	let n = {};
	try {
		vv(t, function(t, r) {
			if (t && r) {
				let i = t;
				i.slice(0, 2) !== "--" && (i = i.toLowerCase(), e.stylePropertyNameCase === "dom" && (i.slice(0, 4) === "-ms-" && (i = i.slice(1)), i = i.replace(kv, ty))), n[i] = r;
			}
		});
	} catch (t) {
		if (e.ignoreInvalidStyle) return {};
		let n = t, r = new Tv("Cannot parse `style` attribute", {
			ancestors: e.ancestors,
			cause: n,
			ruleId: "style",
			source: "hast-util-to-jsx-runtime"
		});
		throw r.file = e.filePath || void 0, r.url = Mv + "#cannot-parse-style-attribute", r;
	}
	return n;
}
function Xv(e, t, n) {
	let r;
	if (!n) r = {
		type: "Literal",
		value: t
	};
	else if (t.includes(".")) {
		let e = t.split("."), n = -1, i;
		for (; ++n < e.length;) {
			let t = x_(e[n]) ? {
				type: "Identifier",
				name: e[n]
			} : {
				type: "Literal",
				value: e[n]
			};
			i = i ? {
				type: "MemberExpression",
				object: i,
				property: t,
				computed: !!(n && t.type === "Literal"),
				optional: !1
			} : t;
		}
		r = i;
	} else r = x_(t) && !/^[a-z]/.test(t) ? {
		type: "Identifier",
		name: t
	} : {
		type: "Literal",
		value: t
	};
	if (r.type === "Literal") {
		let t = r.value;
		return Ev.call(e.components, t) ? e.components[t] : t;
	}
	if (e.evaluater) return e.evaluater.evaluateExpression(r);
	Zv(e);
}
function Zv(e, t) {
	let n = new Tv("Cannot handle MDX estrees without `createEvaluater`", {
		ancestors: e.ancestors,
		place: t,
		ruleId: "mdx-estree",
		source: "hast-util-to-jsx-runtime"
	});
	throw n.file = e.filePath || void 0, n.url = Mv + "#cannot-handle-mdx-estrees-without-createevaluater", n;
}
function Qv(e) {
	let t = {}, n;
	for (n in e) Ev.call(e, n) && (t[$v(n)] = e[n]);
	return t;
}
function $v(e) {
	if (e.slice(0, 2) === "--") return e;
	let t = e.replace(Ov, ey);
	return t.slice(0, 3) === "ms-" && (t = "-" + t), t;
}
function ey(e) {
	return "-" + e.toLowerCase();
}
function ty(e, t) {
	return t.toUpperCase();
}
// node_modules/streamdown/node_modules/mdast-util-to-string/lib/index.js
var ny = {};
function ry(e, t) {
	let n = t || ny;
	return iy(e, typeof n.includeImageAlt != "boolean" || n.includeImageAlt, typeof n.includeHtml != "boolean" || n.includeHtml);
}
function iy(e, t, n) {
	if (oy(e)) {
		if ("value" in e) return e.type === "html" && !n ? "" : e.value;
		if (t && "alt" in e && e.alt) return e.alt;
		if ("children" in e) return ay(e.children, t, n);
	}
	return Array.isArray(e) ? ay(e, t, n) : "";
}
function ay(e, t, n) {
	let r = [], i = -1;
	for (; ++i < e.length;) r[i] = iy(e[i], t, n);
	return r.join("");
}
function oy(e) {
	return !!(e && typeof e == "object");
}
// node_modules/streamdown/node_modules/micromark-util-combine-extensions/index.js
var sy = {}.hasOwnProperty;
function cy(e) {
	let t = {}, n = -1;
	for (; ++n < e.length;) ly(t, e[n]);
	return t;
}
function ly(e, t) {
	let n;
	for (n in t) {
		let r = (sy.call(e, n) ? e[n] : void 0) || (e[n] = {}), i = t[n], a;
		if (i) for (a in i) {
			sy.call(r, a) || (r[a] = []);
			let e = i[a];
			uy(r[a], Array.isArray(e) ? e : e ? [e] : []);
		}
	}
}
function uy(e, t) {
	let n = -1, r = [];
	for (; ++n < t.length;) (t[n].add === "after" ? e : r).push(t[n]);
	Fl(e, 0, 0, r);
}
// node_modules/streamdown/node_modules/micromark-util-decode-numeric-character-reference/index.js
function dy(e, t) {
	let n = Number.parseInt(e, t);
	return n < 9 || n === 11 || n > 13 && n < 32 || n > 126 && n < 160 || n > 55295 && n < 57344 || n > 64975 && n < 65008 || (n & 65535) == 65535 || (n & 65535) == 65534 || n > 1114111 ? "�" : String.fromCodePoint(n);
}
// node_modules/streamdown/node_modules/micromark-util-normalize-identifier/index.js
function fy(e) {
	return e.replace(/[\t\n\r ]+/g, " ").replace(/^ | $/g, "").toLowerCase().toUpperCase();
}
// node_modules/streamdown/node_modules/micromark-util-character/index.js
var py = Cy(/[A-Za-z]/), my = Cy(/[\dA-Za-z]/), hy = Cy(/[#-'*+\--9=?A-Z^-~]/);
function gy(e) {
	return e !== null && (e < 32 || e === 127);
}
var _y = Cy(/\d/), vy = Cy(/[\dA-Fa-f]/), yy = Cy(/[!-/:-@[-`{-~]/);
function J(e) {
	return e !== null && e < -2;
}
function by(e) {
	return e !== null && (e < 0 || e === 32);
}
function Y(e) {
	return e === -2 || e === -1 || e === 32;
}
var xy = Cy(/\p{P}|\p{S}/u), Sy = Cy(/\s/);
function Cy(e) {
	return t;
	function t(t) {
		return t !== null && t > -1 && e.test(String.fromCharCode(t));
	}
}
// node_modules/streamdown/node_modules/micromark-util-sanitize-uri/index.js
function wy(e) {
	let t = [], n = -1, r = 0, i = 0;
	for (; ++n < e.length;) {
		let a = e.charCodeAt(n), o = "";
		if (a === 37 && my(e.charCodeAt(n + 1)) && my(e.charCodeAt(n + 2))) i = 2;
		else if (a < 128) /[!#$&-;=?-Z_a-z~]/.test(String.fromCharCode(a)) || (o = String.fromCharCode(a));
		else if (a > 55295 && a < 57344) {
			let t = e.charCodeAt(n + 1);
			a < 56320 && t > 56319 && t < 57344 ? (o = String.fromCharCode(a, t), i = 1) : o = "�";
		} else o = String.fromCharCode(a);
		o &&= (t.push(e.slice(r, n), encodeURIComponent(o)), r = n + i + 1, ""), i &&= (n += i, 0);
	}
	return t.join("") + e.slice(r);
}
// node_modules/streamdown/node_modules/micromark-factory-space/index.js
function Ty(e, t, n, r) {
	let i = r ? r - 1 : Infinity, a = 0;
	return o;
	function o(r) {
		return Y(r) ? (e.enter(n), s(r)) : t(r);
	}
	function s(r) {
		return Y(r) && a++ < i ? (e.consume(r), s) : (e.exit(n), t(r));
	}
}
function Ey(e, t, n, r, i, a) {
	let o = 0;
	return s;
	function s(t) {
		return a > 0 && Y(t) ? (e.enter(r), c(t)) : l(t);
	}
	function c(t) {
		return Y(t) && o < a ? (e.consume(t), o++, c) : (e.exit(r), l(t));
	}
	function l(e) {
		return o >= i ? t(e) : n(e);
	}
}
// node_modules/streamdown/node_modules/micromark/lib/initialize/content.js
var Dy = { tokenize: Oy };
function Oy(e) {
	let t = e.attempt(this.parser.constructs.contentInitial, r, i), n;
	return t;
	function r(n) {
		if (n === null) e.consume(n);
		else return e.enter("lineEnding"), e.consume(n), e.exit("lineEnding"), Ty(e, t, "linePrefix");
	}
	function i(t) {
		return e.enter("paragraph"), a(t);
	}
	function a(t) {
		let r = e.enter("chunkText", {
			contentType: "text",
			previous: n
		});
		return n && (n.next = r), n = r, o(t);
	}
	function o(t) {
		if (t === null) e.exit("chunkText"), e.exit("paragraph"), e.consume(t);
		else return J(t) ? (e.consume(t), e.exit("chunkText"), a) : (e.consume(t), o);
	}
}
// node_modules/streamdown/node_modules/micromark/lib/initialize/document.js
var ky = { tokenize: jy }, Ay = { tokenize: My };
function jy(e) {
	let t = this, n = [], r = 0, i, a, o;
	return s;
	function s(i) {
		if (r < n.length) {
			let a = n[r];
			return t.containerState = a[1], e.attempt(a[0].continuation, c, l)(i);
		}
		return l(i);
	}
	function c(e) {
		if (r++, t.containerState._closeFlow) {
			t.containerState._closeFlow = void 0, i && v();
			let n = t.events.length, a = n, o;
			for (; a--;) if (t.events[a][0] === "exit" && t.events[a][1].type === "chunkFlow") {
				o = t.events[a][1].end;
				break;
			}
			_(r);
			let s = n;
			for (; s < t.events.length;) t.events[s][1].end = { ...o }, s++;
			let c = new Dp();
			return c.add(a + 1, 0, t.events.slice(n)), c.add(n, s - n, []), c.consume(t.events), l(e);
		}
		return s(e);
	}
	function l(a) {
		if (r === n.length) {
			if (!i) return f(a);
			if (i.currentConstruct && i.currentConstruct.concrete) return m(a);
			t.interrupt = !(!i.currentConstruct || i._gfmTableDynamicInterruptHack);
		}
		return t.containerState = {}, e.check(Ay, u, d)(a);
	}
	function u(e) {
		return i && v(), _(r), f(e);
	}
	function d(e) {
		return t.parser.lazy[t.now().line] = r !== n.length, o = t.now().offset, m(e);
	}
	function f(n) {
		return t.containerState = {}, e.attempt(Ay, p, m)(n);
	}
	function p(e) {
		return r++, n.push([t.currentConstruct, t.containerState]), f(e);
	}
	function m(n) {
		if (n === null) i && v(), _(0), e.consume(n);
		else return i ||= t.parser.flow(t.now()), e.enter("chunkFlow", {
			_tokenizer: i,
			contentType: "flow",
			previous: a
		}), h(n);
	}
	function h(n) {
		if (n === null) g(e.exit("chunkFlow"), !0), _(0), e.consume(n);
		else return J(n) ? (e.consume(n), g(e.exit("chunkFlow")), r = 0, t.interrupt = void 0, s) : (e.consume(n), h);
	}
	function g(e, n) {
		let s = t.sliceStream(e);
		if (n && s.push(null), e.previous = a, a && (a.next = e), a = e, i.defineSkip(e.start), i.write(s), t.parser.lazy[e.start.line]) {
			let e = i.events.length;
			for (; e--;) if (i.events[e][1].start.offset < o && (!i.events[e][1].end || i.events[e][1].end.offset > o)) return;
			let n = t.events.length, a = n, s, c;
			for (; a--;) if (t.events[a][0] === "exit" && t.events[a][1].type === "chunkFlow") {
				if (s) {
					c = t.events[a][1].end;
					break;
				}
				s = !0;
			}
			for (_(r), e = n; e < t.events.length;) t.events[e][1].end = { ...c }, e++;
			let l = new Dp();
			l.add(a + 1, 0, t.events.slice(n)), l.add(n, e - n, []), l.consume(t.events);
		}
	}
	function _(r) {
		let i = n.length;
		for (; i-- > r;) {
			let r = n[i];
			t.containerState = r[1], r[0].exit.call(t, e);
		}
		n.length = r;
	}
	function v() {
		i.write([null]), a = void 0, i = void 0, t.containerState._closeFlow = void 0;
	}
}
function My(e, t, n) {
	return Ty(e, e.attempt(this.parser.constructs.document, t, n), "linePrefix", this.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4);
}
// node_modules/streamdown/node_modules/micromark-util-classify-character/index.js
function Ny(e) {
	if (e === null || by(e) || Sy(e)) return 1;
	if (xy(e)) return 2;
}
// node_modules/streamdown/node_modules/micromark-core-commonmark/lib/attention.js
var Py = {
	name: "attention",
	resolveAll: Fy,
	tokenize: Iy
};
function Fy(e, t) {
	let n = -1, r;
	for (; ++n < e.length;) if (e[n][0] === "enter" && e[n][1].type === "attentionSequence" && e[n][1]._close) {
		let i = n;
		for (; i--;) if (e[i][0] === "exit" && e[i][1].type === "attentionSequence" && e[i][1]._open && t.sliceSerialize(e[i][1]).charCodeAt(0) === t.sliceSerialize(e[n][1]).charCodeAt(0)) {
			if ((e[i][1]._close || e[n][1]._open) && (e[n][1].end.offset - e[n][1].start.offset) % 3 && !((e[i][1].end.offset - e[i][1].start.offset + e[n][1].end.offset - e[n][1].start.offset) % 3)) continue;
			let a = e[i][1].end.offset - e[i][1].start.offset > 1 && e[n][1].end.offset - e[n][1].start.offset > 1 ? 2 : 1, o = { ...e[i][1].end }, s = { ...e[n][1].start };
			Ly(o, -a), Ly(s, a);
			let c = {
				type: a > 1 ? "strongSequence" : "emphasisSequence",
				start: o,
				end: { ...e[i][1].end }
			}, l = {
				type: a > 1 ? "strongSequence" : "emphasisSequence",
				start: { ...e[n][1].start },
				end: s
			}, u = {
				type: a > 1 ? "strongText" : "emphasisText",
				start: { ...e[i][1].end },
				end: { ...e[n][1].start }
			}, d = {
				type: a > 1 ? "strong" : "emphasis",
				start: { ...c.start },
				end: { ...l.end }
			};
			e[i][1].end = { ...c.start }, e[n][1].start = { ...l.end }, r = [], e[i][1].end.offset - e[i][1].start.offset && (r = Il(r, [[
				"enter",
				e[i][1],
				t
			], [
				"exit",
				e[i][1],
				t
			]])), r = Il(r, [
				[
					"enter",
					d,
					t
				],
				[
					"enter",
					c,
					t
				],
				[
					"exit",
					c,
					t
				],
				[
					"enter",
					u,
					t
				]
			]), r = Il(r, Ll(t.parser.constructs.insideSpan.null, e.slice(i + 1, n), t)), r = Il(r, [
				[
					"exit",
					u,
					t
				],
				[
					"enter",
					l,
					t
				],
				[
					"exit",
					l,
					t
				],
				[
					"exit",
					d,
					t
				]
			]);
			let f = 0;
			e[n][1].end.offset - e[n][1].start.offset && (f = 2, r = Il(r, [[
				"enter",
				e[n][1],
				t
			], [
				"exit",
				e[n][1],
				t
			]])), Fl(e, i - 1, n - i + 3, r), n = i + r.length - f - 2;
			break;
		}
	}
	for (n = -1; ++n < e.length;) e[n][1].type === "attentionSequence" && (e[n][1].type = "data");
	return e;
}
function Iy(e, t) {
	let n = this.parser.constructs.attentionMarkers.null, r = this.previous, i = Ny(r), a;
	return o;
	function o(t) {
		return a = t, e.enter("attentionSequence"), s(t);
	}
	function s(o) {
		if (o === a) return e.consume(o), s;
		let c = e.exit("attentionSequence"), l = Ny(o), u = !l || l === 2 && i || n.includes(o) && o !== 42 && o !== 95, d = !i || i === 2 && l || n.includes(r) && r !== 42 && r !== 95;
		return c._open = !!(a === 42 ? u : u && (i || !d)), c._close = !!(a === 42 ? d : d && (l || !u)), t(o);
	}
}
function Ly(e, t) {
	e.column += t, e.offset += t, e._bufferIndex += t;
}
// node_modules/streamdown/node_modules/micromark-core-commonmark/lib/autolink.js
var Ry = {
	name: "autolink",
	tokenize: zy
};
function zy(e, t, n) {
	let r = 0;
	return i;
	function i(t) {
		return e.enter("autolink"), e.enter("autolinkMarker"), e.consume(t), e.exit("autolinkMarker"), e.enter("autolinkProtocol"), a;
	}
	function a(t) {
		return py(t) ? (e.consume(t), o) : t === 64 ? n(t) : l(t);
	}
	function o(e) {
		return e === 43 || e === 45 || e === 46 || my(e) ? (r = 1, s(e)) : l(e);
	}
	function s(t) {
		return t === 58 ? (e.consume(t), r = 0, c) : (t === 43 || t === 45 || t === 46 || my(t)) && r++ < 32 ? (e.consume(t), s) : (r = 0, l(t));
	}
	function c(r) {
		return r === 62 ? (e.exit("autolinkProtocol"), e.enter("autolinkMarker"), e.consume(r), e.exit("autolinkMarker"), e.exit("autolink"), t) : r === null || r === 32 || r === 60 || gy(r) ? n(r) : (e.consume(r), c);
	}
	function l(t) {
		return t === 64 ? (e.consume(t), u) : hy(t) ? (e.consume(t), l) : n(t);
	}
	function u(e) {
		return my(e) ? d(e) : n(e);
	}
	function d(n) {
		return n === 46 ? (e.consume(n), r = 0, u) : n === 62 ? (e.exit("autolinkProtocol").type = "autolinkEmail", e.enter("autolinkMarker"), e.consume(n), e.exit("autolinkMarker"), e.exit("autolink"), t) : f(n);
	}
	function f(t) {
		if ((t === 45 || my(t)) && r++ < 63) {
			let n = t === 45 ? f : d;
			return e.consume(t), n;
		}
		return n(t);
	}
}
// node_modules/streamdown/node_modules/micromark-core-commonmark/lib/blank-line.js
var By = {
	partial: !0,
	tokenize: Vy
};
function Vy(e, t, n) {
	return r;
	function r(t) {
		return Y(t) ? Ty(e, i, "linePrefix")(t) : i(t);
	}
	function i(e) {
		return e === null || J(e) ? t(e) : n(e);
	}
}
// node_modules/streamdown/node_modules/micromark-core-commonmark/lib/block-quote.js
var Hy = {
	continuation: { tokenize: Wy },
	exit: Gy,
	name: "blockQuote",
	tokenize: Uy
};
function Uy(e, t, n) {
	let r = this;
	return i;
	function i(t) {
		if (t === 62) {
			let n = r.containerState;
			return n.open ||= (e.enter("blockQuote", { _container: !0 }), !0), e.enter("blockQuotePrefix"), e.enter("blockQuoteMarker"), e.consume(t), e.exit("blockQuoteMarker"), a;
		}
		return n(t);
	}
	function a(n) {
		return Y(n) ? (e.enter("blockQuotePrefixWhitespace"), e.consume(n), e.exit("blockQuotePrefixWhitespace"), e.exit("blockQuotePrefix"), t) : (e.exit("blockQuotePrefix"), t(n));
	}
}
function Wy(e, t, n) {
	let r = this;
	return i;
	function i(t) {
		return Y(t) ? Ty(e, a, "linePrefix", r.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(t) : a(t);
	}
	function a(r) {
		return e.attempt(Hy, t, n)(r);
	}
}
function Gy(e) {
	e.exit("blockQuote");
}
// node_modules/streamdown/node_modules/micromark-core-commonmark/lib/character-escape.js
var Ky = {
	name: "characterEscape",
	tokenize: qy
};
function qy(e, t, n) {
	return r;
	function r(t) {
		return e.enter("characterEscape"), e.enter("escapeMarker"), e.consume(t), e.exit("escapeMarker"), i;
	}
	function i(r) {
		return yy(r) ? (e.enter("characterEscapeValue"), e.consume(r), e.exit("characterEscapeValue"), e.exit("characterEscape"), t) : n(r);
	}
}
// node_modules/streamdown/node_modules/micromark-core-commonmark/lib/character-reference.js
var Jy = {
	name: "characterReference",
	tokenize: Yy
};
function Yy(e, t, n) {
	let r = this, i = 0, a, o;
	return s;
	function s(t) {
		return e.enter("characterReference"), e.enter("characterReferenceMarker"), e.consume(t), e.exit("characterReferenceMarker"), c;
	}
	function c(t) {
		return t === 35 ? (e.enter("characterReferenceMarkerNumeric"), e.consume(t), e.exit("characterReferenceMarkerNumeric"), l) : (e.enter("characterReferenceValue"), a = 31, o = my, u(t));
	}
	function l(t) {
		return t === 88 || t === 120 ? (e.enter("characterReferenceMarkerHexadecimal"), e.consume(t), e.exit("characterReferenceMarkerHexadecimal"), e.enter("characterReferenceValue"), a = 6, o = vy, u) : (e.enter("characterReferenceValue"), a = 7, o = _y, u(t));
	}
	function u(s) {
		if (s === 59 && i) {
			let i = e.exit("characterReferenceValue");
			return o === my && !xf(r.sliceSerialize(i)) ? n(s) : (e.enter("characterReferenceMarker"), e.consume(s), e.exit("characterReferenceMarker"), e.exit("characterReference"), t);
		}
		return o(s) && i++ < a ? (e.consume(s), u) : n(s);
	}
}
// node_modules/streamdown/node_modules/micromark-core-commonmark/lib/partial-non-lazy-continuation.js
var Xy = {
	partial: !0,
	tokenize: Zy
};
function Zy(e, t, n) {
	let r = this;
	return i;
	function i(t) {
		return t === null ? n(t) : (e.enter("lineEnding"), e.consume(t), e.exit("lineEnding"), a);
	}
	function a(e) {
		return r.parser.lazy[r.now().line] ? n(e) : t(e);
	}
}
// node_modules/streamdown/node_modules/micromark-core-commonmark/lib/code-fenced.js
var Qy = {
	concrete: !0,
	name: "codeFenced",
	tokenize: $y
};
function $y(e, t, n) {
	let r = this, i = {
		partial: !0,
		tokenize: ee
	}, a = 0, o = 0, s;
	return c;
	function c(e) {
		return l(e);
	}
	function l(t) {
		let n = r.events[r.events.length - 1];
		return a = n && n[1].type === "linePrefix" ? n[2].sliceSerialize(n[1], !0).length : 0, s = t, e.enter("codeFenced"), e.enter("codeFencedFence"), e.enter("codeFencedFenceSequence"), u(t);
	}
	function u(t) {
		return t === s ? (o++, e.consume(t), u) : o < 3 ? n(t) : (e.exit("codeFencedFenceSequence"), Y(t) ? Ty(e, d, "whitespace")(t) : d(t));
	}
	function d(n) {
		return n === null || J(n) ? (e.exit("codeFencedFence"), r.interrupt ? t(n) : e.check(Xy, h, b)(n)) : (e.enter("codeFencedFenceInfo"), e.enter("chunkString", { contentType: "string" }), f(n));
	}
	function f(t) {
		return t === null || J(t) ? (e.exit("chunkString"), e.exit("codeFencedFenceInfo"), d(t)) : Y(t) ? (e.exit("chunkString"), e.exit("codeFencedFenceInfo"), Ty(e, p, "whitespace")(t)) : t === 96 && t === s ? n(t) : (e.consume(t), f);
	}
	function p(t) {
		return t === null || J(t) ? d(t) : (e.enter("codeFencedFenceMeta"), e.enter("chunkString", { contentType: "string" }), m(t));
	}
	function m(t) {
		return t === null || J(t) ? (e.exit("chunkString"), e.exit("codeFencedFenceMeta"), d(t)) : t === 96 && t === s ? n(t) : (e.consume(t), m);
	}
	function h(t) {
		return e.attempt(i, b, g)(t);
	}
	function g(t) {
		return e.enter("lineEnding"), e.consume(t), e.exit("lineEnding"), _;
	}
	function _(t) {
		return a > 0 && Y(t) ? Ty(e, v, "linePrefix", a + 1)(t) : v(t);
	}
	function v(t) {
		return t === null || J(t) ? e.check(Xy, h, b)(t) : (e.enter("codeFlowValue"), y(t));
	}
	function y(t) {
		return t === null || J(t) ? (e.exit("codeFlowValue"), v(t)) : (e.consume(t), y);
	}
	function b(n) {
		return e.exit("codeFenced"), t(n);
	}
	function ee(e, t, n) {
		let i = 0;
		return a;
		function a(t) {
			return e.enter("lineEnding"), e.consume(t), e.exit("lineEnding"), c;
		}
		function c(t) {
			return e.enter("codeFencedFence"), Y(t) ? Ty(e, l, "linePrefix", r.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(t) : l(t);
		}
		function l(t) {
			return t === s ? (e.enter("codeFencedFenceSequence"), u(t)) : n(t);
		}
		function u(t) {
			return t === s ? (i++, e.consume(t), u) : i >= o ? (e.exit("codeFencedFenceSequence"), Y(t) ? Ty(e, d, "whitespace")(t) : d(t)) : n(t);
		}
		function d(r) {
			return r === null || J(r) ? (e.exit("codeFencedFence"), t(r)) : n(r);
		}
	}
}
// node_modules/streamdown/node_modules/micromark-core-commonmark/lib/code-indented.js
var eb = {
	name: "codeIndented",
	tokenize: nb
}, tb = {
	partial: !0,
	tokenize: rb
};
function nb(e, t, n) {
	return r;
	function r(t) {
		return e.enter("codeIndented"), Ey(e, i, n, "linePrefix", 4, 4)(t);
	}
	function i(t) {
		return t === null ? o(t) : J(t) ? e.attempt(tb, i, o)(t) : (e.enter("codeFlowValue"), a(t));
	}
	function a(t) {
		return t === null || J(t) ? (e.exit("codeFlowValue"), i(t)) : (e.consume(t), a);
	}
	function o(n) {
		return e.exit("codeIndented"), t(n);
	}
}
function rb(e, t, n) {
	let r = this;
	return i;
	function i(o) {
		return r.parser.lazy[r.now().line] ? n(o) : J(o) ? (e.enter("lineEnding"), e.consume(o), e.exit("lineEnding"), i) : Ey(e, t, a, "linePrefix", 4, 4)(o);
	}
	function a(e) {
		return J(e) ? i(e) : n(e);
	}
}
// node_modules/streamdown/node_modules/micromark-core-commonmark/lib/code-text.js
var ib = {
	name: "codeText",
	previous: ob,
	resolve: ab,
	tokenize: sb
};
function ab(e) {
	let t = e.length - 4, n = 3, r, i;
	if ((e[n][1].type === "lineEnding" || e[n][1].type === "space") && (e[t][1].type === "lineEnding" || e[t][1].type === "space")) {
		for (r = n; ++r < t;) if (e[r][1].type === "codeTextData") {
			e[n][1].type = "codeTextPadding", e[t][1].type = "codeTextPadding", n += 2, t -= 2;
			break;
		}
	}
	for (r = n - 1, t++; ++r <= t;) i === void 0 ? r !== t && e[r][1].type !== "lineEnding" && (i = r) : (r === t || e[r][1].type === "lineEnding") && (e[i][1].type = "codeTextData", r !== i + 2 && (e[i][1].end = e[r - 1][1].end, e.splice(i + 2, r - i - 2), t -= r - i - 2, r = i + 2), i = void 0);
	return e;
}
function ob(e) {
	return e !== 96 || this.events[this.events.length - 1][1].type === "characterEscape";
}
function sb(e, t, n) {
	let r = 0, i, a;
	return o;
	function o(t) {
		return e.enter("codeText"), e.enter("codeTextSequence"), s(t);
	}
	function s(t) {
		return t === 96 ? (e.consume(t), r++, s) : (e.exit("codeTextSequence"), c(t));
	}
	function c(t) {
		return t === null ? n(t) : t === 32 ? (e.enter("space"), e.consume(t), e.exit("space"), c) : t === 96 ? (a = e.enter("codeTextSequence"), i = 0, u(t)) : J(t) ? (e.enter("lineEnding"), e.consume(t), e.exit("lineEnding"), c) : (e.enter("codeTextData"), l(t));
	}
	function l(t) {
		return t === null || t === 32 || t === 96 || J(t) ? (e.exit("codeTextData"), c(t)) : (e.consume(t), l);
	}
	function u(n) {
		return n === 96 ? (e.consume(n), i++, u) : i === r ? (e.exit("codeTextSequence"), e.exit("codeText"), t(n)) : (a.type = "codeTextData", l(n));
	}
}
// node_modules/streamdown/node_modules/micromark-util-subtokenize/lib/splice-buffer.js
var cb = class {
	constructor(e) {
		this.left = e ? [...e] : [], this.right = [];
	}
	get(e) {
		if (e < 0 || e >= this.left.length + this.right.length) throw RangeError("Cannot access index `" + e + "` in a splice buffer of size `" + (this.left.length + this.right.length) + "`");
		return e < this.left.length ? this.left[e] : this.right[this.right.length - e + this.left.length - 1];
	}
	get length() {
		return this.left.length + this.right.length;
	}
	shift() {
		return this.setCursor(0), this.right.pop();
	}
	slice(e, t) {
		let n = t ?? Infinity;
		return n < this.left.length ? this.left.slice(e, n) : e > this.left.length ? this.right.slice(this.right.length - n + this.left.length, this.right.length - e + this.left.length).reverse() : this.left.slice(e).concat(this.right.slice(this.right.length - n + this.left.length).reverse());
	}
	splice(e, t, n) {
		let r = t || 0;
		this.setCursor(Math.trunc(e));
		let i = this.right.splice(this.right.length - r, Infinity);
		return n && lb(this.left, n), i.reverse();
	}
	pop() {
		return this.setCursor(Infinity), this.left.pop();
	}
	push(e) {
		this.setCursor(Infinity), this.left.push(e);
	}
	pushMany(e) {
		this.setCursor(Infinity), lb(this.left, e);
	}
	unshift(e) {
		this.setCursor(0), this.right.push(e);
	}
	unshiftMany(e) {
		this.setCursor(0), lb(this.right, e.reverse());
	}
	setCursor(e) {
		if (!(e === this.left.length || e > this.left.length && this.right.length === 0 || e < 0 && this.left.length === 0)) {
			if (e < this.left.length) {
				let t = this.left.splice(e, Infinity);
				lb(this.right, t.reverse());
			} else {
				let t = this.right.splice(this.left.length + this.right.length - e, Infinity);
				lb(this.left, t.reverse());
			}
		}
	}
};
function lb(e, t) {
	let n = 0;
	if (t.length < 1e4) e.push(...t);
	else for (; n < t.length;) e.push(...t.slice(n, n + 1e4)), n += 1e4;
}
// node_modules/streamdown/node_modules/micromark-util-subtokenize/index.js
function ub(e) {
	let t = {}, n = -1, r, i, a, o, s, c, l, u = new cb(e);
	for (; ++n < u.length;) {
		for (; n in t;) n = t[n];
		if (r = u.get(n), n && r[1].type === "chunkFlow" && u.get(n - 1)[1].type === "listItemPrefix" && (c = r[1]._tokenizer.events, a = 0, a < c.length && c[a][1].type === "lineEndingBlank" && (a += 2), a < c.length && c[a][1].type === "content")) for (; ++a < c.length && c[a][1].type !== "content";) c[a][1].type === "chunkText" && (c[a][1]._isInFirstContentOfListItem = !0, a++);
		if (r[0] === "enter") r[1].contentType && (Object.assign(t, db(u, n)), n = t[n], l = !0);
		else if (r[1]._container) {
			for (a = n, i = void 0; a--;) if (o = u.get(a), o[1].type === "lineEnding" || o[1].type === "lineEndingBlank") o[0] === "enter" && (i && (u.get(i)[1].type = "lineEndingBlank"), o[1].type = "lineEnding", i = a);
			else if (o[1].type !== "linePrefix" && o[1].type !== "listItemIndent") break;
			i && (r[1].end = { ...u.get(i)[1].start }, s = u.slice(i, n), s.unshift(r), u.splice(i, n - i + 1, s));
		}
	}
	return Fl(e, 0, Infinity, u.slice(0)), !l;
}
function db(e, t) {
	let n = e.get(t)[1], r = e.get(t)[2], i = t - 1, a = [], o = n._tokenizer;
	o || (o = r.parser[n.contentType](n.start), n._contentTypeTextTrailing && (o._contentTypeTextTrailing = !0));
	let s = o.events, c = [], l = {}, u, d, f = -1, p = n, m = 0, h = 0, g = [h];
	for (; p;) {
		for (; e.get(++i)[1] !== p;);
		a.push(i), p._tokenizer || (u = r.sliceStream(p), p.next || u.push(null), d && o.defineSkip(p.start), p._isInFirstContentOfListItem && (o._gfmTasklistFirstContentOfListItem = !0), o.write(u), p._isInFirstContentOfListItem && (o._gfmTasklistFirstContentOfListItem = void 0)), d = p, p = p.next;
	}
	for (p = n; ++f < s.length;) s[f][0] === "exit" && s[f - 1][0] === "enter" && s[f][1].type === s[f - 1][1].type && s[f][1].start.line !== s[f][1].end.line && (h = f + 1, g.push(h), p._tokenizer = void 0, p.previous = void 0, p = p.next);
	for (o.events = [], p ? (p._tokenizer = void 0, p.previous = void 0) : g.pop(), f = g.length; f--;) {
		let t = s.slice(g[f], g[f + 1]), n = a.pop();
		c.push([n, n + t.length - 1]), e.splice(n, 2, t);
	}
	for (c.reverse(), f = -1; ++f < c.length;) l[m + c[f][0]] = m + c[f][1], m += c[f][1] - c[f][0] - 1;
	return l;
}
// node_modules/streamdown/node_modules/micromark-core-commonmark/lib/content.js
var fb = {
	resolve: mb,
	tokenize: hb
}, pb = {
	partial: !0,
	tokenize: gb
};
function mb(e) {
	return ub(e), e;
}
function hb(e, t) {
	let n;
	return r;
	function r(t) {
		return e.enter("content"), n = e.enter("chunkContent", { contentType: "content" }), i(t);
	}
	function i(t) {
		return t === null ? a(t) : J(t) ? e.check(pb, o, a)(t) : (e.consume(t), i);
	}
	function a(n) {
		return e.exit("chunkContent"), e.exit("content"), t(n);
	}
	function o(t) {
		return e.consume(t), e.exit("chunkContent"), n.next = e.enter("chunkContent", {
			contentType: "content",
			previous: n
		}), n = n.next, i;
	}
}
function gb(e, t, n) {
	let r = this;
	return i;
	function i(t) {
		return e.exit("chunkContent"), e.enter("lineEnding"), e.consume(t), e.exit("lineEnding"), Ty(e, a, "linePrefix");
	}
	function a(i) {
		if (i === null || J(i)) return n(i);
		let a = r.events[r.events.length - 1];
		return !r.parser.constructs.disable.null.includes("codeIndented") && a && a[1].type === "linePrefix" && a[2].sliceSerialize(a[1], !0).length >= 4 ? t(i) : e.interrupt(r.parser.constructs.flow, n, t)(i);
	}
}
// node_modules/streamdown/node_modules/micromark-factory-destination/index.js
function _b(e, t, n, r, i, a, o, s, c) {
	let l = c || Infinity, u = 0;
	return d;
	function d(t) {
		return t === 60 ? (e.enter(r), e.enter(i), e.enter(a), e.consume(t), e.exit(a), f) : t === null || t === 32 || t === 41 || gy(t) ? n(t) : (e.enter(r), e.enter(o), e.enter(s), e.enter("chunkString", { contentType: "string" }), h(t));
	}
	function f(n) {
		return n === 62 ? (e.enter(a), e.consume(n), e.exit(a), e.exit(i), e.exit(r), t) : (e.enter(s), e.enter("chunkString", { contentType: "string" }), p(n));
	}
	function p(t) {
		return t === 62 ? (e.exit("chunkString"), e.exit(s), f(t)) : t === null || t === 60 || J(t) ? n(t) : (e.consume(t), t === 92 ? m : p);
	}
	function m(t) {
		return t === 60 || t === 62 || t === 92 ? (e.consume(t), p) : p(t);
	}
	function h(i) {
		return !u && (i === null || i === 41 || by(i)) ? (e.exit("chunkString"), e.exit(s), e.exit(o), e.exit(r), t(i)) : u < l && i === 40 ? (e.consume(i), u++, h) : i === 41 ? (e.consume(i), u--, h) : i === null || i === 32 || i === 40 || gy(i) ? n(i) : (e.consume(i), i === 92 ? g : h);
	}
	function g(t) {
		return t === 40 || t === 41 || t === 92 ? (e.consume(t), h) : h(t);
	}
}
// node_modules/streamdown/node_modules/micromark-factory-label/index.js
function vb(e, t, n, r, i, a) {
	let o = this, s = 0, c;
	return l;
	function l(t) {
		return e.enter(r), e.enter(i), e.consume(t), e.exit(i), e.enter(a), u;
	}
	function u(l) {
		return s > 999 || l === null || l === 91 || l === 93 && !c || 
		/* c8 ignore next 3 */
		l === 94 && !s && "_hiddenFootnoteSupport" in o.parser.constructs ? n(l) : l === 93 ? (e.exit(a), e.enter(i), e.consume(l), e.exit(i), e.exit(r), t) : J(l) ? (e.enter("lineEnding"), e.consume(l), e.exit("lineEnding"), u) : (e.enter("chunkString", { contentType: "string" }), d(l));
	}
	function d(t) {
		return t === null || t === 91 || t === 93 || J(t) || s++ > 999 ? (e.exit("chunkString"), u(t)) : (e.consume(t), c ||= !Y(t), t === 92 ? f : d);
	}
	function f(t) {
		return t === 91 || t === 92 || t === 93 ? (e.consume(t), s++, d) : d(t);
	}
}
// node_modules/streamdown/node_modules/micromark-factory-title/index.js
function yb(e, t, n, r, i, a) {
	let o;
	return s;
	function s(t) {
		return t === 34 || t === 39 || t === 40 ? (e.enter(r), e.enter(i), e.consume(t), e.exit(i), o = t === 40 ? 41 : t, c) : n(t);
	}
	function c(n) {
		return n === o ? (e.enter(i), e.consume(n), e.exit(i), e.exit(r), t) : (e.enter(a), l(n));
	}
	function l(t) {
		return t === o ? (e.exit(a), c(o)) : t === null ? n(t) : J(t) ? (e.enter("lineEnding"), e.consume(t), e.exit("lineEnding"), Ty(e, l, "linePrefix")) : (e.enter("chunkString", { contentType: "string" }), u(t));
	}
	function u(t) {
		return t === o || t === null || J(t) ? (e.exit("chunkString"), l(t)) : (e.consume(t), t === 92 ? d : u);
	}
	function d(t) {
		return t === o || t === 92 ? (e.consume(t), u) : u(t);
	}
}
// node_modules/streamdown/node_modules/micromark-factory-whitespace/index.js
function bb(e, t) {
	let n;
	return r;
	function r(i) {
		return J(i) ? (e.enter("lineEnding"), e.consume(i), e.exit("lineEnding"), n = !0, r) : Y(i) ? Ty(e, r, n ? "linePrefix" : "lineSuffix")(i) : t(i);
	}
}
// node_modules/streamdown/node_modules/micromark-core-commonmark/lib/definition.js
var xb = {
	name: "definition",
	tokenize: Cb
}, Sb = {
	partial: !0,
	tokenize: wb
};
function Cb(e, t, n) {
	let r = this, i;
	return a;
	function a(t) {
		return e.enter("definition"), o(t);
	}
	function o(t) {
		return vb.call(r, e, s, n, "definitionLabel", "definitionLabelMarker", "definitionLabelString")(t);
	}
	function s(t) {
		return i = fy(r.sliceSerialize(r.events[r.events.length - 1][1]).slice(1, -1)), t === 58 ? (e.enter("definitionMarker"), e.consume(t), e.exit("definitionMarker"), c) : n(t);
	}
	function c(t) {
		return by(t) ? bb(e, l)(t) : l(t);
	}
	function l(t) {
		return _b(e, u, n, "definitionDestination", "definitionDestinationLiteral", "definitionDestinationLiteralMarker", "definitionDestinationRaw", "definitionDestinationString")(t);
	}
	function u(t) {
		return e.attempt(Sb, d, d)(t);
	}
	function d(t) {
		return Y(t) ? Ty(e, f, "whitespace")(t) : f(t);
	}
	function f(a) {
		return a === null || J(a) ? (e.exit("definition"), r.parser.defined.push(i), t(a)) : n(a);
	}
}
function wb(e, t, n) {
	return r;
	function r(t) {
		return by(t) ? bb(e, i)(t) : n(t);
	}
	function i(t) {
		return yb(e, a, n, "definitionTitle", "definitionTitleMarker", "definitionTitleString")(t);
	}
	function a(t) {
		return Y(t) ? Ty(e, o, "whitespace")(t) : o(t);
	}
	function o(e) {
		return e === null || J(e) ? t(e) : n(e);
	}
}
// node_modules/streamdown/node_modules/micromark-core-commonmark/lib/hard-break-escape.js
var Tb = {
	name: "hardBreakEscape",
	tokenize: Eb
};
function Eb(e, t, n) {
	return r;
	function r(t) {
		return e.enter("hardBreakEscape"), e.consume(t), i;
	}
	function i(r) {
		return J(r) ? (e.exit("hardBreakEscape"), t(r)) : n(r);
	}
}
// node_modules/streamdown/node_modules/micromark-core-commonmark/lib/heading-atx.js
var Db = {
	name: "headingAtx",
	resolve: Ob,
	tokenize: kb
};
function Ob(e, t) {
	let n = e.length - 2, r = 3;
	if (e[r][1].type === "whitespace" && (r += 2), n - 2 > r && e[n][1].type === "whitespace" && (n -= 2), e[n][1].type === "atxHeadingSequence" && (r === n - 1 || n - 4 > r && e[n - 2][1].type === "whitespace") && (n -= r + 1 === n ? 2 : 4), n > r) {
		let i = {
			type: "atxHeadingText",
			start: e[r][1].start,
			end: e[n][1].end
		}, a = {
			type: "chunkText",
			start: e[r][1].start,
			end: e[n][1].end,
			contentType: "text"
		};
		Fl(e, r, n - r + 1, [
			[
				"enter",
				i,
				t
			],
			[
				"enter",
				a,
				t
			],
			[
				"exit",
				a,
				t
			],
			[
				"exit",
				i,
				t
			]
		]);
	}
	return e;
}
function kb(e, t, n) {
	let r = 0;
	return i;
	function i(t) {
		return e.enter("atxHeading"), a(t);
	}
	function a(t) {
		return e.enter("atxHeadingSequence"), o(t);
	}
	function o(t) {
		return t === 35 && r++ < 6 ? (e.consume(t), o) : t === null || by(t) ? (e.exit("atxHeadingSequence"), s(t)) : n(t);
	}
	function s(n) {
		return n === 35 ? (e.enter("atxHeadingSequence"), c(n)) : n === null || J(n) ? (e.exit("atxHeading"), t(n)) : Y(n) ? Ty(e, s, "whitespace")(n) : (e.enter("atxHeadingText"), l(n));
	}
	function c(t) {
		return t === 35 ? (e.consume(t), c) : (e.exit("atxHeadingSequence"), s(t));
	}
	function l(t) {
		return t === null || t === 35 || by(t) ? (e.exit("atxHeadingText"), s(t)) : (e.consume(t), l);
	}
}
// node_modules/streamdown/node_modules/micromark-util-html-tag-name/index.js
var Ab = /* @__PURE__ */ "address.article.aside.base.basefont.blockquote.body.caption.center.col.colgroup.dd.details.dialog.dir.div.dl.dt.fieldset.figcaption.figure.footer.form.frame.frameset.h1.h2.h3.h4.h5.h6.head.header.hr.html.iframe.legend.li.link.main.menu.menuitem.nav.noframes.ol.optgroup.option.p.param.search.section.summary.table.tbody.td.tfoot.th.thead.title.tr.track.ul".split("."), jb = [
	"pre",
	"script",
	"style",
	"textarea"
], Mb = {
	concrete: !0,
	name: "htmlFlow",
	resolveTo: Pb,
	tokenize: Fb
}, Nb = {
	partial: !0,
	tokenize: Ib
};
function Pb(e) {
	let t = e.length;
	for (; t-- && (e[t][0] !== "enter" || e[t][1].type !== "htmlFlow"););
	return t > 1 && e[t - 2][1].type === "linePrefix" && (e[t][1].start = e[t - 2][1].start, e[t + 1][1].start = e[t - 2][1].start, e.splice(t - 2, 2)), e;
}
function Fb(e, t, n) {
	let r = this, i, a, o, s, c;
	return l;
	function l(e) {
		return u(e);
	}
	function u(t) {
		return e.enter("htmlFlow"), e.enter("htmlFlowData"), e.consume(t), d;
	}
	function d(s) {
		return s === 33 ? (e.consume(s), f) : s === 47 ? (e.consume(s), a = !0, h) : s === 63 ? (e.consume(s), i = 3, r.interrupt ? t : T) : py(s) ? (e.consume(s), o = String.fromCharCode(s), g) : n(s);
	}
	function f(a) {
		return a === 45 ? (e.consume(a), i = 2, p) : a === 91 ? (e.consume(a), i = 5, s = 0, m) : py(a) ? (e.consume(a), i = 4, r.interrupt ? t : T) : n(a);
	}
	function p(i) {
		return i === 45 ? (e.consume(i), r.interrupt ? t : T) : n(i);
	}
	function m(i) {
		return i === "CDATA[".charCodeAt(s++) ? (e.consume(i), s === 6 ? r.interrupt ? t : w : m) : n(i);
	}
	function h(t) {
		return py(t) ? (e.consume(t), o = String.fromCharCode(t), g) : n(t);
	}
	function g(s) {
		if (s === null || s === 47 || s === 62 || by(s)) {
			let c = s === 47, l = o.toLowerCase();
			return !c && !a && jb.includes(l) ? (i = 1, r.interrupt ? t(s) : w(s)) : Ab.includes(o.toLowerCase()) ? (i = 6, c ? (e.consume(s), _) : r.interrupt ? t(s) : w(s)) : (i = 7, r.interrupt && !r.parser.lazy[r.now().line] ? n(s) : a ? v(s) : y(s));
		}
		return s === 45 || my(s) ? (e.consume(s), o += String.fromCharCode(s), g) : n(s);
	}
	function _(i) {
		return i === 62 ? (e.consume(i), r.interrupt ? t : w) : n(i);
	}
	function v(t) {
		return Y(t) ? (e.consume(t), v) : ne(t);
	}
	function y(t) {
		return t === 47 ? (e.consume(t), ne) : t === 58 || t === 95 || py(t) ? (e.consume(t), b) : Y(t) ? (e.consume(t), y) : ne(t);
	}
	function b(t) {
		return t === 45 || t === 46 || t === 58 || t === 95 || my(t) ? (e.consume(t), b) : ee(t);
	}
	function ee(t) {
		return t === 61 ? (e.consume(t), te) : Y(t) ? (e.consume(t), ee) : y(t);
	}
	function te(t) {
		return t === null || t === 60 || t === 61 || t === 62 || t === 96 ? n(t) : t === 34 || t === 39 ? (e.consume(t), c = t, x) : Y(t) ? (e.consume(t), te) : S(t);
	}
	function x(t) {
		return t === c ? (e.consume(t), c = null, C) : t === null || J(t) ? n(t) : (e.consume(t), x);
	}
	function S(t) {
		return t === null || t === 34 || t === 39 || t === 47 || t === 60 || t === 61 || t === 62 || t === 96 || by(t) ? ee(t) : (e.consume(t), S);
	}
	function C(e) {
		return e === 47 || e === 62 || Y(e) ? y(e) : n(e);
	}
	function ne(t) {
		return t === 62 ? (e.consume(t), re) : n(t);
	}
	function re(t) {
		return t === null || J(t) ? w(t) : Y(t) ? (e.consume(t), re) : n(t);
	}
	function w(t) {
		return t === 45 && i === 2 ? (e.consume(t), se) : t === 60 && i === 1 ? (e.consume(t), ce) : t === 62 && i === 4 ? (e.consume(t), de) : t === 63 && i === 3 ? (e.consume(t), T) : t === 93 && i === 5 ? (e.consume(t), ue) : J(t) && (i === 6 || i === 7) ? (e.exit("htmlFlowData"), e.check(Nb, fe, ie)(t)) : t === null || J(t) ? (e.exit("htmlFlowData"), ie(t)) : (e.consume(t), w);
	}
	function ie(t) {
		return e.check(Xy, ae, fe)(t);
	}
	function ae(t) {
		return e.enter("lineEnding"), e.consume(t), e.exit("lineEnding"), oe;
	}
	function oe(t) {
		return t === null || J(t) ? ie(t) : (e.enter("htmlFlowData"), w(t));
	}
	function se(t) {
		return t === 45 ? (e.consume(t), T) : w(t);
	}
	function ce(t) {
		return t === 47 ? (e.consume(t), o = "", le) : w(t);
	}
	function le(t) {
		if (t === 62) {
			let n = o.toLowerCase();
			return jb.includes(n) ? (e.consume(t), de) : w(t);
		}
		return py(t) && o.length < 8 ? (e.consume(t), o += String.fromCharCode(t), le) : w(t);
	}
	function ue(t) {
		return t === 93 ? (e.consume(t), T) : w(t);
	}
	function T(t) {
		return t === 62 ? (e.consume(t), de) : t === 45 && i === 2 ? (e.consume(t), T) : w(t);
	}
	function de(t) {
		return t === null || J(t) ? (e.exit("htmlFlowData"), fe(t)) : (e.consume(t), de);
	}
	function fe(n) {
		return e.exit("htmlFlow"), t(n);
	}
}
function Ib(e, t, n) {
	return r;
	function r(r) {
		return e.enter("lineEnding"), e.consume(r), e.exit("lineEnding"), e.attempt(By, t, n);
	}
}
// node_modules/streamdown/node_modules/micromark-core-commonmark/lib/html-text.js
var Lb = {
	name: "htmlText",
	tokenize: Rb
};
function Rb(e, t, n) {
	let r = this, i, a, o;
	return s;
	function s(t) {
		return e.enter("htmlText"), e.enter("htmlTextData"), e.consume(t), c;
	}
	function c(t) {
		return t === 33 ? (e.consume(t), l) : t === 47 ? (e.consume(t), ee) : t === 63 ? (e.consume(t), y) : py(t) ? (e.consume(t), S) : n(t);
	}
	function l(t) {
		return t === 45 ? (e.consume(t), u) : t === 91 ? (e.consume(t), a = 0, m) : py(t) ? (e.consume(t), v) : n(t);
	}
	function u(t) {
		return t === 45 ? (e.consume(t), p) : n(t);
	}
	function d(t) {
		return t === null ? n(t) : t === 45 ? (e.consume(t), f) : J(t) ? (o = d, ce(t)) : (e.consume(t), d);
	}
	function f(t) {
		return t === 45 ? (e.consume(t), p) : d(t);
	}
	function p(e) {
		return e === 62 ? se(e) : e === 45 ? f(e) : d(e);
	}
	function m(t) {
		return t === "CDATA[".charCodeAt(a++) ? (e.consume(t), a === 6 ? h : m) : n(t);
	}
	function h(t) {
		return t === null ? n(t) : t === 93 ? (e.consume(t), g) : J(t) ? (o = h, ce(t)) : (e.consume(t), h);
	}
	function g(t) {
		return t === 93 ? (e.consume(t), _) : h(t);
	}
	function _(t) {
		return t === 62 ? se(t) : t === 93 ? (e.consume(t), _) : h(t);
	}
	function v(t) {
		return t === null || t === 62 ? se(t) : J(t) ? (o = v, ce(t)) : (e.consume(t), v);
	}
	function y(t) {
		return t === null ? n(t) : t === 63 ? (e.consume(t), b) : J(t) ? (o = y, ce(t)) : (e.consume(t), y);
	}
	function b(e) {
		return e === 62 ? se(e) : y(e);
	}
	function ee(t) {
		return py(t) ? (e.consume(t), te) : n(t);
	}
	function te(t) {
		return t === 45 || my(t) ? (e.consume(t), te) : x(t);
	}
	function x(t) {
		return J(t) ? (o = x, ce(t)) : Y(t) ? (e.consume(t), x) : se(t);
	}
	function S(t) {
		return t === 45 || my(t) ? (e.consume(t), S) : t === 47 || t === 62 || by(t) ? C(t) : n(t);
	}
	function C(t) {
		return t === 47 ? (e.consume(t), se) : t === 58 || t === 95 || py(t) ? (e.consume(t), ne) : J(t) ? (o = C, ce(t)) : Y(t) ? (e.consume(t), C) : se(t);
	}
	function ne(t) {
		return t === 45 || t === 46 || t === 58 || t === 95 || my(t) ? (e.consume(t), ne) : re(t);
	}
	function re(t) {
		return t === 61 ? (e.consume(t), w) : J(t) ? (o = re, ce(t)) : Y(t) ? (e.consume(t), re) : C(t);
	}
	function w(t) {
		return t === null || t === 60 || t === 61 || t === 62 || t === 96 ? n(t) : t === 34 || t === 39 ? (e.consume(t), i = t, ie) : J(t) ? (o = w, ce(t)) : Y(t) ? (e.consume(t), w) : (e.consume(t), ae);
	}
	function ie(t) {
		return t === i ? (e.consume(t), i = void 0, oe) : t === null ? n(t) : J(t) ? (o = ie, ce(t)) : (e.consume(t), ie);
	}
	function ae(t) {
		return t === null || t === 34 || t === 39 || t === 60 || t === 61 || t === 96 ? n(t) : t === 47 || t === 62 || by(t) ? C(t) : (e.consume(t), ae);
	}
	function oe(e) {
		return e === 47 || e === 62 || by(e) ? C(e) : n(e);
	}
	function se(r) {
		return r === 62 ? (e.consume(r), e.exit("htmlTextData"), e.exit("htmlText"), t) : n(r);
	}
	function ce(t) {
		return e.exit("htmlTextData"), e.enter("lineEnding"), e.consume(t), e.exit("lineEnding"), le;
	}
	function le(t) {
		return Y(t) ? Ty(e, ue, "linePrefix", r.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(t) : ue(t);
	}
	function ue(t) {
		return e.enter("htmlTextData"), o(t);
	}
}
// node_modules/streamdown/node_modules/micromark-core-commonmark/lib/label-end.js
var zb = {
	name: "labelEnd",
	resolveAll: Ub,
	resolveTo: Wb,
	tokenize: Gb
}, Bb = { tokenize: Kb }, Vb = { tokenize: qb }, Hb = { tokenize: Jb };
function Ub(e) {
	let t = -1, n = [];
	for (; ++t < e.length;) {
		let r = e[t][1];
		if (n.push(e[t]), r.type === "labelImage" || r.type === "labelLink" || r.type === "labelEnd") {
			let e = r.type === "labelImage" ? 4 : 2;
			r.type = "data", t += e;
		}
	}
	return e.length !== n.length && Fl(e, 0, e.length, n), e;
}
function Wb(e, t) {
	let n = e.length, r = 0, i, a, o;
	for (; n--;) {
		let t = e[n][1];
		if (i) {
			if (t.type === "link" || t.type === "labelLink" && t._inactive) break;
			e[n][0] === "enter" && t.type === "labelLink" && (t._inactive = !0);
		} else if (a) {
			if (e[n][0] === "enter" && (t.type === "labelImage" || t.type === "labelLink") && !t._balanced && (i = n, t.type !== "labelLink")) {
				r = 2;
				break;
			}
		} else t.type === "labelEnd" && (a = n);
	}
	let s = {
		type: e[i][1].type === "labelLink" ? "link" : "image",
		start: { ...e[i][1].start },
		end: { ...e[e.length - 1][1].end }
	}, c = {
		type: "label",
		start: { ...e[i][1].start },
		end: { ...e[a][1].end }
	}, l = {
		type: "labelText",
		start: { ...e[i + r + 2][1].end },
		end: { ...e[a - 2][1].start }
	};
	return o = [[
		"enter",
		s,
		t
	], [
		"enter",
		c,
		t
	]], o = Il(o, e.slice(i + 1, i + r + 3)), o = Il(o, [[
		"enter",
		l,
		t
	]]), o = Il(o, Ll(t.parser.constructs.insideSpan.null, e.slice(i + r + 4, a - 3), t)), o = Il(o, [
		[
			"exit",
			l,
			t
		],
		e[a - 2],
		e[a - 1],
		[
			"exit",
			c,
			t
		]
	]), o = Il(o, e.slice(a + 1)), o = Il(o, [[
		"exit",
		s,
		t
	]]), Fl(e, i, e.length, o), e;
}
function Gb(e, t, n) {
	let r = this, i = r._labelStarts, a, o;
	if (i) {
		for (; i.length > 0 && i[i.length - 1]._balanced;) i.pop();
		a = i[i.length - 1];
	}
	return s;
	function s(t) {
		return a ? a._inactive ? d(t) : (o = r.parser.defined.includes(fy(r.sliceSerialize({
			start: a.end,
			end: r.now()
		}))), e.enter("labelEnd"), e.enter("labelMarker"), e.consume(t), e.exit("labelMarker"), e.exit("labelEnd"), c) : n(t);
	}
	function c(t) {
		return t === 40 ? e.attempt(Bb, u, o ? u : d)(t) : t === 91 ? e.attempt(Vb, u, o ? l : d)(t) : o ? u(t) : d(t);
	}
	function l(t) {
		return e.attempt(Hb, u, d)(t);
	}
	function u(e) {
		return i.pop(), t(e);
	}
	function d(e) {
		return a._balanced = !0, n(e);
	}
}
function Kb(e, t, n) {
	return r;
	function r(t) {
		return e.enter("resource"), e.enter("resourceMarker"), e.consume(t), e.exit("resourceMarker"), i;
	}
	function i(t) {
		return by(t) ? bb(e, a)(t) : a(t);
	}
	function a(t) {
		return t === 41 ? u(t) : _b(e, o, s, "resourceDestination", "resourceDestinationLiteral", "resourceDestinationLiteralMarker", "resourceDestinationRaw", "resourceDestinationString", 32)(t);
	}
	function o(t) {
		return by(t) ? bb(e, c)(t) : u(t);
	}
	function s(e) {
		return n(e);
	}
	function c(t) {
		return t === 34 || t === 39 || t === 40 ? yb(e, l, n, "resourceTitle", "resourceTitleMarker", "resourceTitleString")(t) : u(t);
	}
	function l(t) {
		return by(t) ? bb(e, u)(t) : u(t);
	}
	function u(r) {
		return r === 41 ? (e.enter("resourceMarker"), e.consume(r), e.exit("resourceMarker"), e.exit("resource"), t) : n(r);
	}
}
function qb(e, t, n) {
	let r = this;
	return i;
	function i(t) {
		return vb.call(r, e, a, o, "reference", "referenceMarker", "referenceString")(t);
	}
	function a(e) {
		return r.parser.defined.includes(fy(r.sliceSerialize(r.events[r.events.length - 1][1]).slice(1, -1))) ? t(e) : n(e);
	}
	function o(e) {
		return n(e);
	}
}
function Jb(e, t, n) {
	return r;
	function r(t) {
		return e.enter("reference"), e.enter("referenceMarker"), e.consume(t), e.exit("referenceMarker"), i;
	}
	function i(r) {
		return r === 93 ? (e.enter("referenceMarker"), e.consume(r), e.exit("referenceMarker"), e.exit("reference"), t) : n(r);
	}
}
// node_modules/streamdown/node_modules/micromark-core-commonmark/lib/label-start-image.js
var Yb = {
	name: "labelStartImage",
	resolveAll: zb.resolveAll,
	tokenize: Xb
};
function Xb(e, t, n) {
	let r = this, i;
	return a;
	function a(t) {
		return e.enter("labelImage"), e.enter("labelImageMarker"), e.consume(t), e.exit("labelImageMarker"), o;
	}
	function o(t) {
		return t === 91 ? (e.enter("labelMarker"), e.consume(t), e.exit("labelMarker"), i = e.exit("labelImage"), s) : n(t);
	}
	function s(e) {
		return e === 94 && "_hiddenFootnoteSupport" in r.parser.constructs ? n(e) : (r._labelStarts = r._labelStarts || [], r._labelStarts.push(i), t(e));
	}
}
// node_modules/streamdown/node_modules/micromark-core-commonmark/lib/label-start-link.js
var Zb = {
	name: "labelStartLink",
	resolveAll: zb.resolveAll,
	tokenize: Qb
};
function Qb(e, t, n) {
	let r = this, i;
	return a;
	function a(t) {
		return e.enter("labelLink"), e.enter("labelMarker"), e.consume(t), e.exit("labelMarker"), i = e.exit("labelLink"), o;
	}
	function o(e) {
		return e === 94 && "_hiddenFootnoteSupport" in r.parser.constructs ? n(e) : (r._labelStarts = r._labelStarts || [], r._labelStarts.push(i), t(e));
	}
}
// node_modules/streamdown/node_modules/micromark-core-commonmark/lib/line-ending.js
var $b = {
	name: "lineEnding",
	tokenize: ex
};
function ex(e, t) {
	return n;
	function n(n) {
		return e.enter("lineEnding"), e.consume(n), e.exit("lineEnding"), Ty(e, t, "linePrefix");
	}
}
// node_modules/streamdown/node_modules/micromark-core-commonmark/lib/thematic-break.js
var tx = {
	name: "thematicBreak",
	tokenize: nx
};
function nx(e, t, n) {
	let r = 0, i;
	return a;
	function a(t) {
		return e.enter("thematicBreak"), o(t);
	}
	function o(e) {
		return i = e, s(e);
	}
	function s(a) {
		return a === i ? (e.enter("thematicBreakSequence"), c(a)) : r >= 3 && (a === null || J(a)) ? (e.exit("thematicBreak"), t(a)) : n(a);
	}
	function c(t) {
		return t === i ? (e.consume(t), r++, c) : (e.exit("thematicBreakSequence"), Y(t) ? Ty(e, s, "whitespace")(t) : s(t));
	}
}
// node_modules/streamdown/node_modules/micromark-core-commonmark/lib/list.js
var rx = {
	continuation: { tokenize: sx },
	exit: lx,
	name: "list",
	tokenize: ox
}, ix = {
	partial: !0,
	tokenize: ux
}, ax = {
	partial: !0,
	tokenize: cx
};
function ox(e, t, n) {
	let r = this, i = r.events[r.events.length - 1], a = i && i[1].type === "linePrefix" ? i[2].sliceSerialize(i[1], !0).length : 0, o = 0;
	return s;
	function s(t) {
		let i = r.containerState.type || (t === 42 || t === 43 || t === 45 ? "listUnordered" : "listOrdered");
		if (i === "listUnordered" ? !r.containerState.marker || t === r.containerState.marker : _y(t)) {
			if (r.containerState.type || (r.containerState.type = i, e.enter(i, { _container: !0 })), i === "listUnordered") return e.enter("listItemPrefix"), t === 42 || t === 45 ? e.check(tx, n, l)(t) : l(t);
			if (!r.interrupt || t === 49) return e.enter("listItemPrefix"), e.enter("listItemValue"), c(t);
		}
		return n(t);
	}
	function c(t) {
		return _y(t) && ++o < 10 ? (e.consume(t), c) : (!r.interrupt || o < 2) && (r.containerState.marker ? t === r.containerState.marker : t === 41 || t === 46) ? (e.exit("listItemValue"), l(t)) : n(t);
	}
	function l(t) {
		return e.enter("listItemMarker"), e.consume(t), e.exit("listItemMarker"), r.containerState.marker = r.containerState.marker || t, e.check(By, r.interrupt ? n : u, e.attempt(ix, f, d));
	}
	function u(e) {
		return r.containerState.initialBlankLine = !0, a++, f(e);
	}
	function d(t) {
		return Y(t) ? (e.enter("listItemPrefixWhitespace"), e.consume(t), e.exit("listItemPrefixWhitespace"), f) : n(t);
	}
	function f(n) {
		return r.containerState.size = a + r.sliceSerialize(e.exit("listItemPrefix"), !0).length, t(n);
	}
}
function sx(e, t, n) {
	let r = this;
	return r.containerState._closeFlow = void 0, e.check(By, i, a);
	function i(n) {
		return r.containerState.furtherBlankLines = r.containerState.furtherBlankLines || r.containerState.initialBlankLine, Ty(e, t, "listItemIndent", r.containerState.size + 1)(n);
	}
	function a(n) {
		return r.containerState.furtherBlankLines || !Y(n) ? (r.containerState.furtherBlankLines = void 0, r.containerState.initialBlankLine = void 0, o(n)) : (r.containerState.furtherBlankLines = void 0, r.containerState.initialBlankLine = void 0, e.attempt(ax, t, o)(n));
	}
	function o(i) {
		return r.containerState._closeFlow = !0, r.interrupt = void 0, Ty(e, e.attempt(rx, t, n), "linePrefix", r.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(i);
	}
}
function cx(e, t, n) {
	let r = this;
	return Ty(e, i, "listItemIndent", r.containerState.size + 1);
	function i(e) {
		let i = r.events[r.events.length - 1];
		return i && i[1].type === "listItemIndent" && i[2].sliceSerialize(i[1], !0).length === r.containerState.size ? t(e) : n(e);
	}
}
function lx(e) {
	e.exit(this.containerState.type);
}
function ux(e, t, n) {
	let r = this;
	return Ty(e, i, "listItemPrefixWhitespace", r.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 5);
	function i(e) {
		let i = r.events[r.events.length - 1];
		return !Y(e) && i && i[1].type === "listItemPrefixWhitespace" ? t(e) : n(e);
	}
}
// node_modules/streamdown/node_modules/micromark-core-commonmark/lib/setext-underline.js
var dx = {
	name: "setextUnderline",
	resolveTo: fx,
	tokenize: px
};
function fx(e, t) {
	let n = new Dp(), r = e.length, i, a, o;
	for (; r--;) if (e[r][0] === "enter") {
		if (e[r][1].type === "content") {
			i = r;
			break;
		}
		e[r][1].type === "paragraph" && (a = r);
	} else e[r][1].type === "content" && n.add(r, 1, []), !o && e[r][1].type === "definition" && (o = r);
	let s = {
		type: "setextHeading",
		start: { ...e[i][1].start },
		end: { ...e[e.length - 1][1].end }
	};
	return e[a][1].type = "setextHeadingText", o ? (n.add(a, 0, [[
		"enter",
		s,
		t
	]]), n.add(o + 1, 0, [[
		"exit",
		e[i][1],
		t
	]]), e[i][1].end = { ...e[o][1].end }) : e[i][1] = s, n.add(e.length, 0, [[
		"exit",
		s,
		t
	]]), n.consume(e), e;
}
function px(e, t, n) {
	let r = this, i;
	return a;
	function a(t) {
		let a = r.events.length, s;
		for (; a--;) if (r.events[a][1].type !== "lineEnding" && r.events[a][1].type !== "linePrefix" && r.events[a][1].type !== "content") {
			s = r.events[a][1].type === "paragraph";
			break;
		}
		return !r.parser.lazy[r.now().line] && (r.interrupt || s) ? (e.enter("setextHeadingLine"), i = t, o(t)) : n(t);
	}
	function o(t) {
		return e.enter("setextHeadingLineSequence"), s(t);
	}
	function s(t) {
		return t === i ? (e.consume(t), s) : (e.exit("setextHeadingLineSequence"), Y(t) ? Ty(e, c, "lineSuffix")(t) : c(t));
	}
	function c(r) {
		return r === null || J(r) ? (e.exit("setextHeadingLine"), t(r)) : n(r);
	}
}
// node_modules/streamdown/node_modules/micromark/lib/initialize/flow.js
var mx = { tokenize: hx };
function hx(e) {
	let t = this, n = e.attempt(By, r, e.attempt(this.parser.constructs.flowInitial, i, Ty(e, e.attempt(this.parser.constructs.flow, i, e.attempt(fb, i)), "linePrefix")));
	return n;
	function r(r) {
		if (r === null) e.consume(r);
		else return e.enter("lineEndingBlank"), e.consume(r), e.exit("lineEndingBlank"), t.currentConstruct = void 0, n;
	}
	function i(r) {
		if (r === null) e.consume(r);
		else return e.enter("lineEnding"), e.consume(r), e.exit("lineEnding"), t.currentConstruct = void 0, n;
	}
}
// node_modules/streamdown/node_modules/micromark/lib/initialize/text.js
var gx = { resolveAll: bx() }, _x = yx("string"), vx = yx("text");
function yx(e) {
	return {
		resolveAll: bx(e === "text" ? xx : void 0),
		tokenize: t
	};
	function t(t) {
		let n = this, r = this.parser.constructs[e], i = t.attempt(r, a, o);
		return a;
		function a(e) {
			return c(e) ? i(e) : o(e);
		}
		function o(e) {
			if (e === null) t.consume(e);
			else return t.enter("data"), t.consume(e), s;
		}
		function s(e) {
			return c(e) ? (t.exit("data"), i(e)) : (t.consume(e), s);
		}
		function c(e) {
			if (e === null) return !0;
			let t = r[e], i = -1;
			if (t) for (; ++i < t.length;) {
				let e = t[i];
				if (!e.previous || e.previous.call(n, n.previous)) return !0;
			}
			return !1;
		}
	}
}
function bx(e) {
	return t;
	function t(t, n) {
		let r = -1, i;
		for (; ++r <= t.length;) i === void 0 ? t[r] && t[r][1].type === "data" && (i = r, r++) : t[r] && t[r][1].type === "data" || (r !== i + 2 && (t[i][1].end = t[r - 1][1].end, t.splice(i + 2, r - i - 2), r = i + 2), i = void 0);
		return e ? e(t, n) : t;
	}
}
function xx(e, t) {
	let n = new Dp(), r = 0;
	for (; ++r <= e.length;) if ((r === e.length || e[r][1].type === "lineEnding") && e[r - 1][1].type === "data") {
		let i = e[r - 1][1], a = t.sliceStream(i), o = a.length, s = -1, c = 0, l;
		for (; o--;) {
			let e = a[o];
			if (typeof e == "string") {
				for (s = e.length; e.charCodeAt(s - 1) === 32;) c++, s--;
				if (s) break;
				s = -1;
			} else if (e === -2) l = !0, c++;
			else if (e !== -1) {
				o++;
				break;
			}
		}
		if (t._contentTypeTextTrailing && r === e.length && (c = 0), c) {
			let a = {
				type: r === e.length || l || c < 2 ? "lineSuffix" : "hardBreakTrailing",
				start: {
					_bufferIndex: o ? s : i.start._bufferIndex + s,
					_index: i.start._index + o,
					line: i.end.line,
					column: i.end.column - c,
					offset: i.end.offset - c
				},
				end: { ...i.end }
			};
			i.end = { ...a.start }, i.start.offset === i.end.offset ? Object.assign(i, a) : n.add(r, 0, [[
				"enter",
				a,
				t
			], [
				"exit",
				a,
				t
			]]);
		}
		r++;
	}
	return n.consume(e), e;
}
// node_modules/streamdown/node_modules/micromark/lib/constructs.js
var Sx = /* @__PURE__ */ t({
	attentionMarkers: () => Ax,
	contentInitial: () => wx,
	disable: () => jx,
	document: () => Cx,
	flow: () => Ex,
	flowInitial: () => Tx,
	insideSpan: () => kx,
	string: () => Dx,
	text: () => Ox
}), Cx = {
	42: rx,
	43: rx,
	45: rx,
	48: rx,
	49: rx,
	50: rx,
	51: rx,
	52: rx,
	53: rx,
	54: rx,
	55: rx,
	56: rx,
	57: rx,
	62: Hy
}, wx = { 91: xb }, Tx = {
	[-2]: eb,
	[-1]: eb,
	32: eb
}, Ex = {
	35: Db,
	42: tx,
	45: [dx, tx],
	60: Mb,
	61: dx,
	95: tx,
	96: Qy,
	126: Qy
}, Dx = {
	38: Jy,
	92: Ky
}, Ox = {
	[-5]: $b,
	[-4]: $b,
	[-3]: $b,
	33: Yb,
	38: Jy,
	42: Py,
	60: [Ry, Lb],
	91: Zb,
	92: [Tb, Ky],
	93: zb,
	95: Py,
	96: ib
}, kx = { null: [Py, gx] }, Ax = { null: [42, 95] }, jx = { null: [] };
// node_modules/streamdown/node_modules/micromark/lib/create-tokenizer.js
function Mx(e, t, n) {
	let r = {
		_bufferIndex: -1,
		_index: 0,
		line: n && n.line || 1,
		column: n && n.column || 1,
		offset: n && n.offset || 0
	}, i = {}, a = [], o = [], s = [], c = {
		attempt: x(ee),
		check: x(te),
		consume: v,
		enter: y,
		exit: b,
		interrupt: x(te, { interrupt: !0 })
	}, l = {
		code: null,
		containerState: {},
		defineSkip: h,
		events: [],
		now: m,
		parser: e,
		previous: null,
		sliceSerialize: f,
		sliceStream: p,
		write: d
	}, u = t.tokenize.call(l, c);
	return t.resolveAll && a.push(t), l;
	function d(e) {
		return o = Il(o, e), g(), o[o.length - 1] === null ? (S(t, 0), l.events = Ll(a, l.events, l), l.events) : [];
	}
	function f(e, t) {
		return Px(p(e), t);
	}
	function p(e) {
		return Nx(o, e);
	}
	function m() {
		let { _bufferIndex: e, _index: t, line: n, column: i, offset: a } = r;
		return {
			_bufferIndex: e,
			_index: t,
			line: n,
			column: i,
			offset: a
		};
	}
	function h(e) {
		i[e.line] = e.column, ne();
	}
	function g() {
		for (; r._index < o.length;) {
			let e = o[r._index];
			if (typeof e == "string") {
				let t = r._index;
				for (r._bufferIndex < 0 && (r._bufferIndex = 0); r._index === t && r._bufferIndex < e.length;) _(e.charCodeAt(r._bufferIndex));
			} else _(e);
		}
	}
	function _(e) {
		u = u(e);
	}
	function v(e) {
		J(e) ? (r.line++, r.column = 1, r.offset += e === -3 ? 2 : 1, ne()) : e !== -1 && (r.column++, r.offset++), r._bufferIndex < 0 ? r._index++ : (r._bufferIndex++, r._bufferIndex === o[r._index].length && (r._bufferIndex = -1, r._index++)), l.previous = e;
	}
	function y(e, t) {
		let n = t || {};
		return n.type = e, n.start = m(), l.events.push([
			"enter",
			n,
			l
		]), s.push(n), n;
	}
	function b(e) {
		let t = s.pop();
		return t.end = m(), l.events.push([
			"exit",
			t,
			l
		]), t;
	}
	function ee(e, t) {
		S(e, t.from);
	}
	function te(e, t) {
		t.restore();
	}
	function x(e, t) {
		return n;
		function n(n, r, i) {
			let a, o, s, u;
			return Array.isArray(n) ? f(n) : "tokenize" in n ? f([n]) : d(n);
			function d(e) {
				return t;
				function t(t) {
					let n = t !== null && e[t], r = t !== null && e.null;
					return f([...Array.isArray(n) ? n : n ? [n] : [], ...Array.isArray(r) ? r : r ? [r] : []])(t);
				}
			}
			function f(e) {
				return a = e, o = 0, e.length === 0 ? i : p(e[o]);
			}
			function p(e) {
				return n;
				function n(n) {
					return u = C(), s = e, e.partial || (l.currentConstruct = e), e.name && l.parser.constructs.disable.null.includes(e.name) ? h(n) : e.tokenize.call(t ? Object.assign(Object.create(l), t) : l, c, m, h)(n);
				}
			}
			function m(t) {
				return e(s, u), r;
			}
			function h(e) {
				return u.restore(), ++o < a.length ? p(a[o]) : i;
			}
		}
	}
	function S(e, t) {
		e.resolveAll && !a.includes(e) && a.push(e), e.resolve && Fl(l.events, t, l.events.length - t, e.resolve(l.events.slice(t), l)), e.resolveTo && (l.events = e.resolveTo(l.events, l));
	}
	function C() {
		let e = m(), t = l.previous, n = l.currentConstruct, i = l.events.length, a = Array.from(s);
		return {
			from: i,
			restore: o
		};
		function o() {
			r = e, l.previous = t, l.currentConstruct = n, l.events.length = i, s = a, ne();
		}
	}
	function ne() {
		r.line in i && r.column < 2 && (r.column = i[r.line], r.offset += i[r.line] - 1);
	}
}
function Nx(e, t) {
	let n = t.start._index, r = t.start._bufferIndex, i = t.end._index, a = t.end._bufferIndex, o;
	if (n === i) o = [e[n].slice(r, a)];
	else {
		if (o = e.slice(n, i), r > -1) {
			let e = o[0];
			typeof e == "string" ? o[0] = e.slice(r) : o.shift();
		}
		a > 0 && o.push(e[i].slice(0, a));
	}
	return o;
}
function Px(e, t) {
	let n = -1, r = [], i;
	for (; ++n < e.length;) {
		let a = e[n], o;
		if (typeof a == "string") o = a;
		else switch (a) {
			case -5:
				o = "\r";
				break;
			case -4:
				o = "\n";
				break;
			case -3:
				o = "\r\n";
				break;
			case -2:
				o = t ? " " : "	";
				break;
			case -1:
				if (!t && i) continue;
				o = " ";
				break;
			default: o = String.fromCharCode(a);
		}
		i = a === -2, r.push(o);
	}
	return r.join("");
}
// node_modules/streamdown/node_modules/micromark/lib/parse.js
function Fx(e) {
	let t = {
		constructs: cy([Sx, ...(e || {}).extensions || []]),
		content: n(Dy),
		defined: [],
		document: n(ky),
		flow: n(mx),
		lazy: {},
		string: n(_x),
		text: n(vx)
	};
	return t;
	function n(e) {
		return n;
		function n(n) {
			return Mx(t, e, n);
		}
	}
}
// node_modules/streamdown/node_modules/micromark/lib/postprocess.js
function Ix(e) {
	for (; !ub(e););
	return e;
}
// node_modules/streamdown/node_modules/micromark/lib/preprocess.js
var Lx = /[\0\t\n\r]/g;
function Rx() {
	let e = 1, t = "", n = !0, r;
	return i;
	function i(i, a, o) {
		i = t + (typeof i == "string" ? i.toString() : new TextDecoder(a || void 0).decode(i));
		let s = [], c = 0;
		for (t = "", n &&= (i.charCodeAt(0) === 65279 && c++, void 0); c < i.length;) {
			Lx.lastIndex = c;
			let n = Lx.exec(i), a = n && n.index !== void 0 ? n.index : i.length, o = i.charCodeAt(a);
			if (!n) {
				t = i.slice(c);
				break;
			}
			if (o === 10 && c === a && r) s.push(-3), r = void 0;
			else switch (r &&= (s.push(-5), void 0), c < a && (s.push(i.slice(c, a)), e += a - c), o) {
				case 0:
					s.push(65533), e++;
					break;
				case 9: {
					let t = Math.ceil(e / 4) * 4;
					for (s.push(-2); e++ < t;) s.push(-1);
					break;
				}
				case 10:
					s.push(-4), e = 1;
					break;
				default: r = !0, e = 1;
			}
			c = a + 1;
		}
		return o && (r && s.push(-5), t && s.push(t), s.push(null)), s;
	}
}
// node_modules/streamdown/node_modules/micromark-util-decode-string/index.js
var zx = /\\([!-/:-@[-`{-~])|&(#(?:\d{1,7}|x[\da-f]{1,6})|[\da-z]{1,31});/gi;
function Bx(e) {
	return e.replace(zx, Vx);
}
function Vx(e, t, n) {
	if (t) return t;
	if (n.charCodeAt(0) === 35) {
		let e = n.charCodeAt(1), t = e === 120 || e === 88;
		return dy(n.slice(t ? 2 : 1), t ? 16 : 10);
	}
	return xf(n) || e;
}
// node_modules/streamdown/node_modules/unist-util-stringify-position/lib/index.js
function Hx(e) {
	return !e || typeof e != "object" ? "" : "position" in e || "type" in e ? Wx(e.position) : "start" in e || "end" in e ? Wx(e) : "line" in e || "column" in e ? Ux(e) : "";
}
function Ux(e) {
	return Gx(e && e.line) + ":" + Gx(e && e.column);
}
function Wx(e) {
	return Ux(e && e.start) + "-" + Ux(e && e.end);
}
function Gx(e) {
	return e && typeof e == "number" ? e : 1;
}
// node_modules/streamdown/node_modules/mdast-util-from-markdown/lib/index.js
var Kx = {}.hasOwnProperty;
function qx(e, t, n) {
	return t && typeof t == "object" && (n = t, t = void 0), Jx(n)(Ix(Fx(n).document().write(Rx()(e, t, !0))));
}
function Jx(e) {
	let t = {
		afterExit: [],
		beforeEnter: [],
		transforms: [],
		canContainEols: [
			"emphasis",
			"fragment",
			"heading",
			"paragraph",
			"strong"
		],
		enter: {
			autolink: o(De),
			autolinkProtocol: ne,
			autolinkEmail: ne,
			atxHeading: o(Ce),
			blockQuote: o(ve),
			characterEscape: ne,
			characterReference: ne,
			codeFenced: o(ye),
			codeFencedFenceInfo: s,
			codeFencedFenceMeta: s,
			codeIndented: o(ye, s),
			codeText: o(be, s),
			codeTextData: ne,
			data: ne,
			codeFlowValue: ne,
			definition: o(xe),
			definitionDestinationString: s,
			definitionLabelString: s,
			definitionTitleString: s,
			emphasis: o(Se),
			hardBreakEscape: o(we),
			hardBreakTrailing: o(we),
			htmlFlow: o(Te, s),
			htmlFlowData: ne,
			htmlText: o(Te, s),
			htmlTextData: ne,
			image: o(Ee),
			label: s,
			link: o(De),
			listItem: o(ke),
			listItemValue: p,
			listOrdered: o(Oe, f),
			listUnordered: o(Oe),
			paragraph: o(Ae),
			reference: me,
			referenceString: s,
			resourceDestinationString: s,
			resourceTitleString: s,
			setextHeading: o(Ce),
			strong: o(je),
			thematicBreak: o(Ne)
		},
		exit: {
			atxHeading: l(),
			atxHeadingSequence: te,
			autolink: l(),
			autolinkEmail: O,
			autolinkProtocol: D,
			blockQuote: l(),
			characterEscapeValue: re,
			characterReferenceMarkerHexadecimal: E,
			characterReferenceMarkerNumeric: E,
			characterReferenceValue: ge,
			characterReference: _e,
			codeFenced: l(_),
			codeFencedFence: g,
			codeFencedFenceInfo: m,
			codeFencedFenceMeta: h,
			codeFlowValue: re,
			codeIndented: l(v),
			codeText: l(se),
			codeTextData: re,
			data: re,
			definition: l(),
			definitionDestinationString: ee,
			definitionLabelString: y,
			definitionTitleString: b,
			emphasis: l(),
			hardBreakEscape: l(ie),
			hardBreakTrailing: l(ie),
			htmlFlow: l(ae),
			htmlFlowData: re,
			htmlText: l(oe),
			htmlTextData: re,
			image: l(le),
			label: T,
			labelText: ue,
			lineEnding: w,
			link: l(ce),
			listItem: l(),
			listOrdered: l(),
			listUnordered: l(),
			paragraph: l(),
			referenceString: he,
			resourceDestinationString: de,
			resourceTitleString: fe,
			resource: pe,
			setextHeading: l(C),
			setextHeadingLineSequence: S,
			setextHeadingText: x,
			strong: l(),
			thematicBreak: l()
		}
	};
	Xx(t, (e || {}).mdastExtensions || []);
	let n = {};
	return r;
	function r(e) {
		let r = {
			type: "root",
			children: [],
			position: void 0
		}, o = {
			stack: [r],
			tokenStack: [],
			config: t,
			enter: c,
			exit: u,
			buffer: s,
			resume: d,
			data: n
		}, l = [], f = [], p = -1;
		for (; ++p < e.length;) f.push(e[p]), (e[p][1].type === "listOrdered" || e[p][1].type === "listUnordered") && (e[p][0] === "enter" ? l.push(f.length - 1) : a(f, l.pop()));
		for (e = f, p = -1; ++p < e.length;) {
			let n = t[e[p][0]];
			e[p][0] === "enter" && t.beforeEnter.length > 0 && i(t.beforeEnter, {
				...o,
				sliceSerialize: e[p][2].sliceSerialize
			}, e[p][1]), Kx.call(n, e[p][1].type) && n[e[p][1].type].call({
				...o,
				sliceSerialize: e[p][2].sliceSerialize
			}, e[p][1]), e[p][0] === "exit" && t.afterExit.length > 0 && i(t.afterExit, {
				...o,
				sliceSerialize: e[p][2].sliceSerialize
			}, e[p][1]);
		}
		if (o.tokenStack.length > 0) {
			let e = o.tokenStack[o.tokenStack.length - 1];
			(e[1] || Qx).call(o, void 0, e[0]);
		}
		for (r.position = {
			start: Yx(e.length > 0 ? e[0][1].start : {
				line: 1,
				column: 1,
				offset: 0
			}),
			end: Yx(e.length > 0 ? e[e.length - 2][1].end : {
				line: 1,
				column: 1,
				offset: 0
			})
		}, p = -1; ++p < t.transforms.length;) r = t.transforms[p](r) || r;
		return r;
	}
	function i(e, t, n) {
		let r = -1;
		for (; ++r < e.length;) e[r].call(t, n);
	}
	function a(e, t) {
		let n = e.length - 1, r = t - 1, i = -1, a = !1, o, s, c, l, u = [];
		for (; ++r <= n;) {
			let t = e[r];
			switch (t[1].type) {
				case "listUnordered":
				case "listOrdered":
				case "blockQuote":
					t[0] === "enter" ? i++ : i--, l = void 0;
					break;
				case "lineEndingBlank":
					t[0] === "enter" && (o && !l && !i && !c && (c = r), l = void 0);
					break;
				case "linePrefix":
				case "listItemValue":
				case "listItemMarker":
				case "listItemPrefix":
				case "listItemPrefixWhitespace": break;
				default: l = void 0;
			}
			if (!i && t[0] === "enter" && t[1].type === "listItemPrefix" || i === -1 && t[0] === "exit" && (t[1].type === "listUnordered" || t[1].type === "listOrdered")) {
				if (o) {
					let n = r;
					for (s = void 0; n--;) {
						let t = e[n];
						if (t[1].type === "lineEnding" || t[1].type === "lineEndingBlank") {
							if (t[0] === "exit") continue;
							s && (e[s][1].type = "lineEndingBlank", a = !0), t[1].type = "lineEnding", s = n;
						} else if (t[1].type !== "linePrefix" && t[1].type !== "blockQuotePrefix" && t[1].type !== "blockQuotePrefixWhitespace" && t[1].type !== "blockQuoteMarker" && t[1].type !== "listItemIndent") break;
					}
					c && (!s || c < s) && (o._spread = !0), o.end = Object.assign({}, s ? e[s][1].start : t[1].end), u.push({
						at: s || r,
						event: [
							"exit",
							o,
							t[2]
						]
					});
				}
				if (t[1].type === "listItemPrefix") {
					let e = {
						type: "listItem",
						_spread: !1,
						start: Object.assign({}, t[1].start),
						end: void 0
					};
					o = e, u.push({
						at: r,
						event: [
							"enter",
							e,
							t[2]
						]
					}), c = void 0, l = !0;
				}
			}
		}
		let d = e.splice(t), f = 0;
		for (r = -1; ++r < d.length;) {
			for (; f < u.length && u[f].at === t + r;) e.push(u[f++].event);
			e.push(d[r]);
		}
		e[t][1]._spread = a;
	}
	function o(e, t) {
		return n;
		function n(n) {
			c.call(this, e(n), n), t && t.call(this, n);
		}
	}
	function s() {
		this.stack.push({
			type: "fragment",
			children: []
		});
	}
	function c(e, t, n) {
		this.stack[this.stack.length - 1].children.push(e), this.stack.push(e), this.tokenStack.push([t, n || void 0]), e.position = {
			start: Yx(t.start),
			end: void 0
		};
	}
	function l(e) {
		return t;
		function t(t) {
			e && e.call(this, t), u.call(this, t);
		}
	}
	function u(e, t) {
		let n = this.stack.pop(), r = this.tokenStack.pop();
		if (!r) throw Error("Cannot close `" + e.type + "` (" + Hx({
			start: e.start,
			end: e.end
		}) + "): it’s not open");
		r[0].type !== e.type && (t ? t.call(this, e, r[0]) : (r[1] || Qx).call(this, e, r[0])), n.position.end = Yx(e.end);
	}
	function d() {
		return ry(this.stack.pop());
	}
	function f() {
		this.data.expectingFirstListItemValue = !0;
	}
	function p(e) {
		if (this.data.expectingFirstListItemValue) {
			let t = this.stack[this.stack.length - 2];
			t.start = Number.parseInt(this.sliceSerialize(e), 10), this.data.expectingFirstListItemValue = void 0;
		}
	}
	function m() {
		let e = this.resume(), t = this.stack[this.stack.length - 1];
		t.lang = e;
	}
	function h() {
		let e = this.resume(), t = this.stack[this.stack.length - 1];
		t.meta = e;
	}
	function g() {
		this.data.flowCodeInside || (this.buffer(), this.data.flowCodeInside = !0);
	}
	function _() {
		let e = this.resume(), t = this.stack[this.stack.length - 1];
		t.value = e.replace(/^(\r?\n|\r)|(\r?\n|\r)$/g, ""), this.data.flowCodeInside = void 0;
	}
	function v() {
		let e = this.resume(), t = this.stack[this.stack.length - 1];
		t.value = e.replace(/(\r?\n|\r)$/g, "");
	}
	function y(e) {
		let t = this.resume(), n = this.stack[this.stack.length - 1];
		n.label = t, n.identifier = fy(this.sliceSerialize(e)).toLowerCase();
	}
	function b() {
		let e = this.resume(), t = this.stack[this.stack.length - 1];
		t.title = e;
	}
	function ee() {
		let e = this.resume(), t = this.stack[this.stack.length - 1];
		t.url = e;
	}
	function te(e) {
		let t = this.stack[this.stack.length - 1];
		t.depth ||= this.sliceSerialize(e).length;
	}
	function x() {
		this.data.setextHeadingSlurpLineEnding = !0;
	}
	function S(e) {
		let t = this.stack[this.stack.length - 1];
		t.depth = this.sliceSerialize(e).codePointAt(0) === 61 ? 1 : 2;
	}
	function C() {
		this.data.setextHeadingSlurpLineEnding = void 0;
	}
	function ne(e) {
		let t = this.stack[this.stack.length - 1].children, n = t[t.length - 1];
		n && n.type === "text" || (n = Me(), n.position = {
			start: Yx(e.start),
			end: void 0
		}, t.push(n)), this.stack.push(n);
	}
	function re(e) {
		let t = this.stack.pop();
		t.value += this.sliceSerialize(e), t.position.end = Yx(e.end);
	}
	function w(e) {
		let n = this.stack[this.stack.length - 1];
		if (this.data.atHardBreak) {
			let t = n.children[n.children.length - 1];
			t.position.end = Yx(e.end), this.data.atHardBreak = void 0;
		} else !this.data.setextHeadingSlurpLineEnding && t.canContainEols.includes(n.type) && (ne.call(this, e), re.call(this, e));
	}
	function ie() {
		this.data.atHardBreak = !0;
	}
	function ae() {
		let e = this.resume(), t = this.stack[this.stack.length - 1];
		t.value = e;
	}
	function oe() {
		let e = this.resume(), t = this.stack[this.stack.length - 1];
		t.value = e;
	}
	function se() {
		let e = this.resume(), t = this.stack[this.stack.length - 1];
		t.value = e;
	}
	function ce() {
		let e = this.stack[this.stack.length - 1];
		if (this.data.inReference) {
			let t = this.data.referenceType || "shortcut";
			e.type += "Reference", e.referenceType = t, delete e.url, delete e.title;
		} else delete e.identifier, delete e.label;
		this.data.referenceType = void 0;
	}
	function le() {
		let e = this.stack[this.stack.length - 1];
		if (this.data.inReference) {
			let t = this.data.referenceType || "shortcut";
			e.type += "Reference", e.referenceType = t, delete e.url, delete e.title;
		} else delete e.identifier, delete e.label;
		this.data.referenceType = void 0;
	}
	function ue(e) {
		let t = this.sliceSerialize(e), n = this.stack[this.stack.length - 2];
		n.label = Bx(t), n.identifier = fy(t).toLowerCase();
	}
	function T() {
		let e = this.stack[this.stack.length - 1], t = this.resume(), n = this.stack[this.stack.length - 1];
		this.data.inReference = !0, n.type === "link" ? n.children = e.children : n.alt = t;
	}
	function de() {
		let e = this.resume(), t = this.stack[this.stack.length - 1];
		t.url = e;
	}
	function fe() {
		let e = this.resume(), t = this.stack[this.stack.length - 1];
		t.title = e;
	}
	function pe() {
		this.data.inReference = void 0;
	}
	function me() {
		this.data.referenceType = "collapsed";
	}
	function he(e) {
		let t = this.resume(), n = this.stack[this.stack.length - 1];
		n.label = t, n.identifier = fy(this.sliceSerialize(e)).toLowerCase(), this.data.referenceType = "full";
	}
	function E(e) {
		this.data.characterReferenceType = e.type;
	}
	function ge(e) {
		let t = this.sliceSerialize(e), n = this.data.characterReferenceType, r;
		n ? (r = dy(t, n === "characterReferenceMarkerNumeric" ? 10 : 16), this.data.characterReferenceType = void 0) : r = xf(t);
		let i = this.stack[this.stack.length - 1];
		i.value += r;
	}
	function _e(e) {
		let t = this.stack.pop();
		t.position.end = Yx(e.end);
	}
	function D(e) {
		re.call(this, e);
		let t = this.stack[this.stack.length - 1];
		t.url = this.sliceSerialize(e);
	}
	function O(e) {
		re.call(this, e);
		let t = this.stack[this.stack.length - 1];
		t.url = "mailto:" + this.sliceSerialize(e);
	}
	function ve() {
		return {
			type: "blockquote",
			children: [],
			position: void 0
		};
	}
	function ye() {
		return {
			type: "code",
			lang: null,
			meta: null,
			value: "",
			position: void 0
		};
	}
	function be() {
		return {
			type: "inlineCode",
			value: "",
			position: void 0
		};
	}
	function xe() {
		return {
			type: "definition",
			identifier: "",
			label: null,
			title: null,
			url: "",
			position: void 0
		};
	}
	function Se() {
		return {
			type: "emphasis",
			children: [],
			position: void 0
		};
	}
	function Ce() {
		return {
			type: "heading",
			depth: 0,
			children: [],
			position: void 0
		};
	}
	function we() {
		return {
			type: "break",
			position: void 0
		};
	}
	function Te() {
		return {
			type: "html",
			value: "",
			position: void 0
		};
	}
	function Ee() {
		return {
			type: "image",
			title: null,
			url: "",
			alt: null,
			position: void 0
		};
	}
	function De() {
		return {
			type: "link",
			title: null,
			url: "",
			children: [],
			position: void 0
		};
	}
	function Oe(e) {
		return {
			type: "list",
			ordered: e.type === "listOrdered",
			start: null,
			spread: e._spread,
			children: [],
			position: void 0
		};
	}
	function ke(e) {
		return {
			type: "listItem",
			spread: e._spread,
			checked: null,
			children: [],
			position: void 0
		};
	}
	function Ae() {
		return {
			type: "paragraph",
			children: [],
			position: void 0
		};
	}
	function je() {
		return {
			type: "strong",
			children: [],
			position: void 0
		};
	}
	function Me() {
		return {
			type: "text",
			value: "",
			position: void 0
		};
	}
	function Ne() {
		return {
			type: "thematicBreak",
			position: void 0
		};
	}
}
function Yx(e) {
	return {
		line: e.line,
		column: e.column,
		offset: e.offset
	};
}
function Xx(e, t) {
	let n = -1;
	for (; ++n < t.length;) {
		let r = t[n];
		Array.isArray(r) ? Xx(e, r) : Zx(e, r);
	}
}
function Zx(e, t) {
	let n;
	for (n in t) if (Kx.call(t, n)) switch (n) {
		case "canContainEols": {
			let r = t[n];
			r && e[n].push(...r);
			break;
		}
		case "transforms": {
			let r = t[n];
			r && e[n].push(...r);
			break;
		}
		case "afterExit":
		case "beforeEnter": {
			let r = t[n];
			r && e[n].push(r);
			break;
		}
		case "enter":
		case "exit": {
			let r = t[n];
			r && Object.assign(e[n], r);
			break;
		}
	}
}
function Qx(e, t) {
	throw Error(e ? "Cannot close `" + e.type + "` (" + Hx({
		start: e.start,
		end: e.end
	}) + "): a different token (`" + t.type + "`, " + Hx({
		start: t.start,
		end: t.end
	}) + ") is open" : "Cannot close document, a token (`" + t.type + "`, " + Hx({
		start: t.start,
		end: t.end
	}) + ") is still open");
}
// node_modules/streamdown/node_modules/remark-parse/lib/index.js
function $x(e) {
	let t = this;
	t.parser = n;
	function n(n) {
		return qx(n, {
			...t.data("settings"),
			...e,
			extensions: t.data("micromarkExtensions") || [],
			mdastExtensions: t.data("fromMarkdownExtensions") || []
		});
	}
}
// node_modules/streamdown/node_modules/mdast-util-to-hast/lib/handlers/blockquote.js
function eS(e, t) {
	let n = {
		type: "element",
		tagName: "blockquote",
		properties: {},
		children: e.wrap(e.all(t), !0)
	};
	return e.patch(t, n), e.applyData(t, n);
}
// node_modules/streamdown/node_modules/mdast-util-to-hast/lib/handlers/break.js
function tS(e, t) {
	let n = {
		type: "element",
		tagName: "br",
		properties: {},
		children: []
	};
	return e.patch(t, n), [e.applyData(t, n), {
		type: "text",
		value: "\n"
	}];
}
// node_modules/streamdown/node_modules/mdast-util-to-hast/lib/handlers/code.js
function nS(e, t) {
	let n = t.value ? t.value + "\n" : "", r = {}, i = t.lang ? t.lang.split(/\s+/) : [];
	i.length > 0 && (r.className = ["language-" + i[0]]);
	let a = {
		type: "element",
		tagName: "code",
		properties: r,
		children: [{
			type: "text",
			value: n
		}]
	};
	return t.meta && (a.data = { meta: t.meta }), e.patch(t, a), a = e.applyData(t, a), a = {
		type: "element",
		tagName: "pre",
		properties: {},
		children: [a]
	}, e.patch(t, a), a;
}
// node_modules/streamdown/node_modules/mdast-util-to-hast/lib/handlers/delete.js
function rS(e, t) {
	let n = {
		type: "element",
		tagName: "del",
		properties: {},
		children: e.all(t)
	};
	return e.patch(t, n), e.applyData(t, n);
}
// node_modules/streamdown/node_modules/mdast-util-to-hast/lib/handlers/emphasis.js
function iS(e, t) {
	let n = {
		type: "element",
		tagName: "em",
		properties: {},
		children: e.all(t)
	};
	return e.patch(t, n), e.applyData(t, n);
}
// node_modules/streamdown/node_modules/mdast-util-to-hast/lib/handlers/footnote-reference.js
function aS(e, t) {
	let n = typeof e.options.clobberPrefix == "string" ? e.options.clobberPrefix : "user-content-", r = String(t.identifier).toUpperCase(), i = wy(r.toLowerCase()), a = e.footnoteOrder.indexOf(r), o, s = e.footnoteCounts.get(r);
	s === void 0 ? (s = 0, e.footnoteOrder.push(r), o = e.footnoteOrder.length) : o = a + 1, s += 1, e.footnoteCounts.set(r, s);
	let c = {
		type: "element",
		tagName: "a",
		properties: {
			href: "#" + n + "fn-" + i,
			id: n + "fnref-" + i + (s > 1 ? "-" + s : ""),
			dataFootnoteRef: !0,
			ariaDescribedBy: ["footnote-label"]
		},
		children: [{
			type: "text",
			value: String(o)
		}]
	};
	e.patch(t, c);
	let l = {
		type: "element",
		tagName: "sup",
		properties: {},
		children: [c]
	};
	return e.patch(t, l), e.applyData(t, l);
}
// node_modules/streamdown/node_modules/mdast-util-to-hast/lib/handlers/heading.js
function oS(e, t) {
	let n = {
		type: "element",
		tagName: "h" + t.depth,
		properties: {},
		children: e.all(t)
	};
	return e.patch(t, n), e.applyData(t, n);
}
// node_modules/streamdown/node_modules/mdast-util-to-hast/lib/handlers/html.js
function sS(e, t) {
	if (e.options.allowDangerousHtml) {
		let n = {
			type: "raw",
			value: t.value
		};
		return e.patch(t, n), e.applyData(t, n);
	}
}
// node_modules/streamdown/node_modules/mdast-util-to-hast/lib/revert.js
function cS(e, t) {
	let n = t.referenceType, r = "]";
	if (n === "collapsed" ? r += "[]" : n === "full" && (r += "[" + (t.label || t.identifier) + "]"), t.type === "imageReference") return [{
		type: "text",
		value: "![" + t.alt + r
	}];
	let i = e.all(t), a = i[0];
	a && a.type === "text" ? a.value = "[" + a.value : i.unshift({
		type: "text",
		value: "["
	});
	let o = i[i.length - 1];
	return o && o.type === "text" ? o.value += r : i.push({
		type: "text",
		value: r
	}), i;
}
// node_modules/streamdown/node_modules/mdast-util-to-hast/lib/handlers/image-reference.js
function lS(e, t) {
	let n = String(t.identifier).toUpperCase(), r = e.definitionById.get(n);
	if (!r) return cS(e, t);
	let i = {
		src: wy(r.url || ""),
		alt: t.alt
	};
	r.title !== null && r.title !== void 0 && (i.title = r.title);
	let a = {
		type: "element",
		tagName: "img",
		properties: i,
		children: []
	};
	return e.patch(t, a), e.applyData(t, a);
}
// node_modules/streamdown/node_modules/mdast-util-to-hast/lib/handlers/image.js
function uS(e, t) {
	let n = { src: wy(t.url) };
	t.alt !== null && t.alt !== void 0 && (n.alt = t.alt), t.title !== null && t.title !== void 0 && (n.title = t.title);
	let r = {
		type: "element",
		tagName: "img",
		properties: n,
		children: []
	};
	return e.patch(t, r), e.applyData(t, r);
}
// node_modules/streamdown/node_modules/mdast-util-to-hast/lib/handlers/inline-code.js
function dS(e, t) {
	let n = {
		type: "text",
		value: t.value.replace(/\r?\n|\r/g, " ")
	};
	e.patch(t, n);
	let r = {
		type: "element",
		tagName: "code",
		properties: {},
		children: [n]
	};
	return e.patch(t, r), e.applyData(t, r);
}
// node_modules/streamdown/node_modules/mdast-util-to-hast/lib/handlers/link-reference.js
function fS(e, t) {
	let n = String(t.identifier).toUpperCase(), r = e.definitionById.get(n);
	if (!r) return cS(e, t);
	let i = { href: wy(r.url || "") };
	r.title !== null && r.title !== void 0 && (i.title = r.title);
	let a = {
		type: "element",
		tagName: "a",
		properties: i,
		children: e.all(t)
	};
	return e.patch(t, a), e.applyData(t, a);
}
// node_modules/streamdown/node_modules/mdast-util-to-hast/lib/handlers/link.js
function pS(e, t) {
	let n = { href: wy(t.url) };
	t.title !== null && t.title !== void 0 && (n.title = t.title);
	let r = {
		type: "element",
		tagName: "a",
		properties: n,
		children: e.all(t)
	};
	return e.patch(t, r), e.applyData(t, r);
}
// node_modules/streamdown/node_modules/mdast-util-to-hast/lib/handlers/list-item.js
function mS(e, t, n) {
	let r = e.all(t), i = n ? hS(n) : gS(t), a = {}, o = [];
	if (typeof t.checked == "boolean") {
		let e = r[0], n;
		e && e.type === "element" && e.tagName === "p" ? n = e : (n = {
			type: "element",
			tagName: "p",
			properties: {},
			children: []
		}, r.unshift(n)), n.children.length > 0 && n.children.unshift({
			type: "text",
			value: " "
		}), n.children.unshift({
			type: "element",
			tagName: "input",
			properties: {
				type: "checkbox",
				checked: t.checked,
				disabled: !0
			},
			children: []
		}), a.className = ["task-list-item"];
	}
	let s = -1;
	for (; ++s < r.length;) {
		let e = r[s];
		(i || s !== 0 || e.type !== "element" || e.tagName !== "p") && o.push({
			type: "text",
			value: "\n"
		}), e.type === "element" && e.tagName === "p" && !i ? o.push(...e.children) : o.push(e);
	}
	let c = r[r.length - 1];
	c && (i || c.type !== "element" || c.tagName !== "p") && o.push({
		type: "text",
		value: "\n"
	});
	let l = {
		type: "element",
		tagName: "li",
		properties: a,
		children: o
	};
	return e.patch(t, l), e.applyData(t, l);
}
function hS(e) {
	let t = !1;
	if (e.type === "list") {
		t = e.spread || !1;
		let n = e.children, r = -1;
		for (; !t && ++r < n.length;) t = gS(n[r]);
	}
	return t;
}
function gS(e) {
	return e.spread ?? e.children.length > 1;
}
// node_modules/streamdown/node_modules/mdast-util-to-hast/lib/handlers/list.js
function _S(e, t) {
	let n = {}, r = e.all(t), i = -1;
	for (typeof t.start == "number" && t.start !== 1 && (n.start = t.start); ++i < r.length;) {
		let e = r[i];
		if (e.type === "element" && e.tagName === "li" && e.properties && Array.isArray(e.properties.className) && e.properties.className.includes("task-list-item")) {
			n.className = ["contains-task-list"];
			break;
		}
	}
	let a = {
		type: "element",
		tagName: t.ordered ? "ol" : "ul",
		properties: n,
		children: e.wrap(r, !0)
	};
	return e.patch(t, a), e.applyData(t, a);
}
// node_modules/streamdown/node_modules/mdast-util-to-hast/lib/handlers/paragraph.js
function vS(e, t) {
	let n = {
		type: "element",
		tagName: "p",
		properties: {},
		children: e.all(t)
	};
	return e.patch(t, n), e.applyData(t, n);
}
// node_modules/streamdown/node_modules/mdast-util-to-hast/lib/handlers/root.js
function yS(e, t) {
	let n = {
		type: "root",
		children: e.wrap(e.all(t))
	};
	return e.patch(t, n), e.applyData(t, n);
}
// node_modules/streamdown/node_modules/mdast-util-to-hast/lib/handlers/strong.js
function bS(e, t) {
	let n = {
		type: "element",
		tagName: "strong",
		properties: {},
		children: e.all(t)
	};
	return e.patch(t, n), e.applyData(t, n);
}
// node_modules/streamdown/node_modules/unist-util-position/lib/index.js
var xS = CS("end"), SS = CS("start");
function CS(e) {
	return t;
	function t(t) {
		let n = t && t.position && t.position[e] || {};
		if (typeof n.line == "number" && n.line > 0 && typeof n.column == "number" && n.column > 0) return {
			line: n.line,
			column: n.column,
			offset: typeof n.offset == "number" && n.offset > -1 ? n.offset : void 0
		};
	}
}
function wS(e) {
	let t = SS(e), n = xS(e);
	if (t && n) return {
		start: t,
		end: n
	};
}
// node_modules/streamdown/node_modules/mdast-util-to-hast/lib/handlers/table.js
function TS(e, t) {
	let n = e.all(t), r = n.shift(), i = [];
	if (r) {
		let n = {
			type: "element",
			tagName: "thead",
			properties: {},
			children: e.wrap([r], !0)
		};
		e.patch(t.children[0], n), i.push(n);
	}
	if (n.length > 0) {
		let r = {
			type: "element",
			tagName: "tbody",
			properties: {},
			children: e.wrap(n, !0)
		}, a = SS(t.children[1]), o = xS(t.children[t.children.length - 1]);
		a && o && (r.position = {
			start: a,
			end: o
		}), i.push(r);
	}
	let a = {
		type: "element",
		tagName: "table",
		properties: {},
		children: e.wrap(i, !0)
	};
	return e.patch(t, a), e.applyData(t, a);
}
// node_modules/streamdown/node_modules/mdast-util-to-hast/lib/handlers/table-row.js
function ES(e, t, n) {
	let r = n ? n.children : void 0, i = (r ? r.indexOf(t) : 1) === 0 ? "th" : "td", a = n && n.type === "table" ? n.align : void 0, o = a ? a.length : t.children.length, s = -1, c = [];
	for (; ++s < o;) {
		let n = t.children[s], r = {}, o = a ? a[s] : void 0;
		o && (r.align = o);
		let l = {
			type: "element",
			tagName: i,
			properties: r,
			children: []
		};
		n && (l.children = e.all(n), e.patch(n, l), l = e.applyData(n, l)), c.push(l);
	}
	let l = {
		type: "element",
		tagName: "tr",
		properties: {},
		children: e.wrap(c, !0)
	};
	return e.patch(t, l), e.applyData(t, l);
}
// node_modules/streamdown/node_modules/mdast-util-to-hast/lib/handlers/table-cell.js
function DS(e, t) {
	let n = {
		type: "element",
		tagName: "td",
		properties: {},
		children: e.all(t)
	};
	return e.patch(t, n), e.applyData(t, n);
}
// node_modules/trim-lines/index.js
var OS = 9, kS = 32;
function AS(e) {
	let t = String(e), n = /\r?\n|\r/g, r = n.exec(t), i = 0, a = [];
	for (; r;) a.push(jS(t.slice(i, r.index), i > 0, !0), r[0]), i = r.index + r[0].length, r = n.exec(t);
	return a.push(jS(t.slice(i), i > 0, !1)), a.join("");
}
function jS(e, t, n) {
	let r = 0, i = e.length;
	if (t) {
		let t = e.codePointAt(r);
		for (; t === OS || t === kS;) r++, t = e.codePointAt(r);
	}
	if (n) {
		let t = e.codePointAt(i - 1);
		for (; t === OS || t === kS;) i--, t = e.codePointAt(i - 1);
	}
	return i > r ? e.slice(r, i) : "";
}
// node_modules/streamdown/node_modules/mdast-util-to-hast/lib/handlers/text.js
function MS(e, t) {
	let n = {
		type: "text",
		value: AS(String(t.value))
	};
	return e.patch(t, n), e.applyData(t, n);
}
// node_modules/streamdown/node_modules/mdast-util-to-hast/lib/handlers/thematic-break.js
function NS(e, t) {
	let n = {
		type: "element",
		tagName: "hr",
		properties: {},
		children: []
	};
	return e.patch(t, n), e.applyData(t, n);
}
// node_modules/streamdown/node_modules/mdast-util-to-hast/lib/handlers/index.js
var PS = {
	blockquote: eS,
	break: tS,
	code: nS,
	delete: rS,
	emphasis: iS,
	footnoteReference: aS,
	heading: oS,
	html: sS,
	imageReference: lS,
	image: uS,
	inlineCode: dS,
	linkReference: fS,
	link: pS,
	listItem: mS,
	list: _S,
	paragraph: vS,
	root: yS,
	strong: bS,
	table: TS,
	tableCell: DS,
	tableRow: ES,
	text: MS,
	thematicBreak: NS,
	toml: FS,
	yaml: FS,
	definition: FS,
	footnoteDefinition: FS
};
function FS() {}
// node_modules/streamdown/node_modules/mdast-util-to-hast/lib/footer.js
function IS(e, t) {
	let n = [{
		type: "text",
		value: "↩"
	}];
	return t > 1 && n.push({
		type: "element",
		tagName: "sup",
		properties: {},
		children: [{
			type: "text",
			value: String(t)
		}]
	}), n;
}
function LS(e, t) {
	return "Back to reference " + (e + 1) + (t > 1 ? "-" + t : "");
}
function RS(e) {
	let t = typeof e.options.clobberPrefix == "string" ? e.options.clobberPrefix : "user-content-", n = e.options.footnoteBackContent || IS, r = e.options.footnoteBackLabel || LS, i = e.options.footnoteLabel || "Footnotes", a = e.options.footnoteLabelTagName || "h2", o = e.options.footnoteLabelProperties || { className: ["sr-only"] }, s = [], c = -1;
	for (; ++c < e.footnoteOrder.length;) {
		let i = e.footnoteById.get(e.footnoteOrder[c]);
		if (!i) continue;
		let a = e.all(i), o = String(i.identifier).toUpperCase(), l = wy(o.toLowerCase()), u = 0, d = [], f = e.footnoteCounts.get(o);
		for (; f !== void 0 && ++u <= f;) {
			d.length > 0 && d.push({
				type: "text",
				value: " "
			});
			let e = typeof n == "string" ? n : n(c, u);
			typeof e == "string" && (e = {
				type: "text",
				value: e
			}), d.push({
				type: "element",
				tagName: "a",
				properties: {
					href: "#" + t + "fnref-" + l + (u > 1 ? "-" + u : ""),
					dataFootnoteBackref: "",
					ariaLabel: typeof r == "string" ? r : r(c, u),
					className: ["data-footnote-backref"]
				},
				children: Array.isArray(e) ? e : [e]
			});
		}
		let p = a[a.length - 1];
		if (p && p.type === "element" && p.tagName === "p") {
			let e = p.children[p.children.length - 1];
			e && e.type === "text" ? e.value += " " : p.children.push({
				type: "text",
				value: " "
			}), p.children.push(...d);
		} else a.push(...d);
		let m = {
			type: "element",
			tagName: "li",
			properties: { id: t + "fn-" + l },
			children: e.wrap(a, !0)
		};
		e.patch(i, m), s.push(m);
	}
	if (s.length !== 0) return {
		type: "element",
		tagName: "section",
		properties: {
			dataFootnotes: !0,
			className: ["footnotes"]
		},
		children: [
			{
				type: "element",
				tagName: a,
				properties: {
					...Qt(o),
					id: "footnote-label"
				},
				children: [{
					type: "text",
					value: i
				}]
			},
			{
				type: "text",
				value: "\n"
			},
			{
				type: "element",
				tagName: "ol",
				properties: {},
				children: e.wrap(s, !0)
			},
			{
				type: "text",
				value: "\n"
			}
		]
	};
}
// node_modules/streamdown/node_modules/unist-util-visit/lib/index.js
function zS(e, t, n, r) {
	let i, a, o;
	typeof n == "function" || n && typeof n == "object" ? (i = t, a = n, o = r) : (a = t, o = n), typeof a == "function" ? v(e, i, VS(a), o) : v(e, i, BS(a), o);
}
function BS(e) {
	return !e || typeof e != "object" ? e : {
		enter: typeof e.enter == "function" ? VS(e.enter) : e.enter,
		exit: typeof e.exit == "function" ? VS(e.exit) : e.exit
	};
}
function VS(e) {
	return t;
	function t(t, n, r) {
		return e(t, r, n[n.length - 1]);
	}
}
// node_modules/streamdown/node_modules/mdast-util-to-hast/lib/state.js
var HS = {}.hasOwnProperty, US = {};
function WS(e, t) {
	let n = t || US, r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map(), a = {
		all: s,
		applyData: KS,
		definitionById: r,
		footnoteById: i,
		footnoteCounts: /* @__PURE__ */ new Map(),
		footnoteOrder: [],
		handlers: {
			...PS,
			...n.handlers
		},
		one: o,
		options: n,
		patch: GS,
		wrap: JS
	};
	return zS(e, function(e) {
		if (e.type === "definition" || e.type === "footnoteDefinition") {
			let t = e.type === "definition" ? r : i, n = String(e.identifier).toUpperCase();
			t.has(n) || t.set(n, e);
		}
	}), a;
	function o(e, t) {
		let n = e.type, r = a.handlers[n];
		if (HS.call(a.handlers, n) && r) return r(a, e, t);
		if (a.options.passThrough && a.options.passThrough.includes(n)) {
			if ("children" in e) {
				let { children: t, ...n } = e, r = Qt(n);
				return r.children = a.all(e), r;
			}
			return Qt(e);
		}
		return (a.options.unknownHandler || qS)(a, e, t);
	}
	function s(e) {
		let t = [];
		if ("children" in e) {
			let n = e.children, r = -1;
			for (; ++r < n.length;) {
				let i = a.one(n[r], e);
				if (i) {
					if (r && n[r - 1].type === "break" && (!Array.isArray(i) && i.type === "text" && (i.value = YS(i.value)), !Array.isArray(i) && i.type === "element")) {
						let e = i.children[0];
						e && e.type === "text" && (e.value = YS(e.value));
					}
					Array.isArray(i) ? t.push(...i) : t.push(i);
				}
			}
		}
		return t;
	}
}
function GS(e, t) {
	e.position && (t.position = wS(e));
}
function KS(e, t) {
	let n = t;
	if (e && e.data) {
		let t = e.data.hName, r = e.data.hChildren, i = e.data.hProperties;
		typeof t == "string" && (n.type === "element" ? n.tagName = t : n = {
			type: "element",
			tagName: t,
			properties: {},
			children: "children" in n ? n.children : [n]
		}), n.type === "element" && i && Object.assign(n.properties, Qt(i)), "children" in n && n.children && r != null && (n.children = r);
	}
	return n;
}
function qS(e, t) {
	let n = t.data || {}, r = "value" in t && !(HS.call(n, "hProperties") || HS.call(n, "hChildren")) ? {
		type: "text",
		value: t.value
	} : {
		type: "element",
		tagName: "div",
		properties: {},
		children: e.all(t)
	};
	return e.patch(t, r), e.applyData(t, r);
}
function JS(e, t) {
	let n = [], r = -1;
	for (t && n.push({
		type: "text",
		value: "\n"
	}); ++r < e.length;) r && n.push({
		type: "text",
		value: "\n"
	}), n.push(e[r]);
	return t && e.length > 0 && n.push({
		type: "text",
		value: "\n"
	}), n;
}
function YS(e) {
	let t = 0, n = e.charCodeAt(t);
	for (; n === 9 || n === 32;) t++, n = e.charCodeAt(t);
	return e.slice(t);
}
// node_modules/streamdown/node_modules/mdast-util-to-hast/lib/index.js
function XS(e, t) {
	let n = WS(e, t), r = n.one(e, void 0), i = RS(n), a = Array.isArray(r) ? {
		type: "root",
		children: r
	} : r || {
		type: "root",
		children: []
	};
	return i && ("children" in a, a.children.push({
		type: "text",
		value: "\n"
	}, i)), a;
}
// node_modules/streamdown/node_modules/remark-rehype/lib/index.js
function ZS(e, t) {
	return e && "run" in e ? async function(n, r) {
		let i = XS(n, {
			file: r,
			...t
		});
		await e.run(i, r);
	} : function(n, r) {
		return XS(n, {
			file: r,
			...e || t
		});
	};
}
// node_modules/bail/index.js
function QS(e) {
	if (e) throw e;
}
// node_modules/is-plain-obj/index.js
var $S = /* @__PURE__ */ e((/* @__PURE__ */ n(((e, t) => {
	var n = Object.prototype.hasOwnProperty, r = Object.prototype.toString, i = Object.defineProperty, a = Object.getOwnPropertyDescriptor, o = function(e) {
		return typeof Array.isArray == "function" ? Array.isArray(e) : r.call(e) === "[object Array]";
	}, s = function(e) {
		if (!e || r.call(e) !== "[object Object]") return !1;
		var t = n.call(e, "constructor"), i = e.constructor && e.constructor.prototype && n.call(e.constructor.prototype, "isPrototypeOf");
		if (e.constructor && !t && !i) return !1;
		for (var a in e);
		return a === void 0 || n.call(e, a);
	}, c = function(e, t) {
		i && t.name === "__proto__" ? i(e, t.name, {
			enumerable: !0,
			configurable: !0,
			value: t.newValue,
			writable: !0
		}) : e[t.name] = t.newValue;
	}, l = function(e, t) {
		if (t === "__proto__") {
			if (!n.call(e, t)) return;
			if (a) return a(e, t).value;
		}
		return e[t];
	};
	t.exports = function e() {
		var t, n, r, i, a, u, d = arguments[0], f = 1, p = arguments.length, m = !1;
		for (typeof d == "boolean" && (m = d, d = arguments[1] || {}, f = 2), (d == null || typeof d != "object" && typeof d != "function") && (d = {}); f < p; ++f) if (t = arguments[f], t != null) for (n in t) r = l(d, n), i = l(t, n), d !== i && (m && i && (s(i) || (a = o(i))) ? (a ? (a = !1, u = r && o(r) ? r : []) : u = r && s(r) ? r : {}, c(d, {
			name: n,
			newValue: e(m, u, i)
		})) : i !== void 0 && c(d, {
			name: n,
			newValue: i
		}));
		return d;
	};
})))(), 1);
function eC(e) {
	if (typeof e != "object" || !e) return !1;
	let t = Object.getPrototypeOf(e);
	return (t === null || t === Object.prototype || Object.getPrototypeOf(t) === null) && !(Symbol.toStringTag in e) && !(Symbol.iterator in e);
}
// node_modules/trough/lib/index.js
function tC() {
	let e = [], t = {
		run: n,
		use: r
	};
	return t;
	function n(...t) {
		let n = -1, r = t.pop();
		if (typeof r != "function") throw TypeError("Expected function as last argument, not " + r);
		i(null, ...t);
		function i(a, ...o) {
			let s = e[++n], c = -1;
			if (a) r(a);
			else {
				for (; ++c < t.length;) (o[c] === null || o[c] === void 0) && (o[c] = t[c]);
				t = o, s ? nC(s, i)(...o) : r(null, ...o);
			}
		}
	}
	function r(n) {
		if (typeof n != "function") throw TypeError("Expected `middelware` to be a function, not " + n);
		return e.push(n), t;
	}
}
function nC(e, t) {
	let n;
	return r;
	function r(...t) {
		let r = e.length > t.length, o;
		r && t.push(i);
		try {
			o = e.apply(this, t);
		} catch (e) {
			let t = e;
			if (r && n) throw t;
			return i(t);
		}
		r || (o && o.then && typeof o.then == "function" ? o.then(a, i) : o instanceof Error ? i(o) : a(o));
	}
	function i(e, ...r) {
		n || (n = !0, t(e, ...r));
	}
	function a(e) {
		i(null, e);
	}
}
// node_modules/streamdown/node_modules/vfile/lib/minpath.browser.js
var rC = {
	basename: iC,
	dirname: aC,
	extname: oC,
	join: sC,
	sep: "/"
};
function iC(e, t) {
	if (t !== void 0 && typeof t != "string") throw TypeError("\"ext\" argument must be a string");
	uC(e);
	let n = 0, r = -1, i = e.length, a;
	if (t === void 0 || t.length === 0 || t.length > e.length) {
		for (; i--;) if (e.codePointAt(i) === 47) {
			if (a) {
				n = i + 1;
				break;
			}
		} else r < 0 && (a = !0, r = i + 1);
		return r < 0 ? "" : e.slice(n, r);
	}
	if (t === e) return "";
	let o = -1, s = t.length - 1;
	for (; i--;) if (e.codePointAt(i) === 47) {
		if (a) {
			n = i + 1;
			break;
		}
	} else o < 0 && (a = !0, o = i + 1), s > -1 && (e.codePointAt(i) === t.codePointAt(s--) ? s < 0 && (r = i) : (s = -1, r = o));
	return n === r ? r = o : r < 0 && (r = e.length), e.slice(n, r);
}
function aC(e) {
	if (uC(e), e.length === 0) return ".";
	let t = -1, n = e.length, r;
	for (; --n;) if (e.codePointAt(n) === 47) {
		if (r) {
			t = n;
			break;
		}
	} else r ||= !0;
	return t < 0 ? e.codePointAt(0) === 47 ? "/" : "." : t === 1 && e.codePointAt(0) === 47 ? "//" : e.slice(0, t);
}
function oC(e) {
	uC(e);
	let t = e.length, n = -1, r = 0, i = -1, a = 0, o;
	for (; t--;) {
		let s = e.codePointAt(t);
		if (s === 47) {
			if (o) {
				r = t + 1;
				break;
			}
		} else n < 0 && (o = !0, n = t + 1), s === 46 ? i < 0 ? i = t : a !== 1 && (a = 1) : i > -1 && (a = -1);
	}
	return i < 0 || n < 0 || a === 0 || a === 1 && i === n - 1 && i === r + 1 ? "" : e.slice(i, n);
}
function sC(...e) {
	let t = -1, n;
	for (; ++t < e.length;) uC(e[t]), e[t] && (n = n === void 0 ? e[t] : n + "/" + e[t]);
	return n === void 0 ? "." : cC(n);
}
function cC(e) {
	uC(e);
	let t = e.codePointAt(0) === 47, n = lC(e, !t);
	return n.length === 0 && !t && (n = "."), n.length > 0 && e.codePointAt(e.length - 1) === 47 && (n += "/"), t ? "/" + n : n;
}
function lC(e, t) {
	let n = "", r = 0, i = -1, a = 0, o = -1, s, c;
	for (; ++o <= e.length;) {
		if (o < e.length) s = e.codePointAt(o);
		else if (s === 47) break;
		else s = 47;
		if (s === 47) {
			if (i !== o - 1 && a !== 1) {
				if (i !== o - 1 && a === 2) {
					if (n.length < 2 || r !== 2 || n.codePointAt(n.length - 1) !== 46 || n.codePointAt(n.length - 2) !== 46) {
						if (n.length > 2) {
							if (c = n.lastIndexOf("/"), c !== n.length - 1) {
								c < 0 ? (n = "", r = 0) : (n = n.slice(0, c), r = n.length - 1 - n.lastIndexOf("/")), i = o, a = 0;
								continue;
							}
						} else if (n.length > 0) {
							n = "", r = 0, i = o, a = 0;
							continue;
						}
					}
					t && (n = n.length > 0 ? n + "/.." : "..", r = 2);
				} else n.length > 0 ? n += "/" + e.slice(i + 1, o) : n = e.slice(i + 1, o), r = o - i - 1;
			}
			i = o, a = 0;
		} else s === 46 && a > -1 ? a++ : a = -1;
	}
	return n;
}
function uC(e) {
	if (typeof e != "string") throw TypeError("Path must be a string. Received " + JSON.stringify(e));
}
// node_modules/streamdown/node_modules/vfile/lib/minproc.browser.js
var dC = { cwd: fC };
function fC() {
	return "/";
}
// node_modules/streamdown/node_modules/vfile/lib/minurl.shared.js
function pC(e) {
	return !!(typeof e == "object" && e && "href" in e && e.href && "protocol" in e && e.protocol && e.auth === void 0);
}
// node_modules/streamdown/node_modules/vfile/lib/minurl.browser.js
function mC(e) {
	if (typeof e == "string") e = new URL(e);
	else if (!pC(e)) {
		let t = /* @__PURE__ */ TypeError("The \"path\" argument must be of type string or an instance of URL. Received `" + e + "`");
		throw t.code = "ERR_INVALID_ARG_TYPE", t;
	}
	if (e.protocol !== "file:") {
		let e = /* @__PURE__ */ TypeError("The URL must be of scheme file");
		throw e.code = "ERR_INVALID_URL_SCHEME", e;
	}
	return hC(e);
}
function hC(e) {
	if (e.hostname !== "") {
		let e = /* @__PURE__ */ TypeError("File URL host must be \"localhost\" or empty on darwin");
		throw e.code = "ERR_INVALID_FILE_URL_HOST", e;
	}
	let t = e.pathname, n = -1;
	for (; ++n < t.length;) if (t.codePointAt(n) === 37 && t.codePointAt(n + 1) === 50) {
		let e = t.codePointAt(n + 2);
		if (e === 70 || e === 102) {
			let e = /* @__PURE__ */ TypeError("File URL path must not include encoded / characters");
			throw e.code = "ERR_INVALID_FILE_URL_PATH", e;
		}
	}
	return decodeURIComponent(t);
}
// node_modules/streamdown/node_modules/vfile/lib/index.js
var gC = [
	"history",
	"path",
	"basename",
	"stem",
	"extname",
	"dirname"
], _C = class {
	constructor(e) {
		let t;
		t = e ? pC(e) ? { path: e } : typeof e == "string" || xC(e) ? { value: e } : e : {}, this.cwd = "cwd" in t ? "" : dC.cwd(), this.data = {}, this.history = [], this.messages = [], this.value, this.map, this.result, this.stored;
		let n = -1;
		for (; ++n < gC.length;) {
			let e = gC[n];
			e in t && t[e] !== void 0 && t[e] !== null && (this[e] = e === "history" ? [...t[e]] : t[e]);
		}
		let r;
		for (r in t) gC.includes(r) || (this[r] = t[r]);
	}
	get basename() {
		return typeof this.path == "string" ? rC.basename(this.path) : void 0;
	}
	set basename(e) {
		yC(e, "basename"), vC(e, "basename"), this.path = rC.join(this.dirname || "", e);
	}
	get dirname() {
		return typeof this.path == "string" ? rC.dirname(this.path) : void 0;
	}
	set dirname(e) {
		bC(this.basename, "dirname"), this.path = rC.join(e || "", this.basename);
	}
	get extname() {
		return typeof this.path == "string" ? rC.extname(this.path) : void 0;
	}
	set extname(e) {
		if (vC(e, "extname"), bC(this.dirname, "extname"), e) {
			if (e.codePointAt(0) !== 46) throw Error("`extname` must start with `.`");
			if (e.includes(".", 1)) throw Error("`extname` cannot contain multiple dots");
		}
		this.path = rC.join(this.dirname, this.stem + (e || ""));
	}
	get path() {
		return this.history[this.history.length - 1];
	}
	set path(e) {
		pC(e) && (e = mC(e)), yC(e, "path"), this.path !== e && this.history.push(e);
	}
	get stem() {
		return typeof this.path == "string" ? rC.basename(this.path, this.extname) : void 0;
	}
	set stem(e) {
		yC(e, "stem"), vC(e, "stem"), this.path = rC.join(this.dirname || "", e + (this.extname || ""));
	}
	fail(e, t, n) {
		let r = this.message(e, t, n);
		throw r.fatal = !0, r;
	}
	info(e, t, n) {
		let r = this.message(e, t, n);
		return r.fatal = void 0, r;
	}
	message(e, t, n) {
		let r = new Tv(e, t, n);
		return this.path && (r.name = this.path + ":" + r.name, r.file = this.path), r.fatal = !1, this.messages.push(r), r;
	}
	toString(e) {
		return this.value === void 0 ? "" : typeof this.value == "string" ? this.value : new TextDecoder(e || void 0).decode(this.value);
	}
};
function vC(e, t) {
	if (e && e.includes(rC.sep)) throw Error("`" + t + "` cannot be a path: did not expect `" + rC.sep + "`");
}
function yC(e, t) {
	if (!e) throw Error("`" + t + "` cannot be empty");
}
function bC(e, t) {
	if (!e) throw Error("Setting `" + t + "` requires `path` to be set too");
}
function xC(e) {
	return !!(e && typeof e == "object" && "byteLength" in e && "byteOffset" in e);
}
// node_modules/streamdown/node_modules/unified/lib/callable-instance.js
var SC = (function(e) {
	let t = this.constructor.prototype, n = t[e], r = function() {
		return n.apply(r, arguments);
	};
	return Object.setPrototypeOf(r, t), r;
}), CC = {}.hasOwnProperty, wC = new class e extends SC {
	constructor() {
		super("copy"), this.Compiler = void 0, this.Parser = void 0, this.attachers = [], this.compiler = void 0, this.freezeIndex = -1, this.frozen = void 0, this.namespace = {}, this.parser = void 0, this.transformers = tC();
	}
	copy() {
		let t = new e(), n = -1;
		for (; ++n < this.attachers.length;) {
			let e = this.attachers[n];
			t.use(...e);
		}
		return t.data((0, $S.default)(!0, {}, this.namespace)), t;
	}
	data(e, t) {
		return typeof e == "string" ? arguments.length === 2 ? (DC("data", this.frozen), this.namespace[e] = t, this) : CC.call(this.namespace, e) && this.namespace[e] || void 0 : e ? (DC("data", this.frozen), this.namespace = e, this) : this.namespace;
	}
	freeze() {
		if (this.frozen) return this;
		let e = this;
		for (; ++this.freezeIndex < this.attachers.length;) {
			let [t, ...n] = this.attachers[this.freezeIndex];
			if (n[0] === !1) continue;
			n[0] === !0 && (n[0] = void 0);
			let r = t.call(e, ...n);
			typeof r == "function" && this.transformers.use(r);
		}
		return this.frozen = !0, this.freezeIndex = Infinity, this;
	}
	parse(e) {
		this.freeze();
		let t = AC(e), n = this.parser || this.Parser;
		return TC("parse", n), n(String(t), t);
	}
	process(e, t) {
		let n = this;
		return this.freeze(), TC("process", this.parser || this.Parser), EC("process", this.compiler || this.Compiler), t ? r(void 0, t) : new Promise(r);
		function r(r, i) {
			let a = AC(e), o = n.parse(a);
			n.run(o, a, function(e, t, r) {
				if (e || !t || !r) return s(e);
				let i = t, a = n.stringify(i, r);
				MC(a) ? r.value = a : r.result = a, s(e, r);
			});
			function s(e, n) {
				e || !n ? i(e) : r ? r(n) : t(void 0, n);
			}
		}
	}
	processSync(e) {
		let t = !1, n;
		return this.freeze(), TC("processSync", this.parser || this.Parser), EC("processSync", this.compiler || this.Compiler), this.process(e, r), kC("processSync", "process", t), n;
		function r(e, r) {
			t = !0, QS(e), n = r;
		}
	}
	run(e, t, n) {
		OC(e), this.freeze();
		let r = this.transformers;
		return !n && typeof t == "function" && (n = t, t = void 0), n ? i(void 0, n) : new Promise(i);
		function i(i, a) {
			let o = AC(t);
			r.run(e, o, s);
			function s(t, r, o) {
				let s = r || e;
				t ? a(t) : i ? i(s) : n(void 0, s, o);
			}
		}
	}
	runSync(e, t) {
		let n = !1, r;
		return this.run(e, t, i), kC("runSync", "run", n), r;
		function i(e, t) {
			QS(e), r = t, n = !0;
		}
	}
	stringify(e, t) {
		this.freeze();
		let n = AC(t), r = this.compiler || this.Compiler;
		return EC("stringify", r), OC(e), r(e, n);
	}
	use(e, ...t) {
		let n = this.attachers, r = this.namespace;
		if (DC("use", this.frozen), e != null) {
			if (typeof e == "function") s(e, t);
			else if (typeof e == "object") Array.isArray(e) ? o(e) : a(e);
			else throw TypeError("Expected usable value, not `" + e + "`");
		}
		return this;
		function i(e) {
			if (typeof e == "function") s(e, []);
			else if (typeof e == "object") {
				if (Array.isArray(e)) {
					let [t, ...n] = e;
					s(t, n);
				} else a(e);
			} else throw TypeError("Expected usable value, not `" + e + "`");
		}
		function a(e) {
			if (!("plugins" in e) && !("settings" in e)) throw Error("Expected usable value but received an empty preset, which is probably a mistake: presets typically come with `plugins` and sometimes with `settings`, but this has neither");
			o(e.plugins), e.settings && (r.settings = (0, $S.default)(!0, r.settings, e.settings));
		}
		function o(e) {
			let t = -1;
			if (e != null) {
				if (Array.isArray(e)) for (; ++t < e.length;) {
					let n = e[t];
					i(n);
				}
				else throw TypeError("Expected a list of plugins, not `" + e + "`");
			}
		}
		function s(e, t) {
			let r = -1, i = -1;
			for (; ++r < n.length;) if (n[r][0] === e) {
				i = r;
				break;
			}
			if (i === -1) n.push([e, ...t]);
			else if (t.length > 0) {
				let [r, ...a] = t, o = n[i][1];
				eC(o) && eC(r) && (r = (0, $S.default)(!0, o, r)), n[i] = [
					e,
					r,
					...a
				];
			}
		}
	}
}().freeze();
function TC(e, t) {
	if (typeof t != "function") throw TypeError("Cannot `" + e + "` without `parser`");
}
function EC(e, t) {
	if (typeof t != "function") throw TypeError("Cannot `" + e + "` without `compiler`");
}
function DC(e, t) {
	if (t) throw Error("Cannot call `" + e + "` on a frozen processor.\nCreate a new processor first, by calling it: use `processor()` instead of `processor`.");
}
function OC(e) {
	if (!eC(e) || typeof e.type != "string") throw TypeError("Expected node, got `" + e + "`");
}
function kC(e, t, n) {
	if (!n) throw Error("`" + e + "` finished async. Use `" + t + "` instead");
}
function AC(e) {
	return jC(e) ? e : new _C(e);
}
function jC(e) {
	return !!(e && typeof e == "object" && "message" in e && "messages" in e);
}
function MC(e) {
	return typeof e == "string" || NC(e);
}
function NC(e) {
	return !!(e && typeof e == "object" && "byteLength" in e && "byteOffset" in e);
}
// node_modules/streamdown/node_modules/marked/lib/marked.esm.js
var X = s();
function PC() {
	return {
		async: !1,
		breaks: !1,
		extensions: null,
		gfm: !0,
		hooks: null,
		pedantic: !1,
		renderer: null,
		silent: !1,
		tokenizer: null,
		walkTokens: null
	};
}
var FC = PC();
function IC(e) {
	FC = e;
}
var LC = { exec: () => null };
function Z(e, t = "") {
	let n = typeof e == "string" ? e : e.source, r = {
		replace: (e, t) => {
			let i = typeof t == "string" ? t : t.source;
			return i = i.replace(zC.caret, "$1"), n = n.replace(e, i), r;
		},
		getRegex: () => new RegExp(n, t)
	};
	return r;
}
var RC = (() => {
	try {
		return !0;
	} catch {
		return !1;
	}
})(), zC = {
	codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm,
	outputLinkReplace: /\\([\[\]])/g,
	indentCodeCompensation: /^(\s+)(?:```)/,
	beginningSpace: /^\s+/,
	endingHash: /#$/,
	startingSpaceChar: /^ /,
	endingSpaceChar: / $/,
	nonSpaceChar: /[^ ]/,
	newLineCharGlobal: /\n/g,
	tabCharGlobal: /\t/g,
	multipleSpaceGlobal: /\s+/g,
	blankLine: /^[ \t]*$/,
	doubleBlankLine: /\n[ \t]*\n[ \t]*$/,
	blockquoteStart: /^ {0,3}>/,
	blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g,
	blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm,
	listReplaceTabs: /^\t+/,
	listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g,
	listIsTask: /^\[[ xX]\] /,
	listReplaceTask: /^\[[ xX]\] +/,
	anyLine: /\n.*\n/,
	hrefBrackets: /^<(.*)>$/,
	tableDelimiter: /[:|]/,
	tableAlignChars: /^\||\| *$/g,
	tableRowBlankLine: /\n[ \t]*$/,
	tableAlignRight: /^ *-+: *$/,
	tableAlignCenter: /^ *:-+: *$/,
	tableAlignLeft: /^ *:-+ *$/,
	startATag: /^<a /i,
	endATag: /^<\/a>/i,
	startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i,
	endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i,
	startAngleBracket: /^</,
	endAngleBracket: />$/,
	pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/,
	unicodeAlphaNumeric: /[\p{L}\p{N}]/u,
	escapeTest: /[&<>"']/,
	escapeReplace: /[&<>"']/g,
	escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,
	escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
	unescapeTest: /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/gi,
	caret: /(^|[^\[])\^/g,
	percentDecode: /%25/g,
	findPipe: /\|/g,
	splitPipe: / \|/,
	slashPipe: /\\\|/g,
	carriageReturn: /\r\n|\r/g,
	spaceLine: /^ +$/gm,
	notSpaceStart: /^\S*/,
	endingNewline: /\n$/,
	listItemRegex: (e) => RegExp(`^( {0,3}${e})((?:[	 ][^\\n]*)?(?:\\n|$))`),
	nextBulletRegex: (e) => RegExp(`^ {0,${Math.min(3, e - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`),
	hrRegex: (e) => RegExp(`^ {0,${Math.min(3, e - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`),
	fencesBeginRegex: (e) => RegExp(`^ {0,${Math.min(3, e - 1)}}(?:\`\`\`|~~~)`),
	headingBeginRegex: (e) => RegExp(`^ {0,${Math.min(3, e - 1)}}#`),
	htmlBeginRegex: (e) => RegExp(`^ {0,${Math.min(3, e - 1)}}<(?:[a-z].*>|!--)`, "i")
}, BC = /^(?:[ \t]*(?:\n|$))+/, VC = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/, HC = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, UC = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, WC = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, GC = /(?:[*+-]|\d{1,9}[.)])/, KC = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/, qC = Z(KC).replace(/bull/g, GC).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex(), JC = Z(KC).replace(/bull/g, GC).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(), YC = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, XC = /^[^\n]+/, ZC = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/, QC = Z(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", ZC).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), $C = Z(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, GC).getRegex(), ew = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", tw = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, nw = Z("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", tw).replace("tag", ew).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), rw = Z(YC).replace("hr", UC).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", ew).getRegex(), iw = {
	blockquote: Z(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", rw).getRegex(),
	code: VC,
	def: QC,
	fences: HC,
	heading: WC,
	hr: UC,
	html: nw,
	lheading: qC,
	list: $C,
	newline: BC,
	paragraph: rw,
	table: LC,
	text: XC
}, aw = Z("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", UC).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", ew).getRegex(), ow = {
	...iw,
	lheading: JC,
	table: aw,
	paragraph: Z(YC).replace("hr", UC).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", aw).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", ew).getRegex()
}, sw = {
	...iw,
	html: Z("^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:\"[^\"]*\"|'[^']*'|\\s[^'\"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))").replace("comment", tw).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
	def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
	heading: /^(#{1,6})(.*)(?:\n+|$)/,
	fences: LC,
	lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
	paragraph: Z(YC).replace("hr", UC).replace("heading", " *#{1,6} *[^\n]").replace("lheading", qC).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, cw = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, lw = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, uw = /^( {2,}|\\)\n(?!\s*$)/, dw = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, fw = /[\p{P}\p{S}]/u, pw = /[\s\p{P}\p{S}]/u, mw = /[^\s\p{P}\p{S}]/u, hw = Z(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, pw).getRegex(), gw = /(?!~)[\p{P}\p{S}]/u, _w = /(?!~)[\s\p{P}\p{S}]/u, vw = /(?:[^\s\p{P}\p{S}]|~)/u, yw = Z(/link|precode-code|html/, "g").replace("link", /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-", RC ? "(?<!`)()" : "(^^|[^`])").replace("code", /(?<b>`+)[^`]+\k<b>(?!`)/).replace("html", /<(?! )[^<>]*?>/).getRegex(), bw = /^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/, xw = Z(bw, "u").replace(/punct/g, fw).getRegex(), Sw = Z(bw, "u").replace(/punct/g, gw).getRegex(), Cw = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)", ww = Z(Cw, "gu").replace(/notPunctSpace/g, mw).replace(/punctSpace/g, pw).replace(/punct/g, fw).getRegex(), Tw = Z(Cw, "gu").replace(/notPunctSpace/g, vw).replace(/punctSpace/g, _w).replace(/punct/g, gw).getRegex(), Ew = Z("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, mw).replace(/punctSpace/g, pw).replace(/punct/g, fw).getRegex(), Dw = Z(/\\(punct)/, "gu").replace(/punct/g, fw).getRegex(), Ow = Z(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), kw = Z(tw).replace("(?:-->|$)", "-->").getRegex(), Aw = Z("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", kw).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), jw = /(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+[^`]*?`+(?!`)|[^\[\]\\`])*?/, Mw = Z(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]*(?:\n[ \t]*)?)(title))?\s*\)/).replace("label", jw).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), Nw = Z(/^!?\[(label)\]\[(ref)\]/).replace("label", jw).replace("ref", ZC).getRegex(), Pw = Z(/^!?\[(ref)\](?:\[\])?/).replace("ref", ZC).getRegex(), Fw = Z("reflink|nolink(?!\\()", "g").replace("reflink", Nw).replace("nolink", Pw).getRegex(), Iw = /[hH][tT][tT][pP][sS]?|[fF][tT][pP]/, Lw = {
	_backpedal: LC,
	anyPunctuation: Dw,
	autolink: Ow,
	blockSkip: yw,
	br: uw,
	code: lw,
	del: LC,
	emStrongLDelim: xw,
	emStrongRDelimAst: ww,
	emStrongRDelimUnd: Ew,
	escape: cw,
	link: Mw,
	nolink: Pw,
	punctuation: hw,
	reflink: Nw,
	reflinkSearch: Fw,
	tag: Aw,
	text: dw,
	url: LC
}, Rw = {
	...Lw,
	link: Z(/^!?\[(label)\]\((.*?)\)/).replace("label", jw).getRegex(),
	reflink: Z(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", jw).getRegex()
}, zw = {
	...Lw,
	emStrongRDelimAst: Tw,
	emStrongLDelim: Sw,
	url: Z(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("protocol", Iw).replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
	_backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
	del: /^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/,
	text: Z(/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace("protocol", Iw).getRegex()
}, Bw = {
	...zw,
	br: Z(uw).replace("{2,}", "*").getRegex(),
	text: Z(zw.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, Vw = {
	normal: iw,
	gfm: ow,
	pedantic: sw
}, Hw = {
	normal: Lw,
	gfm: zw,
	breaks: Bw,
	pedantic: Rw
}, Uw = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
}, Ww = (e) => Uw[e];
function Gw(e, t) {
	if (t) {
		if (zC.escapeTest.test(e)) return e.replace(zC.escapeReplace, Ww);
	} else if (zC.escapeTestNoEncode.test(e)) return e.replace(zC.escapeReplaceNoEncode, Ww);
	return e;
}
function Kw(e) {
	try {
		e = encodeURI(e).replace(zC.percentDecode, "%");
	} catch {
		return null;
	}
	return e;
}
function qw(e, t) {
	let n = e.replace(zC.findPipe, (e, t, n) => {
		let r = !1, i = t;
		for (; --i >= 0 && n[i] === "\\";) r = !r;
		return r ? "|" : " |";
	}).split(zC.splitPipe), r = 0;
	if (n[0].trim() || n.shift(), n.length > 0 && !n.at(-1)?.trim() && n.pop(), t) {
		if (n.length > t) n.splice(t);
		else for (; n.length < t;) n.push("");
	}
	for (; r < n.length; r++) n[r] = n[r].trim().replace(zC.slashPipe, "|");
	return n;
}
function Jw(e, t, n) {
	let r = e.length;
	if (r === 0) return "";
	let i = 0;
	for (; i < r;) {
		let a = e.charAt(r - i - 1);
		if (a === t && !n) i++;
		else if (a !== t && n) i++;
		else break;
	}
	return e.slice(0, r - i);
}
function Yw(e, t) {
	if (e.indexOf(t[1]) === -1) return -1;
	let n = 0;
	for (let r = 0; r < e.length; r++) if (e[r] === "\\") r++;
	else if (e[r] === t[0]) n++;
	else if (e[r] === t[1] && (n--, n < 0)) return r;
	return n > 0 ? -2 : -1;
}
function Xw(e, t, n, r, i) {
	let a = t.href, o = t.title || null, s = e[1].replace(i.other.outputLinkReplace, "$1");
	r.state.inLink = !0;
	let c = {
		type: e[0].charAt(0) === "!" ? "image" : "link",
		raw: n,
		href: a,
		title: o,
		text: s,
		tokens: r.inlineTokens(s)
	};
	return r.state.inLink = !1, c;
}
function Zw(e, t, n) {
	let r = e.match(n.other.indentCodeCompensation);
	if (r === null) return t;
	let i = r[1];
	return t.split("\n").map((e) => {
		let t = e.match(n.other.beginningSpace);
		if (t === null) return e;
		let [r] = t;
		return r.length >= i.length ? e.slice(i.length) : e;
	}).join("\n");
}
var Qw = class {
	options;
	rules;
	lexer;
	constructor(e) {
		this.options = e || FC;
	}
	space(e) {
		let t = this.rules.block.newline.exec(e);
		if (t && t[0].length > 0) return {
			type: "space",
			raw: t[0]
		};
	}
	code(e) {
		let t = this.rules.block.code.exec(e);
		if (t) {
			let e = t[0].replace(this.rules.other.codeRemoveIndent, "");
			return {
				type: "code",
				raw: t[0],
				codeBlockStyle: "indented",
				text: this.options.pedantic ? e : Jw(e, "\n")
			};
		}
	}
	fences(e) {
		let t = this.rules.block.fences.exec(e);
		if (t) {
			let e = t[0], n = Zw(e, t[3] || "", this.rules);
			return {
				type: "code",
				raw: e,
				lang: t[2] ? t[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : t[2],
				text: n
			};
		}
	}
	heading(e) {
		let t = this.rules.block.heading.exec(e);
		if (t) {
			let e = t[2].trim();
			if (this.rules.other.endingHash.test(e)) {
				let t = Jw(e, "#");
				(this.options.pedantic || !t || this.rules.other.endingSpaceChar.test(t)) && (e = t.trim());
			}
			return {
				type: "heading",
				raw: t[0],
				depth: t[1].length,
				text: e,
				tokens: this.lexer.inline(e)
			};
		}
	}
	hr(e) {
		let t = this.rules.block.hr.exec(e);
		if (t) return {
			type: "hr",
			raw: Jw(t[0], "\n")
		};
	}
	blockquote(e) {
		let t = this.rules.block.blockquote.exec(e);
		if (t) {
			let e = Jw(t[0], "\n").split("\n"), n = "", r = "", i = [];
			for (; e.length > 0;) {
				let t = !1, a = [], o = 0;
				for (; o < e.length; o++) if (this.rules.other.blockquoteStart.test(e[o])) a.push(e[o]), t = !0;
				else if (!t) a.push(e[o]);
				else break;
				e = e.slice(o);
				let s = a.join("\n"), c = s.replace(this.rules.other.blockquoteSetextReplace, "\n    $1").replace(this.rules.other.blockquoteSetextReplace2, "");
				n = n ? `${n}
${s}` : s, r = r ? `${r}
${c}` : c;
				let l = this.lexer.state.top;
				if (this.lexer.state.top = !0, this.lexer.blockTokens(c, i, !0), this.lexer.state.top = l, e.length === 0) break;
				let u = i.at(-1);
				if (u?.type === "code") break;
				if (u?.type === "blockquote") {
					let t = u, a = t.raw + "\n" + e.join("\n"), o = this.blockquote(a);
					i[i.length - 1] = o, n = n.substring(0, n.length - t.raw.length) + o.raw, r = r.substring(0, r.length - t.text.length) + o.text;
					break;
				}
				if (u?.type === "list") {
					let t = u, a = t.raw + "\n" + e.join("\n"), o = this.list(a);
					i[i.length - 1] = o, n = n.substring(0, n.length - u.raw.length) + o.raw, r = r.substring(0, r.length - t.raw.length) + o.raw, e = a.substring(i.at(-1).raw.length).split("\n");
				}
			}
			return {
				type: "blockquote",
				raw: n,
				tokens: i,
				text: r
			};
		}
	}
	list(e) {
		let t = this.rules.block.list.exec(e);
		if (t) {
			let n = t[1].trim(), r = n.length > 1, i = {
				type: "list",
				raw: "",
				ordered: r,
				start: r ? +n.slice(0, -1) : "",
				loose: !1,
				items: []
			};
			n = r ? `\\d{1,9}\\${n.slice(-1)}` : `\\${n}`, this.options.pedantic && (n = r ? n : "[*+-]");
			let a = this.rules.other.listItemRegex(n), o = !1;
			for (; e;) {
				let n = !1, r = "", s = "";
				if (!(t = a.exec(e)) || this.rules.block.hr.test(e)) break;
				r = t[0], e = e.substring(r.length);
				let c = t[2].split("\n", 1)[0].replace(this.rules.other.listReplaceTabs, (e) => " ".repeat(3 * e.length)), l = e.split("\n", 1)[0], u = !c.trim(), d = 0;
				if (this.options.pedantic ? (d = 2, s = c.trimStart()) : u ? d = t[1].length + 1 : (d = t[2].search(this.rules.other.nonSpaceChar), d = d > 4 ? 1 : d, s = c.slice(d), d += t[1].length), u && this.rules.other.blankLine.test(l) && (r += l + "\n", e = e.substring(l.length + 1), n = !0), !n) {
					let t = this.rules.other.nextBulletRegex(d), n = this.rules.other.hrRegex(d), i = this.rules.other.fencesBeginRegex(d), a = this.rules.other.headingBeginRegex(d), o = this.rules.other.htmlBeginRegex(d);
					for (; e;) {
						let f = e.split("\n", 1)[0], p;
						if (l = f, this.options.pedantic ? (l = l.replace(this.rules.other.listReplaceNesting, "  "), p = l) : p = l.replace(this.rules.other.tabCharGlobal, "    "), i.test(l) || a.test(l) || o.test(l) || t.test(l) || n.test(l)) break;
						if (p.search(this.rules.other.nonSpaceChar) >= d || !l.trim()) s += "\n" + p.slice(d);
						else {
							if (u || c.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || i.test(c) || a.test(c) || n.test(c)) break;
							s += "\n" + l;
						}
						!u && !l.trim() && (u = !0), r += f + "\n", e = e.substring(f.length + 1), c = p.slice(d);
					}
				}
				i.loose || (o ? i.loose = !0 : this.rules.other.doubleBlankLine.test(r) && (o = !0));
				let f = null, p;
				this.options.gfm && (f = this.rules.other.listIsTask.exec(s), f && (p = f[0] !== "[ ] ", s = s.replace(this.rules.other.listReplaceTask, ""))), i.items.push({
					type: "list_item",
					raw: r,
					task: !!f,
					checked: p,
					loose: !1,
					text: s,
					tokens: []
				}), i.raw += r;
			}
			let s = i.items.at(-1);
			if (s) s.raw = s.raw.trimEnd(), s.text = s.text.trimEnd();
			else return;
			i.raw = i.raw.trimEnd();
			for (let e = 0; e < i.items.length; e++) if (this.lexer.state.top = !1, i.items[e].tokens = this.lexer.blockTokens(i.items[e].text, []), !i.loose) {
				let t = i.items[e].tokens.filter((e) => e.type === "space");
				i.loose = t.length > 0 && t.some((e) => this.rules.other.anyLine.test(e.raw));
			}
			if (i.loose) for (let e = 0; e < i.items.length; e++) i.items[e].loose = !0;
			return i;
		}
	}
	html(e) {
		let t = this.rules.block.html.exec(e);
		if (t) return {
			type: "html",
			block: !0,
			raw: t[0],
			pre: t[1] === "pre" || t[1] === "script" || t[1] === "style",
			text: t[0]
		};
	}
	def(e) {
		let t = this.rules.block.def.exec(e);
		if (t) {
			let e = t[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " "), n = t[2] ? t[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", r = t[3] ? t[3].substring(1, t[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : t[3];
			return {
				type: "def",
				tag: e,
				raw: t[0],
				href: n,
				title: r
			};
		}
	}
	table(e) {
		let t = this.rules.block.table.exec(e);
		if (!t || !this.rules.other.tableDelimiter.test(t[2])) return;
		let n = qw(t[1]), r = t[2].replace(this.rules.other.tableAlignChars, "").split("|"), i = t[3]?.trim() ? t[3].replace(this.rules.other.tableRowBlankLine, "").split("\n") : [], a = {
			type: "table",
			raw: t[0],
			header: [],
			align: [],
			rows: []
		};
		if (n.length === r.length) {
			for (let e of r) this.rules.other.tableAlignRight.test(e) ? a.align.push("right") : this.rules.other.tableAlignCenter.test(e) ? a.align.push("center") : this.rules.other.tableAlignLeft.test(e) ? a.align.push("left") : a.align.push(null);
			for (let e = 0; e < n.length; e++) a.header.push({
				text: n[e],
				tokens: this.lexer.inline(n[e]),
				header: !0,
				align: a.align[e]
			});
			for (let e of i) a.rows.push(qw(e, a.header.length).map((e, t) => ({
				text: e,
				tokens: this.lexer.inline(e),
				header: !1,
				align: a.align[t]
			})));
			return a;
		}
	}
	lheading(e) {
		let t = this.rules.block.lheading.exec(e);
		if (t) return {
			type: "heading",
			raw: t[0],
			depth: t[2].charAt(0) === "=" ? 1 : 2,
			text: t[1],
			tokens: this.lexer.inline(t[1])
		};
	}
	paragraph(e) {
		let t = this.rules.block.paragraph.exec(e);
		if (t) {
			let e = t[1].charAt(t[1].length - 1) === "\n" ? t[1].slice(0, -1) : t[1];
			return {
				type: "paragraph",
				raw: t[0],
				text: e,
				tokens: this.lexer.inline(e)
			};
		}
	}
	text(e) {
		let t = this.rules.block.text.exec(e);
		if (t) return {
			type: "text",
			raw: t[0],
			text: t[0],
			tokens: this.lexer.inline(t[0])
		};
	}
	escape(e) {
		let t = this.rules.inline.escape.exec(e);
		if (t) return {
			type: "escape",
			raw: t[0],
			text: t[1]
		};
	}
	tag(e) {
		let t = this.rules.inline.tag.exec(e);
		if (t) return !this.lexer.state.inLink && this.rules.other.startATag.test(t[0]) ? this.lexer.state.inLink = !0 : this.lexer.state.inLink && this.rules.other.endATag.test(t[0]) && (this.lexer.state.inLink = !1), !this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(t[0]) ? this.lexer.state.inRawBlock = !0 : this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(t[0]) && (this.lexer.state.inRawBlock = !1), {
			type: "html",
			raw: t[0],
			inLink: this.lexer.state.inLink,
			inRawBlock: this.lexer.state.inRawBlock,
			block: !1,
			text: t[0]
		};
	}
	link(e) {
		let t = this.rules.inline.link.exec(e);
		if (t) {
			let e = t[2].trim();
			if (!this.options.pedantic && this.rules.other.startAngleBracket.test(e)) {
				if (!this.rules.other.endAngleBracket.test(e)) return;
				let t = Jw(e.slice(0, -1), "\\");
				if ((e.length - t.length) % 2 == 0) return;
			} else {
				let e = Yw(t[2], "()");
				if (e === -2) return;
				if (e > -1) {
					let n = (t[0].indexOf("!") === 0 ? 5 : 4) + t[1].length + e;
					t[2] = t[2].substring(0, e), t[0] = t[0].substring(0, n).trim(), t[3] = "";
				}
			}
			let n = t[2], r = "";
			if (this.options.pedantic) {
				let e = this.rules.other.pedanticHrefTitle.exec(n);
				e && (n = e[1], r = e[3]);
			} else r = t[3] ? t[3].slice(1, -1) : "";
			return n = n.trim(), this.rules.other.startAngleBracket.test(n) && (n = this.options.pedantic && !this.rules.other.endAngleBracket.test(e) ? n.slice(1) : n.slice(1, -1)), Xw(t, {
				href: n && n.replace(this.rules.inline.anyPunctuation, "$1"),
				title: r && r.replace(this.rules.inline.anyPunctuation, "$1")
			}, t[0], this.lexer, this.rules);
		}
	}
	reflink(e, t) {
		let n;
		if ((n = this.rules.inline.reflink.exec(e)) || (n = this.rules.inline.nolink.exec(e))) {
			let e = t[(n[2] || n[1]).replace(this.rules.other.multipleSpaceGlobal, " ").toLowerCase()];
			if (!e) {
				let e = n[0].charAt(0);
				return {
					type: "text",
					raw: e,
					text: e
				};
			}
			return Xw(n, e, n[0], this.lexer, this.rules);
		}
	}
	emStrong(e, t, n = "") {
		let r = this.rules.inline.emStrongLDelim.exec(e);
		if (!(!r || r[3] && n.match(this.rules.other.unicodeAlphaNumeric)) && (!(r[1] || r[2]) || !n || this.rules.inline.punctuation.exec(n))) {
			let n = [...r[0]].length - 1, i, a, o = n, s = 0, c = r[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
			for (c.lastIndex = 0, t = t.slice(-1 * e.length + n); (r = c.exec(t)) != null;) {
				if (i = r[1] || r[2] || r[3] || r[4] || r[5] || r[6], !i) continue;
				if (a = [...i].length, r[3] || r[4]) {
					o += a;
					continue;
				}
				if ((r[5] || r[6]) && n % 3 && !((n + a) % 3)) {
					s += a;
					continue;
				}
				if (o -= a, o > 0) continue;
				a = Math.min(a, a + o + s);
				let t = [...r[0]][0].length, c = e.slice(0, n + r.index + t + a);
				if (Math.min(n, a) % 2) {
					let e = c.slice(1, -1);
					return {
						type: "em",
						raw: c,
						text: e,
						tokens: this.lexer.inlineTokens(e)
					};
				}
				let l = c.slice(2, -2);
				return {
					type: "strong",
					raw: c,
					text: l,
					tokens: this.lexer.inlineTokens(l)
				};
			}
		}
	}
	codespan(e) {
		let t = this.rules.inline.code.exec(e);
		if (t) {
			let e = t[2].replace(this.rules.other.newLineCharGlobal, " "), n = this.rules.other.nonSpaceChar.test(e), r = this.rules.other.startingSpaceChar.test(e) && this.rules.other.endingSpaceChar.test(e);
			return n && r && (e = e.substring(1, e.length - 1)), {
				type: "codespan",
				raw: t[0],
				text: e
			};
		}
	}
	br(e) {
		let t = this.rules.inline.br.exec(e);
		if (t) return {
			type: "br",
			raw: t[0]
		};
	}
	del(e) {
		let t = this.rules.inline.del.exec(e);
		if (t) return {
			type: "del",
			raw: t[0],
			text: t[2],
			tokens: this.lexer.inlineTokens(t[2])
		};
	}
	autolink(e) {
		let t = this.rules.inline.autolink.exec(e);
		if (t) {
			let e, n;
			return t[2] === "@" ? (e = t[1], n = "mailto:" + e) : (e = t[1], n = e), {
				type: "link",
				raw: t[0],
				text: e,
				href: n,
				tokens: [{
					type: "text",
					raw: e,
					text: e
				}]
			};
		}
	}
	url(e) {
		let t;
		if (t = this.rules.inline.url.exec(e)) {
			let e, n;
			if (t[2] === "@") e = t[0], n = "mailto:" + e;
			else {
				let r;
				do
					r = t[0], t[0] = this.rules.inline._backpedal.exec(t[0])?.[0] ?? "";
				while (r !== t[0]);
				e = t[0], n = t[1] === "www." ? "http://" + t[0] : t[0];
			}
			return {
				type: "link",
				raw: t[0],
				text: e,
				href: n,
				tokens: [{
					type: "text",
					raw: e,
					text: e
				}]
			};
		}
	}
	inlineText(e) {
		let t = this.rules.inline.text.exec(e);
		if (t) {
			let e = this.lexer.state.inRawBlock;
			return {
				type: "text",
				raw: t[0],
				text: t[0],
				escaped: e
			};
		}
	}
}, $w = class e {
	tokens;
	options;
	state;
	tokenizer;
	inlineQueue;
	constructor(e) {
		this.tokens = [], this.tokens.links = Object.create(null), this.options = e || FC, this.options.tokenizer = this.options.tokenizer || new Qw(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
			inLink: !1,
			inRawBlock: !1,
			top: !0
		};
		let t = {
			other: zC,
			block: Vw.normal,
			inline: Hw.normal
		};
		this.options.pedantic ? (t.block = Vw.pedantic, t.inline = Hw.pedantic) : this.options.gfm && (t.block = Vw.gfm, t.inline = this.options.breaks ? Hw.breaks : Hw.gfm), this.tokenizer.rules = t;
	}
	static get rules() {
		return {
			block: Vw,
			inline: Hw
		};
	}
	static lex(t, n) {
		return new e(n).lex(t);
	}
	static lexInline(t, n) {
		return new e(n).inlineTokens(t);
	}
	lex(e) {
		e = e.replace(zC.carriageReturn, "\n"), this.blockTokens(e, this.tokens);
		for (let e = 0; e < this.inlineQueue.length; e++) {
			let t = this.inlineQueue[e];
			this.inlineTokens(t.src, t.tokens);
		}
		return this.inlineQueue = [], this.tokens;
	}
	blockTokens(e, t = [], n = !1) {
		for (this.options.pedantic && (e = e.replace(zC.tabCharGlobal, "    ").replace(zC.spaceLine, "")); e;) {
			let r;
			if (this.options.extensions?.block?.some((n) => (r = n.call({ lexer: this }, e, t)) ? (e = e.substring(r.raw.length), t.push(r), !0) : !1)) continue;
			if (r = this.tokenizer.space(e)) {
				e = e.substring(r.raw.length);
				let n = t.at(-1);
				r.raw.length === 1 && n !== void 0 ? n.raw += "\n" : t.push(r);
				continue;
			}
			if (r = this.tokenizer.code(e)) {
				e = e.substring(r.raw.length);
				let n = t.at(-1);
				n?.type === "paragraph" || n?.type === "text" ? (n.raw += (n.raw.endsWith("\n") ? "" : "\n") + r.raw, n.text += "\n" + r.text, this.inlineQueue.at(-1).src = n.text) : t.push(r);
				continue;
			}
			if ((r = this.tokenizer.fences(e)) || (r = this.tokenizer.heading(e)) || (r = this.tokenizer.hr(e)) || (r = this.tokenizer.blockquote(e)) || (r = this.tokenizer.list(e)) || (r = this.tokenizer.html(e))) {
				e = e.substring(r.raw.length), t.push(r);
				continue;
			}
			if (r = this.tokenizer.def(e)) {
				e = e.substring(r.raw.length);
				let n = t.at(-1);
				n?.type === "paragraph" || n?.type === "text" ? (n.raw += (n.raw.endsWith("\n") ? "" : "\n") + r.raw, n.text += "\n" + r.raw, this.inlineQueue.at(-1).src = n.text) : this.tokens.links[r.tag] || (this.tokens.links[r.tag] = {
					href: r.href,
					title: r.title
				}, t.push(r));
				continue;
			}
			if ((r = this.tokenizer.table(e)) || (r = this.tokenizer.lheading(e))) {
				e = e.substring(r.raw.length), t.push(r);
				continue;
			}
			let i = e;
			if (this.options.extensions?.startBlock) {
				let t = 1 / 0, n = e.slice(1), r;
				this.options.extensions.startBlock.forEach((e) => {
					r = e.call({ lexer: this }, n), typeof r == "number" && r >= 0 && (t = Math.min(t, r));
				}), t < 1 / 0 && t >= 0 && (i = e.substring(0, t + 1));
			}
			if (this.state.top && (r = this.tokenizer.paragraph(i))) {
				let a = t.at(-1);
				n && a?.type === "paragraph" ? (a.raw += (a.raw.endsWith("\n") ? "" : "\n") + r.raw, a.text += "\n" + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = a.text) : t.push(r), n = i.length !== e.length, e = e.substring(r.raw.length);
			} else if (r = this.tokenizer.text(e)) {
				e = e.substring(r.raw.length);
				let n = t.at(-1);
				n?.type === "text" ? (n.raw += (n.raw.endsWith("\n") ? "" : "\n") + r.raw, n.text += "\n" + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = n.text) : t.push(r);
			} else if (e) {
				let t = "Infinite loop on byte: " + e.charCodeAt(0);
				if (this.options.silent) {
					console.error(t);
					break;
				}
				throw Error(t);
			}
		}
		return this.state.top = !0, t;
	}
	inline(e, t = []) {
		return this.inlineQueue.push({
			src: e,
			tokens: t
		}), t;
	}
	inlineTokens(e, t = []) {
		let n = e, r = null;
		if (this.tokens.links) {
			let e = Object.keys(this.tokens.links);
			if (e.length > 0) for (; (r = this.tokenizer.rules.inline.reflinkSearch.exec(n)) != null;) e.includes(r[0].slice(r[0].lastIndexOf("[") + 1, -1)) && (n = n.slice(0, r.index) + "[" + "a".repeat(r[0].length - 2) + "]" + n.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
		}
		for (; (r = this.tokenizer.rules.inline.anyPunctuation.exec(n)) != null;) n = n.slice(0, r.index) + "++" + n.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
		let i;
		for (; (r = this.tokenizer.rules.inline.blockSkip.exec(n)) != null;) i = r[2] ? r[2].length : 0, n = n.slice(0, r.index + i) + "[" + "a".repeat(r[0].length - i - 2) + "]" + n.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
		n = this.options.hooks?.emStrongMask?.call({ lexer: this }, n) ?? n;
		let a = !1, o = "";
		for (; e;) {
			a || (o = ""), a = !1;
			let r;
			if (this.options.extensions?.inline?.some((n) => (r = n.call({ lexer: this }, e, t)) ? (e = e.substring(r.raw.length), t.push(r), !0) : !1)) continue;
			if ((r = this.tokenizer.escape(e)) || (r = this.tokenizer.tag(e)) || (r = this.tokenizer.link(e))) {
				e = e.substring(r.raw.length), t.push(r);
				continue;
			}
			if (r = this.tokenizer.reflink(e, this.tokens.links)) {
				e = e.substring(r.raw.length);
				let n = t.at(-1);
				r.type === "text" && n?.type === "text" ? (n.raw += r.raw, n.text += r.text) : t.push(r);
				continue;
			}
			if ((r = this.tokenizer.emStrong(e, n, o)) || (r = this.tokenizer.codespan(e)) || (r = this.tokenizer.br(e)) || (r = this.tokenizer.del(e)) || (r = this.tokenizer.autolink(e)) || !this.state.inLink && (r = this.tokenizer.url(e))) {
				e = e.substring(r.raw.length), t.push(r);
				continue;
			}
			let i = e;
			if (this.options.extensions?.startInline) {
				let t = 1 / 0, n = e.slice(1), r;
				this.options.extensions.startInline.forEach((e) => {
					r = e.call({ lexer: this }, n), typeof r == "number" && r >= 0 && (t = Math.min(t, r));
				}), t < 1 / 0 && t >= 0 && (i = e.substring(0, t + 1));
			}
			if (r = this.tokenizer.inlineText(i)) {
				e = e.substring(r.raw.length), r.raw.slice(-1) !== "_" && (o = r.raw.slice(-1)), a = !0;
				let n = t.at(-1);
				n?.type === "text" ? (n.raw += r.raw, n.text += r.text) : t.push(r);
			} else if (e) {
				let t = "Infinite loop on byte: " + e.charCodeAt(0);
				if (this.options.silent) {
					console.error(t);
					break;
				}
				throw Error(t);
			}
		}
		return t;
	}
}, eT = class {
	options;
	parser;
	constructor(e) {
		this.options = e || FC;
	}
	space(e) {
		return "";
	}
	code({ text: e, lang: t, escaped: n }) {
		let r = (t || "").match(zC.notSpaceStart)?.[0], i = e.replace(zC.endingNewline, "") + "\n";
		return r ? "<pre><code class=\"language-" + Gw(r) + "\">" + (n ? i : Gw(i, !0)) + "</code></pre>\n" : "<pre><code>" + (n ? i : Gw(i, !0)) + "</code></pre>\n";
	}
	blockquote({ tokens: e }) {
		return `<blockquote>
${this.parser.parse(e)}</blockquote>
`;
	}
	html({ text: e }) {
		return e;
	}
	def(e) {
		return "";
	}
	heading({ tokens: e, depth: t }) {
		return `<h${t}>${this.parser.parseInline(e)}</h${t}>
`;
	}
	hr(e) {
		return "<hr>\n";
	}
	list(e) {
		let t = e.ordered, n = e.start, r = "";
		for (let t = 0; t < e.items.length; t++) {
			let n = e.items[t];
			r += this.listitem(n);
		}
		let i = t ? "ol" : "ul", a = t && n !== 1 ? " start=\"" + n + "\"" : "";
		return "<" + i + a + ">\n" + r + "</" + i + ">\n";
	}
	listitem(e) {
		let t = "";
		if (e.task) {
			let n = this.checkbox({ checked: !!e.checked });
			e.loose ? e.tokens[0]?.type === "paragraph" ? (e.tokens[0].text = n + " " + e.tokens[0].text, e.tokens[0].tokens && e.tokens[0].tokens.length > 0 && e.tokens[0].tokens[0].type === "text" && (e.tokens[0].tokens[0].text = n + " " + Gw(e.tokens[0].tokens[0].text), e.tokens[0].tokens[0].escaped = !0)) : e.tokens.unshift({
				type: "text",
				raw: n + " ",
				text: n + " ",
				escaped: !0
			}) : t += n + " ";
		}
		return t += this.parser.parse(e.tokens, !!e.loose), `<li>${t}</li>
`;
	}
	checkbox({ checked: e }) {
		return "<input " + (e ? "checked=\"\" " : "") + "disabled=\"\" type=\"checkbox\">";
	}
	paragraph({ tokens: e }) {
		return `<p>${this.parser.parseInline(e)}</p>
`;
	}
	table(e) {
		let t = "", n = "";
		for (let t = 0; t < e.header.length; t++) n += this.tablecell(e.header[t]);
		t += this.tablerow({ text: n });
		let r = "";
		for (let t = 0; t < e.rows.length; t++) {
			let i = e.rows[t];
			n = "";
			for (let e = 0; e < i.length; e++) n += this.tablecell(i[e]);
			r += this.tablerow({ text: n });
		}
		return r &&= `<tbody>${r}</tbody>`, "<table>\n<thead>\n" + t + "</thead>\n" + r + "</table>\n";
	}
	tablerow({ text: e }) {
		return `<tr>
${e}</tr>
`;
	}
	tablecell(e) {
		let t = this.parser.parseInline(e.tokens), n = e.header ? "th" : "td";
		return (e.align ? `<${n} align="${e.align}">` : `<${n}>`) + t + `</${n}>
`;
	}
	strong({ tokens: e }) {
		return `<strong>${this.parser.parseInline(e)}</strong>`;
	}
	em({ tokens: e }) {
		return `<em>${this.parser.parseInline(e)}</em>`;
	}
	codespan({ text: e }) {
		return `<code>${Gw(e, !0)}</code>`;
	}
	br(e) {
		return "<br>";
	}
	del({ tokens: e }) {
		return `<del>${this.parser.parseInline(e)}</del>`;
	}
	link({ href: e, title: t, tokens: n }) {
		let r = this.parser.parseInline(n), i = Kw(e);
		if (i === null) return r;
		e = i;
		let a = "<a href=\"" + e + "\"";
		return t && (a += " title=\"" + Gw(t) + "\""), a += ">" + r + "</a>", a;
	}
	image({ href: e, title: t, text: n, tokens: r }) {
		r && (n = this.parser.parseInline(r, this.parser.textRenderer));
		let i = Kw(e);
		if (i === null) return Gw(n);
		e = i;
		let a = `<img src="${e}" alt="${n}"`;
		return t && (a += ` title="${Gw(t)}"`), a += ">", a;
	}
	text(e) {
		return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : "escaped" in e && e.escaped ? e.text : Gw(e.text);
	}
}, tT = class {
	strong({ text: e }) {
		return e;
	}
	em({ text: e }) {
		return e;
	}
	codespan({ text: e }) {
		return e;
	}
	del({ text: e }) {
		return e;
	}
	html({ text: e }) {
		return e;
	}
	text({ text: e }) {
		return e;
	}
	link({ text: e }) {
		return "" + e;
	}
	image({ text: e }) {
		return "" + e;
	}
	br() {
		return "";
	}
}, nT = class e {
	options;
	renderer;
	textRenderer;
	constructor(e) {
		this.options = e || FC, this.options.renderer = this.options.renderer || new eT(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new tT();
	}
	static parse(t, n) {
		return new e(n).parse(t);
	}
	static parseInline(t, n) {
		return new e(n).parseInline(t);
	}
	parse(e, t = !0) {
		let n = "";
		for (let r = 0; r < e.length; r++) {
			let i = e[r];
			if (this.options.extensions?.renderers?.[i.type]) {
				let e = i, t = this.options.extensions.renderers[e.type].call({ parser: this }, e);
				if (t !== !1 || ![
					"space",
					"hr",
					"heading",
					"code",
					"table",
					"blockquote",
					"list",
					"html",
					"def",
					"paragraph",
					"text"
				].includes(e.type)) {
					n += t || "";
					continue;
				}
			}
			let a = i;
			switch (a.type) {
				case "space":
					n += this.renderer.space(a);
					continue;
				case "hr":
					n += this.renderer.hr(a);
					continue;
				case "heading":
					n += this.renderer.heading(a);
					continue;
				case "code":
					n += this.renderer.code(a);
					continue;
				case "table":
					n += this.renderer.table(a);
					continue;
				case "blockquote":
					n += this.renderer.blockquote(a);
					continue;
				case "list":
					n += this.renderer.list(a);
					continue;
				case "html":
					n += this.renderer.html(a);
					continue;
				case "def":
					n += this.renderer.def(a);
					continue;
				case "paragraph":
					n += this.renderer.paragraph(a);
					continue;
				case "text": {
					let i = a, o = this.renderer.text(i);
					for (; r + 1 < e.length && e[r + 1].type === "text";) i = e[++r], o += "\n" + this.renderer.text(i);
					n += t ? this.renderer.paragraph({
						type: "paragraph",
						raw: o,
						text: o,
						tokens: [{
							type: "text",
							raw: o,
							text: o,
							escaped: !0
						}]
					}) : o;
					continue;
				}
				default: {
					let e = "Token with \"" + a.type + "\" type was not found.";
					if (this.options.silent) return console.error(e), "";
					throw Error(e);
				}
			}
		}
		return n;
	}
	parseInline(e, t = this.renderer) {
		let n = "";
		for (let r = 0; r < e.length; r++) {
			let i = e[r];
			if (this.options.extensions?.renderers?.[i.type]) {
				let e = this.options.extensions.renderers[i.type].call({ parser: this }, i);
				if (e !== !1 || ![
					"escape",
					"html",
					"link",
					"image",
					"strong",
					"em",
					"codespan",
					"br",
					"del",
					"text"
				].includes(i.type)) {
					n += e || "";
					continue;
				}
			}
			let a = i;
			switch (a.type) {
				case "escape":
					n += t.text(a);
					break;
				case "html":
					n += t.html(a);
					break;
				case "link":
					n += t.link(a);
					break;
				case "image":
					n += t.image(a);
					break;
				case "strong":
					n += t.strong(a);
					break;
				case "em":
					n += t.em(a);
					break;
				case "codespan":
					n += t.codespan(a);
					break;
				case "br":
					n += t.br(a);
					break;
				case "del":
					n += t.del(a);
					break;
				case "text":
					n += t.text(a);
					break;
				default: {
					let e = "Token with \"" + a.type + "\" type was not found.";
					if (this.options.silent) return console.error(e), "";
					throw Error(e);
				}
			}
		}
		return n;
	}
}, rT = class {
	options;
	block;
	constructor(e) {
		this.options = e || FC;
	}
	static passThroughHooks = /* @__PURE__ */ new Set([
		"preprocess",
		"postprocess",
		"processAllTokens",
		"emStrongMask"
	]);
	static passThroughHooksRespectAsync = /* @__PURE__ */ new Set([
		"preprocess",
		"postprocess",
		"processAllTokens"
	]);
	preprocess(e) {
		return e;
	}
	postprocess(e) {
		return e;
	}
	processAllTokens(e) {
		return e;
	}
	emStrongMask(e) {
		return e;
	}
	provideLexer() {
		return this.block ? $w.lex : $w.lexInline;
	}
	provideParser() {
		return this.block ? nT.parse : nT.parseInline;
	}
}, iT = new class {
	defaults = PC();
	options = this.setOptions;
	parse = this.parseMarkdown(!0);
	parseInline = this.parseMarkdown(!1);
	Parser = nT;
	Renderer = eT;
	TextRenderer = tT;
	Lexer = $w;
	Tokenizer = Qw;
	Hooks = rT;
	constructor(...e) {
		this.use(...e);
	}
	walkTokens(e, t) {
		let n = [];
		for (let r of e) switch (n = n.concat(t.call(this, r)), r.type) {
			case "table": {
				let e = r;
				for (let r of e.header) n = n.concat(this.walkTokens(r.tokens, t));
				for (let r of e.rows) for (let e of r) n = n.concat(this.walkTokens(e.tokens, t));
				break;
			}
			case "list": {
				let e = r;
				n = n.concat(this.walkTokens(e.items, t));
				break;
			}
			default: {
				let e = r;
				this.defaults.extensions?.childTokens?.[e.type] ? this.defaults.extensions.childTokens[e.type].forEach((r) => {
					let i = e[r].flat(1 / 0);
					n = n.concat(this.walkTokens(i, t));
				}) : e.tokens && (n = n.concat(this.walkTokens(e.tokens, t)));
			}
		}
		return n;
	}
	use(...e) {
		let t = this.defaults.extensions || {
			renderers: {},
			childTokens: {}
		};
		return e.forEach((e) => {
			let n = { ...e };
			if (n.async = this.defaults.async || n.async || !1, e.extensions && (e.extensions.forEach((e) => {
				if (!e.name) throw Error("extension name required");
				if ("renderer" in e) {
					let n = t.renderers[e.name];
					n ? t.renderers[e.name] = function(...t) {
						let r = e.renderer.apply(this, t);
						return r === !1 && (r = n.apply(this, t)), r;
					} : t.renderers[e.name] = e.renderer;
				}
				if ("tokenizer" in e) {
					if (!e.level || e.level !== "block" && e.level !== "inline") throw Error("extension level must be 'block' or 'inline'");
					let n = t[e.level];
					n ? n.unshift(e.tokenizer) : t[e.level] = [e.tokenizer], e.start && (e.level === "block" ? t.startBlock ? t.startBlock.push(e.start) : t.startBlock = [e.start] : e.level === "inline" && (t.startInline ? t.startInline.push(e.start) : t.startInline = [e.start]));
				}
				"childTokens" in e && e.childTokens && (t.childTokens[e.name] = e.childTokens);
			}), n.extensions = t), e.renderer) {
				let t = this.defaults.renderer || new eT(this.defaults);
				for (let n in e.renderer) {
					if (!(n in t)) throw Error(`renderer '${n}' does not exist`);
					if (["options", "parser"].includes(n)) continue;
					let r = n, i = e.renderer[r], a = t[r];
					t[r] = (...e) => {
						let n = i.apply(t, e);
						return n === !1 && (n = a.apply(t, e)), n || "";
					};
				}
				n.renderer = t;
			}
			if (e.tokenizer) {
				let t = this.defaults.tokenizer || new Qw(this.defaults);
				for (let n in e.tokenizer) {
					if (!(n in t)) throw Error(`tokenizer '${n}' does not exist`);
					if ([
						"options",
						"rules",
						"lexer"
					].includes(n)) continue;
					let r = n, i = e.tokenizer[r], a = t[r];
					t[r] = (...e) => {
						let n = i.apply(t, e);
						return n === !1 && (n = a.apply(t, e)), n;
					};
				}
				n.tokenizer = t;
			}
			if (e.hooks) {
				let t = this.defaults.hooks || new rT();
				for (let n in e.hooks) {
					if (!(n in t)) throw Error(`hook '${n}' does not exist`);
					if (["options", "block"].includes(n)) continue;
					let r = n, i = e.hooks[r], a = t[r];
					t[r] = rT.passThroughHooks.has(n) ? (e) => {
						if (this.defaults.async && rT.passThroughHooksRespectAsync.has(n)) return (async () => {
							let n = await i.call(t, e);
							return a.call(t, n);
						})();
						let r = i.call(t, e);
						return a.call(t, r);
					} : (...e) => {
						if (this.defaults.async) return (async () => {
							let n = await i.apply(t, e);
							return n === !1 && (n = await a.apply(t, e)), n;
						})();
						let n = i.apply(t, e);
						return n === !1 && (n = a.apply(t, e)), n;
					};
				}
				n.hooks = t;
			}
			if (e.walkTokens) {
				let t = this.defaults.walkTokens, r = e.walkTokens;
				n.walkTokens = function(e) {
					let n = [];
					return n.push(r.call(this, e)), t && (n = n.concat(t.call(this, e))), n;
				};
			}
			this.defaults = {
				...this.defaults,
				...n
			};
		}), this;
	}
	setOptions(e) {
		return this.defaults = {
			...this.defaults,
			...e
		}, this;
	}
	lexer(e, t) {
		return $w.lex(e, t ?? this.defaults);
	}
	parser(e, t) {
		return nT.parse(e, t ?? this.defaults);
	}
	parseMarkdown(e) {
		return (t, n) => {
			let r = { ...n }, i = {
				...this.defaults,
				...r
			}, a = this.onError(!!i.silent, !!i.async);
			if (this.defaults.async === !0 && r.async === !1) return a(/* @__PURE__ */ Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
			if (typeof t > "u" || t === null) return a(/* @__PURE__ */ Error("marked(): input parameter is undefined or null"));
			if (typeof t != "string") return a(/* @__PURE__ */ Error("marked(): input parameter is of type " + Object.prototype.toString.call(t) + ", string expected"));
			if (i.hooks && (i.hooks.options = i, i.hooks.block = e), i.async) return (async () => {
				let n = i.hooks ? await i.hooks.preprocess(t) : t, r = await (i.hooks ? await i.hooks.provideLexer() : e ? $w.lex : $w.lexInline)(n, i), a = i.hooks ? await i.hooks.processAllTokens(r) : r;
				i.walkTokens && await Promise.all(this.walkTokens(a, i.walkTokens));
				let o = await (i.hooks ? await i.hooks.provideParser() : e ? nT.parse : nT.parseInline)(a, i);
				return i.hooks ? await i.hooks.postprocess(o) : o;
			})().catch(a);
			try {
				i.hooks && (t = i.hooks.preprocess(t));
				let n = (i.hooks ? i.hooks.provideLexer() : e ? $w.lex : $w.lexInline)(t, i);
				i.hooks && (n = i.hooks.processAllTokens(n)), i.walkTokens && this.walkTokens(n, i.walkTokens);
				let r = (i.hooks ? i.hooks.provideParser() : e ? nT.parse : nT.parseInline)(n, i);
				return i.hooks && (r = i.hooks.postprocess(r)), r;
			} catch (e) {
				return a(e);
			}
		};
	}
	onError(e, t) {
		return (n) => {
			if (n.message += "\nPlease report this to https://github.com/markedjs/marked.", e) {
				let e = "<p>An error occurred:</p><pre>" + Gw(n.message + "", !0) + "</pre>";
				return t ? Promise.resolve(e) : e;
			}
			if (t) return Promise.reject(n);
			throw n;
		};
	}
}();
function Q(e, t) {
	return iT.parse(e, t);
}
Q.options = Q.setOptions = function(e) {
	return iT.setOptions(e), Q.defaults = iT.defaults, IC(Q.defaults), Q;
}, Q.getDefaults = PC, Q.defaults = FC, Q.use = function(...e) {
	return iT.use(...e), Q.defaults = iT.defaults, IC(Q.defaults), Q;
}, Q.walkTokens = function(e, t) {
	return iT.walkTokens(e, t);
}, Q.parseInline = iT.parseInline, Q.Parser = nT, Q.parser = nT.parse, Q.Renderer = eT, Q.TextRenderer = tT, Q.Lexer = $w, Q.lexer = $w.lex, Q.Tokenizer = Qw, Q.Hooks = rT, Q.parse = Q, Q.options, Q.setOptions, Q.use, Q.walkTokens, Q.parseInline, nT.parse, $w.lex;
// node_modules/streamdown/dist/chunk-JAPRZBRM.js
var $ = (...e) => __(zh(e)), aT = (e, t, n) => {
	let r = typeof t == "string" ? new Blob([t], { type: n }) : t, i = URL.createObjectURL(r), a = document.createElement("a");
	a.href = i, a.download = e, document.body.appendChild(a), a.click(), document.body.removeChild(a), URL.revokeObjectURL(i);
}, oT = (0, x.createContext)({ code: "" }), sT = () => (0, x.useContext)(oT), cT = ({ onCopy: e, onError: t, timeout: n = 2e3, children: r, className: i, code: a, ...o }) => {
	let [s, c] = (0, x.useState)(!1), l = (0, x.useRef)(0), { code: u } = sT(), { isAnimating: d } = (0, x.useContext)(OE), f = a ?? u, p = async () => {
		var r;
		if (typeof window > "u" || !((r = navigator == null ? void 0 : navigator.clipboard) != null && r.writeText)) t?.(/* @__PURE__ */ Error("Clipboard API not available"));
		else try {
			s || (await navigator.clipboard.writeText(f), c(!0), e?.(), l.current = window.setTimeout(() => c(!1), n));
		} catch (e) {
			t?.(e);
		}
	};
	(0, x.useEffect)(() => () => {
		window.clearTimeout(l.current);
	}, []);
	let m = s ? kh : Ah;
	return (0, X.jsx)("button", {
		className: $("cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50", i),
		"data-streamdown": "code-block-copy-button",
		disabled: d,
		onClick: p,
		title: "Copy Code",
		type: "button",
		...o,
		children: r ?? (0, X.jsx)(m, { size: 14 })
	});
}, lT = {
	"1c": "1c",
	"1c-query": "1cq",
	abap: "abap",
	"actionscript-3": "as",
	ada: "ada",
	adoc: "adoc",
	"angular-html": "html",
	"angular-ts": "ts",
	apache: "conf",
	apex: "cls",
	apl: "apl",
	applescript: "applescript",
	ara: "ara",
	asciidoc: "adoc",
	asm: "asm",
	astro: "astro",
	awk: "awk",
	ballerina: "bal",
	bash: "sh",
	bat: "bat",
	batch: "bat",
	be: "be",
	beancount: "beancount",
	berry: "berry",
	bibtex: "bib",
	bicep: "bicep",
	blade: "blade.php",
	bsl: "bsl",
	c: "c",
	"c#": "cs",
	"c++": "cpp",
	cadence: "cdc",
	cairo: "cairo",
	cdc: "cdc",
	clarity: "clar",
	clj: "clj",
	clojure: "clj",
	"closure-templates": "soy",
	cmake: "cmake",
	cmd: "cmd",
	cobol: "cob",
	codeowners: "CODEOWNERS",
	codeql: "ql",
	coffee: "coffee",
	coffeescript: "coffee",
	"common-lisp": "lisp",
	console: "sh",
	coq: "v",
	cpp: "cpp",
	cql: "cql",
	crystal: "cr",
	cs: "cs",
	csharp: "cs",
	css: "css",
	csv: "csv",
	cue: "cue",
	cypher: "cql",
	d: "d",
	dart: "dart",
	dax: "dax",
	desktop: "desktop",
	diff: "diff",
	docker: "dockerfile",
	dockerfile: "dockerfile",
	dotenv: "env",
	"dream-maker": "dm",
	edge: "edge",
	elisp: "el",
	elixir: "ex",
	elm: "elm",
	"emacs-lisp": "el",
	erb: "erb",
	erl: "erl",
	erlang: "erl",
	f: "f",
	"f#": "fs",
	f03: "f03",
	f08: "f08",
	f18: "f18",
	f77: "f77",
	f90: "f90",
	f95: "f95",
	fennel: "fnl",
	fish: "fish",
	fluent: "ftl",
	for: "for",
	"fortran-fixed-form": "f",
	"fortran-free-form": "f90",
	fs: "fs",
	fsharp: "fs",
	fsl: "fsl",
	ftl: "ftl",
	gdresource: "tres",
	gdscript: "gd",
	gdshader: "gdshader",
	genie: "gs",
	gherkin: "feature",
	"git-commit": "gitcommit",
	"git-rebase": "gitrebase",
	gjs: "js",
	gleam: "gleam",
	"glimmer-js": "js",
	"glimmer-ts": "ts",
	glsl: "glsl",
	gnuplot: "plt",
	go: "go",
	gql: "gql",
	graphql: "graphql",
	groovy: "groovy",
	gts: "gts",
	hack: "hack",
	haml: "haml",
	handlebars: "hbs",
	haskell: "hs",
	haxe: "hx",
	hbs: "hbs",
	hcl: "hcl",
	hjson: "hjson",
	hlsl: "hlsl",
	hs: "hs",
	html: "html",
	"html-derivative": "html",
	http: "http",
	hxml: "hxml",
	hy: "hy",
	imba: "imba",
	ini: "ini",
	jade: "jade",
	java: "java",
	javascript: "js",
	jinja: "jinja",
	jison: "jison",
	jl: "jl",
	js: "js",
	json: "json",
	json5: "json5",
	jsonc: "jsonc",
	jsonl: "jsonl",
	jsonnet: "jsonnet",
	jssm: "jssm",
	jsx: "jsx",
	julia: "jl",
	kotlin: "kt",
	kql: "kql",
	kt: "kt",
	kts: "kts",
	kusto: "kql",
	latex: "tex",
	lean: "lean",
	lean4: "lean",
	less: "less",
	liquid: "liquid",
	lisp: "lisp",
	lit: "lit",
	llvm: "ll",
	log: "log",
	logo: "logo",
	lua: "lua",
	luau: "luau",
	make: "mak",
	makefile: "mak",
	markdown: "md",
	marko: "marko",
	matlab: "m",
	md: "md",
	mdc: "mdc",
	mdx: "mdx",
	mediawiki: "wiki",
	mermaid: "mmd",
	mips: "s",
	mipsasm: "s",
	mmd: "mmd",
	mojo: "mojo",
	move: "move",
	nar: "nar",
	narrat: "narrat",
	nextflow: "nf",
	nf: "nf",
	nginx: "conf",
	nim: "nim",
	nix: "nix",
	nu: "nu",
	nushell: "nu",
	objc: "m",
	"objective-c": "m",
	"objective-cpp": "mm",
	ocaml: "ml",
	pascal: "pas",
	perl: "pl",
	perl6: "p6",
	php: "php",
	plsql: "pls",
	po: "po",
	polar: "polar",
	postcss: "pcss",
	pot: "pot",
	potx: "potx",
	powerquery: "pq",
	powershell: "ps1",
	prisma: "prisma",
	prolog: "pl",
	properties: "properties",
	proto: "proto",
	protobuf: "proto",
	ps: "ps",
	ps1: "ps1",
	pug: "pug",
	puppet: "pp",
	purescript: "purs",
	py: "py",
	python: "py",
	ql: "ql",
	qml: "qml",
	qmldir: "qmldir",
	qss: "qss",
	r: "r",
	racket: "rkt",
	raku: "raku",
	razor: "cshtml",
	rb: "rb",
	reg: "reg",
	regex: "regex",
	regexp: "regexp",
	rel: "rel",
	riscv: "s",
	rs: "rs",
	rst: "rst",
	ruby: "rb",
	rust: "rs",
	sas: "sas",
	sass: "sass",
	scala: "scala",
	scheme: "scm",
	scss: "scss",
	sdbl: "sdbl",
	sh: "sh",
	shader: "shader",
	shaderlab: "shader",
	shell: "sh",
	shellscript: "sh",
	shellsession: "sh",
	smalltalk: "st",
	solidity: "sol",
	soy: "soy",
	sparql: "rq",
	spl: "spl",
	splunk: "spl",
	sql: "sql",
	"ssh-config": "config",
	stata: "do",
	styl: "styl",
	stylus: "styl",
	svelte: "svelte",
	swift: "swift",
	"system-verilog": "sv",
	systemd: "service",
	talon: "talon",
	talonscript: "talon",
	tasl: "tasl",
	tcl: "tcl",
	templ: "templ",
	terraform: "tf",
	tex: "tex",
	tf: "tf",
	tfvars: "tfvars",
	toml: "toml",
	ts: "ts",
	"ts-tags": "ts",
	tsp: "tsp",
	tsv: "tsv",
	tsx: "tsx",
	turtle: "ttl",
	twig: "twig",
	typ: "typ",
	typescript: "ts",
	typespec: "tsp",
	typst: "typ",
	v: "v",
	vala: "vala",
	vb: "vb",
	verilog: "v",
	vhdl: "vhdl",
	vim: "vim",
	viml: "vim",
	vimscript: "vim",
	vue: "vue",
	"vue-html": "html",
	"vue-vine": "vine",
	vy: "vy",
	vyper: "vy",
	wasm: "wasm",
	wenyan: "wy",
	wgsl: "wgsl",
	wiki: "wiki",
	wikitext: "wiki",
	wit: "wit",
	wl: "wl",
	wolfram: "wl",
	xml: "xml",
	xsl: "xsl",
	yaml: "yaml",
	yml: "yml",
	zenscript: "zs",
	zig: "zig",
	zsh: "zsh",
	文言: "wy"
}, uT = ({ onDownload: e, onError: t, language: n, children: r, className: i, code: a, ...o }) => {
	let { code: s } = sT(), { isAnimating: c } = (0, x.useContext)(OE), l = a ?? s, u = `file.${n && n in lT ? lT[n] : "txt"}`;
	return (0, X.jsx)("button", {
		className: $("cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50", i),
		"data-streamdown": "code-block-download-button",
		disabled: c,
		onClick: () => {
			try {
				aT(u, l, "text/plain"), e?.();
			} catch (e) {
				t?.(e);
			}
		},
		title: "Download file",
		type: "button",
		...o,
		children: r ?? (0, X.jsx)(jh, { size: 14 })
	});
}, dT = () => (0, X.jsxs)("div", {
	className: "w-full divide-y divide-border overflow-hidden rounded-xl border border-border",
	children: [(0, X.jsx)("div", { className: "h-[46px] w-full bg-muted/80" }), (0, X.jsx)("div", {
		className: "flex w-full items-center justify-center p-4",
		children: (0, X.jsx)(Mh, { className: "size-4 animate-spin" })
	})]
}), fT = /\.[^/.]+$/, pT = ({ node: e, className: t, src: n, alt: r, ...i }) => {
	let a = async () => {
		if (n) try {
			let e = await (await fetch(n)).blob(), t = new URL(n, window.location.origin).pathname.split("/").pop() || "", i = t.split(".").pop(), a = t.includes(".") && i !== void 0 && i.length <= 4, o = "";
			if (a) o = t;
			else {
				let n = e.type, i = "png";
				n.includes("jpeg") || n.includes("jpg") ? i = "jpg" : n.includes("png") ? i = "png" : n.includes("svg") ? i = "svg" : n.includes("gif") ? i = "gif" : n.includes("webp") && (i = "webp"), o = `${(r || t || "image").replace(fT, "")}.${i}`;
			}
			aT(o, e, e.type);
		} catch (e) {
			console.error("Failed to download image:", e);
		}
	};
	return n ? (0, X.jsxs)("div", {
		className: "group relative my-4 inline-block",
		"data-streamdown": "image-wrapper",
		children: [
			(0, X.jsx)("img", {
				alt: r,
				className: $("max-w-full rounded-lg", t),
				"data-streamdown": "image",
				src: n,
				...i
			}),
			(0, X.jsx)("div", { className: "pointer-events-none absolute inset-0 hidden rounded-lg bg-black/10 group-hover:block" }),
			(0, X.jsx)("button", {
				className: $("absolute right-2 bottom-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border bg-background/90 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-background", "opacity-0 group-hover:opacity-100"),
				onClick: a,
				title: "Download image",
				type: "button",
				children: (0, X.jsx)(jh, { size: 14 })
			})
		]
	}) : null;
}, mT = async (e) => {
	let t = {
		startOnLoad: !1,
		theme: "default",
		securityLevel: "strict",
		fontFamily: "monospace",
		suppressErrorRendering: !0,
		...e
	}, n = (await import("./mermaid.core-Cycl5TkK.js")).default;
	return n.initialize(t), n;
}, hT = (e, t) => new Promise((t, n) => {
	let r = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(e))), i = new Image();
	i.crossOrigin = "anonymous", i.onload = () => {
		let e = document.createElement("canvas"), r = i.width * 5, a = i.height * 5;
		e.width = r, e.height = a;
		let o = e.getContext("2d");
		o ? (o.drawImage(i, 0, 0, r, a), e.toBlob((e) => {
			e ? t(e) : n(/* @__PURE__ */ Error("Failed to create PNG blob"));
		}, "image/png")) : n(/* @__PURE__ */ Error("Failed to create 2D canvas context for PNG export"));
	}, i.onerror = () => n(/* @__PURE__ */ Error("Failed to load SVG image")), i.src = r;
}), gT = ({ chart: e, children: t, className: n, onDownload: r, config: i, onError: a }) => {
	let [o, s] = (0, x.useState)(!1), c = (0, x.useRef)(null), { isAnimating: l } = (0, x.useContext)(OE), u = async (t) => {
		try {
			if (t === "mmd") {
				aT("diagram.mmd", e, "text/plain"), s(!1), r?.(t);
				return;
			}
			let n = await mT(i), o = e.split("").reduce((e, t) => (e << 5) - e + t.charCodeAt(0) | 0, 0), c = `mermaid-${Math.abs(o)}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, { svg: l } = await n.render(c, e);
			if (!l) {
				a?.(/* @__PURE__ */ Error("SVG not found. Please wait for the diagram to render."));
				return;
			}
			if (t === "svg") {
				aT("diagram.svg", l, "image/svg+xml"), s(!1), r?.(t);
				return;
			}
			if (t === "png") {
				aT("diagram.png", await hT(l), "image/png"), r?.(t), s(!1);
				return;
			}
		} catch (e) {
			a?.(e);
		}
	};
	return (0, x.useEffect)(() => {
		let e = (e) => {
			c.current && !c.current.contains(e.target) && s(!1);
		};
		return document.addEventListener("mousedown", e), () => {
			document.removeEventListener("mousedown", e);
		};
	}, []), (0, X.jsxs)("div", {
		className: "relative",
		ref: c,
		children: [(0, X.jsx)("button", {
			className: $("cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50", n),
			disabled: l,
			onClick: () => s(!o),
			title: "Download diagram",
			type: "button",
			children: t ?? (0, X.jsx)(jh, { size: 14 })
		}), o && (0, X.jsxs)("div", {
			className: "absolute top-full right-0 z-10 mt-1 min-w-[120px] overflow-hidden rounded-md border border-border bg-background shadow-lg",
			children: [
				(0, X.jsx)("button", {
					className: "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40",
					onClick: () => u("svg"),
					title: "Download diagram as SVG",
					type: "button",
					children: "SVG"
				}),
				(0, X.jsx)("button", {
					className: "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40",
					onClick: () => u("png"),
					title: "Download diagram as PNG",
					type: "button",
					children: "PNG"
				}),
				(0, X.jsx)("button", {
					className: "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40",
					onClick: () => u("mmd"),
					title: "Download diagram as MMD",
					type: "button",
					children: "MMD"
				})
			]
		})]
	});
}, _T = 0, vT = () => {
	_T += 1, _T === 1 && (document.body.style.overflow = "hidden");
}, yT = () => {
	_T = Math.max(0, _T - 1), _T === 0 && (document.body.style.overflow = "");
}, bT = ({ chart: e, config: t, onFullscreen: n, onExit: r, className: i, ...a }) => {
	let [o, s] = (0, x.useState)(!1), { isAnimating: c, controls: l } = (0, x.useContext)(OE), u = (() => {
		if (typeof l == "boolean") return l;
		let e = l.mermaid;
		return e === !1 ? !1 : e === !0 || e === void 0 || e.panZoom !== !1;
	})(), d = () => {
		s(!o);
	};
	return (0, x.useEffect)(() => {
		if (o) {
			vT();
			let e = (e) => {
				e.key === "Escape" && s(!1);
			};
			return document.addEventListener("keydown", e), () => {
				document.removeEventListener("keydown", e), yT();
			};
		}
	}, [o]), (0, x.useEffect)(() => {
		o ? n?.() : r && r();
	}, [
		o,
		n,
		r
	]), (0, X.jsxs)(X.Fragment, { children: [(0, X.jsx)("button", {
		className: $("cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50", i),
		disabled: c,
		onClick: d,
		title: "View fullscreen",
		type: "button",
		...a,
		children: (0, X.jsx)(Nh, { size: 14 })
	}), o && (0, X.jsxs)("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm",
		onClick: d,
		onKeyDown: (e) => {
			e.key === "Escape" && d();
		},
		role: "button",
		tabIndex: 0,
		children: [(0, X.jsx)("button", {
			className: "absolute top-4 right-4 z-10 rounded-md p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground",
			onClick: d,
			title: "Exit fullscreen",
			type: "button",
			children: (0, X.jsx)(Fh, { size: 20 })
		}), (0, X.jsx)("div", {
			className: "flex h-full w-full items-center justify-center p-4",
			onClick: (e) => e.stopPropagation(),
			onKeyDown: (e) => e.stopPropagation(),
			role: "presentation",
			children: (0, X.jsx)(NE, {
				chart: e,
				className: "h-full w-full [&>div]:h-full [&>div]:overflow-hidden [&_svg]:h-auto [&_svg]:w-auto",
				config: t,
				fullscreen: !0,
				showControls: u
			})
		})]
	})] });
}, xT = (e) => {
	let t = [], n = [], r = e.querySelectorAll("thead th");
	for (let e of r) t.push(e.textContent?.trim() || "");
	let i = e.querySelectorAll("tbody tr");
	for (let e of i) {
		let t = [], r = e.querySelectorAll("td");
		for (let e of r) t.push(e.textContent?.trim() || "");
		n.push(t);
	}
	return {
		headers: t,
		rows: n
	};
}, ST = (e) => {
	let { headers: t, rows: n } = e, r = (e) => {
		let t = !1, n = !1;
		for (let r = 0; r < e.length; r += 1) {
			let i = e[r];
			if (i === "\"") {
				t = !0, n = !0;
				break;
			}
			(i === "," || i === "\n") && (t = !0);
		}
		return t ? n ? `"${e.replace(/"/g, "\"\"")}"` : `"${e}"` : e;
	}, i = t.length > 0 ? n.length + 1 : n.length, a = Array(i), o = 0;
	t.length > 0 && (a[o] = t.map(r).join(","), o += 1);
	for (let e of n) a[o] = e.map(r).join(","), o += 1;
	return a.join("\n");
}, CT = (e) => {
	let { headers: t, rows: n } = e, r = (e) => {
		let t = !1;
		for (let n = 0; n < e.length; n += 1) {
			let r = e[n];
			if (r === "	" || r === "\n" || r === "\r") {
				t = !0;
				break;
			}
		}
		if (!t) return e;
		let n = [];
		for (let t = 0; t < e.length; t += 1) {
			let r = e[t];
			r === "	" ? n.push("\\t") : r === "\n" ? n.push("\\n") : r === "\r" ? n.push("\\r") : n.push(r);
		}
		return n.join("");
	}, i = t.length > 0 ? n.length + 1 : n.length, a = Array(i), o = 0;
	t.length > 0 && (a[o] = t.map(r).join("	"), o += 1);
	for (let e of n) a[o] = e.map(r).join("	"), o += 1;
	return a.join("\n");
}, wT = (e) => {
	let t = !1;
	for (let n = 0; n < e.length; n += 1) {
		let r = e[n];
		if (r === "\\" || r === "|") {
			t = !0;
			break;
		}
	}
	if (!t) return e;
	let n = [];
	for (let t = 0; t < e.length; t += 1) {
		let r = e[t];
		r === "\\" ? n.push("\\\\") : r === "|" ? n.push("\\|") : n.push(r);
	}
	return n.join("");
}, TT = (e) => {
	let { headers: t, rows: n } = e;
	if (t.length === 0) return "";
	let r = Array(n.length + 2), i = 0, a = t.map((e) => wT(e));
	r[i] = `| ${a.join(" | ")} |`, i += 1;
	let o = Array(t.length);
	for (let e = 0; e < t.length; e += 1) o[e] = "---";
	r[i] = `| ${o.join(" | ")} |`, i += 1;
	for (let e of n) if (e.length < t.length) {
		let n = Array(t.length);
		for (let r = 0; r < t.length; r += 1) n[r] = r < e.length ? wT(e[r]) : "";
		r[i] = `| ${n.join(" | ")} |`, i += 1;
	} else {
		let t = e.map((e) => wT(e));
		r[i] = `| ${t.join(" | ")} |`, i += 1;
	}
	return r.join("\n");
}, ET = ({ children: e, className: t, onCopy: n, onError: r, timeout: i = 2e3 }) => {
	let [a, o] = (0, x.useState)(!1), [s, c] = (0, x.useState)(!1), l = (0, x.useRef)(null), u = (0, x.useRef)(0), { isAnimating: d } = (0, x.useContext)(OE), f = async (e) => {
		var t;
		if (typeof window > "u" || !((t = navigator == null ? void 0 : navigator.clipboard) != null && t.write)) r?.(/* @__PURE__ */ Error("Clipboard API not available"));
		else try {
			let t = (l.current?.closest("[data-streamdown=\"table-wrapper\"]"))?.querySelector("table");
			if (!t) {
				r?.(/* @__PURE__ */ Error("Table not found"));
				return;
			}
			let a = xT(t), s = e === "csv" ? ST(a) : CT(a), d = new ClipboardItem({
				"text/plain": new Blob([s], { type: "text/plain" }),
				"text/html": new Blob([t.outerHTML], { type: "text/html" })
			});
			await navigator.clipboard.write([d]), c(!0), o(!1), n?.(e), u.current = window.setTimeout(() => c(!1), i);
		} catch (e) {
			r?.(e);
		}
	};
	(0, x.useEffect)(() => {
		let e = (e) => {
			l.current && !l.current.contains(e.target) && o(!1);
		};
		return document.addEventListener("mousedown", e), () => {
			document.removeEventListener("mousedown", e), window.clearTimeout(u.current);
		};
	}, []);
	let p = s ? kh : Ah;
	return (0, X.jsxs)("div", {
		className: "relative",
		ref: l,
		children: [(0, X.jsx)("button", {
			className: $("cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50", t),
			disabled: d,
			onClick: () => o(!a),
			title: "Copy table",
			type: "button",
			children: e ?? (0, X.jsx)(p, { size: 14 })
		}), a && (0, X.jsxs)("div", {
			className: "absolute top-full right-0 z-10 mt-1 min-w-[120px] overflow-hidden rounded-md border border-border bg-background shadow-lg",
			children: [(0, X.jsx)("button", {
				className: "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40",
				onClick: () => f("csv"),
				title: "Copy table as CSV",
				type: "button",
				children: "CSV"
			}), (0, X.jsx)("button", {
				className: "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40",
				onClick: () => f("tsv"),
				title: "Copy table as TSV",
				type: "button",
				children: "TSV"
			})]
		})]
	});
}, DT = ({ children: e, className: t, onDownload: n, onError: r }) => {
	let [i, a] = (0, x.useState)(!1), o = (0, x.useRef)(null), { isAnimating: s } = (0, x.useContext)(OE), c = (e) => {
		try {
			let t = (o.current?.closest("[data-streamdown=\"table-wrapper\"]"))?.querySelector("table");
			if (!t) {
				r?.(/* @__PURE__ */ Error("Table not found"));
				return;
			}
			let i = xT(t), s = e === "csv" ? ST(i) : TT(i);
			aT(`table.${e === "csv" ? "csv" : "md"}`, s, e === "csv" ? "text/csv" : "text/markdown"), a(!1), n?.(e);
		} catch (e) {
			r?.(e);
		}
	};
	return (0, x.useEffect)(() => {
		let e = (e) => {
			o.current && !o.current.contains(e.target) && a(!1);
		};
		return document.addEventListener("mousedown", e), () => {
			document.removeEventListener("mousedown", e);
		};
	}, []), (0, X.jsxs)("div", {
		className: "relative",
		ref: o,
		children: [(0, X.jsx)("button", {
			className: $("cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50", t),
			disabled: s,
			onClick: () => a(!i),
			title: "Download table",
			type: "button",
			children: e ?? (0, X.jsx)(jh, { size: 14 })
		}), i && (0, X.jsxs)("div", {
			className: "absolute top-full right-0 z-10 mt-1 min-w-[120px] overflow-hidden rounded-md border border-border bg-background shadow-lg",
			children: [(0, X.jsx)("button", {
				className: "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40",
				onClick: () => c("csv"),
				title: "Download table as CSV",
				type: "button",
				children: "CSV"
			}), (0, X.jsx)("button", {
				className: "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40",
				onClick: () => c("markdown"),
				title: "Download table as Markdown",
				type: "button",
				children: "Markdown"
			})]
		})]
	});
}, OT = ({ children: e, className: t, showControls: n, ...r }) => (0, X.jsxs)("div", {
	className: "my-4 flex flex-col space-y-2",
	"data-streamdown": "table-wrapper",
	children: [n && (0, X.jsxs)("div", {
		className: "flex items-center justify-end gap-1",
		children: [(0, X.jsx)(ET, {}), (0, X.jsx)(DT, {})]
	}), (0, X.jsx)("div", {
		className: "overflow-x-auto",
		children: (0, X.jsx)("table", {
			className: $("w-full border-collapse border border-border", t),
			"data-streamdown": "table",
			...r,
			children: e
		})
	})]
}), kT = (0, x.lazy)(() => import("./code-block-IT6T5CEO-GaDUrFFg.js").then((e) => ({ default: e.CodeBlock }))), AT = (0, x.lazy)(() => import("./mermaid-VLURNSYL-DbXFAW4m.js").then((e) => ({ default: e.Mermaid }))), jT = /language-([^\s]+)/;
function MT(e, t) {
	if (!(e != null && e.position || t != null && t.position)) return !0;
	if (!(e != null && e.position && t != null && t.position)) return !1;
	let n = e.position.start, r = t.position.start, i = e.position.end, a = t.position.end;
	return n?.line === r?.line && n?.column === r?.column && i?.line === a?.line && i?.column === a?.column;
}
function NT(e, t) {
	return e.className === t.className && MT(e.node, t.node);
}
var PT = (e, t) => typeof e == "boolean" ? e : e[t] !== !1, FT = (e, t) => {
	if (typeof e == "boolean") return e;
	let n = e.mermaid;
	return n === !1 ? !1 : n === !0 || n === void 0 || n[t] !== !1;
}, IT = (0, x.memo)(({ children: e, className: t, node: n, ...r }) => (0, X.jsx)("ol", {
	className: $("list-inside list-decimal whitespace-normal", t),
	"data-streamdown": "ordered-list",
	...r,
	children: e
}), (e, t) => NT(e, t));
IT.displayName = "MarkdownOl";
var LT = (0, x.memo)(({ children: e, className: t, node: n, ...r }) => (0, X.jsx)("li", {
	className: $("py-1 [&>p]:inline", t),
	"data-streamdown": "list-item",
	...r,
	children: e
}), (e, t) => e.className === t.className && MT(e.node, t.node));
LT.displayName = "MarkdownLi";
var RT = (0, x.memo)(({ children: e, className: t, node: n, ...r }) => (0, X.jsx)("ul", {
	className: $("list-inside list-disc whitespace-normal", t),
	"data-streamdown": "unordered-list",
	...r,
	children: e
}), (e, t) => NT(e, t));
RT.displayName = "MarkdownUl";
var zT = (0, x.memo)(({ className: e, node: t, ...n }) => (0, X.jsx)("hr", {
	className: $("my-6 border-border", e),
	"data-streamdown": "horizontal-rule",
	...n
}), (e, t) => NT(e, t));
zT.displayName = "MarkdownHr";
var BT = (0, x.memo)(({ children: e, className: t, node: n, ...r }) => (0, X.jsx)("span", {
	className: $("font-semibold", t),
	"data-streamdown": "strong",
	...r,
	children: e
}), (e, t) => NT(e, t));
BT.displayName = "MarkdownStrong";
var VT = (0, x.memo)(({ children: e, className: t, href: n, node: r, ...i }) => {
	let a = n === "streamdown:incomplete-link";
	return (0, X.jsx)("a", {
		className: $("wrap-anywhere font-medium text-primary underline", t),
		"data-incomplete": a,
		"data-streamdown": "link",
		href: n,
		rel: "noreferrer",
		target: "_blank",
		...i,
		children: e
	});
}, (e, t) => NT(e, t) && e.href === t.href);
VT.displayName = "MarkdownA";
var HT = (0, x.memo)(({ children: e, className: t, node: n, ...r }) => (0, X.jsx)("h1", {
	className: $("mt-6 mb-2 font-semibold text-3xl", t),
	"data-streamdown": "heading-1",
	...r,
	children: e
}), (e, t) => NT(e, t));
HT.displayName = "MarkdownH1";
var UT = (0, x.memo)(({ children: e, className: t, node: n, ...r }) => (0, X.jsx)("h2", {
	className: $("mt-6 mb-2 font-semibold text-2xl", t),
	"data-streamdown": "heading-2",
	...r,
	children: e
}), (e, t) => NT(e, t));
UT.displayName = "MarkdownH2";
var WT = (0, x.memo)(({ children: e, className: t, node: n, ...r }) => (0, X.jsx)("h3", {
	className: $("mt-6 mb-2 font-semibold text-xl", t),
	"data-streamdown": "heading-3",
	...r,
	children: e
}), (e, t) => NT(e, t));
WT.displayName = "MarkdownH3";
var GT = (0, x.memo)(({ children: e, className: t, node: n, ...r }) => (0, X.jsx)("h4", {
	className: $("mt-6 mb-2 font-semibold text-lg", t),
	"data-streamdown": "heading-4",
	...r,
	children: e
}), (e, t) => NT(e, t));
GT.displayName = "MarkdownH4";
var KT = (0, x.memo)(({ children: e, className: t, node: n, ...r }) => (0, X.jsx)("h5", {
	className: $("mt-6 mb-2 font-semibold text-base", t),
	"data-streamdown": "heading-5",
	...r,
	children: e
}), (e, t) => NT(e, t));
KT.displayName = "MarkdownH5";
var qT = (0, x.memo)(({ children: e, className: t, node: n, ...r }) => (0, X.jsx)("h6", {
	className: $("mt-6 mb-2 font-semibold text-sm", t),
	"data-streamdown": "heading-6",
	...r,
	children: e
}), (e, t) => NT(e, t));
qT.displayName = "MarkdownH6";
var JT = (0, x.memo)(({ children: e, className: t, node: n, ...r }) => {
	let { controls: i } = (0, x.useContext)(OE), a = PT(i, "table");
	return (0, X.jsx)(OT, {
		className: t,
		"data-streamdown": "table-wrapper",
		showControls: a,
		...r,
		children: e
	});
}, (e, t) => NT(e, t));
JT.displayName = "MarkdownTable";
var YT = (0, x.memo)(({ children: e, className: t, node: n, ...r }) => (0, X.jsx)("thead", {
	className: $("bg-muted/80", t),
	"data-streamdown": "table-header",
	...r,
	children: e
}), (e, t) => NT(e, t));
YT.displayName = "MarkdownThead";
var XT = (0, x.memo)(({ children: e, className: t, node: n, ...r }) => (0, X.jsx)("tbody", {
	className: $("divide-y divide-border bg-muted/40", t),
	"data-streamdown": "table-body",
	...r,
	children: e
}), (e, t) => NT(e, t));
XT.displayName = "MarkdownTbody";
var ZT = (0, x.memo)(({ children: e, className: t, node: n, ...r }) => (0, X.jsx)("tr", {
	className: $("border-border border-b", t),
	"data-streamdown": "table-row",
	...r,
	children: e
}), (e, t) => NT(e, t));
ZT.displayName = "MarkdownTr";
var QT = (0, x.memo)(({ children: e, className: t, node: n, ...r }) => (0, X.jsx)("th", {
	className: $("whitespace-nowrap px-4 py-2 text-left font-semibold text-sm", t),
	"data-streamdown": "table-header-cell",
	...r,
	children: e
}), (e, t) => NT(e, t));
QT.displayName = "MarkdownTh";
var $T = (0, x.memo)(({ children: e, className: t, node: n, ...r }) => (0, X.jsx)("td", {
	className: $("px-4 py-2 text-sm", t),
	"data-streamdown": "table-cell",
	...r,
	children: e
}), (e, t) => NT(e, t));
$T.displayName = "MarkdownTd";
var eE = (0, x.memo)(({ children: e, className: t, node: n, ...r }) => (0, X.jsx)("blockquote", {
	className: $("my-4 border-muted-foreground/30 border-l-4 pl-4 text-muted-foreground italic", t),
	"data-streamdown": "blockquote",
	...r,
	children: e
}), (e, t) => NT(e, t));
eE.displayName = "MarkdownBlockquote";
var tE = (0, x.memo)(({ children: e, className: t, node: n, ...r }) => (0, X.jsx)("sup", {
	className: $("text-sm", t),
	"data-streamdown": "superscript",
	...r,
	children: e
}), (e, t) => NT(e, t));
tE.displayName = "MarkdownSup";
var nE = (0, x.memo)(({ children: e, className: t, node: n, ...r }) => (0, X.jsx)("sub", {
	className: $("text-sm", t),
	"data-streamdown": "subscript",
	...r,
	children: e
}), (e, t) => NT(e, t));
nE.displayName = "MarkdownSub";
var rE = (0, x.memo)(({ children: e, className: t, node: n, ...r }) => {
	if ("data-footnotes" in r) {
		let n = (e) => {
			if (!(0, x.isValidElement)(e)) return !1;
			let t = Array.isArray(e.props.children) ? e.props.children : [e.props.children], n = !1, r = !1;
			for (let e of t) if (e) {
				if (typeof e == "string") e.trim() !== "" && (n = !0);
				else if ((0, x.isValidElement)(e)) {
					if (e.props?.["data-footnote-backref"] !== void 0) r = !0;
					else {
						let t = Array.isArray(e.props.children) ? e.props.children : [e.props.children];
						for (let e of t) if (typeof e == "string" && e.trim() !== "" || (0, x.isValidElement)(e) && e.props?.["data-footnote-backref"] === void 0) {
							n = !0;
							break;
						}
					}
				}
			}
			return r && !n;
		}, i = Array.isArray(e) ? e.map((e) => {
			if (!(0, x.isValidElement)(e)) return e;
			if (e.type === IT) {
				let t = (Array.isArray(e.props.children) ? e.props.children : [e.props.children]).filter((e) => !n(e));
				return t.length === 0 ? null : {
					...e,
					props: {
						...e.props,
						children: t
					}
				};
			}
			return e;
		}) : e;
		return (Array.isArray(i) ? i.some((e) => e !== null) : i !== null) ? (0, X.jsx)("section", {
			className: t,
			...r,
			children: i
		}) : null;
	}
	return (0, X.jsx)("section", {
		className: t,
		...r,
		children: e
	});
}, (e, t) => NT(e, t));
rE.displayName = "MarkdownSection";
var iE = (0, x.memo)(({ node: e, className: t, children: n, ...r }) => {
	let i = (e?.position)?.start.line === (e?.position)?.end.line, { mermaid: a, controls: o } = (0, x.useContext)(OE);
	if (i) return (0, X.jsx)("code", {
		className: $("rounded bg-muted px-1.5 py-0.5 font-mono text-sm", t),
		"data-streamdown": "inline-code",
		...r,
		children: n
	});
	let s = (t?.match(jT))?.at(1) ?? "", c = "";
	if ((0, x.isValidElement)(n) && n.props && typeof n.props == "object" && "children" in n.props && typeof n.props.children == "string" ? c = n.props.children : typeof n == "string" && (c = n), s === "mermaid") {
		let e = PT(o, "mermaid"), n = FT(o, "download"), r = FT(o, "copy"), i = FT(o, "fullscreen"), s = FT(o, "panZoom");
		return (0, X.jsx)(x.Suspense, {
			fallback: (0, X.jsx)(dT, {}),
			children: (0, X.jsxs)("div", {
				className: $("group relative my-4 h-auto rounded-xl border p-4", t),
				"data-streamdown": "mermaid-block",
				children: [e && (n || r || i) && (0, X.jsxs)("div", {
					className: "flex items-center justify-end gap-2",
					children: [
						n && (0, X.jsx)(gT, {
							chart: c,
							config: a?.config
						}),
						r && (0, X.jsx)(cT, { code: c }),
						i && (0, X.jsx)(bT, {
							chart: c,
							config: a?.config
						})
					]
				}), (0, X.jsx)(AT, {
					chart: c,
					config: a?.config,
					showControls: s
				})]
			})
		});
	}
	let l = PT(o, "code");
	return (0, X.jsx)(x.Suspense, {
		fallback: (0, X.jsx)(dT, {}),
		children: (0, X.jsx)(kT, {
			className: $("overflow-x-auto border-border border-t", t),
			code: c,
			language: s,
			children: l && (0, X.jsxs)(X.Fragment, { children: [(0, X.jsx)(uT, {
				code: c,
				language: s
			}), (0, X.jsx)(cT, {})] })
		})
	});
}, (e, t) => e.className === t.className && MT(e.node, t.node));
iE.displayName = "MarkdownCode";
var aE = (0, x.memo)(pT, (e, t) => e.className === t.className && MT(e.node, t.node));
aE.displayName = "MarkdownImg";
var oE = (0, x.memo)(({ children: e, className: t, node: n, ...r }) => {
	let i = (Array.isArray(e) ? e : [e]).filter((e) => e != null && e !== "");
	return i.length === 1 && (0, x.isValidElement)(i[0]) && i[0].props.node?.tagName === "img" ? (0, X.jsx)(X.Fragment, { children: e }) : (0, X.jsx)("p", {
		className: t,
		...r,
		children: e
	});
}, (e, t) => NT(e, t));
oE.displayName = "MarkdownParagraph";
var sE = {
	ol: IT,
	li: LT,
	ul: RT,
	hr: zT,
	strong: BT,
	a: VT,
	h1: HT,
	h2: UT,
	h3: WT,
	h4: GT,
	h5: KT,
	h6: qT,
	table: JT,
	thead: YT,
	tbody: XT,
	tr: ZT,
	th: QT,
	td: $T,
	blockquote: eE,
	code: iE,
	img: aE,
	pre: ({ children: e }) => e,
	sup: tE,
	sub: nE,
	p: oE,
	section: rE
}, cE = [], lE = { allowDangerousHtml: !0 }, uE = /* @__PURE__ */ new WeakMap(), dE = new class {
	constructor() {
		this.cache = /* @__PURE__ */ new Map(), this.keyCache = /* @__PURE__ */ new WeakMap(), this.maxSize = 100;
	}
	generateCacheKey(e) {
		let t = this.keyCache.get(e);
		if (t) return t;
		let n = e.rehypePlugins, r = e.remarkPlugins, i = e.remarkRehypeOptions;
		if (!(n || r || i)) {
			let t = "default";
			return this.keyCache.set(e, t), t;
		}
		let a = (e) => {
			if (!e || e.length === 0) return "";
			let t = "";
			for (let n = 0; n < e.length; n += 1) {
				let r = e[n];
				if (n > 0 && (t += ","), Array.isArray(r)) {
					let [e, n] = r;
					if (typeof e == "function") {
						let n = uE.get(e);
						n || (n = e.name, uE.set(e, n)), t += n;
					} else t += String(e);
					t += ":", t += JSON.stringify(n);
				} else if (typeof r == "function") {
					let e = uE.get(r);
					e || (e = r.name, uE.set(r, e)), t += e;
				} else t += String(r);
			}
			return t;
		}, o = a(n), s = `${a(r)}::${o}::${i ? JSON.stringify(i) : ""}`;
		return this.keyCache.set(e, s), s;
	}
	get(e) {
		let t = this.generateCacheKey(e), n = this.cache.get(t);
		return n && (this.cache.delete(t), this.cache.set(t, n)), n;
	}
	set(e, t) {
		let n = this.generateCacheKey(e);
		if (this.cache.size >= this.maxSize) {
			let e = this.cache.keys().next().value;
			e && this.cache.delete(e);
		}
		this.cache.set(n, t);
	}
	clear() {
		this.cache.clear();
	}
}(), fE = (e) => {
	let t = pE(e), n = e.children || "";
	return hE(t.runSync(t.parse(n), n), e);
}, pE = (e) => {
	let t = dE.get(e);
	if (t) return t;
	let n = mE(e);
	return dE.set(e, n), n;
}, mE = (e) => {
	let t = e.rehypePlugins || cE, n = e.remarkPlugins || cE, r = e.remarkRehypeOptions ? {
		...lE,
		...e.remarkRehypeOptions
	} : lE;
	return wC().use($x).use(n).use(ZS, r).use(t);
}, hE = (e, t) => Nv(e, {
	Fragment: X.Fragment,
	components: t.components,
	ignoreInvalidStyle: !0,
	jsx: X.jsx,
	jsxs: X.jsxs,
	passKeys: !0,
	passNode: !0
}), gE = /\[\^[^\]\s]{1,200}\](?!:)/, _E = /\[\^[^\]\s]{1,200}\]:/, vE = /<\/(\w+)>/, yE = /<(\w+)[\s>]/, bE = (e) => {
	let t = 0;
	for (; t < e.length && (e[t] === " " || e[t] === "	" || e[t] === "\n" || e[t] === "\r");) t += 1;
	return t + 1 < e.length && e[t] === "$" && e[t + 1] === "$";
}, xE = (e) => {
	let t = e.length - 1;
	for (; t >= 0 && (e[t] === " " || e[t] === "	" || e[t] === "\n" || e[t] === "\r");) --t;
	return t >= 1 && e[t] === "$" && e[t - 1] === "$";
}, SE = (e) => {
	let t = 0;
	for (let n = 0; n < e.length - 1; n += 1) e[n] === "$" && e[n + 1] === "$" && (t += 1, n += 1);
	return t;
}, CE = (e) => {
	let t = gE.test(e), n = _E.test(e);
	if (t || n) return [e];
	let r = $w.lex(e, { gfm: !0 }), i = [], a = [];
	for (let e of r) {
		let t = e.raw, n = i.length;
		if (a.length > 0) {
			if (i[n - 1] += t, e.type === "html") {
				let e = t.match(vE);
				if (e) {
					let t = e[1];
					a.at(-1) === t && a.pop();
				}
			}
		} else {
			if (e.type === "html" && e.block) {
				let e = t.match(yE);
				if (e) {
					let n = e[1];
					t.includes(`</${n}>`) || a.push(n);
				}
			}
			if (t.trim() === "$$" && n > 0) {
				let e = i[n - 1], r = bE(e), a = SE(e);
				if (r && a % 2 == 1) {
					i[n - 1] = e + t;
					continue;
				}
			}
			if (n > 0 && xE(t)) {
				let e = i[n - 1], r = bE(e), a = SE(e), o = SE(t);
				if (r && a % 2 == 1 && !bE(t) && o === 1) {
					i[n - 1] = e + t;
					continue;
				}
			}
			i.push(t);
		}
	}
	return i;
}, wE = {
	raw: mc,
	katex: [Rt, { errorColor: "var(--color-muted-foreground)" }],
	sanitize: [Lc, {}],
	harden: [C, {
		allowedImagePrefixes: ["*"],
		allowedLinkPrefixes: ["*"],
		allowedProtocols: ["*"],
		defaultOrigin: void 0,
		allowDataImages: !0
	}]
}, TE = {
	gfm: [hm, {}],
	math: [Am, { singleDollarTextMath: !1 }],
	cjkFriendly: [Ul, {}],
	cjkFriendlyGfmStrikethrough: [Gl, {}]
}, EE = Object.values(wE), DE = Object.values(TE), OE = (0, x.createContext)({
	shikiTheme: ["github-light", "github-dark"],
	controls: !0,
	isAnimating: !1,
	mode: "streaming",
	mermaid: void 0
}), kE = (0, x.memo)(({ content: e, shouldParseIncompleteMarkdown: t, ...n }) => {
	let r = (0, x.useMemo)(() => typeof e == "string" && t ? bh(e.trim()) : e, [e, t]);
	return (0, X.jsx)(fE, {
		...n,
		children: r
	});
}, (e, t) => {
	if (e.content !== t.content || e.shouldParseIncompleteMarkdown !== t.shouldParseIncompleteMarkdown || e.index !== t.index) return !1;
	if (e.components !== t.components) {
		let n = Object.keys(e.components || {}), r = Object.keys(t.components || {});
		if (n.length !== r.length || n.some((n) => e.components?.[n] !== t.components?.[n])) return !1;
	}
	return e.rehypePlugins === t.rehypePlugins && e.remarkPlugins === t.remarkPlugins;
});
kE.displayName = "Block";
var AE = ["github-light", "github-dark"], jE = (0, x.memo)(({ children: e, mode: t = "streaming", parseIncompleteMarkdown: n = !0, components: r, rehypePlugins: i = EE, remarkPlugins: a = DE, className: o, shikiTheme: s = AE, mermaid: c, controls: l = !0, isAnimating: u = !1, BlockComponent: d = kE, parseMarkdownIntoBlocksFn: f = CE, ...p }) => {
	let m = (0, x.useId)(), [h, g] = (0, x.useTransition)(), [_, v] = (0, x.useState)([]), y = (0, x.useMemo)(() => f(typeof e == "string" ? e : ""), [e, f]);
	(0, x.useEffect)(() => {
		t === "streaming" ? g(() => {
			v(y);
		}) : v(y);
	}, [y, t]);
	let b = t === "streaming" ? _ : y, ee = (0, x.useMemo)(() => b.map((e, t) => `${m}-${t}`), [b.length, m]), te = (0, x.useMemo)(() => ({
		shikiTheme: s,
		controls: l,
		isAnimating: u,
		mode: t,
		mermaid: c
	}), [
		s,
		l,
		u,
		t,
		c
	]), S = (0, x.useMemo)(() => ({
		...sE,
		...r
	}), [r]);
	return (0, x.useEffect)(() => {
		if (!(Array.isArray(i) && i.some((e) => Array.isArray(e) ? e[0] === Rt : e === Rt))) return;
		let t = !1;
		if (Array.isArray(a)) {
			let e = a.find((e) => Array.isArray(e) ? e[0] === Am : e === Am);
			e && Array.isArray(e) && e[1] && (t = e[1].singleDollarTextMath === !0);
		}
		let n = typeof e == "string" ? e : "", r = n.includes("$$"), o = t && (/[^$]\$[^$]/.test(n) || /^\$[^$]/.test(n) || /[^$]\$$/.test(n));
		(r || o) && Promise.resolve({          });
	}, [
		i,
		a,
		e
	]), t === "static" ? (0, X.jsx)(OE.Provider, {
		value: te,
		children: (0, X.jsx)("div", {
			className: $("space-y-4 whitespace-normal", o),
			children: (0, X.jsx)(fE, {
				components: S,
				rehypePlugins: i,
				remarkPlugins: a,
				...p,
				children: e
			})
		})
	}) : (0, X.jsx)(OE.Provider, {
		value: te,
		children: (0, X.jsx)("div", {
			className: $("space-y-4 whitespace-normal", o),
			children: b.map((e, t) => (0, X.jsx)(d, {
				components: S,
				content: e,
				index: t,
				rehypePlugins: i,
				remarkPlugins: a,
				shouldParseIncompleteMarkdown: n,
				...p
			}, ee[t]))
		})
	});
}, (e, t) => e.children === t.children && e.shikiTheme === t.shikiTheme && e.isAnimating === t.isAnimating && e.mode === t.mode);
jE.displayName = "Streamdown";
var ME = ({ children: e, className: t, minZoom: n = .5, maxZoom: r = 3, zoomStep: i = .1, showControls: a = !0, initialZoom: o = 1, fullscreen: s = !1 }) => {
	let c = (0, x.useRef)(null), l = (0, x.useRef)(null), [u, d] = (0, x.useState)(o), [f, p] = (0, x.useState)({
		x: 0,
		y: 0
	}), [m, h] = (0, x.useState)(!1), [g, _] = (0, x.useState)({
		x: 0,
		y: 0
	}), [v, y] = (0, x.useState)({
		x: 0,
		y: 0
	}), b = (0, x.useCallback)((e) => {
		d((t) => Math.max(n, Math.min(r, t + e)));
	}, [n, r]), ee = (0, x.useCallback)(() => {
		b(i);
	}, [b, i]), te = (0, x.useCallback)(() => {
		b(-i);
	}, [b, i]), S = (0, x.useCallback)(() => {
		d(o), p({
			x: 0,
			y: 0
		});
	}, [o]), C = (0, x.useCallback)((e) => {
		e.preventDefault();
		let t = e.deltaY > 0 ? -i : i;
		b(t);
	}, [b, i]), ne = (0, x.useCallback)((e) => {
		if (e.button !== 0 || e.isPrimary === !1) return;
		h(!0), _({
			x: e.clientX,
			y: e.clientY
		}), y(f);
		let t = e.currentTarget;
		t instanceof HTMLElement && t.setPointerCapture(e.pointerId);
	}, [f]), re = (0, x.useCallback)((e) => {
		if (!m) return;
		e.preventDefault();
		let t = e.clientX - g.x, n = e.clientY - g.y;
		p({
			x: v.x + t,
			y: v.y + n
		});
	}, [
		m,
		g,
		v
	]), w = (0, x.useCallback)((e) => {
		h(!1);
		let t = e.currentTarget;
		t instanceof HTMLElement && t.releasePointerCapture(e.pointerId);
	}, []);
	return (0, x.useEffect)(() => {
		let e = c.current;
		if (e) return e.addEventListener("wheel", C, { passive: !1 }), () => {
			e.removeEventListener("wheel", C);
		};
	}, [C]), (0, x.useEffect)(() => {
		let e = l.current;
		if (e && m) return document.body.style.userSelect = "none", e.addEventListener("pointermove", re, { passive: !1 }), e.addEventListener("pointerup", w), e.addEventListener("pointercancel", w), () => {
			document.body.style.userSelect = "", e.removeEventListener("pointermove", re), e.removeEventListener("pointerup", w), e.removeEventListener("pointercancel", w);
		};
	}, [
		m,
		re,
		w
	]), (0, X.jsxs)("div", {
		className: $("relative", s ? "h-full w-full" : "w-full", t),
		ref: c,
		style: { cursor: m ? "grabbing" : "grab" },
		children: [a && (0, X.jsxs)("div", {
			className: $("absolute z-10 flex flex-col gap-1 rounded-md border border-border bg-background/90 p-1 shadow-sm backdrop-blur-sm", s ? "bottom-4 left-4" : "bottom-2 left-2"),
			children: [
				(0, X.jsx)("button", {
					className: "flex items-center justify-center rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
					disabled: u >= r,
					onClick: ee,
					title: "Zoom in",
					type: "button",
					children: (0, X.jsx)(Ih, { size: 16 })
				}),
				(0, X.jsx)("button", {
					className: "flex items-center justify-center rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
					disabled: u <= n,
					onClick: te,
					title: "Zoom out",
					type: "button",
					children: (0, X.jsx)(Lh, { size: 16 })
				}),
				(0, X.jsx)("button", {
					className: "flex items-center justify-center rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
					onClick: S,
					title: "Reset zoom and pan",
					type: "button",
					children: (0, X.jsx)(Ph, { size: 16 })
				})
			]
		}), (0, X.jsx)("div", {
			className: $("origin-center transition-transform duration-150 ease-out", s && "flex w-full items-center justify-center"),
			onPointerDown: ne,
			ref: l,
			role: "application",
			style: {
				transform: `translate(${f.x}px, ${f.y}px) scale(${u})`,
				transformOrigin: "center center",
				touchAction: "none",
				willChange: "transform"
			},
			children: e
		})]
	});
}, NE = ({ chart: e, className: t, config: n, fullscreen: r = !1, showControls: i = !0 }) => {
	let [a, o] = (0, x.useState)(null), [s, c] = (0, x.useState)(!0), [l, u] = (0, x.useState)(""), [d, f] = (0, x.useState)(""), [p, m] = (0, x.useState)(0), { mermaid: h } = (0, x.useContext)(OE), g = h?.errorComponent;
	if ((0, x.useEffect)(() => {
		(async () => {
			try {
				o(null), c(!0);
				let t = await mT(n), r = e.split("").reduce((e, t) => (e << 5) - e + t.charCodeAt(0) | 0, 0), i = `mermaid-${Math.abs(r)}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, { svg: a } = await t.render(i, e);
				u(a), f(a);
			} catch (e) {
				if (!(d || l)) {
					let t = e instanceof Error ? e.message : "Failed to render Mermaid chart";
					o(t);
				}
			} finally {
				c(!1);
			}
		})();
	}, [
		e,
		n,
		p
	]), s && !l && !d) return (0, X.jsx)("div", {
		className: $("my-4 flex justify-center p-4", t),
		children: (0, X.jsxs)("div", {
			className: "flex items-center space-x-2 text-muted-foreground",
			children: [(0, X.jsx)("div", { className: "h-4 w-4 animate-spin rounded-full border-current border-b-2" }), (0, X.jsx)("span", {
				className: "text-sm",
				children: "Loading diagram..."
			})]
		})
	});
	if (a && !l && !d) return g ? (0, X.jsx)(g, {
		chart: e,
		error: a,
		retry: () => m((e) => e + 1)
	}) : (0, X.jsxs)("div", {
		className: $("rounded-lg border border-red-200 bg-red-50 p-4", t),
		children: [(0, X.jsxs)("p", {
			className: "font-mono text-red-700 text-sm",
			children: ["Mermaid Error: ", a]
		}), (0, X.jsxs)("details", {
			className: "mt-2",
			children: [(0, X.jsx)("summary", {
				className: "cursor-pointer text-red-600 text-xs",
				children: "Show Code"
			}), (0, X.jsx)("pre", {
				className: "mt-2 overflow-x-auto rounded bg-red-100 p-2 text-red-800 text-xs",
				children: e
			})]
		})]
	});
	let _ = l || d;
	return (0, X.jsx)(ME, {
		className: $(r ? "h-full w-full overflow-hidden" : "my-4 overflow-hidden", t),
		fullscreen: r,
		maxZoom: 3,
		minZoom: .5,
		showControls: i,
		zoomStep: .1,
		children: (0, X.jsx)("div", {
			"aria-label": "Mermaid chart",
			className: $("flex justify-center", r && "h-full w-full items-center"),
			dangerouslySetInnerHTML: { __html: _ },
			role: "img"
		})
	});
};
export { $ as a, zh as c, Sr as d, Ke as f, a as h, jE as i, Kl as l, s as m, oT as n, g_ as o, He as p, NE as r, __ as s, OE as t, Ir as u };
