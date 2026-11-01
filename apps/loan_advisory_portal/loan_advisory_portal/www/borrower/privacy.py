from loan_advisory_portal.portal import legal
from loan_advisory_portal.portal.pages import public_page

no_cache = 1
base_template_path = "templates/portal/base.html"


def get_context(context):
	context = public_page(context, "privacy", "Privacy notice")
	context["version"] = legal.PRIVACY_VERSION
	context["terms_version"] = legal.TERMS_VERSION
	context["updated"] = legal.UPDATED
	return context
