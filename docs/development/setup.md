# Setup

The procedure below was executed end to end on 2026-11-02 from a clean clone of `main` and is written
from the commands that worked, including the ones that failed first. Every version in this table was
read from the machine during that run.

## Supported baseline

| Requirement | Version used in the verified run | Notes |
| --- | --- | --- |
| Operating system | Windows 11 + Docker Desktop (Linux containers, `linux/amd64`) | The stack is Linux-only inside Docker. The host tooling is Python and Node and is the same on Linux/macOS, but **only Windows + Docker Desktop was executed here**; treat Linux/macOS as expected-not-verified |
| Python (host, for the agent and tests) | 3.14.4 | `pyproject.toml`/CI also target 3.14 |
| Node / npm | 24.15.0 / 11.9.0 | npm only; there is no pnpm or yarn configuration in this repo |
| Docker | Docker Desktop, Linux engine | Compose v2 (`docker compose`, not `docker-compose`) |
| Frappe framework | 16.51.0 | inside the bench image, `bench --version`-confirmed |
| Frappe bench | 5.31.0 | in the same image |
| ERPNext | 16.50.0 | |
| Frappe Lending | 16.6.1 | |
| Database | `mariadb:11.8` | pinned in the compose file |
| Redis | `redis:8.6-alpine` | two instances: cache and queue |
| GPU | optional | only for policy RAG; see "Optional: policy retrieval" |

The container image is `loanrangers-frappe:16`: frappe + erpnext + lending, and **deliberately not**
`loan_advisory_portal` (see step 4).

## 0. Clone

```bash
git clone https://github.com/Narendarcodes/Load-Advisory-Agent.git
cd Load-Advisory-Agent
git checkout main
```

Enable the repository's hooks. They are not optional in practice: they run the whitespace check,
`ruff` on staged blobs, and the whole pytest suite before every commit.

```bash
git config core.hooksPath .githooks
```

## 1. Python dependencies

Two manifests, chosen by what you are going to run. Neither pulls torch.

```bash
python -m venv .venv
# Windows
.venv\Scripts\python -m pip install --upgrade pip
.venv\Scripts\python -m pip install -r requirements.txt -r requirements-test.txt
# Linux / macOS
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt -r requirements-test.txt
```

`requirements.txt` is the application set (agent, FastAPI surface, ZEN, LangGraph, AG-UI,
OpenTelemetry). `requirements-test.txt` is what the test suite additionally imports; without it
`pytest` fails to collect three modules, which is the mistake this file exists to prevent.

Verify:

```bash
.venv\Scripts\python -m ruff check .          # -> All checks passed!
.venv\Scripts\python -m pytest -q             # -> 685 passed, 15 skipped
```

The 15 skips are deliberate: live-Frappe, live-Langfuse, live-model and POSIX-permission tests that
need services or an OS this run does not have. They are not hidden failures.

## 2. Node dependencies and builds

Three Node projects, each with its own committed `package.json` + `package-lock.json`:

```bash
cd apps/runtime && npm ci && npm run build && npm test && cd ../..
cd apps/web/assistant && npm ci && npm run build && npm test && cd ../..
npm ci --prefix tests/e2e --no-audit --no-fund      # browser harnesses (Playwright)
```

Expected: runtime **13 passed**, island **86 passed**, and the island build writing into the Frappe
app tree (step 4 serves it). The build must define `process.env.NODE_ENV`; `vite.config.ts` does, and
without it the island dies in the browser with `process is not defined`.

## 3. Infrastructure

```bash
docker compose -f infra/frappe/loanrangers.yml up -d --pull missing
docker ps --format '{{.Names}} {{.Status}}' | grep loanrangers
```

`--pull missing` is required, not cosmetic: the base file sets `pull_policy: always`, and
`loanrangers-frappe:16` is a locally built image that no registry has. Without the flag `up` fails on
a pull error even though the image is present.

On a machine that has never built it, build it first (this is the step that needs the internet and
about 20 minutes):

