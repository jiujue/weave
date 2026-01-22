---
title: Worker 渲染业务报表（A4）
order: 61
toc: content
---

一个更接近“正式业务文档”的示例：A4 尺寸的结算单/报表，包含多段文字信息区、明细表格与合计汇总。渲染在 WebWorker 内完成，页面只展示最终的 PNG 图片。

<code src="../../src/demos/worker-rendered-business-report.tsx" title="业务风格文档（文字 + 表格 + 汇总，主线程只展示 img）"></code>

