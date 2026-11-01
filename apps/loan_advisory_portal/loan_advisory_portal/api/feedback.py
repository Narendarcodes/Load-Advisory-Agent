"""Borrower feedback about the advisory experience."""

import frappe
from frappe import _
from frappe.utils import now_datetime

from loan_advisory_portal.portal import limits
from loan_advisory_portal.portal.errors import Forbidden
from loan_advisory_portal.portal.identity import borrower_context, owned_application

CATEGORY_MAP = {
	"general": "General",
	"application": "Application",
	"decision": "Decision",
	"assistant": "Assistant",
	"chat": "Assistant",
	"voice": "Voice",
	"accessibility": "Other",
	"other": "Other",
}
MAX_MESSAGE = 4000


@frappe.whitelist(methods=["POST"])
def submit_feedback(rating, message: str, category: str = "general", application: str | None = None) -> dict:
	ctx = borrower_context()
	limits.enforce("feedback-submit", 20, 3600)
	try:
		rating = int(rating)
	except (TypeError, ValueError):
		raise Forbidden(_("Choose a rating between 1 and 5.")) from None
	if not 1 <= rating <= 5:
		raise Forbidden(_("Choose a rating between 1 and 5."))
	category = CATEGORY_MAP.get((category or "general").strip().lower())
	if not category:
		raise Forbidden(_("Unknown feedback category."))
	message = (message or "").strip()
	if not message or len(message) > MAX_MESSAGE:
		raise Forbidden(_("Write a short message (up to 4000 characters)."))
	if application:
		application = owned_application(application, ctx).name

	doc = frappe.get_doc(
		{
			"doctype": "Borrower Feedback",
			"user": ctx.user,
			"customer": ctx.customer,
			"application": application,
			"rating": rating,
			"category": category,
			"message": message,
			"status": "New",
			"submitted_at": now_datetime(),
		}
	)
	doc.flags.ignore_permissions = True
	doc.insert()
	return {"name": doc.name, "status": doc.status}


@frappe.whitelist()
def list_feedback() -> list[dict]:
	ctx = borrower_context()
	return frappe.get_all(
		"Borrower Feedback",
		filters={"user": ctx.user},
		fields=["name", "rating", "category", "message", "status", "application", "submitted_at"],
		order_by="creation desc",
		limit_page_length=50,
	)
