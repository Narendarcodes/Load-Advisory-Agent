"""Publish, inspect and promote the agent's prompts in the local Langfuse Prompt Management.

`prompts.py` is the source of truth. This script turns each managed template into a Langfuse text prompt
(`loan-advisory/<key>`, `{{variable}}` placeholders) so a prompt can be edited, versioned, labelled and tried in the
Langfuse Playground without touching code, and then served by the agent with `LANGFUSE_PROMPTS=1`
(see `apps/api/src/loan_advisory/agent/prompt_store.py`).

    # what exists locally and in Langfuse (no writes)
    python scripts/development/langfuse_prompts.py --env-file .env list

    # publish every changed template as a NEW version, labelled `production` (unchanged ones are skipped)
    python scripts/development/langfuse_prompts.py --env-file .env push --commit-message "tighten plain language"

    # publish a candidate under its own label, so `production` keeps serving the current text
    python scripts/development/langfuse_prompts.py --env-file .env push --only explain --label candidate

    # move a label to a version (this is the "release" step: the agent serves whatever `production` points at)
    python scripts/development/langfuse_prompts.py --env-file .env promote --only explain --version 2 --label production

    # read a version back / diff two versions / check code-vs-server variable drift
    python scripts/development/langfuse_prompts.py --env-file .env show --only explain --version 1
    python scripts/development/langfuse_prompts.py --env-file .env diff --only explain --from 1 --to 2
    python scripts/development/langfuse_prompts.py --env-file .env sync-check

Exit codes: 0 ok, 1 a Langfuse/auth/server failure, 2 Langfuse not configured (the agent still runs on prompts.py).
"""
from __future__ import annotations

import argparse
import difflib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "apps" / "api" / "src"))

from loan_advisory.agent import prompt_store as PS  # noqa: E402

_ENV_KEYS = ("LANGFUSE_PUBLIC_KEY", "LANGFUSE_SECRET_KEY", "LANGFUSE_BASE_URL", "LANGFUSE_HOST", "LANGFUSE_ENABLED",
             "LANGFUSE_ENVIRONMENT", "LANGFUSE_RELEASE", "LANGFUSE_PROMPTS", "LANGFUSE_PROMPT_LABEL",
             "LANGFUSE_PROMPT_PREFIX", "LANGFUSE_PROMPT_CACHE_TTL_S")


def _read_env(path: Path) -> None:
    import os
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        if key.strip() in _ENV_KEYS:
            os.environ[key.strip()] = value.split(" #")[0].strip()


def _client():
    """A prompt-management client (tracing off: this script only reads and writes prompts)."""
    from langfuse import Langfuse
    cfg = PS.langfuse_config.load()
    if not cfg.active:
        print(json.dumps(cfg.summary(), indent=1))
        print("\nLangfuse is not configured; pass --env-file .env (or --stack-env).", file=sys.stderr)
        return None
    return Langfuse(public_key=cfg.public_key, secret_key=cfg.secret_key, base_url=cfg.base_url,
                    environment=cfg.environment, timeout=cfg.timeout_s, tracing_enabled=False)


def _keys(only: str | None) -> list[str]:
    reg = PS.registry()
    if not only:
        return list(reg)
    wanted = [k.strip() for k in only.split(",") if k.strip()]
    unknown = [k for k in wanted if k not in reg]
    if unknown:
        raise SystemExit(f"unknown prompt key(s) {unknown}; known: {sorted(reg)}")
    return wanted


def _versions(client, name: str) -> list[int]:
    for meta in client.api.prompts.list(name=name, limit=50).data:
        if meta.name == name:
            return sorted(int(v) for v in (meta.versions or []))
    return []


def _meta(client, name: str):
    for meta in client.api.prompts.list(name=name, limit=50).data:
        if meta.name == name:
            return meta
    return None


def _text(client, name: str, version: int | None = None, label: str | None = None) -> str:
    """The text body of one version (`get_prompt` resolves names the REST path cannot, and caches nothing here)."""
    p = client.get_prompt(name, version=version, label=None if version else (label or PS.label()), type="text",
                          cache_ttl_seconds=0)
    return getattr(p, "prompt", "")


def cmd_list(client, args) -> int:
    reg = PS.registry()
    print(f"prefix={PS.prefix()!r} served label={PS.label()!r}  (LANGFUSE_PROMPTS={'1' if PS.enabled() else '0'})")
    for key in _keys(args.only):
        name = reg[key]["server_name"]
        meta = _meta(client, name)
        if meta is None:
            print(f"  {key:<24} {name:<34} not published   vars={reg[key]['variables']}")
            continue
        labels = ", ".join(meta.labels or []) or "-"
        print(f"  {key:<24} {name:<34} versions={_versions(client, name)} labels=[{labels}] "
              f"vars={reg[key]['variables']}")
    return 0


