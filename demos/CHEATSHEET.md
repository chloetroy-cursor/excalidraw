# Cursor Demo Cheat Sheet — Excalidraw Repo

Copy-paste prompts for each demo, in the order that tells the best story. Every prompt is grounded in real code in this repo, so the agent's answers land on genuinely interesting architecture.

**Skills vs prompts — how it works:** you type prompts; the skills fire automatically when relevant (that's part of the demo — "the agent follows our team's conventions without being told"). Only two things are run deliberately: seed a bug *before* the Debug demo, and the parallel-agents scenario. Everything else is just typing.

**Before any demo:** say "prep the demo" in a fresh chat (runs the `demo-prep` skill), or type `/prep-demo`. **After any demo:** say "reset the demo" (runs `demo-reset`).

**Show the full kit:** open `.cursor/README.md` — rules, skills, commands, subagents, and hooks with demo prompts for each surface.

---

## 1. Ask mode — "understand a codebase you've never seen"

**Setup:** run `demo-prep` so the app has exactly one verified server on localhost:3001.
**Talk track:** "This is Excalidraw — a real open-source monorepo, 600+ TypeScript files across five packages. Let's ask Cursor about architecture nobody on your team wants to page through."

> How does hit-testing work in this codebase? When I click on the canvas, how does Excalidraw decide which element I clicked — and where could the rendered shape and the clickable area get out of sync?

Why this prompt: the answer spans `packages/element/src/collision.ts`, `distance.ts`, `shape.ts`, and `bounds.ts`, and the "out of sync" part is real (rendering and hit-testing use separate geometry helpers). Bonus: it foreshadows the Debug demo, where you break exactly that.

Backup prompts:

> Walk me through what happens between pointer-down on the canvas and a rectangle appearing. Which packages are involved and in what order?

> What would I need to touch to add a brand-new drawable shape? Just explain, don't change anything.

(That last one usually surfaces the `adding-excalidraw-shape` skill — a nice segue to "we've encoded that knowledge as a skill, watch what that does in Agent mode.")

## 2. Plan mode — "design before you build"

**Setup:** none. Switch the chat to Plan mode.
**Talk track:** "For bigger work you don't want the agent to just start typing. Plan mode explores, asks clarifying questions, and produces a reviewable plan first."

> Read Jira ticket EC-3 in our EC project and build an implementation plan for it. Call out the riskiest parts and what you'd verify at each step.

Why this prompt: it chains the Atlassian MCP (pulls the real ticket) with codebase exploration, and the plan will mirror the `adding-excalidraw-shape` skill's checklist — say "notice it knows our architecture's most error-prone spot is geometry desync; that came from a skill our team wrote."

Bigger-scope backup (no ticket needed):

> Plan how we'd add CSV paste support: pasting spreadsheet cells onto the canvas should create a table of bound text elements. Multiple valid approaches — walk me through the trade-offs before you pick one.

## 3. Build / Agent mode — "ticket to commit"

**Setup:** none. Clean master.
**Talk track:** "Now the full loop: real Jira ticket, our branch conventions, our commit format — one prompt."

Short version (~5 min, small diff):

> Pick up Jira ticket EC-1 and implement it using the demo-build acceptance gate. Do not stop until the focused tests pass with zero failures and Zigzag is visible and clickable without modifier keys in the left properties panel at http://localhost:3001.

Full version (~15 min, big diff, uses the shape skill):

> Pick up Jira ticket EC-3 and implement it end to end using the demo-build acceptance gate. When you're done, verify with typecheck, confirm the integrated root checkout is served at http://localhost:3001, and commit.

What fires automatically: `demo-build` (the live acceptance gate), `adding-excalidraw-shape` (the how), `br.sh` conventions, and `commit-writer` (the hygiene). Point at the branch name (`feat/ec-3-...-<date>`) and commit message (`feat(editor): ... (EC-3)`) — "nobody told it our conventions in the prompt."

## 4. Debug mode — "find the bug from the symptom"

**Setup (before the meeting):** in a separate chat, say "seed demo bug A" (or B/C — the `seed-demo-bug` skill applies one verified bug). Never show that chat.
**Talk track:** "A user filed this bug report. Nobody knows where the problem is. Watch."

If you seeded **bug A** (diamond hit-box):

> Users report that wide diamonds can't be selected by clicking near their right corner — but clicking slightly outside the shape sometimes selects them. Rendering looks totally fine. Find the root cause and fix it.

If you seeded **bug B** (shortcut off-by-one):

> Keyboard shortcuts are broken: pressing 3 activates the wrong tool and pressing 1 does nothing at all. But the letter shortcuts like R and D still work fine, and clicking the toolbar works. Find out why and fix it.

If you seeded **bug C** (stroke picker paints the fill):

> CI is red on actionStyles.test.tsx — stroke color assertions are failing, something about the stroke never changing and the fill getting the wrong color. Figure out what broke and fix it.

Rule: describe only symptoms, never files. The wow is watching the agent form hypotheses (bug B's working-letter-shortcuts clue is great for this) and land on a one-line diff.

## 5. Multi-task — "one agent, a batch of work"

**Setup:** none. Clean master.
**Talk track:** "You don't babysit one task at a time. Hand it a list; keep typing while it works."

> Three independent tasks: (1) run the lint check and fix any auto-fixable warnings it reports, (2) tell me which toolBar labels exist in locales/en.json but are missing from fr-FR.json, (3) give me a one-paragraph summary of what our AGENTS.md tells cloud agents about this repo. Work them in parallel where you can and report each result separately.

While it runs, queue a follow-up message ("also check whether master is ahead of origin") to show that you can keep talking to a working agent. The tasks are deliberately disjoint — lint, locales, docs — so it can fan out subagents.

## 6. Parallel agents — "two tickets, two agents, one merge"

**Setup:** run `demo-prep` first; the scenario is scripted in the `parallel-agents-demo` skill (ticket pairings, launch options, merge finale).
**Talk track:** "Your backlog doesn't work one ticket at a time. Neither does Cursor."

Easiest launch — one orchestrator prompt in a single chat:

> Run the parallel agents demo with the clean pairing: EC-1 and EC-3, worked simultaneously by separate agents on separate branches. When both finish, review each diff, then merge them into local master one at a time and verify with typecheck.

Most visual launch — two agent tabs side by side, paste one prompt in each (copy Agent A and Agent B prompts from the `parallel-agents-demo` skill).

For the conflict-resolution finale (longer demos): use EC-1 + EC-2 instead — they collide in `actionProperties.tsx` by design, and the agent resolves the merge conflict on camera.

---

## Suggested story arcs

- **20 min:** Ask (1 prompt) → Debug (bug B, fast) → Build (EC-1). "Understand, fix, ship."
- **45 min:** Ask → Plan (EC-3) → Parallel (EC-1 + EC-3) → Debug (bug A). Plan mode's output becomes Agent B's work — the arc writes itself.
- **Backup if live coding stalls:** every demo resets in seconds (`demo-reset`), and Ask mode prompts always work — fall back to architecture Q&A.

## 7. Customization surfaces — "encode your team's knowledge"

**Setup:** none. Open `.cursor/` in the file tree.
**Talk track:** "Cursor isn't just a chat box — you encode rules, skills, commands, subagents, and hooks so the agent follows *your* process."

Quick demos (pick 2–3):

| Surface | What to show | Prompt |
|---------|--------------|--------|
| **Rules** | Open `packages/element/src/bounds.ts` | "How does hit-testing work for diamonds?" — geometry rule provides context |
| **Skills** | Clean master | "Pick up EC-3 and implement it" — shape + commit skills fire |
| **Commands** | Fresh chat | Type `/prep-demo` or `/verify-change` |
| **Subagents** | After a shape change | "Use geometry-auditor to verify star vertices are consistent" |
| **Hooks** | Seed bug A first | Ask agent to `git push` — hook blocks it |

End by opening `.cursor/README.md`: "this is how you encode *your* team's knowledge — rules for guardrails, skills for workflows, hooks for safety."

## The unified pitch

Each demo secretly showcases the same thing: the repo's Cursor kit (rules, skills, commands, subagents, hooks) turns one-off agent behavior into your team's repeatable process. End demos by opening `.cursor/` and walking through the inventory in `.cursor/README.md`.
