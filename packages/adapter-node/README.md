# @jiujue/weave-adapter-node

Node adapter for Weave: Creates a 2D context in Node environment and provides PNG export capability.

## Position in Weave (Layering)

| Layer               | Package                      | Role                                 |
| ------------------- | ---------------------------- | ------------------------------------ |
| Scene Data          | `@jiujue/weave-types`        | SceneNode/patch/TextMeasurer         |
| Engine Core         | `@jiujue/weave-core`         | layout + paint                       |
| Drawing Replay      | `@jiujue/weave-displaylist`  | replay to Node canvas 2D context     |
| Platform Adaptation | `@jiujue/weave-adapter-node` | Create Node canvas + export PNG      |
| End-to-End Entry    | `@jiujue/weave-app`          | Uses this adapter by default on Node |

## Installation

```bash
pnpm add @jiujue/weave-adapter-node
```

Requires installing any canvas backend:

```bash
pnpm add @napi-rs/canvas
# OR
pnpm add canvas
```

## Usage

```ts
import { renderDisplayListToPng } from '@jiujue/weave-adapter-node'
import type { DisplayList } from '@jiujue/weave-displaylist'

const displayList: DisplayList = []

const png = await renderDisplayListToPng(displayList, {
	width: 800,
	height: 600,
	dpr: 2,
	clearColor: '#ffffff',
})
```

Better to use the end-to-end entry: `createWeaveApp({ width, height, ... })` + `renderToPng()` from `@jiujue/weave-app`.

## Composition (Typical Usage)

- End-to-end export: `@jiujue/weave-app` (Recommended, simpler API)
- Self-driven: `@jiujue/weave-core` produces DisplayList → this package renderToPng

## AI / Skills

- [AI_GUIDE.md](./AI_GUIDE.md)
- [skills/SKILL.md](./skills/SKILL.md)
- [CHANGELOG.md](./CHANGELOG.md)

## Related Demos

- [weave-demo-node](../../apps/demo-node/README.md)
