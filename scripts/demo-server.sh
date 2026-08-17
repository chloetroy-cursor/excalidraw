#!/usr/bin/env bash
set -euo pipefail

# Gate demo startup on typecheck so vite-plugin-checker never blocks a
# customer demo with a full-screen TypeScript overlay. --showcase also
# runs fill-zigzag / fill-star tests when those features are on the branch.

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

DEMO_PORT="${VITE_APP_PORT:-3001}"
FILL_STYLE_TEST="packages/excalidraw/actions/actionProperties.test.tsx"
PID_FILE="${ROOT}/.demo-server.pid"
LOG_FILE="${ROOT}/.demo-server.log"
SHOWCASE=0

usage() {
  cat <<EOF
Verify and start the Excalidraw demo dev server.

Usage:
  demo-server.sh verify [--showcase]   Typecheck; --showcase also runs EC-1/EC-2 fill tests
  demo-server.sh start [--showcase]    verify, then start yarn start in background
  demo-server.sh stop                  Stop the background demo server
  demo-server.sh status                Show whether the demo server is running

Modes:
  (default)     Typecheck only — live-build demos (mode A)
  --showcase    Typecheck + fill-zigzag / fill-star tests — pre-built fills (mode B)

Environment:
  VITE_APP_PORT   Port to expect (default: 3001 from .env.development)

Always open http://localhost:\${VITE_APP_PORT:-3001} after start. If verify fails,
the server is NOT started.
EOF
}

die() {
  echo "error: $*" >&2
  exit 1
}

verify() {
  echo "== demo-server verify =="
  echo "→ yarn test:typecheck"
  yarn test:typecheck

  if [[ "$SHOWCASE" -eq 1 ]]; then
    echo "→ fill-style tests (EC-1 / EC-2)"
    yarn test:app --watch=false "${FILL_STYLE_TEST}" \
      -t "should apply zigzag fill|should apply star fill"
  fi

  echo "verify: pass"
}

port_open() {
  if command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"${DEMO_PORT}" -sTCP:LISTEN >/dev/null 2>&1
    return
  fi
  curl -sf "http://localhost:${DEMO_PORT}/" >/dev/null 2>&1
}

wait_for_port() {
  local attempts=30
  while [[ "$attempts" -gt 0 ]]; do
    if port_open; then
      return 0
    fi
    sleep 1
    attempts=$((attempts - 1))
  done
  die "server did not bind to port ${DEMO_PORT} within 30s — check ${LOG_FILE}"
}

stop_server() {
  if [[ -f "$PID_FILE" ]]; then
    local pid
    pid="$(cat "$PID_FILE")"
    if kill -0 "$pid" 2>/dev/null; then
      echo "Stopping demo server (pid ${pid})..."
      kill "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
    fi
    rm -f "$PID_FILE"
  fi
}

start_server() {
  verify

  if port_open; then
    echo "Port ${DEMO_PORT} already in use — reusing existing server."
    echo "Demo URL: http://localhost:${DEMO_PORT}/"
    return 0
  fi

  echo "→ starting yarn start (log: ${LOG_FILE})"
  nohup yarn start >"${LOG_FILE}" 2>&1 &
  echo $! >"${PID_FILE}"

  wait_for_port
  echo "Demo server ready: http://localhost:${DEMO_PORT}/"
  echo "Branch: $(git branch --show-current)"
  echo "Hard-refresh the browser after any code change."
}

status_server() {
  if [[ -f "$PID_FILE" ]]; then
    local pid
    pid="$(cat "$PID_FILE")"
    if kill -0 "$pid" 2>/dev/null; then
      echo "running (pid ${pid}) — http://localhost:${DEMO_PORT}/"
      exit 0
    fi
  fi
  if port_open; then
    echo "port ${DEMO_PORT} is listening (may be from an external yarn start)"
    exit 0
  fi
  echo "not running"
  exit 1
}

case "${1:-}" in
  verify)
    shift
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --showcase) SHOWCASE=1; shift ;;
        *) die "unknown verify option: $1" ;;
      esac
    done
    verify
    ;;
  start)
    shift
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --showcase) SHOWCASE=1; shift ;;
        *) die "unknown start option: $1" ;;
      esac
    done
    start_server
    ;;
  stop) stop_server ;;
  status) status_server ;;
  -h | --help | help) usage ;;
  *) usage; die "unknown command: ${1:-}" ;;
esac
