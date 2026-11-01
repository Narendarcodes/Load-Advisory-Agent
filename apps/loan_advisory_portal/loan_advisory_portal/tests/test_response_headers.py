import frappe
from frappe.tests.utils import FrappeTestCase

from loan_advisory_portal.portal import headers


class FakeResponse:
	def __init__(self, status_code=200, initial=None):
		self.status_code = status_code
		self.headers = dict(initial or {})


class FakeRequest:
	def __init__(self, path="/borrower", scheme="http", forwarded=None):
		self.path = path
		self.scheme = scheme
		self.headers = {"X-Forwarded-Proto": forwarded} if forwarded else {}


class ResponseHeadersTest(FrappeTestCase):
	def test_the_hook_is_registered(self):
		self.assertIn("loan_advisory_portal.portal.headers.apply", frappe.get_hooks("after_request"))

	def test_portal_pages_get_the_baseline_and_a_strict_csp(self):
		response = FakeResponse()
		headers.apply(response, FakeRequest("/borrower/apply"))
		self.assertEqual(response.headers["X-Content-Type-Options"], "nosniff")
		self.assertEqual(response.headers["Referrer-Policy"], "no-referrer")
		self.assertEqual(response.headers["X-Frame-Options"], "SAMEORIGIN")
		self.assertIn("microphone=(self)", response.headers["Permissions-Policy"])
		csp = response.headers["Content-Security-Policy"]
		self.assertIn("default-src 'self'", csp)
		self.assertIn("frame-ancestors 'self'", csp)
		self.assertIn("object-src 'none'", csp)
		script_src = csp.split("script-src", 1)[1].split(";", 1)[0]
		self.assertNotIn("'unsafe-inline'", script_src)
		self.assertNotIn("'unsafe-eval'", script_src)

	def test_assets_and_api_get_the_baseline_but_not_the_page_csp(self):
		for path in ("/assets/loan_advisory_portal/js/portal.js", "/api/method/x"):
			response = FakeResponse()
			headers.apply(response, FakeRequest(path))
			self.assertEqual(response.headers["X-Content-Type-Options"], "nosniff")
			self.assertNotIn("Content-Security-Policy", response.headers, path)

	def test_desk_is_untouched(self):
		response = FakeResponse()
		headers.apply(response, FakeRequest("/app/loan-application"))
		self.assertEqual(response.headers, {})

	def test_hsts_only_for_tls(self):
		response = FakeResponse()
		headers.apply(response, FakeRequest("/borrower", scheme="http"))
		self.assertNotIn("Strict-Transport-Security", response.headers)

		response = FakeResponse()
		headers.apply(response, FakeRequest("/borrower", scheme="https"))
		self.assertIn("max-age=31536000", response.headers["Strict-Transport-Security"])

		response = FakeResponse()
		headers.apply(response, FakeRequest("/borrower", forwarded="https"))
		self.assertIn("includeSubDomains", response.headers["Strict-Transport-Security"])

	def test_retry_after_is_added_to_a_limited_response(self):
		frappe.local.retry_after = 42
		try:
			response = FakeResponse(status_code=429)
			headers.apply(response, FakeRequest("/api/method/x"))
		finally:
			del frappe.local.retry_after
		self.assertEqual(response.headers["Retry-After"], "42")

	def test_existing_headers_are_not_replaced(self):
		response = FakeResponse(initial={"Referrer-Policy": "strict-origin"})
		headers.apply(response, FakeRequest("/borrower"))
		self.assertEqual(response.headers["Referrer-Policy"], "strict-origin")
