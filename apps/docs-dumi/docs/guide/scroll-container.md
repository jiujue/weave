---
title: 滚动容器（overflow/scroll）
order: 24
toc: content
---

本页说明 `container` 如何实现“内容超出可视区域时可滚动”的能力，以及在 WebWorker/Node 环境下如何接入交互。

## 你在用的是什么

滚动容器由三部分拼起来：

- 布局约束：`height/maxHeight` 决定视口高度（Yoga 负责计算最终 frame）
- 溢出策略：`overflowY/overflowX` 决定是否裁剪、是否允许滚动
- 滚动状态：`scroll` 表示视口偏移（属于渲染/命中层，不交给 Yoga 管）

## API（最小闭环）

### 1) LayoutStyle.overflowY / overflowX

`overflowY/overflowX` 的可选值：

- `visible`：不裁剪（默认）
- `hidden`：裁剪但不滚动
- `scroll`：裁剪并允许滚动
- `auto`：裁剪并允许滚动（通常你会搭配内容超出时再滚动）

类型定义见：<code src="../../../../packages/types/src/index.ts" title="types/src/index.ts（LayoutStyle/Overflow）" defaultShowCode hideActions='["CSB","EXTERNAL"]'></code>

### 2) ContainerNode.scroll

`scroll` 是滚动偏移（逻辑像素）：

```ts
type ScrollOffset = { x?: number; y?: number }
```

### 3) updateScroll Patch

用 patch 更新滚动状态：

```ts
const patches: ScenePatch[] = [
	{ op: 'updateScroll', id: 'panel', scroll: { y: 120 } }
]
engine.applyPatches(patches)
engine.render({ width, height })
engine.replay(ctx, { dpr })
```

Patch 列表参考：[/reference/patch](/reference/patch)

## 滚动条渲染

当满足以下条件时会在视口内绘制滚动条（覆盖在内容上方）：

- `overflowY/overflowX` 为 `auto` 或 `scroll`
- 且对应方向内容超出视口（`maxScrollX/maxScrollY > 0`）

竖向滚动条位于容器右侧，横向滚动条位于容器底部；thumb 位置随 `scroll` 变化。

## 原理（为什么它在 Worker/Node 都能跑）

### 1) Yoga 只负责 frame，不负责裁剪/滚动

Yoga 计算出的 `frame` 只决定“每个节点在哪、占多大”；滚动属于“视口偏移”，它不改变布局结果。

### 2) 裁剪 + 平移完成滚动视口

渲染阶段对 container 做两件事：

1. 用 `clipRect(0,0,w,h)` 把子内容裁剪到视口内（`overflow !== visible` 时）
2. 在绘制子节点前 `translate(-scrollX, -scrollY)`，把内容整体向上/向左移动

这两步都是 displaylist 指令，因此不依赖浏览器 DOM，Worker/Node 只要能回放 2D 指令即可。

实现入口：[@jiujue/weave-core engine.ts](file:///f:/Desktop/workspace/webWorkSpace/canvas-yogo-offscreen/packages/core/src/engine.ts)

## 交互接入（WebWorker / Node）

### WebWorker（OffscreenCanvas）

- 事件采集必须在主线程做（wheel/pointer 属于 DOM 事件）
- 主线程把滚动意图转成 `updateScroll` patch 发给 Worker，再触发 render

参考：[/guide/offscreen-worker](/guide/offscreen-worker)

### Node

Node 环境没有 DOM 事件，但你可以在宿主层自行构造输入（例如来自终端、测试或自定义 UI），同样用 patch 更新 `scroll` 并 render。

## 示例

- Demo：[/demos/scroll-container](/demos/scroll-container)
