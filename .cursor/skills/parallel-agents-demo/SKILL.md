---
name: parallel-agents-demo
description: Run the parallel-agents demo in the Excalidraw repo - multiple agents building separate Jira tickets on separate branches simultaneously, then review and merge. Use when the user says "parallel agents demo", "run agents in parallel", "multi-agent demo", or wants to demonstrate Cursor working multiple tickets at once.
---

# Parallel Agents Demo

Demonstrate multiple Cursor agents independently building real Jira tickets on separate branches at the same time, then a review-and-merge finale. Jira project: `EC` ("Excalidraw Canvas") on `chloe-fe-demo.atlassian.net`, cloudId `12ae6c59-1802-485b-8408-fa4fbb703d2c`.

## Pre-flight

Run the `demo-prep` skill first: clean `master`, app boots, typecheck passes, and the standing tickets are in "To Do":

- **EC-1** — expose the "Zigzag" fill style in the properties panel
- **EC-2** — add a "Star" fill style option
- **EC-3** — add a Star shape tool to the toolbar

## Choosing the ticket pairing (this is the load-bearing decision)

- **Clean parallel (default): EC-1 + EC-3.** Different subsystems: EC-1 is a properties-panel UI change; EC-3 is element architecture. They overlap only in `icons.tsx` and `en.json`, in different regions, so both merge without conflicts. Use this to show throughput.
- **Conflict showcase: EC-1 + EC-2.** Both edit the same `RadioSelection` options block inside `actionChangeFillStyle` (`packages/excalidraw/actions/actionProperties.tsx`), so the second merge is guaranteed to conflict. Use this deliberately to demo agent-assisted conflict resolution — never by accident.
- All three at once works for longer demos: merge EC-3 first, then EC-1, then resolve the EC-2 conflict as the finale.

## Launch mechanisms (pick per audience)

1. **Cursor UI tabs (best on camera).** Open one agent tab per ticket and paste the prompts below. The audience watches both work simultaneously.
2. **Single-chat orchestration.** One agent launches parallel subagents in isolated git worktrees (best-of-n-runner style), each on its own branch, and reports back. Record the root checkout's branch before launch and verify it never changes while the subagents run. When the runner already supplies an isolated worktree and branch, agents must not call `./scripts/br.sh` because that can switch the live root checkout. Shows agent-orchestrated parallelism.
3. **Cloud agents.** Kick off from the ticket, check results later. Good for the "delegate and move on" narrative.

## Agent prompts (copy-paste ready)

Each agent must work on its own branch and commit using the `commit-writer` skill. For Cursor UI tabs, create it with `./scripts/br.sh`. For isolated-worktree runners, use the runner-provided branch and do not call `./scripts/br.sh`. Branches stay local during the demo.

**Agent A (EC-1, zigzag fill option):**

> Work Jira ticket EC-1: expose the "Zigzag" fill style as a visible option in Excalidraw's element properties panel. In a normal checkout, create a branch with `./scripts/br.sh 1 expose zigzag fill`; in an isolated runner, stay on its provided branch and do not run the branch script. Note: the engine already supports zigzag — `FillStyle` in `packages/element/src/types.ts` includes `"zigzag"`, and it's currently a hidden alt-click easter egg on the hachure button in `actionChangeFillStyle` (`packages/excalidraw/actions/actionProperties.tsx`). Promote it to a first-class `RadioSelection` option with `value: "zigzag"` and `testId: "fill-zigzag"` (icon in `icons.tsx`, label in `locales/en.json`), and remove the alt-click hack. Add a focused UI test that fails unless `fill-zigzag` is rendered as its own visible button and clicking it without modifier keys applies the Zigzag fill. Verify with `yarn test:typecheck`, the focused test, and by drawing a non-transparent filled rectangle and selecting Zigzag directly. Commit with the commit-writer skill.

**Agent B (EC-3, star shape tool):**

> Work Jira ticket EC-3: add a star shape tool to Excalidraw, following the `adding-excalidraw-shape` skill end to end (basic shape scope: sections 1-6 + 8). Create a branch with `./scripts/br.sh 3 add star shape tool`. Use a free letter shortcut, not a numeric key. Verify with `yarn test:typecheck` and by drawing, selecting, and resizing a star. Commit with the commit-writer skill.

**Agent C (EC-2, star fill style — conflict/stretch ticket):**

> Work Jira ticket EC-2: add a "Star" fill style option to Excalidraw's element properties panel. Create a branch with `./scripts/br.sh 2 add star fill style`. Add `"star"` to `FillStyle` in `packages/element/src/types.ts` and add the option to `actionChangeFillStyle` with an icon and label. For rendering: `element.fillStyle` passes straight through to rough.js in `generateRoughOptions` (`packages/element/src/shape.ts`), and rough.js has no native "star" fill — pick the closest supported rough.js fill (e.g. `dots`) as the base and adjust its fill options to read as stars, or implement a custom pattern. Verify with `yarn test:typecheck`. Commit with the commit-writer skill.

**Timing note**: EC-1 and EC-3 have known-good implementations and finish reliably. EC-2 is open-ended by design (no native rough.js support) — use it when you *want* visible agent problem-solving or the merge conflict, not when you need a guaranteed clean finish. If you ever need a third reliable ticket instead, a "Dots" or "Dashed" fill style is natively supported by rough.js and needs only the type union + UI option.

## Review and merge finale

1. When agents finish, transition their tickets to "In Review"/"Done" in Jira (nice on-camera moment via the Atlassian MCP).
2. For each branch: review the diff (`git diff master...<branch>`) and run `yarn test:typecheck` plus its focused tests. A committed subagent branch is not yet visible in the app running from the root checkout; do not report the feature as available until it is integrated there.
3. Merge into local `master` one branch at a time. In the clean pairing both merges are automatic; in the conflict pairing, let the agent resolve the `actionProperties.tsx` conflict live and explain the resolution.
4. Confirm the dev server on port 3001 is running from the root checkout on the integrated branch. After EC-1 is merged, assert the `fill-zigzag` button exists and manually select it without Alt/Option on a non-transparent filled rectangle. If it is absent, stop and fix the integration before continuing.
5. After all merges: run the final `yarn test:typecheck` and focused tests, then draw one canvas using every new feature as the closing shot.
6. **Do not push demo merges to origin** unless the user explicitly wants to keep them.

## Teardown

Run the `demo-reset` skill (`./scripts/demo-reset.sh` handles branches and the merge commits on master since it hard-resets to `origin/master`). Move EC tickets back to "To Do" so the demo is re-runnable.
