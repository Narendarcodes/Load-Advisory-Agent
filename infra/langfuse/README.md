# Self-hosted Langfuse (local only)

The official Langfuse Docker Compose stack, pinned and hardened for local development of the Loan Advisory Agent.
Everything — UI, ingestion, Postgres, ClickHouse, Redis and MinIO — stays on this machine. No Langfuse Cloud
account, key or proxy is involved. External model providers (vLLM, Groq) remain the agent's own dependencies.

| Component | Image | Published port |
|---|---|---|
| Langfuse web (UI + ingestion API) | `langfuse/langfuse:4.70.0` (digest pinned) | `127.0.0.1:3000` only |
| Langfuse worker | `langfuse/langfuse-worker:4.70.0` | none |
| ClickHouse | `clickhouse-server:25.12` | none |
| Postgres | `postgres:17` | none |
| Redis | `redis:7` | none |
| MinIO | `chainguard/minio` (digest pinned) | none |

All services use `restart: unless-stopped`, healthchecks, bounded `json-file` logs (10 MB × 3) and named volumes.
`TELEMETRY_ENABLED=false`. The compose file is `infra/langfuse/docker-compose.yml`; the project name is
`loan-advisory-langfuse`.

## Prerequisites

- Docker Desktop with the WSL2 backend (Windows) or Docker Engine (Linux/macOS).
- **16 GB RAM host is the target.** With Docker Desktop's default 8 GB VM, the stack idles at ~2.3 GiB and runs
  alongside the mock Frappe stack, but a 16 GB allocation leaves headroom for ingestion bursts and ClickHouse merges.
- Python 3.11+ on the host for the env generator and diagnostic (the app itself already needs it).

Measured idle usage on the reference machine (7.6 GiB Docker VM): web 787 MiB, worker 657 MiB, ClickHouse
626 MiB, Postgres 82 MiB, MinIO 77 MiB, Redis 9 MiB — about **2.24 GiB total**. Ingestion and UI queries add
temporary CPU and memory; ClickHouse is the largest consumer.

## First start

Generate local secrets and bootstrap values (writes `infra/langfuse/.env`, mode 0600, refuses to overwrite):

```bash
python infra/langfuse/generate_env.py
```

Start the stack and wait for health:

```bash
docker compose --env-file infra/langfuse/.env -f infra/langfuse/docker-compose.yml up -d
docker compose --env-file infra/langfuse/.env -f infra/langfuse/docker-compose.yml ps
```

`langfuse-web` becomes healthy after its migrations (about 30–90 s on first start); `langfuse-worker` starts once
web is healthy. The bootstrap variables create the local organisation, project and the API keys already present in
`.env`; they are ignored after the first initialisation.

Open **http://127.0.0.1:3000**. The login is `LANGFUSE_INIT_USER_EMAIL` / `LANGFUSE_INIT_USER_PASSWORD` from
`infra/langfuse/.env` (defaults: `admin@loan-advisory.local`). The project is `loan-advisory-local`.

`infra/langfuse/.env` is git-ignored. Never commit it, print it, or paste its keys into an issue, PR or screenshot.

## Point the agent at the stack

The generator already appends the agent-side variables to `infra/langfuse/.env`. Load them into the process that
runs the API server:

```bash
set -a; . infra/langfuse/.env; set +a
```

Relevant variables (see the root `.env.example`):

| Variable | Meaning |
|---|---|
| `LANGFUSE_ENABLED` | `1` enables export; default off |
| `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` | local project keys (never hardcoded) |
| `LANGFUSE_BASE_URL` | `http://127.0.0.1:3000` (loopback required unless `LANGFUSE_ALLOW_REMOTE=1`) |
| `LANGFUSE_ENVIRONMENT` | trace environment label, default `local` |
| `LANGFUSE_RELEASE` | optional app revision label |
| `LANGFUSE_CAPTURE_CONTENT` | `1` opts in to prompt/answer text; default off |
| `LANGFUSE_SAMPLE_RATE` | 0.0–1.0, default 1.0 |
| `LANGFUSE_TIMEOUT` | SDK HTTP timeout seconds, default 5 |

Diagnose configuration, health and auth, then send one synthetic trace:

```bash
python scripts/development/langfuse_check.py --stack-env --send-trace
```

Exit `0` means health, Basic-auth project lookup and trace delivery all passed. Exit `2` means the config is
inactive (the agent still runs). Exit `1` means the stack or key is wrong.

## Day-to-day operations

```bash
# status / health
docker compose --env-file infra/langfuse/.env -f infra/langfuse/docker-compose.yml ps
curl -s http://127.0.0.1:3000/api/public/health

# logs (all, or one service)
docker compose --env-file infra/langfuse/.env -f infra/langfuse/docker-compose.yml logs --tail=200 -f
docker compose --env-file infra/langfuse/.env -f infra/langfuse/docker-compose.yml logs --tail=200 langfuse-worker

# stop containers, keep data
docker compose --env-file infra/langfuse/.env -f infra/langfuse/docker-compose.yml stop

# start again
docker compose --env-file infra/langfuse/.env -f infra/langfuse/docker-compose.yml start

# restart one service
docker compose --env-file infra/langfuse/.env -f infra/langfuse/docker-compose.yml restart langfuse-web

# remove containers/network but KEEP volumes
docker compose --env-file infra/langfuse/.env -f infra/langfuse/docker-compose.yml down
```

