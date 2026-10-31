/* Application detail: summary, documents, decision reasoning and timeline. */
(function () {
	"use strict";

	var Portal = window.Portal;
	var refNode = document.getElementById("application-ref");
	var reference = refNode ? JSON.parse(refNode.textContent) : null;

	var API = {
		get: "loan_advisory_portal.api.applications.get_application",
		decision: "loan_advisory_portal.api.applications.get_decision",
		documentTypes: "loan_advisory_portal.api.documents.list_document_types",
		attach: "loan_advisory_portal.api.documents.attach_document",
		remove: "loan_advisory_portal.api.documents.remove_document",
		submit: "loan_advisory_portal.api.applications.submit_application",
		resubmit: "loan_advisory_portal.api.applications.resubmit_application",
		withdraw: "loan_advisory_portal.api.applications.withdraw_application",
		download: "/api/method/loan_advisory_portal.api.documents.download_document",
	};

	var CLOSED = ["APPROVED", "REJECTED", "WITHDRAWN"];

	function detailRow(label, value) {
		return "<div><dt>" + Portal.esc(label) + "</dt><dd>" + (value || "—") + "</dd></div>";
	}

	function renderHeader(application) {
		document.getElementById("app-title").textContent = "Application " + application.name;
		document.getElementById("app-purpose").textContent = application.purpose || "No purpose recorded.";
		document.getElementById("app-badge").innerHTML = Portal.lifecycleBadge(
			application.lifecycle,
			application.decision && application.decision.decision
		);
	}

	function renderSummary(application) {
		var product = application.product || {};
		var rows = [
			detailRow("Amount", Portal.money(application.loan_amount)),
			detailRow("Repayment tenure", Portal.months(application.tenure_months)),
			detailRow("Purpose", Portal.esc(application.purpose)),
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
			detailRow("Policy version", Portal.esc(application.policy_version || "—")),
			detailRow("Applicant", Portal.esc((application.contact && application.contact.name) || "")),
			detailRow("Phone", Portal.esc((application.contact && application.contact.phone) || "")),
		];
		document.getElementById("summary").innerHTML = rows.join("");
	}

	function renderStatusHelp(application) {
		var host = document.getElementById("status-help");
		var guidance = application.guidance;
		if (!guidance) {
			host.innerHTML = "";
			return;
		}
		var steps = (guidance.next_steps || [])
			.map(function (step) {
				return "<li>" + Portal.esc(step) + "</li>";
			})
			.join("");
		host.innerHTML =
			"<p><strong>" + Portal.esc(guidance.title) + "</strong></p>" +
			"<p class=\"small muted\">" + Portal.esc(guidance.summary) + "</p>" +
			(steps ? "<ul class=\"small\">" + steps + "</ul>" : "");
	}

	function renderActions(application) {
		var host = document.getElementById("app-actions");
		var draft = application.docstatus === 0 && application.lifecycle !== "WITHDRAWN";
		var open = CLOSED.indexOf(application.lifecycle) === -1;
		var html = "";

		if (draft) {
			var hasDocuments = (application.documents || []).length > 0;
			html +=
				"<button class=\"btn\" type=\"button\" id=\"submit-app\"" +
				(hasDocuments ? "" : " disabled title=\"Add at least one document first\"") +
				">Submit application</button>";
		}
		if (open) {
			html += "<button class=\"btn btn--danger\" type=\"button\" id=\"withdraw\">Withdraw</button>";
		}
		html += "<a class=\"btn btn--ghost\" href=\"/borrower/feedback\">Give feedback</a>";
		host.innerHTML = html;

		var submit = document.getElementById("submit-app");
		if (submit) submit.addEventListener("click", submitApplication);
		var withdraw = document.getElementById("withdraw");
		if (withdraw) withdraw.addEventListener("click", function () {
			document.getElementById("withdraw-panel").classList.remove("hidden");
			document.getElementById("withdraw-confirm").focus();
		});
	}

	function renderInfoRequest(application) {
		var panel = document.getElementById("info-request");
		var open = application.lifecycle === "INFO_REQUESTED";
		panel.classList.toggle("hidden", !open);
		if (!open) return;
		var inputs = application.inputs || {};
		document.getElementById("resubmit-income").value =
			inputs.monthly_income === null || inputs.monthly_income === undefined ? "" : inputs.monthly_income;
		document.getElementById("resubmit-obligations").value =
			inputs.monthly_obligations === null || inputs.monthly_obligations === undefined
				? ""
				: inputs.monthly_obligations;
		document.getElementById("resubmit-credit").value =
			inputs.credit_score === null || inputs.credit_score === undefined ? "" : inputs.credit_score;
		document.getElementById("resubmit-employment").value =
			inputs.employment_months === null || inputs.employment_months === undefined
				? ""
				: inputs.employment_months;
	}

	function renderDocuments(application) {
		var host = document.getElementById("documents");
		var rows = application.documents || [];
		if (!rows.length) {
			host.innerHTML =
				"<p class=\"muted small\">No documents yet. Add at least one so the application can be submitted.</p>";
		} else {
			var editable = application.docstatus === 0;
			host.innerHTML =
				"<div class=\"table-wrap\"><table><caption>Private to you and the review team</caption>" +
				"<thead><tr><th scope=\"col\">Type</th><th scope=\"col\">File</th><th scope=\"col\">Actions</th></tr></thead><tbody>" +
				rows
					.map(function (row) {
						var download =
							"<a class=\"btn btn--quiet btn--sm\" href=\"" +
							API.download +
							"?application=" + encodeURIComponent(application.name) +
							"&row=" + encodeURIComponent(row.row) +
							"\">Download</a>";
						var remove = editable
							? "<button class=\"btn btn--quiet btn--sm\" type=\"button\" data-remove=\"" +
							  Portal.esc(row.row) + "\">Remove</button>"
							: "";
						return (
							"<tr><td>" + Portal.esc(row.document_type) + "</td>" +
							"<td>" + Portal.esc(row.file_name || "Attached file") + "</td>" +
							"<td class=\"row\">" + download + remove + "</td></tr>"
						);
					})
					.join("") +
				"</tbody></table></div>";

			host.querySelectorAll("[data-remove]").forEach(function (button) {
				button.addEventListener("click", function () {
					removeDocument(button.dataset.remove);
				});
			});
		}

		var form = document.getElementById("upload-form");
		form.classList.toggle("hidden", application.docstatus !== 0 || rows.length >= 12);
	}

	function renderUploadTypes(types) {
		var select = document.getElementById("document-type");
		select.innerHTML =
			"<option value=\"\">Choose a document type</option>" +
			types
				.map(function (type) {
					return "<option value=\"" + Portal.esc(type.name) + "\">" + Portal.esc(type.loan_document_type) + "</option>";
				})
				.join("");
	}

	function renderTimeline(application) {
		var events = application.timeline || [];
		var host = document.getElementById("timeline");
		host.innerHTML = events
			.map(function (event) {
				var extra = event.policy_version ? " · policy " + Portal.esc(event.policy_version) : "";
				return (
					"<li><strong>" + Portal.esc(event.event) + "</strong>" +
					"<span class=\"when\">" + Portal.esc(Portal.date(event.at)) + extra + "</span></li>"
				);
			})
			.join("");
	}

	function renderDecision(decision) {
		var host = document.getElementById("decision");
		if (!decision || !decision.available) {
			host.innerHTML =
				"<p class=\"muted small\">No assessment yet. Once your application has been reviewed, the reasoning appears here.</p>";
			return;
		}

		var badge =
			decision.decision === "APPROVED"
				? '<span class="badge badge--pass">Approved</span>'
				: decision.decision === "REJECTED"
				? '<span class="badge badge--fail">Not approved</span>'
				: '<span class="badge badge--warn">No decision yet</span>';

		var parts = [];
		parts.push("<p>" + badge + "</p>");

		if (decision.provider_error) {
			parts.push(
				"<p class=\"small mt\">We could not complete the credit check, so no decision has been made. The team has been notified and will try again.</p>"
			);
		} else if (decision.information_needed) {
			parts.push("<p class=\"small mt\">We need a little more information before this can be assessed.</p>");
		}

		if (decision.missing_fields && decision.missing_fields.length) {
			parts.push(
				"<p class=\"small mt\">Missing: <strong>" +
					Portal.esc(decision.missing_fields.join(", ").replace(/_/g, " ")) +
					"</strong>. <a href=\"#info-request\">Update the application</a>.</p>"
			);
		}

		if (decision.reasons && decision.reasons.length) {
			parts.push(
				"<div class=\"mt\"><h3>What affected this outcome</h3><ul class=\"small\">" +
					decision.reasons
						.map(function (reason) {
							return "<li>" + Portal.esc(reason.text || reason.code) + "</li>";
						})
						.join("") +
					"</ul></div>"
			);
		}

		if (decision.decision === "REJECTED") {
			parts.push(
				"<p class=\"small mt\">If your circumstances change, you can <a href=\"/borrower/apply\">start a new application</a>. Your loan advisor can talk the decision through with you.</p>"
			);
		}

		if (decision.evaluated_at) {
			parts.push(
				"<p class=\"tiny muted mt\">Assessed " + Portal.esc(Portal.date(decision.evaluated_at)) +
					(decision.policy_version ? " · policy version " + Portal.esc(decision.policy_version) : "") +
					"</p>"
			);
		}

		if (decision.simulation) {
			parts.push(
				"<p class=\"tiny muted\">This was a what-if estimate, not a decision on your application.</p>"
			);
		}

		host.innerHTML = parts.join("");
	}

	async function reload() {
		var results = await Promise.all([
			Portal.call(API.get, { application: reference }),
			Portal.call(API.decision, { application: reference }),
		]);
		var application = results[0];
		renderHeader(application);
		renderSummary(application);
		renderStatusHelp(application);
		renderActions(application);
		renderInfoRequest(application);
		renderDocuments(application);
		renderTimeline(application);
		renderDecision(results[1]);
	}

	async function submitApplication() {
		var button = document.getElementById("submit-app");
		Portal.busy(button, true, "Submitting…");
		try {
			await Portal.call(API.submit, { application: reference });
			Portal.flash("success", "Application submitted", "We will let you know when there is a decision.");
			await reload();
		} catch (error) {
			if (error.status === 401 || error.status === 403) return;
			Portal.busy(button, false);
			Portal.flash("error", "Could not submit", error.message);
		}
	}

	async function resubmitApplication() {
		var button = document.getElementById("resubmit-button");
		Portal.busy(button, true, "Resubmitting…");
		try {
			await Portal.call(API.resubmit, {
				application: reference,
				monthly_income: document.getElementById("resubmit-income").value,
				monthly_obligations: document.getElementById("resubmit-obligations").value,
				credit_score: document.getElementById("resubmit-credit").value,
				employment_months: document.getElementById("resubmit-employment").value,
			});
			Portal.flash("success", "Application resubmitted", "We will review it again.");
			await reload();
		} catch (error) {
			if (error.status === 401 || error.status === 403) return;
			Portal.flash("error", "Could not resubmit", error.message);
		} finally {
			Portal.busy(button, false);
		}
	}

	async function removeDocument(row) {
		if (!window.confirm("Remove this document? You will need to upload it again.")) return;
		try {
			await Portal.call(API.remove, { application: reference, row: row });
			Portal.flash("success", "Document removed");
			await reload();
		} catch (error) {
			if (error.status === 401 || error.status === 403) return;
			Portal.flash("error", "Could not remove the document", error.message);
		}
	}

	async function withdrawApplication() {
		var button = document.getElementById("withdraw-confirm");
		Portal.busy(button, true, "Withdrawing…");
		try {
			await Portal.call(API.withdraw, { application: reference });
			document.getElementById("withdraw-panel").classList.add("hidden");
			Portal.flash("success", "Application withdrawn");
			await reload();
		} catch (error) {
			if (error.status === 401 || error.status === 403) return;
			Portal.busy(button, false);
			Portal.flash("error", "Could not withdraw", error.message);
		}
	}

	document.getElementById("resubmit-button").addEventListener("click", resubmitApplication);

	document.getElementById("withdraw-cancel").addEventListener("click", function () {
		document.getElementById("withdraw-panel").classList.add("hidden");
	});
	document.getElementById("withdraw-confirm").addEventListener("click", withdrawApplication);

	document.getElementById("upload-form").addEventListener("submit", async function (event) {
		event.preventDefault();
		var type = document.getElementById("document-type");
		var fileInput = document.getElementById("document-file");
		var button = document.getElementById("upload-button");

		if (!type.value) {
			Portal.flash("error", "Choose a document type");
			type.focus();
			return;
		}
		if (!fileInput.files.length) {
			Portal.flash("error", "Choose a file to upload");
			fileInput.focus();
			return;
		}

		Portal.busy(button, true, "Uploading…");
		try {
			var uploaded = await Portal.upload(fileInput.files[0]);
			await Portal.call(API.attach, {
				application: reference,
				document_type: type.value,
				file: uploaded.name,
			});
			event.target.reset();
			Portal.flash("success", "Document added");
			await reload();
		} catch (error) {
			if (error.status === 401 || error.status === 403) return;
			Portal.flash("error", "Upload failed", error.message);
		} finally {
			Portal.busy(button, false);
		}
	});

	async function start() {
		if (!reference) return;
		try {
			var types = await Portal.call(API.documentTypes);
			renderUploadTypes(types);
			await reload();
		} catch (error) {
			if (error.status === 401 || error.status === 403) return;
			Portal.flash("error", "Could not load this application", error.message);
		}
	}

	start();
})();
