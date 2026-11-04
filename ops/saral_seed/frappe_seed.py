"""Bench-side Saral ops seeder (SYNTHETIC ONLY, disposable/dev sites only).

Seeds borrowers, applications (four purposes, ₹25L product cap, 20% sizing rate), synthetic
documents, KYC / bank-statement / bureau summary records and the evidence + reader service keys
from a plan made by `ops/saral_seed/plan.py`. Modelled on loan_advisory_portal/tests/e2e_seed.py.
Idempotent: an applicant already seeded is skipped. Nothing secret crosses stdout: passwords and
API secrets go to a 0600 JSON file the operator keeps on the box.

    docker cp plan.json <backend>:/tmp/saral_plan.json
    docker cp ops/saral_seed/frappe_seed.py <backend>:/tmp/frappe_seed.py
    docker exec -w /home/frappe/frappe-bench/sites <backend> ../env/bin/python /tmp/frappe_seed.py \
        <site> /tmp/saral_plan.json /tmp/saral-ops/creds.json /tmp/saral-ops/mapping.json
"""
import json
import os
import secrets
import sys
from datetime import datetime

import frappe

PRODUCT_CAP = 2_500_000
SIZING_RATE = 20
TAG = "saral-ops"


def _password() -> str:
	return secrets.token_urlsafe(18) + "!A1"


def _phone(aid: str) -> str:
	return f"+9198765{int(aid.rsplit('-', 1)[1]):05d}"


def _fill(doc: dict, doctype: str, src: dict) -> dict:
	"""Copy same-named catalogue values onto a DocType, converting to each field's type."""
	for df in frappe.get_meta(doctype).fields:
		name = df.fieldname
		if name in doc or name not in src or src[name] is None:
			continue
		v, t = src[name], df.fieldtype
		try:
			if t == "Check":
				doc[name] = 1 if v else 0
			elif t == "Int":
				doc[name] = len(v) if isinstance(v, (list, dict)) else int(v) if isinstance(v, (int, float, bool)) else None
			elif t in ("Float", "Currency", "Percent"):
				if isinstance(v, (int, float)) and not isinstance(v, bool):
					doc[name] = float(v)
			elif t == "Select":
				if str(v) in (df.options or "").split("\n"):
					doc[name] = str(v)
			elif t == "Date":
				if isinstance(v, str) and len(v) == 10:
					doc[name] = v
			elif t in ("Data", "Small Text", "Text", "Long Text", "Code", "JSON"):
				doc[name] = v if isinstance(v, str) else json.dumps(v, ensure_ascii=False, default=str)
		except (TypeError, ValueError):
			pass
		if doc.get(name) is None:
			doc.pop(name, None)
	return doc


def _insert(doc: dict):
	d = frappe.get_doc(doc)
	d.flags.ignore_permissions = True
	d.insert()
	return d.name


def _service(suffix: str, roles: list[str]):
	from frappe.core.doctype.user.user import generate_keys

	email = f"{TAG}-{suffix}@example.invalid"
	if not frappe.db.exists("User", email):
		u = frappe.get_doc({"doctype": "User", "email": email, "first_name": f"Saral Ops {suffix.title()}",
		                    "username": f"{TAG}-{suffix}", "user_type": "System User", "send_welcome_email": 0,
		                    "enabled": 1, "roles": [{"role": r} for r in roles]})
		u.flags.ignore_permissions = True
		u.insert()
	keys = generate_keys(email)
	return {"user": email, "api_key": frappe.db.get_value("User", email, "api_key"), "api_secret": keys["api_secret"]}


