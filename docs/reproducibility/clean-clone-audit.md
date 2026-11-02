# Clean-clone audit

Date 2026-11-02. Clone of `https://github.com/Narendarcodes/Load-Advisory-Agent.git`, branch `main`,
HEAD **`76ae289edcbc0ab0c03a1a73c8d2836909380600`**, 1,690 tracked files, into
`Documents/Projects/reproducibility-audit/frappe-clean-clone`. Nothing in this run read the developer
worktrees for source; the agent and the runtime were launched from the clone's own tree and its own
virtualenv, and the island was rebuilt inside the clone.

Verdict: **VERIFIED WITH LIMITATIONS** — see [final-reproducibility-report.md](final-reproducibility-report.md).

## What passed

| Step | Result |
| --- | --- |
| Clone from the remote | `git branch --show-current` = `main`, HEAD = `76ae289` |
| Python deps into a fresh venv | `pip install -r requirements.txt` succeeded (76 packages) |
| Test deps | `pip install -r requirements-test.txt` succeeded |
| `ruff check .` from the clone | `All checks passed!` |
| `pytest -q` from the clone | **685 passed, 15 skipped** in 109 s |
| `npm ci` (runtime, island, harnesses) | 345 / 1,041 / harness packages, lockfiles present and used |
| Island `tsc --noEmit` + `npm test` | clean, **86 passed** |
| Runtime `tsc` (app + test configs) + `npm test` | clean, **13 passed** |
| Island production build in the clone | succeeded, 407 chunks, **byte-identical to the committed bundle** (`git status` after building: no changes) |
| `bench new-site` with ERPNext, on a freshly created site | succeeded |
| `install-app lending` | succeeded |
| `install-app loan_advisory_portal` via `install_portal_app.sh` | succeeded; `list-apps` shows all four; re-running reports "already installed" |
| `bench --site <site> migrate` | succeeded, `after_migrate` re-applied custom fields and roles |
| `e2e_seed.seed` on the fresh site | `ACC-LOAP-2026-00001` and `ACC-LOAP-2026-00002` created from an empty database |
| `seed_evidence.py` (ZEN pipeline, run from the clone) | `{"state": "REJECTED", "decision": "REJECTED"}` and an evidence row |
| Frappe app tests | **193 tests OK** |
| Agent from the clone venv | `/healthz` 200 on `:8097` |
| Runtime from the clone build | `/api/copilotkit/info` 200 direct and through the front door |
| Browser journeys | **36/36** |
| HTTP security regressions | **39/39** |

## What failed first, and what was actually wrong

Each of these was reproduced, root-caused and fixed in the repository — not worked around on the
laptop.

| # | Failure observed | Root cause | Fix |
| --- | --- | --- | --- |
| 1 | `pytest` aborted: `ModuleNotFoundError: No module named 'rank_bm25'` in 3 modules | `rag/` helpers are imported by the tests and their packages are in `requirements-rag.txt`, which the base install does not pull; CI papered over it with an inline `pip install` of four packages | new `requirements-test.txt`; CI installs the manifests; the suite now collects fully from a clean install |
| 2 | `test_bajaj_rag.py` silently **skipped** instead of running (`could not import 'pymupdf'`) | `rag/corpus.py` imports `pymupdf` for PDF ingestion; it was declared in no manifest at all | declared in `requirements-rag.txt` and `requirements-test.txt`; the skip disappeared and the count moved 684 → 685 |
| 3 | `opentelemetry` importable only because `langfuse` happens to depend on it | `agent/observability.py` imports it directly | declared in `requirements.txt` |
| 4 | Journeys could not sign in: `waiting for locator("#login_email")` | the harness still drove Frappe's **built-in** login template (`#login_email`, `form.form-login`) while the shipped portal login uses `#email`, `#password`, `#login-button` | harness selectors corrected in `portal_journeys.py`, `phase_e_measure.py`, `phase_h_checks.py` |
| 5 | Guest check failed on the title `"Login"` | the page title is "Sign in · Loan Advisory"; the check asserted old copy | asserts redirect + title |
| 6 | `#documents tbody tr` never appeared; `expect_download` never fired | documents moved into their own workspace (`/borrower/documents`, `#doc-list`), and Download is a **form POST into a hidden iframe**, not an anchor with a file URL | checks retargeted to the documents workspace; the ownership assertion calls the same whitelisted `download_document` method with the browser's own session and verifies `%PDF` bytes |
| 7 | `#decision .badge--fail` count 0 | the card emits `badge--bad` for a rejection | corrected |
| 8 | `page.fill("#loan-purpose")` / `#loan-tenure` — "Element is not an `<input>`" | both became `<select>` controls; `"School fees"` and `"18"` are not even among the options | `select_option` with real options (`Education`, `24`) |
| 9 | `#review-list` not found | the review panel is `#review-body` | corrected |
| 10 | Clicking `#submit` did nothing and the run timed out waiting for navigation | **the product is right and the harness was wrong**: the review step refuses to submit until both consent boxes are accepted | added an assertion that submission is gated on consent, then accepts both and continues. This turned a false failure into real coverage |
| 11 | After submit, the wait for `/borrower/application?name=` timed out | a newly created application is handed to the **documents workspace** (`/borrower/documents?name=…&created=1`) | expectation corrected to the real route |
| 12 | `#upload-form button[type=submit]` timeout | the dropzone uploads on file selection; there is no submit button | click removed, with the reason recorded |
| 13 | `header nav a:visible` counted 0 at 390 px | navigation is now one visible `nav[aria-label="Main"]` region per breakpoint (rail / topbar / site-nav / tabbar) | selector corrected |
| 14 | "no assessment is invented before review" failed on the string `No assessment yet` | the copy became "The checks have been queued…" | rewritten to the actual invariant: no approval or rejection wording before review |
| 15 | The two `.details .tag` intent checks found nothing | the answer-details panel **no longer renders an intent chip**, and an explain turn contributes no block at all | one check removed rather than faked; the refusal turn still asserts its details panel renders. Counted honestly below |
| 16 | On re-verification, `bench --site <site> run-tests --app loan_advisory_portal` reported **386 tests, 2 failures, 32 errors** — twice the suite the site had passed an hour earlier | `install_portal_app.sh` copied the app with `docker cp "$SRC/."`. From a Windows host that form is ambiguous, and an MSYS-style host path (`/c/Users/…`) makes `docker cp` **append** the source directory name instead of replacing the destination. Every re-run therefore nested another `loan_advisory_portal/` inside the app tree, and the runner collected `tests/` from both copies. Nothing in Frappe complained: the site worked, the app imported, only the test count was wrong | the copy is now a single tarball streamed in and extracted to a replaced tree, and the script **refuses a tree whose shape is wrong** (exactly one `hooks.py`, module directory holding `__init__.py` + `doctype/` and nothing a level up). Verified by running the script twice: `find apps/loan_advisory_portal -name hooks.py` returns one path |
| 17 | On a site created by the documented bootstrap, 17 of those 193 tests failed — `ServiceUnavailable: voice is not configured` in `test_livekit`, `test_voice_assertion`, and `test_requested_application_scopes_the_island` | `livekit_token.configuration()` fails closed when the site has no `livekit_url` / `livekit_api_key` / `livekit_api_secret`, which is correct production behaviour and the state of every fresh site. The voice tests assumed a configured site because the developer's site had one | the voice tests now configure a deterministic in-process trio in `setUpClass` and restore the site in `tearDownClass` (`tests/utils.py: configure_voice_for_tests`). The existing guard tests still pass: they blank one key themselves to assert the failure |

