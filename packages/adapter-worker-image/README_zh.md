# @jiujue/weave-adapter-worker-image

把 Weave 渲染放到 Worker 里执行，并把渲染结果（PNG 二进制）回传主线程。适合“离屏渲染生成图片”的场景（报表、导出、缩略图等）。

## 在 Weave 里的位置（分层）

| 层级       | 包                                   | 作用                                       |
| ---------- | ------------------------------------ | ------------------------------------------ |
| 场景数据   | `@jiujue/weave-types`                | SceneNode/patch/TextMeasurer               |
| 引擎核心   | `@jiujue/weave-core`                 | layout + paint                             |
| 绘制回放   | `@jiujue/weave-displaylist`          | replay 到 OffscreenCanvas 2D context       |
| 平台适配   | `@jiujue/weave-adapter-worker-image` | Worker 渲染并回传 PNG                      |
| 端到端入口 | `@jiujue/weave-app`                  | 适合“画到 canvas”；需要 PNG 二进制时用本包 |

## 安装

```bash
pnpm add @jiujue/weave-adapter-worker-image
```

## 用法

```ts
import { createWeaveImageClient } from '@jiujue/weave-adapter-worker-image'

const client = createWeaveImageClient({
	width: 794,
	height: 1123,
	dpr: 2,
	clearColor: '#ffffff',
	scene,
})

const r = await client.render()
const blob = new Blob([r.data], { type: r.mime })
const url = URL.createObjectURL(blob)
```

## 组合使用（典型方式）

- 报表/导出/缩略图：本包（PNG 二进制）+ 业务侧将 `ArrayBuffer` 转 Blob/下载/上传
- 交互式画布：用 `@jiujue/weave-app`（它会把结果画到 canvas，而不是导出 PNG）

## AI / Skills

- [AI_GUIDE.md](./AI_GUIDE.md)
- [skills/SKILL.md](./skills/SKILL.md)
- [CHANGELOG.md](./CHANGELOG.md)

## 相关包

- `@jiujue/weave-core`：layout/paint
- `@jiujue/weave-displaylist`：replay
- `@jiujue/weave-types`：SceneNode/patch
