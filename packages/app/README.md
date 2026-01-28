# @jiujue/weave-app

Weave 的端到端统一入口：把 SceneNode 渲染到浏览器（Worker + OffscreenCanvas）或 Node（离屏导出 PNG）。

## 在 Weave 里的位置（分层）

| 层级       | 包                                                                                                      | 作用                                     |
| ---------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| 场景数据   | `@jiujue/weave-types`                                                                                   | SceneNode/patch/TextMeasurer/JSX runtime |
| 引擎核心   | `@jiujue/weave-core`                                                                                    | Yoga layout + paint + hitTest            |
| 绘制回放   | `@jiujue/weave-displaylist`                                                                             | DisplayList schema + replay              |
| 平台适配   | `@jiujue/weave-adapter-offscreen` / `@jiujue/weave-adapter-node` / `@jiujue/weave-adapter-worker-image` | Worker/Node/图片导出                     |
| 端到端入口 | `@jiujue/weave-app`                                                                                     | 聚合上述能力并提供统一 API               |

## 安装

```bash
pnpm add @jiujue/weave-app
```

## 浏览器用法

```ts
import { createWeaveApp } from '@jiujue/weave-app'

const app = createWeaveApp({
	canvas: document.querySelector('canvas')!,
	clearColor: '#0b1021',
})

app.render()
```

## Node 用法（导出 PNG）

Node 侧需要安装任意一种 canvas 后端：

```bash
pnpm add @napi-rs/canvas
# 或
pnpm add canvas
```

```ts
import { createWeaveApp } from '@jiujue/weave-app'

const app = createWeaveApp({
	width: 800,
	height: 600,
	clearColor: '#ffffff',
})

const png = await app.renderToPng()
app.dispose()
```

## 组合使用（典型方式）

- 场景构建：用 `@jiujue/weave-react` 的 `sceneFromJSX` 或 `@jiujue/weave-types` JSX runtime 生成 `SceneNode`
- 浏览器渲染：`createWeaveApp({ canvas, scene })`（内部用 `adapter-offscreen` + `core` + `displaylist`）
- Node 导出：`createWeaveApp({ width, height, scene }).renderToPng()`（内部用 `adapter-node` + `core` + `displaylist`）
- Worker 图片导出：需要“拿到 PNG 二进制”时，优先用 `@jiujue/weave-adapter-worker-image`

## AI / Skills

- [AI_GUIDE.md](./weave/packages/app/AI_GUIDE.md)
- [skills/SKILL.md](./weave/packages/app/skills/SKILL.md)
- [CHANGELOG.md](./weave/packages/app/CHANGELOG.md)

## 相关 demo

- [weave-demo](./weave/apps/demo/README.md)
- [weave-demo-react](./weave/apps/demo-react/README.md)
- [weave-demo-node](./weave/apps/demo-node/README.md)
