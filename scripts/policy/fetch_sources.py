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
import contextlib
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
    try:
        src = base / "src"
        if src.exists():
            shutil.copytree(src, stage, dirs_exist_ok=True)
        res = fetch_all(stage, only=only)
        failed = sorted(did for did, m in res["manifest"].items() if m.get("status") == "error")
        if failed:
            raise SystemExit(f"fetch failed for {failed}; existing corpus left untouched")
        chunks = build_chunks(stage)
        fetched = {did for did, m in res["manifest"].items() if m.get("status") == "fetched"}
        empty = sorted(did for did in fetched if not any(c["document_id"] == did for c in chunks))
        if not chunks or empty:
            raise SystemExit(f"no chunks produced for {empty or 'the corpus'}; existing corpus left untouched")
        return stage, chunks, res
    except BaseException:
        shutil.rmtree(stage, ignore_errors=True)
        raise


@contextlib.contextmanager
def fetch_lock(base: Path):
    """Exclusive per-corpus lock so two fetches cannot stage/publish over each other.

    A crashed run leaves the lock directory behind; remove it by hand only when no fetch is running.
    """
    lock = base / ".fetch.lock"
    base.mkdir(parents=True, exist_ok=True)
    try:
        os.mkdir(lock)
    except FileExistsError:
        raise SystemExit(f"another fetch appears to be running (lock: {lock}); remove it only if no fetch is active")
    try:
        (lock / "pid").write_text(str(os.getpid()), encoding="utf-8")
        yield
    finally:
        shutil.rmtree(lock, ignore_errors=True)


def publish(base: Path, stage: Path, chunks: list) -> None:
    """Swap the staged tree and chunk file in. Two renames, not one transaction: a crash between
    them leaves the previous tree at .src.old-* and the old chunks.jsonl in place."""
    fd, name = tempfile.mkstemp(prefix=".chunks.jsonl.new-", dir=base)
    new_chunks = Path(name)
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        f.write("".join(json.dumps(c, ensure_ascii=False) + "\n" for c in chunks))
    src = base / "src"
    backup = base / f".src.old-{time.time_ns()}"
    if src.exists():
        os.replace(src, backup)
    try:
        os.replace(stage, src)
        os.replace(new_chunks, base / "chunks.jsonl")
    except BaseException as e:
        failed = base / f".src.failed-{time.time_ns()}"
        try:
            if src.exists():
                os.replace(src, failed)
            if backup.exists():
                os.replace(backup, src)
        except BaseException as restore_error:
            raise RuntimeError(
                f"corpus publication failed ({type(e).__name__}) and the previous tree could not be restored; "
                f"previous tree: {backup}; uninstalled tree: {failed if failed.exists() else src}; "
                f"new chunk file: {new_chunks}") from restore_error
        shutil.rmtree(failed, ignore_errors=True)
        new_chunks.unlink(missing_ok=True)
        raise
    shutil.rmtree(backup, ignore_errors=True)


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="")
    ap.add_argument("--export-manifest", default="")
    a = ap.parse_args(argv)
    base = Path(os.environ.get("LOAN_POLICY_DIR") or Path(os.environ.get("LOAN_DATA_DIR", "/root/hx/loan/data")) / "policy")
    with fetch_lock(base):
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
