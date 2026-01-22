---
title: @jiujue/weave-core
order: 20
toc: content
---

`@jiujue/weave-core` 是引擎内核：维护 scene tree、应用 Patch、用 Yoga 做布局、产出 DisplayList，并支持直接回放到 `Context2DLike`。

## 核心 API 与推荐调用顺序

- `createEngine({ textMeasurer, root? })`：创建引擎（异步，内部加载 Yoga）
- `engine.applyPatches(patches)`：增量更新 scene tree
- `engine.render({ width, height })`：layout + paint，得到 DisplayList
- `engine.replay(ctx, { dpr })`：把最后一次产出的 DisplayList 回放到目标 context

<code src="../../../../packages/core/src/index.ts" title="core/src/index.ts（入口导出）" defaultShowCode hideActions='["CSB","EXTERNAL"]'></code>

## 两个关键输入

- `TextMeasurer`：用于文本测量；浏览器可用 `CanvasRenderingContext2D.measureText` 实现，Node 侧通常由 adapter 提供 backend
- `LayoutConstraints`：每一帧渲染的外部约束（例如画布宽高），决定根节点可用空间

## 最短链路示例（浏览器 canvas）

这个示例展示：从 SceneNode 出发，一帧内完成 `render → replay`。

<code src="../../src/demos/engine-replay-canvas.tsx" title="createEngine + replay(canvas)"></code>

## 动态更新（Patch）

这个示例在同一个 scene 里演示：

- 文本更新、样式更新、增删节点
- 多边形点集更新（动画）

<code src="../../src/demos/dynamic-patches-canvas.tsx" title="动态更新：applyPatches + render + replay"></code>

更完整的心智模型与约束：[/guide/patches](/guide/patches)
