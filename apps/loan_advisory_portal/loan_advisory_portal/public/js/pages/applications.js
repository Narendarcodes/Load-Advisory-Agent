/* Dashboard: at-a-glance counts, the application list and the next best action. */
(function () {
	"use strict";

	var Portal = window.Portal;
	var host = document.getElementById("applications");
	if (!host) return;

	var API = {
		me: "loan_advisory_portal.api.session.me",
		list: "loan_advisory_portal.api.applications.list_applications",
	};

	var NEXT_STEP = {
		DRAFT: {
			title: "Finish your draft",
			body: "Add at least one document, then submit the application for checks.",
			label: "Open application",
		},
		SUBMITTED: {
			title: "We have your application",
			body: "It is queued for checks. The decision and its reasons will appear here.",
			label: "View application",
		},
		UNDER_REVIEW: {
			title: "Your application is being reviewed",
			body: "Nothing is needed from you right now. We will show the decision here.",
			label: "View application",
		},
		INFO_REQUESTED: {
			title: "We need a little more information",
			body: "Some details could not be verified. Update them and resubmit.",
			label: "Update application",
		},
		MANUAL_REVIEW: {
			title: "A person is reviewing your case",
			body: "It has been passed to a reviewer. You do not need to do anything.",
			label: "View application",
		},
		APPROVED: {
			title: "Your application was approved",
			body: "Read the outcome and the reasons that shaped it.",
			label: "View decision",
		},
		REJECTED: {
			title: "Your application was not approved",
			body: "Read the reasons that applied and the options available to you.",
			label: "Read the decision",
		},
		WITHDRAWN: {
			title: "This application was withdrawn",
			body: "Start a new application when you are ready.",
			label: "Start an application",
		},
	};

	function applicationUrl(application) {
		return "/borrower/application?name=" + encodeURIComponent(application.name);
	}

	function renderStats(me, applications) {
		var completion = me && me.borrower ? me.borrower.profile_completion : null;
		var completionNode = document.querySelector('[data-stat="completion"]');
		if (completionNode) {
			completionNode.textContent =
				completion === null || completion === undefined ? "—" : Math.round(completion) + "%";
		}

		var countNode = document.querySelector('[data-stat="count"]');
		if (countNode) countNode.textContent = String(applications.length);

		var latestNode = document.querySelector('[data-stat="latest"]');
		if (latestNode) {
			if (!applications.length) {
				latestNode.textContent = "Not started";
			} else {
				var latest = applications[0];
				latestNode.innerHTML = Portal.lifecycleBadge(
					latest.lifecycle,
					latest.decision && latest.decision.decision
				);
			}
		}
	}

	function renderTable(applications) {
		if (!applications.length) {
			host.innerHTML =
				'<div class="empty">' +
				'<span class="empty__mark" aria-hidden="true">AP</span>' +
				"<h2>No applications yet</h2>" +
				"<p>When you start an application it appears here, with its status, documents and the reasons behind any decision.</p>" +
				'<a class="btn" href="/borrower/apply">Start an application</a>' +
				"</div>";
			return;
		}

		var rows = applications
			.map(function (application) {
				var decision = application.decision && application.decision.decision;
				return (
					"<tr>" +
					'<td data-label="Application"><span class="cell-title">' +
					Portal.esc(application.name) +
					'</span><span class="sub">Term loan</span></td>' +
					'<td data-label="Amount">' +
					Portal.money(application.loan_amount) +
					'<span class="sub">' +
					Portal.months(application.tenure_months) +
					"</span></td>" +
					'<td data-label="Purpose">' +
					Portal.esc(application.purpose || "Not recorded") +
					"</td>" +
					'<td data-label="Started">' +
					Portal.esc(Portal.date(application.posting_date)) +
					"</td>" +
					'<td data-label="Status">' +
					Portal.lifecycleBadge(application.lifecycle, decision) +
					"</td>" +
					'<td data-label="Action"><a class="btn btn--ghost btn--sm" href="' +
					applicationUrl(application) +
					'">View</a></td>' +
					"</tr>"
				);
			})
			.join("");

		host.innerHTML =
			'<div class="table-wrap table-wrap--stack">' +
			'<table><caption class="sr-only">Your applications, newest first</caption>' +
			'<thead><tr><th scope="col">Application</th><th scope="col">Amount</th><th scope="col">Purpose</th><th scope="col">Started</th><th scope="col">Status</th><th scope="col">Action</th></tr></thead>' +
			"<tbody>" +
			rows +
			"</tbody></table></div>";
	}

	function renderNextStep(applications) {
		var title = document.getElementById("next-step-heading");
		var body = document.getElementById("next-step-body");
		var action = document.getElementById("next-step-action");
		if (!title || !body || !action) return;

		if (!applications.length) {
			title.textContent = "Start with a quick check";
			body.textContent =
				"See an indicative amount before you fill in a full application. It does not affect your credit score.";
			action.innerHTML =
				'<a class="btn btn--sm" href="/borrower/eligibility">Check eligibility</a> ' +
				'<a class="btn btn--ghost btn--sm" href="/borrower/apply">Start an application</a>';
			return;
		}

		var latest = applications[0];
		var step = NEXT_STEP[latest.lifecycle] || NEXT_STEP.DRAFT;
		title.textContent = step.title;
		body.textContent = step.body;
		var href = latest.lifecycle === "WITHDRAWN" ? "/borrower/apply" : applicationUrl(latest);
		action.innerHTML = '<a class="btn btn--sm" href="' + href + '">' + Portal.esc(step.label) + "</a>";
	}

	function renderActiveLoan() {
		var card = document.getElementById("active-loan");
		if (card && Portal.boot.demo) card.classList.remove("hidden");
	}

	async function start() {
		try {
			var results = await Promise.all([Portal.call(API.me), Portal.call(API.list)]);
			var me = results[0];
			var applications = results[1] || [];
			renderStats(me, applications);
			renderTable(applications);
			renderNextStep(applications);
			renderActiveLoan();
		} catch (error) {
			if (error.status === 401 || error.status === 403) return;
			host.innerHTML =
				'<div class="empty empty--compact">' +
				"<h2>We could not load your applications</h2>" +
				"<p>" +
				Portal.esc(error.message) +
				"</p>" +
				'<button class="btn btn--ghost btn--sm" type="button" id="retry-applications">Try again</button>' +
				"</div>";
			var retry = document.getElementById("retry-applications");
			if (retry) retry.addEventListener("click", start);
		}
	}

	start();
})();
