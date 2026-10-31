import frappe
from frappe.tests.utils import FrappeTestCase

from loan_advisory_portal.api import documents
from loan_advisory_portal.portal.errors import Conflict, Forbidden, NotFound, SignInRequired
from loan_advisory_portal.tests.utils import (
	as_user,
	attach_fixture_document,
	ensure_company,
	ensure_document_type,
	ensure_product,
	make_application,
	save_private_file,
	make_borrower,
)


class DocumentTest(FrappeTestCase):
	@classmethod
	def setUpClass(cls):
		super().setUpClass()
		ensure_product(ensure_company())
		ensure_document_type()

	def setUp(self):
		frappe.set_user("Administrator")
		self.user, self.profile = make_borrower()
		self.other_user, self.other_profile = make_borrower()

	def _application(self):
		with as_user(self.user.name):
			return make_application(self.profile.customer)["name"]

	def test_document_types_require_a_borrower(self):
		frappe.set_user("Guest")
		with self.assertRaises(SignInRequired):
			documents.list_document_types()

		plain = frappe.get_doc(
			{
				"doctype": "User",
				"email": f"plain-{frappe.generate_hash(length=8)}@example.invalid",
				"first_name": "Plain",
				"user_type": "Website User",
				"send_welcome_email": 0,
			}
		)
		plain.insert(ignore_permissions=True)
		with as_user(plain.name):
			with self.assertRaises(Forbidden):
				documents.list_document_types()

		with as_user(self.user.name):
			rows = documents.list_document_types()
		self.assertIn("Identity Proof", [row["name"] for row in rows])

	def test_attach_and_list(self):
		application = self._application()
		with as_user(self.user.name):
			result = attach_fixture_document(application, self.user.name)
			rows = result["documents"] if isinstance(result, dict) else documents.list_documents(application)
		self.assertEqual(len(rows), 1)
		self.assertEqual(rows[0]["document_type"], "Identity Proof")
		self.assertTrue(rows[0]["file_name"].startswith("identity"))
		self.assertTrue(rows[0]["file_name"].endswith(".pdf"))

	def test_foreign_application_is_not_found(self):
		with as_user(self.other_user.name):
			foreign = make_application(self.other_profile.customer)["name"]
			file = save_private_file("id.pdf")
		with as_user(self.user.name):
			with self.assertRaises(NotFound):
				documents.attach_document(foreign, "Identity Proof", file.name)

	def test_duplicate_attachment_conflict(self):
		application = self._application()
		with as_user(self.user.name):
			attach_fixture_document(application, self.user.name)
			file = save_private_file("second.pdf")
			documents.attach_document(application, "Identity Proof", file.name)
			with self.assertRaises(Conflict):
				documents.attach_document(application, "Identity Proof", file.name)

	def test_unsupported_extension_rejected(self):
		application = self._application()
		with as_user(self.user.name):
			file = save_private_file("notes.txt", b"plain text")
			with self.assertRaises(Forbidden):
				documents.attach_document(application, "Identity Proof", file.name)

	def test_public_file_rejected(self):
		application = self._application()
		with as_user(self.user.name):
			file = save_private_file("public.pdf", private=False)
			with self.assertRaises(Forbidden):
				documents.attach_document(application, "Identity Proof", file.name)

	def test_foreign_file_rejected(self):
		application = self._application()
		with as_user(self.other_user.name):
			file = save_private_file("other.pdf")
		with as_user(self.user.name):
			with self.assertRaises(Forbidden):
				documents.attach_document(application, "Identity Proof", file.name)

	def test_remove_document(self):
		application = self._application()
		with as_user(self.user.name):
			result = attach_fixture_document(application, self.user.name)
			row = result["documents"][0]["row"]
			remaining = documents.remove_document(application, row)["documents"]
		self.assertEqual(remaining, [])

	def test_download_returns_owner_content(self):
		application = self._application()
		with as_user(self.user.name):
			result = attach_fixture_document(application, self.user.name)
			row = result["documents"][0]["row"]
			documents.download_document(application, row)
			response = frappe.local.response
		self.assertEqual(response["type"], "download")
		self.assertTrue(response["filename"].startswith("identity"))
		self.assertIn(b"%PDF", response["filecontent"])
