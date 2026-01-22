---
title: 布局（Yoga Layout）
order: 26
toc: content
---

Weave 的布局基于 Yoga：你只需要给每个节点提供 `LayoutStyle`（flex、padding、gap、width/height 等），引擎会在 layout 阶段计算每个节点的几何信息，并在 paint 阶段把几何信息“烘焙”进 DisplayList。

## 两个容易搞混的概念

- `LayoutStyle.width/height`：节点自己的布局意图
- `LayoutConstraints`：一次渲染的外部约束（比如画布的可用宽高）

通常你会在渲染一帧时指定 `LayoutConstraints`，并通过 Patch 更新 `LayoutStyle` 来做交互布局。

可查的字段列表见：[/reference/scene](/reference/scene)

## 交互示例（Flex Playground）

这个 demo 可以动态切换：

- `flexDirection` / `justifyContent` / `alignItems`
- `gap` / `padding`
- 画布约束宽高（constraints）

<code src="../../src/demos/layout-flex-playground.tsx" title="布局交互：Flex Playground"></code>
