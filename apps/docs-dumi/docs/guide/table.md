---
title: 表格（Table Node）
order: 27
toc: content
---

Table 是 Weave 内置的原语之一，目标是把“表格布局 + 绘制细节”收敛为一个节点类型，避免业务层自己拼大量文本与线条。

## 核心数据结构

- `TableColumn`：列定义（id/title/width/对齐/文本样式）
- `TableHeaderGroup`：分组表头（可多层嵌套）
- `TableRow`：行数据（cells 是以 `colId` 为 key 的字典）
- `TableStyle`：背景、网格线、行高、padding、默认文本样式等

完整类型字段见：[/reference/scene](/reference/scene)

## 动态更新方式

表格的增量更新通常使用：

- `updateTableData`：更新 rows
- `updateTableColumns`：更新 columns/header（结构变化）
- `updateTableStyle`：更新样式（padding、rowHeight、zebra、grid 等）

## 滚动

Table 支持 `overflowX/overflowY` 与 `updateScroll` 实现横向/竖向滚动（header 竖向固定，横向随滚动），并自动绘制滚动条：

- `updateStyle(id, { overflowX: 'auto', overflowY: 'auto', height })`
- `updateScroll(id, { x, y })`

## 交互示例

下面的 demo 演示了列、分组表头、以及 rows/style 的动态更新：

<code src="../../src/demos/table-interactive-canvas.tsx" title="Table 交互示例"></code>

另一个 demo 专门演示横竖滚动与滚动条：

<code src="../../src/demos/table-scroll-canvas.tsx" title="Table 滚动示例"></code>
