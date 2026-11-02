# Local development

Day-to-day loop once [setup.md](setup.md) has produced a site with the portal installed.
Ports used here match the verified environment: `:8081` browser, `:8095` agent, `:4200` runtime,
`:8011` synthetic bureau, `:8001` Frappe dev server inside the container, `:3000` Langfuse.

## Start

| # | Service | Command |
| --- | --- | --- |
| 1 | permanent stack | `docker compose -f infra/frappe/loanrangers.yml up -d --pull missing` |
| 2 | Frappe dev server for the site | `docker exec <backend> bash -lc 'cd /home/frappe/frappe-bench/sites && nohup /home/frappe/frappe-bench/env/bin/python -m frappe.utils.bench_helper frappe --site <site> serve --port 8001 > /tmp/serve.log 2>&1 &'` |
| 3 | front door | `docker run -d --name <site>-proxy --network frappe_docker_default -p 127.0.0.1:8081:8080 --add-host host.docker.internal:host-gateway -v "$PWD/tests/e2e/nginx.loanportal.conf:/etc/nginx/conf.d/default.conf:ro" nginx:alpine` |
| 4 | synthetic bureau | `.venv\Scripts\python -m synthetic_bureau.app --port 8011` (with `PYTHONPATH` including `apps/bureau/src` and `decision_engine`) |
| 5 | advisory agent | `.venv\Scripts\python -m loan_advisory.agent.server --port 8095 --no-rag --bureau-url http://127.0.0.1:8011` |
| 6 | CopilotKit runtime | `cd apps/runtime && AGENT_RUNTIME_PORT=4200 AGENT_AGUI_URL=http://127.0.0.1:8095/api/agui FRAPPE_BASE_URL=http://127.0.0.1:8081 AGENT_WEB_ORIGINS=http://127.0.0.1:8081 node dist/index.js` |

The nginx config must be mounted from a checkout, and nginx resolves `host.docker.internal` to a
container-routable address, so the runtime must listen on all interfaces or on that address for the
proxy's `/api/copilotkit` hop to land. In the verified run the runtime bound `127.0.0.1:4200` and
Docker's host gateway still reached it; if yours returns 502 on that path, bind `0.0.0.0` and keep the
firewall in front.

## Health

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8081/login                  # 200
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8081/api/copilotkit/info    # 200
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8095/healthz                # 200
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8011/healthz                # 200
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8081/assets/loan_advisory_portal/css/portal.css   # 200
```

A 502 on the first two means the dev server is down; a 404 on the last means the assets symlink is
missing. Re-run `install_portal_app.sh` for either.

## Editing loops

| Changing | What you must do |
| --- | --- |
| portal Python inside the container | nothing, the dev server's stat reloader picks it up — **if** you copied it in; edits on the host alone do nothing, so re-run `install_portal_app.sh` |
| DocTypes, custom fields, fixtures | `bench --site <site> migrate` |
| portal CSS/JS pages | re-copy the app tree (`install_portal_app.sh`); no build step |
| the React island | `cd apps/web/assistant && npm run build`, then delete the container's `public/js/assistant` and copy the fresh directory |
| the runtime | `cd apps/runtime && npm run build && npm test`, then restart the node process |
| the agent | restart it; there is no reload |
| a new assertion secret or new seed credentials | restart the agent **and** the runtime; both cache them at start |

## Logs

| What | Where |
| --- | --- |
| Frappe dev server | `/tmp/loanportal-serve.log` (or wherever you pointed `serve`); 500s print a traceback |
| Agent | the file you redirected to; the retriever load line ("retriever loaded in Ns") confirms RAG |
| Runtime | its stdout; the startup line names the upstream AG-URL, which is how you confirm live agent vs stub |
| Frappe application logs | `bench --site <site> show-config`, plus `sites/<site>/logs/` |

## Tests

```bash
.venv\Scripts\python -m pytest -q                                    # host suite
docker exec <backend> bash -lc 'cd /home/frappe/frappe-bench && bench --site <site> run-tests --app loan_advisory_portal'
cd apps/web/assistant && npm run typecheck && npm test
cd apps/runtime && npm run typecheck && npm test
npm --prefix tests/e2e run a11y        # and: contrast, keyboard, thread, missing-info, consent, list
python tests/e2e/portal_journeys.py --seed <temp>/e2e1.json --base http://127.0.0.1:8081
python tests/e2e/portal_security.py --seed <temp>/e2e1.json --base http://127.0.0.1:8081
```

Two hard rules learned the hard way:

1. **Never run `bench run-tests` and a browser suite against the same site at the same time.** A
   concurrent run produced a `GET /borrower` 500 that looked exactly like a product defect.
2. **The browser suites attach `write_guard.cjs` first.** A POST is not a write in Frappe's calling
   convention, so the guard carries declared reads by name; anything undeclared fails the run instead
   of quietly editing the site.

## Stop

Order: runtime → agent → bureau → dev server → front door. Stop, do not remove, anything you did not
create.

```bash
taskkill //PID <runtime pid> //F        # console-less processes need /F on Windows; confirm the pid first
taskkill //PID <agent pid> //F
taskkill //PID <bureau pid> //F
docker exec <backend> bash -lc 'for f in /proc/[0-9]*/cmdline; do c=$(tr "\0" " " < $f); case "$c" in *8001*) echo "${f#/proc/}";; esac; done'   # then kill those pids in the container
docker stop <site>-proxy
```

Never `docker system prune`, never delete the `frappe_docker_*` volumes, and never `drop-site`
`p1loan.local` — the shared site is another owner's data and its loss is unrecoverable.
