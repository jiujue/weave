# @jiujue/weave-adapter-offscreen

Weave 的 OffscreenCanvas 适配：把引擎运行在 Web Worker 中，通过消息协议与主线程通信。

## 在 Weave 里的位置（分层）

| 层级       | 包                                | 作用                                 |
| ---------- | --------------------------------- | ------------------------------------ |
| 场景数据   | `@jiujue/weave-types`             | SceneNode/patch/TextMeasurer         |
| 引擎核心   | `@jiujue/weave-core`              | layout + paint                       |
| 绘制回放   | `@jiujue/weave-displaylist`       | replay 到 OffscreenCanvas 2D context |
| 平台适配   | `@jiujue/weave-adapter-offscreen` | Worker 协议 + 生命周期 + 渲染驱动    |
| 端到端入口 | `@jiujue/weave-app`               | 浏览器侧默认使用本适配               |

## 安装

```bash
pnpm add @jiujue/weave-adapter-offscreen
```

## 协议（Protocol）

该适配层使用基于消息的协议在主线程与 Worker 间通信。

### Requests (Main -> Worker)

- `WEAVE_INIT`: Initialize the engine.
- `WEAVE_PATCH`: Send scene updates (patches).
- `WEAVE_SET_SCENE`: Replace the entire scene.
- `WEAVE_RESIZE`: Update canvas dimensions.
- `WEAVE_RENDER`: Request a render frame.
- `WEAVE_HIT_TEST`: Request a hit test at specific coordinates.
  - Payload: `{ type: 'WEAVE_HIT_TEST', requestId: number, x: number, y: number }`

### Responses (Worker -> Main)

- `WEAVE_READY`: Engine is initialized.
- `WEAVE_ERROR`: An error occurred.
- `WEAVE_HIT_TEST_RESULT`: Response to hit test.
  - Payload: `{ type: 'WEAVE_HIT_TEST_RESULT', requestId: number, result: { id: string, path: string[] } | null }`

## 用法

```typescript
import { createOffscreenClient } from '@jiujue/weave-adapter-offscreen'

const client = createOffscreenClient({
  canvas: document.querySelector('canvas'),
  worker: new Worker(...)
})

// Async Hit Test
const result = await client.hitTest(100, 100)
```

更推荐走端到端入口：`@jiujue/weave-app`（浏览器侧默认即 Worker + OffscreenCanvas）。

## 组合使用（典型方式）

- 端到端：`@jiujue/weave-app`（浏览器）内部已集成本适配，通常不需要直接依赖
- 只需要 Worker 协议：你可以直接使用本包的 client/worker 来接入自定义 Worker 管理方式

## AI / Skills

- [AI_GUIDE.md](./weave/packages/adapter-offscreen/AI_GUIDE.md)
- [skills/SKILL.md](./weave/packages/adapter-offscreen/skills/SKILL.md)
- [CHANGELOG.md](./weave/packages/adapter-offscreen/CHANGELOG.md)

## 相关 demo

- [weave-demo](./weave/apps/demo/README.md)
