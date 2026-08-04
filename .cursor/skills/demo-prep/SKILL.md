---
name: demo-prep
description: Pre-flight check before running a Cursor demo in the Excalidraw repo. Use when the user says "prep the demo", "pre-flight", "am I ready to demo", or before a customer call that uses this repo.
---

# Demo Prep

Verify the repo is in a deterministic demo-ready state before a customer call. This skill owns the Excalidraw dev-server lifecycle; do not start a second server manually.

## Checklist

1. **Repo state**: current branch is `master`, and `master` matches `origin/master` (`git fetch && git status`). Application code must be clean. Local changes are allowed only in the protected demo infrastructure listed by `scripts/demo-reset.sh`; those files intentionally survive reset. If any other path is modified, run the `demo-reset` skill first.
2. **No leftovers**: there are no extra **local** branches; `git worktree list` shows only this checkout; `git stash list` is empty (or contains only known stashes the user wants). Existing remote branches do not block a local demo unless they are part of the planned scenario.
3. **Single app server**: run `scripts/demo-server.sh start`, then `scripts/demo-server.sh assert`. This stops stale Excalidraw Vite listeners on 3001/3002, starts from this root checkout with Vite `strictPort`, and fails instead of silently falling back. The UI must be on **http://localhost:3001**; port 3002 is reserved for the optional collaboration server and must never host the demo UI. Do not use bare `yarn start` for demos.
4. **Typecheck passes**: `yarn test:typecheck` exits clean. (Skip the full test suite unless asked — `AGENTS.md` documents known flaky/lint gotchas that are not demo blockers.)
5. **Jira ready**: demo project `EC` ("Excalidraw Canvas") on `chloe-fe-demo.atlassian.net` (cloudId `12ae6c59-1802-485b-8408-fa4fbb703d2c`) has the standing tickets in "To Do" — EC-1 (zigzag fill style), EC-2 (star fill style), and EC-3 (star shape tool). Create fresh EC tickets if the planned demo scenario needs them.
6. **Build-demo guard**: when building EC-1, EC-2, or EC-3, load the `demo-build` skill. Record `git rev-parse --show-toplevel`, the current branch, and `git rev-parse HEAD` before the build. The final implementation must be integrated into this same checkout before restarting the server. A feature built only in another worktree/branch is not visible on port 3001.
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
- `demo-build` + `scripts/demo-server.sh` — ticket implementation and live-app acceptance gate
- `seed-demo-bug` — plant a curated bug for Debug mode demos
- `parallel-agents-demo` — multi-agent ticket work with review/merge finale

**Commands** (`.cursor/commands/`): `/prep-demo`, `/verify-change`

**Subagents** (`.cursor/agents/`): `geometry-auditor`, `snapshot-reviewer`

**Hooks** (`.cursor/hooks.json`): blocks `git push` when seeded demo bug fingerprints are detected

- `scripts/br.sh` — ticket-based branch creation (`./scripts/br.sh ec-12 add star shape`)
- Jira project `EC` — real tickets to drive Agent-mode and parallel-agent demos
