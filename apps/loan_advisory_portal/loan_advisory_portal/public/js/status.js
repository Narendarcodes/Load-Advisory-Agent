/* Status sentence and dated history for an application (replaces the four-dot progress line).
   Pure functions; the page passes its own date formatter. Loaded in the browser as window.PortalStatus
   and in node tests through module.exports. */
(function (root) {
	"use strict";

	var STATES = {
		DRAFT: { lead: "Draft started on", outcome: "Not submitted yet", tone: "neutral", from: "posting" },
		SUBMITTED: { lead: "Submitted on", outcome: "Waiting for checks", tone: "info", from: "submitted" },
		UNDER_REVIEW: { lead: "Checks running since", outcome: "Nothing needed from you", tone: "info" },
		INFO_REQUESTED: { lead: "Information requested on", outcome: "Update your details", tone: "warn" },
		MANUAL_REVIEW: { lead: "With a reviewer since", outcome: "A person is reviewing it", tone: "warn" },
		APPROVED: { lead: "Decision recorded on", outcome: "Approved", tone: "ok", decided: true },
		REJECTED: { lead: "Decision recorded on", outcome: "Not approved", tone: "bad", decided: true },
		WITHDRAWN: { lead: "Withdrawn on", outcome: "Closed", tone: "neutral" },
	};

	var EVALUATED = {
		APPROVED: "Checks finished: approved",
		REJECTED: "Checks finished: not approved",
		REVIEW: "Checks finished: needs a person's review",
		ERROR: "Checks could not finish",
	};

	function humanise(code) {
		var words = String(code || "").toLowerCase().replace(/_/g, " ").trim();
		return words ? words.charAt(0).toUpperCase() + words.slice(1) : "";
	}

	function newest(timeline) {
		return timeline && timeline.length ? timeline[timeline.length - 1].at : null;
	}

	/* The decision date is the evaluation entry when there is one, else the newest entry. */
	function decidedAt(timeline) {
		for (var index = (timeline || []).length - 1; index >= 0; index -= 1) {
			if (/^Evaluated \(/.test(timeline[index].event || "")) return timeline[index].at;
		}
		return newest(timeline);
	}

	function statusSentence(application, formatDate) {
		var lifecycle = application.lifecycle || "DRAFT";
		var timeline = application.timeline || [];
		var state = STATES[lifecycle];
		if (!state) {
			var last = newest(timeline);
			return { text: last ? "Last update on " + formatDate(last) : "Status recorded", outcome: humanise(lifecycle), tone: "neutral" };
		}
		var at;
		if (state.decided) at = decidedAt(timeline);
		else if (state.from === "posting") at = application.posting_date || newest(timeline);
		else if (state.from === "submitted") at = application.submitted_at || newest(timeline);
		else at = newest(timeline);
		at = at || application.submitted_at || application.posting_date;
		var text = at ? state.lead + " " + formatDate(at) : state.bare || state.lead.replace(/ (on|since)$/, "");
		return { text: text, outcome: state.outcome, tone: state.tone };
	}

	/* Raw engine text never reaches the history: a digit, a rule id, a cut-off or a score makes it a plain label. */
	var RAW = /\d|cibil|foir|threshold|cut-?off|\bPL-|score/i;
	function plainEvent(event) {
		var text = String(event || "").trim();
		if (!text) return "Update";
		return RAW.test(text) ? "Update recorded" : text;
	}

	function historyItems(timeline) {
		var rows = timeline || [];
		return rows.map(function (entry, index) {
			var match = /^Evaluated \(([A-Z_]+)\)$/.exec(entry.event || "");
			var label = match ? EVALUATED[match[1]] || "Checks finished" : plainEvent(entry.event);
			return { label: label, at: entry.at, current: index === rows.length - 1 };
		});
	}

	var api = { statusSentence: statusSentence, historyItems: historyItems };
	if (typeof module === "object" && module.exports) module.exports = api;
	else root.PortalStatus = api;
})(this);
