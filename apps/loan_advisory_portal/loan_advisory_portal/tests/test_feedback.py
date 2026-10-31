import frappe
from frappe.tests.utils import FrappeTestCase

from loan_advisory_portal.api import feedback
from loan_advisory_portal.portal.errors import Forbidden, NotFound
from loan_advisory_portal.tests.utils import (
	as_user,
	ensure_company,
	ensure_product,
	make_application,
	make_borrower,
)


class FeedbackTest(FrappeTestCase):
	@classmethod
	def setUpClass(cls):
		super().setUpClass()
		ensure_product(ensure_company())

	def setUp(self):
		frappe.set_user("Administrator")
		self.user, self.profile = make_borrower()
		self.other_user, self.other_profile = make_borrower()

	def test_submit_and_list_own_feedback(self):
		with as_user(self.user.name):
			created = feedback.submit_feedback(4, "The explanation was clear.", category="chat")
			rows = feedback.list_feedback()
		self.assertEqual(created["status"], "New")
		self.assertEqual(len(rows), 1)
		self.assertEqual(rows[0]["rating"], 4)

	def test_other_borrowers_feedback_is_not_listed(self):
		with as_user(self.other_user.name):
			feedback.submit_feedback(2, "Second borrower note.")
		with as_user(self.user.name):
			self.assertEqual(feedback.list_feedback(), [])

	def test_foreign_application_is_rejected(self):
		with as_user(self.other_user.name):
			foreign = make_application(self.other_profile.customer)["name"]
		with as_user(self.user.name):
			with self.assertRaises(NotFound):
				feedback.submit_feedback(5, "Great", application=foreign)

	def test_rating_and_category_are_validated(self):
		with as_user(self.user.name):
			with self.assertRaises(Forbidden):
				feedback.submit_feedback(0, "bad")
			with self.assertRaises(Forbidden):
				feedback.submit_feedback(6, "bad")
			with self.assertRaises(Forbidden):
				feedback.submit_feedback(3, "bad", category="unknown")
			with self.assertRaises(Forbidden):
				feedback.submit_feedback(3, " ")

	def test_borrowers_have_no_direct_doctype_access(self):
		# The whitelisted write path is the only route: no DocPerm means a direct REST
		# create cannot supply its own application or skip rating/category checks.
		with as_user(self.user.name):
			created = feedback.submit_feedback(5, "Excellent")
			for permission in ("read", "create", "write"):
				self.assertFalse(frappe.has_permission("Borrower Feedback", ptype=permission), permission)
			with self.assertRaises(frappe.PermissionError):
				frappe.get_list("Borrower Feedback", fields=["name"])
			with self.assertRaises(frappe.PermissionError):
				frappe.get_doc(
					{
						"doctype": "Borrower Feedback",
						"user": self.user.name,
						"customer": self.profile.customer,
						"rating": 5,
						"message": "Direct insert",
					}
				).insert()
		with as_user(self.other_user.name):
			doc = frappe.get_doc("Borrower Feedback", created["name"])
			self.assertFalse(frappe.has_permission("Borrower Feedback", ptype="read", doc=doc))

	def test_feedback_identity_comes_from_the_session(self):
		with as_user(self.user.name):
			created = feedback.submit_feedback(4, "Bound to the caller.")
		row = frappe.db.get_value(
			"Borrower Feedback", created["name"], ["user", "customer"], as_dict=True
		)
		self.assertEqual((row.user, row.customer), (self.user.name, self.profile.customer))
