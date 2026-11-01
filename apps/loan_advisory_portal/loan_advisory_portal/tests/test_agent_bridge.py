import frappe
from frappe.tests.utils import FrappeTestCase

from loan_advisory_portal.api import agent, session
from loan_advisory_portal.portal.errors import (
	Conflict,
	Forbidden,
	NotFound,
	SelectionRequired,
)
from loan_advisory_portal.services import assertion
from loan_advisory_portal.tests.utils import (
	as_user,
	ensure_company,
	ensure_product,
	make_application,
	make_borrower,
	make_customer,
)


class AgentBridgeTest(FrappeTestCase):
	@classmethod
	def setUpClass(cls):
		super().setUpClass()
		ensure_product(ensure_company())

	def setUp(self):
		frappe.set_user("Administrator")
		self.user, self.profile = make_borrower()
		self.other_user, self.other_profile = make_borrower()

	def _application(self, customer: str | None = None) -> str:
		return make_application(customer or self.profile.customer)["name"]

	def test_assertion_is_scoped_to_borrower_and_application(self):
		with as_user(self.user.name):
			created = make_application(self.profile.customer)
			result = agent.mint_assertion(created["name"], thread_id="thread-abc")
		claims = assertion.verify(result["assertion"])
		self.assertEqual(claims["sub"], self.user.name)
		self.assertEqual(claims["customer"], self.profile.customer)
		self.assertEqual(claims["application"], created["name"])
		self.assertEqual(claims["thread"], "thread-abc")
		self.assertEqual(result["application"], created["name"])
		self.assertEqual(result["thread_id"], "thread-abc")

	def test_mint_without_an_application_uses_the_session_selection(self):
		with as_user(self.user.name):
			created = make_application(self.profile.customer)
			session.select_application(created["name"])
			result = agent.mint_assertion(thread_id="thread-selected")
		self.assertEqual(result["application"], created["name"])
		self.assertEqual(assertion.verify(result["assertion"])["application"], created["name"])

	def test_mint_without_a_selection_is_refused(self):
		with as_user(self.user.name):
			with self.assertRaises(SelectionRequired):
				agent.mint_assertion()

	def test_conversation_is_recorded_once(self):
		with as_user(self.user.name):
			created = make_application(self.profile.customer)
			agent.mint_assertion(created["name"], thread_id="thread-1")
			agent.mint_assertion(created["name"], thread_id="thread-1")
			rows = agent.list_conversations()
		self.assertEqual(len(rows), 1)
		self.assertEqual(rows[0]["thread_id"], "thread-1")
		self.assertEqual(rows[0]["application"], created["name"])

	def test_thread_cannot_be_rebound_to_another_application(self):
		with as_user(self.user.name):
			first = self._application()
			second = self._application()
			agent.mint_assertion(first, thread_id="thread-bound")
			with self.assertRaises(Conflict):
				agent.mint_assertion(second, thread_id="thread-bound")
		self.assertEqual(
			frappe.db.get_value("Advisory Conversation", "thread-bound", "application"), first
		)

	def test_foreign_thread_is_rejected(self):
		with as_user(self.other_user.name):
			foreign = make_application(self.other_profile.customer)["name"]
			agent.mint_assertion(foreign, thread_id="thread-of-other")
		with as_user(self.user.name):
			own = self._application()
			with self.assertRaises(Forbidden):
				agent.mint_assertion(own, thread_id="thread-of-other")

	def test_relinked_profile_cannot_keep_the_old_thread(self):
		with as_user(self.user.name):
			own = self._application()
			agent.mint_assertion(own, thread_id="thread-old-customer")
		relinked = make_customer()
		frappe.db.set_value("Borrower Profile", self.profile.name, "customer", relinked)
		with as_user(self.user.name):
			own = self._application(relinked)
			with self.assertRaises(Forbidden):
				agent.mint_assertion(own, thread_id="thread-old-customer")

	def test_foreign_application_is_not_found(self):
		with as_user(self.other_user.name):
			foreign = make_application(self.other_profile.customer)["name"]
		with as_user(self.user.name):
			with self.assertRaises(NotFound):
				agent.mint_assertion(foreign)

	def test_oversized_thread_id_is_rejected(self):
		with as_user(self.user.name):
			own = self._application()
			with self.assertRaises(Forbidden):
				agent.mint_assertion(own, thread_id="t" * 129)

	def test_record_turn_stores_the_transcript_and_the_title(self):
		with as_user(self.user.name):
			own = self._application()
			agent.mint_assertion(own, thread_id="thread-transcript")
			first = agent.record_turn("thread-transcript", "Why was my loan rejected?", "Because the record says so.")
			second = agent.record_turn("thread-transcript", "What can I improve?", "Reduce obligations.")
			detail = agent.conversation_messages("thread-transcript")
		self.assertEqual(first["turn_count"], 1)
		self.assertEqual(second["turn_count"], 2)
		self.assertEqual(detail["title"], "Why was my loan rejected?")
		self.assertEqual(
			[(item["role"], item["text"]) for item in detail["messages"]],
			[
				("user", "Why was my loan rejected?"),
				("assistant", "Because the record says so."),
				("user", "What can I improve?"),
				("assistant", "Reduce obligations."),
			],
		)

	def test_record_turn_needs_an_owned_existing_thread(self):
		with as_user(self.other_user.name):
			foreign = make_application(self.other_profile.customer)["name"]
			agent.mint_assertion(foreign, thread_id="thread-foreign-turns")
		with as_user(self.user.name):
			# A foreign thread is indistinguishable from a missing one.
			with self.assertRaises(NotFound):
				agent.record_turn("thread-foreign-turns", "why?")
			with self.assertRaises(NotFound):
				agent.record_turn("thread-that-does-not-exist", "why?")

	def test_transcript_text_is_capped(self):
		with as_user(self.user.name):
			own = self._application()
			agent.mint_assertion(own, thread_id="thread-long")
			agent.record_turn("thread-long", "q" * 5000, "a" * 9000)
			detail = agent.conversation_messages("thread-long")
		self.assertEqual(len(detail["messages"][0]["text"]), 4000)
		self.assertEqual(len(detail["messages"][1]["text"]), 8000)

	def test_transcript_drops_the_oldest_messages_beyond_the_buffer(self):
		from unittest.mock import patch

		with as_user(self.user.name):
			own = self._application()
			agent.mint_assertion(own, thread_id="thread-buffer")
			with patch.object(agent, "MAX_STORED_MESSAGES", 4):
				for index in range(3):
					agent.record_turn("thread-buffer", f"question {index}", f"answer {index}")
			detail = agent.conversation_messages("thread-buffer")
		self.assertEqual(len(detail["messages"]), 4)
		self.assertEqual(detail["messages"][0]["text"], "question 1")
		self.assertEqual(detail["messages"][-1]["text"], "answer 2")

	def test_history_is_scoped_to_the_borrower_and_the_application(self):
		with as_user(self.user.name):
			first = self._application()
			second = self._application()
			agent.mint_assertion(first, thread_id="thread-a1")
			agent.mint_assertion(second, thread_id="thread-b1")
		with as_user(self.other_user.name):
			foreign = make_application(self.other_profile.customer)["name"]
			agent.mint_assertion(foreign, thread_id="thread-foreign")
		with as_user(self.user.name):
			self.assertEqual(len(agent.list_conversations()), 2)
			self.assertEqual(
				[row["thread_id"] for row in agent.list_conversations(application=second)], ["thread-b1"]
			)
			with self.assertRaises(NotFound):
				agent.conversation_messages("thread-foreign")
			with self.assertRaises(NotFound):
				agent.list_conversations(application=foreign)

	def test_another_borrower_cannot_read_a_transcript(self):
		with as_user(self.user.name):
			own = self._application()
			agent.mint_assertion(own, thread_id="thread-private")
			agent.record_turn("thread-private", "my salary is synthetic", "noted")
		with as_user(self.other_user.name):
			with self.assertRaises(NotFound):
				agent.conversation_messages("thread-private")

	def test_non_borrower_cannot_mint(self):
		user = frappe.get_doc(
			{
				"doctype": "User",
				"email": f"plain-{frappe.generate_hash(length=6)}@example.invalid",
				"first_name": "Plain",
				"user_type": "Website User",
				"send_welcome_email": 0,
			}
		)
		user.insert(ignore_permissions=True)
		with as_user(user.name):
			with self.assertRaises(Forbidden):
				agent.mint_assertion()
