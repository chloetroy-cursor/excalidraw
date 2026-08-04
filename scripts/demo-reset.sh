#!/usr/bin/env bash
set -euo pipefail

# Reset this repo to a pristine demo baseline (clean master, no leftover
# demo branches/worktrees), so back-to-back demos always start identical.

BASE_BRANCH="master"
REMOTE="origin"
DELETE_REMOTE=0
YES=0
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
PRESERVE_PATHS=(
  ".cursor/skills/demo-prep"
  ".cursor/skills/demo-reset"
  ".cursor/skills/demo-build"
  ".cursor/skills/jira-demo-tickets"
  ".cursor/skills/parallel-agents-demo"
  ".cursor/commands/prep-demo.md"
  ".cursor/README.md"
  "demos/CHEATSHEET.md"
  "scripts/demo-reset.sh"
  "scripts/demo-server.sh"
)

usage() {
  cat <<'EOF'
Reset the repo to a pristine demo baseline.

Usage:
  demo-reset.sh [options]

What it does:
  1. Stops Excalidraw UI servers on ports 3001/3002
  2. Preserves the local demo skills and lifecycle scripts
  3. Checks out master and hard-resets it to origin/master
  4. Removes untracked files (git clean), keeping node_modules and .env*
  5. Removes extra git worktrees and non-master branches
  6. Restores the preserved demo infrastructure
  7. With --remote, also deletes demo branches on origin

Options:
  --remote     Also delete non-master branches on the remote
  -y, --yes    Skip the confirmation prompt
  -h, --help   Show this help

Stashes are never touched. Review them separately with `git stash list`.
EOF
}

die() {
  echo "error: $*" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --remote) DELETE_REMOTE=1; shift ;;
    -y | --yes) YES=1; shift ;;
    -h | --help) usage; exit 0 ;;
    *) die "unknown option: $1" ;;
  esac
done

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "not inside a git repository"
cd "$(git rev-parse --show-toplevel)"
ROOT="$PWD"

git fetch --prune "$REMOTE"

LOCAL_BRANCHES="$(git for-each-ref --format='%(refname:short)' refs/heads/ | grep -vx "$BASE_BRANCH" || true)"
REMOTE_BRANCHES="$(git for-each-ref --format='%(refname:short)' "refs/remotes/${REMOTE}/" \
  | sed "s|^${REMOTE}/||" | grep -vx -e "$BASE_BRANCH" -e HEAD || true)"
EXTRA_WORKTREES="$(git worktree list --porcelain | awk '/^worktree /{print $2}' | tail -n +2)"

echo "== demo-reset plan =="
echo "stop Excalidraw dev UI servers on ports 3001 and 3002"
echo "preserve local demo skills and lifecycle scripts"
echo "reset ${BASE_BRANCH} to ${REMOTE}/${BASE_BRANCH} and clean untracked files"
[[ -n "$EXTRA_WORKTREES" ]] && printf 'remove worktree: %s\n' $EXTRA_WORKTREES
[[ -n "$LOCAL_BRANCHES" ]] && printf 'delete local branch: %s\n' $LOCAL_BRANCHES
if [[ "$DELETE_REMOTE" -eq 1 && -n "$REMOTE_BRANCHES" ]]; then
  printf "delete remote branch: ${REMOTE}/%s\n" $REMOTE_BRANCHES
fi
if git stash list | grep -q .; then
  echo "note: stashes exist and will NOT be touched (git stash list)"
fi

if [[ "$YES" -ne 1 ]]; then
  read -r -p "Proceed? [y/N] " answer
  [[ "$answer" =~ ^[Yy]$ ]] || die "aborted"
fi

"$ROOT/scripts/demo-server.sh" stop

PRESERVE_ARCHIVE="$(mktemp "${TMPDIR:-/tmp}/excalidraw-demo-kit.XXXXXX")"
cleanup_archive() {
  rm -f "$PRESERVE_ARCHIVE"
}
trap cleanup_archive EXIT

EXISTING_PRESERVE_PATHS=()
for path in "${PRESERVE_PATHS[@]}"; do
  [[ -e "$path" ]] && EXISTING_PRESERVE_PATHS+=("$path")
done
if [[ "${#EXISTING_PRESERVE_PATHS[@]}" -gt 0 ]]; then
  tar -cf "$PRESERVE_ARCHIVE" "${EXISTING_PRESERVE_PATHS[@]}"
fi

# Worktrees first: a branch checked out in a worktree can't be deleted.
if [[ -n "$EXTRA_WORKTREES" ]]; then
  while IFS= read -r wt; do
    git worktree remove --force "$wt"
  done <<<"$EXTRA_WORKTREES"
fi

git checkout "$BASE_BRANCH"
git reset --hard "${REMOTE}/${BASE_BRANCH}"
git clean -fd -e node_modules -e '.env*'
if [[ -s "$PRESERVE_ARCHIVE" ]]; then
  tar -xf "$PRESERVE_ARCHIVE"
fi

if [[ -n "$LOCAL_BRANCHES" ]]; then
  while IFS= read -r br; do
    git branch -D "$br"
  done <<<"$LOCAL_BRANCHES"
fi

if [[ "$DELETE_REMOTE" -eq 1 && -n "$REMOTE_BRANCHES" ]]; then
  while IFS= read -r br; do
    git push "$REMOTE" --delete "$br"
  done <<<"$REMOTE_BRANCHES"
  git fetch --prune "$REMOTE"
fi

echo "== demo-reset complete =="
git status --short --branch
echo "Excalidraw dev UI servers are stopped; run scripts/demo-server.sh start during prep."
