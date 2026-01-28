# @jiujue/weave-adapter-worker-image

Runs Weave rendering in a Worker and sends the rendering result (PNG binary) back to the main thread. Suitable for "offscreen rendering to generate images" scenarios (reports, exports, thumbnails, etc.).

## Position in Weave (Layering)

| Layer               | Package                              | Role                                                                         |
| ------------------- | ------------------------------------ | ---------------------------------------------------------------------------- |
| Scene Data          | `@jiujue/weave-types`                | SceneNode/patch/TextMeasurer                                                 |
| Engine Core         | `@jiujue/weave-core`                 | layout + paint                                                               |
| Drawing Replay      | `@jiujue/weave-displaylist`          | replay to OffscreenCanvas 2D context                                         |
| Platform Adaptation | `@jiujue/weave-adapter-worker-image` | Worker rendering and return PNG                                              |
| End-to-End Entry    | `@jiujue/weave-app`                  | Suitable for "drawing to canvas"; use this package when PNG binary is needed |

## Installation

```bash
pnpm add @jiujue/weave-adapter-worker-image
```

## Usage

```ts
import { createWeaveImageClient } from '@jiujue/weave-adapter-worker-image'

const client = createWeaveImageClient({
	width: 794,
	height: 1123,
	dpr: 2,
	clearColor: '#ffffff',
	scene,
})

const r = await client.render()
const blob = new Blob([r.data], { type: r.mime })
const url = URL.createObjectURL(blob)
```

## Composition (Typical Usage)

- Reports/Exports/Thumbnails: This package (PNG binary) + business side converting `ArrayBuffer` to Blob/Download/Upload.
- Interactive Canvas: Use `@jiujue/weave-app` (it draws results to a canvas instead of exporting PNG).

## AI / Skills

- [AI_GUIDE.md](./AI_GUIDE.md)
- [skills/SKILL.md](./skills/SKILL.md)
- [CHANGELOG.md](./CHANGELOG.md)

## Related Packages

- `@jiujue/weave-core`: layout/paint
- `@jiujue/weave-displaylist`: replay
- `@jiujue/weave-types`: SceneNode/patch
