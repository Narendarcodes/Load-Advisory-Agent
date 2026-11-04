"""Real-sample OCR benchmark: Tesseract vs PaddleOCR PP-OCRv5 mobile through PR #47's interface.

The images are public SPECIMEN / SAMPLE / third-party synthetic documents (sources and
licences in docs/saral/ocr_real/manifest.csv). They are never committed: they live in a
gitignored folder. Only the manifest and the masked labels are in git.

    # 1. render PDFs to page images and add phone-camera variants (perspective, glare, JPEG)
    python scripts/saral_ocr/real_benchmark.py prepare --labels labels_full.json --out images
    # 2. one process per engine, so peak RSS is per engine
    python scripts/saral_ocr/real_benchmark.py run --engine paddle --labels labels_full.json --images images --out res
    python scripts/saral_ocr/real_benchmark.py run --engine tesseract --labels labels_full.json --images images --out res
    # 3. tables (also models the default chain: Paddle, then Tesseract on a failed gate)
    python scripts/saral_ocr/real_benchmark.py report --out res > tables.md
    # masked labels for git
    python scripts/saral_ocr/real_benchmark.py mask --labels labels_full.json > labels_masked.json

Raw recognised text is scored in memory and dropped; result files hold only booleans,
timings and masked values. Full PAN/Aadhaar numbers exist only in the gitignored labels.
"""

from __future__ import annotations

import argparse
import json
import re
import resource
import statistics
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "apps" / "loan_advisory_portal"))

VARIANTS = ("orig", "phone", "glare", "jpeg")
MAX_SIDE = 3000


# --------------------------------------------------------------------------- prepare


def _render(path: Path):
    from PIL import Image

    if path.suffix.lower() == ".pdf":
        import pypdfium2

        pdf = pypdfium2.PdfDocument(str(path))
        page = pdf[0]
        w, h = page.get_size()
        scale = min(200 / 72, MAX_SIDE / max(w, h))
        image = page.render(scale=scale).to_pil().convert("RGB")
        page.close()
        pdf.close()
        return image
    image = Image.open(path).convert("RGB")
    if max(image.size) > MAX_SIDE:
        image.thumbnail((MAX_SIDE, MAX_SIDE))
    return image


def _perspective(image, seed: int, strength: float = 0.06, angle: float = 4.0):
    import numpy as np
    from PIL import Image

    rng = np.random.default_rng(seed)
    w, h = image.size
    pad = int(0.08 * max(w, h))
    canvas = Image.new("RGB", (w + 2 * pad, h + 2 * pad), (205, 200, 190))  # desk-like background
    canvas.paste(image, (pad, pad))
    W, H = canvas.size
    d = strength * min(W, H)
    src = [(0, 0), (W, 0), (W, H), (0, H)]
    dst = [(rng.uniform(0, d), rng.uniform(0, d)), (W - rng.uniform(0, d), rng.uniform(0, d)),
           (W - rng.uniform(0, d), H - rng.uniform(0, d)), (rng.uniform(0, d), H - rng.uniform(0, d))]
    matrix = []
    for (x, y), (u, v) in zip(dst, src):
        matrix.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        matrix.append([0, 0, 0, x, y, 1, -v * x, -v * y])
    coeffs = np.linalg.solve(np.array(matrix), np.array(src).reshape(8))
    warped = canvas.transform((W, H), Image.PERSPECTIVE, tuple(coeffs), Image.BICUBIC, fillcolor=(205, 200, 190))
    sign = 1 if seed % 2 else -1
    return warped.rotate(sign * angle, resample=Image.BICUBIC, expand=True, fillcolor=(205, 200, 190))


