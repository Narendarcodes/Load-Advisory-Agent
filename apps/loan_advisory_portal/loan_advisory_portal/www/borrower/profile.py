from loan_advisory_portal.portal import preferences as vocabulary
from loan_advisory_portal.portal.pages import borrower_page

no_cache = 1
base_template_path = "templates/portal/base.html"


def get_context(context):
	context = borrower_page(context, "profile", "Your profile")
	borrower = context.get("borrower")
	context["locale_options"] = vocabulary.locale_options()
	context["literacy_options"] = vocabulary.literacy_options()
	context["current_locale"] = borrower.locale if borrower else vocabulary.DEFAULT_LOCALE
	context["current_literacy"] = borrower.literacy if borrower else vocabulary.DEFAULT_LITERACY
	return context
