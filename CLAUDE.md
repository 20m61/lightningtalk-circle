# CLAUDE.md

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

### AWS CDKデプロイメント

```bash
# CDKインフラストラクチャ管理
npm run cdk:install          # CDK依存関係のインストール
npm run cdk:build            # CDK TypeScriptのビルド
npm run cdk:synth            # CloudFormationテンプレートの合成
npm run cdk:diff             # デプロイメント変更の表示
npm run cdk:deploy:dev       # 開発環境のデプロイ
npm run cdk:deploy:staging   # ステージング環境のデプロイ
npm run cdk:deploy:prod      # 本番環境のデプロイ
npm run cdk:destroy:dev      # 開発スタックの削除

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
- **認証**: リフレッシュトークン付きJWTベース認証
- **データベース**: ファイルベースとDynamoDBストレージのデュアルサポート
- **リアルタイム**: ライブアップデート用Socket.io統合
- **APIドキュメント**: `/api/docs`のOpenAPI/Swagger

### モダンWordPressアーキテクチャ (lightningtalk-modern/)

- **モノレポ構造**: Workspacesベースの組織
- **packages/theme/**: Viteを使用したメインWordPressテーマ
- **packages/admin-panel/**: Reactベースの管理インターフェース
- **packages/components/**: Storybookを使用した共有UIコンポーネント
- **TypeScript**: パッケージ全体での完全な型安全性

### AWSインフラストラクチャ (cdk/)

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
- **postgres**: PostgreSQLデータベース（開発のみ）
- **redis**: セッション/レート制限用Redisキャッシュ
- **pgadmin**: データベース管理UI

### ビルドシステム

- **Gulp**: WordPressアセット処理、SASSコンパイル、画像最適化
- **Vite**: lightningtalk-modern用モダンビルドシステム
- **Webpack**: レガシービルドサポート
- **Storybook**: コンポーネントライブラリ開発
- **Docker**: 本番最適化用マルチステージビルド

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

## APIリファレンス

- OpenAPIドキュメント: `http://localhost:3000/api/docs`
- 認証: JWT Bearerトークン
- レート制限: 15分あたり100リクエスト
- エンドポイント:
  - `/api/auth/*` - 認証
  - `/api/events/*` - イベント管理
  - `/api/participants/*` - 登録
  - `/api/talks/*` - トーク提出
  - `/api/admin/*` - 管理機能

## トラブルシューティング

### 一般的な問題

1. **Docker権限**: `./scripts/docker-dev.sh init`を実行
2. **ポート競合**: .envの`PORT`を確認
3. **データベース接続**: DATABASE_TYPE設定を確認
4. **メール送信**: EMAIL_SERVICE設定を確認
5. **GitHub API制限**: 有効なGITHUB_TOKENを確認

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
- **セキュリティ**: 入力検証、レート制限、セキュリティヘッダー、WAF
- **観測可能性**: 包括的なモニタリングとアラート
- **コスト意識**: 予算モニタリングと最適化
