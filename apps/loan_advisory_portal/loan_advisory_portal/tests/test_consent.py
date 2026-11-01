"""Consent timestamp semantics on `Borrower Profile`.

The invariant under test: `consent_at` records a consent event and nothing else. Saving an unrelated
field — a name in the application wizard, an employer on the profile page — must leave the historical
timestamp exactly where it is, because that timestamp is what a consent audit reads.

Every test drives the real Frappe document lifecycle (`insert`/`save` and the whitelisted profile API),
not a copy of `validate()`: the defect this module guards against lived in the interaction between the
controller hook and the API, and only the lifecycle shows it.
"""

import json

import frappe
from frappe.tests.utils import FrappeTestCase

from loan_advisory_portal.api import profile as profile_api
from loan_advisory_portal.portal import legal
from loan_advisory_portal.tests.utils import as_user, make_borrower

# A consent event long in the past, written through the document API, so any restamping by a later
# save is visible as a difference rather than as two timestamps that happen to land in the same second.
PAST = "2026-01-05 09:00:00"


def stored(name: str) -> dict:
	return frappe.db.get_value(
		"Borrower Profile",
		name,
		[
			"consent_at",
			"consent_terms",
			"consent_privacy",
			"terms_version",
			"privacy_version",
			"full_name",
			"phone",
			"employer",
		],
		as_dict=True,
	)


def consent_changes(name: str) -> list:
	"""The `changed` entries of every Version row on this document, oldest first."""
	rows = frappe.db.sql(
		"SELECT `data` FROM `tabVersion` WHERE ref_doctype = %s AND docname = %s ORDER BY creation",
		("Borrower Profile", name),
		as_dict=True,
	)
	changes = []
	for row in rows:
		payload = json.loads(row["data"])
		changed = payload.get("changed") or []
		changes.append({"fields": [entry[0] for entry in changed], "raw": changed})
	return changes


