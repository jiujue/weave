---
title: @jiujue/weave-core AI Guide
---

## 这个包是什么

`@jiujue/weave-core` 是 Weave 引擎内核：

- 维护 scene tree（来自 `@jiujue/weave-types`）
- 用 Yoga 计算布局
- 产出 DisplayList（给 `@jiujue/weave-displaylist` 回放）
- 提供 `createEngine` 与渲染/增量更新相关 API

## 修改原则

- 任何对外行为变化要体现在导出 API 与类型上
- Patch 应用必须保持幂等与可预测，避免隐式副作用
- 性能相关改动优先保证正确性，再做优化

## 常见改动入口

- `src/engine.ts`：核心实现（布局、paint、patch）
- `src/index.ts`：对外导出

## 验证方式

- `pnpm -C packages/core build`
- `pnpm test`（仓库根目录，包含 core 的测试）
- 若改动影响渲染链路：用 docs-dumi demo 或 demo app 做一次跑通验证

## 常见坑

- Yoga 初始化是异步的：不要引入同步假设
- Node/Worker 环境与浏览器环境差异：不要直接依赖 DOM API
