# Deployment

What is verified, what is proposed, and what must not be presented as production-ready.

The only deployment executed and observed is the **single-machine Docker Compose stack** described
below. The droplet variant exists as configuration and has not been exercised in this audit.

## Architecture

```
browser ──HTTPS──► reverse proxy ──┬──► Frappe (pages, /api/method, /assets)
                                   ├──► CopilotKit runtime (/api/copilotkit)
                                   ├──► LiveKit (wss)        [not deployed]
                                   └──► FastAPI agent (internal, never public)
```

Same-origin is a requirement, not a preference: the Frappe session cookie must reach the runtime path,
so the portal and the runtime share one host. CORS is an exact origin allowlist (`AGENT_WEB_ORIGINS`),
never `*`. The agent is reachable only from the runtime and the voice worker.

## Services

`infra/frappe/loanrangers.yml` (single machine) and `infra/frappe/loanrangers.droplet.yml` ( hardened
variant: frontend bound to `127.0.0.1` only, DB root password from an untracked `secrets.env`, separate
`loanhx_*` volumes). Services: `db`, `redis-cache`, `redis-queue`, `configurator`, `backend`,
`websocket`, `scheduler`, `queue-short`, `queue-long`, `frontend`.

| Concern | Setting |
| --- | --- |
| Persistent volumes | `db-data`, `sites`, `redis-queue-data`. **Pinned to `frappe_docker_*` names**, so a second stack without `loanrangers.isolated.yml` mounts the same data. Read that warning before starting a second stack |
| Image | `loanrangers-frappe:16`, local build; `pull_policy: always` therefore needs `--pull missing` |
| Health | MariaDB healthcheck (`start_period: 5s`, 5 retries) is tight for a cold data directory; a first `up` may fail and succeed on retry |
| Upload ceiling | `client_max_body_size 50m`; the app enforces 10 MB and 12 documents per application |
| Timeouts | `PROXY_READ_TIMEOUT: 120`, `GUNICORN_TIMEOUT: 120`, `GUNICORN_WORKERS: 2`, `GUNICORN_THREADS: 4` |
| Real IP | `UPSTREAM_REAL_IP_ADDRESS: 127.0.0.1`, header `X-Forwarded-For`, recursive off |
| Site routing | `FRAPPE_SITE_NAME_HEADER` selects the site. The committed value pins the **shared** site; a deployment must change it deliberately |
| Assets | served by `bench serve` for the portal path. Gunicorn's `:8000` returns 404 for `/assets`, which is why the front door upstreams the dev server port |

## Steps

1. Build the image ([setup.md](../development/setup.md) step 3) or pull a registry copy you publish yourself.
2. `docker compose -f infra/frappe/loanrangers.yml up -d --pull missing`
3. Create the site: `infra/frappe/bootstrap/create_site.sh` — it now installs erpnext, lending **and**
   the portal via `install_portal_app.sh`.
4. Set site config: `agent_assertion_secret` (32+, matching the agent), LiveKit keys only if voice is
   deployed, `enable_demo_fixtures` **off** for anything a real borrower might see.
5. Point the agent's `FRAPPE_URL` and the runtime's `FRAPPE_BASE_URL` at the front door for that site.
6. Start runtime and agent; keep the agent off the public network.
7. Front TLS at the reverse proxy (`infra/proxy/nginx.conf.template`). Self-signed is acceptable only
   where no real borrower data exists.
8. Health-check the URLs in [local-development.md](../development/local-development.md), then run
   `tests/e2e/portal_security.py` against the deployment.

## Migration, backup, rollback, shutdown

| Action | How |
| --- | --- |
| Migrate | `bench --site <site> migrate` after replacing the app tree (`install_portal_app.sh`). Custom fields and roles are re-applied by `after_migrate` |
| Back up | `bench --site <site> backup --files --private-files`. The `sites` volume holds site files and `db-data` holds the database; both are needed |
| Restore | restore the SQL then place the files directories; migrate afterwards |
| Rollback an app change | re-copy the previous app tree and migrate. There are no data-destructive patches in this app, so review any `patches.txt` addition before rolling back |
| Stop | runtime → agent → bureau → dev server → proxy → `docker compose stop`. Never `docker system prune`, never delete volumes you did not create |
| Restart | containers come back by themselves (`restart: unless-stopped`) **except** the `bench serve` process and any `--rm` front door. Both must be started again; this is the most common cause of "the site is down but the containers are up" |

## Not production-ready

Single machine, self-signed certificate, one Redis, one nginx, no load testing, no real devices, no
observability that demonstrably receives traces, and a seed writer that holds System Manager. The
hardening report lists these; a green CI check does not change any of them.
