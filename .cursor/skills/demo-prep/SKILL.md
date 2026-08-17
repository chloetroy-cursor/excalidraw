---
name: demo-prep
description: Pre-flight check before running a Cursor demo in the Excalidraw repo. Use when the user says "prep the demo", "pre-flight", "am I ready to demo", or before a customer call that uses this repo.
---

# Demo Prep

Verify the repo is demo-ready before a customer call. Use `./scripts/demo-server.sh` for all verification and server startup — **never run bare `yarn start` without passing verify first**.

## Demo modes (pick one)

### A — Live-build demo (implement EC tickets during the call)

- Clean `master` matching `origin/master`, no feature branches.
- EC-1 / EC-2 / EC-3 in Jira **To Do** (not Done).
- Baseline master does **not** include fill-zigzag / fill-star yet — you build them live.

### B — Showcase demo (show pre-built EC-1 / EC-2 fill styles)

- EC-1 and EC-2 implementation is **merged on `master` and pushed to `origin/master`**.
- `packages/element/src/starFill.ts` exists (or `FillStyle` includes `"star"`).
- `./scripts/demo-server.sh verify --showcase` passes (typecheck + fill-style tests).
- After start, manually confirm **Zigzag** and **Star** buttons on a filled rectangle at http://localhost:3001.

If the user hasn't said which mode, **default to A**. Use B only when star fill is actually present in the current checkout — mentioning zigzag/star in the talk track is not enough. `--showcase` on a live-build baseline fails because those tests do not exist yet.

## Checklist (run in order)

1. **Survey repo state**
   - `git fetch && git status`
   - `git branch -a -vv`, `git worktree list`, `git stash list`
   - Record current branch — parallel agents must not switch the checkout serving the live app.

2. **Repo cleanliness (mode A only)**
   - Clean tree on `master`, matching `origin/master`.
   - Only `master` branch, no extra worktrees.
   - If dirty or on a feature branch from a prior demo → run `demo-reset` first (after confirming nothing precious will be lost).

3. **Verify before start (both modes — mandatory)**
   ```bash
   # Mode A — live-build demo (typecheck only):
   ./scripts/demo-server.sh verify

   # Mode B — showcase pre-built EC-1/EC-2 fills:
   ./scripts/demo-server.sh verify --showcase
   ```
   Runs `yarn test:typecheck` first. Mode B also runs fill-zigzag / fill-star click tests. **Stop here if either fails** — do not start the server. TypeScript errors make `vite-plugin-checker` show a full-screen overlay that looks like a crash.

4. **Start demo server (both modes)**
   ```bash
   ./scripts/demo-server.sh start          # mode A
   ./scripts/demo-server.sh start --showcase   # mode B
   ```
   - Confirms http://localhost:3001 (or `VITE_APP_PORT`) — **never port 1001**.
   - If port already in use, script reuses it; confirm URL in terminal output.
   - Do not accept Vite falling back to another port silently — fix the conflict first.

5. **Feature smoke (mode B — EC-1 / EC-2)**
   - Draw a rectangle with a non-transparent fill.
   - Select it; confirm `fill-zigzag` and `fill-star` buttons exist in the properties panel.
   - Click each **without** Alt/Option; confirm fill renders (not hachure fallback for star).
   - Hard-refresh if the panel looks stale.

6. **Jira ready**
   - Project `EC` on `chloe-fe-demo.atlassian.net` (cloudId `12ae6c59-1802-485b-8408-fa4fbb703d2c`).
   - Mode A: EC-1, EC-2, EC-3 in **To Do**.
   - Mode B: tickets may be Done/In Review — note status in report.

7. **Report**
   - Ready / not-ready summary.
   - Demo mode (A or B), branch, URL, verify result, smoke result.
   - Point to `demos/CHEATSHEET.md` for copy-paste prompts.

## What blocks a demo (hard stops)

| Symptom | Cause | Fix |
|---------|-------|-----|
| Full-screen TS overlay | `yarn test:typecheck` would fail | Fix types; re-run `demo-server.sh verify` |
| Blank / broken UI after agent work | Serving wrong branch or unverified code | Checkout integrated branch; verify + restart |
| Feature missing in panel | Mode B code not on branch serving :3001 | Merge to master or checkout feature branch |
| Wrong port | Typo (3001 vs 1001) or port conflict | Use URL from `demo-server.sh start` output |

## Demo inventory

- `demos/CHEATSHEET.md` — demo script and prompts
- `.cursor/README.md` — rules, skills, commands, subagents
- `./scripts/demo-server.sh` — verify + gated start (use this, not raw `yarn start`)
- `./scripts/demo-reset.sh` — post-demo teardown back to `origin/master`
- Skills: `verify-excalidraw-change`, `demo-reset`, `parallel-agents-demo`, `adding-excalidraw-action`

## Rules

- **Typecheck before start, always.** No exceptions for customer demos.
- After any agent session touching `packages/element` or `FillStyle`, re-run verify before claiming ready.
- Do not report a feature as visible until it passes verify on the checkout serving port 3001.
