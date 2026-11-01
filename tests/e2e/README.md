# Browser and HTTP harness (disposable site)

Phase 9's end-to-end evidence. Everything here runs against `loanportal.local` only; nothing points at `p1loan.local` and no shared configuration is edited.

| File | Role |
| --- | --- |
| `nginx.loanportal.conf` | throw-away front door on `127.0.0.1:8081`; pins `Host`/`X-Frappe-Site-Name` to `loanportal.local`, proxies `/api/copilotkit` to the local runtime |
| `portal_journeys.py` | Playwright (Edge) journeys: session, dashboard, decision card, private download, assistant, wizard, profile, boundary checks |
| `portal_security.py` | HTTP regressions: guests, ownership/IDOR, CSRF, conversation ownership, assertion replay/tamper, body override, voice bridge, CORS, logout |
| `seed_evidence.py` | records one authentic decision for the seeded application (real policy pipeline) |
| `agui_stub.cjs` | test-only deterministic AG-UI upstream (`127.0.0.1:8096`) that replays the real event sequence; no model, no GPU |
| `missing_information_e2e.cjs` | browser acceptance of the Missing Information GenUI card at five widths, plus the negative payload cases |
| `thread_continuity_e2e.cjs` | assistant thread lifecycle in a real browser: brand-new thread, first answer, reload restore, new conversation, reopened conversation, and the control run that asks for a foreign thread |
| `consent_regression_e2e.cjs` | browser consent-timestamp regression: four real profile/wizard saves as a seeded borrower, then read the Version chain to confirm only the acceptance moved `consent_at`. Declares `update_profile` as its own write |
| `conversation_list_state.cjs` | renders the assistant history panel and reads `list_conversations` in one session; run it twice with different `LABEL` values around a deletion to show the borrower-facing list follows the store |
| `accessibility_audit.cjs` | axe-core audit (WCAG 2.2 AA tags) over the route matrix and the states each page really reaches |
| `manual_contrast.cjs` | independent contrast recomputation for the nodes axe leaves undetermined |
| `keyboard_review.cjs` | Tab-order walk and Chromium accessibility-tree review (landmarks, headings, unnamed controls, `lang`) |
| `write_guard.cjs` | the control that makes a "read-only" run read-only: classifies every non-GET request against a declared list before it leaves the browser, and fails the run on anything undeclared |
| `write_guard_proof.cjs` | attempts five known writes through the guard and fails unless all five are blocked and the database is byte-identical afterwards |
| `chat_smoke.mjs`, `voice_contrast.mjs` | earlier manual smoke scripts; not part of the pass/fail harness |

Seed fixtures live with the app: `apps/loan_advisory_portal/loan_advisory_portal/tests/e2e_seed.py`.

## What is real and what is local

Real in every run: Frappe sessions, permissions and DocPerms, the CopilotKit runtime, the `mint_assertion` bridge, the FastAPI agent, evidence reads, the ZEN policy engine and Langfuse (when configured).

Local only: the language model. The runs used Ollama (`qwen3.5:4b`) through the generic `LLM_BASE`. Wording is model-dependent; the checks are written as behaviour bounds (an answer must name the recorded decision, a what-if must render as hypothetical, a guarantee must be refused) rather than exact strings.

## Bring-up

1. Disposable site running and seeded — see [frappe-disposable-environment.md](../../docs/development/frappe-disposable-environment.md), sections 2, 4.1 and 5.
2. `bench --site loanportal.local serve --port 8001` inside `loanrangers-backend-1` (assets are served only by this process).
3. Front door and both host processes (section 4.1 of the same document):
   - nginx `loanportal-e2e-proxy` → `127.0.0.1:8081`
   - runtime → `127.0.0.1:4200`
   - live agent → `127.0.0.1:8095` with `--no-rag` and the isolated env file
4. Island assets copied into the container after `npm run build` (section 3). A stale copy is the usual cause of an island that never mounts.

