# @jiujue/weave-editor-core

Pure logic core for the Weave editor: component/property registration (Registry), editor state (EditorState), and SceneNode → JSX code generation tools.

## Position in Weave (Layering)

| Layer            | Package                     | Role                                    |
| ---------------- | --------------------------- | --------------------------------------- |
| Scene Data       | `@jiujue/weave-types`       | SceneNode/patch                         |
| Editor Core      | `@jiujue/weave-editor-core` | State/Registration/Code Generation      |
| Tool Application | `apps/builder-react`        | Visual editor prototype (uses this pkg) |

## Installation

```bash
pnpm add @jiujue/weave-editor-core
```

## Usage

```ts
import { EditorState, sceneToJSX } from '@jiujue/weave-editor-core'

const state = new EditorState({ id: 'root', type: 'container', children: [] })
const jsx = sceneToJSX(state.scene)
```

## Composition (Typical Usage)

- Scene Editing: Use this package to maintain editor state (selection/scene, etc.), generate/apply `ScenePatch`.
- Canvas Preview: Pass `SceneNode` to `@jiujue/weave-app` (browser) for real-time rendering.
- Code Export: `sceneToJSX(scene)` outputs a JSX string, which can be re-consumed by `@jiujue/weave-react` or the `@jiujue/weave-types` JSX runtime.

## AI / Skills

- [AI_GUIDE.md](./AI_GUIDE.md)
- [skills/SKILL.md](./skills/SKILL.md)
- [CHANGELOG.md](./CHANGELOG.md)

## Related Packages

- `@jiujue/weave-types`: SceneNode/patch type definitions.
- `@jiujue/weave-app`: Browser canvas rendering entry (preview).
- `@jiujue/weave-react`: React JSX ↔ SceneNode.
