from loan_advisory_portal.portal.catalogue import primary_product
from loan_advisory_portal.portal.pages import borrower_page

no_cache = 1
base_template_path = "templates/portal/base.html"


def get_context(context):
	context = borrower_page(context, "apply", "New application")
	product = primary_product()
	context["product"] = (
		{
			"name": product.product_name or product.name,
			"maximum": product.maximum_loan_amount or 0,
			"rate": product.rate_of_interest or 0,
		}
		if product
		else None
	)
	return context
