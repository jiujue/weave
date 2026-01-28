---
title: @jiujue/weave-types AI Guide
---

## 这个包是什么

`@jiujue/weave-types` 定义 Weave 的核心协议与类型系统，包括：

- SceneNode 场景树数据结构
- Patch 增量更新协议
- DisplayList / Context2DLike 等跨端绘制抽象
- JSX runtime（非 React）用来直接产出 SceneNode

## 你应该优先遵循的原则

- 类型是事实来源：任何跨包能力都应该先在这里定义类型与协议
- 尽量保持向后兼容：新增字段优于破坏式修改
- Patch 结构一旦变更，要同步影响 `core`、adapters、docs 示例

## 常见改动入口

- `src/index.ts`：主导出
- `src/jsx-runtime.ts`：JSX runtime（配合 `jsxImportSource: @jiujue/weave-types`）
- `dist/*` 为构建产物，不直接改

## 修改后的自检

- `pnpm -C packages/types build`
- 在依赖该协议的包中做一次类型检查（至少 `pnpm -C packages/core build`）

## 常见坑

- ESM 导出：`exports` 字段决定消费者可引用的子路径
- d.ts 需要与实现一致；不要只改类型不改实现（或反之）
