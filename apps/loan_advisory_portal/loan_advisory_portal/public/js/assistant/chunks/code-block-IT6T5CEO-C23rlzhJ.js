import { i as e } from "./rolldown-runtime-CwxnZyOB.js";
import { _ as t, a as n, d as r, f as i, g as a, h as o, m as s, n as c, o as l, p as u, t as d, u as f, v as p, y as m } from "./chunk-JAPRZBRM-B5FVaAl-.js";
// node_modules/.pnpm/@shikijs+types@3.23.0/node_modules/@shikijs/types/dist/index.mjs
var h = class extends Error {
	constructor(e) {
		super(e), this.name = "ShikiError";
	}
};
// node_modules/.pnpm/@shikijs+vscode-textmate@10.1.0/node_modules/@shikijs/vscode-textmate/dist/index.js
function g(e) {
	return _(e);
}
function _(e) {
	return Array.isArray(e) ? ee(e) : e instanceof RegExp ? e : typeof e == "object" ? te(e) : e;
}
function ee(e) {
	let t = [];
	for (let n = 0, r = e.length; n < r; n++) t[n] = _(e[n]);
	return t;
}
function te(e) {
	let t = {};
	for (let n in e) t[n] = _(e[n]);
	return t;
}
function ne(e, ...t) {
	return t.forEach((t) => {
		for (let n in t) e[n] = t[n];
	}), e;
}
function re(e) {
	let t = ~e.lastIndexOf("/") || ~e.lastIndexOf("\\");
	return t === 0 ? e : ~t === e.length - 1 ? re(e.substring(0, e.length - 1)) : e.substr(~t + 1);
}
var ie = /\$(\d+)|\${(\d+):\/(downcase|upcase)}/g, ae = class {
	static hasCaptures(e) {
		return e !== null && (ie.lastIndex = 0, ie.test(e));
	}
	static replaceCaptures(e, t, n) {
		return e.replace(ie, (e, r, i, a) => {
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
function oe(e, t) {
	return e < t ? -1 : +(e > t);
}
function se(e, t) {
	if (e === null && t === null) return 0;
	if (!e) return -1;
	if (!t) return 1;
	let n = e.length, r = t.length;
	if (n === r) {
		for (let r = 0; r < n; r++) {
			let n = oe(e[r], t[r]);
			if (n !== 0) return n;
		}
		return 0;
	}
	return n - r;
}
function ce(e) {
	return !!(/^#[0-9a-f]{6}$/i.test(e) || /^#[0-9a-f]{8}$/i.test(e) || /^#[0-9a-f]{3}$/i.test(e) || /^#[0-9a-f]{4}$/i.test(e));
}
function le(e) {
	return e.replace(/[\-\\\{\}\*\+\?\|\^\$\.\,\[\]\(\)\#\s]/g, "\\$&");
}
var ue = class {
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
}, de = class {
	constructor(e, t, n) {
		this._colorMap = e, this._defaults = t, this._root = n;
	}
	_colorMap;
	_defaults;
	_root;
	static createFromRawTheme(e, t) {
		return this.createFromParsedTheme(ge(e), t);
	}
	static createFromParsedTheme(e, t) {
		return ve(e, t);
	}
	_cachedMatchRoot = new ue((e) => this._root.match(e));
	getColorMap() {
		return this._colorMap.getColorMap();
	}
	getDefaults() {
		return this._defaults;
	}
	match(e) {
		if (e === null) return this._defaults;
		let t = e.scopeName, n = this._cachedMatchRoot.get(t).find((t) => pe(e.parent, t.parentScopes));
		return n ? new he(n.fontStyle, n.foreground, n.background) : null;
	}
}, fe = class e {
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
function pe(e, t) {
	if (t.length === 0) return !0;
	for (let n = 0; n < t.length; n++) {
		let r = t[n], i = !1;
		if (r === ">") {
			if (n === t.length - 1) return !1;
			r = t[++n], i = !0;
		}
		for (; e && !me(e.scopeName, r);) {
			if (i) return !1;
			e = e.parent;
		}
		if (!e) return !1;
		e = e.parent;
	}
	return !0;
}
function me(e, t) {
	return t === e || e.startsWith(t) && e[t.length] === ".";
}
var he = class {
	constructor(e, t, n) {
		this.fontStyle = e, this.foregroundId = t, this.backgroundId = n;
	}
	fontStyle;
	foregroundId;
	backgroundId;
};
function ge(e) {
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
		typeof i.settings.foreground == "string" && ce(i.settings.foreground) && (s = i.settings.foreground);
		let c = null;
		typeof i.settings.background == "string" && ce(i.settings.background) && (c = i.settings.background);
		for (let t = 0, i = a.length; t < i; t++) {
			let i = a[t].trim().split(" "), l = i[i.length - 1], u = null;
			i.length > 1 && (u = i.slice(0, i.length - 1), u.reverse()), n[r++] = new _e(l, u, e, o, s, c);
		}
	}
	return n;
}
var _e = class {
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
function ve(e, t) {
	e.sort((e, t) => {
		let n = oe(e.scope, t.scope);
		return n !== 0 || (n = se(e.parentScopes, t.parentScopes), n !== 0) ? n : e.index - t.index;
	});
	let n = 0, r = "#000000", i = "#ffffff";
	for (; e.length >= 1 && e[0].scope === "";) {
		let t = e.shift();
		t.fontStyle !== -1 && (n = t.fontStyle), t.foreground !== null && (r = t.foreground), t.background !== null && (i = t.background);
	}
	let a = new ye(t), o = new he(n, a.getId(r), a.getId(i)), s = new Se(new xe(0, null, -1, 0, 0), []);
	for (let t = 0, n = e.length; t < n; t++) {
		let n = e[t];
		s.insert(0, n.scope, n.parentScopes, n.fontStyle, a.getId(n.foreground), a.getId(n.background));
	}
	return new de(a, o, s);
}
var ye = class {
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
}, be = Object.freeze([]), xe = class e {
	scopeDepth;
	parentScopes;
	fontStyle;
	foreground;
	background;
	constructor(e, t, n, r, i) {
		this.scopeDepth = e, this.parentScopes = t || be, this.fontStyle = n, this.foreground = r, this.background = i;
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
}, Se = class e {
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
		this._children.hasOwnProperty(c) ? u = this._children[c] : (u = new e(this._mainRule.clone(), xe.cloneArr(this._rulesWithParentScopes)), this._children[c] = u), u.insert(t + 1, l, r, i, a, o);
	}
	_doInsertHere(e, t, n, r, i) {
		if (t === null) this._mainRule.acceptOverwrite(e, n, r, i);
		else {
			for (let a = 0, o = this._rulesWithParentScopes.length; a < o; a++) {
				let o = this._rulesWithParentScopes[a];
				if (se(o.parentScopes, t) === 0) {
					o.acceptOverwrite(e, n, r, i);
					return;
				}
			}
			n === -1 && (n = this._mainRule.fontStyle), r === 0 && (r = this._mainRule.foreground), i === 0 && (i = this._mainRule.background), this._rulesWithParentScopes.push(new xe(e, t, n, r, i));
		}
	}
}, y = class e {
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
		return n !== 0 && (c = n), r !== 8 && (l = we(r)), i !== null && (u = +!!i), a !== -1 && (d = a), o !== 0 && (f = o), s !== 0 && (p = s), (c | 0 | l << 8 | u << 10 | d << 11 | f << 15 | p << 24) >>> 0;
	}
};
function Ce(e) {
	return e;
}
function we(e) {
	return e;
}
function Te(e, t) {
	let n = [], r = De(e), i = r.next();
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
		if (Ee(i)) {
			let e = [];
			do
				e.push(i), i = r.next();
			while (Ee(i));
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
function Ee(e) {
	return !!e && !!e.match(/[\w\.:]+/);
}
function De(e) {
	let t = /([LR]:|[\w\.:][\w\.:\-]*|[\,\|\-\(\)])/g, n = t.exec(e);
	return { next: () => {
		if (!n) return null;
		let r = n[0];
		return n = t.exec(e), r;
	} };
}
function Oe(e) {
	typeof e.dispose == "function" && e.dispose();
}
var b = class {
	constructor(e) {
		this.scopeName = e;
	}
	scopeName;
	toKey() {
		return this.scopeName;
	}
}, ke = class {
	constructor(e, t) {
		this.scopeName = e, this.ruleName = t;
	}
	scopeName;
	ruleName;
	toKey() {
		return `${this.scopeName}#${this.ruleName}`;
	}
}, Ae = class {
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
}, je = class {
	constructor(e, t) {
		this.repo = e, this.initialScopeName = t, this.seenFullScopeRequests.add(this.initialScopeName), this.Q = [new b(this.initialScopeName)];
	}
	repo;
	initialScopeName;
	seenFullScopeRequests = /* @__PURE__ */ new Set();
	seenPartialScopeRequests = /* @__PURE__ */ new Set();
	Q;
	processQueue() {
		let e = this.Q;
		this.Q = [];
		let t = new Ae();
		for (let n of e) Me(n, this.initialScopeName, this.repo, t);
		for (let e of t.references) if (e instanceof b) {
			if (this.seenFullScopeRequests.has(e.scopeName)) continue;
			this.seenFullScopeRequests.add(e.scopeName), this.Q.push(e);
		} else {
			if (this.seenFullScopeRequests.has(e.scopeName) || this.seenPartialScopeRequests.has(e.toKey())) continue;
			this.seenPartialScopeRequests.add(e.toKey()), this.Q.push(e);
		}
	}
};
function Me(e, t, n, r) {
	let i = n.lookup(e.scopeName);
	if (!i) {
		if (e.scopeName === t) throw Error(`No grammar provided for <${t}>`);
		return;
	}
	let a = n.lookup(t);
	e instanceof b ? Pe({
		baseGrammar: a,
		selfGrammar: i
	}, r) : Ne(e.ruleName, {
		baseGrammar: a,
		selfGrammar: i,
		repository: i.repository
	}, r);
	let o = n.injections(e.scopeName);
	if (o) for (let e of o) r.add(new b(e));
}
function Ne(e, t, n) {
	if (t.repository && t.repository[e]) {
		let r = t.repository[e];
		Fe([r], t, n);
	}
}
function Pe(e, t) {
	e.selfGrammar.patterns && Array.isArray(e.selfGrammar.patterns) && Fe(e.selfGrammar.patterns, {
		...e,
		repository: e.selfGrammar.repository
	}, t), e.selfGrammar.injections && Fe(Object.values(e.selfGrammar.injections), {
		...e,
		repository: e.selfGrammar.repository
	}, t);
}
function Fe(e, t, n) {
	for (let r of e) {
		if (n.visitedRule.has(r)) continue;
		n.visitedRule.add(r);
		let e = r.repository ? ne({}, t.repository, r.repository) : t.repository;
		Array.isArray(r.patterns) && Fe(r.patterns, {
			...t,
			repository: e
		}, n);
		let i = r.include;
		if (!i) continue;
		let a = Ve(i);
		switch (a.kind) {
			case 0:
				Pe({
					...t,
					selfGrammar: t.baseGrammar
				}, n);
				break;
			case 1:
				Pe(t, n);
				break;
			case 2:
				Ne(a.ruleName, {
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
					a.kind === 4 ? Ne(a.ruleName, i, n) : Pe(i, n);
				} else a.kind === 4 ? n.add(new ke(a.scopeName, a.ruleName)) : n.add(new b(a.scopeName));
		}
	}
}
var Ie = class {
	kind = 0;
}, Le = class {
	kind = 1;
}, Re = class {
	constructor(e) {
		this.ruleName = e;
	}
	ruleName;
	kind = 2;
}, ze = class {
	constructor(e) {
		this.scopeName = e;
	}
	scopeName;
	kind = 3;
}, Be = class {
	constructor(e, t) {
		this.scopeName = e, this.ruleName = t;
	}
	scopeName;
	ruleName;
	kind = 4;
};
function Ve(e) {
	if (e === "$base") return new Ie();
	if (e === "$self") return new Le();
	let t = e.indexOf("#");
	return t === -1 ? new ze(e) : t === 0 ? new Re(e.substring(1)) : new Be(e.substring(0, t), e.substring(t + 1));
}
var He = /\\(\d+)/, Ue = /\\(\d+)/g, We = -1, Ge = -2;
function Ke(e) {
	return e;
}
function qe(e) {
	return e;
}
var Je = class {
	$location;
	id;
	_nameIsCapturing;
	_name;
	_contentNameIsCapturing;
	_contentName;
	constructor(e, t, n, r) {
		this.$location = e, this.id = t, this._name = n || null, this._nameIsCapturing = ae.hasCaptures(this._name), this._contentName = r || null, this._contentNameIsCapturing = ae.hasCaptures(this._contentName);
	}
	get debugName() {
		let e = this.$location ? `${re(this.$location.filename)}:${this.$location.line}` : "unknown";
		return `${this.constructor.name}#${this.id} @ ${e}`;
	}
	getName(e, t) {
		return !this._nameIsCapturing || this._name === null || e === null || t === null ? this._name : ae.replaceCaptures(this._name, e, t);
	}
	getContentName(e, t) {
		return !this._contentNameIsCapturing || this._contentName === null ? this._contentName : ae.replaceCaptures(this._contentName, e, t);
	}
}, Ye = class extends Je {
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
}, Xe = class extends Je {
	_match;
	captures;
	_cachedCompiledPatterns;
	constructor(e, t, n, r, i) {
		super(e, t, n, null), this._match = new tt(r, this.id), this.captures = i, this._cachedCompiledPatterns = null;
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
		return this._cachedCompiledPatterns || (this._cachedCompiledPatterns = new nt(), this.collectPatterns(e, this._cachedCompiledPatterns)), this._cachedCompiledPatterns;
	}
}, Ze = class extends Je {
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
		return this._cachedCompiledPatterns || (this._cachedCompiledPatterns = new nt(), this.collectPatterns(e, this._cachedCompiledPatterns)), this._cachedCompiledPatterns;
	}
}, Qe = class extends Je {
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
		super(e, t, n, r), this._begin = new tt(i, this.id), this.beginCaptures = a, this._end = new tt(o || "￿", -1), this.endHasBackReferences = this._end.hasBackReferences, this.endCaptures = s, this.applyEndPatternLast = c || !1, this.patterns = l.patterns, this.hasMissingPatterns = l.hasMissingPatterns, this._cachedCompiledPatterns = null;
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
			this._cachedCompiledPatterns = new nt();
			for (let t of this.patterns) e.getRule(t).collectPatterns(e, this._cachedCompiledPatterns);
			this.applyEndPatternLast ? this._cachedCompiledPatterns.push(this._end.hasBackReferences ? this._end.clone() : this._end) : this._cachedCompiledPatterns.unshift(this._end.hasBackReferences ? this._end.clone() : this._end);
		}
		return this._end.hasBackReferences && (this.applyEndPatternLast ? this._cachedCompiledPatterns.setSource(this._cachedCompiledPatterns.length() - 1, t) : this._cachedCompiledPatterns.setSource(0, t)), this._cachedCompiledPatterns;
	}
}, $e = class extends Je {
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
		super(e, t, n, r), this._begin = new tt(i, this.id), this.beginCaptures = a, this.whileCaptures = s, this._while = new tt(o, Ge), this.whileHasBackReferences = this._while.hasBackReferences, this.patterns = c.patterns, this.hasMissingPatterns = c.hasMissingPatterns, this._cachedCompiledPatterns = null, this._cachedCompiledWhilePatterns = null;
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
			this._cachedCompiledPatterns = new nt();
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
		return this._cachedCompiledWhilePatterns || (this._cachedCompiledWhilePatterns = new nt(), this._cachedCompiledWhilePatterns.push(this._while.hasBackReferences ? this._while.clone() : this._while)), this._while.hasBackReferences && this._cachedCompiledWhilePatterns.setSource(0, t || "￿"), this._cachedCompiledWhilePatterns;
	}
}, et = class e {
	static createCaptureRule(e, t, n, r, i) {
		return e.registerRule((e) => new Ye(t, e, n, r, i));
	}
	static getCompiledRuleId(t, n, r) {
		return t.id || n.registerRule((i) => {
			if (t.id = i, t.match) return new Xe(t.$vscodeTextmateLocation, t.id, t.name, t.match, e._compileCaptures(t.captures, n, r));
			if (t.begin === void 0) {
				t.repository && (r = ne({}, r, t.repository));
				let i = t.patterns;
				return i === void 0 && t.include && (i = [{ include: t.include }]), new Ze(t.$vscodeTextmateLocation, t.id, t.name, t.contentName, e._compilePatterns(i, n, r));
			}
			return t.while ? new $e(t.$vscodeTextmateLocation, t.id, t.name, t.contentName, t.begin, e._compileCaptures(t.beginCaptures || t.captures, n, r), t.while, e._compileCaptures(t.whileCaptures || t.captures, n, r), e._compilePatterns(t.patterns, n, r)) : new Qe(t.$vscodeTextmateLocation, t.id, t.name, t.contentName, t.begin, e._compileCaptures(t.beginCaptures || t.captures, n, r), t.end, e._compileCaptures(t.endCaptures || t.captures, n, r), t.applyEndPatternLast, e._compilePatterns(t.patterns, n, r));
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
				let t = Ve(o.include);
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
				if ((e instanceof Ze || e instanceof Qe || e instanceof $e) && e.hasMissingPatterns && e.patterns.length === 0 && (t = !0), t) continue;
				i.push(s);
			}
		}
		return {
			patterns: i,
			hasMissingPatterns: (t ? t.length : 0) !== i.length
		};
	}
}, tt = class e {
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
		this._anchorCache = this.hasAnchor ? this._buildAnchorCache() : null, this.ruleId = t, this.hasBackReferences = typeof this.source == "string" && He.test(this.source);
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
		return Ue.lastIndex = 0, this.source.replace(Ue, (e, t) => le(n[parseInt(t, 10)] || ""));
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
}, nt = class {
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
			this._cached = new rt(e, t, this._items.map((e) => e.ruleId));
		}
		return this._cached;
	}
	compileAG(e, t, n) {
		return this._hasAnchors ? t ? n ? (this._anchorCache.A1_G1 || (this._anchorCache.A1_G1 = this._resolveAnchors(e, t, n)), this._anchorCache.A1_G1) : (this._anchorCache.A1_G0 || (this._anchorCache.A1_G0 = this._resolveAnchors(e, t, n)), this._anchorCache.A1_G0) : n ? (this._anchorCache.A0_G1 || (this._anchorCache.A0_G1 = this._resolveAnchors(e, t, n)), this._anchorCache.A0_G1) : (this._anchorCache.A0_G0 || (this._anchorCache.A0_G0 = this._resolveAnchors(e, t, n)), this._anchorCache.A0_G0) : this.compile(e);
	}
	_resolveAnchors(e, t, n) {
		return new rt(e, this._items.map((e) => e.resolveAnchors(t, n)), this._items.map((e) => e.ruleId));
	}
}, rt = class {
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
}, it = class {
	constructor(e, t) {
		this.languageId = e, this.tokenType = t;
	}
	languageId;
	tokenType;
}, at = class e {
	_defaultAttributes;
	_embeddedLanguagesMatcher;
	constructor(e, t) {
		this._defaultAttributes = new it(e, 8), this._embeddedLanguagesMatcher = new ot(Object.entries(t || {}));
	}
	getDefaultAttributes() {
		return this._defaultAttributes;
	}
	getBasicScopeAttributes(t) {
		return t === null ? e._NULL_SCOPE_METADATA : this._getBasicScopeAttributes.get(t);
	}
	static _NULL_SCOPE_METADATA = new it(0, 0);
	_getBasicScopeAttributes = new ue((e) => new it(this._scopeToLanguage(e), this._toStandardTokenType(e)));
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
}, ot = class {
	values;
	scopesRegExp;
	constructor(e) {
		if (e.length === 0) this.values = null, this.scopesRegExp = null;
		else {
			this.values = new Map(e);
			let t = e.map(([e, t]) => le(e));
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
var st = class {
	constructor(e, t) {
		this.stack = e, this.stoppedEarly = t;
	}
	stack;
	stoppedEarly;
};
function ct(e, t, n, r, i, a, o, s) {
	let c = t.content.length, l = !1, u = -1;
	if (o) {
		let o = lt(e, t, n, r, i, a);
		i = o.stack, r = o.linePos, n = o.isFirstLine, u = o.anchorPosition;
	}
	let d = Date.now();
	for (; !l;) {
		if (s !== 0 && Date.now() - d > s) return new st(i, !0);
		f();
	}
	return new st(i, !1);
	function f() {
		let o = ut(e, t, n, r, i, u);
		if (!o) {
			a.produce(i, c), l = !0;
			return;
		}
		let s = o.captureIndices, d = o.matchedRuleId, f = s && s.length > 0 ? s[0].end > r : !1;
		if (d === We) {
			let o = i.getRule(e);
			a.produce(i, s[0].start), i = i.withContentNameScopesList(i.nameScopesList), ht(e, t, n, i, a, o.endCaptures, s), a.produce(i, s[0].end);
			let d = i;
			if (i = i.parent, u = d.getAnchorPos(), !f && d.getEnterPos() === r) {
				i = d, a.produce(i, c), l = !0;
				return;
			}
		} else {
			let o = e.getRule(d);
			a.produce(i, s[0].start);
			let p = i, m = o.getName(t.content, s), h = i.contentNameScopesList.pushAttributed(m, e);
			if (i = i.push(d, r, u, s[0].end === c, null, h, h), o instanceof Qe) {
				let r = o;
				ht(e, t, n, i, a, r.beginCaptures, s), a.produce(i, s[0].end), u = s[0].end;
				let d = r.getContentName(t.content, s), m = h.pushAttributed(d, e);
				if (i = i.withContentNameScopesList(m), r.endHasBackReferences && (i = i.withEndRule(r.getEndWithResolvedBackReferences(t.content, s))), !f && p.hasSameRuleAs(i)) {
					i = i.pop(), a.produce(i, c), l = !0;
					return;
				}
			} else if (o instanceof $e) {
				let r = o;
				ht(e, t, n, i, a, r.beginCaptures, s), a.produce(i, s[0].end), u = s[0].end;
				let d = r.getContentName(t.content, s), m = h.pushAttributed(d, e);
				if (i = i.withContentNameScopesList(m), r.whileHasBackReferences && (i = i.withEndRule(r.getWhileWithResolvedBackReferences(t.content, s))), !f && p.hasSameRuleAs(i)) {
					i = i.pop(), a.produce(i, c), l = !0;
					return;
				}
			} else if (ht(e, t, n, i, a, o.captures, s), a.produce(i, s[0].end), i = i.pop(), !f) {
				i = i.safePop(), a.produce(i, c), l = !0;
				return;
			}
		}
		s[0].end > r && (r = s[0].end, n = !1);
	}
}
function lt(e, t, n, r, i, a) {
	let o = i.beginRuleCapturedEOL ? 0 : -1, s = [];
	for (let t = i; t; t = t.pop()) {
		let n = t.getRule(e);
		n instanceof $e && s.push({
			rule: n,
			stack: t
		});
	}
	for (let c = s.pop(); c; c = s.pop()) {
		let { ruleScanner: s, findOptions: l } = mt(c.rule, e, c.stack.endRule, n, r === o), u = s.findNextMatchSync(t, r, l);
		if (u) {
			if (u.ruleId !== Ge) {
				i = c.stack.pop();
				break;
			}
			u.captureIndices && u.captureIndices.length && (a.produce(c.stack, u.captureIndices[0].start), ht(e, t, n, c.stack, a, c.rule.whileCaptures, u.captureIndices), a.produce(c.stack, u.captureIndices[0].end), o = u.captureIndices[0].end, u.captureIndices[0].end > r && (r = u.captureIndices[0].end, n = !1));
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
function ut(e, t, n, r, i, a) {
	let o = dt(e, t, n, r, i, a), s = e.getInjections();
	if (s.length === 0) return o;
	let c = ft(s, e, t, n, r, i, a);
	if (!c) return o;
	if (!o) return c;
	let l = o.captureIndices[0].start, u = c.captureIndices[0].start;
	return u < l || c.priorityMatch && u === l ? c : o;
}
function dt(e, t, n, r, i, a) {
	let { ruleScanner: o, findOptions: s } = pt(i.getRule(e), e, i.endRule, n, r === a), c = o.findNextMatchSync(t, r, s);
	return c ? {
		captureIndices: c.captureIndices,
		matchedRuleId: c.ruleId
	} : null;
}
function ft(e, t, n, r, i, a, o) {
	let s = Number.MAX_VALUE, c = null, l, u = 0, d = a.contentNameScopesList.getScopeNames();
	for (let a = 0, f = e.length; a < f; a++) {
		let f = e[a];
		if (!f.matcher(d)) continue;
		let { ruleScanner: p, findOptions: m } = pt(t.getRule(f.ruleId), t, null, r, i === o), h = p.findNextMatchSync(n, i, m);
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
function pt(e, t, n, r, i) {
	return {
		ruleScanner: e.compileAG(t, n, r, i),
		findOptions: 0
	};
}
function mt(e, t, n, r, i) {
	return {
		ruleScanner: e.compileWhileAG(t, n, r, i),
		findOptions: 0
	};
}
function ht(e, t, n, r, i, a, o) {
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
			ct(e, p, n && d.start === 0, d.start, f, i, !1, 0), Oe(p);
			continue;
		}
		let f = c.getName(s, o);
		if (f !== null) {
			let t = (l.length > 0 ? l[l.length - 1].scopes : r.contentNameScopesList).pushAttributed(f, e);
			l.push(new gt(t, d.end));
		}
	}
	for (; l.length > 0;) i.produceFromScopes(l[l.length - 1].scopes, l[l.length - 1].endPos), l.pop();
}
var gt = class {
	scopes;
	endPos;
	constructor(e, t) {
		this.scopes = e, this.endPos = t;
	}
};
function _t(e, t, n, r, i, a, o, s) {
	return new xt(e, t, n, r, i, a, o, s);
}
function vt(e, t, n, r, i) {
	let a = Te(t, yt), o = et.getCompiledRuleId(n, r, i.repository);
	for (let n of a) e.push({
		debugSelector: t,
		matcher: n.matcher,
		ruleId: o,
		grammar: i,
		priority: n.priority
	});
}
function yt(e, t) {
	if (t.length < e.length) return !1;
	let n = 0;
	return e.every((e) => {
		for (let r = n; r < t.length; r++) if (bt(t[r], e)) return n = r + 1, !0;
		return !1;
	});
}
function bt(e, t) {
	if (!e) return !1;
	if (e === t) return !0;
	let n = t.length;
	return e.length > n && e.substr(0, n) === t && e[n] === ".";
}
var xt = class {
	constructor(e, t, n, r, i, a, o, s) {
		if (this._rootScopeName = e, this.balancedBracketSelectors = a, this._onigLib = s, this._basicScopeAttributesProvider = new at(n, r), this._rootId = -1, this._lastRuleId = 0, this._ruleId2desc = [null], this._includedGrammars = {}, this._grammarRepository = o, this._grammar = St(t, null), this._injections = null, this._tokenTypeMatchers = [], i) for (let e of Object.keys(i)) {
			let t = Te(e, yt);
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
			if (e) for (let n in e) vt(t, n, e[n], this, r);
			let i = this._grammarRepository.injections(n);
			i && i.forEach((e) => {
				let n = this.getExternalGrammar(e);
				if (n) {
					let e = n.injectionSelector;
					e && vt(t, e, n, this, n);
				}
			});
		}
		return t.sort((e, t) => e.priority - t.priority), t;
	}
	getInjections() {
		return this._injections === null && (this._injections = this._collectInjections()), this._injections;
	}
	registerRule(e) {
		let t = ++this._lastRuleId, n = e(Ke(t));
		return this._ruleId2desc[t] = n, n;
	}
	getRule(e) {
		return this._ruleId2desc[qe(e)];
	}
	getExternalGrammar(e, t) {
		if (this._includedGrammars[e]) return this._includedGrammars[e];
		if (this._grammarRepository) {
			let n = this._grammarRepository.lookup(e);
			if (n) return this._includedGrammars[e] = St(n, t && t.$base), this._includedGrammars[e];
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
		this._rootId === -1 && (this._rootId = et.getCompiledRuleId(this._grammar.repository.$self, this, this._grammar.repository), this.getInjections());
		let i;
		if (!t || t === wt.NULL) {
			i = !0;
			let e = this._basicScopeAttributesProvider.getDefaultAttributes(), n = this.themeProvider.getDefaults(), r = y.set(0, e.languageId, e.tokenType, null, n.fontStyle, n.foregroundId, n.backgroundId), a = this.getRule(this._rootId).getName(null, null), o;
			o = a ? Ct.createRootAndLookUpScopeName(a, r, this) : Ct.createRoot("unknown", r), t = new wt(null, this._rootId, -1, -1, !1, null, o, o);
		} else i = !1, t.reset();
		e += "\n";
		let a = this.createOnigString(e), o = a.content.length, s = new Et(n, e, this._tokenTypeMatchers, this.balancedBracketSelectors), c = ct(this, a, i, 0, t, s, !0, r);
		return Oe(a), {
			lineLength: o,
			lineTokens: s,
			ruleStack: c.stack,
			stoppedEarly: c.stoppedEarly
		};
	}
};
function St(e, t) {
	return e = g(e), e.repository = e.repository || {}, e.repository.$self = {
		$vscodeTextmateLocation: e.$vscodeTextmateLocation,
		patterns: e.patterns,
		name: e.scopeName
	}, e.repository.$base = t || e.repository.$self, e;
}
var Ct = class e {
	constructor(e, t, n) {
		this.parent = e, this.scopePath = t, this.tokenAttributes = n;
	}
	parent;
	scopePath;
	tokenAttributes;
	static fromExtension(t, n) {
		let r = t, i = t?.scopePath ?? null;
		for (let t of n) i = fe.push(i, t.scopeNames), r = new e(r, i, t.encodedTokenAttributes);
		return r;
	}
	static createRoot(t, n) {
		return new e(null, new fe(null, t), n);
	}
	static createRootAndLookUpScopeName(t, n, r) {
		let i = r.getMetadataForScope(t), a = new fe(null, t), o = r.themeProvider.themeMatch(a), s = e.mergeAttributes(n, i, o);
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
		return n !== null && (r = n.fontStyle, i = n.foregroundId, a = n.backgroundId), y.set(e, t.languageId, t.tokenType, null, r, i, a);
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
}, wt = class e {
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
		return e === t ? !0 : this._structuralEquals(e, t) ? Ct.equals(e.contentNameScopesList, t.contentNameScopesList) : !1;
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
			ruleId: qe(this.ruleId),
			beginRuleCapturedEOL: this.beginRuleCapturedEOL,
			endRule: this.endRule,
			nameScopesList: this.nameScopesList?.getExtensionIfDefined(this.parent?.nameScopesList ?? null) ?? [],
			contentNameScopesList: this.contentNameScopesList?.getExtensionIfDefined(this.nameScopesList) ?? []
		};
	}
	static pushFrame(t, n) {
		let r = Ct.fromExtension(t?.nameScopesList ?? null, n.nameScopesList);
		return new e(t, Ke(n.ruleId), n.enterPos ?? -1, n.anchorPos ?? -1, n.beginRuleCapturedEOL, n.endRule, r, Ct.fromExtension(r, n.contentNameScopesList));
	}
}, Tt = class {
	balancedBracketScopes;
	unbalancedBracketScopes;
	allowAny = !1;
	constructor(e, t) {
		this.balancedBracketScopes = e.flatMap((e) => e === "*" ? (this.allowAny = !0, []) : Te(e, yt).map((e) => e.matcher)), this.unbalancedBracketScopes = t.flatMap((e) => Te(e, yt).map((e) => e.matcher));
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
}, Et = class {
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
				for (let e of this._tokenTypeOverrides) e.matcher(t) && (n = y.set(n, 0, Ce(e.type), null, -1, 0, 0));
				this.balancedBracketSelectors && (r = this.balancedBracketSelectors.match(t));
			}
			if (r && (n = y.set(n, 0, 8, r, -1, 0, 0)), this._binaryTokens.length > 0 && this._binaryTokens[this._binaryTokens.length - 1] === n) {
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
}, Dt = class {
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
			this._grammars.set(e, _t(e, a, t, n, r, i, this, this._onigLib));
		}
		return this._grammars.get(e);
	}
}, Ot = class {
	_options;
	_syncRegistry;
	_ensureGrammarCache;
	constructor(e) {
		this._options = e, this._syncRegistry = new Dt(de.createFromRawTheme(e.theme, e.colorMap), e.onigLib), this._ensureGrammarCache = /* @__PURE__ */ new Map();
	}
	dispose() {
		this._syncRegistry.dispose();
	}
	setTheme(e, t) {
		this._syncRegistry.setTheme(de.createFromRawTheme(e, t));
	}
	getColorMap() {
		return this._syncRegistry.getColorMap();
	}
	loadGrammarWithEmbeddedLanguages(e, t, n) {
		return this.loadGrammarWithConfiguration(e, t, { embeddedLanguages: n });
	}
	loadGrammarWithConfiguration(e, t, n) {
		return this._loadGrammar(e, t, n.embeddedLanguages, n.tokenTypes, new Tt(n.balancedBracketSelectors || [], n.unbalancedBracketSelectors || []));
	}
	loadGrammar(e) {
		return this._loadGrammar(e, 0, null, null, null);
	}
	_loadGrammar(e, t, n, r, i) {
		let a = new je(this._syncRegistry, e);
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
}, kt = wt.NULL, At = /["&'<>`]/g, jt = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g, Mt = /[\x01-\t\v\f\x0E-\x1F\x7F\x81\x8D\x8F\x90\x9D\xA0-\uFFFF]/g, Nt = /[|\\{}()[\]^$+*?.]/g, Pt = /* @__PURE__ */ new WeakMap();
function Ft(e, t) {
	return e = e.replace(t.subset ? It(t.subset) : At, r), t.subset || t.escapeOnly ? e : e.replace(jt, n).replace(Mt, r);
	function n(e, n, r) {
		return t.format((e.charCodeAt(0) - 55296) * 1024 + e.charCodeAt(1) - 56320 + 65536, r.charCodeAt(n + 2), t);
	}
	function r(e, n, r) {
		return t.format(e.charCodeAt(0), r.charCodeAt(n + 1), t);
	}
}
function It(e) {
	let t = Pt.get(e);
	return t || (t = Lt(e), Pt.set(e, t)), t;
}
function Lt(e) {
	let t = [], n = -1;
	for (; ++n < e.length;) t.push(e[n].replace(Nt, "\\$&"));
	return RegExp("(?:" + t.join("|") + ")", "g");
}
// node_modules/.pnpm/stringify-entities@4.0.4/node_modules/stringify-entities/lib/util/to-hexadecimal.js
var Rt = /[\dA-Fa-f]/;
function zt(e, t, n) {
	let r = "&#x" + e.toString(16).toUpperCase();
	return n && t && !Rt.test(String.fromCharCode(t)) ? r : r + ";";
}
// node_modules/.pnpm/stringify-entities@4.0.4/node_modules/stringify-entities/lib/util/to-decimal.js
var Bt = /\d/;
function Vt(e, t, n) {
	let r = "&#" + String(e);
	return n && t && !Bt.test(String.fromCharCode(t)) ? r : r + ";";
}
// node_modules/.pnpm/character-entities-legacy@3.0.0/node_modules/character-entities-legacy/index.js
var Ht = /* @__PURE__ */ "AElig.AMP.Aacute.Acirc.Agrave.Aring.Atilde.Auml.COPY.Ccedil.ETH.Eacute.Ecirc.Egrave.Euml.GT.Iacute.Icirc.Igrave.Iuml.LT.Ntilde.Oacute.Ocirc.Ograve.Oslash.Otilde.Ouml.QUOT.REG.THORN.Uacute.Ucirc.Ugrave.Uuml.Yacute.aacute.acirc.acute.aelig.agrave.amp.aring.atilde.auml.brvbar.ccedil.cedil.cent.copy.curren.deg.divide.eacute.ecirc.egrave.eth.euml.frac12.frac14.frac34.gt.iacute.icirc.iexcl.igrave.iquest.iuml.laquo.lt.macr.micro.middot.nbsp.not.ntilde.oacute.ocirc.ograve.ordf.ordm.oslash.otilde.ouml.para.plusmn.pound.quot.raquo.reg.sect.shy.sup1.sup2.sup3.szlig.thorn.times.uacute.ucirc.ugrave.uml.uuml.yacute.yen.yuml".split("."), Ut = {
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
}, Wt = [
	"cent",
	"copy",
	"divide",
	"gt",
	"lt",
	"not",
	"para",
	"times"
], Gt = {}.hasOwnProperty, Kt = {}, qt;
for (qt in Ut) Gt.call(Ut, qt) && (Kt[Ut[qt]] = qt);
var Jt = /[^\dA-Za-z]/;
function Yt(e, t, n, r) {
	let i = String.fromCharCode(e);
	if (Gt.call(Kt, i)) {
		let e = Kt[i], a = "&" + e;
		return n && Ht.includes(e) && !Wt.includes(e) && (!r || t && t !== 61 && Jt.test(String.fromCharCode(t))) ? a : a + ";";
	}
	return "";
}
// node_modules/.pnpm/stringify-entities@4.0.4/node_modules/stringify-entities/lib/util/format-smart.js
function Xt(e, t, n) {
	let r = zt(e, t, n.omitOptionalSemicolons), i;
	if ((n.useNamedReferences || n.useShortestReferences) && (i = Yt(e, t, n.omitOptionalSemicolons, n.attribute)), (n.useShortestReferences || !i) && n.useShortestReferences) {
		let i = Vt(e, t, n.omitOptionalSemicolons);
		i.length < r.length && (r = i);
	}
	return i && (!n.useShortestReferences || i.length < r.length) ? i : r;
}
// node_modules/.pnpm/stringify-entities@4.0.4/node_modules/stringify-entities/lib/index.js
function x(e, t) {
	return Ft(e, Object.assign({ format: Xt }, t));
}
// node_modules/.pnpm/hast-util-to-html@9.0.6/node_modules/hast-util-to-html/lib/handle/comment.js
var Zt = /^>|^->|<!--|-->|--!>|<!-$/g, Qt = [">"], $t = ["<", ">"];
function en(e, t, n, r) {
	return r.settings.bogusComments ? "<?" + x(e.value, Object.assign({}, r.settings.characterReferences, { subset: Qt })) + ">" : "<!--" + e.value.replace(Zt, i) + "-->";
	function i(e) {
		return x(e, Object.assign({}, r.settings.characterReferences, { subset: $t }));
	}
}
// node_modules/.pnpm/hast-util-to-html@9.0.6/node_modules/hast-util-to-html/lib/handle/doctype.js
function tn(e, t, n, r) {
	return "<!" + (r.settings.upperDoctype ? "DOCTYPE" : "doctype") + (r.settings.tightDoctype ? "" : " ") + "html>";
}
// node_modules/.pnpm/hast-util-to-html@9.0.6/node_modules/hast-util-to-html/lib/omission/util/siblings.js
var S = an(1), nn = an(-1), rn = [];
function an(e) {
	return t;
	function t(t, n, r) {
		let i = t ? t.children : rn, a = (n || 0) + e, o = i[a];
		if (!r) for (; o && l(o);) a += e, o = i[a];
		return o;
	}
}
// node_modules/.pnpm/hast-util-to-html@9.0.6/node_modules/hast-util-to-html/lib/omission/omission.js
var on = {}.hasOwnProperty;
function sn(e) {
	return t;
	function t(t, n, r) {
		return on.call(e, t.tagName) && e[t.tagName](t, n, r);
	}
}
// node_modules/.pnpm/hast-util-to-html@9.0.6/node_modules/hast-util-to-html/lib/omission/closing.js
var cn = sn({
	body: dn,
	caption: ln,
	colgroup: ln,
	dd: hn,
	dt: mn,
	head: ln,
	html: un,
	li: pn,
	optgroup: _n,
	option: vn,
	p: fn,
	rp: gn,
	rt: gn,
	tbody: bn,
	td: Cn,
	tfoot: xn,
	th: Cn,
	thead: yn,
	tr: Sn
});
function ln(e, t, n) {
	let r = S(n, t, !0);
	return !r || r.type !== "comment" && !(r.type === "text" && l(r.value.charAt(0)));
}
function un(e, t, n) {
	let r = S(n, t);
	return !r || r.type !== "comment";
}
function dn(e, t, n) {
	let r = S(n, t);
	return !r || r.type !== "comment";
}
function fn(e, t, n) {
	let r = S(n, t);
	return r ? r.type === "element" && (r.tagName === "address" || r.tagName === "article" || r.tagName === "aside" || r.tagName === "blockquote" || r.tagName === "details" || r.tagName === "div" || r.tagName === "dl" || r.tagName === "fieldset" || r.tagName === "figcaption" || r.tagName === "figure" || r.tagName === "footer" || r.tagName === "form" || r.tagName === "h1" || r.tagName === "h2" || r.tagName === "h3" || r.tagName === "h4" || r.tagName === "h5" || r.tagName === "h6" || r.tagName === "header" || r.tagName === "hgroup" || r.tagName === "hr" || r.tagName === "main" || r.tagName === "menu" || r.tagName === "nav" || r.tagName === "ol" || r.tagName === "p" || r.tagName === "pre" || r.tagName === "section" || r.tagName === "table" || r.tagName === "ul") : !n || n.type !== "element" || n.tagName !== "a" && n.tagName !== "audio" && n.tagName !== "del" && n.tagName !== "ins" && n.tagName !== "map" && n.tagName !== "noscript" && n.tagName !== "video" && !n.tagName.includes("-");
}
function pn(e, t, n) {
	let r = S(n, t);
	return !r || r.type === "element" && r.tagName === "li";
}
function mn(e, t, n) {
	let r = S(n, t);
	return !(!r || r.type !== "element" || r.tagName !== "dt" && r.tagName !== "dd");
}
function hn(e, t, n) {
	let r = S(n, t);
	return !r || r.type === "element" && (r.tagName === "dt" || r.tagName === "dd");
}
function gn(e, t, n) {
	let r = S(n, t);
	return !r || r.type === "element" && (r.tagName === "rp" || r.tagName === "rt");
}
function _n(e, t, n) {
	let r = S(n, t);
	return !r || r.type === "element" && r.tagName === "optgroup";
}
function vn(e, t, n) {
	let r = S(n, t);
	return !r || r.type === "element" && (r.tagName === "option" || r.tagName === "optgroup");
}
function yn(e, t, n) {
	let r = S(n, t);
	return !(!r || r.type !== "element" || r.tagName !== "tbody" && r.tagName !== "tfoot");
}
function bn(e, t, n) {
	let r = S(n, t);
	return !r || r.type === "element" && (r.tagName === "tbody" || r.tagName === "tfoot");
}
function xn(e, t, n) {
	return !S(n, t);
}
function Sn(e, t, n) {
	let r = S(n, t);
	return !r || r.type === "element" && r.tagName === "tr";
}
function Cn(e, t, n) {
	let r = S(n, t);
	return !r || r.type === "element" && (r.tagName === "td" || r.tagName === "th");
}
// node_modules/.pnpm/hast-util-to-html@9.0.6/node_modules/hast-util-to-html/lib/omission/opening.js
var wn = sn({
	body: Dn,
	colgroup: On,
	head: En,
	html: Tn,
	tbody: kn
});
function Tn(e) {
	let t = S(e, -1);
	return !t || t.type !== "comment";
}
function En(e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e.children) if (n.type === "element" && (n.tagName === "base" || n.tagName === "title")) {
		if (t.has(n.tagName)) return !1;
		t.add(n.tagName);
	}
	let n = e.children[0];
	return !n || n.type === "element";
}
function Dn(e) {
	let t = S(e, -1, !0);
	return !t || t.type !== "comment" && !(t.type === "text" && l(t.value.charAt(0))) && (t.type !== "element" || t.tagName !== "meta" && t.tagName !== "link" && t.tagName !== "script" && t.tagName !== "style" && t.tagName !== "template");
}
function On(e, t, n) {
	let r = nn(n, t);
	if (n && r && r.type === "element" && r.tagName === "colgroup" && cn(r, n.children.indexOf(r), n)) return !1;
	let i = S(e, -1, !0);
	return !!(i && i.type === "element" && i.tagName === "col");
}
function kn(e, t, n) {
	let r = nn(n, t);
	if (n && r && r.type === "element" && (r.tagName === "thead" || r.tagName === "tbody") && cn(r, n.children.indexOf(r), n)) return !1;
	let i = S(e, -1);
	return !!(i && i.type === "element" && i.tagName === "tr");
}
// node_modules/.pnpm/hast-util-to-html@9.0.6/node_modules/hast-util-to-html/lib/handle/element.js
var An = {
	name: [["	\n\f\r &/=>".split(""), "	\n\f\r \"&'/=>`".split("")], ["\0	\n\f\r \"&'/<=>".split(""), "\0	\n\f\r \"&'/<=>`".split("")]],
	unquoted: [["	\n\f\r &>".split(""), "\0	\n\f\r \"&'<=>`".split("")], ["\0	\n\f\r \"&'<=>`".split(""), "\0	\n\f\r \"&'<=>`".split("")]],
	single: [["&'".split(""), "\"&'`".split("")], ["\0&'".split(""), "\0\"&'`".split("")]],
	double: [["\"&".split(""), "\"&'`".split("")], ["\0\"&".split(""), "\0\"&'`".split("")]]
}, jn = /* @__PURE__ */ new Set([
	"desc",
	"foreignObject",
	"title"
]);
function Mn(e, t, n, r) {
	let { schema: i } = r, s = i.space !== "svg" && r.settings.omitOptionalTags, c = i.space === "svg" ? r.settings.closeEmptyElements : r.settings.voids.includes(e.tagName.toLowerCase()), l = [];
	i.space === "html" && e.tagName === "svg" && (r.schema = a);
	let u = Nn(r, e.properties);
	r.schema.space === "svg" && jn.has(e.tagName) && (r.schema = o);
	let d = r.all(i.space === "html" && e.tagName === "template" ? e.content : e);
	if (r.schema = i, d && (c = !1), u || !s || !wn(e, t, n)) {
		if (l.push("<", e.tagName, u ? " " + u : ""), c && (i.space === "svg" || r.settings.closeSelfClosing)) {
			let e = u.charAt(u.length - 1);
			(!r.settings.tightSelfClosing || e === "/" || e && e !== "\"" && e !== "'") && l.push(" "), l.push("/");
		}
		l.push(">");
	}
	return l.push(d), c || s && cn(e, t, n) || l.push("</" + e.tagName + ">"), l.join("");
}
function Nn(e, t) {
	let n = [], r = -1, i;
	if (t) {
		for (i in t) if (t[i] !== null && t[i] !== void 0) {
			let r = Pn(e, i, t[i]);
			r && n.push(r);
		}
	}
	for (; ++r < n.length;) {
		let t = e.settings.tightAttributes ? n[r].charAt(n[r].length - 1) : void 0;
		r !== n.length - 1 && t !== "\"" && t !== "'" && (n[r] += " ");
	}
	return n.join("");
}
function Pn(e, n, r) {
	let i = t(e.schema, n), a = e.settings.allowParseErrors && e.schema.space === "html" ? 0 : 1, o = +!e.settings.allowDangerousCharacters;
	if (i.overloadedBoolean && (r === i.attribute || r === "") ? r = !0 : (i.boolean || i.overloadedBoolean) && (typeof r != "string" || r === i.attribute || r === "") && (r = !!r), r == null || r === !1 || typeof r == "number" && Number.isNaN(r)) return "";
	let c = x(i.attribute, Object.assign({}, e.settings.characterReferences, { subset: An.name[a][o] }));
	if (r === !0 || (r = Array.isArray(r) ? (i.commaSeparated ? s : u)(r, { padLeft: !e.settings.tightCommaSeparatedLists }) : String(r), e.settings.collapseEmptyAttributes && !r)) return c;
	let l;
	if (e.settings.preferUnquoted && (l = x(r, Object.assign({}, e.settings.characterReferences, {
		attribute: !0,
		subset: An.unquoted[a][o]
	}))), l !== r) {
		let { quote: t } = e;
		e.settings.quoteSmart && f(r, t) > f(r, e.alternative) && (t = e.alternative), l = t + x(r, Object.assign({}, e.settings.characterReferences, {
			subset: (t === "'" ? An.single : An.double)[a][o],
			attribute: !0
		})) + t;
	}
	return c + (l && "=" + l);
}
// node_modules/.pnpm/hast-util-to-html@9.0.6/node_modules/hast-util-to-html/lib/handle/text.js
var Fn = ["<", "&"];
function In(e, t, n, r) {
	return n && n.type === "element" && (n.tagName === "script" || n.tagName === "style") ? e.value : x(e.value, Object.assign({}, r.settings.characterReferences, { subset: Fn }));
}
// node_modules/.pnpm/hast-util-to-html@9.0.6/node_modules/hast-util-to-html/lib/handle/raw.js
function Ln(e, t, n, r) {
	return r.settings.allowDangerousHtml ? e.value : In(e, t, n, r);
}
// node_modules/.pnpm/hast-util-to-html@9.0.6/node_modules/hast-util-to-html/lib/handle/root.js
function Rn(e, t, n, r) {
	return r.all(e);
}
// node_modules/.pnpm/hast-util-to-html@9.0.6/node_modules/hast-util-to-html/lib/handle/index.js
var zn = i("type", {
	invalid: Bn,
	unknown: Vn,
	handlers: {
		comment: en,
		doctype: tn,
		element: Mn,
		raw: Ln,
		root: Rn,
		text: In
	}
});
function Bn(e) {
	throw Error("Expected node, not `" + e + "`");
}
function Vn(e) {
	throw Error("Cannot compile unknown node `" + e.type + "`");
}
// node_modules/.pnpm/hast-util-to-html@9.0.6/node_modules/hast-util-to-html/lib/index.js
var Hn = {}, Un = {}, Wn = [];
function Gn(e, t) {
	let n = t || Hn, i = n.quote || "\"";
	if (i !== "\"" && i !== "'") throw Error("Invalid quote `" + i + "`, expected `'` or `\"`");
	let s = i === "\"" ? "'" : "\"";
	return {
		one: Kn,
		all: qn,
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
			voids: n.voids || r,
			characterReferences: n.characterReferences || Un,
			closeSelfClosing: n.closeSelfClosing || !1,
			closeEmptyElements: n.closeEmptyElements || !1
		},
		schema: n.space === "svg" ? a : o,
		quote: i,
		alternative: s
	}.one(Array.isArray(e) ? {
		type: "root",
		children: e
	} : e, void 0, void 0);
}
function Kn(e, t, n) {
	return zn(e, t, n, this);
}
function qn(e) {
	let t = [], n = e && e.children || Wn, r = -1;
	for (; ++r < n.length;) t[r] = this.one(n[r], r, e);
	return t.join("");
}
// node_modules/.pnpm/@shikijs+core@3.23.0/node_modules/@shikijs/core/dist/index.mjs
function Jn(e, t) {
	let n = typeof e == "string" ? {} : { ...e.colorReplacements }, r = typeof e == "string" ? e : e.name;
	for (let [e, i] of Object.entries(t?.colorReplacements || {})) typeof i == "string" ? n[e] = i : e === r && Object.assign(n, i);
	return n;
}
function C(e, t) {
	return e && (t?.[e?.toLowerCase()] || e);
}
function Yn(e) {
	return Array.isArray(e) ? e : [e];
}
async function Xn(e) {
	return Promise.resolve(typeof e == "function" ? e() : e).then((e) => e.default || e);
}
function Zn(e) {
	return !e || [
		"plaintext",
		"txt",
		"text",
		"plain"
	].includes(e);
}
function Qn(e) {
	return e === "ansi" || Zn(e);
}
function $n(e) {
	return e === "none";
}
function er(e) {
	return $n(e);
}
function tr(e, t) {
	if (!t) return e;
	e.properties ||= {}, e.properties.class ||= [], typeof e.properties.class == "string" && (e.properties.class = e.properties.class.split(/\s+/g)), Array.isArray(e.properties.class) || (e.properties.class = []);
	let n = Array.isArray(t) ? t : t.split(/\s+/g);
	for (let t of n) t && !e.properties.class.includes(t) && e.properties.class.push(t);
	return e;
}
function nr(e, t = !1) {
	if (e.length === 0) return [["", 0]];
	let n = e.split(/(\r?\n)/g), r = 0, i = [];
	for (let e = 0; e < n.length; e += 2) {
		let a = t ? n[e] + (n[e + 1] || "") : n[e];
		i.push([a, r]), r += n[e].length, r += n[e + 1]?.length || 0;
	}
	return i;
}
function rr(e) {
	let t = nr(e, !0).map(([e]) => e);
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
function ir(e, t, n) {
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
var ar = "light-dark()", or = ["color", "background-color"];
function sr(e, t) {
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
function cr(e, t) {
	let n = Array.from(t instanceof Set ? t : new Set(t)).sort((e, t) => e - t);
	return n.length ? e.map((e) => e.flatMap((e) => {
		let t = n.filter((t) => e.offset < t && t < e.offset + e.content.length).map((t) => t - e.offset).sort((e, t) => e - t);
		return t.length ? sr(e, t) : e;
	})) : e;
}
function lr(e, t, n, r, i = "css-vars") {
	let a = {
		content: e.content,
		explanation: e.explanation,
		offset: e.offset
	}, o = t.map((t) => ur(e.variants[t])), s = new Set(o.flatMap((e) => Object.keys(e))), c = {}, l = (e, r) => {
		let i = r === "color" ? "" : r === "background-color" ? "-bg" : `-${r}`;
		return n + t[e] + (r === "color" ? "" : i);
	};
	return o.forEach((e, n) => {
		for (let a of s) {
			let s = e[a] || "inherit";
			if (n === 0 && r && or.includes(a)) {
				if (r === ar && o.length > 1) {
					let e = t.findIndex((e) => e === "light"), r = t.findIndex((e) => e === "dark");
					if (e === -1 || r === -1) throw new h("When using `defaultColor: \"light-dark()\"`, you must provide both `light` and `dark` themes");
					let u = o[e][a] || "inherit", d = o[r][a] || "inherit";
					c[a] = `light-dark(${u}, ${d})`, i === "css-vars" && (c[l(n, a)] = s);
				} else c[a] = s;
			} else i === "css-vars" && (c[l(n, a)] = s);
		}
	}), a.htmlStyle = c, a;
}
function ur(e) {
	let t = {};
	if (e.color && (t.color = e.color), e.bgColor && (t["background-color"] = e.bgColor), e.fontStyle) {
		e.fontStyle & v.Italic && (t["font-style"] = "italic"), e.fontStyle & v.Bold && (t["font-weight"] = "bold");
		let n = [];
		e.fontStyle & v.Underline && n.push("underline"), e.fontStyle & v.Strikethrough && n.push("line-through"), n.length && (t["text-decoration"] = n.join(" "));
	}
	return t;
}
function dr(e) {
	return typeof e == "string" ? e : Object.entries(e).map(([e, t]) => `${e}:${t}`).join(";");
}
var fr = /* @__PURE__ */ new WeakMap();
function pr(e, t) {
	fr.set(e, t);
}
function mr(e) {
	return fr.get(e);
}
var hr = class e {
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
		return new e(Object.fromEntries(Yn(n).map((e) => [e, kt])), t);
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
		return gr(this._stacks[e]);
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
function gr(e) {
	let t = [], n = /* @__PURE__ */ new Set();
	function r(e) {
		if (n.has(e)) return;
		n.add(e);
		let i = e?.nameScopesList?.scopeName;
		i && t.push(i), e.parent && r(e.parent);
	}
	return r(e), t;
}
function _r(e, t) {
	if (!(e instanceof hr)) throw new h("Invalid grammar state");
	return e.getInternalStack(t);
}
function vr() {
	let e = /* @__PURE__ */ new WeakMap();
	function t(t) {
		if (!e.has(t.meta)) {
			let n = function(e) {
				if (typeof e == "number") {
					if (e < 0 || e > t.source.length) throw new h(`Invalid decoration offset: ${e}. Code length: ${t.source.length}`);
					return {
						...r.indexToPos(e),
						offset: e
					};
				}
				{
					let t = r.lines[e.line];
					if (t === void 0) throw new h(`Invalid decoration position ${JSON.stringify(e)}. Lines length: ${r.lines.length}`);
					let n = e.character;
					if (n < 0 && (n = t.length + n), n < 0 || n > t.length) throw new h(`Invalid decoration position ${JSON.stringify(e)}. Line ${e.line} length: ${t.length}`);
					return {
						...e,
						character: n,
						offset: r.posToIndex(e.line, n)
					};
				}
			}, r = rr(t.source), i = (t.options.decorations || []).map((e) => ({
				...e,
				start: n(e.start),
				end: n(e.end)
			}));
			yr(i), e.set(t.meta, {
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
			if (this.options.decorations?.length) return cr(e, t(this).decorations.flatMap((e) => [e.start.offset, e.end.offset]));
		},
		code(e) {
			if (!this.options.decorations?.length) return;
			let n = t(this), r = Array.from(e.children).filter((e) => e.type === "element" && e.tagName === "span");
			if (r.length !== n.converter.lines.length) throw new h(`Number of lines in code element (${r.length}) does not match the number of lines in the source (${n.converter.lines.length}). Failed to apply decorations.`);
			function i(e, t, n, i) {
				let a = r[e], s = "", c = -1, l = -1;
				if (t === 0 && (c = 0), n === 0 && (l = 0), n === Infinity && (l = a.children.length), c === -1 || l === -1) for (let e = 0; e < a.children.length; e++) s += br(a.children[e]), c === -1 && s.length === t && (c = e + 1), l === -1 && s.length === n && (l = e + 1);
				if (c === -1) throw new h(`Failed to find start index for decoration ${JSON.stringify(i.start)}`);
				if (l === -1) throw new h(`Failed to find end index for decoration ${JSON.stringify(i.end)}`);
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
				}, t.properties?.class && tr(e, t.properties.class), e = i(e, n) || e, e;
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
function yr(e) {
	for (let t = 0; t < e.length; t++) {
		let n = e[t];
		if (n.start.offset > n.end.offset) throw new h(`Invalid decoration range: ${JSON.stringify(n.start)} - ${JSON.stringify(n.end)}`);
		for (let r = t + 1; r < e.length; r++) {
			let t = e[r], i = n.start.offset <= t.start.offset && t.start.offset < n.end.offset, a = n.start.offset < t.end.offset && t.end.offset <= n.end.offset, o = t.start.offset <= n.start.offset && n.start.offset < t.end.offset, s = t.start.offset < n.end.offset && n.end.offset <= t.end.offset;
			if (i || a || o || s) {
				if (i && a || o && s || o && n.start.offset === n.end.offset || a && t.start.offset === t.end.offset) continue;
				throw new h(`Decorations ${JSON.stringify(n.start)} and ${JSON.stringify(t.start)} intersect.`);
			}
		}
	}
}
function br(e) {
	return e.type === "text" ? e.value : e.type === "element" ? e.children.map(br).join("") : "";
}
var xr = [/* @__PURE__ */ vr()];
function Sr(e) {
	let t = Cr(e.transformers || []);
	return [
		...t.pre,
		...t.normal,
		...t.post,
		...xr
	];
}
function Cr(e) {
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
var w = [
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
], wr = {
	1: "bold",
	2: "dim",
	3: "italic",
	4: "underline",
	7: "reverse",
	8: "hidden",
	9: "strikethrough"
};
function Tr(e, t) {
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
function Er(e) {
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
function Dr(e) {
	let t = [];
	for (; e.length > 0;) {
		let n = e.shift();
		if (!n) continue;
		let r = Number.parseInt(n);
		if (!Number.isNaN(r)) {
			if (r === 0) t.push({ type: "resetAll" });
			else if (r <= 9) wr[r] && t.push({
				type: "setDecoration",
				value: wr[r]
			});
			else if (r <= 29) {
				let e = wr[r - 20];
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
					name: w[r - 30]
				}
			});
			else if (r === 38) {
				let n = Er(e);
				n && t.push({
					type: "setForegroundColor",
					value: n
				});
			} else if (r === 39) t.push({ type: "resetForegroundColor" });
			else if (r <= 47) t.push({
				type: "setBackgroundColor",
				value: {
					type: "named",
					name: w[r - 40]
				}
			});
			else if (r === 48) {
				let n = Er(e);
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
					name: w[r - 90 + 8]
				}
			}) : r >= 100 && r <= 107 && t.push({
				type: "setBackgroundColor",
				value: {
					type: "named",
					name: w[r - 100 + 8]
				}
			});
		}
	}
	return t;
}
function Or() {
	let e = null, t = null, n = /* @__PURE__ */ new Set();
	return { parse(r) {
		let i = [], a = 0;
		do {
			let o = Tr(r, a), s = o.sequence ? r.substring(a, o.startPosition) : r.substring(a);
			if (s.length > 0 && i.push({
				value: s,
				foreground: e,
				background: t,
				decorations: new Set(n)
			}), o.sequence) {
				let r = Dr(o.sequence);
				for (let i of r) i.type === "resetAll" ? (e = null, t = null, n.clear()) : i.type === "resetForegroundColor" ? e = null : i.type === "resetBackgroundColor" ? t = null : i.type === "resetDecoration" && n.delete(i.value);
				for (let i of r) i.type === "setForegroundColor" ? e = i.value : i.type === "setBackgroundColor" ? t = i.value : i.type === "setDecoration" && n.add(i.value);
			}
			a = o.position;
		} while (a < r.length);
		return i;
	} };
}
var kr = {
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
function Ar(e = kr) {
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
		for (let e = 0; e < w.length; e++) r.push(t(w[e]));
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
var jr = {
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
function Mr(e, t, n) {
	let r = Jn(e, n), i = nr(t), a = Ar(Object.fromEntries(w.map((t) => {
		let n = `terminal.ansi${t[0].toUpperCase()}${t.substring(1)}`;
		return [t, e.colors?.[n] || jr[t]];
	}))), o = Or();
	return i.map((t) => o.parse(t[0]).map((n) => {
		let i, o;
		n.decorations.has("reverse") ? (i = n.background ? a.value(n.background) : e.bg, o = n.foreground ? a.value(n.foreground) : e.fg) : (i = n.foreground ? a.value(n.foreground) : e.fg, o = n.background ? a.value(n.background) : void 0), i = C(i, r), o = C(o, r), n.decorations.has("dim") && (i = Nr(i));
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
function Nr(e) {
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
function Pr(e, t, n = {}) {
	let { theme: r = e.getLoadedThemes()[0] } = n, i = e.resolveLangAlias(n.lang || "text");
	if (Zn(i) || $n(r)) return nr(t).map((e) => [{
		content: e[0],
		offset: e[1]
	}]);
	let { theme: a, colorMap: o } = e.setTheme(r);
	if (i === "ansi") return Mr(a, t, n);
	let s = e.getLanguage(n.lang || "text");
	if (n.grammarState) {
		if (n.grammarState.lang !== s.name) throw new h(`Grammar state language "${n.grammarState.lang}" does not match highlight language "${s.name}"`);
		if (!n.grammarState.themes.includes(a.name)) throw new h(`Grammar state themes "${n.grammarState.themes}" do not contain highlight theme "${a.name}"`);
	}
	return Ir(t, s, a, o, n);
}
function Fr(...e) {
	if (e.length === 2) return mr(e[1]);
	let [t, n, r = {}] = e, { lang: i = "text", theme: a = t.getLoadedThemes()[0] } = r;
	if (Zn(i) || $n(a)) throw new h("Plain language does not have grammar state");
	if (i === "ansi") throw new h("ANSI language does not have grammar state");
	let { theme: o, colorMap: s } = t.setTheme(a), c = t.getLanguage(i);
	return new hr(Lr(n, c, o, s, r).stateStack, c.name, o.name);
}
function Ir(e, t, n, r, i) {
	let a = Lr(e, t, n, r, i), o = new hr(a.stateStack, t.name, n.name);
	return pr(a.tokens, o), a.tokens;
}
function Lr(e, t, n, r, i) {
	let a = Jn(n, i), { tokenizeMaxLineLength: o = 0, tokenizeTimeLimit: s = 500 } = i, c = nr(e), l = i.grammarState ? _r(i.grammarState, n.name) ?? kt : i.grammarContextCode == null ? kt : Lr(i.grammarContextCode, t, n, r, {
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
			let s = _.tokens[2 * e + 1], c = C(r[y.getForeground(s)], a), l = y.getFontStyle(s), d = {
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
						scopes: i.includeExplanation === "scopeName" ? Rr(t.scopes) : zr(e, t.scopes)
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
function Rr(e) {
	return e.map((e) => ({ scopeName: e }));
}
function zr(e, t) {
	let n = [];
	for (let r = 0, i = t.length; r < i; r++) {
		let i = t[r];
		n[r] = {
			scopeName: i,
			themeMatches: Hr(e, i, t.slice(0, r))
		};
	}
	return n;
}
function Br(e, t) {
	return e === t || t.substring(0, e.length) === e && t[e.length] === ".";
}
function Vr(e, t, n) {
	if (!Br(e[e.length - 1], t)) return !1;
	let r = e.length - 2, i = n.length - 1;
	for (; r >= 0 && i >= 0;) Br(e[r], n[i]) && --r, --i;
	return r === -1;
}
function Hr(e, t, n) {
	let r = [];
	for (let { selectors: i, settings: a } of e) for (let e of i) if (Vr(e, t, n)) {
		r.push(a);
		break;
	}
	return r;
}
function Ur(e, t, n) {
	let r = Object.entries(n.themes).filter((e) => e[1]).map((e) => ({
		color: e[0],
		theme: e[1]
	})), i = r.map((r) => {
		let i = Pr(e, t, {
			...n,
			theme: r.theme
		});
		return {
			tokens: i,
			state: mr(i),
			theme: typeof r.theme == "string" ? r.theme : r.theme.name
		};
	}), a = Wr(...i.map((e) => e.tokens)), o = a[0].map((e, t) => e.map((e, i) => {
		let o = {
			content: e.content,
			variants: {},
			offset: e.offset
		};
		return "includeExplanation" in n && n.includeExplanation && (o.explanation = e.explanation), a.forEach((e, n) => {
			let { content: a, explanation: s, offset: c, ...l } = e[t][i];
			o.variants[r[n].color] = l;
		}), o;
	})), s = i[0].state ? new hr(Object.fromEntries(i.map((e) => [e.theme, e.state?.getInternalStack(e.theme)])), i[0].state.lang) : void 0;
	return s && pr(o, s), o;
}
function Wr(...e) {
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
function Gr(e, t, n) {
	let r, i, a, o, s, c;
	if ("themes" in n) {
		let { defaultColor: l = "light", cssVariablePrefix: u = "--shiki-", colorsRendering: d = "css-vars" } = n, f = Object.entries(n.themes).filter((e) => e[1]).map((e) => ({
			color: e[0],
			theme: e[1]
		})).sort((e, t) => e.color === l ? -1 : +(t.color === l));
		if (f.length === 0) throw new h("`themes` option must not be empty");
		let p = Ur(e, t, n);
		if (c = mr(p), l && ar !== l && !f.find((e) => e.color === l)) throw new h(`\`themes\` option must contain the defaultColor key \`${l}\``);
		let m = f.map((t) => e.getTheme(t.theme)), g = f.map((e) => e.color);
		a = p.map((e) => e.map((e) => lr(e, g, u, l, d))), c && pr(a, c);
		let _ = f.map((e) => Jn(e.theme, n));
		i = Kr(f, m, _, u, l, "fg", d), r = Kr(f, m, _, u, l, "bg", d), o = `shiki-themes ${m.map((e) => e.name).join(" ")}`, s = l ? void 0 : [i, r].join(";");
	} else if ("theme" in n) {
		let s = Jn(n.theme, n);
		a = Pr(e, t, n);
		let l = e.getTheme(n.theme);
		r = C(l.bg, s), i = C(l.fg, s), o = l.name, c = mr(a);
	} else throw new h("Invalid options, either `theme` or `themes` must be provided");
	return {
		tokens: a,
		fg: i,
		bg: r,
		themeName: o,
		rootStyle: s,
		grammarState: c
	};
}
function Kr(e, t, n, r, i, a, o) {
	return e.map((s, c) => {
		let l = C(t[c][a], n[c]) || "inherit", u = `${r + s.color}${a === "bg" ? "-bg" : ""}:${l}`;
		if (c === 0 && i) {
			if (i === ar && e.length > 1) {
				let r = e.findIndex((e) => e.color === "light"), i = e.findIndex((e) => e.color === "dark");
				if (r === -1 || i === -1) throw new h("When using `defaultColor: \"light-dark()\"`, you must provide both `light` and `dark` themes");
				return `light-dark(${C(t[r][a], n[r]) || "inherit"}, ${C(t[i][a], n[i]) || "inherit"});${u}`;
			}
			return l;
		}
		return o === "css-vars" ? u : null;
	}).filter((e) => !!e).join(";");
}
function qr(e, t, n, r = {
	meta: {},
	options: n,
	codeToHast: (t, n) => qr(e, t, n),
	codeToTokens: (t, n) => Gr(e, t, n)
}) {
	let i = t;
	for (let e of Sr(n)) i = e.preprocess?.call(r, i, n) || i;
	let { tokens: a, fg: o, bg: s, themeName: c, rootStyle: l, grammarState: u } = Gr(e, i, n), { mergeWhitespaces: d = !0, mergeSameStyleTokens: f = !1 } = n;
	d === !0 ? a = Yr(a) : d === "never" && (a = Xr(a)), f && (a = Zr(a));
	let p = {
		...r,
		get source() {
			return i;
		}
	};
	for (let e of Sr(n)) a = e.tokens?.call(p, a) || a;
	return Jr(a, {
		...n,
		fg: o,
		bg: s,
		themeName: c,
		rootStyle: n.rootStyle === !1 ? !1 : n.rootStyle ?? l
	}, p, u);
}
function Jr(e, t, n, r = mr(e)) {
	let i = Sr(t), a = [], o = {
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
		addClassToHast: tr,
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
			}, c = dr(a.htmlStyle || ur(a));
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
	return r && pr(m, r), m;
}
function Yr(e) {
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
function Xr(e) {
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
function Zr(e) {
	return e.map((e) => {
		let t = [];
		for (let n of e) {
			if (t.length === 0) {
				t.push({ ...n });
				continue;
			}
			let e = t[t.length - 1], r = dr(e.htmlStyle || ur(e)), i = dr(n.htmlStyle || ur(n)), a = e.fontStyle && (e.fontStyle & v.Underline || e.fontStyle & v.Strikethrough), o = n.fontStyle && (n.fontStyle & v.Underline || n.fontStyle & v.Strikethrough);
			!a && !o && r === i ? e.content += n.content : t.push({ ...n });
		}
		return t;
	});
}
var Qr = Gn;
function $r(e, t, n) {
	let r = {
		meta: {},
		options: n,
		codeToHast: (t, n) => qr(e, t, n),
		codeToTokens: (t, n) => Gr(e, t, n)
	}, i = Qr(qr(e, t, n, r));
	for (let e of Sr(n)) i = e.postprocess?.call(r, i, n) || i;
	return i;
}
var ei = {
	light: "#333333",
	dark: "#bbbbbb"
}, ti = {
	light: "#fffffe",
	dark: "#1e1e1e"
}, ni = "__shiki_resolved";
function ri(e) {
	if (e?.[ni]) return e;
	let t = { ...e };
	t.tokenColors && !t.settings && (t.settings = t.tokenColors, delete t.tokenColors), t.type ||= "dark", t.colorReplacements = { ...t.colorReplacements }, t.settings ||= [];
	let { bg: n, fg: r } = t;
	if (!n || !r) {
		let e = t.settings ? t.settings.find((e) => !e.name && !e.scope) : void 0;
		e?.settings?.foreground && (r = e.settings.foreground), e?.settings?.background && (n = e.settings.background), !r && t?.colors?.["editor.foreground"] && (r = t.colors["editor.foreground"]), !n && t?.colors?.["editor.background"] && (n = t.colors["editor.background"]), r ||= t.type === "light" ? ei.light : ei.dark, n ||= t.type === "light" ? ti.light : ti.dark, t.fg = r, t.bg = n;
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
	return Object.defineProperty(t, ni, {
		enumerable: !1,
		writable: !1,
		value: !0
	}), t;
}
async function ii(e) {
	return Array.from(new Set((await Promise.all(e.filter((e) => !Qn(e)).map(async (e) => await Xn(e).then((e) => Array.isArray(e) ? e : [e])))).flat()));
}
async function ai(e) {
	return (await Promise.all(e.map(async (e) => er(e) ? null : ri(await Xn(e))))).filter((e) => !!e);
}
var oi = 3;
function si(e, t = 3) {
	oi && (typeof oi == "number" && t > oi || console.trace(`[SHIKI DEPRECATE]: ${e}`));
}
var T = class extends Error {
	constructor(e) {
		super(e), this.name = "ShikiError";
	}
};
function ci(e, t) {
	if (!t) return e;
	if (t[e]) {
		let n = /* @__PURE__ */ new Set([e]);
		for (; t[e];) {
			if (e = t[e], n.has(e)) throw new T(`Circular alias \`${Array.from(n).join(" -> ")} -> ${e}\``);
			n.add(e);
		}
	}
	return e;
}
var li = class extends Ot {
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
		let t = ri(e);
		return t.name && (this._resolvedThemes.set(t.name, t), this._loadedThemesCache = null), t;
	}
	getLoadedThemes() {
		return this._loadedThemesCache ||= [...this._resolvedThemes.keys()], this._loadedThemesCache;
	}
	setTheme(e) {
		let t = this._textmateThemeCache.get(e);
		t || (t = de.createFromRawTheme(e), this._textmateThemeCache.set(e, t)), this._syncRegistry.setTheme(t);
	}
	getGrammar(e) {
		return e = ci(e, this._alias), this._resolvedGrammars.get(e);
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
			throw new T(`Missing languages ${n.map(([e]) => `\`${e}\``).join(", ")}, required by ${e.map(([e]) => `\`${e}\``).join(", ")}`);
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
}, ui = class {
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
}, di = 0;
function fi(e) {
	di += 1, e.warnings !== !1 && di >= 10 && di % 10 == 0 && console.warn(`[Shiki] ${di} instances have been created. Shiki is supposed to be used as a singleton, consider refactoring your code to cache your highlighter instance; Or call \`highlighter.dispose()\` to release unused instances.`);
	let t = !1;
	if (!e.engine) throw new T("`engine` option is required for synchronous mode");
	let n = (e.langs || []).flat(1), r = (e.themes || []).flat(1).map(ri), i = new li(new ui(e.engine, n), r, n, e.langAlias), a;
	function o(t) {
		return ci(t, e.langAlias);
	}
	function s(e) {
		g();
		let t = i.getGrammar(typeof e == "string" ? e : e.name);
		if (!t) throw new T(`Language \`${e}\` not found, you may need to load it first`);
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
		if (!t) throw new T(`Theme \`${e}\` not found, you may need to load it first`);
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
		return f(await ii(e));
	}
	function m(...e) {
		g();
		for (let t of e.flat(1)) i.loadTheme(t);
	}
	async function h(...e) {
		return g(), m(await ai(e));
	}
	function g() {
		if (t) throw new T("Shiki instance has been disposed");
	}
	function _() {
		t || (t = !0, i.dispose(), --di);
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
async function pi(e) {
	e.engine || si("`engine` option is required. Use `createOnigurumaEngine` or `createJavaScriptRegexEngine` to create an engine.");
	let [t, n, r] = await Promise.all([
		ai(e.themes || []),
		ii(e.langs || []),
		e.engine
	]);
	return fi({
		...e,
		themes: t,
		langs: n,
		engine: r
	});
}
async function mi(e) {
	let t = await pi(e);
	return {
		getLastGrammarState: (...e) => Fr(t, ...e),
		codeToTokensBase: (e, n) => Pr(t, e, n),
		codeToTokensWithThemes: (e, n) => Ur(t, e, n),
		codeToTokens: (e, n) => Gr(t, e, n),
		codeToHast: (e, n) => qr(t, e, n),
		codeToHtml: (e, n) => $r(t, e, n),
		getBundledLanguages: () => ({}),
		getBundledThemes: () => ({}),
		...t,
		getInternalContext: () => t
	};
}
function hi(e) {
	let t = e.langs, n = e.themes, r = e.engine;
	async function i(e) {
		function i(n) {
			if (typeof n == "string") {
				if (n = e.langAlias?.[n] || n, Qn(n)) return [];
				let r = t[n];
				if (!r) throw new h(`Language \`${n}\` is not included in this bundle. You may want to load it from external source.`);
				return r;
			}
			return n;
		}
		function a(e) {
			if (er(e)) return "none";
			if (typeof e == "string") {
				let t = n[e];
				if (!t) throw new h(`Theme \`${e}\` is not included in this bundle. You may want to load it from external source.`);
				return t;
			}
			return e;
		}
		let o = (e.themes ?? []).map((e) => a(e)), s = (e.langs ?? []).map((e) => i(e)), c = await mi({
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
function gi(e) {
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
function _i(e, t) {
	let n = gi(e);
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
// node_modules/.pnpm/shiki@3.23.0/node_modules/shiki/dist/langs.mjs
var vi = [
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
		import: (() => import("./angular-html-mkLD3t4_.js").then((e) => e.n))
	},
	{
		id: "angular-ts",
		name: "Angular TypeScript",
		import: (() => import("./angular-ts-CWdZLVFg.js"))
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
		import: (() => import("./apl-BbbgZyin.js"))
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
		import: (() => import("./astro-C0ToQTX6.js"))
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
		import: (() => import("./blade-Bce5rHeT.js"))
	},
	{
		id: "bsl",
		name: "1C (Enterprise)",
		aliases: ["1c"],
		import: (() => import("./bsl-B1VKzwRG.js"))
	},
	{
		id: "c",
		name: "C",
		import: (() => import("./c-CHMAN1uF.js").then((e) => e.n))
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
		import: (() => import("./cairo-_cM_EQ18.js"))
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
		import: (() => import("./cobol-BlBh1Wvl.js"))
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
		import: (() => import("./coffee-DroObIZy.js"))
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
		import: (() => import("./cpp-vb6xO3yH.js").then((e) => e.n))
	},
	{
		id: "crystal",
		name: "Crystal",
		import: (() => import("./crystal-1WKBY-4N.js"))
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
		import: (() => import("./css-BQO8xXH3.js").then((e) => e.n))
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
		import: (() => import("./edge-DOHUgoUk.js"))
	},
	{
		id: "elixir",
		name: "Elixir",
		import: (() => import("./elixir-D_4n46KU.js"))
	},
	{
		id: "elm",
		name: "Elm",
		import: (() => import("./elm-BFnFo3F0.js"))
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
		import: (() => import("./erb-C6Zpz86k.js"))
	},
	{
		id: "erlang",
		name: "Erlang",
		aliases: ["erl"],
		import: (() => import("./erlang-fjaia8sX.js"))
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
		import: (() => import("./fortran-fixed-form-BxCRvas6.js"))
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
		import: (() => import("./fsharp-D3xnRMaM.js"))
	},
	{
		id: "gdresource",
		name: "GDResource",
		aliases: ["tscn", "tres"],
		import: (() => import("./gdresource-4A9shZ4U.js"))
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
		import: (() => import("./git-commit-ZS4AnPf4.js"))
	},
	{
		id: "git-rebase",
		name: "Git Rebase Message",
		import: (() => import("./git-rebase-XOAFFbYh.js"))
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
		import: (() => import("./glimmer-js-FRhO28b0.js"))
	},
	{
		id: "glimmer-ts",
		name: "Glimmer TS",
		aliases: ["gts"],
		import: (() => import("./glimmer-ts-VlGDq4su.js"))
	},
	{
		id: "glsl",
		name: "GLSL",
		import: (() => import("./glsl-17-TqV0K.js").then((e) => e.n))
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
		import: (() => import("./graphql-BLHxJDzp.js").then((e) => e.n))
	},
	{
		id: "groovy",
		name: "Groovy",
		import: (() => import("./groovy-DNa91fQJ.js"))
	},
	{
		id: "hack",
		name: "Hack",
		import: (() => import("./hack-BWtIJXo5.js"))
	},
	{
		id: "haml",
		name: "Ruby Haml",
		import: (() => import("./haml-CWifJ9Gk.js").then((e) => e.n))
	},
	{
		id: "handlebars",
		name: "Handlebars",
		aliases: ["hbs"],
		import: (() => import("./handlebars-DqbWzTzC.js"))
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
		import: (() => import("./html-C4Qpc_w2.js").then((e) => e.n))
	},
	{
		id: "html-derivative",
		name: "HTML (Derivative)",
		import: (() => import("./html-derivative-B72IVGnw.js"))
	},
	{
		id: "http",
		name: "HTTP",
		import: (() => import("./http-CknBWzct.js"))
	},
	{
		id: "hurl",
		name: "Hurl",
		import: (() => import("./hurl-DBmIvQuX.js"))
	},
	{
		id: "hxml",
		name: "HXML",
		import: (() => import("./hxml-DDz24_Pg.js"))
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
		import: (() => import("./java-CTjZe8gi.js").then((e) => e.n))
	},
	{
		id: "javascript",
		name: "JavaScript",
		aliases: [
			"js",
			"cjs",
			"mjs"
		],
		import: (() => import("./javascript-B0-Ruq8d.js").then((e) => e.n))
	},
	{
		id: "jinja",
		name: "Jinja",
		import: (() => import("./jinja-Cgsk_wXj.js"))
	},
	{
		id: "jison",
		name: "Jison",
		import: (() => import("./jison-DyuE_fnT.js"))
	},
	{
		id: "json",
		name: "JSON",
		import: (() => import("./json-Rtc93kU_.js").then((e) => e.n))
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
		import: (() => import("./jsx-DvnxHA5R.js").then((e) => e.n))
	},
	{
		id: "julia",
		name: "Julia",
		aliases: ["jl"],
		import: (() => import("./julia-DkXfRSKo.js"))
	},
	{
		id: "just",
		name: "Just",
		import: (() => import("./just-DhjtdKaX.js"))
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
		import: (() => import("./latex-DKpOO9Xs.js"))
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
		import: (() => import("./liquid-C7KaUGeW.js"))
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
		import: (() => import("./lua-DKy3PCBD.js").then((e) => e.n))
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
		import: (() => import("./marko-CJZs1Ab2.js"))
	},
	{
		id: "matlab",
		name: "MATLAB",
		import: (() => import("./matlab-Dn3Clolk.js"))
	},
	{
		id: "mdc",
		name: "MDC",
		import: (() => import("./mdc-CkoLko1Q.js"))
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
		import: (() => import("./nextflow-DcmR3GYc.js"))
	},
	{
		id: "nextflow-groovy",
		name: "nextflow-groovy",
		import: (() => import("./nextflow-groovy-C_N4xbdj.js"))
	},
	{
		id: "nginx",
		name: "Nginx",
		import: (() => import("./nginx-BpWn4vZe.js"))
	},
	{
		id: "nim",
		name: "Nim",
		import: (() => import("./nim-RNGNbr0z.js"))
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
		import: (() => import("./perl-BOfMZsrm.js"))
	},
	{
		id: "php",
		name: "PHP",
		import: (() => import("./php-BEMzXXpD.js"))
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
		import: (() => import("./pug-Dwbhj_E_.js"))
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
		import: (() => import("./qml-D71QuNOK.js"))
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
		import: (() => import("./r-DEeW_Dkl.js").then((e) => e.n))
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
		import: (() => import("./razor--jsGrCKz.js"))
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
		import: (() => import("./regexp-BFftBSAr.js").then((e) => e.n))
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
		import: (() => import("./rst-DX39fVHn.js"))
	},
	{
		id: "ruby",
		name: "Ruby",
		aliases: ["rb"],
		import: (() => import("./ruby-BGJUlF7w.js"))
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
		import: (() => import("./sas-82JZyV7k.js"))
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
		import: (() => import("./scss-_F3DvUII.js").then((e) => e.n))
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
		import: (() => import("./shaderlab-84p2YHO_.js"))
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
		import: (() => import("./shellscript-BGa_PKC-.js").then((e) => e.n))
	},
	{
		id: "shellsession",
		name: "Shell Session",
		aliases: ["console"],
		import: (() => import("./shellsession-d1kU7_GI.js"))
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
		import: (() => import("./soy-D_m0dEeN.js"))
	},
	{
		id: "sparql",
		name: "SPARQL",
		import: (() => import("./sparql-BzLyUpLY.js"))
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
		import: (() => import("./sql-BAbM_O56.js").then((e) => e.n))
	},
	{
		id: "ssh-config",
		name: "SSH Config",
		import: (() => import("./ssh-config-DcnVpK-n.js"))
	},
	{
		id: "stata",
		name: "Stata",
		import: (() => import("./stata-6_N-vn8C.js"))
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
		import: (() => import("./surrealql-DNCDMYZ1.js"))
	},
	{
		id: "svelte",
		name: "Svelte",
		import: (() => import("./svelte-DhsYKZEf.js"))
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
		import: (() => import("./templ-DfDNONHp.js"))
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
		import: (() => import("./tex-Da9SONt4.js"))
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
		import: (() => import("./ts-tags-DH5scFh2.js"))
	},
	{
		id: "tsv",
		name: "TSV",
		import: (() => import("./tsv-r5fpGho9.js"))
	},
	{
		id: "tsx",
		name: "TSX",
		import: (() => import("./tsx-BAK9QBPH.js").then((e) => e.n))
	},
	{
		id: "turtle",
		name: "Turtle",
		import: (() => import("./turtle-BbiQBLu0.js"))
	},
	{
		id: "twig",
		name: "Twig",
		import: (() => import("./twig-DXQ8OB6H.js"))
	},
	{
		id: "typescript",
		name: "TypeScript",
		aliases: [
			"ts",
			"cts",
			"mts"
		],
		import: (() => import("./typescript-CAg0IZ68.js").then((e) => e.n))
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
		import: (() => import("./vue-RHP3V7EH.js"))
	},
	{
		id: "vue-html",
		name: "Vue HTML",
		import: (() => import("./vue-html-BHNnPCt1.js"))
	},
	{
		id: "vue-vine",
		name: "Vue Vine",
		import: (() => import("./vue-vine-Bam7u4o1.js"))
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
		import: (() => import("./xml-BOwzACuw.js").then((e) => e.n))
	},
	{
		id: "xsl",
		name: "XSL",
		import: (() => import("./xsl-BxW-ZLI4.js"))
	},
	{
		id: "yaml",
		name: "YAML",
		aliases: ["yml"],
		import: (() => import("./yaml-DqDpvSpk.js").then((e) => e.n))
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
], yi = Object.fromEntries(vi.map((e) => [e.id, e.import])), bi = Object.fromEntries(vi.flatMap((e) => e.aliases?.map((t) => [t, e.import]) || [])), xi = {
	...yi,
	...bi
}, Si = Object.fromEntries([
	{
		id: "andromeeda",
		displayName: "Andromeeda",
		type: "dark",
		import: (() => import("./andromeeda-D7gCgP-G.js"))
	},
	{
		id: "aurora-x",
		displayName: "Aurora X",
		type: "dark",
		import: (() => import("./aurora-x-BsXJMFt1.js"))
	},
	{
		id: "ayu-dark",
		displayName: "Ayu Dark",
		type: "dark",
		import: (() => import("./ayu-dark-DbnYH_JS.js"))
	},
	{
		id: "ayu-light",
		displayName: "Ayu Light",
		type: "light",
		import: (() => import("./ayu-light-37EzjYfI.js"))
	},
	{
		id: "ayu-mirage",
		displayName: "Ayu Mirage",
		type: "dark",
		import: (() => import("./ayu-mirage-BGTREkgS.js"))
	},
	{
		id: "catppuccin-frappe",
		displayName: "Catppuccin Frappé",
		type: "dark",
		import: (() => import("./catppuccin-frappe-BhWQvglU.js"))
	},
	{
		id: "catppuccin-latte",
		displayName: "Catppuccin Latte",
		type: "light",
		import: (() => import("./catppuccin-latte-DdTA9XYA.js"))
	},
	{
		id: "catppuccin-macchiato",
		displayName: "Catppuccin Macchiato",
		type: "dark",
		import: (() => import("./catppuccin-macchiato-BzqEQMs5.js"))
	},
	{
		id: "catppuccin-mocha",
		displayName: "Catppuccin Mocha",
		type: "dark",
		import: (() => import("./catppuccin-mocha-MGUESP2L.js"))
	},
	{
		id: "dark-plus",
		displayName: "Dark Plus",
		type: "dark",
		import: (() => import("./dark-plus-y383ldCf.js"))
	},
	{
		id: "dracula",
		displayName: "Dracula Theme",
		type: "dark",
		import: (() => import("./dracula-Fi9YAz8E.js"))
	},
	{
		id: "dracula-soft",
		displayName: "Dracula Theme Soft",
		type: "dark",
		import: (() => import("./dracula-soft-DrcagFCM.js"))
	},
	{
		id: "everforest-dark",
		displayName: "Everforest Dark",
		type: "dark",
		import: (() => import("./everforest-dark-DaWqoNjh.js"))
	},
	{
		id: "everforest-light",
		displayName: "Everforest Light",
		type: "light",
		import: (() => import("./everforest-light-aOCil_2s.js"))
	},
	{
		id: "github-dark",
		displayName: "GitHub Dark",
		type: "dark",
		import: (() => import("./github-dark-PJLbxk50.js"))
	},
	{
		id: "github-dark-default",
		displayName: "GitHub Dark Default",
		type: "dark",
		import: (() => import("./github-dark-default-BCbJjUR0.js"))
	},
	{
		id: "github-dark-dimmed",
		displayName: "GitHub Dark Dimmed",
		type: "dark",
		import: (() => import("./github-dark-dimmed-CPaQSl-9.js"))
	},
	{
		id: "github-dark-high-contrast",
		displayName: "GitHub Dark High Contrast",
		type: "dark",
		import: (() => import("./github-dark-high-contrast-DWO4aKt4.js"))
	},
	{
		id: "github-light",
		displayName: "GitHub Light",
		type: "light",
		import: (() => import("./github-light-CSBhWA0c.js"))
	},
	{
		id: "github-light-default",
		displayName: "GitHub Light Default",
		type: "light",
		import: (() => import("./github-light-default-KX_a7Hzc.js"))
	},
	{
		id: "github-light-high-contrast",
		displayName: "GitHub Light High Contrast",
		type: "light",
		import: (() => import("./github-light-high-contrast-BNQkCC8R.js"))
	},
	{
		id: "gruvbox-dark-hard",
		displayName: "Gruvbox Dark Hard",
		type: "dark",
		import: (() => import("./gruvbox-dark-hard-BQOsMnwz.js"))
	},
	{
		id: "gruvbox-dark-medium",
		displayName: "Gruvbox Dark Medium",
		type: "dark",
		import: (() => import("./gruvbox-dark-medium-BAnTwXxd.js"))
	},
	{
		id: "gruvbox-dark-soft",
		displayName: "Gruvbox Dark Soft",
		type: "dark",
		import: (() => import("./gruvbox-dark-soft-CyOJg4h8.js"))
	},
	{
		id: "gruvbox-light-hard",
		displayName: "Gruvbox Light Hard",
		type: "light",
		import: (() => import("./gruvbox-light-hard-CiZez-ok.js"))
	},
	{
		id: "gruvbox-light-medium",
		displayName: "Gruvbox Light Medium",
		type: "light",
		import: (() => import("./gruvbox-light-medium-Dypnr1hU.js"))
	},
	{
		id: "gruvbox-light-soft",
		displayName: "Gruvbox Light Soft",
		type: "light",
		import: (() => import("./gruvbox-light-soft-C5ofN0OG.js"))
	},
	{
		id: "horizon",
		displayName: "Horizon",
		type: "dark",
		import: (() => import("./horizon-IcyErjxE.js"))
	},
	{
		id: "horizon-bright",
		displayName: "Horizon Bright",
		type: "dark",
		import: (() => import("./horizon-bright-BLi-zhdI.js"))
	},
	{
		id: "houston",
		displayName: "Houston",
		type: "dark",
		import: (() => import("./houston-ChHv6BRx.js"))
	},
	{
		id: "kanagawa-dragon",
		displayName: "Kanagawa Dragon",
		type: "dark",
		import: (() => import("./kanagawa-dragon-Rx3Na1Lf.js"))
	},
	{
		id: "kanagawa-lotus",
		displayName: "Kanagawa Lotus",
		type: "light",
		import: (() => import("./kanagawa-lotus-C1QQ6ESS.js"))
	},
	{
		id: "kanagawa-wave",
		displayName: "Kanagawa Wave",
		type: "dark",
		import: (() => import("./kanagawa-wave-ClCoCWkW.js"))
	},
	{
		id: "laserwave",
		displayName: "LaserWave",
		type: "dark",
		import: (() => import("./laserwave-BqmsZZ0Y.js"))
	},
	{
		id: "light-plus",
		displayName: "Light Plus",
		type: "light",
		import: (() => import("./light-plus-BmV-MwlF.js"))
	},
	{
		id: "material-theme",
		displayName: "Material Theme",
		type: "dark",
		import: (() => import("./material-theme-B9ZqX1it.js"))
	},
	{
		id: "material-theme-darker",
		displayName: "Material Theme Darker",
		type: "dark",
		import: (() => import("./material-theme-darker-CwzgW518.js"))
	},
	{
		id: "material-theme-lighter",
		displayName: "Material Theme Lighter",
		type: "light",
		import: (() => import("./material-theme-lighter-CiLjfHga.js"))
	},
	{
		id: "material-theme-ocean",
		displayName: "Material Theme Ocean",
		type: "dark",
		import: (() => import("./material-theme-ocean-DG4kQiaC.js"))
	},
	{
		id: "material-theme-palenight",
		displayName: "Material Theme Palenight",
		type: "dark",
		import: (() => import("./material-theme-palenight-CofOBdlc.js"))
	},
	{
		id: "min-dark",
		displayName: "Min Dark",
		type: "dark",
		import: (() => import("./min-dark-OkkfeDRi.js"))
	},
	{
		id: "min-light",
		displayName: "Min Light",
		type: "light",
		import: (() => import("./min-light-DlXY7NZp.js"))
	},
	{
		id: "monokai",
		displayName: "Monokai",
		type: "dark",
		import: (() => import("./monokai-B3nt9fxQ.js"))
	},
	{
		id: "night-owl",
		displayName: "Night Owl",
		type: "dark",
		import: (() => import("./night-owl-B1lFBnRN.js"))
	},
	{
		id: "night-owl-light",
		displayName: "Night Owl Light",
		type: "light",
		import: (() => import("./night-owl-light-RDR67S3f.js"))
	},
	{
		id: "nord",
		displayName: "Nord",
		type: "dark",
		import: (() => import("./nord-B3mZ3wt7.js"))
	},
	{
		id: "one-dark-pro",
		displayName: "One Dark Pro",
		type: "dark",
		import: (() => import("./one-dark-pro-CHwG012-.js"))
	},
	{
		id: "one-light",
		displayName: "One Light",
		type: "light",
		import: (() => import("./one-light-BTVF8_V6.js"))
	},
	{
		id: "plastic",
		displayName: "Plastic",
		type: "dark",
		import: (() => import("./plastic-BZ2PuINx.js"))
	},
	{
		id: "poimandres",
		displayName: "Poimandres",
		type: "dark",
		import: (() => import("./poimandres-CXCm5KnQ.js"))
	},
	{
		id: "red",
		displayName: "Red",
		type: "dark",
		import: (() => import("./red-BpOY8fSA.js"))
	},
	{
		id: "rose-pine",
		displayName: "Rosé Pine",
		type: "dark",
		import: (() => import("./rose-pine-BgYEwgTt.js"))
	},
	{
		id: "rose-pine-dawn",
		displayName: "Rosé Pine Dawn",
		type: "light",
		import: (() => import("./rose-pine-dawn-MhgHb3O1.js"))
	},
	{
		id: "rose-pine-moon",
		displayName: "Rosé Pine Moon",
		type: "dark",
		import: (() => import("./rose-pine-moon-CY5ReK_d.js"))
	},
	{
		id: "slack-dark",
		displayName: "Slack Dark",
		type: "dark",
		import: (() => import("./slack-dark-DEACVNLO.js"))
	},
	{
		id: "slack-ochin",
		displayName: "Slack Ochin",
		type: "light",
		import: (() => import("./slack-ochin-HbzvFLgS.js"))
	},
	{
		id: "snazzy-light",
		displayName: "Snazzy Light",
		type: "light",
		import: (() => import("./snazzy-light-K7vEAU5N.js"))
	},
	{
		id: "solarized-dark",
		displayName: "Solarized Dark",
		type: "dark",
		import: (() => import("./solarized-dark-_aml4vca.js"))
	},
	{
		id: "solarized-light",
		displayName: "Solarized Light",
		type: "light",
		import: (() => import("./solarized-light-CDShl1fX.js"))
	},
	{
		id: "synthwave-84",
		displayName: "Synthwave '84",
		type: "dark",
		import: (() => import("./synthwave-84-fIhQ-cP8.js"))
	},
	{
		id: "tokyo-night",
		displayName: "Tokyo Night",
		type: "dark",
		import: (() => import("./tokyo-night-DU7rCLIn.js"))
	},
	{
		id: "vesper",
		displayName: "Vesper",
		type: "dark",
		import: (() => import("./vesper-DmmVhE2c.js"))
	},
	{
		id: "vitesse-black",
		displayName: "Vitesse Black",
		type: "dark",
		import: (() => import("./vitesse-black-j6yZgquS.js"))
	},
	{
		id: "vitesse-dark",
		displayName: "Vitesse Dark",
		type: "dark",
		import: (() => import("./vitesse-dark-Brktp3Se.js"))
	},
	{
		id: "vitesse-light",
		displayName: "Vitesse Light",
		type: "light",
		import: (() => import("./vitesse-light-g4A0c2__.js"))
	}
].map((e) => [e.id, e.import])), Ci = class extends Error {
	constructor(e) {
		super(e), this.name = "ShikiError";
	}
};
function wi() {
	return 2147483648;
}
function Ti() {
	return typeof performance < "u" ? performance.now() : Date.now();
}
var Ei = (e, t) => e + (t - e % t) % t;
async function Di(e) {
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
		let n = wi();
		if (e > n) return !1;
		for (let r = 1; r <= 4; r *= 2) {
			let i = t * (1 + .2 / r);
			if (i = Math.min(i, e + 100663296), o(Math.min(n, Ei(Math.max(e, i), 65536)))) return !0;
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
		emscripten_get_now: Ti,
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
var Oi = Object.defineProperty, ki = (e, t, n) => t in e ? Oi(e, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: n
}) : e[t] = n, E = (e, t, n) => ki(e, typeof t == "symbol" ? t : t + "", n), D = null;
function Ai(e) {
	throw new Ci(e.UTF8ToString(e.getLastOnigError()));
}
var ji = class e {
	constructor(t) {
		E(this, "utf16Length"), E(this, "utf8Length"), E(this, "utf16Value"), E(this, "utf8Value"), E(this, "utf16OffsetToUtf8"), E(this, "utf8OffsetToUtf16");
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
}, Mi = class e {
	constructor(t) {
		if (E(this, "id", ++e.LAST_ID), E(this, "_onigBinding"), E(this, "content"), E(this, "utf16Length"), E(this, "utf8Length"), E(this, "utf16OffsetToUtf8"), E(this, "utf8OffsetToUtf16"), E(this, "ptr"), !D) throw new Ci("Must invoke loadWasm first.");
		this._onigBinding = D, this.content = t;
		let n = new ji(t);
		this.utf16Length = n.utf16Length, this.utf8Length = n.utf8Length, this.utf16OffsetToUtf8 = n.utf16OffsetToUtf8, this.utf8OffsetToUtf16 = n.utf8OffsetToUtf16, this.utf8Length < 1e4 && !e._sharedPtrInUse ? (e._sharedPtr ||= D.omalloc(1e4), e._sharedPtrInUse = !0, D.HEAPU8.set(n.utf8Value, e._sharedPtr), this.ptr = e._sharedPtr) : this.ptr = n.createString(D);
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
E(Mi, "LAST_ID", 0), E(Mi, "_sharedPtr", 0), E(Mi, "_sharedPtrInUse", !1);
var Ni = Mi, Pi = class {
	constructor(e) {
		if (E(this, "_onigBinding"), E(this, "_ptr"), !D) throw new Ci("Must invoke loadWasm first.");
		let t = [], n = [];
		for (let r = 0, i = e.length; r < i; r++) {
			let i = new ji(e[r]);
			t[r] = i.createString(D), n[r] = i.utf8Length;
		}
		let r = D.omalloc(4 * e.length);
		D.HEAPU32.set(t, r / 4);
		let i = D.omalloc(4 * e.length);
		D.HEAPU32.set(n, i / 4);
		let a = D.createOnigScanner(r, i, e.length);
		for (let n = 0, r = e.length; n < r; n++) D.ofree(t[n]);
		D.ofree(i), D.ofree(r), a === 0 && Ai(D), this._onigBinding = D, this._ptr = a;
	}
	dispose() {
		this._onigBinding.freeOnigScanner(this._ptr);
	}
	findNextMatchSync(e, t, n) {
		let r = 0;
		if (typeof n == "number" && (r = n), typeof e == "string") {
			e = new Ni(e);
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
function Fi(e) {
	return typeof e.instantiator == "function";
}
function Ii(e) {
	return typeof e.default == "function";
}
function Li(e) {
	return e.data !== void 0;
}
function Ri(e) {
	return typeof Response < "u" && e instanceof Response;
}
function zi(e) {
	return typeof ArrayBuffer < "u" && (e instanceof ArrayBuffer || ArrayBuffer.isView(e)) || typeof Buffer < "u" && Buffer.isBuffer?.(e) || typeof SharedArrayBuffer < "u" && e instanceof SharedArrayBuffer || typeof Uint32Array < "u" && e instanceof Uint32Array;
}
var Bi;
function Vi(e) {
	if (Bi) return Bi;
	async function t() {
		D = await Di(async (t) => {
			let n = e;
			return n = await n, typeof n == "function" && (n = await n(t)), typeof n == "function" && (n = await n(t)), Fi(n) ? n = await n.instantiator(t) : Ii(n) ? n = await n.default(t) : (Li(n) && (n = n.data), Ri(n) ? n = typeof WebAssembly.instantiateStreaming == "function" ? await Ui(n)(t) : await Wi(n)(t) : zi(n) || n instanceof WebAssembly.Module ? n = await Hi(n)(t) : "default" in n && n.default instanceof WebAssembly.Module && (n = await Hi(n.default)(t))), "instance" in n && (n = n.instance), "exports" in n && (n = n.exports), n;
		});
	}
	return Bi = t(), Bi;
}
function Hi(e) {
	return (t) => WebAssembly.instantiate(e, t);
}
function Ui(e) {
	return (t) => WebAssembly.instantiateStreaming(e, t);
}
function Wi(e) {
	return async (t) => {
		let n = await e.arrayBuffer();
		return WebAssembly.instantiate(n, t);
	};
}
async function Gi(e) {
	return e && await Vi(e), {
		createScanner(e) {
			return new Pi(e.map((e) => typeof e == "string" ? e : e.source));
		},
		createString(e) {
			return new Ni(e);
		}
	};
}
// node_modules/.pnpm/shiki@3.23.0/node_modules/shiki/dist/bundle-full.mjs
var Ki = /* @__PURE__ */ hi({
	langs: xi,
	themes: Si,
	engine: () => Gi(import("./wasm-CEoannIQ.js"))
}), { codeToHtml: qi, codeToHast: Ji, codeToTokens: Yi, codeToTokensBase: Xi, codeToTokensWithThemes: Zi, getSingletonHighlighter: Qi, getLastGrammarState: $i } = /* @__PURE__ */ _i(Ki, { guessEmbeddedLanguages: ir });
// node_modules/.pnpm/oniguruma-parser@0.12.2/node_modules/oniguruma-parser/dist/utils.js
function O(e) {
	if ([...e].length !== 1) throw Error(`Expected "${e}" to be a single code point`);
	return e.codePointAt(0);
}
function ea(e, t, n) {
	return e.has(t) || e.set(t, n), e.get(t);
}
var ta = /* @__PURE__ */ new Set([
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
]), k = String.raw;
function A(e, t) {
	if (e == null) throw Error(t ?? "Value expected");
	return e;
}
// node_modules/.pnpm/oniguruma-parser@0.12.2/node_modules/oniguruma-parser/dist/tokenizer/tokenize.js
var na = k`\[\^?`, ra = `c.? | C(?:-.?)?|${k`[pP]\{(?:\^?[-\x20_]*[A-Za-z][-\x20\w]*\})?`}|${k`x[89A-Fa-f]\p{AHex}(?:\\x[89A-Fa-f]\p{AHex})*`}|${k`u(?:\p{AHex}{4})? | x\{[^\}]*\}? | x\p{AHex}{0,2}`}|${k`o\{[^\}]*\}?`}|${k`\d{1,3}`}`, ia = /[?*+][?+]?|\{(?:\d+(?:,\d*)?|,\d+)\}\??/, aa = new RegExp(k`
  \\ (?:
    ${ra}
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
  | (?:${ia.source})+
  | ${na}
  | .
`.replace(/\s+/g, ""), "gsu"), oa = new RegExp(k`
  \\ (?:
    ${ra}
    | .
  )
  | \[:(?:\^?\p{Alpha}+|\^):\]
  | ${na}
  | &&
  | .
`.replace(/\s+/g, ""), "gsu");
function sa(e, t = {}) {
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
	let r = Pa(n.flags), i = [r.extended], a = {
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
	for (aa.lastIndex = 0; s = aa.exec(e);) {
		let t = ca(a, e, s[0], aa.lastIndex);
		t.tokens ? o.push(...t.tokens) : t.token && o.push(t.token), t.lastIndex !== void 0 && (aa.lastIndex = t.lastIndex);
	}
	let c = [], l = 0;
	o.filter((e) => e.type === "GroupOpen").forEach((e) => {
		e.kind === "capturing" ? e.number = ++l : e.raw === "(" && c.push(e);
	}), l || c.forEach((e, t) => {
		e.kind = "capturing", e.number = t + 1;
	});
	let u = l || c.length;
	return {
		tokens: o.map((e) => e.type === "EscapedNumber" ? Ia(e, u) : e).flat(),
		flags: r
	};
}
function ca(e, t, n, r) {
	let [i, a] = n;
	if (n === "[" || n === "[^") {
		let e = la(t, n, r);
		return {
			tokens: e.tokens,
			lastIndex: e.lastIndex
		};
	}
	if (i === "\\") {
		if ("AbBGyYzZ".includes(a)) return { token: pa(n, n) };
		if (/^\\g[<']/.test(n)) {
			if (!/^\\g(?:<[^>]+>|'[^']+')$/.test(n)) throw Error(`Invalid group name "${n}"`);
			return { token: wa(n) };
		}
		if (/^\\k[<']/.test(n)) {
			if (!/^\\k(?:<[^>]+>|'[^']+')$/.test(n)) throw Error(`Invalid group name "${n}"`);
			return { token: ma(n) };
		}
		if (a === "K") return { token: ya("keep", n) };
		if (a === "N" || a === "R") return { token: M("newline", n, { negate: a === "N" }) };
		if (a === "O") return { token: M("any", n) };
		if (a === "X") return { token: M("text_segment", n) };
		let e = da(n, { inCharClass: !1 });
		return Array.isArray(e) ? { tokens: e } : { token: e };
	}
	if (i === "(") {
		if (a === "*") return { token: ka(n) };
		if (n === "(?{") throw Error(`Unsupported callout "${n}"`);
		if (n.startsWith("(?#")) {
			if (t[r] !== ")") throw Error("Unclosed comment group \"(?#\"");
			return { lastIndex: r + 1 };
		}
		if (/^\(\?[-imx]+[:)]$/.test(n)) return { token: Oa(n, e) };
		if (e.pushModX(e.getCurrentModX()), e.numOpenGroups++, n === "(" && !e.captureGroup || n === "(?:") return { token: N("group", n) };
		if (n === "(?>") return { token: N("atomic", n) };
		if (n === "(?=" || n === "(?!" || n === "(?<=" || n === "(?<!") return { token: N(n[2] === "<" ? "lookbehind" : "lookahead", n, { negate: n.endsWith("!") }) };
		if (n === "(" && e.captureGroup || n.startsWith("(?<") && n.endsWith(">") || n.startsWith("(?'") && n.endsWith("'")) return { token: N("capturing", n, { ...n !== "(" && { name: n.slice(3, -1) } }) };
		if (n.startsWith("(?~")) {
			if (n === "(?~|") throw Error(`Unsupported absence function kind "${n}"`);
			return { token: N("absence_repeater", n) };
		}
		throw Error(n === "(?(" ? `Unsupported conditional "${n}"` : `Invalid or unsupported group option "${n}"`);
	}
	if (n === ")") {
		if (e.popModX(), e.numOpenGroups--, e.numOpenGroups < 0) throw Error("Unmatched \")\"");
		return { token: xa(n) };
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
	return n === "." ? { token: M("dot", n) } : n === "^" || n === "$" ? { token: pa(e.singleline ? {
		"^": k`\A`,
		$: k`\Z`
	}[n] : n, n) } : n === "|" ? { token: fa(n) } : ia.test(n) ? { tokens: La(n) } : { token: j(O(n), n) };
}
function la(e, t, n) {
	let r = [va(t[1] === "^", t)], i = 1, a;
	for (oa.lastIndex = n; a = oa.exec(e);) {
		let e = a[0];
		if (e[0] === "[" && e[1] !== ":") i++, r.push(va(e[1] === "^", e));
		else if (e === "]") {
			if (r.at(-1).type === "CharacterClassOpen") r.push(j(93, e));
			else if (i--, r.push(ha(e)), !i) break;
		} else {
			let t = ua(e);
			Array.isArray(t) ? r.push(...t) : r.push(t);
		}
	}
	return {
		tokens: r,
		lastIndex: oa.lastIndex || e.length
	};
}
function ua(e) {
	if (e[0] === "\\") return da(e, { inCharClass: !0 });
	if (e[0] === "[") {
		let t = /\[:(?<negate>\^?)(?<name>[a-z]+):\]/.exec(e);
		if (!t || !ta.has(t.groups.name)) throw Error(`Invalid POSIX class "${e}"`);
		return M("posix", e, {
			value: t.groups.name,
			negate: !!t.groups.negate
		});
	}
	return e === "-" ? ga(e) : e === "&&" ? _a(e) : j(O(e), e);
}
function da(e, { inCharClass: t }) {
	let n = e[1];
	if (n === "c" || n === "C") return Da(e);
	if ("dDhHsSwW".includes(n)) return ja(e);
	if (e.startsWith(k`\o{`)) throw Error(`Incomplete, invalid, or unsupported octal code point "${e}"`);
	if (/^\\[pP]\{/.test(e)) {
		if (e.length === 3) throw Error(`Incomplete or invalid Unicode property "${e}"`);
		return Ma(e);
	}
	if (/^\\x[89A-Fa-f]\p{AHex}/u.test(e)) try {
		let t = e.split(/\\x/).slice(1).map((e) => parseInt(e, 16)), n = new TextDecoder("utf-8", {
			ignoreBOM: !0,
			fatal: !0
		}).decode(new Uint8Array(t)), r = new TextEncoder();
		return [...n].map((e) => {
			let t = [...r.encode(e)].map((e) => `\\x${e.toString(16)}`).join("");
			return j(O(e), t);
		});
	} catch {
		throw Error(`Multibyte code "${e}" incomplete or invalid in Oniguruma`);
	}
	if (n === "u" || n === "x") return j(Fa(e), e);
	if (Ea.has(n)) return j(Ea.get(n), e);
	if (/\d/.test(n)) return ba(t, e);
	if (e === "\\") throw Error(k`Incomplete escape "\"`);
	if (n === "M") throw Error(`Unsupported meta "${e}"`);
	if ([...e].length === 2) return j(e.codePointAt(1), e);
	throw Error(`Unexpected escape "${e}"`);
}
function fa(e) {
	return {
		type: "Alternator",
		raw: e
	};
}
function pa(e, t) {
	return {
		type: "Assertion",
		kind: e,
		raw: t
	};
}
function ma(e) {
	return {
		type: "Backreference",
		raw: e
	};
}
function j(e, t) {
	return {
		type: "Character",
		value: e,
		raw: t
	};
}
function ha(e) {
	return {
		type: "CharacterClassClose",
		raw: e
	};
}
function ga(e) {
	return {
		type: "CharacterClassHyphen",
		raw: e
	};
}
function _a(e) {
	return {
		type: "CharacterClassIntersector",
		raw: e
	};
}
function va(e, t) {
	return {
		type: "CharacterClassOpen",
		negate: e,
		raw: t
	};
}
function M(e, t, n = {}) {
	return {
		type: "CharacterSet",
		kind: e,
		...n,
		raw: t
	};
}
function ya(e, t, n = {}) {
	return e === "keep" ? {
		type: "Directive",
		kind: e,
		raw: t
	} : {
		type: "Directive",
		kind: e,
		flags: A(n.flags),
		raw: t
	};
}
function ba(e, t) {
	return {
		type: "EscapedNumber",
		inCharClass: e,
		raw: t
	};
}
function xa(e) {
	return {
		type: "GroupClose",
		raw: e
	};
}
function N(e, t, n = {}) {
	return {
		type: "GroupOpen",
		kind: e,
		...n,
		raw: t
	};
}
function Sa(e, t, n, r) {
	return {
		type: "NamedCallout",
		kind: e,
		tag: t,
		arguments: n,
		raw: r
	};
}
function Ca(e, t, n, r) {
	return {
		type: "Quantifier",
		kind: e,
		min: t,
		max: n,
		raw: r
	};
}
function wa(e) {
	return {
		type: "Subroutine",
		raw: e
	};
}
var Ta = /* @__PURE__ */ new Set([
	"COUNT",
	"CMP",
	"ERROR",
	"FAIL",
	"MAX",
	"MISMATCH",
	"SKIP",
	"TOTAL_COUNT"
]), Ea = /* @__PURE__ */ new Map([
	["a", 7],
	["b", 8],
	["e", 27],
	["f", 12],
	["n", 10],
	["r", 13],
	["t", 9],
	["v", 11]
]);
function Da(e) {
	let t = e[1] === "c" ? e[2] : e[3];
	if (!t || !/[A-Za-z]/.test(t)) throw Error(`Unsupported control character "${e}"`);
	return j(O(t.toUpperCase()) - 64, e);
}
function Oa(e, t) {
	let { on: n, off: r } = /^\(\?(?<on>[imx]*)(?:-(?<off>[-imx]*))?/.exec(e).groups;
	r ??= "";
	let i = (t.getCurrentModX() || n.includes("x")) && !r.includes("x"), a = Na(n), o = Na(r), s = {};
	if (a && (s.enable = a), o && (s.disable = o), e.endsWith(")")) return t.replaceCurrentModX(i), ya("flags", e, { flags: s });
	if (e.endsWith(":")) return t.pushModX(i), t.numOpenGroups++, N("group", e, { ...(a || o) && { flags: s } });
	throw Error(`Unexpected flag modifier "${e}"`);
}
function ka(e) {
	let t = /\(\*(?<name>[A-Za-z_]\w*)?(?:\[(?<tag>(?:[A-Za-z_]\w*)?)\])?(?:\{(?<args>[^}]*)\})?\)/.exec(e);
	if (!t) throw Error(`Incomplete or invalid named callout "${e}"`);
	let { name: n, tag: r, args: i } = t.groups;
	if (!n) throw Error(`Invalid named callout "${e}"`);
	if (r === "") throw Error(`Named callout tag with empty value not allowed "${e}"`);
	let a = i ? i.split(",").filter((e) => e !== "").map((e) => /^[+-]?\d+$/.test(e) ? +e : e) : [], [o, s, c] = a, l = Ta.has(n) ? n.toLowerCase() : "custom";
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
	return Sa(l, r ?? null, i?.split(",") ?? null, e);
}
function Aa(e) {
	let t = null, n, r;
	if (e[0] === "{") {
		let { minStr: i, maxStr: a } = /^\{(?<minStr>\d*)(?:,(?<maxStr>\d*))?/.exec(e).groups, o = 1e5;
		if (+i > o || a && +a > o) throw Error("Quantifier value unsupported in Oniguruma");
		if (n = +i, r = a === void 0 ? +i : a === "" ? 1 / 0 : +a, n > r && (t = "possessive", [n, r] = [r, n]), e.endsWith("?")) {
			if (t === "possessive") throw Error("Unsupported possessive interval quantifier chain with \"?\"");
			t = "lazy";
		} else t ||= "greedy";
	} else n = +(e[0] === "+"), r = e[0] === "?" ? 1 : 1 / 0, t = e[1] === "+" ? "possessive" : e[1] === "?" ? "lazy" : "greedy";
	return Ca(t, n, r, e);
}
function ja(e) {
	let t = e[1].toLowerCase();
	return M({
		d: "digit",
		h: "hex",
		s: "space",
		w: "word"
	}[t], e, { negate: e[1] !== t });
}
function Ma(e) {
	let { p: t, neg: n, value: r } = /^\\(?<p>[pP])\{(?<neg>\^?)(?<value>[^}]+)/.exec(e).groups;
	return M("property", e, {
		value: r,
		negate: t === "P" && !n || t === "p" && !!n
	});
}
function Na(e) {
	let t = {};
	return e.includes("i") && (t.ignoreCase = !0), e.includes("m") && (t.dotAll = !0), e.includes("x") && (t.extended = !0), Object.keys(t).length ? t : null;
}
function Pa(e) {
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
function Fa(e) {
	if (/^(?:\\u(?!\p{AHex}{4})|\\x(?!\p{AHex}{1,2}|\{\p{AHex}{1,8}\}))/u.test(e)) throw Error(`Incomplete or invalid escape "${e}"`);
	let t = e[2] === "{" ? /^\\x\{\s*(?<hex>\p{AHex}+)/u.exec(e).groups.hex : e.slice(2);
	return parseInt(t, 16);
}
function Ia(e, t) {
	let { raw: n, inCharClass: r } = e, i = n.slice(1);
	if (!r && (i !== "0" && i.length === 1 || i[0] !== "0" && +i <= t)) return [ma(n)];
	let a = [], o = i.match(/^[0-7]+|\d/g);
	for (let e = 0; e < o.length; e++) {
		let t = o[e], r;
		if (e === 0 && t !== "8" && t !== "9") {
			if (r = parseInt(t, 8), r > 127) throw Error(k`Octal encoded byte above 177 unsupported "${n}"`);
		} else r = O(t);
		a.push(j(r, (e === 0 ? "\\" : "") + t));
	}
	return a;
}
function La(e) {
	let t = [], n = new RegExp(ia, "gy"), r;
	for (; r = n.exec(e);) {
		let e = r[0];
		if (e[0] === "{") {
			let r = /^\{(?<min>\d+),(?<max>\d+)\}\??$/.exec(e);
			if (r) {
				let { min: i, max: a } = r.groups;
				if (+i > +a && e.endsWith("?")) {
					n.lastIndex--, t.push(Aa(e.slice(0, -1)));
					continue;
				}
			}
		}
		t.push(Aa(e));
	}
	return t;
}
// node_modules/.pnpm/oniguruma-parser@0.12.2/node_modules/oniguruma-parser/dist/parser/node-utils.js
function Ra(e, t) {
	if (!Array.isArray(e.body)) throw Error("Expected node with body array");
	if (e.body.length !== 1) return !1;
	let n = e.body[0];
	return !t || Object.keys(t).every((e) => t[e] === n[e]);
}
function za(e) {
	return Ba.has(e.type);
}
var Ba = /* @__PURE__ */ new Set([
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
// node_modules/.pnpm/oniguruma-parser@0.12.2/node_modules/oniguruma-parser/dist/parser/parse.js
function Va(e, t = {}) {
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
	}, r = sa(e, {
		flags: n.flags,
		rules: {
			captureGroup: n.rules.captureGroup,
			singleline: n.rules.singleline
		}
	}), i = (e, t) => {
		let n = r.tokens[a.nextIndex];
		switch (a.parent = e, a.nextIndex++, n.type) {
			case "Alternator": return P();
			case "Assertion": return Ha(n);
			case "Backreference": return Ua(n, a);
			case "Character": return eo(n.value, { useLastValid: !!t.isCheckingRangeEnd });
			case "CharacterClassHyphen": return Wa(n, a, t);
			case "CharacterClassOpen": return Ga(n, a, t);
			case "CharacterSet": return Ka(n, a);
			case "Directive": return io(n.kind, { flags: n.flags });
			case "GroupOpen": return qa(n, a, t);
			case "NamedCallout": return oo(n.kind, n.tag, n.arguments);
			case "Quantifier": return Ja(n, a);
			case "Subroutine": return Ya(n, a);
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
	}, o = lo(ao(r.flags)), s = o.body[0];
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
		if (u.get(e).length > 1) throw Error(k`Subroutine uses a duplicate group name "\g<${e}>"`);
		u.get(e)[0].isSubroutined = !0;
	} else throw Error(k`Subroutine uses a group name that's not defined "\g<${e}>"`);
	return o;
}
function Ha({ kind: e }) {
	return Za(A({
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
	}[e], `Unexpected assertion kind "${e}"`), { negate: e === k`\B` || e === k`\Y` });
}
function Ua({ raw: e }, t) {
	let n = /^\\k[<']/.test(e), r = n ? e.slice(3, -1) : e.slice(1), i = (n, r = !1) => {
		let i = t.capturingGroups.length, a = !1;
		if (n > i) {
			if (t.skipBackrefValidation) a = !0;
			else throw Error(`Not enough capturing groups defined to the left "${e}"`);
		}
		return t.hasNumberedRef = !0, Qa(r ? i + 1 - n : n, { orphan: a });
	};
	if (n) {
		let n = /^(?<sign>-?)0*(?<num>[1-9]\d*)$/.exec(r);
		if (n) return i(+n.groups.num, !!n.groups.sign);
		if (/[-+]/.test(r)) throw Error(`Invalid backref name "${e}"`);
		if (!t.namedGroupsByName.has(r)) throw Error(`Group name not defined to the left "${e}"`);
		return Qa(r);
	}
	return i(+r);
}
function Wa(e, t, n) {
	let { tokens: r, walk: i } = t, a = t.parent, o = a.body.at(-1), s = r[t.nextIndex];
	if (!n.isCheckingRangeEnd && o && o.type !== "CharacterClass" && o.type !== "CharacterClassRange" && s && s.type !== "CharacterClassOpen" && s.type !== "CharacterClassClose" && s.type !== "CharacterClassIntersector") {
		let e = i(a, {
			...n,
			isCheckingRangeEnd: !0
		});
		if (o.type === "Character" && e.type === "Character") return a.body.pop(), no(o, e);
		throw Error("Invalid character class range");
	}
	return eo(O("-"));
}
function Ga({ negate: e }, t, n) {
	let { tokens: r, walk: i } = t, a = [to()], o = r[t.nextIndex], s = bo(o);
	for (; s.type !== "CharacterClassClose";) {
		if (s.type === "CharacterClassIntersector") a.push(to()), t.nextIndex++;
		else {
			let e = a.at(-1);
			e.body.push(i(e, n));
		}
		s = bo(r[t.nextIndex], o);
	}
	let c = to({ negate: e });
	return a.length === 1 ? c.body = a[0].body : (c.kind = "intersection", c.body = a.map((e) => e.body.length === 1 ? e.body[0] : e)), t.nextIndex++, c;
}
function Ka({ kind: e, negate: t, value: n }, r) {
	let { normalizeUnknownPropertyNames: i, skipPropertyNameValidation: a, unicodePropertyMap: o } = r;
	if (e === "property") {
		let r = yo(n);
		if (ta.has(r) && !o?.has(r)) e = "posix", n = r;
		else return L(n, {
			negate: t,
			normalizeUnknownPropertyNames: i,
			skipPropertyNameValidation: a,
			unicodePropertyMap: o
		});
	}
	return e === "posix" ? so(n, { negate: t }) : ro(e, { negate: t });
}
function qa(e, t, n) {
	let { tokens: r, capturingGroups: i, namedGroupsByName: a, skipLookbehindValidation: o, walk: s } = t, c = fo(e), l = c.type === "AbsenceFunction", u = go(c), d = u && c.negate;
	if (c.type === "CapturingGroup" && (i.push(c), c.name && ea(a, c.name, []).push(c)), l && n.isInAbsenceFunction) throw Error("Nested absence function not supported by Oniguruma");
	let f = xo(r[t.nextIndex]);
	for (; f.type !== "GroupClose";) {
		if (f.type === "Alternator") c.body.push(P()), t.nextIndex++;
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
					if (ho(t) || t.type === "CapturingGroup") throw Error(e);
				} else if (ho(t) || go(t) && t.negate) throw Error(e);
			}
		}
		f = xo(r[t.nextIndex]);
	}
	return t.nextIndex++, c;
}
function Ja({ kind: e, min: t, max: n }, r) {
	let i = r.parent, a = i.body.at(-1);
	if (!a || !za(a)) throw Error("Quantifier requires a repeatable token");
	let o = co(e, t, n, a);
	return i.body.pop(), o;
}
function Ya({ raw: e }, t) {
	let { capturingGroups: n, subroutines: r } = t, i = e.slice(3, -1), a = /^(?<sign>[-+]?)0*(?<num>[1-9]\d*)$/.exec(i);
	if (a) {
		let e = +a.groups.num, r = n.length;
		if (t.hasNumberedRef = !0, i = {
			"": e,
			"+": r + e,
			"-": r + 1 - e
		}[a.groups.sign], i < 1) throw Error("Invalid subroutine number");
	} else i === "0" && (i = 0);
	let o = uo(i);
	return r.push(o), o;
}
function Xa(e, t) {
	if (e !== "repeater") throw Error(`Unexpected absence function kind "${e}"`);
	return {
		type: "AbsenceFunction",
		kind: e,
		body: po(t?.body)
	};
}
function P(e) {
	return {
		type: "Alternative",
		body: mo(e?.body)
	};
}
function Za(e, t) {
	let n = {
		type: "Assertion",
		kind: e
	};
	return (e === "word_boundary" || e === "text_segment_boundary") && (n.negate = !!t?.negate), n;
}
function Qa(e, t) {
	let n = !!t?.orphan;
	return {
		type: "Backreference",
		ref: e,
		...n && { orphan: n }
	};
}
function $a(e, t) {
	let n = {
		name: void 0,
		isSubroutined: !1,
		...t
	};
	if (n.name !== void 0 && !_o(n.name)) throw Error(`Group name "${n.name}" invalid in Oniguruma`);
	return {
		type: "CapturingGroup",
		number: e,
		...n.name && { name: n.name },
		...n.isSubroutined && { isSubroutined: n.isSubroutined },
		body: po(t?.body)
	};
}
function eo(e, t) {
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
function to(e) {
	let t = {
		kind: "union",
		negate: !1,
		...e
	};
	return {
		type: "CharacterClass",
		kind: t.kind,
		negate: t.negate,
		body: mo(e?.body)
	};
}
function no(e, t) {
	if (t.value < e.value) throw Error("Character class range out of order");
	return {
		type: "CharacterClassRange",
		min: e,
		max: t
	};
}
function ro(e, t) {
	let n = !!t?.negate, r = {
		type: "CharacterSet",
		kind: e
	};
	return (e === "digit" || e === "hex" || e === "newline" || e === "space" || e === "word") && (r.negate = n), (e === "text_segment" || e === "newline" && !n) && (r.variableLength = !0), r;
}
function io(e, t = {}) {
	if (e === "keep") return {
		type: "Directive",
		kind: e
	};
	if (e === "flags") return {
		type: "Directive",
		kind: e,
		flags: A(t.flags)
	};
	throw Error(`Unexpected directive kind "${e}"`);
}
function ao(e) {
	return {
		type: "Flags",
		...e
	};
}
function F(e) {
	let t = e?.atomic, n = e?.flags;
	if (t && n) throw Error("Atomic group cannot have flags");
	return {
		type: "Group",
		...t && { atomic: t },
		...n && { flags: n },
		body: po(e?.body)
	};
}
function I(e) {
	let t = {
		behind: !1,
		negate: !1,
		...e
	};
	return {
		type: "LookaroundAssertion",
		kind: t.behind ? "lookbehind" : "lookahead",
		negate: t.negate,
		body: po(e?.body)
	};
}
function oo(e, t, n) {
	return {
		type: "NamedCallout",
		kind: e,
		tag: t,
		arguments: n
	};
}
function so(e, t) {
	let n = !!t?.negate;
	if (!ta.has(e)) throw Error(`Invalid POSIX class "${e}"`);
	return {
		type: "CharacterSet",
		kind: "posix",
		value: e,
		negate: n
	};
}
function co(e, t, n, r) {
	if (t > n) throw Error("Invalid reversed quantifier range");
	return {
		type: "Quantifier",
		kind: e,
		min: t,
		max: n,
		body: r
	};
}
function lo(e, t) {
	return {
		type: "Regex",
		body: po(t?.body),
		flags: e
	};
}
function uo(e) {
	return {
		type: "Subroutine",
		ref: e
	};
}
function L(e, t) {
	let n = {
		negate: !1,
		normalizeUnknownPropertyNames: !1,
		skipPropertyNameValidation: !1,
		unicodePropertyMap: null,
		...t
	}, r = n.unicodePropertyMap?.get(yo(e));
	if (!r) {
		if (n.normalizeUnknownPropertyNames) r = vo(e);
		else if (n.unicodePropertyMap && !n.skipPropertyNameValidation) throw Error(k`Invalid Unicode property "\p{${e}}"`);
	}
	return {
		type: "CharacterSet",
		kind: "property",
		value: r ?? e,
		negate: n.negate
	};
}
function fo({ flags: e, kind: t, name: n, negate: r, number: i }) {
	switch (t) {
		case "absence_repeater": return Xa("repeater");
		case "atomic": return F({ atomic: !0 });
		case "capturing": return $a(i, { name: n });
		case "group": return F({ flags: e });
		case "lookahead":
		case "lookbehind": return I({
			behind: t === "lookbehind",
			negate: r
		});
		default: throw Error(`Unexpected group kind "${t}"`);
	}
}
function po(e) {
	if (e === void 0) e = [P()];
	else if (!Array.isArray(e) || !e.length || !e.every((e) => e.type === "Alternative")) throw Error("Invalid body; expected array of one or more Alternative nodes");
	return e;
}
function mo(e) {
	if (e === void 0) e = [];
	else if (!Array.isArray(e) || !e.every((e) => !!e.type)) throw Error("Invalid body; expected array of nodes");
	return e;
}
function ho(e) {
	return e.type === "LookaroundAssertion" && e.kind === "lookahead";
}
function go(e) {
	return e.type === "LookaroundAssertion" && e.kind === "lookbehind";
}
function _o(e) {
	return /^[\p{Alpha}\p{Pc}][^)]*$/u.test(e);
}
function vo(e) {
	return e.trim().replace(/[- _]+/g, "_").replace(/[A-Z][a-z]+(?=[A-Z])/g, "$&_").replace(/[A-Za-z]+/g, (e) => e[0].toUpperCase() + e.slice(1).toLowerCase());
}
function yo(e) {
	return e.replace(/[- _]+/g, "").toLowerCase();
}
function bo(e, t) {
	let n = t;
	return A(e, `Unclosed character class${n?.type === "Character" && n.value === 93 && n.raw === "]" ? " (started with \"]\")" : ""}`);
}
function xo(e) {
	return A(e, "Unclosed group");
}
// node_modules/.pnpm/oniguruma-parser@0.12.2/node_modules/oniguruma-parser/dist/traverser/traverse.js
function So(e, t, n = null) {
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
				Co(c).splice(Math.max(0, R(s) + l), 1), l--, u = !0;
			},
			removeAllNextSiblings() {
				return Co(c).splice(R(s) + 1);
			},
			removeAllPrevSiblings() {
				let e = R(s) + l;
				return l -= e, Co(c).splice(0, Math.max(0, e));
			},
			replaceWith(e, t = {}) {
				let n = !!t.traverse;
				c ? c[Math.max(0, R(s) + l)] = e : A(o, "Can't replace root node")[s] = e, n && i(e, o, s, c), u = !0;
			},
			replaceWithMultiple(e, t = {}) {
				let n = !!t.traverse;
				if (Co(c).splice(Math.max(0, R(s) + l), 1, ...e), l += e.length - 1, n) {
					let t = 0;
					for (let n = 0; n < e.length; n++) t += i(e[n], o, R(s) + n + t, c);
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
function Co(e) {
	if (!Array.isArray(e)) throw Error("Container expected");
	return e;
}
function R(e) {
	if (typeof e != "number") throw Error("Numeric key expected");
	return e;
}
// node_modules/.pnpm/regex@6.1.0/node_modules/regex/src/utils-internals.js
var wo = String.raw`\(\?(?:[:=!>A-Za-z\-]|<[=!]|\(DEFINE\))`;
function To(e, t) {
	for (let n = 0; n < e.length; n++) e[n] >= t && e[n]++;
}
function Eo(e, t, n, r) {
	return e.slice(0, t) + r + e.slice(t + n.length);
}
// node_modules/.pnpm/regex-utilities@2.3.0/node_modules/regex-utilities/src/index.js
var z = Object.freeze({
	DEFAULT: "DEFAULT",
	CHAR_CLASS: "CHAR_CLASS"
});
function Do(e, t, n, r) {
	let i = new RegExp(String.raw`${t}|(?<$skip>\[\^?|\\?.)`, "gsu"), a = [!1], o = 0, s = "";
	for (let t of e.matchAll(i)) {
		let { 0: e, groups: { $skip: i } } = t;
		!i && (!r || r === z.DEFAULT == !o) ? n instanceof Function ? s += n(t, {
			context: o ? z.CHAR_CLASS : z.DEFAULT,
			negated: a[a.length - 1]
		}) : s += n : (e[0] === "[" ? (o++, a.push(e[1] === "^")) : e === "]" && o && (o--, a.pop()), s += e);
	}
	return s;
}
function Oo(e, t, n, r) {
	Do(e, t, n, r);
}
function ko(e, t, n = 0, r) {
	if (!new RegExp(t, "su").test(e)) return null;
	let i = RegExp(`${t}|(?<$skip>\\\\?.)`, "gsu");
	i.lastIndex = n;
	let a = 0, o;
	for (; o = i.exec(e);) {
		let { 0: e, groups: { $skip: t } } = o;
		if (!t && (!r || r === z.DEFAULT == !a)) return o;
		e === "[" ? a++ : e === "]" && a && a--, i.lastIndex == o.index && i.lastIndex++;
	}
	return null;
}
function Ao(e, t, n) {
	return !!ko(e, t, 0, n);
}
function jo(e, t) {
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
// node_modules/.pnpm/regex@6.1.0/node_modules/regex/src/atomic.js
var Mo = new RegExp(String.raw`(?<noncapturingStart>${wo})|(?<capturingStart>\((?:\?<[^>]+>)?)|\\?.`, "gsu");
function No(e, t) {
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
		for (Mo.lastIndex = Number.isNaN(c) ? 0 : c + 7; f = Mo.exec(e);) {
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
					if (e = `${e.slice(0, c)}(?:(?=(${e.slice(c + 3, m)}))<$$${t}>)${e.slice(m + 1)}`, l = !0, a.push(t), To(n, t), r.size) {
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
	return n.push(...a), e = Do(e, String.raw`\\(?<backrefNum>[1-9]\d*)|<\$\$(?<wrappedBackrefNum>\d+)>`, ({ 0: e, groups: { backrefNum: t, wrappedBackrefNum: n } }) => {
		if (t) {
			let n = +t;
			if (n > i.length - 1) throw Error(`Backref "${e}" greater than number of captures`);
			return `\\${i[n]}`;
		}
		return `\\${n}`;
	}, z.DEFAULT), {
		pattern: e,
		captureTransfers: r,
		hiddenCaptures: n
	};
}
var Po = String.raw`(?:[?*+]|\{\d+(?:,\d*)?\})`, Fo = new RegExp(String.raw`
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
| (?<qBase>${Po})(?<qMod>[?+]?)(?<invalidQ>[?*+\{]?)
| \\?.
`.replace(/\s+/g, ""), "gsu");
function Io(e) {
	if (!RegExp(`${Po}\\+`).test(e)) return { pattern: e };
	let t = [], n = null, r = null, i = "", a = 0, o;
	for (Fo.lastIndex = 0; o = Fo.exec(e);) {
		let { 0: s, index: c, groups: { qBase: l, qMod: u, invalidQ: d } } = o;
		if (s === "[") a || (r = c), a++;
		else if (s === "]") a ? a-- : r = null;
		else if (!a) {
			if (u === "+" && i && !i.startsWith("(")) {
				if (d) throw Error(`Invalid quantifier "${s}"`);
				let t = -1;
				if (/^\{\d+\}$/.test(l)) e = Eo(e, c + l.length, u, "");
				else {
					if (i === ")" || i === "]") {
						let t = i === ")" ? n : r;
						if (t === null) throw Error(`Invalid unmatched "${i}"`);
						e = `${e.slice(0, t)}(?>${e.slice(t, c)}${l})${e.slice(c + s.length)}`;
					} else e = `${e.slice(0, c - i.length)}(?>${i}${l})${e.slice(c + s.length)}`;
					t += 4;
				}
				Fo.lastIndex += t;
			} else s[0] === "(" ? t.push(c) : s === ")" && (n = t.length ? t.pop() : null);
		}
		i = s;
	}
	return { pattern: e };
}
// node_modules/.pnpm/regex-recursion@6.0.2/node_modules/regex-recursion/src/index.js
var B = String.raw, Lo = B`\(\?R=(?<rDepth>[^\)]+)\)|${B`\\g<(?<gRNameOrNum>[^>&]+)&R=(?<gRDepth>[^>]+)>`}`, Ro = B`\(\?<(?![=!])(?<captureName>[^>]+)>`, zo = B`${Ro}|(?<unnamed>\()(?!\?)`, V = new RegExp(B`${Ro}|${Lo}|\(\?|\\?.`, "gsu"), Bo = "Cannot use multiple overlapping recursions";
function Vo(e, t) {
	let { hiddenCaptures: n, mode: r } = {
		hiddenCaptures: [],
		mode: "plugin",
		...t
	}, i = t?.captureTransfers ?? /* @__PURE__ */ new Map();
	if (!new RegExp(Lo, "su").test(e)) return {
		pattern: e,
		captureTransfers: i,
		hiddenCaptures: n
	};
	if (r === "plugin" && Ao(e, B`\(\?\(DEFINE\)`, z.DEFAULT)) throw Error("DEFINE groups cannot be used with recursion");
	let a = [], o = Ao(e, B`\\[1-9]`, z.DEFAULT), s = /* @__PURE__ */ new Map(), c = [], l = !1, u = 0, d = 0, f;
	for (V.lastIndex = 0; f = V.exec(e);) {
		let { 0: t, groups: { captureName: p, rDepth: m, gRNameOrNum: h, gRDepth: g } } = f;
		if (t === "[") u++;
		else if (u) t === "]" && u--;
		else {
			if (m) {
				if (Ho(m), l) throw Error(Bo);
				if (o) throw Error(`${r === "external" ? "Backrefs" : "Numbered backrefs"} cannot be used with global recursion`);
				let t = e.slice(0, f.index), s = e.slice(V.lastIndex);
				if (Ao(s, Lo, z.DEFAULT)) throw Error(Bo);
				let c = m - 1;
				e = Uo(t, s, c, !1, n, a, d), i = Ko(i, t, c, a.length, 0, d);
				break;
			}
			if (h) {
				Ho(g);
				let u = !1;
				for (let e of c) if (e.name === h || e.num === +h) {
					if (u = !0, e.hasRecursedWithin) throw Error(Bo);
					break;
				}
				if (!u) throw Error(B`Recursive \g cannot be used outside the referenced group "${r === "external" ? h : B`\g<${h}&R=${g}>`}"`);
				let p = s.get(h), m = jo(e, p);
				if (o && Ao(m, B`${Ro}|\((?!\?)`, z.DEFAULT)) throw Error(`${r === "external" ? "Backrefs" : "Numbered backrefs"} cannot be used with recursion of capturing groups`);
				let _ = e.slice(p, f.index), ee = m.slice(_.length + t.length), te = a.length, ne = g - 1, re = Uo(_, ee, ne, !0, n, a, d);
				i = Ko(i, _, ne, a.length - te, te, d), e = `${e.slice(0, p)}${re}${e.slice(p + m.length)}`, V.lastIndex += re.length - t.length - _.length - ee.length, c.forEach((e) => e.hasRecursedWithin = !0), l = !0;
			} else if (p) d++, s.set(String(d), V.lastIndex), s.set(p, V.lastIndex), c.push({
				num: d,
				name: p
			});
			else if (t[0] === "(") {
				let e = t === "(";
				e && (d++, s.set(String(d), V.lastIndex)), c.push(e ? { num: d } : {});
			} else t === ")" && c.pop();
		}
	}
	return n.push(...a), {
		pattern: e,
		captureTransfers: i,
		hiddenCaptures: n
	};
}
function Ho(e) {
	let t = `Max depth must be integer between 2 and 100; used ${e}`;
	if (!/^[1-9]\d*$/.test(e) || (e = +e, e < 2 || e > 100)) throw Error(t);
}
function Uo(e, t, n, r, i, a, o) {
	let s = /* @__PURE__ */ new Set();
	r && Oo(e + t, Ro, ({ groups: { captureName: e } }) => {
		s.add(e);
	}, z.DEFAULT);
	let c = [
		n,
		r ? s : null,
		i,
		a,
		o
	];
	return `${e}${Wo(`(?:${e}`, "forward", ...c)}(?:)${Wo(`${t})`, "backward", ...c)}${t}`;
}
function Wo(e, t, n, r, i, a, o) {
	let s = (e) => t === "forward" ? e + 2 : n - e + 2 - 1, c = "";
	for (let t = 0; t < n; t++) {
		let n = s(t);
		c += Do(e, B`${zo}|\\k<(?<backref>[^>]+)>`, ({ 0: e, groups: { captureName: t, unnamed: s, backref: c } }) => {
			if (c && r && !r.has(c)) return e;
			let l = `_$${n}`;
			if (s || t) {
				let n = o + a.length + 1;
				return a.push(n), Go(i, n), s ? e : `(?<${t}${l}>`;
			}
			return B`\k<${c}${l}>`;
		}, z.DEFAULT);
	}
	return c;
}
function Go(e, t) {
	for (let n = 0; n < e.length; n++) e[n] >= t && e[n]++;
}
function Ko(e, t, n, r, i, a) {
	if (e.size && r) {
		let o = 0;
		Oo(t, zo, () => o++, z.DEFAULT);
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
// node_modules/.pnpm/oniguruma-to-es@4.3.6/node_modules/oniguruma-to-es/dist/esm/index.js
var H = String.fromCodePoint, U = String.raw, W = {}, qo = globalThis.RegExp;
W.flagGroups = (() => {
	try {
		new qo("(?i:)");
	} catch {
		return !1;
	}
	return !0;
})(), W.unicodeSets = (() => {
	try {
		new qo("[[]]", "v");
	} catch {
		return !1;
	}
	return !0;
})(), W.bugFlagVLiteralHyphenIsRange = W.unicodeSets ? (() => {
	try {
		new qo(U`[\d\-a]`, "v");
	} catch {
		return !0;
	}
	return !1;
})() : !1, W.bugNestedClassIgnoresNegation = W.unicodeSets && new qo("[[^a]]", "v").test("a");
function Jo(e, { enable: t, disable: n }) {
	return {
		dotAll: !n?.dotAll && !!(t?.dotAll || e.dotAll),
		ignoreCase: !n?.ignoreCase && !!(t?.ignoreCase || e.ignoreCase)
	};
}
function Yo(e, t, n) {
	return e.has(t) || e.set(t, n), e.get(t);
}
function Xo(e, t) {
	return Qo[e] >= Qo[t];
}
function Zo(e, t) {
	if (e == null) throw Error(t ?? "Value expected");
	return e;
}
var Qo = {
	ES2025: 2025,
	ES2024: 2024,
	ES2018: 2018
}, $o = {
	auto: "auto",
	ES2025: "ES2025",
	ES2024: "ES2024",
	ES2018: "ES2018"
};
function es(e = {}) {
	if ({}.toString.call(e) !== "[object Object]") throw Error("Unexpected options");
	if (e.target !== void 0 && !$o[e.target]) throw Error(`Unexpected target "${e.target}"`);
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
	return t.target === "auto" && (t.target = W.flagGroups ? "ES2025" : W.unicodeSets ? "ES2024" : "ES2018"), t;
}
var ts = "[	-\r ]", ns = /* @__PURE__ */ new Set([H(304), H(305)]), G = U`[\p{L}\p{M}\p{N}\p{Pc}]`;
function rs(e) {
	if (ns.has(e)) return [e];
	let t = /* @__PURE__ */ new Set(), n = e.toLowerCase(), r = n.toUpperCase(), i = ss.get(n), a = as.get(n), o = os.get(n);
	return [...r].length === 1 && t.add(r), o && t.add(o), i && t.add(i), t.add(n), a && t.add(a), [...t];
}
var is = /* @__PURE__ */ new Map("C Other\nCc Control cntrl\nCf Format\nCn Unassigned\nCo Private_Use\nCs Surrogate\nL Letter\nLC Cased_Letter\nLl Lowercase_Letter\nLm Modifier_Letter\nLo Other_Letter\nLt Titlecase_Letter\nLu Uppercase_Letter\nM Mark Combining_Mark\nMc Spacing_Mark\nMe Enclosing_Mark\nMn Nonspacing_Mark\nN Number\nNd Decimal_Number digit\nNl Letter_Number\nNo Other_Number\nP Punctuation punct\nPc Connector_Punctuation\nPd Dash_Punctuation\nPe Close_Punctuation\nPf Final_Punctuation\nPi Initial_Punctuation\nPo Other_Punctuation\nPs Open_Punctuation\nS Symbol\nSc Currency_Symbol\nSk Modifier_Symbol\nSm Math_Symbol\nSo Other_Symbol\nZ Separator\nZl Line_Separator\nZp Paragraph_Separator\nZs Space_Separator\nASCII\nASCII_Hex_Digit AHex\nAlphabetic Alpha\nAny\nAssigned\nBidi_Control Bidi_C\nBidi_Mirrored Bidi_M\nCase_Ignorable CI\nCased\nChanges_When_Casefolded CWCF\nChanges_When_Casemapped CWCM\nChanges_When_Lowercased CWL\nChanges_When_NFKC_Casefolded CWKCF\nChanges_When_Titlecased CWT\nChanges_When_Uppercased CWU\nDash\nDefault_Ignorable_Code_Point DI\nDeprecated Dep\nDiacritic Dia\nEmoji\nEmoji_Component EComp\nEmoji_Modifier EMod\nEmoji_Modifier_Base EBase\nEmoji_Presentation EPres\nExtended_Pictographic ExtPict\nExtender Ext\nGrapheme_Base Gr_Base\nGrapheme_Extend Gr_Ext\nHex_Digit Hex\nIDS_Binary_Operator IDSB\nIDS_Trinary_Operator IDST\nID_Continue IDC\nID_Start IDS\nIdeographic Ideo\nJoin_Control Join_C\nLogical_Order_Exception LOE\nLowercase Lower\nMath\nNoncharacter_Code_Point NChar\nPattern_Syntax Pat_Syn\nPattern_White_Space Pat_WS\nQuotation_Mark QMark\nRadical\nRegional_Indicator RI\nSentence_Terminal STerm\nSoft_Dotted SD\nTerminal_Punctuation Term\nUnified_Ideograph UIdeo\nUppercase Upper\nVariation_Selector VS\nWhite_Space space\nXID_Continue XIDC\nXID_Start XIDS".split(/\s/).map((e) => [yo(e), e])), as = /* @__PURE__ */ new Map([["s", H(383)], [H(383), "s"]]), os = /* @__PURE__ */ new Map([
	[H(223), H(7838)],
	[H(107), H(8490)],
	[H(229), H(8491)],
	[H(969), H(8486)]
]), ss = new Map([
	K(453),
	K(456),
	K(459),
	K(498),
	...us(8072, 8079),
	...us(8088, 8095),
	...us(8104, 8111),
	K(8124),
	K(8140),
	K(8188)
]), cs = /* @__PURE__ */ new Map([
	["alnum", U`[\p{Alpha}\p{Nd}]`],
	["alpha", U`\p{Alpha}`],
	["ascii", U`\p{ASCII}`],
	["blank", U`[\p{Zs}\t]`],
	["cntrl", U`\p{Cc}`],
	["digit", U`\p{Nd}`],
	["graph", U`[\P{space}&&\P{Cc}&&\P{Cn}&&\P{Cs}]`],
	["lower", U`\p{Lower}`],
	["print", U`[[\P{space}&&\P{Cc}&&\P{Cn}&&\P{Cs}]\p{Zs}]`],
	["punct", U`[\p{P}\p{S}]`],
	["space", U`\p{space}`],
	["upper", U`\p{Upper}`],
	["word", U`[\p{Alpha}\p{M}\p{Nd}\p{Pc}]`],
	["xdigit", U`\p{AHex}`]
]);
function ls(e, t) {
	let n = [];
	for (let r = e; r <= t; r++) n.push(r);
	return n;
}
function K(e) {
	let t = H(e);
	return [t.toLowerCase(), t];
}
function us(e, t) {
	return ls(e, t).map((e) => K(e));
}
var ds = /* @__PURE__ */ new Set([
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
function fs(e, t) {
	let n = {
		accuracy: "default",
		asciiWordBoundaries: !1,
		avoidSubclass: !1,
		bestEffortTarget: "ES2025",
		...t
	};
	gs(e);
	let r = {
		accuracy: n.accuracy,
		asciiWordBoundaries: n.asciiWordBoundaries,
		avoidSubclass: n.avoidSubclass,
		flagDirectivesByAlt: /* @__PURE__ */ new Map(),
		jsGroupNameMap: /* @__PURE__ */ new Map(),
		minTargetEs2024: Xo(n.bestEffortTarget, "ES2024"),
		passedLookbehind: !1,
		strategy: null,
		subroutineRefMap: /* @__PURE__ */ new Map(),
		supportedGNodes: /* @__PURE__ */ new Set(),
		digitIsAscii: e.flags.digitIsAscii,
		spaceIsAscii: e.flags.spaceIsAscii,
		wordIsAscii: e.flags.wordIsAscii
	};
	So(e, ps, r);
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
	return So(e, ms, a), So(e, hs, {
		groupsByName: a.groupsByName,
		highestOrphanBackref: 0,
		numCapturesToLeft: 0,
		reffedNodesByReferencer: a.reffedNodesByReferencer
	}), e._originMap = a.groupOriginByCopy, e._strategy = r.strategy, e;
}
var ps = {
	AbsenceFunction({ node: e, parent: t, replaceWith: n }) {
		let { body: r, kind: i } = e;
		if (i === "repeater") {
			let e = F();
			e.body[0].body.push(I({
				negate: !0,
				body: r
			}), L("Any"));
			let i = F();
			i.body[0].body.push(co("greedy", 0, Infinity, e)), n(Y(i, t), { traverse: !0 });
		} else throw Error("Unsupported absence function \"(?~|\"");
	},
	Alternative: {
		enter({ node: e, parent: t, key: n }, { flagDirectivesByAlt: r }) {
			let i = e.body.filter((e) => e.kind === "flags");
			for (let e = n + 1; e < t.body.length; e++) {
				let n = t.body[e];
				Yo(r, n, []).push(...i);
			}
		},
		exit({ node: e }, { flagDirectivesByAlt: t }) {
			if (t.get(e)?.length) {
				let n = Cs(t.get(e));
				if (n) {
					let t = F({ flags: n });
					t.body[0].body = e.body, e.body = [Y(t, e)];
				}
			}
		}
	},
	Assertion({ node: e, parent: t, key: n, container: r, root: i, remove: a, replaceWith: o }, s) {
		let { kind: c, negate: l } = e, { asciiWordBoundaries: u, avoidSubclass: d, supportedGNodes: f, wordIsAscii: p } = s;
		if (c === "text_segment_boundary") throw Error(`Unsupported text segment boundary "\\${l ? "Y" : "y"}"`);
		if (c === "line_end") o(Y(I({ body: [P({ body: [Za("string_end")] }), P({ body: [eo(10)] })] }), t));
		else if (c === "line_start") o(Y(q(U`(?<=\A|\n(?!\z))`, { skipLookbehindValidation: !0 }), t));
		else if (c === "search_start") {
			if (f.has(e)) i.flags.sticky = !0, a();
			else {
				let e = r[n - 1];
				if (e && ks(e)) o(Y(I({ negate: !0 }), t));
				else if (d) throw Error(U`Uses "\G" in a way that requires a subclass`);
				else o(J(Za("string_start"), t)), s.strategy = "clip_search";
			}
		} else if (c !== "string_end" && c !== "string_start") {
			if (c === "string_end_newline") o(Y(q(U`(?=\n?\z)`), t));
			else if (c === "word_boundary") {
				if (!p && !u) {
					let e = `(?:(?<=${G})(?!${G})|(?<!${G})(?=${G}))`, n = `(?:(?<=${G})(?=${G})|(?<!${G})(?!${G}))`;
					o(Y(q(l ? n : e), t));
				}
			} else throw Error(`Unexpected assertion kind "${c}"`);
		}
	},
	Backreference({ node: e }, { jsGroupNameMap: t }) {
		let { ref: n } = e;
		typeof n == "string" && !js(n) && (n = Ss(n, t), e.ref = n);
	},
	CapturingGroup({ node: e }, { jsGroupNameMap: t, subroutineRefMap: n }) {
		let { name: r } = e;
		r && !js(r) && (r = Ss(r, t), e.name = r), n.set(e.number, e), r && n.set(r, e);
	},
	CharacterClassRange({ node: e, parent: t, replaceWith: n }) {
		t.kind === "intersection" && n(Y(to({ body: [e] }), t), { traverse: !0 });
	},
	CharacterSet({ node: e, parent: t, replaceWith: n }, { accuracy: r, minTargetEs2024: i, digitIsAscii: a, spaceIsAscii: o, wordIsAscii: s }) {
		let { kind: c, negate: l, value: u } = e;
		if (a && (c === "digit" || u === "digit")) n(J(ro("digit", { negate: l }), t));
		else if (o && (c === "space" || u === "space")) n(Y(Ms(q(ts), l), t));
		else if (s && (c === "word" || u === "word")) n(J(ro("word", { negate: l }), t));
		else if (c === "any") n(J(L("Any"), t));
		else if (c === "digit") n(J(L("Nd", { negate: l }), t));
		else if (c !== "dot") {
			if (c === "text_segment") {
				if (r === "strict") throw Error(U`Use of "\X" requires non-strict accuracy`);
				let e = "\\p{Emoji}(?:\\p{EMod}|\\uFE0F\\u20E3?|[\\x{E0020}-\\x{E007E}]+\\x{E007F})?", a = U`\p{RI}{2}|${e}(?:\u200D${e})*`;
				n(Y(q(U`(?>\r\n|${i ? U`\p{RGI_Emoji}` : a}|\P{M}\p{M}*)`, { skipPropertyNameValidation: !0 }), t));
			} else if (c === "hex") n(J(L("AHex", { negate: l }), t));
			else if (c === "newline") n(Y(q(l ? "[^\n]" : "(?>\r\n?|[\n\v\f\u2028\u2029])"), t));
			else if (c === "posix") {
				if (!i && (u === "graph" || u === "print")) {
					if (r === "strict") throw Error(`POSIX class "${u}" requires min target ES2024 or non-strict accuracy`);
					let e = {
						graph: "!-~",
						print: " -~"
					}[u];
					l && (e = `\0-${H(e.codePointAt(0) - 1)}${H(e.codePointAt(2) + 1)}-\u{10FFFF}`), n(Y(q(`[${e}]`), t));
				} else n(Y(Ms(q(cs.get(u)), l), t));
			} else if (c === "property") is.has(yo(u)) || (e.key = "sc");
			else if (c === "space") n(J(L("space", { negate: l }), t));
			else if (c === "word") n(Y(Ms(q(G), l), t));
			else throw Error(`Unexpected character set kind "${c}"`);
		}
	},
	Directive({ node: e, parent: t, root: n, remove: r, replaceWith: i, removeAllPrevSiblings: a, removeAllNextSiblings: o }) {
		let { kind: s, flags: c } = e;
		if (s === "flags") {
			if (!c.enable && !c.disable) r();
			else {
				let e = F({ flags: c });
				e.body[0].body = o(), i(Y(e, t), { traverse: !0 });
			}
		} else if (s === "keep") {
			let e = n.body[0], r = n.body.length === 1 && Ra(e, { type: "Group" }) && e.body[0].body.length === 1 ? e.body[0] : n;
			if (t.parent !== r || r.body.length > 1) throw Error(U`Uses "\K" in a way that's unsupported`);
			let o = I({ behind: !0 });
			o.body[0].body = a(), i(Y(o, t));
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
		if (r === "fail") n(Y(I({ negate: !0 }), t));
		else throw Error(`Unsupported named callout "(*${r.toUpperCase()}"`);
	},
	Quantifier({ node: e }) {
		if (e.body.type === "Quantifier") {
			let t = F();
			t.body[0].body.push(e.body), e.body = Y(t, e);
		}
	},
	Regex: {
		enter({ node: e }, { supportedGNodes: t }) {
			let n = [], r = !1, i = !1;
			for (let t of e.body) if (t.body.length === 1 && t.body[0].kind === "search_start") t.body.pop();
			else {
				let e = Es(t.body);
				e ? (r = !0, Array.isArray(e) ? n.push(...e) : n.push(e)) : i = !0;
			}
			r && !i && n.forEach((e) => t.add(e));
		},
		exit(e, { accuracy: t, passedLookbehind: n, strategy: r }) {
			if (t === "strict" && n && r) throw Error(U`Uses "\G" in a way that requires non-strict accuracy`);
		}
	},
	Subroutine({ node: e }, { jsGroupNameMap: t }) {
		let { ref: n } = e;
		typeof n == "string" && !js(n) && (n = Ss(n, t), e.ref = n);
	}
}, ms = {
	Backreference({ node: e }, { multiplexCapturesToLeftByRef: t, reffedNodesByReferencer: n }) {
		let { orphan: r, ref: i } = e;
		r || n.set(e, [...t.get(i).map(({ node: e }) => e)]);
	},
	CapturingGroup: {
		enter({ node: e, parent: t, replaceWith: n, skip: r }, { groupOriginByCopy: i, groupsByName: a, multiplexCapturesToLeftByRef: o, openRefs: s, reffedNodesByReferencer: c }) {
			let l = i.get(e);
			if (l && s.has(e.number)) {
				let r = J(bs(e.number), t);
				c.set(r, s.get(e.number)), n(r);
				return;
			}
			s.set(e.number, e), o.set(e.number, []), e.name && Yo(o, e.name, []);
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
				let t = Yo(a, e.name, /* @__PURE__ */ new Map()), n = !1;
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
			t.prevFlags = t.currentFlags, e.flags && (t.currentFlags = Jo(t.currentFlags, e.flags));
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
		let o = r.subroutineRefMap.get(a), s = a === 0, c = s ? bs(0) : ys(o, r.groupOriginByCopy, null), l = c;
		if (!s) {
			let e = Cs(xs(o, (e) => e.type === "Group" && !!e.flags)), t = e ? Jo(r.globalFlags, e) : r.globalFlags;
			_s(t, r.currentFlags) || (l = F({ flags: ws(t) }), l.body[0].body.push(c));
		}
		n(Y(l, t), { traverse: !s });
	}
}, hs = {
	Backreference({ node: e, parent: t, replaceWith: n }, r) {
		if (e.orphan) {
			r.highestOrphanBackref = Math.max(r.highestOrphanBackref, e.ref);
			return;
		}
		let i = r.reffedNodesByReferencer.get(e).filter((t) => vs(t, e));
		i.length ? i.length > 1 ? n(Y(F({
			atomic: !0,
			body: i.reverse().map((e) => P({ body: [Qa(e.number)] }))
		}), t)) : e.ref = i[0].number : n(Y(I({ negate: !0 }), t));
	},
	CapturingGroup({ node: e }, t) {
		e.number = ++t.numCapturesToLeft, e.name && t.groupsByName.get(e.name).get(e).hasDuplicateNameToRemove && delete e.name;
	},
	Regex: { exit({ node: e }, t) {
		let n = Math.max(t.highestOrphanBackref - t.numCapturesToLeft, 0);
		for (let t = 0; t < n; t++) {
			let t = $a();
			e.body.at(-1).body.push(t);
		}
	} },
	Subroutine({ node: e }, t) {
		e.isRecursive && e.ref !== 0 && (e.ref = t.reffedNodesByReferencer.get(e).number);
	}
};
function gs(e) {
	So(e, { "*"({ node: e, parent: t }) {
		e.parent = t;
	} });
}
function _s(e, t) {
	return e.dotAll === t.dotAll && e.ignoreCase === t.ignoreCase;
}
function vs(e, t) {
	let n = t;
	do {
		if (n.type === "Regex") return !1;
		if (n.type === "Alternative") continue;
		if (n === e) return !1;
		let t = Ts(n.parent);
		for (let r of t) {
			if (r === n) break;
			if (r === e || Ds(r, e)) return !0;
		}
	} while (n = n.parent);
	throw Error("Unexpected path");
}
function ys(e, t, n, r) {
	let i = Array.isArray(e) ? [] : {};
	for (let [a, o] of Object.entries(e)) a === "parent" ? i.parent = Array.isArray(n) ? r : n : o && typeof o == "object" ? i[a] = ys(o, t, i, n) : (a === "type" && o === "CapturingGroup" && t.set(i, t.get(e) ?? e), i[a] = o);
	return i;
}
function bs(e) {
	let t = uo(e);
	return t.isRecursive = !0, t;
}
function xs(e, t) {
	let n = [];
	for (; e = e.parent;) (!t || t(e)) && n.push(e);
	return n;
}
function Ss(e, t) {
	if (t.has(e)) return t.get(e);
	let n = `$${t.size}_${e.replace(/^[^$_\p{IDS}]|[^$\u200C\u200D\p{IDC}]/gu, "_")}`;
	return t.set(e, n), n;
}
function Cs(e) {
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
function ws({ dotAll: e, ignoreCase: t }) {
	let n = {};
	return (e || t) && (n.enable = {}, e && (n.enable.dotAll = !0), t && (n.enable.ignoreCase = !0)), e && t || (n.disable = {}, !e && (n.disable.dotAll = !0), !t && (n.disable.ignoreCase = !0)), n;
}
function Ts(e) {
	if (!e) throw Error("Node expected");
	let { body: t } = e;
	return Array.isArray(t) ? t : t ? [t] : null;
}
function Es(e) {
	let t = e.find((e) => e.kind === "search_start" || As(e, { negate: !1 }) || !Os(e));
	if (!t) return null;
	if (t.kind === "search_start") return t;
	if (t.type === "LookaroundAssertion") return t.body[0].body[0];
	if (t.type === "CapturingGroup" || t.type === "Group") {
		let e = [];
		for (let n of t.body) {
			let t = Es(n.body);
			if (!t) return null;
			Array.isArray(t) ? e.push(...t) : e.push(t);
		}
		return e;
	}
	return null;
}
function Ds(e, t) {
	let n = Ts(e) ?? [];
	for (let e of n) if (e === t || Ds(e, t)) return !0;
	return !1;
}
function Os({ type: e }) {
	return e === "Assertion" || e === "Directive" || e === "LookaroundAssertion";
}
function ks(e) {
	let t = [
		"Character",
		"CharacterClass",
		"CharacterSet"
	];
	return t.includes(e.type) || e.type === "Quantifier" && e.min && t.includes(e.body.type);
}
function As(e, t) {
	let n = {
		negate: null,
		...t
	};
	return e.type === "LookaroundAssertion" && (n.negate === null || e.negate === n.negate) && e.body.length === 1 && Ra(e.body[0], {
		type: "Assertion",
		kind: "search_start"
	});
}
function js(e) {
	return /^[$_\p{IDS}][$\u200C\u200D\p{IDC}]*$/u.test(e);
}
function q(e, t) {
	let n = Va(e, {
		...t,
		unicodePropertyMap: is
	}).body;
	return n.length > 1 || n[0].body.length > 1 ? F({ body: n }) : n[0].body[0];
}
function Ms(e, t) {
	return e.negate = t, e;
}
function J(e, t) {
	return e.parent = t, e;
}
function Y(e, t) {
	return gs(e), e.parent = t, e;
}
function Ns(e, t) {
	let n = es(t), r = Xo(n.target, "ES2024"), i = Xo(n.target, "ES2025"), a = n.rules.recursionLimit;
	if (!Number.isInteger(a) || a < 2 || a > 20) throw Error("Invalid recursionLimit; use 2-20");
	let o = null, s = null;
	if (!i) {
		let t = [e.flags.ignoreCase];
		So(e, Ps, {
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
		return u.lastNode = l, l = e, Zo(Fs[e.type], `Unexpected node type "${e.type}"`)(e, u, d);
	}
	let f = {
		pattern: e.body.map(d).join("|"),
		flags: d(e.flags),
		options: { ...e.options }
	};
	return r || (delete f.options.force.v, f.options.disable.v = !0, f.options.unicodeSetsPlugin = null), f._captureTransfers = /* @__PURE__ */ new Map(), f._hiddenCaptures = [], u.captureMap.forEach((e, t) => {
		e.hidden && f._hiddenCaptures.push(t), e.transferTo && Yo(f._captureTransfers, e.transferTo, []).push(t);
	}), f;
}
var Ps = {
	"*": {
		enter({ node: e }, t) {
			if (Ks(e)) {
				let n = t.getCurrentModI();
				t.pushModI(e.flags ? Jo({ ignoreCase: n }, e.flags).ignoreCase : n);
			}
		},
		exit({ node: e }, t) {
			Ks(e) && t.popModI();
		}
	},
	Backreference(e, t) {
		t.setHasCasedChar();
	},
	Character({ node: e }, t) {
		Vs(H(e.value)) && t.setHasCasedChar();
	},
	CharacterClassRange({ node: e, skip: t }, n) {
		t(), Hs(e, { firstOnly: !0 }).length && n.setHasCasedChar();
	},
	CharacterSet({ node: e }, t) {
		e.kind === "property" && ds.has(e.value) && t.setHasCasedChar();
	}
}, Fs = {
	Alternative({ body: e }, t, n) {
		return e.map(n).join("");
	},
	Assertion({ kind: e, negate: t }) {
		if (e === "string_end") return "$";
		if (e === "string_start") return "^";
		if (e === "word_boundary") return t ? U`\B` : U`\b`;
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
		let n = H(e), r = X(e, {
			escDigit: t.lastNode.type === "Backreference",
			inCharClass: t.inCharClass,
			useFlagV: t.useFlagV
		});
		if (r !== n) return r;
		if (t.useAppliedIgnoreCase && t.currentFlags.ignoreCase && Vs(n)) {
			let e = rs(n);
			return t.inCharClass ? e.join("") : e.length > 1 ? `[${e.join("")}]` : e[0];
		}
		return n;
	},
	CharacterClass(e, t, n) {
		let { kind: r, negate: i, parent: a } = e, { body: o } = e;
		if (r === "intersection" && !t.useFlagV) throw Error("Use of character class intersection requires min target ES2024");
		W.bugFlagVLiteralHyphenIsRange && t.useFlagV && o.some(Js) && (o = [eo(45), ...o.filter((e) => !Js(e))]);
		let s = () => `[${i ? "^" : ""}${o.map(n).join(r === "intersection" ? "&&" : "")}]`;
		if (!t.inCharClass) {
			if ((!t.useFlagV || W.bugNestedClassIgnoresNegation) && !i) {
				let t = o.filter((e) => e.type === "CharacterClass" && e.kind === "union" && e.negate);
				if (t.length) {
					let r = F(), i = r.body[0];
					return r.parent = a, i.parent = r, o = o.filter((e) => !t.includes(e)), e.body = o, o.length ? (e.parent = i, i.body.push(e)) : r.body.pop(), t.forEach((e) => {
						let t = P({ body: [e] });
						e.parent = t, t.parent = r, r.body.push(t);
					}), n(r);
				}
			}
			t.inCharClass = !0;
			let r = s();
			return t.inCharClass = !1, r;
		}
		let c = o[0];
		if (r === "union" && !i && c && ((!t.useFlagV || !t.verbose) && a.kind === "union" && !(W.bugFlagVLiteralHyphenIsRange && t.useFlagV) || !t.verbose && a.kind === "intersection" && o.length === 1 && c.type !== "CharacterClassRange")) return o.map(n).join("");
		if (!t.useFlagV && a.type === "CharacterClass") throw Error("Uses nested character class in a way that requires min target ES2024");
		return s();
	},
	CharacterClassRange(e, t) {
		let n = e.min.value, r = e.max.value, i = {
			escDigit: !1,
			inCharClass: !0,
			useFlagV: t.useFlagV
		}, a = X(n, i), o = X(r, i), s = /* @__PURE__ */ new Set();
		return t.useAppliedIgnoreCase && t.currentFlags.ignoreCase && Us(Hs(e)).forEach((e) => {
			s.add(Array.isArray(e) ? `${X(e[0], i)}-${X(e[1], i)}` : X(e, i));
		}), `${a}-${o}${[...s].join("")}`;
	},
	CharacterSet({ kind: e, negate: t, value: n, key: r }, i) {
		if (e === "dot") return i.currentFlags.dotAll ? i.appliedGlobalFlags.dotAll || i.useFlagMods ? "." : "[^]" : U`[^\n]`;
		if (e === "digit") return t ? U`\D` : U`\d`;
		if (e === "property") {
			if (i.useAppliedIgnoreCase && i.currentFlags.ignoreCase && ds.has(n)) throw Error(`Unicode property "${n}" can't be case-insensitive when other chars have specific case`);
			return `${t ? U`\P` : U`\p`}{${r ? `${r}=` : ""}${n}}`;
		}
		if (e === "word") return t ? U`\W` : U`\w`;
		throw Error(`Unexpected character set kind "${e}"`);
	},
	Flags(e, t) {
		return (t.appliedGlobalFlags.ignoreCase ? "i" : "") + (e.dotAll ? "s" : "") + (e.sticky ? "y" : "");
	},
	Group({ atomic: e, body: t, flags: n, parent: r }, i, a) {
		let o = i.currentFlags;
		n && (i.currentFlags = Jo(o, n));
		let s = t.map(a).join("|"), c = !i.verbose && t.length === 1 && r.type !== "Quantifier" && !e && (!i.useFlagMods || !n) ? s : `(?${Ws(e, n, i.useFlagMods)}${s})`;
		return i.currentFlags = o, c;
	},
	LookaroundAssertion({ body: e, kind: t, negate: n }, r, i) {
		return `(?${`${t === "lookahead" ? "" : "<"}${n ? "!" : "="}`}${e.map(i).join("|")})`;
	},
	Quantifier(e, t, n) {
		return n(e.body) + Gs(e);
	},
	Subroutine({ isRecursive: e, ref: t }, n) {
		if (!e) throw Error("Unexpected non-recursive subroutine in transformed AST");
		let r = n.recursionLimit;
		return t === 0 ? `(?R=${r})` : U`\g<${t}&R=${r}>`;
	}
}, Is = /* @__PURE__ */ new Set([
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
]), Ls = /* @__PURE__ */ new Set([
	"-",
	"\\",
	"]",
	"^",
	"["
]), Rs = /* @__PURE__ */ new Set(/* @__PURE__ */ "()-/[\\]^{|}!#$%&*+,.:;<=>?@`~".split("")), zs = /* @__PURE__ */ new Map([
	[9, U`\t`],
	[10, U`\n`],
	[11, U`\v`],
	[12, U`\f`],
	[13, U`\r`],
	[8232, U`\u2028`],
	[8233, U`\u2029`],
	[65279, U`\uFEFF`]
]), Bs = /^\p{Cased}$/u;
function Vs(e) {
	return Bs.test(e);
}
function Hs(e, t) {
	let n = !!t?.firstOnly, r = e.min.value, i = e.max.value, a = [];
	if (r < 65 && (i === 65535 || i >= 131071) || r === 65536 && i >= 131071) return a;
	for (let e = r; e <= i; e++) {
		let t = H(e);
		if (!Vs(t)) continue;
		let o = rs(t).filter((e) => {
			let t = e.codePointAt(0);
			return t < r || t > i;
		});
		if (o.length && (a.push(...o), n)) break;
	}
	return a;
}
function X(e, { escDigit: t, inCharClass: n, useFlagV: r }) {
	if (zs.has(e)) return zs.get(e);
	if (e < 32 || e > 126 && e < 160 || e > 262143 || t && qs(e)) return e > 255 ? `\\u{${e.toString(16).toUpperCase()}}` : `\\x${e.toString(16).toUpperCase().padStart(2, "0")}`;
	let i = n ? r ? Rs : Ls : Is, a = H(e);
	return (i.has(a) ? "\\" : "") + a;
}
function Us(e) {
	let t = e.map((e) => e.codePointAt(0)).sort((e, t) => e - t), n = [], r = null;
	for (let e = 0; e < t.length; e++) t[e + 1] === t[e] + 1 ? r ??= t[e] : r === null ? n.push(t[e]) : (n.push([r, t[e]]), r = null);
	return n;
}
function Ws(e, t, n) {
	if (e) return ">";
	let r = "";
	if (t && n) {
		let { enable: e, disable: n } = t;
		r = (e?.ignoreCase ? "i" : "") + (e?.dotAll ? "s" : "") + (n ? "-" : "") + (n?.ignoreCase ? "i" : "") + (n?.dotAll ? "s" : "");
	}
	return `${r}:`;
}
function Gs({ kind: e, max: t, min: n }) {
	let r;
	return r = !n && t === 1 ? "?" : !n && t === Infinity ? "*" : n === 1 && t === Infinity ? "+" : n === t ? `{${n}}` : `{${n},${t === Infinity ? "" : t}}`, r + {
		greedy: "",
		lazy: "?",
		possessive: "+"
	}[e];
}
function Ks({ type: e }) {
	return e === "CapturingGroup" || e === "Group" || e === "LookaroundAssertion";
}
function qs(e) {
	return e > 47 && e < 58;
}
function Js({ type: e, value: t }) {
	return e === "Character" && t === 45;
}
var Ys = class e extends RegExp {
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
			super(i ? "" : t, n), this.#n = t, this.#e = Zs(e.hiddenCaptures, e.transfers), this.#i = e.strategy, this.rawOptions = r ?? {};
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
			return e && (Xs(e, r, t, this.hasIndices), this.lastIndex += r), e;
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
					this.#r ||= Qs(this.source);
					let i = this.#r.get(o);
					i && (t.groups[i] = n[e], this.hasIndices && (t.indices.groups[i] = r[e]));
				}
			}
		}
		return t;
	}
};
function Xs(e, t, n, r) {
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
function Zs(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let t of e) n.set(t, { hidden: !0 });
	for (let [e, r] of t) for (let t of r) Yo(n, t, {}).transferTo = e;
	return n;
}
function Qs(e) {
	let t = /(?<capture>\((?:\?<(?![=!])(?<name>[^>]+)>|(?!\?)))|\\?./gsu, n = /* @__PURE__ */ new Map(), r = 0, i = 0, a;
	for (; a = t.exec(e);) {
		let { 0: e, groups: { capture: t, name: o } } = a;
		e === "[" ? r++ : r ? e === "]" && r-- : t && (i++, o && n.set(i, o));
	}
	return n;
}
function $s(e, t) {
	let n = ec(e, t);
	return n.options ? new Ys(n.pattern, n.flags, n.options) : new RegExp(n.pattern, n.flags);
}
function ec(e, t) {
	let n = es(t), r = fs(Va(e, {
		flags: n.flags,
		normalizeUnknownPropertyNames: !0,
		rules: {
			captureGroup: n.rules.captureGroup,
			singleline: n.rules.singleline
		},
		skipBackrefValidation: n.rules.allowOrphanBackrefs,
		unicodePropertyMap: is
	}), {
		accuracy: n.accuracy,
		asciiWordBoundaries: n.rules.asciiWordBoundaries,
		avoidSubclass: n.avoidSubclass,
		bestEffortTarget: n.target
	}), i = Ns(r, n), a = Vo(i.pattern, {
		captureTransfers: i._captureTransfers,
		hiddenCaptures: i._hiddenCaptures,
		mode: "external"
	}), o = No(Io(a.pattern).pattern, {
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
// node_modules/.pnpm/@shikijs+engine-javascript@3.23.0/node_modules/@shikijs/engine-javascript/dist/shared/engine-javascript.hzpS1_41.mjs
var tc = 4294967295, nc = class {
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
					start: tc,
					end: tc,
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
// node_modules/.pnpm/@shikijs+engine-javascript@3.23.0/node_modules/@shikijs/engine-javascript/dist/engine-compile.mjs
function rc(e, t) {
	return $s(e, {
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
function ic(e = {}) {
	let t = Object.assign({
		target: "auto",
		cache: /* @__PURE__ */ new Map()
	}, e);
	return t.regexConstructor ||= (e) => rc(e, { target: t.target }), {
		createScanner(e) {
			return new nc(e, t);
		},
		createString(e) {
			return { content: e };
		}
	};
}
// node_modules/.pnpm/streamdown@1.6.11_@types+md_13d1dcdcccaec74f58050397b5bc50a5/node_modules/streamdown/dist/code-block-IT6T5CEO.js
var Z = /* @__PURE__ */ e(m(), 1), Q = p(), ac = n("block", "before:content-[counter(line)]", "before:inline-block", "before:[counter-increment:line]", "before:w-4", "before:mr-4", "before:text-[13px]", "before:text-right", "before:text-muted-foreground/50", "before:font-mono", "before:select-none"), oc = (0, Z.memo)(({ children: e, result: t, language: r, className: i, ...a }) => {
	let o = (0, Z.useMemo)(() => ({
		backgroundColor: t.bg,
		color: t.fg
	}), [t.bg, t.fg]);
	return (0, Q.jsx)("pre", {
		className: n(i, "p-4 text-sm dark:bg-(--shiki-dark-bg)!"),
		"data-language": r,
		"data-streamdown": "code-block-body",
		style: o,
		...a,
		children: (0, Q.jsx)("code", {
			className: "[counter-increment:line_0] [counter-reset:line]",
			children: t.tokens.map((e, t) => (0, Q.jsx)("span", {
				className: ac,
				children: e.map((e, t) => (0, Q.jsx)("span", {
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
}, (e, t) => e.result === t.result && e.language === t.language && e.className === t.className), sc = ({ className: e, language: t, style: r, ...i }) => (0, Q.jsx)("div", {
	className: n("my-4 w-full overflow-hidden rounded-xl border border-border", e),
	"data-language": t,
	"data-streamdown": "code-block",
	style: {
		contentVisibility: "auto",
		containIntrinsicSize: "auto 200px",
		...r
	},
	...i
}), cc = ({ language: e, children: t }) => (0, Q.jsxs)("div", {
	className: "flex items-center justify-between bg-muted/80 p-3 text-muted-foreground text-xs",
	"data-language": e,
	"data-streamdown": "code-block-header",
	children: [(0, Q.jsx)("span", {
		className: "ml-1 font-mono lowercase",
		children: e
	}), (0, Q.jsx)("div", {
		className: "flex items-center gap-2",
		children: t
	})]
}), lc = ic({ forgiving: !0 }), uc = /* @__PURE__ */ new Map(), dc = /* @__PURE__ */ new Map(), $ = /* @__PURE__ */ new Map(), fc = (e, t) => `${e}-${t[0]}-${t[1]}`, pc = (e, t, n) => {
	let r = e.slice(0, 100), i = e.length > 100 ? e.slice(-100) : "";
	return `${t}:${n[0]}:${n[1]}:${e.length}:${r}:${i}`;
}, mc = (e) => Object.hasOwn(xi, e), hc = (e, t) => {
	let n = mc(e) ? e : "text", r = fc(n, t);
	if (uc.has(r)) return uc.get(r);
	let i = Ki({
		themes: t,
		langs: [n],
		engine: lc
	});
	return uc.set(r, i), i;
}, gc = (e, t, n, r) => {
	let i = mc(t) ? t : "text", a = pc(e, i, n);
	return dc.has(a) ? dc.get(a) : (r && ($.has(a) || $.set(a, /* @__PURE__ */ new Set()), $.get(a).add(r)), hc(i, n).then((t) => {
		let r = t.codeToTokens(e, {
			lang: i,
			themes: {
				light: n[0],
				dark: n[1]
			}
		});
		dc.set(a, r);
		let o = $.get(a);
		if (o) {
			for (let e of o) e(r);
			$.delete(a);
		}
	}).catch((e) => {
		console.error("Failed to highlight code:", e), $.delete(a);
	}), null);
}, _c = ({ code: e, language: t, className: n, children: r, ...i }) => {
	let { shikiTheme: a } = (0, Z.useContext)(d), o = (0, Z.useMemo)(() => ({
		bg: "transparent",
		fg: "inherit",
		tokens: e.split("\n").map((e) => [{
			content: e,
			color: "inherit",
			bgColor: "transparent",
			htmlStyle: {},
			offset: 0
		}])
	}), [e]), [s, l] = (0, Z.useState)(o);
	return (0, Z.useEffect)(() => {
		let n = gc(e, t, a);
		n ? l(n) : gc(e, t, a, (e) => {
			l(e);
		});
	}, [
		e,
		t,
		a
	]), (0, Q.jsx)(c.Provider, {
		value: { code: e },
		children: (0, Q.jsxs)(sc, {
			language: t,
			children: [(0, Q.jsx)(cc, {
				language: t,
				children: r
			}), (0, Q.jsx)(oc, {
				className: n,
				language: t,
				result: s,
				...i
			})]
		})
	});
};
export { _c as CodeBlock };
