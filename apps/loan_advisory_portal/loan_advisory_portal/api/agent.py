"""Bridge between the trusted CopilotKit runtime and the FastAPI agent.

The Node runtime calls these with the borrower's Frappe cookie. It receives a
60-second assertion scoped to that borrower and one application, which is the only
credential FastAPI accepts from it.

A conversation is owned by one borrower and bound to one application at creation.
Minting with a thread that belongs to somebody else is refused, and so is pointing
an existing thread at another application: a thread can never be rebound.
"""

import frappe
from frappe import _
from frappe.utils import now_datetime

from loan_advisory_portal.portal import limits
from loan_advisory_portal.portal.errors import Conflict, Forbidden, NotFound
from loan_advisory_portal.portal.identity import (
	borrower_context,
	owned_application,
	require_selected_application,
)
from loan_advisory_portal.services import assertion

MAX_THREAD_ID = 128
MAX_QUESTION = 4000
MAX_ANSWER = 8000
MAX_TITLE = 80
# The transcript is a bounded buffer, not an archive. Retention remains an owner decision.
MAX_STORED_MESSAGES = 200
MAX_RETURNED_MESSAGES = 100

MESSAGE_DOCTYPE = "Advisory Message"
CONVERSATION_DOCTYPE = "Advisory Conversation"
MESSAGE_FILTER = {"parenttype": CONVERSATION_DOCTYPE, "parentfield": "messages"}


def _clean_thread_id(thread_id) -> str:
	if not isinstance(thread_id, str):
		raise Forbidden(_("Invalid conversation reference."))
	thread_id = thread_id.strip()
	if not thread_id or len(thread_id) > MAX_THREAD_ID:
		raise Forbidden(_("Invalid conversation reference."))
	return thread_id


def _transcript_text(value, limit: int) -> str | None:
	if not isinstance(value, str):
		return None
	text = value.strip()
	return text[:limit] or None


def _title_of(question: str | None) -> str | None:
	if not question:
		return None
	plain = " ".join(question.split())
	return plain[:MAX_TITLE] or None


def _resolve_application(application: str | None, ctx) -> str:
	"""One application per conversation. Without an explicit one, the borrower's selection is used."""
	ref = application or require_selected_application()
	return owned_application(ref, ctx).name


def _touch_conversation(thread_id: str | None, ctx, application: str, title: str | None = None) -> str | None:
	"""Create the thread on first use, otherwise refuse any attempt to change its owner or binding."""
	if not thread_id:
		return None
	thread_id = _clean_thread_id(thread_id)

	existing = frappe.db.get_value(
		CONVERSATION_DOCTYPE, thread_id, ["user", "customer", "application", "title"], as_dict=True
	)
	if existing:
		# A relinked profile must not keep a thread that was opened under the old customer.
		if existing.user != ctx.user or existing.customer != ctx.customer:
			raise Forbidden(_("This conversation belongs to another account."))
		if existing.application and existing.application != application:
			raise Conflict(_("This conversation is linked to another application. Start a new conversation."))
		values = {"last_activity": now_datetime(), "status": "Open"}
		if not existing.application:
			values["application"] = application  # legacy row: bind once, then immutable
		if not existing.title and title:
			values["title"] = title
		frappe.db.set_value(CONVERSATION_DOCTYPE, thread_id, values, update_modified=False)
		return thread_id

	doc = frappe.get_doc(
		{
			"doctype": CONVERSATION_DOCTYPE,
			"thread_id": thread_id,
			"user": ctx.user,
			"customer": ctx.customer,
			"application": application,
			"title": title,
			"status": "Open",
			"turn_count": 0,
			"last_activity": now_datetime(),
		}
	)
	doc.flags.ignore_permissions = True
	try:
		doc.insert()
	except frappe.DuplicateEntryError:
		# Two first turns raced; re-run the ownership and binding checks against the winner.
		return _touch_conversation(thread_id, ctx, application, title)
	return thread_id


@frappe.whitelist(methods=["POST"])
def mint_assertion(application: str | None = None, thread_id: str | None = None) -> dict:
	ctx = borrower_context()
	limits.enforce("agent-mint", 90, 60)
	ref = _resolve_application(application, ctx)
	thread = _touch_conversation(thread_id, ctx, ref)
	result = assertion.mint(ctx.user, ctx.customer, ref, thread, ctx.literacy, ctx.locale)
	result.update({"application": ref, "customer": ctx.customer, "thread_id": thread})
	return result


