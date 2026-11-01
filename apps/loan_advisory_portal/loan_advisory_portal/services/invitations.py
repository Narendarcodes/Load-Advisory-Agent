"""Invitation-bound registration.

One-time secret semantics: only a SHA-256 hash is stored; the plaintext token is
returned to the operator exactly once. Single use is enforced by a unique
`Account Invitation Redemption` row, not by a process lock.
"""

import hashlib
import re
import secrets
from datetime import timedelta

import frappe
from frappe import _
from frappe.utils import (
	get_datetime,
	now_datetime,
	validate_email_address,
	validate_phone_number_with_country_code,
)

from loan_advisory_portal.portal import legal
from loan_advisory_portal.portal.errors import Conflict, Forbidden, InvitationInvalid
from loan_advisory_portal.portal.identity import BORROWER_ROLE

DEFAULT_TTL_HOURS = 24
MAX_TTL_HOURS = 168
MIN_PASSWORD_LENGTH = 10
MAX_PASSWORD_LENGTH = 128
MAX_NAME_LENGTH = 140
MIN_USERNAME_LENGTH = 3
MAX_USERNAME_LENGTH = 40
USERNAME_PATTERN = re.compile(r"^[a-z0-9](?:[a-z0-9._-]{1,38}[a-z0-9])$")


def _hash(secret: str) -> str:
	return hashlib.sha256(secret.encode("utf-8")).hexdigest()


def derive_username(email: str) -> str:
	"""Suggest a username from the email local part, or '' if it has none."""
	local = (email or "").split("@", 1)[0].lower()
	slug = re.sub(r"[^a-z0-9._-]+", "-", local)
	slug = re.sub(r"[-_.]{2,}", "-", slug).strip("-._")
	if len(slug) > MAX_USERNAME_LENGTH:
		slug = slug[:MAX_USERNAME_LENGTH].rstrip("-._")
	if len(slug) < MIN_USERNAME_LENGTH:
		return ""
	return slug


def _resolve_username(username: str | None, email: str) -> str:
	"""Never let Frappe blank a taken username silently: reject it instead."""
	candidate = (username or "").strip().lower() or derive_username(email)
	if not candidate:
		raise InvitationInvalid(_("Choose a username with at least {0} characters.").format(MIN_USERNAME_LENGTH))
	if not USERNAME_PATTERN.match(candidate):
		raise InvitationInvalid(
			_("Use {0}–{1} lowercase letters, numbers, dots, dashes or underscores.").format(
				MIN_USERNAME_LENGTH, MAX_USERNAME_LENGTH
			)
		)
	if frappe.db.get_value("User", {"username": candidate}):
		raise Conflict(_("That username is already taken. Choose another one."))
	return candidate


def _normalise_email(email: str) -> str:
	email = (email or "").strip().lower()
	if not email or len(email) > 254:
		raise InvitationInvalid(_("Invalid invitation."))
	if not validate_email_address(email):
		raise InvitationInvalid(_("Invalid invitation."))
	return email


def _customer_is_disabled(customer: str) -> bool:
	if not frappe.get_meta("Customer").has_field("disabled"):
		return False
	return bool(frappe.db.get_value("Customer", customer, "disabled"))


def _existing_profile_for_customer(customer: str) -> str | None:
	return frappe.db.get_value("Borrower Profile", {"customer": customer}, "name")


def _portal_link_user(customer: str) -> str | None:
	rows = frappe.get_all(
		"Portal User",
		filters={"parent": customer, "parenttype": "Customer", "parentfield": "portal_users"},
		fields=["user"],
	)
	for row in rows:
		if frappe.db.exists("User", row.user):
			return row.user
	return None


