# P1 Resource Usage (all measured, 2026-10-09)

## Deltas (BEFORE → AFTER, `docker system df`)

| Scope | Before | After | Delta |
|---|---|---|---|
| Images | 18.63 GB | 25.91 GB | **+7.28 GB** |
| Volumes | 2.048 GB | 2.349 GB | **+301 MB** |
| Build cache | 20.79 GB | 30.47 GB | +9.68 GB (21.45 GB reclaimable via `docker builder prune`) |
| Running containers | 0 | 9 | — |

## Image sizes (measured)

loanrangers-frappe:16 **6.67 GB** · mariadb:11.8 467 MB · redis:8.6-alpine 135 MB.
Sum ≈ 7.27 GB = the image delta. (No claim beyond these numbers.)

## Volume sizes (measured, `docker system df -v`)

db-data **299.3 MB** (one site + ERPNext + Lending + 1 customer/product/application),
sites **0.8 MB**. Volume delta (+301 MB) matches. Storage growth per extra
application is unmeasured (KB-scale expected) — not claimed.

## RAM (`docker stats`, idle post-setup)

backend 328 · db 273 · queue-short/long 67/65 · scheduler 56 · websocket 32 ·
frontend 10 · redis ~7×2 MB → **≈ 845 MB total**. Under load: not measured.

## Startup (observed, not stopwatch-precise)

MariaDB healthy ≤ ~60 s after `up`; full API serving within ~2 min.
A full `down` → `up` cycle was performed: all data survived (volumes persist),
14/14 tests green afterwards.

## Assessment

~7.3 GB images + ~0.85 GB idle RAM for one dev site. Acceptable for a dev
spike on a 55 GB-free disk; production sizing is a separate exercise. The
~9.7 GB build-cache growth is prunable and not runtime cost.
