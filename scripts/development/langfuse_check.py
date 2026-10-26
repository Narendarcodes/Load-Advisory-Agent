"""Connectivity diagnostic for the optional self-hosted Langfuse exporter (no secrets printed).

    python scripts/development/langfuse_check.py                     # use the current environment
    python scripts/development/langfuse_check.py --stack-env         # read keys from infra/langfuse/.env
    python scripts/development/langfuse_check.py --stack-env --send-trace

Checks: configuration validity, /api/public/health, API-key auth (/api/public/projects) and, with --send-trace,
one synthetic span through the same observability facade the agent uses, then confirms it arrived.
Exit code 0 only when every requested check passes.
"""
from __future__ import annotations

import argparse
import base64
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "apps" / "api" / "src"))

from loan_advisory.agent import langfuse_config  # noqa: E402


def _read_env(path: Path, only: tuple[str, ...] = ()) -> None:
    import os
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        if only and key not in only:
            continue
        os.environ[key] = value


def _get(url: str, key: str, secret: str, timeout: float = 5.0):
    headers = {"Authorization": "Basic " + base64.b64encode(f"{key}:{secret}".encode()).decode()} if key else {}
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.status, json.load(r)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--env-file", type=Path, help="load LANGFUSE_* variables from this file")
    ap.add_argument("--stack-env", action="store_true", help="shortcut for --env-file infra/langfuse/.env")
    ap.add_argument("--send-trace", action="store_true", help="send and verify one synthetic trace")
    args = ap.parse_args(argv)
    if args.env_file:
        _read_env(args.env_file, only=("LANGFUSE_PUBLIC_KEY", "LANGFUSE_SECRET_KEY", "LANGFUSE_BASE_URL",
                                      "LANGFUSE_ENVIRONMENT", "LANGFUSE_ENABLED", "LANGFUSE_CAPTURE_CONTENT"))
    elif args.stack_env:
        _read_env(ROOT / "infra" / "langfuse" / ".env", only=("LANGFUSE_PUBLIC_KEY", "LANGFUSE_SECRET_KEY",
                                                             "LANGFUSE_BASE_URL", "LANGFUSE_ENVIRONMENT",
                                                             "LANGFUSE_ENABLED", "LANGFUSE_CAPTURE_CONTENT"))

    cfg = langfuse_config.load()
    print(json.dumps(cfg.summary(), indent=1))
    if not cfg.active:
        print("\nLangfuse is not active; the agent runs normally without tracing.", file=sys.stderr)
        return 2

    try:
        status, health = _get(f"{cfg.base_url}/api/public/health", "", "")
        print(f"health: HTTP {status} {health}")
    except (urllib.error.URLError, OSError, ValueError) as e:
        print(f"health: FAILED ({type(e).__name__})", file=sys.stderr)
        return 1
    try:
        status, projects = _get(f"{cfg.base_url}/api/public/projects", cfg.public_key, cfg.secret_key)
        print(f"auth: HTTP {status}; projects={[p.get('name') for p in projects.get('data', [])]}")
    except (urllib.error.URLError, OSError, ValueError) as e:
        print(f"auth: FAILED ({type(e).__name__}); check the keys in infra/langfuse/.env", file=sys.stderr)
        return 1

    if not args.send_trace:
        return 0

    from loan_advisory.agent import observability as obs
    obs.reset()
    with obs.span("langfuse.check", kind="CHAIN",
                  **{"langfuse.trace.name": "langfuse.check",
                     "langfuse.trace.tags": ["loan-advisory", "synthetic", "diagnostic"],
                     "langfuse.trace.metadata.case_id": '"synthetic-diagnostic"'}) as root:
        trace_id = format(root.get_span_context().trace_id, "032x") if root is not None else None
        with obs.span("langfuse.check.child", kind="TOOL", **{"langfuse.observation.metadata.case_id": '"synthetic-diagnostic"'}):
            pass
    obs.flush(5000)
    if trace_id is None:
        print("trace: FAILED (the exporter did not start)", file=sys.stderr)
        return 1
    for _ in range(10):
        time.sleep(1)
        try:
            _, rows = _get(f"{cfg.base_url}/api/public/v2/observations?limit=50", cfg.public_key, cfg.secret_key)
            if any(r.get("name") == "langfuse.check" for r in rows.get("data", [])):
                print(f"trace: delivered ({trace_id}); open {cfg.base_url} -> Tracing")
                return 0
        except (urllib.error.URLError, OSError, ValueError):
            pass
    print("trace: NOT FOUND yet (ingestion can lag; check the worker logs)", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
