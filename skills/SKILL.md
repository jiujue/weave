---
name: 'weave-repo'
description: '协助在 Weave monorepo 内做工程改动、排查问题与发布。用户提到 packages/apps/docs/CI、版本发布、文档部署时调用。'
---

# Weave Repo

## 适用场景

- 需要定位某个子包/应用的职责边界与代码入口
- 需要修改构建、发布、版本、文档部署、GitHub Actions
- 需要在 monorepo 里做跨包改动，并保证 lint/test/build 通过

## 工作方式

- 先确认改动属于 `packages/*`（发布）还是 `apps/*`（不发布）
- 子包改动优先从 `exports` 与类型入手，再落到实现
- 任何脚本/工作流改动都要给出可执行的触发方式（例如 pnpm script 或 tag 规则）

## 关键约定

- 子包一般使用 `tsup` 打包，发布内容由 `package.json#files` 控制
- 文档部署通过 tag 触发（例如 `deploy-gh-pages-tag-x.y.z`）
- 版本管理使用 Changesets（`pnpm change / pnpm version-packages / pnpm release`）
