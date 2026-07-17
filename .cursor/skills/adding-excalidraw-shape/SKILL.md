---
name: adding-excalidraw-shape
description: Add a new drawable generic shape (like rectangle/diamond/ellipse) and its toolbar tool to the Excalidraw monorepo. Use when adding a new shape type such as star, hexagon, triangle, or any custom generic element, wiring a new tool into the top toolbar, or when the user mentions adding an Excalidraw shape, drawable element, or shape tool.
---

# Adding a New Shape to Excalidraw

This skill maps every file and switch statement that must change to add a new **generic drawable shape** (modeled on `diamond`/`ellipse`) plus its toolbar tool. A toolbar button that points at a non-existent element type will crash on draw, so a "shape tool" always requires the underlying element type too.

## Reference implementation: copy `diamond`

`diamond` is the cleanest template. It uses the bounding-box model (`x/y/width/height`), computes polygon vertices from those dimensions, supports fill/roundness, and has dedicated collision/deconstruction helpers. Grep for `"diamond"` across `packages/element` and `packages/excalidraw` — nearly every hit is a place your new shape also needs a case. Use `getDiamondPoints` / `deconstructDiamondElement` as models for your own vertex helpers.

## Key architecture (the contract a shape must satisfy)

```
SHAPES tool entry -> setActiveTool -> createGenericElementOnPointerDown
  -> newElement({ type })                         (factory)
  -> _generateElementShape (roughjs polygon)      (render)
  -> drawElementOnCanvas / staticSvgScene         (canvas + export)
  -> getElementShape / collision / distance / bounds  (hit-test + geometry)
```

The single most error-prone part is geometry: the vertex helper drives **both** rendering and hit-testing/bounds. They must use identical vertices or the drawn shape won't be clickable where it appears.

## Exploration checklist

When adding a shape `X`, verify each touch point below. File paths are relative to repo root. Confirm line numbers by reading — the codebase moves.

### 1. Types, constants, unions
- `packages/element/src/types.ts`: add `ExcalidrawXElement = _ExcalidrawElementBase & { type: "X" }`; add to `ExcalidrawGenericElement`. Add to `ExcalidrawBindableElement`, `ExcalidrawTextContainer`, `ConvertibleGenericTypes`, `ExcalidrawFlowchartNodeElement` only if the shape should be first-class (arrow-binding / bound text / convert popup / flowchart).
- `packages/excalidraw/types.ts`: add `"X"` to the `ToolType` union.
- `packages/common/src/constants.ts`: add `X: "X"` to `TOOL_TYPE`.
- `packages/excalidraw/scene/types.ts`: add `X: Drawable` to `ElementShapes`.

### 2. Geometry helpers
- `packages/element/src/bounds.ts`: add `getXPoints(element)` near `getDiamondPoints`, deriving vertices from `width/height`.
- `packages/element/src/utils.ts`: add `deconstructXElement` near `deconstructDiamondElement` (used by bounds line-segments + collision).

### 3. RoughJS shape generation
- `packages/element/src/shape.ts`:
  - `generateRoughOptions`: add `case "X"` alongside rectangle/diamond/ellipse (fill + fillStyle).
  - `_generateElementShape`: add `case "X"` using `generator.polygon(getXPoints(...))`; mirror the diamond `element.roundness` branch for a rounded variant. (The `default` uses `assertNever`, so TS will flag a missing case.)

### 4. Rendering + export
- `packages/element/src/renderElement.ts`: add `"X"` to the `drawElementOnCanvas` switch and the outer `renderElement` grouping switch.
- `packages/excalidraw/renderer/staticSvgScene.ts`: add `"X"` to the rectangle/diamond/ellipse export case.
- `packages/excalidraw/renderer/interactiveScene.ts`: confirm selection-outline path covers `X`.

