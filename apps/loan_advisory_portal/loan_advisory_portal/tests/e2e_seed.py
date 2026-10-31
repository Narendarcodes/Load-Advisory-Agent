"""Fixtures for the browser harness (Phase 9), run with `bench --site <site> execute`.

This module is test scaffolding, not product code: it seeds two borrowers (one
whose application has a recorded decision, one whose draft must stay private),
two service accounts and the private credentials the harness needs. It never
prints a password or an API secret; everything sensitive goes to a JSON file
that the caller copies out of the container and deletes afterwards.

    bench --site loanportal.local execute \
        loan_advisory_portal.tests.e2e_seed.seed --kwargs '{"tag": "e2e1"}'
"""

import json
import os
import secrets
import uuid

import frappe

from loan_advisory_portal.api import applications, documents
from loan_advisory_portal.tests import utils

CREDENTIALS_DIR = "/tmp/loanportal-e2e"

# Deterministic inputs for the recorded decision: FOIR 0.55 and a score of 640
# fail two customer-visible rules under personal_loan_synthetic_v1.
REJECTED_INPUTS = {
	"loan_amount": 500000,
	"tenure_months": 24,
	"purpose": "Home renovation",
	"monthly_income": 40000,
	"monthly_obligations": 22000,
	"credit_score": 640,
	"employment_months": 18,
}
OTHER_INPUTS = {
	"loan_amount": 300000,
	"tenure_months": 36,
	"purpose": "Medical costs",
	"monthly_income": 90000,
	"monthly_obligations": 10000,
	"credit_score": 780,
	"employment_months": 36,
}


def _password() -> str:
	return secrets.token_urlsafe(18) + "!A1"


def _borrower(tag: str, suffix: str, *, literacy: str = "medium"):
	email = f"{tag}-{suffix}@example.invalid"
	password = _password()
	customer = utils.make_customer()
	user = frappe.get_doc(
		{
			"doctype": "User",
			"email": email,
			"first_name": f"{tag.title()} {suffix.title()}",
			"username": f"{tag}-{suffix}",
			"user_type": "Website User",
			"send_welcome_email": 0,
			"enabled": 1,
			"new_password": password,
			"roles": [{"role": "Loan Borrower"}],
		}
	)
	user.flags.ignore_permissions = True
	user.insert()

	customer_doc = frappe.get_doc("Customer", customer)
	customer_doc.append("portal_users", {"user": user.name})
	customer_doc.flags.ignore_permissions = True
	customer_doc.save()

	profile = frappe.get_doc(
		{
			"doctype": "Borrower Profile",
			"user": user.name,
			"customer": customer,
			"status": "Active",
			"onboarding_state": "Profile Complete",
			"full_name": f"{tag.title()} {suffix.title()}",
			"email": email,
			"phone": "+919876543210",
			"employment_type": "Salaried",
			"employment_months": 24,
			"monthly_income": 90000,
			"monthly_obligations": 12000,
			"literacy": literacy,
			"preferred_locale": "en",
			"consent_terms": 1,
			"consent_privacy": 1,
		}
	)
	profile.flags.ignore_permissions = True
	profile.insert()
	return user.name, customer, password


def _service(tag: str, suffix: str, roles: list[str]):
	from frappe.core.doctype.user.user import generate_keys

	email = f"{tag}-{suffix}@example.invalid"
	user = frappe.get_doc(
		{
			"doctype": "User",
			"email": email,
			"first_name": f"{tag.title()} {suffix.title()}",
			"username": f"{tag}-{suffix}",
			"user_type": "System User",
			"send_welcome_email": 0,
			"enabled": 1,
			"roles": [{"role": role} for role in roles],
		}
	)
	user.flags.ignore_permissions = True
	user.insert()
	keys = generate_keys(user.name)  # one call: the key and secret must belong together
	user.reload()
	return user.name, user.api_key, keys["api_secret"]


def _document(application: str) -> None:
	file = utils.save_private_file(f"{uuid.uuid4().hex}.pdf")
	documents.attach_document(application, utils.DOCUMENT_TYPE, file.name)


