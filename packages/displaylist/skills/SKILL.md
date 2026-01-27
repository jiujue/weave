---
name: 'weave-displaylist'
description: '提供 DisplayList 协议与 replay 到 Context2DLike 的能力。用户在绘制指令、回放一致性、跨端渲染问题时调用。'
---

# @jiujue/weave-displaylist

## 适用场景

- 解释 DisplayList 的结构与 draw op 语义
- 排查 replay 到 Canvas2D / OffscreenCanvas / Node backend 的差异
- 设计新增绘制能力时如何扩展协议与回放实现
