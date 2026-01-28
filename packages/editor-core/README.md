# @jiujue/weave-editor-core

Weave 编辑器相关的纯逻辑内核：组件/属性注册（Registry）、编辑器状态（EditorState）、以及 SceneNode → JSX 的代码生成工具。

## 在 Weave 里的位置（分层）

| 层级       | 包                          | 作用                         |
| ---------- | --------------------------- | ---------------------------- |
| 场景数据   | `@jiujue/weave-types`       | SceneNode/patch              |
| 编辑器内核 | `@jiujue/weave-editor-core` | 状态/注册/代码生成           |
| 工具应用   | `apps/builder-react`        | 可视化编辑器原型（使用本包） |

## 安装

```bash
pnpm add @jiujue/weave-editor-core
```

## 用法

```ts
import { EditorState, sceneToJSX } from '@jiujue/weave-editor-core'

const state = new EditorState({ id: 'root', type: 'container', children: [] })
const jsx = sceneToJSX(state.scene)
```

## 组合使用（典型方式）

- 场景编辑：用本包维护 editor state（selection/scene 等），生成/应用 `ScenePatch`
- 画布预览：把 `SceneNode` 交给 `@jiujue/weave-app`（浏览器）实时渲染
- 代码导出：`sceneToJSX(scene)` 输出 JSX 字符串，用 `@jiujue/weave-react` 或 `@jiujue/weave-types` JSX runtime 重新消费

## AI / Skills

- [AI_GUIDE.md](./weave/packages/editor-core/AI_GUIDE.md)
- [skills/SKILL.md](./weave/packages/editor-core/skills/SKILL.md)
- [CHANGELOG.md](./weave/packages/editor-core/CHANGELOG.md)

## 相关包

- `@jiujue/weave-types`：SceneNode/patch 类型定义
- `@jiujue/weave-app`：浏览器画布渲染入口（预览）
- `@jiujue/weave-react`：React JSX ↔ SceneNode
