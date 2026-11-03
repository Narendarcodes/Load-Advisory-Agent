// node --test tests/js/portal_reasons.test.cjs
// Plain-language decision copy: themes, summaries and steps never carry a number, a threshold, a score or a rule id.
const test = require("node:test");
const assert = require("node:assert/strict");
const R = require("../../apps/loan_advisory_portal/loan_advisory_portal/public/js/reasons.js");

const BANNED = /cibil|foir|threshold|cut-?off|PL-|score/i;

// What the API sends today (Qoder Q-07): raw texts with cut-offs, rule ids and codes.
const RAW = [
	{ code: "FOIR_TOO_HIGH", text: "Your existing monthly repayments are more than 45% of your monthly income." },
	{ code: "CREDIT_SCORE_LOW", text: "Your credit score is below the minimum this product accepts (650)." },
	{ code: "PL-104", text: "Signature similarity 0.41 is below the 0.60 cut-off." },
	{ code: "ERR_EMPLOYMENT_TENURE_SHORT", text: "4 months in job; required 6." },
];

test("each raw reason maps to a borrower theme, by category first, then code, then words", () => {
	assert.equal(R.classify(RAW[0]), "REPAYMENTS_TOO_HIGH");
	assert.equal(R.classify(RAW[1]), "CREDIT_HISTORY");
	assert.equal(R.classify(RAW[2]), "DETAILS_NOT_VERIFIED");
	assert.equal(R.classify(RAW[3]), "EMPLOYMENT");
	assert.equal(R.classify({ code: "ERR_FOIR_EXCEEDED" }), "REPAYMENTS_TOO_HIGH");
	assert.equal(R.classify({ code: "ERR_INCOME_BELOW_MINIMUM" }), "INCOME");
	assert.equal(R.classify({ rule_id: "MIN_CREDIT_SCORE" }), "CREDIT_HISTORY");
	assert.equal(R.classify({ code: "BUREAU_TIMEOUT" }), "CHECKS_PENDING");
	assert.equal(R.classify({ category: "EMPLOYMENT_STABILITY", code: "MIN_CREDIT_SCORE" }), "EMPLOYMENT");
	assert.equal(R.classify({ category: "DOCUMENTS_INCOMPLETE_OR_UNCLEAR" }), "DOCUMENTS");
	assert.equal(R.classify({ code: "PL-077" }), "OTHER");
	assert.equal(R.classify("RECENT_ENQUIRIES_HIGH"), "RECENT_APPLICATIONS");
});

test("at most three distinct themes, and the generic one drops out when a specific one is present", () => {
	assert.deepEqual(R.themes(RAW), ["REPAYMENTS_TOO_HIGH", "CREDIT_HISTORY", "DETAILS_NOT_VERIFIED"]);
	assert.deepEqual(R.themes([{ code: "PL-077" }, { code: "FOIR_TOO_HIGH" }, { code: "FOIR_MAX_45" }]), ["REPAYMENTS_TOO_HIGH"]);
	assert.deepEqual(R.themes([{ code: "PL-077" }]), ["OTHER"]);
	assert.deepEqual(R.themes([]), []);
});

test("the copy itself has no digits and none of the banned words, in every language", () => {
	for (const locale of R.LOCALES) {
		for (const table of [R.THEMES, R.SUMMARIES, R.STEPS]) {
			const values = Object.values(table[locale]);
			assert.ok(values.length >= 5, `${locale} table filled`);
			for (const text of values) {
				assert.doesNotMatch(text, /\d/, `${locale}: ${text}`);
				assert.doesNotMatch(text, BANNED, `${locale}: ${text}`);
			}
		}
		assert.deepEqual(Object.keys(R.THEMES[locale]).sort(), Object.keys(R.THEMES.en).sort());
		assert.deepEqual(Object.keys(R.STEPS[locale]).sort(), Object.keys(R.STEPS.en).sort());
		assert.deepEqual(Object.keys(R.SUMMARIES[locale]).sort(), Object.keys(R.SUMMARIES.en).sort());
	}
});

test("the themes the user asked for read exactly as agreed", () => {
	assert.equal(R.themeText("CREDIT_HISTORY", "en"), "Your credit history doesn't meet our requirements right now.");
	assert.equal(R.themeText("REPAYMENTS_TOO_HIGH", "en"), "The new EMI would take too much of your monthly income.");
	assert.equal(R.themeText("DETAILS_NOT_VERIFIED", "en"), "We couldn't verify some details.");
	assert.match(R.themeText("CREDIT_HISTORY", "hi"), /क्रेडिट इतिहास/);
	assert.match(R.themeText("CREDIT_HISTORY", "te"), /క్రెడిట్ చరిత్ర/);
	assert.equal(R.themeText("CREDIT_HISTORY", "fr"), R.themeText("CREDIT_HISTORY", "en"));
});

