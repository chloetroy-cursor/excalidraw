---
name: commit-writer
description: Write conventional commit messages and commit staged work. Use this skill whenever the user asks to commit, save work, write a commit message, or says things like "commit this", "ship it", or "check in my changes." Also use it when finishing a task that ends with a commit.
---

# Commit Writer

Write clean, consistent commit messages for this repo, then commit (and push if asked).

## Message format

```
<type>(<scope>): <summary> (<TICKET>)
```

- **type** — one of: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`
- **scope** — the area of the codebase touched, e.g. `editor`, `toolbar`, `geometry`, `tests`
- **summary** — imperative mood, lowercase, no trailing period, under 60 characters ("add star shape tool", not "Added star shape tool.")
- **TICKET** — the Jira ticket ID in caps from the `EC` project ("Excalidraw Canvas" on chloe-fe-demo.atlassian.net), e.g. `EC-12`

Example: `feat(editor): add star shape tool and element type (EC-12)`

## Steps

1. Run `git status` and `git diff --stat` to see what changed.
2. Determine the ticket ID from the current branch name (branches look like
   `feat/ec-12-add-star-shape-07/06/2026` → ticket is `EC-12`). If no ticket
   is present in the branch name, look it up in the `EC` Jira project via the
   Atlassian MCP (cloudId `12ae6c59-1802-485b-8408-fa4fbb703d2c`), or ask the
   user for one.
3. Pick the `type` from the dominant kind of change; pick the `scope` from the
   directory or feature most files belong to.
4. If the change set spans unrelated concerns (e.g. a feature plus an
   untouched-area bug fix), propose splitting into two commits and ask before
   proceeding.
5. Stage the relevant files, show the user the proposed commit message, and
   commit after they confirm.
6. If more than ~10 files changed, add a short body (1–3 bullet lines) below
   the subject summarizing the areas touched.
7. Only push if the user explicitly asks.

## Rules

- Never commit directly to `master` (repo/tooling housekeeping is the only exception, and only when the user explicitly asks).
- Never use `git add -A` blindly — list what's being staged.
- Never include `WIP`, emoji, or vague summaries like "updates" or "fixes".
