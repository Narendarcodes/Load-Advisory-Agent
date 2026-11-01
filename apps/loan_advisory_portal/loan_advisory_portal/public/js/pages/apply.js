/* Five-step application wizard. The server re-checks every rule; this only
   catches obvious mistakes and saves profile details as the borrower moves on. */
(function () {
	"use strict";

	var Portal = window.Portal;
	var form = document.getElementById("apply-form");
	if (!form) return;

	var config = {};
	try {
		config = JSON.parse(document.getElementById("apply-data").textContent || "{}");
	} catch (error) {
		config = {};
	}
	var product = config.product || {};
	var MAX_AMOUNT = Number(product.maximum) || 1000000;
	var PRODUCT_RATE = Number(product.rate) || 0;
	var MIN_AMOUNT = 10000;
	var STEPS = ["about", "work", "money", "loan", "review"];
	var STEP_LABELS = ["About you", "Employment", "Income", "Loan request", "Review"];

	var current = 0;
	var furthest = 0;

	var panels = {};
	document.querySelectorAll("[data-panel]").forEach(function (panel) {
		panels[panel.dataset.panel] = panel;
	});
	var stepItems = Array.prototype.slice
		.call(document.querySelectorAll("#wizard-steps li[data-step]"))
		.filter(function (item) {
			return !!item.querySelector("button[data-goto]");
		});
	var backButton = document.getElementById("back");
	var nextButton = document.getElementById("next");
	var submitButton = document.getElementById("submit");
	var saveState = document.getElementById("save-state");
	var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	function field(id) {
		return document.getElementById(id);
	}

	function isAuth(error) {
		return (
			error.status === 401 ||
			(error.status === 403 && error.payload && error.payload.exc_type === "PermissionError")
		);
	}

	function setSaveState(text, state) {
		if (!saveState) return;
		saveState.textContent = text;
		if (state) saveState.dataset.state = state;
		else delete saveState.dataset.state;
	}

	function errorFor(input) {
		var wrapper = input.closest(".field");
		return wrapper ? wrapper.querySelector(".error") : null;
	}

	function clearError(input) {
		input.removeAttribute("aria-invalid");
		var node = errorFor(input);
		if (node) node.classList.add("hidden");
	}

	function showError(input, message) {
		input.setAttribute("aria-invalid", "true");
		var node = errorFor(input);
		if (node) {
			node.textContent = message;
			node.classList.remove("hidden");
		}
		input.focus();
		return false;
	}

	function readNumber(input) {
		var raw = input.value.trim();
		if (raw === "") return null;
		var value = Number(raw);
		return isFinite(value) ? value : NaN;
	}

	function checkNumber(input, message, min, max, whole) {
		var value = readNumber(input);
		if (value === null || isNaN(value)) return showError(input, message);
		if (whole && !Number.isInteger(value)) return showError(input, message);
		if (value < min || (max !== null && value > max)) return showError(input, message);
		clearError(input);
		return true;
	}

	function purposeText() {
		var select = field("loan-purpose");
		if (select.value === "Other") return field("loan-purpose-other").value.trim();
		return select.value;
	}

	function monthsText(value) {
		if (value === null || isNaN(value)) return "Not provided";
		if (Number(value) === 0) return "Less than a month";
		return Portal.months(value);
	}

	function indicativeEmi(principal, months) {
		var p = Number(principal);
		var n = Number(months);
		if (!p || !n) return null;
		var rate = PRODUCT_RATE / 1200;
		if (!rate) return p / n;
		var growth = Math.pow(1 + rate, n);
		return (p * rate * growth) / (growth - 1);
	}

	function validate(step) {
		if (step === "about") {
			var name = field("about-name");
			if (!name.value.trim()) return showError(name, "Enter your full name.");
			if (name.value.trim().length > 140) return showError(name, "Keep your name under 140 characters.");
			clearError(name);
			var phone = field("about-phone");
			var digits = phone.value.replace(/[^0-9]/g, "");
			if (!phone.value.trim() || phone.value.trim().charAt(0) !== "+" || digits.length < 8 || digits.length > 15) {
				return showError(phone, "Enter a phone number with country code, for example +91 98765 43210.");
			}
			clearError(phone);
			return true;
		}
		if (step === "work") {
			return checkNumber(
				field("work-months"),
				"Enter a whole number of months between 0 and 720.",
				0,
				720,
				true
			);
		}
		if (step === "money") {
			if (!checkNumber(field("money-income"), "Enter your monthly net income in rupees.", 1, null, false)) {
				return false;
			}
			return checkNumber(
				field("money-obligations"),
				"Enter your existing monthly repayments, or 0.",
				0,
				null,
				false
			);
		}
		if (step === "loan") {
			var amount = field("loan-amount");
			if (
				!checkNumber(
					amount,
					"Enter an amount between ₹10,000 and " + Portal.money(MAX_AMOUNT) + ".",
					MIN_AMOUNT,
					MAX_AMOUNT,
					false
				)
			) {
				return false;
			}
			var purpose = field("loan-purpose");
			if (!purpose.value) return showError(purpose, "Choose what the loan is for.");
			clearError(purpose);
			if (purpose.value === "Other") {
				var other = field("loan-purpose-other");
				if (!other.value.trim()) return showError(other, "Describe what the loan is for.");
				if (other.value.trim().length > 200) return showError(other, "Keep this under 200 characters.");
				clearError(other);
			}
			return true;
		}
		if (step === "review") {
			var terms = field("consent-terms");
			var privacy = field("consent-privacy");
			var errorNode = document.getElementById("consent-error");
			if (!terms.checked || !privacy.checked) {
				errorNode.classList.remove("hidden");
				terms.focus();
				return false;
			}
			errorNode.classList.add("hidden");
			return true;
		}
		return true;
	}

	function stepPayload(step) {
		if (step === "about") {
			return {
				full_name: field("about-name").value.trim(),
				phone: field("about-phone").value.trim(),
			};
		}
		if (step === "work") {
			return {
				employment_type: field("work-type").value,
				employer: field("work-employer").value.trim(),
				employment_months: readNumber(field("work-months")),
			};
		}
		if (step === "money") {
			return {
				monthly_income: readNumber(field("money-income")),
				monthly_obligations: readNumber(field("money-obligations")),
			};
		}
		return null;
	}

	async function saveStep(step) {
		var payload = stepPayload(step);
		if (!payload) return true;
		Portal.busy(nextButton, true, "Saving");
		setSaveState("Saving to your profile", "saving");
		try {
			await Portal.call("loan_advisory_portal.api.profile.update_profile", payload);
			setSaveState("Saved to your profile", null);
			return true;
		} catch (error) {
			setSaveState("Not saved", "error");
			if (isAuth(error)) return false;
			Portal.flash("error", "We could not save this step", error.message);
			return false;
		} finally {
			Portal.busy(nextButton, false);
		}
	}

	function renderStep() {
		stepItems.forEach(function (item, position) {
			var button = item.querySelector("button");
			item.removeAttribute("data-state");
			if (position < furthest) item.dataset.state = "done";
			if (position === current) item.dataset.state = "current";
			if (position === current) {
				item.dataset.state = "current";
				button.setAttribute("aria-current", "step");
			} else {
				button.removeAttribute("aria-current");
			}
			button.disabled = position > furthest;
		});
		backButton.classList.toggle("hidden", current === 0);
		nextButton.classList.toggle("hidden", current === STEPS.length - 1);
		submitButton.classList.toggle("hidden", current !== STEPS.length - 1);
		var progressText = document.getElementById("wizard-progress-text");
		var progressFill = document.getElementById("wizard-progress-fill");
		if (progressText) {
			progressText.textContent = "Step " + (current + 1) + " of " + STEPS.length + ": " + STEP_LABELS[current];
		}
		if (progressFill) progressFill.style.width = ((current + 1) / STEPS.length) * 100 + "%";
	}

	function go(index, options) {
		current = Math.max(0, Math.min(index, STEPS.length - 1));
		STEPS.forEach(function (step, position) {
			panels[step].classList.toggle("hidden", position !== current);
		});
		renderStep();
		if (STEPS[current] === "review") renderReview();
		if (!options || options.focus !== false) {
			var heading = panels[STEPS[current]].querySelector("h2");
			if (heading) heading.focus();
			window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
		}
	}

	function syncAmount(source) {
		var amountInput = field("loan-amount");
		var range = field("loan-range");
		if (source === range) {
			amountInput.value = range.value;
			clearError(amountInput);
		} else {
			var value = readNumber(amountInput);
			if (value === null || isNaN(value)) {
				range.value = String(MIN_AMOUNT);
			} else {
				range.value = String(Math.max(MIN_AMOUNT, Math.min(MAX_AMOUNT, value)));
			}
		}
		renderSummary();
	}

	function renderSummary() {
		var amount = readNumber(field("loan-amount"));
		var months = readNumber(field("loan-tenure"));
		var purpose = purposeText();
		var emi = amount !== null && !isNaN(amount) && months ? indicativeEmi(amount, months) : null;
		field("sum-amount").textContent = amount !== null && !isNaN(amount) && amount > 0 ? Portal.money(amount) : "Not set";
		field("sum-tenure").textContent = months ? Portal.months(months) : "Not set";
		field("sum-emi").textContent = emi ? Portal.money(Math.round(emi)) + " / month" : "Not set";
		field("sum-purpose").textContent = purpose || "Not set";
	}

	function updateMoneyWarning() {
		var income = readNumber(field("money-income"));
		var obligations = readNumber(field("money-obligations"));
		var show =
			income !== null &&
			obligations !== null &&
			!isNaN(income) &&
			!isNaN(obligations) &&
			income > 0 &&
			obligations >= income;
		document.getElementById("money-warning").classList.toggle("hidden", !show);
	}

	function reviewGroup(step, title, rows) {
		var body = rows
			.map(function (pair) {
				return "<div><dt>" + Portal.esc(pair[0]) + "</dt><dd>" + Portal.esc(pair[1]) + "</dd></div>";
			})
			.join("");
		return (
			'<div class="review-group">' +
			'<div class="review-group__head"><h3>' +
			Portal.esc(title) +
			'</h3><button type="button" class="btn btn--quiet btn--sm" data-edit="' +
			step +
			'">Edit</button></div>' +
			'<dl class="detail detail--rows">' +
			body +
			"</dl></div>"
		);
	}

	function renderReview() {
		var name = field("about-name").value.trim() || "Not provided";
		var phone = field("about-phone").value.trim() || "Not provided";
		var email = field("about-email").value || "Not provided";
		var type = field("work-type").value || "Prefer not to say";
		var employer = field("work-employer").value.trim() || "Not provided";
		var months = readNumber(field("work-months"));
		var income = readNumber(field("money-income"));
		var obligations = readNumber(field("money-obligations"));
		var amount = readNumber(field("loan-amount"));
		var tenure = readNumber(field("loan-tenure"));
		var emi = amount !== null && tenure ? indicativeEmi(amount, tenure) : null;
		var purpose = purposeText() || "Not provided";

		document.getElementById("review-body").innerHTML =
			reviewGroup("about", "About you", [
				["Name", name],
				["Email", email],
				["Phone", phone],
			]) +
			reviewGroup("work", "Employment", [
				["Type", type],
				["Employer", employer],
				["Months in current work", monthsText(months)],
			]) +
			reviewGroup("money", "Income and commitments", [
				["Monthly net income", income === null || isNaN(income) ? "Not provided" : Portal.money(income)],
				[
					"Existing monthly repayments",
					obligations === null || isNaN(obligations) ? "Not provided" : Portal.money(obligations),
				],
			]) +
			reviewGroup("loan", "Loan request", [
				["Amount", amount === null || isNaN(amount) ? "Not provided" : Portal.money(amount)],
				["Tenure", tenure ? Portal.months(tenure) : "Not provided"],
				["Indicative EMI", emi ? Portal.money(Math.round(emi)) + " / month" : "Not set"],
				["Purpose", purpose],
			]);
	}

	function applyQuery() {
		var params = new URLSearchParams(window.location.search);
		var amount = Number(params.get("amount"));
		if (isFinite(amount) && amount > 0) {
			var clamped = Math.max(MIN_AMOUNT, Math.min(MAX_AMOUNT, amount));
			field("loan-amount").value = String(clamped);
			field("loan-range").value = String(clamped);
		}
		var tenure = Number(params.get("tenure"));
		if (tenure && field("loan-tenure").querySelector('option[value="' + tenure + '"]')) {
			field("loan-tenure").value = String(tenure);
		}
		var purpose = (params.get("purpose") || "").trim();
		if (!purpose) return;
		var select = field("loan-purpose");
		var matched = "";
		Array.prototype.forEach.call(select.options, function (option) {
			if (option.value && option.value.toLowerCase() === purpose.toLowerCase()) matched = option.value;
		});
		if (matched) {
			select.value = matched;
		} else {
			select.value = "Other";
			field("loan-purpose-other").value = purpose.slice(0, 200);
		}
		if (select.value === "Other") {
			document.getElementById("loan-purpose-other-field").classList.remove("hidden");
		}
	}

	async function prefill() {
		applyQuery();
		try {
			var results = await Promise.all([
				Portal.call("loan_advisory_portal.api.session.me"),
				Portal.call("loan_advisory_portal.api.profile.get_profile"),
			]);
			var me = results[0] || {};
			var profile = results[1] || {};
			field("about-name").value = profile.full_name || me.full_name || "";
			field("about-email").value = profile.email || me.email || "";
			field("about-phone").value = profile.phone || "";
			field("work-type").value = profile.employment_type || "";
			field("work-employer").value = profile.employer || "";
			if (profile.employment_months !== null && profile.employment_months !== undefined) {
				field("work-months").value = profile.employment_months;
			}
			if (profile.monthly_income !== null && profile.monthly_income !== undefined) {
				field("money-income").value = profile.monthly_income;
			}
			if (profile.monthly_obligations !== null && profile.monthly_obligations !== undefined) {
				field("money-obligations").value = profile.monthly_obligations;
			}
			setSaveState("Profile ready", null);
		} catch (error) {
			setSaveState("Profile not loaded", "error");
			if (isAuth(error)) return;
			Portal.flash("error", "We could not load your profile", error.message);
		}
		renderSummary();
		updateMoneyWarning();
	}

	form.addEventListener("input", function (event) {
		if (event.target.matches("input, select, textarea")) clearError(event.target);
		if (event.target.id === "money-income" || event.target.id === "money-obligations") {
			updateMoneyWarning();
		}
		if (event.target.id === "consent-terms" || event.target.id === "consent-privacy") {
			document.getElementById("consent-error").classList.add("hidden");
		}
	});

	form.addEventListener("change", function (event) {
		if (event.target.matches("input, select, textarea")) clearError(event.target);
	});

	field("loan-amount").addEventListener("input", function () {
		syncAmount(field("loan-amount"));
	});

	field("loan-range").addEventListener("input", function () {
		syncAmount(field("loan-range"));
	});

	field("loan-tenure").addEventListener("change", renderSummary);

	field("loan-purpose").addEventListener("change", function () {
		var isOther = field("loan-purpose").value === "Other";
		document.getElementById("loan-purpose-other-field").classList.toggle("hidden", !isOther);
		if (isOther) field("loan-purpose-other").focus();
		renderSummary();
	});

	field("loan-purpose-other").addEventListener("input", renderSummary);

	document.getElementById("wizard-steps").addEventListener("click", function (event) {
		var button = event.target.closest("button[data-goto]");
		if (!button || button.disabled) return;
		var index = Number(button.dataset.goto);
		if (index <= furthest) go(index);
	});

	document.getElementById("review-body").addEventListener("click", function (event) {
		var button = event.target.closest("[data-edit]");
		if (!button) return;
		var index = STEPS.indexOf(button.dataset.edit);
		if (index >= 0) go(index);
	});

	backButton.addEventListener("click", function () {
		go(current - 1);
	});

	nextButton.addEventListener("click", async function () {
		if (!validate(STEPS[current])) return;
		var saved = await saveStep(STEPS[current]);
		if (!saved) return;
		furthest = Math.max(furthest, Math.min(current + 1, STEPS.length - 1));
		go(Math.min(current + 1, STEPS.length - 1));
	});

	form.addEventListener("submit", async function (event) {
		event.preventDefault();
		for (var index = 0; index < STEPS.length; index += 1) {
			if (!validate(STEPS[index])) {
				go(index);
				return;
			}
		}
		document.getElementById("create-error").classList.add("hidden");
		Portal.busy(submitButton, true, "Creating");
		setSaveState("Saving to your profile", "saving");
		try {
			await Portal.call(
				"loan_advisory_portal.api.profile.update_profile",
				Object.assign(stepPayload("about"), stepPayload("work"), stepPayload("money"), {
					consent_terms: 1,
					consent_privacy: 1,
				})
			);
			var created = await Portal.call("loan_advisory_portal.api.applications.create_application", {
				loan_amount: readNumber(field("loan-amount")),
				tenure_months: readNumber(field("loan-tenure")),
				purpose: purposeText(),
				monthly_income: readNumber(field("money-income")),
				monthly_obligations: readNumber(field("money-obligations")),
				employment_months: readNumber(field("work-months")),
				select: 1,
			});
			setSaveState("Application created", null);
			window.location.assign("/borrower/documents?name=" + encodeURIComponent(created.name) + "&created=1");
		} catch (error) {
			Portal.busy(submitButton, false);
			setSaveState("Not saved", "error");
			if (isAuth(error)) return;
			document.getElementById("create-error-text").textContent =
				error.message || "Something went wrong. Try again.";
			document.getElementById("create-error").classList.remove("hidden");
		}
	});

	go(0, { focus: false });
	prefill();
})();
