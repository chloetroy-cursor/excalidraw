#!/usr/bin/env bash
set -euo pipefail

BASE_BRANCH="master"
TYPE="feat"
REMOTE="origin"
FETCH=1
FORCE=0
DATE_SUFFIX="$(date +%m/%d/%Y)"

usage() {
  cat <<'EOF'
Create a new branch off an up-to-date master.

Usage:
  br <ticket> <slug words>                 feat/ec-11-add-star-shape-07/06/2026
  br <type> <ticket> <slug words>          fix/ec-3-crash-on-export-07/06/2026
  br <type>/<ticket>-<slug>                feat/ec-11-add-star-shape-07/06/2026

Arguments:
  ticket    Ticket id (ec-11) or number (11 -> ec-11)
  slug      Short description (words are joined with hyphens)

Options:
  --type <prefix>   Branch prefix when using ticket + slug (default: feat)
  --base <branch>   Base branch to branch from (default: master)
  --remote <name>   Remote to fetch (default: origin)
  --no-fetch        Skip git fetch before updating the base branch
  --force           Create the branch even with uncommitted changes
  -h, --help        Show this help

Examples:
  br ec-11 add star shape
  br fix ec-3 crash on export
  br feat/ec-11-add-star-shape
EOF
}

die() {
  echo "error: $*" >&2
  exit 1
}

slugify() {
  echo "$*" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g'
}

normalize_ticket() {
  local ticket="$1"
  if [[ "$ticket" =~ ^[Ee][Cc]-[0-9]+$ ]]; then
    echo "$ticket" | tr '[:upper:]' '[:lower:]'
    return
  fi
  if [[ "$ticket" =~ ^[0-9]+$ ]]; then
    echo "ec-${ticket}"
    return
  fi
  die "ticket must look like ec-11 or 11 (got: $ticket)"
}

looks_like_ticket() {
  [[ "$1" =~ ^[Ee][Cc]-[0-9]+$ || "$1" =~ ^[0-9]+$ ]]
}

append_date_suffix() {
  local branch_name="$1"
  if [[ "$branch_name" == *"$DATE_SUFFIX" ]]; then
    echo "$branch_name"
  else
    echo "${branch_name}-${DATE_SUFFIX}"
  fi
}

build_branch_name() {
  local prefix="$1"
  local ticket="$2"
  shift 2
  local slug
  slug="$(slugify "$*")"
  [[ -n "$slug" ]] || die "slug cannot be empty"
  append_date_suffix "${prefix}/$(normalize_ticket "$ticket")-${slug}"
}

parse_full_branch() {
  local value="$1"
  if [[ ! "$value" =~ ^([a-z][a-z0-9-]*)\/(ec-[0-9]+)-(.+)$ ]]; then
    die "branch must look like feat/ec-11-add-star-shape (got: $value)"
  fi
  append_date_suffix "$value"
}

require_clean_or_force() {
  if [[ "$FORCE" -eq 1 ]]; then
    return
  fi
  if [[ -n "$(git status --porcelain)" ]]; then
    die "working tree has uncommitted changes; commit, stash, or pass --force"
  fi
}

update_base_branch() {
  if [[ "$FETCH" -eq 1 ]]; then
    git fetch "$REMOTE" "$BASE_BRANCH"
  fi

  if git show-ref --verify --quiet "refs/heads/${BASE_BRANCH}"; then
    git checkout "$BASE_BRANCH"
    if [[ "$FETCH" -eq 1 ]]; then
      git merge --ff-only "${REMOTE}/${BASE_BRANCH}"
    fi
  elif [[ "$FETCH" -eq 1 ]] && git show-ref --verify --quiet "refs/remotes/${REMOTE}/${BASE_BRANCH}"; then
    git checkout -b "$BASE_BRANCH" "${REMOTE}/${BASE_BRANCH}"
  else
    die "base branch ${BASE_BRANCH} not found locally or on ${REMOTE}"
  fi
}

ARGS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --type)
      [[ $# -ge 2 ]] || die "--type requires a value"
      TYPE="$2"
      shift 2
      ;;
    --base)
      [[ $# -ge 2 ]] || die "--base requires a value"
      BASE_BRANCH="$2"
      shift 2
      ;;
    --remote)
      [[ $# -ge 2 ]] || die "--remote requires a value"
      REMOTE="$2"
      shift 2
      ;;
    --no-fetch)
      FETCH=0
      shift
      ;;
    --force)
      FORCE=1
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    --)
      shift
      ARGS+=("$@")
      break
      ;;
    -*)
      die "unknown option: $1"
      ;;
    *)
      ARGS+=("$1")
      shift
      ;;
  esac
done

[[ ${#ARGS[@]} -gt 0 ]] || {
  usage
  exit 1
}

BRANCH_NAME=""
if [[ ${#ARGS[@]} -eq 1 ]]; then
  BRANCH_NAME="$(parse_full_branch "${ARGS[0]}")"
elif looks_like_ticket "${ARGS[0]}"; then
  BRANCH_NAME="$(build_branch_name "$TYPE" "${ARGS[@]}")"
elif [[ ${#ARGS[@]} -ge 3 ]]; then
  BRANCH_NAME="$(build_branch_name "${ARGS[@]}")"
else
  die "expected a ticket and slug, or type, ticket, and slug"
fi

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "not inside a git repository"
require_clean_or_force
update_base_branch

if git show-ref --verify --quiet "refs/heads/${BRANCH_NAME}"; then
  die "branch already exists: ${BRANCH_NAME}"
fi

git checkout -b "$BRANCH_NAME"
echo "created ${BRANCH_NAME} from ${BASE_BRANCH}"
