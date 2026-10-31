"""Least-privilege evidence ingestion (Phase B2).

The FastAPI decision pipeline holds only `Evidence Service`. It calls one trusted
method that owns the application/evidence linkage, the write allowlist and the
audit row. The role itself holds no DocType CRUD grants, so these tests prove
both the allowed path and the denied paths directly against the site.
"""

import json
import uuid

import frappe
from frappe.tests.utils import FrappeTestCase

from loan_advisory_portal.api import applications, evidence
from loan_advisory_portal.install import EVIDENCE_ROLE
from loan_advisory_portal.tests import utils
from loan_advisory_portal.tests.utils import as_user

POLICY = {"id": "personal_loan_synthetic_v1", "version": "1.0.0",
          "policy_sha256": "a" * 64, "jdm_sha256": "b" * 64}


def _record(application: str, *, record_id: str | None = None, decision: str = "APPROVED",
            state: str = "APPROVED", **overrides) -> dict:
	record = {
		"schema": "decision-evidence/1",
		"record_id": record_id or f"rec-{uuid.uuid4().hex[:12]}",
		"application_ref": application,
		"decision": decision,
		"lifecycle_state": state,
		"policy": dict(POLICY),
		"inputs": {"input_sha256": "c" * 64},
		"engine": "ZEN 1.0",
		"evaluated_at": "2026-10-31T10:00:00",
		"trace_ref": {"sha256": "d" * 64, "store": "/tmp/traces"},
		"is_simulation": False,
	}
	record.update(overrides)
	return record


