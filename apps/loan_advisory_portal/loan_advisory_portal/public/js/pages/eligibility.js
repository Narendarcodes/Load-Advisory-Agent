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
			Salaried: ["Months in your current job", "Count from your first day with this employer. Enter 0 for less than a month."],
			"Self-employed": ["Months self-employed", "Count from when you started working for yourself."],
			Business: ["Months running your business", "Count from when the business began trading."],
			Student: ["Months in your current course", "Enter 0 if you started less than a month ago."],
			Retired: ["Months since you retired", "An approximate figure is fine."],
			Unemployed: ["Months since your last job", "An approximate figure is fine."],
		};
		var entry = copy[type] || ["Months in your current situation", "An approximate figure is fine."];
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
		return demo ? '<span class="demo-flag">Demo data</span>' : "";
	}

	function renderCalculating() {
		panel.innerHTML =
			'<div class="row row--between"><span class="badge badge--brand">Indicative</span>' +
			demoFlag() +
			"</div>" +
			'<h2>Calculating…</h2>' +
			'<p class="result-card__amount skeleton" aria-hidden="true">₹0</p>' +
			'<p class="skeleton" aria-hidden="true">Preparing your estimate</p>' +
			'<p class="small muted">This takes a moment. Nothing is sent anywhere.</p>';
	}

	function renderUnavailable() {
		panel.innerHTML =
			'<div class="row row--between"><span class="badge badge--neutral">Not available yet</span></div>' +
			"<h2>We cannot show an estimate right now</h2>" +
			'<p class="small muted">The indicative calculator is not connected to a calculation service on this site. You can still start a formal application and the team will assess it against the lending policy.</p>' +
			'<div class="alert alert--info"><strong>No result was produced</strong><span>Nothing was checked and no application was created.</span></div>' +
			'<div class="form-actions"><a class="btn" href="' +
			esc(applicationLink(readInputs())) +
			'">Start a formal application</a><a class="btn btn--ghost" href="/borrower/assistant">Ask the advisor</a></div>';
	}

	function renderUnable(input, reason) {
		var body =
			reason === "commitments"
				? "Your existing monthly repayments use all of the income you entered, so there is no room for a new instalment."
				: "With the income and commitments you entered, the estimated borrowing is below the smallest amount this product supports.";
		panel.innerHTML =
			'<div class="row row--between"><span class="badge badge--warn">Outside the range</span>' +
			demoFlag() +
			"</div>" +
			"<h2>We could not produce a usable estimate</h2>" +
			'<p class="small muted">' +
			esc(body) +
			"</p>" +
			"<div>" +
			"<h3>What you can do</h3>" +
			'<ul class="result-factors">' +
			"<li>Check the income and repayment figures you entered</li>" +
			"<li>Try a smaller amount or a longer tenure</li>" +
			"<li>Ask the advisor what usually helps an application</li>" +
			"</ul>" +
			"</div>" +
			renderDemoNote() +
			'<div class="form-actions"><a class="btn" href="' +
			esc(applicationLink(input)) +
			'">Start a formal application</a><a class="btn btn--ghost" href="/borrower/assistant">Ask the advisor</a></div>';
	}

	function renderDemoNote() {
		if (!demo) return "";
		return (
			'<div class="alert alert--warn"><strong>DEMO estimate</strong>' +
			"<span>This figure comes from a development fixture using the values above. It is not a real eligibility decision, no credit bureau was contacted and no loan is promised. Production borrowers see the unavailable state instead.</span></div>"
		);
	}

	function renderResult(result) {
		var input = result.input;
		var requestedEmi = emiFor(input.amount, input.tenure);
		var factors = [
			"Monthly net income of " + inr(input.income),
			"Existing monthly repayments of " + inr(input.obligations),
			input.employment + " for " + input.months + (input.months === 1 ? " month" : " months"),
			"A " + input.tenure + " month tenure at the product rate of " + rate + "% a year",
		];
		if (input.amount > result.high) {
			factors.push("The amount you asked for is above this indicative range");
		}

		panel.innerHTML =
			'<div class="row row--between"><span class="badge badge--brand">Indicative</span>' +
			demoFlag() +
			"</div>" +
			"<div>" +
			'<p class="tiny muted">Possible borrowing range</p>' +
			'<p class="result-card__amount">' +
			inr(result.low) +
			" – " +
			inr(result.high) +
			"</p>" +
			'<p class="result-card__caption">Based on the details you entered. Not an approval and not a promise of this amount.</p>' +
			"</div>" +
			'<dl class="detail detail--rows">' +
			"<div><dt>Amount requested</dt><dd>" +
			inr(input.amount) +
			"</dd></div>" +
			"<div><dt>Tenure</dt><dd>" +
			input.tenure +
			" months</dd></div>" +
			"<div><dt>Estimated repayment at your request</dt><dd>" +
			inr(requestedEmi) +
			" a month</dd></div>" +
			"<div><dt>Product rate</dt><dd>" +
			rate +
			"% a year</dd></div>" +
			"</dl>" +
			"<div><h3>What shaped this</h3><ul class=\"result-factors\">" +
			factors
				.map(function (factor) {
					return "<li>" + esc(factor) + "</li>";
				})
				.join("") +
			"</ul></div>" +
			"<div><h3>What this leaves out</h3>" +
			'<p class="small muted">Fees or charges in a final offer, changes to the product rate, your credit history, and anything you did not enter here. The estimate assumes equal monthly repayments on a reducing balance.</p></div>' +
			renderDemoNote() +
			"<div>" +
			"<h3>Next steps</h3>" +
			'<p class="small muted">Start a formal application when you are ready. It asks for more detail, checks your documents and is assessed against the lending policy. You can also ask the advisor to explain this estimate.</p>' +
			"</div>" +
			'<div class="form-actions"><a class="btn" href="' +
			esc(applicationLink(input)) +
			'">Start a formal application</a><a class="btn btn--ghost" href="/borrower/assistant">Ask the advisor</a></div>';
	}

	function handleSubmit(event) {
		event.preventDefault();
		if (!validate()) return;
		clearStale();
		hasResult = true;
		Portal.busy(submit, true, "Calculating…");
		renderCalculating();
		if (timer) window.clearTimeout(timer);
		timer = window.setTimeout(function () {
			Portal.busy(submit, false);
			if (!demo) {
				renderUnavailable();
				return;
			}
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
			panel.innerHTML =
				"<h2>Nothing calculated yet</h2>" +
				'<p class="small muted">Fill in the three sections and choose Estimate eligibility. You can change any answer and recalculate.</p>' +
				"<div><h3>What the estimate uses</h3><ul class=\"result-factors\">" +
				"<li>The amount and tenure you choose</li><li>Your monthly income and existing repayments</li>" +
				"<li>Your employment type and time in work</li><li>The current product rate</li></ul></div>" +
				'<div class="alert alert--info"><strong>This is not an approval</strong><span>It does not check your credit file, ask for identity numbers or run a credit bureau enquiry.</span></div>';
			prefill();
		}, 0);
	});

	syncAmount(amount);
	updateEmploymentCopy();
	prefill();
})();