## Re-verification after the fixes

The two rows above were found by re-running the Frappe suite rather than trusting the first pass, and both
were re-measured afterwards on the same fresh site:

```
bench --site <site> run-tests --app loan_advisory_portal
Ran 193 tests in 44.087s
OK
```

193 tests, one collection, no failures, on a site that only ever saw `create_site.sh`,
`install_portal_app.sh`, `migrate` and the seeds — no LiveKit server, no manual configuration, no
developer-laptop state. The HTTP security regressions were re-run against the restored manual-testing
environment at the end of the day: **39/39**.

**Coverage accounting.** The journeys went from 36 assertions to 36: two intent-chip assertions were
removed as testing UI that no longer exists, and two new ones were added — that submission is gated on
consent, and that refusal still renders its details panel. Nothing was weakened to make a check pass;
every change was made to match verified shipped behaviour.

## Failures found that were caused by the auditor, not the repository

1. **Volume collision.** Starting a second stack with `-p reprostack` mounted the **live** database,
   because `loanrangers.yml` pins volume names (`frappe_docker_db-data`, `frappe_docker_sites`) that do
   not carry the project prefix. MariaDB failed on `Can't lock aria control file`, and the retry reported
   `dependency db failed to start … unhealthy`; the second stack was abandoned, its containers removed.
   The live stack survived and its data was verified intact; nothing was written by the intruder
   container. Fixed in the repository by `infra/frappe/loanrangers.isolated.yml`, validated with
   `docker compose config` (isolated names, no published port). Note that `name: null` in an override
   does **not** clear a pinned name; only an explicit different name does.
2. **My own script bug.** `install_portal_app.sh` first used `docker exec <c> test -d <path>`, which in
   this image reports failure for a directory that exists. It wrongly reported the site was missing.
   Now it uses `bash -lc`.
3. **Where the audit site actually ran.** After the collision, `repro.local` was created on the
   already-running stack (its own site name, its own database, its own front door on `:8082`) rather than
   on a second stack. `loanrangers.isolated.yml` is therefore verified by `docker compose config` —
   correct names, correct ports, correct volumes — and by reading, not by a completed
   second-stack bring-up. A future run that wants true process isolation should use it, and should expect
   MariaDB to take a minute to initialise an empty data directory before the backend is reachable.

## What was not re-verified from the clone

- **Policy retrieval and citations.** `LOAN_POLICY_DIR` has no value in the repository; on the
  author's laptop it points at an index built in another checkout. The clone run started the agent with
  `--no-rag`, so the assistant answered from recorded evidence only. Citation behaviour was therefore
  **not** reproduced from a clean clone, and must not be claimed as such.
- **Building `loanrangers-frappe:16` from scratch.** The frappe_docker clone was fetched at the
  documented pin to confirm the path exists and the Containerfile layout, but the ~20-minute image
  build was not run; the fresh site used the locally available image. A new machine must run that
  build, and the repository contains no Dockerfile of its own.
- **Linux and macOS hosts.** Everything here ran on Windows + Docker Desktop.
- **The Node browser harnesses (axe, contrast, keyboard, missing-information, thread continuity)** were
  not re-run from the clone; they were re-run against the primary environment during the release work
  with the same built assets the clone reproduces byte-for-byte. The stub they use for deterministic
  payloads is test-only.
