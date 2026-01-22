## 目标
- Container 支持“超过指定高度出现滚动条/可滚动视口”（maxHeight/height 约束下）
- 兼容 WebWorker 与 Node：core 不依赖 DOM 事件；事件采集放到 adapter/宿主层
- 在 dumi 里补齐详细文档与可运行示例

## 实现清单
- types
  - `LayoutStyle` 新增 `overflowY/overflowX: 'visible'|'hidden'|'scroll'|'auto'`
  - `ContainerNode` 新增 `scroll?: { x?: number; y?: number }`
  - `ScenePatch` 新增 `updateScroll`（用于滚动状态更新）
- core
  - 在 frames 计算后，为启用滚动的 container 计算 `contentSize`（子节点 frame 并集）与 `scrollRange`，并对 scroll clamp
  - 在 `buildDisplayList()` 的 container 分支加入 `clipRect`，并在递归 children 前 `translate(-scroll)`
  -（可选）新增 `hitTest(point)`：维护 transform+clip 栈，保证滚动后命中正确
- adapter（可选）
  - 浏览器主线程监听 wheel/pointer，做 DPR/缩放坐标换算，发送输入消息或直接生成 `updateScroll` patch
  - Node 环境由宿主直接调用 hitTest/updateScroll

## dumi 文档落地
- 新增一篇“滚动容器”指南：
  - API 说明（overflow/scroll/maxHeight 与内容超出关系）
  - 坐标系/裁剪/滚动原理（基于 displaylist 的 clipRect + translate）
  - WebWorker/Node 的事件接入方式（主线程采集→消息/patch；Node 由宿主输入）
- 新增示例页面：
  - `maxHeight + overflowY='auto'` 的 container，塞入多段 text/table
  - 提供一个可交互的滚动控制（按钮/滑块/滚轮），展示 `updateScroll` 的用法

## 验证
- 在 docs 示例中验证：
  - 内容超出被裁剪
  - scroll 更新后内容平移且 clamp 正确
  -（若做 hitTest）滚动后点击命中仍正确