---
title: @jiujue/weave-react
order: 70
toc: content
---

`@jiujue/weave-react` 提供 `sceneFromJSX`：把 React JSX（intrinsic elements）转换为 `SceneNode`。它更偏“写起来像 UI 组件”的场景构建方式，适合快速搭建结构与布局。

## 关键约束

`sceneFromJSX` 只支持 intrinsic elements（如 `<container />`、`<text />`）。

不要传入函数组件（`<MyScene />`）或类组件，否则会报错；如果要复用结构，推荐用“返回 JSX Element 的普通函数”做组合。

例如：

```ts
function Header(title: string) {
  return <text id="title" textStyle={{ fontSize: 16, color: '#e6e6e6' }}>{title}</text>
}

const scene = sceneFromJSX(
  <container id="root">
    {Header('Hello')}
  </container>
)
```

## 最小示例

<code src="../../src/demos/scene-from-jsx.tsx" title="sceneFromJSX 最小示例"></code>

## 什么时候不用它

- 需要更强类型约束/更接近 DSL：用 `@jiujue/weave-types` JSX runtime（[/demos/jsx-runtime](/demos/jsx-runtime)）
- 需要把渲染放到 Worker：优先走 `@jiujue/weave-app`（[/app](/app)）
