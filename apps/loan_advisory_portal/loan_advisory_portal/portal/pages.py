"""Shared context for the server-rendered borrower pages.

Pages are rendered by Frappe website routing: the module next to the template
exposes `get_context`, and the layout comes from `templates/portal/base.html`.
Everything user-specific is `no_cache`; the page shell is static and reads the
whitelisted JSON APIs, so the browser and the server share one code path.
"""

from urllib.parse import quote

import frappe

from loan_advisory_portal.portal.errors import PortalError
from loan_advisory_portal.portal.identity import borrower_context
from loan_advisory_portal.portal.jinja import portal_bootstrap


def is_guest() -> bool:
	return frappe.session.user in (None, "", "Guest")


def _request_target() -> str:
	request = getattr(frappe.local, "request", None)
	if not request:
		return "/borrower"
	query = request.query_string or b""
	if isinstance(query, bytes):
		query = query.decode("utf-8", "ignore")
	return request.path + (f"?{query}" if query else "")


def redirect_to_login():
	frappe.flags.redirect_location = "/login?redirect-to=" + quote(_request_target(), safe="")
	raise frappe.Redirect(302)


def redirect(url: str):
	frappe.flags.redirect_location = url
	raise frappe.Redirect(302)


def _shell(context, page: str, title: str, *, blocked: str | None = None) -> dict:
	context.no_cache = 1
	return {
		"boot": portal_bootstrap(),
		"active_page": page,
		"title": title,
		"blocked": blocked,
	}


def borrower_page(context, page: str, title: str) -> dict:
	"""Context for a signed-in borrower; non-borrowers get a blocking notice."""
	if is_guest():
		redirect_to_login()
	try:
		ctx = borrower_context()
	except PortalError as exc:
		# A signed-in account without borrower access should see why, not a
		# login loop that can never succeed.
		return _shell(context, page, title, blocked=str(exc))
	data = _shell(context, page, title)
	data["borrower"] = ctx
	return data


def guest_page(context, page: str, title: str) -> dict:
	"""Context for the invitation page; signed-in visitors go to their portal."""
	if not is_guest():
		redirect("/borrower")
	return _shell(context, page, title)


def public_page(context, page: str, title: str) -> dict:
	"""Context for pages both guests and accounts may read (help, notices, products).

	They carry no borrower data, so there is nothing to guard and nothing to leak;
	a signed-in account without borrower access can still read them.
	"""
	return _shell(context, page, title)
