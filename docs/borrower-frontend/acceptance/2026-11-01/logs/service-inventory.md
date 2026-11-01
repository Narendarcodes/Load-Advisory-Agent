# Services started by this acceptance task

Recorded before the runs so teardown can stop exactly these and nothing else. The stack that existed
before this task (the `loanrangers-backend-1` container and its database) is not in this list and is
not torn down.

| # | Service | Where it lives | Identifier captured at start | Stop method |
| --- | --- | --- | --- | --- |
| 1 | Frappe dev server for `loanportal.local` on `:8001` | inside container `loanrangers-backend-1` | PIDs `2334` + child `2337` (wrapper `2332`), log `/tmp/loanportal-acceptance.log` | `kill -TERM 2334` (graceful), then confirm the port is closed |
| 2 | Acceptance front door nginx on `127.0.0.1:8081` | host Docker container `loanportal-acceptance-proxy` | container id `4ab4484e5984`, `AutoRemove=false`, `Restart=no`, port map `127.0.0.1:8081->8080/tcp` | `docker stop` then `docker rm` — it was deliberately created **without** `--rm`, so it survives a stop until removed explicitly |
| 3 | CopilotKit runtime on `127.0.0.1:4200` | host `node` process | PID `11404`, log `logs/runtime.log` | `taskkill /PID 11404` (graceful first: no console, so no SIGTERM channel on Windows) |
| 4 | Test-only AG-UI stub on `127.0.0.1:8096` | host `node` process | PID `30624`, log `logs/agui-stub.log` | `taskkill /PID 30624` |

The `docker-proxy` listener seen on `:8081` (host PID `23420`) belongs to container 2 and goes away
with it; it is not stopped on its own.

Nothing was started for retrieval or for the model: the RAG agent (`:8095`) and any LLM process were
deliberately not launched, because the fixture supplies deterministic AG-UI events instead. GPU
memory must therefore read the same before and after this task.

The site itself (`loanportal.local`) and the seeded borrower fixtures predate this task; the only
database effect of this work is described in the final report's side-effects section.