**Never run `docker compose down -v`** and never delete the `loan-advisory-langfuse_*` volumes: that destroys all
trace, dataset and score data. There is no automatic retention window configured; data grows until you prune it
(Phase: retention is documented in `docs/observability/langfuse.md`).

## Backup and restore

The stack has five named volumes: `langfuse_postgres_data`, `langfuse_clickhouse_data`, `langfuse_clickhouse_logs`,
`langfuse_minio_data`, `langfuse_redis_data`. Redis is a queue/cache and can be rebuilt; the authoritative data is
Postgres (projects, users, datasets, keys), ClickHouse (traces/observations/scores/events) and MinIO (event blobs).

Consistent filesystem backup (stop writes first; the procedure below has not yet been exercised as a restore drill
in this repository — treat it as the intended procedure, not a verified one):

```bash
STACK="--env-file infra/langfuse/.env -f infra/langfuse/docker-compose.yml"
mkdir -p backups
docker compose $STACK stop
for v in postgres clickhouse minio redis; do
  docker run --rm -v "loan-advisory-langfuse_langfuse_${v}_data:/data:ro" -v "$PWD/backups:/backup" \
    alpine tar -czf "/backup/langfuse_${v}_$(date +%Y%m%d).tgz" -C /data .
done
docker compose $STACK start
```

Restore into the same (empty) volumes after `docker compose ... down`:

```bash
for v in postgres clickhouse minio redis; do
  docker run --rm -v "loan-advisory-langfuse_langfuse_${v}_data:/data" -v "$PWD/backups:/backup" \
    alpine sh -c "rm -rf /data/* && tar -xzf /backup/langfuse_${v}_<date>.tgz -C /data"
done
docker compose $STACK up -d
```

For SQL-level dumps instead of file archives, use `pg_dumpall` for Postgres and ClickHouse `BACKUP TABLE` for the
event/scores tables; restore both before restarting the worker. Restores are only as good as the last tested one —
do a restore drill into fresh volumes before relying on a backup.

## Resource limits and tuning

- No hard `mem_limit` is set, so Docker Desktop's VM limit applies. On 16 GB hosts, leaving Docker at 8–12 GB is
  comfortable for this stack plus the rest of the dev environment.
- ClickHouse is the main memory user; if the VM is tight, cap it with `--max_server_memory_usage` in a ClickHouse
  config override. Do not disable its healthcheck: the worker queues events until ClickHouse is ready.
- The app's exporter uses a batch processor with a bounded timeout (`LANGFUSE_TIMEOUT`, default 5 s) and never
  blocks an advisory request. A stopped stack only produces dropped telemetry, not failed requests.
- Logs are capped at 30 MB per container; `docker system df` is the quickest way to spot volume growth.

## Upgrading

1. Back up the volumes (above).
2. Bump the image tag **and digest** for web, worker and any dependency in `docker-compose.yml`.
3. `docker compose ... pull && docker compose ... up -d`; watch `langfuse-web` migrations and worker logs.
4. Re-run `python scripts/development/langfuse_check.py --stack-env --send-trace`.

Keep the Python SDK pin (`langfuse==5.0.4` in `requirements.txt`) compatible with the server. Langfuse v4 servers
run in `events_only` mode: trace/score *read* endpoints such as `/api/public/traces` return HTTP 404 by design;
use the UI, or `/api/public/v2/observations` with `?traceId=...` for automated checks.

## Troubleshooting

| Symptom | Check |
|---|---|
| `langfuse-web` unhealthy, `ECONNREFUSED 127.0.0.1:3000` in its log | The container binds to its own hostname, not loopback; the bundled healthcheck probes `$HOSTNAME`. Recreate web after editing the healthcheck. |
| Health OK but no traces | `LANGFUSE_ENABLED=1` in the API process, keys loaded, `LANGFUSE_BASE_URL` loopback; run `langfuse_check.py --stack-env --send-trace`; check `langfuse-worker` logs. |
| Trace accepted but UI empty | Ingestion lag (seconds) and ClickHouse readiness; refresh, then check worker logs. |
| `/api/public/traces` or `/api/public/scores` returns 404 | Expected in v4 `events_only` mode; use the UI or `/api/public/v2/observations?traceId=...`. |
| Dashboard shows nothing for a turn | The exporter is off or the process did not load `.env`; the agent response is unaffected by design. |
| Disk grows | ClickHouse event tables + MinIO blobs; prune old projects/traces in the UI or restore from a fresh volume after exporting what you need. |
