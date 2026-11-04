# Dependency matrix

Produced by the 2026-11-02 clean-clone audit. "Verified" means the version below was installed and
exercised on that run, not copied from a lockfile someone hoped was right.

## Components

| Component | Language / runtime | Version used | Manifest | Install command | Verification that ran |
| --- | --- | --- | --- | --- | --- |
| Frappe Framework | Python (container) | 16.51.0 | `infra/frappe/apps.json` + image build args | `docker build … --file=images/layered/Containerfile` from frappe_docker `e08b50c` | `bench --site <site> list-apps` |
| Frappe bench | Python (container) | 5.31.0 | baked into the image | image build | `bench --version` |
| ERPNext | Python (container) | 16.50.0 | `infra/frappe/apps.json` (`version-16`) | `bench new-site --install-app erpnext` | site creation completed |
| Frappe Lending | Python (container) | 16.6.1 | `infra/frappe/apps.json` (`version-16`) | `bench --site <site> install-app lending` | `list-apps` |
| `loan_advisory_portal` (this app) | Python (container) | 0.1.0 | `apps/loan_advisory_portal/pyproject.toml` (flit; Pillow, pypdfium2; frappe `>=16,<17`) | `infra/frappe/bootstrap/install_portal_app.sh` | `bench install-app` + `migrate` + `list-apps` + **193 tests OK** |
| Tesseract OCR (optional native engine) | Windows / native executable | `5.4.0.20240606` (verified locally) | `TESSERACT_CMD`, `OCR_LANG` | Install separately; set `TESSERACT_CMD` in the Frappe process environment | Version probe plus scanned synthetic salary-slip and PAN PDFs read; no temporary OCR files |
| Assistant island | TypeScript / React 19 | `react 19.2.0`, `@copilotkit/react-core 1.83.0`, `vite ^8.3.5`, `typescript ^5.9.0` | `apps/web/assistant/package.json` + lockfile | `npm ci && npm run build` | `tsc --noEmit` clean, **86 tests passed**, build byte-identical to the committed bundle |
| CopilotKit runtime | TypeScript / Node | `@copilotkit/runtime 1.83.0`, `typescript ^5.9.0` | `apps/runtime/package.json` + lockfile | `npm ci && npm run build` | `tsc` (app + test configs) clean, **13 tests passed**, `/api/copilotkit/info` 200 |
| Browser harnesses | JavaScript / Playwright | `playwright 1.63.0`, `@axe-core/playwright 4.14.0` | `tests/e2e/package.json` + lockfile | `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install --prefix tests/e2e` | journeys **36/36**, security **39/39**, axe **103 runs / 0 violations** |
| Agent + API (host) | Python 3.14.4 | see "Python distributions" | `requirements.txt` | `pip install -r requirements.txt` | `ruff check .` clean, **685 passed / 15 skipped** |
| Test and harness (host) | Python 3.14.4 | see below | `requirements-test.txt` | `pip install -r requirements-test.txt` | same suite, collection errors gone |
| RAG and models (optional) | Python 3.14.4 | `sentence-transformers 6.2.x`, `transformers 5.19.0`, torch cu126 | `requirements-rag.txt` | `pip install -r requirements-rag.txt` | **not installed on the clean run**; retrieval was not re-verified from the clone (see limits) |
| Data tooling (optional) | Python | pandas, pyarrow, xlrd, kaggle | `requirements-data.txt` | `pip install -r requirements-data.txt` | corpus building only; not needed to run the app |
| MariaDB | container | `mariadb:11.8` | `infra/frappe/loanrangers.yml` | `docker compose up -d db` | healthcheck green; site DB created by `bench new-site` |
| Redis | container | `redis:8.6-alpine` (cache + queue) | same | `docker compose up -d redis-cache redis-queue` | Frappe cache/queue working (sites created, jobs enqueued) |
| Nginx (front door) | container | `nginx:alpine` **floating** | `tests/e2e/nginx.loanportal.conf` mount | `docker run … nginx:alpine` | `/login` 200, assets 200; see "unpinned" below |
| Permanent frontend proxy | container | `frappe/beginning-nginx` via the compose `frontend` service | `infra/frappe/loanrangers.yml` | `docker compose up -d frontend` | port 8080 serving the shared site |
| Langfuse (optional) | containers | server `4.70.0` | `infra/langfuse/docker-compose.yml` | `docker compose -f infra/langfuse/docker-compose.yml up -d` | `/api/public/health` 200; **agent spans do not land** |
| ZEN decision engine | Python | `zen-engine==2.1.2` (imported as `zen`) | `requirements.txt` | part of the core install | decision recorded on the clone site: `REJECTED`, evidence row written |
| Synthetic bureau | Python (host) | in-repo, no external service | `apps/bureau/src/synthetic_bureau` | none | `/healthz` 200 on `:8011` |
| LLM provider | external API | `openai/gpt-oss-120b` via Groq | none (key in env) | export `GROQ_API_KEY`, `LLM_PROVIDER=groq`, `LLM_MODEL`, `LLM_REASONING_EFFORT=` | live answers on both the primary and clone stacks |

