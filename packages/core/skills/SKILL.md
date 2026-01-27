---
name: 'weave-core'
description: '解释与修改 Weave 引擎核心（createEngine、layout/paint、applyPatches、DisplayList 产出）。用户在引擎行为/性能/patch 应用相关问题时调用。'
---

# @jiujue/weave-core

## 适用场景

- 引擎渲染链路：scene → layout(Yoga) → DisplayList
- Patch 增量更新的正确性与性能
- 需要解释 `Engine` API 的推荐调用顺序

## 输出侧重点

- 明确输入/输出（SceneNode、LayoutConstraints、DisplayList）
- 指出影响的 adapter（offscreen、node、worker-image）与 replay 层
