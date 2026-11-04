"""Signature screening prototype. SYNTHETIC SIGNATURES ONLY. A SCREENING SIGNAL, NEVER PROOF.

Compares a submitted signature with a reference signature and returns a similarity score.
A score below the REFER threshold sends the application to a human reviewer; a score at or
above it means only "no flag raised". The output must never be read as "signature verified"
or "forgery detected", and it must never decide a loan on its own.

Methods
* ``ssim``      - Otsu binarisation, crop to ink, pad/resize to 128x320, SSIM.
* ``orb``       - ORB keypoints on the same binarised crop, Hamming ratio-test matches
                  divided by the smaller keypoint count.
* ``classical`` - mean of ssim and orb.
* ``embedding`` - cosine similarity of ImageNet-pretrained ResNet-18 pooled features of the
                  binarised crop (generic features, NOT trained on signatures). Optional:
                  only runs when torch + torchvision are installed.

Evaluation on the synthetic set (30 writers): genuine pairs (reference vs genuine variant),
skilled-forgery pairs (reference vs simulated forgery) and random-forgery pairs (reference
vs another writer's genuine variant). Thresholds are chosen on one half of the writers to
hold FRR at or under a target, then FAR/FRR are reported on the other half (2-fold).

    python scripts/saral_ocr/signature_screening.py --data /data/ocr/synth --out /data/ocr/results
"""

from __future__ import annotations

import argparse
import json
import time
from collections import defaultdict
from pathlib import Path

import numpy as np
from PIL import Image

CANVAS = (320, 128)  # (w, h)
TARGET_FRR = 0.10


