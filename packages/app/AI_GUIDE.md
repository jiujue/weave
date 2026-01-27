---
title: @jiujue/weave-app AI Guide
---

## 这个包是什么

`@jiujue/weave-app` 是端到端统一入口：

- 对应用侧隐藏 adapter 差异（browser/node）
- 统一提供 setScene/applyPatches/resize/render（或 renderToPng 等）能力
- 组合 `core`、`displaylist` 与 adapter（offscreen/node）

## 修改原则

- API 要保持“少而稳定”，避免把底层实现细节暴露给上层
- browser/node 分支要清晰；不要在默认入口混入 node-only 依赖
- 任何对外参数变更要同步更新类型定义

## 常见改动入口

- `src/index.ts`：主导出
- `src/browser.ts`：浏览器链路
- `src/node.ts`：Node 链路

## 验证方式

- `pnpm -C packages/app build`
- 浏览器链路：跑 docs-dumi 或 demo app
- Node 链路：跑 `apps/demo-node` 的渲染脚本（如有变更）
