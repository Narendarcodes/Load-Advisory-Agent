# Loan Advisory Portal

Custom Frappe application that owns the borrower-facing experience of the Loan
Advisory Agent.

Responsibilities:

- Invitation-bound registration and the one-to-one `User` ↔ `Customer` mapping.
- Borrower profile and consent.
- Borrowing-facing whitelisted APIs with server-side ownership checks.
- Application creation and submission on top of Frappe Lending records.
- Feedback, notifications and portal assets.
- Short-lived signed assertions for the CopilotKit runtime and the agent service.
- LiveKit voice token minting (the LiveKit API secret never leaves the server).

Out of scope: underwriting rules (ZEN), agent orchestration (LangGraph), chat
transport (CopilotKit runtime) and traces (Langfuse). Those stay in the agent
stack.

## Install (disposable development site only)

```bash
bench --site <dev-site> install-app loan_advisory_portal
bench --site <dev-site> migrate
bench --site <dev-site> run-tests --app loan_advisory_portal
```

Never install or migrate this app against a shared site without an explicit
owner decision.

## OCR setup

**Engines:** PaddleOCR PP-OCRv5 mobile is the default; Tesseract is the automatic fallback
when Paddle is missing, fails, or reads a critical field with low confidence. Install Paddle
with `requirements-ocr-paddle.txt` (about 2-3 GB RSS per worker that runs it); without it the
app uses Tesseract alone. Settings, memory guidance and Docker notes:
`docs/saral/OCR_DEPLOY.md`.

The app's Python dependencies for image/PDF decoding are declared in
`pyproject.toml`. `install_portal_app.sh` copies that metadata and installs the
app in the bench environment so those dependencies are available at runtime.
Tesseract is a separate native executable; the app does not install or bundle it.

For OCR tests or a Python process running directly on Windows, set the executable
in that PowerShell process:

```powershell
$env:TESSERACT_CMD = 'C:\Program Files\Tesseract-OCR\tesseract.exe'
$env:OCR_LANG = 'eng'
.\.venv\Scripts\python.exe -m pytest tests/test_ocr_extractor.py tests/test_ocr_pdf.py -q
```

The documented Frappe deployment runs in a Linux Docker container, so a Windows
`.exe` path cannot be used by Frappe. The backend image must have Linux Tesseract
and its language data installed, and the backend process must receive a Linux
path such as `TESSERACT_CMD=/usr/bin/tesseract`. Installing Tesseract on the
Windows host does not make it available inside Docker.

`TESSERACT_CMD` is optional when Tesseract is on `PATH` or in a standard Windows
install location. The OCR service can still be imported without Tesseract; an
OCR request then returns an actionable unavailable response. Scanned PDFs need
Tesseract, while PDFs with an extractable text layer do not.
