#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="${ROOT}/excalidraw-app"
PORT=3001
FALLBACK_PORT=3002
STATE_DIR="${TMPDIR:-/tmp}/excalidraw-demo-server"
PID_FILE="${STATE_DIR}/pid"
LOG_FILE="${STATE_DIR}/server.log"

die() {
  echo "error: $*" >&2
  exit 1
}

listener_pids() {
  lsof -tiTCP:"$1" -sTCP:LISTEN 2>/dev/null || true
}

process_cwd() {
  lsof -a -p "$1" -d cwd -Fn 2>/dev/null | awk '/^n/{sub(/^n/, ""); print; exit}'
}

is_demo_vite() {
  local pid="$1"
  [[ "$(process_cwd "$pid")" == "$APP_DIR" ]]
}

kill_tree() {
  local pid="$1" child
  while IFS= read -r child; do
    [[ -n "$child" ]] || continue
    kill_tree "$child"
  done < <(pgrep -P "$pid" 2>/dev/null || true)
  kill "$pid" 2>/dev/null || true
}

stop_demo_listeners() {
  local port pid
  if [[ -f "$PID_FILE" ]]; then
    pid="$(awk 'NR == 1 { print; exit }' "$PID_FILE")"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      echo "stopping managed Excalidraw dev-server tree (pid ${pid})"
      kill_tree "$pid"
    fi
    rm -f "$PID_FILE"
  fi

  for port in "$PORT" "$FALLBACK_PORT"; do
    while IFS= read -r pid; do
      [[ -n "$pid" ]] || continue
      if is_demo_vite "$pid"; then
        echo "stopping Excalidraw dev server on port ${port} (pid ${pid})"
        kill "$pid" 2>/dev/null || true
      fi
    done < <(listener_pids "$port")
  done

  for _ in {1..50}; do
    local found=0
    for port in "$PORT" "$FALLBACK_PORT"; do
      while IFS= read -r pid; do
        [[ -n "$pid" ]] || continue
        is_demo_vite "$pid" && found=1
      done < <(listener_pids "$port")
    done
    [[ "$found" -eq 0 ]] && return 0
    sleep 0.1
  done

  die "an Excalidraw dev server did not stop cleanly"
}

assert_server() {
  local pids pid
  pids="$(listener_pids "$PORT")"
  [[ -n "$pids" ]] || die "nothing is listening on http://localhost:${PORT}"

  local count=0
  while IFS= read -r pid; do
    [[ -n "$pid" ]] || continue
    count=$((count + 1))
    is_demo_vite "$pid" ||
      die "port ${PORT} belongs to pid ${pid} outside ${APP_DIR}"
  done <<<"$pids"
  [[ "$count" -eq 1 ]] || die "expected one listener on port ${PORT}, found ${count}"

  while IFS= read -r pid; do
    [[ -n "$pid" ]] || continue
    if is_demo_vite "$pid"; then
      die "Excalidraw UI unexpectedly fell back to port ${FALLBACK_PORT}"
    fi
  done < <(listener_pids "$FALLBACK_PORT")

  curl --fail --silent --show-error "http://localhost:${PORT}/" >/dev/null ||
    die "the server on port ${PORT} did not return a successful response"

  echo "Excalidraw dev server verified at http://localhost:${PORT}"
}

start_server() {
  stop_demo_listeners

  local occupied
  occupied="$(listener_pids "$PORT")"
  if [[ -n "$occupied" ]]; then
    die "port ${PORT} is occupied by non-Excalidraw pid(s): ${occupied//$'\n'/, }"
  fi

  mkdir -p "$STATE_DIR"
  : >"$LOG_FILE"
  (
    cd "$ROOT"
    exec yarn start --strictPort
  ) >"$LOG_FILE" 2>&1 &
  echo "$!" >"$PID_FILE"

  for _ in {1..120}; do
    if listener_pids "$PORT" | awk 'NF { found=1 } END { exit !found }'; then
      assert_server
      return 0
    fi
    if ! kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
      echo "server log:" >&2
      awk '{ print }' "$LOG_FILE" >&2
      die "Excalidraw dev server exited during startup"
    fi
    sleep 0.25
  done

  echo "server log:" >&2
  awk '{ print }' "$LOG_FILE" >&2
  die "timed out waiting for http://localhost:${PORT}"
}

case "${1:-}" in
  start) start_server ;;
  stop) stop_demo_listeners ;;
  assert | status) assert_server ;;
  *)
    echo "Usage: $0 {start|stop|assert|status}" >&2
    exit 2
    ;;
esac