def _glare(image, seed: int):
    import numpy as np
    from PIL import Image

    rng = np.random.default_rng(seed)
    base = np.asarray(_perspective(image, seed, 0.04, 2.0), dtype=np.float32)
    h, w = base.shape[:2]
    cy, cx = rng.uniform(0.25, 0.6) * h, rng.uniform(0.3, 0.7) * w
    yy, xx = np.mgrid[0:h, 0:w]
    r = 0.22 * max(h, w)
    blob = np.exp(-(((yy - cy) ** 2 + (xx - cx) ** 2) / (2 * r * r)))[..., None]
    out = base * (1 - 0.75 * blob) + 255 * 0.75 * blob
    return Image.fromarray(np.clip(out, 0, 255).astype("uint8"))


def _jpeg(image):
    from io import BytesIO

    from PIL import Image

    small = image.resize((max(1, int(image.width * 0.6)), max(1, int(image.height * 0.6))))
    buffer = BytesIO()
    small.save(buffer, format="JPEG", quality=30)
    return Image.open(BytesIO(buffer.getvalue())).convert("RGB")


def prepare(labels: Path, out: Path) -> None:
    data = json.loads(labels.read_text())
    base = labels.parent
    out.mkdir(parents=True, exist_ok=True)
    for n, item in enumerate(data["items"]):
        image = _render(base / item["file"])
        variants = {"orig": image, "phone": _perspective(image, n), "glare": _glare(image, n + 100),
                    "jpeg": _jpeg(image)}
        for name, picture in variants.items():
            target = out / f"{item['id']}__{name}.png" if name != "jpeg" else out / f"{item['id']}__{name}.jpg"
            if name == "jpeg":
                picture.save(target, quality=30)
            else:
                picture.save(target)
        print(item["id"], image.size, flush=True)


# --------------------------------------------------------------------------- scoring helpers


def _norm_name(value) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z ]", " ", str(value or "").lower())).strip()


def _amount_strings(value: float) -> set[str]:
    western = f"{value:,.2f}"
    whole, frac = f"{value:.2f}".split(".")
    if len(whole) > 3:
        head, tail = whole[:-3], whole[-3:]
        head = ",".join(re.findall(r"\d{1,2}", head[::-1]))[::-1] if head else ""
        indian = f"{head},{tail}.{frac}"
    else:
        indian = f"{whole}.{frac}"
    return {western, indian}


def _score(item, result, lines) -> dict:
    """Booleans only. `lines` is the engine's recognised text, used here and then dropped."""
    from loan_advisory_portal.ocr.field_checks import aadhaar_ok, pan_ok

    gt = item["gt"]
    fields = result.fields if result else {}
    texts = [line.text for line in lines]

    def value(key):
        item_ = fields.get(key)
        return item_.value if item_ is not None else None

    def status(key):
        item_ = fields.get(key)
        return item_.status.value if item_ is not None else "missing"

    s: dict = {}
    kind = item["doc_type"]
    if kind == "PAN Card":
        pan = gt["pan_number"]
        s["pan_raw"] = any(pan in re.sub(r"[^A-Z0-9]", "", t.upper()) for t in texts)
        if pan_ok(pan, synthetic=False):
            s["pan_parsed"] = value("pan_number") == f"XXXXX{pan[5:9]}X" and status("pan_number") == "found"
        else:  # a format-invalid specimen PAN must be flagged (INVALID), never accepted as FOUND
            s["pan_parsed"] = status("pan_number") == "invalid"
        s["pan_expected_valid"] = pan_ok(pan, synthetic=False)
        if gt.get("name"):
            s["name"] = _norm_name(value("name")) == _norm_name(gt["name"])
        if gt.get("date_of_birth"):
            s["dob"] = value("date_of_birth") == gt["date_of_birth"]
    elif kind == "Aadhaar Card":
        number = gt.get("aadhaar_number")
        got = value("aadhaar_number")
        if number is None:
            s["aadhaar_negative_ok"] = got is None
        elif number.startswith("X"):
            s["aadhaar_raw"] = got == f"XXXX XXXX {number[-4:]}"
            s["aadhaar_parsed"] = s["aadhaar_raw"]
        else:
            s["aadhaar_raw"] = any(number in re.sub(r"\D", "", t) for t in texts)
            if aadhaar_ok(number, synthetic=False):
                s["aadhaar_parsed"] = got == f"XXXX XXXX {number[-4:]}"
            else:  # checksum/prefix-invalid specimen numbers must be rejected
                s["aadhaar_parsed"] = got is None and status("aadhaar_number") == "invalid"
            s["aadhaar_expected_valid"] = aadhaar_ok(number, synthetic=False)
        if gt.get("name"):
            s["name"] = _norm_name(value("name")) == _norm_name(gt["name"])
        if gt.get("date_of_birth"):
            s["dob"] = value("date_of_birth") == gt["date_of_birth"]
        if gt.get("gender"):
            s["gender"] = (value("gender") or "").lower() == gt["gender"].lower()
    elif kind == "Bank Statement":
        s["account_holder"] = _norm_name(value("account_holder")) == _norm_name(gt["account_holder"])
        s["closing_balance"] = value("closing_balance") == gt["closing_balance"]
        rows = []
        for amount, balance in item.get("rows") or []:
            if amount is None or balance is None:
                continue
            a, b = _amount_strings(float(amount)), _amount_strings(float(balance))
            seen = any(any(x in t for x in b) for t in texts)
            matched = any(any(x in t for x in a) and any(x in t for x in b) for t in texts)
            rows.append([seen, matched])
        s["_rows"] = rows
        s["transactions_parsed"] = value("transaction_count") or 0
    elif kind == "Salary Slip":
        for key in ("employee_name", "employer_name"):
            if gt.get(key):
                s[key] = _norm_name(value(key)) == _norm_name(gt[key])
        for key in ("gross_salary", "net_salary"):
            if gt.get(key) is not None:
                s[key] = value(key) == gt[key]
    return s


