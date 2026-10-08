# P1 Frappe Installation (executed 2026-10-08/09)

Official path only: `frappe/frappe_docker` main @ `e08b50c`,
guide `docs/02-setup/02-build-setup.md` + `06-setup-examples.md` (Example 1,
no-proxy) + `03-start-setup.md`. No third-party repos, no upstream modifications.

## Image

`docker build --build-arg=FRAPPE_PATH=https://github.com/frappe/frappe
--build-arg=FRAPPE_BRANCH=version-16 --secret=id=apps_json,src=apps.json
--tag=loanrangers-frappe:16 --file=images/layered/Containerfile .`
with `apps.json` = erpnext `version-16` + lending `version-16`.
`pwd.yml` demo was rejected (cannot install custom apps, per official docs).

## Installed versions (live, `bench --site p1loan.local list-apps`)

frappe 16.51.0 · erpnext 16.50.0 · lending 16.6.1.

## Stack (`loanrangers.yml` = compose.yaml + mariadb + redis + noproxy overrides)

mariadb:11.8, redis:8.6-alpine, backend/frontend/workers/scheduler/websocket.
Site `p1loan.local` (`FRAPPE_SITE_NAME_HEADER=p1loan.local`, port 8080):
`bench new-site ... --install-app erpnext` then `install-app lending`.

## Windows gotchas (local build hygiene, not upstream bugs)

1. Git `core.autocrlf` baked CRLF into `resources/core/*.sh`, which
   `images/layered/Containerfile` COPYs over `/usr/local/bin/entrypoint.sh`
   → containers restart-looped (`no such file or directory`). Fix: LF-convert
   the three scripts + `git config core.autocrlf false core.eol lf`, rebuild.
2. `compose.yaml` sets `pull_policy: always` → `up` tried to pull our local
   image. Fix: `up -d --pull missing`.
3. ERPNext Company insert via bare REST fails (missing setup fixtures). Fix:
   run the setup wizard in-process —
   `bench --site p1loan.local execute "<expr>"` with args from a JSON file
   `docker cp`'d into the container (avoids all shell-quoting issues).
   Note: `setup_complete` is NOT API-whitelisted in v16, and the v16 dotted
   path is `erpnext.setup.setup_wizard.setup_wizard.setup_complete`
   (old tutorials show a shorter path that 404s).
4. Loan Product requires 4 collection-offset sequences; one shared
   `Loan Demand Offset Order` ("Standard Collection Order") satisfies all four.
5. `Loan Application` forbids rename (`allow_rename=0`); live app keeps its
   autoname `ACC-LOAP-2026-00001`. Customer rename (fresh, unlinked) worked.
