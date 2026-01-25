# 拖拽生成 JSX 的 Weave 编辑器规划 (Extensible + Documented)

## 1. 背景与现状分析

- **核心引擎**: 已具备 `hitTest` 能力。
- **缺口**: 缺少编辑器状态管理、图层树、RPC 通信、扩展性设计以及**系统性的开发文档**。

## 2. 架构设计：配置驱动的主线程核心

采用 **主线程控制 + 配置驱动** 模式：

- **Main Thread**:
  - **Component Registry**: 维护节点元数据，支持动态扩展。
  - **Generic Logic**: 抽象的编辑器核心逻辑。
- **Worker Thread**: 通用渲染器。

## 3. 详细实施规划

### Phase 1: 基础设施 (Infrastructure)

1.  **通信层升级**: 实现 `WEAVE_HIT_TEST` RPC。
2.  **编辑器逻辑包**: 实现 `Registry` 和 `EditorState`。

### Phase 2: 可扩展 UI 框架

1.  **图层树 (Layer Tree)**: 基于 Registry 渲染。
2.  **通用属性面板**: 基于 Schema 动态渲染控件。

### Phase 3: 交互与导出

1.  **通用拖拽**: 基于配置生成拖拽源。
2.  **JSX 导出**: 动态标签映射。

## 4. 文档落地规划 (Documentation)

开发过程中必须同步产出以下文档，作为交付的一部分：

### 4.1 架构设计文档 (`docs/editor-architecture.md`)

- **系统全景图**: 描述 React App、Editor SDK、Adapter 和 Worker 之间的关系。
- **数据流向**: 详细解释 `User Action -> State Update -> Patch Generation -> Worker Render` 的闭环。
- **目录结构说明**: 解释各包的职责边界。

### 4.2 扩展开发指南 (`docs/extension-guide.md`)

- **核心目标**: 让后来者能在不阅读核心源码的情况下新增节点。
- **内容包含**:
  - **Quick Start**: "5分钟添加一个 Image 节点"。
  - **Registry API**: 详细说明 `registerComponent` 的参数 (props, inspector, serialization)。
  - **最佳实践**: 如何复用现有的 Inspector 控件。

### 4.3 协议与 API 参考

- **Adapter 协议**: 在 `packages/adapter-offscreen/README.md` 中维护最新的 RPC 消息列表。
- **TSDoc**: 核心接口 (`EditorState`, `SceneNode`) 必须包含 TSDoc 注释。

## 5. 验收标准 (Milestones)

- [ ] **M1**: 核心架构跑通，并产出 `editor-architecture.md` 初稿。
- [ ] **M2**: 实现 Schema 驱动的属性面板，并产出 `extension-guide.md`。
- [ ] **M3**: 完整编辑器可用（含图层树），文档内容与代码实现完全一致。
- [ ] **M4**: 所有核心 API 具备清晰的注释。

---

本规划确保**代码与文档同步交付**，既实现了功能的可扩展性，也保证了知识的可传承性。
