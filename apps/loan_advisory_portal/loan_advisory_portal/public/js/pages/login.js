(function () {
	"use strict";

	var form = document.getElementById("login-form");
	if (!form) return;

	var email = document.getElementById("email");
	var password = document.getElementById("password");
	var button = document.getElementById("login-button");
	var errorBox = document.getElementById("login-error");
	var toggle = document.getElementById("toggle-password");
	var target = form.querySelector("input[name='redirect-to']").value || "/borrower";

	function showError(text) {
		errorBox.textContent = text;
		errorBox.hidden = false;
	}

	function clearError() {
		errorBox.hidden = true;
		errorBox.textContent = "";
	}

	toggle.addEventListener("click", function () {
		var showing = password.type === "text";
		password.type = showing ? "password" : "text";
		toggle.textContent = showing ? "Show" : "Hide";
		toggle.setAttribute("aria-pressed", showing ? "false" : "true");
	});

	form.addEventListener("submit", async function (event) {
		event.preventDefault();
		clearError();

		var user = email.value.trim();
		if (!user) {
			showError("Enter the email address your invitation was sent to.");
			email.focus();
			return;
		}
		if (!password.value) {
			showError("Enter your password.");
			password.focus();
			return;
		}

		Portal.busy(button, true, "Signing in…");
		try {
			await Portal.call("login", { usr: user, pwd: password.value });
			window.location.assign(target);
		} catch (err) {
			Portal.busy(button, false);
			if (err.status === 401) {
				showError("That email and password did not match. Check both, then try again.");
			} else if (err.status === 429) {
				showError("Too many attempts. Wait a moment before trying again.");
			} else {
				showError(err.message || "Sign in could not be completed. Try again.");
			}
			password.value = "";
			password.focus();
		}
	});
})();