```bash
git clone https://github.com/frappe/frappe_docker.git
cd frappe_docker && git checkout e08b50c          # the pin this project was built against
cp ../Load-Advisory-Agent/infra/frappe/apps.json .
docker build --build-arg=FRAPPE_PATH=https://github.com/frappe/frappe \
  --build-arg=FRAPPE_BRANCH=version-16 \
  --secret=id=apps_json,src=apps.json \
  --tag=loanrangers-frappe:16 --file=images/layered/Containerfile .
```

Windows gotcha that will otherwise cost you an hour: `core.autocrlf` bakes CRLF into
`resources/core/*.sh`, which the Containerfile copies over `/usr/bin/entrypoint.sh`-equivalents. The
containers then restart-loop with `no such file or directory`. Before building, LF-convert those
scripts and set `core.autocrlf false` + `core.eol lf` in that clone.

**Volume hazard, read before starting a second stack.** `loanrangers.yml` pins its volumes to fixed
names (`frappe_docker_db-data`, `frappe_docker_sites`, `frappe_docker_redis-queue-data`) that do not
carry the compose project prefix. `docker compose -f loanrangers.yml -p anything up` therefore mounts
the **running** stack's database and sites, and a second MariaDB starts against the same data
directory. Use the override whenever you want a second stack:

```bash
docker compose -f infra/frappe/loanrangers.yml -f infra/frappe/loanrangers.isolated.yml \
  -p reprostack up -d db redis-cache redis-queue configurator backend --pull missing
```

## 4. Site creation, portal installation, assets

The portal app cannot be fetched by `bench get-app`: bench 5.31 has no `--subdirectory` option and the
app lives in this repository's `apps/loan_advisory_portal/` subdirectory. `install_portal_app.sh`
copies it from your checkout and runs `bench install-app` + `migrate` + the `public/` assets symlink.

```bash
# inside the backend container's bench; create the disposable site
docker exec loanrangers-backend-1 bash -lc \
  'cd /home/frappe/frappe-bench && bench new-site loanportal.local \
   --mariadb-user-host-login-scope=% --db-root-password <root> --admin-password <admin> \
   --install-app erpnext && bench --site loanportal.local install-app lending'

# then the portal, from your checkout
FRAPPE_SITE=loanportal.local FRAPPE_BACKEND=loanrangers-backend-1 \
  ./infra/frappe/bootstrap/install_portal_app.sh

# site configuration the app expects
docker exec loanrangers-backend-1 bash -lc "cd /home/frappe/frappe-bench && \
  bench --site loanportal.local set-config allow_tests true && \
  bench --site loanportal.local set-config agent_assertion_secret <32+ random chars>"
```

**Anything passed on a `bench` command line is also written to `logs/bench.log`.** The wrapper logs the
full argv, so the database root password, the admin password and the assertion secret all appear there
in plaintext. Treat that log as sensitive: do not paste, attach or commit it, and on a host you do not
own exclusively set `agent_assertion_secret` by editing `site_config.json` instead. The property the
browser suites rely on is unaffected — the secret still never enters the repository.

You do **not** need LiveKit credentials to run the portal or its test suite. The voice tests configure a
deterministic in-process trio themselves and restore the site afterwards
(`apps/loan_advisory_portal/loan_advisory_portal/tests/utils.py`), so
`bench --site <site> run-tests --app loan_advisory_portal` passes 193 on a site that has only ever seen
the commands in this file. Voice stays disabled for real borrowers until `livekit_url`, `livekit_api_key`
and `livekit_api_secret` are set, and the portal says so rather than pretending otherwise.

`install_portal_app.sh` is idempotent: it re-copies, refreshes the symlink, skips an already installed
app and always migrates. Re-run it after every `docker cp`-level change, and after any container
recreation — `docker cp` content does not survive a new container, and the `sites` volume does not
carry `apps/`.

Expected at the end:

```
frappe 16.51.0 · erpnext 16.50.0 · lending 16.6.1 · loan_advisory_portal 0.1.0
```

## 5. Synthetic data

Two levels, both synthetic. Nothing here contains real identity, bureau or bank data.

