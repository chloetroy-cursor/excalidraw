---
name: demo-prep
description: Pre-flight check before running a Cursor demo in the Excalidraw repo. Use when the user says "prep the demo", "pre-flight", "am I ready to demo", or before a customer call that uses this repo.
---

# Demo Prep

Verify the repo is in a demo-ready state before a customer call. Everything here is read-only except starting the dev server.

## Checklist

1. **Repo state**: `git status` is clean, current branch is `master`, and `master` matches `origin/master` (`git fetch && git status`). If not, run the `demo-reset` skill first.
2. **No leftovers**: `git branch -a` shows only `master`; `git worktree list` shows only this checkout; `git stash list` is empty (or contains only known stashes the user wants).
3. **App boots**: start `yarn start` from the root checkout in the background and confirm the Vite server serves on http://localhost:3001. Record that checkout's branch so parallel subagents cannot silently switch the branch behind the live app. The core whiteboard needs no backend (see `AGENTS.md`).
4. **Typecheck passes**: `yarn test:typecheck` exits clean. (Skip the full test suite unless asked — `AGENTS.md` documents known flaky/lint gotchas that are not demo blockers.)
5. **Jira ready**: demo project `EC` ("Excalidraw Canvas") on `chloe-fe-demo.atlassian.net` (cloudId `12ae6c59-1802-485b-8408-fa4fbb703d2c`) has the standing tickets in "To Do" — EC-1 (zigzag fill style), EC-2 (star fill style), and EC-3 (star shape tool). Create fresh EC tickets if the planned demo scenario needs them.
6. **Parallel-demo guard**: when EC-1 will be used, require its implementation to expose a standalone `fill-zigzag` control, include a focused test that clicks it without Alt/Option, and be merged into the checkout serving port 3001 before reporting Zigzag as visible.
7. **Report**: give the user a short ready/not-ready summary with anything that needs attention.

## Demo inventory (what exists to demo with)

- `.cursor/README.md` — full audit of rules, skills, commands, subagents, hooks, and when to use each.
- `demos/CHEATSHEET.md` — the demoer's script: copy-paste prompts per mode (Ask/Plan/Build/Debug/Multi-task/Parallel), talk tracks, and story arcs. Point the user here if they ask "what do I type".

**Rules** (`.cursor/rules/`):
- `monorepo-workflow` — always-on package boundaries and gotchas
- `element-geometry` — render/hit-test sync when editing `packages/element`
- `localization-en-only` — only edit `en.json`
- `testing-conventions` — Vitest helpers and snapshot discipline

**Skills** (`.cursor/skills/`):
- `adding-excalidraw-shape` — full recipe for shape tool demos (star/hexagon/triangle)
- `adding-excalidraw-action` — properties panel / keyboard action wiring
- `verify-excalidraw-change` — post-change typecheck + focused tests
- `commit-writer` — conventional commits with EC ticket IDs
- `demo-reset` + `scripts/demo-reset.sh` — post-demo teardown
- `seed-demo-bug` — plant a curated bug for Debug mode demos
- `parallel-agents-demo` — multi-agent ticket work with review/merge finale

**Commands** (`.cursor/commands/`): `/prep-demo`, `/verify-change`

**Subagents** (`.cursor/agents/`): `geometry-auditor`, `snapshot-reviewer`

**Hooks** (`.cursor/hooks.json`): blocks `git push` when seeded demo bug fingerprints are detected

- `scripts/br.sh` — ticket-based branch creation (`./scripts/br.sh ec-12 add star shape`)
- Jira project `EC` — real tickets to drive Agent-mode and parallel-agent demos
