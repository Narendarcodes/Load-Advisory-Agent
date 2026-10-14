#!/usr/bin/env bash
# Bring up the self-hosted voice stack on the GPU droplet (all ports bound to 127.0.0.1).
#   hx-loan-stt   : Hyperion asr-http sidecar (IndicConformer te/hi on CPU, Whisper large-v3-turbo en on GPU) :8791
#   hx-loan-tts   : vLLM serving kenpath/svara-tts-v1 (fp8) :8792 + streaming SNAC sidecar :8793
#   livekit-server: self-hosted LiveKit 1.13 (dev keys generated locally, never committed) :7880 / rtc tcp 7881 / udp 50000-50200
#   voice worker  : apps/voice/agent_worker.py inside hx-loan-agent (host network), drives the advisory graph via :8095
# Prereqs: hx-loan-agent container running the chat server (see docs/agent/README.md), INDICCONF_DIR checkout.
# Check `rocm-smi --showpids` first: budget for this stack (STT + TTS) is <= 12 GB extra VRAM. The chat server's policy
# retriever counts against the separate RAG budget (<= 6 GB); start it with AGENT_GPU_FRACTION=0.016 (~3 GB cap on MI300X).
set -euo pipefail
ROOT=${ROOT:-/root/hx/loan}
REPO=${REPO:-$ROOT/repo-agent}
V=$ROOT/voice
INDICCONF_DIR=${INDICCONF_DIR:-/root/speech_r2/gated_indicconf}
HFC=${HF_CACHE:-/root/hfcache}
mkdir -p "$V"

# --- LiveKit keys + config (local only)
if [ ! -f "$ROOT/agent/livekit.env" ]; then
  K="lk$(head -c 6 /dev/urandom | xxd -p)"; S="$(head -c 32 /dev/urandom | xxd -p -c 64)"
  printf 'LIVEKIT_URL=ws://127.0.0.1:7880\nLIVEKIT_API_KEY=%s\nLIVEKIT_API_SECRET=%s\n' "$K" "$S" > "$ROOT/agent/livekit.env"
  chmod 600 "$ROOT/agent/livekit.env"
fi
set -a; . "$ROOT/agent/livekit.env"; set +a
cat > "$V/livekit.yaml" <<EOF
port: 7880
bind_addresses: ["127.0.0.1"]
rtc:
  tcp_port: 7881
  port_range_start: 50000
  port_range_end: 50200
  use_external_ip: false
  node_ip: 127.0.0.1
keys:
  $LIVEKIT_API_KEY: $LIVEKIT_API_SECRET
logging:
  level: info
EOF
chmod 600 "$V/livekit.yaml"
pkill -f "livekit-server --config" || true
nohup "$V/livekit-server" --config "$V/livekit.yaml" > "$ROOT/logs/livekit.log" 2>&1 &

# --- STT sidecar (Hyperion asr-http; code copied from Hyperion PR #20, packages/asr/asr-http/py)
if ! docker ps --format '{{.Names}}' | grep -qx hx-loan-stt; then
  docker run -d --name hx-loan-stt --restart unless-stopped --device /dev/kfd --device /dev/dri --group-add video --ipc=host \
    -p 127.0.0.1:8791:8790 -v "$HFC":/root/.cache/huggingface -e HF_HOME=/root/.cache/huggingface \
    -v "$INDICCONF_DIR":/models/indicconformer:ro -v "$V/stt":/opt/stt:ro --entrypoint python hx-stt:base /opt/stt/stt_server.py \
    --host 0.0.0.0 --port 8790 --engine indicconformer=indicconformer:/models/indicconformer \
    --engine whisper-turbo=whisper:openai/whisper-large-v3-turbo --route te=indicconformer --route hi=indicconformer \
    --route en=whisper-turbo --route '*=whisper-turbo' --preload
fi

# --- TTS: vLLM (svara-tts-v1, fp8) on host network; GLOO/VLLM_HOST_IP pinned to loopback like vllm-leads
#     KV cache is sized explicitly: on the shared GPU, utilization-based profiling sees other processes' memory move and
#     fails ("No available memory for the cache blocks") or over-allocates; 768M KV ~ 7k tokens, enough for 4 x short TTS requests.
if ! docker ps --format '{{.Names}}' | grep -qx hx-loan-tts; then
  docker rm -f hx-loan-tts >/dev/null 2>&1 || true
  docker run -d --name hx-loan-tts --restart unless-stopped --network host --device /dev/kfd --device /dev/dri --group-add video \
    --ipc=host -e GLOO_SOCKET_IFNAME=lo -e VLLM_HOST_IP=127.0.0.1 -v "$HFC":/root/.cache/huggingface -e HF_HOME=/root/.cache/huggingface \
    -v "$ROOT":"$ROOT" vllm/vllm-openai-rocm:v0.27.1 kenpath/svara-tts-v1 --served-model-name svara --host 127.0.0.1 --port 8792 \
    --quantization fp8 --gpu-memory-utilization 0.025 --kv-cache-memory-bytes ${TTS_KV_BYTES:-768M} --max-model-len 2048 --max-num-seqs 4
fi
for i in $(seq 1 120); do curl -fs 127.0.0.1:8792/v1/models >/dev/null && break; sleep 3; done
docker exec hx-loan-tts bash -lc "pip list 2>/dev/null | grep -q '^snac ' || pip install -q snac; pkill -f tts_sidecar.py" || true
docker exec -d hx-loan-tts bash -lc "cd $REPO/apps/voice && exec python3 tts_sidecar.py --host 127.0.0.1 --port 8793 --vllm http://127.0.0.1:8792/v1 > $ROOT/logs/tts_sidecar.log 2>&1"
for i in $(seq 1 60); do curl -fs 127.0.0.1:8793/healthz >/dev/null && break; sleep 2; done

# --- voice worker (needs livekit-agents[silero] in hx-loan-agent)
docker exec hx-loan-agent pkill -f agent_worker.py || true
docker exec -d hx-loan-agent bash -lc "cd $REPO/apps/voice && set -a && . $ROOT/agent/livekit.env && set +a && \
  AGENT_TRACING=${AGENT_TRACING:-1} OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:6006 OTEL_SERVICE_NAME=loan-voice-worker \
  VOICE_TURN_LOG=$V/turns.jsonl exec python agent_worker.py start > $ROOT/logs/voice_worker.log 2>&1"
sleep 5
curl -fs 127.0.0.1:8791/healthz && echo && curl -fs 127.0.0.1:8793/healthz && echo && echo "voice stack up"