Health check before running anything:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8081/login       # 200
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4200/api/copilotkit/info  # 200
```

## Run

```bash
python tests/e2e/portal_journeys.py --seed <temp>/e2e1.json
python tests/e2e/portal_security.py --seed <temp>/e2e1.json
```

Both exit non-zero on any failure and write their results:

- `tests/e2e/out/journeys/` — `journeys.json` plus numbered screenshots (`01-dashboard.png` … `08-signed-out.png`).
- `tests/e2e/out/security.json`.

`portal_journeys.py` also checks the browser never calls `:8095`/`/api/agui`, never sends an `Authorization` header, and produces no console errors.

### Node acceptance and accessibility harness

Dependencies are npm-only and live in this directory (`package.json`, pinned to the Playwright version the repo already uses); the shipped island package is untouched.

```bash
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install --prefix tests/e2e --no-audit --no-fund
node tests/e2e/agui_stub.cjs &                    # deterministic AG-UI upstream on 127.0.0.1:8096
npm --prefix tests/e2e run missing-info           # Missing Information card, five widths + negatives
npm --prefix tests/e2e run thread                 # assistant thread lifecycle + the foreign-thread control
npm --prefix tests/e2e run consent                # browser consent-timestamp regression
npm --prefix tests/e2e run list                   # rendered conversation list (LABEL=before|after)
npm --prefix tests/e2e run a11y                   # axe-core WCAG 2.2 AA audit over the route matrix
npm --prefix tests/e2e run contrast               # recomputed contrast for axe's undetermined nodes
npm --prefix tests/e2e run keyboard               # Tab walk + accessibility-tree review (§11 evidence)
node tests/e2e/write_guard_proof.cjs              # proves the guard blocks writes; needs a seeded site
```

Each writes its evidence under `docs/borrower-frontend/acceptance/<date>/` and exits non-zero on a failure. `BASE`, `BORROWER_EMAIL`, `BORROWER_PASSWORD`, `APPLICATION`, `SUBMITTED_APPLICATION`, `DECISION_APPLICATION`, `WIDTHS` and `OUT` override the defaults — and **pass the application ids your own fixture owns**. Three routes address one application by name; pointed at another borrower's id the page answers 404 for ownership, correctly, and the run then reports console errors that belong to the harness rather than the portal. `borrower_views.cjs` skips an application route when no id is supplied and prints which ones. The stub replaces only the agent upstream: the browser still signs in through Frappe and the runtime still mints a real assertion, so the auth boundary stays on the path under test.

Every harness above attaches `write_guard.cjs` before its first navigation, so a run that asks Frappe to change something it did not declare fails instead of quietly editing the site. Two rules it encodes are easy to get wrong and are worth stating here:

- **A POST is not a write.** Frappe's calling convention posts every whitelisted method, so `get_profile` and `list_applications` arrive as POSTs. The guard carries the posted reads by name, each checked against the server code for a write; treating them as writes would break the page and then report the wreck as a clean run.
- **A validation state must really be invalid.** The name field in the wizard carries `maxlength=140`, so asking for "a name longer than the limit" produces a *valid* form and Continue submits the step. Ask for the blank case instead, and let the guard be the backstop.
- **A run that holds a conversation leaves a transcript behind.** `record_turn` is a legitimate declared write, but the `Advisory Conversation` it creates is borrower-visible and outlives the fixture unless `e2e_seed.teardown` removes it — which it now does, along with the fixture's `Customer` rows. Finish every journey run with a teardown and check `conversationsRemoved`.

## Seed and teardown

```bash
# container
bench --site loanportal.local execute loan_advisory_portal.tests.e2e_seed.seed --kwargs '{"tag": "e2e1"}'
docker cp loanrangers-backend-1:/tmp/loanportal-e2e/e2e1.json <temp>/e2e1.json
docker exec loanrangers-backend-1 rm -f /tmp/loanportal-e2e/e2e1.json

# host
python tests/e2e/seed_evidence.py --seed <temp>/e2e1.json --trace-dir <temp>/traces

# when finished
bench --site loanportal.local execute loan_advisory_portal.tests.e2e_seed.teardown --kwargs '{"tag": "e2e1"}'
```

The seed JSON contains passwords and API secrets. Keep it outside the repository and delete it after the run. The fixtures refuse to run on a site without `allow_tests`.

Service accounts: `evidence` holds only `Evidence Service` — no DocType grants, so it can only call the trusted ingestion method; `reader` holds `Agent Integration` + `Loan Reporter` (read-only). After re-seeding, rewrite `FRAPPE_API_KEY`/`FRAPPE_API_SECRET` (reader) and `EVIDENCE_FRAPPE_API_KEY`/`EVIDENCE_FRAPPE_API_SECRET` (evidence) in the agent env and restart the agent — a running agent keeps the deleted credentials and answers without evidence.

## Teardown of the harness itself

```bash
docker rm -f loanportal-e2e-proxy          # or let a Docker restart remove it (--rm)
docker rm -f loanportal-acceptance-proxy   # the acceptance front door is created WITHOUT --rm,
                                           # so it survives `docker stop` until removed explicitly
# stop the runtime and agent processes started for the run
rm -rf <temp>/loanportal-e2e               # seed credentials, env file, traces
```

`e2e_seed.teardown` removes seeded users, customers, applications, evidence, files and invitation data. It does not remove the application the *journeys* create (create → upload → submit → withdraw); that one is left in the disposable site on purpose so the run can be inspected.
