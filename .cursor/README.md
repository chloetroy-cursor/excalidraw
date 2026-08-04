# Excalidraw Cursor Demo Kit

This folder encodes **team knowledge** for Cursor demos in the Excalidraw monorepo. Use it to show how rules, skills, commands, subagents, and hooks turn one-off agent behavior into repeatable process.

## Inventory

| Surface | Location | Count | Purpose |
|---------|----------|-------|---------|
| **Rules** | `.cursor/rules/*.mdc` | 4 | Always-on or file-scoped guardrails |
| **Skills** | `.cursor/skills/*/SKILL.md` | 10 | Reusable workflows the agent auto-invokes |
| **Commands** | `.cursor/commands/*.md` | 2 | Explicit slash-invoked shortcuts (legacy-friendly) |
| **Subagents** | `.cursor/agents/*.md` | 2 | Named specialists for delegation |
| **Hooks** | `.cursor/hooks.json` + `.cursor/hooks/` | 1 | Deterministic guardrails around shell commands |
| **Demo script** | `demos/CHEATSHEET.md` | 1 | Copy-paste prompts per Cursor mode |

Also see repo-level docs: `AGENTS.md` (cloud/runtime), `CLAUDE.md` (structure), `.github/copilot-instructions.md` (coding style — not Cursor-native).

## When to use each surface

```
User types a prompt
       │
       ▼
┌──────────────┐     file open / alwaysApply
│    Rules     │ ◄── monorepo, geometry, i18n, tests
└──────────────┘
       │
       ▼
┌──────────────┐     description match / explicit invoke
│    Skills    │ ◄── shape, action, verify, demo ops
└──────────────┘
       │
       ▼
┌──────────────┐     user types /prep-demo or /verify-change
│   Commands   │ ◄── thin wrappers over skills (demo UX)
└──────────────┘
       │
       ▼
┌──────────────┐     "use the geometry-auditor subagent"
│  Subagents   │ ◄── read-only specialists
└──────────────┘
       │
       ▼
┌──────────────┐     beforeShellExecution on git push
│    Hooks     │ ◄── block pushing seeded demo bugs
└──────────────┘
```

| Surface | Use when | Demo moment |
|---------|----------|-------------|
| **Rule** | Convention should apply automatically | Open `bounds.ts` → geometry rule appears |
| **Skill** | Multi-step workflow with repo-specific knowledge | "Add star shape" → `adding-excalidraw-shape` fires |
| **Command** | Demoer wants a clickable slash shortcut | Type `/prep-demo` before a call |
| **Subagent** | Task needs focused read-only analysis | After shape PR: "run geometry-auditor" |
| **Hook** | Deterministic policy enforcement | Agent tries `git push` with seeded bug → denied |

**Commands vs skills:** Cursor recommends skills for reusable workflows. Commands remain supported and are kept here as deliberate examples of explicit invocation (`disable-model-invocation: true` on command-backed skills).

## Rules

| Rule | Scope | What it enforces |
|------|-------|------------------|
| `monorepo-workflow.mdc` | alwaysApply | Package boundaries, canonical yarn scripts, known gotchas |
| `element-geometry.mdc` | `packages/element/**`, `packages/utils/**` | Render vertices must match hit-test helpers |
| `localization-en-only.mdc` | `packages/excalidraw/locales/**` | Only edit `en.json`; Crowdin owns other locales |
| `testing-conventions.mdc` | `**/*.{test,spec}.{ts,tsx}` | Test helpers, focused runs, deliberate snapshot updates |

## Skills

| Skill | Trigger phrases | Role |
|-------|-----------------|------|
| `adding-excalidraw-shape` | add shape, star tool, hexagon | Full shape architecture checklist |
| `adding-excalidraw-action` | add action, keyboard shortcut, menu item | Action registration + UI wiring |
| `verify-excalidraw-change` | verify, typecheck, run tests | Post-change verification gate |
| `commit-writer` | commit, ship it | Conventional commits with EC ticket IDs |
| `demo-prep` | prep the demo, pre-flight | Pre-call checklist |
| `demo-reset` | reset the demo, tear down | Post-demo cleanup |
| `demo-build` | EC-1/2/3, Build demo | Ticket-to-visible-app acceptance gate |
| `jira-demo-tickets` | EC tickets, Jira demo backlog | Live-fetch Jira requirements through Atlassian MCP |
| `seed-demo-bug` | seed a bug, debug demo | Plant curated bugs for Debug mode |
| `parallel-agents-demo` | parallel agents, multi-agent | EC-1/2/3 parallel ticket demo |

## Commands

| Command | Delegates to |
|---------|--------------|
| `/prep-demo` | `demo-prep` skill |
| `/verify-change` | `verify-excalidraw-change` skill |

## Subagents

| Agent | readonly | Role |
|-------|----------|------|
| `geometry-auditor` | yes | Compare render vs hit-test geometry for a shape type |
| `snapshot-reviewer` | yes | Classify snapshot diffs as expected vs accidental |

**Invoke examples:**

> Use the geometry-auditor subagent to check whether star rendering and hit-testing use the same vertices.

> Use the snapshot-reviewer subagent to review my snapshot changes before I commit.

## Hooks

| Event | Script | Behavior |
|-------|--------|----------|
| `beforeShellExecution` | `.cursor/hooks/block-seeded-bug-push.mjs` | Deny `git push` when known `seed-demo-bug` fingerprints are present |

Fails open on script errors so normal development is not disrupted.

## Demo prompts (quick reference)

**Show rules:** Open `packages/element/src/bounds.ts` and ask how hit-testing works — the geometry rule provides context.

**Show skills:** "Pick up Jira ticket EC-3 and implement it" — `adding-excalidraw-shape` and `commit-writer` fire automatically.

**Show commands:** Type `/prep-demo` in a fresh chat before a customer call.

**Show subagents:** After a shape change, "Use geometry-auditor to verify star vertices are consistent."

**Show hooks:** Seed bug A (`seed-demo-bug`), then ask the agent to push — hook blocks it.

Full scripted arcs: `demos/CHEATSHEET.md`.

## Audit findings (pre-kit)

**Strengths:** Six demo skills are production-quality; `adding-excalidraw-shape` is the gold standard for encoding architecture knowledge.

**Gaps filled by this kit:**
- No project rules (only `AGENTS.md` / `CLAUDE.md` docs)
- No commands, hooks, or custom subagents
- No verification or action-authoring skills
- `copilot-instructions.md` standards invisible in Cursor rule picker

**Intentionally not added:** Auto snapshot-update hooks, auto full-test hooks, or many slash commands — those are disruptive in this repo (see `AGENTS.md` gotchas).
