---
title: @jiujue/weave-adapter-node
order: 50
toc: content
---

Node 侧适配层：提供可用于离屏渲染的 2D context backend（或包装），从而复用 DisplayList 的 replay。

## 适用场景

- 在 Node 环境生成图片（PNG 等）
- 服务端预渲染/导出报表图、卡片图、海报等

<code src="../../../../packages/adapter-node/src/index.ts" title="adapter-node/src/index.ts" defaultShowCode hideActions='["CSB","EXTERNAL"]'></code>

## Canvas backend 选择

内部会按顺序尝试加载：

- `@napi-rs/canvas`
- `canvas`

如果两者都没有安装，会抛错：`No supported canvas backend found. Install @napi-rs/canvas or canvas.`

## 与 @jiujue/weave-app（node）组合

通常你不需要直接拼 `createEngine + replayDisplayList`，而是使用 `@jiujue/weave-app` 的 node 入口。

示例：

- 创建 app：`createWeaveApp({ width, height })`
- 调用：`renderToPng()`

详见：[/app](/app)
