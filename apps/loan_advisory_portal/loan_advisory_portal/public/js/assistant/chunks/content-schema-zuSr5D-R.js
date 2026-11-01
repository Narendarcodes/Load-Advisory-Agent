import { C as e, S as t, _ as n, b as r, c as i, g as a, p as o, r as s, s as c, u as l, x as u } from "./random-id-Dq3iPRBO.js";
// node_modules/@copilotkit/mcp-apps-renderer/dist/constants.mjs
var d = "mcp-apps", f = /* @__PURE__ */ new Set([
	"javascript:",
	"data:",
	"vbscript:",
	"blob:",
	"file:"
]), p = (e) => n(e).passthrough(), m = r(u(), e()), h = p({
	audience: c(s(["user", "assistant"])).optional(),
	priority: a().min(0).max(1).optional(),
	lastModified: u().optional()
}), g = u().refine((e) => {
	try {
		return atob(e), !0;
	} catch {
		return !1;
	}
}, "Expected base64-encoded data"), _ = t([p({
	uri: u(),
	mimeType: u().optional(),
	text: u(),
	_meta: m.optional()
}), p({
	uri: u(),
	mimeType: u().optional(),
	blob: g,
	_meta: m.optional()
})]), v = l("type", [
	p({
		type: o("text"),
		text: u(),
		annotations: h.optional(),
		_meta: m.optional()
	}),
	p({
		type: o("image"),
		data: g,
		mimeType: u(),
		annotations: h.optional(),
		_meta: m.optional()
	}),
	p({
		type: o("audio"),
		data: g,
		mimeType: u(),
		annotations: h.optional(),
		_meta: m.optional()
	}),
	p({
		type: o("resource"),
		resource: _,
		annotations: h.optional(),
		_meta: m.optional()
	}),
	p({
		type: o("resource_link"),
		uri: u(),
		name: u(),
		title: u().optional(),
		description: u().optional(),
		mimeType: u().optional(),
		size: a().optional(),
		annotations: h.optional(),
		_meta: m.optional()
	})
]), y = p({
	result: p({
		content: c(v).default([]),
		structuredContent: r(u(), e()).optional(),
		isError: i().optional(),
		_meta: r(u(), e()).optional()
	}),
	resourceUri: u(),
	serverHash: u(),
	serverId: u().optional(),
	toolInput: r(u(), e()).optional()
});
export { d as n, f as r, y as t };
