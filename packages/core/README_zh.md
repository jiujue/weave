# @jiujue/weave-core

Weave 的核心引擎：负责维护场景树、使用 Yoga 进行布局、产出绘制指令 DisplayList，并支持命中测试（hitTest）与节点信息查询。

## 在 Weave 里的位置（分层）

| 层级       | 包                          | 作用                           |
| ---------- | --------------------------- | ------------------------------ |
| 场景数据   | `@jiujue/weave-types`       | SceneNode/patch/TextMeasurer   |
| 引擎核心   | `@jiujue/weave-core`        | Yoga 布局 + 绘制产出 + hitTest |
| 绘制回放   | `@jiujue/weave-displaylist` | DisplayList schema + replay    |
| 端到端入口 | `@jiujue/weave-app`         | browser/node 统一入口          |

## 安装

```bash
pnpm add @jiujue/weave-core
```

## 最小化用法 (Canvas 2D)

`createEngine` 只依赖 `TextMeasurer` 接口，不绑定具体平台；在浏览器端可以用临时 canvas 做测量。

```ts
import { createEngine } from '@jiujue/weave-core'
import type { TextMeasurer, TextStyle } from '@jiujue/weave-types'
import { replayDisplayList } from '@jiujue/weave-displaylist'

function fontFromTextStyle(style: TextStyle): string {
	const weight = style.fontWeight ?? 'normal'
	const fontStyle = style.fontStyle ?? 'normal'
	const size = style.fontSize
	const family = style.fontFamily ?? 'sans-serif'
	return `${fontStyle} ${weight} ${size}px ${family}`
}

function createBrowserTextMeasurer(): TextMeasurer {
	const canvas = document.createElement('canvas')
	const ctx = canvas.getContext('2d')!
	return {
		measure({ text, style }) {
			ctx.font = fontFromTextStyle(style)
			const width = Math.ceil(ctx.measureText(text).width)
			const lineHeight = style.lineHeight ?? Math.ceil(style.fontSize * 1.2)
			return { width, height: lineHeight, lineHeight }
		},
	}
}

const engine = await createEngine({ textMeasurer: createBrowserTextMeasurer() })
engine.setRoot({ id: 'root', type: 'container', children: [] })

const displayList = engine.render({ width: 360, height: 240 })
replayDisplayList(document.querySelector('canvas')!.getContext('2d')!, displayList, {
	dpr: window.devicePixelRatio,
})
```

## 组合使用（典型方式）

- 端到端：优先用 `@jiujue/weave-app`（内部会创建并驱动引擎）
- “只用引擎”：直接用本包 `createEngine`（需自备 `TextMeasurer`、自行驱动 render 并把 DisplayList replay 到目标平台）
- 场景构建：用 `@jiujue/weave-types` JSX runtime 或 `@jiujue/weave-react` 的 `sceneFromJSX` 产出 `SceneNode`

## AI / Skills

- [AI_GUIDE.md](./AI_GUIDE.md)
- [skills/SKILL.md](./skills/SKILL.md)
- [CHANGELOG.md](./CHANGELOG.md)

## 相关包

- `@jiujue/weave-types`：SceneNode/patch/TextMeasurer/Context2DLike
- `@jiujue/weave-displaylist`：DisplayList schema + replay
- `@jiujue/weave-app`：端到端入口（浏览器/Node）
