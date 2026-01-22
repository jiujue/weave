---
title: 动态更新（Patch）
order: 25
toc: content
---

Weave 的动态更新使用 Patch（增量）驱动：业务只需要描述“变了什么”，引擎负责把 scene tree 更新、重新布局、重新产出 DisplayList 并回放到画布。

## Patch 能做什么

常用的更新操作包括：

- `updateText` / `updateTextStyle`：更新文本内容与样式
- `updateStyle`：更新 Yoga 布局相关样式（flex、padding、gap 等）
- `replacePoints`：更新多边形点集（可用于动画）
- `addNode` / `removeNode`：动态增删节点（结构变化）
- 表格相关：`updateTableData` / `updateTableColumns` / `updateTableStyle`

完整操作清单与约束见：[/reference/patch](/reference/patch)

## 一个完整更新回路

大多数场景都遵循同一个回路：

1. `engine.applyPatches(patches)`
2. `engine.render(constraints)`（包含 layout + paint）
3. `engine.replay(ctx, { dpr })`

## 交互示例

下面的 demo 在同一个场景里演示了：

- `updateText`（计数器）
- `updateStyle`（padding）
- `addNode/removeNode`（动态插入/删除）
- `replacePoints`（波形动画）

<code src="../../src/demos/dynamic-patches-canvas.tsx" title="动态更新：applyPatches + render + replay"></code>
