"""Conversation transcript contract.

The assistant frontend asks for a transcript whenever the open thread changes, so each answer
is a contract it builds on: a thread with no stored row is refused, a thread that exists but has
had no turn yet comes back empty, and a thread belonging to somebody else is refused in exactly
the same shape as one that does not exist at all. These tests pin those outcomes plus the two
ways a request is withheld entirely (signed out, malformed reference).
"""

import frappe
from frappe.exceptions import FrappeTypeError
from frappe.tests.utils import FrappeTestCase

from loan_advisory_portal.api import agent
from loan_advisory_portal.portal.errors import Forbidden, NotFound, SignInRequired
from loan_advisory_portal.tests.utils import (
	as_user,
	ensure_company,
	make_application,
	make_borrower,
)


class TranscriptContractTest(FrappeTestCase):
	@classmethod
	def setUpClass(cls):
		super().setUpClass()
		ensure_company()

	def setUp(self):
		frappe.set_user("Administrator")
		self.user, self.profile = make_borrower()
		self.other_user, self.other_profile = make_borrower()

	def _application(self, user, customer) -> str:
		with as_user(user.name):
			return make_application(customer)["name"]

	def _mint(self, user, application, thread_id: str) -> str:
		with as_user(user.name):
			agent.mint_assertion(application, thread_id=thread_id)
		return thread_id

	def test_brand_new_thread_id_has_no_transcript(self):
		"""A thread minted in the browser alone has no row, so asking for it is a 404."""
		with as_user(self.user.name):
			with self.assertRaises(NotFound):
				agent.conversation_messages("0f0f0f0f-0000-4000-8000-000000000000")

	def test_minted_thread_without_a_turn_comes_back_empty(self):
		application = self._application(self.user, self.profile.customer)
		self._mint(self.user, application, "thread-empty")
		with as_user(self.user.name):
			detail = agent.conversation_messages("thread-empty")
		self.assertEqual(detail["thread_id"], "thread-empty")
		self.assertEqual(detail["application"], application)
		self.assertEqual(detail["messages"], [])
		self.assertEqual(detail["turn_count"], 0)

	def test_thread_with_turns_returns_them_in_order(self):
		application = self._application(self.user, self.profile.customer)
		self._mint(self.user, application, "thread-used")
		with as_user(self.user.name):
			agent.record_turn("thread-used", "first question", "first answer")
			agent.record_turn("thread-used", "second question", "second answer")
			detail = agent.conversation_messages("thread-used")
		self.assertEqual(
			[(item["role"], item["text"]) for item in detail["messages"]],
			[
				("user", "first question"),
				("assistant", "first answer"),
				("user", "second question"),
				("assistant", "second answer"),
			],
		)

	def test_another_borrowers_thread_is_refused_indistinguishably(self):
		other_app = self._application(self.other_user, self.other_profile.customer)
		self._mint(self.other_user, other_app, "thread-listens")
		with as_user(self.other_user.name):
			agent.record_turn("thread-listens", "their salary is synthetic", "noted")
		with as_user(self.user.name):
			with self.assertRaises(NotFound) as foreign:
				agent.conversation_messages("thread-listens")
			with self.assertRaises(NotFound) as missing:
				agent.conversation_messages("thread-never-minted-anywhere")
		self.assertEqual(str(foreign.exception), str(missing.exception))
		self.assertNotIn("their salary", str(foreign.exception))
		self.assertNotIn("thread-listens", str(foreign.exception))

	def test_signed_out_reader_gets_no_transcript_and_no_list(self):
		application = self._application(self.user, self.profile.customer)
		self._mint(self.user, application, "thread-guest")
		frappe.set_user("Guest")
		with self.assertRaises(SignInRequired):
			agent.conversation_messages("thread-guest")
		with self.assertRaises(SignInRequired):
			agent.list_conversations()

	def test_malformed_reference_is_refused_before_any_lookup(self):
		application = self._application(self.user, self.profile.customer)
		self._mint(self.user, application, "thread-shape")
		for bad in ("", "   ", "t" * 129):
			with as_user(self.user.name):
				with self.assertRaises(Forbidden):
					agent.conversation_messages(bad)

	def test_non_string_reference_never_reaches_the_lookup(self):
		"""Frappe validates the whitelisted signature first, so a list cannot be passed through."""
		for bad in (None, 17, ["thread-shape"], {"thread_id": "thread-shape"}):
			with as_user(self.user.name):
				with self.assertRaises(FrappeTypeError):
					agent.conversation_messages(bad)

	def test_turns_are_never_added_to_a_thread_you_do_not_own(self):
		application = self._application(self.user, self.profile.customer)
		self._mint(self.user, application, "thread-writable")
		with as_user(self.other_user.name):
			with self.assertRaises(NotFound):
				agent.record_turn("thread-writable", "injected question", "injected answer")
		with as_user(self.user.name):
			detail = agent.conversation_messages("thread-writable")
		self.assertEqual(detail["messages"], [])
