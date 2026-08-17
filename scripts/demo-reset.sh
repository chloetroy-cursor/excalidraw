#!/usr/bin/env bash
set -euo pipefail

# Reset this repo to a pristine demo baseline (clean master, no leftover
# demo branches/worktrees), so back-to-back demos always start identical.

BASE_BRANCH="master"
REMOTE="origin"
DELETE_REMOTE=0
YES=0

usage() {
  cat <<'EOF'
Reset the repo to a pristine demo baseline.

Usage:
  demo-reset.sh [options]

What it does:
  1. Checks out master and hard-resets it to origin/master
  2. Removes untracked files (git clean), keeping node_modules and .env*
  3. Removes extra git worktrees
  4. Deletes every local branch except master
  5. With --remote, also deletes those branches on origin

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

git fetch --prune "$REMOTE"

LOCAL_BRANCHES="$(git for-each-ref --format='%(refname:short)' refs/heads/ | grep -vx "$BASE_BRANCH" || true)"
REMOTE_BRANCHES="$(git for-each-ref --format='%(refname:short)' "refs/remotes/${REMOTE}/" \
  | sed "s|^${REMOTE}/||" | grep -vx -e "$BASE_BRANCH" -e HEAD || true)"
EXTRA_WORKTREES="$(git worktree list --porcelain | awk '/^worktree /{print $2}' | tail -n +2)"

echo "== demo-reset plan =="
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

# Worktrees first: a branch checked out in a worktree can't be deleted.
if [[ -n "$EXTRA_WORKTREES" ]]; then
  while IFS= read -r wt; do
    git worktree remove --force "$wt"
  done <<<"$EXTRA_WORKTREES"
fi

git checkout "$BASE_BRANCH"
git reset --hard "${REMOTE}/${BASE_BRANCH}"
git clean -fd -e node_modules -e '.env*'

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
echo ""
echo "Next: ./scripts/demo-server.sh verify && ./scripts/demo-server.sh start"
echo "Demo URL: http://localhost:${VITE_APP_PORT:-3001}/"
