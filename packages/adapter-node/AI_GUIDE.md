---
title: @jiujue/weave-adapter-node AI Guide
---

## What is this package?

`@jiujue/weave-adapter-node` provides drawing adaptation for Node environment:

- Provides a `Context2DLike` backend suitable for replay.
- Supports offscreen rendering and PNG export (depends on optional canvas backend).

## Principles of Modification

- Backend dependencies must be optional (do not force installation of native dependencies).
- Error messages must be clear: clearly provide installation suggestions when a backend is missing.
- Output consistency is a priority: the same DisplayList should be as consistent as possible between Node and the browser.

## Common Entry Points

- `src/index.ts`: Node adaptation entry point.

## Verification

- `pnpm -C packages/adapter-node build`
- Run the rendering script in `apps/demo-node` (generates images) to verify the output.
