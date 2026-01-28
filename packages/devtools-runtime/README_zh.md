# @jiujue/weave-devtools-runtime

Weave DevTools 的运行时能力：在 `globalThis` 上注入 hook，用于注册实例、枚举实例，以及在 DevTools 面板里做 scene 查看、命中测试等交互。

## 在 Weave 里的位置（分层）

| 层级       | 包                               | 作用                                   |
| ---------- | -------------------------------- | -------------------------------------- |
| 场景数据   | `@jiujue/weave-types`            | SceneNode/patch                        |
| 端到端入口 | `@jiujue/weave-app`              | 可选集成 DevTools hook                 |
| 调试能力   | `@jiujue/weave-devtools-runtime` | hook 定义 + scene mirror（patch 应用） |
| 工具侧     | `apps/devtools-extension`        | 浏览器 DevTools 面板（Plasmo）         |

## 安装

```bash
pnpm add @jiujue/weave-devtools-runtime
```

## 用法

```ts
import { ensureWeaveDevtoolsHook } from '@jiujue/weave-devtools-runtime'

const hook = ensureWeaveDevtoolsHook()
hook.register({
	id: 'my-app',
	name: 'demo',
	canvas,
	hitTest: async (x, y) => ({ id: null, path: [] }),
	getNodeInfo: async () => null,
})
```

## 组合使用（典型方式）

- 应用侧：`@jiujue/weave-app` 开启 `devtools: { enabled: true }` 即可自动注册实例
- 工具侧：安装并使用浏览器扩展 `apps/devtools-extension` 查看场景树、inspect、节点高亮

## AI / Skills

- [AI_GUIDE.md](./AI_GUIDE.md)
- [skills/SKILL.md](./skills/SKILL.md)
- [CHANGELOG.md](./CHANGELOG.md)

## 相关包

- `@jiujue/weave-app`：已内置对 DevTools 的集成入口（可选）
