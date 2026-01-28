---
title: @jiujue/weave-adapter-node AI Guide
---

## 这个包是什么

`@jiujue/weave-adapter-node` 提供 Node 环境的绘制适配：

- 提供可用于 replay 的 `Context2DLike` backend
- 支持离屏渲染并导出 PNG（依赖可选 canvas backend）

## 修改原则

- backend 依赖必须是可选的（不要强制安装原生依赖）
- 错误提示要清晰：缺少 backend 时应明确给出安装建议
- 输出一致性优先：同一 DisplayList 在 Node 与浏览器尽量保持一致

## 常见改动入口

- `src/index.ts`：Node 适配入口

## 验证方式

- `pnpm -C packages/adapter-node build`
- 运行 `apps/demo-node` 的渲染脚本（生成图片）验证输出
