import frappe
from frappe.tests.utils import FrappeTestCase

from loan_advisory_portal.portal import legal
from loan_advisory_portal.portal.errors import Conflict, InvitationInvalid
from loan_advisory_portal.services import invitations
from loan_advisory_portal.tests.utils import as_user, ensure_company, ensure_product, make_borrower, make_customer

PASSWORD = "CorrectHorseBattery9"


class InvitationTest(FrappeTestCase):
	@classmethod
	def setUpClass(cls):
		super().setUpClass()
		ensure_product(ensure_company())

	def setUp(self):
		frappe.set_user("Administrator")
		self.customer = make_customer()
		self.email = f"invitee-{frappe.generate_hash(length=8)}@example.invalid"

	def _issue(self, **overrides):
		values = {"email": self.email, "customer": self.customer}
		values.update(overrides)
		return invitations.issue_invitation(**values)

	def _redeem(self, token):
		return invitations.redeem(
			token,
			full_name="Invited Borrower",
			password=PASSWORD,
			phone="+919876543210",
			consent_terms=True,
			consent_privacy=True,
		)

	def test_issue_requires_system_manager(self):
		user, _ = make_borrower()
		with as_user(user.name):
			with self.assertRaises(frappe.PermissionError):
				invitations.issue_invitation(self.email, self.customer)

	def test_redeem_creates_bound_borrower(self):
		issued = self._issue()
		self.assertEqual(issued["token"].count("."), 1)
		self.assertNotIn(issued["token"], frappe.db.get_value("Account Invitation", issued["invitation"], "secret_hash"))

		claims = invitations.validate_token(issued["token"])
		self.assertEqual(claims["customer"], self.customer)

		result = self._redeem(issued["token"])
		user = frappe.get_doc("User", result["user"])
		self.assertEqual(user.user_type, "Website User")
		self.assertIn("Loan Borrower", frappe.get_roles(user.name))
		self.assertTrue(user.enabled)

		profile = frappe.get_doc("Borrower Profile", result["profile"])
		self.assertEqual(profile.customer, self.customer)
		self.assertEqual(profile.status, "Active")
		# The acceptance points at the text that was on screen.
		self.assertEqual(profile.terms_version, legal.TERMS_VERSION)
		self.assertEqual(profile.privacy_version, legal.PRIVACY_VERSION)

		links = frappe.get_all(
			"Portal User",
			filters={"parent": self.customer, "parentfield": "portal_users"},
			pluck="user",
		)
		self.assertIn(user.name, links)
		self.assertTrue(frappe.db.get_value("Account Invitation", issued["invitation"], "redeemed"))
		self.assertTrue(
			frappe.db.exists("Account Invitation Redemption", {"invitation": issued["invitation"], "user": user.name})
		)

	def test_token_is_single_use(self):
		issued = self._issue()
		self._redeem(issued["token"])
		with self.assertRaises(InvitationInvalid):
			self._redeem(issued["token"])

	def test_wrong_secret_is_rejected(self):
		issued = self._issue()
		invitation_id, _secret = issued["token"].split(".", 1)
		with self.assertRaises(InvitationInvalid):
			invitations.validate_token(f"{invitation_id}.{'x' * 43}")

	def test_expired_token_is_rejected(self):
		issued = self._issue()
		frappe.db.set_value(
			"Account Invitation",
			issued["invitation"],
			"expires_at",
			"2020-01-01 00:00:00",
			update_modified=False,
		)
		with self.assertRaises(InvitationInvalid):
			invitations.validate_token(issued["token"])

	def test_revoked_token_is_rejected(self):
		issued = self._issue()
		invitations.revoke_invitation(issued["invitation"])
		with self.assertRaises(InvitationInvalid):
			invitations.validate_token(issued["token"])

	def test_duplicate_email_is_conflict(self):
		user, _ = make_borrower(email=self.email)
		self.assertTrue(frappe.db.exists("User", user.name))
		with self.assertRaises(Conflict):
			self._issue()

	def test_customer_with_portal_account_is_conflict(self):
		user, profile = make_borrower()
		with self.assertRaises(Conflict):
			self._issue(customer=profile.customer, email=f"{frappe.generate_hash(length=6)}@example.invalid")

	def test_password_and_consent_are_enforced(self):
		issued = self._issue()
		with self.assertRaises(InvitationInvalid):
			invitations.redeem(issued["token"], full_name="A", password="short", consent_terms=True, consent_privacy=True)
		with self.assertRaises(InvitationInvalid):
			invitations.redeem(issued["token"], full_name="A", password=PASSWORD, consent_terms=True, consent_privacy=False)

	def test_reissue_revokes_older_link(self):
		first = self._issue()
		second = self._issue(note="resend")
		self.assertTrue(frappe.db.get_value("Account Invitation", first["invitation"], "revoked"))
		with self.assertRaises(InvitationInvalid):
			invitations.validate_token(first["token"])
		invitations.validate_token(second["token"])

	def test_application_must_belong_to_customer(self):
		other_customer = make_customer()
		self.assertNotEqual(other_customer, self.customer)
		with self.assertRaises(Conflict):
			self._issue(application="DOES-NOT-EXIST")

	def test_username_is_derived_from_the_email(self):
		local = f"First.Last-{frappe.generate_hash(length=4)}"
		self.email = f"{local}@example.invalid"
		issued = self._issue()
		self.assertEqual(invitations.validate_token(issued["token"])["suggested_username"], local.lower())

		result = self._redeem(issued["token"])
		self.assertEqual(result["username"], local.lower())
		self.assertEqual(frappe.db.get_value("User", result["user"], "username"), local.lower())

	def test_explicit_username_is_kept(self):
		issued = self._issue()
		custom = f"custom-{frappe.generate_hash(length=6)}"
		result = invitations.redeem(
			issued["token"],
			full_name="Invited Borrower",
			password=PASSWORD,
			username=custom,
			consent_terms=True,
			consent_privacy=True,
		)
		self.assertEqual(frappe.db.get_value("User", result["user"], "username"), custom)

	def test_taken_username_is_rejected_not_reassigned(self):
		blocker, _ = make_borrower()
		taken = frappe.db.get_value("User", blocker.name, "username")
		self.assertTrue(taken)

		issued = self._issue()
		with self.assertRaises(Conflict):
			invitations.redeem(
				issued["token"],
				full_name="Invited Borrower",
				password=PASSWORD,
				username=taken,
				consent_terms=True,
				consent_privacy=True,
			)
		# The invitation stays usable: a rejected username must not burn it.
		self.assertFalse(frappe.db.get_value("Account Invitation", issued["invitation"], "redeemed"))

	def test_invalid_username_is_rejected(self):
		issued = self._issue()
		with self.assertRaises(InvitationInvalid):
			invitations.redeem(
				issued["token"],
				full_name="Invited Borrower",
				password=PASSWORD,
				username="Not Allowed!",
				consent_terms=True,
				consent_privacy=True,
			)
