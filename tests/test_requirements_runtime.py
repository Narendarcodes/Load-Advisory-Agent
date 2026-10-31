"""Regression (QA 2026-10-26, D1): `pip install -r requirements.txt` must give every third-party package the
chat server and decision core import at module load. `langgraph` was imported by agent/graph.py but missing from
requirements.txt, so the documented setup crashed with ModuleNotFoundError before the UI could start."""
import ast
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FIRST_PARTY = {"loan_advisory", "decision_engine", "rag", "synthetic_bureau"}
# import name -> distribution name in requirements.txt
DIST = {"zen": "zen-engine", "yaml": "pyyaml", "ag_ui": "ag-ui-protocol"}


def _module_level_imports(path: Path) -> set[str]:
    tops = set()
    for node in ast.parse(path.read_text(encoding="utf-8")).body:  # module level only: lazy/optional imports are excluded
        if isinstance(node, ast.Import):
            tops |= {a.name.split(".")[0] for a in node.names}
        elif isinstance(node, ast.ImportFrom) and node.level == 0 and node.module:
            tops.add(node.module.split(".")[0])
    return tops


def _declared() -> set[str]:
    names = set()
    for line in (ROOT / "requirements.txt").read_text(encoding="utf-8").splitlines():
        line = line.split("#", 1)[0].strip()
        if line:
            names.add(re.split(r"[<>=!~\[ ;]", line, maxsplit=1)[0].lower())
    return names


def test_requirements_cover_runtime_imports():
    files = list((ROOT / "apps/api/src/loan_advisory").rglob("*.py")) + list((ROOT / "decision_engine").rglob("*.py"))
    needed = set()
    for f in files:
        needed |= {m for m in _module_level_imports(f) if m not in sys.stdlib_module_names and m not in FIRST_PARTY}
    missing = sorted(DIST.get(m, m) for m in needed if DIST.get(m, m).lower() not in _declared())
    assert not missing, f"requirements.txt is missing runtime dependencies: {missing}"
