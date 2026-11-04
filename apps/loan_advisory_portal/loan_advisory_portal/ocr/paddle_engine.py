"""PaddleOCR (PP-OCRv5 mobile) behind the same line interface as the Tesseract path.

`extract_lines_paddle(content, filename)` returns ``(lines, pages, used_text_layer)``, the
exact shape of `extractor.extract_lines`, so `document_parser.parse` and every rule in
PR #41 run unchanged on either engine. `pipeline.extract_document` reaches it through
`chain.extract_document_chain`: Paddle is the default engine and Tesseract the fallback.

The mobile models are the default (bake-off: better than server on this hardware, ~2 GB RSS,
~0.9 s/page on 4 vCPU). Override with ``PADDLE_OCR_DET_MODEL`` / ``PADDLE_OCR_REC_MODEL``.

PaddleOCR returns one box per text region, not per line: a table row comes back as five
boxes. `group_boxes_into_lines` merges boxes whose vertical centres overlap into one
left-to-right line, which is what the parser's line regexes expect.

Like the Tesseract path, document bytes stay in memory (Paddle accepts a numpy array), no
raw text is returned to callers of the pipeline, and the model is loaded once per process.
Requires ``paddlepaddle`` (CPU build) and ``paddleocr>=3``; when they are missing,
`OcrUnavailable` is raised so the chain falls back to Tesseract.
"""

from __future__ import annotations

import os
import threading
from io import BytesIO

from .extractor import (
    MAX_IMAGE_DIMENSION,
    MAX_OCR_PAGES,
    MAX_TEXT_LAYER_PAGES,
    MIN_TEXT_LAYER_CHARS,
    OCR_DPI,
    ExtractionFailed,
    OcrUnavailable,
    _load_image,
    validate_document,
)
from .schemas import TextLine

DEFAULT_DET = os.environ.get("PADDLE_OCR_DET_MODEL", "PP-OCRv5_mobile_det")
DEFAULT_REC = os.environ.get("PADDLE_OCR_REC_MODEL", "PP-OCRv5_mobile_rec")
MIN_BOX_SCORE = 0.30  # boxes below this are almost always watermark fragments or noise

_lock = threading.Lock()
_engines: dict[tuple[str, str, bool], object] = {}


def is_available() -> bool:
    try:
        import paddle  # noqa: F401, PLC0415
        import paddleocr  # noqa: F401, PLC0415
    except Exception:  # noqa: BLE001 - any import failure means "not installed here"
        return False
    return True


def engine_version() -> str:
    try:
        import paddleocr  # noqa: PLC0415
    except Exception:  # noqa: BLE001
        return "unknown"
    return f"paddleocr {getattr(paddleocr, '__version__', '?')} ({DEFAULT_DET}/{DEFAULT_REC})"


def _engine(det: str = DEFAULT_DET, rec: str = DEFAULT_REC, orientation: bool = False):
    key = (det, rec, orientation)
    with _lock:
        if key not in _engines:
            try:
                from paddleocr import PaddleOCR  # noqa: PLC0415
            except Exception as exc:  # noqa: BLE001
                raise OcrUnavailable("PaddleOCR is not installed on this machine.") from exc
            try:
                _engines[key] = PaddleOCR(
                    text_detection_model_name=det,
                    text_recognition_model_name=rec,
                    use_doc_orientation_classify=orientation,
                    use_doc_unwarping=False,
                    use_textline_orientation=orientation,
                    device="cpu",
                )
            except Exception as exc:  # noqa: BLE001 - missing models / bad runtime: let Tesseract take over
                raise OcrUnavailable("PaddleOCR could not start on this machine.") from exc
        return _engines[key]


