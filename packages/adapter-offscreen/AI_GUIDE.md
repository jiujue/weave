---
title: @jiujue/weave-adapter-offscreen AI Guide
---

## 这个包是什么

`@jiujue/weave-adapter-offscreen` 提供浏览器 OffscreenCanvas + Worker 适配：

- 主线程侧：transfer canvas、发送 init/resize/render/patch/setScene 等消息
- Worker 侧：创建引擎、接收消息、layout/paint 产出 DisplayList 并回放

## 修改原则

- 消息协议要稳定，尽量新增字段而不是修改既有语义
- Worker 线程不要依赖 DOM；只使用 OffscreenCanvas 与可序列化数据
- 任何影响渲染一致性的改动需要同时验证主线程与 worker 两侧

## 常见改动入口

- `src/index.ts`：主入口
- `src/worker.ts`：worker 入口（通过 `exports./worker` 暴露）

## 验证方式

- `pnpm -C packages/adapter-offscreen build`
- 运行 docs-dumi 或 demo app，确认 worker 渲染链路正常
