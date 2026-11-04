#!/bin/sh
# Start the Saral Laya router service (CPU) on 127.0.0.1:${LAYA_PORT:-8097}. Stop: kill "$(cat "$LAYA_HOME/service.pid")"
# Expects $LAYA_HOME/venv with `pip install torch --index-url https://download.pytorch.org/whl/cpu && pip install laya==0.4.22`
# and $LAYA_HOME/svc holding laya_service.py + laya_questions.py (copied from apps/api/src/loan_advisory/agent/routing/).
LAYA_HOME=${LAYA_HOME:-$HOME/laya}
cd "$LAYA_HOME/svc" || exit 1
LAYA_PORT=${LAYA_PORT:-8097} LAYA_THREADS=${LAYA_THREADS:-2} setsid nohup ../venv/bin/python laya_service.py > ../service.log 2>&1 < /dev/null &
echo $! > ../service.pid
