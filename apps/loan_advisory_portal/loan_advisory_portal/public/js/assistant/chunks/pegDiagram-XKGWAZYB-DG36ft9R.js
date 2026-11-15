import { n as e, r as t, t as n } from "./chunk-SVP7TREG-CibkONNJ.js";
import { t as r } from "./chunk-JWPE2WC7-B2sZhr17.js";
import "./mermaid.core-CFS29ufk.js";
import "./chunk-DU6HZSFF-BBp-hRRt.js";
import { n as i } from "./d3-selection-D2S8w1Dl.js";
import { n as a } from "./chunk-Y2CYZVJY-BKLaWZ8G.js";
import { t as o, u as s } from "./mermaid-parser.core-C9NsnT78.js";
// node_modules/.pnpm/mermaid@11.17.2/node_modules/mermaid/dist/chunks/mermaid.core/pegDiagram-XKGWAZYB.mjs
var c = s().RailroadPeg.parser.LangiumParser, l = /* @__PURE__ */ a((e) => {
	let t = e.alternatives.map(u);
	return t.length === 1 ? t[0] : {
		type: "choice",
		alternatives: t
	};
}, "transformOrderedChoice"), u = /* @__PURE__ */ a((e) => {
	let t = e.elements.map(d);
	return t.length === 1 ? t[0] : {
		type: "sequence",
		elements: t
	};
}, "transformSequence"), d = /* @__PURE__ */ a((e) => {
	let t = p(e.suffix);
	return e.operator ? {
		type: "special",
		text: e.operator === "&" ? `&${f(t)}` : `!${f(t)}`
	} : t;
}, "transformPrefix"), f = /* @__PURE__ */ a((e) => {
	switch (e.type) {
		case "terminal": return `"${e.value}"`;
		case "nonterminal": return e.name;
		case "special": return e.text;
		default: return "(...)";
	}
}, "nodeToLabel"), p = /* @__PURE__ */ a((e) => {
	let t = m(e.primary);
	if (!e.operator) return t;
	switch (e.operator) {
		case "?": return {
			type: "optional",
			element: t
		};
		case "*": return {
			type: "repetition",
			element: t,
			min: 0,
			max: Infinity
		};
		case "+": return {
			type: "repetition",
			element: t,
			min: 1,
			max: Infinity
		};
		default: throw Error(`Unsupported PEG suffix operator: ${e.operator}`);
	}
}, "transformSuffix"), m = /* @__PURE__ */ a((e) => {
	switch (e.$type) {
		case "PegLiteral": return {
			type: "terminal",
			value: e.value
		};
		case "PegIdentifier": return {
			type: "nonterminal",
			name: e.name
		};
		case "PegGroup": return l(e.element);
		case "PegAny": return {
			type: "special",
			text: e.dot
		};
		default: throw Error(`Unsupported PEG primary node: ${e.$type}`);
	}
}, "transformPrimary"), h = /* @__PURE__ */ a((e) => ({
	name: e.name,
	definition: l(e.definition)
}), "transformRule"), g = /* @__PURE__ */ a((e) => {
	r(e, n), e.title && n.setTitle(e.title), e.rules.map((e) => n.addRule(h(e)));
}, "populateDb"), _ = {
	parser: {
		parse: /* @__PURE__ */ a((e) => {
			n.clear(), i.debug("[PEG Parser] Starting Langium parse");
			let t = c.parse(e);
			if (t.lexerErrors.length > 0 || t.parserErrors.length > 0) throw new o(t);
			let r = t.value;
			i.debug("[PEG Parser] Parsed rules:", r.rules.length), g(r), i.debug("[PEG Parser] Parse complete");
		}, "parse"),
		parser: { yy: n }
	},
	db: n,
	renderer: t,
	styles: e
};
export { _ as diagram };
