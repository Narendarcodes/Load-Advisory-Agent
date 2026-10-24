"""Fetch registered policy sources and build section chunks.

    LOAN_POLICY_DIR=/root/hx/loan/policy python scripts/policy/fetch_sources.py [--only ID,ID] [--export-manifest PATH]
Writes $LOAN_POLICY_DIR/src/{<doc>.raw,<doc>.txt,manifest.json,review_events.json} and
$LOAN_POLICY_DIR/chunks.jsonl. (Falls back to $LOAN_DATA_DIR/policy for the phase-4 layout.)
Browser-downloaded PDFs (rbidocs bot challenge) must be in $LOAN_POLICY_DIR/manual/<local_file>.
Content changes are review events only; approval_status is never changed by this script.
--export-manifest writes the metadata-only manifest (URL, fetch date, sha256, size, method; no text)
for committing to git.
"""
import argparse
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from rag.corpus import build_chunks, fetch_all, register  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("--only", default="")
ap.add_argument("--export-manifest", default="")
a = ap.parse_args()
base = Path(os.environ.get("LOAN_POLICY_DIR") or Path(os.environ.get("LOAN_DATA_DIR", "/root/hx/loan/data")) / "policy")
res = fetch_all(base / "src", only=set(filter(None, a.only.split(","))) or None)
chunks = build_chunks(base / "src")
with (base / "chunks.jsonl").open("w", encoding="utf-8") as f:
    for c in chunks:
        f.write(json.dumps(c, ensure_ascii=False) + "\n")
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
