---
name: 'weave-adapter-node'
description: 'Provides Node-side Context2DLike backend and image export capabilities. Called when users have questions about Node offscreen rendering, PNG export, or canvas backend selection.'
---

# @jiujue/weave-adapter-node

## Applicable Scenarios

- Explain the Node rendering pipeline: engine → DisplayList → replay → PNG.
- Troubleshoot loading failures and compatibility issues with `@napi-rs/canvas` / `canvas` backends.
- Design new Node output capabilities (e.g., more formats, more backends).
