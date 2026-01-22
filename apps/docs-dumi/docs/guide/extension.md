---
title: 扩展与演进方法
order: 30
toc: content
---

本页描述「以后怎么扩展」的最短路径：新增一个场景原语（Node 类型），以及为新平台新增一个适配层。

## 扩展原语（新增 Node 类型）

目标：新增 `type: 'xxx'` 的新节点，并让它能布局、能绘制、能增量更新。

你通常需要改动三层：

- 协议层（types）：为新节点补齐类型、Patch 操作、必要的 Style/Paint 定义
- 引擎层（core）：把新节点纳入 layout 与 paint 过程（Yoga + 生成 DisplayList）
- 回放层（displaylist）：如引擎生成了新 op，需要为 replay 增加解释执行

推荐步骤：

1. 在 `@jiujue/weave-types` 里定义新节点类型与必要字段，并加入 `SceneNode` 联合类型
2. 在 `@jiujue/weave-core` 中完成 layout（Yoga style 映射/measure）与 paint（输出 DisplayList）
3. 为 Patch 增量更新补齐最小集合：新增节点、更新节点字段、删除节点
4. 在 `apps/demo-react` 里写一个最小场景对照用例，确保新增原语在两条链路都跑通

## 扩展平台（新增 adapter）

目标：让引擎的 DisplayList 能“画到某个平台的 2D 能力”上。

关键接口是 `Context2DLike`（不是浏览器 CanvasRenderingContext2D 的硬依赖）。

接口可查：[/reference/context2dlike](/reference/context2dlike)

推荐步骤：

1. 为平台实现一个 `Context2DLike`（可包装原生 2D API，也可自己实现）
2. 复用 `@jiujue/weave-displaylist` 的 `replay`（让 DisplayList 解释执行到你的 context）
3. 如果有跨线程/跨进程需求：定义消息协议 + Patch 同步（可参考 `@jiujue/weave-adapter-offscreen`）
