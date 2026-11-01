"""IDOR and privilege-escalation matrix for every borrower-facing method.

The table below is the surface contract: a new whitelisted method in one of these
modules fails `test_the_borrower_surface_is_fully_listed` until it is either listed
here or explicitly excluded. Each listed method must refuse a guest, a signed-in
account without the borrower role, and another borrower's application id.
"""

import frappe
from frappe.tests.utils import FrappeTestCase

from loan_advisory_portal.api import (
	agent,
	applications,
	documents,
	feedback,
	livekit,
	profile,
	session,
)
from loan_advisory_portal.portal.errors import Forbidden, NotFound, SignInRequired
from loan_advisory_portal.tests.utils import (
	as_user,
	ensure_company,
	ensure_product,
	make_application,
	make_borrower,
)

API_MODULES = {
	"loan_advisory_portal.api.agent",
	"loan_advisory_portal.api.applications",
	"loan_advisory_portal.api.documents",
	"loan_advisory_portal.api.feedback",
	"loan_advisory_portal.api.livekit",
	"loan_advisory_portal.api.profile",
	"loan_advisory_portal.api.session",
}

# (method, minimal arguments). Arguments are only shaped enough to reach the identity
# check; a guest or unprivileged caller must be refused before validation matters.
SURFACE = [
	(applications.list_applications, {}),
	(applications.get_application, {"application": "ANY"}),
	(applications.get_decision, {"application": "ANY"}),
	(
		applications.create_application,
		{"loan_amount": 100000, "tenure_months": 12, "purpose": "Synthetic"},
	),
	(applications.submit_application, {"application": "ANY"}),
	(applications.resubmit_application, {"application": "ANY"}),
	(applications.withdraw_application, {"application": "ANY"}),
	(documents.list_document_types, {}),
	(documents.list_documents, {"application": "ANY"}),
	(documents.attach_document, {"application": "ANY", "document_type": "Identity Proof", "file": "ANY"}),
	(documents.remove_document, {"application": "ANY", "row": "ANY"}),
	(documents.download_document, {"application": "ANY", "row": "ANY"}),
	(feedback.submit_feedback, {"rating": 5, "message": "Synthetic"}),
	(feedback.list_feedback, {}),
	(profile.get_profile, {}),
	(profile.update_profile, {}),
	(session.select_application, {"application": "ANY"}),
	(session.clear_application, {}),
	(agent.mint_assertion, {}),
	(agent.record_turn, {"thread_id": "matrix-thread"}),
	(agent.list_conversations, {}),
	(agent.conversation_messages, {"thread_id": "matrix-thread"}),
	(livekit.create_voice_session, {}),
	(livekit.end_voice_session, {"session_id": "0" * 32}),
]

# Guest-accessible by design: `me` is the identity probe, and the invitation
# endpoints have their own rate limits and generic refusals.
EXCLUDED = {session.me}

POST_ONLY = [
	applications.create_application,
	applications.submit_application,
	applications.resubmit_application,
	applications.withdraw_application,
	documents.attach_document,
	documents.remove_document,
	feedback.submit_feedback,
	profile.update_profile,
	session.select_application,
	session.clear_application,
	agent.mint_assertion,
	agent.record_turn,
	livekit.create_voice_session,
	livekit.end_voice_session,
]


