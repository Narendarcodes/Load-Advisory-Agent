"""Freeze the Saral golden datasets: mark the 20% held-out split, mark the 30 calibration items, write calibration_30.jsonl
and a SHA-256 manifest.

    python scripts/golden/build_rag_v2.py --chunks <dir>   # 1. Golden A (verifies anchors)
    python scripts/golden/build_agent_v1.py                # 2. Golden B (reuses Golden A policy anchors)
    python scripts/golden/freeze_golden.py                 # 3. split + calibration + MANIFEST.json
    python scripts/golden/validate_golden.py --chunks <dir>   # 4. validators + COVERAGE.md

The held-out split is deterministic: inside each stratum (Golden A: topic; Golden B: recorded decision) items are ordered
by sha256(id) and every 5th is held out. Calibration items are never held out, so humans review dev items only.
"""
import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GOLD = ROOT / "data/evaluation/golden"
RAG, AGENT = GOLD / "rag_v2/golden.jsonl", GOLD / "agent_v1/conversations.jsonl"
CAL_OUT, MANIFEST = GOLD / "calibration_30.jsonl", GOLD / "MANIFEST.json"

CALIBRATION = {
    # Golden A (18): every conflict type, multi-hop traps, each behaviour, each language/script
    "R2-AMT-01": "C1 maximum amount (75 vs 55 lakh)", "R2-ELI-05": "C2 credit score (650 vs 685/750)",
    "R2-PRE-05": "C3 Flexi Dropline 'no fee' vs 4.72%", "R2-FEE-03": "C5 bounce charge vs garbled FAQ",
    "R2-RAT-03": "C6 fixed vs floating (new conflict)", "R2-KFS-08": "C7 T&C cancellation vs RBI cooling-off (new conflict)",
    "R2-GRV-01": "C8 GRO hours (new conflict)", "R2-REC-05": "multi-hop trap: 8-7 vs microfinance 9-6",
    "R2-TEN-03": "multi-hop arithmetic: age at maturity", "R2-REJ-07": "cited public job-switch guidance, not personal coaching (owner decision)",
    "R2-CLA-04": "clarify: prepayment depends on loan and rate type", "R2-ABS-05": "abstain: internal cut-off",
    "R2-REF-05": "refuse: injection via quoted policy text", "R2-REF-12": "refuse: gaming the enquiry check",
    "R2-LHI-06": "Hindi (Devanagari) multi-hop", "R2-LHR-03": "Hindi (Roman) multi-hop",
    "R2-LTE-04": "Telugu (script) multi-hop", "R2-LTR-05": "Telugu (Roman) multi-hop, recovery harassment",
    # Golden B (12): each decision type, the review flags, leak probes, distress, languages, injection
    "AC-005": "counter-offer + what-if wording and per-session cap (owner decision)", "AC-007": "employment-stability leak probe",
    "AC-009": "public figure as cited indicative guidance, never tied to the case (owner decision)", "AC-018": "non-fraud mismatch: names the field, no values (owner decision)",
    "AC-026": "negative-list flag must stay generic", "AC-031": "info requested: missing salary slips",
    "AC-034": "thin file", "AC-036": "stale report + bureau-run request", "AC-040": "distressed borrower + leak probe",
    "AC-042": "Hindi, low literacy, existing EMIs", "AC-044": "Telugu employment leak probe", "AC-053": "stacked prompt injections",
}


def h(s):
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def load(p):
    return [json.loads(line) for line in p.open(encoding="utf-8") if line.strip()]


def write(p, rows):
    p.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows), encoding="utf-8")


def mark(rows, key, stratum):
    groups = defaultdict(list)
    for r in rows:
        r["calibration"] = r[key] in CALIBRATION
        groups[stratum(r)].append(r)
    for g in groups.values():
        k = 0
        for r in sorted(g, key=lambda r: h(r[key])):
            if r["calibration"]:
                r["split"] = "dev"
                continue
            r["split"] = "heldout" if k % 5 == 0 else "dev"
            k += 1


def main():
    rag, conv = load(RAG), load(AGENT)
    ids = {r["qid"] for r in rag} | {c["conv_id"] for c in conv}
    missing = set(CALIBRATION) - ids
    assert not missing, missing
    assert len(CALIBRATION) == 30
    mark(rag, "qid", lambda r: r["topic"])
    mark(conv, "conv_id", lambda c: c["stored_decision"]["decision"])
    write(RAG, rag)
    write(AGENT, conv)
    cal = []
    for r in rag:
        if r["calibration"]:
            cal.append({"cal_id": f"CAL-{len(cal) + 1:02d}", "item_type": "rag", "ref_id": r["qid"], "why_selected": CALIBRATION[r["qid"]],
                        "review": {"reviewer": None, "verdict": None, "fix": None, "notes": None}, "item": r})
    for c in conv:
        if c["calibration"]:
            cal.append({"cal_id": f"CAL-{len(cal) + 1:02d}", "item_type": "agent", "ref_id": c["conv_id"], "why_selected": CALIBRATION[c["conv_id"]],
                        "review": {"reviewer": None, "verdict": None, "fix": None, "notes": None}, "item": c})
    write(CAL_OUT, cal)
    files = [RAG, AGENT, CAL_OUT]
    man = {
        "name": "saral_golden_datasets", "golden_a_version": rag[0]["golden_version"], "golden_b_version": conv[0]["golden_version"],
        "frozen_at": "2026-11-03 IST (release candidate; pending human review)", "base_commit": "3de95b0",
        "status": "frontier-authored, review_status pending_human; Golden B decisions are scenario specs pending ZEN v2",
        "corpus": {f: h((ROOT / "data/corpus_v3" / f).read_text(encoding="utf-8")) for f in ("chunk_index.csv", "manifest.json")},
        "files": [{"path": str(f.relative_to(ROOT)), "sha256": h(f.read_text(encoding="utf-8")), "bytes": f.stat().st_size,
                   "records": sum(1 for _ in f.open(encoding="utf-8"))} for f in files],
        "split": {"rule": "per stratum (A: topic, B: decision) sort by sha256(id), every 5th held out; calibration never held out",
                  "golden_a": dict(Counter(r["split"] for r in rag)), "golden_b": dict(Counter(c["split"] for c in conv))},
        "heldout_ids": sorted([r["qid"] for r in rag if r["split"] == "heldout"] + [c["conv_id"] for c in conv if c["split"] == "heldout"]),
        "calibration_ids": sorted(CALIBRATION),
    }
    MANIFEST.write_text(json.dumps(man, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("split A", man["split"]["golden_a"], "split B", man["split"]["golden_b"], "calibration", len(cal))


if __name__ == "__main__":
    main()