### 5. Hit-testing, collision, distance, bounds
- `packages/element/src/shape.ts` `getElementShape`: return a polygon shape for `X`.
- `packages/utils/src/shape.ts` `getPolygonShape`: add an `X` branch (model on the `diamond` branch).
- `packages/element/src/collision.ts`: add `case "X"` in `intersectElementWithLineSegment`.
- `packages/element/src/distance.ts`: add `case "X"` in `distanceToElement`.
- `packages/element/src/bounds.ts`: handle `X` in `ElementBounds.calculateBounds` and `getElementLineSegments` (reuse `deconstructXElement`). Note `getElementAbsoluteCoords` does NOT switch on type — it reuses `x/y/width/height`, so no change if the shape uses the bounding-box model.

### 6. Guards, capabilities, restore, transform
- `packages/element/src/typeChecks.ts`: add `"X"` to `isExcalidrawElement` (exhaustive — `assertNever` enforces it). Also `isBindableElement`, `isTextBindableContainer`, `isFlowchartNodeElement`, `isEligibleFrameChildType` for first-class shapes.
- `packages/element/src/comparisons.ts`: add `"X"` to `hasBackground` and `canChangeRoundness`.
- `packages/excalidraw/data/restore.ts`: add `"X"` to the generic-elements restore case.
- `packages/element/src/transform.ts`: add `"X"` where generic types are created programmatically, if applicable.

### 7. Convert-shape popup (first-class only)
- `packages/excalidraw/components/ConvertElementTypePopup.tsx`: add `"X"` to `GENERIC_TYPES` / `CONVERTIBLE_GENERIC_TYPES` and add an icon entry.

### 8. Toolbar wiring
- `packages/excalidraw/components/icons.tsx`: add `XIcon` via `createIcon` with `tablerIconProps` (follow `RectangleIcon` / `polygonIcon`).
- `packages/excalidraw/components/shapes.tsx`: import the icon; insert into the `SHAPES` array at the desired position with `{ icon, value: "X", key: KEYS.?, numericKey: ?, fillable: true, toolbar: true }`. `SHAPES` is the single source of truth; `ShapesSwitcher` in `Actions.tsx` renders it and `findShapeByKey` maps shortcuts.
- **Shortcut caution**: number keys `1`-`0` are already fully used by the existing 10 tools. Adding an 11th tool with a `numericKey` forces renumbering everything after it (and there is no free number). Prefer a free letter key (`packages/common/src/keys.ts` — check which letters are unused, e.g. `S`) with `numericKey: null`.
- `packages/excalidraw/components/App.tsx`: `createGenericElementOnPointerDown` already routes any generic type through `newElement`, so usually no change — but confirm no tool-switch logic excludes the new type.
- `packages/excalidraw/components/HelpDialog.tsx`: add a `<Shortcut>` entry (this list is a manual duplicate of the shortcuts).
- `packages/excalidraw/locales/en.json`: add `toolBar.X` and `element.X`. Only edit `en.json`; other locales fall back.
- `packages/excalidraw/components/MobileToolBar.tsx`: add `X` to the mobile `SHAPE_TOOLS` array for parity (mobile has its own arrays, not driven by `SHAPES`).

### 9. Tests
Per repo convention (see `CLAUDE.md`): run `yarn test:update` (updates snapshots), `yarn test:typecheck`, and `yarn fix`. Update any snapshot fixtures that enumerate element types or toolbar tools, and add coverage for create / export / restore / hit-test of the new shape.

## Scope shortcut

- **Basic shape**: sections 1-6 + 8 (draw, fill, select, resize, export, restore).
- **First-class shape** (like diamond): all sections, including binding, bound text, and convert popup (extra items in sections 1, 6, 7).

## Verifying quickly

`assertNever` in `_generateElementShape` (shape.ts) and `isExcalidrawElement` (typeChecks.ts) make `yarn test:typecheck` your best friend — it will surface most missing switch cases at compile time. Start there after wiring types, then fix each reported gap.
