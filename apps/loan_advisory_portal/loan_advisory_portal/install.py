import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

from loan_advisory_portal.portal.lifecycle import states_text

BORROWER_ROLE = "Loan Borrower"
AGENT_ROLE = "Agent Integration"
EVIDENCE_ROLE = "Evidence Service"

# DRAFT stays first: Frappe defaults a blank Select to its first option, and a new
# application is a draft until the borrower submits it.
LIFECYCLE_STATES = states_text()

# Custom fields are created through one idempotent function so every site gets
# the same schema on install and on migrate. They never touch upstream files.
LOAN_APPLICATION_FIELDS = [
	{
		"fieldname": "custom_underwriting_section",
		"label": "Underwriting (synthetic)",
		"fieldtype": "Section Break",
		"insert_after": "loan_amount",
	},
	{
		"fieldname": "custom_loan_purpose",
		"label": "Loan Purpose (portal)",
		"fieldtype": "Data",
		"insert_after": "custom_underwriting_section",
	},
	{
		"fieldname": "custom_monthly_income",
		"label": "Monthly Income",
		"fieldtype": "Currency",
		"insert_after": "custom_loan_purpose",
	},
	{
		"fieldname": "custom_monthly_obligations",
		"label": "Monthly Obligations",
		"fieldtype": "Currency",
		"insert_after": "custom_monthly_income",
	},
	{
		"fieldname": "custom_credit_score",
		"label": "Credit Score",
		"fieldtype": "Int",
		"insert_after": "custom_monthly_obligations",
	},
	{
		"fieldname": "custom_employment_months",
		"label": "Employment Months",
		"fieldtype": "Int",
		"insert_after": "custom_credit_score",
	},
	{
		"fieldname": "custom_external_ref",
		"label": "External Ref (seed key)",
		"fieldtype": "Data",
		"unique": 1,
		"insert_after": "custom_employment_months",
	},
	{
		"fieldname": "custom_lifecycle_state",
		"label": "Lifecycle State",
		"fieldtype": "Select",
		"options": LIFECYCLE_STATES,
		"insert_after": "custom_external_ref",
		# The decision on a submitted application is recorded after immutability
		# locks the rest of the document; the native `status` stays untouched.
		"allow_on_submit": 1,
	},
	{
		"fieldname": "custom_submitted_at",
		"label": "Submitted At (portal)",
		"fieldtype": "Datetime",
		"read_only": 1,
		"insert_after": "custom_lifecycle_state",
	},
	{
		"fieldname": "custom_policy_version",
		"label": "Policy Version",
		"fieldtype": "Data",
		"read_only": 1,
		"allow_on_submit": 1,
		"insert_after": "custom_submitted_at",
	},
	{
		"fieldname": "custom_latest_evidence",
		"label": "Latest Decision Evidence",
		"fieldtype": "Link",
		"options": "Loan Decision Evidence",
		"read_only": 1,
		"allow_on_submit": 1,
		"insert_after": "custom_policy_version",
	},
]


def after_install():
	ensure_roles()
	ensure_custom_fields()


def after_migrate():
	ensure_roles()
	ensure_custom_fields()


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


def ensure_custom_fields():
	create_custom_fields({"Loan Application": LOAN_APPLICATION_FIELDS}, update=True)
