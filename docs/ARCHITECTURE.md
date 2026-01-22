# 项目架构

## 目标与边界

- 目标：把“排版”和“绘制”拆开，让渲染能力在不同运行时（Worker/Node）复用。
- 目标：DisplayList 一等公民（可序列化、可回放、可测试）。
- 目标：场景结构是纯数据（可结构化克隆，跨线程/跨进程传递）。
- 非目标：不做 DOM 兼容，不做 CSS 全量实现；当前优先覆盖 container/text/polygon/table。

## 总体分层

从上到下按职责分层：

- Scene（数据层）：`SceneNode` 树 + `ScenePatch` 增量协议（`@jiujue/weave-types`）
- Layout（几何层）：Yoga 计算每个节点的 `frame`（`@jiujue/weave-core`）
- Paint（绘制层）：scene + frames → DisplayList（`@jiujue/weave-core`）
- Backend（平台层）：DisplayList replay 到具体 2D context（`@jiujue/weave-displaylist` + adapter）

典型链路：

- Browser：UI(main thread) → Worker(Offscreen) → core(render) → displaylist(replay) → OffscreenCanvas 2D
- Node：node(app) → core(render) → displaylist(replay) → node canvas backend → PNG

## Monorepo 包职责

### @jiujue/weave-types（数据模型与协议）

- `SceneNode`：container/text/polygon/table 等节点联合类型与样式模型
- `ScenePatch`：增量更新协议（包含 table 专用 patch）
- `TextMeasurer`：文字测量接口（由运行时注入）
- `Context2DLike`：replay 所需的最小 2D API 抽象
- `@jiujue/weave-types/jsx-runtime`：非 React 的 JSX runtime（直接产出 `SceneNode`）

### @jiujue/weave-core（引擎）

- 维护 scene tree 与 id 索引
- Yoga 生命周期管理：创建/复用/dirty 同步/释放
- `layout(constraints)`：计算节点几何
- `paint()`：scene + frames → DisplayList
- `render(constraints)`：layout + paint 的便捷组合

### @jiujue/weave-displaylist（绘制指令集）

- DisplayList schema（DrawOp/PathCmd）
- serialize/deserialize
- replay(displayList, ctxLike, { dpr })：解释执行到 2D context

### @jiujue/weave-adapter-offscreen（浏览器 Worker 适配）

- 主线程 client：transfer OffscreenCanvas、发送消息（init/resize/render/patch/setScene）
- Worker 端：创建引擎、注入 TextMeasurer、生成 DisplayList 并 replay 到 OffscreenCanvas 2D

### @jiujue/weave-adapter-node（Node 适配）

- Node 侧提供 `Context2DLike` 与 PNG 导出能力（依赖可选后端：@napi-rs/canvas 或 canvas）

### @jiujue/weave-app（统一入口）

- `createWeaveApp()`：根据参数形态返回 browser 或 node app
- 对应用层隐藏适配细节：setScene/applyPatches/resize/render(or renderToPng)

### @jiujue/weave-react（React JSX 转 SceneNode）

- `sceneFromJSX(ReactNode): SceneNode`：把 ReactElement 树转换为 `@jiujue/weave-types` 的纯对象 scene tree
- 不参与渲染/worker/engine：只负责“输入为 React JSX，输出为 SceneNode”

## 两套场景构建方式（为何并存）

### 1) sceneFromJSX（更简单）

- 适合：React 项目里“顺手写 JSX”，再交给 Weave 引擎渲染
- 优点：不需要切换 `jsxImportSource`，React 组件里能自然使用
- 代价：类型约束主要来自你写的 `JSX.IntrinsicElements` 声明与运行时校验

### 2) @jiujue/weave-types JSX runtime（更强类型）

- 适合：把 Weave 当作 DSL 使用（TSX 编译期直接产出 SceneNode）
- 优点：更接近“SceneNode 作为编译期产物”，更可控、更强约束
- 代价：需要在文件/tsconfig 配置 `jsxImportSource: @jiujue/weave-types`

## Table 原语（为什么不是用 container 拼）

- Table 是单节点原语：避免为每个 cell 创建 Yoga 节点，降低布局与 patch 的复杂度
- 引擎内部处理：列宽、分组表头（rowSpan/colSpan）、网格线、对齐、固定高度裁剪
