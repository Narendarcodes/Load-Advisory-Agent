"""Run the synthetic bureau (apps/bureau, unchanged) with a Saral fixture re-keyed by Frappe
application name (see ops/saral_seed/plan.py::rekey_bureau_fixture). Loopback only. SYNTHETIC.

    PYTHONPATH=.:apps/api/src:apps/bureau/src python -m ops.bureau_fixture_server \
        --fixture /data/workspace/saral/bureau_saral_frappe.json --port 8011
"""
import argparse

import uvicorn

from synthetic_bureau.app import create_app

if __name__ == "__main__":  # pragma: no cover
    ap = argparse.ArgumentParser()
    ap.add_argument("--fixture", required=True)
    ap.add_argument("--port", type=int, default=8011)
    a = ap.parse_args()
    uvicorn.run(create_app(fixture_path=a.fixture), host="127.0.0.1", port=a.port)
