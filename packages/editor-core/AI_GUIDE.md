---
title: @jiujue/weave-editor-core AI Guide
---

## What is this package?

`@jiujue/weave-editor-core` provides core editor-related capabilities (excluding concrete UI):

- Node registry (node types, editable properties, default values, etc.)
- Conversion between scene and JSX/configuration (used for export, copy, replay)
- A pure logic layer reused by editor projects like `apps/builder-react`.

## Principles of Modification

- Do not couple with specific frameworks (React/Vue); maintain pure logic/pure types.
- Any registry/schema changes must consider backward compatibility and data migration.
- The exported structure must be serializable (for storage, copying, exporting).

## Common Entry Points

- `src/index.ts`: Public exports.
- Other `src/*`: Registry, conversion logic, utility functions.

## Verification

- `pnpm -C packages/editor-core build`
- Run `apps/builder-react` to verify if export/import and Inspector configurations are normal.