```bash
# underwriting catalogue + demo borrowers (the droplet path)
FRAPPE_SITE=loanportal.local ./infra/frappe/bootstrap/seed.sh

# the two-account browser fixture set the harnesses expect, and its teardown
docker exec loanrangers-backend-1 bash -lc \
  'cd /home/frappe/frappe-bench && bench --site loanportal.local execute \
   loan_advisory_portal.tests.e2e_seed.seed --kwargs "{\"tag\": \"e2e1\"}"'
docker cp loanrangers-backend-1:/tmp/loanportal-e2e/e2e1.json <a temp dir outside the repo>
docker exec loanrangers-backend-1 rm -f /tmp/loanportal-e2e/e2e1.json
```

The seed JSON holds passwords and API secrets. Keep it out of the repository and delete it when done.
`e2e_seed.teardown --kwargs '{"tag":"e2e1"}'` removes users, customers, applications, files, evidence
and conversations for that tag. Both seed scripts refuse to run on a site without `allow_tests`.

Then record one authentic decision so the decision page has real content:

```bash
FRAPPE_URL=http://127.0.0.1:8081 FRAPPE_LOAN_COMPANY="LAP Test NBFC" FRAPPE_LOAN_PRODUCT="LAP-TEST-001" \
  python tests/e2e/seed_evidence.py --seed <temp>/e2e1.json --trace-dir <temp>/traces
```

Expected: `{"state": "REJECTED", "decision": "REJECTED", ...}`. The company and product must match the
seed, which uses `LAP Test NBFC` / `LAP-TEST-001`; the adapter's built-in defaults are different
names, so omitting them reads zero applications.

## 6. Run it

Four processes. The full walkthrough, ports and shutdown are in
[local-development.md](local-development.md); the short version:

```bash
# 1. Frappe dev server (also the only thing that serves /assets for this site)
docker exec loanrangers-backend-1 bash -lc 'cd /home/frappe/frappe-bench/sites && \
  nohup /home/frappe/frappe-bench/env/bin/python -m frappe.utils.bench_helper frappe \
  --site loanportal.local serve --port 8001 > /tmp/loanportal-serve.log 2>&1 &'

# 2. front door that pins every request to loanportal.local
docker run -d --name loanportal-acceptance-proxy --network frappe_docker_default \
  -p 127.0.0.1:8081:8080 --add-host host.docker.internal:host-gateway \
  -v "$PWD/tests/e2e/nginx.loanportal.conf:/etc/nginx/conf.d/default.conf:ro" nginx:alpine

# 3. advisory agent
.venv\Scripts\python -m loan_advisory.agent.server --port 8095 --no-rag --bureau-url http://127.0.0.1:8011

# 4. CopilotKit runtime
cd apps/runtime && AGENT_RUNTIME_PORT=4200 AGENT_AGUI_URL=http://127.0.0.1:8095/api/agui \
  FRAPPE_BASE_URL=http://127.0.0.1:8081 AGENT_WEB_ORIGINS=http://127.0.0.1:8081 node dist/index.js
```

Then open `http://127.0.0.1:8081/borrower`.

Point the agent and the runtime at **8081**, never at `:8080`. The permanent frontend hard-pins
`X-Frappe-Site-Name: p1loan.local`, so `:8080` is a different site: agent reads would come from the
wrong database and the borrower portal would never appear.

## Optional: policy retrieval

`--no-rag` is the default advice because the retriever loads sentence-transformers and torch. Without
it, policy questions abstain and **the assistant produces no citations** — citations come only from
retrieval. To enable it you need `requirements-rag.txt`, an embedding model plus reranker in the
local cache, and an index directory. `LOAN_POLICY_DIR` has no value in the repository; it defaults to
a path on the original author's machine, so a clean machine must build or point at an index
explicitly. See [environment-variables.md](environment-variables.md).

## External services, honestly

| Needs a key | Without it |
| --- | --- |
| `GROQ_API_KEY` (or another OpenAI-compatible endpoint) | the assistant answers nothing; every turn fails to compose |
| `LOAN_POLICY_DIR` + index + GPU or CPU time for the models | no policy citations; policy questions abstain |
| LiveKit server + credentials | voice is unavailable; the control stays disabled |
| Langfuse keys | no tracing; nothing else is affected |

There is no credit bureau, KYC provider, payment gateway, government identity system or SMTP server to
configure. Those are not missing configuration; they do not exist in this product.