def _owned_conversation(thread_id, ctx, fields, *, lock: bool = False):
	name = _clean_thread_id(thread_id)
	wanted = list(dict.fromkeys([*fields, "user", "customer"]))
	row = frappe.db.get_value(CONVERSATION_DOCTYPE, name, wanted, as_dict=True, for_update=lock)
	if not row or row.user != ctx.user or row.customer != ctx.customer:
		raise NotFound(_("Conversation not found."))
	return row


def _append_message(conversation: str, role: str, text: str) -> None:
	last = frappe.db.get_all(
		MESSAGE_DOCTYPE,
		filters={"parent": conversation, **MESSAGE_FILTER},
		pluck="idx",
		order_by="idx desc",
		limit_page_length=1,
	)
	row = frappe.get_doc(
		{
			"doctype": MESSAGE_DOCTYPE,
			"parent": conversation,
			"parenttype": CONVERSATION_DOCTYPE,
			"parentfield": "messages",
			"idx": int(last[0] if last else 0) + 1,
			"role": role,
			"text": text,
		}
	)
	row.flags.ignore_permissions = True
	row.db_insert()


def _trim_messages(conversation: str) -> None:
	names = frappe.db.get_all(
		MESSAGE_DOCTYPE,
		filters={"parent": conversation, **MESSAGE_FILTER},
		pluck="name",
		order_by="idx asc",
		limit_page_length=0,
	)
	excess = len(names) - MAX_STORED_MESSAGES
	if excess > 0:
		frappe.db.delete(MESSAGE_DOCTYPE, {"name": ("in", names[:excess])})


@frappe.whitelist(methods=["POST"])
def record_turn(thread_id: str, question: str | None = None, answer: str | None = None) -> dict:
	"""Append the completed exchange to the borrower's own transcript.

	The text is display data supplied after the run; ownership, binding and the role of each
	row come from this session, so a client can only add to its own conversation.
	"""
	ctx = borrower_context()
	limits.enforce("conversation-log", 120, 3600)
	question = _transcript_text(question, MAX_QUESTION)
	answer = _transcript_text(answer, MAX_ANSWER)
	if not question and not answer:
		raise Forbidden(_("Nothing to record."))

	row = _owned_conversation(thread_id, ctx, ["name", "title", "turn_count"], lock=True)
	name = row.name
	if question:
		_append_message(name, "user", question)
	if answer:
		_append_message(name, "assistant", answer)
	_trim_messages(name)

	turn_count = int(row.turn_count or 0) + 1
	values = {"turn_count": turn_count, "last_activity": now_datetime()}
	if not row.title and _title_of(question):
		values["title"] = _title_of(question)
	frappe.db.set_value(CONVERSATION_DOCTYPE, name, values, update_modified=False)
	return {"thread_id": name, "turn_count": turn_count, "title": values.get("title") or row.title}


@frappe.whitelist()
def list_conversations(application: str | None = None) -> list[dict]:
	ctx = borrower_context()
	filters = {"user": ctx.user, "customer": ctx.customer}
	if application:
		filters["application"] = owned_application(application, ctx).name
	return frappe.get_all(
		CONVERSATION_DOCTYPE,
		filters=filters,
		fields=["thread_id", "application", "title", "turn_count", "last_activity", "status"],
		order_by="last_activity desc",
		limit_page_length=50,
	)


@frappe.whitelist()
def conversation_messages(thread_id: str) -> dict:
	ctx = borrower_context()
	row = _owned_conversation(
		thread_id, ctx, ["name", "application", "title", "turn_count", "last_activity"]
	)
	rows = frappe.db.get_all(
		MESSAGE_DOCTYPE,
		filters={"parent": row.name, **MESSAGE_FILTER},
		fields=["role", "text", "creation"],
		order_by="idx desc",
		limit_page_length=MAX_RETURNED_MESSAGES,
	)
	return {
		"thread_id": row.name,
		"application": row.application,
		"title": row.title,
		"turn_count": row.turn_count,
		"last_activity": row.last_activity,
		"messages": [{"role": item.role, "text": item.text, "at": item.creation} for item in reversed(rows)],
	}
