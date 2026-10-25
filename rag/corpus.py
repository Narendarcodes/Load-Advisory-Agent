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
             "approval_status", "supersedes", "superseded_by",
             # register v2 (lender-profile aware): see docs/policy/bajaj_reference_lender.md
             "source_type", "lender_id", "lender_relationship", "applies_to_entity")
PAGE = re.compile(r"^\[\[page (\d+)\]\]$")
NUM = re.compile(r"^(\(?[0-9]{1,2}(\.[0-9]{1,2})*[\.\)]|\([a-z]{1,4}\)|\([ivx]+\)|[ivx]+\.|[a-z]\))\s")
TOP = re.compile(r"^([0-9]{1,2})\.\s+\S")
TOP3 = re.compile(r"^([0-9]{1,3})\.\s*[A-Z(]")  # PDF directions: "106.With the issue ..." (opt-in per doc)
CHAPTER = re.compile(r"^(Chapter [IVXL]+)\b")


def register():
    return yaml.safe_load(REGISTER.read_text(encoding="utf-8"))["documents"]


def _blocks_from_text(text: str) -> list[str]:
    lines = [re.sub(r"\s+", " ", l).strip() for l in text.split("\n")]
    blocks, cur = [], ""
    for l in lines:
        if PAGE.match(l):  # page marker from PDF extraction: always its own block
            if cur:
                blocks.append(cur); cur = ""
            blocks.append(l)
            continue
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


def extract_pdf(raw: bytes) -> str:
    """PDF -> text with [[page N]] markers. Lines repeated on >=60% of pages (running headers /
    footers such as "BFL - Fair Practice Code / Ver 7.1" or bare page numbers) are dropped."""
    import pymupdf
    doc = pymupdf.open(stream=raw, filetype="pdf")
    pages = [p.get_text() for p in doc]
    from collections import Counter
    cnt = Counter()
    for t in pages:
        cnt.update({re.sub(r"\s+", " ", l).strip() for l in t.split("\n") if l.strip()})
    n = len(pages)
    boiler = {l for l, c in cnt.items() if n >= 3 and c >= 0.6 * n and len(l) < 120}
    out = []
    for i, t in enumerate(pages, 1):
        out.append(f"[[page {i}]]")
        for l in t.split("\n"):
            ls = re.sub(r"\s+", " ", l).strip()
            if ls in boiler or re.fullmatch(r"\d{1,3}", ls or "x"):
                continue
            out.append(l)
    return "\n".join(out)


def extract(html: bytes, url: str, root: str | None = None) -> str:
    if html[:5] == b"%PDF-":
        return extract_pdf(html)
    s = BeautifulSoup(html, "html.parser")
    # NB: never drop <form>: ASP.NET pages (rbi.org.in) wrap all content in one.
    for t in s(["script", "style", "noscript", "nav", "header", "footer", "svg"]):
        t.decompose()
    if root == "body":
        node = s.body
    elif "rbi.org.in" in url:
        node = s.select_one("table.tablebg") or s.select_one("#doublescroll") or s.body
    else:
        node = s.find("main") or s.body
    for br in node.find_all("br"):
        br.replace_with("\n")
    for p in node.find_all(["p", "li", "tr", "h1", "h2", "h3", "h4", "div"]):
        p.insert_after("\n")
    return node.get_text("\n")


def _local_raw(d: dict, out_dir: Path) -> bytes:
    """Documents downloaded by hand / browser (rbidocs serves a bot challenge to scripts) are
    placed under <policy dir>/manual/<local_file>; source_url still records the official URL."""
    p = out_dir.parent / "manual" / d["local_file"]
    if not p.exists():
        raise FileNotFoundError(f"{d['document_id']}: manual download missing at {p}")
    return p.read_bytes()


def _get(d, did, url, out_dir):
    """Return (raw bytes, extracted text, fetch metadata) for one registered document."""
    if url.startswith("repo://"):
        raw = (ROOT / url[len("repo://"):]).read_bytes()
        return raw, raw.decode(), {"fetch_method": "repo"}
    if d.get("local_file"):
        raw = _local_raw(d, out_dir)
        http = {"fetch_method": d.get("fetch_method", "browser_manual")}
    else:
        r = requests.get(url, headers=UA, timeout=60)
        r.raise_for_status()
        raw = r.content
        http = {"fetch_method": "http", "http_status": r.status_code, "content_type": r.headers.get("content-type")}
        if raw[:5] != b"%PDF-" and b"What code is in the image" in raw:
            raise RuntimeError(f"{did}: bot challenge page instead of content; download manually")
    text = extract(raw, url, d.get("html_root"))
    if d.get("start_marker") and d["start_marker"] in text:
        text = text[text.index(d["start_marker"]):]
    if d.get("end_marker") and d["end_marker"] in text:
        text = text[: text.rindex(d["end_marker"])]
    return raw, text, http


