#!/usr/bin/env node
"use strict";
/*
 * Write guard for the read-only browser harnesses — TEST-ONLY.
 *
 *   const { createWriteGuard } = require("./write_guard.cjs");
 *   const guard = createWriteGuard({ label: "a11y@1440/authed" });
 *   await guard.attach(page);            // before the first navigation
 *   ...walk the pages...
 *   guard.report();                      // console lines, for the transcript
 *   guard.assertClean();                 // throws if the run tried to write
 *
 * A "read-only" audit is only read-only if something proves it. Before this module, the harness
 * avoided writes by shaping its inputs so the server would refuse (clearing a required field, for
 * instance) — a convention, not a control, and one that silently stopped being true whenever a
 * seeded fixture happened to make the input valid.
 *
 * The guard is the control: every request whose method is not a safe read is classified before it
 * leaves the browser. Three things let it through. Sign-in and sign-out, because a session exists
 * only because of them. The calls that carry an assistant turn, when the run holds a conversation.
 * And the reads this portal posts — Frappe's calling convention sends every whitelisted method as a
 * POST, so `get_profile` and `list_applications` arrive as POSTs too; a guard that called those
 * writes would block a page from loading its own data and then report the wreck as a clean run. Each
 * posted read is listed by name, with the reason, after checking the server code for a write.
 * Anything else a page tries to send is a finding, not a detail.
 */

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Every run makes these; the session exists only because of them. */
const SESSION_WRITES = [
	{ pattern: /^\/api\/method\/login$/, reason: "sign-in: the run reads through a real Frappe session" },
	{ pattern: /^\/api\/method\/login_form$/, reason: "sign-in: form-encoded variant of the same call" },
	{ pattern: /^\/api\/method\/logout$/, reason: "sign-out: closes the session the run opened" },
	{ pattern: /^\/api\/method\/refresh_csrf_token$/, reason: "CSRF refresh for the session's own writes" },
	{ pattern: /^\/login$/, reason: "sign-in posted to the login page itself" },
];

/** An assistant turn is a conversation with a live runtime, so its own calls are declared. */
const ASSISTANT_WRITES = [
	{
		pattern: /^\/api\/method\/loan_advisory_portal\.api\.agent\.mint_assertion$/,
		reason: "assistant turn: mints the 60-second assertion scoped to this borrower",
	},
	{
		pattern: /^\/api\/method\/loan_advisory_portal\.api\.agent\.record_turn$/,
		reason: "assistant turn: stores the transcript of the run the harness just completed",
	},
	{
		pattern: /^\/api\/method\/loan_advisory_portal\.api\.livekit\./,
		reason: "voice panel: mints a token for the voice leg (no loan record touched)",
	},
	{
		pattern: /^\/api\/copilotkit(\/|$)/,
		reason: "runtime call to the test AG-UI stub; nothing here reaches Frappe",
	},
];

const SAFE_READS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Reads that this portal's own client nevertheless sends as POST.
 *
 * Frappe's calling convention posts every whitelisted method, and `public/js/portal.js` follows it,
 * so `get_profile` and `list_applications` arrive as POSTs even though they only read. A guard that
 * equated "POST" with "write" would stop a page loading its own data and then report the wreck as a
 * clean run. Each entry below was read in `api/` and its service before being listed: none of them
 * sets a field, inserts a row or calls `frappe.db`.
 */
