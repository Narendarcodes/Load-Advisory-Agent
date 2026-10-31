import frappe
from frappe.tests.utils import FrappeTestCase

from loan_advisory_portal.api import session
from loan_advisory_portal.services import livekit_token
from loan_advisory_portal.tests.utils import (
	as_user,
	ensure_company,
	ensure_product,
	make_application,
	make_borrower,
)
from loan_advisory_portal.www.borrower import assistant as assistant_page


class AssistantPageTest(FrappeTestCase):
	@classmethod
	def setUpClass(cls):
		super().setUpClass()
		ensure_product(ensure_company())

	def setUp(self):
		frappe.set_user("Administrator")
		self.user, self.profile = make_borrower()
		self.other_user, self.other_profile = make_borrower()
		frappe.local.form_dict = frappe._dict()

	def tearDown(self):
		frappe.local.form_dict = frappe._dict()
		super().tearDown()

	def context(self, **form):
		frappe.local.form_dict = frappe._dict(form)
		return assistant_page.get_context(frappe._dict())

	def test_requested_application_scopes_the_island(self):
		with as_user(self.user.name):
			created = make_application(self.profile.customer)
			context = self.context(application=created["name"])
		self.assertEqual(context["assistant"]["application"], created["name"])
		self.assertEqual(context["assistant"]["user"], self.user.name)
		self.assertTrue(context["assistant"]["csrf_token"])
		# The island renders the values `mint_assertion` will put in the assertion.
		self.assertEqual(context["assistant"]["literacy"], "medium")
		self.assertEqual(context["assistant"]["locale"], "en")
		self.assertEqual(
			context["assistant"]["voice"],
			{"enabled": True, "consent_version": livekit_token.CONSENT_VERSION},
		)
		self.assertNotIn("applications", context)
		self.assertNotIn("not_found", context)

	def test_voice_is_disabled_when_the_service_is_not_configured(self):
		with as_user(self.user.name):
			created = make_application(self.profile.customer)
			url = frappe.conf.livekit_url
			frappe.conf.livekit_url = None
			try:
				context = self.context(application=created["name"])
			finally:
				frappe.conf.livekit_url = url
		self.assertFalse(context["assistant"]["voice"]["enabled"])
		# The version still travels so the panel can show the notice it would record.
		self.assertEqual(
			context["assistant"]["voice"]["consent_version"], livekit_token.CONSENT_VERSION
		)

	def test_foreign_application_is_answered_as_missing(self):
		with as_user(self.other_user.name):
			foreign = make_application(self.other_profile.customer)
		with as_user(self.user.name):
			context = self.context(application=foreign["name"])
		self.assertTrue(context["not_found"])
		self.assertEqual(context["http_status_code"], 404)
		self.assertNotIn("assistant", context)

	def test_unknown_application_is_answered_as_missing(self):
		with as_user(self.user.name):
			context = self.context(application="APP-DOES-NOT-EXIST")
		self.assertTrue(context["not_found"])
		self.assertNotIn("assistant", context)

	def test_no_selection_shows_the_chooser(self):
		with as_user(self.user.name):
			mine = make_application(self.profile.customer)
			context = self.context()
		self.assertIsNone(context["application"])
		self.assertNotIn("assistant", context)
		self.assertIn(mine["name"], [row["name"] for row in context["applications"]])

	def test_selected_application_mounts_the_island(self):
		with as_user(self.user.name):
			created = make_application(self.profile.customer)
			session.select_application(created["name"])
			context = self.context()
		self.assertEqual(context["assistant"]["application"], created["name"])

	def test_stale_selection_falls_back_to_the_chooser(self):
		with as_user(self.user.name):
			created = make_application(self.profile.customer)
			session.select_application(created["name"])
		# The selection points at somebody else's application; the borrower picks again
		# instead of seeing a 404 they cannot act on.
		frappe.db.set_value("Loan Application", created["name"], "applicant", self.other_profile.customer)
		with as_user(self.user.name):
			context = self.context()
		self.assertIsNone(context["application"])
		self.assertIn("applications", context)

	def test_guest_is_sent_to_login(self):
		frappe.set_user("Guest")
		with self.assertRaises(frappe.Redirect):
			self.context()
		self.assertTrue(frappe.flags.redirect_location.startswith("/login?redirect-to="))
