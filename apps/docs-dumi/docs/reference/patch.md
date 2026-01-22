---
title: ScenePatch 参考
order: 20
toc: content
---

Patch 是 Weave 的增量更新协议：你只描述“变了什么”，引擎按 `id` 定位节点并更新 scene tree。

类型定义入口：<code src="../../../../packages/types/src/index.ts" title="types/src/index.ts（ScenePatch）" defaultShowCode hideActions='["CSB","EXTERNAL"]'></code>

## 约束（务必先看）

- Patch 按 `id` 生效：节点 `id` 必须稳定且唯一
- Patch 是“描述式”的：不要依赖隐式状态或副作用
- 高频更新优先 Patch：避免频繁 `setScene` 重建整棵树

## 操作列表

### 结构变更

- `addNode(parentId, node, index?)`：插入子节点（可指定插入位置）
- `removeNode(id)`：删除节点（以及它的子树）

### 样式与内容更新

- `updateStyle(id, style)`：更新 `LayoutStyle`（会触发 re-layout）
- `updateScroll(id, scroll)`：更新容器滚动偏移（通常不触发 re-layout）
- `updateText(id, text)`：更新文本内容
- `updateTextStyle(id, textStyle)`：更新文本样式（通常会影响测量结果）
- `replacePoints(id, points)`：更新多边形点集（适合动画）

### Table 专用更新

- `updateTableData(id, rows)`：更新数据
- `updateTableColumns(id, columns, header?)`：更新列/分组表头（结构性变化）
- `updateTableStyle(id, tableStyle)`：更新表格样式

## 推荐闭环（每一帧）

1. `engine.applyPatches(patches)`
2. `engine.render({ width, height })`
3. `engine.replay(ctx, { dpr })`

交互示例：[/demos/dynamic-patches](/demos/dynamic-patches)

## 最佳实践（少踩坑）

- 合并 Patch：同一帧内尽量 batch 成一个数组再 apply（减少重复 dirty）
- 用 Patch 表达动画：每帧只更新必要字段（如 points/text），不要更新无关 style
- 尺寸变化优先改 constraints：当你是在“画布变大/变小”时，优先改 render 的 constraints
