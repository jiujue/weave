# @jiujue/weave-adapter-offscreen

OffscreenCanvas adapter for Weave: Runs the engine in a Web Worker and communicates with the main thread via a message protocol.

## Position in Weave (Layering)

| Layer               | Package                           | Role                                       |
| ------------------- | --------------------------------- | ------------------------------------------ |
| Scene Data          | `@jiujue/weave-types`             | SceneNode/patch/TextMeasurer               |
| Engine Core         | `@jiujue/weave-core`              | layout + paint                             |
| Drawing Replay      | `@jiujue/weave-displaylist`       | Replay to OffscreenCanvas 2D context       |
| Platform Adaptation | `@jiujue/weave-adapter-offscreen` | Worker protocol + Lifecycle + Render drive |
| End-to-End Entry    | `@jiujue/weave-app`               | Uses this adapter by default on browsers   |

## Installation

```bash
pnpm add @jiujue/weave-adapter-offscreen
```

## Protocol

This adaptation layer uses a message-based protocol for communication between the main thread and the Worker.

### Requests (Main -> Worker)

- `WEAVE_INIT`: Initialize the engine.
- `WEAVE_PATCH`: Send scene updates (patches).
- `WEAVE_SET_SCENE`: Replace the entire scene.
- `WEAVE_RESIZE`: Update canvas dimensions.
- `WEAVE_RENDER`: Request a render frame.
- `WEAVE_HIT_TEST`: Request a hit test at specific coordinates.
  - Payload: `{ type: 'WEAVE_HIT_TEST', requestId: number, x: number, y: number }`

### Responses (Worker -> Main)

- `WEAVE_READY`: Engine is initialized.
- `WEAVE_ERROR`: An error occurred.
- `WEAVE_HIT_TEST_RESULT`: Response to hit test.
  - Payload: `{ type: 'WEAVE_HIT_TEST_RESULT', requestId: number, result: { id: string, path: string[] } | null }`

## Usage

```typescript
import { createOffscreenClient } from '@jiujue/weave-adapter-offscreen'

const client = createOffscreenClient({
  canvas: document.querySelector('canvas'),
  worker: new Worker(...)
})

// Async Hit Test
const result = await client.hitTest(100, 100)
```

Better to use the end-to-end entry: `@jiujue/weave-app` (defaults to Worker + OffscreenCanvas on browsers).

## Composition (Typical Usage)

- End-to-end: `@jiujue/weave-app` (Browser) has this adapter built-in; usually no need for direct dependency.
- Worker protocol only: You can use the client/worker from this package directly to integrate custom Worker management.

## AI / Skills

- [AI_GUIDE.md](./AI_GUIDE.md)
- [skills/SKILL.md](./skills/SKILL.md)
- [CHANGELOG.md](./CHANGELOG.md)

## Related Demos

- [weave-demo](../../apps/demo/README.md)
