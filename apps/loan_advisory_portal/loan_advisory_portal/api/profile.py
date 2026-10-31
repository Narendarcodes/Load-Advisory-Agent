"""Borrower self-service profile.

Edits never rewrite submitted applications: an application is a snapshot of the
inputs that were scored, so changing the profile afterwards cannot alter an
existing decision.
"""

import frappe
from frappe import _
from frappe.utils import now_datetime, validate_phone_number_with_country_code

from loan_advisory_portal.portal import legal, limits
from loan_advisory_portal.portal import preferences as vocabulary
from loan_advisory_portal.portal.errors import Forbidden
from loan_advisory_portal.portal.identity import borrower_context

EDITABLE = {
	"full_name",
	"phone",
	"employment_type",
	"employer",
	"employment_months",
	"monthly_income",
	"monthly_obligations",
	"preferred_locale",
	"literacy",
	"consent_terms",
	"consent_privacy",
}

EMPLOYMENT_TYPES = {"", "Salaried", "Self-employed", "Business", "Student", "Retired", "Unemployed"}
LOCALES = set(vocabulary.LOCALES)
LITERACY = set(vocabulary.LITERACIES)


def _profile_doc(ctx):
	return frappe.get_doc("Borrower Profile", ctx.profile)


@frappe.whitelist()
def get_profile() -> dict:
	return _serialise(_profile_doc(borrower_context()))


@frappe.whitelist(methods=["POST"])
def update_profile(**values) -> dict:
	ctx = borrower_context()
	limits.enforce("profile-update", 60, 3600)
	# frappe.call() forwards the whole request dict to **kwargs, including `cmd`.
	values.pop("cmd", None)
	unknown = set(values) - EDITABLE
	if unknown:
		raise Forbidden(_("These fields cannot be changed here: {0}").format(", ".join(sorted(unknown))))

	if "full_name" in values:
		name = (values["full_name"] or "").strip()
		if not 1 <= len(name) <= 140:
			raise Forbidden(_("Enter your full name."))
		values["full_name"] = name
	if "phone" in values:
		phone = str(values["phone"] or "").strip()
		if len(phone) > 40:
			raise Forbidden(_("This phone number is too long."))
		if phone:
			try:
				validate_phone_number_with_country_code(phone, "phone")
			except frappe.ValidationError:
				raise Forbidden(_("Enter a phone number with country code, e.g. +91 98765 43210.")) from None
		values["phone"] = phone or None
	if "employment_type" in values and values["employment_type"] not in EMPLOYMENT_TYPES:
		raise Forbidden(_("Unknown employment type."))
	if "preferred_locale" in values:
		locale = vocabulary.canonical_locale(values["preferred_locale"])
		if locale is None:
			raise Forbidden(_("Unsupported language."))
		values["preferred_locale"] = locale
	if "literacy" in values:
		literacy = vocabulary.canonical_literacy(values["literacy"])
		if literacy is None:
			raise Forbidden(_("Unsupported reading preference."))
		values["literacy"] = literacy
	for field in ("monthly_income", "monthly_obligations"):
		if field in values and values[field] not in (None, ""):
			try:
				values[field] = float(values[field])
			except (TypeError, ValueError):
				raise Forbidden(_("Enter a valid amount.")) from None
			if values[field] < 0:
				raise Forbidden(_("Amounts cannot be negative."))
	if "employment_months" in values and values["employment_months"] not in (None, ""):
		try:
			values["employment_months"] = int(values["employment_months"])
		except (TypeError, ValueError):
			raise Forbidden(_("Enter a whole number of months.")) from None
		if not 0 <= values["employment_months"] <= 720:
			raise Forbidden(_("Enter months between 0 and 720."))

	profile = _profile_doc(ctx)
	# An acceptance records the notice version that was on screen at the time; withdrawing
	# consent clears it, so a stored version always means "accepted this text".
	for consent, version in (
		("consent_terms", legal.TERMS_VERSION),
		("consent_privacy", legal.PRIVACY_VERSION),
	):
		if consent in values:
			accepted = 1 if values[consent] in (True, 1, "1") else 0
			values[consent] = accepted
			profile.set(consent.replace("consent_", "") + "_version", version if accepted else None)
			if accepted:
				profile.consent_at = now_datetime()
	for field, value in values.items():
		profile.set(field, 1 if value is True else 0 if value is False else value)
	profile.save(ignore_permissions=True)
	return _serialise(profile)


def _serialise(profile) -> dict:
	return {
		"name": profile.name,
		"customer": profile.customer,
		"status": profile.status,
		"onboarding_state": profile.onboarding_state,
		"full_name": profile.full_name,
		"email": profile.email,
		"phone": profile.phone,
		"employment_type": profile.employment_type,
		"employer": profile.employer,
		"employment_months": profile.employment_months,
		"monthly_income": profile.monthly_income,
		"monthly_obligations": profile.monthly_obligations,
		"preferred_locale": vocabulary.normalise_locale(profile.preferred_locale),
		"literacy": vocabulary.normalise_literacy(profile.literacy),
		"consent_terms": profile.consent_terms,
		"consent_privacy": profile.consent_privacy,
		"terms_version": profile.get("terms_version") or "",
		"privacy_version": profile.get("privacy_version") or "",
		"profile_completion": profile.profile_completion,
	}
