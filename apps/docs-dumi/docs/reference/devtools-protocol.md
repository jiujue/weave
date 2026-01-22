---
title: DevTools 通信协议（v1）
order: 60
toc: content
---

本页定义 Weave DevTools 扩展内部通信协议，用于扩展面板与页面运行时之间的数据交换。

## 参与方

- DevTools Panel：渲染树/属性、触发 inspect
- Background：消息路由（panel ↔ content script）
- Content Script（isolated world）：接收 panel 请求、绘制 overlay、处理鼠标事件
- Main World Bridge：访问页面世界的 `window.__WEAVE_DEVTOOLS_HOOK__`

## Content ↔ Main World Bridge（window.postMessage）

- `source`：`weave-devtools-bridge`
- `version`：`1`
- `kind`：`request | response | event`

### Request

```ts
{
  source: 'weave-devtools-bridge',
  version: 1,
  kind: 'request',
  requestId: number,
  payload: BridgeRequest
}
```

### Response

```ts
{
  source: 'weave-devtools-bridge',
  version: 1,
  kind: 'response',
  requestId: number,
  ok: true,
  result: any
}
```

或：

```ts
{
  source: 'weave-devtools-bridge',
  version: 1,
  kind: 'response',
  requestId: number,
  ok: false,
  error: string
}
```

### Event

```ts
{
  source: 'weave-devtools-bridge',
  version: 1,
  kind: 'event',
  event: { type: 'instancesChanged' }
}
```

## BridgeRequest（v1）

- `listInstances`
- `getScene(instanceId)`
- `getNode(instanceId, nodeId)`
- `getHighlightRect(instanceId, nodeId)`
  - 返回 viewport 坐标：`{ left, top, width, height } | null`
- `pickNode(clientX, clientY)`
  - 输入为 viewport 坐标，返回 `{ instanceId, nodeId, path, highlight } | null`
- `startInspect` / `stopInspect`
  - 由 content script 直接处理（不下沉到 main world）

