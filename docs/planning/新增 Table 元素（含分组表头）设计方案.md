## 现状梳理（约束）

- 当前可渲染节点只有 `container/text/polygon`，布局依赖 Yoga（flex），绘制通过 DisplayList（`fillRect/strokeRect/drawText/drawPath/clipRect/translate`）。
- Offscreen/Worker 渲染要求数据可序列化（不能把函数 renderer 传进 worker）。
- `ScenePatch` 目前只支持 style/text/points 的更新，复杂结构变化通常通过 `setRoot()` 直接替换整棵树。

## 目标与设计原则

- 增加一个**真正的 Table 原语**（不是用大量 container 拼出来），避免上千 cell 产生同量 Yoga 节点导致性能与 patch 复杂度暴涨。
- 支持**多级表头（表头分组）**：header tree -> 计算 rowSpan/colSpan -> 绘制多行 header。
- 设计需：可序列化、可增量更新（至少支持替换数据/列定义）、与现有布局/绘制体系兼容。

## 总体方案：新增 `TableNode`（单节点内部自布局/自绘制）

- 在 `@jiujue/weave-types` 新增：
  - `TableNode`：`type: 'table'`，作为 `SceneNode` 的新分支。
  - `TableColumn`：列定义（id、标题、宽度策略、对齐、文本样式等）。
  - `TableHeaderGroup`：表头分组树（id、label、children）。
  - `TableData`：rows（每行 id + cells 映射）。
  - `TableStyle`：header/row/cell padding、背景、网格线 stroke、斑马纹等。
- 在 `@jiujue/weave-types/jsx-runtime` 增加 intrinsic element：`<table ... />`，让 DSL/React 转换都能引用。

## TableNode 字段建议（可序列化）

- `columns: readonly TableColumn[]`
  - `id: string`
  - `title: string`
  - `width?: number | { type: 'auto' } | { type: 'flex'; weight?: number }`
  - `minWidth?: number` / `maxWidth?: number`
  - `headerTextStyle?: TextStyle` / `cellTextStyle?: TextStyle`
  - `align?: 'left'|'center'|'right'`
- `header?: readonly TableHeaderGroup[]`（可选；没有则默认单行 header=columns.title）
  - `children: readonly (TableHeaderGroup | { type: 'col'; colId: string })[]`
- `rows: readonly { id: string; cells: Record<string, string> }[]`
- `tableStyle?: { cellPadding?: number|...; headerBackground?: FillStyle; rowBackground?: FillStyle; rowAltBackground?: FillStyle; grid?: StrokeStyle; headerGrid?: StrokeStyle; }`

## 关键算法设计

### 1) 分组表头布局（rowSpan/colSpan）

- 从 `header` 树计算：
  - headerDepth（最大层级）
  - 每个 header 单元的起始列 index、colSpan（覆盖多少叶子列）
  - 对叶子 header（直接列）计算 rowSpan=剩余层级
- 输出一个 `headerCells: {x, y, w, h, text, colSpan, rowSpan, level}` 列表，用于绘制。

### 2) 列宽计算（合理且可控）

- 输入：columns 定义 + 可用宽度（Yoga 给的 width constraint） + TextMeasurer。
- 策略：
  - 固定宽 `number` 先占用。
  - auto 列：测量 `max(title, sample rows text)` 的宽度 + padding，取 max。
  - flex 列：分配剩余空间（按 weight）。
  - clamp：应用 min/maxWidth。
- 采样：默认只采样前 N 行（比如 50）用于 auto 列宽，避免 O(rows\*cols) 过重；可在 TableNode 提供 `autoMeasureRowCount?: number`。

### 3) 行高计算

- header 行高：从 headerTextStyle.fontSize/lineHeight + padding 推导（或提供显式 headerRowHeight）。
- body 行高：同理（或提供 rowHeight）。
- whiteSpace=normal 时可按列宽进行换行测量（较贵，先支持 nowrap；后续再扩展）。

## core/engine 集成方式

- 在 core 引擎中把 `TableNode` 当成**叶子节点**（Yoga 不管理 cell 级布局）：
  - `syncDirty()` 里为 table 设置 measureFunc：根据列宽/行高算法返回 table 的理想尺寸。
  - `buildDisplayList()` 中遇到 table：
    - 在节点 frame 内生成表头/单元格绘制 ops（`fillRect/drawText/drawPath`）。
    - 网格线：用 `drawPath` 批量画水平/垂直线（比每格 strokeRect 更省 ops）。
    - 可选：使用 `clipRect` 裁剪表格内容区域（为后续滚动/固定表头做准备）。

## Patch 设计（增量更新）

- 最小可用：继续允许 `setRoot()` 全量替换（适合 demo/小表）。
- 设计合理的增量补齐：在 `ScenePatch` 新增：
  - `updateTableData: { id; rows }`
  - `updateTableColumns: { id; columns; header? }`
  - `updateTableStyle: { id; tableStyle }`
- core 的 `applyPatch` 中按 id 更新 record.node 并标记 layout/paint dirty（列宽变化触发布局）。

## demo 与验证（可选但推荐）

- 增加一个 demo 场景展示：
  - 两级表头分组（比如 “基础信息/财务信息”）。
  - 斑马纹 + grid。
- 增加单测：
  - header tree -> rowSpan/colSpan 计算正确。
  - 列宽算法在固定/auto/flex 混合时可预测。
  - DisplayList 中包含预期数量的 drawPath/grid 和 drawText。

## 实施步骤（落地顺序）

1. types：新增 TableNode 相关类型 + SceneNode 联合类型扩展。
2. JSX：在 `@jiujue/weave-types` 的 jsx-runtime 增加 `<table>` intrinsic。
3. core：实现 table 的 measure + displaylist 生成。
4. patches：按需增加 updateTable\* patch 并贯通。
5. demo/tests：补示例与单测，验证性能与正确性。

如果你认可这个“Table 作为单节点原语”的方向，我会按上述步骤开始实现，并先给一个最小可用版本：固定/auto 列宽 + 多级表头绘制 + 网格线 + 行数据渲染。
