# Git Worktree を活用した開発ワークフロー

## 概要

Git worktree を使用することで、複数のブランチを同時に異なるディレクトリで作業でき、ブランチ切り替えの手間を削減し、並行開発を効率化できます。

## Git Worktree の基本

### セットアップ

```bash
# メインリポジトリの場所
cd /home/ec2-user/workspace/lightningtalk-circle

# worktree 用のディレクトリを作成
mkdir -p ../lightningtalk-worktrees

# 新しい機能開発用の worktree を作成
git worktree add ../lightningtalk-worktrees/feature-x feature/new-feature

# バグ修正用の worktree を作成
git worktree add ../lightningtalk-worktrees/hotfix hotfix/critical-bug
```

### 基本操作

```bash
# worktree の一覧表示
git worktree list

# worktree への移動
cd ../lightningtalk-worktrees/feature-x

# 作業完了後、worktree を削除
git worktree remove ../lightningtalk-worktrees/feature-x
```

## Docker を活用した開発環境

### 1. 開発環境の Dockerfile

```dockerfile
# Dockerfile.dev
FROM node:18-alpine

# 開発ツールのインストール
RUN apk add --no-cache git bash

WORKDIR /app

# package.json のみ先にコピー（キャッシュ効率化）
COPY package*.json ./
RUN npm ci

# ソースコードをコピー
COPY . .

# 開発サーバー起動
CMD ["npm", "run", "dev"]
```

### 2. Docker Compose による複数環境管理

```yaml
# docker-compose.yml
version: '3.8'

services:
  # メインブランチ用
  app-main:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - BRANCH=main

  # feature ブランチ用
  app-feature:
    build:
      context: ../lightningtalk-worktrees/feature-x
      dockerfile: Dockerfile.dev
    volumes:
      - ../lightningtalk-worktrees/feature-x:/app
      - /app/node_modules
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=development
      - BRANCH=feature

  # テスト実行用コンテナ
  test-runner:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - .:/app
      - /app/node_modules
    command: npm test -- --watch
    environment:
      - NODE_ENV=test
```

### 3. 環境別の起動スクリプト

```bash
#!/bin/bash
# scripts/dev-env.sh

case "$1" in
  "main")
    docker-compose up app-main
    ;;
  "feature")
    docker-compose up app-feature
    ;;
  "all")
    docker-compose up
    ;;
  "test")
    docker-compose run --rm test-runner
    ;;
  *)
    echo "Usage: $0 {main|feature|all|test}"
    exit 1
    ;;
esac
```

## テスト戦略

### 1. テスト環境の分離

```javascript
// test-setup.js
import { beforeAll, afterAll } from '@jest/globals';

// 各 worktree で独立したテスト環境を構築
const BRANCH = process.env.BRANCH || 'main';
const TEST_PORT = process.env.TEST_PORT || 3100;

export const testConfig = {
  baseUrl: `http://localhost:${TEST_PORT}`,
  testDataDir: `./test-data/${BRANCH}`,
  dbName: `lightningtalk_test_${BRANCH}`
};
```

### 2. 並行テスト実行

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:parallel": "jest --maxWorkers=4",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "jest --testPathPattern=integration",
    "test:unit": "jest --testPathPattern=unit"
  }
}
```

### 3. Git Hooks によるテスト自動化

```bash
#!/bin/bash
# .git/hooks/pre-push

# 現在の worktree を取得
WORKTREE=$(git worktree list | grep $(pwd) | awk '{print $1}')

echo "Running tests in worktree: $WORKTREE"

# Docker でテスト実行
docker-compose run --rm test-runner npm test

if [ $? -ne 0 ]; then
  echo "Tests failed! Push aborted."
  exit 1
fi
```

## ワークフロー例

### 1. 新機能開発

```bash
# 1. 新しい worktree を作成
git worktree add ../lightningtalk-worktrees/feature-calendar feature/calendar-integration

# 2. worktree に移動
cd ../lightningtalk-worktrees/feature-calendar

# 3. Docker 環境を起動
docker-compose -f ../../lightningtalk-circle/docker-compose.yml up app-feature

# 4. 開発作業
# ... コード編集 ...

# 5. テスト実行
docker-compose -f ../../lightningtalk-circle/docker-compose.yml run --rm test-runner

# 6. コミット & プッシュ
git add .
git commit -m "Add calendar integration feature"
git push -u origin feature/calendar-integration
```

### 2. ホットフィックス（本番バグ修正）

```bash
# 1. production ブランチから worktree 作成
git worktree add -b hotfix/security-patch ../lightningtalk-worktrees/hotfix origin/production

# 2. 修正作業
cd ../lightningtalk-worktrees/hotfix
# ... バグ修正 ...

# 3. テスト（本番環境相当）
docker-compose -f ../../lightningtalk-circle/docker-compose.yml \
  run --rm -e NODE_ENV=production test-runner

# 4. マージ
git checkout production
git merge hotfix/security-patch
git push origin production
```

## ベストプラクティス

### 1. Worktree の命名規則

```
lightningtalk-worktrees/
├── main/           # メインブランチ（読み取り専用推奨）
├── feature-*/      # 機能開発用
├── hotfix-*/       # 緊急修正用
└── experiment-*/   # 実験的な変更用
```

### 2. リソース管理

```bash
# 定期的なクリーンアップスクリプト
#!/bin/bash
# scripts/cleanup-worktrees.sh

# マージ済みブランチの worktree を削除
git worktree list | while read -r worktree; do
  branch=$(echo $worktree | awk '{print $3}' | tr -d '[]')
  if git branch --merged | grep -q "$branch"; then
    echo "Removing merged worktree: $branch"
    git worktree remove $(echo $worktree | awk '{print $1}')
  fi
done
```

### 3. CI/CD との統合

```yaml
# .github/workflows/multi-branch-test.yml
name: Multi-Branch Testing

on:
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        branch: [main, develop]
    
    steps:
    - uses: actions/checkout@v3
      with:
        fetch-depth: 0
    
    - name: Setup worktree
      run: |
        git worktree add ../test-${{ matrix.branch }} origin/${{ matrix.branch }}
    
    - name: Run tests in Docker
      run: |
        docker-compose run --rm \
          -e BRANCH=${{ matrix.branch }} \
          test-runner
```

## トラブルシューティング

### よくある問題と解決策

1. **Worktree がロックされる**
   ```bash
   # ロックファイルを削除
   rm .git/worktrees/*/locked
   ```

2. **Docker ボリュームの競合**
   ```bash
   # ボリュームをクリーンアップ
   docker-compose down -v
   ```

3. **ポートの競合**
   ```bash
   # 環境変数でポートを動的に設定
   PORT=3002 docker-compose up app-feature
   ```

## まとめ

Git worktree と Docker を組み合わせることで：

- 複数の機能を並行開発可能
- ブランチ切り替えのオーバーヘッドを削減
- 各ブランチで独立したテスト環境を維持
- CI/CD パイプラインとの統合が容易

この開発手法により、チーム開発の効率が大幅に向上します。