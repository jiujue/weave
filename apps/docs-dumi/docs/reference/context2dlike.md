---
title: Context2DLike 参考
order: 30
toc: content
---

`Context2DLike` 是 DisplayList 的回放目标接口：它刻意抽象成“最小 2D 集合”，让浏览器/Node/自研渲染后端都能接入。

类型定义入口：<code src="../../../../packages/types/src/index.ts" title="types/src/index.ts（Context2DLike）" defaultShowCode hideActions='["CSB","EXTERNAL"]'></code>

## 你需要实现什么

按能力分三类：

- 状态栈：`save` / `restore`
- 路径与裁剪：`beginPath/moveTo/lineTo/closePath/clip`
- 图元与文本：`fillRect/strokeRect/fill/stroke/fillText`

以及一组“画笔状态字段”：

- `font` / `textAlign` / `textBaseline`
- `globalAlpha` / `fillStyle` / `strokeStyle` / `lineWidth`

可选但强烈建议支持：

- `setTransform`（用于清屏与 dpr 处理）
- `scale`（如果 setTransform 不可用，可用它完成缩放）

## 最小接入路线

1. 让你的平台提供一个 `ctxLike: Context2DLike`
2. 直接复用 `@jiujue/weave-displaylist` 的 `replayDisplayList(ctxLike, displayList, { dpr })`

对应包文档：[@jiujue/weave-displaylist](/displaylist)
