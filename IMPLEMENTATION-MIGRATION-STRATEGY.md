# Lightning Talk Circle 実装・マイグレーション戦略

## 概要

本文書は、ディレクトリ戦略最適化計画の具体的な実装手順とマイグレーション戦略を定義します。安全で段階的な移行により、サービス継続性を保ちながら構造改善を実現します。

## 実装フェーズ詳細

### Phase 1: ビルド成果物統合

**期間**: 1-2週間  
**優先度**: High  
**リスクレベル**: Medium

#### 1.1 新しいビルド成果物構造の作成

```bash
# 新しいディレクトリ構造を作成
mkdir -p build-artifacts/{static,serverless,wordpress,docker}/{v1.8.0,latest}

# バージョン管理のためのシンボリックリンク
ln -sf v1.8.0 build-artifacts/static/latest
ln -sf v1.8.0 build-artifacts/serverless/latest
ln -sf v1.8.0 build-artifacts/wordpress/latest
ln -sf v1.8.0 build-artifacts/docker/latest
```

#### 1.2 package.jsonスクリプトの更新

```json
{
  "scripts": {
    "build:all": "npm run build:static && npm run build:serverless && npm run build:wordpress",
    "build:static": "npm run build && npm run package:static",
    "build:serverless": "npm run package:lambda && npm run package:auth",
    "build:wordpress": "npm run wp:build && npm run package:wp-themes",

    "package:static": "scripts/package-static.sh",
    "package:lambda": "scripts/package-lambda.sh",
    "package:auth": "scripts/package-auth.sh",
    "package:wp-themes": "scripts/package-wordpress.sh",

    "deploy:from-artifacts": "scripts/deploy-from-artifacts.sh"
  }
}
```

#### 1.3 パッケージングスクリプトの作成

**scripts/package-static.sh**

```bash
#!/bin/bash
VERSION=$(node -p "require('./package.json').version")
ARTIFACT_DIR="build-artifacts/static/v${VERSION}"

mkdir -p "$ARTIFACT_DIR"
cd public && zip -r "../${ARTIFACT_DIR}/lightningtalk-static-v${VERSION}.zip" . -x '*.map'
echo "Static package created: ${ARTIFACT_DIR}/lightningtalk-static-v${VERSION}.zip"
```

**scripts/package-lambda.sh**

```bash
#!/bin/bash
VERSION=$(node -p "require('./package.json').version")
ARTIFACT_DIR="build-artifacts/serverless/v${VERSION}"

mkdir -p "$ARTIFACT_DIR"

# API Lambda package
cd lambda-deploy && zip -r "../${ARTIFACT_DIR}/api-lambda-v${VERSION}.zip" . -x 'node_modules/*'

# WebSocket Lambda package
cd ../server/websocket && zip -r "../../${ARTIFACT_DIR}/websocket-lambda-v${VERSION}.zip" . -x 'node_modules/*'

echo "Lambda packages created in: ${ARTIFACT_DIR}/"
```

#### 1.4 CI/CDパイプラインの更新

**.github/workflows/ci-cd.yml** の更新:

```yaml
- name: Build and Package All Artifacts
  run: |
    npm run build:all

- name: Upload Artifacts
  uses: actions/upload-artifact@v4
  with:
    name: build-artifacts-${{ github.sha }}
    path: build-artifacts/
    retention-days: 30

- name: Deploy from Artifacts
  if: github.ref == 'refs/heads/main'
  run: npm run deploy:from-artifacts
```

### Phase 2: 環境設定統合

**期間**: 1週間  
**優先度**: High  
**リスクレベル**: Low

#### 2.1 環境設定構造の作成

```bash
mkdir -p environments/{shared,development,staging,production}
```

#### 2.2 共有設定の定義

**environments/shared/base.env**

```env
# 共通アプリケーション設定
SITE_NAME="なんでもライトニングトーク"
NODE_ENV_DEFAULT=development
PORT_DEFAULT=3000

# 機能フラグ
FEATURE_GOOGLE_AUTH=true
FEATURE_REAL_TIME_UPDATES=true
FEATURE_AI_IMAGES=false

# セキュリティ設定
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
JWT_EXPIRES_IN=24h
```

