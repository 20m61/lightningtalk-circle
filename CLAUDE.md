# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

このファイルは、このリポジトリでコードを扱う際のClaude
Code（claude.ai/code）向けのガイダンスを提供します。

## プロジェクト概要

Lightning Talk
Circleは、ライトニングトークイベントを管理するための包括的なWebアプリケーションです。プロジェクトは複数のデプロイメントモードをサポートしています：

1. **静的フロントエンド**:
   `public/`内の基本的なHTML/CSS/JS（機能するイベントランディングページ）
2. **Node.jsバックエンド**: GitHub統合を備えたExpress.js
   APIサーバー（`server/`）
3. **WordPressテーマ**: Cocoonベースのカスタム子テーマ（`wordpress/`）
4. **モダンWordPressテーマ**:
   TypeScript/モノレポ構造の次世代テーマ（`lightningtalk-modern/`）
5. **AWSサーバーレス**: クラウドデプロイメント用のCDKベースインフラストラクチャ

## 必須コマンド

### メイン開発

```bash
# 開発サーバーの起動
npm run dev                    # nodemonを使用したNode.jsサーバー
npm run dev:seed              # サンプルデータ付き開発サーバー

# テスト
npm test                      # すべてのテストを実行（Jest）
npm run test:unit            # ユニットテストのみ
npm run test:integration     # 統合テストのみ
npm run test:e2e             # PlaywrightによるE2Eテスト
npm run test:coverage        # テストカバレッジレポート
npm run test:watch           # TDD用のウォッチモード

# 個別テスト実行
NODE_OPTIONS='--experimental-vm-modules' npx jest tests/unit/specific-test.test.js
NODE_OPTIONS='--experimental-vm-modules' npx jest --testNamePattern="specific test name"
NODE_OPTIONS='--experimental-vm-modules' npx jest --testPathPattern="auth"

# コード品質
npm run lint                 # ESLint（設定されている場合）
npm run format:check         # Prettierフォーマットチェック

# イシュー管理
npm run create-issues        # データからGitHubイシューを作成
npm run verify-issues        # 既存のイシューを検証
npm run workflow             # インタラクティブなワークフローCLI
npm run auto-workflow        # 自動化された開発ワークフロー
```

### Docker開発

```bash
# 適切な権限でのDocker開発
./scripts/docker-dev.sh init # 権限の初期化（初回のみ）
./scripts/docker-dev.sh up    # 開発環境の起動
./scripts/docker-dev.sh down  # すべてのコンテナを停止
./scripts/docker-dev.sh shell # アプリコンテナでシェルを開く
./scripts/docker-dev.sh logs  # アプリケーションログを表示

# 代替Dockerコマンド
./scripts/docker-dev.sh full   # WordPress付きフル環境
./scripts/docker-dev.sh modern # モダンテーマ開発
./scripts/docker-dev.sh clean  # コンテナとボリュームのクリーンアップ
```

### VS Code DevContainer開発

VS Code DevContainerを使用した開発環境のセットアップ：

```bash
# DevContainerの使用方法
1. VS Codeで「Remote-Containers」拡張機能をインストール
2. プロジェクトを開き、「Reopen in Container」を選択
3. 初回は環境構築に数分かかります

# DevContainerの特徴
- ポート3003でアプリケーションにアクセス（メイン開発環境との競合を避けるため）
- PostgreSQLとRedisが自動的に起動
- VS Code拡張機能はコンテナ内に保存される
- nodeuser（UID: 1001）として実行される
- 必要な開発ツールがすべてプリインストール済み

# DevContainerでのコマンド実行
- ターミナルはコンテナ内で実行されます
- npm run dev でアプリケーションを起動
- データベースは postgres:5432 で利用可能
- pgAdminは http://localhost:8080 でアクセス可能
```

### WordPress開発

```bash
# WordPressテーマ開発
npm run wp:dev               # BrowserSync付きGulp開発
npm run wp:build             # WordPress用本番ビルド
npm run wp:package           # デプロイメント用にテーマをビルド＆パッケージ
npm run wp:assets            # 画像処理とWebP生成

# テーマビルド
npm run build:theme          # WordPressテーマのビルド
npm run build:theme:clean    # distディレクトリのクリーン
npm run build:theme:analyze  # ビルド出力の分析
```

