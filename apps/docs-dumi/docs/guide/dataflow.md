---
title: 数据流与渲染时序
order: 21
toc: content
---

本页聚焦“运行时怎么协作”，把 SceneNode / Patch / DisplayList 在不同链路里如何流动讲清楚。

## 核心对象（只记 4 个就够）

- `SceneNode`：纯数据场景树（可结构化克隆，适合跨线程传递）
- `ScenePatch`：增量更新（描述“变了什么”）
- `DisplayList`：绘制指令（可序列化，可回放）
- `TextMeasurer`：文字测量依赖（由运行时注入）

对应类型来源：[@jiujue/weave-types](/types)

## Browser：OffscreenCanvas + Worker

### 初始化（WEAVE_INIT）

主线程（client）会把 `HTMLCanvasElement` transfer 为 `OffscreenCanvas`，并把初始化信息发到 Worker。

- client 代码入口：`createWeaveBrowserApp` / `createOffscreenClient`
  - 代码参考：[adapter-offscreen/src/index.ts](file:///f:/Desktop/workspace/webWorkSpace/canvas-yogo-offscreen/packages/adapter-offscreen/src/index.ts)

Worker 收到 init 后：

- 获取 `OffscreenCanvasRenderingContext2D`
- 创建 `TextMeasurer`
- `createEngine({ textMeasurer, root? })`
- 回 `WEAVE_READY`

Worker 实现参考：[adapter-offscreen/src/worker.ts](file:///f:/Desktop/workspace/webWorkSpace/canvas-yogo-offscreen/packages/adapter-offscreen/src/worker.ts)

### 更新（WEAVE_PATCH / WEAVE_SET_SCENE）

两种风格：

- `WEAVE_SET_SCENE`：替换整棵 scene tree（结构大改、或首次设置）
- `WEAVE_PATCH`：增量更新（高频更新优先用它）

### 渲染（WEAVE_RENDER）

Worker 端的一帧通常是：

1. `engine.setRoot(scene)`（如果收到了 setScene）
2. `engine.applyPatches(patches)`（如果收到了 patch）
3. `engine.render({ width, height })`（布局 + 产出 DisplayList，逻辑像素）
4. clear
5. `engine.replay(ctx, { dpr })`（回放到 OffscreenCanvas 2D）

## Node：离屏渲染导出 PNG

Node 侧推荐直接用 `@jiujue/weave-app`（避免你自己拼装 measurer / backend）：

- 主路由：[@jiujue/weave-app](/app)
- Node 实现参考：[app/src/node.ts](file:///f:/Desktop/workspace/webWorkSpace/canvas-yogo-offscreen/packages/app/src/node.ts)

简化时序：

1. 创建 backend（由 `@jiujue/weave-adapter-node` 选择 canvas 实现）
2. 创建 `TextMeasurer` 并 `createEngine`
3. `engine.render({ width, height })`
4. replay 到 backend ctx
5. `toPng()`

## DPR 策略（为什么布局用逻辑像素）

- layout 与 DisplayList 统一使用“逻辑像素”，避免 dpr 影响布局数值与缓存 key
- dpr 只在回放阶段处理：canvas 像素尺寸 = 逻辑尺寸 × dpr

## 常见坑位（踩一次就会记住）

- Node 的 `id` 必须稳定：Patch 是按 `id` 定位节点的
- 动画不要频繁 `setScene`：用 Patch 更新点集/文本/样式
- 表格溢出裁剪发生在 table frame 内：给 table 设置固定高度即可看到 clipRect 效果