# --------------------------------------------------------------------------- run


def run(engine: str, labels: Path, images: Path, out: Path, limit: int | None = None) -> None:
    from loan_advisory_portal.ocr import chain, paddle_engine

    captured: dict = {}
    if engine == "paddle":
        original = paddle_engine.extract_lines_paddle

        def wrapped(content, filename):
            lines, pages, layer = original(content, filename)
            captured["lines"] = lines
            return lines, pages, layer

        paddle_engine.extract_lines_paddle = wrapped
    else:
        original = chain.extract_lines

        def wrapped(content, filename):
            lines, pages, layer = original(content, filename)
            captured["lines"] = lines
            return lines, pages, layer

        chain.extract_lines = wrapped

    data = json.loads(labels.read_text())
    out.mkdir(parents=True, exist_ok=True)
    rows = []
    started_all = time.perf_counter()
    for item in data["items"][:limit]:
        for variant in VARIANTS:
            ext = "jpg" if variant == "jpeg" else "png"
            path = images / f"{item['id']}__{variant}.{ext}"
            content = path.read_bytes()
            captured.clear()
            attempt = chain._run(engine, item["doc_type"], content, path.name, synthetic=False)
            lines = captured.pop("lines", [])
            # An engine that read nothing scores every labelled field as wrong (not skipped).
            score = _score(item, attempt.result, lines)
            del lines
            rows.append({
                "id": item["id"], "doc_type": item["doc_type"], "source": item["source"], "variant": variant,
                "seconds": round(attempt.seconds, 3), "error": attempt.error, "passes": attempt.passes,
                "critical_found": attempt.critical_found, "score": score,
            })
            print(engine, item["id"], variant, round(attempt.seconds, 2), attempt.error or "", flush=True)
    self_rss = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024
    child_rss = resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss / 1024
    (out / f"{engine}.json").write_text(json.dumps({
        "engine": engine, "total_seconds": round(time.perf_counter() - started_all, 1),
        "peak_rss_mb_python": round(self_rss, 1), "peak_rss_mb_children": round(child_rss, 1), "rows": rows,
    }, indent=1))


# --------------------------------------------------------------------------- report


