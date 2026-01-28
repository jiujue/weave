---
title: @jiujue/weave-react AI Guide
---

## What is this package?

`@jiujue/weave-react` is responsible for converting React JSX structures into Weave's `SceneNode`:

- Input: ReactElement/ReactNode
- Output: A pure object scene tree of `@jiujue/weave-types`.
- Does not handle rendering, layout, workers, or canvas adaptation.

## Principles of Modification

- Perform only "structural conversion"; do not introduce rendering-time side effects.
- Output must comply with the protocol constraints of `@jiujue/weave-types`.
- Support common forms such as React fragments, array children, and conditional rendering.

## Common Entry Points

- `src/index.ts`: Core implementation of `sceneFromJSX`, etc.

## Verification

- `pnpm -C packages/react build`
- Verify if the JSX → scene results meet expectations using `apps/demo-react` or docs-dumi demos.
