"""Synthetic transcript forensics, export and deletion for the disposable `loanportal.local` site.

Modes:
  classify  read-only — every candidate conversation, its messages, and whether each one is
            conclusively attributable to the acceptance harness corpus
  export    read-only — writes the full reversible manifest of the in-scope records
  delete    deletes only the conversations listed in the manifest given by --manifest

Attribution rule, deliberately strict: a conversation is a test artefact only when **every** user
message in it appears verbatim in a harness or fixture source. Anything else is preserved and
reported, because "belongs to the demo borrower" is not the same as "was created by a test run".

Deletion uses `frappe.delete_doc` on the parent document so the normal document hooks run and the
child `Advisory Message` rows go with their parent. No SQL, no table surgery.
"""

import argparse
import hashlib
import json
import os

import frappe

SITE = "loanportal.local"
DB_NAME = "_21ddc3370f18f30e"
OWNER = "review.demo@example.invalid"
CUTOFF = "2026-11-01 00:00:00"
ATTRIBUTION = "/tmp/prompt-attribution.json"
MESSAGE_FIELD = "messages"


def connect():
	os.chdir("/home/frappe/frappe-bench/sites")
	frappe.init(site=SITE, sites_path=".")
	frappe.connect()
	frappe.set_user("Administrator")


def guard_environment():
	problems = []
	if frappe.local.site != SITE:
		problems.append(f"site is {frappe.local.site}, expected {SITE}")
	if frappe.conf.get("db_name") != DB_NAME:
		problems.append(f"db_name is {frappe.conf.get('db_name')}, expected {DB_NAME}")
	if not frappe.conf.get("allow_tests"):
		problems.append("allow_tests is not enabled")
	if not frappe.db.exists("Borrower Profile", OWNER):
		problems.append(f"{OWNER} is not on this site")
	if frappe.db.count("Loan Disbursement") or frappe.db.count("Loan Demand") or frappe.db.count("Loan"):
		problems.append("money movement exists; this is not the disposable site")
	if problems:
		raise SystemExit(json.dumps({"ok": False, "refused": problems}, indent=2))


def load_attribution():
	blob = json.load(open(ATTRIBUTION, encoding="utf-8"))
	return {row["prompt"].strip(): row for row in blob["prompts"]}, blob


def is_attributed(text, attributed_by_prompt):
	"""True only when the prompt was located verbatim in a harness source.

	A prompt that is *present as a key* is not enough: the attribution file also lists the prompts it
	could not place, and those must not be treated as test artefacts.
	"""
	entry = attributed_by_prompt.get(text.strip())
	return bool(entry and entry.get("attributed"))


def candidates():
	rows = frappe.get_all(
		"Advisory Conversation",
		filters={"owner": OWNER, "creation": [">=", CUTOFF]},
		fields=["name", "thread_id", "user", "customer", "application", "title", "turn_count",
			"status", "creation", "modified", "owner", "last_activity"],
		order_by="creation asc",
	)
	return rows


def classify():
	attributed_by_prompt, blob = load_attribution()
	synthetic, ambiguous = [], []
	for row in candidates():
		doc = frappe.get_doc("Advisory Conversation", row["name"])
		messages = [
			{
				"name": message.name,
				"idx": message.idx,
				"role": message.role,
				"text": message.text,
				"creation": str(message.creation),
				"modified": str(message.modified),
			}
			for message in doc.get(MESSAGE_FIELD) or []
		]
		user_texts = [m["text"].strip() for m in messages if m["role"] == "user"]
		unknown = sorted({t for t in user_texts if not is_attributed(t, attributed_by_prompt)})
		record = {
			"name": row["name"],
			"threadId": row["thread_id"],
			"user": row["user"],
			"customer": row["customer"],
			"application": row["application"],
			"title": row["title"],
			"turnCount": row["turn_count"],
			"status": row["status"],
			"creation": str(row["creation"]),
			"modified": str(row["modified"]),
			"owner": row["owner"],
			"messageCount": len(messages),
			"userMessages": len(user_texts),
			"unattributedPrompts": unknown,
			"messages": messages,
		}
		(synthetic if not unknown else ambiguous).append(record)
	return synthetic, ambiguous, blob


