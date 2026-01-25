---
title: JS 项目如何使用 JSX runtime
order: 80
toc: content
---

如果你的项目是纯 JS（不使用 TypeScript），依然可以使用 `@jiujue/weave-types/jsx-runtime` 来生成 `SceneNode`。有两种方式：

如果你的项目是 TypeScript（TS/TSX），可参考：[/guide/jsx-runtime-ts](/guide/jsx-runtime-ts)。

## 方式 A：不写 JSX，直接调用 runtime（最通用）

这种方式不依赖任何 JSX 编译配置（适用于 React/Vue/任意框架，甚至 Node）。

核心就是：

```js | pure
import { jsx, jsxs } from '@jiujue/weave-types/jsx-runtime'

const scene = jsxs('container', {
	id: 'root',
	style: { padding: 24, flexDirection: 'column', gap: 12 },
	children: [jsx('text', { id: 't1', textStyle: { fontSize: 16 }, children: 'Hello' })],
})
```

仓库内可参考两个完整例子：

- React（JS）：[Scene.runtime.js](file:///f:/Desktop/workspace/webWorkSpace/canvas-yogo-offscreen/apps/demo-react/src/weave-scene/Scene.runtime.js)
- Vue3（JS）：[buildScene.runtime.js](file:///f:/Desktop/workspace/webWorkSpace/canvas-yogo-offscreen/apps/demo-vue3/src/weave/buildScene.runtime.js)

## 方式 B：在 JS 文件里写 JSX（需要 bundler 配置）

如果你想用更“声明式”的写法（`<container />`），需要让构建工具把 JSX 编译到 `@jiujue/weave-types/jsx-runtime`。

**Vite（推荐）**

- 如果你的工程本身不使用 React JSX（例如只是在普通 `.jsx` 文件里写场景 DSL），可以在 `vite.config.js/ts` 里全局设置：

```ts | pure
export default defineConfig({
	esbuild: {
		jsx: 'automatic',
		jsxImportSource: '@jiujue/weave-types',
	},
})
```

然后你就可以在 `.jsx`/`.tsx` 里写：

```jsx | pure
const scene = (
	<container id="root">
		<text id="t1">Hello</text>
	</container>
)
```

如果你的工程是 React（UI 本身大量用 JSX），不建议全局把 `jsxImportSource` 改成 `@jiujue/weave-types`，否则 React 组件的 JSX 也会被编译成 `SceneNode`，容易出现运行时异常（包括你看到的 `Cannot use 'in' operator to search for 'default' in undefined`）。

这类工程更推荐“只对场景文件生效”：

1. `vite.config.ts` 里只保证是 automatic runtime（通常默认就是）

```ts | pure
export default defineConfig({
	esbuild: { jsx: 'automatic' },
})
```

2. 在你的场景文件头部加注解（只影响该文件）

```jsx | pure
/** @jsxImportSource @jiujue/weave-types */

export const scene = (
	<container id="root">
		<text id="t1">Hello</text>
	</container>
)
```

**Babel（React 工程常见）**

- 让 JSX automatic runtime 的 importSource 指向 `@jiujue/weave-types`
- 或者在单文件头部加 `@jsxImportSource` 注解（只影响该文件）
