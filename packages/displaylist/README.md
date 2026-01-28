# @jiujue/weave-displaylist

Weave 的 DisplayList schema + replay：把 `@jiujue/weave-core` 产出的绘制指令解释执行到任意 `Context2DLike`（浏览器 Canvas2D、OffscreenCanvas、Node canvas 等）。

## 在 Weave 里的位置（分层）

| 层级       | 包                          | 作用                             |
| ---------- | --------------------------- | -------------------------------- |
| 场景数据   | `@jiujue/weave-types`       | Context2DLike / TextStyle 等类型 |
| 引擎核心   | `@jiujue/weave-core`        | 产出 DisplayList                 |
| 绘制回放   | `@jiujue/weave-displaylist` | 把 DisplayList replay 到 context |
| 端到端入口 | `@jiujue/weave-app`         | browser/node 统一入口            |

## 安装

```bash
pnpm add @jiujue/weave-displaylist
```

## 用法

```ts
import { replayDisplayList } from '@jiujue/weave-displaylist'
import type { DisplayList } from '@jiujue/weave-displaylist'

const dl: DisplayList = [
	{ op: 'fillRect', rect: { x: 0, y: 0, width: 100, height: 100 }, style: { color: '#111827' } },
	{ op: 'drawText', text: 'Hello', x: 12, y: 24, style: { fontSize: 16, color: '#fff' } },
]

replayDisplayList(canvas.getContext('2d')!, dl, { dpr: window.devicePixelRatio })
```

## 组合使用（典型方式）

- 端到端：优先用 `@jiujue/weave-app`（内部会调用 replay）
- 引擎直连：`@jiujue/weave-core` 负责 layout/paint，产出 DisplayList；本包负责把 DisplayList 绘制到平台 context
- 跨端：只要平台能提供一个 `Context2DLike` 兼容层，就能复用 DisplayList

## AI / Skills

- [AI_GUIDE.md](./weave/packages/displaylist/AI_GUIDE.md)
- [skills/SKILL.md](./weave/packages/displaylist/skills/SKILL.md)
- [CHANGELOG.md](./weave/packages/displaylist/CHANGELOG.md)

## 相关包

- `@jiujue/weave-core`：产出 DisplayList
- `@jiujue/weave-types`：Context2DLike / 文本与样式类型
