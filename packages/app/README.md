# @jiujue/weave-app

The unified end-to-end entry for Weave: Renders SceneNode to the browser (Worker + OffscreenCanvas) or Node (offscreen export to PNG).

## Position in Weave (Layering)

| Layer               | Package                                                                                                 | Role                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Scene Data          | `@jiujue/weave-types`                                                                                   | SceneNode/patch/TextMeasurer/JSX runtime |
| Engine Core         | `@jiujue/weave-core`                                                                                    | Yoga layout + paint + hitTest            |
| Drawing Replay      | `@jiujue/weave-displaylist`                                                                             | DisplayList schema + replay              |
| Platform Adaptation | `@jiujue/weave-adapter-offscreen` / `@jiujue/weave-adapter-node` / `@jiujue/weave-adapter-worker-image` | Worker/Node/Image Export                 |
| End-to-End Entry    | `@jiujue/weave-app`                                                                                     | Aggregates capabilities with unified API |

## Installation

```bash
pnpm add @jiujue/weave-app
```

## Browser Usage

```ts
import { createWeaveApp } from '@jiujue/weave-app'

const app = createWeaveApp({
	canvas: document.querySelector('canvas')!,
	clearColor: '#0b1021',
})

app.render()
```

## Node Usage (Export to PNG)

Node requires installing any canvas backend:

```bash
pnpm add @napi-rs/canvas
# OR
pnpm add canvas
```

```ts
import { createWeaveApp } from '@jiujue/weave-app'

const app = createWeaveApp({
	width: 800,
	height: 600,
	clearColor: '#ffffff',
})

const png = await app.renderToPng()
app.dispose()
```

## Composition (Typical Usage)

- Scene Construction: Use `sceneFromJSX` from `@jiujue/weave-react` or `@jiujue/weave-types` JSX runtime to generate `SceneNode`.
- Browser Rendering: `createWeaveApp({ canvas, scene })` (internally uses `adapter-offscreen` + `core` + `displaylist`).
- Node Export: `createWeaveApp({ width, height, scene }).renderToPng()` (internally uses `adapter-node` + `core` + `displaylist`).
- Worker Image Export: When you need "PNG binary", prefer using `@jiujue/weave-adapter-worker-image`.

## AI / Skills

- [AI_GUIDE.md](./AI_GUIDE.md)
- [skills/SKILL.md](./skills/SKILL.md)
- [CHANGELOG.md](./CHANGELOG.md)

## Related Demos

- [weave-demo](../../apps/demo/README.md)
- [weave-demo-react](../../apps/demo-react/README.md)
- [weave-demo-node](../../apps/demo-node/README.md)
