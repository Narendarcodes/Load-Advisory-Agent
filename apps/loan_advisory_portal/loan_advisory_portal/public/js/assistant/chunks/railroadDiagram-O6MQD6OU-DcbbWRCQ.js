import { n as e, r as t, t as n } from "./chunk-SVP7TREG-CibkONNJ.js";
import { t as r } from "./chunk-JWPE2WC7-B2sZhr17.js";
import "./mermaid.core-CFS29ufk.js";
import "./chunk-DU6HZSFF-BBp-hRRt.js";
import { n as i } from "./d3-selection-D2S8w1Dl.js";
import { n as a } from "./chunk-Y2CYZVJY-BKLaWZ8G.js";
import { g as o, t as s } from "./mermaid-parser.core-C9NsnT78.js";
// node_modules/.pnpm/mermaid@11.17.2/node_modules/mermaid/dist/chunks/mermaid.core/railroadDiagram-O6MQD6OU.mjs
var c = o().Railroad.parser.LangiumParser, l = /* @__PURE__ */ a((e) => {
	switch (e.$type) {
		case "RailroadTerminalExpr": return {
			type: "terminal",
			value: e.value
		};
		case "RailroadNonTerminalExpr": return {
			type: "nonterminal",
			name: e.name
		};
		case "RailroadSpecialExpr": return {
			type: "special",
			text: e.text
		};
		case "RailroadSequenceExpr": {
			let t = e.elements.map(l);
			return t.length === 1 ? t[0] : {
				type: "sequence",
				elements: t
			};
		}
		case "RailroadChoiceExpr": {
			let t = e.alternatives.map(l);
			return t.length === 1 ? t[0] : {
				type: "choice",
				alternatives: t
			};
		}
		case "RailroadOptionalExpr": return {
			type: "optional",
			element: l(e.element)
		};
		case "RailroadOneOrMoreExpr": return {
			type: "repetition",
			element: l(e.element),
			min: 1,
			max: Infinity
		};
		case "RailroadZeroOrMoreExpr": return {
			type: "repetition",
			element: l(e.element),
			min: 0,
			max: Infinity
		};
		default: throw Error(`Unsupported railroad expression: ${e.$type}`);
	}
}, "transformExpression"), u = /* @__PURE__ */ a((e) => ({
	name: e.name,
	definition: l(e.definition)
}), "transformRule"), d = /* @__PURE__ */ a((e) => {
	r(e, n), e.title && n.setTitle(e.title), e.rules.map((e) => n.addRule(u(e)));
}, "populateDb"), f = {
	parser: {
		parse: /* @__PURE__ */ a((e) => {
			n.clear(), i.debug("[Railroad Parser] Starting Langium parse");
			let t = c.parse(e);
			if (t.lexerErrors.length > 0 || t.parserErrors.length > 0) throw new s(t);
			let r = t.value;
			i.debug("[Railroad Parser] Parsed rules:", r.rules.length), d(r), i.debug("[Railroad Parser] Parse complete");
		}, "parse"),
		parser: { yy: n }
	},
	db: n,
	renderer: t,
	styles: e
};
export { f as diagram };
