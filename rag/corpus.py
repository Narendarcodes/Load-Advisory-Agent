"""Policy corpus: fetch registered sources, extract text, hash, chunk by section.

Rules (handoff §Phase 3/4):
- Only documents in data/sources/policy_register.yaml are fetched.
- A changed content hash is reported as a REVIEW EVENT; it never changes approval_status.
- Chunks keep source/section references and the document's governance metadata so that
  retrieval can filter on approval_status / effective dates.
"""
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path

import requests
import yaml
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
REGISTER = ROOT / "data" / "sources" / "policy_register.yaml"
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64)"}  # rbi.org.in returns an empty shell to non-browser UAs
INGESTIBLE = {"approved", "approved_historical", "pending_review"}
META_KEYS = ("document_id", "title", "publisher", "authority", "reference", "source_url", "document_type",
             "jurisdiction", "product", "publication_date", "effective_from", "effective_to",
             "approval_status", "supersedes", "superseded_by")
NUM = re.compile(r"^(\(?[0-9]{1,2}(\.[0-9]{1,2})*[\.\)]|\([a-z]{1,4}\)|\([ivx]+\)|[ivx]+\.|[a-z]\))\s")
TOP = re.compile(r"^([0-9]{1,2})\.\s+\S")


def register():
    return yaml.safe_load(REGISTER.read_text())["documents"]


def _blocks_from_text(text: str) -> list[str]:
    lines = [re.sub(r"\s+", " ", l).strip() for l in text.split("\n")]
    blocks, cur = [], ""
    for l in lines:
        if not l:
            if cur:
                blocks.append(cur); cur = ""
            continue
        if l.startswith("#"):  # markdown heading = its own block
            if cur:
                blocks.append(cur)
            blocks.append(l); cur = ""
            continue
        if NUM.match(l) or (cur and cur.endswith((".", ":", ";")) and l[:1].isupper()):
            if cur:
                blocks.append(cur)
            cur = l.lstrip("# ")
        else:
            cur = f"{cur} {l}".strip()
    if cur:
        blocks.append(cur)
    return [b for b in blocks if len(b) > 2]


def extract(html: bytes, url: str) -> str:
    s = BeautifulSoup(html, "html.parser")
    # NB: never drop <form>: ASP.NET pages (rbi.org.in) wrap all content in one.
    for t in s(["script", "style", "noscript", "nav", "header", "footer", "svg"]):
        t.decompose()
    if "rbi.org.in" in url:
        node = s.select_one("table.tablebg") or s.select_one("#doublescroll") or s.body
    else:
        node = s.find("main") or s.body
    for br in node.find_all("br"):
        br.replace_with("\n")
    for p in node.find_all(["p", "li", "tr", "h1", "h2", "h3", "h4", "div"]):
        p.insert_after("\n")
    return node.get_text("\n")


def fetch_all(out_dir: Path) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest_p = out_dir / "manifest.json"
    prev = json.loads(manifest_p.read_text()) if manifest_p.exists() else {}
    manifest, events = {}, []
    for d in register():
        did, url = d["document_id"], d.get("source_url", "")
        if d.get("approval_status") not in INGESTIBLE:
            manifest[did] = {"status": "skipped", "reason": d.get("approval_status")}
            continue
        if url.startswith("repo://"):
            raw = (ROOT / url[len("repo://"):]).read_bytes()
            text = raw.decode()
        else:
            r = requests.get(url, headers=UA, timeout=60)
            r.raise_for_status()
            raw = r.content
            text = extract(raw, url)
            if d.get("start_marker") and d["start_marker"] in text:
                text = text[text.index(d["start_marker"]):]
            if d.get("end_marker") and d["end_marker"] in text:
                text = text[: text.rindex(d["end_marker"])]
        blocks = _blocks_from_text(text)
        body = "\n".join(blocks)
        h = hashlib.sha256(body.encode()).hexdigest()
        (out_dir / f"{did}.raw").write_bytes(raw)
        (out_dir / f"{did}.txt").write_text(body)
        old = prev.get(did, {}).get("content_hash")
        if old and old != h:
            events.append({"document_id": did, "event": "CONTENT_CHANGED_REVIEW_REQUIRED", "old": old, "new": h})
        manifest[did] = {"status": "fetched", "content_hash": h, "chars": len(body), "blocks": len(blocks),
                         "retrieved_at": datetime.now(timezone.utc).isoformat(), "url": url}
    manifest_p.write_text(json.dumps(manifest, indent=1))
    (out_dir / "review_events.json").write_text(json.dumps(events, indent=1))
    return {"manifest": manifest, "review_events": events}


def chunk_document(doc_meta: dict, body: str, max_words: int = 180) -> list[dict]:
    """Section-aware chunks: a new chunk starts at each top-level numbered paragraph ("7. ...")
    or markdown heading; long sections are split at block boundaries (~max_words)."""
    blocks = body.split("\n")
    chunks, cur, section = [], [], "preamble"

    def flush():
        if cur:
            text = " ".join(cur)
            chunks.append({"section": section, "text": text})

    for b in blocks:
        m = TOP.match(b)
        new_section = None
        if m:
            new_section = f"para {m.group(1)}"
        elif b.startswith("#"):
            new_section = b.lstrip("# ")[:80]
        if new_section:
            flush(); cur = []; section = new_section
        if cur and sum(len(x.split()) for x in cur) + len(b.split()) > max_words:
            flush(); cur = []
        cur.append(b.lstrip("# ") if b.startswith("#") else b)
    flush()
    meta = {k: doc_meta.get(k) for k in META_KEYS}
    for d in ("publication_date", "effective_from", "effective_to"):
        meta[d] = str(meta[d]) if meta[d] else None
    out = []
    for i, c in enumerate(chunks):
        cid = f"{doc_meta['document_id']}#{i:03d}"
        out.append({"chunk_id": cid, "section": c["section"], "text": c["text"], **meta,
                    "chunk_sha256": hashlib.sha256(c["text"].encode()).hexdigest()})
    return out


def build_chunks(src_dir: Path) -> list[dict]:
    reg = {d["document_id"]: d for d in register()}
    man = json.loads((src_dir / "manifest.json").read_text())
    chunks = []
    for did, m in man.items():
        if m.get("status") == "fetched":
            chunks += chunk_document(reg[did], (src_dir / f"{did}.txt").read_text())
    return chunks
