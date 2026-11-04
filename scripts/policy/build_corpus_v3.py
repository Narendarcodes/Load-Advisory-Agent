"""Build the Saral corpus v3 (Gate G1): two separate collections from the CURRENT corpus, no new documents.

    saral_nbfc_policy  Bajaj Finance Limited only (public reference lender, not a partner)
    rbi_regulatory     RBI texts applicable to an NBFC borrower only

Reads the already-fetched texts (<src>/<DOC>.txt, plus <DOC>.raw where a fix needs it, and <src>/manifest.json)
and data/corpus_v3/collections.yaml. Writes:

    <out>/<collection>.chunks.jsonl        chunk text + metadata (NOT for git: texts stay outside the repo)
    <out>/clean/<DOC>.txt                  cleaned document bodies (NOT for git)
    data/corpus_v3/manifest.json|.csv      per-document decision, hashes, counts (metadata only, committed)
    data/corpus_v3/chunk_index.csv         per-chunk id / sha256 / section / words, no text (committed)
    data/corpus_v3/dedup_log.json          dropped duplicate chunks and the chunk each one duplicated
    data/corpus_v3/conflicts.json          recorded (not resolved) figure conflicts across Bajaj pages
    data/corpus_v3/purpose_mentions.json   which Bajaj chunks mention each loan purpose (evidence for G1 §5)

Chunking is the repo's own rag.corpus.chunk_document with its default settings; nothing is invented or fetched.

    python scripts/policy/build_corpus_v3.py --src <runs/policy_local/src> --out <dir outside git>
"""
import argparse
import csv
import hashlib
import json
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from rag.corpus import _blocks_from_text, chunk_document, extract, register  # noqa: E402

V3 = ROOT / "data" / "corpus_v3"
AI_START, AI_END = "AI Overview", "Assess the information carefully before relying on it."
AI_REVIEW_TAG = "Generated from the text of customer reviews."  # the line it follows is a machine summary
TOP = re.compile(r"^([0-9]{1,2})\.\s+(\S.*)$")

PURPOSES = {  # word patterns only; a hit is a mention, never a rule. Rules are judged by reading the chunk.
    "wedding": r"\bwedding|\bmarriage",
    "higher_education": r"\beducation|\bstudy abroad|\bhigher stud|\btuition|\bcollege fee|\bcourse fee",
    "home_renovation": r"\brenovat|\bhome improvement|\bhome repair|\bhome makeover|\brefurbish",
    "medical_emergency": r"\bmedical|\bhospital|\bhealth ?care|\bsurgery|\bemergenc",
    "travel": r"\btravel|\bvacation|\bholiday",
    "debt_consolidation": r"\bdebt consolidation|\bconsolidat\w* (?:your |multiple |existing )?(?:debt|loan)",
}
AMOUNT = re.compile(r"(?:Rs\.?|₹|INR)\s?([0-9][0-9,.]*)\s?(lakh|crore)", re.I)
SCORE = re.compile(r"(?:CIBIL|credit) [Ss]core[^.]{0,40}?\b([5-9][0-9]{2})\b")


