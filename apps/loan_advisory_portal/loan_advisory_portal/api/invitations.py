"""Invitation endpoints.

Token validation and redemption are the only guest-accessible write paths in
the portal, so both are rate limited per IP and return generic failures.
"""

import frappe
from frappe.rate_limiter import rate_limit

from loan_advisory_portal.services import invitations as service


@frappe.whitelist(allow_guest=True, methods=["POST"])
@rate_limit(limit=20, seconds=3600, methods="POST")
def validate(token: str) -> dict:
	return service.validate_token(token)


@frappe.whitelist(allow_guest=True, methods=["POST"])
@rate_limit(limit=10, seconds=3600, methods="POST")
def redeem(
	token: str,
	full_name: str,
	password: str,
	username: str | None = None,
	phone: str | None = None,
	consent_terms: int | bool = 0,
	consent_privacy: int | bool = 0,
) -> dict:
	return service.redeem(
		token,
		full_name=full_name,
		password=password,
		username=username,
		phone=phone,
		consent_terms=bool(int(consent_terms)),
		consent_privacy=bool(int(consent_privacy)),
	)


@frappe.whitelist(methods=["POST"])
def issue(
	email: str,
	customer: str,
	application: str | None = None,
	expires_hours: int | None = None,
	note: str | None = None,
) -> dict:
	return service.issue_invitation(
		email, customer, application=application, expires_hours=expires_hours, note=note
	)


@frappe.whitelist(methods=["POST"])
def revoke(invitation: str) -> dict:
	return service.revoke_invitation(invitation)


@frappe.whitelist(methods=["GET", "POST"])
def list_invitations(customer: str | None = None, limit: int = 50) -> list[dict]:
	frappe.only_for(("System Manager",))
	filters = {}
	if customer:
		filters["customer"] = customer
	return frappe.get_all(
		"Account Invitation",
		filters=filters,
		fields=["name", "email", "customer", "application", "expires_at", "revoked", "redeemed", "issued_by", "creation"],
		order_by="creation desc",
		limit_page_length=min(int(limit or 50), 200),
	)
