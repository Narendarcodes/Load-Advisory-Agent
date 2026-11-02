// node --test tests/js/portal_status.test.cjs
// The status sentence and dated history that replace the Started -> Submitted -> Checks -> Outcome dots.
const test = require("node:test");
const assert = require("node:assert/strict");
const S = require("../../apps/loan_advisory_portal/loan_advisory_portal/public/js/status.js");

const date = (value) => (value ? `D(${String(value).slice(0, 10)})` : "");

const REJECTED = {
	lifecycle: "REJECTED",
	decision: { decision: "REJECTED" },
	posting_date: "2026-10-22",
	submitted_at: "2026-10-22 10:00:00",
	timeline: [
		{ at: "2026-10-22 09:00:00", event: "Started" },
		{ at: "2026-10-22 10:00:00", event: "Submitted" },
		{ at: "2026-10-22 14:30:00", event: "Evaluated (REJECTED)", policy_version: "synthetic-2026.1" },
		{ at: "2026-10-22 14:30:01", event: "Not approved", state: "REJECTED" },
	],
};

test("a decided application says when the decision was recorded and what it was", () => {
	assert.deepEqual(S.statusSentence(REJECTED, date), {
		text: "Decision recorded on D(2026-10-22)",
		outcome: "Not approved",
		tone: "bad",
	});
	const approved = { ...REJECTED, lifecycle: "APPROVED", decision: { decision: "APPROVED" } };
	assert.equal(S.statusSentence(approved, date).outcome, "Approved");
});

test("open states name what is happening and since when, from the newest history entry", () => {
	const submitted = { lifecycle: "SUBMITTED", posting_date: "2026-10-30", submitted_at: "2026-10-30 11:00:00", timeline: [
		{ at: "2026-10-30 09:00:00", event: "Started" }, { at: "2026-10-30 11:00:00", event: "Submitted" }] };
	assert.deepEqual(S.statusSentence(submitted, date), { text: "Submitted on D(2026-10-30)", outcome: "Waiting for checks", tone: "info" });
	const info = { lifecycle: "INFO_REQUESTED", timeline: [{ at: "2026-10-12 08:00:00", event: "Information requested" }] };
	assert.deepEqual(S.statusSentence(info, date), { text: "Information requested on D(2026-10-12)", outcome: "Update your details", tone: "warn" });
	const draft = { lifecycle: "DRAFT", posting_date: "2026-11-01", timeline: [] };
	assert.deepEqual(S.statusSentence(draft, date), { text: "Draft started on D(2026-11-01)", outcome: "Not submitted yet", tone: "neutral" });
});

test("a list row without history falls back to its own dates and never prints an empty date", () => {
	const row = { lifecycle: "REJECTED", posting_date: "2026-10-22", submitted_at: null };
	assert.equal(S.statusSentence(row, date).text, "Decision recorded on D(2026-10-22)");
	assert.equal(S.statusSentence({ lifecycle: "UNDER_REVIEW" }, date).text, "Checks running");
});

test("an unknown state is shown as recorded, never guessed", () => {
	const odd = { lifecycle: "SOMETHING_NEW", timeline: [{ at: "2026-10-01 00:00:00", event: "x" }] };
	assert.deepEqual(S.statusSentence(odd, date), { text: "Last update on D(2026-10-01)", outcome: "Something new", tone: "neutral" });
});

test("history is dated, in borrower words, and marks only the newest entry as current", () => {
	const items = S.historyItems(REJECTED.timeline);
	assert.deepEqual(items.map((i) => i.label), ["Started", "Submitted", "Checks finished: not approved", "Not approved"]);
	assert.deepEqual(items.map((i) => i.current), [false, false, false, true]);
	assert.equal(items[2].at, "2026-10-22 14:30:00");
	assert.deepEqual(S.historyItems([]), []);
	assert.equal(S.historyItems([{ at: "x", event: "Evaluated (ERROR)" }])[0].label, "Checks could not finish");
	assert.equal(S.historyItems([{ at: "x", event: "Evaluated (REVIEW)" }])[0].label, "Checks finished: needs a person's review");
});