def fetch_all(out_dir: Path, only: set | None = None) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest_p = out_dir / "manifest.json"
    prev = json.loads(manifest_p.read_text(encoding="utf-8")) if manifest_p.exists() else {}
    manifest, events = {}, []
    for d in register():
        did, url = d["document_id"], d.get("source_url", "")
        if only and did not in only:
            if did in prev:
                manifest[did] = prev[did]
            continue
        if d.get("approval_status") not in INGESTIBLE:
            manifest[did] = {"status": "skipped", "reason": d.get("approval_status")}
            continue
        http = {}
        try:
            raw, text, http = _get(d, did, url, out_dir)
        except Exception as e:  # one broken source must not stop the run; it is reported, never ingested
            manifest[did] = {"status": "error", "error": f"{type(e).__name__}: {e}"[:300], "url": url,
                             "retrieved_at": datetime.now(timezone.utc).isoformat()}
            continue
        blocks = _blocks_from_text(text)
        body = "\n".join(blocks)
        h = hashlib.sha256(body.encode()).hexdigest()
        (out_dir / f"{did}.raw").write_bytes(raw)
        (out_dir / f"{did}.txt").write_text(body, encoding="utf-8")
        old = prev.get(did, {}).get("content_hash")
        if old and old != h:
            events.append({"document_id": did, "event": "CONTENT_CHANGED_REVIEW_REQUIRED", "old": old, "new": h})
        manifest[did] = {"status": "fetched", "content_hash": h, "raw_sha256": hashlib.sha256(raw).hexdigest(),
                         "raw_bytes": len(raw), "chars": len(body), "blocks": len(blocks),
                         "retrieved_at": datetime.now(timezone.utc).isoformat(), "url": url, **http}
    manifest_p.write_text(json.dumps(manifest, indent=1), encoding="utf-8")
    (out_dir / "review_events.json").write_text(json.dumps(events, indent=1), encoding="utf-8")
    return {"manifest": manifest, "review_events": events}


def chunk_document(doc_meta: dict, body: str, max_words: int = 180) -> list[dict]:
    """Section-aware chunks: a new chunk starts at each top-level numbered paragraph ("7. ...")
    or markdown heading; long sections are split at block boundaries (~max_words).
    PDF bodies carry [[page N]] markers: they never enter chunk text, but each chunk records
    page_start/page_end so citations can name the page. Docs with `para_digits: 3` in the
    register also split at 3-digit paragraphs ("106.With ...") and at "Chapter IV" headings."""
    blocks = body.split("\n")
    chunks, cur, section = [], [], "preamble"
    top = TOP3 if doc_meta.get("para_digits") == 3 else TOP
    page = {"now": None, "start": None}

    def flush():
        if cur:
            text = " ".join(cur)
            chunks.append({"section": section, "text": text, "page_start": page["start"], "page_end": page["now"]})

    for b in blocks:
        pm = PAGE.match(b)
        if pm:
            page["now"] = int(pm.group(1))
            if not cur:
                page["start"] = page["now"]
            continue
        m = top.match(b)
        new_section = None
        if m:
            new_section = f"para {m.group(1)}"
        elif b.startswith("#"):
            new_section = b.lstrip("# ")[:80]
        elif doc_meta.get("para_digits") == 3 and CHAPTER.match(b):
            new_section = b[:80]
        if new_section:
            flush(); cur = []; section = new_section
        if cur and sum(len(x.split()) for x in cur) + len(b.split()) > max_words:
            flush(); cur = []
        if not cur:
            page["start"] = page["now"]
        cur.append(b.lstrip("# ") if b.startswith("#") else b)
    flush()
    meta = {k: doc_meta.get(k) for k in META_KEYS}
    for d in ("publication_date", "effective_from", "effective_to"):
        meta[d] = str(meta[d]) if meta[d] else None
    meta["applies_to_entity"] = list(meta.get("applies_to_entity") or ["all"])
    meta["source_type"] = meta.get("source_type") or meta.get("authority")
    out = []
    for i, c in enumerate(chunks):
        cid = f"{doc_meta['document_id']}#{i:03d}"
        out.append({"chunk_id": cid, "section": c["section"], "text": c["text"],
                    "page_start": c["page_start"], "page_end": c["page_end"], **meta,
                    "chunk_sha256": hashlib.sha256(c["text"].encode()).hexdigest()})
    return out


def build_chunks(src_dir: Path) -> list[dict]:
    reg = {d["document_id"]: d for d in register()}
    man = json.loads((src_dir / "manifest.json").read_text(encoding="utf-8"))
    chunks = []
    for did, m in man.items():
        if m.get("status") == "fetched":
            chunks += chunk_document(reg[did], (src_dir / f"{did}.txt").read_text(encoding="utf-8"))
    return chunks