def seed(tag: str | None = None) -> dict:
	"""Create both borrowers, one submitted + one draft application, and service keys."""
	tag = tag or f"e2e-{uuid.uuid4().hex[:8]}"
	utils.ensure_company()
	utils.ensure_product(utils.COMPANY)
	utils.ensure_document_type()

	victim, victim_customer, victim_password = _borrower(tag, "borrower")
	other, other_customer, other_password = _borrower(tag, "other", literacy="low")

	with utils.as_user(victim):
		victim_app = applications.create_application(**REJECTED_INPUTS)
		_document(victim_app["name"])
		applications.submit_application(victim_app["name"])

	with utils.as_user(other):
		other_app = applications.create_application(**OTHER_INPUTS)
		_document(other_app["name"])

	# The evidence service holds no DocType grants: it may only call the trusted
	# ingestion method, which owns linkage, the write allowlist and the audit row.
	from loan_advisory_portal.install import EVIDENCE_ROLE

	evidence, evidence_key, evidence_secret = _service(tag, "evidence", [EVIDENCE_ROLE])
	reader, reader_key, reader_secret = _service(tag, "reader", ["Agent Integration", "Loan Reporter"])

	payload = {
		"tag": tag,
		"victim": {
			"user": victim,
			"password": victim_password,
			"customer": victim_customer,
			"application": victim_app["name"],
		},
		"other": {
			"user": other,
			"password": other_password,
			"customer": other_customer,
			"application": other_app["name"],
		},
		"evidence": {"user": evidence, "api_key": evidence_key, "api_secret": evidence_secret},
		"reader": {"user": reader, "api_key": reader_key, "api_secret": reader_secret},
	}
	os.makedirs(CREDENTIALS_DIR, mode=0o700, exist_ok=True)
	path = os.path.join(CREDENTIALS_DIR, f"{tag}.json")
	with open(path, "w", encoding="utf-8") as handle:
		json.dump(payload, handle, indent=1)
	os.chmod(path, 0o600)
	# Nothing sensitive crosses stdout.
	return {"tag": tag, "victim_application": victim_app["name"], "other_application": other_app["name"]}


def teardown(tag: str) -> dict:
	"""Delete everything `seed` made for this tag (disposable sites only)."""
	path = os.path.join(CREDENTIALS_DIR, f"{tag}.json")
	with open(path, encoding="utf-8") as handle:
		payload = json.load(handle)
	deleted = []
	for key in ("victim", "other"):
		app = payload[key]["application"]
		file_rows = frappe.get_all("File", filters={"attached_to_doctype": "Loan Application", "attached_to_name": app})
		# The application links to its latest evidence; drop the back-link first or
		# Frappe refuses to delete the evidence row (LinkExistsError).
		frappe.db.set_value("Loan Application", app, "custom_latest_evidence", None, update_modified=False)
		for row in frappe.get_all("Evidence Ingestion Log", filters={"loan_application": app}, pluck="name"):
			frappe.delete_doc("Evidence Ingestion Log", row, ignore_permissions=True, delete_permanently=True)
		for row in frappe.get_all("Application State Log", filters={"loan_application": app}, pluck="name"):
			frappe.delete_doc("Application State Log", row, ignore_permissions=True, delete_permanently=True)
		for row in frappe.get_all("Loan Decision Evidence", filters={"loan_application": app}, pluck="name"):
			frappe.delete_doc("Loan Decision Evidence", row, ignore_permissions=True, delete_permanently=True)
		doc = frappe.get_doc("Loan Application", app)
		if doc.docstatus == 1:
			doc.flags.ignore_permissions = True
			doc.cancel()
		frappe.delete_doc("Loan Application", app, ignore_permissions=True, delete_permanently=True, force=1)
		for row in file_rows:
			frappe.delete_doc("File", row, ignore_permissions=True, delete_permanently=True)
		deleted.append(app)
	for key in ("victim", "other"):
		user = payload[key]["user"]
		for row in frappe.get_all("Borrower Profile", filters={"user": user}, pluck="name"):
			frappe.delete_doc("Borrower Profile", row, ignore_permissions=True, delete_permanently=True)
		frappe.delete_doc("User", user, ignore_permissions=True, delete_permanently=True, force=1)
	for key in ("evidence", "reader"):
		frappe.delete_doc("User", payload[key]["user"], ignore_permissions=True, delete_permanently=True, force=1)
	os.remove(path)
	return {"tag": tag, "deleted": deleted}
