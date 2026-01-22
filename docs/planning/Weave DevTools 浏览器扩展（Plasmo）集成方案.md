## 现状结论（现有逻辑能支持什么）
- 已具备“可拾取/可高亮”的核心能力：hitTest 与 getNodeInfo 已通过主线程⇄Worker RPC 串通，可用于“选中节点→在页面画高亮框”。参考：
  - [WeaveCanvas.tsx](file:///f:/Desktop/workspace/webWorkSpace/canvas-yogo-offscreen/apps/builder-react/src/ui/WeaveCanvas.tsx#L76-L164)
  - [adapter-offscreen/index.ts](file:///f:/Desktop/workspace/webWorkSpace/canvas-yogo-offscreen/packages/adapter-offscreen/src/index.ts#L109-L255)
  - [adapter-offscreen/worker.ts](file:///f:/Desktop/workspace/webWorkSpace/canvas-yogo-offscreen/packages/adapter-offscreen/src/worker.ts#L223-L264)
  - [engine.ts](file:///f:/Desktop/workspace/webWorkSpace/canvas-yogo-offscreen/packages/core/src/engine.ts#L1907-L2043)
- 已有“场景树（组件树）+ 属性面板”的参考实现，但它是应用内 UI（builder-react），并非浏览器扩展：
  - [LayerTree.tsx](file:///f:/Desktop/workspace/webWorkSpace/canvas-yogo-offscreen/apps/builder-react/src/ui/LayerTree.tsx#L98-L243)
  - [Inspector.tsx](file:///f:/Desktop/workspace/webWorkSpace/canvas-yogo-offscreen/apps/builder-react/src/ui/Inspector.tsx#L22-L170)
- 当前缺口：缺少稳定的“扩展可接入点”（实例发现/注册）以及“可查询的 scene 数据”（用于树与属性）；日志仅有 WEAVE_ERROR 字符串回传。

## 目标（你要的 React DevTools 类体验）
- DevTools 面板：展示 Weave 场景树（SceneNode tree）与节点属性。
- 选择联动：面板选中节点→页面 canvas 上高亮。
- Inspect 模式：鼠标悬停/点击画布→实时 hitTest→高亮与面板定位。
- 开发过程中同步补齐文档（API/协议/验证）。

## 采用方案：A（应用侧 Debug Hook + 主线程 scene 镜像）
### 核心思想
- 在库侧提供一个可选的全局 Debug Hook（类似“全局注册表”）：让扩展能发现页面里的 Weave 实例，并通过只读 API 拉取 scene/节点数据。
- 扩展侧采用标准浏览器扩展隔离模型：content script 注入 page script（页面世界）访问 hook，再用 postMessage 把数据回传给扩展 UI。

## 浏览器扩展与页面交互拓扑（Plasmo）
- DevTools Panel（devtools_page）：渲染树/属性/inspect 开关。
- Background：负责 panel ↔ content script 的消息路由。
- Content Script：
  - 注入 page script
  - 管理页面高亮 overlay（DOM 绝对定位框）
  - inspect 模式下监听 mousemove/click，将坐标换算到 canvas 内部坐标并转发
- Page Script（页面世界）：
  - 访问 window.__WEAVE_DEVTOOLS_HOOK__
  - 调用实例 API：getScene/getNodeById/hitTest/getNodeInfo
  - 用 window.postMessage 把结果回传

## 仓库侧需要的改造（按最小闭环拆分）
### 1) DevTools Hook（实例发现/注册）
- 新增 window.__WEAVE_DEVTOOLS_HOOK__：register/unregister/list（带版本号）。
- createWeaveApp/createWeaveBrowserApp 增加 devtools?: { enabled?: boolean; id?: string; name?: string }。
- enabled=true 时注册实例；dispose 时注销。
- 注册信息包含：id/name、canvas 引用（用于 overlay 定位）、只读方法与事件订阅入口。

### 2) Scene 镜像与查询（支撑“组件树/属性”）
- 新增 applyScenePatches(scene, patches) 纯函数，覆盖全部 ScenePatch（见 [types/index.ts](file:///f:/Desktop/workspace/webWorkSpace/canvas-yogo-offscreen/packages/types/src/index.ts#L253-L281)）。
- 在 adapter-offscreen（主线程）维护 latestScene：
  - setScene(scene) → 替换
  - applyPatches(patches) → 同步更新 latestScene
- 对外暴露只读查询：
  - getScene(): SceneNode
  - getNodeById(id): SceneNode | null（DFS 或维护索引）

### 3) Inspect/高亮（复用现有能力）
- 继续复用 hitTest/getNodeInfo（不改 Worker 协议）。
- 扩展侧 overlay 坐标：canvasRect.left/top + getNodeInfo.x/y。

### 4) 最小日志/事件流（用于面板刷新与排障）
- 复用现有 onError（WEAVE_ERROR），并通过 hook 广播 error。
- 额外广播关键事件：setScene/applyPatches/render/resize（先不引入复杂 logger）。

## Plasmo 扩展实现清单（仓库侧新增 extension 项目）
- 新建 apps/devtools-extension（Plasmo）
  - panel：树视图 + 属性查看 + inspect
  - content script：注入 page script + overlay
  - page script：桥接 hook 调用
  - background：消息转发
- 协议：requestId + version，支持多实例与并发。

## 文档（开发同步记录）
- 新增 docs/devtools.md：能力边界、如何开启、数据流拓扑、API/事件、安全注意事项（默认关闭）。
- 新增 docs/devtools-protocol.md：panel/background/content/page 消息结构、requestId、版本、错误。
- 新增 apps/devtools-extension/README.md：本地开发、加载扩展、用 builder-react 验证步骤。
- 视情况更新现有架构文档补充 devtools hook 层的位置。

## 验证基准（以 builder-react 为 demo）
- 面板能列出实例；树与 editor.scene 一致；面板点选与页面高亮一致；inspect 拾取与 hitTest 结果一致；错误能在面板看到。

确认后我会按上述 A 方案开始落地实现与文档补齐。