**environments/shared/security.env**

```env
# セキュリティ関連の共通設定
HELMET_ENABLED=true
CORS_ENABLED=true
CSRF_PROTECTION=true
RATE_LIMITING_ENABLED=true

# ログ設定
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true
SENSITIVE_DATA_MASKING=true
```

#### 2.3 環境固有設定

**environments/development/local.env**

```env
# ローカル開発環境
NODE_ENV=development
PORT=3000
SITE_URL=http://localhost:3000

# データベース
DATABASE_TYPE=file

# 認証（開発用）
COGNITO_REGION=ap-northeast-1
ENABLE_DEV_AUTH=true

# デバッグ
DEBUG_MODE=true
ENABLE_CLOUDWATCH_LOGS=false
```

**environments/production/production.env**

```env
# 本番環境設定
NODE_ENV=production
SITE_URL=https://xn--6wym69a.com

# データベース
DATABASE_TYPE=dynamodb
DYNAMODB_REGION=ap-northeast-1

# 監視
ENABLE_CLOUDWATCH_LOGS=true
ENABLE_CLOUDWATCH_METRICS=true
MONITORING_ENABLED=true

# セキュリティ強化
SECURITY_ENHANCED=true
WAF_ENABLED=true
```

#### 2.4 環境切り替えツール

**scripts/env-manager.js**

```javascript
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

class EnvironmentManager {
  constructor() {
    this.envDir = path.join(__dirname, '../environments');
    this.currentEnv = process.env.NODE_ENV || 'development';
  }

  loadEnvironment(environment) {
    const configs = [
      'shared/base.env',
      'shared/security.env',
      `${environment}/${environment}.env`
    ];

    let envContent = '';
    configs.forEach(config => {
      const configPath = path.join(this.envDir, config);
      if (fs.existsSync(configPath)) {
        envContent += fs.readFileSync(configPath, 'utf8') + '\n';
      }
    });

    fs.writeFileSync('.env', envContent);
    console.log(`Environment switched to: ${environment}`);
  }

  listEnvironments() {
    const environments = fs
      .readdirSync(this.envDir)
      .filter(dir => fs.statSync(path.join(this.envDir, dir)).isDirectory())
      .filter(dir => dir !== 'shared');

    return environments;
  }
}

const manager = new EnvironmentManager();
const command = process.argv[2];
const environment = process.argv[3];

switch (command) {
  case 'switch':
    if (!environment) {
      console.error('Usage: node env-manager.js switch <environment>');
      process.exit(1);
    }
    manager.loadEnvironment(environment);
    break;

  case 'list':
    console.log('Available environments:', manager.listEnvironments());
    break;

  default:
    console.log('Usage: node env-manager.js <switch|list> [environment]');
}
```

#### 2.5 package.jsonスクリプト更新

```json
{
  "scripts": {
    "env:switch": "node scripts/env-manager.js switch",
    "env:list": "node scripts/env-manager.js list",
    "env:dev": "npm run env:switch development",
    "env:staging": "npm run env:switch staging",
    "env:prod": "npm run env:switch production",

    "start:dev": "npm run env:dev && npm run dev",
    "start:staging": "npm run env:staging && npm run start",
    "start:prod": "npm run env:prod && npm run start"
  }
}
```

### Phase 3: ドキュメント階層最適化

**期間**: 2-3週間  
**優先度**: Medium  
**リスクレベル**: Low

#### 3.1 新しいドキュメント構造の作成

```bash
# 新しいドキュメント構造
mkdir -p docs-new/{quick-start,deployment,api,architecture,development,legacy}

# 番号付きクイックスタートガイド
mkdir -p docs-new/quick-start
touch docs-new/quick-start/{00-overview,01-local-development,02-docker-setup,03-first-deployment,04-troubleshooting}.md
```

#### 3.2 ドキュメント移行マップ

