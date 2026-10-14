"""Draft benchmark questions from sampled chunks with gpt-oss-120b (droplet), then verify.

The LLM proposes (question, short answer, verbatim anchor). A draft is kept only if the anchor
occurs verbatim in the source chunk. Kept drafts are then reviewed by hand and merged into
data/evaluation/rag/benchmark_v1.jsonl (field `origin: llm_draft_reviewed`). Drafts are not gold
until reviewed.
"""
import json
import os
import random
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import requests

BASE = os.environ.get("LLM_BASE", "http://127.0.0.1:8001/v1")
DATA = Path(os.environ.get("LOAN_DATA_DIR", "/root/hx/loan/data")) / "policy"
QUOTA = {"RBI-DLD-2025": 22, "RBI-PENAL-2023": 9, "RBI-KFS-2024": 7, "RBI-IOS-2021": 12, "RBI-CIC-CS-2023": 5,
         "RBI-CIC-COMP-2023": 5, "HDFC-PL-ELIG": 3, "ICICI-PL-ELIG": 4, "RBI-FPC-2007": 2, "RBI-MC-CS-2015": 4}
PROMPT = (
    "You write evaluation questions for a retrieval system over Indian lending regulations. "
    "Given ONE passage, write a question a loan applicant or advisor might ask whose answer is in this passage. "
    "Paraphrase: do not copy distinctive phrases from the passage into the question. "
    "Return JSON {\"question\":..., \"answer\": short factual answer, \"anchor\": an EXACT verbatim substring "
    "of the passage (8-25 words) that supports the answer}. If the passage is boilerplate with no answerable fact, "
    "return {\"skip\": true}.\n\nDocument: {title}\nSection: {section}\nPassage:\n{text}"
)


def post(body):
    delay = 2
    while True:
        try:
            r = requests.post(f"{BASE}/chat/completions", json=body, timeout=180)
            if r.status_code < 500:
                return r
        except requests.ConnectionError:
            pass
        time.sleep(delay); delay = min(delay * 2, 60)


def draft(c):
    p = PROMPT.replace("{title}", c["title"]).replace("{section}", c["section"]).replace("{text}", c["text"])
    r = post({"model": "llm", "reasoning_effort": "low", "max_tokens": 900, "temperature": 0.4,
              "response_format": {"type": "json_object"}, "messages": [{"role": "user", "content": p}]})
    try:
        d = json.loads(r.json()["choices"][0]["message"]["content"])
    except Exception:
        return None
    if d.get("skip") or not d.get("anchor"):
        return None
    norm = lambda s: re.sub(r"\s+", " ", s).strip().lower()
    if norm(d["anchor"]) not in norm(c["text"]):
        return None
    return {"question": d["question"], "answer": d["answer"], "anchor": d["anchor"], "gold_chunks": [c["chunk_id"]],
            "gold_docs": [c["document_id"]], "source_status": c["approval_status"]}


def main():
    quota = QUOTA
    if len(sys.argv) > 1:  # e.g. RBI-IOS-2026-FAQ:12
        quota = {a.split(":")[0]: int(a.split(":")[1]) for a in sys.argv[1:]}
    rng = random.Random(7)
    chunks = [json.loads(l) for l in (DATA / "chunks.jsonl").open()]
    pick = []
    for did, n in quota.items():
        pool = [c for c in chunks if c["document_id"] == did and len(c["text"].split()) >= 35]
        pick += rng.sample(pool, min(len(pool), n + 3))  # oversample; some are dropped
    with ThreadPoolExecutor(128) as ex:
        out = [d for d in ex.map(draft, pick) if d]
    name = "question_drafts.jsonl" if quota is QUOTA else f"question_drafts_{'_'.join(quota)}.jsonl"
    (DATA / name).write_text("".join(json.dumps(d, ensure_ascii=False) + "\n" for d in out))
    print(len(pick), "sampled ->", len(out), "verified drafts")


if __name__ == "__main__":
    sys.exit(main())
