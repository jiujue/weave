---
name: 'weave-core'
description: '解释并修改 Weave 引擎核心（createEngine、布局/绘制、applyPatches、DisplayList 产出）。当用户对引擎行为、性能或补丁应用有疑问时调用。'
---

# @jiujue/weave-core

## 适用场景

- 引擎渲染管线：场景 → 布局(Yoga) → DisplayList。
- 通过 Patch 进行增量更新的正确性与性能。
- 解释 `Engine` API 的推荐调用序列。

## 输出重点

- 明确输入/输出（SceneNode、LayoutConstraints、DisplayList）。
- 指出受影响的适配器（offscreen、node、worker-image）以及回放层。
