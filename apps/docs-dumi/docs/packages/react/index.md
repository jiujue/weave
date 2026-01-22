---
title: @jiujue/weave-react
order: 70
toc: content
---

`@jiujue/weave-react` 提供 `sceneFromJSX`：把 React JSX（intrinsic elements）转换为 `SceneNode`。它的定位是“更好写、更接近 UI 组件心智模型”的场景构建方式。

该子包的主路由已迁移到：[/react](/react)（后续内容以主路由为准）。

注意：`sceneFromJSX` 只支持 intrinsic elements（如 `<container />`、`<text />`）。不要传入函数组件（`<MyScene />`）或类组件，否则会报错。

## 最小示例

<code src="../../../src/demos/scene-from-jsx.tsx" title="sceneFromJSX 最小示例"></code>

## 适用场景建议

- UI 与场景结构高度同构（表格/卡片/布局容器）时，优先用 `sceneFromJSX`
- 需要更强类型约束/更接近编译期 DSL 时，使用 `@jiujue/weave-types` JSX runtime
