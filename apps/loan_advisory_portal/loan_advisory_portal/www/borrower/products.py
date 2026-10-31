import frappe

from loan_advisory_portal.portal.pages import public_page

no_cache = 1
base_template_path = "templates/portal/base.html"


def get_context(context):
	context = public_page(context, "products", "Loan products")
	context["products"] = [
		{
			"name": row.product_name or row.name,
			"maximum_loan_amount": row.maximum_loan_amount,
			"rate_of_interest": row.rate_of_interest,
		}
		for row in _enabled_products()
	]
	return context


def _enabled_products():
	return frappe.get_all(
		"Loan Product",
		filters={"disabled": 0, "is_term_loan": 1},
		fields=["name", "product_name", "maximum_loan_amount", "rate_of_interest"],
		order_by="product_name asc",
		limit=20,
	)
