"""Voice session minting and lifecycle.

Frappe issues the LiveKit token and records the Voice Session row first; the
Python voice worker trusts the room only if that row exists, so a token leaked
from the browser cannot be replayed after expiry or on another application.

A session is only created after the borrower accepted the voice notice: the row
carries the notice version and the time, and the worker refuses a row without
them. Ending a session is owner-scoped and idempotent, so a retried request from
a closing tab cannot resurrect or double-close a call.
"""

import hashlib
import secrets
import uuid
from datetime import timedelta

import frappe
from frappe import _
from frappe.utils import now_datetime

from loan_advisory_portal.portal import limits
from loan_advisory_portal.portal.errors import Forbidden, NotFound
from loan_advisory_portal.portal.identity import borrower_context, owned_application, selected_application
from loan_advisory_portal.services import livekit_token

TERMINAL = ("Ended", "Expired")


@frappe.whitelist(methods=["POST"])
def create_voice_session(application: str | None = None, consent: int = 0) -> dict:
	ctx = borrower_context()
	# Ownership is checked before consent so a foreign application is answered as missing even
	# when the caller never ticked the notice: the refusal must not reveal which id exists.
	ref = application or selected_application()
	if ref:
		ref = owned_application(ref, ctx).name
	if not consent:
		raise Forbidden(_("Start the voice session after accepting the voice notice."))

	limits.enforce("voice-session", 10, 3600)
	config = livekit_token.configuration()
	room_seed = hashlib.sha256(f"{ctx.customer}:{ref or ''}".encode("utf-8")).hexdigest()[:16]
	room = f"loan-{room_seed}-{secrets.token_hex(4)}"
	identity = f"applicant-{uuid.uuid4().hex}"
	session_id = secrets.token_hex(16)
	now = now_datetime()
	expires_at = now + timedelta(seconds=livekit_token.TOKEN_TTL_SECONDS)

	metadata = {
		"session_id": session_id,
		"user": ctx.user,
		"customer": ctx.customer,
		"application": ref,
	}
	token = livekit_token.create_token(
		api_key=config["api_key"],
		api_secret=config["api_secret"],
		identity=identity,
		name=frappe.db.get_value("Borrower Profile", ctx.profile, "full_name") or ctx.user,
		room=room,
		metadata=metadata,
	)

	doc = frappe.get_doc(
		{
			"doctype": "Voice Session",
			"session_id": session_id,
			"room": room,
			"identity": identity,
			"user": ctx.user,
			"customer": ctx.customer,
			"application": ref,
			"expires_at": expires_at,
			"status": "Created",
			"created_at": now,
			"consent_version": livekit_token.CONSENT_VERSION,
			"consent_at": now,
		}
	)
	doc.flags.ignore_permissions = True
	doc.insert()

	return {
		"token": token,
		"url": config["url"],
		"room": room,
		"identity": identity,
		"session_id": session_id,
		"expires_at": str(expires_at),
	}


@frappe.whitelist(methods=["POST"])
def end_voice_session(session_id: str) -> dict:
	"""Close the caller's own session. Another borrower's id is answered as missing."""
	ctx = borrower_context()
	row = None
	if isinstance(session_id, str) and session_id:
		row = frappe.db.get_value(
			"Voice Session",
			{"session_id": session_id},
			["name", "session_id", "user", "status", "ended_at"],
			as_dict=True,
		)
	if not row or row.user != ctx.user:
		raise NotFound(_("Voice session not found."))

	if row.status not in TERMINAL:
		ended_at = now_datetime()
		frappe.db.set_value(
			"Voice Session",
			row.name,
			{"status": "Ended", "ended_at": ended_at},
			update_modified=False,
		)
		return {"session_id": row.session_id, "status": "Ended", "ended_at": str(ended_at)}

	# Already closed (by this tab, another tab, or the expiry sweep): report the state, change nothing.
	return {
		"session_id": row.session_id,
		"status": row.status,
		"ended_at": str(row.ended_at) if row.ended_at else None,
	}
