---
title: @jiujue/weave-core AI Guide
---

## What is this package?

`@jiujue/weave-core` is the core kernel of the Weave engine:

- Maintains the scene tree (from `@jiujue/weave-types`).
- Calculates layout using Yoga.
- Produces DisplayList (for replay by `@jiujue/weave-displaylist`).
- Provides `createEngine` and APIs related to rendering and incremental updates.

## Principles of Modification

- Any change in external behavior must be reflected in the exported APIs and types.
- Patch application must remain idempotent and predictable, avoiding implicit side effects.
- For performance-related changes, prioritize correctness before optimization.

## Common Entry Points

- `src/engine.ts`: Core implementation (layout, paint, patch).
- `src/index.ts`: External exports.

## Verification

- `pnpm -C packages/core build`
- `pnpm test` (at repository root, including tests for core).
- If the change affects the rendering pipeline: perform a full-path verification using the docs-dumi demo or a demo app.

## Common Pitfalls

- Yoga initialization is asynchronous: do not introduce synchronous assumptions.
- Differences between Node/Worker and browser environments: do not directly depend on DOM APIs.