def preprocess(path: Path) -> np.ndarray:
    """Binary ink mask (uint8 0/255, ink=255) cropped to the signature and padded to CANVAS."""
    import cv2  # noqa: PLC0415

    gray = np.asarray(Image.open(path).convert("L"))
    blur = cv2.GaussianBlur(gray, (3, 3), 0)
    _, ink = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    ink = cv2.morphologyEx(ink, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    ys, xs = np.nonzero(ink)
    if len(xs) == 0:
        return np.zeros((CANVAS[1], CANVAS[0]), np.uint8)
    crop = ink[max(ys.min() - 4, 0): ys.max() + 5, max(xs.min() - 4, 0): xs.max() + 5]
    h, w = crop.shape
    scale = min(CANVAS[0] / w, CANVAS[1] / h)
    resized = cv2.resize(crop, (max(1, int(w * scale)), max(1, int(h * scale))), interpolation=cv2.INTER_AREA)
    out = np.zeros((CANVAS[1], CANVAS[0]), np.uint8)
    y0 = (CANVAS[1] - resized.shape[0]) // 2
    x0 = (CANVAS[0] - resized.shape[1]) // 2
    out[y0:y0 + resized.shape[0], x0:x0 + resized.shape[1]] = resized
    return cv2.dilate(out, np.ones((3, 3), np.uint8))


def ssim_score(a: np.ndarray, b: np.ndarray) -> float:
    from skimage.metrics import structural_similarity  # noqa: PLC0415

    import cv2  # noqa: PLC0415

    # SSIM on a softened mask is less brittle to 1-2 px stroke offsets than on hard edges.
    sa = cv2.GaussianBlur(a, (9, 9), 3)
    sb = cv2.GaussianBlur(b, (9, 9), 3)
    return float(structural_similarity(sa, sb, data_range=255))


_orb = None


def orb_score(a: np.ndarray, b: np.ndarray) -> float:
    import cv2  # noqa: PLC0415

    global _orb
    if _orb is None:
        _orb = cv2.ORB_create(nfeatures=500, edgeThreshold=8, patchSize=15)
    ka, da = _orb.detectAndCompute(a, None)
    kb, db = _orb.detectAndCompute(b, None)
    if da is None or db is None or len(ka) < 2 or len(kb) < 2:
        return 0.0
    matches = cv2.BFMatcher(cv2.NORM_HAMMING).knnMatch(da, db, k=2)
    good = [m for pair in matches if len(pair) == 2 for m, n in [pair] if m.distance < 0.75 * n.distance]
    return float(len(good) / max(1, min(len(ka), len(kb))))


class Embedder:
    def __init__(self):
        import torch  # noqa: PLC0415
        import torchvision  # noqa: PLC0415

        torch.set_num_threads(4)
        weights = torchvision.models.ResNet18_Weights.IMAGENET1K_V1
        model = torchvision.models.resnet18(weights=weights)
        model.fc = torch.nn.Identity()
        self.model = model.eval()
        self.torch = torch

    def __call__(self, mask: np.ndarray) -> np.ndarray:
        torch = self.torch
        img = 255 - mask  # dark ink on white, closer to natural images
        img = Image.fromarray(img).convert("RGB").resize((448, 180))
        canvas = Image.new("RGB", (448, 448), (255, 255, 255))
        canvas.paste(img, (0, 134))
        x = torch.from_numpy(np.asarray(canvas.resize((224, 224)), dtype=np.float32) / 255.0).permute(2, 0, 1)
        mean = torch.tensor([0.485, 0.456, 0.406])[:, None, None]
        std = torch.tensor([0.229, 0.224, 0.225])[:, None, None]
        with torch.no_grad():
            v = self.model(((x - mean) / std)[None])[0].numpy()
        return v / (np.linalg.norm(v) + 1e-9)


# --------------------------------------------------------------------------- presence + crop

ROI = (600, 260)  # signature box on a form, (w, h)


def _paper(rng: np.random.Generator) -> np.ndarray:
    base = rng.integers(238, 252)
    roi = np.full((ROI[1], ROI[0]), base, np.float32) + rng.normal(0, 4, (ROI[1], ROI[0]))
    roi[226:229, 20:580] = rng.integers(120, 170)  # printed baseline of the signature box
    return roi


def _jpeg(gray: np.ndarray, quality: int) -> np.ndarray:
    import cv2  # noqa: PLC0415

    ok, enc = cv2.imencode(".jpg", np.clip(gray, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, quality])
    return cv2.imdecode(enc, cv2.IMREAD_GRAYSCALE)


def make_roi_samples(data: Path, seed: int = 7) -> list[dict]:
    """Signature boxes as they would be cropped from a form by template position.

    Positives: every genuine variant and forgery pasted (multiply blend) at a random offset,
    with the ground-truth ink box recorded. Negatives: empty boxes, and boxes holding only a
    faint stamp-like smudge or a stray pen tick. JPEG q60-80 throughout. All synthetic.
    """
    import cv2  # noqa: PLC0415

    rng = np.random.default_rng(seed)
    manifest = json.loads((data / "manifest.json").read_text())
    samples = []
    for s in manifest["signatures"]:
        for key in ("genuine_variant", "forged_skilled"):
            sig = np.asarray(Image.open(data / s["files"][key]).convert("L")).astype(np.float32)
            scale = rng.uniform(0.8, 1.0)
            sig = cv2.resize(sig, (int(sig.shape[1] * scale), int(sig.shape[0] * scale)))
            roi = _paper(rng)
            dx = int(rng.integers(0, ROI[0] - sig.shape[1]))
            dy = int(rng.integers(0, max(1, ROI[1] - sig.shape[0] - 10)))
            region = roi[dy:dy + sig.shape[0], dx:dx + sig.shape[1]]
            roi[dy:dy + sig.shape[0], dx:dx + sig.shape[1]] = region * (sig / 255.0)
            ys, xs = np.nonzero(sig < 160)
            gt = (dx + xs.min(), dy + ys.min(), dx + xs.max(), dy + ys.max())
            samples.append({"present": True, "gt_box": [int(v) for v in gt],
                            "image": _jpeg(roi, int(rng.integers(60, 81))), "source": key})
    for i in range(30):
        roi = _paper(rng)
        kind = "empty"
        if i % 3 == 1:  # faint grey smudge (e.g. a stamp bleeding through)
            cy, cx = rng.integers(60, 180), rng.integers(100, 500)
            yy, xx = np.mgrid[0:ROI[1], 0:ROI[0]]
            roi -= 40 * np.exp(-(((yy - cy) / 40) ** 2 + ((xx - cx) / 70) ** 2))
            kind = "smudge"
        elif i % 3 == 2:  # one short stray pen tick
            x0, y0 = int(rng.integers(50, 500)), int(rng.integers(40, 180))
            cv2.line(roi, (x0, y0), (x0 + int(rng.integers(8, 18)), y0 + int(rng.integers(-6, 6))), 40, 2)
            kind = "stray_tick"
        samples.append({"present": False, "gt_box": None, "image": _jpeg(roi, int(rng.integers(60, 81))),
                        "source": kind})
    return samples


def detect_and_crop(gray: np.ndarray) -> tuple[bool, tuple[int, int, int, int] | None, dict]:
    """Presence decision and ink bounding box for one signature box.

    Ink = pixels well below the local paper level; the printed baseline is removed with a
    long horizontal opening; components under 30 px are noise. A signature is "present" when
    the remaining ink covers at least 0.4 % of the box and spans at least 12 % of its width.
    """
    import cv2  # noqa: PLC0415

    paper = cv2.medianBlur(gray, 31).astype(np.int16)
    ink = ((paper - gray.astype(np.int16)) > 55).astype(np.uint8) * 255
    lines = cv2.morphologyEx(ink, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (80, 1)))
    ink = cv2.subtract(ink, lines)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(ink, connectivity=8)
    keep = np.zeros_like(ink)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] >= 30:
            keep[labels == i] = 255
    ys, xs = np.nonzero(keep)
    coverage = len(xs) / keep.size
    if len(xs) == 0:
        return False, None, {"ink_coverage": 0.0, "width_span": 0.0}
    span = (xs.max() - xs.min()) / gray.shape[1]
    present = bool(coverage >= 0.004 and span >= 0.12)
    box = (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max()))
    return present, box if present else None, {"ink_coverage": round(coverage, 4), "width_span": round(span, 3)}


