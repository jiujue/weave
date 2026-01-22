# Weave DevTools Extension（Plasmo）

## 这是什么

一个浏览器扩展，在 DevTools 里提供 Weave 面板，用于：

- 查看 SceneNode 场景树
- 查看节点属性（JSON）
- Inspect 模式：在页面中拾取节点并高亮

## 开发

在仓库根目录安装依赖后：

- 开发：`pnpm -C apps/devtools-extension dev`
- 构建：`pnpm -C apps/devtools-extension build`

Chrome 加载方式（开发构建）：

- 打开 `chrome://extensions`
- 打开开发者模式
- Load unpacked → 选择 `apps/devtools-extension/build/chrome-mv3-dev`

开发时常见问题：

- `Uncaught Error: Extension context invalidated`
  - 这是 Chrome 在你 Reload 扩展、或 Plasmo 热更新触发扩展重载后，旧的 content script 上下文被销毁导致的。
  - 处理方式：Reload 扩展后 **刷新目标页面**（或重新打开 DevTools/页面）即可。

## 使用

1) 在你的 Weave 页面创建 app 时开启：

```ts
createWeaveApp({
  canvas,
  scene,
  devtools: { enabled: true }
})
```

2) 打开该页面的 DevTools，选择 `Weave` 面板。

## 架构

- `contents/weave-main.ts`：main world bridge，访问 `window.__WEAVE_DEVTOOLS_HOOK__`
- `content.ts`：isolated world，overlay 与 inspect，转发请求/事件
- `background.ts`：panel ↔ content script 路由
- `devtools.tsx` + `panels/weave-panel/*`：DevTools 面板 UI
