#!/usr/bin/env node
"use strict";
/*
 * Browser-level consent regression test — TEST-ONLY, writes to a seeded fixture and says so.
 *
 *   BORROWER_EMAIL=… BORROWER_PASSWORD=… node tests/e2e/consent_regression_e2e.cjs
 *
 * What it does: signs in through Frappe, then performs the saves a real borrower performs —
 * profile form saves and the application wizard's first step — and leaves the page state behind for
 * a database read of `consent_at` and the document's Version chain.
 *
 * The discriminator is the number of consent changes. The fixture starts with the consent flags set
 * by the seeder and no notice version recorded, so exactly one acceptance is a genuine consent event
 * and every save after that must be silent about consent. Before the controller fix, each of the
 * saves below restamped `consent_at`, which is the defect this test now guards.
 *
 * The write guard is attached, with `update_profile` declared as this run's own deliberate write on a
 * disposable fixture. Nothing else may pass.
 */

const path = require("path");
const { mkdirSync, writeFileSync } = require("fs");
const { chromium } = require("playwright");
const { createWriteGuard } = require("./write_guard.cjs");

const BASE = process.env.BASE || "http://127.0.0.1:8081";
const EMAIL = process.env.BORROWER_EMAIL;
const PASSWORD = process.env.BORROWER_PASSWORD;
const OUT = process.env.OUT || path.join("docs", "borrower-frontend", "acceptance", "2026-11-01-mvp-closure", "consent");

const PROFILE_WRITE = {
	pattern: /^\/api\/method\/loan_advisory_portal\.api\.profile\.update_profile$/,
	reason: "declared write: this run saves the seeded fixture's own profile through the real UI",
};

async function login(page) {
	await page.goto(`${BASE}/login?redirect-to=%2Fborrower`, { waitUntil: "load" });
	await page.fill("#email", EMAIL);
	await page.fill("#password", PASSWORD);
	await page.click("#login-button");
	await page.waitForURL("**/borrower", { timeout: 45000 });
}

async function readProfile(page) {
	// The page's own helper: same JSON body, same CSRF header, same session a borrower's click uses.
	return page.evaluate(async () => {
		if (!window.Portal || typeof window.Portal.call !== "function") return { error: "Portal helper not present" };
		return window.Portal.call("loan_advisory_portal.api.profile.get_profile", {});
	});
}

async function saveProfile(page, mutate) {
	await page.goto(`${BASE}/borrower/profile`, { waitUntil: "load" });
	await page.waitForSelector("#profile-form", { timeout: 20000 });
	await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 900)));
	await mutate(page);
	await page.click("#save");
	await page.waitForFunction(
		() => {
			const status = document.querySelector("#flash");
			return status && /saved|could not save/i.test(status.textContent);
		},
		{ timeout: 20000 },
	);
	const outcome = await page.evaluate(() => (document.querySelector("#flash") || {}).textContent);
	return String(outcome || "").trim();
}

async function wizardStepOne(page, name, phone) {
	await page.goto(`${BASE}/borrower/apply`, { waitUntil: "load" });
	await page.waitForSelector("#about-name", { timeout: 20000 });
	await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 700)));
	await page.fill("#about-name", name);
	await page.fill("#about-phone", phone);
	await page.click("#next");
	await page.waitForFunction(() => document.querySelector("#work-months") !== null, { timeout: 20000 });
	return page.evaluate(() => document.querySelector("#about-name").value);
}