### モダンWordPress (lightningtalk-modern/)

```bash
# モノレポ開発
cd lightningtalk-modern && npm run dev           # すべてのサービスを同時実行
cd lightningtalk-modern && npm run build         # すべてのパッケージをビルド
cd lightningtalk-modern && npm run test          # フルテストスイート
cd lightningtalk-modern && npm run lint          # TypeScript/ESLint
cd lightningtalk-modern && npm run type-check    # TypeScriptチェック

# WordPress Docker環境
cd lightningtalk-modern && npm run wp:up         # WordPress/MySQLの起動
cd lightningtalk-modern && npm run wp:down       # コンテナの停止
cd lightningtalk-modern && npm run wp:reset      # データベースのリセット
```

### AWS CDKデプロイメント（統合スタック v2.0）

```bash
# CDKインフラストラクチャ管理
npm run cdk:install          # CDK依存関係のインストール
npm run cdk:build            # CDK TypeScriptのビルド
npm run cdk:synth            # CloudFormationテンプレートの合成
npm run cdk:diff             # デプロイメント変更の表示

# 統合スタックデプロイメント（v2.0アーキテクチャ）
npm run cdk:deploy:dev       # 開発環境（Lambda + DynamoDB + S3/CloudFront）
npm run cdk:deploy:prod      # 本番環境（ECS Fargate + ALB + WAF +監視）
npm run cdk:destroy:dev      # 開発スタックの削除

# 個別スタックデプロイメント
cd cdk && cdk deploy LightningTalkDev-dev      # 開発環境メインスタック
cd cdk && cdk deploy LightningTalkProd-prod    # 本番環境メインスタック
cd cdk && cdk deploy LightningTalkCognito-dev  # 認証スタック（開発）
cd cdk && cdk deploy LightningTalkCognito-prod # 認証スタック（本番）
cd cdk && cdk deploy LightningTalkWebSocket-dev # WebSocketスタック（開発）

# スタック統合・移行
cd cdk && node scripts/migrate-stacks.js dev --dry-run  # 移行のドライラン
cd cdk && node scripts/migrate-stacks.js prod           # 本番環境の移行実行
cd cdk && node scripts/migrate-stacks.js dev --destroy-old  # 旧スタックの削除

# デプロイメントテスト
./scripts/cdk-deployment-test.sh  # CDKデプロイメントの検証
```

### ワークフロー自動化

```bash
npm run worktree             # 並行開発用のgit worktreeをセットアップ
npm run analyze              # 実装用の指示を分析
npm run quality              # 品質ゲートスクリプトの実行
npm run env:switch           # 環境間をインタラクティブに切り替え
npm run env:backup           # 現在の環境設定をバックアップ

# UI自動化テスト
npm run ui:screenshot         # UIスクリーンショット撮影
npm run ui:test              # 自動UIテスト実行
npm run ui:test:ci           # CI/CD用UIテスト
npm run ui:test:setup        # テスト環境セットアップ
npm run ui:test:baseline     # ベースライン画像更新
npm run ui:test:report       # テストレポート生成
npm run ui:test:full         # サーバー付きフルテスト
```

### 🆕 ビルドアーティファクト管理（v1.8.0）

```bash
# 全アーティファクトのビルドとパッケージング
npm run build:all            # 全てのビルド成果物を作成

# 個別パッケージング
npm run package:static       # 静的サイトパッケージング
npm run package:lambda       # Lambda関数パッケージング
npm run package:wp-themes    # WordPressテーマパッケージング
npm run package:docker       # Dockerイメージパッケージング

# ビルド成果物の構造
build-artifacts/
├── static/v1.8.0/          # 静的サイトアーカイブ
├── lambda/v1.8.0/          # Lambda関数パッケージ
├── wordpress/v1.8.0/       # WordPressテーマパッケージ
└── docker/v1.8.0/          # Dockerイメージアーカイブ
```