def issue_invitation(
	email: str,
	customer: str,
	application: str | None = None,
	expires_hours: int | None = None,
	note: str | None = None,
) -> dict:
	frappe.only_for(("System Manager",))

	email = _normalise_email(email)
	hours = int(expires_hours or DEFAULT_TTL_HOURS)
	if not 1 <= hours <= MAX_TTL_HOURS:
		raise Forbidden(_("Invitation lifetime must be between 1 and {0} hours.").format(MAX_TTL_HOURS))

	if not frappe.db.exists("Customer", customer):
		raise Conflict(_("Customer does not exist."))
	if _customer_is_disabled(customer):
		raise Conflict(_("This customer is disabled."))
	if frappe.db.exists("User", email) or frappe.db.get_value("User", {"email": email}, "name"):
		raise Conflict(_("An account already exists for this email."))
	if _existing_profile_for_customer(customer) or _portal_link_user(customer):
		raise Conflict(_("This customer already has a portal account."))
	if application:
		applicant = frappe.db.get_value("Loan Application", application, "applicant")
		if applicant != customer:
			raise Conflict(_("The application does not belong to this customer."))

	# A fresh invitation supersedes older unused links for the same person.
	for stale in frappe.get_all(
		"Account Invitation",
		filters={"customer": customer, "email": email, "redeemed": 0, "revoked": 0},
		pluck="name",
	):
		frappe.db.set_value("Account Invitation", stale, "revoked", 1, update_modified=False)

	invitation_id = secrets.token_hex(16)
	secret = secrets.token_urlsafe(32)
	expires_at = now_datetime() + timedelta(hours=hours)
	doc = frappe.get_doc(
		{
			"doctype": "Account Invitation",
			"invitation_id": invitation_id,
			"email": email,
			"customer": customer,
			"application": application,
			"expires_at": expires_at,
			"secret_hash": _hash(secret),
			"issued_by": frappe.session.user,
			"note": (note or "").strip()[:500] or None,
		}
	)
	doc.flags.ignore_permissions = True
	doc.insert()

	return {
		"invitation": doc.name,
		"token": f"{invitation_id}.{secret}",
		"expires_at": str(expires_at),
		"url": f"/borrower/invite?token={invitation_id}.{secret}",
	}


def revoke_invitation(invitation_id: str) -> dict:
	frappe.only_for(("System Manager",))
	if not frappe.db.exists("Account Invitation", invitation_id):
		raise Conflict(_("Invitation does not exist."))
	frappe.db.set_value("Account Invitation", invitation_id, "revoked", 1, update_modified=True)
	return {"invitation": invitation_id, "revoked": 1}


def _load_invitation(token: str, *, for_update: bool = False) -> dict:
	if not token or not isinstance(token, str) or token.count(".") != 1:
		raise InvitationInvalid(_("This invitation is not valid."))
	invitation_id, secret = token.split(".", 1)
	if not invitation_id or not secret:
		raise InvitationInvalid(_("This invitation is not valid."))

	record = frappe.db.get_value(
		"Account Invitation",
		invitation_id,
		["name", "email", "customer", "application", "secret_hash", "expires_at", "revoked", "redeemed"],
		as_dict=True,
		for_update=for_update,
	)
	if not record or not record.secret_hash:
		raise InvitationInvalid(_("This invitation is not valid."))
	if not secrets.compare_digest(record.secret_hash, _hash(secret)):
		raise InvitationInvalid(_("This invitation is not valid."))
	if record.revoked or record.redeemed:
		raise InvitationInvalid(_("This invitation is no longer valid."))
	if get_datetime(record.expires_at) <= now_datetime():
		raise InvitationInvalid(_("This invitation has expired."))
	if not frappe.db.exists("Customer", record.customer) or _customer_is_disabled(record.customer):
		raise InvitationInvalid(_("This invitation is not valid."))
	if _existing_profile_for_customer(record.customer) or _portal_link_user(record.customer):
		raise InvitationInvalid(_("This invitation has already been used."))
	return record


def validate_token(token: str) -> dict:
	record = _load_invitation(token)
	return {
		"email": record.email,
		"customer": record.customer,
		"application": record.application,
		"expires_at": str(record.expires_at),
		"suggested_username": derive_username(record.email),
	}


