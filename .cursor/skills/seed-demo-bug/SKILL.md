---
name: seed-demo-bug
description: Plant a curated, realistic bug in the Excalidraw codebase for a Debug mode demo. Use when the user says "seed a bug", "plant a bug", "set up the debug demo", or wants a reproducible broken state to demonstrate Cursor's Debug mode against.
---

# Seed a Demo Bug

Plant exactly one curated bug so the demoer can show Cursor's Debug mode finding it live. Each bug below is a realistic single-line mistake that compiles cleanly, renders no errors on startup, and has a crisp, reproducible symptom.

## Rules

- Require a clean working tree on `master` before seeding (`git status`). If dirty, stop and ask.
- Seed **one** bug at a time unless the user explicitly asks for more.
- Do not add comments, TODOs, or anything at the edit site that gives the bug away.
- **Never push a seeded bug to origin.**
- After seeding, run `yarn test:typecheck` — it must pass (all curated bugs typecheck). If it fails, the code has drifted; re-read the target function and adapt the edit to preserve the intended symptom.
- Line numbers below are hints; always read the file first. The symptom is the contract, not the exact diff.

## Workflow

1. Ask which bug to seed (or pick based on the demo: geometry for "runtime-only debugging", shortcut for "quick win", color for "failing test / red CI").
2. Choose delivery mode:
   - **Uncommitted** (default): apply the edit to the working tree on `master`. Fastest to reset (`git checkout -- <file>`).
   - **Committed**: create a branch with `./scripts/br.sh <ec-ticket> <slug>`, apply the edit, commit with an innocent-looking message (e.g. `refactor(geometry): simplify diamond corner math (EC-<n>)`) so `git blame` / recent-commits investigation works during the demo. Keep the branch local.
3. Optionally file a Jira **Bug** in project `EC` (cloudId `12ae6c59-1802-485b-8408-fa4fbb703d2c`) describing only the user-visible symptom and repro steps — never the file or cause. This gives the demo a "here's the bug report, let's debug it" opening.
4. Verify: `yarn test:typecheck` passes, then confirm the symptom manually or via the listed test.
5. Report back to the demoer only: which bug is live, the repro steps, and the reset command. Keep the causal file/line out of anything shown on screen during the demo.

## Bug catalog

### A. Diamond ghost hit-box (geometry, runtime-only)

The classic "renders fine but hit-testing disagrees" bug. Rendering uses `getDiamondPoints` (bounds.ts) directly, while selection/collision/snapping go through `getDiamondBaseCorners` — so corrupting only the latter desyncs the hit geometry from the pixels.

- **File**: `packages/element/src/utils.ts`, `getDiamondBaseCorners`, the `[top, right, bottom, left]` array (~line 355).
- **Edit**: in the `right` point, change `element.y + rightY` to `element.y + rightX` (a plausible x/y typo).
- **Symptom**: diamonds draw normally, but clicking/hovering near the right corner of a wide diamond misses, while clicks in empty space nearby select it. Side snap-midpoints also drift.
- **Repro**: draw a diamond much wider than tall (e.g. 400x100), then try to select it by clicking its right corner.
- **Why it demos well**: no test fails, no console error — you must reason about the render-vs-hit-test split, which is exactly what the `adding-excalidraw-shape` skill calls the most error-prone part of the architecture.

### B. Tool shortcut off-by-one (input handling, quick win)

- **File**: `packages/excalidraw/components/shapes.tsx`, `findShapeByKey` (~line 132).
- **Edit**: change `key === shape.numericKey.toString()` to `key === String(Number(shape.numericKey) + 1)`.
- **Symptom**: every number shortcut selects the tool one slot earlier (pressing `3` gives tool 2), and `1` selects nothing. Clicking toolbar icons and letter shortcuts (`r`, `d`, `o`) still work — a built-in diagnostic clue.
- **Repro**: press number keys 1-5 and watch the active tool.
- **Why it demos well**: fast to reproduce, and the working letter shortcuts vs broken number shortcuts let you narrate hypothesis-narrowing in under a minute.

### C. Stroke picker paints the fill (state bug, failing test)

A copy-paste bug in the color actions behind the toolbar color pickers (the EXC-9 feature this repo's demos built).

- **File**: `packages/excalidraw/actions/actionProperties.tsx`, `actionChangeStrokeColor.perform` (~line 341).
- **Edit**: inside `newElementWith(el, { strokeColor: value.currentItemStrokeColor })`, change the property `strokeColor` to `backgroundColor`.
- **Symptom**: picking a stroke color for a selected element changes its fill instead; the stroke never updates. Newly drawn elements still get the right default stroke (app state is set separately), which makes the bug look intermittent at first.
- **Repro**: draw a rectangle, select it, pick a stroke color from the toolbar color picker — the background changes instead. Or run the shipped test: `yarn test:app --watch=false packages/excalidraw/tests/actionStyles.test.tsx`. Correctly seeded, 3 tests fail with assertions like `expected '#1e1e1e' to be '#e03131'` (stroke never changed) and `expected '#1971c2' to be '#ffc9c9'` (fill received the stroke color).
- **Why it demos well**: gives a red test to start from — ideal for a "CI failed on my feature branch" narrative. Note: `AGENTS.md` documents a pre-existing flaky worker crash in this same test file; the *assertion failure* is the seeded signal, not the worker noise.

## Resetting

- Uncommitted: `git checkout -- <file>` (or run the `demo-reset` skill).
- Committed: `git checkout master && git branch -D <bug-branch>` (or run the `demo-reset` skill).
- If a Jira bug was filed, move it to Done or note it for deletion.
