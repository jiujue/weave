---
title: @jiujue/weave-devtools-runtime AI Guide
---

## 这个包是什么

`@jiujue/weave-devtools-runtime` 提供 DevTools 运行时桥接能力，用于把 Weave 实例暴露给浏览器扩展面板：

- `attachWeaveDevtools(...)`：注册实例、发送事件
- `createSceneMirror(...)`：在主线程维护 scene 快照，供面板查询
- 对外暴露 hook（如 `window.__WEAVE_DEVTOOLS_HOOK__`）

## 修改原则

- 默认应当可关闭（生产环境不建议暴露场景数据）
- hook 协议应保持版本化与向后兼容
- 不要引入对扩展实现细节的强耦合，runtime 只负责桥接与协议

## 常见改动入口

- `src/index.ts`：主要类型与实现

## 验证方式

- `pnpm -C packages/devtools-runtime build`
- 用 `apps/docs-dumi` 的 devtools demo 页面验证 hook 行为与事件流
