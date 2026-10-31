import frappe


def get_website_user_home_page(user):
	if "Loan Borrower" in frappe.get_roles(user):
		return "/borrower"
	return None
