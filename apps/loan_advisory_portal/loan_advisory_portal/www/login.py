from urllib.parse import unquote

import frappe

from loan_advisory_portal.portal.pages import public_page, redirect

no_cache = 1
base_template_path = "templates/portal/base.html"

SAFE_FALLBACK = "/borrower"


def _safe_target(value: str) -> str:
	"""Only allow same-site relative paths as a post-login destination."""
	target = unquote(value or "").strip()
	if not target.startswith("/") or target.startswith("//") or "\\" in target:
		return SAFE_FALLBACK
	if target.startswith("/login") or target.startswith("/api/"):
		return SAFE_FALLBACK
	return target


def get_context(context):
	context = public_page(context, "login", "Sign in")
	target = _safe_target(frappe.form_dict.get("redirect-to") or "")
	if frappe.session.user not in (None, "", "Guest"):
		redirect(target)
	context["redirect_to"] = target
	context["demo"] = context["boot"].get("demo", False)
	return context
