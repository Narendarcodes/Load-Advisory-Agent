"""Fetch registered policy sources and build section chunks.

    LOAN_DATA_DIR=/root/hx/loan/data python scripts/policy/fetch_sources.py
Writes $LOAN_DATA_DIR/policy/src/{<doc>.raw,<doc>.txt,manifest.json,review_events.json}
and $LOAN_DATA_DIR/policy/chunks.jsonl. Content changes are review events only.
"""
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from rag.corpus import build_chunks, fetch_all  # noqa: E402

base = Path(os.environ.get("LOAN_DATA_DIR", "/root/hx/loan/data")) / "policy"
res = fetch_all(base / "src")
chunks = build_chunks(base / "src")
with (base / "chunks.jsonl").open("w") as f:
    for c in chunks:
        f.write(json.dumps(c, ensure_ascii=False) + "\n")
print(json.dumps({k: (v.get("chars"), v.get("status")) for k, v in res["manifest"].items()}, indent=1))
print("review_events", res["review_events"])
print("chunks", len(chunks))
