---
name: demo-reset
description: Reset the Excalidraw demo repo to a pristine baseline after a demo. Use when the user says "reset the demo", "clean up after the demo", "tear down", or wants to return the repo to a clean master with no leftover demo branches, worktrees, or Jira artifacts.
---

# Demo Reset

Return this repo (and its demo Jira project) to the exact state a demo should start from: application code reset to `origin/master`, no extra branches or worktrees, and no stale Excalidraw dev servers. The local demo skills and lifecycle scripts are protected infrastructure and survive reset even when they are not yet committed upstream.

## Steps

1. **Survey first.** Run `git status`, `git stash list`, `git worktree list`, and `git branch -a -vv`. If anything looks like unsaved real work (a stash or branch the user didn't create during the demo), list it and ask before destroying it.
2. **Classify changes.** Ticket implementation under `packages/` is disposable demo output. The protected paths declared in `scripts/demo-reset.sh` are demo infrastructure and must never be discarded. Anything else is potentially real work: list it and ask before continuing.
3. **Run the reset script** from the repo root:

   ```bash
   ./scripts/demo-reset.sh            # local only
   ./scripts/demo-reset.sh --remote   # also delete demo branches on origin
   ```

   The script prints its plan and asks for confirmation. It stops Excalidraw UI listeners on ports 3001/3002, archives the protected demo infrastructure outside the repo, hard-resets `master` to `origin/master`, cleans untracked files (keeping `node_modules` and `.env*`), removes extra worktrees/branches, then restores the protected files. It never touches stashes.
4. **Clean up Jira** (project `EC` on `chloe-fe-demo.atlassian.net`, cloudId `12ae6c59-1802-485b-8408-fa4fbb703d2c`): any issues created live during the demo should be transitioned back to "To Do" or noted for manual deletion. The standing demo tickets (EC-1 zigzag fill, EC-2 star fill, EC-3 star shape tool) stay in "To Do" — move them back if the demo transitioned them.
5. **Verify**: application paths are clean on `master`; `master` matches `origin/master`; only protected demo-infrastructure changes may remain; there are no extra local branches; `git worktree list` shows only the root checkout; and `scripts/demo-server.sh stop` leaves no Excalidraw Vite listener on 3001 or 3002. Existing remote branches are not a local-reset failure. Do not restart the app during reset—`demo-prep` owns startup.

## Rules

- Never run the script with `-y` unless the user explicitly asked for a non-interactive reset.
- Never drop stashes automatically; surface them and let the user decide.
- If `master` is ahead of `origin/master` (unpushed commits), stop and ask — the hard reset would discard them.
- Never use a blanket cleanup command that bypasses the script's protected-path archive.
- Never call bare `yarn start` during teardown.
