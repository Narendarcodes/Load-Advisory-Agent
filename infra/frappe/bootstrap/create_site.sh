#!/bin/bash
# Idempotent site creation for the droplet stack (loanrangers.droplet.yml).
# Needs DB_ROOT_PASSWORD and FRAPPE_ADMIN_PASSWORD in env (kept in an untracked secrets.env).
set -euo pipefail
SITE=${FRAPPE_SITE:-loanhx.local}
B="docker exec ${FRAPPE_BACKEND:-loanhx-backend-1}"
if ! $B bash -c "test -d sites/$SITE"; then
  $B bench new-site "$SITE" --mariadb-user-host-login-scope=% \
     --db-root-password "$DB_ROOT_PASSWORD" --admin-password "$FRAPPE_ADMIN_PASSWORD" \
     --install-app erpnext
fi
$B bench --site "$SITE" list-apps | grep -q lending || $B bench --site "$SITE" install-app lending
$B bench --site "$SITE" list-apps
