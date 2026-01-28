# @jiujue/weave-types

Data model and protocol layer for Weave: Defines SceneNode, patch, TextMeasurer, Context2DLike, and the JSX runtime for "direct SceneNode output".

## Position in Weave (Layering)

| Layer            | Package                     | Role                                                   |
| ---------------- | --------------------------- | ------------------------------------------------------ |
| Scene Data       | `@jiujue/weave-types`       | SceneNode/patch/TextMeasurer/Context2DLike/JSX runtime |
| Engine Core      | `@jiujue/weave-core`        | Yoga layout + paint + hitTest                          |
| Drawing Replay   | `@jiujue/weave-displaylist` | DisplayList schema + replay                            |
| End-to-End Entry | `@jiujue/weave-app`         | Unified browser/node entry                             |

## Installation

```bash
pnpm add @jiujue/weave-types
```

## Usage as Types/Protocol

```ts
import type { SceneNode } from '@jiujue/weave-types'

const scene: SceneNode = { id: 'root', type: 'container', children: [] }
```

## JSX Runtime (DSL approach)

### Method A: Directly call the runtime (no JSX compilation required)

```ts
import { jsx, jsxs } from '@jiujue/weave-types/jsx-runtime'

const scene = jsxs('container', {
	id: 'root',
	style: { padding: 16, flexDirection: 'column', gap: 12 },
	children: [
		jsx('text', { id: 't1', textStyle: { fontSize: 16, color: '#111827' }, children: 'Hello' }),
	],
})
```

### Method B: Write JSX in TS/TSX (requires jsxImportSource configuration)

```ts
/** @jsxImportSource @jiujue/weave-types */
import type { SceneNode } from '@jiujue/weave-types'

const scene: SceneNode = (
  <container id="root" style={{ padding: 16, flexDirection: 'column' }}>
    <text id="title" textStyle={{ fontSize: 18, color: '#111827' }}>
      Hello Weave
    </text>
  </container>
)
```

## Composition (Typical Usage)

- Browser Rendering: Pass the `SceneNode` produced by this package to `@jiujue/weave-app` or `@jiujue/weave-core`.
- React Projects: If you prefer React JSX syntax and mental models, use `sceneFromJSX` from `@jiujue/weave-react` (which ultimately also produces this package's `SceneNode`).
- Custom Platforms: Implement `TextMeasurer` and `Context2DLike` to make `@jiujue/weave-core` / `@jiujue/weave-displaylist` work on new platforms.

## AI / Skills

- [AI_GUIDE.md](./AI_GUIDE.md)
- [skills/SKILL.md](./skills/SKILL.md)
- [CHANGELOG.md](./CHANGELOG.md)

## Related Packages

- `@jiujue/weave-core`: Consumes `SceneNode`, produces DisplayList.
- `@jiujue/weave-displaylist`: Consumes DisplayList, replays to 2D context.
- `@jiujue/weave-app`: Encapsulates the end-to-end pipeline into a unified API.
- `@jiujue/weave-react`: React JSX → SceneNode.