def counts():
	all_conversations = frappe.get_all("Advisory Conversation", fields=["name", "owner", "creation"])
	in_scope = {row["name"] for row in candidates()}
	orphan_messages = frappe.db.count("Advisory Message", filters={"parent": ("not in", [c["name"] for c in all_conversations])})
	return {
		"conversationsTotal": len(all_conversations),
		"conversationsForOwner": sum(1 for c in all_conversations if c["owner"] == OWNER),
		"conversationsForOwnerBeforeCutoff": sum(
			1 for c in all_conversations if c["owner"] == OWNER and str(c["creation"]) < CUTOFF
		),
		"conversationsForOwnerInCutoff": len(in_scope),
		"conversationsOtherOwners": sum(1 for c in all_conversations if c["owner"] != OWNER),
		"messagesTotal": frappe.db.count("Advisory Message"),
		"messagesUnderInScope": sum(
			1
			for name in in_scope
			for _ in frappe.get_all("Advisory Message", filters={"parent": name}, fields=["name"])
		),
		"orphanMessages": orphan_messages,
	}


def digest(rows):
	canon = json.dumps(rows, sort_keys=True, default=str)
	return hashlib.sha256(canon.encode()).hexdigest()


def main():
	parser = argparse.ArgumentParser()
	parser.add_argument("--mode", choices=("classify", "export", "delete"), default="classify")
	parser.add_argument("--manifest", default="/tmp/transcript-manifest.json")
	options = parser.parse_args()

	connect()
	guard_environment()
	synthetic, ambiguous, blob = classify()
	report = {
		"mode": options.mode,
		"site": frappe.local.site,
		"dbName": frappe.conf.get("db_name"),
		"owner": OWNER,
		"cutoff": CUTOFF,
		"attributionCorpusFiles": blob.get("corpusFiles"),
		"countsBefore": counts(),
		"syntheticCount": len(synthetic),
		"ambiguousCount": len(ambiguous),
		"syntheticMessages": sum(row["messageCount"] for row in synthetic),
		"ambiguousMessages": sum(row["messageCount"] for row in ambiguous),
		"synthetic": synthetic,
		"ambiguous": ambiguous,
	}
	report["syntheticDigest"] = digest(synthetic)
	report["inScopeIds"] = [row["name"] for row in synthetic]

	if options.mode == "classify":
		# Full detail to a file, summary to stdout: the detail carries every message body.
		with open(options.manifest, "w", encoding="utf-8") as handle:
			json.dump(report, handle, indent=2, ensure_ascii=False, default=str)
		print(json.dumps({k: v for k, v in report.items() if k not in ("synthetic", "ambiguous")}, indent=2, default=str))
		return

	if options.mode == "export":
		with open(options.manifest, "w", encoding="utf-8") as handle:
			json.dump(report, handle, indent=2, ensure_ascii=False, default=str)
		report["manifestPath"] = options.manifest
		print(json.dumps({k: v for k, v in report.items() if k not in ("synthetic", "ambiguous")}, indent=2, default=str))
		return

	if options.mode == "delete":
		manifest = json.load(open(options.manifest, encoding="utf-8"))
		ids = manifest["inScopeIds"]
		# Re-derive the classification now; refuse to delete anything that is no longer conclusive.
		fresh_synthetic, fresh_ambiguous, _ = classify()
		fresh_ids = {row["name"] for row in fresh_synthetic}
		stale = [name for name in ids if name not in fresh_ids]
		if stale:
			raise SystemExit(json.dumps({"ok": False, "refused": [f"manifest no longer conclusive for {stale}"]}, indent=2))
		if set(ids) != fresh_ids:
			raise SystemExit(json.dumps({"ok": False, "refused": ["candidate set changed since export"]}, indent=2))

		deleted, failures = [], []
		deleted_docs_before = frappe.db.count("Deleted Document")
		for name in ids:
			try:
				before = frappe.db.count("Advisory Message", filters={"parent": name})
				# Frappe 16 signature; child rows go with the parent, and `delete_permanently=False`
				# keeps a recoverable snapshot in `tabDeleted Document` alongside the exported manifest.
				frappe.delete_doc("Advisory Conversation", name, ignore_permissions=True, delete_permanently=False)
				deleted.append({"name": name, "messagesRemoved": before})
			except Exception as error:  # noqa: BLE001 - reported, not swallowed
				failures.append({"name": name, "error": str(error)[:240]})
		frappe.db.commit()

		after = counts()
		report["deleted"] = deleted
		report["deleteFailures"] = failures
		report["countsAfter"] = after
		report["deletedDocumentSnapshots"] = {"before": deleted_docs_before, "after": frappe.db.count("Deleted Document")}
		report["stillPresent"] = [
			name for name in ids if frappe.db.exists("Advisory Conversation", name)
		]
		report["orphanMessagesAfter"] = after["orphanMessages"]
		report["ambiguousPreserved"] = len(fresh_ambiguous)
		print(json.dumps({k: v for k, v in report.items() if k not in ("synthetic", "ambiguous")}, indent=2, default=str))
		return

	print(json.dumps(report, indent=2, default=str))


if __name__ == "__main__":
	main()
