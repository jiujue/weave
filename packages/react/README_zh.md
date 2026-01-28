# @jiujue/weave-react

提供 `sceneFromJSX`：把 React JSX（intrinsic elements）转换为 `@jiujue/weave-types` 的 `SceneNode`（纯数据）。

## 在 Weave 里的位置（分层）

| 层级              | 包                    | 作用                        |
| ----------------- | --------------------- | --------------------------- |
| 场景构建（React） | `@jiujue/weave-react` | React JSX → SceneNode       |
| 场景数据          | `@jiujue/weave-types` | SceneNode/patch/JSX runtime |
| 端到端渲染        | `@jiujue/weave-app`   | browser/node 统一入口       |
| 引擎核心          | `@jiujue/weave-core`  | layout + paint + hitTest    |

## 安装

```bash
pnpm add @jiujue/weave-react
```

## 用法

```tsx
import React from 'react'
import { sceneFromJSX } from '@jiujue/weave-react'
import type { SceneNode } from '@jiujue/weave-types'

const Text = 'text' as any

const scene: SceneNode = sceneFromJSX(
	<container id="root" style={{ width: 360, padding: 16, flexDirection: 'column' }}>
		<Text id="title" textStyle={{ fontSize: 18, color: '#e6e6e6' }}>
			Hello Weave
		</Text>
	</container>,
)
```

## 约束

- 只支持 intrinsic elements（如 `<container />`、`<text />`）
- 不要传入函数组件/类组件（例如 `<MyScene />`），否则会抛错

## 组合使用（典型方式）

- React 项目里“写场景”：用本包 `sceneFromJSX` 得到 `SceneNode`
- 交给引擎渲染：`SceneNode` → `@jiujue/weave-app`（浏览器/Node）或 `@jiujue/weave-core`（自定义驱动）
- 若你更偏 DSL/强类型：改用 `@jiujue/weave-types` JSX runtime（它是“编译后产物”形态，适合 TS/TSX）

## AI / Skills

- [AI_GUIDE.md](./AI_GUIDE.md)
- [skills/SKILL.md](./skills/SKILL.md)
- [CHANGELOG.md](./CHANGELOG.md)

## 相关包

- `@jiujue/weave-types`：SceneNode/类型定义/JSX runtime
- `@jiujue/weave-app`：端到端渲染入口（浏览器/Node）
- `@jiujue/weave-core`：引擎核心（layout/paint）
