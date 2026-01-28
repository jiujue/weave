# Weave

OffscreenCanvas + Yoga 布局 + DisplayList 的可演进渲染引擎实验项目。

GitHub：`https://github.com/jiujue/weave`

## AI / Skills（仓库级）

- [AI_GUIDE.md](./weave/AI_GUIDE.md)
- [skills/SKILL.md](./weave/skills/SKILL.md)

## 你能从这个仓库获得什么

- 一个“布局与绘制解耦”的渲染内核：scene tree（数据）→ Yoga layout（几何）→ DisplayList（绘制指令）→ replay（平台适配）
- 两条端到端链路：
  - 浏览器：主线程 UI + OffscreenCanvas Worker 渲染
  - Node：离屏渲染导出 PNG
- 两套场景构建方式并存且可对照：
  - `sceneFromJSX`：用 React JSX 写场景，再转换为 `SceneNode`（更简单）
  - `@jiujue/weave-types` JSX runtime：直接产出 `SceneNode`（更强类型/更接近编译期 DSL）
- Table 原语：分组表头、对齐、固定高度裁剪（overflow hidden）

## 包（packages）

| 包名                                 | 定位                                       | README                                                       | AI Guide                                                         | Skill                                                             | Changelog                                                          |
| ------------------------------------ | ------------------------------------------ | ------------------------------------------------------------ | ---------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| `@jiujue/weave-types`                | 数据模型与协议 + JSX runtime               | [README.md](./weave/packages/types/README.md)                | [AI_GUIDE.md](./weave/packages/types/AI_GUIDE.md)                | [SKILL.md](./weave/packages/types/skills/SKILL.md)                | [CHANGELOG.md](./weave/packages/types/CHANGELOG.md)                |
| `@jiujue/weave-core`                 | 引擎核心：layout/paint/hitTest             | [README.md](./weave/packages/core/README.md)                 | [AI_GUIDE.md](./weave/packages/core/AI_GUIDE.md)                 | [SKILL.md](./weave/packages/core/skills/SKILL.md)                 | [CHANGELOG.md](./weave/packages/core/CHANGELOG.md)                 |
| `@jiujue/weave-displaylist`          | DisplayList schema + replay                | [README.md](./weave/packages/displaylist/README.md)          | [AI_GUIDE.md](./weave/packages/displaylist/AI_GUIDE.md)          | [SKILL.md](./weave/packages/displaylist/skills/SKILL.md)          | [CHANGELOG.md](./weave/packages/displaylist/CHANGELOG.md)          |
| `@jiujue/weave-adapter-offscreen`    | 浏览器 Worker + OffscreenCanvas 适配       | [README.md](./weave/packages/adapter-offscreen/README.md)    | [AI_GUIDE.md](./weave/packages/adapter-offscreen/AI_GUIDE.md)    | [SKILL.md](./weave/packages/adapter-offscreen/skills/SKILL.md)    | [CHANGELOG.md](./weave/packages/adapter-offscreen/CHANGELOG.md)    |
| `@jiujue/weave-adapter-worker-image` | Worker 渲染输出 PNG（二进制）              | [README.md](./weave/packages/adapter-worker-image/README.md) | [AI_GUIDE.md](./weave/packages/adapter-worker-image/AI_GUIDE.md) | [SKILL.md](./weave/packages/adapter-worker-image/skills/SKILL.md) | [CHANGELOG.md](./weave/packages/adapter-worker-image/CHANGELOG.md) |
| `@jiujue/weave-adapter-node`         | Node 画布适配 + 导出 PNG                   | [README.md](./weave/packages/adapter-node/README.md)         | [AI_GUIDE.md](./weave/packages/adapter-node/AI_GUIDE.md)         | [SKILL.md](./weave/packages/adapter-node/skills/SKILL.md)         | [CHANGELOG.md](./weave/packages/adapter-node/CHANGELOG.md)         |
| `@jiujue/weave-devtools-runtime`     | DevTools hook/runtime                      | [README.md](./weave/packages/devtools-runtime/README.md)     | [AI_GUIDE.md](./weave/packages/devtools-runtime/AI_GUIDE.md)     | [SKILL.md](./weave/packages/devtools-runtime/skills/SKILL.md)     | [CHANGELOG.md](./weave/packages/devtools-runtime/CHANGELOG.md)     |
| `@jiujue/weave-react`                | React 绑定：`sceneFromJSX`                 | [README.md](./weave/packages/react/README.md)                | [AI_GUIDE.md](./weave/packages/react/AI_GUIDE.md)                | [SKILL.md](./weave/packages/react/skills/SKILL.md)                | [CHANGELOG.md](./weave/packages/react/CHANGELOG.md)                |
| `@jiujue/weave-editor-core`          | 编辑器内核：状态/注册/代码生成             | [README.md](./weave/packages/editor-core/README.md)          | [AI_GUIDE.md](./weave/packages/editor-core/AI_GUIDE.md)          | [SKILL.md](./weave/packages/editor-core/skills/SKILL.md)          | [CHANGELOG.md](./weave/packages/editor-core/CHANGELOG.md)          |
| `@jiujue/weave-app`                  | 端到端入口：createWeaveApp（browser/node） | [README.md](./weave/packages/app/README.md)                  | [AI_GUIDE.md](./weave/packages/app/AI_GUIDE.md)                  | [SKILL.md](./weave/packages/app/skills/SKILL.md)                  | [CHANGELOG.md](./weave/packages/app/CHANGELOG.md)                  |

