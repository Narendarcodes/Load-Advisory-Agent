"""The small read-only slice of the loan catalogue the portal can show.

One product is offered at a time, but the query stays a list so a second product
appears without a code change. Nothing here quotes a personalised rate.
"""

import frappe


def enabled_products(limit: int = 20) -> list[dict]:
	return frappe.get_all(
		"Loan Product",
		filters={"disabled": 0, "is_term_loan": 1},
		fields=["name", "product_name", "maximum_loan_amount", "rate_of_interest"],
		order_by="product_name asc",
		limit_page_length=limit,
	)


def primary_product() -> dict | None:
	rows = enabled_products(limit=2)
	return rows[0] if rows else None
