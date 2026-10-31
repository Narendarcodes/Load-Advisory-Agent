import frappe
from frappe.tests.utils import FrappeTestCase

from loan_advisory_portal.tests.utils import as_user, ensure_company, ensure_product, make_borrower


class PermissionBoundaryTest(FrappeTestCase):
	"""Borrowers are portal users, not Desk users: generic REST must stay closed."""

	@classmethod
	def setUpClass(cls):
		super().setUpClass()
		ensure_product(ensure_company())

	def setUp(self):
		frappe.set_user("Administrator")
		self.user, self.profile = make_borrower()

	def test_no_generic_access_to_lending_doctypes(self):
		with as_user(self.user.name):
			for doctype in (
				"Loan Application",
				"Loan",
				"Loan Repayment",
				"Customer",
				"Loan Product",
				"Borrower Profile",
				"Account Invitation",
				"Loan Decision Evidence",
				"Voice Session",
				"Advisory Conversation",
			):
				with self.subTest(doctype=doctype):
					self.assertFalse(frappe.has_permission(doctype, ptype="read"))
					self.assertFalse(frappe.has_permission(doctype, ptype="write"))
					self.assertFalse(frappe.has_permission(doctype, ptype="create"))

	def test_borrower_cannot_list_other_customers(self):
		with as_user(self.user.name):
			with self.assertRaises(frappe.PermissionError):
				frappe.get_list("Customer", fields=["name"])
