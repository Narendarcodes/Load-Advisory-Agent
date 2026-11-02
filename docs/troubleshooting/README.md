# Troubleshooting

Every entry below was observed on a real run of this project, either during the 2026-11-02 clean-clone
audit or in the acceptance work recorded under `docs/borrower-frontend/`. Nothing here is speculation.

## Installation and dependencies

| Symptom | Cause | Fix |
| --- | --- | --- |
| `pytest` aborts with `ImportError: No module named 'rank_bm25'` while collecting `tests/test_abstention_evidence.py`, `test_encoding_paths.py`, `test_langfuse_tracing.py` | those tests import RAG helpers; the packages were only installed by an inline CI command | `pip install -r requirements.txt -r requirements-test.txt` |
| `test_bajaj_rag.py` reports `SKIPPED: could not import 'pymupdf'` instead of running | `rag/corpus.py` imports pymupdf for PDF ingestion and it was declared in no manifest | same install line; the skip is the symptom of a missing declaration, not a broken test |
| A clean `pip install -r requirements.txt` pulls different versions than the author's machine and something subtle breaks | the manifests carry `>=` floors only, so resolution floats | install the pair of manifests, record the versions you resolved (`pip freeze`), and compare against the verified set in [dependency-matrix.md](../reproducibility/dependency-matrix.md) before blaming the app |
| `sentence_transformers` import segfaults on Python 3.14 with the user site-packages on the path | a broken user-site install on that machine, not a project bug | create a fresh virtualenv and install into it; do not rely on the global set |
| `ModuleNotFoundError: loan_advisory` on Windows | `PYTHONPATH` was joined with `:` | Windows uses `;` |
| Shell-expelled path becomes `C:Usersname...` | bash strips backslashes from unquoted Windows paths when sourcing an env file | quote the value, use forward slashes, or pass configuration through a JSON file |
| A credential file written with Python `os.open(..., 0o600)` becomes unreadable after `icacls /inheritance:r` on its folder | on Windows that mode sets the DOS read-only attribute, not an ACL | restrict the directory's ACL with `(OI)(CI)` inheritance and do not `chmod` the file |

## Containers and Docker

| Symptom | Cause | Fix |
| --- | --- | --- |
| `up` fails with `dependency failed to start: container …-db-1 is unhealthy` on a first run | MariaDB initialising a cold data directory exceeds the healthcheck window (`start_period: 5s`, 5 retries) | wait and run `up` again; the second attempt succeeds. If it recurs, raise the db healthcheck `start_period` — it is a timing budget, not a code fault |
| `up` fails trying to pull `loanrangers-frappe:16` | the compose file sets `pull_policy: always` and the image is local-only | `docker compose … up -d --pull missing` |
| Containers restart-loop with `no such file or directory` after building the image on Windows | `core.autocrlf` baked CRLF into `resources/core/*.sh`, which the Containerfile copies in as entrypoints | LF-convert those scripts, set `core.autocrlf false` and `core.eol lf` in the frappe_docker clone, rebuild |
| Starting a second stack with `-p something` disturbs the first one | `loanrangers.yml` pins volume names to `frappe_docker_*`, which do **not** carry the project prefix, so the second stack mounts the live database and sites directory | use `infra/frappe/loanrangers.isolated.yml` as an additional `-f` file; `docker exec … mariadbd: Can't lock aria control file` is the collision announcing itself |
| `docker exec <c> rm` fails with `Permission denied` | files copied in by `docker cp` are root-owned | `docker exec -u root …` |
| `docker cp` of a **directory** into a container from a Windows host puts it somewhere unexpected, and re-running nests it one level deeper each time | two host-side path issues: `"$SRC/."` is ambiguous, and an MSYS path (`/c/Users/…`) makes the CLI append the source directory name instead of replacing the destination | copy a **file** (tarball) and extract it inside the container — `install_portal_app.sh` does exactly this — and check the tree shape before installing |
| `bench run-tests --app <app>` reports roughly double the tests the app has, with each failure listed under two dotted module paths | the app directory contains a second copy of itself (the nesting above), so the runner discovers `tests/` twice | `find apps/<app> -name hooks.py` must print exactly one path. Delete the app tree and re-copy it with the fixed script |

## Frappe site, routing and assets

