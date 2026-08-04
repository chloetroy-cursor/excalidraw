---
name: jira-demo-tickets
description: Fetches the EC Jira tickets used by the Excalidraw demo through Atlassian MCP. Use during demo prep or when the user asks to pull EC-1, EC-2, EC-3, or the Jira demo backlog.
---

# Jira Demo Tickets

Use Atlassian MCP; never substitute remembered ticket text for a live read.

## Workflow

1. Resolve the Jira site with `getAccessibleAtlassianResources`.
2. Use cloud ID `12ae6c59-1802-485b-8408-fa4fbb703d2c` for `chloe-fe-demo.atlassian.net`.
3. Fetch requested issues with `getJiraIssue`. For the standard demo, fetch:
   - EC-1 — Zigzag fill style
   - EC-2 — Star fill style
   - EC-3 — Star shape tool
4. Report each ticket's linked key, summary, description, assignee, and status.
5. Treat the live Jira description as the source of truth. Pass it into `demo-build`.
6. Reads need no confirmation. Never transition, comment on, or edit a ticket without explicit user approval.

If Atlassian authentication is unavailable, stop and report that the Jira portion of the demo is not ready.
