"""Canonical lifecycle: transitions, native mapping, audit history and reconciliation (B3).

The portal owns `custom_lifecycle_state`, Lending owns the native `status`, and
`portal/lifecycle.py` is the single table both the portal and the FastAPI pipeline
load. These tests exercise the transitions a borrower and the agent can actually
perform on a disposable site.
"""

import uuid

import frappe
from frappe.tests.utils import FrappeTestCase

from loan_advisory_portal.api import applications, evidence
from loan_advisory_portal.install import EVIDENCE_ROLE
from loan_advisory_portal.portal import lifecycle
from loan_advisory_portal.portal.errors import Conflict, NotFound
from loan_advisory_portal.tests import utils
from loan_advisory_portal.tests.utils import as_user


def _record(application: str, *, decision: str = "APPROVED", state: str = "APPROVED",
            missing_fields: list[str] | None = None) -> dict:
	return {
		"schema": "decision-evidence/1",
		"record_id": f"rec-{uuid.uuid4().hex[:12]}",
		"application_ref": application,
		"decision": decision,
		"lifecycle_state": state,
		"policy": {"id": "personal_loan_synthetic_v1", "version": "1.0.0",
		           "policy_sha256": "a" * 64, "jdm_sha256": "b" * 64},
		"inputs": {"input_sha256": "c" * 64, "missing_fields": missing_fields or []},
		"engine": "ZEN 1.0",
		"evaluated_at": "2026-10-31T10:00:00",
		"trace_ref": {"sha256": "d" * 64, "store": "/tmp/traces"},
		"is_simulation": False,
	}


class LifecycleTableTest(FrappeTestCase):
	def test_the_select_options_are_the_canonical_states_in_order(self):
		field = frappe.get_meta("Loan Application").get_field("custom_lifecycle_state")
		self.assertEqual(field.options.splitlines(), list(lifecycle.STATES))
		self.assertEqual(lifecycle.STATES[0], "DRAFT")

	def test_every_state_has_an_explicit_native_status(self):
		self.assertEqual(set(lifecycle.NATIVE_STATUS), set(lifecycle.STATES))
		for state in lifecycle.STATES:
			self.assertIn(lifecycle.native_status_for(state), ("Open", "Approved", "Rejected"))
		self.assertEqual(lifecycle.native_status_for("APPROVED"), "Approved")
		self.assertEqual(lifecycle.native_status_for("REJECTED"), "Rejected")
		with self.assertRaises(ValueError):
			lifecycle.native_status_for("SIMULATION")

	def test_only_the_unambiguous_native_statuses_map_back(self):
		self.assertEqual(lifecycle.state_for_native("Approved"), "APPROVED")
		self.assertEqual(lifecycle.state_for_native("Rejected"), "REJECTED")
		self.assertIsNone(lifecycle.state_for_native("Open"))  # ambiguous, never guessed

	def test_transition_table(self):
		lifecycle.check_transition("DRAFT", "SUBMITTED")
		lifecycle.check_transition("SUBMITTED", "WITHDRAWN")
		lifecycle.check_transition("MANUAL_REVIEW", "APPROVED")
		lifecycle.check_transition("REJECTED", "MANUAL_REVIEW")
		for source, target in (("DRAFT", "APPROVED"), ("APPROVED", "MANUAL_REVIEW"),
		                       ("WITHDRAWN", "SUBMITTED"), ("INFO_REQUESTED", "UNDER_REVIEW")):
			with self.subTest(source=source, target=target):
				with self.assertRaises(lifecycle.IllegalTransition):
					lifecycle.check_transition(source, target)

	def test_automated_review_collapses_the_intermediate_state_but_not_terminal_ones(self):
		lifecycle.check_automated_transition("SUBMITTED", "APPROVED")
		lifecycle.check_automated_transition("MANUAL_REVIEW", "INFO_REQUESTED")
		lifecycle.check_automated_transition("APPROVED", "APPROVED")  # idempotent replay
		for source, target in (("DRAFT", "APPROVED"), ("APPROVED", "REJECTED"),
		                       ("WITHDRAWN", "APPROVED"), ("INFO_REQUESTED", "APPROVED")):
			with self.subTest(source=source, target=target):
				with self.assertRaises(lifecycle.IllegalTransition):
					lifecycle.check_automated_transition(source, target)

	def test_reconciliation_states(self):
		self.assertEqual(lifecycle.reconcile("APPROVED", "Approved", 1)["status"], "IN_SYNC")
		self.assertEqual(lifecycle.reconcile("WITHDRAWN", "Open", 1)["status"], "IN_SYNC")
		self.assertEqual(lifecycle.reconcile("APPROVED", "Open", 1)["status"], "PENDING_LENDING")
		self.assertEqual(lifecycle.reconcile("APPROVED", "Open", 0)["status"], "OUT_OF_SYNC")
		self.assertEqual(lifecycle.reconcile("REJECTED", "Approved", 1)["status"], "CONFLICT")
		self.assertEqual(lifecycle.reconcile("SUBMITTED", "Sanctioned", 1)["status"], "UNKNOWN")
		self.assertEqual(lifecycle.reconcile("NOT_A_STATE", "Open", 1)["status"], "UNKNOWN")


