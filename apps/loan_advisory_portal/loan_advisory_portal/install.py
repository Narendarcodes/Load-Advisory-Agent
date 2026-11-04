import json
from pathlib import Path

import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

from loan_advisory_portal.custom_fields import LOAN_APPLICATION_FIELDS
from loan_advisory_portal.portal.lifecycle import states_text

BORROWER_ROLE = "Loan Borrower"
AGENT_ROLE = "Agent Integration"
EVIDENCE_ROLE = "Evidence Service"
# ADR-0008: MANUAL_REVIEW cases are worked in the Frappe desk by this role.
OFFICER_ROLE = "Loan Officer"

# Custom fields live in `custom_fields.py` (pure data) so CI can check the Saral field map
# against them without a bench. They are applied through one idempotent function so every
# site gets the same schema on install and on migrate. They never touch upstream files.
LIFECYCLE_STATES = states_text()
CONSENT_TEXTS_PATH = Path(__file__).resolve().parent / "consent_texts.json"


def after_install():
	ensure_roles()
	ensure_custom_fields()
	ensure_officer_permissions()
	ensure_consent_texts()


def after_migrate():
	ensure_roles()
	ensure_custom_fields()
	ensure_officer_permissions()
	ensure_consent_texts()


def before_install():
	"""Adopt DocTypes a previous bootstrap created as ad-hoc custom DocTypes.

	Older environments created `Loan Decision Evidence`, `Account Invitation`
	and `Account Invitation Redemption` through REST. Frappe cannot install an
	app DocType over a custom DocType with the same name, so flip them first.
	"""
	for doctype in ("Loan Decision Evidence", "Account Invitation", "Account Invitation Redemption"):
		if not frappe.db.exists("DocType", doctype):
			continue
		if frappe.db.get_value("DocType", doctype, "custom"):
			frappe.db.set_value(
				"DocType",
				doctype,
				{"custom": 0, "module": "Loan Advisory Portal"},
				update_modified=False,
			)


def ensure_roles():
	for role_name in (BORROWER_ROLE, AGENT_ROLE, EVIDENCE_ROLE):
		if frappe.db.exists("Role", role_name):
			continue
		role = frappe.get_doc({"doctype": "Role", "role_name": role_name, "is_custom": 1})
		role.insert(ignore_permissions=True)
		# `desk_access=0` is overwritten by the field default on insert.
		frappe.db.set_value("Role", role.name, "desk_access", 0, update_modified=False)
	if not frappe.db.exists("Role", OFFICER_ROLE):
		# The officer works in the Desk (ADR-0008), so this role keeps desk access.
		frappe.get_doc({"doctype": "Role", "role_name": OFFICER_ROLE, "is_custom": 1, "desk_access": 1}).insert(
			ignore_permissions=True
		)


def ensure_officer_permissions():
	"""Loan Officer reads Loan Applications (level 0) and the officer-only fields (level 1).

	The role gets no write, submit or delete on the Lending doctype: review actions go through
	`api.review`, which checks the role and writes only the lifecycle marker, the native status
	for a final decision and an audit row. Borrowers hold no Desk permission on Loan Application.
	"""
	from frappe.permissions import add_permission, update_permission_property

	for permlevel in (0, 1):
		add_permission("Loan Application", OFFICER_ROLE, permlevel)
		update_permission_property("Loan Application", OFFICER_ROLE, permlevel, "read", 1)
	update_permission_property("Loan Application", OFFICER_ROLE, 0, "report", 1)
	# The Lending form script on Loan Application reads Loan Origination Settings; without read the officer
	# gets "No permission for Loan Origination Settings" on every case (E2E A4, 2026-11-04).
	if frappe.db.exists("DocType", "Loan Origination Settings"):
		add_permission("Loan Origination Settings", OFFICER_ROLE, 0)
		update_permission_property("Loan Origination Settings", OFFICER_ROLE, 0, "read", 1)
	# System Manager must keep seeing the officer-only fields it already administers.
	add_permission("Loan Application", "System Manager", 1)
	update_permission_property("Loan Application", "System Manager", 1, "read", 1)


def consent_texts() -> list[dict]:
	return json.loads(CONSENT_TEXTS_PATH.read_text(encoding="utf-8"))["texts"]


def ensure_consent_texts():
	"""Seed the PROTOTYPE consent texts (ADR-0009); an existing version is never rewritten."""
	from loan_advisory_portal.loan_advisory_portal.doctype.consent_text.consent_text import text_id_for

	for text in consent_texts():
		text_id = text_id_for(text["consent_type"], text["version"])
		if frappe.db.exists("Consent Text", text_id):
			continue
		frappe.get_doc({
			"doctype": "Consent Text", "text_id": text_id, "status": "PROTOTYPE", "legal_review": "PENDING", **text,
		}).insert(ignore_permissions=True)


def ensure_custom_fields():
	create_custom_fields({"Loan Application": LOAN_APPLICATION_FIELDS}, update=True)
