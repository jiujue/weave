---
title: @jiujue/weave-app
order: 60
toc: content
---

端到端统一入口：对外提供 browser/node 两种环境的 createWeaveApp 组合能力，负责把“场景构建、patch 同步、引擎与适配层”串起来。

该子包的主路由已迁移到：[/app](/app)（后续内容以主路由为准）。

<code src="../../../../../packages/app/src/index.ts" title="app/src/index.ts" defaultShowCode hideActions='["CSB","EXTERNAL"]'></code>

## Browser / Node 条件导出

<code src="../../../../../packages/app/src/browser.ts" title="app/src/browser.ts" defaultShowCode hideActions='["CSB","EXTERNAL"]'></code>

<code src="../../../../../packages/app/src/node.ts" title="app/src/node.ts" defaultShowCode hideActions='["CSB","EXTERNAL"]'></code>