def _borrower(row: dict):
	from loan_advisory_portal.tests import utils

	aid, email, password = row["applicant_id"], row["email"], _password()
	if frappe.db.exists("User", email):  # DUPLICATE_APPLICANT shares another applicant's email on purpose
		email = f"{aid.lower()}.dup@example.invalid"
	customer = utils.make_customer(aid)
	user = frappe.get_doc({"doctype": "User", "email": email, "first_name": aid, "username": aid.lower(),
	                       "user_type": "Website User", "send_welcome_email": 0, "enabled": 1,
	                       "new_password": password, "roles": [{"role": "Loan Borrower"}]})
	user.flags.ignore_permissions = True
	user.flags.ignore_password_policy = True
	frappe.flags.in_import = True  # a bulk seed of 200 users trips Frappe's 60-users/hour throttle
	try:
		user.insert()
	finally:
		frappe.flags.in_import = False
	c = frappe.get_doc("Customer", customer)
	c.append("portal_users", {"user": user.name})
	c.flags.ignore_permissions = True
	c.save()
	profile = _insert({"doctype": "Borrower Profile", "user": user.name, "customer": customer, "status": "Active",
	                   "onboarding_state": "Profile Complete", "full_name": aid, "email": email,
	                   "phone": _phone(aid), "employment_type": "Salaried",
	                   "employment_months": row["employment_months"], "monthly_income": row["monthly_income"],
	                   "monthly_obligations": row["monthly_obligations"], "literacy": "medium",
	                   "preferred_locale": "en", "consent_terms": 1, "consent_privacy": 1})
	return user.name, customer, profile, password


def _documents(app: str, user: str, kinds: list[str]) -> int:
	from loan_advisory_portal.api import documents
	from loan_advisory_portal.tests import utils

	n = 0
	for kind in (kinds or [utils.DOCUMENT_TYPE])[:4]:
		if not frappe.db.exists("Loan Document Type", kind):
			_insert({"doctype": "Loan Document Type", "loan_document_type": kind})
		with utils.as_user(user):
			f = utils.save_private_file(f"{kind.lower()}-synthetic.pdf")
			documents.attach_document(app, kind, f.name)
		n += 1
	return n


def _records(row: dict, app: str, profile: str) -> list[str]:
	z, bank, made = dict(row.get("zen_inputs") or {}), row.get("bank") or {}, []
	z.pop("pan_hash", None)  # the dataset's b32 digest is not the 64-hex the DocType validates
	if z.get("total_credit_limits") is not None and not isinstance(z["total_credit_limits"], list):
		z["total_credit_limits"] = [z["total_credit_limits"]]
	now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
	specs = [
		("KYC Verification", {"doctype": "KYC Verification", "loan_application": app, "borrower_profile": profile,
		                      "kyc_source": "SYNTHETIC_PAN", "verified_at": now}),
		("Bank Statement Summary", {"doctype": "Bank Statement Summary", "loan_application": app,
		                            "aa_reference_id": bank.get("statement_id") or f"AA-{row['applicant_id']}",
		                            "account_masked": (bank.get("masked_number") or "")[-4:] or None, # ifsc left empty: the synthetic XSYNS series fails the real-IFSC pattern

		                            "period_from": bank.get("period_from"), "period_to": bank.get("period_to"),
		                            "content_sha256": bank.get("content_sha256") or "none", "fetched_at": now}),
		("Bureau Report Summary", {"doctype": "Bureau Report Summary", "loan_application": app,
		                           "report_id": row.get("bureau_report_id") or f"NOHIT-{row['applicant_id']}",
		                           "provider_name": "synthetic-bureau", "fetched_at": now,
		                           "report_status": "FETCHED" if row.get("credit_score") else "NO_HIT",
		                           "score_status": "PRESENT" if row.get("credit_score") else "NO_HIT",
		                           "score_value": row.get("credit_score")}),
	]
	for doctype, base in specs:
		if not frappe.db.exists("DocType", doctype):
			continue
		existing = frappe.db.get_value(doctype, {"loan_application": app}, "name")
		if existing:  # idempotent: one summary row of each kind per application
			made.append(existing)
			continue
		base = {k: v for k, v in base.items() if v is not None}
		try:
			made.append(_insert(_fill(base, doctype, z)))
		except Exception as e:  # a summary row is supporting data; the application still seeds
			frappe.log_error(f"saral ops seed {doctype}", str(e)[:500])
	return made


