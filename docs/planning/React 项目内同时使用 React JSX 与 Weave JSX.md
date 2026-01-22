## 你指定的方向

- 新增一个轻量包 `@jiujue/weave-react`，提供 `sceneFromJSX()`：把 React JSX 产物（ReactElement/ReactNode）转换为 `SceneNode`。
- 与现有“`@jsxImportSource @jiujue/weave-types` 直接生成 SceneNode”的方式并存。

## @jiujue/weave-react 的职责边界

- **输入**：React JSX 在 React runtime 下产生的 `ReactNode`（主要是 `ReactElement` 树）。
- **输出**：`@jiujue/weave-types` 的 `SceneNode`（plain object）。
- **不做**：不参与渲染/worker/engine；只做“AST/对象树转换”。

## 包结构设计（轻量）

- 新增目录：`packages/react`
- `package.json`
  - `dependencies`: `@jiujue/weave-types`（用于 SceneNode/类型）
  - `peerDependencies`: `react`（运行时必需，因为输入是 ReactElement 结构；但实现会尽量用结构判断，减少强耦合）
  - `devDependencies`: `@types/react`（仅类型需要）
  - `exports`: `.` 指向 `dist/index.js` / `dist/index.d.ts`
- `src/index.ts`
  - `export function sceneFromJSX(node: React.ReactNode): SceneNode`
  - 可选：`export function isReactElementLike(x): boolean`（内部用）

## sceneFromJSX() 的转换规则

- 识别并处理：
  - `\\typeof` 为 `Symbol.for('react.element')` 的对象（ReactElement）
  - Fragment：`type === Symbol.for('react.fragment')`，要求最终收敛为单根（或自动包一层 root container，二选一，默认更贴近 Weave：**要求单根**）
- 支持的 intrinsic tags：`container | text | polygon`
- children 规则：
  - `null/undefined/false` 跳过
  - `string/number`：仅在 `text` 节点中拼为 text；在其它节点中忽略或报错（默认忽略，避免 React 条件渲染的噪声）
  - 数组：递归拍平
- id/key：
  - 优先 `props.id`（string）
  - 次选 `key`（string/number）
  - 均无则 throw（因为 Weave 的 patch/layout 需要稳定 id）

## React 侧类型支持（让 TS 允许写 <container/>)

- 在 `apps/demo-react/src/types/weave-jsx.d.ts` 增加 JSX 全局扩展：
  - `declare global { namespace JSX { interface IntrinsicElements { container: ...; text: ...; polygon: ... } } }`
  - 这些 props 类型直接复用 `@jiujue/weave-types/jsx-runtime` 中的定义（或手写映射到 `LayoutStyle/paint` 等）。
- 这样 React TSX 文件里不需要切换 `jsxImportSource`，就能直接写 Weave 标签。

## demo-react 改造（同时展示两种方式）

- 方式 B（你要的更简单）：
  - React 组件里写 Weave JSX：`sceneFromJSX(\
  \
)`
  - 每次 React state 变化，重新生成 scene 并 `app.setScene(scene)`。
- 方式 A（保留并存）：
  - 额外提供一个 `WeaveScene.tsx` 文件加 `/** @jsxImportSource @jiujue/weave-types */`，直接导出 `SceneNode`。
  - App 里可切换开关对比两种方式（同样渲染效果）。

## 验证

- `pnpm install`
- `pnpm -C packages/react build`（tsup 产物）
- `pnpm -C apps/demo-react dev`：交互更新 scene，画布同步变化
- `pnpm build && pnpm test`：全仓回归通过

确认后我会开始实现 `@jiujue/weave-react` + demo-react 的双方式示例与最小说明。
