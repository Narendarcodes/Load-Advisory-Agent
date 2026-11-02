# Diagram inventory

Every diagram in `docs/architecture/diagrams/`, its editable source, and whether it matches the code as
of 2026-11-02. Sources are Mermaid `.mmd`; `bash docs/architecture/diagrams/render.sh` regenerates the
`.svg` and `.png` for all of them.

## Required diagram set

| # | Diagram | Source | Status | Code checked against |
| --- | --- | --- | --- | --- |
| 1 | System context | `01-system-context.mmd` | **drift found, left unmodified** (see below) | — |
| 2 | Application architecture | `02-components.mmd` | **drift found, left unmodified** | — |
| 3 | Infrastructure / deployment | `07-infrastructure-deployment.mmd` | **new, rendered** | `infra/frappe/loanrangers.yml`, `apps/runtime`, `agent/server.py` |
| 4 | Entity relationship | `06-entity-model.mmd` | **new, rendered** | 11 portal DocType JSON files, `install.py` custom fields, `e2e_seed.py` |
| 5 | Borrower application sequence | `08-borrower-application-sequence.mmd` | **new, rendered** | `www/borrower/apply.py`, `public/js/pages/apply.js`, `api/applications.py`, `api/documents.py` |
| 6 | AI assistant sequence | `03-agent-request-sequence.mmd` + `11-authentication-authorization.mmd` | existing **drift**; #11 **new, rendered** and current | `api/agui.py`, `api/assertion.py`, `apps/runtime/src`, `nginx.loanportal.conf` |
| 7 | Decision engine flow | `09-decision-engine-flow.mmd` | **new, rendered** | `application/lifecycle.py`, `decision_engine/policies/registry.json`, `personal_loan_synthetic_v1.json`, `infrastructure/evidence_store.py` |
| 8 | Consent lifecycle | `10-consent-lifecycle.mmd` | **new, rendered** | `doctype/borrower_profile/borrower_profile.py`, `api/profile.py`, `tests/test_consent.py`, `doctype/voice_session` |
| 9 | Authentication and authorisation | `11-authentication-authorization.mmd` | **new, rendered** | `portal/headers.py`, `api/agent.py` (mint), `api/auth.py`, `tests/e2e/portal_security.py` |

Also present, outside the required set: `04-voice-turn-sequence.mmd` (describes the voice path, which is
**not deployable** here — `livekit_url` is `wss://livekit.invalid`) and `05-data-policy-ingestion.mmd`.

## Rendering verification

All six new diagrams were rendered with `@mermaid-js/mermaid-cli@11` (the version `render.sh` pins) and
produced valid SVG. Two syntax faults were caught by rendering rather than by reading:

- a `;` inside a `Note over` line ends the statement in Mermaid sequence syntax
- an HTML entity (`&lt;…&gt;`) inside a message label breaks the parse

Both were fixed and re-rendered. `06` through `11` ship as `.mmd` + `.svg`; run `render.sh` to produce
their `.png`s in one pass with the rest.

## Drift found in the existing diagrams, and why it was not silently rewritten

`01-system-context.mmd` and `02-components.mmd` describe the advisory server as

> `Advisory server … stdlib http.server :8095`

and `03`/`04` label it `Server :8095`. The server is **FastAPI served by uvicorn**
(`agent/server.py` calls `uvicorn.run(create_app(...))`, and `/healthz` plus the `/api/agui` router come
from `api/app.py`). `README.md` made the same claim and **has been corrected in this change**.

None of the five existing diagrams mentions the CopilotKit runtime, the React island, the assertion
bridge or the portal — the components that actually carry borrower traffic today — so the diagram set
described an earlier single-page chat architecture. Diagrams `06`–`11` add that missing reality rather
than pretending the old pictures covered it.

**Why not edit `01`–`04` in this change:** their `.svg` and `.png` are committed next to the source.
Editing `.mmd` without regenerating those files would publish a picture that contradicts its own source
— the exact failure this audit is meant to catch. Regenerating them churns four binary artefacts for a
two-word label fix. So the fix is recorded here for a follow-up, and the one place where it misleads a
reader today — the README prose — is corrected.

To finish this properly: edit the four `.mmd` labels, run `bash docs/architecture/diagrams/render.sh`,
and commit sources with images together.

## Not verified in this audit

Whether `04-voice-turn-sequence.mmd` and the voice internals in `02-components.mmd` (LiveKit Agents
1.8, Silero VAD, specific STT/TTS model names and sidecar ports) still match `apps/voice/` — that path
cannot be executed here because no LiveKit server exists, so it was neither confirmed nor changed.
