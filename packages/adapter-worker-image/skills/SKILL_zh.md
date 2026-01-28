---
name: 'weave-adapter-worker-image'
description: '提供 Worker 侧渲染适配与 worker 入口导出。用户在 worker 渲染产出、消息协议、图片生成链路相关问题时调用。'
---

# @jiujue/weave-adapter-worker-image

## 适用场景

- 解释 worker 入口如何使用与打包产物如何引用
- 排查 worker 中的渲染/回放异常与资源路径问题
- 扩展 worker 侧渲染能力并保持可序列化与跨线程安全
