"""Export JSON Schema for every Saral contract.

    python -m contracts.export_schemas          # write contracts/schemas/*.schema.json
    python -m contracts.export_schemas --check  # exit 1 if a committed schema is stale

Non-Python consumers (the TypeScript runtime, the Frappe portal) read these files;
the pydantic models stay the source of truth. Cross-field rules (aggregates agree,
outcome follows result, no raw identifiers) live only in the pydantic validators.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from contracts import CONTRACTS

OUT = Path(__file__).resolve().parent / "schemas"


def render(name: str) -> str:
    schema = CONTRACTS[name].model_json_schema(mode="validation")
    schema["$id"] = f"https://saral.invalid/contracts/{name}.schema.json"
    schema["$comment"] = ("Generated from contracts/*.py by contracts/export_schemas.py. Synthetic development "
                          "contract; cross-field rules are enforced by the pydantic models only.")
    return json.dumps(schema, indent=2, sort_keys=True, ensure_ascii=False) + "\n"


def main(argv: list[str]) -> int:
    check = "--check" in argv
    OUT.mkdir(exist_ok=True)
    stale = []
    for name in sorted(CONTRACTS):
        path = OUT / f"{name}.schema.json"
        text = render(name)
        if check:
            if not path.exists() or path.read_text(encoding="utf-8") != text:
                stale.append(path.name)
        else:
            path.write_text(text, encoding="utf-8")
    if stale:
        print("stale schemas: " + ", ".join(stale))
        return 1
    print(("checked " if check else "wrote ") + f"{len(CONTRACTS)} schemas in {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
