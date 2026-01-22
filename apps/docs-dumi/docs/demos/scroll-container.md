---
title: 滚动容器（Container）
order: 55
toc: content
---

当 `container` 的高度被 `height/maxHeight` 限制时，如果内容（子节点布局后的整体高度）超过可视区域，可以用 `overflowY` + `scroll` 做“视口滚动”。

<code src="../../src/demos/scroll-container-canvas.tsx" title="滚动容器示例（maxHeight + overflowY + updateScroll）"></code>

