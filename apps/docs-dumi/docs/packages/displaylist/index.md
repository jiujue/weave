---
title: @jiujue/weave-displaylist
order: 30
toc: content
---

`@jiujue/weave-displaylist` 是“绘制指令层”：引擎输出的 DisplayList 在这里被定义与解释执行（replay）。

该子包的主路由已迁移到：[/displaylist](/displaylist)（后续内容以主路由为准）。

## 你应当关注的边界

- DisplayList 是跨端的：它不依赖 DOM、React 或 Worker
- 平台差异被压到最小：只要你能提供 `Context2DLike`，就能 replay

<code src="../../../../../packages/displaylist/src/index.ts" title="displaylist/src/index.ts" defaultShowCode hideActions='["CSB","EXTERNAL"]'></code>
