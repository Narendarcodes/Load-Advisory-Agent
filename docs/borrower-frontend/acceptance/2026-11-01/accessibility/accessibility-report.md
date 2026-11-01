# Accessibility audit — borrower portal

- Captured: 2026-11-01T14:44:18.371Z
- Target: WCAG 2.2 AA; tags: wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa
- axe-core 4.14.0 via @axe-core/playwright 4.14.0; Playwright 1.63.0
- Runs: 103 across widths 1440, 1280, 1024, 768, 390; states at 1440, 390
- Suppressions: none: no rules disabled, no includes/excludes, no overrides
- Console errors during the audit: 2

## Violations (0 runs, 0 distinct rules)

| Rule | Impact | Nodes | Help | Seen in (view/state@width) |
| --- | --- | --- | --- | --- |
| — | — | — | no violations reported | |

## States recorded as NOT reached in the browser

- none: every requested state was reached before it was audited

## axe checks needing manual review (incomplete)

- color-contrast: 48 runs

### Distinct nodes axe could not decide

| Rule | Selector | Markup | First seen |
| --- | --- | --- | --- |
| color-contrast | .plate__badge | <span class="plate__badge">Clear terms</span> | 01-landing-products/default@1440 |
| color-contrast | .input-group__prefix | <span class="input-group__prefix" aria-hidden="true">₹</span> | 01-landing-products/default@1440 |
| color-contrast | #calc-tenure | <select id="calc-tenure">
							<option value="12">12 months</option>
							<option valu | 01-landing-products/default@1440 |
| color-contrast | section[aria-labelledby="req-heading"] > .field > .input-group > .input-group__prefix[aria-hidden="true"] | <span class="input-group__prefix" aria-hidden="true">₹</span> | 04-eligibility/default@1440 |
| color-contrast | #el-tenure | <select id="el-tenure" name="tenure">
						<option value="12">12 months</option>
						<o | 04-eligibility/default@1440 |
| color-contrast | #el-purpose | <select id="el-purpose" name="purpose"> | 04-eligibility/default@1440 |
| color-contrast | .field:nth-child(1) > .input-group > .input-group__prefix[aria-hidden="true"] | <span class="input-group__prefix" aria-hidden="true">₹</span> | 04-eligibility/default@1440 |
| color-contrast | .grid-2 > .field:nth-child(2) > .input-group > .input-group__prefix[aria-hidden="true"] | <span class="input-group__prefix" aria-hidden="true">₹</span> | 04-eligibility/default@1440 |
| color-contrast | .identity-card__top > span:nth-child(1) | <span>Identity summary</span> | 06-kyc-workspace/default@1440 |
| color-contrast | .identity-card__name | <div class="identity-card__name">Review Demo Borrower</div> | 06-kyc-workspace/default@1440 |
| color-contrast | #card-pan | <p class="identity-card__masked" id="card-pan">PAN ••••••••••</p> | 06-kyc-workspace/default@1440 |
| color-contrast | #card-aadhaar | <p class="identity-card__masked" id="card-aadhaar">Aadhaar •••• •••• ••••</p> | 06-kyc-workspace/default@1440 |
| color-contrast | .identity-card__meta > span:nth-child(1) | <span>Not verified</span> | 06-kyc-workspace/default@1440 |
| color-contrast | .identity-card__meta > span:nth-child(2) | <span>Preview only</span> | 06-kyc-workspace/default@1440 |
| color-contrast | li:nth-child(1) > .checklist__mark[aria-hidden="true"] | <span class="checklist__mark" aria-hidden="true">✓</span> | 10-advisory-workspace/default@1440 |
| color-contrast | li:nth-child(2) > .checklist__mark[aria-hidden="true"] | <span class="checklist__mark" aria-hidden="true">✓</span> | 10-advisory-workspace/default@1440 |
| color-contrast | li:nth-child(3) > .checklist__mark[aria-hidden="true"] | <span class="checklist__mark" aria-hidden="true">✓</span> | 10-advisory-workspace/default@1440 |
| color-contrast | li:nth-child(4) > .checklist__mark[aria-hidden="true"] | <span class="checklist__mark" aria-hidden="true">✓</span> | 10-advisory-workspace/default@1440 |
| color-contrast | #employment-type | <select id="employment-type" name="employment_type"> | 12-profile/default@1440 |
| color-contrast | #locale | <select id="locale" name="preferred_locale">
					
					<option value="en" selected="">Eng | 12-profile/default@1440 |
