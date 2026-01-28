# @jiujue/weave-adapter-node

Weave 的 Node 适配：在 Node 环境创建 2D context，并提供导出 PNG 的能力。

## 在 Weave 里的位置（分层）

| 层级       | 包                           | 作用                             |
| ---------- | ---------------------------- | -------------------------------- |
| 场景数据   | `@jiujue/weave-types`        | SceneNode/patch/TextMeasurer     |
| 引擎核心   | `@jiujue/weave-core`         | layout + paint                   |
| 绘制回放   | `@jiujue/weave-displaylist`  | replay 到 Node canvas 2D context |
| 平台适配   | `@jiujue/weave-adapter-node` | 创建 Node canvas + 导出 PNG      |
| 端到端入口 | `@jiujue/weave-app`          | Node 侧默认使用本适配            |

## 安装

```bash
pnpm add @jiujue/weave-adapter-node
```

需要安装任意一种 canvas 后端：

```bash
pnpm add @napi-rs/canvas
# 或
pnpm add canvas
```

## 用法

```ts
import { renderDisplayListToPng } from '@jiujue/weave-adapter-node'
import type { DisplayList } from '@jiujue/weave-displaylist'

const displayList: DisplayList = []

const png = await renderDisplayListToPng(displayList, {
	width: 800,
	height: 600,
	dpr: 2,
	clearColor: '#ffffff',
})
```

更推荐走端到端入口：`@jiujue/weave-app` 的 `createWeaveApp({ width, height, ... })` + `renderToPng()`。

## 组合使用（典型方式）

- 端到端导出：`@jiujue/weave-app`（推荐，API 更简单）
- 自己驱动：`@jiujue/weave-core` 产出 DisplayList → 本包 renderToPng

## AI / Skills

- [AI_GUIDE.md](./AI_GUIDE.md)
- [skills/SKILL.md](./skills/SKILL.md)
- [CHANGELOG.md](./CHANGELOG.md)

## 相关 demo

- [weave-demo-node](../../apps/demo-node/README.md)
