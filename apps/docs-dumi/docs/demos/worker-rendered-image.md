---
title: Worker 渲染图片
order: 60
toc: content
---

这个示例展示一种“主线程只展示图片”的用法：在 WebWorker 里用 OffscreenCanvas 渲染出 PNG，然后把二进制传回主线程，页面只用 `<img />` 展示最终结果。

<code src="../../src/demos/worker-rendered-image.tsx" title="Worker 渲染图片（页面只展示 img）"></code>

