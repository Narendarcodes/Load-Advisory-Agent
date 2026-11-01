/* Identity workspace preview. Everything here stays in the browser tab: there
   are no network calls, no storage and no claim that a check has happened. */
(function () {
	"use strict";

	var form = document.getElementById("kyc-form");
	if (!form) return;

	var panInput = document.getElementById("kyc-pan-input");
	var aadhaarInput = document.getElementById("kyc-aadhaar-input");
	var panMask = document.getElementById("kyc-pan-mask");
	var aadhaarMask = document.getElementById("kyc-aadhaar-mask");
	var cardPan = document.getElementById("card-pan");
	var cardAadhaar = document.getElementById("card-aadhaar");
	var panStatus = document.getElementById("pan-status");
	var aadhaarStatus = document.getElementById("aadhaar-status");
	var nextButton = document.getElementById("kyc-preview-next");
	var resetButton = document.getElementById("kyc-preview-reset");
	var finished = document.getElementById("kyc-finished");
	var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	var PAN_MASK = "••••••••••";
	var AADHAAR_MASK = "•••• •••• ••••";

	function maskPan(value) {
		return value ? "XXXXXX" + value.slice(-4) : PAN_MASK;
	}

	function maskAadhaar(value) {
		return value ? "XXXX XXXX " + value : AADHAAR_MASK;
	}

	function setBadge(node, text, kind) {
		node.textContent = text;
		node.className = "badge badge--" + (kind || "neutral");
	}

	function errorFor(input) {
		var wrapper = input.closest(".field");
		return wrapper ? wrapper.querySelector(".error") : null;
	}

	function showError(input, message) {
		input.setAttribute("aria-invalid", "true");
		var node = errorFor(input);
		if (node) {
			node.textContent = message;
			node.classList.remove("hidden");
		}
		input.focus();
	}

	function clearError(input) {
		input.removeAttribute("aria-invalid");
		var node = errorFor(input);
		if (node) node.classList.add("hidden");
	}

	function syncPan() {
		var clean = panInput.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
		if (panInput.value !== clean) panInput.value = clean;
		panMask.textContent = clean ? maskPan(clean) : "Not entered";
		cardPan.textContent = "PAN " + maskPan(clean);
		if (clean.length === 10) setBadge(panStatus, "Masked preview", "info");
		else if (clean.length) setBadge(panStatus, "In progress", "neutral");
		else setBadge(panStatus, "Not started", "neutral");
	}

	function syncAadhaar() {
		var digits = aadhaarInput.value.replace(/[^0-9]/g, "").slice(0, 4);
		if (aadhaarInput.value !== digits) aadhaarInput.value = digits;
		aadhaarMask.textContent = digits ? maskAadhaar(digits) : "Not entered";
		cardAadhaar.textContent = "Aadhaar " + maskAadhaar(digits);
		if (digits.length === 4) setBadge(aadhaarStatus, "Masked preview", "info");
		else if (digits.length) setBadge(aadhaarStatus, "In progress", "neutral");
		else setBadge(aadhaarStatus, "Not started", "neutral");
	}

	panInput.addEventListener("input", function () {
		syncPan();
		clearError(panInput);
		if (!finished.classList.contains("hidden")) resetPreview(false);
	});

	aadhaarInput.addEventListener("input", function () {
		syncAadhaar();
		clearError(aadhaarInput);
		if (!finished.classList.contains("hidden")) resetPreview(false);
	});

	function resetPreview(clearFields) {
		if (clearFields !== false) {
			panInput.value = "";
			aadhaarInput.value = "";
			syncPan();
			syncAadhaar();
		}
		finished.classList.add("hidden");
		nextButton.disabled = false;
		nextButton.textContent = "Preview the check";
		clearError(panInput);
		clearError(aadhaarInput);
	}

	nextButton.addEventListener("click", function () {
		if (panInput.value.length !== 10) {
			showError(panInput, "Enter a 10-character sample PAN to preview masking.");
			return;
		}
		clearError(panInput);
		if (aadhaarInput.value.length !== 4) {
			showError(aadhaarInput, "Enter 4 sample digits to preview Aadhaar masking.");
			return;
		}
		clearError(aadhaarInput);
		setBadge(panStatus, "Masked preview", "info");
		setBadge(aadhaarStatus, "Masked preview", "info");
		finished.classList.remove("hidden");
		nextButton.disabled = true;
		nextButton.textContent = "Preview complete";
		finished.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
	});

	resetButton.addEventListener("click", function () {
		resetPreview(true);
		panInput.focus();
	});

	syncPan();
	syncAadhaar();
})();
