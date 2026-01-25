---
title: TS 项目如何配置 JSX runtime
order: 79
toc: content
---

如果你的项目使用 TypeScript，并希望用 TSX 写 `<container />` 这类“声明式”场景 DSL，可以把 JSX 编译目标指向 `@jiujue/weave-types/jsx-runtime`，从而直接得到 `SceneNode`（不依赖 React）。

## 方式 A：全局 tsconfig 配置（推荐）

在 `tsconfig.json` 里加：

```json
{
	"compilerOptions": {
		"jsx": "react-jsx",
		"jsxImportSource": "@jiujue/weave-types"
	}
}
```

要点：

- `jsx: "react-jsx"` 表示使用 “automatic JSX runtime” 的编译策略（TS 会把 `<container />` 编译成对 `jsx/jsxs` 的调用）
- `jsxImportSource: "@jiujue/weave-types"` 表示把 runtime 的导入源从默认的 `react` 改成 `@jiujue/weave-types`（最终会从 `@jiujue/weave-types/jsx-runtime` / `@jiujue/weave-types/jsx-dev-runtime` 导入）

如果你希望开发模式输出更详细的 JSX 调试信息，可以用：

```json
{
	"compilerOptions": {
		"jsx": "react-jsxdev",
		"jsxImportSource": "@jiujue/weave-types"
	}
}
```

## 最小示例（TSX）

```tsx | pure
/** @jsxImportSource @jiujue/weave-types */
import type { SceneNode } from '@jiujue/weave-types'

export function buildScene(): SceneNode {
	return (
		<container id="root" style={{ padding: 16, flexDirection: 'column', gap: 8 }}>
			<text id="title" textStyle={{ fontSize: 18, fontWeight: 700 }}>
				Hello Weave
			</text>
			<text id="desc" textStyle={{ fontSize: 14, opacity: 0.8 }}>
				This is TSX → SceneNode
			</text>
		</container>
	)
}
```

注意：

- 需要使用 `.tsx` 文件扩展名（`.ts` 默认不解析 JSX）
- 每个元素必须有 `id` 或 `key`，用于稳定节点标识

仓库内可参考：

- Vue3（TSX）：[buildScene.tsx](file:///f:/Desktop/workspace/webWorkSpace/canvas-yogo-offscreen/apps/demo-vue3/src/weave/buildScene.tsx)

## 方式 B：只对单个文件生效（局部开启）

如果你不想改全局 `tsconfig.json`，也可以只在某个文件头部写：

```ts
/** @jsxImportSource @jiujue/weave-types */
```

但前提是工程的 `compilerOptions.jsx` 依然需要是 `react-jsx` 或 `react-jsxdev`（否则 TypeScript 不会走 automatic runtime 的编译路径）。

## 为啥配置里有 “react-jsx”，是不是要装 React？

不需要。

`react-jsx` 只是 TypeScript 对 “automatic JSX runtime” 这种编译模式的命名；配合 `jsxImportSource: "@jiujue/weave-types"` 后，JSX 产物会导入 `@jiujue/weave-types` 的 runtime，而不是导入 `react/jsx-runtime`。
