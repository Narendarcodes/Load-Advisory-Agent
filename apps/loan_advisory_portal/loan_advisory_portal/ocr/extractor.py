"""Raw text extraction with Tesseract.

Documents and rendered pages stay in memory. OCR is sent to Tesseract over stdin and its
TSV output is read from stdout, so document content is never written to a temporary file.
Pillow and pypdfium2 are imported only when needed, allowing parsing tests to run without
the image/PDF dependencies.

Two limits keep the footprint inside a small laptop budget:

* at most ``MAX_OCR_PAGES`` pages are rasterised and recognised per PDF;
* a PDF is only rasterised when its text layer is missing or too thin to trust.
"""

import csv
import os
import re
import shutil
import subprocess
import sys
from functools import lru_cache
from io import BytesIO, StringIO
from pathlib import Path

from .schemas import TextLine

# Keep in step with `loan_advisory_portal.api.documents`: the upload endpoint already
# refuses anything else, and the extractor must not be laxer than the door.
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
MAX_BYTES = 10 * 1024 * 1024
MAX_OCR_PAGES = 3           # rasterised pages per PDF, bounded for memory
MAX_TEXT_LAYER_PAGES = 10   # text extraction is cheap; still bounded
OCR_DPI = 200               # enough for 10-12 pt print, ~1/2 the memory of 300 DPI
MAX_PIXELS = 50_000_000     # refuse decompression bombs before Pillow allocates
MAX_IMAGE_DIMENSION = 3500
OCR_TIMEOUT_SECONDS = 60
MIN_TEXT_LAYER_CHARS = 20   # below this a page is treated as a scan, not a text page
TESSDATA_HINT = "eng"


class OcrError(Exception):
    """Base class for anything the caller should show as a document error."""


class UnsupportedDocument(OcrError):
    """Wrong extension, wrong magic bytes, or too large."""


class ExtractionFailed(OcrError):
    """The bytes are a supported format we could not read (corrupt, empty, encrypted)."""


class OcrUnavailable(OcrError):
    """Tesseract or required OCR language data are unavailable on this machine."""


_IS_WINDOWS = sys.platform.startswith("win")
_WINDOWS_CANDIDATES = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
)

_MAGIC = {
    ".pdf": b"%PDF",
    ".jpg": b"\xff\xd8\xff",
    ".jpeg": b"\xff\xd8\xff",
    ".png": b"\x89PNG\r\n\x1a\n",
}


# --------------------------------------------------------------------------- validation

def extension_of(filename: str) -> str:
    """Lower-case extension of a *name*, never used as a path."""
    return os.path.splitext(os.path.basename(filename or ""))[1].lower()


def _magic_matches(content: bytes, extension: str) -> bool:
    expected = _MAGIC.get(extension)
    return expected is not None and content.startswith(expected)


def validate_document(content: bytes, filename: str) -> str:
    """Check size, extension and magic bytes. Returns the normalised extension.

    A renamed executable or a truncated upload is rejected here rather than handed to
    Pillow, which keeps the failure message useful and the parser away from odd inputs.
    """
    if not content:
        raise ExtractionFailed("The file is empty.")
    extension = extension_of(filename)
    if extension not in ALLOWED_EXTENSIONS:
        raise UnsupportedDocument("Only PDF, JPEG and PNG documents can be read.")
    if len(content) > MAX_BYTES:
        raise UnsupportedDocument("The file is larger than 10 MB.")
    if not _magic_matches(content, extension):
        raise UnsupportedDocument("The file contents do not match its extension.")
    return extension


# --------------------------------------------------------------------------- tesseract setup

@lru_cache(maxsize=1)
def tesseract_command() -> str:
    """Resolve the binary once. ``TESSERACT_CMD`` wins, then PATH, then Windows defaults."""
    override = os.environ.get("TESSERACT_CMD", "").strip()
    if override:
        if Path(override).is_file():
            return override
        raise OcrUnavailable("TESSERACT_CMD is set but does not point at a file.")

    found = shutil.which("tesseract")
    if found:
        return found

    if _IS_WINDOWS:
        for candidate in _WINDOWS_CANDIDATES:
            if Path(candidate).is_file():
                return candidate

    raise OcrUnavailable(
        "Tesseract is not installed or not on PATH. Install it and set TESSERACT_CMD."
    )


