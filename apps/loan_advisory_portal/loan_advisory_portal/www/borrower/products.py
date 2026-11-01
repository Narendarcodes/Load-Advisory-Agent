from loan_advisory_portal.portal.catalogue import enabled_products
from loan_advisory_portal.portal.pages import public_page

no_cache = 1
base_template_path = "templates/portal/base.html"


def get_context(context):
	context = public_page(context, "products", "Loan products")
	products = [
		{
			"name": row.product_name or row.name,
			"maximum_loan_amount": row.maximum_loan_amount,
			"rate_of_interest": row.rate_of_interest,
		}
		for row in enabled_products()
	]
	context["products"] = products
	context["primary"] = products[0] if products else None
	return context
