# Docker Development Environment Guide

Lightning Talk Circleのローカル開発環境構築ガイド

## 概要

本プロジェクトでは、環境に応じて3つの異なる開発・デプロイメント方法を提供しています：

1. **本番環境** (発表.com) - AWS CDKによるサーバーレスデプロイメント
2. **開発環境** (dev.発表.com) - developブランチ用のAWS開発環境
3. **ローカル環境** (localhost) - Docker Composeによる完全なローカル開発環境

## 環境構成

### 本番環境 (発表.com)

- **URL**: https://発表.com (https://xn--6wym69a.com)
- **インフラ**: AWS Lambda, DynamoDB, CloudFront, Cognito
- **デプロイ**: `npm run cdk:deploy:prod`
- **環境ファイル**: `.env.production`

### 開発環境 (dev.発表.com)

- **URL**: https://dev.発表.com (https://dev.xn--6wym69a.com)
- **インフラ**: AWS開発スタック（本番と同様の構成）
- **デプロイ**: `npm run cdk:deploy:dev`
- **環境ファイル**: `.env.development`

### ローカル環境 (Docker)

- **URL**: http://localhost:3000
- **インフラ**: Docker Compose（すべてのサービスをローカルで実行）
- **起動**: `./scripts/docker-env.sh start local`
- **環境ファイル**: `.env.local`

## Docker環境の構成

### 基本サービス (docker-compose.yml)

- **app**: Node.jsアプリケーション
- **postgres**: PostgreSQLデータベース
- **redis**: セッション管理・キャッシング
- **pgadmin**: データベース管理UI

### 拡張サービス (docker-compose.local.yml)

- **mailhog**: メールテスト (SMTP: 1025, UI: 8025)
- **minio**: S3互換オブジェクトストレージ (API: 9000, Console: 9001)
- **localstack**: AWSサービスシミュレーション (Gateway: 4566)
- **dynamodb-local**: DynamoDBローカル (8000)
- **adminer**: データベース管理UI (8081)
- **redis-commander**: Redis管理UI (8082)

### オプションサービス

- **wordpress**: WordPressテーマ開発 (8888)
- **prometheus**: メトリクス収集 (9090)
- **grafana**: 監視ダッシュボード (3005)
- **docs**: ドキュメントサーバー (8083)

## クイックスタート

### 1. 環境の初期化

```bash
# Docker環境の初期化
./scripts/docker-env.sh init

# 環境切り替え（インタラクティブ）
./scripts/env-switch.sh

# または直接切り替え
./scripts/env-switch.sh switch local
```

### 2. Docker環境の起動

```bash
# 基本的なローカル環境
./scripts/docker-env.sh start local

# すべてのサービスを含む完全な環境
./scripts/docker-env.sh start full

# 特定のプロファイルで起動
docker-compose -f docker-compose.yml -f docker-compose.local.yml --profile wordpress up -d
```

### 3. サービスへのアクセス

- **アプリケーション**: http://localhost:3001
- **pgAdmin**: http://localhost:8080 (admin@lightningtalk.local / admin)
- **MailHog**: http://localhost:8025
- **MinIO Console**: http://localhost:9001 (minioadmin / minioadmin)
- **Redis Commander**: http://localhost:8082 (admin / admin)
- **Adminer**: http://localhost:8081

## 環境管理スクリプト

### docker-env.sh

Docker環境を管理するためのメインスクリプト

```bash
# 使用可能なコマンド
./scripts/docker-env.sh init          # 環境初期化
./scripts/docker-env.sh start [env]   # 環境起動
./scripts/docker-env.sh stop          # 環境停止
./scripts/docker-env.sh restart       # 環境再起動
./scripts/docker-env.sh logs [service] # ログ表示
./scripts/docker-env.sh status        # ステータス確認
./scripts/docker-env.sh cleanup       # 完全クリーンアップ
```

### env-switch.sh

環境設定を切り替えるスクリプト

```bash
# インタラクティブモード
./scripts/env-switch.sh

# コマンドモード
./scripts/env-switch.sh switch local      # ローカル環境に切り替え
./scripts/env-switch.sh switch dev        # 開発環境に切り替え
./scripts/env-switch.sh current           # 現在の環境を表示
./scripts/env-switch.sh validate          # 環境設定を検証
./scripts/env-switch.sh diff local dev    # 環境間の差分表示
```

