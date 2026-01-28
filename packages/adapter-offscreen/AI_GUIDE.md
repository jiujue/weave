---
title: @jiujue/weave-adapter-offscreen AI Guide
---

## What is this package?

`@jiujue/weave-adapter-offscreen` provides browser OffscreenCanvas + Worker adaptation:

- Main thread side: transfer canvas, send messages like init/resize/render/patch/setScene.
- Worker side: create the engine, receive messages, layout/paint to produce DisplayList and replay.

## Principles of Modification

- Message protocol must be stable; prefer adding new fields over modifying existing semantics.
- Worker thread should not depend on the DOM; only use OffscreenCanvas and serializable data.
- Any change affecting rendering consistency needs to be verified on both the main thread and worker sides.

## Common Entry Points

- `src/index.ts`: Main entry point.
- `src/worker.ts`: Worker entry point (exposed via `exports./worker`).

## Verification

- `pnpm -C packages/adapter-offscreen build`
- Run docs-dumi or a demo app and confirm the worker rendering pipeline is functioning correctly.
