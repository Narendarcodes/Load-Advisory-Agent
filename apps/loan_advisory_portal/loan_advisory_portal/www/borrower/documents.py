import frappe

from loan_advisory_portal.portal.pages import borrower_page

no_cache = 1
base_template_path = "templates/portal/base.html"


def get_context(context):
	context = borrower_page(context, "documents", "Documents")
	context["requested_application"] = frappe.form_dict.get("name") or ""
	context["created"] = frappe.form_dict.get("created") == "1"
	return context
