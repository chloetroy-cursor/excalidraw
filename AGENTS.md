# AGENTS.md

## Cursor Cloud specific instructions

Excalidraw is a Yarn 1 (Classic) workspaces monorepo. Standard commands live in the root `package.json` scripts and `CLAUDE.md`; prefer those. Dependencies are refreshed automatically on startup via the update script (`yarn install`), so you normally don't need to install anything manually.

### Services / apps
- `excalidraw-app` (Vite) is the primary runnable web app. Start it from the repo root with `yarn start` — it serves on `http://localhost:3001` (port set by `VITE_APP_PORT` in `.env.development`). The core whiteboard is fully functional with **no backend required**.
- Optional backends are only needed for specific features and are NOT part of this repo: the collaboration WebSocket server (`VITE_APP_WS_SERVER_URL=http://localhost:3002`, from the separate `excalidraw/excalidraw-room` repo) and the AI backend (`VITE_APP_AI_BACKEND=http://localhost:3016`). Scene/export links, libraries, and Firebase point at hosted dev defaults and work out of the box. Do not treat these as blocking for running or testing core drawing.
- Other apps: docs site `yarn --cwd dev-docs start` (:3003), Next.js example `yarn --cwd examples/with-nextjs dev` (:3005), browser-script example `yarn start:example`.

### Build / lint / test / typecheck (from repo root)
- Typecheck: `yarn test:typecheck` (`tsc`) — passes clean.
- Tests: `yarn test:app --watch=false` (Vitest). Use `yarn test:update` to update snapshots.
- Lint: `yarn test:code` (ESLint, `--max-warnings=0`). Auto-fix with `yarn fix`.
- Build library packages: `yarn build:packages` (needed before running the `examples/` or `dev-docs`, which consume built `dist`). The app dev server itself resolves `@excalidraw/*` from source via Vite aliases and does not need this.

### Known pre-existing gotchas (not caused by env setup; do not "fix" unless asked)
- `yarn test:code` currently reports 16 prettier warnings in `packages/excalidraw/tests/actionStyles.test.tsx`, which makes the `--max-warnings=0` lint step exit non-zero on a clean checkout. `yarn fix` would resolve them, but only touch it if the task calls for it.
- `yarn test:app` has one flaky failure: the test file `packages/excalidraw/tests/actionStyles.test.tsx` passes its assertions (3 tests pass) but emits many `RangeError: Maximum call stack size exceeded` unhandled rejections during Vitest worker IPC serialization, which can crash the worker and mark the file as failed in a full run. This is a tooling/serialization issue, not a product-code failure; ~1369 other tests pass.
- The Vite dev server's `vite-plugin-checker` overlay may report 2 TypeScript errors in `packages/excalidraw/tests/MermaidToExcalidraw.test.tsx` (branded `LocalPoint` type). These come only from the checker overlay; the authoritative `yarn test:typecheck` (`tsc`) passes, and the app runs fine regardless.
