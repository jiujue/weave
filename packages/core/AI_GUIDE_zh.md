---
title: @jiujue/weave-core AI Guide
---

## 这个包是什么

`@jiujue/weave-core` 是 Weave 引擎的核心内核：

- 维护场景树（来自 `@jiujue/weave-types`）。
- 使用 Yoga 计算布局。
- 产出 DisplayList（供 `@jiujue/weave-displaylist` 回放）。
- 提供 `createEngine` 以及与渲染、增量更新相关的 API。

## 修改原则

- 任何外部行为的变更必须反映在导出的 API 和类型中。
- Patch 应用必须保持幂等性和可预测性，避免隐式副作用。
- 对于性能相关的改动，在优化前优先保证正确性。

## 常见改动入口

- `src/engine.ts`：核心实现（layout、paint、patch）。
- `src/index.ts`：对外导出。

## 验证方式

- `pnpm -C packages/core build`
- `pnpm test`（在仓库根目录，包含 core 的测试）。
- 如果改动影响渲染管线：使用 docs-dumi demo 或 demo 应用进行全路径验证。

## 常见坑

- Yoga 初始化是异步的：不要引入同步假设。
- Node/Worker 与浏览器环境的差异：不要直接依赖 DOM API。