const POSTED_READS = [
	{ pattern: /^\/api\/method\/loan_advisory_portal\.api\.session\.me$/, reason: "returns the signed-in borrower's own context" },
	{ pattern: /^\/api\/method\/loan_advisory_portal\.api\.profile\.get_profile$/, reason: "reads the borrower's own profile" },
	{ pattern: /^\/api\/method\/loan_advisory_portal\.api\.applications\.list_applications$/, reason: "reads the borrower's own applications" },
	{ pattern: /^\/api\/method\/loan_advisory_portal\.api\.applications\.get_application$/, reason: "reads one application the borrower owns" },
	{ pattern: /^\/api\/method\/loan_advisory_portal\.api\.applications\.get_decision$/, reason: "reads the recorded decision for an owned application" },
	{ pattern: /^\/api\/method\/loan_advisory_portal\.api\.documents\.list_documents$/, reason: "lists document metadata" },
	{ pattern: /^\/api\/method\/loan_advisory_portal\.api\.documents\.list_document_types$/, reason: "lists the document-type catalogue" },
	{ pattern: /^\/api\/method\/loan_advisory_portal\.api\.documents\.download_document$/, reason: "streams a document the borrower already owns; a form post, not a change" },
	{ pattern: /^\/api\/method\/loan_advisory_portal\.api\.feedback\.list_feedback$/, reason: "reads the borrower's own feedback" },
	{ pattern: /^\/api\/method\/loan_advisory_portal\.api\.invitations\.validate$/, reason: "checks an invitation token; redeem() is the write" },
	{ pattern: /^\/api\/method\/loan_advisory_portal\.api\.agent\.conversation_messages$/, reason: "reads the transcript of an owned conversation" },
	{ pattern: /^\/api\/method\/loan_advisory_portal\.api\.agent\.list_conversations$/, reason: "reads the borrower's own conversation list" },
];

function createWriteGuard(options = {}) {
	const { label = "run", assistant = false, allow = [] } = options;
	const declared = [...SESSION_WRITES, ...(assistant ? ASSISTANT_WRITES : []), ...allow];
	const records = [];

	const describe = (request) => {
		const url = new URL(request.url());
		return { method: request.method().toUpperCase(), path: `${url.pathname}${url.search ? `?${url.search.slice(1)}` : ""}`, origin: url.origin };
	};

	async function attach(page) {
		await page.route("**/*", async (route) => {
			const request = route.request();
			const method = request.method().toUpperCase();
			if (SAFE_READS.has(method)) return route.continue();
			const { path, origin } = describe(request);
			const bare = path.split("?")[0];
			const read = POSTED_READS.find((entry) => entry.pattern.test(bare));
			if (read) {
				records.push({ at: new Date().toISOString(), label, origin, method, path, decision: "read", reason: read.reason });
				return route.continue();
			}
			const hit = declared.find((entry) => entry.pattern.test(bare));
			if (!MUTATING.has(method)) {
				records.push({ at: new Date().toISOString(), label, origin, method, path, decision: "noted", reason: "method that is neither a safe read nor a declared write" });
				return route.abort("aborted");
			}
			if (hit) {
				records.push({ at: new Date().toISOString(), label, origin, method, path, decision: "allowed", reason: hit.reason });
				return route.continue();
			}
			records.push({
				at: new Date().toISOString(),
				label,
				origin,
				method,
				path,
				decision: "blocked",
				reason: "a read-only run asked Frappe to change something",
			});
			return route.abort("blockedbyclient");
		});
	}

	const blocked = () => records.filter((r) => r.decision === "blocked" || r.decision === "noted");
	const allowed = () => records.filter((r) => r.decision === "allowed");
	const postedReads = () => records.filter((r) => r.decision === "read");

	function summary() {
		const counts = new Map();
		for (const record of [...allowed(), ...postedReads()]) {
			const key = `${record.method} ${record.path.split("?")[0]}`;
			counts.set(key, (counts.get(key) || 0) + 1);
		}
		return {
			label,
			requestsSeen: records.length,
			postedReads: postedReads().length,
			writesAllowed: allowed().length,
			writesBlocked: blocked().length,
			byPath: [...counts].map(([request, times]) => ({ request, times })),
		};
	}

	function report(log = console.log) {
		for (const record of blocked()) {
			log(`  WRITE GUARD ${label}: ${record.decision} ${record.method} ${record.path} (${record.reason})`);
		}
	}

	/** Throws when the run tried anything it did not declare. */
	function assertClean() {
		const problems = blocked();
		if (!problems.length) return summary();
		const detail = problems.map((p) => `      ${p.decision} ${p.method} ${p.path} [${p.label}]`).join("\n");
		throw new Error(
			`write guard found ${problems.length} undeclared mutating request(s) in "${label}":\n${detail}\n` +
				"      Declare it in the run (it is a real write) or fix the harness step that triggered it.",
		);
	}

	return { attach, summary, report, assertClean, records, blocked };
}

module.exports = { createWriteGuard, SESSION_WRITES, ASSISTANT_WRITES, POSTED_READS };
