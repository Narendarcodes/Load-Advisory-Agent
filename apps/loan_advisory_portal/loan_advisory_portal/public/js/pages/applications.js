/* Borrower dashboard: at-a-glance stats and the application list. */
(function () {
	"use strict";

	var Portal = window.Portal;

	function stat(name, value) {
		var node = document.querySelector("[data-stat='" + name + "']");
		if (node) node.textContent = value;
	}

	function renderStats(me, applications) {
		var completion = me && me.borrower ? Number(me.borrower.profile_completion || 0) : 0;
		stat("completion", completion + "%");
		stat("count", String(applications.length));
		var latest = applications[0];
		var node = document.querySelector("[data-stat='latest']");
		if (node) {
			node.innerHTML = latest
				? Portal.lifecycleBadge(latest.lifecycle, latest.decision && latest.decision.decision)
				: "No applications";
		}
	}

	function row(application) {
		var href = "/borrower/application?name=" + encodeURIComponent(application.name);
		var title = application.purpose || "Loan application";
		var submitted = application.submitted_at
			? "Submitted " + Portal.date(application.submitted_at)
			: "Not submitted";
		return (
			"<tr>" +
			"<td><a href=\"" + href + "\">" + Portal.esc(title) + "</a>" +
			"<span class=\"sub\">" + Portal.esc(application.name) + " · started " + Portal.esc(Portal.date(application.posting_date)) + "</span></td>" +
			"<td>" + Portal.esc(Portal.money(application.loan_amount)) +
			"<span class=\"sub\">" + Portal.esc(Portal.months(application.tenure_months)) + "</span></td>" +
			"<td>" + Portal.lifecycleBadge(application.lifecycle, application.decision && application.decision.decision) + "</td>" +
			"<td class=\"small muted\">" + Portal.esc(submitted) + "</td>" +
			"</tr>"
		);
	}

	function renderList(applications) {
		var host = document.getElementById("applications");
		if (!applications.length) {
			host.innerHTML =
				"<div class=\"empty\">" +
				"<h2>No applications yet</h2>" +
				"<p>When you apply, its progress, documents and the reasoning behind each decision appear here.</p>" +
				"<a class=\"btn\" href=\"/borrower/apply\">Start an application</a>" +
				"</div>";
			return;
		}
		host.innerHTML =
			"<div class=\"table-wrap\">" +
			"<table><caption>Newest first</caption>" +
			"<thead><tr><th scope=\"col\">Application</th><th scope=\"col\">Amount</th><th scope=\"col\">Status</th><th scope=\"col\">Submitted</th></tr></thead>" +
			"<tbody>" + applications.map(row).join("") + "</tbody></table></div>";
	}

	async function load() {
		var host = document.getElementById("applications");
		try {
			var results = await Promise.all([
				Portal.call("loan_advisory_portal.api.session.me"),
				Portal.call("loan_advisory_portal.api.applications.list_applications"),
			]);
			renderStats(results[0], results[1]);
			renderList(results[1]);
		} catch (error) {
			if (error.status === 401 || error.status === 403) return;
			host.innerHTML =
				"<div class=\"alert alert--error\" role=\"alert\"><strong>We could not load your applications</strong>" +
				"<span>" + Portal.esc(error.message) + "</span></div>";
		}
	}

	load();
})();