class AuthorizationMatrixTest(FrappeTestCase):
	@classmethod
	def setUpClass(cls):
		super().setUpClass()
		ensure_product(ensure_company())

	def setUp(self):
		frappe.set_user("Administrator")
		self.user, self.profile = make_borrower()
		self.other_user, self.other_profile = make_borrower()
		self.plain_user = self._plain_user()
		with as_user(self.other_user.name):
			self.foreign = make_application(self.other_profile.customer)["name"]

	@staticmethod
	def _plain_user() -> str:
		user = frappe.get_doc(
			{
				"doctype": "User",
				"email": f"plain-{frappe.generate_hash(length=8)}@example.invalid",
				"first_name": "Plain",
				"user_type": "Website User",
				"send_welcome_email": 0,
			}
		)
		user.insert(ignore_permissions=True)
		return user.name

	def test_the_borrower_surface_is_fully_listed(self):
		listed = {method for method, _ in SURFACE} | EXCLUDED
		present = {
			method
			for method in frappe.whitelisted
			if getattr(method, "__module__", "") in API_MODULES
		}
		self.assertEqual(present - listed, set(), "add every new borrower method to the matrix")

	def test_state_changing_methods_are_post_only(self):
		for method in POST_ONLY:
			with self.subTest(method=method.__name__):
				self.assertEqual(
					frappe.allowed_http_methods_for_whitelisted_func[method],
					["POST"],
					f"{method.__name__} must not be reachable with a state-less GET",
				)

	def test_every_method_refuses_a_guest(self):
		frappe.set_user("Guest")
		for method, kwargs in SURFACE:
			with self.subTest(method=method.__name__):
				with self.assertRaises(SignInRequired):
					method(**kwargs)

	def test_every_method_refuses_an_account_without_the_borrower_role(self):
		with as_user(self.plain_user):
			for method, kwargs in SURFACE:
				with self.subTest(method=method.__name__):
					with self.assertRaises(Forbidden):
						method(**kwargs)

	def test_every_application_method_hides_a_foreign_id(self):
		calls = [
			(applications.get_application, {"application": self.foreign}),
			(applications.get_decision, {"application": self.foreign}),
			(applications.submit_application, {"application": self.foreign}),
			(applications.resubmit_application, {"application": self.foreign}),
			(applications.withdraw_application, {"application": self.foreign}),
			(documents.list_documents, {"application": self.foreign}),
			(
				documents.attach_document,
				{"application": self.foreign, "document_type": "Identity Proof", "file": "ANY"},
			),
			(documents.remove_document, {"application": self.foreign, "row": "ANY"}),
			(documents.download_document, {"application": self.foreign, "row": "ANY"}),
			(session.select_application, {"application": self.foreign}),
			(agent.mint_assertion, {"application": self.foreign}),
			(livekit.create_voice_session, {"application": self.foreign}),
			(feedback.submit_feedback, {"rating": 5, "message": "Synthetic", "application": self.foreign}),
		]
		with as_user(self.user.name):
			for method, kwargs in calls:
				with self.subTest(method=method.__name__):
					with self.assertRaises(NotFound):
						method(**kwargs)

	def test_request_fields_cannot_override_the_session_identity(self):
		with as_user(self.user.name):
			with self.assertRaises(Forbidden):
				profile.update_profile(user=self.other_user.name)
			with self.assertRaises(Forbidden):
				profile.update_profile(customer=self.other_profile.customer)
			with self.assertRaises(TypeError):
				applications.create_application(
					loan_amount=100000,
					tenure_months=12,
					purpose="Synthetic",
					applicant=self.other_profile.customer,
					customer=self.other_profile.customer,
				)

			# Frappe populates form_dict from the request body; a forged identity in it
			# is inert because submit_feedback never reads it.
			frappe.form_dict.update(
				{"user": self.other_user.name, "customer": self.other_profile.customer}
			)
			try:
				created = feedback.submit_feedback(3, "Still the caller's row.")
			finally:
				frappe.form_dict.clear()
		row = frappe.db.get_value("Borrower Feedback", created["name"], ["user", "customer"], as_dict=True)
		self.assertEqual((row.user, row.customer), (self.user.name, self.profile.customer))

	def test_selection_is_scoped_to_the_session_not_the_account(self):
		with as_user(self.user.name):
			created = make_application(self.profile.customer)
			session.select_application(created["name"])
		with as_user(self.user.name):
			# A fresh sign-in for the same account starts without another session's selection.
			self.assertIsNone(session.selected_application())
		with as_user(self.other_user.name):
			self.assertIsNone(session.selected_application())

	def test_selection_needs_a_session_identifier(self):
		with as_user(self.user.name):
			created = make_application(self.profile.customer)
			session.select_application(created["name"])
			frappe.local.session.sid = None
			with self.assertRaises(SignInRequired):
				session.selected_application()
