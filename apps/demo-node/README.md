# weave-demo-node

Node 演示：离屏渲染导出 PNG（两种场景构建方式各一张图）。

## 运行

在仓库根目录：

```bash
pnpm install
pnpm -r build
pnpm -C apps/demo-node render
```

输出文件在 `apps/demo-node/` 目录下（如 `output.png`、`output.sceneFromJSX.png`）。
