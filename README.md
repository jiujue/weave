# Weave

OffscreenCanvas + Yoga Layout + DisplayList evolutionary rendering engine experimental project.

GitHub: `https://github.com/jiujue/weave`

## AI / Skills (Repository Level)

- [AI_GUIDE.md](./AI_GUIDE.md)
- [skills/SKILL.md](./skills/SKILL.md)

## What You Get from This Repository

- A "layout and drawing decoupled" rendering kernel: scene tree (data) → Yoga layout (geometry) → DisplayList (drawing instructions) → replay (platform adaptation)
- Two end-to-end paths:
  - Browser: Main thread UI + OffscreenCanvas Worker rendering
  - Node: Offscreen rendering and export to PNG
- Two scene construction methods coexist and can be compared:
  - `sceneFromJSX`: Write scenes using React JSX, then convert to `SceneNode` (simpler)
  - `@jiujue/weave-types` JSX runtime: Directly produce `SceneNode` (stronger typing/closer to compile-time DSL)
- Table primitives: grouped headers, alignment, fixed-height clipping (overflow hidden)

## Packages

| Package                              | Position                                | README                                                 | AI Guide                                                   | Skill                                                       | Changelog                                                    |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| `@jiujue/weave-types`                | Data models and protocols + JSX runtime | [README.md](./packages/types/README.md)                | [AI_GUIDE.md](./packages/types/AI_GUIDE.md)                | [SKILL.md](./packages/types/skills/SKILL.md)                | [CHANGELOG.md](./packages/types/CHANGELOG.md)                |
| `@jiujue/weave-core`                 | Engine core: layout/paint/hitTest       | [README.md](./packages/core/README.md)                 | [AI_GUIDE.md](./packages/core/AI_GUIDE.md)                 | [SKILL.md](./packages/core/skills/SKILL.md)                 | [CHANGELOG.md](./packages/core/CHANGELOG.md)                 |
| `@jiujue/weave-displaylist`          | DisplayList schema + replay             | [README.md](./packages/displaylist/README.md)          | [AI_GUIDE.md](./packages/displaylist/AI_GUIDE.md)          | [SKILL.md](./packages/displaylist/skills/SKILL.md)          | [CHANGELOG.md](./packages/displaylist/CHANGELOG.md)          |
| `@jiujue/weave-adapter-offscreen`    | Browser Worker + OffscreenCanvas adapt  | [README.md](./packages/adapter-offscreen/README.md)    | [AI_GUIDE.md](./packages/adapter-offscreen/AI_GUIDE.md)    | [SKILL.md](./packages/adapter-offscreen/skills/SKILL.md)    | [CHANGELOG.md](./packages/adapter-offscreen/CHANGELOG.md)    |
| `@jiujue/weave-adapter-worker-image` | Worker render output PNG (binary)       | [README.md](./packages/adapter-worker-image/README.md) | [AI_GUIDE.md](./packages/adapter-worker-image/AI_GUIDE.md) | [SKILL.md](./packages/adapter-worker-image/skills/SKILL.md) | [CHANGELOG.md](./packages/adapter-worker-image/CHANGELOG.md) |
| `@jiujue/weave-adapter-node`         | Node canvas adapt + export PNG          | [README.md](./packages/adapter-node/README.md)         | [AI_GUIDE.md](./packages/adapter-node/AI_GUIDE.md)         | [SKILL.md](./packages/adapter-node/skills/SKILL.md)         | [CHANGELOG.md](./packages/adapter-node/CHANGELOG.md)         |
| `@jiujue/weave-devtools-runtime`     | DevTools hook/runtime                   | [README.md](./packages/devtools-runtime/README.md)     | [AI_GUIDE.md](./packages/devtools-runtime/AI_GUIDE.md)     | [SKILL.md](./packages/devtools-runtime/skills/SKILL.md)     | [CHANGELOG.md](./packages/devtools-runtime/CHANGELOG.md)     |
| `@jiujue/weave-react`                | React binding: `sceneFromJSX`           | [README.md](./packages/react/README.md)                | [AI_GUIDE.md](./packages/react/AI_GUIDE.md)                | [SKILL.md](./packages/react/skills/SKILL.md)                | [CHANGELOG.md](./packages/react/CHANGELOG.md)                |
| `@jiujue/weave-editor-core`          | Editor core: state/registry/codegen     | [README.md](./packages/editor-core/README.md)          | [AI_GUIDE.md](./packages/editor-core/AI_GUIDE.md)          | [SKILL.md](./packages/editor-core/skills/SKILL.md)          | [CHANGELOG.md](./packages/editor-core/CHANGELOG.md)          |
| `@jiujue/weave-app`                  | End-to-end entry: createWeaveApp        | [README.md](./packages/app/README.md)                  | [AI_GUIDE.md](./packages/app/AI_GUIDE.md)                  | [SKILL.md](./packages/app/skills/SKILL.md)                  | [CHANGELOG.md](./packages/app/CHANGELOG.md)                  |

