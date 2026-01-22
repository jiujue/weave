---
title: 架构与模块边界
order: 20
toc: content
---

建议先读：仓库根目录的 `docs/ARCHITECTURE.md`、`docs/DATAFLOW.md`，它们是“设计意图”的事实来源。

## 一句话架构

scene tree（纯数据）在主线程/业务侧被构建与更新，通过 Patch（增量）同步到引擎；引擎用 Yoga 做布局，产出 DisplayList；不同平台只需要实现 `Context2DLike` 并调用 replay 即可绘制。

## 分层心智模型（建议记住这张图）

```
           ┌─────────────────────────────┐
           │          App / UI           │
           │  (构建 SceneNode + Patch)   │
           └──────────────┬──────────────┘
                          │  SceneNode / ScenePatch
                          ▼
           ┌─────────────────────────────┐
           │        @jiujue/weave-core          │
           │  scene tree → Yoga → DL     │
           └──────────────┬──────────────┘
                          │  DisplayList
                          ▼
           ┌─────────────────────────────┐
           │     @jiujue/weave-displaylist      │
           │      replay(ctxLike)        │
           └──────────────┬──────────────┘
                          │  Context2DLike
                          ▼
           ┌─────────────────────────────┐
           │     Adapter / Platform      │
           │ (Browser/Worker/Node/...)   │
           └─────────────────────────────┘
```

对应到路由：

- 协议层：[@jiujue/weave-types](/types)
- 引擎层：[@jiujue/weave-core](/core)
- 回放层：[@jiujue/weave-displaylist](/displaylist)
- 平台适配：[@jiujue/weave-adapter-offscreen](/adapter-offscreen) / [@jiujue/weave-adapter-node](/adapter-node)
- 端到端入口：[@jiujue/weave-app](/app)

## 模块清单

- `@jiujue/weave-types`：数据模型与协议（SceneNode / Patch / TextMeasurer / Context2DLike / JSX runtime）
- `@jiujue/weave-core`：核心引擎（维护 scene tree、Yoga layout、产出 DisplayList）
- `@jiujue/weave-displaylist`：DisplayList schema + replay（解释执行到 2D context）
- `@jiujue/weave-adapter-offscreen`：浏览器 Worker 适配（消息协议、OffscreenCanvas、replay）
- `@jiujue/weave-adapter-node`：Node 画布适配（可选后端导出 PNG）
- `@jiujue/weave-app`：端到端统一入口（browser/node createWeaveApp）
- `@jiujue/weave-react`：`sceneFromJSX`（用 React JSX 写场景）

## 两条常见链路

### 1) Browser（OffscreenCanvas + Worker）

```
主线程(UI) ──patch/scene/resize/render──► Worker
Worker ──layout/paint──► DisplayList ──replay──► OffscreenCanvas 2D
```

这条链路的重点是“把 layout + paint 挪到 Worker”，主线程只做业务交互与 Patch 生成。

### 2) Node（离屏渲染导出 PNG）

```
Node(app) ──layout/paint──► DisplayList ──replay──► Node Canvas Backend ──► PNG
```

这条链路的重点是“可复用同一份场景/更新逻辑”，不依赖浏览器运行时。

## 下一步推荐阅读

- 选型：与市面方案对比、为什么选 Weave、是否造轮子：[/guide/selection](/guide/selection)
- 更详细的数据流与时序：[/guide/dataflow](/guide/dataflow)
- Patch 的用法与最佳实践：[/guide/patches](/guide/patches)
- Yoga 布局要点与约束：[/guide/layout](/guide/layout)
- Table 原语与溢出裁剪：[/guide/table](/guide/table)