def _pillow():
    try:
        from PIL import Image, UnidentifiedImageError  # noqa: PLC0415
    except ImportError as exc:  # pragma: no cover
        raise OcrUnavailable("Pillow is not installed.") from exc
    return Image, UnidentifiedImageError


@lru_cache(maxsize=1)
def _version_token() -> str:
    """`tesseract --version` first line, cached. Raises OcrUnavailable if it will not run."""
    command = tesseract_command()
    try:
        output = subprocess.run(
            [command, "--version"],
            capture_output=True,
            text=True,
            timeout=15,
            check=False,
        )
    except (OSError, subprocess.SubprocessError) as exc:
        raise OcrUnavailable("Tesseract could not be started.") from exc
    match = re.search(r"tesseract\s+v?(\d+(?:\.\d+)*)", output.stdout or "", re.IGNORECASE)
    if not match:
        raise OcrUnavailable("Tesseract did not report a version.")
    return match.group(1)


def tesseract_version() -> str:
    """Version string such as `5.4.0`; what the UI shows next to the engine name."""
    return _version_token()


def is_available() -> bool:
    """Cheap probe used by tests and by the portal before promising OCR."""
    try:
        _version_token()
    except OcrUnavailable:
        return False
    return True


def language() -> str:
    """`OCR_LANG` (default `eng`) so a site can add a Hindi pack without a code change."""
    return os.environ.get("OCR_LANG", TESSDATA_HINT).strip() or TESSDATA_HINT


# --------------------------------------------------------------------------- OCR

def _ocr_lines(image) -> list[TextLine]:
    """Group Tesseract words into lines and average their word confidences."""
    image_buffer = BytesIO()
    try:
        image.save(image_buffer, format="PNG")
    except OSError as exc:
        raise ExtractionFailed("The image could not be prepared for OCR.") from exc

    try:
        output = subprocess.run(
            [tesseract_command(), "stdin", "stdout", "-l", language(), "tsv"],
            input=image_buffer.getvalue(),
            capture_output=True,
            timeout=OCR_TIMEOUT_SECONDS,
            check=False,
        )
    except subprocess.TimeoutExpired as exc:
        raise ExtractionFailed("Tesseract took too long to read this document.") from exc
    except OSError as exc:
        raise OcrUnavailable("Tesseract could not be started.") from exc

    if output.returncode:
        error = output.stderr.decode("utf-8", errors="replace").lower()
        if "failed loading language" in error or "error opening data file" in error:
            raise OcrUnavailable("Tesseract could not load the configured language data.")
        raise ExtractionFailed("Tesseract could not read this document.")

    grouped: dict[tuple[int, int, int], list[tuple[str, float]]] = {}
    rows = csv.DictReader(
        StringIO(output.stdout.decode("utf-8", errors="replace")),
        delimiter="\t",
    )
    for row in rows:
        text = (row.get("text") or "").strip()
        if not text or row.get("level") != "5":
            continue
        try:
            confidence = float(row["conf"])
            key = (
                int(row["block_num"]),
                int(row["par_num"]),
                int(row["line_num"]),
            )
        except (KeyError, TypeError, ValueError):
            confidence = -1.0
            try:
                key = (int(row["block_num"]), int(row["par_num"]), int(row["line_num"]))
            except (KeyError, TypeError, ValueError):
                continue
        grouped.setdefault(key, []).append((text, confidence))

    lines: list[TextLine] = []
    for key in sorted(grouped):
        words = grouped[key]
        confidences = [score for _, score in words if score >= 0]
        mean = sum(confidences) / len(confidences) if confidences else 0.0
        lines.append(TextLine(text=" ".join(text for text, _ in words), confidence=mean))
    return lines