def sha(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def read_text(p: Path) -> str:
    return p.read_text(encoding="utf-8").replace("\r\n", "\n")  # copies saved on Windows carry CRLF


# ----------------------------------------------------------------------------------------- text fixes
def fix_reslice_from_raw(did, body, cfg, src, log):
    raw = (src / f"{did}.raw").read_bytes()
    text = extract(raw, cfg.get("source_url", ""), cfg.get("html_root"))
    s, e = cfg["start_marker"], cfg["end_marker"]
    if text.count(s) != 1 or text.count(e) != 1:  # corpus.py silently ignores a missing / repeated marker; we fail
        raise SystemExit(f"{did}: markers must each occur exactly once (start={text.count(s)}, end={text.count(e)})")
    sliced = text[text.index(s):]
    sliced = sliced[: sliced.rindex(e)]
    new = "\n".join(_blocks_from_text(sliced))
    log.append({"fix": "reslice_from_raw", "extracted_chars": len(text), "slice_chars": len(sliced),
                "before_chars": len(body), "after_chars": len(new), "start_marker": s, "end_marker": e,
                "mirrors": "origin/feat/agent-boundary-corpus-reset 9afb5fc (register markers)"})
    return new


def fix_drop_ai_overview(did, body, cfg, src, log):
    lines, out, skipping, removed, blocks = body.split("\n"), [], False, 0, 0
    for ln in lines:
        if not skipping and ln.strip() == AI_START:
            skipping, blocks = True, blocks + 1
        if skipping:
            removed += 1
            if ln.strip().startswith(AI_END):
                skipping = False
            continue
        out.append(ln)
    if skipping:
        raise SystemExit(f"{did}: an AI Overview block has no closing disclaimer line")
    review_summaries = 0
    while AI_REVIEW_TAG in out:  # "Customers say" machine summary of reviews + its attribution line
        i = out.index(AI_REVIEW_TAG)
        del out[i - 1: i + 1]
        removed, review_summaries = removed + 2, review_summaries + 1
    left = sum("AI-powered responses may not always be accurate" in ln for ln in out)
    if left:
        raise SystemExit(f"{did}: {left} AI disclaimer line(s) survived the removal")
    log.append({"fix": "drop_ai_overview", "blocks_removed": blocks, "review_summaries_removed": review_summaries,
                "lines_removed": removed})
    return "\n".join(out)


def fix_drop_repeated_banner(did, body, cfg, src, log):
    pre, out, seen, dropped = cfg["banner_prefix"], [], False, 0
    for ln in body.split("\n"):
        if ln.startswith(pre):
            if seen:
                dropped += 1
                continue
            seen = True
        out.append(ln)
    log.append({"fix": "drop_repeated_banner", "kept_first": seen, "repeats_dropped": dropped})
    return "\n".join(out)


def fix_unnumber_partner_table(did, body, cfg, src, log):
    """'1. Customer acquisition' inside the LSP table is a cell list, not a document section; chunk_document
    treats it as a top-level paragraph and cuts every row into identical fragments. Rewrite 'N. x' -> 'N) x'
    up to the disclaimer list that follows the table. Wording is unchanged."""
    out, in_table, n = [], True, 0
    for ln in body.split("\n"):
        if ln.startswith(cfg["table_end_prefix"]):
            in_table = False
        m = TOP.match(ln) if in_table else None
        if m:
            ln, n = f"{m.group(1)}) {m.group(2)}", n + 1
        out.append(ln)
    if in_table:
        raise SystemExit(f"{did}: table end marker not found")
    log.append({"fix": "unnumber_partner_table", "lines_rewritten": n})
    return "\n".join(out)


FIXES = {"reslice_from_raw": fix_reslice_from_raw, "drop_ai_overview": fix_drop_ai_overview,
         "drop_repeated_banner": fix_drop_repeated_banner, "unnumber_partner_table": fix_unnumber_partner_table}


def as_of(r, m, dec):
    """The document's own stated date; an undated web page is as of its fetch date. Never guessed."""
    stated = r.get("effective_from") or r.get("publication_date")
    if "blank_updated_as_on_date" in dec.get("flags", []):
        return f"{stated} (registration date; 'updated as on' left blank - currency unknown)"
    if stated:
        return str(stated)
    return f"page undated; as fetched {m['retrieved_at'][:10]}" if m.get("retrieved_at") else "undated"


# ----------------------------------------------------------------------------------------- build
def build(src: Path, out: Path):
    cfg = yaml.safe_load((V3 / "collections.yaml").read_text(encoding="utf-8"))
    reg = {d["document_id"]: d for d in register()}
    man = json.loads((src / "manifest.json").read_text(encoding="utf-8"))
    missing = set(reg) - set(cfg["documents"])
    if missing:
        raise SystemExit(f"register documents without a v3 decision: {sorted(missing)}")
    (out / "clean").mkdir(parents=True, exist_ok=True)
    rows, by_col, dedup, before = [], {c: [] for c in cfg["collections"]}, [], {}
    for did, dec in cfg["documents"].items():
        r, m, col = reg[did], man.get(did, {}), dec.get("collection")
        row = {"document_id": did, "collection": col, "include": bool(dec["include"]), "reason": dec["reason"],
               "doc_type": f"{r.get('source_type')}/{r.get('document_type')}", "publisher": r.get("publisher"),
               "source_url": r.get("source_url"), "approval_status_register": r.get("approval_status"),
               "as_of_date": as_of(r, m, dec),
               "retrieved_at": m.get("retrieved_at"), "fetch_method": m.get("fetch_method"),
               "raw_sha256": m.get("raw_sha256"), "flags": dec.get("flags", []), "fixes": [],
               "chunks_before": None, "chunks_after": 0, "duplicates_dropped": 0, "clean_text_sha256": None,
               "clean_chars": None}
        if col is not None and r.get("lender_id") != cfg["collections"][col]["lender_id"]:
            raise SystemExit(f"{did}: lender_id {r.get('lender_id')!r} does not belong in {col}")
        if m.get("status") != "fetched":
            row["include"] = False
            rows.append(row)
            continue
        txt = src / f"{did}.txt"
        if not txt.exists() and not row["include"]:  # excluded and not copied (other lenders, fixtures)
            rows.append(row)
            continue
        body = read_text(txt)
        row["chunks_before"] = len(chunk_document(r, body))
        before[did] = row["chunks_before"]
        if not row["include"]:
            rows.append(row)
            continue
        log = []
        for f in dec.get("fixes", []):
            body = FIXES[f](did, body, {**r, **dec}, src, log)
        row["fixes"] = log
        (out / "clean" / f"{did}.txt").write_text(body, encoding="utf-8")
        row["clean_text_sha256"], row["clean_chars"] = sha(body), len(body)
        chunks = chunk_document(r, body)
        for c in chunks:
            c["collection"] = col
            c["corpus_version"] = cfg["version"]
            c["source_retrieved_at"] = m.get("retrieved_at")
            c["flags"] = dec.get("flags", [])
        row["_chunks"] = chunks
        rows.append(row)
    # dedup within each collection, first occurrence wins (documents in collections.yaml order)
    for col in by_col:
        seen = {}
        for row in rows:
            if row["collection"] != col or not row.get("_chunks"):
                continue
            keep = []
            for c in row.pop("_chunks"):
                if c["chunk_sha256"] in seen:
                    dedup.append({"collection": col, "dropped": c["chunk_id"], "duplicate_of": seen[c["chunk_sha256"]],
                                  "chunk_sha256": c["chunk_sha256"], "words": len(c["text"].split())})
                    row["duplicates_dropped"] += 1
                    continue
                seen[c["chunk_sha256"]] = c["chunk_id"]
                keep.append(c)
            row["chunks_after"] = len(keep)
            by_col[col] += keep
    for row in rows:
        row.pop("_chunks", None)
    return cfg, rows, by_col, dedup


def scan_conflicts(by_col):
    """Record every loan-amount ceiling and credit-score figure the Bajaj pages state. Nothing is resolved."""
    amounts, scores = {}, {}
    for c in by_col["saral_nbfc_policy"]:
        for mt in AMOUNT.finditer(c["text"]):
            ctx = c["text"][max(0, mt.start() - 60): mt.end() + 20].lower()
            if "up to" in ctx or "upto" in ctx or "ranging" in ctx or " to " in ctx[50:]:
                amounts.setdefault(f"Rs. {mt.group(1)} {mt.group(2).lower()}", set()).add(c["chunk_id"])
        for mt in SCORE.finditer(c["text"]):
            scores.setdefault(mt.group(1), set()).add(c["chunk_id"])
    return {"loan_amount_ceiling_mentions": {k: sorted(v) for k, v in sorted(amounts.items())},
            "credit_score_mentions": {k: sorted(v) for k, v in sorted(scores.items())}}


def purpose_mentions(by_col):
    res = {}
    for p, pat in PURPOSES.items():
        rx = re.compile(pat, re.I)
        hits = [c["chunk_id"] for c in by_col["saral_nbfc_policy"] if rx.search(c["text"])]
        docs = sorted({h.split("#")[0] for h in hits})
        res[p] = {"pattern": pat, "documents": docs, "chunks": hits}
    return res


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--src", required=True, help="already-fetched texts (runs/policy_local/src)")
    ap.add_argument("--out", required=True, help="output dir for chunk text (keep outside git)")
    a = ap.parse_args(argv)
    src, out = Path(a.src), Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    cfg, rows, by_col, dedup = build(src, out)
    for col, chunks in by_col.items():
        with (out / f"{col}.chunks.jsonl").open("w", encoding="utf-8") as f:
            for c in chunks:
                f.write(json.dumps(c, ensure_ascii=False) + "\n")
    summary = {col: {"documents": len({c["document_id"] for c in ch}), "chunks": len(ch)} for col, ch in by_col.items()}
    manifest = {"version": cfg["version"], "built_from": cfg["built_from"], "chunker": cfg["chunker"],
                "dedup": cfg["dedup"], "collections": {**cfg["collections"]}, "summary": summary, "documents": rows}
    for col in summary:
        manifest["collections"][col] = {**cfg["collections"][col], **summary[col]}
    (V3 / "manifest.json").write_text(json.dumps(manifest, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    cols = ["document_id", "collection", "include", "reason", "doc_type", "source_url", "as_of_date", "retrieved_at",
            "clean_text_sha256", "chunks_before", "chunks_after", "duplicates_dropped", "flags", "fixes"]
    with (V3 / "manifest.csv").open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow({**r, "flags": ";".join(r["flags"]), "fixes": ";".join(x["fix"] for x in r["fixes"])})
    with (V3 / "chunk_index.csv").open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["collection", "chunk_id", "document_id", "section", "page_start", "page_end", "words", "chunk_sha256"])
        for col, ch in by_col.items():
            for c in ch:
                w.writerow([col, c["chunk_id"], c["document_id"], c["section"], c["page_start"], c["page_end"],
                            len(c["text"].split()), c["chunk_sha256"]])
    (V3 / "dedup_log.json").write_text(json.dumps(dedup, indent=1) + "\n", encoding="utf-8")
    (V3 / "conflicts_scan.json").write_text(json.dumps(scan_conflicts(by_col), indent=1, ensure_ascii=False) + "\n",
                                            encoding="utf-8")
    (V3 / "purpose_mentions.json").write_text(json.dumps(purpose_mentions(by_col), indent=1) + "\n", encoding="utf-8")
    print(json.dumps({"summary": summary, "duplicates_dropped": len(dedup)}, indent=1))


if __name__ == "__main__":
    main()
