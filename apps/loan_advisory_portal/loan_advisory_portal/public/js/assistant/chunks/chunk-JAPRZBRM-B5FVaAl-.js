import { i as e, n as t, t as n } from "./rolldown-runtime-CwxnZyOB.js";
import { t as r } from "./katex-D5COEGUz.js";
import { n as i } from "./marked.esm-CtHC1YRh.js";
// node_modules/.pnpm/react@19.2.0/node_modules/react/cjs/react.production.js
var a = /* @__PURE__ */ n(((e) => {
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
	var x = b.prototype = new y();
	x.constructor = b, g(x, v.prototype), x.isPureReactComponent = !0;
	var ee = Array.isArray;
	function S() {}
	var C = {
		H: null,
		A: null,
		T: null,
		S: null
	}, w = Object.prototype.hasOwnProperty;
	function T(e, n, r) {
		var i = r.ref;
		return {
			$$typeof: t,
			type: e,
			key: n,
			ref: i === void 0 ? null : i,
			props: r
		};
	}
	function E(e, t) {
		return T(e.type, t, e.props);
	}
	function D(e) {
		return typeof e == "object" && !!e && e.$$typeof === t;
	}
	function te(e) {
		var t = {
			"=": "=0",
			":": "=2"
		};
		return "$" + e.replace(/[=:]/g, function(e) {
			return t[e];
		});
	}
	var ne = /\/+/g;
	function re(e, t) {
		return typeof e == "object" && e && e.key != null ? te("" + e.key) : t.toString(36);
	}
	function O(e) {
		switch (e.status) {
			case "fulfilled": return e.value;
			case "rejected": throw e.reason;
			default: switch (typeof e.status == "string" ? e.then(S, S) : (e.status = "pending", e.then(function(t) {
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
	function k(e, r, i, a, o) {
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
				case d: return c = e._init, k(c(e._payload), r, i, a, o);
			}
		}
		if (c) return o = o(e), c = a === "" ? "." + re(e, 0) : a, ee(o) ? (i = "", c != null && (i = c.replace(ne, "$&/") + "/"), k(o, r, i, "", function(e) {
			return e;
		})) : o != null && (D(o) && (o = E(o, i + (o.key == null || e && e.key === o.key ? "" : ("" + o.key).replace(ne, "$&/") + "/") + c)), r.push(o)), 1;
		c = 0;
		var l = a === "" ? "." : a + ":";
		if (ee(e)) for (var u = 0; u < e.length; u++) a = e[u], s = l + re(a, u), c += k(a, r, i, s, o);
		else if (u = m(e), typeof u == "function") for (e = u.call(e), u = 0; !(a = e.next()).done;) a = a.value, s = l + re(a, u++), c += k(a, r, i, s, o);
		else if (s === "object") {
			if (typeof e.then == "function") return k(O(e), r, i, a, o);
			throw r = String(e), Error("Objects are not valid as a React child (found: " + (r === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : r) + "). If you meant to render a collection of children, use an array instead.");
		}
		return c;
	}
	function ie(e, t, n) {
		if (e == null) return e;
		var r = [], i = 0;
		return k(e, r, "", "", function(e) {
			return t.call(n, e, i++);
		}), r;
	}
	function ae(e) {
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
	var A = typeof reportError == "function" ? reportError : function(e) {
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
	}, oe = {
		map: ie,
		forEach: function(e, t, n) {
			ie(e, function() {
				t.apply(this, arguments);
			}, n);
		},
		count: function(e) {
			var t = 0;
			return ie(e, function() {
				t++;
			}), t;
		},
		toArray: function(e) {
			return ie(e, function(e) {
				return e;
			}) || [];
		},
		only: function(e) {
			if (!D(e)) throw Error("React.Children.only expected to receive a single React element child.");
			return e;
		}
	};
	e.Activity = f, e.Children = oe, e.Component = v, e.Fragment = r, e.Profiler = a, e.PureComponent = b, e.StrictMode = i, e.Suspense = l, e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = C, e.__COMPILER_RUNTIME = {
		__proto__: null,
		c: function(e) {
			return C.H.useMemoCache(e);
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
		if (t != null) for (a in t.key !== void 0 && (i = "" + t.key), t) !w.call(t, a) || a === "key" || a === "__self" || a === "__source" || a === "ref" && t.ref === void 0 || (r[a] = t[a]);
		var a = arguments.length - 2;
		if (a === 1) r.children = n;
		else if (1 < a) {
			for (var o = Array(a), s = 0; s < a; s++) o[s] = arguments[s + 2];
			r.children = o;
		}
		return T(e.type, i, r);
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
		if (t != null) for (r in t.key !== void 0 && (a = "" + t.key), t) w.call(t, r) && r !== "key" && r !== "__self" && r !== "__source" && (i[r] = t[r]);
		var o = arguments.length - 2;
		if (o === 1) i.children = n;
		else if (1 < o) {
			for (var s = Array(o), c = 0; c < o; c++) s[c] = arguments[c + 2];
			i.children = s;
		}
		if (e && e.defaultProps) for (r in o = e.defaultProps, o) i[r] === void 0 && (i[r] = o[r]);
		return T(e, a, i);
	}, e.createRef = function() {
		return { current: null };
	}, e.forwardRef = function(e) {
		return {
			$$typeof: c,
			render: e
		};
	}, e.isValidElement = D, e.lazy = function(e) {
		return {
			$$typeof: d,
			_payload: {
				_status: -1,
				_result: e
			},
			_init: ae
		};
	}, e.memo = function(e, t) {
		return {
			$$typeof: u,
			type: e,
			compare: t === void 0 ? null : t
		};
	}, e.startTransition = function(e) {
		var t = C.T, n = {};
		C.T = n;
		try {
			var r = e(), i = C.S;
			i !== null && i(n, r), typeof r == "object" && r && typeof r.then == "function" && r.then(S, A);
		} catch (e) {
			A(e);
		} finally {
			t !== null && n.types !== null && (t.types = n.types), C.T = t;
		}
	}, e.unstable_useCacheRefresh = function() {
		return C.H.useCacheRefresh();
	}, e.use = function(e) {
		return C.H.use(e);
	}, e.useActionState = function(e, t, n) {
		return C.H.useActionState(e, t, n);
	}, e.useCallback = function(e, t) {
		return C.H.useCallback(e, t);
	}, e.useContext = function(e) {
		return C.H.useContext(e);
	}, e.useDebugValue = function() {}, e.useDeferredValue = function(e, t) {
		return C.H.useDeferredValue(e, t);
	}, e.useEffect = function(e, t) {
		return C.H.useEffect(e, t);
	}, e.useEffectEvent = function(e) {
		return C.H.useEffectEvent(e);
	}, e.useId = function() {
		return C.H.useId();
	}, e.useImperativeHandle = function(e, t, n) {
		return C.H.useImperativeHandle(e, t, n);
	}, e.useInsertionEffect = function(e, t) {
		return C.H.useInsertionEffect(e, t);
	}, e.useLayoutEffect = function(e, t) {
		return C.H.useLayoutEffect(e, t);
	}, e.useMemo = function(e, t) {
		return C.H.useMemo(e, t);
	}, e.useOptimistic = function(e, t) {
		return C.H.useOptimistic(e, t);
	}, e.useReducer = function(e, t, n) {
		return C.H.useReducer(e, t, n);
	}, e.useRef = function(e) {
		return C.H.useRef(e);
	}, e.useState = function(e) {
		return C.H.useState(e);
	}, e.useSyncExternalStore = function(e, t, n) {
		return C.H.useSyncExternalStore(e, t, n);
	}, e.useTransition = function() {
		return C.H.useTransition();
	}, e.version = "19.2.0";
})), o = /* @__PURE__ */ n(((e, t) => {
	t.exports = a();
})), s = /* @__PURE__ */ n(((e) => {
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
})), c = /* @__PURE__ */ n(((e, t) => {
	t.exports = s();
})), l = (function(e) {
	if (e == null) return m;
	if (typeof e == "function") return p(e);
	if (typeof e == "object") return Array.isArray(e) ? u(e) : d(e);
	if (typeof e == "string") return f(e);
	throw Error("Expected function, string, or object as test");
});
function u(e) {
	let t = [], n = -1;
	for (; ++n < e.length;) t[n] = l(e[n]);
	return p(r);
	function r(...e) {
		let n = -1;
		for (; ++n < t.length;) if (t[n].apply(this, e)) return !0;
		return !1;
	}
}
function d(e) {
	let t = e;
	return p(n);
	function n(n) {
		let r = n, i;
		for (i in e) if (r[i] !== t[i]) return !1;
		return !0;
	}
}
function f(e) {
	return p(t);
	function t(t) {
		return t && t.type === e;
	}
}
function p(e) {
	return t;
	function t(t, n, r) {
		return !!(h(t) && e.call(this, t, typeof n == "number" ? n : void 0, r || void 0));
	}
}
function m() {
	return !0;
}
function h(e) {
	return typeof e == "object" && !!e && "type" in e;
}
// node_modules/.pnpm/unist-util-visit-parents@6.1.0/node_modules/unist-util-visit-parents/lib/color.js
function g(e) {
	return e;
}
// node_modules/.pnpm/unist-util-visit-parents@6.1.0/node_modules/unist-util-visit-parents/lib/index.js
var _ = [], v = "skip";
function y(e, t, n, r) {
	if (!e || typeof e != "object") throw Error("Unexpected value `" + e + "` for `tree`, expected node");
	let i = !0, a, o, s, c;
	if (typeof n == "function" || n && typeof n == "object" ? (a = t, o = n, r && (i = !1)) : (o = t, n && (i = !1)), typeof o == "function") s = o;
	else if (o && typeof o == "object") {
		if (o.enter !== null && o.enter !== void 0) {
			if (typeof o.enter == "function") s = o.enter;
			else throw Error("Unexpected value `" + o.enter + "` for `visitors.enter`, expected optional visitor");
		}
		if (typeof o.exit == "function") c = o.exit;
		else throw Error("Unexpected value `" + o.exit + "` for `visitors.exit`, expected visitor (pass a visitor directly if you only want an enter visitor)");
	} else throw Error("Unexpected value `" + o + "` for `enter` or `visitors`, expected visitor or object with visitors");
	let u = l(a), d = i ? 1 : -1;
	f(e, void 0, [])();
	function f(e, t, n) {
		let r = e && typeof e == "object" ? e : {};
		if (typeof r.type == "string") {
			let t = typeof r.tagName == "string" ? r.tagName : typeof r.name == "string" ? r.name : void 0;
			Object.defineProperty(o, "name", { value: "node (" + g(e.type + (t ? "<" + t + ">" : "")) + ")" });
		}
		return o;
		function o() {
			let r = !a || u(e, t, n[n.length - 1] || void 0), o = _;
			if (s && r && (o = b(s(e, n, t)), o[0] === !1)) return o;
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
			if (c && r) {
				let r = b(c(e, n, t));
				if (r[0] === "skip") throw Error("Unexpected value `" + r[0] + "` from `exit`, expected `CONTINUE`, `EXIT`, index, or nothing");
				if (r[0] === !1 || typeof r[1] == "number") return r;
			}
			return o;
		}
	}
}
function b(e) {
	return Array.isArray(e) ? e : typeof e == "number" ? [!0, e] : e == null ? _ : [e];
}
// node_modules/.pnpm/unist-util-visit@5.2.0/node_modules/unist-util-visit/lib/index.js
function x(e, t, n, r) {
	let i, a, o;
	typeof n == "function" || n && typeof n == "object" ? (i = t, a = n, o = r) : (a = t, o = n), typeof a == "function" ? y(e, i, S(a), o) : y(e, i, ee(a), o);
}
function ee(e) {
	return !e || typeof e != "object" ? e : {
		enter: typeof e.enter == "function" ? S(e.enter) : e.enter,
		exit: typeof e.exit == "function" ? S(e.exit) : e.exit
	};
}
function S(e) {
	return t;
	function t(t, n, r) {
		return e(t, r, n[n.length - 1]);
	}
}
// node_modules/.pnpm/rehype-harden@1.1.9/node_modules/rehype-harden/dist/index.js
var C = /* @__PURE__ */ e(o()), w = {
	indicator: "indicator",
	textOnly: "text-only",
	remove: "remove"
};
function T({ defaultOrigin: e = "", allowedLinkPrefixes: t = [], allowedImagePrefixes: n = [], allowDataImages: r = !1, allowedProtocols: i = [], blockedImageClass: a = "inline-block bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-3 py-1 rounded text-sm", blockedLinkClass: o = "text-gray-500", linkBlockPolicy: s = w.indicator, imageBlockPolicy: c = w.indicator }) {
	let l = t.length && !t.every((e) => e === "*"), u = n.length && !n.every((e) => e === "*");
	if (!e && (l || u)) throw Error("defaultOrigin is required when allowedLinkPrefixes or allowedImagePrefixes are provided");
	return (l) => {
		let u = oe(e, t, n, r, i, a, o, s, c);
		k(l), x(l, u);
	};
}
function E(e, t) {
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
function D(e) {
	return typeof e == "string" ? e.startsWith("/") || e.startsWith("./") || e.startsWith("../") : !1;
}
function te(e) {
	let t = e.pathname + e.search + e.hash;
	return e.pathname.startsWith("//") ? "/." + t : t;
}
var ne = /* @__PURE__ */ new Set([
	"https:",
	"http:",
	"irc:",
	"ircs:",
	"mailto:",
	"xmpp:",
	"blob:"
]), re = /* @__PURE__ */ new Set([
	"javascript:",
	"data:",
	"file:",
	"vbscript:"
]);
function O(e, t, n, r = !1, i = !1, a = []) {
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
	let o = E(e, n);
	if (!o || re.has(o.protocol) || !(ne.has(o.protocol) || a.includes(o.protocol) || a.includes("*"))) return null;
	if (o.protocol === "mailto:" || !o.protocol.match(/^https?:$/)) return o.href;
	let s = D(e);
	return o && t.some((e) => {
		let t = E(e, n);
		return !t || t.origin !== o.origin ? !1 : o.href.startsWith(t.href);
	}) ? s ? te(o) : o.href : t.includes("*") ? o.protocol !== "https:" && o.protocol !== "http:" ? null : s ? te(o) : o.href : null;
}
function k(e) {
	if ("children" in e && Array.isArray(e.children)) {
		e.children = e.children.filter((e) => e != null);
		for (let t of e.children) k(t);
	}
}
var ie = Symbol("node-seen");
function ae(e, t, n) {
	return t === w.remove ? { type: "remove" } : t === w.textOnly ? {
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
function A(e, t, n) {
	if (t === w.remove) return { type: "remove" };
	if (t === w.textOnly) {
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
var oe = (e, t, n, r, i, a, o, s, c) => {
	let l = (u, d, f) => {
		if (u.type !== "element" || u[ie]) return !0;
		if (u.tagName === "a") {
			let n = O(u.properties.href, t, e, !1, !1, i);
			if (n === null) {
				if (u[ie] = !0, x(u, l), f && typeof d == "number") {
					let e = ae(u, s, o);
					if (e.type === "remove") return f.children.splice(d, 1), [v, d];
					f.children[d] = e.element;
				}
				return v;
			}
			return u.properties.href = n, u.properties.target = "_blank", u.properties.rel = "noopener noreferrer", !0;
		}
		if (u.tagName === "img") {
			let t = O(u.properties.src, n, e, r, !0, i);
			if (t === null) {
				if (u[ie] = !0, x(u, l), f && typeof d == "number") {
					let e = A(u, c, a);
					if (e.type === "remove") return f.children.splice(d, 1), [v, d];
					f.children[d] = e.element;
				}
				return v;
			}
			return u.properties.src = t, !0;
		}
		return !0;
	};
	return l;
}, se = class {
	constructor(e, t, n) {
		this.normal = t, this.property = e, n && (this.space = n);
	}
};
se.prototype.normal = {}, se.prototype.property = {}, se.prototype.space = void 0;
// node_modules/.pnpm/property-information@7.2.0/node_modules/property-information/lib/util/merge.js
function ce(e, t) {
	let n = {}, r = {};
	for (let t of e) Object.assign(n, t.property), Object.assign(r, t.normal);
	return new se(n, r, t);
}
// node_modules/.pnpm/property-information@7.2.0/node_modules/property-information/lib/normalize.js
function le(e) {
	return e.toLowerCase();
}
// node_modules/.pnpm/property-information@7.2.0/node_modules/property-information/lib/util/info.js
var j = class {
	constructor(e, t) {
		this.attribute = t, this.property = e;
	}
};
j.prototype.attribute = "", j.prototype.booleanish = !1, j.prototype.boolean = !1, j.prototype.commaOrSpaceSeparated = !1, j.prototype.commaSeparated = !1, j.prototype.defined = !1, j.prototype.mustUseProperty = !1, j.prototype.number = !1, j.prototype.overloadedBoolean = !1, j.prototype.property = "", j.prototype.spaceSeparated = !1, j.prototype.space = void 0;
// node_modules/.pnpm/property-information@7.2.0/node_modules/property-information/lib/util/types.js
var ue = /* @__PURE__ */ t({
	boolean: () => M,
	booleanish: () => N,
	commaOrSpaceSeparated: () => me,
	commaSeparated: () => pe,
	number: () => P,
	overloadedBoolean: () => fe,
	spaceSeparated: () => F
}), de = 0, M = he(), N = he(), fe = he(), P = he(), F = he(), pe = he(), me = he();
function he() {
	return 2 ** ++de;
}
// node_modules/.pnpm/property-information@7.2.0/node_modules/property-information/lib/util/defined-info.js
var ge = Object.keys(ue), _e = class extends j {
	constructor(e, t, n, r) {
		let i = -1;
		if (super(e, t), ve(this, "space", r), typeof n == "number") for (; ++i < ge.length;) {
			let e = ge[i];
			ve(this, ge[i], (n & ue[e]) === ue[e]);
		}
	}
};
_e.prototype.defined = !0;
function ve(e, t, n) {
	n && (e[t] = n);
}
// node_modules/.pnpm/property-information@7.2.0/node_modules/property-information/lib/util/create.js
function ye(e) {
	let t = {}, n = {};
	for (let [r, i] of Object.entries(e.properties)) {
		let a = new _e(r, e.transform(e.attributes || {}, r), i, e.space);
		e.mustUseProperty && e.mustUseProperty.includes(r) && (a.mustUseProperty = !0), t[r] = a, n[le(r)] = r, n[le(a.attribute)] = r;
	}
	return new se(t, n, e.space);
}
// node_modules/.pnpm/property-information@7.2.0/node_modules/property-information/lib/aria.js
var be = ye({
	properties: {
		ariaActiveDescendant: null,
		ariaAtomic: N,
		ariaAutoComplete: null,
		ariaBusy: N,
		ariaChecked: N,
		ariaColCount: P,
		ariaColIndex: P,
		ariaColSpan: P,
		ariaControls: F,
		ariaCurrent: null,
		ariaDescribedBy: F,
		ariaDetails: null,
		ariaDisabled: N,
		ariaDropEffect: F,
		ariaErrorMessage: null,
		ariaExpanded: N,
		ariaFlowTo: F,
		ariaGrabbed: N,
		ariaHasPopup: null,
		ariaHidden: N,
		ariaInvalid: null,
		ariaKeyShortcuts: null,
		ariaLabel: null,
		ariaLabelledBy: F,
		ariaLevel: P,
		ariaLive: null,
		ariaModal: N,
		ariaMultiLine: N,
		ariaMultiSelectable: N,
		ariaOrientation: null,
		ariaOwns: F,
		ariaPlaceholder: null,
		ariaPosInSet: P,
		ariaPressed: N,
		ariaReadOnly: N,
		ariaRelevant: null,
		ariaRequired: N,
		ariaRoleDescription: F,
		ariaRowCount: P,
		ariaRowIndex: P,
		ariaRowSpan: P,
		ariaSelected: N,
		ariaSetSize: P,
		ariaSort: null,
		ariaValueMax: P,
		ariaValueMin: P,
		ariaValueNow: P,
		ariaValueText: null,
		role: null
	},
	transform(e, t) {
		return t === "role" ? t : "aria-" + t.slice(4).toLowerCase();
	}
});
// node_modules/.pnpm/property-information@7.2.0/node_modules/property-information/lib/util/case-sensitive-transform.js
function xe(e, t) {
	return t in e ? e[t] : t;
}
// node_modules/.pnpm/property-information@7.2.0/node_modules/property-information/lib/util/case-insensitive-transform.js
function Se(e, t) {
	return xe(e, t.toLowerCase());
}
// node_modules/.pnpm/property-information@7.2.0/node_modules/property-information/lib/html.js
var Ce = ye({
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
		accept: pe,
		acceptCharset: F,
		accessKey: F,
		action: null,
		allow: null,
		allowFullScreen: M,
		allowPaymentRequest: M,
		allowUserMedia: M,
		alpha: M,
		alt: null,
		as: null,
		async: M,
		autoCapitalize: null,
		autoComplete: F,
		autoFocus: M,
		autoPlay: M,
		blocking: F,
		capture: null,
		charSet: null,
		checked: M,
		cite: null,
		className: F,
		closedBy: null,
		colorSpace: null,
		cols: P,
		colSpan: P,
		command: null,
		commandFor: null,
		content: null,
		contentEditable: N,
		controls: M,
		controlsList: F,
		coords: P | pe,
		crossOrigin: null,
		data: null,
		dateTime: null,
		decoding: null,
		default: M,
		defer: M,
		dir: null,
		dirName: null,
		disabled: M,
		download: fe,
		draggable: N,
		encType: null,
		enterKeyHint: null,
		fetchPriority: null,
		form: null,
		formAction: null,
		formEncType: null,
		formMethod: null,
		formNoValidate: M,
		formTarget: null,
		headers: F,
		height: P,
		hidden: fe,
		high: P,
		href: null,
		hrefLang: null,
		htmlFor: F,
		httpEquiv: F,
		id: null,
		imageSizes: null,
		imageSrcSet: null,
		inert: M,
		inputMode: null,
		integrity: null,
		is: null,
		isMap: M,
		itemId: null,
		itemProp: F,
		itemRef: F,
		itemScope: M,
		itemType: F,
		kind: null,
		label: null,
		lang: null,
		language: null,
		list: null,
		loading: null,
		loop: M,
		low: P,
		manifest: null,
		max: null,
		maxLength: P,
		media: null,
		method: null,
		min: null,
		minLength: P,
		multiple: M,
		muted: M,
		name: null,
		nonce: null,
		noModule: M,
		noValidate: M,
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
		open: M,
		optimum: P,
		pattern: null,
		ping: F,
		placeholder: null,
		playsInline: M,
		popover: null,
		popoverTarget: null,
		popoverTargetAction: null,
		poster: null,
		preload: null,
		readOnly: M,
		referrerPolicy: null,
		rel: F,
		required: M,
		reversed: M,
		rows: P,
		rowSpan: P,
		sandbox: F,
		scope: null,
		scoped: M,
		seamless: M,
		selected: M,
		shadowRootClonable: M,
		shadowRootCustomElementRegistry: M,
		shadowRootDelegatesFocus: M,
		shadowRootMode: null,
		shadowRootSerializable: M,
		shape: null,
		size: P,
		sizes: null,
		slot: null,
		span: P,
		spellCheck: N,
		src: null,
		srcDoc: null,
		srcLang: null,
		srcSet: null,
		start: P,
		step: null,
		style: null,
		tabIndex: P,
		target: null,
		title: null,
		translate: null,
		type: null,
		typeMustMatch: M,
		useMap: null,
		value: N,
		width: P,
		wrap: null,
		writingSuggestions: null,
		align: null,
		aLink: null,
		archive: F,
		axis: null,
		background: null,
		bgColor: null,
		border: P,
		borderColor: null,
		bottomMargin: P,
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
		compact: M,
		declare: M,
		event: null,
		face: null,
		frame: null,
		frameBorder: null,
		hSpace: P,
		leftMargin: P,
		link: null,
		longDesc: null,
		lowSrc: null,
		marginHeight: P,
		marginWidth: P,
		noResize: M,
		noHref: M,
		noShade: M,
		noWrap: M,
		object: null,
		profile: null,
		prompt: null,
		rev: null,
		rightMargin: P,
		rules: null,
		scheme: null,
		scrolling: N,
		standby: null,
		summary: null,
		text: null,
		topMargin: P,
		valueType: null,
		version: null,
		vAlign: null,
		vLink: null,
		vSpace: P,
		allowTransparency: null,
		autoCorrect: null,
		autoSave: null,
		credentialless: M,
		disablePictureInPicture: M,
		disableRemotePlayback: M,
		exportParts: pe,
		part: F,
		prefix: null,
		property: null,
		results: P,
		security: null,
		unselectable: null
	},
	space: "html",
	transform: Se
}), we = ye({
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
		about: me,
		accentHeight: P,
		accumulate: null,
		additive: null,
		alignmentBaseline: null,
		alphabetic: P,
		amplitude: P,
		arabicForm: null,
		ascent: P,
		attributeName: null,
		attributeType: null,
		azimuth: P,
		bandwidth: null,
		baselineShift: null,
		baseFrequency: null,
		baseProfile: null,
		bbox: null,
		begin: null,
		bias: P,
		by: null,
		calcMode: null,
		capHeight: P,
		className: F,
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
		descent: P,
		diffuseConstant: P,
		direction: null,
		display: null,
		dur: null,
		divisor: P,
		dominantBaseline: null,
		download: M,
		dx: null,
		dy: null,
		edgeMode: null,
		editable: null,
		elevation: P,
		enableBackground: null,
		end: null,
		event: null,
		exponent: P,
		externalResourcesRequired: null,
		fill: null,
		fillOpacity: P,
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
		g1: pe,
		g2: pe,
		glyphName: pe,
		glyphOrientationHorizontal: null,
		glyphOrientationVertical: null,
		glyphRef: null,
		gradientTransform: null,
		gradientUnits: null,
		handler: null,
		hanging: P,
		hatchContentUnits: null,
		hatchUnits: null,
		height: null,
		href: null,
		hrefLang: null,
		horizAdvX: P,
		horizOriginX: P,
		horizOriginY: P,
		id: null,
		ideographic: P,
		imageRendering: null,
		initialVisibility: null,
		in: null,
		in2: null,
		intercept: P,
		k: P,
		k1: P,
		k2: P,
		k3: P,
		k4: P,
		kernelMatrix: me,
		kernelUnitLength: null,
		keyPoints: null,
		keySplines: null,
		keyTimes: null,
		kerning: null,
		lang: null,
		lengthAdjust: null,
		letterSpacing: null,
		lightingColor: null,
		limitingConeAngle: P,
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
		mediaSize: P,
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
		overlinePosition: P,
		overlineThickness: P,
		paintOrder: null,
		panose1: null,
		path: null,
		pathLength: P,
		patternContentUnits: null,
		patternTransform: null,
		patternUnits: null,
		phase: null,
		ping: F,
		pitch: null,
		playbackOrder: null,
		pointerEvents: null,
		points: null,
		pointsAtX: P,
		pointsAtY: P,
		pointsAtZ: P,
		preserveAlpha: null,
		preserveAspectRatio: null,
		primitiveUnits: null,
		propagate: null,
		property: me,
		r: null,
		radius: null,
		referrerPolicy: null,
		refX: null,
		refY: null,
		rel: me,
		rev: me,
		renderingIntent: null,
		repeatCount: null,
		repeatDur: null,
		requiredExtensions: me,
		requiredFeatures: me,
		requiredFonts: me,
		requiredFormats: me,
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
		specularConstant: P,
		specularExponent: P,
		spreadMethod: null,
		spacing: null,
		startOffset: null,
		stdDeviation: null,
		stemh: null,
		stemv: null,
		stitchTiles: null,
		stopColor: null,
		stopOpacity: null,
		strikethroughPosition: P,
		strikethroughThickness: P,
		string: null,
		stroke: null,
		strokeDashArray: me,
		strokeDashOffset: null,
		strokeLineCap: null,
		strokeLineJoin: null,
		strokeMiterLimit: P,
		strokeOpacity: P,
		strokeWidth: null,
		style: null,
		surfaceScale: P,
		syncBehavior: null,
		syncBehaviorDefault: null,
		syncMaster: null,
		syncTolerance: null,
		syncToleranceDefault: null,
		systemLanguage: me,
		tabIndex: P,
		tableValues: null,
		target: null,
		targetX: P,
		targetY: P,
		textAnchor: null,
		textDecoration: null,
		textRendering: null,
		textLength: null,
		timelineBegin: null,
		title: null,
		transformBehavior: null,
		type: null,
		typeOf: me,
		to: null,
		transform: null,
		transformOrigin: null,
		u1: null,
		u2: null,
		underlinePosition: P,
		underlineThickness: P,
		unicode: null,
		unicodeBidi: null,
		unicodeRange: null,
		unitsPerEm: P,
		values: null,
		vAlphabetic: P,
		vMathematical: P,
		vectorEffect: null,
		vHanging: P,
		vIdeographic: P,
		version: null,
		vertAdvY: P,
		vertOriginX: P,
		vertOriginY: P,
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
		xHeight: P,
		y: null,
		y1: null,
		y2: null,
		yChannelSelector: null,
		z: null,
		zoomAndPan: null
	},
	space: "svg",
	transform: xe
}), Te = ye({
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
}), Ee = ye({
	attributes: { xmlnsxlink: "xmlns:xlink" },
	properties: {
		xmlnsXLink: null,
		xmlns: null
	},
	space: "xmlns",
	transform: Se
}), De = ye({
	properties: {
		xmlBase: null,
		xmlLang: null,
		xmlSpace: null
	},
	space: "xml",
	transform(e, t) {
		return "xml:" + t.slice(3).toLowerCase();
	}
}), Oe = {
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
}, ke = /[A-Z]/g, Ae = /-[a-z]/g, je = /^data[-\w.:]+$/i;
function Me(e, t) {
	let n = le(t), r = t, i = j;
	if (n in e.normal) return e.property[e.normal[n]];
	if (n.length > 4 && n.slice(0, 4) === "data" && je.test(t)) {
		if (t.charAt(4) === "-") {
			let e = t.slice(5).replace(Ae, Pe);
			r = "data" + e.charAt(0).toUpperCase() + e.slice(1);
		} else {
			let e = t.slice(4);
			if (!Ae.test(e)) {
				let n = e.replace(ke, Ne);
				n.charAt(0) !== "-" && (n = "-" + n), t = "data" + n;
			}
		}
		i = _e;
	}
	return new i(r, t);
}
function Ne(e) {
	return "-" + e.toLowerCase();
}
function Pe(e) {
	return e.charAt(1).toUpperCase();
}
// node_modules/.pnpm/property-information@7.2.0/node_modules/property-information/index.js
var Fe = ce([
	be,
	Ce,
	Te,
	Ee,
	De
], "html"), Ie = ce([
	be,
	we,
	Te,
	Ee,
	De
], "svg");
// node_modules/.pnpm/comma-separated-tokens@2.0.3/node_modules/comma-separated-tokens/index.js
function Le(e) {
	let t = [], n = String(e || ""), r = n.indexOf(","), i = 0, a = !1;
	for (; !a;) {
		r === -1 && (r = n.length, a = !0);
		let e = n.slice(i, r).trim();
		(e || !a) && t.push(e), i = r + 1, r = n.indexOf(",", i);
	}
	return t;
}
function Re(e, t) {
	let n = t || {};
	return (e[e.length - 1] === "" ? [...e, ""] : e).join((n.padRight ? " " : "") + "," + (n.padLeft === !1 ? "" : " ")).trim();
}
// node_modules/.pnpm/hast-util-parse-selector@4.0.0/node_modules/hast-util-parse-selector/lib/index.js
var ze = /[#.]/g;
function Be(e, t) {
	let n = e || "", r = {}, i = 0, a, o;
	for (; i < n.length;) {
		ze.lastIndex = i;
		let e = ze.exec(n), t = n.slice(i, e ? e.index : n.length);
		t && (a ? a === "#" ? r.id = t : Array.isArray(r.className) ? r.className.push(t) : r.className = [t] : o = t, i += t.length), e && (a = e[0], i++);
	}
	return {
		type: "element",
		tagName: o || t || "div",
		properties: r,
		children: []
	};
}
// node_modules/.pnpm/space-separated-tokens@2.0.2/node_modules/space-separated-tokens/index.js
function Ve(e) {
	let t = String(e || "").trim();
	return t ? t.split(/[ \t\n\r\f]+/g) : [];
}
function He(e) {
	return e.join(" ").trim();
}
// node_modules/.pnpm/hastscript@9.0.3/node_modules/hastscript/lib/create-h.js
function Ue(e, t, n) {
	let r = n ? Ye(n) : void 0;
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
			o = Be(n, t);
			let s = o.tagName.toLowerCase(), c = r ? r.get(s) : void 0;
			if (o.tagName = c || s, We(i)) a.unshift(i);
			else for (let [t, n] of Object.entries(i)) Ge(e, o.properties, t, n);
		}
		for (let e of a) Ke(o.children, e);
		return o.type === "element" && o.tagName === "template" && e.space === "html" && (o.content = {
			type: "root",
			children: o.children
		}, o.children = []), o;
	}
	return i;
}
function We(e) {
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
function Ge(e, t, n, r) {
	if (r == null) return;
	let i = Me(e, n), a;
	if (typeof r == "number") {
		if (Number.isNaN(r)) return;
		a = r;
	} else a = typeof r == "boolean" ? r : typeof r == "string" ? i.spaceSeparated ? Ve(r) : i.commaSeparated ? Le(r) : i.commaOrSpaceSeparated ? Ve(Le(r).join(" ")) : qe(i, i.property, r) : Array.isArray(r) ? [...r] : i.property === "style" ? Je(r) : String(r);
	if (Array.isArray(a)) {
		let e = [];
		for (let t of a) e.push(qe(i, i.property, t));
		a = e;
	}
	if (i.property === "className" && Array.isArray(t.className)) {
		let e = a;
		a = [...t.className, ...Array.isArray(e) ? e : [e]];
	}
	t[i.property] = a;
}
function Ke(e, t) {
	if (t != null) {
		if (typeof t == "number" || typeof t == "string") e.push({
			type: "text",
			value: String(t)
		});
		else if (Array.isArray(t)) for (let n of t) Ke(e, n);
		else if (typeof t == "object" && "type" in t) t.type === "root" ? Ke(e, t.children) : e.push(t);
		else throw Error("Expected node, nodes, or string, got `" + t + "`");
	}
}
function qe(e, t, n) {
	if (typeof n == "string") {
		if (e.number && n && !Number.isNaN(Number(n))) return Number(n);
		if ((e.boolean || e.overloadedBoolean) && (n === "" || le(n) === le(t))) return !0;
	}
	return n;
}
function Je(e) {
	let t = [];
	for (let [n, r] of Object.entries(e)) t.push([n, r].join(": "));
	return t.join("; ");
}
function Ye(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) t.set(n.toLowerCase(), n);
	return t;
}
// node_modules/.pnpm/hastscript@9.0.3/node_modules/hastscript/lib/svg-case-sensitive-tag-names.js
var Xe = /* @__PURE__ */ "altGlyph.altGlyphDef.altGlyphItem.animateColor.animateMotion.animateTransform.clipPath.feBlend.feColorMatrix.feComponentTransfer.feComposite.feConvolveMatrix.feDiffuseLighting.feDisplacementMap.feDistantLight.feDropShadow.feFlood.feFuncA.feFuncB.feFuncG.feFuncR.feGaussianBlur.feImage.feMerge.feMergeNode.feMorphology.feOffset.fePointLight.feSpecularLighting.feSpotLight.feTile.feTurbulence.foreignObject.glyphRef.linearGradient.radialGradient.solidColor.textArea.textPath".split("."), Ze = Ue(Fe, "div"), Qe = Ue(Ie, "g", Xe), $e = {
	html: "http://www.w3.org/1999/xhtml",
	mathml: "http://www.w3.org/1998/Math/MathML",
	svg: "http://www.w3.org/2000/svg",
	xlink: "http://www.w3.org/1999/xlink",
	xml: "http://www.w3.org/XML/1998/namespace",
	xmlns: "http://www.w3.org/2000/xmlns/"
};
// node_modules/.pnpm/hast-util-from-dom@5.0.1/node_modules/hast-util-from-dom/lib/index.js
function et(e, t) {
	return tt(e, t || {}) || {
		type: "root",
		children: []
	};
}
function tt(e, t) {
	let n = nt(e, t);
	return n && t.afterTransform && t.afterTransform(e, n), n;
}
function nt(e, t) {
	switch (e.nodeType) {
		case 1: return st(e, t);
		case 3: return at(e);
		case 8: return ot(e);
		case 9: return rt(e, t);
		case 10: return it();
		case 11: return rt(e, t);
		default: return;
	}
}
function rt(e, t) {
	return {
		type: "root",
		children: ct(e, t)
	};
}
function it() {
	return { type: "doctype" };
}
function at(e) {
	return {
		type: "text",
		value: e.nodeValue || ""
	};
}
function ot(e) {
	return {
		type: "comment",
		value: e.nodeValue || ""
	};
}
function st(e, t) {
	let n = e.namespaceURI, r = n === $e.svg ? Qe : Ze, i = n === $e.html ? e.tagName.toLowerCase() : e.tagName, a = n === $e.html && i === "template" ? e.content : e, o = e.getAttributeNames(), s = {}, c = -1;
	for (; ++c < o.length;) s[o[c]] = e.getAttribute(o[c]) || "";
	return r(i, s, ct(a, t));
}
function ct(e, t) {
	let n = e.childNodes, r = [], i = -1;
	for (; ++i < n.length;) {
		let e = tt(n[i], t);
		e !== void 0 && r.push(e);
	}
	return r;
}
// node_modules/.pnpm/hast-util-from-html-isomorphic@2.0.0/node_modules/hast-util-from-html-isomorphic/lib/browser.js
var lt = new DOMParser();
function ut(e, t) {
	return et(t?.fragment ? dt(e) : lt.parseFromString(e, "text/html"));
}
function dt(e) {
	let t = document.createElement("template");
	return t.innerHTML = e, t.content;
}
// node_modules/.pnpm/hast-util-to-text@4.0.3/node_modules/hast-util-to-text/lib/index.js
var ft = /\n/g, pt = /[\t ]+/g, mt = /^[\t\n\f\r ]+$/, ht = /* @__PURE__ */ new Set([
	"caption",
	"col",
	"colgroup",
	"tbody",
	"td",
	"tfoot",
	"th",
	"thead",
	"tr"
]), gt = /* @__PURE__ */ new Set([
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
]), _t = /* @__PURE__ */ new Set(/* @__PURE__ */ "address.article.aside.blockquote.body.caption.center.dd.dialog.dir.dl.dt.div.figure.figcaption.footer.form.h1.h2.h3.h4.h5.h6.header.hgroup.hr.html.legend.li.listing.main.menu.nav.ol.p.plaintext.pre.section.ul.xmp".split("."));
function vt(e, t) {
	let n = t || {}, r = "children" in e ? e.children : [], i = !1, a = !1;
	e.type === "element" && (i = _t.has(e.tagName), a = e.tagName === "table" || kt(e));
	let o = wt(e, {
		breakAfter: !1,
		breakBefore: !1,
		whitespace: n.whitespace || "normal"
	}), s = [];
	(e.type === "text" || e.type === "comment") && Dt(s, xt(e, {
		breakAfter: !0,
		breakBefore: !0,
		whitespace: o
	}));
	let c = -1;
	for (; ++c < r.length;) {
		let t = r[c + 1], n = t ? t.type === "element" && t.tagName === "br" : i, l = c ? void 0 : i;
		Dt(s, yt(r[c], c, e, {
			breakAfter: n,
			breakBefore: l,
			rowAfter: a ? Tt(e, c, void 0) : void 0,
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
function yt(e, t, n, r) {
	if (e.type === "element") return bt(e, t, n, r);
	if (e.type === "text") {
		if (mt.test(e.value) && n.type === "element" && (n.tagName === "table" || n.tagName === "tr" || kt(n))) {
			let e = n.children[t - 1], r = n.children[t + 1];
			if ((!e || e.type === "element" && ht.has(e.tagName)) && (!r || r.type === "element" && ht.has(r.tagName))) return [];
		}
		return r.whitespace === "normal" ? xt(e, r) : St(e);
	}
	return [];
}
function bt(e, t, n, r) {
	let i = wt(e, r), a = e.children || [], o = e.tagName === "table" || kt(e), s = -1, c = [];
	if (gt.has(e.tagName) || e.properties?.hidden || e.tagName === "dialog" && !e.properties?.open) return c;
	let l, u;
	for (e.tagName === "br" || jt(e) && (r.rowAfter || Et(n, t, jt)) ? u = "\n" : e.tagName === "p" ? (l = 2, u = 2) : _t.has(e.tagName) && (l = 1, u = 1); ++s < a.length;) {
		let t = a[s + 1], n = t ? t.type === "element" && t.tagName === "br" : u, d = s ? void 0 : l;
		Dt(c, yt(a[s], s, e, {
			breakAfter: n,
			breakBefore: d,
			rowAfter: o ? Tt(e, s, r.rowAfter) : void 0,
			whitespace: i
		}));
	}
	return Ot(e) && Et(n, t, Ot) && c.push("	"), l && c.unshift(l), u && c.push(u), c;
}
function xt(e, t) {
	let n = String(e.value), r = [], i = [], a = 0;
	for (; a <= n.length;) {
		ft.lastIndex = a;
		let e = ft.exec(n), i = e && "index" in e ? e.index : n.length;
		r.push(Ct(n.slice(a, i).replace(/[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, ""), a !== 0 || t.breakBefore, i !== n.length || t.breakAfter)), a = i + 1;
	}
	let o = -1, s;
	for (; ++o < r.length;) r[o].charCodeAt(r[o].length - 1) === 8203 || o < r.length - 1 && r[o + 1].charCodeAt(0) === 8203 ? (i.push(r[o]), s = void 0) : r[o] ? (typeof s == "number" && i.push(s), i.push(r[o]), s = 0) : (o === 0 || o === r.length - 1) && i.push(0);
	return i;
}
function St(e) {
	return [String(e.value)];
}
function Ct(e, t, n) {
	let r = [], i = 0, a;
	for (; i < e.length;) {
		pt.lastIndex = i;
		let n = pt.exec(e);
		a = n ? n.index : e.length, !i && !a && n && !t && r.push(""), i !== a && r.push(e.slice(i, a)), i = n ? a + n[0].length : a;
	}
	return i !== a && !n && r.push(""), r.join(" ");
}
function wt(e, t) {
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
function Tt(e, t, n) {
	return e.type === "element" && e.tagName === "table" ? Et(e, t, At) : n;
}
function Et(e, t, n) {
	for (; ++t < e.children.length;) {
		let r = e.children[t];
		if (r.type === "element" && n(r)) return !0;
	}
	return !1;
}
function Dt(e, t) {
	let n = -1;
	for (; ++n < t.length;) e.push(t[n]);
}
function Ot(e) {
	return e.tagName === "td" || e.tagName === "th";
}
function kt(e) {
	return e.tagName === "tbody" || e.tagName === "tfoot" || e.tagName === "thead";
}
function At(e) {
	if (jt(e)) return !0;
	if (kt(e)) {
		let t = -1;
		for (; ++t < e.children.length;) {
			let n = e.children[t];
			if (n.type === "element" && jt(n)) return !0;
		}
	}
	return !1;
}
function jt(e) {
	return e.tagName === "tr";
}
// node_modules/.pnpm/rehype-katex@7.0.1/node_modules/rehype-katex/lib/index.js
var Mt = {}, Nt = [];
function Pt(e) {
	let t = e || Mt;
	return function(e, n) {
		y(e, "element", function(e, i) {
			let a = Array.isArray(e.properties.className) ? e.properties.className : Nt, o = a.includes("language-math"), s = a.includes("math-display"), c = a.includes("math-inline"), l = s;
			if (!o && !s && !c) return;
			let u = i[i.length - 1], d = e;
			/* c8 ignore next -- verbose to test. */
			if (e.tagName === "code" && o && u && u.type === "element" && u.tagName === "pre" && (d = u, u = i[i.length - 2], l = !0), !u) return;
			let f = vt(d, { whitespace: "pre" }), p;
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
			typeof p == "string" && (p = ut(p, { fragment: !0 }).children);
			let m = u.children.indexOf(d);
			return u.children.splice(m, 1, ...p), v;
		});
	};
}
// node_modules/.pnpm/@ungap+structured-clone@1.4.0/node_modules/@ungap/structured-clone/esm/deserialize.js
var { defineProperty: Ft } = Object, It = typeof self == "object" ? self : globalThis, Lt = (e, t) => {
	switch (e) {
		case "Function":
		case "SharedWorker":
		case "Worker":
		case "eval":
		case "setInterval":
		case "setTimeout": throw TypeError("unable to deserialize " + e);
	}
	return new It[e](t);
}, Rt = (e, t) => {
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
					i === "__proto__" ? Ft(e, i, {
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
				return n(typeof It[e] == "function" ? Lt(e, t) : Error(t), i);
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
		return n(Lt(a, o), i);
	};
	return r;
}, zt = (e) => Rt(/* @__PURE__ */ new Map(), e)(0), Bt = "", { toString: Vt } = {}, { keys: Ht, is: Ut } = Object, Wt = (e) => {
	let t = typeof e;
	if (t !== "object" || !e) return [0, t];
	let n = Vt.call(e).slice(8, -1);
	switch (n) {
		case "Array": return [1, Bt];
		case "Object": return [2, Bt];
		case "Date": return [3, Bt];
		case "RegExp": return [4, Bt];
		case "Map": return [5, Bt];
		case "Set": return [6, Bt];
		case "DataView": return [1, n];
	}
	return n.includes("Array") ? [1, n] : e instanceof Error ? [7, e.name || "Error"] : [2, n];
}, Gt = ([e, t]) => e === 0 && (t === "function" || t === "symbol"), Kt = (e, t, n, r) => {
	let i = (e, t) => {
		let i = r.push(e) - 1;
		return n.set(t, i), i;
	}, a = (o) => {
		if (n.has(o)) return n.get(o);
		let [s, c] = Wt(o);
		switch (s) {
			case 0: {
				let t = o;
				switch (c) {
					case "bigint":
						s = 8, t = o.toString();
						break;
					case "number":
						if (!o && Ut(o, -0)) return r.push(["-0"]) - 1;
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
				for (let t of Ht(o)) (e || !Gt(Wt(o[t]))) && n.push([a(t), a(o[t])]);
				return r;
			}
			case 3: return i([s, isNaN(o.getTime()) ? Bt : o.toISOString()], o);
			case 4: {
				let { source: e, flags: t } = o;
				return i([s, {
					source: e,
					flags: t
				}], o);
			}
			case 5: {
				let t = [], n = i([s, t], o);
				for (let [n, r] of o) (e || !(Gt(Wt(n)) || Gt(Wt(r)))) && t.push([a(n), a(r)]);
				return n;
			}
			case 6: {
				let t = [], n = i([s, t], o);
				for (let n of o) (e || !Gt(Wt(n))) && t.push(a(n));
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
}, qt = (e, { json: t, lossy: n } = {}) => {
	let r = [];
	return Kt(!(t || n), !!t, /* @__PURE__ */ new Map(), r)(e), r;
}, Jt = typeof structuredClone == "function" ? 
/* c8 ignore start */
(e, t) => t && ("json" in t || "lossy" in t) ? zt(qt(e, t)) : structuredClone(e) : (e, t) => zt(qt(e, t));
// node_modules/.pnpm/vfile-location@5.0.4/node_modules/vfile-location/lib/index.js
function Yt(e) {
	let t = String(e), n = [], r = -1, i = -1;
	return {
		toOffset: s,
		toPoint: o
	};
	function a() {
		let e = n.at(-1) ?? 0;
		r < e && (r = t.indexOf("\r", e), r === -1 && (r = Infinity)), i < e && (i = t.indexOf("\n", e), i === -1 && (i = Infinity));
		let a = r + 1 === i ? i : Math.min(r, i);
		n.push((a === Infinity ? t.length : a) + 1);
	}
	function o(e) {
		if (typeof e == "number" && e > -1 && e <= t.length) {
			for (; (n.at(-1) ?? 0) <= e;) a();
			let t = 0, r = n.length - 1;
			for (; t < r;) {
				let i = Math.floor((t + r) / 2);
				n[i] > e ? r = i : t = i + 1;
			}
			return {
				line: t + 1,
				column: e - (t > 0 ? n[t - 1] : 0) + 1,
				offset: e
			};
		}
	}
	function s(e) {
		if (e && typeof e.line == "number" && typeof e.column == "number" && !Number.isNaN(e.line) && e.column > 0) {
			for (; n.length < e.line && (n.at(-1) ?? 0) <= t.length;) a();
			let r = (e.line > 1 ? n[e.line - 2] : 0) + e.column - 1;
			if (r < n[e.line - 1]) return r;
		}
	}
}
// node_modules/.pnpm/hast-util-from-parse5@8.0.4/node_modules/hast-util-from-parse5/lib/index.js
var Xt = {}.hasOwnProperty, Zt = Object.prototype;
function Qt(e, t) {
	let n = t || {};
	return $t({
		file: n.file || void 0,
		location: !1,
		schema: n.space === "svg" ? Ie : Fe,
		verbose: n.verbose || !1
	}, e);
}
function $t(e, t) {
	let n;
	switch (t.nodeName) {
		case "#comment": {
			let r = t;
			return n = {
				type: "comment",
				value: r.data
			}, nn(e, r, n), n;
		}
		case "#document":
		case "#document-fragment": {
			let r = t, i = "mode" in r ? r.mode === "quirks" || r.mode === "limited-quirks" : !1;
			if (n = {
				type: "root",
				children: en(e, t.childNodes),
				data: { quirksMode: i }
			}, e.file && e.location) {
				let t = String(e.file), r = Yt(t), i = r.toPoint(0), a = r.toPoint(t.length);
				n.position = {
					start: i,
					end: a
				};
			}
			return n;
		}
		case "#documentType": {
			let r = t;
			return n = { type: "doctype" }, nn(e, r, n), n;
		}
		case "#text": {
			let r = t;
			return n = {
				type: "text",
				value: r.value
			}, nn(e, r, n), n;
		}
		default: return n = tn(e, t), n;
	}
}
function en(e, t) {
	let n = -1, r = [];
	for (; ++n < t.length;) {
		let i = $t(e, t[n]);
		r.push(i);
	}
	return r;
}
function tn(e, t) {
	let { schema: n } = e;
	e.schema = t.namespaceURI === $e.svg ? Ie : Fe;
	let r = -1, i = {};
	for (; ++r < t.attrs.length;) {
		let e = t.attrs[r], n = (e.prefix ? e.prefix + ":" : "") + e.name;
		Xt.call(Zt, n) || (i[n] = e.value);
	}
	let a = (e.schema.space === "svg" ? Qe : Ze)(t.tagName, i, en(e, t.childNodes));
	if (nn(e, t, a), a.tagName === "template") {
		if (t.namespaceURI === $e.html) {
			let n = t, r = n.sourceCodeLocation, i = r && r.startTag && an(r.startTag), o = r && r.endTag && an(r.endTag), s = $t(e, n.content);
			i && o && e.file && (s.position = {
				start: i.end,
				end: o.start
			}), a.content = s;
		} else a.content && (a.children = a.content.children, delete a.content);
	}
	return e.schema = n, a;
}
function nn(e, t, n) {
	if ("sourceCodeLocation" in t && t.sourceCodeLocation && e.file) {
		let r = rn(e, n, t.sourceCodeLocation);
		r && (e.location = !0, n.position = r);
	}
}
function rn(e, t, n) {
	let r = an(n);
	if (t.type === "element") {
		let i = t.children[t.children.length - 1];
		if (r && !n.endTag && i && i.position && i.position.end && (r.end = Object.assign({}, i.position.end)), e.verbose) {
			let r = {}, i;
			if (n.attrs) for (i in n.attrs) Xt.call(n.attrs, i) && (r[Me(e.schema, i).property] = an(n.attrs[i]));
			n.startTag;
			let a = an(n.startTag), o = n.endTag ? an(n.endTag) : void 0, s = { opening: a };
			o && (s.closing = o), s.properties = r, t.data = { position: s };
		}
	}
	return r;
}
function an(e) {
	let t = on({
		line: e.startLine,
		column: e.startCol,
		offset: e.startOffset
	}), n = on({
		line: e.endLine,
		column: e.endCol,
		offset: e.endOffset
	});
	return t || n ? {
		start: t,
		end: n
	} : void 0;
}
function on(e) {
	return e.line && e.column ? e : void 0;
}
// node_modules/.pnpm/zwitch@2.0.4/node_modules/zwitch/index.js
var sn = {}.hasOwnProperty;
function cn(e, t) {
	let n = t || {};
	function r(t, ...n) {
		let i = r.invalid, a = r.handlers;
		if (t && sn.call(t, e)) {
			let n = String(t[e]);
			i = sn.call(a, n) ? a[n] : r.unknown;
		}
		if (i) return i.call(this, t, ...n);
	}
	return r.handlers = n.handlers || {}, r.invalid = n.invalid, r.unknown = n.unknown, r;
}
// node_modules/.pnpm/hast-util-to-parse5@8.0.1/node_modules/hast-util-to-parse5/lib/index.js
var ln = {}, un = {}.hasOwnProperty, dn = cn("type", { handlers: {
	root: pn,
	element: vn,
	text: gn,
	comment: _n,
	doctype: hn
} });
function fn(e, t) {
	let n = (t || ln).space;
	return dn(e, n === "svg" ? Ie : Fe);
}
function pn(e, t) {
	let n = {
		nodeName: "#document",
		mode: (e.data || {}).quirksMode ? "quirks" : "no-quirks",
		childNodes: []
	};
	return n.childNodes = bn(e.children, n, t), xn(e, n), n;
}
function mn(e, t) {
	let n = {
		nodeName: "#document-fragment",
		childNodes: []
	};
	return n.childNodes = bn(e.children, n, t), xn(e, n), n;
}
function hn(e) {
	let t = {
		nodeName: "#documentType",
		name: "html",
		publicId: "",
		systemId: "",
		parentNode: null
	};
	return xn(e, t), t;
}
function gn(e) {
	let t = {
		nodeName: "#text",
		value: e.value,
		parentNode: null
	};
	return xn(e, t), t;
}
function _n(e) {
	let t = {
		nodeName: "#comment",
		data: e.value,
		parentNode: null
	};
	return xn(e, t), t;
}
function vn(e, t) {
	let n = t, r = n;
	e.type === "element" && e.tagName.toLowerCase() === "svg" && n.space === "html" && (r = Ie);
	let i = [], a;
	if (e.properties) {
		for (a in e.properties) if (a !== "children" && un.call(e.properties, a)) {
			let t = yn(r, a, e.properties[a]);
			t && i.push(t);
		}
	}
	let o = r.space, s = {
		nodeName: e.tagName,
		tagName: e.tagName,
		attrs: i,
		namespaceURI: $e[o],
		childNodes: [],
		parentNode: null
	};
	return s.childNodes = bn(e.children, s, r), xn(e, s), e.tagName === "template" && e.content && (s.content = mn(e.content, r)), s;
}
function yn(e, t, n) {
	let r = Me(e, t);
	if (n === !1 || n == null || typeof n == "number" && Number.isNaN(n) || !n && r.boolean) return;
	Array.isArray(n) && (n = r.commaSeparated ? Re(n) : He(n));
	let i = {
		name: r.attribute,
		value: n === !0 ? "" : String(n)
	};
	if (r.space && r.space !== "html" && r.space !== "svg") {
		let e = i.name.indexOf(":");
		e < 0 ? i.prefix = "" : (i.name = i.name.slice(e + 1), i.prefix = r.attribute.slice(0, e)), i.namespace = $e[r.space];
	}
	return i;
}
function bn(e, t, n) {
	let r = -1, i = [];
	if (e) for (; ++r < e.length;) {
		let a = dn(e[r], n);
		a.parentNode = t, i.push(a);
	}
	return i;
}
function xn(e, t) {
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
// node_modules/.pnpm/html-void-elements@3.0.0/node_modules/html-void-elements/index.js
var Sn = [
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
], Cn = /* @__PURE__ */ new Set([
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
]), I;
(function(e) {
	e[e.EOF = -1] = "EOF", e[e.NULL = 0] = "NULL", e[e.TABULATION = 9] = "TABULATION", e[e.CARRIAGE_RETURN = 13] = "CARRIAGE_RETURN", e[e.LINE_FEED = 10] = "LINE_FEED", e[e.FORM_FEED = 12] = "FORM_FEED", e[e.SPACE = 32] = "SPACE", e[e.EXCLAMATION_MARK = 33] = "EXCLAMATION_MARK", e[e.QUOTATION_MARK = 34] = "QUOTATION_MARK", e[e.AMPERSAND = 38] = "AMPERSAND", e[e.APOSTROPHE = 39] = "APOSTROPHE", e[e.HYPHEN_MINUS = 45] = "HYPHEN_MINUS", e[e.SOLIDUS = 47] = "SOLIDUS", e[e.DIGIT_0 = 48] = "DIGIT_0", e[e.DIGIT_9 = 57] = "DIGIT_9", e[e.SEMICOLON = 59] = "SEMICOLON", e[e.LESS_THAN_SIGN = 60] = "LESS_THAN_SIGN", e[e.EQUALS_SIGN = 61] = "EQUALS_SIGN", e[e.GREATER_THAN_SIGN = 62] = "GREATER_THAN_SIGN", e[e.QUESTION_MARK = 63] = "QUESTION_MARK", e[e.LATIN_CAPITAL_A = 65] = "LATIN_CAPITAL_A", e[e.LATIN_CAPITAL_Z = 90] = "LATIN_CAPITAL_Z", e[e.RIGHT_SQUARE_BRACKET = 93] = "RIGHT_SQUARE_BRACKET", e[e.GRAVE_ACCENT = 96] = "GRAVE_ACCENT", e[e.LATIN_SMALL_A = 97] = "LATIN_SMALL_A", e[e.LATIN_SMALL_Z = 122] = "LATIN_SMALL_Z";
})(I ||= {});
var wn = {
	DASH_DASH: "--",
	CDATA_START: "[CDATA[",
	DOCTYPE: "doctype",
	SCRIPT: "script",
	PUBLIC: "public",
	SYSTEM: "system"
};
function Tn(e) {
	return e >= 55296 && e <= 57343;
}
function En(e) {
	return e >= 56320 && e <= 57343;
}
function Dn(e, t) {
	return (e - 55296) * 1024 + 9216 + t;
}
function On(e) {
	return e !== 32 && e !== 10 && e !== 13 && e !== 9 && e !== 12 && e >= 1 && e <= 31 || e >= 127 && e <= 159;
}
function kn(e) {
	return e >= 64976 && e <= 65007 || Cn.has(e);
}
// node_modules/.pnpm/parse5@8.1.1/node_modules/parse5/dist/common/error-codes.js
var L;
(function(e) {
	e.controlCharacterInInputStream = "control-character-in-input-stream", e.noncharacterInInputStream = "noncharacter-in-input-stream", e.surrogateInInputStream = "surrogate-in-input-stream", e.nonVoidHtmlElementStartTagWithTrailingSolidus = "non-void-html-element-start-tag-with-trailing-solidus", e.endTagWithAttributes = "end-tag-with-attributes", e.endTagWithTrailingSolidus = "end-tag-with-trailing-solidus", e.unexpectedSolidusInTag = "unexpected-solidus-in-tag", e.unexpectedNullCharacter = "unexpected-null-character", e.unexpectedQuestionMarkInsteadOfTagName = "unexpected-question-mark-instead-of-tag-name", e.invalidFirstCharacterOfTagName = "invalid-first-character-of-tag-name", e.unexpectedEqualsSignBeforeAttributeName = "unexpected-equals-sign-before-attribute-name", e.missingEndTagName = "missing-end-tag-name", e.unexpectedCharacterInAttributeName = "unexpected-character-in-attribute-name", e.unknownNamedCharacterReference = "unknown-named-character-reference", e.missingSemicolonAfterCharacterReference = "missing-semicolon-after-character-reference", e.unexpectedCharacterAfterDoctypeSystemIdentifier = "unexpected-character-after-doctype-system-identifier", e.unexpectedCharacterInUnquotedAttributeValue = "unexpected-character-in-unquoted-attribute-value", e.eofBeforeTagName = "eof-before-tag-name", e.eofInTag = "eof-in-tag", e.missingAttributeValue = "missing-attribute-value", e.missingWhitespaceBetweenAttributes = "missing-whitespace-between-attributes", e.missingWhitespaceAfterDoctypePublicKeyword = "missing-whitespace-after-doctype-public-keyword", e.missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers = "missing-whitespace-between-doctype-public-and-system-identifiers", e.missingWhitespaceAfterDoctypeSystemKeyword = "missing-whitespace-after-doctype-system-keyword", e.missingQuoteBeforeDoctypePublicIdentifier = "missing-quote-before-doctype-public-identifier", e.missingQuoteBeforeDoctypeSystemIdentifier = "missing-quote-before-doctype-system-identifier", e.missingDoctypePublicIdentifier = "missing-doctype-public-identifier", e.missingDoctypeSystemIdentifier = "missing-doctype-system-identifier", e.abruptDoctypePublicIdentifier = "abrupt-doctype-public-identifier", e.abruptDoctypeSystemIdentifier = "abrupt-doctype-system-identifier", e.cdataInHtmlContent = "cdata-in-html-content", e.incorrectlyOpenedComment = "incorrectly-opened-comment", e.eofInScriptHtmlCommentLikeText = "eof-in-script-html-comment-like-text", e.eofInDoctype = "eof-in-doctype", e.nestedComment = "nested-comment", e.abruptClosingOfEmptyComment = "abrupt-closing-of-empty-comment", e.eofInComment = "eof-in-comment", e.incorrectlyClosedComment = "incorrectly-closed-comment", e.eofInCdata = "eof-in-cdata", e.absenceOfDigitsInNumericCharacterReference = "absence-of-digits-in-numeric-character-reference", e.nullCharacterReference = "null-character-reference", e.surrogateCharacterReference = "surrogate-character-reference", e.characterReferenceOutsideUnicodeRange = "character-reference-outside-unicode-range", e.controlCharacterReference = "control-character-reference", e.noncharacterCharacterReference = "noncharacter-character-reference", e.missingWhitespaceBeforeDoctypeName = "missing-whitespace-before-doctype-name", e.missingDoctypeName = "missing-doctype-name", e.invalidCharacterSequenceAfterDoctypeName = "invalid-character-sequence-after-doctype-name", e.duplicateAttribute = "duplicate-attribute", e.nonConformingDoctype = "non-conforming-doctype", e.missingDoctype = "missing-doctype", e.misplacedDoctype = "misplaced-doctype", e.endTagWithoutMatchingOpenElement = "end-tag-without-matching-open-element", e.closingOfElementWithOpenChildElements = "closing-of-element-with-open-child-elements", e.disallowedContentInNoscriptInHead = "disallowed-content-in-noscript-in-head", e.openElementsLeftAfterEof = "open-elements-left-after-eof", e.abandonedHeadElementChild = "abandoned-head-element-child", e.misplacedStartTagForHeadElement = "misplaced-start-tag-for-head-element", e.nestedNoscriptInHead = "nested-noscript-in-head", e.eofInElementThatCanContainOnlyText = "eof-in-element-that-can-contain-only-text";
})(L ||= {});
// node_modules/.pnpm/parse5@8.1.1/node_modules/parse5/dist/tokenizer/preprocessor.js
var An = 65536, jn = class {
	constructor(e) {
		this.handler = e, this.html = "", this.pos = -1, this.lastGapPos = -2, this.gapStack = [], this.skipNextNewLine = !1, this.lastChunkWritten = !1, this.endOfChunkHit = !1, this.bufferWaterline = An, this.isEol = !1, this.lineStartPos = 0, this.droppedBufferSize = 0, this.line = 1, this.lastErrOffset = -1;
	}
	get col() {
		return this.pos - this.lineStartPos + Number(this.lastGapPos !== this.pos);
	}
	get codePointStart() {
		return this.pos - Number(this.lastGapPos === this.pos);
	}
	get offset() {
		return this.droppedBufferSize + this.codePointStart;
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
			if (!En(e) && En(t)) return this.pos++, this._addGap(), Dn(e, t);
		} else if (!this.lastChunkWritten) return this.endOfChunkHit = !0, I.EOF;
		return this._err(L.surrogateInInputStream), e;
	}
	willDropParsedChunk() {
		return this.pos > this.bufferWaterline;
	}
	dropParsedChunk(e = 0) {
		if (this.willDropParsedChunk()) {
			let t = this.offset - this.droppedBufferSize - e;
			this.html = this.html.substring(t), this.lineStartPos -= t, this.droppedBufferSize += t, this.pos -= t, this.lastGapPos = -2, this.gapStack.length = 0, this.pos > e && this._addGap();
		}
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
		if (t >= this.html.length) return this.endOfChunkHit = !this.lastChunkWritten, I.EOF;
		let n = this.html.charCodeAt(t);
		return n === I.CARRIAGE_RETURN ? I.LINE_FEED : n;
	}
	advance() {
		if (this.pos++, this.isEol && (this.isEol = !1, this.line++, this.lineStartPos = this.pos), this.pos >= this.html.length) return this.endOfChunkHit = !this.lastChunkWritten, I.EOF;
		let e = this.html.charCodeAt(this.pos);
		return e === I.CARRIAGE_RETURN ? (this.isEol = !0, this.skipNextNewLine = !0, I.LINE_FEED) : e === I.LINE_FEED && (this.isEol = !0, this.skipNextNewLine) ? (this.line--, this.skipNextNewLine = !1, this._addGap(), this.advance()) : (this.skipNextNewLine = !1, Tn(e) && (e = this._processSurrogate(e)), this.handler.onParseError === null || e > 31 && e < 127 || e === I.LINE_FEED || e === I.CARRIAGE_RETURN || e > 159 && e < 64976 || this._checkForProblematicCharacters(e), e);
	}
	_checkForProblematicCharacters(e) {
		On(e) ? this._err(L.controlCharacterInInputStream) : kn(e) && this._err(L.noncharacterInInputStream);
	}
	retreat(e) {
		for (this.pos -= e; this.pos < this.lastGapPos;) this.lastGapPos = this.gapStack.pop(), this.pos--;
		this.isEol = !1;
	}
}, R;
(function(e) {
	e[e.CHARACTER = 0] = "CHARACTER", e[e.NULL_CHARACTER = 1] = "NULL_CHARACTER", e[e.WHITESPACE_CHARACTER = 2] = "WHITESPACE_CHARACTER", e[e.START_TAG = 3] = "START_TAG", e[e.END_TAG = 4] = "END_TAG", e[e.COMMENT = 5] = "COMMENT", e[e.DOCTYPE = 6] = "DOCTYPE", e[e.EOF = 7] = "EOF", e[e.HIBERNATION = 8] = "HIBERNATION";
})(R ||= {});
function Mn(e, t) {
	for (let n = e.attrs.length - 1; n >= 0; n--) if (e.attrs[n].name === t) return e.attrs[n].value;
	return null;
}
// node_modules/.pnpm/entities@9.0.0/node_modules/entities/dist/decode-codepoint.js
var Nn = [
	8364,
	0,
	8218,
	402,
	8222,
	8230,
	8224,
	8225,
	710,
	8240,
	352,
	8249,
	338,
	0,
	381,
	0,
	0,
	8216,
	8217,
	8220,
	8221,
	8226,
	8211,
	8212,
	732,
	8482,
	353,
	8250,
	339,
	0,
	382,
	376
];
function Pn(e) {
	return e === 0 || e >= 55296 && e <= 57343 || e > 1114111;
}
function Fn(e) {
	return Pn(e) ? 65533 : e >= 128 && e <= 159 && Nn[e - 128] || e;
}
// node_modules/.pnpm/entities@9.0.0/node_modules/entities/dist/generated/decode-data-html.js
var In = ["Q=¨`p0AEligMPacutebrevecircyfrgravelphamacrndogonpfpplyFunctionringscrsigntildeumlBackslashrvwedcyecausernoullistafropfrevescrumpeqCHcyOPYacutepitalDifferentialDyleyscaronedilirconintdotedillanterDotfrhiircleDotMinusPlusTimeslockwiseContourIntegralseCurlyDoubleQuoteQuoteolonengruentinttourIntegralpfroductunterClockwiseContourIntegralrossscrupCapDDotrahdJcyScyZcyaggerrrshvcaronyeltafriacriticalAcuteDotubleAcuteGraveTildemondfferentialDopftDotEqualubleContourIntegralDotwnArrowLeftArrowRightArrowTeeongLeftArrowRightArrowRightArrowRightArrowTeeUpArrowDownArrowVerticalBarwnArrowBarUpArrowBreveLeftRightVectorTeeVectorVectorBarRightTeeVectorVectorBarTeeArrowarrowscrtrokENGTHacutecaronircydotfrgravelementmacrptySmallSquareVerySmallSquareogonpfpsilonqualTildeilibriumscrimtaumlxistsponentialEFcyfrilledSmallSquareVerySmallSquareopfrAlluriertrfscrGJcyTammadbrevecedilircydotfrgopfreaterEqualLessFullEqualGreaterLessSlantEqualTildescrtHARDcyacektcircfrilbertSpaceopfrizontalLinescrtrokumpDownHumpEqualIEcyJligOcyacutecircydotfrgravemacrginaryIpliesntegralrsectionvisibleCommaTimesogonpftascrtildeukcymlJcircyfropfscrercyukcyKHcyJcyappacedilyfropfscrLJcyTacutembdangplacetrfrrcaronedilyeftAngleBracketrrowBarRightArrowCeilingDoubleBracketwnTeeVectorVectorBarFloorRightArrowVectorTeeArrowVectorriangleBarEqualUpDownVectorTeeVectorVectorBarVectorBararrowrightarrowssEqualGreaterFullEqualGreaterLessSlantEqualTildefrleftarrowmidotongLeftArrowRightArrowRightArrowleftarrowrightarrowrightarrowpfwerLeftArrowRightArrowscrhtroktMapcyediumSpacellintrffrinusPlusopfscruNJcyacutecaronedilyegativeMediumSpaceThickSpacenSpaceVeryThinSpacestedGreaterGreaterLessLesswLinefroBreaknBreakingSpacepftCongruentupCapDoubleVerticalBarElementqualTildexistsGreaterEqualFullEqualGreaterLessSlantEqualTildeHumpDownHumpEqualLeftTriangleBarEqualssEqualGreaterLessSlantEqualTildeNestedGreaterGreaterLessLessPrecedesEqualSlantEqualReverseElementightTriangleBarEqualSquareSubsetEqualpersetEqualubsetEqualcceedsEqualSlantEqualTildepersetEqualTildeEqualFullEqualTildeVerticalBarscrtildeuOEligacutecircydblacfrgravemacregaicronopfpenCurlyDoubleQuoteQuoterscrlashtildemesumlverBarraceketParenthesisPartialDcyfrhiilusMinusoincareplanepfrecedesEqualSlantEqualTildeimeoductportionalscriQUOTfropfscrRBarrEGacutengrrtlcaronedilyeverseElementquilibriumUpEquilibriumfrhoightAngleBracketrrowBarLeftArrowCeilingDoubleBracketwnTeeVectorVectorBarFloorTeeArrowVectorriangleBarEqualUpDownVectorTeeVectorVectorBarVectorBararrowopfundImpliesrightarrowscrhuleDelayedSHCHcycyOFTcyacutecaronedilircyfrhortDownArrowLeftArrowRightArrowUpArrowigmamallCircleopfqrtuareIntersectionSubsetEqualpersetEqualUnionscrtarubsetEqualcceedsEqualSlantEqualTildehThatmpersetEqualsetTHORNRADESHcycyabucaronedilyfrhereforetaickSpacenSpaceildeEqualFullEqualTildeopfripleDotscrtrokUacuterrocirbrcyevecircydblacfrgravemacrnderBarraceketParenthesisionPlusogonpfpArrowBarDownArrowDownArrowEquilibriumTeeArrowarrowdownarrowperLeftArrowRightArrowsilonringscrtildeumlVDashbarcydashleerbarticalBarLineSeparatorTildeyThinSpacefropfscrvdashWcircedgefropfscrXfriopfscrYAcyIcyUcyacutecircyfropfscrumlZHcyacutecaronydoteroWidthSpacetafropfscraacutebrevecEdircuteyeligfrgravelefsymphphamacrlgpndanddslopevgelemsdaabcdefghrtvbdsphtzarrogonpfpEacireidosproxeqringscrtympeqtildeumlwconintintbNotackcongepsilonprimesimeqrveewedgebrktbrkcongydquoecausemptyvpsirnoutahweenfrigcapircupodotplustimessqcuptartriangledownupuplusveewedgekarowlacklozengesquaretriangledownleftrightnkk12434ocknequivotopfttomwtiexDLRlrHDUduULRlrVHLRhlrboxdLRlrhDUduminusplustimesuLRlrvHLRhlrprimerevevbarscremiimeolbhsubulletmpEeqcacutepandbrcupcapupdotsretoncapsronedilircupssmdotedilmptyvnterdotfrhcyeckmarkiirEceqlearrowleftrightdRSastcircdashefnintmidscirlubsuitoloneqmmatpfnlementxesngdotintpfrodysrrarrossscrubepetdotudarrlreprsclarrppbrcapcapupdotorsrarrmlyeqprecsuccveewedgerenvearrowleftrightveewedwconintintylctydArrHaraggerlethrrshvbkarowlaccaronydaggerrrotseqegltamptyvfishtrharlriamondsuitsegammasinvideontimesonxjcylcornropollarpfteqdotminusplussquareublebarwedgewnarrowdownarrowsharpoonleftrightrbkarowcornropscryoltroktdotrifuarrharwanglezcyigrarreDDototacutestercaronircolonydotefDotrgravesdotlinterslsdotmacrptysetvsp134ngspogonpfparsllussilonvqcircolonsimlantgtrlessualsestivDDvparslrDotarrscrdotimtahumlroxclistpectationonentialefallingdotseqcyemalefiligligligriligjliglatligtnsnofopfrallkvpartintrac123456823534584556878slownscrgElacutemmadpbrevecircydotelqqslantsccdotollesfrggimeljcylEajnEapproxeqqsimopfravescrimeltccirdotlParquestrapproxrrdoteqlessqlesslesssimvertneqqnEhArrairsplfmiltrdcyrcirwbarcirceartsuitlliprconfrksearowwarowoarrmthtokleftarrowrightarrowpfrbarscrlashtrokybullpheniacutecircyecyxclffrgraveiiintntnfinotajligmacrgelinepartthofpedncarefintieodottcalegersrcallarhkprodocygonpftaprodquestscrinEdotsvvtildeukcymljcircyfrmathopfscrercyukcykappavcedilyfrgreenhcyjcyopfscrlAarrrrtailBarrEgHaracuteemptyvgranmbdangdlepquorrbfsfshklpplsimtltailesbarrbrkracekkeslducaronedililubydcaquorrdharusharsheftarrowtailharpoondownupleftarrowsrightarrowsharpoonssquigarrowthreetimesgqqslantsccdotorgessapproxdoteqgtrqgtrgtrsimfishtloorrgEhardulblkjcylarrcornerhardtrimidotoustachenEapproxeqqsimoangrrbrkngleftarrowrightarrowmapstorightarrowoparrowleftrightparflustimeswastbarzengefparltrarrcornerhardmtrisaquocrhimegqbuortroktccirdothreeimeslarrquestrPariefurdsharuharvertneqqnEmDDotacrletesepstodownleftuprkercommaydasheasuredanglefrhoicrodastcirdotnusbdulcpdrnplusodelspfpscrtposultimapmapnGgtvLeftarrowrightarrowltvRightarrowVDashdashablacutengpEidosproxturalsbspumpecapronedilongdotupydasheArrarhkrowdotquivsearimxistsfrgEeqqslantssimtrhArrarrparisdvjcylArrEarrdreftarrowrightarrowqqslantsssimtriemidopftinEdotvabcnivabcparallelsltolintrcueeceqrArrarrcwightarrowtriesccueerhortmidparallelimeqmidparqsubepeubEeseteqqcceqpEeseteqqtglildelgrianglelefteqrightequmerospvDashHarrapdashgetinfinlArretrierArrtriesimwArrarhkrownearoSacutestcircydashblacivotsoldeligfcirrgonravethbarmintlarrcirrossinetmacregaicrondnusopfparerplusrarrderoffmigoforslopevscrlasholtildemesasumlvbarparallelsimltcyercntiodmilptenkfrhivmmatoneitchforkvlanckhkvusacirbcirdouemnsimtwomointintpfundrEapcueecapproxcurlyeqeqnapproxeqqsimsimimesnEapsimodfalarlinesurfptosimurelscriuncspqfrintopfprimescruaternionsintesteqotrAarrrrtailBarrHaraceutedicemptyvngdelequorrapbfscfshklpplsimtlwtailionalsbarrbrkracekkeslducaronedililubydcaldharquorshealinepartsctgfishtloorrhardulovightarrowtailharpoondownupleftarrowsharpoonsrightarrowssquigarrowthreetimesngsingdotseqlarrharmmoustachenmidoangrrbrkparflustimespargtpolintrarrsaquocrhqbuorthreeimesriefltriuluharxsacutebquocEaproncueedilircnEapsimpolintsimydotbeeArrarhkrowctmiswartminusnxtfrownharpchcyyortmidparallelyigmafvmdoteqgElEneplusrarrlarrmallsetminusshpeparslidletesoftcylbarpfpadesuitrqcapsupssubeseteqpesetequareffrarrscretmnmiletarftarfraightepsilonphinsubEdotedotmultnEeplusrarrseteqqneqqimubpccapproxcurlyeqeqnapproxeqqsimsimmngp123EdotsubedothsolublarrmultnEeplusseteqqneqqimubpwArrarhkrownwarzligtargetubrkcaronedilydotelrecfrhere4foretasymvickapproxsimnspkapsimornildemesbardntoeapbotcirforksaprimeradeiangledownlefteqqrighteqdoteminusplussbtimepeziumscryhcytrokwixtoheadleftarrowrightarrowuArrHaracuterrbrcyevecircydarrblacharfishtrgraveharlrblklcornerroptrimacrlogonpfparrowdownarrowharpoonleftrightlussihlonuparrowsrcornerropingtriscrtdotilderifuarrmlwanglevArrBarvDashangrtrepsilonkappanothingphiiroptorhosigmaubsetneqqpsetneqqthetariangleleftrightcydasheebareqlliprbartfrltrinsubpopfproprtriscrubnEepnEezigzagwcircedbargeqierpfropfpreathscrxcapircupdtrifrhArrarrilArrarrmapnisodotpflustimerArrarrscrqcupuplustriveewedgeyacuteycircyenfricyopfscrucymlzacutecaronydoteetrftafrhcyigrarropfscrwjnjC(D%D($(D'%$$ED($'$'$%$'%E$/D'$F%'D(D&#,%%&&$%$)%+%%$E$F$'$&$(#'D&$(%$&4%($(E'%&%($&$)%*$%$%$+)()')($:&5-($'($%*&&&/%%&)%@$'$F$%&&#%%)$&$&$&$(%%%&$(%$$%&%$E$2.&0,.(.(&'%.$F%$&&&(%6)&+*),---&*/1---)-.&)*+,).%*,&,*'('2+,+)1&'1,)2&'&*('($F%'#&D%D($(E&%$$&$ED($)$'%1(2$'%E$)$'((&+$&%%$%D&$(%-#&$E$3)2$F%'%+$&#'D$$'($$($(%&%$$&$E$$$F$./'*,***'*-*($F$$#)$'%$$'$%$.$&%/$&%'$.'(#'$'$&D(D'%$$&$%D($$%&&*%($%&('+%/,($'%E%%$&$($'E%#(%$$E$F$F%'$'#'$&$'$(%$$E$F$F#'D$$(%'%%%+%%$(%'%$$2(',&,-'*'0).+)1&'('-,)'&*(*)(*/&/('/),))/&')-&'('-%1','*'''-'($E$$%+$($/+-'-',+-'-%E%/(-$&%$%'$$#&$%$-%*$E$+$F$&$$#'$($(%'%$$5+-.)+0%5)+%($E$)%1%%%$&,'(&4&*''+H'(&*-(-L-J-'-M-(&O*H&/2F2((%*(***G*M*(&W,K&+.H.-&1'/3F3(&O2(.I4('H,(().H.-.H(I.(&(+(+,+(&.$FD($$#(D(D'%$$($ED($'%&%($F$6,($$$FE'D(&&D&$)('+&'.#+$%$E$%$$$+$/%%$$%)+(+-+(%&%(&*-%$F%$C'$E$&$F#(D%$(%%%%'%$(%'%$$$%/+-*0$%$%$3)'-&-,(*(0*.,)2&(((&+(+))*0&0((/*,*)0&().&(($&%-$-$&%$$-#)%%$($($$%'%'%&%$$E$0(,(-(*$'$-$F$&%')/))/(+)1()($F$&$%&&)(%)+(+-+(&(%$%$&(+(&&C($'$'%%$%%$$(%'%$$E$+&%%K&)$'(((,(($F$+$F%'C)%%''$'&&D'%$$($ED($'$*)',&(.%&('$'%E$)*&*,%,%.%&((%(%,%/(-%%'&$'$F$(D&#($&$%$'($$%%'&$'*+'+,+(&-$E$F$F$(#($'$E$F$F#F$$$F$F#'$&$&D($'%$$E$F$F$&#'$($(%$$&$0%%$%$&$FC)$($$%D%$E&E&%$D'$$%DD($)&%%&$'&%E$$%&&&$&(&$%$&$&%&&)%*$*$*$*$*$*$*$&%(%*$&&'$&'$'%E$$%$%'%$%%%%%')%D'$F%$%&(%D(D&$*%&#'$*'*'('&*%%'&&)%$&''$'%$$'$()$%(%&%'%%&$&'$E$('&'%&''''(&('&&/.%&(&&&($($.()(+0'0'0(&%%&'$&%%&$E&G%%$F%$&&%'%&'$'$'$&$'$'$'$'$&%'$'$'$&$'$'$'$'$'$'$&&&%'$'$'$&$'$'$'$'$&(&'&(&%'$'$'$&$'$'$'$'$'$'$$($'E'$F%&%%'$%%'$''$&'%%%'$'$($#)%$&&&(&&'%&&&D%&&%$'&&E'%&%&(%$&D'%(E%'($E$&%&('%$$%&$&$'%'..()%*$*&*'*'&$&(&&&'$'(&$'($)$%&($&$'%'))&%%'&&&%E&&F$'%$'%&$F%%'$&$'$$'$))$%&&%%')$%$&(&&'%&&&%&D%')$&+*'(&((F&&.-(%&%&$*%&$(#'$&$(%'%%%%'$$)%&$(%$$$%(&%%(D%%&%($(%D$''$$&'&*''$%$%(%&%$F&)*&&$&$(&&$(%E%$&%(&&(&'&)%/%*'-'..($*%'&&$F&$%%%'$'%%'$$'%&$)$&%)#(%%D(%'$(%%G$%'%$$&$$$'%D$$E'%$&&$$%)%$%$&&$'%&(&($%%'%($$%%%$'%E$&'%%&%%'&'$$(&'%&&**'%'&&&%(%%)$'%&$&%&%%$%E$D&%%$&%&%,&,#0$%$($(%&&&%D$'$G$&%&%&$&$F%'&$'$$*D(($H$($($($'%($G%($($'%'%($'%&%%&$F#%%$$(%&($%$$($'%$$&$$%$%$&$&(%$&%&&)$*$&D'%$E$$%$$'$&$$%$%$%$$%%%''%$&$'$%&$F$'$&%%'$'$D$%%&%%&%'%(%*'%&&&)((&'&&$K%E#'$(%%%'%'&$'&'$$&$'$()&%'%'$E$*&($'%'%.'-%E%'$F%'%'$(%'C)$$E&%$$&E&$%%DD($$%'&%%'%&$'$'&%''''&%%%%&$$%'%&(&%'%$&&&(''&(&'$&%&%E%%$'D($F%%'$'&'$($'$$$%'$'E%#(%$$E$'$F$F%'$'#(($$(%$$E$($&$&$F$F#(%%%'$'$$%$$&$(%)%'%'%%'$'%%$E&%%'$(%'%'%'%'%'&'%%$&&&$'D$'%&%'($&%'&)$$(%'&%%%%$$&%&($%(&(%%$$%*,''..%'-'-1$,+,-'-%$%$&$&(%$&%&&)$*$&D'%&*'&'()''&'&$(%'%D$$%$$''$($%&$&$$%&%)%'%&$(%')'$%%%''%$&$'$%&$'&%%&%.+-')'-%.,(%&&D&&%(%'&&%$&'&$$&'%$'%)%&($%$%&$(%E%$%%'$'$%%&%($%'D$%%&%%&%'%'%'%(%'&$'$'$$*&'$K%E#(D&%%&$'&%$&&)')')%%'$(%$$'$/$E$%D'%$&&&&F&%&($($)$$&%%$($(%E$$$F%'$$%)%&#F%D&D$,(-%D%D&D$-$(%'$'%'%E%$&D&E&%&'%&(%*$D&%F(D$&&&%'%&(F%%%$$'$$%&%''$(%%F%'%'&E%')$$E$E%$&$'D'H&D%&%$&$$'%&%&$$%$&$%$$&$'%D%&%%%$&*(-&$'D'H&D'$%&%$&%($$&$FE$&%(D(F(%)$)$&%(%)$)$$&'('E'D%(%$&&&D'$(E$'%&(D(D%,%&($$%&&&D&D%*)+%%'$($%&%&%((%%%'D'$'F*%,D&%(E&$'D'$'F*%,D$&E'%%%.0%,(1%$$%$&&&%$(%'%E%'%E&D%(%'&D&D'F%'&G%F$'%''$(%%'#%D(%%$&G$%$$'%'%%%%%'$'$'%D$&E'%$$'%$$&$'%&&'%&%$$'%&%(&$&&$F$&%&%&$$%&%$&%(%F$F$%'%%%(%$$&E'%%D(&&)%D&$'#&F$''&&'$&$$%$(&&&&&$&'$E$%&$%'%&$$%*%$$()$'%%%'''$'&'%($'$G%'&'&$$$*%EE&$$%$%%%&%$&$')'*'%'*(&(&'&%&($%%&%&&%%&(''''&$'%%&%'$F%$$(#F$&$F$($F$-'&%&(%E%#(%%%'$'$&$F&&%&%)%%'$'$'%E&%%'%'$(%'$'%'%'%'%'&'%'$%'&%('$'%&%'($&%'&)$$(%'&%%%%$$&%(%&($%%$&'&'''$%%E$$(%'%D$''$($%$&$$,-'(./%(-,+(.(-(-%%%-$'%&%$$()'$'$'&%%&%&&D&&%($&'%%)$'$(%E%$%%&%($$(%'%%'$'$''$)$$#)$'$$%$%%&&%&%$&&%&%%&%&&%)%&%$$&'$'$$'%''$(%E%%%%'%)'$%%$E&&$'%'&$%)(+E$$'($($%$&&&$'$&$'$&$'$&%&'&'$'$/&&%)%%&%%$&$'D$(%$&$'%%E$()&&$$'(D&%(D%&($(&+%'$($(&+%%$&&($&$$'$F%'%'%'$&'$%0+&&%$%&$&&&$'&&'&%'$&'&'&&)%+$)&,$'%'%($%%')'*'%'*(&(&'&%$%%%$F$F$F$&$&&'&&$'&&'(%&'&'&%'$&'&&)%+$)&,$'%'%($$'%''$(%%'D'#)%$$&$(%'%$$&$($E$(('&%(&($%,(&&&%&&&E&$'E&($)%($%%$&%$&&&&&D'&%%$($'%)+'+'/%+$+(0%&&&$&(&'&%&'%)$F&$%&%'$'%1*-#'$&D(%%$'&&D'%$$'%'%&$(%DD($''$%&$()%&&%&$'E$$'%E$)%,%.,(%&%%'$'&%+$()%&&%&%&$F$'%'%%'$$'E%$)#'$&'$$'$(%+&(&*&&'$'(&$'%&('K/D(J/D&('..($%$'$%&&&%%'%'&$$E$'$G'D$F$'$'$F%G(D&F(D$)#($(&%($%'$E$F$$$$%'$F#'%&%%$'$E$'%&$$$'%&$&$&$'%E&&%'$'%&$F%'$(%&$&$(C)&$$'%$D%$E$&$F$F$&E%#)$(%$$&$(%%$E$&$)$F$F$%%%0@0000H8H40H000047P00P@001000@0B0HP@:H9T8P000LB8d@800@I0<110000QQ8400P10030005940@410020000Q02000@0200000@P0101@8000440400000000808000000000@00000000P`0000000040400@0004<000000000008000030000000000P020T400020@0@00000000000000000000000000P0000000400400000400220080000100000000000000000P000000000000P000000@00402000000000@00000000000000000000040000000000000", "Æ&ÁĂÂА𝔄ÀΑĀ⩓Ą𝔸⁡Å𝒜≔ÃÄ∖⫧⌆Б∵ℬΒ𝔅𝔹˘ℬ≎Ч©Ć⋒ⅅℭČÇĈ∰Ċ¸·ℭΧ⊙⊖⊕⊗∲”’∷⩴≡∯∮ℂ∐∳⨯𝒞⋓≍ⅅ⤑ЂЅЏ‡↡⫤ĎД∇Δ𝔇´˙˝`˜⋄ⅆ𝔻¨⃜≐∯¨⇓⇐⇔⫤⟸⟺⟹⇒⊨⇑⇕∥↓⤓⇵̑⥐⥞↽⥖⥟⇁⥗⊤↧⇓𝒟ĐŊÐÉĚÊЭĖ𝔈È∈Ē◻▫Ę𝔼Ε⩵≂⇌ℰ⩳ΗË∃ⅇФ𝔉◼▪𝔽∀ℱℱЃ>ΓϜĞĢĜГĠ𝔊⋙𝔾≥⋛≧⪢≷⩾≳𝒢≫Ъˇ^Ĥℌℋℍ─ℋĦ≎≏ЕĲЁÍÎИİℑÌℑĪⅈ⇒∬∫⋂⁣⁢Į𝕀ΙℐĨІÏĴЙ𝔍𝕁𝒥ЈЄХЌΚĶК𝔎𝕂𝒦Љ<ĹΛ⟪ℒ↞ĽĻЛ⟨←⇤⇆⌈⟦⥡⇃⥙⌊↔⥎⊣↤⥚⊲⧏⊴⥑⥠↿⥘↼⥒⇐⇔⋚≦≶⪡⩽≲𝔏⋘⇚Ŀ⟵⟷⟶⟸⟺⟹𝕃↙↘ℒ↰Ł≪⤅М ℳ𝔐∓𝕄ℳΜЊŃŇŅН​​​​≫≪\n𝔑⁠\xA0ℕ⫬≢≭∦∉≠≂̸∄≯≱≧̸≫̸≹⩾̸≵≎̸≏̸⋪⧏̸⋬≮≰≸≪̸⩽̸≴⪢̸⪡̸⊀⪯̸⋠∌⋫⧐̸⋭⊏̸⋢⊐̸⋣⊂⃒⊈⊁⪰̸⋡≿̸⊃⃒⊉≁≄≇≉∤𝒩ÑΝŒÓÔОŐ𝔒ÒŌΩΟ𝕆“‘⩔𝒪ØÕ⨷Ö‾⏞⎴⏜∂П𝔓ΦΠ±ℌℙ⪻≺⪯≼≾″∏∷∝𝒫Ψ\"𝔔ℚ𝒬⤐®Ŕ⟫↠⤖ŘŖРℜ∋⇋⥯ℜΡ⟩→⇥⇄⌉⟧⥝⇂⥕⌋⊢↦⥛⊳⧐⊵⥏⥜↾⥔⇀⥓⇒ℝ⥰⇛ℛ↱⧴ЩШЬŚ⪼ŠŞŜС𝔖↓←→↑Σ∘𝕊√□⊓⊏⊑⊐⊒⊔𝒮⋆⋐⋐⊆≻⪰≽≿∋∑⋑⊃⊇⋑Þ™ЋЦ	ΤŤŢТ𝔗∴Θ   ∼≃≅≈𝕋⃛𝒯ŦÚ↟⥉ЎŬÛУŰ𝔘ÙŪ_⏟⎵⏝⋃⊎Ų𝕌↑⤒⇅↕⥮⊥↥⇑⇕↖↗ϒΥŮ𝒰ŨÜ⊫⫫В⊩⫦⋁‖‖∣|❘≀ 𝔙𝕍𝒱⊪Ŵ⋀𝔚𝕎𝒲𝔛Ξ𝕏𝒳ЯЇЮÝŶЫ𝔜𝕐𝒴ŸЖŹŽЗŻ​Ζℨℤ𝒵áă∾∾̳∿â´аæ⁡𝔞àℵℵαā⨿&∧⩕⩜⩘⩚∠⦤∠∡⦨⦩⦪⦫⦬⦭⦮⦯∟⊾⦝∢Å⍼ą𝕒≈⩰⩯≊≋'≈≊å𝒶*≈≍ãä∳⨑⫭≌϶‵∽⋍⊽⌅⌅⎵⎶≌б„∵∵⦰϶ℬβℶ≬𝔟⋂◯⋃⨀⨁⨂⨆★▽△⨄⋁⋀⤍⧫▪▴▾◂▸␣▒░▓█=⃥≡⃥⌐𝕓⊥⊥⋈╗╔╖╓═╦╩╤╧╝╚╜╙║╬╣╠╫╢╟⧉╕╒┐┌─╥╨┬┴⊟⊞⊠╛╘┘└│╪╡╞┼┤├‵˘¦𝒷⁏∽⋍\\⧅⟈••≎⪮≏≏ć∩⩄⩉⩋⩇⩀∩︀⁁ˇ⩍čçĉ⩌⩐ċ¸⦲¢·𝔠ч✓✓χ○⧃ˆ≗↺↻®Ⓢ⊛⊚⊝≗⨐⫯⧂♣♣:≔≔,@∁∘∁ℂ≅⩭∮𝕔∐©℗↵✗𝒸⫏⫑⫐⫒⋯⤸⤵⋞⋟↶⤽∪⩈⩆⩊⊍⩅∪︀↷⤼⋞⋟⋎⋏¤↶↷⋎⋏∲∱⌭⇓⥥†ℸ↓‐⊣⤏˝ďдⅆ‡⇊⩷°δ⦱⥿𝔡⇃⇂⋄⋄♦♦¨ϝ⋲÷÷⋇⋇ђ⌞⌍$𝕕˙≐≑∸∔⊡⌆↓⇊⇃⇂⤐⌟⌌𝒹ѕ⧶đ⋱▿▾⇵⥯⦦џ⟿⩷≑é⩮ě≖ê≕эėⅇ≒𝔢⪚è⪖⪘⪙⏧ℓ⪕⪗ē∅∅∅   ŋ ę𝕖⋕⧣⩱εεϵ≖≕≂⪖⪕=≟≡⩸⧥≓⥱ℯ≐≂ηðë€!∃ℰⅇ≒ф♀ﬃﬀﬄ𝔣ﬁfj♭ﬂ▱ƒ𝕗∀⋔⫙⨍½⅓¼⅕⅙⅛⅔⅖¾⅗⅜⅘⅚⅝⅞⁄⌢𝒻≧⪌ǵγϝ⪆ğĝгġ≥⋛≥≧⩾⩾⪩⪀⪂⪄⋛︀⪔𝔤≫⋙ℷѓ≷⪒⪥⪤≩⪊⪊⪈⪈≩⋧𝕘`ℊ≳⪎⪐>⪧⩺⋗⦕⩼⪆⥸⋗⋛⪌≷≳≩︀≩︀⇔ ½ℋъ↔⥈↭ℏĥ♥♥…⊹𝔥⤥⤦⇿∻↩↪𝕙―𝒽ℏħ⁃‐í⁣îие¡⇔𝔦ìⅈ⨌∭⧜℩ĳīℑℐℑı⊷Ƶ∈℅∞⧝ı∫⊺ℤ⊺⨗⨼ёį𝕚ι⨼¿𝒾∈⋹⋵⋴⋳∈⁢ĩіïĵй𝔧ȷ𝕛𝒿јєκϰķк𝔨ĸхќ𝕜𝓀⇚⇐⤛⤎≦⪋⥢ĺ⦴ℒλ⟨⦑⟨⪅«←⇤⤟⤝↩↫⤹⥳↢⪫⤙⪭⪭︀⤌❲{[⦋⦏⦍ľļ⌈{л⤶“„⥧⥋↲≤←↢↽↼⇇↔⇆⇋↭⋋⋚≤≦⩽⩽⪨⩿⪁⪃⋚︀⪓⪅⋖⋚⪋≶≲⥼⌊𝔩≶⪑↽↼⥪▄љ≪⇇⌞⥫◺ŀ⎰⎰≨⪉⪉⪇⪇≨⋦⟬⇽⟦⟵⟷⟼⟶↫↬⦅𝕝⨭⨴∗_◊◊⧫(⦓⇆⌟⇋⥭‎⊿‹𝓁↰≲⪍⪏[‘‚ł<⪦⩹⋖⋋⋉⥶⩻⦖◃⊴◂⥊⥦≨︀≨︀∺¯♂✠✠↦↦↧↤↥▮⨩м—∡𝔪℧µ∣*⫰·−⊟∸⨪⫛…∓⊧𝕞∓𝓂∾μ⊸⊸⋙̸≫⃒≫̸⇍⇎⋘̸≪⃒≪̸⇏⊯⊮∇ń∠⃒≉⩰̸≋̸ŉ≉♮♮ℕ\xA0≎̸≏̸⩃ňņ≇⩭̸⩂н–≠⇗⤤↗↗≐̸≢⤨≂̸∄∄𝔫≧̸≱≱≧̸⩾̸⩾̸≵≯≯⇎↮⫲∋⋼⋺∋њ⇍≦̸↚‥≰↚↮≰≦̸⩽̸⩽̸≮≴≮⋪⋬∤𝕟¬∉⋹̸⋵̸∉⋷⋶∌∌⋾⋽∦∦⫽⃥∂̸⨔⊀⋠⪯̸⊀⪯̸⇏↛⤳̸↝̸↛⋫⋭⊁⋡⪰̸𝓃∤∦≁≄≄∤∦⋢⋣⊄⫅̸⊈⊂⃒⊈⫅̸⊁⪰̸⊅⫆̸⊉⊃⃒⊉⫆̸≹ñ≸⋪⋬⋫⋭ν#№ ⊭⤄≍⃒⊬≥⃒>⃒⧞⤂≤⃒<⃒⊴⃒⤃⊵⃒∼⃒⇖⤣↖↖⤧Ⓢó⊛⊚ôо⊝ő⨸⊙⦼œ⦿𝔬˛ò⧁⦵Ω∮↺⦾⦻‾⧀ōωο⦶⊖𝕠⦷⦹⊕∨↻⩝ℴℴªº⊶⩖⩗⩛ℴø⊘õ⊗⨶ö⌽∥¶∥⫳⫽∂п%.‰⊥‱𝔭φϕℳ☎π⋔ϖℏℎℏ+⨣⊞⨢∔⨥⩲±⨦⨧±⨕𝕡£≺⪳⪷≼⪯≺⪷≼⪯⪹⪵⋨≾′ℙ⪵⪹⋨∏⌮⌒⌓∝∝≾⊰𝓅ψ 𝔮⨌𝕢⁗𝓆ℍ⨖?≟\"⇛⇒⤜⤏⥤∽̱ŕ√⦳⟩⦒⦥⟩»→⥵⇥⤠⤳⤞↪↬⥅⥴↣↝⤚∶ℚ⤍❳}]⦌⦎⦐řŗ⌉}р⤷⥩””↳ℜℛℜℝ▭®⥽⌋𝔯⇁⇀⥬ρϱ→↣⇁⇀⇄⇌⇉↝⋌˚≓⇄⇌‏⎱⎱⫮⟭⇾⟧⦆𝕣⨮⨵)⦔⨒⇉›𝓇↱]’’⋌⋊▹⊵▸⧎⥨℞ś‚≻⪴⪸š≽⪰şŝ⪶⪺⋩⨓≿с⋅⊡⩦⇘⤥↘↘§;⤩∖∖✶𝔰⌢♯щш∣∥­σςς∼⩪≃≃⪞⪠⪝⪟≆⨤⥲←∖⨳⧤∣⌣⪪⪬⪬︀ь/⧄⌿𝕤♠♠∥⊓⊓︀⊔⊔︀⊏⊑⊏⊑⊐⊒⊐⊒□□▪▪→𝓈∖⌣⋆☆★ϵϕ¯⊂⫅⪽⊆⫃⫁⫋⊊⪿⥹⊂⊆⫅⊊⫋⫇⫕⫓≻⪸≽⪰⪺⪶⋩≿∑♪⊃¹²³⫆⪾⫘⊇⫄⟉⫗⥻⫂⫌⊋⫀⊃⊇⫆⊋⫌⫈⫔⫖⇙⤦↙↙⤪ß⌖τ⎴ťţт⃛⌕𝔱∴∴θϑϑ≈∼ ≈∼þ˜×⊠⨱⨰∭⤨⊤⌶⫱𝕥⫚⤩‴™▵▿◃⊴≜▹⊵◬≜⨺⨹⧍⨻⏢𝓉цћŧ≬↞↠⇑⥣ú↑ўŭûу⇅ű⥮⥾𝔲ù↿↾▀⌜⌜⌏◸ū¨ų𝕦↑↕↿↾⊎υϒυ⇈⌝⌝⌎ů◹𝓊⋰ũ▵▴⇈ü⦧⇕⫨⫩⊨⦜ϵϰ∅ϕϖ∝↕ϱς⊊︀⫋︀⊋︀⫌︀ϑ⊲⊳в⊢∨⊻≚⋮||𝔳⊲⊂⃒⊃⃒𝕧∝⊳𝓋⫋︀⊊︀⫌︀⊋︀⦚ŵ⩟∧≙℘𝔴𝕨℘≀≀𝓌⋂◯⋃▽𝔵⟺⟷ξ⟸⟵⟼⋻⨀𝕩⨁⨂⟹⟶𝓍⨆⨄△⋁⋀ýяŷы¥𝔶ї𝕪𝓎юÿźžзżℨζ𝔷ж⇝𝕫𝓏‍‌"], Ln = 2654435761, Rn = 2246822507, zn = 1024, Bn = (() => {
	let e = /* @__PURE__ */ new Uint8Array(128);
	for (let t = 48; t <= 57; t++) e[t] = t - 47;
	for (let t = 65; t <= 90; t++) e[t] = t - 54;
	for (let t = 97; t <= 122; t++) e[t] = t - 60;
	return e;
})();
function Vn(e, t, n) {
	return e.charCodeAt(t) << 25 | e.charCodeAt(t + 1) << 18 | e.charCodeAt(t + n - 2) << 11 | Bn[e.charCodeAt(t + n - 1)] << 5 | n;
}
function Hn(e, t) {
	return (e * 3 << 3 ^ t) & 1023;
}
function Un(e, t) {
	return (Math.imul(e, Ln) >>> 16) * t >>> 16;
}
function Wn(e, t) {
	return (Math.imul(e, Rn) >>> 16) * t >>> 16;
}
function Gn(e) {
	let [t, n] = e, r = t.charCodeAt(0) - 48 << 6 | t.charCodeAt(1) - 48, i = t.charCodeAt(2) - 48 << 6 | t.charCodeAt(3) - 48, a = t.charCodeAt(4) - 48 << 6 | t.charCodeAt(5) - 48, o = 6 + i, s = o + 2 * r, c = 2 * a, l = new Int32Array(c), u = new Uint16Array(c), d = new Uint16Array(c), f = new Uint32Array(zn), p = /* @__PURE__ */ new Map(), m = [], h = "", g = 6, _ = 0;
	for (let e = 0; e < r; e++) {
		let n = t.charCodeAt(o + 2 * e) - 35, r = t.charCodeAt(o + 2 * e + 1) - 35, i = n & 31, c = i + (r & 31), v = (r >> 5) + 1;
		h = h.slice(0, i) + t.slice(g, g + c - i), g += c - i;
		let y = Vn(h, 0, c), b = 2 * (t.charCodeAt(s + Math.floor(e / 6)) - 48 & 1 << e % 6 ? Wn : Un)(y, a);
		if (l[b] !== 0 && (b += 1), l[b] = y, c > 4) {
			let e = h.slice(2, c - 2), t = p.get(e);
			if (t === void 0) {
				p.set(e, m.length), u[b] = m.length;
				for (let t = 0; t < e.length; t += 2) m.push(e.charCodeAt(t) | e.charCodeAt(t + 1) << 16);
			} else u[b] = t;
		}
		let x = Hn(h.charCodeAt(0), h.charCodeAt(1));
		f[x] |= c <= 16 ? 1 << c - 2 : 32768, n & 32 && (f[x] |= 1 << c - 2 + 16), d[b] = _ << 2 | v - 1 | (n & 32) >> 4, _ += v;
	}
	return {
		keys: l,
		buckets: a,
		slotMidOff: u,
		slotValue: d,
		values: n,
		lengthBits: f,
		middles: new Uint32Array(m)
	};
}
// node_modules/.pnpm/entities@9.0.0/node_modules/entities/dist/decode.js
var Kn = 35, qn = 59, Jn = 61, Yn = 48, Xn = 97, Zn = 120, Qn = 65, $n = 32;
function er(e) {
	return e - Yn >>> 0 <= 9;
}
function tr(e) {
	return er(e) || (e | $n) - Xn >>> 0 <= 25;
}
function nr(e) {
	return e === Jn || tr(e);
}
var rr;
(function(e) {
	e[e.Legacy = 0] = "Legacy", e[e.Strict = 1] = "Strict", e[e.Attribute = 2] = "Attribute";
})(rr ||= {});
var ir = /* #__PURE__ */ Gn(In), ar = ir.keys, or = ir.buckets, sr = ir.slotMidOff, cr = ir.lengthBits, lr = ir.middles, ur = ir.slotValue, dr = ir.values;
function fr(e, t, n) {
	let r = e.charCodeAt(t), i = e.charCodeAt(t + 1), a = e.charCodeAt(t + n - 2), o = e.charCodeAt(t + n - 1);
	if ((r | i | a | o) > 127) return -1;
	let s = r << 25 | i << 18 | a << 11 | Bn[o] << 5 | n, c = 2 * ((Math.imul(s, Ln) >>> 16) * or >>> 16);
	for (let r = 0;; r++) {
		if (ar[c] === s && (n <= 4 || pr(c, e, t, n))) return c;
		if (ar[c + 1] === s && (n <= 4 || pr(c + 1, e, t, n))) return c + 1;
		if (r === 1) return -1;
		c = 2 * ((Math.imul(s, Rn) >>> 16) * or >>> 16);
	}
}
function pr(e, t, n, r) {
	let i = sr[e], a = n + 2, o = n + r - 2;
	for (; a + 1 < o;) {
		if ((t.charCodeAt(a) | t.charCodeAt(a + 1) << 16) !== lr[i++]) return !1;
		a += 2;
	}
	return a === o || t.charCodeAt(a) === (lr[i] & 65535);
}
var mr = /* #__PURE__ */ (() => {
	let e = (/* @__PURE__ */ new Uint8Array(128)).fill(255);
	for (let t = 0; t < 10; t++) e[Yn + t] = t;
	for (let t = 0; t < 6; t++) e[Qn + t] = t + 10, e[Xn + t] = t + 10;
	return e;
})();
function hr(e, t, n) {
	let r = cr[Hn(e.charCodeAt(t), e.charCodeAt(t + 1))] >>> 16 & 31;
	for (; r !== 0;) {
		let i = 31 - Math.clz32(r);
		if (r ^= 1 << i, i + 2 > n) continue;
		let a = fr(e, t, i + 2);
		if (a >= 0 && ur[a] & 2) return a << 3 | i + 2;
	}
	return -1;
}
function gr(e, t, n) {
	let r = e.slice(t, t + 32).indexOf(";");
	if (r - 2 >>> 0 <= 29) {
		let n = fr(e, t, r);
		if (n >= 0) return n << 6 | r + 1;
	}
	if (n !== rr.Strict) {
		let r = hr(e, t, Math.min(31, e.length - t));
		if (r >= 0) {
			let i = r & 7;
			if (n !== rr.Attribute || t + i >= e.length || !nr(e.charCodeAt(t + i))) return r >> 3 << 6 | i;
		}
	}
	return -1;
}
var _r = 0, vr = 1, yr = 2, br = 3, xr = 4, Sr = class {
	emitCodePoint;
	errors;
	state = _r;
	consumed = 1;
	result = 0;
	decodeMode = rr.Strict;
	replaceNumericCodePoint = Fn;
	constructor(e, t) {
		this.emitCodePoint = e, this.errors = t;
	}
	stateNumericStart(e, t) {
		return t >= e.length ? -1 : (e.charCodeAt(t) | $n) === Zn ? (this.state = br, this.consumed += 1, this.stateNumericHex(e, t + 1)) : (this.state = yr, this.stateNumericDecimal(e, t));
	}
	stateNumericHex(e, t) {
		let n = e.length, { result: r, consumed: i } = this, a = t;
		for (; a < n;) {
			let t = e.charCodeAt(a), n = mr[t];
			if (n <= 15) r = r * 16 + n;
			else return this.result = r, this.consumed = i, this.emitNumericEntity(t, 3);
			i += 1, a += 1;
		}
		return this.result = r, this.consumed = i, -1;
	}
	stateNumericDecimal(e, t) {
		let n = e.length, { result: r, consumed: i } = this, a = t;
		for (; a < n;) {
			let t = e.charCodeAt(a) - Yn;
			if (t >>> 0 > 9) return this.result = r, this.consumed = i, this.emitNumericEntity(t + Yn, 2);
			r = r * 10 + t, i += 1, a += 1;
		}
		return this.result = r, this.consumed = i, -1;
	}
	emitNumericEntity(e, t) {
		if (this.consumed <= t) return this.errors?.absenceOfDigitsInNumericCharacterReference(this.consumed), 0;
		if (e === qn) this.consumed += 1;
		else if (this.decodeMode === rr.Strict) return 0;
		return this.emitCodePoint(this.replaceNumericCodePoint(this.result), this.consumed), this.errors && (e !== qn && this.errors.missingSemicolonAfterCharacterReference(), this.errors.validateNumericCharacterReference(this.result)), this.consumed;
	}
	startEntity(e) {
		this.decodeMode = e, this.state = _r, this.result = 0, this.consumed = 1;
	}
	write(e, t) {
		switch (this.state) {
			case _r: return e.charCodeAt(t) === Kn ? (this.state = vr, this.consumed += 1, this.stateNumericStart(e, t + 1)) : (this.state = xr, this.stateNamedEntity(e, t));
			case vr: return this.stateNumericStart(e, t);
			case yr: return this.stateNumericDecimal(e, t);
			case br: return this.stateNumericHex(e, t);
			default: return this.stateNamedEntity(e, t);
		}
	}
	end() {
		switch (this.state) {
			case xr: return this.endNamedEntity();
			case yr: return this.emitNumericEntity(0, 2);
			case br: return this.emitNumericEntity(0, 3);
			case vr: return this.errors?.absenceOfDigitsInNumericCharacterReference(this.consumed), 0;
			default: return 0;
		}
	}
}, Cr = class extends Sr {
	runLength = 0;
	nameBuffer = /* @__PURE__ */ new Uint8Array(32);
	emitSlot(e) {
		let t = ur[e], n = t >> 2;
		this.emitCodePoint(dr.charCodeAt(n), this.consumed), t & 1 && this.emitCodePoint(dr.charCodeAt(n + 1), this.consumed);
	}
	startEntity(e) {
		super.startEntity(e), this.runLength = 0;
	}
	stateNamedEntity(e, t) {
		let n = e.length;
		if (this.runLength === 0 && t + 17 <= n) {
			let r = cr[Hn(e.charCodeAt(t), e.charCodeAt(t + 1))];
			if (r & 32768 && t + 32 <= n) {
				let n = gr(e, t, this.decodeMode);
				if (n >= 0) {
					let r = n & 63;
					return this.consumed = r + 1, this.emitSlot(n >> 6), e.charCodeAt(t + r - 1) !== qn && this.errors?.missingSemicolonAfterCharacterReference(), this.consumed;
				}
				return 0;
			}
			let i = r & 32767;
			for (; i !== 0;) {
				let n = i & -i;
				i ^= n;
				let r = 33 - Math.clz32(n);
				if (e.charCodeAt(t + r) === qn) {
					let n = fr(e, t, r);
					if (n >= 0) return this.consumed = r + 2, this.emitSlot(n), this.consumed;
				}
			}
			if (!(r & 32768)) {
				if (this.decodeMode !== rr.Strict) {
					let n = hr(e, t, 31);
					if (n >= 0) {
						let r = n & 7, i = e.charCodeAt(t + r);
						return this.decodeMode === rr.Attribute && nr(i) ? 0 : (this.consumed = r + 1, this.emitSlot(n >> 3), this.errors?.missingSemicolonAfterCharacterReference(), this.consumed);
					}
				}
				return 0;
			}
		}
		let r = t, { runLength: i } = this, a = -1, o = Math.min(n, t + 32 - i);
		for (; r < o;) {
			let t = e.charCodeAt(r);
			if (!tr(t)) {
				a = t;
				break;
			}
			this.nameBuffer[i++] = t, r++;
		}
		if (a < 0 && i < 32) return this.runLength = i, -1;
		if (a === qn && i - 2 >>> 0 <= 29) {
			let e = wr(this.nameBuffer, i);
			if (e >= 0) return this.consumed = i + 2, this.emitSlot(e), this.consumed;
		}
		if (this.decodeMode !== rr.Strict && i >= 2) {
			let e = Er(this.nameBuffer, i);
			if (e >= 0) {
				let t = e & 7, n = t < i ? this.nameBuffer[t] : a;
				return this.decodeMode === rr.Attribute && nr(n) ? 0 : (this.consumed = t + 1, this.emitSlot(e >> 3), this.errors?.missingSemicolonAfterCharacterReference(), this.consumed);
			}
		}
		return 0;
	}
	endNamedEntity() {
		if (this.decodeMode === rr.Strict || this.runLength < 2) return 0;
		let e = Er(this.nameBuffer, this.runLength);
		return e < 0 || this.decodeMode === rr.Attribute && (e & 7) < this.runLength ? 0 : (this.consumed = (e & 7) + 1, this.emitSlot(e >> 3), this.errors?.missingSemicolonAfterCharacterReference(), this.consumed);
	}
};
function wr(e, t) {
	let n = e[0] << 25 | e[1] << 18 | e[t - 2] << 11 | Bn[e[t - 1]] << 5 | t, r = 2 * ((Math.imul(n, Ln) >>> 16) * or >>> 16);
	for (let i = 0;; i++) {
		if (ar[r] === n && (t <= 4 || Tr(r, e, t))) return r;
		if (ar[r + 1] === n && (t <= 4 || Tr(r + 1, e, t))) return r + 1;
		if (i === 1) return -1;
		r = 2 * ((Math.imul(n, Rn) >>> 16) * or >>> 16);
	}
}
function Tr(e, t, n) {
	let r = sr[e], i = 2, a = n - 2;
	for (; i + 1 < a;) {
		if ((t[i] | t[i + 1] << 16) !== lr[r++]) return !1;
		i += 2;
	}
	return i === a || t[i] === (lr[r] & 65535);
}
function Er(e, t) {
	let n = cr[Hn(e[0], e[1])] >>> 16 & 31;
	for (; n !== 0;) {
		let r = 31 - Math.clz32(n);
		if (n ^= 1 << r, r + 2 > t) continue;
		let i = wr(e, r + 2);
		if (i >= 0 && ur[i] & 2) return i << 3 | r + 2;
	}
	return -1;
}
// node_modules/.pnpm/parse5@8.1.1/node_modules/parse5/dist/common/html.js
var z;
(function(e) {
	e.HTML = "http://www.w3.org/1999/xhtml", e.MATHML = "http://www.w3.org/1998/Math/MathML", e.SVG = "http://www.w3.org/2000/svg", e.XLINK = "http://www.w3.org/1999/xlink", e.XML = "http://www.w3.org/XML/1998/namespace", e.XMLNS = "http://www.w3.org/2000/xmlns/";
})(z ||= {});
var Dr;
(function(e) {
	e.TYPE = "type", e.ACTION = "action", e.ENCODING = "encoding", e.PROMPT = "prompt", e.NAME = "name", e.COLOR = "color", e.FACE = "face", e.SIZE = "size";
})(Dr ||= {});
var Or;
(function(e) {
	e.NO_QUIRKS = "no-quirks", e.QUIRKS = "quirks", e.LIMITED_QUIRKS = "limited-quirks";
})(Or ||= {});
var B;
(function(e) {
	e.A = "a", e.ADDRESS = "address", e.ANNOTATION_XML = "annotation-xml", e.APPLET = "applet", e.AREA = "area", e.ARTICLE = "article", e.ASIDE = "aside", e.B = "b", e.BASE = "base", e.BASEFONT = "basefont", e.BGSOUND = "bgsound", e.BIG = "big", e.BLOCKQUOTE = "blockquote", e.BODY = "body", e.BR = "br", e.BUTTON = "button", e.CAPTION = "caption", e.CENTER = "center", e.CODE = "code", e.COL = "col", e.COLGROUP = "colgroup", e.DD = "dd", e.DESC = "desc", e.DETAILS = "details", e.DIALOG = "dialog", e.DIR = "dir", e.DIV = "div", e.DL = "dl", e.DT = "dt", e.EM = "em", e.EMBED = "embed", e.FIELDSET = "fieldset", e.FIGCAPTION = "figcaption", e.FIGURE = "figure", e.FONT = "font", e.FOOTER = "footer", e.FOREIGN_OBJECT = "foreignObject", e.FORM = "form", e.FRAME = "frame", e.FRAMESET = "frameset", e.H1 = "h1", e.H2 = "h2", e.H3 = "h3", e.H4 = "h4", e.H5 = "h5", e.H6 = "h6", e.HEAD = "head", e.HEADER = "header", e.HGROUP = "hgroup", e.HR = "hr", e.HTML = "html", e.I = "i", e.IMG = "img", e.IMAGE = "image", e.INPUT = "input", e.IFRAME = "iframe", e.KEYGEN = "keygen", e.LABEL = "label", e.LI = "li", e.LINK = "link", e.LISTING = "listing", e.MAIN = "main", e.MALIGNMARK = "malignmark", e.MARQUEE = "marquee", e.MATH = "math", e.MENU = "menu", e.META = "meta", e.MGLYPH = "mglyph", e.MI = "mi", e.MO = "mo", e.MN = "mn", e.MS = "ms", e.MTEXT = "mtext", e.NAV = "nav", e.NOBR = "nobr", e.NOFRAMES = "noframes", e.NOEMBED = "noembed", e.NOSCRIPT = "noscript", e.OBJECT = "object", e.OL = "ol", e.OPTGROUP = "optgroup", e.OPTION = "option", e.P = "p", e.PARAM = "param", e.PLAINTEXT = "plaintext", e.PRE = "pre", e.RB = "rb", e.RP = "rp", e.RT = "rt", e.RTC = "rtc", e.RUBY = "ruby", e.S = "s", e.SCRIPT = "script", e.SEARCH = "search", e.SECTION = "section", e.SELECT = "select", e.SOURCE = "source", e.SMALL = "small", e.SPAN = "span", e.STRIKE = "strike", e.STRONG = "strong", e.STYLE = "style", e.SUB = "sub", e.SUMMARY = "summary", e.SUP = "sup", e.TABLE = "table", e.TBODY = "tbody", e.TEMPLATE = "template", e.TEXTAREA = "textarea", e.TFOOT = "tfoot", e.TD = "td", e.TH = "th", e.THEAD = "thead", e.TITLE = "title", e.TR = "tr", e.TRACK = "track", e.TT = "tt", e.U = "u", e.UL = "ul", e.SVG = "svg", e.VAR = "var", e.WBR = "wbr", e.XMP = "xmp";
})(B ||= {});
var V;
(function(e) {
	e[e.UNKNOWN = 0] = "UNKNOWN", e[e.A = 1] = "A", e[e.ADDRESS = 2] = "ADDRESS", e[e.ANNOTATION_XML = 3] = "ANNOTATION_XML", e[e.APPLET = 4] = "APPLET", e[e.AREA = 5] = "AREA", e[e.ARTICLE = 6] = "ARTICLE", e[e.ASIDE = 7] = "ASIDE", e[e.B = 8] = "B", e[e.BASE = 9] = "BASE", e[e.BASEFONT = 10] = "BASEFONT", e[e.BGSOUND = 11] = "BGSOUND", e[e.BIG = 12] = "BIG", e[e.BLOCKQUOTE = 13] = "BLOCKQUOTE", e[e.BODY = 14] = "BODY", e[e.BR = 15] = "BR", e[e.BUTTON = 16] = "BUTTON", e[e.CAPTION = 17] = "CAPTION", e[e.CENTER = 18] = "CENTER", e[e.CODE = 19] = "CODE", e[e.COL = 20] = "COL", e[e.COLGROUP = 21] = "COLGROUP", e[e.DD = 22] = "DD", e[e.DESC = 23] = "DESC", e[e.DETAILS = 24] = "DETAILS", e[e.DIALOG = 25] = "DIALOG", e[e.DIR = 26] = "DIR", e[e.DIV = 27] = "DIV", e[e.DL = 28] = "DL", e[e.DT = 29] = "DT", e[e.EM = 30] = "EM", e[e.EMBED = 31] = "EMBED", e[e.FIELDSET = 32] = "FIELDSET", e[e.FIGCAPTION = 33] = "FIGCAPTION", e[e.FIGURE = 34] = "FIGURE", e[e.FONT = 35] = "FONT", e[e.FOOTER = 36] = "FOOTER", e[e.FOREIGN_OBJECT = 37] = "FOREIGN_OBJECT", e[e.FORM = 38] = "FORM", e[e.FRAME = 39] = "FRAME", e[e.FRAMESET = 40] = "FRAMESET", e[e.H1 = 41] = "H1", e[e.H2 = 42] = "H2", e[e.H3 = 43] = "H3", e[e.H4 = 44] = "H4", e[e.H5 = 45] = "H5", e[e.H6 = 46] = "H6", e[e.HEAD = 47] = "HEAD", e[e.HEADER = 48] = "HEADER", e[e.HGROUP = 49] = "HGROUP", e[e.HR = 50] = "HR", e[e.HTML = 51] = "HTML", e[e.I = 52] = "I", e[e.IMG = 53] = "IMG", e[e.IMAGE = 54] = "IMAGE", e[e.INPUT = 55] = "INPUT", e[e.IFRAME = 56] = "IFRAME", e[e.KEYGEN = 57] = "KEYGEN", e[e.LABEL = 58] = "LABEL", e[e.LI = 59] = "LI", e[e.LINK = 60] = "LINK", e[e.LISTING = 61] = "LISTING", e[e.MAIN = 62] = "MAIN", e[e.MALIGNMARK = 63] = "MALIGNMARK", e[e.MARQUEE = 64] = "MARQUEE", e[e.MATH = 65] = "MATH", e[e.MENU = 66] = "MENU", e[e.META = 67] = "META", e[e.MGLYPH = 68] = "MGLYPH", e[e.MI = 69] = "MI", e[e.MO = 70] = "MO", e[e.MN = 71] = "MN", e[e.MS = 72] = "MS", e[e.MTEXT = 73] = "MTEXT", e[e.NAV = 74] = "NAV", e[e.NOBR = 75] = "NOBR", e[e.NOFRAMES = 76] = "NOFRAMES", e[e.NOEMBED = 77] = "NOEMBED", e[e.NOSCRIPT = 78] = "NOSCRIPT", e[e.OBJECT = 79] = "OBJECT", e[e.OL = 80] = "OL", e[e.OPTGROUP = 81] = "OPTGROUP", e[e.OPTION = 82] = "OPTION", e[e.P = 83] = "P", e[e.PARAM = 84] = "PARAM", e[e.PLAINTEXT = 85] = "PLAINTEXT", e[e.PRE = 86] = "PRE", e[e.RB = 87] = "RB", e[e.RP = 88] = "RP", e[e.RT = 89] = "RT", e[e.RTC = 90] = "RTC", e[e.RUBY = 91] = "RUBY", e[e.S = 92] = "S", e[e.SCRIPT = 93] = "SCRIPT", e[e.SEARCH = 94] = "SEARCH", e[e.SECTION = 95] = "SECTION", e[e.SELECT = 96] = "SELECT", e[e.SOURCE = 97] = "SOURCE", e[e.SMALL = 98] = "SMALL", e[e.SPAN = 99] = "SPAN", e[e.STRIKE = 100] = "STRIKE", e[e.STRONG = 101] = "STRONG", e[e.STYLE = 102] = "STYLE", e[e.SUB = 103] = "SUB", e[e.SUMMARY = 104] = "SUMMARY", e[e.SUP = 105] = "SUP", e[e.TABLE = 106] = "TABLE", e[e.TBODY = 107] = "TBODY", e[e.TEMPLATE = 108] = "TEMPLATE", e[e.TEXTAREA = 109] = "TEXTAREA", e[e.TFOOT = 110] = "TFOOT", e[e.TD = 111] = "TD", e[e.TH = 112] = "TH", e[e.THEAD = 113] = "THEAD", e[e.TITLE = 114] = "TITLE", e[e.TR = 115] = "TR", e[e.TRACK = 116] = "TRACK", e[e.TT = 117] = "TT", e[e.U = 118] = "U", e[e.UL = 119] = "UL", e[e.SVG = 120] = "SVG", e[e.VAR = 121] = "VAR", e[e.WBR = 122] = "WBR", e[e.XMP = 123] = "XMP";
})(V ||= {});
var kr = /* @__PURE__ */ new Map([
	[B.A, V.A],
	[B.ADDRESS, V.ADDRESS],
	[B.ANNOTATION_XML, V.ANNOTATION_XML],
	[B.APPLET, V.APPLET],
	[B.AREA, V.AREA],
	[B.ARTICLE, V.ARTICLE],
	[B.ASIDE, V.ASIDE],
	[B.B, V.B],
	[B.BASE, V.BASE],
	[B.BASEFONT, V.BASEFONT],
	[B.BGSOUND, V.BGSOUND],
	[B.BIG, V.BIG],
	[B.BLOCKQUOTE, V.BLOCKQUOTE],
	[B.BODY, V.BODY],
	[B.BR, V.BR],
	[B.BUTTON, V.BUTTON],
	[B.CAPTION, V.CAPTION],
	[B.CENTER, V.CENTER],
	[B.CODE, V.CODE],
	[B.COL, V.COL],
	[B.COLGROUP, V.COLGROUP],
	[B.DD, V.DD],
	[B.DESC, V.DESC],
	[B.DETAILS, V.DETAILS],
	[B.DIALOG, V.DIALOG],
	[B.DIR, V.DIR],
	[B.DIV, V.DIV],
	[B.DL, V.DL],
	[B.DT, V.DT],
	[B.EM, V.EM],
	[B.EMBED, V.EMBED],
	[B.FIELDSET, V.FIELDSET],
	[B.FIGCAPTION, V.FIGCAPTION],
	[B.FIGURE, V.FIGURE],
	[B.FONT, V.FONT],
	[B.FOOTER, V.FOOTER],
	[B.FOREIGN_OBJECT, V.FOREIGN_OBJECT],
	[B.FORM, V.FORM],
	[B.FRAME, V.FRAME],
	[B.FRAMESET, V.FRAMESET],
	[B.H1, V.H1],
	[B.H2, V.H2],
	[B.H3, V.H3],
	[B.H4, V.H4],
	[B.H5, V.H5],
	[B.H6, V.H6],
	[B.HEAD, V.HEAD],
	[B.HEADER, V.HEADER],
	[B.HGROUP, V.HGROUP],
	[B.HR, V.HR],
	[B.HTML, V.HTML],
	[B.I, V.I],
	[B.IMG, V.IMG],
	[B.IMAGE, V.IMAGE],
	[B.INPUT, V.INPUT],
	[B.IFRAME, V.IFRAME],
	[B.KEYGEN, V.KEYGEN],
	[B.LABEL, V.LABEL],
	[B.LI, V.LI],
	[B.LINK, V.LINK],
	[B.LISTING, V.LISTING],
	[B.MAIN, V.MAIN],
	[B.MALIGNMARK, V.MALIGNMARK],
	[B.MARQUEE, V.MARQUEE],
	[B.MATH, V.MATH],
	[B.MENU, V.MENU],
	[B.META, V.META],
	[B.MGLYPH, V.MGLYPH],
	[B.MI, V.MI],
	[B.MO, V.MO],
	[B.MN, V.MN],
	[B.MS, V.MS],
	[B.MTEXT, V.MTEXT],
	[B.NAV, V.NAV],
	[B.NOBR, V.NOBR],
	[B.NOFRAMES, V.NOFRAMES],
	[B.NOEMBED, V.NOEMBED],
	[B.NOSCRIPT, V.NOSCRIPT],
	[B.OBJECT, V.OBJECT],
	[B.OL, V.OL],
	[B.OPTGROUP, V.OPTGROUP],
	[B.OPTION, V.OPTION],
	[B.P, V.P],
	[B.PARAM, V.PARAM],
	[B.PLAINTEXT, V.PLAINTEXT],
	[B.PRE, V.PRE],
	[B.RB, V.RB],
	[B.RP, V.RP],
	[B.RT, V.RT],
	[B.RTC, V.RTC],
	[B.RUBY, V.RUBY],
	[B.S, V.S],
	[B.SCRIPT, V.SCRIPT],
	[B.SEARCH, V.SEARCH],
	[B.SECTION, V.SECTION],
	[B.SELECT, V.SELECT],
	[B.SOURCE, V.SOURCE],
	[B.SMALL, V.SMALL],
	[B.SPAN, V.SPAN],
	[B.STRIKE, V.STRIKE],
	[B.STRONG, V.STRONG],
	[B.STYLE, V.STYLE],
	[B.SUB, V.SUB],
	[B.SUMMARY, V.SUMMARY],
	[B.SUP, V.SUP],
	[B.TABLE, V.TABLE],
	[B.TBODY, V.TBODY],
	[B.TEMPLATE, V.TEMPLATE],
	[B.TEXTAREA, V.TEXTAREA],
	[B.TFOOT, V.TFOOT],
	[B.TD, V.TD],
	[B.TH, V.TH],
	[B.THEAD, V.THEAD],
	[B.TITLE, V.TITLE],
	[B.TR, V.TR],
	[B.TRACK, V.TRACK],
	[B.TT, V.TT],
	[B.U, V.U],
	[B.UL, V.UL],
	[B.SVG, V.SVG],
	[B.VAR, V.VAR],
	[B.WBR, V.WBR],
	[B.XMP, V.XMP]
]);
function Ar(e) {
	return kr.get(e) ?? V.UNKNOWN;
}
var H = V, jr = {
	[z.HTML]: /* @__PURE__ */ new Set([
		H.ADDRESS,
		H.APPLET,
		H.AREA,
		H.ARTICLE,
		H.ASIDE,
		H.BASE,
		H.BASEFONT,
		H.BGSOUND,
		H.BLOCKQUOTE,
		H.BODY,
		H.BR,
		H.BUTTON,
		H.CAPTION,
		H.CENTER,
		H.COL,
		H.COLGROUP,
		H.DD,
		H.DETAILS,
		H.DIR,
		H.DIV,
		H.DL,
		H.DT,
		H.EMBED,
		H.FIELDSET,
		H.FIGCAPTION,
		H.FIGURE,
		H.FOOTER,
		H.FORM,
		H.FRAME,
		H.FRAMESET,
		H.H1,
		H.H2,
		H.H3,
		H.H4,
		H.H5,
		H.H6,
		H.HEAD,
		H.HEADER,
		H.HGROUP,
		H.HR,
		H.HTML,
		H.IFRAME,
		H.IMG,
		H.INPUT,
		H.LI,
		H.LINK,
		H.LISTING,
		H.MAIN,
		H.MARQUEE,
		H.MENU,
		H.META,
		H.NAV,
		H.NOEMBED,
		H.NOFRAMES,
		H.NOSCRIPT,
		H.OBJECT,
		H.OL,
		H.P,
		H.PARAM,
		H.PLAINTEXT,
		H.PRE,
		H.SCRIPT,
		H.SECTION,
		H.SELECT,
		H.SOURCE,
		H.STYLE,
		H.SUMMARY,
		H.TABLE,
		H.TBODY,
		H.TD,
		H.TEMPLATE,
		H.TEXTAREA,
		H.TFOOT,
		H.TH,
		H.THEAD,
		H.TITLE,
		H.TR,
		H.TRACK,
		H.UL,
		H.WBR,
		H.XMP
	]),
	[z.MATHML]: /* @__PURE__ */ new Set([
		H.MI,
		H.MO,
		H.MN,
		H.MS,
		H.MTEXT,
		H.ANNOTATION_XML
	]),
	[z.SVG]: /* @__PURE__ */ new Set([
		H.TITLE,
		H.FOREIGN_OBJECT,
		H.DESC
	]),
	[z.XLINK]: /* @__PURE__ */ new Set(),
	[z.XML]: /* @__PURE__ */ new Set(),
	[z.XMLNS]: /* @__PURE__ */ new Set()
}, Mr = /* @__PURE__ */ new Set([
	H.H1,
	H.H2,
	H.H3,
	H.H4,
	H.H5,
	H.H6
]);
B.STYLE, B.SCRIPT, B.XMP, B.IFRAME, B.NOEMBED, B.NOFRAMES, B.PLAINTEXT;
// node_modules/.pnpm/parse5@8.1.1/node_modules/parse5/dist/tokenizer/index.js
var Nr = 64, U;
(function(e) {
	e[e.DATA = 0] = "DATA", e[e.RCDATA = 1] = "RCDATA", e[e.RAWTEXT = 2] = "RAWTEXT", e[e.SCRIPT_DATA = 3] = "SCRIPT_DATA", e[e.PLAINTEXT = 4] = "PLAINTEXT", e[e.TAG_OPEN = 5] = "TAG_OPEN", e[e.END_TAG_OPEN = 6] = "END_TAG_OPEN", e[e.TAG_NAME = 7] = "TAG_NAME", e[e.RCDATA_LESS_THAN_SIGN = 8] = "RCDATA_LESS_THAN_SIGN", e[e.RCDATA_END_TAG_OPEN = 9] = "RCDATA_END_TAG_OPEN", e[e.RCDATA_END_TAG_NAME = 10] = "RCDATA_END_TAG_NAME", e[e.RAWTEXT_LESS_THAN_SIGN = 11] = "RAWTEXT_LESS_THAN_SIGN", e[e.RAWTEXT_END_TAG_OPEN = 12] = "RAWTEXT_END_TAG_OPEN", e[e.RAWTEXT_END_TAG_NAME = 13] = "RAWTEXT_END_TAG_NAME", e[e.SCRIPT_DATA_LESS_THAN_SIGN = 14] = "SCRIPT_DATA_LESS_THAN_SIGN", e[e.SCRIPT_DATA_END_TAG_OPEN = 15] = "SCRIPT_DATA_END_TAG_OPEN", e[e.SCRIPT_DATA_END_TAG_NAME = 16] = "SCRIPT_DATA_END_TAG_NAME", e[e.SCRIPT_DATA_ESCAPE_START = 17] = "SCRIPT_DATA_ESCAPE_START", e[e.SCRIPT_DATA_ESCAPE_START_DASH = 18] = "SCRIPT_DATA_ESCAPE_START_DASH", e[e.SCRIPT_DATA_ESCAPED = 19] = "SCRIPT_DATA_ESCAPED", e[e.SCRIPT_DATA_ESCAPED_DASH = 20] = "SCRIPT_DATA_ESCAPED_DASH", e[e.SCRIPT_DATA_ESCAPED_DASH_DASH = 21] = "SCRIPT_DATA_ESCAPED_DASH_DASH", e[e.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN = 22] = "SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN", e[e.SCRIPT_DATA_ESCAPED_END_TAG_OPEN = 23] = "SCRIPT_DATA_ESCAPED_END_TAG_OPEN", e[e.SCRIPT_DATA_ESCAPED_END_TAG_NAME = 24] = "SCRIPT_DATA_ESCAPED_END_TAG_NAME", e[e.SCRIPT_DATA_DOUBLE_ESCAPE_START = 25] = "SCRIPT_DATA_DOUBLE_ESCAPE_START", e[e.SCRIPT_DATA_DOUBLE_ESCAPED = 26] = "SCRIPT_DATA_DOUBLE_ESCAPED", e[e.SCRIPT_DATA_DOUBLE_ESCAPED_DASH = 27] = "SCRIPT_DATA_DOUBLE_ESCAPED_DASH", e[e.SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH = 28] = "SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH", e[e.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN = 29] = "SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN", e[e.SCRIPT_DATA_DOUBLE_ESCAPE_END = 30] = "SCRIPT_DATA_DOUBLE_ESCAPE_END", e[e.BEFORE_ATTRIBUTE_NAME = 31] = "BEFORE_ATTRIBUTE_NAME", e[e.ATTRIBUTE_NAME = 32] = "ATTRIBUTE_NAME", e[e.AFTER_ATTRIBUTE_NAME = 33] = "AFTER_ATTRIBUTE_NAME", e[e.BEFORE_ATTRIBUTE_VALUE = 34] = "BEFORE_ATTRIBUTE_VALUE", e[e.ATTRIBUTE_VALUE_DOUBLE_QUOTED = 35] = "ATTRIBUTE_VALUE_DOUBLE_QUOTED", e[e.ATTRIBUTE_VALUE_SINGLE_QUOTED = 36] = "ATTRIBUTE_VALUE_SINGLE_QUOTED", e[e.ATTRIBUTE_VALUE_UNQUOTED = 37] = "ATTRIBUTE_VALUE_UNQUOTED", e[e.AFTER_ATTRIBUTE_VALUE_QUOTED = 38] = "AFTER_ATTRIBUTE_VALUE_QUOTED", e[e.SELF_CLOSING_START_TAG = 39] = "SELF_CLOSING_START_TAG", e[e.BOGUS_COMMENT = 40] = "BOGUS_COMMENT", e[e.MARKUP_DECLARATION_OPEN = 41] = "MARKUP_DECLARATION_OPEN", e[e.COMMENT_START = 42] = "COMMENT_START", e[e.COMMENT_START_DASH = 43] = "COMMENT_START_DASH", e[e.COMMENT = 44] = "COMMENT", e[e.COMMENT_LESS_THAN_SIGN = 45] = "COMMENT_LESS_THAN_SIGN", e[e.COMMENT_LESS_THAN_SIGN_BANG = 46] = "COMMENT_LESS_THAN_SIGN_BANG", e[e.COMMENT_LESS_THAN_SIGN_BANG_DASH = 47] = "COMMENT_LESS_THAN_SIGN_BANG_DASH", e[e.COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH = 48] = "COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH", e[e.COMMENT_END_DASH = 49] = "COMMENT_END_DASH", e[e.COMMENT_END = 50] = "COMMENT_END", e[e.COMMENT_END_BANG = 51] = "COMMENT_END_BANG", e[e.DOCTYPE = 52] = "DOCTYPE", e[e.BEFORE_DOCTYPE_NAME = 53] = "BEFORE_DOCTYPE_NAME", e[e.DOCTYPE_NAME = 54] = "DOCTYPE_NAME", e[e.AFTER_DOCTYPE_NAME = 55] = "AFTER_DOCTYPE_NAME", e[e.AFTER_DOCTYPE_PUBLIC_KEYWORD = 56] = "AFTER_DOCTYPE_PUBLIC_KEYWORD", e[e.BEFORE_DOCTYPE_PUBLIC_IDENTIFIER = 57] = "BEFORE_DOCTYPE_PUBLIC_IDENTIFIER", e[e.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED = 58] = "DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED", e[e.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED = 59] = "DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED", e[e.AFTER_DOCTYPE_PUBLIC_IDENTIFIER = 60] = "AFTER_DOCTYPE_PUBLIC_IDENTIFIER", e[e.BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS = 61] = "BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS", e[e.AFTER_DOCTYPE_SYSTEM_KEYWORD = 62] = "AFTER_DOCTYPE_SYSTEM_KEYWORD", e[e.BEFORE_DOCTYPE_SYSTEM_IDENTIFIER = 63] = "BEFORE_DOCTYPE_SYSTEM_IDENTIFIER", e[e.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED = 64] = "DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED", e[e.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED = 65] = "DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED", e[e.AFTER_DOCTYPE_SYSTEM_IDENTIFIER = 66] = "AFTER_DOCTYPE_SYSTEM_IDENTIFIER", e[e.BOGUS_DOCTYPE = 67] = "BOGUS_DOCTYPE", e[e.CDATA_SECTION = 68] = "CDATA_SECTION", e[e.CDATA_SECTION_BRACKET = 69] = "CDATA_SECTION_BRACKET", e[e.CDATA_SECTION_END = 70] = "CDATA_SECTION_END", e[e.CHARACTER_REFERENCE = 71] = "CHARACTER_REFERENCE", e[e.AMBIGUOUS_AMPERSAND = 72] = "AMBIGUOUS_AMPERSAND";
})(U ||= {});
var Pr = {
	DATA: U.DATA,
	RCDATA: U.RCDATA,
	RAWTEXT: U.RAWTEXT,
	SCRIPT_DATA: U.SCRIPT_DATA,
	PLAINTEXT: U.PLAINTEXT,
	CDATA_SECTION: U.CDATA_SECTION
};
function Fr(e) {
	return e >= I.DIGIT_0 && e <= I.DIGIT_9;
}
function Ir(e) {
	return e >= I.LATIN_CAPITAL_A && e <= I.LATIN_CAPITAL_Z;
}
function Lr(e) {
	return e >= I.LATIN_SMALL_A && e <= I.LATIN_SMALL_Z;
}
function Rr(e) {
	return Lr(e) || Ir(e);
}
function zr(e) {
	return Rr(e) || Fr(e);
}
function Br(e) {
	return e + 32;
}
function Vr(e) {
	return e === I.SPACE || e === I.LINE_FEED || e === I.TABULATION || e === I.FORM_FEED || e === I.CARRIAGE_RETURN;
}
function Hr(e) {
	return Vr(e) || e === I.SOLIDUS || e === I.GREATER_THAN_SIGN;
}
function Ur(e) {
	return e === I.NULL ? L.nullCharacterReference : e > 1114111 ? L.characterReferenceOutsideUnicodeRange : Tn(e) ? L.surrogateCharacterReference : kn(e) ? L.noncharacterCharacterReference : On(e) || e === I.CARRIAGE_RETURN ? L.controlCharacterReference : null;
}
var Wr = class {
	constructor(e, t) {
		this.options = e, this.handler = t, this.paused = !1, this.inLoop = !1, this.inForeignNode = !1, this.lastStartTagName = "", this.active = !1, this.state = U.DATA, this.returnState = U.DATA, this.entityStartPos = 0, this.consumedAfterSnapshot = -1, this.currentCharacterToken = null, this.currentToken = null, this.currentAttr = {
			name: "",
			value: ""
		}, this.currentAttrLocation = null, this.currentAttrNames = null, this.runStart = 0, this.runEnd = 0, this.preprocessor = new jn(t), this.currentLocation = this.getCurrentLocation(-1), this.entityDecoder = new Cr((e, t) => {
			this.preprocessor.pos = this.entityStartPos + t - 1, this._isCharacterReferenceInAttribute() || this._ensureCharacterToken(Vr(e) ? R.WHITESPACE_CHARACTER : e === I.NULL ? R.NULL_CHARACTER : R.CHARACTER), this._extendRunWith(String.fromCodePoint(e), 0), this.entityStartPos = this.preprocessor.pos - t + 1;
		}, t.onParseError ? {
			missingSemicolonAfterCharacterReference: () => {
				this._err(L.missingSemicolonAfterCharacterReference, 1);
			},
			absenceOfDigitsInNumericCharacterReference: (e) => {
				this._err(L.absenceOfDigitsInNumericCharacterReference, this.entityStartPos - this.preprocessor.pos + e);
			},
			validateNumericCharacterReference: (e) => {
				let t = Ur(e);
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
	flushCharacters() {
		if (this.inLoop) throw Error("Cannot flush characters from a tokenizer callback");
		let e = this.currentCharacterToken?.location, t = null;
		e && (t = this.getCharacterTokenEndLocation(e), this.currentLocation = t), this.inLoop = !0;
		try {
			this._emitCurrentCharacterToken(t);
		} finally {
			this.inLoop = !1;
		}
		this._runParsingLoop();
	}
	getCharacterTokenEndLocation(e) {
		let t = this.getCharacterTokenEndOffset(), n = this.preprocessor.html.slice(e.startOffset - this.preprocessor.droppedBufferSize, t - this.preprocessor.droppedBufferSize), r = e.startLine, i = -1;
		for (let e = n.indexOf("\n"); e !== -1; e = n.indexOf("\n", e + 1)) r++, i = e;
		for (let e = n.indexOf("\r"); e !== -1; e = n.indexOf("\r", e + 1)) n.charCodeAt(e + 1) !== I.LINE_FEED && (r++, i = Math.max(i, e));
		return {
			startLine: r,
			startCol: i === -1 ? e.startCol + n.length : n.length - i,
			startOffset: t,
			endLine: -1,
			endCol: -1,
			endOffset: -1
		};
	}
	getCharacterTokenEndOffset() {
		let e = this.preprocessor.droppedBufferSize + this.preprocessor.pos + 1, t = this.currentToken?.location;
		switch (this.state) {
			case U.TAG_OPEN:
			case U.RCDATA_LESS_THAN_SIGN:
			case U.RAWTEXT_LESS_THAN_SIGN:
			case U.SCRIPT_DATA_LESS_THAN_SIGN:
			case U.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN:
			case U.CDATA_SECTION_BRACKET: return e - 1;
			case U.END_TAG_OPEN:
			case U.MARKUP_DECLARATION_OPEN:
			case U.RCDATA_END_TAG_OPEN:
			case U.RCDATA_END_TAG_NAME:
			case U.RAWTEXT_END_TAG_OPEN:
			case U.RAWTEXT_END_TAG_NAME:
			case U.SCRIPT_DATA_END_TAG_OPEN:
			case U.SCRIPT_DATA_END_TAG_NAME:
			case U.SCRIPT_DATA_ESCAPED_END_TAG_OPEN:
			case U.SCRIPT_DATA_ESCAPED_END_TAG_NAME:
			case U.CDATA_SECTION_END: return e - 2;
			case U.CHARACTER_REFERENCE: return this._isCharacterReferenceInAttribute() && t ? t.startOffset : this.preprocessor.droppedBufferSize + this.entityStartPos;
			case U.DOCTYPE:
			case U.BEFORE_DOCTYPE_NAME: return this.currentLocation.startOffset;
			default: return t && (this.state === U.TAG_NAME || this.state >= U.BEFORE_ATTRIBUTE_NAME && this.state <= U.BOGUS_COMMENT || this.state >= U.COMMENT_START && this.state <= U.BOGUS_DOCTYPE) ? t.startOffset : e;
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
	flushCurrentCharacterToken() {
		if (this.paused || this.active || !this.currentCharacterToken || this.currentToken || this.state === U.DOCTYPE || this.state === U.BEFORE_DOCTYPE_NAME || !this.preprocessor.willDropParsedChunk()) return;
		let e = this.preprocessor.droppedBufferSize + this.preprocessor.pos + 1 - this.getCharacterTokenEndOffset();
		this.preprocessor.advance(), this.currentLocation = this.getCurrentLocation(e), this.preprocessor.retreat(1), this._emitCurrentCharacterToken(this.currentLocation), this._createCharacterToken(R.CHARACTER), this.preprocessor.dropParsedChunk(Math.max(e - 1, 0)), this.entityStartPos = this.preprocessor.pos + 1 - e;
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
		this._flushRun(""), this.currentToken = {
			type: R.START_TAG,
			tagName: "",
			tagID: V.UNKNOWN,
			selfClosing: !1,
			ackSelfClosing: !1,
			attrs: [],
			location: this.getCurrentLocation(1)
		};
	}
	_createEndTagToken() {
		this._flushRun(""), this.currentToken = {
			type: R.END_TAG,
			tagName: "",
			tagID: V.UNKNOWN,
			selfClosing: !1,
			ackSelfClosing: !1,
			attrs: [],
			location: this.getCurrentLocation(2)
		};
	}
	_createCommentToken(e) {
		this._flushRun(""), this.currentToken = {
			type: R.COMMENT,
			data: "",
			location: this.getCurrentLocation(e)
		};
	}
	_createDoctypeToken(e) {
		this._flushRun(""), this.currentToken = {
			type: R.DOCTYPE,
			name: e,
			forceQuirks: !1,
			publicId: null,
			systemId: null,
			location: this.currentLocation
		};
	}
	_createCharacterToken(e) {
		if (this.currentLocation) {
			let e = this.currentLocation.startOffset - this.preprocessor.droppedBufferSize;
			this.preprocessor.html[e] === "\n" && this.preprocessor.html[e - 1] === "\r" && this.currentLocation.startOffset++;
		}
		this.currentCharacterToken = {
			type: e,
			chars: "",
			location: this.currentLocation
		};
	}
	_createAttr(e) {
		this._flushRun(""), this.currentAttr = {
			name: e,
			value: ""
		}, this.currentAttrLocation = this.getCurrentLocation(0);
	}
	_leaveAttrName() {
		var e;
		let t = this.currentToken, { name: n } = this.currentAttr, r = this.currentAttrNames, i;
		if (r === null ? (i = Mn(t, n) !== null, !i && t.attrs.length === Nr && (this.currentAttrNames = new Set(t.attrs.map((e) => e.name)).add(n))) : (i = r.has(n), i || r.add(n)), i) this._err(L.duplicateAttribute);
		else if (t.attrs.push(this.currentAttr), t.location && this.currentAttrLocation) {
			let n = (e = t.location).attrs ?? (e.attrs = Object.create(null));
			n[this.currentAttr.name] = this.currentAttrLocation, this._leaveAttrValue();
		}
	}
	_leaveAttrValue() {
		this.currentAttrLocation && (this.currentAttrLocation.endLine = this.preprocessor.line, this.currentAttrLocation.endCol = this.preprocessor.col, this.currentAttrLocation.endOffset = this.preprocessor.offset);
	}
	_flushRun(e) {
		if (this.runEnd === this.runStart && e.length === 0) return;
		let t = this.preprocessor.html.slice(this.runStart, this.runEnd), n = (t.length < 13 ? t : ` ${t}`.slice(1)) + e, r = this.currentToken;
		this.runStart = this.runEnd, r === null ? this.currentCharacterToken.chars += n : r.type === R.COMMENT ? r.data += n : this.currentAttr.value += n;
	}
	_extendRun(e) {
		let { preprocessor: t } = this;
		if (e === I.LINE_FEED && t.html.charCodeAt(t.pos) !== I.LINE_FEED) this._flushRun("\n"), this.runStart = t.pos + 1;
		else {
			let n = t.pos - Number(e > 65535);
			n !== this.runEnd && (this._flushRun(""), this.runStart = n);
		}
		this.runEnd = t.pos + 1;
	}
	_extendRunWith(e, t) {
		let { preprocessor: n } = this, r = n.codePointStart + 1 + t - e.length;
		r >= 0 && n.html.startsWith(e, r) ? r !== this.runEnd && (this._flushRun(""), this.runStart = r) : (this._flushRun(e), this.runStart = r + e.length), this.runEnd = r + e.length;
	}
	prepareToken(e) {
		this._emitCurrentCharacterToken(e.location), this.currentToken = null, e.location && (e.location.endLine = this.preprocessor.line, e.location.endCol = this.preprocessor.col + 1, e.location.endOffset = this.preprocessor.offset + 1), this.currentLocation = this.getCurrentLocation(-1);
	}
	emitCurrentTagToken() {
		let e = this.currentToken;
		this.currentAttrNames = null, this.prepareToken(e), e.tagID = Ar(e.tagName), e.type === R.START_TAG ? (this.lastStartTagName = e.tagName, this.handler.onStartTag(e)) : (e.attrs.length > 0 && this._err(L.endTagWithAttributes), e.selfClosing && this._err(L.endTagWithTrailingSolidus), this.handler.onEndTag(e)), this.preprocessor.dropParsedChunk();
	}
	emitCurrentComment(e) {
		this.prepareToken(e), this.handler.onComment(e), this.preprocessor.dropParsedChunk();
	}
	emitCurrentDoctype(e) {
		this.prepareToken(e), this.handler.onDoctype(e), this.preprocessor.dropParsedChunk();
	}
	_emitCurrentCharacterToken(e) {
		if (this._flushRun(""), this.currentCharacterToken) {
			switch (e && this.currentCharacterToken.location && (this.currentCharacterToken.location.endLine = e.startLine, this.currentCharacterToken.location.endCol = e.startCol, this.currentCharacterToken.location.endOffset = e.startOffset), this.currentCharacterToken.type) {
				case R.CHARACTER:
					this.handler.onCharacter(this.currentCharacterToken);
					break;
				case R.NULL_CHARACTER:
					this.handler.onNullCharacter(this.currentCharacterToken);
					break;
				case R.WHITESPACE_CHARACTER: this.handler.onWhitespaceCharacter(this.currentCharacterToken);
			}
			this.currentCharacterToken = null;
		}
	}
	_emitEOFToken() {
		let e = this.getCurrentLocation(0);
		e && (e.endLine = e.startLine, e.endCol = e.startCol, e.endOffset = e.startOffset), this._emitCurrentCharacterToken(this.currentToken?.location ?? e), this.handler.onEof({
			type: R.EOF,
			location: e
		}), this.active = !1;
	}
	_ensureCharacterToken(e) {
		if (this.currentCharacterToken) {
			if (this.currentCharacterToken.type === e) return;
			this.currentLocation = this.getCurrentLocation(0), this._emitCurrentCharacterToken(this.currentLocation), this.preprocessor.dropParsedChunk();
		}
		this._createCharacterToken(e);
	}
	_emitCodePoint(e) {
		let t = Vr(e) ? R.WHITESPACE_CHARACTER : e === I.NULL ? R.NULL_CHARACTER : R.CHARACTER, n = this.currentCharacterToken;
		(n === null || n.type !== t) && this._ensureCharacterToken(t), this._extendRun(e);
	}
	_emitChars(e, t = 0) {
		this.options.sourceCodeLocationInfo && t !== 0 && this.currentCharacterToken && this.currentCharacterToken.type !== R.CHARACTER ? (this.currentLocation = this.getCurrentLocation(e.length - 1 - t), this._emitCurrentCharacterToken(this.currentLocation), this._createCharacterToken(R.CHARACTER)) : this._ensureCharacterToken(R.CHARACTER), this._extendRunWith(e, t);
	}
	_startCharacterReference() {
		this.returnState = this.state, this.state = U.CHARACTER_REFERENCE, this.entityStartPos = this.preprocessor.pos, this.entityDecoder.startEntity(this._isCharacterReferenceInAttribute() ? rr.Attribute : rr.Legacy);
	}
	_isCharacterReferenceInAttribute() {
		return this.returnState === U.ATTRIBUTE_VALUE_DOUBLE_QUOTED || this.returnState === U.ATTRIBUTE_VALUE_SINGLE_QUOTED || this.returnState === U.ATTRIBUTE_VALUE_UNQUOTED;
	}
	_flushCodePointConsumedAsCharacterReference(e) {
		this._isCharacterReferenceInAttribute() ? this._extendRun(e) : this._emitCodePoint(e);
	}
	_callState(e) {
		switch (this.state) {
			case U.DATA:
				this._stateData(e);
				break;
			case U.RCDATA:
				this._stateRcdata(e);
				break;
			case U.RAWTEXT:
				this._stateRawtext(e);
				break;
			case U.SCRIPT_DATA:
				this._stateScriptData(e);
				break;
			case U.PLAINTEXT:
				this._statePlaintext(e);
				break;
			case U.TAG_OPEN:
				this._stateTagOpen(e);
				break;
			case U.END_TAG_OPEN:
				this._stateEndTagOpen(e);
				break;
			case U.TAG_NAME:
				this._stateTagName(e);
				break;
			case U.RCDATA_LESS_THAN_SIGN:
				this._stateRcdataLessThanSign(e);
				break;
			case U.RCDATA_END_TAG_OPEN:
				this._stateRcdataEndTagOpen(e);
				break;
			case U.RCDATA_END_TAG_NAME:
				this._stateRcdataEndTagName(e);
				break;
			case U.RAWTEXT_LESS_THAN_SIGN:
				this._stateRawtextLessThanSign(e);
				break;
			case U.RAWTEXT_END_TAG_OPEN:
				this._stateRawtextEndTagOpen(e);
				break;
			case U.RAWTEXT_END_TAG_NAME:
				this._stateRawtextEndTagName(e);
				break;
			case U.SCRIPT_DATA_LESS_THAN_SIGN:
				this._stateScriptDataLessThanSign(e);
				break;
			case U.SCRIPT_DATA_END_TAG_OPEN:
				this._stateScriptDataEndTagOpen(e);
				break;
			case U.SCRIPT_DATA_END_TAG_NAME:
				this._stateScriptDataEndTagName(e);
				break;
			case U.SCRIPT_DATA_ESCAPE_START:
				this._stateScriptDataEscapeStart(e);
				break;
			case U.SCRIPT_DATA_ESCAPE_START_DASH:
				this._stateScriptDataEscapeStartDash(e);
				break;
			case U.SCRIPT_DATA_ESCAPED:
				this._stateScriptDataEscaped(e);
				break;
			case U.SCRIPT_DATA_ESCAPED_DASH:
				this._stateScriptDataEscapedDash(e);
				break;
			case U.SCRIPT_DATA_ESCAPED_DASH_DASH:
				this._stateScriptDataEscapedDashDash(e);
				break;
			case U.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN:
				this._stateScriptDataEscapedLessThanSign(e);
				break;
			case U.SCRIPT_DATA_ESCAPED_END_TAG_OPEN:
				this._stateScriptDataEscapedEndTagOpen(e);
				break;
			case U.SCRIPT_DATA_ESCAPED_END_TAG_NAME:
				this._stateScriptDataEscapedEndTagName(e);
				break;
			case U.SCRIPT_DATA_DOUBLE_ESCAPE_START:
				this._stateScriptDataDoubleEscapeStart(e);
				break;
			case U.SCRIPT_DATA_DOUBLE_ESCAPED:
				this._stateScriptDataDoubleEscaped(e);
				break;
			case U.SCRIPT_DATA_DOUBLE_ESCAPED_DASH:
				this._stateScriptDataDoubleEscapedDash(e);
				break;
			case U.SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH:
				this._stateScriptDataDoubleEscapedDashDash(e);
				break;
			case U.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN:
				this._stateScriptDataDoubleEscapedLessThanSign(e);
				break;
			case U.SCRIPT_DATA_DOUBLE_ESCAPE_END:
				this._stateScriptDataDoubleEscapeEnd(e);
				break;
			case U.BEFORE_ATTRIBUTE_NAME:
				this._stateBeforeAttributeName(e);
				break;
			case U.ATTRIBUTE_NAME:
				this._stateAttributeName(e);
				break;
			case U.AFTER_ATTRIBUTE_NAME:
				this._stateAfterAttributeName(e);
				break;
			case U.BEFORE_ATTRIBUTE_VALUE:
				this._stateBeforeAttributeValue(e);
				break;
			case U.ATTRIBUTE_VALUE_DOUBLE_QUOTED:
				this._stateAttributeValueDoubleQuoted(e);
				break;
			case U.ATTRIBUTE_VALUE_SINGLE_QUOTED:
				this._stateAttributeValueSingleQuoted(e);
				break;
			case U.ATTRIBUTE_VALUE_UNQUOTED:
				this._stateAttributeValueUnquoted(e);
				break;
			case U.AFTER_ATTRIBUTE_VALUE_QUOTED:
				this._stateAfterAttributeValueQuoted(e);
				break;
			case U.SELF_CLOSING_START_TAG:
				this._stateSelfClosingStartTag(e);
				break;
			case U.BOGUS_COMMENT:
				this._stateBogusComment(e);
				break;
			case U.MARKUP_DECLARATION_OPEN:
				this._stateMarkupDeclarationOpen(e);
				break;
			case U.COMMENT_START:
				this._stateCommentStart(e);
				break;
			case U.COMMENT_START_DASH:
				this._stateCommentStartDash(e);
				break;
			case U.COMMENT:
				this._stateComment(e);
				break;
			case U.COMMENT_LESS_THAN_SIGN:
				this._stateCommentLessThanSign(e);
				break;
			case U.COMMENT_LESS_THAN_SIGN_BANG:
				this._stateCommentLessThanSignBang(e);
				break;
			case U.COMMENT_LESS_THAN_SIGN_BANG_DASH:
				this._stateCommentLessThanSignBangDash(e);
				break;
			case U.COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH:
				this._stateCommentLessThanSignBangDashDash(e);
				break;
			case U.COMMENT_END_DASH:
				this._stateCommentEndDash(e);
				break;
			case U.COMMENT_END:
				this._stateCommentEnd(e);
				break;
			case U.COMMENT_END_BANG:
				this._stateCommentEndBang(e);
				break;
			case U.DOCTYPE:
				this._stateDoctype(e);
				break;
			case U.BEFORE_DOCTYPE_NAME:
				this._stateBeforeDoctypeName(e);
				break;
			case U.DOCTYPE_NAME:
				this._stateDoctypeName(e);
				break;
			case U.AFTER_DOCTYPE_NAME:
				this._stateAfterDoctypeName(e);
				break;
			case U.AFTER_DOCTYPE_PUBLIC_KEYWORD:
				this._stateAfterDoctypePublicKeyword(e);
				break;
			case U.BEFORE_DOCTYPE_PUBLIC_IDENTIFIER:
				this._stateBeforeDoctypePublicIdentifier(e);
				break;
			case U.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED:
				this._stateDoctypePublicIdentifierDoubleQuoted(e);
				break;
			case U.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED:
				this._stateDoctypePublicIdentifierSingleQuoted(e);
				break;
			case U.AFTER_DOCTYPE_PUBLIC_IDENTIFIER:
				this._stateAfterDoctypePublicIdentifier(e);
				break;
			case U.BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS:
				this._stateBetweenDoctypePublicAndSystemIdentifiers(e);
				break;
			case U.AFTER_DOCTYPE_SYSTEM_KEYWORD:
				this._stateAfterDoctypeSystemKeyword(e);
				break;
			case U.BEFORE_DOCTYPE_SYSTEM_IDENTIFIER:
				this._stateBeforeDoctypeSystemIdentifier(e);
				break;
			case U.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED:
				this._stateDoctypeSystemIdentifierDoubleQuoted(e);
				break;
			case U.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED:
				this._stateDoctypeSystemIdentifierSingleQuoted(e);
				break;
			case U.AFTER_DOCTYPE_SYSTEM_IDENTIFIER:
				this._stateAfterDoctypeSystemIdentifier(e);
				break;
			case U.BOGUS_DOCTYPE:
				this._stateBogusDoctype(e);
				break;
			case U.CDATA_SECTION:
				this._stateCdataSection(e);
				break;
			case U.CDATA_SECTION_BRACKET:
				this._stateCdataSectionBracket(e);
				break;
			case U.CDATA_SECTION_END:
				this._stateCdataSectionEnd(e);
				break;
			case U.CHARACTER_REFERENCE:
				this._stateCharacterReference();
				break;
			case U.AMBIGUOUS_AMPERSAND:
				this._stateAmbiguousAmpersand(e);
				break;
			default: throw Error("Unknown state");
		}
	}
	_stateData(e) {
		switch (e) {
			case I.LESS_THAN_SIGN:
				this.state = U.TAG_OPEN;
				break;
			case I.AMPERSAND:
				this._startCharacterReference();
				break;
			case I.NULL:
				this._err(L.unexpectedNullCharacter), this._emitCodePoint(e);
				break;
			case I.EOF:
				this._emitEOFToken();
				break;
			default: this._emitCodePoint(e);
		}
	}
	_stateRcdata(e) {
		switch (e) {
			case I.AMPERSAND:
				this._startCharacterReference();
				break;
			case I.LESS_THAN_SIGN:
				this.state = U.RCDATA_LESS_THAN_SIGN;
				break;
			case I.NULL:
				this._err(L.unexpectedNullCharacter), this._emitChars("�");
				break;
			case I.EOF:
				this._emitEOFToken();
				break;
			default: this._emitCodePoint(e);
		}
	}
	_stateRawtext(e) {
		switch (e) {
			case I.LESS_THAN_SIGN:
				this.state = U.RAWTEXT_LESS_THAN_SIGN;
				break;
			case I.NULL:
				this._err(L.unexpectedNullCharacter), this._emitChars("�");
				break;
			case I.EOF:
				this._emitEOFToken();
				break;
			default: this._emitCodePoint(e);
		}
	}
	_stateScriptData(e) {
		switch (e) {
			case I.LESS_THAN_SIGN:
				this.state = U.SCRIPT_DATA_LESS_THAN_SIGN;
				break;
			case I.NULL:
				this._err(L.unexpectedNullCharacter), this._emitChars("�");
				break;
			case I.EOF:
				this._emitEOFToken();
				break;
			default: this._emitCodePoint(e);
		}
	}
	_statePlaintext(e) {
		switch (e) {
			case I.NULL:
				this._err(L.unexpectedNullCharacter), this._emitChars("�");
				break;
			case I.EOF:
				this._emitEOFToken();
				break;
			default: this._emitCodePoint(e);
		}
	}
	_stateTagOpen(e) {
		if (Rr(e)) this._createStartTagToken(), this.state = U.TAG_NAME, this._stateTagName(e);
		else switch (e) {
			case I.EXCLAMATION_MARK:
				this.state = U.MARKUP_DECLARATION_OPEN;
				break;
			case I.SOLIDUS:
				this.state = U.END_TAG_OPEN;
				break;
			case I.QUESTION_MARK:
				this._err(L.unexpectedQuestionMarkInsteadOfTagName), this._createCommentToken(1), this.state = U.BOGUS_COMMENT, this._stateBogusComment(e);
				break;
			case I.EOF:
				this._err(L.eofBeforeTagName), this._emitChars("<", -1), this._emitEOFToken();
				break;
			default: this._err(L.invalidFirstCharacterOfTagName), this._emitChars("<", -1), this.state = U.DATA, this._stateData(e);
		}
	}
	_stateEndTagOpen(e) {
		if (Rr(e)) this._createEndTagToken(), this.state = U.TAG_NAME, this._stateTagName(e);
		else switch (e) {
			case I.GREATER_THAN_SIGN:
				this._err(L.missingEndTagName), this.state = U.DATA;
				break;
			case I.EOF:
				this._err(L.eofBeforeTagName), this._emitChars("</", -1), this._emitEOFToken();
				break;
			default: this._err(L.invalidFirstCharacterOfTagName), this._createCommentToken(2), this.state = U.BOGUS_COMMENT, this._stateBogusComment(e);
		}
	}
	_stateTagName(e) {
		let t = this.currentToken;
		switch (e) {
			case I.SPACE:
			case I.LINE_FEED:
			case I.TABULATION:
			case I.FORM_FEED:
				this.state = U.BEFORE_ATTRIBUTE_NAME;
				break;
			case I.SOLIDUS:
				this.state = U.SELF_CLOSING_START_TAG;
				break;
			case I.GREATER_THAN_SIGN:
				this.state = U.DATA, this.emitCurrentTagToken();
				break;
			case I.NULL:
				this._err(L.unexpectedNullCharacter), t.tagName += "�";
				break;
			case I.EOF:
				this._err(L.eofInTag), this._emitEOFToken();
				break;
			default: t.tagName += String.fromCodePoint(Ir(e) ? Br(e) : e);
		}
	}
	_stateRcdataLessThanSign(e) {
		e === I.SOLIDUS ? this.state = U.RCDATA_END_TAG_OPEN : (this._emitChars("<", -1), this.state = U.RCDATA, this._stateRcdata(e));
	}
	_stateRcdataEndTagOpen(e) {
		Rr(e) ? (this.state = U.RCDATA_END_TAG_NAME, this._stateRcdataEndTagName(e)) : (this._emitChars("</", -1), this.state = U.RCDATA, this._stateRcdata(e));
	}
	handleSpecialEndTag(e) {
		if (!this.preprocessor.startsWith(this.lastStartTagName, !1)) return !this._ensureHibernation();
		this._createEndTagToken();
		let t = this.currentToken;
		switch (t.tagName = this.lastStartTagName, this.preprocessor.peek(this.lastStartTagName.length)) {
			case I.SPACE:
			case I.LINE_FEED:
			case I.TABULATION:
			case I.FORM_FEED: return this._advanceBy(this.lastStartTagName.length), this.state = U.BEFORE_ATTRIBUTE_NAME, !1;
			case I.SOLIDUS: return this._advanceBy(this.lastStartTagName.length), this.state = U.SELF_CLOSING_START_TAG, !1;
			case I.GREATER_THAN_SIGN: return this._advanceBy(this.lastStartTagName.length), this.emitCurrentTagToken(), this.state = U.DATA, !1;
			default: return this.currentToken = null, !this._ensureHibernation();
		}
	}
	_stateRcdataEndTagName(e) {
		this.handleSpecialEndTag(e) && (this._emitChars("</", -1), this.state = U.RCDATA, this._stateRcdata(e));
	}
	_stateRawtextLessThanSign(e) {
		e === I.SOLIDUS ? this.state = U.RAWTEXT_END_TAG_OPEN : (this._emitChars("<", -1), this.state = U.RAWTEXT, this._stateRawtext(e));
	}
	_stateRawtextEndTagOpen(e) {
		Rr(e) ? (this.state = U.RAWTEXT_END_TAG_NAME, this._stateRawtextEndTagName(e)) : (this._emitChars("</", -1), this.state = U.RAWTEXT, this._stateRawtext(e));
	}
	_stateRawtextEndTagName(e) {
		this.handleSpecialEndTag(e) && (this._emitChars("</", -1), this.state = U.RAWTEXT, this._stateRawtext(e));
	}
	_stateScriptDataLessThanSign(e) {
		switch (e) {
			case I.SOLIDUS:
				this.state = U.SCRIPT_DATA_END_TAG_OPEN;
				break;
			case I.EXCLAMATION_MARK:
				this.state = U.SCRIPT_DATA_ESCAPE_START, this._emitChars("<!");
				break;
			default: this._emitChars("<", -1), this.state = U.SCRIPT_DATA, this._stateScriptData(e);
		}
	}
	_stateScriptDataEndTagOpen(e) {
		Rr(e) ? (this.state = U.SCRIPT_DATA_END_TAG_NAME, this._stateScriptDataEndTagName(e)) : (this._emitChars("</", -1), this.state = U.SCRIPT_DATA, this._stateScriptData(e));
	}
	_stateScriptDataEndTagName(e) {
		this.handleSpecialEndTag(e) && (this._emitChars("</", -1), this.state = U.SCRIPT_DATA, this._stateScriptData(e));
	}
	_stateScriptDataEscapeStart(e) {
		e === I.HYPHEN_MINUS ? (this.state = U.SCRIPT_DATA_ESCAPE_START_DASH, this._emitChars("-")) : (this.state = U.SCRIPT_DATA, this._stateScriptData(e));
	}
	_stateScriptDataEscapeStartDash(e) {
		e === I.HYPHEN_MINUS ? (this.state = U.SCRIPT_DATA_ESCAPED_DASH_DASH, this._emitChars("-")) : (this.state = U.SCRIPT_DATA, this._stateScriptData(e));
	}
	_stateScriptDataEscaped(e) {
		switch (e) {
			case I.HYPHEN_MINUS:
				this.state = U.SCRIPT_DATA_ESCAPED_DASH, this._emitChars("-");
				break;
			case I.LESS_THAN_SIGN:
				this.state = U.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN;
				break;
			case I.NULL:
				this._err(L.unexpectedNullCharacter), this._emitChars("�");
				break;
			case I.EOF:
				this._err(L.eofInScriptHtmlCommentLikeText), this._emitEOFToken();
				break;
			default: this._emitCodePoint(e);
		}
	}
	_stateScriptDataEscapedDash(e) {
		switch (e) {
			case I.HYPHEN_MINUS:
				this.state = U.SCRIPT_DATA_ESCAPED_DASH_DASH, this._emitChars("-");
				break;
			case I.LESS_THAN_SIGN:
				this.state = U.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN;
				break;
			case I.NULL:
				this._err(L.unexpectedNullCharacter), this.state = U.SCRIPT_DATA_ESCAPED, this._emitChars("�");
				break;
			case I.EOF:
				this._err(L.eofInScriptHtmlCommentLikeText), this._emitEOFToken();
				break;
			default: this.state = U.SCRIPT_DATA_ESCAPED, this._emitCodePoint(e);
		}
	}
	_stateScriptDataEscapedDashDash(e) {
		switch (e) {
			case I.HYPHEN_MINUS:
				this._emitChars("-");
				break;
			case I.LESS_THAN_SIGN:
				this.state = U.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN;
				break;
			case I.GREATER_THAN_SIGN:
				this.state = U.SCRIPT_DATA, this._emitChars(">");
				break;
			case I.NULL:
				this._err(L.unexpectedNullCharacter), this.state = U.SCRIPT_DATA_ESCAPED, this._emitChars("�");
				break;
			case I.EOF:
				this._err(L.eofInScriptHtmlCommentLikeText), this._emitEOFToken();
				break;
			default: this.state = U.SCRIPT_DATA_ESCAPED, this._emitCodePoint(e);
		}
	}
	_stateScriptDataEscapedLessThanSign(e) {
		e === I.SOLIDUS ? this.state = U.SCRIPT_DATA_ESCAPED_END_TAG_OPEN : Rr(e) ? (this._emitChars("<", -1), this.state = U.SCRIPT_DATA_DOUBLE_ESCAPE_START, this._stateScriptDataDoubleEscapeStart(e)) : (this._emitChars("<", -1), this.state = U.SCRIPT_DATA_ESCAPED, this._stateScriptDataEscaped(e));
	}
	_stateScriptDataEscapedEndTagOpen(e) {
		Rr(e) ? (this.state = U.SCRIPT_DATA_ESCAPED_END_TAG_NAME, this._stateScriptDataEscapedEndTagName(e)) : (this._emitChars("</", -1), this.state = U.SCRIPT_DATA_ESCAPED, this._stateScriptDataEscaped(e));
	}
	_stateScriptDataEscapedEndTagName(e) {
		this.handleSpecialEndTag(e) && (this._emitChars("</", -1), this.state = U.SCRIPT_DATA_ESCAPED, this._stateScriptDataEscaped(e));
	}
	_stateScriptDataDoubleEscapeStart(e) {
		if (this.preprocessor.startsWith(wn.SCRIPT, !1) && Hr(this.preprocessor.peek(wn.SCRIPT.length))) {
			this._emitCodePoint(e);
			for (let e = 0; e < wn.SCRIPT.length; e++) this._emitCodePoint(this._consume());
			this.state = U.SCRIPT_DATA_DOUBLE_ESCAPED;
		} else this._ensureHibernation() || (this.state = U.SCRIPT_DATA_ESCAPED, this._stateScriptDataEscaped(e));
	}
	_stateScriptDataDoubleEscaped(e) {
		switch (e) {
			case I.HYPHEN_MINUS:
				this.state = U.SCRIPT_DATA_DOUBLE_ESCAPED_DASH, this._emitChars("-");
				break;
			case I.LESS_THAN_SIGN:
				this.state = U.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN, this._emitChars("<");
				break;
			case I.NULL:
				this._err(L.unexpectedNullCharacter), this._emitChars("�");
				break;
			case I.EOF:
				this._err(L.eofInScriptHtmlCommentLikeText), this._emitEOFToken();
				break;
			default: this._emitCodePoint(e);
		}
	}
	_stateScriptDataDoubleEscapedDash(e) {
		switch (e) {
			case I.HYPHEN_MINUS:
				this.state = U.SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH, this._emitChars("-");
				break;
			case I.LESS_THAN_SIGN:
				this.state = U.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN, this._emitChars("<");
				break;
			case I.NULL:
				this._err(L.unexpectedNullCharacter), this.state = U.SCRIPT_DATA_DOUBLE_ESCAPED, this._emitChars("�");
				break;
			case I.EOF:
				this._err(L.eofInScriptHtmlCommentLikeText), this._emitEOFToken();
				break;
			default: this.state = U.SCRIPT_DATA_DOUBLE_ESCAPED, this._emitCodePoint(e);
		}
	}
	_stateScriptDataDoubleEscapedDashDash(e) {
		switch (e) {
			case I.HYPHEN_MINUS:
				this._emitChars("-");
				break;
			case I.LESS_THAN_SIGN:
				this.state = U.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN, this._emitChars("<");
				break;
			case I.GREATER_THAN_SIGN:
				this.state = U.SCRIPT_DATA, this._emitChars(">");
				break;
			case I.NULL:
				this._err(L.unexpectedNullCharacter), this.state = U.SCRIPT_DATA_DOUBLE_ESCAPED, this._emitChars("�");
				break;
			case I.EOF:
				this._err(L.eofInScriptHtmlCommentLikeText), this._emitEOFToken();
				break;
			default: this.state = U.SCRIPT_DATA_DOUBLE_ESCAPED, this._emitCodePoint(e);
		}
	}
	_stateScriptDataDoubleEscapedLessThanSign(e) {
		e === I.SOLIDUS ? (this.state = U.SCRIPT_DATA_DOUBLE_ESCAPE_END, this._emitChars("/")) : (this.state = U.SCRIPT_DATA_DOUBLE_ESCAPED, this._stateScriptDataDoubleEscaped(e));
	}
	_stateScriptDataDoubleEscapeEnd(e) {
		if (this.preprocessor.startsWith(wn.SCRIPT, !1) && Hr(this.preprocessor.peek(wn.SCRIPT.length))) {
			this._emitCodePoint(e);
			for (let e = 0; e < wn.SCRIPT.length; e++) this._emitCodePoint(this._consume());
			this.state = U.SCRIPT_DATA_ESCAPED;
		} else this._ensureHibernation() || (this.state = U.SCRIPT_DATA_DOUBLE_ESCAPED, this._stateScriptDataDoubleEscaped(e));
	}
	_stateBeforeAttributeName(e) {
		switch (e) {
			case I.SPACE:
			case I.LINE_FEED:
			case I.TABULATION:
			case I.FORM_FEED: break;
			case I.SOLIDUS:
			case I.GREATER_THAN_SIGN:
			case I.EOF:
				this.state = U.AFTER_ATTRIBUTE_NAME, this._stateAfterAttributeName(e);
				break;
			case I.EQUALS_SIGN:
				this._err(L.unexpectedEqualsSignBeforeAttributeName), this._createAttr("="), this.state = U.ATTRIBUTE_NAME;
				break;
			default: this._createAttr(""), this.state = U.ATTRIBUTE_NAME, this._stateAttributeName(e);
		}
	}
	_stateAttributeName(e) {
		switch (e) {
			case I.SPACE:
			case I.LINE_FEED:
			case I.TABULATION:
			case I.FORM_FEED:
			case I.SOLIDUS:
			case I.GREATER_THAN_SIGN:
			case I.EOF:
				this._leaveAttrName(), this.state = U.AFTER_ATTRIBUTE_NAME, this._stateAfterAttributeName(e);
				break;
			case I.EQUALS_SIGN:
				this._leaveAttrName(), this.state = U.BEFORE_ATTRIBUTE_VALUE;
				break;
			case I.QUOTATION_MARK:
			case I.APOSTROPHE:
			case I.LESS_THAN_SIGN:
				this._err(L.unexpectedCharacterInAttributeName), this.currentAttr.name += String.fromCodePoint(e);
				break;
			case I.NULL:
				this._err(L.unexpectedNullCharacter), this.currentAttr.name += "�";
				break;
			default: this.currentAttr.name += String.fromCodePoint(Ir(e) ? Br(e) : e);
		}
	}
	_stateAfterAttributeName(e) {
		switch (e) {
			case I.SPACE:
			case I.LINE_FEED:
			case I.TABULATION:
			case I.FORM_FEED: break;
			case I.SOLIDUS:
				this.state = U.SELF_CLOSING_START_TAG;
				break;
			case I.EQUALS_SIGN:
				this.state = U.BEFORE_ATTRIBUTE_VALUE;
				break;
			case I.GREATER_THAN_SIGN:
				this.state = U.DATA, this.emitCurrentTagToken();
				break;
			case I.EOF:
				this._err(L.eofInTag), this._emitEOFToken();
				break;
			default: this._createAttr(""), this.state = U.ATTRIBUTE_NAME, this._stateAttributeName(e);
		}
	}
	_stateBeforeAttributeValue(e) {
		switch (e) {
			case I.SPACE:
			case I.LINE_FEED:
			case I.TABULATION:
			case I.FORM_FEED: break;
			case I.QUOTATION_MARK:
				this.state = U.ATTRIBUTE_VALUE_DOUBLE_QUOTED;
				break;
			case I.APOSTROPHE:
				this.state = U.ATTRIBUTE_VALUE_SINGLE_QUOTED;
				break;
			case I.GREATER_THAN_SIGN:
				this._err(L.missingAttributeValue), this.state = U.DATA, this.emitCurrentTagToken();
				break;
			default: this.state = U.ATTRIBUTE_VALUE_UNQUOTED, this._stateAttributeValueUnquoted(e);
		}
	}
	_stateAttributeValueDoubleQuoted(e) {
		switch (e) {
			case I.QUOTATION_MARK:
				this.state = U.AFTER_ATTRIBUTE_VALUE_QUOTED;
				break;
			case I.AMPERSAND:
				this._startCharacterReference();
				break;
			case I.NULL:
				this._err(L.unexpectedNullCharacter), this._extendRunWith("�", 0);
				break;
			case I.EOF:
				this._err(L.eofInTag), this._emitEOFToken();
				break;
			default: this._extendRun(e);
		}
	}
	_stateAttributeValueSingleQuoted(e) {
		switch (e) {
			case I.APOSTROPHE:
				this.state = U.AFTER_ATTRIBUTE_VALUE_QUOTED;
				break;
			case I.AMPERSAND:
				this._startCharacterReference();
				break;
			case I.NULL:
				this._err(L.unexpectedNullCharacter), this._extendRunWith("�", 0);
				break;
			case I.EOF:
				this._err(L.eofInTag), this._emitEOFToken();
				break;
			default: this._extendRun(e);
		}
	}
	_stateAttributeValueUnquoted(e) {
		switch (e) {
			case I.SPACE:
			case I.LINE_FEED:
			case I.TABULATION:
			case I.FORM_FEED:
				this._leaveAttrValue(), this.state = U.BEFORE_ATTRIBUTE_NAME;
				break;
			case I.AMPERSAND:
				this._startCharacterReference();
				break;
			case I.GREATER_THAN_SIGN:
				this._leaveAttrValue(), this.state = U.DATA, this.emitCurrentTagToken();
				break;
			case I.NULL:
				this._err(L.unexpectedNullCharacter), this._extendRunWith("�", 0);
				break;
			case I.QUOTATION_MARK:
			case I.APOSTROPHE:
			case I.LESS_THAN_SIGN:
			case I.EQUALS_SIGN:
			case I.GRAVE_ACCENT:
				this._err(L.unexpectedCharacterInUnquotedAttributeValue), this._extendRun(e);
				break;
			case I.EOF:
				this._err(L.eofInTag), this._emitEOFToken();
				break;
			default: this._extendRun(e);
		}
	}
	_stateAfterAttributeValueQuoted(e) {
		switch (e) {
			case I.SPACE:
			case I.LINE_FEED:
			case I.TABULATION:
			case I.FORM_FEED:
				this._leaveAttrValue(), this.state = U.BEFORE_ATTRIBUTE_NAME;
				break;
			case I.SOLIDUS:
				this._leaveAttrValue(), this.state = U.SELF_CLOSING_START_TAG;
				break;
			case I.GREATER_THAN_SIGN:
				this._leaveAttrValue(), this.state = U.DATA, this.emitCurrentTagToken();
				break;
			case I.EOF:
				this._err(L.eofInTag), this._emitEOFToken();
				break;
			default: this._err(L.missingWhitespaceBetweenAttributes), this._leaveAttrValue(), this.state = U.BEFORE_ATTRIBUTE_NAME, this._stateBeforeAttributeName(e);
		}
	}
	_stateSelfClosingStartTag(e) {
		switch (e) {
			case I.GREATER_THAN_SIGN: {
				let e = this.currentToken;
				e.selfClosing = !0, this.state = U.DATA, this.emitCurrentTagToken();
				break;
			}
			case I.EOF:
				this._err(L.eofInTag), this._emitEOFToken();
				break;
			default: this._err(L.unexpectedSolidusInTag), this.state = U.BEFORE_ATTRIBUTE_NAME, this._stateBeforeAttributeName(e);
		}
	}
	_stateBogusComment(e) {
		let t = this.currentToken;
		switch (e) {
			case I.GREATER_THAN_SIGN:
				this.state = U.DATA, this.emitCurrentComment(t);
				break;
			case I.EOF:
				this.emitCurrentComment(t), this._emitEOFToken();
				break;
			case I.NULL:
				this._err(L.unexpectedNullCharacter), this._extendRunWith("�", 0);
				break;
			default: this._extendRun(e);
		}
	}
	_stateMarkupDeclarationOpen(e) {
		this._consumeSequenceIfMatch(wn.DASH_DASH, !0) ? (this._createCommentToken(wn.DASH_DASH.length + 1), this.state = U.COMMENT_START) : this._consumeSequenceIfMatch(wn.DOCTYPE, !1) ? (this.currentLocation = this.getCurrentLocation(wn.DOCTYPE.length + 1), this.state = U.DOCTYPE) : this._consumeSequenceIfMatch(wn.CDATA_START, !0) ? this.inForeignNode ? this.state = U.CDATA_SECTION : (this._err(L.cdataInHtmlContent), this._createCommentToken(wn.CDATA_START.length + 1), this.currentToken.data = "[CDATA[", this.state = U.BOGUS_COMMENT) : this._ensureHibernation() || (this._err(L.incorrectlyOpenedComment), this._createCommentToken(2), this.state = U.BOGUS_COMMENT, this._stateBogusComment(e));
	}
	_stateCommentStart(e) {
		switch (e) {
			case I.HYPHEN_MINUS:
				this.state = U.COMMENT_START_DASH;
				break;
			case I.GREATER_THAN_SIGN: {
				this._err(L.abruptClosingOfEmptyComment), this.state = U.DATA;
				let e = this.currentToken;
				this.emitCurrentComment(e);
				break;
			}
			default: this.state = U.COMMENT, this._stateComment(e);
		}
	}
	_stateCommentStartDash(e) {
		let t = this.currentToken;
		switch (e) {
			case I.HYPHEN_MINUS:
				this.state = U.COMMENT_END;
				break;
			case I.GREATER_THAN_SIGN:
				this._err(L.abruptClosingOfEmptyComment), this.state = U.DATA, this.emitCurrentComment(t);
				break;
			case I.EOF:
				this._err(L.eofInComment), this.emitCurrentComment(t), this._emitEOFToken();
				break;
			default: this._extendRunWith("-", -1), this.state = U.COMMENT, this._stateComment(e);
		}
	}
	_stateComment(e) {
		let t = this.currentToken;
		switch (e) {
			case I.HYPHEN_MINUS:
				this.state = U.COMMENT_END_DASH;
				break;
			case I.LESS_THAN_SIGN:
				this._extendRunWith("<", 0), this.state = U.COMMENT_LESS_THAN_SIGN;
				break;
			case I.NULL:
				this._err(L.unexpectedNullCharacter), this._extendRunWith("�", 0);
				break;
			case I.EOF:
				this._err(L.eofInComment), this.emitCurrentComment(t), this._emitEOFToken();
				break;
			default: this._extendRun(e);
		}
	}
	_stateCommentLessThanSign(e) {
		switch (e) {
			case I.EXCLAMATION_MARK:
				this._extendRunWith("!", 0), this.state = U.COMMENT_LESS_THAN_SIGN_BANG;
				break;
			case I.LESS_THAN_SIGN:
				this._extendRunWith("<", 0);
				break;
			default: this.state = U.COMMENT, this._stateComment(e);
		}
	}
	_stateCommentLessThanSignBang(e) {
		e === I.HYPHEN_MINUS ? this.state = U.COMMENT_LESS_THAN_SIGN_BANG_DASH : (this.state = U.COMMENT, this._stateComment(e));
	}
	_stateCommentLessThanSignBangDash(e) {
		e === I.HYPHEN_MINUS ? this.state = U.COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH : (this.state = U.COMMENT_END_DASH, this._stateCommentEndDash(e));
	}
	_stateCommentLessThanSignBangDashDash(e) {
		e !== I.GREATER_THAN_SIGN && e !== I.EOF && this._err(L.nestedComment), this.state = U.COMMENT_END, this._stateCommentEnd(e);
	}
	_stateCommentEndDash(e) {
		let t = this.currentToken;
		switch (e) {
			case I.HYPHEN_MINUS:
				this.state = U.COMMENT_END;
				break;
			case I.EOF:
				this._err(L.eofInComment), this.emitCurrentComment(t), this._emitEOFToken();
				break;
			default: this._extendRunWith("-", -1), this.state = U.COMMENT, this._stateComment(e);
		}
	}
	_stateCommentEnd(e) {
		let t = this.currentToken;
		switch (e) {
			case I.GREATER_THAN_SIGN:
				this.state = U.DATA, this.emitCurrentComment(t);
				break;
			case I.EXCLAMATION_MARK:
				this.state = U.COMMENT_END_BANG;
				break;
			case I.HYPHEN_MINUS:
				this._extendRunWith("-", -2);
				break;
			case I.EOF:
				this._err(L.eofInComment), this.emitCurrentComment(t), this._emitEOFToken();
				break;
			default: this._extendRunWith("--", -1), this.state = U.COMMENT, this._stateComment(e);
		}
	}
	_stateCommentEndBang(e) {
		let t = this.currentToken;
		switch (e) {
			case I.HYPHEN_MINUS:
				this._extendRunWith("--!", -1), this.state = U.COMMENT_END_DASH;
				break;
			case I.GREATER_THAN_SIGN:
				this._err(L.incorrectlyClosedComment), this.state = U.DATA, this.emitCurrentComment(t);
				break;
			case I.EOF:
				this._err(L.eofInComment), this.emitCurrentComment(t), this._emitEOFToken();
				break;
			default: this._extendRunWith("--!", -1), this.state = U.COMMENT, this._stateComment(e);
		}
	}
	_stateDoctype(e) {
		switch (e) {
			case I.SPACE:
			case I.LINE_FEED:
			case I.TABULATION:
			case I.FORM_FEED:
				this.state = U.BEFORE_DOCTYPE_NAME;
				break;
			case I.GREATER_THAN_SIGN:
				this.state = U.BEFORE_DOCTYPE_NAME, this._stateBeforeDoctypeName(e);
				break;
			case I.EOF: {
				this._err(L.eofInDoctype), this._createDoctypeToken(null);
				let e = this.currentToken;
				e.forceQuirks = !0, this.emitCurrentDoctype(e), this._emitEOFToken();
				break;
			}
			default: this._err(L.missingWhitespaceBeforeDoctypeName), this.state = U.BEFORE_DOCTYPE_NAME, this._stateBeforeDoctypeName(e);
		}
	}
	_stateBeforeDoctypeName(e) {
		if (Ir(e)) this._createDoctypeToken(String.fromCharCode(Br(e))), this.state = U.DOCTYPE_NAME;
		else switch (e) {
			case I.SPACE:
			case I.LINE_FEED:
			case I.TABULATION:
			case I.FORM_FEED: break;
			case I.NULL:
				this._err(L.unexpectedNullCharacter), this._createDoctypeToken("�"), this.state = U.DOCTYPE_NAME;
				break;
			case I.GREATER_THAN_SIGN: {
				this._err(L.missingDoctypeName), this._createDoctypeToken(null);
				let e = this.currentToken;
				e.forceQuirks = !0, this.emitCurrentDoctype(e), this.state = U.DATA;
				break;
			}
			case I.EOF: {
				this._err(L.eofInDoctype), this._createDoctypeToken(null);
				let e = this.currentToken;
				e.forceQuirks = !0, this.emitCurrentDoctype(e), this._emitEOFToken();
				break;
			}
			default: this._createDoctypeToken(String.fromCodePoint(e)), this.state = U.DOCTYPE_NAME;
		}
	}
	_stateDoctypeName(e) {
		let t = this.currentToken;
		switch (e) {
			case I.SPACE:
			case I.LINE_FEED:
			case I.TABULATION:
			case I.FORM_FEED:
				this.state = U.AFTER_DOCTYPE_NAME;
				break;
			case I.GREATER_THAN_SIGN:
				this.state = U.DATA, this.emitCurrentDoctype(t);
				break;
			case I.NULL:
				this._err(L.unexpectedNullCharacter), t.name += "�";
				break;
			case I.EOF:
				this._err(L.eofInDoctype), t.forceQuirks = !0, this.emitCurrentDoctype(t), this._emitEOFToken();
				break;
			default: t.name += String.fromCodePoint(Ir(e) ? Br(e) : e);
		}
	}
	_stateAfterDoctypeName(e) {
		let t = this.currentToken;
		switch (e) {
			case I.SPACE:
			case I.LINE_FEED:
			case I.TABULATION:
			case I.FORM_FEED: break;
			case I.GREATER_THAN_SIGN:
				this.state = U.DATA, this.emitCurrentDoctype(t);
				break;
			case I.EOF:
				this._err(L.eofInDoctype), t.forceQuirks = !0, this.emitCurrentDoctype(t), this._emitEOFToken();
				break;
			default: this._consumeSequenceIfMatch(wn.PUBLIC, !1) ? this.state = U.AFTER_DOCTYPE_PUBLIC_KEYWORD : this._consumeSequenceIfMatch(wn.SYSTEM, !1) ? this.state = U.AFTER_DOCTYPE_SYSTEM_KEYWORD : this._ensureHibernation() || (this._err(L.invalidCharacterSequenceAfterDoctypeName), t.forceQuirks = !0, this.state = U.BOGUS_DOCTYPE, this._stateBogusDoctype(e));
		}
	}
	_stateAfterDoctypePublicKeyword(e) {
		let t = this.currentToken;
		switch (e) {
			case I.SPACE:
			case I.LINE_FEED:
			case I.TABULATION:
			case I.FORM_FEED:
				this.state = U.BEFORE_DOCTYPE_PUBLIC_IDENTIFIER;
				break;
			case I.QUOTATION_MARK:
				this._err(L.missingWhitespaceAfterDoctypePublicKeyword), t.publicId = "", this.state = U.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED;
				break;
			case I.APOSTROPHE:
				this._err(L.missingWhitespaceAfterDoctypePublicKeyword), t.publicId = "", this.state = U.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED;
				break;
			case I.GREATER_THAN_SIGN:
				this._err(L.missingDoctypePublicIdentifier), t.forceQuirks = !0, this.state = U.DATA, this.emitCurrentDoctype(t);
				break;
			case I.EOF:
				this._err(L.eofInDoctype), t.forceQuirks = !0, this.emitCurrentDoctype(t), this._emitEOFToken();
				break;
			default: this._err(L.missingQuoteBeforeDoctypePublicIdentifier), t.forceQuirks = !0, this.state = U.BOGUS_DOCTYPE, this._stateBogusDoctype(e);
		}
	}
	_stateBeforeDoctypePublicIdentifier(e) {
		let t = this.currentToken;
		switch (e) {
			case I.SPACE:
			case I.LINE_FEED:
			case I.TABULATION:
			case I.FORM_FEED: break;
			case I.QUOTATION_MARK:
				t.publicId = "", this.state = U.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED;
				break;
			case I.APOSTROPHE:
				t.publicId = "", this.state = U.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED;
				break;
			case I.GREATER_THAN_SIGN:
				this._err(L.missingDoctypePublicIdentifier), t.forceQuirks = !0, this.state = U.DATA, this.emitCurrentDoctype(t);
				break;
			case I.EOF:
				this._err(L.eofInDoctype), t.forceQuirks = !0, this.emitCurrentDoctype(t), this._emitEOFToken();
				break;
			default: this._err(L.missingQuoteBeforeDoctypePublicIdentifier), t.forceQuirks = !0, this.state = U.BOGUS_DOCTYPE, this._stateBogusDoctype(e);
		}
	}
	_stateDoctypePublicIdentifierDoubleQuoted(e) {
		let t = this.currentToken;
		switch (e) {
			case I.QUOTATION_MARK:
				this.state = U.AFTER_DOCTYPE_PUBLIC_IDENTIFIER;
				break;
			case I.NULL:
				this._err(L.unexpectedNullCharacter), t.publicId += "�";
				break;
			case I.GREATER_THAN_SIGN:
				this._err(L.abruptDoctypePublicIdentifier), t.forceQuirks = !0, this.emitCurrentDoctype(t), this.state = U.DATA;
				break;
			case I.EOF:
				this._err(L.eofInDoctype), t.forceQuirks = !0, this.emitCurrentDoctype(t), this._emitEOFToken();
				break;
			default: t.publicId += String.fromCodePoint(e);
		}
	}
	_stateDoctypePublicIdentifierSingleQuoted(e) {
		let t = this.currentToken;
		switch (e) {
			case I.APOSTROPHE:
				this.state = U.AFTER_DOCTYPE_PUBLIC_IDENTIFIER;
				break;
			case I.NULL:
				this._err(L.unexpectedNullCharacter), t.publicId += "�";
				break;
			case I.GREATER_THAN_SIGN:
				this._err(L.abruptDoctypePublicIdentifier), t.forceQuirks = !0, this.emitCurrentDoctype(t), this.state = U.DATA;
				break;
			case I.EOF:
				this._err(L.eofInDoctype), t.forceQuirks = !0, this.emitCurrentDoctype(t), this._emitEOFToken();
				break;
			default: t.publicId += String.fromCodePoint(e);
		}
	}
	_stateAfterDoctypePublicIdentifier(e) {
		let t = this.currentToken;
		switch (e) {
			case I.SPACE:
			case I.LINE_FEED:
			case I.TABULATION:
			case I.FORM_FEED:
				this.state = U.BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS;
				break;
			case I.GREATER_THAN_SIGN:
				this.state = U.DATA, this.emitCurrentDoctype(t);
				break;
			case I.QUOTATION_MARK:
				this._err(L.missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers), t.systemId = "", this.state = U.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;
				break;
			case I.APOSTROPHE:
				this._err(L.missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers), t.systemId = "", this.state = U.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;
				break;
			case I.EOF:
				this._err(L.eofInDoctype), t.forceQuirks = !0, this.emitCurrentDoctype(t), this._emitEOFToken();
				break;
			default: this._err(L.missingQuoteBeforeDoctypeSystemIdentifier), t.forceQuirks = !0, this.state = U.BOGUS_DOCTYPE, this._stateBogusDoctype(e);
		}
	}
	_stateBetweenDoctypePublicAndSystemIdentifiers(e) {
		let t = this.currentToken;
		switch (e) {
			case I.SPACE:
			case I.LINE_FEED:
			case I.TABULATION:
			case I.FORM_FEED: break;
			case I.GREATER_THAN_SIGN:
				this.emitCurrentDoctype(t), this.state = U.DATA;
				break;
			case I.QUOTATION_MARK:
				t.systemId = "", this.state = U.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;
				break;
			case I.APOSTROPHE:
				t.systemId = "", this.state = U.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;
				break;
			case I.EOF:
				this._err(L.eofInDoctype), t.forceQuirks = !0, this.emitCurrentDoctype(t), this._emitEOFToken();
				break;
			default: this._err(L.missingQuoteBeforeDoctypeSystemIdentifier), t.forceQuirks = !0, this.state = U.BOGUS_DOCTYPE, this._stateBogusDoctype(e);
		}
	}
	_stateAfterDoctypeSystemKeyword(e) {
		let t = this.currentToken;
		switch (e) {
			case I.SPACE:
			case I.LINE_FEED:
			case I.TABULATION:
			case I.FORM_FEED:
				this.state = U.BEFORE_DOCTYPE_SYSTEM_IDENTIFIER;
				break;
			case I.QUOTATION_MARK:
				this._err(L.missingWhitespaceAfterDoctypeSystemKeyword), t.systemId = "", this.state = U.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;
				break;
			case I.APOSTROPHE:
				this._err(L.missingWhitespaceAfterDoctypeSystemKeyword), t.systemId = "", this.state = U.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;
				break;
			case I.GREATER_THAN_SIGN:
				this._err(L.missingDoctypeSystemIdentifier), t.forceQuirks = !0, this.state = U.DATA, this.emitCurrentDoctype(t);
				break;
			case I.EOF:
				this._err(L.eofInDoctype), t.forceQuirks = !0, this.emitCurrentDoctype(t), this._emitEOFToken();
				break;
			default: this._err(L.missingQuoteBeforeDoctypeSystemIdentifier), t.forceQuirks = !0, this.state = U.BOGUS_DOCTYPE, this._stateBogusDoctype(e);
		}
	}
	_stateBeforeDoctypeSystemIdentifier(e) {
		let t = this.currentToken;
		switch (e) {
			case I.SPACE:
			case I.LINE_FEED:
			case I.TABULATION:
			case I.FORM_FEED: break;
			case I.QUOTATION_MARK:
				t.systemId = "", this.state = U.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;
				break;
			case I.APOSTROPHE:
				t.systemId = "", this.state = U.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;
				break;
			case I.GREATER_THAN_SIGN:
				this._err(L.missingDoctypeSystemIdentifier), t.forceQuirks = !0, this.state = U.DATA, this.emitCurrentDoctype(t);
				break;
			case I.EOF:
				this._err(L.eofInDoctype), t.forceQuirks = !0, this.emitCurrentDoctype(t), this._emitEOFToken();
				break;
			default: this._err(L.missingQuoteBeforeDoctypeSystemIdentifier), t.forceQuirks = !0, this.state = U.BOGUS_DOCTYPE, this._stateBogusDoctype(e);
		}
	}
	_stateDoctypeSystemIdentifierDoubleQuoted(e) {
		let t = this.currentToken;
		switch (e) {
			case I.QUOTATION_MARK:
				this.state = U.AFTER_DOCTYPE_SYSTEM_IDENTIFIER;
				break;
			case I.NULL:
				this._err(L.unexpectedNullCharacter), t.systemId += "�";
				break;
			case I.GREATER_THAN_SIGN:
				this._err(L.abruptDoctypeSystemIdentifier), t.forceQuirks = !0, this.emitCurrentDoctype(t), this.state = U.DATA;
				break;
			case I.EOF:
				this._err(L.eofInDoctype), t.forceQuirks = !0, this.emitCurrentDoctype(t), this._emitEOFToken();
				break;
			default: t.systemId += String.fromCodePoint(e);
		}
	}
	_stateDoctypeSystemIdentifierSingleQuoted(e) {
		let t = this.currentToken;
		switch (e) {
			case I.APOSTROPHE:
				this.state = U.AFTER_DOCTYPE_SYSTEM_IDENTIFIER;
				break;
			case I.NULL:
				this._err(L.unexpectedNullCharacter), t.systemId += "�";
				break;
			case I.GREATER_THAN_SIGN:
				this._err(L.abruptDoctypeSystemIdentifier), t.forceQuirks = !0, this.emitCurrentDoctype(t), this.state = U.DATA;
				break;
			case I.EOF:
				this._err(L.eofInDoctype), t.forceQuirks = !0, this.emitCurrentDoctype(t), this._emitEOFToken();
				break;
			default: t.systemId += String.fromCodePoint(e);
		}
	}
	_stateAfterDoctypeSystemIdentifier(e) {
		let t = this.currentToken;
		switch (e) {
			case I.SPACE:
			case I.LINE_FEED:
			case I.TABULATION:
			case I.FORM_FEED: break;
			case I.GREATER_THAN_SIGN:
				this.emitCurrentDoctype(t), this.state = U.DATA;
				break;
			case I.EOF:
				this._err(L.eofInDoctype), t.forceQuirks = !0, this.emitCurrentDoctype(t), this._emitEOFToken();
				break;
			default: this._err(L.unexpectedCharacterAfterDoctypeSystemIdentifier), this.state = U.BOGUS_DOCTYPE, this._stateBogusDoctype(e);
		}
	}
	_stateBogusDoctype(e) {
		let t = this.currentToken;
		switch (e) {
			case I.GREATER_THAN_SIGN:
				this.emitCurrentDoctype(t), this.state = U.DATA;
				break;
			case I.NULL:
				this._err(L.unexpectedNullCharacter);
				break;
			case I.EOF: this.emitCurrentDoctype(t), this._emitEOFToken();
		}
	}
	_stateCdataSection(e) {
		switch (e) {
			case I.RIGHT_SQUARE_BRACKET:
				this.state = U.CDATA_SECTION_BRACKET;
				break;
			case I.EOF:
				this._err(L.eofInCdata), this._emitEOFToken();
				break;
			default: this._emitCodePoint(e);
		}
	}
	_stateCdataSectionBracket(e) {
		e === I.RIGHT_SQUARE_BRACKET ? this.state = U.CDATA_SECTION_END : (this._emitChars("]", -1), this.state = U.CDATA_SECTION, this._stateCdataSection(e));
	}
	_stateCdataSectionEnd(e) {
		switch (e) {
			case I.GREATER_THAN_SIGN:
				this.state = U.DATA;
				break;
			case I.RIGHT_SQUARE_BRACKET:
				this._emitChars("]", -2);
				break;
			default: this._emitChars("]]", -1), this.state = U.CDATA_SECTION, this._stateCdataSection(e);
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
		e === 0 ? (this.preprocessor.pos = this.entityStartPos, this._flushCodePointConsumedAsCharacterReference(I.AMPERSAND), this.state = !this._isCharacterReferenceInAttribute() && zr(this.preprocessor.peek(1)) ? U.AMBIGUOUS_AMPERSAND : this.returnState) : this.state = this.returnState;
	}
	_stateAmbiguousAmpersand(e) {
		zr(e) ? this._flushCodePointConsumedAsCharacterReference(e) : (e === I.SEMICOLON && this._err(L.unknownNamedCharacterReference), this.state = this.returnState, this._callState(e));
	}
}, Gr = /* @__PURE__ */ new Set([
	V.DD,
	V.DT,
	V.LI,
	V.OPTGROUP,
	V.OPTION,
	V.P,
	V.RB,
	V.RP,
	V.RT,
	V.RTC
]), Kr = /* @__PURE__ */ new Set([
	...Gr,
	V.CAPTION,
	V.COLGROUP,
	V.TBODY,
	V.TD,
	V.TFOOT,
	V.TH,
	V.THEAD,
	V.TR
]), qr = 64, Jr = 256, Yr = 512, Xr = 768, Zr = [
	V.H1,
	V.H2,
	V.H3,
	V.H4,
	V.H5,
	V.H6
], Qr = [
	V.TBODY,
	V.TFOOT,
	V.THEAD
], $r = [
	V.TR,
	V.TEMPLATE,
	V.HTML
], ei = [
	...Qr,
	V.TEMPLATE,
	V.HTML
], ti = [
	V.TABLE,
	V.TEMPLATE,
	V.HTML
], ni = [V.TD, V.TH], ri = 1, ii = 2, ai = 4, oi = 8, si = 16, ci = 32, li = new Uint8Array(Xr);
for (let [e, t] of [
	[z.HTML, 0],
	[z.SVG, Jr],
	[z.MATHML, Yr]
]) for (let n of jr[e]) li[t + n] = e === z.HTML && (n === V.ADDRESS || n === V.DIV || n === V.P) ? ri : 3;
for (let e of [
	V.APPLET,
	V.CAPTION,
	V.HTML,
	V.MARQUEE,
	V.OBJECT,
	V.TABLE,
	V.TD,
	V.TEMPLATE,
	V.TH,
	Jr + V.DESC,
	Jr + V.FOREIGN_OBJECT,
	Jr + V.TITLE,
	Yr + V.ANNOTATION_XML,
	Yr + V.MI,
	Yr + V.MN,
	Yr + V.MO,
	Yr + V.MS,
	Yr + V.MTEXT
]) li[e] |= 28;
li[V.OL] |= oi, li[V.UL] |= oi, li[V.BUTTON] |= si, li[V.TABLE] |= ci, li[V.HTML] |= ci;
var ui = new Uint8Array(Xr);
for (let e of [
	V.A,
	V.B,
	V.BIG,
	V.CODE,
	V.EM,
	V.FONT,
	V.I,
	V.NOBR,
	V.S,
	V.SMALL,
	V.STRIKE,
	V.STRONG,
	V.TT,
	V.U
]) ui[e] = 1;
function di(e, t) {
	if (t === V.UNKNOWN) return -1;
	switch (e) {
		case z.HTML: return t;
		case z.SVG: return Jr + t;
		case z.MATHML: return Yr + t;
		default: return -1;
	}
}
var fi = class {
	get currentTmplContentOrNode() {
		return this._isInTemplate() ? this.treeAdapter.getTemplateContent(this.current) : this.current;
	}
	constructor(e, t, n) {
		this.treeAdapter = t, this.handler = n, this.items = [], this.tagIDs = [], this.stackTop = -1, this.depth = 0, this.tmplCount = 0, this.currentTagId = V.UNKNOWN, this.indexed = !1, this.below = [], this.above = [], this.keys = [], this.keyPrev = [], this.keyNext = [], this.keyTops = /* @__PURE__ */ new Int32Array(), this.specials = [], this.listItemBoundaries = [], this.scopeBoundaries = [], this.htmlSlots = [], this.formattingSlots = /* @__PURE__ */ new Map(), this.current = e;
	}
	_indexOf(e) {
		if (this.indexed) {
			let t = this.formattingSlots.get(e);
			if (t !== void 0) return t;
			if (ui[Ar(this.treeAdapter.getTagName(e))]) return -1;
		}
		return this.items.lastIndexOf(e, this.stackTop);
	}
	slotBelow(e) {
		return this.indexed ? this.below[e] : e - 1;
	}
	slotAbove(e) {
		return this.indexed ? this.above[e] : e === this.stackTop ? -1 : e + 1;
	}
	_isInTemplate() {
		return this.currentTagId === V.TEMPLATE && this.treeAdapter.getNamespaceURI(this.current) === z.HTML;
	}
	_updateCurrentElement() {
		this.current = this.items[this.stackTop], this.currentTagId = this.tagIDs[this.stackTop];
	}
	_nameKey(e, t, n) {
		let r = `${e} ${t}`, i = this.nameKeys?.get(r);
		if (i === void 0 && n && (this.nameKeys ??= /* @__PURE__ */ new Map(), i = Xr + this.nameKeys.size, this.nameKeys.set(r, i), i === this.keyTops.length)) {
			let e = new Int32Array(2 * i).fill(-1);
			e.set(this.keyTops), this.keyTops = e;
		}
		return i ?? -1;
	}
	_indexAll() {
		this.indexed = !0, this.keyTops = new Int32Array(Xr).fill(-1);
		for (let e = 0; e <= this.stackTop; e++) this._index(e, e - 1);
	}
	_index(e, t) {
		let n = this.items[e], r = this.tagIDs[e], i = this.treeAdapter.getNamespaceURI(n), a = di(i, r);
		a === -1 && (a = this._nameKey(i, this.treeAdapter.getTagName(n), !0));
		let o = this.keyTops[a];
		this.keys[e] = a, this.keyPrev[e] = o, this.keyNext[e] = -1, o !== -1 && (this.keyNext[o] = e), this.keyTops[a] = e, this.above[e] = -1, this._link(e, t, i === z.HTML), ui[r] && this.formattingSlots.set(n, e);
	}
	_link(e, t, n) {
		let r = this.keys[e], i = r < Xr ? li[r] : 0;
		this.below[e] = t, t === -1 ? (this.specials[e] = i & ri, this.listItemBoundaries[e] = (i & ii) >> 1, this.scopeBoundaries[e] = (i & ai) >> 2, this.htmlSlots[e] = n ? e : -1) : (this.above[t] = e, this.specials[e] = this.specials[t] + (i & ri), this.listItemBoundaries[e] = this.listItemBoundaries[t] + ((i & ii) >> 1), this.scopeBoundaries[e] = this.scopeBoundaries[t] + ((i & ai) >> 2), this.htmlSlots[e] = n ? e : this.htmlSlots[t]);
	}
	_unindex(e) {
		let t = this.keys[e], n = this.keyPrev[e], r = this.keyNext[e];
		n !== -1 && (this.keyNext[n] = r), r === -1 ? this.keyTops[t] = n : this.keyPrev[r] = n, ui[this.tagIDs[e]] && this.formattingSlots.delete(this.items[e]);
	}
	_move(e, t) {
		let n = this.items[e], r = this.keys[e], i = this.keyPrev[e], a = this.keyNext[e];
		this.items[t] = n, this.tagIDs[t] = this.tagIDs[e], this.keys[t] = r, this.keyPrev[t] = i, this.keyNext[t] = a, i !== -1 && (this.keyNext[i] = t), a === -1 ? this.keyTops[r] = t : this.keyPrev[a] = t, ui[this.tagIDs[t]] && this.formattingSlots.set(n, t);
	}
	indexOfTopmost(e) {
		if (this.indexed) return this.keyTops[e];
		for (let t = this.stackTop; t >= 0; t--) if (this.tagIDs[t] === e && this.treeAdapter.getNamespaceURI(this.items[t]) === z.HTML) return t;
		return -1;
	}
	indexOfTopmostOf(e) {
		if (this.indexed) {
			let t = -1;
			for (let n of e) this.keyTops[n] > t && (t = this.keyTops[n]);
			return t;
		}
		for (let t = this.stackTop; t >= 0; t--) if (e.includes(this.tagIDs[t]) && this.treeAdapter.getNamespaceURI(this.items[t]) === z.HTML) return t;
		return -1;
	}
	indexOfTopmostByName(e, t) {
		if (this.indexed) {
			let n = di(e, Ar(t));
			return n === -1 && (n = this._nameKey(e, t, !1)), n === -1 ? -1 : this.keyTops[n];
		}
		for (let n = this.stackTop; n >= 0; n--) {
			let r = this.items[n];
			if (this.treeAdapter.getTagName(r) === t && this.treeAdapter.getNamespaceURI(r) === e) return n;
		}
		return -1;
	}
	indexOfTopmostHtmlElement() {
		if (this.indexed) return this.stackTop === -1 ? -1 : this.htmlSlots[this.stackTop];
		let e = this.stackTop;
		for (; e >= 0 && this.treeAdapter.getNamespaceURI(this.items[e]) !== z.HTML;) e--;
		return e;
	}
	_hasAbove(e, t) {
		for (let n = this.stackTop; n > e; n--) {
			let e = di(this.treeAdapter.getNamespaceURI(this.items[n]), this.tagIDs[n]);
			if (e !== -1 && li[e] & t) return !0;
		}
		return !1;
	}
	hasSpecialElementAbove(e) {
		return this.indexed ? this.specials[this.stackTop] !== this.specials[e] : this._hasAbove(e, ri);
	}
	hasListItemBoundaryAbove(e) {
		return this.indexed ? this.listItemBoundaries[this.stackTop] !== this.listItemBoundaries[e] : this._hasAbove(e, ii);
	}
	push(e, t) {
		let n = this.stackTop;
		this.stackTop++, this.depth++, this.items[this.stackTop] = e, this.current = e, this.tagIDs[this.stackTop] = t, this.currentTagId = t, this.indexed ? this._index(this.stackTop, n) : this.depth === qr && this._indexAll(), this._isInTemplate() && this.tmplCount++, this.handler.onItemPush(e, t, !0);
	}
	_popCurrent() {
		this.tmplCount > 0 && this._isInTemplate() && this.tmplCount--, this.indexed ? (this._unindex(this.stackTop), this.stackTop = this.below[this.stackTop], this.stackTop !== -1 && (this.above[this.stackTop] = -1)) : this.stackTop--, this.depth--, this._updateCurrentElement();
	}
	pop() {
		let e = this.current;
		this._popCurrent(), this.handler.onItemPop(e, !0);
	}
	replace(e, t) {
		let n = this._indexOf(e);
		this.items[n] = t, this.indexed && ui[this.tagIDs[n]] && (this.formattingSlots.delete(e), this.formattingSlots.set(t, n)), n === this.stackTop && (this.current = t);
	}
	replaceFormattingElement(e, t, n, r) {
		let i = this.items[e];
		if (!this.indexed) {
			this.items.splice(e, 1), this.tagIDs.splice(e, 1), this.handler.onItemPop(i, !1), this.items.splice(t, 0, n), this.tagIDs.splice(t, 0, r), t === this.stackTop && this._updateCurrentElement(), this.current && this.currentTagId !== void 0 && this.handler.onItemPush(this.current, this.currentTagId, t === this.stackTop);
			return;
		}
		let a = this.keys[e], o = this.below[e], s = this.above[t], c = [];
		for (let n = this.above[e]; n !== t; n = this.above[n]) c.push(n);
		let l = this.keyNext[e];
		this._unindex(e), this.items[e] = void 0, this.handler.onItemPop(i, !1);
		let u = t - 1;
		for (; c.length > 0 && c[c.length - 1] === u;) c.pop(), u--;
		for (let e = u + 1; e <= t; e++) this._move(e, e - 1);
		let d = l === -1 ? this.keyTops[a] : this.keyPrev[l];
		this.items[t] = n, this.tagIDs[t] = r, this.keys[t] = a, this.keyPrev[t] = d, this.keyNext[t] = l, d !== -1 && (this.keyNext[d] = t), l === -1 ? this.keyTops[a] = t : this.keyPrev[l] = t, ui[r] && this.formattingSlots.set(n, t);
		let f = o;
		for (let e of c) this._link(e, f, !0), f = e;
		for (let e = u; e < t; e++) this._link(e, f, !0), f = e;
		this._link(t, f, !0), s === -1 && this._updateCurrentElement(), this.current && this.currentTagId !== void 0 && this.handler.onItemPush(this.current, this.currentTagId, s === -1);
	}
	popUntilTagNamePopped(e) {
		this.shortenToLength(Math.max(this.indexOfTopmost(e), 0));
	}
	shortenToLength(e) {
		for (; this.stackTop >= e;) {
			let t = this.current;
			this._popCurrent(), this.handler.onItemPop(t, this.stackTop < e);
		}
	}
	popUntilElementPopped(e) {
		let t = this._indexOf(e);
		this.shortenToLength(Math.max(t, 0));
	}
	popUntilNumberedHeaderPopped() {
		this.shortenToLength(Math.max(this.indexOfTopmostOf(Zr), 0));
	}
	popUntilTableCellPopped() {
		this.shortenToLength(Math.max(this.indexOfTopmostOf(ni), 0));
	}
	popAllUpToHtmlElement() {
		this.tmplCount = 0, this.shortenToLength(1);
	}
	clearBackToTableContext() {
		this.shortenToLength(this.indexOfTopmostOf(ti) + 1);
	}
	clearBackToTableBodyContext() {
		this.shortenToLength(this.indexOfTopmostOf(ei) + 1);
	}
	clearBackToTableRowContext() {
		this.shortenToLength(this.indexOfTopmostOf($r) + 1);
	}
	remove(e) {
		let t = this._indexOf(e);
		t !== -1 && this.removeAt(t);
	}
	removeAt(e) {
		if (e === this.stackTop) {
			this.pop();
			return;
		}
		let t = this.items[e];
		if (this.depth--, this.indexed) {
			let t = this.keys[e] < Xr ? li[this.keys[e]] : 0, n = this.below[e], r = this.above[e];
			if (this._unindex(e), this.items[e] = void 0, this.below[r] = n, n !== -1 && (this.above[n] = r), t !== 0) for (let e = r; e !== -1; e = this.above[e]) this.specials[e] -= t & ri, this.listItemBoundaries[e] -= (t & ii) >> 1, this.scopeBoundaries[e] -= (t & ai) >> 2;
			let i = n === -1 ? -1 : this.htmlSlots[n];
			for (let t = r; t !== -1 && this.htmlSlots[t] === e; t = this.above[t]) this.htmlSlots[t] = i;
		} else this.items.splice(e, 1), this.tagIDs.splice(e, 1), this.stackTop--, this._updateCurrentElement();
		this.handler.onItemPop(t, !1);
	}
	tryPeekProperlyNestedBodyElement() {
		return this.stackTop >= 1 && this.tagIDs[1] === V.BODY ? this.items[1] : null;
	}
	contains(e) {
		return this._indexOf(e) > -1;
	}
	getCommonAncestor(e) {
		let t = this._indexOf(e), n = t === -1 ? -1 : this.slotBelow(t);
		return n === -1 ? null : this.items[n];
	}
	isRootHtmlElementCurrent() {
		return this.stackTop === 0 && this.tagIDs[0] === V.HTML;
	}
	_isInScope(e, t) {
		let n = -1;
		switch (t) {
			case oi:
				n = Math.max(this.keyTops[V.OL], this.keyTops[V.UL]);
				break;
			case si:
				n = this.keyTops[V.BUTTON];
				break;
			case ci: return n = Math.max(this.keyTops[V.TABLE], this.keyTops[V.HTML]), e === -1 ? n === -1 : e >= n;
		}
		return e === -1 ? n === -1 && (this.stackTop === -1 || this.scopeBoundaries[this.stackTop] === 0) : e >= n && this.scopeBoundaries[this.stackTop] === this.scopeBoundaries[e];
	}
	_scanScope(e, t, n, r) {
		for (let i = this.stackTop; i >= 0; i--) {
			let a = di(this.treeAdapter.getNamespaceURI(this.items[i]), this.tagIDs[i]);
			if (a !== -1) {
				if ((t ? t.includes(a) : a === e) && (!r || this.items[i] === r)) return !0;
				if (li[a] & n) return !1;
			}
		}
		return !0;
	}
	hasInScope(e, t) {
		return this.indexed ? this._isInScope(t ? this._indexOf(t) : this.keyTops[e], ai) : this._scanScope(e, null, ai, t);
	}
	hasInListItemScope(e) {
		return this.indexed ? this._isInScope(this.keyTops[e], oi) : this._scanScope(e, null, oi);
	}
	hasInButtonScope(e) {
		return this.indexed ? this._isInScope(this.keyTops[e], si) : this._scanScope(e, null, si);
	}
	hasNumberedHeaderInScope() {
		return this.indexed ? this._isInScope(this.indexOfTopmostOf(Zr), ai) : this._scanScope(V.UNKNOWN, Zr, ai);
	}
	hasInTableScope(e) {
		return this.indexed ? this._isInScope(this.keyTops[e], ci) : this._scanScope(e, null, ci);
	}
	hasTableBodyContextInTableScope() {
		return this.indexed ? this._isInScope(this.indexOfTopmostOf(Qr), ci) : this._scanScope(V.UNKNOWN, Qr, ci);
	}
	hasInSelectScope(e) {
		for (let t = this.stackTop; t >= 0; t = this.slotBelow(t)) if (this.treeAdapter.getNamespaceURI(this.items[t]) === z.HTML) switch (this.tagIDs[t]) {
			case e: return !0;
			case V.OPTION:
			case V.OPTGROUP: break;
			default: return !1;
		}
		return !0;
	}
	generateImpliedEndTags() {
		for (; this.currentTagId !== void 0 && Gr.has(this.currentTagId) && this.treeAdapter.getNamespaceURI(this.current) === z.HTML;) this.pop();
	}
	generateImpliedEndTagsThoroughly() {
		for (; this.currentTagId !== void 0 && Kr.has(this.currentTagId) && this.treeAdapter.getNamespaceURI(this.current) === z.HTML;) this.pop();
	}
	generateImpliedEndTagsWithExclusion(e) {
		for (; this.currentTagId !== void 0 && this.currentTagId !== e && Kr.has(this.currentTagId) && this.treeAdapter.getNamespaceURI(this.current) === z.HTML;) this.pop();
	}
}, pi = 3, mi;
(function(e) {
	e[e.Marker = 0] = "Marker", e[e.Element = 1] = "Element";
})(mi ||= {});
var hi = class {
	constructor() {
		this.newest = null, this.bookmark = null, this.index = null, this.elementEntries = /* @__PURE__ */ new Map();
	}
	_insertElementEntry(e, t, n) {
		let r = n === null ? null : n.newer, i = {
			type: mi.Element,
			element: e,
			token: t,
			older: n,
			newer: r,
			ark: null,
			olderSameTag: null,
			newerSameTag: null
		};
		return r === null ? this.newest = i : r.older = i, n !== null && (n.newer = i), this.index === null ? null : this._addToIndex(this.index, i);
	}
	_addToIndex(e, t) {
		let { tagName: n, attrs: r } = t.token, i = n + r.map(({ name: e, value: t }) => `\0${e}\0${t}`).sort().join(""), a = e.arks.get(i);
		a === void 0 && (a = {
			entries: [],
			key: i
		}, e.arks.set(i, a)), a.entries.push(t), t.ark = a, this.elementEntries.set(t.element, t);
		let o = e.tagNames.get(n);
		return o === void 0 && (o = { olderSameTag: null }, e.tagNames.set(n, o)), t.olderSameTag = o.olderSameTag, t.newerSameTag = o, o.olderSameTag !== null && (o.olderSameTag.newerSameTag = t), o.olderSameTag = t, a;
	}
	insertMarker() {
		if (this.index === null) for (let e = this.newest; e !== null && e.type === mi.Element; e = e.older) this.elementEntries.set(e.element, e);
		let e = {
			type: mi.Marker,
			older: this.newest,
			newer: null,
			outerIndex: this.index
		};
		this.newest !== null && (this.newest.newer = e), this.newest = e, this.index = null;
	}
	pushElement(e, t) {
		if (this.index === null) {
			let e = null, t = 0;
			for (let n = this.newest; n !== null && n.type === mi.Element; n = n.older) e = n, t++;
			if (t >= pi) {
				this.index = {
					arks: /* @__PURE__ */ new Map(),
					tagNames: /* @__PURE__ */ new Map()
				};
				for (let t = e; t !== null && t.type === mi.Element; t = t.newer) this._addToIndex(this.index, t);
			}
		}
		let n = this._insertElementEntry(e, t, this.newest);
		n !== null && n.entries.length > pi && this.removeEntry(n.entries[0]);
	}
	insertElementAfterBookmark(e, t) {
		let { bookmark: n } = this;
		this.bookmark = null, this._insertElementEntry(e, t, n);
	}
	removeEntry(e) {
		var t;
		if (!(e.newer === null ? this.newest !== e : e.newer.older !== e)) {
			if (this.elementEntries.delete(e.element), e.newer === null ? this.newest = e.older : e.newer.older = e.older, e.older !== null && (e.older.newer = e.newer), e.ark !== null) {
				let { entries: n, key: r } = e.ark;
				n.splice(n.indexOf(e), 1), n.length === 0 && ((t = this.index) == null || t.arks.delete(r));
			}
			e.newerSameTag !== null && (e.newerSameTag.olderSameTag = e.olderSameTag, e.olderSameTag !== null && (e.olderSameTag.newerSameTag = e.newerSameTag));
		}
	}
	replaceElement(e, t) {
		this.elementEntries.delete(e.element) && this.elementEntries.set(t, e), e.element = t;
	}
	clearToLastMarker() {
		let e = this.newest;
		for (; e !== null && e.type === mi.Element; e = e.older) this.elementEntries.delete(e.element);
		this.newest = e === null ? null : e.older, this.index = e === null ? null : e.outerIndex, this.newest !== null && (this.newest.newer = null);
	}
	getElementEntryInScopeWithTagName(e) {
		if (this.index !== null) return this.index.tagNames.get(e)?.olderSameTag ?? null;
		for (let t = this.newest; t !== null && t.type === mi.Element; t = t.older) if (t.token.tagName === e) return t;
		return null;
	}
	getElementEntry(e) {
		if (this.index === null) {
			for (let t = this.newest; t !== null && t.type === mi.Element; t = t.older) if (t.element === e) return t;
		}
		return this.elementEntries.get(e);
	}
}, gi = /* @__PURE__ */ new WeakMap(), _i = {
	createDocument() {
		return {
			nodeName: "#document",
			mode: Or.NO_QUIRKS,
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
		let { childNodes: r } = e, i = r[r.length - 1] === n ? r.length - 1 : r.indexOf(n);
		r.splice(i, 0, t), t.parentNode = e;
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
			_i.appendChild(e, i);
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
			let { childNodes: t } = e.parentNode, n = t[t.length - 1] === e ? t.length - 1 : t.indexOf(e);
			t.splice(n, 1), e.parentNode = null;
		}
	},
	insertText(e, t) {
		if (e.childNodes.length > 0) {
			let n = e.childNodes[e.childNodes.length - 1];
			if (_i.isTextNode(n)) {
				n.value += t;
				return;
			}
		}
		_i.appendChild(e, _i.createTextNode(t));
	},
	insertTextBefore(e, t, n) {
		let { childNodes: r } = e, i = r[(r[r.length - 1] === n ? r.length - 1 : r.indexOf(n)) - 1];
		i && _i.isTextNode(i) ? i.value += t : _i.insertBefore(e, _i.createTextNode(t), n);
	},
	adoptAttributes(e, t) {
		if (t.length === 0 || t === e.attrs) return;
		let n = gi.get(e.attrs), r = n?.size === e.attrs.length && t.every(({ name: t }) => {
			let r = n.get(t);
			return r === void 0 || e.attrs[r]?.name === t;
		}), i = r ? n : /* @__PURE__ */ new Map();
		if (!r) {
			for (let t = 0; t < e.attrs.length; t++) {
				let n = e.attrs[t];
				n !== void 0 && i.set(n.name, t);
			}
			gi.set(e.attrs, i);
		}
		let a = e.attrs.length;
		for (let n = 0; n < t.length; n++) i.has(t[n].name) || e.attrs.push(t[n]);
		for (let t = a; t < e.attrs.length; t++) i.set(e.attrs[t].name, t);
		i.size !== e.attrs.length && gi.delete(e.attrs);
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
}, vi = "html", yi = "about:legacy-compat", bi = "http://www.ibm.com/data/dtd/v11/ibmxhtml1-transitional.dtd", xi = /* @__PURE__ */ "+//silmaril//dtd html pro v0r11 19970101//,-//as//dtd html 3.0 aswedit + extensions//,-//advasoft ltd//dtd html 3.0 aswedit + extensions//,-//ietf//dtd html 2.0 level 1//,-//ietf//dtd html 2.0 level 2//,-//ietf//dtd html 2.0 strict level 1//,-//ietf//dtd html 2.0 strict level 2//,-//ietf//dtd html 2.0 strict//,-//ietf//dtd html 2.0//,-//ietf//dtd html 2.1e//,-//ietf//dtd html 3.0//,-//ietf//dtd html 3.2 final//,-//ietf//dtd html 3.2//,-//ietf//dtd html 3//,-//ietf//dtd html level 0//,-//ietf//dtd html level 1//,-//ietf//dtd html level 2//,-//ietf//dtd html level 3//,-//ietf//dtd html strict level 0//,-//ietf//dtd html strict level 1//,-//ietf//dtd html strict level 2//,-//ietf//dtd html strict level 3//,-//ietf//dtd html strict//,-//ietf//dtd html//,-//metrius//dtd metrius presentational//,-//microsoft//dtd internet explorer 2.0 html strict//,-//microsoft//dtd internet explorer 2.0 html//,-//microsoft//dtd internet explorer 2.0 tables//,-//microsoft//dtd internet explorer 3.0 html strict//,-//microsoft//dtd internet explorer 3.0 html//,-//microsoft//dtd internet explorer 3.0 tables//,-//netscape comm. corp.//dtd html//,-//netscape comm. corp.//dtd strict html//,-//o'reilly and associates//dtd html 2.0//,-//o'reilly and associates//dtd html extended 1.0//,-//o'reilly and associates//dtd html extended relaxed 1.0//,-//sq//dtd html 2.0 hotmetal + extensions//,-//softquad software//dtd hotmetal pro 6.0::19990601::extensions to html 4.0//,-//softquad//dtd hotmetal pro 4.0::19971010::extensions to html 4.0//,-//spyglass//dtd html 2.0 extended//,-//sun microsystems corp.//dtd hotjava html//,-//sun microsystems corp.//dtd hotjava strict html//,-//w3c//dtd html 3 1995-03-24//,-//w3c//dtd html 3.2 draft//,-//w3c//dtd html 3.2 final//,-//w3c//dtd html 3.2//,-//w3c//dtd html 3.2s draft//,-//w3c//dtd html 4.0 frameset//,-//w3c//dtd html 4.0 transitional//,-//w3c//dtd html experimental 19960712//,-//w3c//dtd html experimental 970421//,-//w3c//dtd w3 html//,-//w3o//dtd w3 html 3.0//,-//webtechs//dtd mozilla html 2.0//,-//webtechs//dtd mozilla html//".split(","), Si = [
	...xi,
	"-//w3c//dtd html 4.01 frameset//",
	"-//w3c//dtd html 4.01 transitional//"
], Ci = /* @__PURE__ */ new Set([
	"-//w3o//dtd w3 html strict 3.0//en//",
	"-/w3c/dtd html 4.0 transitional/en",
	"html"
]), wi = ["-//w3c//dtd xhtml 1.0 frameset//", "-//w3c//dtd xhtml 1.0 transitional//"], Ti = [
	...wi,
	"-//w3c//dtd html 4.01 frameset//",
	"-//w3c//dtd html 4.01 transitional//"
];
function Ei(e, t) {
	return t.some((t) => e.startsWith(t));
}
function Di(e) {
	return e.name === vi && e.publicId === null && (e.systemId === null || e.systemId === yi);
}
function Oi(e) {
	if (e.name !== vi) return Or.QUIRKS;
	let { systemId: t } = e;
	if (t && t.toLowerCase() === bi) return Or.QUIRKS;
	let { publicId: n } = e;
	if (n !== null) {
		if (n = n.toLowerCase(), Ci.has(n)) return Or.QUIRKS;
		let e = t === null ? Si : xi;
		if (Ei(n, e)) return Or.QUIRKS;
		if (e = t === null ? wi : Ti, Ei(n, e)) return Or.LIMITED_QUIRKS;
	}
	return Or.NO_QUIRKS;
}
// node_modules/.pnpm/parse5@8.1.1/node_modules/parse5/dist/common/foreign-content.js
var ki = {
	TEXT_HTML: "text/html",
	APPLICATION_XML: "application/xhtml+xml"
}, Ai = "definitionurl", ji = "definitionURL", Mi = new Map((/* @__PURE__ */ "attributeName.attributeType.baseFrequency.baseProfile.calcMode.clipPathUnits.diffuseConstant.edgeMode.filterUnits.glyphRef.gradientTransform.gradientUnits.kernelMatrix.kernelUnitLength.keyPoints.keySplines.keyTimes.lengthAdjust.limitingConeAngle.markerHeight.markerUnits.markerWidth.maskContentUnits.maskUnits.numOctaves.pathLength.patternContentUnits.patternTransform.patternUnits.pointsAtX.pointsAtY.pointsAtZ.preserveAlpha.preserveAspectRatio.primitiveUnits.refX.refY.repeatCount.repeatDur.requiredExtensions.requiredFeatures.specularConstant.specularExponent.spreadMethod.startOffset.stdDeviation.stitchTiles.surfaceScale.systemLanguage.tableValues.targetX.targetY.textLength.viewBox.viewTarget.xChannelSelector.yChannelSelector.zoomAndPan".split(".")).map((e) => [e.toLowerCase(), e])), Ni = /* @__PURE__ */ new Map([
	["xlink:actuate", {
		prefix: "xlink",
		name: "actuate",
		namespace: z.XLINK
	}],
	["xlink:arcrole", {
		prefix: "xlink",
		name: "arcrole",
		namespace: z.XLINK
	}],
	["xlink:href", {
		prefix: "xlink",
		name: "href",
		namespace: z.XLINK
	}],
	["xlink:role", {
		prefix: "xlink",
		name: "role",
		namespace: z.XLINK
	}],
	["xlink:show", {
		prefix: "xlink",
		name: "show",
		namespace: z.XLINK
	}],
	["xlink:title", {
		prefix: "xlink",
		name: "title",
		namespace: z.XLINK
	}],
	["xlink:type", {
		prefix: "xlink",
		name: "type",
		namespace: z.XLINK
	}],
	["xml:lang", {
		prefix: "xml",
		name: "lang",
		namespace: z.XML
	}],
	["xml:space", {
		prefix: "xml",
		name: "space",
		namespace: z.XML
	}],
	["xmlns", {
		prefix: "",
		name: "xmlns",
		namespace: z.XMLNS
	}],
	["xmlns:xlink", {
		prefix: "xmlns",
		name: "xlink",
		namespace: z.XMLNS
	}]
]), Pi = new Map((/* @__PURE__ */ "altGlyph.altGlyphDef.altGlyphItem.animateColor.animateMotion.animateTransform.clipPath.feBlend.feColorMatrix.feComponentTransfer.feComposite.feConvolveMatrix.feDiffuseLighting.feDisplacementMap.feDistantLight.feFlood.feFuncA.feFuncB.feFuncG.feFuncR.feGaussianBlur.feImage.feMerge.feMergeNode.feMorphology.feOffset.fePointLight.feSpecularLighting.feSpotLight.feTile.feTurbulence.foreignObject.glyphRef.linearGradient.radialGradient.textPath".split(".")).map((e) => [e.toLowerCase(), e])), Fi = /* @__PURE__ */ new Set([
	V.B,
	V.BIG,
	V.BLOCKQUOTE,
	V.BODY,
	V.BR,
	V.CENTER,
	V.CODE,
	V.DD,
	V.DIV,
	V.DL,
	V.DT,
	V.EM,
	V.EMBED,
	V.H1,
	V.H2,
	V.H3,
	V.H4,
	V.H5,
	V.H6,
	V.HEAD,
	V.HR,
	V.I,
	V.IMG,
	V.LI,
	V.LISTING,
	V.MENU,
	V.META,
	V.NOBR,
	V.OL,
	V.P,
	V.PRE,
	V.RUBY,
	V.S,
	V.SMALL,
	V.SPAN,
	V.STRONG,
	V.STRIKE,
	V.SUB,
	V.SUP,
	V.TABLE,
	V.TT,
	V.U,
	V.UL,
	V.VAR
]);
function Ii(e) {
	let t = e.tagID;
	return t === V.FONT && e.attrs.some(({ name: e }) => e === Dr.COLOR || e === Dr.SIZE || e === Dr.FACE) || Fi.has(t);
}
function Li(e) {
	for (let t = 0; t < e.attrs.length; t++) if (e.attrs[t].name === Ai) {
		e.attrs[t].name = ji;
		break;
	}
}
function Ri(e) {
	for (let t = 0; t < e.attrs.length; t++) {
		let n = Mi.get(e.attrs[t].name);
		n != null && (e.attrs[t].name = n);
	}
}
function zi(e) {
	for (let t = 0; t < e.attrs.length; t++) {
		let n = Ni.get(e.attrs[t].name);
		n && (e.attrs[t].prefix = n.prefix, e.attrs[t].name = n.name, e.attrs[t].namespace = n.namespace);
	}
}
function Bi(e) {
	let t = Pi.get(e.tagName);
	t != null && (e.tagName = t, e.tagID = Ar(e.tagName));
}
function Vi(e, t) {
	return t === z.MATHML && (e === V.MI || e === V.MO || e === V.MN || e === V.MS || e === V.MTEXT);
}
function Hi(e, t, n) {
	if (t === z.MATHML && e === V.ANNOTATION_XML) {
		for (let e = 0; e < n.length; e++) if (n[e].name === Dr.ENCODING) {
			let t = n[e].value.toLowerCase();
			return t === ki.TEXT_HTML || t === ki.APPLICATION_XML;
		}
	}
	return t === z.SVG && (e === V.FOREIGN_OBJECT || e === V.DESC || e === V.TITLE);
}
function Ui(e, t, n, r) {
	return (!r || r === z.HTML) && Hi(e, t, n) || (!r || r === z.MATHML) && Vi(e, t);
}
// node_modules/.pnpm/parse5@8.1.1/node_modules/parse5/dist/parser/index.js
var Wi = [
	V.TR,
	V.TBODY,
	V.THEAD,
	V.TFOOT,
	V.CAPTION,
	V.COLGROUP,
	V.TABLE,
	V.FRAMESET,
	V.SELECT,
	V.TEMPLATE,
	V.TD,
	V.TH,
	V.HEAD,
	V.BODY,
	V.HTML
], Gi = "hidden", Ki = [], qi = 8, Ji = 3, W;
(function(e) {
	e[e.INITIAL = 0] = "INITIAL", e[e.BEFORE_HTML = 1] = "BEFORE_HTML", e[e.BEFORE_HEAD = 2] = "BEFORE_HEAD", e[e.IN_HEAD = 3] = "IN_HEAD", e[e.IN_HEAD_NO_SCRIPT = 4] = "IN_HEAD_NO_SCRIPT", e[e.AFTER_HEAD = 5] = "AFTER_HEAD", e[e.IN_BODY = 6] = "IN_BODY", e[e.TEXT = 7] = "TEXT", e[e.IN_TABLE = 8] = "IN_TABLE", e[e.IN_TABLE_TEXT = 9] = "IN_TABLE_TEXT", e[e.IN_CAPTION = 10] = "IN_CAPTION", e[e.IN_COLUMN_GROUP = 11] = "IN_COLUMN_GROUP", e[e.IN_TABLE_BODY = 12] = "IN_TABLE_BODY", e[e.IN_ROW = 13] = "IN_ROW", e[e.IN_CELL = 14] = "IN_CELL", e[e.IN_SELECT = 15] = "IN_SELECT", e[e.IN_SELECT_IN_TABLE = 16] = "IN_SELECT_IN_TABLE", e[e.IN_TEMPLATE = 17] = "IN_TEMPLATE", e[e.AFTER_BODY = 18] = "AFTER_BODY", e[e.IN_FRAMESET = 19] = "IN_FRAMESET", e[e.AFTER_FRAMESET = 20] = "AFTER_FRAMESET", e[e.AFTER_AFTER_BODY = 21] = "AFTER_AFTER_BODY", e[e.AFTER_AFTER_FRAMESET = 22] = "AFTER_AFTER_FRAMESET";
})(W ||= {});
var Yi = {
	startLine: -1,
	startCol: -1,
	startOffset: -1,
	endLine: -1,
	endCol: -1,
	endOffset: -1
}, Xi = /* @__PURE__ */ new Set([
	V.TABLE,
	V.TBODY,
	V.TFOOT,
	V.THEAD,
	V.TR
]), Zi = {
	scriptingEnabled: !0,
	sourceCodeLocationInfo: !1,
	treeAdapter: _i,
	onParseError: null
}, Qi = class {
	constructor(e, t, n = null, r = null) {
		this.fragmentContext = n, this.scriptHandler = r, this.currentToken = null, this.stopped = !1, this.insertionMode = W.INITIAL, this.originalInsertionMode = W.INITIAL, this.headElement = null, this.formElement = null, this.currentNotInHTML = !1, this.tmplInsertionModeStack = [], this.pendingCharacterTokens = [], this.hasNonWhitespacePendingCharacterToken = !1, this.framesetOk = !0, this.skipNextNewLine = !1, this.fosterParentingEnabled = !1, this.options = {
			...Zi,
			...e
		}, this.treeAdapter = this.options.treeAdapter, this.onParseError = this.options.onParseError, this.onParseError && (this.options.sourceCodeLocationInfo = !0), this.document = t ?? this.treeAdapter.createDocument(), this.tokenizer = new Wr(this.options, this), this.activeFormattingElements = new hi(), this.fragmentContextID = n ? Ar(this.treeAdapter.getTagName(n)) : V.UNKNOWN, this._setContextModes(n ?? this.document, this.fragmentContextID), this.openElements = new fi(this.document, this.treeAdapter, this);
	}
	static parse(e, t) {
		let n = new this(t);
		return n.tokenizer.write(e, !0), n.document;
	}
	static getFragmentParser(e, t) {
		let n = {
			...Zi,
			...t
		};
		e ??= n.treeAdapter.createElement(B.TEMPLATE, z.HTML, []);
		let r = n.treeAdapter.createElement("documentmock", z.HTML, []), i = new this(n, r, e);
		return i.fragmentContextID === V.TEMPLATE && i.tmplInsertionModeStack.push(W.IN_TEMPLATE), i._initTokenizerForFragmentParsing(), i._insertFakeRootElement(), i._resetInsertionMode(), i._findFormInFragmentContext(), i;
	}
	getFragment() {
		let e = this.treeAdapter.getFirstChild(this.document), t = this.treeAdapter.createDocumentFragment();
		return this._adoptNodes(e, t), t;
	}
	_err(e, t, n) {
		if (!this.onParseError) return;
		let r = e.location ?? Yi, i = {
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
		var n, r, i;
		if (this.options.sourceCodeLocationInfo && this._setEndLocation(e, this.currentToken), (r = (n = this.treeAdapter).onItemPop) == null || r.call(n, e, this.openElements.current), (i = this.annotationXmlIntegrationPoints) == null || i.delete(e), t) {
			let e, t;
			this.openElements.stackTop === 0 && this.fragmentContext ? (e = this.fragmentContext, t = this.fragmentContextID) : {current: e, currentTagId: t} = this.openElements, this._setContextModes(e, t);
		}
	}
	_setContextModes(e, t) {
		let n = e === this.document || e && this.treeAdapter.getNamespaceURI(e) === z.HTML;
		this.currentNotInHTML = !n, this.tokenizer.inForeignNode = !n && e !== void 0 && t !== void 0 && !this._isIntegrationPoint(t, e);
	}
	_switchToTextParsing(e, t) {
		this._insertElement(e, z.HTML), this.tokenizer.state = t, this.originalInsertionMode = this.insertionMode, this.insertionMode = W.TEXT;
	}
	switchToPlaintextParsing() {
		this.insertionMode = W.TEXT, this.originalInsertionMode = W.IN_BODY, this.tokenizer.state = Pr.PLAINTEXT;
	}
	_getAdjustedCurrentElement() {
		return this.openElements.stackTop === 0 && this.fragmentContext ? this.fragmentContext : this.openElements.current;
	}
	_findFormInFragmentContext() {
		let e = this.fragmentContext;
		for (; e;) {
			if (this.treeAdapter.getTagName(e) === B.FORM && this.treeAdapter.getNamespaceURI(e) === z.HTML) {
				this.formElement = e;
				break;
			}
			e = this.treeAdapter.getParentNode(e);
		}
	}
	_initTokenizerForFragmentParsing() {
		if (this.fragmentContext && this.treeAdapter.getNamespaceURI(this.fragmentContext) === z.HTML) switch (this.fragmentContextID) {
			case V.TITLE:
			case V.TEXTAREA:
				this.tokenizer.state = Pr.RCDATA;
				break;
			case V.STYLE:
			case V.XMP:
			case V.IFRAME:
			case V.NOEMBED:
			case V.NOFRAMES:
			case V.NOSCRIPT:
				this.tokenizer.state = Pr.RAWTEXT;
				break;
			case V.SCRIPT:
				this.tokenizer.state = Pr.SCRIPT_DATA;
				break;
			case V.PLAINTEXT: this.tokenizer.state = Pr.PLAINTEXT;
		}
	}
	_setDocumentType(e) {
		let t = e.name || "", n = e.publicId || "", r = e.systemId || "";
		if (this.treeAdapter.setDocumentType(this.document, t, n, r), e.location) {
			let t = this.treeAdapter.getChildNodes(this.document).find((e) => this.treeAdapter.isDocumentTypeNode(e));
			t && this.treeAdapter.setNodeSourceCodeLocation(t, e.location);
		}
	}
	_attachElementToTree(e, t, n) {
		if (this.options.sourceCodeLocationInfo) {
			let n = t && {
				...t,
				startTag: t
			};
			this.treeAdapter.setNodeSourceCodeLocation(e, n);
		}
		n.beforeElement ? this.treeAdapter.insertBefore(n.parent, e, n.beforeElement) : this.treeAdapter.appendChild(n.parent, e);
	}
	_getInsertionLocation() {
		return this._shouldFosterParentOnInsertion() ? this._findFosterParentingLocation() : {
			parent: this.openElements.currentTmplContentOrNode ?? this.document,
			beforeElement: null
		};
	}
	_createElement(e, t, n, r) {
		var i, a;
		let o = this.treeAdapter.createElement(e, t, n);
		return (a = (i = this.treeAdapter).onElementCreated) == null || a.call(i, o, {
			intendedParent: r,
			formElement: this.formElement,
			isInTemplate: this.openElements.tmplCount > 0
		}), o;
	}
	_appendElement(e, t) {
		let n = this._getInsertionLocation(), r = this._createElement(e.tagName, t, e.attrs, n.parent);
		this._attachElementToTree(r, e.location, n);
	}
	_insertElement(e, t) {
		let n = this._getInsertionLocation(), r = this._createElement(e.tagName, t, e.attrs, n.parent);
		this._attachElementToTree(r, e.location, n), this.openElements.push(r, e.tagID);
	}
	_insertFakeElement(e, t) {
		let n = this._getInsertionLocation(), r = this._createElement(e, z.HTML, [], n.parent);
		this._attachElementToTree(r, null, n), this.openElements.push(r, t);
	}
	_insertTemplate(e) {
		let t = this._getInsertionLocation(), n = this._createElement(e.tagName, z.HTML, e.attrs, t.parent), r = this.treeAdapter.createDocumentFragment();
		this.treeAdapter.setTemplateContent(n, r), this._attachElementToTree(n, e.location, t), this.openElements.push(n, e.tagID), this.options.sourceCodeLocationInfo && this.treeAdapter.setNodeSourceCodeLocation(r, null);
	}
	_insertFakeRootElement() {
		let e = this._createElement(B.HTML, z.HTML, [], this.document);
		this.options.sourceCodeLocationInfo && this.treeAdapter.setNodeSourceCodeLocation(e, null), this.treeAdapter.appendChild(this.document, e), this.openElements.push(e, V.HTML);
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
		let n = [...this.treeAdapter.getChildNodes(e)];
		for (let e = n.length - 1; e >= 0; e--) this.treeAdapter.detachNode(n[e]);
		for (let e of n) this.treeAdapter.appendChild(t, e);
	}
	_setEndLocation(e, t) {
		if (this.treeAdapter.getNodeSourceCodeLocation(e) && t.location) {
			let n = t.location, r = this.treeAdapter.getTagName(e), i = t.type === R.END_TAG && r === t.tagName ? {
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
		return this.openElements.stackTop === 0 && this.fragmentContext ? (t = this.fragmentContext, n = this.fragmentContextID) : {current: t, currentTagId: n} = this.openElements, e.tagID === V.SVG && this.treeAdapter.getTagName(t) === B.ANNOTATION_XML && this.treeAdapter.getNamespaceURI(t) === z.MATHML ? !1 : this.tokenizer.inForeignNode || (e.tagID === V.MGLYPH || e.tagID === V.MALIGNMARK) && n !== void 0 && !this._isIntegrationPoint(n, t, z.HTML);
	}
	_processToken(e) {
		switch (e.type) {
			case R.CHARACTER:
				this.onCharacter(e);
				break;
			case R.NULL_CHARACTER:
				this.onNullCharacter(e);
				break;
			case R.COMMENT:
				this.onComment(e);
				break;
			case R.DOCTYPE:
				this.onDoctype(e);
				break;
			case R.START_TAG:
				this._processStartTag(e);
				break;
			case R.END_TAG:
				this.onEndTag(e);
				break;
			case R.EOF:
				this.onEof(e);
				break;
			case R.WHITESPACE_CHARACTER: this.onWhitespaceCharacter(e);
		}
	}
	_isIntegrationPoint(e, t, n) {
		let r = this.treeAdapter.getNamespaceURI(t);
		if (e === V.ANNOTATION_XML && r === z.MATHML && n !== z.MATHML) {
			let n = this.annotationXmlIntegrationPoints ??= /* @__PURE__ */ new Map(), i = n.get(t);
			return i === void 0 && (i = Ui(e, r, this.treeAdapter.getAttrList(t)), n.set(t, i)), i;
		}
		return Ui(e, r, Ki, n);
	}
	_reconstructActiveFormattingElements() {
		let e = null;
		for (let t = this.activeFormattingElements.newest; t !== null && t.type === mi.Element && !this.openElements.contains(t.element); t = t.older) e = t;
		for (let t = e; t !== null && t.type === mi.Element; t = t.newer) this._insertElement(t.token, this.treeAdapter.getNamespaceURI(t.element)), this.activeFormattingElements.replaceElement(t, this.openElements.current);
	}
	_closeTableCell() {
		this.openElements.generateImpliedEndTags(), this.openElements.popUntilTableCellPopped(), this.activeFormattingElements.clearToLastMarker(), this.insertionMode = W.IN_ROW;
	}
	_closePElement() {
		this.openElements.generateImpliedEndTagsWithExclusion(V.P), this.openElements.popUntilTagNamePopped(V.P);
	}
	_resetInsertionMode() {
		let e = this.openElements.indexOfTopmostOf(Wi), t = e === 0 && this.fragmentContext ? this.fragmentContextID : this.openElements.tagIDs[e], n = e === 0 && this.fragmentContext ? this.fragmentContext : this.openElements.items[e];
		if (n !== void 0 && this.treeAdapter.getNamespaceURI(n) === z.HTML) switch (t) {
			case V.TR:
				this.insertionMode = W.IN_ROW;
				return;
			case V.TBODY:
			case V.THEAD:
			case V.TFOOT:
				this.insertionMode = W.IN_TABLE_BODY;
				return;
			case V.CAPTION:
				this.insertionMode = W.IN_CAPTION;
				return;
			case V.COLGROUP:
				this.insertionMode = W.IN_COLUMN_GROUP;
				return;
			case V.TABLE:
				this.insertionMode = W.IN_TABLE;
				return;
			case V.BODY:
				this.insertionMode = W.IN_BODY;
				return;
			case V.FRAMESET:
				this.insertionMode = W.IN_FRAMESET;
				return;
			case V.SELECT:
				this._resetInsertionModeForSelect(e);
				return;
			case V.TEMPLATE:
				this.insertionMode = this.tmplInsertionModeStack[this.tmplInsertionModeStack.length - 1];
				return;
			case V.HTML:
				this.insertionMode = this.headElement ? W.AFTER_HEAD : W.BEFORE_HEAD;
				return;
			case V.TD:
			case V.TH:
				if (e > 0) {
					this.insertionMode = W.IN_CELL;
					return;
				}
				break;
			case V.HEAD: if (e > 0) {
				this.insertionMode = W.IN_HEAD;
				return;
			}
		}
		this.insertionMode = W.IN_BODY;
	}
	_resetInsertionModeForSelect(e) {
		if (e > 0) {
			let e = this.openElements.indexOfTopmost(V.TABLE);
			if (e > 0 && e > this.openElements.indexOfTopmost(V.TEMPLATE)) {
				this.insertionMode = W.IN_SELECT_IN_TABLE;
				return;
			}
		}
		this.insertionMode = W.IN_SELECT;
	}
	_isElementCausesFosterParenting(e) {
		return Xi.has(e);
	}
	_shouldFosterParentOnInsertion() {
		return this.fosterParentingEnabled && this.openElements.currentTagId !== void 0 && this._isElementCausesFosterParenting(this.openElements.currentTagId);
	}
	_findFosterParentingLocation() {
		let { openElements: e } = this, t = e.indexOfTopmost(V.TABLE), n = e.indexOfTopmost(V.TEMPLATE);
		if (n > t) return {
			parent: this.treeAdapter.getTemplateContent(e.items[n]),
			beforeElement: null
		};
		if (t !== -1) {
			let n = e.items[t], r = this.treeAdapter.getParentNode(n);
			return r ? {
				parent: r,
				beforeElement: n
			} : {
				parent: e.items[e.slotBelow(t)],
				beforeElement: null
			};
		}
		return {
			parent: e.items[0],
			beforeElement: null
		};
	}
	_fosterParentElement(e) {
		let t = this._findFosterParentingLocation();
		t.beforeElement ? this.treeAdapter.insertBefore(t.parent, e, t.beforeElement) : this.treeAdapter.appendChild(t.parent, e);
	}
	_isSpecialElement(e, t) {
		return jr[this.treeAdapter.getNamespaceURI(e)].has(t);
	}
	onCharacter(e) {
		if (this.skipNextNewLine = !1, this.tokenizer.inForeignNode) _s(this, e);
		else switch (this.insertionMode) {
			case W.INITIAL:
				da(this, e);
				break;
			case W.BEFORE_HTML:
				ma(this, e);
				break;
			case W.BEFORE_HEAD:
				_a(this, e);
				break;
			case W.IN_HEAD:
				xa(this, e);
				break;
			case W.IN_HEAD_NO_SCRIPT:
				wa(this, e);
				break;
			case W.AFTER_HEAD:
				Da(this, e);
				break;
			case W.IN_BODY:
			case W.IN_CAPTION:
			case W.IN_CELL:
			case W.IN_TEMPLATE:
				Aa(this, e);
				break;
			case W.TEXT:
			case W.IN_SELECT:
			case W.IN_SELECT_IN_TABLE:
				this._insertCharacters(e);
				break;
			case W.IN_TABLE:
			case W.IN_TABLE_BODY:
			case W.IN_ROW:
				Eo(this, e);
				break;
			case W.IN_TABLE_TEXT:
				zo(this, e);
				break;
			case W.IN_COLUMN_GROUP:
				Ko(this, e);
				break;
			case W.AFTER_BODY:
				cs(this, e);
				break;
			case W.AFTER_AFTER_BODY: ms(this, e);
		}
	}
	onNullCharacter(e) {
		if (this.skipNextNewLine = !1, this.tokenizer.inForeignNode) gs(this, e);
		else switch (this.insertionMode) {
			case W.INITIAL:
				da(this, e);
				break;
			case W.BEFORE_HTML:
				ma(this, e);
				break;
			case W.BEFORE_HEAD:
				_a(this, e);
				break;
			case W.IN_HEAD:
				xa(this, e);
				break;
			case W.IN_HEAD_NO_SCRIPT:
				wa(this, e);
				break;
			case W.AFTER_HEAD:
				Da(this, e);
				break;
			case W.TEXT:
				this._insertCharacters(e);
				break;
			case W.IN_TABLE:
			case W.IN_TABLE_BODY:
			case W.IN_ROW:
				Eo(this, e);
				break;
			case W.IN_COLUMN_GROUP:
				Ko(this, e);
				break;
			case W.AFTER_BODY:
				cs(this, e);
				break;
			case W.AFTER_AFTER_BODY: ms(this, e);
		}
	}
	onComment(e) {
		if (this.skipNextNewLine = !1, this.currentNotInHTML) oa(this, e);
		else switch (this.insertionMode) {
			case W.INITIAL:
			case W.BEFORE_HTML:
			case W.BEFORE_HEAD:
			case W.IN_HEAD:
			case W.IN_HEAD_NO_SCRIPT:
			case W.AFTER_HEAD:
			case W.IN_BODY:
			case W.IN_TABLE:
			case W.IN_CAPTION:
			case W.IN_COLUMN_GROUP:
			case W.IN_TABLE_BODY:
			case W.IN_ROW:
			case W.IN_CELL:
			case W.IN_SELECT:
			case W.IN_SELECT_IN_TABLE:
			case W.IN_TEMPLATE:
			case W.IN_FRAMESET:
			case W.AFTER_FRAMESET:
				oa(this, e);
				break;
			case W.IN_TABLE_TEXT:
				Bo(this, e);
				break;
			case W.AFTER_BODY:
				sa(this, e);
				break;
			case W.AFTER_AFTER_BODY:
			case W.AFTER_AFTER_FRAMESET: ca(this, e);
		}
	}
	onDoctype(e) {
		switch (this.skipNextNewLine = !1, this.insertionMode) {
			case W.INITIAL:
				ua(this, e);
				break;
			case W.BEFORE_HEAD:
			case W.IN_HEAD:
			case W.IN_HEAD_NO_SCRIPT:
			case W.AFTER_HEAD:
				this._err(e, L.misplacedDoctype);
				break;
			case W.IN_TABLE_TEXT: Bo(this, e);
		}
	}
	onStartTag(e) {
		this.skipNextNewLine = !1, this.currentToken = e, this._processStartTag(e), e.selfClosing && !e.ackSelfClosing && this._err(e, L.nonVoidHtmlElementStartTagWithTrailingSolidus);
	}
	_processStartTag(e) {
		this.shouldProcessStartTagTokenInForeignContent(e) ? ys(this, e) : this._startTagOutsideForeignContent(e);
	}
	_startTagOutsideForeignContent(e) {
		switch (this.insertionMode) {
			case W.INITIAL:
				da(this, e);
				break;
			case W.BEFORE_HTML:
				fa(this, e);
				break;
			case W.BEFORE_HEAD:
				ha(this, e);
				break;
			case W.IN_HEAD:
				va(this, e);
				break;
			case W.IN_HEAD_NO_SCRIPT:
				Sa(this, e);
				break;
			case W.AFTER_HEAD:
				Ta(this, e);
				break;
			case W.IN_BODY:
				lo(this, e);
				break;
			case W.IN_TABLE:
				Fo(this, e);
				break;
			case W.IN_TABLE_TEXT:
				Bo(this, e);
				break;
			case W.IN_CAPTION:
				Ho(this, e);
				break;
			case W.IN_COLUMN_GROUP:
				Wo(this, e);
				break;
			case W.IN_TABLE_BODY:
				qo(this, e);
				break;
			case W.IN_ROW:
				Yo(this, e);
				break;
			case W.IN_CELL:
				Zo(this, e);
				break;
			case W.IN_SELECT:
				$o(this, e);
				break;
			case W.IN_SELECT_IN_TABLE:
				ts(this, e);
				break;
			case W.IN_TEMPLATE:
				rs(this, e);
				break;
			case W.AFTER_BODY:
				os(this, e);
				break;
			case W.IN_FRAMESET:
				ls(this, e);
				break;
			case W.AFTER_FRAMESET:
				ds(this, e);
				break;
			case W.AFTER_AFTER_BODY:
				ps(this, e);
				break;
			case W.AFTER_AFTER_FRAMESET: hs(this, e);
		}
	}
	onEndTag(e) {
		this.skipNextNewLine = !1, this.currentToken = e, this.currentNotInHTML ? bs(this, e) : this._endTagOutsideForeignContent(e);
	}
	_endTagOutsideForeignContent(e) {
		switch (this.insertionMode) {
			case W.INITIAL:
				da(this, e);
				break;
			case W.BEFORE_HTML:
				pa(this, e);
				break;
			case W.BEFORE_HEAD:
				ga(this, e);
				break;
			case W.IN_HEAD:
				ya(this, e);
				break;
			case W.IN_HEAD_NO_SCRIPT:
				Ca(this, e);
				break;
			case W.AFTER_HEAD:
				Ea(this, e);
				break;
			case W.IN_BODY:
				So(this, e);
				break;
			case W.TEXT:
				wo(this, e);
				break;
			case W.IN_TABLE:
				Io(this, e);
				break;
			case W.IN_TABLE_TEXT:
				Bo(this, e);
				break;
			case W.IN_CAPTION:
				Uo(this, e);
				break;
			case W.IN_COLUMN_GROUP:
				Go(this, e);
				break;
			case W.IN_TABLE_BODY:
				Jo(this, e);
				break;
			case W.IN_ROW:
				Xo(this, e);
				break;
			case W.IN_CELL:
				Qo(this, e);
				break;
			case W.IN_SELECT:
				es(this, e);
				break;
			case W.IN_SELECT_IN_TABLE:
				ns(this, e);
				break;
			case W.IN_TEMPLATE:
				is(this, e);
				break;
			case W.AFTER_BODY:
				ss(this, e);
				break;
			case W.IN_FRAMESET:
				us(this, e);
				break;
			case W.AFTER_FRAMESET:
				fs(this, e);
				break;
			case W.AFTER_AFTER_BODY: ms(this, e);
		}
	}
	onEof(e) {
		switch (this.insertionMode) {
			case W.INITIAL:
				da(this, e);
				break;
			case W.BEFORE_HTML:
				ma(this, e);
				break;
			case W.BEFORE_HEAD:
				_a(this, e);
				break;
			case W.IN_HEAD:
				xa(this, e);
				break;
			case W.IN_HEAD_NO_SCRIPT:
				wa(this, e);
				break;
			case W.AFTER_HEAD:
				Da(this, e);
				break;
			case W.IN_BODY:
			case W.IN_TABLE:
			case W.IN_CAPTION:
			case W.IN_COLUMN_GROUP:
			case W.IN_TABLE_BODY:
			case W.IN_ROW:
			case W.IN_CELL:
			case W.IN_SELECT:
			case W.IN_SELECT_IN_TABLE:
				Co(this, e);
				break;
			case W.TEXT:
				To(this, e);
				break;
			case W.IN_TABLE_TEXT:
				Bo(this, e);
				break;
			case W.IN_TEMPLATE:
				as(this, e);
				break;
			case W.AFTER_BODY:
			case W.IN_FRAMESET:
			case W.AFTER_FRAMESET:
			case W.AFTER_AFTER_BODY:
			case W.AFTER_AFTER_FRAMESET: la(this, e);
		}
	}
	onWhitespaceCharacter(e) {
		if (this.skipNextNewLine && (this.skipNextNewLine = !1, e.chars.charCodeAt(0) === I.LINE_FEED)) {
			if (e.chars.length === 1) return;
			e.chars = e.chars.substr(1);
		}
		if (this.tokenizer.inForeignNode) this._insertCharacters(e);
		else switch (this.insertionMode) {
			case W.IN_HEAD:
			case W.IN_HEAD_NO_SCRIPT:
			case W.AFTER_HEAD:
			case W.TEXT:
			case W.IN_COLUMN_GROUP:
			case W.IN_SELECT:
			case W.IN_SELECT_IN_TABLE:
			case W.IN_FRAMESET:
			case W.AFTER_FRAMESET:
				this._insertCharacters(e);
				break;
			case W.IN_BODY:
			case W.IN_CAPTION:
			case W.IN_CELL:
			case W.IN_TEMPLATE:
			case W.AFTER_BODY:
			case W.AFTER_AFTER_BODY:
			case W.AFTER_AFTER_FRAMESET:
				ka(this, e);
				break;
			case W.IN_TABLE:
			case W.IN_TABLE_BODY:
			case W.IN_ROW:
				Eo(this, e);
				break;
			case W.IN_TABLE_TEXT: Ro(this, e);
		}
	}
};
function $i(e, t) {
	let n = e.activeFormattingElements.getElementEntryInScopeWithTagName(t.tagName);
	return n ? e.openElements.contains(n.element) ? e.openElements.hasInScope(t.tagID, n.element) || (n = null) : (e.activeFormattingElements.removeEntry(n), n = null) : xo(e, t), n;
}
function ea(e, t) {
	let { openElements: n } = e, r = n._indexOf(t.element);
	for (let t = n.slotAbove(r); t !== -1; t = n.slotAbove(t)) if (e._isSpecialElement(n.items[t], n.tagIDs[t])) return t;
	return n.shortenToLength(r), e.activeFormattingElements.removeEntry(t), -1;
}
function ta(e, t, n) {
	let r = e.openElements.items[t], i = r, a = e.openElements.slotBelow(t), o = e.openElements.getCommonAncestor(n);
	for (let t = 0, s = a; e.openElements.items[s] !== n; t++, s = a) {
		let n = e.openElements.items[s];
		a = e.openElements.slotBelow(s);
		let c = e.activeFormattingElements.getElementEntry(n), l = c && t >= Ji;
		!c || l ? (l && e.activeFormattingElements.removeEntry(c), e.openElements.removeAt(s)) : (n = na(e, c, o), i === r && (e.activeFormattingElements.bookmark = c), e.treeAdapter.detachNode(i), e.treeAdapter.appendChild(n, i), i = n);
	}
	return i;
}
function na(e, t, n) {
	let r = e.treeAdapter.getNamespaceURI(t.element), i = e._createElement(t.token.tagName, r, t.token.attrs, n);
	return e.openElements.replace(t.element, i), e.activeFormattingElements.replaceElement(t, i), i;
}
function ra(e, t, n) {
	let r = Ar(e.treeAdapter.getTagName(t));
	if (e._isElementCausesFosterParenting(r)) e._fosterParentElement(n);
	else {
		let i = e.treeAdapter.getNamespaceURI(t);
		r === V.TEMPLATE && i === z.HTML && (t = e.treeAdapter.getTemplateContent(t)), e.treeAdapter.appendChild(t, n);
	}
}
function ia(e, t, n) {
	let r = e.treeAdapter.getNamespaceURI(n.element), { token: i } = n, a = e._createElement(i.tagName, r, i.attrs, t);
	e._adoptNodes(t, a), e.treeAdapter.appendChild(t, a), e.activeFormattingElements.insertElementAfterBookmark(a, i), e.activeFormattingElements.removeEntry(n);
	let o = e.openElements._indexOf(n.element), s = e.openElements.slotAbove(o);
	for (; e.openElements.items[s] !== t;) s = e.openElements.slotAbove(s);
	e.openElements.replaceFormattingElement(o, s, a, i.tagID);
}
function aa(e, t) {
	let { current: n, currentTagId: r } = e.openElements;
	if (r === t.tagID && e.treeAdapter.getNamespaceURI(n) === z.HTML && !e.activeFormattingElements.getElementEntry(n)) e.openElements.pop();
	else for (let n = 0; n < qi; n++) {
		let n = $i(e, t);
		if (!n) break;
		let r = ea(e, n);
		if (r === -1) break;
		let i = e.openElements.items[r];
		e.activeFormattingElements.bookmark = n;
		let a = ta(e, r, n.element), o = e.openElements.getCommonAncestor(n.element);
		e.treeAdapter.detachNode(a), o && ra(e, o, a), ia(e, i, n);
	}
}
function oa(e, t) {
	e._appendCommentNode(t, e.openElements.currentTmplContentOrNode);
}
function sa(e, t) {
	e._appendCommentNode(t, e.openElements.items[0]);
}
function ca(e, t) {
	e._appendCommentNode(t, e.document);
}
function la(e, t) {
	if (e.stopped = !0, t.location) {
		let n = e.fragmentContext ? 0 : 2;
		for (let r = e.openElements.stackTop; r >= n; r = e.openElements.slotBelow(r)) e._setEndLocation(e.openElements.items[r], t);
		if (!e.fragmentContext && e.openElements.stackTop >= 0) {
			let n = e.openElements.items[0], r = e.treeAdapter.getNodeSourceCodeLocation(n);
			if (r && !r.endTag && (e._setEndLocation(n, t), e.openElements.stackTop >= 1)) {
				let n = e.openElements.items[1], r = e.treeAdapter.getNodeSourceCodeLocation(n);
				r && !r.endTag && e._setEndLocation(n, t);
			}
		}
	}
}
function ua(e, t) {
	e._setDocumentType(t);
	let n = t.forceQuirks ? Or.QUIRKS : Oi(t);
	Di(t) || e._err(t, L.nonConformingDoctype), e.treeAdapter.setDocumentMode(e.document, n), e.insertionMode = W.BEFORE_HTML;
}
function da(e, t) {
	e._err(t, L.missingDoctype, !0), e.treeAdapter.setDocumentMode(e.document, Or.QUIRKS), e.insertionMode = W.BEFORE_HTML, e._processToken(t);
}
function fa(e, t) {
	t.tagID === V.HTML ? (e._insertElement(t, z.HTML), e.insertionMode = W.BEFORE_HEAD) : ma(e, t);
}
function pa(e, t) {
	let n = t.tagID;
	(n === V.HTML || n === V.HEAD || n === V.BODY || n === V.BR) && ma(e, t);
}
function ma(e, t) {
	e._insertFakeRootElement(), e.insertionMode = W.BEFORE_HEAD, e._processToken(t);
}
function ha(e, t) {
	switch (t.tagID) {
		case V.HTML:
			lo(e, t);
			break;
		case V.HEAD:
			e._insertElement(t, z.HTML), e.headElement = e.openElements.current, e.insertionMode = W.IN_HEAD;
			break;
		default: _a(e, t);
	}
}
function ga(e, t) {
	let n = t.tagID;
	n === V.HEAD || n === V.BODY || n === V.HTML || n === V.BR ? _a(e, t) : e._err(t, L.endTagWithoutMatchingOpenElement);
}
function _a(e, t) {
	e._insertFakeElement(B.HEAD, V.HEAD), e.headElement = e.openElements.current, e.insertionMode = W.IN_HEAD, e._processToken(t);
}
function va(e, t) {
	switch (t.tagID) {
		case V.HTML:
			lo(e, t);
			break;
		case V.BASE:
		case V.BASEFONT:
		case V.BGSOUND:
		case V.LINK:
		case V.META:
			e._appendElement(t, z.HTML), t.ackSelfClosing = !0;
			break;
		case V.TITLE:
			e._switchToTextParsing(t, Pr.RCDATA);
			break;
		case V.NOSCRIPT:
			e.options.scriptingEnabled ? e._switchToTextParsing(t, Pr.RAWTEXT) : (e._insertElement(t, z.HTML), e.insertionMode = W.IN_HEAD_NO_SCRIPT);
			break;
		case V.NOFRAMES:
		case V.STYLE:
			e._switchToTextParsing(t, Pr.RAWTEXT);
			break;
		case V.SCRIPT:
			e._switchToTextParsing(t, Pr.SCRIPT_DATA);
			break;
		case V.TEMPLATE:
			e._insertTemplate(t), e.activeFormattingElements.insertMarker(), e.framesetOk = !1, e.insertionMode = W.IN_TEMPLATE, e.tmplInsertionModeStack.push(W.IN_TEMPLATE);
			break;
		case V.HEAD:
			e._err(t, L.misplacedStartTagForHeadElement);
			break;
		default: xa(e, t);
	}
}
function ya(e, t) {
	switch (t.tagID) {
		case V.HEAD:
			e.openElements.pop(), e.insertionMode = W.AFTER_HEAD;
			break;
		case V.BODY:
		case V.BR:
		case V.HTML:
			xa(e, t);
			break;
		case V.TEMPLATE:
			ba(e, t);
			break;
		default: e._err(t, L.endTagWithoutMatchingOpenElement);
	}
}
function ba(e, t) {
	e.openElements.tmplCount > 0 ? (e.openElements.generateImpliedEndTagsThoroughly(), e.openElements.currentTagId !== V.TEMPLATE && e._err(t, L.closingOfElementWithOpenChildElements), e.openElements.popUntilTagNamePopped(V.TEMPLATE), e.activeFormattingElements.clearToLastMarker(), e.tmplInsertionModeStack.pop(), e._resetInsertionMode()) : e._err(t, L.endTagWithoutMatchingOpenElement);
}
function xa(e, t) {
	e.openElements.pop(), e.insertionMode = W.AFTER_HEAD, e._processToken(t);
}
function Sa(e, t) {
	switch (t.tagID) {
		case V.HTML:
			lo(e, t);
			break;
		case V.BASEFONT:
		case V.BGSOUND:
		case V.HEAD:
		case V.LINK:
		case V.META:
		case V.NOFRAMES:
		case V.STYLE:
			va(e, t);
			break;
		case V.NOSCRIPT:
			e._err(t, L.nestedNoscriptInHead);
			break;
		default: wa(e, t);
	}
}
function Ca(e, t) {
	switch (t.tagID) {
		case V.NOSCRIPT:
			e.openElements.pop(), e.insertionMode = W.IN_HEAD;
			break;
		case V.BR:
			wa(e, t);
			break;
		default: e._err(t, L.endTagWithoutMatchingOpenElement);
	}
}
function wa(e, t) {
	let n = t.type === R.EOF ? L.openElementsLeftAfterEof : L.disallowedContentInNoscriptInHead;
	e._err(t, n), e.openElements.pop(), e.insertionMode = W.IN_HEAD, e._processToken(t);
}
function Ta(e, t) {
	switch (t.tagID) {
		case V.HTML:
			lo(e, t);
			break;
		case V.BODY:
			e._insertElement(t, z.HTML), e.framesetOk = !1, e.insertionMode = W.IN_BODY;
			break;
		case V.FRAMESET:
			e._insertElement(t, z.HTML), e.insertionMode = W.IN_FRAMESET;
			break;
		case V.BASE:
		case V.BASEFONT:
		case V.BGSOUND:
		case V.LINK:
		case V.META:
		case V.NOFRAMES:
		case V.SCRIPT:
		case V.STYLE:
		case V.TEMPLATE:
		case V.TITLE:
			e._err(t, L.abandonedHeadElementChild), e.openElements.push(e.headElement, V.HEAD), va(e, t), e.openElements.remove(e.headElement);
			break;
		case V.HEAD:
			e._err(t, L.misplacedStartTagForHeadElement);
			break;
		default: Da(e, t);
	}
}
function Ea(e, t) {
	switch (t.tagID) {
		case V.BODY:
		case V.HTML:
		case V.BR:
			Da(e, t);
			break;
		case V.TEMPLATE:
			ba(e, t);
			break;
		default: e._err(t, L.endTagWithoutMatchingOpenElement);
	}
}
function Da(e, t) {
	e._insertFakeElement(B.BODY, V.BODY), e.insertionMode = W.IN_BODY, Oa(e, t);
}
function Oa(e, t) {
	switch (t.type) {
		case R.CHARACTER:
			Aa(e, t);
			break;
		case R.WHITESPACE_CHARACTER:
			ka(e, t);
			break;
		case R.COMMENT:
			oa(e, t);
			break;
		case R.START_TAG:
			lo(e, t);
			break;
		case R.END_TAG:
			So(e, t);
			break;
		case R.EOF: Co(e, t);
	}
}
function ka(e, t) {
	e._reconstructActiveFormattingElements(), e._insertCharacters(t);
}
function Aa(e, t) {
	e._reconstructActiveFormattingElements(), e._insertCharacters(t), e.framesetOk = !1;
}
function ja(e, t) {
	e.openElements.tmplCount === 0 && e.treeAdapter.adoptAttributes(e.openElements.items[0], t.attrs);
}
function Ma(e, t) {
	let n = e.openElements.tryPeekProperlyNestedBodyElement();
	n && e.openElements.tmplCount === 0 && (e.framesetOk = !1, e.treeAdapter.adoptAttributes(n, t.attrs));
}
function Na(e, t) {
	let n = e.openElements.tryPeekProperlyNestedBodyElement();
	e.framesetOk && n && (e.treeAdapter.detachNode(n), e.openElements.popAllUpToHtmlElement(), e._insertElement(t, z.HTML), e.insertionMode = W.IN_FRAMESET);
}
function Pa(e, t) {
	e.openElements.hasInButtonScope(V.P) && e._closePElement(), e._insertElement(t, z.HTML);
}
function Fa(e, t) {
	e.openElements.hasInButtonScope(V.P) && e._closePElement(), e.openElements.currentTagId !== void 0 && Mr.has(e.openElements.currentTagId) && e.openElements.pop(), e._insertElement(t, z.HTML);
}
function Ia(e, t) {
	e.openElements.hasInButtonScope(V.P) && e._closePElement(), e._insertElement(t, z.HTML), e.skipNextNewLine = !0, e.framesetOk = !1;
}
function La(e, t) {
	let n = e.openElements.tmplCount > 0;
	(!e.formElement || n) && (e.openElements.hasInButtonScope(V.P) && e._closePElement(), e._insertElement(t, z.HTML), n || (e.formElement = e.openElements.current));
}
function Ra(e, t) {
	e.framesetOk = !1;
	let n = t.tagID === V.LI ? e.openElements.indexOfTopmost(V.LI) : Math.max(e.openElements.indexOfTopmost(V.DD), e.openElements.indexOfTopmost(V.DT));
	if (n !== -1 && !e.openElements.hasListItemBoundaryAbove(n)) {
		let t = e.openElements.tagIDs[n];
		e.openElements.generateImpliedEndTagsWithExclusion(t), e.openElements.popUntilTagNamePopped(t);
	}
	e.openElements.hasInButtonScope(V.P) && e._closePElement(), e._insertElement(t, z.HTML);
}
function za(e, t) {
	e.openElements.hasInButtonScope(V.P) && e._closePElement(), e._insertElement(t, z.HTML), e.tokenizer.state = Pr.PLAINTEXT;
}
function Ba(e, t) {
	e.openElements.hasInScope(V.BUTTON) && (e.openElements.generateImpliedEndTags(), e.openElements.popUntilTagNamePopped(V.BUTTON)), e._reconstructActiveFormattingElements(), e._insertElement(t, z.HTML), e.framesetOk = !1;
}
function Va(e, t) {
	let n = e.activeFormattingElements.getElementEntryInScopeWithTagName(B.A);
	n && (aa(e, t), e.openElements.remove(n.element), e.activeFormattingElements.removeEntry(n)), e._reconstructActiveFormattingElements(), e._insertElement(t, z.HTML), e.activeFormattingElements.pushElement(e.openElements.current, t);
}
function Ha(e, t) {
	e._reconstructActiveFormattingElements(), e._insertElement(t, z.HTML), e.activeFormattingElements.pushElement(e.openElements.current, t);
}
function Ua(e, t) {
	e._reconstructActiveFormattingElements(), e.openElements.hasInScope(V.NOBR) && (aa(e, t), e._reconstructActiveFormattingElements()), e._insertElement(t, z.HTML), e.activeFormattingElements.pushElement(e.openElements.current, t);
}
function Wa(e, t) {
	e._reconstructActiveFormattingElements(), e._insertElement(t, z.HTML), e.activeFormattingElements.insertMarker(), e.framesetOk = !1;
}
function Ga(e, t) {
	e.treeAdapter.getDocumentMode(e.document) !== Or.QUIRKS && e.openElements.hasInButtonScope(V.P) && e._closePElement(), e._insertElement(t, z.HTML), e.framesetOk = !1, e.insertionMode = W.IN_TABLE;
}
function Ka(e, t) {
	e._reconstructActiveFormattingElements(), e._appendElement(t, z.HTML), e.framesetOk = !1, t.ackSelfClosing = !0;
}
function qa(e) {
	let t = Mn(e, Dr.TYPE);
	return t != null && t.toLowerCase() === Gi;
}
function Ja(e, t) {
	e._reconstructActiveFormattingElements(), e._appendElement(t, z.HTML), qa(t) || (e.framesetOk = !1), t.ackSelfClosing = !0;
}
function Ya(e, t) {
	e._appendElement(t, z.HTML), t.ackSelfClosing = !0;
}
function Xa(e, t) {
	e.openElements.hasInButtonScope(V.P) && e._closePElement(), e._appendElement(t, z.HTML), e.framesetOk = !1, t.ackSelfClosing = !0;
}
function Za(e, t) {
	t.tagName = B.IMG, t.tagID = V.IMG, Ka(e, t);
}
function Qa(e, t) {
	e._insertElement(t, z.HTML), e.skipNextNewLine = !0, e.tokenizer.state = Pr.RCDATA, e.originalInsertionMode = e.insertionMode, e.framesetOk = !1, e.insertionMode = W.TEXT;
}
function $a(e, t) {
	e.openElements.hasInButtonScope(V.P) && e._closePElement(), e._reconstructActiveFormattingElements(), e.framesetOk = !1, e._switchToTextParsing(t, Pr.RAWTEXT);
}
function eo(e, t) {
	e.framesetOk = !1, e._switchToTextParsing(t, Pr.RAWTEXT);
}
function to(e, t) {
	e._switchToTextParsing(t, Pr.RAWTEXT);
}
function no(e, t) {
	e._reconstructActiveFormattingElements(), e._insertElement(t, z.HTML), e.framesetOk = !1, e.insertionMode = e.insertionMode === W.IN_TABLE || e.insertionMode === W.IN_CAPTION || e.insertionMode === W.IN_TABLE_BODY || e.insertionMode === W.IN_ROW || e.insertionMode === W.IN_CELL ? W.IN_SELECT_IN_TABLE : W.IN_SELECT;
}
function ro(e, t) {
	e.openElements.currentTagId === V.OPTION && e.openElements.pop(), e._reconstructActiveFormattingElements(), e._insertElement(t, z.HTML);
}
function io(e, t) {
	e.openElements.hasInScope(V.RUBY) && e.openElements.generateImpliedEndTags(), e._insertElement(t, z.HTML);
}
function ao(e, t) {
	e.openElements.hasInScope(V.RUBY) && e.openElements.generateImpliedEndTagsWithExclusion(V.RTC), e._insertElement(t, z.HTML);
}
function oo(e, t) {
	e._reconstructActiveFormattingElements(), Li(t), zi(t), t.selfClosing ? e._appendElement(t, z.MATHML) : e._insertElement(t, z.MATHML), t.ackSelfClosing = !0;
}
function so(e, t) {
	e._reconstructActiveFormattingElements(), Ri(t), zi(t), t.selfClosing ? e._appendElement(t, z.SVG) : e._insertElement(t, z.SVG), t.ackSelfClosing = !0;
}
function co(e, t) {
	e._reconstructActiveFormattingElements(), e._insertElement(t, z.HTML);
}
function lo(e, t) {
	switch (t.tagID) {
		case V.I:
		case V.S:
		case V.B:
		case V.U:
		case V.EM:
		case V.TT:
		case V.BIG:
		case V.CODE:
		case V.FONT:
		case V.SMALL:
		case V.STRIKE:
		case V.STRONG:
			Ha(e, t);
			break;
		case V.A:
			Va(e, t);
			break;
		case V.H1:
		case V.H2:
		case V.H3:
		case V.H4:
		case V.H5:
		case V.H6:
			Fa(e, t);
			break;
		case V.P:
		case V.DL:
		case V.OL:
		case V.UL:
		case V.DIV:
		case V.DIR:
		case V.NAV:
		case V.MAIN:
		case V.MENU:
		case V.ASIDE:
		case V.CENTER:
		case V.FIGURE:
		case V.FOOTER:
		case V.HEADER:
		case V.HGROUP:
		case V.DIALOG:
		case V.DETAILS:
		case V.ADDRESS:
		case V.ARTICLE:
		case V.SEARCH:
		case V.SECTION:
		case V.SUMMARY:
		case V.FIELDSET:
		case V.BLOCKQUOTE:
		case V.FIGCAPTION:
			Pa(e, t);
			break;
		case V.LI:
		case V.DD:
		case V.DT:
			Ra(e, t);
			break;
		case V.BR:
		case V.IMG:
		case V.WBR:
		case V.AREA:
		case V.EMBED:
		case V.KEYGEN:
			Ka(e, t);
			break;
		case V.HR:
			Xa(e, t);
			break;
		case V.RB:
		case V.RTC:
			io(e, t);
			break;
		case V.RT:
		case V.RP:
			ao(e, t);
			break;
		case V.PRE:
		case V.LISTING:
			Ia(e, t);
			break;
		case V.XMP:
			$a(e, t);
			break;
		case V.SVG:
			so(e, t);
			break;
		case V.HTML:
			ja(e, t);
			break;
		case V.BASE:
		case V.LINK:
		case V.META:
		case V.STYLE:
		case V.TITLE:
		case V.SCRIPT:
		case V.BGSOUND:
		case V.BASEFONT:
		case V.TEMPLATE:
			va(e, t);
			break;
		case V.BODY:
			Ma(e, t);
			break;
		case V.FORM:
			La(e, t);
			break;
		case V.NOBR:
			Ua(e, t);
			break;
		case V.MATH:
			oo(e, t);
			break;
		case V.TABLE:
			Ga(e, t);
			break;
		case V.INPUT:
			Ja(e, t);
			break;
		case V.PARAM:
		case V.TRACK:
		case V.SOURCE:
			Ya(e, t);
			break;
		case V.IMAGE:
			Za(e, t);
			break;
		case V.BUTTON:
			Ba(e, t);
			break;
		case V.APPLET:
		case V.OBJECT:
		case V.MARQUEE:
			Wa(e, t);
			break;
		case V.IFRAME:
			eo(e, t);
			break;
		case V.SELECT:
			no(e, t);
			break;
		case V.OPTION:
		case V.OPTGROUP:
			ro(e, t);
			break;
		case V.NOEMBED:
		case V.NOFRAMES:
			to(e, t);
			break;
		case V.FRAMESET:
			Na(e, t);
			break;
		case V.TEXTAREA:
			Qa(e, t);
			break;
		case V.NOSCRIPT:
			e.options.scriptingEnabled ? to(e, t) : co(e, t);
			break;
		case V.PLAINTEXT:
			za(e, t);
			break;
		case V.COL:
		case V.TH:
		case V.TD:
		case V.TR:
		case V.HEAD:
		case V.FRAME:
		case V.TBODY:
		case V.TFOOT:
		case V.THEAD:
		case V.CAPTION:
		case V.COLGROUP: break;
		default: co(e, t);
	}
}
function uo(e, t) {
	if (e.openElements.hasInScope(V.BODY) && (e.insertionMode = W.AFTER_BODY, e.options.sourceCodeLocationInfo)) {
		let n = e.openElements.tryPeekProperlyNestedBodyElement();
		n && e._setEndLocation(n, t);
	}
}
function fo(e, t) {
	e.openElements.hasInScope(V.BODY) && (e.insertionMode = W.AFTER_BODY, ss(e, t));
}
function po(e, t) {
	let n = t.tagID;
	e.openElements.hasInScope(n) && (e.openElements.generateImpliedEndTags(), e.openElements.popUntilTagNamePopped(n));
}
function mo(e) {
	let t = e.openElements.tmplCount > 0, { formElement: n } = e;
	t || (e.formElement = null), (n || t) && e.openElements.hasInScope(V.FORM) && (e.openElements.generateImpliedEndTags(), t ? e.openElements.popUntilTagNamePopped(V.FORM) : n && e.openElements.remove(n));
}
function ho(e) {
	e.openElements.hasInButtonScope(V.P) || e._insertFakeElement(B.P, V.P), e._closePElement();
}
function go(e) {
	e.openElements.hasInListItemScope(V.LI) && (e.openElements.generateImpliedEndTagsWithExclusion(V.LI), e.openElements.popUntilTagNamePopped(V.LI));
}
function _o(e, t) {
	let n = t.tagID;
	e.openElements.hasInScope(n) && (e.openElements.generateImpliedEndTagsWithExclusion(n), e.openElements.popUntilTagNamePopped(n));
}
function vo(e) {
	e.openElements.hasNumberedHeaderInScope() && (e.openElements.generateImpliedEndTags(), e.openElements.popUntilNumberedHeaderPopped());
}
function yo(e, t) {
	let n = t.tagID;
	e.openElements.hasInScope(n) && (e.openElements.generateImpliedEndTags(), e.openElements.popUntilTagNamePopped(n), e.activeFormattingElements.clearToLastMarker());
}
function bo(e) {
	e._reconstructActiveFormattingElements(), e._insertFakeElement(B.BR, V.BR), e.openElements.pop(), e.framesetOk = !1;
}
function xo(e, t) {
	let n = t.tagID, r = n === V.UNKNOWN ? e.openElements.indexOfTopmostByName(z.HTML, t.tagName) : e.openElements.indexOfTopmost(n);
	r > 0 && !e.openElements.hasSpecialElementAbove(r) && (e.openElements.generateImpliedEndTagsWithExclusion(n), e.openElements.stackTop >= r && e.openElements.shortenToLength(r));
}
function So(e, t) {
	switch (t.tagID) {
		case V.A:
		case V.B:
		case V.I:
		case V.S:
		case V.U:
		case V.EM:
		case V.TT:
		case V.BIG:
		case V.CODE:
		case V.FONT:
		case V.NOBR:
		case V.SMALL:
		case V.STRIKE:
		case V.STRONG:
			aa(e, t);
			break;
		case V.P:
			ho(e);
			break;
		case V.DL:
		case V.UL:
		case V.OL:
		case V.DIR:
		case V.DIV:
		case V.NAV:
		case V.PRE:
		case V.MAIN:
		case V.MENU:
		case V.ASIDE:
		case V.BUTTON:
		case V.CENTER:
		case V.FIGURE:
		case V.FOOTER:
		case V.HEADER:
		case V.HGROUP:
		case V.DIALOG:
		case V.ADDRESS:
		case V.ARTICLE:
		case V.DETAILS:
		case V.SEARCH:
		case V.SECTION:
		case V.SUMMARY:
		case V.LISTING:
		case V.FIELDSET:
		case V.BLOCKQUOTE:
		case V.FIGCAPTION:
			po(e, t);
			break;
		case V.LI:
			go(e);
			break;
		case V.DD:
		case V.DT:
			_o(e, t);
			break;
		case V.H1:
		case V.H2:
		case V.H3:
		case V.H4:
		case V.H5:
		case V.H6:
			vo(e);
			break;
		case V.BR:
			bo(e);
			break;
		case V.BODY:
			uo(e, t);
			break;
		case V.HTML:
			fo(e, t);
			break;
		case V.FORM:
			mo(e);
			break;
		case V.APPLET:
		case V.OBJECT:
		case V.MARQUEE:
			yo(e, t);
			break;
		case V.TEMPLATE:
			ba(e, t);
			break;
		default: xo(e, t);
	}
}
function Co(e, t) {
	e.tmplInsertionModeStack.length > 0 ? as(e, t) : la(e, t);
}
function wo(e, t) {
	var n;
	t.tagID === V.SCRIPT && ((n = e.scriptHandler) == null || n.call(e, e.openElements.current)), e.openElements.pop(), e.insertionMode = e.originalInsertionMode;
}
function To(e, t) {
	e._err(t, L.eofInElementThatCanContainOnlyText), e.openElements.pop(), e.insertionMode = e.originalInsertionMode, e.onEof(t);
}
function Eo(e, t) {
	if (e.openElements.currentTagId !== void 0 && Xi.has(e.openElements.currentTagId)) switch (e.pendingCharacterTokens.length = 0, e.hasNonWhitespacePendingCharacterToken = !1, e.originalInsertionMode = e.insertionMode, e.insertionMode = W.IN_TABLE_TEXT, t.type) {
		case R.CHARACTER:
			zo(e, t);
			break;
		case R.WHITESPACE_CHARACTER: Ro(e, t);
	}
	else Lo(e, t);
}
function Do(e, t) {
	e.openElements.clearBackToTableContext(), e.activeFormattingElements.insertMarker(), e._insertElement(t, z.HTML), e.insertionMode = W.IN_CAPTION;
}
function Oo(e, t) {
	e.openElements.clearBackToTableContext(), e._insertElement(t, z.HTML), e.insertionMode = W.IN_COLUMN_GROUP;
}
function ko(e, t) {
	e.openElements.clearBackToTableContext(), e._insertFakeElement(B.COLGROUP, V.COLGROUP), e.insertionMode = W.IN_COLUMN_GROUP, Wo(e, t);
}
function Ao(e, t) {
	e.openElements.clearBackToTableContext(), e._insertElement(t, z.HTML), e.insertionMode = W.IN_TABLE_BODY;
}
function jo(e, t) {
	e.openElements.clearBackToTableContext(), e._insertFakeElement(B.TBODY, V.TBODY), e.insertionMode = W.IN_TABLE_BODY, qo(e, t);
}
function Mo(e, t) {
	e.openElements.hasInTableScope(V.TABLE) && (e.openElements.popUntilTagNamePopped(V.TABLE), e._resetInsertionMode(), e._processStartTag(t));
}
function No(e, t) {
	qa(t) ? e._appendElement(t, z.HTML) : Lo(e, t), t.ackSelfClosing = !0;
}
function Po(e, t) {
	!e.formElement && e.openElements.tmplCount === 0 && (e._insertElement(t, z.HTML), e.formElement = e.openElements.current, e.openElements.pop());
}
function Fo(e, t) {
	switch (t.tagID) {
		case V.TD:
		case V.TH:
		case V.TR:
			jo(e, t);
			break;
		case V.STYLE:
		case V.SCRIPT:
		case V.TEMPLATE:
			va(e, t);
			break;
		case V.COL:
			ko(e, t);
			break;
		case V.FORM:
			Po(e, t);
			break;
		case V.TABLE:
			Mo(e, t);
			break;
		case V.TBODY:
		case V.TFOOT:
		case V.THEAD:
			Ao(e, t);
			break;
		case V.INPUT:
			No(e, t);
			break;
		case V.CAPTION:
			Do(e, t);
			break;
		case V.COLGROUP:
			Oo(e, t);
			break;
		default: Lo(e, t);
	}
}
function Io(e, t) {
	switch (t.tagID) {
		case V.TABLE:
			e.openElements.hasInTableScope(V.TABLE) && (e.openElements.popUntilTagNamePopped(V.TABLE), e._resetInsertionMode());
			break;
		case V.TEMPLATE:
			ba(e, t);
			break;
		case V.BODY:
		case V.CAPTION:
		case V.COL:
		case V.COLGROUP:
		case V.HTML:
		case V.TBODY:
		case V.TD:
		case V.TFOOT:
		case V.TH:
		case V.THEAD:
		case V.TR: break;
		default: Lo(e, t);
	}
}
function Lo(e, t) {
	let n = e.fosterParentingEnabled;
	e.fosterParentingEnabled = !0, Oa(e, t), e.fosterParentingEnabled = n;
}
function Ro(e, t) {
	e.pendingCharacterTokens.push(t);
}
function zo(e, t) {
	e.pendingCharacterTokens.push(t), e.hasNonWhitespacePendingCharacterToken = !0;
}
function Bo(e, t) {
	let n = 0;
	if (e.hasNonWhitespacePendingCharacterToken) for (; n < e.pendingCharacterTokens.length; n++) Lo(e, e.pendingCharacterTokens[n]);
	else for (; n < e.pendingCharacterTokens.length; n++) e._insertCharacters(e.pendingCharacterTokens[n]);
	e.insertionMode = e.originalInsertionMode, e._processToken(t);
}
var Vo = /* @__PURE__ */ new Set([
	V.CAPTION,
	V.COL,
	V.COLGROUP,
	V.TBODY,
	V.TD,
	V.TFOOT,
	V.TH,
	V.THEAD,
	V.TR
]);
function Ho(e, t) {
	let n = t.tagID;
	Vo.has(n) ? e.openElements.hasInTableScope(V.CAPTION) && (e.openElements.generateImpliedEndTags(), e.openElements.popUntilTagNamePopped(V.CAPTION), e.activeFormattingElements.clearToLastMarker(), e.insertionMode = W.IN_TABLE, Fo(e, t)) : lo(e, t);
}
function Uo(e, t) {
	let n = t.tagID;
	switch (n) {
		case V.CAPTION:
		case V.TABLE:
			e.openElements.hasInTableScope(V.CAPTION) && (e.openElements.generateImpliedEndTags(), e.openElements.popUntilTagNamePopped(V.CAPTION), e.activeFormattingElements.clearToLastMarker(), e.insertionMode = W.IN_TABLE, n === V.TABLE && Io(e, t));
			break;
		case V.BODY:
		case V.COL:
		case V.COLGROUP:
		case V.HTML:
		case V.TBODY:
		case V.TD:
		case V.TFOOT:
		case V.TH:
		case V.THEAD:
		case V.TR: break;
		default: So(e, t);
	}
}
function Wo(e, t) {
	switch (t.tagID) {
		case V.HTML:
			lo(e, t);
			break;
		case V.COL:
			e._appendElement(t, z.HTML), t.ackSelfClosing = !0;
			break;
		case V.TEMPLATE:
			va(e, t);
			break;
		default: Ko(e, t);
	}
}
function Go(e, t) {
	switch (t.tagID) {
		case V.COLGROUP:
			e.openElements.currentTagId === V.COLGROUP && (e.openElements.pop(), e.insertionMode = W.IN_TABLE);
			break;
		case V.TEMPLATE:
			ba(e, t);
			break;
		case V.COL: break;
		default: Ko(e, t);
	}
}
function Ko(e, t) {
	e.openElements.currentTagId === V.COLGROUP && (e.openElements.pop(), e.insertionMode = W.IN_TABLE, e._processToken(t));
}
function qo(e, t) {
	switch (t.tagID) {
		case V.TR:
			e.openElements.clearBackToTableBodyContext(), e._insertElement(t, z.HTML), e.insertionMode = W.IN_ROW;
			break;
		case V.TH:
		case V.TD:
			e.openElements.clearBackToTableBodyContext(), e._insertFakeElement(B.TR, V.TR), e.insertionMode = W.IN_ROW, Yo(e, t);
			break;
		case V.CAPTION:
		case V.COL:
		case V.COLGROUP:
		case V.TBODY:
		case V.TFOOT:
		case V.THEAD:
			e.openElements.hasTableBodyContextInTableScope() && (e.openElements.clearBackToTableBodyContext(), e.openElements.pop(), e.insertionMode = W.IN_TABLE, Fo(e, t));
			break;
		default: Fo(e, t);
	}
}
function Jo(e, t) {
	let n = t.tagID;
	switch (t.tagID) {
		case V.TBODY:
		case V.TFOOT:
		case V.THEAD:
			e.openElements.hasInTableScope(n) && (e.openElements.clearBackToTableBodyContext(), e.openElements.pop(), e.insertionMode = W.IN_TABLE);
			break;
		case V.TABLE:
			e.openElements.hasTableBodyContextInTableScope() && (e.openElements.clearBackToTableBodyContext(), e.openElements.pop(), e.insertionMode = W.IN_TABLE, Io(e, t));
			break;
		case V.BODY:
		case V.CAPTION:
		case V.COL:
		case V.COLGROUP:
		case V.HTML:
		case V.TD:
		case V.TH:
		case V.TR: break;
		default: Io(e, t);
	}
}
function Yo(e, t) {
	switch (t.tagID) {
		case V.TH:
		case V.TD:
			e.openElements.clearBackToTableRowContext(), e._insertElement(t, z.HTML), e.insertionMode = W.IN_CELL, e.activeFormattingElements.insertMarker();
			break;
		case V.CAPTION:
		case V.COL:
		case V.COLGROUP:
		case V.TBODY:
		case V.TFOOT:
		case V.THEAD:
		case V.TR:
			e.openElements.hasInTableScope(V.TR) && (e.openElements.clearBackToTableRowContext(), e.openElements.pop(), e.insertionMode = W.IN_TABLE_BODY, qo(e, t));
			break;
		default: Fo(e, t);
	}
}
function Xo(e, t) {
	switch (t.tagID) {
		case V.TR:
			e.openElements.hasInTableScope(V.TR) && (e.openElements.clearBackToTableRowContext(), e.openElements.pop(), e.insertionMode = W.IN_TABLE_BODY);
			break;
		case V.TABLE:
			e.openElements.hasInTableScope(V.TR) && (e.openElements.clearBackToTableRowContext(), e.openElements.pop(), e.insertionMode = W.IN_TABLE_BODY, Jo(e, t));
			break;
		case V.TBODY:
		case V.TFOOT:
		case V.THEAD:
			(e.openElements.hasInTableScope(t.tagID) || e.openElements.hasInTableScope(V.TR)) && (e.openElements.clearBackToTableRowContext(), e.openElements.pop(), e.insertionMode = W.IN_TABLE_BODY, Jo(e, t));
			break;
		case V.BODY:
		case V.CAPTION:
		case V.COL:
		case V.COLGROUP:
		case V.HTML:
		case V.TD:
		case V.TH: break;
		default: Io(e, t);
	}
}
function Zo(e, t) {
	let n = t.tagID;
	Vo.has(n) ? (e.openElements.hasInTableScope(V.TD) || e.openElements.hasInTableScope(V.TH)) && (e._closeTableCell(), Yo(e, t)) : lo(e, t);
}
function Qo(e, t) {
	let n = t.tagID;
	switch (n) {
		case V.TD:
		case V.TH:
			e.openElements.hasInTableScope(n) && (e.openElements.generateImpliedEndTags(), e.openElements.popUntilTagNamePopped(n), e.activeFormattingElements.clearToLastMarker(), e.insertionMode = W.IN_ROW);
			break;
		case V.TABLE:
		case V.TBODY:
		case V.TFOOT:
		case V.THEAD:
		case V.TR:
			e.openElements.hasInTableScope(n) && (e._closeTableCell(), Xo(e, t));
			break;
		case V.BODY:
		case V.CAPTION:
		case V.COL:
		case V.COLGROUP:
		case V.HTML: break;
		default: So(e, t);
	}
}
function $o(e, t) {
	switch (t.tagID) {
		case V.HTML:
			lo(e, t);
			break;
		case V.OPTION:
			e.openElements.currentTagId === V.OPTION && e.openElements.pop(), e._insertElement(t, z.HTML);
			break;
		case V.OPTGROUP:
			e.openElements.currentTagId === V.OPTION && e.openElements.pop(), e.openElements.currentTagId === V.OPTGROUP && e.openElements.pop(), e._insertElement(t, z.HTML);
			break;
		case V.HR:
			e.openElements.currentTagId === V.OPTION && e.openElements.pop(), e.openElements.currentTagId === V.OPTGROUP && e.openElements.pop(), e._appendElement(t, z.HTML), t.ackSelfClosing = !0;
			break;
		case V.INPUT:
		case V.KEYGEN:
		case V.TEXTAREA:
		case V.SELECT:
			e.openElements.hasInSelectScope(V.SELECT) && (e.openElements.popUntilTagNamePopped(V.SELECT), e._resetInsertionMode(), t.tagID !== V.SELECT && e._processStartTag(t));
			break;
		case V.SCRIPT:
		case V.TEMPLATE: va(e, t);
	}
}
function es(e, t) {
	switch (t.tagID) {
		case V.OPTGROUP:
			e.openElements.stackTop > 0 && e.openElements.currentTagId === V.OPTION && e.openElements.tagIDs[e.openElements.slotBelow(e.openElements.stackTop)] === V.OPTGROUP && e.openElements.pop(), e.openElements.currentTagId === V.OPTGROUP && e.openElements.pop();
			break;
		case V.OPTION:
			e.openElements.currentTagId === V.OPTION && e.openElements.pop();
			break;
		case V.SELECT:
			e.openElements.hasInSelectScope(V.SELECT) && (e.openElements.popUntilTagNamePopped(V.SELECT), e._resetInsertionMode());
			break;
		case V.TEMPLATE: ba(e, t);
	}
}
function ts(e, t) {
	let n = t.tagID;
	n === V.CAPTION || n === V.TABLE || n === V.TBODY || n === V.TFOOT || n === V.THEAD || n === V.TR || n === V.TD || n === V.TH ? (e.openElements.popUntilTagNamePopped(V.SELECT), e._resetInsertionMode(), e._processStartTag(t)) : $o(e, t);
}
function ns(e, t) {
	let n = t.tagID;
	n === V.CAPTION || n === V.TABLE || n === V.TBODY || n === V.TFOOT || n === V.THEAD || n === V.TR || n === V.TD || n === V.TH ? e.openElements.hasInTableScope(n) && (e.openElements.popUntilTagNamePopped(V.SELECT), e._resetInsertionMode(), e.onEndTag(t)) : es(e, t);
}
function rs(e, t) {
	switch (t.tagID) {
		case V.BASE:
		case V.BASEFONT:
		case V.BGSOUND:
		case V.LINK:
		case V.META:
		case V.NOFRAMES:
		case V.SCRIPT:
		case V.STYLE:
		case V.TEMPLATE:
		case V.TITLE:
			va(e, t);
			break;
		case V.CAPTION:
		case V.COLGROUP:
		case V.TBODY:
		case V.TFOOT:
		case V.THEAD:
			e.tmplInsertionModeStack[e.tmplInsertionModeStack.length - 1] = W.IN_TABLE, e.insertionMode = W.IN_TABLE, Fo(e, t);
			break;
		case V.COL:
			e.tmplInsertionModeStack[e.tmplInsertionModeStack.length - 1] = W.IN_COLUMN_GROUP, e.insertionMode = W.IN_COLUMN_GROUP, Wo(e, t);
			break;
		case V.TR:
			e.tmplInsertionModeStack[e.tmplInsertionModeStack.length - 1] = W.IN_TABLE_BODY, e.insertionMode = W.IN_TABLE_BODY, qo(e, t);
			break;
		case V.TD:
		case V.TH:
			e.tmplInsertionModeStack[e.tmplInsertionModeStack.length - 1] = W.IN_ROW, e.insertionMode = W.IN_ROW, Yo(e, t);
			break;
		default: e.tmplInsertionModeStack[e.tmplInsertionModeStack.length - 1] = W.IN_BODY, e.insertionMode = W.IN_BODY, lo(e, t);
	}
}
function is(e, t) {
	t.tagID === V.TEMPLATE && ba(e, t);
}
function as(e, t) {
	if (e.openElements.tmplCount > 0) {
		do
			e.openElements.popUntilTagNamePopped(V.TEMPLATE), e.activeFormattingElements.clearToLastMarker(), e.tmplInsertionModeStack.pop();
		while (e.openElements.tmplCount > 0);
		e._resetInsertionMode(), e.onEof(t);
	} else la(e, t);
}
function os(e, t) {
	t.tagID === V.HTML ? lo(e, t) : cs(e, t);
}
function ss(e, t) {
	if (t.tagID === V.HTML) {
		if (e.fragmentContext || (e.insertionMode = W.AFTER_AFTER_BODY), e.options.sourceCodeLocationInfo && e.openElements.tagIDs[0] === V.HTML) {
			e._setEndLocation(e.openElements.items[0], t);
			let n = e.openElements.items[1];
			n && !e.treeAdapter.getNodeSourceCodeLocation(n)?.endTag && e._setEndLocation(n, t);
		}
	} else cs(e, t);
}
function cs(e, t) {
	e.insertionMode = W.IN_BODY, Oa(e, t);
}
function ls(e, t) {
	switch (t.tagID) {
		case V.HTML:
			lo(e, t);
			break;
		case V.FRAMESET:
			e._insertElement(t, z.HTML);
			break;
		case V.FRAME:
			e._appendElement(t, z.HTML), t.ackSelfClosing = !0;
			break;
		case V.NOFRAMES: va(e, t);
	}
}
function us(e, t) {
	t.tagID === V.FRAMESET && !e.openElements.isRootHtmlElementCurrent() && (e.openElements.pop(), !e.fragmentContext && e.openElements.currentTagId !== V.FRAMESET && (e.insertionMode = W.AFTER_FRAMESET));
}
function ds(e, t) {
	switch (t.tagID) {
		case V.HTML:
			lo(e, t);
			break;
		case V.NOFRAMES: va(e, t);
	}
}
function fs(e, t) {
	t.tagID === V.HTML && (e.insertionMode = W.AFTER_AFTER_FRAMESET);
}
function ps(e, t) {
	t.tagID === V.HTML ? lo(e, t) : ms(e, t);
}
function ms(e, t) {
	e.insertionMode = W.IN_BODY, Oa(e, t);
}
function hs(e, t) {
	switch (t.tagID) {
		case V.HTML:
			lo(e, t);
			break;
		case V.NOFRAMES: va(e, t);
	}
}
function gs(e, t) {
	t.chars = "�", e._insertCharacters(t);
}
function _s(e, t) {
	e._insertCharacters(t), e.framesetOk = !1;
}
function vs(e) {
	for (; e.treeAdapter.getNamespaceURI(e.openElements.current) !== z.HTML && e.openElements.currentTagId !== void 0 && !e._isIntegrationPoint(e.openElements.currentTagId, e.openElements.current);) e.openElements.pop();
}
function ys(e, t) {
	if (Ii(t)) vs(e), e._startTagOutsideForeignContent(t);
	else {
		let n = e._getAdjustedCurrentElement(), r = e.treeAdapter.getNamespaceURI(n);
		r === z.MATHML ? Li(t) : r === z.SVG && (Bi(t), Ri(t)), zi(t), t.selfClosing ? e._appendElement(t, r) : e._insertElement(t, r), t.ackSelfClosing = !0;
	}
}
function bs(e, t) {
	if (t.tagID === V.P || t.tagID === V.BR) {
		vs(e), e._endTagOutsideForeignContent(t);
		return;
	}
	if (e.openElements.stackTop === 0) return;
	let { tagName: n } = t, r = Pi.get(n), i = e.fragmentContext ? e.treeAdapter.getNamespaceURI(e.fragmentContext) : z.HTML, a = Math.max(e.openElements.indexOfTopmostByName(z.SVG, n), e.openElements.indexOfTopmostByName(z.MATHML, n), r === void 0 ? -1 : e.openElements.indexOfTopmostByName(z.SVG, r), i === z.HTML || i === z.SVG || i === z.MATHML ? -1 : e.openElements.indexOfTopmostByName(i, n));
	a > e.openElements.indexOfTopmostHtmlElement() ? (t.tagName = e.treeAdapter.getTagName(e.openElements.items[a]), e.openElements.shortenToLength(a)) : e._endTagOutsideForeignContent(t);
}
B.AREA, B.BASE, B.BASEFONT, B.BGSOUND, B.BR, B.COL, B.EMBED, B.FRAME, B.HR, B.IMG, B.INPUT, B.KEYGEN, B.LINK, B.META, B.PARAM, B.SOURCE, B.TRACK, B.WBR;
// node_modules/.pnpm/unist-util-position@5.0.0/node_modules/unist-util-position/lib/index.js
var xs = Cs("end"), Ss = Cs("start");
function Cs(e) {
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
function ws(e) {
	let t = Ss(e), n = xs(e);
	if (t && n) return {
		start: t,
		end: n
	};
}
// node_modules/.pnpm/hast-util-raw@9.2.0/node_modules/hast-util-raw/lib/index.js
var Ts = /<(\/?)(iframe|noembed|noframes|plaintext|script|style|textarea|title|xmp)(?=[\t\n\f\r />])/gi, Es = /* @__PURE__ */ new Set([
	"mdxFlowExpression",
	"mdxJsxFlowElement",
	"mdxJsxTextElement",
	"mdxTextExpression",
	"mdxjsEsm"
]), Ds = {
	sourceCodeLocationInfo: !0,
	scriptingEnabled: !1
};
function Os(e, t) {
	let n = Hs(e), r = cn("type", {
		handlers: {
			root: As,
			element: js,
			text: Ms,
			comment: Fs,
			doctype: Ns,
			raw: Is
		},
		unknown: Ls
	}), i = {
		parser: n ? new Qi(Ds) : Qi.getFragmentParser(void 0, Ds),
		handle(e) {
			r(e, i);
		},
		stitches: !1,
		options: t || {}
	};
	r(e, i), Rs(i, Ss());
	let a = Qt(n ? i.parser.document : i.parser.getFragment(), { file: i.options.file });
	return i.stitches && x(a, "comment", function(e, t, n) {
		let r = e;
		if (r.value.stitch && n && t !== void 0) {
			let e = n.children;
			return e[t] = r.value.stitch, t;
		}
	}), a.type === "root" && a.children.length === 1 && a.children[0].type === e.type ? a.children[0] : a;
}
function ks(e, t) {
	let n = -1;
	/* istanbul ignore else - invalid nodes, see rehypejs/rehype-raw#7. */
	if (e) for (; ++n < e.length;) t.handle(e[n]);
}
function As(e, t) {
	ks(e.children, t);
}
function js(e, t) {
	Bs(e, t), ks(e.children, t), Vs(e, t);
}
function Ms(e, t) {
	t.parser.tokenizer.state > 4 && (t.parser.tokenizer.state = 0), Rs(t, Ss(e));
	let n = Us(e), { value: r } = e, i = 0;
	for (; i < r.length;) {
		let e = Gs(r.charCodeAt(i)), a = i + 1;
		for (; a < r.length && Gs(r.charCodeAt(a)) === e;) a++;
		let o = {
			type: e,
			chars: r.slice(i, a),
			location: n
		};
		t.parser.currentToken = o, t.parser._processToken(t.parser.currentToken), i = a;
	}
}
function Ns(e, t) {
	let n = {
		type: R.DOCTYPE,
		name: "html",
		forceQuirks: !1,
		publicId: "",
		systemId: "",
		location: Us(e)
	};
	Rs(t, Ss(e)), t.parser.currentToken = n, t.parser._processToken(t.parser.currentToken);
}
function Ps(e, t) {
	t.stitches = !0;
	let n = Ws(e);
	"children" in e && "children" in n && (n.children = Os({
		type: "root",
		children: e.children
	}, t.options).children), Fs({
		type: "comment",
		value: { stitch: n }
	}, t);
}
function Fs(e, t) {
	let n = e.value, r = {
		type: R.COMMENT,
		data: n,
		location: Us(e)
	};
	Rs(t, Ss(e)), t.parser.currentToken = r, t.parser._processToken(t.parser.currentToken);
}
function Is(e, t) {
	t.parser.tokenizer.flushCharacters(), t.parser.tokenizer.preprocessor.html = "", t.parser.tokenizer.preprocessor.pos = -1, t.parser.tokenizer.preprocessor.lastGapPos = -2, t.parser.tokenizer.preprocessor.gapStack = [], t.parser.tokenizer.preprocessor.skipNextNewLine = !1, t.parser.tokenizer.preprocessor.lastChunkWritten = !1, t.parser.tokenizer.preprocessor.endOfChunkHit = !1, t.parser.tokenizer.preprocessor.isEol = !1, zs(t, Ss(e)), t.parser.tokenizer.write(t.options.tagfilter ? e.value.replace(Ts, "&lt;$1$2") : e.value, !1), t.parser.tokenizer._runParsingLoop(), t.parser.tokenizer.state === 71 && (t.parser.tokenizer.preprocessor.pos = t.parser.tokenizer.preprocessor.html.length, t.parser.tokenizer.preprocessor.lastChunkWritten = !0, t.parser.tokenizer._stateCharacterReference(), t.parser.tokenizer.preprocessor.lastChunkWritten = !1, t.parser.tokenizer.preprocessor.endOfChunkHit = !1, t.parser.tokenizer.active = !0, t.parser.tokenizer._runParsingLoop());
}
function Ls(e, t) {
	let n = e;
	if (t.options.passThrough && t.options.passThrough.includes(n.type)) Ps(n, t);
	else {
		let e = "";
		throw Es.has(n.type) && (e = ". It looks like you are using MDX nodes with `hast-util-raw` (or `rehype-raw`). If you use this because you are using remark or rehype plugins that inject `'html'` nodes, then please raise an issue with that plugin, as its a bad and slow idea. If you use this because you are using markdown syntax, then you have to configure this utility (or plugin) to pass through these nodes (see `passThrough` in docs), but you can also migrate to use the MDX syntax"), Error("Cannot compile `" + n.type + "` node" + e);
	}
}
function Rs(e, t) {
	e.parser.tokenizer.flushCharacters(), zs(e, t), e.parser.tokenizer.paused = !1, e.parser.tokenizer.inLoop = !1, e.parser.tokenizer.active = !1, e.parser.tokenizer.returnState = Pr.DATA, e.parser.tokenizer.charRefCode = -1, e.parser.tokenizer.consumedAfterSnapshot = -1, e.parser.tokenizer.currentLocation = null, e.parser.tokenizer.currentCharacterToken = null, e.parser.tokenizer.currentToken = null, e.parser.tokenizer.currentAttr = {
		name: "",
		value: ""
	};
}
function zs(e, t) {
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
function Bs(e, t) {
	if (t.parser.tokenizer.state === Pr.PLAINTEXT) return;
	let n = e.tagName.toLowerCase();
	Rs(t, Ss(e));
	let { current: r } = t.parser.openElements, i = r && "namespaceURI" in r ? r.namespaceURI : $e.html;
	i === $e.html && n === "svg" && (i = $e.svg);
	let a = fn({
		...e,
		children: []
	}, { space: i === $e.svg ? "svg" : "html" }), o = {
		type: R.START_TAG,
		tagName: n,
		tagID: Ar(n),
		selfClosing: !1,
		ackSelfClosing: !1,
		/* c8 ignore next */
		attrs: "attrs" in a ? a.attrs : [],
		location: Us(e)
	};
	t.parser.currentToken = o, t.parser._processToken(t.parser.currentToken), t.parser.tokenizer.lastStartTagName = n;
}
function Vs(e, t) {
	let n = e.tagName.toLowerCase();
	if (!t.parser.tokenizer.inForeignNode && Sn.includes(n) || t.parser.tokenizer.state === Pr.PLAINTEXT) return;
	Rs(t, xs(e));
	let r = {
		type: R.END_TAG,
		tagName: n,
		tagID: Ar(n),
		selfClosing: !1,
		ackSelfClosing: !1,
		attrs: [],
		location: Us(e)
	};
	t.parser.currentToken = r, t.parser._processToken(t.parser.currentToken), n === t.parser.tokenizer.lastStartTagName && (t.parser.tokenizer.state === Pr.RCDATA || t.parser.tokenizer.state === Pr.RAWTEXT || t.parser.tokenizer.state === Pr.SCRIPT_DATA) && (t.parser.tokenizer.state = Pr.DATA);
}
function Hs(e) {
	let t = e.type === "root" ? e.children[0] : e;
	return !!(t && (t.type === "doctype" || t.type === "element" && t.tagName.toLowerCase() === "html"));
}
function Us(e) {
	let t = Ss(e) || {
		line: void 0,
		column: void 0,
		offset: void 0
	}, n = xs(e) || {
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
function Ws(e) {
	return Jt("children" in e ? {
		...e,
		children: []
	} : e);
}
function Gs(e) {
	return e === 9 || e === 10 || e === 12 || e === 13 || e === 32 ? R.WHITESPACE_CHARACTER : R.CHARACTER;
}
// node_modules/.pnpm/rehype-raw@7.0.0/node_modules/rehype-raw/lib/index.js
function Ks(e) {
	return function(t, n) {
		return Os(t, {
			...e,
			file: n
		});
	};
}
// node_modules/.pnpm/hast-util-sanitize@5.0.2/node_modules/hast-util-sanitize/lib/schema.js
var qs = [
	"ariaDescribedBy",
	"ariaLabel",
	"ariaLabelledBy"
], Js = {
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
			...qs,
			"dataFootnoteBackref",
			"dataFootnoteRef",
			["className", "data-footnote-backref"],
			"href"
		],
		blockquote: ["cite"],
		code: [["className", /^language-./]],
		del: ["cite"],
		div: ["itemScope", "itemType"],
		dl: [...qs],
		h2: [["className", "sr-only"]],
		img: [
			...qs,
			"longDesc",
			"src"
		],
		input: [["disabled", !0], ["type", "checkbox"]],
		ins: ["cite"],
		li: [["className", "task-list-item"]],
		ol: [...qs, ["className", "contains-task-list"]],
		q: ["cite"],
		section: ["dataFootnotes", ["className", "footnotes"]],
		source: ["srcSet"],
		summary: [...qs],
		table: [...qs],
		ul: [...qs, ["className", "contains-task-list"]],
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
}, Ys = {}.hasOwnProperty;
function Xs(e, t) {
	let n = {
		type: "root",
		children: []
	}, r = Zs({
		schema: t ? {
			...Js,
			...t
		} : Js,
		stack: []
	}, e);
	return r && (Array.isArray(r) ? r.length === 1 ? n = r[0] : n.children = r : n = r), n;
}
function Zs(e, t) {
	if (t && typeof t == "object") {
		let n = t;
		switch (typeof n.type == "string" ? n.type : "") {
			case "comment": return Qs(e, n);
			case "doctype": return $s(e, n);
			case "element": return ec(e, n);
			case "root": return tc(e, n);
			case "text": return nc(e, n);
		}
	}
}
function Qs(e, t) {
	if (e.schema.allowComments) {
		let e = typeof t.value == "string" ? t.value : "", n = e.indexOf("-->"), r = {
			type: "comment",
			value: n < 0 ? e : e.slice(0, n)
		};
		return lc(r, t), r;
	}
}
function $s(e, t) {
	if (e.schema.allowDoctypes) {
		let e = { type: "doctype" };
		return lc(e, t), e;
	}
}
function ec(e, t) {
	let n = typeof t.tagName == "string" ? t.tagName : "";
	e.stack.push(n);
	let r = rc(e, t.children), i = ic(e, t.properties);
	e.stack.pop();
	let a = !1;
	if (n && n !== "*" && (!e.schema.tagNames || e.schema.tagNames.includes(n)) && (a = !0, e.schema.ancestors && Ys.call(e.schema.ancestors, n))) {
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
	return lc(o, t), o;
}
function tc(e, t) {
	let n = {
		type: "root",
		children: rc(e, t.children)
	};
	return lc(n, t), n;
}
function nc(e, t) {
	let n = {
		type: "text",
		value: typeof t.value == "string" ? t.value : ""
	};
	return lc(n, t), n;
}
function rc(e, t) {
	let n = [];
	if (Array.isArray(t)) {
		let r = t, i = -1;
		for (; ++i < r.length;) {
			let t = Zs(e, r[i]);
			t && (Array.isArray(t) ? n.push(...t) : n.push(t));
		}
	}
	return n;
}
function ic(e, t) {
	let n = e.stack[e.stack.length - 1], r = e.schema.attributes, i = e.schema.required, a = r && Ys.call(r, n) ? r[n] : void 0, o = r && Ys.call(r, "*") ? r["*"] : void 0, s = t && typeof t == "object" ? t : {}, c = {}, l;
	for (l in s) if (Ys.call(s, l)) {
		let t = s[l], n = ac(e, uc(a, l), l, t);
		n ??= ac(e, uc(o, l), l, t), n != null && (c[l] = n);
	}
	if (i && Ys.call(i, n)) {
		let e = i[n];
		for (l in e) Ys.call(e, l) && !Ys.call(c, l) && (c[l] = e[l]);
	}
	return c;
}
function ac(e, t, n, r) {
	return t ? Array.isArray(r) ? oc(e, t, n, r) : sc(e, t, n, r) : void 0;
}
function oc(e, t, n, r) {
	let i = -1, a = [];
	for (; ++i < r.length;) {
		let o = sc(e, t, n, r[i]);
		(typeof o == "number" || typeof o == "string") && a.push(o);
	}
	return a;
}
function sc(e, t, n, r) {
	if ((typeof r == "boolean" || typeof r == "number" || typeof r == "string") && cc(e, n, r)) {
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
function cc(e, t, n) {
	let r = e.schema.protocols && Ys.call(e.schema.protocols, t) ? e.schema.protocols[t] : void 0;
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
function lc(e, t) {
	let n = ws(t);
	t.data && (e.data = Jt(t.data)), n && (e.position = n);
}
function uc(e, t) {
	let n, r = -1;
	if (e) for (; ++r < e.length;) {
		let i = e[r], a = typeof i == "string" ? i : i[0];
		if (a === t) return i;
		a === "data*" && (n = i);
	}
	if (t.length > 4 && t.slice(0, 4).toLowerCase() === "data") return n;
}
// node_modules/.pnpm/rehype-sanitize@6.0.0/node_modules/rehype-sanitize/lib/index.js
function dc(e) {
	return function(t) {
		return Xs(t, e);
	};
}
// node_modules/.pnpm/micromark-util-symbol@2.0.1/node_modules/micromark-util-symbol/lib/codes.js
var fc = {
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
}, pc = {
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
}, mc = {
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
}, hc = wc(/[A-Za-z]/), gc = wc(/[\dA-Za-z]/), _c = wc(/[#-'*+\--9=?A-Z^-~]/);
function vc(e) {
	return e !== null && (e < 32 || e === 127);
}
var yc = wc(/\d/), bc = wc(/[\dA-Fa-f]/), xc = wc(/[!-/:-@[-`{-~]/);
function G(e) {
	return e !== null && e < -2;
}
function K(e) {
	return e !== null && (e < 0 || e === 32);
}
function q(e) {
	return e === -2 || e === -1 || e === 32;
}
var Sc = wc(/\p{P}|\p{S}/u), Cc = wc(/\s/);
function wc(e) {
	return t;
	function t(t) {
		return t !== null && t > -1 && e.test(String.fromCharCode(t));
	}
}
var Tc = [
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
], Ec = [
	12288,
	12288,
	65281,
	65376,
	65504,
	65510
], Dc = [
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
], Oc = [
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
], kc = [
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
], Ac = (e, t) => {
	let n = 0, r = Math.floor(e.length / 2) - 1;
	for (; n <= r;) {
		let i = Math.floor((n + r) / 2), a = i * 2;
		if (t < e[a]) r = i - 1;
		else if (t > e[a + 1]) n = i + 1;
		else return !0;
	}
	return !1;
}, jc = 19968, [Mc, Nc] = /* #__PURE__ */ Pc(kc);
function Pc(e) {
	let t = e[0], n = e[1];
	for (let r = 0; r < e.length; r += 2) {
		let i = e[r], a = e[r + 1];
		if (jc >= i && jc <= a) return [i, a];
		a - i > n - t && (t = i, n = a);
	}
	return [t, n];
}
var Fc = (e) => e < 161 || e > 1114109 ? !1 : Ac(Tc, e), Ic = (e) => e < 12288 || e > 65510 ? !1 : Ac(Ec, e), Lc = (e) => e < 8361 || e > 65518 ? !1 : Ac(Dc, e), Rc = (e) => e < 32 || e > 10630 ? !1 : Ac(Oc, e), zc = (e) => e >= Mc && e <= Nc ? !0 : e < 4352 || e > 262141 ? !1 : Ac(kc, e);
function Bc(e) {
	return Fc(e) ? "ambiguous" : Ic(e) ? "fullwidth" : Lc(e) ? "halfwidth" : Rc(e) ? "narrow" : zc(e) ? "wide" : "neutral";
}
// node_modules/.pnpm/get-east-asian-width@1.7.0/node_modules/get-east-asian-width/index.js
function Vc(e) {
	if (!Number.isSafeInteger(e)) throw TypeError(`Expected a code point, got \`${typeof e}\`.`);
}
function Hc(e) {
	return Vc(e), Bc(e);
}
// node_modules/.pnpm/micromark-extension-cjk-fri_9deea401571714275a1735de749eeafc/node_modules/micromark-extension-cjk-friendly-util/dist/index.js
var Uc = Object.defineProperty, Wc = (e, t, n) => t in e ? Uc(e, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: n
}) : e[t] = n, Gc = (e, t, n) => Wc(e, typeof t == "symbol" ? t : t + "", n);
function Kc(e) {
	return /^\p{Emoji_Presentation}/u.test(String.fromCodePoint(e));
}
function qc(e) {
	if (!e || e < 4352) return !1;
	switch (Hc(e)) {
		case "fullwidth":
		case "halfwidth": return !0;
		case "wide": return !Kc(e);
		case "narrow": return !1;
		case "ambiguous": return 917760 <= e && e <= 917999 && null;
		case "neutral": return /^\p{sc=Hangul}/u.test(String.fromCodePoint(e));
	}
}
function Jc(e, t) {
	return t !== 65025 || !e || e < 8216 ? !1 : e === 8216 || e === 8217 || e === 8220 || e === 8221;
}
function Yc(e) {
	return e !== null && e >= 65024 && e <= 65038;
}
var Xc = Qc(/\p{P}|\p{S}/u), Zc = Qc(/\s/);
function Qc(e) {
	return t;
	function t(t) {
		return t !== null && t > -1 && e.test(String.fromCodePoint(t));
	}
}
var $c;
((e) => {
	e.spaceOrPunctuation = 3, e.cjk = 4096, e.cjkPunctuation = 4098, e.ivs = 8192, e.cjkOrIvs = 12288, e.nonEmojiGeneralUseVS = 16384, e.variationSelector = 24576, e.ivsToCjkRightShift = 1;
})($c ||= {});
function el(e) {
	if (e === fc.eof || K(e) || Zc(e)) return pc.characterGroupWhitespace;
	let t = 0;
	if (e >= 4352) {
		if (Yc(e)) return $c.nonEmojiGeneralUseVS;
		switch (qc(e)) {
			case null: return $c.ivs;
			case !0: t |= $c.cjk;
		}
	}
	return Xc(e) && (t |= pc.characterGroupPunctuation), t;
}
function tl(e, t, n) {
	if (!cl(e)) return e;
	let r = t(), i = el(r);
	return !r || rl(i) ? e : Jc(r, n) ? $c.cjkPunctuation : nl(i);
}
function nl(e) {
	return e & ~$c.ivs;
}
function rl(e) {
	return !!(e & pc.characterGroupWhitespace);
}
function il(e) {
	return (e & $c.cjkPunctuation) === pc.characterGroupPunctuation;
}
function al(e) {
	return !!(e & $c.cjk);
}
function ol(e) {
	return e === $c.ivs;
}
function sl(e) {
	return !!(e & $c.cjkOrIvs);
}
function cl(e) {
	return e === $c.nonEmojiGeneralUseVS;
}
function ll(e) {
	return !!(e & $c.spaceOrPunctuation);
}
function ul(e) {
	return !!(e && e >= 55296 && e <= 56319);
}
function dl(e) {
	return !!(e && e >= 56320 && e <= 57343);
}
function fl(e, t, n) {
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
function pl(e, t, n) {
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
var ml = class {
	constructor(e, t, n) {
		this.previousCode = e, this.nowPoint = t, this.sliceSerialize = n, Gc(this, "cachedValue");
	}
	value() {
		return this.cachedValue === void 0 && (this.cachedValue = pl(this.previousCode, this.nowPoint, this.sliceSerialize)), this.cachedValue;
	}
};
function hl(e, t, n) {
	let r = n({
		start: t,
		end: {
			...t,
			_bufferIndex: t._bufferIndex + 2
		}
	}).codePointAt(0);
	return r && r >= 65536 ? r : e;
}
// node_modules/.pnpm/micromark-util-chunked@2.0.1/node_modules/micromark-util-chunked/index.js
function gl(e, t, n, r) {
	let i = e.length, a = 0, o;
	if (t = t < 0 ? -t > i ? 0 : i + t : t > i ? i : t, n = n > 0 ? n : 0, r.length < 1e4) o = Array.from(r), o.unshift(t, n), e.splice(...o);
	else for (n && e.splice(t, n); a < r.length;) o = r.slice(a, a + 1e4), o.unshift(t, 0), e.splice(...o), a += 1e4, t += 1e4;
}
function _l(e, t) {
	return e.length > 0 ? (gl(e, e.length, 0, t), e) : t;
}
// node_modules/.pnpm/micromark-util-resolve-all@2.0.1/node_modules/micromark-util-resolve-all/index.js
function vl(e, t, n) {
	let r = [], i = -1;
	for (; ++i < e.length;) {
		let a = e[i].resolveAll;
		a && !r.includes(a) && (t = a(t, n), r.push(a));
	}
	return t;
}
// node_modules/.pnpm/micromark-extension-cjk-fri_21df89ea588b18d08137cf7f93aa4e2a/node_modules/micromark-extension-cjk-friendly/dist/index.js
var yl = {
	name: "attention",
	resolveAll: bl,
	tokenize: xl
};
function bl(e, t) {
	let n = -1, r, i, a, o, s, c, l, u;
	for (; ++n < e.length;) if (e[n][0] === "enter" && e[n][1].type === "attentionSequence" && e[n][1]._close) {
		for (r = n; r--;) if (e[r][0] === "exit" && e[r][1].type === "attentionSequence" && e[r][1]._open && t.sliceSerialize(e[r][1]).charCodeAt(0) === t.sliceSerialize(e[n][1]).charCodeAt(0)) {
			if ((e[r][1]._close || e[n][1]._open) && (e[n][1].end.offset - e[n][1].start.offset) % 3 && !((e[r][1].end.offset - e[r][1].start.offset + e[n][1].end.offset - e[n][1].start.offset) % 3)) continue;
			c = e[r][1].end.offset - e[r][1].start.offset > 1 && e[n][1].end.offset - e[n][1].start.offset > 1 ? 2 : 1;
			let d = { ...e[r][1].end }, f = { ...e[n][1].start };
			Sl(d, -c), Sl(f, c), o = {
				type: c > 1 ? mc.strongSequence : mc.emphasisSequence,
				start: d,
				end: { ...e[r][1].end }
			}, s = {
				type: c > 1 ? mc.strongSequence : mc.emphasisSequence,
				start: { ...e[n][1].start },
				end: f
			}, a = {
				type: c > 1 ? mc.strongText : mc.emphasisText,
				start: { ...e[r][1].end },
				end: { ...e[n][1].start }
			}, i = {
				type: c > 1 ? mc.strong : mc.emphasis,
				start: { ...o.start },
				end: { ...s.end }
			}, e[r][1].end = { ...o.start }, e[n][1].start = { ...s.end }, l = [], e[r][1].end.offset - e[r][1].start.offset && (l = _l(l, [[
				"enter",
				e[r][1],
				t
			], [
				"exit",
				e[r][1],
				t
			]])), l = _l(l, [
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
			]), t.parser.constructs.insideSpan.null, l = _l(l, vl(t.parser.constructs.insideSpan.null, e.slice(r + 1, n), t)), l = _l(l, [
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
			]), e[n][1].end.offset - e[n][1].start.offset ? (u = 2, l = _l(l, [[
				"enter",
				e[n][1],
				t
			], [
				"exit",
				e[n][1],
				t
			]])) : u = 0, gl(e, r - 1, n - r + 3, l), n = r + l.length - u - 2;
			break;
		}
	}
	for (n = -1; ++n < e.length;) e[n][1].type === "attentionSequence" && (e[n][1].type = "data");
	return e;
}
function xl(e, t) {
	let n = this.parser.constructs.attentionMarkers.null, { now: r, sliceSerialize: i, previous: a } = this, o = dl(a) ? fl(a, r(), i) : a, s = el(o), c = new ml(o, r(), i), l = tl(s, c.value.bind(c), o), u;
	return d;
	function d(t) {
		return t === fc.asterisk || fc.underscore, u = t, e.enter("attentionSequence"), f(t);
	}
	function f(a) {
		if (a === u) return e.consume(a), f;
		let s = e.exit("attentionSequence"), c = el(ul(a) ? hl(a, r(), i) : a), d = il(l), p = d || rl(l), m = il(c), h = m || rl(c), g = sl(l), _ = !h || m && (p || g) || n.includes(a), v = !p || d && (h || al(c)) || n.includes(o);
		return s._open = !!(u === fc.asterisk ? _ : _ && (ll(l) || !v)), s._close = !!(u === fc.asterisk ? v : v && (ll(c) || !_)), t(a);
	}
}
function Sl(e, t) {
	e.column += t, e.offset += t, e._bufferIndex += t;
}
function Cl() {
	return {
		text: {
			[fc.asterisk]: yl,
			[fc.underscore]: yl
		},
		insideSpan: { null: [yl] }
	};
}
// node_modules/.pnpm/remark-cjk-friendly@1.2.3_@_b1ec5ba10410fa38af93a159733a17be/node_modules/remark-cjk-friendly/dist/index.js
function wl() {
	let e = this.data();
	(e.micromarkExtensions ||= []).push(Cl());
}
// node_modules/.pnpm/micromark-extension-cjk-fri_efc74c73826ab91a145be616f05c054d/node_modules/micromark-extension-cjk-friendly-gfm-strikethrough/dist/index.js
function Tl(e) {
	let t = (e || {}).singleTilde, n = {
		name: "strikethrough",
		tokenize: i,
		resolveAll: r
	};
	return t ??= !0, {
		text: { [fc.tilde]: n },
		insideSpan: { null: [n] },
		attentionMarkers: { null: [fc.tilde] }
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
				s && gl(o, o.length, 0, vl(s, e.slice(r + 1, n), t)), gl(o, o.length, 0, [
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
				]), gl(e, r - 1, n - r + 3, o), n = r + o.length - 2;
				break;
			}
		}
		for (n = -1; ++n < e.length;) e[n][1].type === "strikethroughSequenceTemporary" && (e[n][1].type = mc.data);
		return e;
	}
	function i(e, n, r) {
		let { now: i, sliceSerialize: a, previous: o } = this, s = dl(o) ? fl(o, i(), a) : o, c = el(s), l = new ml(s, i(), a), u = tl(c, l.value.bind(l), s), d = this.events, f = 0;
		return p;
		function p(t) {
			return fc.tilde, s === fc.tilde && d[d.length - 1][1].type !== mc.characterEscape ? r(t) : (e.enter("strikethroughSequenceTemporary"), m(t));
		}
		function m(o) {
			let c = el(s);
			if (o === fc.tilde) return f > 1 ? r(o) : (e.consume(o), f++, m);
			if (f < 2 && !t) return r(o);
			let l = e.exit("strikethroughSequenceTemporary"), d = el(ul(o) ? hl(o, i(), a) : o), p = il(u) || rl(u), h = il(d) || rl(d), g = al(u) || ol(c);
			return l._open = !h || d === pc.attentionSideAfter && (p || g), l._close = !p || c === pc.attentionSideAfter && (h || al(d)), n(o);
		}
	}
}
// node_modules/.pnpm/remark-cjk-friendly-gfm-str_1e51990f1ec57112a2bd5672fd6d380e/node_modules/remark-cjk-friendly-gfm-strikethrough/dist/index.js
function El(e) {
	let t = this.data();
	(t.micromarkExtensions ||= []).push(Tl(e));
}
// node_modules/.pnpm/ccount@2.0.1/node_modules/ccount/index.js
function Dl(e, t) {
	let n = String(e);
	if (typeof t != "string") throw TypeError("Expected character");
	let r = 0, i = n.indexOf(t);
	for (; i !== -1;) r++, i = n.indexOf(t, i + t.length);
	return r;
}
// node_modules/.pnpm/escape-string-regexp@5.0.0/node_modules/escape-string-regexp/index.js
function Ol(e) {
	if (typeof e != "string") throw TypeError("Expected a string");
	return e.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
}
// node_modules/.pnpm/mdast-util-find-and-replace@3.0.4/node_modules/mdast-util-find-and-replace/lib/index.js
function kl(e, t, n) {
	let r = l((n || {}).ignore || []), i = Al(t), a = -1;
	for (; ++a < i.length;) y(e, o);
	function o(e, t, n) {
		if (e.type === "text" && typeof n == "number") return s(e, t, n);
		if (r(e, n, t[t.length - 1])) return v;
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
function Al(e) {
	if (!Array.isArray(e)) throw TypeError("Expected find and replace tuple or list of tuples");
	let t = [], n = !e[0] || Array.isArray(e[0]) ? e : [e], r = -1;
	for (; ++r < n.length;) {
		let e = n[r];
		t.push([jl(e[0]), Ml(e[1])]);
	}
	return t;
}
function jl(e) {
	return typeof e == "string" ? new RegExp(Ol(e), "g") : e;
}
function Ml(e) {
	return typeof e == "function" ? e : function() {
		return e;
	};
}
// node_modules/.pnpm/mdast-util-gfm-autolink-literal@2.1.0/node_modules/mdast-util-gfm-autolink-literal/lib/index.js
var Nl = "phrasing", Pl = [
	"autolink",
	"link",
	"image",
	"label"
];
function Fl() {
	return {
		transforms: [Ul],
		enter: {
			literalAutolink: Ll,
			literalAutolinkEmail: Rl,
			literalAutolinkHttp: Rl,
			literalAutolinkWww: Rl
		},
		exit: {
			literalAutolink: Hl,
			literalAutolinkEmail: Vl,
			literalAutolinkHttp: zl,
			literalAutolinkWww: Bl
		}
	};
}
function Il() {
	return { unsafe: [
		{
			character: "@",
			before: "[+\\-.\\w]",
			after: "[\\-.\\w]",
			inConstruct: Nl,
			notInConstruct: Pl
		},
		{
			character: ".",
			before: "[Ww]",
			after: "[\\-.\\w]",
			inConstruct: Nl,
			notInConstruct: Pl
		},
		{
			character: ":",
			before: "[ps]",
			after: "\\/",
			inConstruct: Nl,
			notInConstruct: Pl
		}
	] };
}
function Ll(e) {
	this.enter({
		type: "link",
		title: null,
		url: "",
		children: [],
		position: void 0
	}, e);
}
function Rl(e) {
	this.config.enter.autolinkProtocol.call(this, e);
}
function zl(e) {
	this.config.exit.autolinkProtocol.call(this, e);
}
function Bl(e) {
	this.config.exit.data.call(this, e);
	let t = this.stack[this.stack.length - 1];
	t.type, t.url = "http://" + this.sliceSerialize(e);
}
function Vl(e) {
	this.config.exit.autolinkEmail.call(this, e);
}
function Hl(e) {
	this.exit(e);
}
function Ul(e) {
	kl(e, [
		[/(?<![\da-z])(https?:\/\/|www(?=\.))([\w-]*\.[\w\-.]*)([^\t\n\r ]*)/gi, Wl],
		[/(?<![\w+\-.@])xmpp:([\w+\-.]+)@([\w-]+(?:\.[\w-]+)+)(\/(?:[\w\-/]|\.(?=[\dA-Za-z]))*)?/g, ql],
		[/(?<![\w+\-.@])mailto:([\w+\-.]+)@([\w-]+(?:\.[\w-]+)+)/g, Kl],
		[/(?<![\w+\-.]|(?:^|[^\d@A-Za-z])(?:mailto|xmpp):)([\w+\-.]+)@([\w-]+(?:\.[\w-]+)+)/g, Gl]
	], { ignore: ["link", "linkReference"] });
}
function Wl(e, t, n, r, i) {
	if (!Xl(i)) return !1;
	let a = "";
	if (/^w/i.test(t) && (n = t + n, t = "", a = "http://"), Sc(n.charCodeAt(0)) || !Jl(n)) return !1;
	let o = Yl(n + r), s = {
		type: "link",
		title: null,
		url: a + t + o[0],
		children: [{
			type: "text",
			value: t + o[0],
			position: void 0
		}],
		position: void 0
	};
	return o[1] ? [s, {
		type: "text",
		value: o[1],
		position: void 0
	}] : s;
}
function Gl(e, t, n) {
	return !/[\d\-_]$/.test(n) && {
		type: "link",
		title: null,
		url: "mailto:" + t + "@" + n,
		children: [{
			type: "text",
			value: t + "@" + n,
			position: void 0
		}],
		position: void 0
	};
}
function Kl(e, t, n) {
	if (/[\d\-_]$/.test(n)) return !1;
	let r = "mailto:" + t + "@" + n;
	return {
		type: "link",
		title: null,
		url: r,
		children: [{
			type: "text",
			value: r,
			position: void 0
		}],
		position: void 0
	};
}
function ql(e, t, n, r, i) {
	if (/[\d\-_]$/.test(n) || r && (!/[A-Za-z]$/.test(r) || i.input.charAt(i.index + e.length) === "@")) return !1;
	let a = "xmpp:" + t + "@" + n + (r || "");
	return {
		type: "link",
		title: null,
		url: a,
		children: [{
			type: "text",
			value: a,
			position: void 0
		}],
		position: void 0
	};
}
function Jl(e) {
	let t = e.split(".");
	return !(t.length < 2 || t[t.length - 1] && (/_/.test(t[t.length - 1]) || !/[\dA-Za-z]/.test(t[t.length - 1])) || t[t.length - 2] && (/_/.test(t[t.length - 2]) || !/[\dA-Za-z]/.test(t[t.length - 2])));
}
function Yl(e) {
	let t = e.length;
	for (; t > 0;) {
		let n = e.charCodeAt(t - 1);
		if (n === 33 || n === 34 || n === 38 || n === 39 || n === 41 || n === 44 || n === 46 || n === 58 || n === 59 || n === 60 || n === 62 || n === 63 || n === 93 || n === 125) t--;
		else break;
	}
	if (t === e.length) return [e, void 0];
	let n = e.slice(t);
	e = e.slice(0, t);
	let r = n.indexOf(")"), i = Dl(e, "("), a = Dl(e, ")");
	for (; r !== -1 && i > a;) e += n.slice(0, r + 1), n = n.slice(r + 1), r = n.indexOf(")"), a++;
	return [e, n];
}
function Xl(e) {
	let t = e.input.charCodeAt(e.index - 1);
	return e.index === 0 || Cc(t) || Sc(t);
}
// node_modules/.pnpm/micromark-util-normalize-identifier@2.0.1/node_modules/micromark-util-normalize-identifier/index.js
function Zl(e) {
	return e.replace(/[\t\n\r ]+/g, " ").replace(/^ | $/g, "").toLowerCase().toUpperCase();
}
// node_modules/.pnpm/mdast-util-gfm-footnote@2.1.0/node_modules/mdast-util-gfm-footnote/lib/index.js
su.peek = ou;
function Ql() {
	this.buffer();
}
function $l(e) {
	this.enter({
		type: "footnoteReference",
		identifier: "",
		label: ""
	}, e);
}
function eu() {
	this.buffer();
}
function tu(e) {
	this.enter({
		type: "footnoteDefinition",
		identifier: "",
		label: "",
		children: []
	}, e);
}
function nu(e) {
	let t = this.resume(), n = this.stack[this.stack.length - 1];
	n.type, n.identifier = Zl(this.sliceSerialize(e)).toLowerCase(), n.label = t;
}
function ru(e) {
	this.exit(e);
}
function iu(e) {
	let t = this.resume(), n = this.stack[this.stack.length - 1];
	n.type, n.identifier = Zl(this.sliceSerialize(e)).toLowerCase(), n.label = t;
}
function au(e) {
	this.exit(e);
}
function ou() {
	return "[";
}
function su(e, t, n, r) {
	let i = n.createTracker(r), a = i.move("[^"), o = n.enter("footnoteReference"), s = n.enter("reference");
	return a += i.move(n.safe(n.associationId(e), {
		after: "]",
		before: a
	})), s(), o(), a += i.move("]"), a;
}
function cu() {
	return {
		enter: {
			gfmFootnoteCallString: Ql,
			gfmFootnoteCall: $l,
			gfmFootnoteDefinitionLabelString: eu,
			gfmFootnoteDefinition: tu
		},
		exit: {
			gfmFootnoteCallString: nu,
			gfmFootnoteCall: ru,
			gfmFootnoteDefinitionLabelString: iu,
			gfmFootnoteDefinition: au
		}
	};
}
function lu(e) {
	let t = !1;
	return e && e.firstLineBlank && (t = !0), {
		handlers: {
			footnoteDefinition: n,
			footnoteReference: su
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
		})), c(), o += a.move("]:"), e.children && e.children.length > 0 && (a.shift(4), o += a.move((t ? "\n" : " ") + r.indentLines(r.containerFlow(e, a.current()), t ? du : uu))), s(), o;
	}
}
function uu(e, t, n) {
	return t === 0 ? e : du(e, t, n);
}
function du(e, t, n) {
	return (n ? "" : "    ") + e;
}
// node_modules/.pnpm/mdast-util-gfm-strikethrough@2.0.1/node_modules/mdast-util-gfm-strikethrough/lib/index.js
var fu = [
	"autolink",
	"destinationLiteral",
	"destinationRaw",
	"reference",
	"titleQuote",
	"titleApostrophe"
];
_u.attention = vu, _u.peek = yu;
function pu() {
	return {
		canContainEols: ["delete"],
		enter: { strikethrough: hu },
		exit: { strikethrough: gu }
	};
}
function mu() {
	return {
		handlers: { delete: _u },
		unsafe: [{
			character: "~",
			inConstruct: "phrasing",
			notInConstruct: fu
		}]
	};
}
function hu(e) {
	this.enter({
		type: "delete",
		children: [],
		position: void 0
	}, e);
}
function gu(e) {
	this.exit(e);
}
function _u(e, t, n, r) {
	let i = n.createTracker(r), a = n.stack.includes("strikethrough") ? "~" : "~~", o = n.enter("strikethrough"), s = i.move(a);
	return s += n.containerPhrasing(e, {
		...i.current(),
		before: s,
		after: "~"
	}), s += i.move(a), o(), s;
}
function vu() {
	return {
		construct: "strikethrough",
		markers: ["~"],
		sizes: [2, 1]
	};
}
function yu() {
	return "~";
}
// node_modules/.pnpm/markdown-table@3.1.0/node_modules/markdown-table/index.js
function bu(e) {
	return e.length;
}
function xu(e, t) {
	let n = t || {}, r = (n.align || []).concat(), i = n.stringLength || bu, a = [], o = [], s = [], c = [], l = 0, u = -1;
	for (; ++u < e.length;) {
		let t = [], r = [], a = -1;
		for (e[u].length > l && (l = e[u].length); ++a < e[u].length;) {
			let o = Su(e[u][a]);
			if (n.alignDelimiters !== !1) {
				let e = i(o);
				r[a] = e, (c[a] === void 0 || e > c[a]) && (c[a] = e);
			}
			t.push(o);
		}
		o[u] = t, s[u] = r;
	}
	let d = -1;
	if (typeof r == "object" && "length" in r) for (; ++d < l;) a[d] = Cu(r[d]);
	else {
		let e = Cu(r);
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
		let e = o[u], t = s[u], r = n.fillRows === !1 ? Math.max(1, o[u === 1 ? 0 : u].length) : l;
		d = -1;
		let i = [];
		for (; ++d < r;) {
			let o = e[d] || "", s = "", l = "";
			if (n.alignDelimiters !== !1) {
				let e = c[d] - (t[d] || 0), n = a[d];
				if (n === 114) s = " ".repeat(e);
				else if (n === 99) {
					let t = e / 2;
					e % 2 ? (s = " ".repeat(t + .5), l = " ".repeat(t - .5)) : (s = " ".repeat(t), l = s);
				} else l = " ".repeat(e);
			}
			n.delimiterStart !== !1 && !d && i.push("|"), n.padding === !1 || n.alignDelimiters === !1 && o === "" || n.delimiterStart === !1 && !d || i.push(" "), n.alignDelimiters !== !1 && i.push(s), i.push(o), n.alignDelimiters !== !1 && i.push(l), n.padding !== !1 && i.push(" "), (n.delimiterEnd !== !1 || d !== r - 1) && i.push("|");
		}
		m.push(n.delimiterEnd === !1 ? i.join("").replace(/ +$/, "") : i.join(""));
	}
	return m.join("\n");
}
function Su(e) {
	return e == null ? "" : String(e);
}
function Cu(e) {
	let t = typeof e == "string" ? e.codePointAt(0) : 0;
	return t === 67 || t === 99 ? 99 : t === 76 || t === 108 ? 108 : t === 82 || t === 114 ? 114 : 0;
}
// node_modules/.pnpm/mdast-util-phrasing@4.1.0/node_modules/mdast-util-phrasing/lib/index.js
var wu = l([
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
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/handle/blockquote.js
function Tu(e, t, n, r) {
	let i = n.enter("blockquote"), a = n.createTracker(r);
	a.move("> "), a.shift(2);
	let o = n.indentLines(n.containerFlow(e, a.current()), Eu);
	return i(), o;
}
function Eu(e, t, n) {
	return ">" + (n ? "" : " ") + e;
}
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/util/pattern-in-scope.js
function Du(e, t) {
	return Ou(e, t.inConstruct, !0) && !Ou(e, t.notInConstruct, !1);
}
function Ou(e, t, n) {
	if (typeof t == "string" && (t = [t]), !t || t.length === 0) return n;
	let r = -1;
	for (; ++r < t.length;) if (e.includes(t[r])) return !0;
	return !1;
}
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/handle/break.js
function ku(e, t, n, r) {
	let i = -1;
	for (; ++i < n.unsafe.length;) {
		let e = n.unsafe[i];
		if (e.character === "\n" && !e.before && !e.after && Du(n.stack, e)) return /[\t ]/.test(r.before) ? "" : " ";
	}
	return "\\\n";
}
// node_modules/.pnpm/longest-streak@3.1.0/node_modules/longest-streak/index.js
function Au(e, t) {
	let n = String(e), r = n.indexOf(t), i = r, a = 0, o = 0;
	if (typeof t != "string") throw TypeError("Expected substring");
	for (; r !== -1;) r === i ? ++a > o && (o = a) : a = 1, i = r + t.length, r = n.indexOf(t, i);
	return o;
}
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/util/format-code-as-indented.js
function ju(e, t) {
	return !(t.options.fences !== !1 || !e.value || e.lang || !/[^\n\r ]/.test(e.value) || /^[\t ]*(?:[\n\r]|$)|(?:^|[\n\r])[\t ]*$/.test(e.value));
}
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/util/check-fence.js
function Mu(e) {
	let t = e.options.fence || "`";
	if (t !== "`" && t !== "~") throw Error("Cannot serialize code with `" + t + "` for `options.fence`, expected `` ` `` or `~`");
	return t;
}
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/handle/code.js
function Nu(e, t, n, r) {
	let i = Mu(n), a = e.value || "";
	if (ju(e, n)) {
		let e = n.enter("codeIndented"), t = n.indentLines(a, Pu);
		return e(), t;
	}
	let o = n.createTracker(r), s = i.repeat(Math.max(Au(a, i) + 1, 3)), c = n.enter("codeFenced"), l = i === "`" ? "GraveAccent" : "Tilde", u = o.move(s);
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
function Pu(e, t, n) {
	return (n ? "" : "    ") + e;
}
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/util/check-quote.js
function Fu(e) {
	let t = e.options.quote || "\"";
	if (t !== "\"" && t !== "'") throw Error("Cannot serialize title with `" + t + "` for `options.quote`, expected `\"`, or `'`");
	return t;
}
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/handle/definition.js
function Iu(e, t, n, r) {
	let i = Fu(n), a = i === "\"" ? "Quote" : "Apostrophe", o = n.enter("definition"), s = n.enter("label"), c = n.createTracker(r), l = c.move("[");
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
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/util/check-emphasis.js
function Lu(e) {
	let t = e.options.emphasis || "*";
	if (t !== "*" && t !== "_") throw Error("Cannot serialize emphasis with `" + t + "` for `options.emphasis`, expected `*`, or `_`");
	return t;
}
// node_modules/.pnpm/micromark-util-classify-character@2.0.1/node_modules/micromark-util-classify-character/index.js
function Ru(e) {
	if (e === null || K(e) || Cc(e)) return 1;
	if (Sc(e)) return 2;
}
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/util/character.js
function zu(e) {
	let t = e.codePointAt(0);
	return t === void 0 ? "" : String.fromCodePoint(t);
}
function Bu(e) {
	let t = e.codePointAt(e.length - 2);
	return t !== void 0 && t > 65535 ? e.slice(-2) : e.slice(-1);
}
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/util/encode-character-reference.js
function Vu(e) {
	return "&#x" + e.toString(16).toUpperCase() + ";";
}
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/util/encode-info.js
function Hu(e, t, n) {
	let r = Ru(e), i = Ru(t);
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
// node_modules/.pnpm/micromark-util-html-tag-name@2.0.1/node_modules/micromark-util-html-tag-name/index.js
var Uu = /* @__PURE__ */ "address.article.aside.base.basefont.blockquote.body.caption.center.col.colgroup.dd.details.dialog.dir.div.dl.dt.fieldset.figcaption.figure.footer.form.frame.frameset.h1.h2.h3.h4.h5.h6.head.header.hr.html.iframe.legend.li.link.main.menu.menuitem.nav.noframes.ol.optgroup.option.p.param.search.section.summary.table.tbody.td.tfoot.th.thead.title.tr.track.ul".split("."), Wu = [
	"pre",
	"script",
	"style",
	"textarea"
];
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/util/html-kind.js
function Gu(e) {
	if (e.charCodeAt(0) !== 60) return;
	let t = e.charCodeAt(1);
	if (t === 33) {
		let t = e.charCodeAt(2);
		return t === 45 ? 2 : t === 91 ? 5 : hc(t) ? 4 : void 0;
	}
	if (t === 63) return 3;
	let n = t === 47, r = n ? 2 : 1, i = r, a = e.charCodeAt(i);
	if (!hc(a)) return;
	for (; a === 45 || gc(a);) a = e.charCodeAt(++i);
	let o = e.slice(r, i).toLowerCase();
	return !n && a !== 47 && Wu.includes(o) ? 1 : Uu.includes(o) ? 6 : 7;
}
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/util/container-phrasing.js
var Ku = /* @__PURE__ */ new Map([["*", !1], ["_", !0]]);
function qu(e, t, n) {
	let r = /* @__PURE__ */ new Set();
	for (let i of e) {
		let e = n.get(i);
		if (e && i.attention && t.some((e) => e.attention === i.attention)) for (let t of e.tokens) r.add(t.attention);
	}
	let i = [];
	for (let t of e) t.attention && r.delete(t.attention) && i.push(t.attention);
	return i.reverse(), i;
}
function Ju(e, t, n) {
	let r = [], i = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map(), o = 0;
	for (; o < e.length;) {
		if (!e[o].attention) {
			o++;
			continue;
		}
		let s = e[o].value.charAt(0), c = Ku.get(s), l = o + 1;
		for (; l < e.length && e[l].attention && e[l].value.charAt(0) === s;) l++;
		let u = o ? e[o - 1].value : t, d = Ru(u.charCodeAt(u.length - 1)), f = Ru((l < e.length ? e[l].value : n).charCodeAt(0)), p = !f || f === 2 && !!d, m = !d || d === 2 && !!f, h = {
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
	for (Zu(r, i), o = -1; ++o < e.length;) {
		let t = i.get(e[o]);
		if (t) return {
			attention: qu(e, t, a),
			index: o
		};
	}
}
function Yu(e, t) {
	let n = e[t ? 0 : e.length - 1];
	if (!n || n.attention) return;
	let r = t ? zu(n.value) : Bu(n.value), i = Vu(r.codePointAt(0));
	if (t) n.value = i + n.value.slice(r.length);
	else {
		let e = n.value.slice(0, n.value.length - r.length), t = 0;
		for (; e.charCodeAt(e.length - 1 - t) === 92;) t++;
		t % 2 && (e += "\\"), n.value = e + i;
	}
}
function Xu(e, t, n, r, i) {
	for (let a of n.attention) {
		let o = t.get(a) || a.sequences[0];
		for (let s of a.sequences) {
			if (s === o) continue;
			let c = new Map(t);
			c.set(a, s);
			let l = rd(e, c, r, i), u = Ju(l, r, i);
			if (!u || u.index > n.index) return {
				chosen: c,
				mistake: u,
				tokens: l
			};
		}
	}
}
function Zu(e, t) {
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
function Qu(e, t, n) {
	if (t.length === 0) throw Error("Cannot serialize `" + e + "` as attention without markers, expected one or more markers");
	if (n.length === 0) throw Error("Cannot serialize `" + e + "` as attention without sizes, expected one or more sizes");
	for (let t of n) if (!Number.isSafeInteger(t) || t < 1) throw Error("Cannot serialize `" + e + "` as attention with `" + t + "` as size, expected positive integer");
	let r = [];
	for (let i of t) {
		if (i.length !== 1) throw Error("Cannot serialize `" + e + "` as attention with `" + i + "` as marker, expected a single ascii character");
		if (!xc(i.charCodeAt(0))) throw Error("Cannot serialize `" + e + "` as attention with `" + i + "` as marker, expected ascii punctuation");
		for (let e of n) r.push(i.repeat(e));
	}
	return r;
}
function $u(e, t, n) {
	let r = t.indexStack, i = e.children || [], a = [], o = -1, s = n.before;
	r.push(-1);
	let c = t.createTracker(n);
	for (; ++o < i.length;) {
		let l = i[o], u;
		if (r[r.length - 1] = o, o + 1 < i.length) {
			let n = t.handle.handlers[i[o + 1].type];
			n && n.peek && (n = n.peek), u = n ? zu(n(i[o + 1], e, t, {
				before: "",
				after: "",
				...c.current()
			})) : "";
		} else u = n.after;
		let d = a[a.length - 1];
		typeof d == "string" && (s === "\r" || s === "\n") && l.type === "html" && Gu(l.value) !== 7 && (a[a.length - 1] = d.replace(/(\r?\n|\r)$/, " "), s = " ", c = t.createTracker(n), c.move(id(a, n.before, n.after)));
		let f = t.handle.handlers[l.type];
		if (f && f.attention) {
			let e = ed(l, f.attention, t, c);
			if (!e) continue;
			a.push(e), s = Bu(e.sequences[0]);
		} else {
			let n = t.handle(l, e, t, {
				...c.current(),
				after: u,
				before: s
			});
			if (!n) continue;
			c.move(n), a.push(n), s = Bu(n);
		}
	}
	return r.pop(), a;
}
function ed(e, t, n, r) {
	let { construct: i, markers: a, sizes: o } = t(e, n), s = Qu(e.type, a, o), c = s[0], l = n.enter(i), u = n.createTracker(r.current());
	u.move(c);
	let d = $u(e, n, {
		...u.current(),
		before: c,
		after: c
	});
	if (l(), d.length !== 0) return r.move(c), r.move(id(d, c, c)), r.move(c), {
		children: d,
		sequences: s
	};
}
function td(e, t, n, r) {
	let i = rd(e, t, n, r), a = Ju(i, n, r);
	for (; a;) {
		let o = Xu(e, t, a, n, r);
		if (!o) return;
		t = o.chosen, i = o.tokens, a = o.mistake;
	}
	return i;
}
function nd(e, t, n, r) {
	let i = n, a = -1;
	for (; ++a < e.length;) {
		let o = e[a];
		if (typeof o == "string") {
			i = "";
			continue;
		}
		let s = a === e.length - 1 ? r : "", c = o.sequences.find(function(t) {
			let r = t.charAt(0);
			return r !== i.charAt(0) && r !== s.charAt(0) || e.length === 1 && Ku.has(r) && t.length > n.length;
		}) || o.sequences[0];
		c !== o.sequences[0] && t.set(o, c), nd(o.children, t, c, c), i = c;
	}
}
function rd(e, t, n, r) {
	let i = [], a, o = Bu(n), s = -1;
	for (; ++s < e.length;) {
		let n = e[s];
		if (typeof n == "string") {
			let e = {
				value: n,
				attention: void 0
			};
			a && a === zu(n) && Yu([e], !0), a = void 0, i.push(e), e.value && (o = Bu(e.value));
			continue;
		}
		let c = t.get(n) || n.sequences[0], l = c.charAt(0), u = e[s + 1], d = o, f = zu(u === void 0 ? r : typeof u == "string" ? u : t.get(u) || u.sequences[0]), p = rd(n.children, t, c, c), m = p[0].value, h = Hu(d.charCodeAt(d.length - 1), m.charCodeAt(0), l);
		h.inside && Yu(p, !0);
		let g = Bu(p[p.length - 1].value), _ = Hu(f.charCodeAt(0), g.charCodeAt(g.length - 1), l);
		_.inside && Yu(p, !1), h.outside && d !== "\n" && d !== "\r" && Yu(i, !1), _.outside && (a = f), i.push({
			value: c,
			attention: n
		}, ...p, {
			value: c,
			attention: n
		}), o = c.charAt(c.length - 1);
	}
	return i;
}
function id(e, t, n) {
	let r = /* @__PURE__ */ new Map();
	nd(e, r, t, n);
	let i = (r.size > 0 ? td(e, r, t, n) : void 0) || td(e, /* @__PURE__ */ new Map(), t, n) || rd(e, /* @__PURE__ */ new Map(), t, n), a = "";
	for (let e of i) a += e.value;
	return a;
}
ad.attention = od, ad.peek = sd;
function ad(e, t, n, r) {
	let i = n.enter("phrasing"), a = ed(e, od, n, n.createTracker(r)), o = a ? id([a], r.before, r.after) : "";
	return i(), o;
}
function od(e, t) {
	return {
		construct: "emphasis",
		markers: Lu(t) === "*" ? ["*", "_"] : ["_", "*"],
		sizes: [1]
	};
}
function sd(e, t, n) {
	return n.options.emphasis || "*";
}
// node_modules/.pnpm/mdast-util-to-string@4.0.0/node_modules/mdast-util-to-string/lib/index.js
var cd = {};
function ld(e, t) {
	let n = t || cd;
	return ud(e, typeof n.includeImageAlt != "boolean" || n.includeImageAlt, typeof n.includeHtml != "boolean" || n.includeHtml);
}
function ud(e, t, n) {
	if (fd(e)) {
		if ("value" in e) return e.type === "html" && !n ? "" : e.value;
		if (t && "alt" in e && e.alt) return e.alt;
		if ("children" in e) return dd(e.children, t, n);
	}
	return Array.isArray(e) ? dd(e, t, n) : "";
}
function dd(e, t, n) {
	let r = [], i = -1;
	for (; ++i < e.length;) r[i] = ud(e[i], t, n);
	return r.join("");
}
function fd(e) {
	return !!(e && typeof e == "object");
}
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/util/format-heading-as-setext.js
function pd(e, t) {
	let n = !1;
	return x(e, function(e) {
		if ("value" in e && /\r?\n|\r/.test(e.value) || e.type === "break") return n = !0, !1;
	}), !!((!e.depth || e.depth < 3) && ld(e) && (t.options.setext || n));
}
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/handle/heading.js
function md(e, t, n, r) {
	let i = Math.max(Math.min(6, e.depth || 1), 1), a = n.createTracker(r);
	if (pd(e, n)) {
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
	return (u === 9 || u === 32) && (l = Vu(u) + l.slice(1)), l = l ? o + " " + l : o, n.options.closeAtx && (l += " " + o), c(), s(), l;
}
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/handle/html.js
hd.peek = gd;
function hd(e) {
	return e.value || "";
}
function gd() {
	return "<";
}
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/handle/image.js
_d.peek = vd;
function _d(e, t, n, r) {
	let i = Fu(n), a = i === "\"" ? "Quote" : "Apostrophe", o = n.enter("image"), s = n.enter("label"), c = n.createTracker(r), l = c.move("![");
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
function vd() {
	return "!";
}
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/handle/image-reference.js
yd.peek = bd;
function yd(e, t, n, r) {
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
function bd() {
	return "!";
}
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/handle/inline-code.js
xd.peek = Sd;
function xd(e, t, n) {
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
function Sd() {
	return "`";
}
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/util/format-link-as-autolink.js
function Cd(e, t) {
	let n = ld(e);
	return !(t.options.resourceLink || !e.url || e.title || !e.children || e.children.length !== 1 || e.children[0].type !== "text" || n !== e.url && "mailto:" + n !== e.url || !/^[a-z][+\-.a-z]+:/i.test(e.url) || /[\0- <>\u007F]/.test(e.url));
}
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/handle/link.js
wd.peek = Td;
function wd(e, t, n, r) {
	let i = Fu(n), a = i === "\"" ? "Quote" : "Apostrophe", o = n.createTracker(r);
	if (Cd(e, n)) {
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
function Td(e, t, n) {
	return Cd(e, n) ? "<" : "[";
}
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/handle/link-reference.js
Ed.peek = Dd;
function Ed(e, t, n, r) {
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
function Dd() {
	return "[";
}
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/util/check-bullet.js
function Od(e) {
	let t = e.options.bullet || "*";
	if (t !== "*" && t !== "+" && t !== "-") throw Error("Cannot serialize items with `" + t + "` for `options.bullet`, expected `*`, `+`, or `-`");
	return t;
}
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/util/check-bullet-other.js
function kd(e) {
	let t = Od(e), n = e.options.bulletOther;
	if (!n) return t === "*" ? "-" : "*";
	if (n !== "*" && n !== "+" && n !== "-") throw Error("Cannot serialize items with `" + n + "` for `options.bulletOther`, expected `*`, `+`, or `-`");
	if (n === t) throw Error("Expected `bullet` (`" + t + "`) and `bulletOther` (`" + n + "`) to be different");
	return n;
}
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/util/check-bullet-ordered.js
function Ad(e) {
	let t = e.options.bulletOrdered || ".";
	if (t !== "." && t !== ")") throw Error("Cannot serialize items with `" + t + "` for `options.bulletOrdered`, expected `.` or `)`");
	return t;
}
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/util/check-rule.js
function jd(e) {
	let t = e.options.rule || "*";
	if (t !== "*" && t !== "-" && t !== "_") throw Error("Cannot serialize rules with `" + t + "` for `options.rule`, expected `*`, `-`, or `_`");
	return t;
}
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/handle/list.js
function Md(e, t, n, r) {
	let i = n.enter("list"), a = n.bulletCurrent, o = e.ordered ? Ad(n) : Od(n), s = e.ordered ? o === "." ? ")" : "." : kd(n), c = t && n.bulletLastUsed ? o === n.bulletLastUsed : !1;
	if (!e.ordered) {
		let t = e.children ? e.children[0] : void 0;
		if (o !== "*" && o !== "-" || !t || t.children && t.children[0] || n.stack[n.stack.length - 1] !== "list" || n.stack[n.stack.length - 2] !== "listItem" || n.stack[n.stack.length - 3] !== "list" || n.stack[n.stack.length - 4] !== "listItem" || n.indexStack[n.indexStack.length - 1] !== 0 || n.indexStack[n.indexStack.length - 2] !== 0 || n.indexStack[n.indexStack.length - 3] !== 0 || (c = !0), jd(n) === o && t) {
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
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/util/check-list-item-indent.js
function Nd(e) {
	let t = e.options.listItemIndent || "one";
	if (t !== "tab" && t !== "one" && t !== "mixed") throw Error("Cannot serialize items with `" + t + "` for `options.listItemIndent`, expected `tab`, `one`, or `mixed`");
	return t;
}
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/handle/list-item.js
function Pd(e, t, n, r) {
	let i = Nd(n), a = n.bulletCurrent || Od(n);
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
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/handle/paragraph.js
function Fd(e, t, n, r) {
	let i = n.enter("paragraph"), a = n.enter("phrasing"), o = n.containerPhrasing(e, r);
	return a(), i(), o;
}
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/handle/root.js
function Id(e, t, n, r) {
	if (!e.children.some(function(e) {
		return wu(e);
	})) return n.containerFlow(e, r);
	let i = n.enter("phrasing"), a = n.containerPhrasing(e, r);
	return i(), a;
}
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/util/check-strong.js
function Ld(e) {
	let t = e.options.strong || "*";
	if (t !== "*" && t !== "_") throw Error("Cannot serialize strong with `" + t + "` for `options.strong`, expected `*`, or `_`");
	return t;
}
Rd.attention = zd, Rd.peek = Bd;
function Rd(e, t, n, r) {
	let i = n.enter("phrasing"), a = ed(e, zd, n, n.createTracker(r)), o = a ? id([a], r.before, r.after) : "";
	return i(), o;
}
function zd(e, t) {
	return {
		construct: "strong",
		markers: Ld(t) === "*" ? ["*", "_"] : ["_", "*"],
		sizes: [2]
	};
}
function Bd(e, t, n) {
	return n.options.strong || "*";
}
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/handle/text.js
function Vd(e, t, n, r) {
	/* c8 ignore next -- parent always passed */
	let i = t ? t.children : [], a = n.indexStack[n.indexStack.length - 1];
	return n.safe(e.value, {
		...r,
		afterNode: i[a + 1],
		beforeNode: i[a - 1]
	});
}
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/util/check-rule-repetition.js
function Hd(e) {
	let t = e.options.ruleRepetition || 3;
	if (t < 3) throw Error("Cannot serialize rules with repetition `" + t + "` for `options.ruleRepetition`, expected `3` or more");
	return t;
}
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/handle/thematic-break.js
function Ud(e, t, n) {
	let r = (jd(n) + (n.options.ruleSpaces ? " " : "")).repeat(Hd(n));
	return n.options.ruleSpaces ? r.slice(0, -1) : r;
}
// node_modules/.pnpm/mdast-util-to-markdown@2.2.3/node_modules/mdast-util-to-markdown/lib/handle/index.js
var Wd = {
	blockquote: Tu,
	break: ku,
	code: Nu,
	definition: Iu,
	emphasis: ad,
	hardBreak: ku,
	heading: md,
	html: hd,
	image: _d,
	imageReference: yd,
	inlineCode: xd,
	link: wd,
	linkReference: Ed,
	list: Md,
	listItem: Pd,
	paragraph: Fd,
	root: Id,
	strong: Rd,
	text: Vd,
	thematicBreak: Ud
}, Gd = document.createElement("i");
function Kd(e) {
	let t = "&" + e + ";";
	Gd.innerHTML = t;
	let n = Gd.textContent;
	return n.charCodeAt(n.length - 1) === 59 && e !== "semi" ? !1 : n !== t && n;
}
// node_modules/.pnpm/micromark-util-decode-numeric-character-reference@2.0.2/node_modules/micromark-util-decode-numeric-character-reference/index.js
function qd(e, t) {
	let n = Number.parseInt(e, t);
	return n < 9 || n === 11 || n > 13 && n < 32 || n > 126 && n < 160 || n > 55295 && n < 57344 || n > 64975 && n < 65008 || (n & 65535) == 65535 || (n & 65535) == 65534 || n > 1114111 ? "�" : String.fromCodePoint(n);
}
// node_modules/.pnpm/micromark-util-decode-string@2.0.1/node_modules/micromark-util-decode-string/index.js
var Jd = /\\([!-/:-@[-`{-~])|&(#(?:\d{1,7}|x[\da-f]{1,6})|[\da-z]{1,31});/gi;
function Yd(e) {
	return e.replace(Jd, Xd);
}
function Xd(e, t, n) {
	if (t) return t;
	if (n.charCodeAt(0) === 35) {
		let e = n.charCodeAt(1), t = e === 120 || e === 88;
		return qd(n.slice(t ? 2 : 1), t ? 16 : 10);
	}
	return Kd(n) || e;
}
// node_modules/.pnpm/mdast-util-gfm-table@2.0.1/node_modules/mdast-util-gfm-table/lib/index.js
function Zd() {
	return {
		enter: {
			table: Qd,
			tableData: nf,
			tableHeader: nf,
			tableRow: ef
		},
		exit: {
			codeText: rf,
			table: $d,
			tableData: tf,
			tableHeader: tf,
			tableRow: tf
		}
	};
}
function Qd(e) {
	let t = e._align;
	this.enter({
		type: "table",
		align: t.map(function(e) {
			return e === "none" ? null : e;
		}),
		children: [],
		position: void 0
	}, e), this.data.inTable = !0;
}
function $d(e) {
	this.exit(e), this.data.inTable = void 0;
}
function ef(e) {
	this.enter({
		type: "tableRow",
		children: [],
		position: void 0
	}, e);
}
function tf(e) {
	this.exit(e);
}
function nf(e) {
	this.enter({
		type: "tableCell",
		children: [],
		position: void 0
	}, e);
}
function rf(e) {
	let t = this.resume();
	this.data.inTable && (t = t.replace(/\\([\\|])/g, af));
	let n = this.stack[this.stack.length - 1];
	n.type, n.value = t, this.exit(e);
}
function af(e, t) {
	return t === "|" ? t : e;
}
function of(e) {
	let { tableCellPadding: t, tablePipeAlign: n, stringLength: r } = e || {}, i = t ? " " : "|";
	return {
		handlers: {
			inlineCode: d,
			table: a,
			tableCell: s,
			tableRow: o
		},
		join: [sf],
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
		]
	};
	function a(e, t, n, r) {
		let i = l(e, n, r), a = i[0];
		if (a) {
			let t = e.align ? e.align.length : 0, n = -1;
			if (!t) for (; ++n < i.length;) i[n].length > t && (t = i[n].length);
			for (; a.length < t;) a.push("");
		}
		return c(i, e.align);
	}
	function o(e, t, n, r) {
		let i = c([u(e, n, r)]);
		return i.slice(0, i.indexOf("\n"));
	}
	function s(e, t, n, r) {
		let a = n.enter("tableCell"), o = n.enter("phrasing"), s = n.containerPhrasing(e, {
			...r,
			before: i,
			after: i
		});
		return o(), a(), s;
	}
	function c(e, i) {
		return xu(e, {
			align: i,
			alignDelimiters: n,
			fillRows: !1,
			padding: t,
			stringLength: r
		});
	}
	function l(e, t, n) {
		let { children: r } = e, i = -1, a = [], o = t.enter("table");
		for (; ++i < r.length;) a[i] = u(r[i], t, n);
		return o(), a;
	}
	function u(e, t, n) {
		let { children: r } = e, i = -1, a = [], o = t.enter("tableRow");
		for (; ++i < r.length;) a[i] = s(r[i], e, t, n);
		return o(), a;
	}
	function d(e, t, n) {
		let r = Wd.inlineCode(e, t, n);
		if (!n.stack.includes("tableCell")) return r;
		let i = [], a = 0, o = r.indexOf("|");
		for (; o !== -1;) {
			let e = o;
			for (; e > a && r.charCodeAt(e - 1) === 92;) e--;
			i.push(r.slice(a, o)), (o - e) % 2 == 0 && i.push("\\"), a = o, o = r.indexOf("|", o + 1);
		}
		return i.push(r.slice(a)), i.join("");
	}
}
function sf(e, t, n, r) {
	if (e.type === "table" && n.type === "listItem" && n.spread === !1 && (t.type === "definition" || t.type === "heading" && cf(t, r) || t.type === "paragraph" || t.type === "table")) return 1;
}
function cf(e, t) {
	let n = !1;
	return x(e, function(e) {
		if (e.type === "break" || "value" in e && /\r?\n|\r/.test(e.value)) return n = !0, !1;
	}), !!((!e.depth || e.depth < 3) && ld(e) && (t.options.setext || n));
}
// node_modules/.pnpm/mdast-util-gfm-task-list-item@2.0.1/node_modules/mdast-util-gfm-task-list-item/lib/index.js
function lf() {
	return { exit: {
		taskListCheckValueChecked: df,
		taskListCheckValueUnchecked: df,
		paragraph: ff
	} };
}
function uf() {
	return {
		handlers: { paragraph: pf },
		join: [mf]
	};
}
function df(e) {
	let t = this.stack[this.stack.length - 2];
	t.type, t.checked = e.type === "taskListCheckValueChecked";
}
function ff(e) {
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
			a === e && (n.value = n.value.slice(1), n.value.length === 0 ? e.children.shift() : e.position && n.position && typeof n.position.start.offset == "number" && (n.position.start.column++, n.position.start.offset++, e.position.start = { ...n.position.start }));
		}
	}
	this.exit(e);
}
function pf(e, t, n, r) {
	if (!t || t.type !== "listItem" || hf(t) !== e) return Wd.paragraph(e, t, n, r);
	let i = "[" + (t.checked ? "x" : " ") + "] ", a = n.createTracker(r);
	return a.move(i), i + Wd.paragraph(e.children.length > 0 ? e : {
		type: "paragraph",
		children: [{
			type: "text",
			value: " "
		}]
	}, t, n, {
		...r,
		...a.current()
	});
}
function mf(e, t, n) {
	if (e.type !== "definition" || n.type !== "listItem") return;
	let r = hf(n);
	if (r && n.children.indexOf(e) < n.children.indexOf(r)) return 0;
}
function hf(e) {
	if (typeof e.checked == "boolean") for (let t of e.children) {
		if (t.type === "paragraph") return t;
		if (t.type !== "definition") return;
	}
}
// node_modules/.pnpm/mdast-util-gfm@3.1.0/node_modules/mdast-util-gfm/lib/index.js
function gf() {
	return [
		Fl(),
		cu(),
		pu(),
		Zd(),
		lf()
	];
}
function _f(e) {
	return { extensions: [
		Il(),
		lu(e),
		mu(),
		of(e),
		uf()
	] };
}
// node_modules/.pnpm/micromark-util-combine-extensions@2.0.1/node_modules/micromark-util-combine-extensions/index.js
var vf = {}.hasOwnProperty;
function yf(e) {
	let t = {}, n = -1;
	for (; ++n < e.length;) bf(t, e[n]);
	return t;
}
function bf(e, t) {
	let n;
	for (n in t) {
		let r = (vf.call(e, n) ? e[n] : void 0) || (e[n] = {}), i = t[n], a;
		if (i) for (a in i) {
			vf.call(r, a) || (r[a] = []);
			let e = i[a];
			xf(r[a], Array.isArray(e) ? e : e ? [e] : []);
		}
	}
}
function xf(e, t) {
	let n = -1, r = [];
	for (; ++n < t.length;) (t[n].add === "after" ? e : r).push(t[n]);
	gl(e, 0, 0, r);
}
// node_modules/.pnpm/micromark-extension-gfm-autolink-literal@2.1.0/node_modules/micromark-extension-gfm-autolink-literal/lib/syntax.js
var Sf = {
	tokenize: If,
	partial: !0
}, Cf = {
	tokenize: Lf,
	partial: !0
}, wf = {
	tokenize: Rf,
	partial: !0
}, Tf = {
	tokenize: zf,
	partial: !0
}, Ef = {
	tokenize: Bf,
	partial: !0
}, Df = {
	name: "wwwAutolink",
	tokenize: Pf,
	previous: Vf
}, Of = {
	name: "protocolAutolink",
	tokenize: Ff,
	previous: Hf
}, kf = {
	name: "emailAutolink",
	tokenize: Nf,
	previous: Uf
}, Af = {};
function jf() {
	return { text: Af };
}
for (var Mf = 48; Mf < 123;) Af[Mf] = kf, Mf++, Mf === 58 ? Mf = 65 : Mf === 91 && (Mf = 97);
Af[43] = kf, Af[45] = kf, Af[46] = kf, Af[95] = kf, Af[72] = [kf, Of], Af[104] = [kf, Of], Af[87] = [kf, Df], Af[119] = [kf, Df];
function Nf(e, t, n) {
	let r = this, i, a;
	return o;
	function o(t) {
		return !Wf(t) || !Uf.call(r, r.previous) || Gf(r.events) ? n(t) : (e.enter("literalAutolink"), e.enter("literalAutolinkEmail"), s(t));
	}
	function s(t) {
		return Wf(t) ? (e.consume(t), s) : t === 64 ? (e.consume(t), c) : n(t);
	}
	function c(t) {
		return t === 46 ? e.check(Ef, u, l)(t) : t === 45 || t === 95 || gc(t) ? (a = !0, e.consume(t), c) : u(t);
	}
	function l(t) {
		return e.consume(t), i = !0, c;
	}
	function u(o) {
		return a && i && hc(r.previous) ? (e.exit("literalAutolinkEmail"), e.exit("literalAutolink"), t(o)) : n(o);
	}
}
function Pf(e, t, n) {
	let r = this;
	return i;
	function i(t) {
		return t !== 87 && t !== 119 || !Vf.call(r, r.previous) || Gf(r.events) ? n(t) : (e.enter("literalAutolink"), e.enter("literalAutolinkWww"), e.check(Sf, e.attempt(Cf, e.attempt(wf, a), n), n)(t));
	}
	function a(n) {
		return e.exit("literalAutolinkWww"), e.exit("literalAutolink"), t(n);
	}
}
function Ff(e, t, n) {
	let r = this, i = "", a = !1;
	return o;
	function o(t) {
		return (t === 72 || t === 104) && Hf.call(r, r.previous) && !Gf(r.events) ? (e.enter("literalAutolink"), e.enter("literalAutolinkHttp"), i += String.fromCodePoint(t), e.consume(t), s) : n(t);
	}
	function s(t) {
		if (hc(t) && i.length < 5) return i += String.fromCodePoint(t), e.consume(t), s;
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
		return t === null || vc(t) || K(t) || Cc(t) || Sc(t) ? n(t) : e.attempt(Cf, e.attempt(wf, u), n)(t);
	}
	function u(n) {
		return e.exit("literalAutolinkHttp"), e.exit("literalAutolink"), t(n);
	}
}
function If(e, t, n) {
	let r = 0;
	return i;
	function i(t) {
		return (t === 87 || t === 119) && r < 3 ? (r++, e.consume(t), i) : t === 46 && r === 3 ? (e.consume(t), a) : n(t);
	}
	function a(e) {
		return e === null ? n(e) : t(e);
	}
}
function Lf(e, t, n) {
	let r, i, a;
	return o;
	function o(t) {
		return t === 46 || t === 95 ? e.check(Tf, c, s)(t) : t === null || K(t) || Cc(t) || t !== 45 && Sc(t) ? c(t) : (a = !0, e.consume(t), o);
	}
	function s(t) {
		return t === 95 ? r = !0 : (i = r, r = void 0), e.consume(t), o;
	}
	function c(e) {
		return i || r || !a ? n(e) : t(e);
	}
}
function Rf(e, t) {
	let n = 0, r = 0;
	return i;
	function i(o) {
		return o === 40 ? (n++, e.consume(o), i) : o === 41 && r < n ? a(o) : o === 33 || o === 34 || o === 38 || o === 39 || o === 41 || o === 42 || o === 44 || o === 46 || o === 58 || o === 59 || o === 60 || o === 63 || o === 93 || o === 95 || o === 126 ? e.check(Tf, t, a)(o) : o === null || K(o) || Cc(o) ? t(o) : (e.consume(o), i);
	}
	function a(t) {
		return t === 41 && r++, e.consume(t), i;
	}
}
function zf(e, t, n) {
	return r;
	function r(o) {
		return o === 33 || o === 34 || o === 39 || o === 41 || o === 42 || o === 44 || o === 46 || o === 58 || o === 59 || o === 63 || o === 95 || o === 126 ? (e.consume(o), r) : o === 38 ? (e.consume(o), a) : o === 93 ? (e.consume(o), i) : o === 60 || o === null || K(o) || Cc(o) ? t(o) : n(o);
	}
	function i(e) {
		return e === null || e === 40 || e === 91 || K(e) || Cc(e) ? t(e) : r(e);
	}
	function a(e) {
		return hc(e) ? o(e) : n(e);
	}
	function o(t) {
		return t === 59 ? (e.consume(t), r) : hc(t) ? (e.consume(t), o) : n(t);
	}
}
function Bf(e, t, n) {
	return r;
	function r(t) {
		return e.consume(t), i;
	}
	function i(e) {
		return gc(e) ? n(e) : t(e);
	}
}
function Vf(e) {
	return e === null || e === 40 || e === 42 || e === 95 || e === 91 || e === 93 || e === 126 || K(e);
}
function Hf(e) {
	return !hc(e);
}
function Uf(e) {
	return !(e === 47 || Wf(e));
}
function Wf(e) {
	return e === 43 || e === 45 || e === 46 || e === 95 || gc(e);
}
function Gf(e) {
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
// node_modules/.pnpm/micromark-util-sanitize-uri@2.0.1/node_modules/micromark-util-sanitize-uri/index.js
function Kf(e) {
	let t = [], n = -1, r = 0, i = 0;
	for (; ++n < e.length;) {
		let a = e.charCodeAt(n), o = "";
		if (a === 37 && gc(e.charCodeAt(n + 1)) && gc(e.charCodeAt(n + 2))) i = 2;
		else if (a < 128) /[!#$&-;=?-Z_a-z~]/.test(String.fromCharCode(a)) || (o = String.fromCharCode(a));
		else if (a > 55295 && a < 57344) {
			let t = e.charCodeAt(n + 1);
			a < 56320 && t > 56319 && t < 57344 ? (o = String.fromCharCode(a, t), i = 1) : o = "�";
		} else o = String.fromCharCode(a);
		o &&= (t.push(e.slice(r, n), encodeURIComponent(o)), r = n + i + 1, ""), i &&= (n += i, 0);
	}
	return t.join("") + e.slice(r);
}
// node_modules/.pnpm/micromark-core-commonmark@2.0.4/node_modules/micromark-core-commonmark/lib/attention.js
var qf = {
	name: "attention",
	resolveAll: Jf,
	tokenize: Yf
};
function Jf(e, t) {
	let n = -1, r;
	for (; ++n < e.length;) if (e[n][0] === "enter" && e[n][1].type === "attentionSequence" && e[n][1]._close) {
		let i = n;
		for (; i--;) if (e[i][0] === "exit" && e[i][1].type === "attentionSequence" && e[i][1]._open && t.sliceSerialize(e[i][1]).charCodeAt(0) === t.sliceSerialize(e[n][1]).charCodeAt(0)) {
			if ((e[i][1]._close || e[n][1]._open) && (e[n][1].end.offset - e[n][1].start.offset) % 3 && !((e[i][1].end.offset - e[i][1].start.offset + e[n][1].end.offset - e[n][1].start.offset) % 3)) continue;
			let a = e[i][1].end.offset - e[i][1].start.offset > 1 && e[n][1].end.offset - e[n][1].start.offset > 1 ? 2 : 1, o = { ...e[i][1].end }, s = { ...e[n][1].start };
			Xf(o, -a), Xf(s, a);
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
			e[i][1].end = { ...c.start }, e[n][1].start = { ...l.end }, r = [], e[i][1].end.offset - e[i][1].start.offset && (r = _l(r, [[
				"enter",
				e[i][1],
				t
			], [
				"exit",
				e[i][1],
				t
			]])), r = _l(r, [
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
			]), r = _l(r, vl(t.parser.constructs.insideSpan.null, e.slice(i + 1, n), t)), r = _l(r, [
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
			e[n][1].end.offset - e[n][1].start.offset && (f = 2, r = _l(r, [[
				"enter",
				e[n][1],
				t
			], [
				"exit",
				e[n][1],
				t
			]])), gl(e, i - 1, n - i + 3, r), n = i + r.length - f - 2;
			break;
		}
	}
	for (n = -1; ++n < e.length;) e[n][1].type === "attentionSequence" && (e[n][1].type = "data");
	return e;
}
function Yf(e, t) {
	let n = this.parser.constructs.attentionMarkers.null, r = this.previous, i = Ru(r), a;
	return o;
	function o(t) {
		return a = t, e.enter("attentionSequence"), s(t);
	}
	function s(o) {
		if (o === a) return e.consume(o), s;
		let c = e.exit("attentionSequence"), l = Ru(o), u = !l || l === 2 && i || n.includes(o) && o !== 42 && o !== 95, d = !i || i === 2 && l || n.includes(r) && r !== 42 && r !== 95;
		return c._open = !!(a === 42 ? u : u && (i || !d)), c._close = !!(a === 42 ? d : d && (l || !u)), t(o);
	}
}
function Xf(e, t) {
	e.column += t, e.offset += t, e._bufferIndex += t;
}
// node_modules/.pnpm/micromark-core-commonmark@2.0.4/node_modules/micromark-core-commonmark/lib/autolink.js
var Zf = {
	name: "autolink",
	tokenize: Qf
};
function Qf(e, t, n) {
	let r = 0;
	return i;
	function i(t) {
		return e.enter("autolink"), e.enter("autolinkMarker"), e.consume(t), e.exit("autolinkMarker"), e.enter("autolinkProtocol"), a;
	}
	function a(t) {
		return hc(t) ? (e.consume(t), o) : t === 64 ? n(t) : l(t);
	}
	function o(e) {
		return e === 43 || e === 45 || e === 46 || gc(e) ? (r = 1, s(e)) : l(e);
	}
	function s(t) {
		return t === 58 ? (e.consume(t), r = 0, c) : (t === 43 || t === 45 || t === 46 || gc(t)) && r++ < 32 ? (e.consume(t), s) : (r = 0, l(t));
	}
	function c(r) {
		return r === 62 ? (e.exit("autolinkProtocol"), e.enter("autolinkMarker"), e.consume(r), e.exit("autolinkMarker"), e.exit("autolink"), t) : r === null || r === 32 || r === 60 || vc(r) ? n(r) : (e.consume(r), c);
	}
	function l(t) {
		return t === 64 ? (e.consume(t), u) : _c(t) ? (e.consume(t), l) : n(t);
	}
	function u(e) {
		return gc(e) ? d(e) : n(e);
	}
	function d(n) {
		return n === 46 ? (e.consume(n), r = 0, u) : n === 62 ? (e.exit("autolinkProtocol").type = "autolinkEmail", e.enter("autolinkMarker"), e.consume(n), e.exit("autolinkMarker"), e.exit("autolink"), t) : f(n);
	}
	function f(t) {
		if ((t === 45 || gc(t)) && r++ < 63) {
			let n = t === 45 ? f : d;
			return e.consume(t), n;
		}
		return n(t);
	}
}
// node_modules/.pnpm/micromark-factory-space@2.1.0/node_modules/micromark-factory-space/index.js
function J(e, t, n, r) {
	let i = r ? r - 1 : Infinity, a = 0;
	return o;
	function o(r) {
		return q(r) ? (e.enter(n), s(r)) : t(r);
	}
	function s(r) {
		return q(r) && a++ < i ? (e.consume(r), s) : (e.exit(n), t(r));
	}
}
function $f(e, t, n, r, i, a) {
	let o = 0;
	return s;
	function s(t) {
		return a > 0 && q(t) ? (e.enter(r), c(t)) : l(t);
	}
	function c(t) {
		return q(t) && o < a ? (e.consume(t), o++, c) : (e.exit(r), l(t));
	}
	function l(e) {
		return o >= i ? t(e) : n(e);
	}
}
// node_modules/.pnpm/micromark-core-commonmark@2.0.4/node_modules/micromark-core-commonmark/lib/blank-line.js
var ep = {
	partial: !0,
	tokenize: tp
};
function tp(e, t, n) {
	return r;
	function r(t) {
		return q(t) ? J(e, i, "linePrefix")(t) : i(t);
	}
	function i(e) {
		return e === null || G(e) ? t(e) : n(e);
	}
}
// node_modules/.pnpm/micromark-core-commonmark@2.0.4/node_modules/micromark-core-commonmark/lib/block-quote.js
var np = {
	continuation: { tokenize: ip },
	exit: ap,
	name: "blockQuote",
	tokenize: rp
};
function rp(e, t, n) {
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
		return q(n) ? (e.enter("blockQuotePrefixWhitespace"), e.consume(n), e.exit("blockQuotePrefixWhitespace"), e.exit("blockQuotePrefix"), t) : (e.exit("blockQuotePrefix"), t(n));
	}
}
function ip(e, t, n) {
	let r = this;
	return i;
	function i(t) {
		return q(t) ? J(e, a, "linePrefix", r.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(t) : a(t);
	}
	function a(r) {
		return e.attempt(np, t, n)(r);
	}
}
function ap(e) {
	e.exit("blockQuote");
}
// node_modules/.pnpm/micromark-core-commonmark@2.0.4/node_modules/micromark-core-commonmark/lib/character-escape.js
var op = {
	name: "characterEscape",
	tokenize: sp
};
function sp(e, t, n) {
	return r;
	function r(t) {
		return e.enter("characterEscape"), e.enter("escapeMarker"), e.consume(t), e.exit("escapeMarker"), i;
	}
	function i(r) {
		return xc(r) ? (e.enter("characterEscapeValue"), e.consume(r), e.exit("characterEscapeValue"), e.exit("characterEscape"), t) : n(r);
	}
}
// node_modules/.pnpm/micromark-core-commonmark@2.0.4/node_modules/micromark-core-commonmark/lib/character-reference.js
var cp = {
	name: "characterReference",
	tokenize: lp
};
function lp(e, t, n) {
	let r = this, i = 0, a, o;
	return s;
	function s(t) {
		return e.enter("characterReference"), e.enter("characterReferenceMarker"), e.consume(t), e.exit("characterReferenceMarker"), c;
	}
	function c(t) {
		return t === 35 ? (e.enter("characterReferenceMarkerNumeric"), e.consume(t), e.exit("characterReferenceMarkerNumeric"), l) : (e.enter("characterReferenceValue"), a = 31, o = gc, u(t));
	}
	function l(t) {
		return t === 88 || t === 120 ? (e.enter("characterReferenceMarkerHexadecimal"), e.consume(t), e.exit("characterReferenceMarkerHexadecimal"), e.enter("characterReferenceValue"), a = 6, o = bc, u) : (e.enter("characterReferenceValue"), a = 7, o = yc, u(t));
	}
	function u(s) {
		if (s === 59 && i) {
			let i = e.exit("characterReferenceValue");
			return o === gc && !Kd(r.sliceSerialize(i)) ? n(s) : (e.enter("characterReferenceMarker"), e.consume(s), e.exit("characterReferenceMarker"), e.exit("characterReference"), t);
		}
		return o(s) && i++ < a ? (e.consume(s), u) : n(s);
	}
}
// node_modules/.pnpm/micromark-core-commonmark@2.0.4/node_modules/micromark-core-commonmark/lib/partial-non-lazy-continuation.js
var up = {
	partial: !0,
	tokenize: dp
};
function dp(e, t, n) {
	let r = this;
	return i;
	function i(t) {
		return t === null ? n(t) : (e.enter("lineEnding"), e.consume(t), e.exit("lineEnding"), a);
	}
	function a(e) {
		return r.parser.lazy[r.now().line] ? n(e) : t(e);
	}
}
// node_modules/.pnpm/micromark-core-commonmark@2.0.4/node_modules/micromark-core-commonmark/lib/code-fenced.js
var fp = {
	concrete: !0,
	name: "codeFenced",
	tokenize: pp
};
function pp(e, t, n) {
	let r = this, i = {
		partial: !0,
		tokenize: x
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
		return t === s ? (o++, e.consume(t), u) : o < 3 ? n(t) : (e.exit("codeFencedFenceSequence"), q(t) ? J(e, d, "whitespace")(t) : d(t));
	}
	function d(n) {
		return n === null || G(n) ? (e.exit("codeFencedFence"), r.interrupt ? t(n) : e.check(up, h, b)(n)) : (e.enter("codeFencedFenceInfo"), e.enter("chunkString", { contentType: "string" }), f(n));
	}
	function f(t) {
		return t === null || G(t) ? (e.exit("chunkString"), e.exit("codeFencedFenceInfo"), d(t)) : q(t) ? (e.exit("chunkString"), e.exit("codeFencedFenceInfo"), J(e, p, "whitespace")(t)) : t === 96 && t === s ? n(t) : (e.consume(t), f);
	}
	function p(t) {
		return t === null || G(t) ? d(t) : (e.enter("codeFencedFenceMeta"), e.enter("chunkString", { contentType: "string" }), m(t));
	}
	function m(t) {
		return t === null || G(t) ? (e.exit("chunkString"), e.exit("codeFencedFenceMeta"), d(t)) : t === 96 && t === s ? n(t) : (e.consume(t), m);
	}
	function h(t) {
		return e.attempt(i, b, g)(t);
	}
	function g(t) {
		return e.enter("lineEnding"), e.consume(t), e.exit("lineEnding"), _;
	}
	function _(t) {
		return a > 0 && q(t) ? J(e, v, "linePrefix", a + 1)(t) : v(t);
	}
	function v(t) {
		return t === null || G(t) ? e.check(up, h, b)(t) : (e.enter("codeFlowValue"), y(t));
	}
	function y(t) {
		return t === null || G(t) ? (e.exit("codeFlowValue"), v(t)) : (e.consume(t), y);
	}
	function b(n) {
		return e.exit("codeFenced"), t(n);
	}
	function x(e, t, n) {
		let i = 0;
		return a;
		function a(t) {
			return e.enter("lineEnding"), e.consume(t), e.exit("lineEnding"), c;
		}
		function c(t) {
			return e.enter("codeFencedFence"), q(t) ? J(e, l, "linePrefix", r.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(t) : l(t);
		}
		function l(t) {
			return t === s ? (e.enter("codeFencedFenceSequence"), u(t)) : n(t);
		}
		function u(t) {
			return t === s ? (i++, e.consume(t), u) : i >= o ? (e.exit("codeFencedFenceSequence"), q(t) ? J(e, d, "whitespace")(t) : d(t)) : n(t);
		}
		function d(r) {
			return r === null || G(r) ? (e.exit("codeFencedFence"), t(r)) : n(r);
		}
	}
}
// node_modules/.pnpm/micromark-core-commonmark@2.0.4/node_modules/micromark-core-commonmark/lib/code-indented.js
var mp = {
	name: "codeIndented",
	tokenize: gp
}, hp = {
	partial: !0,
	tokenize: _p
};
function gp(e, t, n) {
	return r;
	function r(t) {
		return e.enter("codeIndented"), $f(e, i, n, "linePrefix", 4, 4)(t);
	}
	function i(t) {
		return t === null ? o(t) : G(t) ? e.attempt(hp, i, o)(t) : (e.enter("codeFlowValue"), a(t));
	}
	function a(t) {
		return t === null || G(t) ? (e.exit("codeFlowValue"), i(t)) : (e.consume(t), a);
	}
	function o(n) {
		return e.exit("codeIndented"), t(n);
	}
}
function _p(e, t, n) {
	let r = this;
	return i;
	function i(o) {
		return r.parser.lazy[r.now().line] ? n(o) : G(o) ? (e.enter("lineEnding"), e.consume(o), e.exit("lineEnding"), i) : $f(e, t, a, "linePrefix", 4, 4)(o);
	}
	function a(e) {
		return G(e) ? i(e) : n(e);
	}
}
// node_modules/.pnpm/micromark-core-commonmark@2.0.4/node_modules/micromark-core-commonmark/lib/code-text.js
var vp = {
	name: "codeText",
	previous: bp,
	resolve: yp,
	tokenize: xp
};
function yp(e) {
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
function bp(e) {
	return e !== 96 || this.events[this.events.length - 1][1].type === "characterEscape";
}
function xp(e, t, n) {
	let r = 0, i, a;
	return o;
	function o(t) {
		return e.enter("codeText"), e.enter("codeTextSequence"), s(t);
	}
	function s(t) {
		return t === 96 ? (e.consume(t), r++, s) : (e.exit("codeTextSequence"), c(t));
	}
	function c(t) {
		return t === null ? n(t) : t === 32 ? (e.enter("space"), e.consume(t), e.exit("space"), c) : t === 96 ? (a = e.enter("codeTextSequence"), i = 0, u(t)) : G(t) ? (e.enter("lineEnding"), e.consume(t), e.exit("lineEnding"), c) : (e.enter("codeTextData"), l(t));
	}
	function l(t) {
		return t === null || t === 32 || t === 96 || G(t) ? (e.exit("codeTextData"), c(t)) : (e.consume(t), l);
	}
	function u(n) {
		return n === 96 ? (e.consume(n), i++, u) : i === r ? (e.exit("codeTextSequence"), e.exit("codeText"), t(n)) : (a.type = "codeTextData", l(n));
	}
}
// node_modules/.pnpm/micromark-util-subtokenize@2.1.0/node_modules/micromark-util-subtokenize/lib/splice-buffer.js
var Sp = class {
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
		return n && Cp(this.left, n), i.reverse();
	}
	pop() {
		return this.setCursor(Infinity), this.left.pop();
	}
	push(e) {
		this.setCursor(Infinity), this.left.push(e);
	}
	pushMany(e) {
		this.setCursor(Infinity), Cp(this.left, e);
	}
	unshift(e) {
		this.setCursor(0), this.right.push(e);
	}
	unshiftMany(e) {
		this.setCursor(0), Cp(this.right, e.reverse());
	}
	setCursor(e) {
		if (!(e === this.left.length || e > this.left.length && this.right.length === 0 || e < 0 && this.left.length === 0)) {
			if (e < this.left.length) {
				let t = this.left.splice(e, Infinity);
				Cp(this.right, t.reverse());
			} else {
				let t = this.right.splice(this.left.length + this.right.length - e, Infinity);
				Cp(this.left, t.reverse());
			}
		}
	}
};
function Cp(e, t) {
	let n = 0;
	if (t.length < 1e4) e.push(...t);
	else for (; n < t.length;) e.push(...t.slice(n, n + 1e4)), n += 1e4;
}
// node_modules/.pnpm/micromark-util-subtokenize@2.1.0/node_modules/micromark-util-subtokenize/index.js
function wp(e) {
	let t = {}, n = -1, r, i, a, o, s, c, l, u = new Sp(e);
	for (; ++n < u.length;) {
		for (; n in t;) n = t[n];
		if (r = u.get(n), n && r[1].type === "chunkFlow" && u.get(n - 1)[1].type === "listItemPrefix" && (c = r[1]._tokenizer.events, a = 0, a < c.length && c[a][1].type === "lineEndingBlank" && (a += 2), a < c.length && c[a][1].type === "content")) for (; ++a < c.length && c[a][1].type !== "content";) c[a][1].type === "chunkText" && (c[a][1]._isInFirstContentOfListItem = !0, a++);
		if (r[0] === "enter") r[1].contentType && (Object.assign(t, Tp(u, n)), n = t[n], l = !0);
		else if (r[1]._container) {
			for (a = n, i = void 0; a--;) if (o = u.get(a), o[1].type === "lineEnding" || o[1].type === "lineEndingBlank") o[0] === "enter" && (i && (u.get(i)[1].type = "lineEndingBlank"), o[1].type = "lineEnding", i = a);
			else if (o[1].type !== "linePrefix" && o[1].type !== "listItemIndent") break;
			i && (r[1].end = { ...u.get(i)[1].start }, s = u.slice(i, n), s.unshift(r), u.splice(i, n - i + 1, s));
		}
	}
	return gl(e, 0, Infinity, u.slice(0)), !l;
}
function Tp(e, t) {
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
// node_modules/.pnpm/micromark-core-commonmark@2.0.4/node_modules/micromark-core-commonmark/lib/content.js
var Ep = {
	resolve: Op,
	tokenize: kp
}, Dp = {
	partial: !0,
	tokenize: Ap
};
function Op(e) {
	return wp(e), e;
}
function kp(e, t) {
	let n;
	return r;
	function r(t) {
		return e.enter("content"), n = e.enter("chunkContent", { contentType: "content" }), i(t);
	}
	function i(t) {
		return t === null ? a(t) : G(t) ? e.check(Dp, o, a)(t) : (e.consume(t), i);
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
function Ap(e, t, n) {
	let r = this;
	return i;
	function i(t) {
		return e.exit("chunkContent"), e.enter("lineEnding"), e.consume(t), e.exit("lineEnding"), J(e, a, "linePrefix");
	}
	function a(i) {
		if (i === null || G(i)) return n(i);
		let a = r.events[r.events.length - 1];
		return !r.parser.constructs.disable.null.includes("codeIndented") && a && a[1].type === "linePrefix" && a[2].sliceSerialize(a[1], !0).length >= 4 ? t(i) : e.interrupt(r.parser.constructs.flow, n, t)(i);
	}
}
// node_modules/.pnpm/micromark-factory-destination@2.0.1/node_modules/micromark-factory-destination/index.js
function jp(e, t, n, r, i, a, o, s, c) {
	let l = c || Infinity, u = 0;
	return d;
	function d(t) {
		return t === 60 ? (e.enter(r), e.enter(i), e.enter(a), e.consume(t), e.exit(a), f) : t === null || t === 32 || t === 41 || vc(t) ? n(t) : (e.enter(r), e.enter(o), e.enter(s), e.enter("chunkString", { contentType: "string" }), h(t));
	}
	function f(n) {
		return n === 62 ? (e.enter(a), e.consume(n), e.exit(a), e.exit(i), e.exit(r), t) : (e.enter(s), e.enter("chunkString", { contentType: "string" }), p(n));
	}
	function p(t) {
		return t === 62 ? (e.exit("chunkString"), e.exit(s), f(t)) : t === null || t === 60 || G(t) ? n(t) : (e.consume(t), t === 92 ? m : p);
	}
	function m(t) {
		return t === 60 || t === 62 || t === 92 ? (e.consume(t), p) : p(t);
	}
	function h(i) {
		return !u && (i === null || i === 41 || K(i)) ? (e.exit("chunkString"), e.exit(s), e.exit(o), e.exit(r), t(i)) : u < l && i === 40 ? (e.consume(i), u++, h) : i === 41 ? (e.consume(i), u--, h) : i === null || i === 32 || i === 40 || vc(i) ? n(i) : (e.consume(i), i === 92 ? g : h);
	}
	function g(t) {
		return t === 40 || t === 41 || t === 92 ? (e.consume(t), h) : h(t);
	}
}
// node_modules/.pnpm/micromark-factory-label@2.0.1/node_modules/micromark-factory-label/index.js
function Mp(e, t, n, r, i, a) {
	let o = this, s = 0, c;
	return l;
	function l(t) {
		return e.enter(r), e.enter(i), e.consume(t), e.exit(i), e.enter(a), u;
	}
	function u(l) {
		return s > 999 || l === null || l === 91 || l === 93 && !c || 
		/* c8 ignore next 3 */
		l === 94 && !s && "_hiddenFootnoteSupport" in o.parser.constructs ? n(l) : l === 93 ? (e.exit(a), e.enter(i), e.consume(l), e.exit(i), e.exit(r), t) : G(l) ? (e.enter("lineEnding"), e.consume(l), e.exit("lineEnding"), u) : (e.enter("chunkString", { contentType: "string" }), d(l));
	}
	function d(t) {
		return t === null || t === 91 || t === 93 || G(t) || s++ > 999 ? (e.exit("chunkString"), u(t)) : (e.consume(t), c ||= !q(t), t === 92 ? f : d);
	}
	function f(t) {
		return t === 91 || t === 92 || t === 93 ? (e.consume(t), s++, d) : d(t);
	}
}
// node_modules/.pnpm/micromark-factory-title@2.0.1/node_modules/micromark-factory-title/index.js
function Np(e, t, n, r, i, a) {
	let o;
	return s;
	function s(t) {
		return t === 34 || t === 39 || t === 40 ? (e.enter(r), e.enter(i), e.consume(t), e.exit(i), o = t === 40 ? 41 : t, c) : n(t);
	}
	function c(n) {
		return n === o ? (e.enter(i), e.consume(n), e.exit(i), e.exit(r), t) : (e.enter(a), l(n));
	}
	function l(t) {
		return t === o ? (e.exit(a), c(o)) : t === null ? n(t) : G(t) ? (e.enter("lineEnding"), e.consume(t), e.exit("lineEnding"), J(e, l, "linePrefix")) : (e.enter("chunkString", { contentType: "string" }), u(t));
	}
	function u(t) {
		return t === o || t === null || G(t) ? (e.exit("chunkString"), l(t)) : (e.consume(t), t === 92 ? d : u);
	}
	function d(t) {
		return t === o || t === 92 ? (e.consume(t), u) : u(t);
	}
}
// node_modules/.pnpm/micromark-factory-whitespace@2.0.1/node_modules/micromark-factory-whitespace/index.js
function Pp(e, t) {
	let n;
	return r;
	function r(i) {
		return G(i) ? (e.enter("lineEnding"), e.consume(i), e.exit("lineEnding"), n = !0, r) : q(i) ? J(e, r, n ? "linePrefix" : "lineSuffix")(i) : t(i);
	}
}
// node_modules/.pnpm/micromark-core-commonmark@2.0.4/node_modules/micromark-core-commonmark/lib/definition.js
var Fp = {
	name: "definition",
	tokenize: Lp
}, Ip = {
	partial: !0,
	tokenize: Rp
};
function Lp(e, t, n) {
	let r = this, i;
	return a;
	function a(t) {
		return e.enter("definition"), o(t);
	}
	function o(t) {
		return Mp.call(r, e, s, n, "definitionLabel", "definitionLabelMarker", "definitionLabelString")(t);
	}
	function s(t) {
		return i = Zl(r.sliceSerialize(r.events[r.events.length - 1][1]).slice(1, -1)), t === 58 ? (e.enter("definitionMarker"), e.consume(t), e.exit("definitionMarker"), c) : n(t);
	}
	function c(t) {
		return K(t) ? Pp(e, l)(t) : l(t);
	}
	function l(t) {
		return jp(e, u, n, "definitionDestination", "definitionDestinationLiteral", "definitionDestinationLiteralMarker", "definitionDestinationRaw", "definitionDestinationString")(t);
	}
	function u(t) {
		return e.attempt(Ip, d, d)(t);
	}
	function d(t) {
		return q(t) ? J(e, f, "whitespace")(t) : f(t);
	}
	function f(a) {
		return a === null || G(a) ? (e.exit("definition"), r.parser.defined.push(i), t(a)) : n(a);
	}
}
function Rp(e, t, n) {
	return r;
	function r(t) {
		return K(t) ? Pp(e, i)(t) : n(t);
	}
	function i(t) {
		return Np(e, a, n, "definitionTitle", "definitionTitleMarker", "definitionTitleString")(t);
	}
	function a(t) {
		return q(t) ? J(e, o, "whitespace")(t) : o(t);
	}
	function o(e) {
		return e === null || G(e) ? t(e) : n(e);
	}
}
// node_modules/.pnpm/micromark-core-commonmark@2.0.4/node_modules/micromark-core-commonmark/lib/hard-break-escape.js
var zp = {
	name: "hardBreakEscape",
	tokenize: Bp
};
function Bp(e, t, n) {
	return r;
	function r(t) {
		return e.enter("hardBreakEscape"), e.consume(t), i;
	}
	function i(r) {
		return G(r) ? (e.exit("hardBreakEscape"), t(r)) : n(r);
	}
}
// node_modules/.pnpm/micromark-core-commonmark@2.0.4/node_modules/micromark-core-commonmark/lib/heading-atx.js
var Vp = {
	name: "headingAtx",
	resolve: Hp,
	tokenize: Up
};
function Hp(e, t) {
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
		gl(e, r, n - r + 1, [
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
function Up(e, t, n) {
	let r = 0;
	return i;
	function i(t) {
		return e.enter("atxHeading"), a(t);
	}
	function a(t) {
		return e.enter("atxHeadingSequence"), o(t);
	}
	function o(t) {
		return t === 35 && r++ < 6 ? (e.consume(t), o) : t === null || K(t) ? (e.exit("atxHeadingSequence"), s(t)) : n(t);
	}
	function s(n) {
		return n === 35 ? (e.enter("atxHeadingSequence"), c(n)) : n === null || G(n) ? (e.exit("atxHeading"), t(n)) : q(n) ? J(e, s, "whitespace")(n) : (e.enter("atxHeadingText"), l(n));
	}
	function c(t) {
		return t === 35 ? (e.consume(t), c) : (e.exit("atxHeadingSequence"), s(t));
	}
	function l(t) {
		return t === null || t === 35 || K(t) ? (e.exit("atxHeadingText"), s(t)) : (e.consume(t), l);
	}
}
// node_modules/.pnpm/micromark-core-commonmark@2.0.4/node_modules/micromark-core-commonmark/lib/html-flow.js
var Wp = {
	concrete: !0,
	name: "htmlFlow",
	resolveTo: Kp,
	tokenize: qp
}, Gp = {
	partial: !0,
	tokenize: Jp
};
function Kp(e) {
	let t = e.length;
	for (; t-- && (e[t][0] !== "enter" || e[t][1].type !== "htmlFlow"););
	return t > 1 && e[t - 2][1].type === "linePrefix" && (e[t][1].start = e[t - 2][1].start, e[t + 1][1].start = e[t - 2][1].start, e.splice(t - 2, 2)), e;
}
function qp(e, t, n) {
	let r = this, i, a, o, s, c;
	return l;
	function l(e) {
		return u(e);
	}
	function u(t) {
		return e.enter("htmlFlow"), e.enter("htmlFlowData"), e.consume(t), d;
	}
	function d(s) {
		return s === 33 ? (e.consume(s), f) : s === 47 ? (e.consume(s), a = !0, h) : s === 63 ? (e.consume(s), i = 3, r.interrupt ? t : A) : hc(s) ? (e.consume(s), o = String.fromCharCode(s), g) : n(s);
	}
	function f(a) {
		return a === 45 ? (e.consume(a), i = 2, p) : a === 91 ? (e.consume(a), i = 5, s = 0, m) : hc(a) ? (e.consume(a), i = 4, r.interrupt ? t : A) : n(a);
	}
	function p(i) {
		return i === 45 ? (e.consume(i), r.interrupt ? t : A) : n(i);
	}
	function m(i) {
		return i === "CDATA[".charCodeAt(s++) ? (e.consume(i), s === 6 ? r.interrupt ? t : D : m) : n(i);
	}
	function h(t) {
		return hc(t) ? (e.consume(t), o = String.fromCharCode(t), g) : n(t);
	}
	function g(s) {
		if (s === null || s === 47 || s === 62 || K(s)) {
			let c = s === 47, l = o.toLowerCase();
			return !c && !a && Wu.includes(l) ? (i = 1, r.interrupt ? t(s) : D(s)) : Uu.includes(o.toLowerCase()) ? (i = 6, c ? (e.consume(s), _) : r.interrupt ? t(s) : D(s)) : (i = 7, r.interrupt && !r.parser.lazy[r.now().line] ? n(s) : a ? v(s) : y(s));
		}
		return s === 45 || gc(s) ? (e.consume(s), o += String.fromCharCode(s), g) : n(s);
	}
	function _(i) {
		return i === 62 ? (e.consume(i), r.interrupt ? t : D) : n(i);
	}
	function v(t) {
		return q(t) ? (e.consume(t), v) : T(t);
	}
	function y(t) {
		return t === 47 ? (e.consume(t), T) : t === 58 || t === 95 || hc(t) ? (e.consume(t), b) : q(t) ? (e.consume(t), y) : T(t);
	}
	function b(t) {
		return t === 45 || t === 46 || t === 58 || t === 95 || gc(t) ? (e.consume(t), b) : x(t);
	}
	function x(t) {
		return t === 61 ? (e.consume(t), ee) : q(t) ? (e.consume(t), x) : y(t);
	}
	function ee(t) {
		return t === null || t === 60 || t === 61 || t === 62 || t === 96 ? n(t) : t === 34 || t === 39 ? (e.consume(t), c = t, S) : q(t) ? (e.consume(t), ee) : C(t);
	}
	function S(t) {
		return t === c ? (e.consume(t), c = null, w) : t === null || G(t) ? n(t) : (e.consume(t), S);
	}
	function C(t) {
		return t === null || t === 34 || t === 39 || t === 47 || t === 60 || t === 61 || t === 62 || t === 96 || K(t) ? x(t) : (e.consume(t), C);
	}
	function w(e) {
		return e === 47 || e === 62 || q(e) ? y(e) : n(e);
	}
	function T(t) {
		return t === 62 ? (e.consume(t), E) : n(t);
	}
	function E(t) {
		return t === null || G(t) ? D(t) : q(t) ? (e.consume(t), E) : n(t);
	}
	function D(t) {
		return t === 45 && i === 2 ? (e.consume(t), O) : t === 60 && i === 1 ? (e.consume(t), k) : t === 62 && i === 4 ? (e.consume(t), oe) : t === 63 && i === 3 ? (e.consume(t), A) : t === 93 && i === 5 ? (e.consume(t), ae) : G(t) && (i === 6 || i === 7) ? (e.exit("htmlFlowData"), e.check(Gp, se, te)(t)) : t === null || G(t) ? (e.exit("htmlFlowData"), te(t)) : (e.consume(t), D);
	}
	function te(t) {
		return e.check(up, ne, se)(t);
	}
	function ne(t) {
		return e.enter("lineEnding"), e.consume(t), e.exit("lineEnding"), re;
	}
	function re(t) {
		return t === null || G(t) ? te(t) : (e.enter("htmlFlowData"), D(t));
	}
	function O(t) {
		return t === 45 ? (e.consume(t), A) : D(t);
	}
	function k(t) {
		return t === 47 ? (e.consume(t), o = "", ie) : D(t);
	}
	function ie(t) {
		if (t === 62) {
			let n = o.toLowerCase();
			return Wu.includes(n) ? (e.consume(t), oe) : D(t);
		}
		return hc(t) && o.length < 8 ? (e.consume(t), o += String.fromCharCode(t), ie) : D(t);
	}
	function ae(t) {
		return t === 93 ? (e.consume(t), A) : D(t);
	}
	function A(t) {
		return t === 62 ? (e.consume(t), oe) : t === 45 && i === 2 ? (e.consume(t), A) : D(t);
	}
	function oe(t) {
		return t === null || G(t) ? (e.exit("htmlFlowData"), se(t)) : (e.consume(t), oe);
	}
	function se(n) {
		return e.exit("htmlFlow"), t(n);
	}
}
function Jp(e, t, n) {
	return r;
	function r(r) {
		return e.enter("lineEnding"), e.consume(r), e.exit("lineEnding"), e.attempt(ep, t, n);
	}
}
// node_modules/.pnpm/micromark-core-commonmark@2.0.4/node_modules/micromark-core-commonmark/lib/html-text.js
var Yp = {
	name: "htmlText",
	tokenize: Xp
};
function Xp(e, t, n) {
	let r = this, i, a, o;
	return s;
	function s(t) {
		return e.enter("htmlText"), e.enter("htmlTextData"), e.consume(t), c;
	}
	function c(t) {
		return t === 33 ? (e.consume(t), l) : t === 47 ? (e.consume(t), x) : t === 63 ? (e.consume(t), y) : hc(t) ? (e.consume(t), C) : n(t);
	}
	function l(t) {
		return t === 45 ? (e.consume(t), u) : t === 91 ? (e.consume(t), a = 0, m) : hc(t) ? (e.consume(t), v) : n(t);
	}
	function u(t) {
		return t === 45 ? (e.consume(t), p) : n(t);
	}
	function d(t) {
		return t === null ? n(t) : t === 45 ? (e.consume(t), f) : G(t) ? (o = d, k(t)) : (e.consume(t), d);
	}
	function f(t) {
		return t === 45 ? (e.consume(t), p) : d(t);
	}
	function p(e) {
		return e === 62 ? O(e) : e === 45 ? f(e) : d(e);
	}
	function m(t) {
		return t === "CDATA[".charCodeAt(a++) ? (e.consume(t), a === 6 ? h : m) : n(t);
	}
	function h(t) {
		return t === null ? n(t) : t === 93 ? (e.consume(t), g) : G(t) ? (o = h, k(t)) : (e.consume(t), h);
	}
	function g(t) {
		return t === 93 ? (e.consume(t), _) : h(t);
	}
	function _(t) {
		return t === 62 ? O(t) : t === 93 ? (e.consume(t), _) : h(t);
	}
	function v(t) {
		return t === null || t === 62 ? O(t) : G(t) ? (o = v, k(t)) : (e.consume(t), v);
	}
	function y(t) {
		return t === null ? n(t) : t === 63 ? (e.consume(t), b) : G(t) ? (o = y, k(t)) : (e.consume(t), y);
	}
	function b(e) {
		return e === 62 ? O(e) : y(e);
	}
	function x(t) {
		return hc(t) ? (e.consume(t), ee) : n(t);
	}
	function ee(t) {
		return t === 45 || gc(t) ? (e.consume(t), ee) : S(t);
	}
	function S(t) {
		return G(t) ? (o = S, k(t)) : q(t) ? (e.consume(t), S) : O(t);
	}
	function C(t) {
		return t === 45 || gc(t) ? (e.consume(t), C) : t === 47 || t === 62 || K(t) ? w(t) : n(t);
	}
	function w(t) {
		return t === 47 ? (e.consume(t), O) : t === 58 || t === 95 || hc(t) ? (e.consume(t), T) : G(t) ? (o = w, k(t)) : q(t) ? (e.consume(t), w) : O(t);
	}
	function T(t) {
		return t === 45 || t === 46 || t === 58 || t === 95 || gc(t) ? (e.consume(t), T) : E(t);
	}
	function E(t) {
		return t === 61 ? (e.consume(t), D) : G(t) ? (o = E, k(t)) : q(t) ? (e.consume(t), E) : w(t);
	}
	function D(t) {
		return t === null || t === 60 || t === 61 || t === 62 || t === 96 ? n(t) : t === 34 || t === 39 ? (e.consume(t), i = t, te) : G(t) ? (o = D, k(t)) : q(t) ? (e.consume(t), D) : (e.consume(t), ne);
	}
	function te(t) {
		return t === i ? (e.consume(t), i = void 0, re) : t === null ? n(t) : G(t) ? (o = te, k(t)) : (e.consume(t), te);
	}
	function ne(t) {
		return t === null || t === 34 || t === 39 || t === 60 || t === 61 || t === 96 ? n(t) : t === 47 || t === 62 || K(t) ? w(t) : (e.consume(t), ne);
	}
	function re(e) {
		return e === 47 || e === 62 || K(e) ? w(e) : n(e);
	}
	function O(r) {
		return r === 62 ? (e.consume(r), e.exit("htmlTextData"), e.exit("htmlText"), t) : n(r);
	}
	function k(t) {
		return e.exit("htmlTextData"), e.enter("lineEnding"), e.consume(t), e.exit("lineEnding"), ie;
	}
	function ie(t) {
		return q(t) ? J(e, ae, "linePrefix", r.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(t) : ae(t);
	}
	function ae(t) {
		return e.enter("htmlTextData"), o(t);
	}
}
// node_modules/.pnpm/micromark-core-commonmark@2.0.4/node_modules/micromark-core-commonmark/lib/label-end.js
var Zp = {
	name: "labelEnd",
	resolveAll: tm,
	resolveTo: nm,
	tokenize: rm
}, Qp = { tokenize: im }, $p = { tokenize: am }, em = { tokenize: om };
function tm(e) {
	let t = -1, n = [];
	for (; ++t < e.length;) {
		let r = e[t][1];
		if (n.push(e[t]), r.type === "labelImage" || r.type === "labelLink" || r.type === "labelEnd") {
			let e = r.type === "labelImage" ? 4 : 2;
			r.type = "data", t += e;
		}
	}
	return e.length !== n.length && gl(e, 0, e.length, n), e;
}
function nm(e, t) {
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
	]], o = _l(o, e.slice(i + 1, i + r + 3)), o = _l(o, [[
		"enter",
		l,
		t
	]]), o = _l(o, vl(t.parser.constructs.insideSpan.null, e.slice(i + r + 4, a - 3), t)), o = _l(o, [
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
	]), o = _l(o, e.slice(a + 1)), o = _l(o, [[
		"exit",
		s,
		t
	]]), gl(e, i, e.length, o), e;
}
function rm(e, t, n) {
	let r = this, i = r._labelStarts, a, o;
	if (i) {
		for (; i.length > 0 && i[i.length - 1]._balanced;) i.pop();
		a = i[i.length - 1];
	}
	return s;
	function s(t) {
		return a ? a._inactive ? d(t) : (o = r.parser.defined.includes(Zl(r.sliceSerialize({
			start: a.end,
			end: r.now()
		}))), e.enter("labelEnd"), e.enter("labelMarker"), e.consume(t), e.exit("labelMarker"), e.exit("labelEnd"), c) : n(t);
	}
	function c(t) {
		return t === 40 ? e.attempt(Qp, u, o ? u : d)(t) : t === 91 ? e.attempt($p, u, o ? l : d)(t) : o ? u(t) : d(t);
	}
	function l(t) {
		return e.attempt(em, u, d)(t);
	}
	function u(e) {
		return i.pop(), t(e);
	}
	function d(e) {
		return a._balanced = !0, n(e);
	}
}
function im(e, t, n) {
	return r;
	function r(t) {
		return e.enter("resource"), e.enter("resourceMarker"), e.consume(t), e.exit("resourceMarker"), i;
	}
	function i(t) {
		return K(t) ? Pp(e, a)(t) : a(t);
	}
	function a(t) {
		return t === 41 ? u(t) : jp(e, o, s, "resourceDestination", "resourceDestinationLiteral", "resourceDestinationLiteralMarker", "resourceDestinationRaw", "resourceDestinationString", 32)(t);
	}
	function o(t) {
		return K(t) ? Pp(e, c)(t) : u(t);
	}
	function s(e) {
		return n(e);
	}
	function c(t) {
		return t === 34 || t === 39 || t === 40 ? Np(e, l, n, "resourceTitle", "resourceTitleMarker", "resourceTitleString")(t) : u(t);
	}
	function l(t) {
		return K(t) ? Pp(e, u)(t) : u(t);
	}
	function u(r) {
		return r === 41 ? (e.enter("resourceMarker"), e.consume(r), e.exit("resourceMarker"), e.exit("resource"), t) : n(r);
	}
}
function am(e, t, n) {
	let r = this;
	return i;
	function i(t) {
		return Mp.call(r, e, a, o, "reference", "referenceMarker", "referenceString")(t);
	}
	function a(e) {
		return r.parser.defined.includes(Zl(r.sliceSerialize(r.events[r.events.length - 1][1]).slice(1, -1))) ? t(e) : n(e);
	}
	function o(e) {
		return n(e);
	}
}
function om(e, t, n) {
	return r;
	function r(t) {
		return e.enter("reference"), e.enter("referenceMarker"), e.consume(t), e.exit("referenceMarker"), i;
	}
	function i(r) {
		return r === 93 ? (e.enter("referenceMarker"), e.consume(r), e.exit("referenceMarker"), e.exit("reference"), t) : n(r);
	}
}
// node_modules/.pnpm/micromark-core-commonmark@2.0.4/node_modules/micromark-core-commonmark/lib/label-start-image.js
var sm = {
	name: "labelStartImage",
	resolveAll: Zp.resolveAll,
	tokenize: cm
};
function cm(e, t, n) {
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
// node_modules/.pnpm/micromark-core-commonmark@2.0.4/node_modules/micromark-core-commonmark/lib/label-start-link.js
var lm = {
	name: "labelStartLink",
	resolveAll: Zp.resolveAll,
	tokenize: um
};
function um(e, t, n) {
	let r = this, i;
	return a;
	function a(t) {
		return e.enter("labelLink"), e.enter("labelMarker"), e.consume(t), e.exit("labelMarker"), i = e.exit("labelLink"), o;
	}
	function o(e) {
		return e === 94 && "_hiddenFootnoteSupport" in r.parser.constructs ? n(e) : (r._labelStarts = r._labelStarts || [], r._labelStarts.push(i), t(e));
	}
}
// node_modules/.pnpm/micromark-core-commonmark@2.0.4/node_modules/micromark-core-commonmark/lib/line-ending.js
var dm = {
	name: "lineEnding",
	tokenize: fm
};
function fm(e, t) {
	return n;
	function n(n) {
		return e.enter("lineEnding"), e.consume(n), e.exit("lineEnding"), J(e, t, "linePrefix");
	}
}
// node_modules/.pnpm/micromark-core-commonmark@2.0.4/node_modules/micromark-core-commonmark/lib/thematic-break.js
var pm = {
	name: "thematicBreak",
	tokenize: mm
};
function mm(e, t, n) {
	let r = 0, i;
	return a;
	function a(t) {
		return e.enter("thematicBreak"), o(t);
	}
	function o(e) {
		return i = e, s(e);
	}
	function s(a) {
		return a === i ? (e.enter("thematicBreakSequence"), c(a)) : r >= 3 && (a === null || G(a)) ? (e.exit("thematicBreak"), t(a)) : n(a);
	}
	function c(t) {
		return t === i ? (e.consume(t), r++, c) : (e.exit("thematicBreakSequence"), q(t) ? J(e, s, "whitespace")(t) : s(t));
	}
}
// node_modules/.pnpm/micromark-core-commonmark@2.0.4/node_modules/micromark-core-commonmark/lib/list.js
var hm = {
	continuation: { tokenize: ym },
	exit: xm,
	name: "list",
	tokenize: vm
}, gm = {
	partial: !0,
	tokenize: Sm
}, _m = {
	partial: !0,
	tokenize: bm
};
function vm(e, t, n) {
	let r = this, i = r.events[r.events.length - 1], a = i && i[1].type === "linePrefix" ? i[2].sliceSerialize(i[1], !0).length : 0, o = 0;
	return s;
	function s(t) {
		let i = r.containerState.type || (t === 42 || t === 43 || t === 45 ? "listUnordered" : "listOrdered");
		if (i === "listUnordered" ? !r.containerState.marker || t === r.containerState.marker : yc(t)) {
			if (r.containerState.type || (r.containerState.type = i, e.enter(i, { _container: !0 })), i === "listUnordered") return e.enter("listItemPrefix"), t === 42 || t === 45 ? e.check(pm, n, l)(t) : l(t);
			if (!r.interrupt || t === 49) return e.enter("listItemPrefix"), e.enter("listItemValue"), c(t);
		}
		return n(t);
	}
	function c(t) {
		return yc(t) && ++o < 10 ? (e.consume(t), c) : (!r.interrupt || o < 2) && (r.containerState.marker ? t === r.containerState.marker : t === 41 || t === 46) ? (e.exit("listItemValue"), l(t)) : n(t);
	}
	function l(t) {
		return e.enter("listItemMarker"), e.consume(t), e.exit("listItemMarker"), r.containerState.marker = r.containerState.marker || t, e.check(ep, r.interrupt ? n : u, e.attempt(gm, f, d));
	}
	function u(e) {
		return r.containerState.initialBlankLine = !0, a++, f(e);
	}
	function d(t) {
		return q(t) ? (e.enter("listItemPrefixWhitespace"), e.consume(t), e.exit("listItemPrefixWhitespace"), f) : n(t);
	}
	function f(n) {
		return r.containerState.size = a + r.sliceSerialize(e.exit("listItemPrefix"), !0).length, t(n);
	}
}
function ym(e, t, n) {
	let r = this;
	return r.containerState._closeFlow = void 0, e.check(ep, i, a);
	function i(n) {
		return r.containerState.furtherBlankLines = r.containerState.furtherBlankLines || r.containerState.initialBlankLine, J(e, t, "listItemIndent", r.containerState.size + 1)(n);
	}
	function a(n) {
		return r.containerState.furtherBlankLines || !q(n) ? (r.containerState.furtherBlankLines = void 0, r.containerState.initialBlankLine = void 0, o(n)) : (r.containerState.furtherBlankLines = void 0, r.containerState.initialBlankLine = void 0, e.attempt(_m, t, o)(n));
	}
	function o(i) {
		return r.containerState._closeFlow = !0, r.interrupt = void 0, J(e, e.attempt(hm, t, n), "linePrefix", r.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(i);
	}
}
function bm(e, t, n) {
	let r = this;
	return J(e, i, "listItemIndent", r.containerState.size + 1);
	function i(e) {
		let i = r.events[r.events.length - 1];
		return i && i[1].type === "listItemIndent" && i[2].sliceSerialize(i[1], !0).length === r.containerState.size ? t(e) : n(e);
	}
}
function xm(e) {
	e.exit(this.containerState.type);
}
function Sm(e, t, n) {
	let r = this;
	return J(e, i, "listItemPrefixWhitespace", r.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 5);
	function i(e) {
		let i = r.events[r.events.length - 1];
		return !q(e) && i && i[1].type === "listItemPrefixWhitespace" ? t(e) : n(e);
	}
}
// node_modules/.pnpm/micromark-util-edit-map@1.0.0/node_modules/micromark-util-edit-map/index.js
var Cm = class {
	constructor() {
		this.index = /* @__PURE__ */ new Map(), this.map = [];
	}
	add(e, t, n) {
		wm(this, e, t, n, !1);
	}
	addBefore(e, t, n) {
		wm(this, e, t, n, !0);
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
function wm(e, t, n, r, i) {
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
// node_modules/.pnpm/micromark-core-commonmark@2.0.4/node_modules/micromark-core-commonmark/lib/setext-underline.js
var Tm = {
	name: "setextUnderline",
	resolveTo: Em,
	tokenize: Dm
};
function Em(e, t) {
	let n = new Cm(), r = e.length, i, a, o;
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
function Dm(e, t, n) {
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
		return t === i ? (e.consume(t), s) : (e.exit("setextHeadingLineSequence"), q(t) ? J(e, c, "lineSuffix")(t) : c(t));
	}
	function c(r) {
		return r === null || G(r) ? (e.exit("setextHeadingLine"), t(r)) : n(r);
	}
}
// node_modules/.pnpm/micromark-extension-gfm-footnote@2.1.0/node_modules/micromark-extension-gfm-footnote/lib/syntax.js
var Om = {
	tokenize: Im,
	partial: !0
};
function km() {
	return {
		document: { 91: {
			name: "gfmFootnoteDefinition",
			tokenize: Nm,
			continuation: { tokenize: Pm },
			exit: Fm
		} },
		text: {
			91: {
				name: "gfmFootnoteCall",
				tokenize: Mm
			},
			93: {
				name: "gfmPotentialFootnoteCall",
				add: "after",
				tokenize: Am,
				resolveTo: jm
			}
		}
	};
}
function Am(e, t, n) {
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
		let s = Zl(r.sliceSerialize({
			start: o.end,
			end: r.now()
		}));
		return s.codePointAt(0) !== 94 || !a.includes(s.slice(1)) ? n(i) : (e.enter("gfmFootnoteCallLabelMarker"), e.consume(i), e.exit("gfmFootnoteCallLabelMarker"), t(i));
	}
}
function jm(e, t) {
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
function Mm(e, t, n) {
	let r = this, i = r.parser.gfmFootnotes || (r.parser.gfmFootnotes = []), a = 0, o;
	return s;
	function s(t) {
		return e.enter("gfmFootnoteCall"), e.enter("gfmFootnoteCallLabelMarker"), e.consume(t), e.exit("gfmFootnoteCallLabelMarker"), c;
	}
	function c(t) {
		return t === 94 ? (e.enter("gfmFootnoteCallMarker"), e.consume(t), e.exit("gfmFootnoteCallMarker"), e.enter("gfmFootnoteCallString"), e.enter("chunkString").contentType = "string", l) : n(t);
	}
	function l(s) {
		if (a > 999 || s === 93 && !o || s === null || s === 91 || K(s)) return n(s);
		if (s === 93) {
			e.exit("chunkString");
			let a = e.exit("gfmFootnoteCallString");
			return i.includes(Zl(r.sliceSerialize(a))) ? (e.enter("gfmFootnoteCallLabelMarker"), e.consume(s), e.exit("gfmFootnoteCallLabelMarker"), e.exit("gfmFootnoteCall"), t) : n(s);
		}
		return K(s) || (o = !0), a++, e.consume(s), s === 92 ? u : l;
	}
	function u(t) {
		return t === 91 || t === 92 || t === 93 ? (e.consume(t), a++, l) : l(t);
	}
}
function Nm(e, t, n) {
	let r = this, i = r.parser.gfmFootnotes || (r.parser.gfmFootnotes = []), a, o = 0, s;
	return c;
	function c(t) {
		return e.enter("gfmFootnoteDefinition")._container = !0, e.enter("gfmFootnoteDefinitionLabel"), e.enter("gfmFootnoteDefinitionLabelMarker"), e.consume(t), e.exit("gfmFootnoteDefinitionLabelMarker"), l;
	}
	function l(t) {
		return t === 94 ? (e.enter("gfmFootnoteDefinitionMarker"), e.consume(t), e.exit("gfmFootnoteDefinitionMarker"), e.enter("gfmFootnoteDefinitionLabelString"), e.enter("chunkString").contentType = "string", u) : n(t);
	}
	function u(t) {
		if (o > 999 || t === 93 && !s || t === null || t === 91 || K(t)) return n(t);
		if (t === 93) {
			e.exit("chunkString");
			let n = e.exit("gfmFootnoteDefinitionLabelString");
			return a = Zl(r.sliceSerialize(n)), e.enter("gfmFootnoteDefinitionLabelMarker"), e.consume(t), e.exit("gfmFootnoteDefinitionLabelMarker"), e.exit("gfmFootnoteDefinitionLabel"), f;
		}
		return K(t) || (s = !0), o++, e.consume(t), t === 92 ? d : u;
	}
	function d(t) {
		return t === 91 || t === 92 || t === 93 ? (e.consume(t), o++, u) : u(t);
	}
	function f(t) {
		return t === 58 ? (e.enter("definitionMarker"), e.consume(t), e.exit("definitionMarker"), i.includes(a) || i.push(a), J(e, p, "gfmFootnoteDefinitionWhitespace")) : n(t);
	}
	function p(e) {
		return t(e);
	}
}
function Pm(e, t, n) {
	return e.check(ep, t, e.attempt(Om, t, n));
}
function Fm(e) {
	e.exit("gfmFootnoteDefinition");
}
function Im(e, t, n) {
	let r = this;
	return J(e, i, "gfmFootnoteDefinitionIndent", 5);
	function i(e) {
		let i = r.events[r.events.length - 1];
		return i && i[1].type === "gfmFootnoteDefinitionIndent" && i[2].sliceSerialize(i[1], !0).length === 4 ? t(e) : n(e);
	}
}
// node_modules/.pnpm/micromark-extension-gfm-strikethrough@2.1.0/node_modules/micromark-extension-gfm-strikethrough/lib/syntax.js
function Lm(e) {
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
				s && gl(o, o.length, 0, vl(s, e.slice(r + 1, n), t)), gl(o, o.length, 0, [
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
				]), gl(e, r - 1, n - r + 3, o), n = r + o.length - 2;
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
			let s = Ru(i);
			if (a === 126) return o > 1 ? r(a) : (e.consume(a), o++, c);
			if (o < 2 && !t) return r(a);
			let l = e.exit("strikethroughSequenceTemporary"), u = Ru(a);
			return l._open = !u || u === 2 && !!s, l._close = !s || s === 2 && !!u, n(a);
		}
	}
}
// node_modules/.pnpm/micromark-extension-gfm-table@2.1.2/node_modules/micromark-extension-gfm-table/lib/edit-map.js
var Rm = class {
	constructor() {
		this.map = [], this.index = /* @__PURE__ */ new Map();
	}
	add(e, t, n) {
		zm(this, e, t, n);
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
function zm(e, t, n, r) {
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
// node_modules/.pnpm/micromark-extension-gfm-table@2.1.2/node_modules/micromark-extension-gfm-table/lib/infer.js
function Bm(e, t) {
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
// node_modules/.pnpm/micromark-extension-gfm-table@2.1.2/node_modules/micromark-extension-gfm-table/lib/syntax.js
function Vm() {
	return { flow: { null: {
		name: "table",
		tokenize: Hm,
		resolveAll: Um
	} } };
}
function Hm(e, t, n) {
	let r = this, i = 0, a = 0, o;
	return s;
	function s(e) {
		let t = r.events.length - 1;
		for (; t > -1;) {
			let { type: e } = r.events[t][1];
			if (e === "lineEnding" || e === "linePrefix") t--;
			else break;
		}
		let i = t > -1 ? r.events[t][1].type : null, a = i === "tableHead" || i === "tableRow" ? ee : c;
		return a === ee && r.parser.lazy[r.now().line] ? n(e) : a(e);
	}
	function c(t) {
		return e.enter("tableHead"), e.enter("tableRow"), l(t);
	}
	function l(e) {
		return e === 124 || (o = !0, a += 1), u(e);
	}
	function u(t) {
		return t === null ? n(t) : G(t) ? a > 1 ? (a = 0, r.interrupt = !0, e.exit("tableRow"), e.enter("lineEnding"), e.consume(t), e.exit("lineEnding"), p) : n(t) : q(t) ? J(e, u, "whitespace")(t) : (a += 1, o && (o = !1, i += 1), t === 124 ? (e.enter("tableCellDivider"), e.consume(t), e.exit("tableCellDivider"), o = !0, u) : (e.enter("data"), d(t)));
	}
	function d(t) {
		return t === null || t === 124 || K(t) ? (e.exit("data"), u(t)) : (e.consume(t), t === 92 ? f : d);
	}
	function f(t) {
		return t === 92 || t === 124 ? (e.consume(t), d) : d(t);
	}
	function p(t) {
		return r.interrupt = !1, r.parser.lazy[r.now().line] ? n(t) : (e.enter("tableDelimiterRow"), o = !1, q(t) ? J(e, m, "linePrefix", r.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(t) : m(t));
	}
	function m(t) {
		return t === 45 || t === 58 ? g(t) : t === 124 ? (o = !0, e.enter("tableCellDivider"), e.consume(t), e.exit("tableCellDivider"), h) : x(t);
	}
	function h(t) {
		return q(t) ? J(e, g, "whitespace")(t) : g(t);
	}
	function g(t) {
		return t === 58 ? (a += 1, o = !0, e.enter("tableDelimiterMarker"), e.consume(t), e.exit("tableDelimiterMarker"), _) : t === 45 ? (a += 1, _(t)) : t === null || G(t) ? b(t) : x(t);
	}
	function _(t) {
		return t === 45 ? (e.enter("tableDelimiterFiller"), v(t)) : x(t);
	}
	function v(t) {
		return t === 45 ? (e.consume(t), v) : t === 58 ? (o = !0, e.exit("tableDelimiterFiller"), e.enter("tableDelimiterMarker"), e.consume(t), e.exit("tableDelimiterMarker"), y) : (e.exit("tableDelimiterFiller"), y(t));
	}
	function y(t) {
		return q(t) ? J(e, b, "whitespace")(t) : b(t);
	}
	function b(n) {
		return n === 124 ? m(n) : n === null || G(n) ? !o || i !== a ? x(n) : (e.exit("tableDelimiterRow"), e.exit("tableHead"), t(n)) : x(n);
	}
	function x(e) {
		return n(e);
	}
	function ee(t) {
		return e.enter("tableRow"), S(t);
	}
	function S(n) {
		return n === 124 ? (e.enter("tableCellDivider"), e.consume(n), e.exit("tableCellDivider"), S) : n === null || G(n) ? (e.exit("tableRow"), t(n)) : q(n) ? J(e, S, "whitespace")(n) : (e.enter("data"), C(n));
	}
	function C(t) {
		return t === null || t === 124 || K(t) ? (e.exit("data"), S(t)) : (e.consume(t), t === 92 ? w : C);
	}
	function w(t) {
		return t === 92 || t === 124 ? (e.consume(t), C) : C(t);
	}
}
function Um(e, t) {
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
	], s = !1, c = 0, l, u, d, f = new Rm();
	for (; ++n < e.length;) {
		let p = e[n], m = p[1];
		p[0] === "enter" ? m.type === "tableHead" ? (s = !1, c !== 0 && (Gm(f, t, c, l, u), u = void 0, c = 0), l = {
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
		]])), i = m.type === "tableDelimiterRow" ? 2 : u ? 3 : 1) : i && (m.type === "data" || m.type === "tableDelimiterMarker" || m.type === "tableDelimiterFiller") ? (r = !1, o[2] === 0 && (a[1] !== 0 && (o[0] = o[1], d = Wm(f, t, a, i, void 0, d), a = [
			0,
			0,
			0,
			0
		]), o[2] = n)) : m.type === "tableCellDivider" && (r ? r = !1 : (a[1] !== 0 && (o[0] = o[1], d = Wm(f, t, a, i, void 0, d)), a = o, o = [
			a[1],
			n,
			0,
			0
		])) : m.type === "tableHead" ? (s = !0, c = n) : m.type === "tableRow" || m.type === "tableDelimiterRow" ? (c = n, a[1] === 0 ? o[1] !== 0 && (d = Wm(f, t, o, i, n, d)) : (o[0] = o[1], d = Wm(f, t, a, i, n, d)), i = 0) : i && (m.type === "data" || m.type === "tableDelimiterMarker" || m.type === "tableDelimiterFiller") && (o[3] = n);
	}
	for (c !== 0 && Gm(f, t, c, l, u), f.consume(t.events), n = -1; ++n < t.events.length;) {
		let e = t.events[n];
		e[0] === "enter" && e[1].type === "table" && (e[1]._align = Bm(t.events, n));
	}
	return e;
}
function Wm(e, t, n, r, i, a) {
	let o = r === 1 ? "tableHeader" : r === 2 ? "tableDelimiter" : "tableData";
	n[0] !== 0 && (a.end = Object.assign({}, Km(t.events, n[0])), e.add(n[0], 0, [[
		"exit",
		a,
		t
	]]));
	let s = Km(t.events, n[1]);
	if (a = {
		type: o,
		start: Object.assign({}, s),
		end: Object.assign({}, s)
	}, e.add(n[1], 0, [[
		"enter",
		a,
		t
	]]), n[2] !== 0) {
		let i = Km(t.events, n[2]), a = Km(t.events, n[3]), o = {
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
	return i !== void 0 && (a.end = Object.assign({}, Km(t.events, i)), e.add(i, 0, [[
		"exit",
		a,
		t
	]]), a = void 0), a;
}
function Gm(e, t, n, r, i) {
	let a = [], o = Km(t.events, n);
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
function Km(e, t) {
	let n = e[t], r = n[0] === "enter" ? "start" : "end";
	return n[1][r];
}
// node_modules/.pnpm/micromark-extension-gfm-task-list-item@2.1.0/node_modules/micromark-extension-gfm-task-list-item/lib/syntax.js
var qm = {
	name: "tasklistCheck",
	tokenize: Ym
};
function Jm() {
	return { text: { 91: qm } };
}
function Ym(e, t, n) {
	let r = this;
	return i;
	function i(t) {
		return r.previous !== null || !r._gfmTasklistFirstContentOfListItem ? n(t) : (e.enter("taskListCheck"), e.enter("taskListCheckMarker"), e.consume(t), e.exit("taskListCheckMarker"), a);
	}
	function a(t) {
		return K(t) ? (e.enter("taskListCheckValueUnchecked"), e.consume(t), e.exit("taskListCheckValueUnchecked"), o) : t === 88 || t === 120 ? (e.enter("taskListCheckValueChecked"), e.consume(t), e.exit("taskListCheckValueChecked"), o) : n(t);
	}
	function o(t) {
		return t === 93 ? (e.enter("taskListCheckMarker"), e.consume(t), e.exit("taskListCheckMarker"), e.exit("taskListCheck"), s) : n(t);
	}
	function s(r) {
		return G(r) ? t(r) : q(r) ? e.check({ tokenize: Xm }, t, n)(r) : n(r);
	}
}
function Xm(e, t, n) {
	return J(e, r, "whitespace");
	function r(e) {
		return e === null ? n(e) : t(e);
	}
}
// node_modules/.pnpm/micromark-extension-gfm@3.0.0/node_modules/micromark-extension-gfm/index.js
function Zm(e) {
	return yf([
		jf(),
		km(),
		Lm(e),
		Vm(),
		Jm()
	]);
}
// node_modules/.pnpm/remark-gfm@4.0.1/node_modules/remark-gfm/lib/index.js
var Qm = {};
function $m(e) {
	let t = this, n = e || Qm, r = t.data(), i = r.micromarkExtensions ||= [], a = r.fromMarkdownExtensions ||= [], o = r.toMarkdownExtensions ||= [];
	i.push(Zm(n)), a.push(gf()), o.push(_f(n));
}
// node_modules/.pnpm/mdast-util-math@3.0.0/node_modules/mdast-util-math/lib/index.js
function eh() {
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
function th(e) {
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
		let i = e.value || "", a = n.createTracker(r), o = "$".repeat(Math.max(Au(i, "$") + 1, 2)), s = n.enter("mathFlow"), c = a.move(o);
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
// node_modules/.pnpm/micromark-extension-math@3.1.0/node_modules/micromark-extension-math/lib/math-flow.js
var nh = {
	tokenize: ih,
	concrete: !0,
	name: "mathFlow"
}, rh = {
	tokenize: ah,
	partial: !0
};
function ih(e, t, n) {
	let r = this, i = r.events[r.events.length - 1], a = i && i[1].type === "linePrefix" ? i[2].sliceSerialize(i[1], !0).length : 0, o = 0;
	return s;
	function s(t) {
		return e.enter("mathFlow"), e.enter("mathFlowFence"), e.enter("mathFlowFenceSequence"), c(t);
	}
	function c(t) {
		return t === 36 ? (e.consume(t), o++, c) : o < 2 ? n(t) : (e.exit("mathFlowFenceSequence"), J(e, l, "whitespace")(t));
	}
	function l(t) {
		return t === null || G(t) ? d(t) : (e.enter("mathFlowFenceMeta"), e.enter("chunkString", { contentType: "string" }), u(t));
	}
	function u(t) {
		return t === null || G(t) ? (e.exit("chunkString"), e.exit("mathFlowFenceMeta"), d(t)) : t === 36 ? n(t) : (e.consume(t), u);
	}
	function d(n) {
		return e.exit("mathFlowFence"), r.interrupt ? t(n) : e.attempt(rh, f, g)(n);
	}
	function f(t) {
		return e.attempt({
			tokenize: _,
			partial: !0
		}, g, p)(t);
	}
	function p(t) {
		return (a ? J(e, m, "linePrefix", a + 1) : m)(t);
	}
	function m(t) {
		return t === null ? g(t) : G(t) ? e.attempt(rh, f, g)(t) : (e.enter("mathFlowValue"), h(t));
	}
	function h(t) {
		return t === null || G(t) ? (e.exit("mathFlowValue"), m(t)) : (e.consume(t), h);
	}
	function g(n) {
		return e.exit("mathFlow"), t(n);
	}
	function _(e, t, n) {
		let i = 0;
		return J(e, a, "linePrefix", r.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4);
		function a(t) {
			return e.enter("mathFlowFence"), e.enter("mathFlowFenceSequence"), s(t);
		}
		function s(t) {
			return t === 36 ? (i++, e.consume(t), s) : i < o ? n(t) : (e.exit("mathFlowFenceSequence"), J(e, c, "whitespace")(t));
		}
		function c(r) {
			return r === null || G(r) ? (e.exit("mathFlowFence"), t(r)) : n(r);
		}
	}
}
function ah(e, t, n) {
	let r = this;
	return i;
	function i(n) {
		return n === null ? t(n) : (e.enter("lineEnding"), e.consume(n), e.exit("lineEnding"), a);
	}
	function a(e) {
		return r.parser.lazy[r.now().line] ? n(e) : t(e);
	}
}
// node_modules/.pnpm/micromark-extension-math@3.1.0/node_modules/micromark-extension-math/lib/math-text.js
function oh(e) {
	let t = (e || {}).singleDollarTextMath;
	return t ??= !0, {
		tokenize: n,
		resolve: sh,
		previous: ch,
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
			return t === null ? r(t) : t === 36 ? (o = e.enter("mathTextSequence"), a = 0, d(t)) : t === 32 ? (e.enter("space"), e.consume(t), e.exit("space"), l) : G(t) ? (e.enter("lineEnding"), e.consume(t), e.exit("lineEnding"), l) : (e.enter("mathTextData"), u(t));
		}
		function u(t) {
			return t === null || t === 32 || t === 36 || G(t) ? (e.exit("mathTextData"), l(t)) : (e.consume(t), u);
		}
		function d(t) {
			return t === 36 ? (e.consume(t), a++, d) : a === i ? (e.exit("mathTextSequence"), e.exit("mathText"), n(t)) : (o.type = "mathTextData", u(t));
		}
	}
}
function sh(e) {
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
function ch(e) {
	return e !== 36 || this.events[this.events.length - 1][1].type === "characterEscape";
}
// node_modules/.pnpm/micromark-extension-math@3.1.0/node_modules/micromark-extension-math/lib/syntax.js
function lh(e) {
	return {
		flow: { 36: nh },
		text: { 36: oh(e) }
	};
}
// node_modules/.pnpm/remark-math@6.0.0/node_modules/remark-math/lib/index.js
var uh = {};
function dh(e) {
	let t = this, n = e || uh, r = t.data(), i = r.micromarkExtensions ||= [], a = r.fromMarkdownExtensions ||= [], o = r.toMarkdownExtensions ||= [];
	i.push(lh(n)), a.push(eh()), o.push(th(n));
}
// node_modules/.pnpm/remend@1.0.1/node_modules/remend/dist/index.js
var fh = /(\*\*)([^*]*?)$/, ph = /(__)([^_]*?)$/, mh = /(\*\*\*)([^*]*?)$/, hh = /(\*)([^*]*?)$/, gh = /(_)([^_]*?)$/, _h = /(`)([^`]*?)$/, vh = /(~~)([^~]*?)$/, yh = /^[\s_~*`]*$/, bh = /^[\s]*[-*+][\s]+$/, xh = /[\p{L}\p{N}_]/u, Sh = /^```[^`\n]*```?$/, Ch = /^\*{4,}$/, wh = (e) => {
	if (!e) return !1;
	let t = e.charCodeAt(0);
	return t >= 48 && t <= 57 || t >= 65 && t <= 90 || t >= 97 && t <= 122 || t === 95 || xh.test(e);
}, Th = (e) => {
	let t = (e.match(/```/g) || []).length;
	return t > 0 && t % 2 == 0 && e.includes("\n");
}, Eh = (e, t) => {
	let n = 1;
	for (let r = t - 1; r >= 0; --r) if (e[r] === "]") n += 1;
	else if (e[r] === "[" && (--n, n === 0)) return r;
	return -1;
}, Dh = (e, t) => {
	let n = 1;
	for (let r = t + 1; r < e.length; r += 1) if (e[r] === "[") n += 1;
	else if (e[r] === "]" && (--n, n === 0)) return r;
	return -1;
}, Oh = (e, t) => {
	let n = !1, r = !1;
	for (let i = 0; i < e.length && i < t; i += 1) e[i] === "\\" && e[i + 1] === "$" ? i += 1 : e[i] === "$" && (e[i + 1] === "$" ? (r = !r, i += 1, n = !1) : r || (n = !n));
	return n || r;
}, kh = (e, t, n) => {
	if (n !== " " && n !== "	") return !1;
	let r = 0;
	for (let n = t - 1; n >= 0; --n) if (e[n] === "\n") {
		r = n + 1;
		break;
	}
	for (let n = r; n < t; n += 1) if (e[n] !== " " && e[n] !== "	") return !1;
	return !0;
}, Ah = (e, t, n, r) => !!(n === "\\" || n === "*" || r === "*" || n && r && wh(n) && wh(r) || kh(e, t, r)), jh = (e) => {
	let t = 0, n = e.length;
	for (let r = 0; r < n; r += 1) {
		if (e[r] !== "*") continue;
		let i = r > 0 ? e[r - 1] : "", a = r < n - 1 ? e[r + 1] : "";
		Ah(e, r, i, a) || (t += 1);
	}
	return t;
}, Mh = (e, t, n, r) => !!(n === "\\" || e.includes("$") && Oh(e, t) || n === "_" || r === "_" || n && r && wh(n) && wh(r)), Nh = (e) => {
	let t = 0, n = e.length;
	for (let r = 0; r < n; r += 1) {
		if (e[r] !== "_") continue;
		let i = r > 0 ? e[r - 1] : "", a = r < n - 1 ? e[r + 1] : "";
		Mh(e, r, i, a) || (t += 1);
	}
	return t;
}, Ph = (e) => {
	let t = 0, n = 0;
	for (let r = 0; r < e.length; r += 1) e[r] === "*" ? n += 1 : (n >= 3 && (t += Math.floor(n / 3)), n = 0);
	return n >= 3 && (t += Math.floor(n / 3)), t;
}, Fh = (e) => {
	if (Th(e)) return e;
	let t = e.match(fh);
	if (t) {
		let n = t[2];
		if (!n || yh.test(n)) return e;
		let r = e.lastIndexOf(t[1]), i = e.substring(0, r).lastIndexOf("\n"), a = i === -1 ? 0 : i + 1, o = e.substring(a, r);
		if (bh.test(o) && n.includes("\n")) return e;
		if ((e.match(/\*\*/g) || []).length % 2 == 1) return `${e}**`;
	}
	return e;
}, Ih = (e) => {
	let t = e.match(ph);
	if (t) {
		let n = t[2];
		if (!n || yh.test(n)) return e;
		let r = e.lastIndexOf(t[1]), i = e.substring(0, r).lastIndexOf("\n"), a = i === -1 ? 0 : i + 1, o = e.substring(a, r);
		if (bh.test(o) && n.includes("\n")) return e;
		if ((e.match(/__/g) || []).length % 2 == 1) return `${e}__`;
	}
	return e;
}, Lh = (e) => {
	for (let t = 0; t < e.length; t += 1) if (e[t] === "*" && e[t - 1] !== "*" && e[t + 1] !== "*" && e[t - 1] !== "\\") {
		let n = t > 0 ? e[t - 1] : "", r = t < e.length - 1 ? e[t + 1] : "";
		if (n && r && wh(n) && wh(r)) continue;
		return t;
	}
	return -1;
}, Rh = (e) => {
	if (Th(e) || !e.match(hh)) return e;
	let t = Lh(e);
	if (t === -1) return e;
	let n = e.substring(t + 1);
	return !n || yh.test(n) ? e : jh(e) % 2 == 1 ? `${e}*` : e;
}, zh = (e) => {
	for (let t = 0; t < e.length; t += 1) if (e[t] === "_" && e[t - 1] !== "_" && e[t + 1] !== "_" && e[t - 1] !== "\\" && !Oh(e, t)) {
		let n = t > 0 ? e[t - 1] : "", r = t < e.length - 1 ? e[t + 1] : "";
		if (n && r && wh(n) && wh(r)) continue;
		return t;
	}
	return -1;
}, Bh = (e) => {
	let t = e.length;
	for (; t > 0 && e[t - 1] === "\n";) --t;
	return t < e.length ? `${e.slice(0, t)}_${e.slice(t)}` : `${e}_`;
}, Vh = (e) => {
	if (Th(e) || !e.match(gh)) return e;
	let t = zh(e);
	if (t === -1) return e;
	let n = e.substring(t + 1);
	return !n || yh.test(n) ? e : Nh(e) % 2 == 1 ? Bh(e) : e;
}, Hh = (e) => {
	if (Th(e) || Ch.test(e)) return e;
	let t = e.match(mh);
	if (t) {
		let n = t[2];
		if (!n || yh.test(n)) return e;
		if (Ph(e) % 2 == 1) return `${e}***`;
	}
	return e;
}, Uh = (e, t) => {
	let n = !1, r = !1;
	for (let i = 0; i < t; i += 1) e.substring(i, i + 3) === "```" ? (r = !r, i += 2) : !r && e[i] === "`" && (n = !n);
	return n || r;
}, Wh = (e, t) => {
	let n = e.substring(t, t + 3) === "```", r = t > 0 && e.substring(t - 1, t + 2) === "```", i = t > 1 && e.substring(t - 2, t + 1) === "```";
	return n || r || i;
}, Gh = (e) => {
	let t = 0;
	for (let n = 0; n < e.length; n += 1) e[n] === "`" && !Wh(e, n) && (t += 1);
	return t;
}, Kh = (e) => !e.match(Sh) || e.includes("\n") ? null : e.endsWith("``") && !e.endsWith("```") ? `${e}\`` : e, qh = (e) => {
	let t = (e.match(/```/g) || []).length;
	return !!(t > 0 && t % 2 == 0 && e.includes("\n") || (e.endsWith("```\n") || e.endsWith("```")) && t % 2 == 0);
}, Jh = (e) => (e.match(/```/g) || []).length % 2 == 1, Yh = (e) => {
	let t = Kh(e);
	if (t !== null) return t;
	if (qh(e)) return e;
	let n = e.match(_h);
	if (n && !Jh(e)) {
		let t = n[2];
		if (!t || yh.test(t)) return e;
		if (Gh(e) % 2 == 1) return `${e}\``;
	}
	return e;
}, Xh = (e) => {
	if ((e.match(/\$\$/g) || []).length % 2 == 0) return e;
	let t = e.indexOf("$$");
	return t !== -1 && e.indexOf("\n", t) !== -1 && !e.endsWith("\n") ? `${e}
$$` : `${e}$$`;
}, Zh = (e, t) => {
	if (e.substring(t + 2).includes(")")) return null;
	let n = Eh(e, t);
	if (n === -1 || Uh(e, n)) return null;
	let r = n > 0 && e[n - 1] === "!", i = r ? n - 1 : n, a = e.substring(0, i);
	return r ? a : `${a}[${e.substring(n + 1, t)}](streamdown:incomplete-link)`;
}, Qh = (e, t) => {
	let n = t > 0 && e[t - 1] === "!", r = n ? t - 1 : t;
	if (!e.substring(t + 1).includes("]") || Dh(e, t) === -1) {
		let t = e.substring(0, r);
		return n ? t : `${e}](streamdown:incomplete-link)`;
	}
	return null;
}, $h = (e) => {
	let t = e.lastIndexOf("](");
	if (t !== -1 && !Uh(e, t)) {
		let n = Zh(e, t);
		if (n !== null) return n;
	}
	for (let t = e.length - 1; t >= 0; --t) if (e[t] === "[" && !Uh(e, t)) {
		let n = Qh(e, t);
		if (n !== null) return n;
	}
	return e;
}, eg = (e) => {
	let t = e.match(vh);
	if (t) {
		let n = t[2];
		if (!n || yh.test(n)) return e;
		if ((e.match(/~~/g) || []).length % 2 == 1) return `${e}~~`;
	}
	return e;
}, tg = (e) => {
	if (!e || typeof e != "string") return e;
	let t = e, n = $h(t);
	return n.endsWith("](streamdown:incomplete-link)") ? n : (t = n, t = Hh(t), t = Fh(t), t = Ih(t), t = Rh(t), t = Vh(t), t = Yh(t), t = eg(t), t = Xh(t), t);
}, ng = (e) => e.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(), rg = (e) => e.replace(/^([A-Z])|[\s-_]+(\w)/g, (e, t, n) => n ? n.toUpperCase() : t.toLowerCase()), ig = (e) => {
	let t = rg(e);
	return t.charAt(0).toUpperCase() + t.slice(1);
}, ag = (...e) => e.filter((e, t, n) => !!e && e.trim() !== "" && n.indexOf(e) === t).join(" ").trim(), og = (e) => {
	for (let t in e) if (t.startsWith("aria-") || t === "role" || t === "title") return !0;
}, sg = {
	xmlns: "http://www.w3.org/2000/svg",
	width: 24,
	height: 24,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 2,
	strokeLinecap: "round",
	strokeLinejoin: "round"
}, cg = (0, C.forwardRef)(({ color: e = "currentColor", size: t = 24, strokeWidth: n = 2, absoluteStrokeWidth: r, className: i = "", children: a, iconNode: o, ...s }, c) => (0, C.createElement)("svg", {
	ref: c,
	...sg,
	width: t,
	height: t,
	stroke: e,
	strokeWidth: r ? Number(n) * 24 / Number(t) : n,
	className: ag("lucide", i),
	...!a && !og(s) && { "aria-hidden": "true" },
	...s
}, [...o.map(([e, t]) => (0, C.createElement)(e, t)), ...Array.isArray(a) ? a : [a]])), lg = (e, t) => {
	let n = (0, C.forwardRef)(({ className: n, ...r }, i) => (0, C.createElement)(cg, {
		ref: i,
		iconNode: t,
		className: ag(`lucide-${ng(ig(e))}`, `lucide-${e}`, n),
		...r
	}));
	return n.displayName = ig(e), n;
}, ug = lg("check", [["path", {
	d: "M20 6 9 17l-5-5",
	key: "1gmf2c"
}]]), dg = lg("copy", [["rect", {
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
}]]), fg = lg("download", [
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
]), pg = lg("loader-circle", [["path", {
	d: "M21 12a9 9 0 1 1-6.219-8.56",
	key: "13zald"
}]]), mg = lg("maximize-2", [
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
]), hg = lg("rotate-ccw", [["path", {
	d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",
	key: "1357e3"
}], ["path", {
	d: "M3 3v5h5",
	key: "1xhq8a"
}]]), gg = lg("x", [["path", {
	d: "M18 6 6 18",
	key: "1bl5f8"
}], ["path", {
	d: "m6 6 12 12",
	key: "d8bk6v"
}]]), _g = lg("zoom-in", [
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
]), vg = lg("zoom-out", [
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
// node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs
function yg(e) {
	var t, n, r = "";
	if (typeof e == "string" || typeof e == "number") r += e;
	else if (typeof e == "object") {
		if (Array.isArray(e)) {
			var i = e.length;
			for (t = 0; t < i; t++) e[t] && (n = yg(e[t])) && (r && (r += " "), r += n);
		} else for (n in e) e[n] && (r && (r += " "), r += n);
	}
	return r;
}
function bg() {
	for (var e, t, n = 0, r = "", i = arguments.length; n < i; n++) (e = arguments[n]) && (t = yg(e)) && (r && (r += " "), r += t);
	return r;
}
// node_modules/.pnpm/tailwind-merge@3.7.0/node_modules/tailwind-merge/dist/bundle-mjs.mjs
var xg = (e, t) => {
	let n = Array(e.length + t.length);
	for (let t = 0; t < e.length; t++) n[t] = e[t];
	for (let r = 0; r < t.length; r++) n[e.length + r] = t[r];
	return n;
}, Sg = (e, t) => ({
	classGroupId: e,
	validator: t
}), Cg = (e = /* @__PURE__ */ new Map(), t = null, n) => ({
	nextPart: e,
	validators: t,
	classGroupId: n
}), wg = "-", Tg = [], Eg = "arbitrary..", Dg = (e) => {
	let t = Ag(e), { conflictingClassGroups: n, conflictingClassGroupModifiers: r } = e;
	return {
		getClassGroupId: (e) => {
			if (e.startsWith("[") && e.endsWith("]")) return kg(e);
			let n = e.split(wg);
			return Og(n, +(n[0] === "" && n.length > 1), t);
		},
		getConflictingClassGroupIds: (e, t) => {
			if (t) {
				let t = r[e], i = n[e];
				return t ? i ? xg(i, t) : t : i || Tg;
			}
			return n[e] || Tg;
		}
	};
}, Og = (e, t, n) => {
	if (e.length - t === 0) return n.classGroupId;
	let r = e[t], i = n.nextPart.get(r);
	if (i) {
		let n = Og(e, t + 1, i);
		if (n) return n;
	}
	let a = n.validators;
	if (a === null) return;
	let o = t === 0 ? e.join(wg) : e.slice(t).join(wg), s = a.length;
	for (let e = 0; e < s; e++) {
		let t = a[e];
		if (t.validator(o)) return t.classGroupId;
	}
}, kg = (e) => e.slice(1, -1).indexOf(":") === -1 ? void 0 : (() => {
	let t = e.slice(1, -1), n = t.indexOf(":"), r = t.slice(0, n);
	return r ? Eg + r : void 0;
})(), Ag = (e) => {
	let { theme: t, classGroups: n } = e;
	return jg(n, t);
}, jg = (e, t) => {
	let n = Cg();
	for (let r in e) {
		let i = e[r];
		Mg(i, n, r, t);
	}
	return n;
}, Mg = (e, t, n, r) => {
	let i = e.length;
	for (let a = 0; a < i; a++) {
		let i = e[a];
		Ng(i, t, n, r);
	}
}, Ng = (e, t, n, r) => {
	typeof e == "string" ? Pg(e, t, n) : typeof e == "function" ? Fg(e, t, n, r) : Ig(e, t, n, r);
}, Pg = (e, t, n) => {
	let r = e === "" ? t : Lg(t, e);
	r.classGroupId = n;
}, Fg = (e, t, n, r) => {
	Rg(e) ? Mg(e(r), t, n, r) : (t.validators === null && (t.validators = []), t.validators.push(Sg(n, e)));
}, Ig = (e, t, n, r) => {
	let i = Object.entries(e), a = i.length;
	for (let e = 0; e < a; e++) {
		let [a, o] = i[e];
		Mg(o, Lg(t, a), n, r);
	}
}, Lg = (e, t) => {
	let n = e, r = t.split(wg), i = r.length;
	for (let e = 0; e < i; e++) {
		let t = r[e], i = n.nextPart.get(t);
		i || (i = Cg(), n.nextPart.set(t, i)), n = i;
	}
	return n;
}, Rg = (e) => "isThemeGetter" in e && e.isThemeGetter === !0, zg = (e) => {
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
}, Bg = "!", Vg = ":", Hg = [], Ug = (e, t, n, r, i) => ({
	modifiers: e,
	hasImportantModifier: t,
	baseClassName: n,
	maybePostfixModifierPosition: r,
	isExternal: i
}), Wg = (e) => {
	let { prefix: t, experimentalParseClassName: n } = e, r = (e) => {
		let t = [], n = 0, r = 0, i = 0, a, o = e.length;
		for (let s = 0; s < o; s++) {
			let o = e[s];
			if (n === 0 && r === 0) {
				if (o === Vg) {
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
		s.endsWith(Bg) ? (c = s.slice(0, -1), l = !0) : s.startsWith(Bg) && (c = s.slice(1), l = !0);
		let u = a && a > i ? a - i : void 0;
		return Ug(t, l, c, u);
	};
	if (t) {
		let e = t + Vg, n = r;
		r = (t) => t.startsWith(e) ? n(t.slice(e.length)) : Ug(Hg, !1, t, void 0, !0);
	}
	if (n) {
		let e = r;
		r = (t) => n({
			className: t,
			parseClassName: e
		});
	}
	return r;
}, Gg = (e) => {
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
}, Kg = (e) => ({
	cache: zg(e.cacheSize),
	parseClassName: Wg(e),
	sortModifiers: Gg(e),
	postfixLookupClassGroupIds: qg(e),
	...Dg(e)
}), qg = (e) => {
	let t = Object.create(null), n = e.postfixLookupClassGroups;
	if (n) for (let e = 0; e < n.length; e++) t[n[e]] = !0;
	return t;
}, Jg = /\s+/, Yg = (e, t) => {
	let { parseClassName: n, getClassGroupId: r, getConflictingClassGroupIds: i, sortModifiers: a, postfixLookupClassGroupIds: o } = t, s = [], c = e.trim().split(Jg), l = "";
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
		let _ = d.length === 0 ? "" : d.length === 1 ? d[0] : a(d).join(":"), v = f ? _ + Bg : _, y = v + g;
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
}, Xg = (...e) => {
	let t = 0, n, r, i = "";
	for (; t < e.length;) (n = e[t++]) && (r = Zg(n)) && (i && (i += " "), i += r);
	return i;
}, Zg = (e) => {
	if (typeof e == "string") return e;
	let t, n = "";
	for (let r = 0; r < e.length; r++) e[r] && (t = Zg(e[r])) && (n && (n += " "), n += t);
	return n;
}, Qg = (e, ...t) => {
	let n, r, i, a, o = (o) => (n = Kg(t.reduce((e, t) => t(e), e())), r = n.cache.get, i = n.cache.set, a = s, s(o)), s = (e) => {
		let t = r(e);
		if (t) return t;
		let a = Yg(e, n);
		return i(e, a), a;
	};
	return a = o, (...e) => a(Xg(...e));
}, $g = [], e_ = (e) => {
	let t = (t) => t[e] || $g;
	return t.isThemeGetter = !0, t.themeKey = e, t;
}, t_ = /^\[(?:(\w[\w-]*):)?(.+)\]$/i, n_ = /^\((?:(\w[\w-]*):)?(.+)\)$/i, r_ = /^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/, i_ = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, a_ = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, o_ = /^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix|color|light-dark)\(.+\)$/, s_ = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, c_ = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, l_ = (e) => r_.test(e), Y = (e) => !!e && !Number.isNaN(Number(e)), u_ = (e) => !!e && Number.isInteger(Number(e)), d_ = (e) => e.endsWith("%") && Y(e.slice(0, -1)), f_ = (e) => i_.test(e), p_ = () => !0, m_ = (e) => a_.test(e) && !o_.test(e), h_ = () => !1, g_ = (e) => s_.test(e), __ = (e) => c_.test(e), v_ = (e) => !X(e) && !Z(e), y_ = (e) => e.startsWith("@container") && (e[10] === "/" && e[11] !== void 0 || e[11] === "s" && e[16] !== void 0 && e.startsWith("-size/", 10) || e[11] === "n" && e[18] !== void 0 && e.startsWith("-normal/", 10)), b_ = (e) => F_(e, z_, h_), X = (e) => t_.test(e), x_ = (e) => F_(e, B_, m_), S_ = (e) => F_(e, V_, Y), C_ = (e) => F_(e, U_, p_), w_ = (e) => F_(e, H_, h_), T_ = (e) => F_(e, L_, h_), E_ = (e) => F_(e, R_, __), D_ = (e) => F_(e, W_, g_), Z = (e) => n_.test(e), O_ = (e) => I_(e, B_), k_ = (e) => I_(e, H_), A_ = (e) => I_(e, L_), j_ = (e) => I_(e, z_), M_ = (e) => I_(e, R_), N_ = (e) => I_(e, W_, !0), P_ = (e) => I_(e, U_, !0), F_ = (e, t, n) => {
	let r = t_.exec(e);
	return r ? r[1] ? t(r[1]) : n(r[2]) : !1;
}, I_ = (e, t, n = !1) => {
	let r = n_.exec(e);
	return r ? r[1] ? t(r[1]) : n : !1;
}, L_ = (e) => e === "position" || e === "percentage", R_ = (e) => e === "image" || e === "url", z_ = (e) => e === "length" || e === "size" || e === "bg-size", B_ = (e) => e === "length", V_ = (e) => e === "number", H_ = (e) => e === "family-name", U_ = (e) => e === "number" || e === "weight", W_ = (e) => e === "shadow", G_ = () => {
	let e = e_("color"), t = e_("font"), n = e_("text"), r = e_("font-weight"), i = e_("tracking"), a = e_("leading"), o = e_("breakpoint"), s = e_("container"), c = e_("spacing"), l = e_("radius"), u = e_("shadow"), d = e_("inset-shadow"), f = e_("text-shadow"), p = e_("drop-shadow"), m = e_("blur"), h = e_("perspective"), g = e_("aspect"), _ = e_("ease"), v = e_("animate"), y = () => [
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
	], x = () => [
		...b(),
		Z,
		X
	], ee = () => [
		"auto",
		"hidden",
		"clip",
		"visible",
		"scroll"
	], S = () => [
		"auto",
		"contain",
		"none"
	], C = () => [
		Z,
		X,
		c
	], w = () => [
		l_,
		"full",
		"auto",
		...C()
	], T = () => [
		u_,
		"none",
		"subgrid",
		Z,
		X
	], E = () => [
		"auto",
		{ span: [
			"full",
			u_,
			Z,
			X
		] },
		u_,
		Z,
		X
	], D = () => [
		u_,
		"auto",
		Z,
		X
	], te = () => [
		"auto",
		"min",
		"max",
		"fr",
		Z,
		X
	], ne = () => [
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
	], re = () => [
		"start",
		"end",
		"center",
		"stretch",
		"center-safe",
		"end-safe"
	], O = () => ["auto", ...C()], k = () => [
		l_,
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
		...C()
	], ie = () => [
		s,
		l_,
		"screen",
		"full",
		"dvw",
		"lvw",
		"svw",
		"min",
		"max",
		"fit",
		...C()
	], ae = () => [
		l_,
		"screen",
		"full",
		"lh",
		"dvh",
		"lvh",
		"svh",
		"min",
		"max",
		"fit",
		...C()
	], A = () => [
		e,
		Z,
		X
	], oe = () => [
		...b(),
		A_,
		T_,
		{ position: [Z, X] }
	], se = () => ["no-repeat", { repeat: [
		"",
		"x",
		"y",
		"space",
		"round"
	] }], ce = () => [
		"auto",
		"cover",
		"contain",
		j_,
		b_,
		{ size: [Z, X] }
	], le = () => [
		d_,
		O_,
		x_
	], j = () => [
		"",
		"none",
		"full",
		l,
		Z,
		X
	], ue = () => [
		"",
		Y,
		O_,
		x_
	], de = () => [
		"solid",
		"dashed",
		"dotted",
		"double"
	], M = () => [
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
	], N = () => [
		Y,
		d_,
		A_,
		T_
	], fe = () => [
		"",
		"none",
		m,
		Z,
		X
	], P = () => [
		"none",
		Y,
		Z,
		X
	], F = () => [
		"none",
		Y,
		Z,
		X
	], pe = () => [
		Y,
		Z,
		X
	], me = () => [
		l_,
		"full",
		...C()
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
			blur: [f_],
			breakpoint: [f_],
			color: [p_],
			container: [f_],
			"drop-shadow": [f_],
			ease: [
				"in",
				"out",
				"in-out"
			],
			font: [v_],
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
			"inset-shadow": [f_],
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
			radius: [f_],
			shadow: [f_],
			spacing: ["px", Y],
			text: [f_],
			"text-shadow": [f_],
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
				l_,
				X,
				Z,
				g
			] }],
			container: ["container"],
			"container-type": [{ "@container": [
				"",
				"normal",
				"size",
				Z,
				X
			] }],
			"container-named": [y_],
			columns: [{ columns: [
				Y,
				"auto",
				X,
				Z,
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
			"object-position": [{ object: x() }],
			overflow: [{ overflow: ee() }],
			"overflow-x": [{ "overflow-x": ee() }],
			"overflow-y": [{ "overflow-y": ee() }],
			overscroll: [{ overscroll: S() }],
			"overscroll-x": [{ "overscroll-x": S() }],
			"overscroll-y": [{ "overscroll-y": S() }],
			position: [
				"static",
				"fixed",
				"absolute",
				"relative",
				"sticky"
			],
			inset: [{ inset: w() }],
			"inset-x": [{ "inset-x": w() }],
			"inset-y": [{ "inset-y": w() }],
			start: [{
				"inset-s": w(),
				start: w()
			}],
			end: [{
				"inset-e": w(),
				end: w()
			}],
			"inset-bs": [{ "inset-bs": w() }],
			"inset-be": [{ "inset-be": w() }],
			top: [{ top: w() }],
			right: [{ right: w() }],
			bottom: [{ bottom: w() }],
			left: [{ left: w() }],
			visibility: [
				"visible",
				"invisible",
				"collapse"
			],
			z: [{ z: [
				u_,
				"auto",
				Z,
				X
			] }],
			basis: [{ basis: [
				l_,
				"full",
				"auto",
				s,
				...C()
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
				Y,
				l_,
				"auto",
				"initial",
				"none",
				X
			] }],
			grow: [{ grow: [
				"",
				Y,
				Z,
				X
			] }],
			shrink: [{ shrink: [
				"",
				Y,
				Z,
				X
			] }],
			order: [{ order: [
				u_,
				"first",
				"last",
				"none",
				Z,
				X
			] }],
			"grid-cols": [{ "grid-cols": T() }],
			"col-start-end": [{ col: E() }],
			"col-start": [{ "col-start": D() }],
			"col-end": [{ "col-end": D() }],
			"grid-rows": [{ "grid-rows": T() }],
			"row-start-end": [{ row: E() }],
			"row-start": [{ "row-start": D() }],
			"row-end": [{ "row-end": D() }],
			"grid-flow": [{ "grid-flow": [
				"row",
				"col",
				"dense",
				"row-dense",
				"col-dense"
			] }],
			"auto-cols": [{ "auto-cols": te() }],
			"auto-rows": [{ "auto-rows": te() }],
			gap: [{ gap: C() }],
			"gap-x": [{ "gap-x": C() }],
			"gap-y": [{ "gap-y": C() }],
			"justify-content": [{ justify: [...ne(), "normal"] }],
			"justify-items": [{ "justify-items": [...re(), "normal"] }],
			"justify-self": [{ "justify-self": ["auto", ...re()] }],
			"align-content": [{ content: ["normal", ...ne()] }],
			"align-items": [{ items: [...re(), { baseline: ["", "last"] }] }],
			"align-self": [{ self: [
				"auto",
				...re(),
				{ baseline: ["", "last"] }
			] }],
			"place-content": [{ "place-content": ne() }],
			"place-items": [{ "place-items": [...re(), "baseline"] }],
			"place-self": [{ "place-self": ["auto", ...re()] }],
			p: [{ p: C() }],
			px: [{ px: C() }],
			py: [{ py: C() }],
			ps: [{ ps: C() }],
			pe: [{ pe: C() }],
			pbs: [{ pbs: C() }],
			pbe: [{ pbe: C() }],
			pt: [{ pt: C() }],
			pr: [{ pr: C() }],
			pb: [{ pb: C() }],
			pl: [{ pl: C() }],
			m: [{ m: O() }],
			mx: [{ mx: O() }],
			my: [{ my: O() }],
			ms: [{ ms: O() }],
			me: [{ me: O() }],
			mbs: [{ mbs: O() }],
			mbe: [{ mbe: O() }],
			mt: [{ mt: O() }],
			mr: [{ mr: O() }],
			mb: [{ mb: O() }],
			ml: [{ ml: O() }],
			"space-x": [{ "space-x": C() }],
			"space-x-reverse": ["space-x-reverse"],
			"space-y": [{ "space-y": C() }],
			"space-y-reverse": ["space-y-reverse"],
			size: [{ size: k() }],
			"inline-size": [{ inline: ["auto", ...ie()] }],
			"min-inline-size": [{ "min-inline": ["auto", ...ie()] }],
			"max-inline-size": [{ "max-inline": ["none", ...ie()] }],
			"block-size": [{ block: ["auto", ...ae()] }],
			"min-block-size": [{ "min-block": ["auto", ...ae()] }],
			"max-block-size": [{ "max-block": ["none", ...ae()] }],
			w: [{ w: [
				s,
				"screen",
				...k()
			] }],
			"min-w": [{ "min-w": [
				s,
				"screen",
				"none",
				...k()
			] }],
			"max-w": [{ "max-w": [
				s,
				"screen",
				"none",
				"prose",
				{ screen: [o] },
				...k()
			] }],
			h: [{ h: [
				"screen",
				"lh",
				...k()
			] }],
			"min-h": [{ "min-h": [
				"screen",
				"lh",
				"none",
				...k()
			] }],
			"max-h": [{ "max-h": [
				"screen",
				"lh",
				"none",
				...k()
			] }],
			"font-size": [{ text: [
				"base",
				n,
				O_,
				x_
			] }],
			"font-smoothing": ["antialiased", "subpixel-antialiased"],
			"font-style": ["italic", "not-italic"],
			"font-weight": [{ font: [
				r,
				P_,
				C_
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
				d_,
				X
			] }],
			"font-family": [{ font: [
				k_,
				w_,
				t
			] }],
			"font-features": [{ "font-features": [X] }],
			"fvn-normal": ["normal-nums"],
			"fvn-ordinal": ["ordinal"],
			"fvn-slashed-zero": ["slashed-zero"],
			"fvn-figure": ["lining-nums", "oldstyle-nums"],
			"fvn-spacing": ["proportional-nums", "tabular-nums"],
			"fvn-fraction": ["diagonal-fractions", "stacked-fractions"],
			tracking: [{ tracking: [
				i,
				Z,
				X
			] }],
			"line-clamp": [{ "line-clamp": [
				Y,
				"none",
				Z,
				S_
			] }],
			leading: [{ leading: [
				"none",
				a,
				...C()
			] }],
			"list-image": [{ "list-image": [
				"none",
				Z,
				X
			] }],
			"list-style-position": [{ list: ["inside", "outside"] }],
			"list-style-type": [{ list: [
				"disc",
				"decimal",
				"none",
				Z,
				X
			] }],
			"text-alignment": [{ text: [
				"left",
				"center",
				"right",
				"justify",
				"start",
				"end"
			] }],
			"placeholder-color": [{ placeholder: A() }],
			"text-color": [{ text: A() }],
			"text-decoration": [
				"underline",
				"overline",
				"line-through",
				"no-underline"
			],
			"text-decoration-style": [{ decoration: [...de(), "wavy"] }],
			"text-decoration-thickness": [{ decoration: [
				Y,
				"from-font",
				"auto",
				Z,
				x_
			] }],
			"text-decoration-color": [{ decoration: A() }],
			"underline-offset": [{ "underline-offset": [
				Y,
				"auto",
				Z,
				X
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
			indent: [{ indent: C() }],
			"tab-size": [{ tab: [
				u_,
				Z,
				X
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
				Z,
				X
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
				Z,
				X
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
			"bg-position": [{ bg: oe() }],
			"bg-repeat": [{ bg: se() }],
			"bg-size": [{ bg: ce() }],
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
						u_,
						Z,
						X
					],
					radial: [
						"",
						Z,
						X
					],
					conic: [
						"",
						u_,
						Z,
						X
					]
				},
				M_,
				E_
			] }],
			"bg-color": [{ bg: A() }],
			"gradient-from-pos": [{ from: le() }],
			"gradient-via-pos": [{ via: le() }],
			"gradient-to-pos": [{ to: le() }],
			"gradient-from": [{ from: A() }],
			"gradient-via": [{ via: A() }],
			"gradient-to": [{ to: A() }],
			rounded: [{ rounded: j() }],
			"rounded-s": [{ "rounded-s": j() }],
			"rounded-e": [{ "rounded-e": j() }],
			"rounded-t": [{ "rounded-t": j() }],
			"rounded-r": [{ "rounded-r": j() }],
			"rounded-b": [{ "rounded-b": j() }],
			"rounded-l": [{ "rounded-l": j() }],
			"rounded-ss": [{ "rounded-ss": j() }],
			"rounded-se": [{ "rounded-se": j() }],
			"rounded-ee": [{ "rounded-ee": j() }],
			"rounded-es": [{ "rounded-es": j() }],
			"rounded-tl": [{ "rounded-tl": j() }],
			"rounded-tr": [{ "rounded-tr": j() }],
			"rounded-br": [{ "rounded-br": j() }],
			"rounded-bl": [{ "rounded-bl": j() }],
			"border-w": [{ border: ue() }],
			"border-w-x": [{ "border-x": ue() }],
			"border-w-y": [{ "border-y": ue() }],
			"border-w-s": [{ "border-s": ue() }],
			"border-w-e": [{ "border-e": ue() }],
			"border-w-bs": [{ "border-bs": ue() }],
			"border-w-be": [{ "border-be": ue() }],
			"border-w-t": [{ "border-t": ue() }],
			"border-w-r": [{ "border-r": ue() }],
			"border-w-b": [{ "border-b": ue() }],
			"border-w-l": [{ "border-l": ue() }],
			"divide-x": [{ "divide-x": ue() }],
			"divide-x-reverse": ["divide-x-reverse"],
			"divide-y": [{ "divide-y": ue() }],
			"divide-y-reverse": ["divide-y-reverse"],
			"border-style": [{ border: [
				...de(),
				"hidden",
				"none"
			] }],
			"divide-style": [{ divide: [
				...de(),
				"hidden",
				"none"
			] }],
			"border-color": [{ border: A() }],
			"border-color-x": [{ "border-x": A() }],
			"border-color-y": [{ "border-y": A() }],
			"border-color-s": [{ "border-s": A() }],
			"border-color-e": [{ "border-e": A() }],
			"border-color-bs": [{ "border-bs": A() }],
			"border-color-be": [{ "border-be": A() }],
			"border-color-t": [{ "border-t": A() }],
			"border-color-r": [{ "border-r": A() }],
			"border-color-b": [{ "border-b": A() }],
			"border-color-l": [{ "border-l": A() }],
			"divide-color": [{ divide: A() }],
			"outline-style": [{ outline: [
				...de(),
				"none",
				"hidden"
			] }],
			"outline-offset": [{ "outline-offset": [
				Y,
				Z,
				X
			] }],
			"outline-w": [{ outline: [
				"",
				Y,
				O_,
				x_
			] }],
			"outline-color": [{ outline: A() }],
			shadow: [{ shadow: [
				"",
				"inner",
				"none",
				u,
				N_,
				D_
			] }],
			"shadow-color": [{ shadow: A() }],
			"inset-shadow": [{ "inset-shadow": [
				"none",
				d,
				N_,
				D_
			] }],
			"inset-shadow-color": [{ "inset-shadow": A() }],
			"ring-w": [{ ring: ue() }],
			"ring-w-inset": ["ring-inset"],
			"ring-color": [{ ring: A() }],
			"ring-offset-w": [{ "ring-offset": [Y, x_] }],
			"ring-offset-color": [{ "ring-offset": A() }],
			"inset-ring-w": [{ "inset-ring": ue() }],
			"inset-ring-color": [{ "inset-ring": A() }],
			"text-shadow": [{ "text-shadow": [
				"none",
				f,
				N_,
				D_
			] }],
			"text-shadow-color": [{ "text-shadow": A() }],
			opacity: [{ opacity: [
				Y,
				Z,
				X
			] }],
			"mix-blend": [{ "mix-blend": [
				...M(),
				"plus-darker",
				"plus-lighter"
			] }],
			"bg-blend": [{ "bg-blend": M() }],
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
			"mask-image-linear-pos": [{ "mask-linear": [Y] }],
			"mask-image-linear-from-pos": [{ "mask-linear-from": N() }],
			"mask-image-linear-to-pos": [{ "mask-linear-to": N() }],
			"mask-image-linear-from-color": [{ "mask-linear-from": A() }],
			"mask-image-linear-to-color": [{ "mask-linear-to": A() }],
			"mask-image-t-from-pos": [{ "mask-t-from": N() }],
			"mask-image-t-to-pos": [{ "mask-t-to": N() }],
			"mask-image-t-from-color": [{ "mask-t-from": A() }],
			"mask-image-t-to-color": [{ "mask-t-to": A() }],
			"mask-image-r-from-pos": [{ "mask-r-from": N() }],
			"mask-image-r-to-pos": [{ "mask-r-to": N() }],
			"mask-image-r-from-color": [{ "mask-r-from": A() }],
			"mask-image-r-to-color": [{ "mask-r-to": A() }],
			"mask-image-b-from-pos": [{ "mask-b-from": N() }],
			"mask-image-b-to-pos": [{ "mask-b-to": N() }],
			"mask-image-b-from-color": [{ "mask-b-from": A() }],
			"mask-image-b-to-color": [{ "mask-b-to": A() }],
			"mask-image-l-from-pos": [{ "mask-l-from": N() }],
			"mask-image-l-to-pos": [{ "mask-l-to": N() }],
			"mask-image-l-from-color": [{ "mask-l-from": A() }],
			"mask-image-l-to-color": [{ "mask-l-to": A() }],
			"mask-image-x-from-pos": [{ "mask-x-from": N() }],
			"mask-image-x-to-pos": [{ "mask-x-to": N() }],
			"mask-image-x-from-color": [{ "mask-x-from": A() }],
			"mask-image-x-to-color": [{ "mask-x-to": A() }],
			"mask-image-y-from-pos": [{ "mask-y-from": N() }],
			"mask-image-y-to-pos": [{ "mask-y-to": N() }],
			"mask-image-y-from-color": [{ "mask-y-from": A() }],
			"mask-image-y-to-color": [{ "mask-y-to": A() }],
			"mask-image-radial": [{ "mask-radial": [Z, X] }],
			"mask-image-radial-from-pos": [{ "mask-radial-from": N() }],
			"mask-image-radial-to-pos": [{ "mask-radial-to": N() }],
			"mask-image-radial-from-color": [{ "mask-radial-from": A() }],
			"mask-image-radial-to-color": [{ "mask-radial-to": A() }],
			"mask-image-radial-shape": [{ "mask-radial": ["circle", "ellipse"] }],
			"mask-image-radial-size": [{ "mask-radial": [{
				closest: ["side", "corner"],
				farthest: ["side", "corner"]
			}] }],
			"mask-image-radial-pos": [{ "mask-radial-at": b() }],
			"mask-image-conic-pos": [{ "mask-conic": [Y] }],
			"mask-image-conic-from-pos": [{ "mask-conic-from": N() }],
			"mask-image-conic-to-pos": [{ "mask-conic-to": N() }],
			"mask-image-conic-from-color": [{ "mask-conic-from": A() }],
			"mask-image-conic-to-color": [{ "mask-conic-to": A() }],
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
			"mask-position": [{ mask: oe() }],
			"mask-repeat": [{ mask: se() }],
			"mask-size": [{ mask: ce() }],
			"mask-type": [{ "mask-type": ["alpha", "luminance"] }],
			"mask-image": [{ mask: [
				"none",
				Z,
				X
			] }],
			filter: [{ filter: [
				"",
				"none",
				Z,
				X
			] }],
			blur: [{ blur: fe() }],
			brightness: [{ brightness: [
				Y,
				Z,
				X
			] }],
			contrast: [{ contrast: [
				Y,
				Z,
				X
			] }],
			"drop-shadow": [{ "drop-shadow": [
				"",
				"none",
				p,
				N_,
				D_
			] }],
			"drop-shadow-color": [{ "drop-shadow": A() }],
			grayscale: [{ grayscale: [
				"",
				Y,
				Z,
				X
			] }],
			"hue-rotate": [{ "hue-rotate": [
				Y,
				Z,
				X
			] }],
			invert: [{ invert: [
				"",
				Y,
				Z,
				X
			] }],
			saturate: [{ saturate: [
				Y,
				Z,
				X
			] }],
			sepia: [{ sepia: [
				"",
				Y,
				Z,
				X
			] }],
			"backdrop-filter": [{ "backdrop-filter": [
				"",
				"none",
				Z,
				X
			] }],
			"backdrop-blur": [{ "backdrop-blur": fe() }],
			"backdrop-brightness": [{ "backdrop-brightness": [
				Y,
				Z,
				X
			] }],
			"backdrop-contrast": [{ "backdrop-contrast": [
				Y,
				Z,
				X
			] }],
			"backdrop-grayscale": [{ "backdrop-grayscale": [
				"",
				Y,
				Z,
				X
			] }],
			"backdrop-hue-rotate": [{ "backdrop-hue-rotate": [
				Y,
				Z,
				X
			] }],
			"backdrop-invert": [{ "backdrop-invert": [
				"",
				Y,
				Z,
				X
			] }],
			"backdrop-opacity": [{ "backdrop-opacity": [
				Y,
				Z,
				X
			] }],
			"backdrop-saturate": [{ "backdrop-saturate": [
				Y,
				Z,
				X
			] }],
			"backdrop-sepia": [{ "backdrop-sepia": [
				"",
				Y,
				Z,
				X
			] }],
			"border-collapse": [{ border: ["collapse", "separate"] }],
			"border-spacing": [{ "border-spacing": C() }],
			"border-spacing-x": [{ "border-spacing-x": C() }],
			"border-spacing-y": [{ "border-spacing-y": C() }],
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
				Z,
				X
			] }],
			"transition-behavior": [{ transition: ["normal", "discrete"] }],
			duration: [{ duration: [
				Y,
				"initial",
				Z,
				X
			] }],
			ease: [{ ease: [
				"linear",
				"initial",
				_,
				Z,
				X
			] }],
			delay: [{ delay: [
				Y,
				Z,
				X
			] }],
			animate: [{ animate: [
				"none",
				v,
				Z,
				X
			] }],
			backface: [{ backface: ["hidden", "visible"] }],
			perspective: [{ perspective: [
				h,
				Z,
				X
			] }],
			"perspective-origin": [{ "perspective-origin": x() }],
			rotate: [{ rotate: P() }],
			"rotate-x": [{ "rotate-x": P() }],
			"rotate-y": [{ "rotate-y": P() }],
			"rotate-z": [{ "rotate-z": P() }],
			scale: [{ scale: F() }],
			"scale-x": [{ "scale-x": F() }],
			"scale-y": [{ "scale-y": F() }],
			"scale-z": [{ "scale-z": F() }],
			"scale-3d": ["scale-3d"],
			skew: [{ skew: pe() }],
			"skew-x": [{ "skew-x": pe() }],
			"skew-y": [{ "skew-y": pe() }],
			transform: [{ transform: [
				Z,
				X,
				"",
				"none",
				"gpu",
				"cpu"
			] }],
			"transform-origin": [{ origin: x() }],
			"transform-style": [{ transform: ["3d", "flat"] }],
			translate: [{ translate: me() }],
			"translate-x": [{ "translate-x": me() }],
			"translate-y": [{ "translate-y": me() }],
			"translate-z": [{ "translate-z": me() }],
			"translate-none": ["translate-none"],
			zoom: [{ zoom: [
				u_,
				Z,
				X
			] }],
			accent: [{ accent: A() }],
			appearance: [{ appearance: ["none", "auto"] }],
			"caret-color": [{ caret: A() }],
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
				Z,
				X
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
			"scrollbar-thumb-color": [{ "scrollbar-thumb": A() }],
			"scrollbar-track-color": [{ "scrollbar-track": A() }],
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
			"scroll-m": [{ "scroll-m": C() }],
			"scroll-mx": [{ "scroll-mx": C() }],
			"scroll-my": [{ "scroll-my": C() }],
			"scroll-ms": [{ "scroll-ms": C() }],
			"scroll-me": [{ "scroll-me": C() }],
			"scroll-mbs": [{ "scroll-mbs": C() }],
			"scroll-mbe": [{ "scroll-mbe": C() }],
			"scroll-mt": [{ "scroll-mt": C() }],
			"scroll-mr": [{ "scroll-mr": C() }],
			"scroll-mb": [{ "scroll-mb": C() }],
			"scroll-ml": [{ "scroll-ml": C() }],
			"scroll-p": [{ "scroll-p": C() }],
			"scroll-px": [{ "scroll-px": C() }],
			"scroll-py": [{ "scroll-py": C() }],
			"scroll-ps": [{ "scroll-ps": C() }],
			"scroll-pe": [{ "scroll-pe": C() }],
			"scroll-pbs": [{ "scroll-pbs": C() }],
			"scroll-pbe": [{ "scroll-pbe": C() }],
			"scroll-pt": [{ "scroll-pt": C() }],
			"scroll-pr": [{ "scroll-pr": C() }],
			"scroll-pb": [{ "scroll-pb": C() }],
			"scroll-pl": [{ "scroll-pl": C() }],
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
				Z,
				X
			] }],
			fill: [{ fill: ["none", ...A()] }],
			"stroke-w": [{ stroke: [
				Y,
				O_,
				x_,
				S_
			] }],
			stroke: [{ stroke: ["none", ...A()] }],
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
}, K_ = (e, { cacheSize: t, prefix: n, experimentalParseClassName: r, extend: i = {}, override: a = {} }) => (q_(e, "cacheSize", t), q_(e, "prefix", n), q_(e, "experimentalParseClassName", r), J_(e.theme, a.theme), J_(e.classGroups, a.classGroups), J_(e.conflictingClassGroups, a.conflictingClassGroups), J_(e.conflictingClassGroupModifiers, a.conflictingClassGroupModifiers), q_(e, "postfixLookupClassGroups", a.postfixLookupClassGroups), q_(e, "orderSensitiveModifiers", a.orderSensitiveModifiers), Y_(e.theme, i.theme), Y_(e.classGroups, i.classGroups), Y_(e.conflictingClassGroups, i.conflictingClassGroups), Y_(e.conflictingClassGroupModifiers, i.conflictingClassGroupModifiers), X_(e, i, "postfixLookupClassGroups"), X_(e, i, "orderSensitiveModifiers"), e), q_ = (e, t, n) => {
	n !== void 0 && (e[t] = n);
}, J_ = (e, t) => {
	if (t) for (let n in t) q_(e, n, t[n]);
}, Y_ = (e, t) => {
	if (t) for (let n in t) X_(e, t, n);
}, X_ = (e, t, n) => {
	let r = t[n];
	r !== void 0 && (e[n] = e[n] ? e[n].concat(r) : r);
}, Z_ = (e, ...t) => typeof e == "function" ? Qg(G_, e, ...t) : Qg(() => K_(G_(), e), ...t), Q_ = /*#__PURE__*/ Qg(G_), $_ = /^[$_\p{ID_Start}][$_\u{200C}\u{200D}\p{ID_Continue}]*$/u, ev = /^[$_\p{ID_Start}][-$_\u{200C}\u{200D}\p{ID_Continue}]*$/u, tv = {};
function nv(e, t) {
	return ((t || tv).jsx ? ev : $_).test(e);
}
// node_modules/.pnpm/hast-util-whitespace@3.0.0/node_modules/hast-util-whitespace/lib/index.js
var rv = /[ \t\n\f\r]/g;
function iv(e) {
	return typeof e == "object" ? e.type === "text" && av(e.value) : av(e);
}
function av(e) {
	return e.replace(rv, "") === "";
}
// node_modules/.pnpm/inline-style-parser@0.2.9/node_modules/inline-style-parser/esm/index.mjs
var ov = /\/\*(?:[^*]|\*(?!\/))*\*\//g, sv = /\n/g, cv = /^\s*/, lv = /^(\*?[-#/*\\\w]+(\[[0-9a-z_-]+\])?)\s*/, uv = /^:\s*/, dv = /^((?:'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|url\((?:'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|[^)]*)\)|[^};])+)/, fv = /^[;\s]*/, pv = "\n", mv = "/", hv = "*", gv = "", _v = "comment", vv = "declaration";
function yv(e, t) {
	if (typeof e != "string") throw TypeError("First argument must be a string");
	if (!e) return [];
	t ||= {};
	var n = 1, r = 1;
	function i(e) {
		var t = e.match(sv);
		t && (n += t.length);
		var i = e.lastIndexOf(pv);
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
		c(cv);
	}
	function u(e) {
		for (var t; t = d();) e.push(t);
		return e;
	}
	function d() {
		var t = a();
		if (mv == e.charAt(0) && hv == e.charAt(1)) {
			for (var n = 2; gv != e.charAt(n) && (hv != e.charAt(n) || mv != e.charAt(n + 1));) ++n;
			if (n += 2, gv === e.charAt(n - 1)) return s("End of comment missing");
			var o = e.slice(2, n - 2);
			return r += 2, i(o), e = e.slice(n), r += 2, t({
				type: _v,
				comment: o
			});
		}
	}
	function f() {
		var e = a(), t = c(lv);
		if (t) {
			if (d(), !c(uv)) return s("property missing ':'");
			var n = c(dv), r = e({
				type: vv,
				property: t[0].replace(ov, gv).trim(),
				value: n ? n[0].replace(ov, gv).trim() : gv
			});
			return c(fv), r;
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
// node_modules/.pnpm/style-to-object@2.0.2/node_modules/style-to-object/esm/index.mjs
function bv(e, t) {
	let n = null;
	if (!e || typeof e != "string") return n;
	let r = yv(e), i = typeof t == "function";
	return r.forEach((e) => {
		if (e.type !== "declaration") return;
		let { property: r, value: a } = e;
		i ? t(r, a, e) : a && (n ??= {}, n[r] = a);
	}), n;
}
// node_modules/.pnpm/unist-util-stringify-position@4.0.0/node_modules/unist-util-stringify-position/lib/index.js
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
// node_modules/.pnpm/vfile-message@4.0.4/node_modules/vfile-message/lib/index.js
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
		if (!i.place && i.ancestors) {
			let e = i.ancestors[i.ancestors.length - 1];
			e && (i.place = e.position);
		}
		let o = i.place && "start" in i.place ? i.place.start : i.place;
		this.ancestors = i.ancestors || void 0, this.cause = i.cause || void 0, this.column = o ? o.column : void 0, this.fatal = void 0, this.file = "", this.message = r, this.line = o ? o.line : void 0, this.name = xv(i.place) || "1:1", this.place = i.place || void 0, this.reason = this.message, this.ruleId = i.ruleId || void 0, this.source = i.source || void 0, this.stack = a && i.cause && typeof i.cause.stack == "string" ? i.cause.stack : "", this.actual = void 0, this.expected = void 0, this.note = void 0, this.url = void 0;
	}
};
Object.defineProperties(Tv.prototype, {
	file: {
		configurable: !0,
		enumerable: !0,
		value: "",
		writable: !0
	},
	name: {
		configurable: !0,
		enumerable: !0,
		value: "",
		writable: !0
	},
	reason: {
		configurable: !0,
		enumerable: !0,
		value: "",
		writable: !0
	},
	message: {
		configurable: !0,
		enumerable: !0,
		value: "",
		writable: !0
	},
	stack: {
		configurable: !0,
		enumerable: !0,
		value: "",
		writable: !0
	},
	column: {
		configurable: !0,
		enumerable: !0,
		writable: !0
	},
	line: {
		configurable: !0,
		enumerable: !0,
		writable: !0
	},
	ancestors: {
		configurable: !0,
		enumerable: !0,
		writable: !0
	},
	cause: {
		configurable: !0,
		enumerable: !0,
		writable: !0
	},
	fatal: {
		configurable: !0,
		enumerable: !0,
		writable: !0
	},
	place: {
		configurable: !0,
		enumerable: !0,
		writable: !0
	},
	ruleId: {
		configurable: !0,
		enumerable: !0,
		writable: !0
	},
	source: {
		configurable: !0,
		enumerable: !0,
		writable: !0
	}
});
// node_modules/.pnpm/hast-util-to-jsx-runtime@2.3.7/node_modules/hast-util-to-jsx-runtime/lib/index.js
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
		schema: t.space === "svg" ? Ie : Fe,
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
	t.tagName.toLowerCase() === "svg" && r.space === "html" && (i = Ie, e.schema = i), e.ancestors.push(t);
	let a = Xv(e, t.tagName, !1), o = Gv(e, t), s = qv(e, t);
	return Av.has(t.tagName) && (s = s.filter(function(e) {
		return typeof e != "string" || !iv(e);
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
	t.name === "svg" && r.space === "html" && (i = Ie, e.schema = i), e.ancestors.push(t);
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
		let o = Array.isArray(i.children), s = Ss(n);
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
	let r = Me(e.schema, t);
	return Array.isArray(n) && (n = r.commaSeparated ? Re(n) : He(n)), r.property === "style" ? ["style", typeof n == "object" ? e.stylePropertyNameCase === "dom" ? n : Qv(n) : Yv(e, String(n))] : [e.elementAttributeNameCase === "react" && r.space ? Oe[r.property] || r.property : r.attribute, n];
}
function Yv(e, t) {
	let n = {};
	try {
		bv(t, function(t, r) {
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
			let t = nv(e[n]) ? {
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
	} else r = nv(t) && !/^[a-z]/.test(t) ? {
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
// node_modules/.pnpm/micromark@4.0.3/node_modules/micromark/lib/initialize/content.js
var ny = { tokenize: ry };
function ry(e) {
	let t = e.attempt(this.parser.constructs.contentInitial, r, i), n;
	return t;
	function r(n) {
		if (n === null) e.consume(n);
		else return e.enter("lineEnding"), e.consume(n), e.exit("lineEnding"), J(e, t, "linePrefix");
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
		else return G(t) ? (e.consume(t), e.exit("chunkText"), a) : (e.consume(t), o);
	}
}
// node_modules/.pnpm/micromark@4.0.3/node_modules/micromark/lib/initialize/document.js
var iy = { tokenize: oy }, ay = { tokenize: sy };
function oy(e) {
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
			let c = new Cm();
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
		return t.containerState = {}, e.check(ay, u, d)(a);
	}
	function u(e) {
		return i && v(), _(r), f(e);
	}
	function d(e) {
		return t.parser.lazy[t.now().line] = r !== n.length, o = t.now().offset, m(e);
	}
	function f(n) {
		return t.containerState = {}, e.attempt(ay, p, m)(n);
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
		else return G(n) ? (e.consume(n), g(e.exit("chunkFlow")), r = 0, t.interrupt = void 0, s) : (e.consume(n), h);
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
			let l = new Cm();
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
function sy(e, t, n) {
	return J(e, e.attempt(this.parser.constructs.document, t, n), "linePrefix", this.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4);
}
// node_modules/.pnpm/micromark@4.0.3/node_modules/micromark/lib/initialize/flow.js
var cy = { tokenize: ly };
function ly(e) {
	let t = this, n = e.attempt(ep, r, e.attempt(this.parser.constructs.flowInitial, i, J(e, e.attempt(this.parser.constructs.flow, i, e.attempt(Ep, i)), "linePrefix")));
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
// node_modules/.pnpm/micromark@4.0.3/node_modules/micromark/lib/initialize/text.js
var uy = { resolveAll: my() }, dy = py("string"), fy = py("text");
function py(e) {
	return {
		resolveAll: my(e === "text" ? hy : void 0),
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
function my(e) {
	return t;
	function t(t, n) {
		let r = -1, i;
		for (; ++r <= t.length;) i === void 0 ? t[r] && t[r][1].type === "data" && (i = r, r++) : t[r] && t[r][1].type === "data" || (r !== i + 2 && (t[i][1].end = t[r - 1][1].end, t.splice(i + 2, r - i - 2), r = i + 2), i = void 0);
		return e ? e(t, n) : t;
	}
}
function hy(e, t) {
	let n = new Cm(), r = 0;
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
// node_modules/.pnpm/micromark@4.0.3/node_modules/micromark/lib/constructs.js
var gy = /* @__PURE__ */ t({
	attentionMarkers: () => wy,
	contentInitial: () => vy,
	disable: () => Ty,
	document: () => _y,
	flow: () => by,
	flowInitial: () => yy,
	insideSpan: () => Cy,
	string: () => xy,
	text: () => Sy
}), _y = {
	42: hm,
	43: hm,
	45: hm,
	48: hm,
	49: hm,
	50: hm,
	51: hm,
	52: hm,
	53: hm,
	54: hm,
	55: hm,
	56: hm,
	57: hm,
	62: np
}, vy = { 91: Fp }, yy = {
	[-2]: mp,
	[-1]: mp,
	32: mp
}, by = {
	35: Vp,
	42: pm,
	45: [Tm, pm],
	60: Wp,
	61: Tm,
	95: pm,
	96: fp,
	126: fp
}, xy = {
	38: cp,
	92: op
}, Sy = {
	[-5]: dm,
	[-4]: dm,
	[-3]: dm,
	33: sm,
	38: cp,
	42: qf,
	60: [Zf, Yp],
	91: lm,
	92: [zp, op],
	93: Zp,
	95: qf,
	96: vp
}, Cy = { null: [qf, uy] }, wy = { null: [42, 95] }, Ty = { null: [] };
// node_modules/.pnpm/micromark@4.0.3/node_modules/micromark/lib/create-tokenizer.js
function Ey(e, t, n) {
	let r = {
		_bufferIndex: -1,
		_index: 0,
		line: n && n.line || 1,
		column: n && n.column || 1,
		offset: n && n.offset || 0
	}, i = {}, a = [], o = [], s = [], c = {
		attempt: S(x),
		check: S(ee),
		consume: v,
		enter: y,
		exit: b,
		interrupt: S(ee, { interrupt: !0 })
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
		return o = _l(o, e), g(), o[o.length - 1] === null ? (C(t, 0), l.events = vl(a, l.events, l), l.events) : [];
	}
	function f(e, t) {
		return Oy(p(e), t);
	}
	function p(e) {
		return Dy(o, e);
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
		i[e.line] = e.column, T();
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
		G(e) ? (r.line++, r.column = 1, r.offset += e === -3 ? 2 : 1, T()) : e !== -1 && (r.column++, r.offset++), r._bufferIndex < 0 ? r._index++ : (r._bufferIndex++, r._bufferIndex === o[r._index].length && (r._bufferIndex = -1, r._index++)), l.previous = e;
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
	function x(e, t) {
		C(e, t.from);
	}
	function ee(e, t) {
		t.restore();
	}
	function S(e, t) {
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
					return u = w(), s = e, e.partial || (l.currentConstruct = e), e.name && l.parser.constructs.disable.null.includes(e.name) ? h(n) : e.tokenize.call(t ? Object.assign(Object.create(l), t) : l, c, m, h)(n);
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
	function C(e, t) {
		e.resolveAll && !a.includes(e) && a.push(e), e.resolve && gl(l.events, t, l.events.length - t, e.resolve(l.events.slice(t), l)), e.resolveTo && (l.events = e.resolveTo(l.events, l));
	}
	function w() {
		let e = m(), t = l.previous, n = l.currentConstruct, i = l.events.length, a = Array.from(s);
		return {
			from: i,
			restore: o
		};
		function o() {
			r = e, l.previous = t, l.currentConstruct = n, l.events.length = i, s = a, T();
		}
	}
	function T() {
		r.line in i && r.column < 2 && (r.column = i[r.line], r.offset += i[r.line] - 1);
	}
}
function Dy(e, t) {
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
function Oy(e, t) {
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
// node_modules/.pnpm/micromark@4.0.3/node_modules/micromark/lib/parse.js
function ky(e) {
	let t = {
		constructs: yf([gy, ...(e || {}).extensions || []]),
		content: n(ny),
		defined: [],
		document: n(iy),
		flow: n(cy),
		lazy: {},
		string: n(dy),
		text: n(fy)
	};
	return t;
	function n(e) {
		return n;
		function n(n) {
			return Ey(t, e, n);
		}
	}
}
// node_modules/.pnpm/micromark@4.0.3/node_modules/micromark/lib/postprocess.js
function Ay(e) {
	for (; !wp(e););
	return e;
}
// node_modules/.pnpm/micromark@4.0.3/node_modules/micromark/lib/preprocess.js
var jy = /[\0\t\n\r]/g;
function My() {
	let e = 1, t = "", n = !0, r;
	return i;
	function i(i, a, o) {
		i = t + (typeof i == "string" ? i.toString() : new TextDecoder(a || void 0).decode(i));
		let s = [], c = 0;
		for (t = "", n &&= (i.charCodeAt(0) === 65279 && c++, void 0); c < i.length;) {
			jy.lastIndex = c;
			let n = jy.exec(i), a = n && n.index !== void 0 ? n.index : i.length, o = i.charCodeAt(a);
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
// node_modules/.pnpm/mdast-util-from-markdown@2.1.0/node_modules/mdast-util-from-markdown/lib/index.js
var Ny = {}.hasOwnProperty;
function Py(e, t, n) {
	return t && typeof t == "object" && (n = t, t = void 0), Fy(n)(Ay(ky(n).document().write(My()(e, t, !0))));
}
function Fy(e) {
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
			autolink: o(be),
			autolinkProtocol: T,
			autolinkEmail: T,
			atxHeading: o(ge),
			blockQuote: o(P),
			characterEscape: T,
			characterReference: T,
			codeFenced: o(F),
			codeFencedFenceInfo: s,
			codeFencedFenceMeta: s,
			codeIndented: o(F, s),
			codeText: o(pe, s),
			codeTextData: T,
			data: T,
			codeFlowValue: T,
			definition: o(me),
			definitionDestinationString: s,
			definitionLabelString: s,
			definitionTitleString: s,
			emphasis: o(he),
			hardBreakEscape: o(_e),
			hardBreakTrailing: o(_e),
			htmlFlow: o(ve, s),
			htmlFlowData: T,
			htmlText: o(ve, s),
			htmlTextData: T,
			image: o(ye),
			label: s,
			link: o(be),
			listItem: o(Se),
			listItemValue: p,
			listOrdered: o(xe, f),
			listUnordered: o(xe),
			paragraph: o(Ce),
			reference: le,
			referenceString: s,
			resourceDestinationString: s,
			resourceTitleString: s,
			setextHeading: o(ge),
			strong: o(we),
			thematicBreak: o(Ee)
		},
		exit: {
			atxHeading: l(),
			atxHeadingSequence: ee,
			autolink: l(),
			autolinkEmail: fe,
			autolinkProtocol: N,
			blockQuote: l(),
			characterEscapeValue: E,
			characterReferenceMarkerHexadecimal: ue,
			characterReferenceMarkerNumeric: ue,
			characterReferenceValue: de,
			characterReference: M,
			codeFenced: l(_),
			codeFencedFence: g,
			codeFencedFenceInfo: m,
			codeFencedFenceMeta: h,
			codeFlowValue: E,
			codeIndented: l(v),
			codeText: l(O),
			codeTextData: E,
			data: E,
			definition: l(),
			definitionDestinationString: x,
			definitionLabelString: y,
			definitionTitleString: b,
			emphasis: l(),
			hardBreakEscape: l(te),
			hardBreakTrailing: l(te),
			htmlFlow: l(ne),
			htmlFlowData: E,
			htmlText: l(re),
			htmlTextData: E,
			image: l(ie),
			label: A,
			labelText: ae,
			lineEnding: D,
			link: l(k),
			listItem: l(),
			listOrdered: l(),
			listUnordered: l(),
			paragraph: l(),
			referenceString: j,
			resourceDestinationString: oe,
			resourceTitleString: se,
			resource: ce,
			setextHeading: l(w),
			setextHeadingLineSequence: C,
			setextHeadingText: S,
			strong: l(),
			thematicBreak: l()
		}
	};
	Ly(t, (e || {}).mdastExtensions || []);
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
			}, e[p][1]), Ny.call(n, e[p][1].type) && n[e[p][1].type].call({
				...o,
				sliceSerialize: e[p][2].sliceSerialize
			}, e[p][1]), e[p][0] === "exit" && t.afterExit.length > 0 && i(t.afterExit, {
				...o,
				sliceSerialize: e[p][2].sliceSerialize
			}, e[p][1]);
		}
		if (o.tokenStack.length > 0) {
			let e = o.tokenStack[o.tokenStack.length - 1];
			(e[1] || zy).call(o, void 0, e[0]);
		}
		for (r.position = {
			start: Iy(e.length > 0 ? e[0][1].start : {
				line: 1,
				column: 1,
				offset: 0
			}),
			end: Iy(e.length > 0 ? e[e.length - 2][1].end : {
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
			start: Iy(t.start),
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
		if (!r) throw Error("Cannot close `" + e.type + "` (" + xv({
			start: e.start,
			end: e.end
		}) + "): it’s not open");
		r[0].type !== e.type && (t ? t.call(this, e, r[0]) : (r[1] || zy).call(this, e, r[0])), n.position.end = Iy(e.end);
	}
	function d() {
		return ld(this.stack.pop());
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
		n.label = t, n.identifier = Zl(this.sliceSerialize(e)).toLowerCase();
	}
	function b() {
		let e = this.resume(), t = this.stack[this.stack.length - 1];
		t.title = e;
	}
	function x() {
		let e = this.resume(), t = this.stack[this.stack.length - 1];
		t.url = e;
	}
	function ee(e) {
		let t = this.stack[this.stack.length - 1];
		t.depth ||= this.sliceSerialize(e).length;
	}
	function S() {
		this.data.setextHeadingSlurpLineEnding = !0;
	}
	function C(e) {
		let t = this.stack[this.stack.length - 1];
		t.depth = this.sliceSerialize(e).codePointAt(0) === 61 ? 1 : 2;
	}
	function w() {
		this.data.setextHeadingSlurpLineEnding = void 0;
	}
	function T(e) {
		let t = this.stack[this.stack.length - 1].children, n = t[t.length - 1];
		n && n.type === "text" || (n = Te(), n.position = {
			start: Iy(e.start),
			end: void 0
		}, t.push(n)), this.stack.push(n);
	}
	function E(e) {
		let t = this.stack.pop();
		t.value += this.sliceSerialize(e), t.position.end = Iy(e.end);
	}
	function D(e) {
		let n = this.stack[this.stack.length - 1];
		if (this.data.atHardBreak) {
			let t = n.children[n.children.length - 1];
			t.position.end = Iy(e.end), this.data.atHardBreak = void 0;
		} else !this.data.setextHeadingSlurpLineEnding && t.canContainEols.includes(n.type) && (T.call(this, e), E.call(this, e));
	}
	function te() {
		this.data.atHardBreak = !0;
	}
	function ne() {
		let e = this.resume(), t = this.stack[this.stack.length - 1];
		t.value = e;
	}
	function re() {
		let e = this.resume(), t = this.stack[this.stack.length - 1];
		t.value = e;
	}
	function O() {
		let e = this.resume(), t = this.stack[this.stack.length - 1];
		t.value = e;
	}
	function k() {
		let e = this.stack[this.stack.length - 1];
		if (this.data.inReference) {
			let t = this.data.referenceType || "shortcut";
			e.type += "Reference", e.referenceType = t, delete e.url, delete e.title;
		} else delete e.identifier, delete e.label;
		this.data.referenceType = void 0;
	}
	function ie() {
		let e = this.stack[this.stack.length - 1];
		if (this.data.inReference) {
			let t = this.data.referenceType || "shortcut";
			e.type += "Reference", e.referenceType = t, delete e.url, delete e.title;
		} else delete e.identifier, delete e.label;
		this.data.referenceType = void 0;
	}
	function ae(e) {
		let t = this.sliceSerialize(e), n = this.stack[this.stack.length - 2];
		n.label = Yd(t), n.identifier = Zl(t).toLowerCase();
	}
	function A() {
		let e = this.stack[this.stack.length - 1], t = this.resume(), n = this.stack[this.stack.length - 1];
		this.data.inReference = !0, n.type === "link" ? n.children = e.children : n.alt = t;
	}
	function oe() {
		let e = this.resume(), t = this.stack[this.stack.length - 1];
		t.url = e;
	}
	function se() {
		let e = this.resume(), t = this.stack[this.stack.length - 1];
		t.title = e;
	}
	function ce() {
		this.data.inReference = void 0;
	}
	function le() {
		this.data.referenceType = "collapsed";
	}
	function j(e) {
		let t = this.resume(), n = this.stack[this.stack.length - 1];
		n.label = t, n.identifier = Zl(this.sliceSerialize(e)).toLowerCase(), this.data.referenceType = "full";
	}
	function ue(e) {
		this.data.characterReferenceType = e.type;
	}
	function de(e) {
		let t = this.sliceSerialize(e), n = this.data.characterReferenceType, r;
		n ? (r = qd(t, n === "characterReferenceMarkerNumeric" ? 10 : 16), this.data.characterReferenceType = void 0) : r = Kd(t);
		let i = this.stack[this.stack.length - 1];
		i.value += r;
	}
	function M(e) {
		let t = this.stack.pop();
		t.position.end = Iy(e.end);
	}
	function N(e) {
		E.call(this, e);
		let t = this.stack[this.stack.length - 1];
		t.url = this.sliceSerialize(e);
	}
	function fe(e) {
		E.call(this, e);
		let t = this.stack[this.stack.length - 1];
		t.url = "mailto:" + this.sliceSerialize(e);
	}
	function P() {
		return {
			type: "blockquote",
			children: [],
			position: void 0
		};
	}
	function F() {
		return {
			type: "code",
			lang: null,
			meta: null,
			value: "",
			position: void 0
		};
	}
	function pe() {
		return {
			type: "inlineCode",
			value: "",
			position: void 0
		};
	}
	function me() {
		return {
			type: "definition",
			identifier: "",
			label: null,
			title: null,
			url: "",
			position: void 0
		};
	}
	function he() {
		return {
			type: "emphasis",
			children: [],
			position: void 0
		};
	}
	function ge() {
		return {
			type: "heading",
			depth: 0,
			children: [],
			position: void 0
		};
	}
	function _e() {
		return {
			type: "break",
			position: void 0
		};
	}
	function ve() {
		return {
			type: "html",
			value: "",
			position: void 0
		};
	}
	function ye() {
		return {
			type: "image",
			title: null,
			url: "",
			alt: null,
			position: void 0
		};
	}
	function be() {
		return {
			type: "link",
			title: null,
			url: "",
			children: [],
			position: void 0
		};
	}
	function xe(e) {
		return {
			type: "list",
			ordered: e.type === "listOrdered",
			start: null,
			spread: e._spread,
			children: [],
			position: void 0
		};
	}
	function Se(e) {
		return {
			type: "listItem",
			spread: e._spread,
			checked: null,
			children: [],
			position: void 0
		};
	}
	function Ce() {
		return {
			type: "paragraph",
			children: [],
			position: void 0
		};
	}
	function we() {
		return {
			type: "strong",
			children: [],
			position: void 0
		};
	}
	function Te() {
		return {
			type: "text",
			value: "",
			position: void 0
		};
	}
	function Ee() {
		return {
			type: "thematicBreak",
			position: void 0
		};
	}
}
function Iy(e) {
	return {
		line: e.line,
		column: e.column,
		offset: e.offset
	};
}
function Ly(e, t) {
	let n = -1;
	for (; ++n < t.length;) {
		let r = t[n];
		Array.isArray(r) ? Ly(e, r) : Ry(e, r);
	}
}
function Ry(e, t) {
	let n;
	for (n in t) if (Ny.call(t, n)) switch (n) {
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
function zy(e, t) {
	throw Error(e ? "Cannot close `" + e.type + "` (" + xv({
		start: e.start,
		end: e.end
	}) + "): a different token (`" + t.type + "`, " + xv({
		start: t.start,
		end: t.end
	}) + ") is open" : "Cannot close document, a token (`" + t.type + "`, " + xv({
		start: t.start,
		end: t.end
	}) + ") is still open");
}
// node_modules/.pnpm/remark-parse@11.0.0/node_modules/remark-parse/lib/index.js
function By(e) {
	let t = this;
	t.parser = n;
	function n(n) {
		return Py(n, {
			...t.data("settings"),
			...e,
			extensions: t.data("micromarkExtensions") || [],
			mdastExtensions: t.data("fromMarkdownExtensions") || []
		});
	}
}
// node_modules/.pnpm/mdast-util-to-hast@13.2.1/node_modules/mdast-util-to-hast/lib/handlers/blockquote.js
function Vy(e, t) {
	let n = {
		type: "element",
		tagName: "blockquote",
		properties: {},
		children: e.wrap(e.all(t), !0)
	};
	return e.patch(t, n), e.applyData(t, n);
}
// node_modules/.pnpm/mdast-util-to-hast@13.2.1/node_modules/mdast-util-to-hast/lib/handlers/break.js
function Hy(e, t) {
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
// node_modules/.pnpm/mdast-util-to-hast@13.2.1/node_modules/mdast-util-to-hast/lib/handlers/code.js
function Uy(e, t) {
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
// node_modules/.pnpm/mdast-util-to-hast@13.2.1/node_modules/mdast-util-to-hast/lib/handlers/delete.js
function Wy(e, t) {
	let n = {
		type: "element",
		tagName: "del",
		properties: {},
		children: e.all(t)
	};
	return e.patch(t, n), e.applyData(t, n);
}
// node_modules/.pnpm/mdast-util-to-hast@13.2.1/node_modules/mdast-util-to-hast/lib/handlers/emphasis.js
function Gy(e, t) {
	let n = {
		type: "element",
		tagName: "em",
		properties: {},
		children: e.all(t)
	};
	return e.patch(t, n), e.applyData(t, n);
}
// node_modules/.pnpm/mdast-util-to-hast@13.2.1/node_modules/mdast-util-to-hast/lib/handlers/footnote-reference.js
function Ky(e, t) {
	let n = typeof e.options.clobberPrefix == "string" ? e.options.clobberPrefix : "user-content-", r = String(t.identifier).toUpperCase(), i = Kf(r.toLowerCase()), a = e.footnoteOrder.indexOf(r), o, s = e.footnoteCounts.get(r);
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
// node_modules/.pnpm/mdast-util-to-hast@13.2.1/node_modules/mdast-util-to-hast/lib/handlers/heading.js
function qy(e, t) {
	let n = {
		type: "element",
		tagName: "h" + t.depth,
		properties: {},
		children: e.all(t)
	};
	return e.patch(t, n), e.applyData(t, n);
}
// node_modules/.pnpm/mdast-util-to-hast@13.2.1/node_modules/mdast-util-to-hast/lib/handlers/html.js
function Jy(e, t) {
	if (e.options.allowDangerousHtml) {
		let n = {
			type: "raw",
			value: t.value
		};
		return e.patch(t, n), e.applyData(t, n);
	}
}
// node_modules/.pnpm/mdast-util-to-hast@13.2.1/node_modules/mdast-util-to-hast/lib/revert.js
function Yy(e, t) {
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
// node_modules/.pnpm/mdast-util-to-hast@13.2.1/node_modules/mdast-util-to-hast/lib/handlers/image-reference.js
function Xy(e, t) {
	let n = String(t.identifier).toUpperCase(), r = e.definitionById.get(n);
	if (!r) return Yy(e, t);
	let i = {
		src: Kf(r.url || ""),
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
// node_modules/.pnpm/mdast-util-to-hast@13.2.1/node_modules/mdast-util-to-hast/lib/handlers/image.js
function Zy(e, t) {
	let n = { src: Kf(t.url) };
	t.alt !== null && t.alt !== void 0 && (n.alt = t.alt), t.title !== null && t.title !== void 0 && (n.title = t.title);
	let r = {
		type: "element",
		tagName: "img",
		properties: n,
		children: []
	};
	return e.patch(t, r), e.applyData(t, r);
}
// node_modules/.pnpm/mdast-util-to-hast@13.2.1/node_modules/mdast-util-to-hast/lib/handlers/inline-code.js
function Qy(e, t) {
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
// node_modules/.pnpm/mdast-util-to-hast@13.2.1/node_modules/mdast-util-to-hast/lib/handlers/link-reference.js
function $y(e, t) {
	let n = String(t.identifier).toUpperCase(), r = e.definitionById.get(n);
	if (!r) return Yy(e, t);
	let i = { href: Kf(r.url || "") };
	r.title !== null && r.title !== void 0 && (i.title = r.title);
	let a = {
		type: "element",
		tagName: "a",
		properties: i,
		children: e.all(t)
	};
	return e.patch(t, a), e.applyData(t, a);
}
// node_modules/.pnpm/mdast-util-to-hast@13.2.1/node_modules/mdast-util-to-hast/lib/handlers/link.js
function eb(e, t) {
	let n = { href: Kf(t.url) };
	t.title !== null && t.title !== void 0 && (n.title = t.title);
	let r = {
		type: "element",
		tagName: "a",
		properties: n,
		children: e.all(t)
	};
	return e.patch(t, r), e.applyData(t, r);
}
// node_modules/.pnpm/mdast-util-to-hast@13.2.1/node_modules/mdast-util-to-hast/lib/handlers/list-item.js
function tb(e, t, n) {
	let r = e.all(t), i = n ? nb(n) : rb(t), a = {}, o = [];
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
function nb(e) {
	let t = !1;
	if (e.type === "list") {
		t = e.spread || !1;
		let n = e.children, r = -1;
		for (; !t && ++r < n.length;) t = rb(n[r]);
	}
	return t;
}
function rb(e) {
	return e.spread ?? e.children.length > 1;
}
// node_modules/.pnpm/mdast-util-to-hast@13.2.1/node_modules/mdast-util-to-hast/lib/handlers/list.js
function ib(e, t) {
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
// node_modules/.pnpm/mdast-util-to-hast@13.2.1/node_modules/mdast-util-to-hast/lib/handlers/paragraph.js
function ab(e, t) {
	let n = {
		type: "element",
		tagName: "p",
		properties: {},
		children: e.all(t)
	};
	return e.patch(t, n), e.applyData(t, n);
}
// node_modules/.pnpm/mdast-util-to-hast@13.2.1/node_modules/mdast-util-to-hast/lib/handlers/root.js
function ob(e, t) {
	let n = {
		type: "root",
		children: e.wrap(e.all(t))
	};
	return e.patch(t, n), e.applyData(t, n);
}
// node_modules/.pnpm/mdast-util-to-hast@13.2.1/node_modules/mdast-util-to-hast/lib/handlers/strong.js
function sb(e, t) {
	let n = {
		type: "element",
		tagName: "strong",
		properties: {},
		children: e.all(t)
	};
	return e.patch(t, n), e.applyData(t, n);
}
// node_modules/.pnpm/mdast-util-to-hast@13.2.1/node_modules/mdast-util-to-hast/lib/handlers/table.js
function cb(e, t) {
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
		}, a = Ss(t.children[1]), o = xs(t.children[t.children.length - 1]);
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
// node_modules/.pnpm/mdast-util-to-hast@13.2.1/node_modules/mdast-util-to-hast/lib/handlers/table-row.js
function lb(e, t, n) {
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
// node_modules/.pnpm/mdast-util-to-hast@13.2.1/node_modules/mdast-util-to-hast/lib/handlers/table-cell.js
function ub(e, t) {
	let n = {
		type: "element",
		tagName: "td",
		properties: {},
		children: e.all(t)
	};
	return e.patch(t, n), e.applyData(t, n);
}
// node_modules/.pnpm/trim-lines@3.0.1/node_modules/trim-lines/index.js
var db = 9, fb = 32;
function pb(e) {
	let t = String(e), n = /\r?\n|\r/g, r = n.exec(t), i = 0, a = [];
	for (; r;) a.push(mb(t.slice(i, r.index), i > 0, !0), r[0]), i = r.index + r[0].length, r = n.exec(t);
	return a.push(mb(t.slice(i), i > 0, !1)), a.join("");
}
function mb(e, t, n) {
	let r = 0, i = e.length;
	if (t) {
		let t = e.codePointAt(r);
		for (; t === db || t === fb;) r++, t = e.codePointAt(r);
	}
	if (n) {
		let t = e.codePointAt(i - 1);
		for (; t === db || t === fb;) i--, t = e.codePointAt(i - 1);
	}
	return i > r ? e.slice(r, i) : "";
}
// node_modules/.pnpm/mdast-util-to-hast@13.2.1/node_modules/mdast-util-to-hast/lib/handlers/text.js
function hb(e, t) {
	let n = {
		type: "text",
		value: pb(String(t.value))
	};
	return e.patch(t, n), e.applyData(t, n);
}
// node_modules/.pnpm/mdast-util-to-hast@13.2.1/node_modules/mdast-util-to-hast/lib/handlers/thematic-break.js
function gb(e, t) {
	let n = {
		type: "element",
		tagName: "hr",
		properties: {},
		children: []
	};
	return e.patch(t, n), e.applyData(t, n);
}
// node_modules/.pnpm/mdast-util-to-hast@13.2.1/node_modules/mdast-util-to-hast/lib/handlers/index.js
var _b = {
	blockquote: Vy,
	break: Hy,
	code: Uy,
	delete: Wy,
	emphasis: Gy,
	footnoteReference: Ky,
	heading: qy,
	html: Jy,
	imageReference: Xy,
	image: Zy,
	inlineCode: Qy,
	linkReference: $y,
	link: eb,
	listItem: tb,
	list: ib,
	paragraph: ab,
	root: ob,
	strong: sb,
	table: cb,
	tableCell: ub,
	tableRow: lb,
	text: hb,
	thematicBreak: gb,
	toml: vb,
	yaml: vb,
	definition: vb,
	footnoteDefinition: vb
};
function vb() {}
// node_modules/.pnpm/mdast-util-to-hast@13.2.1/node_modules/mdast-util-to-hast/lib/footer.js
function yb(e, t) {
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
function bb(e, t) {
	return "Back to reference " + (e + 1) + (t > 1 ? "-" + t : "");
}
function xb(e) {
	let t = typeof e.options.clobberPrefix == "string" ? e.options.clobberPrefix : "user-content-", n = e.options.footnoteBackContent || yb, r = e.options.footnoteBackLabel || bb, i = e.options.footnoteLabel || "Footnotes", a = e.options.footnoteLabelTagName || "h2", o = e.options.footnoteLabelProperties || { className: ["sr-only"] }, s = [], c = -1;
	for (; ++c < e.footnoteOrder.length;) {
		let i = e.footnoteById.get(e.footnoteOrder[c]);
		if (!i) continue;
		let a = e.all(i), o = String(i.identifier).toUpperCase(), l = Kf(o.toLowerCase()), u = 0, d = [], f = e.footnoteCounts.get(o);
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
					...Jt(o),
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
// node_modules/.pnpm/mdast-util-to-hast@13.2.1/node_modules/mdast-util-to-hast/lib/state.js
var Sb = {}.hasOwnProperty, Cb = {};
function wb(e, t) {
	let n = t || Cb, r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map(), a = {
		all: s,
		applyData: Eb,
		definitionById: r,
		footnoteById: i,
		footnoteCounts: /* @__PURE__ */ new Map(),
		footnoteOrder: [],
		handlers: {
			..._b,
			...n.handlers
		},
		one: o,
		options: n,
		patch: Tb,
		wrap: Ob
	};
	return x(e, function(e) {
		if (e.type === "definition" || e.type === "footnoteDefinition") {
			let t = e.type === "definition" ? r : i, n = String(e.identifier).toUpperCase();
			t.has(n) || t.set(n, e);
		}
	}), a;
	function o(e, t) {
		let n = e.type, r = a.handlers[n];
		if (Sb.call(a.handlers, n) && r) return r(a, e, t);
		if (a.options.passThrough && a.options.passThrough.includes(n)) {
			if ("children" in e) {
				let { children: t, ...n } = e, r = Jt(n);
				return r.children = a.all(e), r;
			}
			return Jt(e);
		}
		return (a.options.unknownHandler || Db)(a, e, t);
	}
	function s(e) {
		let t = [];
		if ("children" in e) {
			let n = e.children, r = -1;
			for (; ++r < n.length;) {
				let i = a.one(n[r], e);
				if (i) {
					if (r && n[r - 1].type === "break" && (!Array.isArray(i) && i.type === "text" && (i.value = kb(i.value)), !Array.isArray(i) && i.type === "element")) {
						let e = i.children[0];
						e && e.type === "text" && (e.value = kb(e.value));
					}
					Array.isArray(i) ? t.push(...i) : t.push(i);
				}
			}
		}
		return t;
	}
}
function Tb(e, t) {
	e.position && (t.position = ws(e));
}
function Eb(e, t) {
	let n = t;
	if (e && e.data) {
		let t = e.data.hName, r = e.data.hChildren, i = e.data.hProperties;
		typeof t == "string" && (n.type === "element" ? n.tagName = t : n = {
			type: "element",
			tagName: t,
			properties: {},
			children: "children" in n ? n.children : [n]
		}), n.type === "element" && i && Object.assign(n.properties, Jt(i)), "children" in n && n.children && r != null && (n.children = r);
	}
	return n;
}
function Db(e, t) {
	let n = t.data || {}, r = "value" in t && !(Sb.call(n, "hProperties") || Sb.call(n, "hChildren")) ? {
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
function Ob(e, t) {
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
function kb(e) {
	let t = 0, n = e.charCodeAt(t);
	for (; n === 9 || n === 32;) t++, n = e.charCodeAt(t);
	return e.slice(t);
}
// node_modules/.pnpm/mdast-util-to-hast@13.2.1/node_modules/mdast-util-to-hast/lib/index.js
function Ab(e, t) {
	let n = wb(e, t), r = n.one(e, void 0), i = xb(n), a = Array.isArray(r) ? {
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
// node_modules/.pnpm/remark-rehype@11.1.2/node_modules/remark-rehype/lib/index.js
function jb(e, t) {
	return e && "run" in e ? async function(n, r) {
		let i = Ab(n, {
			file: r,
			...t
		});
		await e.run(i, r);
	} : function(n, r) {
		return Ab(n, {
			file: r,
			...e || t
		});
	};
}
// node_modules/.pnpm/bail@2.0.2/node_modules/bail/index.js
function Mb(e) {
	if (e) throw e;
}
// node_modules/.pnpm/is-plain-obj@4.1.0/node_modules/is-plain-obj/index.js
var Nb = /* @__PURE__ */ e((/* @__PURE__ */ n(((e, t) => {
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
function Pb(e) {
	if (typeof e != "object" || !e) return !1;
	let t = Object.getPrototypeOf(e);
	return (t === null || t === Object.prototype || Object.getPrototypeOf(t) === null) && !(Symbol.toStringTag in e) && !(Symbol.iterator in e);
}
// node_modules/.pnpm/trough@2.2.0/node_modules/trough/lib/index.js
function Fb() {
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
				t = o, s ? Ib(s, i)(...o) : r(null, ...o);
			}
		}
	}
	function r(n) {
		if (typeof n != "function") throw TypeError("Expected `middelware` to be a function, not " + n);
		return e.push(n), t;
	}
}
function Ib(e, t) {
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
// node_modules/.pnpm/vfile@6.0.3/node_modules/vfile/lib/minpath.browser.js
var Lb = {
	basename: Rb,
	dirname: zb,
	extname: Bb,
	join: Vb,
	sep: "/"
};
function Rb(e, t) {
	if (t !== void 0 && typeof t != "string") throw TypeError("\"ext\" argument must be a string");
	Wb(e);
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
function zb(e) {
	if (Wb(e), e.length === 0) return ".";
	let t = -1, n = e.length, r;
	for (; --n;) if (e.codePointAt(n) === 47) {
		if (r) {
			t = n;
			break;
		}
	} else r ||= !0;
	return t < 0 ? e.codePointAt(0) === 47 ? "/" : "." : t === 1 && e.codePointAt(0) === 47 ? "//" : e.slice(0, t);
}
function Bb(e) {
	Wb(e);
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
function Vb(...e) {
	let t = -1, n;
	for (; ++t < e.length;) Wb(e[t]), e[t] && (n = n === void 0 ? e[t] : n + "/" + e[t]);
	return n === void 0 ? "." : Hb(n);
}
function Hb(e) {
	Wb(e);
	let t = e.codePointAt(0) === 47, n = Ub(e, !t);
	return n.length === 0 && !t && (n = "."), n.length > 0 && e.codePointAt(e.length - 1) === 47 && (n += "/"), t ? "/" + n : n;
}
function Ub(e, t) {
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
function Wb(e) {
	if (typeof e != "string") throw TypeError("Path must be a string. Received " + JSON.stringify(e));
}
// node_modules/.pnpm/vfile@6.0.3/node_modules/vfile/lib/minproc.browser.js
var Gb = { cwd: Kb };
function Kb() {
	return "/";
}
// node_modules/.pnpm/vfile@6.0.3/node_modules/vfile/lib/minurl.shared.js
function qb(e) {
	return !!(typeof e == "object" && e && "href" in e && e.href && "protocol" in e && e.protocol && e.auth === void 0);
}
// node_modules/.pnpm/vfile@6.0.3/node_modules/vfile/lib/minurl.browser.js
function Jb(e) {
	if (typeof e == "string") e = new URL(e);
	else if (!qb(e)) {
		let t = /* @__PURE__ */ TypeError("The \"path\" argument must be of type string or an instance of URL. Received `" + e + "`");
		throw t.code = "ERR_INVALID_ARG_TYPE", t;
	}
	if (e.protocol !== "file:") {
		let e = /* @__PURE__ */ TypeError("The URL must be of scheme file");
		throw e.code = "ERR_INVALID_URL_SCHEME", e;
	}
	return Yb(e);
}
function Yb(e) {
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
// node_modules/.pnpm/vfile@6.0.3/node_modules/vfile/lib/index.js
var Xb = [
	"history",
	"path",
	"basename",
	"stem",
	"extname",
	"dirname"
], Zb = class {
	constructor(e) {
		let t;
		t = e ? qb(e) ? { path: e } : typeof e == "string" || tx(e) ? { value: e } : e : {}, this.cwd = "cwd" in t ? "" : Gb.cwd(), this.data = {}, this.history = [], this.messages = [], this.value, this.map, this.result, this.stored;
		let n = -1;
		for (; ++n < Xb.length;) {
			let e = Xb[n];
			e in t && t[e] !== void 0 && t[e] !== null && (this[e] = e === "history" ? [...t[e]] : t[e]);
		}
		let r;
		for (r in t) Xb.includes(r) || (this[r] = t[r]);
	}
	get basename() {
		return typeof this.path == "string" ? Lb.basename(this.path) : void 0;
	}
	set basename(e) {
		$b(e, "basename"), Qb(e, "basename"), this.path = Lb.join(this.dirname || "", e);
	}
	get dirname() {
		return typeof this.path == "string" ? Lb.dirname(this.path) : void 0;
	}
	set dirname(e) {
		ex(this.basename, "dirname"), this.path = Lb.join(e || "", this.basename);
	}
	get extname() {
		return typeof this.path == "string" ? Lb.extname(this.path) : void 0;
	}
	set extname(e) {
		if (Qb(e, "extname"), ex(this.dirname, "extname"), e) {
			if (e.codePointAt(0) !== 46) throw Error("`extname` must start with `.`");
			if (e.includes(".", 1)) throw Error("`extname` cannot contain multiple dots");
		}
		this.path = Lb.join(this.dirname, this.stem + (e || ""));
	}
	get path() {
		return this.history[this.history.length - 1];
	}
	set path(e) {
		qb(e) && (e = Jb(e)), $b(e, "path"), this.path !== e && this.history.push(e);
	}
	get stem() {
		return typeof this.path == "string" ? Lb.basename(this.path, this.extname) : void 0;
	}
	set stem(e) {
		$b(e, "stem"), Qb(e, "stem"), this.path = Lb.join(this.dirname || "", e + (this.extname || ""));
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
function Qb(e, t) {
	if (e && e.includes(Lb.sep)) throw Error("`" + t + "` cannot be a path: did not expect `" + Lb.sep + "`");
}
function $b(e, t) {
	if (!e) throw Error("`" + t + "` cannot be empty");
}
function ex(e, t) {
	if (!e) throw Error("Setting `" + t + "` requires `path` to be set too");
}
function tx(e) {
	return !!(e && typeof e == "object" && "byteLength" in e && "byteOffset" in e);
}
// node_modules/.pnpm/unified@11.0.5/node_modules/unified/lib/callable-instance.js
var nx = (function(e) {
	let t = this.constructor.prototype, n = t[e], r = function() {
		return n.apply(r, arguments);
	};
	return Object.setPrototypeOf(r, t), r;
}), rx = {}.hasOwnProperty, ix = new class e extends nx {
	constructor() {
		super("copy"), this.Compiler = void 0, this.Parser = void 0, this.attachers = [], this.compiler = void 0, this.freezeIndex = -1, this.frozen = void 0, this.namespace = {}, this.parser = void 0, this.transformers = Fb();
	}
	copy() {
		let t = new e(), n = -1;
		for (; ++n < this.attachers.length;) {
			let e = this.attachers[n];
			t.use(...e);
		}
		return t.data((0, Nb.default)(!0, {}, this.namespace)), t;
	}
	data(e, t) {
		return typeof e == "string" ? arguments.length === 2 ? (sx("data", this.frozen), this.namespace[e] = t, this) : rx.call(this.namespace, e) && this.namespace[e] || void 0 : e ? (sx("data", this.frozen), this.namespace = e, this) : this.namespace;
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
		let t = ux(e), n = this.parser || this.Parser;
		return ax("parse", n), n(String(t), t);
	}
	process(e, t) {
		let n = this;
		return this.freeze(), ax("process", this.parser || this.Parser), ox("process", this.compiler || this.Compiler), t ? r(void 0, t) : new Promise(r);
		function r(r, i) {
			let a = ux(e), o = n.parse(a);
			n.run(o, a, function(e, t, r) {
				if (e || !t || !r) return s(e);
				let i = t, a = n.stringify(i, r);
				fx(a) ? r.value = a : r.result = a, s(e, r);
			});
			function s(e, n) {
				e || !n ? i(e) : r ? r(n) : t(void 0, n);
			}
		}
	}
	processSync(e) {
		let t = !1, n;
		return this.freeze(), ax("processSync", this.parser || this.Parser), ox("processSync", this.compiler || this.Compiler), this.process(e, r), lx("processSync", "process", t), n;
		function r(e, r) {
			t = !0, Mb(e), n = r;
		}
	}
	run(e, t, n) {
		cx(e), this.freeze();
		let r = this.transformers;
		return !n && typeof t == "function" && (n = t, t = void 0), n ? i(void 0, n) : new Promise(i);
		function i(i, a) {
			let o = ux(t);
			r.run(e, o, s);
			function s(t, r, o) {
				let s = r || e;
				t ? a(t) : i ? i(s) : n(void 0, s, o);
			}
		}
	}
	runSync(e, t) {
		let n = !1, r;
		return this.run(e, t, i), lx("runSync", "run", n), r;
		function i(e, t) {
			Mb(e), r = t, n = !0;
		}
	}
	stringify(e, t) {
		this.freeze();
		let n = ux(t), r = this.compiler || this.Compiler;
		return ox("stringify", r), cx(e), r(e, n);
	}
	use(e, ...t) {
		let n = this.attachers, r = this.namespace;
		if (sx("use", this.frozen), e != null) {
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
			o(e.plugins), e.settings && (r.settings = (0, Nb.default)(!0, r.settings, e.settings));
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
				Pb(o) && Pb(r) && (r = (0, Nb.default)(!0, o, r)), n[i] = [
					e,
					r,
					...a
				];
			}
		}
	}
}().freeze();
function ax(e, t) {
	if (typeof t != "function") throw TypeError("Cannot `" + e + "` without `parser`");
}
function ox(e, t) {
	if (typeof t != "function") throw TypeError("Cannot `" + e + "` without `compiler`");
}
function sx(e, t) {
	if (t) throw Error("Cannot call `" + e + "` on a frozen processor.\nCreate a new processor first, by calling it: use `processor()` instead of `processor`.");
}
function cx(e) {
	if (!Pb(e) || typeof e.type != "string") throw TypeError("Expected node, got `" + e + "`");
}
function lx(e, t, n) {
	if (!n) throw Error("`" + e + "` finished async. Use `" + t + "` instead");
}
function ux(e) {
	return dx(e) ? e : new Zb(e);
}
function dx(e) {
	return !!(e && typeof e == "object" && "message" in e && "messages" in e);
}
function fx(e) {
	return typeof e == "string" || px(e);
}
function px(e) {
	return !!(e && typeof e == "object" && "byteLength" in e && "byteOffset" in e);
}
// node_modules/.pnpm/streamdown@1.6.11_@types+md_13d1dcdcccaec74f58050397b5bc50a5/node_modules/streamdown/dist/chunk-JAPRZBRM.js
var Q = c(), $ = (...e) => Q_(bg(e)), mx = (e, t, n) => {
	let r = typeof t == "string" ? new Blob([t], { type: n }) : t, i = URL.createObjectURL(r), a = document.createElement("a");
	a.href = i, a.download = e, document.body.appendChild(a), a.click(), document.body.removeChild(a), URL.revokeObjectURL(i);
}, hx = (0, C.createContext)({ code: "" }), gx = () => (0, C.useContext)(hx), _x = ({ onCopy: e, onError: t, timeout: n = 2e3, children: r, className: i, code: a, ...o }) => {
	let [s, c] = (0, C.useState)(!1), l = (0, C.useRef)(0), { code: u } = gx(), { isAnimating: d } = (0, C.useContext)(LS), f = a ?? u, p = async () => {
		var r;
		if (typeof window > "u" || !((r = navigator == null ? void 0 : navigator.clipboard) != null && r.writeText)) t?.(/* @__PURE__ */ Error("Clipboard API not available"));
		else try {
			s || (await navigator.clipboard.writeText(f), c(!0), e?.(), l.current = window.setTimeout(() => c(!1), n));
		} catch (e) {
			t?.(e);
		}
	};
	(0, C.useEffect)(() => () => {
		window.clearTimeout(l.current);
	}, []);
	let m = s ? ug : dg;
	return (0, Q.jsx)("button", {
		className: $("cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50", i),
		"data-streamdown": "code-block-copy-button",
		disabled: d,
		onClick: p,
		title: "Copy Code",
		type: "button",
		...o,
		children: r ?? (0, Q.jsx)(m, { size: 14 })
	});
}, vx = {
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
}, yx = ({ onDownload: e, onError: t, language: n, children: r, className: i, code: a, ...o }) => {
	let { code: s } = gx(), { isAnimating: c } = (0, C.useContext)(LS), l = a ?? s, u = `file.${n && n in vx ? vx[n] : "txt"}`;
	return (0, Q.jsx)("button", {
		className: $("cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50", i),
		"data-streamdown": "code-block-download-button",
		disabled: c,
		onClick: () => {
			try {
				mx(u, l, "text/plain"), e?.();
			} catch (e) {
				t?.(e);
			}
		},
		title: "Download file",
		type: "button",
		...o,
		children: r ?? (0, Q.jsx)(fg, { size: 14 })
	});
}, bx = () => (0, Q.jsxs)("div", {
	className: "w-full divide-y divide-border overflow-hidden rounded-xl border border-border",
	children: [(0, Q.jsx)("div", { className: "h-[46px] w-full bg-muted/80" }), (0, Q.jsx)("div", {
		className: "flex w-full items-center justify-center p-4",
		children: (0, Q.jsx)(pg, { className: "size-4 animate-spin" })
	})]
}), xx = /\.[^/.]+$/, Sx = ({ node: e, className: t, src: n, alt: r, ...i }) => {
	let a = async () => {
		if (n) try {
			let e = await (await fetch(n)).blob(), t = new URL(n, window.location.origin).pathname.split("/").pop() || "", i = t.split(".").pop(), a = t.includes(".") && i !== void 0 && i.length <= 4, o = "";
			if (a) o = t;
			else {
				let n = e.type, i = "png";
				n.includes("jpeg") || n.includes("jpg") ? i = "jpg" : n.includes("png") ? i = "png" : n.includes("svg") ? i = "svg" : n.includes("gif") ? i = "gif" : n.includes("webp") && (i = "webp"), o = `${(r || t || "image").replace(xx, "")}.${i}`;
			}
			mx(o, e, e.type);
		} catch (e) {
			console.error("Failed to download image:", e);
		}
	};
	return n ? (0, Q.jsxs)("div", {
		className: "group relative my-4 inline-block",
		"data-streamdown": "image-wrapper",
		children: [
			(0, Q.jsx)("img", {
				alt: r,
				className: $("max-w-full rounded-lg", t),
				"data-streamdown": "image",
				src: n,
				...i
			}),
			(0, Q.jsx)("div", { className: "pointer-events-none absolute inset-0 hidden rounded-lg bg-black/10 group-hover:block" }),
			(0, Q.jsx)("button", {
				className: $("absolute right-2 bottom-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border bg-background/90 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-background", "opacity-0 group-hover:opacity-100"),
				onClick: a,
				title: "Download image",
				type: "button",
				children: (0, Q.jsx)(fg, { size: 14 })
			})
		]
	}) : null;
}, Cx = async (e) => {
	let t = {
		startOnLoad: !1,
		theme: "default",
		securityLevel: "strict",
		fontFamily: "monospace",
		suppressErrorRendering: !0,
		...e
	}, n = (await import("./mermaid.core-CFS29ufk.js")).default;
	return n.initialize(t), n;
}, wx = (e, t) => new Promise((t, n) => {
	let r = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(e))), i = new Image();
	i.crossOrigin = "anonymous", i.onload = () => {
		let e = document.createElement("canvas"), r = i.width * 5, a = i.height * 5;
		e.width = r, e.height = a;
		let o = e.getContext("2d");
		o ? (o.drawImage(i, 0, 0, r, a), e.toBlob((e) => {
			e ? t(e) : n(/* @__PURE__ */ Error("Failed to create PNG blob"));
		}, "image/png")) : n(/* @__PURE__ */ Error("Failed to create 2D canvas context for PNG export"));
	}, i.onerror = () => n(/* @__PURE__ */ Error("Failed to load SVG image")), i.src = r;
}), Tx = ({ chart: e, children: t, className: n, onDownload: r, config: i, onError: a }) => {
	let [o, s] = (0, C.useState)(!1), c = (0, C.useRef)(null), { isAnimating: l } = (0, C.useContext)(LS), u = async (t) => {
		try {
			if (t === "mmd") {
				mx("diagram.mmd", e, "text/plain"), s(!1), r?.(t);
				return;
			}
			let n = await Cx(i), o = e.split("").reduce((e, t) => (e << 5) - e + t.charCodeAt(0) | 0, 0), c = `mermaid-${Math.abs(o)}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, { svg: l } = await n.render(c, e);
			if (!l) {
				a?.(/* @__PURE__ */ Error("SVG not found. Please wait for the diagram to render."));
				return;
			}
			if (t === "svg") {
				mx("diagram.svg", l, "image/svg+xml"), s(!1), r?.(t);
				return;
			}
			if (t === "png") {
				mx("diagram.png", await wx(l), "image/png"), r?.(t), s(!1);
				return;
			}
		} catch (e) {
			a?.(e);
		}
	};
	return (0, C.useEffect)(() => {
		let e = (e) => {
			c.current && !c.current.contains(e.target) && s(!1);
		};
		return document.addEventListener("mousedown", e), () => {
			document.removeEventListener("mousedown", e);
		};
	}, []), (0, Q.jsxs)("div", {
		className: "relative",
		ref: c,
		children: [(0, Q.jsx)("button", {
			className: $("cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50", n),
			disabled: l,
			onClick: () => s(!o),
			title: "Download diagram",
			type: "button",
			children: t ?? (0, Q.jsx)(fg, { size: 14 })
		}), o && (0, Q.jsxs)("div", {
			className: "absolute top-full right-0 z-10 mt-1 min-w-[120px] overflow-hidden rounded-md border border-border bg-background shadow-lg",
			children: [
				(0, Q.jsx)("button", {
					className: "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40",
					onClick: () => u("svg"),
					title: "Download diagram as SVG",
					type: "button",
					children: "SVG"
				}),
				(0, Q.jsx)("button", {
					className: "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40",
					onClick: () => u("png"),
					title: "Download diagram as PNG",
					type: "button",
					children: "PNG"
				}),
				(0, Q.jsx)("button", {
					className: "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40",
					onClick: () => u("mmd"),
					title: "Download diagram as MMD",
					type: "button",
					children: "MMD"
				})
			]
		})]
	});
}, Ex = 0, Dx = () => {
	Ex += 1, Ex === 1 && (document.body.style.overflow = "hidden");
}, Ox = () => {
	Ex = Math.max(0, Ex - 1), Ex === 0 && (document.body.style.overflow = "");
}, kx = ({ chart: e, config: t, onFullscreen: n, onExit: r, className: i, ...a }) => {
	let [o, s] = (0, C.useState)(!1), { isAnimating: c, controls: l } = (0, C.useContext)(LS), u = (() => {
		if (typeof l == "boolean") return l;
		let e = l.mermaid;
		return e === !1 ? !1 : e === !0 || e === void 0 || e.panZoom !== !1;
	})(), d = () => {
		s(!o);
	};
	return (0, C.useEffect)(() => {
		if (o) {
			Dx();
			let e = (e) => {
				e.key === "Escape" && s(!1);
			};
			return document.addEventListener("keydown", e), () => {
				document.removeEventListener("keydown", e), Ox();
			};
		}
	}, [o]), (0, C.useEffect)(() => {
		o ? n?.() : r && r();
	}, [
		o,
		n,
		r
	]), (0, Q.jsxs)(Q.Fragment, { children: [(0, Q.jsx)("button", {
		className: $("cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50", i),
		disabled: c,
		onClick: d,
		title: "View fullscreen",
		type: "button",
		...a,
		children: (0, Q.jsx)(mg, { size: 14 })
	}), o && (0, Q.jsxs)("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm",
		onClick: d,
		onKeyDown: (e) => {
			e.key === "Escape" && d();
		},
		role: "button",
		tabIndex: 0,
		children: [(0, Q.jsx)("button", {
			className: "absolute top-4 right-4 z-10 rounded-md p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground",
			onClick: d,
			title: "Exit fullscreen",
			type: "button",
			children: (0, Q.jsx)(gg, { size: 20 })
		}), (0, Q.jsx)("div", {
			className: "flex h-full w-full items-center justify-center p-4",
			onClick: (e) => e.stopPropagation(),
			onKeyDown: (e) => e.stopPropagation(),
			role: "presentation",
			children: (0, Q.jsx)(HS, {
				chart: e,
				className: "h-full w-full [&>div]:h-full [&>div]:overflow-hidden [&_svg]:h-auto [&_svg]:w-auto",
				config: t,
				fullscreen: !0,
				showControls: u
			})
		})]
	})] });
}, Ax = (e) => {
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
}, jx = (e) => {
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
}, Mx = (e) => {
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
}, Nx = (e) => {
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
}, Px = (e) => {
	let { headers: t, rows: n } = e;
	if (t.length === 0) return "";
	let r = Array(n.length + 2), i = 0, a = t.map((e) => Nx(e));
	r[i] = `| ${a.join(" | ")} |`, i += 1;
	let o = Array(t.length);
	for (let e = 0; e < t.length; e += 1) o[e] = "---";
	r[i] = `| ${o.join(" | ")} |`, i += 1;
	for (let e of n) if (e.length < t.length) {
		let n = Array(t.length);
		for (let r = 0; r < t.length; r += 1) n[r] = r < e.length ? Nx(e[r]) : "";
		r[i] = `| ${n.join(" | ")} |`, i += 1;
	} else {
		let t = e.map((e) => Nx(e));
		r[i] = `| ${t.join(" | ")} |`, i += 1;
	}
	return r.join("\n");
}, Fx = ({ children: e, className: t, onCopy: n, onError: r, timeout: i = 2e3 }) => {
	let [a, o] = (0, C.useState)(!1), [s, c] = (0, C.useState)(!1), l = (0, C.useRef)(null), u = (0, C.useRef)(0), { isAnimating: d } = (0, C.useContext)(LS), f = async (e) => {
		var t;
		if (typeof window > "u" || !((t = navigator == null ? void 0 : navigator.clipboard) != null && t.write)) r?.(/* @__PURE__ */ Error("Clipboard API not available"));
		else try {
			let t = (l.current?.closest("[data-streamdown=\"table-wrapper\"]"))?.querySelector("table");
			if (!t) {
				r?.(/* @__PURE__ */ Error("Table not found"));
				return;
			}
			let a = Ax(t), s = e === "csv" ? jx(a) : Mx(a), d = new ClipboardItem({
				"text/plain": new Blob([s], { type: "text/plain" }),
				"text/html": new Blob([t.outerHTML], { type: "text/html" })
			});
			await navigator.clipboard.write([d]), c(!0), o(!1), n?.(e), u.current = window.setTimeout(() => c(!1), i);
		} catch (e) {
			r?.(e);
		}
	};
	(0, C.useEffect)(() => {
		let e = (e) => {
			l.current && !l.current.contains(e.target) && o(!1);
		};
		return document.addEventListener("mousedown", e), () => {
			document.removeEventListener("mousedown", e), window.clearTimeout(u.current);
		};
	}, []);
	let p = s ? ug : dg;
	return (0, Q.jsxs)("div", {
		className: "relative",
		ref: l,
		children: [(0, Q.jsx)("button", {
			className: $("cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50", t),
			disabled: d,
			onClick: () => o(!a),
			title: "Copy table",
			type: "button",
			children: e ?? (0, Q.jsx)(p, { size: 14 })
		}), a && (0, Q.jsxs)("div", {
			className: "absolute top-full right-0 z-10 mt-1 min-w-[120px] overflow-hidden rounded-md border border-border bg-background shadow-lg",
			children: [(0, Q.jsx)("button", {
				className: "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40",
				onClick: () => f("csv"),
				title: "Copy table as CSV",
				type: "button",
				children: "CSV"
			}), (0, Q.jsx)("button", {
				className: "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40",
				onClick: () => f("tsv"),
				title: "Copy table as TSV",
				type: "button",
				children: "TSV"
			})]
		})]
	});
}, Ix = ({ children: e, className: t, onDownload: n, onError: r }) => {
	let [i, a] = (0, C.useState)(!1), o = (0, C.useRef)(null), { isAnimating: s } = (0, C.useContext)(LS), c = (e) => {
		try {
			let t = (o.current?.closest("[data-streamdown=\"table-wrapper\"]"))?.querySelector("table");
			if (!t) {
				r?.(/* @__PURE__ */ Error("Table not found"));
				return;
			}
			let i = Ax(t), s = e === "csv" ? jx(i) : Px(i);
			mx(`table.${e === "csv" ? "csv" : "md"}`, s, e === "csv" ? "text/csv" : "text/markdown"), a(!1), n?.(e);
		} catch (e) {
			r?.(e);
		}
	};
	return (0, C.useEffect)(() => {
		let e = (e) => {
			o.current && !o.current.contains(e.target) && a(!1);
		};
		return document.addEventListener("mousedown", e), () => {
			document.removeEventListener("mousedown", e);
		};
	}, []), (0, Q.jsxs)("div", {
		className: "relative",
		ref: o,
		children: [(0, Q.jsx)("button", {
			className: $("cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50", t),
			disabled: s,
			onClick: () => a(!i),
			title: "Download table",
			type: "button",
			children: e ?? (0, Q.jsx)(fg, { size: 14 })
		}), i && (0, Q.jsxs)("div", {
			className: "absolute top-full right-0 z-10 mt-1 min-w-[120px] overflow-hidden rounded-md border border-border bg-background shadow-lg",
			children: [(0, Q.jsx)("button", {
				className: "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40",
				onClick: () => c("csv"),
				title: "Download table as CSV",
				type: "button",
				children: "CSV"
			}), (0, Q.jsx)("button", {
				className: "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40",
				onClick: () => c("markdown"),
				title: "Download table as Markdown",
				type: "button",
				children: "Markdown"
			})]
		})]
	});
}, Lx = ({ children: e, className: t, showControls: n, ...r }) => (0, Q.jsxs)("div", {
	className: "my-4 flex flex-col space-y-2",
	"data-streamdown": "table-wrapper",
	children: [n && (0, Q.jsxs)("div", {
		className: "flex items-center justify-end gap-1",
		children: [(0, Q.jsx)(Fx, {}), (0, Q.jsx)(Ix, {})]
	}), (0, Q.jsx)("div", {
		className: "overflow-x-auto",
		children: (0, Q.jsx)("table", {
			className: $("w-full border-collapse border border-border", t),
			"data-streamdown": "table",
			...r,
			children: e
		})
	})]
}), Rx = (0, C.lazy)(() => import("./code-block-IT6T5CEO-C23rlzhJ.js").then((e) => ({ default: e.CodeBlock }))), zx = (0, C.lazy)(() => import("./mermaid-VLURNSYL-BTeW9n-V.js").then((e) => ({ default: e.Mermaid }))), Bx = /language-([^\s]+)/;
function Vx(e, t) {
	if (!(e != null && e.position || t != null && t.position)) return !0;
	if (!(e != null && e.position && t != null && t.position)) return !1;
	let n = e.position.start, r = t.position.start, i = e.position.end, a = t.position.end;
	return n?.line === r?.line && n?.column === r?.column && i?.line === a?.line && i?.column === a?.column;
}
function Hx(e, t) {
	return e.className === t.className && Vx(e.node, t.node);
}
var Ux = (e, t) => typeof e == "boolean" ? e : e[t] !== !1, Wx = (e, t) => {
	if (typeof e == "boolean") return e;
	let n = e.mermaid;
	return n === !1 ? !1 : n === !0 || n === void 0 || n[t] !== !1;
}, Gx = (0, C.memo)(({ children: e, className: t, node: n, ...r }) => (0, Q.jsx)("ol", {
	className: $("list-inside list-decimal whitespace-normal", t),
	"data-streamdown": "ordered-list",
	...r,
	children: e
}), (e, t) => Hx(e, t));
Gx.displayName = "MarkdownOl";
var Kx = (0, C.memo)(({ children: e, className: t, node: n, ...r }) => (0, Q.jsx)("li", {
	className: $("py-1 [&>p]:inline", t),
	"data-streamdown": "list-item",
	...r,
	children: e
}), (e, t) => e.className === t.className && Vx(e.node, t.node));
Kx.displayName = "MarkdownLi";
var qx = (0, C.memo)(({ children: e, className: t, node: n, ...r }) => (0, Q.jsx)("ul", {
	className: $("list-inside list-disc whitespace-normal", t),
	"data-streamdown": "unordered-list",
	...r,
	children: e
}), (e, t) => Hx(e, t));
qx.displayName = "MarkdownUl";
var Jx = (0, C.memo)(({ className: e, node: t, ...n }) => (0, Q.jsx)("hr", {
	className: $("my-6 border-border", e),
	"data-streamdown": "horizontal-rule",
	...n
}), (e, t) => Hx(e, t));
Jx.displayName = "MarkdownHr";
var Yx = (0, C.memo)(({ children: e, className: t, node: n, ...r }) => (0, Q.jsx)("span", {
	className: $("font-semibold", t),
	"data-streamdown": "strong",
	...r,
	children: e
}), (e, t) => Hx(e, t));
Yx.displayName = "MarkdownStrong";
var Xx = (0, C.memo)(({ children: e, className: t, href: n, node: r, ...i }) => {
	let a = n === "streamdown:incomplete-link";
	return (0, Q.jsx)("a", {
		className: $("wrap-anywhere font-medium text-primary underline", t),
		"data-incomplete": a,
		"data-streamdown": "link",
		href: n,
		rel: "noreferrer",
		target: "_blank",
		...i,
		children: e
	});
}, (e, t) => Hx(e, t) && e.href === t.href);
Xx.displayName = "MarkdownA";
var Zx = (0, C.memo)(({ children: e, className: t, node: n, ...r }) => (0, Q.jsx)("h1", {
	className: $("mt-6 mb-2 font-semibold text-3xl", t),
	"data-streamdown": "heading-1",
	...r,
	children: e
}), (e, t) => Hx(e, t));
Zx.displayName = "MarkdownH1";
var Qx = (0, C.memo)(({ children: e, className: t, node: n, ...r }) => (0, Q.jsx)("h2", {
	className: $("mt-6 mb-2 font-semibold text-2xl", t),
	"data-streamdown": "heading-2",
	...r,
	children: e
}), (e, t) => Hx(e, t));
Qx.displayName = "MarkdownH2";
var $x = (0, C.memo)(({ children: e, className: t, node: n, ...r }) => (0, Q.jsx)("h3", {
	className: $("mt-6 mb-2 font-semibold text-xl", t),
	"data-streamdown": "heading-3",
	...r,
	children: e
}), (e, t) => Hx(e, t));
$x.displayName = "MarkdownH3";
var eS = (0, C.memo)(({ children: e, className: t, node: n, ...r }) => (0, Q.jsx)("h4", {
	className: $("mt-6 mb-2 font-semibold text-lg", t),
	"data-streamdown": "heading-4",
	...r,
	children: e
}), (e, t) => Hx(e, t));
eS.displayName = "MarkdownH4";
var tS = (0, C.memo)(({ children: e, className: t, node: n, ...r }) => (0, Q.jsx)("h5", {
	className: $("mt-6 mb-2 font-semibold text-base", t),
	"data-streamdown": "heading-5",
	...r,
	children: e
}), (e, t) => Hx(e, t));
tS.displayName = "MarkdownH5";
var nS = (0, C.memo)(({ children: e, className: t, node: n, ...r }) => (0, Q.jsx)("h6", {
	className: $("mt-6 mb-2 font-semibold text-sm", t),
	"data-streamdown": "heading-6",
	...r,
	children: e
}), (e, t) => Hx(e, t));
nS.displayName = "MarkdownH6";
var rS = (0, C.memo)(({ children: e, className: t, node: n, ...r }) => {
	let { controls: i } = (0, C.useContext)(LS), a = Ux(i, "table");
	return (0, Q.jsx)(Lx, {
		className: t,
		"data-streamdown": "table-wrapper",
		showControls: a,
		...r,
		children: e
	});
}, (e, t) => Hx(e, t));
rS.displayName = "MarkdownTable";
var iS = (0, C.memo)(({ children: e, className: t, node: n, ...r }) => (0, Q.jsx)("thead", {
	className: $("bg-muted/80", t),
	"data-streamdown": "table-header",
	...r,
	children: e
}), (e, t) => Hx(e, t));
iS.displayName = "MarkdownThead";
var aS = (0, C.memo)(({ children: e, className: t, node: n, ...r }) => (0, Q.jsx)("tbody", {
	className: $("divide-y divide-border bg-muted/40", t),
	"data-streamdown": "table-body",
	...r,
	children: e
}), (e, t) => Hx(e, t));
aS.displayName = "MarkdownTbody";
var oS = (0, C.memo)(({ children: e, className: t, node: n, ...r }) => (0, Q.jsx)("tr", {
	className: $("border-border border-b", t),
	"data-streamdown": "table-row",
	...r,
	children: e
}), (e, t) => Hx(e, t));
oS.displayName = "MarkdownTr";
var sS = (0, C.memo)(({ children: e, className: t, node: n, ...r }) => (0, Q.jsx)("th", {
	className: $("whitespace-nowrap px-4 py-2 text-left font-semibold text-sm", t),
	"data-streamdown": "table-header-cell",
	...r,
	children: e
}), (e, t) => Hx(e, t));
sS.displayName = "MarkdownTh";
var cS = (0, C.memo)(({ children: e, className: t, node: n, ...r }) => (0, Q.jsx)("td", {
	className: $("px-4 py-2 text-sm", t),
	"data-streamdown": "table-cell",
	...r,
	children: e
}), (e, t) => Hx(e, t));
cS.displayName = "MarkdownTd";
var lS = (0, C.memo)(({ children: e, className: t, node: n, ...r }) => (0, Q.jsx)("blockquote", {
	className: $("my-4 border-muted-foreground/30 border-l-4 pl-4 text-muted-foreground italic", t),
	"data-streamdown": "blockquote",
	...r,
	children: e
}), (e, t) => Hx(e, t));
lS.displayName = "MarkdownBlockquote";
var uS = (0, C.memo)(({ children: e, className: t, node: n, ...r }) => (0, Q.jsx)("sup", {
	className: $("text-sm", t),
	"data-streamdown": "superscript",
	...r,
	children: e
}), (e, t) => Hx(e, t));
uS.displayName = "MarkdownSup";
var dS = (0, C.memo)(({ children: e, className: t, node: n, ...r }) => (0, Q.jsx)("sub", {
	className: $("text-sm", t),
	"data-streamdown": "subscript",
	...r,
	children: e
}), (e, t) => Hx(e, t));
dS.displayName = "MarkdownSub";
var fS = (0, C.memo)(({ children: e, className: t, node: n, ...r }) => {
	if ("data-footnotes" in r) {
		let n = (e) => {
			if (!(0, C.isValidElement)(e)) return !1;
			let t = Array.isArray(e.props.children) ? e.props.children : [e.props.children], n = !1, r = !1;
			for (let e of t) if (e) {
				if (typeof e == "string") e.trim() !== "" && (n = !0);
				else if ((0, C.isValidElement)(e)) {
					if (e.props?.["data-footnote-backref"] !== void 0) r = !0;
					else {
						let t = Array.isArray(e.props.children) ? e.props.children : [e.props.children];
						for (let e of t) if (typeof e == "string" && e.trim() !== "" || (0, C.isValidElement)(e) && e.props?.["data-footnote-backref"] === void 0) {
							n = !0;
							break;
						}
					}
				}
			}
			return r && !n;
		}, i = Array.isArray(e) ? e.map((e) => {
			if (!(0, C.isValidElement)(e)) return e;
			if (e.type === Gx) {
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
		return (Array.isArray(i) ? i.some((e) => e !== null) : i !== null) ? (0, Q.jsx)("section", {
			className: t,
			...r,
			children: i
		}) : null;
	}
	return (0, Q.jsx)("section", {
		className: t,
		...r,
		children: e
	});
}, (e, t) => Hx(e, t));
fS.displayName = "MarkdownSection";
var pS = (0, C.memo)(({ node: e, className: t, children: n, ...r }) => {
	let i = (e?.position)?.start.line === (e?.position)?.end.line, { mermaid: a, controls: o } = (0, C.useContext)(LS);
	if (i) return (0, Q.jsx)("code", {
		className: $("rounded bg-muted px-1.5 py-0.5 font-mono text-sm", t),
		"data-streamdown": "inline-code",
		...r,
		children: n
	});
	let s = (t?.match(Bx))?.at(1) ?? "", c = "";
	if ((0, C.isValidElement)(n) && n.props && typeof n.props == "object" && "children" in n.props && typeof n.props.children == "string" ? c = n.props.children : typeof n == "string" && (c = n), s === "mermaid") {
		let e = Ux(o, "mermaid"), n = Wx(o, "download"), r = Wx(o, "copy"), i = Wx(o, "fullscreen"), s = Wx(o, "panZoom");
		return (0, Q.jsx)(C.Suspense, {
			fallback: (0, Q.jsx)(bx, {}),
			children: (0, Q.jsxs)("div", {
				className: $("group relative my-4 h-auto rounded-xl border p-4", t),
				"data-streamdown": "mermaid-block",
				children: [e && (n || r || i) && (0, Q.jsxs)("div", {
					className: "flex items-center justify-end gap-2",
					children: [
						n && (0, Q.jsx)(Tx, {
							chart: c,
							config: a?.config
						}),
						r && (0, Q.jsx)(_x, { code: c }),
						i && (0, Q.jsx)(kx, {
							chart: c,
							config: a?.config
						})
					]
				}), (0, Q.jsx)(zx, {
					chart: c,
					config: a?.config,
					showControls: s
				})]
			})
		});
	}
	let l = Ux(o, "code");
	return (0, Q.jsx)(C.Suspense, {
		fallback: (0, Q.jsx)(bx, {}),
		children: (0, Q.jsx)(Rx, {
			className: $("overflow-x-auto border-border border-t", t),
			code: c,
			language: s,
			children: l && (0, Q.jsxs)(Q.Fragment, { children: [(0, Q.jsx)(yx, {
				code: c,
				language: s
			}), (0, Q.jsx)(_x, {})] })
		})
	});
}, (e, t) => e.className === t.className && Vx(e.node, t.node));
pS.displayName = "MarkdownCode";
var mS = (0, C.memo)(Sx, (e, t) => e.className === t.className && Vx(e.node, t.node));
mS.displayName = "MarkdownImg";
var hS = (0, C.memo)(({ children: e, className: t, node: n, ...r }) => {
	let i = (Array.isArray(e) ? e : [e]).filter((e) => e != null && e !== "");
	return i.length === 1 && (0, C.isValidElement)(i[0]) && i[0].props.node?.tagName === "img" ? (0, Q.jsx)(Q.Fragment, { children: e }) : (0, Q.jsx)("p", {
		className: t,
		...r,
		children: e
	});
}, (e, t) => Hx(e, t));
hS.displayName = "MarkdownParagraph";
var gS = {
	ol: Gx,
	li: Kx,
	ul: qx,
	hr: Jx,
	strong: Yx,
	a: Xx,
	h1: Zx,
	h2: Qx,
	h3: $x,
	h4: eS,
	h5: tS,
	h6: nS,
	table: rS,
	thead: iS,
	tbody: aS,
	tr: oS,
	th: sS,
	td: cS,
	blockquote: lS,
	code: pS,
	img: mS,
	pre: ({ children: e }) => e,
	sup: uS,
	sub: dS,
	p: hS,
	section: fS
}, _S = [], vS = { allowDangerousHtml: !0 }, yS = /* @__PURE__ */ new WeakMap(), bS = new class {
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
						let n = yS.get(e);
						n || (n = e.name, yS.set(e, n)), t += n;
					} else t += String(e);
					t += ":", t += JSON.stringify(n);
				} else if (typeof r == "function") {
					let e = yS.get(r);
					e || (e = r.name, yS.set(r, e)), t += e;
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
}(), xS = (e) => {
	let t = SS(e), n = e.children || "";
	return wS(t.runSync(t.parse(n), n), e);
}, SS = (e) => {
	let t = bS.get(e);
	if (t) return t;
	let n = CS(e);
	return bS.set(e, n), n;
}, CS = (e) => {
	let t = e.rehypePlugins || _S, n = e.remarkPlugins || _S, r = e.remarkRehypeOptions ? {
		...vS,
		...e.remarkRehypeOptions
	} : vS;
	return ix().use(By).use(n).use(jb, r).use(t);
}, wS = (e, t) => Nv(e, {
	Fragment: Q.Fragment,
	components: t.components,
	ignoreInvalidStyle: !0,
	jsx: Q.jsx,
	jsxs: Q.jsxs,
	passKeys: !0,
	passNode: !0
}), TS = /\[\^[^\]\s]{1,200}\](?!:)/, ES = /\[\^[^\]\s]{1,200}\]:/, DS = /<\/(\w+)>/, OS = /<(\w+)[\s>]/, kS = (e) => {
	let t = 0;
	for (; t < e.length && (e[t] === " " || e[t] === "	" || e[t] === "\n" || e[t] === "\r");) t += 1;
	return t + 1 < e.length && e[t] === "$" && e[t + 1] === "$";
}, AS = (e) => {
	let t = e.length - 1;
	for (; t >= 0 && (e[t] === " " || e[t] === "	" || e[t] === "\n" || e[t] === "\r");) --t;
	return t >= 1 && e[t] === "$" && e[t - 1] === "$";
}, jS = (e) => {
	let t = 0;
	for (let n = 0; n < e.length - 1; n += 1) e[n] === "$" && e[n + 1] === "$" && (t += 1, n += 1);
	return t;
}, MS = (e) => {
	let t = TS.test(e), n = ES.test(e);
	if (t || n) return [e];
	let r = i.lex(e, { gfm: !0 }), a = [], o = [];
	for (let e of r) {
		let t = e.raw, n = a.length;
		if (o.length > 0) {
			if (a[n - 1] += t, e.type === "html") {
				let e = t.match(DS);
				if (e) {
					let t = e[1];
					o.at(-1) === t && o.pop();
				}
			}
		} else {
			if (e.type === "html" && e.block) {
				let e = t.match(OS);
				if (e) {
					let n = e[1];
					t.includes(`</${n}>`) || o.push(n);
				}
			}
			if (t.trim() === "$$" && n > 0) {
				let e = a[n - 1], r = kS(e), i = jS(e);
				if (r && i % 2 == 1) {
					a[n - 1] = e + t;
					continue;
				}
			}
			if (n > 0 && AS(t)) {
				let e = a[n - 1], r = kS(e), i = jS(e), o = jS(t);
				if (r && i % 2 == 1 && !kS(t) && o === 1) {
					a[n - 1] = e + t;
					continue;
				}
			}
			a.push(t);
		}
	}
	return a;
}, NS = {
	raw: Ks,
	katex: [Pt, { errorColor: "var(--color-muted-foreground)" }],
	sanitize: [dc, {}],
	harden: [T, {
		allowedImagePrefixes: ["*"],
		allowedLinkPrefixes: ["*"],
		allowedProtocols: ["*"],
		defaultOrigin: void 0,
		allowDataImages: !0
	}]
}, PS = {
	gfm: [$m, {}],
	math: [dh, { singleDollarTextMath: !1 }],
	cjkFriendly: [wl, {}],
	cjkFriendlyGfmStrikethrough: [El, {}]
}, FS = Object.values(NS), IS = Object.values(PS), LS = (0, C.createContext)({
	shikiTheme: ["github-light", "github-dark"],
	controls: !0,
	isAnimating: !1,
	mode: "streaming",
	mermaid: void 0
}), RS = (0, C.memo)(({ content: e, shouldParseIncompleteMarkdown: t, ...n }) => {
	let r = (0, C.useMemo)(() => typeof e == "string" && t ? tg(e.trim()) : e, [e, t]);
	return (0, Q.jsx)(xS, {
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
RS.displayName = "Block";
var zS = ["github-light", "github-dark"], BS = (0, C.memo)(({ children: e, mode: t = "streaming", parseIncompleteMarkdown: n = !0, components: r, rehypePlugins: i = FS, remarkPlugins: a = IS, className: o, shikiTheme: s = zS, mermaid: c, controls: l = !0, isAnimating: u = !1, BlockComponent: d = RS, parseMarkdownIntoBlocksFn: f = MS, ...p }) => {
	let m = (0, C.useId)(), [h, g] = (0, C.useTransition)(), [_, v] = (0, C.useState)([]), y = (0, C.useMemo)(() => f(typeof e == "string" ? e : ""), [e, f]);
	(0, C.useEffect)(() => {
		t === "streaming" ? g(() => {
			v(y);
		}) : v(y);
	}, [y, t]);
	let b = t === "streaming" ? _ : y, x = (0, C.useMemo)(() => b.map((e, t) => `${m}-${t}`), [b.length, m]), ee = (0, C.useMemo)(() => ({
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
	]), S = (0, C.useMemo)(() => ({
		...gS,
		...r
	}), [r]);
	return (0, C.useEffect)(() => {
		if (!(Array.isArray(i) && i.some((e) => Array.isArray(e) ? e[0] === Pt : e === Pt))) return;
		let t = !1;
		if (Array.isArray(a)) {
			let e = a.find((e) => Array.isArray(e) ? e[0] === dh : e === dh);
			e && Array.isArray(e) && e[1] && (t = e[1].singleDollarTextMath === !0);
		}
		let n = typeof e == "string" ? e : "", r = n.includes("$$"), o = t && (/[^$]\$[^$]/.test(n) || /^\$[^$]/.test(n) || /[^$]\$$/.test(n));
		(r || o) && Promise.resolve({          });
	}, [
		i,
		a,
		e
	]), t === "static" ? (0, Q.jsx)(LS.Provider, {
		value: ee,
		children: (0, Q.jsx)("div", {
			className: $("space-y-4 whitespace-normal", o),
			children: (0, Q.jsx)(xS, {
				components: S,
				rehypePlugins: i,
				remarkPlugins: a,
				...p,
				children: e
			})
		})
	}) : (0, Q.jsx)(LS.Provider, {
		value: ee,
		children: (0, Q.jsx)("div", {
			className: $("space-y-4 whitespace-normal", o),
			children: b.map((e, t) => (0, Q.jsx)(d, {
				components: S,
				content: e,
				index: t,
				rehypePlugins: i,
				remarkPlugins: a,
				shouldParseIncompleteMarkdown: n,
				...p
			}, x[t]))
		})
	});
}, (e, t) => e.children === t.children && e.shikiTheme === t.shikiTheme && e.isAnimating === t.isAnimating && e.mode === t.mode);
BS.displayName = "Streamdown";
var VS = ({ children: e, className: t, minZoom: n = .5, maxZoom: r = 3, zoomStep: i = .1, showControls: a = !0, initialZoom: o = 1, fullscreen: s = !1 }) => {
	let c = (0, C.useRef)(null), l = (0, C.useRef)(null), [u, d] = (0, C.useState)(o), [f, p] = (0, C.useState)({
		x: 0,
		y: 0
	}), [m, h] = (0, C.useState)(!1), [g, _] = (0, C.useState)({
		x: 0,
		y: 0
	}), [v, y] = (0, C.useState)({
		x: 0,
		y: 0
	}), b = (0, C.useCallback)((e) => {
		d((t) => Math.max(n, Math.min(r, t + e)));
	}, [n, r]), x = (0, C.useCallback)(() => {
		b(i);
	}, [b, i]), ee = (0, C.useCallback)(() => {
		b(-i);
	}, [b, i]), S = (0, C.useCallback)(() => {
		d(o), p({
			x: 0,
			y: 0
		});
	}, [o]), w = (0, C.useCallback)((e) => {
		e.preventDefault();
		let t = e.deltaY > 0 ? -i : i;
		b(t);
	}, [b, i]), T = (0, C.useCallback)((e) => {
		if (e.button !== 0 || e.isPrimary === !1) return;
		h(!0), _({
			x: e.clientX,
			y: e.clientY
		}), y(f);
		let t = e.currentTarget;
		t instanceof HTMLElement && t.setPointerCapture(e.pointerId);
	}, [f]), E = (0, C.useCallback)((e) => {
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
	]), D = (0, C.useCallback)((e) => {
		h(!1);
		let t = e.currentTarget;
		t instanceof HTMLElement && t.releasePointerCapture(e.pointerId);
	}, []);
	return (0, C.useEffect)(() => {
		let e = c.current;
		if (e) return e.addEventListener("wheel", w, { passive: !1 }), () => {
			e.removeEventListener("wheel", w);
		};
	}, [w]), (0, C.useEffect)(() => {
		let e = l.current;
		if (e && m) return document.body.style.userSelect = "none", e.addEventListener("pointermove", E, { passive: !1 }), e.addEventListener("pointerup", D), e.addEventListener("pointercancel", D), () => {
			document.body.style.userSelect = "", e.removeEventListener("pointermove", E), e.removeEventListener("pointerup", D), e.removeEventListener("pointercancel", D);
		};
	}, [
		m,
		E,
		D
	]), (0, Q.jsxs)("div", {
		className: $("relative", s ? "h-full w-full" : "w-full", t),
		ref: c,
		style: { cursor: m ? "grabbing" : "grab" },
		children: [a && (0, Q.jsxs)("div", {
			className: $("absolute z-10 flex flex-col gap-1 rounded-md border border-border bg-background/90 p-1 shadow-sm backdrop-blur-sm", s ? "bottom-4 left-4" : "bottom-2 left-2"),
			children: [
				(0, Q.jsx)("button", {
					className: "flex items-center justify-center rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
					disabled: u >= r,
					onClick: x,
					title: "Zoom in",
					type: "button",
					children: (0, Q.jsx)(_g, { size: 16 })
				}),
				(0, Q.jsx)("button", {
					className: "flex items-center justify-center rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
					disabled: u <= n,
					onClick: ee,
					title: "Zoom out",
					type: "button",
					children: (0, Q.jsx)(vg, { size: 16 })
				}),
				(0, Q.jsx)("button", {
					className: "flex items-center justify-center rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
					onClick: S,
					title: "Reset zoom and pan",
					type: "button",
					children: (0, Q.jsx)(hg, { size: 16 })
				})
			]
		}), (0, Q.jsx)("div", {
			className: $("origin-center transition-transform duration-150 ease-out", s && "flex w-full items-center justify-center"),
			onPointerDown: T,
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
}, HS = ({ chart: e, className: t, config: n, fullscreen: r = !1, showControls: i = !0 }) => {
	let [a, o] = (0, C.useState)(null), [s, c] = (0, C.useState)(!0), [l, u] = (0, C.useState)(""), [d, f] = (0, C.useState)(""), [p, m] = (0, C.useState)(0), { mermaid: h } = (0, C.useContext)(LS), g = h?.errorComponent;
	if ((0, C.useEffect)(() => {
		(async () => {
			try {
				o(null), c(!0);
				let t = await Cx(n), r = e.split("").reduce((e, t) => (e << 5) - e + t.charCodeAt(0) | 0, 0), i = `mermaid-${Math.abs(r)}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, { svg: a } = await t.render(i, e);
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
	]), s && !l && !d) return (0, Q.jsx)("div", {
		className: $("my-4 flex justify-center p-4", t),
		children: (0, Q.jsxs)("div", {
			className: "flex items-center space-x-2 text-muted-foreground",
			children: [(0, Q.jsx)("div", { className: "h-4 w-4 animate-spin rounded-full border-current border-b-2" }), (0, Q.jsx)("span", {
				className: "text-sm",
				children: "Loading diagram..."
			})]
		})
	});
	if (a && !l && !d) return g ? (0, Q.jsx)(g, {
		chart: e,
		error: a,
		retry: () => m((e) => e + 1)
	}) : (0, Q.jsxs)("div", {
		className: $("rounded-lg border border-red-200 bg-red-50 p-4", t),
		children: [(0, Q.jsxs)("p", {
			className: "font-mono text-red-700 text-sm",
			children: ["Mermaid Error: ", a]
		}), (0, Q.jsxs)("details", {
			className: "mt-2",
			children: [(0, Q.jsx)("summary", {
				className: "cursor-pointer text-red-600 text-xs",
				children: "Show Code"
			}), (0, Q.jsx)("pre", {
				className: "mt-2 overflow-x-auto rounded bg-red-100 p-2 text-red-800 text-xs",
				children: e
			})]
		})]
	});
	let _ = l || d;
	return (0, Q.jsx)(VS, {
		className: $(r ? "h-full w-full overflow-hidden" : "my-4 overflow-hidden", t),
		fullscreen: r,
		maxZoom: 3,
		minZoom: .5,
		showControls: i,
		zoomStep: .1,
		children: (0, Q.jsx)("div", {
			"aria-label": "Mermaid chart",
			className: $("flex justify-center", r && "h-full w-full items-center"),
			dangerouslySetInnerHTML: { __html: _ },
			role: "img"
		})
	});
};
export { Me as _, $ as a, Q_ as c, Sn as d, cn as f, Ie as g, Fe as h, BS as i, bg as l, Re as m, hx as n, iv as o, He as p, HS as r, Z_ as s, LS as t, Dl as u, c as v, o as y };
