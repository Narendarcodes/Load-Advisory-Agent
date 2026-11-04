"""Image clean-up before OCR: deskew only, in memory, with Pillow and numpy.

The bake-off (docs/saral/OCR_BAKEOFF.md, finding 5) found rotation to be the weakest case
for both engines: 2-7 degree tilts dropped Tesseract to 42% field accuracy and broke
Paddle's row grouping for bank tables. A phone photo of a card or a slip is rarely level.

`deskew` estimates the skew with a projection profile: the page is binarised on a small
copy, rotated through candidate angles, and the angle whose row sums have the highest
variance (text lines line up with pixel rows) wins. A coarse 1 degree search over
+/-``MAX_ANGLE`` is refined in 0.25 degree steps. Pages already level within
``MIN_ANGLE`` are returned untouched, so clean scans pay only the estimate (~50-150 ms).

No OpenCV is needed. Set ``SARAL_OCR_DESKEW=0`` to switch it off.
"""

from __future__ import annotations

import os

MAX_ANGLE = 8.0       # beyond this a photo needs re-taking, not straightening
MIN_ANGLE = 0.4       # smaller tilts do not hurt either engine
_WORK_SIZE = 900      # longest side of the copy used for the estimate
_TRUE = {"1", "true", "yes", "on"}


def enabled() -> bool:
    return os.environ.get("SARAL_OCR_DESKEW", "1").strip().lower() in _TRUE


def _ink(image):
    """Small binarised copy: True where there is ink."""
    import numpy as np  # noqa: PLC0415

    gray = image.convert("L")
    width, height = gray.size
    scale = min(1.0, _WORK_SIZE / max(width, height, 1))
    if scale < 1.0:
        gray = gray.resize((max(1, int(width * scale)), max(1, int(height * scale))))
    array = np.asarray(gray, dtype=np.float32)
    threshold = min(array.mean() - 0.5 * array.std(), 160.0)
    return array < threshold


def _score(ink, angle: float) -> float:
    import numpy as np  # noqa: PLC0415
    from PIL import Image  # noqa: PLC0415

    picture = Image.fromarray((ink * 255).astype("uint8"))
    rotated = np.asarray(picture.rotate(angle, resample=Image.NEAREST, expand=False, fillcolor=0))
    rows = rotated.sum(axis=1, dtype=np.float64)
    return float(rows.var())


def estimate_skew(image) -> float:
    """Angle in degrees (counter-clockwise, Pillow's convention) that levels the text."""
    ink = _ink(image)
    if ink.sum() < 50:  # blank or nearly blank page: nothing to level
        return 0.0
    coarse = [a * 1.0 for a in range(-int(MAX_ANGLE), int(MAX_ANGLE) + 1)]
    best = max(coarse, key=lambda angle: _score(ink, angle))
    fine = [best + step * 0.25 for step in range(-3, 4)]
    best = max(fine, key=lambda angle: _score(ink, angle))
    return round(best, 2)


def deskew(image):
    """Return a levelled copy of a PIL image, or the same image when it is already level.

    The caller keeps ownership of the input; when a new image is returned the input is not
    closed here, so callers that close their image still do so exactly once.
    """
    if not enabled():
        return image
    try:
        angle = estimate_skew(image)
    except Exception:  # noqa: BLE001 - preprocessing must never block OCR
        return image
    if abs(angle) < MIN_ANGLE:
        return image
    from PIL import Image  # noqa: PLC0415

    fill = 255 if image.mode == "L" else (255, 255, 255)
    source = image if image.mode in ("L", "RGB") else image.convert("RGB")
    return source.rotate(angle, resample=Image.BICUBIC, expand=True, fillcolor=fill)


__all__ = ["MAX_ANGLE", "MIN_ANGLE", "deskew", "enabled", "estimate_skew"]
