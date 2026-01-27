---
title: Weave 仓库 AI Guide
---

## 目标

在本仓库进行改动时，优先保证：

- 子包 API 的稳定与类型正确
- Worker/Node/Browser 三条链路可正常跑通
- 版本、发布与文档部署流程可复用、可自动化

## 仓库结构（快速定位）

- `packages/*`：对外发布的子包（ESM + d.ts）
- `apps/*`：演示与工具（不发布）
- `apps/docs-dumi`：文档站点源码，构建产物输出到 `dumi-docs/`
- `.github/workflows/*`：CI/CD（文档部署、扩展发布等）

## 常用命令

- 安装依赖：`pnpm install`
- 全量构建：`pnpm build`
- 代码检查：`pnpm lint`
- 测试：`pnpm test`
- 构建文档：`pnpm docs:build`
- 触发 gh-pages 部署（自动 bump + tag）：`pnpm deploy:gh-pages`

## 版本与发布（Changesets）

- 新增变更记录：`pnpm change`
- 生成各包新版本：`pnpm version-packages`
- 发布到 npm：`pnpm release`

约定：

- `pnpm change` 的提交用于记录“变更意图”
- `pnpm version-packages` 的提交用于记录“版本与 changelog 结果”

## 改动优先级与边界

- 优先复用现有包的公共类型（尤其是 `@jiujue/weave-types`）
- 对外可见的行为变更必须同步补齐类型与导出
- 避免在运行时代码里新增日志输出或注释（除非明确要求）

## PR 自检清单

- `pnpm lint` 通过
- `pnpm test` 通过
- 若涉及子包：对应子包 `pnpm -C packages/<name> build` 通过
- 若涉及文档/示例：`pnpm docs:build` 或对应 app build 通过
