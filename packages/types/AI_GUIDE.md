---
title: @jiujue/weave-types AI Guide
---

## What is this package?

`@jiujue/weave-types` defines Weave's core protocols and type system, including:

- SceneNode scene tree data structure
- Patch incremental update protocol
- Cross-platform drawing abstractions like DisplayList / Context2DLike
- JSX runtime (non-React) used to directly produce SceneNode

## Principles you should prioritize

- Types are the source of truth: any cross-package capability should have its types and protocols defined here first.
- Maintain backward compatibility as much as possible: adding fields is preferred over breaking changes.
- Once the Patch structure changes, it should synchronously affect `core`, adapters, and docs examples.

## Common Entry Points

- `src/index.ts`: Main exports.
- `src/jsx-runtime.ts`: JSX runtime (used with `jsxImportSource: @jiujue/weave-types`).
- `dist/*` are build artifacts, do not modify them directly.

## Self-check after modification

- `pnpm -C packages/types build`
- Run a type check in packages that depend on this protocol (at least `pnpm -C packages/core build`).

## Common Pitfalls

- ESM Exports: The `exports` field determines the subpaths consumers can reference.
- d.ts must be consistent with the implementation; don't just change the type without changing the implementation (or vice versa).
