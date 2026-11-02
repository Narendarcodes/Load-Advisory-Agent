#!/bin/bash
# Idempotent site creation for the droplet stack (loanrangers.droplet.yml).
# Needs DB_ROOT_PASSWORD and FRAPPE_ADMIN_PASSWORD in env (kept in an untracked secrets.env).
set -euo pipefail
SITE=${FRAPPE_SITE:-loanhx.local}
BACKEND=${FRAPPE_BACKEND:-loanhx-backend-1}
D=$(cd "$(dirname "$0")" && pwd)
B="docker exec $BACKEND"

if ! $B bash -c "test -d sites/$SITE"; then
  $B bench new-site "$SITE" --mariadb-user-host-login-scope=% \
     --db-root-password "$DB_ROOT_PASSWORD" --admin-password "$FRAPPE_ADMIN_PASSWORD" \
     --install-app erpnext
fi
$B bench --site "$SITE" list-apps | grep -q lending || $B bench --site "$SITE" install-app lending

# The borrower portal is not in the bench image (apps.json carries erpnext + lending only) and
# `bench get-app` cannot fetch an app out of a monorepo subdirectory, so it is installed from this
# checkout by its own script. Without this line a site created here has no portal at all.
FRAPPE_SITE="$SITE" FRAPPE_BACKEND="$BACKEND" "$D/install_portal_app.sh"

$B bench --site "$SITE" list-apps
