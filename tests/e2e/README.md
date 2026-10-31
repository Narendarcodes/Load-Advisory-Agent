# Browser and HTTP harness (disposable site)

Phase 9's end-to-end evidence. Everything here runs against `loanportal.local` only; nothing points at `p1loan.local` and no shared configuration is edited.

| File | Role |
| --- | --- |
| `nginx.loanportal.conf` | throw-away front door on `127.0.0.1:8081`; pins `Host`/`X-Frappe-Site-Name` to `loanportal.local`, proxies `/api/copilotkit` to the local runtime |
| `portal_journeys.py` | Playwright (Edge) journeys: session, dashboard, decision card, private download, assistant, wizard, profile, boundary checks |
| `portal_security.py` | HTTP regressions: guests, ownership/IDOR, CSRF, conversation ownership, assertion replay/tamper, body override, voice bridge, CORS, logout |
| `seed_evidence.py` | records one authentic decision for the seeded application (real policy pipeline) |
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
# stop the runtime and agent processes started for the run
rm -rf <temp>/loanportal-e2e               # seed credentials, env file, traces
```

`e2e_seed.teardown` removes seeded users, customers, applications, evidence, files and invitation data. It does not remove the application the *journeys* create (create → upload → submit → withdraw); that one is left in the disposable site on purpose so the run can be inspected.
