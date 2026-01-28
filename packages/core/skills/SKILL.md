---
name: 'weave-core'
description: 'Explains and modifies the Weave engine core (createEngine, layout/paint, applyPatches, DisplayList production). Called when users have questions about engine behavior, performance, or patch application.'
---

# @jiujue/weave-core

## Applicable Scenarios

- Engine rendering pipeline: scene → layout(Yoga) → DisplayList.
- Correctness and performance of incremental updates via Patches.
- Explaining the recommended call sequence for the `Engine` API.

## Output Focus

- Clarify input/output (SceneNode, LayoutConstraints, DisplayList).
- Indicate affected adapters (offscreen, node, worker-image) and the replay layer.
