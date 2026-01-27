---
title: @jiujue/weave-adapter-worker-image AI Guide
---

## 这个包是什么

`@jiujue/weave-adapter-worker-image` 提供 Worker 侧渲染（偏“图片/离屏产出”）的适配层：

- 提供 worker 入口（`exports./worker`）
- 在 worker 内组合 `core` + `displaylist` 完成 render/replay
- 供 docs 与 demo 在 worker 环境复用渲染能力

## 修改原则

- Worker 侧只使用可序列化协议与 OffscreenCanvas（或等价抽象）
- 与 `adapter-offscreen` 的协议保持一致或明确区分
- 任何新增能力先明确“消息协议/输入输出/线程边界”

## 常见改动入口

- `src/index.ts`：主入口
- `src/worker.ts`：worker 入口

## 验证方式

- `pnpm -C packages/adapter-worker-image build`
- 运行 docs-dumi 或相关 demo，确认 worker 渲染正常
