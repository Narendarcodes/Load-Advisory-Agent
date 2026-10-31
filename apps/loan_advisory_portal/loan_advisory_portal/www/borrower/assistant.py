import frappe

from loan_advisory_portal.api import applications as applications_api
from loan_advisory_portal.portal.errors import NotFound, ServiceUnavailable
from loan_advisory_portal.portal.identity import owned_application, selected_application
from loan_advisory_portal.portal.pages import borrower_page
from loan_advisory_portal.services import assertion, livekit_token

no_cache = 1
base_template_path = "templates/portal/base.html"


def get_context(context):
	context = borrower_page(context, "assistant", "Assistant")
	if context.get("blocked"):
		return context

	requested = (frappe.form_dict.get("application") or "").strip()
	reference = requested or selected_application()
	application = None
	if reference:
		try:
			application = owned_application(reference)
		except NotFound:
			# Like the application page, a foreign id is answered as a missing one.
			if requested:
				context["not_found"] = True
				context["title"] = "Application not found"
				context["http_status_code"] = 404
				return context
			# A stale selection is not an error: the borrower simply picks again.

	context["application"] = application
	if not application:
		context["applications"] = applications_api.list_applications()
		return context

	# The same translation `mint_assertion` applies to the profile values, so the page's note and
	# the assertion agree. The island never sends either value itself.
	preferences = assertion.preferences(context["borrower"].literacy, context["borrower"].locale)
	context["assistant"] = {
		"application": application.name,
		# Only used to scope the tab's remembered thread to this account: a shared device must not
		# offer the previous borrower's conversation after a sign-out.
		"user": context["borrower"].user,
		"csrf_token": context["boot"]["csrf_token"],
		"literacy": preferences["literacy"],
		"locale": preferences["locale"],
		"voice": {"enabled": _voice_configured(), "consent_version": livekit_token.CONSENT_VERSION},
	}
	return context


def _voice_configured() -> bool:
	# Configuration only: the page still renders if the voice service is unreachable, and the
	# panel reports a failed join rather than hiding a feature the site meant to offer.
	try:
		livekit_token.configuration()
	except ServiceUnavailable:
		return False
	return True
