import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import add_to_date, now_datetime

from loan_advisory_portal.api import livekit, voice
from loan_advisory_portal.portal.errors import Conflict, Forbidden, NotFound
from loan_advisory_portal.services import assertion
from loan_advisory_portal.tests.utils import (
	as_user,
	ensure_company,
	ensure_product,
	make_application,
	make_borrower,
	unique,
)


def make_service_user():
	user = frappe.get_doc(
		{
			"doctype": "User",
			"email": f"service-{unique('worker').lower()}@example.invalid",
			"first_name": "Synthetic Voice Worker",
			"user_type": "System User",
			"send_welcome_email": 0,
			"roles": [{"role": "Agent Integration"}],
		}
	)
	user.flags.ignore_permissions = True
	user.insert()
	return user


class VoiceAssertionTest(FrappeTestCase):
	@classmethod
	def setUpClass(cls):
		super().setUpClass()
		ensure_product(ensure_company())

	def setUp(self):
		frappe.set_user("Administrator")
		self.user, self.profile = make_borrower()
		self.service = make_service_user()
		with as_user(self.user.name):
			created = make_application(self.profile.customer)
			result = livekit.create_voice_session(created["name"], consent=1)
		self.application = created["name"]
		self.room = result["room"]
		self.identity = result["identity"]
		self.session = frappe.get_doc("Voice Session", {"room": self.room})

	def issue(self, **overrides):
		values = {
			"session_id": self.session.session_id,
			"room": self.room,
			"identity": self.identity,
		}
		values.update(overrides)
		with as_user(self.service.name):
			return voice.voice_assertion(**values)

	def test_a_service_session_is_exchanged_for_a_scoped_assertion(self):
		result = self.issue()
		claims = assertion.verify(result["assertion"])
		self.assertEqual(claims["customer"], self.profile.customer)
		self.assertEqual(claims["application"], self.application)
		self.assertEqual(claims["thread"], f"voice-{self.session.session_id}")
		self.assertEqual(claims["sub"], self.user.name)
		self.assertEqual(claims["literacy"], "medium")
		self.assertEqual(claims["locale"], "en")
		self.assertEqual(result["expires_in"], assertion.TTL_SECONDS)
		self.assertEqual(frappe.db.get_value("Voice Session", self.session.name, "status"), "Joined")

	def test_every_turn_gets_its_own_assertion(self):
		first = self.issue()
		second = self.issue()
		self.assertNotEqual(first["assertion"], second["assertion"])
		self.assertNotEqual(first["jti"], second["jti"])

	def test_a_borrower_session_cannot_mint_for_the_worker(self):
		with as_user(self.user.name):
			with self.assertRaises(Forbidden):
				voice.voice_assertion(self.session.session_id, self.room, self.identity)

	def test_a_guest_cannot_mint_for_the_worker(self):
		frappe.set_user("Guest")
		with self.assertRaises(Forbidden):
			voice.voice_assertion(self.session.session_id, self.room, self.identity)

	def test_another_room_is_answered_like_a_missing_session(self):
		with self.assertRaises(NotFound):
			self.issue(room="loan-someone-else")

	def test_another_identity_is_answered_like_a_missing_session(self):
		with self.assertRaises(NotFound):
			self.issue(identity="applicant-someone-else")

	def test_unknown_and_malformed_session_ids_are_not_found(self):
		with self.assertRaises(NotFound):
			self.issue(session_id="0" * 32)
		with self.assertRaises(NotFound):
			self.issue(session_id="not-a-session")

	def test_an_expired_session_is_refused_and_marked(self):
		frappe.db.set_value(
			"Voice Session",
			self.session.name,
			"expires_at",
			add_to_date(now_datetime(), seconds=-1),
			update_modified=False,
		)
		with self.assertRaises(Conflict):
			self.issue()
		self.assertEqual(frappe.db.get_value("Voice Session", self.session.name, "status"), "Expired")

	def test_an_ended_session_is_refused(self):
		frappe.db.set_value("Voice Session", self.session.name, "status", "Ended", update_modified=False)
		with self.assertRaises(Conflict):
			self.issue()

	def test_a_session_without_recorded_consent_is_refused(self):
		# A row can only miss consent if it predates this notice or was forged in the database;
		# either way the worker gets no assertion, so the room cannot process a turn.
		frappe.db.set_value("Voice Session", self.session.name, "consent_version", None, update_modified=False)
		with self.assertRaises(Forbidden):
			self.issue()
		self.assertEqual(frappe.db.get_value("Voice Session", self.session.name, "status"), "Created")

	def test_a_session_under_an_older_notice_is_refused(self):
		frappe.db.set_value("Voice Session", self.session.name, "consent_version", "voice-consent/0", update_modified=False)
		with self.assertRaises(Forbidden):
			self.issue()
