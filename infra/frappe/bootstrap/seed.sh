#!/bin/bash
# Repeatable seeding: ./seed.sh  (env FRAPPE_SITE, FRAPPE_BACKEND optional)
set -euo pipefail
SITE=${FRAPPE_SITE:-loanhx.local}; C=${FRAPPE_BACKEND:-loanhx-backend-1}
D=$(cd "$(dirname "$0")" && pwd)
docker cp "$D/seed_site.py" "$C:/tmp/seed_site.py"
docker cp "$D/seed_applications.json" "$C:/tmp/seed_applications.json"
docker exec "$C" bench --site "$SITE" execute "exec(open('/tmp/seed_site.py').read(), {'__name__': 'seed'})" 2>&1 | grep -E "SEED_RESULT|Error|Traceback|rror:" || true
