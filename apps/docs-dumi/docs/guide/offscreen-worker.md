---
title: Offscreen Worker 协议与实践
order: 22
toc: content
---

本页把 `@jiujue/weave-adapter-offscreen` 的协议与常见实践讲清楚，方便你在业务中稳定落地（尤其是 resize/dpr/错误处理）。

## 你在用的是什么

- 主线程：创建 client，把 scene/patch/resize/render 通过消息发给 Worker
- Worker：持有 OffscreenCanvas 2D ctx，执行 `layout/paint/replay`

主路由文档：[@jiujue/weave-adapter-offscreen](/adapter-offscreen)

## 消息协议（Message Types）

消息类型定义在：

- 源码：`packages/adapter-offscreen/src/index.ts`（主线程侧 client + 消息类型）

下面是当前协议的“可读摘要”（字段名与类型与源码一致）：

```ts
// Main -> Worker
type WeaveWorkerToWorkerMessage =
	| {
			type: 'WEAVE_INIT'
			canvas: OffscreenCanvas
			width: number
			height: number
			dpr: number
			clearColor?: string
			scene?: SceneNode
	  }
	| { type: 'WEAVE_PATCH'; patches: readonly ScenePatch[] }
	| { type: 'WEAVE_RESIZE'; width: number; height: number; dpr: number }
	| { type: 'WEAVE_RENDER' }
	| { type: 'WEAVE_SET_SCENE'; scene: SceneNode }
	| { type: 'WEAVE_DISPOSE' }

// Worker -> Main
type WeaveWorkerToMainMessage = { type: 'WEAVE_READY' } | { type: 'WEAVE_ERROR'; message: string }
```

如果你想直接看原始定义（含 client 实现），这里也内嵌了源码：

<code src="../../../../packages/adapter-offscreen/src/index.ts" title="adapter-offscreen/src/index.ts" defaultShowCode hideActions='["CSB","EXTERNAL"]'></code>

Worker 实现参考：

- 源码：`packages/adapter-offscreen/src/worker.ts`

<code src="../../../../packages/adapter-offscreen/src/worker.ts" title="adapter-offscreen/src/worker.ts" defaultShowCode hideActions='["CSB","EXTERNAL"]'></code>

## 时序要点（按真实实现总结）

### 1) render 可能先于 init

如果主线程先发送了 `WEAVE_RENDER`，Worker 会把 `pendingRender = true`，等 `WEAVE_INIT` 完成后自动补一次 render。

### 2) setScene 会丢弃未应用的 patches

Worker 内部逻辑是：

- 收到 `WEAVE_SET_SCENE`：只记录 `pendingScene`
- 下一次 render 时：`engine.setRoot(pendingScene)`，并清空 `pendingPatches`

原因：避免“先 patch 旧树、再 setScene 新树”的顺序歧义。

实践建议：

- 大改结构用 `setScene`
- 高频更新用 `patch`
- 如果你在同一帧里既要换树又要 patch，新树准备好后直接在主线程生成一批 patch 再发即可（保证顺序）

### 3) resize 不会自动 render

`WEAVE_RESIZE` 只更新 `width/height/dpr` 并重置 OffscreenCanvas 像素尺寸；是否渲染由你显式发 `WEAVE_RENDER` 决定。

实践建议：

- 主线程监听 resize：先 `app.resize()` 再 `app.render()`

### 4) DPR 只影响回放与像素尺寸

Worker 内部：

- `engine.render({ width, height })`：逻辑像素
- `canvas.width/height = logical × dpr`
- `replayDisplayList(ctx, displayList, { dpr })`：统一做 dpr 处理

这能保证布局数值不受 dpr 干扰。

## 最小正确用法（推荐走 @jiujue/weave-app）

浏览器端推荐直接用 `@jiujue/weave-app`（它内部选择 OffscreenCanvas Worker）：

```ts
import { createWeaveApp } from '@jiujue/weave-app'

const app = createWeaveApp({
	canvas,
	clearColor: '#0b1021',
	onError: console.error,
})
app.setScene(scene)
app.render()

window.addEventListener('resize', () => {
	app.resize()
	app.render()
})
```

## 调试与排错

- 看到空白：检查是否调用了 `render()`（resize 后同理）
- 字体不对/宽度怪：检查 TextStyle 与 Worker 端 measurer（基于 `ctx.measureText`）
- 收到 `WEAVE_ERROR`：主线程侧建议挂一个 `onError`，把 message 露出来
