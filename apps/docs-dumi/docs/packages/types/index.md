---
title: @jiujue/weave-types
order: 10
toc: content
---

`@jiujue/weave-types` 是整个系统的“协议层”：SceneNode 数据结构、Patch 增量更新、TextMeasurer 与 Context2DLike 抽象、以及两套 JSX 方案中的 runtime 支撑。

该子包的主路由已迁移到：[/types](/types)（后续内容以主路由为准）。

## 你会最常用的类型

<code src="../../../../../packages/types/src/index.ts" title="types/src/index.ts（节选）" defaultShowCode hideActions='["CSB","EXTERNAL"]'></code>

## JSX runtime（非 React）

它直接把 TSX 编译成 `SceneNode`，适合把“场景 DSL”固定为编译期结构，并获得更强的类型检查。

- 导出路径：`@jiujue/weave-types/jsx-runtime` 与 `@jiujue/weave-types/jsx-dev-runtime`
- 关键约束：每个元素必须有 `id` 或 `key`，否则运行时会报错

<code src="../../../../../packages/types/src/jsx-runtime.ts" title="types/src/jsx-runtime.ts" defaultShowCode hideActions='["CSB","EXTERNAL"]'></code>

## Table 类型（表格原语）

Table 相关类型（`TableColumn` / `TableHeaderGroup` / `TableRow` / `TableStyle`）都在 `@jiujue/weave-types` 中定义，并通过 Patch（`updateTableData` 等）做增量更新。

- 交互示例与更新方式：[/guide/table](/guide/table)

<code src="../../../src/demos/table-interactive-canvas.tsx" title="Table 交互示例"></code>
