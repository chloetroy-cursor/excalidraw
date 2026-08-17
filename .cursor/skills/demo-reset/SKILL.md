---
name: demo-reset
description: Reset the Excalidraw demo repo to a pristine baseline after a demo. Use when the user says "reset the demo", "clean up after the demo", "tear down", or wants to return the repo to a clean master with no leftover demo branches, worktrees, or Jira artifacts.
---

# Demo Reset

Return this repo (and its demo Jira project) to the exact state a demo should **start** from: clean `master` matching **`origin/master`**, no extra branches, no extra worktrees, no uncommitted files.

## Important: what reset preserves vs destroys

- **Preserves** everything already on `origin/master` (including merged EC-1/EC-2 code, skill updates, and `scripts/demo-server.sh` — **if you pushed them first**).
- **Destroys** uncommitted changes, untracked files, local feature branches, and any commits on `master` not pushed to `origin/master`.
- **Does not touch** stashes — surface them and let the user decide.

If the user needs skill or script changes to survive reset, those commits **must be on `origin/master` before running reset**. See "Persisting skill updates" below.

## Steps

1. **Survey first.** Run `git status`, `git stash list`, `git worktree list`, and `git branch -a -vv`. If anything looks like unsaved real work (a stash or branch the user didn't create during the demo), list it and ask before destroying it.

2. **Guard unpushed master.** If `master` is ahead of `origin/master`, **stop and ask** — hard reset would discard unpushed commits (including skill updates the user intended to keep).

3. **Run the reset script** from the repo root:

   ```bash
   ./scripts/demo-reset.sh            # local only
   ./scripts/demo-reset.sh --remote   # also delete demo branches on origin
   ```

   The script prints its plan and asks for confirmation. It hard-resets `master` to `origin/master`, cleans untracked files (keeping `node_modules` and `.env*`), removes extra worktrees, and deletes all non-master branches. It never touches stashes.

4. **Clean up Jira** (project `EC` on `chloe-fe-demo.atlassian.net`, cloudId `12ae6c59-1802-485b-8408-fa4fbb703d2c`): transition live-demo issues back to "To Do" or note for manual deletion. Standing tickets EC-1 (zigzag fill), EC-2 (star fill), EC-3 (star shape tool) stay in **To Do** for mode-A live-build demos — move them back if the demo transitioned them.

5. **Verify post-reset**
   ```bash
   ./scripts/demo-server.sh verify
   ./scripts/demo-server.sh start
   ```
   Confirm http://localhost:3001 loads. For mode-A baseline, fill-zigzag / fill-star should **not** be present unless those features were merged to `origin/master`.

6. **Report**: clean tree on master, branch list, verify result, server URL.

## Persisting skill updates (read this before first reset after editing skills)

`demo-reset` hard-resets to **`origin/master`**, not your local commits. To keep skill/script changes:

```bash
git checkout master
git add .cursor/README.md .cursor/skills/demo-prep/ .cursor/skills/demo-reset/ .cursor/commands/ scripts/demo-server.sh scripts/demo-reset.sh package.json .gitignore
git commit -m "chore(demo): gate demo server on typecheck"
git push origin master
```

Only after push will `demo-reset` retain those files. Same applies to EC-1/EC-2 showcase code: merge to `master` and push before reset if the next demo should start with those features already built.

## Rules

- Never run the script with `-y` unless the user explicitly asked for a non-interactive reset.
- Never drop stashes automatically; surface them and let the user decide.
- Never run reset to "fix" a broken dev server mid-demo — run `demo-server.sh verify`, fix types, then `demo-server.sh start` instead.
