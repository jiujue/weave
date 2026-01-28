# @jiujue/weave-react

Provides `sceneFromJSX`: Converts React JSX (intrinsic elements) to `@jiujue/weave-types` `SceneNode` (pure data).

## Position in Weave (Layering)

| Layer                      | Package               | Role                        |
| -------------------------- | --------------------- | --------------------------- |
| Scene Construction (React) | `@jiujue/weave-react` | React JSX → SceneNode       |
| Scene Data                 | `@jiujue/weave-types` | SceneNode/patch/JSX runtime |
| End-to-End Rendering       | `@jiujue/weave-app`   | Unified browser/node entry  |
| Engine Core                | `@jiujue/weave-core`  | layout + paint + hitTest    |

## Installation

```bash
pnpm add @jiujue/weave-react
```

## Usage

```tsx
import React from 'react'
import { sceneFromJSX } from '@jiujue/weave-react'
import type { SceneNode } from '@jiujue/weave-types'

const Text = 'text' as any

const scene: SceneNode = sceneFromJSX(
	<container id="root" style={{ width: 360, padding: 16, flexDirection: 'column' }}>
		<Text id="title" textStyle={{ fontSize: 18, color: '#e6e6e6' }}>
			Hello Weave
		</Text>
	</container>,
)
```

## Constraints

- Only supports intrinsic elements (e.g., `<container />`, `<text />`).
- Do not pass function components/class components (e.g., `<MyScene />`), otherwise an error will be thrown.

## Composition (Typical Usage)

- "Writing scenes" in React projects: Use `sceneFromJSX` from this package to get `SceneNode`.
- Hand over to engine rendering: `SceneNode` → `@jiujue/weave-app` (browser/Node) or `@jiujue/weave-core` (custom drive).
- If you prefer DSL/strong typing: Switch to the `@jiujue/weave-types` JSX runtime (which is a "post-compilation" form, suitable for TS/TSX).

## AI / Skills

- [AI_GUIDE.md](./AI_GUIDE.md)
- [skills/SKILL.md](./skills/SKILL.md)
- [CHANGELOG.md](./CHANGELOG.md)

## Related Packages

- `@jiujue/weave-types`: SceneNode/type definitions/JSX runtime.
- `@jiujue/weave-app`: End-to-end rendering entry (browser/Node).
- `@jiujue/weave-core`: Engine core (layout/paint).
