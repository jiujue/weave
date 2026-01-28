# @jiujue/weave-core

The core engine of Weave: Maintains the scene tree, uses Yoga for layout, outputs drawing results as DisplayList, and supports hit testing and node information queries.

## Position in Weave (Layering)

| Layer            | Package                     | Role                          |
| ---------------- | --------------------------- | ----------------------------- |
| Scene Data       | `@jiujue/weave-types`       | SceneNode/patch/TextMeasurer  |
| Engine Core      | `@jiujue/weave-core`        | Yoga layout + paint + hitTest |
| Drawing Replay   | `@jiujue/weave-displaylist` | DisplayList schema + replay   |
| End-to-End Entry | `@jiujue/weave-app`         | browser/node unified entry    |

## Installation

```bash
pnpm add @jiujue/weave-core
```

## Minimal Usage (Canvas 2D)

`createEngine` only depends on the `TextMeasurer` interface and is not tied to a specific platform; on the browser side, a temporary canvas can be used for measurement.

```ts
import { createEngine } from '@jiujue/weave-core'
import type { TextMeasurer, TextStyle } from '@jiujue/weave-types'
import { replayDisplayList } from '@jiujue/weave-displaylist'

function fontFromTextStyle(style: TextStyle): string {
	const weight = style.fontWeight ?? 'normal'
	const fontStyle = style.fontStyle ?? 'normal'
	const size = style.fontSize
	const family = style.fontFamily ?? 'sans-serif'
	return `${fontStyle} ${weight} ${size}px ${family}`
}

function createBrowserTextMeasurer(): TextMeasurer {
	const canvas = document.createElement('canvas')
	const ctx = canvas.getContext('2d')!
	return {
		measure({ text, style }) {
			ctx.font = fontFromTextStyle(style)
			const width = Math.ceil(ctx.measureText(text).width)
			const lineHeight = style.lineHeight ?? Math.ceil(style.fontSize * 1.2)
			return { width, height: lineHeight, lineHeight }
		},
	}
}

const engine = await createEngine({ textMeasurer: createBrowserTextMeasurer() })
engine.setRoot({ id: 'root', type: 'container', children: [] })

const displayList = engine.render({ width: 360, height: 240 })
replayDisplayList(document.querySelector('canvas')!.getContext('2d')!, displayList, {
	dpr: window.devicePixelRatio,
})
```

## Composition (Typical Usage)

- End-to-End: Prefer using `@jiujue/weave-app` (it creates and drives the engine internally).
- "Engine only": Use `createEngine` from this package directly (you are responsible for `TextMeasurer`, driving render, and replaying DisplayList to the target platform).
- Scene Construction: Use `@jiujue/weave-types` JSX runtime or `sceneFromJSX` from `@jiujue/weave-react` to generate `SceneNode`.

## AI / Skills

- [AI_GUIDE.md](./AI_GUIDE.md)
- [skills/SKILL.md](./skills/SKILL.md)
- [CHANGELOG.md](./CHANGELOG.md)

## Related Packages

- `@jiujue/weave-types`: SceneNode/patch/TextMeasurer/Context2DLike
- `@jiujue/weave-displaylist`: DisplayList schema + replay
- `@jiujue/weave-app`: End-to-end entry (browser/node)
