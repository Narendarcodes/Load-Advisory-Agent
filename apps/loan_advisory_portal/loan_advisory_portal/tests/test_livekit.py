import base64
import hashlib
import hmac
import json

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import add_to_date, now_datetime

from loan_advisory_portal.api import livekit
from loan_advisory_portal.portal.errors import Forbidden, NotFound, ServiceUnavailable
from loan_advisory_portal.services import livekit_token
from loan_advisory_portal.tests.utils import (
	as_user,
	ensure_company,
	ensure_product,
	make_application,
	make_borrower,
)


def _decode(segment: str) -> dict:
	padding = "=" * (-len(segment) % 4)
	return json.loads(base64.urlsafe_b64decode(segment + padding))


class LiveKitTest(FrappeTestCase):
	@classmethod
	def setUpClass(cls):
		super().setUpClass()
		ensure_product(ensure_company())

	def setUp(self):
		frappe.set_user("Administrator")
		self.user, self.profile = make_borrower()
		self.other_user, self.other_profile = make_borrower()

	def application(self):
		with as_user(self.user.name):
			return make_application(self.profile.customer)["name"]

	def create(self, application):
		with as_user(self.user.name):
			return livekit.create_voice_session(application, consent=1)

	def test_token_is_signed_and_scoped_to_the_room(self):
		created = self.application()
		result = self.create(created)

		header_b64, payload_b64, signature_b64 = result["token"].split(".")
		secret = frappe.conf.livekit_api_secret
		expected = hmac.new(
			secret.encode("utf-8"), f"{header_b64}.{payload_b64}".encode("ascii"), hashlib.sha256
		).digest()
		padding = "=" * (-len(signature_b64) % 4)
		self.assertTrue(
			hmac.compare_digest(expected, base64.urlsafe_b64decode(signature_b64 + padding))
		)

		header = _decode(header_b64)
		claims = _decode(payload_b64)
		self.assertEqual(header["alg"], "HS256")
		self.assertEqual(claims["iss"], frappe.conf.livekit_api_key)
		self.assertEqual(claims["sub"], result["identity"])
		self.assertEqual(claims["video"]["room"], result["room"])
		self.assertTrue(claims["video"]["roomJoin"])
		self.assertGreater(claims["exp"], claims["iat"])

		metadata = json.loads(claims["metadata"])
		self.assertEqual(metadata["customer"], self.profile.customer)
		self.assertEqual(metadata["application"], created)

		session = frappe.get_doc("Voice Session", {"room": result["room"]})
		self.assertEqual(session.status, "Created")
		self.assertEqual(session.user, self.user.name)
		self.assertEqual(metadata["session_id"], session.session_id)
		# The browser gets the id so it can end its own session; it still cannot mint an assertion.
		self.assertEqual(result["session_id"], session.session_id)

	def test_a_session_needs_explicit_consent(self):
		with as_user(self.user.name):
			created = make_application(self.profile.customer)
			with self.assertRaises(Forbidden):
				livekit.create_voice_session(created["name"])
			with self.assertRaises(Forbidden):
				livekit.create_voice_session(created["name"], consent=0)
		self.assertFalse(frappe.db.exists("Voice Session", {"application": created["name"]}))

	def test_consent_is_recorded_with_the_notice_version(self):
		created = self.application()
		result = self.create(created)
		row = frappe.db.get_value(
			"Voice Session",
			{"session_id": result["session_id"]},
			["consent_version", "consent_at", "status"],
			as_dict=True,
		)
		self.assertEqual(row.consent_version, livekit_token.CONSENT_VERSION)
		self.assertTrue(row.consent_at)
		self.assertEqual(row.status, "Created")

	def test_foreign_application_is_not_found(self):
		with as_user(self.other_user.name):
			foreign = make_application(self.other_profile.customer)["name"]
		with as_user(self.user.name):
			with self.assertRaises(NotFound):
				livekit.create_voice_session(foreign, consent=1)

	def test_missing_configuration_is_unavailable(self):
		with as_user(self.user.name):
			created = make_application(self.profile.customer)
			url = frappe.conf.livekit_url
			frappe.conf.livekit_url = None
			try:
				with self.assertRaises(ServiceUnavailable):
					livekit.create_voice_session(created["name"], consent=1)
			finally:
				frappe.conf.livekit_url = url

	def test_the_borrower_ends_their_own_session(self):
		created = self.application()
		result = self.create(created)
		with as_user(self.user.name):
			closed = livekit.end_voice_session(result["session_id"])
			# A retry from a closing tab reports the same state instead of failing or double-closing.
			again = livekit.end_voice_session(result["session_id"])
		row = frappe.get_doc("Voice Session", result["session_id"])
		self.assertEqual(closed["status"], "Ended")
		self.assertEqual(again["status"], "Ended")
		self.assertEqual(row.status, "Ended")
		self.assertTrue(row.ended_at)
		self.assertTrue(again["ended_at"])

	def test_an_expired_session_is_reported_as_closed(self):
		created = self.application()
		result = self.create(created)
		frappe.db.set_value(
			"Voice Session",
			result["session_id"],
			{"status": "Expired", "expires_at": add_to_date(now_datetime(), seconds=-1)},
			update_modified=False,
		)
		with as_user(self.user.name):
			closed = livekit.end_voice_session(result["session_id"])
		self.assertEqual(closed["status"], "Expired")
		self.assertIsNone(closed["ended_at"])

	def test_another_borrower_cannot_end_the_session(self):
		created = self.application()
		result = self.create(created)
		with as_user(self.other_user.name):
			with self.assertRaises(NotFound):
				livekit.end_voice_session(result["session_id"])
		self.assertEqual(frappe.db.get_value("Voice Session", result["session_id"], "status"), "Created")

	def test_unknown_and_malformed_session_ids_are_not_found(self):
		with as_user(self.user.name):
			for value in ("0" * 32, "not-a-session", ""):
				with self.assertRaises(NotFound):
					livekit.end_voice_session(value)
