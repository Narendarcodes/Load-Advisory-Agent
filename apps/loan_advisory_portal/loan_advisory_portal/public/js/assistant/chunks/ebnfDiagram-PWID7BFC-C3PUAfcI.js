import { n as e, r as t, t as n } from "./chunk-SVP7TREG-CvDo9Oqd.js";
import { t as r } from "./chunk-JWPE2WC7-CWZppDjb.js";
import "./mermaid.core-Cycl5TkK.js";
import "./chunk-DU6HZSFF-DiJPsyNG.js";
import { m as i } from "./src-D1GiZSQN.js";
import { n as a } from "./chunk-Y2CYZVJY-zK79Gbcw.js";
import { f as o, t as s } from "./mermaid-parser.core-BMwcZ8NH.js";
// node_modules/mermaid/dist/chunks/mermaid.core/ebnfDiagram-PWID7BFC.mjs
var c = o().RailroadEbnf.parser.LangiumParser, l = /* @__PURE__ */ a((e) => {
	let t = e.alternatives.map(u);
	return t.length === 1 ? t[0] : {
		type: "choice",
		alternatives: t
	};
}, "transformChoice"), u = /* @__PURE__ */ a((e) => {
	let t = e.elements.map(p);
	return t.length === 1 ? t[0] : {
		type: "sequence",
		elements: t
	};
}, "transformSequence"), d = /* @__PURE__ */ a((e) => {
	switch (e.$type) {
		case "EbnfTerminal": return {
			type: "terminal",
			value: e.value
		};
		case "EbnfNonTerminal": return {
			type: "nonterminal",
			name: e.name
		};
		case "EbnfSpecial": return {
			type: "special",
			text: e.text
		};
		case "EbnfGroup": return l(e.element);
		case "EbnfOptional": return {
			type: "optional",
			element: l(e.element)
		};
		case "EbnfRepetition": return {
			type: "repetition",
			element: l(e.element),
			min: 0,
			max: Infinity
		};
		default: throw Error(`Unsupported EBNF primary node: ${e.$type}`);
	}
}, "transformPrimary"), f = /* @__PURE__ */ a((e, t) => {
	switch (t.$type) {
		case "EbnfOptionalPostfix": return {
			type: "optional",
			element: e
		};
		case "EbnfZeroOrMorePostfix": return {
			type: "repetition",
			element: e,
			min: 0,
			max: Infinity
		};
		case "EbnfOneOrMorePostfix": return {
			type: "repetition",
			element: e,
			min: 1,
			max: Infinity
		};
		case "EbnfExceptionPostfix": return {
			type: "sequence",
			elements: [
				e,
				{
					type: "terminal",
					value: "-"
				},
				d(t.except)
			]
		};
		default: throw Error(`Unsupported EBNF postfix node: ${t.$type}`);
	}
}, "transformPostfix"), p = /* @__PURE__ */ a((e) => e.postfixes.reduce((e, t) => f(e, t), d(e.base)), "transformTerm"), m = /* @__PURE__ */ a((e) => ({
	name: e.name,
	definition: l(e.definition)
}), "transformRule"), h = /* @__PURE__ */ a((e) => {
	r(e, n), e.title && n.setTitle(e.title), e.rules.map((e) => n.addRule(m(e)));
}, "populateDb"), g = {
	parser: {
		parse: /* @__PURE__ */ a((e) => {
			n.clear(), i.debug("[EBNF Parser] Starting Langium parse");
			let t = c.parse(e);
			if (t.lexerErrors.length > 0 || t.parserErrors.length > 0) throw new s(t);
			let r = t.value;
			i.debug("[EBNF Parser] Parsed rules:", r.rules.length), h(r), i.debug("[EBNF Parser] Parse complete");
		}, "parse"),
		parser: { yy: n }
	},
	db: n,
	renderer: t,
	styles: e
};
export { g as diagram };
