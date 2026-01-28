---
title: @jiujue/weave-app AI Guide
---

## What is this package?

`@jiujue/weave-app` is the unified end-to-end entry:

- Hides adapter differences (browser/node) from the application side.
- Provides unified capabilities for setScene/applyPatches/resize/render (or renderToPng, etc.).
- Combines `core`, `displaylist`, and adapters (offscreen/node).

## Principles of Modification

- Maintain a "minimal and stable" API, avoiding exposure of underlying implementation details to upper layers.
- Clearly separate browser/node branches; do not mix node-only dependencies into the default entry.
- Synchronize any external parameter changes with type definitions.

## Common Entry Points

- `src/index.ts`: Main exports.
- `src/browser.ts`: Browser pipeline.
- `src/node.ts`: Node pipeline.

## Verification

- `pnpm -C packages/app build`
- Browser pipeline: Run docs-dumi or a demo app.
- Node pipeline: Run the rendering script in `apps/demo-node` (if there are changes).
