---
title: @jiujue/weave-displaylist
order: 30
toc: content
---

`@jiujue/weave-displaylist` 是“绘制指令层”：它定义 DisplayList 的结构，并提供回放（replay）实现，把指令解释执行到 `Context2DLike` 上。

## 为什么要有 DisplayList

- 可跨端：同一份 DisplayList 可以在浏览器、Node、Worker 等环境回放
- 可序列化：天然适合持久化/传输（比如主线程 → Worker，或 Node 服务端生成后缓存）
- 平台差异最小化：适配层只需要实现 `Context2DLike`

## 你会用到的 API

- `replayDisplayList(ctx, displayList, { dpr? })`
- `serializeDisplayList(displayList)` / `deserializeDisplayList(json)`

<code src="../../../../packages/displaylist/src/index.ts" title="displaylist/src/index.ts" defaultShowCode hideActions='["CSB","EXTERNAL"]'></code>

## DrawOp（指令类型）

当前支持的指令主要覆盖：

- 状态栈：`save` / `restore`
- 位移与裁剪：`translate` / `clipRect`
- 基础图元：`fillRect` / `strokeRect` / `drawPath`
- 文本：`drawText`

它刻意保持“平台中立”，不直接绑定到浏览器 Canvas API 的边边角角。

## 与 core 的关系

`@jiujue/weave-core` 负责把 scene + layout 结果“烘焙”成 DisplayList；`@jiujue/weave-displaylist` 只负责解释执行与序列化。

- core 端到端示例：[/demos/engine-replay](/demos/engine-replay)
