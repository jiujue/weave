# Weave

OffscreenCanvas + Yoga 布局 + DisplayList 的可演进渲染引擎实验项目。

## 你能从这个仓库获得什么

- 一个“布局与绘制解耦”的渲染内核：scene tree（数据）→ Yoga layout（几何）→ DisplayList（绘制指令）→ replay（平台适配）
- 两条端到端链路：
  - 浏览器：主线程 UI + OffscreenCanvas Worker 渲染
  - Node：离屏渲染导出 PNG
- 两套场景构建方式并存且可对照：
  - `sceneFromJSX`：用 React JSX 写场景，再转换为 `SceneNode`（更简单）
  - `@jiujue/weave-types` JSX runtime：直接产出 `SceneNode`（更强类型/更接近编译期 DSL）
- Table 原语：分组表头、对齐、固定高度裁剪（overflow hidden）

## 快速开始

### 安装与构建

```bash
pnpm install
pnpm -r build
```

### 运行浏览器 demo（Worker + OffscreenCanvas）

```bash
pnpm dev
```

### 运行 React demo（同时分开展示两种场景构建方式）

```bash
pnpm dev:react
```

### 运行 Node demo（生成两张 PNG：两种构建方式）

```bash
pnpm -C apps/demo-node render
```

## 仓库结构

- `apps/demo`：浏览器演示（Worker + OffscreenCanvas），分屏展示两种构建方式
- `apps/demo-react`：React 控制数据与表单，右侧分屏展示两种构建方式
- `apps/demo-node`：Node 离屏渲染导出 PNG（两种构建方式各一张图）
- `packages/types`：数据模型与协议（SceneNode/patch/TextMeasurer/Context2DLike/JSX runtime）
- `packages/core`：核心引擎（维护 scene tree、Yoga layout、产出 DisplayList）
- `packages/displaylist`：DisplayList schema + replay（解释执行到 2D context）
- `packages/adapter-offscreen`：浏览器 Worker 适配（消息协议、OffscreenCanvas、replay）
- `packages/adapter-node`：Node 画布适配（可选后端导出 PNG）
- `packages/app`：端到端的统一入口（browser/node createWeaveApp）

## 文档入口

文档集中在 `docs/`，README 仅做索引。

- 架构与模块边界：docs/ARCHITECTURE.md
- 数据流向与协议：docs/DATAFLOW.md
- 设计原则与演进路线：docs/DESIGN.md
- 开发指南：docs/DEVELOPMENT.md
- 维护与扩展：docs/MAINTENANCE.md
