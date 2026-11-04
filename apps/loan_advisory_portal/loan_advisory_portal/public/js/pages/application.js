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
		credit_score: "credit history details",
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

	/* The page head keeps only the quiet Withdraw; the single primary action lives in the result section. */
	function renderActions(application) {
		var host = document.getElementById("app-actions");
		var lifecycle = application.lifecycle || "DRAFT";
		var open = CLOSED.indexOf(lifecycle) === -1;
		host.innerHTML = open ? '<button class="btn btn--quiet" type="button" id="withdraw">Withdraw</button>' : "";
		var withdraw = document.getElementById("withdraw");
		if (withdraw) {
			withdraw.addEventListener("click", function () {
				Portal.openDialog(document.getElementById("withdraw-dialog"));
			});
		}
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
				product.rate_of_interest ? Portal.esc(product.rate_of_interest) + "% a year, flat (indicative)" : null
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

	var ART = "/assets/loan_advisory_portal/illustrations/";
	var IN_FLIGHT = ["SUBMITTED", "UNDER_REVIEW", "MANUAL_REVIEW"];

	/* What the result section says for each state. Copy only; the facts come from the record. */
	var RESULT = {
		DRAFT: { art: "wizard-documents", title: "Your application is not submitted yet", badge: ["badge--neutral", "Draft"] },
		SUBMITTED: { art: "submitted", title: "We have received your application", badge: ["badge--info", "Submitted"] },
		UNDER_REVIEW: { art: "checking", title: "We are checking your application", badge: ["badge--info", "Checks running"] },
		MANUAL_REVIEW: { art: "processing", title: "A person is reviewing your application", badge: ["badge--warn", "With a reviewer"] },
		INFO_REQUESTED: { art: "missing-info", title: "We need a few details corrected", badge: ["badge--warn", "Information needed"] },
		APPROVED: { art: "approved", title: "Your application was approved", badge: ["badge--ok", "Approved"] },
		REJECTED: { art: "not-approved", title: "Your application was not approved", badge: ["badge--bad", "Not approved"] },
		WITHDRAWN: { art: "withdrawn", title: "You withdrew this application", badge: ["badge--neutral", "Withdrawn"] },
	};

	/* The decision is the key card (white, hairline); the badge and heading carry the meaning and the
	   illustration sits beside it on the plain page. While checks are running a thin CSS status bar inside
	   the card is the processing cue (still under reduced motion). */
	function resultHead(view, lead, when, lifecycle, extra, leadLang) {
		var processing = IN_FLIGHT.indexOf(lifecycle) !== -1;
		return (
			'<div class="result-head result-head--lg result-v6">' +
			'<img class="result-head__art" src="' + ART + view.art + '.svg" alt="" width="160" height="120">' +
			'<div class="result-head__text decision-card key-card">' +
			'<p class="result-head__status"><span class="badge ' + view.badge[0] + '">' + Portal.esc(view.badge[1]) + "</span>" +
			(when ? '<span class="tiny muted">' + Portal.esc(when) + "</span>" : "") +
			"</p>" +
			'<h2 id="decision-heading">' + Portal.esc(view.title) + "</h2>" +
			(lead ? '<p class="result-head__lead"' + langAttr(leadLang) + ">" + Portal.esc(lead) + "</p>" : "") +
			(extra || "") +
			(processing ? '<div class="status-bar process-bar" aria-hidden="true"></div>' : "") +
			"</div></div>"
		);
	}

	function resultSection(title, inner) {
		return '<section class="result-section"><h3>' + Portal.esc(title) + "</h3>" + inner + "</section>";
	}

	/* Copy in Hindi or Telugu carries its own lang so screen readers switch voice. */
	function langAttr(locale) {
		return locale && locale !== "en" ? ' lang="' + Portal.esc(locale) + '"' : "";
	}

	/* The borrower's own offer, and nothing else: amount, EMI and tenure. */
	function offerFacts(offer) {
		if (!offer) return "";
		var rows = [];
		if (offer.amount) rows.push(["Amount", Portal.money(offer.amount)]);
		if (offer.emi) rows.push(["Monthly EMI", Portal.money(offer.emi)]);
		if (offer.tenure_months) rows.push(["Tenure", Portal.months(offer.tenure_months)]);
		if (!rows.length) return "";
		return (
			'<dl class="offer-facts">' +
			rows
				.map(function (row) {
					return "<div><dt>" + Portal.esc(row[0]) + "</dt><dd>" + Portal.esc(row[1]) + "</dd></div>";
				})
				.join("") +
			"</dl>"
		);
	}

	function plainList(items, cls, locale) {
		return (
			'<ul class="' + (cls || "result-factors") + '"' + langAttr(locale) + ">" +
			items
				.map(function (item) {
					return "<li>" + Portal.esc(item) + "</li>";
				})
				.join("") +
			"</ul>"
		);
	}

	/* In-flight progress from the record: what has happened (dated) and what is still to come. No time is promised. */
	function progressFor(application) {
		var lifecycle = application.lifecycle;
		var sent = application.submitted_at ? "Sent " + Portal.date(application.submitted_at) : "Sent";
		var steps = [{ label: "Application sent", note: sent, state: "done" }];
		if (lifecycle === "MANUAL_REVIEW") {
			steps.push({ label: "Automatic checks", note: "Finished without a settled outcome", state: "done" });
			steps.push({ label: "A person reviews it", note: "In progress", state: "current" });
		} else {
			steps.push({
				label: "Checks against the lending policy",
				note: lifecycle === "SUBMITTED" ? "Queued" : "In progress",
				state: "current",
			});
		}
		steps.push({ label: "Outcome and reasons", note: "Shown here when ready", state: "todo" });
		return (
			'<ol class="run-progress" aria-label="Where your application is">' +
			steps
				.map(function (step) {
					return (
						'<li data-state="' + step.state + '"' + (step.state === "current" ? ' aria-current="step"' : "") + ">" +
						'<span class="run-progress__mark" aria-hidden="true"></span>' +
						"<span><strong>" + Portal.esc(step.label) + "</strong>" +
						'<span class="tiny muted">' + Portal.esc(step.note) + "</span></span></li>"
					);
				})
				.join("") +
			"</ol>"
		);
	}

	function missingFields(fields) {
		return (fields || []).map(function (field) {
			var label = FIELD_LABELS[field] || String(field).replace(/_/g, " ");
			return label.charAt(0).toUpperCase() + label.slice(1);
		});
	}

	function primaryAction(application, lifecycle) {
		var assistant = "/borrower/assistant?application=" + encodeURIComponent(application.name);
		var feedback = "/borrower/feedback?application=" + encodeURIComponent(application.name);
		var documentsUrl = "/borrower/documents?name=" + encodeURIComponent(application.name);
		var hasDocuments = (application.documents || []).length > 0;
		var quiet = function (href, text) {
			return '<a class="link-quiet" href="' + href + '">' + text + "</a>";
		};
		switch (lifecycle) {
			case "DRAFT":
				return hasDocuments
					? '<button class="btn" type="button" id="submit-app">Submit application</button>' + quiet(documentsUrl, "Check documents")
					: '<a class="btn" href="' + documentsUrl + '">Add documents to continue</a>';
			case "INFO_REQUESTED":
				// The coral action on this page is "Resubmit application" inside the form below; the
				// jump link to that form is a ghost so the page keeps one primary.
				return '<a class="btn btn--ghost" href="#info-request">Update details</a>' + quiet(assistant, "Ask what is needed");
			case "APPROVED":
				return '<a class="btn" href="' + assistant + '">Ask what happens next</a>' + quiet(feedback, "Talk to a person");
			case "REJECTED":
				return '<a class="btn" href="' + assistant + '">Understand this decision</a>' + quiet("/borrower/apply", "Start a new application");
			case "WITHDRAWN":
				return '<a class="btn" href="/borrower/apply">Start a new application</a>';
			default:
				// In flight: nothing for the borrower to do; the side column offers the assistant.
				return "";
		}
	}

	function renderDecision(decision, application) {
		var host = document.getElementById("decision");
		var lifecycle = application.lifecycle || "DRAFT";
		var view = RESULT[lifecycle] || {
			art: "assessment-pending",
			title: Portal.lifecycleLabel(lifecycle),
			badge: ["badge--neutral", Portal.lifecycleLabel(lifecycle)],
		};
		var guidance = application.guidance || {};
		var has = decision && decision.available;
		var when = has && decision.evaluated_at && window.PortalStatus ? window.PortalStatus.assessedText(decision.evaluated_at) : "";
		var lead = guidance.summary || "";
		if (lifecycle === "UNDER_REVIEW") lead = "Your details are being checked against the lending policy. Nothing is needed from you right now.";
		if (lifecycle === "SUBMITTED") lead = "The checks are queued and run without any action from you.";
		if (lifecycle === "DRAFT") {
			var ready = (application.documents || []).length > 0;
			view = {
				art: view.art,
				badge: view.badge,
				title: ready ? "Your application is ready to submit" : "Add a document before you submit",
			};
			lead = ready
				? "It has not been assessed yet. Submitting sends it for the checks and fixes the loan request."
				: "It has not been assessed yet. At least one document is needed before you can submit.";
		}
		// Plain words only: the record picks the summary and themes, never a number, cut-off or rule id.
		var locale = (Portal.boot && Portal.boot.locale) || "en";
		var plain = window.PortalReasons
			? window.PortalReasons.decisionView(application, decision, locale)
			: { summary: null, themes: [], steps: [], offer: null };
		var leadLang = "en";
		if (plain.summary) {
			lead = plain.summary;
			leadLang = locale;
		}
		// D-06: a counter-offer is not the loan that was asked for, so it is never headed "approved".
		if (plain.counter) view = { art: view.art, title: "We can offer you a different loan", badge: ["badge--ok", "Offer made"] };
		var parts = [resultHead(view, lead, when, lifecycle, offerFacts(plain.offer), leadLang)];

		if (IN_FLIGHT.indexOf(lifecycle) !== -1) {
			parts.push(progressFor(application));
		}

		if (has && decision.provider_error) {
			parts.push(
				'<p class="result-note">No decision has been made yet. Your loan advisor can give you an update.</p>'
			);
		}

		if (lifecycle === "INFO_REQUESTED" || (has && decision.information_needed)) {
			var missing = missingFields(has ? decision.missing_fields : []);
			parts.push(
				resultSection(
					"What to correct",
					missing.length
						? plainList(missing)
						: '<p class="small muted">Correct the details listed for this application.</p>'
				)
			);
		} else if (plain.themes.length) {
			parts.push(
				resultSection(
					lifecycle === "REJECTED" ? "What held it back" : "What we are looking at",
					plainList(plain.themes.map(function (theme) {
						return theme.text;
					}), "decision-reasons", locale)
				)
			);
		}

		if (plain.steps.length) {
			// A decline gets two or three general steps instead of the generic next steps.
			parts.push(resultSection("What could help", plainList(plain.steps, "result-factors", locale)));
		} else {
			var steps = (guidance.next_steps || []).filter(function (step) {
				return !/decision section|what affected/i.test(step);
			});
			if (steps.length) parts.push(resultSection("What happens next", plainList(steps)));
		}

		if (has && decision.simulation) {
			parts.push('<p class="result-note">This was a what-if estimate, not a decision on your application.</p>');
		}

		var action = primaryAction(application, lifecycle);
		if (action) parts.push('<div class="result-actions">' + action + "</div>");

		// The policy version is in Application facts; the note says what this section can and cannot show.
		var meta = ["Only checks recorded on this application appear here."];
		parts.push(
			'<p class="decision-meta">' +
				meta
					.map(function (entry) {
						return "<span>" + entry + "</span>";
					})
					.join("") +
				"</p>"
		);

		host.removeAttribute("aria-busy");
		host.innerHTML = parts.join("");
		var submit = document.getElementById("submit-app");
		if (submit) submit.addEventListener("click", submitApplication);
		schedulePoll(lifecycle);
	}

	/* While checks are in flight the page looks again every 15 s (only while visible, at most 40 times). */
	var pollTimer = null;
	var polls = 0;
	function schedulePoll(lifecycle) {
		if (pollTimer) window.clearTimeout(pollTimer);
		pollTimer = null;
		if (IN_FLIGHT.indexOf(lifecycle) === -1 || polls >= 40) return;
		pollTimer = window.setTimeout(function () {
			polls += 1;
			if (document.hidden) return schedulePoll(lifecycle);
			reload().catch(function () {
				/* A failed background check leaves the page as it was; the next one tries again. */
				schedulePoll(lifecycle);
			});
		}, Number(window.__portalPollMs) || 15000);
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
		var months = inputNumber("resubmit-employment");

		var problem = null;
		if (income === null || !isFinite(income) || income < 0) {
			problem = "Enter your monthly income as a number.";
		} else if (obligations === null || !isFinite(obligations) || obligations < 0) {
			problem = "Enter your monthly obligations as a number.";
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
		var host = document.getElementById("decision");
		host.removeAttribute("aria-busy");
		host.innerHTML =
			'<div class="result-head result-head--lg">' +
			'<img class="result-head__art" src="' + ART + 'service-unavailable.svg" alt="" width="160" height="120">' +
			'<div class="result-head__text"><h2 id="decision-heading">This application could not be loaded</h2>' +
			'<p class="result-head__lead">' + Portal.esc(error.message) + "</p></div></div>";
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
