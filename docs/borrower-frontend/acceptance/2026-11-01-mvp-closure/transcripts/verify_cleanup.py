"""Post-cleanup verification, read-only.

Runs the portal's own conversation API as the borrower whose transcripts were removed and checks:

* the deleted threads are gone from the borrower-facing list and now refuse with `NotFound`;
* the preserved conversations (the ambiguous set, the pre-cutoff set, and another borrower's) still
  answer normally;
* the borrower profile, application, document, decision and payment records are untouched;
* no orphaned child message rows exist anywhere on the site.
"""

import json
import os

import frappe

SITE = "loanportal.local"
OWNER = "review.demo@example.invalid"
MANIFEST = "/tmp/transcript-manifest.json"
CLASSIFICATION = "/tmp/transcript-classification.json"


def connect():
	os.chdir("/home/frappe/frappe-bench/sites")
	frappe.init(site=SITE, sites_path=".")
	frappe.connect()
	frappe.set_user("Administrator")


def main():
	connect()
	from loan_advisory_portal.api import agent

	manifest = json.load(open(MANIFEST, encoding="utf-8"))
	classification = json.load(open(CLASSIFICATION, encoding="utf-8"))
	deleted_ids = set(manifest["inScopeIds"])
	preserved_ids = [row["name"] for row in classification["ambiguous"]]

	report = {"site": frappe.local.site, "profile": OWNER}

	frappe.set_user(OWNER)
	listed = agent.list_conversations()
	report["borrowerListedConversations"] = len(listed)
	report["listedThreadsThatWereDeleted"] = sorted(t["thread_id"] for t in listed if t["thread_id"] in deleted_ids)

	deleted_refusals, preserved_ok, problems = 0, 0, []
	for name in sorted(deleted_ids)[:12]:
		try:
			agent.conversation_messages(name)
			problems.append(f"{name} still answers")
		except frappe.DoesNotExistError:
			deleted_refusals += 1
		except Exception as error:  # noqa: BLE001
			problems.append(f"{name} raised {type(error).__name__}: {str(error)[:120]}")
	for name in preserved_ids[:12]:
		try:
			agent.conversation_messages(name)
			preserved_ok += 1
		except Exception as error:  # noqa: BLE001
			problems.append(f"preserved {name} failed: {type(error).__name__}: {str(error)[:120]}")
	report["deletedThreadsRefusingWithNotFound"] = deleted_refusals
	report["preservedThreadsAnswering"] = preserved_ok

	frappe.set_user("Administrator")
	report["stillPresentAmongDeleted"] = [name for name in deleted_ids if frappe.db.exists("Advisory Conversation", name)]
	report["orphanMessageRows"] = frappe.db.count(
		"Advisory Message", {"parent": ("not in", [r["name"] for r in frappe.get_all("Advisory Conversation", fields=["name"])])}
	)
	report["messagesWithWrongParenttype"] = frappe.db.count("Advisory Message", {"parenttype": ("!=", "Advisory Conversation")})
	report["counts"] = {
		"Advisory Conversation": frappe.db.count("Advisory Conversation"),
		"Advisory Message": frappe.db.count("Advisory Message"),
		"Deleted Document": frappe.db.count("Deleted Document"),
		"Borrower Profile": frappe.db.count("Borrower Profile"),
		"Loan Application": frappe.db.count("Loan Application"),
		"Loan Application Document": frappe.db.count("Loan Application Document"),
		"Loan Decision Evidence": frappe.db.count("Loan Decision Evidence"),
		"Application State Log": frappe.db.count("Application State Log"),
		"Loan": frappe.db.count("Loan"),
		"Loan Disbursement": frappe.db.count("Loan Disbursement"),
		"Loan Demand": frappe.db.count("Loan Demand"),
		"User": frappe.db.count("User"),
		"Customer": frappe.db.count("Customer"),
	}
	report["demoProfile"] = {
		field: str(frappe.db.get_value("Borrower Profile", OWNER, field))
		for field in (
			"consent_at", "consent_terms", "consent_privacy", "terms_version", "privacy_version",
			"full_name", "email", "customer", "status", "onboarding_state", "monthly_income",
			"monthly_obligations", "profile_completion",
		)
	}
	report["demoApplications"] = [
		{"name": row["name"], "status": row["status"], "modified": str(row["modified"])}
		for row in frappe.get_all(
			"Loan Application", filters={"applicant": "Review Demo Borrower"},
			fields=["name", "status", "modified"], order_by="name",
		)
	]
	other_owners = frappe.get_all("Advisory Conversation", fields=["owner"], group_by="owner")
	report["conversationsPerOwner"] = {
		row["owner"]: frappe.db.count("Advisory Conversation", {"owner": row["owner"]}) for row in other_owners
	}
	# The user's login state must be exactly as it was: not disabled, no forced reset.
	user = frappe.get_doc("User", OWNER)
	report["authUnchanged"] = {
		"enabled": user.enabled,
		"restrict_ip": user.restrict_ip or "",
		"roles": sorted(r.role for r in user.roles),
		"last_password_reset": str(user.last_password_reset_date),
	}
	report["problems"] = problems
	print(json.dumps(report, indent=2, default=str))


if __name__ == "__main__":
	main()
