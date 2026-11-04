# Clean-clone evidence

Machine-readable proof for [../clean-clone-audit.md](../clean-clone-audit.md) and
[../final-reproducibility-report.md](../final-reproducibility-report.md).

Everything here was produced by **one run** against a repository cloned from GitHub into a new directory,
with a new virtualenv and new npm installs. Nothing here was copied from the developer worktree.

| Fact | Value |
| --- | --- |
| Clone URL | `https://github.com/Narendarcodes/Load-Advisory-Agent.git` |
| Branch / HEAD cloned | `main` / `76ae289edcbc0ab0c03a1a73c8d2836909380600` |
| Clone location | `Documents/Projects/reproducibility-audit/frappe-clean-clone` |
| Virtualenv | `.venv-repro` created inside the clone, from `requirements.txt` + `requirements-test.txt` |
| Host | Windows 11 (10.0.26200), x64, Docker Desktop, Python 3.14, Node 24.18.0 |
| Date | 2026-11-02, run window 10:07–10:09 local |

## Files

| File | SHA-256 | What it is |
| --- | --- | --- |
| `clean-clone-journeys.json` | `a678ab3edd8344150d851270211b7f242cca5bcff4f274dc65e22a7342bc16f4` | 36 browser assertions, all `"ok": true`, zero false |
| `clean-clone-security.json` | `d7a438e7e324f8661753f6079fd1947e559ba90ad21a552e0578865ba961ceb7` | 39 HTTP security regressions, all `"ok": true`, zero false |
| `01-dashboard.png` | `56dd2eedeece7bc4faeb96e6c47e3305eaa2e3c14d5b8ecc9def7999c653adcf` | Signed-in borrower dashboard, seeded synthetic applications |
| `02-application.png` | `5a5ee2e1a10868992f131f86ada9c3b1aa7cc4f18f82c118046c1d927035f961` | Application detail with recorded decision and reasons |
| `03-assistant-explain.png` | `33a8f78874e4ad05590d1fed1dbd3954c27dced4100254b56b103d4d23f4fbff` | Assistant explaining the recorded rejection |
| `04-assistant-what-if.png` | `ec3244eab0d01c6492ead59e1671ddc89db46a845de4889af0c87de9ec9fc8b2` | What-if simulation answer (in-memory ZEN, never persisted) |
| `05-assistant-guarantee.png` | `23143b62bd4f3983da0ae6f81171bc84accde0bd5c0c036bc8eb5f24b5e754f9` | Guarantee-language request refused by the guard |
| `06-wizard-review.png` | `1ae4a8c6a744181f13217c5cd7afc53efcf11a1d147ebba832dadf08d049e13f` | New-application review step, consent boxes unticked |
| `07-submitted.png` | `c3ed961b63119d9cdbf063f2a97e86f85e29b7297906992aa14b902f0236588f` | Post-submission documents workspace for the new application |
| `08-signed-out.png` | `87bedbeff4b59f9795539b753727c4dd19323fefdd0308f0b2fbf4d5dbda2ae0` | The same URL after sign-out, redirected to login |
| `09-mobile-dashboard.png` | `eaa1cbf33e270716cab311352cc701243ba6c8e4d32db0f643c3ab7da4a74720` | Dashboard at 390 px, no horizontal overflow |

The PNGs are the harness's own screenshots, written by the same command that wrote
`clean-clone-journeys.json`. They show **synthetic** applicants only.

## Commands that produced this

All paths relative to the clone root. This is the same procedure as
[../../development/setup.md](../../development/setup.md), with the audit's own names substituted: site
`repro.local`, front door `:8082`, agent `:8097`, runtime `:4201`.

**Where this ran, stated exactly.** The audit first tried a genuinely separate compose project
(`-p reprostack`); that container bound the developer stack's `frappe_docker_sites` volume, because
`loanrangers.yml` pins volume names that do not carry the project prefix. It was stopped and removed with
the live stack verified intact, and `infra/frappe/loanrangers.isolated.yml` is the repository fix for that
trap — validated with `docker compose config` (isolated volume names, no published front-end port), **not**
by a full second-stack run. The commands below therefore ran `repro.local` on the already-up Frappe
container, which is why the audit used a distinct site name and a distinct front door instead of a distinct
stack, and why it touched no data belonging to `p1loan.local` or `loanportal.local`.

