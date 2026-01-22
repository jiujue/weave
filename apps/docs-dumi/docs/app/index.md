---
title: @jiujue/weave-app
order: 60
toc: content
---

端到端统一入口：对外提供 browser/node 两种环境的 `createWeaveApp` 组合能力，负责把“场景构建、Patch 同步、引擎与适配层”串起来。

## API 形态（Overload）

- 浏览器：返回 `kind: 'browser'`，内部使用 `@jiujue/weave-adapter-offscreen`（OffscreenCanvas Worker）
- Node：返回 `kind: 'node'`，内部使用 `@jiujue/weave-adapter-node`（离屏渲染）

<code src="../../../../packages/app/src/index.ts" title="app/src/index.ts（类型与 Overload 声明）" defaultShowCode hideActions='["CSB","EXTERNAL"]'></code>

## Browser：主线程驱动渲染

<code src="../../../../packages/app/src/browser.ts" title="app/src/browser.ts" defaultShowCode hideActions='["CSB","EXTERNAL"]'></code>

典型调用：

```ts
import { createWeaveApp } from '@jiujue/weave-app'

const app = createWeaveApp({ canvas, clearColor: '#0b1021' })
app.setScene(scene)
app.render()
```

## Node：导出 PNG

<code src="../../../../packages/app/src/node.ts" title="app/src/node.ts" defaultShowCode hideActions='["CSB","EXTERNAL"]'></code>

典型调用：

```ts
import { createWeaveApp } from '@jiujue/weave-app'

const app = createWeaveApp({ width: 800, height: 400, clearColor: '#0b1021' })
app.setScene(scene)
const pngBytes = await app.renderToPng()
app.dispose()
```

## Node 环境依赖

Node 侧底层会通过 `@jiujue/weave-adapter-node` 选择 canvas backend：优先 `@napi-rs/canvas`，否则回退到 `canvas`。没有安装时会报错。

## 条件导出（Browser / Node）

同名 `createWeaveApp` 会根据运行环境指向不同实现：浏览器走 OffscreenCanvas Worker，Node 走离屏渲染。
