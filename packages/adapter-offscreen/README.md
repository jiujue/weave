# @jiujue/weave-adapter-offscreen

OffscreenCanvas adapter for Weave engine. Runs the rendering engine in a Web Worker.

## Protocol

This adapter uses a message-based protocol to communicate between the main thread and the worker.

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
