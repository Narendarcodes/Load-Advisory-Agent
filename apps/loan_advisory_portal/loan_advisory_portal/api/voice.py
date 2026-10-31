"""Voice bridge: a LiveKit session becomes an assertion.

Frappe mints the LiveKit token and writes the `Voice Session` row before the
browser joins, so the row is the authorisation. The voice worker authenticates as
an integration account (`Agent Integration` role), presents the session id with the
room and participant identity it is actually serving, and receives a fresh
60-second assertion for that borrower and application.

The worker never holds a borrower cookie or a long-lived agent credential, and the
browser never receives an assertion: participant metadata carries identifiers only.
"""

import re

import frappe
from frappe import _
from frappe.utils import now_datetime

from loan_advisory_portal.install import AGENT_ROLE
from loan_advisory_portal.portal import limits
from loan_advisory_portal.portal.errors import Conflict, Forbidden, NotFound
from loan_advisory_portal.services import assertion, livekit_token

SESSION_ID = re.compile(r"^[0-9a-f]{32}$")
TERMINAL = ("Ended", "Expired")


def _require_service() -> None:
	user = frappe.session.user
	if user in (None, "", "Guest") or AGENT_ROLE not in frappe.get_roles(user):
		raise Forbidden(_("This method is reserved for the advisory service."))


def _live_session(session_id: str, room: str, identity: str) -> dict:
	# The caller is a service, not a person, so a shape violation is a refusal like any other.
	if not isinstance(session_id, str) or not SESSION_ID.match(session_id):
		raise NotFound(_("Voice session not found."))

	row = frappe.db.get_value(
		"Voice Session",
		{"session_id": session_id},
		[
			"name",
			"session_id",
			"room",
			"identity",
			"user",
			"customer",
			"application",
			"expires_at",
			"status",
			"consent_version",
		],
		as_dict=True,
	)
	# A session id presented with the wrong room or identity is answered exactly like a
	# missing one: the worker has no business probing for which part it got wrong.
	if not row or row.room != (room or "") or row.identity != (identity or ""):
		raise NotFound(_("Voice session not found."))
	# A row without the current notice version was not consented to (or predates this notice):
	# the worker gets no assertion, so no turn can be processed for it.
	if row.consent_version != livekit_token.CONSENT_VERSION:
		raise Forbidden(_("This voice session has no recorded consent."))
	if row.status in TERMINAL:
		raise Conflict(_("This voice session has ended."))
	if row.expires_at <= now_datetime():
		frappe.db.set_value("Voice Session", row.name, "status", "Expired", update_modified=False)
		raise Conflict(_("This voice session has expired."))
	return row


def _preferences(user: str) -> tuple[str | None, str | None]:
	profile = frappe.db.get_value(
		"Borrower Profile", {"user": user}, ["literacy", "preferred_locale"], as_dict=True
	)
	return (profile.literacy, profile.preferred_locale) if profile else (None, None)


@frappe.whitelist(methods=["POST"])
def voice_assertion(session_id: str, room: str, identity: str) -> dict:
	"""One assertion per call: the worker asks again for every turn, so none outlives its turn."""
	_require_service()
	limits.enforce("voice-assertion", 600, 3600)
	row = _live_session(session_id, room, identity)
	if row.status == "Created":
		frappe.db.set_value("Voice Session", row.name, "status", "Joined", update_modified=False)

	literacy, locale = _preferences(row.user)
	thread = f"voice-{row.session_id}"
	result = assertion.mint(row.user, row.customer, row.application, thread, literacy, locale)
	result.update(
		{
			"application": row.application,
			"customer": row.customer,
			"thread": thread,
			"session_id": row.session_id,
		}
	)
	return result