## Python distributions, as actually resolved

Core (`requirements.txt`): `fastapi 0.162.0`, `starlette 1.10.0`, `pydantic 2.14.2`,
`langgraph 1.2.19`, `langgraph-checkpoint 4.3.1`, `langgraph-prebuilt 1.1.1`, `langgraph-sdk 0.4.11`,
`langfuse 5.0.4` (pinned), `ag-ui-protocol 1.0.0` (pinned), `zen-engine 2.1.2` (pinned),
`uvicorn 0.54.0`, `httpx 0.28.1`, `aiohttp 3.14.5`, `requests 2.34.2`, `redis 8.1.0`,
`opentelemetry-sdk 1.45.2`, `opentelemetry-exporter-otlp-proto-http 1.45.2`, `pytest 9.2.0`,
`ruff 0.17.3`.

Test manifest (`requirements-test.txt`): `beautifulsoup4`, `pyyaml`, `rank-bm25`, `qdrant-client`,
`Pillow`, `pypdfium2`, `pymupdf`, `pypdf`, `playwright`, `urllib3`.

## Mandatory, optional, dev-only

**Mandatory for the borrower portal:** Frappe, ERPNext, Frappe Lending, `loan_advisory_portal`,
MariaDB, Redis, the built island assets, the CopilotKit runtime, the agent process.

**Mandatory for one behaviour, not for the app:** an LLM provider (`GROQ_API_KEY` or an
`LLM_BASE` endpoint) is required for assistant answers. Everything else in the portal — apply,
documents, tracking, decision display, profile — works without it.

Tesseract is required only for automatic OCR. Without its executable or requested language data,
the document upload and person-review paths remain available and an OCR request reports that
automatic reading is unavailable.

**Optional:** policy RAG (`requirements-rag.txt` + `LOAN_POLICY_DIR` + model cache + a GPU or
patient CPU) — without it policy questions abstain and there are no citations. Langfuse for tracing.
The synthetic bureau for what-if and decision runs. Voice requires a LiveKit server that this project
does not ship or deploy.

**Dev/test only:** `requirements-test.txt`, Playwright browsers, Node toolchains, the AG-UI stub on
`:8096`, the front-door nginx container, the isolated compose override.

**Do not mistake for mandatory:** GPU hardware. The portal, the wizard, documents, tracking and the
agent all run without a GPU. Only the optional retriever wants one.

## Unpinned or unpublishable, stated plainly

| Item | Risk | Status |
| --- | --- | --- |
| `loanrangers-frappe:16` | exists only as a local build; no registry, no digest anyone else can pull | reproducible only by running the documented `docker build` from frappe_docker `e08b50c`; no Dockerfile is vendored in this repository |
| `nginx:alpine` | floating tag; a future image can differ from what was tested | left floating deliberately (a dev-only front door); pin it if it ever fronts real traffic |
| `redis:8.6-alpine`, `mariadb:11.8` | minor-tag drift possible | pinned to minor, not digest |
| frappe_docker | documented pin `e08b50c`, but HEAD has already moved (its `images/layered/Containerfile` layout differs from that pin in places) | check out the pin before building, as setup.md says |
| ERPNext / Lending | `version-16` branch, resolved at build time | exact versions recorded in the table above; a rebuild today may get a newer patch |
| embedding / reranker weights | `EMBED_MODEL` defaults to `google/embeddinggemma-2` and the reranker is downloaded on first use | a clean machine performs a multi-GB download; cached here, not verified fresh |
