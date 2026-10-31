/* Five-step application wizard. The server re-checks every rule; this only
   catches obvious mistakes before the borrower leaves the page. */
(function () {
	"use strict";

	var Portal = window.Portal;
	var STEPS = ["about", "work", "money", "loan", "review"];
	var current = 0;

	var form = document.getElementById("apply-form");
	var panels = {};
	document.querySelectorAll("[data-panel]").forEach(function (panel) {
		panels[panel.dataset.panel] = panel;
	});
	var stepNodes = document.querySelectorAll("#steps li");
	var backButton = document.getElementById("back");
	var nextButton = document.getElementById("next");
	var submitButton = document.getElementById("submit");

	function field(id) {
		return document.getElementById(id);
	}

	function clearError(input) {
		input.removeAttribute("aria-invalid");
		var next = input.nextElementSibling;
		if (next && next.classList.contains("error") && next.dataset.validation === "true") next.remove();
	}

	function showError(input, message) {
		input.setAttribute("aria-invalid", "true");
		var next = input.nextElementSibling;
		if (!next || !next.classList.contains("error") || next.dataset.validation !== "true") {
			next = document.createElement("p");
			next.className = "error";
			next.dataset.validation = "true";
			input.insertAdjacentElement("afterend", next);
		}
		next.textContent = message;
		input.focus();
		return false;
	}

	function number(input, label, min, max, whole) {
		var raw = input.value.trim();
		if (raw === "") return showError(input, label + " is required.");
		var value = Number(raw);
		if (!isFinite(value)) return showError(input, "Enter a number for " + label.toLowerCase() + ".");
		if (whole && !Number.isInteger(value)) return showError(input, "Enter a whole number of months.");
		if (value < min || (max !== null && value > max)) {
			return showError(input, "Enter a value between " + min + " and " + max + ".");
		}
		return true;
	}

	function validate(step) {
		if (step === "work") {
			return number(field("work-months"), "Months in your current work", 0, 720, true);
		}
		if (step === "money") {
			if (!number(field("money-income"), "Monthly income", 1, null, false)) return false;
			return number(field("money-obligations"), "Monthly obligations", 0, null, false);
		}
		if (step === "loan") {
			if (!number(field("loan-amount"), "Loan amount", 1, null, false)) return false;
			if (!number(field("loan-tenure"), "Repayment tenure", 1, 360, true)) return false;
			var purpose = field("loan-purpose");
			if (purpose.value.trim().length < 2) {
				return showError(purpose, "Tell us what the loan is for.");
			}
			if (purpose.value.trim().length > 200) {
				return showError(purpose, "Keep this under 200 characters.");
			}
			clearError(purpose);
			return true;
		}
		return true;
	}

	function syncSteps() {
		stepNodes.forEach(function (node, index) {
			node.removeAttribute("data-state");
			if (index < current) node.dataset.state = "done";
			if (index === current) node.dataset.state = "current";
		});
		backButton.classList.toggle("hidden", current === 0);
		nextButton.classList.toggle("hidden", current === STEPS.length - 1);
		submitButton.classList.toggle("hidden", current !== STEPS.length - 1);
	}

	function go(index) {
		current = index;
		STEPS.forEach(function (step, position) {
			panels[step].classList.toggle("hidden", position !== current);
		});
		if (STEPS[current] === "review") renderReview();
		syncSteps();
		window.scrollTo({ top: 0, behavior: "smooth" });
		var heading = panels[STEPS[current]].querySelector("legend, h2");
		if (heading) {
			heading.setAttribute("tabindex", "-1");
			heading.focus();
		}
	}

	function values() {
		return {
			employment_months: field("work-months").value.trim(),
			monthly_income: field("money-income").value.trim(),
			monthly_obligations: field("money-obligations").value.trim(),
			loan_amount: field("loan-amount").value.trim(),
			tenure_months: field("loan-tenure").value.trim(),
			purpose: field("loan-purpose").value.trim(),
		};
	}

	function renderReview() {
		var data = values();
		var list = document.getElementById("review-list");
		var rows = [
			["Amount", Portal.money(data.loan_amount)],
			["Tenure", Portal.months(data.tenure_months)],
			["Purpose", data.purpose],
			["Monthly income", Portal.money(data.monthly_income)],
			["Monthly obligations", Portal.money(data.monthly_obligations)],
			["Months in your current work", data.employment_months],
			["Applicant", field("about-name").value],
			["Phone", field("about-phone").value || "Not on your profile yet"],
		];
		list.innerHTML = rows
			.map(function (pair) {
				return "<div><dt>" + Portal.esc(pair[0]) + "</dt><dd>" + Portal.esc(pair[1]) + "</dd></div>";
			})
			.join("");
	}

	async function prefill() {
		try {
			var results = await Promise.all([
				Portal.call("loan_advisory_portal.api.session.me"),
				Portal.call("loan_advisory_portal.api.profile.get_profile"),
			]);
			var me = results[0];
			var profile = results[1];
			field("about-name").value = me.full_name || "";
			field("about-email").value = me.email || "";
			field("about-phone").value = profile.phone || "";
			if (!profile.phone) {
				document.getElementById("about-phone-missing").classList.remove("hidden");
			}
			if (profile.employment_months !== null && profile.employment_months !== undefined) {
				field("work-months").value = profile.employment_months;
			}
			if (profile.monthly_income !== null && profile.monthly_income !== undefined) {
				field("money-income").value = profile.monthly_income;
			}
			if (profile.monthly_obligations !== null && profile.monthly_obligations !== undefined) {
				field("money-obligations").value = profile.monthly_obligations;
			}
		} catch (error) {
			if (error.status === 401 || error.status === 403) return;
			Portal.flash("error", "Could not load your profile", error.message);
		}
	}

	form.addEventListener("input", function (event) {
		if (event.target.matches("input, select, textarea")) clearError(event.target);
	});

	nextButton.addEventListener("click", function () {
		if (!validate(STEPS[current])) return;
		go(Math.min(current + 1, STEPS.length - 1));
	});

	backButton.addEventListener("click", function () {
		go(Math.max(current - 1, 0));
	});

	form.addEventListener("submit", async function (event) {
		event.preventDefault();
		for (var index = 0; index < STEPS.length; index += 1) {
			if (!validate(STEPS[index])) {
				go(index);
				return;
			}
		}
		var data = values();
		Portal.busy(submitButton, true, "Creating…");
		try {
			var created = await Portal.call("loan_advisory_portal.api.applications.create_application", {
				loan_amount: data.loan_amount,
				tenure_months: data.tenure_months,
				purpose: data.purpose,
				monthly_income: data.monthly_income,
				monthly_obligations: data.monthly_obligations,
				employment_months: data.employment_months,
				select: 1,
			});
			window.location.assign("/borrower/application?name=" + encodeURIComponent(created.name));
		} catch (error) {
			if (error.status === 401 || error.status === 403) return;
			Portal.busy(submitButton, false);
			Portal.flash("error", "We could not create this application", error.message);
		}
	});

	prefill();
	syncSteps();
})();
