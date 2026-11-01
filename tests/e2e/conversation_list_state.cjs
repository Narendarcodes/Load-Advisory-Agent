#!/usr/bin/env node
"use strict";
/*
 * Reads the borrower-facing assistant conversation list from inside a real browser session.
 *
 *   BORROWER_EMAIL=… BORROWER_PASSWORD=… APPLICATION=ACC-LOAP-… LABEL=before node conversation_list_state.cjs
 *
   Run it twice around a deletion — LABEL=before and LABEL=after — to show that the list the borrower
 * sees is the store: the same document read, the same panel, with the removed threads gone.
 *
 * Read-only: only sign-in and posted reads are allowed, so the guard fails the run if the page tries
 * to write anything.
 */

const path = require("path");
const { mkdirSync, writeFileSync } = require("fs");
const { chromium } = require("playwright");
const { createWriteGuard } = require("./write_guard.cjs");

const BASE = process.env.BASE || "http://127.0.0.1:8081";
const EMAIL = process.env.BORROWER_EMAIL;
const PASSWORD = process.env.BORROWER_PASSWORD;
const APPLICATION = process.env.APPLICATION || "";
const LABEL = process.env.LABEL || "run";
const OUT = process.env.OUT || path.join("docs", "borrower-frontend", "acceptance", "2026-11-01-mvp-closure", "conversation-list");

(async () => {
	if (!EMAIL || !PASSWORD) throw new Error("BORROWER_EMAIL and BORROWER_PASSWORD are required");
	mkdirSync(OUT, { recursive: true });
	const browser = await chromium.launch();
	const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
	const page = await context.newPage();
	const guard = createWriteGuard({ label: `conversation-list/${LABEL}` });
	await guard.attach(page);
	const consoleErrors = [];
	const failedRequests = [];
	page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text().slice(0, 200)));
	page.on("pageerror", (e) => consoleErrors.push(String(e.message).slice(0, 200)));
	page.on("response", (r) => r.status() >= 400 && failedRequests.push({ status: r.status(), url: r.url() }));

	await page.goto(`${BASE}/login?redirect-to=%2Fborrower`, { waitUntil: "load" });
	await page.fill("#email", EMAIL);
	await page.fill("#password", PASSWORD);
	await page.click("#login-button");
	await page.waitForURL("**/borrower", { timeout: 45000 });

	const url = `${BASE}/borrower/assistant${APPLICATION ? `?application=${APPLICATION}` : ""}`;
	await page.goto(url, { waitUntil: "load" });
	await page.waitForTimeout(2500);

	const listed = await page.evaluate(async (application) => {
		if (!window.Portal || typeof window.Portal.call !== "function") return { status: 0, threads: [], error: "Portal helper not present" };
		try {
			const rows = await window.Portal.call("loan_advisory_portal.api.agent.list_conversations", application ? { application } : {});
			return { status: 200, threads: (rows || []).map((row) => row.thread_id) };
		} catch (failure) {
			return { status: failure.status || 0, threads: [], error: String(failure.message || failure).slice(0, 160) };
		}
	}, APPLICATION);

	// What the panel itself renders, not only what the API returned: the island's history section is
	// `.history` with `.history__item` buttons (island.tsx), and an empty state in `.note`.
	const panel = await page.evaluate(() => {
		const items = Array.from(document.querySelectorAll(".history__item"));
		return {
			historySectionPresent: !!document.querySelector(".history"),
			headingText: (document.querySelector(".history .history__title") || {}).textContent || "",
			renderedItems: items.length,
			itemLabels: items.map((node) => (node.querySelector(".history__label") || node).textContent.trim()),
			currentItemAria: (document.querySelector('.history__item[aria-current="true"]') || {}).className || null,
			emptyStateNote: items.length ? null : (document.querySelector(".history .note") || {}).textContent || null,
		};
	});

	await page.screenshot({ path: path.join(OUT, `assistant-list-${LABEL}-1440.png`), fullPage: true });
	guard.report();
	const result = {
		generatedAt: new Date().toISOString(),
		label: LABEL,
		url,
		api: listed,
		panel,
		writeGuard: guard.summary(),
		consoleErrors,
		failedRequests,
	};
	writeFileSync(path.join(OUT, `conversation-list-${LABEL}.json`), JSON.stringify(result, null, 2));
	await context.close();
	await browser.close();
	console.log(
		`[${LABEL}] threads ${listed.threads.length} (api status ${listed.status}), panel items ${panel.renderedItems}, blocked writes ${result.writeGuard.writesBlocked}, console errors ${consoleErrors.length}`,
	);
	if (result.writeGuard.writesBlocked || consoleErrors.length) process.exit(1);
})().catch((error) => {
	console.error("conversation list state capture failed:", error);
	process.exit(1);
});
