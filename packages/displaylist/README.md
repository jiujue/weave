# @jiujue/weave-displaylist

DisplayList schema + replay for Weave: Interprets and executes drawing commands produced by `@jiujue/weave-core` onto any `Context2DLike` (browser Canvas2D, OffscreenCanvas, Node canvas, etc.).

## Position in Weave (Layering)

| Layer            | Package                     | Role                            |
| ---------------- | --------------------------- | ------------------------------- |
| Scene Data       | `@jiujue/weave-types`       | Context2DLike / TextStyle types |
| Engine Core      | `@jiujue/weave-core`        | Produces DisplayList            |
| Drawing Replay   | `@jiujue/weave-displaylist` | Replays DisplayList to context  |
| End-to-End Entry | `@jiujue/weave-app`         | Unified browser/node entry      |

## Installation

```bash
pnpm add @jiujue/weave-displaylist
```

## Usage

```ts
import { replayDisplayList } from '@jiujue/weave-displaylist'
import type { DisplayList } from '@jiujue/weave-displaylist'

const dl: DisplayList = [
	{ op: 'fillRect', rect: { x: 0, y: 0, width: 100, height: 100 }, style: { color: '#111827' } },
	{ op: 'drawText', text: 'Hello', x: 12, y: 24, style: { fontSize: 16, color: '#fff' } },
]

replayDisplayList(canvas.getContext('2d')!, dl, { dpr: window.devicePixelRatio })
```

## Composition (Typical Usage)

- End-to-End: Prefer using `@jiujue/weave-app` (it calls replay internally).
- Engine Direct: `@jiujue/weave-core` handles layout/paint and produces DisplayList; this package draws the DisplayList to the platform context.
- Cross-platform: As long as the platform provides a `Context2DLike` compatibility layer, the DisplayList can be reused.

## AI / Skills

- [AI_GUIDE.md](./AI_GUIDE.md)
- [skills/SKILL.md](./skills/SKILL.md)
- [CHANGELOG.md](./CHANGELOG.md)

## Related Packages

- `@jiujue/weave-core`: Produces DisplayList.
- `@jiujue/weave-types`: Context2DLike / Text and Style types.
