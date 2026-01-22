# 数据流向与运行时协作

## 核心概念

- SceneNode：纯数据的场景树（跨线程可传递）
- LayoutFrame：每个节点的几何信息（left/top/width/height）
- DisplayList：一串绘制指令（可序列化/可回放）
- TextMeasurer：文字测量依赖（由运行时注入，core 不依赖具体 Canvas）

## 浏览器链路（OffscreenCanvas + Worker）

### 1) 初始化

主线程：

- 把 `HTMLCanvasElement` 转为 `OffscreenCanvas`
- 发送 `WEAVE_INIT`，携带：
  - offscreen canvas（transfer）
  - 初始尺寸（逻辑像素）
  - dpr
  - clearColor
  - 可选初始 scene

Worker：

- 获取 `OffscreenCanvasRenderingContext2D`
- 创建 `TextMeasurer`（基于 ctx.measureText + 简单换行）
- 创建 `@jiujue/weave-core` engine
- 回 `WEAVE_READY`

### 2) 渲染

主线程发送 `WEAVE_RENDER`。
Worker 执行：

- 如有 `pendingScene`：`engine.setRoot(scene)`
- 如有 `pendingPatches`：`engine.applyPatches(patches)`
- `engine.render({ width, height })` → DisplayList（逻辑像素）
- clear
- `replayDisplayList(ctx, displayList, { dpr })`（实际像素）

### 3) 更新

两种更新方式：

- setScene：`WEAVE_SET_SCENE`（替换整棵 scene tree）
- applyPatches：`WEAVE_PATCH`（增量更新，常用于频繁改动的场景）

## Node 链路（离屏渲染导出 PNG）

Node 侧（@jiujue/weave-app node adapter）：

- 创建 engine 并注入 TextMeasurer（由 node canvas backend 提供）
- `engine.render({ width, height })` 生成 DisplayList
- replay 到 node 侧 `Context2DLike`
- backend `toPng()` 导出

## DPR 策略（为什么这样设计）

- Yoga/layout 与 DisplayList 一律使用“逻辑像素”，避免 dpr 影响布局数值与缓存 key
- DPR 仅在 replay 时统一处理：
  - canvas.width/height = logical \* dpr
  - replay 时按 dpr 做缩放或坐标换算

## Table 的绘制数据流（简化）

引擎遇到 `TableNode` 时：

- measure：根据 columns/header/rows/tableStyle 计算表格的理想尺寸
- paint：在 table frame 内部生成 draw ops：
  - header/background/grid/text
  - 若设置了高度：用 clipRect 做裁剪（overflow hidden）
