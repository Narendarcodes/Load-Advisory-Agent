"""The identity page must describe the flow that is actually configured.

Preview mode lists sample PAN/Aadhaar values because the preview form exists. A production
site has no online check, so the page must not present identity numbers as something the
borrower has to enter.
"""

import frappe
from frappe.tests.utils import FrappeTestCase

from loan_advisory_portal.tests.utils import as_user, make_borrower
from loan_advisory_portal.www.borrower import kyc as kyc_page


class KycCopyTest(FrappeTestCase):
	def setUp(self):
		frappe.set_user("Administrator")
		self.user, _ = make_borrower()
		frappe.local.form_dict = frappe._dict()

	def tearDown(self):
		frappe.local.form_dict = frappe._dict()
		super().tearDown()

	def render(self, demo: bool) -> str:
		previous = (frappe.conf.get("developer_mode"), frappe.conf.get("enable_demo_fixtures"))
		frappe.conf.developer_mode = 1 if demo else 0
		frappe.conf.enable_demo_fixtures = 1 if demo else 0
		try:
			with as_user(self.user.name):
				context = kyc_page.get_context(frappe._dict())
		finally:
			frappe.conf.developer_mode, frappe.conf.enable_demo_fixtures = previous
		self.assertEqual(bool(context["boot"]["demo"]), demo)
		return frappe.get_template("www/borrower/kyc.html").render(context)

	def test_production_copy_does_not_ask_for_pan_or_aadhaar(self):
		html = self.render(demo=False)
		self.assertIn("Online identity checks are not open yet", html)
		self.assertIn("What happens next", html)
		self.assertIn("does not ask for your PAN, your Aadhaar number or a face scan", html)
		self.assertNotIn("Your PAN, if you have one", html)
		self.assertNotIn("The last 4 digits of your Aadhaar", html)
		self.assertNotIn('id="kyc-form"', html)
		self.assertNotIn('id="kyc-pan-input"', html)

	def test_preview_copy_is_explicitly_a_preview(self):
		html = self.render(demo=True)
		self.assertIn("Preview mode", html)
		self.assertIn("What the preview uses", html)
		self.assertIn("Sample PAN", html)
		self.assertIn("Use sample values only", html)
		self.assertIn('id="kyc-form"', html)
		# Even in preview nothing claims a real verification happened.
		self.assertNotIn("Identity verified", html)
		self.assertNotIn("Loan approved", html)