## 应用（apps）

| 应用                      | 用途                                    | README                                                 | 运行                                  |
| ------------------------- | --------------------------------------- | ------------------------------------------------------ | ------------------------------------- |
| `apps/demo`               | 浏览器 demo（Worker + OffscreenCanvas） | [README.md](./weave/apps/demo/README.md)               | `pnpm dev`                            |
| `apps/demo-react`         | React demo（对照两种场景构建方式）      | [README.md](./weave/apps/demo-react/README.md)         | `pnpm dev:react`                      |
| `apps/demo-vue3`          | Vue3 demo（worker-image 适配）          | [README.md](./weave/apps/demo-vue3/README.md)          | `pnpm dev:vue3`                       |
| `apps/demo-node`          | Node demo（离屏导出 PNG）               | [README.md](./weave/apps/demo-node/README.md)          | `pnpm -C apps/demo-node render`       |
| `apps/builder-react`      | 编辑器原型（React）                     | [README.md](./weave/apps/builder-react/README.md)      | `pnpm -C apps/builder-react dev`      |
| `apps/docs-dumi`          | 文档站点（dumi）                        | [README.md](./weave/apps/docs-dumi/README.md)          | `pnpm docs`                           |
| `apps/devtools-extension` | DevTools 扩展（Plasmo）                 | [README.md](./weave/apps/devtools-extension/README.md) | `pnpm -C apps/devtools-extension dev` |

## 作为库使用（快速示例）

### 浏览器

```ts
import { createWeaveApp } from '@jiujue/weave-app'

const app = createWeaveApp({
	canvas: document.querySelector('canvas')!,
	clearColor: '#0b1021',
})

app.render()
```

### Node（导出 PNG）

```ts
import { createWeaveApp } from '@jiujue/weave-app'

const app = createWeaveApp({
	width: 800,
	height: 600,
	clearColor: '#ffffff',
})

const png = await app.renderToPng()
```

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

- 以“分层 + 组合”为中心的 monorepo：`packages` 提供可发布模块，`apps` 提供可运行示例与工具。

## 文档入口

文档集中在 `docs/`，README 仅做索引。

- 架构与模块边界：docs/ARCHITECTURE.md
- 数据流向与协议：docs/DATAFLOW.md
- 设计原则与演进路线：docs/DESIGN.md
- 开发指南：docs/DEVELOPMENT.md
- 维护与扩展：docs/MAINTENANCE.md