def group_boxes_into_lines(boxes: list[tuple[float, float, float, float]], texts: list[str],
                           scores: list[float]) -> list[TextLine]:
    """Merge region boxes into reading-order lines.

    A box joins a line when its vertical centre is within 0.45 x the smaller of its own
    height and the line's median height. Lines are anchored on their mean centre, not on
    a growing min/max span, so a tall box cannot chain neighbouring rows together. Boxes
    taller than 1.8 x the page's median box height (rotated watermark text, stamps) are
    kept as lines of their own. Within a line, boxes are joined left to right with a single
    space; the line's confidence is the mean box score on Tesseract's 0..100 scale.
    """
    items = [
        (x0, y0, x1, y1, text.strip(), float(score))
        for (x0, y0, x1, y1), text, score in zip(boxes, texts, scores)
        if text and text.strip() and score >= MIN_BOX_SCORE
    ]
    if not items:
        return []
    heights = sorted(item[3] - item[1] for item in items)
    median_h = max(heights[len(heights) // 2], 1.0)
    items.sort(key=lambda item: ((item[1] + item[3]) / 2, item[0]))
    rows: list[dict] = []
    for item in items:
        x0, y0, x1, y1, _, _ = item
        h = max(y1 - y0, 1.0)
        c = (y0 + y1) / 2
        if h > 1.8 * median_h:
            rows.append({"c": c, "h": h, "items": [item], "solo": True})
            continue
        target = None
        for row in reversed(rows[-6:]):
            if row["solo"]:
                continue
            if abs(c - row["c"]) <= 0.45 * min(h, row["h"]):
                target = row
                break
        if target is None:
            rows.append({"c": c, "h": h, "items": [item], "solo": False})
        else:
            target["items"].append(item)
            n = len(target["items"])
            target["c"] = (target["c"] * (n - 1) + c) / n
            hs = sorted(i[3] - i[1] for i in target["items"])
            target["h"] = max(hs[len(hs) // 2], 1.0)
    rows.sort(key=lambda row: row["c"])
    lines = []
    for row in rows:
        members = sorted(row["items"], key=lambda item: item[0])
        text = " ".join(item[4] for item in members)
        confidence = 100.0 * sum(item[5] for item in members) / len(members)
        lines.append(TextLine(text=text, confidence=round(confidence, 1)))
    return lines


def ocr_image_lines(image, *, det: str = DEFAULT_DET, rec: str = DEFAULT_REC,
                    orientation: bool = False) -> list[TextLine]:
    """OCR one PIL image already validated and size-capped by `_load_image`."""
    import numpy as np  # noqa: PLC0415

    from .preprocess import deskew  # noqa: PLC0415

    levelled = deskew(image)
    array = np.asarray(levelled.convert("RGB"))[:, :, ::-1]
    if levelled is not image:
        levelled.close()  # Paddle expects BGR like OpenCV
    try:
        results = _engine(det, rec, orientation).predict(array)
    except OcrUnavailable:
        raise
    except Exception as exc:  # noqa: BLE001 - Paddle raises bare RuntimeErrors
        raise ExtractionFailed("PaddleOCR could not read this document.") from exc
    if not results:
        return []
    page = results[0]
    boxes = [tuple(float(v) for v in box) for box in page["rec_boxes"]]
    return group_boxes_into_lines(boxes, list(page["rec_texts"]), list(page["rec_scores"]))


def extract_lines_paddle(content: bytes, filename: str) -> tuple[list[TextLine], int, bool]:
    """Same contract as `extractor.extract_lines`, using PaddleOCR for the recognition."""
    extension = validate_document(content, filename)
    if extension != ".pdf":
        image = _load_image(content)
        try:
            return ocr_image_lines(image), 1, False
        finally:
            image.close()
    try:
        import pypdfium2  # noqa: PLC0415
    except ImportError as exc:  # pragma: no cover
        raise OcrUnavailable("pypdfium2 is not installed, so PDFs cannot be read.") from exc
    try:
        pdf = pypdfium2.PdfDocument(BytesIO(content))
    except Exception as exc:  # noqa: BLE001
        raise ExtractionFailed("The PDF could not be opened.") from exc
    lines: list[TextLine] = []
    pages = 0
    rasterised = 0
    used_text_layer = False
    try:
        for index in range(min(len(pdf), MAX_TEXT_LAYER_PAGES)):
            page = pdf[index]
            try:
                # A digital PDF's text layer is exact: use it, as the Tesseract path does.
                text_page = page.get_textpage()
                try:
                    page_text = (text_page.get_text_range() or "").strip()
                finally:
                    text_page.close()
                if len(page_text) >= MIN_TEXT_LAYER_CHARS:
                    used_text_layer = True
                    lines.extend(TextLine(text=raw.strip(), confidence=100.0)
                                 for raw in page_text.splitlines() if raw.strip())
                    pages += 1
                    continue
                if rasterised >= MAX_OCR_PAGES:
                    continue
                width, height = page.get_size()
                scale = OCR_DPI / 72
                if max(width, height) * scale > MAX_IMAGE_DIMENSION:
                    scale = MAX_IMAGE_DIMENSION / max(width, height)
                bitmap = page.render(scale=scale).to_pil()
            finally:
                page.close()
            try:
                lines.extend(ocr_image_lines(bitmap))
            finally:
                bitmap.close()
            rasterised += 1
            pages += 1
    finally:
        pdf.close()
    return lines, pages, used_text_layer


__all__ = ["engine_version", "extract_lines_paddle", "group_boxes_into_lines", "is_available",
           "ocr_image_lines"]
