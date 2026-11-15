import { i as e, t } from "./rolldown-runtime-CwxnZyOB.js";
import { n, t as r } from "./chunk-PWAF6VOD-CLCyHegk.js";
import { a as i } from "./chunk-75Z2AOVW-B3672j4f.js";
import { A as a, F as o, b as s, s as c, z as l } from "./chunk-DU6HZSFF-BBp-hRRt.js";
import { n as u, t as d } from "./d3-selection-D2S8w1Dl.js";
import { n as f } from "./chunk-Y2CYZVJY-BKLaWZ8G.js";
import { t as p } from "./marked.esm-CtHC1YRh.js";
// node_modules/.pnpm/fastdom@1.0.12/node_modules/fastdom/fastdom.js
var m = /* @__PURE__ */ t(((e, t, n) => {
	(function(e) {
		var n = e.requestAnimationFrame || e.webkitRequestAnimationFrame || e.mozRequestAnimationFrame || e.msRequestAnimationFrame || function(e) {
			return setTimeout(e, 16);
		};
		function r() {
			var t = this;
			t.reads = [], t.writes = [], t.raf = n.bind(e);
		}
		r.prototype = {
			constructor: r,
			runTasks: function(e) {
				for (var t; t = e.shift();) t();
			},
			measure: function(e, t) {
				var n = t ? e.bind(t) : e;
				return this.reads.push(n), i(this), n;
			},
			mutate: function(e, t) {
				var n = t ? e.bind(t) : e;
				return this.writes.push(n), i(this), n;
			},
			clear: function(e) {
				return o(this.reads, e) || o(this.writes, e);
			},
			extend: function(e) {
				if (typeof e != "object") throw Error("expected object");
				var t = Object.create(this);
				return s(t, e), t.fastdom = this, t.initialize && t.initialize(), t;
			},
			catch: null
		};
		function i(e) {
			e.scheduled || (e.scheduled = !0, e.raf(a.bind(null, e)));
		}
		function a(e) {
			var t = e.writes, n = e.reads, r;
			try {
				n.length, e.runTasks(n), t.length, e.runTasks(t);
			} catch (e) {
				r = e;
			}
			if (e.scheduled = !1, (n.length || t.length) && i(e), r) {
				if (r.message, e.catch) e.catch(r);
				else throw r;
			}
		}
		function o(e, t) {
			var n = e.indexOf(t);
			return !!~n && !!e.splice(n, 1);
		}
		function s(e, t) {
			for (var n in t) t.hasOwnProperty(n) && (e[n] = t[n]);
		}
		var c = e.fastdom = e.fastdom || new r();
		typeof define == "function" ? define(function() {
			return c;
		}) : typeof t == "object" && (t.exports = c);
	})(typeof window < "u" ? window : n === void 0 ? globalThis : n);
})), h = /* @__PURE__ */ t(((e, t) => {
	(function() {
		var e = {
			initialize: function() {
				this._tasks = /* @__PURE__ */ new Map();
			},
			mutate: function(e, t) {
				return n(this, "mutate", e, t);
			},
			measure: function(e, t) {
				return n(this, "measure", e, t);
			},
			clear: function(e) {
				var t = this._tasks, n = t.get(e);
				this.fastdom.clear(n), t.delete(e);
			}
		};
		function n(e, t, n, r) {
			var i = e._tasks, a = e.fastdom, o, s = new Promise(function(e, c) {
				o = a[t](function() {
					i.delete(s);
					try {
						e(r ? n.call(r) : n());
					} catch (e) {
						c(e);
					}
				}, r);
			});
			return i.set(s, o), s;
		}
		(typeof define)[0] == "f" ? define(function() {
			return e;
		}) : (typeof t)[0] == "o" ? t.exports = e : window.fastdomPromised = e;
	})();
})), g = /* @__PURE__ */ e(m(), 1), _ = /* @__PURE__ */ e(h(), 1);
function v(e) {
	var t = [...arguments].slice(1), n = Array.from(typeof e == "string" ? [e] : e);
	n[n.length - 1] = n[n.length - 1].replace(/\r?\n([\t ]*)$/, "");
	var r = n.reduce(function(e, t) {
		var n = t.match(/\n([\t ]+|(?!\s).)/g);
		return n ? e.concat(n.map(function(e) {
			return e.match(/[\t ]/g)?.length ?? 0;
		})) : e;
	}, []);
	if (r.length) {
		var i = RegExp(`
[	 ]{${Math.min.apply(Math, r)}}`, "g");
		n = n.map(function(e) {
			return e.replace(i, "\n");
		});
	}
	n[0] = n[0].replace(/^\r?\n/, "");
	var a = n[0];
	return t.forEach(function(e, t) {
		var r = a.match(/(?:^|\n)( *)$/), i = r ? r[1] : "", o = e;
		typeof e == "string" && e.includes("\n") && (o = String(e).split("\n").map(function(e, t) {
			return t === 0 ? e : `${i}${e}`;
		}).join("\n")), a += o + n[t + 1];
	}), a;
}
// node_modules/.pnpm/mermaid@11.17.2/node_modules/mermaid/dist/chunks/mermaid.core/chunk-GMAD6QVW.mjs
var y = typeof performance < "u" && typeof performance.now == "function", b = /* @__PURE__ */ f(() => y ? performance.now() : 0, "now"), x = "🧜 ", S = "Mermaid render", C = "Mermaid", w = {
	parse: "tertiary",
	prepare: "secondary",
	measure: "primary",
	layout: "primary-dark",
	layoutCore: "error",
	draw: "primary-light",
	paint: "secondary-dark",
	serialize: "tertiary-dark",
	render: "primary-light"
};
(class {
	constructor() {
		this.enabled = !1, this.autoPrint = !0, this.records = [], this.maxRecords = 200, this.roots = [], this.stack = [], this.buckets = {};
	}
	static {
		f(this, "Profiler");
	}
	enable() {
		return this.enabled = !0, this;
	}
	disable() {
		return this.enabled = !1, this;
	}
	start(e) {
		this.enabled && (this.roots = [], this.stack = [], this.buckets = {}, this.begin(e));
	}
	tickSync(e, t) {
		if (!this.enabled) return t();
		let n = b();
		try {
			return t();
		} finally {
			this.buckets[e] = (this.buckets[e] ?? 0) + (b() - n);
		}
	}
	async tick(e, t) {
		if (!this.enabled) return t();
		let n = b();
		try {
			return await t();
		} finally {
			this.buckets[e] = (this.buckets[e] ?? 0) + (b() - n);
		}
	}
	stop() {
		if (!this.enabled) return;
		for (; this.stack.length > 0;) this.end();
		let e = this.roots.at(-1), t = this.runLabel ?? e?.name;
		return e && (this.records.push({
			label: t ?? e.name,
			tree: e,
			buckets: { ...this.buckets }
		}), this.records.length > this.maxRecords && this.records.splice(0, this.records.length - this.maxRecords), this.autoPrint && this.printSummary(e, t)), this.runLabel = void 0, e;
	}
	begin(e) {
		if (!this.enabled) return;
		let t = {
			name: e,
			start: b(),
			duration: -1,
			children: []
		}, n = this.stack.at(-1);
		if (n ? n.children.push(t) : this.roots.push(t), this.stack.push(t), y && typeof performance.mark == "function") try {
			performance.mark(`${x}${e} \u25B6`);
		} catch {}
	}
	end() {
		if (!this.enabled) return;
		let e = this.stack.pop();
		if (!e) return;
		let t = b();
		if (e.duration = t - e.start, y && typeof performance.measure == "function") try {
			performance.measure(`${x}${e.name}`, {
				start: e.start,
				end: t,
				detail: { devtools: {
					dataType: "track-entry",
					track: S,
					trackGroup: C,
					color: w[e.name] ?? "primary",
					tooltipText: `${e.name} \u2014 ${e.duration.toFixed(1)} ms`
				} }
			});
		} catch {}
	}
	async span(e, t) {
		if (!this.enabled) return t();
		this.begin(e);
		try {
			return await t();
		} finally {
			this.end();
		}
	}
	report() {
		return this.records.at(-1)?.tree ?? this.roots.at(-1);
	}
	clear() {
		this.records.length = 0, this.roots = [], this.stack = [], this.runLabel = void 0;
	}
	reset() {
		this.roots = [], this.stack = [];
	}
	printSummary(e = this.report(), t) {
		if (!e) return;
		let n = e.duration, r = t && t !== e.name ? `${e.name} [${t}]` : e.name, i = ["ms        %    phase"], a = /* @__PURE__ */ f((e, t) => {
			let r = "  ".repeat(t), o = e.duration.toFixed(1).padStart(8), s = n > 0 ? `${(e.duration / n * 100).toFixed(0).padStart(3)}%` : "   -";
			i.push(`${o}  ${s}  ${r}${e.name}`);
			for (let n of e.children) a(n, t + 1);
			if (e.children.length > 0) {
				let t = e.children.reduce((e, t) => e + t.duration, 0), n = e.duration - t;
				if (n > .5) {
					let e = n.toFixed(1).padStart(8);
					i.push(`${e}       ${r}  (self)`);
				}
			}
		}, "walk");
		a(e, 0);
		let o = Object.keys(this.buckets);
		if (o.length > 0) {
			i.push("—— buckets (summed) ——");
			for (let e of o) i.push(`${this.buckets[e].toFixed(1).padStart(8)}       ${e}`);
		}
		console.log(`${x}mermaid render profile \xB7 ${r}
${i.join("\n")}`);
	}
}), globalThis.injected ??= {
	includeLargeFeatures: !0,
	profiling: !1,
	version: "0.0.0"
};
var T = g.default.extend({ raf(e) {
	typeof queueMicrotask == "function" ? queueMicrotask(e) : setTimeout(e, 0);
} }).extend(_.default);
function E(e, { markdownAutoWrap: t }) {
	return v(e.replace(/<br\/>/g, "\n").replace(/\n{2,}/g, "\n"));
}
f(E, "preprocessMarkdown");
function D(e) {
	return e.split(/\\n|\n|<br\s*\/?>/gi).map((e) => e.trim().match(/<[^>]+>|[^\s<>]+/g)?.map((e) => ({
		content: e,
		type: "normal"
	})) ?? []);
}
f(D, "nonMarkdownToLines");
function O(e, t = {}) {
	let n = E(e, t), r = p.lexer(n), i = [[]], a = 0;
	function o(e, t = "normal") {
		e.type === "text" ? e.text.split("\n").forEach((e, n) => {
			n !== 0 && (a++, i.push([])), e.split(" ").forEach((e) => {
				e = e.replace(/&#39;/g, "'"), e && i[a].push({
					content: e,
					type: t
				});
			});
		}) : e.type === "strong" || e.type === "em" ? e.tokens.forEach((t) => {
			o(t, e.type);
		}) : e.type === "html" && i[a].push({
			content: e.text,
			type: "normal"
		});
	}
	return f(o, "processNode"), r.forEach((e) => {
		e.type === "paragraph" ? e.tokens?.forEach((e) => {
			o(e);
		}) : e.type === "html" ? i[a].push({
			content: e.text,
			type: "normal"
		}) : i[a].push({
			content: e.raw,
			type: "normal"
		});
	}), i;
}
f(O, "markdownToLines");
function k(e) {
	return e ? `<p>${e.replace(/\\n|\n/g, "<br />")}</p>` : "";
}
f(k, "nonMarkdownToHTML");
function A(e, { markdownAutoWrap: t } = {}) {
	let n = p.lexer(e);
	function r(e) {
		return e.type === "text" ? t === !1 ? e.text.replace(/\n */g, "<br/>").replace(/ /g, "&nbsp;") : e.text.replace(/\n */g, "<br/>") : e.type === "strong" ? `<strong>${e.tokens?.map(r).join("")}</strong>` : e.type === "em" ? `<em>${e.tokens?.map(r).join("")}</em>` : e.type === "paragraph" ? `<p>${e.tokens?.map(r).join("")}</p>` : e.type === "space" ? "" : e.type === "html" ? `${e.text}` : e.type === "escape" ? e.text : (u.warn(`Unsupported markdown: ${e.type}`), e.raw);
	}
	return f(r, "output"), n.map(r).join("");
}
f(A, "markdownToHTML");
function j(e) {
	return Intl.Segmenter ? [...new Intl.Segmenter().segment(e)].map((e) => e.segment) : [...e];
}
f(j, "splitTextToChars");
function M(e, t) {
	return N(e, [], j(t.content), t.type);
}
f(M, "splitWordToFitWidth");
function N(e, t, n, r) {
	if (n.length === 0) return [{
		content: t.join(""),
		type: r
	}, {
		content: "",
		type: r
	}];
	let [i, ...a] = n, o = [...t, i];
	return e([{
		content: o.join(""),
		type: r
	}]) ? N(e, o, a, r) : (t.length === 0 && i && (t.push(i), n.shift()), [{
		content: t.join(""),
		type: r
	}, {
		content: n.join(""),
		type: r
	}]);
}
f(N, "splitWordToFitWidthRecursion");
function P(e, t) {
	if (e.some(({ content: e }) => e.includes("\n"))) throw Error("splitLineToFitWidth does not support newlines in the line");
	return F(e, t);
}
f(P, "splitLineToFitWidth");
function F(e, t, n = [], r = []) {
	if (e.length === 0) return r.length > 0 && n.push(r), n.length > 0 ? n : [];
	let i = "";
	e[0].content === " " && (i = " ", e.shift());
	let a = e.shift() ?? {
		content: " ",
		type: "normal"
	}, o = [...r];
	if (i !== "" && o.push({
		content: i,
		type: "normal"
	}), o.push(a), t(o)) return F(e, t, n, o);
	if (r.length > 0) n.push(r), e.unshift(a);
	else if (a.content) {
		let [r, i] = M(t, a);
		n.push([r]), i.content && e.unshift(i);
	}
	return F(e, t, n);
}
f(F, "splitLineToFitWidthRecursion");
function I(e, t) {
	t && e.attr("style", t);
}
f(I, "applyStyle");
var L = 16384;
async function R(e, t, n, r, i = !1, u = s()) {
	let d = e.append("foreignObject");
	d.attr("width", `${Math.min(10 * n, L)}px`), d.attr("height", `${Math.min(10 * n, L)}px`);
	let f = d.append("xhtml:div"), p = a(t.label) ? await o(t.label.replace(c.lineBreakRegex, "\n"), u) : l(t.label, u), m = t.isNode ? "nodeLabel" : "edgeLabel", h = f.append("span");
	return h.html(p), I(h, t.labelStyle), h.attr("class", `${m} ${r}`), I(f, t.labelStyle), f.style("display", "table-cell"), f.style("white-space", "nowrap"), f.style("line-height", "1.5"), n !== Infinity && (f.style("max-width", n + "px"), f.style("text-align", "center")), f.attr("xmlns", "http://www.w3.org/1999/xhtml"), i && f.attr("class", "labelBkg"), (await T.measure(() => f.node().getBoundingClientRect())).width === n && (f.style("display", "table"), f.style("white-space", "break-spaces"), f.style("width", n + "px")), d.node();
}
f(R, "addHtmlSpan");
function z(e, t, n, r = !1) {
	let i = e.append("tspan").attr("class", "text-outer-tspan").attr("x", 0).attr("y", t * n - .1 + "em").attr("dy", n + "em");
	return r && i.attr("text-anchor", "middle"), i;
}
f(z, "createTspan");
function B(e, t, n) {
	let r = e.append("text"), i = z(r, 1, t);
	W(i, n);
	let a = i.node().getComputedTextLength();
	return r.remove(), a;
}
f(B, "computeWidthOfText");
function V(e, t, n) {
	let r = e.append("text"), i = z(r, 1, t);
	W(i, [{
		content: n,
		type: "normal"
	}]);
	let a = i.node()?.getBoundingClientRect();
	return a && r.remove(), a;
}
f(V, "computeDimensionOfText");
function H(e, t, n, r = !1, i = !1) {
	let a = 1.1, o = t.append("g"), s = o.insert("rect").attr("class", "background").attr("style", "stroke: none"), c = o.append("text").attr("y", "-10.1");
	i && c.attr("text-anchor", "middle");
	let l = 0;
	for (let t of n) {
		let n = /* @__PURE__ */ f((t) => B(o, a, t) <= e, "checkWidth"), r = n(t) ? [t] : P(t, n);
		for (let e of r) W(z(c, l, a, i), e), l++;
	}
	if (r) {
		let e = c.node().getBBox();
		return s.attr("x", e.x - 2).attr("y", e.y - 2).attr("width", e.width + 4).attr("height", e.height + 4), o.node();
	}
	return c.node();
}
f(H, "createFormattedText");
function U(e) {
	return e.replace(/&(amp|lt|gt);/g, (e, t) => {
		switch (t) {
			case "amp": return "&";
			case "lt": return "<";
			case "gt": return ">";
			default: return e;
		}
	});
}
f(U, "decodeHTMLEntities");
function W(e, t) {
	e.text(""), t.forEach((t, n) => {
		let r = e.append("tspan").attr("font-style", t.type === "em" ? "italic" : "normal").attr("class", "text-inner-tspan").attr("font-weight", t.type === "strong" ? "bold" : "normal");
		n === 0 ? r.text(U(t.content)) : r.text(" " + U(t.content));
	});
}
f(W, "updateTextContentAndStyles");
async function G(e, t = {}) {
	let i = [];
	e.replace(/(fa[bklrs]?):fa-([\w-]+)/g, (e, a, o) => (i.push((async () => {
		let i = `${a}:${o}`;
		return await n(i) ? await r(i, void 0, { class: "label-icon" }) : `<i class='${l(e, t).replace(":", " ")}'></i>`;
	})()), e));
	let a = await Promise.all(i);
	return e.replace(/(fa[bklrs]?):fa-([\w-]+)/g, () => a.shift() ?? "");
}
f(G, "replaceIconSubstring");
var K = /* @__PURE__ */ f(async (e, t = "", { style: n = "", isTitle: r = !1, classes: o = "", useHtmlLabels: s = !0, markdown: c = !0, isNode: l = !0, width: f = 200, addSvgBackground: p = !1 } = {}, m) => {
	if (u.debug("XYZ createText", t, n, r, o, s, l, "addSvgBackground: ", p), s) {
		let r = c ? A(t, m) : k(t), s = await G(i(r), m), u = t.replace(/\\\\/g, "\\");
		return await R(e, {
			isNode: l,
			label: a(t) ? u : s,
			labelStyle: n.replace("fill:", "color:")
		}, f, o, p, m);
	}
	{
		let a = i(t.replace(/<br\s*\/?>/g, "<br/>")), o = H(f, e, c ? O(a.replace("<br>", "<br/>"), m) : D(a), t ? p : !1, !l);
		if (l) {
			/stroke:/.exec(n) && (n = n.replace("stroke:", "lineColor:"));
			let e = n.replace(/stroke:[^;]+;?/g, "").replace(/stroke-width:[^;]+;?/g, "").replace(/fill:[^;]+;?/g, "").replace(/color:/g, "fill:");
			d(o).attr("style", e);
		} else {
			let e = n.replace(/stroke:[^;]+;?/g, "").replace(/stroke-width:[^;]+;?/g, "").replace(/fill:[^;]+;?/g, "").replace(/background:/g, "fill:");
			d(o).select("rect").attr("style", e.replace(/background:/g, "fill:"));
			let t = n.replace(/stroke:[^;]+;?/g, "").replace(/stroke-width:[^;]+;?/g, "").replace(/fill:[^;]+;?/g, "").replace(/color:/g, "fill:");
			d(o).select("text").attr("style", t);
		}
		return r ? d(o).selectAll("tspan.text-outer-tspan").classed("title-row", !0) : d(o).selectAll("tspan.text-outer-tspan").classed("row", !0), o;
	}
}, "createText");
export { v as i, K as n, T as r, V as t };
