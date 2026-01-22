## 项目命名与包名

- 项目名：**Weave**
- 包命名：统一使用 scope `@jiujue/weave-*`
  - `@jiujue/weave-types`
  - `@jiujue/weave-core`
  - `@jiujue/weave-displaylist`
  - `@jiujue/weave-adapter-offscreen`
  - `@jiujue/weave-adapter-node`（可选依赖，不影响 core）

## 目录结构（apps 与 packages 分离）

- `apps/`
  - `apps/demo`：Web 演示（Vite），OffscreenCanvas + Worker
- `packages/`
  - `packages/types` -> `@jiujue/weave-types`
  - `packages/displaylist` -> `@jiujue/weave-displaylist`
  - `packages/core` -> `@jiujue/weave-core`
  - `packages/adapter-offscreen` -> `@jiujue/weave-adapter-offscreen`
  - `packages/adapter-node` -> `@jiujue/weave-adapter-node`

## 核心路线（把你强调的“专业级长期演进点”固化为约束）

- **DisplayList 是一等公民**：
  - `@jiujue/weave-core` 的主输出是 DisplayList，而不是直接画 Canvas。
  - `@jiujue/weave-displaylist` 负责 schema + (de)serialize + replay（解释器）。
- **Yoga 生命周期严格管理**：YogaNode 可复用、dirty 同步、可释放，避免泄漏。
- **TextMeasurer 可注入 + LRU cache**：measure hot path 避免分配。
- **Worker 协议走 patch**：禁止整棵 scene 结构化克隆。
- **DPR 与 Layout 解耦**：Yoga/DisplayList 均使用逻辑像素，replay 统一乘 DPR。

## 包职责（更贴近你给的示例）

### `@jiujue/weave-types`

- Scene 数据模型（Node/Style/Text/Polygon/Container）
- Layout frame 结构（x/y/width/height）
- Worker Patch 协议：add/remove/updateStyle/updateText/reorder
- 渲染抽象：`TextMeasurer`、以及 replay 需要的 `Context2DLike` 最小接口

### `@jiujue/weave-displaylist`

- DisplayList schema（DrawOp/PathCmd）
- `serialize/deserialize`
- `replay(displayList, ctxLike, { dpr })`

### `@jiujue/weave-core`

- scene tree 操作（增删改查、应用 patch）
- Yoga WASM 加载与 layout：
  - LayoutNode：`dirtyStyle/dirtyMeasure`
  - `computeLayout(constraints)`
  - `dispose()`：free YogaNode
- paint：scene + frames -> DisplayList（不做后端绑定）
- 对外 API（建议形态）：
  - `createEngine({ textMeasurer })`
  - `engine.applyPatches(patches)`
  - `engine.layout({ width, height })`
  - `engine.paint() -> DisplayList`
  - `engine.render({ width, height, dpr }) -> DisplayList`（便捷组合）

### `@jiujue/weave-adapter-offscreen`

- Worker 状态机：`INIT -> READY -> RUNNING -> DISPOSED`
- Worker 端：
  - 初始化 Yoga
  - 接收 patch/constraints/dpr
  - 调用 `@jiujue/weave-core` 产出 displayList
  - 在 worker 内直接 `@jiujue/weave-displaylist/replay` 到 OffscreenCanvas 2D ctx
- 主线程 helper：创建 worker、transfer offscreen、发送 patch

### `@jiujue/weave-adapter-node`（可选）

- 可选依赖某个 Node Canvas 实现，提供 `Context2DLike`
- 复用 `@jiujue/weave-displaylist/replay`，实现 `renderToPngBuffer(displayList, options)`
- 重要原则：只做 adapter；core 测试与可用性不依赖它

## DisplayList 最小指令集（先能覆盖：容器/文本/多边形）

- 状态：`save | restore | translate | clipRect`
- 图元：`fillRect | strokeRect | drawText | drawPath`
- Path：`moveTo | lineTo | closePath`

## Text 测量策略（可跑稳 + 可扩展）

- `TextMeasurer.measure(text, style, maxWidth?) -> (width,height, lineMetrics?)`
- core 内置 LRU cache：key = font + size + letterSpacing + text + wrapMode + maxWidth
- Yoga measure callback 里：
  - 只读 cache、尽量复用对象、避免频繁分配

## 落地步骤（确认后我会按此顺序直接开工实现）

1. 初始化 pnpm workspace（Weave）+ TS 基建 + apps/packages 结构
2. 实现 `@jiujue/weave-types`、`@jiujue/weave-displaylist`（含 replay）
3. 实现 `@jiujue/weave-core`：Yoga layout 生命周期 + paint 输出 displayList + patch 应用
4. 实现 `@jiujue/weave-adapter-offscreen` + `apps/demo`：Offscreen worker 跑通闭环
5. 加入测试：layout 数值断言 + paint 输出 displayList 断言（不依赖浏览器）
6. （可选）实现 `@jiujue/weave-adapter-node`（只作为额外能力）

你确认这版计划后，我会开始创建这些包与 demo，并把 OffscreenCanvas + Yoga 排版 +（文本/容器/多边形）渲染跑通并验证。