(async () => {
	if (!EMAIL || !PASSWORD) throw new Error("BORROWER_EMAIL and BORROWER_PASSWORD are required");
	mkdirSync(OUT, { recursive: true });
	const browser = await chromium.launch();
	const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
	const page = await context.newPage();
	const guard = createWriteGuard({ label: "consent-regression", assistant: false, allow: [PROFILE_WRITE] });
	await guard.attach(page);
	const consoleErrors = [];
	const failedRequests = [];
	page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text().slice(0, 200)));
	page.on("pageerror", (e) => consoleErrors.push(String(e.message).slice(0, 200)));
	page.on("response", (r) => r.status() >= 400 && failedRequests.push({ status: r.status(), url: r.url() }));

	await login(page);
	const steps = [];
	const first = await readProfile(page);
	steps.push({ step: "entry", profile: first, expected: "consent flags set by the seeder, no notice version yet" });

	steps.push({
		step: "save 1 — unrelated field with the consent checkboxes present",
		status: await saveProfile(page, async (p) => p.fill("#employer", "Synthetic Traders")),
		profile: await readProfile(page),
	});
	steps.push({
		step: "save 2 — another unrelated field, consent unchanged",
		status: await saveProfile(page, async (p) => p.fill("#monthly-income", "52000")),
		profile: await readProfile(page),
	});
	steps.push({
		step: "wizard step 1 — posts full_name and phone only",
		status: "step advanced",
		nameOnScreen: await wizardStepOne(page, "Mvp1 Borrower Renamed", "+919876500011"),
		profile: await readProfile(page),
	});
	steps.push({
		step: "save 3 — third unrelated save, the one that used to restamp",
		status: await saveProfile(page, async (p) => p.fill("#monthly-obligations", "8000")),
		profile: await readProfile(page),
	});

	await page.goto(`${BASE}/borrower/profile`, { waitUntil: "load" });
	await page.waitForSelector("#profile-form", { timeout: 20000 });
	await page.screenshot({ path: path.join(OUT, "profile-after-consent-saves-1440.png"), fullPage: true });
	guard.report();

	const result = {
		generatedAt: new Date().toISOString(),
		base: BASE,
		borrower: EMAIL,
		steps,
		consentFlagsAtEnd: { terms: steps.at(-1).profile.consent_terms, privacy: steps.at(-1).profile.consent_privacy },
		noticeVersionsAtEnd: {
			terms: steps.at(-1).profile.terms_version,
			privacy: steps.at(-1).profile.privacy_version,
		},
		profileFieldsAtEnd: {
			full_name: steps.at(-1).profile.full_name,
			employer: steps.at(-1).profile.employer,
			monthly_income: steps.at(-1).profile.monthly_income,
			monthly_obligations: steps.at(-1).profile.monthly_obligations,
		},
		writeGuard: guard.summary(),
		consoleErrors,
		failedRequests,
	};
	// `consent_at` itself is not returned by get_profile, so the database read after this run is the
	// measurement; these are the assertions the browser side can make on its own.
	result.checks = [
		{ check: "every save reported success", pass: steps.slice(1).every((s) => !/could not save/i.test(s.status || "")) },
		{ check: "consent flags stayed granted", pass: result.consentFlagsAtEnd.terms === 1 && result.consentFlagsAtEnd.privacy === 1 },
		{ check: "both notice versions recorded", pass: !!result.noticeVersionsAtEnd.terms && !!result.noticeVersionsAtEnd.privacy },
		{ check: "the unrelated edits landed", pass: result.profileFieldsAtEnd.monthly_income === 52000 && result.profileFieldsAtEnd.employer === "Synthetic Traders" },
		{ check: "no undeclared write attempted", pass: guard.summary().writesBlocked === 0 },
		{ check: "no console errors", pass: consoleErrors.length === 0 },
		{ check: "no failed requests", pass: failedRequests.length === 0 },
	];
	writeFileSync(path.join(OUT, "consent-browser-results.json"), JSON.stringify(result, null, 2));
	await context.close();
	await browser.close();

	const failures = result.checks.filter((c) => !c.pass);
	console.log(`consent browser steps: ${steps.length}, writes allowed ${result.writeGuard.writesAllowed}, blocked ${result.writeGuard.writesBlocked}`);
	console.log(`checks: ${result.checks.length - failures.length}/${result.checks.length} passed`);
	if (failures.length) {
		console.log(JSON.stringify(failures, null, 2));
		process.exit(1);
	}
	console.log(`wrote ${path.join(OUT, "consent-browser-results.json")}`);
})().catch((error) => {
	console.error("consent browser regression failed:", error);
	process.exit(1);
});
