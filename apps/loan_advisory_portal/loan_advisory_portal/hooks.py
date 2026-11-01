app_name = "loan_advisory_portal"
app_title = "Loan Advisory Portal"
app_publisher = "Loan Rangers"
app_description = "Borrower portal for the Loan Advisory Agent, built on Frappe and Frappe Lending"
app_email = "dev@example.invalid"
app_license = "MIT"

# Portal assets are loaded by templates/portal/base.html, not injected into Desk.
app_include_css = []
app_include_js = []

after_install = "loan_advisory_portal.install.after_install"
after_migrate = "loan_advisory_portal.install.after_migrate"
before_install = "loan_advisory_portal.install.before_install"

get_website_user_home_page = "loan_advisory_portal.portal.routing.get_website_user_home_page"

after_request = ["loan_advisory_portal.portal.headers.apply"]

jinja = {
	"methods": [
		"loan_advisory_portal.portal.jinja.portal_bootstrap",
	]
}

doc_events = {
	"User": {
		"on_update": "loan_advisory_portal.portal.identity.on_user_update",
	},
}

# Borrowers never get generic Desk permissions on Lending DocTypes; the portal
# talks to whitelisted methods that re-check ownership on the server.
