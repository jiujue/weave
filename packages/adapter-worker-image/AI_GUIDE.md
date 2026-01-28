---
title: @jiujue/weave-adapter-worker-image AI Guide
---

## What is this package?

`@jiujue/weave-adapter-worker-image` provides an adaptation layer for Worker-side rendering (focused on "image/offscreen output"):

- Provides a worker entry point (`exports./worker`).
- Combines `core` + `displaylist` within the worker to perform render/replay.
- Allows docs and demos to reuse rendering capabilities in a worker environment.

## Principles of Modification

- The worker side only uses serializable protocols and OffscreenCanvas (or equivalent abstractions).
- Maintain consistency or clear distinction with the `adapter-offscreen` protocol.
- Any new capability should first define the "message protocol/input-output/thread boundary".

## Common Entry Points

- `src/index.ts`: Main entry point.
- `src/worker.ts`: Worker entry point.

## Verification

- `pnpm -C packages/adapter-worker-image build`
- Run docs-dumi or related demos and confirm worker rendering is functioning correctly.
