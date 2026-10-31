import hashlib
from dataclasses import dataclass

import frappe
from frappe import _

from loan_advisory_portal.portal import preferences as vocabulary
from loan_advisory_portal.portal.errors import (
	Forbidden,
	NotFound,
	SelectionRequired,
	SignInRequired,
)

BORROWER_ROLE = "Loan Borrower"
SELECTION_PREFIX = "loan_advisory:selected_app:"
SELECTION_TTL_SECONDS = 4 * 3600


@dataclass(frozen=True)
class BorrowerContext:
	user: str
	customer: str
	profile: str
	literacy: str
	locale: str


def _require_user() -> str:
	user = frappe.session.user
	if not user or user == "Guest":
		raise SignInRequired(_("Sign in required."))
	if not frappe.db.get_value("User", user, "enabled"):
		raise SignInRequired(_("This account is unavailable."))
	return user


def borrower_context(*, require_role: bool = True) -> BorrowerContext:
	user = _require_user()
	if require_role and BORROWER_ROLE not in frappe.get_roles(user):
		raise Forbidden(_("This account has no borrower access."))

	profile = frappe.db.get_value(
		"Borrower Profile",
		{"user": user},
		["name", "customer", "status", "literacy", "preferred_locale"],
		as_dict=True,
	)
	if not profile:
		raise Forbidden(_("This account is not linked to a borrower profile."))
	if profile.status != "Active":
		raise Forbidden(_("This account is unavailable."))
	if not frappe.db.exists("Customer", profile.customer):
		raise Forbidden(_("This account is not linked to a customer."))
	if frappe.get_meta("Customer").has_field("disabled") and frappe.db.get_value(
		"Customer", profile.customer, "disabled"
	):
		raise Forbidden(_("This customer is disabled."))

	_assert_customer_link(user, profile.customer)

	return BorrowerContext(
		user=user,
		customer=profile.customer,
		profile=profile.name,
		literacy=vocabulary.normalise_literacy(profile.literacy),
		locale=vocabulary.normalise_locale(profile.preferred_locale),
	)


def _assert_customer_link(user: str, customer: str) -> None:
	"""Keep the legacy Customer.portal_users link authoritative when it exists."""
	links = frappe.get_all(
		"Portal User",
		filters={"parent": customer, "parenttype": "Customer", "parentfield": "portal_users"},
		fields=["user"],
	)
	if links and not any(link.user == user for link in links):
		raise Forbidden(_("This account is no longer linked to this customer."))


def owned_application(application_ref: str, ctx: BorrowerContext | None = None) -> dict:
	"""Return an application the borrower owns, or a 404 that hides foreign ids."""
	ctx = ctx or borrower_context()
	if not application_ref or not isinstance(application_ref, str):
		raise NotFound(_("Application not found."))
	doc = frappe.db.get_value(
		"Loan Application",
		application_ref,
		[
			"name",
			"applicant_type",
			"applicant",
			"status",
			"custom_lifecycle_state",
			"loan_product",
			"loan_amount",
			"repayment_periods",
			"posting_date",
			"custom_submitted_at",
			"custom_latest_evidence",
			"custom_policy_version",
			"custom_monthly_income",
			"custom_monthly_obligations",
			"custom_credit_score",
			"custom_employment_months",
			"custom_loan_purpose",
			"applicant_name",
			"applicant_email_address",
			"applicant_phone_number",
		],
		as_dict=True,
	)
	if not doc or doc.applicant_type != "Customer" or doc.applicant != ctx.customer:
		raise NotFound(_("Application not found."))
	return doc


def _selection_key() -> str:
	sid = frappe.session.sid or ""
	if not sid:
		raise SignInRequired(_("Sign in required."))
	return SELECTION_PREFIX + hashlib.sha256(sid.encode("utf-8")).hexdigest()


def set_selected_application(application_ref: str) -> None:
	frappe.cache().set_value(_selection_key(), application_ref, expires_in_sec=SELECTION_TTL_SECONDS)


def selected_application() -> str | None:
	return frappe.cache().get_value(_selection_key(), expires=True)


def clear_selected_application() -> None:
	frappe.cache().delete_value(_selection_key())


def require_selected_application() -> str:
	application_ref = selected_application()
	if not application_ref:
		raise SelectionRequired(_("Select an application first."))
	return application_ref


def on_user_update(doc, method=None):
	"""Mirror a disabled User onto the borrower profile."""
	if doc.enabled:
		return
	for name in frappe.get_all("Borrower Profile", filters={"user": doc.name}, pluck="name"):
		if frappe.db.get_value("Borrower Profile", name, "status") != "Suspended":
			frappe.db.set_value("Borrower Profile", name, "status", "Suspended", update_modified=True)