class EvidenceIngestionTest(FrappeTestCase):
	@classmethod
	def setUpClass(cls):
		super().setUpClass()
		utils.ensure_product(utils.ensure_company())
		utils.ensure_document_type()

	def setUp(self):
		frappe.set_user("Administrator")
		self.borrower, self.profile = utils.make_borrower()
		self.customer = self.profile.customer
		self.service = utils.make_service_user(EVIDENCE_ROLE)
		with as_user(self.borrower.name):
			self.app = utils.make_application(self.customer)["name"]
			self.draft = utils.make_application(self.customer)["name"]
		utils.attach_fixture_document(self.app, self.borrower.name)
		with as_user(self.borrower.name):
			applications.submit_application(self.app)

	def _ingest(self, record, native_status="Approved", expected=None):
		with as_user(self.service):
			return evidence.ingest(record, native_status=native_status,
				expected_application=expected or record["application_ref"])

	def test_valid_evidence_persists_and_moves_the_application(self):
		record = _record(self.app)
		before = frappe.db.get_value("Loan Application", self.app, "status")
		result = self._ingest(record)

		self.assertEqual(result["action"], "created")
		self.assertFalse(result["wrote_native_status"])  # submitted: Lending owns the native status
		stored = frappe.get_doc("Loan Decision Evidence", record["record_id"])
		self.assertEqual(stored.loan_application, self.app)
		self.assertEqual(json.loads(stored.record_json), record)
		self.assertEqual(stored.engine, "ZEN 1.0")  # a dict engine is flattened, never stringified raw
		self.assertEqual(stored.trace_store, "/tmp/traces")

		application = frappe.get_doc("Loan Application", self.app)
		self.assertEqual(application.custom_lifecycle_state, "APPROVED")
		self.assertEqual(application.custom_latest_evidence, record["record_id"])
		self.assertEqual(application.status, before)

	def test_native_status_is_written_only_before_submission(self):
		# A record submitted outside the portal (docstatus 0) still gets the mapped status.
		frappe.db.set_value("Loan Application", self.draft, "custom_lifecycle_state", "SUBMITTED",
		                    update_modified=False)
		result = self._ingest(_record(self.draft), native_status="Approved")
		self.assertTrue(result["wrote_native_status"])
		self.assertEqual(frappe.db.get_value("Loan Application", self.draft, "status"), "Approved")
		log = frappe.get_all("Application State Log", filters={"loan_application": self.draft},
		                     fields=["from_state", "to_state", "native_written"])
		self.assertEqual([(row.from_state, row.to_state, row.native_written) for row in log],
		                 [("SUBMITTED", "APPROVED", 1)])

	def test_a_draft_cannot_be_decided(self):
		record = _record(self.draft)
		with self.assertRaises(frappe.ValidationError):
			self._ingest(record)
		self.assertFalse(frappe.db.exists("Loan Decision Evidence", record["record_id"]))
		self.assertEqual(frappe.db.get_value("Loan Application", self.draft, "custom_lifecycle_state"), "DRAFT")

	def test_a_terminal_application_cannot_be_re_decided(self):
		self._ingest(_record(self.app))
		with self.assertRaises(frappe.ValidationError):
			self._ingest(_record(self.app, decision="REJECTED", state="REJECTED"), native_status="Rejected")
		self.assertEqual(frappe.db.get_value("Loan Application", self.app, "custom_lifecycle_state"), "APPROVED")

	def test_repeating_the_same_record_is_idempotent_and_audited(self):
		record = _record(self.app)
		self.assertEqual(self._ingest(record)["action"], "created")
		self.assertEqual(self._ingest(record)["action"], "unchanged")

		self.assertEqual(frappe.db.count("Loan Decision Evidence", {"loan_application": self.app}), 1)
		rows = evidence.audit_log(record["record_id"])
		self.assertEqual([row["action"] for row in rows], ["created", "unchanged"])
		self.assertEqual({row["actor"] for row in rows}, {self.service})
		self.assertFalse(rows[0]["wrote_native_status"])  # submitted application
		transitions = frappe.get_all("Application State Log", filters={"loan_application": self.app},
		                             fields=["from_state", "to_state"])
		self.assertEqual([(row.from_state, row.to_state) for row in transitions],
		                 [("DRAFT", "SUBMITTED"), ("SUBMITTED", "APPROVED")])

	def test_evidence_for_an_unrelated_application_is_refused(self):
		other_customer = utils.make_customer()
		other_borrower, other_profile = utils.make_borrower(other_customer)
		with as_user(other_borrower.name):
			other_app = utils.make_application(other_profile.customer)["name"]

		record = _record(self.app)
		with self.assertRaises(frappe.PermissionError):
			self._ingest(record, expected=other_app)
		self.assertFalse(frappe.db.exists("Loan Decision Evidence", record["record_id"]))
		self.assertIsNone(frappe.db.get_value("Loan Application", self.app, "custom_latest_evidence"))

	def test_a_record_id_cannot_be_rebound_to_another_application(self):
		record = _record(self.app)
		self._ingest(record)

		other_customer = utils.make_customer()
		other_borrower, other_profile = utils.make_borrower(other_customer)
		with as_user(other_borrower.name):
			other_app = utils.make_application(other_profile.customer)["name"]
		rebound = _record(other_app, record_id=record["record_id"])
		with self.assertRaises(frappe.PermissionError):
			self._ingest(rebound)
		self.assertEqual(
			frappe.db.get_value("Loan Decision Evidence", record["record_id"], "loan_application"), self.app
		)

	def test_simulations_and_unlisted_values_are_refused(self):
		with self.assertRaises(frappe.ValidationError):
			self._ingest(_record(self.app, is_simulation=True))
		with self.assertRaises(frappe.ValidationError):
			self._ingest(_record(self.app, decision="MAYBE"))
		with self.assertRaises(frappe.ValidationError):
			self._ingest(_record(self.app, state="NOT_A_STATE"))
		with self.assertRaises(frappe.ValidationError):
			self._ingest(_record(self.app), native_status="Sanctioned")

	def test_a_submitted_application_keeps_its_native_status(self):
		before = frappe.db.get_value("Loan Application", self.app, ["status", "docstatus"], as_dict=True)

		result = self._ingest(_record(self.app, decision="REJECTED", state="REJECTED"), native_status="Rejected")
		self.assertFalse(result["wrote_native_status"])
		after = frappe.db.get_value("Loan Application", self.app, ["status", "docstatus"], as_dict=True)
		self.assertEqual((after.status, after.docstatus), (before.status, before.docstatus))
		self.assertEqual(frappe.db.get_value("Loan Application", self.app, "custom_lifecycle_state"), "REJECTED")

	def test_guest_is_refused(self):
		frappe.set_user("Guest")
		try:
			with self.assertRaises(frappe.PermissionError):
				evidence.ingest(_record(self.app), native_status="Open", expected_application=self.app)
		finally:
			frappe.set_user("Administrator")

	def test_a_borrower_cannot_write_evidence(self):
		record = _record(self.app)
		with as_user(self.borrower.name):
			with self.assertRaises(frappe.PermissionError):
				evidence.ingest(record, native_status="Open", expected_application=self.app)
			with self.assertRaises(frappe.PermissionError):
				doc = frappe.get_doc({
					"doctype": "Loan Decision Evidence", "record_id": record["record_id"],
					"loan_application": self.app, "decision": "APPROVED", "record_json": "{}",
				})
				doc.insert()
		self.assertFalse(frappe.db.exists("Loan Decision Evidence", record["record_id"]))

	def test_the_service_holds_no_document_grants(self):
		with as_user(self.service):
			self.assertNotIn("System Manager", frappe.get_roles())
			for doctype in ("Loan Application", "Customer", "Borrower Profile",
			                "Loan Decision Evidence", "Evidence Ingestion Log"):
				with self.subTest(doctype=doctype):
					for ptype in ("read", "write", "create", "delete"):
						self.assertFalse(frappe.has_permission(doctype, ptype=ptype))

	def test_the_service_cannot_create_or_modify_borrower_records(self):
		with as_user(self.service):
			with self.assertRaises(frappe.PermissionError):
				frappe.get_doc({"doctype": "Customer", "customer_name": utils.unique("Synthetic"),
				                "customer_type": "Individual"}).insert()
			with self.assertRaises(frappe.PermissionError):
				frappe.get_doc({"doctype": "Borrower Profile", "user": self.borrower.name,
				                "customer": self.customer, "status": "Active",
				                "onboarding_state": "Registered", "full_name": "Injected"}).insert()
			with self.assertRaises(frappe.PermissionError):
				frappe.get_doc("Customer", self.customer).save()
			with self.assertRaises(frappe.PermissionError):
				frappe.get_list("Customer", fields=["name"])

	def test_the_service_cannot_modify_loan_decisions(self):
		record = _record(self.app)
		self._ingest(record)
		with as_user(self.service):
			doc = frappe.get_doc("Loan Decision Evidence", record["record_id"])
			doc.decision = "REJECTED"
			with self.assertRaises(frappe.PermissionError):
				doc.save()
			with self.assertRaises(frappe.PermissionError):
				frappe.delete_doc("Loan Decision Evidence", record["record_id"])
			application = frappe.get_doc("Loan Application", self.app)
			application.status = "Rejected"
			with self.assertRaises(frappe.PermissionError):
				application.save()

		self.assertEqual(
			frappe.db.get_value("Loan Decision Evidence", record["record_id"], "decision"), "APPROVED"
		)

	def test_admin_rights_are_not_required_for_the_allowed_path(self):
		with as_user(self.service):
			self.assertNotIn("System Manager", frappe.get_roles())
		self.assertEqual(self._ingest(_record(self.app))["action"], "created")