### 🆕 環境設定管理（v1.8.0）

```bash
# 環境切り替え（インタラクティブ）
npm run env:switch           # 対話的に環境を選択

# 環境管理コマンド
npm run env:backup           # 現在の.envをバックアップ
npm run env:validate         # 環境設定の検証
npm run env:list            # 利用可能な環境を一覧表示

# 環境構造
environments/
├── shared/                 # 共通設定
│   ├── base.env           # 基本設定
│   ├── security.env       # セキュリティ設定
│   └── features.env       # 機能フラグ
├── development/           # 開発環境
│   ├── local.env         # ローカル開発
│   └── docker.env        # Docker開発
├── staging/              # ステージング環境
└── production/           # 本番環境
```

### 🆕 ドキュメント管理（v1.8.0）

```bash
# ドキュメント移行
npm run docs:migrate         # ドキュメントを新構造に移行
npm run docs:migrate:dry-run # 移行のドライラン（安全確認）

# リンク管理
npm run docs:check-links     # 壊れたリンクをチェック
npm run docs:check-links:fix # リンクの自動修正（可能な場合）
npm run docs:fix-broken-links # 壊れたリンクの自動修正ツール

# 新しいドキュメント構造（準備中）
docs-new/
├── quick-start/            # クイックスタートガイド
├── deployment/             # デプロイメントガイド
├── api/                    # API ドキュメント
├── architecture/           # アーキテクチャ説明
├── development/            # 開発ガイド
└── legacy/                # アーカイブドキュメント
```

### 監視とセキュリティ

```bash
# CloudWatch監視
npm run monitoring:init      # 監視サービスとCloudWatchアラームの初期化
npm run monitoring:test      # 監視接続性テスト
npm run monitoring:setup     # AWS監視インフラのセットアップ
npm run monitoring:dashboard # 監視ダッシュボードを開く

# セキュリティ設定
npm run security:setup       # 本番環境用のセキュア設定生成
```

## アーキテクチャと主要コンポーネント

### ルートレベル構造

- `public/` - 機能するイベントランディングページを含む静的フロントエンド
  - オンライン/オフライン参加調査付きイベント情報表示
  - 登録モーダルと緊急連絡先機能
  - localStorageを使用したチャットウィジェット
  - Google Maps統合
- `server/` - モジュラーアーキテクチャのExpress.jsバックエンド
- `wordpress/` - 従来のWordPress子テーマ（Cocoonベース）
- `lightningtalk-modern/` - TypeScript/モノレポのモダンWordPressテーマ
- `cdk/` - AWS CDKインフラストラクチャ・アズ・コード
- `scripts/` - 包括的な自動化とワークフローツール
- `docs/` - 詳細なプロジェクトドキュメント

### バックエンドサービス (server/)

- **EmailService**: マルチプロバイダーメールサポート（Gmail、SendGrid、AWS
  SES、SMTP、Mailgun）
- **GitHub統合**: Octokitを使用したイシュー作成と管理
- **イベント管理**: バリデーション付きイベントCRUD操作
- **参加者管理**: 登録と調査の処理
- **認証**: AWS Cognito + Google OAuth統合とJWTベース認証
- **データベース**: ファイルベースとDynamoDBストレージのデュアルサポート
- **リアルタイム**: ライブアップデート用Socket.io統合
- **監視**: CloudWatch統合とリアルタイムメトリクス収集
- **セキュリティ**: 強化されたセキュリティミドルウェアとロギング
- **APIドキュメント**: `/api/docs`のOpenAPI/Swagger

### モダンWordPressアーキテクチャ (lightningtalk-modern/)

