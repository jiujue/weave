---
title: 双向滚动容器（Container）
order: 58
toc: content
---

当内容在横向、竖向都超出视口时，可以同时开启 `overflowX/overflowY`，并用 `scroll.x/scroll.y`（通过 `updateScroll` patch 更新）实现双向滚动；引擎会同时绘制两条滚动条。

<code src="../../src/demos/scroll-container-xy-canvas.tsx" title="双向滚动容器示例（overflowX/overflowY + updateScroll）"></code>
