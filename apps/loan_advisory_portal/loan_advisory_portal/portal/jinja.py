import frappe

from loan_advisory_portal.portal.identity import borrower_context


def _initials(name: str) -> str:
	parts = [part for part in (name or "").split() if part]
	if not parts:
		return "LA"
	if len(parts) == 1:
		return parts[0][:2].upper()
	return (parts[0][0] + parts[-1][0]).upper()


def portal_bootstrap() -> dict:
	"""Small, safe data island for the portal base template."""
	user = frappe.session.user
	context = {
		"user": user,
		"csrf_token": frappe.sessions.get_csrf_token(),
		"full_name": "",
		"initials": "LA",
		# Preview data is opt-in: a production site gets empty states, never fixtures.
		"demo": bool(
			frappe.conf.get("developer_mode") or frappe.conf.get("enable_demo_fixtures")
		),
	}
	if user == "Guest":
		return context
	context["full_name"] = frappe.db.get_value("User", user, "full_name") or user
	context["initials"] = _initials(context["full_name"])
	try:
		ctx = borrower_context()
	except Exception:
		return context
	profile_name = frappe.db.get_value("Borrower Profile", ctx.profile, "full_name")
	if profile_name:
		context["full_name"] = profile_name
		context["initials"] = _initials(profile_name)
	context.update(
		{
			"customer": ctx.customer,
			"literacy": ctx.literacy,
			"locale": ctx.locale,
			"profile": ctx.profile,
		}
	)
	return context