| color-contrast | #literacy | <select id="literacy" name="literacy">
					
					<option value="low">Plain, simple wordin | 12-profile/default@1440 |
| color-contrast | #category | <select id="category" name="category"> | 14-feedback/default@1440 |
| color-contrast | #application | <select id="application" name="application">
					<option value="">Not about one applicati | 14-feedback/default@1440 |
| color-contrast | .tabbar > a[href$="borrower"] | <a href="/borrower"><span class="tabbar__abbr" aria-hidden="true">AP</span>Home</a> | 04-eligibility/default@390 |
| color-contrast | a[href$="borrower"] > .tabbar__abbr[aria-hidden="true"] | <span class="tabbar__abbr" aria-hidden="true">AP</span> | 05-apply/form-validation@390 |
| color-contrast | a[href$="assistant"] > .tabbar__abbr[aria-hidden="true"] | <span class="tabbar__abbr" aria-hidden="true">AS</span> | 05-apply/form-validation@390 |
| color-contrast | a[href$="documents"] > .tabbar__abbr[aria-hidden="true"] | <span class="tabbar__abbr" aria-hidden="true">DO</span> | 05-apply/form-validation@390 |
| color-contrast | a[href$="profile"] > .tabbar__abbr[aria-hidden="true"] | <span class="tabbar__abbr" aria-hidden="true">PF</span> | 05-apply/form-validation@390 |
| color-contrast | .topbar__brand > span:nth-child(2) | <span>Loan Advisory</span> | 06-kyc-workspace/form-validation@390 |
| color-contrast | .nav-signout | <button type="button" class="nav-signout" data-action="logout">Sign out</button> | 06-kyc-workspace/form-validation@390 |
| color-contrast | a[href$="apply"] > .tabbar__abbr[aria-hidden="true"] | <span class="tabbar__abbr" aria-hidden="true">NE</span> | 07-documents-empty/default@390 |
| color-contrast | li[data-state="done"] > strong | <strong>Started</strong> | 08-application-submitted/default@390 |
| color-contrast | li[data-state="done"] > span | <span>Draft created</span> | 08-application-submitted/default@390 |
| color-contrast | li[data-state="current"] > strong | <strong>Submitted</strong> | 08-application-submitted/default@390 |
| color-contrast | li[data-state="current"] > span | <span>Sent for checks</span> | 08-application-submitted/default@390 |
| color-contrast | .tracker__stage:nth-child(3) > strong | <strong>Checks</strong> | 08-application-submitted/default@390 |
| color-contrast | .tracker__stage:nth-child(3) > span | <span>Policy and information</span> | 08-application-submitted/default@390 |
| color-contrast | .tracker__stage[data-state="done"]:nth-child(1) > strong | <strong>Started</strong> | 09-application-not-approved/default@390 |
| color-contrast | .tracker__stage[data-state="done"]:nth-child(1) > span | <span>Draft created</span> | 09-application-not-approved/default@390 |
| color-contrast | .tracker__stage[data-state="done"]:nth-child(2) > strong | <strong>Submitted</strong> | 09-application-not-approved/default@390 |
| color-contrast | .tracker__stage[data-state="done"]:nth-child(2) > span | <span>Sent for checks</span> | 09-application-not-approved/default@390 |
| color-contrast | .tracker__stage[data-state="done"]:nth-child(3) > strong | <strong>Checks</strong> | 09-application-not-approved/default@390 |
| color-contrast | .tracker__stage[data-state="done"]:nth-child(3) > span | <span>Policy and information</span> | 09-application-not-approved/default@390 |
| color-contrast | .tabbar > a[href$="apply"] | <a href="/borrower/apply"><span class="tabbar__abbr" aria-hidden="true">NE</span>Apply</a> | 10-advisory-workspace/citations-response@390 |

## Failed HTTP responses during the audit

- 404 http://127.0.0.1:8081/api/method/loan_advisory_portal.api.agent.conversation_messages?thread_id=51d0078d-2db5-48cf-b13f-bb0f94274bbc
- 404 http://127.0.0.1:8081/api/method/loan_advisory_portal.api.agent.conversation_messages?thread_id=3228b87e-5f92-41c0-a526-6464db6afd81
