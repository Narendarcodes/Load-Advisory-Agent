"""Publish the deterministic citation-audit eval (`citation_audit_v1`) as a Langfuse dataset + experiment.

The eval itself is offline and needs no Langfuse account (see scripts/agent/eval_citation_audit.py):
this script re-uses the same cases and the same scoring functions, so published scores are directly comparable
to `runs/audit_*.json`.

    # 1. offline eval, no Langfuse involvement
    PYTHONPATH=".;apps/api/src" python scripts/agent/eval_citation_audit.py \
        --cases data/evaluation/agent/citation_audit_v1/cases.jsonl --label candidate --sha <sha> \
        --out runs/audit_candidate.json

    # 2. dry run: show what would be published (no network)
    python scripts/development/langfuse_publish_eval.py --run-name candidate-<sha> --sha <sha>

    # 3. publish to the local self-hosted stack
    set -a && . infra/langfuse/.env && set +a
    python scripts/development/langfuse_publish_eval.py --stack-env --publish --run-name candidate-<sha> --sha <sha>

Only the benchmark question, gold citation labels and case metadata are uploaded; policy passage text, applicant
records and model prompts never leave the machine. Publishing failure is reported separately from eval failure.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
for _p in (ROOT / "apps" / "bureau" / "src", ROOT / "apps" / "api" / "src", ROOT):
    if str(_p) not in sys.path:
        sys.path.insert(0, str(_p))

DEFAULT_CASES = ROOT / "data" / "evaluation" / "agent" / "citation_audit_v1" / "cases.jsonl"
DEFAULT_DATASET = "loan-advisory-citation-audit-v1"
BENCHMARK = "citation_audit_v1"


def _audit_module():
    path = ROOT / "scripts" / "agent" / "eval_citation_audit.py"
    spec = importlib.util.spec_from_file_location("citation_audit_eval", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _read_env(path: Path, only: tuple[str, ...]) -> None:
    import os
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        if key in only:
            os.environ[key] = value


def _safe_case(case: dict, mode: str) -> dict:
    gold = case.get("gold") or {}
    return {
        "case_id": case["case_id"],
        "question": case["question"],
        "kind": case.get("kind"),
        "mode": mode,
        "expected": {"supporting": list(gold.get("supporting") or []),
                     "required": list(gold.get("required") or []),
                     "forbidden": list(gold.get("forbidden") or [])},
        "metadata": {"benchmark": BENCHMARK, "category": case.get("category"), "kind": case.get("kind"),
                     "mode": mode},
    }


def _case_evaluator(*, output, **kw):
    return [
        {"name": "case_ok", "value": bool((output or {}).get("ok")),
         "comment": f"cited={','.join((output or {}).get('cited') or []) or 'none'}"},
        {"name": "forbidden_citations", "value": int((output or {}).get("forbidden_cited") or 0)},
        {"name": "citation_precision", "value": float((output or {}).get("precision") or 0.0)},
    ]


def _run_evaluator(*, item_results, **kw):
    outputs = [r.output for r in item_results if isinstance(r.output, dict)]
    n = len(outputs) or 1
    ok = sum(bool(o.get("ok")) for o in outputs)
    precisions = [o.get("precision") for o in outputs if o.get("precision") is not None]
    return [
        {"name": "case_ok_rate", "value": ok / n, "comment": f"{ok}/{len(outputs)} cases"},
        {"name": "mean_citation_precision", "value": (sum(precisions) / len(precisions)) if precisions else 0.0},
    ]


def run(args) -> int:
    if args.env_file:
        _read_env(args.env_file, ("LANGFUSE_PUBLIC_KEY", "LANGFUSE_SECRET_KEY", "LANGFUSE_BASE_URL",
                                  "LANGFUSE_ENVIRONMENT", "LANGFUSE_ENABLED", "LANGFUSE_CAPTURE_CONTENT"))
    elif args.stack_env:
        _read_env(ROOT / "infra" / "langfuse" / ".env", ("LANGFUSE_PUBLIC_KEY", "LANGFUSE_SECRET_KEY",
                                                         "LANGFUSE_BASE_URL", "LANGFUSE_ENVIRONMENT",
                                                         "LANGFUSE_ENABLED", "LANGFUSE_CAPTURE_CONTENT"))

    cases_bytes = Path(args.cases).read_bytes()
    cases_sha = hashlib.sha256(cases_bytes).hexdigest()
    try:
        audit = _audit_module()
        cases = audit.load_cases(args.cases)
        citation = audit.eval_citation(cases, args.mode)
    except Exception as e:
        print(f"eval: FAILED ({type(e).__name__}: {e})", file=sys.stderr)
        return 1
    rows = {r["case_id"]: r for r in citation["rows"]}
    metrics = {k: v for k, v in citation.items() if k != "rows"}
    print(json.dumps({"eval": {**metrics, "cases_sha256": cases_sha, "benchmark": BENCHMARK, "mode": args.mode}},
                     indent=1))
    if not any(c["kind"] == "citation" for c in cases):
        print("eval: no citation cases found", file=sys.stderr)
        return 1
    if args.dry_run or not args.publish:
        print(f"publish: dry run; {len(rows)} items would be written to dataset {args.dataset!r} "
              f"(pass --publish to write)", file=sys.stderr)
        return 0

    from loan_advisory.agent import langfuse_config
    cfg = langfuse_config.load()
    print(json.dumps({"langfuse": cfg.summary()}, indent=1), file=sys.stderr)
    if not cfg.active:
        print("publish: SKIPPED (Langfuse is not active; the offline eval above is unaffected)", file=sys.stderr)
        return 2
    if not args.run_name:
        print("publish: FAILED (--run-name is required when publishing)", file=sys.stderr)
        return 1

    try:
        from langfuse import Langfuse
        client = Langfuse(public_key=cfg.public_key, secret_key=cfg.secret_key, base_url=cfg.base_url,
                          environment=cfg.environment, release=args.sha, timeout=cfg.timeout_s)
        client.create_dataset(name=args.dataset, description="Synthetic deterministic citation-audit benchmark",
                              metadata={"benchmark": BENCHMARK, "version": BENCHMARK, "cases_sha256": cases_sha,
                                        "mode": args.mode, "deterministic": True, "llm_used": False})
        for case in cases:
            if case["kind"] != "citation":
                continue
            item = _safe_case(case, args.mode)
            client.create_dataset_item(dataset_name=args.dataset, id=f"{BENCHMARK}-{case['case_id']}",
                                       input={k: item[k] for k in ("case_id", "question", "mode")},
                                       expected_output=item["expected"], metadata=item["metadata"])

        dataset = client.get_dataset(args.dataset)

        def task(*, item, **kw):
            meta = item.metadata or {}
            case_id = (item.input or {}).get("case_id") or meta.get("case_id")
            row = rows[case_id]
            sup, req = set((item.expected_output or {}).get("supporting") or []), \
                set((item.expected_output or {}).get("required") or [])
            tp = len([x for x in row["cited"] if x in sup])
            fp = len([x for x in row["cited"] if x not in sup])
            return {"case_id": row["case_id"], "cited": row["cited"], "ok": bool(row["ok"]),
                    "forbidden_cited": int(row["forbidden_cited"]),
                    "precision": (tp / (tp + fp)) if (tp + fp) else None,
                    "required_ok": req <= set(row["cited"])}

        result = dataset.run_experiment(
            name="citation-audit", run_name=args.run_name,
            description=f"Deterministic citation-audit ({BENCHMARK}); case_ok is computed offline, no LLM judge",
            task=task, evaluators=[_case_evaluator], run_evaluators=[_run_evaluator],
            metadata={"benchmark": BENCHMARK, "mode": args.mode, "sha": args.sha or "", "cases_sha256": cases_sha,
                      "deterministic": "true", "llm_used": "false"}, max_concurrency=4)
        client.flush()
        expected = len([c for c in cases if c["kind"] == "citation"])
        failed = [r for r in result.item_results if not (r.output or {}).get("ok")]
        print(f"publish: run={args.run_name!r} experiment_id={result.experiment_id} "
              f"items={len(result.item_results)}/{expected} failed_cases={len(failed)}", file=sys.stderr)
        if len(result.item_results) < expected:
            print("publish: FAILED — not every dataset item produced a result (see stderr above)", file=sys.stderr)
            client.shutdown()
            return 1
        if failed:
            print("publish: failed case ids (open their traces in the Langfuse UI): "
                  + ", ".join(str((r.output or {}).get('case_id')) for r in failed), file=sys.stderr)
        client.shutdown()
        return 0
    except Exception as e:
        print(f"publish: FAILED ({type(e).__name__}: {str(e)[:200]}) — the offline eval results above are still valid",
              file=sys.stderr)
        return 1


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--cases", default=str(DEFAULT_CASES))
    ap.add_argument("--mode", default="labels", choices=("labels", "verify", "primary_source", "one_source"))
    ap.add_argument("--dataset", default=DEFAULT_DATASET)
    ap.add_argument("--run-name", help="experiment run name (e.g. baseline-<sha> / candidate-<sha>)")
    ap.add_argument("--sha", default="", help="code revision recorded in dataset/experiment metadata")
    ap.add_argument("--publish", action="store_true", help="write the dataset + experiment to Langfuse")
    ap.add_argument("--dry-run", action="store_true", help="only print the offline metrics (default when no --publish)")
    ap.add_argument("--env-file", type=Path)
    ap.add_argument("--stack-env", action="store_true", help="read LANGFUSE_* from infra/langfuse/.env")
    return run(ap.parse_args(argv))


if __name__ == "__main__":
    raise SystemExit(main())
