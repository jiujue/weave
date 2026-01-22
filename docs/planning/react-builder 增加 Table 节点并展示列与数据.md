## 目标

- 在 react-builder 的元素面板里新增一个“表格（table）”节点，可一键插入到画布。
- 表格能以合适方式展示“列 + 数据”（表头、列宽、行高、交替行背景、超出可滚动）。
- 在属性面板里提供一个可用的编辑方式来改列与数据（不要求做复杂 UI 表格编辑器，先用稳定的 JSON 编辑）。
- 导出 JSX 时不丢失表格的 columns/rows/header/tableStyle。

## 现状调研结论（关键点）

- 引擎已经内置 table 的 layout/paint/hitTest：无需改渲染链路（core 已支持）。
- builder-react 的 Palette 完全依赖 registry.getAll()：只要注册 table 就会出现在左侧组件面板。
- Inspector 目前仅支持 string/number/color/enum，且通过 dot-path 直接 set 到 node 上；复杂结构（columns/rows）目前不可编辑。
- editor-core 的 sceneToJSX 只序列化 style/textStyle，会导致 table 导出丢 columns/rows 等信息。

## 改动范围（文件）

- 注册节点：apps/builder-react/src/state/initRegistry.ts
- 属性面板：apps/builder-react/src/ui/Inspector.tsx
- 导出 JSX：packages/editor-core/src/CodeGen.ts
- （类型支持，如需新增 json 类型）packages/editor-core/src/Registry.ts

## 设计方案

### 1) Table 节点默认数据（保证“展示合适”）

- create() 生成一个可直接渲染的 TableNode：
  - style：给定 width/height，并设置 overflowX/overflowY 为 auto（启用表格内部滚动）。
  - columns：默认 3–5 列，包含 id/title/width（用 flex 或部分固定宽度）。
  - rows：默认 5–10 行，cells 的 key 与 column.id 对齐。
  - tableStyle：先不强制设置（引擎对 headerBackground/altRow/grid 等有内置默认值），只暴露少量可调项。

### 2) 属性面板的“列/数据”编辑方式

- 采用 JSON 文本方式编辑 columns 与 rows：
  - 在 Inspector 中针对 table 类型渲染两个 textarea（Columns JSON、Rows JSON）。
  - onChange 仅更新本地草稿；onBlur 时 JSON.parse 校验通过才写回 node 并触发 updateScene。
  - 校验失败时显示错误提示，但不破坏当前画布数据。
- 两种实现路径（二选一，推荐 A）：
  - A. 扩展 registry PropType：新增 'json'，并在 Inspector 里支持 'json' 渲染（这样 table 的 columns/rows 也能通过 def.props 配置出来）。
  - B. 不改 registry，只在 Inspector 检测 node.type==='table' 时额外加一段“Table Data”面板。

### 3) JSX 导出不丢字段

- 更新 editor-core 的 sceneToJSX：改为通用序列化（类似 @jiujue/weave-react 的实现），把除 type/children/text 之外的字段都输出为 props；这样 table 的 columns/rows/header/tableStyle 会被完整导出。

## 实施步骤

1. 在 initRegistry.ts 注册 table：label、基础尺寸/滚动相关 props + 默认 create()（含 columns/rows）。
2. 在 Inspector 增加 JSON 编辑能力（按上面的方案 A 或 B），实现 columns/rows 可编辑并即时刷新画布。
3. 改进 CodeGen.ts 的 sceneToJSX，确保导出 JSX 包含 table 的 columns/rows/tableStyle。
4. 手动验收：
   - Palette 能看到 Table 按钮并可插入。
   - Table 插入后表头/行数据正常显示；数据多时出现滚动条。
   - Inspector 修改 Columns/Rows JSON 后画布即时更新；无效 JSON 给出错误提示且不应用。
   - “Export Full Scene JSX” 导出的 table 节点包含 columns/rows 等 props。

## 验收标准

- 新增 table 节点可被创建、选中、删除。
- 默认表格视觉可读（表头、网格、交替行），并能滚动显示更多行/列。
- 列与数据可通过 Inspector 的 JSON 方式安全修改。
- 导出 JSX 不丢 table 结构字段。
