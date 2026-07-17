---
name: demo-reset
description: Reset the Excalidraw demo repo to a pristine baseline after a demo. Use when the user says "reset the demo", "clean up after the demo", "tear down", or wants to return the repo to a clean master with no leftover demo branches, worktrees, or Jira artifacts.
---

# Demo Reset

Return this repo (and its demo Jira project) to the exact state a demo should start from: clean `master` matching `origin/master`, no extra branches, no extra worktrees, no uncommitted files.

## Steps

1. **Survey first.** Run `git status`, `git stash list`, `git worktree list`, and `git branch -a -vv`. If anything looks like unsaved real work (a stash or branch the user didn't create during the demo), list it and ask before destroying it.
2. **Run the reset script** from the repo root:

   ```bash
   ./scripts/demo-reset.sh            # local only
   ./scripts/demo-reset.sh --remote   # also delete demo branches on origin
   ```

   The script prints its plan and asks for confirmation. It hard-resets `master` to `origin/master`, cleans untracked files (keeping `node_modules` and `.env*`), removes extra worktrees, and deletes all non-master branches. It never touches stashes.
3. **Clean up Jira** (project `EC` on `chloe-fe-demo.atlassian.net`, cloudId `12ae6c59-1802-485b-8408-fa4fbb703d2c`): any issues created live during the demo should be transitioned back to "To Do" or noted for manual deletion. The standing demo tickets (EC-1 zigzag fill, EC-2 star fill, EC-3 star shape tool) stay in "To Do" — move them back if the demo transitioned them.
4. **Verify**: `git status` shows a clean tree on `master`, `git branch -a` shows only master, and `yarn start` still boots the app on http://localhost:3001.

## Rules

- Never run the script with `-y` unless the user explicitly asked for a non-interactive reset.
- Never drop stashes automatically; surface them and let the user decide.
- If `master` is ahead of `origin/master` (unpushed commits), stop and ask — the hard reset would discard them.
