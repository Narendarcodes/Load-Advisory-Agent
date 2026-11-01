import frappe
from frappe.tests.utils import FrappeTestCase

from loan_advisory_portal.api import profile as profile_api
from loan_advisory_portal.portal import preferences
from loan_advisory_portal.portal.errors import Forbidden
from loan_advisory_portal.services import assertion
from loan_advisory_portal.tests.utils import as_user, make_borrower
from loan_advisory_portal.www.borrower import profile as profile_page


class PreferenceVocabularyTest(FrappeTestCase):
	def setUp(self):
		frappe.set_user("Administrator")
		self.user, self.profile = make_borrower()

	def test_the_offered_values_are_the_agent_vocabulary(self):
		self.assertEqual(preferences.LOCALES, ("en", "hi", "te"))
		self.assertEqual(preferences.LITERACIES, ("low", "medium", "high"))

	def test_legacy_and_unknown_values_normalise_on_read(self):
		self.assertEqual(preferences.normalise_locale("mr"), "en")
		self.assertEqual(preferences.normalise_locale("HI"), "hi")
		self.assertEqual(preferences.normalise_locale("fr"), "en")
		self.assertEqual(preferences.normalise_locale(None), "en")
		self.assertEqual(preferences.normalise_literacy("standard"), "medium")
		self.assertEqual(preferences.normalise_literacy("plain"), "low")
		self.assertEqual(preferences.normalise_literacy("HIGH"), "high")
		self.assertEqual(preferences.normalise_literacy("verbose"), "medium")
		self.assertEqual(preferences.normalise_literacy(None), "medium")

	def test_options_carry_labels_and_values_from_the_table(self):
		self.assertEqual(
			[option["code"] for option in preferences.locale_options()], list(preferences.LOCALES)
		)
		self.assertEqual(
			[option["value"] for option in preferences.literacy_options()],
			list(preferences.LITERACIES),
		)
		self.assertEqual(preferences.LITERACY_LABELS["low"], "Plain, simple wording")

	def test_the_assertion_carries_canonical_values_only(self):
		self.assertEqual(assertion.preferences("high", "te"), {"literacy": "high", "locale": "te"})
		self.assertEqual(
			assertion.preferences("standard", "mr"), {"literacy": "medium", "locale": "en"}
		)
		self.assertEqual(
			assertion.preferences("plain", "fr"), {"literacy": "low", "locale": "en"}
		)

	def test_the_profile_page_offers_exactly_the_vocabulary(self):
		with as_user(self.user.name):
			context = profile_page.get_context(frappe._dict())
		self.assertEqual(
			[option["code"] for option in context["locale_options"]], list(preferences.LOCALES)
		)
		self.assertEqual(
			[option["value"] for option in context["literacy_options"]],
			list(preferences.LITERACIES),
		)
		self.assertIn(context["current_locale"], preferences.LOCALES)
		self.assertIn(context["current_literacy"], preferences.LITERACIES)
		self.assertNotIn("mr", [option["code"] for option in context["locale_options"]])

	def test_updates_store_canonical_values(self):
		with as_user(self.user.name):
			saved = profile_api.update_profile(literacy="plain", preferred_locale="mr")
		self.assertEqual(saved["literacy"], "low")
		self.assertEqual(saved["preferred_locale"], "en")
		self.assertEqual(
			frappe.db.get_value("Borrower Profile", self.profile.name, "literacy"), "low"
		)

	def test_unknown_values_are_still_rejected(self):
		with as_user(self.user.name):
			with self.assertRaises(Forbidden):
				profile_api.update_profile(literacy="verbose")
			with self.assertRaises(Forbidden):
				profile_api.update_profile(preferred_locale="fr")
