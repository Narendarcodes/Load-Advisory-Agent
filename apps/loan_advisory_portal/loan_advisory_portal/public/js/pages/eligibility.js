/* Indicative eligibility workspace.

   There is no eligibility engine behind this page yet. When no engine is
   configured the page says so and points to the formal application. In a
   development site only, a clearly labelled fixture produces a sample result so
   the screens can be reviewed. It never claims a credit check happened. */
(function () {
	"use strict";

	var Portal = window.Portal;
	var node = document.getElementById("eligibility-data");
	if (!node) return;

	var data = JSON.parse(node.textContent || "{}");
	var product = data.product || {};
	var demo = Boolean(data.demo);
	var rate = Number(product.rate || 0);
	var cap = Number(product.maximum || 0);

	var form = document.getElementById("eligibility-form");
	var amount = document.getElementById("el-amount");
	var range = document.getElementById("el-range");
	var tenure = document.getElementById("el-tenure");
	var purpose = document.getElementById("el-purpose");
	var income = document.getElementById("el-income");
	var obligations = document.getElementById("el-obligations");
	var months = document.getElementById("el-months");
	var monthsLabel = document.getElementById("el-months-label");
	var monthsHint = document.getElementById("el-months-hint");
	var panel = document.getElementById("result-panel");
	var staleNote = document.getElementById("result-stale");
	var submit = document.getElementById("el-submit");
	var hasResult = false;
	var timer = null;

	var money = new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		maximumFractionDigits: 0,
	});

	function esc(value) {
		return Portal.esc(value);
	}

	function inr(value) {
		return money.format(Math.round(Number(value) || 0));
	}

	function number(value) {
		var parsed = Number(value);
		return isFinite(parsed) ? parsed : NaN;
	}

	function error(id, show) {
		var node = document.getElementById(id);
		if (node) node.classList.toggle("hidden", !show);
	}

	function markStale() {
		if (!hasResult) return;
		if (staleNote) staleNote.classList.remove("hidden");
		panel.classList.add("is-stale");
	}

	function clearStale() {
		if (staleNote) staleNote.classList.add("hidden");
		panel.classList.remove("is-stale");
	}

	function selectedEmployment() {
		var checked = form.querySelector('input[name="employment_type"]:checked');
		return checked ? checked.value : "";
	}

	function updateEmploymentCopy() {
		var type = selectedEmployment();
		var copy = {
			Salaried: ["Months in your current job", "0 if under a month."],
			"Self-employed": ["Months self-employed", "Approximate is fine."],
			Business: ["Months running your business", "Approximate is fine."],
			Student: ["Months in your current course", "0 if under a month."],
			Retired: ["Months since you retired", "Approximate is fine."],
			Unemployed: ["Months since your last job", "Approximate is fine."],
		};
		var entry = copy[type] || ["Months in your current situation", "Approximate is fine."];
		monthsLabel.textContent = entry[0];
		monthsHint.textContent = entry[1];
	}

	function clampAmount(value) {
		var max = cap || 1000000;
		if (!isFinite(value)) return 10000;
		return Math.min(max, Math.max(10000, Math.round(value)));
	}

	function syncAmount(source) {
		var value = clampAmount(number(source.value));
		amount.value = value;
		range.value = value;
	}

	function emiFor(principal, n) {
		var monthly = rate / 1200;
		if (!monthly) return principal / n;
		return (principal * monthly * Math.pow(1 + monthly, n)) / (Math.pow(1 + monthly, n) - 1);
	}

	function validate() {
		var ok = true;
		var firstInvalid = null;

		function fail(field, id) {
			ok = false;
			error(id, true);
			if (field) {
				field.setAttribute("aria-invalid", "true");
				if (!firstInvalid) firstInvalid = field;
			}
		}

		function pass(field, id) {
			error(id, false);
			if (field) field.removeAttribute("aria-invalid");
		}

		var amountValue = number(amount.value);
		if (!amountValue || amountValue < 10000 || (cap && amountValue > cap)) fail(amount, "el-amount-error");
		else pass(amount, "el-amount-error");

		if (!selectedEmployment()) fail(null, "el-employment-error");
		else {
			error("el-employment-error", false);
			form.querySelectorAll('input[name="employment_type"]').forEach(function (radio) {
				radio.removeAttribute("aria-invalid");
			});
		}

		var monthsValue = number(months.value);
		if (months.value === "" || !Number.isInteger(monthsValue) || monthsValue < 0 || monthsValue > 720) {
			fail(months, "el-months-error");
		} else pass(months, "el-months-error");

		var incomeValue = number(income.value);
		if (!incomeValue || incomeValue <= 0) fail(income, "el-income-error");
		else pass(income, "el-income-error");

		var obligationsValue = number(obligations.value);
		if (obligations.value === "" || !isFinite(obligationsValue) || obligationsValue < 0) {
			fail(obligations, "el-obligations-error");
		} else pass(obligations, "el-obligations-error");

		if (firstInvalid) firstInvalid.focus();
		return ok;
	}

	function readInputs() {
		return {
			amount: number(amount.value),
			tenure: Number(tenure.value) || 36,
			purpose: purpose.value,
			income: number(income.value),
			obligations: number(obligations.value),
			employment: selectedEmployment(),
			months: number(months.value),
		};
	}

	function estimate(input) {
		var disposable = input.income - input.obligations;
		if (disposable <= 0) return { status: "unable", reason: "commitments" };

		var capacity = disposable * 0.45;
		var monthly = rate / 1200;
		var supported = monthly
			? (capacity * (1 - Math.pow(1 + monthly, -input.tenure))) / monthly
			: capacity * input.tenure;
		var eligible = cap ? Math.min(supported, cap) : supported;
		var high = Math.floor(eligible / 5000) * 5000;
		if (high < 25000) return { status: "outside" };

		var low = Math.max(25000, Math.floor((high * 0.85) / 5000) * 5000);
		if (low > high) low = high;
		return { status: "ok", low: low, high: high, input: input };
	}

	function applicationLink(input) {
		var parts = ["amount=" + encodeURIComponent(input.amount), "tenure=" + encodeURIComponent(input.tenure)];
		if (input.purpose) parts.push("purpose=" + encodeURIComponent(input.purpose));
		return "/borrower/apply?" + parts.join("&");
	}

	function demoFlag() {
		return "";
	}

	var ART = "/assets/loan_advisory_portal/illustrations/";

	/* v3 result layout: illustration, status badge, one headline, then hairline sections.
	   The illustration sits on the plain surface; the estimate itself is the key card (white, hairline). */
	function head(art, badge, title, lead, amount) {
		return (
			'<div class="result-head">' +
			'<img class="result-head__art" src="' + ART + art + '.svg" alt="" width="120" height="90">' +
			'<div class="result-head__text">' +
			'<p class="result-head__status">' + badge + demoFlag() + "</p>" +
			"<h2>" + title + "</h2>" +
			(amount ? "" : lead ? '<p class="small muted">' + lead + "</p>" : "") +
			"</div>" +
			// The range gets the full panel width so "₹4,80,000 – ₹5,70,000" stays on one line.
			(amount
				? '<div class="result-head__amount estimate-card key-card"><p class="result-card__amount">' + amount + "</p>" +
				  (lead ? '<p class="small muted">' + lead + "</p>" : "") + "</div>"
				: "") +
			"</div>"
		);
	}

	function section(title, body) {
		return '<section class="result-section"><h3>' + title + "</h3>" + body + "</section>";
	}

	function list(items) {
		return (
			'<ul class="result-factors">' +
			items
				.map(function (item) {
					return "<li>" + esc(item) + "</li>";
				})
				.join("") +
			"</ul>"
		);
	}

	function actions(input) {
		return (
			'<div class="result-actions"><a class="btn" href="' +
			esc(applicationLink(input)) +
			'">Start a formal application</a><a class="link-quiet" href="/borrower/assistant">Ask the advisor about it</a></div>'
		);
	}

	function idleHtml() {
		return (
			head(
				"eligibility",
				'<span class="badge badge--neutral">Not calculated yet</span>',
				"Your estimate appears here",
				"Fill in the form and choose Estimate."
			)
		);
	}

	/* Loading: the same shape as the result, in quiet blocks. No time is promised: it runs on this page. */
	function renderCalculating() {
		panel.setAttribute("aria-busy", "true");
		panel.innerHTML =
			'<div class="result-head">' +
			/* No scene while it works: a quiet block holds the scene's place so nothing jumps. */
			'<span class="skeleton result-head__art" aria-hidden="true"></span>' +
			'<div class="result-head__text">' +
			'<p class="result-head__status"><span class="badge badge--neutral">Working it out</span>' + demoFlag() + "</p>" +
			"<h2>Working out your estimate</h2>" +

			"</div></div>" +
			'<div class="result-section" aria-hidden="true">' +
			'<span class="skeleton skeleton--line skeleton--w40"></span>' +
			'<span class="skeleton skeleton--amount"></span>' +
			'<span class="skeleton skeleton--line skeleton--w70"></span>' +
			"</div>" +
			'<div class="result-section" aria-hidden="true">' +
			'<span class="skeleton skeleton--row"></span><span class="skeleton skeleton--row"></span><span class="skeleton skeleton--row"></span>' +
			"</div>";
	}

	function done() {
		panel.removeAttribute("aria-busy");
	}

	/* Once a result shows, its "Start a formal application" is the page's one coral action, so the
	   form button steps back to a quiet Recalculate. Clear brings the original button back. */
	function setRecalculate(on) {
		submit.classList.toggle("btn--ghost", on);
		submit.textContent = on ? "Recalculate" : "Estimate";
	}

	function renderUnavailable() {
		done();
		panel.innerHTML =
			head(
				"service-unavailable",
				'<span class="badge badge--neutral">Not available yet</span>',
				"We cannot show an estimate right now",
				"The estimate is not switched on for this site yet. You can still start a formal application and the team will assess it against the lending policy."
			) +
			section("What happened", '<p class="small muted">No result was produced. Nothing was checked and no application was created.</p>') +
			actions(readInputs());
	}

	function renderUnable(input, reason) {
		done();
		var body =
			reason === "commitments"
				? "Your existing monthly repayments use all of the income you entered, so there is no room for a new instalment."
				: "With the income and commitments you entered, the estimated borrowing is below the smallest amount this product supports.";
		panel.innerHTML =
			head(
				"eligibility-outside",
				'<span class="badge badge--warn">Outside the range</span>',
				"We could not produce a usable estimate",
				esc(body)
			) +
			section("Your figures", '<dl class="detail detail--rows">' +
				"<div><dt>Monthly net income</dt><dd>" + inr(input.income) + "</dd></div>" +
				"<div><dt>Existing monthly repayments</dt><dd>" + inr(input.obligations) + "</dd></div>" +
				"<div><dt>Tenure</dt><dd>" + input.tenure + " months</dd></div></dl>") +
			section("What you can do", list([
				"Check the income and repayment figures you entered",
				"Try a smaller amount or a longer tenure",
				"Ask the advisor what usually helps an application",
			])) +
			renderDemoNote() +
			actions(input);
	}

	function renderDemoNote() {
		return "";
	}

	function renderResult(result) {
		done();
		var input = result.input;
		var requestedEmi = emiFor(input.amount, input.tenure);
		var room = Math.max(0, input.income - input.obligations) * 0.45;
		var factors = [
			"After your existing repayments of " + inr(input.obligations) + ", about " + inr(room) +
				" a month is used as the most a new repayment could be (45% of what is left from " + inr(input.income) + ").",
			"Spread over " + input.tenure + " months at the product rate of " + rate + "% a year, that repayment supports up to " + inr(result.high) + ".",
			input.employment + " for " + input.months + (input.months === 1 ? " month" : " months") + ". Time in work is checked in a formal application.",
		];
		if (input.amount > result.high) {
			factors.push("The " + inr(input.amount) + " you asked for is above this range. A smaller amount or a longer tenure would fit better.");
		}
		var within = input.amount <= result.high;

		panel.innerHTML =
			head(
				"eligibility-result",
				'<span class="badge ' + (within ? "badge--ok" : "badge--warn") + '">' + (within ? "Your request fits the range" : "Above the range") + "</span>",
				'You may be able to borrow',
				"An estimate, not an approval.",
				'<span class="nowrap">' + inr(result.low) + '</span> – <span class="nowrap">' + inr(result.high) + "</span>"
			) +
			'<dl class="detail detail--rows result-section">' +
			"<div><dt>Amount you asked for</dt><dd>" + inr(input.amount) + "</dd></div>" +
			"<div><dt>Tenure</dt><dd>" + input.tenure + " months</dd></div>" +
			"<div><dt>Estimated repayment for that amount</dt><dd>" + inr(requestedEmi) + " a month</dd></div>" +
			"<div><dt>Product rate</dt><dd>" + rate + "% a year</dd></div>" +
			"</dl>" +
			section("Why this range", list(factors)) +
			'<p class="small muted">Leaves out fees, rate changes and your credit history.</p>' +
			actions(input);
	}

	function handleSubmit(event) {
		event.preventDefault();
		if (!validate()) return;
		clearStale();
		hasResult = true;
		Portal.busy(submit, true, "Calculating…");
		renderCalculating();
		// On phones the result sits below the form: bring it into view (no smooth scroll; respects reduced motion).
		if (window.matchMedia && window.matchMedia("(max-width: 980px)").matches) panel.scrollIntoView({ block: "start" });
		if (timer) window.clearTimeout(timer);
		timer = window.setTimeout(function () {
			Portal.busy(submit, false);
			setRecalculate(true);
			var input = readInputs();
			var result = estimate(input);
			if (result.status === "ok") renderResult(result);
			else renderUnable(input, result.reason);
		}, 320);
	}

	function prefill() {
		Portal.call("loan_advisory_portal.api.profile.get_profile")
			.then(function (profile) {
				if (!profile) return;
				if (profile.monthly_income) income.value = Math.round(profile.monthly_income);
				if (profile.monthly_obligations !== null && profile.monthly_obligations !== undefined) {
					obligations.value = Math.round(profile.monthly_obligations);
				}
				if (profile.employment_months !== null && profile.employment_months !== undefined) {
					months.value = profile.employment_months;
				}
				if (profile.employment_type) {
					var radio = form.querySelector(
						'input[name="employment_type"][value="' + profile.employment_type.replace(/"/g, "") + '"]'
					);
					if (radio) radio.checked = true;
				}
				updateEmploymentCopy();
			})
			.catch(function () {
				/* Prefill is a convenience; the form still works without it. */
			});
	}

	amount.addEventListener("input", function () {
		if (amount.value !== "") syncAmount(amount);
	});
	amount.addEventListener("blur", function () {
		syncAmount(amount);
	});
	range.addEventListener("input", function () {
		syncAmount(range);
	});

	form.querySelectorAll('input[name="employment_type"]').forEach(function (radio) {
		radio.addEventListener("change", function () {
			updateEmploymentCopy();
			error("el-employment-error", false);
		});
	});

	form.addEventListener("input", markStale);
	form.addEventListener("change", markStale);
	form.addEventListener("submit", handleSubmit);
	form.addEventListener("reset", function () {
		window.setTimeout(function () {
			amount.value = 300000;
			range.value = 300000;
			obligations.value = 0;
			months.value = "";
			income.value = "";
			updateEmploymentCopy();
			clearStale();
			hasResult = false;
			setRecalculate(false);
			panel.innerHTML = idleHtml();
			prefill();
		}, 0);
	});

	syncAmount(amount);
	updateEmploymentCopy();
	prefill();
})();
