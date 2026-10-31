from loan_advisory_portal.portal.pages import borrower_page

no_cache = 1
base_template_path = "templates/portal/base.html"


def get_context(context):
	return borrower_page(context, "applications", "My applications")
