---
title: @jiujue/weave-react AI Guide
---

## 这个包是什么

`@jiujue/weave-react` 负责把 React JSX 结构转换成 Weave 的 `SceneNode`：

- 输入：ReactElement/ReactNode
- 输出：`@jiujue/weave-types` 的纯对象 scene tree
- 不负责渲染、布局、worker、canvas 适配

## 修改原则

- 只做“结构转换”，不要引入渲染期副作用
- 输出必须符合 `@jiujue/weave-types` 的协议约束
- 兼容 React fragment、数组 children、条件渲染等常见形态

## 常见改动入口

- `src/index.ts`：`sceneFromJSX` 等核心实现

## 验证方式

- `pnpm -C packages/react build`
- 用 `apps/demo-react` 或 docs-dumi demo 验证 JSX → scene 的结果是否符合预期
