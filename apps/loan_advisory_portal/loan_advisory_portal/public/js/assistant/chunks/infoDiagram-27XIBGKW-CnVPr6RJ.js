import { f as e } from "./mermaid.core-Cycl5TkK.js";
import { c as t } from "./chunk-DU6HZSFF-DiJPsyNG.js";
import { m as n } from "./src-D1GiZSQN.js";
import { n as r } from "./chunk-Y2CYZVJY-zK79Gbcw.js";
import { n as i } from "./mermaid-parser.core-BMwcZ8NH.js";
// node_modules/mermaid/dist/chunks/mermaid.core/infoDiagram-27XIBGKW.mjs
var a = { parse: /* @__PURE__ */ r(async (e) => {
	let t = await i("info", e);
	n.debug(t);
}, "parse") }, o = { version: "11.17.2" }, s = {
	parser: a,
	db: { getVersion: /* @__PURE__ */ r(() => o.version, "getVersion") },
	renderer: { draw: /* @__PURE__ */ r((r, i, a) => {
		n.debug("rendering info diagram\n" + r);
		let o = e(i);
		t(o, 100, 400, !0), o.append("g").append("text").attr("x", 100).attr("y", 40).attr("class", "version").attr("font-size", 32).style("text-anchor", "middle").text(`v${a}`);
	}, "draw") }
};
export { s as diagram };