FIELD_LABELS = {
    "pan_raw": "PAN, all 10 characters read", "pan_parsed": "PAN, parser outcome correct (masked or flagged)",
    "aadhaar_raw": "Aadhaar number read (12 digits / masked last 4)",
    "aadhaar_parsed": "Aadhaar, parser outcome correct (masked or rejected)",
    "aadhaar_negative_ok": "Blank template: no Aadhaar number invented",
    "name": "Name", "dob": "Date of birth", "gender": "Gender",
    "account_holder": "Account holder", "closing_balance": "Closing balance",
    "employee_name": "Employee name", "employer_name": "Employer", "gross_salary": "Gross salary",
    "net_salary": "Net salary",
}
DOC_ORDER = ("PAN Card", "Aadhaar Card", "Bank Statement", "Salary Slip")


def _pct(n, d):
    return f"{100 * n / d:.0f}% ({n}/{d})" if d else "n/a"


def _default_rows(paddle_rows, tess_rows):
    out = []
    tess = {(r["id"], r["variant"]): r for r in tess_rows}
    for p in paddle_rows:
        t = tess.get((p["id"], p["variant"]))
        if p["passes"] or t is None:
            route = "paddle" if p["passes"] else "manual_review"
            out.append(dict(p, route=route, seconds=p["seconds"]))
        elif t["passes"]:
            out.append(dict(t, route="tesseract", seconds=p["seconds"] + t["seconds"]))
        else:
            best = p if p["critical_found"] >= t["critical_found"] else t
            out.append(dict(best, route="manual_review", seconds=p["seconds"] + t["seconds"]))
    return out


