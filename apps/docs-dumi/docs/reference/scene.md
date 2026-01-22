---
title: SceneNode 参考
order: 10
toc: content
---

本页是“可查”的结构定义参考：当你在写 scene 或 patch 时，不确定有哪些字段/原语时，从这里开始。

## SceneNode 联合类型

当前内置节点类型：

- `container`：布局容器（Yoga）
- `relative`：相对容器（直接子元素默认绝对定位）
- `text`：文本（依赖 TextMeasurer）
- `polygon`：多边形（点集）
- `table`：表格原语

类型定义入口：<code src="../../../../packages/types/src/index.ts" title="types/src/index.ts（SceneNode / LayoutStyle / Table）" defaultShowCode hideActions='["CSB","EXTERNAL"]'></code>

## 节点通用字段（BaseNode）

所有节点都包含 `id`，并支持以下可选字段（不影响布局与绘制）：

- `name?: string`：推荐用于 DevTools 树展示（例如 “Header”“Cell”“Chart”）
- `label?: string`：备用展示字段
- `meta?: Record<string, unknown>`：自定义扩展信息（例如业务标识、来源等）

## LayoutStyle（Yoga 布局样式）

`LayoutStyle` 是一组“布局意图”，最终会映射到 Yoga 节点属性。常用字段：

- 尺寸：`width/height`、`minWidth/minHeight`、`maxWidth/maxHeight`
- flex：`flex`、`flexGrow`、`flexShrink`、`flexBasis`
- 方向与分布：`flexDirection`、`justifyContent`、`alignItems`
- 间距：`gap`、`rowGap`、`columnGap`
- 内外边距：`padding*`、`margin*`
- 定位：`position` + `left/right/top/bottom`

### Relative 容器的定位语义

`relative` 节点是一个“容器类节点”，支持包裹子元素。它和 `container` 的主要区别是：当一个节点的父节点是 `relative` 时，如果这个子节点没有显式设置 `style.position`，引擎会把它当作“绝对定位”节点处理。

- 默认行为：子节点不写 `position`，直接写 `top/left/right/bottom` 即可相对父容器定位
- 退出绝对定位：子节点显式设置 `style.position: 'relative'`，则按常规 Yoga 布局参与流式布局

实践建议：

- 画布大小通过 `LayoutConstraints` 控制；节点自己想要多大通过 `LayoutStyle.width/height` 控制
- 高层容器如果你希望“跟随画布”，一般不设置 `style.width`，只在 render 时给 constraints

## TextNode 与 TextStyle

文本节点需要两个字段：

- `text`：内容
- `textStyle`：字体、颜色、对齐、换行等

`TextStyle` 会影响两个阶段：

- measure：决定文本的占位尺寸（TextMeasurer）
- paint：决定 `drawText` 的样式

## PolygonNode

多边形用 `points` 表示点集，常用于折线/曲线近似、波形动画等；动画时推荐用 Patch：`replacePoints`。

## TableNode（表格原语）

Table 由四类数据组成：

- `columns`：列定义（宽度策略/对齐/样式）
- `header`：分组表头（可多层嵌套）
- `rows`：行数据（以 `colId` 为 key 的字典）
- `tableStyle`：背景/网格/行高/padding/默认文本样式

更详细的更新与溢出裁剪见：[/guide/table](/guide/table)