test("summaries are one or two sentences per outcome; lifecycle names map onto them", () => {
	assert.match(R.summary("REJECTED", "en"), /can't approve/);
	assert.equal(R.summary("MANUAL_REVIEW", "en"), R.summary("REVIEW", "en"));
	assert.equal(R.summary("INFO_REQUESTED", "te"), R.SUMMARIES.te.INFO);
	assert.equal(R.summary("WITHDRAWN", "en"), null);
	for (const locale of R.LOCALES) {
		for (const text of Object.values(R.SUMMARIES[locale])) {
			const sentences = text.split(/[.।]\s*/).filter((part) => part.trim()).length;
			assert.ok(sentences >= 1 && sentences <= 2, `${locale}: ${text}`);
		}
	}
});

test("an improvement plan is two or three general steps", () => {
	assert.equal(R.steps(["CREDIT_HISTORY"], "en").length, 2);
	assert.equal(R.steps(["CREDIT_HISTORY", "REPAYMENTS_TOO_HIGH", "INCOME", "EMPLOYMENT"], "en").length, 3);
	assert.equal(R.steps([], "hi").length, 2);
	assert.equal(R.steps(["OTHER"], "en").length, 2);
});

test("server text is shown only when it carries no number and no banned word", () => {
	for (const reason of RAW) assert.equal(R.safeText(reason.text), null);
	assert.equal(R.safeText("Checks finished"), "Checks finished");
	assert.equal(R.safeText("Rule PL-ABC hit"), null);
	assert.equal(R.safeText(""), null);
	assert.equal(R.safeText(42), null);
});

test("the EMI is the borrower's own offer, from amount, tenure and product rate", () => {
	assert.equal(Math.round(R.emi(200000, 24, 13.5)), 9555);
	assert.equal(R.emi(120000, 12, 0), 10000);
	assert.equal(R.emi(0, 12, 12), null);
});

const APP = {
	lifecycle: "REJECTED",
	loan_amount: 500000,
	tenure_months: 36,
	product: { rate_of_interest: 13.5 },
};

test("a decline shows a summary, up to three plain themes and general steps, never the raw texts", () => {
	const view = R.decisionView(APP, { available: true, reasons: RAW }, "en");
	assert.match(view.summary, /can't approve/);
	assert.deepEqual(view.themes.map((t) => t.key), ["REPAYMENTS_TOO_HIGH", "CREDIT_HISTORY", "DETAILS_NOT_VERIFIED"]);
	assert.ok(view.steps.length >= 2 && view.steps.length <= 3);
	assert.equal(view.offer, null);
	const rendered = [view.summary, ...view.themes.map((t) => t.text), ...view.steps].join(" ");
	assert.doesNotMatch(rendered, /\d/);
	assert.doesNotMatch(rendered, BANNED);
});

test("a decline with no recorded reasons still gets one plain theme", () => {
	const view = R.decisionView(APP, { available: true, reasons: [] }, "te");
	assert.deepEqual(view.themes.map((t) => t.key), ["OTHER"]);
	assert.equal(view.themes[0].text, R.THEMES.te.OTHER);
});

test("a review shows a calm summary and only the themes on record, with no steps", () => {
	const view = R.decisionView({ ...APP, lifecycle: "MANUAL_REVIEW" }, { available: true, reasons: [RAW[2]] }, "hi");
	assert.equal(view.summary, R.SUMMARIES.hi.REVIEW);
	assert.deepEqual(view.themes.map((t) => t.key), ["DETAILS_NOT_VERIFIED"]);
	assert.deepEqual(view.steps, []);
});

test("an approval shows the borrower's own offer only: amount, EMI and tenure", () => {
	const view = R.decisionView({ ...APP, lifecycle: "APPROVED", loan_amount: 200000, tenure_months: 24 }, { available: true, reasons: [] }, "en");
	assert.deepEqual(view.offer, { amount: 200000, tenure_months: 24, emi: 9555 });
	assert.deepEqual(view.themes, []);
	const fromOffer = R.decisionView({ ...APP, lifecycle: "APPROVED" }, { available: true, offer: { amount: 150000, emi: 7000, tenure_months: 24 } }, "en");
	assert.deepEqual(fromOffer.offer, { amount: 150000, tenure_months: 24, emi: 7000 });
});

test("a bureau or service failure is a plain 'couldn't finish' summary with no reasons", () => {
	const view = R.decisionView(APP, { available: true, provider_error: true, reasons: RAW }, "en");
	assert.equal(view.summary, R.SUMMARIES.en.ERROR);
	assert.deepEqual(view.themes, []);
});