def report(out: Path) -> None:
    runs = {e: json.loads((out / f"{e}.json").read_text()) for e in ("tesseract", "paddle") if (out / f"{e}.json").exists()}
    engines = list(runs)
    table_rows = {e: runs[e]["rows"] for e in engines}
    if len(engines) == 2:
        table_rows["default (paddle -> tesseract)"] = _default_rows(runs["paddle"]["rows"], runs["tesseract"]["rows"])
    names = list(table_rows)
    print("<!-- generated by scripts/saral_ocr/real_benchmark.py report; AUTOMATED; public specimen/sample docs -->\n")
    for subset, variants in (("All variants", VARIANTS), ("Original images", ("orig",)),
                             ("Phone-style variants (perspective, glare, JPEG)", ("phone", "glare", "jpeg"))):
        print(f"#### Field exact match: {subset}\n")
        print("| Doc type | Field | " + " | ".join(names) + " |")
        print("|---|---|" + "---|" * len(names))
        for doc in DOC_ORDER:
            keys = []
            for r in table_rows[names[0]]:
                if r["doc_type"] == doc:
                    keys += [k for k in r["score"] if not k.startswith("_") and k in FIELD_LABELS and k not in keys]
            for key in keys:
                cells = []
                for name in names:
                    vals = [r["score"].get(key) for r in table_rows[name]
                            if r["doc_type"] == doc and r["variant"] in variants and key in r["score"]]
                    cells.append(_pct(sum(bool(v) for v in vals), len(vals)))
                print(f"| {doc} | {FIELD_LABELS[key]} | " + " | ".join(cells) + " |")
            # all-field accuracy per doc type
            cells = []
            for name in names:
                vals = [v for r in table_rows[name] if r["doc_type"] == doc and r["variant"] in variants
                        for k, v in r["score"].items() if k in FIELD_LABELS]
                cells.append(_pct(sum(bool(v) for v in vals), len(vals)))
            print(f"| {doc} | **all fields** | " + " | ".join(cells) + " |")
        print()
    print("#### Bank statement transaction rows (amount + balance on one recognised line)\n")
    print("| Variant | " + " | ".join(engines) + " |")
    print("|---|" + "---|" * len(engines))
    for variant in VARIANTS:
        cells = []
        for e in engines:
            n = d = 0
            for r in runs[e]["rows"]:
                if r["doc_type"] == "Bank Statement" and r["variant"] == variant:
                    for idx, (seen, matched) in enumerate(r["score"].get("_rows", [])):
                        other = [x for x in engines if x != e]
                        seen_any = seen or any(
                            (o_r["score"].get("_rows") or [[False, False]] * (idx + 1))[idx][0]
                            for o in other for o_r in runs[o]["rows"]
                            if o_r["id"] == r["id"] and o_r["variant"] == variant and len(o_r["score"].get("_rows", [])) > idx)
                        if seen_any:
                            d += 1
                            n += bool(matched)
            cells.append(_pct(n, d))
        print(f"| {variant} | " + " | ".join(cells) + " |")
    print()
    if "default (paddle -> tesseract)" in table_rows:
        routes: dict = {}
        for r in table_rows["default (paddle -> tesseract)"]:
            routes.setdefault(r["doc_type"], {}).setdefault(r["route"], 0)
            routes[r["doc_type"]][r["route"]] += 1
        print("#### Default chain routes (pages)\n")
        print("| Doc type | paddle | tesseract (fallback) | manual review |")
        print("|---|---|---|---|")
        for doc in DOC_ORDER:
            c = routes.get(doc, {})
            print(f"| {doc} | {c.get('paddle', 0)} | {c.get('tesseract', 0)} | {c.get('manual_review', 0)} |")
        print()
    print("#### Latency and memory (InstaBox, 4 vCPU, no GPU)\n")
    print("| Engine | pages | median s/page | p90 s/page | first page s | total s | peak RSS MB |")
    print("|---|---|---|---|---|---|---|")
    for e in engines:
        secs = [r["seconds"] for r in runs[e]["rows"] if not r["error"]]
        secs_sorted = sorted(secs)
        p90 = secs_sorted[int(0.9 * (len(secs_sorted) - 1))] if secs_sorted else 0
        rss = runs[e]["peak_rss_mb_python"]
        if e == "tesseract":
            rss = f"{runs[e]['peak_rss_mb_children']} (tesseract process); python {rss}"
        errors = sum(1 for r in runs[e]["rows"] if r["error"])
        print(f"| {e} | {len(runs[e]['rows'])}{f' ({errors} errors)' if errors else ''} | "
              f"{statistics.median(secs):.2f} | {p90:.2f} | {runs[e]['rows'][0]['seconds']:.2f} | "
              f"{runs[e]['total_seconds']} | {rss} |")


def mask(labels: Path) -> None:
    data = json.loads(labels.read_text())
    for item in data["items"]:
        gt = item["gt"]
        if gt.get("pan_number"):
            p = gt["pan_number"]
            gt["pan_number"] = f"XXXXX{p[5:9]}X"
        if gt.get("aadhaar_number"):
            gt["aadhaar_number"] = f"XXXX XXXX {gt['aadhaar_number'][-4:]}"
        item.pop("rows", None)
        item["file"] = Path(item["file"]).name
    print(json.dumps(data, indent=1))


def main() -> None:
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("prepare")
    p.add_argument("--labels", type=Path, required=True)
    p.add_argument("--out", type=Path, required=True)
    r = sub.add_parser("run")
    r.add_argument("--engine", choices=("paddle", "tesseract"), required=True)
    r.add_argument("--labels", type=Path, required=True)
    r.add_argument("--images", type=Path, required=True)
    r.add_argument("--out", type=Path, required=True)
    r.add_argument("--limit", type=int)
    rep = sub.add_parser("report")
    rep.add_argument("--out", type=Path, required=True)
    m = sub.add_parser("mask")
    m.add_argument("--labels", type=Path, required=True)
    args = ap.parse_args()
    if args.cmd == "prepare":
        prepare(args.labels, args.out)
    elif args.cmd == "run":
        run(args.engine, args.labels, args.images, args.out, args.limit)
    elif args.cmd == "report":
        report(args.out)
    else:
        mask(args.labels)


if __name__ == "__main__":
    main()
