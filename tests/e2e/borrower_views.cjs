/*
 * Capture the borrower portal view matrix for the implementation record.
 *
 *   BORROWER_EMAIL=... BORROWER_PASSWORD=... \
 *     NODE_PATH=%APPDATA%/npm/node_modules node tests/e2e/borrower_views.cjs
 *
 * Runs against the disposable site behind the e2e proxy (default :8081).
 * Writes full-page screenshots and a measurement summary under
 * docs/borrower-frontend/screenshots/. Read-only, and now proved rather than promised: every
 * request that would change server state is blocked unless it is the sign-in the run needs.
 */
const { chromium } = require("playwright");
const { mkdirSync, writeFileSync } = require("node:fs");
const path = require("node:path");
const { createWriteGuard } = require("./write_guard.cjs");

const BASE = process.env.BASE || "http://localhost:8081";
const EMAIL = process.env.BORROWER_EMAIL || "review.demo@example.invalid";
const PASSWORD = process.env.BORROWER_PASSWORD || "";
const OUT = process.env.OUT || path.join("docs", "borrower-frontend", "screenshots");
const WIDTHS = (process.env.WIDTHS || "1440,1280,1024,768,390").split(",").map(Number);

// Three routes address one application by name. Hardcoding them ties this harness to one fixture: run
// it as another borrower and the page 404s for ownership reasons (correctly) and the run reports
// console errors that belong to the harness, not the portal. Pass the ids you own; anything unset is
// skipped and said so.
const IDS = {
	submitted: process.env.SUBMITTED_APPLICATION || "",
	decision: process.env.DECISION_APPLICATION || "",
	assistant: process.env.APPLICATION || "",
};

const VIEWS = [
	{ id: "01-landing-products", label: "Public loan products", url: "/borrower/products", guest: true },
	{ id: "02-sign-in", label: "Sign in", url: "/login?redirect-to=%2Fborrower", guest: true },
	{ id: "03-dashboard", label: "Borrower dashboard", url: "/borrower" },
	{ id: "04-eligibility", label: "Indicative eligibility", url: "/borrower/eligibility" },
	{ id: "05-apply", label: "Application wizard", url: "/borrower/apply" },
	{ id: "06-kyc-workspace", label: "Identity (KYC) workspace", url: "/borrower/kyc" },
	{ id: "07-documents-workspace", label: "Documents workspace", url: "/borrower/documents" },
	...(IDS.submitted
		? [
				{
					id: "08-application-tracker",
					label: "Application tracker (submitted)",
					url: `/borrower/application?name=${IDS.submitted}`,
				},
		  ]
		: []),
	...(IDS.decision
		? [
				{
					id: "09-decision-rejected",
					label: "Recorded decision (rejected)",
					url: `/borrower/application?name=${IDS.decision}`,
				},
		  ]
		: []),
	...(IDS.assistant
		? [
				{
					id: "10-advisory-workspace",
					label: "AI advisory workspace (Layout H)",
					url: `/borrower/assistant?application=${IDS.assistant}`,
					settle: 3500,
				},
		  ]
		: []),
	{ id: "11-servicing", label: "Repayments (demo fixture)", url: "/borrower/servicing" },
	{ id: "12-profile", label: "Profile and consents", url: "/borrower/profile" },
	{ id: "13-help", label: "Help", url: "/borrower/help" },
	{ id: "14-feedback", label: "Feedback", url: "/borrower/feedback" },
	{ id: "15-terms", label: "Terms of use", url: "/borrower/terms" },
	{ id: "16-privacy", label: "Privacy notice", url: "/borrower/privacy" },
	{ id: "17-invite-unavailable", label: "Invitation link (unavailable state)", url: "/borrower/invite", guest: true },
];

function slug(width) {
	return String(width);
}

async function settle(page, ms) {
	await page.waitForLoadState("load");
	await page.evaluate(() => (document.fonts ? document.fonts.ready : Promise.resolve()));
	await page.waitForTimeout(ms || 900);
}

