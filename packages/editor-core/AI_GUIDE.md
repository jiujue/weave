---
title: @jiujue/weave-editor-core AI Guide
---

## 这个包是什么

`@jiujue/weave-editor-core` 提供编辑器相关的核心能力（不包含具体 UI）：

- 节点 registry（节点类型、可编辑属性、默认值等）
- scene 与 JSX/配置之间的转换（用于导出、复制、回放）
- 给 `apps/builder-react` 等编辑器项目复用的纯逻辑层

## 修改原则

- 不要耦合具体框架（React/Vue），保持纯逻辑/纯类型
- 任何 registry/schema 变更要考虑向后兼容与数据迁移
- 导出的结构要可序列化（用于存储、复制、导出）

## 常见改动入口

- `src/index.ts`：对外导出
- 其它 `src/*`：registry、转换逻辑、工具函数

## 验证方式

- `pnpm -C packages/editor-core build`
- 运行 `apps/builder-react` 验证导出/导入与 Inspector 配置是否正常
