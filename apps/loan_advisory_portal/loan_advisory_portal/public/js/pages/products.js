/* Indicative repayment calculator for the public product page.
   Arithmetic only: the rate comes from the configured product, nothing is persisted. */
(function () {
	"use strict";

	var node = document.getElementById("product-data");
	if (!node) return;
	var data = JSON.parse(node.textContent || "{}");
	var rate = Number(data.rate || 0);
	if (!rate) return;

	var amountInput = document.getElementById("calc-amount");
	var rangeInput = document.getElementById("calc-range");
	var tenureInput = document.getElementById("calc-tenure");
	var emiOut = document.getElementById("calc-emi");
	var principalOut = document.getElementById("calc-principal");
	var interestOut = document.getElementById("calc-interest");
	var totalOut = document.getElementById("calc-total");
	var money = new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		maximumFractionDigits: 0,
	});

	var MIN = 10000;
	var MAX = Number(data.maximum) > MIN ? Number(data.maximum) : 1000000;

	function clamp(value) {
		if (!isFinite(value)) return MIN;
		return Math.min(MAX, Math.max(MIN, Math.round(value)));
	}

	function calculate() {
		var principal = clamp(Number(amountInput.value));
		var months = Number(tenureInput.value) || 36;
		var monthly = rate / 12 / 100;
		var emi = monthly
			? (principal * monthly * Math.pow(1 + monthly, months)) / (Math.pow(1 + monthly, months) - 1)
			: principal / months;
		var total = emi * months;

		emiOut.textContent = money.format(Math.round(emi)) + " / month";
		principalOut.textContent = money.format(principal);
		interestOut.textContent = money.format(Math.round(total - principal));
		totalOut.textContent = money.format(Math.round(total));
	}

	function sync(source) {
		var value = clamp(Number(source.value));
		amountInput.value = value;
		rangeInput.value = value;
		calculate();
	}

	amountInput.addEventListener("input", function () {
		if (amountInput.value === "") return;
		sync(amountInput);
	});
	amountInput.addEventListener("blur", function () {
		sync(amountInput);
	});
	rangeInput.addEventListener("input", function () {
		sync(rangeInput);
	});
	tenureInput.addEventListener("change", calculate);

	calculate();
})();
