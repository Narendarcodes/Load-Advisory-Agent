# Saral OCR: engines, fallback and deployment

**Default engine: PaddleOCR PP-OCRv5 mobile. Automatic fallback: Tesseract 5.** Both feed
the same PR #41 parser (`ocr/document_parser.py`), so field rules, masking and the
browser-safe result shape are identical whichever engine read the page.

## How a document is read

`ocr.extract_document(document_type, content, filename)` (unchanged signature) now runs
`ocr.chain.extract_document_chain`:

1. The file is validated once (size, extension, magic bytes). A bad file is refused before
   any engine starts.
2. **Deskew** (`ocr/preprocess.py`): a projection-profile estimate over ±8°, applied when the
   page is tilted by 0.4° or more. Pillow + numpy only. `SARAL_OCR_DESKEW=0` turns it off.
3. **Paddle** reads the page. A digital PDF's text layer is used directly (exact, no OCR),
   the same as the Tesseract path.
4. The attempt passes when every **critical field** for the document type is FOUND and read
   at a mean line confidence of at least `SARAL_OCR_MIN_CONFIDENCE` (default 70, 0-100):

   | Document | Critical fields |
   |---|---|
   | PAN card | PAN number, date of birth |
   | Aadhaar card | date of birth |
   | Salary slip | net salary, employee name |
   | Bank statement | salary credits, account holder |
   | Employment letter | employer, employment start date |

5. **Tesseract** runs when Paddle is not installed, cannot start, errors, or does not pass
   the gate. If neither passes, the better attempt is returned with a plain borrower
   warning ("...will be checked by a person...") and every unread field flagged for
   review. OCR never decides; ZEN does.

Unsupported document types are not re-read by the fallback (another engine cannot change
the type).

## Settings

| Variable | Default | Meaning |
|---|---|---|
| `SARAL_OCR_ENGINES` | `paddle,tesseract` | Engine order. `tesseract` = Tesseract only. Unknown names are ignored. |
| `SARAL_OCR_MIN_CONFIDENCE` | `70` | Confidence gate for critical fields before falling back. |
| `SARAL_OCR_DESKEW` | `1` | Deskew before OCR. |
| `PADDLE_OCR_DET_MODEL` / `PADDLE_OCR_REC_MODEL` | `PP-OCRv5_mobile_det` / `PP-OCRv5_mobile_rec` | Paddle models. Server models are not recommended (see memory). |
| `PADDLE_PDX_CACHE_HOME` | `~/.paddlex` | Where the models (~20 MB) are cached after first download. |
| `TESSERACT_CMD`, `OCR_LANG` | PATH, `eng` | Tesseract, as in PR #41. |

## Install

```bash
pip install -e apps/loan_advisory_portal                     # Pillow, pypdfium2, numpy
pip install -r apps/loan_advisory_portal/requirements-ocr-paddle.txt \
    --extra-index-url https://www.paddlepaddle.org.cn/packages/stable/cpu/
# Tesseract stays installed as the fallback (apt install tesseract-ocr tesseract-ocr-eng).
```

Docker: `infra/frappe/Dockerfile.ocr` installs Paddle by default
(`--build-arg SARAL_OCR_PADDLE=0` for a Tesseract-only image, then set
`SARAL_OCR_ENGINES=tesseract`). It also installs `libgomp1 libgl1 libglib2.0-0`, which the
Paddle wheels need.

## Memory guidance

* **~2 GB peak RSS per process** that has run Paddle mobile (measured 1.9 GB in the bake-off;
  see the real-sample benchmark in `OCR_BAKEOFF.md` §9). The models stay resident between
  pages, so the cost is paid once per worker, not per page.
* Every gunicorn/RQ worker that serves an OCR request loads its own copy. Budget
  **2.5 GB per OCR-serving worker** on top of the rest of the stack. On a 7-8 GB box with the
  agent stack running, allow one OCR worker, or set `SARAL_OCR_ENGINES=tesseract` (~75 MB).
* Do not use the server models on 7-8 GB hosts (~4.7 GB RSS, slower and no more accurate
  in the bake-off).
* First call per worker pays ~10 s of model load; later pages take ~0.9 s (4 vCPU).

## Data handling (unchanged from PR #41)

Bytes stay in memory; no temporary files. Raw recognised text never leaves the chain.
PAN is stored as `XXXXX1234X` and Aadhaar as `XXXX XXXX 1234`; neither full number nor
raw text is stored or logged.