```bash
# Python
python -m venv .venv-repro
.venv-repro/Scripts/pip install -r requirements.txt -r requirements-test.txt
.venv-repro/Scripts/ruff check .                    # All checks passed!
.venv-repro/Scripts/python -m pytest tests/ -q      # 685 passed, 15 skipped in 109 s

# Node (three manifests, three lockfiles)
( cd apps/runtime && npm ci && npm run build && npm test )
( cd apps/web/assistant && npm ci && npm run build && npm test )
npm ci --prefix tests/e2e --no-audit --no-fund

# The volume-name trap, checked before any second stack was attempted
docker compose -f infra/frappe/loanrangers.yml -f infra/frappe/loanrangers.isolated.yml config

# Site, portal app from the clone, migrations
FRAPPE_SITE=repro.local FRAPPE_BACKEND=loanrangers-backend-1 \
  bash infra/frappe/bootstrap/create_site.sh              # also runs install_portal_app.sh
docker exec loanrangers-backend-1 bash -lc 'cd /home/frappe/frappe-bench &&
  bench --site repro.local set-config allow_tests true'

# Synthetic data: two borrower accounts, then one authentic recorded decision
docker exec loanrangers-backend-1 bash -lc 'cd /home/frappe/frappe-bench &&
  bench --site repro.local execute loan_advisory_portal.tests.e2e_seed.seed --kwargs "{\"tag\":\"repro1\"}"'
docker cp loanrangers-backend-1:/tmp/loanportal-e2e/repro1.json <temp dir outside the repo>
.venv-repro/Scripts/python tests/e2e/seed_evidence.py --seed <temp>/repro1.json --trace-dir <temp>/traces

# The audit's own front door: pins the Host and X-Frappe-Site-Name to repro.local
docker run -d --name repro-acceptance-proxy --network frappe_docker_default \
  -p 127.0.0.1:8082:8080 --add-host host.docker.internal:host-gateway \
  -v <temp>/nginx.repro.conf:/etc/nginx/conf.d/default.conf:ro nginx:alpine

# Agent and runtime, launched from the clone's own venv and build output
# (As run on 2026-11-02. --bureau-url was removed on 2026-11-03 with the agent's bureau
# execution route, so the current command is the same line without that flag.)
.venv-repro/Scripts/python -m loan_advisory.agent.server \
  --host 127.0.0.1 --port 8097 --no-rag --bureau-url http://127.0.0.1:8011
node apps/runtime/dist/index.js                        # AGENT_RUNTIME_PORT=4201

# The two evidence files and the screenshots
.venv-repro/Scripts/python tests/e2e/portal_journeys.py \
  --seed <temp>/repro1.json --base http://127.0.0.1:8082 --out <run>/out/journeys
.venv-repro/Scripts/python tests/e2e/portal_security.py \
  --seed <temp>/repro1.json --base http://127.0.0.1:8082 \
  --agent http://127.0.0.1:8097 --runtime http://127.0.0.1:4201 --out <run>/out/security.json
```

`create_site.sh` is the repository script; `nginx.repro.conf` and the two one-line launchers were written
outside the repository because they embed the audit machine's paths and the seed credentials. The
`repro.local` site is an audit artefact and is listed in
[../final-reproducibility-report.md](../final-reproducibility-report.md) as such.

The agent ran **live**, not with `--offline`: `FRAPPE_URL` and the `reader` service credentials came from
the isolated site's own config, so every evidence read and every assertion mint in these results came
from the freshly built site, and the LLM was the configured remote provider. `--no-rag` is the one
deviation, because the policy index is not in the repository — see
[../known-limitations.md](../known-limitations.md).

Two small launcher scripts (`run_repro_agent.py`, `start_repro_runtime.js`) sat outside the repository
only because they read the seed credential file from the environment; they are equivalent to the two
commands above with the variables exported.

## Service health checks at the time of the run

| Check | Result |
| --- | --- |
| `GET http://127.0.0.1:8082/api/method/ping` | 200 |
| `GET http://127.0.0.1:8082/login` | 200, title "Sign in · Loan Advisory" |
| `GET http://127.0.0.1:8097/healthz` | 200 |
| `GET http://127.0.0.1:4201/api/copilotkit/info` | 200 direct and through :8082 |
| `bench --site repro.local list-apps` | `frappe 16.51.0`, `erpnext 16.50.0`, `lending 16.6.1`, `loan_advisory_portal 0.1.0` |
| `docker ps` during the run | the `loanrangers-*` services healthy, plus `repro-acceptance-proxy`; no second stack, no new volumes |

## Deliberately not published

- **The agent and runtime console logs.** They contain the audit machine's absolute paths and account
  name. Their content is summarised in [../clean-clone-audit.md](../clean-clone-audit.md); no secret
  appears in them.
- **The seed credential file** (`--seed`), any site config, and `common_site_config.json`. Passwords and
  HMAC keys stay out of Git, including for throwaway synthetic accounts.
- **`99-failure.png`** from the working directory. It is 36 seconds older than this run: the harness
  leaves a failure screenshot behind, and the attempt that produced it had already been root-caused and
  fixed (harness selector drift, recorded as items 4–15 in the audit). Publishing it alongside a 36/36
  result would show a picture that contradicts the JSON.
- **Any database dump.** Schema and synthetic rows are recreated by migrations and the seed scripts, not
  copied; see [../database-reproducibility.md](../database-reproducibility.md).

## Reproducing this yourself

Follow [../../development/setup.md](../../development/setup.md) end to end, then run the last two
commands above. The only external prerequisites are Docker Desktop (or Docker Engine) and the
`loanrangers-frappe:16` image, which is built from the frappe_docker checkout that setup.md pins.
