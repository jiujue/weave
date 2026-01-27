---
name: 'weave-types'
description: '提供 Weave 的类型/协议（SceneNode、Patch、Context2DLike、JSX runtime）。用户在定义协议、扩展节点字段、对齐跨包类型时调用。'
---

# @jiujue/weave-types

## 你能做什么

- 解释 SceneNode/ScenePatch/DisplayList/Context2DLike 的职责与字段含义
- 设计新增节点或新增 Patch 操作时的类型方案
- 帮助其它包对齐 types 的导出路径与使用方式（含 jsx-runtime）

## 输出要求

- 优先给出“类型层面的结论”与影响范围（哪些包会受影响）
- 涉及 breaking change 必须指出迁移方式