## LocalStack (AWSサービスシミュレーション)

LocalStackは以下のAWSサービスをローカルでシミュレートします：

### 自動初期化

`scripts/localstack/`内のスクリプトが自動的に実行され、以下が作成されます：

1. **DynamoDBテーブル**
   - lightningtalk-local-events
   - lightningtalk-local-participants
   - lightningtalk-local-users
   - lightningtalk-local-talks
   - lightningtalk-local-sessions

2. **S3バケット**
   - lightningtalk-local (メインストレージ)
   - lightningtalk-uploads (アップロード用)
   - lightningtalk-backups (バックアップ用)
   - lightningtalk-ai-images (AI画像用)

3. **Cognito User Pool**
   - ユーザープールとクライアントの作成
   - テストユーザー: admin@localhost / LocalAdmin123!

### LocalStack CLIの使用

```bash
# DynamoDBテーブル一覧
docker-compose exec localstack awslocal dynamodb list-tables

# S3バケット一覧
docker-compose exec localstack awslocal s3 ls

# Cognitoユーザープール一覧
docker-compose exec localstack awslocal cognito-idp list-user-pools --max-results 10
```

## データベース設定

### ファイルベース（デフォルト）

```env
DATABASE_TYPE=file
```

- `data/`ディレクトリにJSONファイルとして保存
- 設定不要で即座に使用可能

### PostgreSQL

```env
DATABASE_TYPE=postgresql
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=lightningtalk
POSTGRES_USER=lightningtalk
POSTGRES_PASSWORD=lightningtalk123
```

### DynamoDB Local

```env
DATABASE_TYPE=dynamodb
DYNAMODB_ENDPOINT=http://dynamodb-local:8000
```

## 開発ワークフロー

### 1. 機能開発

```bash
# 環境起動
./scripts/docker-env.sh start local

# アプリケーションログの確認
./scripts/docker-env.sh logs app

# コンテナ内でコマンド実行
./scripts/docker-env.sh exec app npm test
```

### 2. メール機能のテスト

- MailHogがすべてのメールをキャプチャ
- http://localhost:8025 でメールを確認

### 3. S3機能のテスト

- MinIOがS3 APIを提供
- http://localhost:9001 でファイルを管理

### 4. AWS機能のテスト

- LocalStackがAWSサービスをシミュレート
- 環境変数`USE_LOCAL_AWS=true`で自動的にLocalStackを使用

## トラブルシューティング

### ポート競合

```bash
# 使用中のポートを確認
lsof -i :3000
lsof -i :5432

# .env.localでポートを変更
PORT=3002
```

### 権限エラー

```bash
# 権限を修正
./scripts/docker-env.sh init

# または手動で
docker-compose -f docker-compose.local.yml --profile init run --rm init-permissions
```

### コンテナが起動しない

```bash
# ログを確認
docker-compose logs app

# コンテナを再構築
docker-compose build --no-cache app
docker-compose up -d app
```

### LocalStackの問題

```bash
# LocalStackを再起動
docker-compose restart localstack

# リソースを手動で作成
docker-compose exec localstack /docker-entrypoint-initaws.d/01-create-tables.sh
```

## ベストプラクティス

1. **環境の分離**
   - ローカル開発には必ず`.env.local`を使用
   - 本番の認証情報をローカル環境に含めない

2. **データの永続化**
   - 重要なデータは`volumes`で永続化
   - 定期的にバックアップ

3. **リソース管理**
   - 使用しないサービスはプロファイルで無効化
   - `docker system prune`で定期的にクリーンアップ

4. **デバッグ**
   - Node.jsデバッガーはポート9229で利用可能
   - VS Codeのリモートコンテナ機能を活用

## 関連ドキュメント

- [メイン README](../README.md)
- [CLAUDE.md](../CLAUDE.md) - AI開発アシスタント向けガイド
- [AWS CDKデプロイメント](./cdk-deployment.md)
- [環境変数リファレンス](./guides/environment-variables.md)
