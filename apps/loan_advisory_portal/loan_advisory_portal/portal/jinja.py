import frappe

from loan_advisory_portal.portal.identity import borrower_context


def portal_bootstrap() -> dict:
	"""Small, safe data island for the portal base template."""
	user = frappe.session.user
	context = {"user": user, "csrf_token": frappe.sessions.get_csrf_token()}
	if user == "Guest":
		return context
	try:
		ctx = borrower_context()
	except Exception:
		return context
	context.update(
		{
			"customer": ctx.customer,
			"literacy": ctx.literacy,
			"locale": ctx.locale,
			"profile": ctx.profile,
		}
	)
	return context
