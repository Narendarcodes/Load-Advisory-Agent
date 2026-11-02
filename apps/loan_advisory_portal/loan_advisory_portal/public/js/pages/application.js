/* Application detail: progress, status guidance, decision evidence, documents and history. */
(function () {
	"use strict";

	var Portal = window.Portal;
	var refNode = document.getElementById("application-ref");
	var reference = refNode ? JSON.parse(refNode.textContent) : null;

	var API = {
		get: "loan_advisory_portal.api.applications.get_application",
		decision: "loan_advisory_portal.api.applications.get_decision",
		submit: "loan_advisory_portal.api.applications.submit_application",
		resubmit: "loan_advisory_portal.api.applications.resubmit_application",
		withdraw: "loan_advisory_portal.api.applications.withdraw_application",
	};

	var CLOSED = ["APPROVED", "REJECTED", "WITHDRAWN"];

	var FIELD_LABELS = {
		monthly_income: "monthly income",
		monthly_obligations: "monthly obligations",
		credit_score: "credit score",
		employment_months: "months in current employment",
	};

	function detailRow(label, value) {
		return "<div><dt>" + Portal.esc(label) + "</dt><dd>" + (value || "—") + "</dd></div>";
	}

	function renderHeader(application) {
		// The reference stays on one line ("ACC-" / "LOAP-..." broke at the hyphen on phones).
		document.getElementById("app-title").innerHTML =
			'Application <span class="nowrap">' + Portal.esc(application.name) + "</span>";
		document.getElementById("app-purpose").textContent = application.purpose || "No purpose recorded.";

		var product = application.product || {};
		var bits = []; // the reference is already in the title
		if (product.product_name) bits.push(Portal.esc(product.product_name));
		bits.push("Started " + Portal.esc(Portal.date(application.posting_date)));
		if (application.submitted_at) {
			bits.push("Submitted " + Portal.esc(Portal.date(application.submitted_at)));
		}
		document.getElementById("app-meta").innerHTML = bits
			.map(function (bit) {
				return "<span>" + bit + "</span>";
			})
			.join("");

		document.getElementById("app-badge").innerHTML = Portal.lifecycleBadge(
			application.lifecycle,
			application.decision && application.decision.decision
		);
	}

	/* One sentence says where the application stands; the dated history below shows how it got there. */
	function renderStatusLine(application) {
		var line = document.getElementById("status-line");
		if (!line || !window.PortalStatus) return;
		var status = window.PortalStatus.statusSentence(application, Portal.date);
		var tone = { ok: "badge--ok", bad: "badge--bad", warn: "badge--warn", info: "badge--info" }[status.tone] || "badge--neutral";
		line.innerHTML =
			"<span>" + Portal.esc(status.text) + "</span> " +
			// No "·" separator: the flex gap separates them, so a wrapped line never starts or ends on a lone dot.
			'<span class="badge ' + tone + '">' + Portal.esc(status.outcome) + "</span>";
	}

	function renderActions(application) {
		var host = document.getElementById("app-actions");
		var lifecycle = application.lifecycle || "DRAFT";
		var open = CLOSED.indexOf(lifecycle) === -1;
		var draft = application.docstatus === 0 && lifecycle !== "WITHDRAWN";
		var hasDocuments = (application.documents || []).length > 0;
		var documentsUrl = "/borrower/documents?name=" + encodeURIComponent(application.name);
		var html = "";

		if (draft) {
			html += hasDocuments
				? '<button class="btn" type="button" id="submit-app">Submit application</button>'
				: '<a class="btn" href="' + documentsUrl + '">Add documents to continue</a>';
		}
		if (lifecycle === "INFO_REQUESTED") {
			html += '<a class="btn" href="#info-request">Update details</a>';
		}
		if (lifecycle === "WITHDRAWN" || lifecycle === "REJECTED") {
			html += '<a class="btn btn--ghost" href="/borrower/apply">Start a new application</a>';
		}
		if (open) {
			html += '<button class="btn btn--quiet" type="button" id="withdraw">Withdraw</button>';
		}
		host.innerHTML = html;

		var submit = document.getElementById("submit-app");
		if (submit) submit.addEventListener("click", submitApplication);
		var withdraw = document.getElementById("withdraw");
		if (withdraw) {
			withdraw.addEventListener("click", function () {
				Portal.openDialog(document.getElementById("withdraw-dialog"));
			});
		}
	}

	function renderStatus(application) {
		var lifecycle = application.lifecycle || "DRAFT";
		var guidance = application.guidance || {};
		document.getElementById("status-title").textContent =
			guidance.title || Portal.lifecycleLabel(lifecycle);
		document.getElementById("status-summary").textContent = guidance.summary || "";

		var steps = guidance.next_steps || [];
		var list = document.getElementById("status-steps");
		list.innerHTML = steps
			.map(function (step) {
				return "<li>" + Portal.esc(step) + "</li>";
			})
			.join("");
		list.classList.toggle("hidden", !steps.length);
	}

	function renderSummary(application) {
		var product = application.product || {};
		var rows = [
			detailRow("Amount", Portal.money(application.loan_amount)),
			detailRow("Repayment tenure", Portal.months(application.tenure_months)),
			detailRow("Purpose", Portal.esc(application.purpose || "Not recorded")),
			detailRow("Product", Portal.esc(product.product_name || application.loan_product)),
			detailRow(
				"Interest rate",
				product.rate_of_interest ? Portal.esc(product.rate_of_interest) + "% per year" : null
			),
			detailRow("Started", Portal.esc(Portal.date(application.posting_date))),
			detailRow(
				"Submitted",
				application.submitted_at ? Portal.esc(Portal.date(application.submitted_at)) : "Not submitted yet"
			),
		];
		if (application.policy_version) {
			rows.push(detailRow("Policy version", Portal.esc(application.policy_version)));
		}
		rows.push(detailRow("Applicant", Portal.esc((application.contact && application.contact.name) || "")));
		rows.push(detailRow("Phone", Portal.esc((application.contact && application.contact.phone) || "")));
		document.getElementById("summary").innerHTML = rows.join("");
	}

	function renderDocuments(application) {
		var rows = application.documents || [];
		document.getElementById("doc-count").textContent =
			rows.length + (rows.length === 1 ? " document" : " documents");

		var host = document.getElementById("documents-summary");
		if (!rows.length) {
			host.innerHTML =
				'<p class="small muted">No documents yet. Add at least one before you can submit.</p>';
		} else {
			var shown = rows
				.slice(0, 4)
				.map(function (row) {
					return (
						'<div class="doc-summary__row"><strong>' +
						Portal.esc(row.document_type) +
						"</strong><span>" +
						Portal.esc(row.file_name || "Attached file") +
						"</span></div>"
					);
				})
				.join("");
			if (rows.length > 4) {
				shown +=
					'<p class="tiny muted">And ' + (rows.length - 4) + " more in the document workspace.</p>";
			}
			host.innerHTML = shown;
		}

		var editable = application.docstatus === 0 && application.lifecycle !== "WITHDRAWN";
		document.getElementById("documents-note").textContent = editable
			? "Documents can be added or removed while the application is a draft."
			: "Documents are locked now that the application has been submitted.";
		document.getElementById("documents-link").textContent = editable
			? "Open document workspace"
			: "View documents";
	}

	function renderTimeline(application) {
		var host = document.getElementById("timeline");
		var items = window.PortalStatus ? window.PortalStatus.historyItems(application.timeline || []) : [];
		if (!items.length) {
			host.innerHTML = '<li class="muted small">No history recorded yet.</li>';
			return;
		}
		host.innerHTML = items
			.map(function (item) {
				return (
					"<li" + (item.current ? ' aria-current="step"' : "") + ">" +
					'<time datetime="' + Portal.esc(item.at) + '">' + Portal.esc(Portal.date(item.at)) + "</time>" +
					"<span>" + Portal.esc(item.label) +
					(item.current ? '<span class="history-list__now">Now</span>' : "") +
					"</span></li>"
				);
			})
			.join("");
	}

	function unavailableCopy(lifecycle) {
		var copy = {
			DRAFT: "No assessment yet. Submit the application to start the checks.",
			SUBMITTED: "The checks have been queued. The outcome and its reasons appear here when they finish.",
			UNDER_REVIEW: "The checks are running. Nothing is needed from you right now.",
			INFO_REQUESTED: "The checks need corrected information before an outcome can be recorded.",
			MANUAL_REVIEW: "A person is reviewing this application. The outcome appears here when it is recorded.",
			APPROVED:
				"The application was approved, but no decision record is attached. Contact your loan advisor for the details.",
			REJECTED:
				"The application was not approved, but no decision record is attached. Contact your loan advisor for the details.",
			WITHDRAWN: "No decision was made because this application was withdrawn.",
		};
		var art = {
			SUBMITTED: "submitted",
			UNDER_REVIEW: "processing",
			MANUAL_REVIEW: "processing",
			INFO_REQUESTED: "missing-info",
		}[lifecycle] || "assessment-pending";
		return (
			'<div class="empty empty--compact decision-pending">' +
			'<img class="empty__art" src="/assets/loan_advisory_portal/illustrations/' + art + '.svg" alt="" width="180" height="135">' +
			"<h3>Assessment not yet available</h3>" +
			'<p class="small muted">' + Portal.esc(copy[lifecycle] || "No assessment has been recorded for this application.") + "</p>" +
			"</div>"
		);
	}

	function outcomeHeadline(decision) {
		if (decision.decision === "APPROVED") return "Your application was approved";
		if (decision.decision === "REJECTED") return "Your application was not approved";
		return "No outcome has been recorded yet";
	}

	function decisionBadge(decision) {
		if (decision.decision === "APPROVED") return '<span class="badge badge--ok">Approved</span>';
		if (decision.decision === "REJECTED") return '<span class="badge badge--bad">Not approved</span>';
		return '<span class="badge badge--warn">No outcome recorded</span>';
	}

	function missingFields(fields) {
		return (fields || []).map(function (field) {
			return FIELD_LABELS[field] || String(field).replace(/_/g, " ");
		});
	}

	function renderDecision(decision, application) {
		var host = document.getElementById("decision");
		if (!decision || !decision.available) {
			host.innerHTML = unavailableCopy(application.lifecycle || "DRAFT");
			return;
		}

		var parts = [];
		parts.push(
			'<div class="decision-intro decision-outcome">' +
				'<img class="decision-outcome__art" src="/assets/loan_advisory_portal/illustrations/decision.svg" alt="" width="120" height="90">' +
				'<div><p class="decision-outcome__title">' + Portal.esc(outcomeHeadline(decision)) + "</p>" +
				decisionBadge(decision) +
				"</div></div>"
		);

		if (decision.provider_error) {
			parts.push(
				'<div class="status-block status-block--info mt"><span class="status-block__mark" aria-hidden="true">i</span>' +
					'<div class="status-block__body"><strong>No decision has been made</strong>' +
					'<span class="small">We could not complete the credit check for this application. It stays open; contact your loan advisor if you need an update.</span></div></div>'
			);
		}

		if (decision.information_needed) {
			var missing = missingFields(decision.missing_fields);
			parts.push(
				'<div class="status-block status-block--warn mt"><span class="status-block__mark" aria-hidden="true">!</span>' +
					'<div class="status-block__body"><strong>More information is needed</strong>' +
					'<span class="small">' +
					(missing.length
						? "Correct: " + Portal.esc(missing.join(", ")) + "."
						: "Correct the details listed for this application.") +
					'</span><a class="small" href="#info-request">Update the application</a></div></div>'
			);
		}

		var reasons = decision.reasons || [];
		if (reasons.length) {
			parts.push(
				'<div class="mt"><h3>Why</h3><ul class="decision-reasons mt">' +
					reasons
						.map(function (reason) {
							return "<li>" + Portal.esc(reason.text || reason.code) + "</li>";
						})
						.join("") +
					"</ul></div>"
			);
		} else if (decision.decision === "REJECTED") {
			parts.push(
				'<p class="small muted mt">The recorded decision did not include written reasons. Your loan advisor can discuss it with you.</p>'
			);
		}

		if (decision.decision === "APPROVED") {
			parts.push(
				'<p class="small mt">The application met the lending policy. Your loan advisor can explain what happens next.</p>'
			);
		} else if (decision.decision === "REJECTED") {
			parts.push(
				'<p class="small mt">If your circumstances change, you can <a href="/borrower/apply">start a new application</a>. Your loan advisor can talk the decision through with you.</p>'
			);
		}

		if (decision.simulation) {
			parts.push(
				'<p class="tiny muted mt">This was a what-if estimate, not a decision on your application.</p>'
			);
		}

		parts.push(
			'<div class="decision-next mt"><h3>What you can do next</h3><div class="form-actions">' +
				'<a class="btn btn--sm" href="/borrower/assistant?application=' + encodeURIComponent(application.name) + '">Ask the assistant about this</a>' +
				'<a class="btn btn--ghost btn--sm" href="/borrower/feedback?application=' + encodeURIComponent(application.name) + '">Talk to a person</a>' +
				"</div></div>"
		);

		var meta = [];
		if (decision.evaluated_at) meta.push("Assessed " + Portal.esc(Portal.date(decision.evaluated_at)));
		if (decision.policy_version) meta.push("Policy version " + Portal.esc(decision.policy_version));
		if (meta.length) {
			parts.push(
				'<div class="decision-meta">' +
					meta
						.map(function (entry) {
							return "<span>" + entry + "</span>";
						})
						.join("") +
					"</div>"
			);
		}

		host.innerHTML = parts.join("");
	}

	function renderInfoRequest(application) {
		var panel = document.getElementById("info-request");
		var open = application.lifecycle === "INFO_REQUESTED";
		panel.classList.toggle("hidden", !open);
		if (!open) return;

		var inputs = application.inputs || {};
		[
			["resubmit-income", inputs.monthly_income],
			["resubmit-obligations", inputs.monthly_obligations],
			["resubmit-credit", inputs.credit_score],
			["resubmit-employment", inputs.employment_months],
		].forEach(function (entry) {
			document.getElementById(entry[0]).value =
				entry[1] === null || entry[1] === undefined ? "" : entry[1];
		});
	}

	function showResubmitError(text) {
		var error = document.getElementById("resubmit-error");
		error.textContent = text;
		error.classList.toggle("hidden", !text);
	}

	function inputNumber(id) {
		var value = document.getElementById(id).value.trim();
		return value === "" ? null : Number(value);
	}

	async function submitApplication() {
		var button = document.getElementById("submit-app");
		Portal.busy(button, true, "Submitting…");
		try {
			await Portal.call(API.submit, { application: reference });
			Portal.flash(
				"success",
				"Application submitted",
				"The outcome and its reasons appear here when the checks finish."
			);
			await reload();
		} catch (error) {
			if (error.status === 401 || error.status === 403) return;
			Portal.busy(button, false);
			Portal.flash("error", "Could not submit", error.message);
		}
	}

	async function resubmitApplication() {
		var button = document.getElementById("resubmit-button");
		var income = inputNumber("resubmit-income");
		var obligations = inputNumber("resubmit-obligations");
		var credit = inputNumber("resubmit-credit");
		var months = inputNumber("resubmit-employment");

		var problem = null;
		if (income === null || !isFinite(income) || income < 0) {
			problem = "Enter your monthly income as a number.";
		} else if (obligations === null || !isFinite(obligations) || obligations < 0) {
			problem = "Enter your monthly obligations as a number.";
		} else if (credit !== null && (!isFinite(credit) || credit < 300 || credit > 900)) {
			problem = "A credit score is between 300 and 900.";
		} else if (months !== null && (!isFinite(months) || months < 0 || months > 720)) {
			problem = "Months in employment must be between 0 and 720.";
		}
		if (problem) {
			showResubmitError(problem);
			return;
		}
		showResubmitError("");

		Portal.busy(button, true, "Resubmitting…");
		try {
			await Portal.call(API.resubmit, {
				application: reference,
				monthly_income: income,
				monthly_obligations: obligations,
				credit_score: credit,
				employment_months: months,
			});
			Portal.flash("success", "Application resubmitted", "We will review it again.");
			await reload();
		} catch (error) {
			if (error.status === 401 || error.status === 403) return;
			showResubmitError(error.message);
		} finally {
			Portal.busy(button, false);
		}
	}

	async function withdrawApplication() {
		var button = document.getElementById("withdraw-confirm");
		Portal.busy(button, true, "Withdrawing…");
		try {
			await Portal.call(API.withdraw, { application: reference });
			Portal.closeDialog(document.getElementById("withdraw-dialog"));
			Portal.flash("success", "Application withdrawn", "You can start a new application whenever you need one.");
			await reload();
		} catch (error) {
			if (error.status === 401 || error.status === 403) return;
			Portal.flash("error", "Could not withdraw", error.message);
		} finally {
			Portal.busy(button, false);
		}
	}

	async function reload() {
		var results = await Promise.all([
			Portal.call(API.get, { application: reference }),
			Portal.call(API.decision, { application: reference }),
		]);
		var application = results[0];
		renderHeader(application);
		renderStatusLine(application);
		renderStatus(application);
		renderActions(application);
		renderSummary(application);
		renderDocuments(application);
		renderTimeline(application);
		renderInfoRequest(application);
		renderDecision(results[1], application);
		document.getElementById("page-error").classList.add("hidden");
	}

	function showLoadError(error) {
		document.getElementById("page-error-text").textContent = error.message;
		document.getElementById("page-error").classList.remove("hidden");
		document.getElementById("status-title").textContent = "This application could not be loaded";
		document.getElementById("status-summary").textContent = "";
		document.getElementById("decision").innerHTML =
			'<p class="small">' + Portal.esc(error.message) + "</p>";
	}

	async function start() {
		if (!reference) return;
		try {
			await reload();
		} catch (error) {
			if (error.status === 401 || error.status === 403) return;
			showLoadError(error);
		}
	}

	document.getElementById("page-retry").addEventListener("click", start);
	document.getElementById("resubmit-button").addEventListener("click", resubmitApplication);
	document.getElementById("withdraw-cancel").addEventListener("click", function () {
		Portal.closeDialog(document.getElementById("withdraw-dialog"));
	});
	document.getElementById("withdraw-confirm").addEventListener("click", withdrawApplication);

	start();
})();
