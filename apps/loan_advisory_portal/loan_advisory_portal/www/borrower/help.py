from loan_advisory_portal.portal import guidance, legal, lifecycle
from loan_advisory_portal.portal.pages import public_page

no_cache = 1
base_template_path = "templates/portal/base.html"


def get_context(context):
	context = public_page(context, "help", "Help")
	context["terms_version"] = legal.TERMS_VERSION
	context["privacy_version"] = legal.PRIVACY_VERSION
	context["updated"] = legal.UPDATED
	# The status vocabulary is the same text the application page shows, so the two
	# pages cannot drift apart.
	context["states"] = [guidance.for_state(state) for state in lifecycle.STATES]
	return context
