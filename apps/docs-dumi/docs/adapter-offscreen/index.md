---
title: @jiujue/weave-adapter-offscreen
order: 40
toc: content
---

浏览器 OffscreenCanvas Worker 适配：主线程负责 UI/交互与 Patch，同步到 Worker；Worker 负责 `layout/paint/replay` 并把内容绘制到 OffscreenCanvas。

## 适用场景

- 需要把布局与绘制挪到 Worker，减少主线程卡顿
- 需要统一“渲染线程”模型（主线程只发 scene/patch/resize/render）

## 对外导出

- `@jiujue/weave-adapter-offscreen`：主线程侧 API（`createOffscreenClient` / `createWeaveBrowserApp`）
- `@jiujue/weave-adapter-offscreen/worker`：Worker 入口实现体（用于 `new Worker()`）

<code src="../../../../packages/adapter-offscreen/src/index.ts" title="adapter-offscreen/src/index.ts" defaultShowCode hideActions='["CSB","EXTERNAL"]'></code>

## 最小使用示例（主线程）

```ts
import { createWeaveBrowserApp } from '@jiujue/weave-adapter-offscreen'

const canvas = document.querySelector('canvas')!
const app = createWeaveBrowserApp({ canvas, clearColor: '#0b1021' })

app.setScene(scene)
app.render()

window.addEventListener('resize', () => {
	app.resize()
	app.render()
})
```

## 常见注意点

- `canvas.transferControlToOffscreen()` 只能调用一次；因此 adapter 内部会在创建 client 时完成 transfer
- resize 建议由主线程监听并发送 `WEAVE_RESIZE`，再触发一次 render
- 如果你希望统一入口，直接使用 `@jiujue/weave-app`（[/app](/app)）即可自动选择 OffscreenCanvas Worker 实现

更完整的协议与实践：[/guide/offscreen-worker](/guide/offscreen-worker)

## Worker 协议与实现参考

Worker 侧会接收：

- `WEAVE_INIT`（transfer OffscreenCanvas）
- `WEAVE_SET_SCENE` / `WEAVE_PATCH`
- `WEAVE_RESIZE` / `WEAVE_RENDER` / `WEAVE_DISPOSE`

<code src="../../../../packages/adapter-offscreen/src/worker.ts" title="adapter-offscreen/src/worker.ts（Worker 内部实现）" defaultShowCode hideActions='["CSB","EXTERNAL"]'></code>
