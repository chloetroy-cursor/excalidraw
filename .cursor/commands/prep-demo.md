---
name: prep-demo
description: Pre-flight check before a Cursor demo in the Excalidraw repo
---

Run the `demo-prep` skill end to end.

Verify: clean application code on `master`, no leftover branches/worktrees, exactly one Excalidraw UI server starts through `scripts/demo-server.sh` on http://localhost:3001 (never 3002), typecheck passes, and EC standing tickets (EC-1, EC-2, EC-3) are ready in Jira project `EC`.

Report ready/not-ready with anything that needs attention. Point the user to `demos/CHEATSHEET.md` for copy-paste demo prompts.
