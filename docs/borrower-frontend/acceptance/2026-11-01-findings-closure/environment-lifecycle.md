# Environment lifecycle — startup and shutdown for the findings-closure run

Deliverable 13 of the findings-closure bundle. It records the whole life of the test environment in
one place: what was running before, what this task started, what it deliberately did not start, how
each service was stopped, and what the machine looks like now. The raw captures live beside this file
in [`environment/`](environment/); nothing here re-derives a number that a capture already proves.

| Capture | File | When (UTC) |
| --- | --- | --- |
| Ports and containers before start | [`environment/baseline-before-start.txt`](environment/baseline-before-start.txt) | 2026-11-01T15:39:58Z |
| Services started, with PIDs | [`environment/services-started.txt`](environment/services-started.txt) | 2026-11-01T15:41:22Z onward |
| Ports and listeners at teardown time | [`environment/teardown-before.txt`](environment/teardown-before.txt) | 2026-11-01T16:42:08Z |
| Shutdown commands and their output | [`environment/teardown.log`](environment/teardown.log) | 2026-11-01T16:42:17Z |
| Post-shutdown verification | [`environment/teardown-verification.txt`](environment/teardown-verification.txt) | 2026-11-01T16:42:41Z |

## 1. Baseline before anything was started

Fifteen containers were already running and none of this task's ports was occupied:

- the nine permanent Frappe containers (`loanrangers-backend-1`, `-db-1`, `-redis-cache-1`,
  `-redis-queue-1`, `-frontend-1`, `-websocket-1`, `-scheduler-1`, `-queue-short-1`, `-queue-long-1`);
- the six permanent Langfuse containers (`loan-advisory-langfuse-langfuse-web-1` on `127.0.0.1:3000`,
  `-langfuse-worker-1`, `-postgres-1`, `-redis-1`, `-clickhouse-1`, `-minio-1`).

`netstat` at the baseline showed a single listening socket on the harness ports — `127.0.0.1:3000`,
which belongs to Langfuse and predates this task. `:8001`, `:8081`, `:4200`, `:8095` and `:8096` were
all free, which is what makes the shutdown check in §4 meaningful: a port occupied now would be
occupied by something started here.

Truly untracked, pre-existing and untouched: the ten `Exited` containers visible in
`docker ps -a` (`cop-*`, `postiz-*`, `whatsapp_*`, `insta_kg_neo4j`). None was started, stopped,
removed or pruned.

## 2. Started by this task

Four services, each recorded with the identifier needed to stop exactly it later.

| Service | Where | Identifier | Purpose |
| --- | --- | --- | --- |
| Frappe dev server `:8001` | inside `loanrangers-backend-1` (`bench --site loanportal.local serve --port 8001`) | container pids 8483 (bench) / 8486 (werkzeug) | serves the portal pages the browser harnesses navigate |
| Test front door `127.0.0.1:8081` | `loanportal-acceptance-proxy` (nginx:alpine, container id `4bd676ee8025`, config `tests/e2e/nginx.loanportal.conf`) | created with `AutoRemove=false`, i.e. deliberately **without** `--rm` | same-origin proxy in front of the dev server, so the browser runs use the real cookie/CSRF path |
| CopilotKit runtime `127.0.0.1:4200` | host | pid 36316 (`node apps/runtime/dist/index.js`) | serves the assistant island's `/api/copilotkit` calls |
| Deterministic AG-UI stub `127.0.0.1:8096` | host | pid 34888 (`node tests/e2e/agui_stub.cjs`, `STUB_APPLICATION=ACC-LOAP-2026-00020`) | the runtime's agent upstream, replacing the live model |

Health checks at bring-up (all in `services-started.txt`): `:8001/login` → 200 inside the container,
`:8081/login` → 200 through the front door, `:4200/api/copilotkit/info` → 200, `:8096/api/agui`
listening.

`127.0.0.1:8081` appears in `teardown-before.txt` with host listener pid **23420**. That is Docker
Desktop's port-forwarding process, not a process this task launched — the same pid fronts
`:3000` for Langfuse — so it was never a kill target; stopping the container releases the port, which
is what §4 verifies.

## 3. Deliberately not started

- **The live FastAPI agent on `:8095`.** The stub replaces only the agent upstream. No model was
  loaded and no GPU memory was held for the entire run. `nvidia-smi --query-compute-apps=pid,used_memory`
  during the run and after teardown both returned only the header line and no rows.
- **`loanportal-e2e-proxy`.** The same nginx config as the front door above, created without `--rm`
  on purpose so that a `docker stop` cannot destroy the container and its evidence.
- Anything for the RAG index, and no suite that would load the retriever (see
  [`regression.md`](regression.md) §2 for the two deliberate non-runs).

## 4. Shutdown

Order was chosen so that nothing is left with a dead upstream while it is still being probed: runtime,
stub, dev server, front door.

