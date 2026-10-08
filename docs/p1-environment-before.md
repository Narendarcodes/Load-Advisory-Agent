# P1 Environment — BEFORE (2026-10-08)

## Host

- OS: Windows 11 Home Single Language, 64-bit
- CPU: 12th Gen Intel i5-12450H
- RAM: 16,437,392 KB (~15.7 GiB)
- C: used 452,319,080,448 (~421 GiB) · free 58,863,099,904 (~54.8 GiB)
- Docker 29.8.1 (BuildKit default, satisfies Engine v23+ build requirement)
- Docker Compose v5.5.1 · Python 3.14.4 · Node v24.15.0 · Git 2.54.0
- WSL2 present (Ubuntu default) — not used; Docker Desktop Linux containers used directly.

## Docker BEFORE

- Images: 17 total, 18.63 GB (3.2 GB reclaimable)
- Containers: 12 total, 0 running, 1.256 GB
- Local volumes: 22 total, 12 active, 2.048 GB
- Build cache: 209 entries, 20.79 GB (11.77 GB reclaimable)

## Install plan (official docs)

`frappe/frappe_docker` (main @ `e08b50c`), guide `docs/02-setup/02-build-setup.md`:
custom `layered` image with `apps.json` = erpnext `version-16` + lending
`version-16`, `FRAPPE_BRANCH=version-16`, tag `loanrangers-frappe:16`.
`pwd.yml` demo explicitly cannot install custom apps — not used.
