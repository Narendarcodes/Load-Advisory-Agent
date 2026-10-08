# P0 Environment

## This machine (verified)

- Windows 11, Docker 29.8.1 + Compose v5.5.1, Python 3.14.4, Node v24.15.0
- WSL2 with Ubuntu present (`wsl --status` → Default Distribution: Ubuntu)

## Python / ZEN setup (done, reproducible)

```powershell
pip install -r requirements.txt   # zen-engine==2.1.2, pydantic, requests, pytest
python -m pytest tests/ -q
python prototype_0/scripts/run_p0.py
```

No env vars needed for the default path (synthetic `MockStore`).
For a live Frappe site: set `FRAPPE_URL`, `FRAPPE_API_KEY`, `FRAPPE_API_SECRET`.

## Frappe on Windows (required path, not yet executed)

Frappe v16 officially needs Linux. On this machine:

1. `wsl --install -d Ubuntu` (already present — verify with `wsl --status`)
2. Inside Ubuntu: install Docker, then follow https://docs.frappe.io/framework/
   (frappe_docker: MariaDB + Redis + bench containers, ports 8000/9000).
3. `bench get-app lending --branch version-16`, `bench new-site`, `bench --site <site> install-app lending`.

Why not executed in this session: a full bench brings up MariaDB/Redis/workers
and takes 30+ min plus GBs of images; the integration is decoupled behind
`prototype_0/integration/frappe_adapter.py`, so ZEN + orchestration + tests are
fully proven against the mock store first. Live-site verification is the one
remaining manual step (tracked in `p0-test-results.md` Q11).

## Ports / services (reference for live setup)

- Frappe site: 8000 · SocketIO: 9000 · MariaDB: 3306 (container-internal)
