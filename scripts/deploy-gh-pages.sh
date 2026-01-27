#!/bin/bash

# 确保在项目根目录运行
cd "$(dirname "$0")/.."

# 1. 自动增加版本号 (patch)
npm version patch --no-git-tag-version

# 2. 获取更新后的版本号
NEW_VERSION=$(node -p "require('./package.json').version")

# 3. 提交变更
git add package.json
git commit -m "chore: bump version to $NEW_VERSION for gh-pages deployment"

# 4. 创建指定的 tag 格式: deploy-gh-pages-tag-x.x.x
TAG_NAME="deploy-gh-pages-tag-$NEW_VERSION"
git tag "$TAG_NAME"

# 5. 推送分支和 tag
CURRENT_BRANCH=$(git branch --show-current)
git push origin "$CURRENT_BRANCH"
git push origin "$TAG_NAME"

echo "✅ 已成功升级版本至 $NEW_VERSION 并推送 tag: $TAG_NAME"
