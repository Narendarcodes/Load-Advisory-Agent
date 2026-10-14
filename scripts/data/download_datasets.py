"""Reproducible download of the Phase-1 public datasets (raw data stays OUT of git).

Usage (on the droplet):
    LOAN_DATA_DIR=/root/hx/loan/data python scripts/data/download_datasets.py [--only id ...]

- Reads data/sources/datasets.yaml.
- Skips `gated` sources unless KAGGLE_USERNAME/KAGGLE_KEY are set (and, for
  competitions, the user has accepted the rules on kaggle.com themselves).
- Writes raw/<id>/<file> plus raw/<id>/MANIFEST.json (url, bytes, sha256, md5,
  retrieved_at) so later runs can detect upstream changes.
"""
import argparse
import hashlib
import json
import os
import subprocess
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path

import requests
import yaml

ROOT = Path(__file__).resolve().parents[2]
REGISTRY = ROOT / "data" / "sources" / "datasets.yaml"


def _hashes(path: Path):
    sha, md5 = hashlib.sha256(), hashlib.md5()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            sha.update(chunk)
            md5.update(chunk)
    return sha.hexdigest(), md5.hexdigest()


def _http(url: str, dest: Path):
    tmp = dest.with_suffix(dest.suffix + ".part")
    with requests.get(url, stream=True, timeout=60) as r:
        r.raise_for_status()
        with tmp.open("wb") as f:
            for chunk in r.iter_content(1 << 20):
                f.write(chunk)
    tmp.rename(dest)


def _kaggle(spec: dict, dest_dir: Path):
    if not (os.environ.get("KAGGLE_USERNAME") and os.environ.get("KAGGLE_KEY")):
        raise PermissionError("gated: set KAGGLE_USERNAME and KAGGLE_KEY (user's own Kaggle account)")
    if "kaggle" in spec:
        cmd = ["kaggle", "datasets", "download", spec["kaggle"], "-f", spec["name"], "-p", str(dest_dir)]
    else:
        cmd = ["kaggle", "competitions", "download", spec["kaggle_competition"], "-p", str(dest_dir)]
    subprocess.run(cmd, check=True)


def fetch(ds: dict, data_dir: Path) -> dict:
    out = data_dir / "raw" / ds["id"]
    out.mkdir(parents=True, exist_ok=True)
    manifest = {"id": ds["id"], "licence": ds["licence"], "source_page": ds["source_page"], "files": []}
    for spec in ds["files"]:
        name = spec.get("name") or spec.get("kaggle_competition")
        dest = out / name
        if "url" in spec:
            if not dest.exists():
                _http(spec["url"], dest)
        else:
            _kaggle(spec, out)
        entry = {"name": name, "url": spec.get("url"), "retrieved_at": datetime.now(timezone.utc).isoformat()}
        if dest.exists():
            sha, md5 = _hashes(dest)
            entry.update(bytes=dest.stat().st_size, sha256=sha, md5=md5)
            if spec.get("md5") and spec["md5"] != md5:
                raise ValueError(f"{name}: md5 mismatch (expected {spec['md5']}, got {md5}) — upstream changed?")
            if dest.suffix == ".zip":
                with zipfile.ZipFile(dest) as z:
                    z.extractall(out / "unzipped")
                    entry["members"] = z.namelist()
        manifest["files"].append(entry)
    (out / "MANIFEST.json").write_text(json.dumps(manifest, indent=1))
    return manifest


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", nargs="*")
    args = ap.parse_args()
    data_dir = Path(os.environ.get("LOAN_DATA_DIR", "/root/hx/loan/data"))
    reg = yaml.safe_load(REGISTRY.read_text())["datasets"]
    status = {}
    for ds in reg:
        if args.only and ds["id"] not in args.only:
            continue
        try:
            m = fetch(ds, data_dir)
            status[ds["id"]] = {"ok": True, "files": [(f["name"], f.get("bytes")) for f in m["files"]]}
        except Exception as e:  # report and continue; gated sources are expected to fail without creds
            status[ds["id"]] = {"ok": False, "error": f"{type(e).__name__}: {e}"[:300]}
        print(ds["id"], json.dumps(status[ds["id"]]), flush=True)
    (data_dir / "download_status.json").write_text(json.dumps(status, indent=1))
    return 0 if any(v["ok"] for v in status.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
