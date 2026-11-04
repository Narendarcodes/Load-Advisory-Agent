// node --test tests/js/portal_assessed_ist.test.cjs
// E2E D-05 (2026-11-04): "Assessed" showed the UTC date (3 Nov for a 4 Nov 02:41 IST decision). Show it in IST.
const test = require("node:test");
const assert = require("node:assert/strict");
const S = require("../../apps/loan_advisory_portal/loan_advisory_portal/public/js/status.js");

test("a UTC evaluation time is shown on the borrower's IST calendar day, with time", () => {
	assert.equal(S.assessedText("2026-11-03T21:11:00+00:00"), "Assessed 4 Nov 2026, 2:41 am IST");
	assert.equal(S.assessedText("2026-11-03 21:11:00"), "Assessed 4 Nov 2026, 2:41 am IST"); // naive = UTC
});

test("missing or bad values give no line", () => {
	assert.equal(S.assessedText(""), "");
	assert.equal(S.assessedText("not a date"), "");
});
