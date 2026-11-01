import { i as e, n as t } from "./rolldown-runtime-CwxnZyOB.js";
import { a as n, d as r, f as i, h as a, l as o, m as s, n as c, p as l, t as u, u as d } from "./chunk-JAPRZBRM-CJMvR5Wo.js";
// node_modules/@shikijs/types/dist/index.mjs
var f = class extends Error {
	constructor(e) {
		super(e), this.name = "ShikiError";
	}
};
// node_modules/@shikijs/vscode-textmate/dist/index.js
function p(e) {
	return m(e);
}
function m(e) {
	return Array.isArray(e) ? h(e) : e instanceof RegExp ? e : typeof e == "object" ? g(e) : e;
}
function h(e) {
	let t = [];
	for (let n = 0, r = e.length; n < r; n++) t[n] = m(e[n]);
	return t;
}
function g(e) {
	let t = {};
	for (let n in e) t[n] = m(e[n]);
	return t;
}
function _(e, ...t) {
	return t.forEach((t) => {
		for (let n in t) e[n] = t[n];
	}), e;
}
function ee(e) {
	let t = ~e.lastIndexOf("/") || ~e.lastIndexOf("\\");
	return t === 0 ? e : ~t === e.length - 1 ? ee(e.substring(0, e.length - 1)) : e.substr(~t + 1);
}
var te = /\$(\d+)|\${(\d+):\/(downcase|upcase)}/g, ne = class {
	static hasCaptures(e) {
		return e !== null && (te.lastIndex = 0, te.test(e));
	}
	static replaceCaptures(e, t, n) {
		return e.replace(te, (e, r, i, a) => {
			let o = n[parseInt(r || i, 10)];
			if (o) {
				let e = t.substring(o.start, o.end);
				for (; e[0] === ".";) e = e.substring(1);
				switch (a) {
					case "downcase": return e.toLowerCase();
					case "upcase": return e.toUpperCase();
					default: return e;
				}
			} else return e;
		});
	}
};
function re(e, t) {
	return e < t ? -1 : +(e > t);
}
function ie(e, t) {
	if (e === null && t === null) return 0;
	if (!e) return -1;
	if (!t) return 1;
	let n = e.length, r = t.length;
	if (n === r) {
		for (let r = 0; r < n; r++) {
			let n = re(e[r], t[r]);
			if (n !== 0) return n;
		}
		return 0;
	}
	return n - r;
}
function ae(e) {
	return !!(/^#[0-9a-f]{6}$/i.test(e) || /^#[0-9a-f]{8}$/i.test(e) || /^#[0-9a-f]{3}$/i.test(e) || /^#[0-9a-f]{4}$/i.test(e));
}
function oe(e) {
	return e.replace(/[\-\\\{\}\*\+\?\|\^\$\.\,\[\]\(\)\#\s]/g, "\\$&");
}
var se = class {
	constructor(e) {
		this.fn = e;
	}
	fn;
	cache = /* @__PURE__ */ new Map();
	get(e) {
		if (this.cache.has(e)) return this.cache.get(e);
		let t = this.fn(e);
		return this.cache.set(e, t), t;
	}
}, ce = class {
	constructor(e, t, n) {
		this._colorMap = e, this._defaults = t, this._root = n;
	}
	_colorMap;
	_defaults;
	_root;
	static createFromRawTheme(e, t) {
		return this.createFromParsedTheme(pe(e), t);
	}
	static createFromParsedTheme(e, t) {
		return he(e, t);
	}
	_cachedMatchRoot = new se((e) => this._root.match(e));
	getColorMap() {
		return this._colorMap.getColorMap();
	}
	getDefaults() {
		return this._defaults;
	}
	match(e) {
		if (e === null) return this._defaults;
		let t = e.scopeName, n = this._cachedMatchRoot.get(t).find((t) => ue(e.parent, t.parentScopes));
		return n ? new fe(n.fontStyle, n.foreground, n.background) : null;
	}
}, le = class e {
	constructor(e, t) {
		this.parent = e, this.scopeName = t;
	}
	parent;
	scopeName;
	static push(t, n) {
		for (let r of n) t = new e(t, r);
		return t;
	}
	static from(...t) {
		let n = null;
		for (let r = 0; r < t.length; r++) n = new e(n, t[r]);
		return n;
	}
	push(t) {
		return new e(this, t);
	}
	getSegments() {
		let e = this, t = [];
		for (; e;) t.push(e.scopeName), e = e.parent;
		return t.reverse(), t;
	}
	toString() {
		return this.getSegments().join(" ");
	}
	extends(e) {
		return this === e || this.parent !== null && this.parent.extends(e);
	}
	getExtensionIfDefined(e) {
		let t = [], n = this;
		for (; n && n !== e;) t.push(n.scopeName), n = n.parent;
		return n === e ? t.reverse() : void 0;
	}
};
function ue(e, t) {
	if (t.length === 0) return !0;
	for (let n = 0; n < t.length; n++) {
		let r = t[n], i = !1;
		if (r === ">") {
			if (n === t.length - 1) return !1;
			r = t[++n], i = !0;
		}
		for (; e && !de(e.scopeName, r);) {
			if (i) return !1;
			e = e.parent;
		}
		if (!e) return !1;
		e = e.parent;
	}
	return !0;
}
function de(e, t) {
	return t === e || e.startsWith(t) && e[t.length] === ".";
}
var fe = class {
	constructor(e, t, n) {
		this.fontStyle = e, this.foregroundId = t, this.backgroundId = n;
	}
	fontStyle;
	foregroundId;
	backgroundId;
};
function pe(e) {
	if (!e || !e.settings || !Array.isArray(e.settings)) return [];
	let t = e.settings, n = [], r = 0;
	for (let e = 0, i = t.length; e < i; e++) {
		let i = t[e];
		if (!i.settings) continue;
		let a;
		if (typeof i.scope == "string") {
			let e = i.scope;
			e = e.replace(/^[,]+/, ""), e = e.replace(/[,]+$/, ""), a = e.split(",");
		} else a = Array.isArray(i.scope) ? i.scope : [""];
		let o = -1;
		if (typeof i.settings.fontStyle == "string") {
			o = 0;
			let e = i.settings.fontStyle.split(" ");
			for (let t = 0, n = e.length; t < n; t++) switch (e[t]) {
				case "italic":
					o |= 1;
					break;
				case "bold":
					o |= 2;
					break;
				case "underline":
					o |= 4;
					break;
				case "strikethrough": o |= 8;
			}
		}
		let s = null;
		typeof i.settings.foreground == "string" && ae(i.settings.foreground) && (s = i.settings.foreground);
		let c = null;
		typeof i.settings.background == "string" && ae(i.settings.background) && (c = i.settings.background);
		for (let t = 0, i = a.length; t < i; t++) {
			let i = a[t].trim().split(" "), l = i[i.length - 1], u = null;
			i.length > 1 && (u = i.slice(0, i.length - 1), u.reverse()), n[r++] = new me(l, u, e, o, s, c);
		}
	}
	return n;
}
var me = class {
	constructor(e, t, n, r, i, a) {
		this.scope = e, this.parentScopes = t, this.index = n, this.fontStyle = r, this.foreground = i, this.background = a;
	}
	scope;
	parentScopes;
	index;
	fontStyle;
	foreground;
	background;
}, v = /* @__PURE__ */ ((e) => (e[e.NotSet = -1] = "NotSet", e[e.None = 0] = "None", e[e.Italic = 1] = "Italic", e[e.Bold = 2] = "Bold", e[e.Underline = 4] = "Underline", e[e.Strikethrough = 8] = "Strikethrough", e))(v || {});
function he(e, t) {
	e.sort((e, t) => {
		let n = re(e.scope, t.scope);
		return n !== 0 || (n = ie(e.parentScopes, t.parentScopes), n !== 0) ? n : e.index - t.index;
	});
	let n = 0, r = "#000000", i = "#ffffff";
	for (; e.length >= 1 && e[0].scope === "";) {
		let t = e.shift();
		t.fontStyle !== -1 && (n = t.fontStyle), t.foreground !== null && (r = t.foreground), t.background !== null && (i = t.background);
	}
	let a = new ge(t), o = new fe(n, a.getId(r), a.getId(i)), s = new ye(new ve(0, null, -1, 0, 0), []);
	for (let t = 0, n = e.length; t < n; t++) {
		let n = e[t];
		s.insert(0, n.scope, n.parentScopes, n.fontStyle, a.getId(n.foreground), a.getId(n.background));
	}
	return new ce(a, o, s);
}
var ge = class {
	_isFrozen;
	_lastColorId;
	_id2color;
	_color2id;
	constructor(e) {
		if (this._lastColorId = 0, this._id2color = [], this._color2id = /* @__PURE__ */ Object.create(null), Array.isArray(e)) {
			this._isFrozen = !0;
			for (let t = 0, n = e.length; t < n; t++) this._color2id[e[t]] = t, this._id2color[t] = e[t];
		} else this._isFrozen = !1;
	}
	getId(e) {
		if (e === null) return 0;
		e = e.toUpperCase();
		let t = this._color2id[e];
		if (t) return t;
		if (this._isFrozen) throw Error(`Missing color in color map - ${e}`);
		return t = ++this._lastColorId, this._color2id[e] = t, this._id2color[t] = e, t;
	}
	getColorMap() {
		return this._id2color.slice(0);
	}
}, _e = Object.freeze([]), ve = class e {
	scopeDepth;
	parentScopes;
	fontStyle;
	foreground;
	background;
	constructor(e, t, n, r, i) {
		this.scopeDepth = e, this.parentScopes = t || _e, this.fontStyle = n, this.foreground = r, this.background = i;
	}
	clone() {
		return new e(this.scopeDepth, this.parentScopes, this.fontStyle, this.foreground, this.background);
	}
	static cloneArr(e) {
		let t = [];
		for (let n = 0, r = e.length; n < r; n++) t[n] = e[n].clone();
		return t;
	}
	acceptOverwrite(e, t, n, r) {
		this.scopeDepth > e ? console.log("how did this happen?") : this.scopeDepth = e, t !== -1 && (this.fontStyle = t), n !== 0 && (this.foreground = n), r !== 0 && (this.background = r);
	}
}, ye = class e {
	constructor(e, t = [], n = {}) {
		this._mainRule = e, this._children = n, this._rulesWithParentScopes = t;
	}
	_mainRule;
	_children;
	_rulesWithParentScopes;
	static _cmpBySpecificity(e, t) {
		if (e.scopeDepth !== t.scopeDepth) return t.scopeDepth - e.scopeDepth;
		let n = 0, r = 0;
		for (; e.parentScopes[n] === ">" && n++, t.parentScopes[r] === ">" && r++, !(n >= e.parentScopes.length || r >= t.parentScopes.length);) {
			let i = t.parentScopes[r].length - e.parentScopes[n].length;
			if (i !== 0) return i;
			n++, r++;
		}
		return t.parentScopes.length - e.parentScopes.length;
	}
	match(t) {
		if (t !== "") {
			let e = t.indexOf("."), n, r;
			if (e === -1 ? (n = t, r = "") : (n = t.substring(0, e), r = t.substring(e + 1)), this._children.hasOwnProperty(n)) return this._children[n].match(r);
		}
		let n = this._rulesWithParentScopes.concat(this._mainRule);
		return n.sort(e._cmpBySpecificity), n;
	}
	insert(t, n, r, i, a, o) {
		if (n === "") {
			this._doInsertHere(t, r, i, a, o);
			return;
		}
		let s = n.indexOf("."), c, l;
		s === -1 ? (c = n, l = "") : (c = n.substring(0, s), l = n.substring(s + 1));
		let u;
		this._children.hasOwnProperty(c) ? u = this._children[c] : (u = new e(this._mainRule.clone(), ve.cloneArr(this._rulesWithParentScopes)), this._children[c] = u), u.insert(t + 1, l, r, i, a, o);
	}
	_doInsertHere(e, t, n, r, i) {
		if (t === null) this._mainRule.acceptOverwrite(e, n, r, i);
		else {
			for (let a = 0, o = this._rulesWithParentScopes.length; a < o; a++) {
				let o = this._rulesWithParentScopes[a];
				if (ie(o.parentScopes, t) === 0) {
					o.acceptOverwrite(e, n, r, i);
					return;
				}
			}
			n === -1 && (n = this._mainRule.fontStyle), r === 0 && (r = this._mainRule.foreground), i === 0 && (i = this._mainRule.background), this._rulesWithParentScopes.push(new ve(e, t, n, r, i));
		}
	}
}, be = class e {
	static toBinaryStr(e) {
		return e.toString(2).padStart(32, "0");
	}
	static print(t) {
		let n = e.getLanguageId(t), r = e.getTokenType(t), i = e.getFontStyle(t), a = e.getForeground(t), o = e.getBackground(t);
		console.log({
			languageId: n,
			tokenType: r,
			fontStyle: i,
			foreground: a,
			background: o
		});
	}
	static getLanguageId(e) {
		return (e & 255) >>> 0;
	}
	static getTokenType(e) {
		return (e & 768) >>> 8;
	}
	static containsBalancedBrackets(e) {
		return !!(e & 1024);
	}
	static getFontStyle(e) {
		return (e & 30720) >>> 11;
	}
	static getForeground(e) {
		return (e & 16744448) >>> 15;
	}
	static getBackground(e) {
		return (e & 4278190080) >>> 24;
	}
	static set(t, n, r, i, a, o, s) {
		let c = e.getLanguageId(t), l = e.getTokenType(t), u = +!!e.containsBalancedBrackets(t), d = e.getFontStyle(t), f = e.getForeground(t), p = e.getBackground(t);
		return n !== 0 && (c = n), r !== 8 && (l = Se(r)), i !== null && (u = +!!i), a !== -1 && (d = a), o !== 0 && (f = o), s !== 0 && (p = s), (c | 0 | l << 8 | u << 10 | d << 11 | f << 15 | p << 24) >>> 0;
	}
};
function xe(e) {
	return e;
}
function Se(e) {
	return e;
}
function Ce(e, t) {
	let n = [], r = Te(e), i = r.next();
	for (; i !== null;) {
		let e = 0;
		if (i.length === 2 && i.charAt(1) === ":") {
			switch (i.charAt(0)) {
				case "R":
					e = 1;
					break;
				case "L":
					e = -1;
					break;
				default: console.log(`Unknown priority ${i} in scope selector`);
			}
			i = r.next();
		}
		let t = o();
		if (n.push({
			matcher: t,
			priority: e
		}), i !== ",") break;
		i = r.next();
	}
	return n;
	function a() {
		if (i === "-") {
			i = r.next();
			let e = a();
			return (t) => !!e && !e(t);
		}
		if (i === "(") {
			i = r.next();
			let e = s();
			return i === ")" && (i = r.next()), e;
		}
		if (we(i)) {
			let e = [];
			do
				e.push(i), i = r.next();
			while (we(i));
			return (n) => t(e, n);
		}
		return null;
	}
	function o() {
		let e = [], t = a();
		for (; t;) e.push(t), t = a();
		return (t) => e.every((e) => e(t));
	}
	function s() {
		let e = [], t = o();
		for (; t && (e.push(t), i === "|" || i === ",");) {
			do
				i = r.next();
			while (i === "|" || i === ",");
			t = o();
		}
		return (t) => e.some((e) => e(t));
	}
}
function we(e) {
	return !!e && !!e.match(/[\w\.:]+/);
}
function Te(e) {
	let t = /([LR]:|[\w\.:][\w\.:\-]*|[\,\|\-\(\)])/g, n = t.exec(e);
	return { next: () => {
		if (!n) return null;
		let r = n[0];
		return n = t.exec(e), r;
	} };
}
function Ee(e) {
	typeof e.dispose == "function" && e.dispose();
}
var De = class {
	constructor(e) {
		this.scopeName = e;
	}
	scopeName;
	toKey() {
		return this.scopeName;
	}
}, Oe = class {
	constructor(e, t) {
		this.scopeName = e, this.ruleName = t;
	}
	scopeName;
	ruleName;
	toKey() {
		return `${this.scopeName}#${this.ruleName}`;
	}
}, ke = class {
	_references = [];
	_seenReferenceKeys = /* @__PURE__ */ new Set();
	get references() {
		return this._references;
	}
	visitedRule = /* @__PURE__ */ new Set();
	add(e) {
		let t = e.toKey();
		this._seenReferenceKeys.has(t) || (this._seenReferenceKeys.add(t), this._references.push(e));
	}
}, Ae = class {
	constructor(e, t) {
		this.repo = e, this.initialScopeName = t, this.seenFullScopeRequests.add(this.initialScopeName), this.Q = [new De(this.initialScopeName)];
	}
	repo;
	initialScopeName;
	seenFullScopeRequests = /* @__PURE__ */ new Set();
	seenPartialScopeRequests = /* @__PURE__ */ new Set();
	Q;
	processQueue() {
		let e = this.Q;
		this.Q = [];
		let t = new ke();
		for (let n of e) je(n, this.initialScopeName, this.repo, t);
		for (let e of t.references) if (e instanceof De) {
			if (this.seenFullScopeRequests.has(e.scopeName)) continue;
			this.seenFullScopeRequests.add(e.scopeName), this.Q.push(e);
		} else {
			if (this.seenFullScopeRequests.has(e.scopeName) || this.seenPartialScopeRequests.has(e.toKey())) continue;
			this.seenPartialScopeRequests.add(e.toKey()), this.Q.push(e);
		}
	}
};
function je(e, t, n, r) {
	let i = n.lookup(e.scopeName);
	if (!i) {
		if (e.scopeName === t) throw Error(`No grammar provided for <${t}>`);
		return;
	}
	let a = n.lookup(t);
	e instanceof De ? Ne({
		baseGrammar: a,
		selfGrammar: i
	}, r) : Me(e.ruleName, {
		baseGrammar: a,
		selfGrammar: i,
		repository: i.repository
	}, r);
	let o = n.injections(e.scopeName);
	if (o) for (let e of o) r.add(new De(e));
}
function Me(e, t, n) {
	if (t.repository && t.repository[e]) {
		let r = t.repository[e];
		Pe([r], t, n);
	}
}
function Ne(e, t) {
	e.selfGrammar.patterns && Array.isArray(e.selfGrammar.patterns) && Pe(e.selfGrammar.patterns, {
		...e,
		repository: e.selfGrammar.repository
	}, t), e.selfGrammar.injections && Pe(Object.values(e.selfGrammar.injections), {
		...e,
		repository: e.selfGrammar.repository
	}, t);
}
function Pe(e, t, n) {
	for (let r of e) {
		if (n.visitedRule.has(r)) continue;
		n.visitedRule.add(r);
		let e = r.repository ? _({}, t.repository, r.repository) : t.repository;
		Array.isArray(r.patterns) && Pe(r.patterns, {
			...t,
			repository: e
		}, n);
		let i = r.include;
		if (!i) continue;
		let a = Be(i);
		switch (a.kind) {
			case 0:
				Ne({
					...t,
					selfGrammar: t.baseGrammar
				}, n);
				break;
			case 1:
				Ne(t, n);
				break;
			case 2:
				Me(a.ruleName, {
					...t,
					repository: e
				}, n);
				break;
			case 3:
			case 4:
				let r = a.scopeName === t.selfGrammar.scopeName ? t.selfGrammar : a.scopeName === t.baseGrammar.scopeName ? t.baseGrammar : void 0;
				if (r) {
					let i = {
						baseGrammar: t.baseGrammar,
						selfGrammar: r,
						repository: e
					};
					a.kind === 4 ? Me(a.ruleName, i, n) : Ne(i, n);
				} else a.kind === 4 ? n.add(new Oe(a.scopeName, a.ruleName)) : n.add(new De(a.scopeName));
		}
	}
}
var Fe = class {
	kind = 0;
}, Ie = class {
	kind = 1;
}, Le = class {
	constructor(e) {
		this.ruleName = e;
	}
	ruleName;
	kind = 2;
}, Re = class {
	constructor(e) {
		this.scopeName = e;
	}
	scopeName;
	kind = 3;
}, ze = class {
	constructor(e, t) {
		this.scopeName = e, this.ruleName = t;
	}
	scopeName;
	ruleName;
	kind = 4;
};
function Be(e) {
	if (e === "$base") return new Fe();
	if (e === "$self") return new Ie();
	let t = e.indexOf("#");
	return t === -1 ? new Re(e) : t === 0 ? new Le(e.substring(1)) : new ze(e.substring(0, t), e.substring(t + 1));
}
var Ve = /\\(\d+)/, He = /\\(\d+)/g, Ue = -1, We = -2;
function Ge(e) {
	return e;
}
function Ke(e) {
	return e;
}
var qe = class {
	$location;
	id;
	_nameIsCapturing;
	_name;
	_contentNameIsCapturing;
	_contentName;
	constructor(e, t, n, r) {
		this.$location = e, this.id = t, this._name = n || null, this._nameIsCapturing = ne.hasCaptures(this._name), this._contentName = r || null, this._contentNameIsCapturing = ne.hasCaptures(this._contentName);
	}
	get debugName() {
		let e = this.$location ? `${ee(this.$location.filename)}:${this.$location.line}` : "unknown";
		return `${this.constructor.name}#${this.id} @ ${e}`;
	}
	getName(e, t) {
		return !this._nameIsCapturing || this._name === null || e === null || t === null ? this._name : ne.replaceCaptures(this._name, e, t);
	}
	getContentName(e, t) {
		return !this._contentNameIsCapturing || this._contentName === null ? this._contentName : ne.replaceCaptures(this._contentName, e, t);
	}
}, Je = class extends qe {
	retokenizeCapturedWithRuleId;
	constructor(e, t, n, r, i) {
		super(e, t, n, r), this.retokenizeCapturedWithRuleId = i;
	}
	dispose() {}
	collectPatterns(e, t) {
		throw Error("Not supported!");
	}
	compile(e, t) {
		throw Error("Not supported!");
	}
	compileAG(e, t, n, r) {
		throw Error("Not supported!");
	}
}, Ye = class extends qe {
	_match;
	captures;
	_cachedCompiledPatterns;
	constructor(e, t, n, r, i) {
		super(e, t, n, null), this._match = new et(r, this.id), this.captures = i, this._cachedCompiledPatterns = null;
	}
	dispose() {
		this._cachedCompiledPatterns &&= (this._cachedCompiledPatterns.dispose(), null);
	}
	get debugMatchRegExp() {
		return `${this._match.source}`;
	}
	collectPatterns(e, t) {
		t.push(this._match);
	}
	compile(e, t) {
		return this._getCachedCompiledPatterns(e).compile(e);
	}
	compileAG(e, t, n, r) {
		return this._getCachedCompiledPatterns(e).compileAG(e, n, r);
	}
	_getCachedCompiledPatterns(e) {
		return this._cachedCompiledPatterns || (this._cachedCompiledPatterns = new tt(), this.collectPatterns(e, this._cachedCompiledPatterns)), this._cachedCompiledPatterns;
	}
}, Xe = class extends qe {
	hasMissingPatterns;
	patterns;
	_cachedCompiledPatterns;
	constructor(e, t, n, r, i) {
		super(e, t, n, r), this.patterns = i.patterns, this.hasMissingPatterns = i.hasMissingPatterns, this._cachedCompiledPatterns = null;
	}
	dispose() {
		this._cachedCompiledPatterns &&= (this._cachedCompiledPatterns.dispose(), null);
	}
	collectPatterns(e, t) {
		for (let n of this.patterns) e.getRule(n).collectPatterns(e, t);
	}
	compile(e, t) {
		return this._getCachedCompiledPatterns(e).compile(e);
	}
	compileAG(e, t, n, r) {
		return this._getCachedCompiledPatterns(e).compileAG(e, n, r);
	}
	_getCachedCompiledPatterns(e) {
		return this._cachedCompiledPatterns || (this._cachedCompiledPatterns = new tt(), this.collectPatterns(e, this._cachedCompiledPatterns)), this._cachedCompiledPatterns;
	}
}, Ze = class extends qe {
	_begin;
	beginCaptures;
	_end;
	endHasBackReferences;
	endCaptures;
	applyEndPatternLast;
	hasMissingPatterns;
	patterns;
	_cachedCompiledPatterns;
	constructor(e, t, n, r, i, a, o, s, c, l) {
		super(e, t, n, r), this._begin = new et(i, this.id), this.beginCaptures = a, this._end = new et(o || "￿", -1), this.endHasBackReferences = this._end.hasBackReferences, this.endCaptures = s, this.applyEndPatternLast = c || !1, this.patterns = l.patterns, this.hasMissingPatterns = l.hasMissingPatterns, this._cachedCompiledPatterns = null;
	}
	dispose() {
		this._cachedCompiledPatterns &&= (this._cachedCompiledPatterns.dispose(), null);
	}
	get debugBeginRegExp() {
		return `${this._begin.source}`;
	}
	get debugEndRegExp() {
		return `${this._end.source}`;
	}
	getEndWithResolvedBackReferences(e, t) {
		return this._end.resolveBackReferences(e, t);
	}
	collectPatterns(e, t) {
		t.push(this._begin);
	}
	compile(e, t) {
		return this._getCachedCompiledPatterns(e, t).compile(e);
	}
	compileAG(e, t, n, r) {
		return this._getCachedCompiledPatterns(e, t).compileAG(e, n, r);
	}
	_getCachedCompiledPatterns(e, t) {
		if (!this._cachedCompiledPatterns) {
			this._cachedCompiledPatterns = new tt();
			for (let t of this.patterns) e.getRule(t).collectPatterns(e, this._cachedCompiledPatterns);
			this.applyEndPatternLast ? this._cachedCompiledPatterns.push(this._end.hasBackReferences ? this._end.clone() : this._end) : this._cachedCompiledPatterns.unshift(this._end.hasBackReferences ? this._end.clone() : this._end);
		}
		return this._end.hasBackReferences && (this.applyEndPatternLast ? this._cachedCompiledPatterns.setSource(this._cachedCompiledPatterns.length() - 1, t) : this._cachedCompiledPatterns.setSource(0, t)), this._cachedCompiledPatterns;
	}
}, Qe = class extends qe {
	_begin;
	beginCaptures;
	whileCaptures;
	_while;
	whileHasBackReferences;
	hasMissingPatterns;
	patterns;
	_cachedCompiledPatterns;
	_cachedCompiledWhilePatterns;
	constructor(e, t, n, r, i, a, o, s, c) {
		super(e, t, n, r), this._begin = new et(i, this.id), this.beginCaptures = a, this.whileCaptures = s, this._while = new et(o, We), this.whileHasBackReferences = this._while.hasBackReferences, this.patterns = c.patterns, this.hasMissingPatterns = c.hasMissingPatterns, this._cachedCompiledPatterns = null, this._cachedCompiledWhilePatterns = null;
	}
	dispose() {
		this._cachedCompiledPatterns &&= (this._cachedCompiledPatterns.dispose(), null), this._cachedCompiledWhilePatterns &&= (this._cachedCompiledWhilePatterns.dispose(), null);
	}
	get debugBeginRegExp() {
		return `${this._begin.source}`;
	}
	get debugWhileRegExp() {
		return `${this._while.source}`;
	}
	getWhileWithResolvedBackReferences(e, t) {
		return this._while.resolveBackReferences(e, t);
	}
	collectPatterns(e, t) {
		t.push(this._begin);
	}
	compile(e, t) {
		return this._getCachedCompiledPatterns(e).compile(e);
	}
	compileAG(e, t, n, r) {
		return this._getCachedCompiledPatterns(e).compileAG(e, n, r);
	}
	_getCachedCompiledPatterns(e) {
		if (!this._cachedCompiledPatterns) {
			this._cachedCompiledPatterns = new tt();
			for (let t of this.patterns) e.getRule(t).collectPatterns(e, this._cachedCompiledPatterns);
		}
		return this._cachedCompiledPatterns;
	}
	compileWhile(e, t) {
		return this._getCachedCompiledWhilePatterns(e, t).compile(e);
	}
	compileWhileAG(e, t, n, r) {
		return this._getCachedCompiledWhilePatterns(e, t).compileAG(e, n, r);
	}
	_getCachedCompiledWhilePatterns(e, t) {
		return this._cachedCompiledWhilePatterns || (this._cachedCompiledWhilePatterns = new tt(), this._cachedCompiledWhilePatterns.push(this._while.hasBackReferences ? this._while.clone() : this._while)), this._while.hasBackReferences && this._cachedCompiledWhilePatterns.setSource(0, t || "￿"), this._cachedCompiledWhilePatterns;
	}
}, $e = class e {
	static createCaptureRule(e, t, n, r, i) {
		return e.registerRule((e) => new Je(t, e, n, r, i));
	}
	static getCompiledRuleId(t, n, r) {
		return t.id || n.registerRule((i) => {
			if (t.id = i, t.match) return new Ye(t.$vscodeTextmateLocation, t.id, t.name, t.match, e._compileCaptures(t.captures, n, r));
			if (t.begin === void 0) {
				t.repository && (r = _({}, r, t.repository));
				let i = t.patterns;
				return i === void 0 && t.include && (i = [{ include: t.include }]), new Xe(t.$vscodeTextmateLocation, t.id, t.name, t.contentName, e._compilePatterns(i, n, r));
			}
			return t.while ? new Qe(t.$vscodeTextmateLocation, t.id, t.name, t.contentName, t.begin, e._compileCaptures(t.beginCaptures || t.captures, n, r), t.while, e._compileCaptures(t.whileCaptures || t.captures, n, r), e._compilePatterns(t.patterns, n, r)) : new Ze(t.$vscodeTextmateLocation, t.id, t.name, t.contentName, t.begin, e._compileCaptures(t.beginCaptures || t.captures, n, r), t.end, e._compileCaptures(t.endCaptures || t.captures, n, r), t.applyEndPatternLast, e._compilePatterns(t.patterns, n, r));
		}), t.id;
	}
	static _compileCaptures(t, n, r) {
		let i = [];
		if (t) {
			let a = 0;
			for (let e in t) {
				if (e === "$vscodeTextmateLocation") continue;
				let t = parseInt(e, 10);
				t > a && (a = t);
			}
			for (let e = 0; e <= a; e++) i[e] = null;
			for (let a in t) {
				if (a === "$vscodeTextmateLocation") continue;
				let o = parseInt(a, 10), s = 0;
				t[a].patterns && (s = e.getCompiledRuleId(t[a], n, r)), i[o] = e.createCaptureRule(n, t[a].$vscodeTextmateLocation, t[a].name, t[a].contentName, s);
			}
		}
		return i;
	}
	static _compilePatterns(t, n, r) {
		let i = [];
		if (t) for (let a = 0, o = t.length; a < o; a++) {
			let o = t[a], s = -1;
			if (o.include) {
				let t = Be(o.include);
				switch (t.kind) {
					case 0:
					case 1:
						s = e.getCompiledRuleId(r[o.include], n, r);
						break;
					case 2:
						let i = r[t.ruleName];
						i && (s = e.getCompiledRuleId(i, n, r));
						break;
					case 3:
					case 4:
						let a = t.scopeName, c = t.kind === 4 ? t.ruleName : null, l = n.getExternalGrammar(a, r);
						if (l) {
							if (c) {
								let t = l.repository[c];
								t && (s = e.getCompiledRuleId(t, n, l.repository));
							} else s = e.getCompiledRuleId(l.repository.$self, n, l.repository);
						}
				}
			} else s = e.getCompiledRuleId(o, n, r);
			if (s !== -1) {
				let e = n.getRule(s), t = !1;
				if ((e instanceof Xe || e instanceof Ze || e instanceof Qe) && e.hasMissingPatterns && e.patterns.length === 0 && (t = !0), t) continue;
				i.push(s);
			}
		}
		return {
			patterns: i,
			hasMissingPatterns: (t ? t.length : 0) !== i.length
		};
	}
}, et = class e {
	source;
	ruleId;
	hasAnchor;
	hasBackReferences;
	_anchorCache;
	constructor(e, t) {
		if (e && typeof e == "string") {
			let t = e.length, n = 0, r = [], i = !1;
			for (let a = 0; a < t; a++) if (e.charAt(a) === "\\" && a + 1 < t) {
				let t = e.charAt(a + 1);
				t === "z" ? (r.push(e.substring(n, a)), r.push("$(?!\\n)(?<!\\n)"), n = a + 2) : (t === "A" || t === "G") && (i = !0), a++;
			}
			this.hasAnchor = i, n === 0 ? this.source = e : (r.push(e.substring(n, t)), this.source = r.join(""));
		} else this.hasAnchor = !1, this.source = e;
		this._anchorCache = this.hasAnchor ? this._buildAnchorCache() : null, this.ruleId = t, this.hasBackReferences = typeof this.source == "string" && Ve.test(this.source);
	}
	clone() {
		return new e(this.source, this.ruleId);
	}
	setSource(e) {
		this.source !== e && (this.source = e, this.hasAnchor && (this._anchorCache = this._buildAnchorCache()));
	}
	resolveBackReferences(e, t) {
		if (typeof this.source != "string") throw Error("This method should only be called if the source is a string");
		let n = t.map((t) => e.substring(t.start, t.end));
		return He.lastIndex = 0, this.source.replace(He, (e, t) => oe(n[parseInt(t, 10)] || ""));
	}
	_buildAnchorCache() {
		if (typeof this.source != "string") throw Error("This method should only be called if the source is a string");
		let e = [], t = [], n = [], r = [], i, a, o, s;
		for (i = 0, a = this.source.length; i < a; i++) o = this.source.charAt(i), e[i] = o, t[i] = o, n[i] = o, r[i] = o, o === "\\" && i + 1 < a && (s = this.source.charAt(i + 1), s === "A" ? (e[i + 1] = "￿", t[i + 1] = "￿", n[i + 1] = "A", r[i + 1] = "A") : s === "G" ? (e[i + 1] = "￿", t[i + 1] = "G", n[i + 1] = "￿", r[i + 1] = "G") : (e[i + 1] = s, t[i + 1] = s, n[i + 1] = s, r[i + 1] = s), i++);
		return {
			A0_G0: e.join(""),
			A0_G1: t.join(""),
			A1_G0: n.join(""),
			A1_G1: r.join("")
		};
	}
	resolveAnchors(e, t) {
		return !this.hasAnchor || !this._anchorCache || typeof this.source != "string" ? this.source : e ? t ? this._anchorCache.A1_G1 : this._anchorCache.A1_G0 : t ? this._anchorCache.A0_G1 : this._anchorCache.A0_G0;
	}
}, tt = class {
	_items;
	_hasAnchors;
	_cached;
	_anchorCache;
	constructor() {
		this._items = [], this._hasAnchors = !1, this._cached = null, this._anchorCache = {
			A0_G0: null,
			A0_G1: null,
			A1_G0: null,
			A1_G1: null
		};
	}
	dispose() {
		this._disposeCaches();
	}
	_disposeCaches() {
		this._cached &&= (this._cached.dispose(), null), this._anchorCache.A0_G0 && (this._anchorCache.A0_G0.dispose(), this._anchorCache.A0_G0 = null), this._anchorCache.A0_G1 && (this._anchorCache.A0_G1.dispose(), this._anchorCache.A0_G1 = null), this._anchorCache.A1_G0 && (this._anchorCache.A1_G0.dispose(), this._anchorCache.A1_G0 = null), this._anchorCache.A1_G1 && (this._anchorCache.A1_G1.dispose(), this._anchorCache.A1_G1 = null);
	}
	push(e) {
		this._items.push(e), this._hasAnchors = this._hasAnchors || e.hasAnchor;
	}
	unshift(e) {
		this._items.unshift(e), this._hasAnchors = this._hasAnchors || e.hasAnchor;
	}
	length() {
		return this._items.length;
	}
	setSource(e, t) {
		this._items[e].source !== t && (this._disposeCaches(), this._items[e].setSource(t));
	}
	compile(e) {
		if (!this._cached) {
			let t = this._items.map((e) => e.source);
			this._cached = new nt(e, t, this._items.map((e) => e.ruleId));
		}
		return this._cached;
	}
	compileAG(e, t, n) {
		return this._hasAnchors ? t ? n ? (this._anchorCache.A1_G1 || (this._anchorCache.A1_G1 = this._resolveAnchors(e, t, n)), this._anchorCache.A1_G1) : (this._anchorCache.A1_G0 || (this._anchorCache.A1_G0 = this._resolveAnchors(e, t, n)), this._anchorCache.A1_G0) : n ? (this._anchorCache.A0_G1 || (this._anchorCache.A0_G1 = this._resolveAnchors(e, t, n)), this._anchorCache.A0_G1) : (this._anchorCache.A0_G0 || (this._anchorCache.A0_G0 = this._resolveAnchors(e, t, n)), this._anchorCache.A0_G0) : this.compile(e);
	}
	_resolveAnchors(e, t, n) {
		return new nt(e, this._items.map((e) => e.resolveAnchors(t, n)), this._items.map((e) => e.ruleId));
	}
}, nt = class {
	constructor(e, t, n) {
		this.regExps = t, this.rules = n, this.scanner = e.createOnigScanner(t);
	}
	regExps;
	rules;
	scanner;
	dispose() {
		typeof this.scanner.dispose == "function" && this.scanner.dispose();
	}
	toString() {
		let e = [];
		for (let t = 0, n = this.rules.length; t < n; t++) e.push("   - " + this.rules[t] + ": " + this.regExps[t]);
		return e.join("\n");
	}
	findNextMatchSync(e, t, n) {
		let r = this.scanner.findNextMatchSync(e, t, n);
		return r ? {
			ruleId: this.rules[r.index],
			captureIndices: r.captureIndices
		} : null;
	}
}, rt = class {
	constructor(e, t) {
		this.languageId = e, this.tokenType = t;
	}
	languageId;
	tokenType;
}, it = class e {
	_defaultAttributes;
	_embeddedLanguagesMatcher;
	constructor(e, t) {
		this._defaultAttributes = new rt(e, 8), this._embeddedLanguagesMatcher = new at(Object.entries(t || {}));
	}
	getDefaultAttributes() {
		return this._defaultAttributes;
	}
	getBasicScopeAttributes(t) {
		return t === null ? e._NULL_SCOPE_METADATA : this._getBasicScopeAttributes.get(t);
	}
	static _NULL_SCOPE_METADATA = new rt(0, 0);
	_getBasicScopeAttributes = new se((e) => new rt(this._scopeToLanguage(e), this._toStandardTokenType(e)));
	_scopeToLanguage(e) {
		return this._embeddedLanguagesMatcher.match(e) || 0;
	}
	_toStandardTokenType(t) {
		let n = t.match(e.STANDARD_TOKEN_TYPE_REGEXP);
		if (!n) return 8;
		switch (n[1]) {
			case "comment": return 1;
			case "string": return 2;
			case "regex": return 3;
			case "meta.embedded": return 0;
		}
		throw Error("Unexpected match for standard token type!");
	}
	static STANDARD_TOKEN_TYPE_REGEXP = /\b(comment|string|regex|meta\.embedded)\b/;
}, at = class {
	values;
	scopesRegExp;
	constructor(e) {
		if (e.length === 0) this.values = null, this.scopesRegExp = null;
		else {
			this.values = new Map(e);
			let t = e.map(([e, t]) => oe(e));
			t.sort(), t.reverse(), this.scopesRegExp = RegExp(`^((${t.join(")|(")}))($|\\.)`, "");
		}
	}
	match(e) {
		if (!this.scopesRegExp) return;
		let t = e.match(this.scopesRegExp);
		if (t) return this.values.get(t[1]);
	}
};
typeof process < "u" && process.env.VSCODE_TEXTMATE_DEBUG;
var ot = class {
	constructor(e, t) {
		this.stack = e, this.stoppedEarly = t;
	}
	stack;
	stoppedEarly;
};
function st(e, t, n, r, i, a, o, s) {
	let c = t.content.length, l = !1, u = -1;
	if (o) {
		let o = ct(e, t, n, r, i, a);
		i = o.stack, r = o.linePos, n = o.isFirstLine, u = o.anchorPosition;
	}
	let d = Date.now();
	for (; !l;) {
		if (s !== 0 && Date.now() - d > s) return new ot(i, !0);
		f();
	}
	return new ot(i, !1);
	function f() {
		let o = lt(e, t, n, r, i, u);
		if (!o) {
			a.produce(i, c), l = !0;
			return;
		}
		let s = o.captureIndices, d = o.matchedRuleId, f = s && s.length > 0 ? s[0].end > r : !1;
		if (d === Ue) {
			let o = i.getRule(e);
			a.produce(i, s[0].start), i = i.withContentNameScopesList(i.nameScopesList), mt(e, t, n, i, a, o.endCaptures, s), a.produce(i, s[0].end);
			let d = i;
			if (i = i.parent, u = d.getAnchorPos(), !f && d.getEnterPos() === r) {
				i = d, a.produce(i, c), l = !0;
				return;
			}
		} else {
			let o = e.getRule(d);
			a.produce(i, s[0].start);
			let p = i, m = o.getName(t.content, s), h = i.contentNameScopesList.pushAttributed(m, e);
			if (i = i.push(d, r, u, s[0].end === c, null, h, h), o instanceof Ze) {
				let r = o;
				mt(e, t, n, i, a, r.beginCaptures, s), a.produce(i, s[0].end), u = s[0].end;
				let d = r.getContentName(t.content, s), m = h.pushAttributed(d, e);
				if (i = i.withContentNameScopesList(m), r.endHasBackReferences && (i = i.withEndRule(r.getEndWithResolvedBackReferences(t.content, s))), !f && p.hasSameRuleAs(i)) {
					i = i.pop(), a.produce(i, c), l = !0;
					return;
				}
			} else if (o instanceof Qe) {
				let r = o;
				mt(e, t, n, i, a, r.beginCaptures, s), a.produce(i, s[0].end), u = s[0].end;
				let d = r.getContentName(t.content, s), m = h.pushAttributed(d, e);
				if (i = i.withContentNameScopesList(m), r.whileHasBackReferences && (i = i.withEndRule(r.getWhileWithResolvedBackReferences(t.content, s))), !f && p.hasSameRuleAs(i)) {
					i = i.pop(), a.produce(i, c), l = !0;
					return;
				}
			} else if (mt(e, t, n, i, a, o.captures, s), a.produce(i, s[0].end), i = i.pop(), !f) {
				i = i.safePop(), a.produce(i, c), l = !0;
				return;
			}
		}
		s[0].end > r && (r = s[0].end, n = !1);
	}
}
function ct(e, t, n, r, i, a) {
	let o = i.beginRuleCapturedEOL ? 0 : -1, s = [];
	for (let t = i; t; t = t.pop()) {
		let n = t.getRule(e);
		n instanceof Qe && s.push({
			rule: n,
			stack: t
		});
	}
	for (let c = s.pop(); c; c = s.pop()) {
		let { ruleScanner: s, findOptions: l } = pt(c.rule, e, c.stack.endRule, n, r === o), u = s.findNextMatchSync(t, r, l);
		if (u) {
			if (u.ruleId !== We) {
				i = c.stack.pop();
				break;
			}
			u.captureIndices && u.captureIndices.length && (a.produce(c.stack, u.captureIndices[0].start), mt(e, t, n, c.stack, a, c.rule.whileCaptures, u.captureIndices), a.produce(c.stack, u.captureIndices[0].end), o = u.captureIndices[0].end, u.captureIndices[0].end > r && (r = u.captureIndices[0].end, n = !1));
		} else {
			i = c.stack.pop();
			break;
		}
	}
	return {
		stack: i,
		linePos: r,
		anchorPosition: o,
		isFirstLine: n
	};
}
function lt(e, t, n, r, i, a) {
	let o = ut(e, t, n, r, i, a), s = e.getInjections();
	if (s.length === 0) return o;
	let c = dt(s, e, t, n, r, i, a);
	if (!c) return o;
	if (!o) return c;
	let l = o.captureIndices[0].start, u = c.captureIndices[0].start;
	return u < l || c.priorityMatch && u === l ? c : o;
}
function ut(e, t, n, r, i, a) {
	let { ruleScanner: o, findOptions: s } = ft(i.getRule(e), e, i.endRule, n, r === a), c = o.findNextMatchSync(t, r, s);
	return c ? {
		captureIndices: c.captureIndices,
		matchedRuleId: c.ruleId
	} : null;
}
function dt(e, t, n, r, i, a, o) {
	let s = Number.MAX_VALUE, c = null, l, u = 0, d = a.contentNameScopesList.getScopeNames();
	for (let a = 0, f = e.length; a < f; a++) {
		let f = e[a];
		if (!f.matcher(d)) continue;
		let { ruleScanner: p, findOptions: m } = ft(t.getRule(f.ruleId), t, null, r, i === o), h = p.findNextMatchSync(n, i, m);
		if (!h) continue;
		let g = h.captureIndices[0].start;
		if (!(g >= s) && (s = g, c = h.captureIndices, l = h.ruleId, u = f.priority, s === i)) break;
	}
	return c ? {
		priorityMatch: u === -1,
		captureIndices: c,
		matchedRuleId: l
	} : null;
}
function ft(e, t, n, r, i) {
	return {
		ruleScanner: e.compileAG(t, n, r, i),
		findOptions: 0
	};
}
function pt(e, t, n, r, i) {
	return {
		ruleScanner: e.compileWhileAG(t, n, r, i),
		findOptions: 0
	};
}
function mt(e, t, n, r, i, a, o) {
	if (a.length === 0) return;
	let s = t.content, c = Math.min(a.length, o.length), l = [], u = o[0].end;
	for (let t = 0; t < c; t++) {
		let c = a[t];
		if (c === null) continue;
		let d = o[t];
		if (d.length === 0) continue;
		if (d.start > u) break;
		for (; l.length > 0 && l[l.length - 1].endPos <= d.start;) i.produceFromScopes(l[l.length - 1].scopes, l[l.length - 1].endPos), l.pop();
		if (l.length > 0 ? i.produceFromScopes(l[l.length - 1].scopes, d.start) : i.produce(r, d.start), c.retokenizeCapturedWithRuleId) {
			let t = c.getName(s, o), a = r.contentNameScopesList.pushAttributed(t, e), l = c.getContentName(s, o), u = a.pushAttributed(l, e), f = r.push(c.retokenizeCapturedWithRuleId, d.start, -1, !1, null, a, u), p = e.createOnigString(s.substring(0, d.end));
			st(e, p, n && d.start === 0, d.start, f, i, !1, 0), Ee(p);
			continue;
		}
		let f = c.getName(s, o);
		if (f !== null) {
			let t = (l.length > 0 ? l[l.length - 1].scopes : r.contentNameScopesList).pushAttributed(f, e);
			l.push(new ht(t, d.end));
		}
	}
	for (; l.length > 0;) i.produceFromScopes(l[l.length - 1].scopes, l[l.length - 1].endPos), l.pop();
}
var ht = class {
	scopes;
	endPos;
	constructor(e, t) {
		this.scopes = e, this.endPos = t;
	}
};
function gt(e, t, n, r, i, a, o, s) {
	return new bt(e, t, n, r, i, a, o, s);
}
function _t(e, t, n, r, i) {
	let a = Ce(t, vt), o = $e.getCompiledRuleId(n, r, i.repository);
	for (let n of a) e.push({
		debugSelector: t,
		matcher: n.matcher,
		ruleId: o,
		grammar: i,
		priority: n.priority
	});
}
function vt(e, t) {
	if (t.length < e.length) return !1;
	let n = 0;
	return e.every((e) => {
		for (let r = n; r < t.length; r++) if (yt(t[r], e)) return n = r + 1, !0;
		return !1;
	});
}
function yt(e, t) {
	if (!e) return !1;
	if (e === t) return !0;
	let n = t.length;
	return e.length > n && e.substr(0, n) === t && e[n] === ".";
}
var bt = class {
	constructor(e, t, n, r, i, a, o, s) {
		if (this._rootScopeName = e, this.balancedBracketSelectors = a, this._onigLib = s, this._basicScopeAttributesProvider = new it(n, r), this._rootId = -1, this._lastRuleId = 0, this._ruleId2desc = [null], this._includedGrammars = {}, this._grammarRepository = o, this._grammar = xt(t, null), this._injections = null, this._tokenTypeMatchers = [], i) for (let e of Object.keys(i)) {
			let t = Ce(e, vt);
			for (let n of t) this._tokenTypeMatchers.push({
				matcher: n.matcher,
				type: i[e]
			});
		}
	}
	_rootScopeName;
	balancedBracketSelectors;
	_onigLib;
	_rootId;
	_lastRuleId;
	_ruleId2desc;
	_includedGrammars;
	_grammarRepository;
	_grammar;
	_injections;
	_basicScopeAttributesProvider;
	_tokenTypeMatchers;
	get themeProvider() {
		return this._grammarRepository;
	}
	dispose() {
		for (let e of this._ruleId2desc) e && e.dispose();
	}
	createOnigScanner(e) {
		return this._onigLib.createOnigScanner(e);
	}
	createOnigString(e) {
		return this._onigLib.createOnigString(e);
	}
	getMetadataForScope(e) {
		return this._basicScopeAttributesProvider.getBasicScopeAttributes(e);
	}
	_collectInjections() {
		let e = {
			lookup: (e) => e === this._rootScopeName ? this._grammar : this.getExternalGrammar(e),
			injections: (e) => this._grammarRepository.injections(e)
		}, t = [], n = this._rootScopeName, r = e.lookup(n);
		if (r) {
			let e = r.injections;
			if (e) for (let n in e) _t(t, n, e[n], this, r);
			let i = this._grammarRepository.injections(n);
			i && i.forEach((e) => {
				let n = this.getExternalGrammar(e);
				if (n) {
					let e = n.injectionSelector;
					e && _t(t, e, n, this, n);
				}
			});
		}
		return t.sort((e, t) => e.priority - t.priority), t;
	}
	getInjections() {
		return this._injections === null && (this._injections = this._collectInjections()), this._injections;
	}
	registerRule(e) {
		let t = ++this._lastRuleId, n = e(Ge(t));
		return this._ruleId2desc[t] = n, n;
	}
	getRule(e) {
		return this._ruleId2desc[Ke(e)];
	}
	getExternalGrammar(e, t) {
		if (this._includedGrammars[e]) return this._includedGrammars[e];
		if (this._grammarRepository) {
			let n = this._grammarRepository.lookup(e);
			if (n) return this._includedGrammars[e] = xt(n, t && t.$base), this._includedGrammars[e];
		}
	}
	tokenizeLine(e, t, n = 0) {
		let r = this._tokenize(e, t, !1, n);
		return {
			tokens: r.lineTokens.getResult(r.ruleStack, r.lineLength),
			ruleStack: r.ruleStack,
			stoppedEarly: r.stoppedEarly
		};
	}
	tokenizeLine2(e, t, n = 0) {
		let r = this._tokenize(e, t, !0, n);
		return {
			tokens: r.lineTokens.getBinaryResult(r.ruleStack, r.lineLength),
			ruleStack: r.ruleStack,
			stoppedEarly: r.stoppedEarly
		};
	}
	_tokenize(e, t, n, r) {
		this._rootId === -1 && (this._rootId = $e.getCompiledRuleId(this._grammar.repository.$self, this, this._grammar.repository), this.getInjections());
		let i;
		if (!t || t === Ct.NULL) {
			i = !0;
			let e = this._basicScopeAttributesProvider.getDefaultAttributes(), n = this.themeProvider.getDefaults(), r = be.set(0, e.languageId, e.tokenType, null, n.fontStyle, n.foregroundId, n.backgroundId), a = this.getRule(this._rootId).getName(null, null), o;
			o = a ? St.createRootAndLookUpScopeName(a, r, this) : St.createRoot("unknown", r), t = new Ct(null, this._rootId, -1, -1, !1, null, o, o);
		} else i = !1, t.reset();
		e += "\n";
		let a = this.createOnigString(e), o = a.content.length, s = new Tt(n, e, this._tokenTypeMatchers, this.balancedBracketSelectors), c = st(this, a, i, 0, t, s, !0, r);
		return Ee(a), {
			lineLength: o,
			lineTokens: s,
			ruleStack: c.stack,
			stoppedEarly: c.stoppedEarly
		};
	}
};
function xt(e, t) {
	return e = p(e), e.repository = e.repository || {}, e.repository.$self = {
		$vscodeTextmateLocation: e.$vscodeTextmateLocation,
		patterns: e.patterns,
		name: e.scopeName
	}, e.repository.$base = t || e.repository.$self, e;
}
var St = class e {
	constructor(e, t, n) {
		this.parent = e, this.scopePath = t, this.tokenAttributes = n;
	}
	parent;
	scopePath;
	tokenAttributes;
	static fromExtension(t, n) {
		let r = t, i = t?.scopePath ?? null;
		for (let t of n) i = le.push(i, t.scopeNames), r = new e(r, i, t.encodedTokenAttributes);
		return r;
	}
	static createRoot(t, n) {
		return new e(null, new le(null, t), n);
	}
	static createRootAndLookUpScopeName(t, n, r) {
		let i = r.getMetadataForScope(t), a = new le(null, t), o = r.themeProvider.themeMatch(a), s = e.mergeAttributes(n, i, o);
		return new e(null, a, s);
	}
	get scopeName() {
		return this.scopePath.scopeName;
	}
	toString() {
		return this.getScopeNames().join(" ");
	}
	equals(t) {
		return e.equals(this, t);
	}
	static equals(e, t) {
		do {
			if (e === t || !e && !t) return !0;
			if (!e || !t || e.scopeName !== t.scopeName || e.tokenAttributes !== t.tokenAttributes) return !1;
			e = e.parent, t = t.parent;
		} while (1);
	}
	static mergeAttributes(e, t, n) {
		let r = -1, i = 0, a = 0;
		return n !== null && (r = n.fontStyle, i = n.foregroundId, a = n.backgroundId), be.set(e, t.languageId, t.tokenType, null, r, i, a);
	}
	pushAttributed(t, n) {
		if (t === null) return this;
		if (t.indexOf(" ") === -1) return e._pushAttributed(this, t, n);
		let r = t.split(/ /g), i = this;
		for (let t of r) i = e._pushAttributed(i, t, n);
		return i;
	}
	static _pushAttributed(t, n, r) {
		let i = r.getMetadataForScope(n), a = t.scopePath.push(n), o = r.themeProvider.themeMatch(a), s = e.mergeAttributes(t.tokenAttributes, i, o);
		return new e(t, a, s);
	}
	getScopeNames() {
		return this.scopePath.getSegments();
	}
	getExtensionIfDefined(e) {
		let t = [], n = this;
		for (; n && n !== e;) t.push({
			encodedTokenAttributes: n.tokenAttributes,
			scopeNames: n.scopePath.getExtensionIfDefined(n.parent?.scopePath ?? null)
		}), n = n.parent;
		return n === e ? t.reverse() : void 0;
	}
}, Ct = class e {
	constructor(e, t, n, r, i, a, o, s) {
		this.parent = e, this.ruleId = t, this.beginRuleCapturedEOL = i, this.endRule = a, this.nameScopesList = o, this.contentNameScopesList = s, this.depth = this.parent ? this.parent.depth + 1 : 1, this._enterPos = n, this._anchorPos = r;
	}
	parent;
	ruleId;
	beginRuleCapturedEOL;
	endRule;
	nameScopesList;
	contentNameScopesList;
	_stackElementBrand = void 0;
	static NULL = new e(null, 0, 0, 0, !1, null, null, null);
	_enterPos;
	_anchorPos;
	depth;
	equals(t) {
		return t !== null && e._equals(this, t);
	}
	static _equals(e, t) {
		return e === t ? !0 : this._structuralEquals(e, t) ? St.equals(e.contentNameScopesList, t.contentNameScopesList) : !1;
	}
	static _structuralEquals(e, t) {
		do {
			if (e === t || !e && !t) return !0;
			if (!e || !t || e.depth !== t.depth || e.ruleId !== t.ruleId || e.endRule !== t.endRule) return !1;
			e = e.parent, t = t.parent;
		} while (1);
	}
	clone() {
		return this;
	}
	static _reset(e) {
		for (; e;) e._enterPos = -1, e._anchorPos = -1, e = e.parent;
	}
	reset() {
		e._reset(this);
	}
	pop() {
		return this.parent;
	}
	safePop() {
		return this.parent ? this.parent : this;
	}
	push(t, n, r, i, a, o, s) {
		return new e(this, t, n, r, i, a, o, s);
	}
	getEnterPos() {
		return this._enterPos;
	}
	getAnchorPos() {
		return this._anchorPos;
	}
	getRule(e) {
		return e.getRule(this.ruleId);
	}
	toString() {
		let e = [];
		return this._writeString(e, 0), "[" + e.join(",") + "]";
	}
	_writeString(e, t) {
		return this.parent && (t = this.parent._writeString(e, t)), e[t++] = `(${this.ruleId}, ${this.nameScopesList?.toString()}, ${this.contentNameScopesList?.toString()})`, t;
	}
	withContentNameScopesList(e) {
		return this.contentNameScopesList === e ? this : this.parent.push(this.ruleId, this._enterPos, this._anchorPos, this.beginRuleCapturedEOL, this.endRule, this.nameScopesList, e);
	}
	withEndRule(t) {
		return this.endRule === t ? this : new e(this.parent, this.ruleId, this._enterPos, this._anchorPos, this.beginRuleCapturedEOL, t, this.nameScopesList, this.contentNameScopesList);
	}
	hasSameRuleAs(e) {
		let t = this;
		for (; t && t._enterPos === e._enterPos;) {
			if (t.ruleId === e.ruleId) return !0;
			t = t.parent;
		}
		return !1;
	}
	toStateStackFrame() {
		return {
			ruleId: Ke(this.ruleId),
			beginRuleCapturedEOL: this.beginRuleCapturedEOL,
			endRule: this.endRule,
			nameScopesList: this.nameScopesList?.getExtensionIfDefined(this.parent?.nameScopesList ?? null) ?? [],
			contentNameScopesList: this.contentNameScopesList?.getExtensionIfDefined(this.nameScopesList) ?? []
		};
	}
	static pushFrame(t, n) {
		let r = St.fromExtension(t?.nameScopesList ?? null, n.nameScopesList);
		return new e(t, Ge(n.ruleId), n.enterPos ?? -1, n.anchorPos ?? -1, n.beginRuleCapturedEOL, n.endRule, r, St.fromExtension(r, n.contentNameScopesList));
	}
}, wt = class {
	balancedBracketScopes;
	unbalancedBracketScopes;
	allowAny = !1;
	constructor(e, t) {
		this.balancedBracketScopes = e.flatMap((e) => e === "*" ? (this.allowAny = !0, []) : Ce(e, vt).map((e) => e.matcher)), this.unbalancedBracketScopes = t.flatMap((e) => Ce(e, vt).map((e) => e.matcher));
	}
	get matchesAlways() {
		return this.allowAny && this.unbalancedBracketScopes.length === 0;
	}
	get matchesNever() {
		return this.balancedBracketScopes.length === 0 && !this.allowAny;
	}
	match(e) {
		for (let t of this.unbalancedBracketScopes) if (t(e)) return !1;
		for (let t of this.balancedBracketScopes) if (t(e)) return !0;
		return this.allowAny;
	}
}, Tt = class {
	constructor(e, t, n, r) {
		this.balancedBracketSelectors = r, this._emitBinaryTokens = e, this._tokenTypeOverrides = n, this._lineText = null, this._tokens = [], this._binaryTokens = [], this._lastTokenEndIndex = 0;
	}
	balancedBracketSelectors;
	_emitBinaryTokens;
	_lineText;
	_tokens;
	_binaryTokens;
	_lastTokenEndIndex;
	_tokenTypeOverrides;
	produce(e, t) {
		this.produceFromScopes(e.contentNameScopesList, t);
	}
	produceFromScopes(e, t) {
		if (this._lastTokenEndIndex >= t) return;
		if (this._emitBinaryTokens) {
			let n = e?.tokenAttributes ?? 0, r = !1;
			if (this.balancedBracketSelectors?.matchesAlways && (r = !0), this._tokenTypeOverrides.length > 0 || this.balancedBracketSelectors && !this.balancedBracketSelectors.matchesAlways && !this.balancedBracketSelectors.matchesNever) {
				let t = e?.getScopeNames() ?? [];
				for (let e of this._tokenTypeOverrides) e.matcher(t) && (n = be.set(n, 0, xe(e.type), null, -1, 0, 0));
				this.balancedBracketSelectors && (r = this.balancedBracketSelectors.match(t));
			}
			if (r && (n = be.set(n, 0, 8, r, -1, 0, 0)), this._binaryTokens.length > 0 && this._binaryTokens[this._binaryTokens.length - 1] === n) {
				this._lastTokenEndIndex = t;
				return;
			}
			this._binaryTokens.push(this._lastTokenEndIndex), this._binaryTokens.push(n), this._lastTokenEndIndex = t;
			return;
		}
		let n = e?.getScopeNames() ?? [];
		this._tokens.push({
			startIndex: this._lastTokenEndIndex,
			endIndex: t,
			scopes: n
		}), this._lastTokenEndIndex = t;
	}
	getResult(e, t) {
		return this._tokens.length > 0 && this._tokens[this._tokens.length - 1].startIndex === t - 1 && this._tokens.pop(), this._tokens.length === 0 && (this._lastTokenEndIndex = -1, this.produce(e, t), this._tokens[this._tokens.length - 1].startIndex = 0), this._tokens;
	}
	getBinaryResult(e, t) {
		this._binaryTokens.length > 0 && this._binaryTokens[this._binaryTokens.length - 2] === t - 1 && (this._binaryTokens.pop(), this._binaryTokens.pop()), this._binaryTokens.length === 0 && (this._lastTokenEndIndex = -1, this.produce(e, t), this._binaryTokens[this._binaryTokens.length - 2] = 0);
		let n = new Uint32Array(this._binaryTokens.length);
		for (let e = 0, t = this._binaryTokens.length; e < t; e++) n[e] = this._binaryTokens[e];
		return n;
	}
}, Et = class {
	constructor(e, t) {
		this._onigLib = t, this._theme = e;
	}
	_onigLib;
	_grammars = /* @__PURE__ */ new Map();
	_rawGrammars = /* @__PURE__ */ new Map();
	_injectionGrammars = /* @__PURE__ */ new Map();
	_theme;
	dispose() {
		for (let e of this._grammars.values()) e.dispose();
	}
	setTheme(e) {
		this._theme = e;
	}
	getColorMap() {
		return this._theme.getColorMap();
	}
	addGrammar(e, t) {
		this._rawGrammars.set(e.scopeName, e), t && this._injectionGrammars.set(e.scopeName, t);
	}
	lookup(e) {
		return this._rawGrammars.get(e);
	}
	injections(e) {
		return this._injectionGrammars.get(e);
	}
	getDefaults() {
		return this._theme.getDefaults();
	}
	themeMatch(e) {
		return this._theme.match(e);
	}
	grammarForScopeName(e, t, n, r, i) {
		if (!this._grammars.has(e)) {
			let a = this._rawGrammars.get(e);
			if (!a) return null;
			this._grammars.set(e, gt(e, a, t, n, r, i, this, this._onigLib));
		}
		return this._grammars.get(e);
	}
}, Dt = class {
	_options;
	_syncRegistry;
	_ensureGrammarCache;
	constructor(e) {
		this._options = e, this._syncRegistry = new Et(ce.createFromRawTheme(e.theme, e.colorMap), e.onigLib), this._ensureGrammarCache = /* @__PURE__ */ new Map();
	}
	dispose() {
		this._syncRegistry.dispose();
	}
	setTheme(e, t) {
		this._syncRegistry.setTheme(ce.createFromRawTheme(e, t));
	}
	getColorMap() {
		return this._syncRegistry.getColorMap();
	}
	loadGrammarWithEmbeddedLanguages(e, t, n) {
		return this.loadGrammarWithConfiguration(e, t, { embeddedLanguages: n });
	}
	loadGrammarWithConfiguration(e, t, n) {
		return this._loadGrammar(e, t, n.embeddedLanguages, n.tokenTypes, new wt(n.balancedBracketSelectors || [], n.unbalancedBracketSelectors || []));
	}
	loadGrammar(e) {
		return this._loadGrammar(e, 0, null, null, null);
	}
	_loadGrammar(e, t, n, r, i) {
		let a = new Ae(this._syncRegistry, e);
		for (; a.Q.length > 0;) a.Q.map((e) => this._loadSingleGrammar(e.scopeName)), a.processQueue();
		return this._grammarForScopeName(e, t, n, r, i);
	}
	_loadSingleGrammar(e) {
		this._ensureGrammarCache.has(e) || (this._doLoadSingleGrammar(e), this._ensureGrammarCache.set(e, !0));
	}
	_doLoadSingleGrammar(e) {
		let t = this._options.loadGrammar(e);
		if (t) {
			let n = typeof this._options.getInjections == "function" ? this._options.getInjections(e) : void 0;
			this._syncRegistry.addGrammar(t, n);
		}
	}
	addGrammar(e, t = [], n = 0, r = null) {
		return this._syncRegistry.addGrammar(e, t), this._grammarForScopeName(e.scopeName, n, r);
	}
	_grammarForScopeName(e, t = 0, n = null, r = null, i = null) {
		return this._syncRegistry.grammarForScopeName(e, t, n, r, i);
	}
}, Ot = Ct.NULL, kt = class {
	constructor(e, t, n) {
		this.normal = t, this.property = e, n && (this.space = n);
	}
};
kt.prototype.normal = {}, kt.prototype.property = {}, kt.prototype.space = void 0;
// node_modules/hast-util-to-html/node_modules/property-information/lib/util/merge.js
function At(e, t) {
	let n = {}, r = {};
	for (let t of e) Object.assign(n, t.property), Object.assign(r, t.normal);
	return new kt(n, r, t);
}
// node_modules/hast-util-to-html/node_modules/property-information/lib/normalize.js
function jt(e) {
	return e.toLowerCase();
}
// node_modules/hast-util-to-html/node_modules/property-information/lib/util/info.js
var y = class {
	constructor(e, t) {
		this.attribute = t, this.property = e;
	}
};
y.prototype.attribute = "", y.prototype.booleanish = !1, y.prototype.boolean = !1, y.prototype.commaOrSpaceSeparated = !1, y.prototype.commaSeparated = !1, y.prototype.defined = !1, y.prototype.mustUseProperty = !1, y.prototype.number = !1, y.prototype.overloadedBoolean = !1, y.prototype.property = "", y.prototype.spaceSeparated = !1, y.prototype.space = void 0;
// node_modules/hast-util-to-html/node_modules/property-information/lib/util/types.js
var Mt = /* @__PURE__ */ t({
	boolean: () => b,
	booleanish: () => x,
	commaOrSpaceSeparated: () => T,
	commaSeparated: () => w,
	number: () => S,
	overloadedBoolean: () => Pt,
	spaceSeparated: () => C
}), Nt = 0, b = E(), x = E(), Pt = E(), S = E(), C = E(), w = E(), T = E();
function E() {
	return 2 ** ++Nt;
}
// node_modules/hast-util-to-html/node_modules/property-information/lib/util/defined-info.js
var Ft = Object.keys(Mt), It = class extends y {
	constructor(e, t, n, r) {
		let i = -1;
		if (super(e, t), Lt(this, "space", r), typeof n == "number") for (; ++i < Ft.length;) {
			let e = Ft[i];
			Lt(this, Ft[i], (n & Mt[e]) === Mt[e]);
		}
	}
};
It.prototype.defined = !0;
function Lt(e, t, n) {
	n && (e[t] = n);
}
// node_modules/hast-util-to-html/node_modules/property-information/lib/util/create.js
function D(e) {
	let t = {}, n = {};
	for (let [r, i] of Object.entries(e.properties)) {
		let a = new It(r, e.transform(e.attributes || {}, r), i, e.space);
		e.mustUseProperty && e.mustUseProperty.includes(r) && (a.mustUseProperty = !0), t[r] = a, n[jt(r)] = r, n[jt(a.attribute)] = r;
	}
	return new kt(t, n, e.space);
}
// node_modules/hast-util-to-html/node_modules/property-information/lib/aria.js
var Rt = D({
	properties: {
		ariaActiveDescendant: null,
		ariaAtomic: x,
		ariaAutoComplete: null,
		ariaBusy: x,
		ariaChecked: x,
		ariaColCount: S,
		ariaColIndex: S,
		ariaColSpan: S,
		ariaControls: C,
		ariaCurrent: null,
		ariaDescribedBy: C,
		ariaDetails: null,
		ariaDisabled: x,
		ariaDropEffect: C,
		ariaErrorMessage: null,
		ariaExpanded: x,
		ariaFlowTo: C,
		ariaGrabbed: x,
		ariaHasPopup: null,
		ariaHidden: x,
		ariaInvalid: null,
		ariaKeyShortcuts: null,
		ariaLabel: null,
		ariaLabelledBy: C,
		ariaLevel: S,
		ariaLive: null,
		ariaModal: x,
		ariaMultiLine: x,
		ariaMultiSelectable: x,
		ariaOrientation: null,
		ariaOwns: C,
		ariaPlaceholder: null,
		ariaPosInSet: S,
		ariaPressed: x,
		ariaReadOnly: x,
		ariaRelevant: null,
		ariaRequired: x,
		ariaRoleDescription: C,
		ariaRowCount: S,
		ariaRowIndex: S,
		ariaRowSpan: S,
		ariaSelected: x,
		ariaSetSize: S,
		ariaSort: null,
		ariaValueMax: S,
		ariaValueMin: S,
		ariaValueNow: S,
		ariaValueText: null,
		role: null
	},
	transform(e, t) {
		return t === "role" ? t : "aria-" + t.slice(4).toLowerCase();
	}
});
// node_modules/hast-util-to-html/node_modules/property-information/lib/util/case-sensitive-transform.js
function zt(e, t) {
	return t in e ? e[t] : t;
}
// node_modules/hast-util-to-html/node_modules/property-information/lib/util/case-insensitive-transform.js
function Bt(e, t) {
	return zt(e, t.toLowerCase());
}
// node_modules/hast-util-to-html/node_modules/property-information/lib/html.js
var Vt = D({
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
		accept: w,
		acceptCharset: C,
		accessKey: C,
		action: null,
		allow: null,
		allowFullScreen: b,
		allowPaymentRequest: b,
		allowUserMedia: b,
		alpha: b,
		alt: null,
		as: null,
		async: b,
		autoCapitalize: null,
		autoComplete: C,
		autoFocus: b,
		autoPlay: b,
		blocking: C,
		capture: null,
		charSet: null,
		checked: b,
		cite: null,
		className: C,
		closedBy: null,
		colorSpace: null,
		cols: S,
		colSpan: S,
		command: null,
		commandFor: null,
		content: null,
		contentEditable: x,
		controls: b,
		controlsList: C,
		coords: S | w,
		crossOrigin: null,
		data: null,
		dateTime: null,
		decoding: null,
		default: b,
		defer: b,
		dir: null,
		dirName: null,
		disabled: b,
		download: Pt,
		draggable: x,
		encType: null,
		enterKeyHint: null,
		fetchPriority: null,
		form: null,
		formAction: null,
		formEncType: null,
		formMethod: null,
		formNoValidate: b,
		formTarget: null,
		headers: C,
		height: S,
		hidden: Pt,
		high: S,
		href: null,
		hrefLang: null,
		htmlFor: C,
		httpEquiv: C,
		id: null,
		imageSizes: null,
		imageSrcSet: null,
		inert: b,
		inputMode: null,
		integrity: null,
		is: null,
		isMap: b,
		itemId: null,
		itemProp: C,
		itemRef: C,
		itemScope: b,
		itemType: C,
		kind: null,
		label: null,
		lang: null,
		language: null,
		list: null,
		loading: null,
		loop: b,
		low: S,
		manifest: null,
		max: null,
		maxLength: S,
		media: null,
		method: null,
		min: null,
		minLength: S,
		multiple: b,
		muted: b,
		name: null,
		nonce: null,
		noModule: b,
		noValidate: b,
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
		open: b,
		optimum: S,
		pattern: null,
		ping: C,
		placeholder: null,
		playsInline: b,
		popover: null,
		popoverTarget: null,
		popoverTargetAction: null,
		poster: null,
		preload: null,
		readOnly: b,
		referrerPolicy: null,
		rel: C,
		required: b,
		reversed: b,
		rows: S,
		rowSpan: S,
		sandbox: C,
		scope: null,
		scoped: b,
		seamless: b,
		selected: b,
		shadowRootClonable: b,
		shadowRootCustomElementRegistry: b,
		shadowRootDelegatesFocus: b,
		shadowRootMode: null,
		shadowRootSerializable: b,
		shape: null,
		size: S,
		sizes: null,
		slot: null,
		span: S,
		spellCheck: x,
		src: null,
		srcDoc: null,
		srcLang: null,
		srcSet: null,
		start: S,
		step: null,
		style: null,
		tabIndex: S,
		target: null,
		title: null,
		translate: null,
		type: null,
		typeMustMatch: b,
		useMap: null,
		value: x,
		width: S,
		wrap: null,
		writingSuggestions: null,
		align: null,
		aLink: null,
		archive: C,
		axis: null,
		background: null,
		bgColor: null,
		border: S,
		borderColor: null,
		bottomMargin: S,
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
		compact: b,
		declare: b,
		event: null,
		face: null,
		frame: null,
		frameBorder: null,
		hSpace: S,
		leftMargin: S,
		link: null,
		longDesc: null,
		lowSrc: null,
		marginHeight: S,
		marginWidth: S,
		noResize: b,
		noHref: b,
		noShade: b,
		noWrap: b,
		object: null,
		profile: null,
		prompt: null,
		rev: null,
		rightMargin: S,
		rules: null,
		scheme: null,
		scrolling: x,
		standby: null,
		summary: null,
		text: null,
		topMargin: S,
		valueType: null,
		version: null,
		vAlign: null,
		vLink: null,
		vSpace: S,
		allowTransparency: null,
		autoCorrect: null,
		autoSave: null,
		credentialless: b,
		disablePictureInPicture: b,
		disableRemotePlayback: b,
		exportParts: w,
		part: C,
		prefix: null,
		property: null,
		results: S,
		security: null,
		unselectable: null
	},
	space: "html",
	transform: Bt
}), Ht = D({
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
		about: T,
		accentHeight: S,
		accumulate: null,
		additive: null,
		alignmentBaseline: null,
		alphabetic: S,
		amplitude: S,
		arabicForm: null,
		ascent: S,
		attributeName: null,
		attributeType: null,
		azimuth: S,
		bandwidth: null,
		baselineShift: null,
		baseFrequency: null,
		baseProfile: null,
		bbox: null,
		begin: null,
		bias: S,
		by: null,
		calcMode: null,
		capHeight: S,
		className: C,
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
		descent: S,
		diffuseConstant: S,
		direction: null,
		display: null,
		dur: null,
		divisor: S,
		dominantBaseline: null,
		download: b,
		dx: null,
		dy: null,
		edgeMode: null,
		editable: null,
		elevation: S,
		enableBackground: null,
		end: null,
		event: null,
		exponent: S,
		externalResourcesRequired: null,
		fill: null,
		fillOpacity: S,
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
		g1: w,
		g2: w,
		glyphName: w,
		glyphOrientationHorizontal: null,
		glyphOrientationVertical: null,
		glyphRef: null,
		gradientTransform: null,
		gradientUnits: null,
		handler: null,
		hanging: S,
		hatchContentUnits: null,
		hatchUnits: null,
		height: null,
		href: null,
		hrefLang: null,
		horizAdvX: S,
		horizOriginX: S,
		horizOriginY: S,
		id: null,
		ideographic: S,
		imageRendering: null,
		initialVisibility: null,
		in: null,
		in2: null,
		intercept: S,
		k: S,
		k1: S,
		k2: S,
		k3: S,
		k4: S,
		kernelMatrix: T,
		kernelUnitLength: null,
		keyPoints: null,
		keySplines: null,
		keyTimes: null,
		kerning: null,
		lang: null,
		lengthAdjust: null,
		letterSpacing: null,
		lightingColor: null,
		limitingConeAngle: S,
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
		mediaSize: S,
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
		overlinePosition: S,
		overlineThickness: S,
		paintOrder: null,
		panose1: null,
		path: null,
		pathLength: S,
		patternContentUnits: null,
		patternTransform: null,
		patternUnits: null,
		phase: null,
		ping: C,
		pitch: null,
		playbackOrder: null,
		pointerEvents: null,
		points: null,
		pointsAtX: S,
		pointsAtY: S,
		pointsAtZ: S,
		preserveAlpha: null,
		preserveAspectRatio: null,
		primitiveUnits: null,
		propagate: null,
		property: T,
		r: null,
		radius: null,
		referrerPolicy: null,
		refX: null,
		refY: null,
		rel: T,
		rev: T,
		renderingIntent: null,
		repeatCount: null,
		repeatDur: null,
		requiredExtensions: T,
		requiredFeatures: T,
		requiredFonts: T,
		requiredFormats: T,
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
		specularConstant: S,
		specularExponent: S,
		spreadMethod: null,
		spacing: null,
		startOffset: null,
		stdDeviation: null,
		stemh: null,
		stemv: null,
		stitchTiles: null,
		stopColor: null,
		stopOpacity: null,
		strikethroughPosition: S,
		strikethroughThickness: S,
		string: null,
		stroke: null,
		strokeDashArray: T,
		strokeDashOffset: null,
		strokeLineCap: null,
		strokeLineJoin: null,
		strokeMiterLimit: S,
		strokeOpacity: S,
		strokeWidth: null,
		style: null,
		surfaceScale: S,
		syncBehavior: null,
		syncBehaviorDefault: null,
		syncMaster: null,
		syncTolerance: null,
		syncToleranceDefault: null,
		systemLanguage: T,
		tabIndex: S,
		tableValues: null,
		target: null,
		targetX: S,
		targetY: S,
		textAnchor: null,
		textDecoration: null,
		textRendering: null,
		textLength: null,
		timelineBegin: null,
		title: null,
		transformBehavior: null,
		type: null,
		typeOf: T,
		to: null,
		transform: null,
		transformOrigin: null,
		u1: null,
		u2: null,
		underlinePosition: S,
		underlineThickness: S,
		unicode: null,
		unicodeBidi: null,
		unicodeRange: null,
		unitsPerEm: S,
		values: null,
		vAlphabetic: S,
		vMathematical: S,
		vectorEffect: null,
		vHanging: S,
		vIdeographic: S,
		version: null,
		vertAdvY: S,
		vertOriginX: S,
		vertOriginY: S,
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
		xHeight: S,
		y: null,
		y1: null,
		y2: null,
		yChannelSelector: null,
		z: null,
		zoomAndPan: null
	},
	space: "svg",
	transform: zt
}), Ut = D({
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
}), Wt = D({
	attributes: { xmlnsxlink: "xmlns:xlink" },
	properties: {
		xmlnsXLink: null,
		xmlns: null
	},
	space: "xmlns",
	transform: Bt
}), Gt = D({
	properties: {
		xmlBase: null,
		xmlLang: null,
		xmlSpace: null
	},
	space: "xml",
	transform(e, t) {
		return "xml:" + t.slice(3).toLowerCase();
	}
}), Kt = /[A-Z]/g, qt = /-[a-z]/g, Jt = /^data[-\w.:]+$/i;
function Yt(e, t) {
	let n = jt(t), r = t, i = y;
	if (n in e.normal) return e.property[e.normal[n]];
	if (n.length > 4 && n.slice(0, 4) === "data" && Jt.test(t)) {
		if (t.charAt(4) === "-") {
			let e = t.slice(5).replace(qt, Zt);
			r = "data" + e.charAt(0).toUpperCase() + e.slice(1);
		} else {
			let e = t.slice(4);
			if (!qt.test(e)) {
				let n = e.replace(Kt, Xt);
				n.charAt(0) !== "-" && (n = "-" + n), t = "data" + n;
			}
		}
		i = It;
	}
	return new i(r, t);
}
function Xt(e) {
	return "-" + e.toLowerCase();
}
function Zt(e) {
	return e.charAt(1).toUpperCase();
}
// node_modules/hast-util-to-html/node_modules/property-information/index.js
var Qt = At([
	Rt,
	Vt,
	Ut,
	Wt,
	Gt
], "html"), $t = At([
	Rt,
	Ht,
	Ut,
	Wt,
	Gt
], "svg"), en = /["&'<>`]/g, tn = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g, nn = /[\x01-\t\v\f\x0E-\x1F\x7F\x81\x8D\x8F\x90\x9D\xA0-\uFFFF]/g, rn = /[|\\{}()[\]^$+*?.]/g, an = /* @__PURE__ */ new WeakMap();
function on(e, t) {
	return e = e.replace(t.subset ? sn(t.subset) : en, r), t.subset || t.escapeOnly ? e : e.replace(tn, n).replace(nn, r);
	function n(e, n, r) {
		return t.format((e.charCodeAt(0) - 55296) * 1024 + e.charCodeAt(1) - 56320 + 65536, r.charCodeAt(n + 2), t);
	}
	function r(e, n, r) {
		return t.format(e.charCodeAt(0), r.charCodeAt(n + 1), t);
	}
}
function sn(e) {
	let t = an.get(e);
	return t || (t = cn(e), an.set(e, t)), t;
}
function cn(e) {
	let t = [], n = -1;
	for (; ++n < e.length;) t.push(e[n].replace(rn, "\\$&"));
	return RegExp("(?:" + t.join("|") + ")", "g");
}
// node_modules/stringify-entities/lib/util/to-hexadecimal.js
var ln = /[\dA-Fa-f]/;
function un(e, t, n) {
	let r = "&#x" + e.toString(16).toUpperCase();
	return n && t && !ln.test(String.fromCharCode(t)) ? r : r + ";";
}
// node_modules/stringify-entities/lib/util/to-decimal.js
var dn = /\d/;
function fn(e, t, n) {
	let r = "&#" + String(e);
	return n && t && !dn.test(String.fromCharCode(t)) ? r : r + ";";
}
// node_modules/character-entities-legacy/index.js
var pn = /* @__PURE__ */ "AElig.AMP.Aacute.Acirc.Agrave.Aring.Atilde.Auml.COPY.Ccedil.ETH.Eacute.Ecirc.Egrave.Euml.GT.Iacute.Icirc.Igrave.Iuml.LT.Ntilde.Oacute.Ocirc.Ograve.Oslash.Otilde.Ouml.QUOT.REG.THORN.Uacute.Ucirc.Ugrave.Uuml.Yacute.aacute.acirc.acute.aelig.agrave.amp.aring.atilde.auml.brvbar.ccedil.cedil.cent.copy.curren.deg.divide.eacute.ecirc.egrave.eth.euml.frac12.frac14.frac34.gt.iacute.icirc.iexcl.igrave.iquest.iuml.laquo.lt.macr.micro.middot.nbsp.not.ntilde.oacute.ocirc.ograve.ordf.ordm.oslash.otilde.ouml.para.plusmn.pound.quot.raquo.reg.sect.shy.sup1.sup2.sup3.szlig.thorn.times.uacute.ucirc.ugrave.uml.uuml.yacute.yen.yuml".split("."), mn = {
	nbsp: "\xA0",
	iexcl: "¡",
	cent: "¢",
	pound: "£",
	curren: "¤",
	yen: "¥",
	brvbar: "¦",
	sect: "§",
	uml: "¨",
	copy: "©",
	ordf: "ª",
	laquo: "«",
	not: "¬",
	shy: "­",
	reg: "®",
	macr: "¯",
	deg: "°",
	plusmn: "±",
	sup2: "²",
	sup3: "³",
	acute: "´",
	micro: "µ",
	para: "¶",
	middot: "·",
	cedil: "¸",
	sup1: "¹",
	ordm: "º",
	raquo: "»",
	frac14: "¼",
	frac12: "½",
	frac34: "¾",
	iquest: "¿",
	Agrave: "À",
	Aacute: "Á",
	Acirc: "Â",
	Atilde: "Ã",
	Auml: "Ä",
	Aring: "Å",
	AElig: "Æ",
	Ccedil: "Ç",
	Egrave: "È",
	Eacute: "É",
	Ecirc: "Ê",
	Euml: "Ë",
	Igrave: "Ì",
	Iacute: "Í",
	Icirc: "Î",
	Iuml: "Ï",
	ETH: "Ð",
	Ntilde: "Ñ",
	Ograve: "Ò",
	Oacute: "Ó",
	Ocirc: "Ô",
	Otilde: "Õ",
	Ouml: "Ö",
	times: "×",
	Oslash: "Ø",
	Ugrave: "Ù",
	Uacute: "Ú",
	Ucirc: "Û",
	Uuml: "Ü",
	Yacute: "Ý",
	THORN: "Þ",
	szlig: "ß",
	agrave: "à",
	aacute: "á",
	acirc: "â",
	atilde: "ã",
	auml: "ä",
	aring: "å",
	aelig: "æ",
	ccedil: "ç",
	egrave: "è",
	eacute: "é",
	ecirc: "ê",
	euml: "ë",
	igrave: "ì",
	iacute: "í",
	icirc: "î",
	iuml: "ï",
	eth: "ð",
	ntilde: "ñ",
	ograve: "ò",
	oacute: "ó",
	ocirc: "ô",
	otilde: "õ",
	ouml: "ö",
	divide: "÷",
	oslash: "ø",
	ugrave: "ù",
	uacute: "ú",
	ucirc: "û",
	uuml: "ü",
	yacute: "ý",
	thorn: "þ",
	yuml: "ÿ",
	fnof: "ƒ",
	Alpha: "Α",
	Beta: "Β",
	Gamma: "Γ",
	Delta: "Δ",
	Epsilon: "Ε",
	Zeta: "Ζ",
	Eta: "Η",
	Theta: "Θ",
	Iota: "Ι",
	Kappa: "Κ",
	Lambda: "Λ",
	Mu: "Μ",
	Nu: "Ν",
	Xi: "Ξ",
	Omicron: "Ο",
	Pi: "Π",
	Rho: "Ρ",
	Sigma: "Σ",
	Tau: "Τ",
	Upsilon: "Υ",
	Phi: "Φ",
	Chi: "Χ",
	Psi: "Ψ",
	Omega: "Ω",
	alpha: "α",
	beta: "β",
	gamma: "γ",
	delta: "δ",
	epsilon: "ε",
	zeta: "ζ",
	eta: "η",
	theta: "θ",
	iota: "ι",
	kappa: "κ",
	lambda: "λ",
	mu: "μ",
	nu: "ν",
	xi: "ξ",
	omicron: "ο",
	pi: "π",
	rho: "ρ",
	sigmaf: "ς",
	sigma: "σ",
	tau: "τ",
	upsilon: "υ",
	phi: "φ",
	chi: "χ",
	psi: "ψ",
	omega: "ω",
	thetasym: "ϑ",
	upsih: "ϒ",
	piv: "ϖ",
	bull: "•",
	hellip: "…",
	prime: "′",
	Prime: "″",
	oline: "‾",
	frasl: "⁄",
	weierp: "℘",
	image: "ℑ",
	real: "ℜ",
	trade: "™",
	alefsym: "ℵ",
	larr: "←",
	uarr: "↑",
	rarr: "→",
	darr: "↓",
	harr: "↔",
	crarr: "↵",
	lArr: "⇐",
	uArr: "⇑",
	rArr: "⇒",
	dArr: "⇓",
	hArr: "⇔",
	forall: "∀",
	part: "∂",
	exist: "∃",
	empty: "∅",
	nabla: "∇",
	isin: "∈",
	notin: "∉",
	ni: "∋",
	prod: "∏",
	sum: "∑",
	minus: "−",
	lowast: "∗",
	radic: "√",
	prop: "∝",
	infin: "∞",
	ang: "∠",
	and: "∧",
	or: "∨",
	cap: "∩",
	cup: "∪",
	int: "∫",
	there4: "∴",
	sim: "∼",
	cong: "≅",
	asymp: "≈",
	ne: "≠",
	equiv: "≡",
	le: "≤",
	ge: "≥",
	sub: "⊂",
	sup: "⊃",
	nsub: "⊄",
	sube: "⊆",
	supe: "⊇",
	oplus: "⊕",
	otimes: "⊗",
	perp: "⊥",
	sdot: "⋅",
	lceil: "⌈",
	rceil: "⌉",
	lfloor: "⌊",
	rfloor: "⌋",
	lang: "〈",
	rang: "〉",
	loz: "◊",
	spades: "♠",
	clubs: "♣",
	hearts: "♥",
	diams: "♦",
	quot: "\"",
	amp: "&",
	lt: "<",
	gt: ">",
	OElig: "Œ",
	oelig: "œ",
	Scaron: "Š",
	scaron: "š",
	Yuml: "Ÿ",
	circ: "ˆ",
	tilde: "˜",
	ensp: " ",
	emsp: " ",
	thinsp: " ",
	zwnj: "‌",
	zwj: "‍",
	lrm: "‎",
	rlm: "‏",
	ndash: "–",
	mdash: "—",
	lsquo: "‘",
	rsquo: "’",
	sbquo: "‚",
	ldquo: "“",
	rdquo: "”",
	bdquo: "„",
	dagger: "†",
	Dagger: "‡",
	permil: "‰",
	lsaquo: "‹",
	rsaquo: "›",
	euro: "€"
}, hn = [
	"cent",
	"copy",
	"divide",
	"gt",
	"lt",
	"not",
	"para",
	"times"
], gn = {}.hasOwnProperty, _n = {}, vn;
for (vn in mn) gn.call(mn, vn) && (_n[mn[vn]] = vn);
var yn = /[^\dA-Za-z]/;
function bn(e, t, n, r) {
	let i = String.fromCharCode(e);
	if (gn.call(_n, i)) {
		let e = _n[i], a = "&" + e;
		return n && pn.includes(e) && !hn.includes(e) && (!r || t && t !== 61 && yn.test(String.fromCharCode(t))) ? a : a + ";";
	}
	return "";
}
// node_modules/stringify-entities/lib/util/format-smart.js
function xn(e, t, n) {
	let r = un(e, t, n.omitOptionalSemicolons), i;
	if ((n.useNamedReferences || n.useShortestReferences) && (i = bn(e, t, n.omitOptionalSemicolons, n.attribute)), (n.useShortestReferences || !i) && n.useShortestReferences) {
		let i = fn(e, t, n.omitOptionalSemicolons);
		i.length < r.length && (r = i);
	}
	return i && (!n.useShortestReferences || i.length < r.length) ? i : r;
}
// node_modules/stringify-entities/lib/index.js
function Sn(e, t) {
	return on(e, Object.assign({ format: xn }, t));
}
// node_modules/hast-util-to-html/lib/handle/comment.js
var Cn = /^>|^->|<!--|-->|--!>|<!-$/g, wn = [">"], Tn = ["<", ">"];
function En(e, t, n, r) {
	return r.settings.bogusComments ? "<?" + Sn(e.value, Object.assign({}, r.settings.characterReferences, { subset: wn })) + ">" : "<!--" + e.value.replace(Cn, i) + "-->";
	function i(e) {
		return Sn(e, Object.assign({}, r.settings.characterReferences, { subset: Tn }));
	}
}
// node_modules/hast-util-to-html/lib/handle/doctype.js
function Dn(e, t, n, r) {
	return "<!" + (r.settings.upperDoctype ? "DOCTYPE" : "doctype") + (r.settings.tightDoctype ? "" : " ") + "html>";
}
// node_modules/hast-util-to-html/node_modules/hast-util-whitespace/lib/index.js
var On = /[ \t\n\f\r]/g;
function kn(e) {
	return typeof e == "object" ? e.type === "text" && An(e.value) : An(e);
}
function An(e) {
	return e.replace(On, "") === "";
}
// node_modules/hast-util-to-html/lib/omission/util/siblings.js
var O = Nn(1), jn = Nn(-1), Mn = [];
function Nn(e) {
	return t;
	function t(t, n, r) {
		let i = t ? t.children : Mn, a = (n || 0) + e, o = i[a];
		if (!r) for (; o && kn(o);) a += e, o = i[a];
		return o;
	}
}
// node_modules/hast-util-to-html/lib/omission/omission.js
var Pn = {}.hasOwnProperty;
function Fn(e) {
	return t;
	function t(t, n, r) {
		return Pn.call(e, t.tagName) && e[t.tagName](t, n, r);
	}
}
// node_modules/hast-util-to-html/lib/omission/closing.js
var In = Fn({
	body: zn,
	caption: Ln,
	colgroup: Ln,
	dd: Un,
	dt: Hn,
	head: Ln,
	html: Rn,
	li: Vn,
	optgroup: Gn,
	option: Kn,
	p: Bn,
	rp: Wn,
	rt: Wn,
	tbody: Jn,
	td: Zn,
	tfoot: Yn,
	th: Zn,
	thead: qn,
	tr: Xn
});
function Ln(e, t, n) {
	let r = O(n, t, !0);
	return !r || r.type !== "comment" && !(r.type === "text" && kn(r.value.charAt(0)));
}
function Rn(e, t, n) {
	let r = O(n, t);
	return !r || r.type !== "comment";
}
function zn(e, t, n) {
	let r = O(n, t);
	return !r || r.type !== "comment";
}
function Bn(e, t, n) {
	let r = O(n, t);
	return r ? r.type === "element" && (r.tagName === "address" || r.tagName === "article" || r.tagName === "aside" || r.tagName === "blockquote" || r.tagName === "details" || r.tagName === "div" || r.tagName === "dl" || r.tagName === "fieldset" || r.tagName === "figcaption" || r.tagName === "figure" || r.tagName === "footer" || r.tagName === "form" || r.tagName === "h1" || r.tagName === "h2" || r.tagName === "h3" || r.tagName === "h4" || r.tagName === "h5" || r.tagName === "h6" || r.tagName === "header" || r.tagName === "hgroup" || r.tagName === "hr" || r.tagName === "main" || r.tagName === "menu" || r.tagName === "nav" || r.tagName === "ol" || r.tagName === "p" || r.tagName === "pre" || r.tagName === "section" || r.tagName === "table" || r.tagName === "ul") : !n || n.type !== "element" || n.tagName !== "a" && n.tagName !== "audio" && n.tagName !== "del" && n.tagName !== "ins" && n.tagName !== "map" && n.tagName !== "noscript" && n.tagName !== "video" && !n.tagName.includes("-");
}
function Vn(e, t, n) {
	let r = O(n, t);
	return !r || r.type === "element" && r.tagName === "li";
}
function Hn(e, t, n) {
	let r = O(n, t);
	return !(!r || r.type !== "element" || r.tagName !== "dt" && r.tagName !== "dd");
}
function Un(e, t, n) {
	let r = O(n, t);
	return !r || r.type === "element" && (r.tagName === "dt" || r.tagName === "dd");
}
function Wn(e, t, n) {
	let r = O(n, t);
	return !r || r.type === "element" && (r.tagName === "rp" || r.tagName === "rt");
}
function Gn(e, t, n) {
	let r = O(n, t);
	return !r || r.type === "element" && r.tagName === "optgroup";
}
function Kn(e, t, n) {
	let r = O(n, t);
	return !r || r.type === "element" && (r.tagName === "option" || r.tagName === "optgroup");
}
function qn(e, t, n) {
	let r = O(n, t);
	return !(!r || r.type !== "element" || r.tagName !== "tbody" && r.tagName !== "tfoot");
}
function Jn(e, t, n) {
	let r = O(n, t);
	return !r || r.type === "element" && (r.tagName === "tbody" || r.tagName === "tfoot");
}
function Yn(e, t, n) {
	return !O(n, t);
}
function Xn(e, t, n) {
	let r = O(n, t);
	return !r || r.type === "element" && r.tagName === "tr";
}
function Zn(e, t, n) {
	let r = O(n, t);
	return !r || r.type === "element" && (r.tagName === "td" || r.tagName === "th");
}
// node_modules/hast-util-to-html/lib/omission/opening.js
var Qn = Fn({
	body: tr,
	colgroup: nr,
	head: er,
	html: $n,
	tbody: rr
});
function $n(e) {
	let t = O(e, -1);
	return !t || t.type !== "comment";
}
function er(e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e.children) if (n.type === "element" && (n.tagName === "base" || n.tagName === "title")) {
		if (t.has(n.tagName)) return !1;
		t.add(n.tagName);
	}
	let n = e.children[0];
	return !n || n.type === "element";
}
function tr(e) {
	let t = O(e, -1, !0);
	return !t || t.type !== "comment" && !(t.type === "text" && kn(t.value.charAt(0))) && (t.type !== "element" || t.tagName !== "meta" && t.tagName !== "link" && t.tagName !== "script" && t.tagName !== "style" && t.tagName !== "template");
}
function nr(e, t, n) {
	let r = jn(n, t);
	if (n && r && r.type === "element" && r.tagName === "colgroup" && In(r, n.children.indexOf(r), n)) return !1;
	let i = O(e, -1, !0);
	return !!(i && i.type === "element" && i.tagName === "col");
}
function rr(e, t, n) {
	let r = jn(n, t);
	if (n && r && r.type === "element" && (r.tagName === "thead" || r.tagName === "tbody") && In(r, n.children.indexOf(r), n)) return !1;
	let i = O(e, -1);
	return !!(i && i.type === "element" && i.tagName === "tr");
}
// node_modules/hast-util-to-html/lib/handle/element.js
var ir = {
	name: [["	\n\f\r &/=>".split(""), "	\n\f\r \"&'/=>`".split("")], ["\0	\n\f\r \"&'/<=>".split(""), "\0	\n\f\r \"&'/<=>`".split("")]],
	unquoted: [["	\n\f\r &>".split(""), "\0	\n\f\r \"&'<=>`".split("")], ["\0	\n\f\r \"&'<=>`".split(""), "\0	\n\f\r \"&'<=>`".split("")]],
	single: [["&'".split(""), "\"&'`".split("")], ["\0&'".split(""), "\0\"&'`".split("")]],
	double: [["\"&".split(""), "\"&'`".split("")], ["\0\"&".split(""), "\0\"&'`".split("")]]
}, ar = /* @__PURE__ */ new Set([
	"desc",
	"foreignObject",
	"title"
]);
function or(e, t, n, r) {
	let { schema: i } = r, a = i.space !== "svg" && r.settings.omitOptionalTags, o = i.space === "svg" ? r.settings.closeEmptyElements : r.settings.voids.includes(e.tagName.toLowerCase()), s = [];
	i.space === "html" && e.tagName === "svg" && (r.schema = $t);
	let c = sr(r, e.properties);
	r.schema.space === "svg" && ar.has(e.tagName) && (r.schema = Qt);
	let l = r.all(i.space === "html" && e.tagName === "template" ? e.content : e);
	if (r.schema = i, l && (o = !1), c || !a || !Qn(e, t, n)) {
		if (s.push("<", e.tagName, c ? " " + c : ""), o && (i.space === "svg" || r.settings.closeSelfClosing)) {
			let e = c.charAt(c.length - 1);
			(!r.settings.tightSelfClosing || e === "/" || e && e !== "\"" && e !== "'") && s.push(" "), s.push("/");
		}
		s.push(">");
	}
	return s.push(l), o || a && In(e, t, n) || s.push("</" + e.tagName + ">"), s.join("");
}
function sr(e, t) {
	let n = [], r = -1, i;
	if (t) {
		for (i in t) if (t[i] !== null && t[i] !== void 0) {
			let r = cr(e, i, t[i]);
			r && n.push(r);
		}
	}
	for (; ++r < n.length;) {
		let t = e.settings.tightAttributes ? n[r].charAt(n[r].length - 1) : void 0;
		r !== n.length - 1 && t !== "\"" && t !== "'" && (n[r] += " ");
	}
	return n.join("");
}
function cr(e, t, n) {
	let r = Yt(e.schema, t), a = e.settings.allowParseErrors && e.schema.space === "html" ? 0 : 1, s = +!e.settings.allowDangerousCharacters;
	if (r.overloadedBoolean && (n === r.attribute || n === "") ? n = !0 : (r.boolean || r.overloadedBoolean) && (typeof n != "string" || n === r.attribute || n === "") && (n = !!n), n == null || n === !1 || typeof n == "number" && Number.isNaN(n)) return "";
	let c = Sn(r.attribute, Object.assign({}, e.settings.characterReferences, { subset: ir.name[a][s] }));
	if (n === !0 || (n = Array.isArray(n) ? (r.commaSeparated ? l : i)(n, { padLeft: !e.settings.tightCommaSeparatedLists }) : String(n), e.settings.collapseEmptyAttributes && !n)) return c;
	let u;
	if (e.settings.preferUnquoted && (u = Sn(n, Object.assign({}, e.settings.characterReferences, {
		attribute: !0,
		subset: ir.unquoted[a][s]
	}))), u !== n) {
		let { quote: t } = e;
		e.settings.quoteSmart && o(n, t) > o(n, e.alternative) && (t = e.alternative), u = t + Sn(n, Object.assign({}, e.settings.characterReferences, {
			subset: (t === "'" ? ir.single : ir.double)[a][s],
			attribute: !0
		})) + t;
	}
	return c + (u && "=" + u);
}
// node_modules/hast-util-to-html/lib/handle/text.js
var lr = ["<", "&"];
function ur(e, t, n, r) {
	return n && n.type === "element" && (n.tagName === "script" || n.tagName === "style") ? e.value : Sn(e.value, Object.assign({}, r.settings.characterReferences, { subset: lr }));
}
// node_modules/hast-util-to-html/lib/handle/raw.js
function dr(e, t, n, r) {
	return r.settings.allowDangerousHtml ? e.value : ur(e, t, n, r);
}
// node_modules/hast-util-to-html/lib/handle/root.js
function fr(e, t, n, r) {
	return r.all(e);
}
// node_modules/hast-util-to-html/lib/handle/index.js
var pr = r("type", {
	invalid: mr,
	unknown: hr,
	handlers: {
		comment: En,
		doctype: Dn,
		element: or,
		raw: dr,
		root: fr,
		text: ur
	}
});
function mr(e) {
	throw Error("Expected node, not `" + e + "`");
}
function hr(e) {
	throw Error("Cannot compile unknown node `" + e.type + "`");
}
// node_modules/hast-util-to-html/lib/index.js
var gr = {}, _r = {}, vr = [];
function yr(e, t) {
	let n = t || gr, r = n.quote || "\"";
	if (r !== "\"" && r !== "'") throw Error("Invalid quote `" + r + "`, expected `'` or `\"`");
	let i = r === "\"" ? "'" : "\"";
	return {
		one: br,
		all: xr,
		settings: {
			omitOptionalTags: n.omitOptionalTags || !1,
			allowParseErrors: n.allowParseErrors || !1,
			allowDangerousCharacters: n.allowDangerousCharacters || !1,
			quoteSmart: n.quoteSmart || !1,
			preferUnquoted: n.preferUnquoted || !1,
			tightAttributes: n.tightAttributes || !1,
			upperDoctype: n.upperDoctype || !1,
			tightDoctype: n.tightDoctype || !1,
			bogusComments: n.bogusComments || !1,
			tightCommaSeparatedLists: n.tightCommaSeparatedLists || !1,
			tightSelfClosing: n.tightSelfClosing || !1,
			collapseEmptyAttributes: n.collapseEmptyAttributes || !1,
			allowDangerousHtml: n.allowDangerousHtml || !1,
			voids: n.voids || d,
			characterReferences: n.characterReferences || _r,
			closeSelfClosing: n.closeSelfClosing || !1,
			closeEmptyElements: n.closeEmptyElements || !1
		},
		schema: n.space === "svg" ? $t : Qt,
		quote: r,
		alternative: i
	}.one(Array.isArray(e) ? {
		type: "root",
		children: e
	} : e, void 0, void 0);
}
function br(e, t, n) {
	return pr(e, t, n, this);
}
function xr(e) {
	let t = [], n = e && e.children || vr, r = -1;
	for (; ++r < n.length;) t[r] = this.one(n[r], r, e);
	return t.join("");
}
// node_modules/@shikijs/core/dist/index.mjs
function Sr(e, t) {
	let n = typeof e == "string" ? {} : { ...e.colorReplacements }, r = typeof e == "string" ? e : e.name;
	for (let [e, i] of Object.entries(t?.colorReplacements || {})) typeof i == "string" ? n[e] = i : e === r && Object.assign(n, i);
	return n;
}
function k(e, t) {
	return e && (t?.[e?.toLowerCase()] || e);
}
function Cr(e) {
	return Array.isArray(e) ? e : [e];
}
async function wr(e) {
	return Promise.resolve(typeof e == "function" ? e() : e).then((e) => e.default || e);
}
function Tr(e) {
	return !e || [
		"plaintext",
		"txt",
		"text",
		"plain"
	].includes(e);
}
function Er(e) {
	return e === "ansi" || Tr(e);
}
function Dr(e) {
	return e === "none";
}
function Or(e) {
	return Dr(e);
}
function kr(e, t) {
	if (!t) return e;
	e.properties ||= {}, e.properties.class ||= [], typeof e.properties.class == "string" && (e.properties.class = e.properties.class.split(/\s+/g)), Array.isArray(e.properties.class) || (e.properties.class = []);
	let n = Array.isArray(t) ? t : t.split(/\s+/g);
	for (let t of n) t && !e.properties.class.includes(t) && e.properties.class.push(t);
	return e;
}
function Ar(e, t = !1) {
	if (e.length === 0) return [["", 0]];
	let n = e.split(/(\r?\n)/g), r = 0, i = [];
	for (let e = 0; e < n.length; e += 2) {
		let a = t ? n[e] + (n[e + 1] || "") : n[e];
		i.push([a, r]), r += n[e].length, r += n[e + 1]?.length || 0;
	}
	return i;
}
function jr(e) {
	let t = Ar(e, !0).map(([e]) => e);
	function n(n) {
		if (n === e.length) return {
			line: t.length - 1,
			character: t[t.length - 1].length
		};
		let r = n, i = 0;
		for (let e of t) {
			if (r < e.length) break;
			r -= e.length, i++;
		}
		return {
			line: i,
			character: r
		};
	}
	function r(e, n) {
		let r = 0;
		for (let n = 0; n < e; n++) r += t[n].length;
		return r += n, r;
	}
	return {
		lines: t,
		indexToPos: n,
		posToIndex: r
	};
}
function Mr(e, t, n) {
	let r = /* @__PURE__ */ new Set();
	for (let t of e.matchAll(/:?lang=["']([^"']+)["']/g)) {
		let e = t[1].toLowerCase().trim();
		e && r.add(e);
	}
	for (let t of e.matchAll(/(?:```|~~~)([\w-]+)/g)) {
		let e = t[1].toLowerCase().trim();
		e && r.add(e);
	}
	for (let t of e.matchAll(/\\begin\{([\w-]+)\}/g)) {
		let e = t[1].toLowerCase().trim();
		e && r.add(e);
	}
	for (let t of e.matchAll(/<script\s+(?:type|lang)=["']([^"']+)["']/gi)) {
		let e = t[1].toLowerCase().trim(), n = e.includes("/") ? e.split("/").pop() : e;
		n && r.add(n);
	}
	if (!n) return Array.from(r);
	let i = n.getBundledLanguages();
	return Array.from(r).filter((e) => e && i[e]);
}
var Nr = "light-dark()", Pr = ["color", "background-color"];
function Fr(e, t) {
	let n = 0, r = [];
	for (let i of t) i > n && r.push({
		...e,
		content: e.content.slice(n, i),
		offset: e.offset + n
	}), n = i;
	return n < e.content.length && r.push({
		...e,
		content: e.content.slice(n),
		offset: e.offset + n
	}), r;
}
function Ir(e, t) {
	let n = Array.from(t instanceof Set ? t : new Set(t)).sort((e, t) => e - t);
	return n.length ? e.map((e) => e.flatMap((e) => {
		let t = n.filter((t) => e.offset < t && t < e.offset + e.content.length).map((t) => t - e.offset).sort((e, t) => e - t);
		return t.length ? Fr(e, t) : e;
	})) : e;
}
function Lr(e, t, n, r, i = "css-vars") {
	let a = {
		content: e.content,
		explanation: e.explanation,
		offset: e.offset
	}, o = t.map((t) => Rr(e.variants[t])), s = new Set(o.flatMap((e) => Object.keys(e))), c = {}, l = (e, r) => {
		let i = r === "color" ? "" : r === "background-color" ? "-bg" : `-${r}`;
		return n + t[e] + (r === "color" ? "" : i);
	};
	return o.forEach((e, n) => {
		for (let a of s) {
			let s = e[a] || "inherit";
			if (n === 0 && r && Pr.includes(a)) {
				if (r === Nr && o.length > 1) {
					let e = t.findIndex((e) => e === "light"), r = t.findIndex((e) => e === "dark");
					if (e === -1 || r === -1) throw new f("When using `defaultColor: \"light-dark()\"`, you must provide both `light` and `dark` themes");
					let u = o[e][a] || "inherit", d = o[r][a] || "inherit";
					c[a] = `light-dark(${u}, ${d})`, i === "css-vars" && (c[l(n, a)] = s);
				} else c[a] = s;
			} else i === "css-vars" && (c[l(n, a)] = s);
		}
	}), a.htmlStyle = c, a;
}
function Rr(e) {
	let t = {};
	if (e.color && (t.color = e.color), e.bgColor && (t["background-color"] = e.bgColor), e.fontStyle) {
		e.fontStyle & v.Italic && (t["font-style"] = "italic"), e.fontStyle & v.Bold && (t["font-weight"] = "bold");
		let n = [];
		e.fontStyle & v.Underline && n.push("underline"), e.fontStyle & v.Strikethrough && n.push("line-through"), n.length && (t["text-decoration"] = n.join(" "));
	}
	return t;
}
function zr(e) {
	return typeof e == "string" ? e : Object.entries(e).map(([e, t]) => `${e}:${t}`).join(";");
}
var Br = /* @__PURE__ */ new WeakMap();
function Vr(e, t) {
	Br.set(e, t);
}
function Hr(e) {
	return Br.get(e);
}
var Ur = class e {
	_stacks = {};
	lang;
	get themes() {
		return Object.keys(this._stacks);
	}
	get theme() {
		return this.themes[0];
	}
	get _stack() {
		return this._stacks[this.theme];
	}
	static initial(t, n) {
		return new e(Object.fromEntries(Cr(n).map((e) => [e, Ot])), t);
	}
	constructor(...e) {
		if (e.length === 2) {
			let [t, n] = e;
			this.lang = n, this._stacks = t;
		} else {
			let [t, n, r] = e;
			this.lang = n, this._stacks = { [r]: t };
		}
	}
	getInternalStack(e = this.theme) {
		return this._stacks[e];
	}
	getScopes(e = this.theme) {
		return Wr(this._stacks[e]);
	}
	toJSON() {
		return {
			lang: this.lang,
			theme: this.theme,
			themes: this.themes,
			scopes: this.getScopes()
		};
	}
};
function Wr(e) {
	let t = [], n = /* @__PURE__ */ new Set();
	function r(e) {
		if (n.has(e)) return;
		n.add(e);
		let i = e?.nameScopesList?.scopeName;
		i && t.push(i), e.parent && r(e.parent);
	}
	return r(e), t;
}
function Gr(e, t) {
	if (!(e instanceof Ur)) throw new f("Invalid grammar state");
	return e.getInternalStack(t);
}
function Kr() {
	let e = /* @__PURE__ */ new WeakMap();
	function t(t) {
		if (!e.has(t.meta)) {
			let n = function(e) {
				if (typeof e == "number") {
					if (e < 0 || e > t.source.length) throw new f(`Invalid decoration offset: ${e}. Code length: ${t.source.length}`);
					return {
						...r.indexToPos(e),
						offset: e
					};
				}
				{
					let t = r.lines[e.line];
					if (t === void 0) throw new f(`Invalid decoration position ${JSON.stringify(e)}. Lines length: ${r.lines.length}`);
					let n = e.character;
					if (n < 0 && (n = t.length + n), n < 0 || n > t.length) throw new f(`Invalid decoration position ${JSON.stringify(e)}. Line ${e.line} length: ${t.length}`);
					return {
						...e,
						character: n,
						offset: r.posToIndex(e.line, n)
					};
				}
			}, r = jr(t.source), i = (t.options.decorations || []).map((e) => ({
				...e,
				start: n(e.start),
				end: n(e.end)
			}));
			qr(i), e.set(t.meta, {
				decorations: i,
				converter: r,
				source: t.source
			});
		}
		return e.get(t.meta);
	}
	return {
		name: "shiki:decorations",
		tokens(e) {
			if (this.options.decorations?.length) return Ir(e, t(this).decorations.flatMap((e) => [e.start.offset, e.end.offset]));
		},
		code(e) {
			if (!this.options.decorations?.length) return;
			let n = t(this), r = Array.from(e.children).filter((e) => e.type === "element" && e.tagName === "span");
			if (r.length !== n.converter.lines.length) throw new f(`Number of lines in code element (${r.length}) does not match the number of lines in the source (${n.converter.lines.length}). Failed to apply decorations.`);
			function i(e, t, n, i) {
				let a = r[e], s = "", c = -1, l = -1;
				if (t === 0 && (c = 0), n === 0 && (l = 0), n === Infinity && (l = a.children.length), c === -1 || l === -1) for (let e = 0; e < a.children.length; e++) s += Jr(a.children[e]), c === -1 && s.length === t && (c = e + 1), l === -1 && s.length === n && (l = e + 1);
				if (c === -1) throw new f(`Failed to find start index for decoration ${JSON.stringify(i.start)}`);
				if (l === -1) throw new f(`Failed to find end index for decoration ${JSON.stringify(i.end)}`);
				let u = a.children.slice(c, l);
				if (!i.alwaysWrap && u.length === a.children.length) o(a, i, "line");
				else if (!i.alwaysWrap && u.length === 1 && u[0].type === "element") o(u[0], i, "token");
				else {
					let e = {
						type: "element",
						tagName: "span",
						properties: {},
						children: u
					};
					o(e, i, "wrapper"), a.children.splice(c, u.length, e);
				}
			}
			function a(e, t) {
				r[e] = o(r[e], t, "line");
			}
			function o(e, t, n) {
				let r = t.properties || {}, i = t.transform || ((e) => e);
				return e.tagName = t.tagName || "span", e.properties = {
					...e.properties,
					...r,
					class: e.properties.class
				}, t.properties?.class && kr(e, t.properties.class), e = i(e, n) || e, e;
			}
			let s = [], c = n.decorations.sort((e, t) => t.start.offset - e.start.offset || e.end.offset - t.end.offset);
			for (let e of c) {
				let { start: t, end: n } = e;
				if (t.line === n.line) i(t.line, t.character, n.character, e);
				else if (t.line < n.line) {
					i(t.line, t.character, Infinity, e);
					for (let r = t.line + 1; r < n.line; r++) s.unshift(() => a(r, e));
					i(n.line, 0, n.character, e);
				}
			}
			s.forEach((e) => e());
		}
	};
}
function qr(e) {
	for (let t = 0; t < e.length; t++) {
		let n = e[t];
		if (n.start.offset > n.end.offset) throw new f(`Invalid decoration range: ${JSON.stringify(n.start)} - ${JSON.stringify(n.end)}`);
		for (let r = t + 1; r < e.length; r++) {
			let t = e[r], i = n.start.offset <= t.start.offset && t.start.offset < n.end.offset, a = n.start.offset < t.end.offset && t.end.offset <= n.end.offset, o = t.start.offset <= n.start.offset && n.start.offset < t.end.offset, s = t.start.offset < n.end.offset && n.end.offset <= t.end.offset;
			if (i || a || o || s) {
				if (i && a || o && s || o && n.start.offset === n.end.offset || a && t.start.offset === t.end.offset) continue;
				throw new f(`Decorations ${JSON.stringify(n.start)} and ${JSON.stringify(t.start)} intersect.`);
			}
		}
	}
}
function Jr(e) {
	return e.type === "text" ? e.value : e.type === "element" ? e.children.map(Jr).join("") : "";
}
var Yr = [/* @__PURE__ */ Kr()];
function Xr(e) {
	let t = Zr(e.transformers || []);
	return [
		...t.pre,
		...t.normal,
		...t.post,
		...Yr
	];
}
function Zr(e) {
	let t = [], n = [], r = [];
	for (let i of e) switch (i.enforce) {
		case "pre":
			t.push(i);
			break;
		case "post":
			n.push(i);
			break;
		default: r.push(i);
	}
	return {
		pre: t,
		post: n,
		normal: r
	};
}
var A = [
	"black",
	"red",
	"green",
	"yellow",
	"blue",
	"magenta",
	"cyan",
	"white",
	"brightBlack",
	"brightRed",
	"brightGreen",
	"brightYellow",
	"brightBlue",
	"brightMagenta",
	"brightCyan",
	"brightWhite"
], Qr = {
	1: "bold",
	2: "dim",
	3: "italic",
	4: "underline",
	7: "reverse",
	8: "hidden",
	9: "strikethrough"
};
function $r(e, t) {
	let n = e.indexOf("\x1B", t);
	if (n !== -1 && e[n + 1] === "[") {
		let t = e.indexOf("m", n);
		if (t !== -1) return {
			sequence: e.substring(n + 2, t).split(";"),
			startPosition: n,
			position: t + 1
		};
	}
	return { position: e.length };
}
function ei(e) {
	let t = e.shift();
	if (t === "2") {
		let t = e.splice(0, 3).map((e) => Number.parseInt(e));
		return t.length !== 3 || t.some((e) => Number.isNaN(e)) ? void 0 : {
			type: "rgb",
			rgb: t
		};
	}
	if (t === "5") {
		let t = e.shift();
		if (t) return {
			type: "table",
			index: Number(t)
		};
	}
}
function ti(e) {
	let t = [];
	for (; e.length > 0;) {
		let n = e.shift();
		if (!n) continue;
		let r = Number.parseInt(n);
		if (!Number.isNaN(r)) {
			if (r === 0) t.push({ type: "resetAll" });
			else if (r <= 9) Qr[r] && t.push({
				type: "setDecoration",
				value: Qr[r]
			});
			else if (r <= 29) {
				let e = Qr[r - 20];
				e && (t.push({
					type: "resetDecoration",
					value: e
				}), e === "dim" && t.push({
					type: "resetDecoration",
					value: "bold"
				}));
			} else if (r <= 37) t.push({
				type: "setForegroundColor",
				value: {
					type: "named",
					name: A[r - 30]
				}
			});
			else if (r === 38) {
				let n = ei(e);
				n && t.push({
					type: "setForegroundColor",
					value: n
				});
			} else if (r === 39) t.push({ type: "resetForegroundColor" });
			else if (r <= 47) t.push({
				type: "setBackgroundColor",
				value: {
					type: "named",
					name: A[r - 40]
				}
			});
			else if (r === 48) {
				let n = ei(e);
				n && t.push({
					type: "setBackgroundColor",
					value: n
				});
			} else r === 49 ? t.push({ type: "resetBackgroundColor" }) : r === 53 ? t.push({
				type: "setDecoration",
				value: "overline"
			}) : r === 55 ? t.push({
				type: "resetDecoration",
				value: "overline"
			}) : r >= 90 && r <= 97 ? t.push({
				type: "setForegroundColor",
				value: {
					type: "named",
					name: A[r - 90 + 8]
				}
			}) : r >= 100 && r <= 107 && t.push({
				type: "setBackgroundColor",
				value: {
					type: "named",
					name: A[r - 100 + 8]
				}
			});
		}
	}
	return t;
}
function ni() {
	let e = null, t = null, n = /* @__PURE__ */ new Set();
	return { parse(r) {
		let i = [], a = 0;
		do {
			let o = $r(r, a), s = o.sequence ? r.substring(a, o.startPosition) : r.substring(a);
			if (s.length > 0 && i.push({
				value: s,
				foreground: e,
				background: t,
				decorations: new Set(n)
			}), o.sequence) {
				let r = ti(o.sequence);
				for (let i of r) i.type === "resetAll" ? (e = null, t = null, n.clear()) : i.type === "resetForegroundColor" ? e = null : i.type === "resetBackgroundColor" ? t = null : i.type === "resetDecoration" && n.delete(i.value);
				for (let i of r) i.type === "setForegroundColor" ? e = i.value : i.type === "setBackgroundColor" ? t = i.value : i.type === "setDecoration" && n.add(i.value);
			}
			a = o.position;
		} while (a < r.length);
		return i;
	} };
}
var ri = {
	black: "#000000",
	red: "#bb0000",
	green: "#00bb00",
	yellow: "#bbbb00",
	blue: "#0000bb",
	magenta: "#ff00ff",
	cyan: "#00bbbb",
	white: "#eeeeee",
	brightBlack: "#555555",
	brightRed: "#ff5555",
	brightGreen: "#00ff00",
	brightYellow: "#ffff55",
	brightBlue: "#5555ff",
	brightMagenta: "#ff55ff",
	brightCyan: "#55ffff",
	brightWhite: "#ffffff"
};
function ii(e = ri) {
	function t(t) {
		return e[t];
	}
	function n(e) {
		return `#${e.map((e) => Math.max(0, Math.min(e, 255)).toString(16).padStart(2, "0")).join("")}`;
	}
	let r;
	function i() {
		if (r) return r;
		r = [];
		for (let e = 0; e < A.length; e++) r.push(t(A[e]));
		let e = [
			0,
			95,
			135,
			175,
			215,
			255
		];
		for (let t = 0; t < 6; t++) for (let i = 0; i < 6; i++) for (let a = 0; a < 6; a++) r.push(n([
			e[t],
			e[i],
			e[a]
		]));
		let i = 8;
		for (let e = 0; e < 24; e++, i += 10) r.push(n([
			i,
			i,
			i
		]));
		return r;
	}
	function a(e) {
		return i()[e];
	}
	function o(e) {
		switch (e.type) {
			case "named": return t(e.name);
			case "rgb": return n(e.rgb);
			case "table": return a(e.index);
		}
	}
	return { value: o };
}
var ai = {
	black: "#000000",
	red: "#cd3131",
	green: "#0DBC79",
	yellow: "#E5E510",
	blue: "#2472C8",
	magenta: "#BC3FBC",
	cyan: "#11A8CD",
	white: "#E5E5E5",
	brightBlack: "#666666",
	brightRed: "#F14C4C",
	brightGreen: "#23D18B",
	brightYellow: "#F5F543",
	brightBlue: "#3B8EEA",
	brightMagenta: "#D670D6",
	brightCyan: "#29B8DB",
	brightWhite: "#FFFFFF"
};
function oi(e, t, n) {
	let r = Sr(e, n), i = Ar(t), a = ii(Object.fromEntries(A.map((t) => {
		let n = `terminal.ansi${t[0].toUpperCase()}${t.substring(1)}`;
		return [t, e.colors?.[n] || ai[t]];
	}))), o = ni();
	return i.map((t) => o.parse(t[0]).map((n) => {
		let i, o;
		n.decorations.has("reverse") ? (i = n.background ? a.value(n.background) : e.bg, o = n.foreground ? a.value(n.foreground) : e.fg) : (i = n.foreground ? a.value(n.foreground) : e.fg, o = n.background ? a.value(n.background) : void 0), i = k(i, r), o = k(o, r), n.decorations.has("dim") && (i = si(i));
		let s = v.None;
		return n.decorations.has("bold") && (s |= v.Bold), n.decorations.has("italic") && (s |= v.Italic), n.decorations.has("underline") && (s |= v.Underline), n.decorations.has("strikethrough") && (s |= v.Strikethrough), {
			content: n.value,
			offset: t[1],
			color: i,
			bgColor: o,
			fontStyle: s
		};
	}));
}
function si(e) {
	let t = e.match(/#([0-9a-f]{3,8})/i);
	if (t) {
		let e = t[1];
		if (e.length === 8) {
			let t = Math.round(Number.parseInt(e.slice(6, 8), 16) / 2).toString(16).padStart(2, "0");
			return `#${e.slice(0, 6)}${t}`;
		}
		if (e.length === 6) return `#${e}80`;
		if (e.length === 4) {
			let t = e[0], n = e[1], r = e[2], i = e[3];
			return `#${t}${t}${n}${n}${r}${r}${Math.round(Number.parseInt(`${i}${i}`, 16) / 2).toString(16).padStart(2, "0")}`;
		}
		if (e.length === 3) {
			let t = e[0], n = e[1], r = e[2];
			return `#${t}${t}${n}${n}${r}${r}80`;
		}
	}
	let n = e.match(/var\((--[\w-]+-ansi-[\w-]+)\)/);
	return n ? `var(${n[1]}-dim)` : e;
}
function ci(e, t, n = {}) {
	let { theme: r = e.getLoadedThemes()[0] } = n, i = e.resolveLangAlias(n.lang || "text");
	if (Tr(i) || Dr(r)) return Ar(t).map((e) => [{
		content: e[0],
		offset: e[1]
	}]);
	let { theme: a, colorMap: o } = e.setTheme(r);
	if (i === "ansi") return oi(a, t, n);
	let s = e.getLanguage(n.lang || "text");
	if (n.grammarState) {
		if (n.grammarState.lang !== s.name) throw new f(`Grammar state language "${n.grammarState.lang}" does not match highlight language "${s.name}"`);
		if (!n.grammarState.themes.includes(a.name)) throw new f(`Grammar state themes "${n.grammarState.themes}" do not contain highlight theme "${a.name}"`);
	}
	return ui(t, s, a, o, n);
}
function li(...e) {
	if (e.length === 2) return Hr(e[1]);
	let [t, n, r = {}] = e, { lang: i = "text", theme: a = t.getLoadedThemes()[0] } = r;
	if (Tr(i) || Dr(a)) throw new f("Plain language does not have grammar state");
	if (i === "ansi") throw new f("ANSI language does not have grammar state");
	let { theme: o, colorMap: s } = t.setTheme(a), c = t.getLanguage(i);
	return new Ur(di(n, c, o, s, r).stateStack, c.name, o.name);
}
function ui(e, t, n, r, i) {
	let a = di(e, t, n, r, i), o = new Ur(a.stateStack, t.name, n.name);
	return Vr(a.tokens, o), a.tokens;
}
function di(e, t, n, r, i) {
	let a = Sr(n, i), { tokenizeMaxLineLength: o = 0, tokenizeTimeLimit: s = 500 } = i, c = Ar(e), l = i.grammarState ? Gr(i.grammarState, n.name) ?? Ot : i.grammarContextCode == null ? Ot : di(i.grammarContextCode, t, n, r, {
		...i,
		grammarState: void 0,
		grammarContextCode: void 0
	}).stateStack, u = [], d = [];
	for (let e = 0, f = c.length; e < f; e++) {
		let [f, p] = c[e];
		if (f === "") {
			u = [], d.push([]);
			continue;
		}
		if (o > 0 && f.length >= o) {
			u = [], d.push([{
				content: f,
				offset: p,
				color: "",
				fontStyle: 0
			}]);
			continue;
		}
		let m, h, g;
		i.includeExplanation && (m = t.tokenizeLine(f, l, s), h = m.tokens, g = 0);
		let _ = t.tokenizeLine2(f, l, s), ee = _.tokens.length / 2;
		for (let e = 0; e < ee; e++) {
			let t = _.tokens[2 * e], o = e + 1 < ee ? _.tokens[2 * e + 2] : f.length;
			if (t === o) continue;
			let s = _.tokens[2 * e + 1], c = k(r[be.getForeground(s)], a), l = be.getFontStyle(s), d = {
				content: f.substring(t, o),
				offset: p + t,
				color: c,
				fontStyle: l
			};
			if (i.includeExplanation) {
				let e = [];
				if (i.includeExplanation !== "scopeName") for (let t of n.settings) {
					let n;
					switch (typeof t.scope) {
						case "string":
							n = t.scope.split(/,/).map((e) => e.trim());
							break;
						case "object":
							n = t.scope;
							break;
						default: continue;
					}
					e.push({
						settings: t,
						selectors: n.map((e) => e.split(/ /))
					});
				}
				d.explanation = [];
				let r = 0;
				for (; t + r < o;) {
					let t = h[g], n = f.substring(t.startIndex, t.endIndex);
					r += n.length, d.explanation.push({
						content: n,
						scopes: i.includeExplanation === "scopeName" ? fi(t.scopes) : pi(e, t.scopes)
					}), g += 1;
				}
			}
			u.push(d);
		}
		d.push(u), u = [], l = _.ruleStack;
	}
	return {
		tokens: d,
		stateStack: l
	};
}
function fi(e) {
	return e.map((e) => ({ scopeName: e }));
}
function pi(e, t) {
	let n = [];
	for (let r = 0, i = t.length; r < i; r++) {
		let i = t[r];
		n[r] = {
			scopeName: i,
			themeMatches: gi(e, i, t.slice(0, r))
		};
	}
	return n;
}
function mi(e, t) {
	return e === t || t.substring(0, e.length) === e && t[e.length] === ".";
}
function hi(e, t, n) {
	if (!mi(e[e.length - 1], t)) return !1;
	let r = e.length - 2, i = n.length - 1;
	for (; r >= 0 && i >= 0;) mi(e[r], n[i]) && --r, --i;
	return r === -1;
}
function gi(e, t, n) {
	let r = [];
	for (let { selectors: i, settings: a } of e) for (let e of i) if (hi(e, t, n)) {
		r.push(a);
		break;
	}
	return r;
}
function _i(e, t, n) {
	let r = Object.entries(n.themes).filter((e) => e[1]).map((e) => ({
		color: e[0],
		theme: e[1]
	})), i = r.map((r) => {
		let i = ci(e, t, {
			...n,
			theme: r.theme
		});
		return {
			tokens: i,
			state: Hr(i),
			theme: typeof r.theme == "string" ? r.theme : r.theme.name
		};
	}), a = vi(...i.map((e) => e.tokens)), o = a[0].map((e, t) => e.map((e, i) => {
		let o = {
			content: e.content,
			variants: {},
			offset: e.offset
		};
		return "includeExplanation" in n && n.includeExplanation && (o.explanation = e.explanation), a.forEach((e, n) => {
			let { content: a, explanation: s, offset: c, ...l } = e[t][i];
			o.variants[r[n].color] = l;
		}), o;
	})), s = i[0].state ? new Ur(Object.fromEntries(i.map((e) => [e.theme, e.state?.getInternalStack(e.theme)])), i[0].state.lang) : void 0;
	return s && Vr(o, s), o;
}
function vi(...e) {
	let t = e.map(() => []), n = e.length;
	for (let r = 0; r < e[0].length; r++) {
		let i = e.map((e) => e[r]), a = t.map(() => []);
		t.forEach((e, t) => e.push(a[t]));
		let o = i.map(() => 0), s = i.map((e) => e[0]);
		for (; s.every((e) => e);) {
			let e = Math.min(...s.map((e) => e.content.length));
			for (let t = 0; t < n; t++) {
				let n = s[t];
				n.content.length === e ? (a[t].push(n), o[t] += 1, s[t] = i[t][o[t]]) : (a[t].push({
					...n,
					content: n.content.slice(0, e)
				}), s[t] = {
					...n,
					content: n.content.slice(e),
					offset: n.offset + e
				});
			}
		}
	}
	return t;
}
function yi(e, t, n) {
	let r, i, a, o, s, c;
	if ("themes" in n) {
		let { defaultColor: l = "light", cssVariablePrefix: u = "--shiki-", colorsRendering: d = "css-vars" } = n, p = Object.entries(n.themes).filter((e) => e[1]).map((e) => ({
			color: e[0],
			theme: e[1]
		})).sort((e, t) => e.color === l ? -1 : +(t.color === l));
		if (p.length === 0) throw new f("`themes` option must not be empty");
		let m = _i(e, t, n);
		if (c = Hr(m), l && Nr !== l && !p.find((e) => e.color === l)) throw new f(`\`themes\` option must contain the defaultColor key \`${l}\``);
		let h = p.map((t) => e.getTheme(t.theme)), g = p.map((e) => e.color);
		a = m.map((e) => e.map((e) => Lr(e, g, u, l, d))), c && Vr(a, c);
		let _ = p.map((e) => Sr(e.theme, n));
		i = bi(p, h, _, u, l, "fg", d), r = bi(p, h, _, u, l, "bg", d), o = `shiki-themes ${h.map((e) => e.name).join(" ")}`, s = l ? void 0 : [i, r].join(";");
	} else if ("theme" in n) {
		let s = Sr(n.theme, n);
		a = ci(e, t, n);
		let l = e.getTheme(n.theme);
		r = k(l.bg, s), i = k(l.fg, s), o = l.name, c = Hr(a);
	} else throw new f("Invalid options, either `theme` or `themes` must be provided");
	return {
		tokens: a,
		fg: i,
		bg: r,
		themeName: o,
		rootStyle: s,
		grammarState: c
	};
}
function bi(e, t, n, r, i, a, o) {
	return e.map((s, c) => {
		let l = k(t[c][a], n[c]) || "inherit", u = `${r + s.color}${a === "bg" ? "-bg" : ""}:${l}`;
		if (c === 0 && i) {
			if (i === Nr && e.length > 1) {
				let r = e.findIndex((e) => e.color === "light"), i = e.findIndex((e) => e.color === "dark");
				if (r === -1 || i === -1) throw new f("When using `defaultColor: \"light-dark()\"`, you must provide both `light` and `dark` themes");
				return `light-dark(${k(t[r][a], n[r]) || "inherit"}, ${k(t[i][a], n[i]) || "inherit"});${u}`;
			}
			return l;
		}
		return o === "css-vars" ? u : null;
	}).filter((e) => !!e).join(";");
}
function xi(e, t, n, r = {
	meta: {},
	options: n,
	codeToHast: (t, n) => xi(e, t, n),
	codeToTokens: (t, n) => yi(e, t, n)
}) {
	let i = t;
	for (let e of Xr(n)) i = e.preprocess?.call(r, i, n) || i;
	let { tokens: a, fg: o, bg: s, themeName: c, rootStyle: l, grammarState: u } = yi(e, i, n), { mergeWhitespaces: d = !0, mergeSameStyleTokens: f = !1 } = n;
	d === !0 ? a = Ci(a) : d === "never" && (a = wi(a)), f && (a = Ti(a));
	let p = {
		...r,
		get source() {
			return i;
		}
	};
	for (let e of Xr(n)) a = e.tokens?.call(p, a) || a;
	return Si(a, {
		...n,
		fg: o,
		bg: s,
		themeName: c,
		rootStyle: n.rootStyle === !1 ? !1 : n.rootStyle ?? l
	}, p, u);
}
function Si(e, t, n, r = Hr(e)) {
	let i = Xr(t), a = [], o = {
		type: "root",
		children: []
	}, { structure: s = "classic", tabindex: c = "0" } = t, l = { class: `shiki ${t.themeName || ""}` };
	t.rootStyle !== !1 && (l.style = t.rootStyle == null ? `background-color:${t.bg};color:${t.fg}` : t.rootStyle), c !== !1 && c != null && (l.tabindex = c.toString());
	for (let [e, n] of Object.entries(t.meta || {})) e.startsWith("_") || (l[e] = n);
	let u = {
		type: "element",
		tagName: "pre",
		properties: l,
		children: [],
		data: t.data
	}, d = {
		type: "element",
		tagName: "code",
		properties: {},
		children: a
	}, f = [], p = {
		...n,
		structure: s,
		addClassToHast: kr,
		get source() {
			return n.source;
		},
		get tokens() {
			return e;
		},
		get options() {
			return t;
		},
		get root() {
			return o;
		},
		get pre() {
			return u;
		},
		get code() {
			return d;
		},
		get lines() {
			return f;
		}
	};
	if (e.forEach((e, t) => {
		t && (s === "inline" ? o.children.push({
			type: "element",
			tagName: "br",
			properties: {},
			children: []
		}) : s === "classic" && a.push({
			type: "text",
			value: "\n"
		}));
		let n = {
			type: "element",
			tagName: "span",
			properties: { class: "line" },
			children: []
		}, r = 0;
		for (let a of e) {
			let e = {
				type: "element",
				tagName: "span",
				properties: { ...a.htmlAttrs },
				children: [{
					type: "text",
					value: a.content
				}]
			}, c = zr(a.htmlStyle || Rr(a));
			c && (e.properties.style = c);
			for (let o of i) e = o?.span?.call(p, e, t + 1, r, n, a) || e;
			s === "inline" ? o.children.push(e) : s === "classic" && n.children.push(e), r += a.content.length;
		}
		if (s === "classic") {
			for (let e of i) n = e?.line?.call(p, n, t + 1) || n;
			f.push(n), a.push(n);
		} else s === "inline" && f.push(n);
	}), s === "classic") {
		for (let e of i) d = e?.code?.call(p, d) || d;
		u.children.push(d);
		for (let e of i) u = e?.pre?.call(p, u) || u;
		o.children.push(u);
	} else if (s === "inline") {
		let e = [], t = {
			type: "element",
			tagName: "span",
			properties: { class: "line" },
			children: []
		};
		for (let n of o.children) n.type === "element" && n.tagName === "br" ? (e.push(t), t = {
			type: "element",
			tagName: "span",
			properties: { class: "line" },
			children: []
		}) : (n.type === "element" || n.type === "text") && t.children.push(n);
		e.push(t);
		let n = {
			type: "element",
			tagName: "code",
			properties: {},
			children: e
		};
		for (let e of i) n = e?.code?.call(p, n) || n;
		o.children = [];
		for (let e = 0; e < n.children.length; e++) {
			e > 0 && o.children.push({
				type: "element",
				tagName: "br",
				properties: {},
				children: []
			});
			let t = n.children[e];
			t.type === "element" && o.children.push(...t.children);
		}
	}
	let m = o;
	for (let e of i) m = e?.root?.call(p, m) || m;
	return r && Vr(m, r), m;
}
function Ci(e) {
	return e.map((e) => {
		let t = [], n = "", r;
		return e.forEach((i, a) => {
			let o = !(i.fontStyle && (i.fontStyle & v.Underline || i.fontStyle & v.Strikethrough));
			o && i.content.match(/^\s+$/) && e[a + 1] ? (r === void 0 && (r = i.offset), n += i.content) : n ? (o ? t.push({
				...i,
				offset: r,
				content: n + i.content
			}) : t.push({
				content: n,
				offset: r
			}, i), r = void 0, n = "") : t.push(i);
		}), t;
	});
}
function wi(e) {
	return e.map((e) => e.flatMap((e) => {
		if (e.content.match(/^\s+$/)) return e;
		let t = e.content.match(/^(\s*)(.*?)(\s*)$/);
		if (!t) return e;
		let [, n, r, i] = t;
		if (!n && !i) return e;
		let a = [{
			...e,
			offset: e.offset + n.length,
			content: r
		}];
		return n && a.unshift({
			content: n,
			offset: e.offset
		}), i && a.push({
			content: i,
			offset: e.offset + n.length + r.length
		}), a;
	}));
}
function Ti(e) {
	return e.map((e) => {
		let t = [];
		for (let n of e) {
			if (t.length === 0) {
				t.push({ ...n });
				continue;
			}
			let e = t[t.length - 1], r = zr(e.htmlStyle || Rr(e)), i = zr(n.htmlStyle || Rr(n)), a = e.fontStyle && (e.fontStyle & v.Underline || e.fontStyle & v.Strikethrough), o = n.fontStyle && (n.fontStyle & v.Underline || n.fontStyle & v.Strikethrough);
			!a && !o && r === i ? e.content += n.content : t.push({ ...n });
		}
		return t;
	});
}
var Ei = yr;
function Di(e, t, n) {
	let r = {
		meta: {},
		options: n,
		codeToHast: (t, n) => xi(e, t, n),
		codeToTokens: (t, n) => yi(e, t, n)
	}, i = Ei(xi(e, t, n, r));
	for (let e of Xr(n)) i = e.postprocess?.call(r, i, n) || i;
	return i;
}
var Oi = {
	light: "#333333",
	dark: "#bbbbbb"
}, ki = {
	light: "#fffffe",
	dark: "#1e1e1e"
}, Ai = "__shiki_resolved";
function ji(e) {
	if (e?.[Ai]) return e;
	let t = { ...e };
	t.tokenColors && !t.settings && (t.settings = t.tokenColors, delete t.tokenColors), t.type ||= "dark", t.colorReplacements = { ...t.colorReplacements }, t.settings ||= [];
	let { bg: n, fg: r } = t;
	if (!n || !r) {
		let e = t.settings ? t.settings.find((e) => !e.name && !e.scope) : void 0;
		e?.settings?.foreground && (r = e.settings.foreground), e?.settings?.background && (n = e.settings.background), !r && t?.colors?.["editor.foreground"] && (r = t.colors["editor.foreground"]), !n && t?.colors?.["editor.background"] && (n = t.colors["editor.background"]), r ||= t.type === "light" ? Oi.light : Oi.dark, n ||= t.type === "light" ? ki.light : ki.dark, t.fg = r, t.bg = n;
	}
	t.settings[0] && t.settings[0].settings && !t.settings[0].scope || t.settings.unshift({ settings: {
		foreground: t.fg,
		background: t.bg
	} });
	let i = 0, a = /* @__PURE__ */ new Map();
	function o(e) {
		if (a.has(e)) return a.get(e);
		i += 1;
		let n = `#${i.toString(16).padStart(8, "0").toLowerCase()}`;
		return t.colorReplacements?.[`#${n}`] ? o(e) : (a.set(e, n), n);
	}
	t.settings = t.settings.map((e) => {
		let n = e.settings?.foreground && !e.settings.foreground.startsWith("#"), r = e.settings?.background && !e.settings.background.startsWith("#");
		if (!n && !r) return e;
		let i = {
			...e,
			settings: { ...e.settings }
		};
		if (n) {
			let n = o(e.settings.foreground);
			t.colorReplacements[n] = e.settings.foreground, i.settings.foreground = n;
		}
		if (r) {
			let n = o(e.settings.background);
			t.colorReplacements[n] = e.settings.background, i.settings.background = n;
		}
		return i;
	});
	for (let e of Object.keys(t.colors || {})) if ((e === "editor.foreground" || e === "editor.background" || e.startsWith("terminal.ansi")) && !t.colors[e]?.startsWith("#")) {
		let n = o(t.colors[e]);
		t.colorReplacements[n] = t.colors[e], t.colors[e] = n;
	}
	return Object.defineProperty(t, Ai, {
		enumerable: !1,
		writable: !1,
		value: !0
	}), t;
}
async function Mi(e) {
	return Array.from(new Set((await Promise.all(e.filter((e) => !Er(e)).map(async (e) => await wr(e).then((e) => Array.isArray(e) ? e : [e])))).flat()));
}
async function Ni(e) {
	return (await Promise.all(e.map(async (e) => Or(e) ? null : ji(await wr(e))))).filter((e) => !!e);
}
var Pi = 3;
function Fi(e, t = 3) {
	Pi && (typeof Pi == "number" && t > Pi || console.trace(`[SHIKI DEPRECATE]: ${e}`));
}
var j = class extends Error {
	constructor(e) {
		super(e), this.name = "ShikiError";
	}
};
function Ii(e, t) {
	if (!t) return e;
	if (t[e]) {
		let n = /* @__PURE__ */ new Set([e]);
		for (; t[e];) {
			if (e = t[e], n.has(e)) throw new j(`Circular alias \`${Array.from(n).join(" -> ")} -> ${e}\``);
			n.add(e);
		}
	}
	return e;
}
var Li = class extends Dt {
	constructor(e, t, n, r = {}) {
		super(e), this._resolver = e, this._themes = t, this._langs = n, this._alias = r, this._themes.map((e) => this.loadTheme(e)), this.loadLanguages(this._langs);
	}
	_resolvedThemes = /* @__PURE__ */ new Map();
	_resolvedGrammars = /* @__PURE__ */ new Map();
	_langMap = /* @__PURE__ */ new Map();
	_langGraph = /* @__PURE__ */ new Map();
	_textmateThemeCache = /* @__PURE__ */ new WeakMap();
	_loadedThemesCache = null;
	_loadedLanguagesCache = null;
	getTheme(e) {
		return typeof e == "string" ? this._resolvedThemes.get(e) : this.loadTheme(e);
	}
	loadTheme(e) {
		let t = ji(e);
		return t.name && (this._resolvedThemes.set(t.name, t), this._loadedThemesCache = null), t;
	}
	getLoadedThemes() {
		return this._loadedThemesCache ||= [...this._resolvedThemes.keys()], this._loadedThemesCache;
	}
	setTheme(e) {
		let t = this._textmateThemeCache.get(e);
		t || (t = ce.createFromRawTheme(e), this._textmateThemeCache.set(e, t)), this._syncRegistry.setTheme(t);
	}
	getGrammar(e) {
		return e = Ii(e, this._alias), this._resolvedGrammars.get(e);
	}
	loadLanguage(e) {
		if (this.getGrammar(e.name)) return;
		let t = new Set([...this._langMap.values()].filter((t) => t.embeddedLangsLazy?.includes(e.name)));
		this._resolver.addLanguage(e);
		let n = {
			balancedBracketSelectors: e.balancedBracketSelectors || ["*"],
			unbalancedBracketSelectors: e.unbalancedBracketSelectors || []
		};
		this._syncRegistry._rawGrammars.set(e.scopeName, e);
		let r = this.loadGrammarWithConfiguration(e.scopeName, 1, n);
		if (r.name = e.name, this._resolvedGrammars.set(e.name, r), e.aliases && e.aliases.forEach((t) => {
			this._alias[t] = e.name;
		}), this._loadedLanguagesCache = null, t.size) for (let e of t) this._resolvedGrammars.delete(e.name), this._loadedLanguagesCache = null, this._syncRegistry?._injectionGrammars?.delete(e.scopeName), this._syncRegistry?._grammars?.delete(e.scopeName), this.loadLanguage(this._langMap.get(e.name));
	}
	dispose() {
		super.dispose(), this._resolvedThemes.clear(), this._resolvedGrammars.clear(), this._langMap.clear(), this._langGraph.clear(), this._loadedThemesCache = null;
	}
	loadLanguages(e) {
		for (let t of e) this.resolveEmbeddedLanguages(t);
		let t = Array.from(this._langGraph.entries()), n = t.filter(([e, t]) => !t);
		if (n.length) {
			let e = t.filter(([e, t]) => t ? (t.embeddedLanguages || t.embeddedLangs)?.some((e) => n.map(([e]) => e).includes(e)) : !1).filter((e) => !n.includes(e));
			throw new j(`Missing languages ${n.map(([e]) => `\`${e}\``).join(", ")}, required by ${e.map(([e]) => `\`${e}\``).join(", ")}`);
		}
		for (let [e, n] of t) this._resolver.addLanguage(n);
		for (let [e, n] of t) this.loadLanguage(n);
	}
	getLoadedLanguages() {
		return this._loadedLanguagesCache ||= [.../* @__PURE__ */ new Set([...this._resolvedGrammars.keys(), ...Object.keys(this._alias)])], this._loadedLanguagesCache;
	}
	resolveEmbeddedLanguages(e) {
		this._langMap.set(e.name, e), this._langGraph.set(e.name, e);
		let t = e.embeddedLanguages ?? e.embeddedLangs;
		if (t) for (let e of t) this._langGraph.set(e, this._langMap.get(e));
	}
}, Ri = class {
	_langs = /* @__PURE__ */ new Map();
	_scopeToLang = /* @__PURE__ */ new Map();
	_injections = /* @__PURE__ */ new Map();
	_onigLib;
	constructor(e, t) {
		this._onigLib = {
			createOnigScanner: (t) => e.createScanner(t),
			createOnigString: (t) => e.createString(t)
		}, t.forEach((e) => this.addLanguage(e));
	}
	get onigLib() {
		return this._onigLib;
	}
	getLangRegistration(e) {
		return this._langs.get(e);
	}
	loadGrammar(e) {
		return this._scopeToLang.get(e);
	}
	addLanguage(e) {
		this._langs.set(e.name, e), e.aliases && e.aliases.forEach((t) => {
			this._langs.set(t, e);
		}), this._scopeToLang.set(e.scopeName, e), e.injectTo && e.injectTo.forEach((t) => {
			this._injections.get(t) || this._injections.set(t, []), this._injections.get(t).push(e.scopeName);
		});
	}
	getInjections(e) {
		let t = e.split("."), n = [];
		for (let e = 1; e <= t.length; e++) {
			let r = t.slice(0, e).join(".");
			n = [...n, ...this._injections.get(r) || []];
		}
		return n;
	}
}, zi = 0;
function Bi(e) {
	zi += 1, e.warnings !== !1 && zi >= 10 && zi % 10 == 0 && console.warn(`[Shiki] ${zi} instances have been created. Shiki is supposed to be used as a singleton, consider refactoring your code to cache your highlighter instance; Or call \`highlighter.dispose()\` to release unused instances.`);
	let t = !1;
	if (!e.engine) throw new j("`engine` option is required for synchronous mode");
	let n = (e.langs || []).flat(1), r = (e.themes || []).flat(1).map(ji), i = new Li(new Ri(e.engine, n), r, n, e.langAlias), a;
	function o(t) {
		return Ii(t, e.langAlias);
	}
	function s(e) {
		g();
		let t = i.getGrammar(typeof e == "string" ? e : e.name);
		if (!t) throw new j(`Language \`${e}\` not found, you may need to load it first`);
		return t;
	}
	function c(e) {
		if (e === "none") return {
			bg: "",
			fg: "",
			name: "none",
			settings: [],
			type: "dark"
		};
		g();
		let t = i.getTheme(e);
		if (!t) throw new j(`Theme \`${e}\` not found, you may need to load it first`);
		return t;
	}
	function l(e) {
		g();
		let t = c(e);
		return a !== e && (i.setTheme(t), a = e), {
			theme: t,
			colorMap: i.getColorMap()
		};
	}
	function u() {
		return g(), i.getLoadedThemes();
	}
	function d() {
		return g(), i.getLoadedLanguages();
	}
	function f(...e) {
		g(), i.loadLanguages(e.flat(1));
	}
	async function p(...e) {
		return f(await Mi(e));
	}
	function m(...e) {
		g();
		for (let t of e.flat(1)) i.loadTheme(t);
	}
	async function h(...e) {
		return g(), m(await Ni(e));
	}
	function g() {
		if (t) throw new j("Shiki instance has been disposed");
	}
	function _() {
		t || (t = !0, i.dispose(), --zi);
	}
	return {
		setTheme: l,
		getTheme: c,
		getLanguage: s,
		getLoadedThemes: u,
		getLoadedLanguages: d,
		resolveLangAlias: o,
		loadLanguage: p,
		loadLanguageSync: f,
		loadTheme: h,
		loadThemeSync: m,
		dispose: _,
		[Symbol.dispose]: _
	};
}
async function Vi(e) {
	e.engine || Fi("`engine` option is required. Use `createOnigurumaEngine` or `createJavaScriptRegexEngine` to create an engine.");
	let [t, n, r] = await Promise.all([
		Ni(e.themes || []),
		Mi(e.langs || []),
		e.engine
	]);
	return Bi({
		...e,
		themes: t,
		langs: n,
		engine: r
	});
}
async function Hi(e) {
	let t = await Vi(e);
	return {
		getLastGrammarState: (...e) => li(t, ...e),
		codeToTokensBase: (e, n) => ci(t, e, n),
		codeToTokensWithThemes: (e, n) => _i(t, e, n),
		codeToTokens: (e, n) => yi(t, e, n),
		codeToHast: (e, n) => xi(t, e, n),
		codeToHtml: (e, n) => Di(t, e, n),
		getBundledLanguages: () => ({}),
		getBundledThemes: () => ({}),
		...t,
		getInternalContext: () => t
	};
}
function Ui(e) {
	let t = e.langs, n = e.themes, r = e.engine;
	async function i(e) {
		function i(n) {
			if (typeof n == "string") {
				if (n = e.langAlias?.[n] || n, Er(n)) return [];
				let r = t[n];
				if (!r) throw new f(`Language \`${n}\` is not included in this bundle. You may want to load it from external source.`);
				return r;
			}
			return n;
		}
		function a(e) {
			if (Or(e)) return "none";
			if (typeof e == "string") {
				let t = n[e];
				if (!t) throw new f(`Theme \`${e}\` is not included in this bundle. You may want to load it from external source.`);
				return t;
			}
			return e;
		}
		let o = (e.themes ?? []).map((e) => a(e)), s = (e.langs ?? []).map((e) => i(e)), c = await Hi({
			engine: e.engine ?? r(),
			...e,
			themes: o,
			langs: s
		});
		return {
			...c,
			loadLanguage(...e) {
				return c.loadLanguage(...e.map(i));
			},
			loadTheme(...e) {
				return c.loadTheme(...e.map(a));
			},
			getBundledLanguages() {
				return t;
			},
			getBundledThemes() {
				return n;
			}
		};
	}
	return i;
}
function Wi(e) {
	let t;
	async function n(n = {}) {
		if (t) {
			let e = await t;
			return await Promise.all([e.loadTheme(...n.themes || []), e.loadLanguage(...n.langs || [])]), e;
		}
		{
			t = e({
				...n,
				themes: [],
				langs: []
			});
			let r = await t;
			return await Promise.all([r.loadTheme(...n.themes || []), r.loadLanguage(...n.langs || [])]), r;
		}
	}
	return n;
}
function Gi(e, t) {
	let n = Wi(e);
	async function r(e, r) {
		let i = await n({
			langs: [r.lang],
			themes: "theme" in r ? [r.theme] : Object.values(r.themes)
		}), a = await t?.guessEmbeddedLanguages?.(e, r.lang, i);
		return a && await i.loadLanguage(...a), i;
	}
	return {
		getSingletonHighlighter(e) {
			return n(e);
		},
		async codeToHtml(e, t) {
			return (await r(e, t)).codeToHtml(e, t);
		},
		async codeToHast(e, t) {
			return (await r(e, t)).codeToHast(e, t);
		},
		async codeToTokens(e, t) {
			return (await r(e, t)).codeToTokens(e, t);
		},
		async codeToTokensBase(e, t) {
			return (await r(e, t)).codeToTokensBase(e, t);
		},
		async codeToTokensWithThemes(e, t) {
			return (await r(e, t)).codeToTokensWithThemes(e, t);
		},
		async getLastGrammarState(e, t) {
			return (await n({
				langs: [t.lang],
				themes: [t.theme]
			})).getLastGrammarState(e, t);
		}
	};
}
// node_modules/shiki/dist/langs.mjs
var Ki = [
	{
		id: "abap",
		name: "ABAP",
		import: (() => import("./abap-CJVxDCih.js"))
	},
	{
		id: "actionscript-3",
		name: "ActionScript",
		import: (() => import("./actionscript-3-DC9L9bgy.js"))
	},
	{
		id: "ada",
		name: "Ada",
		import: (() => import("./ada-Tolvdyck.js"))
	},
	{
		id: "angular-html",
		name: "Angular HTML",
		import: (() => import("./angular-html-C3MFF9mH.js").then((e) => e.n))
	},
	{
		id: "angular-ts",
		name: "Angular TypeScript",
		import: (() => import("./angular-ts-1EQ8IBUp.js"))
	},
	{
		id: "apache",
		name: "Apache Conf",
		import: (() => import("./apache-BUhlrTDV.js"))
	},
	{
		id: "apex",
		name: "Apex",
		import: (() => import("./apex-DiZm2p-N.js"))
	},
	{
		id: "apl",
		name: "APL",
		import: (() => import("./apl-BRr2ECPN.js"))
	},
	{
		id: "applescript",
		name: "AppleScript",
		import: (() => import("./applescript-ADDjRuDN.js"))
	},
	{
		id: "ara",
		name: "Ara",
		import: (() => import("./ara-qq1xXFYH.js"))
	},
	{
		id: "asciidoc",
		name: "AsciiDoc",
		aliases: ["adoc"],
		import: (() => import("./asciidoc-BQPwxhyn.js"))
	},
	{
		id: "asm",
		name: "Assembly",
		import: (() => import("./asm-BG-prohY.js"))
	},
	{
		id: "astro",
		name: "Astro",
		import: (() => import("./astro-DgfZVXx-.js"))
	},
	{
		id: "awk",
		name: "AWK",
		import: (() => import("./awk-CLViK1AN.js"))
	},
	{
		id: "ballerina",
		name: "Ballerina",
		import: (() => import("./ballerina-CEQUp96R.js"))
	},
	{
		id: "bat",
		name: "Batch File",
		aliases: ["batch"],
		import: (() => import("./bat-CorUgyy3.js"))
	},
	{
		id: "beancount",
		name: "Beancount",
		import: (() => import("./beancount-3a8XkLP3.js"))
	},
	{
		id: "berry",
		name: "Berry",
		aliases: ["be"],
		import: (() => import("./berry-BwT4aLVg.js"))
	},
	{
		id: "bibtex",
		name: "BibTeX",
		import: (() => import("./bibtex-CqljWi0V.js"))
	},
	{
		id: "bicep",
		name: "Bicep",
		import: (() => import("./bicep-B4J9qq-Z.js"))
	},
	{
		id: "bird2",
		name: "BIRD2 Configuration",
		aliases: ["bird"],
		import: (() => import("./bird2-C16xBuDL.js"))
	},
	{
		id: "blade",
		name: "Blade",
		import: (() => import("./blade-CTpCrPIL.js"))
	},
	{
		id: "bsl",
		name: "1C (Enterprise)",
		aliases: ["1c"],
		import: (() => import("./bsl-D7iw-5iW.js"))
	},
	{
		id: "c",
		name: "C",
		import: (() => import("./c-BANMH8jY.js").then((e) => e.n))
	},
	{
		id: "c3",
		name: "C3",
		import: (() => import("./c3-JvUhyk3V.js"))
	},
	{
		id: "cadence",
		name: "Cadence",
		aliases: ["cdc"],
		import: (() => import("./cadence-DRL7VEtm.js"))
	},
	{
		id: "cairo",
		name: "Cairo",
		import: (() => import("./cairo-CHMWX4Ln.js"))
	},
	{
		id: "clarity",
		name: "Clarity",
		import: (() => import("./clarity-BqBpQt4r.js"))
	},
	{
		id: "clojure",
		name: "Clojure",
		aliases: ["clj"],
		import: (() => import("./clojure-CO3ptKNj.js"))
	},
	{
		id: "cmake",
		name: "CMake",
		import: (() => import("./cmake-Daw-aSZt.js"))
	},
	{
		id: "cobol",
		name: "COBOL",
		import: (() => import("./cobol-DIhRGnZE.js"))
	},
	{
		id: "codeowners",
		name: "CODEOWNERS",
		import: (() => import("./codeowners-RB6Ky2d_.js"))
	},
	{
		id: "codeql",
		name: "CodeQL",
		aliases: ["ql"],
		import: (() => import("./codeql-DWYIUtYc.js"))
	},
	{
		id: "coffee",
		name: "CoffeeScript",
		aliases: ["coffeescript"],
		import: (() => import("./coffee-BbhgCJro.js"))
	},
	{
		id: "common-lisp",
		name: "Common Lisp",
		aliases: ["lisp"],
		import: (() => import("./common-lisp-Z5pdmE3i.js"))
	},
	{
		id: "coq",
		name: "Coq",
		import: (() => import("./coq-CMhHALjd.js"))
	},
	{
		id: "cpp",
		name: "C++",
		aliases: ["c++"],
		import: (() => import("./cpp-BMK5XBZs.js").then((e) => e.n))
	},
	{
		id: "crystal",
		name: "Crystal",
		import: (() => import("./crystal-BreycQuV.js"))
	},
	{
		id: "csharp",
		name: "C#",
		aliases: ["c#", "cs"],
		import: (() => import("./csharp-LspdDrT4.js"))
	},
	{
		id: "css",
		name: "CSS",
		import: (() => import("./css-8uTpWNHK.js").then((e) => e.n))
	},
	{
		id: "csv",
		name: "CSV",
		import: (() => import("./csv-DDLVNpF_.js"))
	},
	{
		id: "cue",
		name: "CUE",
		import: (() => import("./cue-D9icO3Iq.js"))
	},
	{
		id: "cypher",
		name: "Cypher",
		aliases: ["cql"],
		import: (() => import("./cypher-CtaxHT1L.js"))
	},
	{
		id: "d",
		name: "D",
		import: (() => import("./d-D4yE5Vyh.js"))
	},
	{
		id: "dart",
		name: "Dart",
		import: (() => import("./dart-uovIKXoK.js"))
	},
	{
		id: "dax",
		name: "DAX",
		import: (() => import("./dax-B_fglzFE.js"))
	},
	{
		id: "desktop",
		name: "Desktop",
		import: (() => import("./desktop-D1YOnHEY.js"))
	},
	{
		id: "diff",
		name: "Diff",
		import: (() => import("./diff-Diuv0qGT.js"))
	},
	{
		id: "docker",
		name: "Dockerfile",
		aliases: ["dockerfile"],
		import: (() => import("./docker-DD_kyglC.js"))
	},
	{
		id: "dotenv",
		name: "dotEnv",
		import: (() => import("./dotenv-nIwOHE5M.js"))
	},
	{
		id: "dream-maker",
		name: "Dream Maker",
		import: (() => import("./dream-maker-hpDz6By6.js"))
	},
	{
		id: "edge",
		name: "Edge",
		import: (() => import("./edge-KLf7XIW2.js"))
	},
	{
		id: "elixir",
		name: "Elixir",
		import: (() => import("./elixir-fZta7e4Y.js"))
	},
	{
		id: "elm",
		name: "Elm",
		import: (() => import("./elm-BvOujvqj.js"))
	},
	{
		id: "emacs-lisp",
		name: "Emacs Lisp",
		aliases: ["elisp"],
		import: (() => import("./emacs-lisp-DPG4niWr.js"))
	},
	{
		id: "erb",
		name: "ERB",
		import: (() => import("./erb-Dw-zK2tq.js"))
	},
	{
		id: "erlang",
		name: "Erlang",
		aliases: ["erl"],
		import: (() => import("./erlang-DiFbHlVR.js"))
	},
	{
		id: "fennel",
		name: "Fennel",
		import: (() => import("./fennel-f1xl4Q05.js"))
	},
	{
		id: "fish",
		name: "Fish",
		import: (() => import("./fish-99YblEc7.js"))
	},
	{
		id: "fluent",
		name: "Fluent",
		aliases: ["ftl"],
		import: (() => import("./fluent-4LP_8ZRP.js"))
	},
	{
		id: "fortran-fixed-form",
		name: "Fortran (Fixed Form)",
		aliases: [
			"f",
			"for",
			"f77"
		],
		import: (() => import("./fortran-fixed-form-C2P4rR06.js"))
	},
	{
		id: "fortran-free-form",
		name: "Fortran (Free Form)",
		aliases: [
			"f90",
			"f95",
			"f03",
			"f08",
			"f18"
		],
		import: (() => import("./fortran-free-form-BJnwWphW.js"))
	},
	{
		id: "fsharp",
		name: "F#",
		aliases: ["f#", "fs"],
		import: (() => import("./fsharp-DGRZ3M3M.js"))
	},
	{
		id: "gdresource",
		name: "GDResource",
		aliases: ["tscn", "tres"],
		import: (() => import("./gdresource-Bk55Wg9M.js"))
	},
	{
		id: "gdscript",
		name: "GDScript",
		aliases: ["gd"],
		import: (() => import("./gdscript-DRQ6W5rO.js"))
	},
	{
		id: "gdshader",
		name: "GDShader",
		import: (() => import("./gdshader-D7XodLZw.js"))
	},
	{
		id: "genie",
		name: "Genie",
		import: (() => import("./genie-ufotYGgo.js"))
	},
	{
		id: "gherkin",
		name: "Gherkin",
		import: (() => import("./gherkin-TDn2lJS-.js"))
	},
	{
		id: "git-commit",
		name: "Git Commit Message",
		import: (() => import("./git-commit-CmGD3KL9.js"))
	},
	{
		id: "git-rebase",
		name: "Git Rebase Message",
		import: (() => import("./git-rebase-C8QPWMk3.js"))
	},
	{
		id: "gleam",
		name: "Gleam",
		import: (() => import("./gleam-LV2mKtnv.js"))
	},
	{
		id: "glimmer-js",
		name: "Glimmer JS",
		aliases: ["gjs"],
		import: (() => import("./glimmer-js-CFP8dTqs.js"))
	},
	{
		id: "glimmer-ts",
		name: "Glimmer TS",
		aliases: ["gts"],
		import: (() => import("./glimmer-ts-D-kqCckb.js"))
	},
	{
		id: "glsl",
		name: "GLSL",
		import: (() => import("./glsl-DC_ew0ru.js").then((e) => e.n))
	},
	{
		id: "gn",
		name: "GN",
		import: (() => import("./gn-Dj888Qp9.js"))
	},
	{
		id: "gnuplot",
		name: "Gnuplot",
		import: (() => import("./gnuplot-Di7UZXvs.js"))
	},
	{
		id: "go",
		name: "Go",
		import: (() => import("./go-BGnBamn3.js"))
	},
	{
		id: "graphql",
		name: "GraphQL",
		aliases: ["gql"],
		import: (() => import("./graphql-qFYCT1xc.js").then((e) => e.n))
	},
	{
		id: "groovy",
		name: "Groovy",
		import: (() => import("./groovy-DNa91fQJ.js"))
	},
	{
		id: "hack",
		name: "Hack",
		import: (() => import("./hack-DEGaWz9u.js"))
	},
	{
		id: "haml",
		name: "Ruby Haml",
		import: (() => import("./haml-ChgCwkMa.js").then((e) => e.n))
	},
	{
		id: "handlebars",
		name: "Handlebars",
		aliases: ["hbs"],
		import: (() => import("./handlebars-DjbBVUHQ.js"))
	},
	{
		id: "haskell",
		name: "Haskell",
		aliases: ["hs"],
		import: (() => import("./haskell-D6RgJWqJ.js"))
	},
	{
		id: "haxe",
		name: "Haxe",
		import: (() => import("./haxe-CZSFrQIh.js"))
	},
	{
		id: "hcl",
		name: "HashiCorp HCL",
		import: (() => import("./hcl-B9zco17t.js"))
	},
	{
		id: "hjson",
		name: "Hjson",
		import: (() => import("./hjson-sMCeQDUn.js"))
	},
	{
		id: "hlsl",
		name: "HLSL",
		import: (() => import("./hlsl-WeeDt2Wp.js"))
	},
	{
		id: "html",
		name: "HTML",
		import: (() => import("./html-BgEEFEA_.js").then((e) => e.n))
	},
	{
		id: "html-derivative",
		name: "HTML (Derivative)",
		import: (() => import("./html-derivative-CzQfATEl.js"))
	},
	{
		id: "http",
		name: "HTTP",
		import: (() => import("./http-BOQpDHkN.js"))
	},
	{
		id: "hurl",
		name: "Hurl",
		import: (() => import("./hurl-CYfiTgLX.js"))
	},
	{
		id: "hxml",
		name: "HXML",
		import: (() => import("./hxml-Dwm1cHKD.js"))
	},
	{
		id: "hy",
		name: "Hy",
		import: (() => import("./hy-C-tRiv34.js"))
	},
	{
		id: "imba",
		name: "Imba",
		import: (() => import("./imba-v7ELlTL6.js"))
	},
	{
		id: "ini",
		name: "INI",
		aliases: ["properties"],
		import: (() => import("./ini-DtrnrQj2.js"))
	},
	{
		id: "java",
		name: "Java",
		import: (() => import("./java-SNMl6CV4.js").then((e) => e.n))
	},
	{
		id: "javascript",
		name: "JavaScript",
		aliases: [
			"js",
			"cjs",
			"mjs"
		],
		import: (() => import("./javascript-DhbtGwm8.js").then((e) => e.n))
	},
	{
		id: "jinja",
		name: "Jinja",
		import: (() => import("./jinja-djASVabd.js"))
	},
	{
		id: "jison",
		name: "Jison",
		import: (() => import("./jison-Cit8nH9Y.js"))
	},
	{
		id: "json",
		name: "JSON",
		import: (() => import("./json-Ce2LLK2P.js").then((e) => e.n))
	},
	{
		id: "json5",
		name: "JSON5",
		import: (() => import("./json5-BdfUTtLp.js"))
	},
	{
		id: "jsonc",
		name: "JSON with Comments",
		import: (() => import("./jsonc-IKox2JSV.js"))
	},
	{
		id: "jsonl",
		name: "JSON Lines",
		import: (() => import("./jsonl-CfuX4G6U.js"))
	},
	{
		id: "jsonnet",
		name: "Jsonnet",
		import: (() => import("./jsonnet-Yq9KcR8E.js"))
	},
	{
		id: "jssm",
		name: "JSSM",
		aliases: ["fsl"],
		import: (() => import("./jssm-BvR7SnkK.js"))
	},
	{
		id: "jsx",
		name: "JSX",
		import: (() => import("./jsx-DOuf9XHq.js").then((e) => e.n))
	},
	{
		id: "julia",
		name: "Julia",
		aliases: ["jl"],
		import: (() => import("./julia-DBxGBVj4.js"))
	},
	{
		id: "just",
		name: "Just",
		import: (() => import("./just-DUiceS6f.js"))
	},
	{
		id: "kdl",
		name: "KDL",
		import: (() => import("./kdl-D97SquIS.js"))
	},
	{
		id: "kotlin",
		name: "Kotlin",
		aliases: ["kt", "kts"],
		import: (() => import("./kotlin-EmJjLeRz.js"))
	},
	{
		id: "kusto",
		name: "Kusto",
		aliases: ["kql"],
		import: (() => import("./kusto-B8mC9ImC.js"))
	},
	{
		id: "latex",
		name: "LaTeX",
		import: (() => import("./latex-DVHXtqK-.js"))
	},
	{
		id: "lean",
		name: "Lean 4",
		aliases: ["lean4"],
		import: (() => import("./lean-E61_xvh-.js"))
	},
	{
		id: "less",
		name: "Less",
		import: (() => import("./less-Bis9Y9oi.js"))
	},
	{
		id: "liquid",
		name: "Liquid",
		import: (() => import("./liquid-CWq_SRPk.js"))
	},
	{
		id: "llvm",
		name: "LLVM IR",
		import: (() => import("./llvm-DFvct9Ka.js"))
	},
	{
		id: "log",
		name: "Log file",
		import: (() => import("./log-Awf6LbyY.js"))
	},
	{
		id: "logo",
		name: "Logo",
		import: (() => import("./logo-Cn9nW1nw.js"))
	},
	{
		id: "lua",
		name: "Lua",
		import: (() => import("./lua-C8sXoIJr.js").then((e) => e.n))
	},
	{
		id: "luau",
		name: "Luau",
		import: (() => import("./luau-H0NCCzo2.js"))
	},
	{
		id: "make",
		name: "Makefile",
		aliases: ["makefile"],
		import: (() => import("./make-CJ4tc-MS.js"))
	},
	{
		id: "markdown",
		name: "Markdown",
		aliases: ["md"],
		import: (() => import("./markdown-CNVZ8ok-.js"))
	},
	{
		id: "marko",
		name: "Marko",
		import: (() => import("./marko-1HjH2Vmp.js"))
	},
	{
		id: "matlab",
		name: "MATLAB",
		import: (() => import("./matlab-Dn3Clolk.js"))
	},
	{
		id: "mdc",
		name: "MDC",
		import: (() => import("./mdc-Ba8ElXNt.js"))
	},
	{
		id: "mdx",
		name: "MDX",
		import: (() => import("./mdx-C5T-IRbL.js"))
	},
	{
		id: "mermaid",
		name: "Mermaid",
		aliases: ["mmd"],
		import: (() => import("./mermaid-CA11QPT0.js"))
	},
	{
		id: "mipsasm",
		name: "MIPS Assembly",
		aliases: ["mips"],
		import: (() => import("./mipsasm-Bwfx99oh.js"))
	},
	{
		id: "mojo",
		name: "Mojo",
		import: (() => import("./mojo-BHIoWndS.js"))
	},
	{
		id: "moonbit",
		name: "MoonBit",
		aliases: ["mbt", "mbti"],
		import: (() => import("./moonbit-Byzv8dIL.js"))
	},
	{
		id: "move",
		name: "Move",
		import: (() => import("./move-Cj6HS1A1.js"))
	},
	{
		id: "narrat",
		name: "Narrat Language",
		aliases: ["nar"],
		import: (() => import("./narrat-CrPIhy6S.js"))
	},
	{
		id: "nextflow",
		name: "Nextflow",
		aliases: ["nf"],
		import: (() => import("./nextflow-CsdC2bhO.js"))
	},
	{
		id: "nextflow-groovy",
		name: "nextflow-groovy",
		import: (() => import("./nextflow-groovy-C_N4xbdj.js"))
	},
	{
		id: "nginx",
		name: "Nginx",
		import: (() => import("./nginx-DVuYkuy5.js"))
	},
	{
		id: "nim",
		name: "Nim",
		import: (() => import("./nim-BjLA2dp5.js"))
	},
	{
		id: "nix",
		name: "Nix",
		import: (() => import("./nix-D_5rVnnj.js"))
	},
	{
		id: "nushell",
		name: "nushell",
		aliases: ["nu"],
		import: (() => import("./nushell-ChO7dO0K.js"))
	},
	{
		id: "objective-c",
		name: "Objective-C",
		aliases: ["objc"],
		import: (() => import("./objective-c-DPJeQfV6.js"))
	},
	{
		id: "objective-cpp",
		name: "Objective-C++",
		import: (() => import("./objective-cpp-1I3jYeMe.js"))
	},
	{
		id: "ocaml",
		name: "OCaml",
		import: (() => import("./ocaml-DOrLjeoA.js"))
	},
	{
		id: "odin",
		name: "Odin",
		import: (() => import("./odin-CyrMbkLb.js"))
	},
	{
		id: "openscad",
		name: "OpenSCAD",
		aliases: ["scad"],
		import: (() => import("./openscad-BdifjW6z.js"))
	},
	{
		id: "pascal",
		name: "Pascal",
		import: (() => import("./pascal-CWF557wL.js"))
	},
	{
		id: "perl",
		name: "Perl",
		import: (() => import("./perl-Da5UzTVz.js"))
	},
	{
		id: "php",
		name: "PHP",
		import: (() => import("./php-KdPS-Dy7.js"))
	},
	{
		id: "pkl",
		name: "Pkl",
		import: (() => import("./pkl-D57k4LLs.js"))
	},
	{
		id: "plsql",
		name: "PL/SQL",
		import: (() => import("./plsql-CFYD0AaB.js"))
	},
	{
		id: "po",
		name: "Gettext PO",
		aliases: ["pot", "potx"],
		import: (() => import("./po-3OOmP4Qc.js"))
	},
	{
		id: "polar",
		name: "Polar",
		import: (() => import("./polar-B5m1_AiD.js"))
	},
	{
		id: "postcss",
		name: "PostCSS",
		import: (() => import("./postcss-DaNMuZdy.js"))
	},
	{
		id: "powerquery",
		name: "PowerQuery",
		import: (() => import("./powerquery-Ds3ATR9s.js"))
	},
	{
		id: "powershell",
		name: "PowerShell",
		aliases: ["ps", "ps1"],
		import: (() => import("./powershell-5ydAgl5L.js"))
	},
	{
		id: "prisma",
		name: "Prisma",
		import: (() => import("./prisma-6ZzA_ZM7.js"))
	},
	{
		id: "prolog",
		name: "Prolog",
		import: (() => import("./prolog-DSStdQTq.js"))
	},
	{
		id: "proto",
		name: "Protocol Buffer 3",
		aliases: ["protobuf"],
		import: (() => import("./proto-Chh6Q5CM.js"))
	},
	{
		id: "pug",
		name: "Pug",
		aliases: ["jade"],
		import: (() => import("./pug-DHLlk6iG.js"))
	},
	{
		id: "puppet",
		name: "Puppet",
		import: (() => import("./puppet-BLsUK3yq.js"))
	},
	{
		id: "purescript",
		name: "PureScript",
		import: (() => import("./purescript-B02W4seQ.js"))
	},
	{
		id: "python",
		name: "Python",
		aliases: ["py"],
		import: (() => import("./python-BHaXfePs.js"))
	},
	{
		id: "qml",
		name: "QML",
		import: (() => import("./qml-CvermgL-.js"))
	},
	{
		id: "qmldir",
		name: "QML Directory",
		import: (() => import("./qmldir-COlmh4fX.js"))
	},
	{
		id: "qss",
		name: "Qt Style Sheets",
		import: (() => import("./qss-DQUGDdeL.js"))
	},
	{
		id: "r",
		name: "R",
		import: (() => import("./r-DTEVufle.js").then((e) => e.n))
	},
	{
		id: "racket",
		name: "Racket",
		import: (() => import("./racket-Dh3q-EfD.js"))
	},
	{
		id: "raku",
		name: "Raku",
		aliases: ["perl6"],
		import: (() => import("./raku-CdFQrZmh.js"))
	},
	{
		id: "razor",
		name: "ASP.NET Razor",
		import: (() => import("./razor-D-ixfIiw.js"))
	},
	{
		id: "reg",
		name: "Windows Registry Script",
		import: (() => import("./reg-BY6GKaZK.js"))
	},
	{
		id: "regexp",
		name: "RegExp",
		aliases: ["regex"],
		import: (() => import("./regexp-BOoN2t6h.js").then((e) => e.n))
	},
	{
		id: "rel",
		name: "Rel",
		import: (() => import("./rel-DjgjjaPM.js"))
	},
	{
		id: "riscv",
		name: "RISC-V",
		import: (() => import("./riscv-e0swiQQT.js"))
	},
	{
		id: "ron",
		name: "RON",
		import: (() => import("./ron-Ba9vjMyp.js"))
	},
	{
		id: "rosmsg",
		name: "ROS Interface",
		import: (() => import("./rosmsg-33FkgZa7.js"))
	},
	{
		id: "rst",
		name: "reStructuredText",
		import: (() => import("./rst-mX8uD6pi.js"))
	},
	{
		id: "ruby",
		name: "Ruby",
		aliases: ["rb"],
		import: (() => import("./ruby-DU9wPLRL.js"))
	},
	{
		id: "rust",
		name: "Rust",
		aliases: ["rs"],
		import: (() => import("./rust-BgaDMmGE.js"))
	},
	{
		id: "sas",
		name: "SAS",
		import: (() => import("./sas-BCr4Hxap.js"))
	},
	{
		id: "sass",
		name: "Sass",
		import: (() => import("./sass-B4OMkGSD.js"))
	},
	{
		id: "scala",
		name: "Scala",
		import: (() => import("./scala-XOR965h1.js"))
	},
	{
		id: "scheme",
		name: "Scheme",
		import: (() => import("./scheme-CvovbBgk.js"))
	},
	{
		id: "scss",
		name: "SCSS",
		import: (() => import("./scss-BmE64NBC.js").then((e) => e.n))
	},
	{
		id: "sdbl",
		name: "1C (Query)",
		aliases: ["1c-query"],
		import: (() => import("./sdbl-BibMD0HR.js"))
	},
	{
		id: "shaderlab",
		name: "ShaderLab",
		aliases: ["shader"],
		import: (() => import("./shaderlab-B7I8Vn0j.js"))
	},
	{
		id: "shellscript",
		name: "Shell",
		aliases: [
			"bash",
			"sh",
			"shell",
			"zsh"
		],
		import: (() => import("./shellscript-n8r4G6rb.js").then((e) => e.n))
	},
	{
		id: "shellsession",
		name: "Shell Session",
		aliases: ["console"],
		import: (() => import("./shellsession-Dr1HZ9G0.js"))
	},
	{
		id: "smalltalk",
		name: "Smalltalk",
		import: (() => import("./smalltalk-Af8wP6EO.js"))
	},
	{
		id: "solidity",
		name: "Solidity",
		import: (() => import("./solidity-XO2CtNiV.js"))
	},
	{
		id: "soy",
		name: "Closure Templates",
		aliases: ["closure-templates"],
		import: (() => import("./soy-Bea1aqru.js"))
	},
	{
		id: "sparql",
		name: "SPARQL",
		import: (() => import("./sparql-BIa0h4w5.js"))
	},
	{
		id: "splunk",
		name: "Splunk Query Language",
		aliases: ["spl"],
		import: (() => import("./splunk-mpquMt_8.js"))
	},
	{
		id: "sql",
		name: "SQL",
		import: (() => import("./sql-DuWL8Bj_.js").then((e) => e.n))
	},
	{
		id: "ssh-config",
		name: "SSH Config",
		import: (() => import("./ssh-config-DcnVpK-n.js"))
	},
	{
		id: "stata",
		name: "Stata",
		import: (() => import("./stata-BGjmmaAf.js"))
	},
	{
		id: "stylus",
		name: "Stylus",
		aliases: ["styl"],
		import: (() => import("./stylus-Bk8v-7oM.js"))
	},
	{
		id: "surrealql",
		name: "SurrealQL",
		aliases: ["surql"],
		import: (() => import("./surrealql-CudLfy7B.js"))
	},
	{
		id: "svelte",
		name: "Svelte",
		import: (() => import("./svelte-B90NyftT.js"))
	},
	{
		id: "swift",
		name: "Swift",
		import: (() => import("./swift-iMEBw30w.js"))
	},
	{
		id: "system-verilog",
		name: "SystemVerilog",
		import: (() => import("./system-verilog-Ca-E15sJ.js"))
	},
	{
		id: "systemd",
		name: "Systemd Units",
		import: (() => import("./systemd-CS6cln6J.js"))
	},
	{
		id: "talonscript",
		name: "TalonScript",
		aliases: ["talon"],
		import: (() => import("./talonscript-COzgILOx.js"))
	},
	{
		id: "tasl",
		name: "Tasl",
		import: (() => import("./tasl-CrL-TM3j.js"))
	},
	{
		id: "tcl",
		name: "Tcl",
		import: (() => import("./tcl-BK--alTs.js"))
	},
	{
		id: "templ",
		name: "Templ",
		import: (() => import("./templ-D84-DHfn.js"))
	},
	{
		id: "terraform",
		name: "Terraform",
		aliases: ["tf", "tfvars"],
		import: (() => import("./terraform-BKVT4lTN.js"))
	},
	{
		id: "tex",
		name: "TeX",
		import: (() => import("./tex-BLLKfFr1.js"))
	},
	{
		id: "toml",
		name: "TOML",
		import: (() => import("./toml-CXAVGmfI.js"))
	},
	{
		id: "ts-tags",
		name: "TypeScript with Tags",
		aliases: ["lit"],
		import: (() => import("./ts-tags-CYyQsxt0.js"))
	},
	{
		id: "tsv",
		name: "TSV",
		import: (() => import("./tsv-r5fpGho9.js"))
	},
	{
		id: "tsx",
		name: "TSX",
		import: (() => import("./tsx-IRW7WF79.js").then((e) => e.n))
	},
	{
		id: "turtle",
		name: "Turtle",
		import: (() => import("./turtle-BbiQBLu0.js"))
	},
	{
		id: "twig",
		name: "Twig",
		import: (() => import("./twig-Dq9qRHGh.js"))
	},
	{
		id: "typescript",
		name: "TypeScript",
		aliases: [
			"ts",
			"cts",
			"mts"
		],
		import: (() => import("./typescript-DT3Px9BY.js").then((e) => e.n))
	},
	{
		id: "typespec",
		name: "TypeSpec",
		aliases: ["tsp"],
		import: (() => import("./typespec-BOwee40V.js"))
	},
	{
		id: "typst",
		name: "Typst",
		aliases: ["typ"],
		import: (() => import("./typst-BuJgHV1_.js"))
	},
	{
		id: "v",
		name: "V",
		import: (() => import("./v-D-JSl2cB.js"))
	},
	{
		id: "vala",
		name: "Vala",
		import: (() => import("./vala-sKTZx7aP.js"))
	},
	{
		id: "vb",
		name: "Visual Basic",
		aliases: ["cmd"],
		import: (() => import("./vb-hzDOQ9M2.js"))
	},
	{
		id: "verilog",
		name: "Verilog",
		import: (() => import("./verilog-CwL2faH3.js"))
	},
	{
		id: "vhdl",
		name: "VHDL",
		import: (() => import("./vhdl-D4xoRBgL.js"))
	},
	{
		id: "viml",
		name: "Vim Script",
		aliases: ["vim", "vimscript"],
		import: (() => import("./viml-C41wSeLL.js"))
	},
	{
		id: "vue",
		name: "Vue",
		import: (() => import("./vue-BSMiIqVu.js"))
	},
	{
		id: "vue-html",
		name: "Vue HTML",
		import: (() => import("./vue-html-z5063IJm.js"))
	},
	{
		id: "vue-vine",
		name: "Vue Vine",
		import: (() => import("./vue-vine-Cdi58eS2.js"))
	},
	{
		id: "vyper",
		name: "Vyper",
		aliases: ["vy"],
		import: (() => import("./vyper-D4A1KnBn.js"))
	},
	{
		id: "wasm",
		name: "WebAssembly",
		import: (() => import("./wasm-CVPYyV9Y.js"))
	},
	{
		id: "wenyan",
		name: "Wenyan",
		aliases: ["文言"],
		import: (() => import("./wenyan-Czq8OMMr.js"))
	},
	{
		id: "wgsl",
		name: "WGSL",
		import: (() => import("./wgsl-C_l-ZpBu.js"))
	},
	{
		id: "wikitext",
		name: "Wikitext",
		aliases: ["mediawiki", "wiki"],
		import: (() => import("./wikitext-B7epQZx2.js"))
	},
	{
		id: "wit",
		name: "WebAssembly Interface Types",
		import: (() => import("./wit-DswQpcNx.js"))
	},
	{
		id: "wolfram",
		name: "Wolfram",
		aliases: ["wl"],
		import: (() => import("./wolfram-CSEjVwta.js"))
	},
	{
		id: "xml",
		name: "XML",
		import: (() => import("./xml-CsItQbNC.js").then((e) => e.n))
	},
	{
		id: "xsl",
		name: "XSL",
		import: (() => import("./xsl-Dlh5Pqyj.js"))
	},
	{
		id: "yaml",
		name: "YAML",
		aliases: ["yml"],
		import: (() => import("./yaml-CtJFpyCB.js").then((e) => e.n))
	},
	{
		id: "zenscript",
		name: "ZenScript",
		import: (() => import("./zenscript-YvYHF5y3.js"))
	},
	{
		id: "zig",
		name: "Zig",
		import: (() => import("./zig-BgXWauKx.js"))
	}
], qi = Object.fromEntries(Ki.map((e) => [e.id, e.import])), Ji = Object.fromEntries(Ki.flatMap((e) => e.aliases?.map((t) => [t, e.import]) || [])), Yi = {
	...qi,
	...Ji
}, Xi = Object.fromEntries([
	{
		id: "andromeeda",
		displayName: "Andromeeda",
		type: "dark",
		import: (() => import("./andromeeda-Dl_ybyX8.js"))
	},
	{
		id: "aurora-x",
		displayName: "Aurora X",
		type: "dark",
		import: (() => import("./aurora-x-BGtYFcU0.js"))
	},
	{
		id: "ayu-dark",
		displayName: "Ayu Dark",
		type: "dark",
		import: (() => import("./ayu-dark-Dk5yFPWm.js"))
	},
	{
		id: "ayu-light",
		displayName: "Ayu Light",
		type: "light",
		import: (() => import("./ayu-light-BQlH4Yqm.js"))
	},
	{
		id: "ayu-mirage",
		displayName: "Ayu Mirage",
		type: "dark",
		import: (() => import("./ayu-mirage-BASO34ci.js"))
	},
	{
		id: "catppuccin-frappe",
		displayName: "Catppuccin Frappé",
		type: "dark",
		import: (() => import("./catppuccin-frappe-BThSgk4t.js"))
	},
	{
		id: "catppuccin-latte",
		displayName: "Catppuccin Latte",
		type: "light",
		import: (() => import("./catppuccin-latte--hsoqZZ3.js"))
	},
	{
		id: "catppuccin-macchiato",
		displayName: "Catppuccin Macchiato",
		type: "dark",
		import: (() => import("./catppuccin-macchiato-DLzceS7e.js"))
	},
	{
		id: "catppuccin-mocha",
		displayName: "Catppuccin Mocha",
		type: "dark",
		import: (() => import("./catppuccin-mocha-DlPM1imE.js"))
	},
	{
		id: "dark-plus",
		displayName: "Dark Plus",
		type: "dark",
		import: (() => import("./dark-plus-DmwleDGn.js"))
	},
	{
		id: "dracula",
		displayName: "Dracula Theme",
		type: "dark",
		import: (() => import("./dracula-CTxGZyhJ.js"))
	},
	{
		id: "dracula-soft",
		displayName: "Dracula Theme Soft",
		type: "dark",
		import: (() => import("./dracula-soft-CKCkDOyb.js"))
	},
	{
		id: "everforest-dark",
		displayName: "Everforest Dark",
		type: "dark",
		import: (() => import("./everforest-dark-CSkflZuW.js"))
	},
	{
		id: "everforest-light",
		displayName: "Everforest Light",
		type: "light",
		import: (() => import("./everforest-light-CXU3EUcV.js"))
	},
	{
		id: "github-dark",
		displayName: "GitHub Dark",
		type: "dark",
		import: (() => import("./github-dark-xcSqNsVI.js"))
	},
	{
		id: "github-dark-default",
		displayName: "GitHub Dark Default",
		type: "dark",
		import: (() => import("./github-dark-default-DSGq14O1.js"))
	},
	{
		id: "github-dark-dimmed",
		displayName: "GitHub Dark Dimmed",
		type: "dark",
		import: (() => import("./github-dark-dimmed-B15Mvxa8.js"))
	},
	{
		id: "github-dark-high-contrast",
		displayName: "GitHub Dark High Contrast",
		type: "dark",
		import: (() => import("./github-dark-high-contrast-CVIjJzYw.js"))
	},
	{
		id: "github-light",
		displayName: "GitHub Light",
		type: "light",
		import: (() => import("./github-light-BNubH2n_.js"))
	},
	{
		id: "github-light-default",
		displayName: "GitHub Light Default",
		type: "light",
		import: (() => import("./github-light-default-BoW8rSL8.js"))
	},
	{
		id: "github-light-high-contrast",
		displayName: "GitHub Light High Contrast",
		type: "light",
		import: (() => import("./github-light-high-contrast-CfPwOLIo.js"))
	},
	{
		id: "gruvbox-dark-hard",
		displayName: "Gruvbox Dark Hard",
		type: "dark",
		import: (() => import("./gruvbox-dark-hard-Dry_8kxf.js"))
	},
	{
		id: "gruvbox-dark-medium",
		displayName: "Gruvbox Dark Medium",
		type: "dark",
		import: (() => import("./gruvbox-dark-medium-wGSbCTmw.js"))
	},
	{
		id: "gruvbox-dark-soft",
		displayName: "Gruvbox Dark Soft",
		type: "dark",
		import: (() => import("./gruvbox-dark-soft-C5BHTQaz.js"))
	},
	{
		id: "gruvbox-light-hard",
		displayName: "Gruvbox Light Hard",
		type: "light",
		import: (() => import("./gruvbox-light-hard-DwNfhlyf.js"))
	},
	{
		id: "gruvbox-light-medium",
		displayName: "Gruvbox Light Medium",
		type: "light",
		import: (() => import("./gruvbox-light-medium-D1PebEf3.js"))
	},
	{
		id: "gruvbox-light-soft",
		displayName: "Gruvbox Light Soft",
		type: "light",
		import: (() => import("./gruvbox-light-soft-DYngHi7s.js"))
	},
	{
		id: "horizon",
		displayName: "Horizon",
		type: "dark",
		import: (() => import("./horizon-BCMebvoY.js"))
	},
	{
		id: "horizon-bright",
		displayName: "Horizon Bright",
		type: "dark",
		import: (() => import("./horizon-bright-Dwl_EOEi.js"))
	},
	{
		id: "houston",
		displayName: "Houston",
		type: "dark",
		import: (() => import("./houston-Bx2HRobP.js"))
	},
	{
		id: "kanagawa-dragon",
		displayName: "Kanagawa Dragon",
		type: "dark",
		import: (() => import("./kanagawa-dragon-IWCx4HC1.js"))
	},
	{
		id: "kanagawa-lotus",
		displayName: "Kanagawa Lotus",
		type: "light",
		import: (() => import("./kanagawa-lotus-Cv9F-48R.js"))
	},
	{
		id: "kanagawa-wave",
		displayName: "Kanagawa Wave",
		type: "dark",
		import: (() => import("./kanagawa-wave-ClkYi_l6.js"))
	},
	{
		id: "laserwave",
		displayName: "LaserWave",
		type: "dark",
		import: (() => import("./laserwave-gnuKE9Ar.js"))
	},
	{
		id: "light-plus",
		displayName: "Light Plus",
		type: "light",
		import: (() => import("./light-plus-BN6zUfCN.js"))
	},
	{
		id: "material-theme",
		displayName: "Material Theme",
		type: "dark",
		import: (() => import("./material-theme-BB6E-z3Y.js"))
	},
	{
		id: "material-theme-darker",
		displayName: "Material Theme Darker",
		type: "dark",
		import: (() => import("./material-theme-darker-B8oHhUM8.js"))
	},
	{
		id: "material-theme-lighter",
		displayName: "Material Theme Lighter",
		type: "light",
		import: (() => import("./material-theme-lighter-Dv58gETG.js"))
	},
	{
		id: "material-theme-ocean",
		displayName: "Material Theme Ocean",
		type: "dark",
		import: (() => import("./material-theme-ocean-CPNBVkpo.js"))
	},
	{
		id: "material-theme-palenight",
		displayName: "Material Theme Palenight",
		type: "dark",
		import: (() => import("./material-theme-palenight-Xvd-u27y.js"))
	},
	{
		id: "min-dark",
		displayName: "Min Dark",
		type: "dark",
		import: (() => import("./min-dark-CFKgwsYX.js"))
	},
	{
		id: "min-light",
		displayName: "Min Light",
		type: "light",
		import: (() => import("./min-light-CrcMyzUQ.js"))
	},
	{
		id: "monokai",
		displayName: "Monokai",
		type: "dark",
		import: (() => import("./monokai-ElZ6AkVF.js"))
	},
	{
		id: "night-owl",
		displayName: "Night Owl",
		type: "dark",
		import: (() => import("./night-owl-Ct1HA-O2.js"))
	},
	{
		id: "night-owl-light",
		displayName: "Night Owl Light",
		type: "light",
		import: (() => import("./night-owl-light-DL0npa1W.js"))
	},
	{
		id: "nord",
		displayName: "Nord",
		type: "dark",
		import: (() => import("./nord-B4IQJ9jq.js"))
	},
	{
		id: "one-dark-pro",
		displayName: "One Dark Pro",
		type: "dark",
		import: (() => import("./one-dark-pro-D0OPU-vB.js"))
	},
	{
		id: "one-light",
		displayName: "One Light",
		type: "light",
		import: (() => import("./one-light-BxbLxDg4.js"))
	},
	{
		id: "plastic",
		displayName: "Plastic",
		type: "dark",
		import: (() => import("./plastic-Dh-dZc2t.js"))
	},
	{
		id: "poimandres",
		displayName: "Poimandres",
		type: "dark",
		import: (() => import("./poimandres-BdW6zmph.js"))
	},
	{
		id: "red",
		displayName: "Red",
		type: "dark",
		import: (() => import("./red-U3KrSwDB.js"))
	},
	{
		id: "rose-pine",
		displayName: "Rosé Pine",
		type: "dark",
		import: (() => import("./rose-pine-Bf7OPdpm.js"))
	},
	{
		id: "rose-pine-dawn",
		displayName: "Rosé Pine Dawn",
		type: "light",
		import: (() => import("./rose-pine-dawn-H-0g5VCa.js"))
	},
	{
		id: "rose-pine-moon",
		displayName: "Rosé Pine Moon",
		type: "dark",
		import: (() => import("./rose-pine-moon-Dwy7CjmA.js"))
	},
	{
		id: "slack-dark",
		displayName: "Slack Dark",
		type: "dark",
		import: (() => import("./slack-dark-BrgzlbcG.js"))
	},
	{
		id: "slack-ochin",
		displayName: "Slack Ochin",
		type: "light",
		import: (() => import("./slack-ochin-Bk8sBpJN.js"))
	},
	{
		id: "snazzy-light",
		displayName: "Snazzy Light",
		type: "light",
		import: (() => import("./snazzy-light-Dfbx6lz7.js"))
	},
	{
		id: "solarized-dark",
		displayName: "Solarized Dark",
		type: "dark",
		import: (() => import("./solarized-dark-5zOUev_8.js"))
	},
	{
		id: "solarized-light",
		displayName: "Solarized Light",
		type: "light",
		import: (() => import("./solarized-light-DnOm57zz.js"))
	},
	{
		id: "synthwave-84",
		displayName: "Synthwave '84",
		type: "dark",
		import: (() => import("./synthwave-84-DzRvRgQS.js"))
	},
	{
		id: "tokyo-night",
		displayName: "Tokyo Night",
		type: "dark",
		import: (() => import("./tokyo-night-BKadRqfn.js"))
	},
	{
		id: "vesper",
		displayName: "Vesper",
		type: "dark",
		import: (() => import("./vesper-bTL8-_Vw.js"))
	},
	{
		id: "vitesse-black",
		displayName: "Vitesse Black",
		type: "dark",
		import: (() => import("./vitesse-black-BY7XWA20.js"))
	},
	{
		id: "vitesse-dark",
		displayName: "Vitesse Dark",
		type: "dark",
		import: (() => import("./vitesse-dark-BuSCuSVu.js"))
	},
	{
		id: "vitesse-light",
		displayName: "Vitesse Light",
		type: "light",
		import: (() => import("./vitesse-light-DgbjLgSU.js"))
	}
].map((e) => [e.id, e.import])), Zi = class extends Error {
	constructor(e) {
		super(e), this.name = "ShikiError";
	}
};
function Qi() {
	return 2147483648;
}
function $i() {
	return typeof performance < "u" ? performance.now() : Date.now();
}
var ea = (e, t) => e + (t - e % t) % t;
async function ta(e) {
	let t, n, r = {};
	function i(e) {
		n = e, r.HEAPU8 = new Uint8Array(e), r.HEAPU32 = new Uint32Array(e);
	}
	function a(e, t, n) {
		r.HEAPU8.copyWithin(e, t, t + n);
	}
	function o(e) {
		try {
			return t.grow(e - n.byteLength + 65535 >>> 16), i(t.buffer), 1;
		} catch {}
	}
	function s(e) {
		let t = r.HEAPU8.length;
		e >>>= 0;
		let n = Qi();
		if (e > n) return !1;
		for (let r = 1; r <= 4; r *= 2) {
			let i = t * (1 + .2 / r);
			if (i = Math.min(i, e + 100663296), o(Math.min(n, ea(Math.max(e, i), 65536)))) return !0;
		}
		return !1;
	}
	let c = typeof TextDecoder < "u" ? new TextDecoder("utf8") : void 0;
	function l(e, t, n = 1024) {
		let r = t + n, i = t;
		for (; e[i] && !(i >= r);) ++i;
		if (i - t > 16 && e.buffer && c) return c.decode(e.subarray(t, i));
		let a = "";
		for (; t < i;) {
			let n = e[t++];
			if (!(n & 128)) {
				a += String.fromCharCode(n);
				continue;
			}
			let r = e[t++] & 63;
			if ((n & 224) == 192) {
				a += String.fromCharCode((n & 31) << 6 | r);
				continue;
			}
			let i = e[t++] & 63;
			if (n = (n & 240) == 224 ? (n & 15) << 12 | r << 6 | i : (n & 7) << 18 | r << 12 | i << 6 | e[t++] & 63, n < 65536) a += String.fromCharCode(n);
			else {
				let e = n - 65536;
				a += String.fromCharCode(55296 | e >> 10, 56320 | e & 1023);
			}
		}
		return a;
	}
	function u(e, t) {
		return e ? l(r.HEAPU8, e, t) : "";
	}
	let d = {
		emscripten_get_now: $i,
		emscripten_memcpy_big: a,
		emscripten_resize_heap: s,
		fd_write: () => 0
	};
	async function f() {
		let n = await e({
			env: d,
			wasi_snapshot_preview1: d
		});
		t = n.memory, i(t.buffer), Object.assign(r, n), r.UTF8ToString = u;
	}
	return await f(), r;
}
var na = Object.defineProperty, ra = (e, t, n) => t in e ? na(e, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: n
}) : e[t] = n, M = (e, t, n) => ra(e, typeof t == "symbol" ? t : t + "", n), N = null;
function ia(e) {
	throw new Zi(e.UTF8ToString(e.getLastOnigError()));
}
var aa = class e {
	constructor(t) {
		M(this, "utf16Length"), M(this, "utf8Length"), M(this, "utf16Value"), M(this, "utf8Value"), M(this, "utf16OffsetToUtf8"), M(this, "utf8OffsetToUtf16");
		let n = t.length, r = e._utf8ByteLength(t), i = r !== n, a = i ? new Uint32Array(n + 1) : null;
		i && (a[n] = r);
		let o = i ? new Uint32Array(r + 1) : null;
		i && (o[r] = n);
		let s = new Uint8Array(r), c = 0;
		for (let e = 0; e < n; e++) {
			let r = t.charCodeAt(e), l = r, u = !1;
			if (r >= 55296 && r <= 56319 && e + 1 < n) {
				let n = t.charCodeAt(e + 1);
				n >= 56320 && n <= 57343 && (l = (r - 55296 << 10) + 65536 | n - 56320, u = !0);
			}
			i && (a[e] = c, u && (a[e + 1] = c), l <= 127 ? o[c + 0] = e : l <= 2047 ? (o[c + 0] = e, o[c + 1] = e) : l <= 65535 ? (o[c + 0] = e, o[c + 1] = e, o[c + 2] = e) : (o[c + 0] = e, o[c + 1] = e, o[c + 2] = e, o[c + 3] = e)), l <= 127 ? s[c++] = l : l <= 2047 ? (s[c++] = 192 | (l & 1984) >>> 6, s[c++] = 128 | (l & 63) >>> 0) : l <= 65535 ? (s[c++] = 224 | (l & 61440) >>> 12, s[c++] = 128 | (l & 4032) >>> 6, s[c++] = 128 | (l & 63) >>> 0) : (s[c++] = 240 | (l & 1835008) >>> 18, s[c++] = 128 | (l & 258048) >>> 12, s[c++] = 128 | (l & 4032) >>> 6, s[c++] = 128 | (l & 63) >>> 0), u && e++;
		}
		this.utf16Length = n, this.utf8Length = r, this.utf16Value = t, this.utf8Value = s, this.utf16OffsetToUtf8 = a, this.utf8OffsetToUtf16 = o;
	}
	static _utf8ByteLength(e) {
		let t = 0;
		for (let n = 0, r = e.length; n < r; n++) {
			let i = e.charCodeAt(n), a = i, o = !1;
			if (i >= 55296 && i <= 56319 && n + 1 < r) {
				let t = e.charCodeAt(n + 1);
				t >= 56320 && t <= 57343 && (a = (i - 55296 << 10) + 65536 | t - 56320, o = !0);
			}
			t += a <= 127 ? 1 : a <= 2047 ? 2 : a <= 65535 ? 3 : 4, o && n++;
		}
		return t;
	}
	createString(e) {
		let t = e.omalloc(this.utf8Length);
		return e.HEAPU8.set(this.utf8Value, t), t;
	}
}, oa = class e {
	constructor(t) {
		if (M(this, "id", ++e.LAST_ID), M(this, "_onigBinding"), M(this, "content"), M(this, "utf16Length"), M(this, "utf8Length"), M(this, "utf16OffsetToUtf8"), M(this, "utf8OffsetToUtf16"), M(this, "ptr"), !N) throw new Zi("Must invoke loadWasm first.");
		this._onigBinding = N, this.content = t;
		let n = new aa(t);
		this.utf16Length = n.utf16Length, this.utf8Length = n.utf8Length, this.utf16OffsetToUtf8 = n.utf16OffsetToUtf8, this.utf8OffsetToUtf16 = n.utf8OffsetToUtf16, this.utf8Length < 1e4 && !e._sharedPtrInUse ? (e._sharedPtr ||= N.omalloc(1e4), e._sharedPtrInUse = !0, N.HEAPU8.set(n.utf8Value, e._sharedPtr), this.ptr = e._sharedPtr) : this.ptr = n.createString(N);
	}
	convertUtf8OffsetToUtf16(e) {
		return this.utf8OffsetToUtf16 ? e < 0 ? 0 : e > this.utf8Length ? this.utf16Length : this.utf8OffsetToUtf16[e] : e;
	}
	convertUtf16OffsetToUtf8(e) {
		return this.utf16OffsetToUtf8 ? e < 0 ? 0 : e > this.utf16Length ? this.utf8Length : this.utf16OffsetToUtf8[e] : e;
	}
	dispose() {
		this.ptr === e._sharedPtr ? e._sharedPtrInUse = !1 : this._onigBinding.ofree(this.ptr);
	}
};
M(oa, "LAST_ID", 0), M(oa, "_sharedPtr", 0), M(oa, "_sharedPtrInUse", !1);
var sa = oa, ca = class {
	constructor(e) {
		if (M(this, "_onigBinding"), M(this, "_ptr"), !N) throw new Zi("Must invoke loadWasm first.");
		let t = [], n = [];
		for (let r = 0, i = e.length; r < i; r++) {
			let i = new aa(e[r]);
			t[r] = i.createString(N), n[r] = i.utf8Length;
		}
		let r = N.omalloc(4 * e.length);
		N.HEAPU32.set(t, r / 4);
		let i = N.omalloc(4 * e.length);
		N.HEAPU32.set(n, i / 4);
		let a = N.createOnigScanner(r, i, e.length);
		for (let n = 0, r = e.length; n < r; n++) N.ofree(t[n]);
		N.ofree(i), N.ofree(r), a === 0 && ia(N), this._onigBinding = N, this._ptr = a;
	}
	dispose() {
		this._onigBinding.freeOnigScanner(this._ptr);
	}
	findNextMatchSync(e, t, n) {
		let r = 0;
		if (typeof n == "number" && (r = n), typeof e == "string") {
			e = new sa(e);
			let n = this._findNextMatchSync(e, t, !1, r);
			return e.dispose(), n;
		}
		return this._findNextMatchSync(e, t, !1, r);
	}
	_findNextMatchSync(e, t, n, r) {
		let i = this._onigBinding, a = i.findNextOnigScannerMatch(this._ptr, e.id, e.ptr, e.utf8Length, e.convertUtf16OffsetToUtf8(t), r);
		if (a === 0) return null;
		let o = i.HEAPU32, s = a / 4, c = o[s++], l = o[s++], u = [];
		for (let t = 0; t < l; t++) {
			let n = e.convertUtf8OffsetToUtf16(o[s++]), r = e.convertUtf8OffsetToUtf16(o[s++]);
			u[t] = {
				start: n,
				end: r,
				length: r - n
			};
		}
		return {
			index: c,
			captureIndices: u
		};
	}
};
function la(e) {
	return typeof e.instantiator == "function";
}
function ua(e) {
	return typeof e.default == "function";
}
function da(e) {
	return e.data !== void 0;
}
function fa(e) {
	return typeof Response < "u" && e instanceof Response;
}
function pa(e) {
	return typeof ArrayBuffer < "u" && (e instanceof ArrayBuffer || ArrayBuffer.isView(e)) || typeof Buffer < "u" && Buffer.isBuffer?.(e) || typeof SharedArrayBuffer < "u" && e instanceof SharedArrayBuffer || typeof Uint32Array < "u" && e instanceof Uint32Array;
}
var ma;
function ha(e) {
	if (ma) return ma;
	async function t() {
		N = await ta(async (t) => {
			let n = e;
			return n = await n, typeof n == "function" && (n = await n(t)), typeof n == "function" && (n = await n(t)), la(n) ? n = await n.instantiator(t) : ua(n) ? n = await n.default(t) : (da(n) && (n = n.data), fa(n) ? n = typeof WebAssembly.instantiateStreaming == "function" ? await _a(n)(t) : await va(n)(t) : pa(n) || n instanceof WebAssembly.Module ? n = await ga(n)(t) : "default" in n && n.default instanceof WebAssembly.Module && (n = await ga(n.default)(t))), "instance" in n && (n = n.instance), "exports" in n && (n = n.exports), n;
		});
	}
	return ma = t(), ma;
}
function ga(e) {
	return (t) => WebAssembly.instantiate(e, t);
}
function _a(e) {
	return (t) => WebAssembly.instantiateStreaming(e, t);
}
function va(e) {
	return async (t) => {
		let n = await e.arrayBuffer();
		return WebAssembly.instantiate(n, t);
	};
}
async function ya(e) {
	return e && await ha(e), {
		createScanner(e) {
			return new ca(e.map((e) => typeof e == "string" ? e : e.source));
		},
		createString(e) {
			return new sa(e);
		}
	};
}
// node_modules/shiki/dist/bundle-full.mjs
var ba = /* @__PURE__ */ Ui({
	langs: Yi,
	themes: Xi,
	engine: () => ya(import("./wasm--bz4hFdV.js"))
}), { codeToHtml: xa, codeToHast: Sa, codeToTokens: Ca, codeToTokensBase: wa, codeToTokensWithThemes: Ta, getSingletonHighlighter: Ea, getLastGrammarState: Da } = /* @__PURE__ */ Gi(ba, { guessEmbeddedLanguages: Mr });
// node_modules/oniguruma-parser/dist/utils.js
function Oa(e) {
	if ([...e].length !== 1) throw Error(`Expected "${e}" to be a single code point`);
	return e.codePointAt(0);
}
function ka(e, t, n) {
	return e.has(t) || e.set(t, n), e.get(t);
}
var Aa = /* @__PURE__ */ new Set([
	"alnum",
	"alpha",
	"ascii",
	"blank",
	"cntrl",
	"digit",
	"graph",
	"lower",
	"print",
	"punct",
	"space",
	"upper",
	"word",
	"xdigit"
]), P = String.raw;
function ja(e, t) {
	if (e == null) throw Error(t ?? "Value expected");
	return e;
}
// node_modules/oniguruma-parser/dist/tokenizer/tokenize.js
var Ma = P`\[\^?`, Na = `c.? | C(?:-.?)?|${P`[pP]\{(?:\^?[-\x20_]*[A-Za-z][-\x20\w]*\})?`}|${P`x[89A-Fa-f]\p{AHex}(?:\\x[89A-Fa-f]\p{AHex})*`}|${P`u(?:\p{AHex}{4})? | x\{[^\}]*\}? | x\p{AHex}{0,2}`}|${P`o\{[^\}]*\}?`}|${P`\d{1,3}`}`, Pa = /[?*+][?+]?|\{(?:\d+(?:,\d*)?|,\d+)\}\??/, Fa = new RegExp(P`
  \\ (?:
    ${Na}
    | [gk]<[^>]*>?
    | [gk]'[^']*'?
    | .
  )
  | \( (?:
    \? (?:
      [:=!>({]
      | <[=!]
      | <[^>]*>
      | '[^']*'
      | ~\|?
      | #(?:[^)\\]|\\.?)*
      | [^:)]*[:)]
    )?
    | \*[^\)]*\)?
  )?
  | (?:${Pa.source})+
  | ${Ma}
  | .
`.replace(/\s+/g, ""), "gsu"), Ia = new RegExp(P`
  \\ (?:
    ${Na}
    | .
  )
  | \[:(?:\^?\p{Alpha}+|\^):\]
  | ${Ma}
  | &&
  | .
`.replace(/\s+/g, ""), "gsu");
function La(e, t = {}) {
	let n = {
		flags: "",
		...t,
		rules: {
			captureGroup: !1,
			singleline: !1,
			...t.rules
		}
	};
	if (typeof e != "string") throw Error("String expected as pattern");
	let r = fo(n.flags), i = [r.extended], a = {
		captureGroup: n.rules.captureGroup,
		getCurrentModX() {
			return i.at(-1);
		},
		numOpenGroups: 0,
		popModX() {
			i.pop();
		},
		pushModX(e) {
			i.push(e);
		},
		replaceCurrentModX(e) {
			i[i.length - 1] = e;
		},
		singleline: n.rules.singleline
	}, o = [], s;
	for (Fa.lastIndex = 0; s = Fa.exec(e);) {
		let t = Ra(a, e, s[0], Fa.lastIndex);
		t.tokens ? o.push(...t.tokens) : t.token && o.push(t.token), t.lastIndex !== void 0 && (Fa.lastIndex = t.lastIndex);
	}
	let c = [], l = 0;
	o.filter((e) => e.type === "GroupOpen").forEach((e) => {
		e.kind === "capturing" ? e.number = ++l : e.raw === "(" && c.push(e);
	}), l || c.forEach((e, t) => {
		e.kind = "capturing", e.number = t + 1;
	});
	let u = l || c.length;
	return {
		tokens: o.map((e) => e.type === "EscapedNumber" ? mo(e, u) : e).flat(),
		flags: r
	};
}
function Ra(e, t, n, r) {
	let [i, a] = n;
	if (n === "[" || n === "[^") {
		let e = za(t, n, r);
		return {
			tokens: e.tokens,
			lastIndex: e.lastIndex
		};
	}
	if (i === "\\") {
		if ("AbBGyYzZ".includes(a)) return { token: Ua(n, n) };
		if (/^\\g[<']/.test(n)) {
			if (!/^\\g(?:<[^>]+>|'[^']+')$/.test(n)) throw Error(`Invalid group name "${n}"`);
			return { token: to(n) };
		}
		if (/^\\k[<']/.test(n)) {
			if (!/^\\k(?:<[^>]+>|'[^']+')$/.test(n)) throw Error(`Invalid group name "${n}"`);
			return { token: Wa(n) };
		}
		if (a === "K") return { token: Ya("keep", n) };
		if (a === "N" || a === "R") return { token: I("newline", n, { negate: a === "N" }) };
		if (a === "O") return { token: I("any", n) };
		if (a === "X") return { token: I("text_segment", n) };
		let e = Va(n, { inCharClass: !1 });
		return Array.isArray(e) ? { tokens: e } : { token: e };
	}
	if (i === "(") {
		if (a === "*") return { token: oo(n) };
		if (n === "(?{") throw Error(`Unsupported callout "${n}"`);
		if (n.startsWith("(?#")) {
			if (t[r] !== ")") throw Error("Unclosed comment group \"(?#\"");
			return { lastIndex: r + 1 };
		}
		if (/^\(\?[-imx]+[:)]$/.test(n)) return { token: ao(n, e) };
		if (e.pushModX(e.getCurrentModX()), e.numOpenGroups++, n === "(" && !e.captureGroup || n === "(?:") return { token: Qa("group", n) };
		if (n === "(?>") return { token: Qa("atomic", n) };
		if (n === "(?=" || n === "(?!" || n === "(?<=" || n === "(?<!") return { token: Qa(n[2] === "<" ? "lookbehind" : "lookahead", n, { negate: n.endsWith("!") }) };
		if (n === "(" && e.captureGroup || n.startsWith("(?<") && n.endsWith(">") || n.startsWith("(?'") && n.endsWith("'")) return { token: Qa("capturing", n, { ...n !== "(" && { name: n.slice(3, -1) } }) };
		if (n.startsWith("(?~")) {
			if (n === "(?~|") throw Error(`Unsupported absence function kind "${n}"`);
			return { token: Qa("absence_repeater", n) };
		}
		throw Error(n === "(?(" ? `Unsupported conditional "${n}"` : `Invalid or unsupported group option "${n}"`);
	}
	if (n === ")") {
		if (e.popModX(), e.numOpenGroups--, e.numOpenGroups < 0) throw Error("Unmatched \")\"");
		return { token: Za(n) };
	}
	if (e.getCurrentModX()) {
		if (n === "#") {
			let e = t.indexOf("\n", r);
			return { lastIndex: e === -1 ? t.length : e };
		}
		if (/^\s$/.test(n)) {
			let e = /\s+/y;
			return e.lastIndex = r, { lastIndex: e.exec(t) ? e.lastIndex : r };
		}
	}
	return n === "." ? { token: I("dot", n) } : n === "^" || n === "$" ? { token: Ua(e.singleline ? {
		"^": P`\A`,
		$: P`\Z`
	}[n] : n, n) } : n === "|" ? { token: Ha(n) } : Pa.test(n) ? { tokens: ho(n) } : { token: F(Oa(n), n) };
}
function za(e, t, n) {
	let r = [Ja(t[1] === "^", t)], i = 1, a;
	for (Ia.lastIndex = n; a = Ia.exec(e);) {
		let e = a[0];
		if (e[0] === "[" && e[1] !== ":") i++, r.push(Ja(e[1] === "^", e));
		else if (e === "]") {
			if (r.at(-1).type === "CharacterClassOpen") r.push(F(93, e));
			else if (i--, r.push(Ga(e)), !i) break;
		} else {
			let t = Ba(e);
			Array.isArray(t) ? r.push(...t) : r.push(t);
		}
	}
	return {
		tokens: r,
		lastIndex: Ia.lastIndex || e.length
	};
}
function Ba(e) {
	if (e[0] === "\\") return Va(e, { inCharClass: !0 });
	if (e[0] === "[") {
		let t = /\[:(?<negate>\^?)(?<name>[a-z]+):\]/.exec(e);
		if (!t || !Aa.has(t.groups.name)) throw Error(`Invalid POSIX class "${e}"`);
		return I("posix", e, {
			value: t.groups.name,
			negate: !!t.groups.negate
		});
	}
	return e === "-" ? Ka(e) : e === "&&" ? qa(e) : F(Oa(e), e);
}
function Va(e, { inCharClass: t }) {
	let n = e[1];
	if (n === "c" || n === "C") return io(e);
	if ("dDhHsSwW".includes(n)) return co(e);
	if (e.startsWith(P`\o{`)) throw Error(`Incomplete, invalid, or unsupported octal code point "${e}"`);
	if (/^\\[pP]\{/.test(e)) {
		if (e.length === 3) throw Error(`Incomplete or invalid Unicode property "${e}"`);
		return lo(e);
	}
	if (/^\\x[89A-Fa-f]\p{AHex}/u.test(e)) try {
		let t = e.split(/\\x/).slice(1).map((e) => parseInt(e, 16)), n = new TextDecoder("utf-8", {
			ignoreBOM: !0,
			fatal: !0
		}).decode(new Uint8Array(t)), r = new TextEncoder();
		return [...n].map((e) => {
			let t = [...r.encode(e)].map((e) => `\\x${e.toString(16)}`).join("");
			return F(Oa(e), t);
		});
	} catch {
		throw Error(`Multibyte code "${e}" incomplete or invalid in Oniguruma`);
	}
	if (n === "u" || n === "x") return F(po(e), e);
	if (ro.has(n)) return F(ro.get(n), e);
	if (/\d/.test(n)) return Xa(t, e);
	if (e === "\\") throw Error(P`Incomplete escape "\"`);
	if (n === "M") throw Error(`Unsupported meta "${e}"`);
	if ([...e].length === 2) return F(e.codePointAt(1), e);
	throw Error(`Unexpected escape "${e}"`);
}
function Ha(e) {
	return {
		type: "Alternator",
		raw: e
	};
}
function Ua(e, t) {
	return {
		type: "Assertion",
		kind: e,
		raw: t
	};
}
function Wa(e) {
	return {
		type: "Backreference",
		raw: e
	};
}
function F(e, t) {
	return {
		type: "Character",
		value: e,
		raw: t
	};
}
function Ga(e) {
	return {
		type: "CharacterClassClose",
		raw: e
	};
}
function Ka(e) {
	return {
		type: "CharacterClassHyphen",
		raw: e
	};
}
function qa(e) {
	return {
		type: "CharacterClassIntersector",
		raw: e
	};
}
function Ja(e, t) {
	return {
		type: "CharacterClassOpen",
		negate: e,
		raw: t
	};
}
function I(e, t, n = {}) {
	return {
		type: "CharacterSet",
		kind: e,
		...n,
		raw: t
	};
}
function Ya(e, t, n = {}) {
	return e === "keep" ? {
		type: "Directive",
		kind: e,
		raw: t
	} : {
		type: "Directive",
		kind: e,
		flags: ja(n.flags),
		raw: t
	};
}
function Xa(e, t) {
	return {
		type: "EscapedNumber",
		inCharClass: e,
		raw: t
	};
}
function Za(e) {
	return {
		type: "GroupClose",
		raw: e
	};
}
function Qa(e, t, n = {}) {
	return {
		type: "GroupOpen",
		kind: e,
		...n,
		raw: t
	};
}
function $a(e, t, n, r) {
	return {
		type: "NamedCallout",
		kind: e,
		tag: t,
		arguments: n,
		raw: r
	};
}
function eo(e, t, n, r) {
	return {
		type: "Quantifier",
		kind: e,
		min: t,
		max: n,
		raw: r
	};
}
function to(e) {
	return {
		type: "Subroutine",
		raw: e
	};
}
var no = /* @__PURE__ */ new Set([
	"COUNT",
	"CMP",
	"ERROR",
	"FAIL",
	"MAX",
	"MISMATCH",
	"SKIP",
	"TOTAL_COUNT"
]), ro = /* @__PURE__ */ new Map([
	["a", 7],
	["b", 8],
	["e", 27],
	["f", 12],
	["n", 10],
	["r", 13],
	["t", 9],
	["v", 11]
]);
function io(e) {
	let t = e[1] === "c" ? e[2] : e[3];
	if (!t || !/[A-Za-z]/.test(t)) throw Error(`Unsupported control character "${e}"`);
	return F(Oa(t.toUpperCase()) - 64, e);
}
function ao(e, t) {
	let { on: n, off: r } = /^\(\?(?<on>[imx]*)(?:-(?<off>[-imx]*))?/.exec(e).groups;
	r ??= "";
	let i = (t.getCurrentModX() || n.includes("x")) && !r.includes("x"), a = uo(n), o = uo(r), s = {};
	if (a && (s.enable = a), o && (s.disable = o), e.endsWith(")")) return t.replaceCurrentModX(i), Ya("flags", e, { flags: s });
	if (e.endsWith(":")) return t.pushModX(i), t.numOpenGroups++, Qa("group", e, { ...(a || o) && { flags: s } });
	throw Error(`Unexpected flag modifier "${e}"`);
}
function oo(e) {
	let t = /\(\*(?<name>[A-Za-z_]\w*)?(?:\[(?<tag>(?:[A-Za-z_]\w*)?)\])?(?:\{(?<args>[^}]*)\})?\)/.exec(e);
	if (!t) throw Error(`Incomplete or invalid named callout "${e}"`);
	let { name: n, tag: r, args: i } = t.groups;
	if (!n) throw Error(`Invalid named callout "${e}"`);
	if (r === "") throw Error(`Named callout tag with empty value not allowed "${e}"`);
	let a = i ? i.split(",").filter((e) => e !== "").map((e) => /^[+-]?\d+$/.test(e) ? +e : e) : [], [o, s, c] = a, l = no.has(n) ? n.toLowerCase() : "custom";
	switch (l) {
		case "fail":
		case "mismatch":
		case "skip":
			if (a.length > 0) throw Error(`Named callout arguments not allowed "${a}"`);
			break;
		case "error":
			if (a.length > 1) throw Error(`Named callout allows only one argument "${a}"`);
			if (typeof o == "string") throw Error(`Named callout argument must be a number "${o}"`);
			break;
		case "max":
			if (!a.length || a.length > 2) throw Error(`Named callout must have one or two arguments "${a}"`);
			if (typeof o == "string" && !/^[A-Za-z_]\w*$/.test(o)) throw Error(`Named callout argument one must be a tag or number "${o}"`);
			if (a.length === 2 && (typeof s == "number" || !/^[<>X]$/.test(s))) throw Error(`Named callout optional argument two must be '<', '>', or 'X' "${s}"`);
			break;
		case "count":
		case "total_count":
			if (a.length > 1) throw Error(`Named callout allows only one argument "${a}"`);
			if (a.length === 1 && (typeof o == "number" || !/^[<>X]$/.test(o))) throw Error(`Named callout optional argument must be '<', '>', or 'X' "${o}"`);
			break;
		case "cmp":
			if (a.length !== 3) throw Error(`Named callout must have three arguments "${a}"`);
			if (typeof o == "string" && !/^[A-Za-z_]\w*$/.test(o)) throw Error(`Named callout argument one must be a tag or number "${o}"`);
			if (typeof s == "number" || !/^(?:[<>!=]=|[<>])$/.test(s)) throw Error(`Named callout argument two must be '==', '!=', '>', '<', '>=', or '<=' "${s}"`);
			if (typeof c == "string" && !/^[A-Za-z_]\w*$/.test(c)) throw Error(`Named callout argument three must be a tag or number "${c}"`);
			break;
		case "custom": throw Error(`Undefined callout name "${n}"`);
		default: throw Error(`Unexpected named callout kind "${l}"`);
	}
	return $a(l, r ?? null, i?.split(",") ?? null, e);
}
function so(e) {
	let t = null, n, r;
	if (e[0] === "{") {
		let { minStr: i, maxStr: a } = /^\{(?<minStr>\d*)(?:,(?<maxStr>\d*))?/.exec(e).groups, o = 1e5;
		if (+i > o || a && +a > o) throw Error("Quantifier value unsupported in Oniguruma");
		if (n = +i, r = a === void 0 ? +i : a === "" ? 1 / 0 : +a, n > r && (t = "possessive", [n, r] = [r, n]), e.endsWith("?")) {
			if (t === "possessive") throw Error("Unsupported possessive interval quantifier chain with \"?\"");
			t = "lazy";
		} else t ||= "greedy";
	} else n = +(e[0] === "+"), r = e[0] === "?" ? 1 : 1 / 0, t = e[1] === "+" ? "possessive" : e[1] === "?" ? "lazy" : "greedy";
	return eo(t, n, r, e);
}
function co(e) {
	let t = e[1].toLowerCase();
	return I({
		d: "digit",
		h: "hex",
		s: "space",
		w: "word"
	}[t], e, { negate: e[1] !== t });
}
function lo(e) {
	let { p: t, neg: n, value: r } = /^\\(?<p>[pP])\{(?<neg>\^?)(?<value>[^}]+)/.exec(e).groups;
	return I("property", e, {
		value: r,
		negate: t === "P" && !n || t === "p" && !!n
	});
}
function uo(e) {
	let t = {};
	return e.includes("i") && (t.ignoreCase = !0), e.includes("m") && (t.dotAll = !0), e.includes("x") && (t.extended = !0), Object.keys(t).length ? t : null;
}
function fo(e) {
	let t = {
		ignoreCase: !1,
		dotAll: !1,
		extended: !1,
		digitIsAscii: !1,
		posixIsAscii: !1,
		spaceIsAscii: !1,
		wordIsAscii: !1,
		textSegmentMode: null
	};
	for (let n = 0; n < e.length; n++) {
		let r = e[n];
		if (!"imxDPSWy".includes(r)) throw Error(`Invalid flag "${r}"`);
		if (r === "y") {
			if (!/^y{[gw]}/.test(e.slice(n))) throw Error("Invalid or unspecified flag \"y\" mode");
			t.textSegmentMode = e[n + 2] === "g" ? "grapheme" : "word", n += 3;
		} else t[{
			i: "ignoreCase",
			m: "dotAll",
			x: "extended",
			D: "digitIsAscii",
			P: "posixIsAscii",
			S: "spaceIsAscii",
			W: "wordIsAscii"
		}[r]] = !0;
	}
	return t;
}
function po(e) {
	if (/^(?:\\u(?!\p{AHex}{4})|\\x(?!\p{AHex}{1,2}|\{\p{AHex}{1,8}\}))/u.test(e)) throw Error(`Incomplete or invalid escape "${e}"`);
	let t = e[2] === "{" ? /^\\x\{\s*(?<hex>\p{AHex}+)/u.exec(e).groups.hex : e.slice(2);
	return parseInt(t, 16);
}
function mo(e, t) {
	let { raw: n, inCharClass: r } = e, i = n.slice(1);
	if (!r && (i !== "0" && i.length === 1 || i[0] !== "0" && +i <= t)) return [Wa(n)];
	let a = [], o = i.match(/^[0-7]+|\d/g);
	for (let e = 0; e < o.length; e++) {
		let t = o[e], r;
		if (e === 0 && t !== "8" && t !== "9") {
			if (r = parseInt(t, 8), r > 127) throw Error(P`Octal encoded byte above 177 unsupported "${n}"`);
		} else r = Oa(t);
		a.push(F(r, (e === 0 ? "\\" : "") + t));
	}
	return a;
}
function ho(e) {
	let t = [], n = new RegExp(Pa, "gy"), r;
	for (; r = n.exec(e);) {
		let e = r[0];
		if (e[0] === "{") {
			let r = /^\{(?<min>\d+),(?<max>\d+)\}\??$/.exec(e);
			if (r) {
				let { min: i, max: a } = r.groups;
				if (+i > +a && e.endsWith("?")) {
					n.lastIndex--, t.push(so(e.slice(0, -1)));
					continue;
				}
			}
		}
		t.push(so(e));
	}
	return t;
}
// node_modules/oniguruma-parser/dist/parser/node-utils.js
function go(e, t) {
	if (!Array.isArray(e.body)) throw Error("Expected node with body array");
	if (e.body.length !== 1) return !1;
	let n = e.body[0];
	return !t || Object.keys(t).every((e) => t[e] === n[e]);
}
function _o(e) {
	return vo.has(e.type);
}
var vo = /* @__PURE__ */ new Set([
	"AbsenceFunction",
	"Backreference",
	"CapturingGroup",
	"Character",
	"CharacterClass",
	"CharacterSet",
	"Group",
	"Quantifier",
	"Subroutine"
]);
// node_modules/oniguruma-parser/dist/parser/parse.js
function yo(e, t = {}) {
	let n = {
		flags: "",
		normalizeUnknownPropertyNames: !1,
		skipBackrefValidation: !1,
		skipLookbehindValidation: !1,
		skipPropertyNameValidation: !1,
		unicodePropertyMap: null,
		...t,
		rules: {
			captureGroup: !1,
			singleline: !1,
			...t.rules
		}
	}, r = La(e, {
		flags: n.flags,
		rules: {
			captureGroup: n.rules.captureGroup,
			singleline: n.rules.singleline
		}
	}), i = (e, t) => {
		let n = r.tokens[a.nextIndex];
		switch (a.parent = e, a.nextIndex++, n.type) {
			case "Alternator": return L();
			case "Assertion": return bo(n);
			case "Backreference": return xo(n, a);
			case "Character": return Mo(n.value, { useLastValid: !!t.isCheckingRangeEnd });
			case "CharacterClassHyphen": return So(n, a, t);
			case "CharacterClassOpen": return Co(n, a, t);
			case "CharacterSet": return wo(n, a);
			case "Directive": return Io(n.kind, { flags: n.flags });
			case "GroupOpen": return To(n, a, t);
			case "NamedCallout": return Ro(n.kind, n.tag, n.arguments);
			case "Quantifier": return Eo(n, a);
			case "Subroutine": return Do(n, a);
			default: throw Error(`Unexpected token type "${n.type}"`);
		}
	}, a = {
		capturingGroups: [],
		hasNumberedRef: !1,
		namedGroupsByName: /* @__PURE__ */ new Map(),
		nextIndex: 0,
		normalizeUnknownPropertyNames: n.normalizeUnknownPropertyNames,
		parent: null,
		skipBackrefValidation: n.skipBackrefValidation,
		skipLookbehindValidation: n.skipLookbehindValidation,
		skipPropertyNameValidation: n.skipPropertyNameValidation,
		subroutines: [],
		tokens: r.tokens,
		unicodePropertyMap: n.unicodePropertyMap,
		walk: i
	}, o = Vo(Lo(r.flags)), s = o.body[0];
	for (; a.nextIndex < r.tokens.length;) {
		let e = i(s, {});
		e.type === "Alternative" ? (o.body.push(e), s = e) : s.body.push(e);
	}
	let { capturingGroups: c, hasNumberedRef: l, namedGroupsByName: u, subroutines: d } = a;
	if (l && u.size && !n.rules.captureGroup) throw Error("Numbered backref/subroutine not allowed when using named capture");
	for (let { ref: e } of d) if (typeof e == "number") {
		if (e > c.length) throw Error("Subroutine uses a group number that's not defined");
		e && (c[e - 1].isSubroutined = !0);
	} else if (u.has(e)) {
		if (u.get(e).length > 1) throw Error(P`Subroutine uses a duplicate group name "\g<${e}>"`);
		u.get(e)[0].isSubroutined = !0;
	} else throw Error(P`Subroutine uses a group name that's not defined "\g<${e}>"`);
	return o;
}
function bo({ kind: e }) {
	return ko(ja({
		"^": "line_start",
		$: "line_end",
		"\\A": "string_start",
		"\\b": "word_boundary",
		"\\B": "word_boundary",
		"\\G": "search_start",
		"\\y": "text_segment_boundary",
		"\\Y": "text_segment_boundary",
		"\\z": "string_end",
		"\\Z": "string_end_newline"
	}[e], `Unexpected assertion kind "${e}"`), { negate: e === P`\B` || e === P`\Y` });
}
function xo({ raw: e }, t) {
	let n = /^\\k[<']/.test(e), r = n ? e.slice(3, -1) : e.slice(1), i = (n, r = !1) => {
		let i = t.capturingGroups.length, a = !1;
		if (n > i) {
			if (t.skipBackrefValidation) a = !0;
			else throw Error(`Not enough capturing groups defined to the left "${e}"`);
		}
		return t.hasNumberedRef = !0, Ao(r ? i + 1 - n : n, { orphan: a });
	};
	if (n) {
		let n = /^(?<sign>-?)0*(?<num>[1-9]\d*)$/.exec(r);
		if (n) return i(+n.groups.num, !!n.groups.sign);
		if (/[-+]/.test(r)) throw Error(`Invalid backref name "${e}"`);
		if (!t.namedGroupsByName.has(r)) throw Error(`Group name not defined to the left "${e}"`);
		return Ao(r);
	}
	return i(+r);
}
function So(e, t, n) {
	let { tokens: r, walk: i } = t, a = t.parent, o = a.body.at(-1), s = r[t.nextIndex];
	if (!n.isCheckingRangeEnd && o && o.type !== "CharacterClass" && o.type !== "CharacterClassRange" && s && s.type !== "CharacterClassOpen" && s.type !== "CharacterClassClose" && s.type !== "CharacterClassIntersector") {
		let e = i(a, {
			...n,
			isCheckingRangeEnd: !0
		});
		if (o.type === "Character" && e.type === "Character") return a.body.pop(), Po(o, e);
		throw Error("Invalid character class range");
	}
	return Mo(Oa("-"));
}
function Co({ negate: e }, t, n) {
	let { tokens: r, walk: i } = t, a = [No()], o = r[t.nextIndex], s = Zo(o);
	for (; s.type !== "CharacterClassClose";) {
		if (s.type === "CharacterClassIntersector") a.push(No()), t.nextIndex++;
		else {
			let e = a.at(-1);
			e.body.push(i(e, n));
		}
		s = Zo(r[t.nextIndex], o);
	}
	let c = No({ negate: e });
	return a.length === 1 ? c.body = a[0].body : (c.kind = "intersection", c.body = a.map((e) => e.body.length === 1 ? e.body[0] : e)), t.nextIndex++, c;
}
function wo({ kind: e, negate: t, value: n }, r) {
	let { normalizeUnknownPropertyNames: i, skipPropertyNameValidation: a, unicodePropertyMap: o } = r;
	if (e === "property") {
		let r = Xo(n);
		if (Aa.has(r) && !o?.has(r)) e = "posix", n = r;
		else return B(n, {
			negate: t,
			normalizeUnknownPropertyNames: i,
			skipPropertyNameValidation: a,
			unicodePropertyMap: o
		});
	}
	return e === "posix" ? zo(n, { negate: t }) : Fo(e, { negate: t });
}
function To(e, t, n) {
	let { tokens: r, capturingGroups: i, namedGroupsByName: a, skipLookbehindValidation: o, walk: s } = t, c = Uo(e), l = c.type === "AbsenceFunction", u = qo(c), d = u && c.negate;
	if (c.type === "CapturingGroup" && (i.push(c), c.name && ka(a, c.name, []).push(c)), l && n.isInAbsenceFunction) throw Error("Nested absence function not supported by Oniguruma");
	let f = Qo(r[t.nextIndex]);
	for (; f.type !== "GroupClose";) {
		if (f.type === "Alternator") c.body.push(L()), t.nextIndex++;
		else {
			let e = c.body.at(-1), t = s(e, {
				...n,
				isInAbsenceFunction: n.isInAbsenceFunction || l,
				isInLookbehind: n.isInLookbehind || u,
				isInNegLookbehind: n.isInNegLookbehind || d
			});
			if (e.body.push(t), (u || n.isInLookbehind) && !o) {
				let e = "Lookbehind includes a pattern not allowed by Oniguruma";
				if (d || n.isInNegLookbehind) {
					if (Ko(t) || t.type === "CapturingGroup") throw Error(e);
				} else if (Ko(t) || qo(t) && t.negate) throw Error(e);
			}
		}
		f = Qo(r[t.nextIndex]);
	}
	return t.nextIndex++, c;
}
function Eo({ kind: e, min: t, max: n }, r) {
	let i = r.parent, a = i.body.at(-1);
	if (!a || !_o(a)) throw Error("Quantifier requires a repeatable token");
	let o = Bo(e, t, n, a);
	return i.body.pop(), o;
}
function Do({ raw: e }, t) {
	let { capturingGroups: n, subroutines: r } = t, i = e.slice(3, -1), a = /^(?<sign>[-+]?)0*(?<num>[1-9]\d*)$/.exec(i);
	if (a) {
		let e = +a.groups.num, r = n.length;
		if (t.hasNumberedRef = !0, i = {
			"": e,
			"+": r + e,
			"-": r + 1 - e
		}[a.groups.sign], i < 1) throw Error("Invalid subroutine number");
	} else i === "0" && (i = 0);
	let o = Ho(i);
	return r.push(o), o;
}
function Oo(e, t) {
	if (e !== "repeater") throw Error(`Unexpected absence function kind "${e}"`);
	return {
		type: "AbsenceFunction",
		kind: e,
		body: Wo(t?.body)
	};
}
function L(e) {
	return {
		type: "Alternative",
		body: Go(e?.body)
	};
}
function ko(e, t) {
	let n = {
		type: "Assertion",
		kind: e
	};
	return (e === "word_boundary" || e === "text_segment_boundary") && (n.negate = !!t?.negate), n;
}
function Ao(e, t) {
	let n = !!t?.orphan;
	return {
		type: "Backreference",
		ref: e,
		...n && { orphan: n }
	};
}
function jo(e, t) {
	let n = {
		name: void 0,
		isSubroutined: !1,
		...t
	};
	if (n.name !== void 0 && !Jo(n.name)) throw Error(`Group name "${n.name}" invalid in Oniguruma`);
	return {
		type: "CapturingGroup",
		number: e,
		...n.name && { name: n.name },
		...n.isSubroutined && { isSubroutined: n.isSubroutined },
		body: Wo(t?.body)
	};
}
function Mo(e, t) {
	let n = {
		useLastValid: !1,
		...t
	};
	if (e > 1114111) {
		let t = e.toString(16);
		if (n.useLastValid) e = 1114111;
		else throw Error(e > 1310719 ? `Invalid code point out of range "\\x{${t}}"` : `Invalid code point out of range in JS "\\x{${t}}"`);
	}
	return {
		type: "Character",
		value: e
	};
}
function No(e) {
	let t = {
		kind: "union",
		negate: !1,
		...e
	};
	return {
		type: "CharacterClass",
		kind: t.kind,
		negate: t.negate,
		body: Go(e?.body)
	};
}
function Po(e, t) {
	if (t.value < e.value) throw Error("Character class range out of order");
	return {
		type: "CharacterClassRange",
		min: e,
		max: t
	};
}
function Fo(e, t) {
	let n = !!t?.negate, r = {
		type: "CharacterSet",
		kind: e
	};
	return (e === "digit" || e === "hex" || e === "newline" || e === "space" || e === "word") && (r.negate = n), (e === "text_segment" || e === "newline" && !n) && (r.variableLength = !0), r;
}
function Io(e, t = {}) {
	if (e === "keep") return {
		type: "Directive",
		kind: e
	};
	if (e === "flags") return {
		type: "Directive",
		kind: e,
		flags: ja(t.flags)
	};
	throw Error(`Unexpected directive kind "${e}"`);
}
function Lo(e) {
	return {
		type: "Flags",
		...e
	};
}
function R(e) {
	let t = e?.atomic, n = e?.flags;
	if (t && n) throw Error("Atomic group cannot have flags");
	return {
		type: "Group",
		...t && { atomic: t },
		...n && { flags: n },
		body: Wo(e?.body)
	};
}
function z(e) {
	let t = {
		behind: !1,
		negate: !1,
		...e
	};
	return {
		type: "LookaroundAssertion",
		kind: t.behind ? "lookbehind" : "lookahead",
		negate: t.negate,
		body: Wo(e?.body)
	};
}
function Ro(e, t, n) {
	return {
		type: "NamedCallout",
		kind: e,
		tag: t,
		arguments: n
	};
}
function zo(e, t) {
	let n = !!t?.negate;
	if (!Aa.has(e)) throw Error(`Invalid POSIX class "${e}"`);
	return {
		type: "CharacterSet",
		kind: "posix",
		value: e,
		negate: n
	};
}
function Bo(e, t, n, r) {
	if (t > n) throw Error("Invalid reversed quantifier range");
	return {
		type: "Quantifier",
		kind: e,
		min: t,
		max: n,
		body: r
	};
}
function Vo(e, t) {
	return {
		type: "Regex",
		body: Wo(t?.body),
		flags: e
	};
}
function Ho(e) {
	return {
		type: "Subroutine",
		ref: e
	};
}
function B(e, t) {
	let n = {
		negate: !1,
		normalizeUnknownPropertyNames: !1,
		skipPropertyNameValidation: !1,
		unicodePropertyMap: null,
		...t
	}, r = n.unicodePropertyMap?.get(Xo(e));
	if (!r) {
		if (n.normalizeUnknownPropertyNames) r = Yo(e);
		else if (n.unicodePropertyMap && !n.skipPropertyNameValidation) throw Error(P`Invalid Unicode property "\p{${e}}"`);
	}
	return {
		type: "CharacterSet",
		kind: "property",
		value: r ?? e,
		negate: n.negate
	};
}
function Uo({ flags: e, kind: t, name: n, negate: r, number: i }) {
	switch (t) {
		case "absence_repeater": return Oo("repeater");
		case "atomic": return R({ atomic: !0 });
		case "capturing": return jo(i, { name: n });
		case "group": return R({ flags: e });
		case "lookahead":
		case "lookbehind": return z({
			behind: t === "lookbehind",
			negate: r
		});
		default: throw Error(`Unexpected group kind "${t}"`);
	}
}
function Wo(e) {
	if (e === void 0) e = [L()];
	else if (!Array.isArray(e) || !e.length || !e.every((e) => e.type === "Alternative")) throw Error("Invalid body; expected array of one or more Alternative nodes");
	return e;
}
function Go(e) {
	if (e === void 0) e = [];
	else if (!Array.isArray(e) || !e.every((e) => !!e.type)) throw Error("Invalid body; expected array of nodes");
	return e;
}
function Ko(e) {
	return e.type === "LookaroundAssertion" && e.kind === "lookahead";
}
function qo(e) {
	return e.type === "LookaroundAssertion" && e.kind === "lookbehind";
}
function Jo(e) {
	return /^[\p{Alpha}\p{Pc}][^)]*$/u.test(e);
}
function Yo(e) {
	return e.trim().replace(/[- _]+/g, "_").replace(/[A-Z][a-z]+(?=[A-Z])/g, "$&_").replace(/[A-Za-z]+/g, (e) => e[0].toUpperCase() + e.slice(1).toLowerCase());
}
function Xo(e) {
	return e.replace(/[- _]+/g, "").toLowerCase();
}
function Zo(e, t) {
	let n = t;
	return ja(e, `Unclosed character class${n?.type === "Character" && n.value === 93 && n.raw === "]" ? " (started with \"]\")" : ""}`);
}
function Qo(e) {
	return ja(e, "Unclosed group");
}
// node_modules/oniguruma-parser/dist/traverser/traverse.js
function $o(e, t, n = null) {
	function r(e, t) {
		for (let n = 0; n < e.length; n++) {
			let r = i(e[n], t, n, e);
			n = Math.max(-1, n + r);
		}
	}
	function i(a, o = null, s = null, c = null) {
		let l = 0, u = !1, d = {
			node: a,
			parent: o,
			key: s,
			container: c,
			root: e,
			remove() {
				es(c).splice(Math.max(0, V(s) + l), 1), l--, u = !0;
			},
			removeAllNextSiblings() {
				return es(c).splice(V(s) + 1);
			},
			removeAllPrevSiblings() {
				let e = V(s) + l;
				return l -= e, es(c).splice(0, Math.max(0, e));
			},
			replaceWith(e, t = {}) {
				let n = !!t.traverse;
				c ? c[Math.max(0, V(s) + l)] = e : ja(o, "Can't replace root node")[s] = e, n && i(e, o, s, c), u = !0;
			},
			replaceWithMultiple(e, t = {}) {
				let n = !!t.traverse;
				if (es(c).splice(Math.max(0, V(s) + l), 1, ...e), l += e.length - 1, n) {
					let t = 0;
					for (let n = 0; n < e.length; n++) t += i(e[n], o, V(s) + n + t, c);
				}
				u = !0;
			},
			skip() {
				u = !0;
			}
		}, { type: f } = a, p = t["*"], m = t[f], h = typeof p == "function" ? p : p?.enter, g = typeof m == "function" ? m : m?.enter;
		if (h?.(d, n), g?.(d, n), !u) switch (f) {
			case "AbsenceFunction":
			case "Alternative":
			case "CapturingGroup":
			case "CharacterClass":
			case "Group":
			case "LookaroundAssertion":
				r(a.body, a);
				break;
			case "Assertion":
			case "Backreference":
			case "Character":
			case "CharacterSet":
			case "Directive":
			case "Flags":
			case "NamedCallout":
			case "Subroutine": break;
			case "CharacterClassRange":
				i(a.min, a, "min"), i(a.max, a, "max");
				break;
			case "Quantifier":
				i(a.body, a, "body");
				break;
			case "Regex":
				r(a.body, a), i(a.flags, a, "flags");
				break;
			default: throw Error(`Unexpected node type "${f}"`);
		}
		return m?.exit?.(d, n), p?.exit?.(d, n), l;
	}
	return i(e), e;
}
function es(e) {
	if (!Array.isArray(e)) throw Error("Container expected");
	return e;
}
function V(e) {
	if (typeof e != "number") throw Error("Numeric key expected");
	return e;
}
// node_modules/regex/src/utils-internals.js
var ts = String.raw`\(\?(?:[:=!>A-Za-z\-]|<[=!]|\(DEFINE\))`;
function ns(e, t) {
	for (let n = 0; n < e.length; n++) e[n] >= t && e[n]++;
}
function rs(e, t, n, r) {
	return e.slice(0, t) + r + e.slice(t + n.length);
}
// node_modules/regex-utilities/src/index.js
var H = Object.freeze({
	DEFAULT: "DEFAULT",
	CHAR_CLASS: "CHAR_CLASS"
});
function is(e, t, n, r) {
	let i = new RegExp(String.raw`${t}|(?<$skip>\[\^?|\\?.)`, "gsu"), a = [!1], o = 0, s = "";
	for (let t of e.matchAll(i)) {
		let { 0: e, groups: { $skip: i } } = t;
		!i && (!r || r === H.DEFAULT == !o) ? n instanceof Function ? s += n(t, {
			context: o ? H.CHAR_CLASS : H.DEFAULT,
			negated: a[a.length - 1]
		}) : s += n : (e[0] === "[" ? (o++, a.push(e[1] === "^")) : e === "]" && o && (o--, a.pop()), s += e);
	}
	return s;
}
function as(e, t, n, r) {
	is(e, t, n, r);
}
function os(e, t, n = 0, r) {
	if (!new RegExp(t, "su").test(e)) return null;
	let i = RegExp(`${t}|(?<$skip>\\\\?.)`, "gsu");
	i.lastIndex = n;
	let a = 0, o;
	for (; o = i.exec(e);) {
		let { 0: e, groups: { $skip: t } } = o;
		if (!t && (!r || r === H.DEFAULT == !a)) return o;
		e === "[" ? a++ : e === "]" && a && a--, i.lastIndex == o.index && i.lastIndex++;
	}
	return null;
}
function ss(e, t, n) {
	return !!os(e, t, 0, n);
}
function cs(e, t) {
	let n = /\\?./gsu;
	n.lastIndex = t;
	let r = e.length, i = 0, a = 1, o;
	for (; o = n.exec(e);) {
		let [e] = o;
		if (e === "[") i++;
		else if (i) e === "]" && i--;
		else if (e === "(") a++;
		else if (e === ")" && (a--, !a)) {
			r = o.index;
			break;
		}
	}
	return e.slice(t, r);
}
// node_modules/regex/src/atomic.js
var ls = new RegExp(String.raw`(?<noncapturingStart>${ts})|(?<capturingStart>\((?:\?<[^>]+>)?)|\\?.`, "gsu");
function us(e, t) {
	let n = t?.hiddenCaptures ?? [], r = t?.captureTransfers ?? /* @__PURE__ */ new Map();
	if (!/\(\?>/.test(e)) return {
		pattern: e,
		captureTransfers: r,
		hiddenCaptures: n
	};
	let i = [0], a = [], o = 0, s = 0, c = NaN, l;
	do {
		l = !1;
		let t = 0, u = 0, d = !1, f;
		for (ls.lastIndex = Number.isNaN(c) ? 0 : c + 7; f = ls.exec(e);) {
			let { 0: p, index: m, groups: { capturingStart: h, noncapturingStart: g } } = f;
			if (p === "[") t++;
			else if (t) p === "]" && t--;
			else if (p === "(?>" && !d) c = m, d = !0;
			else if (d && g) u++;
			else if (h) d ? u++ : (o++, i.push(o + s));
			else if (p === ")" && d) {
				if (!u) {
					s++;
					let t = o + s;
					if (e = `${e.slice(0, c)}(?:(?=(${e.slice(c + 3, m)}))<$$${t}>)${e.slice(m + 1)}`, l = !0, a.push(t), ns(n, t), r.size) {
						let e = /* @__PURE__ */ new Map();
						r.forEach((n, r) => {
							e.set(r >= t ? r + 1 : r, n.map((e) => e >= t ? e + 1 : e));
						}), r = e;
					}
					break;
				}
				u--;
			}
		}
	} while (l);
	return n.push(...a), e = is(e, String.raw`\\(?<backrefNum>[1-9]\d*)|<\$\$(?<wrappedBackrefNum>\d+)>`, ({ 0: e, groups: { backrefNum: t, wrappedBackrefNum: n } }) => {
		if (t) {
			let n = +t;
			if (n > i.length - 1) throw Error(`Backref "${e}" greater than number of captures`);
			return `\\${i[n]}`;
		}
		return `\\${n}`;
	}, H.DEFAULT), {
		pattern: e,
		captureTransfers: r,
		hiddenCaptures: n
	};
}
var ds = String.raw`(?:[?*+]|\{\d+(?:,\d*)?\})`, fs = new RegExp(String.raw`
\\(?: \d+
  | c[A-Za-z]
  | [gk]<[^>]+>
  | [pPu]\{[^\}]+\}
  | u[A-Fa-f\d]{4}
  | x[A-Fa-f\d]{2}
  )
| \((?: \? (?: [:=!>]
  | <(?:[=!]|[^>]+>)
  | [A-Za-z\-]+:
  | \(DEFINE\)
  ))?
| (?<qBase>${ds})(?<qMod>[?+]?)(?<invalidQ>[?*+\{]?)
| \\?.
`.replace(/\s+/g, ""), "gsu");
function ps(e) {
	if (!RegExp(`${ds}\\+`).test(e)) return { pattern: e };
	let t = [], n = null, r = null, i = "", a = 0, o;
	for (fs.lastIndex = 0; o = fs.exec(e);) {
		let { 0: s, index: c, groups: { qBase: l, qMod: u, invalidQ: d } } = o;
		if (s === "[") a || (r = c), a++;
		else if (s === "]") a ? a-- : r = null;
		else if (!a) {
			if (u === "+" && i && !i.startsWith("(")) {
				if (d) throw Error(`Invalid quantifier "${s}"`);
				let t = -1;
				if (/^\{\d+\}$/.test(l)) e = rs(e, c + l.length, u, "");
				else {
					if (i === ")" || i === "]") {
						let t = i === ")" ? n : r;
						if (t === null) throw Error(`Invalid unmatched "${i}"`);
						e = `${e.slice(0, t)}(?>${e.slice(t, c)}${l})${e.slice(c + s.length)}`;
					} else e = `${e.slice(0, c - i.length)}(?>${i}${l})${e.slice(c + s.length)}`;
					t += 4;
				}
				fs.lastIndex += t;
			} else s[0] === "(" ? t.push(c) : s === ")" && (n = t.length ? t.pop() : null);
		}
		i = s;
	}
	return { pattern: e };
}
// node_modules/regex-recursion/src/index.js
var U = String.raw, ms = U`\(\?R=(?<rDepth>[^\)]+)\)|${U`\\g<(?<gRNameOrNum>[^>&]+)&R=(?<gRDepth>[^>]+)>`}`, hs = U`\(\?<(?![=!])(?<captureName>[^>]+)>`, gs = U`${hs}|(?<unnamed>\()(?!\?)`, W = new RegExp(U`${hs}|${ms}|\(\?|\\?.`, "gsu"), _s = "Cannot use multiple overlapping recursions";
function vs(e, t) {
	let { hiddenCaptures: n, mode: r } = {
		hiddenCaptures: [],
		mode: "plugin",
		...t
	}, i = t?.captureTransfers ?? /* @__PURE__ */ new Map();
	if (!new RegExp(ms, "su").test(e)) return {
		pattern: e,
		captureTransfers: i,
		hiddenCaptures: n
	};
	if (r === "plugin" && ss(e, U`\(\?\(DEFINE\)`, H.DEFAULT)) throw Error("DEFINE groups cannot be used with recursion");
	let a = [], o = ss(e, U`\\[1-9]`, H.DEFAULT), s = /* @__PURE__ */ new Map(), c = [], l = !1, u = 0, d = 0, f;
	for (W.lastIndex = 0; f = W.exec(e);) {
		let { 0: t, groups: { captureName: p, rDepth: m, gRNameOrNum: h, gRDepth: g } } = f;
		if (t === "[") u++;
		else if (u) t === "]" && u--;
		else {
			if (m) {
				if (ys(m), l) throw Error(_s);
				if (o) throw Error(`${r === "external" ? "Backrefs" : "Numbered backrefs"} cannot be used with global recursion`);
				let t = e.slice(0, f.index), s = e.slice(W.lastIndex);
				if (ss(s, ms, H.DEFAULT)) throw Error(_s);
				let c = m - 1;
				e = bs(t, s, c, !1, n, a, d), i = Cs(i, t, c, a.length, 0, d);
				break;
			}
			if (h) {
				ys(g);
				let u = !1;
				for (let e of c) if (e.name === h || e.num === +h) {
					if (u = !0, e.hasRecursedWithin) throw Error(_s);
					break;
				}
				if (!u) throw Error(U`Recursive \g cannot be used outside the referenced group "${r === "external" ? h : U`\g<${h}&R=${g}>`}"`);
				let p = s.get(h), m = cs(e, p);
				if (o && ss(m, U`${hs}|\((?!\?)`, H.DEFAULT)) throw Error(`${r === "external" ? "Backrefs" : "Numbered backrefs"} cannot be used with recursion of capturing groups`);
				let _ = e.slice(p, f.index), ee = m.slice(_.length + t.length), te = a.length, ne = g - 1, re = bs(_, ee, ne, !0, n, a, d);
				i = Cs(i, _, ne, a.length - te, te, d), e = `${e.slice(0, p)}${re}${e.slice(p + m.length)}`, W.lastIndex += re.length - t.length - _.length - ee.length, c.forEach((e) => e.hasRecursedWithin = !0), l = !0;
			} else if (p) d++, s.set(String(d), W.lastIndex), s.set(p, W.lastIndex), c.push({
				num: d,
				name: p
			});
			else if (t[0] === "(") {
				let e = t === "(";
				e && (d++, s.set(String(d), W.lastIndex)), c.push(e ? { num: d } : {});
			} else t === ")" && c.pop();
		}
	}
	return n.push(...a), {
		pattern: e,
		captureTransfers: i,
		hiddenCaptures: n
	};
}
function ys(e) {
	let t = `Max depth must be integer between 2 and 100; used ${e}`;
	if (!/^[1-9]\d*$/.test(e) || (e = +e, e < 2 || e > 100)) throw Error(t);
}
function bs(e, t, n, r, i, a, o) {
	let s = /* @__PURE__ */ new Set();
	r && as(e + t, hs, ({ groups: { captureName: e } }) => {
		s.add(e);
	}, H.DEFAULT);
	let c = [
		n,
		r ? s : null,
		i,
		a,
		o
	];
	return `${e}${xs(`(?:${e}`, "forward", ...c)}(?:)${xs(`${t})`, "backward", ...c)}${t}`;
}
function xs(e, t, n, r, i, a, o) {
	let s = (e) => t === "forward" ? e + 2 : n - e + 2 - 1, c = "";
	for (let t = 0; t < n; t++) {
		let n = s(t);
		c += is(e, U`${gs}|\\k<(?<backref>[^>]+)>`, ({ 0: e, groups: { captureName: t, unnamed: s, backref: c } }) => {
			if (c && r && !r.has(c)) return e;
			let l = `_$${n}`;
			if (s || t) {
				let n = o + a.length + 1;
				return a.push(n), Ss(i, n), s ? e : `(?<${t}${l}>`;
			}
			return U`\k<${c}${l}>`;
		}, H.DEFAULT);
	}
	return c;
}
function Ss(e, t) {
	for (let n = 0; n < e.length; n++) e[n] >= t && e[n]++;
}
function Cs(e, t, n, r, i, a) {
	if (e.size && r) {
		let o = 0;
		as(t, gs, () => o++, H.DEFAULT);
		let s = a - o + i, c = /* @__PURE__ */ new Map();
		return e.forEach((e, t) => {
			let i = (r - o * n) / n, a = o * n, l = t > s + o ? t + r : t, u = [];
			for (let t of e) if (t <= s) u.push(t);
			else if (t > s + o + i) u.push(t + r);
			else if (t <= s + o) for (let e = 0; e <= n; e++) u.push(t + o * e);
			else for (let e = 0; e <= n; e++) u.push(t + a + i * e);
			c.set(l, u);
		}), c;
	}
	return e;
}
// node_modules/oniguruma-to-es/dist/esm/index.js
var G = String.fromCodePoint, K = String.raw, q = {}, ws = globalThis.RegExp;
q.flagGroups = (() => {
	try {
		new ws("(?i:)");
	} catch {
		return !1;
	}
	return !0;
})(), q.unicodeSets = (() => {
	try {
		new ws("[[]]", "v");
	} catch {
		return !1;
	}
	return !0;
})(), q.bugFlagVLiteralHyphenIsRange = q.unicodeSets ? (() => {
	try {
		new ws(K`[\d\-a]`, "v");
	} catch {
		return !0;
	}
	return !1;
})() : !1, q.bugNestedClassIgnoresNegation = q.unicodeSets && new ws("[[^a]]", "v").test("a");
function Ts(e, { enable: t, disable: n }) {
	return {
		dotAll: !n?.dotAll && !!(t?.dotAll || e.dotAll),
		ignoreCase: !n?.ignoreCase && !!(t?.ignoreCase || e.ignoreCase)
	};
}
function Es(e, t, n) {
	return e.has(t) || e.set(t, n), e.get(t);
}
function Ds(e, t) {
	return ks[e] >= ks[t];
}
function Os(e, t) {
	if (e == null) throw Error(t ?? "Value expected");
	return e;
}
var ks = {
	ES2025: 2025,
	ES2024: 2024,
	ES2018: 2018
}, As = {
	auto: "auto",
	ES2025: "ES2025",
	ES2024: "ES2024",
	ES2018: "ES2018"
};
function js(e = {}) {
	if ({}.toString.call(e) !== "[object Object]") throw Error("Unexpected options");
	if (e.target !== void 0 && !As[e.target]) throw Error(`Unexpected target "${e.target}"`);
	let t = {
		accuracy: "default",
		avoidSubclass: !1,
		flags: "",
		global: !1,
		hasIndices: !1,
		lazyCompileLength: Infinity,
		target: "auto",
		verbose: !1,
		...e,
		rules: {
			allowOrphanBackrefs: !1,
			asciiWordBoundaries: !1,
			captureGroup: !1,
			recursionLimit: 20,
			singleline: !1,
			...e.rules
		}
	};
	return t.target === "auto" && (t.target = q.flagGroups ? "ES2025" : q.unicodeSets ? "ES2024" : "ES2018"), t;
}
var Ms = "[	-\r ]", Ns = /* @__PURE__ */ new Set([G(304), G(305)]), J = K`[\p{L}\p{M}\p{N}\p{Pc}]`;
function Ps(e) {
	if (Ns.has(e)) return [e];
	let t = /* @__PURE__ */ new Set(), n = e.toLowerCase(), r = n.toUpperCase(), i = Rs.get(n), a = Is.get(n), o = Ls.get(n);
	return [...r].length === 1 && t.add(r), o && t.add(o), i && t.add(i), t.add(n), a && t.add(a), [...t];
}
var Fs = /* @__PURE__ */ new Map("C Other\nCc Control cntrl\nCf Format\nCn Unassigned\nCo Private_Use\nCs Surrogate\nL Letter\nLC Cased_Letter\nLl Lowercase_Letter\nLm Modifier_Letter\nLo Other_Letter\nLt Titlecase_Letter\nLu Uppercase_Letter\nM Mark Combining_Mark\nMc Spacing_Mark\nMe Enclosing_Mark\nMn Nonspacing_Mark\nN Number\nNd Decimal_Number digit\nNl Letter_Number\nNo Other_Number\nP Punctuation punct\nPc Connector_Punctuation\nPd Dash_Punctuation\nPe Close_Punctuation\nPf Final_Punctuation\nPi Initial_Punctuation\nPo Other_Punctuation\nPs Open_Punctuation\nS Symbol\nSc Currency_Symbol\nSk Modifier_Symbol\nSm Math_Symbol\nSo Other_Symbol\nZ Separator\nZl Line_Separator\nZp Paragraph_Separator\nZs Space_Separator\nASCII\nASCII_Hex_Digit AHex\nAlphabetic Alpha\nAny\nAssigned\nBidi_Control Bidi_C\nBidi_Mirrored Bidi_M\nCase_Ignorable CI\nCased\nChanges_When_Casefolded CWCF\nChanges_When_Casemapped CWCM\nChanges_When_Lowercased CWL\nChanges_When_NFKC_Casefolded CWKCF\nChanges_When_Titlecased CWT\nChanges_When_Uppercased CWU\nDash\nDefault_Ignorable_Code_Point DI\nDeprecated Dep\nDiacritic Dia\nEmoji\nEmoji_Component EComp\nEmoji_Modifier EMod\nEmoji_Modifier_Base EBase\nEmoji_Presentation EPres\nExtended_Pictographic ExtPict\nExtender Ext\nGrapheme_Base Gr_Base\nGrapheme_Extend Gr_Ext\nHex_Digit Hex\nIDS_Binary_Operator IDSB\nIDS_Trinary_Operator IDST\nID_Continue IDC\nID_Start IDS\nIdeographic Ideo\nJoin_Control Join_C\nLogical_Order_Exception LOE\nLowercase Lower\nMath\nNoncharacter_Code_Point NChar\nPattern_Syntax Pat_Syn\nPattern_White_Space Pat_WS\nQuotation_Mark QMark\nRadical\nRegional_Indicator RI\nSentence_Terminal STerm\nSoft_Dotted SD\nTerminal_Punctuation Term\nUnified_Ideograph UIdeo\nUppercase Upper\nVariation_Selector VS\nWhite_Space space\nXID_Continue XIDC\nXID_Start XIDS".split(/\s/).map((e) => [Xo(e), e])), Is = /* @__PURE__ */ new Map([["s", G(383)], [G(383), "s"]]), Ls = /* @__PURE__ */ new Map([
	[G(223), G(7838)],
	[G(107), G(8490)],
	[G(229), G(8491)],
	[G(969), G(8486)]
]), Rs = new Map([
	Y(453),
	Y(456),
	Y(459),
	Y(498),
	...Vs(8072, 8079),
	...Vs(8088, 8095),
	...Vs(8104, 8111),
	Y(8124),
	Y(8140),
	Y(8188)
]), zs = /* @__PURE__ */ new Map([
	["alnum", K`[\p{Alpha}\p{Nd}]`],
	["alpha", K`\p{Alpha}`],
	["ascii", K`\p{ASCII}`],
	["blank", K`[\p{Zs}\t]`],
	["cntrl", K`\p{Cc}`],
	["digit", K`\p{Nd}`],
	["graph", K`[\P{space}&&\P{Cc}&&\P{Cn}&&\P{Cs}]`],
	["lower", K`\p{Lower}`],
	["print", K`[[\P{space}&&\P{Cc}&&\P{Cn}&&\P{Cs}]\p{Zs}]`],
	["punct", K`[\p{P}\p{S}]`],
	["space", K`\p{space}`],
	["upper", K`\p{Upper}`],
	["word", K`[\p{Alpha}\p{M}\p{Nd}\p{Pc}]`],
	["xdigit", K`\p{AHex}`]
]);
function Bs(e, t) {
	let n = [];
	for (let r = e; r <= t; r++) n.push(r);
	return n;
}
function Y(e) {
	let t = G(e);
	return [t.toLowerCase(), t];
}
function Vs(e, t) {
	return Bs(e, t).map((e) => Y(e));
}
var Hs = /* @__PURE__ */ new Set([
	"Lower",
	"Lowercase",
	"Upper",
	"Uppercase",
	"Ll",
	"Lowercase_Letter",
	"Lt",
	"Titlecase_Letter",
	"Lu",
	"Uppercase_Letter"
]);
function Us(e, t) {
	let n = {
		accuracy: "default",
		asciiWordBoundaries: !1,
		avoidSubclass: !1,
		bestEffortTarget: "ES2025",
		...t
	};
	qs(e);
	let r = {
		accuracy: n.accuracy,
		asciiWordBoundaries: n.asciiWordBoundaries,
		avoidSubclass: n.avoidSubclass,
		flagDirectivesByAlt: /* @__PURE__ */ new Map(),
		jsGroupNameMap: /* @__PURE__ */ new Map(),
		minTargetEs2024: Ds(n.bestEffortTarget, "ES2024"),
		passedLookbehind: !1,
		strategy: null,
		subroutineRefMap: /* @__PURE__ */ new Map(),
		supportedGNodes: /* @__PURE__ */ new Set(),
		digitIsAscii: e.flags.digitIsAscii,
		spaceIsAscii: e.flags.spaceIsAscii,
		wordIsAscii: e.flags.wordIsAscii
	};
	$o(e, Ws, r);
	let i = {
		dotAll: e.flags.dotAll,
		ignoreCase: e.flags.ignoreCase
	}, a = {
		currentFlags: i,
		prevFlags: null,
		globalFlags: i,
		groupOriginByCopy: /* @__PURE__ */ new Map(),
		groupsByName: /* @__PURE__ */ new Map(),
		multiplexCapturesToLeftByRef: /* @__PURE__ */ new Map(),
		openRefs: /* @__PURE__ */ new Map(),
		reffedNodesByReferencer: /* @__PURE__ */ new Map(),
		subroutineRefMap: r.subroutineRefMap
	};
	return $o(e, Gs, a), $o(e, Ks, {
		groupsByName: a.groupsByName,
		highestOrphanBackref: 0,
		numCapturesToLeft: 0,
		reffedNodesByReferencer: a.reffedNodesByReferencer
	}), e._originMap = a.groupOriginByCopy, e._strategy = r.strategy, e;
}
var Ws = {
	AbsenceFunction({ node: e, parent: t, replaceWith: n }) {
		let { body: r, kind: i } = e;
		if (i === "repeater") {
			let e = R();
			e.body[0].body.push(z({
				negate: !0,
				body: r
			}), B("Any"));
			let i = R();
			i.body[0].body.push(Bo("greedy", 0, Infinity, e)), n(Q(i, t), { traverse: !0 });
		} else throw Error("Unsupported absence function \"(?~|\"");
	},
	Alternative: {
		enter({ node: e, parent: t, key: n }, { flagDirectivesByAlt: r }) {
			let i = e.body.filter((e) => e.kind === "flags");
			for (let e = n + 1; e < t.body.length; e++) {
				let n = t.body[e];
				Es(r, n, []).push(...i);
			}
		},
		exit({ node: e }, { flagDirectivesByAlt: t }) {
			if (t.get(e)?.length) {
				let n = ec(t.get(e));
				if (n) {
					let t = R({ flags: n });
					t.body[0].body = e.body, e.body = [Q(t, e)];
				}
			}
		}
	},
	Assertion({ node: e, parent: t, key: n, container: r, root: i, remove: a, replaceWith: o }, s) {
		let { kind: c, negate: l } = e, { asciiWordBoundaries: u, avoidSubclass: d, supportedGNodes: f, wordIsAscii: p } = s;
		if (c === "text_segment_boundary") throw Error(`Unsupported text segment boundary "\\${l ? "Y" : "y"}"`);
		if (c === "line_end") o(Q(z({ body: [L({ body: [ko("string_end")] }), L({ body: [Mo(10)] })] }), t));
		else if (c === "line_start") o(Q(X(K`(?<=\A|\n(?!\z))`, { skipLookbehindValidation: !0 }), t));
		else if (c === "search_start") {
			if (f.has(e)) i.flags.sticky = !0, a();
			else {
				let e = r[n - 1];
				if (e && oc(e)) o(Q(z({ negate: !0 }), t));
				else if (d) throw Error(K`Uses "\G" in a way that requires a subclass`);
				else o(Z(ko("string_start"), t)), s.strategy = "clip_search";
			}
		} else if (c !== "string_end" && c !== "string_start") {
			if (c === "string_end_newline") o(Q(X(K`(?=\n?\z)`), t));
			else if (c === "word_boundary") {
				if (!p && !u) {
					let e = `(?:(?<=${J})(?!${J})|(?<!${J})(?=${J}))`, n = `(?:(?<=${J})(?=${J})|(?<!${J})(?!${J}))`;
					o(Q(X(l ? n : e), t));
				}
			} else throw Error(`Unexpected assertion kind "${c}"`);
		}
	},
	Backreference({ node: e }, { jsGroupNameMap: t }) {
		let { ref: n } = e;
		typeof n == "string" && !cc(n) && (n = $s(n, t), e.ref = n);
	},
	CapturingGroup({ node: e }, { jsGroupNameMap: t, subroutineRefMap: n }) {
		let { name: r } = e;
		r && !cc(r) && (r = $s(r, t), e.name = r), n.set(e.number, e), r && n.set(r, e);
	},
	CharacterClassRange({ node: e, parent: t, replaceWith: n }) {
		t.kind === "intersection" && n(Q(No({ body: [e] }), t), { traverse: !0 });
	},
	CharacterSet({ node: e, parent: t, replaceWith: n }, { accuracy: r, minTargetEs2024: i, digitIsAscii: a, spaceIsAscii: o, wordIsAscii: s }) {
		let { kind: c, negate: l, value: u } = e;
		if (a && (c === "digit" || u === "digit")) n(Z(Fo("digit", { negate: l }), t));
		else if (o && (c === "space" || u === "space")) n(Q(lc(X(Ms), l), t));
		else if (s && (c === "word" || u === "word")) n(Z(Fo("word", { negate: l }), t));
		else if (c === "any") n(Z(B("Any"), t));
		else if (c === "digit") n(Z(B("Nd", { negate: l }), t));
		else if (c !== "dot") {
			if (c === "text_segment") {
				if (r === "strict") throw Error(K`Use of "\X" requires non-strict accuracy`);
				let e = "\\p{Emoji}(?:\\p{EMod}|\\uFE0F\\u20E3?|[\\x{E0020}-\\x{E007E}]+\\x{E007F})?", a = K`\p{RI}{2}|${e}(?:\u200D${e})*`;
				n(Q(X(K`(?>\r\n|${i ? K`\p{RGI_Emoji}` : a}|\P{M}\p{M}*)`, { skipPropertyNameValidation: !0 }), t));
			} else if (c === "hex") n(Z(B("AHex", { negate: l }), t));
			else if (c === "newline") n(Q(X(l ? "[^\n]" : "(?>\r\n?|[\n\v\f\u2028\u2029])"), t));
			else if (c === "posix") {
				if (!i && (u === "graph" || u === "print")) {
					if (r === "strict") throw Error(`POSIX class "${u}" requires min target ES2024 or non-strict accuracy`);
					let e = {
						graph: "!-~",
						print: " -~"
					}[u];
					l && (e = `\0-${G(e.codePointAt(0) - 1)}${G(e.codePointAt(2) + 1)}-\u{10FFFF}`), n(Q(X(`[${e}]`), t));
				} else n(Q(lc(X(zs.get(u)), l), t));
			} else if (c === "property") Fs.has(Xo(u)) || (e.key = "sc");
			else if (c === "space") n(Z(B("space", { negate: l }), t));
			else if (c === "word") n(Q(lc(X(J), l), t));
			else throw Error(`Unexpected character set kind "${c}"`);
		}
	},
	Directive({ node: e, parent: t, root: n, remove: r, replaceWith: i, removeAllPrevSiblings: a, removeAllNextSiblings: o }) {
		let { kind: s, flags: c } = e;
		if (s === "flags") {
			if (!c.enable && !c.disable) r();
			else {
				let e = R({ flags: c });
				e.body[0].body = o(), i(Q(e, t), { traverse: !0 });
			}
		} else if (s === "keep") {
			let e = n.body[0], r = n.body.length === 1 && go(e, { type: "Group" }) && e.body[0].body.length === 1 ? e.body[0] : n;
			if (t.parent !== r || r.body.length > 1) throw Error(K`Uses "\K" in a way that's unsupported`);
			let o = z({ behind: !0 });
			o.body[0].body = a(), i(Q(o, t));
		} else throw Error(`Unexpected directive kind "${s}"`);
	},
	Flags({ node: e, parent: t }) {
		if (e.posixIsAscii) throw Error("Unsupported flag \"P\"");
		if (e.textSegmentMode === "word") throw Error("Unsupported flag \"y{w}\"");
		[
			"digitIsAscii",
			"extended",
			"posixIsAscii",
			"spaceIsAscii",
			"wordIsAscii",
			"textSegmentMode"
		].forEach((t) => delete e[t]), Object.assign(e, {
			global: !1,
			hasIndices: !1,
			multiline: !1,
			sticky: e.sticky ?? !1
		}), t.options = {
			disable: {
				x: !0,
				n: !0
			},
			force: { v: !0 }
		};
	},
	Group({ node: e }) {
		if (!e.flags) return;
		let { enable: t, disable: n } = e.flags;
		t?.extended && delete t.extended, n?.extended && delete n.extended, t?.dotAll && n?.dotAll && delete t.dotAll, t?.ignoreCase && n?.ignoreCase && delete t.ignoreCase, t && !Object.keys(t).length && delete e.flags.enable, n && !Object.keys(n).length && delete e.flags.disable, !e.flags.enable && !e.flags.disable && delete e.flags;
	},
	LookaroundAssertion({ node: e }, t) {
		let { kind: n } = e;
		n === "lookbehind" && (t.passedLookbehind = !0);
	},
	NamedCallout({ node: e, parent: t, replaceWith: n }) {
		let { kind: r } = e;
		if (r === "fail") n(Q(z({ negate: !0 }), t));
		else throw Error(`Unsupported named callout "(*${r.toUpperCase()}"`);
	},
	Quantifier({ node: e }) {
		if (e.body.type === "Quantifier") {
			let t = R();
			t.body[0].body.push(e.body), e.body = Q(t, e);
		}
	},
	Regex: {
		enter({ node: e }, { supportedGNodes: t }) {
			let n = [], r = !1, i = !1;
			for (let t of e.body) if (t.body.length === 1 && t.body[0].kind === "search_start") t.body.pop();
			else {
				let e = rc(t.body);
				e ? (r = !0, Array.isArray(e) ? n.push(...e) : n.push(e)) : i = !0;
			}
			r && !i && n.forEach((e) => t.add(e));
		},
		exit(e, { accuracy: t, passedLookbehind: n, strategy: r }) {
			if (t === "strict" && n && r) throw Error(K`Uses "\G" in a way that requires non-strict accuracy`);
		}
	},
	Subroutine({ node: e }, { jsGroupNameMap: t }) {
		let { ref: n } = e;
		typeof n == "string" && !cc(n) && (n = $s(n, t), e.ref = n);
	}
}, Gs = {
	Backreference({ node: e }, { multiplexCapturesToLeftByRef: t, reffedNodesByReferencer: n }) {
		let { orphan: r, ref: i } = e;
		r || n.set(e, [...t.get(i).map(({ node: e }) => e)]);
	},
	CapturingGroup: {
		enter({ node: e, parent: t, replaceWith: n, skip: r }, { groupOriginByCopy: i, groupsByName: a, multiplexCapturesToLeftByRef: o, openRefs: s, reffedNodesByReferencer: c }) {
			let l = i.get(e);
			if (l && s.has(e.number)) {
				let r = Z(Zs(e.number), t);
				c.set(r, s.get(e.number)), n(r);
				return;
			}
			s.set(e.number, e), o.set(e.number, []), e.name && Es(o, e.name, []);
			let u = o.get(e.name ?? e.number);
			for (let t = 0; t < u.length; t++) {
				let n = u[t];
				if (l === n.node || l && l === n.origin || e === n.origin) {
					u.splice(t, 1);
					break;
				}
			}
			if (o.get(e.number).push({
				node: e,
				origin: l
			}), e.name && o.get(e.name).push({
				node: e,
				origin: l
			}), e.name) {
				let t = Es(a, e.name, /* @__PURE__ */ new Map()), n = !1;
				if (l) n = !0;
				else for (let e of t.values()) if (!e.hasDuplicateNameToRemove) {
					n = !0;
					break;
				}
				a.get(e.name).set(e, {
					node: e,
					hasDuplicateNameToRemove: n
				});
			}
		},
		exit({ node: e }, { openRefs: t }) {
			t.get(e.number) === e && t.delete(e.number);
		}
	},
	Group: {
		enter({ node: e }, t) {
			t.prevFlags = t.currentFlags, e.flags && (t.currentFlags = Ts(t.currentFlags, e.flags));
		},
		exit(e, t) {
			t.currentFlags = t.prevFlags;
		}
	},
	Subroutine({ node: e, parent: t, replaceWith: n }, r) {
		let { isRecursive: i, ref: a } = e;
		if (i) {
			let n = t;
			for (; (n = n.parent) && (n.type !== "CapturingGroup" || n.name !== a && n.number !== a););
			r.reffedNodesByReferencer.set(e, n);
			return;
		}
		let o = r.subroutineRefMap.get(a), s = a === 0, c = s ? Zs(0) : Xs(o, r.groupOriginByCopy, null), l = c;
		if (!s) {
			let e = ec(Qs(o, (e) => e.type === "Group" && !!e.flags)), t = e ? Ts(r.globalFlags, e) : r.globalFlags;
			Js(t, r.currentFlags) || (l = R({ flags: tc(t) }), l.body[0].body.push(c));
		}
		n(Q(l, t), { traverse: !s });
	}
}, Ks = {
	Backreference({ node: e, parent: t, replaceWith: n }, r) {
		if (e.orphan) {
			r.highestOrphanBackref = Math.max(r.highestOrphanBackref, e.ref);
			return;
		}
		let i = r.reffedNodesByReferencer.get(e).filter((t) => Ys(t, e));
		i.length ? i.length > 1 ? n(Q(R({
			atomic: !0,
			body: i.reverse().map((e) => L({ body: [Ao(e.number)] }))
		}), t)) : e.ref = i[0].number : n(Q(z({ negate: !0 }), t));
	},
	CapturingGroup({ node: e }, t) {
		e.number = ++t.numCapturesToLeft, e.name && t.groupsByName.get(e.name).get(e).hasDuplicateNameToRemove && delete e.name;
	},
	Regex: { exit({ node: e }, t) {
		let n = Math.max(t.highestOrphanBackref - t.numCapturesToLeft, 0);
		for (let t = 0; t < n; t++) {
			let t = jo();
			e.body.at(-1).body.push(t);
		}
	} },
	Subroutine({ node: e }, t) {
		e.isRecursive && e.ref !== 0 && (e.ref = t.reffedNodesByReferencer.get(e).number);
	}
};
function qs(e) {
	$o(e, { "*"({ node: e, parent: t }) {
		e.parent = t;
	} });
}
function Js(e, t) {
	return e.dotAll === t.dotAll && e.ignoreCase === t.ignoreCase;
}
function Ys(e, t) {
	let n = t;
	do {
		if (n.type === "Regex") return !1;
		if (n.type === "Alternative") continue;
		if (n === e) return !1;
		let t = nc(n.parent);
		for (let r of t) {
			if (r === n) break;
			if (r === e || ic(r, e)) return !0;
		}
	} while (n = n.parent);
	throw Error("Unexpected path");
}
function Xs(e, t, n, r) {
	let i = Array.isArray(e) ? [] : {};
	for (let [a, o] of Object.entries(e)) a === "parent" ? i.parent = Array.isArray(n) ? r : n : o && typeof o == "object" ? i[a] = Xs(o, t, i, n) : (a === "type" && o === "CapturingGroup" && t.set(i, t.get(e) ?? e), i[a] = o);
	return i;
}
function Zs(e) {
	let t = Ho(e);
	return t.isRecursive = !0, t;
}
function Qs(e, t) {
	let n = [];
	for (; e = e.parent;) (!t || t(e)) && n.push(e);
	return n;
}
function $s(e, t) {
	if (t.has(e)) return t.get(e);
	let n = `$${t.size}_${e.replace(/^[^$_\p{IDS}]|[^$\u200C\u200D\p{IDC}]/gu, "_")}`;
	return t.set(e, n), n;
}
function ec(e) {
	let t = ["dotAll", "ignoreCase"], n = {
		enable: {},
		disable: {}
	};
	return e.forEach(({ flags: e }) => {
		t.forEach((t) => {
			e.enable?.[t] && (delete n.disable[t], n.enable[t] = !0), e.disable?.[t] && (n.disable[t] = !0);
		});
	}), Object.keys(n.enable).length || delete n.enable, Object.keys(n.disable).length || delete n.disable, n.enable || n.disable ? n : null;
}
function tc({ dotAll: e, ignoreCase: t }) {
	let n = {};
	return (e || t) && (n.enable = {}, e && (n.enable.dotAll = !0), t && (n.enable.ignoreCase = !0)), e && t || (n.disable = {}, !e && (n.disable.dotAll = !0), !t && (n.disable.ignoreCase = !0)), n;
}
function nc(e) {
	if (!e) throw Error("Node expected");
	let { body: t } = e;
	return Array.isArray(t) ? t : t ? [t] : null;
}
function rc(e) {
	let t = e.find((e) => e.kind === "search_start" || sc(e, { negate: !1 }) || !ac(e));
	if (!t) return null;
	if (t.kind === "search_start") return t;
	if (t.type === "LookaroundAssertion") return t.body[0].body[0];
	if (t.type === "CapturingGroup" || t.type === "Group") {
		let e = [];
		for (let n of t.body) {
			let t = rc(n.body);
			if (!t) return null;
			Array.isArray(t) ? e.push(...t) : e.push(t);
		}
		return e;
	}
	return null;
}
function ic(e, t) {
	let n = nc(e) ?? [];
	for (let e of n) if (e === t || ic(e, t)) return !0;
	return !1;
}
function ac({ type: e }) {
	return e === "Assertion" || e === "Directive" || e === "LookaroundAssertion";
}
function oc(e) {
	let t = [
		"Character",
		"CharacterClass",
		"CharacterSet"
	];
	return t.includes(e.type) || e.type === "Quantifier" && e.min && t.includes(e.body.type);
}
function sc(e, t) {
	let n = {
		negate: null,
		...t
	};
	return e.type === "LookaroundAssertion" && (n.negate === null || e.negate === n.negate) && e.body.length === 1 && go(e.body[0], {
		type: "Assertion",
		kind: "search_start"
	});
}
function cc(e) {
	return /^[$_\p{IDS}][$\u200C\u200D\p{IDC}]*$/u.test(e);
}
function X(e, t) {
	let n = yo(e, {
		...t,
		unicodePropertyMap: Fs
	}).body;
	return n.length > 1 || n[0].body.length > 1 ? R({ body: n }) : n[0].body[0];
}
function lc(e, t) {
	return e.negate = t, e;
}
function Z(e, t) {
	return e.parent = t, e;
}
function Q(e, t) {
	return qs(e), e.parent = t, e;
}
function uc(e, t) {
	let n = js(t), r = Ds(n.target, "ES2024"), i = Ds(n.target, "ES2025"), a = n.rules.recursionLimit;
	if (!Number.isInteger(a) || a < 2 || a > 20) throw Error("Invalid recursionLimit; use 2-20");
	let o = null, s = null;
	if (!i) {
		let t = [e.flags.ignoreCase];
		$o(e, dc, {
			getCurrentModI: () => t.at(-1),
			popModI() {
				t.pop();
			},
			pushModI(e) {
				t.push(e);
			},
			setHasCasedChar() {
				t.at(-1) ? o = !0 : s = !0;
			}
		});
	}
	let c = {
		dotAll: e.flags.dotAll,
		ignoreCase: !(!e.flags.ignoreCase && !o || s)
	}, l = e, u = {
		accuracy: n.accuracy,
		appliedGlobalFlags: c,
		captureMap: /* @__PURE__ */ new Map(),
		currentFlags: {
			dotAll: e.flags.dotAll,
			ignoreCase: e.flags.ignoreCase
		},
		inCharClass: !1,
		lastNode: l,
		originMap: e._originMap,
		recursionLimit: a,
		useAppliedIgnoreCase: !!(!i && o && s),
		useFlagMods: i,
		useFlagV: r,
		verbose: n.verbose
	};
	function d(e) {
		return u.lastNode = l, l = e, Os(fc[e.type], `Unexpected node type "${e.type}"`)(e, u, d);
	}
	let f = {
		pattern: e.body.map(d).join("|"),
		flags: d(e.flags),
		options: { ...e.options }
	};
	return r || (delete f.options.force.v, f.options.disable.v = !0, f.options.unicodeSetsPlugin = null), f._captureTransfers = /* @__PURE__ */ new Map(), f._hiddenCaptures = [], u.captureMap.forEach((e, t) => {
		e.hidden && f._hiddenCaptures.push(t), e.transferTo && Es(f._captureTransfers, e.transferTo, []).push(t);
	}), f;
}
var dc = {
	"*": {
		enter({ node: e }, t) {
			if (wc(e)) {
				let n = t.getCurrentModI();
				t.pushModI(e.flags ? Ts({ ignoreCase: n }, e.flags).ignoreCase : n);
			}
		},
		exit({ node: e }, t) {
			wc(e) && t.popModI();
		}
	},
	Backreference(e, t) {
		t.setHasCasedChar();
	},
	Character({ node: e }, t) {
		vc(G(e.value)) && t.setHasCasedChar();
	},
	CharacterClassRange({ node: e, skip: t }, n) {
		t(), yc(e, { firstOnly: !0 }).length && n.setHasCasedChar();
	},
	CharacterSet({ node: e }, t) {
		e.kind === "property" && Hs.has(e.value) && t.setHasCasedChar();
	}
}, fc = {
	Alternative({ body: e }, t, n) {
		return e.map(n).join("");
	},
	Assertion({ kind: e, negate: t }) {
		if (e === "string_end") return "$";
		if (e === "string_start") return "^";
		if (e === "word_boundary") return t ? K`\B` : K`\b`;
		throw Error(`Unexpected assertion kind "${e}"`);
	},
	Backreference({ ref: e }, t) {
		if (typeof e != "number") throw Error("Unexpected named backref in transformed AST");
		if (!t.useFlagMods && t.accuracy === "strict" && t.currentFlags.ignoreCase && !t.captureMap.get(e).ignoreCase) throw Error("Use of case-insensitive backref to case-sensitive group requires target ES2025 or non-strict accuracy");
		return "\\" + e;
	},
	CapturingGroup(e, t, n) {
		let { body: r, name: i, number: a } = e, o = { ignoreCase: t.currentFlags.ignoreCase }, s = t.originMap.get(e);
		return s && (o.hidden = !0, a > s.number && (o.transferTo = s.number)), t.captureMap.set(a, o), `(${i ? `?<${i}>` : ""}${r.map(n).join("|")})`;
	},
	Character({ value: e }, t) {
		let n = G(e), r = bc(e, {
			escDigit: t.lastNode.type === "Backreference",
			inCharClass: t.inCharClass,
			useFlagV: t.useFlagV
		});
		if (r !== n) return r;
		if (t.useAppliedIgnoreCase && t.currentFlags.ignoreCase && vc(n)) {
			let e = Ps(n);
			return t.inCharClass ? e.join("") : e.length > 1 ? `[${e.join("")}]` : e[0];
		}
		return n;
	},
	CharacterClass(e, t, n) {
		let { kind: r, negate: i, parent: a } = e, { body: o } = e;
		if (r === "intersection" && !t.useFlagV) throw Error("Use of character class intersection requires min target ES2024");
		q.bugFlagVLiteralHyphenIsRange && t.useFlagV && o.some(Ec) && (o = [Mo(45), ...o.filter((e) => !Ec(e))]);
		let s = () => `[${i ? "^" : ""}${o.map(n).join(r === "intersection" ? "&&" : "")}]`;
		if (!t.inCharClass) {
			if ((!t.useFlagV || q.bugNestedClassIgnoresNegation) && !i) {
				let t = o.filter((e) => e.type === "CharacterClass" && e.kind === "union" && e.negate);
				if (t.length) {
					let r = R(), i = r.body[0];
					return r.parent = a, i.parent = r, o = o.filter((e) => !t.includes(e)), e.body = o, o.length ? (e.parent = i, i.body.push(e)) : r.body.pop(), t.forEach((e) => {
						let t = L({ body: [e] });
						e.parent = t, t.parent = r, r.body.push(t);
					}), n(r);
				}
			}
			t.inCharClass = !0;
			let r = s();
			return t.inCharClass = !1, r;
		}
		let c = o[0];
		if (r === "union" && !i && c && ((!t.useFlagV || !t.verbose) && a.kind === "union" && !(q.bugFlagVLiteralHyphenIsRange && t.useFlagV) || !t.verbose && a.kind === "intersection" && o.length === 1 && c.type !== "CharacterClassRange")) return o.map(n).join("");
		if (!t.useFlagV && a.type === "CharacterClass") throw Error("Uses nested character class in a way that requires min target ES2024");
		return s();
	},
	CharacterClassRange(e, t) {
		let n = e.min.value, r = e.max.value, i = {
			escDigit: !1,
			inCharClass: !0,
			useFlagV: t.useFlagV
		}, a = bc(n, i), o = bc(r, i), s = /* @__PURE__ */ new Set();
		return t.useAppliedIgnoreCase && t.currentFlags.ignoreCase && xc(yc(e)).forEach((e) => {
			s.add(Array.isArray(e) ? `${bc(e[0], i)}-${bc(e[1], i)}` : bc(e, i));
		}), `${a}-${o}${[...s].join("")}`;
	},
	CharacterSet({ kind: e, negate: t, value: n, key: r }, i) {
		if (e === "dot") return i.currentFlags.dotAll ? i.appliedGlobalFlags.dotAll || i.useFlagMods ? "." : "[^]" : K`[^\n]`;
		if (e === "digit") return t ? K`\D` : K`\d`;
		if (e === "property") {
			if (i.useAppliedIgnoreCase && i.currentFlags.ignoreCase && Hs.has(n)) throw Error(`Unicode property "${n}" can't be case-insensitive when other chars have specific case`);
			return `${t ? K`\P` : K`\p`}{${r ? `${r}=` : ""}${n}}`;
		}
		if (e === "word") return t ? K`\W` : K`\w`;
		throw Error(`Unexpected character set kind "${e}"`);
	},
	Flags(e, t) {
		return (t.appliedGlobalFlags.ignoreCase ? "i" : "") + (e.dotAll ? "s" : "") + (e.sticky ? "y" : "");
	},
	Group({ atomic: e, body: t, flags: n, parent: r }, i, a) {
		let o = i.currentFlags;
		n && (i.currentFlags = Ts(o, n));
		let s = t.map(a).join("|"), c = !i.verbose && t.length === 1 && r.type !== "Quantifier" && !e && (!i.useFlagMods || !n) ? s : `(?${Sc(e, n, i.useFlagMods)}${s})`;
		return i.currentFlags = o, c;
	},
	LookaroundAssertion({ body: e, kind: t, negate: n }, r, i) {
		return `(?${`${t === "lookahead" ? "" : "<"}${n ? "!" : "="}`}${e.map(i).join("|")})`;
	},
	Quantifier(e, t, n) {
		return n(e.body) + Cc(e);
	},
	Subroutine({ isRecursive: e, ref: t }, n) {
		if (!e) throw Error("Unexpected non-recursive subroutine in transformed AST");
		let r = n.recursionLimit;
		return t === 0 ? `(?R=${r})` : K`\g<${t}&R=${r}>`;
	}
}, pc = /* @__PURE__ */ new Set([
	"$",
	"(",
	")",
	"*",
	"+",
	".",
	"?",
	"[",
	"\\",
	"]",
	"^",
	"{",
	"|",
	"}"
]), mc = /* @__PURE__ */ new Set([
	"-",
	"\\",
	"]",
	"^",
	"["
]), hc = /* @__PURE__ */ new Set(/* @__PURE__ */ "()-/[\\]^{|}!#$%&*+,.:;<=>?@`~".split("")), gc = /* @__PURE__ */ new Map([
	[9, K`\t`],
	[10, K`\n`],
	[11, K`\v`],
	[12, K`\f`],
	[13, K`\r`],
	[8232, K`\u2028`],
	[8233, K`\u2029`],
	[65279, K`\uFEFF`]
]), _c = /^\p{Cased}$/u;
function vc(e) {
	return _c.test(e);
}
function yc(e, t) {
	let n = !!t?.firstOnly, r = e.min.value, i = e.max.value, a = [];
	if (r < 65 && (i === 65535 || i >= 131071) || r === 65536 && i >= 131071) return a;
	for (let e = r; e <= i; e++) {
		let t = G(e);
		if (!vc(t)) continue;
		let o = Ps(t).filter((e) => {
			let t = e.codePointAt(0);
			return t < r || t > i;
		});
		if (o.length && (a.push(...o), n)) break;
	}
	return a;
}
function bc(e, { escDigit: t, inCharClass: n, useFlagV: r }) {
	if (gc.has(e)) return gc.get(e);
	if (e < 32 || e > 126 && e < 160 || e > 262143 || t && Tc(e)) return e > 255 ? `\\u{${e.toString(16).toUpperCase()}}` : `\\x${e.toString(16).toUpperCase().padStart(2, "0")}`;
	let i = n ? r ? hc : mc : pc, a = G(e);
	return (i.has(a) ? "\\" : "") + a;
}
function xc(e) {
	let t = e.map((e) => e.codePointAt(0)).sort((e, t) => e - t), n = [], r = null;
	for (let e = 0; e < t.length; e++) t[e + 1] === t[e] + 1 ? r ??= t[e] : r === null ? n.push(t[e]) : (n.push([r, t[e]]), r = null);
	return n;
}
function Sc(e, t, n) {
	if (e) return ">";
	let r = "";
	if (t && n) {
		let { enable: e, disable: n } = t;
		r = (e?.ignoreCase ? "i" : "") + (e?.dotAll ? "s" : "") + (n ? "-" : "") + (n?.ignoreCase ? "i" : "") + (n?.dotAll ? "s" : "");
	}
	return `${r}:`;
}
function Cc({ kind: e, max: t, min: n }) {
	let r;
	return r = !n && t === 1 ? "?" : !n && t === Infinity ? "*" : n === 1 && t === Infinity ? "+" : n === t ? `{${n}}` : `{${n},${t === Infinity ? "" : t}}`, r + {
		greedy: "",
		lazy: "?",
		possessive: "+"
	}[e];
}
function wc({ type: e }) {
	return e === "CapturingGroup" || e === "Group" || e === "LookaroundAssertion";
}
function Tc(e) {
	return e > 47 && e < 58;
}
function Ec({ type: e, value: t }) {
	return e === "Character" && t === 45;
}
var Dc = class e extends RegExp {
	#e = /* @__PURE__ */ new Map();
	#t = null;
	#n;
	#r = null;
	#i = null;
	rawOptions = {};
	get source() {
		return this.#n || "(?:)";
	}
	constructor(t, n, r) {
		let i = !!r?.lazyCompile;
		if (t instanceof RegExp) {
			if (r) throw Error("Cannot provide options when copying a regexp");
			let i = t;
			super(i, n), this.#n = i.source, i instanceof e && (this.#e = i.#e, this.#r = i.#r, this.#i = i.#i, this.rawOptions = i.rawOptions);
		} else {
			let e = {
				hiddenCaptures: [],
				strategy: null,
				transfers: [],
				...r
			};
			super(i ? "" : t, n), this.#n = t, this.#e = kc(e.hiddenCaptures, e.transfers), this.#i = e.strategy, this.rawOptions = r ?? {};
		}
		i || (this.#t = this);
	}
	exec(t) {
		if (!this.#t) {
			let { lazyCompile: t, ...n } = this.rawOptions;
			this.#t = new e(this.#n, this.flags, n);
		}
		let n = this.global || this.sticky, r = this.lastIndex;
		if (this.#i === "clip_search" && n && r) {
			this.lastIndex = 0;
			let e = this.#a(t.slice(r));
			return e && (Oc(e, r, t, this.hasIndices), this.lastIndex += r), e;
		}
		return this.#a(t);
	}
	#a(e) {
		this.#t.lastIndex = this.lastIndex;
		let t = super.exec.call(this.#t, e);
		if (this.lastIndex = this.#t.lastIndex, !t || !this.#e.size) return t;
		let n = [...t];
		t.length = 1;
		let r;
		this.hasIndices && (r = [...t.indices], t.indices.length = 1);
		let i = [0];
		for (let e = 1; e < n.length; e++) {
			let { hidden: a, transferTo: o } = this.#e.get(e) ?? {};
			if (a ? i.push(null) : (i.push(t.length), t.push(n[e]), this.hasIndices && t.indices.push(r[e])), o && n[e] !== void 0) {
				let a = i[o];
				if (!a) throw Error(`Invalid capture transfer to "${a}"`);
				if (t[a] = n[e], this.hasIndices && (t.indices[a] = r[e]), t.groups) {
					this.#r ||= Ac(this.source);
					let i = this.#r.get(o);
					i && (t.groups[i] = n[e], this.hasIndices && (t.indices.groups[i] = r[e]));
				}
			}
		}
		return t;
	}
};
function Oc(e, t, n, r) {
	if (e.index += t, e.input = n, r) {
		let n = e.indices;
		for (let e = 0; e < n.length; e++) {
			let r = n[e];
			r && (n[e] = [r[0] + t, r[1] + t]);
		}
		let r = n.groups;
		r && Object.keys(r).forEach((e) => {
			let n = r[e];
			n && (r[e] = [n[0] + t, n[1] + t]);
		});
	}
}
function kc(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let t of e) n.set(t, { hidden: !0 });
	for (let [e, r] of t) for (let t of r) Es(n, t, {}).transferTo = e;
	return n;
}
function Ac(e) {
	let t = /(?<capture>\((?:\?<(?![=!])(?<name>[^>]+)>|(?!\?)))|\\?./gsu, n = /* @__PURE__ */ new Map(), r = 0, i = 0, a;
	for (; a = t.exec(e);) {
		let { 0: e, groups: { capture: t, name: o } } = a;
		e === "[" ? r++ : r ? e === "]" && r-- : t && (i++, o && n.set(i, o));
	}
	return n;
}
function jc(e, t) {
	let n = Mc(e, t);
	return n.options ? new Dc(n.pattern, n.flags, n.options) : new RegExp(n.pattern, n.flags);
}
function Mc(e, t) {
	let n = js(t), r = Us(yo(e, {
		flags: n.flags,
		normalizeUnknownPropertyNames: !0,
		rules: {
			captureGroup: n.rules.captureGroup,
			singleline: n.rules.singleline
		},
		skipBackrefValidation: n.rules.allowOrphanBackrefs,
		unicodePropertyMap: Fs
	}), {
		accuracy: n.accuracy,
		asciiWordBoundaries: n.rules.asciiWordBoundaries,
		avoidSubclass: n.avoidSubclass,
		bestEffortTarget: n.target
	}), i = uc(r, n), a = vs(i.pattern, {
		captureTransfers: i._captureTransfers,
		hiddenCaptures: i._hiddenCaptures,
		mode: "external"
	}), o = us(ps(a.pattern).pattern, {
		captureTransfers: a.captureTransfers,
		hiddenCaptures: a.hiddenCaptures
	}), s = {
		pattern: o.pattern,
		flags: `${n.hasIndices ? "d" : ""}${n.global ? "g" : ""}${i.flags}${i.options.disable.v ? "u" : "v"}`
	};
	if (n.avoidSubclass) {
		if (n.lazyCompileLength !== Infinity) throw Error("Lazy compilation requires subclass");
	} else {
		let e = o.hiddenCaptures.sort((e, t) => e - t), t = Array.from(o.captureTransfers), i = r._strategy, a = s.pattern.length >= n.lazyCompileLength;
		(e.length || t.length || i || a) && (s.options = {
			...e.length && { hiddenCaptures: e },
			...t.length && { transfers: t },
			...i && { strategy: i },
			...a && { lazyCompile: a }
		});
	}
	return s;
}
// node_modules/@shikijs/engine-javascript/dist/shared/engine-javascript.hzpS1_41.mjs
var Nc = 4294967295, Pc = class {
	constructor(e, t = {}) {
		this.patterns = e, this.options = t;
		let { forgiving: n = !1, cache: r, regexConstructor: i } = t;
		if (!i) throw Error("Option `regexConstructor` is not provided");
		this.regexps = e.map((e) => {
			if (typeof e != "string") return e;
			let t = r?.get(e);
			if (t) {
				if (t instanceof RegExp) return t;
				if (n) return null;
				throw t;
			}
			try {
				let t = i(e);
				return r?.set(e, t), t;
			} catch (t) {
				if (r?.set(e, t), n) return null;
				throw t;
			}
		});
	}
	regexps;
	findNextMatchSync(e, t, n) {
		let r = typeof e == "string" ? e : e.content, i = [];
		function a(e, t, n = 0) {
			return {
				index: e,
				captureIndices: t.indices.map((e) => e == null ? {
					start: Nc,
					end: Nc,
					length: 0
				} : {
					start: e[0] + n,
					end: e[1] + n,
					length: e[1] - e[0]
				})
			};
		}
		for (let e = 0; e < this.regexps.length; e++) {
			let n = this.regexps[e];
			if (n) try {
				n.lastIndex = t;
				let o = n.exec(r);
				if (!o) continue;
				if (o.index === t) return a(e, o, 0);
				i.push([
					e,
					o,
					0
				]);
			} catch (e) {
				if (this.options.forgiving) continue;
				throw e;
			}
		}
		if (i.length) {
			let e = Math.min(...i.map((e) => e[1].index));
			for (let [t, n, r] of i) if (n.index === e) return a(t, n, r);
		}
		return null;
	}
};
// node_modules/@shikijs/engine-javascript/dist/engine-compile.mjs
function Fc(e, t) {
	return jc(e, {
		global: !0,
		hasIndices: !0,
		lazyCompileLength: 3e3,
		rules: {
			allowOrphanBackrefs: !0,
			asciiWordBoundaries: !0,
			captureGroup: !0,
			recursionLimit: 5,
			singleline: !0
		},
		...t
	});
}
function Ic(e = {}) {
	let t = Object.assign({
		target: "auto",
		cache: /* @__PURE__ */ new Map()
	}, e);
	return t.regexConstructor ||= (e) => Fc(e, { target: t.target }), {
		createScanner(e) {
			return new Pc(e, t);
		},
		createString(e) {
			return { content: e };
		}
	};
}
// node_modules/streamdown/dist/code-block-IT6T5CEO.js
var Lc = /* @__PURE__ */ e(a(), 1), $ = s(), Rc = n("block", "before:content-[counter(line)]", "before:inline-block", "before:[counter-increment:line]", "before:w-4", "before:mr-4", "before:text-[13px]", "before:text-right", "before:text-muted-foreground/50", "before:font-mono", "before:select-none"), zc = (0, Lc.memo)(({ children: e, result: t, language: r, className: i, ...a }) => {
	let o = (0, Lc.useMemo)(() => ({
		backgroundColor: t.bg,
		color: t.fg
	}), [t.bg, t.fg]);
	return (0, $.jsx)("pre", {
		className: n(i, "p-4 text-sm dark:bg-(--shiki-dark-bg)!"),
		"data-language": r,
		"data-streamdown": "code-block-body",
		style: o,
		...a,
		children: (0, $.jsx)("code", {
			className: "[counter-increment:line_0] [counter-reset:line]",
			children: t.tokens.map((e, t) => (0, $.jsx)("span", {
				className: Rc,
				children: e.map((e, t) => (0, $.jsx)("span", {
					className: "dark:bg-(--shiki-dark-bg)! dark:text-(--shiki-dark)!",
					style: {
						color: e.color,
						backgroundColor: e.bgColor,
						...e.htmlStyle
					},
					...e.htmlAttrs,
					children: e.content
				}, t))
			}, t))
		})
	});
}, (e, t) => e.result === t.result && e.language === t.language && e.className === t.className), Bc = ({ className: e, language: t, style: r, ...i }) => (0, $.jsx)("div", {
	className: n("my-4 w-full overflow-hidden rounded-xl border border-border", e),
	"data-language": t,
	"data-streamdown": "code-block",
	style: {
		contentVisibility: "auto",
		containIntrinsicSize: "auto 200px",
		...r
	},
	...i
}), Vc = ({ language: e, children: t }) => (0, $.jsxs)("div", {
	className: "flex items-center justify-between bg-muted/80 p-3 text-muted-foreground text-xs",
	"data-language": e,
	"data-streamdown": "code-block-header",
	children: [(0, $.jsx)("span", {
		className: "ml-1 font-mono lowercase",
		children: e
	}), (0, $.jsx)("div", {
		className: "flex items-center gap-2",
		children: t
	})]
}), Hc = Ic({ forgiving: !0 }), Uc = /* @__PURE__ */ new Map(), Wc = /* @__PURE__ */ new Map(), Gc = /* @__PURE__ */ new Map(), Kc = (e, t) => `${e}-${t[0]}-${t[1]}`, qc = (e, t, n) => {
	let r = e.slice(0, 100), i = e.length > 100 ? e.slice(-100) : "";
	return `${t}:${n[0]}:${n[1]}:${e.length}:${r}:${i}`;
}, Jc = (e) => Object.hasOwn(Yi, e), Yc = (e, t) => {
	let n = Jc(e) ? e : "text", r = Kc(n, t);
	if (Uc.has(r)) return Uc.get(r);
	let i = ba({
		themes: t,
		langs: [n],
		engine: Hc
	});
	return Uc.set(r, i), i;
}, Xc = (e, t, n, r) => {
	let i = Jc(t) ? t : "text", a = qc(e, i, n);
	return Wc.has(a) ? Wc.get(a) : (r && (Gc.has(a) || Gc.set(a, /* @__PURE__ */ new Set()), Gc.get(a).add(r)), Yc(i, n).then((t) => {
		let r = t.codeToTokens(e, {
			lang: i,
			themes: {
				light: n[0],
				dark: n[1]
			}
		});
		Wc.set(a, r);
		let o = Gc.get(a);
		if (o) {
			for (let e of o) e(r);
			Gc.delete(a);
		}
	}).catch((e) => {
		console.error("Failed to highlight code:", e), Gc.delete(a);
	}), null);
}, Zc = ({ code: e, language: t, className: n, children: r, ...i }) => {
	let { shikiTheme: a } = (0, Lc.useContext)(u), o = (0, Lc.useMemo)(() => ({
		bg: "transparent",
		fg: "inherit",
		tokens: e.split("\n").map((e) => [{
			content: e,
			color: "inherit",
			bgColor: "transparent",
			htmlStyle: {},
			offset: 0
		}])
	}), [e]), [s, l] = (0, Lc.useState)(o);
	return (0, Lc.useEffect)(() => {
		let n = Xc(e, t, a);
		n ? l(n) : Xc(e, t, a, (e) => {
			l(e);
		});
	}, [
		e,
		t,
		a
	]), (0, $.jsx)(c.Provider, {
		value: { code: e },
		children: (0, $.jsxs)(Bc, {
			language: t,
			children: [(0, $.jsx)(Vc, {
				language: t,
				children: r
			}), (0, $.jsx)(zc, {
				className: n,
				language: t,
				result: s,
				...i
			})]
		})
	});
};
export { Zc as CodeBlock };
