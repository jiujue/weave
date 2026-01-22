---
title: @jiujue/weave-core
order: 20
toc: content
---

`@jiujue/weave-core` 提供引擎能力：维护 scene tree、应用 Patch、用 Yoga 做布局、产出 DisplayList、并可直接 replay 到 `Context2DLike`。

该子包的主路由已迁移到：[/core](/core)（后续内容以主路由为准）。

## createEngine（核心入口）

`createEngine` 是异步的（内部加载 Yoga）。

<code src="../../../../../packages/core/src/index.ts" title="core/src/index.ts" defaultShowCode hideActions='["CSB","EXTERNAL"]'></code>

## 端到端示例

<code src="../../../src/demos/engine-replay-canvas.tsx" title="createEngine + replay(canvas)"></code>

## 动态更新（Patch）

`@jiujue/weave-core` 的推荐使用方式是：用 Patch（增量）更新 scene tree，然后 `render → replay` 产出画面。

- 详细说明与交互示例见：[/guide/patches](/guide/patches)

<code src="../../../src/demos/dynamic-patches-canvas.tsx" title="动态更新：applyPatches + render + replay"></code>
