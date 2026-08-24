---
name: verify-excalidraw-change
description: Run the right verification commands after Excalidraw editor changes. Use when the user asks to verify, typecheck, run tests, check the change, or before committing. Selects typecheck, focused tests, lint, and snapshot checks based on touched files.
---

# Verify Excalidraw Change

Post-implementation verification gate. Run commands in order; stop and fix on failure before proceeding.

## Step 1 — Always typecheck

```bash
yarn test:typecheck
```

Required after any change touching type unions, `assertNever` switches, or `@excalidraw/*` imports.

## Step 2 — Focused tests (by area touched)

| Area changed | Focused command |
|--------------|-----------------|
| Element geometry/types | `yarn test:app --watch=false packages/element/tests/` |
| Actions / properties panel | `yarn test:app --watch=false packages/excalidraw/tests/actionProperties.test.tsx` |
| Toolbar / shapes | `yarn test:app --watch=false packages/excalidraw/tests/dragCreate.test.tsx` |
| Export / SVG | `yarn test:app --watch=false packages/excalidraw/tests/export.test.tsx` |
| Restore / data | `yarn test:app --watch=false packages/excalidraw/tests/data/restore.test.ts` |
| New test file | `yarn test:app --watch=false <that-file>` |

If unsure, run tests for the most specific file you changed rather than the full suite.

## Step 3 — Snapshots (only if UI/export/restore changed)

If snapshots may have changed:

```bash
yarn test:app --update --watch=false <focused-test-path>
```

Review `__snapshots__/` diffs before committing. Use the `snapshot-reviewer` subagent if churn is large.

## Step 4 — Lint (optional, user-requested or pre-PR)

```bash
yarn fix
yarn test:code
```

Note: `actionStyles.test.tsx` has 16 known prettier warnings that make `test:code` exit non-zero on a clean checkout — do not chase these unless the task explicitly requires lint cleanup.

## Step 5 — Recycle Vite + manual smoke (shape/action features)

A leftover Vite on :3001 often predates the feature branch and serves a cached transform. Reusing it is how new panel controls “don’t show up.”

1. Recycle the demo server (`./scripts/demo-server.sh start`) — do not attach to a pre-existing listener
2. Curl the served file and assert the new `testId` / export is present (see `adding-excalidraw-action`)
3. Hard-refresh http://localhost:3001
4. Draw/select/resize the new feature
5. For fill-style changes: non-transparent background, then click the new option without modifier keys

## Report format

```
Verification:
- typecheck: pass/fail
- focused tests: <files run> — pass/fail
- snapshots: updated/none — reviewed yes/no
- lint: skipped/pass/fail (note known gotchas if fail)
- manual: done/skipped
```

Do **not** run the full `yarn test:app` suite unless the user explicitly asks — ~1300 tests, known flake in `actionStyles.test.tsx`.