async function measure(page) {
	return page.evaluate(() => {
		const root = document.documentElement;
		const overflow = root.scrollWidth - window.innerWidth;
		const offenders = [];
		if (overflow > 1) {
			document.querySelectorAll("body *").forEach((el) => {
				const rect = el.getBoundingClientRect();
				if (rect.right > window.innerWidth + 1 && rect.width > 8) {
					offenders.push({
						tag: el.tagName.toLowerCase(),
						cls: (el.className || "").toString().slice(0, 60),
						right: Math.round(rect.right),
					});
				}
			});
		}
		return {
			url: location.pathname + location.search,
			title: document.title,
			viewport: window.innerWidth,
			scrollWidth: root.scrollWidth,
			overflowPx: overflow,
			offenders: offenders.slice(0, 5),
		};
	});
}

async function capture(page, view, width, record) {
	await page.goto(BASE + view.url, { waitUntil: "load", timeout: 45000 });
	await settle(page, view.settle);
	const metrics = await measure(page);
	const file = path.join(OUT, `${view.id}-${slug(width)}.png`);
	// Full-page capture stretches the viewport, so the sticky mobile tab bar would
	// be stamped over the middle of the image. Put it back in flow for the shot only.
	await page.addStyleTag({ content: ".tabbar { position: static !important; }" });
	await page.screenshot({ path: file, fullPage: true });
	record.push({ view: view.id, label: view.label, width, file: file.replace(/\\/g, "/"), ...metrics });
}

(async () => {
	if (!PASSWORD) {
		console.error("BORROWER_PASSWORD is required.");
		process.exit(2);
	}
	mkdirSync(OUT, { recursive: true });

	const record = [];
	const consoleErrors = [];
	const guards = [];

	for (const width of WIDTHS) {
		const browser = await chromium.launch();
		const context = await browser.newContext({
			viewport: { width, height: width <= 768 ? 900 : 1000 },
			reducedMotion: "reduce",
		});
		const page = await context.newPage();
		// A screenshot matrix has no reason to write: declare only the session calls, block the rest.
		const guard = createWriteGuard({ label: `views@${width}` });
		await guard.attach(page);
		guards.push(guard);
		page.on("console", (msg) => {
			if (msg.type() === "error") consoleErrors.push({ width, view: page.url(), text: msg.text().slice(0, 300) });
		});
		page.on("pageerror", (err) => consoleErrors.push({ width, view: page.url(), text: "pageerror: " + err.message.slice(0, 300) }));

		for (const view of VIEWS.filter((item) => item.guest)) {
			await capture(page, view, width, record);
		}

		await page.goto(BASE + "/login?redirect-to=%2Fborrower", { waitUntil: "load" });
		await page.fill("#email", EMAIL);
		await page.fill("#password", PASSWORD);
		await page.click("#login-button");
		await page.waitForURL("**/borrower", { timeout: 20000 });

		for (const view of VIEWS.filter((item) => !item.guest)) {
			await capture(page, view, width, record);
		}

		await context.close();
		await browser.close();
	}

	const unexpectedWrites = guards.flatMap((g) => g.blocked());
	writeFileSync(
		path.join(OUT, "_summary.json"),
		JSON.stringify(
			{ capturedAt: new Date().toISOString(), base: BASE, record, consoleErrors, writeGuard: guards.map((g) => g.summary()) },
			null,
			2,
		),
	);
	const bad = record.filter((row) => row.overflowPx > 1);
	console.log(`captured ${record.length} screenshots across ${WIDTHS.length} widths`);
	const skipped = ["08-application-tracker", "09-decision-rejected", "10-advisory-workspace"].filter(
		(id) => !record.some((row) => row.view === id || row.viewId === id),
	);
	if (skipped.length) console.log(`skipped (no application id supplied for this fixture): ${skipped.join(", ")}`);
	console.log(bad.length ? `overflow: ${JSON.stringify(bad.map((b) => [b.view, b.width, b.overflowPx]))}` : "overflow: none");
	console.log(`console errors: ${consoleErrors.length}`);
	if (consoleErrors.length) console.log(JSON.stringify(consoleErrors.slice(0, 5), null, 2));
	console.log(`non-read requests: writes allowed ${guards.reduce((s, g) => s + g.summary().writesAllowed, 0)}, blocked ${unexpectedWrites.length}`);
	for (const entry of unexpectedWrites) {
		console.log(`  UNEXPECTED ${entry.decision} ${entry.method} ${entry.path} [${entry.label}]`);
	}
	if (unexpectedWrites.length) {
		console.error("read-only capture attempted undeclared writes");
		process.exitCode = 1;
	}
})().catch((err) => {
	console.error("capture failed:", err);
	process.exit(1);
});
