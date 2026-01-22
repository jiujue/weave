---
title: DevTools（浏览器扩展）
order: 35
toc: content
---

本页描述 Weave 的 DevTools 扩展能力：在浏览器 DevTools 面板中查看场景树（SceneNode tree）、查看节点属性，并支持在页面中高亮与拾取（inspect）。

## 能力边界

- 这不是 DOM/React 组件检查器。
- “组件树”对应的是 Weave 的 `SceneNode` 场景树：`container/text/polygon/table` 等。
- 节点属性展示的是 `SceneNode` 上的字段（`style/paint/text/textStyle/...`）。

## 功能列表

- 实例发现：同一页面可存在多个 Weave canvas 实例，面板可切换实例查看
- 场景树：展示 `SceneNode` tree，并显示“组件名 + id”
- 属性查看：选中节点后展示节点 JSON（含 `style/paint/text/tableStyle/...`）
- 高亮：选中节点后在页面中绘制高亮框
- Inspect：点击 “Inspect” 后在页面悬停/点击拾取节点并联动面板选择

## 如何开启

默认不暴露调试能力。需要在创建 app 时显式开启：

```ts
import { createWeaveApp } from '@jiujue/weave-app'

const app = createWeaveApp({
	canvas,
	scene,
	devtools: { enabled: true, name: 'My Weave Canvas' }
})
```

开启后，运行时会注册一个全局 hook 供扩展发现实例。

## 使用 @jiujue/weave-devtools-runtime（createEngine 直连）

如果你不走 `@jiujue/weave-app`（例如直接 `createEngine + replay(canvas)`，或自定义 adapter），可以直接用 `@jiujue/weave-devtools-runtime` 把实例注册到 `window.__WEAVE_DEVTOOLS_HOOK__`，并用一个“scene mirror”维护最新的 scene tree（供面板拉取与按 id 查询）。

关键点：

- `attachWeaveDevtools(...)`：注册实例 + 事件订阅（`render/setScene/applyPatches/...`）
- `createSceneMirror(...)`：在主线程维护 `SceneNode` 的最新快照，并支持 `getNodeById`
- 在你调用 `setScene/applyPatches/render/resize` 的时机，同步调用 `devtools.emit(...)`

最小示例（直接 `createEngine`）：

```ts
import { createEngine } from '@jiujue/weave-core'
import {
	attachWeaveDevtools,
	createSceneMirror
} from '@jiujue/weave-devtools-runtime'
import type { SceneNode, ScenePatch, TextMeasurer } from '@jiujue/weave-types'

export async function run(
	canvas: HTMLCanvasElement,
	root: SceneNode,
	textMeasurer: TextMeasurer
) {
	const sceneMirror = createSceneMirror(null)
	let engine: Awaited<ReturnType<typeof createEngine>> | null = null

	const devtools = attachWeaveDevtools({
		enabled: true,
		name: 'My createEngine canvas',
		canvas,
		getScene: sceneMirror.getScene,
		getNodeById: sceneMirror.getNodeById,
		hitTest: async (x: number, y: number) => {
			if (!engine) return { id: null, path: [] }
			return engine.hitTest({ x, y })
		},
		getNodeInfo: async (id: string) => {
			if (!engine) return null
			return engine.getNodeInfo(id)
		}
	})

	sceneMirror.setScene(root)
	devtools.emit({ type: 'setScene', time: Date.now() })

	engine = await createEngine({ root, textMeasurer })

	const width = canvas.clientWidth
	const height = canvas.clientHeight
	const dpr = globalThis.devicePixelRatio || 1
	engine.render({ width, height })
	devtools.emit({ type: 'render', time: Date.now() })

	devtools.emit({ type: 'resize', time: Date.now(), width, height, dpr })

	const patches: ScenePatch[] = []
	if (patches.length > 0) {
		sceneMirror.applyPatches(patches)
		devtools.emit({
			type: 'applyPatches',
			time: Date.now(),
			count: patches.length
		})
		engine.applyPatches(patches)
	}

	return {
		dispose() {
			engine?.dispose()
			devtools.dispose()
			engine = null
		}
	}
}
```

## 如何加载扩展（开发模式）

扩展工程在 `apps/devtools-extension`。

- 开发（热更新）：`pnpm -C apps/devtools-extension dev`
- 构建（用于 Load unpacked）：`pnpm -C apps/devtools-extension build`
- Chrome 加载：
  - 打开 `chrome://extensions` 并开启开发者模式
  - Load unpacked → 选择 `apps/devtools-extension/build/chrome-mv3-dev`
  - 打开目标页面的 DevTools → 选择 `Weave` 面板

如果你在开发过程中 Reload 扩展（或 Plasmo 热更新触发扩展重载）后遇到面板无响应、或控制台出现 `Uncaught Error: Extension context invalidated`：

- 刷新目标页面（或重新打开目标页面的 DevTools）即可恢复
- 仍不行时，重新 Load unpacked 一次扩展目录

## 场景命名（显示“组件名 + id”）

Weave 的 `SceneNode` 支持可选字段：

- `name?: string`：用于 DevTools 树展示（优先级最高）
- `label?: string`：辅助展示字段
- `meta?: Record<string, unknown>`：承载扩展信息（不会影响布局与绘制）

在 JSX 构建链路里，`displayName` 会被自动写入到 `SceneNode.name`（并且 `name` 本身也可直接传入）。

示例（TS automatic JSX runtime）：

```tsx | pure
export function Scene() {
	return (
		<container id='root' displayName='Page'>
			<text
				id='title'
				displayName='Title'
				textStyle={{ fontSize: 20, color: '#111' }}
			>
				Hello
			</text>
		</container>
	)
}
```

## 全局 Hook（v1）

- 全局变量：`window.__WEAVE_DEVTOOLS_HOOK__`
- 版本字段：`version: 1`
- 主要能力：
  - `list()`：列出实例（id/name）
  - `get(id)`：获取实例对象
  - `subscribe(listener)`：实例列表变化订阅

实例对象（v1）提供的只读 API（用于扩展面板）：

- `getScene()`：返回最新场景树（需要应用侧调用过 `setScene/applyPatches`）
- `getNodeById(id)`：按 id 查节点
- `hitTest(x,y)`：画布坐标命中测试
- `getNodeInfo(id)`：获取节点布局框（用于高亮）

## 扩展的数据流（简述）

- DevTools Panel 通过 background 将请求发到 content script
- content script 通过 window.postMessage 与 main world bridge 交互
- main world bridge 访问 `__WEAVE_DEVTOOLS_HOOK__`，调用实例 API，并返回结果
- content script 在页面绘制 overlay（高亮框），panel 渲染树与属性

## 安全建议

- 仅在开发环境开启 `devtools.enabled`。
- 生产环境默认关闭，避免向页面暴露场景数据与命中能力。

## 常见问题

### 面板没有发现实例

- 确认应用侧已开启 `devtools: { enabled: true }`
- Reload 扩展后刷新目标页面（扩展重载会让旧的 content script 失效）
- 在目标页面 Console 里验证是否有 hook：

```js
window.__WEAVE_DEVTOOLS_HOOK__?.list?.()
```
