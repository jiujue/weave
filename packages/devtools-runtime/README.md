# @jiujue/weave-devtools-runtime

Runtime capabilities for Weave DevTools: Inject hooks onto `globalThis` for instance registration, enumeration, and interactions like scene viewing and hit testing within the DevTools panel.

## Position in Weave (Layering)

| Layer            | Package                          | Role                                   |
| ---------------- | -------------------------------- | -------------------------------------- |
| Scene Data       | `@jiujue/weave-types`            | SceneNode/patch                        |
| End-to-End Entry | `@jiujue/weave-app`              | Optional integration of DevTools hook  |
| Debugging        | `@jiujue/weave-devtools-runtime` | hook definition + scene mirror (patch) |
| Tooling          | `apps/devtools-extension`        | Browser DevTools panel (Plasmo)        |

## Installation

```bash
pnpm add @jiujue/weave-devtools-runtime
```

## Usage

```ts
import { ensureWeaveDevtoolsHook } from '@jiujue/weave-devtools-runtime'

const hook = ensureWeaveDevtoolsHook()
hook.register({
	id: 'my-app',
	name: 'demo',
	canvas,
	hitTest: async (x, y) => ({ id: null, path: [] }),
	getNodeInfo: async () => null,
})
```

## Composition (Typical Usage)

- Application side: Enable `devtools: { enabled: true }` in `@jiujue/weave-app` to automatically register instances.
- Tooling side: Install and use the browser extension `apps/devtools-extension` to view the scene tree, inspect, and highlight nodes.

## AI / Skills

- [AI_GUIDE.md](./AI_GUIDE.md)
- [skills/SKILL.md](./skills/SKILL.md)
- [CHANGELOG.md](./CHANGELOG.md)

## Related Packages

- `@jiujue/weave-app`: Includes a built-in entry point for DevTools integration (optional).
