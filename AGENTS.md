# AGENTS.md

Guidance for coding agents working in this repo. Saral is a loan-advisory portal: it explains a
recorded decision and its reasons, and a person always decides. **Saral explains, never decides.**

## Architecture (10 lines)

1. `apps/loan_advisory_portal` is a Frappe app: borrower pages (`www/borrower/*.html` + `*.py`),
   portal JS (`public/js/pages/*.js`), and the built assistant island (`public/js/assistant/`).
2. The front door is nginx on `127.0.0.1:8081`; it pins the site to `p1loan.local` and proxies
   `/api/copilotkit` to the CopilotKit runtime on the host (`:4200`). Port `8080` is the Frappe
   frontend directly and does **not** proxy the chat.
3. The CopilotKit runtime (`apps/runtime`, Node) exchanges the borrower's Frappe cookie + CSRF
   header for a 60-second assertion, then calls the agent over AG-UI. It holds no lending rules.
4. The agent (`apps/api/src/loan_advisory`, FastAPI on `:8095`) verifies the assertion, runs the
   LangGraph agent, and returns structured state. Policy retrieval is RAG (`rag/`) and is off in
   the local run (`--no-rag`, `SARAL_NO_RAG_CHAT=1`).
5. Decisions are made by ZEN (`decision_engine/`) through `ops/decision_runner.py`, which polls
   SUBMITTED applications every `SARAL_DECIDE_INTERVAL_S` seconds and writes `Loan Decision
   Evidence`. OCR, bureau and KYC are read-only inputs to that run.
6. OCR runs in the GPU sidecar (`infra/ocr`, PaddleOCR on `:8866`); the backend sends pages to it
   over `SARAL_OCR_URL` and parses the lines deterministically (`ocr/document_parser.py`).
7. Synthetic data (`synthetic_data/saral_kyc_bank`) is generated, seeded and labelled; it is the
   only data the local site carries. Real people, numbers and documents never enter this repo.
8. Tests are pytest (`tests/`, ~1,900 tests). The pre-commit hook runs them; never `--no-verify`.
9. The dev panel (`saral_dev_panel: 1` in the site config) shows the pipeline drawer: submit, OCR,
   bureau, every ZEN rule and the outcome. Production sites leave it off.
10. Docker Compose project is `saral_cadra` (`infra/frappe/saral_cadra*.yml`); the run scripts live
    outside the repo in `C:\Users\golla\saral_cadra-run`.

## Start everything

```powershell
powershell -ExecutionPolicy Bypass -File C:\Users\golla\saral_cadra-run\start-app.ps1
```

That brings up the Frappe stack + GPU OCR, then the host services (bureau, kyc, agent, chat
runtime, decider), and prints a port table. Open <http://127.0.0.1:8081/login>.

Check the whole environment in one pass (exit 0 = pass, 1 = failures, 2 = Docker down):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/doctor.ps1        # pass/fail table
powershell -ExecutionPolicy Bypass -File scripts/doctor.ps1 -Json  # machine-readable
```

Logins are in `C:\Users\golla\saral_cadra-run\LOGINS.md` (synthetic accounts only).

## Tests

```powershell
# from the repo root — always the repo virtualenv, never the system interpreter
.\.venv\Scripts\python.exe -m pytest -q tests
.\.venv\Scripts\python.exe -m pytest -q tests/test_ocr_parsing.py   # one file
```

Install test-only deps with `.\.venv\Scripts\python.exe -m pip install -r requirements.txt -r
requirements-test.txt`. The pre-commit hook (`.githooks/pre-commit`, enabled via
`git config core.hooksPath .githooks`) already uses `.venv` and fails fast with that command.

Assistant island unit tests (Vitest, separate from pytest):

```powershell
cd apps/web/assistant; npm test
```

## Hard rules

- The tagline is **"Saral explains, never decides."** Never change it (footer, og:description, tests).
- Do not create or edit borrowers, loans, applications or Frappe users. Use the synthetic logins
  read-only.
- Do not start Gnani. RAG stays disabled for the local run (Groq, no RAG).
- Never `git reset`, `clean`, `rebase`, `force` or `push`. Local commits only.
- Never `git commit --no-verify`; the hook runs the full suite.
- One purpose per screen, one primary action, short helper text kept and decorative copy cut.

## Where the copy lives

- Borrower pages: `apps/loan_advisory_portal/loan_advisory_portal/www/borrower/*.html` and `*.py`.
- Page behaviour: `apps/loan_advisory_portal/loan_advisory_portal/public/js/pages/*.js`.
- Assistant island source: `apps/web/assistant/src/**`. The portal serves the **built** bundle in
  `apps/loan_advisory_portal/loan_advisory_portal/public/js/assistant/`; after editing the source,
  run `npm run build` in `apps/web/assistant` (the Frappe container has no Node).
- Dev panel: `public/js/devpanel.js`, gated on `saral_dev_panel`.

## OCR chain

`extract_document` (`ocr/pipeline.py`) runs `SARAL_OCR_ENGINES` in order and parses every attempt
with the same `document_parser.parse`; the first attempt whose critical fields clear
`SARAL_OCR_MIN_CONFIDENCE` wins, otherwise the best attempt is returned as `manual_review`.

| Env var | Local value | Meaning |
|---|---|---|
| `SARAL_OCR_URL` | `http://ocr:8866` | GPU sidecar. Empty means in-process PaddleOCR. |
| `SARAL_OCR_ENGINES` | `paddle` | Engine order. The backend image has no Tesseract, so it is not listed. |
| `SARAL_OCR_MIN_CONFIDENCE` | `70` | Critical-field gate before falling back. |
| `SARAL_OCR_DESKEW` | `1` | Pillow/numpy deskew before OCR. |

The local override is `infra/frappe/saral_cadra.local.yml`.

## Conventions

- Copy is plain words that say what to do next; every list and form has empty, loading and error
  states. Money is shown as `Rs 38,000` and date fields use a numeric keypad.
- Accessibility: a label on every input, visible focus, 4.5:1 contrast, full keyboard operation.
- Health endpoints return JSON: the OCR sidecar `GET /health` → `{ok, loaded, device, models}`;
  the agent `GET /healthz` → `{ok}`.
