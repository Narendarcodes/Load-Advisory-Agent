import frappe

from loan_advisory_portal.portal.errors import NotFound
from loan_advisory_portal.portal.identity import owned_application
from loan_advisory_portal.portal.pages import borrower_page, redirect

no_cache = 1
base_template_path = "templates/portal/base.html"


def get_context(context):
	context = borrower_page(context, "applications", "Application")
	if context.get("blocked"):
		return context

	reference = frappe.form_dict.get("name")
	if not reference:
		redirect("/borrower")

	# A foreign or unknown id is answered like a missing one, so the page never
	# confirms that someone else's application exists.
	try:
		context["application"] = owned_application(reference)
	except NotFound:
		context["not_found"] = True
		context["title"] = "Application not found"
		context["http_status_code"] = 404
		return context
	context["title"] = "Application"
	return context
