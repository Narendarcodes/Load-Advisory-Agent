import { $ as e, C as t, E as n, I as r, L as i, N as a, P as o, Q as s, S as c, T as l, V as u, W as d, X as f, Z as p, _ as m, b as h, c as g, g as _, l as v, m as y, n as b, p as x, q as S, r as C, s as w, t as T, u as E, x as D } from "./chunk-DU6HZSFF-DiJPsyNG.js";
import { n as O } from "./chunk-Y2CYZVJY-zK79Gbcw.js";
import { h as k, m as A, p as j } from "./src-D1GiZSQN.js";
import { n as M, t as N } from "./chunk-L3NEJ4N5-4yuHr156.js";
import { a as P, c as F, i as I, l as L, n as R, r as z, s as B, t as ee } from "./chunk-OSK3NFVY-CshR5Khr.js";
import { i as te, n as ne, r as re, t as ie } from "./chunk-GVQU2GXP--oFtKPfl.js";
import { a as ae } from "./chunk-4HAMMTFA-TYfKT1cx.js";
import { K as oe, a as se, b as ce, d as le, f as ue, g as V, h as H, i as de, o as fe, v as pe, y as me } from "./chunk-75Z2AOVW-Ch6yg9DG.js";
import { t as he } from "./graphlib-DW9QUswF.js";
import "./chunk-P2QGCYS3-BVJFTafa.js";
import { i as ge } from "./chunk-GMAD6QVW-BhcwiXxy.js";
import { r as _e } from "./chunk-PWAF6VOD-DcFSB59f.js";
// node_modules/mermaid/dist/chunks/mermaid.core/chunk-CLGD4ZFX.mjs
var ve = /* @__PURE__ */ O((e) => {
	let { securityLevel: t } = D(), n = j("body");
	if (t === "sandbox") {
		let t = j(`#i${e}`).node()?.contentDocument ?? document;
		n = j(t.body);
	}
	return n.select(`#${e}`);
}, "selectSvgElement");
// node_modules/es-toolkit/dist/compat/_internal/isPrototype.mjs
function ye(e) {
	let t = e?.constructor;
	return e === (typeof t == "function" ? t.prototype : Object.prototype);
}
// node_modules/es-toolkit/dist/compat/predicate/isEmpty.mjs
function be(e) {
	if (e == null) return !0;
	if (oe(e)) return typeof e.splice != "function" && typeof e != "string" && !ce(e) && !me(e) && !pe(e) ? !1 : e.length === 0;
	if (typeof e == "object" || typeof e == "function") {
		if (e instanceof Map || e instanceof Set) return e.size === 0;
		let t = Object.keys(e);
		return ye(e) ? t.filter((e) => e !== "constructor").length === 0 : t.length === 0;
	}
	return !0;
}
// node_modules/mermaid/dist/chunks/mermaid.core/chunk-TLUHSLCS.mjs
var xe = {
	common: w,
	getConfig: h,
	insertCluster: M,
	insertEdge: I,
	insertEdgeLabel: P,
	insertMarkers: B,
	insertNode: re,
	interpolateToCurve: le,
	labelHelper: ae,
	log: A,
	positionEdgeLabel: F
}, Se = {}, Ce = /* @__PURE__ */ O((e) => {
	for (let t of e) Se[t.name] = t;
}, "registerLayoutLoaders");
(/* @__PURE__ */ O(() => {
	Ce([
		{
			name: "dagre",
			loader: /* @__PURE__ */ O(async () => await import("./dagre-GXQ25YYZ-9mbXMZi6.js"), "loader")
		},
		{
			name: "swimlane",
			loader: /* @__PURE__ */ O(async () => await import("./swimlanes-42K2YHIH-LB_S06rB.js"), "loader")
		},
		{
			name: "cose-bilkent",
			loader: /* @__PURE__ */ O(async () => await import("./cose-bilkent-JH36ORCC-BxRw09oh.js"), "loader")
		}
	]);
}, "registerDefaultLayoutLoaders"))();
var we = /* @__PURE__ */ O(async (e, t) => {
	if (!(e.layoutAlgorithm in Se)) throw Error(`Unknown layout algorithm: ${e.layoutAlgorithm}`);
	if (e.diagramId) for (let t of e.nodes) {
		let n = t.domId || t.id;
		t.domId = `${e.diagramId}-${n}`;
	}
	let n = Se[e.layoutAlgorithm], r = await n.loader(), { theme: i, themeVariables: a } = e.config, { useGradient: o, gradientStart: s, gradientStop: c } = a, l = t.attr("id");
	if (t.append("defs").append("filter").attr("id", `${l}-drop-shadow`).attr("height", "130%").attr("width", "130%").append("feDropShadow").attr("dx", "4").attr("dy", "4").attr("stdDeviation", 0).attr("flood-opacity", "0.06").attr("flood-color", `${i?.includes("dark") ? "#FFFFFF" : "#000000"}`), t.append("defs").append("filter").attr("id", `${l}-drop-shadow-small`).attr("height", "150%").attr("width", "150%").append("feDropShadow").attr("dx", "2").attr("dy", "2").attr("stdDeviation", 0).attr("flood-opacity", "0.06").attr("flood-color", `${i?.includes("dark") ? "#FFFFFF" : "#000000"}`), o) {
		let e = t.append("linearGradient").attr("id", t.attr("id") + "-gradient").attr("gradientUnits", "objectBoundingBox").attr("x1", "0%").attr("y1", "0%").attr("x2", "100%").attr("y2", "0%");
		e.append("svg:stop").attr("offset", "0%").attr("stop-color", s).attr("stop-opacity", 1), e.append("svg:stop").attr("offset", "100%").attr("stop-color", c).attr("stop-opacity", 1);
	}
	return r.render(e, t, xe, { algorithm: n.algorithm });
}, "render"), Te = /* @__PURE__ */ O((e = "", { fallback: t = "dagre" } = {}) => {
	if (e in Se) return e;
	if (t in Se) return A.warn(`Layout algorithm ${e} is not registered. Using ${t} as fallback.`), t;
	throw Error(`Both layout algorithms ${e} and ${t} are not registered.`);
}, "getRegisteredLayoutAlgorithm");
// node_modules/mermaid/dist/chunks/mermaid.core/chunk-2E4U76K2.mjs
function Ee(e, { edgePathsClass: t = "edges edgePaths" } = {}) {
	let n = e.insert("g").attr("class", "root");
	return {
		clusters: n.insert("g").attr("class", "clusters"),
		edgePaths: n.insert("g").attr("class", t),
		edgeLabels: n.insert("g").attr("class", "edgeLabels"),
		nodes: n.insert("g").attr("class", "nodes"),
		rootGroups: n
	};
}
O(Ee, "createLayoutElementGroups");
async function De(e, t) {
	if (t.label) {
		let { shapeSvg: n, bbox: r } = await ae(e, t);
		t.labelBBox = {
			width: r.width,
			height: r.height
		}, n.remove();
	} else t.labelBBox = {
		width: 0,
		height: 0
	};
}
O(De, "measureGroupLabel");
async function Oe(e, t, n) {
	let r = await re(e, t, n), i = r.node()?.getBBox() ?? {
		width: 0,
		height: 0
	};
	return t.width = i.width, t.height = i.height, r;
}
O(Oe, "insertMeasuredNode");
async function ke(e, t) {
	let n = new he({
		multigraph: !0,
		compound: !0
	}), r = [...t.edges], i = D(), a = Ee(e), { edgeLabels: o, nodes: s } = a, c = /* @__PURE__ */ new Map(), l = e.node() != null;
	await Promise.all(t.nodes.map(async (e) => {
		if (e.isGroup) l && await De(s, e), n.setNode(e.id, { ...e });
		else {
			if (l) {
				let t = await Oe(s, e, {
					config: i,
					dir: e.dir
				});
				c.set(e.id, t);
			}
			n.setNode(e.id, { ...e });
		}
	}));
	for (let e of r) l && z(e) && await P(o, e), n.setEdge(e.start, e.end, { ...e }, e.id), t.edges.some((t) => t.id === e.id) || t.edges.push(e);
	if (globalThis.mermaidCaptureSizes) {
		let { captureNodeSizes: n } = await import("./sizeCapture-INFHLROL-DX9R_TYJ.js");
		n(e, t);
	}
	return {
		graph: n,
		groups: a,
		nodeElements: c
	};
}
O(ke, "createGraphWithElements");
var U = /* @__PURE__ */ new Map(), W = /* @__PURE__ */ new Map(), Ae = /* @__PURE__ */ new Map(), je = /* @__PURE__ */ O(() => {
	W.clear(), Ae.clear(), U.clear();
}, "clear"), Me = /* @__PURE__ */ O((e, t) => {
	let n = W.get(t) || [];
	return A.trace("In isDescendant", t, " ", e, " = ", n.includes(e)), n.includes(e);
}, "isDescendant"), Ne = /* @__PURE__ */ O((e, t) => {
	let n = W.get(t) || [];
	return A.info("Descendants of ", t, " is ", n), A.info("Edge is ", e), e.v === t || e.w === t ? !1 : n ? n.includes(e.v) || Me(e.v, t) || Me(e.w, t) || n.includes(e.w) : (A.debug("Tilt, ", t, ",not in descendants"), !1);
}, "edgeInCluster"), Pe = /* @__PURE__ */ O((e, t, n, r) => {
	A.debug("Copying children of ", e, "root", r, "data", t.node(e), r);
	let i = t.children(e) || [];
	e !== r && i.push(e), A.debug("Copying (nodes) clusterId", e, "nodes", i), i.forEach((i) => {
		if (t.children(i).length > 0) Pe(i, t, n, r);
		else {
			let a = t.node(i);
			A.info("cp ", i, " to ", r, " with parent ", e), n.setNode(i, a), r !== t.parent(i) && (A.debug("Setting parent", i, t.parent(i)), n.setParent(i, t.parent(i))), e !== r && i !== e ? (A.debug("Setting parent", i, e), n.setParent(i, e)) : (A.info("In copy ", e, "root", r, "data", t.node(e), r), A.debug("Not Setting parent for node=", i, "cluster!==rootId", e !== r, "node!==clusterId", i !== e));
			let o = t.edges(i);
			A.debug("Copying Edges", o), o.forEach((i) => {
				A.info("Edge", i);
				let a = t.edge(i.v, i.w, i.name);
				A.info("Edge data", a, r);
				try {
					Ne(i, r) ? (A.info("Copying as ", i.v, i.w, a, i.name), n.setEdge(i.v, i.w, a, i.name), A.info("newGraph edges ", n.edges(), n.edge(n.edges()[0]))) : A.info("Skipping copy of edge ", i.v, "-->", i.w, " rootId: ", r, " clusterId:", e);
				} catch (e) {
					A.error(e);
				}
			});
		}
		A.debug("Removing node", i), t.removeNode(i);
	});
}, "copy"), Fe = /* @__PURE__ */ O((e, t) => {
	let n = t.children(e), r = [...n];
	for (let i of n) Ae.set(i, e), r = [...r, ...Fe(i, t)];
	return r;
}, "extractDescendants"), Ie = /* @__PURE__ */ O((e, t, n) => {
	let r = e.edges().filter((e) => e.v === t || e.w === t), i = e.edges().filter((e) => e.v === n || e.w === n), a = r.map((e) => ({
		v: e.v === t ? n : e.v,
		w: e.w === t ? t : e.w
	})), o = i.map((e) => ({
		v: e.v,
		w: e.w
	}));
	return a.filter((e) => o.some((t) => e.v === t.v && e.w === t.w));
}, "findCommonEdges"), Le = /* @__PURE__ */ O((e, t, n) => {
	let r = t.children(e);
	if (A.trace("Searching children of id ", e, r), r.length < 1) return e;
	let i;
	for (let e of r) {
		let r = Le(e, t, n), a = Ie(t, n, r);
		if (r) {
			if (a.length > 0) i = r;
			else return r;
		}
	}
	return i;
}, "findNonClusterChild"), Re = /* @__PURE__ */ O((e) => !U.has(e) || !U.get(e).externalConnections ? e : U.has(e) ? U.get(e).id : e, "getAnchorId"), ze = /* @__PURE__ */ O((e, t) => {
	if (!e || t > 10) A.debug("Opting out, no graph ");
	else {
		A.debug("Opting in, graph "), e.nodes().forEach(function(t) {
			e.children(t).length > 0 && (A.debug("Cluster identified", t, " Replacement id in edges: ", Le(t, e, t)), W.set(t, Fe(t, e)), U.set(t, {
				id: Le(t, e, t),
				clusterData: e.node(t)
			}));
		}), e.nodes().forEach(function(t) {
			let n = e.children(t), r = e.edges();
			n.length > 0 ? (A.debug("Cluster identified", t, W), r.forEach((e) => {
				Me(e.v, t) ^ Me(e.w, t) && (A.debug("Edge: ", e, " leaves cluster ", t), A.debug("Descendants of XXX ", t, ": ", W.get(t)), U.get(t).externalConnections = !0);
			})) : A.debug("Not a cluster ", t, W);
		});
		for (let t of U.keys()) {
			let n = U.get(t).id, r = e.parent(n);
			r !== t && U.has(r) && !U.get(r).externalConnections && (U.get(t).id = r);
			let i = e.edges().some((e) => e.v === t);
			if (n && U.get(t)?.externalConnections && i && Ue(e, n, t)) {
				let r = We(e, t, e.parent(n));
				r && (U.get(t).id = r);
			}
		}
		e.edges().forEach(function(t) {
			let n = e.edge(t);
			A.debug("Edge " + t.v + " -> " + t.w + ": " + JSON.stringify(t)), A.debug("Edge " + t.v + " -> " + t.w + ": " + JSON.stringify(e.edge(t)));
			let r = t.v, i = t.w;
			if (A.debug("Fix XXX", U, "ids:", t.v, t.w, "Translating: ", U.get(t.v), " --- ", U.get(t.w)), U.get(t.v) || U.get(t.w)) {
				if (A.debug("Fixing and trying - removing XXX", t.v, t.w, t.name), r = Re(t.v), i = Re(t.w), e.removeEdge(t.v, t.w, t.name), r !== t.v) {
					let i = e.parent(r);
					U.get(i).externalConnections = !0, n.fromCluster = t.v;
				}
				if (i !== t.w) {
					let r = e.parent(i);
					U.get(r).externalConnections = !0, n.toCluster = t.w;
				}
				A.debug("Fix Replacing with XXX", r, i, t.name), e.setEdge(r, i, n, t.name);
			}
		}), Be(e, 0), A.trace(U);
	}
}, "adjustClustersAndEdges"), Be = /* @__PURE__ */ O((e, t) => {
	if (t > 10) {
		A.error("Bailing out");
		return;
	}
	let n = e.nodes(), r = !1;
	for (let t of n) {
		let n = e.children(t);
		r ||= n.length > 0;
	}
	if (!r) A.debug("Done, no node has children", e.nodes());
	else {
		A.debug("Nodes = ", n, t);
		for (let r of n) if (A.debug("Extracting node", r, U, U.has(r) && !U.get(r).externalConnections, !e.parent(r), e.node(r), e.children("D"), " Depth ", t), !U.has(r)) A.debug("Not a cluster", r, t);
		else if (!U.get(r).externalConnections && e.children(r) && e.children(r).length > 0) {
			A.debug("Cluster without external connections, without a parent and with children", r, t);
			let n = e.graph().rankdir === "TB" ? "LR" : "TB";
			U.get(r)?.clusterData?.dir && (n = U.get(r).clusterData.dir, A.debug("Fixing dir", U.get(r).clusterData.dir, n));
			let i = new he({
				multigraph: !0,
				compound: !0
			}).setGraph({
				rankdir: n,
				nodesep: 50,
				ranksep: 50,
				marginx: 8,
				marginy: 8
			}).setDefaultEdgeLabel(function() {
				return {};
			});
			Pe(r, e, i, r), e.setNode(r, {
				clusterNode: !0,
				id: r,
				clusterData: U.get(r).clusterData,
				label: U.get(r).label,
				graph: i
			});
		} else A.debug("Cluster ** ", r, " **not meeting the criteria !externalConnections:", !U.get(r).externalConnections, " no parent: ", !e.parent(r), " children ", e.children(r) && e.children(r).length > 0, e.children("D"), t), A.debug(U);
		n = e.nodes(), A.debug("New list of nodes", n);
		for (let r of n) {
			let n = e.node(r);
			A.debug(" Now next level", r, n), n?.clusterNode && Be(n.graph, t + 1);
		}
	}
}, "extractor"), Ve = /* @__PURE__ */ O((e, t) => {
	if (t.length === 0) return [];
	let n = Object.assign([], t);
	return t.forEach((t) => {
		let r = Ve(e, e.children(t));
		n = [...n, ...r];
	}), n;
}, "sorter"), He = /* @__PURE__ */ O((e) => Ve(e, e.children()), "sortNodesByHierarchy"), Ue = /* @__PURE__ */ O((e, t, n) => {
	let r = e.parent(t);
	for (; r && r !== n;) {
		let t = U.get(r);
		if (t && !t.externalConnections) return !0;
		r = e.parent(r);
	}
	return !1;
}, "isNodeInExtractableCluster"), We = /* @__PURE__ */ O((e, t, n) => {
	let r = e.children(t) ?? [];
	for (let i of r) {
		if (i === n || Me(i, n)) continue;
		let r = Le(i, e, t);
		if (r && !Ue(e, r, t)) return r;
	}
	return null;
}, "findSafeAnchorNode");
function Ge({ prepareLayout: e, measureLayout: t, runLayoutCore: n, paintLayout: r, afterPaint: i, paintOptions: a }) {
	let o = t ?? qe;
	return /* @__PURE__ */ O(async function(t, s, c, l) {
		let u = s.select("g");
		(c?.insertMarkers ?? B)(u, t.markers, t.type, t.diagramId), Ke();
		let d = {
			element: u,
			helpers: c,
			options: l
		};
		d.preparedLayout = await e?.(t, d);
		let f = await o(t, d), p = await n(t, d), m = {
			...d,
			measure: f
		};
		r ? await r(t, m, p) : await Je(t, m, a), await i?.(t, m, p);
	}, "render");
}
O(Ge, "createCommonLayoutRenderer");
function Ke() {
	ie(), ee(), N(), je();
}
O(Ke, "clearLayoutRenderState");
async function qe(e, { element: t }) {
	return await ke(t, e);
}
O(qe, "defaultMeasureLayout");
async function Je(e, t, n = {}) {
	let { measure: r } = t, { groups: i } = r;
	for (let r of n.getNodes?.(e, t) ?? e.nodes) n.skipNode?.(r, t) || await Ye(i, r, t, n);
	let a = Ze(e.nodes);
	for (let r of e.edges) Qe(r, n) || await $e(i, r, a, e, n, t);
}
O(Je, "paintLayoutData");
async function Ye(e, t, n, r) {
	t.clusterNode ? te(t) : Xe(t, n, r) ? await M(e.clusters, t) : te(t);
}
O(Ye, "paintLayoutNode");
function Xe(e, t, n) {
	return e.isGroup === !0 && (n.isCluster?.(e, t) ?? !0);
}
O(Xe, "shouldPaintAsCluster");
function Ze(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) n?.id && t.set(n.id, n);
	return t;
}
O(Ze, "buildNodeLookup");
function Qe(e, t) {
	return e.isLayoutOnly || !!t.skipEdge?.(e);
}
O(Qe, "shouldSkipPaintEdge");
async function $e(e, t, n, r, i, a) {
	let o = I(e.edgePaths, { ...t }, i.clusterDb ?? /* @__PURE__ */ new Map(), r.type, et(t.start, t, n, a, i), et(t.end, t, n, a, i), r.diagramId, tt(t, i));
	z(t) && (R.has(t.id) || await P(e.edgeLabels, t), nt(t, o));
}
O($e, "paintLayoutEdge");
function et(e, t, n, r, i) {
	return i.getEdgeNode?.(e, t, r) ?? (e ? n.get(e) ?? {} : {});
}
O(et, "getRenderedNode");
function tt(e, t) {
	return typeof t.skipIntersect == "function" ? t.skipIntersect(e) : t.skipIntersect ?? !1;
}
O(tt, "shouldSkipIntersect");
function nt(e, t) {
	let n = t?.updatedPath ?? t?.originalPath, r = h(), { subGraphTitleTotalMargin: i } = ne({ flowchart: r.flowchart ?? {} });
	if (e.label) {
		let r = R.get(e.id), a = e.x, o = e.y;
		if (n) {
			let r = V.calcLabelPosition(n);
			A.debug("Moving label " + e.label + " from (", a, ",", o, ") to (", r.x, ",", r.y, ") abc88"), t?.updatedPath && (a = r.x, o = r.y);
		}
		r.attr("transform", `translate(${a}, ${o + i / 2})`);
	}
	if (e?.startLabelLeft) {
		let t = L.get(e.id).startLeft, r = e?.x, i = e?.y;
		if (n) {
			let t = V.calcTerminalLabelPosition(e.arrowTypeStart ? 10 : 0, "start_left", n);
			r = t.x, i = t.y;
		}
		t.attr("transform", `translate(${r}, ${i})`);
	}
	if (e.startLabelRight) {
		let t = L.get(e.id).startRight, r = e.x, i = e.y;
		if (n) {
			let t = V.calcTerminalLabelPosition(e.arrowTypeStart ? 10 : 0, "start_right", n);
			r = t.x, i = t.y;
		}
		t.attr("transform", `translate(${r}, ${i})`);
	}
	if (e.endLabelLeft) {
		let t = L.get(e.id).endLeft, r = e.x, i = e.y;
		if (n) {
			let t = V.calcTerminalLabelPosition(e.arrowTypeEnd ? 10 : 0, "end_left", n);
			r = t.x, i = t.y;
		}
		t.attr("transform", `translate(${r}, ${i})`);
	}
	if (e.endLabelRight) {
		let t = L.get(e.id).endRight, r = e.x, i = e.y;
		if (n) {
			let t = V.calcTerminalLabelPosition(e.arrowTypeEnd ? 10 : 0, "end_right", n);
			r = t.x, i = t.y;
		}
		t.attr("transform", `translate(${r}, ${i})`);
	}
}
O(nt, "positionRenderedEdgeLabel");
// node_modules/mermaid/dist/chunks/mermaid.core/chunk-LNGE3PJU.mjs
function rt(e) {
	return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
O(rt, "getDefaultExportFromCjs");
var G = {}, it = {}, K = {}, at;
function ot() {
	if (at) return K;
	at = 1;
	function e(e) {
		return e == null;
	}
	O(e, "isNothing");
	function t(e) {
		return typeof e == "object" && !!e;
	}
	O(t, "isObject");
	function n(t) {
		return Array.isArray(t) ? t : e(t) ? [] : [t];
	}
	O(n, "toArray");
	function r(e, t) {
		if (t) {
			let n = Object.keys(t);
			for (let r = 0, i = n.length; r < i; r += 1) {
				let i = n[r];
				e[i] = t[i];
			}
		}
		return e;
	}
	O(r, "extend");
	function i(e, t) {
		let n = "";
		for (let r = 0; r < t; r += 1) n += e;
		return n;
	}
	O(i, "repeat");
	function a(e) {
		return e === 0 && 1 / e == -Infinity;
	}
	return O(a, "isNegativeZero"), K.isNothing = e, K.isObject = t, K.toArray = n, K.repeat = i, K.isNegativeZero = a, K.extend = r, K;
}
O(ot, "requireCommon");
var st, ct;
function lt() {
	if (ct) return st;
	ct = 1;
	function e(e, t) {
		let n = "", r = e.reason || "(unknown reason)";
		return e.mark ? (e.mark.name && (n += "in \"" + e.mark.name + "\" "), n += "(" + (e.mark.line + 1) + ":" + (e.mark.column + 1) + ")", !t && e.mark.snippet && (n += "\n\n" + e.mark.snippet), r + " " + n) : r;
	}
	O(e, "formatError");
	function t(t, n) {
		Error.call(this), this.name = "YAMLException", this.reason = t, this.mark = n, this.message = e(this, !1), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : this.stack = (/* @__PURE__ */ Error()).stack || "";
	}
	return O(t, "YAMLException2"), t.prototype = Object.create(Error.prototype), t.prototype.constructor = t, t.prototype.toString = /* @__PURE__ */ O(function(t) {
		return this.name + ": " + e(this, t);
	}, "toString"), st = t, st;
}
O(lt, "requireException");
var ut, dt;
function ft() {
	if (dt) return ut;
	dt = 1;
	let e = ot();
	function t(e, t, n, r, i) {
		let a = "", o = "", s = Math.floor(i / 2) - 1;
		return r - t > s && (a = " ... ", t = r - s + a.length), n - r > s && (o = " ...", n = r + s - o.length), {
			str: a + e.slice(t, n).replace(/\t/g, "→") + o,
			pos: r - t + a.length
		};
	}
	O(t, "getLine");
	function n(t, n) {
		return e.repeat(" ", n - t.length) + t;
	}
	O(n, "padStart");
	function r(r, i) {
		if (i = Object.create(i || null), !r.buffer) return null;
		i.maxLength || (i.maxLength = 79), typeof i.indent != "number" && (i.indent = 1), typeof i.linesBefore != "number" && (i.linesBefore = 3), typeof i.linesAfter != "number" && (i.linesAfter = 2);
		let a = /\r?\n|\r|\0/g, o = [0], s = [], c, l = -1;
		for (; c = a.exec(r.buffer);) s.push(c.index), o.push(c.index + c[0].length), r.position <= c.index && l < 0 && (l = o.length - 2);
		l < 0 && (l = o.length - 1);
		let u = "", d = Math.min(r.line + i.linesAfter, s.length).toString().length, f = i.maxLength - (i.indent + d + 3);
		for (let a = 1; a <= i.linesBefore && !(l - a < 0); a++) {
			let c = t(r.buffer, o[l - a], s[l - a], r.position - (o[l] - o[l - a]), f);
			u = e.repeat(" ", i.indent) + n((r.line - a + 1).toString(), d) + " | " + c.str + "\n" + u;
		}
		let p = t(r.buffer, o[l], s[l], r.position, f);
		u += e.repeat(" ", i.indent) + n((r.line + 1).toString(), d) + " | " + p.str + "\n", u += e.repeat("-", i.indent + d + 3 + p.pos) + "^\n";
		for (let a = 1; a <= i.linesAfter && !(l + a >= s.length); a++) {
			let c = t(r.buffer, o[l + a], s[l + a], r.position - (o[l] - o[l + a]), f);
			u += e.repeat(" ", i.indent) + n((r.line + a + 1).toString(), d) + " | " + c.str + "\n";
		}
		return u.replace(/\n$/, "");
	}
	return O(r, "makeSnippet"), ut = r, ut;
}
O(ft, "requireSnippet");
var pt, mt;
function q() {
	if (mt) return pt;
	mt = 1;
	let e = lt(), t = [
		"kind",
		"multi",
		"resolve",
		"construct",
		"instanceOf",
		"predicate",
		"represent",
		"representName",
		"defaultStyle",
		"styleAliases"
	], n = [
		"scalar",
		"sequence",
		"mapping"
	];
	function r(e) {
		let t = {};
		return e !== null && Object.keys(e).forEach(function(n) {
			e[n].forEach(function(e) {
				t[String(e)] = n;
			});
		}), t;
	}
	O(r, "compileStyleAliases");
	function i(i, a) {
		if (a ||= {}, Object.keys(a).forEach(function(n) {
			if (t.indexOf(n) === -1) throw new e("Unknown option \"" + n + "\" is met in definition of \"" + i + "\" YAML type.");
		}), this.options = a, this.tag = i, this.kind = a.kind || null, this.resolve = a.resolve || function() {
			return !0;
		}, this.construct = a.construct || function(e) {
			return e;
		}, this.instanceOf = a.instanceOf || null, this.predicate = a.predicate || null, this.represent = a.represent || null, this.representName = a.representName || null, this.defaultStyle = a.defaultStyle || null, this.multi = a.multi || !1, this.styleAliases = r(a.styleAliases || null), n.indexOf(this.kind) === -1) throw new e("Unknown kind \"" + this.kind + "\" is specified for \"" + i + "\" YAML type.");
	}
	return O(i, "Type2"), pt = i, pt;
}
O(q, "requireType");
var ht, gt;
function _t() {
	if (gt) return ht;
	gt = 1;
	let e = lt(), t = q();
	function n(e, t) {
		let n = [];
		return e[t].forEach(function(e) {
			let t = n.length;
			n.forEach(function(n, r) {
				n.tag === e.tag && n.kind === e.kind && n.multi === e.multi && (t = r);
			}), n[t] = e;
		}), n;
	}
	O(n, "compileList");
	function r() {
		let e = {
			scalar: {},
			sequence: {},
			mapping: {},
			fallback: {},
			multi: {
				scalar: [],
				sequence: [],
				mapping: [],
				fallback: []
			}
		};
		function t(t) {
			t.multi ? (e.multi[t.kind].push(t), e.multi.fallback.push(t)) : e[t.kind][t.tag] = e.fallback[t.tag] = t;
		}
		O(t, "collectType");
		for (let e = 0, n = arguments.length; e < n; e += 1) arguments[e].forEach(t);
		return e;
	}
	O(r, "compileMap");
	function i(e) {
		return this.extend(e);
	}
	return O(i, "Schema2"), i.prototype.extend = /* @__PURE__ */ O(function(a) {
		let o = [], s = [];
		if (a instanceof t) s.push(a);
		else if (Array.isArray(a)) s = s.concat(a);
		else if (a && (Array.isArray(a.implicit) || Array.isArray(a.explicit))) a.implicit && (o = o.concat(a.implicit)), a.explicit && (s = s.concat(a.explicit));
		else throw new e("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
		o.forEach(function(n) {
			if (!(n instanceof t)) throw new e("Specified list of YAML types (or a single Type object) contains a non-Type object.");
			if (n.loadKind && n.loadKind !== "scalar") throw new e("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
			if (n.multi) throw new e("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
		}), s.forEach(function(n) {
			if (!(n instanceof t)) throw new e("Specified list of YAML types (or a single Type object) contains a non-Type object.");
		});
		let c = Object.create(i.prototype);
		return c.implicit = (this.implicit || []).concat(o), c.explicit = (this.explicit || []).concat(s), c.compiledImplicit = n(c, "implicit"), c.compiledExplicit = n(c, "explicit"), c.compiledTypeMap = r(c.compiledImplicit, c.compiledExplicit), c;
	}, "extend"), ht = i, ht;
}
O(_t, "requireSchema");
var vt, yt;
function bt() {
	return yt || (yt = 1, vt = new (q())("tag:yaml.org,2002:str", {
		kind: "scalar",
		construct: /* @__PURE__ */ O(function(e) {
			return e === null ? "" : e;
		}, "construct")
	})), vt;
}
O(bt, "requireStr");
var xt, St;
function Ct() {
	return St || (St = 1, xt = new (q())("tag:yaml.org,2002:seq", {
		kind: "sequence",
		construct: /* @__PURE__ */ O(function(e) {
			return e === null ? [] : e;
		}, "construct")
	})), xt;
}
O(Ct, "requireSeq");
var wt, Tt;
function Et() {
	return Tt || (Tt = 1, wt = new (q())("tag:yaml.org,2002:map", {
		kind: "mapping",
		construct: /* @__PURE__ */ O(function(e) {
			return e === null ? {} : e;
		}, "construct")
	})), wt;
}
O(Et, "requireMap");
var Dt, Ot;
function kt() {
	return Ot || (Ot = 1, Dt = new (_t())({ explicit: [
		bt(),
		Ct(),
		Et()
	] })), Dt;
}
O(kt, "requireFailsafe");
var At, jt;
function Mt() {
	if (jt) return At;
	jt = 1;
	let e = q();
	function t(e) {
		if (e === null) return !0;
		let t = e.length;
		return t === 1 && e === "~" || t === 4 && (e === "null" || e === "Null" || e === "NULL");
	}
	O(t, "resolveYamlNull");
	function n() {
		return null;
	}
	O(n, "constructYamlNull");
	function r(e) {
		return e === null;
	}
	return O(r, "isNull"), At = new e("tag:yaml.org,2002:null", {
		kind: "scalar",
		resolve: t,
		construct: n,
		predicate: r,
		represent: {
			canonical: /* @__PURE__ */ O(function() {
				return "~";
			}, "canonical"),
			lowercase: /* @__PURE__ */ O(function() {
				return "null";
			}, "lowercase"),
			uppercase: /* @__PURE__ */ O(function() {
				return "NULL";
			}, "uppercase"),
			camelcase: /* @__PURE__ */ O(function() {
				return "Null";
			}, "camelcase"),
			empty: /* @__PURE__ */ O(function() {
				return "";
			}, "empty")
		},
		defaultStyle: "lowercase"
	}), At;
}
O(Mt, "require_null");
var Nt, Pt;
function Ft() {
	if (Pt) return Nt;
	Pt = 1;
	let e = q();
	function t(e) {
		if (e === null) return !1;
		let t = e.length;
		return t === 4 && (e === "true" || e === "True" || e === "TRUE") || t === 5 && (e === "false" || e === "False" || e === "FALSE");
	}
	O(t, "resolveYamlBoolean");
	function n(e) {
		return e === "true" || e === "True" || e === "TRUE";
	}
	O(n, "constructYamlBoolean");
	function r(e) {
		return Object.prototype.toString.call(e) === "[object Boolean]";
	}
	return O(r, "isBoolean"), Nt = new e("tag:yaml.org,2002:bool", {
		kind: "scalar",
		resolve: t,
		construct: n,
		predicate: r,
		represent: {
			lowercase: /* @__PURE__ */ O(function(e) {
				return e ? "true" : "false";
			}, "lowercase"),
			uppercase: /* @__PURE__ */ O(function(e) {
				return e ? "TRUE" : "FALSE";
			}, "uppercase"),
			camelcase: /* @__PURE__ */ O(function(e) {
				return e ? "True" : "False";
			}, "camelcase")
		},
		defaultStyle: "lowercase"
	}), Nt;
}
O(Ft, "requireBool");
var It, Lt;
function Rt() {
	if (Lt) return It;
	Lt = 1;
	let e = ot(), t = q();
	function n(e) {
		return e >= 48 && e <= 57 || e >= 65 && e <= 70 || e >= 97 && e <= 102;
	}
	O(n, "isHexCode");
	function r(e) {
		return e >= 48 && e <= 55;
	}
	O(r, "isOctCode");
	function i(e) {
		return e >= 48 && e <= 57;
	}
	O(i, "isDecCode");
	function a(e) {
		if (e === null) return !1;
		let t = e.length, a = 0, s = !1;
		if (!t) return !1;
		let c = e[a];
		if ((c === "-" || c === "+") && (c = e[++a]), c === "0") {
			if (a + 1 === t) return !0;
			if (c = e[++a], c === "b") {
				for (a++; a < t; a++) {
					if (c = e[a], c !== "0" && c !== "1") return !1;
					s = !0;
				}
				return s && isFinite(o(e));
			}
			if (c === "x") {
				for (a++; a < t; a++) {
					if (!n(e.charCodeAt(a))) return !1;
					s = !0;
				}
				return s && isFinite(o(e));
			}
			if (c === "o") {
				for (a++; a < t; a++) {
					if (!r(e.charCodeAt(a))) return !1;
					s = !0;
				}
				return s && isFinite(o(e));
			}
		}
		for (; a < t; a++) {
			if (!i(e.charCodeAt(a))) return !1;
			s = !0;
		}
		return s ? isFinite(o(e)) : !1;
	}
	O(a, "resolveYamlInteger");
	function o(e) {
		let t = e, n = 1, r = t[0];
		if ((r === "-" || r === "+") && (r === "-" && (n = -1), t = t.slice(1), r = t[0]), t === "0") return 0;
		if (r === "0") {
			if (t[1] === "b") return n * parseInt(t.slice(2), 2);
			if (t[1] === "x") return n * parseInt(t.slice(2), 16);
			if (t[1] === "o") return n * parseInt(t.slice(2), 8);
		}
		return n * parseInt(t, 10);
	}
	O(o, "parseYamlInteger");
	function s(e) {
		return o(e);
	}
	O(s, "constructYamlInteger");
	function c(t) {
		return Object.prototype.toString.call(t) === "[object Number]" && t % 1 == 0 && !e.isNegativeZero(t);
	}
	return O(c, "isInteger"), It = new t("tag:yaml.org,2002:int", {
		kind: "scalar",
		resolve: a,
		construct: s,
		predicate: c,
		represent: {
			binary: /* @__PURE__ */ O(function(e) {
				return e >= 0 ? "0b" + e.toString(2) : "-0b" + e.toString(2).slice(1);
			}, "binary"),
			octal: /* @__PURE__ */ O(function(e) {
				return e >= 0 ? "0o" + e.toString(8) : "-0o" + e.toString(8).slice(1);
			}, "octal"),
			decimal: /* @__PURE__ */ O(function(e) {
				return e.toString(10);
			}, "decimal"),
			hexadecimal: /* @__PURE__ */ O(function(e) {
				return e >= 0 ? "0x" + e.toString(16).toUpperCase() : "-0x" + e.toString(16).toUpperCase().slice(1);
			}, "hexadecimal")
		},
		defaultStyle: "decimal",
		styleAliases: {
			binary: [2, "bin"],
			octal: [8, "oct"],
			decimal: [10, "dec"],
			hexadecimal: [16, "hex"]
		}
	}), It;
}
O(Rt, "requireInt");
var zt, Bt;
function Vt() {
	if (Bt) return zt;
	Bt = 1;
	let e = ot(), t = q(), n = /* @__PURE__ */ RegExp("^(?:[-+]?(?:[0-9]+)(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"), r = /* @__PURE__ */ RegExp("^(?:[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
	function i(e) {
		return e === null || !n.test(e) ? !1 : isFinite(parseFloat(e, 10)) ? !0 : r.test(e);
	}
	O(i, "resolveYamlFloat");
	function a(e) {
		let t = e.toLowerCase(), n = t[0] === "-" ? -1 : 1;
		return "+-".indexOf(t[0]) >= 0 && (t = t.slice(1)), t === ".inf" ? n === 1 ? Infinity : -Infinity : t === ".nan" ? NaN : n * parseFloat(t, 10);
	}
	O(a, "constructYamlFloat");
	let o = /^[-+]?[0-9]+e/;
	function s(t, n) {
		if (isNaN(t)) switch (n) {
			case "lowercase": return ".nan";
			case "uppercase": return ".NAN";
			case "camelcase": return ".NaN";
		}
		else if (t === Infinity) switch (n) {
			case "lowercase": return ".inf";
			case "uppercase": return ".INF";
			case "camelcase": return ".Inf";
		}
		else if (t === -Infinity) switch (n) {
			case "lowercase": return "-.inf";
			case "uppercase": return "-.INF";
			case "camelcase": return "-.Inf";
		}
		else if (e.isNegativeZero(t)) return "-0.0";
		let r = t.toString(10);
		return o.test(r) ? r.replace("e", ".e") : r;
	}
	O(s, "representYamlFloat");
	function c(t) {
		return Object.prototype.toString.call(t) === "[object Number]" && (t % 1 != 0 || e.isNegativeZero(t));
	}
	return O(c, "isFloat"), zt = new t("tag:yaml.org,2002:float", {
		kind: "scalar",
		resolve: i,
		construct: a,
		predicate: c,
		represent: s,
		defaultStyle: "lowercase"
	}), zt;
}
O(Vt, "requireFloat");
var Ht, Ut;
function Wt() {
	return Ut || (Ut = 1, Ht = kt().extend({ implicit: [
		Mt(),
		Ft(),
		Rt(),
		Vt()
	] })), Ht;
}
O(Wt, "requireJson");
var Gt, Kt;
function qt() {
	return Kt || (Kt = 1, Gt = Wt()), Gt;
}
O(qt, "requireCore");
var Jt, Yt;
function Xt() {
	if (Yt) return Jt;
	Yt = 1;
	let e = q(), t = /* @__PURE__ */ RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"), n = /* @__PURE__ */ RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$");
	function r(e) {
		return e === null ? !1 : t.exec(e) !== null || n.exec(e) !== null;
	}
	O(r, "resolveYamlTimestamp");
	function i(e) {
		let r = 0, i = null, a = t.exec(e);
		if (a === null && (a = n.exec(e)), a === null) throw Error("Date resolve error");
		let o = +a[1], s = a[2] - 1, c = +a[3];
		if (!a[4]) return new Date(Date.UTC(o, s, c));
		let l = +a[4], u = +a[5], d = +a[6];
		if (a[7]) {
			for (r = a[7].slice(0, 3); r.length < 3;) r += "0";
			r = +r;
		}
		if (a[9]) {
			let e = +a[10], t = +(a[11] || 0);
			i = (e * 60 + t) * 6e4, a[9] === "-" && (i = -i);
		}
		let f = new Date(Date.UTC(o, s, c, l, u, d, r));
		return i && f.setTime(f.getTime() - i), f;
	}
	O(i, "constructYamlTimestamp");
	function a(e) {
		return e.toISOString();
	}
	return O(a, "representYamlTimestamp"), Jt = new e("tag:yaml.org,2002:timestamp", {
		kind: "scalar",
		resolve: r,
		construct: i,
		instanceOf: Date,
		represent: a
	}), Jt;
}
O(Xt, "requireTimestamp");
var Zt, Qt;
function $t() {
	if (Qt) return Zt;
	Qt = 1;
	let e = q();
	function t(e) {
		return e === "<<" || e === null;
	}
	return O(t, "resolveYamlMerge"), Zt = new e("tag:yaml.org,2002:merge", {
		kind: "scalar",
		resolve: t
	}), Zt;
}
O($t, "requireMerge");
var en, tn;
function nn() {
	if (tn) return en;
	tn = 1;
	let e = q();
	function t(e) {
		if (e === null) return !1;
		let t = 0, n = e.length;
		for (let r = 0; r < n; r++) {
			let n = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r".indexOf(e.charAt(r));
			if (!(n > 64)) {
				if (n < 0) return !1;
				t += 6;
			}
		}
		return t % 8 == 0;
	}
	O(t, "resolveYamlBinary");
	function n(e) {
		let t = e.replace(/[\r\n=]/g, ""), n = t.length, r = 0, i = [];
		for (let e = 0; e < n; e++) e % 4 == 0 && e && (i.push(r >> 16 & 255), i.push(r >> 8 & 255), i.push(r & 255)), r = r << 6 | "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r".indexOf(t.charAt(e));
		let a = n % 4 * 6;
		return a === 0 ? (i.push(r >> 16 & 255), i.push(r >> 8 & 255), i.push(r & 255)) : a === 18 ? (i.push(r >> 10 & 255), i.push(r >> 2 & 255)) : a === 12 && i.push(r >> 4 & 255), new Uint8Array(i);
	}
	O(n, "constructYamlBinary");
	function r(e) {
		let t = "", n = 0, r = e.length, i = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";
		for (let a = 0; a < r; a++) a % 3 == 0 && a && (t += i[n >> 18 & 63], t += i[n >> 12 & 63], t += i[n >> 6 & 63], t += i[n & 63]), n = (n << 8) + e[a];
		let a = r % 3;
		return a === 0 ? (t += i[n >> 18 & 63], t += i[n >> 12 & 63], t += i[n >> 6 & 63], t += i[n & 63]) : a === 2 ? (t += i[n >> 10 & 63], t += i[n >> 4 & 63], t += i[n << 2 & 63], t += i[64]) : a === 1 && (t += i[n >> 2 & 63], t += i[n << 4 & 63], t += i[64], t += i[64]), t;
	}
	O(r, "representYamlBinary");
	function i(e) {
		return Object.prototype.toString.call(e) === "[object Uint8Array]";
	}
	return O(i, "isBinary"), en = new e("tag:yaml.org,2002:binary", {
		kind: "scalar",
		resolve: t,
		construct: n,
		predicate: i,
		represent: r
	}), en;
}
O(nn, "requireBinary");
var rn, an;
function on() {
	if (an) return rn;
	an = 1;
	let e = q(), t = Object.prototype.hasOwnProperty, n = Object.prototype.toString;
	function r(e) {
		if (e === null) return !0;
		let r = [], i = e;
		for (let e = 0, a = i.length; e < a; e += 1) {
			let a = i[e], o = !1;
			if (n.call(a) !== "[object Object]") return !1;
			let s;
			for (s in a) if (t.call(a, s)) {
				if (!o) o = !0;
				else return !1;
			}
			if (!o) return !1;
			if (r.indexOf(s) === -1) r.push(s);
			else return !1;
		}
		return !0;
	}
	O(r, "resolveYamlOmap");
	function i(e) {
		return e === null ? [] : e;
	}
	return O(i, "constructYamlOmap"), rn = new e("tag:yaml.org,2002:omap", {
		kind: "sequence",
		resolve: r,
		construct: i
	}), rn;
}
O(on, "requireOmap");
var sn, cn;
function ln() {
	if (cn) return sn;
	cn = 1;
	let e = q(), t = Object.prototype.toString;
	function n(e) {
		if (e === null) return !0;
		let n = e, r = Array(n.length);
		for (let e = 0, i = n.length; e < i; e += 1) {
			let i = n[e];
			if (t.call(i) !== "[object Object]") return !1;
			let a = Object.keys(i);
			if (a.length !== 1) return !1;
			r[e] = [a[0], i[a[0]]];
		}
		return !0;
	}
	O(n, "resolveYamlPairs");
	function r(e) {
		if (e === null) return [];
		let t = e, n = Array(t.length);
		for (let e = 0, r = t.length; e < r; e += 1) {
			let r = t[e], i = Object.keys(r);
			n[e] = [i[0], r[i[0]]];
		}
		return n;
	}
	return O(r, "constructYamlPairs"), sn = new e("tag:yaml.org,2002:pairs", {
		kind: "sequence",
		resolve: n,
		construct: r
	}), sn;
}
O(ln, "requirePairs");
var un, dn;
function fn() {
	if (dn) return un;
	dn = 1;
	let e = q(), t = Object.prototype.hasOwnProperty;
	function n(e) {
		if (e === null) return !0;
		let n = e;
		for (let e in n) if (t.call(n, e) && n[e] !== null) return !1;
		return !0;
	}
	O(n, "resolveYamlSet");
	function r(e) {
		return e === null ? {} : e;
	}
	return O(r, "constructYamlSet"), un = new e("tag:yaml.org,2002:set", {
		kind: "mapping",
		resolve: n,
		construct: r
	}), un;
}
O(fn, "requireSet");
var pn, mn;
function hn() {
	return mn || (mn = 1, pn = qt().extend({
		implicit: [Xt(), $t()],
		explicit: [
			nn(),
			on(),
			ln(),
			fn()
		]
	})), pn;
}
O(hn, "require_default");
var gn;
function _n() {
	if (gn) return it;
	gn = 1;
	let e = ot(), t = lt(), n = ft(), r = hn(), i = Object.prototype.hasOwnProperty, a = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, o = /[\x85\u2028\u2029]/, s = /[,\[\]{}]/, c = /^(?:!|!!|![0-9A-Za-z-]+!)$/, l = /^(?:!|[^,\[\]{}])(?:%[0-9a-f]{2}|[0-9a-z\-#;/?:@&=+$,_.!~*'()\[\]])*$/i;
	function u(e) {
		return Object.prototype.toString.call(e);
	}
	O(u, "_class");
	function d(e) {
		return e === 10 || e === 13;
	}
	O(d, "isEol");
	function f(e) {
		return e === 9 || e === 32;
	}
	O(f, "isWhiteSpace");
	function p(e) {
		return e === 9 || e === 32 || e === 10 || e === 13;
	}
	O(p, "isWsOrEol");
	function m(e) {
		return e === 44 || e === 91 || e === 93 || e === 123 || e === 125;
	}
	O(m, "isFlowIndicator");
	function h(e) {
		if (e >= 48 && e <= 57) return e - 48;
		let t = e | 32;
		return t >= 97 && t <= 102 ? t - 97 + 10 : -1;
	}
	O(h, "fromHexCode");
	function g(e) {
		return e === 120 ? 2 : e === 117 ? 4 : e === 85 ? 8 : 0;
	}
	O(g, "escapedHexLen");
	function _(e) {
		return e >= 48 && e <= 57 ? e - 48 : -1;
	}
	O(_, "fromDecimalCode");
	function v(e) {
		switch (e) {
			case 48: return "\0";
			case 97: return "\x07";
			case 98: return "\b";
			case 116: return "	";
			case 9: return "	";
			case 110: return "\n";
			case 118: return "\v";
			case 102: return "\f";
			case 114: return "\r";
			case 101: return "\x1B";
			case 32: return " ";
			case 34: return "\"";
			case 47: return "/";
			case 92: return "\\";
			case 78: return "";
			case 95: return "\xA0";
			case 76: return "\u2028";
			case 80: return "\u2029";
			default: return "";
		}
	}
	O(v, "simpleEscapeSequence");
	function y(e) {
		return e <= 65535 ? String.fromCharCode(e) : String.fromCharCode((e - 65536 >> 10) + 55296, (e - 65536 & 1023) + 56320);
	}
	O(y, "charFromCodepoint");
	function b(e, t, n) {
		t === "__proto__" ? Object.defineProperty(e, t, {
			configurable: !0,
			enumerable: !0,
			writable: !0,
			value: n
		}) : e[t] = n;
	}
	O(b, "setProperty");
	let x = Array(256), S = Array(256);
	for (let e = 0; e < 256; e++) x[e] = +!!v(e), S[e] = v(e);
	function C(e, t) {
		this.input = e, this.filename = t.filename || null, this.schema = t.schema || r, this.onWarning = t.onWarning || null, this.legacy = t.legacy || !1, this.json = t.json || !1, this.listener = t.listener || null, this.maxDepth = typeof t.maxDepth == "number" ? t.maxDepth : 100, this.maxTotalMergeKeys = typeof t.maxTotalMergeKeys == "number" ? t.maxTotalMergeKeys : 1e4, this.implicitTypes = this.schema.compiledImplicit, this.typeMap = this.schema.compiledTypeMap, this.length = e.length, this.position = 0, this.line = 0, this.lineStart = 0, this.lineIndent = 0, this.depth = 0, this.totalMergeKeys = 0, this.firstTabInLine = -1, this.documents = [], this.anchorMapTransactions = [];
	}
	O(C, "State");
	function w(e, r) {
		let i = {
			name: e.filename,
			buffer: e.input.slice(0, -1),
			position: e.position,
			line: e.line,
			column: e.position - e.lineStart
		};
		return i.snippet = n(i), new t(r, i);
	}
	O(w, "generateError");
	function T(e, t) {
		throw w(e, t);
	}
	O(T, "throwError");
	function E(e, t) {
		e.onWarning && e.onWarning.call(null, w(e, t));
	}
	O(E, "throwWarning");
	function D(e, t, n) {
		let r = e.anchorMapTransactions;
		if (r.length !== 0) {
			let n = r[r.length - 1];
			i.call(n, t) || (n[t] = {
				existed: i.call(e.anchorMap, t),
				value: e.anchorMap[t]
			});
		}
		e.anchorMap[t] = n;
	}
	O(D, "storeAnchor");
	function k(e) {
		e.anchorMapTransactions.push(/* @__PURE__ */ Object.create(null));
	}
	O(k, "beginAnchorTransaction");
	function A(e) {
		let t = e.anchorMapTransactions.pop(), n = e.anchorMapTransactions;
		if (n.length === 0) return;
		let r = n[n.length - 1], a = Object.keys(t);
		for (let e = 0, n = a.length; e < n; e += 1) {
			let n = a[e];
			i.call(r, n) || (r[n] = t[n]);
		}
	}
	O(A, "commitAnchorTransaction");
	function j(e) {
		let t = e.anchorMapTransactions.pop(), n = Object.keys(t);
		for (let r = n.length - 1; r >= 0; --r) {
			let i = t[n[r]];
			i.existed ? e.anchorMap[n[r]] = i.value : delete e.anchorMap[n[r]];
		}
	}
	O(j, "rollbackAnchorTransaction");
	function M(e) {
		return {
			position: e.position,
			line: e.line,
			lineStart: e.lineStart,
			lineIndent: e.lineIndent,
			firstTabInLine: e.firstTabInLine,
			tag: e.tag,
			anchor: e.anchor,
			kind: e.kind,
			result: e.result
		};
	}
	O(M, "snapshotState");
	function N(e, t) {
		e.position = t.position, e.line = t.line, e.lineStart = t.lineStart, e.lineIndent = t.lineIndent, e.firstTabInLine = t.firstTabInLine, e.tag = t.tag, e.anchor = t.anchor, e.kind = t.kind, e.result = t.result;
	}
	O(N, "restoreState");
	let P = {
		YAML: /* @__PURE__ */ O(function(e, t, n) {
			e.version !== null && T(e, "duplication of %YAML directive"), n.length !== 1 && T(e, "YAML directive accepts exactly one argument");
			let r = /^([0-9]+)\.([0-9]+)$/.exec(n[0]);
			r === null && T(e, "ill-formed argument of the YAML directive");
			let i = parseInt(r[1], 10), a = parseInt(r[2], 10);
			i !== 1 && T(e, "unacceptable YAML version of the document"), e.version = n[0], e.checkLineBreaks = a < 2, a !== 1 && a !== 2 && E(e, "unsupported YAML version of the document");
		}, "handleYamlDirective"),
		TAG: /* @__PURE__ */ O(function(e, t, n) {
			let r;
			n.length !== 2 && T(e, "TAG directive accepts exactly two arguments");
			let a = n[0];
			r = n[1], c.test(a) || T(e, "ill-formed tag handle (first argument) of the TAG directive"), i.call(e.tagMap, a) && T(e, "there is a previously declared suffix for \"" + a + "\" tag handle"), l.test(r) || T(e, "ill-formed tag prefix (second argument) of the TAG directive");
			try {
				r = decodeURIComponent(r);
			} catch {
				T(e, "tag prefix is malformed: " + r);
			}
			e.tagMap[a] = r;
		}, "handleTagDirective")
	};
	function F(e, t, n, r) {
		if (t < n) {
			let i = e.input.slice(t, n);
			if (r) for (let t = 0, n = i.length; t < n; t += 1) {
				let n = i.charCodeAt(t);
				n === 9 || n >= 32 && n <= 1114111 || T(e, "expected valid JSON character");
			}
			else a.test(i) && T(e, "the stream contains non-printable characters");
			e.result += i;
		}
	}
	O(F, "captureSegment");
	function I(t, n, r, a) {
		e.isObject(r) || T(t, "cannot merge mappings; the provided source object is unacceptable");
		let o = Object.keys(r);
		for (let e = 0, s = o.length; e < s; e += 1) {
			let s = o[e];
			t.maxTotalMergeKeys !== -1 && ++t.totalMergeKeys > t.maxTotalMergeKeys && T(t, "merge keys exceeded maxTotalMergeKeys (" + t.maxTotalMergeKeys + ")"), i.call(n, s) || (b(n, s, r[s]), a[s] = !0);
		}
	}
	O(I, "mergeMappings");
	function L(e, t, n, r, a, o, s, c, l) {
		if (Array.isArray(a)) {
			a = Array.prototype.slice.call(a);
			for (let t = 0, n = a.length; t < n; t += 1) Array.isArray(a[t]) && T(e, "nested arrays are not supported inside keys"), typeof a == "object" && u(a[t]) === "[object Object]" && (a[t] = "[object Object]");
		}
		if (typeof a == "object" && u(a) === "[object Object]" && (a = "[object Object]"), a = String(a), t === null && (t = {}), r === "tag:yaml.org,2002:merge") {
			if (Array.isArray(o)) for (let r = 0, i = o.length; r < i; r += 1) I(e, t, o[r], n);
			else I(e, t, o, n);
		} else !e.json && !i.call(n, a) && i.call(t, a) && (e.line = s || e.line, e.lineStart = c || e.lineStart, e.position = l || e.position, T(e, "duplicated mapping key")), b(t, a, o), delete n[a];
		return t;
	}
	O(L, "storeMappingPair");
	function R(e) {
		let t = e.input.charCodeAt(e.position);
		t === 10 ? e.position++ : t === 13 ? (e.position++, e.input.charCodeAt(e.position) === 10 && e.position++) : T(e, "a line break is expected"), e.line += 1, e.lineStart = e.position, e.firstTabInLine = -1;
	}
	O(R, "readLineBreak");
	function z(e, t, n) {
		let r = 0, i = e.input.charCodeAt(e.position);
		for (; i !== 0;) {
			for (; f(i);) i === 9 && e.firstTabInLine === -1 && (e.firstTabInLine = e.position), i = e.input.charCodeAt(++e.position);
			if (t && i === 35) do
				i = e.input.charCodeAt(++e.position);
			while (i !== 10 && i !== 13 && i !== 0);
			if (d(i)) for (R(e), i = e.input.charCodeAt(e.position), r++, e.lineIndent = 0; i === 32;) e.lineIndent++, i = e.input.charCodeAt(++e.position);
			else break;
		}
		return n !== -1 && r !== 0 && e.lineIndent < n && E(e, "deficient indentation"), r;
	}
	O(z, "skipSeparationSpace");
	function B(e) {
		let t = e.position, n = e.input.charCodeAt(t);
		return !!((n === 45 || n === 46) && n === e.input.charCodeAt(t + 1) && n === e.input.charCodeAt(t + 2) && (t += 3, n = e.input.charCodeAt(t), n === 0 || p(n)));
	}
	O(B, "testDocumentSeparator");
	function ee(t, n) {
		n === 1 ? t.result += " " : n > 1 && (t.result += e.repeat("\n", n - 1));
	}
	O(ee, "writeFoldedLines");
	function te(e, t, n) {
		let r, i, a, o, s, c, l = e.kind, u = e.result, h = e.input.charCodeAt(e.position);
		if (p(h) || m(h) || h === 35 || h === 38 || h === 42 || h === 33 || h === 124 || h === 62 || h === 39 || h === 34 || h === 37 || h === 64 || h === 96) return !1;
		if (h === 63 || h === 45) {
			let t = e.input.charCodeAt(e.position + 1);
			if (p(t) || n && m(t)) return !1;
		}
		for (e.kind = "scalar", e.result = "", r = i = e.position, a = !1; h !== 0;) {
			if (h === 58) {
				let t = e.input.charCodeAt(e.position + 1);
				if (p(t) || n && m(t)) break;
			} else if (h === 35) {
				if (p(e.input.charCodeAt(e.position - 1))) break;
			} else if (e.position === e.lineStart && B(e) || n && m(h)) break;
			else if (d(h)) {
				if (o = e.line, s = e.lineStart, c = e.lineIndent, z(e, !1, -1), e.lineIndent >= t) {
					a = !0, h = e.input.charCodeAt(e.position);
					continue;
				}
				e.position = i, e.line = o, e.lineStart = s, e.lineIndent = c;
				break;
			}
			a &&= (F(e, r, i, !1), ee(e, e.line - o), r = i = e.position, !1), f(h) || (i = e.position + 1), h = e.input.charCodeAt(++e.position);
		}
		return F(e, r, i, !1), e.result ? !0 : (e.kind = l, e.result = u, !1);
	}
	O(te, "readPlainScalar");
	function ne(e, t) {
		let n, r, i = e.input.charCodeAt(e.position);
		if (i !== 39) return !1;
		for (e.kind = "scalar", e.result = "", e.position++, n = r = e.position; (i = e.input.charCodeAt(e.position)) !== 0;) if (i === 39) {
			if (F(e, n, e.position, !0), i = e.input.charCodeAt(++e.position), i === 39) n = e.position, e.position++, r = e.position;
			else return !0;
		} else d(i) ? (F(e, n, r, !0), ee(e, z(e, !1, t)), n = r = e.position) : e.position === e.lineStart && B(e) ? T(e, "unexpected end of the document within a single quoted scalar") : (e.position++, f(i) || (r = e.position));
		T(e, "unexpected end of the stream within a single quoted scalar");
	}
	O(ne, "readSingleQuotedScalar");
	function re(e, t) {
		let n, r, i, a = e.input.charCodeAt(e.position);
		if (a !== 34) return !1;
		for (e.kind = "scalar", e.result = "", e.position++, n = r = e.position; (a = e.input.charCodeAt(e.position)) !== 0;) if (a === 34) return F(e, n, e.position, !0), e.position++, !0;
		else if (a === 92) {
			if (F(e, n, e.position, !0), a = e.input.charCodeAt(++e.position), d(a)) z(e, !1, t);
			else if (a < 256 && x[a]) e.result += S[a], e.position++;
			else if ((i = g(a)) > 0) {
				let t = i, n = 0;
				for (; t > 0; t--) a = e.input.charCodeAt(++e.position), (i = h(a)) >= 0 ? n = (n << 4) + i : T(e, "expected hexadecimal character");
				e.result += y(n), e.position++;
			} else T(e, "unknown escape sequence");
			n = r = e.position;
		} else d(a) ? (F(e, n, r, !0), ee(e, z(e, !1, t)), n = r = e.position) : e.position === e.lineStart && B(e) ? T(e, "unexpected end of the document within a double quoted scalar") : (e.position++, f(a) || (r = e.position));
		T(e, "unexpected end of the stream within a double quoted scalar");
	}
	O(re, "readDoubleQuotedScalar");
	function ie(e, t) {
		let n = !0, r, i, a, o = e.tag, s, c = e.anchor, l, u, d, f, m = /* @__PURE__ */ Object.create(null), h, g, _, v = e.input.charCodeAt(e.position);
		if (v === 91) l = 93, f = !1, s = [];
		else if (v === 123) l = 125, f = !0, s = {};
		else return !1;
		for (e.anchor !== null && D(e, e.anchor, s), v = e.input.charCodeAt(++e.position); v !== 0;) {
			if (z(e, !0, t), v = e.input.charCodeAt(e.position), v === l) return e.position++, e.tag = o, e.anchor = c, e.kind = f ? "mapping" : "sequence", e.result = s, !0;
			n ? v === 44 && T(e, "expected the node content, but found ','") : T(e, "missed comma between flow collection entries"), g = h = _ = null, u = d = !1, v === 63 && p(e.input.charCodeAt(e.position + 1)) && (u = d = !0, e.position++, z(e, !0, t)), r = e.line, i = e.lineStart, a = e.position, H(e, t, 1, !1, !0), g = e.tag, h = e.result, z(e, !0, t), v = e.input.charCodeAt(e.position), (d || e.line === r) && v === 58 && (u = !0, v = e.input.charCodeAt(++e.position), z(e, !0, t), H(e, t, 1, !1, !0), _ = e.result), f ? L(e, s, m, g, h, _, r, i, a) : u ? s.push(L(e, null, m, g, h, _, r, i, a)) : s.push(h), z(e, !0, t), v = e.input.charCodeAt(e.position), v === 44 ? (n = !0, v = e.input.charCodeAt(++e.position)) : n = !1;
		}
		T(e, "unexpected end of the stream within a flow collection");
	}
	O(ie, "readFlowCollection");
	function ae(t, n) {
		let r, i = 1, a = !1, o = !1, s = n, c = 0, l = !1, u, p = t.input.charCodeAt(t.position);
		if (p === 124) r = !1;
		else if (p === 62) r = !0;
		else return !1;
		for (t.kind = "scalar", t.result = ""; p !== 0;) if (p = t.input.charCodeAt(++t.position), p === 43 || p === 45) i === 1 ? i = p === 43 ? 3 : 2 : T(t, "repeat of a chomping mode identifier");
		else if ((u = _(p)) >= 0) u === 0 ? T(t, "bad explicit indentation width of a block scalar; it cannot be less than one") : o ? T(t, "repeat of an indentation width identifier") : (s = n + u - 1, o = !0);
		else break;
		if (f(p)) {
			do
				p = t.input.charCodeAt(++t.position);
			while (f(p));
			if (p === 35) do
				p = t.input.charCodeAt(++t.position);
			while (!d(p) && p !== 0);
		}
		for (; p !== 0;) {
			for (R(t), t.lineIndent = 0, p = t.input.charCodeAt(t.position); (!o || t.lineIndent < s) && p === 32;) t.lineIndent++, p = t.input.charCodeAt(++t.position);
			if (!o && t.lineIndent > s && (s = t.lineIndent), d(p)) {
				c++;
				continue;
			}
			if (!o && s === 0 && T(t, "missing indentation for block scalar"), t.lineIndent < s) {
				i === 3 ? t.result += e.repeat("\n", a ? 1 + c : c) : i === 1 && a && (t.result += "\n");
				break;
			}
			r ? f(p) ? (l = !0, t.result += e.repeat("\n", a ? 1 + c : c)) : l ? (l = !1, t.result += e.repeat("\n", c + 1)) : c === 0 ? a && (t.result += " ") : t.result += e.repeat("\n", c) : t.result += e.repeat("\n", a ? 1 + c : c), a = !0, o = !0, c = 0;
			let n = t.position;
			for (; !d(p) && p !== 0;) p = t.input.charCodeAt(++t.position);
			F(t, n, t.position, !1);
		}
		return !0;
	}
	O(ae, "readBlockScalar");
	function oe(e, t) {
		let n = e.tag, r = e.anchor, i = [], a = !1;
		if (e.firstTabInLine !== -1) return !1;
		e.anchor !== null && D(e, e.anchor, i);
		let o = e.input.charCodeAt(e.position);
		for (; o !== 0 && (e.firstTabInLine !== -1 && (e.position = e.firstTabInLine, T(e, "tab characters must not be used in indentation")), o === 45 && p(e.input.charCodeAt(e.position + 1)));) {
			if (a = !0, e.position++, z(e, !0, -1) && e.lineIndent <= t) {
				i.push(null), o = e.input.charCodeAt(e.position);
				continue;
			}
			let n = e.line;
			if (H(e, t, 3, !1, !0), i.push(e.result), z(e, !0, -1), o = e.input.charCodeAt(e.position), (e.line === n || e.lineIndent > t) && o !== 0) T(e, "bad indentation of a sequence entry");
			else if (e.lineIndent < t) break;
		}
		return a ? (e.tag = n, e.anchor = r, e.kind = "sequence", e.result = i, !0) : !1;
	}
	O(oe, "readBlockSequence");
	function se(e, t, n) {
		let r, i, a, o, s = e.tag, c = e.anchor, l = {}, u = /* @__PURE__ */ Object.create(null), d = null, m = null, h = null, g = !1, _ = !1;
		if (e.firstTabInLine !== -1) return !1;
		e.anchor !== null && D(e, e.anchor, l);
		let v = e.input.charCodeAt(e.position);
		for (; v !== 0;) {
			!g && e.firstTabInLine !== -1 && (e.position = e.firstTabInLine, T(e, "tab characters must not be used in indentation"));
			let y = e.input.charCodeAt(e.position + 1), b = e.line;
			if ((v === 63 || v === 58) && p(y)) v === 63 ? (g && (L(e, l, u, d, m, null, i, a, o), d = m = h = null), _ = !0, g = !0, r = !0) : g ? (g = !1, r = !0) : T(e, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"), e.position += 1, v = y;
			else {
				if (i = e.line, a = e.lineStart, o = e.position, !H(e, n, 2, !1, !0)) break;
				if (e.line === b) {
					for (v = e.input.charCodeAt(e.position); f(v);) v = e.input.charCodeAt(++e.position);
					if (v === 58) v = e.input.charCodeAt(++e.position), p(v) || T(e, "a whitespace character is expected after the key-value separator within a block mapping"), g && (L(e, l, u, d, m, null, i, a, o), d = m = h = null), _ = !0, g = !1, r = !1, d = e.tag, m = e.result;
					else if (_) T(e, "can not read an implicit mapping pair; a colon is missed");
					else return e.tag = s, e.anchor = c, !0;
				} else if (_) T(e, "can not read a block mapping entry; a multiline key may not be an implicit key");
				else return e.tag = s, e.anchor = c, !0;
			}
			if ((e.line === b || e.lineIndent > t) && (g && (i = e.line, a = e.lineStart, o = e.position), H(e, t, 4, !0, r) && (g ? m = e.result : h = e.result), g || (L(e, l, u, d, m, h, i, a, o), d = m = h = null), z(e, !0, -1), v = e.input.charCodeAt(e.position)), (e.line === b || e.lineIndent > t) && v !== 0) T(e, "bad indentation of a mapping entry");
			else if (e.lineIndent < t) break;
		}
		return g && L(e, l, u, d, m, null, i, a, o), _ && (e.tag = s, e.anchor = c, e.kind = "mapping", e.result = l), _;
	}
	O(se, "readBlockMapping");
	function ce(e) {
		let t = !1, n = !1, r, a, o = e.input.charCodeAt(e.position);
		if (o !== 33) return !1;
		e.tag !== null && T(e, "duplication of a tag property"), o = e.input.charCodeAt(++e.position), o === 60 ? (t = !0, o = e.input.charCodeAt(++e.position)) : o === 33 ? (n = !0, r = "!!", o = e.input.charCodeAt(++e.position)) : r = "!";
		let u = e.position;
		if (t) {
			do
				o = e.input.charCodeAt(++e.position);
			while (o !== 0 && o !== 62);
			e.position < e.length ? (a = e.input.slice(u, e.position), o = e.input.charCodeAt(++e.position)) : T(e, "unexpected end of the stream within a verbatim tag");
		} else {
			for (; o !== 0 && !p(o);) o === 33 && (n ? T(e, "tag suffix cannot contain exclamation marks") : (r = e.input.slice(u - 1, e.position + 1), c.test(r) || T(e, "named tag handle cannot contain such characters"), n = !0, u = e.position + 1)), o = e.input.charCodeAt(++e.position);
			a = e.input.slice(u, e.position), s.test(a) && T(e, "tag suffix cannot contain flow indicator characters");
		}
		a && !l.test(a) && T(e, "tag name cannot contain such characters: " + a);
		try {
			a = decodeURIComponent(a);
		} catch {
			T(e, "tag name is malformed: " + a);
		}
		return t ? e.tag = a : i.call(e.tagMap, r) ? e.tag = e.tagMap[r] + a : r === "!" ? e.tag = "!" + a : r === "!!" ? e.tag = "tag:yaml.org,2002:" + a : T(e, "undeclared tag handle \"" + r + "\""), !0;
	}
	O(ce, "readTagProperty");
	function le(e) {
		let t = e.input.charCodeAt(e.position);
		if (t !== 38) return !1;
		e.anchor !== null && T(e, "duplication of an anchor property"), t = e.input.charCodeAt(++e.position);
		let n = e.position;
		for (; t !== 0 && !p(t) && !m(t);) t = e.input.charCodeAt(++e.position);
		return e.position === n && T(e, "name of an anchor node must contain at least one character"), e.anchor = e.input.slice(n, e.position), !0;
	}
	O(le, "readAnchorProperty");
	function ue(e) {
		let t = e.input.charCodeAt(e.position);
		if (t !== 42) return !1;
		t = e.input.charCodeAt(++e.position);
		let n = e.position;
		for (; t !== 0 && !p(t) && !m(t);) t = e.input.charCodeAt(++e.position);
		e.position === n && T(e, "name of an alias node must contain at least one character");
		let r = e.input.slice(n, e.position);
		return i.call(e.anchorMap, r) || T(e, "unidentified alias \"" + r + "\""), e.result = e.anchorMap[r], z(e, !0, -1), !0;
	}
	O(ue, "readAlias");
	function V(e, t, n, r) {
		let i = M(e);
		return k(e), N(e, t), e.tag = null, e.anchor = null, e.kind = null, e.result = null, se(e, n, r) && e.kind === "mapping" ? (A(e), !0) : (j(e), N(e, i), !1);
	}
	O(V, "tryReadBlockMappingFromProperty");
	function H(e, t, n, r, a) {
		let o, s, c = 1, l = !1, u = !1, d = null, f, p, m;
		e.depth >= e.maxDepth && T(e, "nesting exceeded maxDepth (" + e.maxDepth + ")"), e.depth += 1, e.listener !== null && e.listener("open", e), e.tag = null, e.anchor = null, e.kind = null, e.result = null;
		let h = o = s = n === 4 || n === 3;
		if (r && z(e, !0, -1) && (l = !0, e.lineIndent > t ? c = 1 : e.lineIndent === t ? c = 0 : e.lineIndent < t && (c = -1)), c === 1) for (;;) {
			let n = e.input.charCodeAt(e.position), r = M(e);
			if (l && (n === 33 && e.tag !== null || n === 38 && e.anchor !== null) || !ce(e) && !le(e)) break;
			d === null && (d = r), z(e, !0, -1) ? (l = !0, s = h, e.lineIndent > t ? c = 1 : e.lineIndent === t ? c = 0 : e.lineIndent < t && (c = -1)) : s = !1;
		}
		if (s &&= l || a, c === 1 || n === 4) {
			if (p = n === 1 || n === 2 ? t : t + 1, m = e.position - e.lineStart, c === 1) {
				if (s && (oe(e, m) || se(e, m, p)) || ie(e, p)) u = !0;
				else {
					let t = e.input.charCodeAt(e.position);
					d !== null && h && !s && t !== 124 && t !== 62 && V(e, d, d.position - d.lineStart, p) || o && ae(e, p) || ne(e, p) || re(e, p) ? u = !0 : ue(e) ? (u = !0, (e.tag !== null || e.anchor !== null) && T(e, "alias node should not have any properties")) : te(e, p, n === 1) && (u = !0, e.tag === null && (e.tag = "?")), e.anchor !== null && D(e, e.anchor, e.result);
				}
			} else c === 0 && (u = s && oe(e, m));
		}
		if (e.tag === null) e.anchor !== null && D(e, e.anchor, e.result);
		else if (e.tag === "?") {
			e.result !== null && e.kind !== "scalar" && T(e, "unacceptable node kind for !<?> tag; it should be \"scalar\", not \"" + e.kind + "\"");
			for (let t = 0, n = e.implicitTypes.length; t < n; t += 1) if (f = e.implicitTypes[t], f.resolve(e.result)) {
				e.result = f.construct(e.result), e.tag = f.tag, e.anchor !== null && D(e, e.anchor, e.result);
				break;
			}
		} else if (e.tag !== "!") {
			if (i.call(e.typeMap[e.kind || "fallback"], e.tag)) f = e.typeMap[e.kind || "fallback"][e.tag];
			else {
				f = null;
				let t = e.typeMap.multi[e.kind || "fallback"];
				for (let n = 0, r = t.length; n < r; n += 1) if (e.tag.slice(0, t[n].tag.length) === t[n].tag) {
					f = t[n];
					break;
				}
			}
			f || T(e, "unknown tag !<" + e.tag + ">"), e.result !== null && f.kind !== e.kind && T(e, "unacceptable node kind for !<" + e.tag + "> tag; it should be \"" + f.kind + "\", not \"" + e.kind + "\""), f.resolve(e.result, e.tag) ? (e.result = f.construct(e.result, e.tag), e.anchor !== null && D(e, e.anchor, e.result)) : T(e, "cannot resolve a node with !<" + e.tag + "> explicit tag");
		}
		return e.listener !== null && e.listener("close", e), --e.depth, e.tag !== null || e.anchor !== null || u;
	}
	O(H, "composeNode");
	function de(e) {
		let t = e.position, n = !1, r;
		for (e.version = null, e.checkLineBreaks = e.legacy, e.tagMap = /* @__PURE__ */ Object.create(null), e.anchorMap = /* @__PURE__ */ Object.create(null); (r = e.input.charCodeAt(e.position)) !== 0 && (z(e, !0, -1), r = e.input.charCodeAt(e.position), !(e.lineIndent > 0 || r !== 37));) {
			n = !0, r = e.input.charCodeAt(++e.position);
			let t = e.position;
			for (; r !== 0 && !p(r);) r = e.input.charCodeAt(++e.position);
			let a = e.input.slice(t, e.position), o = [];
			for (a.length < 1 && T(e, "directive name must not be less than one character in length"); r !== 0;) {
				for (; f(r);) r = e.input.charCodeAt(++e.position);
				if (r === 35) {
					do
						r = e.input.charCodeAt(++e.position);
					while (r !== 0 && !d(r));
					break;
				}
				if (d(r)) break;
				for (t = e.position; r !== 0 && !p(r);) r = e.input.charCodeAt(++e.position);
				o.push(e.input.slice(t, e.position));
			}
			r !== 0 && R(e), i.call(P, a) ? P[a](e, a, o) : E(e, "unknown document directive \"" + a + "\"");
		}
		z(e, !0, -1), e.lineIndent === 0 && e.input.charCodeAt(e.position) === 45 && e.input.charCodeAt(e.position + 1) === 45 && e.input.charCodeAt(e.position + 2) === 45 ? (e.position += 3, z(e, !0, -1)) : n && T(e, "directives end mark is expected"), H(e, e.lineIndent - 1, 4, !1, !0), z(e, !0, -1), e.checkLineBreaks && o.test(e.input.slice(t, e.position)) && E(e, "non-ASCII line breaks are interpreted as content"), e.documents.push(e.result), e.position === e.lineStart && B(e) ? e.input.charCodeAt(e.position) === 46 && (e.position += 3, z(e, !0, -1)) : e.position < e.length - 1 && T(e, "end of the stream or a document separator is expected");
	}
	O(de, "readDocument");
	function fe(e, t) {
		e = String(e), t ||= {}, e.length !== 0 && (e.charCodeAt(e.length - 1) !== 10 && e.charCodeAt(e.length - 1) !== 13 && (e += "\n"), e.charCodeAt(0) === 65279 && (e = e.slice(1)));
		let n = new C(e, t), r = e.indexOf("\0");
		for (r !== -1 && (n.position = r, T(n, "null byte is not allowed in input")), n.input += "\0"; n.input.charCodeAt(n.position) === 32;) n.lineIndent += 1, n.position += 1;
		for (; n.position < n.length - 1;) de(n);
		return n.documents;
	}
	O(fe, "loadDocuments");
	function pe(e, t, n) {
		typeof t == "object" && t && n === void 0 && (n = t, t = null);
		let r = fe(e, n);
		if (typeof t != "function") return r;
		for (let e = 0, n = r.length; e < n; e += 1) t(r[e]);
	}
	O(pe, "loadAll2");
	function me(e, n) {
		let r = fe(e, n);
		if (r.length !== 0) {
			if (r.length === 1) return r[0];
			throw new t("expected a single document in the stream, but found more");
		}
	}
	return O(me, "load2"), it.loadAll = pe, it.load = me, it;
}
O(_n, "requireLoader");
var vn = {}, yn;
function bn() {
	if (yn) return vn;
	yn = 1;
	let e = ot(), t = lt(), n = hn(), r = Object.prototype.toString, i = Object.prototype.hasOwnProperty, a = 65279, o = {};
	o[0] = "\\0", o[7] = "\\a", o[8] = "\\b", o[9] = "\\t", o[10] = "\\n", o[11] = "\\v", o[12] = "\\f", o[13] = "\\r", o[27] = "\\e", o[34] = "\\\"", o[92] = "\\\\", o[133] = "\\N", o[160] = "\\_", o[8232] = "\\L", o[8233] = "\\P";
	let s = [
		"y",
		"Y",
		"yes",
		"Yes",
		"YES",
		"on",
		"On",
		"ON",
		"n",
		"N",
		"no",
		"No",
		"NO",
		"off",
		"Off",
		"OFF"
	], c = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
	function l(e, t) {
		if (t === null) return {};
		let n = {}, r = Object.keys(t);
		for (let a = 0, o = r.length; a < o; a += 1) {
			let o = r[a], s = String(t[o]);
			o.slice(0, 2) === "!!" && (o = "tag:yaml.org,2002:" + o.slice(2));
			let c = e.compiledTypeMap.fallback[o];
			c && i.call(c.styleAliases, s) && (s = c.styleAliases[s]), n[o] = s;
		}
		return n;
	}
	O(l, "compileStyleMap");
	function u(n) {
		let r, i, a = n.toString(16).toUpperCase();
		if (n <= 255) r = "x", i = 2;
		else if (n <= 65535) r = "u", i = 4;
		else if (n <= 4294967295) r = "U", i = 8;
		else throw new t("code point within a string may not be greater than 0xFFFFFFFF");
		return "\\" + r + e.repeat("0", i - a.length) + a;
	}
	O(u, "encodeHex");
	function d(t) {
		this.schema = t.schema || n, this.indent = Math.max(1, t.indent || 2), this.noArrayIndent = t.noArrayIndent || !1, this.skipInvalid = t.skipInvalid || !1, this.flowLevel = e.isNothing(t.flowLevel) ? -1 : t.flowLevel, this.styleMap = l(this.schema, t.styles || null), this.sortKeys = t.sortKeys || !1, this.lineWidth = t.lineWidth || 80, this.noRefs = t.noRefs || !1, this.noCompatMode = t.noCompatMode || !1, this.condenseFlow = t.condenseFlow || !1, this.quotingType = t.quotingType === "\"" ? 2 : 1, this.forceQuotes = t.forceQuotes || !1, this.replacer = typeof t.replacer == "function" ? t.replacer : null, this.implicitTypes = this.schema.compiledImplicit, this.explicitTypes = this.schema.compiledExplicit, this.tag = null, this.result = "", this.duplicates = [], this.usedDuplicates = null;
	}
	O(d, "State");
	function f(t, n) {
		let r = e.repeat(" ", n), i = 0, a = "", o = t.length;
		for (; i < o;) {
			let e, n = t.indexOf("\n", i);
			n === -1 ? (e = t.slice(i), i = o) : (e = t.slice(i, n + 1), i = n + 1), e.length && e !== "\n" && (a += r), a += e;
		}
		return a;
	}
	O(f, "indentString");
	function p(t, n) {
		return "\n" + e.repeat(" ", t.indent * n);
	}
	O(p, "generateNextLine");
	function m(e, t) {
		for (let n = 0, r = e.implicitTypes.length; n < r; n += 1) if (e.implicitTypes[n].resolve(t)) return !0;
		return !1;
	}
	O(m, "testImplicitResolving");
	function h(e) {
		return e === 32 || e === 9;
	}
	O(h, "isWhitespace");
	function g(e) {
		return e >= 32 && e <= 126 || e >= 161 && e <= 55295 && e !== 8232 && e !== 8233 || e >= 57344 && e <= 65533 && e !== a || e >= 65536 && e <= 1114111;
	}
	O(g, "isPrintable");
	function _(e) {
		return g(e) && e !== a && e !== 13 && e !== 10;
	}
	O(_, "isNsCharOrWhitespace");
	function v(e, t, n) {
		let r = _(e), i = r && !h(e);
		return (n ? r : r && e !== 44 && e !== 91 && e !== 93 && e !== 123 && e !== 125) && e !== 35 && !(t === 58 && !i) || _(t) && !h(t) && e === 35 || t === 58 && i;
	}
	O(v, "isPlainSafe");
	function y(e) {
		return g(e) && e !== a && !h(e) && e !== 45 && e !== 63 && e !== 58 && e !== 44 && e !== 91 && e !== 93 && e !== 123 && e !== 125 && e !== 35 && e !== 38 && e !== 42 && e !== 33 && e !== 124 && e !== 61 && e !== 62 && e !== 39 && e !== 34 && e !== 37 && e !== 64 && e !== 96;
	}
	O(y, "isPlainSafeFirst");
	function b(e) {
		return !h(e) && e !== 58;
	}
	O(b, "isPlainSafeLast");
	function x(e, t) {
		let n = e.charCodeAt(t), r;
		return n >= 55296 && n <= 56319 && t + 1 < e.length && (r = e.charCodeAt(t + 1), r >= 56320 && r <= 57343) ? (n - 55296) * 1024 + r - 56320 + 65536 : n;
	}
	O(x, "codePointAt");
	function S(e) {
		return /^\n* /.test(e);
	}
	O(S, "needIndentIndicator");
	function C(e, t, n, r, i, a, o, s) {
		let c, l = 0, u = null, d = !1, f = !1, p = r !== -1, m = -1, h = y(x(e, 0)) && b(x(e, e.length - 1));
		if (t || o) for (c = 0; c < e.length; l >= 65536 ? c += 2 : c++) {
			if (l = x(e, c), !g(l)) return 5;
			h &&= v(l, u, s), u = l;
		}
		else {
			for (c = 0; c < e.length; l >= 65536 ? c += 2 : c++) {
				if (l = x(e, c), l === 10) d = !0, p && (f ||= c - m - 1 > r && e[m + 1] !== " ", m = c);
				else if (!g(l)) return 5;
				h &&= v(l, u, s), u = l;
			}
			f ||= p && c - m - 1 > r && e[m + 1] !== " ";
		}
		return !d && !f ? h && !o && !i(e) ? 1 : a === 2 ? 5 : 2 : n > 9 && S(e) ? 5 : o ? a === 2 ? 5 : 2 : f ? 4 : 3;
	}
	O(C, "chooseScalarStyle");
	function w(e, n, r, i, a) {
		e.dump = (function() {
			if (n.length === 0) return e.quotingType === 2 ? "\"\"" : "''";
			if (!e.noCompatMode && (s.indexOf(n) !== -1 || c.test(n))) return e.quotingType === 2 ? "\"" + n + "\"" : "'" + n + "'";
			let o = e.indent * Math.max(1, r), l = e.lineWidth === -1 ? -1 : Math.max(Math.min(e.lineWidth, 40), e.lineWidth - o), u = i || e.flowLevel > -1 && r >= e.flowLevel;
			function d(t) {
				return m(e, t);
			}
			switch (O(d, "testAmbiguity"), C(n, u, e.indent, l, d, e.quotingType, e.forceQuotes && !i, a)) {
				case 1: return n;
				case 2: return "'" + n.replace(/'/g, "''") + "'";
				case 3: return "|" + T(n, e.indent) + E(f(n, o));
				case 4: return ">" + T(n, e.indent) + E(f(D(n, l), o));
				case 5: return "\"" + A(n) + "\"";
				default: throw new t("impossible error: invalid scalar style");
			}
		})();
	}
	O(w, "writeScalar");
	function T(e, t) {
		let n = S(e) ? String(t) : "", r = e[e.length - 1] === "\n";
		return n + (r && (e[e.length - 2] === "\n" || e === "\n") ? "+" : r ? "" : "-") + "\n";
	}
	O(T, "blockHeader");
	function E(e) {
		return e[e.length - 1] === "\n" ? e.slice(0, -1) : e;
	}
	O(E, "dropEndingNewline");
	function D(e, t) {
		let n = /(\n+)([^\n]*)/g, r = (function() {
			let r = e.indexOf("\n");
			return r = r === -1 ? e.length : r, n.lastIndex = r, k(e.slice(0, r), t);
		})(), i = e[0] === "\n" || e[0] === " ", a, o;
		for (; o = n.exec(e);) {
			let e = o[1], n = o[2];
			a = n[0] === " ", r += e + (!i && !a && n !== "" ? "\n" : "") + k(n, t), i = a;
		}
		return r;
	}
	O(D, "foldString");
	function k(e, t) {
		if (e === "" || e[0] === " ") return e;
		let n = / [^ ]/g, r, i = 0, a, o = 0, s = 0, c = "";
		for (; r = n.exec(e);) s = r.index, s - i > t && (a = o > i ? o : s, c += "\n" + e.slice(i, a), i = a + 1), o = s;
		return c += "\n", e.length - i > t && o > i ? c += e.slice(i, o) + "\n" + e.slice(o + 1) : c += e.slice(i), c.slice(1);
	}
	O(k, "foldLine");
	function A(e) {
		let t = "", n = 0;
		for (let r = 0; r < e.length; n >= 65536 ? r += 2 : r++) {
			n = x(e, r);
			let i = o[n];
			!i && g(n) ? (t += e[r], n >= 65536 && (t += e[r + 1])) : t += i || u(n);
		}
		return t;
	}
	O(A, "escapeString");
	function j(e, t, n) {
		let r = "", i = e.tag;
		for (let i = 0, a = n.length; i < a; i += 1) {
			let a = n[i];
			e.replacer && (a = e.replacer.call(n, String(i), a)), (I(e, t, a, !1, !1) || a === void 0 && I(e, t, null, !1, !1)) && (r !== "" && (r += "," + (e.condenseFlow ? "" : " ")), r += e.dump);
		}
		e.tag = i, e.dump = "[" + r + "]";
	}
	O(j, "writeFlowSequence");
	function M(e, t, n, r) {
		let i = "", a = e.tag;
		for (let a = 0, o = n.length; a < o; a += 1) {
			let o = n[a];
			e.replacer && (o = e.replacer.call(n, String(a), o)), (I(e, t + 1, o, !0, !0, !1, !0) || o === void 0 && I(e, t + 1, null, !0, !0, !1, !0)) && (r && i === "" || (i += p(e, t)), e.dump && e.dump.charCodeAt(0) === 10 ? i += "-" : i += "- ", i += e.dump);
		}
		e.tag = a, e.dump = i || "[]";
	}
	O(M, "writeBlockSequence");
	function N(e, t, n) {
		let r = "", i = e.tag, a = Object.keys(n);
		for (let i = 0, o = a.length; i < o; i += 1) {
			let o = "";
			r !== "" && (o += ", "), e.condenseFlow && (o += "\"");
			let s = a[i], c = n[s];
			e.replacer && (c = e.replacer.call(n, s, c)), I(e, t, s, !1, !1) && (e.dump.length > 1024 && (o += "? "), o += e.dump + (e.condenseFlow ? "\"" : "") + ":" + (e.condenseFlow ? "" : " "), I(e, t, c, !1, !1) && (o += e.dump, r += o));
		}
		e.tag = i, e.dump = "{" + r + "}";
	}
	O(N, "writeFlowMapping");
	function P(e, n, r, i) {
		let a = "", o = e.tag, s = Object.keys(r);
		if (e.sortKeys === !0) s.sort();
		else if (typeof e.sortKeys == "function") s.sort(e.sortKeys);
		else if (e.sortKeys) throw new t("sortKeys must be a boolean or a function");
		for (let t = 0, o = s.length; t < o; t += 1) {
			let o = "";
			i && a === "" || (o += p(e, n));
			let c = s[t], l = r[c];
			if (e.replacer && (l = e.replacer.call(r, c, l)), !I(e, n + 1, c, !0, !0, !0)) continue;
			let u = e.tag !== null && e.tag !== "?" || e.dump && e.dump.length > 1024;
			u && (e.dump && e.dump.charCodeAt(0) === 10 ? o += "?" : o += "? "), o += e.dump, u && (o += p(e, n)), I(e, n + 1, l, !0, u) && (e.dump && e.dump.charCodeAt(0) === 10 ? o += ":" : o += ": ", o += e.dump, a += o);
		}
		e.tag = o, e.dump = a || "{}";
	}
	O(P, "writeBlockMapping");
	function F(e, n, a) {
		let o = a ? e.explicitTypes : e.implicitTypes;
		for (let s = 0, c = o.length; s < c; s += 1) {
			let c = o[s];
			if ((c.instanceOf || c.predicate) && (!c.instanceOf || typeof n == "object" && n instanceof c.instanceOf) && (!c.predicate || c.predicate(n))) {
				if (e.tag = a ? c.multi && c.representName ? c.representName(n) : c.tag : "?", c.represent) {
					let a = e.styleMap[c.tag] || c.defaultStyle, o;
					if (r.call(c.represent) === "[object Function]") o = c.represent(n, a);
					else if (i.call(c.represent, a)) o = c.represent[a](n, a);
					else throw new t("!<" + c.tag + "> tag resolver accepts not \"" + a + "\" style");
					e.dump = o;
				}
				return !0;
			}
		}
		return !1;
	}
	O(F, "detectType");
	function I(e, n, i, a, o, s, c) {
		e.tag = null, e.dump = i, F(e, i, !1) || F(e, i, !0);
		let l = r.call(e.dump), u = a;
		a &&= e.flowLevel < 0 || e.flowLevel > n;
		let d = l === "[object Object]" || l === "[object Array]", f, p;
		if (d && (f = e.duplicates.indexOf(i), p = f !== -1), (e.tag !== null && e.tag !== "?" || p || e.indent !== 2 && n > 0) && (o = !1), p && e.usedDuplicates[f]) e.dump = "*ref_" + f;
		else {
			if (d && p && !e.usedDuplicates[f] && (e.usedDuplicates[f] = !0), l === "[object Object]") a && Object.keys(e.dump).length !== 0 ? (P(e, n, e.dump, o), p && (e.dump = "&ref_" + f + e.dump)) : (N(e, n, e.dump), p && (e.dump = "&ref_" + f + " " + e.dump));
			else if (l === "[object Array]") a && e.dump.length !== 0 ? (e.noArrayIndent && !c && n > 0 ? M(e, n - 1, e.dump, o) : M(e, n, e.dump, o), p && (e.dump = "&ref_" + f + e.dump)) : (j(e, n, e.dump), p && (e.dump = "&ref_" + f + " " + e.dump));
			else if (l === "[object String]") e.tag !== "?" && w(e, e.dump, n, s, u);
			else if (l === "[object Undefined]") return !1;
			else {
				if (e.skipInvalid) return !1;
				throw new t("unacceptable kind of an object to dump " + l);
			}
			if (e.tag !== null && e.tag !== "?") {
				let t = encodeURI(e.tag[0] === "!" ? e.tag.slice(1) : e.tag).replace(/!/g, "%21");
				t = e.tag[0] === "!" ? "!" + t : t.slice(0, 18) === "tag:yaml.org,2002:" ? "!!" + t.slice(18) : "!<" + t + ">", e.dump = t + " " + e.dump;
			}
		}
		return !0;
	}
	O(I, "writeNode");
	function L(e, t) {
		let n = [], r = [];
		R(e, n, r);
		let i = r.length;
		for (let e = 0; e < i; e += 1) t.duplicates.push(n[r[e]]);
		t.usedDuplicates = Array(i);
	}
	O(L, "getDuplicateReferences");
	function R(e, t, n) {
		if (typeof e == "object" && e) {
			let r = t.indexOf(e);
			if (r !== -1) n.indexOf(r) === -1 && n.push(r);
			else if (t.push(e), Array.isArray(e)) for (let r = 0, i = e.length; r < i; r += 1) R(e[r], t, n);
			else {
				let r = Object.keys(e);
				for (let i = 0, a = r.length; i < a; i += 1) R(e[r[i]], t, n);
			}
		}
	}
	O(R, "inspectNode");
	function z(e, t) {
		t ||= {};
		let n = new d(t);
		n.noRefs || L(e, n);
		let r = e;
		return n.replacer && (r = n.replacer.call({ "": r }, "", r)), I(n, 0, r, !0, !0) ? n.dump + "\n" : "";
	}
	return O(z, "dump2"), vn.dump = z, vn;
}
O(bn, "requireDumper");
var xn;
function Sn() {
	if (xn) return G;
	xn = 1;
	let e = _n(), t = bn();
	function n(e, t) {
		return function() {
			throw Error("Function yaml." + e + " is removed in js-yaml 4. Use yaml." + t + " instead, which is now safe by default.");
		};
	}
	return O(n, "renamed"), G.Type = q(), G.Schema = _t(), G.FAILSAFE_SCHEMA = kt(), G.JSON_SCHEMA = Wt(), G.CORE_SCHEMA = qt(), G.DEFAULT_SCHEMA = hn(), G.load = e.load, G.loadAll = e.loadAll, G.dump = t.dump, G.YAMLException = lt(), G.types = {
		binary: nn(),
		float: Vt(),
		map: Et(),
		null: Mt(),
		pairs: ln(),
		set: fn(),
		timestamp: Xt(),
		bool: Ft(),
		int: Rt(),
		merge: $t(),
		omap: on(),
		seq: Ct(),
		str: bt()
	}, G.safeLoad = n("safeLoad", "load"), G.safeLoadAll = n("safeLoadAll", "loadAll"), G.safeDump = n("safeDump", "dump"), G;
}
O(Sn, "requireJsYaml");
var { Type: Cn, Schema: wn, FAILSAFE_SCHEMA: Tn, JSON_SCHEMA: En, CORE_SCHEMA: Dn, DEFAULT_SCHEMA: On, load: kn, loadAll: An, dump: jn, YAMLException: Mn, types: Nn, safeLoad: Pn, safeLoadAll: Fn, safeDump: In } = /* @__PURE__ */ rt(Sn()), Ln = "comm", Rn = "rule", zn = "decl", Bn = "@import", Vn = "@namespace", Hn = "@keyframes", Un = "@layer", Wn = Math.abs, Gn = String.fromCharCode;
function Kn(e) {
	return e.trim();
}
function qn(e, t, n) {
	return e.replace(t, n);
}
function Jn(e, t) {
	return e.charCodeAt(t) | 0;
}
function Yn(e, t, n) {
	return e.slice(t, n);
}
function J(e) {
	return e.length;
}
function Xn(e) {
	return e.length;
}
function Zn(e, t) {
	return t.push(e), e;
}
// node_modules/stylis/src/Tokenizer.js
var Qn = 1, $n = 1, er = 0, Y = 0, X = 0, tr = "";
function nr(e, t, n, r, i, a, o, s) {
	return {
		value: e,
		root: t,
		parent: n,
		type: r,
		props: i,
		children: a,
		line: Qn,
		column: $n,
		length: o,
		return: "",
		siblings: s
	};
}
function rr() {
	return X;
}
function ir() {
	return X = Y > 0 ? Jn(tr, --Y) : 0, $n--, X === 10 && ($n = 1, Qn--), X;
}
function Z() {
	return X = Y < er ? Jn(tr, Y++) : 0, $n++, X === 10 && ($n = 1, Qn++), X;
}
function Q() {
	return Jn(tr, Y);
}
function ar() {
	return Y;
}
function or(e, t) {
	return Yn(tr, e, t);
}
function sr(e) {
	switch (e) {
		case 0:
		case 9:
		case 10:
		case 13:
		case 32: return 5;
		case 33:
		case 43:
		case 44:
		case 47:
		case 62:
		case 64:
		case 126:
		case 59:
		case 123:
		case 125: return 4;
		case 58: return 3;
		case 34:
		case 39:
		case 40:
		case 91: return 2;
		case 41:
		case 93: return 1;
	}
	return 0;
}
function cr(e) {
	return Qn = $n = 1, er = J(tr = e), Y = 0, [];
}
function lr(e) {
	return tr = "", e;
}
function ur(e) {
	return Kn(or(Y - 1, pr(e === 91 ? e + 2 : e === 40 ? e + 1 : e)));
}
function dr(e) {
	for (; (X = Q()) && X < 33;) Z();
	return sr(e) > 2 || sr(X) > 3 ? "" : " ";
}
function fr(e, t) {
	for (; --t && Z() && !(X < 48 || X > 102 || X > 57 && X < 65 || X > 70 && X < 97););
	return or(e, ar() + (t < 6 && Q() == 32 && Z() == 32));
}
function pr(e) {
	for (; Z();) switch (X) {
		case e: return Y;
		case 34:
		case 39:
			e !== 34 && e !== 39 && pr(X);
			break;
		case 40:
			e === 41 && pr(e);
			break;
		case 92: Z();
	}
	return Y;
}
function mr(e, t) {
	for (; Z() && e + X !== 57 && (e + X !== 84 || Q() !== 47););
	return "/*" + or(t, Y - 1) + "*" + Gn(e === 47 ? e : Z());
}
function hr(e) {
	for (; !sr(Q());) Z();
	return or(e, Y);
}
// node_modules/stylis/src/Parser.js
function gr(e) {
	return lr(_r("", null, null, null, [""], e = cr(e), 0, [0], e));
}
function _r(e, t, n, r, i, a, o, s, c) {
	for (var l = 0, u = 0, d = o, f = 0, p = 0, m = 0, h = 1, g = 1, _ = 1, v = 0, y = 0, b = "", x = i, S = a, C = r, w = b; g;) switch (m = y, y = Z()) {
		case 40:
			m != 108 && Jn(w, d - 1) == 58 ? (v++, w += "(") : w += ur(y);
			break;
		case 41:
			v--, w += ")";
			break;
		case 34:
		case 39:
		case 91:
			w += ur(y);
			break;
		case 9:
		case 10:
		case 13:
		case 32:
			if (v > 0) {
				w += Gn(y);
				break;
			}
			w += dr(m);
			break;
		case 92:
			w += fr(ar() - 1, 7);
			continue;
		case 47:
			switch (Q()) {
				case 42:
				case 47:
					Zn(yr(mr(Z(), ar()), t, n, c), c), (sr(m || 1) == 5 || sr(Q() || 1) == 5) && J(w) && Yn(w, -1, void 0) !== " " && (w += " ");
					break;
				default: w += "/";
			}
			break;
		case 123 * h: s[l++] = J(w) * _;
		case 125 * h:
		case 59:
		case 0:
			if (v > 0 && y) {
				w += Gn(y);
				break;
			}
			switch (y) {
				case 0:
				case 125: g = 0;
				case 59 + u:
					_ == -1 && (w = qn(w, /\f/g, "")), p > 0 && (J(w) - d || h === 0) && Zn(p > 32 ? br(w + ";", r, n, d - 1, c) : br(qn(w, " ", "") + ";", r, n, d - 2, c), c);
					break;
				case 59: w += ";";
				default: if (Zn(C = vr(w, t, n, l, u, i, s, b, x = [], S = [], d, a), a), y === 123) {
					if (u === 0) _r(w, t, C, C, x, a, d, s, S);
					else {
						switch (f) {
							case 99: if (Jn(w, 3) === 110) break;
							case 108: if (Jn(w, 2) === 97) break;
							default: u = 0;
							case 100:
							case 109:
							case 115:
						}
						u ? _r(e, C, C, r && Zn(vr(e, C, C, 0, 0, i, s, b, i, x = [], d, S), S), i, S, d, s, r ? x : S) : _r(w, C, C, C, [""], S, 0, s, S);
					}
				}
			}
			l = u = p = 0, h = _ = 1, b = w = "", d = o;
			break;
		case 58: d = 1 + J(w), p = m;
		default:
			if (h < 1) {
				if (y == 123) --h;
				else if (y == 125 && h++ == 0 && ir() == 125) continue;
			}
			switch (w += Gn(y), y * h) {
				case 38:
					_ = u > 0 ? 1 : (w += "\f", -1);
					break;
				case 44:
					if (v > 0) break;
					s[l++] = (J(w) - 1) * _, _ = 1;
					break;
				case 64:
					Q() === 45 && (w += ur(Z())), f = Q(), u = d = J(b = w += hr(ar())), y++;
					break;
				case 45: m === 45 && J(w) == 2 && (h = 0);
			}
	}
	return a;
}
function vr(e, t, n, r, i, a, o, s, c, l, u, d) {
	for (var f = i - 1, p = i === 0 ? a : [""], m = Xn(p), h = 0, g = 0, _ = 0; h < r; ++h) for (var v = 0, y = Yn(e, f + 1, f = Wn(g = o[h])), b = e; v < m; ++v) (b = Kn(g > 0 ? p[v] + " " + y : qn(y, /&\f/g, p[v]))) && (c[_++] = b);
	return nr(e, t, n, i === 0 ? Rn : s, c, l, u, d);
}
function yr(e, t, n, r) {
	return nr(e, t, n, Ln, Gn(rr()), Yn(e, 2, -2), 0, r);
}
function br(e, t, n, r, i) {
	return nr(e, t, n, zn, Yn(e, 0, r), Yn(e, r + 1, -1), r, i);
}
// node_modules/stylis/src/Serializer.js
function xr(e, t) {
	for (var n = "", r = 0; r < e.length; r++) n += t(e[r], r, e, t) || "";
	return n;
}
function Sr(e, t, n, r) {
	switch (e.type) {
		case Un: if (e.children.length) break;
		case Bn:
		case Vn:
		case zn: return e.return = e.return || e.value;
		case Ln: return "";
		case Hn: return e.return = e.value + "{" + xr(e.children, r) + "}";
		case Rn: if (!J(e.value = e.props.join(","))) return "";
	}
	return J(n = xr(e.children, r)) ? e.return = e.value + "{" + n + "}" : "";
}
// node_modules/stylis/src/Middleware.js
function Cr(e) {
	var t = Xn(e);
	return function(n, r, i, a) {
		for (var o = "", s = 0; s < t; s++) o += e[s](n, r, i, a) || "";
		return o;
	};
}
// node_modules/mermaid/dist/mermaid.core.mjs
var wr = "c4", Tr = {
	id: wr,
	detector: /* @__PURE__ */ O((e) => /^\s*C4Context|C4Container|C4Component|C4Dynamic|C4Deployment/.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./c4Diagram-7LVT6UL2-D8i8qTz9.js");
		return {
			id: wr,
			diagram: e
		};
	}, "loader")
}, Er = "flowchart", Dr = {
	id: Er,
	detector: /* @__PURE__ */ O((e, t) => t?.flowchart?.defaultRenderer === "dagre-wrapper" || t?.flowchart?.defaultRenderer === "elk" ? !1 : /^\s*graph/.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./flowDiagram-HODETNUW-CquO775j.js");
		return {
			id: Er,
			diagram: e
		};
	}, "loader")
}, Or = "flowchart-v2", kr = {
	id: Or,
	detector: /* @__PURE__ */ O((e, t) => t?.flowchart?.defaultRenderer !== "dagre-d3" && (t?.flowchart?.defaultRenderer === "elk" && (t.layout = "elk"), /^\s*graph/.test(e) && t?.flowchart?.defaultRenderer === "dagre-wrapper" ? !0 : /^\s*flowchart/.test(e)), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./flowDiagram-HODETNUW-CquO775j.js");
		return {
			id: Or,
			diagram: e
		};
	}, "loader")
}, Ar = "swimlane", jr = {
	id: Ar,
	detector: /* @__PURE__ */ O((e) => /^\s*swimlane-beta\b/.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./swimlanesDiagram-VR7AAH4N-CbXexjA-.js");
		return {
			id: Ar,
			diagram: e
		};
	}, "loader")
}, Mr = "er", Nr = {
	id: Mr,
	detector: /* @__PURE__ */ O((e) => /^\s*erDiagram/.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./erDiagram-RLTQ6QDP-DRY46T4G.js");
		return {
			id: Mr,
			diagram: e
		};
	}, "loader")
}, Pr = "gitGraph", Fr = {
	id: Pr,
	detector: /* @__PURE__ */ O((e) => /^\s*gitGraph/.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./gitGraphDiagram-WWUBYQGX-DdHqwd7A.js");
		return {
			id: Pr,
			diagram: e
		};
	}, "loader")
}, Ir = "gantt", Lr = {
	id: Ir,
	detector: /* @__PURE__ */ O((e) => /^\s*gantt/.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./ganttDiagram-EL5Y4UJY-Diij-FIL.js");
		return {
			id: Ir,
			diagram: e
		};
	}, "loader")
}, Rr = "info", zr = {
	id: Rr,
	detector: /* @__PURE__ */ O((e) => /^\s*info/.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./infoDiagram-27XIBGKW-CnVPr6RJ.js");
		return {
			id: Rr,
			diagram: e
		};
	}, "loader")
}, Br = "pie", Vr = {
	id: Br,
	detector: /* @__PURE__ */ O((e) => /^\s*pie/.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./pieDiagram-E7YTZNPT-zx8fmCki.js");
		return {
			id: Br,
			diagram: e
		};
	}, "loader")
}, Hr = "quadrantChart", Ur = {
	id: Hr,
	detector: /* @__PURE__ */ O((e) => /^\s*quadrantChart/.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./quadrantDiagram-AXDQQJYC-BS6KaX3N.js");
		return {
			id: Hr,
			diagram: e
		};
	}, "loader")
}, Wr = "xychart", Gr = {
	id: Wr,
	detector: /* @__PURE__ */ O((e) => /^\s*xychart(-beta)?/.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./xychartDiagram-S5SC5T6Z-Bxmx894R.js");
		return {
			id: Wr,
			diagram: e
		};
	}, "loader")
}, Kr = "requirement", qr = {
	id: Kr,
	detector: /* @__PURE__ */ O((e) => /^\s*requirement(Diagram)?/.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./requirementDiagram-BXWQKSXE-DgOKe83a.js");
		return {
			id: Kr,
			diagram: e
		};
	}, "loader")
}, Jr = "sequence", Yr = {
	id: Jr,
	detector: /* @__PURE__ */ O((e) => /^\s*sequenceDiagram/.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./sequenceDiagram-WJ2MYXX4-DqWvnZAK.js");
		return {
			id: Jr,
			diagram: e
		};
	}, "loader")
}, Xr = "class", Zr = {
	id: Xr,
	detector: /* @__PURE__ */ O((e, t) => t?.class?.defaultRenderer !== "dagre-wrapper" && /^\s*classDiagram/.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./classDiagram-ZZMXUADV-BG9-2kSJ.js");
		return {
			id: Xr,
			diagram: e
		};
	}, "loader")
}, Qr = "classDiagram", $r = {
	id: Qr,
	detector: /* @__PURE__ */ O((e, t) => /^\s*classDiagram/.test(e) && t?.class?.defaultRenderer === "dagre-wrapper" ? !0 : /^\s*classDiagram-v2/.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./classDiagram-v2-VYDZK3BY-BHiVNyfu.js");
		return {
			id: Qr,
			diagram: e
		};
	}, "loader")
}, ei = "state", ti = {
	id: ei,
	detector: /* @__PURE__ */ O((e, t) => t?.state?.defaultRenderer !== "dagre-wrapper" && /^\s*stateDiagram/.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./stateDiagram-D77RDMKH-CKyuH48P.js");
		return {
			id: ei,
			diagram: e
		};
	}, "loader")
}, ni = "stateDiagram", ri = {
	id: ni,
	detector: /* @__PURE__ */ O((e, t) => !!(/^\s*stateDiagram-v2/.test(e) || /^\s*stateDiagram/.test(e) && t?.state?.defaultRenderer === "dagre-wrapper"), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./stateDiagram-v2-MP3YSRHH-05LiG6rx.js");
		return {
			id: ni,
			diagram: e
		};
	}, "loader")
}, ii = "journey", ai = {
	id: ii,
	detector: /* @__PURE__ */ O((e) => /^\s*journey/.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./journeyDiagram-3NMN7TZE-DHJ9EJKe.js");
		return {
			id: ii,
			diagram: e
		};
	}, "loader")
}, oi = { draw: /* @__PURE__ */ O((e, t, n) => {
	A.debug("rendering svg for syntax error\n");
	let r = ve(t), i = r.append("g");
	r.attr("viewBox", "0 0 2412 512"), g(r, 100, 512, !0), i.append("path").attr("class", "error-icon").attr("d", "m411.313,123.313c6.25-6.25 6.25-16.375 0-22.625s-16.375-6.25-22.625,0l-32,32-9.375,9.375-20.688-20.688c-12.484-12.5-32.766-12.5-45.25,0l-16,16c-1.261,1.261-2.304,2.648-3.31,4.051-21.739-8.561-45.324-13.426-70.065-13.426-105.867,0-192,86.133-192,192s86.133,192 192,192 192-86.133 192-192c0-24.741-4.864-48.327-13.426-70.065 1.402-1.007 2.79-2.049 4.051-3.31l16-16c12.5-12.492 12.5-32.758 0-45.25l-20.688-20.688 9.375-9.375 32.001-31.999zm-219.313,100.687c-52.938,0-96,43.063-96,96 0,8.836-7.164,16-16,16s-16-7.164-16-16c0-70.578 57.422-128 128-128 8.836,0 16,7.164 16,16s-7.164,16-16,16z"), i.append("path").attr("class", "error-icon").attr("d", "m459.02,148.98c-6.25-6.25-16.375-6.25-22.625,0s-6.25,16.375 0,22.625l16,16c3.125,3.125 7.219,4.688 11.313,4.688 4.094,0 8.188-1.563 11.313-4.688 6.25-6.25 6.25-16.375 0-22.625l-16.001-16z"), i.append("path").attr("class", "error-icon").attr("d", "m340.395,75.605c3.125,3.125 7.219,4.688 11.313,4.688 4.094,0 8.188-1.563 11.313-4.688 6.25-6.25 6.25-16.375 0-22.625l-16-16c-6.25-6.25-16.375-6.25-22.625,0s-6.25,16.375 0,22.625l15.999,16z"), i.append("path").attr("class", "error-icon").attr("d", "m400,64c8.844,0 16-7.164 16-16v-32c0-8.836-7.156-16-16-16-8.844,0-16,7.164-16,16v32c0,8.836 7.156,16 16,16z"), i.append("path").attr("class", "error-icon").attr("d", "m496,96.586h-32c-8.844,0-16,7.164-16,16 0,8.836 7.156,16 16,16h32c8.844,0 16-7.164 16-16 0-8.836-7.156-16-16-16z"), i.append("path").attr("class", "error-icon").attr("d", "m436.98,75.605c3.125,3.125 7.219,4.688 11.313,4.688 4.094,0 8.188-1.563 11.313-4.688l32-32c6.25-6.25 6.25-16.375 0-22.625s-16.375-6.25-22.625,0l-32,32c-6.251,6.25-6.251,16.375-0.001,22.625z"), i.append("text").attr("class", "error-text").attr("x", 1440).attr("y", 250).attr("font-size", "150px").style("text-anchor", "middle").text("Syntax error in text"), i.append("text").attr("class", "error-text").attr("x", 1250).attr("y", 400).attr("font-size", "100px").style("text-anchor", "middle").text(`mermaid version ${n}`);
}, "draw") }, si = oi, ci = {
	db: {},
	renderer: oi,
	parser: { parse: /* @__PURE__ */ O(() => {}, "parse") }
}, li = "flowchart-elk", ui = {
	id: li,
	detector: /* @__PURE__ */ O((e, t = {}) => /^\s*flowchart-elk/.test(e) || /^\s*(flowchart|graph)/.test(e) && t?.flowchart?.defaultRenderer === "elk" ? (t.layout = "elk", !0) : !1, "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./flowDiagram-HODETNUW-CquO775j.js");
		return {
			id: li,
			diagram: e
		};
	}, "loader")
}, di = "timeline", fi = {
	id: di,
	detector: /* @__PURE__ */ O((e) => /^\s*timeline/.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./timeline-definition-24CTP7MA-l8nlD6Xv.js");
		return {
			id: di,
			diagram: e
		};
	}, "loader")
}, pi = "mindmap", mi = {
	id: pi,
	detector: /* @__PURE__ */ O((e) => /^\s*mindmap/.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./mindmap-definition-YA3MSWOX-D_aRwE6s.js");
		return {
			id: pi,
			diagram: e
		};
	}, "loader")
}, hi = "kanban", gi = {
	id: hi,
	detector: /* @__PURE__ */ O((e) => /^\s*kanban/.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./kanban-definition-UXKFOSKX-BZqoNG-T.js");
		return {
			id: hi,
			diagram: e
		};
	}, "loader")
}, _i = "sankey", vi = {
	id: _i,
	detector: /* @__PURE__ */ O((e) => /^\s*sankey(-beta)?/.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./sankeyDiagram-P5KCCOFB-CGFyGJP4.js");
		return {
			id: _i,
			diagram: e
		};
	}, "loader")
}, yi = "packet", bi = {
	id: yi,
	detector: /* @__PURE__ */ O((e) => /^\s*packet(-beta)?/.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./diagram-Z3DM3KII-CpNISeO7.js");
		return {
			id: yi,
			diagram: e
		};
	}, "loader")
}, xi = "radar", Si = {
	id: xi,
	detector: /* @__PURE__ */ O((e) => /^\s*radar-beta/.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./diagram-UQ7AKVKN-CbB7UkaQ.js");
		return {
			id: xi,
			diagram: e
		};
	}, "loader")
}, Ci = "block", wi = {
	id: Ci,
	detector: /* @__PURE__ */ O((e) => /^\s*block(-beta)?/.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./blockDiagram-I7D4REHJ-D1DUJA1-.js");
		return {
			id: Ci,
			diagram: e
		};
	}, "loader")
}, Ti = "treeView", Ei = {
	id: Ti,
	detector: /* @__PURE__ */ O((e) => /^\s*treeView-beta/.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./diagram-S7CK7UJ4-CBUHKruT.js");
		return {
			id: Ti,
			diagram: e
		};
	}, "loader")
}, Di = "architecture", Oi = {
	id: Di,
	detector: /* @__PURE__ */ O((e) => /^\s*architecture/.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./architectureDiagram-5GKGNRK7-DCVjlrvJ.js");
		return {
			id: Di,
			diagram: e
		};
	}, "loader")
}, ki = "eventmodeling", Ai = {
	id: ki,
	detector: /* @__PURE__ */ O((e) => /^\s*eventmodeling/.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./diagram-VSXAHHWV-DupOr24X.js");
		return {
			id: ki,
			diagram: e
		};
	}, "loader")
}, ji = "ishikawa", Mi = {
	id: ji,
	detector: /* @__PURE__ */ O((e) => /^\s*ishikawa(-beta)?\b/i.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./ishikawaDiagram-5VMMS53U-IfkDotU6.js");
		return {
			id: ji,
			diagram: e
		};
	}, "loader")
}, Ni = "venn", Pi = {
	id: Ni,
	detector: /* @__PURE__ */ O((e) => /^\s*venn-beta/.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./vennDiagram-4TSXK5OY-nr5HmWjG.js");
		return {
			id: Ni,
			diagram: e
		};
	}, "loader")
}, Fi = "treemap", Ii = {
	id: Fi,
	detector: /* @__PURE__ */ O((e) => /^\s*treemap/.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./diagram-VX7I27RA-N6wKrW-t.js");
		return {
			id: Fi,
			diagram: e
		};
	}, "loader")
}, Li = "wardley", Ri = {
	id: Li,
	detector: /* @__PURE__ */ O((e) => /^\s*wardley-beta/i.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./wardleyDiagram-VM6X3IG4-BwhMmCMW.js");
		return {
			id: Li,
			diagram: e
		};
	}, "loader")
}, zi = "cynefin", Bi = {
	id: zi,
	detector: /* @__PURE__ */ O((e) => /^\s*cynefin-beta(?:[\s:]|$)/.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./cynefinDiagram-5FMLGOSQ-DpwF9TyU.js");
		return {
			id: zi,
			diagram: e
		};
	}, "loader")
}, Vi = "railroad", Hi = {
	id: Vi,
	detector: /* @__PURE__ */ O((e) => /^\s*railroad-beta/i.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./railroadDiagram-O6MQD6OU-DbEUQ5JG.js");
		return {
			id: Vi,
			diagram: e
		};
	}, "loader")
}, Ui = "railroadEbnf", Wi = {
	id: Ui,
	detector: /* @__PURE__ */ O((e) => /^\s*railroad-ebnf-beta/i.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./ebnfDiagram-PWID7BFC-C3PUAfcI.js");
		return {
			id: Ui,
			diagram: e
		};
	}, "loader")
}, Gi = "railroadAbnf", Ki = {
	id: Gi,
	detector: /* @__PURE__ */ O((e) => /^\s*railroad-abnf-beta/i.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./abnfDiagram-VCTEODGH-BgGbZ55Y.js");
		return {
			id: Gi,
			diagram: e
		};
	}, "loader")
}, qi = "railroadPeg", Ji = {
	id: qi,
	detector: /* @__PURE__ */ O((e) => /^\s*railroad-peg-beta/i.test(e), "detector"),
	loader: /* @__PURE__ */ O(async () => {
		let { diagram: e } = await import("./pegDiagram-XKGWAZYB-BhA8GVMh.js");
		return {
			id: qi,
			diagram: e
		};
	}, "loader")
}, Yi = !1, Xi = /* @__PURE__ */ O(() => {
	Yi || (Yi = !0, a("error", ci, (e) => e.toLowerCase().trim() === "error"), a("---", {
		db: { clear: /* @__PURE__ */ O(() => {}, "clear") },
		styles: {},
		renderer: { draw: /* @__PURE__ */ O(() => {}, "draw") },
		parser: { parse: /* @__PURE__ */ O(() => {
			throw Error("Diagrams beginning with --- are not valid. If you were trying to use a YAML front-matter, please ensure that you've correctly opened and closed the YAML front-matter with un-indented `---` blocks");
		}, "parse") },
		init: /* @__PURE__ */ O(() => null, "init")
	}, (e) => e.toLowerCase().trimStart().startsWith("---")), o(ui, mi, Oi), o(Tr, gi, $r, Zr, Nr, Lr, zr, Vr, qr, Yr, jr, kr, Dr, fi, Fr, ri, ti, ai, Ur, vi, bi, Gr, wi, Ai, Ei, Si, Mi, Ii, Hi, Wi, Ki, Ji, Pi, Ri, Bi));
}, "addDiagrams"), Zi = /* @__PURE__ */ O(async () => {
	A.debug("Loading registered diagrams");
	let e = (await Promise.allSettled(Object.entries(y).map(async ([e, { detector: t, loader: n }]) => {
		if (n) try {
			c(e);
		} catch {
			try {
				let { diagram: e, id: r } = await n();
				a(r, e, t);
			} catch (t) {
				throw A.error(`Failed to load external diagram with key ${e}. Removing from detectors.`), delete y[e], t;
			}
		}
	}))).filter((e) => e.status === "rejected");
	if (e.length > 0) {
		A.error(`Failed to load ${e.length} external diagrams`);
		for (let t of e) A.error(t);
		throw Error(`Failed to load ${e.length} external diagrams`);
	}
}, "loadRegisteredDiagrams"), Qi = "graphics-document document";
function $i(e, t) {
	e.attr("role", Qi), t !== "" && e.attr("aria-roledescription", t);
}
O($i, "setA11yDiagramInfo");
function ea(e, t, n, r) {
	if (e.insert !== void 0) {
		if (n) {
			let t = `chart-desc-${r}`;
			e.attr("aria-describedby", t), e.insert("desc", ":first-child").attr("id", t).text(n);
		}
		if (t) {
			let n = `chart-title-${r}`;
			e.attr("aria-labelledby", n), e.insert("title", ":first-child").attr("id", n).text(t);
		}
	}
}
O(ea, "addSVGa11yTitleDescription");
var ta = class e {
	constructor(e, t, n, r, i) {
		this.type = e, this.text = t, this.db = n, this.parser = r, this.renderer = i;
	}
	static {
		O(this, "Diagram");
	}
	static async fromText(n, r = {}) {
		let i = h(), o = x(n, i);
		n = fe(n) + "\n";
		try {
			c(o);
		} catch {
			let e = t(o);
			if (!e) throw new T(`Diagram ${o} not found.`);
			let { id: n, diagram: r } = await e();
			a(n, r);
		}
		let { db: s, parser: l, renderer: u, init: d } = c(o);
		return l.parser && (l.parser.yy = s), s.clear?.(), d?.(i), r.title && s.setDiagramTitle?.(r.title), await l.parse(n), new e(o, n, s, l, u);
	}
	async render(e, t) {
		await this.renderer.draw(this.text, e, t, this);
	}
	getParser() {
		return this.parser;
	}
	getType() {
		return this.type;
	}
}, na = [], ra = /* @__PURE__ */ O(() => {
	na.forEach((e) => {
		e();
	}), na = [];
}, "attachFunctions"), ia = /* @__PURE__ */ O((e) => e.replace(/^\s*%%(?!{)[^\n]+\n?/gm, "").trimStart(), "cleanupComments");
function aa(e) {
	let t = e.match(m);
	if (!t) return {
		text: e,
		metadata: {}
	};
	let n = t[1], r = kn(n ? t[2].split("\n").map((e) => e.startsWith(n) ? e.slice(n.length) : e).join("\n") : t[2], { schema: En }) ?? {};
	r = typeof r == "object" && !Array.isArray(r) ? r : {};
	let i = {};
	return r.displayMode && (i.displayMode = r.displayMode.toString()), r.title && (i.title = r.title.toString()), r.config && (i.config = r.config), {
		text: e.slice(t[0].length),
		metadata: i
	};
}
O(aa, "extractFrontMatter");
var oa = /* @__PURE__ */ O((e) => e.replace(/\r\n?/g, "\n").replace(/<(\w+)([^>]*)>/g, (e, t, n) => "<" + t + n.replace(/="([^"]*)"/g, "='$1'") + ">"), "cleanupText"), sa = /* @__PURE__ */ O((e) => {
	let { text: t, metadata: n } = aa(e), { displayMode: r, title: i, config: a = {} } = n;
	return r && (a.gantt ||= {}, a.gantt.displayMode = r), {
		title: i,
		config: a,
		text: t
	};
}, "processFrontmatter"), ca = /* @__PURE__ */ O((e) => {
	let t = V.detectInit(e) ?? {}, n = V.detectDirective(e, "wrap");
	return Array.isArray(n) ? t.wrap = n.some(({ type: e }) => e === "wrap") : n?.type === "wrap" && (t.wrap = !0), {
		text: H(e),
		directive: t
	};
}, "processDirectives");
function la(e) {
	let t = sa(oa(e)), n = ca(t.text), r = de(t.config, n.directive);
	return e = ia(n.text), {
		code: e,
		title: t.title,
		config: r
	};
}
O(la, "preprocessDiagram");
function ua(e) {
	let t = new TextEncoder().encode(e), n = Array.from(t, (e) => String.fromCodePoint(e)).join("");
	return btoa(n);
}
O(ua, "toBase64");
var da = 5e4, fa = "graph TB;a[Maximum text size in diagram exceeded];style a fill:#faa", pa = "sandbox", ma = "loose", ha = "http://www.w3.org/2000/svg", ga = "http://www.w3.org/1999/xlink", _a = "http://www.w3.org/1999/xhtml", va = "100%", ya = "100%", ba = "border:0;margin:0;", xa = "margin:0", Sa = "allow-top-navigation-by-user-activation allow-popups", Ca = "The \"iframe\" tag is not supported by your browser.", wa = ["foreignobject"], Ta = ["dominant-baseline"];
function Ea(e) {
	let t = la(e);
	return r(), b(t.config ?? {}), t;
}
O(Ea, "processAndSetConfigs");
async function Da(e, t) {
	Xi();
	try {
		let { code: t, config: n } = Ea(e);
		return {
			diagramType: (await za(t)).type,
			config: n
		};
	} catch (e) {
		if (t?.suppressErrors) return !1;
		throw e;
	}
}
O(Da, "parse");
var Oa = /* @__PURE__ */ O((e, t, n = []) => `.${e} ${t} ${i(`{ ${n.join(" !important; ")} !important; }`)}`, "cssImportantStyles"), ka = /* @__PURE__ */ O((e, t = /* @__PURE__ */ new Map()) => {
	let n = new CSSStyleSheet();
	if (e.fontFamily !== void 0 && n.insertRule(`:root { --mermaid-font-family: ${e.fontFamily}}`, n.cssRules.length), e.altFontFamily !== void 0 && n.insertRule(`:root { --mermaid-alt-font-family: ${e.altFontFamily}}`, n.cssRules.length), t instanceof Map) {
		let r = l(e) ? ["> *", "span"] : [
			"rect",
			"polygon",
			"ellipse",
			"circle",
			"path"
		];
		t.forEach((e) => {
			be(e.styles) || r.forEach((t) => {
				n.insertRule(Oa(e.id, t, e.styles), n.cssRules.length);
			}), be(e.textStyles) || n.insertRule(Oa(e.id, "tspan", (e?.textStyles || []).map((e) => e.replace("color", "fill"))), n.cssRules.length);
		});
	}
	let r = "";
	if (e.themeCSS !== void 0) {
		if (typeof n.replaceSync == "function") {
			let t = new CSSStyleSheet();
			t.replaceSync(e.themeCSS), r = v(t) + "\n";
		} else r += `${e.themeCSS}
`;
	}
	return r + v(n);
}, "createCssStyles"), Aa = /* @__PURE__ */ O((e, t) => xr(gr(`${e}{${t}}`), Cr([/* @__PURE__ */ O(function(t, n, r, i) {
	if (t.type === "rule" && Array.isArray(t.props)) {
		if (t.parent && t.parent.type === "@keyframes") return;
		t.props = t.props.map((n) => n === e && Array.isArray(t.children) && t.children.every((e) => e.type === "decl" && (/* @__PURE__ */ new Set([
			"font-family",
			"font-size",
			"fill"
		])).has(e.props)) ? n : !n.startsWith(`${e} `) && !n.startsWith(`${e}>`) || n.startsWith(`${e} ||`) ? `${e} ${n}` : n);
	} else t.type.startsWith("@") && ([
		"@media",
		"@supports",
		"@layer",
		"@scope",
		"@container",
		"@starting-style",
		"@keyframes"
	].includes(t.type) || (A.warn(`Removing unsupported at-rule ${t.type} from CSS`), t.type = Ln));
}, "addNamespace"), Sr])), "compileCSS"), ja = /* @__PURE__ */ O((e, t, n, r) => {
	let i = ka(e, n);
	return Aa(r, f(t, i, {
		...e.themeVariables,
		theme: e.theme,
		look: e.look
	}, r));
}, "createUserStyles"), Ma = /* @__PURE__ */ O((e = "", t, n) => {
	let r = e;
	return !n && !t && (r = r.replace(/marker-end="url\([\d+./:=?A-Za-z-]*?#/g, "marker-end=\"url(#")), r = se(r), r = r.replace(/<br>/g, "<br/>"), r;
}, "cleanUpSvgCode"), Na = /* @__PURE__ */ O((e = "", t) => `<iframe style="width:${va};height:${t?.viewBox?.baseVal?.height ? t.viewBox.baseVal.height + "px" : ya};${ba}" src="data:text/html;charset=UTF-8;base64,${ua(`<body style="${xa}">${e}</body>`)}" sandbox="${Sa}">
  ${Ca}
</iframe>`, "putIntoIFrame"), Pa = /* @__PURE__ */ O((e, t, n, r, i) => {
	let a = e.append("div");
	a.attr("id", n), r && a.attr("style", r);
	let o = a.append("svg").attr("id", t).attr("width", "100%").attr("xmlns", ha);
	return i && o.attr("xmlns:xlink", i), o.append("g"), e;
}, "appendDivSvgG");
function Fa(e, t) {
	return e.append("iframe").attr("id", t).attr("style", "width: 100%; height: 100%;").attr("sandbox", "");
}
O(Fa, "sandboxedIframe");
var Ia = /* @__PURE__ */ O((e, t, n, r) => {
	e.getElementById(t)?.remove(), e.getElementById(n)?.remove(), e.getElementById(r)?.remove();
}, "removeExistingElements"), La = /* @__PURE__ */ O(async function(t, n, r) {
	Xi();
	let i = Ea(n);
	n = i.code;
	let a = h();
	A.debug(a), n.length > (a?.maxTextSize ?? da) && (n = fa);
	let o = `#${t}`, s = "i" + t, c = "#" + s, l = "d" + t, u = "#" + l, d = /* @__PURE__ */ O(() => {
		let e = j(p ? c : u).node();
		e && "remove" in e && e.remove();
	}, "removeTempElements"), f = j(document.body), p = a.securityLevel === pa, m = a.securityLevel === ma, g = a.fontFamily;
	if (r !== void 0) {
		if (r && (r.innerHTML = ""), p) {
			let e = Fa(j(r), s);
			f = j(e.nodes()[0].contentDocument.body), f.node().style.margin = "0";
		} else f = j(r);
		Pa(f, t, l, `font-family: ${g}`, ga);
	} else {
		if (Ia(document, t, l, s), p) {
			let e = Fa(j(document.body), s);
			f = j(e.nodes()[0].contentDocument.body), f.node().style.margin = "0";
		} else f = j("body");
		Pa(f, t, l);
	}
	let v, y;
	try {
		v = await ta.fromText(n, { title: i.title });
	} catch (e) {
		if (a.suppressErrorRendering) throw d(), e;
		v = await ta.fromText("error"), y = e;
	}
	let b = f.select(u).node(), x = v.type, S = b.firstChild, C = S.firstChild, w = v.renderer.getClasses?.(n, v), T = ja(a, x, w, o), E = document.createElement("style");
	E.innerHTML = T, S.insertBefore(E, C);
	try {
		await v.renderer.draw(n, t, "11.17.2", v);
	} catch (e) {
		throw a.suppressErrorRendering ? d() : si.draw(n, t, "11.17.2"), e;
	}
	let D = f.select(`${u} svg`), k = v.db.getAccTitle?.(), M = v.db.getAccDescription?.();
	Ba(x, D, k, M);
	let N = (/* @__PURE__ */ O(() => {
		f.select(`[id="${t}"]`).selectAll("foreignobject > *").attr("xmlns", _a);
		let n = f.select(u).node().innerHTML;
		if (A.debug("config.arrowMarkerAbsolute", a.arrowMarkerAbsolute), n = Ma(n, p, _(a.arrowMarkerAbsolute)), p) {
			let e = f.select(u + " svg").node();
			n = Na(n, e);
		} else m || (n = e.sanitize(n, {
			ADD_TAGS: wa,
			ADD_ATTR: Ta,
			HTML_INTEGRATION_POINTS: { foreignobject: !0 }
		}));
		return ra(), n;
	}, "serializeSvg"))();
	if (y) throw y;
	return d(), {
		diagramType: x,
		svg: N,
		bindFunctions: v.db.bindFunctions
	};
}, "render");
function Ra(e = {}) {
	let t = C({}, e);
	t?.fontFamily && !t.themeVariables?.fontFamily && (t.themeVariables ||= {}, t.themeVariables.fontFamily = t.fontFamily), u(t), t?.theme && t.theme in p ? t.themeVariables = p[t.theme].getThemeVariables(t.themeVariables) : t && (t.themeVariables = p.default.getThemeVariables(t.themeVariables));
	let r = typeof t == "object" ? S(t) : n();
	k(r.logLevel), Xi();
}
O(Ra, "initialize");
var za = /* @__PURE__ */ O((e, t = {}) => {
	let { code: n } = la(e);
	return ta.fromText(n, t);
}, "getDiagramFromText");
function Ba(e, t, n, r) {
	$i(t, e), ea(t, n, r, t.attr("id"));
}
O(Ba, "addA11yInfo");
var Va = Object.freeze({
	render: La,
	parse: Da,
	getDiagramFromText: za,
	initialize: Ra,
	getConfig: h,
	setConfig: d,
	getSiteConfig: n,
	updateSiteConfig: s,
	reset: /* @__PURE__ */ O(() => {
		r();
	}, "reset"),
	globalReset: /* @__PURE__ */ O(() => {
		r(E);
	}, "globalReset"),
	defaultConfig: E
});
k(h().logLevel), r(h());
var Ha = /* @__PURE__ */ O((e, t, n) => {
	A.warn(e), ue(e) ? (n && n(e.str, e.hash), t.push({
		...e,
		message: e.str,
		error: e
	})) : (n && n(e), e instanceof Error && t.push({
		str: e.message,
		message: e.message,
		hash: e.name,
		error: e
	}));
}, "handleError"), Ua = /* @__PURE__ */ O(async function(e = { querySelector: ".mermaid" }) {
	try {
		await Wa(e);
	} catch (t) {
		if (ue(t) && A.error(t.str), $.parseError && $.parseError(t), !e.suppressErrors) throw A.error("Use the suppressErrors option to suppress these errors"), t;
	}
}, "run"), Wa = /* @__PURE__ */ O(async function({ postRenderCallback: e, querySelector: t, nodes: n } = { querySelector: ".mermaid" }) {
	let r = Va.getConfig();
	A.debug(`${e ? "" : "No "}Callback function found`);
	let i;
	if (n) i = n;
	else if (t) i = document.querySelectorAll(t);
	else throw Error("Nodes and querySelector are both undefined");
	A.debug(`Found ${i.length} diagrams`), r?.startOnLoad !== void 0 && (A.debug("Start On Load: " + r?.startOnLoad), Va.updateSiteConfig({ startOnLoad: r?.startOnLoad }));
	let a = new V.InitIDGenerator(r.deterministicIds, r.deterministicIDSeed), o, s = [];
	for (let t of Array.from(i)) {
		if (A.info("Rendering diagram: " + t.id), t.getAttribute("data-processed")) continue;
		t.setAttribute("data-processed", "true");
		let n = `mermaid-${a.next()}`;
		o = t.innerHTML, o = ge(V.entityDecode(o)).trim().replace(/<br\s*\/?>/gi, "<br/>");
		let r = V.detectInit(o);
		r && A.debug("Detected early reinit: ", r);
		try {
			let { svg: r, bindFunctions: i } = await eo(n, o, t);
			t.innerHTML = r, e && await e(n), i && i(t);
		} catch (e) {
			Ha(e, s, $.parseError);
		}
	}
	if (s.length > 0) throw s[0];
}, "runThrowsErrors"), Ga = /* @__PURE__ */ O(function(e) {
	Va.initialize(e);
}, "initialize"), Ka = /* @__PURE__ */ O(async function(e, t, n) {
	A.warn("mermaid.init is deprecated. Please use run instead."), e && Ga(e);
	let r = {
		postRenderCallback: n,
		querySelector: ".mermaid"
	};
	typeof t == "string" ? r.querySelector = t : t && (r.nodes = t instanceof HTMLElement ? [t] : t), await Ua(r);
}, "init"), qa = /* @__PURE__ */ O(async (e, { lazyLoad: t = !0 } = {}) => {
	Xi(), o(...e), t === !1 && await Zi();
}, "registerExternalDiagrams"), Ja = /* @__PURE__ */ O(function() {
	if ($.startOnLoad) {
		let { startOnLoad: e } = Va.getConfig();
		e && $.run().catch((e) => A.error("Mermaid failed to initialize", e));
	}
}, "contentLoaded");
typeof document < "u" && window.addEventListener("load", Ja, !1);
var Ya = /* @__PURE__ */ O(function(e) {
	$.parseError = e;
}, "setParseErrorHandler"), Xa = [], Za = !1, Qa = /* @__PURE__ */ O(async () => {
	if (!Za) {
		for (Za = !0; Xa.length > 0;) {
			let e = Xa.shift();
			if (e) try {
				await e();
			} catch (e) {
				A.error("Error executing queue", e);
			}
		}
		Za = !1;
	}
}, "executeQueue"), $a = /* @__PURE__ */ O(async (e, t) => new Promise((n, r) => {
	let i = /* @__PURE__ */ O(() => new Promise((i, a) => {
		Va.parse(e, t).then((e) => {
			i(e), n(e);
		}, (e) => {
			A.error("Error parsing", e), $.parseError?.(e), a(e), r(e);
		});
	}), "performCall");
	Xa.push(i), Qa().catch(r);
}), "parse"), eo = /* @__PURE__ */ O((e, t, n) => new Promise((r, i) => {
	let a = /* @__PURE__ */ O(() => new Promise((a, o) => {
		Va.render(e, t, n).then((e) => {
			a(e), r(e);
		}, (e) => {
			A.error("Error parsing", e), $.parseError?.(e), o(e), i(e);
		});
	}), "performCall");
	Xa.push(a), Qa().catch(i);
}), "render"), $ = {
	startOnLoad: !0,
	mermaidAPI: Va,
	parse: $a,
	render: eo,
	init: Ka,
	run: Ua,
	registerExternalDiagrams: qa,
	registerLayoutLoaders: Ce,
	initialize: Ga,
	parseError: void 0,
	contentLoaded: Ja,
	setParseErrorHandler: Ya,
	detectType: x,
	registerIconPacks: _e,
	getRegisteredDiagramsMetadata: /* @__PURE__ */ O(() => Object.keys(y).map((e) => ({ id: e })), "getRegisteredDiagramsMetadata")
}, to = $;
export { Ge as a, Oe as c, we as d, to as default, ve as f, U as i, He as l, kn as n, Ee as o, ze as r, Le as s, En as t, Te as u };
