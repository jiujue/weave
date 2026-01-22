## 背景与结论

- 仓库现状：已有完整渲染链路（SceneNode/Patch → Worker → Engine layout/paint → DisplayList replay），但没有成型“拖拽编辑器”。
- 可复用点：引擎侧已具备命中测试 `engine.hitTest()`；JSX 输入侧已具备“JSX → SceneNode”（typed runtime 与 React sceneFromJSX）。
- 缺口：主线程侧缺少 editor 状态/交互；adapter/app 侧未把 hitTest 等交互能力暴露出来；缺少“SceneNode → JSX 字符串”的反向代码生成。

## 目标（首版可交付定义）

- 新增一个应用：可拖拽创建节点、能选中并拖动节点、能编辑常用属性、能导出 TSX（JSX）代码。
- 导出的 JSX：能被仓库现有的 typed JSX runtime 或 React sceneFromJSX 重新消费，复现同样的 scene。

## 非目标（首版不做）

- Figma 级矢量编辑/路径布尔运算/复杂文本排版。
- 完整对齐吸附、约束系统、多人协作、资源面板。

## 应用形态与目录规划

### 新应用

- `apps/builder-react`（React + Vite，直接参考 `apps/demo-react`）
- 页面布局：
  - 左：组件库（Palette）+ 图层树（Tree）
  - 中：画布预览（WeaveCanvas）
  - 右：属性面板（Inspector）
  - 下/右下：JSX 输出（CodePanel：复制/下载）

### 新增纯逻辑包（建议）

- `packages/editor`（不依赖 DOM，只处理数据）：
  - `applyPatchToScene(scene, patch)`：本地 scene 同步更新
  - `ops/*`：add/move/updateStyle/updateText 等编辑操作（返回 {nextScene, patches}）
  - `codegen/sceneToJSX(scene, options)`：SceneNode → TSX 字符串

## 数据流规划（编辑器如何驱动预览与导出）

- 主线程维护 `scene` 作为单一事实源（用于导出 JSX、存储、undo/redo）。
- 每次编辑动作产出 `patches`：
  - 预览：发送 `app.applyPatches(patches)` + `app.render()`（避免整棵 scene 频繁 structured-clone）。
  - 本地：用 `applyPatchToScene` 把相同 patches 应用到 `scene`，保持一致。

## 交互规划（拖拽与选中）

### Palette → Canvas（创建节点）

- 拖拽来源：Palette 提供 container/text/polygon/table 的模板。
- Drop 目标：画布区域。
- 落点解析：
  - 通过 hitTest 找到 hover 节点与 path，选最近的 container 作为 parent。
  - 首版定位策略：新节点默认 `position:'absolute'`，写入 `left/top`（相对 parent 内容区），宽高取模板默认值。

### Canvas 内选中与拖动（移动节点）

- pointerDown：hitTest 选中 id。
- pointerMove（按下时）：updateStyle patch 更新 left/top。
- 兼容策略：被拖动节点若不是 absolute，首版可在第一次拖动时自动切换到 absolute（可配置开关）。

### 属性面板（Inspector）

- 支持字段（首版）：width/height/left/top/padding/gap/flexDirection/background/text/textStyle。
- 更新通道：统一转为 ScenePatch（updateStyle/updateText/updateTextStyle 等）。

## 必要的底层补齐（Worker 侧 RPC）

> 这是实现交互编辑器的关键缺口，先规划清楚，后续按需最小实现。

### hitTest RPC（必做）

- 扩展 `@jiujue/weave-adapter-offscreen` 消息协议：
  - `WEAVE_HIT_TEST { requestId, point:{x,y} }`
  - `WEAVE_HIT_TEST_RESULT { requestId, id, path }`
- Worker 处理：
  - 应用 pendingScene/pendingPatches。
  - 至少执行 `engine.layout({width,height})` 确保 frames 可用。
  - 调用 `engine.hitTest(point)` 返回结果。

### 可选增强（体验项）

- `WEAVE_GET_SCROLL_METRICS`：辅助在 scroll 容器内正确换算 drop 坐标。
- `WEAVE_GET_FRAME_RECT`：用于画布叠加选框/hover outline（如果要做可视化选中态）。

## JSX 代码生成规划（SceneNode → TSX）

- 输出目标（两种口味，首版先做一种）：
  - 默认：typed JSX runtime 口味（直接输出 intrinsic elements：container/text/polygon/table）。
  - 可选：React 口味（同 intrinsic elements，但组织成 React 组件 export）。
- 生成规则（保证稳定 diff）：
  - 永远输出 `id`。
  - `style/paint/textStyle/tableStyle` 仅在有值时输出。
  - 属性顺序固定：id → style → paint → 其他。
  - 2 空格缩进；字符串做必要转义。

## 存储与可移植性（规划）

- localStorage：保存当前 scene、最近一次导出的 JSX（可选）。
- 导入/导出 JSON：便于版本管理与复现。

## 验收标准（实现后用来判断“完成”）

- 能从 Palette 拖 3 个节点到画布并实时渲染。
- 能在画布上点选并拖动节点位置。
- Inspector 修改属性后画布实时更新。
- 复制导出的 TSX 到一个预览入口（typed runtime 或 sceneFromJSX）可还原同样画面。

## 后续迭代方向（不在首版范围，仅记录）

- Undo/Redo（基于 patch 栈或操作日志）。
- 节点排序/插入位置指示。
- 选框、对齐线、吸附。
- 更多原语/组件模板与资源体系。

---

本规划将以该标题保存为文档；按你的要求，本轮只保存规划，不做任何实现修改。
