# Loan Advisory Portal

Custom Frappe application that owns the borrower-facing experience of the Loan
Advisory Agent.

Responsibilities:

- Invitation-bound registration and the one-to-one `User` ↔ `Customer` mapping.
- Borrower profile and consent.
- Borrowing-facing whitelisted APIs with server-side ownership checks.
- Application creation and submission on top of Frappe Lending records.
- Feedback, notifications and portal assets.
- Short-lived signed assertions for the CopilotKit runtime and the agent service.
- LiveKit voice token minting (the LiveKit API secret never leaves the server).

Out of scope: underwriting rules (ZEN), agent orchestration (LangGraph), chat
transport (CopilotKit runtime) and traces (Langfuse). Those stay in the agent
stack.

## Install (disposable development site only)

```bash
bench --site <dev-site> install-app loan_advisory_portal
bench --site <dev-site> migrate
bench --site <dev-site> run-tests --app loan_advisory_portal
```

Never install or migrate this app against a shared site without an explicit
owner decision.
