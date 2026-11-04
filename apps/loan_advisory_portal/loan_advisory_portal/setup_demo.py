"""Demo Loan Officer for the Saral review desk (ADR-0009).

Run on a development site only:

    bench --site <site> execute loan_advisory_portal.setup_demo.create_demo_officer

No credential is committed: the password is generated here with `secrets`, set on the
user, and printed once to the operator's terminal. Run again with `rotate=1` to issue a
new one. Refuses to run unless `developer_mode` or `allow_demo_users` is set in the site
config, so a production site never gets a demo account.
"""

import secrets

import frappe

from loan_advisory_portal.install import OFFICER_ROLE, ensure_roles

DEMO_OFFICER_EMAIL = "loan.officer.demo@example.invalid"
DEMO_OFFICER_NAME = "Demo Loan Officer"


def generate_password() -> str:
	# 24 url-safe characters plus fixed classes so Frappe's password policy accepts it.
	return secrets.token_urlsafe(18) + "aA1!"


def _allowed() -> bool:
	return bool(frappe.conf.get("developer_mode") or frappe.conf.get("allow_demo_users"))


def create_demo_officer(email: str = DEMO_OFFICER_EMAIL, rotate: int | bool = 0) -> dict:
	if not _allowed():
		frappe.throw("Demo users are only created on a site with developer_mode or allow_demo_users.")
	from frappe.utils.password import update_password

	ensure_roles()
	created = not frappe.db.exists("User", email)
	if created:
		user = frappe.get_doc({
			"doctype": "User", "email": email, "first_name": DEMO_OFFICER_NAME, "user_type": "System User",
			"send_welcome_email": 0, "enabled": 1, "roles": [{"role": OFFICER_ROLE}],
		})
		user.flags.ignore_password_policy = True
		user.insert(ignore_permissions=True)
	else:
		user = frappe.get_doc("User", email)
		if OFFICER_ROLE not in {r.role for r in user.roles}:
			user.append("roles", {"role": OFFICER_ROLE})
			user.save(ignore_permissions=True)
	password = None
	if created or rotate:
		password = generate_password()
		update_password(email, password)
	frappe.db.commit()
	result = {"user": email, "role": OFFICER_ROLE, "created": created}
	if password:
		# Shown once on the operator's terminal; never stored in the repo or in a file.
		result["password"] = password
		print(f"Demo Loan Officer {email} password (shown once): {password}")
	return result
