#!/bin/bash
# Isolated side-by-side test stack for the advisory agent + voice worker, so a branch can be tested end-to-end while
# the live demo stack (chat :8095, LiveKit :7880, worker) keeps running untouched.
#   up:   SIDE_REPO=/root/hx/loan/repo-upgrade infra/voice/side_stack.sh up
#   down: infra/voice/side_stack.sh down
# Shares the live STT (:8791) and TTS (:8793) sidecars and the read-only Frappe; everything else is separate:
#   chat server   :${SIDE_PORT:-8096}  (own session secret, own audit/handoff logs, own Qdrant copy)
#   LiveKit       :${SIDE_LK_PORT:-7890} (own dev keys, rtc tcp 7891, udp 50300-50400)
#   voice worker  health :${SIDE_WORKER_PORT:-8082}, joins only the side LiveKit
# (The worker is tracked by a pid file: 'exec -a' renaming breaks the LiveKit forkserver.)
# Retriever: GPU with AGENT_GPU_FRACTION (default 0.016) unless SIDE_RETRIEVER_DEVICE=cpu. Remove the stack when done.
set -euo pipefail
ROOT=${LOAN_ROOT:-/root/hx/loan}
REPO=${SIDE_REPO:-$ROOT/repo-upgrade}
S=${SIDE_DIR:-$ROOT/upgrade/side}
PORT=${SIDE_PORT:-8096}
LKP=${SIDE_LK_PORT:-7890}
WPORT=${SIDE_WORKER_PORT:-8082}
C=${AGENT_CONTAINER:-hx-loan-agent}
mkdir -p "$S" "$S/logs"

down() {
  # bracketed first letters so pkill never matches the shell that runs it
  docker exec "$C" bash -lc "pkill -f '[a]gent.server --port $PORT' ; [ -f $S/worker.pid ] && { p=\$(cat $S/worker.pid); pkill -P \$p; kill \$p; rm -f $S/worker.pid; }" || true
  pkill -f "[l]ivekit-server --config $S/livekit.yaml" || true
  for i in $(seq 1 30); do pgrep -f "[l]ivekit-server --config $S/livekit.yaml" >/dev/null || break; sleep 1; done
  echo "side stack down"
}

up() {
  [ -f "$S/lk.env" ] || {
    k="side$(openssl rand -hex 6)"; v="$(openssl rand -hex 32)"
    printf 'LIVEKIT_URL=ws://127.0.0.1:%s\nLIVEKIT_API_KEY=%s\nLIVEKIT_API_SECRET=%s\n' "$LKP" "$k" "$v" > "$S/lk.env"
    chmod 600 "$S/lk.env"
    openssl rand -hex 32 > "$S/session.secret"
  }
  . "$S/lk.env"
  cat > "$S/livekit.yaml" <<EOF
port: $LKP
bind_addresses: ["127.0.0.1"]
rtc:
  tcp_port: $((LKP + 1))
  port_range_start: 50300
  port_range_end: 50400
  use_external_ip: false
  node_ip: 127.0.0.1
keys:
  $LIVEKIT_API_KEY: $LIVEKIT_API_SECRET
logging:
  level: info
EOF
  chmod 600 "$S/livekit.yaml"
  curl -fs "127.0.0.1:$LKP" >/dev/null || {
    nohup "$ROOT/voice/livekit-server" --config "$S/livekit.yaml" > "$S/logs/livekit.log" 2>&1 &
    for i in $(seq 1 20); do curl -fs "127.0.0.1:$LKP" >/dev/null && break; sleep 1; done; }
  [ -d "$S/qdrant" ] || { cp -r "$ROOT/agent/qdrant_v2" "$S/qdrant"; rm -f "$S/qdrant/.lock"; }
  docker exec -d "$C" bash -lc "cd $REPO && set -a && . $ROOT/secrets.env && . $S/lk.env && set +a && \
    export LOAN_POLICY_DIR=$ROOT/policy AGENT_QDRANT_DIR=$S/qdrant AGENT_AUDIT_LOG=$S/turns.jsonl AGENT_HANDOFF_LOG=$S/handoffs.jsonl \
      EVIDENCE_TRACE_DIR=$S/traces AGENT_SESSION_SECRET=\$(cat $S/session.secret) PYTHONPATH=.:apps/api/src \
      AGENT_GPU_FRACTION=${AGENT_GPU_FRACTION:-0.016} AGENT_RETRIEVER_DEVICE=${SIDE_RETRIEVER_DEVICE:-} \
      AGENT_TRACING=${AGENT_TRACING:-0} && exec python -m loan_advisory.agent.server --port $PORT > $S/logs/server.log 2>&1"
  for i in $(seq 1 90); do curl -fs "127.0.0.1:$PORT/healthz" >/dev/null && break; sleep 2; done
  curl -fs "127.0.0.1:$PORT/healthz" >/dev/null || { echo "side server failed"; tail -20 "$S/logs/server.log"; exit 1; }
  docker exec -d "$C" bash -lc "cd $REPO/apps/voice && set -a && . $S/lk.env && set +a && \
    export AGENT_HTTP=http://127.0.0.1:$PORT VOICE_TURN_LOG=$S/turns_voice.jsonl VOICE_WORKER_PORT=$WPORT AGENT_TRACING=0 \
      VOICE_MIN_ENDPOINTING_S=${VOICE_MIN_ENDPOINTING_S:-0.5} VOICE_VAD_MIN_SILENCE_S=${VOICE_VAD_MIN_SILENCE_S:-0.55} \
      VOICE_STREAM=${VOICE_STREAM:-1} && echo \$\$ > $S/worker.pid && exec python agent_worker.py start > $S/logs/worker.log 2>&1"
  sleep 6
  echo "side stack up: chat :$PORT, livekit :$LKP, worker :$WPORT"
}

"${1:-up}"
