import frappe
from frappe.tests.utils import FrappeTestCase

from loan_advisory_portal.api import applications, session
from loan_advisory_portal.portal.errors import Conflict, Forbidden, NotFound, SignInRequired
from loan_advisory_portal.portal.identity import borrower_context, owned_application
from loan_advisory_portal.tests.utils import (
	as_user,
	attach_fixture_document,
	ensure_company,
	ensure_product,
	make_application,
	make_borrower,
	make_customer,
)


class BorrowerAccessTest(FrappeTestCase):
	@classmethod
	def setUpClass(cls):
		super().setUpClass()
		ensure_product(ensure_company())

	def setUp(self):
		frappe.set_user("Administrator")
		self.user, self.profile = make_borrower()
		self.other_user, self.other_profile = make_borrower()

	def test_guest_is_rejected(self):
		frappe.set_user("Guest")
		with self.assertRaises(SignInRequired):
			borrower_context()
		self.assertFalse(session.me()["authenticated"])

	def test_user_without_borrower_role_is_rejected(self):
		user = frappe.get_doc(
			{
				"doctype": "User",
				"email": f"plain-{frappe.generate_hash(length=8)}@example.invalid",
				"first_name": "Plain",
				"user_type": "Website User",
				"send_welcome_email": 0,
			}
		)
		user.insert(ignore_permissions=True)
		with as_user(user.name):
			with self.assertRaises(Forbidden):
				borrower_context()

	def test_disabled_user_is_rejected(self):
		frappe.db.set_value("User", self.user.name, "enabled", 0)
		with as_user(self.user.name):
			with self.assertRaises(SignInRequired):
				borrower_context()

	def test_suspended_profile_is_rejected(self):
		frappe.db.set_value("Borrower Profile", self.profile.name, "status", "Suspended")
		with as_user(self.user.name):
			with self.assertRaises(Forbidden):
				borrower_context()

	def test_unlinked_customer_is_rejected(self):
		customer = make_customer()
		# Profile points at a customer whose portal_users belong to someone else.
		other = make_borrower(customer=customer)[1]
		frappe.db.set_value("Borrower Profile", self.profile.name, "customer", customer)
		with as_user(self.user.name):
			with self.assertRaises(Forbidden):
				borrower_context()
		self.assertEqual(other.customer, customer)

	def test_foreign_application_is_not_found(self):
		with as_user(self.other_user.name):
			foreign = make_application(self.other_profile.customer)
		with as_user(self.user.name):
			with self.assertRaises(NotFound):
				owned_application(foreign["name"])
			with self.assertRaises(NotFound):
				applications.get_application(foreign["name"])

	def test_own_application_is_returned(self):
		with as_user(self.user.name):
			created = make_application(self.profile.customer)
			payload = applications.get_application(created["name"])
		self.assertEqual(payload["name"], created["name"])
		self.assertEqual(payload["status"], "Open")
		self.assertEqual(payload["inputs"]["monthly_income"], 90000)

	def test_new_application_is_a_draft(self):
		# Frappe defaults a blank Select to its first option, so DRAFT must lead
		# the lifecycle options or every new application looks submitted.
		with as_user(self.user.name):
			created = make_application(self.profile.customer)
		self.assertEqual(created["lifecycle"], "DRAFT")
		self.assertEqual(created["submitted_at"], "")

	def test_application_list_is_scoped_to_customer(self):
		with as_user(self.user.name):
			mine = make_application(self.profile.customer)
		with as_user(self.other_user.name):
			theirs = make_application(self.other_profile.customer)
			names = [row["name"] for row in applications.list_applications()]
		self.assertIn(theirs["name"], names)
		self.assertNotIn(mine["name"], names)

	def test_selection_round_trip(self):
		with as_user(self.user.name):
			created = make_application(self.profile.customer)
			selected = session.select_application(created["name"])
			self.assertEqual(selected["selected_application"], created["name"])
			self.assertEqual(session.me()["selected_application"], created["name"])
			session.clear_application()
			self.assertIsNone(session.me()["selected_application"])

	def test_selection_rejects_foreign_application(self):
		with as_user(self.other_user.name):
			foreign = make_application(self.other_profile.customer)
		with as_user(self.user.name):
			with self.assertRaises(NotFound):
				session.select_application(foreign["name"])

	def test_submit_requires_a_document(self):
		with as_user(self.user.name):
			created = make_application(self.profile.customer)
			with self.assertRaises(Conflict):
				applications.submit_application(created["name"])

	def test_submit_sets_lifecycle_and_submits(self):
		with as_user(self.user.name):
			created = make_application(self.profile.customer)
			attach_fixture_document(created["name"], self.user.name)
			result = applications.submit_application(created["name"])
		self.assertEqual(result["lifecycle"], "SUBMITTED")
		self.assertTrue(result["submitted_at"])
		self.assertEqual(frappe.db.get_value("Loan Application", created["name"], "docstatus"), 1)

	def test_document_cannot_be_added_after_submission(self):
		with as_user(self.user.name):
			created = make_application(self.profile.customer)
			attach_fixture_document(created["name"], self.user.name)
			applications.submit_application(created["name"])
			from loan_advisory_portal.api import documents

			with self.assertRaises(Conflict):
				documents.attach_document(created["name"], "Identity Proof", "missing-file")

	def test_withdraw_marks_lifecycle(self):
		with as_user(self.user.name):
			created = make_application(self.profile.customer)
			result = applications.withdraw_application(created["name"])
			self.assertEqual(result["lifecycle"], "WITHDRAWN")
			with self.assertRaises(Conflict):
				applications.withdraw_application(created["name"])

	def test_amount_limits_are_enforced(self):
		with as_user(self.user.name):
			with self.assertRaises(Forbidden):
				make_application(self.profile.customer, loan_amount=2_000_000)
			with self.assertRaises(Forbidden):
				make_application(self.profile.customer, loan_amount=0)
			with self.assertRaises(Forbidden):
				make_application(self.profile.customer, tenure_months=0)
			with self.assertRaises(Forbidden):
				make_application(self.profile.customer, purpose="")
			with self.assertRaises(Forbidden):
				make_application(self.profile.customer, credit_score=120)

	def test_profile_defaults_feed_new_application(self):
		with as_user(self.user.name):
			created = make_application(self.profile.customer, monthly_income=None, monthly_obligations=None)
			doc = frappe.get_doc("Loan Application", created["name"])
		self.assertEqual(doc.custom_monthly_income, 90000)
		self.assertEqual(doc.custom_monthly_obligations, 12000)
