#!/usr/bin/env bash
set -euo pipefail

# Gate demo startup on typecheck so vite-plugin-checker never blocks a
# customer demo with a full-screen TypeScript overlay. --showcase also
# runs fill-zigzag / fill-star tests when those features are on the branch.

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

DEMO_PORT="${VITE_APP_PORT:-3001}"
# Cursor's in-app browser resolves localhost to 127.0.0.1 and gets
# ERR_CONNECTION_REFUSED when Vite binds only [::1], so bind IPv4 explicitly.
DEMO_HOST="127.0.0.1"
BIND_TIMEOUT="${DEMO_BIND_TIMEOUT:-90}"
FILL_STYLE_TEST="packages/excalidraw/actions/actionProperties.test.tsx"
PID_FILE="${ROOT}/.demo-server.pid"
LOG_FILE="${ROOT}/.demo-server.log"
SHOWCASE=0
INSTALL=0

usage() {
  cat <<EOF
Verify and start the Excalidraw demo dev server.

Usage:
  demo-server.sh verify [--showcase]   Typecheck; --showcase also runs EC-1/EC-2 fill tests
  demo-server.sh start [--showcase]    verify, then start vite in the background
  demo-server.sh stop                  Stop the background demo server
  demo-server.sh status                Show whether the demo server is running

Modes:
  (default)     Typecheck only — live-build demos (mode A)
  --showcase    Typecheck + fill-zigzag / fill-star tests — pre-built fills (mode B)
  --install     Run \`yarn install\` before starting (skipped by default so the
                server binds fast; use after pulling dependency changes)

Environment:
  VITE_APP_PORT        Port to expect (default: 3001 from .env.development)
  DEMO_BIND_TIMEOUT    Seconds to wait for the port to bind (default: 90)

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
  local attempts="${BIND_TIMEOUT}"
  while [[ "$attempts" -gt 0 ]]; do
    if port_open; then
      return 0
    fi
    sleep 1
    attempts=$((attempts - 1))
  done
  die "server did not bind to port ${DEMO_PORT} within ${BIND_TIMEOUT}s — check ${LOG_FILE}"
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

  # Also drop leftover yarn/vite listeners (started outside this script).
  # Those keep a transform cache from the previous branch and hide new controls.
  if command -v lsof >/dev/null 2>&1; then
    local extra
    extra="$(lsof -tiTCP:"${DEMO_PORT}" -sTCP:LISTEN 2>/dev/null || true)"
    if [[ -n "$extra" ]]; then
      echo "Stopping leftover listener(s) on ${DEMO_PORT}: ${extra}"
      # shellcheck disable=SC2086
      kill $extra 2>/dev/null || true
      sleep 1
    fi
  fi
}

start_server() {
  verify

  echo "→ recycling port ${DEMO_PORT} (avoids stale Vite after branch switch)"
  stop_server

  if [[ "$INSTALL" -eq 1 ]]; then
    echo "→ yarn install"
    yarn install
  fi

  # Run vite directly rather than `yarn start`, whose `yarn && vite` spends the
  # bind window installing.
  #
  # setsid, not nohup: the server must leave this shell's session entirely or it
  # is killed when the invoking shell exits, which silently drops the demo
  # moments after "ready". macOS has no setsid(1), so borrow it from perl.
  echo "→ starting vite on ${DEMO_HOST}:${DEMO_PORT} (log: ${LOG_FILE})"
  perl -e 'use POSIX qw(setsid); setsid(); exec @ARGV or die' -- \
    yarn --cwd ./excalidraw-app vite \
    --host "${DEMO_HOST}" --port "${DEMO_PORT}" --strictPort \
    >"${LOG_FILE}" 2>&1 &
  disown

  wait_for_port

  # Record the process actually holding the port; the yarn wrapper above exits
  # or re-execs, so its pid is not what `stop` needs to kill.
  local listener
  listener="$(lsof -tiTCP:"${DEMO_PORT}" -sTCP:LISTEN 2>/dev/null | head -1)"
  if [[ -n "$listener" ]]; then
    echo "$listener" >"${PID_FILE}"
  fi

  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:${DEMO_PORT}/" || true)"
  [[ "$code" == "200" ]] || die "port ${DEMO_PORT} is bound but http://localhost:${DEMO_PORT}/ returned ${code} — check ${LOG_FILE}"

  echo "Demo server ready: http://localhost:${DEMO_PORT}/ (pid ${listener:-unknown}, HTTP 200)"
  echo "Branch: $(git branch --show-current)"
  echo "Hard-refresh the browser (Cmd-Shift-R) after start."
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
        --install) INSTALL=1; shift ;;
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
