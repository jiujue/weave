# 开发指南

## 环境要求

- Node + pnpm（仓库使用 pnpm workspace）

## 常用命令

```bash
pnpm install
pnpm -r build
pnpm test
pnpm lint
```

## 启动 demo

### 浏览器 demo（apps/demo）

```bash
pnpm dev
```

### React demo（apps/demo-react）

```bash
pnpm dev:react
```

### Node 导出 PNG（apps/demo-node）

```bash
pnpm -C apps/demo-node render
```

## Node 侧中文字体（避免乱码）

demo-node 支持两种方式：

- 自动兜底：在 Windows 下会尝试从系统字体目录注册常见中文字体
- 显式指定（最稳）：
  - `WEAVE_FONT_PATH`：字体文件路径
  - `WEAVE_FONT_FAMILY`：字体族名

## 如何新增一个 Node 类型

推荐流程：

1. 在 `@jiujue/weave-types` 扩展 `SceneNode` 联合类型与 props
2. 在 `@jiujue/weave-types/jsx-runtime` 增加 intrinsic element（可选）
3. 在 `@jiujue/weave-core`：
   - measure：需要布局尺寸时提供测量逻辑
   - paint：把 node + frame 转为 DisplayList
4. 在 `@jiujue/weave-displaylist` 扩展 DrawOp（必要时）
5. 在 demo 中加最小示例，并补一条单测验证 DisplayList
