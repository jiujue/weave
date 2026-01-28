---
name: 'weave-adapter-node'
description: '提供 Node 侧 Context2DLike backend 与图片导出能力。用户在 Node 离屏渲染、PNG 导出、canvas backend 选择问题时调用。'
---

# @jiujue/weave-adapter-node

## 适用场景

- 解释 Node 渲染链路：engine → DisplayList → replay → PNG
- 排查 `@napi-rs/canvas` / `canvas` 后端加载失败与兼容性问题
- 设计新的 Node 输出能力（例如更多格式、更多后端）