def seed_one(row: dict) -> dict:
	from loan_advisory_portal.api import applications
	from loan_advisory_portal.tests import utils

	user, customer, profile, password = _borrower(row)
	out = {"user": user, "password": password, "customer": customer, "profile": profile,
	       "email_aliased": user != row["email"]}
	with utils.as_user(user):
		try:
			app = applications.create_application(
				loan_amount=row["loan_amount"], tenure_months=row["tenure_months"], purpose=row["purpose"],
				monthly_income=row["monthly_income"], monthly_obligations=row["monthly_obligations"],
				employment_months=row["employment_months"])
		except Exception as e:
			out["application"] = None
			out["portal_refused"] = str(e)[:160]
			return out
	name = app["name"]
	out["application"] = name
	if row.get("credit_score"):
		frappe.db.set_value("Loan Application", name, {"custom_credit_score": row["credit_score"],
		                    "custom_credit_score_origin": "BUREAU"}, update_modified=False)
	out["documents"] = _documents(name, user, row.get("documents") or [])
	out["records"] = len(_records(row, name, profile))
	with utils.as_user(user):
		applications.submit_application(name)
	return out


def backfill(creds: dict, rows: list[dict]) -> int:
	"""Re-create missing KYC / bank / bureau summary rows for applications already seeded."""
	n = 0
	for row in rows:
		b = creds["borrowers"].get(row["applicant_id"]) or {}
		if b.get("application") and (b.get("records") or 0) < 3:
			b["records"] = len(_records(row, b["application"], b["profile"]))
			frappe.db.commit()
			n += 1
	return n


def main(site, plan_path, creds_path, mapping_path, mode="seed"):
	frappe.init(site=site, sites_path=".")
	frappe.connect()
	frappe.set_user("Administrator")
	if not (frappe.conf.get("allow_tests") or frappe.conf.get("allow_demo_users")):
		raise SystemExit("refusing: site has neither allow_tests nor allow_demo_users")
	from loan_advisory_portal.install import EVIDENCE_ROLE
	from loan_advisory_portal.tests import utils

	company = utils.ensure_company()
	product = utils.ensure_product(company, maximum_loan_amount=PRODUCT_CAP, rate=SIZING_RATE)
	frappe.db.set_value("Loan Product", product, {"maximum_loan_amount": PRODUCT_CAP, "rate_of_interest": SIZING_RATE})
	utils.ensure_document_type()
	frappe.db.commit()

	os.makedirs(os.path.dirname(creds_path), mode=0o700, exist_ok=True)
	creds = json.load(open(creds_path)) if os.path.exists(creds_path) else {"borrowers": {}}
	if "evidence" not in creds:
		creds["evidence"] = _service("evidence", [EVIDENCE_ROLE])
		creds["reader"] = _service("reader", ["Agent Integration", "Loan Reporter"])
		frappe.db.commit()
	rows = [r for r in json.load(open(plan_path)) if r.get("synthetic") is True]
	if mode == "backfill":
		print(json.dumps({"backfilled": backfill(creds, rows)}))
		_write(creds_path, creds)
		frappe.destroy()
		return
	creds.pop("errors", None)  # a re-run retries the applicants that failed last time
	done = err = 0
	for row in rows:
		aid = row["applicant_id"]
		if aid in creds["borrowers"]:
			continue
		try:
			creds["borrowers"][aid] = seed_one(row)
			frappe.db.commit()
			done += 1
		except Exception as e:
			frappe.db.rollback()
			creds.setdefault("errors", {})[aid] = f"{type(e).__name__}: {str(e)[:200]}"
			err += 1
		if (done + err) % 20 == 0:
			_write(creds_path, creds)
			print(f"progress done={done} errors={err}", flush=True)
	_write(creds_path, creds)
	mapping = {aid: {"application": b.get("application"), "refused": b.get("portal_refused")}
	           for aid, b in creds["borrowers"].items()}
	json.dump(mapping, open(mapping_path, "w"), indent=1)
	print(json.dumps({"seeded_now": done, "errors": err, "total": len(creds["borrowers"]),
	                  "refused": sum(1 for b in creds["borrowers"].values() if not b.get("application"))}))
	frappe.destroy()


def _write(path, obj):
	tmp = path + ".tmp"
	with open(os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600), "w") as fh:
		json.dump(obj, fh, indent=1)
	os.replace(tmp, path)


if __name__ == "__main__":
	main(*sys.argv[1:6])