**scripts/docs-migration-map.json**

```json
{
  "migration_map": {
    "README.md": "docs-new/README.md",
    "CLAUDE.md": "docs-new/development/project-guide.md",
    "docs/deployment-guide.md": "docs-new/deployment/overview.md",
    "docs/api/openapi.yaml": "docs-new/api/openapi.yaml",
    "docs/project/": "docs-new/legacy/project/",

    "consolidate": {
      "quick-start/01-local-development.md": [
        "docs/development/quick-start.md",
        "docs/docker-development.md"
      ],
      "deployment/aws-serverless.md": [
        "docs/cdk-deployment.md",
        "docs/deployment/DEPLOYMENT-GUIDE.md"
      ]
    },

    "archive": ["*-REPORT.md", "*-STATUS.md", "*-VERIFICATION*.md", "PR-*.md"]
  }
}
```

#### 3.3 自動移行スクリプト

**scripts/migrate-docs.js**

```javascript
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const migrationMap = require('./docs-migration-map.json');

class DocumentationMigrator {
  constructor() {
    this.migrationMap = migrationMap.migration_map;
    this.projectRoot = path.join(__dirname, '..');
  }

  migrateDocuments() {
    // 単純な移動
    Object.entries(this.migrationMap).forEach(([source, destination]) => {
      if (typeof destination === 'string') {
        this.moveFile(source, destination);
      }
    });

    // 統合が必要なドキュメント
    Object.entries(this.migrationMap.consolidate || {}).forEach(
      ([destination, sources]) => {
        this.consolidateFiles(sources, destination);
      }
    );

    // アーカイブ
    this.archiveFiles(this.migrationMap.archive || []);
  }

  moveFile(source, destination) {
    const sourcePath = path.join(this.projectRoot, source);
    const destPath = path.join(this.projectRoot, destination);

    if (fs.existsSync(sourcePath)) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.renameSync(sourcePath, destPath);
      console.log(`Moved: ${source} → ${destination}`);
    }
  }

  consolidateFiles(sources, destination) {
    let consolidatedContent = '';

    sources.forEach(source => {
      const sourcePath = path.join(this.projectRoot, source);
      if (fs.existsSync(sourcePath)) {
        consolidatedContent += fs.readFileSync(sourcePath, 'utf8') + '\n\n';
      }
    });

    const destPath = path.join(this.projectRoot, 'docs-new', destination);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, consolidatedContent);
    console.log(`Consolidated: ${sources.join(', ')} → ${destination}`);
  }

  archiveFiles(patterns) {
    const archiveDir = path.join(this.projectRoot, 'docs-archive');
    fs.mkdirSync(archiveDir, { recursive: true });

    patterns.forEach(pattern => {
      // glob パターンに基づくファイル移動実装
      // 実装詳細は省略
    });
  }
}

const migrator = new DocumentationMigrator();
migrator.migrateDocuments();
```

#### 3.4 リンク整合性チェック

**scripts/check-doc-links.js**

```javascript
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

class LinkChecker {
  constructor() {
    this.docsDir = path.join(__dirname, '../docs-new');
    this.brokenLinks = [];
  }

  checkAllLinks() {
    const markdownFiles = this.findMarkdownFiles(this.docsDir);

    markdownFiles.forEach(file => {
      this.checkLinksInFile(file);
    });

    if (this.brokenLinks.length > 0) {
      console.error('Broken links found:');
      this.brokenLinks.forEach(link =>
        console.error(`  ${link.file}: ${link.link}`)
      );
      process.exit(1);
    } else {
      console.log('All links are valid!');
    }
  }

  findMarkdownFiles(dir) {
    // Markdown ファイル検索実装
  }

  checkLinksInFile(filePath) {
    // リンクチェック実装
  }
}

const checker = new LinkChecker();
checker.checkAllLinks();
```

### Phase 4: ソースコード構造最適化

**期間**: 3-4週間  
**優先度**: Low  
**リスクレベル**: High

#### 4.1 新しいソース構造の段階的移行

