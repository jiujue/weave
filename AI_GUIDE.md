---
title: Weave Repository AI Guide
---

## Goals

When making changes in this repository, prioritize:

- Stability and type correctness of sub-package APIs
- Ensuring Worker/Node/Browser paths work correctly
- Reusable and automated versioning, release, and documentation deployment processes

## Repository Structure (Quick Navigation)

- `packages/*`: Publicly released sub-packages (ESM + d.ts)
- `apps/*`: Demos and tools (not released)
- `apps/docs-dumi`: Source code for the documentation site, build output to `dumi-docs/`
- `.github/workflows/*`: CI/CD (doc deployment, extension release, etc.)

## Common Commands

- Install dependencies: `pnpm install`
- Full build: `pnpm build`
- Lint: `pnpm lint`
- Test: `pnpm test`
- Build docs: `pnpm docs:build`
- Trigger gh-pages deployment (auto bump + tag): `pnpm deploy:gh-pages`

## Versioning and Release (Changesets)

- Add change record: `pnpm change`
- Generate new versions for each package: `pnpm version-packages`
- Publish to npm: `pnpm release`

Convention:

- `pnpm change` commits record "intent of change"
- `pnpm version-packages` commits record "version and changelog results"

## Change Priorities and Boundaries

- Prioritize reusing existing public types from packages (especially `@jiujue/weave-types`)
- External behavior changes must be synchronized with types and exports
- Avoid adding log output or comments in runtime code (unless explicitly requested)

## PR Self-Checklist

- `pnpm lint` passes
- `pnpm test` passes
- If involving sub-packages: `pnpm -C packages/<name> build` passes
- If involving docs/apps: `pnpm docs:build` or corresponding app build passes
