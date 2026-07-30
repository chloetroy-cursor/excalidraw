---
name: verify-change
description: Run verification commands after Excalidraw editor changes
---

Run the `verify-excalidraw-change` skill.

Inspect `git diff --stat` to determine which files changed, then run typecheck, focused tests for the touched areas, and snapshot review if applicable. Report results in the skill's report format.

Do not run the full test suite unless the user explicitly asks.
