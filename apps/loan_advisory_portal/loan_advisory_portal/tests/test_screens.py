import frappe
from frappe.tests.utils import FrappeTestCase

from loan_advisory_portal.api import applications
from loan_advisory_portal.portal import guidance, legal, lifecycle
from loan_advisory_portal.tests.utils import (
	as_user,
	ensure_company,
	ensure_product,
	make_application,
	make_borrower,
)
from loan_advisory_portal.www.borrower import help as help_page
from loan_advisory_portal.www.borrower import privacy as privacy_page
from loan_advisory_portal.www.borrower import products as products_page
from loan_advisory_portal.www.borrower import terms as terms_page


class PublicScreensTest(FrappeTestCase):
	@classmethod
	def setUpClass(cls):
		super().setUpClass()
		ensure_product(ensure_company())

	def setUp(self):
		# Notices and the product page carry no borrower data: a guest may read them,
		# which is what the invitation form needs before an account exists.
		frappe.set_user("Guest")
		frappe.local.form_dict = frappe._dict()

	def tearDown(self):
		frappe.local.form_dict = frappe._dict()
		super().tearDown()

	def test_notices_and_help_are_readable_without_an_account(self):
		for module, title in (
			(help_page, "Help"),
			(terms_page, "Terms of use"),
			(privacy_page, "Privacy notice"),
		):
			context = module.get_context(frappe._dict())
			self.assertEqual(context["title"], title)
			self.assertIsNone(context["blocked"])

	def test_help_renders_the_same_status_vocabulary_as_the_application_page(self):
		context = help_page.get_context(frappe._dict())
		self.assertEqual(
			[entry["title"] for entry in context["states"]],
			[guidance.for_state(state)["title"] for state in lifecycle.STATES],
		)

	def test_notices_carry_the_versions_the_consent_records(self):
		terms = terms_page.get_context(frappe._dict())
		privacy = privacy_page.get_context(frappe._dict())
		self.assertEqual(terms["version"], legal.TERMS_VERSION)
		self.assertEqual(privacy["version"], legal.PRIVACY_VERSION)
		self.assertEqual(privacy["terms_version"], legal.TERMS_VERSION)
		self.assertEqual(terms["updated"], legal.UPDATED)

	def test_products_page_reads_the_enabled_catalog(self):
		context = products_page.get_context(frappe._dict())
		names = [row["name"] for row in context["products"]]
		self.assertIn("Synthetic Portal Product", names)
		row = next(row for row in context["products"] if row["name"] == "Synthetic Portal Product")
		self.assertGreater(row["maximum_loan_amount"], 0)
		self.assertGreater(row["rate_of_interest"], 0)


class GuidanceTest(FrappeTestCase):
	@classmethod
	def setUpClass(cls):
		super().setUpClass()
		ensure_product(ensure_company())

	def setUp(self):
		frappe.set_user("Administrator")
		self.user, self.profile = make_borrower()

	def test_every_lifecycle_state_has_borrower_guidance(self):
		guidance.assert_complete()
		for state in lifecycle.STATES:
			entry = guidance.for_state(state)
			self.assertTrue(entry["title"], state)
			self.assertTrue(entry["summary"], state)
			self.assertTrue(entry["next_steps"], state)

	def test_an_unknown_state_is_described_without_guessing(self):
		entry = guidance.for_state("SOMETHING_NEW")
		self.assertIn("does not describe", entry["summary"])
		self.assertNotIn("SOMETHING_NEW", entry["summary"])

	def test_the_application_payload_carries_its_state_guidance(self):
		with as_user(self.user.name):
			created = make_application(self.profile.customer)
			payload = applications.get_application(created["name"])
		self.assertEqual(payload["guidance"], guidance.for_state("DRAFT"))