class PortalTransitionTest(FrappeTestCase):
	@classmethod
	def setUpClass(cls):
		super().setUpClass()
		utils.ensure_product(utils.ensure_company())

	def setUp(self):
		frappe.set_user("Administrator")
		self.borrower, self.profile = utils.make_borrower()
		self.customer = self.profile.customer
		with as_user(self.borrower.name):
			self.app = utils.make_application(self.customer)["name"]

	def _submit(self):
		utils.attach_fixture_document(self.app, self.borrower.name)
		with as_user(self.borrower.name):
			return applications.submit_application(self.app)

	def _state_log(self):
		return frappe.get_all(
			"Application State Log",
			filters={"loan_application": self.app},
			fields=["from_state", "to_state", "source", "actor", "native_written"],
			order_by="creation asc",
		)

	def test_submission_moves_draft_to_submitted_and_is_audited(self):
		result = self._submit()
		self.assertEqual(result["lifecycle"], "SUBMITTED")
		doc = frappe.get_doc("Loan Application", self.app)
		self.assertEqual(doc.docstatus, 1)
		self.assertTrue(doc.custom_submitted_at)
		self.assertEqual([(r.from_state, r.to_state, r.source, r.actor) for r in self._state_log()],
		                 [("DRAFT", "SUBMITTED", "portal", self.borrower.name)])

	def test_a_submitted_application_cannot_be_submitted_again(self):
		self._submit()
		with self.assertRaises(Conflict):
			with as_user(self.borrower.name):
				applications.submit_application(self.app)
		self.assertEqual(len(self._state_log()), 1)

	def _request_information(self):
		service = utils.make_service_user(EVIDENCE_ROLE)
		with as_user(service):
			evidence.ingest(_record(self.app, decision="ERROR", state="INFO_REQUESTED",
			                        missing_fields=["monthly_income"]),
			                native_status="Open", expected_application=self.app)

	def test_information_requested_can_be_corrected_and_resubmitted(self):
		self._submit()
		self._request_information()
		with as_user(self.borrower.name):
			self.assertTrue(applications.get_decision(self.app)["information_needed"])
		before = frappe.db.get_value(
			"Loan Application", self.app, ["docstatus", "status", "loan_amount", "custom_loan_purpose"],
			as_dict=True,
		)

		with as_user(self.borrower.name):
			applications.resubmit_application(self.app, monthly_income=60000, monthly_obligations=12000,
			                                  credit_score=760, employment_months=48)

		doc = frappe.get_doc("Loan Application", self.app)
		self.assertEqual(doc.docstatus, 1)  # resubmission is not a second Frappe submit
		self.assertEqual(doc.status, before.status)  # Lending's status stays untouched
		self.assertEqual((doc.loan_amount, doc.custom_loan_purpose),
		                 (before.loan_amount, before.custom_loan_purpose))  # material terms frozen
		self.assertEqual(doc.custom_lifecycle_state, "SUBMITTED")
		self.assertEqual((doc.custom_monthly_income, doc.custom_monthly_obligations,
		                  doc.custom_credit_score, doc.custom_employment_months),
		                 (60000, 12000, 760, 48))
		last = self._state_log()[-1]
		self.assertEqual((last.from_state, last.to_state, last.source, last.native_written),
		                 ("INFO_REQUESTED", "SUBMITTED", "portal", 0))
		with as_user(self.borrower.name):
			# The stored record still says INFO_REQUESTED; the application no longer does.
			self.assertFalse(applications.get_decision(self.app)["information_needed"])

	def test_resubmission_is_only_allowed_while_information_is_requested(self):
		self._submit()
		with as_user(self.borrower.name):
			with self.assertRaises(Conflict):
				applications.resubmit_application(self.app, monthly_income=50000)

		self._request_information()
		other_borrower, _ = utils.make_borrower()
		with as_user(other_borrower.name):
			with self.assertRaises(NotFound):
				applications.resubmit_application(self.app, monthly_income=50000)
		self.assertEqual(frappe.db.get_value("Loan Application", self.app, "custom_lifecycle_state"),
		                 "INFO_REQUESTED")

	def test_a_withdrawn_draft_cannot_be_submitted(self):
		with as_user(self.borrower.name):
			draft = utils.make_application(self.customer)["name"]
			applications.withdraw_application(draft)
			with self.assertRaises(Conflict):
				applications.submit_application(draft)

	def test_withdrawing_a_draft_and_a_submitted_application(self):
		with as_user(self.borrower.name):
			applications.withdraw_application(self.app)
		self.assertEqual(frappe.db.get_value("Loan Application", self.app, "custom_lifecycle_state"), "WITHDRAWN")
		self.assertEqual(frappe.db.get_value("Loan Application", self.app, "status"), "Open")
		self.assertEqual(self._state_log()[0].to_state, "WITHDRAWN")

		with as_user(self.borrower.name):
			self.app = utils.make_application(self.customer)["name"]
		self._submit()
		before = frappe.db.get_value("Loan Application", self.app, ["status", "docstatus"], as_dict=True)
		with as_user(self.borrower.name):
			applications.withdraw_application(self.app)
		after = frappe.db.get_value("Loan Application", self.app, ["status", "docstatus"], as_dict=True)
		self.assertEqual((after.status, after.docstatus), (before.status, before.docstatus))
		self.assertEqual(frappe.db.get_value("Loan Application", self.app, "custom_lifecycle_state"), "WITHDRAWN")
		self.assertEqual([(r.from_state, r.to_state) for r in self._state_log()],
		                 [("DRAFT", "SUBMITTED"), ("SUBMITTED", "WITHDRAWN")])

	def test_a_decided_application_cannot_be_withdrawn(self):
		self._submit()
		service = utils.make_service_user(EVIDENCE_ROLE)
		with as_user(service):
			evidence.ingest(_record(self.app), native_status="Approved", expected_application=self.app)
		with as_user(self.borrower.name):
			with self.assertRaises(Conflict):
				applications.withdraw_application(self.app)
		self.assertEqual(frappe.db.get_value("Loan Application", self.app, "custom_lifecycle_state"), "APPROVED")

	def test_the_borrower_timeline_is_the_state_log_in_order(self):
		self._submit()
		service = utils.make_service_user(EVIDENCE_ROLE)
		with as_user(service):
			evidence.ingest(_record(self.app), native_status="Approved", expected_application=self.app)

		with as_user(self.borrower.name):
			payload = applications.get_application(self.app)
		events = [event["event"] for event in payload["timeline"]]
		self.assertEqual(events[0], "Started")
		submitted = events.index("Submitted")
		evaluated = next(i for i, event in enumerate(events) if event.startswith("Evaluated"))
		approved = events.index("Approved")
		self.assertLess(submitted, evaluated)
		self.assertLess(evaluated, approved)
		self.assertIn("policy_version", payload["timeline"][evaluated])
