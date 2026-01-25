---
title: 相对容器（Relative）
order: 80
toc: content
---

`relative` 是一个容器类节点：可以像 `container` 一样包裹子元素，但它的直接子元素在默认情况下会被当作“绝对定位”处理，因此可以直接设置 `top/left/right/bottom` 来实现叠放与精确定位。

<code src="../../src/demos/relative-container-canvas.tsx" title="Relative 容器示例"></code>
