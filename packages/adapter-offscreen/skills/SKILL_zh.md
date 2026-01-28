---
name: 'weave-adapter-offscreen'
description: '提供 OffscreenCanvas + Worker 适配与消息协议。用户在 worker 渲染、消息通信、主线程/worker 一致性问题时调用。'
---

# @jiujue/weave-adapter-offscreen

## 适用场景

- 解释主线程与 worker 的职责划分、消息协议与生命周期
- 排查渲染卡顿、消息丢失、worker 初始化失败等问题
- 扩展协议能力（例如新增事件、指标、调试能力）并保持兼容
