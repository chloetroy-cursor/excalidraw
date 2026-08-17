---
name: prep-demo
description: Pre-flight check before a Cursor demo in the Excalidraw repo
---

Run the `demo-prep` skill end to end.

Use `./scripts/demo-server.sh verify` then `./scripts/demo-server.sh start`. Never bare `yarn start`. Default is live-build (mode A). Use `--showcase` only when star fill is already on the current checkout.

Determine demo mode (A = live-build from tickets, B = showcase pre-built EC-1/EC-2 fills). Report ready/not-ready with branch, URL http://localhost:3001, verify result, and feature smoke (mode B).

Point the user to `demos/CHEATSHEET.md` for copy-paste demo prompts.
