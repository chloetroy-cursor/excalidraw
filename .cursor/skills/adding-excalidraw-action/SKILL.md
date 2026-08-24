---
name: adding-excalidraw-action
description: Add a new Excalidraw editor action (menu item, keyboard shortcut, or properties-panel control). Use when adding an action, registering a keyboard shortcut, wiring a menu command, or extending the properties panel with a new control.
---

# Adding an Excalidraw Action

Actions are the unit of user-triggered editor behavior: toolbar buttons, keyboard shortcuts, command palette entries, and properties-panel controls all route through the action system.

## Reference: copy an existing action

Pick the closest neighbor:
- **Properties panel toggle** → `actionChangeFillStyle` in `actionProperties.tsx`
- **Simple toggle** → `actionToggleZenMode.tsx`
- **Z-index** → `actionZindex.tsx`

## Checklist

### 1. Register the action

- Create `packages/excalidraw/actions/action<Name>.tsx` (or add to `actionProperties.tsx` for panel controls)
- Export via `register({ name, perform, keyTest?, PanelComponent?, ... })` from `register.ts`
- Add the action name to the `ActionName` union in `actions/types.ts`
- Ensure side-effect import in `actions/index.ts` so registration runs at load time

### 2. Implement `perform`

- Read selected elements from app state
- Return `{ elements, appState, captureUpdate }` using `CaptureUpdateAction` from `@excalidraw/element`
- Use `newElementWith(el, { ... })` for element mutations — verify you set the **intended** property (stroke vs background is a common copy-paste bug)

### 3. UI wiring (if visible in panel)

- Add `PanelComponent` for properties-panel rendering
- Use `RadioSelection`, `ToolButton`, or existing panel primitives
- Add `testId` for focused UI tests (e.g. `fill-zigzag`, `fill-star`)
- Icon in `components/icons.tsx`; label in `locales/en.json` only
- New `t("labels.*")` keys must pass a string fallback (`t("labels.star", null, "Star")`). In dev, `t()` throws on a missing key — a stale `en.json` import will crash the whole fill row and look like the control was never added.

### 4. Keyboard shortcut (optional)

- Add `keyTest: (event) => ...` using `KEYS` from `@excalidraw/common`
- Duplicate entry in `HelpDialog.tsx` (manual shortcut list)

### 5. Tests

- Co-located `action<Name>.test.tsx` or extend `actionProperties.test.tsx`
- Test: perform the action on a selected element, assert the expected property changed
- Run: `yarn test:app --watch=false packages/excalidraw/tests/actionProperties.test.tsx`

### 6. Recycle Vite, then verify the served module

Passing tests is not enough. A Vite process started **before** `./scripts/br.sh` / `git checkout` can keep serving a cached transform of `actionProperties.tsx`. The browser then shows the old panel (e.g. three fill buttons, no Star) even though disk has the new `testId`.

Do this every time you add a visible control:

```bash
# Always recycle :3001 — do not reuse a leftover yarn start
./scripts/demo-server.sh start

# Prove the process on :3001 is serving THIS checkout's source
ROOT="$(git rev-parse --show-toplevel)"
curl -sf "http://localhost:3001/@fs${ROOT}/packages/excalidraw/actions/actionProperties.tsx" \
  | grep -q 'fill-star'
```

Replace `fill-star` with the new `testId`. If `grep` fails, the listener is stale — `./scripts/demo-server.sh stop`, kill anything still on 3001, start again, re-curl.

Then hard-refresh (Cmd-Shift-R). For fill styles, pick a **non-transparent** background first — the fill row is hidden otherwise.

Run the `verify-excalidraw-change` skill. Do not tell the user the control is visible until the curl check passes.

## Scope notes

- **Fill/style actions** touch `FillStyle` in `packages/element/src/types.ts` and `generateRoughOptions` in `shape.ts`
- **Hidden easter eggs** (alt-click toggles) should be promoted to first-class UI options when exposing a style — remove the alt-click hack
- rough.js supports: `hachure`, `solid`, `zigzag`, `cross-hatch`, `dots` — custom patterns need explicit rendering strategy