def iou(a, b) -> float:
    ix = max(0, min(a[2], b[2]) - max(a[0], b[0]))
    iy = max(0, min(a[3], b[3]) - max(a[1], b[1]))
    inter = ix * iy
    union = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter
    return inter / union if union else 0.0


def presence_and_crop(data: Path) -> dict:
    samples = make_roi_samples(data)
    tp = fp = tn = fn = 0
    ious = []
    misses = defaultdict(int)
    for s in samples:
        present, box, _ = detect_and_crop(s["image"])
        if s["present"]:
            tp += present
            fn += not present
            if present:
                ious.append(iou(box, s["gt_box"]))
        else:
            fp += present
            tn += not present
            if present:
                misses[s["source"]] += 1
    ious.sort()
    tp, fn, tn, fp = int(tp), int(fn), int(tn), int(fp)
    return {"positives": tp + fn, "negatives": tn + fp, "true_positive": tp, "false_negative": fn,
            "true_negative": tn, "false_positive": fp, "false_positive_by_kind": dict(misses),
            "crop_iou_mean": round(float(np.mean(ious)), 3) if ious else None,
            "crop_iou_median": round(ious[len(ious) // 2], 3) if ious else None,
            "crop_iou_ge_0_8": sum(v >= 0.8 for v in ious), "crop_iou_ge_0_9": sum(v >= 0.9 for v in ious),
            "crops_scored": len(ious)}


def build_pairs(data: Path) -> list[dict]:
    manifest = json.loads((data / "manifest.json").read_text())
    sets = manifest["signatures"]
    pairs = []
    for i, s in enumerate(sets):
        other = sets[(i + 1) % len(sets)]
        ref = data / s["files"]["genuine_ref"]
        pairs.append({"writer": i, "kind": "genuine", "a": ref, "b": data / s["files"]["genuine_variant"]})
        pairs.append({"writer": i, "kind": "skilled_forgery", "a": ref, "b": data / s["files"]["forged_skilled"]})
        pairs.append({"writer": i, "kind": "random_forgery", "a": ref, "b": data / other["files"]["genuine_variant"]})
    return pairs


def rates(scores: list[dict], method: str, threshold: float, writers: set[int]) -> dict:
    sel = [p for p in scores if p["writer"] in writers]
    gen = [p[method] for p in sel if p["kind"] == "genuine"]
    sk = [p[method] for p in sel if p["kind"] == "skilled_forgery"]
    rf = [p[method] for p in sel if p["kind"] == "random_forgery"]
    return {"frr": sum(s < threshold for s in gen), "n_gen": len(gen),
            "far_skilled": sum(s >= threshold for s in sk), "n_skilled": len(sk),
            "far_random": sum(s >= threshold for s in rf), "n_random": len(rf)}


def eer(scores: list[dict], method: str, kind: str) -> float:
    gen = np.array([p[method] for p in scores if p["kind"] == "genuine"])
    neg = np.array([p[method] for p in scores if p["kind"] == kind])
    best = (1.0, 0.0)
    for t in np.unique(np.concatenate([gen, neg])):
        frr = float(np.mean(gen < t))
        far = float(np.mean(neg >= t))
        if abs(frr - far) < best[0]:
            best = (abs(frr - far), (frr + far) / 2)
    return best[1]


def auc(scores: list[dict], method: str, kind: str) -> float:
    gen = [p[method] for p in scores if p["kind"] == "genuine"]
    neg = [p[method] for p in scores if p["kind"] == kind]
    wins = sum((g > n) + 0.5 * (g == n) for g in gen for n in neg)
    return wins / (len(gen) * len(neg))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", type=Path, required=True)
    ap.add_argument("--out", type=Path, required=True)
    ap.add_argument("--no-embedding", action="store_true")
    args = ap.parse_args()

    pairs = build_pairs(args.data)
    cache: dict[Path, np.ndarray] = {}

    def mask(p: Path) -> np.ndarray:
        if p not in cache:
            cache[p] = preprocess(p)
        return cache[p]

    embedder = None
    timings = {}
    if not args.no_embedding:
        try:
            t0 = time.perf_counter()
            embedder = Embedder()
            timings["embedding_load_s"] = round(time.perf_counter() - t0, 2)
        except Exception as exc:  # noqa: BLE001
            print(f"embedding disabled: {type(exc).__name__}: {exc}")
    vecs: dict[Path, np.ndarray] = {}
    per = {"ssim": 0.0, "orb": 0.0, "embedding": 0.0}
    scores = []
    for p in pairs:
        a, b = mask(p["a"]), mask(p["b"])
        t0 = time.perf_counter()
        s = ssim_score(a, b)
        per["ssim"] += time.perf_counter() - t0
        t0 = time.perf_counter()
        o = orb_score(a, b)
        per["orb"] += time.perf_counter() - t0
        row = {"writer": p["writer"], "kind": p["kind"], "ssim": round(s, 4), "orb": round(o, 4),
               "classical": round((s + o) / 2, 4)}
        if embedder is not None:
            t0 = time.perf_counter()
            for q, m in ((p["a"], a), (p["b"], b)):
                if q not in vecs:
                    vecs[q] = embedder(m)
            row["embedding"] = round(float(vecs[p["a"]] @ vecs[p["b"]]), 4)
            per["embedding"] += time.perf_counter() - t0
        scores.append(row)
    n = len(pairs)
    timings.update({f"{k}_ms_per_pair": round(1000 * v / n, 2) for k, v in per.items() if v})

    methods = ["ssim", "orb", "classical"] + (["embedding"] if embedder is not None else [])
    writers = sorted({p["writer"] for p in scores})
    folds = [set(writers[: len(writers) // 2]), set(writers[len(writers) // 2:])]
    summary = {}
    for m in methods:
        agg = {"frr": 0, "n_gen": 0, "far_skilled": 0, "n_skilled": 0, "far_random": 0, "n_random": 0}
        thresholds = []
        for k in (0, 1):
            calib, test = folds[k], folds[1 - k]
            gen = sorted(p[m] for p in scores if p["writer"] in calib and p["kind"] == "genuine")
            # REFER below the score that keeps calibration FRR <= TARGET_FRR.
            idx = int(np.floor(TARGET_FRR * len(gen)))
            threshold = gen[idx] if idx < len(gen) else gen[-1]
            thresholds.append(round(threshold, 4))
            r = rates(scores, m, threshold, test)
            for key in agg:
                agg[key] += r[key]
        summary[m] = {**agg, "thresholds_per_fold": thresholds,
                      "eer_skilled": round(eer(scores, m, "skilled_forgery"), 3),
                      "eer_random": round(eer(scores, m, "random_forgery"), 3),
                      "auc_skilled": round(auc(scores, m, "skilled_forgery"), 3),
                      "auc_random": round(auc(scores, m, "random_forgery"), 3)}
    # Anomaly score = 1 - similarity, clipped to 0..1. REFER when anomaly > 1 - threshold.
    for row in scores:
        for m in methods:
            row[f"{m}_anomaly"] = round(min(1.0, max(0.0, 1.0 - row[m])), 4)
    anomaly = {}
    for m in methods:
        anomaly[m] = {kind: round(float(np.median([r[f"{m}_anomaly"] for r in scores if r["kind"] == kind])), 3)
                      for kind in ("genuine", "skilled_forgery", "random_forgery")}
        anomaly[m]["refer_above"] = [round(1 - t, 4) for t in summary[m]["thresholds_per_fold"]]
    t0 = time.perf_counter()
    presence = presence_and_crop(args.data)
    timings["presence_crop_ms_per_box"] = round(1000 * (time.perf_counter() - t0) / (presence["positives"] + presence["negatives"]), 2)
    args.out.mkdir(parents=True, exist_ok=True)
    result = {"label": "SCREENING SIGNAL ONLY - not identity verification, never proof of forgery; synthetic data",
              "target_frr_on_calibration": TARGET_FRR, "pairs": n, "timings": timings,
              "summary": summary, "anomaly_median": anomaly, "presence_and_crop": presence, "scores": scores}
    (args.out / "signature_screening.json").write_text(json.dumps(result, indent=1, default=lambda o: o.item() if hasattr(o, "item") else str(o)))

    md = ["<!-- generated by scripts/saral_ocr/signature_screening.py; AUTOMATED, synthetic signatures -->", "",
          "| Method | REFER threshold (fold A / B) | FRR (genuine referred) | FAR skilled forgery | FAR random forgery | EER skilled | EER random | AUC skilled | AUC random |",
          "|---|---|---|---|---|---|---|---|---|"]
    for m in methods:
        s = summary[m]
        md.append(f"| {m} | {s['thresholds_per_fold'][0]} / {s['thresholds_per_fold'][1]} | "
                  f"{s['frr']}/{s['n_gen']} ({100 * s['frr'] / s['n_gen']:.0f}%) | "
                  f"{s['far_skilled']}/{s['n_skilled']} ({100 * s['far_skilled'] / s['n_skilled']:.0f}%) | "
                  f"{s['far_random']}/{s['n_random']} ({100 * s['far_random'] / s['n_random']:.0f}%) | "
                  f"{s['eer_skilled']} | {s['eer_random']} | {s['auc_skilled']} | {s['auc_random']} |")
    md.append("")
    md += ["Median anomaly score (1 - similarity; higher = more unlike the reference):", "",
           "| Method | genuine | skilled forgery | random forgery | REFER when anomaly > (fold A / B) |", "|---|---|---|---|---|"]
    for m in methods:
        a = anomaly[m]
        md.append(f"| {m} | {a['genuine']} | {a['skilled_forgery']} | {a['random_forgery']} | "
                  f"{a['refer_above'][0]} / {a['refer_above'][1]} |")
    p = presence
    md += ["", "Signature presence detection and crop quality (signature boxes on a synthetic form, JPEG q60-80):", "",
           "| Positives detected | Empty/smudge/stray-tick boxes correctly empty | False positives by kind | Crop IoU mean / median | Crops IoU >= 0.8 | Crops IoU >= 0.9 |",
           "|---|---|---|---|---|---|",
           f"| {p['true_positive']}/{p['positives']} | {p['true_negative']}/{p['negatives']} | {p['false_positive_by_kind'] or 'none'} | "
           f"{p['crop_iou_mean']} / {p['crop_iou_median']} | {p['crop_iou_ge_0_8']}/{p['crops_scored']} | {p['crop_iou_ge_0_9']}/{p['crops_scored']} |"]
    md.append("")
    md.append("Timings: " + ", ".join(f"{k} {v}" for k, v in timings.items()))
    (args.out / "signature_tables.md").write_text("\n".join(md))
    print("\n".join(md))


if __name__ == "__main__":
    main()
