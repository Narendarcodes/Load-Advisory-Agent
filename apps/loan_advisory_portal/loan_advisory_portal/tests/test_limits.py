import frappe
from frappe.tests.utils import FrappeTestCase

from loan_advisory_portal.portal import limits
from loan_advisory_portal.portal.errors import TooManyRequests
from loan_advisory_portal.tests.utils import as_user, make_borrower


class PortalLimitTest(FrappeTestCase):
	def setUp(self):
		frappe.set_user("Administrator")
		self.scope = f"limit-test-{frappe.generate_hash(length=10)}"

	def tearDown(self):
		if hasattr(frappe.local, "retry_after"):
			del frappe.local.retry_after

	def test_a_budget_is_per_account_and_sets_retry_after(self):
		user, _ = make_borrower()
		with as_user(user.name):
			limits.enforce(self.scope, 2, 60)
			limits.enforce(self.scope, 2, 60)
			with self.assertRaises(TooManyRequests) as caught:
				limits.enforce(self.scope, 2, 60)
			self.assertGreater(caught.exception.retry_after, 0)
			self.assertEqual(frappe.local.retry_after, caught.exception.retry_after)

		other, _ = make_borrower()
		with as_user(other.name):
			limits.enforce(self.scope, 2, 60)  # a different account has its own counter

	def test_guests_are_not_counted(self):
		frappe.set_user("Guest")
		for _ in range(3):
			limits.enforce(self.scope, 1, 60)
