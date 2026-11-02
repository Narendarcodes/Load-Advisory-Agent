#!/bin/bash
# Install the borrower portal app into a running Frappe backend container.
#
# Why this exists: the bench image is built from infra/frappe/apps.json (erpnext + lending only),
# and `bench get-app` in bench 5.31 has no --subdirectory option, so an app that lives inside this
# monorepo at apps/loan_advisory_portal cannot be fetched by any bench command. Before this script
# the only way to get the portal onto a site was an undocumented manual `docker cp`, which meant a
# clean machine could build a site with no borrower portal at all.
#
# The app tree is copied from the host clone, so run this from a checkout of this repository, and
# re-run it whenever the container is recreated: `docker cp` content does not survive a new
# container, and the sites volume does not carry apps/.
#
#   FRAPPE_SITE=loanportal.local FRAPPE_BACKEND=loanrangers-backend-1 \
#     ./infra/frappe/bootstrap/install_portal_app.sh
#
# Safe to re-run: the copy overwrites, the symlink is forced, install-app and migrate are guarded.
set -euo pipefail

SITE=${FRAPPE_SITE:-loanportal.local}
BACKEND=${FRAPPE_BACKEND:-loanrangers-backend-1}
APP=loan_advisory_portal
BENCH=/home/frappe/frappe-bench

# repo root = three levels up from this script (infra/frappe/bootstrap/)
REPO_ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
SRC="$REPO_ROOT/apps/$APP/$APP"

if [ ! -d "$SRC" ]; then
  echo "install_portal_app: no app tree at $SRC" >&2
  echo "  run this from a checkout of this repository" >&2
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -qx "$BACKEND"; then
  echo "install_portal_app: container '$BACKEND' is not running" >&2
  exit 1
fi

if ! docker exec "$BACKEND" bash -lc "test -d $BENCH/sites/$SITE"; then
  # `docker exec <c> test -d <path>` is not equivalent: it runs coreutils test without a shell and
  # reports failure for a directory that does exist. Always go through bash -lc here.
  echo "install_portal_app: site '$SITE' does not exist in $BACKEND; create it first" >&2
  echo "  see infra/frappe/bootstrap/create_site.sh" >&2
  exit 1
fi

echo "==> copying $APP from $SRC"
# Why a tarball and not `docker cp` of a directory: from a Windows host, copying a *directory* is
# ambiguous in two ways that were both hit here. `"$SRC/."` nests, and an MSYS-style host path
# (`/c/Users/...`) makes the CLI append the source directory name instead of replacing the destination.
# Either way the app tree ends up holding a second copy of itself, which stays invisible until
# `bench run-tests` collects the suite twice (386 runs for 193 tests). Copying one *file* has no such
# ambiguity, and the shape check below refuses a nested tree outright.
STAGE_DIR=$(mktemp -d)
tar -czf "$STAGE_DIR/$APP.tgz" --exclude='__pycache__' --exclude='*.pyc' -C "$SRC" .
docker cp "$STAGE_DIR/$APP.tgz" "$BACKEND:/tmp/$APP.tgz"
rm -rf "$STAGE_DIR"
docker exec -u root "$BACKEND" bash -lc "
  rm -rf $BENCH/apps/$APP/$APP &&
  mkdir -p $BENCH/apps/$APP/$APP &&
  tar -xzf /tmp/$APP.tgz -C $BENCH/apps/$APP/$APP &&
  rm -f /tmp/$APP.tgz &&
  chown -R frappe:root $BENCH/apps/$APP"

# Shape check. Correct tree: exactly one hooks.py in the app, at <app>/<app>/hooks.py, with the
# 'Loan Advisory Portal' module directory <app>/<app>/<app>/ containing __init__.py and doctype/ and
# nothing that belongs a level up (no hooks.py, no tests/).
SHAPE=$(docker exec "$BACKEND" bash -lc "
  cd $BENCH/apps/$APP 2>/dev/null || { echo 'no-app'; exit 0; }
  n=\$(find . -name hooks.py | wc -l)
  [ \"\$n\" = 1 ] || { echo \"hooks.py count = \$n\"; exit 0; }
  test -f $APP/hooks.py || { echo 'package root missing hooks.py'; exit 0; }
  test -f $APP/$APP/__init__.py || { echo 'module __init__.py missing'; exit 0; }
  test -d $APP/$APP/doctype || { echo 'module doctype/ missing'; exit 0; }
  test -e $APP/$APP/tests && { echo 'module duplicates tests/'; exit 0; }
  echo ok")
if [ "$SHAPE" != "ok" ]; then
  echo "install_portal_app: the app tree is wrong ($SHAPE)." >&2
  echo "  want: one hooks.py at $BENCH/apps/$APP/$APP/hooks.py, and $BENCH/apps/$APP/$APP/$APP/ holding" >&2
  echo "        only __init__.py and doctype/." >&2
  echo "  got:  $(docker exec "$BACKEND" bash -lc "ls -p $BENCH/apps/$APP/$APP 2>&1 | tr '\n' ' '")" >&2
  exit 1
fi

echo "==> exposing public/ under /assets/$APP"
# Frappe serves app assets from sites/assets/<app>; the image has no build step for this app
# (plain CSS/JS, and the React island is built on the host), so a symlink is the whole mechanism.
docker exec "$BACKEND" mkdir -p "$BENCH/sites/assets"
docker exec -u root "$BACKEND" ln -sfn "$BENCH/apps/$APP/$APP/public" "$BENCH/sites/assets/$APP"

echo "==> installing $APP on site $SITE if absent"
docker exec "$BACKEND" bash -lc "
  cd $BENCH &&
  if bench --site $SITE list-apps | grep -qx $APP; then
    echo '  already installed'
  else
    bench --site $SITE install-app $APP
  fi"

echo "==> migrate (idempotent: custom fields and roles are re-applied on after_migrate)"
docker exec "$BACKEND" bash -lc "cd $BENCH && bench --site $SITE migrate"

echo "==> result"
docker exec "$BACKEND" bash -lc "cd $BENCH && bench --site $SITE list-apps"
echo "install_portal_app: done. Serve the site and check /assets/$APP/css/portal.css returns 200."
