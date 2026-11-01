from frappe.utils import add_months, getdate, nowdate

from loan_advisory_portal.portal.pages import borrower_page

no_cache = 1
base_template_path = "templates/portal/base.html"


def get_context(context):
	context = borrower_page(context, "servicing", "Repayments")
	# Fixture dates are relative to today so the preview does not silently age.
	context["two_months_ago"] = getdate(add_months(nowdate(), -2)).strftime("%d %b %Y")
	context["last_month"] = getdate(add_months(nowdate(), -1)).strftime("%d %b %Y")
	context["next_due"] = getdate(add_months(nowdate(), 1)).strftime("%d %b %Y")
	context["following_due"] = getdate(add_months(nowdate(), 2)).strftime("%d %b %Y")
	return context
