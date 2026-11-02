# Testing

Six layers, each answering a different question. Run them in this order; each has a command that was
executed in the 2026-11-02 clean-clone audit, with the numbers that came out.

| # | Layer | Command | Fresh result |
| --- | --- | --- | --- |
| L1 | Frappe application tests | `bench --site <site> run-tests --app loan_advisory_portal` | **193 OK** |
| L2 | Host Python suite | `python -m pytest -q` | **685 passed, 15 skipped** |
| L3a | Assistant island | `cd apps/web/assistant && npm run typecheck && npm test` | clean, **86 passed** |
| L3b | Runtime gateway | `cd apps/runtime && npm run typecheck && npm test` | clean, **13 passed** |
| L4 | Browser journeys | `python tests/e2e/portal_journeys.py --seed <temp>/e2e1.json` | **36/36** |
| L5 | HTTP security regressions | `python tests/e2e/portal_security.py --seed <temp>/e2e1.json` | **39/39** |
| L6 | Accessibility and responsive | `npm --prefix tests/e2e run a11y` / `contrast` / `keyboard` | **103 runs, 0 violations** / **0 below AA, 0 indeterminate** / **605 stops, 0 structural findings** |

Detailed counts per module live in [../testing/borrower-platform-test-plan.md](borrower-platform-test-plan.md)
and are the source of truth for module-level numbers. Production-readiness analysis is in
[production-readiness.md](production-readiness.md); responsive, accessibility and performance notes are in
[responsive-accessibility-performance.md](responsive-accessibility-performance.md).

## Setup a test run needs

A disposable site with `allow_tests` true, seeded by `e2e_seed.seed` (credentials copied out to a host
temp directory and deleted from the container), and one authentic decision recorded by
`seed_evidence.py`. Browser layers need the front door, the runtime and the agent running; see
[../development/local-development.md](../development/local-development.md).

`FRAPPE_URL` for any script that talks to the site must be the **front door for that site**, and
`FRAPPE_LOAN_COMPANY` / `FRAPPE_LOAN_PRODUCT` must match the seed (`LAP Test NBFC` / `LAP-TEST-001`).
With the adapter's built-in defaults, reads return nothing and tests fail in a way that looks like an
application bug.

## Deterministic fixtures vs the live model

| Upstream | What it proves |
| --- | --- |
| live agent on `:8095` (`openai/gpt-oss-120b` via Groq, or an `LLM_BASE` endpoint) | real inference: wording varies, latency varies, citations come from real retrieval |
| AG-UI stub on `:8096` (`tests/e2e/agui_stub.cjs`) | the browser contract: card rendering, thread lifecycle, five-viewport layout, negative payloads. Deterministic and repeatable, and **not** a model answer |

The stub replaces only the agent upstream: the browser still signs in through Frappe and the runtime
still mints a real assertion, so the authentication boundary stays on the path under test. Never present
a stub replay as model behaviour. If an answer arrives instantly and identically every time, check
`AGENT_AGUI_URL`.

## The write guard, and three rules it encodes

Every browser harness attaches `tests/e2e/write_guard.cjs` before its first navigation. It classifies
each non-GET request against a declared list and fails the run on anything undeclared.

1. **A POST is not a write.** Frappe posts every whitelisted method, so `get_profile` and
   `list_applications` arrive as POSTs. The guard carries declared reads by name, each checked against
   the server code.
2. **A validation state must really be invalid.** The wizard name field carries `maxlength=140`, so
   "a name longer than the limit" produces a *valid* form. Ask for the blank case instead.
3. **A run that holds a conversation leaves a transcript behind.** `record_turn` is a legitimate declared
   write; the `Advisory Conversation` outlives the fixture unless teardown removes it. Finish every
   journey run with `e2e_seed.teardown` and check `conversationsRemoved`.

## Two hazards that produced false failures during this audit

- **Never run `bench run-tests` and a browser suite against the same site simultaneously.** A concurrent
  run made `GET /borrower` return 500 mid-mutation, which the browser reported as both a 500 and a CSP
  violation. Re-run in isolation, clean.
- **Harness selectors drift behind the UI.** Thirteen assertions in `portal_journeys.py` were stale
  (old login template ids, a documents workspace that moved, `<select>` controls replacing number
  inputs, a copy change, and consent gating that the harness did not perform). They were corrected to
  match verified shipped behaviour in the audit, not weakened: see
  [../reproducibility/clean-clone-audit.md](../reproducibility/clean-clone-audit.md).

## Test data teardown

```bash
docker exec <backend> bash -lc 'cd /home/frappe/frappe-bench && bench --site <site> execute \
  loan_advisory_portal.tests.e2e_seed.teardown --kwargs "{\"tag\":\"e2e1\"}"'
rm -rf <temp>/loanportal-e2e        # seed credentials, env file, traces
```

It removes users, customers, applications, files, evidence, state logs and conversations for that tag. It
does not remove the application the journeys themselves create, and it never touches other tags' fixtures.
