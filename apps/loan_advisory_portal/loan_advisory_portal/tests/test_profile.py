import frappe
from frappe.tests.utils import FrappeTestCase

from loan_advisory_portal.api import profile as profile_api
from loan_advisory_portal.portal import legal
from loan_advisory_portal.portal.errors import Forbidden
from loan_advisory_portal.tests.utils import as_user, make_borrower


class ProfileTest(FrappeTestCase):
	def setUp(self):
		frappe.set_user("Administrator")
		self.user, self.profile = make_borrower()

	def test_update_saves_editable_fields(self):
		with as_user(self.user.name):
			# The real caller sends `cmd` along with the fields.
			saved = profile_api.update_profile(
				cmd="loan_advisory_portal.api.profile.update_profile",
				full_name="Updated Name",
				phone="+919812345678",
				employment_type="Self-employed",
				employer="Synthetic Traders",
				employment_months=36,
				monthly_income=120000,
				monthly_obligations=18000,
				preferred_locale="hi",
				literacy="high",
				consent_terms=True,
				consent_privacy=True,
			)
		self.assertEqual(saved["full_name"], "Updated Name")
		self.assertEqual(saved["employment_months"], 36)
		self.assertEqual(saved["monthly_income"], 120000)
		self.assertEqual(saved["literacy"], "high")

	def test_phone_can_be_cleared(self):
		with as_user(self.user.name):
			saved = profile_api.update_profile(phone="")
		self.assertIsNone(saved["phone"])

	def test_unknown_field_is_rejected(self):
		with as_user(self.user.name):
			with self.assertRaises(Forbidden):
				profile_api.update_profile(email="someone@example.invalid")

	def test_identity_fields_cannot_be_overridden(self):
		other, other_profile = make_borrower()
		with as_user(self.user.name):
			for field, value in (("user", other.name), ("customer", other_profile.customer)):
				with self.assertRaises(Forbidden):
					profile_api.update_profile(**{field: value})
		self.assertEqual(frappe.db.get_value("Borrower Profile", self.profile.name, "customer"),
		                 self.profile.customer)

	def test_invalid_values_are_rejected(self):
		with as_user(self.user.name):
			with self.assertRaises(Forbidden):
				profile_api.update_profile(phone="not-a-number")
			with self.assertRaises(Forbidden):
				profile_api.update_profile(employment_months=999)
			with self.assertRaises(Forbidden):
				profile_api.update_profile(monthly_income=-1)
			with self.assertRaises(Forbidden):
				profile_api.update_profile(preferred_locale="fr")
			with self.assertRaises(Forbidden):
				profile_api.update_profile(employment_type="Astronaut")

	def test_accepting_a_notice_records_its_version(self):
		with as_user(self.user.name):
			saved = profile_api.update_profile(consent_terms=True, consent_privacy=True)
		self.assertEqual(saved["terms_version"], legal.TERMS_VERSION)
		self.assertEqual(saved["privacy_version"], legal.PRIVACY_VERSION)

		# Withdrawing consent clears the stored version: it always means "accepted this text".
		with as_user(self.user.name):
			saved = profile_api.update_profile(consent_privacy=False)
		self.assertEqual(saved["privacy_version"], "")
		self.assertEqual(saved["terms_version"], legal.TERMS_VERSION)

	def test_validation_message_reaches_the_browser(self):
		# Frappe only serialises a message when one is registered.
		with as_user(self.user.name):
			with self.assertRaises(Forbidden):
				profile_api.update_profile(employment_months=999)
		self.assertIn("between 0 and 720", str(frappe.flags.error_message))