| Symptom | Cause | Fix |
| --- | --- | --- |
| Everything 404s under `/assets/loan_advisory_portal/…` | the `sites/assets/loan_advisory_portal` symlink is missing | `install_portal_app.sh` recreates it; it is part of installation, not an extra |
| Every asset 404s through the proxy | the proxy points at gunicorn `:8000`, which serves no `/assets` | keep the upstream at the `bench serve` port (`:8001`) |
| Portal pages render unstyled or the assistant never mounts, after editing portal source | the container still holds an older copy of the app tree | re-run `install_portal_app.sh`; for the island, rebuild then re-copy `public/js/assistant` as a whole directory, deleting the old one first |
| A page you expect returns 404 while its file exists in `www/` | Frappe routes by the `Host` header | send the right `Host`/`X-Frappe-Site-Name`; the acceptance front door pins both |
| A restart leaves the dev server running with old code | only one process may hold the port and a stale `bench serve` survives a container restart | find the listener through `/proc/*/cmdline` (the image may lack `ps`) and stop that pid |
| `CSRFTokenError` on a POST | token missing or from another session | read `boot.csrf_token` from the rendered page |
| `{"exc_type": "Forbidden"}` with no message | custom exception without `frappe.flags.error_message` | already handled in `PortalError.__init__` |
| Tests fail with `PermissionError … access this file` on document upload | private `File` content-hash dedupe across users | fixtures use a unique PDF producer per fixture |
| On a site created by the documented bootstrap, 17 portal tests error with `ServiceUnavailable: voice is not configured` | `livekit_token.configuration()` fails closed without `livekit_url` / `livekit_api_key` / `livekit_api_secret`, and the voice tests used to assume a site that had them | fixed in `tests/utils.py: configure_voice_for_tests`, which the voice classes install in `setUpClass` and restore in `tearDownClass`. On an older revision, set the three keys on the disposable site |
| A secret you "only passed once" appears in plaintext somewhere | `bench` logs the full argv of every invocation it runs into `logs/bench.log` — including `--db-root-password`, `--admin-password` and `set-config agent_assertion_secret <value>` | treat that log as sensitive and never commit or paste it; see [../reproducibility/security-audit.md](../reproducibility/security-audit.md) |

## Assistant path

| Symptom | Cause | Fix |
| --- | --- | --- |
| Agent exits at startup: `AGENT_ASSERTION_SECRET is not set (or shorter than 32 characters)` | deliberate fail-closed: without it every run would 503 anyway | set it to the site's `agent_assertion_secret` |
| Every assistant turn answers nothing, or the log shows `LLM returned no content` | `LLM_REASONING_EFFORT` defaults to `low`, and `openai/gpt-oss-120b` on Groq then spends the whole budget on its reasoning field | set `LLM_REASONING_EFFORT=` (empty) to omit the parameter |
| Groq returns `403 error code: 1010` from Python but works from curl | that endpoint sits behind an edge filter that rejects the default urllib signature | use `requests`/`httpx` or set a normal user agent |
| Island stuck on "Loading the assistant…" with `process is not defined` | the bundle was built without the `process.env.NODE_ENV` define, or the container has an old copy | rebuild, delete the container's directory, copy again |
| Browser console shows `Agent fetch failed … net::ERR_CONNECTION_REFUSED` then a fallback answer | the browser is calling the agent directly, which means the runtime origin or the proxy path is wrong | the browser must only ever call `/api/copilotkit` on the portal origin |
| Answers arrive instantly and identically every time | you are talking to the deterministic AG-UI stub on `:8096`, not the live agent | check `AGENT_AGUI_URL`; a fixture must never be presented as a model answer |
| Agent answers without evidence after re-seeding | the running agent still holds the deleted seed's API key | rewrite `FRAPPE_API_KEY`/`FRAPPE_API_SECRET` (and the `EVIDENCE_*` pair) from the new seed and restart the agent |
| Policy questions abstain and no citations appear | the agent was started with `--no-rag`, or `LOAN_POLICY_DIR` points at a corpus the index does not match | citations come only from retrieval; see the retrieval section below |
| `bench run-tests` output shows a browser page as a 500 with a CSP complaint | browser suites and `bench run-tests` ran against the same disposable site at once; the CSP line is Frappe's error page, not a policy bug | never run them concurrently against one site |

## Retrieval and GPU

| Symptom | Cause | Fix |
| --- | --- | --- |
| `torch.OutOfMemoryError` while loading the reranker, on a card with gigabytes nominally free | a per-process `AGENT_GPU_FRACTION` cap smaller than embedder + reranker. A 0.45 cap on 4 GB caused this exactly | remove the cap, or run `AGENT_RETRIEVER_DEVICE=cpu` |
| First policy query takes ~35 s, later ones ~10 s | CUDA/kernel warm-up and BM25 construction happen on the first query | expected; the code warms the retriever at load |
| Local Ollama cannot load its model while the agent runs | the retriever already holds most of a 4 GB card | choose one: RAG in the agent, or a local model. Policy answers on a 4 GB card came from GPU RAG at ~2.6 GB |

## Documentation that misled

- `FRAPPE_URL=http://127.0.0.1:8080` in `.env.example` aims the agent at the **other** site, because
  the permanent frontend hard-pins `p1loan.local`. Use the front door port for whichever site you are
  testing.
- An earlier note that "no CI exists" was wrong: `.github/workflows/ci.yml` runs `ruff + pytest` on
  Python 3.14 for pull requests against `main`.
- `git branch` history contains merge subjects for PR numbers that no longer have open PRs. Read
  GitHub for PR state, not local branch names.