def cmd_push(client, args) -> int:
    reg = PS.registry()
    sha = None
    try:
        import subprocess
        sha = subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=ROOT, capture_output=True, text=True,
                             timeout=5).stdout.strip() or None
    except Exception:
        sha = None
    changed = 0
    for key in _keys(args.only):
        name, text = reg[key]["server_name"], reg[key]["text"]
        versions = _versions(client, name)
        if versions:
            latest = _text(client, name, version=versions[-1])
            if latest == text:
                print(f"  {key:<24} unchanged (v{versions[-1]})")
                continue
        if args.dry_run:
            print(f"  {key:<24} would publish a new version (current={versions or 'none'}) "
                  f"labels={[args.label] if args.label else []}")
            changed += 1
            continue
        p = client.create_prompt(name=name, prompt=text, type="text", labels=[args.label] if args.label else [],
                                 tags=["loan-advisory", "agent-prompt"],
                                 config={"variables": reg[key]["variables"], "source": "prompts.py", "sha": sha,
                                         "role": reg[key]["role"]},
                                 commit_message=args.commit_message)
        print(f"  {key:<24} published v{p.version}"
              f"{' label=' + args.label if args.label else ''}")
        changed += 1
    print(f"\n{changed} prompt(s) {'would be ' if args.dry_run else ''}published")
    return 0


def cmd_promote(client, args) -> int:
    for key in _keys(args.only):
        name = PS.registry()[key]["server_name"]
        version = args.version or _versions(client, name)[-1]
        client.update_prompt(name=name, version=version, new_labels=[args.label])
        print(f"  {key:<24} {name} v{version} -> label {args.label!r}")
    print("\nThe agent serves this label at runtime (LANGFUSE_PROMPT_LABEL, default 'production').")
    return 0


def cmd_show(client, args) -> int:
    for key in _keys(args.only):
        name = PS.registry()[key]["server_name"]
        print(f"===== {name} (version={args.version}, label={args.label}) =====")
        print(_text(client, name, version=args.version, label=None if args.version else (args.label or "production")))
        print()
    return 0


def cmd_diff(client, args) -> int:
    for key in _keys(args.only):
        name = PS.registry()[key]["server_name"]
        versions = _versions(client, name)
        if len(versions) < 2 and not (args.from_version and args.to_version):
            print(f"  {key}: fewer than two versions ({versions}); nothing to diff")
            continue
        a = args.from_version or versions[-2]
        b = args.to_version or versions[-1]
        d = list(difflib.unified_diff(_text(client, name, version=a).splitlines(),
                                      _text(client, name, version=b).splitlines(),
                                      fromfile=f"{name} v{a}", tofile=f"{name} v{b}", lineterm="", n=2))
        print("\n".join(d) if d else f"  {key}: v{a} and v{b} are identical")
    return 0


def cmd_sync_check(client, args) -> int:
    """Code-vs-server drift: the served version must expect exactly the placeholders this code fills in."""
    bad = 0
    reg = PS.registry()
    for key in _keys(args.only):
        name = reg[key]["server_name"]
        want = list(reg[key]["variables"])
        try:
            p = client.get_prompt(name, label=args.label or PS.label(), type="text")
        except Exception as e:
            print(f"  {key:<24} NOT SERVED ({type(e).__name__}); the agent would use the local template")
            bad += 1
            continue
        got = list(p.variables or [])
        missing = [v for v in want if v not in got]
        extra = [v for v in got if v not in want]
        state = "ok" if not missing and not extra else "DRIFT"
        print(f"  {key:<24} {name} v{p.version} label={args.label or PS.label()!r} {state} "
              f"want={want} got={got}")
        if missing or extra:
            bad += 1
            print(f"    missing in prompt (code fills, prompt ignores): {missing}")
            print(f"    extra in prompt (prompt expects, code never fills): {extra} -> a placeholder would stay literal")
    print(f"\n{'drift detected' if bad else 'no drift'}: {bad} prompt(s)")
    return 1 if bad else 0


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("action", choices=["list", "push", "promote", "show", "diff", "sync-check"])
    ap.add_argument("--env-file", type=Path, help="load LANGFUSE_* variables from this file (e.g. .env)")
    ap.add_argument("--stack-env", action="store_true", help="shortcut for --env-file infra/langfuse/.env")
    ap.add_argument("--only", help="comma-separated prompt keys (default: every managed prompt)")
    ap.add_argument("--label", default=None, help="label to publish/promote/serve (default: production)")
    ap.add_argument("--version", type=int, help="target version for promote/show")
    ap.add_argument("--from", dest="from_version", type=int, help="diff: source version")
    ap.add_argument("--to", dest="to_version", type=int, help="diff: target version")
    ap.add_argument("--commit-message", default=None, help="push: the version's commit message in the UI")
    ap.add_argument("--dry-run", action="store_true", help="push: show what would change, write nothing")
    args = ap.parse_args(argv)

    if args.env_file:
        _read_env(args.env_file)
    elif args.stack_env:
        _read_env(ROOT / "infra" / "langfuse" / ".env")
    if args.label is None:
        args.label = PS.label() if args.action != "push" else "production"

    client = _client()
    if client is None:
        return 2
    try:
        rc = {"list": cmd_list, "push": cmd_push, "promote": cmd_promote, "show": cmd_show, "diff": cmd_diff,
              "sync-check": cmd_sync_check}[args.action](client, args)
    except SystemExit:
        raise
    except Exception as e:
        print(f"{args.action} failed: {type(e).__name__}: {e}", file=sys.stderr)
        rc = 1
    finally:
        try:
            client.flush()
        except Exception:
            pass
    return rc


if __name__ == "__main__":
    raise SystemExit(main())
