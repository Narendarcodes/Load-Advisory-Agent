# Security audit

Scope: the pending changes from the reproducibility work, the repository as published, and the local
credential handling this project requires. **No secret value appears anywhere in this file.**

## Scans run

| Target | Method | Result |
| --- | --- | --- |
| The 18 changed/new files in this audit | pattern scan for provider keys, Langfuse keys, GitHub tokens, private-key blocks, Frappe `token key:secret` pairs, assertion-secret hex, password assignments, QA password shape | **0 hits** |
| The released Frappe diff (1,470 files) | same patterns over the diff text | **0 hits** |
| All branch history | `git log --all -S` for the live provider key | **never committed** |
| Files installed on the clean clone | decode and scan each of 354 committed blobs (FastAPI workstream) | **0 hits** |
| Database evidence archived outside git | 25 files, per-file classification for credentials and personal-data shapes | **0 credentials**; 8 files carry synthetic identity-shaped values only |

`gitleaks` is not installed on this machine, so these are targeted pattern scans plus a history search,
not that tool. Stated so the coverage is not over-read.

## What is kept out of git, and where it lives instead

| Item | Handling |
| --- | --- |
| Provider keys (`GROQ_API_KEY` etc.) | exported into the process environment of the agent. `.env` is gitignored; nothing loads it implicitly |
| Frappe `agent_assertion_secret`, LiveKit keys, DB credentials | Frappe site config (`site_config.json`). **Not "never printed": see the bench.log finding below** — the command that writes them is recorded verbatim in `logs/bench.log` inside the backend container |
| QA borrower passwords and seed API secrets | written by `e2e_seed` to `/tmp/loanportal-e2e/<tag>.json` inside the container at mode 600, copied to a host temp directory **outside the repository**, then deleted from the container |
| Langfuse stack secrets | `infra/langfuse/.env`, gitignored; the committed file there is `.env.example` |
| Database record dumps | excluded from the release and archived outside git; see [database-reproducibility.md](database-reproducibility.md) |
| Model weights, RAG index, virtualenvs, `node_modules`, build output of the runtime | gitignored; `runs/` and `data/raw/` never enter the tree |

`.gitignore` covers `.env`, `infra/langfuse/.env`, `.venv/`, `*.log`, `sites/`, `runs/`, `data/raw/`,
`data/normalised/`, `*.parquet`, and — added in this work — `apps/runtime/node_modules`,
`apps/web/assistant/node_modules`, `apps/web/advisory/node_modules`, `apps/runtime/dist` and
`tests/e2e/out`.

## Known exposure, unresolved and owned by the project owner

### `bench.log` records every secret passed on a command line

Found while reading the backend container during this audit, not inferred: Frappe's bench wrapper logs
the **full command line** of every `bench` invocation it executes, so a secret passed as an argument
lands in plaintext in `/home/frappe/frappe-bench/logs/bench.log`. The commands the documented setup tells
you to run are exactly that shape:

```
bench new-site … --db-root-password <value> --admin-password <value>
bench --site <site> set-config agent_assertion_secret <value>
```

Consequences and the practice that follows from them:

- `logs/bench.log` is **sensitive**, even on a disposable site, and is not a file to paste into an issue,
  attach to a report or commit. The audit's own log was read, not published; nothing from it is in this
  repository.
- The site config file itself is the right place for the value; the exposure is in the log, not in
  `site_config.json`.
- On a shared or long-lived host, treat a site's assertion secret as disclosed once it has been set this
  way and re-set it after setup, or set it by editing `site_config.json` directly with a file editor.
- This is why the reproducibility evidence in `docs/reproducibility/evidence/` carries the browser and
  HTTP results but **not** the agent or bench console logs; see
  [evidence/EVIDENCE.md](evidence/EVIDENCE.md).

### Transcript disclosure from a previous handover

During a previous manual-testing handover, a masking bug printed a live provider key, both Langfuse
project keys and the disposable site's assertion secret into a chat transcript. Verified: none of them
are in the repository or its history. They should nevertheless be treated as disclosed. **Rotation has
not been performed**, because changing provider credentials is outside an audit's authority.

## Public repository

The GitHub repository is public. Consequences worth remembering:

- A backup branch pushed there publishes its content to the world. One such branch was created during
  the release work and has since been deleted after verifying the same work is recoverable from a local
  bundle and archive. Deleting a remote ref does not un-publish clones, forks or caches.
- Fixtures, screenshots and acceptance evidence are readable by anyone. Everything committed is
  synthetic, and the pattern scans above are the check that keeps it that way.

## Authentication and authorisation properties the browser suites assert

- the browser never calls the agent directly and never sends an `Authorization` header
- every authenticated POST requires the session CSRF token
- an application belonging to another borrower answers **404**, not 403, so existence is not leaked
- assertion replay is single-use; a tampered or reused assertion is rejected
- conversation ownership is enforced per account **and** per application
- `script-src 'self' blob:`, no `unsafe-inline`, no `unsafe-eval`
- logout destroys the session and signed-out deep links redirect to `/login?redirect-to=`