| # | Service | Method | Result |
| --- | --- | --- | --- |
| 1 | CopilotKit runtime (pid 36316) | `taskkill /PID 36316` | **Refused**: "This process can only be terminated forcefully (with /F option)." |
| 2 | AG-UI stub (pid 34888) | `taskkill /PID 34888` | **Refused**: same message. |
| 1b/2b | Both, after identity confirmation | `taskkill /F` | `SUCCESS: The process with PID 36316 has been terminated.` and the same for 34888. |
| 3 | Frappe dev server `:8001` | stopped inside the container | `:8001 no longer listening inside the container` — no process needed killing from the host. |
| 4 | `loanportal-acceptance-proxy` | `docker stop` | `Exited (0)` — graceful, and **not removed**: the container still exists in `docker ps -a` as `4bd676ee8025 Exited (0)`. |

**The one deviation from a fully graceful shutdown, stated plainly:** the two host `node` processes
could not be terminated without `/F`. Windows reserves that message for console-less processes, and
both were started detached by the harness. Force-killing a process is destructive, so identity was
confirmed *before* the `/F` rather than assumed from memory:

```
confirmed: PID 36316 node started 01-11-2026 21:15:22,
           PID 34888 node started 01-11-2026 21:19:30 — both inside this task's window
```

Both are `node`, both started between the `services-started.txt` bring-up and the teardown, both
match the pids recorded at start. Nothing else was terminated with `/F`, and no process that predates
this task was touched.

## 5. Verification after shutdown

From [`environment/teardown-verification.txt`](environment/teardown-verification.txt):

- **Ports released.** `netstat` shows no listener on 8081, 4200 or 8096 on the host; `:8001` is not
  listening inside the container; `:8095` was never opened. The `loanportal-*` entries are absent from
  `docker ps`.
- **GPU free.** `nvidia-smi --query-compute-apps=pid,used_memory --format=csv` returned only the
  `pid, used_gpu_memory [MiB]` header — no compute process, consistent with the RAG agent never
  having been started.
- **Permanent stack intact and still serving.** All fifteen containers from §1 are still `Up`, the
  six Langfuse ones still `(healthy)`, and `loanrangers-backend-1` still answers on port 8000.
- **Nothing removed.** No `docker rm`, no `docker system prune`, no volume or image touched. The
  front door is stopped-but-present so a later run can `docker start` it or inspect its logs.

A correction is recorded rather than quietly overwritten. The first post-teardown health probe asked
for `http://127.0.0.1:8000/borrower/products` and got **404**; that was the probe's fault, not the
stack's — Frappe routes by the `Host` header. Re-issued with `-H "Host: loanportal.local"` the same
endpoint returns **200** and `api ping: {"message":"pong"}`. Both readings are in the file, the
correction after the mistake.

## 6. Cleanup of the run's own secrets

The disposable-site fixture credentials were copied out of the container to
`%TEMP%\loanportal-e2e\closure1.json` (outside the repository, mode 600) so the browser harnesses
could read them from the environment, and were deleted when the harnesses finished. Verified at
2026-11-01T16:48Z:

| Location | Before | Now |
| --- | --- | --- |
| host `%TEMP%\loanportal-e2e\closure1.json` | present (668 bytes) | deleted; the directory itself removed |
| container `/tmp/loanportal-e2e/` | held the seeded credentials | empty (`ls` shows only `.` and `..`); `find /tmp /home/frappe -name "*closure1*"` returns nothing |
| `docs/borrower-frontend/acceptance/2026-11-01-findings-closure/**` | never contained them | only the fixture *emails* and application ids already published in [`services-started.txt`](environment/services-started.txt) |

The one-off KYC probe script that read those credentials from `process.env` (no secret in the file
itself) is kept as reproducible evidence at
[`kyc-contrast/kyc_card_focus_probe.cjs`](kyc-contrast/kyc_card_focus_probe.cjs); the harnesses under
`tests/e2e/` likewise take secrets from environment variables and never echo them.

**One item this task found but did not touch, for the owner to decide on:** inside
`loanrangers-backend-1`, `/tmp/seed_applications.json` is a root-owned 9,890-byte file dated
2026-10-19 15:20 — it predates this task and this findings-closure run, and its name suggests it
carries seeding data. Deleting another run's artefact is not this task's call, so it is left in place
and flagged here rather than removed or read.

## 7. State of the machine as this bundle closes

| Item | State |
| --- | --- |
| Frappe permanent bench (`loanrangers-*`, 9 containers) | Up, unmodified by this task's start/stop cycle |
| Langfuse stack (6 containers) | Up and healthy |
| Port `:8000` (permanent frontend) | serving, verified with the site Host header |
| Port `:3000` (Langfuse UI) | serving, untouched |
| `:8001`, `:8081`, `:4200`, `:8095`, `:8096` | released |
| `loanportal-acceptance-proxy` | `Exited (0)`, not removed, no volumes |
| RAG agent / GPU | never started / no compute processes |
| Repository working tree | unchanged except the files listed in the changed-file report; nothing committed, pushed or merged |

**Status: VERIFIED** for startup, shutdown, port release, GPU idleness and preservation of the
permanent containers. **One limitation, recorded as such:** `query session` returns empty on this
machine, so the interactive-desktop-session fact used in
[`screen-reader-blocker.md`](screen-reader-blocker.md) rests on the `golla@VICTUS-LAPTOP` console
record and not on that command's output.
