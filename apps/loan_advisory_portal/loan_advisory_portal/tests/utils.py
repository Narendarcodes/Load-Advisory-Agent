"""Fixtures for the portal test suite.

Every fixture is synthetic and namespaced per test, so tests never depend on
seed data or on each other. The suite is intended for a disposable site.
"""

import uuid
from contextlib import contextmanager

import frappe

COMPANY = "LAP Test NBFC"
PRODUCT_CODE = "LAP-TEST-001"
DOCUMENT_TYPE = "Identity Proof"


def unique(prefix: str) -> str:
	return f"{prefix}-{uuid.uuid4().hex[:10]}"


def ensure_company() -> str:
	if frappe.db.exists("Company", COMPANY):
		return COMPANY
	for warehouse_type in ("Transit", "Stores"):
		if not frappe.db.exists("Warehouse Type", warehouse_type):
			frappe.get_doc({"doctype": "Warehouse Type", "name": warehouse_type}).insert(
				ignore_permissions=True, ignore_if_duplicate=True
			)
	company = frappe.get_doc(
		{
			"doctype": "Company",
			"company_name": COMPANY,
			"abbr": "LAPTN",
			"default_currency": "INR",
			"country": "India",
		}
	)
	company.flags.ignore_permissions = True
	company.insert()
	return company.name


OFFSET = "Synthetic Collection Order"


def ensure_offset() -> str:
	if not frappe.db.exists("Loan Demand Offset Order", OFFSET):
		frappe.get_doc(
			{
				"doctype": "Loan Demand Offset Order",
				"title": OFFSET,
				"components": [{"demand_type": "EMI (Principal + Interest)"}],
			}
		).insert(ignore_permissions=True)
	return OFFSET


def ensure_product(company: str, maximum_loan_amount: float = 1_500_000, rate: float = 14) -> str:
	if frappe.db.exists("Loan Product", PRODUCT_CODE):
		return PRODUCT_CODE
	offset = ensure_offset()
	product = frappe.get_doc(
		{
			"doctype": "Loan Product",
			"product_code": PRODUCT_CODE,
			"product_name": "Synthetic Portal Product",
			"company": company,
			"rate_of_interest": rate,
			"is_term_loan": 1,
			"maximum_loan_amount": maximum_loan_amount,
			**{
				f"collection_offset_sequence_for_{key}": offset
				for key in ("standard_asset", "sub_standard_asset", "written_off_asset", "settlement_collection")
			},
		}
	)
	product.flags.ignore_permissions = True
	product.insert()
	return product.name


def ensure_document_type() -> str:
	if not frappe.db.exists("Loan Document Type", DOCUMENT_TYPE):
		frappe.get_doc(
			{"doctype": "Loan Document Type", "loan_document_type": DOCUMENT_TYPE}
		).insert(ignore_permissions=True)
	return DOCUMENT_TYPE


def make_customer(name: str | None = None) -> str:
	doc = frappe.get_doc(
		{
			"doctype": "Customer",
			"customer_name": name or unique("Synthetic Borrower"),
			"customer_type": "Individual",
		}
	)
	doc.flags.ignore_permissions = True
	doc.insert()
	return doc.name


def make_borrower(customer: str | None = None, *, email: str | None = None, suspended: bool = False):
	customer = customer or make_customer()
	email = email or f"{unique('borrower').lower()}@example.invalid"
	# Frappe blanks a username derived from a taken first name, so give each
	# synthetic user its own unique one.
	username = email.split("@", 1)[0]
	user = frappe.get_doc(
		{
			"doctype": "User",
			"email": email,
			"first_name": "Synthetic Borrower",
			"username": username,
			"user_type": "Website User",
			"send_welcome_email": 0,
			"enabled": 0 if suspended else 1,
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
			"onboarding_state": "Registered",
			"full_name": "Synthetic Borrower",
			"email": email,
			"phone": "+919876543210",
			"employment_type": "Salaried",
			"employment_months": 24,
			"monthly_income": 90000,
			"monthly_obligations": 12000,
			"consent_terms": 1,
			"consent_privacy": 1,
		}
	)
	profile.flags.ignore_permissions = True
	profile.insert()
	return frappe.get_doc("User", user.name), profile


def make_service_user(role: str = "Evidence Service") -> str:
	email = f"{unique('service').lower()}@example.invalid"
	user = frappe.get_doc(
		{
			"doctype": "User",
			"email": email,
			"first_name": role,
			"username": email.split("@", 1)[0],
			"user_type": "System User",
			"send_welcome_email": 0,
			"enabled": 1,
			"roles": [{"role": role}],
		}
	)
	user.flags.ignore_permissions = True
	user.insert()
	return user.name


@contextmanager
def as_user(user: str):
	previous = frappe.session.user
	frappe.set_user(user)
	frappe.local.session.sid = f"test-{uuid.uuid4().hex}"
	try:
		yield
	finally:
		frappe.set_user(previous)


def make_application(customer: str, **overrides) -> dict:
	from loan_advisory_portal.api import applications

	values = {
		"loan_amount": 250000,
		"tenure_months": 24,
		"purpose": "Home renovation",
		"monthly_income": 90000,
		"monthly_obligations": 12000,
		"credit_score": 760,
		"employment_months": 24,
	}
	values.update(overrides)
	return applications.create_application(**values)


def minimal_pdf() -> bytes:
	"""A parseable one-page PDF: Frappe scans uploads for embedded JavaScript.

	The producer string is unique per call so Frappe's content-hash de-duplication
	never reuses a private file uploaded by another user.
	"""
	from io import BytesIO

	from pypdf import PdfWriter

	writer = PdfWriter()
	writer.add_blank_page(width=72, height=72)
	writer.add_metadata({"/Producer": unique("synthetic-pdf")})
	buffer = BytesIO()
	writer.write(buffer)
	return buffer.getvalue()


def save_private_file(name: str = "identity.pdf", content: bytes | None = None, private: bool = True):
	from frappe.utils.file_manager import save_file

	return save_file(name, content if content is not None else minimal_pdf(), "", "", is_private=1 if private else 0)


def attach_fixture_document(application: str, user: str) -> dict:
	from loan_advisory_portal.api import documents

	ensure_document_type()
	with as_user(user):
		file = save_private_file()
		return documents.attach_document(application, DOCUMENT_TYPE, file.name)
