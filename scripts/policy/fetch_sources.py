"""Fetch registered policy sources and build section chunks.

    LOAN_POLICY_DIR=/root/hx/loan/policy python scripts/policy/fetch_sources.py [--only ID,ID] [--export-manifest PATH]
Writes $LOAN_POLICY_DIR/src/{<doc>.raw,<doc>.txt,manifest.json,review_events.json} and
$LOAN_POLICY_DIR/chunks.jsonl. (Falls back to $LOAN_DATA_DIR/policy for the phase-4 layout.)
Browser-downloaded PDFs (rbidocs bot challenge) must be in $LOAN_POLICY_DIR/manual/<local_file>.
Content changes are review events only; approval_status is never changed by this script.
--export-manifest writes the metadata-only manifest (URL, fetch date, sha256, size, method; no text)
for committing to git.

The fetch runs in a staging tree and only replaces the live tree/chunks.jsonl after every selected
document fetched and produced chunks. A failed or partial fetch leaves the previous corpus intact.
"""
import argparse
import json
import os
import shutil
import sys
import tempfile
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from rag.corpus import build_chunks, fetch_all, register  # noqa: E402


def stage_fetch(base: Path, only: set | None):
    """Fetch into a copy of the current tree; abort (leaving the live tree untouched) on any failure."""
    base.mkdir(parents=True, exist_ok=True)
    stage = Path(tempfile.mkdtemp(prefix=".src.new-", dir=base))
    src = base / "src"
    if src.exists():
        shutil.copytree(src, stage, dirs_exist_ok=True)
    res = fetch_all(stage, only=only)
    failed = sorted(did for did, m in res["manifest"].items() if m.get("status") == "error")
    if failed:
        shutil.rmtree(stage, ignore_errors=True)
        raise SystemExit(f"fetch failed for {failed}; existing corpus left untouched")
    chunks = build_chunks(stage)
    fetched = {did for did, m in res["manifest"].items() if m.get("status") == "fetched"}
    empty = sorted(did for did in fetched if not any(c["document_id"] == did for c in chunks))
    if not chunks or empty:
        shutil.rmtree(stage, ignore_errors=True)
        raise SystemExit(f"no chunks produced for {empty or 'the corpus'}; existing corpus left untouched")
    return stage, chunks, res


def publish(base: Path, stage: Path, chunks: list) -> None:
    """Swap the staged tree and chunk file in. Two renames, not one transaction: a crash between
    them leaves the previous tree at .src.old-* and the old chunks.jsonl in place."""
    new_chunks = base / ".chunks.jsonl.new"
    new_chunks.write_text("".join(json.dumps(c, ensure_ascii=False) + "\n" for c in chunks), encoding="utf-8")
    src = base / "src"
    backup = base / f".src.old-{time.time_ns()}"
    if src.exists():
        os.replace(src, backup)
    try:
        os.replace(stage, src)
        os.replace(new_chunks, base / "chunks.jsonl")
    except BaseException:
        if src.exists():
            shutil.rmtree(src)
        if backup.exists():
            os.replace(backup, src)
        new_chunks.unlink(missing_ok=True)
        raise
    shutil.rmtree(backup, ignore_errors=True)


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="")
    ap.add_argument("--export-manifest", default="")
    a = ap.parse_args(argv)
    base = Path(os.environ.get("LOAN_POLICY_DIR") or Path(os.environ.get("LOAN_DATA_DIR", "/root/hx/loan/data")) / "policy")
    stage, chunks, res = stage_fetch(base, set(filter(None, a.only.split(","))) or None)
    publish(base, stage, chunks)
    print(json.dumps({k: (v.get("chars"), v.get("status"), v.get("error")) for k, v in res["manifest"].items()}, indent=1))
    print("review_events", res["review_events"])
    print("chunks", len(chunks))
    if a.export_manifest:
        reg = {d["document_id"]: d for d in register()}
        keep = ("status", "reason", "error", "url", "fetch_method", "http_status", "content_type", "retrieved_at",
                "raw_sha256", "raw_bytes", "content_hash", "chars", "blocks")
        per_doc = {}
        for did, m in res["manifest"].items():
            row = {k: m[k] for k in keep if k in m}
            row["approval_status"] = reg[did]["approval_status"]
            row["chunks"] = sum(c["document_id"] == did for c in chunks)
            per_doc[did] = row
        Path(a.export_manifest).write_text(json.dumps({"note": "metadata only; texts stay on the droplet", "documents": per_doc}, indent=1) + "\n", encoding="utf-8")
        print("exported", a.export_manifest)


if __name__ == "__main__":
    main()
