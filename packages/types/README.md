# @jiujue/weave-types

Weave 的数据模型与协议层：定义 SceneNode、patch、TextMeasurer、Context2DLike，以及用于“直接产出 SceneNode”的 JSX runtime。

## 在 Weave 里的位置（分层）

| 层级       | 包                          | 作用                                                   |
| ---------- | --------------------------- | ------------------------------------------------------ |
| 场景数据   | `@jiujue/weave-types`       | SceneNode/patch/TextMeasurer/Context2DLike/JSX runtime |
| 引擎核心   | `@jiujue/weave-core`        | Yoga layout + paint + hitTest                          |
| 绘制回放   | `@jiujue/weave-displaylist` | DisplayList schema + replay                            |
| 端到端入口 | `@jiujue/weave-app`         | browser/node 统一入口                                  |

## 安装

```bash
pnpm add @jiujue/weave-types
```

## 作为类型/协议使用

```ts
import type { SceneNode } from '@jiujue/weave-types'

const scene: SceneNode = { id: 'root', type: 'container', children: [] }
```

## JSX runtime（更偏 DSL）

### 方式 A：直接调用 runtime（不依赖 JSX 编译）

```ts
import { jsx, jsxs } from '@jiujue/weave-types/jsx-runtime'

const scene = jsxs('container', {
	id: 'root',
	style: { padding: 16, flexDirection: 'column', gap: 12 },
	children: [
		jsx('text', { id: 't1', textStyle: { fontSize: 16, color: '#111827' }, children: 'Hello' }),
	],
})
```

### 方式 B：在 TS/TSX 里写 JSX（需要配置 jsxImportSource）

```ts
/** @jsxImportSource @jiujue/weave-types */
import type { SceneNode } from '@jiujue/weave-types'

const scene: SceneNode = (
  <container id="root" style={{ padding: 16, flexDirection: 'column' }}>
    <text id="title" textStyle={{ fontSize: 18, color: '#111827' }}>
      Hello Weave
    </text>
  </container>
)
```

## 组合使用（典型方式）

- 浏览器渲染：用本包产出的 `SceneNode` 交给 `@jiujue/weave-app` 或 `@jiujue/weave-core`
- React 项目：若你更喜欢 React JSX 语法与心智模型，用 `@jiujue/weave-react` 的 `sceneFromJSX`（它最终也产出本包的 `SceneNode`）
- 自定义平台：实现 `TextMeasurer` 与 `Context2DLike`，即可让 `@jiujue/weave-core` / `@jiujue/weave-displaylist` 在新平台工作

## AI / Skills

- [AI_GUIDE.md](./weave/packages/types/AI_GUIDE.md)
- [skills/SKILL.md](./weave/packages/types/skills/SKILL.md)
- [CHANGELOG.md](./weave/packages/types/CHANGELOG.md)

## 相关包

- `@jiujue/weave-core`：消费 `SceneNode`，产出 DisplayList
- `@jiujue/weave-displaylist`：消费 DisplayList，replay 到 2D context
- `@jiujue/weave-app`：把端到端链路封装成统一 API
- `@jiujue/weave-react`：React JSX → SceneNode