def _load_image(content: bytes):
    Image, UnidentifiedImageError = _pillow()
    try:
        image = Image.open(BytesIO(content))
    except UnidentifiedImageError as exc:
        raise UnsupportedDocument("The file is not a readable image.") from exc
    except Image.DecompressionBombError as exc:
        raise UnsupportedDocument("The image is too large to read safely.") from exc
    except OSError as exc:
        raise ExtractionFailed("The image is truncated or damaged.") from exc

    width, height = image.size
    if width * height > MAX_PIXELS:
        image.close()
        raise UnsupportedDocument("The image is too large to read safely.")
    try:
        image.load()
    except OSError as exc:
        image.close()
        raise ExtractionFailed("The image is truncated or damaged.") from exc
    if image.mode not in ("RGB", "L"):
        converted = image.convert("RGB")
        image.close()
        image = converted
    # A phone photo at 12 MP is slower to recognise and no more accurate than ~3000 px.
    longest = max(width, height)
    if longest > MAX_IMAGE_DIMENSION:
        scale = MAX_IMAGE_DIMENSION / longest
        resized = image.resize((max(1, int(width * scale)), max(1, int(height * scale))))
        image.close()
        image = resized
    return image


def _pdfium():
    try:
        import pypdfium2  # noqa: PLC0415 - optional dependency, imported on demand
    except ImportError as exc:  # pragma: no cover
        raise OcrUnavailable("pypdfium2 is not installed, so PDFs cannot be read.") from exc
    return pypdfium2


def extract_from_image(content: bytes) -> tuple[list[TextLine], int]:
    """OCR one image in memory. Returns (lines, page_count=1)."""
    image = _load_image(content)
    try:
        lines = _ocr_lines(image)
    finally:
        image.close()
    return lines, 1


def extract_from_pdf(content: bytes) -> tuple[list[TextLine], int, bool]:
    """Read a PDF, preferring its text layer and rasterising only scanned pages.

    Returns ``(lines, pages_read, used_text_layer)``. Pages are closed as soon as they
    have been rendered so peak memory stays near one bitmap at a time.
    """
    pdfium = _pdfium()
    try:
        document = pdfium.PdfDocument(content)
    except Exception as exc:  # pdfium raises its own error type for corrupt/encrypted files
        raise ExtractionFailed("The PDF is damaged, encrypted or not a PDF.") from exc

    try:
        total = len(document)
        if total == 0:
            raise ExtractionFailed("The PDF has no pages.")

        lines: list[TextLine] = []
        used_text_layer = False
        pages_read = 0
        rasterised = 0

        for index in range(min(total, MAX_TEXT_LAYER_PAGES)):
            pages_read += 1
            page = document[index]
            try:
                text_page = page.get_textpage()
                try:
                    page_text = text_page.get_text_range() or ""
                finally:
                    text_page.close()
                page_text = page_text.strip()
                if len(page_text) >= MIN_TEXT_LAYER_CHARS:
                    used_text_layer = True
                    for raw in page_text.splitlines():
                        cleaned = raw.strip()
                        if cleaned:
                            # A text layer is exact, so its confidence is effectively 100.
                            lines.append(TextLine(text=cleaned, confidence=100.0))
                    continue

                if rasterised >= MAX_OCR_PAGES:
                    continue
                width, height = page.get_size()
                scale = OCR_DPI / 72
                rendered_width = width * scale
                rendered_height = height * scale
                if (
                    rendered_width <= 0
                    or rendered_height <= 0
                    or max(rendered_width, rendered_height) > MAX_IMAGE_DIMENSION
                    or rendered_width * rendered_height > MAX_PIXELS
                ):
                    raise UnsupportedDocument("The PDF page is too large to read safely.")
                rasterised += 1
                bitmap = page.render(scale=scale)
                try:
                    image = bitmap.to_pil()
                    try:
                        lines.extend(_ocr_lines(image))
                    finally:
                        image.close()
                finally:
                    bitmap.close()
            finally:
                page.close()

        return lines, pages_read, used_text_layer
    except OcrError:
        raise
    except Exception as exc:
        raise ExtractionFailed("The PDF could not be read.") from exc
    finally:
        document.close()


def extract_lines(content: bytes, filename: str) -> tuple[list[TextLine], int, bool]:
    """Validate, then extract lines. ``used_text_layer`` is False for images."""
    extension = validate_document(content, filename)
    if extension == ".pdf":
        return extract_from_pdf(content)
    lines, pages = extract_from_image(content)
    return lines, pages, False
