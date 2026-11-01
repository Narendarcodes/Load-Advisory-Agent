"""Live proof of the fixture-teardown safeguard added to `e2e_seed.teardown`.

Creates a synthetic advisory conversation (with child messages) for a freshly seeded fixture
borrower, then runs the teardown and reports whether the transcript went with the borrower.

Everything this creates belongs to the `hygiene1` fixture and is removed by the same call.
"""

import json
import os
import uuid

import frappe

TAG = "hygiene1"
SITE = "loanportal.local"


def connect():
	os.chdir("/home/frappe/frappe-bench/sites")
	frappe.init(site=SITE, sites_path=".")
	frappe.connect()
	frappe.set_user("Administrator")


def main():
	connect()
	user = f"{TAG}-borrower@example.invalid"
	profile = frappe.get_all(
		"Borrower Profile", filters={"user": user}, fields=["name", "customer"], limit=1
	)[0]
	application = frappe.get_all("Loan Application", filters={"applicant": profile["customer"]}, pluck="name", limit=1)[0]
	thread = str(uuid.uuid4())

	before = frappe.db.count("Advisory Conversation", {"user": user})
	doc = frappe.get_doc(
		{
			"doctype": "Advisory Conversation",
			"thread_id": thread,
			"user": user,
			"customer": profile["customer"],
			"application": application,
			"title": "Hygiene demo thread",
			"turn_count": 1,
			"last_activity": frappe.utils.now_datetime(),
			"status": "Open",
			"messages": [
				{"role": "user", "text": "What information is missing from my application?"},
				{"role": "assistant", "text": "Acceptance fixture response: hygiene demo."},
			],
		}
	)
	doc.flags.ignore_permissions = True
	doc.insert()
	frappe.db.commit()

	report = {
		"conversationsForUserBeforeDemo": before,
		"createdThread": thread,
		"conversationsForUserAfterCreate": frappe.db.count("Advisory Conversation", {"user": user}),
		"messagesForUserAfterCreate": frappe.db.count(
			"Advisory Message", {"parent": thread, "parenttype": "Advisory Conversation"}
		),
	}

	from loan_advisory_portal.tests import e2e_seed

	report["teardownResult"] = e2e_seed.teardown(TAG)
	frappe.db.commit()

	report["conversationsForUserAfterTeardown"] = frappe.db.count("Advisory Conversation", {"user": user})
	report["messagesForUserAfterTeardown"] = frappe.db.count("Advisory Message", {"parent": thread})
	report["profileGone"] = not frappe.db.exists("Borrower Profile", {"user": user})
	report["userGone"] = not frappe.db.exists("User", user)
	report["orphanMessages"] = frappe.db.count(
		"Advisory Message",
		{"parent": ("not in", [r["name"] for r in frappe.get_all("Advisory Conversation", fields=["name"])])},
	)
	print(json.dumps(report, indent=2, default=str))


if __name__ == "__main__":
	main()
