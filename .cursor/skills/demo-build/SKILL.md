---
name: demo-build
description: Implements and verifies Excalidraw demo Jira tickets so the feature is visible in the live app on port 3001. Use for EC-1 Zigzag fill, EC-2 Star fill, EC-3 Star shape, Build/Agent-mode demos, or whenever demo features must appear reliably.
---

# Demo Build

Treat live visibility as part of implementation, not as a follow-up.

## Before editing

1. Run `demo-prep`.
2. Record the root checkout, branch, and commit:
   ```bash
   git rev-parse --show-toplevel
   git branch --show-current
   git rev-parse HEAD
   ```
3. Read the Jira issue and its acceptance criteria.
4. Build in the root checkout for a single-ticket Build demo. If an isolated worktree or cloud agent is used, its result must be committed and integrated into the root checkout before live verification.
5. Use the relevant implementation skill:
   - EC-1/EC-2: `adding-excalidraw-action`
   - EC-3: `adding-excalidraw-shape`

## Ticket contracts

### EC-1 — Zigzag fill

- Render a standalone left-properties-panel option with `value: "zigzag"` and `data-testid="fill-zigzag"`.
- Remove the Alt/Option-click-only behavior.
- Add a focused UI test that proves the button is rendered and an unmodified click applies Zigzag.

### EC-2 — Star fill

- Add `"star"` to the element fill type and a standalone left-panel option with `data-testid="fill-star"`.
- RoughJS has no native Star fill. Implement deterministic custom rendering shared by canvas and SVG export; do not relabel dots as stars.
- Add focused tests for the panel click, deterministic geometry/containment, and SVG export.

### EC-3 — Star shape

- Follow `adding-excalidraw-shape` end to end, including geometry, toolbar, serialization, and selection/resize coverage.

## Zero-failure verification gate

1. Run `yarn test:typecheck`.
2. Run every focused test touched by the ticket.
3. Require **zero failed tests and zero unhandled errors**. Never dismiss a failure as unrelated in a demo build; fix it or prove it passes in a clean baseline before proceeding.
4. Run `git diff --check`.
5. Confirm the implementation is present in the root checkout with `git status`/`git log`. A commit in another worktree is not sufficient.

## Live-app acceptance gate

1. Restart deterministically:
   ```bash
   scripts/demo-server.sh start
   scripts/demo-server.sh assert
   ```
2. Use only `http://localhost:3001`. If startup fails, stop and fix the conflict; never accept Vite's next-port fallback.
3. Confirm the browser is showing localhost:3001 and hard-refresh after the restart.
4. For fill tickets, draw/select a rectangle, set a non-transparent background, and verify the **left properties panel** contains Hachure, Cross-hatch, Zigzag, Star, and Solid. Click the new option without modifier keys and confirm the canvas changes.
5. If browser/computer-use verification is unavailable, do not claim the visual check passed. Report the exact manual check still required.

Only report the ticket complete after code, tests, checkout integration, server identity, port, and live UI all pass.
