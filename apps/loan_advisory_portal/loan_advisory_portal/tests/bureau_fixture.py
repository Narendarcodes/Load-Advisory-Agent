"""Test-only provisioning for one bureau-backed Decision Evidence fixture (Phase 1.6 §B).

Run with `bench --site <disposable site> execute`, because the two steps it performs are borrower
actions with no host-side equivalent: attaching a document and submitting an application. It does them
in-process as the application's own existing synthetic borrower, so no password or API credential is
involved.

	bench --site loanportal.local execute \
		loan_advisory_portal.tests.bureau_fixture.prepare \
		--kwargs '{"application": "ACC-LOAP-2026-00003"}'
	bench --site loanportal.local execute \
		loan_advisory_portal.tests.bureau_fixture.teardown \
		--kwargs '{"application": "ACC-LOAP-2026-00003"}'

No decision is made here. The caller then runs the unchanged pipeline
(`process_bureau_application` -> data-quality gate -> ZEN -> `evidence.ingest`) from the service's own
process; this module only puts an existing synthetic application into the state that pipeline reads.

It creates nothing — no Customer, no User, no application — and refuses:

- a site that is not listed disposable, so it cannot be pointed at the shared one;
- an application that is not a DRAFT, so a decided record can never be re-opened;
- an applicant whose Customer has no `@example.invalid` portal user, which is how "explicitly synthetic
borrower" is checked here rather than assumed.
"""

import frappe

from loan_advisory_portal.api import applications
from loan_advisory_portal.tests import utils

DISPOSABLE_SITES = ("loanportal.local", "repro.local")
SYNTHETIC_EMAIL_SUFFIX = "@example.invalid"
FIXTURE_ID = "phase16-bureau-evidence"


class FixtureRefused(RuntimeError):
	"""The fixture cannot be built on what it was pointed at."""


def _guard_site() -> str:
	site = frappe.local.site
	if site not in DISPOSABLE_SITES:
		raise FixtureRefused(f"{site} is not listed disposable; refusing to provision a bureau fixture")
	return site


def _synthetic_borrower(customer: str) -> str:
	"""The portal user of this Customer, only if that user is itself explicitly synthetic."""
	doc = frappe.get_doc("Customer", customer)
	for row in (doc.get("portal_users") or []):
		email = frappe.db.get_value("User", row.user, "email") or ""
		if email.endswith(SYNTHETIC_EMAIL_SUFFIX):
			return row.user
	raise FixtureRefused(f"{customer} has no {SYNTHETIC_EMAIL_SUFFIX} portal user: not an existing synthetic borrower")


def _summary(doc, borrower: str) -> dict:
	return {
		"fixture": FIXTURE_ID,
		"synthetic": True,
		"site": frappe.local.site,
		"application": doc.name,
		"applicant": doc.applicant,
		"borrower": borrower,
		"lifecycle_state": doc.get("custom_lifecycle_state"),
		"docstatus": doc.docstatus,
		"credit_score": doc.get("custom_credit_score"),
		"monthly_income": doc.get("custom_monthly_income"),
		"monthly_obligations": doc.get("custom_monthly_obligations"),
		"loan_amount": doc.get("loan_amount"),
		"repayment_periods": doc.get("repayment_periods"),
		"employment_months": doc.get("custom_employment_months"),
		"documents": len(doc.get("documents") or []),
		"latest_evidence": doc.get("custom_latest_evidence"),
	}


def prepare(application: str) -> dict:
	"""Move one existing synthetic draft to SUBMITTED through the portal's own borrower methods."""
	_guard_site()
	doc = frappe.get_doc("Loan Application", application)
	borrower = _synthetic_borrower(doc.applicant)
	if doc.docstatus != 0 or (doc.get("custom_lifecycle_state") or "DRAFT") != "DRAFT":
		raise FixtureRefused(f"{application} is not a DRAFT application; the fixture may not re-open a decided record")

	if not (doc.get("documents") or []):
		utils.attach_fixture_document(doc.name, borrower)
	with utils.as_user(borrower):
		applications.submit_application(doc.name)
	doc.reload()
	return _summary(doc, borrower)


def teardown(application: str) -> dict:
	"""Remove what the fixture left behind: its evidence, its audit rows, its document, its submission."""
	_guard_site()
	if not frappe.db.exists("Loan Application", application):
		return {"fixture": FIXTURE_ID, "application": application, "removed": [], "note": "already gone"}
	doc = frappe.get_doc("Loan Application", application)
	borrower = _synthetic_borrower(doc.applicant)
	removed = []

	frappe.db.set_value("Loan Application", application, "custom_latest_evidence", None, update_modified=False)
	for doctype in ("Loan Decision Evidence", "Evidence Ingestion Log", "Application State Log"):
		for row in frappe.get_all(doctype, filters={"loan_application": application}, pluck="name",
								ignore_permissions=True):
			frappe.delete_doc(doctype, row, ignore_permissions=True, delete_permanently=True)
			removed.append(f"{doctype}:{row}")
	for row in frappe.get_all("File", filters={"attached_to_doctype": "Loan Application",
											"attached_to_name": application}, pluck="name",
							ignore_permissions=True):
		frappe.delete_doc("File", row, ignore_permissions=True, delete_permanently=True)
		removed.append(f"File:{row}")

	doc.reload()
	if doc.docstatus == 1:
		doc.flags.ignore_permissions = True
		doc.cancel()
		removed.append(f"Loan Application:{application} cancelled")
		# Frappe has no un-submit. 2 (cancelled) -> 0 (draft) is written straight to the column because
		# this is a fixture revert on a disposable site, not a business action; the alternative — deleting
		# the application — would remove a record that was already on this site before the fixture.
		doc.reload()
		doc.db_set("docstatus", 0, update_modified=False)
		removed.append(f"Loan Application:{application} returned to docstatus 0")
	doc.reload()
	for row in list(doc.get("documents") or []):
		frappe.delete_doc("Loan Application Document", row.name, ignore_permissions=True, delete_permanently=True)
		removed.append(f"Loan Application Document:{row.name}")
	doc.db_set("custom_lifecycle_state", "DRAFT", update_modified=False)
	doc.db_set("custom_submitted_at", None, update_modified=False)
	doc.db_set("custom_policy_version", None, update_modified=False)
	doc.reload()
	out = _summary(doc, borrower)
	out["removed"] = removed
	return out
