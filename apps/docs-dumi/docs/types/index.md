---
title: @jiujue/weave-types
order: 10
toc: content
---

`@jiujue/weave-types` 是整个系统的“协议层”。它不做布局与绘制实现，但定义了所有模块之间的共享数据结构与抽象边界：SceneNode / Patch / DisplayList 依赖的 Context2DLike / TextMeasurer，以及两套 JSX runtime 的类型支撑。

## 你会最常用的几类类型

### SceneNode（场景树）

- `container`：布局容器（Yoga 布局 + 可选背景/边框）
- `relative`：相对容器（直接子元素默认绝对定位，可用 top/left/right/bottom）
- `text`：文本节点（依赖 `TextMeasurer` 来计算几何）
- `polygon`：多边形（点集 + 填充/描边）
- `table`：表格原语（列/表头/行/样式）

<code src="../../../../packages/types/src/index.ts" title="types/src/index.ts（SceneNode / Patch / Table 节选）" defaultShowCode hideActions='["CSB","EXTERNAL"]'></code>

### ScenePatch（增量更新）

核心心智模型：业务只描述“变了什么”，引擎负责把结构/样式/文本/表格等变化应用到 scene tree 上。

- 结构：`addNode` / `removeNode`
- 布局样式：`updateStyle`（flex、padding、gap、position 等）
- 文本：`updateText` / `updateTextStyle`
- 图形：`replacePoints`
- 表格：`updateTableData` / `updateTableColumns` / `updateTableStyle`

推荐闭环：`applyPatches → render(constraints) → replay(ctx)`，详见：[/guide/patches](/guide/patches)

### Context2DLike（跨端绘制抽象）

DisplayList 的回放目标不是 DOM Canvas，而是 `Context2DLike`：只要你能提供一个“看起来像 2D ctx”的对象，就可以回放绘制指令。

典型落地：

- 浏览器：`CanvasRenderingContext2D`
- Node：通过 `@jiujue/weave-adapter-node` 提供的 2D context backend

## JSX runtime（非 React）

`@jiujue/weave-types/jsx-runtime` 与 `@jiujue/weave-types/jsx-dev-runtime` 允许你直接用 TSX 生成 `SceneNode`（更偏 DSL / 编译期结构）。

关键约束：

- 每个元素必须有 `id` 或 `key`（用于稳定节点标识）

<code src="../../../../packages/types/src/jsx-runtime.ts" title="types/src/jsx-runtime.ts" defaultShowCode hideActions='["CSB","EXTERNAL"]'></code>

示例入口：[/demos/jsx-runtime](/demos/jsx-runtime)

## Table（表格原语）

Table 是一个内置节点类型，用于把“表格布局 + 绘制细节”收敛为单个节点，业务侧只需维护列/数据/样式。

- 交互示例：[/demos/table](/demos/table)
- 动态更新说明：[/guide/table](/guide/table)

<code src="../../src/demos/table-interactive-canvas.tsx" title="Table 交互示例"></code>
