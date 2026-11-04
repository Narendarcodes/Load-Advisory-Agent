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

Three manifests, chosen by what you are going to run. The first two do not pull torch;
`requirements-rag.txt` (policy search with citations) does.

```bash
python -m venv .venv
# Windows
.venv\Scripts\python -m pip install --upgrade pip
.venv\Scripts\python -m pip install -r requirements.txt -r requirements-test.txt
# Linux / macOS
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt -r requirements-test.txt
# Policy search (agent answers with citations): torch, transformers, sentence-transformers, qdrant-client
.venv\Scripts\python -m pip install -r requirements-rag.txt      # Windows
.venv/bin/pip install -r requirements-rag.txt                     # Linux / macOS
```

The comment in `requirements-rag.txt` that says "GPU container only" is out of date: on a laptop pip installs the
CPU torch wheel and the agent runs retrieval on CPU with `AGENT_RETRIEVER_DEVICE=cpu` (verified on Windows 11,
2026-11-04). The embedding model, EmbeddingGemma-2 (`google/embeddinggemma-2`), is gated on Hugging Face: run
`huggingface-cli login` and accept the model licence once before the first run. The built policy index is not in
git; how to build it and where the agent expects it: README, "Run it locally", step 6.

`requirements-rag.txt` does not list `torchvision`, but transformers 5.19 needs it to load the EmbeddingGemma-2
processor: without it the agent dies at start with `Could not import module 'EmbeddingGemma2Processor'` (root cause
`No module named 'torchvision'`). Install it next to the torch you have, for example
`.venv\Scripts\python -m pip install torchvision "torch==2.15.0"` (CPU wheels; verified 2026-11-04). The GPU image has it
in its base, which is why the gap was not seen there.

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

### OCR-enabled backend image

Tesseract is a native dependency and must be present in the Linux image that runs Frappe. Build the
OCR layer after `loanrangers-frappe:16` exists:

```powershell
docker build --platform linux/amd64 -t loanrangers-frappe:16-ocr `
  -f infra/frappe/Dockerfile.ocr apps/loan_advisory_portal
```

The OCR image includes Tesseract, the English language data, and the Portal package/dependencies so
the backend and frontend containers can both import the app and serve its static assets. For the
existing `loanhx` deployment, keep using its existing Compose file, environment file, and named
volumes; apply `infra/frappe/loanrangers.ocr.yml` as an image-only override:

```powershell
docker compose -p loanhx `
  --env-file D:\path\to\infra\frappe\.env `
  -f D:\path\to\infra\frappe\loanrangers.droplet.yml `
  -f infra/frappe/loanrangers.ocr.yml up -d
```

This rebuilds/recreates the Frappe services with `/usr/bin/tesseract` and `eng` language data while
leaving the database and named volumes unchanged.

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
# (Windows: run this through Git Bash explicitly, "C:\Program Files\Git\bin\bash.exe" -lc "...";
#  the bash on PATH is often WSL's, which has no docker CLI)
FRAPPE_SITE=loanportal.local FRAPPE_BACKEND=loanrangers-backend-1 \
  bash infra/frappe/bootstrap/install_portal_app.sh

# the script copies the app into the backend container only; restart the background workers
# so they import the same code (or docker cp the app into them as well)
docker restart loanrangers-queue-short-1 loanrangers-queue-long-1 loanrangers-scheduler-1

# site configuration the app expects, written straight into site_config.json so the secret never
# appears on a bench command line (and so never in logs/bench.log). AGENT_ASSERTION_SECRET must be
# exported in your shell first; `-e NAME` passes it by name, not on the command line.
docker exec -e AGENT_ASSERTION_SECRET loanrangers-backend-1 python3 -c "import json,os; \
p='/home/frappe/frappe-bench/sites/loanportal.local/site_config.json'; c=json.load(open(p)); \
c.update(allow_tests=1, allow_demo_users=1, agent_assertion_secret=os.environ['AGENT_ASSERTION_SECRET']); \
json.dump(c, open(p, 'w'), indent=1)"
```

Container names depend on your compose project; check them with `docker ps`. Document-upload OCR needs the
`loanrangers-frappe:16-ocr` image (`infra/frappe/Dockerfile.ocr`, `infra/frappe/loanrangers.ocr.yml`); the base
image has neither Tesseract nor PaddleOCR. The seeded synthetic applicants do not need OCR.

**Anything passed on a `bench` command line is also written to `logs/bench.log`.** The wrapper logs the
full argv, so the database root password, the admin password and the assertion secret all appear there
in plaintext. Treat that log as sensitive: do not paste, attach or commit it, and on a host you do not
own exclusively set `agent_assertion_secret` by editing `site_config.json` instead (the command above does). The property the
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

## Gaps found on the fresh laptop run (2026-11-04)

A second end-to-end run from `main` @ 658ce44 on a Windows 11 laptop (new site, fresh seed, full A5 suite) needed
these steps on top of the ones above:

1. **torchvision** is missing from `requirements-rag.txt`; install it with torch (section 1). Blocking for RAG.
2. **Start the KYC / account-aggregator mock as `ops.synthetic_kyc_bank.zen_points`**, not `ops.synthetic_kyc_bank.app`
   (`ops/README` lists only `app.py`): `python -m ops.synthetic_kyc_bank.zen_points --port 8012`. With `app` the decision
   runner's `POST /v1/zen/data-points` gets 404, it flags `KYC_AA_HTTP_404`, and every application ends
   MORE_INFORMATION_REQUIRED or DECLINE. Applications decided that way must be reset to SUBMITTED and re-decided.
3. **Frappe's hourly user-creation limit.** Seeding creates 200 users; right after it, `setup_demo.create_demo_officer`
   fails with `ValidationError: Throttled`. Wait for the hour to pass, or create the officer from a bench-side script with
   `frappe.flags.in_import = True` (set any demo flag in-process only, not in `site_config.json`), and write the officer
   password straight to an owner-only file rather than printing it.
4. **Requests above the ₹25 lakh cap are refused at create time** on `main`, so the seeder reports `refused: 16`
   (184 applications for 200 applicants). SYN-APP-0087 has no application on a fresh seed; the counter-offer demo uses
   SYN-APP-0098 ([DEMO_GUIDE](../DEMO_GUIDE.md) updated).
5. **Mark the ERPNext setup wizard complete on a new site.** `bench new-site ... --install-app erpnext` never completes the
   wizard, so every desk page for the Loan Officer redirects to `/desk/setup-wizard` and shows "Not permitted". Either run
   the wizard once as Administrator, or from a bench-side script set `is_setup_complete=1` on the `Installed Application`
   rows and `System Settings.setup_complete=1`, then clear the cache (`frappe.is_setup_complete()` should return True).
6. **The decision runner retries failing applications forever.** Four applications hit `evidence.ingest` HTTP 417
   `ValidationError` on every poll (the bureau-unavailable → ERROR case, D-11). Harmless for the demo, but there is no
   give-up or backoff; expect the same log lines every poll.
7. **Redis on 6380 may not be reachable.** `.env.example` sets `ASSERTION_REPLAY_REDIS_URL=redis://127.0.0.1:6380/0`, but
   the Frappe compose stack does not necessarily publish that port. For a single-worker local run use
   `ASSERTION_REPLAY_BACKEND=memory` and `AGENT_CHECKPOINT_BACKEND=memory`; use Redis for anything with more than one worker.

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
