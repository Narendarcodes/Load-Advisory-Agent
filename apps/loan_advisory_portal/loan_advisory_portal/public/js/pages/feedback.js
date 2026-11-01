/* Feedback form and the borrower's own feedback history. */
(function () {
	"use strict";

	var Portal = window.Portal;
	var form = document.getElementById("feedback-form");
	var sendButton = document.getElementById("send");

	function rating() {
		var checked = form.querySelector("input[name='rating']:checked");
		return checked ? Number(checked.value) : null;
	}

	function renderHistory(items) {
		var host = document.getElementById("history");
		if (!items.length) {
			host.innerHTML = "<p class=\"muted small\">Nothing yet. Feedback you send appears here.</p>";
			return;
		}
		host.innerHTML = items
			.map(function (item, index) {
				var stars = "★".repeat(item.rating) + "☆".repeat(5 - item.rating);
				var meta = [item.category, item.application || "no application", Portal.date(item.submitted_at)]
					.filter(Boolean)
					.join(" · ");
				var divider = index === items.length - 1 ? "" : "<hr class=\"divider\">";
				return (
					"<div class=\"history-item\">" +
					"<div class=\"row small\"><strong aria-label=\"" + item.rating + " out of 5\">" + stars + "</strong>" +
					"<span class=\"muted tiny\">" + Portal.esc(meta) + "</span>" +
					"<span class=\"spacer\"></span><span class=\"badge\">" + Portal.esc(item.status) + "</span></div>" +
					"<p class=\"small\">" + Portal.esc(item.message) + "</p>" +
					divider +
					"</div>"
				);
			})
			.join("");
	}

	async function loadHistory() {
		try {
			renderHistory(await Portal.call("loan_advisory_portal.api.feedback.list_feedback"));
		} catch (error) {
			if (error.status === 401 || error.status === 403) return;
			document.getElementById("history").innerHTML =
				"<div class=\"alert alert--error\" role=\"alert\"><strong>Could not load your feedback</strong><span>" +
				Portal.esc(error.message) + "</span></div>";
		}
	}

	async function loadApplications() {
		try {
			var applications = await Portal.call("loan_advisory_portal.api.applications.list_applications");
			var select = document.getElementById("application");
			applications.forEach(function (application) {
				var option = document.createElement("option");
				option.value = application.name;
				option.textContent = (application.purpose || "Application") + " · " + application.name;
				select.appendChild(option);
			});
		} catch (error) {
			/* the application picker is optional; the form still works without it */
		}
	}

	form.addEventListener("submit", async function (event) {
		event.preventDefault();
		var score = rating();
		var message = document.getElementById("message").value.trim();

		if (!score) {
			Portal.flash("error", "Choose a rating from 1 to 5");
			form.querySelector("input[name='rating']").focus();
			return;
		}
		if (!message) {
			document.getElementById("message").setAttribute("aria-invalid", "true");
			document.getElementById("message").focus();
			Portal.flash("error", "Write a short message");
			return;
		}

		Portal.busy(sendButton, true, "Sending…");
		try {
			await Portal.call("loan_advisory_portal.api.feedback.submit_feedback", {
				rating: score,
				message: message,
				category: document.getElementById("category").value,
				application: document.getElementById("application").value || null,
			});
			form.reset();
			Portal.flash("success", "Thank you", "Your feedback reached the team that runs the portal.");
			await loadHistory();
		} catch (error) {
			if (error.status === 401 || error.status === 403) return;
			Portal.flash("error", "Could not send feedback", error.message);
		} finally {
			Portal.busy(sendButton, false);
		}
	});

	loadHistory();
	loadApplications();
})();
