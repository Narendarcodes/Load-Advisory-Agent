import { a as e, c as t, d as n, g as r, h as i, i as a, l as o, m as s, p as c, s as l, u } from "./random-id-CUzDLhTm.js";
// node_modules/.pnpm/@copilotkit+mcp-apps-render_930531415c0c853efe006375fdb5b352/node_modules/@copilotkit/mcp-apps-renderer/dist/constants.mjs
var d = "mcp-apps", f = /* @__PURE__ */ new Set([
	"javascript:",
	"data:",
	"vbscript:",
	"blob:",
	"file:"
]), p = (e) => n(e).passthrough(), m = c(s(), r()), h = p({
	audience: a(t(["user", "assistant"])).optional(),
	priority: u().min(0).max(1).optional(),
	lastModified: s().optional()
}), g = s().refine((e) => {
	try {
		return atob(e), !0;
	} catch {
		return !1;
	}
}, "Expected base64-encoded data"), _ = i([p({
	uri: s(),
	mimeType: s().optional(),
	text: s(),
	_meta: m.optional()
}), p({
	uri: s(),
	mimeType: s().optional(),
	blob: g,
	_meta: m.optional()
})]), v = l("type", [
	p({
		type: o("text"),
		text: s(),
		annotations: h.optional(),
		_meta: m.optional()
	}),
	p({
		type: o("image"),
		data: g,
		mimeType: s(),
		annotations: h.optional(),
		_meta: m.optional()
	}),
	p({
		type: o("audio"),
		data: g,
		mimeType: s(),
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
		uri: s(),
		name: s(),
		title: s().optional(),
		description: s().optional(),
		mimeType: s().optional(),
		size: u().optional(),
		annotations: h.optional(),
		_meta: m.optional()
	})
]), y = p({
	result: p({
		content: a(v).default([]),
		structuredContent: c(s(), r()).optional(),
		isError: e().optional(),
		_meta: c(s(), r()).optional()
	}),
	resourceUri: s(),
	serverHash: s(),
	serverId: s().optional(),
	toolInput: c(s(), r()).optional()
});
export { d as n, f as r, y as t };
