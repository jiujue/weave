---
name: 'weave-react'
description: '提供 sceneFromJSX：把 React JSX 转成 Weave SceneNode。用户在用 React 方式写场景、排查 JSX 转换问题时调用。'
---

# @jiujue/weave-react

## 适用场景

- 解释 `sceneFromJSX` 的输入输出与限制
- 新增/调整 JSX 节点到 SceneNode 的映射规则
- 处理 fragment/children/key/props 等 React 结构差异

## 注意事项

- 该包不负责渲染；渲染请走 `@jiujue/weave-core` + `@jiujue/weave-displaylist` 或 `@jiujue/weave-app`
