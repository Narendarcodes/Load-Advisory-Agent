"""Synthetic signature specimens (random pen strokes; nobody's handwriting).

Same approach as scripts/saral_ocr/generate_synthetic_docs.py + signature_screening.py on
feat/saral-ocr-paddle-signature @ 0b5dede: a writer is 2-4 smooth strokes plus an underline
flourish; a *genuine* sample re-renders the writer's strokes with small jitter, rotation and
scale; a *skilled forgery* traces the same shape with larger wobble, a different pen and one
stroke redrawn freehand; a *random forgery* is another writer's genuine sample; *missing*
leaves the signature box blank.

The dataset stores the stroke control points and render parameters (pure Python), so the
images are reproducible from JSON; ``render_signature`` needs Pillow only.
"""
from __future__ import annotations

import random

CANVAS = (520, 230)
INK_GENUINE = (20, 30, 110)
INK_FORGER = (15, 15, 15)


def writer_strokes(rng: random.Random) -> list[list[list[float]]]:
    strokes = []
    x = rng.uniform(30, 70)
    for _ in range(rng.randint(2, 4)):
        pts = []
        for i in range(rng.randint(5, 9)):
            pts.append([x + i * rng.uniform(18, 34), 110 + rng.uniform(-45, 45) * (1 if i % 2 else -1)])
        x = pts[-1][0] + rng.uniform(10, 30)
        strokes.append(pts)
    strokes.append([[rng.uniform(30, 80), 165], [x * 0.5, 175 + rng.uniform(-8, 8)], [x, 160]])
    xs = [p[0] for s in strokes for p in s]
    ys = [p[1] for s in strokes for p in s]
    scale = min(420 / max(max(xs) - min(xs), 1), 150 / max(max(ys) - min(ys), 1))
    return [[[round((px - min(xs)) * scale + 50, 2), round((py - min(ys)) * scale + 40, 2)] for px, py in s]
            for s in strokes]


def _sample(strokes, rng: random.Random, *, jitter, width, angle, scale, ink, role) -> dict:
    return {"role": role, "strokes": strokes, "jitter": round(jitter, 3), "width": round(width, 3),
            "angle": round(angle, 3), "scale": round(scale, 4), "ink_rgb": list(ink),
            "render_seed": rng.randint(0, 10**9)}


def specimen_set(writer_rng: random.Random, other_rng: random.Random, rng: random.Random, label: str) -> dict:
    """Reference (for the PAN card) + the form/NACH-mandate signature for ``label``."""
    base = writer_strokes(writer_rng)
    reference = _sample(base, rng, jitter=1.0, width=3, angle=0, scale=1.0, ink=INK_GENUINE, role="reference")
    if label == "GENUINE_MATCH":
        form = _sample(base, rng, jitter=3.5, width=rng.uniform(2.2, 4.0), angle=rng.uniform(-4, 4),
                       scale=rng.uniform(0.92, 1.08), ink=INK_GENUINE, role="genuine")
    elif label == "SKILLED_FORGERY":
        forged = [[p[:] for p in s] for s in base]
        victim = rng.randrange(len(forged) - 1)
        forged[victim] = [[round(px + rng.gauss(0, 14), 2), round(py + rng.gauss(0, 18), 2)]
                          for px, py in forged[victim]]
        form = _sample(forged, rng, jitter=7.0, width=rng.uniform(1.8, 4.5), angle=rng.uniform(-6, 6),
                       scale=rng.uniform(0.88, 1.12), ink=INK_FORGER, role="skilled_forgery")
    elif label == "RANDOM_FORGERY":
        form = _sample(writer_strokes(other_rng), rng, jitter=3.5, width=rng.uniform(2.2, 4.0),
                       angle=rng.uniform(-4, 4), scale=rng.uniform(0.92, 1.08), ink=INK_GENUINE,
                       role="random_forgery")
    elif label == "MISSING":
        form = None
    else:
        raise ValueError(label)
    return {
        "synthetic": True,
        "label": label,
        "reference_on": "PAN",
        "form_on": "NACH_MANDATE_AND_LOAN_APPLICATION",
        "reference": reference,
        "form_signature": form,
        "canvas": list(CANVAS),
        "note": "random synthetic pen strokes; not a real person's signature. Screening signal only.",
    }


def _catmull(points: list[list[float]], samples: int = 18) -> list[tuple[float, float]]:
    if len(points) < 3:
        return [tuple(p) for p in points]
    p = [points[0], *points, points[-1]]
    out = []
    for i in range(1, len(p) - 2):
        for k in range(samples):
            t = k / samples
            t2, t3 = t * t, t * t * t
            out.append(tuple(0.5 * ((2 * p[i][j]) + (-p[i - 1][j] + p[i + 1][j]) * t
                                    + (2 * p[i - 1][j] - 5 * p[i][j] + 4 * p[i + 1][j] - p[i + 2][j]) * t2
                                    + (-p[i - 1][j] + 3 * p[i][j] - 3 * p[i + 1][j] + p[i + 2][j]) * t3)
                             for j in (0, 1)))
    out.append(tuple(p[-2]))
    return out


def render_signature(sample: dict | None, size: tuple[int, int] = CANVAS):
    """Pillow image of one sample (blank paper when ``sample`` is None)."""
    from PIL import Image, ImageDraw  # noqa: PLC0415

    paper = (252, 252, 248)
    img = Image.new("RGB", CANVAS, paper)
    if sample is not None:
        rng = random.Random(sample["render_seed"])
        d = ImageDraw.Draw(img)
        cx, cy = CANVAS[0] / 2, CANVAS[1] / 2
        for stroke in sample["strokes"]:
            pts = [[(px + rng.gauss(0, sample["jitter"]) - cx) * sample["scale"] + cx,
                    (py + rng.gauss(0, sample["jitter"]) - cy) * sample["scale"] + cy] for px, py in stroke]
            d.line(_catmull(pts), fill=tuple(sample["ink_rgb"]), width=max(1, round(sample["width"])),
                   joint="curve")
        img = img.rotate(sample["angle"], resample=Image.BICUBIC, fillcolor=paper)
    return img.resize(size) if size != CANVAS else img