```bash
# 新しいソース構造を並行して作成
mkdir -p src-new/{apps/{web,api,admin},packages/{ui,utils,types,config},services}
```

#### 4.2 移行戦略

1. **App分離**: public/ → src-new/apps/web/
2. **API統合**: server/ → src-new/apps/api/
3. **共有ライブラリ**: 共通コンポーネント → src-new/packages/
4. **段階的テスト**: 各移行ステップでテスト実行

## マイグレーション実行計画

### 前提条件チェック

```bash
# マイグレーション前のチェックリスト
scripts/pre-migration-check.sh
```

**scripts/pre-migration-check.sh**

```bash
#!/bin/bash
echo "=== Pre-migration Check ==="

# Git status check
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Working directory is not clean. Please commit or stash changes."
  exit 1
fi

# Test suite check
npm test
if [ $? -ne 0 ]; then
  echo "❌ Tests are failing. Please fix before migration."
  exit 1
fi

# Build check
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build is failing. Please fix before migration."
  exit 1
fi

echo "✅ All pre-migration checks passed"
```

### 段階的実行

#### Week 1: Phase 1 - ビルド成果物統合

```bash
# Day 1-2: 構造作成とスクリプト開発
npm run migration:phase1:setup

# Day 3-4: CI/CD統合
npm run migration:phase1:cicd

# Day 5: テストと検証
npm run migration:phase1:verify
```

#### Week 2: Phase 2 - 環境設定統合

```bash
# Day 1-2: 環境設定構造作成
npm run migration:phase2:setup

# Day 3-4: 設定移行とテスト
npm run migration:phase2:migrate

# Day 5: 本番環境での検証
npm run migration:phase2:verify
```

#### Week 3-4: Phase 3 - ドキュメント最適化

```bash
# Week 3: ドキュメント移行
npm run migration:phase3:migrate-docs

# Week 4: リンクチェックと最適化
npm run migration:phase3:optimize
```

### ロールバック戦略

各フェーズでロールバック可能な状態を維持：

```bash
# バックアップ作成
scripts/create-migration-backup.sh

# ロールバック実行
scripts/rollback-migration.sh [phase]
```

### 検証とテスト

各フェーズ後の検証項目：

1. **機能テスト**: 全ての主要機能が動作することを確認
2. **パフォーマンステスト**: ビルド時間・実行時間の計測
3. **CI/CDテスト**: 自動デプロイメントの動作確認
4. **ドキュメントテスト**: リンク切れや内容の整合性確認

## 成功指標とモニタリング

### 定量的指標

- **ビルド時間**: 30%短縮（目標: 5分 → 3.5分）
- **CI/CD実行時間**: 25%短縮（目標: 15分 → 11分）
- **ファイル検索時間**: 50%短縮
- **新規開発者セットアップ時間**: 40%短縮

### モニタリング方法

```bash
# パフォーマンス計測
scripts/measure-performance.sh

# 開発者体験調査
scripts/developer-experience-survey.sh
```

## リスク管理

### 高リスク要因と対策

1. **ファイルパス変更によるビルド破綻**
   - 対策: 段階的移行と並行運用
   - 検証: 各ステップでの自動テスト

2. **CI/CDパイプライン障害**
   - 対策: 段階的なパイプライン更新
   - 検証: ステージング環境での事前テスト

3. **開発者の作業中断**
   - 対策: 移行期間の明確な告知と並行運用
   - 検証: 開発者フィードバックの収集

### 緊急時対応

```bash
# 緊急ロールバック
scripts/emergency-rollback.sh

# 障害調査
scripts/investigate-migration-issue.sh
```

## 次のステップ

1. **ステークホルダー承認**: 実装計画の最終承認
2. **詳細タイムライン**: 具体的な作業スケジュール作成
3. **チーム調整**: 移行期間中の作業分担調整
4. **実装開始**: Phase 1から段階的に実装開始

---

この実装・マイグレーション戦略により、Lightning Talk
Circleプロジェクトは安全かつ効率的に最適化された構造に移行できます。
