/* Invitation redemption: validate the one-time link, then create the account. */
(function () {
	"use strict";

	var Portal = window.Portal;
	var token = new URLSearchParams(window.location.search).get("token");
	/* The token is single-use and hashed at rest. Read it once, then drop it from the
	   address bar so it never lands in history, a bookmark or a later referrer. */
	if (token && window.history && window.history.replaceState) {
		window.history.replaceState(null, "", window.location.pathname);
	}
	var form = document.getElementById("invite-form");
	var createButton = document.getElementById("create");

	function show(id) {
		["invite-loading", "invite-invalid", "invite-form"].forEach(function (name) {
			document.getElementById(name).classList.toggle("hidden", name !== id);
		});
	}

	function invalid(message) {
		document.getElementById("invite-invalid-message").textContent =
			message || "This invitation may have expired or already been used.";
		show("invite-invalid");
	}

	function validateLink() {
		if (!token) {
			invalid("This page needs the link from your invitation.");
			return;
		}
		Portal.call("loan_advisory_portal.api.invitations.validate", { token: token })
			.then(function (claims) {
				document.getElementById("email").value = claims.email;
				document.getElementById("username").value = claims.suggested_username || "";
				document.getElementById("invite-expiry").textContent =
					"Invitation valid until " + Portal.date(claims.expires_at);
				show("invite-form");
				document.getElementById("full-name").focus();
			})
			.catch(function (error) {
				invalid(error.message);
			});
	}

	function mark(input, message) {
		input.setAttribute("aria-invalid", "true");
		input.focus();
		Portal.flash("error", message);
		return false;
	}

	form.addEventListener("input", function (event) {
		event.target.removeAttribute("aria-invalid");
	});

	form.addEventListener("submit", async function (event) {
		event.preventDefault();
		var fullName = document.getElementById("full-name");
		var username = document.getElementById("username");
		var password = document.getElementById("password");
		var confirm = document.getElementById("password-confirm");
		var terms = document.getElementById("consent-terms");
		var privacy = document.getElementById("consent-privacy");

		if (!fullName.value.trim()) return mark(fullName, "Enter your full name.");
		if (!username.value.trim()) return mark(username, "Choose a username.");
		if (password.value.length < 10) return mark(password, "Choose a password of at least 10 characters.");
		if (password.value !== confirm.value) return mark(confirm, "Both passwords must match.");
		if (!terms.checked || !privacy.checked) return mark(terms, "Accept the terms and the privacy notice to continue.");

		Portal.busy(createButton, true, "Creating…");
		try {
			await Portal.call("loan_advisory_portal.api.invitations.redeem", {
				token: token,
				full_name: fullName.value.trim(),
				username: username.value.trim(),
				phone: document.getElementById("phone").value.trim(),
				password: password.value,
				consent_terms: terms.checked ? 1 : 0,
				consent_privacy: privacy.checked ? 1 : 0,
			});
			window.location.assign("/borrower");
		} catch (error) {
			Portal.busy(createButton, false);
			Portal.flash("error", "Could not create your account", error.message);
			if (error.status === 409 && /username/i.test(error.message)) username.focus();
		}
	});

	validateLink();
})();
