---
title: Worker 批量渲染 100 份报表
order: 62
toc: content
---

这个示例用单个 WebWorker 按需渲染 100 份不同业务数据，并提供三种报表风格（结算单 / 报销单 / 对账单）切换查看。页面只展示 Worker 输出的 PNG 图片（主线程不回放 canvas）。

<code src="../../src/demos/worker-rendered-batch-reports.tsx" title="批量报表渲染（100 份数据，三种风格）"></code>