class ConsentTimestampTest(FrappeTestCase):
	def setUp(self):
		frappe.set_user("Administrator")
		self.user, self.profile = make_borrower()
		self.name = self.profile.name

	def write_through_the_document_api(self, **values):
		"""The only sanctioned way to put a value on a document: load it, set it, save it.

		`ignore_version=False` because Frappe otherwise suppresses Version rows inside tests
		(`flags.ignore_version = frappe.in_test`), and these tests need the audit trail visible.
		"""
		doc = frappe.get_doc("Borrower Profile", self.name)
		for field, value in values.items():
			doc.set(field, value)
		doc.flags.ignore_permissions = True
		doc.save(ignore_version=False)
		return doc

	# --- the defect, and its absence -------------------------------------------------------------

	def test_unrelated_profile_save_preserves_the_consent_timestamp(self):
		self.write_through_the_document_api(consent_at=PAST)
		with as_user(self.user.name):
			profile_api.update_profile(full_name="Renamed Borrower", phone="+919812345678")
		after = stored(self.name)
		self.assertEqual(str(after["full_name"]), "Renamed Borrower")
		self.assertEqual(str(after["consent_at"]), PAST)

	def test_the_wizard_payload_that_caused_the_finding_leaves_consent_untouched(self):
		# The application wizard posts exactly these two fields and no consent keys at all.
		self.write_through_the_document_api(consent_at=PAST)
		with as_user(self.user.name):
			profile_api.update_profile(
				cmd="loan_advisory_portal.api.profile.update_profile", full_name="Wizard Name", phone="+919812345678"
			)
		self.assertEqual(str(stored(self.name)["consent_at"]), PAST)

	def test_repeated_saves_do_not_restamp_consent(self):
		self.write_through_the_document_api(consent_at=PAST)
		with as_user(self.user.name):
			for attempt in range(3):
				profile_api.update_profile(employer=f"Synthetic Traders {attempt}")
		self.assertEqual(str(stored(self.name)["consent_at"]), PAST)

	def test_saving_the_document_outside_the_api_does_not_restamp(self):
		# A desk save, or any other caller that never touches a consent field.
		self.write_through_the_document_api(consent_at=PAST)
		doc = frappe.get_doc("Borrower Profile", self.name)
		doc.employer = "Written from the desk"
		doc.flags.ignore_permissions = True
		doc.save()
		self.assertEqual(str(stored(self.name)["consent_at"]), PAST)

	def test_resending_unchanged_checkboxes_is_not_a_new_consent_event(self):
		# The profile page always includes both consent fields in its payload, so a borrower who is
		# only editing their income must not be recorded as consenting again.
		with as_user(self.user.name):
			profile_api.update_profile(consent_terms=True, consent_privacy=True)
		self.assertEqual(stored(self.name)["terms_version"], legal.TERMS_VERSION)
		self.write_through_the_document_api(consent_at=PAST)
		with as_user(self.user.name):
			profile_api.update_profile(
				consent_terms=True, consent_privacy=True, full_name="Resent Boxes", monthly_income=50000
			)
		self.assertEqual(str(stored(self.name)["consent_at"]), PAST)

	def test_document_validation_alone_does_not_move_the_timestamp(self):
		self.write_through_the_document_api(consent_at=PAST)
		before = consent_changes(self.name)
		doc = frappe.get_doc("Borrower Profile", self.name)
		doc.profile_completion = doc.profile_completion  # no field changes at all
		doc.flags.ignore_permissions = True
		doc.save()
		self.assertEqual(str(stored(self.name)["consent_at"]), PAST)
		self.assertEqual(len(consent_changes(self.name)), len(before))

	# --- consent events --------------------------------------------------------------------------

	def test_a_profile_created_without_consent_holds_no_timestamp(self):
		user, profile = make_borrower(consent=False)
		record = stored(profile.name)
		self.assertIsNone(record["consent_at"])
		self.assertEqual(int(record["consent_terms"]), 0)

	def test_first_explicit_consent_records_a_timestamp(self):
		user, profile = make_borrower(consent=False)
		self.assertIsNone(stored(profile.name)["consent_at"])
		with as_user(user.name):
			profile_api.update_profile(consent_terms=True, consent_privacy=True)
		record = stored(profile.name)
		self.assertIsNotNone(record["consent_at"], "granting consent must record when it was given")
		self.assertEqual(record["terms_version"], legal.TERMS_VERSION)
		self.assertEqual(record["privacy_version"], legal.PRIVACY_VERSION)

	def test_incomplete_consent_never_claims_consent(self):
		self.write_through_the_document_api(consent_at=PAST)
		with as_user(self.user.name):
			profile_api.update_profile(consent_terms=True, consent_privacy=False)
		record = stored(self.name)
		self.assertIsNone(record["consent_at"], "one notice withheld must not report a consent timestamp")
		self.assertEqual(int(record["consent_terms"]), 1)
		self.assertEqual(int(record["consent_privacy"]), 0)
		self.assertEqual(record["terms_version"], legal.TERMS_VERSION)
		self.assertEqual(record["privacy_version"] or "", "")

	def test_revocation_then_reconsent_records_a_new_event(self):
		self.write_through_the_document_api(consent_at=PAST)
		with as_user(self.user.name):
			profile_api.update_profile(consent_privacy=False)
		self.assertIsNone(stored(self.name)["consent_at"])
		with as_user(self.user.name):
			profile_api.update_profile(consent_privacy=True)
		after = stored(self.name)["consent_at"]
		self.assertIsNotNone(after)
		self.assertNotEqual(str(after), PAST)

	def test_a_newly_required_notice_version_is_stamped_when_accepted(self):
		# The stored version no longer matches the notice now on screen: acceptance is a new event.
		self.write_through_the_document_api(consent_at=PAST, terms_version="portal-terms/0")
		with as_user(self.user.name):
			profile_api.update_profile(consent_terms=True)
		record = stored(self.name)
		self.assertEqual(record["terms_version"], legal.TERMS_VERSION)
		self.assertNotEqual(str(record["consent_at"]), PAST)

	def test_a_rejected_consent_write_leaves_no_timestamp(self):
		# An unknown field is refused before the document is touched, so consent cannot move.
		self.write_through_the_document_api(consent_at=PAST)
		with as_user(self.user.name):
			with self.assertRaises(Exception):
				profile_api.update_profile(consent_terms=True, consent_privacy=True, email="elsewhere@example.invalid")
		self.assertEqual(str(stored(self.name)["consent_at"]), PAST)

	# --- the guarantees the restoration of a historical value depends on --------------------------

	def test_a_timestamp_set_deliberately_by_the_caller_is_kept(self):
		before = str(stored(self.name)["consent_at"])
		self.write_through_the_document_api(consent_at=PAST)
		recorded = str(stored(self.name)["consent_at"])
		self.assertNotEqual(recorded, before)
		self.assertEqual(recorded, PAST)

	def test_the_audit_trail_shows_consent_events_and_not_ordinary_edits(self):
		# Versions are forced on the document-level saves here because Frappe suppresses them inside
		# tests; the payload a real save writes is the same payload. The restoration of the live
		# timestamp additionally checks the Version record that the running site itself produces.
		self.assertEqual(int(frappe.get_meta("Borrower Profile").track_changes), 1)
		self.write_through_the_document_api(consent_at=PAST)
		marker = len(consent_changes(self.name))

		unrelated = frappe.get_doc("Borrower Profile", self.name)
		unrelated.employer = "Audited Employer"
		unrelated.flags.ignore_permissions = True
		unrelated.save(ignore_version=False)
		after = consent_changes(self.name)[marker:]
		self.assertTrue(after, "an edit to a versioned document should be recorded")
		self.assertFalse(
			any("consent_at" in entry["fields"] for entry in after),
			f"an unrelated save must not appear as a consent change: {after}",
		)

		revoked = frappe.get_doc("Borrower Profile", self.name)
		revoked.consent_privacy = 0
		revoked.flags.ignore_permissions = True
		revoked.save(ignore_version=False)
		latest = consent_changes(self.name)[-1]
		self.assertIn("consent_at", latest["fields"])
		self.assertIsNone(stored(self.name)["consent_at"])
