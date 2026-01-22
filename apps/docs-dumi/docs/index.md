---
title: Weave
toc: content
---

Weave 是一个「布局与绘制解耦」的可演进渲染引擎实验项目：scene tree（数据）→ Yoga layout（几何）→ DisplayList（绘制指令）→ replay（平台适配）。

## 你会用到的三件事

- 两条链路：浏览器（主线程 UI + OffscreenCanvas Worker 渲染）与 Node（离屏渲染导出 PNG）
- 两套场景构建方式：`sceneFromJSX`（简单）与 `@jiujue/weave-types` JSX runtime（更强类型/更接近 DSL）
- 一个核心协议：SceneNode + Patch（增量更新），DisplayList 作为跨端绘制指令

## 快速入口

- 指南：从零跑通一条链路 → [快速开始](/guide/getting-started)
- 子包：按模块阅读 API 与使用场景 → [@jiujue/weave-types](/types)
- 示例：可直接复制改造的最小可运行片段 → [示例集](/demos)
- 参考：Scene/Patch/Context 接口可查手册 → [SceneNode 参考](/reference/scene)
