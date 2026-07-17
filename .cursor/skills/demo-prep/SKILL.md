---
name: demo-prep
description: Pre-flight check before running a Cursor demo in the Excalidraw repo. Use when the user says "prep the demo", "pre-flight", "am I ready to demo", or before a customer call that uses this repo.
---

# Demo Prep

Verify the repo is in a demo-ready state before a customer call. Everything here is read-only except starting the dev server.

## Checklist

1. **Repo state**: `git status` is clean, current branch is `master`, and `master` matches `origin/master` (`git fetch && git status`). If not, run the `demo-reset` skill first.
2. **No leftovers**: `git branch -a` shows only `master`; `git worktree list` shows only this checkout; `git stash list` is empty (or contains only known stashes the user wants).
3. **App boots**: start `yarn start` in the background and confirm the Vite server serves on http://localhost:3001. The core whiteboard needs no backend (see `AGENTS.md`).
4. **Typecheck passes**: `yarn test:typecheck` exits clean. (Skip the full test suite unless asked — `AGENTS.md` documents known flaky/lint gotchas that are not demo blockers.)
5. **Jira ready**: demo project `EC` ("Excalidraw Canvas") on `chloe-fe-demo.atlassian.net` (cloudId `12ae6c59-1802-485b-8408-fa4fbb703d2c`) has the standing tickets in "To Do" — EC-1 (zigzag fill style) and EC-2 (star fill style). Create fresh EC tickets if the planned demo scenario needs them.
6. **Report**: give the user a short ready/not-ready summary with anything that needs attention.

## Demo inventory (what exists to demo with)

- `adding-excalidraw-shape` skill — full recipe for the "agent builds a feature" demo (star/hexagon/triangle shape tool).
- `commit-writer` skill — conventional commits with EC ticket IDs.
- `scripts/br.sh` — ticket-based branch creation (`./scripts/br.sh ec-12 add star shape`).
- `scripts/demo-reset.sh` + `demo-reset` skill — post-demo teardown.
- Jira project `EC` — real tickets to drive Agent-mode and parallel-agent demos.