## Apps

| App                       | Use Case                                 | README                                           | Run                                   |
| ------------------------- | ---------------------------------------- | ------------------------------------------------ | ------------------------------------- |
| `apps/demo`               | Browser demo (Worker + OffscreenCanvas)  | [README.md](./apps/demo/README.md)               | `pnpm dev`                            |
| `apps/demo-react`         | React demo (Comparing two scene methods) | [README.md](./apps/demo-react/README.md)         | `pnpm dev:react`                      |
| `apps/demo-vue3`          | Vue3 demo (worker-image adapt)           | [README.md](./apps/demo-vue3/README.md)          | `pnpm dev:vue3`                       |
| `apps/demo-node`          | Node demo (Offscreen export to PNG)      | [README.md](./apps/demo-node/README.md)          | `pnpm -C apps/demo-node render`       |
| `apps/builder-react`      | Editor prototype (React)                 | [README.md](./apps/builder-react/README.md)      | `pnpm -C apps/builder-react dev`      |
| `apps/docs-dumi`          | Documentation site (dumi)                | [README.md](./apps/docs-dumi/README.md)          | `pnpm docs`                           |
| `apps/devtools-extension` | DevTools extension (Plasmo)              | [README.md](./apps/devtools-extension/README.md) | `pnpm -C apps/devtools-extension dev` |

## Usage as a Library (Quick Examples)

### Browser

```ts
import { createWeaveApp } from '@jiujue/weave-app'

const app = createWeaveApp({
	canvas: document.querySelector('canvas')!,
	clearColor: '#0b1021',
})

app.render()
```

### Node (Export to PNG)

```ts
import { createWeaveApp } from '@jiujue/weave-app'

const app = createWeaveApp({
	width: 800,
	height: 600,
	clearColor: '#ffffff',
})

const png = await app.renderToPng()
```

## Quick Start

### Installation and Build

```bash
pnpm install
pnpm -r build
```

### Run Browser Demo (Worker + OffscreenCanvas)

```bash
pnpm dev
```

### Run React Demo (Showing both scene construction methods separately)

```bash
pnpm dev:react
```

### Run Node Demo (Generating two PNGs: both construction methods)

```bash
pnpm -C apps/demo-node render
```

## Repository Structure

- A monorepo focused on "layering + composition": `packages` provide publishable modules, and `apps` provide runnable examples and tools.

## Documentation Entry

Documentation is centralized in `docs/`, README serves only as an index.

- Architecture and Module Boundaries: [ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- Data Flow and Protocol: [DATAFLOW.md](./docs/DATAFLOW.md)
- Design Principles and Evolution Path: [DESIGN.md](./docs/DESIGN.md)
- Development Guide: [DEVELOPMENT.md](./docs/DEVELOPMENT.md)
- Maintenance and Extension: [MAINTENANCE.md](./docs/MAINTENANCE.md)
