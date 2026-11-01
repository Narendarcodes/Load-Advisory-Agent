/* Profile editing. Only the fields the server allows are sent back. */
(function () {
	"use strict";

	var Portal = window.Portal;
	var form = document.getElementById("profile-form");
	var saveButton = document.getElementById("save");

	function value(id) {
		return document.getElementById(id);
	}

	function fill(profile) {
		value("full-name").value = profile.full_name || "";
		value("email").value = profile.email || "";
		value("phone").value = profile.phone || "";
		value("employer").value = profile.employer || "";
		value("employment-type").value = profile.employment_type || "";
		value("employment-months").value =
			profile.employment_months === null || profile.employment_months === undefined
				? ""
				: profile.employment_months;
		value("monthly-income").value =
			profile.monthly_income === null || profile.monthly_income === undefined ? "" : profile.monthly_income;
		value("monthly-obligations").value =
			profile.monthly_obligations === null || profile.monthly_obligations === undefined
				? ""
				: profile.monthly_obligations;
		value("locale").value = profile.preferred_locale || "en";
		value("literacy").value = profile.literacy || "medium";
		value("consent-terms").checked = Boolean(profile.consent_terms);
		value("consent-privacy").checked = Boolean(profile.consent_privacy);
		document.getElementById("completion").textContent = (profile.profile_completion || 0) + "%";
	}

	function payload() {
		return {
			full_name: value("full-name").value.trim(),
			phone: value("phone").value.trim(),
			employer: value("employer").value.trim(),
			employment_type: value("employment-type").value,
			employment_months: value("employment-months").value,
			monthly_income: value("monthly-income").value,
			monthly_obligations: value("monthly-obligations").value,
			preferred_locale: value("locale").value,
			literacy: value("literacy").value,
			consent_terms: value("consent-terms").checked,
			consent_privacy: value("consent-privacy").checked,
		};
	}

	async function load() {
		try {
			fill(await Portal.call("loan_advisory_portal.api.profile.get_profile"));
		} catch (error) {
			if (error.status === 401 || error.status === 403) return;
			Portal.flash("error", "Could not load your profile", error.message);
		}
	}

	form.addEventListener("submit", async function (event) {
		event.preventDefault();
		if (!value("full-name").value.trim()) {
			value("full-name").setAttribute("aria-invalid", "true");
			value("full-name").focus();
			Portal.flash("error", "Your full name is required");
			return;
		}
		Portal.busy(saveButton, true, "Saving…");
		try {
			var profile = await Portal.call("loan_advisory_portal.api.profile.update_profile", payload());
			fill(profile);
			Portal.flash("success", "Profile saved", "New applications will use these details.");
		} catch (error) {
			if (error.status === 401 || error.status === 403) return;
			Portal.flash("error", "Could not save your profile", error.message);
		} finally {
			Portal.busy(saveButton, false);
		}
	});

	form.addEventListener("input", function (event) {
		event.target.removeAttribute("aria-invalid");
	});

	load();
})();
