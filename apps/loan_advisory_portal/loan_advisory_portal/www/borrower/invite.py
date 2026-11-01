from loan_advisory_portal.portal.pages import guest_page

no_cache = 1
base_template_path = "templates/portal/base.html"


def get_context(context):
	return guest_page(context, "invite", "Set up your account")