- **モノレポ構造**: Workspacesベースの組織
- **packages/theme/**: Viteを使用したメインWordPressテーマ
- **packages/admin-panel/**: Reactベースの管理インターフェース
- **packages/components/**: Storybookを使用した共有UIコンポーネント
- **TypeScript**: パッケージ全体での完全な型安全性

### AWSインフラストラクチャ (cdk/)

- **CognitoStack**: AWS Cognito User Pool、Google OAuth統合、認証管理
- **SecretsStack**: AWS Secrets
  Manager経由ですべてのアプリケーションシークレットを管理
- **DatabaseStack**: 適切なGSIとVPC設定を持つDynamoDBテーブル
- **ApiStack**: ALB、オートスケーリング、コンテナレジストリを備えたECS Fargate
- **StaticSiteStack**: グローバルCDN配信用のS3 + CloudFront
- **MonitoringStack**: CloudWatchダッシュボードとSNSアラート
- **WafStack**: セキュリティ用Webアプリケーションファイアウォール
- **CostMonitoringStack**: 予算アラートとコスト最適化

### Dockerサービス

開発環境には以下が含まれます：

- **app**: Node.jsアプリケーションコンテナ
  - 通常開発: ポート3000
  - DevContainer: ポート3003（競合回避のため）
  - ユーザー: nodeuser (UID: 1001)
- **postgres**: PostgreSQLデータベース（開発のみ）
- **redis**: セッション/レート制限用Redisキャッシュ
- **pgadmin**: データベース管理UI

### ビルドシステム

- **Gulp**: WordPressアセット処理、SASSコンパイル、画像最適化
- **Vite**: lightningtalk-modern用モダンビルドシステム
- **Webpack**: レガシービルドサポート
- **Storybook**: コンポーネントライブラリ開発
- **Docker**: 本番最適化用マルチステージビルド

### 監視・セキュリティアーキテクチャ

#### CloudWatch統合監視システム

- **CloudWatchService** (`server/services/cloudWatchService.js`)
  - 構造化ログをCloudWatch Logsに送信
  - カスタムメトリクスをCloudWatch Metricsに送信
  - アラーム管理と作成の自動化
  - オプションAWS SDK依存関係（ローカル開発時は無効化）

- **MonitoringService** (`server/services/monitoringService.js`)
  - リアルタイムメトリクス収集（CPU、メモリ、レスポンス時間）
  - ヘルスチェックとデータベース接続監視
  - しきい値ベースアラート生成
  - WebSocketを使用したリアルタイムダッシュボード

#### セキュリティ強化システム

- **Enhanced Security Middleware** (`server/middleware/security-enhanced.js`)
  - HTTPS強制とセキュリティヘッダー拡張
  - リクエスト署名検証
  - IPアクセス制御（ホワイトリスト/ブラックリスト）
  - セキュリティイベント監視とログ記録

- **CloudWatch Middleware** (`server/middleware/cloudWatchMiddleware.js`)
  - APIリクエスト自動ログ記録
  - 認証イベント追跡
  - パフォーマンスメトリクス収集
  - セキュリティイベント自動検知

#### 監視エンドポイント

- `/api/monitoring/health` - 拡張ヘルスチェック
- `/api/monitoring/dashboard` - リアルタイムダッシュボード
- `/api/monitoring/metrics` - メトリクス取得
- `/api/monitoring/alerts` - アラート管理
- `/api/monitoring/performance` - パフォーマンス分析

## 環境設定

### 完全な環境変数 (.env)

```env
# サーバー設定
NODE_ENV=development
PORT=3000
SITE_NAME="なんでもライトニングトーク"
SITE_URL="http://localhost:3000"

# GitHub統合（イシュー自動化に必要）
GITHUB_TOKEN=your_github_token
GITHUB_OWNER=your_username
GITHUB_REPO=your_repo

# メール設定（プロバイダーを1つ選択）
EMAIL_ENABLED=false
EMAIL_FROM="noreply@lightningtalk.example.com"
EMAIL_SERVICE=gmail  # オプション: gmail, sendgrid, aws-ses, smtp, mailgun, mock

# データベース設定
DATABASE_TYPE=file  # オプション: file, dynamodb
# DynamoDB用（AWSデプロイメント）：
# AWS_REGION=us-east-1
# DYNAMODB_EVENTS_TABLE=lightningtalk-circle-prod-events
# DYNAMODB_PARTICIPANTS_TABLE=lightningtalk-circle-prod-participants
# DYNAMODB_USERS_TABLE=lightningtalk-circle-prod-users
# DYNAMODB_TALKS_TABLE=lightningtalk-circle-prod-talks

# セキュリティ設定（安全な値を生成）
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
JWT_EXPIRES_IN=24h

# CORS設定
CORS_ORIGINS=http://localhost:3000,http://localhost:8080

# 管理者ユーザー（初期セットアップ）
ADMIN_EMAIL=admin@lightningtalk.local
ADMIN_PASSWORD=ChangeThisPassword123!
ADMIN_NAME=System Administrator

# レート制限
RATE_LIMIT_WINDOW_MS=900000  # 15分
RATE_LIMIT_MAX_REQUESTS=100
REGISTRATION_LIMIT_PER_HOUR=5

# 機能フラグ
AUTO_MERGE=false
REQUIRE_REVIEW=true
REQUIRE_STATUS_CHECKS=true
SEND_REMINDER_EMAILS=true
SEND_CONFIRMATION_EMAILS=true

# 外部サービス
FEEDBACK_URL=https://docs.google.com/forms/...
GOOGLE_ANALYTICS_ID=
SENTRY_DSN=
SLACK_WEBHOOK_URL=

# AWS Cognito認証設定（本番環境） - セキュリティ強化済み
# 重要：実際の値は環境変数またはAWS Secrets Managerで管理
COGNITO_USER_POOL_ID=your-production-user-pool-id
COGNITO_CLIENT_ID=your-production-client-id
COGNITO_REGION=ap-northeast-1
COGNITO_DOMAIN=your-cognito-domain.auth.ap-northeast-1.amazoncognito.com
API_ENDPOINT=https://your-api-gateway-id.execute-api.ap-northeast-1.amazonaws.com/prod/api

# Google OAuth設定（Cognito統合用）
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=stored-in-aws-secrets-manager

# 監視とロギング設定
ENABLE_CLOUDWATCH_LOGS=true
ENABLE_CLOUDWATCH_METRICS=true
CLOUDWATCH_LOG_GROUP=/aws/lambda/lightningtalk-circle
CLOUDWATCH_NAMESPACE=LightningTalkCircle/Application
MONITORING_ENABLED=true
MONITORING_INTERVAL=30000
```

### WordPress開発

- Cocoon子テーマ開発用に設定されたGulp
- BrowserSyncプロキシ: `http://localhost:8888`（設定可能）
- 本番デプロイメント用アセット最適化

## テスト戦略

### テストフレームワーク設定

- **Jest**: ユニットおよび統合テスト
  - カバレッジ閾値: 全体80%、ファイルごと70%
  - テスト環境: nodeとjsdom
  - 外部サービス用モックサポート
- **Playwright**: E2Eテスト
  - ブラウザ: Chromium、Firefox、WebKit
  - モバイルビューポート: iPhone 12、Pixel 5
  - 失敗時のスクリーンショット
  - ビデオ録画可能

### テストの場所

- `tests/unit/` - Jestユニットテスト
- `tests/integration/` - 統合テスト
- `tests/e2e/` - Playwright E2Eテスト
- `lightningtalk-modern/tests/` - モダンテーマテスト

### テストカバレッジ要件

- 80%のカバレッジ閾値を維持
- ユニットテスト: テストスイートの70%
- 統合テスト: テストスイートの25%
- E2Eテスト: テストスイートの5%

### 特別なテスト考慮事項

#### ES Modules設定

- `NODE_OPTIONS='--experimental-vm-modules'` フラグが必要
- `jest.config.js` でES Modules対応設定

#### モッキング要件

- **express-validator**: `body`, `param`, `query`, `optional`, `isIn`,
  `isISO8601` 等のメソッドが必要
- **AWS SDK**: オプション依存関係として扱い、不存在時は警告表示
- **Cognito認証**: JWT検証とトークン管理のテスト用モック
- **logger**: 全ログレベル（info, error, warn, debug）のモックが必要

#### 既知のテスト制限

一部のテストで以下の問題が発生することがある：

- ES Modules のread-only プロパティ割り当てエラー
- aws-sdk モジュール不存在時のエラー
- express-validator の不完全なモッキング

これらは機能に影響しない技術的詳細で、重要なセキュリティテストは通過している。

## CI/CDとGitHub Actions

### ワークフロー

1. **ci-cd.yml**: メインパイプライン
   - テスト実行（ユニット、統合、E2E）
   - npm auditによるセキュリティスキャン
   - コードカバレッジレポート
   - 自動バージョニング
   - Dockerイメージビルド
   - CDKデプロイメント（mainブランチ）

2. **auto-workflow.yml**: 開発自動化
   - イシュー割り当てでトリガー
   - フィーチャーブランチ作成
   - 品質ゲート実行
   - イシューステータス更新

3. **cdk-deploy.yml**: インフラストラクチャデプロイメント
   - 環境固有のデプロイメント
   - スタック検証
   - コスト見積もり

4. **release.yml**: リリース管理
   - セマンティックバージョニング
   - 変更履歴生成
   - GitHubリリース作成

## 開発ワークフロー

### Gitワークフロー

- 並行開発用にgit worktreesを使用
- メインブランチ: プライマリ開発
- フィーチャーブランチ: worktrees経由で作成
- すべての作業はGitHubイシューで追跡
- テンプレート付き自動PR作成

### イシュー管理

- `docs/project/issues-data.json`からの自動イシュー作成
- 標準化されたラベルとテンプレート
- イシュー検証と品質ゲート
- `docs/project/`内の包括的なドキュメント

### セキュリティとパフォーマンス

- Helmet.jsセキュリティヘッダー
- APIエンドポイントのレート制限
- express-validatorによる入力検証
- CORS設定
- リフレッシュトークン付きJWT認証
- 画像最適化とWebP生成
- WCAG 2.1 AAアクセシビリティ準拠
- 本番環境でのWAF保護

## 認証システム

### AWS Cognito + Google OAuth統合

このプロジェクトではAWS Cognitoを使用したGoogle
OAuth認証システムを実装しています：

#### アーキテクチャ

- **User
  Pool**: ユーザー管理とパスワードポリシー（大文字・小文字・数字・記号必須）
- **Identity Pool**: AWS リソースへのアクセス制御
- **Google OAuth**: Google IDによるソーシャルログイン
- **JWTトークン**: セッション管理とAPI認証

#### 主要ファイル

- `cdk/lib/cognito-stack.ts` - CDKによるCognitoインフラ定義
- `public/js/auth.js` - フロントエンド認証モジュール
- `public/css/auth.css` - Google認証ボタンのスタイル
- `docs/google-oauth-setup.md` - Google OAuth設定ガイド

#### 設定要件

- Google Cloud Console でOAuth 2.0クライアント作成
- AWS Secrets Manager でGoogle Client Secret管理
- 本番環境: `https://発表.com` (xn--6wym69a.com)

#### セキュリティ機能

- JWT署名検証とトークンリフレッシュ
- CORS設定とXSS対策（DOMPurify使用）
- レート制限とHelmet.jsセキュリティヘッダー
- パスワード複雑度要件の強制

## データベース管理

### デュアルデータベースサポート

1. **ファイルベース**（開発）
   - `data/`ディレクトリ内のJSONファイル
   - シンプル、セットアップ不要
   - ローカル開発に適している

2. **DynamoDB**（本番）
   - サーバーレス、スケーラブル
   - クエリ用グローバルセカンダリインデックス
   - オンデマンド課金
   - ポイントインタイムリカバリー

### 移行

- データ移行には`scripts/migrate-to-dynamodb.js`を使用
- 移行前の自動バックアップ
- ロールバックサポート

## 本番環境とデプロイメント

### 本番環境URL

- **メインサイト**: https://発表.com (https://xn--6wym69a.com)
- **API エンドポイント**:
  https://9qyaz7n47j.execute-api.ap-northeast-1.amazonaws.com/prod/api
- **Cognito認証ドメイン**:
  lightningtalk-auth-v2.auth.ap-northeast-1.amazoncognito.com

### デプロイメント手順

1. CDKスタックのデプロイ: `npm run cdk:deploy:prod`
2. CloudFrontキャッシュの無効化（必要に応じて）
3. 認証機能のテスト確認

### 重要な注意事項

- 本番環境では国際化ドメイン名（IDN）を使用
- Cognito設定は本番固有の値を使用
- Google OAuth リダイレクトURIは本番ドメインを設定

## APIリファレンス

- OpenAPIドキュメント: `http://localhost:3000/api/docs`
- 認証: JWT Bearerトークン（Cognito発行）
- レート制限: 15分あたり100リクエスト
- エンドポイント:
  - `/api/auth/*` - 認証（Google OAuth、JWT管理）
  - `/api/events/*` - イベント管理
  - `/api/participants/*` - 登録
  - `/api/talks/*` - トーク提出
  - `/api/admin/*` - 管理機能
  - `/api/monitoring/*` - 監視とヘルスチェック

## トラブルシューティング

### 一般的な問題

1. **Docker権限**: `./scripts/docker-dev.sh init`を実行
2. **ポート競合**: .envの`PORT`を確認
3. **データベース接続**: DATABASE_TYPE設定を確認
4. **メール送信**: EMAIL_SERVICE設定を確認
5. **GitHub API制限**: 有効なGITHUB_TOKENを確認
6. **Cognito認証エラー**: Google OAuth設定とAWS Secrets Managerの確認
7. **国際化ドメイン名**: 本番環境では`xn--6wym69a.com`（発表.com）を使用
8. **CloudWatch接続エラー**: AWS認証情報とリージョン設定を確認
9. **監視メトリクス未表示**: `ENABLE_CLOUDWATCH_METRICS=true`の設定を確認

### 🆕 v1.8.0で修正された問題

1. **ES Modules エラー**
   - 問題: `ReferenceError: require is not defined in ES module scope`
   - 解決: 影響するスクリプトを`.cjs`拡張子に変更

2. **壊れたドキュメントリンク**
   - 問題: 33個のリンク切れが検出される
   - 解決: `npm run docs:fix-broken-links`で自動修正（26個修正済み）

3. **chalk依存関係エラー**
   - 問題: `TypeError: chalk.blue is not a function`
   - 解決: ANSIエスケープシーケンスを使用した独自実装

### デバッグモード

- 詳細ログには`DEBUG=lightningtalk:*`を設定
- `logs/`ディレクトリのログを確認
- 集中ログ表示には`npm run logs`を使用

## 主要な開発原則

- **自動化優先**: 繰り返しタスク用の広範なスクリプト
- **イシュー駆動開発**: すべての作業はGitHubイシューで追跡
- **マルチプラットフォームサポート**: 静的、Node.js、WordPress、AWSデプロイメント
- **型安全性**: モダンコンポーネントでのTypeScript
- **アクセシビリティ**: WCAG 2.1 AA準拠が必要
- **パフォーマンス**: 画像最適化、アセット圧縮、WebPサポート
- **セキュリティ**: AWS
  Cognito認証、入力検証、レート制限、セキュリティヘッダー、WAF、XSS対策
- **観測可能性**:
  CloudWatch統合、リアルタイム監視、構造化ログ、カスタムメトリクス
- **コスト意識**: 予算モニタリングと最適化

## AWS専用実装ポリシー

このプロジェクトはAWS専用サービス構成として開発されています：

### 制限事項

- 外部APIサービス（OpenAI、その他AI サービス）は使用しません
- サードパーティサービスとの統合は最小限に抑制（Google OAuth は除く）
- AI機能は将来的にAWSネイティブサービスで実装予定

### 推奨AWSサービス

- **AI/ML**: AWS Bedrock、AWS Rekognition、AWS Textract
- **認証**: AWS Cognito（Google OAuth統合済み）
- **ストレージ**: Amazon S3、Amazon EFS
- **データベース**: Amazon DynamoDB、Amazon RDS
- **コンピューティング**: AWS Lambda、Amazon ECS Fargate
- **監視**: Amazon CloudWatch、AWS X-Ray

### AI画像生成機能の現状

- OpenAI DALL-E統合は無効化済み
- AWS Bedrockベースの実装を計画中
- 現在はプレースホルダー実装を提供
