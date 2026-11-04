"""CLI: python -m synthetic_data.saral_kyc_bank --count 200 --seed 20261103 --out DIR"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from .generator import DEFAULT_SEED, build_universe
from .writer import write_universe

DOC = Path(__file__).resolve().parents[2] / "docs" / "saral" / "SYNTHETIC_DATASETS.md"


def scenario_table(universe: dict) -> str:
    from .scenarios import ALL_SCENARIOS  # noqa: PLC0415

    paths: dict[str, set] = {}
    for a in universe["applicants"]:
        paths.setdefault(a["scenario"]["id"], set()).add(a["label"]["expected_path"])
    rows = ["| Scenario | Groups | Expected path(s) | Primary PL rules | v2 refs | Count (200) |", "|---|---|---|---|---|---|"]
    for s in ALL_SCENARIOS:
        rows.append(f"| {s.id} | {''.join(s.groups)} | {', '.join(sorted(paths.get(s.id, [])))} | "
                    f"{', '.join(s.pl_rules) or '-'} | {', '.join(s.zen_refs) or '-'} | {universe['scenario_counts'][s.id]} |")
    from collections import Counter  # noqa: PLC0415

    cells = Counter((a["label"]["amount_band"], a["label"]["expected_path"].split(":")[0]) for a in universe["applicants"])
    outcomes = sorted({o for _, o in cells})
    rows += ["", "Applicants per amount band and outcome (200-applicant run):", "",
             "| Band | " + " | ".join(outcomes) + " |", "|---|" + "---|" * len(outcomes)]
    for b in ("B1", "B2", "B3", "B4"):
        rows.append(f"| {b} | " + " | ".join(str(cells.get((b, o), 0)) for o in outcomes) + " |")
    purposes = Counter(a["label"]["purpose"] for a in universe["applicants"])
    rows += ["", "Applicants per purpose: " + ", ".join(f"{k} {v}" for k, v in sorted(purposes.items())) + "."]
    return "\n".join(rows) + "\n"


def refresh_doc(universe: dict) -> None:
    from .zen_inputs import coverage_table  # noqa: PLC0415

    text = DOC.read_text(encoding="utf-8")
    for name, body in (("scenario-table", scenario_table(universe)), ("coverage-table", coverage_table(universe))):
        text = re.sub(rf"(<!-- BEGIN:{name} \(generated\) -->\n).*?(<!-- END:{name} -->)",
                      lambda m, b=body: m.group(1) + b + m.group(2), text, flags=re.S)
    DOC.write_text(text, encoding="utf-8")


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Saral synthetic KYC/bank/bureau-linked universe (SYNTHETIC ONLY)")
    ap.add_argument("--count", type=int, default=200)
    ap.add_argument("--seed", type=int, default=DEFAULT_SEED)
    ap.add_argument("--out", type=Path)
    ap.add_argument("--render-docs", type=Path, default=None,
                    help="also render SPECIMEN PNGs (PAN, Aadhaar, statement p1, NACH mandate); needs Pillow")
    ap.add_argument("--coverage-table", action="store_true",
                    help="regenerate the generated tables in docs/saral/SYNTHETIC_DATASETS.md (200 applicants)")
    args = ap.parse_args(argv)
    if args.coverage_table:
        refresh_doc(build_universe(200, seed=args.seed))
        print(f"updated {DOC}")
        return 0
    if args.out is None:
        ap.error("--out is required")
    m = write_universe(args.out, count=args.count, seed=args.seed, render_dir=args.render_docs)
    print(json.dumps({"out": str(args.out), "count": m["count"], "seed": m["seed"],
                      "scenarios_present": sum(1 for v in m["scenario_counts"].values() if v)}, indent=1))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
