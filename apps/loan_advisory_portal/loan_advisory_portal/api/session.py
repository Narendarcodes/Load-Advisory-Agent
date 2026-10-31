"""Session identity for the borrower SPA and the CopilotKit gateway.

`me` is the single identity source: the browser renders from it and the Node
runtime calls it with the forwarded cookie to decide thread ownership. It never
returns another borrower's data because it only reads the caller's own records.
"""

import frappe

from loan_advisory_portal.portal.identity import (
	BORROWER_ROLE,
	borrower_context,
	clear_selected_application,
	owned_application,
	selected_application,
	set_selected_application,
)


@frappe.whitelist(allow_guest=True)
def me() -> dict:
	if frappe.session.user in (None, "", "Guest"):
		return {"authenticated": False}

	user = frappe.get_cached_doc("User", frappe.session.user)
	payload = {
		"authenticated": True,
		"user": user.name,
		"full_name": user.full_name,
		"email": user.email,
		"roles": [role for role in frappe.get_roles(user.name) if role != "All"],
		"is_borrower": BORROWER_ROLE in frappe.get_roles(user.name),
		"borrower": None,
		"selected_application": None,
	}

	if payload["is_borrower"]:
		ctx = borrower_context()
		profile = frappe.db.get_value(
			"Borrower Profile",
			ctx.profile,
			["onboarding_state", "profile_completion", "full_name"],
			as_dict=True,
		)
		payload["full_name"] = profile.full_name or payload["full_name"]
		payload["borrower"] = {
			"customer": ctx.customer,
			"profile": ctx.profile,
			"literacy": ctx.literacy,
			"locale": ctx.locale,
			"onboarding_state": profile.onboarding_state,
			"profile_completion": profile.profile_completion,
		}
		payload["selected_application"] = selected_application()

	return payload


@frappe.whitelist(methods=["POST"])
def select_application(application: str) -> dict:
	ctx = borrower_context()
	owned_application(application, ctx)
	set_selected_application(application)
	return {"selected_application": application}


@frappe.whitelist(methods=["POST"])
def clear_application() -> dict:
	borrower_context()
	clear_selected_application()
	return {"selected_application": None}
