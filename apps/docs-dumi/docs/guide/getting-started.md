---
title: 快速开始
order: 10
toc: content
---

本页目标：让你在 10 分钟内完成「安装 → 跑 demo → 找到入口 → 开始改代码」。

## 安装与构建

```bash
pnpm install
pnpm -r build
```

## 运行示例

### 浏览器：Worker + OffscreenCanvas

```bash
pnpm dev
```

### React：同时对照两套场景构建方式

```bash
pnpm dev:react
```

### Node：离屏渲染导出 PNG

```bash
pnpm -C apps/demo-node render
```

## 从哪里开始读代码

- 端到端入口：`@jiujue/weave-app`（browser/node 条件导出）→ [@jiujue/weave-app](/app)
- 引擎内核：`@jiujue/weave-core`（scene tree → Yoga → DisplayList）→ [@jiujue/weave-core](/core)
- 协议与类型：`@jiujue/weave-types`（SceneNode/Patch/Context2DLike/JSX runtime）→ [@jiujue/weave-types](/types)

## 下一步推荐阅读

- 动态更新：Patch 的使用方式与完整回路 → [动态更新（Patch）](/guide/patches)
- 布局：Yoga 的关键心智模型与常用属性 → [布局（Yoga Layout）](/guide/layout)
- 表格：TableNode 的数据结构与增量更新 → [表格（Table Node）](/guide/table)
- 选型：与市面方案对比、为什么选 Weave、是否造轮子 → [选型与对比](/guide/selection)
- 架构：模块边界与链路心智模型 → [架构与模块边界](/guide/architecture)
- 时序：Browser/Worker 与 Node 的数据流 → [数据流与渲染时序](/guide/dataflow)
- Worker：Offscreen 协议与 resize/dpr 实践 → [Offscreen Worker 协议与实践](/guide/offscreen-worker)
- 参考：Scene/Patch/Context 的字段查阅 → [Reference](/reference/scene)
