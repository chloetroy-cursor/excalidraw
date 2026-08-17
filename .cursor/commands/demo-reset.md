---
name: demo-reset
description: Reset the Excalidraw demo repo to a pristine baseline after a demo
---

Run the `demo-reset` skill end to end.

Survey git state first. Warn if master is ahead of origin (unpushed skill or feature commits would be lost). Run `./scripts/demo-reset.sh`, clean up Jira EC tickets, then verify with `./scripts/demo-server.sh verify` and `./scripts/demo-server.sh start`.
