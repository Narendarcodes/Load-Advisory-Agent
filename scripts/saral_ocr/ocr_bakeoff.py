"""OCR bake-off: PR #41 Tesseract path vs PaddleOCR PP-OCRv5 (CPU), on SYNTHETIC documents only.

Each engine runs in its own process so memory and timing are not shared:

    python scripts/saral_ocr/ocr_bakeoff.py run --engine tesseract     --data /data/ocr/synth --out /data/ocr/results
    python scripts/saral_ocr/ocr_bakeoff.py run --engine paddle_server --data /data/ocr/synth --out /data/ocr/results
    python scripts/saral_ocr/ocr_bakeoff.py run --engine paddle_mobile --data /data/ocr/synth --out /data/ocr/results
    python scripts/saral_ocr/ocr_bakeoff.py run --engine ppstructure   --data /data/ocr/synth --out /data/ocr/results
    python scripts/saral_ocr/ocr_bakeoff.py report --out /data/ocr/results

Both OCR engines feed the *same* PR #41 parser (`document_parser.parse`), so a difference
in field accuracy is an OCR difference. "Read" (text recall) is measured separately from
"parsed" (exact field match) so parser gaps are not blamed on an engine.

The recognised text of these synthetic pages is held in memory only; results store
booleans, timings and parsed (already masked) values, never page text.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import resource
import sys
import time
from collections import defaultdict
from datetime import date
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
sys.path.insert(0, str(REPO / "apps" / "loan_advisory_portal"))
sys.path.insert(0, str(HERE))

from generate_synthetic_docs import dmy, money  # noqa: E402
from loan_advisory_portal.ocr.document_parser import parse  # noqa: E402
from loan_advisory_portal.ocr.field_checks import check_raw_identifiers  # noqa: E402
from loan_advisory_portal.ocr.masking import PAN_RE, mask_aadhaar, mask_pan  # noqa: E402
from loan_advisory_portal.ocr.schemas import ExtractionResult, FieldStatus  # noqa: E402

DOC_LABEL = {"PAN": "PAN Card", "AADHAAR": "Aadhaar Card", "PAYSLIP": "Salary Slip",
             "BANK_STATEMENT": "Bank Statement", "EMPLOYMENT_LETTER": "Employment Letter"}
CRITICAL = {"PAN": ("pan_number", "date_of_birth"), "AADHAAR": ("date_of_birth",),
            "PAYSLIP": ("net_salary", "employee_name"), "BANK_STATEMENT": ("salary_credits", "account_holder"),
            "EMPLOYMENT_LETTER": ("employer_name", "employment_start_date")}


FIELD_TYPE = {"pan_number": "id", "aadhaar_number": "id", "name": "name", "employee_name": "name",
              "account_holder": "name", "employer_name": "name", "date_of_birth": "date",
              "employment_start_date": "date", "net_salary": "amount", "gross_salary": "amount",
              "salary_credits": "amount", "closing_balance": "amount", "total_credits": "amount",
              "monthly_gross": "amount"}


def squash(text: str) -> str:
    return re.sub(r"\s+", "", str(text or "")).casefold()


def norm_name(text) -> str:
    return re.sub(r"\s+", " ", str(text or "")).strip(" .:-").casefold()


def money_eq(a, b) -> bool:
    try:
        return abs(float(a) - float(b)) < 0.005
    except (TypeError, ValueError):
        return False


# --------------------------------------------------------------------------- comparisons

def field_checks(truth: dict, fields: dict, text: str) -> list[dict]:
    """(category, field, parsed_exact, read_in_text) rows for one page."""
    t = truth["doc_type"]
    rows = []

    def add(category, key, parsed_ok, printed):
        item = fields.get(key)
        rows.append({"category": category, "field": key, "type": FIELD_TYPE.get(key, "text"),
                     "parsed_exact": bool(parsed_ok),
                     "read_in_text": squash(printed) in squash(text) if printed is not None else None,
                     "status": item.status.value if item is not None else "absent",
                     "confidence": item.confidence if item is not None and item.value not in (None, "") else None})

    def val(key):
        item = fields.get(key)
        return item.value if item is not None and item.status is not FieldStatus.INVALID else None

    if t == "PAN":
        full_hits = {re.sub(r"\s", "", m.group(0)) for m in PAN_RE.finditer(text.upper())}
        rows.append({"category": "pan_number", "field": "pan_full_10_chars", "parsed_exact": truth["pan_number"] in full_hits,
                     "read_in_text": squash(truth["pan_number"]) in squash(text), "status": "raw"})
        add("pan_number", "pan_number", val("pan_number") == mask_pan(truth["pan_number"]), truth["pan_number"])
        add("name", "name", norm_name(val("name")) == norm_name(truth["name"]), truth["name"])
        add("dob", "date_of_birth", val("date_of_birth") == truth["date_of_birth"],
            dmy(date.fromisoformat(truth["date_of_birth"])))
    elif t == "AADHAAR":
        add("name", "name", norm_name(val("name")) == norm_name(truth["name"]), truth["name"])
        add("dob", "date_of_birth", val("date_of_birth") == truth["date_of_birth"],
            dmy(date.fromisoformat(truth["date_of_birth"])))
        if truth["aadhaar_number"]:
            n = truth["aadhaar_number"]
            add("aadhaar", "aadhaar_number", val("aadhaar_number") == mask_aadhaar(n), f"{n[:4]} {n[4:8]} {n[8:]}")
        else:
            rows.append({"category": "aadhaar", "field": "aadhaar_last4_masked_card",
                         "parsed_exact": fields.get("aadhaar_number") is not None
                         and fields["aadhaar_number"].status is FieldStatus.MISSING,
                         "read_in_text": squash("XXXX XXXX " + truth["aadhaar_last4"]) in squash(text),
                         "status": "masked card: parser must report missing, never invent"})
    elif t == "PAYSLIP":
        add("name", "employee_name", norm_name(val("employee_name")) == norm_name(truth["employee_name"]), truth["employee_name"])
        add("employer", "employer_name", norm_name(val("employer_name")) == norm_name(truth["employer_name"]), truth["employer_name"])
        add("net_pay", "net_salary", money_eq(val("net_salary"), truth["net_salary"]), money(truth["net_salary"]))
        add("other", "gross_salary", money_eq(val("gross_salary"), truth["gross_salary"]), money(truth["gross_salary"]))
    elif t == "BANK_STATEMENT":
        add("name", "account_holder", norm_name(val("account_holder")) == norm_name(truth["account_holder"]), truth["account_holder"])
        add("salary_credits", "salary_credits", money_eq(val("salary_credits"), truth["salary_credits"]), None)
        add("other", "closing_balance", money_eq(val("closing_balance"), truth["closing_balance"]), money(truth["closing_balance"]))
        add("other", "total_credits", money_eq(val("total_credits"), truth["total_credits"]), money(truth["total_credits"]))
    elif t == "EMPLOYMENT_LETTER":
        add("name", "employee_name", norm_name(val("employee_name")) == norm_name(truth["employee_name"]), truth["employee_name"])
        add("employer", "employer_name", norm_name(val("employer_name")) == norm_name(truth["employer_name"]), truth["employer_name"])
        add("other", "employment_start_date", val("employment_start_date") == truth["employment_start_date"],
            dmy(date.fromisoformat(truth["employment_start_date"])))
        add("other", "monthly_gross", money_eq(val("monthly_gross"), truth["monthly_gross"]), money(truth["monthly_gross"]))
    return rows


def table_score_lines(truth: dict, lines: list[str]) -> dict:
    """Row recovery from line text: a row counts when one line holds its date, amount and balance."""
    sq = [squash(line) for line in lines]
    hit = dates = amounts = balances = 0
    for txn in truth["transactions"]:
        amount = money(txn["withdrawal"] or txn["deposit"])
        d, a, b = squash(dmy(date.fromisoformat(txn["date"]))), squash(amount), squash(money(txn["balance"]))
        if any(d in line and a in line and b in line for line in sq):
            hit += 1
        dated = [line for line in sq if line.startswith(d) or d in line]
        dates += bool(dated)
        amounts += any(a in line for line in dated)
        balances += any(b in line for line in dated)
    return {"rows_total": len(truth["transactions"]), "rows_exact": hit, "date_found": dates,
            "amount_on_dated_line": amounts, "balance_on_dated_line": balances}


def error_rates(reference: list[str], hypothesis: list[str]) -> dict:
    """CER/WER two ways. `page_*` compares the whole page in each engine's reading order;
    `line_*` aligns every reference line with its closest recognised line, so reading-order
    differences between engines are not counted as recognition errors."""
    from rapidfuzz.distance import Levenshtein  # noqa: PLC0415

    norm = lambda t: re.sub(r"\s+", " ", t).strip()  # noqa: E731
    ref = [norm(r) for r in reference if norm(r)]
    hyp = [norm(h) for h in hypothesis if norm(h)]
    ref_page, hyp_page = "\n".join(ref), "\n".join(hyp)
    out = {"ref_chars": len(ref_page), "ref_words": len(ref_page.split()),
           "page_char_edits": Levenshtein.distance(ref_page, hyp_page),
           "page_word_edits": Levenshtein.distance(ref_page.split(), hyp_page.split())}
    ce = we = 0
    for r in ref:
        if not hyp:
            ce += len(r)
            we += len(r.split())
            continue
        ce += min(Levenshtein.distance(r, h) for h in hyp)
        we += min(Levenshtein.distance(r.split(), h.split()) for h in hyp)
    out["line_char_edits"] = ce
    out["line_word_edits"] = we
    return out


class TreeRssSampler:
    """Samples RSS of this process plus its children (Tesseract runs as a child) every 10 ms."""

    def __init__(self):
        import threading  # noqa: PLC0415

        import psutil  # noqa: PLC0415

        self.proc = psutil.Process()
        self.peak = 0
        self._stop = threading.Event()
        self._thread = threading.Thread(target=self._loop, daemon=True)
        self._thread.start()

    def _tree_rss(self) -> int:
        total = 0
        try:
            total = self.proc.memory_info().rss
            for child in self.proc.children(recursive=True):
                try:
                    total += child.memory_info().rss
                except Exception:  # noqa: BLE001
                    pass
        except Exception:  # noqa: BLE001
            pass
        return total

    def _loop(self):
        while not self._stop.is_set():
            self.peak = max(self.peak, self._tree_rss())
            self._stop.wait(0.01)

    def reset(self) -> float:
        current = self._tree_rss()
        self.peak = current
        return current / 2**20

    def peak_mb(self) -> float:
        return self.peak / 2**20


def table_score_cells(truth: dict, table_rows: list[list[str]]) -> dict:
    """Row + column recovery from a structured table: every cell in the right column."""
    rows_exact = 0
    cells_ok = cells_total = 0
    sq_rows = [[squash(c) for c in row] for row in table_rows]
    for txn in truth["transactions"]:
        want = [dmy(date.fromisoformat(txn["date"])), txn["narration"],
                money(txn["withdrawal"]) if txn["withdrawal"] else "",
                money(txn["deposit"]) if txn["deposit"] else "", money(txn["balance"])]
        want = [squash(w) for w in want]
        best = 0
        for row in sq_rows:
            if len(row) < 5 or row[0] != want[0]:
                continue
            best = max(best, sum(1 for a, b in zip(row[:5], want) if a == b))
        cells_ok += best
        cells_total += 5
        rows_exact += best == 5
    return {"rows_total": len(truth["transactions"]), "rows_exact": rows_exact,
            "cells_exact": cells_ok, "cells_total": cells_total}


# --------------------------------------------------------------------------- engines

def make_engine(name: str):
    if name == "tesseract":
        from loan_advisory_portal.ocr.extractor import extract_lines, tesseract_version  # noqa: PLC0415
        return (lambda content, fn: extract_lines(content, fn)[0]), tesseract_version()
    if name in ("paddle_server", "paddle_mobile"):
        size = name.split("_")[1]
        os.environ["PADDLE_OCR_DET_MODEL"] = f"PP-OCRv5_{size}_det"
        os.environ["PADDLE_OCR_REC_MODEL"] = f"PP-OCRv5_{size}_rec"
        from loan_advisory_portal.ocr import paddle_engine  # noqa: PLC0415
        return (lambda content, fn: paddle_engine.extract_lines_paddle(content, fn)[0]), paddle_engine.engine_version()
    raise SystemExit(f"unknown engine {name}")


def rss_mb() -> tuple[float, float]:
    me = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024
    kids = resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss / 1024
    return round(me, 1), round(kids, 1)


def pages(data: Path):
    manifest = json.loads((data / "manifest.json").read_text())
    for doc in manifest["documents"]:
        truth = json.loads((data / doc["truth"]).read_text())
        for variant, name in truth["pages"].items():
            yield truth, variant, data / "pages" / name


def run_ocr(engine: str, data: Path, out: Path, limit: int | None) -> None:
    started = time.perf_counter()
    ocr, version = make_engine(engine)
    sampler = TreeRssSampler()
    rows = []
    warm = None
    for i, (truth, variant, path) in enumerate(pages(data)):
        if limit and i >= limit:
            break
        content = path.read_bytes()
        before_mb = sampler.reset()
        t0 = time.perf_counter()
        error = None
        try:
            lines = ocr(content, path.name)
        except Exception as exc:  # noqa: BLE001 - record and continue
            lines, error = [], type(exc).__name__
        seconds = time.perf_counter() - t0
        time.sleep(0.02)  # let the sampler catch the tail of the page
        page_peak_mb = sampler.peak_mb()
        if warm is None:
            warm = seconds
        text = "\n".join(line.text for line in lines)
        # Every bake-off page is a SPECIMEN, so validation runs in synthetic mode.
        synthetic = bool(truth.get("synthetic", True))
        fields, warnings, kind = (parse(DOC_LABEL[truth["doc_type"]], lines, text, synthetic=synthetic)
                                  if lines else ({}, [], None))
        result = ExtractionResult(DOC_LABEL[truth["doc_type"]], kind, engine, version, 1, fields, warnings) if kind else None
        if result is not None:
            from loan_advisory_portal.ocr.field_checks import apply_field_checks  # noqa: PLC0415
            date_checks = [c.as_dict() for c in apply_field_checks(result, today=date(2026, 11, 3))]
        else:
            date_checks = []
        row = {
            "engine": engine, "document_id": truth["document_id"], "doc_type": truth["doc_type"],
            "variant": variant, "seconds": round(seconds, 3), "error": error, "line_count": len(lines),
            "rss_before_mb": round(before_mb, 1), "page_peak_rss_mb": round(page_peak_mb, 1),
            "mean_line_conf": round(sum(line.confidence for line in lines) / len(lines), 1) if lines else None,
            "fields": field_checks(truth, fields, text),
            "critical_found": sum(1 for k in CRITICAL[truth["doc_type"]]
                                  if k in fields and fields[k].status is FieldStatus.FOUND),
            "critical_total": len(CRITICAL[truth["doc_type"]]),
            "parsed": {k: {"value": v.value, "status": v.status.value, "confidence": v.confidence}
                       for k, v in fields.items()},
            "raw_checks": [c.as_dict() for c in check_raw_identifiers(text, synthetic=synthetic)],
            "date_checks": date_checks,
        }
        if truth.get("reference_lines"):
            row["error_rates"] = error_rates(truth["reference_lines"], [line.text for line in lines])
        if truth["doc_type"] == "BANK_STATEMENT":
            row["transaction_count_parsed"] = (fields["transaction_count"].value
                                               if "transaction_count" in fields else None)
            row["table_lines"] = table_score_lines(truth, [line.text for line in lines])
        del text
        rows.append(row)
        print(f"{engine} {truth['document_id']} {variant} {seconds:.2f}s lines={len(lines)} err={error}", flush=True)
    me, kids = rss_mb()
    summary = {"engine": engine, "version": version, "pages": len(rows),
               "total_seconds": round(time.perf_counter() - started, 1),
               "first_page_seconds": round(warm or 0, 2), "peak_rss_mb_python": me,
               "peak_rss_mb_children": kids, "cpu_count": os.cpu_count(),
               "omp_threads": os.environ.get("OMP_NUM_THREADS")}
    out.mkdir(parents=True, exist_ok=True)
    (out / f"{engine}.json").write_text(json.dumps({"summary": summary, "rows": rows}, indent=1, default=str))
    print(json.dumps(summary))


def run_ppstructure(data: Path, out: Path) -> None:
    """Table recognition on bank statements only (PP-StructureV3 table pipeline, CPU)."""
    from html.parser import HTMLParser  # noqa: PLC0415

    from paddleocr import TableRecognitionPipelineV2  # noqa: PLC0415

    class Cells(HTMLParser):
        def __init__(self):
            super().__init__()
            self.rows, self._row, self._cell, self._in = [], None, "", False

        def handle_starttag(self, tag, attrs):
            if tag == "tr":
                self._row = []
            elif tag in ("td", "th"):
                self._in, self._cell = True, ""

        def handle_endtag(self, tag):
            if tag in ("td", "th") and self._row is not None:
                self._row.append(self._cell.strip())
                self._in = False
            elif tag == "tr" and self._row is not None:
                self.rows.append(self._row)
                self._row = None

        def handle_data(self, d):
            if self._in:
                self._cell += d

    started = time.perf_counter()
    pipe = TableRecognitionPipelineV2(use_doc_orientation_classify=False, use_doc_unwarping=False,
                                      use_layout_detection=True, use_ocr_model=True,
                                      text_detection_model_name="PP-OCRv5_server_det",
                                      text_recognition_model_name="PP-OCRv5_server_rec", device="cpu")
    init_s = time.perf_counter() - started
    rows = []
    for truth, variant, path in pages(data):
        if truth["doc_type"] != "BANK_STATEMENT":
            continue
        t0 = time.perf_counter()
        error = None
        table_rows: list[list[str]] = []
        try:
            res = pipe.predict(str(path))[0]
            for table in res["table_res_list"]:
                parser = Cells()
                parser.feed(table["pred_html"])
                table_rows.extend(parser.rows)
        except Exception as exc:  # noqa: BLE001
            error = f"{type(exc).__name__}: {str(exc)[:120]}"
        seconds = time.perf_counter() - t0
        score = table_score_cells(truth, table_rows)
        rows.append({"engine": "ppstructure_table", "document_id": truth["document_id"], "variant": variant,
                     "seconds": round(seconds, 2), "error": error, "table_rows_found": len(table_rows), **score})
        print(rows[-1], flush=True)
    me, kids = rss_mb()
    summary = {"engine": "ppstructure_table", "pages": len(rows), "init_seconds": round(init_s, 1),
               "total_seconds": round(time.perf_counter() - started, 1), "peak_rss_mb_python": me}
    out.mkdir(parents=True, exist_ok=True)
    (out / "ppstructure.json").write_text(json.dumps({"summary": summary, "rows": rows}, indent=1))
    print(json.dumps(summary))


# --------------------------------------------------------------------------- report

def pct(a: int, b: int) -> str:
    return f"{100 * a / b:.0f}% ({a}/{b})" if b else "n/a"


def report(out: Path) -> None:
    engines = [e for e in ("tesseract", "paddle_mobile", "paddle_server") if (out / f"{e}.json").exists()]
    data = {e: json.loads((out / f"{e}.json").read_text()) for e in engines}
    md = ["<!-- generated by scripts/saral_ocr/ocr_bakeoff.py report; AUTOMATED, synthetic data -->", ""]
    cats = [("pan_number", "pan_full_10_chars", "PAN number, all 10 characters (raw read)"),
            ("pan_number", "pan_number", "PAN number, PR #41 masked output"),
            ("name", None, "Name (PAN, Aadhaar, payslip, statement, letter)"),
            ("dob", None, "Date of birth (PAN, Aadhaar)"),
            ("net_pay", None, "Net pay (payslip)"),
            ("employer", None, "Employer (payslip, letter)"),
            ("salary_credits", None, "Statement salary credits (sum)"),
            ("aadhaar", None, "Aadhaar number / masked-card handling")]
    for variant_filter, title in ((None, "All pages"), ("clean", "Clean pages"), ("degraded", "Degraded pages (all kinds)")):
        md.append(f"#### Field exact match, parsed by the PR #41 parser: {title}")
        md.append("")
        md.append("| Field | " + " | ".join(engines) + " |")
        md.append("|---|" + "---|" * len(engines))
        for cat, fkey, label in cats:
            cells = []
            for e in engines:
                ok = tot = 0
                for row in data[e]["rows"]:
                    if variant_filter == "clean" and row["variant"] != "clean":
                        continue
                    if variant_filter == "degraded" and row["variant"] == "clean":
                        continue
                    for f in row["fields"]:
                        if f["category"] == cat and (fkey is None or f["field"] == fkey):
                            tot += 1
                            ok += f["parsed_exact"]
                cells.append(pct(ok, tot))
            md.append(f"| {label} | " + " | ".join(cells) + " |")
        md.append("")
    md.append("#### Engine read the printed value (text recall, parser-independent), all pages")
    md.append("")
    md.append("| Field | " + " | ".join(engines) + " |")
    md.append("|---|" + "---|" * len(engines))
    for cat, fkey, label in cats:
        cells = []
        for e in engines:
            ok = tot = 0
            for row in data[e]["rows"]:
                for f in row["fields"]:
                    if f["category"] == cat and (fkey is None or f["field"] == fkey) and f["read_in_text"] is not None:
                        tot += 1
                        ok += f["read_in_text"]
            cells.append(pct(ok, tot))
        md.append(f"| {label} | " + " | ".join(cells) + " |")
    md.append("")
    md.append("#### By degradation (all fields, parsed exact)")
    md.append("")
    kinds = ["clean", "rotation", "blur", "jpeg_noise", "phone_perspective", "low_resolution"]
    md.append("| Engine | " + " | ".join(kinds) + " |")
    md.append("|---|" + "---|" * len(kinds))
    for e in engines:
        cells = []
        for k in kinds:
            ok = tot = 0
            for row in data[e]["rows"]:
                if row["variant"] != k:
                    continue
                for f in row["fields"]:
                    if f["category"] == "aadhaar" and f["field"] == "aadhaar_last4_masked_card":
                        continue
                    tot += 1
                    ok += f["parsed_exact"]
            cells.append(pct(ok, tot))
        md.append(f"| {e} | " + " | ".join(cells) + " |")
    md.append("")
    md.append("#### Bank statement table rows recovered (date + amount + balance on one line)")
    md.append("")
    md.append("| Engine | clean | degraded |")
    md.append("|---|---|---|")
    for e in engines:
        acc = defaultdict(lambda: [0, 0])
        for row in data[e]["rows"]:
            if "table_lines" in row:
                key = "clean" if row["variant"] == "clean" else "degraded"
                acc[key][0] += row["table_lines"]["rows_exact"]
                acc[key][1] += row["table_lines"]["rows_total"]
        md.append(f"| {e} (line grouping) | {pct(*acc['clean'])} | {pct(*acc['degraded'])} |")
    if (out / "ppstructure.json").exists():
        pp = json.loads((out / "ppstructure.json").read_text())
        acc = defaultdict(lambda: [0, 0, 0, 0])
        for row in pp["rows"]:
            key = "clean" if row["variant"] == "clean" else "degraded"
            acc[key][0] += row["rows_exact"]
            acc[key][1] += row["rows_total"]
            acc[key][2] += row["cells_exact"]
            acc[key][3] += row["cells_total"]
        md.append(f"| PP-Structure table (all 5 cells in right column) | {pct(*acc['clean'][:2])} | {pct(*acc['degraded'][:2])} |")
        md.append(f"| PP-Structure table (cell-level) | {pct(*acc['clean'][2:])} | {pct(*acc['degraded'][2:])} |")
    md.append("")
    md.append("#### Latency and memory (InstaBox, 4 vCPU, no GPU)")
    md.append("")
    md.append("| Engine | median s/page | p90 s/page | first page s | total s (all pages) | peak RSS MB |")
    md.append("|---|---|---|---|---|---|")
    for e in engines:
        secs = sorted(r["seconds"] for r in data[e]["rows"])
        s = data[e]["summary"]
        peak = s["peak_rss_mb_children"] if e == "tesseract" else s["peak_rss_mb_python"]
        label = f"{peak} (tesseract process); python {s['peak_rss_mb_python']}" if e == "tesseract" else f"{peak}"
        md.append(f"| {e} | {secs[len(secs) // 2]:.2f} | {secs[int(len(secs) * 0.9)]:.2f} | {s['first_page_seconds']} | "
                  f"{s['total_seconds']} | {label} |")
    if (out / "ppstructure.json").exists():
        pp = json.loads((out / "ppstructure.json").read_text())
        secs = sorted(r["seconds"] for r in pp["rows"])
        md.append(f"| ppstructure table (bank pages only) | {secs[len(secs) // 2]:.2f} | {secs[int(len(secs) * 0.9)]:.2f} | "
                  f"init {pp['summary']['init_seconds']} | {pp['summary']['total_seconds']} ({len(secs)} pages) | "
                  f"{pp['summary']['peak_rss_mb_python']} |")
    md.append("")
    # Simulated chain: paddle_server first, tesseract when paddle misses a critical field.
    if "paddle_server" in data and "tesseract" in data:
        md.append("#### Simulated fallback chain (Paddle server -> Tesseract -> manual review)")
        md.append("")
        tess = {(r["document_id"], r["variant"]): r for r in data["tesseract"]["rows"]}
        route = defaultdict(int)
        ok = tot = 0
        for r in data["paddle_server"]["rows"]:
            t = tess[(r["document_id"], r["variant"])]
            if r["critical_found"] == r["critical_total"]:
                chosen, name = r, "paddle"
            elif t["critical_found"] == t["critical_total"]:
                chosen, name = t, "tesseract"
            else:
                chosen = r if r["critical_found"] >= t["critical_found"] else t
                name = "manual_review"
            route[name] += 1
            for f in chosen["fields"]:
                if f["field"] == "aadhaar_last4_masked_card":
                    continue
                tot += 1
                ok += f["parsed_exact"]
        md.append(f"Routes over {sum(route.values())} pages: " + ", ".join(f"{k} {v}" for k, v in sorted(route.items())) + ".")
        md.append(f"All-field parsed exact match of the chosen attempt: {pct(ok, tot)}.")
        md.append("")
    # validation
    md.append("#### Validation checks fired (all engines, all pages)")
    md.append("")
    md.append("| Engine | PAN regex fail | Aadhaar Verhoeff fail | date sanity fail | date sanity pass |")
    md.append("|---|---|---|---|---|")
    for e in engines:
        pf = sum(1 for r in data[e]["rows"] for c in r["raw_checks"] if c["check"] == "pan_regex" and not c["passed"])
        af = sum(1 for r in data[e]["rows"] for c in r["raw_checks"] if c["check"] == "aadhaar_verhoeff" and not c["passed"])
        df = sum(1 for r in data[e]["rows"] for c in r["date_checks"] if c["check"] == "date_sanity" and not c["passed"])
        dp = sum(1 for r in data[e]["rows"] for c in r["date_checks"] if c["check"] == "date_sanity" and c["passed"])
        md.append(f"| {e} | {pf} | {af} | {df} | {dp} |")
    md.append("")
    md.extend(extra_sections(data, kinds))
    (out / "bakeoff_tables.md").write_text("\n".join(md))
    print("\n".join(md))


def extra_sections(data: dict, kinds: list[str]) -> list[str]:
    """CER/WER, amount/date accuracy, transactions, confidence calibration, per-page memory."""
    engines = list(data)
    md: list[str] = []
    has_err = any("error_rates" in r for e in engines for r in data[e]["rows"])
    if has_err:
        md += ["#### Character and word error rates (lower is better)", "",
               "Line-aligned: each printed line vs its closest recognised line (reading order ignored). "
               "Page: whole page in each engine's own reading order.", "",
               "| Engine | variant | CER line-aligned | WER line-aligned | CER page | WER page |", "|---|---|---|---|---|---|"]
        for e in engines:
            for k in kinds:
                rs = [r["error_rates"] for r in data[e]["rows"] if r["variant"] == k and "error_rates" in r]
                if not rs:
                    continue
                c, w = sum(x["ref_chars"] for x in rs), sum(x["ref_words"] for x in rs)
                md.append(f"| {e} | {k} | {100 * sum(x['line_char_edits'] for x in rs) / c:.1f}% | "
                          f"{100 * sum(x['line_word_edits'] for x in rs) / w:.1f}% | "
                          f"{100 * sum(x['page_char_edits'] for x in rs) / c:.1f}% | "
                          f"{100 * sum(x['page_word_edits'] for x in rs) / w:.1f}% |")
        md.append("")
    md += ["#### Accuracy by value type (parsed exact match), per degradation", "",
           "| Engine | type | " + " | ".join(kinds) + " | all |", "|---|---|" + "---|" * (len(kinds) + 1)]
    for e in engines:
        for typ in ("amount", "date", "name", "id"):
            cells, ok_all, tot_all = [], 0, 0
            for k in kinds:
                fs = [f for r in data[e]["rows"] if r["variant"] == k for f in r["fields"] if f.get("type") == typ]
                ok = sum(f["parsed_exact"] for f in fs)
                ok_all, tot_all = ok_all + ok, tot_all + len(fs)
                cells.append(pct(ok, len(fs)))
            md.append(f"| {e} | {typ} | " + " | ".join(cells) + f" | {pct(ok_all, tot_all)} |")
    md.append("")
    md += ["#### Bank-statement transaction extraction (12 transactions per statement)", "",
           "| Engine | variant | full row (date+amount+balance) | date found | amount on dated line | balance on dated line | transaction count parsed = 12 |",
           "|---|---|---|---|---|---|---|"]
    for e in engines:
        for k in kinds:
            rs = [r for r in data[e]["rows"] if r["variant"] == k and "table_lines" in r]
            if not rs:
                continue
            t = sum(r["table_lines"]["rows_total"] for r in rs)
            g = lambda key: sum(r["table_lines"].get(key, 0) for r in rs)  # noqa: E731
            cnt = sum(r.get("transaction_count_parsed") == 12 for r in rs)
            md.append(f"| {e} | {k} | {pct(g('rows_exact'), t)} | {pct(g('date_found'), t)} | "
                      f"{pct(g('amount_on_dated_line'), t)} | {pct(g('balance_on_dated_line'), t)} | {pct(cnt, len(rs))} |")
    md.append("")
    md += ["#### Confidence calibration: does reported confidence predict a correct field?", "",
           "Only fields the parser returned a value for (a missing field has no confidence). "
           "Confidence is Tesseract's mean word confidence or Paddle's mean box score, both on 0-100.", "",
           "| Engine | fields with a value | accuracy | <80 | 80-90 | 90-95 | 95-100 | AUROC (conf -> correct) | ECE |",
           "|---|---|---|---|---|---|---|---|---|"]
    for e in engines:
        fs = [f for r in data[e]["rows"] for f in r["fields"] if f.get("confidence") is not None]
        if not fs:
            continue
        bins = [(0, 80), (80, 90), (90, 95), (95, 100.01)]
        cells = []
        ece = 0.0
        for lo, hi in bins:
            b = [f for f in fs if lo <= f["confidence"] < hi]
            acc = sum(f["parsed_exact"] for f in b)
            cells.append(f"{pct(acc, len(b))}" if b else "-")
            if b:
                ece += len(b) / len(fs) * abs(acc / len(b) - sum(f["confidence"] for f in b) / 100 / len(b))
        pos = [f["confidence"] for f in fs if f["parsed_exact"]]
        neg = [f["confidence"] for f in fs if not f["parsed_exact"]]
        auroc = (sum((p > n) + 0.5 * (p == n) for p in pos for n in neg) / (len(pos) * len(neg))
                 if pos and neg else float("nan"))
        md.append(f"| {e} | {len(fs)} | {pct(len(pos), len(fs))} | " + " | ".join(cells) + f" | {auroc:.2f} | {ece:.3f} |")
    md.append("")
    md += ["#### Peak memory per page (process + child processes, sampled every 10 ms)", "",
           "| Engine | RSS before first page MB | first page peak MB (includes lazy model load) | median page peak MB | max page peak MB | median per-page growth over pre-page RSS MB (pages 2+) |",
           "|---|---|---|---|---|---|"]
    for e in engines:
        rs = [r for r in data[e]["rows"] if "page_peak_rss_mb" in r]
        if not rs:
            continue
        peaks = sorted(r["page_peak_rss_mb"] for r in rs)
        deltas = sorted(r["page_peak_rss_mb"] - r["rss_before_mb"] for r in rs[1:]) or [0.0]
        md.append(f"| {e} | {rs[0]['rss_before_mb']} | {rs[0]['page_peak_rss_mb']} | {peaks[len(peaks) // 2]} | "
                  f"{peaks[-1]} | {deltas[len(deltas) // 2]:.1f} |")
    md.append("")
    return md


def main() -> None:
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("run")
    r.add_argument("--engine", required=True)
    r.add_argument("--data", type=Path, required=True)
    r.add_argument("--out", type=Path, required=True)
    r.add_argument("--limit", type=int)
    rep = sub.add_parser("report")
    rep.add_argument("--out", type=Path, required=True)
    args = ap.parse_args()
    if args.cmd == "report":
        report(args.out)
    elif args.engine == "ppstructure":
        run_ppstructure(args.data, args.out)
    else:
        run_ocr(args.engine, args.data, args.out, args.limit)


if __name__ == "__main__":
    main()
