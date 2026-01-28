---
title: @jiujue/weave-devtools-runtime AI Guide
---

## What is this package?

`@jiujue/weave-devtools-runtime` provides DevTools runtime bridging capabilities, used to expose Weave instances to the browser extension panel:

- `attachWeaveDevtools(...)`: Registers instances and sends events.
- `createSceneMirror(...)`: Maintains a scene snapshot in the main thread for panel queries.
- Exposes hooks to the outside (e.g., `window.__WEAVE_DEVTOOLS_HOOK__`).

## Principles of Modification

- Should be disableable by default (exposing scene data in production is not recommended).
- The hook protocol should remain versioned and backward-compatible.
- Avoid introducing tight coupling with extension implementation details; the runtime is only responsible for bridging and protocols.

## Common Entry Points

- `src/index.ts`: Main types and implementation.

## Verification

- `pnpm -C packages/devtools-runtime build`
- Verify hook behavior and event flow using the devtools demo page in `apps/docs-dumi`.
