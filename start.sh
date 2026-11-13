#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/home/runner/work/PlayGround/PlayGround"
PORT="${PORT:-3000}"
OPENCODE_WEB_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
mkdir -p "$OPENCODE_WEB_DIR"

log() {
  printf '[start.sh] %s\n' "$*" >&2
}

start_timer() {
  date +%s.%N
}

elapsed_seconds() {
  local start="$1"
  local end
  end="$(date +%s.%N)"
  python3 - <<'PY' "$start" "$end"
import sys
start = float(sys.argv[1])
end = float(sys.argv[2])
print(f"{end - start:.2f}")
PY
}

cd "$PROJECT_DIR"
log "Project dir: $PROJECT_DIR"
log "Starting dependency install and build if required"

step_start="$(start_timer)"
if [[ ! -d node_modules ]]; then
  log "Installing dependencies"
  /usr/bin/time -p npm install
else
  log "Dependencies already present"
fi
step_elapsed="$(elapsed_seconds "$step_start")"
log "Install step finished in ${step_elapsed}s"

build_start="$(start_timer)"
if [[ ! -d dist ]] || [[ ! -f dist/index.html ]]; then
  log "Building static site"
  /usr/bin/time -p npm run build
else
  log "Using existing dist output"
fi
build_elapsed="$(elapsed_seconds "$build_start")"
log "Build step finished in ${build_elapsed}s"

JSON_PATH="/home/runner/work/_temp/omgithub-web/deployment-output.json"
mkdir -p "$(dirname "$JSON_PATH")"
/usr/bin/time -p python3 - <<'PY' "$PROJECT_DIR" "$JSON_PATH"
import json, os, sys
project_dir = os.path.abspath(sys.argv[1])
output_path = sys.argv[2]
static_dir = os.path.join(project_dir, 'dist')
with open(output_path, 'w', encoding='utf-8') as fh:
    json.dump({"project": project_dir, "directory": static_dir}, fh, separators=(',', ':'))
PY
log "Deployment metadata written to $JSON_PATH"

log "Serving project on port $PORT"
exec /usr/bin/time -p npx vite preview --host 0.0.0.0 --port "$PORT" --strictPort
