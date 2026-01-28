---
title: @jiujue/weave-displaylist AI Guide
---

## What is this package?

`@jiujue/weave-displaylist` provides the "drawing command set" and replay capabilities:

- DisplayList schema (drawing operations, path commands, etc.)
- `replay(displayList, ctxLike, opts)`: Interprets and executes DisplayList onto `Context2DLike`
- Serialization/Deserialization (if any)

## Principles of Modification

- DisplayList is a cross-platform protocol: changes must be very cautious, prioritize adding new operations over changing semantics.
- The replay layer must remain deterministic: the same input should produce the same drawing sequence.
- Do not introduce platform-specific APIs; strictly depend on `Context2DLike`.

## Common Entry Points

- `src/index.ts`: Exports and replay entry.
- Type linkage with `@jiujue/weave-types`: Prioritize synchronous updates from types.

## Verification

- `pnpm -C packages/displaylist build`
- If changes affect visuals: Verify rendering results using the canvas demo in `docs-dumi`.