def redeem(
	token: str,
	full_name: str,
	password: str,
	username: str | None = None,
	phone: str | None = None,
	consent_terms: bool = False,
	consent_privacy: bool = False,
) -> dict:
	full_name = (full_name or "").strip()
	if not 1 <= len(full_name) <= MAX_NAME_LENGTH:
		raise InvitationInvalid(_("Enter your full name."))
	if not consent_terms or not consent_privacy:
		raise InvitationInvalid(_("Accept the terms and the privacy notice to continue."))
	if not password or not MIN_PASSWORD_LENGTH <= len(password) <= MAX_PASSWORD_LENGTH:
		raise InvitationInvalid(
			_("Choose a password between {0} and {1} characters.").format(MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH)
		)
	phone = (phone or "").strip() or None
	if phone:
		if len(phone) > 40:
			raise InvitationInvalid(_("This phone number is too long."))
		try:
			validate_phone_number_with_country_code(phone, "phone")
		except frappe.ValidationError:
			raise InvitationInvalid(
				_("Enter a phone number with country code, e.g. +91 98765 43210.")
			) from None

	record = _load_invitation(token, for_update=True)
	username = _resolve_username(username, record.email)

	# Claim first: the unique redemption row is the single-use authority.
	try:
		redemption = frappe.get_doc(
			{
				"doctype": "Account Invitation Redemption",
				"invitation": record.name,
				"email": record.email,
				"customer": record.customer,
				"redeemed_at": now_datetime(),
			}
		)
		redemption.flags.ignore_permissions = True
		redemption.insert()
	except frappe.DuplicateEntryError:
		raise Conflict(_("This invitation has already been used.")) from None

	user = frappe.get_doc(
		{
			"doctype": "User",
			"email": record.email,
			"first_name": full_name,
			"username": username,
			"enabled": 1,
			"user_type": "Website User",
			"send_welcome_email": 0,
			"new_password": password,
			"roles": [{"role": BORROWER_ROLE}],
		}
	)
	user.flags.ignore_permissions = True
	try:
		user.insert()
	except frappe.DuplicateEntryError:
		# The unique username index caught a claim that slipped past the pre-check.
		raise Conflict(_("That username is already taken. Choose another one.")) from None
	except frappe.NameError as exc:
		raise Conflict(_("An account already exists for this email.")) from exc

	customer = frappe.get_doc("Customer", record.customer)
	messages_before_link = list(getattr(frappe.local, "message_log", []) or [])
	customer.append("portal_users", {"user": user.name})
	customer.flags.ignore_permissions = True
	customer.save()
	# The Customer controller asks for the desktop "Customer" role on every new
	# portal user. Borrowers deliberately hold only "Loan Borrower", so keep that
	# advisory out of the sign-up response without hiding other messages.
	frappe.local.message_log = messages_before_link

	profile = frappe.get_doc(
		{
			"doctype": "Borrower Profile",
			"user": user.name,
			"customer": record.customer,
			"status": "Active",
			"onboarding_state": "Registered",
			"full_name": full_name,
			"email": record.email,
			"phone": phone,
			"consent_terms": 1,
			"consent_privacy": 1,
			"terms_version": legal.TERMS_VERSION,
			"privacy_version": legal.PRIVACY_VERSION,
		}
	)
	profile.flags.ignore_permissions = True
	profile.insert()

	frappe.db.set_value("Account Invitation Redemption", redemption.name, "user", user.name, update_modified=False)
	frappe.db.set_value("Account Invitation", record.name, {"redeemed": 1, "revoked": 0}, update_modified=True)

	if getattr(frappe.local, "request", None):
		# The bearer of a valid invitation just chose this password: start the
		# session now instead of asking for the same credentials again.
		frappe.local.login_manager.login_as(user.name)

	return {"user": user.name, "username": username, "customer": record.customer, "profile": profile.name}
