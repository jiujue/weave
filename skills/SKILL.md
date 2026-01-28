---
name: 'weave-repo'
description: 'Assists with engineering changes, troubleshooting, and publishing within the Weave monorepo. Called when users mention packages/apps/docs/CI, version publishing, or document deployment.'
---

# Weave Repo

## Applicable Scenarios

- Need to locate the responsibility boundaries and code entry points of a sub-package/app.
- Need to modify build, release, versioning, document deployment, or GitHub Actions.
- Need to make cross-package changes in the monorepo and ensure lint/test/build passes.

## How it Works

- First, confirm whether the change belongs to `packages/*` (published) or `apps/*` (not published).
- Sub-package changes should start with `exports` and types, then proceed to implementation.
- Any script/workflow change must provide an executable trigger method (e.g., pnpm script or tag rules).

## Key Conventions

- Sub-packages generally use `tsup` for bundling; published content is controlled by `package.json#files`.
- Document deployment is triggered by tags (e.g., `deploy-gh-pages-tag-x.y.z`).
- Version management uses Changesets (`pnpm change / pnpm version-packages / pnpm release`).
