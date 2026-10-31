import time

import frappe
from frappe.tests.utils import FrappeTestCase

from loan_advisory_portal.portal.errors import Forbidden, ServiceUnavailable
from loan_advisory_portal.services import assertion


class AssertionTest(FrappeTestCase):
	def _payload(self, **overrides):
		now = int(time.time())
		payload = {
			"iss": assertion.ISSUER,
			"aud": assertion.AUDIENCE,
			"sub": "borrower@example.invalid",
			"customer": "CUST-1",
			"application": "LA-1",
			"thread": "thread-1",
			"iat": now,
			"exp": now + 60,
			"jti": frappe.generate_hash(length=16),
		}
		payload.update(overrides)
		return payload

	def test_round_trip(self):
		token = assertion.sign(self._payload())
		payload = assertion.verify(token)
		self.assertEqual(payload["sub"], "borrower@example.invalid")
		self.assertEqual(payload["application"], "LA-1")

	def test_tampered_payload_is_rejected(self):
		token = assertion.sign(self._payload())
		body, signature = token.split(".", 1)
		forged = assertion.sign(self._payload(sub="someone-else"))
		with self.assertRaises(Forbidden):
			assertion.verify(f"{forged.split('.', 1)[0]}.{signature}")
		self.assertTrue(body)

	def test_wrong_audience_is_rejected(self):
		with self.assertRaises(Forbidden):
			assertion.verify(assertion.sign(self._payload(aud="another-service")))

	def test_expired_assertion_is_rejected(self):
		now = int(time.time())
		with self.assertRaises(Forbidden):
			assertion.verify(assertion.sign(self._payload(iat=now - 120, exp=now - 60)))

	def test_malformed_assertion_is_rejected(self):
		for value in ("", "not-a-token", "a.b.c", "a..b"):
			with self.assertRaises(Forbidden):
				assertion.verify(value)

	def test_mint_scopes_the_borrower(self):
		result = assertion.mint("borrower@example.invalid", "CUST-1", "LA-1", "thread-1")
		payload = assertion.verify(result["assertion"])
		self.assertEqual(payload["iss"], assertion.ISSUER)
		self.assertEqual(payload["aud"], assertion.AUDIENCE)
		self.assertEqual(payload["customer"], "CUST-1")
		self.assertEqual(payload["application"], "LA-1")
		self.assertEqual(payload["jti"], result["jti"])
		self.assertEqual(payload["exp"] - payload["iat"], assertion.TTL_SECONDS)

	def test_mint_carries_the_agent_vocabulary(self):
		payload = assertion.verify(
			assertion.mint("borrower@example.invalid", "CUST-1", "LA-1", None, "plain", "hi")["assertion"]
		)
		self.assertEqual(payload["literacy"], "low")
		self.assertEqual(payload["locale"], "hi")
		self.assertEqual(assertion.preferences("standard", "te"), {"literacy": "medium", "locale": "te"})

	def test_unknown_preferences_fall_back(self):
		self.assertEqual(assertion.preferences("verbose", "fr"), {"literacy": "medium", "locale": "en"})
		self.assertEqual(assertion.preferences(None, None), {"literacy": "medium", "locale": "en"})

	def test_missing_secret_is_unavailable(self):
		secret = frappe.conf.get("agent_assertion_secret")
		frappe.conf.agent_assertion_secret = ""
		try:
			with self.assertRaises(ServiceUnavailable):
				assertion.sign(self._payload())
		finally:
			frappe.conf.agent_assertion_secret = secret
