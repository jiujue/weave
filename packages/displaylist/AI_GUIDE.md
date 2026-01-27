---
title: @jiujue/weave-displaylist AI Guide
---

## 这个包是什么

`@jiujue/weave-displaylist` 提供“绘制指令集”与回放能力：

- DisplayList schema（绘制操作、路径命令等）
- `replay(displayList, ctxLike, opts)`：把 DisplayList 解释执行到 `Context2DLike`
- 序列化/反序列化（如有）

## 修改原则

- DisplayList 是跨端协议：变更要非常谨慎，尽量新增而不是改语义
- 回放层必须保持确定性：同一输入应产生同一绘制序列
- 不引入平台专属 API，统一依赖 `Context2DLike`

## 常见改动入口

- `src/index.ts`：导出与 replay 入口
- 与 `@jiujue/weave-types` 的类型联动：优先从 types 同步更新

## 验证方式

- `pnpm -C packages/displaylist build`
- 若变更影响画面：用 docs-dumi 的 canvas demo 验证渲染结果
