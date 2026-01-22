---
title: @jiujue/weave-adapter-offscreen
order: 40
toc: content
---

浏览器 OffscreenCanvas Worker 适配：主线程负责 UI/交互与 patch 同步，Worker 负责 layout/paint/replay 并把内容绘制到 OffscreenCanvas。

该子包的主路由已迁移到：[/adapter-offscreen](/adapter-offscreen)（后续内容以主路由为准）。

## exports

- `@jiujue/weave-adapter-offscreen`：主线程侧 API
- `@jiujue/weave-adapter-offscreen/worker`：Worker 内部入口（用于 `new Worker()` 的实现体）

<code src="../../../../../packages/adapter-offscreen/src/index.ts" title="adapter-offscreen/src/index.ts" defaultShowCode hideActions='["CSB","EXTERNAL"]'></code>

## Worker 侧实现（协议参考）

<code src="../../../../../packages/adapter-offscreen/src/worker.ts" title="adapter-offscreen/src/worker.ts" defaultShowCode hideActions='["CSB","EXTERNAL"]'></code>
